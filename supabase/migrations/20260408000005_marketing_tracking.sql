-- Add sequence support to email_campaigns
alter table email_campaigns add column if not exists is_sequence boolean default false;
alter table email_campaigns add column if not exists parent_campaign_id uuid references email_campaigns(id);
alter table email_campaigns add column if not exists delay_hours int default 0;

-- Ensure tracking hash exists for verified events
alter table email_events add column if not exists tracking_token uuid default uuid_generate_v4();

-- Helper View for Campaign Analytics
create or replace view campaign_stats as
select 
  c.id as campaign_id,
  c.name,
  c.status,
  (select count(*) from email_events where campaign_id = c.id and event_type = 'sent') as sent_count,
  (select count(*) from email_events where campaign_id = c.id and event_type = 'opened') as open_count,
  (select count(*) from email_events where campaign_id = c.id and event_type = 'clicked') as click_count,
  case 
    when (select count(*) from email_events where campaign_id = c.id and event_type = 'sent') > 0 
    then (select count(*) from email_events where campaign_id = c.id and event_type = 'opened')::float / 
         (select count(*) from email_events where campaign_id = c.id and event_type = 'sent')::float * 100
    else 0 
  end as open_rate,
  case 
    when (select count(*) from email_events where campaign_id = c.id and event_type = 'sent') > 0 
    then (select count(*) from email_events where campaign_id = c.id and event_type = 'clicked')::float / 
         (select count(*) from email_events where campaign_id = c.id and event_type = 'sent')::float * 100
    else 0 
  end as click_rate
from email_campaigns c;
