import { bookingSchema, type Booking } from "./schema";

// One booking, as the app knows it and as a database row (migrations/001 to 003).
const iso = (v: unknown) => new Date(String(v)).toISOString();

export function toRow(b: Booking) {
  return {
    id: b.id,
    customer_name: b.customerName,
    phone: b.phone,
    email: b.email,
    event_type: b.eventType,
    guests: b.guests,
    starts_at: b.startsAt,
    ends_at: b.endsAt,
    session_key: b.sessionKey,
    status: b.status,
    deposit: b.deposit,
    deposit_amount: b.depositAmount,
    deposit_method: b.depositMethod,
    deposit_paid_on: b.depositPaidOn,
    notes: b.notes,
    staff_note: b.staffNote,
    created_via: b.createdVia,
    history: b.history,
    created_at: b.createdAt,
    deleted_at: b.deletedAt,
    price: b.price ?? null,
    package_name: b.packageName ?? null,
    pay_by: b.payBy ?? null,
  };
}

export function fromRow(r: Record<string, unknown>): Booking {
  return bookingSchema.parse({
    id: r.id,
    customerName: r.customer_name,
    phone: r.phone,
    email: r.email,
    eventType: r.event_type,
    guests: r.guests,
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    sessionKey: r.session_key,
    status: r.status,
    deposit: r.deposit,
    depositAmount: Number(r.deposit_amount),
    depositMethod: r.deposit_method,
    depositPaidOn: r.deposit_paid_on,
    notes: r.notes,
    staffNote: r.staff_note,
    createdVia: r.created_via,
    history: r.history,
    createdAt: iso(r.created_at),
    deletedAt: r.deleted_at === null ? null : iso(r.deleted_at),
    ...(r.price === null ? {} : { price: Number(r.price) }),
    ...(r.package_name === null ? {} : { packageName: r.package_name }),
    ...(r.pay_by === null ? {} : { payBy: iso(r.pay_by) }),
  });
}
