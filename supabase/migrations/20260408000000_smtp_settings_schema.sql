-- SMTP Settings Schema

create table if not exists smtp_settings (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade unique,
  host text not null,
  port int not null,
  secure boolean default true,
  user_name text not null,
  password_encrypted text not null,
  from_email text not null,
  from_name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table smtp_settings enable row level security;

drop policy if exists "Org members can view smtp settings" on smtp_settings;
create policy "Org members can view smtp settings" on smtp_settings for select using (exists (select 1 from org_members where org_id = smtp_settings.org_id and user_id = auth.uid()));
drop policy if exists "Org members can insert smtp settings" on smtp_settings;
create policy "Org members can insert smtp settings" on smtp_settings for insert with check (exists (select 1 from org_members where org_id = smtp_settings.org_id and user_id = auth.uid()));
drop policy if exists "Org members can update smtp settings" on smtp_settings;
create policy "Org members can update smtp settings" on smtp_settings for update using (exists (select 1 from org_members where org_id = smtp_settings.org_id and user_id = auth.uid()));
drop policy if exists "Org members can delete smtp settings" on smtp_settings;
create policy "Org members can delete smtp settings" on smtp_settings for delete using (exists (select 1 from org_members where org_id = smtp_settings.org_id and user_id = auth.uid()));

drop trigger if exists update_smtp_settings_updated_at on smtp_settings;
create trigger update_smtp_settings_updated_at before update on smtp_settings for each row execute procedure update_updated_at_column();
