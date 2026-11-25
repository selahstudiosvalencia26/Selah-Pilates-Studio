import { notFound } from "next/navigation";
import BookingForm from "@/systems/booking/BookingForm";
import { canMove, hoursOf, toSlots } from "@/systems/booking/rules";
import { readData } from "@/systems/booking/store";
import { localParts } from "@/systems/booking/time";

export const dynamic = "force-dynamic";

export default async function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bookings, settings } = await readData();
  const b = bookings.find((x) => x.id === id && x.deletedAt === null && x.sessionKey === null);
  if (!b || !canMove(b.status, "edit")) notFound();
  const from = localParts(b.startsAt, settings.zone);
  const to = localParts(b.endsAt, settings.zone);
  return <BookingForm edit={{ id: b.id, status: b.status }} hours={hoursOf(settings)} slots={toSlots(bookings)} initial={{ customerName: b.customerName, phone: b.phone, email: b.email, eventType: b.eventType, guests: b.guests, date: from.date, ...(to.date === from.date ? {} : { endDate: to.date }), start: from.time, end: to.time, notes: b.notes }} />;
}
