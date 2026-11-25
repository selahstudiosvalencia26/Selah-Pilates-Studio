import type { Booking, ClassEntry, Settings, Status } from "./schema";
import { addDays, clockWords, datesBetween, localParts, weekdayOf, zonedToUtc } from "./time";

// The booking rules, as plain functions with no saving and no screen, so each one is tested alone (docs/systems/booking/design.md).

export type Action = "confirm" | "decline" | "recordDeposit" | "cancel" | "finish" | "edit";

// From which statuses each step is allowed. Anything else is refused ("done" can never go back to "requested").
export const ALLOWED: Record<Action, readonly Status[]> = {
  confirm: ["requested"],
  decline: ["requested"],
  recordDeposit: ["requested"],
  cancel: ["requested", "confirmed"],
  finish: ["confirmed"],
  edit: ["requested", "confirmed"],
};

export const canMove = (from: Status, action: Action): boolean => ALLOWED[action].includes(from);

// Who may take each step. Cancelling a confirmed booking is a bigger decision than cancelling a request, so it needs approval.
export function permissionFor(action: Action, from: Status): string {
  if (action === "confirm" || action === "decline") return "booking.approve";
  if (action === "cancel" && from === "confirmed") return "booking.approve";
  return "booking.edit";
}

// The words on screen for a booking's state. A request that is waiting for its deposit says so, because that is what staff act on.
// Past its time to pay. Nothing is cancelled by itself: the money may have arrived and not been recorded yet.
export const isOverdue = (b: Pick<Booking, "status" | "deposit" | "payBy">, now: Date = new Date()): boolean =>
  b.status === "requested" && b.deposit === "waiting" && !!b.payBy && b.payBy < now.toISOString();

export function statusWords(b: Pick<Booking, "status" | "deposit" | "payBy">, now: Date = new Date()): string {
  if (isOverdue(b, now)) return "Deposit overdue";
  if (b.status === "requested") return b.deposit === "waiting" ? "Waiting for deposit" : "New request";
  return { confirmed: "Confirmed", done: "Done", cancelled: "Cancelled" }[b.status];
}

// Two time ranges overlap when each starts before the other ends. Touching ends (one ends at 6, the next starts at 6) is fine.
const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;

// The confirmed booking that already holds this time, if any. Only confirmed ones lock a date, and one being edited ignores itself.
export function findClash(list: readonly Booking[], startsAt: string, endsAt: string, ignoreId?: string): Booking | null {
  return list.find((b) => b.id !== ignoreId && b.deletedAt === null && b.sessionKey === null && b.status === "confirmed" && overlaps(b.startsAt, b.endsAt, startsAt, endsAt)) ?? null;
}

