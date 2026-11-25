"use server";

import { revalidatePath } from "next/cache";
import { parseAvatar } from "@/shell/account/avatar";
import { createLimiter, waitWords } from "@/kit/rateLimit";
import { err, ok, type Result } from "@/kit/result";
import { z } from "zod";
import { brandingInput } from "./branding";
import { getBranding, savePracticeBranding } from "./server";

// Save the name, the accent colour and the logo. Checked again here on the server: the screen only helps.
//  - On a live site nothing can be saved yet (nobody is signed in), so it says so. It only works while you build.
//  - The shape is strict. The name and colour use the same rules as the screen (./branding.ts).
//  - The logo is either left as it is (`keep`), removed (`null`), or a small WebP the browser drew again (./logoClient.ts). It is
//    checked by its first bytes and its size (the same check as a profile photo), never trusted because the browser sent it.
//  - A few saves every 10 minutes, so nobody can hammer it.
const saves = createLimiter({ max: 20, windowMs: 10 * 60 * 1000 });
const GENERIC = "That did not work. Try again, and if it keeps happening, tell the builder.";

const input = z.strictObject({
  name: z.unknown(),
  accent: z.unknown(),
  logo: z.union([z.literal("keep"), z.null(), z.string().max(200_000)]),
});

export async function saveBranding(raw: unknown): Promise<Result> {
  if (process.env.NODE_ENV === "production")
    return err("Saving is not connected yet.");
  const parsed = input.safeParse(raw);
  if (!parsed.success)
    return err("Something is missing. Check the form and try again.");
  const look = brandingInput.safeParse({
    name: parsed.data.name,
    accent: parsed.data.accent,
  });
  if (!look.success) return err(look.error.issues[0]?.message ?? GENERIC);

  const limit = saves.hit("owner");
  if (!limit.allowed)
    return err(
      `Too many tries. Please wait ${waitWords(limit.retryAfterSeconds)} and try again.`,
    );

  const before = await getBranding();
  let logoUrl = before.logoUrl;
  if (parsed.data.logo === null) logoUrl = null;
  else if (parsed.data.logo !== "keep") {
    const logo = parseAvatar(parsed.data.logo);
    if (!logo.ok) return err(logo.message);
    logoUrl = parsed.data.logo;
  }

  try {
    savePracticeBranding({
      name: look.data.name,
      accent: look.data.accent,
      logoUrl,
    });
    try {
      revalidatePath("/", "layout");
    } catch {
      /* outside a request (a test): nothing to refresh */
    }
    return ok(undefined);
  } catch {
    return err(GENERIC);
  }
}
