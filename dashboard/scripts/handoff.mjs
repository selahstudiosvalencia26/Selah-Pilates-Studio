// Makes a clean copy of the dashboard to give to a client, with as little information about how it was made as possible.
// Usage: npm run handoff -- <empty folder outside this repo> --client="Client Name" --licensor="Your Name"
//
// What it leaves out: the plans and rules (docs/, CLAUDE.md, the agent skills), the tests and the builder's scripts, your
// own settings (.env.local), build leftovers and the git history. What it changes: every comment in the code is removed
// (comments explain WHY, which is exactly what a copier wants), the README is a short neutral one, package.json keeps only the
// commands a client needs, and the builder-only setting is taken out of .env.example.
// It then checks the copy for words that give the project away, and stops with a list if it finds any.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The repo this app lives in: the nearest folder above it that has a .git. The copy must go outside it.
const findRepo = (dir) => (existsSync(join(dir, ".git")) || dirname(dir) === dir ? dir : findRepo(dirname(dir)));
const repo = findRepo(app);
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3).trim() ?? "";
const folder = args.find((a) => !a.startsWith("--"));
const out = folder ? resolve(folder) : "";
const client = flag("client");
const licensor = flag("licensor");

if (!out) {
  console.error("Give an empty folder outside this repo, for example: npm run handoff -- ../../client-copy");
  process.exit(1);
}
if (out === repo || out.startsWith(repo + sep)) {
  console.error("The copy must go outside this repo, so it can never be committed here by accident.");
  process.exit(1);
}
if (existsSync(out) && readdirSync(out).length > 0) {
  console.error("That folder is not empty. Choose a new or empty one.");
  process.exit(1);
}

// Left out entirely. Names are matched on the folder or file name anywhere in the tree.
const SKIP_NAMES = new Set(["node_modules", ".next", ".git", "scripts", "tests", "tsconfig.tsbuildinfo", "README.md", "vitest.config.mts", "package-lock.json", ".env.local"]);
const skip = (name) => SKIP_NAMES.has(name) || name.endsWith(".test.ts") || name.endsWith(".test.tsx") || (name.startsWith(".env") && name !== ".env.example");

mkdirSync(out, { recursive: true });
cpSync(app, out, { recursive: true, filter: (src) => !skip(src.split(sep).pop() ?? "") });

// Remove every comment from the code. The printer rewrites the file from its syntax tree, so comments cannot survive.
const printer = ts.createPrinter({ removeComments: true });
let stripped = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (/\.(tsx?|mts)$/.test(name) && !name.endsWith(".d.ts")) {
      const kind = name.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, kind);
      writeFileSync(file, printer.printFile(source));
      stripped += 1;
    }
  }
};
for (const dir of ["src"]) walk(join(out, dir));
// The style sheet carries comments too.
const css = join(out, "src", "app", "globals.css");
if (existsSync(css)) writeFileSync(css, readFileSync(css, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n{3,}/g, "\n\n"));
for (const name of ["next.config.ts"]) {
  const file = join(out, name);
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  writeFileSync(file, printer.printFile(source));
}

// The visible licence notice. The names are filled in from the two flags; without them the brackets stay, and the script says so.
const notice = readFileSync(join(app, "scripts", "NOTICE.template.txt"), "utf8").replaceAll("{{CLIENT}}", client || "[Client name]").replaceAll("{{LICENSOR}}", licensor || "[Your name]");
writeFileSync(join(out, "NOTICE"), notice);

// A neutral README, the commands a client needs, and no builder-only setting.
writeFileSync(join(out, "README.md"), "# Dashboard\n\nInstall with `npm install`, copy `.env.example` to `.env.local` and fill it in, then run `npm run dev`.\n");
const pkg = JSON.parse(readFileSync(join(out, "package.json"), "utf8"));
pkg.license = "SEE LICENSE IN NOTICE";
pkg.scripts = { dev: "next dev", build: "next build", start: "next start", lint: pkg.scripts.lint, typecheck: pkg.scripts.typecheck };
writeFileSync(join(out, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
const envFile = join(out, ".env.example");
if (existsSync(envFile)) {
  const kept = readFileSync(envFile, "utf8").split("\n").filter((l) => !/BUILDER_PAGES|builder-only|Systems page|Never set it on a client/i.test(l));
  writeFileSync(envFile, kept.join("\n"));
}

// Check the copy for anything that gives the project away.
const GIVEAWAYS = [/(?<![\w./-])docs\//i, /CLAUDE/, /\.claude/, /shell-plan/i, /system-design/i, /\bImpeccable\b/i, /Emil Kowalski/i];
const found = [];
const scan = (dir) => {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) scan(file);
    else if (/\.(tsx?|mts|mjs|json|md|css|sql|example)$/.test(name)) {
      const text = readFileSync(file, "utf8");
      for (const re of GIVEAWAYS) if (re.test(text)) found.push(`${relative(out, file)}  (${re})`);
    }
  }
};
scan(out);

// Builder-only code that is still in the copy (until it is moved to its own folder): listed so it is never a surprise.
const builder = [];
const scanBuilder = (dir) => {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) scanBuilder(file);
    else if (/\.(tsx?|mts)$/.test(name) && /BUILDER_PAGES/.test(readFileSync(file, "utf8"))) builder.push(relative(out, file));
  }
};
scanBuilder(join(out, "src"));

console.log(`Copy ready in ${out}`);
if (!client || !licensor) console.warn('\nWARNING: the NOTICE still has [Client name] or [Your name] in it. Run again with --client="..." --licensor="...".');
console.log(`Comments removed from ${stripped + 1} files. Left out: docs, plans, agent skills, tests, scripts, your .env.local, build files.`);
if (builder.length) console.log(`\nBuilder-only code still inside (it hides itself in production, but it is there):\n  ${builder.join("\n  ")}`);
if (found.length) {
  console.error(`\nSTOP. These files still give the project away:\n  ${found.join("\n  ")}`);
  process.exit(1);
}
console.log("\nChecked: no references to plans, rules or tools found.");
