import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { caretAfter, formatAccountNumber } from "./accountNumber";
import { paymentMessage } from "./format";
import { availability } from "./public";
import { depositFor, priceFor } from "./pricing";
import { statusWords } from "./rules";
import { DEFAULT_SETTINGS, payAccountSchema } from "./schema";
import { addBooking, recordDeposit, saveSettings } from "./service";
import { readData } from "./store";

// The money side of bookings: prices, deposits, the ways to pay, and the settings screen that holds them.
// Every test runs in its own empty folder, so the real dashboard's saved settings can never change what a test sees.
let dir: string;
let home: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "booking-money-"));
  process.env.BOOKING_DATA_DIR = dir;
  home = process.cwd();
  process.chdir(dir);
});
afterEach(async () => {
  process.chdir(home);
  delete process.env.BOOKING_DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe("the time to pay a deposit", () => {
  it("starts when staff confirm, and shows as overdue after it without cancelling", () => {
    const b = { status: "requested", deposit: "waiting", payBy: "2020-01-01T00:00:00.000Z" } as const;
    expect(statusWords(b)).toBe("Deposit overdue");
    expect(statusWords({ ...b, payBy: "2999-01-01T00:00:00.000Z" })).toBe("Waiting for deposit");
    expect(statusWords({ ...b, payBy: undefined })).toBe("Waiting for deposit");
  });
});

describe("ways to pay", () => {
  const gcash = { id: "aaaaaaaa", kind: "gcash", provider: "", name: "Dana Cruz", number: "0917 123 4567", qr: "" } as const;
  const bank = { id: "bbbbbbbb", kind: "bank", provider: "BPI", name: "Dana Cruz", number: "1234-5678-90", qr: "" } as const;
  it("needs a name, a number or picture, the bank's name, and only a real picture", () => {
    expect(payAccountSchema.safeParse(gcash).success).toBe(true);
    expect(payAccountSchema.safeParse(bank).success).toBe(true);
    for (const bad of [{ ...gcash, number: "12345" }, { ...gcash, number: "" }, { ...bank, provider: "" }, { ...gcash, name: "" }]) expect(payAccountSchema.safeParse(bad).success).toBe(false);
    expect(payAccountSchema.safeParse({ ...gcash, qr: "data:image/png;base64,iVBORw0KGgoAAAA=" }).success).toBe(true);
    for (const qr of ["https://example.com/qr.png", "data:image/svg+xml;base64,PHN2Zz4=", "data:image/png;base64,PHNjcmlwdD4="]) expect(payAccountSchema.safeParse({ ...gcash, qr }).success).toBe(false);
  });
  it("writes every way to pay in the message", () => {
    const b = { customerName: "Ana", startsAt: "2026-12-05T10:00:00.000Z", endsAt: "2026-12-05T12:00:00.000Z", depositAmount: 500_000, payBy: "2026-12-01T10:00:00.000Z" };
    const s = { zone: "Asia/Manila", venue: "The Hall", payAccounts: [gcash, bank] };
    const text = paymentMessage(b, s);
    for (const part of ["Hi Ana", "5,000", "GCash: 0917 123 4567 (Dana Cruz)", "BPI: 1234-5678-90", "before", "one of these", "The Hall"]) expect(text).toContain(part);
    expect(paymentMessage({ ...b, payBy: undefined }, s)).not.toContain("before");
  });
});

describe("prices and the deposit", () => {
  const priced = { priceType: "package" as const, hourPrice: 100_000, packages: [{ id: "cccccccc", name: "Half day", hours: 4, price: 800_000 }] };
  const rule = { depositRequired: true, depositKind: "percent", depositAmount: 500_000, depositPercent: 30 } as const;
  it("works out the price by the hour or by package", () => {
    expect(priceFor({ ...priced, priceType: "hour" }, "10:00", "12:30")).toBe(250_000);
    expect(priceFor(priced, "10:00", "14:00", "cccccccc")).toBe(800_000);
    expect(priceFor(priced, "10:00", "13:00", "cccccccc")).toBeUndefined();
    expect(priceFor({ ...priced, priceType: "none" }, "10:00", "14:00")).toBeUndefined();
  });
  it("takes a share of the price, or the fixed amount when there is none", () => {
    expect(depositFor(rule, 800_000)).toBe(240_000);
    expect(depositFor(rule, undefined)).toBe(500_000);
    expect(depositFor({ ...rule, depositRequired: false }, 800_000)).toBe(0);
  });
});

describe("the settings screen is full width", () => {
  it("no part of it is given a maximum width", () => {
    for (const file of ["SettingsForm.tsx", "PricingFields.tsx", "PayAccountsFields.tsx", "TimetableEditor.tsx", "PickedSent.tsx"]) expect(readFileSync(join(__dirname, file), "utf8"), file).not.toMatch(/max-w-(?!full)/);
  });
});

describe("account numbers are formatted as they are typed", () => {
  it("groups a mobile number and drops what does not belong", () => {
    expect(formatAccountNumber("gcash", "0987111211212121")).toBe("0987 111 2112");
    expect(formatAccountNumber("gcash", "09a17-12")).toBe("0917 12");
    expect(formatAccountNumber("maya", "+639171234567")).toBe("+63 917 123 4567");
    expect(formatAccountNumber("gcash", "")).toBe("");
  });
  it("groups a bank number in fours", () => {
    expect(formatAccountNumber("bank", "1234567890")).toBe("1234 5678 90");
    expect(formatAccountNumber("ewallet", "09171234567")).toBe("0917 123 4567");
  });
  it("keeps the cursor after the same digit", () => {
    expect(caretAfter("0917 123 4567", 5)).toBe(6);
    expect(caretAfter("0917 123 4567", 0)).toBe(0);
  });
});

describe("the deposit asked as soon as a request is sent", () => {
  it("waits for payment at once, shows the accounts, and locks only when the money is recorded", async () => {
    const account = { id: "aaaaaaaa", kind: "gcash" as const, provider: "", name: "Dana Cruz", number: "0917 123 4567", qr: "" };
    await saveSettings({ ...DEFAULT_SETTINGS, depositWhen: "request", payAccounts: [account] });
    const { id } = await addBooking({ customerName: "Ana", phone: "0917 000 0001", email: "ana@example.com", eventType: "Party", guests: 10, date: "2027-03-02", start: "10:00", end: "12:00", notes: "" }, "public", new Date("2027-01-10T00:00:00.000Z"));
    const made = (await readData()).bookings.find((b) => b.id === id)!;
    expect(made).toMatchObject({ status: "requested", deposit: "waiting", depositAmount: 500_000 });
    expect(made.payBy).toBeDefined();
    await recordDeposit(id, "requested", { amount: 500_000, method: "gcash", paidOn: "2027-01-11" });
    expect((await readData()).bookings.find((b) => b.id === id)).toMatchObject({ status: "confirmed", deposit: "paid" });
  });
});

const ask = (over: Record<string, unknown>) => ({ customerName: "Ana", phone: "0917 000 0001", email: "ana@example.com", eventType: "Party", guests: 10, date: "2027-03-02", start: "10:00", end: "12:00", notes: "", ...over });
const THEN = new Date("2027-01-10T00:00:00.000Z");
const month = async (now = THEN) => ((await availability(new URLSearchParams("month=2027-03"), now)).body as { data: { unavailable: string[]; partly: string[]; pending: string[] } }).data;

describe("a date someone is paying for", () => {
  it("is held from others until the time to pay ends", async () => {
    await saveSettings({ ...DEFAULT_SETTINGS });
    await addBooking(ask({}), "public", THEN);
    expect((await month()).pending).toEqual(["2027-03-02"]);
    await expect(addBooking(ask({ phone: "0917 000 0002" }), "public", THEN)).rejects.toThrow(/just taken/);
    const later = new Date("2027-01-13T00:00:00.000Z"); // past the 48 hours
    expect((await month(later)).pending).toEqual([]);
    await expect(addBooking(ask({ phone: "0917 000 0002" }), "public", later)).resolves.toMatchObject({ duplicate: false });
  });
  it("is not held when the owner switches holding off", async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, holdWhilePaying: false });
    await addBooking(ask({}), "public", THEN);
    await expect(addBooking(ask({ phone: "0917 000 0002" }), "public", THEN)).resolves.toMatchObject({ duplicate: false });
  });
});

