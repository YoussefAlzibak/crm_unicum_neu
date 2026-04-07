-- Email Queue Table
create table if not exists email_queue (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  to_email text not null,
  subject text not null,
  html_body text,
  text_body text,
  campaign_id uuid references email_campaigns(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table email_queue enable row level security;

-- Only system/webhook should ideally update this, but allow org members to view/insert for now
drop policy if exists "Org members can view email queue" on email_queue;
create policy "Org members can view email queue" on email_queue for select using (exists (select 1 from org_members where org_id = email_queue.org_id and user_id = auth.uid()));

drop policy if exists "Org members can insert into email queue" on email_queue;
create policy "Org members can insert into email queue" on email_queue for insert with check (exists (select 1 from org_members where org_id = email_queue.org_id and user_id = auth.uid()));

-- Enable pg_net for edge function triggers
create extension if not exists pg_net;

-- Function to trigger the edge function on new queue item
create or replace function process_email_queue()
returns trigger as $$
declare
  edge_function_url text;
  auth_key text;
  req_body json;
begin
  -- Fetch URL and key from database settings or environment.
  -- As a fallback, we use the standard local setup if not provided.
  edge_function_url := coalesce(current_setting('app.settings.edge_function_base_url', true), 'http://supabase-kong:8000/functions/v1/send-email');
  auth_key := coalesce(current_setting('app.settings.anon_key', true), 'fallback-anon-key');

  -- Create payload
  req_body := json_build_object(
    'org_id', NEW.org_id,
    'to', NEW.to_email,
    'subject', NEW.subject,
    'html', NEW.html_body,
    'text', NEW.text_body,
    'campaign_id', NEW.campaign_id,
    'contact_id', NEW.contact_id
  );

  -- Perform the network request asynchronously using pg_net
  perform net.http_post(
      url:=edge_function_url,
      headers:=json_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || auth_key)::jsonb,
      body:=req_body::jsonb
  );

  -- Update status to processing
  update email_queue set status = 'processing', updated_at = now() where id = NEW.id;

  return NEW;
end;
$$ language plpgsql;

drop trigger if exists email_queue_insert_trigger on email_queue;
create trigger email_queue_insert_trigger
  after insert on email_queue
  for each row
  execute function process_email_queue();
