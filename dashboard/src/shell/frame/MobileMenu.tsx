"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import Icon from "@/kit/Icon";
import type { MenuItem } from "@/shell/menu";
import Avatar from "./Avatar";
import { PendingReporter } from "./NavPending";
import SignOutRow from "./SignOutRow";
import { ThemeRow } from "./ThemeToggle";

// The phone menu: one button in the top line that opens a side sheet with every place, however many there are.
// Ten systems fit as easily as three, because the list scrolls inside the sheet. A real dialog: focus stays inside,
// Esc closes it, and focus goes back to the button.
const row =
  "flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

export default function MobileMenu({
  items,
  person,
}: {
  items: MenuItem[];
  person: { name: string; role: string; avatarUrl?: string | null };
}) {
  const path = usePathname();
  const sheet = useRef<HTMLDialogElement>(null);
  const active = (href: string) =>
    href === "/preview"
      ? path === href
      : path === href || path.startsWith(`${href}/`);
  const places = items.filter((i) => i.group !== "manage");
  const manage = items.filter((i) => i.group === "manage");

  const link = (item: MenuItem) => {
    const on =
      active(item.href) ||
      (item.children?.some((c) => active(c.href)) ?? false);
    return (
      <li key={item.id}>
        <Link
          href={item.href}
          onClick={() => sheet.current?.close()}
          aria-current={on ? "page" : undefined}
          className={`${row} ${on ? "bg-selected font-medium text-text" : "text-sidebar-text hover:bg-hover hover:text-text"}`}
        >
          <Icon
            name={item.icon}
            weight={on ? "semibold" : "medium"}
            className={`h-5 w-5 shrink-0 ${on ? "text-accent-ink" : ""}`}
          />
          {item.title}
          <PendingReporter />
        </Link>
      </li>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => sheet.current?.showModal()}
        aria-label="Open the menu"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-text-soft transition-[color,background-color,transform] duration-150 hover:bg-hover hover:text-text focus-visible:outline-2 focus-visible:outline-accent active:scale-95"
      >
        <Icon name="list" />
      </button>

      <dialog
        ref={sheet}
        aria-label="Menu"
        className="sheet m-0 ml-auto h-dvh max-h-none w-[min(20rem,86vw)] overflow-hidden border-l border-sidebar-border bg-sidebar p-0 text-text backdrop:bg-black/40 lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between pl-5 pr-2">
            <p className="text-base font-semibold">Menu</p>
            <button
              type="button"
              onClick={() => sheet.current?.close()}
              aria-label="Close the menu"
              className="grid h-11 w-11 place-items-center rounded-lg text-text-soft hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Icon name="close" />
            </button>
          </div>
          <nav
            aria-label="Main"
            className="scroll-quiet min-h-0 flex-1 overflow-y-auto overscroll-contain px-3"
          >
            <ul className="grid gap-0.5">{places.map(link)}</ul>
            {manage.length > 0 && (
              <>
                <div
                  aria-hidden
                  className="mx-3 my-3 border-t border-sidebar-border"
                />
                <ul className="grid gap-0.5">{manage.map(link)}</ul>
              </>
            )}
          </nav>
          <div className="grid shrink-0 gap-0.5 border-t border-sidebar-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <ThemeRow
              collapsed={false}
              className={`${row} text-sidebar-text hover:bg-hover hover:text-text`}
            />
            <SignOutRow
              className={`${row} text-sidebar-text hover:bg-hover hover:text-text`}
            />
            <Link
              href="/preview/account"
              onClick={() => sheet.current?.close()}
              aria-label={`Your account, ${person.name}, ${person.role}`}
              aria-current={active("/preview/account") ? "page" : undefined}
              className={`flex h-12 items-center gap-3 rounded-lg px-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${active("/preview/account") ? "bg-selected" : "hover:bg-hover"}`}
            >
              <Avatar name={person.name} src={person.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight">
                  {person.name}
                </p>
                <p className="truncate text-xs text-sidebar-muted">
                  {person.role}
                </p>
              </div>
              <PendingReporter />
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
