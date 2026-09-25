-- OROLADO — jeu équitable : durcissement (OPTIONNEL, recommandé).
-- À coller UNE FOIS dans Supabase → SQL Editor → Run.
--
-- Depuis la mise à jour « jeu équitable », seuls le serveur PHP (clé service_role) écrit les
-- ordres. Le téléphone du joueur n'a plus besoin d'écrire dans la table orders : on lui laisse
-- la LECTURE de ses propres ordres (historique), plus l'écriture.
-- Les fonctions d'argent utilisées par le serveur (debit_real, resolve_trade) existent déjà
-- (schema.sql / trade_ledger_numeric.sql) : rien d'autre à changer.

drop policy if exists orders_own on public.orders;
drop policy if exists orders_own_read on public.orders;
create policy orders_own_read on public.orders
  for select using (auth.uid() = user_id);
