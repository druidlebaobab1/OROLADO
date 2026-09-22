-- Gains et pertes : le coffre accepte les centimes, et le serveur peut baisser OU monter le solde.
-- À coller UNE FOIS dans Supabase → SQL Editor → Run.
-- Ne modifie pas complete_deposit ni les webhooks de paiement.

alter table public.vaults
  alter column real type numeric(14,2)
  using round(coalesce(real, 0)::numeric, 2);

alter table public.orders
  alter column stake type numeric(14,2)
  using round(coalesce(stake, 0)::numeric, 2);

alter table public.orders
  alter column net type numeric(14,2)
  using round(coalesce(net, 0)::numeric, 2);

alter table public.trade_settlements
  alter column amount type numeric(14,2)
  using round(coalesce(amount, 0)::numeric, 2);

drop function if exists public.increment_balance(uuid, bigint);
drop function if exists public.credit_real(uuid, bigint);
drop function if exists public.debit_real(uuid, bigint);
drop function if exists public.resolve_trade(uuid, text, bigint);

create or replace function public.credit_real(p_user uuid, p_amount numeric)
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
revoke all on function public.credit_real(uuid, numeric) from public, anon, authenticated;
grant execute on function public.credit_real(uuid, numeric) to service_role;

create or replace function public.increment_balance(p_user uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.credit_real(p_user, p_amount);
end;
$$;
revoke all on function public.increment_balance(uuid, numeric) from public, anon, authenticated;
grant execute on function public.increment_balance(uuid, numeric) to service_role;

create or replace function public.debit_real(p_user uuid, p_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v numeric;
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
revoke all on function public.debit_real(uuid, numeric) from public, anon, authenticated;
grant execute on function public.debit_real(uuid, numeric) to service_role;

create or replace function public.resolve_trade(p_user uuid, p_order text, p_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v numeric;
begin
  if p_user is null or p_order is null or p_order = '' then
    return jsonb_build_object('ok', false, 'reason', 'args');
  end if;
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
  insert into public.vaults (user_id, demo, real)
  values (p_user, 1000000, greatest(0, p_amount))
  on conflict (user_id) do update
    set real = greatest(0, public.vaults.real + p_amount),
        updated_at = now()
  returning real into v;
  return jsonb_build_object('ok', true, 'real', coalesce(v, 0));
end;
$$;
revoke all on function public.resolve_trade(uuid, text, numeric) from public, anon, authenticated;
grant execute on function public.resolve_trade(uuid, text, numeric) to service_role;

create or replace function public.protect_vault_real()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  begin
    jwt_role := coalesce(auth.jwt() ->> 'role', auth.role(), '');
  exception when others then
    jwt_role := coalesce(auth.role(), '');
  end;
  if jwt_role = 'service_role'
     or current_user in ('postgres', 'supabase_admin', 'service_role') then
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
