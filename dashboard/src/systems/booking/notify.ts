import { after } from "next/server";
import { isEmailOn, readEmailSettings } from "@/kit/emailSettings";
import { mailReady, sendMail, studioAddress } from "@/kit/mailer";
import { peso } from "./pricing";
import type { Booking } from "./schema";
import { whenWords } from "./time";

// Tell the studio by email: a new booking from the website, or a payment screenshot that arrived. Sent after the customer has their
// answer, so a slow or broken email never slows down or undoes a booking.
type What = "booked" | "receipt";

export function alertWords(what: What, b: Booking, zone: string, link: string): { subject: string; text: string } {
  const who = b.customerName;
  const slot = `${b.eventType}, ${whenWords(b.startsAt, zone)}`;
  const lines =
    what === "booked"
      ? [`${who} booked ${slot}.`, `Phone: ${b.phone}`, `Slots: ${b.guests}`, ...(b.deposit === "waiting" ? [`Waiting for payment: ${peso(b.depositAmount)}`] : []), ...(b.notes ? [`Their note: ${b.notes}`] : [])]
      : [`${who} sent a payment screenshot for ${slot}.`, `Check the money arrived, then press Payment received.`];
  return {
    subject: what === "booked" ? `New booking: ${who}, ${slot}` : `Receipt received: ${who}, ${slot}`,
    text: [...lines, ...(link ? ["", `Open it: ${link}/booking/${b.id}`] : [])].join("\n"),
  };
}

async function send(what: What, b: Booking, zone: string) {
  const settings = await readEmailSettings();
  if (!isEmailOn(settings, "booking", "new-request", true)) return;
  const link = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  await sendMail({ to: studioAddress(settings), ...alertWords(what, b, zone, link) }, settings);
}

export function alertStudio(what: What, b: Booking, zone: string): void {
  if (!mailReady()) return;
  const run = () => send(what, b, zone).catch((e) => console.error("studio alert failed", e instanceof Error ? e.name : "unknown"));
  try {
    after(run);
  } catch {
    void run(); // outside a request (a test)
  }
}
