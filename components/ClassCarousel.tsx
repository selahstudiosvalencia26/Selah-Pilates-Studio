"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const arrow =
  "inline-flex size-11 items-center justify-center rounded-full border border-ink/30 text-lg transition-[transform,background-color] duration-[var(--duration-fast)] active:scale-95 disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100";

export function ClassCarousel({
  children,
  label = "classes",
}: {
  children: ReactNode;
  label?: string;
}) {
  const list = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = list.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    setProgress(max > 0 ? left / max : 1);
    setAtStart(left <= 1);
    setAtEnd(max <= 1 || left >= max - 1);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  function scrollBy(direction: 1 | -1) {
    const el = list.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  return (
    <div>
      <ul
        ref={list}
        onScroll={update}
        className="-mx-2 mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      <div className="mt-6 flex items-center gap-6">
        <div className="h-px flex-1 bg-line" aria-hidden="true">
          <div
            className="h-px origin-left bg-ink transition-transform duration-[var(--duration-fast)]"
            style={{
              width: "35%",
              transform: `translateX(${progress * (100 / 0.35 - 100)}%)`,
            }}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={`Previous ${label}`}
            disabled={atStart}
            onClick={() => scrollBy(-1)}
            className={`${arrow} hover:bg-page`}
          >
            <ArrowLeft aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            disabled={atEnd}
            onClick={() => scrollBy(1)}
            className={`${arrow} bg-ink text-page hover:opacity-90`}
          >
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
