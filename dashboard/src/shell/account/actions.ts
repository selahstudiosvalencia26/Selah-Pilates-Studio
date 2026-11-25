"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createLimiter, waitWords } from "@/kit/rateLimit";
import { err, ok, type Result } from "@/kit/result";
import { accountAuth } from "./accountAuth";
import { parseAvatar } from "./avatar";
import { isBreached } from "./breach";
import { firstProblem, PASSWORD_INPUT_MAX, passwordProblems } from "./password";
import { requestAddress, requestId } from "./request";

// Change (or first set) the signed-in person's password. Every step is checked here on the server; the screen only helps.
//
//  1. Who is asking: a signed-in person. Nobody is signed in on a live site until real sign-in is connected, so it says "not
//     connected" there (see ./accountAuth.ts).
//  2. The input has a strict shape and a size limit, and anything unexpected is refused.
//  3. Tries are counted per person and per address, every time, so nobody can guess the current password: 5 tries every
//     15 minutes per person. A correct change clears the person's count.
//  4. The person proves it is them again: the CURRENT password, or, if they have none yet, the 6 number code sent to their email.
//     A stolen open browser alone cannot change the password.
//  5. The new password must be typed twice the same, follow the rules (./password.ts) and not be in a known breach (./breach.ts).
//  6. It is saved. By default every OTHER device is signed out, an activity log line is written (no secrets) and the person is
//     emailed that it changed, so a change they did not make is noticed. The log and email are best effort: if they fail, the
//     password is still changed.
// The answers are short plain sentences and never include a password. The request is a POST that Next.js checks came from this
// site (CSRF), and the screen never puts a password in an address or in the browser's storage.
const WINDOW = 15 * 60 * 1000;
const triesPerPerson = createLimiter({ max: 5, windowMs: WINDOW });
const triesPerAddress = createLimiter({ max: 20, windowMs: WINDOW });
const codesPerPerson = createLimiter({ max: 3, windowMs: 10 * 60 * 1000 });

const NOT_CONNECTED = "Changing your password is not connected yet.";
const GENERIC = "That did not work. Try again, and if it keeps happening, tell the builder.";
const slow = (seconds: number) =>
  err(`Too many tries. Please wait ${waitWords(seconds)} and try again.`);

const input = z
  .object({
    proof: z.string().max(PASSWORD_INPUT_MAX),
    next: z.string().max(PASSWORD_INPUT_MAX),
    confirm: z.string().max(PASSWORD_INPUT_MAX),
    signOutOthers: z.boolean(),
  })
  .strict();

export async function changePassword(
  raw: unknown,
): Promise<
  Result<{ signedOutOthers: boolean; wasSet: boolean; emailed: boolean }>
> {
  const auth = accountAuth();
  const person = await auth.currentPerson();
  if (!person) return err(NOT_CONNECTED);

  const parsed = input.safeParse(raw);
  if (!parsed.success)
    return err("Something is missing. Check the form and try again.");
  const { proof, next, confirm, signOutOthers } = parsed.data;

  const byAddress = triesPerAddress.hit(await requestAddress());
  if (!byAddress.allowed) return slow(byAddress.retryAfterSeconds);
  const byPerson = triesPerPerson.hit(person.id);
  if (!byPerson.allowed) return slow(byPerson.retryAfterSeconds);

  const id = requestId();
  try {
    const hadPassword = await auth.hasPassword(person.id);

    // Step 4: prove it is them. Say which proof was wrong, because this person is already signed in.
    const proven = hadPassword
      ? await auth.verifyPassword(person, proof)
      : /^\d{6}$/.test(proof) && (await auth.verifyCode(person, proof));
    if (!proven) {
      await auth
        .record({ type: "password.failed", personId: person.id, requestId: id })
        .catch(() => {});
      return err(
        hadPassword
          ? "Your current password is not right."
          : "That code is not right. Check it and try again.",
      );
    }

    // Step 5: the new password.
    if (next !== confirm) return err("The two new passwords are not the same.");
    const problem = firstProblem(
      passwordProblems({
        password: next,
        email: person.email,
        current: hadPassword ? proof : undefined,
      }),
    );
    if (problem) return err(problem);
    if ((await isBreached(next)) === true)
      return err(
        "That password has appeared in a known data leak. Choose a different one.",
      );

    // Step 6: save it, then the follow-ups.
    await auth.setPassword(person, next);
    let endedOthers = false;
    if (signOutOthers) {
      await auth.endOtherSessions(person);
      endedOthers = true;
    }
    await auth
      .record({
        type: hadPassword ? "password.changed" : "password.set",
        personId: person.id,
        requestId: id,
        signedOutOthers: endedOthers,
      })
      .catch(() => {});
    const emailed = await auth
      .notify(person, "password-changed")
      .catch(() => false);

    triesPerPerson.reset(person.id);
    return ok({ signedOutOthers: endedOthers, wasSet: !hadPassword, emailed });
  } catch {
    // The real reason belongs in the server log with the request id; the screen only gets the short sentence.
    console.error(`[account] password change failed (request ${id})`);
    return err(GENERIC);
  }
}

