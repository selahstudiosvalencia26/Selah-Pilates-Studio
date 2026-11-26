"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/kit/Icon";
import type { MenuChild } from "@/shell/menu";

// The views of one tab (Bookings: List, Calendar), in a small menu under it. It opens when a mouse rests on the tab, or with the
// arrow beside it (touch and keyboard), and closes on Escape, a press elsewhere or a new page. It is placed against the window, so
// the tab row, which scrolls sideways on a phone, cannot cut it off.
export default function TabMenu({ label, views, children }: { label: string; views: MenuChild[]; children: React.ReactNode }) {
  const path = usePathname();
  const box = useRef<HTMLSpanElement>(null);
  const wait = useRef<number | undefined>(undefined);
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);

  const open = () => {
    window.clearTimeout(wait.current);
    const r = box.current?.getBoundingClientRect();
    if (r) setAt({ top: r.bottom, left: Math.min(r.left, window.innerWidth - 176) });
  };
  const close = () => {
    window.clearTimeout(wait.current);
    setAt(null);
  };
  // A short pause, so moving from the tab down into the menu does not close it.
  const leave = () => {
    wait.current = window.setTimeout(() => setAt(null), 140);
  };

  useEffect(() => close(), [path]);
  useEffect(() => {
    if (!at) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    const press = (e: PointerEvent) => !box.current?.contains(e.target as Node) && close();
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", press);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("scroll", close, true);
    };
  }, [at]);

  return (
    <span ref={box} className="flex items-center" onPointerEnter={(e) => e.pointerType === "mouse" && open()} onPointerLeave={(e) => e.pointerType === "mouse" && leave()}>
      {children}
      <button type="button" aria-label={`${label} views`} aria-expanded={at !== null} onClick={() => (at ? close() : open())} className="-mr-1.5 grid h-11 w-7 place-items-center rounded-md text-text-soft hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        <Icon name="chevron-down" className={`h-3.5 w-3.5 transition-transform duration-150 motion-reduce:transition-none ${at ? "rotate-180" : ""}`} />
      </button>
      {at && (
        <span style={{ top: at.top, left: at.left }} className="fixed z-30 grid w-40 gap-0.5 rounded-xl border border-border bg-card p-1 shadow-lg transition-[opacity,translate] duration-150 starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none">
          {views.map((v) => (
            <Link key={v.href} href={v.href} onClick={close} aria-current={path === v.href ? "page" : undefined} className={`flex min-h-11 items-center justify-between rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${path === v.href ? "bg-selected font-medium text-text" : "text-text-soft hover:bg-hover hover:text-text"}`}>
              {v.title}
              {path === v.href && <Icon name="check" className="h-4 w-4" />}
            </Link>
          ))}
        </span>
      )}
    </span>
  );
}
