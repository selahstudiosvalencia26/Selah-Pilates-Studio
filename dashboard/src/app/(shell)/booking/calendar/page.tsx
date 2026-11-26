import { todayInZone } from "@/kit/time";
import CalendarView from "@/systems/booking/CalendarView";
import { readData } from "@/systems/booking/store";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const { bookings, settings } = await readData();
  const today = todayInZone(settings.zone);
  const month = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : today.slice(0, 7);
  return (
    <>
      <CalendarView month={month} today={today} settings={settings} bookings={bookings.filter((b) => b.deletedAt === null)} />
    </>
  );
}
