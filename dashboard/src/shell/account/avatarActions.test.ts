import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const from = "5.5.5.5";
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": from }) }));
vi.mock("next/cache", () => ({
  revalidatePath: () => {
    throw new Error("outside a request");
  },
}));
vi.mock("./breach", () => ({ isBreached: async () => false }));

import { AVATAR_PREFIX } from "./avatar";
import { fakeWebp } from "./avatar.test";
import { devAccount, resetDevAccount } from "./accountAuth";
import { removeAvatar, saveAvatar } from "./actions";
import { currentAvatar, accountStatus } from "./status";

const good = AVATAR_PREFIX + Buffer.from(fakeWebp()).toString("base64");

let clock = Date.parse("2026-04-01T00:00:00Z");
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

describe("profile photo", () => {
  it("is empty to begin with", async () => {
    expect(await currentAvatar()).toBeNull();
    expect((await accountStatus())?.avatarUrl).toBeNull();
  });

  it("saves a small WebP, shows it everywhere it is asked for, and writes an activity line", async () => {
    expect(await saveAvatar(good)).toEqual({ ok: true, data: undefined });
    expect(await currentAvatar()).toBe(good);
    expect((await accountStatus())?.avatarUrl).toBe(good);
    expect((await accountStatus())?.activity[0].type).toBe("avatar.changed");
  });

  it("removes it again, and says so in the activity", async () => {
    await saveAvatar(good);
    expect(await removeAvatar()).toEqual({ ok: true, data: undefined });
    expect(await currentAvatar()).toBeNull();
    expect((await accountStatus())?.activity[0].type).toBe("avatar.removed");
  });

  it("refuses what is not a small WebP, and keeps the photo that was there", async () => {
    await saveAvatar(good);
    for (const bad of ["https://example.com/a.webp", "data:image/png;base64,AAAA", "javascript:alert(1)", 123, null, { src: good }, AVATAR_PREFIX + "x".repeat(300_000)]) {
      const r = await saveAvatar(bad);
      expect(r.ok).toBe(false);
    }
    expect(await currentAvatar()).toBe(good);
  });

  it("does nothing in production, where nobody is signed in yet", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await saveAvatar(good)).ok).toBe(false);
    expect((await removeAvatar()).ok).toBe(false);
    expect(await currentAvatar()).toBeNull();
  });

  it("slows down a flood of changes", async () => {
    let blocked = false;
    for (let i = 0; i < 15; i++) {
      const r = await saveAvatar(good);
      if (!r.ok && /Too many tries/.test(r.message)) blocked = true;
    }
    expect(blocked).toBe(true);
  });

  it("never puts the picture, or a password, into the log of events", async () => {
    await saveAvatar(good);
    const text = JSON.stringify(devAccount().events);
    expect(text).not.toContain("base64");
    expect(text).not.toContain(good.slice(30));
    expect(Object.keys(devAccount().events[0]).sort()).toEqual(["personId", "requestId", "type"]);
  });
});
