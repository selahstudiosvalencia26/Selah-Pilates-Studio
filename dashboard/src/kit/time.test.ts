import { describe, expect, it } from "vitest";
import { formatInZone, todayInZone } from "./time";

describe("time", () => {
  it("shows UTC times in Manila", () => {
    expect(formatInZone("2026-11-12T10:30:00Z")).toBe("12 Nov 2026, 6:30 pm");
  });

  it("gets the day right near midnight in Manila", () => {
    expect(todayInZone("Asia/Manila", new Date("2026-11-12T17:00:00Z"))).toBe("2026-11-13");
    expect(todayInZone("Asia/Manila", new Date("2026-11-12T15:59:00Z"))).toBe("2026-11-12");
  });

  it("falls back to Manila for an unknown zone, and shows nothing for a bad date", () => {
    expect(formatInZone("2026-11-12T10:30:00Z", "Not/AZone")).toBe("12 Nov 2026, 6:30 pm");
    expect(formatInZone("not a date")).toBe("");
  });
});
