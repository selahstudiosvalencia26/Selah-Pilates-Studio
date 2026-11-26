import { notFound, redirect } from "next/navigation";
import { authOn } from "@/lib/auth/config";
import { currentUser } from "@/lib/auth/server";
import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import { myPermissions } from "@/kit/session";
import { applyOrder, buildMenu, TODAY, type MenuItem } from "@/shell/menu";
import { getMenuOrder } from "@/shell/menuOrderStore";
import { getBranding } from "@/shell/branding/server";
import { loadSystems } from "@/shell/registry";
import { currentAvatar } from "@/shell/account/status";
import { isOwner } from "@/shell/systems/owner";
import Shell from "@/shell/frame/Shell";

// The frame for every signed-in page. With Supabase set up, only an email on the allowed list gets in. Without it, these pages
// exist only while developing and are not found on a live site. Nothing here is reachable by a stranger.
const SYSTEMS_PAGE: MenuItem = { id: "systems", title: "Systems", href: "/preview/systems", icon: "puzzle", group: "manage" };

const PEOPLE_PAGE: MenuItem = {
  id: "people",
  title: "People",
  href: "/preview/people",
  icon: "users",
  group: "manage",
  children: [
    { title: "People", href: "/preview/people" },
    { title: "Roles", href: "/preview/people/roles" },
  ],
};

const SETTINGS_PAGE: MenuItem = {
  id: "settings",
  title: "Settings",
  href: "/preview/settings",
  icon: "settings",
  group: "manage",
  children: [
    { title: "Branding", href: "/preview/settings" },
    { title: "Menu", href: "/preview/settings/menu" },
    { title: "Email", href: "/preview/settings/email" },
  ],
};

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  // With sign-in set up, only an allowed person gets past here (the middleware checks first; this checks again).
  const signedIn = authOn() ? await currentUser() : null;
  if (authOn() && !signedIn) redirect("/sign-in");
  if (!authOn() && process.env.NODE_ENV === "production") notFound();

  const [brand, avatarUrl] = await Promise.all([getBranding(), currentAvatar()]);

  const { systems } = loadSystems();
  const mine = permissionsOf([await myPermissions()]);
  const owner = mine.has(EVERYTHING);
  const order = await getMenuOrder();
  const systemsPage = await isOwner(); // the Systems page is in the menu for the owner only
  const items = [TODAY, ...applyOrder(buildMenu(systems, mine), order), ...(owner ? [PEOPLE_PAGE, SETTINGS_PAGE] : []), ...(systemsPage ? [SYSTEMS_PAGE] : [])];

  return (
    <Shell business={brand.name} logoUrl={brand.logoUrl} person={{ name: signedIn?.name ?? "Sample Owner", role: owner ? "Owner" : "Team member", avatarUrl }} items={items}>
      {children}
    </Shell>
  );
}
