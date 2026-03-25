-- ClauseCheck Supabase Schema
-- Run this in the Supabase SQL editor after creating your project

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Users profile (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  plan text default 'free' check (plan in ('free', 'pro')),
  analyses_this_month int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Projects (documents with their analysis and chat history)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_name text not null,
  document_text text not null,
  html_content text,
  file_type text not null check (file_type in ('pdf', 'docx')),
  position_role text,
  position_description text,
  chat_history jsonb default '[]'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Index for dashboard queries
create index projects_user_id_updated_at on public.projects(user_id, updated_at desc);

-- Contract analyses (optional structured analysis from the /api/analyze route)
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  file_name text not null,
  contract_type text,
  parties text[],
  effective_date text,
  overall_risk_score int,
  overall_risk_level text check (overall_risk_level in ('low', 'medium', 'high', 'critical')),
  executive_summary text,
  clauses jsonb default '[]'::jsonb,
  key_terms text[],
  missing_clauses text[],
  created_at timestamptz default now()
);

alter table public.analyses enable row level security;

create policy "Users can view own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

create index analyses_user_id_created_at on public.analyses(user_id, created_at desc);
