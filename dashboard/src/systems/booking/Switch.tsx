"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A small switch between two or three views that belong to one tab (the list and the calendar, for example).
export default function Switch({ label, items }: { label: string; items: { href: string; title: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="mb-5 flex flex-wrap gap-2">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={path === i.href ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent ${path === i.href ? "border-accent bg-accent text-accent-contrast" : "border-border-strong text-text hover:bg-hover"}`}
        >
          {i.title}
        </Link>
      ))}
    </nav>
  );
}
