-- The dashboard: website words and settings, and the place for website photos. Safe to run twice.
-- Only the server (the secret key) can read or change the table. The photo bucket is public, because they are website pictures.

create table if not exists dashboard_documents (
  name        text primary key check (char_length(name) between 1 and 60),
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table dashboard_documents enable row level security;
revoke all on dashboard_documents from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on dashboard_documents to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-photos', 'site-photos', true, 1048576, array['image/webp'])
on conflict (id) do nothing;
