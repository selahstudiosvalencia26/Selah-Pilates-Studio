// A counter that says "too many, wait" after a number of tries in a window of time. For sign-in codes, invites and public
// forms, so a bot cannot guess codes or flood someone's inbox.
//
// This one lives in the server's memory, so it is right for one running server and for development. A live site runs several
// copies that do not share memory, so the real version keeps the counts in the database (the shell_rate_limits table in
// docs/dashboard/shell-plan.md) and uses the same shape: ask `hit(key)`, get an answer.

export type Limit = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function createLimiter({ max, windowMs, maxKeys = 10_000 }: { max: number; windowMs: number; maxKeys?: number }) {
  const seen = new Map<string, { count: number; resetAt: number }>();

  const sweep = (now: number) => {
    for (const [key, entry] of seen) if (entry.resetAt <= now) seen.delete(key);
  };

  return {
    // Count one try for this key. Past `max` tries inside the window, it says no until the window is over.
    hit(key: string, now: number = Date.now()): Limit {
      // A flood of different keys must not fill the memory: drop the expired ones, and if it is still full, drop the oldest.
      if (seen.size >= maxKeys) {
        sweep(now);
        if (seen.size >= maxKeys) seen.delete(seen.keys().next().value as string);
      }
      const entry = seen.get(key);
      if (!entry || entry.resetAt <= now) {
        seen.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true };
      }
      entry.count += 1;
      if (entry.count > max) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
      return { allowed: true };
    },
    // Forget a key, for example after a correct code.
    reset(key: string) {
      seen.delete(key);
    },
  };
}

// "Wait 4 minutes" in plain words.
export function waitWords(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "a minute" : `${minutes} minutes`;
}
