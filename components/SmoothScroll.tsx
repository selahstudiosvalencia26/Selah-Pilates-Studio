"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

let glide: Lenis | null = null;

/** Back to the top of the page. Goes through the glide when it is on, so the two never pull against each other. */
export function toTop() {
  if (glide) return glide.scrollTo(0);
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
}

// A soft glide for the mouse wheel and trackpad. Phones and tablets keep their own scrolling, which is already smooth, and nothing
// changes for people who have asked their device for less movement.
export function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({
      autoRaf: true,
      lerp: 0.1, // how quickly the page catches up with the wheel: lower is silkier, higher is snappier
      anchors: true,
      allowNestedScroll: true, // boxes that scroll by themselves (a row of days, a list) keep working
    });
    lenis.current = instance;
    glide = instance;

    // While something has locked the page (the opening animation, the phone menu), the glide waits too.
    const follow = () => {
      const locked = [document.documentElement, document.body].some(
        (el) => getComputedStyle(el).overflowY === "hidden",
      );
      if (locked) instance.stop();
      else instance.start();
    };
    const watch = new MutationObserver(follow);
    for (const el of [document.documentElement, document.body])
      watch.observe(el, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    follow();

    return () => {
      watch.disconnect();
      instance.destroy();
      lenis.current = null;
      glide = null;
    };
  }, []);

  // A new page starts still: any glide left over from the last one is dropped.
  useEffect(() => {
    lenis.current?.stop();
    lenis.current?.start();
    lenis.current?.resize();
  }, [pathname]);

  return null;
}
