import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { editorSupports, itemSchemaFor, listSchemaFor, listSlot, slugify, uniqueSlug, type ListDef } from "./listDef";
import { classListSchema } from "./site/classList";

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

// Three very different businesses, described only by data. The engine must handle all of them with no change.
const gym: ListDef = {
  id: "classes",
  file: "classes.json",
  title: "Class schedule",
  itemName: "class",
  intro: "The classes you teach.",
  min: 1,
  max: 30,
  nameKey: "name",
  fields: [
    { type: "text", key: "name", label: "Name", max: 40 },
    { type: "choice", key: "kind", label: "Kind", options: ["Group class", "Personal training"] },
    { type: "text", key: "trainer", label: "Trainer", max: 40 },
    { type: "number", key: "minutes", label: "Length", min: 10, max: 300, suffix: "min" },
  ],
  add: [{ label: "Add a group class", start: { kind: "Group class" } }, { label: "Add personal training", start: { kind: "Personal training" } }],
  photo: { frame: 4 / 3, where: (i) => `Home page, the ${i.name} card`, hint: (i) => `People in the ${i.name} class.` },
};
const cafe: ListDef = {
  id: "menu",
  file: "menu-items.json",
  title: "Menu",
  itemName: "item",
  intro: "What you sell.",
  min: 1,
  max: 80,
  nameKey: "name",
  fields: [
    { type: "text", key: "name", label: "Name", max: 50 },
    { type: "choice", key: "category", label: "Category", options: ["Coffee", "Pastry", "Meals"] },
    { type: "number", key: "price", label: "Price", min: 0, max: 9999, prefix: "₱" },
  ],
  add: [{ label: "Add an item" }],
};
const builder: ListDef = {
  id: "projects",
  file: "projects.json",
  title: "Projects",
  itemName: "project",
  intro: "Work you have finished.",
  min: 0,
  max: 40,
  nameKey: "title",
  fields: [
    { type: "text", key: "title", label: "Title", max: 80 },
    { type: "text", key: "location", label: "Location", max: 60 },
    { type: "number", key: "year", label: "Year", min: 1990, max: 2100 },
  ],
  add: [{ label: "Add a project" }],
  reserved: ["gallery"],
  photo: { frame: 16 / 9, where: (i) => `Projects page, ${i.title}`, hint: () => "A wide photo of the finished building." },
};

describe("a list is described by data, for any business", () => {
  it("checks the items of a gym, a café and a builder with their own fields", () => {
    expect(listSchemaFor(gym).safeParse([{ slug: "hiit", name: "HIIT", kind: "Group class", trainer: "Sam", minutes: 45 }]).success).toBe(true);
    expect(listSchemaFor(cafe).safeParse([{ slug: "latte", name: "Latte", category: "Coffee", price: 120 }]).success).toBe(true);
    expect(listSchemaFor(builder).safeParse([]).success).toBe(true); // a builder may start with no projects
    expect(listSchemaFor(gym).safeParse([]).success).toBe(false); // a gym needs at least one class
  });

  it("refuses what is wrong, in plain words", () => {
    const msg = (def: ListDef, list: unknown) => {
      const r = listSchemaFor(def).safeParse(list);
      return r.success ? "" : r.error.issues[0].message;
    };
    expect(msg(cafe, [{ slug: "x", name: "", category: "Coffee", price: 1 }])).toMatch(/needs a name/);
    expect(msg(cafe, [{ slug: "x", name: "X", category: "Tea", price: 1 }])).toMatch(/Choose the category/);
    expect(msg(cafe, [{ slug: "x", name: "X", category: "Coffee", price: -1 }])).toMatch(/cannot be below 0/);
    expect(msg(cafe, [{ slug: "x", name: "X", category: "Coffee", price: 1.5 }])).toMatch(/whole number/);
    expect(msg(builder, [{ slug: "a", title: "A", location: "", year: 1900 }])).toMatch(/cannot be below 1990/);
    expect(msg(builder, [{ slug: "gallery", title: "A", location: "", year: 2020 }])).toMatch(/already used/);
    expect(
      msg(cafe, [
        { slug: "a", name: "A", category: "Coffee", price: 1 },
        { slug: "a", name: "B", category: "Coffee", price: 2 },
      ]),
    ).toMatch(/share an id/);
    expect(msg(cafe, [{ slug: "x", name: "X", category: "Coffee", price: 1, extra: "no" }])).not.toBe(""); // no unknown fields
  });

  it("makes ids from names and never repeats or reuses a reserved one", () => {
    expect(slugify("Hot Flow!")).toBe("hot-flow");
    expect(uniqueSlug(gym, "HIIT", ["hiit"])).toBe("hiit-2");
    expect(uniqueSlug(builder, "Gallery", [])).toBe("gallery-2");
    expect(uniqueSlug(cafe, "!!!", [])).toBe("item");
  });

  it("gives an item its photo place only when the list has photos", () => {
    const item = { slug: "hiit", name: "HIIT", kind: "Group class", trainer: "", minutes: 45 };
    expect(listSlot(gym, item)).toMatchObject({ id: "list-classes-hiit", label: "HIIT photo", where: "Home page, the HIIT card", frame: 4 / 3 });
    expect(listSlot(cafe, { slug: "latte", name: "Latte", category: "Coffee", price: 1 })).toBeUndefined();
  });
});

