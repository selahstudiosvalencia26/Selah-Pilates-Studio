import { installHref } from "@/shell/systems/installLink";
import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import { buildMenu } from "@/shell/menu";
import { loadSystems } from "@/shell/registry";
import { getBranding } from "@/shell/branding/server";
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
  const live = process.env.NODE_ENV === "production";
  return <Today name={live ? (await getBranding()).name : "Sample Owner"} canInvite={!live} systems={buildMenu(systems, permissionsOf([[EVERYTHING]]))} installHref={installHref()} warning={warning} />;
}
