<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2810 — Sécurité argent des prédictions (sports_lib.php) : combinés corrélés, questions en simple seulement, plafond de
 * mises par choix, fermeture des questions de prix 72 h après leurs cotes, gains arrondis au cent INFÉRIEUR.
 * Fausse caisse, dossier temporaire : rien ne part en ligne. (SPORTS_LIB=/chemin/ancien/sports_lib.php pour tester une autre version.)
 */
$tmp = sys_get_temp_dir() . '/orolado_paris_safe_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
if (getenv('SPORTS_LIB')) copy((string) getenv('SPORTS_LIB'), $tmp . '/sports_lib.php');
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = [];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') { if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient']; $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2); return ['ok' => true, 'real' => $bal[$u]]; }
  if ($fn === 'resolve_trade') { $k = $u . '|' . $a['p_order']; if (!isset($keys[$k])) { $keys[$k] = 1; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); } return ['ok' => true, 'real' => $bal[$u]]; }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php'; require $tmp . '/sports_lib.php';
foreach (['seed-2026-10.done', 'seed-2026-10b.done', 'seed-2026-10c.done', 'draw-2026-10.done', 'stale-2026-10.done'] as $f) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $f, '1');
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $B];
save_db(orolado_data_file(), $db); $bal[$A] = 2000.0; $bal[$B] = 2000.0;
$ua = $db['users']['u_a']; $ub = $db['users']['u_b'];
$now = time(); $D = 86400;
$mk = static function (array $in) { $r = sp_admin_save($in); return (string) ($r['id'] ?? ''); };
$yn = static fn(float $y, float $n) => [['label' => 'Oui', 'odd' => $y], ['label' => 'Non', 'odd' => $n]];
$ev = static function (string $id): array { foreach (sp_events() as $e) if ($e['id'] === $id) return $e; return []; };
$fn = static fn(string $f): bool => function_exists($f);

