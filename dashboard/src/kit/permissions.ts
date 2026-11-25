// Who may do what. One rule for the whole dashboard (docs/architecture/system-design.md, section 6).
//
// A permission is "<system>.<action>", for example "booking.edit". The only actions are view, edit, approve, delete
// and manage. A person's permissions are the sum of what all their roles allow. The answer is always "no" unless a role
// says "yes". This runs on the server; hiding a button in the browser is never enough.

export const ACTIONS = ["view", "edit", "approve", "delete", "manage"] as const;
export type Action = (typeof ACTIONS)[number];

export const ROLE_NAMES = ["owner", "manager", "staff"] as const;
export type BuiltInRole = (typeof ROLE_NAMES)[number];

// Only the locked Owner role ever holds this. It means "every permission, including ones added later".
export const EVERYTHING = "*";

const PERMISSION = new RegExp(`^[a-z]{2,20}\\.(${ACTIONS.join("|")})$`);

export type PermissionId = `${string}.${Action}`;

export const isPermissionId = (value: unknown): value is PermissionId => typeof value === "string" && PERMISSION.test(value);

// What a person's roles allow together. Each role is a list of permission ids (or the Owner's "*").
export function permissionsOf(roles: readonly (readonly string[])[]): ReadonlySet<string> {
  const all = new Set<string>();
  for (const role of roles) for (const p of role) if (p === EVERYTHING || isPermissionId(p)) all.add(p);
  return all;
}

// May this person do this? False for anything that is not a real permission id, so a typo can never open a door.
export function can(granted: ReadonlySet<string>, needed: string): boolean {
  if (!isPermissionId(needed)) return false;
  return granted.has(EVERYTHING) || granted.has(needed);
}

// May this person hand out this role? Nobody can give a role more than they have themselves, so a manager cannot make a
// role stronger than a manager, and nobody but an owner can make an owner.
export function canGiveRole(giver: ReadonlySet<string>, role: readonly string[]): boolean {
  if (giver.has(EVERYTHING)) return true;
  if (role.includes(EVERYTHING)) return false;
  return role.every((p) => giver.has(p));
}

// The default permissions for a built-in role, from what a system declares for each (system-design.md, section 2).
export function defaultsFor(role: BuiltInRole, declared: readonly { id: string; default: readonly string[] }[]): string[] {
  if (role === "owner") return [EVERYTHING];
  return declared.filter((p) => p.default.includes(role)).map((p) => p.id);
}
