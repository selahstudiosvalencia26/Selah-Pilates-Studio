import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import { applyOrder, buildMenu } from "@/shell/menu";
import { getMenuOrder } from "@/shell/menuOrderStore";
import MenuOrder from "@/shell/people/MenuOrder";
import { loadSystems } from "@/shell/registry";
import { installHref } from "@/shell/systems/installLink";

// The order of the menu, for the owner.
export default async function MenuPage() {
  const { systems } = loadSystems();
  const items = applyOrder(buildMenu(systems, permissionsOf([[EVERYTHING]])), await getMenuOrder());
  return (
    <div className="grid gap-5">
      <p className="max-w-xl text-sm text-text-soft">Put the menu in the order you like. It changes for everyone.</p>
      <MenuOrder items={items.map((i) => ({ id: i.id, title: i.title, icon: i.icon }))} top={[{ title: "Today", icon: "today" }]} bottom={[{ title: "People", icon: "users" }, { title: "Settings", icon: "settings" }]} installHref={installHref()} />
    </div>
  );
}
