import { describe, expect, it } from "vitest";
import { formatMinor, parseAmount, sumMinor } from "./money";

describe("parsing an amount", () => {
  it("reads clean amounts exactly", () => {
    expect(parseAmount("1,234.50")).toBe(123450);
    expect(parseAmount("0.1")).toBe(10);
    expect(parseAmount("28500")).toBe(2850000);
    expect(parseAmount(" 5.05 ")).toBe(505);
  });

  it("refuses anything unclean", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("12.345")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("1e3")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("showing an amount", () => {
  it("uses the peso sign and drops empty cents", () => {
    expect(formatMinor(123450, "PHP")).toBe("₱1,234.50");
    expect(formatMinor(2850000, "PHP")).toBe("₱28,500");
    expect(formatMinor(0, "PHP")).toBe("₱0");
    expect(formatMinor(-500, "USD")).toBe("-$5");
  });
});

describe("adding", () => {
  it("never drifts the way decimals do", () => {
    expect(sumMinor([parseAmount("0.1")!, parseAmount("0.2")!])).toBe(30);
  });
});
