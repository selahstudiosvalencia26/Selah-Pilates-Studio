import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { databaseOn, readDocument, writeDocument } from "@/kit/database";
import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import type { Member } from "@/lib/auth/members";
import { loadSystems } from "@/shell/registry";
import { defaultRoles, type Role } from "./roles";

// The team and the roles, on the server. With the database set up they are kept there; while building without one, in small files
// that git never sees. A member's permissions are the sum of their roles, worked out here whenever people or roles are saved.
const file = (name: string) => join(resolve(process.env.PEOPLE_DATA_DIR ?? join(process.cwd(), ".data", "people-data")), `${name}.json`);

async function readTeamDoc(name: "people" | "roles"): Promise<unknown> {
  if (databaseOn()) return readDocument(name);
  try {
    return JSON.parse(await readFile(file(name), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw e;
  }
}

export async function writeTeamDoc(name: "people" | "roles", value: unknown): Promise<void> {
  if (databaseOn()) return writeDocument(name, value);
  const target = file(name);
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(`${target}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(`${target}.tmp`, target);
}

export async function readMembers(): Promise<Member[]> {
  const saved = await readTeamDoc("people");
  return Array.isArray(saved) ? (saved as Member[]) : [];
}

export async function readRoles(): Promise<Role[]> {
  const start = defaultRoles(loadSystems().systems);
  const saved = await readTeamDoc("roles");
  if (!Array.isArray(saved)) return start;
  const owner = start.find((r) => r.id === "owner")!;
  return [owner, ...(saved as Role[]).filter((r) => r.id !== "owner")];
}

export const permissionsFor = (roleIds: readonly string[], roles: readonly Role[]): string[] =>
  [...permissionsOf(roles.filter((r) => r.id !== "owner" && roleIds.includes(r.id)).map((r) => r.permissions))].filter((p) => p !== EVERYTHING);

export async function saveMembers(members: Member[], roles?: Role[]): Promise<void> {
  const known = roles ?? (await readRoles());
  await writeTeamDoc("people", members.map((m) => ({ ...m, permissions: permissionsFor(m.roles, known) })));
}
