<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-10-22 — PRÉDICTIONS « Predict » (pred_lib.php). Fausse caisse, dossier temporaire, Binance SIMULÉ (aucun accès à internet).
 * Vérifie : cotes = floor((1 − m) ÷ p × 100) ÷ 100 (marge mPred), import (refus expliqués), fermeture à closeAt (sp_bet),
 * simple seulement, règlement automatique crypto (above / range, secours data-api.binance.vision), prix pile sur une limite
 * → « à vérifier » (jamais deviné), injoignable → réessayé, paiement UNE fois (idempotent), non-auto reste ouvert.
 * Lancer : php scripts/test-pred.php
 */
$tmp = sys_get_temp_dir() . '/orolado_pred_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php', 'sb_lib.php', 'pred_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('ADMIN_EMAIL=admin@orolado.com');
$bal = []; $keys = []; $credits = 0;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$credits) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') { if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient']; $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2); return ['ok' => true, 'real' => $bal[$u]]; }
  if ($fn === 'resolve_trade') { $k = $u . '|' . $a['p_order']; if (!isset($keys[$k])) { $keys[$k] = 1; $credits++; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); } return ['ok' => true, 'real' => $bal[$u]]; }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
$GLOBALS['SB_FAKE_PUSH'] = [];
// Binance simulé : $BIN[symbol] = clôture de la bougie 1 min lue au règlement, $TICK[symbol] = prix actuel, $DOWN[host] = injoignable,
// clôtures journalières : rendements ±3 % en alternance (volatilité journalière ≈ 3 %) ; $ASK = adresses lues
$BIN = []; $TICK = []; $DOWN = []; $ASK = []; $SHIFT = 0;
$GLOBALS['PRED_FAKE_FETCH'] = function (string $url) use (&$BIN, &$TICK, &$DOWN, &$ASK, &$SHIFT): string {
  $ASK[] = $url;
  $host = (string) parse_url($url, PHP_URL_HOST);
  if (!empty($DOWN[$host])) return '';
  parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
  $sym = (string) ($q['symbol'] ?? '');
  if (str_contains($url, '/ticker/price')) return isset($TICK[$sym]) ? json_encode(['symbol' => $sym, 'price' => (string) $TICK[$sym]]) : '{"code":-1121,"msg":"Invalid symbol."}';
  if (($q['interval'] ?? '') === '1d') {
    if (!isset($TICK[$sym])) return '[]';
    $out = []; $c = (float) $TICK[$sym];
    for ($i = 0; $i < 31; $i++) { $out[] = [$i * 86400000, '1', '1', '1', (string) $c, '1']; $c *= exp($i % 2 ? 0.03 : -0.03); }
    return json_encode($out);
  }
  $px = $BIN[$sym] ?? null;
  if ($px === null) return '[]';
  $t = (int) $q['startTime'] + $SHIFT;
  return json_encode([[$t, '1', '2', '0.5', (string) $px, '10', $t + 59999, '0', 5, '0', '0', '0']]);
};
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php'; require $tmp . '/sports_lib.php';
foreach (['seed-2026-10', 'seed-2026-10b', 'seed-2026-10c', 'seed-2026-10d', 'seed-2026-10e', 'market-2026-10-21', 'draw-2026-10', 'stale-2026-10'] as $fl) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $fl . '.done', '1');
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $B];
save_db(orolado_data_file(), $db); $bal[$A] = 1000.0; $bal[$B] = 1000.0;
$ua = $db['users']['u_a']; $ub = $db['users']['u_b'];
$ev = static function (string $id): array { foreach (sp_events() as $e) if ($e['id'] === $id) return $e; return []; };
$odd = static function (string $id, string $k) use ($ev): float { foreach ((array) ($ev($id)['opts'] ?? []) as $o) if ($o['k'] === $k) return (float) $o['odd']; return 0.0; };

