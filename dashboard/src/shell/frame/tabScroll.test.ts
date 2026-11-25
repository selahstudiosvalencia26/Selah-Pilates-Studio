import { describe, expect, it } from "vitest";
import { scrollToCentre } from "./tabScroll";

// Where the page's tab row scrolls so the tab you are on is in view (tabScroll.ts).
describe("scrolling the tabs to the one you are on", () => {
  // A phone: the row shows 358 px, the four tabs are 400 px wide together.
  it("does not scroll at all when every tab already fits", () => expect(scrollToCentre(500, 400, 300, 80)).toBe(0));
  it("leaves the first tab where it is", () => expect(scrollToCentre(358, 400, 0, 90)).toBe(0));
  it("brings the last tab, which was off to the right, into view", () => {
    // Settings starts at 340 and is 60 wide: centring would scroll by 211, but there are only 42 px more to see.
    expect(scrollToCentre(358, 400, 340, 60)).toBe(42);
  });
  it("centres a tab in the middle of a long row", () => expect(scrollToCentre(300, 900, 400, 100)).toBe(300));
  it("never scrolls past the start or the end", () => {
    expect(scrollToCentre(300, 900, 10, 60)).toBe(0);
    expect(scrollToCentre(300, 900, 880, 60)).toBe(600);
  });
});
