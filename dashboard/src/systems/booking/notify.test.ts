import { describe, expect, it } from "vitest";
import { alertWords } from "./notify";
import type { Booking } from "./schema";

const booking = { id: "abcdef012345", customerName: "Maria", phone: "0917 000 0000", eventType: "Sculpt", guests: 2, startsAt: "2026-11-30T01:00:00.000Z", deposit: "waiting", depositAmount: 70_000, notes: "" } as Booking;

describe("the studio's email about a booking", () => {
  it("says who, what, when, how to reach them and what is owed, with a link", () => {
    const m = alertWords("booked", booking, "Asia/Manila", "https://dash.test");
    expect(m.subject).toContain("New booking: Maria, Sculpt");
    expect(m.text).toContain("0917 000 0000");
    expect(m.text).toContain("700");
    expect(m.text).toContain("https://dash.test/booking/abcdef012345");
  });
  it("says a screenshot arrived without calling it paid", () => {
    const m = alertWords("receipt", booking, "Asia/Manila", "");
    expect(m.text).toContain("Check the money arrived");
    expect(m.text).not.toContain("Open it");
  });
});
