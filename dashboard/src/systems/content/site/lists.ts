import type { ListDef } from "../listDef";

// The lists this client's website keeps: the repeated things the owner adds, changes, reorders and removes (the classes of a gym, the
// menu of a café, the projects of a builder). Each list is described here once; the editor, the checks, the saving and the photos
// come from the engine. A list needs two more things to show up:
//   1. its tab in the manifest (../manifest.ts), as a page at /content/lists/<id>;
//   2. the website reading the same file (content/data/<file>).
// See site/README.md for three worked examples (gym classes, café menu, construction projects).
export const LISTS: readonly ListDef[] = [
  {
    id: "reviews",
    file: "reviews.json",
    title: "Reviews",
    itemName: "review",
    intro: "What clients say about you. Add only real reviews, with the client's permission. Press Save changes when you are done.",
    min: 0,
    max: 30,
    nameKey: "name",
    fields: [
      { type: "text", key: "name", label: "Client name", max: 60 },
      { type: "text", key: "review", label: "What they said", max: 600, long: true, required: true },
      { type: "boolean", key: "published", label: "On the website", hint: "Show this review on the website" },
    ],
    add: [{ label: "Add a review", start: { published: "true" } }],
  },
  {
    id: "blog",
    file: "blog.json",
    title: "Blog",
    itemName: "post",
    intro: "Your blog posts. The newest date shows first on the website. Press Save changes when you are done.",
    min: 0,
    max: 60,
    nameKey: "title",
    order: "date",
    fields: [
      { type: "text", key: "title", label: "Title", max: 90 },
      { type: "date", key: "date", label: "Date" },
      { type: "text", key: "summary", label: "Short summary", max: 200, hint: "One or two lines shown on the blog page. You can leave it empty." },
      { type: "text", key: "body", label: "Story", max: 8000, long: true, required: true, hint: "Leave an empty line between paragraphs." },
      { type: "boolean", key: "published", label: "On the website", hint: "Show this post on the website" },
    ],
    add: [{ label: "Write a new post", start: { published: "true" } }],
    photo: { frame: 16 / 9, where: (i) => `Blog, the picture for ${i.title}`, hint: (i) => `A picture for ${i.title}.` },
  },
];

export const listById = (id: string) => LISTS.find((l) => l.id === id);
