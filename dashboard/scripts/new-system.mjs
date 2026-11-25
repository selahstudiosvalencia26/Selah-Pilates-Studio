// Makes a new system in the right shape: its folder, a description file, a first SQL file and a README, and the two
// lines in src/systems/index.ts. Usage: npm run new-system <word>   (one lowercase word, for example "inventory").
// It never overwrites anything. Then fill in the description file and run: npm run check.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const id = (process.argv[2] ?? "").trim();

if (!/^[a-z]{2,20}$/.test(id)) {
  console.error('Give one lowercase word, 2 to 20 letters, for example: npm run new-system inventory');
  process.exit(1);
}

const dir = join(root, "src", "systems", id);
if (existsSync(dir)) {
  console.error(`The system "${id}" already exists.`);
  process.exit(1);
}

const title = id.charAt(0).toUpperCase() + id.slice(1);
mkdirSync(join(dir, "migrations"), { recursive: true });

writeFileSync(
  join(dir, "manifest.ts"),
  `import { defineSystem } from "@/shell/systems/manifest";

// ${title}. Describe it here; the dashboard inspects this file before switching the system on (the install check).
export default defineSystem({
  id: "${id}",
  name: "${title}",
  version: "0.1.0",
  requires_shell: ">=0.1.0 <1.0.0",
  icon: "box",
  needs: [],
  optional: [],
  pages: [{ path: "/${id}", title: "${title}", permission: "${id}.view", nav: true }],
  permissions: [
    { id: "${id}.view", label: "See ${id}", default: ["owner", "manager", "staff"] },
    { id: "${id}.edit", label: "Add and change ${id}", default: ["owner", "manager", "staff"] },
    { id: "${id}.manage", label: "Change ${id} settings", default: ["owner"] },
  ],
  tables: ["${id}_records"],
  migrations: ["001_create_tables.sql"],
  labels: {},
  today: [],
  emails: [],
  public: [],
  provides: [],
});
`,
);

writeFileSync(
  join(dir, "migrations", "001_create_tables.sql"),
  `-- ${title}: the first tables. Safe to run twice. Never edit this file once it has been applied; add 002_... instead.
-- Rules (docs/rules/rules.md): row-level security on, nothing open by default, a deleted_at column for the recycle bin.

create table if not exists public.${id}_records (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

alter table public.${id}_records enable row level security;
revoke all on public.${id}_records from anon, authenticated;
grant all on public.${id}_records to service_role;
`,
);

writeFileSync(
  join(dir, "README.md"),
  `# ${id}

What it is, in one line. Planned in docs/systems/${id}/ (copy docs/systems/_template/ there first).

The rules for every system are in docs/systems/README.md: less is more, matches the dashboard, accessible, responsive, safe by default.
A system uses only its own folder and the toolbox (src/kit). The tests in tests/architecture.test.ts enforce it.
`,
);

// Add the system to the registry, in the two marked places.
const indexPath = join(root, "src", "systems", "index.ts");
let index = readFileSync(indexPath, "utf8");
const a = "// systems:imports\n";
const b = "  // systems:candidates\n";
if (!index.includes(a) || !index.includes(b)) {
  console.error("Could not find the markers in src/systems/index.ts. Add the system there by hand.");
  process.exit(1);
}
index = index.replace(a, `${a}import ${id} from "./${id}/manifest";\n`).replace(b, `${b}  { folder: "${id}", manifest: ${id} },\n`);
writeFileSync(indexPath, index);

console.log(`Created src/systems/${id}. Next: fill in manifest.ts, then run npm run check.`);
