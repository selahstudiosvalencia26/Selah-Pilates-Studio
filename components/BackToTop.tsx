"use client";

import { ArrowUp } from "@phosphor-icons/react";
import { toTop } from "@/components/SmoothScroll";

// Scrolls smoothly back to the top of the page. Just the words and a small arrow, which lifts a little on hover.
export function BackToTop({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toTop}
      className={`group inline-flex min-h-11 items-center gap-2 text-sm transition-colors duration-300 hover:text-page focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-page ${className}`}
    >
      Back to top
      <ArrowUp
        aria-hidden="true"
        size={14}
        className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
      />
    </button>
  );
}
