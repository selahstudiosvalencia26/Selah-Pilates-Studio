import { accountAuth } from "@/shell/account/accountAuth";

// The Systems page (installed systems and their database files) is for the owner only, no other role. It asks who is
// signed in, on the server. On a live site nobody is signed in until real sign-in is connected, so it stays closed there.
export const isOwner = async (): Promise<boolean> => (await accountAuth().currentPerson())?.role === "Owner";
