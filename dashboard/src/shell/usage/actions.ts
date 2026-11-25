"use server";

import { revalidatePath } from "next/cache";
import { err, ok, type Result } from "@/kit/result";
import { isOwner } from "@/shell/systems/owner";
import { domainSchema, writeDomain } from "./store";

// Only the owner may change it, and nothing is saved on a live site until sign-in is connected.
export async function saveDomain(input: unknown): Promise<Result> {
  if (process.env.NODE_ENV === "production") return err("Saving is not connected yet.");
  if (!(await isOwner())) return err("Only the owner can change this.");
  const parsed = domainSchema.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Check the details and try again.");
  await writeDomain(parsed.data);
  revalidatePath("/", "layout");
  return ok(undefined);
}
