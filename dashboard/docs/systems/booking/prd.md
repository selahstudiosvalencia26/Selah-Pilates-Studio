# booking: requirements (PRD)

Written 2026-11-12. For the Dan Cafe pilot: booking the **venue** for an event. Other businesses (tables, appointments, classes) come later through the same system with different switches. Shared rules are in the README's "Rules for this system". The design is in `design.md` and the steps are in `flow.md`.

## Problem

Dan Cafe takes venue bookings by Messenger. Dates get double booked, deposits are lost in chat, and nobody has one place to see what is coming.

## Users

| Person | Need |
|---|---|
| Customer (public, no sign-in) | See which dates are free, send a request in a minute from a phone, know it was received. |
| Staff | See new requests, see the calendar, record changes. |
| Manager and owner | Confirm or decline, see deposits, keep the calendar correct. |

## Goals (version 1)

1. A public booking request form on the website, with free and busy dates.
2. Staff see requests on Today and confirm or decline.
3. A deposit secures the date. The date locks only when the deposit is marked paid.
4. No double booking, enforced by the database.
5. A calendar and a list for staff, on a phone and a desktop.

## Not in version 1

Table reservations, services with prices, party-size rules, waiting list, repeat bookings, syncing with Google Calendar, text reminders, online card payment, customer accounts.

## Requirements

| # | Requirement | Done when |
|---|---|---|
| B1 | Public form: name, phone, email, event type, guests, date, start and end time, notes. | A request from a phone lands as "requested" in under a minute of effort. |
| B2 | Public availability: free and busy dates only. | No customer details are ever visible to the public. |
| B3 | Opening hours and closed days for the venue. | A request outside hours is refused with a plain message. |
| B4 | Staff list and calendar views, with filters by status and date. | Opens in under 2.5 seconds on a phone. |
| B5 | Statuses: requested, confirmed, done, cancelled. | Changes follow the allowed steps only and are logged. |
| B6 | Confirm and decline with a note. | The customer gets an email (optional email, on by default). |
| B7 | Deposit: amount and paid or unpaid. With `payments` on, the deposit is a payment record with a proof photo. | The date locks only when the deposit is marked paid. |
| B8 | No overlapping confirmed bookings on the venue. | Two staff confirming the same slot: the second is refused. |
| B9 | Today card: New booking requests (oldest first). | Shows the count, links to the list. |
| B10 | Reminder email before the event (optional). | Can be switched off in the Emails tab. |
| B11 | Staff can add a booking by hand (phone or walk-in). | Marked `created_via = staff`. |
| B12 | Search by customer name or phone. | Respects permissions. |

## Quality

Phone first, accessible, plain English, the dashboard's style (see the README rules). The public connection is rate limited and spam checked. Times are stored in UTC and shown in Manila time.

## Success (for Dan Cafe)

- A month of real bookings handled through it with no double booking.
- Staff can find a booking in under 10 seconds.
- Dan Cafe says what was hard, and we change the plan before the second client.

## Questions to ask Dan Cafe

1. How long is a typical event, and do they book by the hour or by the whole day?
2. Is the deposit a fixed amount or a percentage? Is it refundable, and until when?
3. How far ahead can customers book, and how soon is too soon (lead time)?
4. Maximum guests? Any days or hours the venue is closed to events?
5. Do they need a quote before the request, or is a standard price enough?
6. Which message should the customer get when a request is confirmed or declined?
