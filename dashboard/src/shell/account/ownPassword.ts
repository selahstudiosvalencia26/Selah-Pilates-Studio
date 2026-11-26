"use server";

import { databaseOn } from "@/kit/database";
import { createLimiter, waitWords } from "@/kit/rateLimit";
import { err, ok, type Result } from "@/kit/result";
import { setPasswordFor } from "@/lib/auth/admin";
import { currentId, currentUser, passwordIsRight, passwordSignIn } from "@/lib/auth/server";
import { readMembers, writeTeamDoc } from "@/shell/people/teamStore";
import { firstProblem, passwordProblems, PASSWORD_INPUT_MAX } from "./password";

// Change your own password. Someone on a temporary password only types the new one; everyone else types the current one too.
const tries = createLimiter({ max: 8, windowMs: 10 * 60 * 1000 });

export async function changeOwnPassword(input: { current: string; next: string }): Promise<Result> {
  const who = await currentUser();
  const id = await currentId();
  if (!who || !id || !databaseOn()) return err("Please sign in again.");
  const next = typeof input?.next === "string" ? input.next.slice(0, PASSWORD_INPUT_MAX) : "";
  const current = typeof input?.current === "string" ? input.current.slice(0, PASSWORD_INPUT_MAX) : "";
  const limit = tries.hit(who.email);
  if (!limit.allowed) return err(`Too many tries. Please wait ${waitWords(limit.retryAfterSeconds)} and try again.`);
  const weak = firstProblem(passwordProblems({ password: next, email: who.email, current }));
  if (weak) return err(weak);
  if (!who.mustChange && !(await passwordIsRight(who.email, current))) return err("Your current password is not right.");
  try {
    await setPasswordFor(id, next);
    if (who.mustChange) {
      const members = await readMembers();
      await writeTeamDoc("people", members.map((m) => (m.email === who.email ? { ...m, mustChange: false } : m)));
    }
    await passwordSignIn(who.email, next); // a changed password ends the old session, so sign straight back in
    return ok(undefined);
  } catch (e) {
    console.error("password change failed", e instanceof Error ? e.message : "unknown");
    return err("Could not change the password. Try again in a minute.");
  }
}
