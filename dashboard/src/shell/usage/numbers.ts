import { callFunction, databaseOn } from "@/kit/database";
import { countEmails, type EmailCount, type Space } from "./count";

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

const PAGES = 10; // 100 each, newest first: far more than a month of a small business
const monthOf = (at: string) => new Date(at.replace(" ", "T")).toISOString().slice(0, 7);

export async function readEmails(now = new Date()): Promise<EmailCount> {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  if (!key) return { ok: false, why: "off" };
  try {
    const sent: string[] = [];
    let after = "";
    let complete = false;
    for (let page = 0; page < PAGES && !complete; page++) {
      const answer = await fetch(`https://api.resend.com/emails?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (answer.status === 401 || answer.status === 403) return { ok: false, why: "key" };
      if (!answer.ok) return { ok: false, why: "unreachable" };
      const body = (await answer.json()) as { has_more?: boolean; data?: { id: string; created_at: string }[] };
      const rows = body.data ?? [];
      sent.push(...rows.map((r) => r.created_at));
      const last = rows.at(-1);
      after = last?.id ?? "";
      // Stop once the list is finished or has gone back past this month.
      complete = !body.has_more || !last || monthOf(last.created_at) < now.toISOString().slice(0, 7);
    }
    return { ok: true, ...countEmails(sent, now), atLeast: !complete };
  } catch {
    return { ok: false, why: "unreachable" };
  }
}
