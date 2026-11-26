"use server";

import { z } from "zod";
import { readEmailSettings } from "@/kit/emailSettings";
import { lastEmail, mailReady, sendMail } from "@/kit/mailer";
import { createLimiter, waitWords } from "@/kit/rateLimit";
import { err, ok, type Result } from "@/kit/result";
import { canSave } from "@/kit/session";
import { alertWords, customerWords, type ForCustomer } from "./notify";
import type { Booking } from "./schema";
import { readData } from "./store";

// Every booking email, sent as a sample with a made-up booking, to addresses the owner types: to see how they look and whether
// they arrive. Owner only, a few at a time, and each is marked as a test.
const tries = createLimiter({ max: 3, windowMs: 10 * 60_000 });
const addresses = z.array(z.email().max(120)).min(1, "Type an email address.").max(3, "Up to 3 addresses at a time.");
const pause = () => new Promise((done) => setTimeout(done, 600)); // email services refuse a burst

export async function sendSamples(typed: string): Promise<Result<{ lines: string[] }>> {
  if (!(await canSave())) return err("Only the owner can send tests.");
  if (!mailReady()) return err("Email is not connected yet.");
  const list = addresses.safeParse([...new Set(String(typed).slice(0, 400).split(/[\s,;]+/).filter(Boolean).map((a) => a.toLowerCase()))]);
  if (!list.success) return err(list.error.issues[0]?.message ?? "Check the addresses.");
  const limit = tries.hit("owner");
  if (!limit.allowed) return err(`Please wait ${waitWords(limit.retryAfterSeconds)} before sending tests again.`);

  const [{ settings }, email] = await Promise.all([readData(), readEmailSettings()]);
  const soon = new Date(Date.now() + 86_400_000).toISOString();
  const booking = { id: "7e57ab000000", customerName: "Maria (test)", phone: "0900 000 0000", eventType: "Sculpt", guests: 1, startsAt: soon, deposit: "waiting", depositAmount: 35_000, notes: "This is a test." } as Booking;
  const link = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  const samples = [
    alertWords("booked", booking, settings.zone, link),
    alertWords("receipt", booking, settings.zone, link),
    ...(["received", "confirmed", "cancelled", "reminder"] as ForCustomer[]).map((what) => customerWords(what, what === "received" ? booking : { ...booking, deposit: "paid" }, settings)),
  ];

  const lines: string[] = [];
  for (const to of list.data) {
    let sent = 0;
    for (const s of samples) {
      const r = await sendMail({ to, subject: `[Test] ${s.subject}`, text: s.text }, email);
      if (!r.ok) break; // refused once means refused for the rest of this address
      sent++;
      await pause();
    }
    const why = sent < samples.length ? ((await lastEmail())?.why ?? "") : "";
    lines.push(sent === samples.length ? `${to}: all ${sent} sent. Check the inbox and spam.` : `${to}: ${sent} of ${samples.length} sent. ${why || "The email service refused it. Without Gmail or your own domain, only your Resend account's address receives."}`);
  }
  return ok({ lines });
}
