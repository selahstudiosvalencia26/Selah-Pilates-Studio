import { allowedEmails } from "@/lib/auth/config";
import { databaseOn, readDocument, writeDocument } from "./database";
import { readEmailSettings, type EmailSettings } from "./emailSettings";

// Sending email through Resend, with the key in the server's own environment. Plain words only (no HTML), so nothing a customer
// types can turn into a link or a picture in someone's inbox. Server only.
export type Sent = { ok: true } | { ok: false; why: "off" | "own-address" | "failed" };

export const mailReady = (): boolean => Boolean((process.env.RESEND_API_KEY ?? "").trim() && (process.env.EMAIL_FROM ?? "").trim());

/** Can customers be emailed? Resend's shared test address only reaches the Resend account itself, so it takes the studio's own domain. */
export const ownDomain = (): boolean => mailReady() && !(process.env.EMAIL_FROM ?? "").trim().toLowerCase().replace(/>$/, "").endsWith("@resend.dev");

/** Where studio alerts go: the address the owner typed, otherwise the first owner sign-in. */
export const studioAddress = (s: EmailSettings): string => s.staffTo || allowedEmails()[0] || "";

// What happened to the last email, kept so the owner can see it in Settings instead of an email silently never arriving.
export type LastEmail = { at: string; ok: boolean; to: string; why: string };

async function remember(what: Omit<LastEmail, "at">): Promise<void> {
  if (!databaseOn()) return;
  await writeDocument("email-last", { at: new Date().toISOString(), ...what }).catch(() => undefined);
}

export async function lastEmail(): Promise<LastEmail | null> {
  if (!databaseOn()) return null;
  const saved = (await readDocument("email-last").catch(() => undefined)) as LastEmail | undefined;
  return saved && typeof saved.at === "string" ? saved : null;
}

const oneLine = (text: string) => text.replace(/[\r\n]+/g, " ").trim();

export async function sendMail(message: { to: string; subject: string; text: string }, settings?: EmailSettings): Promise<Sent> {
  if (!mailReady() || !message.to) return { ok: false, why: "off" };
  const s = settings ?? (await readEmailSettings());
  const address = (process.env.EMAIL_FROM ?? "").trim();
  const name = oneLine(s.senderName).replace(/[<>"]/g, "");
  try {
    const answer = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${(process.env.RESEND_API_KEY ?? "").trim()}`, "Content-Type": "application/json" },
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
