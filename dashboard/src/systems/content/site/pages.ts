import { z } from "zod";

// The words of each page of the website, and what is allowed in each. One file for each page (content/data/<page>.json in the
// website). Plain messages, because a person reads them. Only words the owner can change are here: the layout, the icons and the
// design words stay in the website's code.
const line = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `Write the ${label}.`)
    .max(max, `The ${label} is too long.`);
const para = (label: string, max = 600) => line(label, max);
const pair = z.strictObject({
  title: line("title", 60),
  text: line("line", 200),
});
const pairs = (min: number, max: number, what: string) =>
  z
    .array(pair)
    .min(min, `Keep at least ${min} ${what}.`)
    .max(max, `Keep ${max} ${what} or fewer.`);

export const homeSchema = z.strictObject({
  hero: z.strictObject({
    text: line("line under the slogan", 160),
    cta: line("button words", 30),
    secondCta: line("second button words", 30),
    pointsTitle: line("small heading", 80),
    points: z.array(line("point", 60)).length(3, "Keep exactly 3 points."),
  }),
  about: z.strictObject({
    title: line("heading", 60),
    text: z
      .array(para("paragraph"))
      .min(1, "Write at least one paragraph.")
      .max(3, "Keep 3 paragraphs or fewer."),
    storyNote: para("story", 600),
  }),
  benefits: z.strictObject({
    title: line("heading", 60),
    text: line("line", 160),
    items: z.array(pair).length(4, "Keep exactly 4 benefits."),
  }),
  classes: z.strictObject({
    title: line("heading", 40),
    text: line("line", 120),
    intro: line("intro", 160),
    cta: line("button words", 30),
  }),
  faq: z.strictObject({
    title: line("heading", 60),
    items: z
      .array(
        z.strictObject({ q: line("question", 120), a: para("answer", 400) }),
      )
      .min(1, "Keep at least 1 question.")
      .max(12, "Keep 12 questions or fewer."),
  }),
  team: z.strictObject({ title: line("heading", 60), text: line("line", 160) }),
  week: z.strictObject({ title: line("heading", 60), text: line("line", 160) }),
  first: z.strictObject({ title: line("heading", 60), steps: z.array(pair).length(3, "Keep exactly 3 steps.") }),
  reviews: z.strictObject({ title: line("heading", 60) }),
  blog: z.strictObject({ title: line("heading", 60) }),
});

export const aboutSchema = z.strictObject({
  header: z.strictObject({
    title: line("heading", 60),
    text: para("text", 500),
  }),
  method: z.strictObject({
    title: line("heading", 60),
    text: line("line", 160),
    items: pairs(6, 6, "ideas"),
  }),
  name: z.strictObject({ text: para("text", 400), note: para("story", 600) }),
  team: z.strictObject({ note: para("bio", 300) }),
});

export const classSchema = z.strictObject({
  header: z.strictObject({
    title: line("heading", 60),
    text: para("text", 300),
  }),
  levels: z.strictObject({
    title: line("heading", 60),
    items: pairs(3, 3, "picks"),
  }),
  firstClass: z.strictObject({
    title: line("heading", 60),
    items: z
      .array(line("tip", 120))
      .min(1, "Keep at least 1 tip.")
      .max(8, "Keep 8 tips or fewer."),
  }),
  closing: z.strictObject({
    title: line("heading", 60),
    text: para("text", 300),
  }),
});

export const contactSchema = z.strictObject({
  header: z.strictObject({
    title: line("heading", 60),
    text: para("text", 300),
  }),
  form: z.strictObject({ title: line("heading", 60), text: para("text", 300) }),
  find: z.strictObject({ title: line("heading", 60) }),
});

export const PAGE_KINDS = ["home", "about", "class", "contact"] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

export const PAGES = {
  home: { file: "home.json", schema: homeSchema },
  about: { file: "about.json", schema: aboutSchema },
  class: { file: "class.json", schema: classSchema },
  contact: { file: "contact.json", schema: contactSchema },
} as const;

export const isPageKind = (v: string): v is PageKind =>
  (PAGE_KINDS as readonly string[]).includes(v);
