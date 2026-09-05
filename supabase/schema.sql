-- OROLADO — coller dans Supabase → SQL Editor → Run
-- Projet : tubyuyxuswwzebicrhkg
-- Auth → Providers → Email : désactiver « Confirm email » pour une connexion immédiate.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  email text,
  phone text,
  country_code text default '+225',
  role text not null default 'user',
  mode text not null default 'demo',
  asset_id text not null default 'v100',
  duration int not null default 10,
  consecutive_wins int not null default 0,
  consecutive_losses int not null default 0,
  trades int not null default 0,
  wins int not null default 0,
  demo_trades int not null default 0,
  real_trades int not null default 0,
  real_stake_volume bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vaults (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  demo bigint not null default 1000000,
  real bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  asset_id text not null default 'v100',
  side text not null,
  stake bigint not null,
  duration int not null,
  mode text not null default 'demo',
  payout numeric not null default 1.88,
  entry_price numeric,
  exit_price numeric,
  won boolean,
  net bigint,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  amount bigint not null default 0,
  note text,
  mode text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists transactions_user_created_idx on public.transactions (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.vaults enable row level security;
alter table public.orders enable row level security;
alter table public.transactions enable row level security;

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists vaults_own on public.vaults;
create policy vaults_own on public.vaults
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists orders_own on public.orders;
create policy orders_own on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists transactions_own on public.transactions;
create policy transactions_own on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, phone, country_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'trader'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'country_code', '+225')
  )
  on conflict (id) do nothing;
  insert into public.vaults (user_id, demo, real)
  values (new.id, 1000000, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Crédit dépôt (webhook PHP + service_role uniquement)
create or replace function public.credit_real(p_user uuid, p_amount bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount = 0 then
    return;
  end if;
  insert into public.vaults (user_id, demo, real)
  values (p_user, 1000000, greatest(0, p_amount))
  on conflict (user_id) do update
    set real = greatest(0, public.vaults.real + p_amount),
        updated_at = now();
end;
$$;

revoke all on function public.credit_real(uuid, bigint) from public;
revoke all on function public.credit_real(uuid, bigint) from anon, authenticated;
grant execute on function public.credit_real(uuid, bigint) to service_role;

create or replace function public.increment_balance(p_user uuid, p_amount bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.credit_real(p_user, p_amount);
end;
$$;
revoke all on function public.increment_balance(uuid, bigint) from public, anon, authenticated;
grant execute on function public.increment_balance(uuid, bigint) to service_role;

create or replace function public.debit_real(p_user uuid, p_amount bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v bigint;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'amount');
  end if;
  update public.vaults
    set real = public.vaults.real - p_amount,
        updated_at = now()
    where user_id = p_user and public.vaults.real >= p_amount
    returning real into v;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'insufficient');
  end if;
  return jsonb_build_object('ok', true, 'real', v);
end;
$$;
revoke all on function public.debit_real(uuid, bigint) from public, anon, authenticated;
grant execute on function public.debit_real(uuid, bigint) to service_role;

create table if not exists public.deposits (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount bigint not null default 0,
  status text not null default 'PENDING',
  alias_email text,
  alias_phone text,
  sell_id text,
  operator text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.deposits add column if not exists reference text;
update public.deposits set reference = id where reference is null;
alter table public.deposits enable row level security;
drop policy if exists deposits_own_read on public.deposits;
create policy deposits_own_read on public.deposits
  for select using (auth.uid() = user_id);

create or replace function public.complete_deposit(p_ref text, p_amount bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.deposits%rowtype;
  amt bigint;
begin
  select * into d from public.deposits where id = p_ref for update;
  if not found then
    select * into d from public.deposits where reference = p_ref for update;
  end if;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown');
  end if;
  if d.status is distinct from 'PENDING' then
    return jsonb_build_object('ok', true, 'duplicate', true, 'amount', d.amount, 'user_id', d.user_id);
  end if;
  amt := coalesce(nullif(p_amount, 0), d.amount);
  -- Plancher à 100 FCFA : l'admin peut tester un vrai dépôt sans frais inutiles.
  if amt is null or amt < 100 then
    return jsonb_build_object('ok', false, 'reason', 'amount');
  end if;
  update public.deposits
    set status = 'COMPLETED', amount = amt, completed_at = now()
    where id = d.id;
  insert into public.vaults (user_id, demo, real)
  values (d.user_id, 1000000, amt)
  on conflict (user_id) do update
    set real = public.vaults.real + amt,
        updated_at = now();
  insert into public.transactions (id, user_id, type, amount, note, mode)
  values ('dep_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16), d.user_id, 'deposit', amt, 'Recharge Maketou', 'real');
  return jsonb_build_object('ok', true, 'amount', amt, 'user_id', d.user_id);
end;
$$;
revoke all on function public.complete_deposit(text, bigint) from public, anon, authenticated;
grant execute on function public.complete_deposit(text, bigint) to service_role;

-- Règlement de trade : additif, atomique et rejouable sans double crédit.
create table if not exists public.trade_settlements (
  order_id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount bigint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.trade_settlements enable row level security;
drop policy if exists trade_settlements_own_read on public.trade_settlements;
create policy trade_settlements_own_read on public.trade_settlements
  for select using (auth.uid() = user_id);

create or replace function public.resolve_trade(p_user uuid, p_order text, p_amount bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v bigint;
begin
  if p_user is null or p_order is null or p_order = '' then
    return jsonb_build_object('ok', false, 'reason', 'args');
  end if;

  -- Le PK bloque tout second règlement du même trade, même simultané.
  begin
    insert into public.trade_settlements (order_id, user_id, amount)
    values (p_order, p_user, coalesce(p_amount, 0));
  exception when unique_violation then
    select real into v from public.vaults where user_id = p_user;
    return jsonb_build_object('ok', true, 'duplicate', true, 'real', coalesce(v, 0));
  end;

  if coalesce(p_amount, 0) = 0 then
    select real into v from public.vaults where user_id = p_user;
    return jsonb_build_object('ok', true, 'real', coalesce(v, 0));
  end if;

  -- Addition faite par la base : deux trades qui expirent ensemble s'additionnent.
  insert into public.vaults (user_id, demo, real)
  values (p_user, 1000000, greatest(0, p_amount))
  on conflict (user_id) do update
    set real = greatest(0, public.vaults.real + p_amount),
        updated_at = now()
  returning real into v;

  return jsonb_build_object('ok', true, 'real', coalesce(v, 0));
end;
$$;
revoke all on function public.resolve_trade(uuid, text, bigint) from public, anon, authenticated;
grant execute on function public.resolve_trade(uuid, text, bigint) to service_role;

create or replace function public.protect_vault_real()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' then
    NEW.real := OLD.real;
  elsif TG_OP = 'INSERT' then
    NEW.real := 0;
  end if;
  return NEW;
end;
$$;
drop trigger if exists vaults_protect_real on public.vaults;
create trigger vaults_protect_real
  before insert or update on public.vaults
  for each row execute procedure public.protect_vault_real();

alter table public.deposits replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.deposits;
exception when duplicate_object then null;
end $$;

alter table public.profiles replica identity full;
alter table public.vaults replica identity full;
alter table public.orders replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.vaults;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;
