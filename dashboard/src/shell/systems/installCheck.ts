import { isIconName } from "@/kit/iconNames";
import { ACTIONS, isPermissionId } from "@/kit/permissions";
import { manifestSchema, SHELL_SERVICES, type Manifest } from "./manifest";

// The install check (docs/architecture/system-design.md, section 9): before a system is switched on, its description file is
// inspected. A system that fails stays off and the reasons are in plain words. Pure code, so it runs the same in the
// automatic check before a change ships and on the Systems page.
//
// Not checked here (they need the files or the test run): that the SQL files exist and are safe to run twice, that
// there are no hand-written colors, and that the tests pass. Those are in the automatic check in GitHub.

export type CheckContext = {
  folder: string; // the system's folder name, which must be its id
  shellVersion: string; // the dashboard version, for requires_shell
  installed: readonly string[]; // ids of the systems present, for needs
  others: readonly Manifest[]; // systems already accepted, to catch names that clash
};

export type CheckResult = { manifest: Manifest | null; problems: string[] };

// "1.2.3" -> [1, 2, 3]
const parts = (v: string): number[] => v.split(".").map(Number);
const compare = (a: string, b: string): number => {
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
};

// A range like ">=1.0.0 <2.0.0": every piece must hold.
export function satisfies(version: string, range: string): boolean {
  const pieces = range.trim().split(/\s+/);
  return pieces.every((piece) => {
    const m = /^(>=|<=|>|<|=)?(\d+\.\d+\.\d+)$/.exec(piece);
    if (!m) return false;
    const c = compare(version, m[2]);
    switch (m[1] ?? "=") {
      case ">=":
        return c >= 0;
      case "<=":
        return c <= 0;
      case ">":
        return c > 0;
      case "<":
        return c < 0;
      default:
        return c === 0;
    }
  });
}

// A version rule in plain words, for people: ">=0.1.0 <1.0.0" becomes "0.1.0 or newer, but older than 1.0.0".
export function describeRange(range: string): string {
  const words = range
    .trim()
    .split(/\s+/)
    .map((piece) => {
      const m = /^(>=|<=|>|<|=)?(\d+\.\d+\.\d+)$/.exec(piece);
      if (!m) return piece;
      switch (m[1] ?? "=") {
        case ">=":
          return `${m[2]} or newer`;
        case "<=":
          return `${m[2]} or older`;
        case ">":
          return `newer than ${m[2]}`;
        case "<":
          return `older than ${m[2]}`;
        default:
          return `exactly ${m[2]}`;
      }
    });
  return words.join(", but ");
}

export function checkSystem(raw: unknown, ctx: CheckContext): CheckResult {
  const parsed = manifestSchema.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.length ? i.path.join(".") : "The description file"}: ${i.message}`);
    return { manifest: null, problems };
  }
  const m = parsed.data;
  const problems: string[] = [];
  const own = new Set(m.permissions.map((p) => p.id));

  if (ctx.folder !== m.id) problems.push(`The folder is called "${ctx.folder}" but the system says its id is "${m.id}". They must be the same word.`);

  if (!isIconName(m.icon)) problems.push(`The icon "${m.icon}" is not in the icon set. Pick one listed in src/kit/iconNames.ts, or add it there.`);

  // The menu needs a way in, and every other action builds on it: a system must declare its "see" permission.
  if (!own.has(`${m.id}.view`)) problems.push(`It must declare "${m.id}.view" (see ${m.id}). Every other action needs it, and so does the menu.`);

  // Names (docs/rules/naming.md): one word everywhere
  for (const p of m.permissions) {
    if (!isPermissionId(p.id)) problems.push(`Permission "${p.id}" must look like ${m.id}.view. The only actions are ${ACTIONS.join(", ")}.`);
    else if (!p.id.startsWith(`${m.id}.`)) problems.push(`Permission "${p.id}" must start with "${m.id}.".`);
  }
  for (const t of m.tables) if (!new RegExp(`^${m.id}_[a-z0-9_]+$`).test(t)) problems.push(`Table "${t}" must start with "${m.id}_".`);
  for (const pg of m.pages) if (pg.path !== `/${m.id}` && !pg.path.startsWith(`/${m.id}/`)) problems.push(`Page "${pg.path}" must be /${m.id} or inside it.`);

  for (const pg of m.pages) if (pg.nav && pg.path.includes("[")) problems.push(`Page "${pg.path}" cannot be a section, because its address changes (it has [ ] in it).`);

  // What it points at must exist inside it
  for (const pg of m.pages) if (!own.has(pg.permission)) problems.push(`Page "${pg.path}" asks for "${pg.permission}", which this system does not declare.`);
  for (const t of m.today) if (!own.has(t.permission)) problems.push(`The Today card "${t.id}" asks for "${t.permission}", which this system does not declare.`);
  if (m.search) {
    if (!own.has(m.search.permission)) problems.push(`Search asks for "${m.search.permission}", which this system does not declare.`);
    if (!m.tables.includes(m.search.table)) problems.push(`Search looks in "${m.search.table}", which is not one of this system's tables.`);
  }

  // SQL files: numbered 001, 002, ... with no gaps
  m.migrations.forEach((file, i) => {
    if (!/^\d{3}_[a-z0-9_]+\.sql$/.test(file)) problems.push(`SQL file "${file}" must be numbered like 001_create_tables.sql.`);
    else if (Number(file.slice(0, 3)) !== i + 1) problems.push(`SQL file "${file}" is out of order. They must be 001, 002, 003 with no gaps.`);
  });
  if (m.tables.length > 0 && m.migrations.length === 0) problems.push("It declares tables but has no SQL file to create them.");

  // Versions and what it needs
  if (!satisfies(ctx.shellVersion, m.requires_shell)) problems.push(`It needs a dashboard that is ${describeRange(m.requires_shell)}, but this dashboard is ${ctx.shellVersion}.`);
  for (const need of m.needs) {
    const known = (SHELL_SERVICES as readonly string[]).includes(need) || ctx.installed.includes(need);
    if (!known) problems.push(`It needs "${need}", which is not installed.`);
    if (need === m.id) problems.push("It cannot need itself.");
  }

  // Clashes with systems already accepted
  for (const o of ctx.others) {
    if (o.id === m.id) problems.push(`Another system already uses the id "${m.id}".`);
    for (const t of m.tables) if (o.tables.includes(t)) problems.push(`Table "${t}" is already used by "${o.id}".`);
    for (const p of m.permissions) if (o.permissions.some((q) => q.id === p.id)) problems.push(`Permission "${p.id}" is already used by "${o.id}".`);
    for (const pg of m.pages) if (o.pages.some((q) => q.path === pg.path)) problems.push(`Page "${pg.path}" is already used by "${o.id}".`);
  }
  const seen = new Set<string>();
  for (const e of m.emails) {
    if (seen.has(e.id)) problems.push(`Email "${e.id}" is listed twice.`);
    seen.add(e.id);
  }

  return { manifest: problems.length === 0 ? m : null, problems };
}