echo "1) Combinés : questions en simple seulement, jamais deux choix liés\n";
$q1 = $mk(['title' => 'Bitcoin au-dessus de 80 000 $ le 22/11 à 12 h (UTC) ?', 'league' => 'Crypto · prix Coinbase', 'sport' => 'event', 'start' => $now + 2 * $D, 'endAt' => $now + 3 * $D, 'opts' => $yn(1.62, 2.23), 'logos' => ['q:btc']]);
$q2 = $mk(['title' => 'Bitcoin au-dessus de 85 000 $ le 30/11 à 12 h (UTC) ?', 'league' => 'Crypto · prix Coinbase', 'sport' => 'event', 'start' => $now + 2 * $D, 'endAt' => $now + 3 * $D, 'opts' => $yn(2.23, 1.62), 'logos' => ['q:btc']]);
$q3 = $mk(['title' => 'Ethereum au-dessus de 2 500 $ le 30/11 à 12 h (UTC) ?', 'league' => 'Crypto · prix Coinbase', 'sport' => 'event', 'start' => $now + 2 * $D, 'endAt' => $now + 3 * $D, 'opts' => $yn(2.23, 1.62), 'logos' => ['q:eth']]);
$m1 = $mk(['title' => 'PSG - FC Barcelona', 'league' => 'Ligue des champions', 'sport' => 'foot', 'start' => $now + $D, 'opts' => [['label' => 'PSG', 'odd' => 2.3], ['label' => 'Nul', 'odd' => 3.4], ['label' => 'Barcelona', 'odd' => 2.75]]]);
$m1b = $mk(['title' => 'FC Barcelona - PSG', 'league' => 'Ligue des champions', 'sport' => 'foot', 'start' => $now + $D + 1800, 'opts' => [['label' => 'Barcelona', 'odd' => 2.7], ['label' => 'PSG', 'odd' => 2.4]]]);
$m2 = $mk(['title' => 'Liverpool - Brighton', 'league' => 'Premier League', 'sport' => 'foot', 'start' => $now + $D, 'opts' => [['label' => 'Liverpool', 'odd' => 2.0], ['label' => 'Nul', 'odd' => 3.4], ['label' => 'Brighton', 'odd' => 3.0]]]);
$b0 = $bal[$A];
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $q1, 'k' => 'o1'], ['ev' => $q2, 'k' => 'o1']]);
check('BTC 80k NON + BTC 85k NON dans un combiné : refusé', $r['ok'] === false, json_encode($r));
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $q1, 'k' => 'o1'], ['ev' => $q2, 'k' => 'o1'], ['ev' => $q3, 'k' => 'o1']]);
check('BTC + BTC + ETH (cote ×11 pour ~27 % de chance) : refusé', $r['ok'] === false && in_array($r['reason'] ?? '', ['single', 'corr'], true), json_encode($r));
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $q3, 'k' => 'o0'], ['ev' => $m2, 'k' => 'o0']]);
check('question + match dans un combiné : refusé (« single »)', $r['ok'] === false && ($r['reason'] ?? '') === 'single', json_encode($r));
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $m1, 'k' => 'o0'], ['ev' => $m1b, 'k' => 'o1']]);
check('le même match publié deux fois (PSG - Barça / Barça - PSG) : refusé (« corr »)', $r['ok'] === false && ($r['reason'] ?? '') === 'corr', json_encode($r));
check('aucun argent pris sur les coupons refusés', abs($bal[$A] - $b0) < 0.001);
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $m1, 'k' => 'o0'], ['ev' => $m2, 'k' => 'o0']]);
check('combiné de 2 matchs différents : toujours accepté', $r['ok'] === true && abs($r['bet']['odd'] - 4.60) < 0.001, json_encode($r['bet'] ?? $r));
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $q1, 'k' => 'o1']]);
check('une question seule (simple) : acceptée', $r['ok'] === true);
$g = static fn(string $id) => $fn('sp_corr_groups') ? sp_corr_groups($ev($id)) : [];
check('groupes : 2 questions Bitcoin = même actif', in_array('asset:btc', $g($q1), true) && in_array('asset:btc', $g($q2), true));
check('groupes : Bitcoin et Ethereum = même groupe « crypto »', in_array('crypto', $g($q1), true) && in_array('crypto', $g($q3), true));
check('groupes : 2 matchs différents = aucun groupe commun', $g($m1) && !array_intersect($g($m1), $g($m2)));
$pub = []; foreach (sp_public_events() as $e) $pub[$e['id']] = $e;
check('le téléphone reçoit « question » et les groupes (pour prévenir avant l’envoi)', !empty($pub[$q1]['q']) && in_array('asset:btc', (array) ($pub[$q1]['grp'] ?? []), true) && empty($pub[$m1]['q']));
$js = (string) file_get_contents(__DIR__ . '/../js/sports.js');
$miss = [];
foreach (['en', 'fr', 'es', 'pt', 'ar', 'tr', 'vi', 'id', 'ru', 'de', 'hi', 'zh'] as $l)
  if (!preg_match('/\n    ' . $l . ': \{[^\n]*qOnly: \'[^\']+\'[^\n]*e_single: \'[^\']+\'[^\n]*e_corr: \'[^\']+\'[^\n]*e_cap: \'[^\']+\'/u', $js)) $miss[] = $l;
check('message « simple seulement » traduit dans les 12 langues', !$miss, implode(',', $miss));

