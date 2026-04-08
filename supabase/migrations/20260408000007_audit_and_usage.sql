-- 1. Attach Audit Log Triggers to core tables
drop trigger if exists audit_contacts on contacts;
create trigger audit_contacts after insert or update or delete on contacts for each row execute procedure log_action();

drop trigger if exists audit_campaigns on email_campaigns;
create trigger audit_campaigns after insert or update or delete on email_campaigns for each row execute procedure log_action();

drop trigger if exists audit_org_members on org_members;
create trigger audit_org_members after insert or update or delete on org_members for each row execute procedure log_action();

-- 2. Create Usage Stats View
create or replace view organization_usage as
select 
  o.id as org_id,
  o.name as org_name,
  (select count(*) from contacts where org_id = o.id) as contact_count,
  (select count(*) from email_events where campaign_id in (select id from email_campaigns where org_id = o.id) and event_type = 'sent') as emails_sent_total,
  (select count(*) from email_events where campaign_id in (select id from email_campaigns where org_id = o.id) and event_type = 'sent' and created_at > now() - interval '30 days') as emails_sent_30d,
  s.plan_name,
  s.status as sub_status
from organizations o
left join subscriptions s on s.org_id = o.id;

-- 3. Ensure all organizations have a free subscription row
insert into subscriptions (org_id, plan_name, status)
select id, 'free', 'active'
from organizations
on conflict (org_id) do nothing;
