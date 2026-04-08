-- 1. Booking Verification Table for Double-Opt-In
create table if not exists booking_verifications (
  id uuid primary key default uuid_generate_v4(),
  token uuid default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  contact_data jsonb not null, -- { full_name, email, phone }
  appointment_data jsonb not null, -- { title, start_time, end_time, description }
  expires_at timestamp with time zone default (now() + interval '2 hours'),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table booking_verifications enable row level security;

-- Policies
-- Public can insert (needed for unauthenticated bookings)
create policy "Anonymous can create booking requests" on booking_verifications for insert with check (true);

-- Org members can view requests for their org
create policy "Org members can view booking requests" on booking_verifications 
  for select using (exists (select 1 from org_members where org_id = booking_verifications.org_id and user_id = auth.uid()));

-- 2. Add email_confirmed to appointments (optional safety)
alter table appointments add column if not exists is_verified boolean default false;
