import { describe, expect, it } from "vitest";
import { countDays, megabytes } from "./count";

describe("what can run out", () => {
  it("adds up what was sent today and this month", () => {
    const now = new Date("2026-11-25T10:00:00Z");
    expect(countDays({ "2026-11-25": 2, "2026-11-01": 3, "2026-10-31": 9 }, now)).toEqual({ today: 2, month: 5 });
    expect(countDays({}, now)).toEqual({ today: 0, month: 0 });
  });
  it("writes sizes in plain words", () => {
    expect(megabytes(0)).toBe("0 MB");
    expect(megabytes(3.25 * 1024 * 1024)).toBe("3.3 MB");
    expect(megabytes(500 * 1024 * 1024)).toBe("500 MB");
    expect(megabytes(1024 * 1024 * 1024)).toBe("1 GB");
  });
});
