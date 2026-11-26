import nodemailer from "nodemailer";
import { allowedEmails } from "@/lib/auth/config";
import { databaseOn, readDocument, writeDocument } from "./database";
import { readEmailSettings, type EmailSettings } from "./emailSettings";

// Sending email. Two ways, both with their secrets in the server's own environment:
//  - the studio's own Gmail (GMAIL_USER and GMAIL_APP_PASSWORD): reaches anyone, no domain needed, about 500 a day;
//  - Resend (RESEND_API_KEY and EMAIL_FROM): without a domain of its own it only reaches the Resend account itself.
// Gmail wins when both are set. Plain words only (no HTML), so nothing a customer types can turn into a link or a picture in
// someone's inbox. Server only.
export type Sent = { ok: true } | { ok: false; why: "off" | "own-address" | "failed" };

const env = (name: string) => (process.env[name] ?? "").trim();
export const gmailOn = (): boolean => Boolean(env("GMAIL_USER") && env("GMAIL_APP_PASSWORD"));
const resendOn = (): boolean => Boolean(env("RESEND_API_KEY") && env("EMAIL_FROM"));
export const mailReady = (): boolean => gmailOn() || resendOn();

/** Can customers be emailed? Through Gmail, or through Resend once it sends from the studio's own domain. */
export const canEmailCustomers = (): boolean => gmailOn() || (resendOn() && !env("EMAIL_FROM").toLowerCase().replace(/>$/, "").endsWith("@resend.dev"));

/** Where studio alerts go: the address the owner typed, otherwise the first owner sign-in. */
export const studioAddress = (s: EmailSettings): string => s.staffTo || allowedEmails()[0] || "";

// What happened to the last email, kept so the owner can see it in Settings instead of an email silently never arriving.
export type LastEmail = { at: string; ok: boolean; to: string; why: string };

async function remember(what: Omit<LastEmail, "at">): Promise<void> {
  if (!databaseOn()) return;
  if (what.ok) await countOne().catch(() => undefined);
  await writeDocument("email-last", { at: new Date().toISOString(), ...what }).catch(() => undefined);
}

export async function lastEmail(): Promise<LastEmail | null> {
  if (!databaseOn()) return null;
  const saved = (await readDocument("email-last").catch(() => undefined)) as LastEmail | undefined;
  return saved && typeof saved.at === "string" ? saved : null;
}

// How many emails this dashboard sent, by day (UTC), for the Systems page. Only the last 40 days are kept.
export async function sentByDay(): Promise<Record<string, number>> {
  if (!databaseOn()) return {};
  const saved = (await readDocument("email-count").catch(() => undefined)) as { days?: Record<string, number> } | undefined;
  return saved?.days ?? {};
}

async function countOne(): Promise<void> {
  const days = await sentByDay();
  const today = new Date().toISOString().slice(0, 10);
  days[today] = (days[today] ?? 0) + 1;
  await writeDocument("email-count", { days: Object.fromEntries(Object.entries(days).sort().slice(-40)) });
}

async function viaGmail(message: { to: string; subject: string; text: string }, name: string, replyTo: string): Promise<Sent> {
  const user = env("GMAIL_USER");
  // Google shows the app password in four groups; the spaces are not part of it.
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass: env("GMAIL_APP_PASSWORD").replace(/\s+/g, "") }, connectionTimeout: 8000, socketTimeout: 10000 });
  try {
    await transport.sendMail({ from: name ? `"${name}" <${user}>` : user, to: message.to, subject: oneLine(message.subject).slice(0, 150), text: message.text, ...(replyTo ? { replyTo } : {}) });
    await remember({ ok: true, to: message.to, why: "" });
    return { ok: true };
  } catch (e) {
    const code = (e as { responseCode?: number; code?: string }).responseCode ?? (e as { code?: string }).code ?? "unknown";
    console.error("email not sent through Gmail", code);
    await remember({ ok: false, to: message.to, why: code === 535 || code === "EAUTH" ? "Gmail did not accept the address and app password." : `Gmail could not send it (${code}).` });
    return { ok: false, why: "failed" };
  }
}

const oneLine = (text: string) => text.replace(/[\r\n]+/g, " ").trim();

export async function sendMail(message: { to: string; subject: string; text: string }, settings?: EmailSettings): Promise<Sent> {
  if (!mailReady() || !message.to) return { ok: false, why: "off" };
  const s = settings ?? (await readEmailSettings());
  const name = oneLine(s.senderName).replace(/[<>"]/g, "");
  if (gmailOn()) return viaGmail(message, name, s.replyTo);
  const address = env("EMAIL_FROM");
  try {
    const answer = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: name ? `${name} <${address}>` : address,
        to: [message.to],
        subject: oneLine(message.subject).slice(0, 150),
        text: message.text,
        ...(s.replyTo ? { reply_to: s.replyTo } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (answer.ok) {
      await remember({ ok: true, to: message.to, why: "" });
      return { ok: true };
    }
    console.error("email not sent", answer.status);
    const said = ((await answer.json().catch(() => null)) as { message?: unknown } | null)?.message;
    await remember({ ok: false, to: message.to, why: `${answer.status}: ${typeof said === "string" ? said.slice(0, 300) : "no reason given"}` });
    // Without a domain of its own, Resend only delivers to the address of the Resend account.
    return { ok: false, why: answer.status === 403 ? "own-address" : "failed" };
  } catch (e) {
    console.error("email not sent", e instanceof Error ? e.name : "unknown");
    await remember({ ok: false, to: message.to, why: "Resend could not be reached." });
    return { ok: false, why: "failed" };
  }
}
