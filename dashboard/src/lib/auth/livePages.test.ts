import { describe, expect, it } from "vitest";
import { mayOpen, openOnLive } from "./livePages";

describe("pages open on the live site", () => {
  it("opens only the home page until the database is set up", () => {
    expect(openOnLive("/preview", false)).toBe(true);
    expect(openOnLive("/booking", false)).toBe(false);
  });
  it("opens everything once it is, except the practice pages", () => {
    for (const path of ["/booking", "/content/about", "/preview/people/roles", "/preview/systems", "/welcome"]) expect(openOnLive(path, true)).toBe(true);
    for (const path of ["/preview/components", "/preview/slow"]) expect(openOnLive(path, true)).toBe(false);
  });
});

describe("who may open what", () => {
  const staff = { owner: false, permissions: ["booking.view", "booking.edit"] };
  it("lets staff see and add bookings, and nothing else", () => {
    for (const path of ["/preview", "/preview/account", "/booking", "/booking/calendar", "/booking/new", "/booking/abc/edit"]) expect(mayOpen(path, staff)).toBe(true);
    for (const path of ["/booking/settings", "/booking/classes", "/booking/schedule", "/content", "/preview/people", "/preview/settings", "/preview/systems", "/anything"]) {
      expect(mayOpen(path, staff)).toBe(false);
    }
  });
  it("gives a person with no role only the home and account pages", () => {
    const nobody = { owner: false, permissions: [] };
    expect(mayOpen("/preview", nobody)).toBe(true);
    expect(mayOpen("/booking", nobody)).toBe(false);
  });
  it("lets the owner open everything", () => {
    expect(mayOpen("/preview/people", { owner: true, permissions: [] })).toBe(true);
  });
});
