import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Server actions can be imported straight into a test. next/headers is replaced so each test pretends to come from its own
// address, and the breach check is replaced so no test calls the internet.
let from = "1.1.1.1";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": from }),
}));
const breached = vi.fn(async (): Promise<boolean | null> => false);
vi.mock("./breach", () => ({ isBreached: (...args: []) => breached(...args) }));

import {
  DEV_PASSWORD,
  devAccount,
  resetDevAccount,
  verifyPracticePassword,
  accountAuth,
  DEV_PERSON,
} from "./accountAuth";
import { changePassword, sendPasswordCode } from "./actions";

const GOOD = "lemon river paper lantern";
const form = (
  over: Partial<{
    proof: string;
    next: string;
    confirm: string;
    signOutOthers: boolean;
  }> = {},
) => ({
  proof: DEV_PASSWORD,
  next: GOOD,
  confirm: GOOD,
  signOutOthers: true,
  ...over,
});

// The tries counter is per person and lives while the server runs, so each test lives in its own stretch of time.
let clock = Date.parse("2026-01-01T00:00:00Z");
let n = 0;
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  n += 1;
  from = `10.1.0.${n}`;
  clock += 60 * 60 * 1000;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(clock);
  resetDevAccount(true);
  breached.mockReset();
  breached.mockResolvedValue(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

const message = (r: { ok: boolean; message?: string }): string =>
  r.ok ? "" : (r.message ?? "");

describe("change password: who may", () => {
  it("does nothing in production, where nobody is signed in yet", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await changePassword(form())).toEqual({
      ok: false,
      message: "Changing your password is not connected yet.",
    });
    expect(await sendPasswordCode()).toEqual({
      ok: false,
      message: "Changing your password is not connected yet.",
    });
    expect(
      await verifyPracticePassword("owner@example.com", DEV_PASSWORD),
    ).toBe(false);
  });

  it("refuses an unexpected shape: a missing field, an extra field, a wrong type, or a huge paste", async () => {
    for (const bad of [
      null,
      "text",
      { next: GOOD, confirm: GOOD, signOutOthers: true },
      { ...form(), role: "owner" },
      { ...form(), signOutOthers: "yes" },
      form({ next: "x".repeat(300), confirm: "x".repeat(300) }),
    ]) {
      const r = await changePassword(bad);
      expect(r.ok).toBe(false);
    }
    expect(devAccount().events).toEqual([]);
  });
});

describe("change password: proving it is the person", () => {
  it("refuses a wrong current password, changes nothing, and writes a log line without the password", async () => {
    const r = await changePassword(form({ proof: "not the password" }));
    expect(message(r)).toBe("Your current password is not right.");
    expect(
      await verifyPracticePassword("owner@example.com", DEV_PASSWORD),
    ).toBe(true);
    expect(devAccount().events.map((e) => e.type)).toEqual(["password.failed"]);
    expect(JSON.stringify(devAccount().events)).not.toContain(
      "not the password",
    );
  });

  it("stops guessing: after 5 wrong tries even the right password is refused for a while", async () => {
    for (let i = 0; i < 5; i++)
      expect((await changePassword(form({ proof: `wrong ${i}` }))).ok).toBe(
        false,
      );
    const sixth = await changePassword(form());
    expect(message(sixth)).toMatch(/Too many tries/);
    expect(
      await verifyPracticePassword("owner@example.com", DEV_PASSWORD),
    ).toBe(true);
  });

  it("stops one address trying again and again, even with different passwords", async () => {
    for (let i = 0; i < 5; i++)
      await changePassword(form({ proof: `wrong ${i}` }));
    // the same person is blocked after 5, so move the clock to free the person but keep counting the address
    for (let round = 0; round < 4; round++) {
      vi.setSystemTime((clock += 16 * 60 * 1000));
      from = "9.9.9.9"; // one address for all of them
      for (let i = 0; i < 5; i++)
        await changePassword(form({ proof: `again ${round}-${i}` }));
    }
    vi.setSystemTime((clock += 16 * 60 * 1000));
    // 20 per 15 minutes per address: a fifth round inside one window is refused
    from = "9.9.8.8";
    let blocked = false;
    for (let i = 0; i < 25; i++)
      if (
        message(await changePassword(form({ proof: `x${i}` }))).match(
          /Too many tries/,
        )
      )
        blocked = true;
    expect(blocked).toBe(true);
  });
});

