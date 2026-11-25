import { defaultsFor, EVERYTHING, canGiveRole, isPermissionId, permissionsOf, ROLE_NAMES, type BuiltInRole } from "@/kit/permissions";
import type { Manifest } from "@/shell/systems/manifest";

// Roles and what people can do (docs/dashboard/shell-plan.md, section 2; docs/architecture/system-design.md, section 6). A role is a named set of
// permissions. A person can have several roles and their permissions add up. The Owner role is locked: it holds everything,
// always. These are the rules behind the People and Roles screens, kept as plain functions so they are tested and the
// database can reuse them.
//
// The relationship is three plain links: a person has roles, a role has permissions, and a permission belongs to one system
// (its name starts with the system's word). Nothing else is stored.

export type Role = { id: string; name: string; builtin: boolean; locked: boolean; permissions: string[] }; // ["*"] is everything
export type Person = { id: string; name: string; email: string; roles: string[]; status: "active" | "invited" };
export type PermissionRow = { id: string; label: string; sensitive: boolean };
export type SystemRows = { system: string; name: string; rows: PermissionRow[] };

// Delete, approve and manage are the ones that ask for confirmation (docs/dashboard/shell-plan.md, "Safe limits").
export const isSensitive = (id: string): boolean => /\.(delete|approve|manage)$/.test(id);

// Every permission the systems declare, grouped by system, in plain words, for the detailed grid.
export function permissionRows(systems: readonly Manifest[]): SystemRows[] {
  return systems.map((s) => ({ system: s.id, name: s.name, rows: s.permissions.map((p) => ({ id: p.id, label: p.label, sensitive: isSensitive(p.id) })) }));
}

const NAMES: Record<BuiltInRole, string> = { owner: "Owner", manager: "Manager", staff: "Staff" };

// The three roles every client starts with, filled from what each system says its defaults are.
export function defaultRoles(systems: readonly Manifest[]): Role[] {
  const declared = systems.flatMap((s) => s.permissions);
  return ROLE_NAMES.map((r) => ({ id: r, name: NAMES[r], builtin: true, locked: r === "owner", permissions: defaultsFor(r, declared) }));
}

const systemOf = (permission: string): string => permission.split(".")[0];

// ---- tick or untick one permission

// Every action needs "see" (view): you cannot change what you cannot see. So ticking any action also ticks "see", and
// unticking "see" clears the rest of that system. The Owner role never changes, and nobody can give a role more than they
// have themselves (a manager cannot make a role stronger than a manager).
export function setPermission(role: Role, id: string, on: boolean, editor: ReadonlySet<string> = permissionsOf([[EVERYTHING]])): Role {
  if (role.locked || !isPermissionId(id)) return role;
  const system = systemOf(id);
  const view = `${system}.view`;
  const has = (list: string[], p: string) => list.includes(p);

  if (on) {
    const wanted = id === view ? [id] : [id, view];
    if (!canGiveRole(editor, wanted)) return role;
    const next = [...role.permissions, ...wanted.filter((p) => !has(role.permissions, p))];
    return next.length === role.permissions.length ? role : { ...role, permissions: next };
  }
  if (!has(role.permissions, id)) return role;
  const next = id === view ? role.permissions.filter((p) => systemOf(p) !== system) : role.permissions.filter((p) => p !== id);
  return { ...role, permissions: next };
}

// ---- one choice per system: the access levels

// The ladder every system gets from its own permissions, so a system declares nothing extra: None, See, Change, Approve,
// Everything. A level appears only if the system has the action it needs. Each level includes the ones below it.
export type Level = { id: "none" | "see" | "change" | "approve" | "full"; name: string; permissions: string[] };

export function levelsFor(system: Manifest): Level[] {
  const id = (a: string) => `${system.id}.${a}`;
  const has = (a: string) => system.permissions.some((p) => p.id === id(a));
  const levels: Level[] = [{ id: "none", name: "None", permissions: [] }];
  const see = has("view") ? [id("view")] : [];
  if (see.length) levels.push({ id: "see", name: "See", permissions: see });
  const change = has("edit") ? [...see, id("edit")] : [];
  if (change.length) levels.push({ id: "change", name: "Change", permissions: change });
  const approve = has("approve") && change.length ? [...change, id("approve")] : [];
  if (approve.length) levels.push({ id: "approve", name: "Approve", permissions: approve });
  levels.push({ id: "full", name: "Everything", permissions: system.permissions.map((p) => p.id) });
  return levels;
}

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

