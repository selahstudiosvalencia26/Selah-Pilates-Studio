import { describe, expect, it } from "vitest";
import { scrollFromDrag, thumbOf } from "./scrollLineMath";

describe("thumb of the scroll line", () => {
  it("draws nothing when the page fits, or when there is nothing to measure", () => {
    expect(thumbOf(0, 800, 800, 700).scrollable).toBe(false);
    expect(thumbOf(0, 700, 800, 700).scrollable).toBe(false);
    expect(thumbOf(0, 2000, 0, 700).scrollable).toBe(false);
    expect(thumbOf(0, 2000, 800, 0).scrollable).toBe(false);
    expect(thumbOf(Number.NaN, 2000, 800, 700).scrollable).toBe(true); // a bad scroll position is treated as the top
  });

  it("is as tall as the share of the page that is in view, but never thinner than a thumb can be grabbed", () => {
    expect(thumbOf(0, 1600, 800, 700).height).toBeCloseTo(350);
    expect(thumbOf(0, 100_000, 800, 700).height).toBe(48);
    expect(thumbOf(0, 801, 800, 700).height).toBeLessThanOrEqual(700);
  });

  it("starts at the top, ends at the bottom, and is in the middle halfway", () => {
    const top = thumbOf(0, 1600, 800, 700);
    const middle = thumbOf(400, 1600, 800, 700);
    const bottom = thumbOf(800, 1600, 800, 700);
    expect(top.offset).toBe(0);
    expect(middle.offset).toBeCloseTo((700 - 350) / 2);
    expect(bottom.offset + bottom.height).toBeCloseTo(700);
  });

  it("stays inside the track even when the page is scrolled past its ends (bouncing, resizing)", () => {
    expect(thumbOf(-50, 1600, 800, 700).offset).toBe(0);
    const past = thumbOf(5000, 1600, 800, 700);
    expect(past.offset + past.height).toBeCloseTo(700);
  });
});

describe("dragging the thumb", () => {
  it("moves the page in step with the thumb: dragging the whole room scrolls the whole page", () => {
    // page 1600, window 800, track 700, thumb 350: the thumb can move 350, the page can move 800
    expect(scrollFromDrag(0, 350, 1600, 800, 700, 350)).toBeCloseTo(800);
    expect(scrollFromDrag(0, 175, 1600, 800, 700, 350)).toBeCloseTo(400);
  });

  it("never goes outside the page, whatever the pointer does", () => {
    expect(scrollFromDrag(100, -9999, 1600, 800, 700, 350)).toBe(0);
    expect(scrollFromDrag(100, 9999, 1600, 800, 700, 350)).toBe(800);
  });

  it("does nothing when there is nothing to scroll or no room to drag", () => {
    expect(scrollFromDrag(0, 100, 800, 800, 700, 350)).toBe(0);
    expect(scrollFromDrag(40, 100, 1600, 800, 700, 700)).toBe(40);
  });
});
