import { describe, expect, it } from "vitest";
import { clamp01, hexToHsv, hsvToHex } from "./color";

describe("colour maths", () => {
  it("knows the corners of the colour square", () => {
    expect(hsvToHex({ h: 0, s: 0, v: 1 })).toBe("#ffffff");
    expect(hsvToHex({ h: 200, s: 0.5, v: 0 })).toBe("#000000");
    expect(hsvToHex({ h: 0, s: 1, v: 1 })).toBe("#ff0000");
    expect(hsvToHex({ h: 120, s: 1, v: 1 })).toBe("#00ff00");
    expect(hsvToHex({ h: 240, s: 1, v: 1 })).toBe("#0000ff");
  });

  it("reads a colour into hue, saturation and value", () => {
    expect(hexToHsv("#ff0000")).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv("#ffffff")).toEqual({ h: 0, s: 0, v: 1 });
    expect(hexToHsv("#000000")).toEqual({ h: 0, s: 0, v: 0 });
    expect(Math.round(hexToHsv("#2563eb").h)).toBe(221);
  });

  it("goes there and back without drifting", () => {
    for (const hex of ["#cc6600", "#2563eb", "#0f766e", "#15803d", "#7c3aed", "#be185d", "#dc2626", "#475569", "#123456", "#fedcba"]) {
      expect(hsvToHex(hexToHsv(hex)), hex).toBe(hex);
    }
  });

  it("keeps a number between 0 and 1", () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(9)).toBe(1);
  });
});
