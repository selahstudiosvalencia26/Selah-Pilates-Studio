# App flow

Written 2026-11-12. What people do, step by step, and what the dashboard does in answer. Plain steps and simple drawings. Requirements are in `../product/prd.md`, and the inside is in `../architecture/system-design.md`.

## 1. Screen map

```
Sign in
  |
Today  ------------------------------------------------- (home for everyone)
  |
  +-- Menu (built from the systems on and the person's permissions)
  |     +-- Bookings      /booking, /booking/[id]
  |     +-- Website       /content/...
  |     +-- Payments      /payments, /payments/[id]
  |     +-- (more systems later)
  |
  +-- Search               one box, opens with /
  +-- People               owner, manager: invite, role, switch off
  +-- Roles                owner: what each role can do
  +-- Settings             business profile, words, emails tab
  +-- Branding             name, accent color, logo
  +-- Activity             owner: who did what
  +-- Backups              owner: last backup, export, import, recycle bin
  +-- Setup checklist      owner: connections (first time, then rarely)
  +-- Database updates     owner, builder: SQL files to copy
  +-- Systems              builder only: versions, install check
  +-- What's new           everyone: plain list of changes

Floating status chip (owner only), bottom-right on every page.
On a phone: a menu button in the top line that opens a side sheet with every place.
```

## 2. Flow A: setting up a new client (you and the owner, one session)

```
You + owner in a call
  1. Owner creates their accounts: GitHub, Vercel, Supabase, Resend, Google, domain. Turns on two-step sign-in. Adds you as a team member.
  2. You put the master copy into their repo, deploy it on Vercel.
  3. Owner (or you) puts the keys into the host's secret settings. (Never in a chat or a file.)
  4. Open the dashboard link. Setup checklist:
        Supabase connected   -> green
        Resend connected     -> green
        Domain verified      -> green (a few DNS records)
        Google Drive         -> owner approves access to one "Dashboard Backups" folder
        Scheduled jobs       -> green (the weekly alarm clock is on)
  5. You create the first owner with their email. They get an invite and sign in with a code.
  6. Owner fills the business profile and branding (name, logo, accent, hours).
  7. Install the chosen systems (flow B).
  8. Owner invites staff (flow D).
```

## 3. Flow B: adding a system (builder)

```
  1. Merge the system's branch (system/<word>) into the client's copy. It brings the system's folder and its registry line. Push to GitHub.
  2. Automatic checks run (install check, tests). A failure refuses the change.
  3. Vercel rebuilds (about 2 minutes). The system appears on the Systems page.
  4. Systems page runs the install check again. If it fails, the system stays off and says why.
  5. Database updates screen lists the system's SQL files. Copy each into the Supabase SQL editor, run, and the dashboard marks it done.
  6. System setup asks its few starting questions (for example the booking hours). Default permissions fill in. Sample data can be loaded and cleared with one press.
  7. The system's menu, Today cards, emails and search appear for the people allowed to see them.
```

## 4. Flow C: signing in

```
  Email -> "Send me a code" -> (same message whether or not the email exists)
  Code arrives by email (10 minutes, 5 tries)
  -> valid: signed in, lands on Today
  -> owner on a new device, or 7 days since the last second code: a second code is asked
       and an alert email goes to the owner
  -> wrong code too often: locked for a while, plain message
  Uninvited email: refused with a plain message.
```

## 5. Flow D: inviting staff and giving roles

```
  Owner or manager: People -> Invite -> name + email + roles -> Send
  Staff gets an email naming the business, its logo, and who invited them
  They open the link, sign in with a code, land on Today
  The invite works once and expires in 7 days (resend or cancel any time)
  A manager cannot invite an owner or create a role stronger than a manager
  Switching someone off: access ends at once, including open sessions
  Every change is written to the activity log
```

## 6. Flow E: a day for staff

```
  Open the dashboard (or the installed app) -> Today
  Today shows cards from the systems they may see: "New booking requests (2)"
  Tap a card or the menu -> the system page
  Do the job (see a booking, record a payment, edit a page)
  Anything they may not do is simply not shown. A typed address says "not allowed".
```

