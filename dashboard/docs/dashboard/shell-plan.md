# Shell plan (version 1)

Written 2026-11-12. The shell is the empty dashboard every client gets before any system. Stack: Next.js and Supabase (decided). Names follow `../rules/naming.md`, rules follow `../rules/rules.md` and `../rules/frontend-rules.md`.

## One sentence

A safe, branded, empty dashboard where the right people sign in, see only what their role allows, and land on a Today screen that systems fill in later.

## Who uses it

| Person | What they do |
|---|---|
| **Owner** | Runs the business. Sees everything. Manages people and settings. |
| **Manager** | Runs the day. Sees everything except settings and deleting. |
| **Staff** | Does the daily jobs. Sees only what their role allows. |
| **You (the builder)** | Sets it up and looks after it. Adds systems, watches health, helps when called. Never sees business data unless the owner allows it (see "Support access"). |

## In version 1 (what must work)

Each item has "done when", so we know it is finished.

### 1. Sign in
- Email and a code. Sign out. Every account needs an email.
- **A password is optional** (decided 2026-11-21). Nobody has to have one, and "no passwords to forget" is still the default: a person who never adds one keeps signing in with a code. A person who wants one adds it on the **Account** screen (their own name at the bottom of the menu) and can then sign in with email and password, or with a code, whichever they choose.
- **Change password** (Account screen, for everyone signed in, not only the owner), done securely:
  - They prove it is them again first: the **current password**, or, if they have none yet, a code emailed to their own address.
  - The new password is typed twice, has at least 12 characters (no forced capitals or symbols; spaces and pasting are allowed), is at most 72 bytes (bcrypt ignores the rest), and is refused if it is a very common password, contains their email, is a plain run like 123456789012, is the same as the current one, or appears in a known data breach (checked without sending the password, see `../rules/security.md`).
  - Wrong tries are limited to 5 every 15 minutes per person and 20 per address. A correct change clears the count.
  - By default **every other device is signed out**. A line goes into the activity log (who, when, never the password) and the person is **emailed** that it changed.
  - A password is never shown in an address, a log, an error or the browser's storage. The fields allow the browser's password helper.
  - The owner's second email code still applies after a password sign-in on a new device.
  - The same Account screen shows **your details** (name, email, role, how you sign in) and **where you are signed in**: each device in plain words ("Safari on iPhone, last active 2 hours ago"), a Sign out button for each other device, and "Sign out all other devices". The server only ever ends the person's OWN sessions, and never the one in use (that is Sign out in the menu).
  - It also lists **recent activity** on the person's own account (sign-ins, a password change, a device signed out, a wrong password tried), in plain words with the time, newest first and at most 6. It holds no password, code, address or token. It reads from the activity log once that exists.
  - Built as a placeholder now (like the sign-in screen): a practice account in memory, refused in production. The real version uses Supabase Auth (`updateUser`, `signOut` for other sessions) and goes in `src/lib`.
- Only invited people can sign in. No open sign-up.
- **Codes:** a code expires after 10 minutes and allows 5 tries. Asking for a new one is limited.
- **Owners get a second email code** (decided 2026-11-12):
  - It is asked on a new device, every 7 days, and before sensitive actions: changing roles, allowing support access, deleting, changing the owner's email.
  - A new-device sign-in sends an alert email to the owner.
  - Honest limit: both codes go to the same inbox, so it is not a true second check. The setup guide tells the owner to turn on two-step sign-in on their own email account too.
  - It is built so an authenticator app can replace it later, without redoing anything.
- Done when: an invited person signs in in under 2 minutes, an uninvited email is refused with a plain message, and an owner on a new device is asked for the second code and gets the alert email. A person can add and change a password, a wrong current password is refused, other devices are signed out, and the "your password changed" email arrives.

