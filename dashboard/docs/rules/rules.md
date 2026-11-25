# Engineering rules

Our own rules for speed, safety and tidiness. Written 2026-11-11. Naming rules are in `naming.md`.

## Database speed

1. **Index every link column.** Postgres does not do this for you. If a table has `receipt_id` or `customer_id`, index it.
2. **Index what lists filter and sort by.** A list that filters by `status` and sorts by newest gets one index on both: `(status, created_at desc)`. Put the "equals" column first, then the sort column.
3. **Name indexes `<table>_<columns>_idx`**, for example `payments_receipts_status_created_at_idx`.
4. **Don't index everything.** Each index slows writes. Add one when a list is slow, or when the table will pass about 1,000 rows.
5. **Always paginate.** A list loads 50 or 100 rows, never all of them. For very big tables, page by "after this row" and not by page number.
6. **Ask only for the columns you need.** No `select *` for lists.
7. **No one-query-per-row.** Load related rows together in one query (a join, or one `in` query), never inside a loop.
8. **Searching by name needs the right index.** A normal index doesn't help "contains" searches. Use a text-search or trigram index for search boxes.
9. **Use unique rules for things that must not repeat**, like a receipt reference number. This also stops a double-pressed button from saving twice.
10. **Use the right types:** `uuid` for ids, `numeric` for money, `timestamptz` for times, `text` plus a check rule for status.
11. **Add the row-level security rule's column to an index.** A rule that checks the owner's id on every row is slow without one.
12. **Heavy reports use a summary.** Don't add up thousands of rows on every page open. Keep a summary table, or refresh a stored view on a schedule.
13. **Don't count the whole table on every page load.** Show a cached number, or keep a counter.
14. **Multi-step writes use a transaction.** A payment and its receipt are saved together, or not at all.
15. **Serverless apps use the database's connection pooler.** Without it, many visitors can run out of connections.

## Database: design (added 2026-11-13)

For the shell and every system. These go with the speed rules above.

