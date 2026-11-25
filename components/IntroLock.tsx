"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Must match the home page intro in globals.css (the last hero words finish at about 1.85s).
const INTRO_MS = 1850;

// Locks scrolling while the home page intro plays. Any click, key press, scroll or touch skips it.
// The intro plays once: if the visitor starts on another page, or leaves home, it is used up.
export function IntroLock() {
  const pathname = usePathname();
  const firstPath = useRef(pathname);

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (firstPath.current !== "/") {
      root.dataset.intro = "done";
      return;
    }

    root.classList.add("intro-lock");
    window.scrollTo(0, 0);

    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    const end = () => {
      root.dataset.intro = "done";
      root.classList.remove("intro-lock");
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, end));
    };
    const timer = window.setTimeout(end, INTRO_MS);
    events.forEach((name) =>
      window.addEventListener(name, end, { passive: true }),
    );

    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, end));
      root.classList.remove("intro-lock");
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/") document.documentElement.dataset.intro = "done";
  }, [pathname]);

  return null;
}
