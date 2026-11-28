<?php
declare(strict_types=1);
// Ligne de commande seulement. 2026-11-28 — DÉMO PLUS FACILE (ligne objectif démo) : sur chaque indice, trades simulés avec le
// VRAI moteur de prix, en partant d'un prix au hasard autour de la base. Vérifie : démo ≈ 62 % gagnés à 90 % et ≈ 118 % rendus
// à ×5 / ×10 / ×50 ; RÉEL inchangé (≈ 50 % à 90 %). Usage : php scripts/test-demo-line.php [trades par indice] [durée]
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
chdir(__DIR__ . '/..');
require 'orolado_lib.php'; require_once 'trade_lib.php';
$N = (int) ($argv[1] ?? 400); $dur = (int) ($argv[2] ?? 5);
$ticks = intdiv($dur * 1000, OROLADO_TICK_MS);
$ok = 0; $ko = 0; $bad = [];
$tot = ['demo' => [], 'real' => []];
foreach (orolado_feed_assets() as $id => $a) {
  if (!isset(orolado_trade_demo_table()[$id])) { $ko++; $bad[] = "$id : pas de ligne démo"; continue; }
  $base = (int) round((float) $a['base'] * 100);
  foreach ([1.9, 5.0, 10.0, 50.0] as $m) {
    $rD = 0.0; $rR = 0.0; $wD = 0; $wR = 0;
    for ($i = 0; $i < $N; $i++) {
      $c = (int) round($base * exp((random_int(-1000, 1000) / 1000) * 0.03)); // départ au hasard ±3 % de la base
      for ($k = 0; $k < 40; $k++) $c = orolado_feed_step($a, $c);
      $side = $i % 2 ? 'put' : 'call';
      $bR = orolado_fair_barrier($id, $dur, $side, $m, $c);
      $bD = orolado_trade_demo_barrier($id, $dur, $side, $m, $c, $bR);
      $x = $c; for ($k = 0; $k < $ticks; $k++) $x = orolado_feed_step($a, $x);
      $vD = orolado_fair_verdict($side, $x, $bD); $vR = orolado_fair_verdict($side, $x, $bR);
      $rD += orolado_fair_credit($vD, 1, $m); $rR += orolado_fair_credit($vR, 1, $m);
      if ($vD === 'won') $wD++; if ($vR === 'won') $wR++;
    }
    $tot['demo'][(string) $m][] = $rD / $N; $tot['real'][(string) $m][] = $rR / $N;
    if ($m === 1.9) $tot['w19d'][] = $wD / $N;
    if ($m === 1.9) $tot['w19r'][] = $wR / $N;
  }
}
$avg = static fn(array $v) => array_sum($v) / max(1, count($v));
$wd = $avg($tot['w19d'] ?? []); $wr = $avg($tot['w19r'] ?? []);
printf("Durée %d s, %d trades par indice et par gain, %d indices\n", $dur, $N, count($tot['w19d'] ?? []));
printf("  90 %%  démo : %.1f gagnés sur 100 (retour %.0f %%)   réel : %.1f gagnés sur 100 (retour %.0f %%)\n", 100 * $wd, 100 * $avg($tot['demo']['1.9']), 100 * $wr, 100 * $avg($tot['real']['1.9']));
foreach (['5', '10', '50'] as $m) printf("  ×%-3s  démo : retour %.0f %%   réel : retour %.0f %%\n", $m, 100 * $avg($tot['demo'][$m]), 100 * $avg($tot['real'][$m]));
$c1 = $wd > 0.57 && $wd < 0.68; $c2 = $wr > 0.45 && $wr < 0.55;
$c3 = true; foreach (['5', '10', '50'] as $m) { $r = $avg($tot['demo'][$m]); if ($r < 1.0 || $r > 1.45) $c3 = false; }
foreach ([[$c1, 'démo 90 % entre 57 et 68 gagnés sur 100'], [$c2, 'réel 90 % inchangé (≈ 50)'], [$c3, 'démo ×5 / ×10 / ×50 : retour entre 100 et 145 %']] as [$g, $t]) { $g ? $ok++ : $ko++; echo ($g ? '  OK   ' : '  ÉCHEC ') . $t . "\n"; }
foreach (array_slice($bad, 0, 10) as $b) echo "  ÉCHEC $b\n";
echo "RÉSULTAT : $ok OK, $ko échec(s)\n";
