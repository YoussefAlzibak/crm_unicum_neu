-- 1. Create Profile and Organization automatically on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_org_id uuid;
  user_full_name text;
begin
  -- Get name from metadata if available
  user_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.email);

  -- 1. Create Profile
  insert into public.profiles (id, full_name, created_at, updated_at)
  values (new.id, user_full_name, now(), now())
  on conflict (id) do nothing;

  -- 2. Create Default Organization
  insert into public.organizations (name, slug, branding, created_at, updated_at)
  values (
    coalesce(new.raw_user_meta_data->>'company_name', 'Meine Organisation'),
    lower(replace(coalesce(new.raw_user_meta_data->>'company_name', 'org-' || substring(new.id::text, 1, 8)), ' ', '-')),
    '{"primaryColor": "#8a2be2", "logoUrl": "/img/logo.png"}'::jsonb,
    now(),
    now()
  )
  returning id into new_org_id;

  -- 3. Associate User with Org as Admin
  insert into public.org_members (org_id, user_id, role, created_at)
  values (new_org_id, new.id, 'admin', now())
  on conflict do nothing;

  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Also ensure existing users (like the one currently logged in) have a profile and org if missing
-- This is a one-time safety check
do $$
declare
  r record;
  new_org_id uuid;
begin
  for r in select * from auth.users loop
    -- Check profile
    if not exists (select 1 from public.profiles where id = r.id) then
      insert into public.profiles (id, full_name) values (r.id, r.email);
    end if;

    -- Check if user is in any org
    if not exists (select 1 from public.org_members where user_id = r.id) then
      insert into public.organizations (name, slug)
      values ('Meine Organisation', 'org-' || substring(r.id::text, 1, 8))
      returning id into new_org_id;

      insert into public.org_members (org_id, user_id, role)
      values (new_org_id, r.id, 'admin');
    end if;
  end loop;
end;
$$;
