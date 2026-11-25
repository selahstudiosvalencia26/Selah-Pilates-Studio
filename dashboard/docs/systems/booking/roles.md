# booking: roles

Written 2026-11-13. Shared rules are in `../../dashboard/roles-and-permissions.md`.

| Permission | Plain words | Owner | Manager | Staff |
|---|---|---|---|---|
| `booking.view` | See bookings | yes | yes | yes |
| `booking.edit` | Add and change bookings | yes | yes | yes |
| `booking.approve` | Confirm or decline bookings | yes | yes | no |
| `booking.delete` | Delete bookings | yes | no | no |
| `booking.manage` | Change booking settings | yes | no | no |

Levels on the Roles screen: None, See (`view`), Change (+ `edit`), Approve (+ `approve`), Everything.

## What each permission opens

- **view:** the list, the calendar, a booking's page, the "New booking requests" card on Today, search results.
- **edit:** add a booking by hand, change the details, add a note, cancel one that is not confirmed.
- **approve:** confirm or decline a request, and cancel a confirmed one. Asks for confirmation.
- **delete:** move a booking to the recycle bin. Asks for confirmation.
- **manage:** opening hours, closed days, lead time, maximum guests, deposit rule.

## Permissions follow the data

- The deposit part of a booking (amount, "Deposit paid") comes from `payments`. A person without `payments.view` sees the booking but not that part.
- A person without `booking.view` sees no booking names in search, on Today or in emails.
- The public website never sees names, only busy times.

## Tests

Staff cannot confirm. A manager can. Nobody without `booking.view` sees the list. Someone with `booking.view` but not `payments.view` sees no deposit amount.
