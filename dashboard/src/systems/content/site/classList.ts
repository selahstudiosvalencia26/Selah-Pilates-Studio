import { z } from "zod";

// The classes and private sessions the studio offers (content/data/classes.json in the website): the same list feeds the Home class
// row, the Class page, the footer and the contact form, so it is edited once, here.
export const CLASS_KINDS = [
  "Group mat class",
  "Private reformer session",
] as const;
export type ClassKind = (typeof CLASS_KINDS)[number];

const short = (label: string, max: number) =>
  z.string().trim().max(max, `The ${label} is too long.`);

export const classItemSchema = z.strictObject({
  // The short word the website uses to find this class's photo. Made from the name when the class is first saved, then never changed,
  // so renaming a class keeps its photo.
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "That class has no valid id.")
    .max(40),
  name: z
    .string()
    .trim()
    .min(1, "Every class needs a name.")
    .max(40, "A class name is too long."),
  group: z.enum(CLASS_KINDS),
  summary: short("note", 120),
  level: short("level", 40),
  focus: short("focus", 40),
  durationMinutes: z
    .number()
    .int("The length is whole minutes.")
    .min(10, "A class is at least 10 minutes.")
    .max(300, "A class is at most 300 minutes.")
    .nullable(),
  pricePhp: z
    .number()
    .int("The price is whole pesos.")
    .min(0, "A price cannot be below zero.")
    .max(99999, "That price is too high.")
    .nullable(),
});
export type ClassItem = z.output<typeof classItemSchema>;

export const classListSchema = z
  .array(classItemSchema)
  .min(1, "Keep at least one class.")
  .max(30, "Keep 30 classes or fewer.")
  .superRefine((list, ctx) => {
    const seen = new Set<string>();
    list.forEach((c, i) => {
      if (seen.has(c.slug))
        ctx.addIssue({
          code: "custom",
          message: "Two classes share an id.",
          path: [i, "slug"],
        });
      if (RESERVED_SLUGS.includes(c.slug))
        ctx.addIssue({
          code: "custom",
          message: "That class id is already used.",
          path: [i, "slug"],
        });
      seen.add(c.slug);
    });
  });
export type ClassList = z.output<typeof classListSchema>;

/** "Hot Flow!" becomes "hot-flow". */
export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

/** An id that no other class uses. A class that is still unsaved carries a temporary one ("new-..."). */
export function uniqueSlug(name: string, taken: Iterable<string>): string {
  const used = new Set([...taken, ...RESERVED_SLUGS]);
  const base = slugify(name) || "class";
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// Ids the page photos already use ("class-group-mat" and "class-group-private"), so no class may take them.
export const RESERVED_SLUGS = ["group-mat", "group-private"];

export const isTemporary = (slug: string) => slug.startsWith("new-");
