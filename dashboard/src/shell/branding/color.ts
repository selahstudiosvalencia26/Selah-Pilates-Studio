import { hexToRgb } from "./contrast";

// Hue, saturation and value: the three numbers behind a colour picker (a square for how rich and how bright, and a
// strip for the hue). Pure maths, so it is tested and runs the same on the server and in the browser.
export type Hsv = { h: number; s: number; v: number }; // h in degrees 0..360, s and v 0..1

export function hexToHsv(hex: string): Hsv {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  if (d !== 0) h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const part = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