### 2. People and roles
- **The first owner is created by you** (the builder) in the client's setup session, using the owner's email. They get an invite and sign in with a code. No one else can create an owner.
- **The owner and managers invite staff:** enter a name and email, choose their roles, send. The person gets an email and signs in with a code.
- **Invites:** each works once and expires after 7 days. The owner can resend or cancel it. The email names the business, shows its logo, and says who invited them.
- **A manager cannot** invite an owner or create a role stronger than their own.
- **If the owner loses access to their email:** there is no instant self-service recovery, because that would be a way in for attackers. You and the owner do a short check together (a call, plus the business details you already hold), then you change the owner's email. It is written to the activity log.
- **The owner makes the roles.** Start from Owner, Manager and Staff (these are the defaults). Then add more ("Cashier", "Barista", "Front desk") by ticking what the role may do in each system.
- **A person can have more than one role.** Their permissions add up. Example: Ana has "Bookings manager" and "Stock staff".
- **The role editor** shows one row for each system with one choice: None, See, Change, Approve or Everything, with a line under it saying what that lets the role do in the system's own words. "Customize" opens the detailed ticks ("See customers", "Add and change customers"). No codes shown. Every action includes "see", and a person sees other systems' data only if they may see that system (rules in `../architecture/system-design.md`, section 6).
- **Safe limits:**
  - The Owner role is locked. It cannot be edited or removed, and there is always at least one owner.
  - Sensitive permissions (delete, money totals, settings, people) are marked and ask for confirmation.
  - Nobody can give a role more than they have themselves. A manager cannot create a role stronger than a manager.
  - Built-in roles can be reset to their defaults.
- **Switching someone off** removes access at once, including open sessions.
- **Changes apply at once** and are written to the activity log.
- Done when: an invite expires after 7 days and works only once, a manager cannot invite an owner, and the owner creates a "Cashier" role with only the sales and payments permissions, gives it to a new person, and that person sees only those things. Switching them off signs them out within a minute. Two roles on one person combine correctly.

### 3. Menu and pages
- The menu is built from the systems switched on, and from the person's permissions.
- Plain names (Bookings, Stock, Payments), never "system".
- **The owner arranges the order** of the systems with up and down buttons (Branding screen, "Menu order"). Today stays first and the owner's own pages stay at the bottom. The phone bar follows the same order.
- Done when: a system with no permission for the person does not appear, and its address shows "not allowed" if typed in.

### 4. Today
- The home screen. Each system adds cards, with a limit.
- Before any system: a first-run checklist ("add your logo", "invite a staff member").
- Done when: it opens in under 2.5 seconds, and is useful with no systems.

### 5. Branding
- Name, accent color and logo, on one Branding screen for the owner (permission `shell.manage`), with a live preview as they change things. Reset button.
- **The owner never has to think about readability.** Whatever colour they pick, text on it is white or near-black, whichever reads better, and the colour is lightened or darkened a little when used as text on the page, separately for light and dark mode (4.5 to 1 contrast).
- **Name:** 1 to 40 letters, no markup. **Logo:** PNG, WebP or JPG only (never SVG), under 1 MB, made square (256 px) on the server, kept in a small public bucket. **Colour:** eight ready-made colours in one tap (each checked for readable text), or any exact colour code from their brand, checked on the server. No browser colour picker.
- **Saved** as `brand_name`, `brand_accent` and `brand_logo_path` in `shell_settings`, and applied on the server in the page's first paint, so nothing flashes. Every change is written to the activity log.
- Built (2026-11-13) without the database: the colour maths, the checks, the screen and the live preview (`src/shell/branding`, at /preview/branding in development). Saving and the logo upload connect when Supabase does.
- **Logo safeguards (2026-11-13):** the real first bytes must be a PNG, WebP or JPG and must match the declared type (a renamed SVG, page or PDF is refused). At least 64 and at most 4096 pixels a side, at most 16 million pixels, under 1 MB. A picture that cannot be opened is refused, and the old logo stays. Every accepted picture is re-drawn onto a clean 256 px square (no hidden location or camera data, nothing extra inside the file), and a wide logo is fitted inside the square, not cropped. The screen does this to help at once (`src/shell/branding/logo.ts`, `logoClient.ts`); the server repeats every check and draws it again, and never trusts the screen.
- Done when: a bad color cannot make a button unreadable, and the page never flashes the wrong color.

### 6. Settings
- One place with two tabs: **Branding** (feature 5) and **Menu** (the order of the menu). Less is more: nothing else is an owner setting in version 1.
- **Not here, on purpose (decided 2026-11-13):** contact details and opening hours are edited in the website system (`content`, its site information), and a booking's hours in `booking`'s own settings, so each fact has one home. **Currency and time zone** are fixed defaults (PHP, Asia/Manila) that you, the builder, set at install if a client differs; an owner has no reason to change them. **The customer word** (Guests, Clients, Members) arrives with the first system that shows customers and needs it.
- The keys `currency`, `time_zone` and `words` stay in the list below, set by the builder.
- Done when: changing a word changes it everywhere it is shown.

