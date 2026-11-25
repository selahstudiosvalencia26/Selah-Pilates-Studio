"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authOn } from "@/lib/auth/config";
import { endSession, passwordSignIn } from "@/lib/auth/server";
import { DEV_LOGIN, verifyPracticePassword } from "@/shell/account/accountAuth";
import { devSkipAllowed } from "./devSkip";
import { createLimiter, waitWords } from "@/kit/rateLimit";
import { err, ok, type Result } from "@/kit/result";

// Sign in with an email and a code. THIS IS A PLACEHOLDER so the screen can be tried: it does nothing real, it sets no
// session, and it refuses to run in production. The real version (Supabase Auth, invited people only, codes that expire in
// 10 minutes with 5 tries, the owner's second code) replaces the inside of these functions and keeps the same answers.
// The protections against bots are real and stay: a hidden trap field, a limit on codes per email and per address, and
// 5 tries per code. Try it in development: any email works, an email ending in @blocked.test is refused, the code is 123456.
const email = z.string().trim().toLowerCase().email().max(254);
const NOT_CONNECTED = "Sign in is not connected yet.";
const WINDOW = 10 * 60 * 1000;

// Per email: 3 codes, and 5 tries at a code, every 10 minutes. Per address: more, so an office sharing one connection still works.
const codesPerEmail = createLimiter({ max: 3, windowMs: WINDOW });
const codesPerAddress = createLimiter({ max: 10, windowMs: WINDOW });
const triesPerEmail = createLimiter({ max: 5, windowMs: WINDOW });
const triesPerAddress = createLimiter({ max: 30, windowMs: WINDOW });
// Password tries are counted the same way: 5 per email and 30 per address every 10 minutes.
const passwordTriesPerEmail = createLimiter({ max: 5, windowMs: WINDOW });
const passwordTriesPerAddress = createLimiter({ max: 30, windowMs: WINDOW });

// Who is asking, as far as the server can tell. Used only to count tries, never stored or shown.
async function address(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}

const slow = (seconds: number) => err(`Too many tries. Please wait ${waitWords(seconds)} and try again.`);

// Sign out. Placeholder like the rest of this file: there is no session to end yet, so it only goes back to the sign-in
// screen. The real version ends the session first, then does the same redirect.
export async function signOut(): Promise<void> {
  if (authOn()) await endSession();
  redirect("/sign-in");
}

// `trap` is a hidden field people never see. A bot that fills in every field fills this one too, and is quietly ignored:
// it gets the same answer as everyone else, so it cannot tell it was caught.
export async function requestCode(input: string, trap = ""): Promise<Result> {
  if (process.env.NODE_ENV === "production" || authOn()) return err(NOT_CONNECTED);
  if (trap !== "") return ok(undefined);
  const parsed = email.safeParse(input);
  if (!parsed.success) return err("That email does not look right. Check it and try again.");

  const byAddress = codesPerAddress.hit(await address());
  if (!byAddress.allowed) return slow(byAddress.retryAfterSeconds);
  const byEmail = codesPerEmail.hit(parsed.data);
  if (!byEmail.allowed) return slow(byEmail.retryAfterSeconds);

  if (parsed.data.endsWith("@blocked.test")) return err("This email has not been invited. Ask the owner to invite you.");
  return ok(undefined);
}

// Prototype shortcut: an email alone signs you in, but only where devSkipAllowed() says so (see devSkip.ts).
export async function devSignIn(input: string, trap = ""): Promise<Result> {
  if (!devSkipAllowed()) return err(NOT_CONNECTED);
  if (trap !== "") return ok(undefined);
  const parsed = email.safeParse(input);
  if (!parsed.success) return err("That email does not look right. Check it and try again.");
  const byAddress = codesPerAddress.hit(await address());
  if (!byAddress.allowed) return slow(byAddress.retryAfterSeconds);
  if (parsed.data.endsWith("@blocked.test")) return err("This email has not been invited. Ask the owner to invite you.");
  return ok(undefined);
}

export async function checkCode(input: { email: string; code: string }): Promise<Result> {
  if (process.env.NODE_ENV === "production" || authOn()) return err(NOT_CONNECTED);
  const parsed = email.safeParse(input.email);
  if (!parsed.success) return err("That email does not look right. Check it and try again.");

  const byAddress = triesPerAddress.hit(await address());
  if (!byAddress.allowed) return slow(byAddress.retryAfterSeconds);
  const byEmail = triesPerEmail.hit(parsed.data);
  if (!byEmail.allowed) return slow(byEmail.retryAfterSeconds);

  if (!/^\d{6}$/.test(input.code)) return err("The code is 6 numbers.");
  if (input.code !== "123456") return err("That code is not right. Check it and try again.");
  triesPerEmail.reset(parsed.data);
  return ok(undefined);
}

// Sign in with an email and a password (optional: a person who never added a password keeps using codes). Placeholder like
// the rest of this file: it sets no session and refuses to run in production. In development, the practice account is
// "admin" with the password shown in src/shell/account/accountAuth.ts.
// The real version asks Supabase (signInWithPassword), and the owner's second code still follows. What stays as it is here:
// the trap field, the limits per email and per address, and ONE answer for a wrong email and a wrong password, so nobody can
// test which emails have an account (no user guessing).
export async function signInWithPassword(input: { email: string; password: string }, trap = ""): Promise<Result> {
  const real = authOn();
  if (!real && process.env.NODE_ENV === "production") return err(NOT_CONNECTED);
  if (trap !== "") return ok(undefined);
  const parsed = z.union([z.string().trim().toLowerCase().pipe(z.literal(DEV_LOGIN)), email]).safeParse(input.email);
  if (!parsed.success) return err("That email or username does not look right. Check it and try again.");
  if (typeof input.password !== "string" || input.password === "" || input.password.length > 256) return err("Type your password.");

  const byAddress = passwordTriesPerAddress.hit(await address());
  if (!byAddress.allowed) return slow(byAddress.retryAfterSeconds);
  const byEmail = passwordTriesPerEmail.hit(parsed.data);
  if (!byEmail.allowed) return slow(byEmail.retryAfterSeconds);

  const right = real ? await passwordSignIn(parsed.data, input.password) : await verifyPracticePassword(parsed.data, input.password);
  if (!right) return err("That email or password is not right.");
  passwordTriesPerEmail.reset(parsed.data);
  return ok(undefined);
}
