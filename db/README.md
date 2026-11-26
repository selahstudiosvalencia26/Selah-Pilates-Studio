# Database files

Paste each file into Supabase (SQL Editor) and press Run, **in number order**. On a new project run all of them. After an update, run only the new ones. Each is safe to run twice.

| File | Adds |
|---|---|
| 001_booking_tables.sql | Bookings tables |
| 002_booking_prices_and_deposits.sql | Prices, packages, deposit due dates |
| 003_booking_save_online.sql | Safe saving for the live dashboard |
| 004_dashboard.sql | Website words, settings, team, photo storage |
| 005_usage.sql | Space used, on the Systems page |

These are copies, collected here so they are easy to find. The dashboard keeps its own in `dashboard/src/systems/*/migrations` and `dashboard/supabase/migrations`. A new SQL file goes in both places with the next number here; a test (`dashboard/tests/db-folder.test.ts`) fails if one is missing.