echo "2) Plafond de mises par choix (question)\n";
$qc = $mk(['title' => 'Ballon d’Or test : X sacré ?', 'league' => 'Ballon d’Or', 'sport' => 'event', 'start' => $now + 2 * $D, 'endAt' => $now + 3 * $D, 'opts' => $yn(1.85, 1.85), 'logos' => ['q:trophy']]);
$r1 = sp_bet(load_db(), $ua, 'real', 300, [['ev' => $qc, 'k' => 'o0']]);
$r2 = sp_bet(load_db(), $ub, 'real', 250, [['ev' => $qc, 'k' => 'o0']]);
check('300 $ puis 250 $ sur « Oui » : le 2e dépasse 500 $ → refusé (« cap », reste 200 $)', $r1['ok'] === true && $r2['ok'] === false && ($r2['reason'] ?? '') === 'cap' && abs((float) ($r2['maxStake'] ?? 0) - 200) < 0.001, json_encode($r2));
$bB = $bal[$B];
$r3 = sp_bet(load_db(), $ub, 'real', 200, [['ev' => $qc, 'k' => 'o0']]);
check('200 $ (pile la limite) : accepté', $r3['ok'] === true && abs($bal[$B] - ($bB - 200)) < 0.001);
$r4 = sp_bet(load_db(), $ub, 'real', 400, [['ev' => $qc, 'k' => 'o1']]);
check('l’autre choix (« Non ») a son propre plafond : 400 $ accepté', $r4['ok'] === true);
$bal['poor'] = 0;
$pend = count((array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []));
$up = ['id' => 'u_p', 'email' => 'p@gmail.com', 'role' => 'user', 'sbId' => 'cccccccc-1111-2222-3333-444444444444'];
$dbp = load_db(); $dbp['users']['u_p'] = $up; save_db(orolado_data_file(), $dbp);
$r5 = sp_bet(load_db(), $up, 'real', 50, [['ev' => $qc, 'k' => 'o1']]);
check('solde insuffisant : refusé et la place réservée est rendue', $r5['ok'] === false && count((array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: [])) === $pend, json_encode($r5));
$r6 = sp_bet(load_db(), $ub, 'real', 100, [['ev' => $qc, 'k' => 'o1']]);
check('« Non » : 400 + 100 = 500 $ encore possible', $r6['ok'] === true);
if ($fn('sp_admin_odds')) sp_admin_odds($m2, [], 50.0);
$r7 = sp_bet(load_db(), $ua, 'real', 60, [['ev' => $m2, 'k' => 'o2']]);
check('plafond réglé par l’admin sur un match (50 $) : 60 $ refusé', $r7['ok'] === false && ($r7['reason'] ?? '') === 'cap', json_encode($r7));
check('« Mes paris » ne montre jamais une réservation', !array_filter(sp_my_bets('u_b'), static fn($b) => $b['status'] === 'pend'));