echo "1) Cotes depuis les chances (marge mPred)\n";
check('fonctions présentes', function_exists('pred_import') && function_exists('pred_auto_run') && function_exists('pred_odd'));
check('p 0,50, marge 15 % → 1,70', pred_odd(0.5, 0.15) === 1.70);
check('p 0,30 → 2,83 (arrondi vers le bas)', pred_odd(0.3, 0.15) === 2.83);
check('p 0,62 → 1,37 ; p 0,03 → 28,33', pred_odd(0.62, 0.15) === 1.37 && pred_odd(0.03, 0.15) === 28.33);
check('p 0,85 → 1,01 au minimum (jamais 1,00)', pred_odd(0.85, 0.15) === 1.01 && pred_odd(0.99, 0.15) === 1.01);
check('marge par défaut 20 % (réglage mPred, posé une fois)', abs(pred_margin() - 0.20) < 1e-9 && (float) sb_config()['mPred'] === 20.0);
sb_config_save(['mPred' => 12.34]);
check('mPred enregistrée au dixième (12,3 %)', (float) sb_config()['mPred'] === 12.3 && abs(pred_margin() - 0.123) < 1e-9);
sb_config_save(['mPred' => 20]);
check('marge changée par l’admin : gardée (la mise en place à 20 % ne revient pas)', (float) sb_config()['mPred'] === 20.0 && sb_config_save(['mPred' => 18])['ok'] && (float) sb_config()['mPred'] === 18.0);
sb_config_save(['mPred' => 20]);

echo "2) Import du fichier\n";
$now = time();
$C1 = $now + 86400; $R2 = intdiv($now + 2 * 86400, 60) * 60; $C10 = $now + 10 * 86400; $R12 = $now + 12 * 86400;
$iso = static fn(int $t): string => gmdate('Y-m-d\TH:i:s\Z', $t);
$raw = strtr((string) file_get_contents(__DIR__ . '/fixtures/pred-sample.json'), ['{C1}' => $iso($C1), '{R2}' => $iso($R2), '{C10}' => $iso($C10), '{R12}' => $iso($R12), '{D2}' => gmdate('d/m', $R2)]);
$r = pred_import($raw);
$why = []; foreach ((array) ($r['skipped'] ?? []) as $s) $why[$s['id']] = $s['reason'];
check('4 événements ajoutés, 4 refusés', !empty($r['ok']) && $r['added'] === 4 && count($why) === 4, json_encode($r, JSON_UNESCAPED_UNICODE));
check('refus expliqués : catégorie, somme des chances, date passée, auto sans règle', str_contains($why['bad-cat'] ?? '', 'catégorie') && str_contains($why['bad-sum'] ?? '', 'somme') && str_contains($why['bad-past'] ?? '', 'passé') && str_contains($why['bad-auto'] ?? '', 'rule'));
$btc = 'pdbtcabove1'; $eth = 'pdethrange1'; $fed = 'pdfeddec'; $osc = 'pdoscarfilm';
check('cotes (marge 20 %) : 50 % → 1,60 ; Fed 62 / 35 / 3 % → 1,29 / 2,28 / 26,66', $odd($btc, 'yes') === 1.60 && $odd($fed, 'cut') === 1.29 && $odd($fed, 'hold') === 2.28 && $odd($fed, 'hike') === 26.66);
$e = $ev($fed);
check('événement : catégorie, fermeture closeAt, résolution resolveAt, source, titre anglais', $e['sport'] === 'pred' && $e['cat'] === 'economie' && (int) $e['start'] === $C10 && (int) $e['endAt'] === $R12 && str_starts_with($e['pred']['src'], 'https://www.federalreserve.gov') && ($e['i18n']['en'] ?? '') !== '');
check('titre long gardé en entier (jamais coupé)', mb_strlen_safe($ev($osc)['title']) > 100);
$pub = []; foreach (sp_public_events() as $x) $pub[$x['id']] = $x;
check('le téléphone reçoit pred, cat, options fr + en, « question » (simple seulement)', !empty($pub[$fed]['pred']) && $pub[$fed]['cat'] === 'economie' && $pub[$fed]['opts'][0]['en'] === 'Cut' && $pub[$fed]['q'] === true && count($pub[$osc]['opts']) === 5);
$r2 = pred_import($raw);
check('réimport : mis à jour, rien en double', !empty($r2['ok']) && $r2['added'] === 0 && $r2['updated'] === 4 && count(array_filter(sp_events(), 'pred_is')) === 4);
check('JSON invalide refusé', empty(pred_import('{oops')['ok']));
$bad = json_decode($raw, true); $bad[2]['options'][0]['p'] = 0.3; $bad[2]['options'][1]['p'] = 0.3; $bad[2]['options'][2]['p'] = 0.36; $bad[2]['id'] = 'fed-x';
sb_config_save(['mPred' => 2]); // chances 0,96 au total, marge 2 % : somme des 1/cote ≈ 0,98
$tight = pred_import([$bad[2]]);
sb_config_save(['mPred' => 20]);
check('cotes qui feraient perdre la maison à coup sûr : refusées', $tight['added'] === 0 && str_contains((string) ($tight['skipped'][0]['reason'] ?? ''), 'perdrait'), json_encode($tight, JSON_UNESCAPED_UNICODE));