// For a person with no password yet: send the 6 number code to their own email (never to an address they type).
export async function sendPasswordCode(): Promise<Result> {
  const auth = accountAuth();
  const person = await auth.currentPerson();
  if (!person) return err(NOT_CONNECTED);
  const limit = codesPerPerson.hit(person.id);
  if (!limit.allowed) return slow(limit.retryAfterSeconds);
  // Placeholder: nothing is sent. The real version asks Supabase to email the code (auth.reauthenticate()).
  return ok(undefined);
}

// ---- Where the person is signed in -------------------------------------------------------------------------------------
// Ending one device, or every device but this one. Both only ever touch the signed-in person's OWN sessions: the id comes from
// the browser, so it is checked against the person's own list on the server (a typed id of someone else's does nothing).
const endings = createLimiter({ max: 20, windowMs: 10 * 60 * 1000 });
const sessionId = z.string().min(1).max(64);

export async function endDevice(raw: unknown): Promise<Result> {
  const auth = accountAuth();
  const person = await auth.currentPerson();
  if (!person) return err(NOT_CONNECTED);
  const parsed = sessionId.safeParse(raw);
  if (!parsed.success) return err("Something is missing. Please try again.");
  const limit = endings.hit(person.id);
  if (!limit.allowed) return slow(limit.retryAfterSeconds);

  const ended = await auth.endSession(person, parsed.data);
  if (!ended)
    return err(
      "That device could not be signed out. It may already be gone, or it is the one you are using.",
    );
  await auth
    .record({
      type: "session.ended",
      personId: person.id,
      requestId: requestId(),
    })
    .catch(() => {});
  return ok(undefined);
}

export async function endOtherDevices(): Promise<Result> {
  const auth = accountAuth();
  const person = await auth.currentPerson();
  if (!person) return err(NOT_CONNECTED);
  const limit = endings.hit(person.id);
  if (!limit.allowed) return slow(limit.retryAfterSeconds);

  await auth.endOtherSessions(person);
  await auth
    .record({
      type: "sessions.ended",
      personId: person.id,
      requestId: requestId(),
      signedOutOthers: true,
    })
    .catch(() => {});
  return ok(undefined);
}

// ---- The profile photo -----------------------------------------------------------------------------------------------------
// The browser has already re-drawn the picture as a small WebP (./avatarClient.ts). Here it is checked AGAIN, and only a small
// real WebP is kept (./avatar.ts). Only the signed-in person's own photo can be changed. The menu, Account and People pick up
// the change because the frame is refreshed.
const photoChanges = createLimiter({ max: 10, windowMs: 10 * 60 * 1000 });
const refreshFrame = () => {
  try {
    revalidatePath("/", "layout");
  } catch {
    /* outside a request (a test): nothing to refresh */
  }
};

export async function saveAvatar(raw: unknown): Promise<Result> {
  const auth = accountAuth();
  const person = await auth.currentPerson();
  if (!person) return err(NOT_CONNECTED);
  const limit = photoChanges.hit(person.id);
  if (!limit.allowed) return slow(limit.retryAfterSeconds);

  const parsed = parseAvatar(raw);
  if (!parsed.ok) return err(parsed.message);
  try {
    await auth.setAvatar(person, raw as string);
    await auth
      .record({
        type: "avatar.changed",
        personId: person.id,
        requestId: requestId(),
      })
      .catch(() => {});
    refreshFrame();
    return ok(undefined);
  } catch {
    return err(GENERIC);
  }
}

export async function removeAvatar(): Promise<Result> {
  const auth = accountAuth();
  const person = await auth.currentPerson();
  if (!person) return err(NOT_CONNECTED);
  const limit = photoChanges.hit(person.id);
  if (!limit.allowed) return slow(limit.retryAfterSeconds);
  try {
    await auth.clearAvatar(person);
    await auth
      .record({
        type: "avatar.removed",
        personId: person.id,
        requestId: requestId(),
      })
      .catch(() => {});
    refreshFrame();
    return ok(undefined);
  } catch {
    return err(GENERIC);
  }
}
