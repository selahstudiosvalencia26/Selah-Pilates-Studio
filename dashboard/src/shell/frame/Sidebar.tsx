"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/kit/Icon";
import type { MenuItem } from "@/shell/menu";
import BrandMark from "./BrandMark";
import Avatar from "./Avatar";
import { PendingReporter } from "./NavPending";
import SignOutRow from "./SignOutRow";
import { ThemeRow } from "./ThemeToggle";

// The side menu on a computer. On a phone the same items live in a side sheet (MobileMenu).
// Less is more: the business, one list of places, and below it the few things about the dashboard itself. It folds into
// a rail of icons. Every icon sits in the same spot open or folded, so nothing jumps when it changes.
const KEY = "shell-menu-collapsed";

// One row shape for every link and button in the menu. The icon's left edge is fixed (14px), which is what keeps it
// still while the menu opens and folds. Only the words fade.
const row =
  "flex h-11 w-full items-center gap-3 overflow-hidden rounded-lg pl-3.5 pr-3 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";
const idle = "text-sidebar-text hover:bg-hover hover:text-text";
const current = "bg-selected font-medium text-text";

export default function Sidebar({
  business,
  logoUrl = null,
  person,
  items,
}: {
  business: string;
  logoUrl?: string | null;
  person: { name: string; role: string; avatarUrl?: string | null };
  items: MenuItem[];
}) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Remember the choice on this device. Nothing breaks if the browser will not let us.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === "1");
    } catch {
      /* private window or blocked storage: stay open */
    }
  }, []);
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });

  const active = (href: string) =>
    href === "/preview"
      ? path === href
      : path === href || path.startsWith(`${href}/`);
  const places = items.filter((i) => i.group !== "manage");
  const manage = items.filter((i) => i.group === "manage");
  const words = (hidden: boolean) =>
    `truncate whitespace-nowrap transition-opacity duration-150 ${hidden ? "opacity-0" : "opacity-100"}`;

  // A system's own pages are tabs along the top of its screen (SystemTabs), so the menu stays one flat list.
  const link = (item: MenuItem) => {
    const on =
      active(item.href) ||
      (item.children?.some((c) => active(c.href)) ?? false);
    return (
      <li key={item.id}>
        <Link
          href={item.href}
          title={collapsed ? item.title : undefined}
          aria-label={item.title}
          aria-current={on ? "page" : undefined}
          className={`${row} ${on ? current : idle}`}
        >
          <Icon
            name={item.icon}
            weight={on ? "semibold" : "medium"}
            className={`h-5 w-5 shrink-0 ${on ? "text-accent-ink" : ""}`}
          />
          <span aria-hidden className={`flex-1 ${words(collapsed)}`}>
            {item.title}
          </span>
          <PendingReporter />
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={`hidden h-full shrink-0 flex-col bg-sidebar transition-[width] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none lg:flex ${collapsed ? "w-[4.5rem]" : "w-60"}`}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 px-[18px]">
        <BrandMark name={business} logoUrl={logoUrl} />
        <p
          aria-hidden={collapsed}
          className={`min-w-0 text-[15px] font-semibold tracking-[-0.01em] ${words(collapsed)}`}
        >
          {business}
        </p>
      </div>

      <nav
        aria-label="Main"
        className="scroll-quiet min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2"
      >
        <ul className="grid grid-cols-1 gap-0.5">{places.map(link)}</ul>
        {manage.length > 0 && (
          <>
            <div
              aria-hidden
              className="mx-3.5 my-3 border-t border-sidebar-border"
            />
            <ul className="grid grid-cols-1 gap-0.5">{manage.map(link)}</ul>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-0.5 overflow-hidden border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand the menu" : "Collapse the menu"}
          title={collapsed ? "Expand the menu" : undefined}
          className={`${row} ${idle}`}
        >
          <Icon
            name={collapsed ? "panel-open" : "panel"}
            weight="medium"
            className="h-5 w-5 shrink-0"
          />
          <span aria-hidden={collapsed} className={words(collapsed)}>
            Collapse menu
          </span>
        </button>
        <ThemeRow collapsed={collapsed} className={`${row} ${idle}`} />
        <SignOutRow collapsed={collapsed} className={`${row} ${idle}`} />
        {/* The person is also the way to their account (password). One less row in the menu. */}
        <Link
          href="/preview/account"
          aria-label={`Your account, ${person.name}, ${person.role}`}
          aria-current={active("/preview/account") ? "page" : undefined}
          title={
            collapsed
              ? `Your account: ${person.name}, ${person.role}`
              : undefined
          }
          className={`flex h-12 items-center gap-3 overflow-hidden rounded-lg pl-2 pr-3 transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${active("/preview/account") ? "bg-selected" : "hover:bg-hover"}`}
        >
          <Avatar name={person.name} src={person.avatarUrl} />
          <div
            aria-hidden={collapsed}
            className={`min-w-0 transition-opacity duration-150 ${collapsed ? "opacity-0" : "opacity-100"}`}
          >
            <p className="truncate text-sm font-medium leading-tight text-text">
              {person.name}
            </p>
            <p className="truncate text-xs text-sidebar-muted">{person.role}</p>
          </div>
          <PendingReporter />
        </Link>
      </div>
    </aside>
  );
}
