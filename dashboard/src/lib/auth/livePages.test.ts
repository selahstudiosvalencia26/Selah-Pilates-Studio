import { describe, expect, it } from "vitest";
import { openOnLive } from "./livePages";

describe("pages open on the live site", () => {
  it("opens the home page, and Bookings once the database is set up", () => {
    expect(openOnLive("/preview", false)).toBe(true);
    expect(openOnLive("/booking", false)).toBe(false);
    for (const path of ["/booking", "/booking/schedule", "/booking/settings", "/booking/new"]) expect(openOnLive(path, true)).toBe(true);
  });
  it("keeps what is not online yet closed", () => {
    for (const path of ["/preview/people", "/preview/settings", "/preview/account", "/content", "/bookings-other", "/booking/classes", "/booking/settings/emails"]) {
      expect(openOnLive(path, true)).toBe(false);
    }
  });
});
