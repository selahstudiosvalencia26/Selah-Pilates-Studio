import { z } from "zod";
import type { Slot } from "./site/slots";

// A list is a group of repeated items inside the website: the classes of a gym, the menu of a café, the projects of a builder.
// The engine never knows what a list is about. Each client says it in src/systems/content/site/lists.ts: the fields of one item,
// how many items are allowed, and where the item's photo shows. This file turns that description into the checks, the ids and the
// photo place, the same way for every client.

type Base = {
  key: string;
  label: string;
  hint?: string;
  /** The value may be missing from the file (an old file, or something the owner does not have to fill in). */
  optional?: boolean;
};
export type TextField = Base & {
  type: "text";
  max: number;
  /** A paragraph box instead of one line. */
  long?: boolean;
  /** Must not be empty (the name field of a list is always required). */
  required?: boolean;
};
export type NumberField = Base & {
  type: "number";
  min: number;
  max: number;
  /** Shown before the number in the row, like "₱". */
  prefix?: string;
  /** Shown after the number in the row, like "min". */
  suffix?: string;
};
export type ChoiceField = Base & {
  type: "choice";
  options: readonly string[];
};
/** On or off. */
export type BooleanField = Base & { type: "boolean" };
/** A day, written 2026-12-05 in the file. */
export type DateField = Base & { type: "date" };
/** A short list of lines (highlights, tips): up to `count` of them, each up to `itemMax` letters. */
export type StringsField = Base & {
  type: "strings";
  itemName: string;
  count: number;
  itemMax: number;
};
/** A row of numbers, one for each price column or size: up to `count` of them, each empty or between min and max. */
export type NumbersField = Base & {
  type: "numbers";
  count: number;
  min: number;
  max: number;
};
/** Several fields kept together under one name (a heading with its plain and highlighted words). */
export type GroupField = Base & { type: "group"; fields: readonly ListField[] };
/** A list inside an item (the sections of a menu category, the items of a section). */
export type NestedListField = Base & {
  type: "list";
  itemName: string;
  min: number;
  max: number;
  fields: readonly ListField[];
};
export type ListField =
  | TextField
  | NumberField
  | ChoiceField
  | BooleanField
  | DateField
  | StringsField
  | NumbersField
  | GroupField
  | NestedListField;

/** A rule across fields, like "it must end on or after the day it starts". `ok` returns true when the item is fine. */
export type ListRule = {
  message: string;
  /** The field the message belongs to. */
  path: string;
  ok: (item: Record<string, unknown>) => boolean;
};

export type ListDef = {
  /** One lowercase word or words with dashes: the web address (/content/lists/<id>) and the start of each photo place. */
  id: string;
  /** The file in the website's content/data folder. */
  file: string;
  /** The tab and the screen's name: "Class list". */
  title: string;
  /** One item, singular, lowercase: "class". Used in messages. */
  itemName: string;
  /** A plain sentence under the title. */
  intro: string;
  min: number;
  max: number;
  /** The text field that names an item. It also makes the item's id. */
  nameKey: string;
  /**
   * Whether each item has an id (and so can have a photo and be found by it). Default true. A list whose items are found by their
   * place in the list, like the categories of a menu, sets this to false.
   */
  ids?: boolean;
  fields: readonly ListField[];
  rules?: readonly ListRule[];
  /** The buttons under the list. Each adds an item, starting with these values ({ kind: "Group class" }). */
  add: readonly { label: string; start?: Record<string, string | number> }[];
  /** "date": the website sorts these by date, so there is nothing to move up or down. */
  order?: "date";
  /** Ids the website already uses, so no item may take them. */
  reserved?: readonly string[];
  /** Where an item's photo shows. Leave it out when the items have no photo. Needs ids. */
  photo?: {
    frame: number;
    where: (item: ListItem) => string;
    hint: (item: ListItem) => string;
  };
};

export type ListItem = { slug: string } & Record<string, unknown>;

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const TEMP_PREFIX = "new-";
export const isTemporary = (slug: string) => slug.startsWith(TEMP_PREFIX);
export const tempId = () => `${TEMP_PREFIX}${Math.random().toString(36).slice(2, 8)}`;

/** "Hot Flow!" becomes "hot-flow". */
export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

