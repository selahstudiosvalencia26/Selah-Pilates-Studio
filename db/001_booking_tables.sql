-- Bookings: tables for venue bookings and class spots. Safe to run twice. Never edit this file after it has been applied; add 002 instead.
-- Row-level security is on and there are no open policies, so nothing is readable until the server (which checks the person's role) asks.
-- The dashboard keeps these in files until the database is connected (src/systems/booking/store.ts); the columns match schema.ts.

create extension if not exists btree_gist;

-- One row of settings for the business: what it books, opening hours, lead time, deposit, weekly class timetable.
create table if not exists booking_settings (
  id          boolean primary key default true check (id), -- only one row can exist
  settings    jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists booking_records (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text not null check (char_length(customer_name) between 1 and 80),
  phone           text not null check (char_length(phone) between 7 and 20),
  email           text not null check (char_length(email) <= 120),
  event_type      text not null check (char_length(event_type) between 1 and 60), -- the event, or the class name
  guests          integer not null check (guests between 1 and 5000),              -- guests, or spots in a class
  starts_at       timestamptz not null,                                            -- always UTC; shown in the business's zone
  ends_at         timestamptz not null,
  session_key     text check (session_key ~ '^[a-f0-9]{8}@\d{4}-\d{2}-\d{2}$'),   -- classes mode: the class and date
  status          text not null default 'requested' check (status in ('requested', 'confirmed', 'done', 'cancelled')),
  deposit         text not null default 'none' check (deposit in ('none', 'waiting', 'paid', 'void')),
  deposit_amount  bigint not null default 0 check (deposit_amount >= 0),           -- centavos, never a decimal
  deposit_method  text check (deposit_method in ('gcash', 'bank', 'cash')),
  deposit_paid_on date,
  notes           text not null default '' check (char_length(notes) <= 500),
  staff_note      text not null default '' check (char_length(staff_note) <= 300),
  created_via     text not null check (created_via in ('public', 'staff')),
  history         jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz,                                                     -- the recycle bin: money is never deleted
  check (ends_at > starts_at),
  -- The database, not only the screen, refuses two confirmed venue bookings that overlap in time.
  constraint booking_no_double_booking exclude using gist (tstzrange(starts_at, ends_at) with &&)
    where (status = 'confirmed' and session_key is null and deleted_at is null)
);

create index if not exists booking_records_starts_at_idx on booking_records (starts_at) where deleted_at is null;
create index if not exists booking_records_status_idx on booking_records (status, starts_at) where deleted_at is null;
create index if not exists booking_records_session_idx on booking_records (session_key) where session_key is not null and deleted_at is null;
create index if not exists booking_records_phone_idx on booking_records (phone);

alter table booking_settings enable row level security;
alter table booking_records enable row level security;
