import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { corsHeaders } from "./cors";
import { availability, request } from "./public";
import { DEFAULT_SETTINGS } from "./schema";
import { addBooking, confirmBooking, recordDeposit, saveSettings } from "./service";
import { readData, startingSettings, withData } from "./store";

const NOW = new Date("2026-11-23T04:00:00Z");
const body = (over: Record<string, unknown> = {}) => ({ customerName: "Ana Cruz", phone: "0917 123 4567", email: "ana@example.com", eventType: "Birthday", guests: 30, date: "2026-12-05", start: "18:00", end: "20:00", notes: "", ...over });
let n = 0;
const caller = () => `caller-${++n}`; // each test is a different caller, so the limit of one does not touch another

// Every test runs in its own empty folder (also as the working folder), so the real dashboard it sits in, with its own install answers in setup/,
// can never change what a test sees.
let dir: string;
let home: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "booking-public-"));
  process.env.BOOKING_DATA_DIR = dir;
  home = process.cwd();
  process.chdir(dir);
  await withData((data) => void (data.settings = { ...DEFAULT_SETTINGS, depositWhen: "confirm" as const }));
});
afterEach(async () => {
  process.chdir(home);
  delete process.env.BOOKING_DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe("the public request", () => {
  it("saves a request and says thanks without confirming anything", async () => {
    const a = await request(body(), caller(), NOW);
    expect(a).toEqual({ status: 200, body: { ok: true, data: { message: "We got your request. We will reply soon." } } });
    const [b] = (await readData()).bookings;
    expect([b.status, b.createdVia]).toEqual(["requested", "public"]);
  });
  it("refuses a request outside opening hours, in plain words", async () => {
    const a = await request(body({ end: "23:30" }), caller(), NOW);
    expect(a.status).toBe(400);
    expect(a.body).toEqual({ ok: false, message: "We are open 9:00 AM to 9:00 PM that day." });
  });
  it("refuses extra fields, a bad email and a bad phone", async () => {
    expect((await request(body({ status: "confirmed" }), caller(), NOW)).status).toBe(400);
    expect((await request(body({ email: "nope" }), caller(), NOW)).status).toBe(400);
    expect((await request(body({ phone: "abc" }), caller(), NOW)).status).toBe(400);
    expect((await readData()).bookings).toHaveLength(0);
  });
  it("answers a bot politely and saves nothing", async () => {
    const a = await request(body({ website: "http://spam.example" }), caller(), NOW);
    expect(a.status).toBe(200);
    expect((await readData()).bookings).toHaveLength(0);
  });
  it("slows down a caller who sends too many", async () => {
    const who = caller();
    const answers = [];
    for (let i = 0; i < 10; i++) answers.push((await request(body({ phone: `0917 000 00${i}0`, date: `2026-12-${String(10 + i).padStart(2, "0")}` }), who, NOW)).status);
    expect(answers.slice(0, 8).every((s) => s === 200)).toBe(true);
    expect(answers.slice(8)).toEqual([429, 429]);
  });
  it("slows down one phone number used again and again", async () => {
    const answers = [];
    for (let i = 0; i < 6; i++) answers.push((await request(body({ date: `2026-12-${String(10 + i).padStart(2, "0")}`, phone: "0999 888 7777" }), caller(), NOW)).status);
    expect(answers.slice(4)).toEqual([429, 429]);
  });
});

describe("what a visitor can see", () => {
  it("shows busy times without any customer detail", async () => {
    const { id } = await addBooking(body() as never, "public", NOW);
    await confirmBooking(id, "requested", NOW);
    await recordDeposit(id, "requested", { amount: 500_000, method: "bank", paidOn: "2026-11-24" }, NOW);
    const day = await availability(new URLSearchParams("date=2026-12-05"), NOW);
    expect(day.body).toMatchObject({ ok: true, data: { windows: [{ start: "09:00", end: "18:00" }, { start: "20:00", end: "21:00" }] } });
    const text = JSON.stringify([day, await availability(new URLSearchParams("month=2026-12"), NOW)]);
    for (const secret of ["Ana", "0917", "ana@example.com", "Birthday"]) expect(text).not.toContain(secret);
  });
  it("marks dates that are too soon or closed as unavailable for the date picker", async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, hours: { ...DEFAULT_SETTINGS.hours, sun: "closed" } });
    const a = await availability(new URLSearchParams("month=2026-11"), NOW);
    const days = (a.body as { data: { unavailable: string[] } }).data.unavailable;
    expect(days).toContain("2026-11-22"); // past
    expect(days).toContain("2026-11-24"); // inside the 2 day lead time
    expect(days).toContain("2026-11-29"); // a Sunday
    expect(days).not.toContain("2026-11-28");
  });
  it("gives no times on a closed or too-soon date", async () => {
    const a = await availability(new URLSearchParams("date=2026-11-24"), NOW);
    expect(a.body).toMatchObject({ data: { starts: [] } });
  });
  it("refuses a made-up month or date", async () => {
    expect((await availability(new URLSearchParams("month=banana"), NOW)).status).toBe(400);
    expect((await availability(new URLSearchParams("date=2026-13-45"), NOW)).status).toBe(400);
    expect((await availability(new URLSearchParams(""), NOW)).status).toBe(400);
  });
  it("books a class with only a name and a phone number", async () => {
    await withData((data) => void (data.settings = { ...DEFAULT_SETTINGS, mode: "classes", timetable: [{ id: "abcd1234", weekday: "mon", time: "09:00", minutes: 55, title: "Sculpt", instructor: "", place: "", capacity: 4 }] }));
    const booked = await request({ sessionKey: "abcd1234@2026-11-30", customerName: "Ana", phone: "0917 000 2222", spots: 1 }, caller(), NOW);
    expect(booked.status).toBe(200);
  });
  it("lists classes with their spots left, and no customer detail", async () => {
    await withData((data) => void (data.settings = { ...DEFAULT_SETTINGS, mode: "classes", timetable: [{ id: "abcd1234", weekday: "mon", time: "09:00", minutes: 55, title: "Sculpt", instructor: "Mara", place: "Studio A", capacity: 4 }] }));
    const booked = await request({ sessionKey: "abcd1234@2026-11-30", customerName: "Lia Reyes", phone: "0917 000 1111", email: "lia@example.com", spots: 1 }, caller(), NOW);
    expect(booked.body).toEqual({ ok: true, data: { message: "You are booked. See you in class." } });
    const a = await availability(new URLSearchParams("from=2026-11-23&days=14"), NOW);
    const classes = (a.body as { data: { classes: { key: string; spotsLeft: number }[] } }).data.classes;
    expect(classes.map((c) => [c.key, c.spotsLeft])).toEqual([["abcd1234@2026-11-30", 3]]); // this morning's class has started, so it is not offered
    expect(JSON.stringify(a)).not.toContain("Lia");
  });
});

