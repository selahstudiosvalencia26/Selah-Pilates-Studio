import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { databaseOn, readDocument } from "@/kit/database";

// The studio's class list (names, lengths, prices), as the website has it, so the schedule picks from it instead of typing it again.
// Read only. It is edited on the Classes tab. The saved copy (content/local) wins over the starting one (content/data). No list is
// fine: the schedule then lets the owner type the name.
export type ListedClass = { name: string; session: boolean; minutes: number | null; price: number | null }; // price in centavos

export async function websiteClasses(): Promise<ListedClass[]> {
  const site = resolve(process.env.WEBSITE_DIR ?? join(process.cwd(), ".."));
  const folders = [process.env.WEBSITE_CONTENT_DIR ?? join(site, "content", "local"), join(site, "content", "data")];
  // On a live site the list saved from the dashboard comes first.
  const sources: (() => Promise<unknown>)[] = folders.map((folder) => async () => JSON.parse(await readFile(join(folder, "classes.json"), "utf8")));
  if (databaseOn()) sources.unshift(() => readDocument("classes.json"));
  for (const source of sources) {
    try {
      const rows = (await source()) as Record<string, unknown>[];
      return rows
        .filter((r) => typeof r.name === "string" && r.name.trim() !== "")
        .map((r) => ({
          name: String(r.name).trim(),
          session: r.group === "Private reformer session",
          minutes: typeof r.durationMinutes === "number" ? r.durationMinutes : null,
          price: typeof r.pricePhp === "number" ? Math.round(r.pricePhp * 100) : null,
        }));
    } catch {
      // not there or unreadable: try the next place
    }
  }
  return [];
}
