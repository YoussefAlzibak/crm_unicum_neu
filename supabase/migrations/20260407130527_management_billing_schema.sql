-- Management & Billing Extensions

-- 1. Profiles Update (Super-Admin Support)
alter table profiles add column if not exists is_super_admin boolean default false;

-- 2. Subscriptions Table
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name text default 'free' check (plan_name in ('free', 'pro', 'enterprise')),
  status text default 'active', -- active, past_due, canceled
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Audit Logs
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- 4. RLS Setup
alter table subscriptions enable row level security;
alter table audit_logs enable row level security;

-- Policies for Subscriptions
drop policy if exists "Org members can view own subscription" on subscriptions;
create policy "Org members can view own subscription" on subscriptions for select using (exists (select 1 from org_members where org_id = subscriptions.org_id and user_id = auth.uid()));

-- Policies for Audit Logs
drop policy if exists "Org members can view own audit logs" on audit_logs;
create policy "Org members can view own audit logs" on audit_logs for select using (exists (select 1 from org_members where org_id = audit_logs.org_id and user_id = auth.uid()));

-- SUPER ADMIN POLICIES (Example for Subscriptions)
drop policy if exists "Super admins can manage all subscriptions" on subscriptions;
create policy "Super admins can manage all subscriptions" on subscriptions 
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

drop policy if exists "Super admins can view all audit logs" on audit_logs;
create policy "Super admins can view all audit logs" on audit_logs 
  for select using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- 5. Helper Function for Audit Logging (Trigger usage)
create or replace function log_action()
returns trigger as $$
begin
    insert into audit_logs (org_id, user_id, action, target_table, target_id)
    values (
      case when TG_OP = 'DELETE' then OLD.org_id else NEW.org_id end,
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      case when TG_OP = 'DELETE' then OLD.id else NEW.id end
    );
    return case when TG_OP = 'DELETE' then OLD else NEW end;
end;
$$ language plpgsql security definer;

-- 6. Triggers
drop trigger if exists update_subscriptions_updated_at on subscriptions;
create trigger update_subscriptions_updated_at before update on subscriptions for each row execute procedure update_updated_at_column();
