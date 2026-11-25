import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// "use server" files can be imported straight into a test. next/navigation and next/headers are replaced so signOut can be
// seen redirecting and each test can pretend to come from its own address.
let from = "1.1.1.1";
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": from }) }));
import { checkCode, devSignIn, requestCode, signOut } from "./actions";

let n = 0;
beforeEach(() => {
  n += 1;
  from = `10.0.0.${n}`; // a fresh address for each test, so the counters do not carry over
});
afterEach(() => vi.unstubAllEnvs());

describe("sign in placeholder", () => {
  it("does nothing at all in production, so the fixed test code can never work on a live site", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await requestCode("prod@example.com")).toEqual({ ok: false, message: "Sign in is not connected yet." });
    expect(await checkCode({ email: "prod@example.com", code: "123456" })).toEqual({ ok: false, message: "Sign in is not connected yet." });
  });

  it("in development: refuses a bad or uninvited email, a short code and a wrong code", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await requestCode("not an email")).ok).toBe(false);
    expect((await requestCode("x@blocked.test")).ok).toBe(false);
    expect((await requestCode("dev@example.com")).ok).toBe(true);
    expect((await checkCode({ email: "dev@example.com", code: "12345" })).ok).toBe(false);
    expect((await checkCode({ email: "dev@example.com", code: "654321" })).ok).toBe(false);
    expect((await checkCode({ email: "dev@example.com", code: "123456" })).ok).toBe(true);
  });

  it("rejects odd input without crashing: long text, markup and a code with letters", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await requestCode(`${"a".repeat(300)}@example.com`)).ok).toBe(false);
    expect((await requestCode("<script>alert(1)</script>@x.co")).ok).toBe(false);
    expect((await checkCode({ email: "odd@example.com", code: "12a456" })).ok).toBe(false);
  });

  it("stops a bot that guesses codes: after 5 wrong tries even the right code is refused", async () => {
    vi.stubEnv("NODE_ENV", "development");
    for (let i = 0; i < 5; i++) expect((await checkCode({ email: "guess@example.com", code: "000000" })).ok).toBe(false);
    const sixth = await checkCode({ email: "guess@example.com", code: "123456" });
    expect(sixth.ok).toBe(false);
    expect(!sixth.ok && sixth.message).toMatch(/Too many tries/);
  });

  it("stops one email being flooded with codes", async () => {
    vi.stubEnv("NODE_ENV", "development");
    for (let i = 0; i < 3; i++) expect((await requestCode("flood@example.com")).ok).toBe(true);
    const fourth = await requestCode("flood@example.com");
    expect(!fourth.ok && fourth.message).toMatch(/Too many tries/);
  });

  it("stops one address trying many different emails", async () => {
    vi.stubEnv("NODE_ENV", "development");
    for (let i = 0; i < 10; i++) expect((await requestCode(`spray${i}@example.com`)).ok).toBe(true);
    const eleventh = await requestCode("spray10@example.com");
    expect(!eleventh.ok && eleventh.message).toMatch(/Too many tries/);
  });

  it("quietly ignores a bot that fills in the hidden trap field, and does not count it against the limits", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(await requestCode("bot@example.com", "http://spam.example")).toEqual({ ok: true, data: undefined });
    for (let i = 0; i < 3; i++) expect((await requestCode("bot@example.com")).ok).toBe(true);
  });

  it("the no-code shortcut works only in development with no database connected, never in production or once Supabase is set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect((await devSignIn("proto@example.com")).ok).toBe(true);
    expect((await devSignIn("x@blocked.test")).ok).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    expect(await devSignIn("proto@example.com")).toEqual({ ok: false, message: "Sign in is not connected yet." });
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(await devSignIn("proto@example.com")).toEqual({ ok: false, message: "Sign in is not connected yet." });
  });

  it("signOut only ever goes to the sign-in screen", async () => {
    await expect(signOut()).rejects.toThrow("redirect:/sign-in");
  });
});
