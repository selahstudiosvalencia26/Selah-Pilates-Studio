// Booking times. A person types a date and a clock time in the business's own zone (Manila by default). We store the exact moment
// in UTC and turn it back into local words when we show it (docs/rules/rules.md, "Time"). Written to work for any zone.

const part = (parts: Intl.DateTimeFormatPart[], type: string) => Number(parts.find((p) => p.type === type)?.value);

// How far the zone is ahead of UTC at this moment, in milliseconds.
function offsetMs(zone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(utcMs));
  const asUtc = Date.UTC(part(parts, "year"), part(parts, "month") - 1, part(parts, "day"), part(parts, "hour"), part(parts, "minute"), part(parts, "second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

// "2026-12-05", "18:00", "Asia/Manila" -> "2026-12-05T10:00:00.000Z"
export function zonedToUtc(date: string, time: string, zone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const first = offsetMs(zone, guess);
  let utc = guess - first;
  const second = offsetMs(zone, utc);
  if (second !== first) utc = guess - second; // the clock changed in between (daylight saving)
  return new Date(utc).toISOString();
}

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

// A moment, as the date, the clock time and the weekday on the wall of the business.
export function localParts(iso: string, zone: string): { date: string; time: string; weekday: Weekday } {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short" }).formatToParts(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  const name = f.find((p) => p.type === "weekday")?.value.toLowerCase().slice(0, 3) as Weekday;
  return { date: `${part(f, "year")}-${pad(part(f, "month"))}-${pad(part(f, "day"))}`, time: `${pad(part(f, "hour"))}:${pad(part(f, "minute"))}`, weekday: name };
}

// The weekday of a plain date such as "2026-12-05" (the same in every zone).
export const weekdayOf = (date: string): Weekday => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

// "2026-12-05" + 3 days -> "2026-12-08"
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Every date from the first to the last, both included. A last date before the first gives just the first.
export function datesBetween(first: string, last: string): string[] {
  const out = [first];
  while (out[out.length - 1] < last && out.length < 60) out.push(addDays(out[out.length - 1], 1));
  return out;
}

// "2026-12-05T10:00Z" -> "Sat 5 Dec, 6:00 PM". One clear line for lists.
export function whenWords(iso: string, zone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: zone, weekday: "short", day: "numeric", month: "short" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return `${day}, ${time}`;
}

// "6:00 PM" from "18:00".
export function clockWords(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
