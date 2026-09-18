-- OROLADO — coller TOUT ce texte dans Supabase → SQL Editor → Run
-- Aucune suppression (pas de DROP, pas de TRUNCATE).

create table if not exists public.withdrawals (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount bigint not null default 0,
  status text not null default 'pending',
  operator text,
  phone text,
  reference text,
  created_at timestamptz not null default now()
);

alter table public.withdrawals add column if not exists operator text;
alter table public.withdrawals add column if not exists phone text;
alter table public.withdrawals add column if not exists reference text;
alter table public.withdrawals enable row level security;

do $$ begin
  create policy withdrawals_own on public.withdrawals
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then
  null;
end $$;

do $$ begin
  if to_regclass('public.profiles') is not null then
    execute 'create index if not exists profiles_created_at_idx on public.profiles (created_at desc)';
    execute 'create index if not exists profiles_last_seen_idx on public.profiles (last_seen desc)';
    execute 'create index if not exists profiles_role_idx on public.profiles (role)';
  end if;
  if to_regclass('public.deposits') is not null then
    execute 'create index if not exists deposits_created_at_idx on public.deposits (created_at desc)';
    execute 'create index if not exists deposits_status_idx on public.deposits (status)';
    execute 'create index if not exists deposits_user_status_idx on public.deposits (user_id, status)';
    execute 'create index if not exists deposits_user_created_idx on public.deposits (user_id, created_at desc)';
  end if;
  if to_regclass('public.withdrawals') is not null then
    execute 'create index if not exists withdrawals_created_at_idx on public.withdrawals (created_at desc)';
    execute 'create index if not exists withdrawals_status_idx on public.withdrawals (status)';
    execute 'create index if not exists withdrawals_user_status_idx on public.withdrawals (user_id, status)';
    execute 'create index if not exists withdrawals_user_created_idx on public.withdrawals (user_id, created_at desc)';
  end if;
  if to_regclass('public.orders') is not null then
    execute 'create index if not exists orders_created_at_idx on public.orders (created_at desc)';
    execute 'create index if not exists orders_status_idx on public.orders (status)';
    execute 'create index if not exists orders_user_status_idx on public.orders (user_id, status)';
  end if;
  if to_regclass('public.transactions') is not null then
    execute 'create index if not exists transactions_created_at_idx on public.transactions (created_at desc)';
    execute 'create index if not exists transactions_type_idx on public.transactions (type)';
  end if;
  if to_regclass('public.vaults') is not null then
    execute 'create index if not exists vaults_real_idx on public.vaults (real desc)';
  end if;
end $$;
