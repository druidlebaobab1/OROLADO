<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Gros joueurs : des joueurs riches misent GROS (jusqu'à 25 % de leur solde) sur n'importe quel
 * actif, payout et durée, avec le vrai moteur et les vraies règles. Question : la caisse du site
 * tient-elle, et un gros joueur peut-il battre le jeu sur la durée ?
 * Lancer : php scripts/test-whales.php [joueurs] [trades]
 */
require __DIR__ . '/../feed_lib.php';
ini_set('memory_limit', '-1');
$players = max(50, (int) ($argv[1] ?? 2000));
$trades = max(20, (int) ($argv[2] ?? 300));
$A = orolado_feed_assets();
$ids = array_keys($A);
$TPS = intdiv(1000, OROLADO_TICK_MS);
$start = 10000.0;

$profiles = [
  'Prudent (mise 1-2 %, surtout 88 %)' => [0.01, 0.02, [0.85, 0.1, 0.04, 0.01]],
  'Joueur (mise 5 %, tous payouts)' => [0.05, 0.05, [0.4, 0.3, 0.2, 0.1]],
  'Flambeur (mise 10-25 %, gros payouts)' => [0.10, 0.25, [0.1, 0.3, 0.3, 0.3]],
  'Chasseur ×50 (mise 2 %, 5000 % seulement)' => [0.02, 0.02, [0, 0, 0, 1]],
];
$lines = [];
$lines[] = 'OROLADO — gros joueurs (départ 10 000 $, grosses mises, tous actifs / payouts / durées)';
$lines[] = date('Y-m-d H:i') . " — $players joueurs par profil, jusqu'à $trades trades chacun";
$lines[] = '';
$lines[] = str_pad('Profil', 44) . str_pad('Misé total', 16, ' ', STR_PAD_LEFT) . str_pad('Retour', 9, ' ', STR_PAD_LEFT) . str_pad('Gagnants', 10, ' ', STR_PAD_LEFT) . str_pad('Ruinés', 8, ' ', STR_PAD_LEFT) . str_pad('Gain du site', 16, ' ', STR_PAD_LEFT) . str_pad('Pire perte du site (1 joueur)', 32, ' ', STR_PAD_LEFT);
foreach ($profiles as $name => [$lo, $hi, $mix]) {
  $staked = 0.0; $back = 0.0; $win = 0; $ruin = 0; $worst = 0.0;
  for ($p = 0; $p < $players; $p++) {
    $a = $ids[random_int(0, count($ids) - 1)];
    $cfg = $A[$a];
    $c = (int) round($cfg['base'] * 100);
    // Chaque joueur arrive à un moment différent du marché.
    for ($i = random_int(100, 3000); $i > 0; $i--) $c = orolado_feed_step($cfg, $c);
    $bal = $start;
    for ($t = 0; $t < $trades; $t++) {
      if ($bal < 1) { $ruin++; break; }
      $frac = $lo + (mt_rand() / mt_getrandmax()) * ($hi - $lo);
      $stake = max(1.0, round($bal * $frac, 2));
      $r = mt_rand() / mt_getrandmax(); $mi = 0; $acc = 0.0;
      foreach ($mix as $k => $w) { $acc += $w; if ($r <= $acc) { $mi = $k; break; } }
      $mult = OROLADO_MULTS[$mi];
      $dur = OROLADO_DURATIONS[random_int(0, 3)]; // 5 s → 1 min (les plus jouées)
      $side = random_int(0, 1) ? 'call' : 'put';
      $bar = orolado_fair_barrier($a, $dur, $side, $mult, $c);
      for ($k = $dur * $TPS; $k > 0; $k--) $c = orolado_feed_step($cfg, $c);
      $got = orolado_fair_credit(orolado_fair_verdict($side, $c, $bar), $stake, $mult);
      $bal = round($bal - $stake + $got, 2);
      $staked += $stake; $back += $got;
      // Pause entre deux trades (quelques secondes).
      for ($k = random_int(4, 40); $k > 0; $k--) $c = orolado_feed_step($cfg, $c);
    }
    if ($bal > $start) $win++;
    $worst = max($worst, $bal - $start);
  }
  $lines[] = str_pad($name, 44) . str_pad(number_format($staked, 0, ',', ' ') . ' $', 16, ' ', STR_PAD_LEFT)
    . str_pad(sprintf('%.2f%%', 100 * $back / max(1, $staked)), 9, ' ', STR_PAD_LEFT)
    . str_pad(sprintf('%.1f%%', 100 * $win / $players), 10, ' ', STR_PAD_LEFT)
    . str_pad((string) $ruin, 8, ' ', STR_PAD_LEFT)
    . str_pad(number_format($staked - $back, 0, ',', ' ') . ' $', 16, ' ', STR_PAD_LEFT)
    . str_pad(number_format($worst, 0, ',', ' ') . ' $', 32, ' ', STR_PAD_LEFT);
}
$lines[] = '';
$lines[] = '« Gagnants » = joueurs qui finissent au-dessus de 10 000 $ (chance à court terme).';
$lines[] = '« Pire perte du site » = le plus gros gain fait par UN seul joueur (le risque sans plafond de mise).';
$txt = implode("\n", $lines) . "\n";
echo $txt;
file_put_contents(__DIR__ . '/rapport-gros-joueurs.txt', $txt);
