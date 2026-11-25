import { randomBytes } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { databaseOn, uploadPhoto } from "@/kit/database";
import {
  ALT_MAX,
  isWebp,
  PHOTO_LIMITS,
  photosSchema,
  type Photos,
} from "./photoRules";
import { CLASS_SLOT_PREFIX, classSlot, slotById, type Slot } from "./site/slots";
import { readClasses, readList, readPhotos, uploadsDir, writePhotos } from "./store";
import { listSlot, listSlotPrefix } from "./listDef";
import { LISTS } from "./site/lists";

// A photo place: one of the fixed ones, or the card of a class that is in the saved class list.
async function resolveSlot(id: string): Promise<Slot | undefined> {
  const fixed = slotById(id);
  if (fixed) return fixed;
  // The photo place of an item in one of the website's lists (./site/lists.ts).
  const def = LISTS.find((l) => id.startsWith(listSlotPrefix(l)));
  if (def) {
    const item = (await readList(def).catch(() => [])).find((x) => `${listSlotPrefix(def)}${x.slug}` === id);
    return item ? listSlot(def, item) : undefined;
  }
  if (!id.startsWith(CLASS_SLOT_PREFIX)) return fixed;
  const c = (await readClasses().catch(() => [])).find(
    (x) => `${CLASS_SLOT_PREFIX}${x.slug}` === id,
  );
  return c ? classSlot(c) : undefined;
}

// Adding, replacing and removing the photos of the website's photo places, on the server. The browser already shrank each photo, but
// nothing here trusts that: every file is checked again (a real WebP, not too heavy), the place must be one the website has, and the
// file name is made here, never taken from the browser.

// A problem the person can read and fix.
export class PhotoError extends Error {}

export type Change = {
  slot: string;
  alt: string;
  x?: number;
  y?: number;
  remove?: boolean;
  fileKey?: string;
};

export async function savePhotoChanges(
  changes: Change[],
  files: Map<string, Uint8Array>,
): Promise<Photos> {
  if (changes.length === 0) throw new PhotoError("There is nothing to save.");
  if (changes.length > PHOTO_LIMITS.perSave)
    throw new PhotoError(
      `Save up to ${PHOTO_LIMITS.perSave} photos at a time.`,
    );

  const current = await readPhotos();
  const next: Photos = { ...current };
  const fresh = new Map<string, Uint8Array>(); // new file name -> bytes

  for (const c of changes) {
    const slot = await resolveSlot(c.slot);
    if (!slot) throw new PhotoError("That photo place is not known.");
    if (c.remove) {
      delete next[c.slot];
      continue;
    }
    const alt = c.alt.trim();
    if (!alt)
      throw new PhotoError(
        `Describe the photo "${slot.label}". Screen readers and Google read the description.`,
      );
    if (alt.length > ALT_MAX)
      throw new PhotoError(`The description of "${slot.label}" is too long.`);

    let file = current[c.slot]?.file;
    if (c.fileKey) {
      const bytes = files.get(c.fileKey);
      if (!bytes)
        throw new PhotoError(
          `The photo "${slot.label}" did not arrive. Try adding it again.`,
        );
      if (bytes.length > PHOTO_LIMITS.maxBytes)
        throw new PhotoError(
          `The photo "${slot.label}" is too heavy. Try a smaller one.`,
        );
      if (!isWebp(bytes))
        throw new PhotoError(
          `The file for "${slot.label}" is not a photo we can use.`,
        );
      file = `${randomBytes(6).toString("hex")}.webp`;
      fresh.set(file, bytes);
    }
    if (!file) throw new PhotoError(`Add a photo for "${slot.label}" first.`);
    // The point that stays in view: what was sent, else what was saved, else the middle.
    const round = (n: number) =>
      Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
    const x = round(c.x ?? current[c.slot]?.x ?? 50);
    const y = round(c.y ?? current[c.slot]?.y ?? 50);
    next[c.slot] = { file, alt, x, y };
  }

  const parsed = photosSchema.safeParse(next);
  if (!parsed.success)
    throw new PhotoError(
      parsed.error.issues[0]?.message ?? "Check the photos and try again.",
    );

  // Write the new files, then the list. A replaced photo's old file is left where it is: the live site may still use it until the
  // change is published, so nothing is deleted here. (Tidying old files is a builder job.)
  if (databaseOn()) {
    for (const [name, bytes] of fresh) await uploadPhoto(name, bytes);
  } else {
    await mkdir(uploadsDir(), { recursive: true });
    for (const [name, bytes] of fresh) {
      const target = join(uploadsDir(), name);
      await writeFile(`${target}.tmp`, bytes);
      await rename(`${target}.tmp`, target);
    }
  }
  await writePhotos(parsed.data);
  return parsed.data;
}
