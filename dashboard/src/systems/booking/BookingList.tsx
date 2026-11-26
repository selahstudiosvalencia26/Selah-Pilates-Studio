"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Icon from "@/kit/Icon";
import { restoreAction } from "./actions";
import { depositLine, sizeLine, whenLine } from "./format";
import type { Booking, Settings } from "./schema";
import StatusTag from "./StatusTag";
import { btn, card, field, link, pick, primary } from "./ui";

type DepositRule = Pick<Settings, "depositRequired" | "depositKind" | "depositAmount" | "depositPercent">;

// The list: upcoming first, a few filters, one search box (name or phone). Everything stays on one screen, a card on a phone and a row on a wide one.
const FILTERS = [
  { id: "all", label: "All" },
  { id: "requested", label: "New requests" },
  { id: "confirmed", label: "Confirmed" },
  { id: "done", label: "Done" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export default function BookingList({ bookings, zone, now, removedId, heading, rule }: { bookings: Booking[]; zone: string; now: string; rule: DepositRule; removedId?: string; heading?: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const [problem, setProblem] = useState("");
  const router = useRouter();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const match = (b: Booking) => !q || b.customerName.toLowerCase().includes(q) || (digits.length > 2 && b.phone.replace(/\D/g, "").includes(digits));
    const rows = bookings.filter((b) => (filter === "all" || b.status === filter) && match(b));
    const coming = rows.filter((b) => b.endsAt >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = rows.filter((b) => b.endsAt < now).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return [...coming, ...past];
  }, [bookings, filter, query, now]);

  const undo = () =>
    start(async () => {
      const r = await restoreAction(removedId ?? "");
      if (r.ok) router.replace("/booking");
      else setProblem(r.message);
    });
  const newCount = bookings.filter((b) => b.status === "requested").length;

  return (
    <div className="grid gap-5">
      {removedId && (
        <p role="status" className="flex flex-wrap items-center gap-3 text-sm text-text-soft">
          Booking deleted.
          <button type="button" onClick={undo} disabled={pending} className={link}>
            Undo
          </button>
          {problem && <span className="text-danger">{problem}</span>}
        </p>
      )}
      {heading && <p className="text-sm text-text-soft">{heading}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-56">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or phone" aria-label="Search bookings by name or phone" className={`${field} pl-9`} />
        </div>
        <Link href="/booking/new" className={primary}>
          Add booking
        </Link>
      </div>
      <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={pick(filter === f.id)}>
            {f.label}
            {f.id === "requested" && newCount > 0 ? ` (${newCount})` : ""}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className={`${card} grid justify-items-start gap-3 p-6`}>
          <p className="text-sm text-text-soft">{bookings.length === 0 ? "No bookings yet. They will show here as customers ask, or add the first one yourself." : "Nothing matches. Try another word or filter."}</p>
          {bookings.length === 0 ? (
            <Link href="/booking/new" className={btn}>
              Add booking
            </Link>
          ) : (
            <button type="button" className={btn} onClick={() => (setFilter("all"), setQuery(""))}>
              Show everything
            </button>
          )}
        </div>
      ) : (
        <ul className={`${card} divide-y divide-border`}>
          {shown.map((b) => (
            <li key={b.id}>
              <Link href={`/booking/${b.id}`} className="grid gap-1 p-4 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_auto] sm:items-center sm:gap-4">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{b.customerName}</span>
                  <span className="block truncate text-xs text-text-soft">
                    {b.eventType} · {sizeLine(b)}
                  </span>
                </span>
                <span className="min-w-0 text-sm">
                  <span className="block truncate">{whenLine(b, zone)}</span>
                  {!b.sessionKey && <span className="block truncate text-xs text-text-soft">{depositLine(b, { zone, ...rule })}</span>}
                </span>
                {b.deposit === "waiting" && b.history.some((h) => h.what === "Customer sent a payment screenshot") && (
                  <span className="shrink-0 rounded-md bg-selected px-2 py-0.5 text-xs font-medium text-accent-ink">Receipt sent</span>
                )}
                <StatusTag booking={b} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
