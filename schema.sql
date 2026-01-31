-- Final Corrected and Idempotent Supabase SQL Schema for EDORA

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  role text default 'user',
  department text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Documents Table
create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  filename text not null,
  file_type text,
  source_type text check (source_type in ('upload', 'excel_import', 'manual')),
  storage_path text,
  metadata jsonb default '{}'::jsonb,
  status text default 'todo',
  description text,
  area text,
  start_date date,
  target_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

-- 5. Clean up existing policies to avoid "already exists" errors
do $$ 
begin
    -- Profile policies
    drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
    drop policy if exists "Users can update own profile" on public.profiles;
    
    -- Document policies
    drop policy if exists "Users can view own documents" on public.documents;
    drop policy if exists "Users can insert own documents" on public.documents;
    drop policy if exists "Users can update own documents" on public.documents;
    drop policy if exists "Users can delete own documents" on public.documents;
end $$;

-- 6. Create Policies
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);

create policy "Users can view own documents" 
  on public.documents for select using (auth.uid() = user_id);

create policy "Users can insert own documents" 
  on public.documents for insert with check (auth.uid() = user_id);

create policy "Users can update own documents" 
  on public.documents for update using (auth.uid() = user_id);

create policy "Users can delete own documents" 
  on public.documents for delete using (auth.uid() = user_id);

-- 7. Trigger Logic
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
