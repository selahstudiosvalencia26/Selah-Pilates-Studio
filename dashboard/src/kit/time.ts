// Time. Stored in UTC, shown in the business's time zone (Manila by default). docs/rules/rules.md.

export const DEFAULT_ZONE = "Asia/Manila";

const valid = (zone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

// "2026-11-12T10:30:00Z" -> "12 Nov 2026, 6:30 PM" in the given zone. An unknown zone falls back to Manila.
export function formatInZone(iso: string | Date, zone: string = DEFAULT_ZONE): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: valid(zone) ? zone : DEFAULT_ZONE, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

// Today in the business's zone, as yyyy-mm-dd.
export function todayInZone(zone: string = DEFAULT_ZONE, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: valid(zone) ? zone : DEFAULT_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
