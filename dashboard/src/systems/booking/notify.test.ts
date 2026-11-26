import { describe, expect, it } from "vitest";
import { alertWords, customerWords } from "./notify";
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

describe("the email to a customer", () => {
  const settings = { zone: "Asia/Manila", venue: "Selah", payAccounts: [{ id: "00000001", kind: "gcash" as const, provider: "", name: "C. B.", number: "09170000000", qr: "" }] };
  it("tells them what to pay and where, and nothing they typed", () => {
    const m = customerWords("received", { ...booking, customerName: "visit evil.example", notes: "spam" }, settings);
    expect(m.text).toContain("pay");
    expect(m.text).toContain("GCash");
    expect(m.text + m.subject).not.toContain("evil");
    expect(m.text).not.toContain("spam");
  });
  it("says confirmed or cancelled plainly", () => {
    expect(customerWords("confirmed", booking, settings).subject).toContain("Confirmed: Sculpt");
    expect(customerWords("cancelled", booking, settings).text).toContain("was cancelled");
  });
});
