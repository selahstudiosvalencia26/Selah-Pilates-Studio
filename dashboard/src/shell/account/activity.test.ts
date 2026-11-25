import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const from = "4.4.4.4";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": from }),
}));
vi.mock("./breach", () => ({ isBreached: async () => false }));

import { DEV_PASSWORD, resetDevAccount } from "./accountAuth";
import { changePassword, endDevice, endOtherDevices } from "./actions";
import { accountStatus } from "./status";

let clock = Date.parse("2026-03-01T00:00:00Z");
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

describe("recent account activity", () => {
  it("starts with the person's recent sign-ins, newest first", async () => {
    const status = await accountStatus();
    expect(status?.activity.map((a) => a.type)).toEqual([
      "signin.code",
      "signin.code",
      "signin.code",
    ]);
    const times = status!.activity.map((a) => a.at);
    expect(times).toEqual([...times].sort().reverse());
  });

  it("adds a line for a password change, a signed-out device, and signing out all the others", async () => {
    await changePassword({
      proof: DEV_PASSWORD,
      next: "lemon river paper lantern",
      confirm: "lemon river paper lantern",
      signOutOthers: false,
    });
    vi.setSystemTime((clock += 60_000));
    await endDevice("s-phone");
    vi.setSystemTime((clock += 60_000));
    await endOtherDevices();
    const types = (await accountStatus())!.activity.map((a) => a.type);
    expect(types.slice(0, 3)).toEqual([
      "sessions.ended",
      "session.ended",
      "password.changed",
    ]);
  });

  it("shows a wrong current password as an activity line, so a guess against the account is noticed", async () => {
    await changePassword({
      proof: "not the password",
      next: "lemon river paper lantern",
      confirm: "lemon river paper lantern",
      signOutOthers: true,
    });
    expect((await accountStatus())!.activity[0].type).toBe("password.failed");
  });

  it("shows at most 6 lines, and never a password, a code, an address or a token", async () => {
    for (let i = 0; i < 4; i++)
      await changePassword({
        proof: `wrong ${i}`,
        next: "lemon river paper lantern",
        confirm: "lemon river paper lantern",
        signOutOthers: true,
      });
    const status = await accountStatus();
    expect(status!.activity.length).toBeLessThanOrEqual(6);
    const text = JSON.stringify(status!.activity);
    expect(text).not.toMatch(
      /wrong \d|lemon river|Practice-password|salt|hash|token|1\.2\.3\.4|123456/i,
    );
    expect(Object.keys(status!.activity[0]).sort()).toEqual([
      "at",
      "id",
      "type",
    ]);
  });

  it("is empty in production, where nobody is signed in yet", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await accountStatus()).toBeNull();
  });
});
