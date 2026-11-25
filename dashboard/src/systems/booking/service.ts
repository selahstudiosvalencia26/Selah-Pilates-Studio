import { randomBytes } from "node:crypto";
import { fail } from "@/kit/errors";
import { formatMinor } from "@/kit/money";
import { todayInZone } from "@/kit/time";
import { asTaken, canMove, findClash, findDuplicate, findOccurrence, isOverdue, spotsLeft, whenProblem, type Action } from "./rules";
import { classDeposit, depositFor, packageFor, priceFor, priceForDays } from "./pricing";
import { METHOD_NAMES, type Booking, type Fields, type Method, type Settings, type Status } from "./schema";
import { withData, type Data } from "./store";
import { datesBetween, weekdayOf, whenWords, zonedToUtc } from "./time";

// What happens to a booking, one function for each step. Each one checks the rules, then changes the data inside `withData`, so a
// refusal saves nothing. "expect" is the status the person was looking at: if someone else moved the booking meanwhile, it is
// refused instead of overwritten (docs/rules/rules.md, "Concurrency").

const CHANGED = "Someone else just changed this booking. Reload the page and try again.";

const log = (b: Booking, what: string, now: Date) => b.history.push({ at: now.toISOString(), what });

function find(data: Data, id: string, expect: Status, action: Action): Booking {
  const b = data.bookings.find((x) => x.id === id && x.deletedAt === null);
  if (!b) return fail("We could not find that booking.");
  if (b.status !== expect) return fail(CHANGED);
  if (!canMove(b.status, action)) return fail("That step is not possible for this booking.");
  return b;
}

// The confirmed booking in the way, named so staff know who to call. Nothing is saved when there is one.
function ensureFree(data: Data, startsAt: string, endsAt: string, ignoreId?: string) {
  const clash = findClash(data.bookings, startsAt, endsAt, ignoreId);
  if (clash) fail(`That time is already booked by ${clash.customerName} (${whenWords(clash.startsAt, data.settings.zone)}). Pick another time.`);
}

function times(settings: Settings, f: Fields) {
  return { startsAt: zonedToUtc(f.date, f.start, settings.zone), endsAt: zonedToUtc(f.endDate ?? f.date, f.end, settings.zone) };
}

const isSeveral = (f: Fields) => !!f.endDate && f.endDate > f.date;

// A customer booking several days takes them whole: from opening on the first day to closing on the last.
function wholeDays(s: Settings, f: Fields): Fields {
  if (!isSeveral(f)) return f;
  const first = s.hours[weekdayOf(f.date)];
  const last = s.hours[weekdayOf(f.endDate!)];
  return first === "closed" || last === "closed" ? f : { ...f, start: first.open, end: last.close };
}

// The price of what is asked for, and the package it means.
function priced(s: Settings, f: Fields) {
  if (isSeveral(f)) return { price: priceForDays(s, datesBetween(f.date, f.endDate!).length), chosen: null };
  return { price: priceFor(s, f.start, f.end, f.packageId), chosen: s.priceType === "package" ? packageFor(s, f.start, f.end, f.packageId) : null };
}

// The booking now waits for its deposit, with a time to pay when one is set.
function askDeposit(b: Booking, settings: Settings, amount: number, now: Date) {
  b.deposit = "waiting";
  b.depositAmount = amount;
  const hours = settings.depositHours;
  b.payBy = hours ? new Date(now.getTime() + hours * 3_600_000).toISOString() : undefined;
  log(b, `Asked for a ${formatMinor(amount, "PHP")} deposit`, now);
}

export const newId = () => randomBytes(6).toString("hex");

