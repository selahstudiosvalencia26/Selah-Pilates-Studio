"use server";

import { revalidatePath } from "next/cache";
import { err, ok, type Result } from "@/kit/result";
import { canSave } from "@/kit/session";
import { hoursSchema, siteSchema } from "./schema";
import { isPageKind, PAGES } from "./site/pages";
import { PhotoError, savePhotoChanges, type Change } from "./photos";
import { PHOTO_LIMITS } from "./photoRules";
import { classListSchema, isTemporary, uniqueSlug } from "./site/classList";
import { isTemporary as isTempItem, listSchemaFor, uniqueSlug as uniqueItemSlug, type ListItem } from "./listDef";
import { listById } from "./site/lists";
import {
  readClasses,
  readList,
  writeClasses,
  writeList,
  writeHours,
  writePage,
  writeSite,
} from "./store";
import { z } from "zod";

// Save what the owner typed. The same checks run here as in the form, because the form can be bypassed. On a live site every save
// also asks, on the server, whether the database is set up and an owner is signed in.
const NOT_CONNECTED = "Saving is not connected yet.";
const firstProblem = (issues: { path: PropertyKey[]; message: string }[]) => {
  const i = issues[0];
  return i ? { field: String(i.path[0] ?? ""), message: i.message } : null;
};

export async function saveSite(
  input: unknown,
): Promise<Result<undefined> & { field?: string }> {
  if (!(await canSave())) return err(NOT_CONNECTED);
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) {
    const p = firstProblem(parsed.error.issues);
    return {
      ...err(p?.message ?? "Check the details and try again."),
      field: p?.field,
    };
  }
  try {
    await writeSite(parsed.data);
  } catch (e) {
    console.error("content: could not save site", e);
    return err("Could not save the business details. The website folder may be missing or read-only. Try again; if it keeps failing, tell the builder.");
  }
  revalidatePath("/content", "layout");
  return ok(undefined);
}

export async function saveHours(
  input: unknown,
): Promise<Result<undefined> & { field?: string }> {
  if (!(await canSave())) return err(NOT_CONNECTED);
  const parsed = hoursSchema.safeParse(input);
  if (!parsed.success) {
    const p = firstProblem(parsed.error.issues);
    return {
      ...err(p?.message ?? "Check the times and try again."),
      field: p?.field,
    };
  }
  try {
    await writeHours(parsed.data);
  } catch (e) {
    console.error("content: could not save hours", e);
    return err("Could not save the opening hours. The website folder may be missing or read-only. Try again; if it keeps failing, tell the builder.");
  }
  revalidatePath("/content", "layout");
  return ok(undefined);
}

// Save the words of one page. `kind` picks the file and the checks.
export async function savePage(
  kind: string,
  input: unknown,
): Promise<Result<undefined> & { field?: string }> {
  if (!(await canSave())) return err(NOT_CONNECTED);
  if (!isPageKind(kind)) return err("That page is not known.");
  const parsed = PAGES[kind].schema.safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return {
      ...err(i?.message ?? "Check the words and try again."),
      field: i?.path.join("."),
    };
  }
  try {
    await writePage(kind, parsed.data);
  } catch (e) {
    console.error(`content: could not save ${kind} page`, e);
    return err("Could not save the page words. The website folder may be missing or read-only. Try again; if it keeps failing, tell the builder.");
  }
  revalidatePath("/content", "layout");
  return ok(undefined);
}

// Save the photos of the website's photo places. The browser sends what changed as text (`changes`) and the new pictures as files
// (`file-0`, `file-1`, ...). Everything is checked again in ./photos.ts.
const changesSchema = z
  .array(
    z.strictObject({
      slot: z.string().max(60),
      alt: z.string().max(400),
      x: z.number().min(0).max(100).optional(),
      y: z.number().min(0).max(100).optional(),
      remove: z.boolean().optional(),
      fileKey: z.string().max(20).optional(),
    }),
  )
  .max(PHOTO_LIMITS.perSave);

