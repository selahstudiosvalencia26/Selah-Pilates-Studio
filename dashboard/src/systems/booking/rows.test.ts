import { describe, expect, it } from "vitest";
import { fromRow, toRow } from "./rows";
import type { Booking } from "./schema";

const booking: Booking = {
  id: "abcdef012345",
  customerName: "Test Person",
  phone: "0917 000 0000",
  email: "",
  eventType: "Sculpt",
  guests: 1,
  startsAt: "2026-11-30T01:00:00.000Z",
  endsAt: "2026-11-30T01:55:00.000Z",
  sessionKey: "abcd1234@2026-11-30",
  status: "requested",
  deposit: "waiting",
  depositAmount: 10_000,
  depositMethod: null,
  depositPaidOn: null,
  price: 35_000,
  payBy: "2026-11-27T01:00:00.000Z",
  notes: "",
  staffNote: "",
  createdVia: "public",
  createdAt: "2026-11-26T01:00:00.000Z",
  deletedAt: null,
  history: [{ at: "2026-11-26T01:00:00.000Z", what: "Booked from the website" }],
};

describe("a booking as a database row", () => {
  it("comes back the same, even when the database writes times its own way", () => {
    const row = toRow(booking);
    const asDatabaseSendsIt = { ...row, starts_at: "2026-11-30T01:00:00+00:00", ends_at: "2026-11-30T09:55:00+08:00" };
    expect(fromRow(asDatabaseSendsIt)).toEqual(booking);
  });
  it("leaves out what a booking does not have", () => {
    const { price: _p, payBy: _b, ...plain } = booking;
    void _p;
    void _b;
    expect(fromRow(toRow(plain))).toEqual(plain);
  });
});