check('fiche : explication fr / en, source, heure de la réponse, auto + actif envoyés au téléphone', ($pub[$btc]['desc']->fr ?? '') !== '' && ($pub[$btc]['desc']->en ?? '') !== '' && $pub[$btc]['src'] !== '' && $pub[$btc]['end'] === $R2 && $pub[$btc]['auto'] === true && $pub[$btc]['asset'] === 'BTCUSDT');
check('best_performer (« meilleure crypto ») : refusé à l’import', str_contains((string) (pred_import([['id' => 'best1', 'cat' => 'crypto', 'title_fr' => 'Meilleure crypto ?', 'options' => [['k' => 'btc', 'fr' => 'BTC', 'p' => 0.5], ['k' => 'eth', 'fr' => 'ETH', 'p' => 0.5]], 'closeAt' => $iso($C1), 'resolveAt' => $iso($R2), 'auto' => true, 'asset' => 'BTCUSDT', 'rule' => ['type' => 'best_performer']]])['skipped'][0]['reason'] ?? ''), 'meilleure'));

echo "3) Crypto : cotes recalculées sur le prix ACTUEL (jamais des cotes fixes pendant des semaines)\n";
check('crypto importée : SUSPENDUE tant que les cotes n’ont pas été calculées sur le prix actuel', !empty($pub[$btc]['susp']) && ($r0 = sp_bet(load_db(), $ua, 'real', 1, [['ev' => $btc, 'k' => 'yes']]))['ok'] === false && $r0['reason'] === 'susp');
$TICK = ['BTCUSDT' => 81000, 'ETHUSDT' => 2400, 'DOGEUSDT' => 0.45];
$ASK = [];
$rp = pred_reprice_job($now, true);
$vol = pred_vol('BTCUSDT', $now);
$pY = pred_p_above(81000, 80000, $vol * 1.1, ($R2 - $now) / 86400);
check('prix lu sur data-api.binance.vision (ticker), volatilité sur 30 clôtures journalières (≈ 3 %)', str_starts_with($ASK[0] ?? '', 'https://data-api.binance.vision/api/v3/ticker/price?symbol=') && abs($vol - 0.03) < 0.002 && (bool) preg_grep('#/klines\?symbol=BTCUSDT&interval=1d&limit=31#', $ASK), json_encode([$vol, $ASK[0] ?? '']));
check('cotes = floor((1 − 20 %) ÷ p) avec p log-normal : Oui ' . pred_odd($pY, 0.2) . ' / Non ' . pred_odd(1 - $pY, 0.2), $rp['repriced'] === 2 && $odd($btc, 'yes') === pred_odd($pY, 0.2) && $odd($btc, 'no') === pred_odd(1 - $pY, 0.2) && $pY > 0.5 && $pY < 0.75 && empty($ev($btc)['pred']['susp']), json_encode([$pY, $odd($btc, 'yes'), $rp]));
$eE = $ev($eth); $sP = 0.0; foreach ($eE['opts'] as $o) $sP += $o['p'];
check('tranches Ethereum : chances recalculées (somme = 100 %), cotes ≤ 40', abs($sP - 1) < 0.002 && max(array_column($eE['opts'], 'odd')) <= 40.0, json_encode(array_map(static fn($o) => [$o['k'], $o['p'], $o['odd']], $eE['opts'])));
check('Fed (pas crypto) : cotes du fichier inchangées', $odd($fed, 'cut') === 1.29);
$oldY = $odd($btc, 'yes');
$TICK['BTCUSDT'] = 95000;
check('5 min au plus : pas de nouveau calcul 1 min après', !empty(pred_reprice_job($now + 60)['skip']) && $odd($btc, 'yes') === $oldY);
pred_reprice_job($now + 310);
$pub2 = []; foreach (sp_public_events($now + 310) as $x) $pub2[$x['id']] = $x;
check('Bitcoin monte à 95 000 : « Oui » (> 97 %) RETIRÉ du téléphone, « Non » à la cote maximale prudente (40)', array_column($pub2[$btc]['opts'], 'k') === ['no'] && $odd($btc, 'no') === 40.0 && !empty(array_values(array_filter($ev($btc)['opts'], static fn($o) => $o['k'] === 'yes'))[0]['off']));
$rY = sp_bet(load_db(), $ua, 'real', 5, [['ev' => $btc, 'k' => 'yes', 'odd' => $oldY]], $now + 320);
check('pari sur le choix retiré, à l’ancienne cote : refusé', $rY['ok'] === false && $rY['reason'] === 'closed');
$TICK['BTCUSDT'] = 81000;
pred_reprice_job($now + 620);
$rO = sp_bet(load_db(), $ua, 'real', 5, [['ev' => $btc, 'k' => 'no', 'odd' => 40.0]], $now + 630);
check('cote affichée plus actuelle : refus « odds » avec la nouvelle cote (le joueur revoit son ticket)', $rO['ok'] === false && $rO['reason'] === 'odds' && abs((float) $rO['odds'][0]['odd'] - $odd($btc, 'no')) < 1e-9);
$DOWN = ['data-api.binance.vision' => true, 'api.binance.com' => true];
pred_reprice_job($now + 930);
check('prix introuvable depuis 5 min : cotes gardées, PAS suspendu encore', empty($ev($btc)['pred']['susp']) && (int) $ev($btc)['pred']['pxAt'] === $now + 620);
$rr = pred_reprice_job($now + 1240);
check('prix introuvable depuis plus de 10 min : paris SUSPENDUS (cadenas)', !empty($ev($btc)['pred']['susp']) && $rr['susp'] >= 1 && ($rs = sp_bet(load_db(), $ua, 'real', 1, [['ev' => $btc, 'k' => 'no']], $now + 1250))['reason'] === 'susp');
$DOWN = ['api.binance.com' => true];
pred_reprice_job($now + 1550);
check('Binance revenu (secours) : cotes recalculées, paris rouverts', empty($ev($btc)['pred']['susp']) && (int) $ev($btc)['pricedAt'] === $now + 1550);
$rS = sp_bet(load_db(), $ua, 'real', 1, [['ev' => $btc, 'k' => 'no']], $now + 1550 + 901);
check('tâche arrêtée : cotes de plus de 15 min → suspendu au pari même sans la tâche (jamais une vieille cote)', $rS['ok'] === false && $rS['reason'] === 'susp');
check('crypto auto : fermeture = closeAt (pas la règle des 72 h : cotes recalculées en continu)', sp_close_at($ev($btc)) === $C1);
$DOWN = [];
$p1 = pred_price('BTCUSDT', $now + 2000);
check('prix actuel (carte) : servi par le serveur, gardé 30 s ; actif inconnu refusé sans lecture', !empty($p1['ok']) && (float) $p1['px'] === 81000.0 && ($ASK = []) === [] && pred_price('BTCUSDT', $now + 2010)['px'] === 81000.0 && empty(pred_price('SHIBUSDT', $now)['ok']) && !$ASK);

