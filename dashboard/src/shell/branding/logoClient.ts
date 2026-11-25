"use client";

import { AVATAR_MAX_BYTES } from "@/shell/account/avatar";
import { checkLogo, LOGO_SIZE } from "./branding";
import {
  checkLogoContent,
  checkLogoSides,
  fitInside,
  isVeryWide,
} from "./logo";

// Browser side of the logo safeguards: read the file, check what it really is, open it, and re-draw it on a clean
// 256 px square. What comes out is a new picture made here, not the file that was chosen, so nothing hidden in the
// original goes any further. The server repeats every check and draws it again before it is saved.
export type LogoResult =
  | { ok: true; url: string; dataUrl: string; note: string | null }
  | { ok: false; message: string };

const fail = (message: string): LogoResult => ({ ok: false, message });

const readAsDataUrl = (blob: Blob) =>
  new Promise<string | null>((done) => {
    const reader = new FileReader();
    reader.onload = () =>
      done(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => done(null);
    reader.readAsDataURL(blob);
  });

export async function prepareLogo(file: File): Promise<LogoResult> {
  const first = checkLogo(file);
  if (first) return fail(first);

  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  } catch {
    return fail("We could not read that file. Please try again.");
  }
  const content = checkLogoContent(file.type, head);
  if (content) return fail(content);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return fail(
      "We could not open that picture. It may be damaged. Please try another one.",
    );
  }
  try {
    const sides = checkLogoSides(bitmap.width, bitmap.height);
    if (sides) return fail(sides);

    const canvas = document.createElement("canvas");
    canvas.width = LOGO_SIZE;
    canvas.height = LOGO_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return fail(
        "This browser cannot prepare the picture. Please try another browser.",
      );
    ctx.imageSmoothingQuality = "high";
    const at = fitInside(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, at.x, at.y, at.w, at.h);

    // A small WebP keeps any see-through parts of the logo. Try a good quality first, then lower, until it is small enough.
    for (const quality of [0.92, 0.8, 0.6]) {
      const blob = await new Promise<Blob | null>((done) =>
        canvas.toBlob(done, "image/webp", quality),
      );
      if (!blob || blob.type !== "image/webp")
        return fail(
          "This browser cannot save the picture. Please try another browser.",
        );
      if (blob.size > AVATAR_MAX_BYTES) continue;
      const dataUrl = await readAsDataUrl(blob);
      if (!dataUrl)
        return fail(
          "We could not prepare that picture. Please try another one.",
        );
      return {
        ok: true,
        url: URL.createObjectURL(blob),
        dataUrl,
        note: isVeryWide(bitmap.width, bitmap.height)
          ? "This picture is very wide, so it sits inside the square with space around it. A square picture looks best."
          : null,
      };
    }
    return fail(
      "We could not make that picture small enough. Please try another one.",
    );
  } finally {
    bitmap.close();
  }
}
