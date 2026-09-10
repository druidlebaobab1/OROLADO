# Audit — hors périmètre de la refonte

Points vus pendant le travail, **non corrigés** (hors liste du prompt) :

- Les textes des modales **dépôt / retrait / attente paiement** restent parfois tutoyants (`Termine ton paiement…`). Hors paiement : non modifié.
- `js/supabase.js` expose `listOnline` / `countOnline` au client ; le contrôle RLS Supabase n’a pas été revu ici.
- Le ticker de retraits communautaires (`wdTicker`) reste dans l’UI trading ; pas demandé de le retirer.
- Les utilisateurs démo déjà en base avec 1 000 000 $ sont plafonnés **côté client** au prochain chargement ; pas de migration SQL/JSON de masse.
- Le pied de page n’est pas collé sous le pad trading mobile (pour ne pas changer la structure mobile). Liens : écran auth + tiroir profil.
- `JetBrains Mono` retiré : les chiffres de trading utilisent la même famille avec `tabular-nums`.