// Where a role stands in one system: a level, or "custom" when someone ticked a mix that is not on the ladder.
export function levelOf(role: Role, system: Manifest): Level["id"] | "custom" {
  if (role.permissions.includes(EVERYTHING)) return "full";
  const mine = role.permissions.filter((p) => systemOf(p) === system.id);
  return levelsFor(system).find((l) => sameSet(l.permissions, mine))?.id ?? "custom";
}

export function setLevel(role: Role, system: Manifest, level: Level["id"], editor: ReadonlySet<string> = permissionsOf([[EVERYTHING]])): Role {
  const chosen = levelsFor(system).find((l) => l.id === level);
  if (role.locked || !chosen || !canGiveRole(editor, chosen.permissions)) return role;
  return { ...role, permissions: [...role.permissions.filter((p) => systemOf(p) !== system.id), ...chosen.permissions] };
}

// What a level lets someone do, in the system's own words: "See bookings, Add and change bookings".
export function describeLevel(level: Level, system: Manifest): string {
  if (level.permissions.length === 0) return "Cannot open this at all.";
  return level.permissions.map((id) => system.permissions.find((p) => p.id === id)?.label ?? id).join(", ");
}

// ---- what one person can do, as sentences, per system: "Bookings: see, change". Adds up across all their roles.
const ACTION_WORDS: Record<string, string> = { view: "see", edit: "change", approve: "approve", delete: "delete", manage: "settings" };
const ORDER = ["view", "edit", "approve", "delete", "manage"];

export function accessSummary(person: Person, roles: readonly Role[], systems: readonly Manifest[]): { name: string; actions: string[] }[] {
  const held = permissionsOf(roles.filter((r) => person.roles.includes(r.id)).map((r) => r.permissions));
  const all = held.has(EVERYTHING);
  const out: { name: string; actions: string[] }[] = [];
  for (const s of systems) {
    const actions = ORDER.filter((a) => s.permissions.some((p) => p.id === `${s.id}.${a}` && (all || held.has(p.id)))).map((a) => ACTION_WORDS[a]);
    if (actions.length) out.push({ name: s.name, actions });
  }
  return out;
}

// One plain sentence about a role, for the screens that let someone choose it.
export function roleBlurb(role: Role): string {
  if (role.id === "owner") return "Can do everything.";
  if (role.id === "manager") return "Runs the day to day. Can approve things and give discounts.";
  if (role.id === "staff") return "Does the daily work. Adds and changes things, but cannot approve or delete.";
  return "A role you made.";
}

// A role is "covered" when another chosen role already allows everything it does (Manager covers Staff). Picking both
// would change nothing, so the screens show the smaller one as already included. Roles that allow nothing are never
// covered, so a role you have only just made can still be chosen.
const RANK: Record<string, number> = { staff: 1, manager: 2, owner: 3 };

export function coveredBy(role: Role, chosen: readonly Role[]): Role | null {
  return (
    chosen.find((c) => {
      if (c.id === role.id) return false;
      // The starting roles are in order of strength, whatever is installed: with no system added their lists of permissions
      // are both empty, and Manager must still cover Staff.
      if (role.id in RANK && c.id in RANK) return RANK[c.id] > RANK[role.id];
      if (role.permissions.length === 0) return false;
      if (c.permissions.includes(EVERYTHING)) return true;
      const has = role.permissions.every((p) => c.permissions.includes(p));
      return has && (c.permissions.length > role.permissions.length || c.id < role.id);
    }) ?? null
  );
}

// The chosen role ids without the ones another chosen role already covers.
export function dropCovered(ids: readonly string[], roles: readonly Role[]): string[] {
  const chosen = roles.filter((r) => ids.includes(r.id));
  return ids.filter((id) => {
    const r = chosen.find((c) => c.id === id);
    return !r || !coveredBy(r, chosen);
  });
}
