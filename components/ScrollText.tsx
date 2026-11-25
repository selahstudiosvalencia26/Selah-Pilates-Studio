"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  /** First sentence, in the main text colour. */
  lead: string;
  /** The rest, in the softer colour. */
  rest: string;
  className?: string;
};

// The words light up one by one as the visitor scrolls past (GSAP ScrollTrigger).
// The full sentence is always in the page for screen readers and search engines.
export function ScrollText({ lead, rest, className = "" }: Props) {
  const root = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = el.querySelectorAll<HTMLElement>("[data-word]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.55, y: 6 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          duration: 2.4, // each word fades in slowly and overlaps the next one
          stagger: 0.35,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            end: "bottom 22%", // a long scroll distance, so the reveal feels unhurried
            scrub: 1.6, // the motion follows the scroll with a soft lag
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  const part = (text: string, tone: string) =>
    text.split(" ").map((word, i) => (
      <span key={`${tone}-${i}`} data-word className={tone}>
        {word}{" "}
      </span>
    ));

  return (
    <p ref={root} aria-label={`${lead} ${rest}`} className={className}>
      <span aria-hidden="true">
        {part(lead, "text-ink")}
        {part(rest, "text-muted")}
      </span>
    </p>
  );
}
