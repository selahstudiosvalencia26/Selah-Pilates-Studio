// Colour safety for the client's accent (docs/product/modular-dashboard.md, "Branding"). Whatever colour an owner picks, text on
// it and the accent used as text must stay readable (WCAG AA, 4.5 to 1). The dashboard works this out; the owner never
// has to think about it. Pure maths, safe on the server and in the browser.

export const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex = (value: unknown): value is string => typeof value === "string" && HEX.test(value);

type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

const linear = (channel: number): number => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

// 1 (same colour) to 21 (black on white).
export function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// Text on top of the accent (a button): white or near-black, whichever reads better.
export function pickOnAccent(accent: string): "#ffffff" | "#111111" {
  return contrast(accent, "#ffffff") >= contrast(accent, "#111111") ? "#ffffff" : "#111111";
}

// ---- the accent as text on the page: lighten or darken it, keeping its hue, until it is readable

function toHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return { h: h * 60, s, l };
}

function fromHsl(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

export function inkFor(accent: string, background: string, minimum = 4.5): string {
  if (contrast(accent, background) >= minimum) return accent;
  const { h, s, l } = toHsl(accent);
  const lighten = luminance(background) < 0.5;
  for (let step = 1; step <= 100; step++) {
    const next = Math.min(1, Math.max(0, l + (lighten ? step : -step) / 100));
    const candidate = fromHsl(h, s, next);
    if (contrast(candidate, background) >= minimum) return candidate;
  }
  return lighten ? "#ffffff" : "#000000";
}
