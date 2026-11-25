# <system>: design

Written <date>. See `prd.md`. Shared design is in `../../architecture/system-design.md`, tables in `../../architecture/data-model.md`.

## Description file (key parts)

- `id`, `needs`, `optional`, `requires_shell`
- Permissions and their defaults
- Pages
- Today cards
- Emails
- Public connection (if any)
- Search
- Provides (functions other systems may call)

## Tables

Names and main columns. The first SQL file is `001_create_tables.sql` (RLS on, recycle-bin column, indexes).

## Rules

Statuses and allowed steps, money, time, limits, anything the database must guarantee.

## Public connection

Only if the system has a public page: the fields it accepts, the checks, the limits, what it returns.

## Screens

| Screen | The one thing to do here | Shows |
|---|---|---|

## Tasks and steps

The things people do most, and how many clicks each takes from where they are (`docs/rules/principles.md`, rule 3). A task of more than two clicks needs a reason.

| Task | Clicks | Where it starts |
|---|---|---|

## Tests

- Roles
- The rules above
- Public connection (if any)
