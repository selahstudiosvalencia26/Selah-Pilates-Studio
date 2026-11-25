"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// A highlight that slides to the chosen item (the tabs). Put `ref` on the group (it must be `relative`) and
// `data-slide="on"` on the chosen item. `box` is where the chosen item sits inside the group; draw one absolutely
// positioned element from it, and give it `slideStyle(...)`. The first paint has no sliding, so nothing glides in from
// the corner. Reduced motion turns the glide off in CSS (`motion-reduce:transition-none`).
export type SlideBox = { x: number; y: number; w: number; h: number };

export function useSlide<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<SlideBox | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const el = root.querySelector<HTMLElement>('[data-slide="on"]');
      setBox(el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null);
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(root);
    return () => watch.disconnect();
  }, [key]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return { ref, box, ready };
}

// The style for the sliding element: moved with transform, sized to the chosen item (or only as wide: `line`).
export function slideStyle(box: SlideBox | null, ready: boolean, line = false): React.CSSProperties {
  if (!box) return { opacity: 0 };
  return {
    width: box.w,
    ...(line ? { top: "auto", bottom: 0 } : { height: box.h }),
    transform: `translate(${box.x}px, ${line ? 0 : box.y}px)`,
    transition: ready ? undefined : "none",
  };
}
