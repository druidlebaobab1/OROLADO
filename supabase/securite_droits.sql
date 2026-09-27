-- OROLADO — droits dans la base : le téléphone du joueur LIT ses lignes, le SERVEUR écrit.
-- Pourquoi : avant, un joueur connecté pouvait écrire lui-même (avec sa clé publique) dans
-- « withdrawals », « transactions », « orders » et dans son « profile » (rôle, montants).
-- Il pouvait donc créer un faux retrait « en attente » visible dans l'admin.
--
-- Sans risque pour les données : aucune ligne n'est modifiée ni supprimée, seuls les droits
-- changent. Le serveur (clé service_role) garde tous ses droits. Peut être relancé.
-- À coller dans Supabase → SQL Editor → Run.

-- 1) Retraits, opérations, ordres, dépôts, règlements : LECTURE de ses propres lignes seulement.
drop policy if exists withdrawals_own on public.withdrawals;
drop policy if exists withdrawals_own_read on public.withdrawals;
create policy withdrawals_own_read on public.withdrawals for select using (auth.uid() = user_id);

drop policy if exists transactions_own on public.transactions;
drop policy if exists transactions_own_read on public.transactions;
create policy transactions_own_read on public.transactions for select using (auth.uid() = user_id);

drop policy if exists orders_own on public.orders;
drop policy if exists orders_own_read on public.orders;
create policy orders_own_read on public.orders for select using (auth.uid() = user_id);

revoke insert, update, delete on public.withdrawals  from anon, authenticated;
revoke insert, update, delete on public.transactions from anon, authenticated;
revoke insert, update, delete on public.orders       from anon, authenticated;
revoke insert, update, delete on public.deposits     from anon, authenticated;
do $$ begin
  if to_regclass('public.trade_settlements') is not null then
    execute 'revoke insert, update, delete on public.trade_settlements from anon, authenticated';
  end if;
end $$;

-- 2) Profil : le joueur peut toujours changer son nom, son téléphone, ses réglages ;
--    mais le rôle, l'e-mail et les montants restent ceux écrits par le serveur.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  jwt_role text;
  o jsonb;
  n jsonb;
  k text;
begin
  -- Seul le téléphone d'un joueur (rôle « authenticated » ou « anon ») est bridé. Le serveur
  -- (service_role) et les fonctions internes de la base passent.
  -- ATTENTION : la fonction doit rester « security invoker ». En « security definer »,
  -- current_user vaut toujours le propriétaire (postgres) et le gardien laisse TOUT passer
  -- (c'était le cas avant : un joueur pouvait réécrire son solde réel).
  if current_user not in ('authenticated', 'anon') then
    return NEW;
  end if;
  begin
    jwt_role := coalesce(auth.jwt() ->> 'role', '');
  exception when others then
    jwt_role := '';
  end;
  if jwt_role = 'service_role' then
    return NEW;
  end if;
  n := to_jsonb(NEW);
  if TG_OP = 'UPDATE' then
    o := to_jsonb(OLD);
    foreach k in array array['role', 'email', 'real_deposit_total', 'real_stake_volume', 'real_trades',
                             'trades', 'wins', 'demo_trades', 'consecutive_wins', 'consecutive_losses'] loop
      if n ? k then n := jsonb_set(n, array[k], coalesce(o -> k, 'null'::jsonb)); end if;
    end loop;
  else
    if n ? 'role' then n := jsonb_set(n, '{role}', '"user"'::jsonb); end if;
    foreach k in array array['real_deposit_total', 'real_stake_volume', 'real_trades'] loop
      if n ? k then n := jsonb_set(n, array[k], '0'::jsonb); end if;
    end loop;
  end if;
  NEW := jsonb_populate_record(NEW, n);
  return NEW;
end;
$$;
drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
  before insert or update on public.profiles
  for each row execute procedure public.protect_profile_fields();

-- 3) Solde réel du coffre : le gardien d'avant ne protégeait RIEN (voir plus haut), réparé ici.
--    Et double protection : le téléphone n'a plus le droit d'écrire que la colonne « demo ».
revoke insert, update on public.vaults from anon, authenticated;
grant insert (user_id, demo) on public.vaults to authenticated;
grant update (demo, updated_at) on public.vaults to authenticated;

create or replace function public.protect_vault_real()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  jwt_role text;
begin
  -- Seul le téléphone d'un joueur (rôle « authenticated » ou « anon ») est bridé. Le serveur
  -- (service_role) et les fonctions internes de la base passent.
  -- ATTENTION : la fonction doit rester « security invoker ». En « security definer »,
  -- current_user vaut toujours le propriétaire (postgres) et le gardien laisse TOUT passer
  -- (c'était le cas avant : un joueur pouvait réécrire son solde réel).
  if current_user not in ('authenticated', 'anon') then
    return NEW;
  end if;
  begin
    jwt_role := coalesce(auth.jwt() ->> 'role', '');
  exception when others then
    jwt_role := '';
  end;
  if jwt_role = 'service_role' then
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
