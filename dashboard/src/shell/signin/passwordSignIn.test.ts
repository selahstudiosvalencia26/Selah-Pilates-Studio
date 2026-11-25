import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let from = "2.2.2.2";
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": from }) }));
import { DEV_PASSWORD, resetDevAccount } from "@/shell/account/accountAuth";
import { signInWithPassword } from "./actions";

let n = 0;
beforeEach(() => {
  n += 1;
  from = `10.2.0.${n}`;
  resetDevAccount(true);
  vi.stubEnv("NODE_ENV", "development");
});
afterEach(() => vi.unstubAllEnvs());

describe("sign in with a password (placeholder)", () => {
  it("does nothing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await signInWithPassword({ email: "owner@example.com", password: DEV_PASSWORD })).toEqual({ ok: false, message: "Sign in is not connected yet." });
  });

  it("accepts the right email and password, and refuses a wrong password, with ONE answer for a wrong email too", async () => {
    expect((await signInWithPassword({ email: "owner@example.com", password: DEV_PASSWORD })).ok).toBe(true);
    const wrongPassword = await signInWithPassword({ email: "owner@example.com", password: "nope nope nope" });
    const wrongEmail = await signInWithPassword({ email: "someone.else@example.com", password: DEV_PASSWORD });
    expect(wrongPassword).toEqual({ ok: false, message: "That email or password is not right." });
    expect(wrongEmail).toEqual(wrongPassword); // nobody can tell which emails have an account
  });

  it("accepts the username admin", async () => {
    expect((await signInWithPassword({ email: " Admin ", password: DEV_PASSWORD })).ok).toBe(true);
    expect((await signInWithPassword({ email: "admin", password: "nope" })).ok).toBe(false);
  });

  it("refuses a bad email, an empty password and a huge one, without crashing", async () => {
    expect((await signInWithPassword({ email: "not an email", password: "x" })).ok).toBe(false);
    expect((await signInWithPassword({ email: "owner@example.com", password: "" })).ok).toBe(false);
    expect((await signInWithPassword({ email: "owner@example.com", password: "x".repeat(300) })).ok).toBe(false);
  });

  it("quietly ignores a bot that fills the hidden field", async () => {
    expect(await signInWithPassword({ email: "owner@example.com", password: "whatever" }, "http://spam.test")).toEqual({ ok: true, data: undefined });
  });

  it("stops a bot that guesses: after 5 wrong tries even the right password is refused", async () => {
    for (let i = 0; i < 5; i++) expect((await signInWithPassword({ email: "owner@example.com", password: `guess ${i}` })).ok).toBe(false);
    const sixth = await signInWithPassword({ email: "owner@example.com", password: DEV_PASSWORD });
    expect(!sixth.ok && sixth.message).toMatch(/Too many tries/);
  });
});
