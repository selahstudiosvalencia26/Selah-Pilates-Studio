# Naming rules

Our own rules, so names stay consistent as systems grow. Written 2026-11-11.

## The one big rule

**One system word, used everywhere.** The same word is the folder, the table prefix, the permission prefix and the web address.

| Where | Example for the Payments system |
|---|---|
| Folder | `systems/payments/` |
| Tables | `payments_receipts`, `payments_methods` |
| Permissions | `payments.view`, `payments.edit` |
| Web address | `/payments/receipts` |
| Code names | `Receipt`, `ReceiptForm`, `createReceipt` |

Use full readable words (`inventory`, `payments`, `booking`), not short codes (`inv`, `pay`). If you can't tell what a name means at a glance, it is wrong.

## Tables (database)

- Format: `<system>_<plural_noun>`, all lowercase with underscores. Example: `payments_receipts`.
- **No `_table` at the end.** The prefix already says where it belongs, and a suffix adds nothing. So `payments_receipts`, not `payments_table` or `receipts_table`.
- Always **plural** for tables (`payments_receipts`) and **singular** for code (`Receipt`).
- A link table joins two things: `<system>_<thing_a>_<thing_b>`, for example `inventory_item_tags`.
- The shell's own tables start with `shell_`: `shell_users`, `shell_roles`, `shell_permissions`, `shell_systems`, `shell_files`, `shell_activity_log`, `shell_settings`.
- A system never creates a table without its own prefix, and never reads another system's tables directly.

## Columns

- Lowercase with underscores.
- Every table has `id` (uuid), `created_at` and `updated_at`.
- A link to another table is `<singular_name>_id`: `receipt_id`, `customer_id`.
- A yes/no column starts with `is_` or `has_`: `is_active`, `has_paid`.
- Money: `amount` plus `currency`. Never store money as text.
- A status column is called `status` and holds a fixed list of words (a check rule in the database).
- Dates and times end in `_at` (a moment) or `_on` (a day): `paid_at`, `due_on`.

## Code (TypeScript)

- **Thing first, then its role.** `ReceiptList`, `ReceiptForm`, `ReceiptStatus`. Never the other way round (`ListReceipts`, `FormReceipt`). Then everything about receipts sorts together.
- **No system name in code names.** Inside the payments folder it is just `Receipt`, not `PaymentsReceipt` or `PaymentReceiptApplication`. The folder already says it is payments. Outside, the import path says it: `import { Receipt } from "@systems/payments"`.
- Functions start with a verb: `createReceipt`, `listReceipts`, `markReceiptPaid`.
- Files and folders: lowercase with dashes (`receipt-form.tsx`).
- Types and components: `PascalCase`. Functions and variables: `camelCase`.
- **Banned words:** `Manager`, `Helper`, `Utils`, `Application`, `Handler`, `Data`, `Info`. They say nothing. Name what it does.

## Permissions and web addresses

- Permissions: `<system>.<action>`. Use only these actions: `view`, `edit`, `approve`, `delete`, `manage`.
- Web addresses: `/<system>/<plural_noun>` and `/<system>/<plural_noun>/[id]`.

## One word per idea (the glossary)

Pick one word for each idea and use it everywhere: in tables, code and screens.

| Idea | Use | Never |
|---|---|---|
| A person who buys | `customer` | client, buyer, contact |
| A table, room or time held for someone | `booking` (a client's setup may show another word on screen) | reservation, appointment, in code |
| Money received | `payment` | collection, remittance |
| A proof of payment | `receipt` | proof, slip |

Decided for now: the code word is `booking`. A client's setup can show a different word on screen (the café example shows "Reservation") through the words setting. Code and tables always say `booking`.

## Standard columns and files

- Every table that holds a person's work has `id`, `created_at`, `updated_at` and `deleted_at`. Deleting sets `deleted_at` (the recycle bin, 30 days). Money tables are voided, never deleted.
- Settings keys are lowercase with underscores (`brand_name`, `business_hours`, `plan_storage_mb`).
- SQL files are numbered and never edited after they are applied: `001_create_tables.sql`, `002_add_notes.sql`.
- Email types: `<system>.<email_id>` (for example `booking.reminder`).