// A new booking always starts as a request. Staff adding one by hand follow the same steps afterwards.
export function addBooking(input: Fields, via: "public" | "staff", now: Date = new Date()): Promise<{ id: string; duplicate: boolean }> {
  return withData((data) => {
    const staff = via === "staff";
    const fields = staff ? input : wholeDays(data.settings, input);
    const problem = whenProblem(data.settings, fields, todayInZone(data.settings.zone, now), staff);
    if (problem) fail(problem);
    // A customer of a venue that charges by package must pick one that lasts exactly as long as the time asked for.
    const { price, chosen } = priced(data.settings, fields);
    if (!staff && !isSeveral(fields) && data.settings.priceType === "package" && !(fields.packageId && chosen)) fail("Choose a package.");
    const { startsAt, endsAt } = times(data.settings, fields);
    const same = !staff && findDuplicate(data.bookings, fields.phone, startsAt);
    if (same) return { id: same.id, duplicate: true };
    // A customer cannot ask for a time that is booked or being paid for. Staff may: they decide.
    if (!staff && findClash(asTaken(data.settings, data.bookings, now), startsAt, endsAt)) fail("That time was just taken. Please pick another.");
    const b: Booking = {
      id: newId(),
      customerName: fields.customerName,
      phone: fields.phone,
      email: fields.email,
      eventType: fields.eventType,
      guests: fields.guests,
      startsAt,
      endsAt,
      sessionKey: null,
      ...(price === undefined ? {} : { price }),
      ...(chosen ? { packageName: chosen.name } : {}),
      status: "requested",
      deposit: "none",
      depositAmount: 0,
      depositMethod: null,
      depositPaidOn: null,
      notes: fields.notes,
      staffNote: "",
      createdVia: via,
      createdAt: now.toISOString(),
      deletedAt: null,
      history: [],
    };
    log(b, staff ? "Added by staff" : "Request sent from the website", now);
    // Asked at once: the customer is shown how to pay. The date is still not held until staff record the money.
    const upfront = !staff && data.settings.depositWhen === "request" ? depositFor(data.settings, b.price) : 0;
    if (upfront > 0) askDeposit(b, data.settings, upfront, now);
    data.bookings.push(b);
    return { id: b.id, duplicate: false };
  });
}

// Classes mode: a customer books spots in one class. With no deposit it is confirmed at once, unless the class is full. With a deposit
// it waits until staff record the money.
export type ClassFields = { sessionKey: string; customerName: string; phone: string; email: string; spots: number; notes: string };

export function bookClass(input: ClassFields, via: "public" | "staff", now: Date = new Date()): Promise<{ id: string; duplicate: boolean }> {
  return withData((data) => {
    if (data.settings.mode !== "classes") return fail("Classes cannot be booked here.");
    const o = findOccurrence(data.settings, input.sessionKey);
    if (!o) return fail("We could not find that class.");
    if (via === "public" && o.startsAt <= now.toISOString()) return fail("That class has already started.");
    const same = data.bookings.find((b) => b.deletedAt === null && b.sessionKey === o.key && b.status !== "cancelled" && !isOverdue(b, now) && b.phone.replace(/\D/g, "") === input.phone.replace(/\D/g, ""));
    if (same) return { id: same.id, duplicate: true };
    const left = spotsLeft(data.bookings, o, data.settings.holdWhilePaying, now);
    if (left <= 0) fail("This class is full.");
    if (input.spots > left) fail(`Only ${left} ${left === 1 ? "slot is" : "slots are"} left in this class.`);
    const b: Booking = {
      id: newId(),
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      eventType: o.title,
      guests: input.spots,
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      sessionKey: o.key,
      ...(o.price ? { price: o.price * input.spots } : {}),
      status: "confirmed",
      deposit: "none",
      depositAmount: 0,
      depositMethod: null,
      depositPaidOn: null,
      notes: input.notes,
      staffNote: "",
      createdVia: via,
      createdAt: now.toISOString(),
      deletedAt: null,
      history: [],
    };
    log(b, via === "staff" ? "Added by staff" : "Booked from the website", now);
    // Staff adding by hand have the customer in front of them, so only a website booking waits for a deposit.
    const upfront = via === "public" ? classDeposit(data.settings, b.price) : 0;
    if (upfront > 0) {
      b.status = "requested";
      askDeposit(b, data.settings, upfront, now);
    }
    data.bookings.push(b);
    return { id: b.id, duplicate: false };
  });
}

export function editBooking(id: string, expect: Status, fields: Fields, now: Date = new Date()): Promise<void> {
  return withData((data) => {
    const b = find(data, id, expect, "edit");
    if (b.sessionKey) return fail("A class booking cannot be edited. Cancel it and book again.");
    const problem = whenProblem(data.settings, fields, todayInZone(data.settings.zone, now), true);
    if (problem) fail(problem);
    const { startsAt, endsAt } = times(data.settings, fields);
    if (b.status === "confirmed") ensureFree(data, startsAt, endsAt, b.id); // the overlap rule is checked again
    // The price is worked out again only when the time changes, so a later price change never touches this booking.
    if (startsAt !== b.startsAt || endsAt !== b.endsAt) {
      const worth = priced(data.settings, { ...fields, packageId: undefined });
      b.price = worth.price;
      b.packageName = worth.chosen?.name;
    }
    Object.assign(b, { customerName: fields.customerName, phone: fields.phone, email: fields.email, eventType: fields.eventType, guests: fields.guests, notes: fields.notes, startsAt, endsAt });
    log(b, "Details changed", now);
  });
}

