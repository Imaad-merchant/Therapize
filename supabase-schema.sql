-- =============================================
-- Sage Therapy App - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  age integer,
  avatar_url text,
  questionnaire jsonb default '{}'::jsonb,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions table
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  summary text,
  mood_score integer check (mood_score >= 1 and mood_score <= 10),
  themes text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  ended_at timestamptz
);

-- Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Insights table
create table public.insights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('personality', 'behavior', 'pattern', 'growth')),
  title text not null,
  description text not null,
  confidence float default 0.5 check (confidence >= 0 and confidence <= 1),
  source_session_ids uuid[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, title)
);

-- Login history table
create table public.login_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_created_at on public.sessions(created_at);
create index idx_messages_session_id on public.messages(session_id);
create index idx_messages_created_at on public.messages(created_at);
create index idx_insights_user_id on public.insights(user_id);
create index idx_login_history_user_id on public.login_history(user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.insights enable row level security;
alter table public.login_history enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Sessions: users can CRUD their own sessions
create policy "Users can view own sessions" on public.sessions
  for select using (auth.uid() = user_id);
create policy "Users can create own sessions" on public.sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on public.sessions
  for update using (auth.uid() = user_id);
create policy "Users can delete own sessions" on public.sessions
  for delete using (auth.uid() = user_id);

-- Messages: users can CRUD their own messages
create policy "Users can view own messages" on public.messages
  for select using (auth.uid() = user_id);
create policy "Users can create own messages" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own messages" on public.messages
  for delete using (auth.uid() = user_id);

-- Insights: users can view/delete their own insights
create policy "Users can view own insights" on public.insights
  for select using (auth.uid() = user_id);
create policy "Users can delete own insights" on public.insights
  for delete using (auth.uid() = user_id);

-- Login history: users can view their own
create policy "Users can view own login history" on public.login_history
  for select using (auth.uid() = user_id);
create policy "Users can insert own login history" on public.login_history
  for insert with check (auth.uid() = user_id);
