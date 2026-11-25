import { z } from "zod";

// The rules for a website photo, in one place, pure text and numbers. The browser uses them to prepare the picture, and the server
// uses them again before anything is kept (the browser is never trusted).
//
// What is kept is NOT the file the person chose. The browser opens the picture and draws it again, smaller, as a WebP (see
// ./photoClient.ts), so whatever was hidden in the original (a place, a camera, a script) goes no further. The server then checks that
// what arrives really is a WebP, by its first bytes, and that it is not too big.
export const PHOTO_LIMITS = {
  /** The longest side of the finished photo, in pixels. */
  longSide: 1600,
  /** A photo smaller than this on its longest side looks soft on a big screen. */
  minLongSide: 600,
  /** The largest finished photo, in bytes. */
  maxBytes: 600 * 1024,
  /** The largest file the person may choose, in MB. Phone photos are a few MB. */
  pickMaxMb: 15,
  /** How many photos may be saved in one go. */
  perSave: 12,
} as const;

export const ALT_MAX = 160;

/** The first bytes of a WebP file: "RIFF", four size bytes, then "WEBP". */
export function isWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const at = (i: number, text: string) =>
    [...text].every((c, n) => bytes[i + n] === c.charCodeAt(0));
  return at(0, "RIFF") && at(8, "WEBP");
}

/** The saved photos: for each place, the file name (random, made here) and the description. */
export const photosSchema = z.record(
  z.string().max(60),
  z.strictObject({
    file: z
      .string()
      .regex(/^[a-f0-9]{12}\.webp$/, "That photo file name is not valid."),
    alt: z
      .string()
      .trim()
      .min(1, "Describe the photo.")
      .max(ALT_MAX, "The description is too long."),
    // The part of the photo that stays in view when the page crops it, as a percentage across and down.
    x: z.number().min(0).max(100).default(50),
    y: z.number().min(0).max(100).default(50),
  }),
);
export type Photos = z.output<typeof photosSchema>;
