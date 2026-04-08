-- Function to send verification email for booking
create or replace function handle_booking_verification_email()
returns trigger as $$
declare
  org_name text;
  verification_url text;
  html_content text;
begin
  -- Get the organization name
  select name into org_name from organizations where id = NEW.org_id;

  -- Construct verification URL (assuming localhost for now, should be env-configurable)
  verification_url := 'http://localhost:5173/verify-booking/' || NEW.token;

  -- Construct HTML email
  html_content := '
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #8a2be2;">Termin-Bestätigung erforderlich</h2>
      <p>Hallo ' || (NEW.contact_data->>'full_name') || ',</p>
      <p>vielen Dank für Ihre Buchungsanfrage bei <strong>' || org_name || '</strong>.</p>
      <p>Um Ihren Termin am <strong>' || to_char((NEW.appointment_data->>'start_time')::timestamp, 'DD.MM.YYYY "um" HH24:MI "Uhr"') || '</strong> fest zu buchen, klicken Sie bitte auf den folgenden Link:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="' || verification_url || '" style="background-color: #8a2be2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Termin jetzt bestätigen</a>
      </div>
      <p style="color: #666; font-size: 12px;">Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Der Link ist 2 Stunden gültig.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 10px; color: #999;">Powered by Unicum Tech</p>
    </div>
  ';

  -- Insert into email_queue
  insert into email_queue (org_id, to_email, subject, html_body)
  values (
    NEW.org_id,
    NEW.contact_data->>'email',
    'Bestätigen Sie Ihren Termin bei ' || org_name,
    html_content
  );

  return NEW;
end;
$$ language plpgsql;

-- Trigger
drop trigger if exists on_booking_verification_created on booking_verifications;
create trigger on_booking_verification_created
  after insert on booking_verifications
  for each row execute function handle_booking_verification_email();
