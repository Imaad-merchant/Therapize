-- =============================================
-- Brain Language Persistence Migration
-- Run this in your Supabase SQL Editor
-- =============================================

-- Add brain_insights JSONB to sessions (stores latest real-time analysis)
alter table public.sessions
  add column if not exists brain_insights jsonb,
  add column if not exists chat_mode text default 'listening',
  add column if not exists persona_id text default 'sage';

-- Relax chat_mode constraint to allow challenger mode
do $$ begin
  alter table public.sessions drop constraint if exists sessions_chat_mode_check;
exception when others then null; end $$;

alter table public.sessions
  add constraint sessions_chat_mode_check
  check (chat_mode in ('listening', 'solution', 'challenger'));

-- Insight snapshots table (history of brain analysis over time per session)
create table if not exists public.insight_snapshots (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  insights jsonb not null,
  message_count integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_insight_snapshots_session_id on public.insight_snapshots(session_id);
create index if not exists idx_insight_snapshots_user_id on public.insight_snapshots(user_id);
create index if not exists idx_insight_snapshots_created_at on public.insight_snapshots(created_at desc);

alter table public.insight_snapshots enable row level security;

create policy "Users can view own insight snapshots" on public.insight_snapshots
  for select using (auth.uid() = user_id);
create policy "Users can create own insight snapshots" on public.insight_snapshots
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own insight snapshots" on public.insight_snapshots
  for delete using (auth.uid() = user_id);

-- Saved memories table (insights users explicitly saved)
create table if not exists public.saved_memories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete set null,
  source_type text not null check (source_type in ('pattern', 'key_insight', 'cognitive_map', 'theme')),
  payload jsonb not null,
  note text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_saved_memories_user_id on public.saved_memories(user_id);
create index if not exists idx_saved_memories_created_at on public.saved_memories(created_at desc);

-- RLS
alter table public.saved_memories enable row level security;

create policy "Users can view own saved memories" on public.saved_memories
  for select using (auth.uid() = user_id);
create policy "Users can create own saved memories" on public.saved_memories
  for insert with check (auth.uid() = user_id);
create policy "Users can update own saved memories" on public.saved_memories
  for update using (auth.uid() = user_id);
create policy "Users can delete own saved memories" on public.saved_memories
  for delete using (auth.uid() = user_id);