echo "4) Paris : simple seulement, fermeture à closeAt\n";
$m1 = sp_admin_save(['title' => 'Real Madrid - Barcelona', 'league' => 'LaLiga', 'sport' => 'foot', 'start' => $now + 3 * 86400, 'opts' => [['label' => 'Real', 'odd' => 2.1], ['label' => 'Nul', 'odd' => 3.3], ['label' => 'Barça', 'odd' => 3.0]]])['id'];
$rc = sp_bet(load_db(), $ua, 'real', 5, [['ev' => $fed, 'k' => 'cut'], ['ev' => $m1, 'k' => 'o0']]);
check('combiné prédiction + match : refusé (« single »)', $rc['ok'] === false && $rc['reason'] === 'single');
$rf = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $fed, 'k' => 'cut']], $C10 - 60);
check('pari 1 min avant closeAt (9 jours après l’import, pas une question de prix) : accepté', $rf['ok'] === true && abs($rf['bet']['pot'] - 12.90) < 1e-9, json_encode($rf));
$rl = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $fed, 'k' => 'cut']], $C10);
check('pari à closeAt : refusé (« closed »)', $rl['ok'] === false && $rl['reason'] === 'closed');
check('question crypto = question de prix (corrélation actif, fermeture ≤ cotes + 72 h)', sp_is_price($ev($btc)) && in_array('asset:btc', sp_corr_groups($ev($btc)), true) && !sp_is_price($ev($osc)));
$ry = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $btc, 'k' => 'yes']], $now + 1600);
$rn = sp_bet(load_db(), $ub, 'real', 20, [['ev' => $btc, 'k' => 'no']], $now + 1600);
$re1 = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $eth, 'k' => 'mid']], $now + 1600);
$re2 = sp_bet(load_db(), $ub, 'real', 10, [['ev' => $eth, 'k' => 'hi']], $now + 1600);
$ro = sp_bet(load_db(), $ub, 'real', 4, [['ev' => $osc, 'k' => 'b']]);
check('paris posés (Bitcoin oui / non, Ethereum milieu / haut, Oscar)', $ry['ok'] && $rn['ok'] && $re1['ok'] && $re2['ok'] && $ro['ok'] && $bal[$A] === 970.0 && $bal[$B] === 966.0, json_encode([$bal[$A], $bal[$B], $ry, $re1]));
$rb = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $btc, 'k' => 'yes']], $C1);
check('Bitcoin : pari à closeAt refusé', $rb['ok'] === false && $rb['reason'] === 'closed');

