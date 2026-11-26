import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { databaseOn, readDocument, writeDocument } from "@/kit/database";
import { createLimiter, waitWords } from "@/kit/rateLimit";
import { dataDir, withData } from "./store";

// The payment screenshot a customer attaches after paying. It can show names and numbers, so it is private: kept with the secret
// key only (never in the public photo storage) and shown to signed-in staff on the booking's page. Only the person who made the
// booking can attach one: the website gets a code for that booking when it is made.
export const PROOF_SENT = "Customer sent a payment screenshot";

const MAX_CHARS = 600_000; // about 450 KB of picture
const PREFIX = "data:image/jpeg;base64,";

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "while-building-only";
export const proofCode = (id: string): string => createHmac("sha256", secret()).update(`proof:${id}`).digest("hex").slice(0, 32);

const rightCode = (id: string, code: string) => {
  const a = Buffer.from(proofCode(id));
  const b = Buffer.from(code);
  return a.length === b.length && timingSafeEqual(a, b);
};

const input = z.strictObject({
  id: z.string().regex(/^[a-f0-9]{12}$/),
  code: z.string().max(64),
  image: z.string().startsWith(PREFIX, "Choose a photo or screenshot.").max(MAX_CHARS, "That picture is too big."),
});

const file = (id: string) => join(dataDir(), `proof-${id}.json`);

async function keep(id: string, value: { image: string; at: string }) {
  if (databaseOn()) return writeDocument(`proof-${id}`, value);
  await mkdir(dataDir(), { recursive: true });
  await writeFile(`${file(id)}.tmp`, JSON.stringify(value), "utf8");
  await rename(`${file(id)}.tmp`, file(id));
}

/** The screenshot for a booking, or null. Ask only for someone allowed to see bookings. */
export async function readProof(id: string): Promise<{ image: string; at: string } | null> {
  if (!/^[a-f0-9]{12}$/.test(id)) return null;
  try {
    const saved = databaseOn() ? await readDocument(`proof-${id}`) : JSON.parse(await readFile(file(id), "utf8"));
    const found = saved as { image?: unknown; at?: unknown } | undefined;
    return typeof found?.image === "string" && found.image.startsWith(PREFIX) ? { image: found.image, at: String(found.at) } : null;
  } catch {
    return null;
  }
}

const tries = createLimiter({ max: 6, windowMs: 60 * 60_000 });

export async function attachProof(body: unknown, now: Date = new Date()): Promise<{ status: number; body: { ok: boolean; message: string } }> {
  const answer = (status: number, message: string) => ({ status, body: { ok: status === 200, message } });
  const parsed = input.safeParse(body);
  if (!parsed.success) return answer(400, parsed.error.issues[0]?.message ?? "Try again.");
  const { id, code, image } = parsed.data;
  if (!rightCode(id, code)) return answer(403, "That booking could not be found.");
  const hit = tries.hit(id, now.getTime());
  if (!hit.allowed) return answer(429, `Too many tries. Please wait ${waitWords(hit.retryAfterSeconds)}.`);
  const bytes = Buffer.from(image.slice(PREFIX.length), "base64");
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) return answer(400, "That file is not a picture we can use.");

  const waiting = await withData((data) => data.bookings.some((b) => b.id === id && b.deletedAt === null && b.deposit === "waiting"));
  if (!waiting) return answer(409, "This booking is not waiting for a payment.");
  await keep(id, { image, at: now.toISOString() });
  await withData((data) => {
    const b = data.bookings.find((x) => x.id === id);
    if (b && !b.history.some((h) => h.what === PROOF_SENT)) b.history.push({ at: now.toISOString(), what: PROOF_SENT });
  });
  return answer(200, "We got your screenshot. We will confirm your slot soon.");
}
