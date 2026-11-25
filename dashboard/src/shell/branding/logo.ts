import { LOGO_SIZE } from "./branding";

// Safeguards for an uploaded logo (docs/dashboard/shell-plan.md, section 5). These are plain functions, so the screen
// and the server use the same rules. The screen checks to help the owner at once. The server checks again, whatever the
// screen said, and re-draws the picture itself: a browser's checks are never trusted.
//
// What is refused, and why:
//   - a file whose first bytes are not a real PNG, WebP or JPG (a renamed SVG, HTML or PDF is not a picture)
//   - a file whose real type differs from the one it claims
//   - a picture too small to look sharp, or so large it could freeze a phone while it opens
//   - a picture that cannot be opened at all (broken or cut off)
// What is done to every accepted picture: it is re-drawn onto a 256 px square. That removes hidden data (location and
// camera details in a photo) and any extra content inside the file, and a wide logo is fitted inside the square, not cropped.

export const LOGO_MIN_SIDE = 64;
export const LOGO_MAX_SIDE = 4096;
export const LOGO_MAX_PIXELS = 16_000_000;

export type ImageKind = "png" | "jpeg" | "webp";
const MIME: Record<ImageKind, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.slice(from, to));

// What the file really is, from its first bytes.
export function sniffImage(head: Uint8Array): ImageKind | null {
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 && head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a) return "png";
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpeg";
  if (head.length >= 12 && ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP") return "webp";
  return null;
}

// `declared` is the type the browser says the file is. It must match what the bytes say.
export function checkLogoContent(declared: string, head: Uint8Array): string | null {
  const kind = sniffImage(head);
  if (!kind) return "That file is not a real PNG, WebP or JPG picture.";
  if (MIME[kind] !== declared) return "That file is not what its name says. Please use a real PNG, WebP or JPG picture.";
  return null;
}

export function checkLogoSides(width: number, height: number): string | null {
  if (width < LOGO_MIN_SIDE || height < LOGO_MIN_SIDE) return `That picture is too small. Please use one at least ${LOGO_MIN_SIDE} pixels wide and tall.`;
  if (width > LOGO_MAX_SIDE || height > LOGO_MAX_SIDE || width * height > LOGO_MAX_PIXELS) return `That picture is too large. Please use one up to ${LOGO_MAX_SIDE} pixels wide and tall.`;
  return null;
}

// Where to draw a picture so it fits inside the square without being cropped or stretched, centred.
export function fitInside(width: number, height: number, box: number = LOGO_SIZE): { x: number; y: number; w: number; h: number } {
  const scale = Math.min(box / width, box / height);
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  return { x: Math.round((box - w) / 2), y: Math.round((box - h) / 2), w, h };
}

// A very wide or very tall picture ends up small inside the square. Worth telling the owner.
export const isVeryWide = (width: number, height: number): boolean => Math.max(width / height, height / width) > 2;
