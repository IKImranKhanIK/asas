-- Run this in Supabase SQL Editor

-- Notifications table
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null check (type in ('missed_checkin', 'missed_clockin', 'general')),
  read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "notifications_read" on notifications for select using (recipient_id = auth.uid());
create policy "notifications_update" on notifications for update using (recipient_id = auth.uid());
create policy "notifications_insert" on notifications for insert with check (true);

-- Patrol schedules table
create table patrol_schedules (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade not null,
  guard_id uuid references profiles(id) on delete cascade,
  interval_minutes integer not null default 120,
  start_time time not null default '00:00',
  end_time time not null default '23:59',
  is_active boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table patrol_schedules enable row level security;

create policy "schedules_read" on patrol_schedules for select using (auth.role() = 'authenticated');
create policy "schedules_write" on patrol_schedules for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'supervisor'))
);
