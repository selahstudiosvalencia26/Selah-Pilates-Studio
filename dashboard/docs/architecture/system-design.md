# System design

Written 2026-11-12. How each part of the dashboard works inside. The big picture is in `system-architecture.md`. The tables are in `data-model.md`. The steps people take are in `../dashboard/app-flow.md`. This is a design for building from, not code.

## 1. The parts of the shell

| Part | Does | Talks to |
|---|---|---|
| Sign-in | Email code, sessions, owner second code, devices | Supabase Auth, email |
| People and roles | Invites, roles, permissions, switching off | Database, email, activity log |
| System registry | Knows which systems are on and their versions, runs the install check | Description files, database |
| Menu | Builds the menu from the systems on and the person's permissions | Registry, permissions |
| Today | Collects cards from systems, shows the first-run checklist | Registry |
| Settings and branding | Business profile, words, accent color, logo | Database, files |
| Files | Private uploads, short-lived links | Supabase Storage |
| Email | Sends, logs, retries, the Emails tab | Resend, database |
| Search | One box across systems, role-aware | Registry |
| Activity log | Append-only record | Database |
| Backups and export | Weekly backup, export and import, recycle bin | Google Drive, database |
| Status | Health checks, the chip and window | Database, storage, email, backup record |
| Jobs | Secret-protected addresses run on a schedule | All of the above |
| Systems page (builder) | Versions, the install check result, the Database updates screen | Registry |

## 2. The system description file (manifest)

Every system has one small file that describes it. The shell reads it. Nothing else leaks outside the system. This is the version 1 format (freeze it while building `booking`).

```json
{
  "id": "booking",
  "name": "Bookings",
  "version": "0.1.0",
  "requires_shell": ">=1.0.0 <2.0.0",
  "icon": "calendar",
  "needs": ["files"],
  "optional": ["payments", "customers"],
  "pages": [
    { "path": "/booking", "title": "Bookings", "permission": "booking.view" },
    { "path": "/booking/[id]", "title": "Booking", "permission": "booking.view" }
  ],
  "permissions": [
    { "id": "booking.view", "label": "See bookings", "default": ["owner", "manager", "staff"] },
    { "id": "booking.edit", "label": "Add and change bookings", "default": ["owner", "manager", "staff"] },
    { "id": "booking.approve", "label": "Confirm bookings", "default": ["owner", "manager"] },
    { "id": "booking.delete", "label": "Delete bookings", "default": ["owner"] }
  ],
  "tables": ["booking_records", "booking_resources", "booking_hours"],
  "migrations": ["001_create_tables.sql"],
  "labels": { "booking": "Booking" },
  "today": [
    { "id": "new-requests", "title": "New booking requests", "permission": "booking.view" }
  ],
  "emails": [
    { "id": "request-received", "label": "We got your request", "to": "customer", "required": false, "default": true }
  ],
  "public": [
    { "id": "request", "method": "POST", "fields": ["name", "phone", "email", "event_type", "guests", "starts_at", "ends_at", "notes"] },
    { "id": "availability", "method": "GET" }
  ],
  "search": { "table": "booking_records", "fields": ["customer_name", "phone"], "permission": "booking.view" },
  "provides": ["getBooking", "listBookingsForDate"]
}
```

What the keys do is in `../product/modular-dashboard.md`. New in this design: `requires_shell`, `migrations`, `public` and `search`.

### Outside services (every system, decided 2026-11-25)

A system that calls an outside service says so in its description file, so the owner sees it and why on the Systems page. Nothing else is written for this: the page builds itself.

- `services`: it cannot work without them. A system with tables or emails already counts as needing Supabase or Resend.
- `optionalServices`: it works without them (payments works by hand without PayMongo). Never shown as a problem.
- A **new** service is added once to `src/shell/services/services.ts`: its name and settings in `SERVICES`, and in `SERVICE_HELP` why we need it, what happens without it, where to get it and what each setting is, all in plain words. The tests fail if any of that is missing. Add its names to `.env.example`.
- Keys live in `.env.local` or the host's environment variables. The dashboard never asks for them in a form and never shows a value.
- The database files are the numbered files in the system's `migrations` folder (the shell's own are in `supabase/migrations`), so they appear with a Copy SQL button.

