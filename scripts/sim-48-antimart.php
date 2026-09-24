<?php
/**
 * Sims maison — 48 % cote 1.88 + anti-martingale (PHP, sans Node).
 */
$N = 500000;
$P48 = 0.48;
$PROFIT = 0.88;
$EV = $P48 * $PROFIT - (1 - $P48);

function r2($n) { return round($n, 2); }
function usd($n) {
  $s = r2($n);
  return ($s < 0 ? '-' : '') . '$' . number_format(abs($s), 2, '.', '');
}
function pct($n) { return number_format(100 * $n, 3) . '%'; }

function anti_mart($baseP, $stake, $lastStake, $lossStreak) {
  $p = (float) $baseP;
  $rising = $lastStake > 0.009 && $stake >= $lastStake * 1.75;
  $steps = 0;
  if ($lossStreak >= 1 && $rising) $steps = min($lossStreak, 6);
  else if ($lossStreak >= 3 && $stake >= $lastStake * 1.35) $steps = min($lossStreak - 1, 4);
  if ($steps <= 0) return $p;
  $p = $p * pow(0.62, $steps);
  return max(0.10, min($baseP * 0.55, $p));
}

function roll($p) {
  return (mt_rand(1, 100000) / 100000) < $p;
}

function run_flat($n, $bank0, $stake, $P48, $PROFIT) {
  $bank = $bank0; $wins = 0; $losses = 0; $ruined = 0;
  for ($i = 0; $i < $n; $i++) {
    if ($bank < $stake) { $ruined++; $bank = $bank0; }
    if (roll($P48)) { $wins++; $bank = r2($bank + $stake * $PROFIT); }
    else { $losses++; $bank = r2($bank - $stake); }
  }
  return ['label' => "Flat {$stake}\$", 'n' => $n, 'wins' => $wins, 'losses' => $losses, 'ruined' => $ruined, 'pnl' => r2($bank - $bank0)];
}

function run_mart($n, $bank0, $base, $maxStake, $shield, $P48, $PROFIT) {
  $bank = $bank0; $stake = $base; $lastStake = 0.0; $lossStreak = 0;
  $wins = 0; $losses = 0; $ruined = 0; $hits = 0;
  for ($i = 0; $i < $n; $i++) {
    if ($bank < $base) { $ruined++; $bank = $bank0; $stake = $base; $lossStreak = 0; $lastStake = 0; }
    if ($stake > $bank) $stake = r2($bank);
    if (!($stake >= 1)) { $ruined++; $bank = $bank0; $stake = $base; $lossStreak = 0; continue; }
    $p = $P48;
    if ($shield) {
      $adj = anti_mart($P48, $stake, $lastStake, $lossStreak);
      if ($adj + 0.0001 < $P48) $hits++;
      $p = $adj;
    }
    if (roll($p)) {
      $wins++; $bank = r2($bank + $stake * $PROFIT); $lastStake = $stake; $stake = $base; $lossStreak = 0;
    } else {
      $losses++; $bank = r2($bank - $stake); $lastStake = $stake; $lossStreak++; $stake = r2(min($maxStake, $stake * 2));
    }
  }
  return [
    'label' => $shield ? 'Martingale + blindage' : 'Martingale SANS blindage',
    'n' => $n, 'wins' => $wins, 'losses' => $losses, 'ruined' => $ruined, 'hits' => $hits, 'pnl' => r2($bank - $bank0)
  ];
}

function dump($r, $P48) {
  $d = $r['wins'] + $r['losses'];
  $wr = $d ? $r['wins'] / $d : 0;
  echo "\n{$r['label']}\n";
  echo "  trades     : {$r['n']}\n";
  echo '  win rate   : ' . pct($wr) . " (cible ~" . pct($P48) . ")\n";
  echo "  W/L        : {$r['wins']} / {$r['losses']}\n";
  if (isset($r['ruined'])) echo "  ruines     : {$r['ruined']}\n";
  if (isset($r['hits'])) echo "  coups blindés : {$r['hits']}\n";
  echo '  PnL joueur : ' . usd($r['pnl']) . "\n";
  echo '  PnL maison : ' . usd(-$r['pnl']) . "\n";
}

echo "=== SIM 48% (1.88) + ANTI-MART ===\n";
echo 'p*= ' . pct($P48) . '  EV flat/unité= ' . number_format($EV, 4) . ' (' . pct($EV) . " maison)\n";
echo "N/profil = $N\n";

$results = [];
$results[] = run_flat($N, 10000, 1, $P48, $PROFIT);
$results[] = run_flat($N, 10000, 5, $P48, $PROFIT);
$results[] = run_mart($N, 10000, 1, 512, false, $P48, $PROFIT);
$results[] = run_mart($N, 10000, 1, 512, true, $P48, $PROFIT);
$results[] = run_mart($N, 500, 1, 256, true, $P48, $PROFIT);
$results[] = run_mart($N, 200, 2, 128, true, $P48, $PROFIT);

foreach ($results as $r) dump($r, $P48);

$house = 0.0;
for ($a = 0; $a < 1000; $a++) {
  $r = run_flat(1000, 100, 2, $P48, $PROFIT);
  $house += -$r['pnl'];
}
echo "\n1000 comptes × 1000 trades flat 2\$\n";
echo '  PnL maison totale : ' . usd($house) . "\n";

$ok = true;
foreach ($results as $r) {
  if ($r['pnl'] >= 0) { $ok = false; echo "ECHEC profil positif joueur: {$r['label']}\n"; }
}
if ($results[3]['pnl'] >= $results[2]['pnl']) {
  $ok = false;
  echo "ECHEC : blindage doit aggraver martingale\n";
}
if ($house <= 0) { $ok = false; echo "ECHEC multi-comptes\n"; }

if (!$ok) { echo "\nECHEC AUDIT\n"; exit(1); }
echo "\nOK — maison gagnante partout ; blindage martingale actif ; 48% sur 1.88.\n";
exit(0);
