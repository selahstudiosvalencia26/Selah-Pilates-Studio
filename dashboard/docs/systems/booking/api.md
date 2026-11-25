# booking: API

Written 2026-11-13. The doors this system opens. Shared rules are in `../../architecture/api.md`. Names here are the plan; the build may adjust them, and the install check lists the final ones.

## Public connection (a stranger on the website)

Addresses are under `/api/booking/` (a system may own only `src/app/api/<id>/`, see `../../architecture/branching.md`). Times are the business's own clock (date and "18:00"), turned into UTC on the server. A website may call them from a browser only if its address is in `BOOKING_ALLOWED_ORIGINS`. Not served on a live site until the database is connected.

| Address | Does | Accepts | Returns |
|---|---|---|---|
| `GET /api/booking/availability?month=YYYY-MM` (venue), `?date=YYYY-MM-DD` (venue times), `?from=YYYY-MM-DD&days=14` (classes) | Lists busy time ranges for a month | the month only | A list of `{ start, end }`. No names or details. |
| `POST /api/booking/request` (venue: customerName, phone, email, eventType, guests, date, start, end, notes; classes: sessionKey, customerName, phone, email, spots, notes) | Sends a booking request | name, phone, email, event type, guests, start, end, notes | A short thank-you. Creates a `requested` record. Never confirms. |

Checks on the request, in order: hidden spam field, rate limit by caller and by phone, strict format, opening hours, lead time, maximum guests. Anything else in the body is refused.

## Staff actions (signed in)

| Action | Needs | Does |
|---|---|---|
| `saveBooking` | `booking.edit` | Add or change a booking |
| `confirmBooking` / `declineBooking` | `booking.approve` | Move a request on. With `payments` on, confirm waits for the deposit. |
| `cancelBooking` | `booking.edit` (not confirmed) or `booking.approve` (confirmed) | Cancel |
| `finishBooking` | `booking.edit` | Mark done |
| `deleteBooking` / `restoreBooking` | `booking.delete` | Recycle bin and back |
| `saveBookingSettings` | `booking.manage` | Hours, closed days, lead time, guests, deposit rule |

Illegal status jumps are refused, and the database refuses two confirmed bookings on the same resource and overlapping time.

## Offered to other systems

`getBooking(id)`, `listBookingsForDate(date)`. Read-only, and checked against `booking.view` for the caller.

## Used from other systems

`getDepositStatus(subject)` from `payments` (optional). If the caller may not see payments, the deposit part is left out.

## Emails it sends

`booking.request-received`, `booking.confirmed`, `booking.declined`, `booking.reminder`. Each is optional and can be switched off in settings.
