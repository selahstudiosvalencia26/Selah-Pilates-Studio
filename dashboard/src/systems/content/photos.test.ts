import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { savePhotos } from "./actions";
import { LAYOUTS } from "./site/layouts";
import { isWebp } from "./photoRules";
import { PAGE_KINDS } from "./site/pages";
import { SLOTS } from "./site/slots";

// A file that starts like a WebP (RIFF, four size bytes, WEBP). Enough for the first-bytes check.
const webp = (extra = 20) =>
  new Uint8Array([
    ...Buffer.from("RIFF"),
    0,
    0,
    0,
    0,
    ...Buffer.from("WEBP"),
    ...new Array(extra).fill(0),
  ]);
const photoForm = (
  changes: unknown[],
  files: Record<string, Uint8Array> = {},
) => {
  const form = new FormData();
  form.set("changes", JSON.stringify(changes));
  for (const [k, v] of Object.entries(files))
    form.set(k, new Blob([v.slice().buffer as ArrayBuffer]), "x.webp");
  return form;
};

describe("photos", () => {
  let dir = "";
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "selah-photos-"));
    vi.stubEnv("WEBSITE_CONTENT_DIR", join(dir, "local"));
    vi.stubEnv("WEBSITE_UPLOADS_DIR", join(dir, "uploads"));
    vi.stubEnv("WEBSITE_DIR", join(dir, "site"));
    vi.stubEnv("NODE_ENV", "development");
    // the committed starting point: no photos yet
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(join(dir, "site", "content", "data"), { recursive: true });
    await writeFile(join(dir, "site", "content", "data", "photos.json"), "{}");
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  it("knows a WebP by its first bytes and refuses anything else", () => {
    expect(isWebp(webp())).toBe(true);
    expect(
      isWebp(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0])),
    ).toBe(false); // a PNG
    expect(isWebp(new Uint8Array(5))).toBe(false);
  });

  it("every photo place has a unique name the website can use", () => {
    expect(new Set(SLOTS.map((s) => s.id)).size).toBe(SLOTS.length);
    for (const s of SLOTS) expect(s.id).toMatch(/^[a-z0-9-]{3,40}$/);
  });

  it("saves a photo with its description, then replaces it", async () => {
    const r = await savePhotos(
      photoForm(
        [
          {
            slot: "home-hero",
            alt: "The studio in soft light",
            fileKey: "file-0",
          },
        ],
        { "file-0": webp() },
      ),
    );
    expect(r.ok).toBe(true);
    const saved = JSON.parse(
      await readFile(join(dir, "local", "photos.json"), "utf8"),
    );
    expect(saved["home-hero"].alt).toBe("The studio in soft light");
    expect(saved["home-hero"].file).toMatch(/^[a-f0-9]{12}\.webp$/);
    expect(await readdir(join(dir, "uploads"))).toEqual([
      saved["home-hero"].file,
    ]);

    // only the description changes: the file stays
    expect(
      (
        await savePhotos(
          photoForm([{ slot: "home-hero", alt: "A calm studio" }]),
        )
      ).ok,
    ).toBe(true);
    const again = JSON.parse(
      await readFile(join(dir, "local", "photos.json"), "utf8"),
    );
    expect(again["home-hero"]).toEqual({
      file: saved["home-hero"].file,
      alt: "A calm studio",
      x: 50,
      y: 50,
    });
  });

  it("refuses a missing description, an unknown place, a file that is not a WebP, one that is too heavy, and no photo at all", async () => {
    const msg = async (form: FormData) => {
      const r = await savePhotos(form);
      return r.ok ? "" : r.message;
    };
    expect(
      await msg(
        photoForm([{ slot: "home-hero", alt: " ", fileKey: "file-0" }], {
          "file-0": webp(),
        }),
      ),
    ).toMatch(/Describe the photo/);
    expect(
      await msg(
        photoForm([{ slot: "../etc", alt: "x", fileKey: "file-0" }], {
          "file-0": webp(),
        }),
      ),
    ).toMatch(/not known/);
    expect(
      await msg(
        photoForm([{ slot: "home-hero", alt: "x", fileKey: "file-0" }], {
          "file-0": new Uint8Array(40),
        }),
      ),
    ).toMatch(/not a photo/);
    expect(
      await msg(
        photoForm([{ slot: "home-hero", alt: "x", fileKey: "file-0" }], {
          "file-0": webp(700 * 1024),
        }),
      ),
    ).toMatch(/too heavy/);
    expect(await msg(photoForm([{ slot: "home-hero", alt: "x" }]))).toMatch(
      /Add a photo/,
    );
    expect(await readdir(join(dir, "uploads")).catch(() => [])).toEqual([]);
  });

  it("removes a photo from its place, and does nothing on a live site", async () => {
    await savePhotos(
      photoForm(
        [{ slot: "about-main", alt: "The studio", fileKey: "file-0" }],
        { "file-0": webp() },
      ),
    );
    expect(
      (
        await savePhotos(
          photoForm([{ slot: "about-main", alt: "", remove: true }]),
        )
      ).ok,
    ).toBe(true);
    expect(
      JSON.parse(await readFile(join(dir, "local", "photos.json"), "utf8")),
    ).toEqual({});

    vi.stubEnv("NODE_ENV", "production");
    expect(
      await savePhotos(
        photoForm([{ slot: "about-main", alt: "x", fileKey: "file-0" }], {
          "file-0": webp(),
        }),
      ),
    ).toEqual({ ok: false, message: "Saving is not connected yet." });
  });
});

describe("photo places in the page editors", () => {
  it("every place a part of a page lists exists, and every place is listed somewhere", () => {
    const listed = new Set<string>();
    for (const kind of PAGE_KINDS)
      for (const section of LAYOUTS[kind])
        for (const id of section.photos ?? []) {
          expect(
            SLOTS.some((s) => s.id === id),
            `${kind} / ${section.title}: ${id}`,
          ).toBe(true);
          listed.add(id);
        }
    for (const s of SLOTS)
      expect(listed.has(s.id), `${s.id} is not shown in any editor`).toBe(true);
  });
});