echo "5) Après resolveAt : résultat PROPOSÉ (prix Binance), JAMAIS payé automatiquement — l'admin confirme\n";
$ASK = []; $BIN = ['BTCUSDT' => 81234.5, 'ETHUSDT' => 2400.0];
$cr0 = $credits; $bA = $bal[$A]; $bB = $bal[$B];
$o = pred_auto_run(load_db(), $R2 - 600, true);
check('avant resolveAt : rien n’est lu', !$ASK && $ev($btc)['status'] === 'open');
$o = pred_auto_run(load_db(), $R2 + 2, true);
check('bougie qui se ferme à resolveAt pas encore publiée : on attend', !$ASK);
$o = pred_auto_run(load_db(), $R2 + 120, true);
check('bougie 1 min qui se FERME à resolveAt (startTime = resolveAt − 60 s), lue sur data-api.binance.vision', str_starts_with($ASK[0] ?? '', 'https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=' . (($R2 - 60) * 1000) . '&limit=1'), $ASK[0] ?? '');
$cB = (array) ($ev($btc)['predChk'] ?? []); $cE = (array) ($ev($eth)['predChk'] ?? []);
check('proposé : Bitcoin 81 234,5 > 80 000 → « Oui » ; Ethereum 2 400 → « Entre », avec le prix', ($cB['sug'] ?? '') === 'yes' && ($cE['sug'] ?? '') === 'mid' && (float) $cB['px'] === 81234.5 && ($o['sug'] ?? 0) === 2, json_encode($o, JSON_UNESCAPED_UNICODE));
check('RIEN n’est payé, rien n’est réglé ; paris fermés (statut « closed »)', $credits === $cr0 && $bal[$A] === $bA && $bal[$B] === $bB && $ev($btc)['status'] === 'closed' && $ev($eth)['status'] === 'closed');
$ASK = [];
pred_auto_run(load_db(), $R2 + 300, true);
check('proposition faite : plus jamais relu', !$ASK);
$pl = pred_admin_list();
$gB = array_values(array_filter($pl['events'], static fn($x) => $x['id'] === $btc))[0] ?? [];
check('liste admin : « à vérifier » avec la proposition, le prix et la source', ($gB['grp'] ?? '') === 'chk' && ($gB['chk']['sug'] ?? '') === 'yes' && $gB['src'] !== '');
$st = sp_admin_settle(load_db(), $btc, 'yes');
check('l’admin confirme d’un clic : A payé 10 × ' . $ry['bet']['odd'] . ' (sa cote), B rien', !empty($st['ok']) && abs($bal[$A] - ($bA + sp_floor2(10 * $ry['bet']['odd']))) < 1e-9 && $bal[$B] === $bB);
$bA2 = $bal[$A]; $cr1 = $credits;
check('2e confirmation refusée : jamais payé deux fois', empty(sp_admin_settle(load_db(), $btc, 'no')['ok']) && $bal[$A] === $bA2 && $credits === $cr1);
$st2 = sp_admin_settle(load_db(), $eth, 'hi');
check('l’admin peut choisir un AUTRE résultat que la proposition (Ethereum : « Plus de 2 500 $ » → B payé)', !empty($st2['ok']) && abs($bal[$B] - ($bB + sp_floor2(10 * $re2['bet']['odd']))) < 1e-9 && $bal[$A] === $bA2);
check('Oscar (pas automatique) : toujours ouvert, jamais lu', $ev($osc)['status'] === 'open' && !preg_grep('/oscar/i', $ASK));

