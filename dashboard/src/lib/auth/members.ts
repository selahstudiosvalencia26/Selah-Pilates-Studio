import { readDocument } from "@/lib/db";

// The team the owner added, kept as one document ("people"). A member's permissions are worked out from their roles when the owner
// saves, so checking them needs only this list. The owner is not in it: the owner is whoever is in DASHBOARD_OWNER_EMAILS.
export type Member = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  mustChange: boolean; // still on the temporary password
};

export async function readSavedMembers(): Promise<Member[]> {
  const saved = await readDocument("people");
  return Array.isArray(saved) ? (saved as Member[]) : [];
}
