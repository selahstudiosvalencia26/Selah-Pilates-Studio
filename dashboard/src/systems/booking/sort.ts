import { bookingRef } from "./ref";
import { statusWords } from "./rules";
import type { Booking } from "./schema";

// Sorting the bookings list by one of its columns. With nothing chosen the list stays as it was: what is coming first, soonest on
// top, then what is past.
export type SortKey = "id" | "customer" | "class" | "date" | "amount" | "status";
export type Sort = { key: SortKey; up: boolean } | null;

export const SORT_COLUMNS: { key: SortKey; title: string }[] = [
  { key: "id", title: "ID" },
  { key: "customer", title: "Customer" },
  { key: "class", title: "Class" },
  { key: "date", title: "Date and time" },
  { key: "amount", title: "Amount" },
  { key: "status", title: "Status" },
];

const value: Record<SortKey, (b: Booking) => string | number> = {
  id: (b) => bookingRef(b.id),
  customer: (b) => b.customerName.toLowerCase(),
  class: (b) => b.eventType.toLowerCase(),
  date: (b) => b.startsAt,
  amount: (b) => b.price ?? 0,
  status: (b) => statusWords(b),
};

export function sortBookings(list: readonly Booking[], sort: Sort): Booking[] {
  if (!sort) return [...list];
  const read = value[sort.key];
  const way = sort.up ? 1 : -1;
  return [...list].sort((a, b) => {
    const x = read(a);
    const y = read(b);
    const first = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return first !== 0 ? first * way : a.startsAt.localeCompare(b.startsAt); // equal ones stay in time order
  });
}

/** Press a column: sort by it; press it again: the other way round. */
export const nextSort = (now: Sort, key: SortKey): Sort => (now?.key === key ? { key, up: !now.up } : { key, up: true });
