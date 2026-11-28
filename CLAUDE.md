# OROLADO — règles du propriétaire

- SIMULATIONS VERROUILLÉES (2026-10-19) : ne pas modifier `indices.json`, `feed_lib.php`, `fair_table.php`
  (ni les modèles des indices dans `js/indices.js`) sans demande explicite du propriétaire.
  Contrôle : `sh scripts/sim-lock.sh` doit afficher « OK ».
- Ne jamais retirer `try_sb`, `supabase_put_order`, `supabase_get_order` ; pas de remboursement auto sur échec `with_db_lock`.
- MARGE PARIS SPORTIFS VERROUILLÉE (2026-11-01, changée par le propriétaire le 2026-11-12 : 1 %, puis le 2026-11-20 : 3 %) : la marge maison des paris sportifs (`sb_lib.php`)
  est fixée EN DUR à **3 %** par la constante `SB_MARGE_FIXE = 0.03`, répartie ÉGALEMENT sur tous les choix (cote = (1 − m) / p,
  dans `sb_wodd`) : un peu au-dessus de 1xBet (~3 % sur les grands matchs). Tout calcul de cote — avant-match (`sb_margin`), autres
  sports (`sb_o_margin`) — DOIT utiliser `SB_MARGE_FIXE` (le direct a sa propre marge, voir ci-dessous). Ne pas la rebrancher sur le réglage/les migrations, et ne pas la
  changer, sans demande explicite du propriétaire.
- MARGE DU DIRECT VERROUILLÉE (propriétaire, 2026-11-12, passée à 3 % le 2026-11-16, puis à 5 % le 2026-11-20) : les paris EN DIRECT (live) ont leur marge fixée EN DUR à **5 %**
  par `SB_MARGE_DIRECT = 0.05` (`sb_live_markets`, même répartition égale). Les matchs pas encore commencés sont à 3 %.
  Contrôle : `php scripts/test-sb-marge.php` doit finir par « 0 échec(s) ». Ne pas changer sans demande explicite du propriétaire.
- RÈGLE 1xBet (propriétaire, 2026-11-16) : AVANT-MATCH seulement, choix par choix, si la cote de 1xBet est plus haute que la nôtre,
  la nôtre devient 1xBet + 0,01 (`sb_beat_1x`, `SB_1X_PLUS = 0.01`). Sécurités : cote 1xBet ignorée si > moyenne + 15 % ; le match
  garde toujours ≥ 0,5 % pour la maison (`SB_1X_MIN_MARGE`). En direct : impossible (le fournisseur ne nomme pas les bookmakers).
  Contrôle : `php scripts/test-sb.php` (« 0 échec(s) »). Ne pas changer sans demande explicite du propriétaire.
- PROPRIÉTAIRE SEUL (2026-11-14, à retenir) : « je suis seul, je reste parfois 24 h sans me connecter ». Tout ce qui touche
  l'argent et les résultats doit marcher TOUT SEUL et en sécurité, sans clic de l'admin (règlements, versements affiliés,
  retraits automatiques dans leurs plafonds, annulations). Quand rien de sûr n'est possible : rendre les mises plutôt que
  payer au hasard, et prévenir l'admin. Lui expliquer les choses en mots très simples, avec un exemple.
- MARGE DES JEUX (propriétaire, 2026-11-28) : **15 %** sur tous les jeux casino / action / live (`CASINO_EDGE = 0.85`, `LIVE_SPORT_EDGE = 0.85`,
  machines `casino_ext_house` à 85 % avec gros gains ÷ 3 à ÷ 6 et jamais au-delà de ×50 (`CASINO_EXT_MAX_MULT`), avion jusqu’à ×1000) et sur les matchs virtuels (`VF_MARGE = 0.15`). Jeux classiques aussi à 85 % (2026-11-28 : pile ou face ×1,70, roulette ×1,74 / ×2,61 / ×31,4,
  baccara, dragon, sic bo, roue, cascade, keno, loto ≤ ×900, etc. — serveur `casino_instant` ET textes des jeux). Trading inchangé (×1,90).
  Ne pas changer sans demande explicite du propriétaire. 12 langues ; aucun texte qui déborde, de l'iPhone SE à la télé.

- FLUTTERWAVE RETIRÉ (propriétaire, 2026-11-28 : « je suis bloqué là-bas, supprime-le complètement ») : ne JAMAIS le rebrancher.
  `orolado_flw_configured()` renvoie toujours false, api/flutterwave-* supprimés. Dépôts : GeniusPay (minimum 3 $, `OROLADO_DEP_MIN`),
  Maketou en secours (comme avant), crypto inchangée (tout montant reçu est crédité).

- DÉMO FACILE VERROUILLÉE (propriétaire, 2026-11-28) : en DÉMO du trading, pour TOUT LE MONDE (visiteurs et comptes), retour ≈ 130 %
  (≈ 68 trades gagnés sur 100 à 90 %), payouts AFFICHÉS inchangés (90 %, 500 %, 1000 %, 5000 %) ; `OROLADO_DEMO_EASY_ALL = true`
  (trade_lib.php `orolado_trade_demo_easy`) + `easyVerdict` (js/engine.js, visiteur). Message « Démo facile… » (m_demoEasy, 12 langues)
  au 1er trade démo puis tous les 30. Le RÉEL n'est jamais touché (×1,90). Contrôle : `php scripts/test-trade-demo-easy.php`.
  Ne pas changer sans demande explicite du propriétaire.

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

## Goûts du propriétaire (à relire avant chaque changement visible)
- Pas de « : » ni de point « · » de séparation inutiles dans les libellés (ex. « Total de buts : Plus de 3,5 », « Pari simple · 1 ») :
  il trouve ça pas professionnel. Toujours lui montrer 5 exemples en images et le laisser choisir avant de changer un affichage.
- Paris (reçus, Mes paris) = la partie la plus importante du site : tout droit, aligné, une ligne par texte avec « … » si trop long,
  jamais de chevauchement ; vérifier avec des noms d'équipes très longs et sur les 3 tailles de téléphone avant de mettre en ligne.
- Messages aux joueurs : professionnels, signés « L'équipe OROLADO », sans emoji d'excuse.
