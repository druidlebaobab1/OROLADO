<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-10-21 — RÉSULTATS PROPOSÉS des QUESTIONS DE PRIX (sports_results.php : crypto Coinbase + Binance / Kraken, Bourse
 * Yahoo + Nasdaq). AUCUN accès à internet : réponses dans scripts/fixtures/ (vraies réponses du 21/10/2026 : Coinbase,
 * Binance miroir, Binance « pays bloqué » 451, Kraken, Yahoo TSLA / S&P 500, Nasdaq TSLA ; + exemples fabriqués « -synthetic »).
 * Vérifie : lecture des vrais titres (heure, seuil, tranches), au-dessus / en dessous, tranches, trop près de la limite →
 * à vérifier, sources en désaccord → rien de sûr, une seule source → à vérifier, heure pas passée → rien, sujets non
 * mesurables → à la main avec la raison, rien n'est réglé tout seul, validation = sp_admin_settle.
 */
$tmp = sys_get_temp_dir() . '/orolado_sppx_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php', 'sports_results.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
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
$FX = __DIR__ . '/fixtures/';
$asked = [];
$GLOBALS['SPR_FAKE_FETCH'] = function (string $url) use ($FX, &$asked): string {
  $asked[] = $url;
  $map = [
    // vraies réponses du 21/10/2026 (BTC à 12:00 et 12:01 UTC)
    'https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=2026-10-21T12:00:00Z&end=2026-10-21T12:01:00Z' => 'coinbase-btc-20261021-1200.json',
    'https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=2026-10-21T12:01:00Z&end=2026-10-21T12:02:00Z' => 'coinbase-btc-20261021-1200.json', // contient aussi la bougie de 12:01
    'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=1792584000000&limit=2' => 'binance-main-451.json',
    'https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=1792584000000&limit=2' => 'binance-btc-20261021-1200.json',
    'https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1&since=1792584000' => 'kraken-btc-20261021-1200.json',
    'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&period1=1792123200&period2=1792209600' => 'yahoo-tsla-20261016.json',
    'https://api.nasdaq.com/api/quote/TSLA/historical?assetclass=stocks&fromdate=2026-10-16&todate=2026-10-17&limit=5' => 'nasdaq-tsla-20261016.json',
    'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&period1=1792123200&period2=1792209600' => 'yahoo-gspc-20261016.json',
    // exemples fabriqués
    'https://api.exchange.coinbase.com/products/ETH-USD/candles?granularity=60&start=2026-10-21T08:00:00Z&end=2026-10-21T08:01:00Z' => 'coinbase-eth-20261021-0800-synthetic.json',
    'https://data-api.binance.vision/api/v3/klines?symbol=ETHUSDT&interval=1m&startTime=1792569600000&limit=2' => 'binance-eth-20261021-0800-synthetic.json',
    'https://api.exchange.coinbase.com/products/DOGE-USD/candles?granularity=60&start=2026-10-20T12:00:00Z&end=2026-10-20T12:01:00Z' => 'coinbase-doge-20261020-1200-synthetic.json',
  ];
  return isset($map[$url]) ? (string) file_get_contents($FX . $map[$url]) : '{}';
};
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php'; require $tmp . '/sports_lib.php'; require $tmp . '/sports_results.php';
foreach (['seed-2026-10', 'seed-2026-10b', 'seed-2026-10c', 'seed-2026-10d', 'seed-2026-10e', 'market-2026-10-21', 'draw-2026-10', 'stale-2026-10'] as $fl) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $fl . '.done', '1');
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$T = static fn(string $s): int => (int) strtotime($s . ' UTC');
$q = static function (string $id, string $title, string $league, string $close, array $labels, array $logos = [], string $end = '') use ($T): array {
  $o = []; foreach ($labels as $i => $l) $o[] = ['k' => 'o' . $i, 'label' => $l, 'odd' => 1.9];
  return ['id' => $id, 'title' => $title, 'league' => $league, 'sport' => 'event', 'start' => $T($close), 'opts' => $o, 'status' => 'open', 'createdAt' => $T('2026-10-10 00:00'), 'logos' => $logos] + ($end !== '' ? ['endAt' => $T($end)] : []);
};
$YN = ['Oui', 'Non'];

