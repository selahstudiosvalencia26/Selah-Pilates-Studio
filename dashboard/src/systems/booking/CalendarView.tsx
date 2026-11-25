import Link from "next/link";
import Icon from "@/kit/Icon";
import { isPendingHold, occurrencesOn, partOn, spotsLeft } from "./rules";
import type { Booking, Settings } from "./schema";
import { addDays, clockWords, localParts, weekdayOf, WEEKDAYS } from "./time";
import { card } from "./ui";

// The month, one box per day. Venue mode shows each booking (a held date is solid, a request says "Request" in words, so colour is never the only
// signal). Classes mode shows each class with its spots. On a phone only the days that have something are listed, as a plain agenda.
type Item = { key: string; text: string; href: string; held: boolean };

const monthName = (m: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));
const shift = (m: string, by: number) => addDays(`${m}-01`, by > 0 ? 32 : -1).slice(0, 7);

function itemsFor(date: string, s: Settings, bookings: readonly Booking[]): Item[] {
  if (s.mode === "classes") {
    return occurrencesOn(s, date).map((o) => ({ key: o.key, text: `${clockWords(localParts(o.startsAt, s.zone).time)} ${o.title} · ${o.capacity - spotsLeft(bookings, o)}/${o.capacity}`, href: `/booking?session=${o.key}`, held: true }));
  }
  return bookings
    .filter((b) => b.deletedAt === null && b.status !== "cancelled" && partOn(s.zone, b, date))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((b) => {
      const waiting = isPendingHold(s, b);
      const first = localParts(b.startsAt, s.zone).date === date;
      const label = waiting ? " (On hold)" : b.status === "requested" ? " (Request)" : "";
      return { key: b.id, text: `${first ? clockWords(localParts(b.startsAt, s.zone).time) : "All day"} ${b.customerName}${label}`, href: `/booking/${b.id}`, held: b.status !== "requested" };
    });
}

export default function CalendarView({ month, today, settings, bookings }: { month: string; today: string; settings: Settings; bookings: Booking[] }) {
  const first = `${month}-01`;
  const lead = WEEKDAYS.indexOf(weekdayOf(first));
  const days: string[] = [];
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) days.push(d);
  const cells: (string | null)[] = [...Array(lead).fill(null), ...days];

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <Link href={`/booking/calendar?m=${shift(month, -1)}`} aria-label="Previous month" className="grid h-11 w-11 place-items-center rounded-lg text-text-soft transition-colors hover:bg-hover hover:text-text focus-visible:outline-2 focus-visible:outline-accent">
          <Icon name="chevron-down" className="h-5 w-5 rotate-90" />
        </Link>
        <h2 className="min-w-40 text-center text-base font-medium">{monthName(month)}</h2>
        <Link href={`/booking/calendar?m=${shift(month, 1)}`} aria-label="Next month" className="grid h-11 w-11 place-items-center rounded-lg text-text-soft transition-colors hover:bg-hover hover:text-text focus-visible:outline-2 focus-visible:outline-accent">
          <Icon name="chevron-down" className="h-5 w-5 -rotate-90" />
        </Link>
        {month !== today.slice(0, 7) && (
          <Link href="/booking/calendar" className="ml-2 text-sm text-text-soft underline underline-offset-4 hover:text-text">
            Today
          </Link>
        )}
      </div>
      <ol className={`${card} grid overflow-hidden sm:grid-cols-7`}>
        {WEEKDAYS.map((d) => (
          <li key={d} aria-hidden className="hidden border-b border-border px-2 py-2 text-xs capitalize text-text-soft sm:block">
            {d}
          </li>
        ))}
        {cells.map((date, i) => {
          if (!date) return <li key={`gap-${i}`} aria-hidden className="hidden min-h-24 border-b border-border sm:block" />;
          const items = itemsFor(date, settings, bookings);
          return (
            <li key={date} className={`border-b border-border p-2 sm:min-h-24 sm:border-r ${items.length === 0 ? "max-sm:hidden" : ""}`}>
              <p className={`mb-1 text-xs ${date === today ? "font-semibold text-accent-ink" : "text-text-soft"}`}>
                <span className="sm:hidden">{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))}</span>
                <span className="max-sm:hidden">{Number(date.slice(8))}</span>
              </p>
              <ul className="grid gap-1">
                {items.map((it) => (
                  <li key={it.key}>
                    <Link href={it.href} className={`block min-h-9 truncate rounded-md px-2 py-2 text-xs transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent sm:min-h-0 sm:py-1 ${it.held ? "bg-selected text-text" : "border border-dashed border-border-strong text-text-soft"}`}>
                      {it.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-text-soft">{settings.mode === "classes" ? "Each class shows booked slots out of all slots." : "A solid box is a locked date. A dashed box is a request, and On hold means someone is paying for it."}</p>
    </div>
  );
}
