"use client";

import { isWebp, PHOTO_LIMITS } from "./photoRules";

// Getting a photo ready in the browser, before it is sent: the quick checks (so the person gets a clear message at once) and the
// shrinking (so a big phone photo is not uploaded in full). What comes out is a new picture drawn here, not the file that was chosen.
// The server checks everything again (./photos.ts).
export type Prepared =
  { ok: true; blob: Blob; url: string } | { ok: false; message: string };

const TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function preparePhoto(file: File): Promise<Prepared> {
  if (!TYPES.includes(file.type)) {
    return {
      ok: false,
      message:
        "Use a JPG, PNG or WebP photo. (An iPhone photo in HEIC form needs to be saved as JPG first.)",
    };
  }
  if (file.size === 0) return { ok: false, message: "That file is empty." };
  if (file.size > PHOTO_LIMITS.pickMaxMb * 1024 * 1024)
    return {
      ok: false,
      message: `That file is over ${PHOTO_LIMITS.pickMaxMb} MB.`,
    };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { ok: false, message: "That file could not be opened as a photo." };
  }
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest < PHOTO_LIMITS.minLongSide) {
    bitmap.close();
    return {
      ok: false,
      message: `That photo is too small. It needs to be at least ${PHOTO_LIMITS.minLongSide} pixels on its longest side.`,
    };
  }

  // Draw it at the size the website needs, then save it as small as the limit asks. Drawing it fresh drops the hidden data.
  const scale = Math.min(1, PHOTO_LIMITS.longSide / longest);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.85, 0.75, 0.65, 0.55]) {
    const blob = await new Promise<Blob | null>((done) =>
      canvas.toBlob(done, "image/webp", quality),
    );
    if (!blob || blob.type !== "image/webp")
      return {
        ok: false,
        message:
          "This browser cannot save the photo. Please try another browser.",
      };
    if (blob.size <= PHOTO_LIMITS.maxBytes) {
      if (!isWebp(new Uint8Array(await blob.slice(0, 12).arrayBuffer())))
        return {
          ok: false,
          message: "That photo could not be prepared. Try another one.",
        };
      return { ok: true, blob, url: URL.createObjectURL(blob) };
    }
  }
  return {
    ok: false,
    message:
      "That photo is still too heavy after shrinking it. Try a simpler photo, or one taken in better light.",
  };
}
