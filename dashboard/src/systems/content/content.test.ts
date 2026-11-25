import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { saveHours, savePage, saveSite } from "./actions";
import { LAYOUTS } from "./site/layouts";
import { PAGE_KINDS, PAGES } from "./site/pages";
import { hoursSchema, siteSchema } from "./schema";

const site = {
  name: "Selah Pilates Studio",
  tagline: "Strength in the pause.",
  description: "Mat and reformer pilates.",
  street: "Purok 16, Valero Street",
  barangay: "Poblacion",
  postalCode: "8709",
  city: "Valencia City",
  province: "Bukidnon",
  latitude: 7.91139,
  longitude: 125.0924,
  phone: "",
  email: "",
  facebook: "https://www.facebook.com/example",
  instagram: "",
  bookingUrl: "",
};
const week = {
  mon: { open: "08:00", close: "20:00" },
  tue: { open: "08:00", close: "20:00" },
  wed: { open: "08:00", close: "20:00" },
  thu: { open: "08:00", close: "20:00" },
  fri: { open: "08:00", close: "20:00" },
  sat: { open: "08:00", close: "17:00" },
  sun: "closed",
};

describe("site information: what is allowed", () => {
  it("accepts the real facts, with phone, email and links left empty", () => {
    expect(siteSchema.safeParse(site).success).toBe(true);
  });

  it("refuses a missing name, a bad postal code, a bad link, a bad email and an unknown field", () => {
    for (const bad of [
      { ...site, name: " " },
      { ...site, postalCode: "87" },
      { ...site, facebook: "http://plain.example.com" },
      { ...site, facebook: "javascript:alert(1)" },
      { ...site, email: "not an email" },
      { ...site, phone: "call me" },
      { ...site, latitude: 200 },
      { ...site, role: "owner" },
    ])
      expect(siteSchema.safeParse(bad).success).toBe(false);
  });
});

describe("opening hours: what is allowed", () => {
  it("accepts open days with times and a closed day", () => {
    expect(hoursSchema.safeParse(week).success).toBe(true);
  });

  it("refuses a day that closes before it opens, and a time that is not a time", () => {
    expect(
      hoursSchema.safeParse({ ...week, mon: { open: "20:00", close: "08:00" } })
        .success,
    ).toBe(false);
    expect(
      hoursSchema.safeParse({ ...week, mon: { open: "8am", close: "5pm" } })
        .success,
    ).toBe(false);
  });
});

describe("saving", () => {
  let dir = "";
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "selah-content-"));
    vi.stubEnv("WEBSITE_CONTENT_DIR", dir);
    vi.stubEnv("NODE_ENV", "development");
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  it("writes the checked values to the local folder, never the committed one", async () => {
    expect((await saveSite({ ...site, name: "  Selah  " })).ok).toBe(true);
    expect(
      JSON.parse(await readFile(join(dir, "site.json"), "utf8")).name,
    ).toBe("Selah");
    expect((await saveHours(week)).ok).toBe(true);
    expect(
      JSON.parse(await readFile(join(dir, "hours.json"), "utf8")).sun,
    ).toBe("closed");
  });

  it("refuses a bad value with a plain message and writes nothing", async () => {
    const r = await saveSite({ ...site, postalCode: "x" });
    expect(r).toMatchObject({ ok: false, field: "postalCode" });
    await expect(readFile(join(dir, "site.json"), "utf8")).rejects.toThrow();
  });

  it("does nothing on a live site, where nobody is signed in yet", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await saveSite(site)).toEqual({
      ok: false,
      message: "Saving is not connected yet.",
    });
    expect(await saveHours(week)).toEqual({
      ok: false,
      message: "Saving is not connected yet.",
    });
    await expect(readFile(join(dir, "site.json"), "utf8")).rejects.toThrow();
  });
});

// The website folder sits next to the dashboard folder. When it is there, its real starting content must pass these checks, so the
// editor never opens on a file it would refuse to save.
const websiteData = join(
  process.cwd(),
  "..",
  "..",
  "..",
  "Selah Pilates Studio",
  "content",
  "data",
);
describe("the website's own page files", () => {
  for (const kind of PAGE_KINDS) {
    it(`${kind}.json passes the checks and every editor field points at something real`, async () => {
      let text: string;
      try {
        text = await readFile(join(websiteData, PAGES[kind].file), "utf8");
      } catch {
        return; // the website folder is not here: nothing to compare
      }
      const data = JSON.parse(text);
      expect(PAGES[kind].schema.safeParse(data).success).toBe(true);
      for (const section of LAYOUTS[kind])
        for (const f of section.fields) {
          const found = f.path.reduce(
            (v: unknown, k) => (v as Record<string, unknown> | undefined)?.[k],
            data,
          );
          expect(found, `${kind}: ${f.path.join(".")}`).not.toBeUndefined();
        }
    });
  }
});

describe("saving a page's words", () => {
  let dir = "";
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "selah-pages-"));
    vi.stubEnv("WEBSITE_CONTENT_DIR", dir);
    vi.stubEnv("NODE_ENV", "development");
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  const contact = {
    header: { title: "Get in touch", text: "Write to us." },
    form: { title: "Send us a message", text: "Tell us about you." },
    find: { title: "Come and visit" },
  };

  it("writes a checked page and refuses an empty heading, an unknown page and a live site", async () => {
    expect((await savePage("contact", contact)).ok).toBe(true);
    expect(
      JSON.parse(await readFile(join(dir, "contact.json"), "utf8")).find.title,
    ).toBe("Come and visit");

    const empty = await savePage("contact", {
      ...contact,
      find: { title: " " },
    });
    expect(empty).toMatchObject({ ok: false, field: "find.title" });
    expect((await savePage("../../site", contact)).ok).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    expect(await savePage("contact", contact)).toEqual({
      ok: false,
      message: "Saving is not connected yet.",
    });
  });
});
