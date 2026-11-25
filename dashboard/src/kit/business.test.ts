import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_BUSINESS, getBusiness, setBusinessName } from "./business";

// The business name every system can read (business.ts).
let dir: string;
let before: string;
const slot = globalThis as unknown as { __businessName?: string };

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "business-"));
  before = process.cwd();
  process.chdir(dir);
  delete slot.__businessName;
});
afterEach(() => {
  process.chdir(before);
  rmSync(dir, { recursive: true, force: true });
  delete slot.__businessName;
});
const saved = (text: string) => (mkdirSync(join(dir, "setup"), { recursive: true }), writeFileSync(join(dir, "setup", "business.json"), text));

describe("the business name", () => {
  it("is the plain default when nothing was saved", () => expect(getBusiness()).toEqual(DEFAULT_BUSINESS));
  it("is the name the installer saved", () => {
    saved(JSON.stringify({ name: "Dan Cafe" }));
    expect(getBusiness().name).toBe("Dan Cafe");
  });
  it("is the name set on the Branding screen, ahead of the installer's", () => {
    saved(JSON.stringify({ name: "Dan Cafe" }));
    setBusinessName("Dan's Cafe and Events");
    expect(getBusiness().name).toBe("Dan's Cafe and Events");
  });
  it("keeps to the 40 letters the Branding screen allows", () => {
    saved(JSON.stringify({ name: "x".repeat(80) }));
    expect(getBusiness().name).toHaveLength(40);
  });
  it("ignores a file that is broken or has no name", () => {
    saved("{ not json");
    expect(getBusiness()).toEqual(DEFAULT_BUSINESS);
    saved(JSON.stringify({ name: 42 }));
    expect(getBusiness()).toEqual(DEFAULT_BUSINESS);
    saved(JSON.stringify({ name: "   " }));
    expect(getBusiness()).toEqual(DEFAULT_BUSINESS);
  });
});
