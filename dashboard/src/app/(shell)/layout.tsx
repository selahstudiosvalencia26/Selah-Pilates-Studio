import { notFound } from "next/navigation";
import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import { applyOrder, buildMenu, TODAY, type MenuItem } from "@/shell/menu";
import { getMenuOrder } from "@/shell/menuOrderStore";
import { getBranding } from "@/shell/branding/server";
import { loadSystems } from "@/shell/registry";
import { currentAvatar } from "@/shell/account/status";
import { isOwner } from "@/shell/systems/owner";
import Shell from "@/shell/frame/Shell";

// The frame for every signed-in page. Sign-in is not built yet, so for now these pages exist only while developing,
// and in production they are not found at all. When sign-in arrives, the person and their permissions come from the
// server session instead of this sample owner. Nothing here is reachable by a stranger.
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
  if (process.env.NODE_ENV === "production") notFound();
  const [brand, avatarUrl] = await Promise.all([getBranding(), currentAvatar()]);

  const { systems } = loadSystems();
  const owner = permissionsOf([[EVERYTHING]]);
  const order = await getMenuOrder();
  const systemsPage = await isOwner(); // the Systems page is in the menu for the owner only
  const items = [TODAY, ...applyOrder(buildMenu(systems, owner), order), PEOPLE_PAGE, SETTINGS_PAGE, ...(systemsPage ? [SYSTEMS_PAGE] : [])];

  return (
    <Shell business={brand.name} logoUrl={brand.logoUrl} person={{ name: "Sample Owner", role: "Owner", avatarUrl }} items={items}>
      {children}
    </Shell>
  );
}
