<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * L'« élastique » (retour lent vers le prix de départ) donne-t-il un avantage quand le prix est
 * TRÈS loin de son départ ? On place le prix à z écarts-types de sa base et on joue des trades
 * dans le sens du retour (ACHETER si le prix est bas).
 * php scripts/test-elastic.php <actif> <z> <durée s> <trades> [graine] → JSON
 * php scripts/test-elastic.php <actif> <z> <durée s> <trades> all <proc> → résultat
 */
require __DIR__ . '/../feed_lib.php';
[$_, $asset, $z, $dur, $n] = $argv + [null, 'v100', '-2', '600', '20000'];
$z = (float) $z; $dur = (int) $dur; $n = (int) $n;
if (($argv[5] ?? '') === 'all') {
  $k = (int) ($argv[6] ?? 8);
  $ps = [];
  for ($i = 0; $i < $k; $i++) $ps[] = popen(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__FILE__) . " $asset $z $dur $n $i", 'r');
  $t = [];
  foreach ($ps as $p) { $j = json_decode((string) stream_get_contents($p), true); pclose($p); foreach ($j as $m => $v) { $t[$m] = $t[$m] ?? [0, 0, 0]; for ($q = 0; $q < 3; $q++) $t[$m][$q] += $v[$q]; } }
  $side = $z < 0 ? 'ACHETER' : 'VENDRE';
  echo "$asset, prix à " . sprintf('%+.1f', $z) . " écarts-types de sa base, trades de {$dur}s, $side (vers la base) :\n";
  foreach ($t as $m => [$nn, $w, $v]) {
    $p = $w / $nn; $rt = ($w * (float) $m + $v) / $nn;
    printf("  ×%-5s retour %6.2f%% ± %.2f  (%d trades)\n", $m, 100 * $rt, 100 * (float) $m * sqrt($p * (1 - $p) / $nn), $nn);
  }
  exit(0);
}
$cfg = orolado_feed_assets()[$asset];
$start = (int) round($cfg['base'] * 100 * exp($z * OROLADO_PRICE_BAND));
$side = $z < 0 ? 'call' : 'put';
$D = $dur * intdiv(1000, OROLADO_TICK_MS);
$out = [];
foreach (OROLADO_MULTS as $m) $out[(string) $m] = [0, 0, 0];
for ($t = 0; $t < $n; $t++) {
  $c = $start;
  $bars = [];
  foreach (OROLADO_MULTS as $m) $bars[(string) $m] = orolado_fair_barrier($asset, $dur, $side, $m, $start);
  for ($i = 0; $i < $D; $i++) $c = orolado_feed_step($cfg, $c);
  foreach ($bars as $m => $b) {
    $v = orolado_fair_verdict($side, $c, $b);
    $out[$m][0]++;
    if ($v === 'won') $out[$m][1]++; else if ($v === 'void') $out[$m][2]++;
  }
}
echo json_encode($out);
