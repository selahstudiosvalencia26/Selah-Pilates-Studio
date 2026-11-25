-- Bookings: what the live dashboard needs to save online. Safe to run twice. Run 001 and 002 first.

-- The app makes its own short ids.
alter table booking_records alter column id drop default;
alter table booking_records alter column id type text using id::text;

-- A counter that moves on every save. A save made from stale data is refused and tried again, so two people can never both take
-- the last slot in a class.
create table if not exists booking_version (
  id       boolean primary key default true check (id), -- only one row
  version  bigint not null default 0
);
insert into booking_version (id, version) values (true, 0) on conflict (id) do nothing;
alter table booking_version enable row level security;

create or replace function booking_commit(expected bigint, records jsonb, new_settings jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update booking_version set version = version + 1 where id and version = expected;
  if not found then
    return false;
  end if;

  if new_settings is not null and jsonb_typeof(new_settings) <> 'null' then
    insert into booking_settings (id, settings) values (true, new_settings)
    on conflict (id) do update set settings = excluded.settings, updated_at = now();
  end if;

  insert into booking_records (id, customer_name, phone, email, event_type, guests, starts_at, ends_at, session_key, status, deposit,
    deposit_amount, deposit_method, deposit_paid_on, notes, staff_note, created_via, history, created_at, deleted_at, price, package_name, pay_by)
  select id, customer_name, phone, email, event_type, guests, starts_at, ends_at, session_key, status, deposit,
    deposit_amount, deposit_method, deposit_paid_on, notes, staff_note, created_via, history, created_at, deleted_at, price, package_name, pay_by
  from jsonb_populate_recordset(null::booking_records, records)
  on conflict (id) do update set
    customer_name = excluded.customer_name, phone = excluded.phone, email = excluded.email, event_type = excluded.event_type,
    guests = excluded.guests, starts_at = excluded.starts_at, ends_at = excluded.ends_at, session_key = excluded.session_key,
    status = excluded.status, deposit = excluded.deposit, deposit_amount = excluded.deposit_amount,
    deposit_method = excluded.deposit_method, deposit_paid_on = excluded.deposit_paid_on, notes = excluded.notes,
    staff_note = excluded.staff_note, history = excluded.history, deleted_at = excluded.deleted_at, price = excluded.price,
    package_name = excluded.package_name, pay_by = excluded.pay_by;

  return true;
end;
$$;

-- Only the server (the secret key) may use any of this. Visitors and the public key get nothing.
revoke all on function booking_commit(bigint, jsonb, jsonb) from public, anon, authenticated;
grant execute on function booking_commit(bigint, jsonb, jsonb) to service_role;
revoke all on booking_records, booking_settings, booking_version from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on booking_records, booking_settings, booking_version to service_role;