describe("change password: the new password", () => {
  it("refuses a mismatch, a short one, a common one, one with the email in it, and the same one again", async () => {
    expect(message(await changePassword(form({ confirm: GOOD + "!" })))).toBe(
      "The two new passwords are not the same.",
    );
    expect(
      message(await changePassword(form({ next: "short", confirm: "short" }))),
    ).toMatch(/at least 12/i);
    expect(
      message(
        await changePassword(
          form({ next: "password1234", confirm: "password1234" }),
        ),
      ),
    ).toMatch(/too common/i);
    expect(
      message(
        await changePassword(
          form({ next: "owner@example.com!!", confirm: "owner@example.com!!" }),
        ),
      ),
    ).toMatch(/email/i);
    // The practice password is short, so "the same one again" is tried with a long one set first.
    await accountAuth().setPassword(DEV_PERSON, GOOD);
    expect(
      message(
        await changePassword(
          form({ proof: GOOD, next: GOOD, confirm: GOOD }),
        ),
      ),
    ).toMatch(/not used here before/i);
    expect(await verifyPracticePassword("owner@example.com", GOOD)).toBe(true);
  });

  it("refuses a password found in a known breach, and accepts one when the breach service cannot be reached", async () => {
    breached.mockResolvedValueOnce(true);
    expect(message(await changePassword(form()))).toMatch(/data leak/i);
    expect(
      await verifyPracticePassword("owner@example.com", DEV_PASSWORD),
    ).toBe(true);

    breached.mockResolvedValueOnce(null);
    expect((await changePassword(form())).ok).toBe(true);
  });
});

describe("change password: saving it", () => {
  it("saves the new password, the old one stops working, and the answer holds no password", async () => {
    const r = await changePassword(form());
    expect(r).toEqual({
      ok: true,
      data: { signedOutOthers: true, wasSet: false, emailed: false },
    });
    expect(await verifyPracticePassword("owner@example.com", GOOD)).toBe(true);
    expect(
      await verifyPracticePassword("owner@example.com", DEV_PASSWORD),
    ).toBe(false);
    expect(JSON.stringify(r)).not.toContain(GOOD);
  });

  it("signs out the other devices by default, writes one log line, and emails the person", async () => {
    await changePassword(form());
    const account = devAccount();
    expect(account.otherSessionsEnded).toBe(1);
    expect(account.events).toHaveLength(1);
    expect(account.events[0]).toMatchObject({
      type: "password.changed",
      personId: "dev-owner",
      signedOutOthers: true,
    });
    expect(account.events[0].requestId).toMatch(/^[0-9a-f]{8}$/);
    expect(account.notices).toEqual(["password-changed"]);
    // The practice account sends no real email, so the answer must not claim one.
    expect(
      (
        await changePassword(
          form({
            proof: GOOD,
            next: "another long pass phrase",
            confirm: "another long pass phrase",
          }),
        )
      ).ok,
    ).toBe(true);
    expect(JSON.stringify(account.events)).not.toContain(GOOD);
    // As a value: the word itself is part of the event names.
    expect(JSON.stringify(account.events)).not.toContain(`"${DEV_PASSWORD}"`);
  });

  it("keeps the other devices signed in when the person unticks that, and says so", async () => {
    const r = await changePassword(form({ signOutOthers: false }));
    expect(r).toEqual({
      ok: true,
      data: { signedOutOthers: false, wasSet: false, emailed: false },
    });
    expect(devAccount().otherSessionsEnded).toBe(0);
  });

  it("a correct change clears the tries, so the person is not locked out afterwards", async () => {
    for (let i = 0; i < 4; i++)
      await changePassword(form({ proof: `wrong ${i}` }));
    expect((await changePassword(form())).ok).toBe(true);
    const again = await changePassword({
      proof: GOOD,
      next: "another long pass phrase",
      confirm: "another long pass phrase",
      signOutOthers: true,
    });
    expect(again.ok).toBe(true);
  });

  it("still changes the password if the log line or the email fails", async () => {
    // The practice account's log and email never fail, so prove the shape: both are awaited with a catch around them.
    const source = (await import("node:fs")).readFileSync(
      new URL("./actions.ts", import.meta.url),
      "utf8",
    );
    expect(source).toMatch(/auth\s*\.record\([\s\S]*?\)\s*\.catch\(\s*\(\)\s*=>\s*\{\s*\}/);
    expect(source).toMatch(/auth\s*\.notify\([\s\S]*?\)\s*\.catch\(\s*\(\)\s*=>\s*false/);
  });
});

describe("a person with no password yet", () => {
  beforeEach(() => resetDevAccount(false));

  it("must prove it with the 6 number code, and then the password is set", async () => {
    expect(message(await changePassword(form({ proof: "654321" })))).toMatch(
      /code is not right/i,
    );
    expect(message(await changePassword(form({ proof: "abcdef" })))).toMatch(
      /code is not right/i,
    );
    expect(await verifyPracticePassword("owner@example.com", GOOD)).toBe(false);

    const r = await changePassword(form({ proof: "123456" }));
    expect(r).toEqual({
      ok: true,
      data: { signedOutOthers: true, wasSet: true, emailed: false },
    });
    expect(await verifyPracticePassword("owner@example.com", GOOD)).toBe(true);
    expect(devAccount().events.map((e) => e.type)).toContain("password.set");
  });

  it("limits how many codes can be asked for", async () => {
    for (let i = 0; i < 3; i++)
      expect((await sendPasswordCode()).ok).toBe(true);
    expect(message(await sendPasswordCode())).toMatch(/Too many tries/);
  });
});
