-- OROLADO — colonnes d'argent en « montant avec centimes » (numeric 14,2).
-- Pourquoi : dans le schéma d'origine, ces colonnes étaient des nombres ENTIERS (bigint).
-- Un dépôt crypto de 6,95 $ ou un retrait de 12,50 $ était alors refusé par la base
-- (sans message) : le solde était crédité mais la ligne manquait dans l'historique et l'admin.
--
-- Sans risque : un entier devient un montant identique (12 → 12.00). Aucune donnée perdue.
-- Si une colonne est déjà en numeric, la ligne ne change rien. Peut être relancé.
-- À coller dans Supabase → SQL Editor → Run.

alter table public.deposits     alter column amount             type numeric(14,2) using amount::numeric;
alter table public.withdrawals  alter column amount             type numeric(14,2) using amount::numeric;
alter table public.transactions alter column amount             type numeric(14,2) using amount::numeric;
alter table public.profiles     alter column real_deposit_total type numeric(14,2) using real_deposit_total::numeric;
alter table public.profiles     alter column real_stake_volume  type numeric(14,2) using real_stake_volume::numeric;
