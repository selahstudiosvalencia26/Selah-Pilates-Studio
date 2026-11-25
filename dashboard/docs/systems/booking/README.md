# booking

A held time, table, room or resource: appointments, reservations, classes, stays.

- **Status:** Built 2026-11-23 on `system/booking`, saving to local files until the database is connected. Two modes in one system: **venue** (Dan Cafe: pick a date and time, staff confirm, a deposit holds the date) and **classes** (Selah: a weekly timetable, book a spot, confirmed at once). Full feature list below, from `../../product/features.md`.
- **Used by:** food, fitness, beauty, health, resorts
- **Depends on:** customers (optional), payments (optional)
- **Suggested tables:** `booking_records`, `booking_resources`, `booking_services`, `booking_hours` (suggested; see `../../rules/naming.md`)
- **Permissions:** `booking.view`, `booking.edit`, `booking.approve`, `booking.delete`

## Features

- **Basics:** two modes, time slots and date ranges; resources (a person, table, room, court); services with length and price; opening hours, buffer, capacity, how far ahead; statuses (pending, confirmed, done, cancelled, no-show); calendar and list views; email reminders; notes.
- **Switches:** public booking page; deposit through `payments`; party size; waiting list; repeat bookings.
- **Words:** Reservation, Appointment, Class, Stay, Session.
- **Not in version 1:** syncing with Google Calendar, text reminders.

## One system, two modes (2026-11-23)

A setting (Bookings, Settings, "What do people book?") picks the mode. The staff list, calendar, rules, settings and the public doors are the same for both.

| | Venue (Dan Cafe) | Classes (Selah) |
|---|---|---|
| Customer sees | A month, then open times for the day, then their details | A strip of days, then that day's classes with teacher, room, spots left, Book |
| After sending | A request. Staff confirm, a deposit holds the date | Confirmed at once, until the class is full |
| Time rules | Opening hours, days of notice, most guests, closed dates | Weekly timetable, spots in each class, closed dates |
| Overlap rule | Two confirmed bookings cannot overlap | Spots left, never below zero |

A new industry (gym, salon, rooms) fits one of these two. A third mode is added only when neither fits. The customer screens are in `VenuePicker.tsx` and `ClassPicker.tsx` (also the "Customer view" tab). A client's website builds its own in its own style from the same public doors.

Not yet: emails to the customer, the Today card, linking the deposit to `payments`, search in the shell, and the database (`store.ts` is the only file that changes). The deposit is recorded inside the booking until `payments` exists.

## Pilot: Dan Cafe (2026-11-12)

Dan Cafe takes bookings for its **venue** (renting the place for an event), not for tables. So the pilot uses the date and time range mode with one resource (the venue). Decisions so far:
- **How a date is secured (2026-11-12):** the customer sends a request, Dan Cafe confirms, the customer pays a deposit by GCash or bank, and Dan Cafe marks it paid so the date locks. The deposit is recorded in `payments` (optional: booking still works when `payments` is off).

## Install and setup

Follows `../README.md` ("How every system installs and sets up").

- **Dashboard versions it works with (`requires_shell`):** to write when built.
- **SQL files:** `001_create_tables.sql` for the suggested tables above, then one numbered file per later change.
- **Starting questions:** to write (kept to a few).
- **Default permissions:** Owner everything, Manager view, edit and approve, Staff view and edit (change here if this system needs different).
- **Public connection:** to write if this system has a public page, otherwise none.
- **Emails it adds:** to write (they show in the Emails tab, optional ones can be switched off).
- **Sample data:** to write (cleared with one press).

## Rules for this system

Every system follows the shared rules. Read them before building. Short version:

**Less is more** (`../../rules/frontend-rules.md`)
- Few screens, few options, few words. If a feature is not needed on day one, leave it out.
- One main action on each screen. No settings nobody asked for.
- Plain English labels. The client's own words come from the words setting.

