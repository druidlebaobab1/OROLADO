# OROLADO — règles du propriétaire

- SIMULATIONS VERROUILLÉES (2026-10-19) : ne pas modifier `indices.json`, `feed_lib.php`, `fair_table.php`
  (ni les modèles des indices dans `js/indices.js`) sans demande explicite du propriétaire.
  Contrôle : `sh scripts/sim-lock.sh` doit afficher « OK ».
- Ne jamais retirer `try_sb`, `supabase_put_order`, `supabase_get_order` ; pas de remboursement auto sur échec `with_db_lock`.
- Marge 6 % ; 12 langues ; aucun texte qui déborde, de l'iPhone SE à la télé.
