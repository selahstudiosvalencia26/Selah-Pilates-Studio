# booking: flows

Written 2026-11-12. Step by step for the venue mode. See `prd.md` and `design.md`. The general flows are in `../../dashboard/app-flow.md`.

## 1. Customer asks for a date

```
Customer opens the booking page on the website
  -> sees a calendar with busy dates marked
  -> picks a date and start and end time
  -> fills: name, phone, email, event type, guests, notes
  -> Send request
Website sends it to the dashboard's public connection
  -> checked (spam, limits, format, opening hours, lead time, guests)
  -> saved as "requested"
  -> customer sees: "We got your request. We will reply soon." and gets an email
  -> Today shows "New booking requests"
Refused? A plain message says why (for example "We are closed that day").
```

## 2. Staff handle a request

```
Staff open Today -> New booking requests -> the booking
  Detail shows the request and the venue's calendar around that time
  Staff with approve permission:
    Confirm  -> (with payments on) "Confirmed, waiting for deposit". Customer is emailed the deposit amount and how to pay.
    Decline  -> add a short note -> status cancelled -> customer is emailed
  Staff without approve permission can add notes but not confirm.
```

## 3. The deposit secures the date

```
Customer pays by GCash or bank and sends the proof (Messenger or a reply)
Staff: booking -> Record deposit -> amount, method, proof photo -> Save
  -> a payment is created in payments, linked to this booking
  -> the booking becomes Confirmed and the slot locks
If the slot was taken meanwhile, the save is refused and staff are told in plain words.
```

## 4. Adding a booking by hand

```
Staff: Bookings -> Add booking -> same fields as the form
  -> marked as created by staff -> goes through the same steps
```

## 5. Changing or cancelling

```
Change time or guests: Detail -> Edit -> Save (the overlap rule is checked again)
Cancel: Detail -> Cancel -> asks first -> status cancelled
  a deposit is voided or kept, by a staff choice, never deleted
Delete (owner only): goes to the recycle bin for 30 days
```

## 6. Before and after the event

```
Reminder email goes out before the event (can be switched off in the Emails tab)
After the event: staff mark it Done
```

## 7. Setting up (once)

```
Install check passes -> copy 001_create_tables.sql into Supabase -> done
Setup questions: the venue name, opening hours, closed days, lead time, maximum guests, deposit rule
Optional sample data (one press to clear)
```

## Edge cases

| Case | What happens |
|---|---|
| Two staff confirm the same slot | The second is refused with a plain message. |
| Customer sends the form twice | The second is recognized (same phone and time) and not duplicated. |
| `payments` is switched off | Confirming locks the slot at once. |
| Bad connection on the website | The form keeps what was typed and says "No connection. Try again." |
| A very old request | Stays in the list until staff decline it. |
