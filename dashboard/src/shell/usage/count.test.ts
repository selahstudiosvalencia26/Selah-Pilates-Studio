import { describe, expect, it } from "vitest";
import { countEmails, megabytes } from "./count";

describe("what can run out", () => {
  it("counts emails sent today and this month, by the UTC day", () => {
    const now = new Date("2026-11-25T10:00:00Z");
    const sent = ["2026-11-25 09:00:00.000000+00:00", "2026-11-25T00:00:00Z", "2026-11-24T23:59:59Z", "2026-11-01T00:00:00Z", "2026-10-31T23:00:00Z"];
    expect(countEmails(sent, now)).toEqual({ today: 2, month: 4 });
  });
  it("writes sizes in plain words", () => {
    expect(megabytes(0)).toBe("0 MB");
    expect(megabytes(3.25 * 1024 * 1024)).toBe("3.3 MB");
    expect(megabytes(500 * 1024 * 1024)).toBe("500 MB");
    expect(megabytes(1024 * 1024 * 1024)).toBe("1 GB");
  });
});
