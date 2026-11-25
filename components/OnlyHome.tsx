"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Shows what is inside on the home page only.
export function OnlyHome({ children }: { children: ReactNode }) {
  return usePathname() === "/" ? children : null;
}
