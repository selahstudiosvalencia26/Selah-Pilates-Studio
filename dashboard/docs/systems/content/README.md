# content

The client edits their website's words, menu or services, photos and blog.

- **Status:** Necessary (build first). Full feature list below, from `../../product/features.md`.
- **Used by:** all industries with a website
- **Depends on:** files (shell)
- **Suggested tables:** `content_blocks`, `content_posts`, `content_photos`, `content_items` (suggested; see `../../rules/naming.md`)
- **Permissions:** `content.view`, `content.edit`, `content.approve`, `content.delete`. `content.approve` publishes.

## Features

- **Basics:** text blocks (hours, address, about, announcement); items list (menu or services with prices and photos); photo gallery; draft, preview, publish; undo.
- **Switches:** blog posts; more than one language.
- **Words:** Menu, Services, Products, Packages.
- **Not in version 1:** changing layout or design.

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

**Watch for in this system:** Text written by people is cleaned with an allow-list before it is shown. Uploaded images are checked and re-saved. The website reads only published content. No scripts, no raw HTML from editors.

## More documents

- `prd.md`: requirements and success for the Dan Cafe pilot.
- `design.md`: how it works inside.
- `flow.md`: the steps people take.
