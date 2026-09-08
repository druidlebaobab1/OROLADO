-- Migration Supabase vaults FCFA → USD (1 USD = 600 FCFA)
-- À exécuter UNE FOIS dans le SQL Editor Supabase après déploiement.
-- Idempotent si vous filtrez via une colonne meta ; sinon sauvegardez d'abord.

BEGIN;

UPDATE public.vaults
SET
  real = ROUND((COALESCE(real, 0)::numeric / 600), 2),
  demo = 1000000
WHERE true;

-- Si profiles stocke les totaux dépôts / wagering :
UPDATE public.profiles
SET
  real_deposit_total = ROUND((COALESCE(real_deposit_total, 0)::numeric / 600), 2)
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'real_deposit_total'
);

COMMIT;
