<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * CHARGE DE TRADES : plusieurs joueurs connectés lancent des dizaines de trades EN MÊME TEMPS
 * (processus séparés, comme des requêtes simultanées sur le serveur), puis tout est réglé.
 * Vérifie au centime près : chaque solde = départ − mises + gains, aucun trade perdu, doublé
 * ou resté « en cours ». Dossier data/ temporaire : les vraies données ne sont jamais touchées.
 *
 * php scripts/test-charge-trades.php [joueurs] [trades par joueur]
 */
$root = dirname(__DIR__);
if (($argv[1] ?? '') === 'regle') {
  // --- Règlement d'un joueur (en parallèle des autres). ---
  [, , $tmp, $uid] = $argv;
  require $tmp . '/orolado_lib.php';
  require $tmp . '/trade_lib.php';
  // Comme le téléphone : on redemande tant qu'il reste des trades à régler (25 par demande).
  $tot = 0;
  for ($k = 0; $k < 20; $k++) { $n = (int) orolado_trade_settle_due($uid); $tot += $n; if ($n === 0) break; }
  echo $tot;
  exit;
}
if (($argv[1] ?? '') === 'enfant') {
  // --- Un joueur : lance ses trades le plus vite possible (double-clics compris). ---
  [, , $tmp, $uid, $n] = $argv;
  require $tmp . '/orolado_lib.php';
  require $tmp . '/trade_lib.php';
  $me = ['id' => $uid, 'email' => $uid . '@test.local', 'role' => 'user'];
  $assets = array_keys(orolado_feed_assets());
  $mults = [1.9, 5.0, 10.0, 50.0];
  $ok = 0; $dup = 0; $ko = 0;
  for ($i = 0; $i < (int) $n; $i++) {
    $req = ['id' => $uid . '_o' . $i, 'stake' => [1, 7.5, 50, 500, 1000][$i % 5], 'side' => $i % 2 ? 'put' : 'call',
      'duration' => 5, 'mode' => 'demo', 'assetId' => $assets[$i % count($assets)], 'payout' => $mults[$i % 4]];
    $r = orolado_trade_place($me, $req);
    if (!empty($r['duplicate'])) $dup++; else if (!empty($r['ok'])) $ok++; else $ko++;
    if ($i % 10 === 0) { $r2 = orolado_trade_place($me, $req); if (!empty($r2['duplicate'])) $dup++; } // double-clic
  }
  echo json_encode(['ok' => $ok, 'dup' => $dup, 'ko' => $ko]);
  exit;
}

$players = max(2, (int) ($argv[1] ?? 20));
$per = max(5, (int) ($argv[2] ?? 40));
$tmp = sys_get_temp_dir() . '/orolado_charge_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy($root . '/' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
$START = 100000.0;
$db = blank_db();
for ($p = 0; $p < $players; $p++) {
  $uid = sprintf('u%03d', $p);
  $db['users'][$uid] = ['id' => $uid, 'email' => $uid . '@test.local', 'role' => 'user'];
  $db['vault'][$uid] = ['demo' => $START, 'real' => 0];
}
save_db(orolado_data_file(), $db);
foreach (array_keys(orolado_feed_assets()) as $a) orolado_feed_advance($a);

echo "$players joueurs lancent chacun $per trades EN MÊME TEMPS (avec double-clics)…\n";
$t0 = microtime(true);
$procs = [];
for ($p = 0; $p < $players; $p++) {
  $procs[] = popen(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__FILE__) . ' enfant ' . escapeshellarg($tmp) . ' ' . sprintf('u%03d', $p) . ' ' . $per, 'r');
}
$placed = 0; $dups = 0; $refused = 0;
foreach ($procs as $pr) {
  $j = json_decode((string) stream_get_contents($pr), true) ?: [];
  pclose($pr);
  $placed += (int) ($j['ok'] ?? 0); $dups += (int) ($j['dup'] ?? 0); $refused += (int) ($j['ko'] ?? 0);
}
printf("  ordres acceptés : %d | doubles-clics rejetés proprement : %d | refusés : %d | durée : %.1f s\n", $placed, $dups, $refused, microtime(true) - $t0);
echo "Attente de la fin des trades (5 s) puis règlement de tout le monde en parallèle…\n";
sleep(7);
foreach (array_keys(orolado_feed_assets()) as $a) orolado_feed_advance($a);
$procs = [];
for ($p = 0; $p < $players; $p++) {
  $procs[] = popen(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__FILE__) . ' regle ' . escapeshellarg($tmp) . ' ' . sprintf('u%03d', $p), 'r');
}
foreach ($procs as $pr) { stream_get_contents($pr); pclose($pr); }

$db = load_db();
$pass = 0; $fail = 0;
$check = static function (string $w, bool $ok, string $d = '') use (&$pass, &$fail) { $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; };
$orders = array_values(array_filter($db['orders'] ?? [], 'is_array'));
$open = array_filter($orders, static fn($o) => ($o['status'] ?? '') === 'open');
$ids = array_column($orders, 'id');
$check('chaque ordre accepté est bien enregistré', count($orders) === $placed, count($orders) . ' / ' . $placed);
$check('aucun ordre en double', count($ids) === count(array_unique($ids)));
$check('plus aucun trade « en cours » après règlement', count($open) === 0, count($open) . ' ouverts');
$bad = 0; $won = 0; $lost = 0; $void = 0;
for ($p = 0; $p < $players; $p++) {
  $uid = sprintf('u%03d', $p);
  $want = $START;
  foreach ($orders as $o) {
    if (($o['userId'] ?? '') !== $uid) continue;
    $want -= (float) $o['stake'];
    $want += orolado_fair_credit((string) $o['status'], (float) $o['stake'], (float) $o['payout']);
    if ($o['status'] === 'won') $won++; else if ($o['status'] === 'lost') $lost++; else $void++;
  }
  $have = (float) ($db['vault'][$uid]['demo'] ?? -1);
  if (abs(round($want, 2) - round($have, 2)) > 0.001) { $bad++; echo "    $uid : attendu " . round($want, 2) . " / trouvé " . round($have, 2) . "\n"; }
}
$check("les $players soldes sont exacts au centime (départ − mises + gains)", $bad === 0, "$bad faux");
printf("  (%d gagnés, %d perdus, %d égalités)\n", $won, $lost, $void);
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