### 7. Files
- One safe upload service: private storage, short-lived links, type and size limits, photo shrinking before upload.
- Done when: a 6 MB phone photo uploads and shows, and a person without permission cannot open it.

### 8. Email (decided 2026-11-12)
- **From the client's own domain.** Emails show the business name and use the client's address for replies. In the setup session the client verifies their domain in their own Resend account (a few DNS records).
- **The shell sends:** an invite, a sign-in code, a new-device alert (owners), and an "access switched off" notice. Nothing is sent to you automatically (decided 2026-11-12); clients reach you through the contact link.
- **Systems add their own** (a booking reminder, an order confirmation) by listing them in their description file (`emails`).
- **The Emails tab** (Settings): every email type, grouped by system. For each: what it is, when it is sent, who gets it, on or off, how many sent this month, when it was last sent, and the last failure.
  - Required emails are locked on: the sign-in code, the invite and the new-device alert.
  - Optional emails can be switched off. One switch pauses all optional emails.
  - The owner controls it. You see the same tab through support access. Every change is logged.
- **When a send fails:** try again twice, a few minutes apart. Then record "failed" and tell the owner in plain words ("We couldn't send that email. Check the address."). A sign-in code is never retried silently, because the person is waiting; they get a "send a new code" button.
- **The email log** records who it was for, which type, which system, whether it worked and when. It never stores a code or a message body.
- **Limits:** sign-in codes per person per hour, a daily cap for each type, and the plan's monthly total (shown in the status button).
- **Plain emails only:** no tracking pixels, no marketing.
- Done when: an optional email switched off stops being sent and the change is logged, a required one cannot be switched off, a failed send is retried twice and then shown, and the tab shows the counts.

### 9. Search
- One box to find a person, a booking, an order or an item. Systems say what can be found.
- Done when: it respects roles (no results the person may not see).

### 10. Activity log
- Who did what and when, for sign-ins, people changes, settings, files and money or status changes.
- Done when: the owner can see the last 90 days, and nothing in it can be edited.

