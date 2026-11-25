export type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type DayHours = {
  day: Day;
  open: string | null; // shown to visitors, for example "8 AM"
  close: string | null;
  closed?: boolean;
  opens24?: string; // for search engines, for example "08:00"
  closes24?: string;
};

// The opening times live in content/data/hours.json (the dashboard edits that file for now, and the database later), as 24 hour
// times like "08:00". The words visitors read ("8 AM") and the times search engines read ("08:00") are worked out here, so they
// can never disagree.
import data from "./data/hours.json";

type Times = "closed" | { open: string; close: string };
const week = data as unknown as Record<string, Times>;

const NAMES: [string, Day][] = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
];

// "08:00" becomes "8 AM", "17:30" becomes "5:30 PM".
export function clock(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

export const hours: DayHours[] = NAMES.map(([key, day]) => {
  const v = week[key];
  if (v === "closed") return { day, open: null, close: null, closed: true };
  return {
    day,
    open: clock(v.open),
    close: clock(v.close),
    opens24: v.open,
    closes24: v.close,
  };
});
