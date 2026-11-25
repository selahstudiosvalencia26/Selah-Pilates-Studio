import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { can, permissionsOf } from "@/kit/permissions";
import { busyRanges, canMove, clashOn, dayOverview, findClash, freeWindows, hoursOf, occurrencesOn, permissionFor, spotsLeft, startTimes, statusWords, toSlots, whenProblem } from "./rules";
import { DEFAULT_SETTINGS, type Fields, type Settings } from "./schema";
import { addBooking, bookClass, cancelBooking, confirmBooking, declineBooking, editBooking, finishBooking, recordDeposit, removeBooking, restoreBooking, saveSettings } from "./service";
import { readData, withData } from "./store";
import { localParts, zonedToUtc } from "./time";

// Today in these tests is Monday 23 Nov 2026, noon in Manila.
const NOW = new Date("2026-11-23T04:00:00Z");
const Z = "Asia/Manila";

const fields = (over: Partial<Fields> = {}): Fields => ({ customerName: "Ana Cruz", phone: "0917 123 4567", email: "ana@example.com", eventType: "Birthday", guests: 30, date: "2026-12-05", start: "18:00", end: "20:00", notes: "", ...over });
// Most tests follow the "ask after confirming" way; asking at once has its own test below.
const settings = (over: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, depositWhen: "confirm", holdWhilePaying: false, ...over });
const deposit = { amount: 500_000, method: "gcash" as const, paidOn: "2026-11-24" };
// Settings as an install would have left them, including the kind of booking, which saving settings can never change.
const installed = (s: Settings) => withData((data) => void (data.settings = s));

