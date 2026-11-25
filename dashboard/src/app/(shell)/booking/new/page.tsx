import { todayInZone } from "@/kit/time";
import BookingForm from "@/systems/booking/BookingForm";
import ClassBookForm from "@/systems/booking/ClassBookForm";
import { hoursOf, occurrencesOn, spotsLeft, toSlots } from "@/systems/booking/rules";
import { readData } from "@/systems/booking/store";
import { addDays, clockWords, localParts } from "@/systems/booking/time";

export const dynamic = "force-dynamic";

// Add a booking by hand. A venue takes the same details as the website's form. A class studio picks one of the coming classes.
export default async function NewBookingPage() {
  const { settings, bookings } = await readData();
  if (settings.mode === "venue") return <BookingForm hours={hoursOf(settings)} slots={toSlots(bookings)} />;
  const today = todayInZone(settings.zone);
  const now = new Date().toISOString();
  const classes = Array.from({ length: 21 }, (_, i) => addDays(today, i))
    .flatMap((d) => occurrencesOn(settings, d))
    .filter((o) => o.startsAt > now)
    .map((o) => ({ key: o.key, spotsLeft: spotsLeft(bookings, o), label: `${new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${o.date}T00:00:00Z`))}, ${clockWords(localParts(o.startsAt, settings.zone).time)} ${o.title}` }))
    .filter((c) => c.spotsLeft > 0);
  return <ClassBookForm classes={classes} />;
}
