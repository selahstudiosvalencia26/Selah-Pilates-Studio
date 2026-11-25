import { z } from "zod";
import { HEX, inkFor, pickOnAccent } from "./contrast";

// What an owner can change about how the dashboard looks: a name, one accent colour and a logo, and nothing else.
// Backgrounds, text and spacing stay fixed, so the dashboard always stays readable and consistent
// (docs/product/modular-dashboard.md, "Branding"). Saved as shell_settings keys: brand_name, brand_accent, brand_logo_path.

export type Branding = { name: string; accent: string; logoUrl: string | null };

export const DEFAULT_BRANDING: Branding = { name: "Your Business", accent: "#2563eb", logoUrl: null };

// Ready-made accent colours, so an owner can choose in one tap. Each has been checked: text on it is readable. They are
// not the only choices: an owner can type any exact colour code from their own brand (the code box on the Branding screen).
export const ACCENT_PRESETS: { name: string; hex: string }[] = [
  { name: "Blue", hex: "#2563eb" },
  { name: "Orange", hex: "#cc6600" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Green", hex: "#15803d" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Pink", hex: "#be185d" },
  { name: "Red", hex: "#dc2626" },
  { name: "Slate", hex: "#475569" },
];

// The page backgrounds the accent is checked against. They must match src/app/globals.css (a test checks it).
export const LIGHT_BACKGROUND = "#f6f7f9";
export const DARK_BACKGROUND = "#0b0d12";

// What the owner types, checked on the server before anything is saved. Strict: only these two fields.
export const brandingInput = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "Please enter a name.")
    .max(40, "Please keep the name to 40 letters or fewer.")
    .refine((n) => !/[<>]/.test(n), "The name cannot contain < or >."),
  accent: z.string().regex(HEX, "Please pick a colour."),
});

// The colour variables that are set on the page, worked out from the accent. Only valid colours get this far.
export function brandingVars(accent: string): Record<string, string> {
  return {
    "--accent": accent,
    "--accent-contrast": pickOnAccent(accent),
    "--accent-ink-light": inkFor(accent, LIGHT_BACKGROUND),
    "--accent-ink-dark": inkFor(accent, DARK_BACKGROUND),
  };
}

// ---- the logo ----
// PNG, WebP or JPG only (never SVG, which can hide scripts). Resized on the server, so the file is small and square.
export const LOGO_TYPES = ["image/png", "image/webp", "image/jpeg"] as const;
export const LOGO_MAX_BYTES = 1_000_000;
export const LOGO_SIZE = 256;

export function checkLogo(file: { type: string; size: number }): string | null {
  if (!(LOGO_TYPES as readonly string[]).includes(file.type)) return "Please use a PNG, WebP or JPG picture.";
  if (file.size > LOGO_MAX_BYTES) return "That picture is too big. Please use one under 1 MB.";
  if (file.size === 0) return "That picture is empty.";
  return null;
}
