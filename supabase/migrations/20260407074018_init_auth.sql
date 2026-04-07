-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Organizations Table
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  branding jsonb default '{"primaryColor": "#8a2be2", "logoUrl": "/img/logo.png"}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Profiles Table (Extends Supabase Auth users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Organization Memberships (M:N)
create table if not exists org_members (
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamp with time zone default now(),
  primary key (org_id, user_id)
);

-- RLS (Row Level Security) - Basic Setup
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table org_members enable row level security;

-- Policies for Profiles
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Policies for Org Members
drop policy if exists "Users can view their own memberships" on org_members;
create policy "Users can view their own memberships" on org_members for select using (auth.uid() = user_id);

-- Policies for Organizations (Access via membership)
drop policy if exists "Members can view their organization" on organizations;
create policy "Members can view their organization" on organizations 
  for select using (
    exists (
      select 1 from org_members 
      where org_id = organizations.id and user_id = auth.uid()
    )
  );

-- Trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_organizations_updated_at on organizations;
create trigger update_organizations_updated_at before update on organizations for each row execute procedure update_updated_at_column();
drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at before update on profiles for each row execute procedure update_updated_at_column();
