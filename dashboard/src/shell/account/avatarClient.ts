"use client";

import { sniffImage } from "@/shell/branding/logo";
import {
  AVATAR_MAX_BYTES,
  AVATAR_SIZE,
  centreSquare,
  checkAvatarFile,
  checkAvatarSides,
} from "./avatar";

// Browser side of the profile photo safeguards: read the file, check what it really is (by its first bytes, not its name),
// open it, cut a centred square and draw it again at 256 px, and save that as a small WebP. What comes out is a new picture made
// here, not the file that was chosen, so nothing hidden in the original goes any further. The server repeats the checks
// (./avatar.ts) before anything is kept.
export type AvatarResult =
  { ok: true; dataUrl: string } | { ok: false; message: string };
const fail = (message: string): AvatarResult => ({ ok: false, message });

const readAsDataUrl = (blob: Blob) =>
  new Promise<string | null>((done) => {
    const reader = new FileReader();
    reader.onload = () =>
      done(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => done(null);
    reader.readAsDataURL(blob);
  });

export async function prepareAvatar(file: File): Promise<AvatarResult> {
  const first = checkAvatarFile(file);
  if (first) return fail(first);

  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  } catch {
    return fail("We could not read that file. Please try again.");
  }
  // The real type, from the first bytes. A file that only claims to be a picture is refused.
  if (sniffImage(head) === null)
    return fail("That file is not a PNG, WebP or JPG picture.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return fail(
      "We could not open that picture. It may be damaged. Please try another one.",
    );
  }
  try {
    const sides = checkAvatarSides(bitmap.width, bitmap.height);
    if (sides) return fail(sides);

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return fail(
        "This browser cannot prepare the picture. Please try another browser.",
      );
    ctx.imageSmoothingQuality = "high";
    const cut = centreSquare(bitmap.width, bitmap.height);
    ctx.drawImage(
      bitmap,
      cut.x,
      cut.y,
      cut.side,
      cut.side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    );

    // Try a good quality first, then lower, until it is small enough.
    for (const quality of [0.86, 0.72, 0.58]) {
      const blob = await new Promise<Blob | null>((done) =>
        canvas.toBlob(done, "image/webp", quality),
      );
      if (!blob || blob.type !== "image/webp")
        return fail(
          "This browser cannot save the picture. Please try another browser.",
        );
      if (blob.size <= AVATAR_MAX_BYTES) {
        const dataUrl = await readAsDataUrl(blob);
        return dataUrl
          ? { ok: true, dataUrl }
          : fail("We could not prepare that picture. Please try another one.");
      }
    }
    return fail(
      "We could not make that picture small enough. Please try another one.",
    );
  } finally {
    bitmap.close();
  }
}
