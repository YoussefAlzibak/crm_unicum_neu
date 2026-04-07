-- Booking System Extensions

-- 1. Booking Settings (Organization-specific)
create table if not exists booking_settings (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade unique,
  default_duration int default 30, -- in minutes
  buffer_before int default 0, -- in minutes
  buffer_after int default 0, -- in minutes
  min_notice_hours int default 24,
  max_future_days int default 30,
  available_days int[] default '{1,2,3,4,5}', -- Monday to Friday
  working_hours_start time default '09:00',
  working_hours_end time default '17:00',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Appointments Table
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  location text, -- 'online', 'office', address
  meeting_link text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. RLS Setup
alter table booking_settings enable row level security;
alter table appointments enable row level security;

-- Policies for Booking Settings
create policy "Org members can view booking settings" on booking_settings for select using (exists (select 1 from org_members where org_id = booking_settings.org_id and user_id = auth.uid()));
create policy "Org members can update booking settings" on booking_settings for update using (exists (select 1 from org_members where org_id = booking_settings.org_id and user_id = auth.uid()));
create policy "Org members can insert booking settings" on booking_settings for insert with check (exists (select 1 from org_members where org_id = booking_settings.org_id and user_id = auth.uid()));

-- Policies for Appointments
create policy "Org members can view appointments" on appointments for select using (exists (select 1 from org_members where org_id = appointments.org_id and user_id = auth.uid()));
create policy "Org members can insert appointments" on appointments for insert with check (exists (select 1 from org_members where org_id = appointments.org_id and user_id = auth.uid()));
create policy "Org members can update appointments" on appointments for update using (exists (select 1 from org_members where org_id = appointments.org_id and user_id = auth.uid()));

-- 4. Triggers
create trigger update_booking_settings_updated_at before update on booking_settings for each row execute procedure update_updated_at_column();
create trigger update_appointments_updated_at before update on appointments for each row execute procedure update_updated_at_column();
