import { sniffImage } from "@/shell/branding/logo";

// The rules for a profile photo, in one place, pure text and numbers. The browser uses them to prepare the picture, and the
// server uses them again before anything is kept (the browser is never trusted: docs/rules/security.md, sections 4 and 5).
//
// What is kept is NOT the file the person chose. The browser opens the picture, cuts a centred square, draws it again at
// 256 px and saves that as a small WebP (see ./avatarClient.ts). So whatever was hidden in the original (a place, a camera, a
// script) goes no further. The server then checks that what arrives really is a small WebP, by its first bytes and its size,
// and refuses everything else.
export const AVATAR_SIZE = 256;
export const AVATAR_PREFIX = "data:image/webp;base64,";
/** Largest allowed for the picture the person chooses. Phone photos are a few MB, so this is generous. */
export const AVATAR_INPUT_MAX_BYTES = 10 * 1024 * 1024;
/** Largest allowed for the finished little WebP. A 256 px WebP is about 10 to 30 KB. */
export const AVATAR_MAX_BYTES = 100 * 1024;
/** The side of the chosen picture, in pixels. Small ones look bad; huge ones can use up a phone's memory. */
export const AVATAR_MIN_SIDE = 64;
export const AVATAR_MAX_SIDE = 8000;
export const AVATAR_MAX_PIXELS = 40_000_000;

export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Checks on the chosen file before it is opened: its declared type, its size. null means fine. */
export function checkAvatarFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type))
    return "Please use a PNG, WebP or JPG picture.";
  if (file.size === 0) return "That picture is empty.";
  if (file.size > AVATAR_INPUT_MAX_BYTES)
    return "That picture is too big. Please use one under 10 MB.";
  return null;
}

/** Checks on the opened picture. null means fine. */
export function checkAvatarSides(width: number, height: number): string | null {
  if (!(width > 0 && height > 0))
    return "We could not read the size of that picture.";
  if (Math.min(width, height) < AVATAR_MIN_SIDE)
    return `That picture is too small. Please use one at least ${AVATAR_MIN_SIDE} pixels wide and tall.`;
  if (
    Math.max(width, height) > AVATAR_MAX_SIDE ||
    width * height > AVATAR_MAX_PIXELS
  )
    return "That picture is too large. Please use a smaller one.";
  return null;
}

/** The centred square to cut out of a picture, so a tall or wide photo keeps its middle. */
export function centreSquare(
  width: number,
  height: number,
): { x: number; y: number; side: number } {
  const side = Math.min(width, height);
  return {
    x: Math.floor((width - side) / 2),
    y: Math.floor((height - side) / 2),
    side,
  };
}

export type ParsedAvatar =
  { ok: true; bytes: Uint8Array } | { ok: false; message: string };
const BAD = "That picture could not be used. Please choose another one.";
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * What the server accepts: a text that starts exactly with `data:image/webp;base64,`, holds only base64, decodes to no more than
 * AVATAR_MAX_BYTES, and whose first bytes say it is a WebP (RIFF....WEBP). Anything else is refused with one plain sentence.
 */
export function parseAvatar(input: unknown): ParsedAvatar {
  if (typeof input !== "string") return { ok: false, message: BAD };
  // Bound the text first, so a huge paste never reaches the decoder.
  if (
    input.length >
    Math.ceil((AVATAR_MAX_BYTES * 4) / 3) + AVATAR_PREFIX.length + 4
  )
    return {
      ok: false,
      message: "That picture is too big. Please choose a smaller one.",
    };
  if (!input.startsWith(AVATAR_PREFIX)) return { ok: false, message: BAD };
  const body = input.slice(AVATAR_PREFIX.length);
  if (body.length === 0 || body.length % 4 !== 0 || !BASE64.test(body))
    return { ok: false, message: BAD };

  let binary: string;
  try {
    binary = atob(body);
  } catch {
    return { ok: false, message: BAD };
  }
  if (binary.length > AVATAR_MAX_BYTES)
    return {
      ok: false,
      message: "That picture is too big. Please choose a smaller one.",
    };
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  if (sniffImage(bytes) !== "webp") return { ok: false, message: BAD };
  return { ok: true, bytes };
}
