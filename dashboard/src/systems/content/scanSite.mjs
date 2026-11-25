// Finds every image in a client's website code, so the content system can make each one editable (or say, on purpose, that it is not).
// Run it by hand to see the list:   node src/systems/content/scanSite.mjs [the website folder]
// The test photoCoverage.test.ts uses the same functions and fails when an image in the website cannot be changed from the dashboard.
//
// What counts: a <PhotoSlot slot="..."> is editable (its id must have a place in site/slots.ts). Anything else that draws an image
// (<Image>, <img>, a CSS url(...)) is "fixed" and must be listed in site/fixedImages.ts, with a reason, or it is reported.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SKIP = new Set(["node_modules", "dashboard", "public", "out"]); // and every folder that starts with a dot or an underscore (.next, .git, _unused-images)
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/; // what a photo place id looks like; other words in the same expression are not ids
const SOURCE = /\.(tsx|jsx|ts|js|css)$/;

// The text between the braces that start at `from` (which points at "{"), braces inside it counted.
function balanced(text, from) {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return text.slice(from + 1, i);
  }
  return text.slice(from + 1);
}

/** What one source file says about images: the slot ids it uses, the starts of ids it builds, and the images that are not slots. */
export function scanSource(text) {
  const slots = new Set();
  const prefixes = new Set();
  const definesSlot = /export\s+(default\s+)?function\s+PhotoSlot\b|const\s+PhotoSlot\b/.test(text);

  for (const m of text.matchAll(/<PhotoSlot\b/g)) {
    const at = m.index ?? 0;
    const end = text.indexOf("/>", at);
    const tag = text.slice(at, end === -1 ? at + 600 : end);
    const attr = /\bslot=/.exec(tag);
    if (!attr) continue;
    const rest = tag.slice(attr.index + 5);
    if (rest[0] === '"') {
      const id = rest.slice(1, rest.indexOf('"', 1));
      if (id) slots.add(id);
    } else if (rest[0] === "{") {
      const expr = balanced(tag, attr.index + 5);
      for (const lit of expr.matchAll(/"([^"]*)"|'([^']*)'/g)) {
        const id = lit[1] ?? lit[2];
        if (id && ID.test(id)) slots.add(id);
      }
      for (const lit of expr.matchAll(/`([^`]*)`/g)) {
        const i = lit[1].indexOf("${");
        if (i === -1) slots.add(lit[1]);
        else if (i > 0) prefixes.add(lit[1].slice(0, i));
      }
    }
  }

  const raws = [];
  if (!definesSlot) {
    text.split(/\r?\n/).forEach((line, i) => {
      if (/<Image\b|<img\b|background(-image)?\s*:\s*url\(|url\(\s*['"]?\//.test(line)) raws.push({ line: i + 1, text: line.trim().slice(0, 100) });
    });
  }
  return { slots: [...slots], prefixes: [...prefixes], raws };
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name) || name.startsWith(".") || name.startsWith("_") || name.endsWith(".d.ts")) return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return SOURCE.test(name) ? [full] : [];
  });
}

/** Where the website is, if this really is one: the folder above the dashboard (WEBSITE_DIR points somewhere else). */
export function websiteRoot(cwd = process.cwd()) {
  const root = resolve(process.env.WEBSITE_DIR ?? join(cwd, ".."));
  return existsSync(join(root, "package.json")) && existsSync(join(root, "app")) ? root : null;
}

/** Every image in the website's code. `fixed` is where images that are not slots are drawn. */
export function scanWebsite(root) {
  const slots = new Map(); // id -> files that use it
  const prefixes = new Map();
  const fixed = [];
  for (const file of walk(root)) {
    const rel = relative(root, file).split(sep).join("/");
    const r = scanSource(readFileSync(file, "utf8"));
    for (const id of r.slots) slots.set(id, [...(slots.get(id) ?? []), rel]);
    for (const p of r.prefixes) prefixes.set(p, [...(prefixes.get(p) ?? []), rel]);
    for (const x of r.raws) fixed.push({ file: rel, ...x });
  }
  return { slots, prefixes, fixed };
}

// By hand: node src/systems/content/scanSite.mjs [folder]
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const root = process.argv[2] ? resolve(process.argv[2]) : websiteRoot();
  if (!root) {
    console.error("No website found. Run this in the dashboard folder inside a website, or give the website folder.");
    process.exit(1);
  }
  const r = scanWebsite(root);
  console.log(`Website: ${root}\n`);
  console.log(`Editable photo places (<PhotoSlot slot="...">): ${r.slots.size}`);
  for (const [id, files] of [...r.slots].sort()) console.log(`  ${id.padEnd(28)} ${files.join(", ")}`);
  console.log(`\nPhoto places built from a name (slot={\`start-\${...}\`}): ${r.prefixes.size}`);
  for (const [p, files] of [...r.prefixes].sort()) console.log(`  ${p.padEnd(28)} ${files.join(", ")}`);
  console.log(`\nImages that are NOT editable (each needs a <PhotoSlot>, or a reason in site/fixedImages.ts): ${r.fixed.length}`);
  for (const f of r.fixed) console.log(`  ${f.file}:${f.line}  ${f.text}`);
  console.log("\nNext: every id above must have a place in site/slots.ts (npm run check tells you which are missing).");
}
