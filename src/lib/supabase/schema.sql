-- Run this in your Supabase SQL editor

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'supervisor', 'guard')) default 'guard',
  phone text,
  badge_number text unique,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Locations / patrol points
create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text,
  latitude numeric,
  longitude numeric,
  qr_code text unique default gen_random_uuid()::text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Clock in/out events
create table clock_events (
  id uuid primary key default gen_random_uuid(),
  guard_id uuid references profiles(id) not null,
  type text not null check (type in ('clock_in', 'clock_out')),
  timestamp timestamptz default now(),
  latitude numeric,
  longitude numeric,
  notes text
);

-- Location check-ins via QR scan
create table location_checks (
  id uuid primary key default gen_random_uuid(),
  guard_id uuid references profiles(id) not null,
  location_id uuid references locations(id) not null,
  timestamp timestamptz default now(),
  latitude numeric,
  longitude numeric
);

-- Reports
create table reports (
  id uuid primary key default gen_random_uuid(),
  guard_id uuid references profiles(id) not null,
  title text not null,
  body text not null,
  type text not null check (type in ('incident', 'patrol', 'maintenance', 'other')) default 'patrol',
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')) default 'low',
  location_id uuid references locations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table locations enable row level security;
alter table clock_events enable row level security;
alter table location_checks enable row level security;
alter table reports enable row level security;

-- Profiles: users can read all, only admins can write others
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (
  auth.uid() = id or
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Locations: all authenticated can read, admins/supervisors can write
create policy "locations_read" on locations for select using (auth.role() = 'authenticated');
create policy "locations_write" on locations for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'supervisor'))
);

-- Clock events: guards see own, admins/supervisors see all
create policy "clock_events_read" on clock_events for select using (
  guard_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'supervisor'))
);
create policy "clock_events_insert" on clock_events for insert with check (guard_id = auth.uid());

-- Location checks: guards see own, admins/supervisors see all
create policy "location_checks_read" on location_checks for select using (
  guard_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'supervisor'))
);
create policy "location_checks_insert" on location_checks for insert with check (guard_id = auth.uid());

-- Reports: guards see own, admins/supervisors see all
create policy "reports_read" on reports for select using (
  guard_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'supervisor'))
);
create policy "reports_insert" on reports for insert with check (guard_id = auth.uid());
create policy "reports_update" on reports for update using (
  guard_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'supervisor'))
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'guard')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
