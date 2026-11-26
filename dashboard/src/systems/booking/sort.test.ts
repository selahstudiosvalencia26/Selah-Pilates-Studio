import { describe, expect, it } from "vitest";
import type { Booking } from "./schema";
import { nextSort, sortBookings } from "./sort";

const make = (id: string, customerName: string, price: number, startsAt: string) => ({ id, customerName, price, startsAt, eventType: "Sculpt", status: "confirmed", deposit: "none" }) as Booking;
const list = [make("bbbbbb000000", "carla", 900, "2026-12-02T00:00:00.000Z"), make("aaaaaa000000", "Ana", 350, "2026-12-03T00:00:00.000Z"), make("cccccc000000", "Ben", 1600, "2026-12-01T00:00:00.000Z")];
const names = (key: Parameters<typeof nextSort>[1], up = true) => sortBookings(list, { key, up }).map((b) => b.customerName);

describe("sorting the bookings", () => {
  it("leaves the order alone until a column is pressed", () => {
    expect(sortBookings(list, null)).toEqual(list);
  });
  it("sorts by name without minding capitals, by price as a number, and by date", () => {
    expect(names("customer")).toEqual(["Ana", "Ben", "carla"]);
    expect(names("amount")).toEqual(["Ana", "carla", "Ben"]);
    expect(names("date")).toEqual(["Ben", "carla", "Ana"]);
    expect(names("date", false)).toEqual(["Ana", "carla", "Ben"]);
  });
  it("turns round when the same column is pressed again", () => {
    expect(nextSort(null, "id")).toEqual({ key: "id", up: true });
    expect(nextSort({ key: "id", up: true }, "id")).toEqual({ key: "id", up: false });
    expect(nextSort({ key: "id", up: false }, "date")).toEqual({ key: "date", up: true });
  });
});
