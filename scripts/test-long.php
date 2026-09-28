<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Contrôle ciblé des trades LONGS (5 et 10 min) sur un actif, avec beaucoup de prix.
 * php scripts/test-long.php <actif> <millions de ticks> [graine]  → JSON
 * php scripts/test-long.php <actif> <millions> all <processus>      → résultat fusionné
 */
require __DIR__ . '/../feed_lib.php';
ini_set('memory_limit', '-1');
$asset = (string) ($argv[1] ?? 'v75');
$mil = (float) ($argv[2] ?? 8);
$TPS = intdiv(1000, OROLADO_TICK_MS);
$DURS = [60, 300, 600];

if (($argv[3] ?? '') === 'all') {
  $n = max(1, (int) ($argv[4] ?? 8));
  $procs = [];
  for ($k = 0; $k < $n; $k++) $procs[] = popen(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__FILE__) . " $asset $mil $k", 'r');
  $tot = [];
  $ticks = 0;
  foreach ($procs as $p) {
    $j = json_decode((string) stream_get_contents($p), true);
    pclose($p);
    $ticks += $j['ticks'];
    foreach ($j['s'] as $k => $v) { $tot[$k] = $tot[$k] ?? [0, 0, 0]; for ($i = 0; $i < 3; $i++) $tot[$k][$i] += $v[$i]; }
  }
  echo "$asset : " . number_format($ticks / 1e6, 0) . " millions de prix\n";
  foreach ($DURS as $d) {
    $indep = intdiv($ticks, $d * $TPS) * 2;
    $row = [];
    foreach (OROLADO_MULTS as $m) {
      $s = $tot["$d|$m"];
      $rt = ($s[1] * $m + $s[2]) / $s[0];
      $p = $s[1] / $s[0];
      $se = $m * sqrt($p * (1 - $p) / $indep);
      $row[] = sprintf('×%-4s %5.1f%% ± %.1f', $m, 100 * $rt, 100 * $se);
    }
    echo str_pad($d . 's', 5) . ' ' . implode('   ', $row) . "\n";
  }
  exit(0);
}

$cfg = orolado_feed_assets()[$asset];
$table = orolado_fair_table()[$asset];
$N = (int) ($mil * 1e6);
$maxD = max($DURS) * $TPS;
$buf = new SplFixedArray($maxD + 1);
$c = (int) round($cfg['base'] * 100);
for ($i = random_int(0, 5000); $i > 0; $i--) $c = orolado_feed_step($cfg, $c);
$s = [];
$rels = [];
foreach ($DURS as $d) foreach (OROLADO_MULTS as $m) {
  $s["$d|$m"] = [0, 0, 0];
  $idx = $m === 5.0 ? 1 : ($m === 10.0 ? 2 : ($m === 50.0 ? 3 : 0));
  $rels["$d|$m"] = [(float) $table[(string) $d][$idx], (float) $table[(string) $d][$idx > 0 ? $idx + 3 : 0], $d * $TPS];
}
for ($i = 0; $i < $N; $i++) {
  $c = orolado_feed_step($cfg, $c);
  $buf[$i % ($maxD + 1)] = $c;
  if ($i < $maxD || $i % 4) continue;
  foreach ($rels as $k => [$rc, $rp, $D]) {
    $e = $buf[($i - $D) % ($maxD + 1)];
    $bc = (int) round($e * (1 + $rc), 0, PHP_ROUND_HALF_UP);
    $bp = (int) round($e * (1 + $rp), 0, PHP_ROUND_HALF_UP);
    $s[$k][0] += 2;
    if ($c > $bc) $s[$k][1]++; else if ($c === $bc) $s[$k][2]++;
    if ($c < $bp) $s[$k][1]++; else if ($c === $bp) $s[$k][2]++;
  }
}
echo json_encode(['ticks' => $N, 's' => $s]);
