import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

// The structure rules that keep the dashboard easy to maintain and to grow (docs/architecture/system-architecture.md, section 3).
// They run with the tests, so a change that breaks them cannot ship. Plain reading of the source, no running of it.
//
//   systems/<id>/   may use: its own folder, the toolbox (@/kit), and the description helper. Never another system,
//                   never the shell's insides, never the database package.
//   shell/          may use the toolbox and the database layer. It reaches systems only through the registry.
//   kit/            may use only the database layer. It knows nothing about the shell or any system.
//   lib/            the only place that may import the database package.
//   systems         never write a colour by hand: they use the dashboard's variables.
//   every file      stays small enough to read at a glance.

const SRC = resolve(__dirname, "..", "src");
const MAX_LINES = 400;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.(ts|tsx)$/.test(name) ? [full] : [];
  });

const FILES = walk(SRC);
const rel = (f: string) => relative(SRC, f).split(sep).join("/");
const imports = (file: string): string[] => [...readFileSync(file, "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);
const isTest = (f: string) => /\.test\.tsx?$/.test(f);
const inside = (dir: string) => FILES.filter((f) => rel(f).startsWith(`${dir}/`) && !isTest(f));

// Where an import points, as a path under src (or null for an outside package).
function target(file: string, spec: string): string | null {
  if (spec.startsWith("@/")) return spec.slice(2);
  if (spec.startsWith(".")) return relative(SRC, resolve(file, "..", spec)).split(sep).join("/");
  return null;
}

describe("systems stay separate", () => {
  const systems = inside("systems").filter((f) => rel(f).split("/").length > 2);

  it("a system only uses its own folder, the toolbox and the description helper", () => {
    const broken: string[] = [];
    for (const f of systems) {
      const own = rel(f).split("/")[1];
      for (const spec of imports(f)) {
        if (spec.startsWith("@supabase")) broken.push(`${rel(f)} imports the database package: ${spec}`);
        const t = target(f, spec);
        if (t === null) continue;
        const ok = t.startsWith(`systems/${own}/`) || t === `systems/${own}` || t.startsWith("kit/") || t === "shell/systems/manifest";
        if (!ok) broken.push(`${rel(f)} reaches outside itself: ${spec}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("a system never writes a colour by hand", () => {
    const palette = /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/;
    const hex = /#[0-9a-fA-F]{3,8}\b/;
    const broken = systems.filter((f) => /\.tsx$/.test(f)).filter((f) => palette.test(readFileSync(f, "utf8")) || hex.test(readFileSync(f, "utf8"))).map(rel);
    expect(broken).toEqual([]);
  });
});

describe("the shell and the toolbox", () => {
  it("the shell reaches systems only through the registry", () => {
    const broken = inside("shell").filter((f) => rel(f) !== "shell/registry.ts").flatMap((f) => imports(f).filter((s) => (target(f, s) ?? "").startsWith("systems")).map((s) => `${rel(f)}: ${s}`));
    expect(broken).toEqual([]);
  });

  it("the toolbox knows nothing about the shell or any system", () => {
    const broken = inside("kit").flatMap((f) => imports(f).filter((s) => /^(shell|systems)\b/.test(target(f, s) ?? "")).map((s) => `${rel(f)}: ${s}`));
    expect(broken).toEqual([]);
  });

  it("only the database layer imports the database package", () => {
    const broken = FILES.filter((f) => !rel(f).startsWith("lib/")).flatMap((f) => imports(f).filter((s) => s.startsWith("@supabase")).map((s) => `${rel(f)}: ${s}`));
    expect(broken).toEqual([]);
  });
});

// Pages use the whole width (decided 2026-11-22): a system or its pages never cap their own width. Only a paragraph of reading text
// may be narrow (up to max-w-2xl), and a few small boxes (a message, a hint column of 16rem) may be fixed.
describe("pages are full width", () => {
  const pages = FILES.filter((f) => /\.tsx$/.test(f) && !isTest(f) && (rel(f).startsWith("systems/") || rel(f).startsWith("app/(shell)/")));
  const allowed = /^max-w-(?:xs|sm|md|lg|xl|2xl|full|\[16rem\])$/;

  it("no system or system page sets a wide maximum width", () => {
    const broken: string[] = [];
    for (const f of pages) {
      for (const m of readFileSync(f, "utf8").matchAll(/(?<![\w-])max-w-[^\s"'`}]+/g)) {
        if (!allowed.test(m[0])) broken.push(`${rel(f)}: ${m[0]}`);
      }
    }
    expect(broken, "Remove the maximum width: the dashboard is full width. Only reading text may use max-w-2xl or less.").toEqual([]);
  });
});

