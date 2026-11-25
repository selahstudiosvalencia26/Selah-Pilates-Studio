"use client";

import Link from "next/link";
import Icon from "@/kit/Icon";
import { clashOn, dayOverview, type Hours, type Slot, type Window } from "./rules";
import { clockWords } from "./time";
import { card } from "./ui";

// Beside the Add booking form: what is already on the chosen day, so staff see the opening hours, who has the day, and the free times
// before they press Add, and are told at once if the time they typed runs into a confirmed booking. Real information, nothing decorative.
const dayWords = (d: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const range = (w: Window) => `${clockWords(w.start)} to ${clockWords(w.end)}`;

export default function DayPanel({ date, start, end, hours, slots, ignoreId }: { date: string; start: string; end: string; hours: Hours; slots: Slot[]; ignoreId?: string }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return (
      <aside aria-label="What is on that day" className={`${card} grid gap-2 p-5`}>
        <h2 className="text-base font-medium">What is on that day</h2>
        <p className="text-sm text-text-soft">Pick a date to see what is already booked and when the venue is free.</p>
      </aside>
    );
  }

  const o = dayOverview(hours, slots, date);
  const clash = clashOn(o, start, end, ignoreId);
  const outside = !!o.open && !!start && !!end && (start < o.open.start || end > o.open.end);

  return (
    <aside aria-label="What is on that day" className={`${card} grid gap-5 p-5`}>
      <div className="grid gap-1">
        <h2 className="text-base font-medium">{dayWords(date)}</h2>
        <p className="text-sm text-text-soft">{o.open ? `Open ${range(o.open)}` : `Closed (${o.closedBecause}). You can still add it by hand.`}</p>
      </div>

      <section aria-labelledby="day-booked" className="grid gap-2">
        <h3 id="day-booked" className="text-[13px] font-medium">
          Already on this day
        </h3>
        {o.lines.length === 0 ? (
          <p className="text-sm text-text-soft">Nothing yet.</p>
        ) : (
          <ul className="grid gap-1.5">
            {o.lines.map((l) => (
              <li key={l.id}>
                <Link href={`/booking/${l.id}`} className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent">
                  <span className="min-w-0 truncate font-medium">{l.name}</span>
                  <span className="text-text-soft">
                    {range(l)} · {l.status === "confirmed" ? "Confirmed" : l.waiting ? "Waiting for deposit" : "Request"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {o.open && (
        <section aria-labelledby="day-free" className="grid gap-2">
          <h3 id="day-free" className="text-[13px] font-medium">
            Free
          </h3>
          {o.free.length === 0 ? (
            <p className="text-sm text-text-soft">The day is full.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {o.free.map((w) => (
                <li key={w.start} className="rounded-lg bg-surface px-3 py-1.5 text-sm">
                  {range(w)}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-text-soft">Only confirmed bookings hold a time. A request does not.</p>
        </section>
      )}

      <p role="status" aria-live="polite" className={`flex min-h-6 items-start gap-2 text-sm ${clash ? "text-danger" : "text-text-soft"}`}>
        {clash ? (
          <>
            <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" weight="medium" />
            <span>
              This time runs into {clash.name}&rsquo;s confirmed booking ({range(clash)}). Pick another time.
            </span>
          </>
        ) : start && end && start < end ? (
          <>
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-success" weight="medium" />
            <span>{outside ? "No clash, but this is outside the opening hours." : "No clash. This time is free."}</span>
          </>
        ) : null}
      </p>
    </aside>
  );
}