echo "3) Questions de prix : fermées au plus tard 72 h après la pose des cotes\n";
$qp = $mk(['title' => 'Solana au-dessus de 105 $ le 30/11 à 12 h (UTC) ?', 'league' => 'Crypto · prix Coinbase', 'sport' => 'event', 'start' => $now + 20 * $D, 'endAt' => $now + 22 * $D, 'opts' => $yn(1.88, 1.88), 'logos' => ['q:sol']]);
$e = $ev($qp);
check('nouvelle question de prix : paris fermés ≤ 72 h après les cotes', (int) $e['start'] <= $now + 72 * 3600 + 5, gmdate('d/m H:i', (int) $e['start']));
check('heure de la réponse gardée (endAt) pour prévenir l’admin au bon moment', (int) ($e['endAt'] ?? 0) === $now + 22 * $D);
$r = sp_bet(load_db(), $ua, 'real', 1, [['ev' => $qp, 'k' => 'o0']], $now + 73 * 3600);
check('pari 73 h après les cotes : refusé (« closed »)', $r['ok'] === false && ($r['reason'] ?? '') === 'closed', json_encode($r));
$qf = $mk(['title' => 'F1 GP test : Leclerc ou Hamilton, qui finit devant ?', 'league' => 'Formule 1 · duel', 'sport' => 'event', 'start' => $now + 20 * $D, 'endAt' => $now + 20 * $D + 9000, 'opts' => [['label' => 'Leclerc', 'odd' => 1.88], ['label' => 'Hamilton', 'odd' => 1.88]], 'logos' => ['q:race']]);
check('une question qui n’est pas un prix (F1) garde sa fermeture', (int) $ev($qf)['start'] === $now + 20 * $D);
$r = $fn('sp_admin_odds') ? sp_admin_odds($qp, ['o0' => 1.80, 'o1' => 1.95], null, $now + 80 * 3600) : ['ok' => false];
$e = $ev($qp);
check('l’admin remet les cotes à jour : mêmes clés, nouvelles cotes, rouvert 72 h', !empty($r['ok']) && $e['opts'][0]['k'] === 'o0' && (float) $e['opts'][0]['odd'] === 1.80 && (int) $e['start'] === $now + 80 * 3600 + 72 * 3600, json_encode($r));
$r = $fn('sp_admin_odds') ? sp_admin_odds($qp, ['o0' => 3.0, 'o1' => 3.0]) : ['ok' => true];
check('cotes qui feraient perdre la maison à coup sûr : refusées', empty($r['ok']));
// ancienne question publiée avant la règle (cotes du 18/10, ouverte jusqu'au 28/11) avec un pari : seule l'heure de fermeture avance
$old = 'eold' . bin2hex(random_bytes(3)); $old2 = 'eold' . bin2hex(random_bytes(3));
sp_with('events.json', static function (array &$s) use ($old, $old2, $now, $D) {
  $s['e'][] = ['id' => $old, 'title' => 'Ethereum au-dessus de 2 500 $ le lundi 30 novembre à 12 h (UTC) ?', 'league' => 'Crypto · prix Coinbase', 'sport' => 'event', 'start' => $now + 30 * $D, 'endAt' => $now + 32 * $D,
    'opts' => [['k' => 'o0', 'label' => 'Oui', 'odd' => 2.23], ['k' => 'o1', 'label' => 'Non', 'odd' => 1.62]], 'maxStake' => 1000, 'status' => 'open', 'createdAt' => $now - 3600, 'logos' => ['q:eth']];
  $s['e'][] = ['id' => $old2, 'title' => 'Or au-dessus de 4 200 $ (LBMA) ?', 'league' => 'Or · prix LBMA', 'sport' => 'event', 'start' => $now + 30 * $D,
    'opts' => [['k' => 'o0', 'label' => 'Oui', 'odd' => 1.88], ['k' => 'o1', 'label' => 'Non', 'odd' => 1.88]], 'maxStake' => 1000, 'status' => 'open', 'createdAt' => $now - 5 * $D, 'logos' => ['q:gold']];
  return true;
});
$rb = sp_bet(load_db(), $ua, 'real', 5, [['ev' => $old, 'k' => 'o1']]);
$before = $ev($old);
$n = $fn('sp_stale_fix') ? sp_stale_fix() : 0;
$after = $ev($old); $after2 = $ev($old2);
check('ancienne question avec un pari : fermeture avancée à cotes du 18/10 + 72 h', !empty($rb['ok']) && (int) $after['start'] === max($now, (int) strtotime('2026-10-18 00:00 UTC') + 72 * 3600) && (int) $after['start'] < (int) $before['start'], gmdate('d/m H:i', (int) $after['start']));
check('… cotes, choix, heure de réponse et pari inchangés', $after['opts'] === $before['opts'] && (int) $after['endAt'] === (int) $before['endAt'] && sp_my_bets('u_a')[0]['id'] === $rb['bet']['id'] && (float) sp_my_bets('u_a')[0]['odd'] === 1.62);
check('question dont les 72 h sont déjà passées : fermée tout de suite (jamais dans le passé)', (int) $after2['start'] >= $now && (int) $after2['start'] <= time() && (int) ($after2['endAt'] ?? 0) === $now + 30 * $D);
$snap = sp_events();
check('correction idempotente (2e passage : rien ne change)', ($fn('sp_stale_fix') ? sp_stale_fix() : -1) === 0 && sp_events() === $snap && $n === 2, (string) $n);
$pm = $fn('sp_seed_priced') ? sp_seed_priced() : [];
$stale = 0; $nq = 0; foreach (sp_suggestions3() as $row) if ($row[2] === 'event') { $nq++; if (($pm[sp_lower($row[0])] ?? 0) === (int) strtotime('2026-10-18 00:00 UTC')) $stale++; }
check('les questions toutes prêtes portent la date de leurs cotes (18/10)', $nq > 0 && $stale === $nq, $stale . ' / ' . $nq);

echo "4) Gains arrondis au cent INFÉRIEUR\n";
$mr = $mk(['title' => 'Arrondi A - Arrondi B', 'sport' => 'tennis', 'start' => $now + $D, 'opts' => [['label' => 'A', 'odd' => 1.85], ['label' => 'B', 'odd' => 1.95]]]);
$bal[$B] = 10.0;
$r = sp_bet(load_db(), $ub, 'real', 0.15, [['ev' => $mr, 'k' => 'o0']]); // 0,15 × 1,85 = 0,2775
check('gain possible affiché 0,27 $ (pas 0,28)', $r['ok'] === true && abs($r['bet']['pot'] - 0.27) < 1e-9, json_encode($r['bet'] ?? $r));
sp_admin_settle(load_db(), $mr, 'o0');
check('gain payé 0,27 $ (arrondi au cent inférieur)', abs($bal[$B] - (10 - 0.15 + 0.27)) < 1e-9, (string) $bal[$B]);
$w = array_values(array_filter(sp_my_bets('u_b'), static fn($b) => $b['id'] === $r['bet']['id']))[0] ?? [];
check('reçu : 0,27 $', abs((float) ($w['win'] ?? 0) - 0.27) < 1e-9);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
