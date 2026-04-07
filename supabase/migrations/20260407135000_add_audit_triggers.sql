-- 1. Apply Audit Triggers to Critical Tables

-- Trigger for organizations
drop trigger if exists audit_organizations on organizations;
create trigger audit_organizations
  after insert or update or delete on organizations
  for each row execute procedure log_action();

-- Trigger for profiles
drop trigger if exists audit_profiles on profiles;
create trigger audit_profiles
  after insert or update or delete on profiles
  for each row execute procedure log_action();

-- Trigger for contacts
drop trigger if exists audit_contacts on contacts;
create trigger audit_contacts
  after insert or update or delete on contacts
  for each row execute procedure log_action();

-- Trigger for deals
drop trigger if exists audit_deals on deals;
create trigger audit_deals
  after insert or update or delete on deals
  for each row execute procedure log_action();

-- Trigger for email_campaigns
drop trigger if exists audit_email_campaigns on email_campaigns;
create trigger audit_email_campaigns
  after insert or update or delete on email_campaigns
  for each row execute procedure log_action();

-- Trigger for subscriptions
drop trigger if exists audit_subscriptions on subscriptions;
create trigger audit_subscriptions
  after insert or update or delete on subscriptions
  for each row execute procedure log_action();
