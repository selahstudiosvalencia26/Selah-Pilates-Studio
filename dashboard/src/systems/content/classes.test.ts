import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { saveClasses } from "./actions";
import { slugify, uniqueSlug } from "./site/classList";

describe("the class list", () => {
  let dir = "";
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "selah-classes-"));
    vi.stubEnv("WEBSITE_CONTENT_DIR", dir);
    vi.stubEnv("NODE_ENV", "development");
    const { mkdir, writeFile } = await import("node:fs/promises");
    vi.stubEnv("WEBSITE_DIR", join(dir, "site"));
    await mkdir(join(dir, "site", "content", "data"), { recursive: true });
    await writeFile(join(dir, "site", "content", "data", "classes.json"), "[]");
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });
  const one = (over: Record<string, unknown> = {}) => ({
    slug: "sculpt",
    name: "Sculpt",
    group: "Group mat class",
    summary: "For strength.",
    level: "",
    focus: "",
    durationMinutes: 55,
    pricePhp: 350,
    ...over,
  });

  it("works out a class's id from its name, keeps an existing id, and never repeats or reuses a reserved one", () => {
    expect(slugify("Hot Flow!")).toBe("hot-flow");
    expect(uniqueSlug("Sculpt", ["sculpt"])).toBe("sculpt-2");
    expect(uniqueSlug("Group Mat", [])).toBe("group-mat-2");
    expect(uniqueSlug("", [])).toBe("class");
  });

  it("saves a new class under an id made from its name, and keeps the others' ids", async () => {
    const r = await saveClasses([
      one(),
      one({
        slug: "new-abc123",
        name: "Reformer Flow",
        group: "Private reformer session",
        pricePhp: 900,
      }),
    ]);
    expect(r.ok && r.data.slugs).toEqual(["sculpt", "reformer-flow"]);
    const saved = JSON.parse(await readFile(join(dir, "classes.json"), "utf8"));
    expect(saved.map((c: { slug: string }) => c.slug)).toEqual([
      "sculpt",
      "reformer-flow",
    ]);
  });

  it("refuses an empty list, a missing name, a bad price, a repeated id and an unknown kind", async () => {
    for (const bad of [
      [],
      [one({ name: " " })],
      [one({ pricePhp: -5 })],
      [one({ durationMinutes: 5 })],
      [one(), one()],
      [one({ slug: "group-mat" })],
      [one({ group: "Spa day" })],
    ])
      expect((await saveClasses(bad)).ok).toBe(false);
  });

  it("does nothing on a live site", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await saveClasses([one()])).toEqual({
      ok: false,
      message: "Saving is not connected yet.",
    });
  });
});
