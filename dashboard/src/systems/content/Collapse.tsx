"use client";

import { useEffect, useState } from "react";

// Opens and closes a panel smoothly: it grows from nothing to its height and fades in, instead of jumping. The content
// stays in the page while closed (hidden from the keyboard and screen readers), so closing is as smooth as opening.
// `openClass` is spacing (a margin) that only exists while the panel is open, so a closed panel takes no room at all.
export default function Collapse({
  open,
  children,
  openClass = "",
}: {
  open: boolean;
  children: React.ReactNode;
  openClass?: string;
}) {
  // Clipped only while it moves or is closed. Once open, a dropdown inside may reach past the panel.
  const [settled, setSettled] = useState(open);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(open), open ? 260 : 0);
    return () => clearTimeout(timer);
  }, [open]);
  return (
    <div
      inert={!open}
      className={`grid self-start transition-[grid-template-rows,opacity,margin] duration-250 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${open ? `grid-rows-[1fr] opacity-100 ${openClass}` : "grid-rows-[0fr] opacity-0"}`}
    >
      <div className={`min-h-0 ${open && settled ? "" : "overflow-hidden"}`}>{children}</div>
    </div>
  );
}
