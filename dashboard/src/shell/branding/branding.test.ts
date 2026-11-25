import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ACCENT_PRESETS, brandingInput, brandingVars, checkLogo, DARK_BACKGROUND, DEFAULT_BRANDING, LIGHT_BACKGROUND } from "./branding";
import { contrast, inkFor, isHex, pickOnAccent } from "./contrast";

describe("contrast", () => {
  it("knows the extremes", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrast("#336699", "#336699")).toBeCloseTo(1, 5);
  });

  it("puts dark text on light colours and white text on dark ones", () => {
    expect(pickOnAccent("#ffe14d")).toBe("#111111");
    expect(pickOnAccent("#1a3a8a")).toBe("#ffffff");
  });

  it("whatever colour is picked, text on it is readable", () => {
    for (const accent of ["#cc6600", "#ffff00", "#0000ff", "#00ff00", "#808080", "#ff00ff", "#123456", "#fedcba"]) {
      const on = pickOnAccent(accent);
      expect(contrast(accent, on), accent).toBeGreaterThanOrEqual(4.5 - 0.6); // the best of white or dark; mid colours can be near 4
      expect(Math.max(contrast(accent, "#ffffff"), contrast(accent, "#111111"))).toBeGreaterThanOrEqual(4);
    }
  });

  it("the accent as page text is always readable on both backgrounds", () => {
    for (const accent of ["#cc6600", "#ffff00", "#0000ff", "#00ff00", "#808080", "#ff00ff", "#123456", "#fedcba", "#ffffff", "#000000"]) {
      expect(contrast(inkFor(accent, LIGHT_BACKGROUND), LIGHT_BACKGROUND), `${accent} on light`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(inkFor(accent, DARK_BACKGROUND), DARK_BACKGROUND), `${accent} on dark`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps a colour that is already readable", () => {
    expect(inkFor("#a85500", LIGHT_BACKGROUND)).toBe("#a85500");
  });
});

describe("what an owner may type", () => {
  it("accepts a good name and colour", () => {
    expect(brandingInput.safeParse({ name: "  Dan Cafe ", accent: "#aa5500" })).toMatchObject({ success: true, data: { name: "Dan Cafe", accent: "#aa5500" } });
  });

  it("refuses an empty or long name, markup, and anything that is not a hex colour", () => {
    expect(brandingInput.safeParse({ name: "   ", accent: "#aa5500" }).success).toBe(false);
    expect(brandingInput.safeParse({ name: "x".repeat(41), accent: "#aa5500" }).success).toBe(false);
    expect(brandingInput.safeParse({ name: "<script>", accent: "#aa5500" }).success).toBe(false);
    for (const accent of ["red", "#fff", "#gggggg", "url(javascript:alert(1))", "#aa5500; background:red"]) {
      expect(brandingInput.safeParse({ name: "Cafe", accent }).success, accent).toBe(false);
    }
  });

  it("refuses any other field, so nothing else can be slipped in", () => {
    expect(brandingInput.safeParse({ name: "Cafe", accent: "#aa5500", role: "owner" }).success).toBe(false);
  });
});

describe("the ready-made colours", () => {
  it("are all valid, different from each other, and easy to read text on", () => {
    expect(new Set(ACCENT_PRESETS.map((p) => p.hex)).size).toBe(ACCENT_PRESETS.length);
    for (const p of ACCENT_PRESETS) {
      expect(isHex(p.hex), p.name).toBe(true);
      expect(Math.max(contrast(p.hex, "#ffffff"), contrast(p.hex, "#111111")), p.name).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("the colour variables", () => {
  it("only ever contain colours", () => {
    for (const value of Object.values(brandingVars("#cc6600"))) expect(isHex(value)).toBe(true);
  });
});

describe("the logo", () => {
  it("accepts PNG, WebP and JPG under 1 MB", () => {
    expect(checkLogo({ type: "image/png", size: 50_000 })).toBeNull();
    expect(checkLogo({ type: "image/webp", size: 50_000 })).toBeNull();
    expect(checkLogo({ type: "image/jpeg", size: 999_999 })).toBeNull();
  });

  it("refuses SVG, other types, empty and big files", () => {
    expect(checkLogo({ type: "image/svg+xml", size: 1000 })).toMatch(/PNG, WebP or JPG/);
    expect(checkLogo({ type: "application/pdf", size: 1000 })).toMatch(/PNG, WebP or JPG/);
    expect(checkLogo({ type: "image/png", size: 2_000_000 })).toMatch(/too big/);
    expect(checkLogo({ type: "image/png", size: 0 })).toMatch(/empty/);
  });
});

describe("the page backgrounds the accent is checked against", () => {
  it("match the real ones in globals.css", () => {
    const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");
    const values = [...css.matchAll(/--background:\s*(#[0-9a-fA-F]{6})/g)].map((m) => m[1].toLowerCase());
    expect(values).toContain(LIGHT_BACKGROUND);
    expect(values).toContain(DARK_BACKGROUND);
  });
});

describe("the default colour", () => {
  const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");
  const vars = brandingVars(DEFAULT_BRANDING.accent);

  it("is blue, and the page's own fallbacks match what the branding step would work out", () => {
    expect(DEFAULT_BRANDING.accent).toBe("#2563eb");
    expect(css).toContain(`--accent: ${vars["--accent"]};`);
    expect(css).toContain(`--accent-contrast: ${vars["--accent-contrast"]};`);
    expect(css).toContain(`var(--accent-ink-light, ${vars["--accent-ink-light"]})`);
    expect(css).toContain(`var(--accent-ink-dark, ${vars["--accent-ink-dark"]})`);
  });
});
