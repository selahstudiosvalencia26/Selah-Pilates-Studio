import { timingSafeEqual } from "node:crypto";
import { sendReminders } from "@/systems/booking/reminders";

// Vercel calls this each morning (vercel.json, "crons") with CRON_SECRET, which only Vercel and the server know. Without that
// variable, or without the right one, nothing is done.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const right = (header: string | null): boolean => {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function GET(request: Request) {
  if (!right(request.headers.get("authorization"))) return Response.json({ ok: false }, { status: 401 });
  try {
    return Response.json({ ok: true, sent: await sendReminders() });
  } catch (e) {
    console.error("reminders failed", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false }, { status: 500 });
  }
}
