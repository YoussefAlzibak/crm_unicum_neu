-- CRM Extensions for Supabase

-- 1. Contacts Table
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  status text default 'lead' check (status in ('lead', 'customer', 'archived')),
  tags text[],
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Pipelines Table
create table if not exists pipelines (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

-- 3. Pipeline Stages
create table if not exists pipeline_stages (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  name text not null,
  order_index int not null default 0,
  created_at timestamp with time zone default now()
);

-- 4. Deals Table
create table if not exists deals (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  stage_id uuid references pipeline_stages(id) on delete set null,
  title text not null,
  value decimal(12,2) default 0,
  currency text default 'EUR',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. Contact Activities (Timeline)
create table if not exists contact_activities (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid not null references contacts(id) on delete cascade,
  type text not null, -- 'note', 'email', 'call', 'status_change'
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table contacts enable row level security;
alter table pipelines enable row level security;
alter table pipeline_stages enable row level security;
alter table deals enable row level security;
alter table contact_activities enable row level security;

-- RLS Policies (Filtered by org_member status)

create policy "Org members can view contacts" on contacts
  for select using (
    exists (
      select 1 from org_members 
      where org_id = contacts.org_id and user_id = auth.uid()
    )
  );

create policy "Org members can insert contacts" on contacts
  for insert with check (
    exists (
      select 1 from org_members 
      where org_id = contacts.org_id and user_id = auth.uid()
    )
  );

create policy "Org members can update contacts" on contacts
  for update using (
    exists (
      select 1 from org_members 
      where org_id = contacts.org_id and user_id = auth.uid()
    )
  );

-- Pipelines
create policy "Org members can view pipelines" on pipelines for select using (exists (select 1 from org_members where org_id = pipelines.org_id and user_id = auth.uid()));
-- Stages
create policy "Org members can view stages" on pipeline_stages for select using (exists (select 1 from pipeline_stages s join pipelines p on s.pipeline_id = p.id join org_members m on p.org_id = m.org_id where m.user_id = auth.uid()));
-- Deals
create policy "Org members can view deals" on deals for select using (exists (select 1 from org_members where org_id = deals.org_id and user_id = auth.uid()));

-- Triggers for updated_at
create trigger update_contacts_updated_at before update on contacts for each row execute procedure update_updated_at_column();
create trigger update_deals_updated_at before update on deals for each row execute procedure update_updated_at_column();