echo "6) Prix pile sur la limite → « à vérifier » sans proposition (jamais deviné)\n";
$R3 = intdiv($now + 3 * 86400, 60) * 60;
$mk = static function (string $id, array $rule, array $opts, string $asset = 'BTCUSDT') use ($iso, $C1, $R3): string {
  $r = pred_import([['id' => $id, 'cat' => 'crypto', 'title_fr' => 'Test ' . $id . ' ?', 'title_en' => 'Test ' . $id . '?', 'options' => $opts, 'closeAt' => $iso($C1), 'resolveAt' => $iso($R3), 'auto' => true, 'asset' => $asset, 'rule' => $rule, 'source' => 'https://www.binance.com/']]);
  return $r['added'] === 1 ? 'pd' . preg_replace('/[^a-z0-9]/', '', $id) : '';
};
$yn = [['k' => 'yes', 'fr' => 'Oui', 'en' => 'Yes', 'p' => 0.5], ['k' => 'no', 'fr' => 'Non', 'en' => 'No', 'p' => 0.5]];
$e1 = $mk('edge1', ['type' => 'above', 'value' => 90000], $yn);
$e2 = $mk('edge2', ['type' => 'range', 'ranges' => [[null, 2300], [2300, 2500], [2500, null]]], [['k' => 'a', 'fr' => 'A', 'p' => 0.3], ['k' => 'b', 'fr' => 'B', 'p' => 0.4], ['k' => 'c', 'fr' => 'C', 'p' => 0.3]], 'ETHUSDT');
$e3 = $mk('below1', ['type' => 'below', 'value' => 0.5], $yn, 'DOGEUSDT');
check('3 questions de test publiées', $e1 !== '' && $e2 !== '' && $e3 !== '');
$BIN = ['BTCUSDT' => 90000, 'ETHUSDT' => 2500.0, 'DOGEUSDT' => 0.4];
$bA = $bal[$A]; $cr2 = $credits;
pred_auto_run(load_db(), $R3 + 120, true);
$c1 = (array) ($ev($e1)['predChk'] ?? []); $c2 = (array) ($ev($e2)['predChk'] ?? []); $c3 = (array) ($ev($e3)['predChk'] ?? []);
check('Bitcoin pile 90 000 : « à vérifier » SANS proposition, avec le prix', empty($c1['sug']) && !empty($c1['final']) && (float) $c1['px'] === 90000.0 && str_contains((string) $c1['why'], 'limite'), json_encode($c1, JSON_UNESCAPED_UNICODE));
check('Ethereum pile 2 500 (limite de tranche) : sans proposition', empty($c2['sug']) && !empty($c2['final']));
check('Dogecoin 0,4 < 0,5 (« below ») → proposé « Oui »', ($c3['sug'] ?? '') === 'yes' && $ev($e3)['status'] === 'closed');
check('aucun argent n’a bougé', $bal[$A] === $bA && $credits === $cr2);
$ASK = [];
pred_auto_run(load_db(), $R3 + 600, true);
check('« à vérifier » : plus jamais relu tout seul', !$ASK);
$st = sp_admin_settle(load_db(), $e1, 'void');
check('l’admin peut annuler (mises rendues) : réglé une fois', !empty($st['ok']) && $ev($e1)['result'] === 'void');