/** An id that no other item uses. An item that is still unsaved carries a temporary one ("new-..."). */
export function uniqueSlug(def: Pick<ListDef, "itemName" | "reserved">, name: string, taken: Iterable<string>): string {
  const used = new Set([...taken, ...(def.reserved ?? [])]);
  const base = slugify(name) || slugify(def.itemName) || "item";
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

const lower = (s: string) => s.toLowerCase();
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function fieldSchema(f: ListField, isName: boolean): z.ZodType {
  let s: z.ZodType;
  switch (f.type) {
    case "text": {
      const t = z.string().trim().max(f.max, `The ${lower(f.label)} is too long.`);
      s = isName ? t.min(1, `Every item needs a ${lower(f.label)}.`) : f.required ? t.min(1, `Write the ${lower(f.label)}.`) : t;
      break;
    }
    case "number":
      s = z
        .number()
        .int(`The ${lower(f.label)} is a whole number.`)
        .min(f.min, `The ${lower(f.label)} cannot be below ${f.min}.`)
        .max(f.max, `The ${lower(f.label)} cannot be above ${f.max}.`)
        .nullable();
      break;
    case "choice":
      s = z.enum(f.options as [string, ...string[]], { message: `Choose the ${lower(f.label)}.` });
      break;
    case "boolean":
      s = z.boolean();
      break;
    case "date":
      s = z.string().regex(ISO_DAY, `Choose the ${lower(f.label)}.`);
      break;
    case "strings":
      s = z
        .array(z.string().trim().min(1, `A ${f.itemName} cannot be empty.`).max(f.itemMax, `A ${f.itemName} is too long.`))
        .max(f.count, `Keep ${f.count} ${f.itemName}s or fewer.`);
      break;
    case "numbers":
      s = z
        .array(
          z
            .number()
            .int(`The ${lower(f.label)} are whole numbers.`)
            .min(f.min, `A ${lower(f.label)} cannot be below ${f.min}.`)
            .max(f.max, `A ${lower(f.label)} cannot be above ${f.max}.`)
            .nullable(),
        )
        .max(f.count);
      break;
    case "group":
      s = z.strictObject(shapeOf(f.fields));
      break;
    case "list":
      s = z
        .array(z.strictObject(shapeOf(f.fields)))
        .min(f.min, `Keep at least ${f.min} ${f.itemName}${f.min === 1 ? "" : "s"}.`)
        .max(f.max, `Keep ${f.max} ${f.itemName}s or fewer.`);
      break;
  }
  return f.optional ? s.optional() : s;
}

function shapeOf(fields: readonly ListField[], nameKey?: string): Record<string, z.ZodType> {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) shape[f.key] = fieldSchema(f, f.key === nameKey);
  return shape;
}

const hasIds = (def: Pick<ListDef, "ids">) => def.ids !== false;

/** The checks for one item of the list. */
export function itemSchemaFor(def: ListDef) {
  const shape = shapeOf(def.fields, def.nameKey);
  if (hasIds(def)) shape.slug = z.string().regex(SLUG_RE, `That ${def.itemName} has no valid id.`).max(40);
  const base = z.strictObject(shape);
  if (!def.rules?.length) return base;
  return base.superRefine((item, ctx) => {
    for (const r of def.rules ?? []) {
      if (!r.ok(item as Record<string, unknown>)) ctx.addIssue({ code: "custom", message: r.message, path: [r.path] });
    }
  });
}

/** The checks for the whole list: how many items, and no two with the same id. */
export function listSchemaFor(def: ListDef) {
  return z
    .array(itemSchemaFor(def))
    .min(def.min, `Keep at least ${def.min} ${def.itemName}${def.min === 1 ? "" : "s"}.`)
    .max(def.max, `Keep ${def.max} ${def.itemName}s or fewer.`)
    .superRefine((list, ctx) => {
      if (!hasIds(def)) return;
      const seen = new Set<string>();
      list.forEach((item, i) => {
        const slug = String((item as { slug: string }).slug);
        if (seen.has(slug)) ctx.addIssue({ code: "custom", message: `Two ${def.itemName}s share an id.`, path: [i, "slug"] });
        if (def.reserved?.includes(slug)) ctx.addIssue({ code: "custom", message: `That ${def.itemName} id is already used.`, path: [i, "slug"] });
        seen.add(slug);
      });
    });
}

/** The field types the list editor screen can show today. The checks above handle every type; nested lists and groups need a screen of their own. */
export const EDITOR_TYPES = ["text", "number", "choice", "boolean", "date"] as const;
export const editorSupports = (def: ListDef): boolean => hasIds(def) && def.fields.every((f) => (EDITOR_TYPES as readonly string[]).includes(f.type));

/** The start of every photo place that belongs to this list. */
export const listSlotPrefix = (def: Pick<ListDef, "id">) => `list-${def.id}-`;

/** The photo place of one item. It exists as long as the item does, so it is made from the item. */
export function listSlot(def: ListDef, item: ListItem): Slot | undefined {
  if (!def.photo || !hasIds(def)) return undefined;
  const name = String(item[def.nameKey] ?? "");
  return {
    id: `${listSlotPrefix(def)}${item.slug}`,
    label: `${name} photo`,
    where: def.photo.where(item),
    hint: def.photo.hint(item),
    alt: name,
    frame: def.photo.frame,
  };
}
