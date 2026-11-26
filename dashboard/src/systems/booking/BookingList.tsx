"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Icon from "@/kit/Icon";
import { restoreAction } from "./actions";
import BulkBar from "./BulkBar";
import { depositLine, sizeLine, whenLine } from "./format";
import { peso } from "./pricing";
import type { Booking, Settings } from "./schema";
import { bookingRef } from "./ref";
import { nextSort, SORT_COLUMNS, sortBookings, type Sort, type SortKey } from "./sort";
import StatusTag from "./StatusTag";
import { btn, card, field, link, pick, primary } from "./ui";

type DepositRule = Pick<Settings, "depositRequired" | "depositKind" | "depositAmount" | "depositPercent">;

const PER_PAGE = 10;
const TICK = "grid h-12 w-12 shrink-0 cursor-pointer place-items-center self-stretch";
// The same columns for the names at the top and for every row, so they line up.
const COLUMNS = "lg:grid lg:grid-cols-[5.5rem_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-4";

// What is happening with the money, in a few words.
const moneyNote = (b: Booking, rule: DepositRule & { zone: string }) => {
  if (!b.sessionKey) return depositLine(b, rule);
  if (b.deposit === "paid") return `${peso(b.depositAmount)} paid`;
  if (b.deposit === "waiting") return `${peso(b.depositAmount)} to pay`;
  return "";
};

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
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<Sort>(null);
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  const [pending, start] = useTransition();
  const [problem, setProblem] = useState("");
  const router = useRouter();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const match = (b: Booking) => !q || b.customerName.toLowerCase().includes(q) || bookingRef(b.id).toLowerCase().includes(q.replace(/^#/, "")) || (digits.length > 2 && b.phone.replace(/\D/g, "").includes(digits));
    const rows = bookings.filter((b) => (filter === "all" || b.status === filter) && match(b));
    const coming = rows.filter((b) => b.endsAt >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = rows.filter((b) => b.endsAt < now).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return sortBookings([...coming, ...past], sort);
  }, [bookings, filter, query, now, sort]);

  const sortBy = (key: SortKey) => (setSort((was) => nextSort(was, key)), setPage(1));

  const undo = () =>
    start(async () => {
      const r = await restoreAction(removedId ?? "");
      if (r.ok) router.replace("/booking");
      else setProblem(r.message);
    });
  const count = (id: (typeof FILTERS)[number]["id"]) => (id === "all" ? bookings.length : bookings.filter((b) => b.status === id).length);
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const at = Math.min(page, pages); // a search that leaves fewer pages never leaves an empty one on screen
  const first = (at - 1) * PER_PAGE;
  const rows = shown.slice(first, first + PER_PAGE);
  // Only what is on screen can be acted on, so nothing is changed that cannot be seen.
  const picked = rows.filter((b) => ticked.has(b.id));
  const allTicked = rows.length > 0 && picked.length === rows.length;
  const tick = (id: string, on: boolean) => setTicked((now) => new Set(on ? [...now, id] : [...now].filter((x) => x !== id)));

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
          <input type="search" value={query} onChange={(e) => (setQuery(e.target.value), setPage(1))} placeholder="Search by name, phone or ID" aria-label="Search bookings by name, phone or ID" className={`${field} pl-9`} />
        </div>
        <Link href="/booking/new" className={primary}>
          Add booking
        </Link>
      </div>
      <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => (setFilter(f.id), setPage(1))} className={pick(filter === f.id)}>
            {f.label}
            {` (${count(f.id)})`}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 lg:hidden" role="group" aria-label="Sort">
        {SORT_COLUMNS.filter((c) => c.key === "date" || c.key === "customer" || c.key === "status").map((c) => (
          <button key={c.key} type="button" aria-pressed={sort?.key === c.key} onClick={() => sortBy(c.key)} className={pick(sort?.key === c.key)}>
            {c.title}
            {sort?.key === c.key ? (sort.up ? " \u2191" : " \u2193") : ""}
          </button>
        ))}
      </div>

      <BulkBar picked={picked} onClear={() => setTicked(new Set())} />

      {shown.length === 0 ? (
        <div className={`${card} grid justify-items-start gap-3 p-6`}>
          <p className="text-sm text-text-soft">{bookings.length === 0 ? "No bookings yet. They will show here as customers ask, or add the first one yourself." : "Nothing matches. Try another word or filter."}</p>
          {bookings.length === 0 ? (
            <Link href="/booking/new" className={btn}>
              Add booking
            </Link>
          ) : (
            <button type="button" className={btn} onClick={() => (setFilter("all"), setQuery(""), setPage(1))}>
              Show everything
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          <div className={`${card} overflow-hidden`}>
            {/* Column names on a wide screen. On a phone each booking is a small card instead. */}
            <div className="flex items-center border-b border-border">
              <label className={TICK}>
                <input type="checkbox" className="h-4 w-4 accent-accent" aria-label="Tick every booking on this page" checked={allTicked} onChange={(e) => setTicked(new Set(e.target.checked ? rows.map((b) => b.id) : []))} />
              </label>
              {/* Each column name is a button: press to sort by it, press again to turn it round. */}
              <div className={`hidden min-w-0 flex-1 pr-4 text-xs font-medium text-text-soft ${COLUMNS}`}>
                {SORT_COLUMNS.map((c) => {
                  const on = sort?.key === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      aria-label={`Sort by ${c.title}${on ? (sort.up ? ", now first to last" : ", now last to first") : ""}`}
                      onClick={() => sortBy(c.key)}
                      className={`flex min-h-11 min-w-0 items-center gap-1 rounded-md text-left transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-accent ${on ? "text-text" : ""} ${c.key === "status" ? "lg:justify-end" : ""}`}
                    >
                      <span className="truncate">{c.title}</span>
                      <Icon name="chevron-down" className={`h-3 w-3 shrink-0 transition-[transform,opacity] duration-150 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-30"} ${on && sort.up ? "rotate-180" : ""}`} />
                    </button>
                  );
                })}
              </div>
              <span aria-hidden className="py-3 text-xs font-medium text-text-soft lg:hidden">
                Tick all
              </span>
            </div>
            <ul className="divide-y divide-border">
              {rows.map((b) => (
                <li key={b.id} className={`flex items-center ${ticked.has(b.id) ? "bg-selected" : ""}`}>
                  <label className={TICK}>
                    <input type="checkbox" className="h-4 w-4 accent-accent" aria-label={`Tick ${b.customerName}, ${bookingRef(b.id)}`} checked={ticked.has(b.id)} onChange={(e) => tick(b.id, e.target.checked)} />
                  </label>
                  <Link href={`/booking/${b.id}`} className={`grid min-w-0 flex-1 gap-1 py-4 pr-4 text-sm transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent lg:items-center ${COLUMNS} lg:py-3`}>
                    <span className="font-mono text-xs text-text-soft">{bookingRef(b.id)}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{b.customerName}</span>
                      <span className="block truncate text-xs text-text-soft">{b.phone}</span>
                    </span>
                    <span className="min-w-0 truncate">
                      {b.eventType} <span className="text-text-soft">· {sizeLine(b)}</span>
                    </span>
                    <span className="min-w-0 truncate">{whenLine(b, zone)}</span>
                    <span className="min-w-0">
                      <span className="block truncate">{b.price === undefined ? "" : peso(b.price)}</span>
                      <span className="block truncate text-xs text-text-soft">{moneyNote(b, { zone, ...rule })}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {b.deposit === "waiting" && b.history.some((h) => h.what === "Customer sent a payment screenshot") && (
                        <span className="shrink-0 rounded-md bg-selected px-2 py-0.5 text-xs font-medium text-accent-ink">Receipt sent</span>
                      )}
                      <StatusTag booking={b} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-sm text-text-soft">
              {first + 1} to {first + rows.length} of {shown.length}
            </p>
            {pages > 1 && (
              <nav aria-label="Pages" className="flex items-center gap-2">
                <button type="button" className={btn} disabled={at === 1} onClick={() => setPage(at - 1)}>
                  Previous
                </button>
                <span className="px-1 text-sm text-text-soft">
                  Page {at} of {pages}
                </span>
                <button type="button" className={btn} disabled={at === pages} onClick={() => setPage(at + 1)}>
                  Next
                </button>
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
