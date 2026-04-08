-- Public access policies for booking flow
-- Allowing anyone to view organization basic info via slug
drop policy if exists "Public can view organizations" on organizations;
create policy "Public can view organizations" on organizations
  for select using (true);

-- Allowing anyone to view booking settings for the booking UI
drop policy if exists "Public can view booking settings" on booking_settings;
create policy "Public can view booking settings" on booking_settings
  for select using (true);
