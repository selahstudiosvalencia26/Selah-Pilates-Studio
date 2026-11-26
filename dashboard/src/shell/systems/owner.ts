import { isOwnerNow } from "@/kit/session";
import { accountAuth } from "@/shell/account/accountAuth";

// The Systems page (installed systems and their database files) is for the owner only, no other role. It asks who is
// signed in, on the server. On a live site that is anyone on the allowed list, who are all owners.
export const isOwner = async (): Promise<boolean> =>
  process.env.NODE_ENV === "production" ? isOwnerNow() : (await accountAuth().currentPerson())?.role === "Owner";
