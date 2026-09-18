-- OROLADO admin — index additifs uniquement (jamais DROP / TRUNCATE).
-- À coller dans Supabase → SQL Editor → Run si besoin.
-- CREATE INDEX IF NOT EXISTS : sans effet si l’index existe déjà.

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists profiles_last_seen_idx on public.profiles (last_seen desc);
create index if not exists profiles_role_idx on public.profiles (role);

create index if not exists deposits_created_at_idx on public.deposits (created_at desc);
create index if not exists deposits_status_idx on public.deposits (status);
create index if not exists deposits_user_status_idx on public.deposits (user_id, status);

create index if not exists withdrawals_created_at_idx on public.withdrawals (created_at desc);
create index if not exists withdrawals_status_idx on public.withdrawals (status);
create index if not exists withdrawals_user_status_idx on public.withdrawals (user_id, status);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_user_status_idx on public.orders (user_id, status);

create index if not exists transactions_created_at_idx on public.transactions (created_at desc);
create index if not exists transactions_type_idx on public.transactions (type);
create index if not exists vaults_real_idx on public.vaults (real desc);
