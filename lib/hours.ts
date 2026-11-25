import type { DayHours } from "@/content/hours";

export type HoursRow = { label: string; text: string };

// Joins days that share the same hours, for example "Mon to Fri  8 AM to 8 PM".
export function hoursRows(hours: DayHours[]): HoursRow[] {
  const known = hours
    .filter((d) => d.closed || (d.open && d.close))
    .map((d) => ({
      day: d.day,
      text: d.closed ? "Closed" : `${d.open} to ${d.close}`,
    }));

  const rows: { first: string; last: string; text: string }[] = [];
  for (const d of known) {
    const prev = rows[rows.length - 1];
    if (prev && prev.text === d.text) prev.last = d.day;
    else rows.push({ first: d.day, last: d.day, text: d.text });
  }

  const short = (day: string) => day.slice(0, 3);
  return rows.map((r) => ({
    label:
      r.first === r.last ? r.first : `${short(r.first)} to ${short(r.last)}`,
    text: r.text,
  }));
}
