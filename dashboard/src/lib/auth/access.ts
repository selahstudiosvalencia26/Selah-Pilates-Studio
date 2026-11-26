import { databaseOn } from "@/lib/db";
import { isAllowed } from "./config";
import { readSavedMembers } from "./members";

export type Access = { email: string; name: string; owner: boolean; permissions: string[]; mustChange: boolean };

/** What this signed-in email may do, or null when it may do nothing. Anything unclear (the list cannot be read) is a no. */
export async function accessFor(email: string | null | undefined): Promise<Access | null> {
  const address = (email ?? "").trim().toLowerCase();
  if (!address) return null;
  if (isAllowed(address)) return { email: address, name: address, owner: true, permissions: ["*"], mustChange: false };
  if (!databaseOn()) return null;
  try {
    const member = (await readSavedMembers()).find((m) => m.email === address);
    return member ? { email: address, name: member.name, owner: false, permissions: member.permissions, mustChange: member.mustChange } : null;
  } catch (e) {
    console.error("team list could not be read", e instanceof Error ? e.message : "unknown");
    return null;
  }
}
