import { describe, expect, it } from "vitest";
import { checkLogoContent, checkLogoSides, fitInside, isVeryWide, sniffImage } from "./logo";

const bytes = (...n: number[]) => new Uint8Array(n);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0);
const WEBP = new TextEncoder().encode("RIFF\0\0\0\0WEBP");
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
const HTML = new TextEncoder().encode("<html><script>alert(1)</script></html>");
const PDF = new TextEncoder().encode("%PDF-1.7 ....");

describe("what a file really is", () => {
  it("knows PNG, JPEG and WebP from their first bytes", () => {
    expect(sniffImage(PNG)).toBe("png");
    expect(sniffImage(JPEG)).toBe("jpeg");
    expect(sniffImage(WEBP)).toBe("webp");
  });

  it("does not take SVG, HTML, PDF, empty or cut-off files for pictures", () => {
    for (const f of [SVG, HTML, PDF, bytes(), bytes(0x89, 0x50), bytes(0xff, 0xd8)]) expect(sniffImage(f)).toBeNull();
  });
});

describe("the content check", () => {
  it("accepts a file whose bytes match its type", () => {
    expect(checkLogoContent("image/png", PNG)).toBeNull();
    expect(checkLogoContent("image/jpeg", JPEG)).toBeNull();
    expect(checkLogoContent("image/webp", WEBP)).toBeNull();
  });

  it("refuses a renamed file: an SVG or page called .png, or a JPEG called .png", () => {
    expect(checkLogoContent("image/png", SVG)).toMatch(/not a real/);
    expect(checkLogoContent("image/png", HTML)).toMatch(/not a real/);
    expect(checkLogoContent("image/png", JPEG)).toMatch(/not what its name says/);
  });
});

describe("the size check", () => {
  it("accepts a normal logo and refuses too small and too large pictures", () => {
    expect(checkLogoSides(256, 256)).toBeNull();
    expect(checkLogoSides(64, 64)).toBeNull();
    expect(checkLogoSides(63, 200)).toMatch(/too small/);
    expect(checkLogoSides(200, 10)).toMatch(/too small/);
    expect(checkLogoSides(4097, 500)).toMatch(/too large/);
    expect(checkLogoSides(4096, 4096)).toMatch(/too large/); // more than 16 million pixels
  });
});

describe("fitting a picture into the square", () => {
  it("keeps a wide picture whole and centres it", () => {
    expect(fitInside(512, 128)).toEqual({ x: 0, y: 96, w: 256, h: 64 });
  });

  it("keeps a tall picture whole and centres it", () => {
    expect(fitInside(100, 400)).toEqual({ x: 96, y: 0, w: 64, h: 256 });
  });

  it("fills the square for a square picture, and enlarges a small one", () => {
    expect(fitInside(1000, 1000)).toEqual({ x: 0, y: 0, w: 256, h: 256 });
    expect(fitInside(128, 128)).toEqual({ x: 0, y: 0, w: 256, h: 256 });
  });

  it("warns about a very wide or very tall one only", () => {
    expect(isVeryWide(512, 128)).toBe(true);
    expect(isVeryWide(100, 400)).toBe(true);
    expect(isVeryWide(300, 200)).toBe(false);
  });
});
