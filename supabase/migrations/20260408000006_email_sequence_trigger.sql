-- Trigger to handle automated email sequences
create or replace function handle_email_sequence()
returns trigger as $$
declare
  next_campaign record;
begin
  -- Only trigger on 'sent' events to initiate the next step in a sequence
  if (NEW.event_type != 'sent') then
    return NEW;
  end if;

  -- Find the next campaign in the sequence
  for next_campaign in 
    select * from email_campaigns 
    where parent_campaign_id = NEW.campaign_id 
    and is_sequence = true 
    and status != 'failed'
  loop
    -- Insert into email_queue for the next step, delayed by delay_hours
    insert into email_queue (
      org_id,
      "to",
      subject,
      html_body,
      campaign_id,
      contact_id,
      scheduled_for
    )
    select 
      c.org_id,
      ct.email,
      t.subject,
      t.html_body,
      next_campaign.id,
      NEW.contact_id,
      now() + (next_campaign.delay_hours * interval '1 hour')
    from email_campaigns c
    join email_templates t on c.template_id = t.id
    join contacts ct on ct.id = NEW.contact_id
    where c.id = next_campaign.id;
  end loop;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_email_sent_sequence on email_events;
create trigger on_email_sent_sequence
  after insert on email_events
  for each row execute function handle_email_sequence();
