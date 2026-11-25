import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { contrast } from "@/shell/branding/contrast";
import { describe, expect, it } from "vitest";

// Light and dark must always agree (docs/rules/frontend-rules.md). Every colour token is defined for both, the two dark
// blocks never drift apart, and no system writes its own dark-mode code: it uses the tokens and gets both for free.

const SRC = resolve(__dirname, "..", "src");
const css = readFileSync(join(SRC, "app", "globals.css"), "utf8");

// The custom properties set inside one block, found by its opening line.
function tokens(opening: string): string[] {
  const start = css.indexOf(opening);
  expect(start, `block not found: ${opening}`).toBeGreaterThanOrEqual(0);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return [...body.matchAll(/^\s*(--[a-z-]+):/gm)].map((m) => m[1]);
}

const light = tokens(":root {");
const darkByChoice = tokens(':root[data-theme="dark"]');
const darkByDevice = tokens(':root:not([data-theme="light"])');

// Colours that are the same in light and dark: the client's brand colour and the text on top of it.
const SAME = new Set(["--accent", "--accent-contrast"]);

describe("light and dark", () => {
  it("every colour that changes is defined for dark too", () => {
    const missing = light.filter((t) => !SAME.has(t) && !darkByChoice.includes(t));
    expect(missing).toEqual([]);
  });

  it("the dark colours chosen by the person and by the device are the same", () => {
    expect([...darkByChoice].sort()).toEqual([...darkByDevice].sort());
  });

  it("the status colours exist for systems to use", () => {
    for (const t of ["--success", "--warning", "--danger"]) expect(light).toContain(t);
  });
});

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.(ts|tsx|css)$/.test(name) ? [full] : [];
  });

describe("systems and themes", () => {
  it("a system never writes its own dark-mode code", () => {
    const own = walk(join(SRC, "systems")).filter((f) => !/\.test\./.test(f));
    const broken = own.filter((f) => /\bdark:|prefers-color-scheme|data-theme/.test(readFileSync(f, "utf8")));
    expect(broken).toEqual([]);
  });
});

describe("clickable things", () => {
  it("show the pointing hand, and show when something is switched off", () => {
    expect(css).toMatch(/a\[href\][\s\S]*button:not\(:disabled\)[\s\S]*cursor:\s*pointer/);
    expect(css).toMatch(/button:disabled[\s\S]*cursor:\s*not-allowed/);
  });

  it("a system never makes a div clickable", () => {
    const own = walk(join(SRC, "systems")).filter((f) => /\.tsx$/.test(f));
    const broken = own.filter((f) => /<div[^>]*onClick=/.test(readFileSync(f, "utf8")));
    expect(broken).toEqual([]);
  });
});

// Greys must stay visible. Parse the hex tokens of a block and check the contrast between pairs (WCAG: 4.5 to 1 for text,
// 3 to 1 for the edge of a control you can use).
function hexTokens(opening: string): Record<string, string> {
  const start = css.indexOf(opening);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/^\s*(--[a-z-]+):\s*(#[0-9a-fA-F]{6})/gm)].map((m) => [m[1], m[2]]));
}

describe("greys stay visible", () => {
  const themes = { light: hexTokens(":root {"), dark: { ...hexTokens(":root {"), ...hexTokens(':root[data-theme="dark"]') } };

  for (const [name, t] of Object.entries(themes)) {
    it(`${name}: text is easy to read`, () => {
      expect(contrast(t["--text"], t["--background"]), "text").toBeGreaterThanOrEqual(7);
      expect(contrast(t["--text-soft"], t["--background"]), "soft text").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--text-soft"], t["--surface"]), "soft text on a panel").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--sidebar-text"], t["--sidebar"]), "menu text").toBeGreaterThanOrEqual(4.5);
      expect(contrast(t["--sidebar-muted"], t["--sidebar"]), "menu small text").toBeGreaterThanOrEqual(4.5);
    });

    it(`${name}: the edge of a control can be seen, and panels stand out from the page`, () => {
      expect(contrast(t["--border-strong"], t["--background"]), "control edge").toBeGreaterThanOrEqual(3);
      expect(contrast(t["--border"], t["--background"]), "hairline").toBeGreaterThanOrEqual(1.25);
      expect(contrast(t["--surface"], t["--background"]), "panel").toBeGreaterThanOrEqual(1.05);
    });
  }
});

describe("scrolling", () => {
  it("the page keeps room for its scrollbar, so the layout never jumps sideways", () => {
    expect(css).toMatch(/html\s*\{[^}]*scrollbar-gutter:\s*stable/);
  });

  it("the page column has no scrollbar, so nothing is reserved and the width never changes; other scrollbars are not restyled", () => {
    expect(css).toMatch(/\.frame-scroll\s*\{[^}]*scrollbar-width:\s*none/);
    expect(css).not.toContain("::-webkit-scrollbar-thumb");
    expect(css).not.toContain("::-webkit-scrollbar-track");
    expect(css).not.toMatch(/scrollbar-color:/);
  });
});
