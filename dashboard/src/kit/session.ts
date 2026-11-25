import { databaseOn } from "@/lib/db";
import { currentUser } from "@/lib/auth/server";

/** Is an allowed owner signed in? Asked on the server before anything is changed. */
export const signedInOwner = async (): Promise<boolean> => (await currentUser()) !== null;

/** May something be changed right now? Always while building. On a live site only with the database set up and an owner signed in. */
export const canSave = async (): Promise<boolean> => process.env.NODE_ENV !== "production" || (databaseOn() && (await signedInOwner()));
