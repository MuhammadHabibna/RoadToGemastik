-- Create a table for Tactical Schedule targets
create table if not exists tactical_targets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  target_date date not null,
  target_text text not null,
  target_type text default 'normal', -- 'normal' or 'deadline'
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, target_date)
);

-- SAFETY CHECK: Ensure columns exist if table already existed
alter table tactical_targets add column if not exists user_id uuid references auth.users not null default auth.uid();
alter table tactical_targets add column if not exists target_type text default 'normal';

-- Enable RLS
alter table tactical_targets enable row level security;

-- Create Policies (Drop first to avoid duplicates/errors if re-running)
drop policy if exists "Users can insert their own targets" on tactical_targets;
create policy "Users can insert their own targets"
  on tactical_targets for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can view their own targets" on tactical_targets;
create policy "Users can view their own targets"
  on tactical_targets for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can update their own targets" on tactical_targets;
create policy "Users can update their own targets"
  on tactical_targets for update
  using ( auth.uid() = user_id );

drop policy if exists "Users can delete their own targets" on tactical_targets;
create policy "Users can delete their own targets"
  on tactical_targets for delete
  using ( auth.uid() = user_id );

-- 1. Create daily_logs table (Permanent Storage)
create table if not exists daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  focus_category text not null,
  description text not null,
  duration_minutes integer not null,
  mood_score integer default 3,
  xp_value integer default 0, -- Store calculated XP permanently
  
  constraint mood_range check (mood_score between 1 and 5)
);

-- SAFETY CHECK: Ensure columns exist
alter table daily_logs add column if not exists user_id uuid references auth.users not null default auth.uid();
alter table daily_logs add column if not exists xp_value integer default 0;

-- Enable RLS for daily_logs
alter table daily_logs enable row level security;

-- Policies for daily_logs
drop policy if exists "Users can insert their own logs" on daily_logs;
create policy "Users can insert their own logs"
  on daily_logs for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can view their own logs" on daily_logs;
create policy "Users can view their own logs"
  on daily_logs for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can delete their own logs" on daily_logs;
create policy "Users can delete their own logs"
  on daily_logs for delete
  using ( auth.uid() = user_id );

-- 3. Create milestones table (Strategic Roadmap)
create table if not exists milestones (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  target_date date,
  status text default 'Pending', -- 'Pending' or 'Done'
  position integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SAFETY CHECK: Ensure milestones columns
alter table milestones add column if not exists user_id uuid references auth.users not null default auth.uid();
alter table milestones add column if not exists position integer;

-- Enable RLS
alter table milestones enable row level security;

-- Policies
drop policy if exists "Users can all on milestones" on milestones;
create policy "Users can all on milestones"
  on milestones for all
  using ( auth.uid() = user_id );