1. **Let the database enforce the rules, not only the app.** Use `not null`, `check`, `unique` and foreign keys. If two things must never overlap (two confirmed bookings of the same venue at the same time), use an exclusion rule. A bug in the app then cannot save wrong data.
2. **Choose what happens on delete, on purpose.** Money and history use `on delete restrict`. Only true children (a booking's notes) use `on delete cascade`. Never leave it to the default by accident.
3. **Status columns are `text` with a `check` rule**, not a database enum type. Adding a status later is then one small change.
4. **Soft delete uses a partial index.** Because everyone filters `deleted_at is null`, index with `where deleted_at is null`, so lists stay fast as the recycle bin grows.
5. **Standard columns.** `id`, `created_at`, `updated_at` (kept current by a trigger, not by the app), and `deleted_at` where it applies.
6. **Row-level security stays fast.** Use `(select auth.uid())`, not `auth.uid()`, inside a policy, so it runs once, not once per row. Index every column a policy checks.
7. **Keep JSON for flexible blobs only.** Anything a list filters or sorts by is a real column. A column that holds a list of ids is a join table.
8. **Don't store files in the database.** Store the path. Files live in storage.
9. **Check slow queries with `explain`.** Any query that may touch more than 1,000 rows is checked once. Look for a full table scan where an index should be used.
10. **Budget the queries.** A page opens with about five queries or fewer, run together. More than that is a reason to join, to summarize, or to split the page.
11. **Keep transactions short.** Do the thinking first, then open the transaction, write, and close it. Never wait on an outside service inside one.
12. **Long lists page by "after this row" (keyset),** not by `offset`. `offset` gets slower the further you go.
13. **Set a statement time limit** so one bad query cannot hold the whole database.
14. **Clean up on a schedule.** Old rate-limit rows, expired invites and the recycle bin are removed by the daily job. A table that only grows needs a plan for its size.

### Changing the database safely

- **Add first, remove later.** To change something: add the new column (nullable), fill it in small batches, switch the app to it, and only then add the constraint or drop the old one, in separate numbered files.
- **A change that locks a big table is split up.** On a table with many rows, create the index in its own step, and never rewrite every row in one go.
- **Every migration is safe to run twice** (`if not exists`, `drop ... if exists`) and is tried on a copy first.
- **A table has one owner.** Only its own system reads or writes it. Other systems ask through a named function.

## Migrations (changes to the database)

- Numbered and in order, one change per file: `0007_payments_add_receipts.sql`.
- Never edit a migration that has already run. Add a new one.
- Each system owns its own migrations. Removing a system never deletes a client's data without a separate, confirmed step.
- Run on a copy first, and take a backup before a migration on a live client.

## App speed

- Load data on the server, then send the page. Don't make the browser fetch everything after it opens.
- A system the client did not buy adds nothing to their app. Load each system's code only when it is opened.
- Resize and compress images before upload. Limit file size and type.
- Cache things that rarely change (menus, settings). Clear the cache when they change.

## Safety

- Every action checks the signed-in user and their role **on the server**. The browser is never trusted.
- Check every input with a strict format before it touches the database.
- No secret keys in the browser or in the public website.
- Write money and status changes to the activity log: who, what, when.
- Row-level security is on for every table, with no public access by default.

## Backend

- **Keep it thin.** A route or action only checks who is asking, checks the input, calls a service, and returns. The real work lives in services, one folder per system.
- **Check input at the door** with a strict format (a schema). Anything else is refused with a plain message.
- **One answer shape.** Every action returns either success with data, or failure with a short message. No surprises.
- **Safe to repeat.** An action done twice (a double press, a retry) has the same result as once. Use unique rules and checks.
- **Slow work leaves the request.** Emails, reports and imports run in the background and tell the person when done. A page never waits on them.
- **Outside services fail.** Give every call a time limit, retry a few times with a pause, and carry on without it if it is not essential.
- **Limit public routes.** Anything open to visitors is rate-limited and checked for spam.
- **Check signatures on incoming webhooks.** Never trust a call just because it arrived.
- **Settings come from the environment** and are checked when the app starts. A missing setting stops the start, with a clear message.
- **Log well.** Write one line per important event with a request id. Never write passwords, keys or personal details into logs.
- **Turn systems on or off with a flag** per client. The shell never assumes a system exists.
- **Backups are tested.** Once in a while, restore one to a copy and check it.

## Backend: structure and reliability (added 2026-11-13)

- **Three layers, always.** The route or action (who, what input) calls a **service** (the rules of the system), which calls the **data layer** (the toolbox, `src/kit`). No business rule lives in a screen, and no query lives in a route.
- **One answer shape.** Every action returns `{ ok: true, data }` or `{ ok: false, message }` (`src/kit/result.ts`). The message is plain words and safe to show.
- **Deny first, then check ownership.** An action checks the permission, then checks that the thing belongs to this business, then acts. Both checks are on the server, every time.
- **Check ids too.** Every id from the browser is checked to be a real id (a uuid) before it reaches a query.
- **Changes check the current state.** A status change says "from confirmed to done" and is refused if it is no longer confirmed, so two people pressing at once cannot overwrite each other (optimistic locking, using `updated_at`).
- **Public connections are versioned and limited.** They live at `/api/public/<system>/v1/...`, take only named fields, cap the size of the request, and accept an idempotency key so a retry never creates a second booking.
- **Page size is capped on the server.** Even if the browser asks for 10,000 rows, a list returns at most 100.
- **Every outside call has a time limit,** a few retries with a growing pause, and a plain fallback. An email provider being slow never makes a screen slow.
- **Background work has one home.** Emails, backups, imports and clean-ups run as jobs, each safe to run twice, each recording that it ran. A job that fails shows up on the status chip.
- **Cache with care.** Cache what is the same for everyone and changes rarely (settings, the published website content), and clear it when it changes (tags). Never cache one person's data where another could see it.
- **Log with a request id and a level.** One line per important event. Errors carry the detail the person never sees. Never log personal details, codes or keys.
- **Check settings at start.** All settings are read and checked once when the app starts. A missing one stops the start with a clear message, not a strange error later.
- **Few dependencies.** Before adding a package, ask if 20 lines would do. Each package is a thing to keep updated and to trust.
- **Test the rules, not the framework.** Roles, calculations, status changes and the public connection have tests. A bug found gets a test first, then the fix.

## Speed budgets (added 2026-11-13)

A budget is a limit that fails the check when it is crossed, so the dashboard stays fast as it grows.

| What | Budget |
|---|---|
| Main screen, on a mid-range phone and slow connection | content in under 2.5 seconds |
| A button press | responds in under 200 ms |
| Queries to open a page | about 5 or fewer, run together |
| A list | at most 100 rows at a time |
| JavaScript for a page, sent to the browser | about 150 KB compressed or less |
| One system added | adds nothing to a page that does not use it |
| A page layout shift | under 0.1 |


## Money, time and deleting

- Money is stored exactly (`numeric`), never as decimals in text and never as floating numbers. Store the currency next to the amount.
- Store times in UTC and show them in the client's time zone (Manila for most).
- Never hard-delete money records. Mark them void or cancelled and keep them.
- Everything else is deleted by setting `deleted_at`. The owner can restore it for 30 days, then a daily job removes it for good.
- SQL is safe to run twice (`if not exists`), has row-level security on, and is added as a new numbered file, never edited once applied.
- Anything that deletes asks first.

## Errors and tests

- People see a short, plain message. Details go to the server log, never to the screen.
- Calculations (money, stock, totals) have tests.
- Every system has a short checklist you run before giving it to a client.

## Systems and each other

- A system never reads another system's tables. It asks through a small, named function the other system offers.
- Each system has a short README: its tables, permissions, pages and what it needs from the shell.
