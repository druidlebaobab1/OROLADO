# OROLADO — règles du propriétaire

- SIMULATIONS VERROUILLÉES (2026-10-19) : ne pas modifier `indices.json`, `feed_lib.php`, `fair_table.php`
  (ni les modèles des indices dans `js/indices.js`) sans demande explicite du propriétaire.
  Contrôle : `sh scripts/sim-lock.sh` doit afficher « OK ».
- Ne jamais retirer `try_sb`, `supabase_put_order`, `supabase_get_order` ; pas de remboursement auto sur échec `with_db_lock`.
- MARGE PARIS SPORTIFS VERROUILLÉE (2026-11-01, changée par le propriétaire le 2026-11-12 : 1 %) : la marge maison des paris sportifs (`sb_lib.php`)
  est fixée EN DUR à **1 %** par la constante `SB_MARGE_FIXE = 0.01`, répartie ÉGALEMENT sur tous les choix (cote = (1 − m) / p,
  dans `sb_wodd`) : un peu au-dessus de 1xBet (~3 % sur les grands matchs). Tout calcul de cote — avant-match (`sb_margin`), autres
  sports (`sb_o_margin`) — DOIT utiliser `SB_MARGE_FIXE` (le direct a sa propre marge, voir ci-dessous). Ne pas la rebrancher sur le réglage/les migrations, et ne pas la
  changer, sans demande explicite du propriétaire.
- MARGE DU DIRECT VERROUILLÉE (propriétaire, 2026-11-12) : les paris EN DIRECT (live) ont leur marge fixée EN DUR à **4 %**
  par `SB_MARGE_DIRECT = 0.04` (`sb_live_markets`, même répartition égale). Les matchs pas encore commencés restent à 1 %.
  Contrôle : `php scripts/test-sb-marge.php` doit finir par « 0 échec(s) ». Ne pas changer sans demande explicite du propriétaire.
- Marge 6 % ; 12 langues ; aucun texte qui déborde, de l'iPhone SE à la télé.

## Téléphones du propriétaire (mesures réelles, relevées le 2026-10-20 par le diagnostic « 5 touches sur OROLADO .com »)
- Heure du propriétaire : Népal, UTC+5:45. Ses captures sont à l'heure locale : comparer avec l'heure de mise en ligne
  avant de conclure qu'un correctif « ne marche pas » (souvent son téléphone garde l'ancienne version : vérifier `version=` dans le diagnostic).
- Android (Chrome, compte admin) : fenêtre 360x663 (écran 360x800), dpr 2, barre Chrome en bas. Le site pose `html.is-android` :
  TOUJOURS tester avec un agent Android (ex. `Mozilla/5.0 (Linux; Android 11; SM-A107F) … Chrome/120.0 Mobile Safari/537.36`),
  sinon les règles `is-android` ne s'appliquent pas et le test ment.
- iPhone Safari : fenêtre 430x775, dpr 3 (barre Safari en bas).
- iPhone application installée (écran d'accueil) : fenêtre 430x873, écran 430x932 ; les 59 px du bas (873→932) ne sont PAS
  dessinables par le site (le dessin du bas n'y apparaît pas) ; barre ACHETER/VENDRE : marge basse 6 px, pas de safe-area en plus.
- Avant chaque mise en ligne qui touche l'affichage : capture à ces 3 tailles (Android avec agent Android) + iPhone SE 375x553.
- Profil : style validé = grande photo 104 px au centre, nom normal (1,15 rem), ID / E-mail en lignes fines, pas de grand cadre ;
  fitProfileDrawer (js/app.js) ajuste à la hauteur ; la place libre va au solde, Recharger, adresse et lignes du menu.
- Ne changer QUE ce qui est demandé (ex. « la croix du profil » ≠ toutes les croix du site).
- Google, pages par langue (/en/, /es/… /zh/) : générées depuis index.html. Après CHAQUE modification de index.html :
  `php scripts/gen-lang.php` (contrôle : `php scripts/gen-lang.php --check` doit afficher « OK »).
- Traductions : le site charge `js/i18n/core.js` + `js/i18n/<langue>.js` (générés). Textes à modifier dans `js/i18n-src.js`,
  `js/translations.js`, `js/i18n-zh.js` (logique : `scripts/i18n-core.js`), puis TOUJOURS `node scripts/gen-i18n.js`
  et `php scripts/gen-lang.php` (contrôle : `node scripts/gen-i18n.js --check` doit afficher « OK »).
