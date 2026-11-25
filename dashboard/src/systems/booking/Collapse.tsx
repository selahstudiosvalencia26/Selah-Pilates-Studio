"use client";

import { useEffect, useState } from "react";

// Opens and closes a panel smoothly. The content stays in the page while closed, hidden from the keyboard and screen readers.
export default function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  // Clipped only while it moves or is closed. Once open, a dropdown inside may reach past the panel.
  const [settled, setSettled] = useState(open);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(open), open ? 260 : 0);
    return () => clearTimeout(timer);
  }, [open]);
  return (
    <div
      inert={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
    >
      <div className={`min-h-0 ${open && settled ? "" : "overflow-hidden"}`}>{children}</div>
    </div>
  );
}