## 7. Flow F: a venue booking (Dan Cafe)

```
  Customer                    Website                  Dashboard (booking, payments)
  --------                    -------                  -----------------------------
  Opens the booking page ---> shows free and busy ---> availability (public connection)
                              dates
  Picks date, start and end,
  guests, event type, name,
  phone, email ------------->  sends the request ----> checked (spam, limits, format)
                                                       saved as "requested"
                                                       customer gets "We got your request"
                                                       Today card: "New booking requests"
  Staff (booking.approve):
     reviews -> Confirm (or Decline with a note)
     "Confirmed, waiting for deposit". Customer is told the deposit amount and how to pay.
  Customer pays by GCash or bank and sends the proof (Messenger or the page)
  Staff records the deposit in payments (amount, method, proof photo) and marks it paid
     -> the booking becomes "Confirmed" and the date locks (no double booking)
  A reminder email goes out before the event (optional email)
  After the event: Done. Or Cancelled (a payment is voided, never deleted)
```

Statuses: `requested`, `confirmed`, `done`, `cancelled`. With `payments` on, "confirmed" waits for the deposit. With `payments` off, confirming is enough.

## 8. Flow G: editing the website (content)

```
  Editor: Website -> pick a page or block -> edit text or replace a photo
  Text is cleaned (allow-list). Photos are checked and shrunk.
  Save as draft -> Publish
  The website reads only published content. A change shows after the next refresh of the cache.
  Every publish is written to the activity log.
```

## 9. Flow H: the status chip

```
  Owner sees a dot and a word: Healthy / Near a limit / Needs help
  Click -> small window:
     all good:  "Everything is working", the version, What's new
     a problem: only the line that has a problem, with "Talk about upgrading" or "Get help"
  Get help / Talk about upgrading -> opens the builder's contact page with the topic filled in.
     Nothing is sent. The owner writes the message.
  Check again: runs all checks now.   Copy report: a short text with no personal data.
```

## 10. Flow I: deleting and restoring

```
  Delete -> asks first -> the item gets a deleted date and leaves the lists
  Owner: Backups -> Recycle bin -> Restore (within 30 days)
  After 30 days a daily job removes it for good
  Money records are never deleted. They are marked void or cancelled.
```

## 11. Flow J: backups and getting data out

```
  Every week (automatic): database + new files -> Google Drive "Dashboard Backups"
  Keeps the last 4 weekly and 3 monthly. Records the result.
  If the last backup is older than 8 days: amber. Older than 14: red.
  Owner: Backups -> Export (a spreadsheet for each system) or Import (bulk add records)
  A full restore: owner asks you -> you restore into a copy -> check -> switch over -> logged.
```

## 12. Flow K: updates

```
  You improve the master copy and raise its version
  Each client's repo receives an update proposal
  You try it on the practice copy, then approve it for one client at a time
  If new SQL is needed: it appears on Database updates to copy into Supabase
  What's new shows the change in plain words
  A system that no longer fits the dashboard version is paused with a clear message
```

## 13. Flow L: support access

```
  Default: you see only status and logs without personal data. Screenshots and a call for the rest.
  When you must see data: owner presses "Allow support" in Settings (needs the second code)
     -> you get in for a set time (for example 24 hours), a banner shows "Support is on until..."
     -> every action is logged; the owner can end it sooner; it ends by itself
```

## 14. Flow M: leaving a client

```
  Remove your access from their accounts
  Change any shared keys
  Give them a short guide and a data export
  Confirm in writing
  If they stop paying: updates and support stop after written notice. The dashboard keeps running in their accounts.
```

## 15. Empty, loading and error states (every screen)

| State | What it shows |
|---|---|
| Empty | One plain sentence and one clear next step (for example "No bookings yet. Share your booking link."). |
| Loading | The screen first, then the details. Never a blank page. |
| Error | What went wrong and how to fix it, next to the field. Details only in the log. |
| No connection | "No connection. Editing is paused." Typed work is kept. |
| Not allowed | A plain "You do not have access to this." No hint about what exists. |
