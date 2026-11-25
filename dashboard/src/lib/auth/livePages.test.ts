import { describe, expect, it } from "vitest";
import { openOnLive } from "./livePages";

describe("pages open on the live site", () => {
  it("opens only the home page until the database is set up", () => {
    expect(openOnLive("/preview", false)).toBe(true);
    expect(openOnLive("/booking", false)).toBe(false);
    expect(openOnLive("/content", false)).toBe(false);
  });
  it("opens everything once it is, except the practice pages", () => {
    for (const path of ["/booking", "/content/about", "/preview/people", "/preview/settings/menu", "/preview/systems", "/preview/account"]) {
      expect(openOnLive(path, true)).toBe(true);
    }
    for (const path of ["/preview/components", "/preview/slow", "/preview/people/roles"]) expect(openOnLive(path, true)).toBe(false);
  });
});
