import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Every database file is also collected in <project>/db, numbered in the order to run it. This fails when one is missing there or
// differs, so the folder can be trusted.
const dashboard = resolve(__dirname, "..");
const collected = join(dashboard, "..", "db");

const sqlIn = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith(".sql")).map((n) => join(dir, n)) : []);
const text = (file: string) => readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();

describe.runIf(existsSync(collected))("the db folder", () => {
  const systems = join(dashboard, "src", "systems");
  const sources = [
    ...sqlIn(join(dashboard, "supabase", "migrations")),
    ...readdirSync(systems)
      .filter((n) => statSync(join(systems, n)).isDirectory())
      .flatMap((n) => sqlIn(join(systems, n, "migrations"))),
  ];
  const copies = sqlIn(collected).map(text);

  it("holds a copy of every database file, unchanged", () => {
    const missing = sources.filter((s) => !copies.includes(text(s))).map((s) => s.slice(dashboard.length + 1));
    expect(missing, "Copy these into db/ with the next number.").toEqual([]);
    expect(copies.length).toBe(sources.length);
  });
});
