import { AppError, safeMessage } from "@/kit/errors";
import { createLimiter, waitWords } from "@/kit/rateLimit";
import { todayInZone } from "@/kit/time";
import { alertStudio, tellCustomer } from "./notify";
import { proofCode } from "./proof";
import { addBooking, bookClass } from "./service";
import { formatAccountNumber } from "./accountNumber";
import { payLabel } from "./schema";
import { asTaken, freeWindows, isPendingHold, occurrencesOn, partOn, spotsLeft, startTimes } from "./rules";
import { fieldsSchema, requestSchema, type Booking, type Settings } from "./schema";
import { readData } from "./store";
import { addDays } from "./time";
import { z } from "zod";

// What a stranger on the website may ask the dashboard (docs/systems/booking/api.md). Two doors, the same for every business:
//   availability   which dates and times are open (venue mode) or which classes have spots (classes mode). Never names or details.
//   request        send a booking. A venue request waits for staff. A class booking is confirmed at once, unless the class is full.
// The website's date picker, time list and class list are built from these answers, so they look different for each client while
// the rules stay in one place.

export type Answer = { status: number; body: { ok: true; data: unknown } | { ok: false; message: string } };
const good = (data: unknown): Answer => ({ status: 200, body: { ok: true, data } });
const bad = (status: number, message: string): Answer => ({ status, body: { ok: false, message } });

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAYS_AHEAD = 90; // how far ahead a class list may look

// ---- availability --------------------------------------------------------------------------------------------------------------------

function monthDays(month: string): string[] {
  const first = `${month}-01`;
  const out: string[] = [];
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) out.push(d);
  return out;
}

// The dates in a month a customer cannot pick: too soon, closed, or no room left.
function unavailable(s: Settings, list: readonly Booking[], month: string, today: string): string[] {
  const soonest = addDays(today, s.leadDays);
  return monthDays(month).filter((d) => d < soonest || freeWindows(s, list, d).every((w) => startTimes(w, s.slotMinutes).length < 2));
}

export async function availability(query: URLSearchParams, now: Date = new Date()): Promise<Answer> {
  const { settings: s, bookings } = await readData();
  const today = todayInZone(s.zone, now);
  const taken = asTaken(s, bookings, now); // a time being paid for is not offered
  const paying = bookings.filter((b) => isPendingHold(s, b, now));
  const classShare = s.mode === "classes" && s.depositKind === "percent";
  const about = { maxDays: s.maxDays, dayPrice: s.priceType === "none" ? 0 : s.dayPrice, mode: s.mode, venue: s.venue, zone: s.zone, maxGuests: s.maxGuests, slotMinutes: s.slotMinutes, leadDays: s.leadDays, deposit: s.depositRequired && (s.mode !== "classes" || s.payAccounts.length > 0) && (classShare || (s.depositKind === "percent" && s.priceType !== "none") ? s.depositPercent : s.depositAmount) > 0 ? { amount: s.depositAmount, percent: classShare || (s.depositKind === "percent" && s.priceType !== "none") ? s.depositPercent : null, hours: s.depositHours, when: s.mode === "classes" ? ("request" as const) : s.depositWhen } : null, pricing: { type: s.priceType, hourPrice: s.priceType === "hour" ? s.hourPrice : 0, packages: s.priceType === "package" ? s.packages : [] } };

  if (s.mode === "classes") {
    const from = query.get("from") ?? today;
    const days = Math.min(Math.max(Number(query.get("days") ?? 7) || 7, 1), 31);
    if (!DATE.test(from) || from > addDays(today, DAYS_AHEAD)) return bad(400, "Choose a date in the next few months.");
    const classes = Array.from({ length: days }, (_, i) => addDays(from < today ? today : from, i))
      .flatMap((d) => occurrencesOn(s, d))
      .filter((o) => o.startsAt > now.toISOString())
      .map((o) => ({ key: o.key, title: o.title, instructor: o.instructor, place: o.place, startsAt: o.startsAt, endsAt: o.endsAt, capacity: o.capacity, spotsLeft: spotsLeft(bookings, o, s.holdWhilePaying, now), price: o.price ?? null }));
    return good({ ...about, classes });
  }

  const month = query.get("month");
  const date = query.get("date");
  if (month !== null) {
    if (!MONTH.test(month)) return bad(400, "Choose a month.");
    const days = monthDays(month);
    // `partly`: something is booked or held that day, so it cannot be part of a several-day booking. `pending`: someone is paying.
    const partly = days.filter((d) => taken.some((b) => b.deletedAt === null && b.sessionKey === null && b.status === "confirmed" && partOn(s.zone, b, d)));
    const pending = days.filter((d) => paying.some((b) => partOn(s.zone, b, d)));
    return good({ ...about, month, unavailable: unavailable(s, taken, month, today), partly, pending });
  }
  if (date !== null) {
    if (!DATE.test(date)) return bad(400, "Choose a date.");
    const open = date < addDays(today, s.leadDays) ? [] : freeWindows(s, taken, date);
    const pending = paying.flatMap((b) => partOn(s.zone, b, date) ?? []);
    return good({ ...about, date, windows: open, starts: open.flatMap((w) => startTimes(w, s.slotMinutes)), pending });
  }
  return bad(400, "Ask for a month or a date.");
}

