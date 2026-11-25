import { currentUser } from "@/lib/auth/server";

/** Is an allowed owner signed in? Asked on the server before anything is changed. */
export const signedInOwner = async (): Promise<boolean> => (await currentUser()) !== null;