### 11. Backup and getting data out (decided 2026-11-12)
- **Weekly**, automatic (decided).
- **What it holds (decided):** the whole database every week, plus a copy of every file added since the last backup (receipts, photos, the logo). Files are not covered by the database's own backups, so this is their only protection.
- **Where it is saved (decided 2026-11-12):** the client's own Google Drive, in a folder called "Dashboard Backups". A cloud storage bucket is the alternative for a client without Google.
- **How many to keep (decided 2026-11-12):** the last **4 weekly + 3 monthly**, so a problem noticed up to about three months late can still be undone. Older copies are removed automatically.
- **Export and import (the owner's idea, kept):** the owner can export all their data at any time (one spreadsheet file for each system) and import records in bulk (for example customers or stock). This is also the right to export under the Data Privacy Act, and what leaves a client free to go.
- **Honest limit:** export and import alone cannot restore a whole dashboard. Files, links between records, roles and history do not come back through a spreadsheet, and a wrong import can damage data. So there are three layers:
  1. **Recycle bin:** nothing is deleted at once. Deleted items stay for 30 days and the owner can restore them. Money records are voided, never deleted.
  2. **Export and import:** for moving data in and out, leaving, and bulk adding.
  3. **Full restore from the weekly backup:** done by you on request, into a copy first, checked, then switched over. Logged. Not a button anyone can press by accident.
- The restore is tested every three months on a copy.
- If a weekly backup fails or is more than 8 days old, the status button turns amber (red after 14 days). No email is sent; the owner sees it on the button.
- Done when: a backup is made and saved, a restore on a copy brings back the data and the files, a deleted item comes back from the recycle bin within 30 days, and an export opens in a spreadsheet.

### 12. Status button
- A small floating chip for the owner, a diagnostic window and a contact link (see "Open, 3" below for the checks and the window).
- Health checks every few hours. No email is sent to you or anyone.
- Done when: unplugging a service turns the chip red within one check, the window names the problem in plain words, the contact link opens your contact page with the topic filled in, and Copy report holds no personal data.

### 13. Trial mode
- For pilots only (a trial is not part of any package). An end date, a "Trial" banner, and read-only access when it ends.
- Done when: a trial copy goes read-only on the end date and shows it clearly.

### 14. Systems list (for you only)
- A page only you can open: which systems are on, their versions, and a health summary.
- Switching a system on adds its menu, permissions and tables (its database changes appear on the Database updates screen to copy into Supabase).
- Done when: adding a system through GitHub and copying its SQL makes it appear for allowed roles, with no other manual steps.

### Install check and the shared toolbox (decided 2026-11-12)

**The shared toolbox (`src/kit/`).** One small set of code that the shell and every system both use, so nothing is written twice or in a different style: one permission check, one way to read and write the database (it applies the business, the recycle bin and the activity log by itself), the shared screen parts (tables, forms, buttons, the popup window, empty states), files, email, words and errors. A system may only talk to the toolbox and its own folder, never reach into the shell's insides.

**A "new system" script** creates the folders, the first SQL file, the description file and the permissions with the right names already in place.

**The install check.** Before a system is switched on, the dashboard reads its description file and checks its structure. It runs in two places:
1. **Before it ships (automatic, in GitHub).** A change that fails the check is refused, so a broken system never reaches a client's dashboard.
2. **When it is switched on (inside the dashboard).** The Systems page runs the same check and shows the result in plain words. A system that fails stays off and says why.

What it checks:
- The description file is complete and in the right format (name, version, pages, permissions, tables, emails, Today cards, `requires_shell`).
- Names follow `../rules/naming.md`: one system word, table names `<system>_<plural>`, permissions `<system>.<action>` with only the five allowed actions.
- It works with this dashboard version (`requires_shell`) and the systems it needs are installed (`needs`). A missing optional one is fine.
- Every table it declares has its SQL file, row-level security on, and the recycle-bin column (money tables excepted).
- Its SQL files are numbered, safe to run twice, and an applied file has not been edited.
- It does not reach into another system's tables or the shell's insides, uses no hard-coded colors, and does not check roles itself.
- Nothing it declares clashes with another system (names, pages, permissions, email types).
- Its tests pass.

Clients never upload code, so this check is about mistakes and consistency, not about stopping a malicious upload. Only you add systems.

### 15. Help
- Short, plain-English help text inside each screen.

## Settings keys (version 1)

One list, so names do not drift. Stored in `shell_settings` as key and value. The business profile is the first group.

| Key | Meaning | Default |
|---|---|---|
| `brand_name` | Business name | none |
| `brand_accent` | Accent color | blue (#2563eb) |
| `brand_logo_path` | Logo file | none |
| `currency` | Currency | PHP |
| `time_zone` | Time zone | Asia/Manila |
| `contact_url` | Where the status window's contact link goes | none |
| `plan_storage_mb` | File storage limit | from the client's plan |
| `plan_emails_month` | Monthly email limit | from the client's plan |
| `trial_ends_at` | Trial end date (pilots only) | none |
| `words` | Words the client renamed (for example "Reservation") | none |

A system may add its own keys, starting with its system word (`booking_buffer_minutes`).

## Not in version 1

- Billing or plans inside the dashboard (you invoice from FreelanceOS).
- Text messages and Messenger replies.
- Upload button for systems.
- More than one branch or location (decide later; see `../product/review.md`).
- More than one language.
- Customer-facing sign-in (guests never sign in).

## Support access (decided 2026-11-12)

By default you cannot see the client's business data. Two layers:

1. **By default (option A):** you see only the status and health, and error logs that hold no personal data. For anything else you use screenshots and a screen-share call where the client does the clicking.
2. **When you must see the data (option B):** the owner presses "Allow support" in Settings. You get in for a set time (for example 24 hours). It ends by itself, the owner can end it sooner, and every action is written to the activity log.

Not used: a permanent support account, and permanent full admin access.

The rule goes into the contract: "Support access only with the owner's permission, and it is logged."

Needs: the table `shell_support_access`, a button in Settings, a "Support is on until..." banner while it is active, and an automatic end.

## Screens (version 1)

| Screen | Who | Notes |
|---|---|---|
| Account | everyone signed in | Your password: add it, or change it. Reached from your name at the bottom of the menu. |
| Sign in | everyone | Email, then code, or email and password for people who added one. Shows the client's logo and name. |
| Today | everyone | Cards from systems, the first-run checklist. |
| Search | everyone | Opens from the top or with `/`. |
| People | owner, manager | Invite, role, switch off. |
| Roles | owner | See and change what each role can do. |
| Settings | owner | Hours, currency, words. |
| Branding | owner | Name, color, logo. |
| Activity | owner | Who did what. |
| Backups | owner | Last backup, download. |
| Status chip and window | owner | Floating chip, bottom-right. Others see nothing. |
| Setup checklist | owner | Supabase, Resend, domain, Google Drive, scheduled jobs. |
| Database updates | owner, you | SQL files to copy, each marked done. |
| Systems (hidden) | you | Versions, health. |

## Data (tables)

All start with `shell_` (see `../rules/naming.md`). All are locked by default; only the server touches them, and every action checks who is asking.

| Table | Holds |
|---|---|
| `shell_users` | People: name, email, role, active or off |
| `shell_sessions` | One row for each signed-in device |
| `shell_rate_limits` | Attempt counts with an expiry, for sign-in, invites and public forms |
| `shell_invites` | Invitations: email, role, expires |
| `shell_roles` | The roles |
| `shell_permissions` | Every permission, declared by systems |
| `shell_role_permissions` | Which role has which permission |
| `shell_settings` | Key and value settings (brand, hours, words, limits, trial end) |
| `shell_systems` | Which systems are on, and their versions |
| `shell_files` | Uploaded files: path, type, size, who, for what |
| `shell_email_types` | Every email type that systems and the shell can send: system, name, required or optional, on or off, daily cap |
| `shell_email_log` | Every email sent, and whether it failed |
| `shell_activity_log` | The audit trail |
| `shell_health_checks` | Results of the health checks |
| `shell_support_access` | Time-limited access you were given |
| `shell_backups` | The record of each backup |

## Folders (sketch)

```
apps/dashboard/
  src/shell/          sign in, people, roles, menu, today, settings, branding, files, status
  src/systems/        bookings, inventory, ... (one folder each, see ../product/systems.md; on main it is empty, each system is on its system/<word> branch)
  src/extensions/     this client's own changes (never overwritten)
  src/lib/            the database layer in one place, so a move stays possible
  supabase/migrations/  numbered SQL files, copied into Supabase by hand in version 1
```

## Security (front line)

The shell is the front door of every client's business, so it follows the full security plan in `../rules/security.md`. That plan is part of "done" for the shell: the checklist at the end of `../rules/security.md` must pass before any client uses it.

## Safety checklist

- Every action is checked on the server for who is asking and what role they have.
- Row-level security is on for every table, with no public access.
- No keys in the browser or in the website.
- Invitations expire. Codes expire and are rate-limited.
- A switched-off person loses access immediately.
- Files are private, with short-lived links.
- The status window shows no secrets, and the copied report holds no personal data.
- Money and status changes are logged.
- A second email code for owners (new device, every 7 days, and sensitive actions), plus a new-device alert email.

## Quality checklist (before any client)

- Roles are tested: each role cannot do what it should not.
- Calculations have tests.
- Keyboard works everywhere. Contrast and touch size checked, and every screen is checked at 360, 768 and 1280 px wide.
- Main screens load in under 2.5 seconds on a mid-range phone, within the speed budgets in `../rules/rules.md` (queries per page, list size, JavaScript size).
- The database and backend best practices in `../rules/rules.md` are followed (constraints, indexes, paging, safe to repeat, background jobs).
- Migrations run on a copy first.

## Build order

1. **Foundation:** the project, the database layer, sign in, the shell frame, branding.
2. **People:** invites, roles, permissions, switching people off, the activity log.
3. **Today and the menu:** the system list, the menu built from permissions, the first-run checklist.
4. **Files and email:** the upload service and the email log.
5. **Status chip:** health checks, the diagnostic window, the contact link.
6. **Safety nets:** backup and restore, trial mode, search.
7. **The new-client script** and the health page.
8. **Test it** with a fake client, then the Dan Cafe pilot.

## Decided

- **Second check for owner sign-in: required, as a second email code** (2026-11-12). See "1. Sign in". Upgrade path: an authenticator app later.
- **Backups (2026-11-12):** weekly, database plus new files, saved to the client's Google Drive, keeping the last 4 weekly and 3 monthly, with a recycle bin, export and import, and a full restore done by you. See "11. Backup".
- **Scheduled jobs and rate limits (2026-11-12):** a free scheduled workflow in the client's GitHub repo calls a secret-protected address in the dashboard (backups, health checks, invite cleanup, trial end, email retries, recycle-bin purge). Attempt counts for sign-in codes, invites and public forms are kept in a small database table, `shell_rate_limits`, with an expiry.
- **Recycle bin (2026-11-12):** deleting sets a `deleted_at` date on the record. It stays 30 days and the owner can restore it, then a daily job removes it for good. Money records are voided, never deleted.
- **Public pages (2026-11-12):** the booking form or calendar, order link and feedback form are built on the client's website, not in the dashboard. The dashboard only offers a small, locked-down public connection for each system (own rate limits, no staff sign-in, only the fields the system allows). The staff session is never shared with the website.
- **Default permissions (2026-11-12):** Owner everything; Manager view, edit and approve; Staff view and edit. Each system's description file can declare its own defaults, and the owner can change them.
- **Sign-in (2026-11-12): Supabase Auth, option A.** Supabase's built-in email code does the code, expiry, limits and sessions. We build only the owner's second code and the device list on top. The rules stay the same (10-minute codes, 5 tries, invite only, no user guessing). Our own `shell_login_codes` table is not needed. `shell_sessions` is kept only if Supabase's session list cannot show devices to the owner.
- **Phone menu (2026-11-12):** a bar along the bottom with the 4 most-used systems, plus a "More" button that opens the rest. On a computer the menu stays on the side.
- **Privacy notice (2026-11-12):** the shell ships a plain template the client can edit, linked from the sign-in page and from the public connection pages. It says what personal information is kept, why, for how long, and who to ask. Not legal advice; the client should have it checked.
- **Install (2026-11-12):** the dashboard can be installed from the browser on both phone and desktop, with the client's logo as the icon, opening in its own window. No offline mode in version 1: without a connection it shows "No connection" and pauses editing. Offline work is added later only if a client needs it.
- **Versions (2026-11-12):** each system declares which dashboard versions it works with (`requires_shell`). If the dashboard is too old, the system will not install and says why. Database changes run in order when a system updates. A small label shows the dashboard version, and a What's new page lists what changed in each update in plain words (dated, newest first, like the FreelanceOS changelog).
- **Business profile (2026-11-12):** one place in Settings holds the business name, logo, address, phone, opening hours, currency (default PHP) and time zone (default Philippines). Every system reads from it. It shows in emails, receipts, the sign-in page, the booking page and website (opening hours), the order-request closed message, prices and all dates and times. Settings keys are listed in one file so names do not drift.
- **Setup flow (2026-11-12):** empty dashboard, then connect services, then install a system, then set that system up.
  1. **Setup checklist** (owner only): Supabase connected, Resend connected, domain verified, Google Drive connected (the owner approves access to one "Dashboard Backups" folder, once), and the weekly alarm clock. Each red item says in plain words what to do.
  2. **Install a system:** its folder is added through GitHub (see the main plan).
  3. **System setup:** a Database updates screen lists the system's numbered SQL files. Each has a Copy button to paste into the Supabase SQL editor. The dashboard then checks the tables exist and marks the step done. Then the system asks its few starting questions (for example the booking hours).
  The dashboard does not run SQL itself in version 1, because that would need a master database key. Auto-apply can come later.
- **Status button (2026-11-12):** checks the database, file storage, email and the last backup. Amber at 80% of any limit or a backup older than 8 days; red on a failure or a backup older than 14 days. No automatic email to you. See "Open, 3".
- **Updates (2026-11-12):** a new version is proposed to each client's copy as an update, and you approve it client by client. See "Open, 4".
- **Light and dark, icons, pointer (2026-11-13):** every person can switch between light and dark (default: follow the device), with a smooth crossfade; systems get both modes from the colour tokens. Icons are Iconoir only, through the toolbox. Everything clickable shows the pointing hand. See `../rules/frontend-rules.md`.
- **Email provider: Resend** (2026-11-12). **Sender:** the client's own domain. **Failures:** retry twice, then a plain message. **Control:** an Emails tab with an on and off switch for each optional email, grouped by system. See "8. Email".
- **Invites and the first admin (2026-11-12):** you create the first owner; invites work once and expire after 7 days; managers cannot invite owners; a lost owner email is recovered by a short check you do together, never by self-service.
- **Roles (2026-11-12):** the owner creates staff accounts, makes custom roles by ticking permissions, and a person can have more than one role (permissions add up).

## Decided later (2026-11-12)

- **Support access:** A and B together (see "Support access" above).
- **Staff without an email:** Option A. Every account needs an email (a free one takes two minutes to make).

## Open

### 1. Where to save backups: decided

The client's Google Drive (see section 11). Options considered: Dropbox or OneDrive, a cloud storage bucket, a second database project, a manual download, an emailed link.

### 2. How many backups to keep: decided

Last 4 weekly + 3 monthly (see section 11).

### 3. The status button's checks (decided 2026-11-12)

Checked every few hours by the scheduled job, and when the owner opens the button.

| Check | Amber | Red |
|---|---|---|
| Database answers | slow answer | no answer |
| File storage works | over 80% of the limit | cannot save a file, or full |
| Email works | over 80% of the monthly total | recent sends are failing |
| Last backup | older than 8 days | older than 14 days, or failed |

The button shows the worst color. Opening it lists each check in plain words. No email is sent to anyone; the color and the contact link are the only signals (decided 2026-11-12).

**Where the button sits (decided 2026-11-12).** A small floating chip in the bottom-right corner of every page, for the owner only: a colored dot and one plain word (Healthy, Near a limit, Needs help). It is the same on every page, so there is nothing to add per page. Clicking it opens the diagnostic window below. It is small, never covers page content, and on a phone it sits above the bottom menu bar. We do not show technical numbers (such as a query count) on it; the word and the color are the message.

**Diagnostic window (decided 2026-11-12, kept minimal).** Clicking the chip opens a small floating window (centered, blur behind, closes with Esc):
- **All good:** one line, "Everything is working", with the dashboard version and a What's new link. Nothing else.
- **A problem:** only the line that has a problem, in plain words (for example "Files are 83% full" or "The last backup was 9 days ago"), with the contact link beside it. Healthy checks are not listed.
- Two small buttons: **Check again** and **Copy report**. The report is a short text the owner can paste into a message to you (the problem, the dashboard version, the date). It holds no personal data, passwords, keys or customer records, and nothing is sent automatically.
- No technical numbers (queries, memory, CPU, speed).
- Only the owner sees the window. Everyone else sees nothing.

**Contact link on every warning (decided 2026-11-12).** Each amber or red line has a small link:
- Near a limit (files, email): **Talk about upgrading**.
- Something failed (database, backup, email sends): **Get help**.
- It opens your contact page on your own website (the portfolio) in a new tab, with the topic in the address (for example `?topic=files-80`) so the page can pre-fill "Files over 80%". Nothing is sent when it is clicked. The owner writes and sends the message themselves. The address holds the topic only, never client data.
- Other ways to reach you can sit on that page (Messenger, email). The link address is one setting, so it can change without touching the code.
- Plain and small, not a banner. Green shows no link.

### 4. Updates: decided (2026-11-12)

Like a phone update, one client at a time:
1. You fix or improve something in your master copy and give it a new version number.
2. Each client's GitHub copy gets an "update ready" proposal (a pull request).
3. You approve it for that client. Nothing changes on a client's dashboard until you do, so a bad update never reaches everyone at once. Try it on your own test copy first.
4. The dashboard updates itself. The client's data is untouched, and any new database changes show on the Database updates screen to copy into Supabase.
5. The What's new page lists the change in plain words. A system whose `requires_shell` no longer fits is paused with a clear message, not broken.

Decide when building: how the proposal is created for each client's copy (for example a small scheduled script in your own repo).

## Later

- A "Sign in with Google" button for staff (an easy extra for Android phones).
- A shared-tablet PIN for busy counters, for simple jobs only (sales, stock).

### Pages inside a system (decided 2026-11-13)
- The side menu is one flat list: one row for each system. It is never nested.
- A system with more than one page (pages marked `nav`) shows them as a tab strip along the top of its screen, on every device, with the current tab underlined. Only the pages the person may open are listed.