## 3. How the shell assembles itself

At start, the registry reads every description file in `src/systems/` and:

1. **Runs the install check** (see section 9). A failing system stays off with a plain reason.
2. **Registers permissions.** The shell gathers every `permissions` entry into one list. Defaults fill the role grid the first time.
3. **Builds the menu** from `pages`, filtered by the person's permissions.
4. **Collects Today cards** from `today`, filtered by permission, limited in number.
5. **Registers emails** into the Emails tab from `emails`.
6. **Registers the public connection** from `public` (its own rate limits).
7. **Registers search** from `search`.
8. **Records the system and version** in `shell_systems`.

Removing a system hides it. Its data stays unless a separate, confirmed step deletes it.

## 4. The shared toolbox (`src/kit`)

The only way shell and systems touch the outside world. Names are a sketch.

| Kit area | Sketch | Promises |
|---|---|---|
| Permissions | `can(person, "booking.edit", thing?)` | Checked on the server. Defaults to no. |
| Database | `db.table("booking_records")` with `select`, `insert`, `update`, `softDelete` | Limits to the business, hides recycle-bin rows, writes the activity log for important changes, uses safe parameterized queries. |
| Input | `parse(schema, input)` | Refuses anything not in the format. Only named fields get through. |
| Screens | table, form, button, popup window, empty state, status dot | Match the dashboard, accessible, responsive. |
| Files | `files.upload(...)`, `files.link(id)` | Type and size limits, renamed, private, short-lived links. |
| Email | `email.send(type, to, data)` | Honors the on and off switch, logs, retries twice, never logs the body or a code. |
| Words | `t("booking")` | The client's own word if renamed. |
| Errors | `fail("plain message", detail)` | A short plain message to the person, detail to the log. |
| Logging | `log.activity(...)`, `log.error(...)` | Append-only, no personal details. |
| Money | `money.add`, `money.format` | Exact amounts and the currency, no floating numbers. |
| Time | `time.toBusinessZone(...)` | UTC stored, the business's time zone shown. |

## 5. Sign-in and sessions

