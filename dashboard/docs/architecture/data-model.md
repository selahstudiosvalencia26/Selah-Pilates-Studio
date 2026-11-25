# Data model

Written 2026-11-12. The tables and their main columns. A design to build from, so names and types may change when the SQL is written (then update this file). Rules: `../rules/naming.md` and `../rules/rules.md`.

## 1. Rules for every table

- Names: shell tables `shell_<plural>`, system tables `<system>_<plural>`.
- Standard columns on anything that holds a person's work: `id` (uuid), `created_at`, `updated_at`, `deleted_at` (null until deleted; the recycle bin).
- Money tables use `deleted_at` too, but money is voided, never deleted (`status = 'void'`).
- Money is `numeric(12,2)` with a `currency` column. Times are `timestamptz` in UTC.
- Row-level security is on for every table, with no public access. Every table has a business scope handled by the kit.
- Indexes on what each screen filters and sorts by (for example `starts_at`, `status`, `deleted_at`).
- SQL is idempotent and added as a numbered file, never edited once applied.

## 2. Shell tables

### People and access
| Table | Main columns |
|---|---|
| `shell_users` | `id`, `auth_id`, `name`, `email` (unique), `active`, `last_seen_at` |
| `shell_invites` | `id`, `email`, `role_ids`, `invited_by`, `expires_at`, `used_at`, `cancelled_at` |
| `shell_roles` | `id`, `name`, `is_builtin`, `is_locked` (Owner), `created_by` |
| `shell_permissions` | `id` (`booking.edit`), `system_id`, `label`, `sensitive` |
| `shell_role_permissions` | `role_id`, `permission_id` |
| `shell_user_roles` | `user_id`, `role_id` |
| `shell_sessions` | `id`, `user_id`, `device_label`, `created_at`, `last_seen_at`, `revoked_at` (only if Supabase Auth cannot show devices) |
| `shell_rate_limits` | `key`, `count`, `expires_at` |
| `shell_support_access` | `id`, `granted_by`, `starts_at`, `ends_at`, `ended_at` |

### Configuration
| Table | Main columns |
|---|---|
| `shell_settings` | `key` (unique), `value` (json), `updated_by`, `updated_at` |
| `shell_systems` | `id` (`booking`), `version`, `enabled`, `applied_migrations` (list), `check_result`, `enabled_at` |

### Files and email
| Table | Main columns |
|---|---|
| `shell_files` | `id`, `path`, `kind`, `size`, `uploaded_by`, `owner_type`, `owner_id` (what it belongs to), `deleted_at` |
| `shell_email_types` | `id` (`booking.reminder`), `system_id`, `label`, `required`, `enabled`, `daily_cap` |
| `shell_email_log` | `id`, `type_id`, `to_user_id` or `to_ref`, `system_id`, `status`, `error`, `sent_at` |

### Watching
| Table | Main columns |
|---|---|
| `shell_activity_log` | `id`, `at`, `actor_id`, `action`, `subject_type`, `subject_id`, `detail` (no personal data). Append-only. |
| `shell_health_checks` | `id`, `at`, `check` (`database`, `storage`, `email`, `backup`), `state` (`ok`, `amber`, `red`), `note` |
| `shell_backups` | `id`, `at`, `kind` (`weekly`, `monthly`), `status`, `size`, `location`, `error` |

(There is no table for contact messages. The contact link opens your website.)

## 3. Pilot system tables (suggested)

### `booking`
| Table | Main columns |
|---|---|
| `booking_resources` | `id`, `name` (the venue), `capacity`, `active` |
| `booking_hours` | `id`, `resource_id`, `weekday`, `opens`, `closes`, `closed` |
| `booking_records` | `id`, `resource_id`, `customer_name`, `phone`, `email`, `event_type`, `guests`, `starts_at`, `ends_at`, `status` (`requested`, `confirmed`, `done`, `cancelled`), `notes`, `deposit_amount`, `deposit_status`, `created_via` (`public` or `staff`) |

The database blocks two confirmed bookings from overlapping on the same resource (an exclusion rule on the time range for `confirmed`). Indexes on `starts_at`, `status`.

### `payments` (small)
| Table | Main columns |
|---|---|
| `payments_records` | `id`, `amount`, `currency`, `method` (`gcash`, `bank`, `cash`), `status` (`paid`, `void`), `received_at`, `proof_file_id`, `subject_type`, `subject_id` (what it is for, for example a booking), `note`, `recorded_by` |

`subject_type` and `subject_id` let `payments` link to any system without reading its tables. Voiding sets `status = 'void'`, never deletes.

### `content`
| Table | Main columns |
|---|---|
| `content_pages` | `id`, `slug`, `title`, `status` (`draft`, `published`), `published_at` |
| `content_blocks` | `id`, `page_id`, `key`, `kind` (`text`, `image`, `list`), `value` (json), `position` |
| `content_media` | `id`, `file_id`, `alt_text` |

Text is cleaned on save. The website reads only `published` rows.

## 4. Relationships in one drawing

```
shell_users --< shell_user_roles >-- shell_roles --< shell_role_permissions >-- shell_permissions
shell_systems (one row for each system on) ---- shell_permissions (declared by the system)
booking_records >-- booking_resources
payments_records ... subject_type/subject_id ... booking_records   (a loose link, not a foreign key)
shell_files <-- payments_records.proof_file_id, content_media.file_id
shell_activity_log, shell_email_log refer to people and subjects by id only
```

## 5. Settings keys (version 1)

The list is in `../dashboard/shell-plan.md` ("Settings keys"). A system may add its own keys that start with its system word (`booking_buffer_minutes`).

## 6. What is deliberately not stored

- Card numbers.
- Sign-in codes (Supabase Auth handles them).
- Email bodies and codes in the email log.
- Personal details in logs.
- Passwords. We never store one: if a person adds a password, Supabase Auth keeps only a salted hash (bcrypt) in its own table. No password, hash or reset link is copied into our tables, logs, activity log or emails.
