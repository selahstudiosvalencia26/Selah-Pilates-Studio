"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { databaseOn } from "@/kit/database";
import { isPermissionId } from "@/kit/permissions";
import { err, ok, type Result } from "@/kit/result";
import { canSave } from "@/kit/session";
import { setLogin, setPasswordFor } from "@/lib/auth/admin";
import { isAllowed } from "@/lib/auth/config";
import { firstProblem as passwordWords, passwordProblems, PASSWORD_INPUT_MAX } from "@/shell/account/password";
import { readMembers, readRoles, saveMembers, writeTeamDoc } from "./teamStore";

// Adding people, changing what they may do, and roles. All of it is for the owner only, checked here every time. While building
// without a database the list is kept but no real sign-in is made.
const OWNER_ONLY = "Only the owner can change this.";
const FAILED = "That did not work. Try again, and if it keeps happening, tell the builder.";

const email = z.string().trim().toLowerCase().pipe(z.email().max(120));
const name = z.string().trim().min(1, "Type their name.").max(60);
const roleIds = z.array(z.string().max(40)).max(10);
const password = z.string().max(PASSWORD_INPUT_MAX);

const problemWith = (pass: string, address: string) => passwordWords(passwordProblems({ password: pass, email: address }));

async function done(run: () => Promise<void>): Promise<Result> {
  try {
    await run();
    revalidatePath("/preview/people", "layout");
    return ok(undefined);
  } catch (e) {
    console.error("people: could not save", e instanceof Error ? e.message : "unknown");
    return err(FAILED);
  }
}

export async function addPerson(input: unknown): Promise<Result> {
  if (!(await canSave())) return err(OWNER_ONLY);
  const parsed = z.strictObject({ name, email, roles: roleIds, password }).safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Check the details and try again.");
  const p = parsed.data;
  if (isAllowed(p.email)) return err("That email is already an owner.");
  const weak = problemWith(p.password, p.email);
  if (weak) return err(weak);
  const members = await readMembers();
  if (members.some((m) => m.email === p.email)) return err("That person is already on the list.");
  return done(async () => {
    const id = databaseOn() ? await setLogin(p.email, p.password) : crypto.randomUUID();
    await saveMembers([...members, { id, email: p.email, name: p.name, roles: p.roles, permissions: [], mustChange: true }]);
  });
}

export async function newPasswordFor(input: unknown): Promise<Result> {
  if (!(await canSave())) return err(OWNER_ONLY);
  const parsed = z.strictObject({ email, password }).safeParse(input);
  if (!parsed.success) return err("Reload the page and try again.");
  const members = await readMembers();
  const member = members.find((m) => m.email === parsed.data.email);
  if (!member || isAllowed(member.email)) return err("Reload the page and try again.");
  const weak = problemWith(parsed.data.password, member.email);
  if (weak) return err(weak);
  return done(async () => {
    if (databaseOn()) await setPasswordFor(member.id, parsed.data.password);
    await saveMembers(members.map((m) => (m.email === member.email ? { ...m, mustChange: true } : m)));
  });
}

export async function setPersonRoles(input: unknown): Promise<Result> {
  if (!(await canSave())) return err(OWNER_ONLY);
  const parsed = z.strictObject({ email, roles: roleIds }).safeParse(input);
  if (!parsed.success) return err("Reload the page and try again.");
  const members = await readMembers();
  return done(() => saveMembers(members.map((m) => (m.email === parsed.data.email ? { ...m, roles: parsed.data.roles } : m))));
}

// Removing takes them off the list, which shuts them out at once. Their sign-in is kept, so Undo can put them straight back.
export async function removePerson(address: string): Promise<Result> {
  if (!(await canSave())) return err(OWNER_ONLY);
  const members = await readMembers();
  return done(() => saveMembers(members.filter((m) => m.email !== address)));
}

const member = z.strictObject({ id: z.string().max(60), email, name, roles: roleIds, permissions: z.array(z.string().max(40)).max(80), mustChange: z.boolean() });

export async function restorePerson(input: unknown): Promise<Result> {
  if (!(await canSave())) return err(OWNER_ONLY);
  const parsed = member.safeParse(input);
  if (!parsed.success || isAllowed(parsed.data.email)) return err("Reload the page and try again.");
  const members = await readMembers();
  if (members.some((m) => m.email === parsed.data.email)) return ok(undefined);
  return done(() => saveMembers([...members, parsed.data]));
}

const role = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  name: z.string().trim().min(1).max(30),
  builtin: z.boolean(),
  locked: z.boolean(),
  permissions: z.array(z.string().refine(isPermissionId)).max(80),
});

export async function saveRoles(input: unknown): Promise<Result> {
  if (!(await canSave())) return err(OWNER_ONLY);
  // The owner role is never saved: it is fixed.
  const list = z.array(z.looseObject({ id: z.string() })).max(21).safeParse(input);
  const parsed = z.array(role).max(20).safeParse(list.success ? list.data.filter((r) => r.id !== "owner") : null);
  if (!parsed.success) return err("Reload the page and try again.");
  return done(async () => {
    await writeTeamDoc("roles", parsed.data);
    await saveMembers(await readMembers(), await readRoles());
  });
}
