import { currentUser } from "@/lib/auth/server";
import { databaseOn } from "@/lib/db";

// Asked on the server before anything is shown or changed. While building (no live site) everything is allowed.
const building = () => process.env.NODE_ENV !== "production";

/** What the signed-in person may do: ["*"] is everything (the owner). */
export async function myPermissions(): Promise<string[]> {
  if (building()) return ["*"];
  return (await currentUser())?.permissions ?? [];
}

export const isOwnerNow = async (): Promise<boolean> => (await myPermissions()).includes("*");

/** Is anyone on the team signed in? */
export const signedIn = async (): Promise<boolean> => building() || (await currentUser()) !== null;

/** May something be changed right now? Give the permissions that allow it (any one is enough). With none given, only the owner. */
export async function canSave(...allowing: string[]): Promise<boolean> {
  if (building()) return true;
  if (!databaseOn()) return false;
  const who = await currentUser();
  if (!who || who.mustChange) return false;
  return who.owner || allowing.some((p) => who.permissions.includes(p));
}