describe("a booking over several days", () => {
  const days = { date: "2027-03-05", endDate: "2027-03-07" };
  it("takes whole days, prices each one, and blocks every date between", async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, priceType: "hour", hourPrice: 100_000, dayPrice: 800_000 });
    const { id } = await addBooking(ask(days), "public", THEN);
    const b = (await readData()).bookings.find((x) => x.id === id)!;
    expect(b).toMatchObject({ startsAt: "2027-03-05T01:00:00.000Z", endsAt: "2027-03-07T13:00:00.000Z", price: 2_400_000 });
    expect((await month()).unavailable).toEqual(expect.arrayContaining(["2027-03-05", "2027-03-06", "2027-03-07"]));
    await expect(addBooking(ask({ phone: "0917 000 0002", date: "2027-03-06" }), "public", THEN)).rejects.toThrow(/just taken/);
  });
  it("refuses too many days, a closed day, and several days when switched off", async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, maxDays: 2 });
    await expect(addBooking(ask(days), "public", THEN)).rejects.toThrow(/up to 2 days/);
    await saveSettings({ ...DEFAULT_SETTINGS, closedDates: ["2027-03-06"] });
    await expect(addBooking(ask(days), "public", THEN)).rejects.toThrow(/closed on/);
    await saveSettings({ ...DEFAULT_SETTINGS, maxDays: 1 });
    await expect(addBooking(ask(days), "public", THEN)).rejects.toThrow(/one day at a time/);
  });
});
