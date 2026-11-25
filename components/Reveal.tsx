"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// now: show on load without waiting to scroll into view (for the top of the page).
export function Reveal({
  children,
  className = "",
  now = false,
}: {
  children: ReactNode;
  className?: string;
  now?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (now) {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [now]);

  return (
    <div ref={ref} data-shown={shown} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
