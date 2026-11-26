import { callFunction, databaseOn } from "@/kit/database";
import { gmailOn, mailReady, sentByDay } from "@/kit/mailer";
import { countDays, type EmailCount, type Space } from "./count";

// The real numbers for "What can run out", asked on the server when the Systems page opens. A number that cannot be had is not
// guessed: the card then says why, or where to look.

export async function readSpace(): Promise<Space> {
  if (!databaseOn()) return { ok: false, why: "off" };
  try {
    const found = await callFunction<{ database: number; files: number }>("dashboard_usage", {});
    return { ok: true, database: Number(found.database), files: Number(found.files) };
  } catch {
    return { ok: false, why: "missing" };
  }
}

// The dashboard counts what it sends itself, so no special key is needed.
export async function readEmails(now = new Date()): Promise<EmailCount> {
  if (!mailReady()) return { ok: false, why: "off" };
  return { ok: true, ...countDays(await sentByDay(), now), via: gmailOn() ? "gmail" : "resend" };
}