export async function savePhotos(form: FormData): Promise<Result<undefined>> {
  if (!(await canSave())) return err(NOT_CONNECTED);
  let changes: Change[];
  try {
    const raw = form.get("changes");
    changes = changesSchema.parse(
      JSON.parse(typeof raw === "string" ? raw : "[]"),
    );
  } catch {
    return err("Something is missing. Check the photos and try again.");
  }
  const files = new Map<string, Uint8Array>();
  for (const c of changes) {
    const file = c.fileKey ? form.get(c.fileKey) : null;
    if (c.fileKey && file instanceof Blob)
      files.set(c.fileKey, new Uint8Array(await file.arrayBuffer()));
  }
  try {
    await savePhotoChanges(changes, files);
  } catch (e) {
    if (e instanceof PhotoError) return err(e.message);
    console.error("content: could not save photos", e);
    return err("Could not save the photos. The website folder may be missing or read-only. Try again; if it keeps failing, tell the builder.");
  }
  revalidatePath("/content", "layout");
  return ok(undefined);
}

// Save the list of classes. A class added here has a temporary id ("new-..."); it gets its real one, made from its name, now.
export async function saveClasses(
  input: unknown,
): Promise<Result<{ slugs: string[] }> & { field?: string }> {
  if (!(await canSave())) return err(NOT_CONNECTED);
  const parsed = classListSchema.safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return {
      ...err(i?.message ?? "Check the classes and try again."),
      field: i?.path.join("."),
    };
  }
  try {
    const keep = parsed.data
      .filter((c) => !isTemporary(c.slug))
      .map((c) => c.slug);
    const taken = new Set([
      ...keep,
      ...(await readClasses()
        .then((l) => l.map((c) => c.slug))
        .catch(() => [])),
    ]);
    const list = parsed.data.map((c) => {
      if (!isTemporary(c.slug)) return c;
      const slug = uniqueSlug(c.name, taken);
      taken.add(slug);
      return { ...c, slug };
    });
    await writeClasses(list);
    revalidatePath("/content", "layout");
    return ok({ slugs: list.map((c) => c.slug) });
  } catch (e) {
    console.error("content: could not save classes", e);
    return err("Could not save the class list. The website folder may be missing or read-only. Try again; if it keeps failing, tell the builder.");
  }
}

// Save one list of the website (see ./site/lists.ts). An item added here has a temporary id ("new-..."); it gets its real one, made
// from its name, now. The same checks run here as in the form, because the form can be bypassed.
export async function saveList(
  listId: string,
  input: unknown,
): Promise<Result<{ slugs: string[] }> & { field?: string }> {
  if (!(await canSave())) return err(NOT_CONNECTED);
  const def = listById(listId);
  if (!def) return err("That list is not known.");
  const parsed = listSchemaFor(def).safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return {
      ...err(i?.message ?? `Check the ${def.itemName}s and try again.`),
      field: i?.path.join("."),
    };
  }
  try {
    const items = parsed.data as ListItem[];
    const keep = items.filter((c) => !isTempItem(c.slug)).map((c) => c.slug);
    const taken = new Set([
      ...keep,
      ...(await readList(def)
        .then((l) => l.map((c) => c.slug))
        .catch(() => [])),
    ]);
    const list = items.map((c) => {
      if (!isTempItem(c.slug)) return c;
      const slug = uniqueItemSlug(def, String(c[def.nameKey] ?? ""), taken);
      taken.add(slug);
      return { ...c, slug };
    });
    await writeList(def, list);
    revalidatePath("/content", "layout");
    return ok({ slugs: list.map((c) => c.slug) });
  } catch (e) {
    console.error(`content: could not save the ${def.id} list`, e);
    return err("Could not save the list. The website folder may be missing or read-only. Try again; if it keeps failing, tell the builder.");
  }
}
