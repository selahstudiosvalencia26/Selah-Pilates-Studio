import { can } from "@/kit/permissions";
import type { Manifest } from "./systems/manifest";

// The menu is built from the systems that are on and what the person's roles allow (docs/dashboard/shell-plan.md, section 3).
// A system with no permission for the person does not appear at all. The first page of a system is its menu entry.
// A system with more than one section (a page marked `nav`) also gets a tab strip along the top of its screen, on every
// device. The side menu stays one flat list. Only the sections the person may see are listed.

export type MenuGroup = "general" | "systems" | "manage";
export type MenuChild = { title: string; href: string };
export type MenuItem = { id: string; title: string; href: string; icon: string; group: MenuGroup; children?: MenuChild[] };

// Always there for everyone who is signed in.
export const TODAY: MenuItem = { id: "today", title: "Today", href: "/preview", icon: "today", group: "general" };

// The sections of one system that this person may open. Empty or one means the system needs no tab strip.
export function sectionsOf(system: Manifest, granted: ReadonlySet<string>): MenuChild[] {
  return system.pages.filter((p) => p.nav && can(granted, p.permission)).map((p) => ({ title: p.title, href: p.path }));
}

export function buildMenu(systems: readonly Manifest[], granted: ReadonlySet<string>): MenuItem[] {
  const items: MenuItem[] = [];
  for (const s of systems) {
    const entry = s.pages[0];
    if (!entry || !can(granted, entry.permission)) continue;
    const sections = sectionsOf(s, granted);
    items.push({ id: s.id, title: s.name, href: entry.path, icon: s.icon, group: "systems", ...(sections.length > 1 ? { children: sections } : {}) });
  }
  return items;
}

// Which section the person is on: the one whose address is the longest match for where they are, so /booking/settings
// lights up Settings and /booking/123 lights up the first section, not two at once.
export function activeSection(children: readonly MenuChild[], path: string): string | null {
  const match = children.filter((c) => path === c.href || path.startsWith(`${c.href}/`)).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? null;
}

// The owner's chosen order for the systems in the menu. Systems named in the order come first, in that order; any new
// system not named yet follows in its usual place. Today and the owner's own pages never move.
export function applyOrder(items: MenuItem[], order: readonly string[]): MenuItem[] {
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const sorted = items.filter((i) => i.group === "systems").sort((a, b) => rank(a.id) - rank(b.id));
  let next = 0;
  return items.map((i) => (i.group === "systems" ? sorted[next++] : i));
}

// Move one id up (-1) or down (1). Returns the same array when it cannot move.
export function moveId(order: readonly string[], id: string, by: -1 | 1): string[] {
  const from = order.indexOf(id);
  const to = from + by;
  if (from === -1 || to < 0 || to >= order.length) return order as string[];
  const next = [...order];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