describe("a list that does the same as Selah's class list can replace it", () => {
  // Selah's class list, written as a description. It must accept and refuse the same things as the hand-written one.
  const selah: ListDef = {
    id: "classes",
    file: "classes.json",
    title: "Class list",
    itemName: "class",
    intro: "",
    min: 1,
    max: 30,
    nameKey: "name",
    fields: [
      { type: "text", key: "name", label: "Name", max: 40 },
      { type: "choice", key: "group", label: "Kind", options: ["Group mat class", "Private reformer session"] },
      { type: "text", key: "summary", label: "Short note", max: 120 },
      { type: "text", key: "level", label: "Level", max: 40 },
      { type: "text", key: "focus", label: "Focus", max: 40 },
      { type: "number", key: "durationMinutes", label: "Length", min: 10, max: 300 },
      { type: "number", key: "pricePhp", label: "Price", min: 0, max: 99999 },
    ],
    add: [],
    reserved: ["group-mat", "group-private"],
  };
  const base = { slug: "sculpt", name: "Sculpt", group: "Group mat class", summary: "For strength.", level: "", focus: "", durationMinutes: 55, pricePhp: 350 };
  const cases: Record<string, unknown[]> = {
    "a good class": [base],
    "no price or length": [{ ...base, durationMinutes: null, pricePhp: null }],
    "an empty name": [{ ...base, name: "" }],
    "a name that is too long": [{ ...base, name: "x".repeat(41) }],
    "an unknown kind": [{ ...base, group: "Spin" }],
    "a length that is too short": [{ ...base, durationMinutes: 5 }],
    "a price that is not whole pesos": [{ ...base, pricePhp: 10.5 }],
    "a reserved id": [{ ...base, slug: "group-mat" }],
    "two with one id": [base, { ...base, name: "Other" }],
    "an empty list": [],
    "an unknown field": [{ ...base, color: "red" }],
  };
  for (const [name, list] of Object.entries(cases)) {
    it(`agrees on ${name}`, () => {
      const old = classListSchema.safeParse(list);
      const now = listSchemaFor(selah).safeParse(list);
      expect(now.success).toBe(old.success);
    });
  }
  it("builds the same item checks", () => {
    expect(itemSchemaFor(selah).safeParse(base).success).toBe(true);
  });
});

describe("saving a list", () => {
  let dir = "";
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "content-list-"));
    vi.stubEnv("WEBSITE_CONTENT_DIR", dir);
    vi.stubEnv("WEBSITE_DIR", join(dir, "site"));
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    vi.doMock("./site/lists", () => ({ LISTS: [cafe, builder], listById: (id: string) => [cafe, builder].find((l) => l.id === id) }));
  });
  afterEach(async () => {
    vi.doUnmock("./site/lists");
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  it("reads a list that has no file yet as empty", async () => {
    const { readList } = await import("./store");
    expect(await readList(cafe)).toEqual([]);
  });

  it("gives new items their real ids, keeps old ones, and writes the file the website reads", async () => {
    const { saveList } = await import("./actions");
    const { readList } = await import("./store");
    const first = await saveList("menu", [
      { slug: "new-a1b2c3", name: "Latte", category: "Coffee", price: 120 },
      { slug: "new-d4e5f6", name: "Latte", category: "Coffee", price: 130 },
    ]);
    expect(first.ok && first.data.slugs).toEqual(["latte", "latte-2"]);
    const saved = JSON.parse(await readFile(join(dir, "menu-items.json"), "utf8"));
    expect(saved.map((x: { slug: string }) => x.slug)).toEqual(["latte", "latte-2"]);
    const again = await saveList("menu", [...(await readList(cafe)), { slug: "new-zzzz11", name: "Latte", category: "Coffee", price: 1 }]);
    expect(again.ok && again.data.slugs).toEqual(["latte", "latte-2", "latte-3"]);
  });

  it("refuses an unknown list, a wrong item, and saving on a live site", async () => {
    const { saveList } = await import("./actions");
    expect((await saveList("nope", [])).ok).toBe(false);
    const bad = await saveList("menu", [{ slug: "x", name: "", category: "Coffee", price: 1 }]);
    expect(bad.ok).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    expect((await saveList("menu", [{ slug: "x", name: "X", category: "Coffee", price: 1 }])).ok).toBe(false);
  });
});