echo "1) Lecture des VRAIS titres (data/sports/events.json du 21/10/2026)\n";
$real = [
  ['Le Bitcoin sera-t-il au-dessus de 80 000 $ le samedi 31 octobre à 20 h (UTC) ?', 'Bitcoin', '2026-10-20 00:00', '2026-10-29 20:00', ['q:btc'], '2026-10-31 20:00', 80000.0],
  ['Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre à 12 h (UTC) ?', 'Bitcoin · prix Coinbase', '2026-10-20 00:00', '2026-10-23 12:05', ['q:btc'], '2026-10-23 12:00', 82000.0],
  ['Bitcoin au-dessus de 82 000 $ le dimanche 1er novembre à 0 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-21 00:00', '2026-11-01 00:05', ['q:btc'], '2026-11-01 00:00', 82000.0],
  ['Ethereum au-dessus de 2 400 $ le samedi 31 octobre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-21 00:00', '2026-10-31 12:05', ['q:eth'], '2026-10-31 12:00', 2400.0],
  ['Solana au-dessus de 105 $ le dimanche 8 novembre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-21 00:00', '2026-11-08 12:05', ['q:sol'], '2026-11-08 12:00', 105.0],
  ['XRP au-dessus de 1,30 $ le dimanche 15 novembre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-21 00:00', '2026-11-15 12:05', ['q:xrp'], '2026-11-15 12:00', 1.30],
  ['Dogecoin au-dessus de 0,08 $ le samedi 7 novembre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-21 00:00', '2026-11-07 12:05', ['q:doge'], '2026-11-07 12:00', 0.08],
  ['Tesla au-dessus de 350 $ à la clôture du vendredi 30 octobre ?', 'Bourse de New York', '2026-10-21 00:00', '2026-10-30 20:15', ['q:chart'], '2026-10-30 20:00', 350.0],   // 16 h New York (heure d'été)
  ['Nvidia au-dessus de 215 $ à la clôture du vendredi 20 novembre ?', 'Bourse de New York · résultats Nvidia', '2026-10-21 00:00', '2026-11-20 21:15', ['q:chart'], '2026-11-20 21:00', 215.0], // heure d'hiver
  ['S&P 500 au-dessus de 7 700 points à la clôture du vendredi 20 novembre ?', 'Bourse de New York', '2026-10-21 00:00', '2026-11-20 21:15', ['q:chart'], '2026-11-20 21:00', 7700.0],
];
foreach ($real as $i => [$title, $lg, $start, $end, $logos, $at, $thr]) {
  $pl = spr_px_plan($q('r' . $i, $title, $lg, $start, $YN, $logos, $end));
  $ok = !empty($pl['ok']) && $pl['at'] === $T($at) && $pl['bounds'] === [$thr] && $pl['opts'][0][2] === $thr && $pl['opts'][0][3] === null && $pl['opts'][1][2] === null && $pl['opts'][1][3] === $thr;
  check('« ' . $title . ' » → ' . $at . ' UTC, Oui si > ' . $thr, $ok, json_encode($pl['ok'] ?? false ? ['at' => gmdate('Y-m-d H:i', $pl['at']), 'b' => $pl['bounds']] : $pl, JSON_UNESCAPED_UNICODE));
}
$pl = spr_px_plan($q('r9', 'Tesla au-dessus de 350 $ à la clôture du vendredi 30 octobre ?', 'Bourse de New York', '2026-10-21 00:00', $YN, ['q:chart'], '2026-10-30 20:15'));
check('Bourse : réponse lue 30 min après la clôture', $pl['due'] === $T('2026-10-30 20:30'));
$pl = spr_px_plan($q('r10', 'Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre à 12 h (UTC) ?', 'Bitcoin · prix Coinbase', '2026-10-20 00:00', $YN, ['q:btc'], '2026-10-23 12:05'));
check('Crypto : réponse lue 2 min après l’heure', $pl['due'] === $T('2026-10-23 12:02'));
foreach ([
  ['L’or au-dessus de 4 200 $ l’once le vendredi 27/11 (prix LBMA de 15 h UTC) ?', 'Or · prix LBMA', ['q:gold'], 'Or'],
  ['Bitcoin atteint 100 000 $ avant le 30 novembre ?', 'Bitcoin', ['q:btc'], 'heure précise'],
  ['Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre à 12 h ?', 'Bitcoin', ['q:btc'], 'UTC'],
  ['Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre ?', 'Bitcoin', ['q:btc'], 'Heure'],
  ['Bitcoin ou Ethereum : lequel monte le plus le 23 octobre à 12 h (UTC) ?', 'Crypto', ['q:btc'], 'actifs'],
  ['Google au-dessus de 200 $ à la clôture du vendredi 30 octobre ?', 'Bourse de New York', ['q:chart'], 'GOOG'],
  ['Nasdaq au-dessus de 26 000 points à la clôture du vendredi 30 octobre ?', 'Bourse de New York', ['q:chart'], 'Nasdaq 100 ou Composite'],
  ['Tesla au-dessus de 350 $ le vendredi 30 octobre à 15 h (UTC) ?', 'Bourse de New York', ['q:chart'], 'clôture'],
  ['Tesla au-dessus de 350 $ à la clôture du samedi 31 octobre ?', 'Bourse de New York', ['q:chart'], 'week-end'],
  ['XRP au-dessus de 1,300 $ le dimanche 15 novembre à 12 h (UTC) ?', 'Crypto', ['q:xrp'], 'Seuil'],
] as [$title, $lg, $logos, $want]) {
  $pl = spr_px_plan($q('m', $title, $lg, '2026-10-20 00:00', $YN, $logos));
  check('à la main : « ' . $title . ' »', empty($pl['ok']) && str_contains((string) ($pl['why'] ?? ''), $want), (string) ($pl['why'] ?? 'proposé !'));
}
$pl = spr_px_plan($q('rg', 'Prix du Bitcoin le samedi 31 octobre à 12 h (UTC) ?', 'Bitcoin', '2026-10-20 00:00', ['Moins de 80 000 $', '80 000 – 85 000 $', 'Plus de 85 000 $']));
check('tranches lues : < 80 000 · 80 000–85 000 · > 85 000', !empty($pl['ok']) && $pl['bounds'] === [80000.0, 85000.0] && $pl['opts'][1][2] === 80000.0 && $pl['opts'][1][3] === 85000.0, json_encode($pl, JSON_UNESCAPED_UNICODE));
$pl = spr_px_plan($q('rk', 'BTC en dessous de 80k $ le 31/10 à 12:00 UTC ?', 'Bitcoin', '2026-10-20 00:00', $YN));
check('« en dessous de 80k » + date 31/10 12:00 UTC : Oui si < 80 000', !empty($pl['ok']) && $pl['at'] === $T('2026-10-31 12:00') && $pl['opts'][0][3] === 80000.0 && $pl['opts'][0][2] === null, json_encode($pl, JSON_UNESCAPED_UNICODE));
$pl = spr_px_plan($q('rk2', 'Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre à 12 h (UTC) ?', 'Bitcoin', '2026-10-20 00:00', ['Oui', 'Peut-être']));
check('choix inconnu (« Peut-être ») : à la main', empty($pl['ok']));
check('prix pile sur la limite : aucun choix', spr_px_pick(spr_px_plan($q('x', 'Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre à 12 h (UTC) ?', 'Bitcoin', '2026-10-20 00:00', $YN)), 82000.0) === null);

