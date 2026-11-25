// The blog posts, written in the dashboard (Website, Blog). The starting point is content/data/blog.json (what a build for the live
// site uses). While you work (npm run dev) the dashboard saves to content/local/blog.json instead, read fresh on every request, so
// a new post shows after a reload. Server only: do not import this from a client component.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import data from "./data/blog.json";

export type Post = {
  slug: string;
  title: string;
  date: string; // 2026-11-25
  summary: string;
  body: string;
  published: boolean;
};

function all(): Post[] {
  if (process.env.NODE_ENV !== "production") {
    try {
      return JSON.parse(
        readFileSync(
          join(process.cwd(), "content", "local", "blog.json"),
          "utf8",
        ),
      ) as Post[];
    } catch {
      /* no local copy yet: use the committed one */
    }
  }
  return data as Post[];
}

/** The posts to show, newest first. */
export const posts = (): Post[] =>
  all()
    .filter((p) => p.published)
    .sort((a, b) => b.date.localeCompare(a.date));

export const postBySlug = (slug: string) =>
  posts().find((p) => p.slug === slug);

export const postDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
