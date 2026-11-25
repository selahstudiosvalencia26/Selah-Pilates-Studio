"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { pages } from "@/content/pages";

type Box = { x: number; w: number };

// The page links. A soft pill sits on the current page and slides when the page changes. `light` is for sitting over a photo.
// A soft pill follows the mouse (or the keyboard focus) from link to link.
export function NavLinks({ light = false }: { light?: boolean }) {
  const pathname = usePathname();
  const list = useRef<HTMLUListElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState<Box | null>(null);
  const [hover, setHover] = useState<Box | null>(null);
  const [hovering, setHovering] = useState(false);

  const current = pages.findIndex((p) =>
    p.href === "/" ? pathname === "/" : pathname.startsWith(p.href),
  );

  const box = useCallback((i: number): Box | null => {
    const el = items.current[i];
    return el ? { x: el.offsetLeft, w: el.offsetWidth } : null;
  }, []);

  useLayoutEffect(() => {
    const measure = () => setActive(current >= 0 ? box(current) : null);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [current, box]);

  const point = (i: number) => {
    setHover(box(i));
    setHovering(true);
  };

  const pill =
    "pointer-events-none absolute left-0 top-0 h-full rounded-full transition-[transform,width,opacity] duration-500 ease-[var(--ease-out)] motion-reduce:transition-none";

  return (
    <ul
      ref={list}
      className="relative flex gap-0.5 text-base"
      onMouseLeave={() => setHovering(false)}
      onBlur={() => setHovering(false)}
    >
      {hover && (
        <span
          aria-hidden="true"
          className={`${pill} ${light ? "bg-page/10" : "bg-sand/50"} ${hovering ? "opacity-100" : "opacity-0"}`}
          style={{ transform: `translateX(${hover.x}px)`, width: hover.w }}
        />
      )}
      {active && (
        <span
          aria-hidden="true"
          className={`${pill} ${light ? "bg-page/20" : "bg-sand"}`}
          style={{ transform: `translateX(${active.x}px)`, width: active.w }}
        />
      )}

      {pages.map((p, i) => {
        const isCurrent = i === current;
        return (
          <li
            key={p.href}
            ref={(el) => {
              items.current[i] = el;
            }}
            onMouseEnter={() => point(i)}
            onFocus={() => point(i)}
          >
            <Link
              href={p.href}
              aria-current={isCurrent ? "page" : undefined}
              className={`relative z-10 inline-flex min-h-11 items-center rounded-full px-4 transition-colors duration-300 ${
                isCurrent
                  ? `${light ? "text-page" : "text-ink"} ${active ? "" : light ? "bg-page/20" : "bg-sand"}`
                  : light
                    ? "text-page/80 hover:text-page focus-visible:text-page"
                    : "text-ink/65 hover:text-ink focus-visible:text-ink"
              }`}
            >
              {p.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