echo "2) Liste de l'admin (sources d'exemple, aucun paiement)\n";
$db = blank_db();
$A = 'aaaaaaaa-1111-2222-3333-444444444444';
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['vault']['u_a'] = ['demo' => 1000, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$A] = 100.0;
$events = [
  $q('pa', 'Bitcoin au-dessus de 82 000 $ le mercredi 21 octobre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-19 12:00', $YN, ['q:btc'], '2026-10-21 12:05'),
  $q('pb', 'Bitcoin au-dessus de 85 000 $ le mercredi 21 octobre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-09-01 12:00', $YN, ['q:btc'], '2026-10-21 12:05'), // paris fermés 50 jours avant
  $q('pc', 'Prix du Bitcoin le mercredi 21 octobre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-19 12:00', ['Moins de 83 000 $', '83 000 – 84 000 $', 'Plus de 84 000 $'], ['q:btc']),
  $q('pd', 'Bitcoin au-dessus de 83 300 $ le mercredi 21 octobre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-19 12:00', $YN, ['q:btc']),     // 83 371 / 83 472 : à 0,09 %
  $q('pe', 'Ethereum au-dessus de 2 400 $ le mercredi 21 octobre à 8 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-19 08:00', $YN, ['q:eth']),     // Coinbase 2 410,5 / Binance 2 390,1
  $q('pf', 'Bitcoin au-dessus de 80 000 $ le 21/10 à 12:01 UTC ?', 'Crypto · prix Coinbase', '2026-10-19 12:00', $YN, ['q:btc']),                   // Binance absent → Kraken
  $q('pg', 'Dogecoin au-dessus de 0,08 $ le mardi 20 octobre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-18 12:00', $YN, ['q:doge']),       // une seule source
  $q('ph', 'Bitcoin au-dessus de 82 000 $ le mercredi 21 octobre à 14 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-19 14:00', $YN, ['q:btc']),     // pas encore l'heure
  $q('pi', 'Tesla au-dessus de 350 $ à la clôture du vendredi 16 octobre ?', 'Bourse de New York', '2026-10-14 20:00', $YN, ['q:chart']),
  $q('pj', 'S&P 500 au-dessus de 7 600 points à la clôture du vendredi 16 octobre ?', 'Bourse de New York', '2026-10-14 20:00', $YN, ['q:chart']),
  $q('pk', 'L’or au-dessus de 4 200 $ l’once le mardi 20/10 (prix LBMA de 15 h UTC) ?', 'Or · prix LBMA', '2026-10-18 15:00', $YN, ['q:gold']),
  $q('pl', 'F1 GP des États-Unis : Leclerc ou Hamilton, qui finit devant ?', 'Formule 1 · duel', '2026-10-19 20:00', ['Leclerc', 'Hamilton'], ['q:race']),
  $q('pm', 'Ballon d’Or 2026 (lundi 26/10, Londres) : Lamine Yamal sacré ?', 'Ballon d’Or · stars', '2026-10-19 12:00', $YN, ['q:trophy']),
  $q('pn', 'Bitcoin au-dessus de 82 000 $ le mercredi 21 octobre à 12 h (UTC) ?', 'Crypto · prix Coinbase', '2026-10-19 12:00', $YN, ['q:btc']),     // déjà réglé
];
$events[13]['status'] = 'settled'; $events[13]['result'] = 'o0';
sp_with('events.json', static function (array &$s) use ($events) { $s['e'] = $events; return true; });
sp_with('bets.json', static function (array &$s) use ($A) { $s['b'] = [['id' => 'sp_px1', 'uid' => $A, 'mode' => 'real', 'stake' => 10.0, 'odd' => 1.9, 'pot' => 19.0,
  'sel' => [['ev' => 'pa', 'k' => 'o0', 'odd' => 1.9, 't' => 'Bitcoin au-dessus de 82 000 $', 'l' => 'Oui']], 'status' => 'open', 'at' => (int) strtotime('2026-10-19 10:00 UTC')]]; return true; });
