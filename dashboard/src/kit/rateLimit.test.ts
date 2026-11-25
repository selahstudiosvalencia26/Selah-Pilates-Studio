import { describe, expect, it } from "vitest";
import { createLimiter, waitWords } from "./rateLimit";

describe("rateLimit", () => {
  it("allows the first tries, then says wait, then allows again when the window is over", () => {
    const l = createLimiter({ max: 3, windowMs: 60_000 });
    expect([1, 2, 3].map(() => l.hit("a", 0).allowed)).toEqual([true, true, true]);
    expect(l.hit("a", 1_000)).toEqual({ allowed: false, retryAfterSeconds: 59 });
    expect(l.hit("a", 60_001).allowed).toBe(true);
  });

  it("counts each key on its own", () => {
    const l = createLimiter({ max: 1, windowMs: 60_000 });
    expect(l.hit("a", 0).allowed).toBe(true);
    expect(l.hit("a", 1).allowed).toBe(false);
    expect(l.hit("b", 1).allowed).toBe(true);
  });

  it("can forget a key", () => {
    const l = createLimiter({ max: 1, windowMs: 60_000 });
    l.hit("a", 0);
    l.reset("a");
    expect(l.hit("a", 1).allowed).toBe(true);
  });

  it("does not grow without end when a flood of different keys arrives", () => {
    const l = createLimiter({ max: 1, windowMs: 60_000, maxKeys: 5 });
    for (let i = 0; i < 100; i++) l.hit(`k${i}`, 0);
    // The newest keys are still counted, so a repeat of the last one is refused.
    expect(l.hit("k99", 1).allowed).toBe(false);
  });

  it("says the wait in plain words", () => {
    expect(waitWords(20)).toBe("a minute");
    expect(waitWords(61)).toBe("2 minutes");
  });
});
