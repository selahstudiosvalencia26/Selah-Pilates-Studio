# Build status: the shell against its plan

Checked 2026-11-13 (updated after the role, menu and branch changes) by reading `shell-plan.md` and the code in `apps/dashboard`. Update this file whenever a feature is finished. Legend: **Done** matches the plan and its "done when". **Partial** some of it is built. **Not started**.

## Verdict

What exists follows the plan. Nothing built contradicts a decision, apart from the five small deviations below. But it is a small part of the shell: the screens and the foundation (frame, menu, branding, install check, rules, tests) are in place, and everything that needs the database is not started, because there is no Supabase project connected yet. None of the 15 version 1 features is fully finished yet.

## The 15 features

| # | Feature | Status | What exists | What is missing |
|---|---|---|---|---|
| 1 | Sign in | Partial | The sign-in screen at /sign-in (email, then code, or email and password, logo and name, plain messages). The Account screen with **Change password** and **Add a password** (current password or emailed code first, 12 character minimum, common and breached passwords refused, tries limited, other devices signed out, log line and email), and the devices the person is signed in on (sign one out, or all others), reached from the person at the bottom of the menu. Placeholder only: it sets no session and refuses to run in production | Supabase Auth, the owner's second code, devices, new-device alert, the real log and email for a password change |
| 2 | People and roles | Partial | The permission rules and their tests (`src/kit/permissions.ts`, `src/shell/people/roles.ts`): roles add up, deny by default, nobody gives more than they have, every action includes "see", one level per system with "Customize". The People screen (invite form, roles, what each person can do) and the Roles screen (Owner locked, new roles, reset), working on sample data | Saving to the database, sending invites, switching people off for real, the second sign-in code, the activity log entries |
| 3 | Menu and pages | Partial | Menu built from the systems on and the person's permissions, with tests. A flat side menu that folds into icons, a menu button and side sheet on a phone, a tab strip for a system's own pages, and the owner's menu order (Branding screen) | A typed address does not yet say "not allowed" (see deviation 4). Nothing else open here |
| 4 | Today | Partial | The first-run checklist and the list of systems | Cards that systems add (the description file declares them; nothing draws them), the card limit |
| 5 | Branding | Partial | The screen with a live preview. Colour maths so text is always readable (tested for 10 colours). Name, colour and logo checks, with logo safeguards (real file type, size limits, re-drawn on a clean square). The colour is applied on the server in the first paint | Saving, the logo upload and resize, the settings keys in the database, the activity log entry |
| 6 | Settings | Partial | Two tabs: Branding and Menu (the owner's menu order). Everything else was cut on purpose (see `shell-plan.md`, section 6) | Saving, the builder's install settings (currency, time zone), the Emails tab |
| 7 | Files | Not started | | Private storage, short-lived links, limits, photo shrinking |
| 8 | Email | Not started | | Resend, the email types and log, retries, the Emails tab |
| 9 | Search | Not started | Systems already declare what can be found | The box and the role-aware results |
| 10 | Activity log | Not started | | The table and the screen |
| 11 | Backup and getting data out | Not started | | Weekly job, Google Drive, recycle bin, export and import |
| 12 | Status chip | Not started | | Health checks, the chip, the window, the contact link |
| 13 | Trial mode | Not started | | End date, banner, read-only |
| 14 | Systems list (builder) | Partial | A Connections list that checks the settings each service needs (Supabase, Resend, scheduled jobs) for the dashboard and every system, by name only, and flags a system whose service is missing. A page that runs the install check on every system, with how to add, update and switch off one, and each system's needs, permissions, tables and database files (Copy button) | Switching a system on or off, versions kept in the database, a health summary, builder-only access |
| 15 | Help | Not started | Plain help lines exist inside the screens built so far | Help for every screen |

## The toolbox and the install check

| Plan item | Status | Notes |
|---|---|---|
| Toolbox: permissions, errors, money, time, one answer shape, icons | Done | `src/kit`. Tested. |
| Toolbox: database, screen parts (tables, forms, buttons, popup, empty states), files, email, words | Not started | Needs the database and the first real screens |
| Install check: format, names, what a system points at, SQL numbering, dashboard version, needs, clashes, icon | Done | `src/shell/systems/installCheck.ts`, 20 tests. A system must also declare `<id>.view`. |
| Install check: SQL file really exists, safe to run twice, security rule on, recycle-bin column; no role checks outside the toolbox; its tests pass | Not started | Needs the files to exist. Colours and boundaries are covered by `tests/architecture.test.ts` |
| Install check runs automatically in GitHub before a change ships | Not started | Only `npm run check` on your computer so far. A separate GitHub check, "Branch rules", is in place (see `../architecture/branching.md`) |
| "New system" script | Done | `npm run new-system <word>`, tried on a throwaway system |
| Database updates screen, Setup checklist | Not started | |
| Rules enforced by tests: structure, colours, light and dark, pointer | Done | `tests/` (these are extra, from the rules we added) |

## Where the code differs from the plan (to fix)

1. **The word "system" is shown to the owner.** The plan says clients see plain names (Bookings, Payments), never "system". The menu group says "Your systems", Today has a "Your systems" heading, and the checklist says "Add your first system". Use plain words instead, for example the group "Your business" and "Add what you need: bookings, payments, your website".
2. **The Systems page is in the owner's menu.** The plan says it is hidden and for you (the builder) only. It must move behind a builder-only permission when sign-in exists.
3. **Today's address is `/preview`.** It should be `/`. The `/preview` pages exist only in development, as a stand-in until sign-in, and are not found in production (checked in the layout).
4. **A typed system address is not permission-checked.** `/booking` shows its placeholder page to anyone who can reach the shell. The plan says it must say "not allowed". Add the check when sign-in lands, with a test.
5. **The phone checks were done at two widths.** The plan asks for 360, 768 and 1280 px. Only a phone width and 1280 were looked at. "More" has not been seen with more than five items.

6. **Several controls are under 44 px high on a phone.** `rules/frontend-rules.md` asks for touch targets of at least 44 by 44 px. These are 32 to 40 px: the level buttons and the "Customize" link on Roles, the drag handle in Menu order, the invite form buttons, and some buttons on People and Branding. Raise them to 44 px, or give them an invisible 44 px hit area.
7. **Saved in the wrong place for now.** Roles and people changes live only on the screen, and the menu order is kept in a cookie in this browser. The plan keeps both in the database (`shell_settings.menu_order`, the roles tables). Move them when the database is connected.
8. **Today still says "Your systems" and "Add your first system"** (same as deviation 1). The word is in `src/shell/today/Today.tsx`.

## Beyond the plan (decided since, now written into it)

Light and dark mode with a smooth switch, the status colours for systems, Iconoir icons through the toolbox, the pointer cursor, the speed budgets and best-practice rules, the one answer shape, the structure tests, and the collapsible side menu. These are in `../rules/frontend-rules.md`, `../rules/rules.md` and `shell-plan.md`.

## Checks right now

Typecheck, lint and 130 tests pass on `main` (the dashboard's tests use sample systems, not the real ones, so they pass with none installed) and on `system/booking`. A production build sends 103 to 112 KB of JavaScript per page against a 150 KB budget. No Lighthouse run yet.

## What decides the order from here

Everything not started needs the Supabase project except the pure screens. The plan's build order stays: (1) foundation, finish with sign-in and the database layer, (2) people and roles, (3) Today and the menu, (4) files and email, (5) status chip, (6) backups, trial, search, (7) the new-client script, (8) test, then Dan Cafe.

## Added 2026-11-13: roles and menu order

Roles now work as one choice per system with "Customize" (see `../architecture/system-design.md`, section 6). Every action implies "see", and the install check requires each system to declare `<id>.view`. The owner can arrange the menu order (Branding screen). The saving still uses a cookie in development. It becomes `shell_settings.menu_order` and the roles tables once the database is connected. Not built yet: "permissions follow the data" has no screen to check until a system shows another's data, so add a test when Bookings shows payment status.
