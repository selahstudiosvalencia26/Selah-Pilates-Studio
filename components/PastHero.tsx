"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

// The floating booking button: on the home page only, and only once the person has scrolled past the big opening picture, which
// has its own button. It also steps aside when the footer arrives, which has a button too.
export function PastHero({ children }: { children: ReactNode }) {
  const home = usePathname() === "/";
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!home) return;
    const check = () => {
      const footer = document.querySelector("footer");
      const atFooter = footer
        ? footer.getBoundingClientRect().top < window.innerHeight - 40
        : false;
      setPast(window.scrollY > window.innerHeight * 0.75 && !atFooter);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [home]);

  if (!home) return null;
  return (
    <div
      data-book-bar
      inert={!past}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[opacity,translate,visibility] duration-250 ease-[var(--ease-out)] motion-reduce:transition-none md:justify-end md:px-6 md:pb-6 ${past ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0"}`}
    >
      {children}
    </div>
  );
}
