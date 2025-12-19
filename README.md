# Gemastik 2026 Prep Dashboard

A high-performance "Mission Control" dashboard for Gemastik preparation.

## Tech Stack
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Auth)
- Tailwind CSS + Shadcn/UI
- Recharts + React Day Picker
- Zustand

## Database Schema (Supabase)

Run the following SQL in your Supabase SQL Editor to setup the tables:

```sql
-- 1. Daily Logs
create table daily_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  focus_category text not null, -- e.g. "Coding", "Research"
  description text not null,
  mood_score int check (mood_score >= 1 and mood_score <= 5),
  duration_minutes int default 0
);

-- 2. Milestones
create table milestones (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text not null,
  target_date date not null,
  status text check (status in ('Pending', 'In Progress', 'Done')) default 'Pending',
  position int default 0
);

-- 3. Skills
create table skills (
  id uuid default gen_random_uuid() primary key,
  category text not null unique, -- e.g. "Python", "Public Speaking"
  current_score int check (current_score >= 0 and current_score <= 100) default 0,
  target_score int check (target_score >= 0 and target_score <= 100) default 100
);

-- Seed Data (Optional)
insert into skills (category, current_score, target_score) values
('Coding', 60, 90),
('Math', 40, 80),
('Writing', 70, 85),
('Teamwork', 50, 90),
('Public Speaking', 30, 80);

insert into milestones (title, target_date, status) values
('Learn NLP Basics', '2025-12-31', 'In Progress'),
('Form Gemastik Team', '2026-02-01', 'Pending'),
('Submit Proposal', '2026-04-10', 'Pending');
```
