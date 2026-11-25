# site: this client's website, described

Everything in `src/systems/content/` outside this folder is the **engine**. It is the same for every client and is never edited in a client's copy (change it in the master, then copy it out). This folder is the only part that differs by business.

| File | What it says |
|---|---|
| `pages.ts` | The website's pages and the words on each, with the checks (one zod schema for each page file in `content/data`). |
| `layouts.ts` | How each page's editor is laid out, section by section, in the order of the page. |
| `slots.ts` | The places on the website that hold a photo, with a hint for each. |
| `fixedImages.ts` | Images in the website that are NOT meant to be changed (a logo, an icon), each with a reason. Every other image must be a photo place. |
| `lists.ts` | The lists the business keeps (classes, menu, projects...). Each is one description; the editor, checks, saving and photos come from the engine. |
| `classList.ts` | The pilates class list of the first client. Old; new clients use `lists.ts` and do not need it. |

## Photos: nothing is forgotten

Every image in the website must be one the owner can change. `node src/systems/content/scanSite.mjs` lists every image in the website's code: the photo places (`<PhotoSlot slot="...">`), the ones built from a name, and any image that is not a photo place. `npm run check` then fails (photoCoverage.test.ts) for a photo place with no entry in `slots.ts`, and for an image that is neither a photo place nor listed in `fixedImages.ts` with a reason. When you set up a new website, run the scan first, add a place in `slots.ts` for each, and only then write the page words.

## Adding a list

1. Describe it in `lists.ts` (examples below).
2. Add its tab to `../manifest.ts`: `{ path: "/content/lists/<id>", title: "<title>", permission: "content.view", nav: true }`.
3. Make the website read the same file: `content/data/<file>`.

The screen is at `/content/lists/<id>`. Photos are placed under `list-<id>-<item id>`.

## Examples

A gym:

```ts
{
  id: "classes", file: "classes.json", title: "Class schedule", itemName: "class",
  intro: "The classes you teach.", min: 1, max: 30, nameKey: "name",
  fields: [
    { type: "text", key: "name", label: "Name", max: 40 },
    { type: "choice", key: "kind", label: "Kind", options: ["Group class", "Personal training"] },
    { type: "text", key: "trainer", label: "Trainer", max: 40 },
    { type: "number", key: "minutes", label: "Length", min: 10, max: 300, suffix: "min" },
  ],
  add: [{ label: "Add a group class", start: { kind: "Group class" } }],
  photo: { frame: 4 / 3, where: (i) => `Home page, the ${i.name} card`, hint: (i) => `People in the ${i.name} class.` },
}
```

A café menu: fields `name` (text), `category` (choice: Coffee, Pastry, Meals), `price` (number, prefix "₱").

A builder's projects: `min: 0`, fields `title` (text), `location` (text), `year` (number), and a wide photo.

Field types: `text` (a `max` length; `long: true` for a paragraph; `required: true` to forbid empty), `number` (a whole number between `min` and `max`, may be empty), `choice` (one of `options`), `boolean` (on or off), `date` (a day, 2026-12-05), `strings` (a short list of lines), `numbers` (a row of prices or sizes), `group` (fields kept together under one name) and `list` (a list inside an item, like the sections of a menu category). Any field may be `optional: true` (it may be missing from the file). `rules` check across fields ("it must end on or after it starts"). `ids: false` is for a list found by place, like the categories of a menu.

**What the editor screen can show today:** lists whose fields are `text`, `number`, `choice`, `boolean` or `date`, and that have ids. The checks and saving already handle every type; the screens for a list inside a list, `strings`, `numbers` and `group` fields, and lists without ids are the next thing to build. A list the screen cannot show yet says so in plain words. The first `add` button's `start` values fill a new item. `reserved` lists ids the website already uses.

The tests in `../lists.test.ts` run these three businesses through the engine.
