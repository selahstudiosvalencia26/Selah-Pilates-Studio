import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const from = "3.3.3.3";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": from }),
}));
vi.mock("./breach", () => ({ isBreached: async () => false }));

import { devAccount, resetDevAccount } from "./accountAuth";
import { endDevice, endOtherDevices } from "./actions";
import { accountStatus } from "./status";

let clock = Date.parse("2026-02-01T00:00:00Z");
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  clock += 60 * 60 * 1000;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(clock);
  resetDevAccount(true);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("account status", () => {
  it("shows who is signed in, whether there is a password, and the devices, in plain words", async () => {
    const status = await accountStatus();
    expect(status).toMatchObject({
      email: "owner@example.com",
      name: "Sample Owner",
      role: "Owner",
      hasPassword: true,
    });
    expect(status?.sessions.map((s) => s.label)).toEqual([
      "This browser",
      "Safari on iPhone",
      "Chrome on Windows",
    ]);
    expect(status?.sessions.filter((s) => s.current)).toHaveLength(1);
  });

  it("shows nothing in production, where nobody is signed in yet", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await accountStatus()).toBeNull();
  });

  it("never puts a password, a hash or a token in what the screen is given", async () => {
    const text = JSON.stringify(await accountStatus());
    expect(text).not.toMatch(/salt|key|hash|token|secret|Practice-password/i);
  });
});

describe("signing out devices", () => {
  it("ends one other device, and writes a log line", async () => {
    expect(await endDevice("s-phone")).toEqual({ ok: true, data: undefined });
    expect((await accountStatus())?.sessions.map((s) => s.id)).toEqual([
      "s-this",
      "s-office",
    ]);
    expect(devAccount().events.map((e) => e.type)).toEqual(["session.ended"]);
  });

  it("refuses the device in use, one that does not exist, someone else's id, and odd input", async () => {
    for (const bad of [
      "s-this",
      "s-nobody",
      "../../etc/passwd",
      "",
      "x".repeat(100),
      42,
      null,
      { id: "s-phone" },
    ]) {
      const r = await endDevice(bad);
      expect(r.ok).toBe(false);
    }
    expect((await accountStatus())?.sessions).toHaveLength(3); // nothing was ended
  });

  it("ends every device except this one, in one press", async () => {
    expect(await endOtherDevices()).toEqual({ ok: true, data: undefined });
    expect((await accountStatus())?.sessions.map((s) => s.id)).toEqual([
      "s-this",
    ]);
    expect(devAccount().events.map((e) => e.type)).toEqual(["sessions.ended"]);
  });

  it("does nothing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await endDevice("s-phone")).ok).toBe(false);
    expect((await endOtherDevices()).ok).toBe(false);
  });

  it("slows down a flood of requests", async () => {
    let blocked = false;
    for (let i = 0; i < 25; i++) {
      resetDevAccount(true);
      const r = await endDevice("s-phone");
      if (!r.ok && /Too many tries/.test(r.message)) blocked = true;
    }
    expect(blocked).toBe(true);
  });
});
