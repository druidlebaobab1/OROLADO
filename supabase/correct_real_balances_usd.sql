-- Correction URGENTE soldes réels FCFA → USD (÷ 500)
-- 1000 FCFA = $2.00 | 1800 → 3.60 | 88 → 0.18
-- Ne touche PAS à vaults.demo
-- Exécuter UNE FOIS dans le SQL Editor Supabase.

BEGIN;

UPDATE public.vaults
SET real = ROUND((COALESCE(real, 0)::numeric / 500), 2)
WHERE COALESCE(real, 0) >= 20;

-- Optionnel : totaux dépôts sur profiles si la colonne existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'real_deposit_total'
  ) THEN
    EXECUTE $u$
      UPDATE public.profiles
      SET real_deposit_total = ROUND((COALESCE(real_deposit_total, 0)::numeric / 500), 2)
      WHERE COALESCE(real_deposit_total, 0) >= 20
    $u$;
  END IF;
END $$;

COMMIT;
