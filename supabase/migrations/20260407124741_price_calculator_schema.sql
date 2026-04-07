-- Price Calculator Extensions

-- 1. Calculators Table
create table if not exists calculators (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  base_price decimal(12,2) default 0,
  currency text default 'EUR',
  is_active boolean default true,
  configuration jsonb default '[]'::jsonb, -- Array of items: {id, label, type: 'select'|'checkbox'|'number', options: [{label, price_impact, type: 'fixed'|'percentage'}], required: boolean}
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Calculator Leads / Results
create table if not exists calculator_results (
  id uuid primary key default uuid_generate_v4(),
  calculator_id uuid not null references calculators(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  selections jsonb not null, -- {input_id: selected_value}
  total_price decimal(12,2) not null,
  created_at timestamp with time zone default now()
);

-- 3. RLS Setup
alter table calculators enable row level security;
alter table calculator_results enable row level security;

-- Policies for Calculators
drop policy if exists "Org members can view calculators" on calculators;
create policy "Org members can view calculators" on calculators for select using (exists (select 1 from org_members where org_id = calculators.org_id and user_id = auth.uid()));
drop policy if exists "Org members can insert calculators" on calculators;
create policy "Org members can insert calculators" on calculators for insert with check (exists (select 1 from org_members where org_id = calculators.org_id and user_id = auth.uid()));
drop policy if exists "Org members can update calculators" on calculators;
create policy "Org members can update calculators" on calculators for update using (exists (select 1 from org_members where org_id = calculators.org_id and user_id = auth.uid()));
drop policy if exists "Org members can delete calculators" on calculators;
create policy "Org members can delete calculators" on calculators for delete using (exists (select 1 from org_members where org_id = calculators.org_id and user_id = auth.uid()));

-- Policies for Results
drop policy if exists "Org members can view calculator results" on calculator_results;
create policy "Org members can view calculator results" on calculator_results for select using (
  exists (
    select 1 from calculators c 
    join org_members m on c.org_id = m.org_id 
    where c.id = calculator_results.calculator_id and m.user_id = auth.uid()
  )
);

-- 4. Triggers
drop trigger if exists update_calculators_updated_at on calculators;
create trigger update_calculators_updated_at before update on calculators for each row execute procedure update_updated_at_column();
