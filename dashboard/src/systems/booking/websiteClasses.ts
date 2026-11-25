import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// The studio's class list (names, lengths, prices), as the website has it, so the schedule picks from it instead of typing it again.
// Read only. It is edited on the Classes tab. The saved copy (content/local) wins over the starting one (content/data). No list is
// fine: the schedule then lets the owner type the name.
export type ListedClass = { name: string; session: boolean; minutes: number | null; price: number | null }; // price in centavos

export async function websiteClasses(): Promise<ListedClass[]> {
  const site = resolve(process.env.WEBSITE_DIR ?? join(process.cwd(), ".."));
  const folders = [process.env.WEBSITE_CONTENT_DIR ?? join(site, "content", "local"), join(site, "content", "data")];
  for (const folder of folders) {
    try {
      const rows = JSON.parse(await readFile(join(folder, "classes.json"), "utf8")) as Record<string, unknown>[];
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
