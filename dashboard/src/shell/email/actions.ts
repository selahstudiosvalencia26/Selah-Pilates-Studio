"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changeEmailSettings, emailDetailsSchema, readEmailSettings } from "@/kit/emailSettings";
import { mailReady, sendMail, studioAddress } from "@/kit/mailer";
import { createLimiter, waitWords } from "@/kit/rateLimit";
import { err, ok, type Result } from "@/kit/result";
import { canSave } from "@/kit/session";
import { loadSystems } from "@/shell/registry";

// Saving the email settings. On a live site only a signed-in owner may.
const NOT_CONNECTED = "Saving is not connected yet.";

export async function saveEmailDetails(input: unknown): Promise<Result> {
  if (!(await canSave())) return err(NOT_CONNECTED);
  const parsed = emailDetailsSchema.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Check the details and try again.");
  await changeEmailSettings((s) => void Object.assign(s, parsed.data));
  revalidatePath("/", "layout");
  return ok(undefined);
}

const switchInput = z.strictObject({ system: z.string().max(20), id: z.string().max(41), on: z.boolean() });

// Only an email a system really has, and never one that must always be sent.
export async function setEmailOn(input: unknown): Promise<Result> {
  if (!(await canSave())) return err(NOT_CONNECTED);
  const parsed = switchInput.safeParse(input);
  if (!parsed.success) return err("Reload the page and try again.");
  const { system, id, on } = parsed.data;
  const email = loadSystems().systems.find((s) => s.id === system)?.emails.find((e) => e.id === id);
  if (!email) return err("Reload the page and try again.");
  if (email.required && !on) return err("This email is always sent.");
  await changeEmailSettings((s) => void (s.switches[`${system}:${id}`] = on));
  revalidatePath("/", "layout");
  return ok(undefined);
}

// A real test to the studio's own address, saying plainly what happened.
const tests = createLimiter({ max: 5, windowMs: 10 * 60_000 });

export async function sendTestEmail(): Promise<Result<{ to: string }>> {
  if (!(await canSave())) return err("Only the owner can send a test.");
  if (!mailReady()) return err("Email is not connected yet. RESEND_API_KEY and EMAIL_FROM are needed in Vercel.");
  const settings = await readEmailSettings();
  const to = studioAddress(settings);
  if (!to) return err("Type your studio email first, then save.");
  const limit = tests.hit("owner");
  if (!limit.allowed) return err(`Please wait ${waitWords(limit.retryAfterSeconds)} before another test.`);
  const sent = await sendMail({ to, subject: "Test email from your dashboard", text: "This is a test. If you can read it, booking alerts will reach you here." }, settings);
  if (sent.ok) return ok({ to });
  return err(sent.why === "own-address" ? `Resend refused ${to}. Without your own domain it only sends to the email of your Resend account.` : "Could not send. Check the Resend key in Vercel and try again.");
}
