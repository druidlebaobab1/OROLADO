<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2359 — Prix du CLIC accepté + surveillance des robots, avec une FAUSSE caisse (aucun appel à Supabase).
 * Usage : php scripts/test-clic.php
 * Dossier data/ temporaire : ne touche jamais aux vraies données.
 */

$tmp = sys_get_temp_dir() . '/orolado_clic_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'admin_lib.php', 'history_lib.php', 'wipe_lib.php'] as $f) {
  if (is_file(__DIR__ . '/../' . $f)) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
}
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require_once $tmp . '/admin_lib.php';

$bank = ['real' => [], 'settled' => []];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bank) {
  $u = $a['p_user'];
  $bank['real'][$u] = $bank['real'][$u] ?? 0.0;
  if ($fn === 'debit_real') {
    if ($bank['real'][$u] + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient'];
    $bank['real'][$u] = round($bank['real'][$u] - $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bank['real'][$u]];
  }
  if ($fn === 'resolve_trade') {
    if (isset($bank['settled'][$a['p_order']])) return ['ok' => true, 'duplicate' => true, 'real' => $bank['real'][$u]];
    $bank['settled'][$a['p_order']] = $a['p_amount'];
    $bank['real'][$u] = round($bank['real'][$u] + $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bank['real'][$u]];
  }
  return null;
};

$pass = 0;
$fail = 0;
function check(string $what, bool $ok, string $detail = ''): void {
  global $pass, $fail;
  if ($ok) $pass++; else $fail++;
  echo ($ok ? '  OK   ' : '  ÉCHEC ') . $what . ($detail !== '' ? '  (' . $detail . ')' : '') . "\n";
}

$robot = '11111111-2222-3333-4444-000000000001';
$honest = '11111111-2222-3333-4444-000000000002';
$malin = '11111111-2222-3333-4444-000000000003';
$db = blank_db();
foreach ([$robot => 'robot@test.example', $honest => 'joueur@test.example', $malin => 'malin@test.example'] as $id => $mail) {
  $db['users'][$id] = ['id' => $id, 'email' => $mail, 'role' => 'user'];
  $db['vault'][$id] = ['demo' => 1000.0, 'real' => 1000.0];
  $bank['real'][$id] = 1000.0;
}
save_db(orolado_data_file(), $db);
$meR = $db['users'][$robot];
$meH = $db['users'][$honest];
$meM = $db['users'][$malin];
$asset = 'v100';
// Heure d'arrivée de l'ordre = maintenant (en ligne de commande, PHP la fige au démarrage du script).
function place(array $me, array $req): array {
  $_SERVER['REQUEST_TIME_FLOAT'] = microtime(true);
  return orolado_trade_place($me, $req);
}

orolado_feed_advance($asset);
usleep(2000000); // un peu d'historique

echo "1) Prix du clic accepté seulement s'il est récent\n";
$st = orolado_feed_advance($asset);
$r = place($meH, ['id' => 'c1', 'stake' => 1, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => $asset, 'payout' => 1.9, 'seenTick' => $st['n'] - 2]);
check('clic d’il y a 0,5 s : pris', !empty($r['ok']) && $r['order']['entryTick'] === $st['n'] - 2
  && abs($r['order']['entryPrice'] - orolado_feed_price_at($asset, $st['n'] - 2) / 100) < 1e-9, 'entrée ' . ($r['order']['entryTick'] ?? '?') . ' / clic ' . ($st['n'] - 2));
$st = orolado_feed_advance($asset);
$r = place($meH, ['id' => 'c2', 'stake' => 1, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => $asset, 'payout' => 1.9, 'seenTick' => $st['n'] - 20]);
check('clic d’il y a 5 s : refusé (prix d’arrivée)', !empty($r['ok']) && $r['order']['entryTick'] >= $st['n']);
$st = orolado_feed_advance($asset);
$r = place($meH, ['id' => 'c3', 'stake' => 1, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => $asset, 'payout' => 1.9, 'seenTick' => $st['n'] + 5]);
check('prix du futur : refusé (prix d’arrivée)', !empty($r['ok']) && $r['order']['entryTick'] >= $st['n'] && $r['order']['entryTick'] < $st['n'] + 5);
$r = place($meH, ['id' => 'c4', 'stake' => 1, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => $asset, 'payout' => 1.9]);
check('sans prix du clic (ancien téléphone) : prix d’arrivée', !empty($r['ok']));

echo "2) Robot tricheur, robot MALIN (triche 1 fois sur 2) et joueur honnête (320 trades chacun)\n";
// Robot : il lit les prix en direct, voit le mouvement des 1,5 dernières secondes, puis prétend avoir cliqué
// 1,5 s plus tôt dans le bon sens. Robot malin : ne triche qu'une fois sur deux pour se cacher.
// Joueur honnête : clic vu ~0,25-0,5 s avant l'arrivée, sens au hasard.
$N = 320;
for ($i = 0; $i < $N; $i++) {
  $st = orolado_feed_advance($asset);
  $n = $st['n'];
  $old = orolado_feed_price_at($asset, $n - 6);
  $cheat = $st['c'] > $old ? 'call' : 'put';
  place($meR, ['id' => 'r' . $i, 'stake' => 1, 'side' => $cheat, 'duration' => 5, 'mode' => 'real', 'assetId' => $asset, 'payout' => 1.9, 'seenTick' => $n - 6]);
  if (random_int(0, 1)) {
    place($meM, ['id' => 'm' . $i, 'stake' => 1, 'side' => $cheat, 'duration' => 5, 'mode' => 'real', 'assetId' => $asset, 'payout' => 1.9, 'seenTick' => $n - 6]);
  } else {
    place($meM, ['id' => 'm' . $i, 'stake' => 1, 'side' => random_int(0, 1) ? 'call' : 'put', 'duration' => 5, 'mode' => 'real', 'assetId' => $asset, 'payout' => 1.9, 'seenTick' => $n - 1]);
  }
  place($meH, ['id' => 'h' . $i, 'stake' => 1, 'side' => random_int(0, 1) ? 'call' : 'put', 'duration' => 5, 'mode' => 'real', 'assetId' => $asset, 'payout' => 1.9, 'seenTick' => $n - random_int(1, 2)]);
  usleep(260000);
}
sleep(7);
foreach ([$robot, $malin, $honest] as $who) {
  for ($k = 0; $k < 8; $k++) orolado_trade_settle_due($who, 100);
}
$db = load_db();
$count = function (string $uid, string $prefix) use ($db): array {
  $w = 0; $l = 0; $open = 0;
  foreach ($db['orders'] as $o) {
    if (($o['userId'] ?? '') !== $uid || strpos((string) $o['id'], $prefix) !== 0) continue;
    if (($o['status'] ?? '') === 'won') $w++;
    if (($o['status'] ?? '') === 'lost') $l++;
    if (($o['status'] ?? '') === 'open') $open++;
  }
  return [$w, $l, $open];
};
$uR = $db['users'][$robot];
$uM = $db['users'][$malin];
$uH = $db['users'][$honest];
$opened = 0;
foreach ([['robot      ', $robot, 'r', $uR], ['robot malin', $malin, 'm', $uM], ['honnête    ', $honest, 'h', $uH]] as $row) {
  [$lbl, $id, $px, $u] = $row;
  [$w, $l, $op] = $count($id, $px);
  $opened += $op;
  echo '     ' . $lbl . ' : ' . $w . ' gagnés / ' . $l . ' perdus (' . round(100 * $w / max(1, $w + $l)) . ' %) — bon sens déjà pris '
    . (int) ($u['clickFav'] ?? 0) . ', contre ' . (int) ($u['clickUnfav'] ?? 0) . "\n";
}
check('tous les trades réglés (aucun bloqué)', $opened === 0, $opened . ' ouverts');
$why = orolado_click_edge_reason($uR);
check('robot repéré « suspect »', $why !== '', $why);
check('robot malin repéré aussi', orolado_click_edge_reason($uM) !== '', orolado_click_edge_reason($uM));
check('joueur honnête PAS suspect', orolado_click_edge_reason($uH) === '');

echo "3) Ce que montre l'admin (même calcul que la liste « Suspects » et que les retraits)\n";
$adminR = admin_suspect_reason($uR, [], null, []);
$adminH = admin_suspect_reason($uH, [], null, []);
echo '     admin, robot   : « ' . $adminR . " »\n";
echo '     admin, honnête : « ' . ($adminH === '' ? '(rien, pas suspect)' : $adminH) . " »\n";
check('admin : robot dans les suspects', stripos($adminR, 'robot') !== false);
check('admin : joueur honnête absent', $adminH === '');
$wdR = admin_suspect_reason($uR, [], ['amount' => 50, 'status' => 'pending'], []);
check('retrait du robot : signalé', $wdR !== '', $wdR);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
