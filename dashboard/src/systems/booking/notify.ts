import { after } from "next/server";
import { isEmailOn, readEmailSettings } from "@/kit/emailSettings";
import { mailReady, canEmailCustomers, sendMail, studioAddress } from "@/kit/mailer";
import { bookingRef } from "./ref";
import { formatAccountNumber } from "./accountNumber";
import { payLabel } from "./schema";
import { peso } from "./pricing";
import type { Booking, Settings } from "./schema";
import { readData } from "./store";
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
    text: [`Booking ID: ${bookingRef(b.id)}`, ...lines, ...(link ? ["", `Open it: ${link}/booking/${b.id}`] : [])].join("\n"),
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

// ---- to the customer -------------------------------------------------------------------------------------------------------------
// Nothing the customer typed (name, note) goes into these, so a made-up booking cannot be used to send someone else a message of a
// stranger's choosing: only the studio's own words, the class and the time.
export type ForCustomer = "received" | "confirmed" | "cancelled" | "reminder";
const SWITCH = { received: "request-received", confirmed: "confirmed", cancelled: "declined", reminder: "reminder" } as const;

export function customerWords(what: ForCustomer, b: Booking, settings: Pick<Settings, "zone" | "venue" | "payAccounts">): { subject: string; text: string } {
  const slot = `${b.eventType}, ${whenWords(b.startsAt, settings.zone)}`;
  const studio = settings.venue || "the studio";
  const owes = b.deposit === "waiting";
  const pay = owes
    ? [
        "",
        `To keep your slot, pay ${peso(b.depositAmount)}:`,
        ...settings.payAccounts.map((a) => `- ${payLabel(a)}: ${[formatAccountNumber(a.kind, a.number), a.name].filter(Boolean).join(", ")}`),
        "Then attach your payment screenshot on the booking page, or send it to us in a message.",
      ]
    : [];
  const lines = {
    received: [owes ? `We are holding your slot: ${slot}.` : `You are booked: ${slot}.`, ...pay],
    confirmed: [`Your slot is confirmed: ${slot}.`, "See you in class."],
    cancelled: [`Your booking was cancelled: ${slot}.`, "If this is a surprise, please message us."],
    reminder: [`A reminder: your class is tomorrow, ${slot}.`, "To cancel or reschedule, please message us."],
  }[what];
  const subject = { received: owes ? `Pay to keep your slot: ${slot}` : `You are booked: ${slot}`, confirmed: `Confirmed: ${slot}`, cancelled: `Cancelled: ${slot}`, reminder: `Tomorrow: ${slot}` }[what];
  return { subject, text: [...lines, "", `Booking ID: ${bookingRef(b.id)}`, studio].join("\n") };
}

/** Email the customer about their booking, if they gave an email and the studio can send to it. Never gets in the way. */
export function tellCustomer(what: ForCustomer, bookingId: string): void {
  if (!canEmailCustomers()) return;
  const run = async () => {
    try {
      const { bookings, settings } = await readData();
      const b = bookings.find((x) => x.id === bookingId);
      const email = await readEmailSettings();
      if (!b?.email || !isEmailOn(email, "booking", SWITCH[what], true)) return;
      await sendMail({ to: b.email, ...customerWords(what, b, settings) }, email);
    } catch (e) {
      console.error("customer email failed", e instanceof Error ? e.name : "unknown");
    }
  };
  try {
    after(run);
  } catch {
    void run();
  }
}
