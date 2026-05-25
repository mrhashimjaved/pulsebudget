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

create table if not exists public.finance_transactions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  category text not null,
  date date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists finance_transactions_user_date_idx
  on public.finance_transactions (user_id, date desc);

alter table public.finance_transactions enable row level security;

drop policy if exists "Users can read their own finance transactions" on public.finance_transactions;
create policy "Users can read their own finance transactions"
  on public.finance_transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own finance transactions" on public.finance_transactions;
create policy "Users can create their own finance transactions"
  on public.finance_transactions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own finance transactions" on public.finance_transactions;
create policy "Users can update their own finance transactions"
  on public.finance_transactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own finance transactions" on public.finance_transactions;
create policy "Users can delete their own finance transactions"
  on public.finance_transactions
  for delete
  to authenticated
  using (auth.uid() = user_id);