$before = [(string) file_get_contents(sp_dir() . '/events.json'), (string) file_get_contents(sp_dir() . '/bets.json')];
$now = $T('2026-10-21 13:55');
$r = spr_admin_proposals($now);
$P = []; foreach ($r['list'] as $p) $P[$p['id']] = $p;
$px = static fn(string $id): string => isset($P[$id]) ? implode(' / ', array_map(static fn($x) => $x['src'] . ' ' . $x['p'], $P[$id]['px']['prices'] ?? [])) : 'absent';
$J = static fn(string $id): string => json_encode($P[$id] ?? null, JSON_UNESCAPED_UNICODE);
check('réponse ok', $r['ok'] === true);
check('rien n’est modifié (événements, paris) par la recherche', $before === [(string) file_get_contents(sp_dir() . '/events.json'), (string) file_get_contents(sp_dir() . '/bets.json')]);
check('solde du joueur inchangé (aucun paiement automatique)', $bal[$A] === 100.0);
check('BTC > 82 000 à 12 h : Coinbase 83 371,24 + Binance 83 472,01 → Oui, sûr, étiquette Crypto', ($P['pa']['k'] ?? '') === 'o0' && $P['pa']['conf'] === 'sur' && $P['pa']['kind'] === 'crypto' && $px('pa') === 'Coinbase 83371.24 / Binance (miroir) 83472.01', $px('pa'));
check('BTC > 85 000 (paris fermés 50 jours avant la réponse) → Non, sûr', ($P['pb']['k'] ?? '') === 'o1' && $P['pb']['conf'] === 'sur');
check('tranches : 83 000 – 84 000 $, sûr', ($P['pc']['k'] ?? '') === 'o1' && $P['pc']['conf'] === 'sur', $J('pc'));
check('à 0,09 % de la limite (83 300) → Oui proposé mais « à vérifier »', ($P['pd']['k'] ?? '') === 'o0' && $P['pd']['conf'] === 'verifier' && str_contains($P['pd']['why'], '0,15'), $J('pd'));
check('sources en désaccord (ETH 2 410,5 / 2 390,1 autour de 2 400) → rien proposé, pas « sûr »', isset($P['pe']) && $P['pe']['k'] === null && $P['pe']['conf'] === 'verifier' && count($P['pe']['px']['prices']) === 2, $J('pe'));
check('Binance absent → Kraken (12:01 : 83 430,51 / 83 435,1) → Oui, sûr', ($P['pf']['k'] ?? '') === 'o0' && $P['pf']['conf'] === 'sur' && $px('pf') === 'Coinbase 83430.51 / Kraken 83435.1', $px('pf'));
check('une seule source (DOGE, Kraken trop ancien) → Oui proposé, « à vérifier »', ($P['pg']['k'] ?? '') === 'o0' && $P['pg']['conf'] === 'verifier' && count($P['pg']['px']['prices']) === 1, $J('pg'));
check('heure pas encore passée (14 h) : rien, aucune lecture', !isset($P['ph']) && $r['waiting'] === 1 && !array_filter($asked, static fn($u) => str_contains($u, 'T14:00')));
check('Tesla clôture 16/10 : Yahoo 354,72 + Nasdaq 354,72 → Oui, sûr, étiquette Prix', ($P['pi']['k'] ?? '') === 'o0' && $P['pi']['conf'] === 'sur' && $P['pi']['kind'] === 'prix' && $px('pi') === 'Yahoo Finance 354.72 / Nasdaq 354.72', $px('pi'));
check('S&P 500 : Yahoo seulement (7 659,44) → Oui, « à vérifier »', ($P['pj']['k'] ?? '') === 'o0' && $P['pj']['conf'] === 'verifier' && count($P['pj']['px']['prices']) === 1, $J('pj'));
$M = []; foreach ($r['manualList'] as $m) $M[$m['id']] = $m['why'];
check('or LBMA, F1, Ballon d’Or : à la main, avec la raison', !isset($P['pk']) && !isset($P['pl']) && !isset($P['pm']) && $r['manual'] === 3 && str_contains($M['pk'] ?? '', 'LBMA') && str_contains($M['pl'] ?? '', 'F1') && str_contains($M['pm'] ?? '', 'Récompense'), json_encode($M, JSON_UNESCAPED_UNICODE));
check('déjà réglé : pas listé', !isset($P['pn']));
$sure = array_values(array_map(static fn($p) => $p['id'], array_filter($r['list'], static fn($p) => $p['conf'] === 'sur' && $p['k'])));
sort($sure);
check('« Valider tout ce qui est sûr » : pa, pb, pc, pf, pi seulement', $sure === ['pa', 'pb', 'pc', 'pf', 'pi'], implode(',', $sure));
check('chaque adresse demandée une seule fois', count($asked) === count(array_unique($asked)), count($asked) . ' demandes');
check('au plus ' . SPR_PX_MAX_FETCH . ' lectures pour les prix', count($asked) <= SPR_PX_MAX_FETCH);
check('api.binance.com muet / bloqué une fois → plus redemandé (miroir direct)', count(array_filter($asked, static fn($u) => str_starts_with($u, 'https://api.binance.com/'))) === 1);

echo "3) Validation = action EXISTANTE (sp_admin_settle), un clic de l'admin\n";
$st = sp_admin_settle(load_db(), 'pa', (string) $P['pa']['k']);
check('« Valider » BTC > 82 000 : réglé, le pari gagné est payé une fois (10 × 1,9 = 19 $)', !empty($st['ok']) && $st['won'] === 1 && $bal[$A] === 119.0, json_encode($st));
check('deuxième clic refusé (jamais payé deux fois)', empty(sp_admin_settle(load_db(), 'pa', 'o0')['ok']) && $bal[$A] === 119.0);
$r2 = spr_admin_proposals($now);
check('la question réglée n’est plus proposée', !in_array('pa', array_column($r2['list'], 'id'), true));

echo "\n" . ($fail ? "ÉCHEC : $fail test(s) sur " . ($pass + $fail) : "OK : $pass tests") . "\n";
exit($fail ? 1 : 0);
