# booking: design

Written 2026-11-12. How `booking` works inside, for the venue mode. Requirements are in `prd.md`. Shared design is in `../../architecture/system-design.md` and tables in `../../architecture/data-model.md`.

## Modes (2026-11-23)

`settings.mode` is `venue` or `classes`. In classes mode the weekly `timetable` makes the classes of any date; a booking stores `sessionKey` (`<class id>@<date>`) and counts its `guests` as spots. Class bookings never take part in the overlap rule. See the README table.

## Mode (venue, the original plan)

The system has two modes in the README (time slots, date ranges). The pilot uses **time range on one resource** (the venue): a booking has a start and an end, and a resource can hold only one confirmed booking at a time.

## Description file (key parts)

- `id`: `booking`. `needs`: `files` is not needed. `optional`: `payments`, `customers`.
- Permissions: `booking.view`, `booking.edit`, `booking.approve`, `booking.delete`. Defaults: Owner all; Manager view, edit, approve; Staff view, edit.
- Pages: `/booking` (list and calendar), `/booking/[id]`, `/booking/settings` (hours, venue, deposit rule).
- Today: **New booking requests**.
- Emails: `booking.request-received` (to customer, optional, on), `booking.confirmed` (optional, on), `booking.declined` (optional, on), `booking.reminder` (optional, on).
- Public: `POST /api/public/booking/request`, `GET /api/public/booking/availability`.
- Search: customer name and phone.
- Provides: `getBooking`, `listBookingsForDate`.

## Tables

`booking_resources`, `booking_hours`, `booking_records` (columns in `../../architecture/data-model.md`). The SQL file `001_create_tables.sql` creates them with RLS on, the recycle-bin column, and the indexes.

**No double booking:** an exclusion rule on `booking_records` that refuses two rows with `status = 'confirmed'`, the same `resource_id` and overlapping `(starts_at, ends_at)`. The screen shows a friendly message; the database is what really guarantees it.

## Status steps

```
requested --confirm--> confirmed --finish--> done
    |                       |
    +--decline--> cancelled +--cancel--> cancelled
```

- Only `booking.approve` can confirm or decline.
- With `payments` on: confirm sets `deposit_status = 'waiting'`. When a paid deposit is recorded, the booking becomes `confirmed` and the slot locks. (Until then it is held as `requested` with a note, so it does not block the date.)
- With `payments` off: confirm locks the slot at once.
- Every change is written to the activity log.

Decision for Dan Cafe, to confirm: should a request that is "confirmed, waiting for deposit" hold the date for a few days? If yes, add a hold time (for example 3 days) after which it returns to open.

## Public connection

- `availability` returns only a list of busy time ranges for a requested month. No names, no details.
- `request` accepts only: name, phone, email, event type, guests, start, end, notes. It checks the format, the opening hours, the lead time and the maximum guests, runs the spam check, and applies the rate limit by caller and by phone. It creates a `requested` record and returns a short thank-you. It does not confirm anything.
- It never reads the staff session and never returns private data.

## Money

The deposit amount is stored as `numeric` with the currency. With `payments` on, the record in `payments_records` has `subject_type = 'booking'` and `subject_id`. The booking only stores a status; it never reads `payments` tables, it asks `payments` through its named function.

## Time

Stored in UTC, shown in Manila time. The form's times are read in the business's time zone.

## Screens

| Screen | Shows |
|---|---|
| List | Upcoming first, filter by status and date, search. Cards on a phone, a table on a desktop. |
| Calendar | Month and day view, busy blocks, requested shown differently from confirmed (with a word, not color alone). |
| Detail | The request, the history, the deposit, buttons for the steps the person may take. |
| Settings | Opening hours, closed days, lead time, maximum guests, deposit rule. |

## Tests

- Roles: staff cannot confirm; manager can; nobody without `booking.view` sees the list.
- Overlap: two confirmations of the same slot, the second is refused.
- Public: bad fields refused, rate limit works, availability leaks nothing, a request outside hours is refused.
- Status steps: illegal jumps are refused (for example done to requested).
- Time: a booking made at 11 PM Manila time is stored and shown correctly.
- Deposit: with `payments` on the date locks only after a paid deposit; with it off it locks on confirm.
