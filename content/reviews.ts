// Client reviews, added in the dashboard (Website, Reviews). Only real ones, with the client's permission. The starting point is
// content/data/reviews.json; while building, the dashboard's saved copy in content/local is read on every request.
// Server only: do not import this from a client component.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import data from "./data/reviews.json";

export type Review = {
  slug: string;
  name: string;
  review: string;
  published: boolean;
};

function all(): Review[] {
  if (process.env.NODE_ENV !== "production") {
    try {
      return JSON.parse(
        readFileSync(
          join(process.cwd(), "content", "local", "reviews.json"),
          "utf8",
        ),
      ) as Review[];
    } catch {
      /* no local copy yet: use the committed one */
    }
  }
  return data as Review[];
}

export const reviews = () => all().filter((r) => r.published);