- **Decided (2026-11-12): Supabase Auth.** It does the email code, expiry, limits and sessions. We build only the owner's second code and the device list on top. No `shell_login_codes` table. `shell_sessions` is kept only if Supabase cannot show the owner a device list.
- A code expires in 10 minutes and allows 5 tries. Asking for a new one is limited. The reply is the same whether or not the email exists.
- Only invited people can sign in. No open sign-up.
- Cookies are secure, HttpOnly and same-site. Sessions are short and rotate.
- **Owner second code:** asked on a new device, every 7 days, and before sensitive actions (changing roles, allowing support access, deleting, changing the owner's email). A new device sends an alert email.
- Switching someone off, or changing their role, ends their sessions at once.

## 6. Roles and permissions

- A **permission** is `<system>.<action>` with only `view`, `edit`, `approve`, `delete`, `manage`.
- A **role** is a named group of permissions. Defaults: Owner (everything, locked), Manager (view, edit, approve), Staff (view, edit). The owner can add roles.
- A **person** can have many roles. Permissions add up.
- **Checking:** the kit loads the person's roles, adds up the permissions, and answers yes or no. Then, for a thing (a booking), the database's row-level security checks again.
- **Row-level security pattern:** every table has RLS on with no public policy. Reads and writes go through the server with the signed-in person's identity. A policy allows a row only when the person belongs to the business and holds the needed permission.
- **Limits:** nobody can give a role more than they have. A manager cannot invite an owner or create a role stronger than a manager. There is always at least one owner.

### Rules that keep roles simple (decided 2026-11-13)

The relationship is three plain links and nothing else: a person has roles, a role has permissions, a permission belongs to one system (its name starts with the system's word). The code is `src/shell/people/roles.ts`, with tests.

1. **Every action needs "see".** Every system must declare `<id>.view`, and the install check refuses a system that does not. Ticking any other action also ticks "see". Unticking "see" clears the rest of that system for the role. Nobody can change what they cannot see, and the menu needs it.
2. **One choice per system, with "Customize".** The Roles screen shows one level for each system: None, See, Change, Approve, Everything. The levels are built from the permissions the system declares (see = `view`, change = `view`+`edit`, approve = `view`+`edit`+`approve`, everything = all of them). A level only appears if the system has the action it needs, so a system declares nothing extra. "Customize" opens the detailed ticks for the rare exception, and the choice shows "A mix you picked" when the ticks are not on the ladder.
3. **Permissions follow the data.** A system that shows another system's data (Bookings showing a payment status) checks the other system's permission for that part, and leaves it out when the person lacks it. The same goes for Today cards, search results, emails and files: each is checked against the system that owns it. A link between two systems (`optional: [payments]`) only adds a part to a screen. It never gives access.
4. **Adding, switching off, removing.** A new system gives Owner access at once. Manager and Staff get only the defaults the system declares, once, and the owner sees them on the Roles screen. Switching a system off hides it and keeps the ticks, so switching on restores them. Removing a system deletes its ticks. Each of these goes in the activity log.
5. **The menu order is the owner's.** The owner puts the systems in the order they like (Branding screen, "Menu order"). It is one setting for everyone (`shell_settings.menu_order`). Today stays first and the owner's own pages stay at the bottom. A new system joins at the end.

## 7. The public connection

For a system's `public` entries:

1. Its own address, for example `POST /api/public/booking/request`.
2. Checks: a spam check (hidden field and a limit), the rate limit for that address and caller, then the strict format check.
3. Writes only the allowed fields. Sets the status to `requested`.
4. Returns a short answer. Never returns private data.
5. Never reads the staff session. Staff cookies are not sent to these addresses.

## 8. Files

1. The server checks the person's permission and gives the phone a short-lived upload link.
2. The phone shrinks the photo (about 1600 px wide, WebP) and uploads straight to private storage.
3. The server records the file (path, type, size, who, for what) in `shell_files`. The database stores only the path.
4. Opening a file gives a link that works for a few minutes, after a permission check.
5. Checks: images and PDFs only, type checked by content, size limit, renamed, images re-saved.

## 9. The install check

Runs before a change ships (in GitHub) and on the Systems page.

- The description file is complete and in the right format.
- Names follow `../rules/naming.md`.
- It works with this dashboard version, and the systems it needs are installed.
- Every table it declares has its SQL file, RLS on and the recycle-bin column (money tables excepted).
- SQL files are numbered, safe to run twice, and an applied file was not edited.
- No reaching into another system's tables or the shell's insides, no hand-written colors, no role checks outside the kit.
- Nothing clashes with another system (names, pages, permissions, email types).
- Its tests pass.

## 10. Database updates (version 1)

1. A system ships numbered SQL files.
2. The Database updates screen lists those not yet applied, each with a Copy button.
3. You paste into the Supabase SQL editor and run it.
4. The dashboard checks the tables exist and marks the file applied in `shell_systems` (its applied list).
5. The dashboard never runs SQL itself.

## Install, update, switch off and remove (decided 2026-11-13)

A system moves through four steps. You do them from the Systems page (your page) and the Database updates files it shows. Clients never do any of this.

| Step | What you do | What the dashboard does |
|---|---|---|
| **Install** | Merge the system's branch `system/<word>` into the client's copy (it brings the folder in `src/systems/` and its line in `src/systems/index.ts`), or start a new one with `npm run new-system <word>`, then push to GitHub. | Runs the install check. If it passes, the system appears on the Systems page. You switch it on, copy its SQL files into the Supabase SQL editor (each file has a Copy button), and answer its few starting questions. Its menu, Today cards, permissions and emails appear for the people allowed to see them. |
| **Update** | Improve the master copy and raise the system's `version`. Approve the update on each client's GitHub, one client at a time, after trying it on the practice copy. | Shows the new version. Any new numbered SQL files appear with a Copy button. A system whose `requires_shell` no longer fits the dashboard is paused with a clear message, not broken. What's new lists the change. |
| **Switch off** | Press Switch off on the Systems page. | Hides the system from the menu, Today, search and its public connection. Its data and tables stay exactly as they were. Switching it on again brings everything back. |
| **Remove** | Switch it off first. Deleting its data is a separate step you do on purpose. | Never deletes anything by itself. Removing the folder from the code does not touch the client's data. A confirmed, logged "delete this system's data" step is built later, with a backup first. |

Until the database is connected, the Systems page shows these steps and each system's files, and the Switch off button is greyed out. Switching on and off, and marking database files as done, turn on with the database (`shell_systems`).

## 11. Jobs

Each job is a secret-protected address, called on a schedule by the GitHub workflow. The secret is a long random value held in the host's settings and the repo's secrets.

| Job | When | Does |
|---|---|---|
| `backup` | Weekly | Exports the database and new files to Google Drive, removes old copies (keep 4 weekly + 3 monthly), records it in `shell_backups`. |
| `health` | Every few hours | Runs the status checks, records them in `shell_health_checks`. |
| `purge` | Daily | Removes recycle-bin items older than 30 days, and old rate-limit rows. |
| `invites` | Daily | Expires old invites. |
| `email-retry` | Every few minutes | Retries failed emails (twice). |
| `trial` | Daily | Makes a trial copy read-only on its end date. |

## 12. Email

- From the client's own domain. Required emails (sign-in code, invite, new-device alert) cannot be switched off. Optional ones can.
- Every send is logged (who, which type, which system, worked or not, when). Never the code or the body.
- A failed send retries twice, then shows "failed" to the owner in plain words. A sign-in code is never retried silently.

## 13. Backups, export and the recycle bin

- Weekly: the whole database plus every file added since the last backup, to the client's Google Drive folder "Dashboard Backups".
- Export: one spreadsheet file for each system. Import: bulk add records.
- Recycle bin: deleting sets `deleted_at`. The owner can restore it for 30 days. Money records are voided, never deleted.
- A full restore is done by you, on request, into a copy first, checked, then switched over. It is logged.

## 14. Status

- Checks: database answers, file storage (amber at 80%), email (amber at 80% of the monthly total), last backup (amber after 8 days, red after 14).
- The chip shows the worst color and one word. The window shows only what has a problem, with a contact link to your website, **Check again** and **Copy report**.
- No automatic email to anyone.

## 15. Updates and versions

- The dashboard has a version. Each system has a version and `requires_shell`.
- You improve the master copy and raise the version. Each client's repo gets an update proposal. You approve it for that client, after trying it on the practice copy.
- New SQL shows on the Database updates screen. The What's new page lists the change in plain words.
- A system whose `requires_shell` no longer fits is paused with a clear message, not broken.

## 16. Errors, logs and monitoring

- People see short plain messages. Details go to the log.
- Logs hold no names, phone numbers, card numbers or codes.
- Error tracking without personal details, and an uptime check, are added before the first paid client.

## 17. Performance

- Server components fetch data on the server and pass it to the screen, so there is no loading delay.
- Lists are paged. Selects name their columns. Tables have indexes for what they filter and sort by.
- Today shows a limited number of cards. Cached reads where it is safe.
- Target: main screens under 2.5 seconds on a mid-range phone.

## 18. Accessibility and responsive design

Rules in `../rules/frontend-rules.md`, repeated in each system's README. Phone first, 44 px touch targets, keyboard everywhere, contrast, clear errors, tables become cards on a small screen. Checked at 360, 768 and 1280 px.

## 19. Testing

| Test | What it proves |
|---|---|
| Role tests | Each role cannot do what it should not, including by typing addresses and ids. |
| Other-business test | Another business's data cannot be seen (it must fail). |
| Calculation tests | Money, stock and totals are right. |
| Install check tests | A good system passes; a broken one is refused. |
| Public connection tests | Spam, limits and field checks work. |
| Restore test | A backup restores into a copy, with the files. |
| Switch-off test | A switched-off person loses access within a minute. |
| Screen checks | Keyboard, contrast, touch size, and the three widths. |

Run automatically on every change in GitHub (lint, types, tests, install check, a header scan and a package check).
