"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

// A number that counts up once when it scrolls into view, for example "8+" or "1,200".
// Anything that is not a number (like a dash) is shown as it is.
export function CountUp({ value }: { value: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const match = value.match(/^(\D*)(\d[\d,]*)(.*)$/);

  useEffect(() => {
    const node = el.current;
    if (!node || !match) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replace(/,/g, ""));
    const format = (n: number) =>
      `${prefix}${Math.round(n).toLocaleString("en-US")}${suffix}`;
    const counter = { n: 0 };
    node.textContent = format(0);

    const tween = gsap.to(counter, {
      n: target,
      duration: 2.4,
      ease: "power3.out",
      onUpdate: () => {
        node.textContent = format(counter.n);
      },
      scrollTrigger: { trigger: node, start: "top 90%", once: true },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      node.textContent = value;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={el}>{value}</span>;
}
