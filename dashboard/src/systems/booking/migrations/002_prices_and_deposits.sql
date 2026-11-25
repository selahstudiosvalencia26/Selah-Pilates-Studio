-- Bookings: what was added after the first tables: prices, packages, the time to pay a deposit, and more ways to pay.
-- Safe to run twice. Run 001 first. Never edit this file after it has been applied; add 003 instead.

alter table booking_records add column if not exists price bigint check (price >= 0);          -- centavos, kept from the day it was booked
alter table booking_records add column if not exists package_name text check (char_length(package_name) <= 60);
alter table booking_records add column if not exists pay_by timestamptz;                       -- when the deposit is due

alter table booking_records drop constraint if exists booking_records_deposit_method_check;
alter table booking_records add constraint booking_records_deposit_method_check
  check (deposit_method in ('gcash', 'maya', 'ewallet', 'bank', 'cash'));