// Confirm a request. With a deposit rule the date is not held yet: the customer is asked for the deposit and the booking waits.
export function confirmBooking(id: string, expect: Status, now: Date = new Date()): Promise<void> {
  return withData((data) => {
    const b = find(data, id, expect, "confirm");
    if (b.deposit === "waiting") return fail("This request is already waiting for its deposit.");
    const deposit = depositFor(data.settings, b.price);
    if (deposit > 0) {
      askDeposit(b, data.settings, deposit, now);
      return;
    }
    ensureFree(data, b.startsAt, b.endsAt, b.id);
    b.status = "confirmed";
    log(b, "Confirmed", now);
  });
}

export function declineBooking(id: string, expect: Status, note: string, now: Date = new Date()): Promise<void> {
  return withData((data) => {
    const b = find(data, id, expect, "decline");
    b.status = "cancelled";
    b.deposit = "none";
    b.staffNote = note;
    log(b, note ? `Declined: ${note}` : "Declined", now);
  });
}

// A class that filled up with paid bookings cannot take one more.
function ensureSpots(data: Data, b: Booking) {
  const o = findOccurrence(data.settings, b.sessionKey!);
  const paid = data.bookings.filter((x) => x.id !== b.id && x.deletedAt === null && x.sessionKey === b.sessionKey && (x.status === "confirmed" || x.status === "done"));
  if (o && paid.reduce((n, x) => n + x.guests, 0) + b.guests > o.capacity) fail("This class is now full. Offer another time or return the money.");
}

// The deposit arrived. This is what locks the date, so the overlap rule is checked here.
export function recordDeposit(id: string, expect: Status, input: { amount: number; method: Method; paidOn: string }, now: Date = new Date()): Promise<void> {
  return withData((data) => {
    const b = find(data, id, expect, "recordDeposit");
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) fail("Enter the amount that was paid.");
    if (b.sessionKey) ensureSpots(data, b);
    else ensureFree(data, b.startsAt, b.endsAt, b.id);
    Object.assign(b, { status: "confirmed", deposit: "paid", depositAmount: input.amount, depositMethod: input.method, depositPaidOn: input.paidOn });
    log(b, `Deposit ${formatMinor(input.amount, "PHP")} paid by ${METHOD_NAMES[input.method]}. ${b.sessionKey ? "Slot is confirmed" : "Date is held"}`, now);
  });
}

// A paid deposit is never deleted: it is kept, or marked void. Staff choose.
export function cancelBooking(id: string, expect: Status, keepDeposit: boolean, now: Date = new Date()): Promise<void> {
  return withData((data) => {
    const b = find(data, id, expect, "cancel");
    if (b.deposit === "paid" && !keepDeposit) b.deposit = "void";
    else if (b.deposit === "waiting") b.deposit = "none";
    b.status = "cancelled";
    log(b, b.deposit === "paid" ? "Cancelled, deposit kept" : b.deposit === "void" ? "Cancelled, deposit voided" : "Cancelled", now);
  });
}

export function finishBooking(id: string, expect: Status, now: Date = new Date()): Promise<void> {
  return withData((data) => {
    const b = find(data, id, expect, "finish");
    b.status = "done";
    log(b, "Marked done", now);
  });
}

// Delete goes to the recycle bin (a date stamp), never away. Restore puts it back.
export function removeBooking(id: string, now: Date = new Date()): Promise<void> {
  return withData((data) => {
    const b = data.bookings.find((x) => x.id === id && x.deletedAt === null);
    if (!b) return fail("We could not find that booking.");
    b.deletedAt = now.toISOString();
  });
}

export function restoreBooking(id: string): Promise<void> {
  return withData((data) => {
    const b = data.bookings.find((x) => x.id === id && x.deletedAt !== null);
    if (!b) return fail("We could not find that booking.");
    if (b.status === "confirmed") ensureFree(data, b.startsAt, b.endsAt, b.id);
    b.deletedAt = null;
  });
}

// The kind of booking (a venue or classes) is chosen when the system is installed and is final: saving settings never changes it, whatever
// is sent. To change it, install the system again with `mdash install booking --overwrite`.
export function saveSettings(settings: Settings): Promise<void> {
  return withData((data) => {
    data.settings = { ...settings, mode: data.settings.mode };
  });
}

export function saveTimetable(timetable: Settings["timetable"]): Promise<void> {
  return withData((data) => {
    data.settings = { ...data.settings, timetable };
  });
}