**Matches the dashboard** (`../../rules/frontend-rules.md`)
- Use only the shared toolbox (`src/kit/`): its tables, forms, buttons, popup window and empty states.
- Colors come from the dashboard's variables (the client's accent). Never write a color by hand.
- Light and dark mode come free: use only the colour tokens, and never write `dark:` or your own dark styles. Use the success, warning and danger tokens for states, with a word or icon as well.
- Icons: Iconoir only, through the toolbox (`Icon`, names listed in `src/kit/iconNames.ts`). No other icon set, no hand-drawn SVG.
- Everything clickable is a real link or button, so it shows the pointing hand and works with the keyboard. Never a clickable `<div>`.
- Same spacing, same type, same icons as the shell. A system should look like part of the dashboard, not a guest.

**Accessible** (`../../rules/frontend-rules.md`)
- Everything works with the keyboard alone, in a sensible order, with a clearly visible focus.
- Every button, field and icon has a plain-text label. Icons never carry meaning alone.
- Color is never the only signal (status also has a word or icon). Text contrast meets WCAG AA.
- Errors say what went wrong and how to fix it, next to the field, and are announced to screen readers.
- Popup windows trap focus, close with Esc, and return focus to where the person was.
- Motion respects "reduce motion". Nothing flashes or moves on its own.
- Text can be enlarged to 200% without breaking the screen.

**Responsive** (`../../rules/frontend-rules.md`)
- Designed for the phone first, then widened for tablet and desktop. No sideways scrolling at any width.
- Touch targets are at least 44 px, with space between them. The main action is within thumb reach.
- Tables turn into stacked cards on a small screen, keeping the key facts visible.
- Forms are one column on a phone, with the right keyboard for each field (number, phone, email, date).
- Works on a slow connection: the screen loads first, then the details, and a lost connection never loses typed work.
- Checked at 360 px (small phone), 768 px (tablet) and 1280 px (desktop) before it is called done.

**Backend and database** (`../../rules/rules.md`)
- Thin routes: check who, check the input, call a service, return one answer shape (`ok` and data, or a plain message). Business rules live in the service, queries in the toolbox.
- Let the database enforce the rules: not null, check, unique, foreign keys, and an exclusion rule where things must not overlap.
- Index every link column and what lists filter and sort by. Page lists (at most 100 rows, by "after this row" when long), ask only for the columns needed, and never run a query inside a loop. About five queries or fewer to open a page.
- A change names the state it expects (from confirmed to done) so two people cannot overwrite each other. Multi-step writes use one short transaction.
- Safe to repeat: a retry or a double press changes nothing twice. Public connections are versioned, limited and take an idempotency key.
- Slow work (email, reports, imports) runs as a background job. Outside calls have a time limit and a fallback.

**Front-end speed** (`../../rules/frontend-rules.md`)
- Server components by default, with small client parts only where needed. Fetch in parallel, show the page first and the slow parts after.
- Reserve space so nothing jumps. Load heavy parts (charts, editors) only when opened. Animate only transform and opacity.
- Budgets: content in under 2.5 seconds on a slow phone, a button responds in under 200 ms, about 150 KB of JavaScript or less for a page. Check it on a slow-phone profile before it goes to a client.

**Safe by default** (`../../rules/security.md`, `../../rules/rules.md`)
- Every action checks the person and their role on the server. Hiding a button is not enough.
- Row-level security on every table. Closed by default.
- Every input is checked against a strict format. Queries are parameterized.
- Only named fields can be changed. Nobody can slip in extra ones.
- Files are private with short-lived links. No secrets in the browser, the code or the logs.
- Delete uses the recycle bin. Money is voided, never deleted.
- Important actions go to the activity log. Logs hold no personal details.
- Public connections have their own rate limits and never share the staff sign-in.

**Done means** (`../../dashboard/shell-plan.md`, install check)
- It passes the install check, its roles are tested (each role cannot do what it should not), and its calculations have tests.

**Watch for in this system:** Its public connection is the most exposed part: rate limit it, check for spam, accept only the fields the system allows, and never show another customer's details. Double booking is blocked by the database, not only the screen. Times are stored in UTC and shown in the business's time zone.

## More documents

- `prd.md`: requirements and success for the Dan Cafe pilot.
- `design.md`: how it works inside.
- `flow.md`: the steps people take.
