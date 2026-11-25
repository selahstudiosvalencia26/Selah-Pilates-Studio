import type { PageKind } from "./pages";

// What each page's editor shows, section by section, in the order of the page on the website. A section is a name and a note on
// the left and its fields on the right. `path` says where the value sits in the page's data.
//   text     one line      long     a paragraph      strings   a list of lines      pairs   a list of title + line
//   questions a list of question + answer
// A list with `fixed` has a set number of items (the design needs exactly that many): its items cannot be added or removed.
export type Field = {
  path: string[];
  label: string;
  hint?: string;
  type: "text" | "long" | "strings" | "pairs" | "questions";
  fixed?: boolean;
  itemName?: string; // "question", "tip": used in the Add and Remove buttons
};
// `photos` lists the photo places (see ./slots.ts) that belong to this part of the page, shown inside the part.
export type Section = {
  title: string;
  note: string;
  fields: Field[];
  photos?: string[];
};

export const LAYOUTS: Record<PageKind, Section[]> = {
  home: [
    {
      title: "Top of the page",
      note: "The first thing people see. The big slogan is in Site information.",
      fields: [
        {
          path: ["hero", "text"],
          label: "Line under the slogan",
          type: "text",
        },
        { path: ["hero", "cta"], label: "Button words", type: "text" },
        { path: ["hero", "secondCta"], label: "Second button on phones", type: "text" },
        { path: ["hero", "pointsTitle"], label: "Small heading", type: "text" },
        {
          path: ["hero", "points"],
          label: "Three points",
          type: "strings",
          fixed: true,
        },
      ],
      photos: ["home-hero"],
    },
    {
      title: "About",
      note: "The short introduction under the top of the page.",
      fields: [
        { path: ["about", "title"], label: "Heading", type: "text" },
        {
          path: ["about", "text"],
          label: "Paragraphs",
          type: "strings",
          itemName: "paragraph",
          hint: "The first one is shown biggest.",
        },
        {
          path: ["about", "storyNote"],
          label: "Studio story",
          type: "long",
          hint: "While it ends with \"coming soon\", customers do not see it.",
        },
      ],
    },
    {
      title: "Classes",
      note: "The heading above the row of classes. The classes, their prices and their photos are in Bookings, on the Classes tab.",
      fields: [
        { path: ["classes", "title"], label: "Heading", type: "text" },
        { path: ["classes", "text"], label: "Line under it", type: "text" },
        { path: ["classes", "intro"], label: "Intro", type: "text" },
        { path: ["classes", "cta"], label: "Button words", type: "text" },
      ],
    },
    {
      title: "Next classes",
      note: "The next class times under the row of classes. The times come from Bookings, on the Schedule tab.",
      fields: [
        { path: ["week", "title"], label: "Heading", type: "text" },
        { path: ["week", "text"], label: "Line under it", type: "text" },
      ],
    },
    {
      title: "Why pilates",
      note: "Four short benefits, each with a small picture.",
      fields: [
        { path: ["benefits", "title"], label: "Heading", type: "text" },
        { path: ["benefits", "text"], label: "Line under it", type: "text" },
        {
          path: ["benefits", "items"],
          label: "The four benefits",
          type: "pairs",
          fixed: true,
        },
      ],
      photos: ["home-benefits"],
    },
    {
      title: "Your first class",
      note: "Three steps for someone new.",
      fields: [
        { path: ["first", "title"], label: "Heading", type: "text" },
        { path: ["first", "steps"], label: "The three steps", type: "pairs", fixed: true },
      ],
    },
    {
      title: "Team",
      note: "The words above the team cards. The bio on a card is written in About, under The team.",
      fields: [
        { path: ["team", "title"], label: "Heading", type: "text" },
        { path: ["team", "text"], label: "Line under it", type: "text" },
      ],
      photos: ["team-ciara-bergado"],
    },
    {
      title: "Reviews",
      note: "The heading above your reviews. Add the reviews themselves on the Reviews tab. With none, this part is hidden.",
      fields: [{ path: ["reviews", "title"], label: "Heading", type: "text" }],
    },
    {
      title: "Blog",
      note: "The heading above your three newest posts. Write posts on the Blog tab.",
      fields: [{ path: ["blog", "title"], label: "Heading", type: "text" }],
    },
    {
      title: "Quick answers",
      note: "Questions people ask. Class prices in an answer are typed here, so change them here too if a price changes.",
      fields: [
        { path: ["faq", "title"], label: "Heading", type: "text" },
        {
          path: ["faq", "items"],
          label: "Questions",
          type: "questions",
          itemName: "question",
        },
      ],
    },
  ],
  about: [
    {
      title: "Top of the page",
      note: "The heading and the paragraph at the top.",
      fields: [
        { path: ["header", "title"], label: "Heading", type: "text" },
        { path: ["header", "text"], label: "Paragraph", type: "long" },
      ],
      photos: ["about-main", "about-side-1", "about-side-2"],
    },
    {
      title: "The method",
      note: "Six ideas pilates is built on. This is general writing, so read it and change what is not right for your studio.",
      fields: [
        { path: ["method", "title"], label: "Heading", type: "text" },
        { path: ["method", "text"], label: "Line under it", type: "text" },
        {
          path: ["method", "items"],
          label: "The six ideas",
          type: "pairs",
          fixed: true,
        },
      ],
    },
    {
      title: "The name",
      note: "What Selah means. Please check the meaning is right before this goes live.",
      fields: [
        { path: ["name", "text"], label: "Text", type: "long" },
        {
          path: ["name", "note"],
          label: "Studio story",
          type: "long",
        },
      ],
    },
    {
      title: "The team",
      note: "Shown next to the team photo.",
      fields: [
        { path: ["team", "note"], label: "Short bio", type: "long", hint: "Also shown on the home page card. While it ends with \"coming soon\", customers do not see it." },
      ],
      photos: ["team-ciara-bergado"],
    },
  ],
  class: [
    {
      title: "Top of the page",
      note: "The heading and line at the top.",
      fields: [
        { path: ["header", "title"], label: "Heading", type: "text" },
        { path: ["header", "text"], label: "Line under it", type: "long" },
      ],
    },
    {
      title: "The two groups",
      note: "The photo beside the group mat classes and the one beside the private sessions. The classes and prices come from Bookings, on the Classes tab.",
      fields: [],
      photos: ["class-group-mat", "class-group-private"],
    },
    {
      title: "Find your class",
      note: "Three quick picks. Each one names a class from the Classes tab.",
      fields: [
        { path: ["levels", "title"], label: "Heading", type: "text" },
        {
          path: ["levels", "items"],
          label: "The three picks",
          type: "pairs",
          fixed: true,
        },
      ],
    },
    {
      title: "Before your first class",
      note: "Friendly tips for people who have never come.",
      fields: [
        { path: ["firstClass", "title"], label: "Heading", type: "text" },
        {
          path: ["firstClass", "items"],
          label: "Tips",
          type: "strings",
          itemName: "tip",
        },
      ],
    },
    {
      title: "Bottom of the page",
      note: "The last box, above the Book button.",
      fields: [
        { path: ["closing", "title"], label: "Heading", type: "text" },
        { path: ["closing", "text"], label: "Line under it", type: "long" },
      ],
    },
  ],
  contact: [
    {
      title: "Top of the page",
      note: "The heading and line at the top.",
      fields: [
        { path: ["header", "title"], label: "Heading", type: "text" },
        { path: ["header", "text"], label: "Line under it", type: "long" },
      ],
    },
    {
      title: "The message form",
      note: "The words above the form. Phone and email are in Site information.",
      fields: [
        { path: ["form", "title"], label: "Heading", type: "text" },
        { path: ["form", "text"], label: "Line under it", type: "long" },
      ],
    },
    {
      title: "Come and visit",
      note: "The heading above the map. The address and hours are in Site information and Opening hours.",
      fields: [{ path: ["find", "title"], label: "Heading", type: "text" }],
    },
  ],
};