// The shapes a café needs, made of data only: a menu (categories with sections, each with price columns and items), reviews, a
// photo gallery and a "coming up" notice. All with made-up content. They show the checks can hold a real, richer site.
describe("richer lists: a menu inside categories, reviews, a gallery and a notice", () => {
  const menu: ListDef = {
    id: "menu",
    file: "menu.json",
    title: "Menu",
    itemName: "category",
    intro: "",
    min: 1,
    max: 40,
    nameKey: "title",
    ids: false,
    add: [{ label: "Add a category" }],
    fields: [
      { type: "choice", key: "group", label: "Group", options: ["Drinks", "Food", "Sweets"] },
      { type: "text", key: "title", label: "Name", max: 60 },
      { type: "text", key: "note", label: "Note", max: 120, optional: true },
      { type: "boolean", key: "isNew", label: "New", optional: true },
      {
        type: "list",
        key: "sections",
        label: "Sections",
        itemName: "section",
        min: 1,
        max: 12,
        fields: [
          { type: "text", key: "label", label: "Section name", max: 120, optional: true },
          { type: "strings", key: "columns", label: "Price columns", itemName: "column", count: 6, itemMax: 40, optional: true },
          { type: "boolean", key: "favorite", label: "Favorite", optional: true },
          {
            type: "list",
            key: "items",
            label: "Items",
            itemName: "item",
            min: 0,
            max: 80,
            fields: [
              { type: "text", key: "name", label: "Name", max: 80, required: true },
              { type: "numbers", key: "prices", label: "Prices", count: 6, min: 0, max: 99999 },
              { type: "text", key: "description", label: "Description", max: 200, optional: true },
              { type: "boolean", key: "favorite", label: "Favorite", optional: true },
            ],
          },
        ],
      },
    ],
  };
  const category = {
    group: "Drinks",
    title: "Espresso",
    isNew: false,
    sections: [
      {
        columns: ["Hot", "Cold 16 oz"],
        items: [
          { name: "Americano", prices: [150, 140], description: "Plain.", favorite: true },
          { name: "Cappuccino", prices: [160, null] },
          { name: "Seasonal special", prices: [] }, // no price yet
        ],
      },
    ],
  };

  it("holds a menu: categories, sections, price columns and items", () => {
    expect(listSchemaFor(menu).safeParse([category]).success).toBe(true);
    // optional things may be missing altogether
    expect(listSchemaFor(menu).safeParse([{ group: "Food", title: "Snacks", sections: [{ items: [] }] }]).success).toBe(true);
  });

  it("catches a wrong menu deep inside, in plain words", () => {
    const msg = (c: unknown) => {
      const r = listSchemaFor(menu).safeParse([c]);
      return r.success ? "" : r.error.issues[0].message;
    };
    const item = (over: object) => ({ ...category, sections: [{ items: [{ name: "X", prices: [1], ...over }] }] });
    expect(msg(item({ name: "" }))).toMatch(/Write the name/);
    expect(msg(item({ prices: [-5] }))).toMatch(/cannot be below 0/);
    expect(msg(item({ prices: [1, 2, 3, 4, 5, 6, 7] }))).not.toBe("");
    expect(msg({ ...category, group: "Pizza" })).toMatch(/Choose the group/);
    expect(msg({ ...category, sections: [] })).toMatch(/at least 1 section/);
    expect(msg({ ...category, title: "" })).toMatch(/needs a name/);
  });

  it("does not need ids for a list found by place, so two categories may share a name", () => {
    expect(listSchemaFor(menu).safeParse([category, category]).success).toBe(true);
    expect(editorSupports(menu)).toBe(false); // the screen for a list inside a list is not built yet
  });

  const reviews: ListDef = {
    id: "reviews",
    file: "reviews.json",
    title: "Reviews",
    itemName: "review",
    intro: "",
    min: 0,
    max: 30,
    nameKey: "name",
    ids: false,
    add: [{ label: "Add a review" }],
    fields: [
      { type: "text", key: "name", label: "Name", max: 80 },
      { type: "text", key: "quote", label: "Quote", max: 700, required: true, long: true },
      { type: "text", key: "note", label: "Note", max: 40, optional: true },
      { type: "text", key: "when", label: "When", max: 40, optional: true },
    ],
  };
  it("holds reviews, with the note and the date optional", () => {
    expect(listSchemaFor(reviews).safeParse([{ name: "A", quote: "Great." }, { name: "B", quote: "Fine.", note: "Local Guide", when: "May 2026" }]).success).toBe(true);
    expect(listSchemaFor(reviews).safeParse([{ name: "A", quote: "" }]).success).toBe(false);
    expect(editorSupports(reviews)).toBe(false); // items without ids need their own screen too
  });

  const gallery: ListDef = {
    id: "gallery",
    file: "gallery-photos.json",
    title: "Gallery",
    itemName: "photo",
    intro: "",
    min: 0,
    max: 40,
    nameKey: "alt",
    add: [{ label: "Add a photo" }],
    fields: [
      { type: "choice", key: "kind", label: "Kind", options: ["builtin", "upload"] },
      { type: "text", key: "alt", label: "Description", max: 300 },
      { type: "text", key: "file", label: "File", max: 70, optional: true },
      { type: "number", key: "width", label: "Width", min: 100, max: 4000, optional: true },
      { type: "number", key: "height", label: "Height", min: 100, max: 4000, optional: true },
    ],
  };
  it("holds a photo-only gallery, with the size fields only for uploads", () => {
    const list = [
      { slug: "sign", kind: "builtin", alt: "The round sign" },
      { slug: "latte-art", kind: "upload", alt: "Latte art", file: "latte-art.webp", width: 1600, height: 1200 },
    ];
    expect(listSchemaFor(gallery).safeParse(list).success).toBe(true);
    expect(editorSupports(gallery)).toBe(true); // flat, with ids: the screen can show it
  });

  const notice: ListDef = {
    id: "coming-up",
    file: "announcement.json",
    title: "Coming up",
    itemName: "notice",
    intro: "",
    min: 1,
    max: 1,
    nameKey: "title",
    ids: false,
    add: [],
    fields: [
      { type: "boolean", key: "enabled", label: "Show it" },
      { type: "text", key: "title", label: "Title", max: 80 },
      { type: "date", key: "date", label: "First day" },
      { type: "date", key: "endDate", label: "Last day" },
      { type: "text", key: "text", label: "Text", max: 300, required: true },
      { type: "text", key: "place", label: "Place", max: 120, optional: true },
      { type: "text", key: "mapQuery", label: "Map search words", max: 160, optional: true },
      { type: "strings", key: "highlights", label: "Highlights", itemName: "highlight", count: 6, itemMax: 120 },
    ],
    rules: [{ message: "It must end on or after the day it starts.", path: "endDate", ok: (n) => String(n.endDate) >= String(n.date) }],
  };
  it("holds a notice with an on switch, two dates and a rule across them", () => {
    const n = { enabled: true, title: "Festival", date: "2026-11-04", endDate: "2026-11-22", text: "A day out.", highlights: ["Coffee", "Music"] };
    expect(listSchemaFor(notice).safeParse([n]).success).toBe(true);
    const bad = listSchemaFor(notice).safeParse([{ ...n, endDate: "2026-11-01" }]);
    expect(bad.success ? "" : bad.error.issues[0].message).toMatch(/end on or after/);
    expect(listSchemaFor(notice).safeParse([{ ...n, date: "soon" }]).success).toBe(false);
    expect(listSchemaFor(notice).safeParse([{ ...n, highlights: [""] }]).success).toBe(false);
  });
});