// Every test runs in its own empty folder (also as the working folder), so the real dashboard it sits in, with its own install answers in setup/,
// can never change what a test sees.
let dir: string;
let home: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "booking-"));
  process.env.BOOKING_DATA_DIR = dir;
  home = process.cwd();
  process.chdir(dir);
  await withData((data) => void (data.settings = settings()));
});
afterEach(async () => {
  process.chdir(home);
  delete process.env.BOOKING_DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

const all = async () => (await readData()).bookings;
const one = async (id: string) => (await all()).find((b) => b.id === id)!;
const asked = async (over: Partial<Fields> = {}) => (await addBooking(fields(over), "public", NOW)).id;
// A confirmed booking: asked, confirmed (waiting for deposit), deposit recorded.
const held = async (over: Partial<Fields> = {}) => {
  const id = await asked(over);
  await confirmBooking(id, "requested", NOW);
  await recordDeposit(id, "requested", deposit, NOW);
  return id;
};

describe("time", () => {
  it("stores Manila wall time as UTC and reads it back", () => {
    expect(zonedToUtc("2026-12-05", "18:00", Z)).toBe("2026-12-05T10:00:00.000Z");
    expect(localParts("2026-12-05T10:00:00.000Z", Z)).toEqual({ date: "2026-12-05", time: "18:00", weekday: "sat" });
  });
  it("keeps a booking made at 11 PM Manila on the right day", () => {
    const iso = zonedToUtc("2026-12-05", "23:00", Z);
    expect(iso).toBe("2026-12-05T15:00:00.000Z");
    expect(localParts(iso, Z).date).toBe("2026-12-05");
  });
});

describe("what the venue accepts", () => {
  const s = settings({ closedDates: ["2026-12-25"], hours: { ...DEFAULT_SETTINGS.hours, sun: "closed" } });
  const w = { date: "2026-12-05", start: "18:00", end: "20:00", guests: 30 };
  it("accepts a normal request", () => expect(whenProblem(s, w, "2026-11-23", false)).toBeNull());
  it("refuses a date that is too soon", () => expect(whenProblem(s, { ...w, date: "2026-11-24" }, "2026-11-23", false)).toMatch(/at least 2 days/));
  it("refuses closed days and closed dates", () => {
    expect(whenProblem(s, { ...w, date: "2026-12-06" }, "2026-11-23", false)).toBe("We are closed that day."); // a Sunday
    expect(whenProblem(s, { ...w, date: "2026-12-25" }, "2026-11-23", false)).toBe("We are closed that day.");
  });
  it("refuses a time outside opening hours, and says the hours", () => expect(whenProblem(s, { ...w, end: "23:00" }, "2026-11-23", false)).toBe("We are open 9:00 AM to 9:00 PM that day."));
  it("refuses too many guests and a backwards time, even for staff", () => {
    expect(whenProblem(s, { ...w, guests: 80 }, "2026-11-23", true)).toMatch(/up to 50/);
    expect(whenProblem(s, { ...w, start: "20:00", end: "19:00" }, "2026-11-23", true)).toMatch(/end after/);
  });
  it("lets staff add a booking outside the lead time and hours", () => expect(whenProblem(s, { ...w, date: "2026-11-24", end: "23:00" }, "2026-11-23", true)).toBeNull());
});

describe("steps and who may take them", () => {
  it("never goes backwards", () => {
    expect(canMove("done", "confirm")).toBe(false);
    expect(canMove("cancelled", "finish")).toBe(false);
    expect(canMove("requested", "finish")).toBe(false);
    expect(canMove("confirmed", "finish")).toBe(true);
  });
  it("staff cannot confirm, a manager can", () => {
    const staff = permissionsOf([["booking.view", "booking.edit"]]);
    const manager = permissionsOf([["booking.view", "booking.edit", "booking.approve"]]);
    expect(can(staff, permissionFor("confirm", "requested"))).toBe(false);
    expect(can(manager, permissionFor("confirm", "requested"))).toBe(true);
    expect(can(staff, permissionFor("cancel", "requested"))).toBe(true);
    expect(can(staff, permissionFor("cancel", "confirmed"))).toBe(false); // cancelling a held date needs approval
  });
});

describe("the venue calendar", () => {
  it("lets touching bookings sit side by side but not overlap", async () => {
    await held({ start: "10:00", end: "12:00" });
    const list = await all();
    expect(findClash(list, zonedToUtc("2026-12-05", "12:00", Z), zonedToUtc("2026-12-05", "14:00", Z))).toBeNull();
    expect(findClash(list, zonedToUtc("2026-12-05", "11:00", Z), zonedToUtc("2026-12-05", "13:00", Z))).not.toBeNull();
  });
  it("shows only confirmed times as busy, with no details", async () => {
    await held({ start: "10:00", end: "12:00" });
    await asked({ date: "2026-12-06", phone: "0918 000 0000" }); // only a request
    const busy = busyRanges(await all(), "2026-12-01T00:00:00Z", "2026-12-31T00:00:00Z");
    expect(busy).toEqual([{ start: "2026-12-05T02:00:00.000Z", end: "2026-12-05T04:00:00.000Z" }]);
  });
  it("lists the open stretches left in a day, for the time picker", async () => {
    await held({ start: "12:00", end: "15:00" });
    const free = freeWindows(DEFAULT_SETTINGS, await all(), "2026-12-05");
    expect(free).toEqual([{ start: "09:00", end: "12:00" }, { start: "15:00", end: "21:00" }]);
    expect(startTimes({ start: "09:00", end: "11:00" }, 30)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });
});

describe("a venue request, step by step", () => {
  it("starts as a request and waits for the deposit", async () => {
    const id = await asked();
    expect(statusWords(await one(id))).toBe("New request");
    await confirmBooking(id, "requested", NOW);
    const b = await one(id);
    expect(b.status).toBe("requested");
    expect(b.deposit).toBe("waiting");
    expect(statusWords(b, NOW)).toBe("Waiting for deposit");
    expect(findClash(await all(), b.startsAt, b.endsAt)).toBeNull(); // the date is not held yet
  });
  it("locks the date only when the deposit is recorded", async () => {
    const id = await held();
    const b = await one(id);
    expect([b.status, b.deposit, b.depositAmount, b.depositMethod]).toEqual(["confirmed", "paid", 500_000, "gcash"]);
    expect(b.history.map((h) => h.what)).toContain("Deposit ₱5,000 paid by GCash. Date is held");
  });
  it("keeps the kind of booking it was installed with, whatever is saved in Settings", async () => {
    await saveSettings(settings({ mode: "classes", venue: "Changed name" }));
    const now = (await readData()).settings;
    expect(now.mode).toBe("venue"); // final: chosen at install
    expect(now.venue).toBe("Changed name"); // everything else saves as usual
  });
  it("confirms at once when no deposit is needed", async () => {
    await saveSettings(settings({ depositRequired: false }));
    const id = await asked();
    await confirmBooking(id, "requested", NOW);
    expect((await one(id)).status).toBe("confirmed");
  });
  it("refuses the second of two bookings for the same time", async () => {
    await held();
    await expect(asked({ phone: "0918 555 1234", start: "19:00", end: "21:00" })).rejects.toThrow(/just taken/); // a customer cannot ask
    const { id: second } = await addBooking(fields({ phone: "0918 555 1234", start: "19:00", end: "21:00" }), "staff", NOW); // staff may
    await confirmBooking(second, "requested", NOW);
    await expect(recordDeposit(second, "requested", deposit, NOW)).rejects.toThrow(/already booked by Ana Cruz/);
    expect((await one(second)).status).toBe("requested");
  });
  it("handles two people confirming the same time at once: one wins", async () => {
    const a = await asked();
    const b = await asked({ phone: "0918 555 1234" });
    await Promise.all([confirmBooking(a, "requested", NOW), confirmBooking(b, "requested", NOW)]);
    const results = await Promise.allSettled([recordDeposit(a, "requested", deposit, NOW), recordDeposit(b, "requested", deposit, NOW)]);
    expect(results.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
  });
  it("refuses a change when someone else moved the booking first", async () => {
    const id = await held();
    await expect(confirmBooking(id, "requested", NOW)).rejects.toThrow(/Someone else/);
    await expect(declineBooking(id, "requested", "", NOW)).rejects.toThrow(/Someone else/);
  });
  it("refuses a step that is not possible", async () => {
    const id = await asked();
    await expect(finishBooking(id, "requested", NOW)).rejects.toThrow(/not possible/);
  });
  it("declines with a note", async () => {
    const id = await asked();
    await declineBooking(id, "requested", "We are fully booked.", NOW);
    const b = await one(id);
    expect([b.status, b.staffNote]).toEqual(["cancelled", "We are fully booked."]);
  });
  it("never deletes a paid deposit: it is kept or marked void", async () => {
    const kept = await held();
    await cancelBooking(kept, "confirmed", true, NOW);
    expect((await one(kept)).deposit).toBe("paid");
    const voided = await held({ phone: "0918 555 1234", start: "10:00", end: "12:00" });
    await cancelBooking(voided, "confirmed", false, NOW);
    expect((await one(voided)).deposit).toBe("void");
  });
  it("frees the date when a held booking is cancelled", async () => {
    const id = await held();
    await cancelBooking(id, "confirmed", true, NOW);
    expect(findClash(await all(), (await one(id)).startsAt, (await one(id)).endsAt)).toBeNull();
  });
  it("checks the overlap again when a held booking is changed", async () => {
    await held({ start: "10:00", end: "12:00" });
    const other = await held({ phone: "0918 555 1234", start: "13:00", end: "15:00" });
    await expect(editBooking(other, "confirmed", fields({ phone: "0918 555 1234", start: "11:00", end: "14:00" }), NOW)).rejects.toThrow(/already booked/);
    await editBooking(other, "confirmed", fields({ phone: "0918 555 1234", start: "12:00", end: "14:00" }), NOW);
  });
  it("does not save the same request twice", async () => {
    const first = await addBooking(fields(), "public", NOW);
    const again = await addBooking(fields({ phone: "09171234567" }), "public", NOW);
    expect(again).toEqual({ id: first.id, duplicate: true });
    expect(await all()).toHaveLength(1);
  });
  it("refuses a public request that breaks the rules, and saves nothing", async () => {
    await expect(addBooking(fields({ date: "2026-11-24" }), "public", NOW)).rejects.toThrow(/at least 2 days/);
    expect(await all()).toHaveLength(0);
  });
  it("marks a staff booking as added by staff", async () => {
    const { id } = await addBooking(fields({ date: "2026-11-24" }), "staff", NOW);
    expect((await one(id)).createdVia).toBe("staff");
  });
  it("deletes to the recycle bin and restores", async () => {
    const id = await asked();
    await removeBooking(id, NOW);
    expect((await one(id)).deletedAt).not.toBeNull();
    await restoreBooking(id);
    expect((await one(id)).deletedAt).toBeNull();
  });
  it("finishes a confirmed booking", async () => {
    const id = await held();
    await finishBooking(id, "confirmed", NOW);
    expect((await one(id)).status).toBe("done");
  });
});

describe("classes mode (a weekly timetable, booked at once)", () => {
  const timetable = [{ id: "abcd1234", weekday: "mon" as const, time: "09:00", minutes: 55, title: "Sculpt", instructor: "Mara", place: "Studio A", capacity: 3 }];
  const book = (over: Partial<{ phone: string; spots: number; sessionKey: string }> = {}) => bookClass({ sessionKey: "abcd1234@2026-11-30", customerName: "Lia", phone: "0917 000 1111", email: "lia@example.com", spots: 1, notes: "", ...over }, "public", NOW);

  beforeEach(async () => installed(settings({ mode: "classes", timetable })));

  it("makes the classes of a date from the timetable", () => {
    const [o] = occurrencesOn(settings({ mode: "classes", timetable }), "2026-11-30"); // a Monday
    expect([o.key, o.startsAt, o.endsAt]).toEqual(["abcd1234@2026-11-30", "2026-11-30T01:00:00.000Z", "2026-11-30T01:55:00.000Z"]);
    expect(occurrencesOn(settings({ mode: "classes", timetable }), "2026-12-01")).toEqual([]); // a Tuesday
  });
  it("confirms a spot at once", async () => {
    const { id } = await book();
    expect((await one(id)).status).toBe("confirmed");
  });
  it("counts spots and says when it is full", async () => {
    await book();
    await book({ phone: "0917 000 2222", spots: 2 });
    const [o] = occurrencesOn((await readData()).settings, "2026-11-30");
    expect(spotsLeft(await all(), o)).toBe(0);
    await expect(book({ phone: "0917 000 3333" })).rejects.toThrow(/full/);
  });
  it("says how many spots are left when a group asks for too many", async () => {
    await book();
    await expect(book({ phone: "0917 000 2222", spots: 3 })).rejects.toThrow(/Only 2 slots are left/);
  });
  it("gives a spot back when a booking is cancelled", async () => {
    const { id } = await book({ spots: 3 });
    await cancelBooking(id, "confirmed", true, NOW);
    const [o] = occurrencesOn((await readData()).settings, "2026-11-30");
    expect(spotsLeft(await all(), o)).toBe(3);
  });
  const withDeposit = () =>
    withData((data) => void (data.settings = { ...data.settings, depositRequired: true, depositKind: "fixed", depositAmount: 10_000, depositHours: 24, payAccounts: [{ id: "00000001", kind: "gcash", provider: "", name: "Studio", number: "09171234567", qr: "" }] }));

  it("holds the spot while a deposit is due, and confirms it once the money is recorded", async () => {
    await withDeposit();
    const { id } = await book({ spots: 3 });
    expect(await one(id)).toMatchObject({ status: "requested", deposit: "waiting", depositAmount: 10_000 });
    const [o] = occurrencesOn((await readData()).settings, "2026-11-30");
    expect(spotsLeft(await all(), o, true, NOW)).toBe(0);
    expect(spotsLeft(await all(), o, true, new Date(NOW.getTime() + 25 * 3_600_000))).toBe(3); // not paid in time
    await recordDeposit(id, "requested", { amount: 10_000, method: "gcash", paidOn: "2026-11-23" }, NOW);
    expect(await one(id)).toMatchObject({ status: "confirmed", deposit: "paid" });
  });
  it("asks for no deposit when there is no way to pay it", async () => {
    await withData((data) => void (data.settings = { ...data.settings, depositRequired: true, depositAmount: 10_000, payAccounts: [] }));
    const { id } = await book();
    expect((await one(id)).status).toBe("confirmed");
  });
  it("does not book the same person into the same class twice", async () => {
    const first = await book();
    expect(await book()).toEqual({ id: first.id, duplicate: true });
  });
  it("refuses a class that has started or does not exist", async () => {
    await expect(bookClass({ sessionKey: "abcd1234@2026-11-23", customerName: "Lia", phone: "0917 000 1111", email: "lia@example.com", spots: 1, notes: "" }, "public", new Date("2026-11-23T02:00:00Z"))).rejects.toThrow(/already started/);
    await expect(book({ sessionKey: "ffffffff@2026-11-30" })).rejects.toThrow(/could not find/);
  });
  it("ignores classes when working out busy venue times", async () => {
    await book();
    expect(busyRanges(await all(), "2026-11-01T00:00:00Z", "2026-12-31T00:00:00Z")).toEqual([]);
  });
});

describe("what is on a day, for staff adding a booking", () => {
  const day = async (date = "2026-12-05", s: Settings = DEFAULT_SETTINGS) => dayOverview(hoursOf(s), toSlots(await all()), date);

  it("lists what is booked or asked for that day, in time order, with who is waiting for a deposit", async () => {
    await held({ start: "14:00", end: "16:00", customerName: "Ben Reyes", phone: "0918 111 2222" });
    const waiting = await asked({ start: "09:00", end: "11:00", customerName: "Cara Lim", phone: "0919 333 4444" });
    await confirmBooking(waiting, "requested", NOW); // now waiting for its deposit
    const o = await day();
    expect(o.lines.map((l) => [l.name, l.start, l.end, l.status, l.waiting])).toEqual([
      ["Cara Lim", "09:00", "11:00", "requested", true],
      ["Ben Reyes", "14:00", "16:00", "confirmed", false],
    ]);
  });

  it("leaves out cancelled bookings, other days and class spots", async () => {
    const id = await held();
    await cancelBooking(id, "confirmed", true, NOW);
    await asked({ date: "2026-12-06", phone: "0918 555 0000" });
    expect((await day()).lines).toEqual([]);
  });

  it("shows the opening hours, and the free stretches: only confirmed bookings hold a time", async () => {
    await held({ start: "12:00", end: "15:00" });
    await asked({ start: "09:00", end: "10:00", phone: "0918 555 0000" }); // a request holds nothing
    const o = await day();
    expect(o.open).toEqual({ start: "09:00", end: "21:00" });
    expect(o.free).toEqual([{ start: "09:00", end: "12:00" }, { start: "15:00", end: "21:00" }]);
  });

  it("says why a day is closed", async () => {
    const closed = settings({ closedDates: ["2026-12-25"], hours: { ...DEFAULT_SETTINGS.hours, sun: "closed" } });
    expect(await day("2026-12-06", closed)).toMatchObject({ open: null, closedBecause: "that weekday", free: [] });
    expect(await day("2026-12-25", closed)).toMatchObject({ open: null, closedBecause: "a closed date" });
    expect(await day("2026-12-05", closed)).toMatchObject({ closedBecause: null });
  });

  it("warns when a time runs into a confirmed booking, and only then", async () => {
    await held({ start: "12:00", end: "15:00", customerName: "Ben Reyes" });
    const o = await day();
    expect(clashOn(o, "14:00", "16:00")?.name).toBe("Ben Reyes");
    expect(clashOn(o, "09:00", "12:00")).toBeNull(); // touching ends are fine
    expect(clashOn(o, "15:00", "18:00")).toBeNull();
    expect(clashOn(o, "16:00", "14:00")).toBeNull(); // not a real time yet: say nothing
    expect(clashOn(o, "", "14:00")).toBeNull();
  });

  it("does not warn about a request, nor about the booking being changed itself", async () => {
    const id = await held({ start: "12:00", end: "15:00" });
    await asked({ start: "16:00", end: "18:00", phone: "0918 555 0000" });
    const o = await day();
    expect(clashOn(o, "16:30", "17:30")).toBeNull();
    expect(clashOn(o, "13:00", "14:00", id)).toBeNull();
  });

  it("sends the screen only what it shows: no phone, email or notes", async () => {
    await held({ notes: "private note" });
    const [slot] = toSlots(await all());
    expect(Object.keys(slot).sort()).toEqual(["customerName", "deletedAt", "deposit", "endsAt", "id", "sessionKey", "startsAt", "status"]);
    expect(JSON.stringify(slot)).not.toContain("private note");
    expect(JSON.stringify(slot)).not.toContain("0917");
  });
});
