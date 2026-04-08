-- 1. Create Booking Services Table
create table if not exists booking_services (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  duration int not null default 30, -- in minutes
  icon text default 'Zap', -- Zap, Clock, Target, etc.
  color text default 'text-purple-400',
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Enable RLS
alter table booking_services enable row level security;

-- 3. Policies
-- Public can view active services for booking
create policy "Public can view active services" on booking_services
  for select using (is_active = true);

-- Org members can manage their services
create policy "Org members can view all services" on booking_services
  for select using (exists (select 1 from org_members where org_id = booking_services.org_id and user_id = auth.uid()));

create policy "Org members can manage services" on booking_services
  for all using (exists (select 1 from org_members where org_id = booking_services.org_id and user_id = auth.uid()));

-- 4. Dynamic Update trigger
create trigger update_booking_services_updated_at before update on booking_services for each row execute procedure update_updated_at_column();

-- 5. Seed initial services for existing organizations
do $$
declare
  r record;
begin
  for r in select id from organizations loop
    insert into booking_services (org_id, name, duration, description, icon, color)
    values 
      (r.id, 'Strategiegespräch', 45, 'Individuelle Beratung zu Ihrer digitalen Strategie.', 'Zap', 'text-purple-400'),
      (r.id, 'Quick Tech-Audit', 15, 'Schneller Check Ihrer bestehenden Systeme.', 'Clock', 'text-blue-400'),
      (r.id, 'Full Roadmap Planning', 90, 'Detaillierte Planung Ihres nächsten Großprojekts.', 'Target', 'text-green-400')
    on conflict do nothing;
  end loop;
end;
$$;
