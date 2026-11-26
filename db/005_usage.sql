-- The Systems page: how much space is used. Safe to run twice. Only the server (the secret key) may ask.

create or replace function dashboard_usage()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'database', pg_database_size(current_database()),
    'files', coalesce((select sum((metadata->>'size')::bigint) from storage.objects), 0)
  );
$$;

revoke all on function dashboard_usage() from public, anon, authenticated;
grant execute on function dashboard_usage() to service_role;
