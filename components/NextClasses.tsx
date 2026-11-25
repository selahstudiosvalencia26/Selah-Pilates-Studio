"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bookingApi } from "@/content/booking";

// The next few class times on the home page, from the studio's dashboard, each one tap from booking. While there is nothing to
// show (no times yet, or the dashboard cannot be reached) it holds its place with plain empty cards.

type Slot = {
  key: string;
  title: string;
  startsAt: string;
  spotsLeft: number;
};

const ZONE = "Asia/Manila";
const fmt = (options: Intl.DateTimeFormatOptions, iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: ZONE, ...options }).format(
    new Date(iso),
  );
const SHOWN = 4;

export function NextClasses() {
  const [slots, setSlots] = useState<Slot[] | null>(null);

  useEffect(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(
      new Date(),
    );
    fetch(`${bookingApi}/api/booking/availability?from=${today}&days=8`)
      .then((r) => r.json())
      .then((j) =>
        setSlots(
          j.ok
            ? j.data.classes
                .filter((c: Slot) => c.spotsLeft > 0)
                .slice(0, SHOWN)
            : [],
        ),
      )
      .catch(() => setSlots([]));
  }, []);

  if (!slots || slots.length === 0)
    return (
      <ul className="border-t border-line" aria-busy={!slots}>
        {Array.from({ length: SHOWN }, (_, i) => (
          <li key={i} className="border-b border-line py-6 text-muted">
            {slots ? "Class times will show here." : "Loading"}
          </li>
        ))}
      </ul>
    );

  return (
    <ul className="border-t border-line transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none">
      {slots.map((s) => (
        <li key={s.key} className="border-b border-line">
          {/* The whole row is the button. */}
          <Link
            href={`/book?class=${encodeURIComponent(s.title)}`}
            aria-label={`Book ${s.title}, ${fmt({ weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }, s.startsAt)}`}
            className="group grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 py-5 focus-visible:outline-2 focus-visible:outline-ink sm:grid-cols-[4.5rem_minmax(0,1fr)_auto_auto] sm:gap-8"
          >
            <span className="text-center">
              <span className="block text-sm uppercase tracking-widest text-muted">
                {fmt({ weekday: "short" }, s.startsAt)}
              </span>
              <span className="block font-serif text-3xl leading-tight">
                {fmt({ day: "numeric" }, s.startsAt)}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-medium">
                {s.title}
              </span>
              <span className="block text-base text-muted">
                {fmt({ hour: "numeric", minute: "2-digit" }, s.startsAt)}
                <span className="sm:hidden">
                  {" · "}
                  {s.spotsLeft} left
                </span>
              </span>
            </span>
            <span className="hidden text-base text-muted sm:block">
              {s.spotsLeft} {s.spotsLeft === 1 ? "slot" : "slots"} left
            </span>
            <span
              aria-hidden="true"
              className="inline-flex size-11 items-center justify-center rounded-full border border-line transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-page motion-reduce:transition-none"
            >
              <ArrowUpRight size={18} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
