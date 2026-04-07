-- Communication Hub & Marketing Extensions

-- ========================================================
-- PHASE 4: Communication Hub & AI (Tickets & Messages)
-- ========================================================

-- 1. Tickets Table
create table if not exists tickets (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  subject text not null,
  status text default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Ticket Messages (Chat History)
create table if not exists ticket_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'contact', 'ai', 'system')),
  sender_id uuid, -- Can be profile_id or contact_id
  content text not null,
  is_internal boolean default false,
  created_at timestamp with time zone default now()
);

-- ========================================================
-- PHASE 5: Marketing Automation
-- ========================================================

-- 3. Email Templates
create table if not exists email_templates (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  subject text not null,
  html_body text not null,
  design_json jsonb, -- For drag-and-drop editor state
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Email Campaigns
create table if not exists email_campaigns (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  template_id uuid references email_templates(id) on delete restrict,
  status text default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_for timestamp with time zone,
  audience_filter jsonb default '{}'::jsonb, -- e.g., {'tags': ['newsletter']}
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. Email Events (Tracking)
create table if not exists email_events (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references email_campaigns(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  event_type text not null check (event_type in ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- ========================================================
-- RLS Setup
-- ========================================================

alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table email_templates enable row level security;
alter table email_campaigns enable row level security;
alter table email_events enable row level security;

-- Policies (Simplified for Org Members)

-- Tickets
drop policy if exists "Org members can view tickets" on tickets;
create policy "Org members can view tickets" on tickets for select using (exists (select 1 from org_members where org_id = tickets.org_id and user_id = auth.uid()));
drop policy if exists "Org members can insert tickets" on tickets;
create policy "Org members can insert tickets" on tickets for insert with check (exists (select 1 from org_members where org_id = tickets.org_id and user_id = auth.uid()));
drop policy if exists "Org members can update tickets" on tickets;
create policy "Org members can update tickets" on tickets for update using (exists (select 1 from org_members where org_id = tickets.org_id and user_id = auth.uid()));

-- Messages
drop policy if exists "Org members can view messages" on ticket_messages;
create policy "Org members can view messages" on ticket_messages for select using (exists (select 1 from tickets t join org_members m on t.org_id = m.org_id where t.id = ticket_messages.ticket_id and m.user_id = auth.uid()));
drop policy if exists "Org members can insert messages" on ticket_messages;
create policy "Org members can insert messages" on ticket_messages for insert with check (exists (select 1 from tickets t join org_members m on t.org_id = m.org_id where t.id = ticket_messages.ticket_id and m.user_id = auth.uid()));

-- Email Templates
drop policy if exists "Org members can view templates" on email_templates;
create policy "Org members can view templates" on email_templates for select using (exists (select 1 from org_members where org_id = email_templates.org_id and user_id = auth.uid()));
drop policy if exists "Org members can insert templates" on email_templates;
create policy "Org members can insert templates" on email_templates for insert with check (exists (select 1 from org_members where org_id = email_templates.org_id and user_id = auth.uid()));
drop policy if exists "Org members can update templates" on email_templates;
create policy "Org members can update templates" on email_templates for update using (exists (select 1 from org_members where org_id = email_templates.org_id and user_id = auth.uid()));

-- Email Campaigns
drop policy if exists "Org members can view campaigns" on email_campaigns;
create policy "Org members can view campaigns" on email_campaigns for select using (exists (select 1 from org_members where org_id = email_campaigns.org_id and user_id = auth.uid()));
drop policy if exists "Org members can insert campaigns" on email_campaigns;
create policy "Org members can insert campaigns" on email_campaigns for insert with check (exists (select 1 from org_members where org_id = email_campaigns.org_id and user_id = auth.uid()));
drop policy if exists "Org members can update campaigns" on email_campaigns;
create policy "Org members can update campaigns" on email_campaigns for update using (exists (select 1 from org_members where org_id = email_campaigns.org_id and user_id = auth.uid()));

-- Email Events
drop policy if exists "Org members can view email events" on email_events;
create policy "Org members can view email events" on email_events for select using (
  exists (
    select 1 from email_campaigns c 
    join org_members m on c.org_id = m.org_id 
    where c.id = email_events.campaign_id and m.user_id = auth.uid()
  )
);

-- Triggers
drop trigger if exists update_tickets_updated_at on tickets;
create trigger update_tickets_updated_at before update on tickets for each row execute procedure update_updated_at_column();
drop trigger if exists update_email_templates_updated_at on email_templates;
create trigger update_email_templates_updated_at before update on email_templates for each row execute procedure update_updated_at_column();
drop trigger if exists update_email_campaigns_updated_at on email_campaigns;
create trigger update_email_campaigns_updated_at before update on email_campaigns for each row execute procedure update_updated_at_column();