describe("which websites may call it", () => {
  it("allows nobody until the list is set, then only the listed sites", () => {
    delete process.env.BOOKING_ALLOWED_ORIGINS;
    expect(corsHeaders("https://dancafe.example")["Access-Control-Allow-Origin"]).toBeUndefined();
    process.env.BOOKING_ALLOWED_ORIGINS = "https://dancafe.example, http://localhost:3000";
    expect(corsHeaders("https://dancafe.example")["Access-Control-Allow-Origin"]).toBe("https://dancafe.example");
    expect(corsHeaders("https://evil.example")["Access-Control-Allow-Origin"]).toBeUndefined();
    delete process.env.BOOKING_ALLOWED_ORIGINS;
  });
});

describe("the first settings: the business name from the dashboard, the rest from the install answers", () => {
  // Runs with the dashboard folder (where setup/ lives) as the working folder, with these files in it.
  const withSetup = async (files: Record<string, unknown>, run: () => void | Promise<void>) => {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const before = process.cwd();
    await mkdir(join(dir, "setup"), { recursive: true });
    for (const [name, content] of Object.entries(files)) await writeFile(join(dir, "setup", `${name}.json`), typeof content === "string" ? content : JSON.stringify(content));
    await (await import("node:fs/promises")).rm(join(dir, "settings.json"), { force: true });
    process.chdir(dir);
    delete (globalThis as { __businessName?: string }).__businessName;
    try {
      await run();
    } finally {
      process.chdir(before);
    }
  };
  const plain = { ...DEFAULT_SETTINGS, venue: "Your Business" }; // nothing saved: the dashboard's own default name

  // Runs in an empty folder, so a dashboard's own setup/business.json (the real client's name) never leaks into the test.
  it("uses the plain defaults and the default business name when nothing was saved", () => withSetup({}, () => expect(startingSettings()).toEqual(plain)));
  it("names the venue after the business, with no question asked", () => withSetup({ business: { name: "Dan Cafe" } }, () => expect(startingSettings()).toMatchObject({ mode: "venue", venue: "Dan Cafe" })));
  it("starts a class studio from its answers", () =>
    withSetup({ business: { name: "Selah Pilates" }, booking: { mode: "classes" } }, async () => {
      expect(startingSettings()).toMatchObject({ mode: "classes", venue: "Selah Pilates" });
      expect((await readData()).settings.mode).toBe("classes"); // nothing saved yet, so the answers are the settings
    }));
  it("starts a venue with no deposit when that was the answer", () => withSetup({ business: { name: "Dan Cafe" }, booking: { mode: "venue", deposit: "no" } }, () => expect(startingSettings()).toMatchObject({ mode: "venue", venue: "Dan Cafe", depositRequired: false })));
  it("follows the name set on the Branding screen", () =>
    withSetup({ business: { name: "Dan Cafe" } }, () => {
      (globalThis as { __businessName?: string }).__businessName = "Dan's Events";
      expect(startingSettings().venue).toBe("Dan's Events");
    }));
  it("ignores an answers file that is broken or says something odd", async () => {
    await withSetup({ booking: "{ not json" }, () => expect(startingSettings()).toEqual(plain));
    await withSetup({ booking: { mode: "hotel", deposit: 42 } }, () => expect(startingSettings()).toEqual(plain));
  });
});