echo "7) Binance injoignable → secours api.binance.com, puis réessai\n";
$R4 = intdiv($now + 4 * 86400, 60) * 60;
$e4 = (pred_import([['id' => 'down1', 'cat' => 'crypto', 'title_fr' => 'Bitcoin au-dessus de 70 000 $ ?', 'options' => $yn, 'closeAt' => $iso($C1), 'resolveAt' => $iso($R4), 'auto' => true, 'asset' => 'BTCUSDT', 'rule' => ['type' => 'above', 'value' => 70000]]])['added'] ?? 0) ? 'pddown1' : '';
$BIN = ['BTCUSDT' => 72000.0]; $DOWN = ['data-api.binance.vision' => true]; $ASK = [];
pred_auto_run(load_db(), $R4 + 120, true);
check('data-api injoignable → api.binance.com : proposé « Oui »', ($ev($e4)['predChk']['sug'] ?? '') === 'yes' && (string) ($ev($e4)['predPx']['src'] ?? '') === 'api.binance.com');
$R5 = intdiv($now + 5 * 86400, 60) * 60;
pred_import([['id' => 'down3', 'cat' => 'crypto', 'title_fr' => 'Bitcoin au-dessus de 71 000 $ ?', 'options' => $yn, 'closeAt' => $iso($C1), 'resolveAt' => $iso($R5), 'auto' => true, 'asset' => 'BTCUSDT', 'rule' => ['type' => 'above', 'value' => 71000]]]);
$e6 = 'pddown3';
$DOWN = ['api.binance.com' => true, 'data-api.binance.vision' => true];
pred_auto_run(load_db(), $R5 + 120, true);
$c6 = (array) ($ev($e6)['predChk'] ?? []);
check('les deux injoignables : « à vérifier » (réessayé plus tard), rien proposé', $ev($e6)['status'] === 'closed' && $c6 && empty($c6['final']) && empty($c6['sug']) && str_contains((string) $c6['why'], 'injoignable'));
$DOWN = []; $SHIFT = 60000;
pred_auto_run(load_db(), $R5 + 900, false);
check('réponse avec la bougie d’une AUTRE minute : refusée (jamais un autre prix)', empty($ev($e6)['predChk']['sug']));
$SHIFT = 0;
@touch(sp_dir() . DIRECTORY_SEPARATOR . 'pred-job.at', $R5 + 900 - 120);
pred_auto_run(load_db(), $R5 + 1500, false);
check('Binance revenu : proposé au passage suivant (72 000 > 71 000 → « Oui »)', ($ev($e6)['predChk']['sug'] ?? '') === 'yes' && $ev($e6)['status'] === 'closed');
$ASK = [];
$o = pred_auto_run(load_db(), $R5 + 1530, false);
check('tâche de fond : au plus une fois par minute', !empty($o['skip']) && !$ASK);

