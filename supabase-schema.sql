create table if not exists public.finance_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.finance_profiles enable row level security;

drop policy if exists "Users can read their own finance profile" on public.finance_profiles;
create policy "Users can read their own finance profile"
  on public.finance_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own finance profile" on public.finance_profiles;
create policy "Users can create their own finance profile"
  on public.finance_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own finance profile" on public.finance_profiles;
create policy "Users can update their own finance profile"
  on public.finance_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
