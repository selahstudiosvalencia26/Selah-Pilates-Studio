"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { slideStyle, useSlide } from "@/kit/useSlide";
import { activeSection, type MenuChild } from "@/shell/menu";
import { PendingReporter } from "./NavPending";
import TabMenu from "./TabMenu";
import { scrollToCentre } from "./tabScroll";

// A system's own pages as tabs along the top of its screen, on every device, so the side menu stays one flat list.
// It scrolls sideways if there are many, without a scrollbar. The accent underline slides to the current tab.
export default function SystemTabs({
  name,
  sections,
  views,
}: {
  name: string;
  sections: MenuChild[];
  /** Views of one tab, keyed by that tab's address: they open in a small menu under it. */
  views?: Record<string, MenuChild[]>;
}) {
  const path = usePathname();
  const current = activeSection(sections, path);
  const slide = useSlide<HTMLUListElement>(current ?? "");
  const row = useRef<HTMLElement>(null);
  // On a phone the tabs scroll sideways: bring the one you are on into the middle, so it is never out of sight (tabScroll.ts).
  useEffect(() => {
    const nav = row.current;
    const tab = nav?.querySelector<HTMLElement>('[data-slide="on"]')?.parentElement;
    if (!nav || !tab) return;
    const where = tab.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
    const left = scrollToCentre(nav.clientWidth, nav.scrollWidth, where, tab.offsetWidth);
    nav.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [current]);
  return (
    <nav
      ref={row}
      aria-label={`${name} sections`}
      className="scroll-quiet -mx-4 mb-5 overflow-x-auto border-b border-border px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
    >
      <ul ref={slide.ref} className="relative flex gap-6">
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-0.5 rounded-full bg-accent transition-[transform,width] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
          style={slideStyle(slide.box, slide.ready, true)}
        />
        {sections.map((s) => {
          const on = s.href === current;
          const link = (
            <Link
              href={s.href}
              data-slide={on ? "on" : undefined}
              aria-current={on ? "page" : undefined}
              className={`block py-3.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${on ? "font-medium text-text" : "text-text-soft hover:text-text"}`}
            >
              {s.title}
              <PendingReporter />
            </Link>
          );
          return (
            <li key={s.href} className="shrink-0">
              {views?.[s.href] ? (
                <TabMenu label={s.title} views={views[s.href]}>
                  {link}
                </TabMenu>
              ) : (
                link
              )}
            </li>
          );
        })}
        {/* The space after the last tab. A scrolling row does not keep its right padding, so without this the last tab touches the edge
            of the panel, while the first has the same space as the page. It matches the page's side space (and goes at desktop width). */}
        <li aria-hidden className="-ml-6 w-4 shrink-0 sm:w-6 lg:hidden" />
      </ul>
    </nav>
  );
}
