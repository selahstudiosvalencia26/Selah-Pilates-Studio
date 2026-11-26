import { installHref } from "@/shell/systems/installLink";
import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import { buildMenu } from "@/shell/menu";
import { loadSystems } from "@/shell/registry";
import { getBranding } from "@/shell/branding/server";
import { myPermissions } from "@/kit/session";
import { currentUser } from "@/lib/auth/server";
import Today from "@/shell/today/Today";
import { todayInZone } from "@/kit/time";
import { isOwner } from "@/shell/systems/owner";
import { domainState } from "@/shell/usage/domain";
import { readDomain } from "@/shell/usage/store";

export const dynamic = "force-dynamic";

export default async function PreviewToday() {
  const { systems } = loadSystems();
  // The owner is reminded on Today only when the domain is close to running out.
  const state = (await isOwner()) ? domainState((await readDomain()).renewsOn, todayInZone("Asia/Manila")) : null;
  const warning = state && state.level !== "fine" ? { words: state.words, href: "/preview/systems" } : undefined;
  const person = process.env.NODE_ENV === "production" ? await currentUser() : null;
  const mine = permissionsOf([await myPermissions()]);
  const owner = mine.has(EVERYTHING);
  const name = !person ? "Sample Owner" : person.owner ? (await getBranding()).name : person.name;
  return <Today name={name} setup={owner} systems={buildMenu(systems, mine)} installHref={installHref()} warning={warning} />;
}