echo "7b) Admin : image et explication\n";
$png = base64_encode(hex2bin('89504e470d0a1a0a0000000d4948445200000002000000020802000000fdd49a730000001649444154789c63f8cfc0f09f81e13f03c37f0600247a05fbb5c6e0b20000000049454e44ae426082'));
$ed = pred_admin_edit($fed, ['img' => 'data:image/png;base64,' . $png, 'desc_fr' => 'Décision officielle de la Fed.', 'desc_en' => '']);
$pubE = []; foreach (sp_public_events() as $x) $pubE[$x['id']] = $x;
check('image gardée chez nous (clé), explication fr enregistrée, anglais vide retiré ; le téléphone reçoit la vignette', !empty($ed['ok']) && preg_match('/^[a-f0-9]{16}$/', $ed['img']) && ($pubE[$fed]['img'] ?? '') === $ed['img'] && ($pubE[$fed]['desc']->fr ?? '') === 'Décision officielle de la Fed.' && !isset($pubE[$fed]['desc']->en), json_encode($ed));
check('image retirée ; texte trop lourd / pas PNG refusé', !empty(pred_admin_edit($fed, ['img' => 'none'])['ok']) && empty($ev($fed)['img']) && empty(pred_admin_edit($fed, ['img' => 'data:image/jpeg;base64,AAAA'])['ok']));
check('cotes et choix inchangés par la modification', $odd($fed, 'cut') === 1.29);

echo "8) Marge changée, réimport, rangement\n";
sb_config_save(['mPred' => 10]);
$n = pred_reprice();
check('marge 10 % : cotes des prédictions OUVERTES (hors crypto auto) recalculées (Fed 62 % → 1,45), pari déjà pris garde 1,29', $n >= 1 && $odd($fed, 'cut') === 1.45 && abs((float) (sp_my_bets('u_a')[count(sp_my_bets('u_a')) - 1]['odd'] ?? 0) - 1.29) < 1e-9);
sb_config_save(['mPred' => 20]);
$r3 = pred_import($raw);
$why3 = []; foreach ((array) ($r3['skipped'] ?? []) as $s) $why3[$s['id']] = $s['reason'];
check('réimport : réglés non touchés (« déjà fermé ou réglé »), ouverts remis à 20 %', str_contains($why3['btc-above-1'] ?? '', 'réglé') && $odd($fed, 'cut') === 1.29 && $ev($btc)['result'] === 'yes');
$list = []; for ($i = 0; $i < 320; $i++) $list[] = ['id' => 'x' . $i, 'status' => $i % 2 ? 'settled' : 'open'];
$pr = sp_prune_events($list);
check('rangement (300 au plus) : seuls des événements RÉGLÉS partent', count($pr) === 300 && count(array_filter($pr, static fn($x) => $x['status'] === 'open')) === 160);
$opens = []; for ($i = 0; $i < 320; $i++) $opens[] = ['id' => 'o' . $i, 'status' => 'open'];
check('… jamais un ouvert (même au-delà de 300)', count(sp_prune_events($opens)) === 320);

echo "\n" . ($fail ? "ÉCHEC : $fail test(s), $pass OK\n" : "Tout est OK ($pass tests)\n");
exit($fail ? 1 : 0);
