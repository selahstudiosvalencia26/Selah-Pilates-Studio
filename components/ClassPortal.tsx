"use client";

import { CaretRight, Check } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { OnlineBooking } from "@/components/OnlineBooking";

// The Class page, made to be short and easy on a phone, and easy for older people: large words, one kind of class shown at a time,
// the whole row of a class is one big button, and the first-class tips are a short open list. Tapping a class goes up to the Schedule with
// it already chosen.

export type PortalClass = {
  slug: string;
  name: string;
  group: string;
  summary: string | null;
  meta: string; // length and price
  photo: ReactNode;
};

const heading = "mb-4 font-serif text-3xl sm:mb-6 sm:text-4xl";
const row =
  "flex w-full items-center gap-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-ink sm:gap-6 sm:py-4";

export function ClassPortal({
  classes,
  firstTitle,
  firstItems,
  online,
  bookingElsewhere,
  messenger,
}: {
  classes: PortalClass[];
  firstTitle: string;
  firstItems: string[];
  online: boolean; // can this website take bookings itself?
  bookingElsewhere: string; // where Book goes when it cannot
  messenger: string | null;
}) {
  const [picked, setPicked] = useState("");
  const groups = [...new Set(classes.map((c) => c.group))];
  const [group, setGroup] = useState(groups[0] ?? "");
  const top = useRef<HTMLElement>(null);

  const pick = (name: string) => {
    setPicked(name);
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const inside = (c: PortalClass) => (
    <>
      <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-stone sm:size-28">
        {c.photo}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-medium sm:text-2xl">{c.name}</span>
        {c.summary && (
          <span className="line-clamp-1 text-base text-muted sm:line-clamp-2">
            {c.summary}
          </span>
        )}
        <span className="block text-base">{c.meta}</span>
      </span>
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-page sm:h-11 sm:w-auto sm:gap-2 sm:px-5">
        <span className="hidden text-base sm:inline">
          {online ? "See times" : "Book"}
        </span>
        <CaretRight aria-hidden="true" size={18} />
      </span>
    </>
  );

  return (
    <div className="grid gap-20 sm:gap-28">
      {online && (
        <section
          ref={top}
          id="schedule"
          aria-label="Schedule"
          className="scroll-mt-28"
        >
          <h2 className={heading}>Schedule</h2>
          <p className="mb-8 text-lg text-muted">
            Choose a day, then press Book.
          </p>
          <OnlineBooking key={picked} picked={picked} messenger={messenger} />
        </section>
      )}

      <section aria-label="Classes">
        <h2 className={heading}>Classes</h2>
        {groups.length > 1 && (
          <div
            role="group"
            aria-label="Kind of class"
            className="mb-3 grid grid-cols-2 gap-1 rounded-3xl bg-sand p-1 sm:inline-grid"
          >
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={g === group}
                onClick={() => setGroup(g)}
                className={`min-h-11 whitespace-nowrap rounded-full px-4 text-base transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ink sm:px-6 sm:text-lg ${g === group ? "bg-ink text-page" : ""}`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        <ul
          key={group}
          className="grid transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none lg:grid-cols-2 lg:gap-x-10"
        >
          {classes
            .filter((c) => c.group === group)
            .map((c) => (
              <li key={c.slug} className="border-b border-line">
                {online ? (
                  <button
                    type="button"
                    className={row}
                    aria-label={`See times for ${c.name}, ${c.meta}`}
                    onClick={() => pick(c.name)}
                  >
                    {inside(c)}
                  </button>
                ) : (
                  <Link
                    href={bookingElsewhere}
                    className={row}
                    aria-label={`Book ${c.name}, ${c.meta}`}
                  >
                    {inside(c)}
                  </Link>
                )}
              </li>
            ))}
        </ul>
      </section>

      {/* Open, nothing to press: a heading and a short list with lines between, so there is plenty of space around each tip. */}
      <section
        aria-label={firstTitle}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16"
      >
        <h2 className={heading}>{firstTitle}</h2>
        <ul>
          {firstItems.map((item) => (
            <li
              key={item}
              className="flex items-start gap-4 border-b border-line py-5 text-lg first:border-t"
            >
              <Check
                aria-hidden="true"
                size={22}
                className="mt-1 shrink-0 text-muted"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