// ---- request -------------------------------------------------------------------------------------------------------------------------

const classRequest = z.strictObject({
  sessionKey: z.string().regex(/^[a-f0-9]{8}@\d{4}-\d{2}-\d{2}$/),
  customerName: fieldsSchema.shape.customerName,
  phone: fieldsSchema.shape.phone,
  email: z.union([z.literal(""), fieldsSchema.shape.email]).default(""), // optional for a class: a phone number is enough
  spots: z.number().int().min(1, "Choose how many slots.").max(20, "Book up to 20 slots at a time."),
  notes: z.string().trim().max(500).default(""),
  website: z.string().max(200).optional(),
});

// Counts per caller and per phone number, so a bot cannot flood the staff list. In memory for now (see kit/rateLimit).
const byCaller = createLimiter({ max: 8, windowMs: 60 * 60_000 });
const byPhone = createLimiter({ max: 4, windowMs: 60 * 60_000 });

const THANKS = { venue: "We got your request. We will reply soon.", classes: "You are booked. See you in class." };

export async function request(body: unknown, caller: string, now: Date = new Date()): Promise<Answer> {
  const hit = byCaller.hit(caller, now.getTime());
  if (!hit.allowed) return bad(429, `Too many tries. Please wait ${waitWords(hit.retryAfterSeconds)}.`);
  if (typeof body !== "object" || body === null) return bad(400, "Check the details and try again.");

  const { settings } = await readData();
  const parsed = settings.mode === "classes" ? classRequest.safeParse(body) : requestSchema.safeParse(body);
  if (!parsed.success) return bad(400, parsed.error.issues[0]?.message ?? "Check the details and try again.");
  const input = parsed.data;
  // A real person never sees the hidden box. A bot fills it: say thanks and save nothing, so it learns nothing.
  if (input.website) return good({ message: THANKS[settings.mode] });
  const phone = byPhone.hit(input.phone.replace(/\D/g, ""), now.getTime());
  if (!phone.allowed) return bad(429, `Too many tries for this number. Please wait ${waitWords(phone.retryAfterSeconds)}.`);

  try {
    let id: string;
    if ("sessionKey" in input) ({ id } = await bookClass({ sessionKey: input.sessionKey, customerName: input.customerName, phone: input.phone, email: input.email, spots: input.spots, notes: input.notes }, "public", now));
    else {
      const { website: _bot, ...fields } = input;
      void _bot;
      ({ id } = await addBooking(fields, "public", now));
    }
    const data = await readData();
    const made = data.bookings.find((b) => b.id === id);
    if (made) {
      alertStudio("booked", made, data.settings.zone);
      tellCustomer("received", made.id);
    }
    // Waiting for a deposit: the customer is shown how to pay. (A venue can instead ask only after staff confirm.)
    if ((settings.mode === "classes" || data.settings.depositWhen === "request") && made?.deposit === "waiting") {
      const accounts = data.settings.payAccounts.map((a) => ({ label: payLabel(a), name: a.name, number: formatAccountNumber(a.kind, a.number), qr: a.qr }));
      return good({ message: settings.mode === "classes" ? "Your slot is on hold. Pay the deposit to keep it." : THANKS[settings.mode], pay: { amount: made.depositAmount, payBy: made.payBy ?? null, accounts, id, code: proofCode(id) } });
    }
    return good({ message: THANKS[settings.mode] });
  } catch (e) {
    if (e instanceof AppError) return bad(400, e.message);
    console.error("booking request failed");
    return bad(500, safeMessage(e));
  }
}
