"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A small switch between two views that belong to one tab (the list and the calendar). One compact control that fits in a toolbar.
export default function Switch({ label, items }: { label: string; items: { href: string; title: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg border border-border-strong p-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={path === i.href ? "page" : undefined}
          className={`inline-flex h-full items-center rounded-md px-3 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent ${path === i.href ? "bg-accent text-accent-contrast" : "text-text-soft hover:bg-hover hover:text-text"}`}
        >
          {i.title}
        </Link>
      ))}
    </nav>
  );
}
