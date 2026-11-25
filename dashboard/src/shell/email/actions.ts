"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changeEmailSettings, emailDetailsSchema } from "@/kit/emailSettings";
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

// No email service is connected yet, so this says so plainly and never claims that something was sent.
export async function sendTestEmail(): Promise<Result> {
  return err("Email sending is not connected yet, so nothing was sent.");
}
