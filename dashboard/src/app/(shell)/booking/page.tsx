import Switch from "@/systems/booking/Switch";
import { BOOKING_VIEWS } from "@/systems/booking/views";
import BookingList from "@/systems/booking/BookingList";
import { findOccurrence, spotsLeft } from "@/systems/booking/rules";
import { readData } from "@/systems/booking/store";
import { clockWords, localParts } from "@/systems/booking/time";

export const dynamic = "force-dynamic";

// The list of bookings. A class can be opened from the calendar (?session=...) to see who is in it. After a delete, ?removed=... offers Undo.
export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ removed?: string; session?: string }> }) {
  const { removed, session } = await searchParams;
  const { bookings, settings } = await readData();
  const live = bookings.filter((b) => b.deletedAt === null);
  const o = session ? findOccurrence(settings, session) : null;
  const rows = o ? live.filter((b) => b.sessionKey === o.key) : live;
  const heading = o ? `${o.title}, ${localParts(o.startsAt, settings.zone).date} at ${clockWords(localParts(o.startsAt, settings.zone).time)}: ${o.capacity - spotsLeft(live, o)} of ${o.capacity} slots booked.` : undefined;
  return (
    <>
      <BookingList view={<Switch label="Bookings view" items={BOOKING_VIEWS} />} bookings={rows} zone={settings.zone} now={new Date().toISOString()} rule={{ depositRequired: settings.depositRequired, depositKind: settings.depositKind, depositAmount: settings.depositAmount, depositPercent: settings.depositPercent }} removedId={removed && /^[a-f0-9]{12}$/.test(removed) ? removed : undefined} heading={heading} />
    </>
  );
}
