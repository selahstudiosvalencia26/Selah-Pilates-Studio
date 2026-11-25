import { describe, expect, it } from "vitest";
import { scanSource, scanWebsite, websiteRoot } from "./scanSite.mjs";
import { FIXED_IMAGES } from "./site/fixedImages";
import { LISTS } from "./site/lists";
import { SLOTS } from "./site/slots";
import { CLASS_SLOT_PREFIX } from "./site/slots";
import { listSlotPrefix } from "./listDef";

// The rule that stops "only the text is editable": every image in the website must be a photo place the owner can change, or be
// listed on purpose in site/fixedImages.ts. It reads the website's code (the folder above the dashboard) and skips when there is none.
describe("the scanner reads images from source code", () => {
  it("finds photo places written three ways, and images that are not places", () => {
    const r = scanSource(`
      <PhotoSlot slot="home-hero" src="/a.jpg" alt="" />
      <PhotoSlot slot={"about-main"} src={null} alt="" />
      <PhotoSlot slot={\`class-\${item.slug}\`} src={null} alt="" />
      <PhotoSlot
        slot={group === "Group mat class" ? "class-group-mat" : "class-group-private"}
        src={null}
        alt=""
      />
      <Image src="/logo.png" alt="" />
    `);
    expect(r.slots.sort()).toEqual(["about-main", "class-group-mat", "class-group-private", "home-hero"]);
    expect(r.prefixes).toEqual(["class-"]);
    expect(r.raws).toHaveLength(1);
  });

  it("does not count the PhotoSlot component's own image", () => {
    const r = scanSource("export function PhotoSlot() { return <Image src={x} alt='' />; }");
    expect(r.raws).toEqual([]);
  });
});

const root = websiteRoot();
describe.skipIf(!root)("every image in this website can be changed from the dashboard", () => {
  const found = root ? scanWebsite(root) : { slots: new Map<string, string[]>(), prefixes: new Map<string, string[]>(), fixed: [] };
  const known = new Set(SLOTS.map((s) => s.id));

  it("has a photo place in site/slots.ts for each <PhotoSlot slot>", () => {
    const missing = [...found.slots.keys()].filter((id) => !known.has(id));
    expect(missing, `Add these to site/slots.ts so the owner can replace them: ${missing.join(", ")}`).toEqual([]);
  });

  it("has photo places for the ones built from a name (a class, a team member, a list item)", () => {
    const covered = (p: string) => p === CLASS_SLOT_PREFIX || LISTS.some((l) => p === listSlotPrefix(l)) || SLOTS.some((s) => s.id.startsWith(p));
    const missing = [...found.prefixes.keys()].filter((p) => !covered(p));
    expect(missing, `No place in site/slots.ts (or a list in site/lists.ts) starts with: ${missing.join(", ")}`).toEqual([]);
  });

  it("has no image that is neither a photo place nor listed on purpose", () => {
    const allowed = new Set(FIXED_IMAGES.map((f) => f.file));
    const loose = found.fixed.filter((f) => !allowed.has(f.file)).map((f) => `${f.file}:${f.line}`);
    expect(
      loose,
      `These images cannot be changed from the dashboard. Make each a <PhotoSlot slot="..."> with a place in site/slots.ts, or list its file in site/fixedImages.ts with a reason: ${loose.join(", ")}`,
    ).toEqual([]);
  });

  it("lists only files that still have an image", () => {
    const withImages = new Set(found.fixed.map((f) => f.file));
    const stale = FIXED_IMAGES.filter((f) => !withImages.has(f.file)).map((f) => f.file);
    expect(stale, `site/fixedImages.ts lists files with no image any more: ${stale.join(", ")}`).toEqual([]);
  });
});