// Words that break the principles (docs/rules/principles.md): no "Are you sure?" pop-up (undo instead, rule 6), and no vague error
// (say what went wrong and how to fix it, rule 8).
describe("plain words and undo", () => {
  const all = FILES.filter((f) => !isTest(f));
  const find = (re: RegExp) => all.filter((f) => re.test(readFileSync(f, "utf8"))).map(rel);

  it("nothing asks \"Are you sure?\" in a pop-up", () => {
    expect(find(/window\.confirm\(|\bconfirm\(\s*["'`]|Are you sure/), "Remove at once and offer Undo instead (systems/content/Undo.tsx).").toEqual([]);
  });

  it("no message says only that something went wrong", () => {
    expect(find(/Something went wrong|An error occurred|Unknown error/), "Say what went wrong and how to fix it, in everyday words.").toEqual([]);
  });
});

// Saving looks and behaves the same everywhere (docs/rules/frontend-rules.md, "Saving"): one Save bar, in the toolbox, lined up with the
// frame's rounded panel. A screen that makes its own bar at the bottom of the window crosses the panel's border, so none may.
describe("saving looks the same everywhere", () => {
  it("only the toolbox's Save bar sticks to the bottom of the screen", () => {
    const own = FILES.filter((f) => !isTest(f) && rel(f) !== "kit/SaveBar.tsx" && /sticky bottom-/.test(readFileSync(f, "utf8"))).map(rel);
    expect(own, 'Use <SaveBar /> from "@/kit/SaveBar" instead of a bar of your own.').toEqual([]);
  });
});

// Form controls look and behave the same everywhere (docs/rules/frontend-rules.md, "Form controls"). The browser's own dropdown and clock box
// cannot be styled, differ in every browser and are poor on a phone, so the toolbox has its own: Select and TimeSelect (a popover on a
// computer, a sheet on a phone). Only the toolbox itself may touch the browser's versions.
describe("form controls come from the toolbox", () => {
  const offenders = (pattern: RegExp) => FILES.filter((f) => !isTest(f) && !rel(f).startsWith("kit/") && pattern.test(readFileSync(f, "utf8"))).map(rel);
  it("no screen uses the browser's own dropdown", () => {
    expect(offenders(/<select[\s>]/), 'Use <Select /> from "@/kit/Select".').toEqual([]);
  });
  it("no screen uses the browser's own time box", () => {
    expect(offenders(/type="time"/), 'Use <TimeSelect /> from "@/kit/TimeSelect".').toEqual([]);
  });
});

describe("files stay small", () => {
  it(`no file is longer than ${MAX_LINES} lines`, () => {
    const long = FILES.filter((f) => readFileSync(f, "utf8").split("\n").length > MAX_LINES).map(rel);
    expect(long).toEqual([]);
  });
});

describe("loading", () => {
  it("the shell has a loading state for every page, and the toolbox has the placeholder", () => {
    expect(existsSync(join(SRC, "app", "(shell)", "loading.tsx"))).toBe(true);
    expect(existsSync(join(SRC, "kit", "Skeleton.tsx"))).toBe(true);
  });
});

describe("every system is added the same way", () => {
  it("each folder has a description file, and is listed in the registry", () => {
    const folders = readdirSync(join(SRC, "systems")).filter((n) => statSync(join(SRC, "systems", n)).isDirectory());
    const index = readFileSync(join(SRC, "systems", "index.ts"), "utf8");
    const missing = folders.filter((n) => !FILES.some((f) => rel(f) === `systems/${n}/manifest.ts`) || !index.includes(`./${n}/manifest`));
    expect(missing).toEqual([]);
  });
});