// What the public website may learn: busy times only. No names, no details.
export function busyRanges(list: readonly Booking[], from: string, to: string): { start: string; end: string }[] {
  return list
    .filter((b) => b.deletedAt === null && b.sessionKey === null && b.status === "confirmed" && overlaps(b.startsAt, b.endsAt, from, to))
    .map((b) => ({ start: b.startsAt, end: b.endsAt }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

const digits = (phone: string) => phone.replace(/\D/g, "");

// The same person sending the same request twice (a double press, a retry) is recognised and not saved again.
export const findDuplicate = (list: readonly Booking[], phone: string, startsAt: string): Booking | null =>
  list.find((b) => b.deletedAt === null && b.sessionKey === null && b.status !== "cancelled" && b.startsAt === startsAt && digits(b.phone) === digits(phone)) ?? null;

// A time someone is paying for: asked for, waiting for the deposit and not past its time to pay.
export const isPendingHold = (s: Pick<Settings, "holdWhilePaying">, b: Pick<Booking, "deletedAt" | "sessionKey" | "status" | "deposit" | "payBy">, now: Date = new Date()): boolean =>
  s.holdWhilePaying && b.deletedAt === null && b.sessionKey === null && b.status === "requested" && b.deposit === "waiting" && !isOverdue(b, now);

// The bookings as a customer must see them: a time being paid for counts as taken, like a confirmed one.
export const asTaken = (s: Pick<Settings, "holdWhilePaying">, list: readonly Booking[], now: Date = new Date()): Booking[] =>
  list.map((b) => (isPendingHold(s, b, now) ? { ...b, status: "confirmed" as const } : b));

// The part of one date that a booking covers, as clock times, or null. A booking over several days covers the nights between.
export function partOn(zone: string, b: Pick<Booking, "startsAt" | "endsAt">, date: string): { start: string; end: string } | null {
  const from = localParts(b.startsAt, zone);
  const to = localParts(b.endsAt, zone);
  if (date < from.date || date > to.date) return null;
  return { start: date === from.date ? from.time : "00:00", end: date === to.date ? to.time : "23:59" };
}

export type When = { date: string; endDate?: string; start: string; end: string; guests: number };

const longDay = (d: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

// Is this date, time and size one the venue accepts? Returns the first problem in plain words, or null. Staff adding a booking by hand
// skip the lead time and the opening hours (they know the venue and may bend them); the length and the guest limit always apply.
export function whenProblem(s: Settings, w: When, today: string, staff: boolean): string | null {
  const several = !!w.endDate && w.endDate !== w.date;
  if (several && w.endDate! < w.date) return "The last day must come after the first.";
  if (!several && w.start >= w.end) return "The event must end after it starts.";
  if (w.guests > s.maxGuests) return `We can host up to ${s.maxGuests} guests.`;
  if (staff) return null;
  if (w.date < addDays(today, s.leadDays)) return s.leadDays === 0 ? "Please pick a date that has not passed." : `Please ask at least ${s.leadDays} ${s.leadDays === 1 ? "day" : "days"} ahead.`;
  if (several) {
    const days = datesBetween(w.date, w.endDate!);
    if (s.maxDays < 2) return "Please book one day at a time.";
    if (days.length > s.maxDays) return `You can book up to ${s.maxDays} days in a row.`;
    const shut = days.find((d) => s.closedDates.includes(d) || s.hours[weekdayOf(d)] === "closed");
    return shut ? `We are closed on ${longDay(shut)}.` : null;
  }
  if (s.closedDates.includes(w.date)) return "We are closed that day.";
  const open = s.hours[weekdayOf(w.date)];
  if (open === "closed") return "We are closed that day.";
  if (w.start < open.open || w.end > open.close) return `We are open ${clockWords(open.open)} to ${clockWords(open.close)} that day.`;
  return null;
}

// ---- Venue mode: the times a customer can still pick on a date -----------------------------------------------------------------

export type Window = { start: string; end: string }; // clock times on the business's wall, "09:00" to "12:30"

// The part of a booking the day views need, and the part of the settings. Small on purpose: a screen is sent only what it shows.
export type Slot = Pick<Booking, "id" | "customerName" | "startsAt" | "endsAt" | "status" | "deposit" | "deletedAt" | "sessionKey">;
export type Hours = Pick<Settings, "zone" | "hours" | "closedDates">;

// The open stretches of a date: the day's opening hours with every confirmed booking taken out. These feed the time picker.
export function freeWindows(s: Hours, list: readonly Pick<Slot, "deletedAt" | "sessionKey" | "status" | "startsAt" | "endsAt">[], date: string): Window[] {
  const day = s.hours[weekdayOf(date)];
  if (day === "closed" || s.closedDates.includes(date)) return [];
  let free: Window[] = [{ start: day.open, end: day.close }];
  const taken = list
    .filter((b) => b.deletedAt === null && b.sessionKey === null && b.status === "confirmed")
    .flatMap((b) => partOn(s.zone, b, date) ?? [])
    .sort((a, b) => a.start.localeCompare(b.start));
  for (const t of taken) {
    free = free.flatMap((w) => {
      if (t.end <= w.start || t.start >= w.end) return [w];
      const parts: Window[] = [];
      if (t.start > w.start) parts.push({ start: w.start, end: t.start });
      if (t.end < w.end) parts.push({ start: t.end, end: w.end });
      return parts;
    });
  }
  return free;
}

// "09:00" to "10:30" every 30 minutes -> ["09:00", "09:30", "10:00"]. The last start leaves at least one step before closing.
export function startTimes(w: Window, stepMinutes: number): string[] {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const out: string[] = [];
  for (let m = toMin(w.start); m + stepMinutes <= toMin(w.end); m += stepMinutes) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
}

// ---- Classes mode: the classes of a date, from the weekly timetable ----------------------------------------------------------------

export type Occurrence = ClassEntry & { date: string; key: string; startsAt: string; endsAt: string };

const addMinutes = (iso: string, minutes: number) => new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

// Every class happening on this date, in time order. A closed date has none.
export function occurrencesOn(s: Settings, date: string): Occurrence[] {
  if (s.closedDates.includes(date)) return [];
  const weekday = weekdayOf(date);
  return s.timetable
    .filter((c) => c.weekday === weekday)
    .map((c) => {
      const startsAt = zonedToUtc(date, c.time, s.zone);
      return { ...c, date, key: `${c.id}@${date}`, startsAt, endsAt: addMinutes(startsAt, c.minutes) };
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function findOccurrence(s: Settings, key: string): Occurrence | null {
  const date = key.split("@")[1] ?? "";
  return occurrencesOn(s, date).find((o) => o.key === key) ?? null;
}

// Spots left in one class: what it holds, less the people already booked in (cancelled ones free their spot). Someone who still has to
// pay a deposit holds the spot until their time to pay ends, or not at all when holding while paying is switched off.
export const spotsLeft = (list: readonly Booking[], o: Pick<Occurrence, "key" | "capacity">, hold = true, now: Date = new Date()): number =>
  Math.max(0, o.capacity - list.filter((b) => b.deletedAt === null && b.sessionKey === o.key && b.status !== "cancelled" && !(b.status === "requested" && b.deposit === "waiting" && (!hold || isOverdue(b, now)))).reduce((n, b) => n + b.guests, 0));

// ---- What is on a day: for staff adding or changing a booking ------------------------------------------------------------------------

export type DayLine = { id: string; name: string; start: string; end: string; status: Status; waiting: boolean };
export type DayOverview = {
  open: Window | null; // the opening hours, or null when the venue is closed
  closedBecause: "that weekday" | "a closed date" | null;
  lines: DayLine[]; // everything booked or asked for that day, in time order (cancelled ones are left out)
  free: Window[]; // the open stretches no confirmed booking holds
};

export function dayOverview(s: Hours, list: readonly Slot[], date: string): DayOverview {
  const hours = s.hours[weekdayOf(date)];
  const closedDate = s.closedDates.includes(date);
  const lines = list
    .filter((b) => b.deletedAt === null && b.sessionKey === null && b.status !== "cancelled")
    .flatMap((b) => {
      const part = partOn(s.zone, b, date);
      return part ? [{ id: b.id, name: b.customerName, ...part, status: b.status, waiting: b.status === "requested" && b.deposit === "waiting" }] : [];
    })
    .sort((a, b) => a.start.localeCompare(b.start));
  return {
    open: hours === "closed" || closedDate ? null : { start: hours.open, end: hours.close },
    closedBecause: closedDate ? "a closed date" : hours === "closed" ? "that weekday" : null,
    lines,
    free: freeWindows(s, list, date),
  };
}

// The confirmed booking, if any, that a start and end on this date would run into. Staff are told before they press Add.
export function clashOn(o: DayOverview, start: string, end: string, ignoreId?: string): DayLine | null {
  if (!start || !end || start >= end) return null;
  return o.lines.find((l) => l.status === "confirmed" && l.id !== ignoreId && l.start < end && start < l.end) ?? null;
}

// What a staff screen is sent about the bookings and the hours: only the few fields it shows (no phone numbers, no emails, no notes).
export const toSlots = (list: readonly Booking[]): Slot[] =>
  list
    .filter((b) => b.deletedAt === null && b.sessionKey === null && b.status !== "cancelled")
    .map(({ id, customerName, startsAt, endsAt, status, deposit, deletedAt, sessionKey }) => ({ id, customerName, startsAt, endsAt, status, deposit, deletedAt, sessionKey }));

export const hoursOf = (s: Settings): Hours => ({ zone: s.zone, hours: s.hours, closedDates: s.closedDates });
