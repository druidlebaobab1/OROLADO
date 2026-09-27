<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Stratégies de joueurs contre le VRAI moteur (mêmes fonctions que le serveur :
 * orolado_feed_step pour les prix, orolado_fair_barrier / verdict / credit pour le règlement).
 * Question : une stratégie (achat + vente en même temps, martingale, suivre la tendance…)
 * peut-elle battre le jeu sur la durée ?
 *
 * Lancer : php scripts/test-strategies.php [joueurs] [trades]
 * Rien n'est écrit dans data/ : les prix sont générés en mémoire.
 */
require __DIR__ . '/../feed_lib.php';
// (feed_lib.php charge déjà fair_table.php)

$players = max(10, (int) ($argv[1] ?? 150));
$tradesPer = max(50, (int) ($argv[2] ?? 400));
$A = orolado_feed_assets();

/** Un joueur = un fil de prix continu sur un actif. */
final class Path {
  public int $c;
  public array $hist = [];
  public function __construct(public array $a, public string $id) { $this->c = (int) round($a['base'] * 100); }
  public function run(int $ticks): void {
    for ($i = 0; $i < $ticks; $i++) {
      $this->c = orolado_feed_step($this->a, $this->c);
      $this->hist[] = $this->c;
    }
    if (count($this->hist) > 2000) $this->hist = array_slice($this->hist, -1000);
  }
  public function back(int $ticks): int { $n = count($this->hist); return $this->hist[max(0, $n - 1 - $ticks)] ?? $this->c; }
  public function spikeWithin(int $ticks): bool {
    $n = count($this->hist);
    for ($i = max(1, $n - $ticks); $i < $n; $i++) if (abs($this->hist[$i] - $this->hist[$i - 1]) > $this->hist[$i - 1] * 0.003) return true;
    return false;
  }
}

/** Règle un ou plusieurs ordres ouverts au même instant sur le même fil. */
function settle(Path $p, int $dur, array $orders): float {
  $entry = $p->c;
  $bars = [];
  foreach ($orders as $k => $o) $bars[$k] = orolado_fair_barrier($p->id, $dur, $o['side'], $o['mult'], $entry);
  $p->run(intdiv($dur * 1000, OROLADO_TICK_MS));
  $back = 0.0;
  foreach ($orders as $k => $o) $back += orolado_fair_credit(orolado_fair_verdict($o['side'], $p->c, $bars[$k]), $o['stake'], $o['mult']);
  return $back;
}

/**
 * Chaque stratégie : fn(Path, état) → liste d'ordres [side, mult, stake] (ou [] = passe son tour).
 * L'état garde ce que le joueur « se rappelle » (dernière perte, mise en cours…).
 */
$S = [
  'Au hasard (88 %)' => ['v100', 5, fn($p, &$st) => [['side' => random_int(0, 1) ? 'call' : 'put', 'mult' => 1.88, 'stake' => 1]]],
  'Toujours ACHETER' => ['v100', 5, fn($p, &$st) => [['side' => 'call', 'mult' => 1.88, 'stake' => 1]]],
  'ACHETER + VENDRE en même temps (88 %)' => ['v100', 5, fn($p, &$st) => [['side' => 'call', 'mult' => 1.88, 'stake' => 1], ['side' => 'put', 'mult' => 1.88, 'stake' => 1]]],
  'ACHETER + VENDRE en même temps (×5)' => ['v100', 5, fn($p, &$st) => [['side' => 'call', 'mult' => 5.0, 'stake' => 1], ['side' => 'put', 'mult' => 5.0, 'stake' => 1]]],
  'ACHETER + VENDRE en même temps (×50)' => ['v100', 10, fn($p, &$st) => [['side' => 'call', 'mult' => 50.0, 'stake' => 1], ['side' => 'put', 'mult' => 50.0, 'stake' => 1]]],
  'Martingale (double après perte)' => ['v100', 5, function ($p, &$st) {
    $st['m'] = $st['m'] ?? 1.0;
    return [['side' => random_int(0, 1) ? 'call' : 'put', 'mult' => 1.88, 'stake' => $st['m'], 'mart' => 1]];
  }],
  'Anti-martingale (double après gain)' => ['v100', 5, function ($p, &$st) {
    $st['m'] = $st['m'] ?? 1.0;
    return [['side' => random_int(0, 1) ? 'call' : 'put', 'mult' => 1.88, 'stake' => $st['m'], 'anti' => 1]];
  }],
  'Suivre la tendance (10 s)' => ['v100', 5, fn($p, &$st) => [['side' => $p->c >= $p->back(40) ? 'call' : 'put', 'mult' => 1.88, 'stake' => 1]]],
  'Contre la tendance (10 s)' => ['v100', 5, fn($p, &$st) => [['side' => $p->c >= $p->back(40) ? 'put' : 'call', 'mult' => 1.88, 'stake' => 1]]],
  'Suivre la tendance longue (1 min, trade 1 min)' => ['v100', 60, fn($p, &$st) => [['side' => $p->c >= $p->back(240) ? 'call' : 'put', 'mult' => 1.88, 'stake' => 1]]],
  'Chasse au ×50' => ['v100', 10, fn($p, &$st) => [['side' => random_int(0, 1) ? 'call' : 'put', 'mult' => 50.0, 'stake' => 1]]],
  'Boom : toujours VENDRE entre les pics' => ['boomspike', 5, fn($p, &$st) => [['side' => 'put', 'mult' => 1.88, 'stake' => 1]]],
  'Boom : ACHETER ×50 en attendant un pic' => ['boomspike', 10, fn($p, &$st) => [['side' => 'call', 'mult' => 50.0, 'stake' => 1]]],
  'Boom : VENDRE juste après un pic' => ['boomspike', 10, fn($p, &$st) => $p->spikeWithin(8) ? [['side' => 'put', 'mult' => 1.88, 'stake' => 1]] : []],
  'Crash : toujours ACHETER entre les chutes' => ['crash300', 5, fn($p, &$st) => [['side' => 'call', 'mult' => 1.88, 'stake' => 1]]],
  // « Quand la courbe est tout en haut, elle va forcément redescendre » : on attend une forte
  // montée (le prix au plus haut des 2 dernières minutes, bien au-dessus) puis on VEND en ×5 ;
  // et l'inverse tout en bas.
  // Élastique de long terme : l'indice est 2 fois AU-DESSUS (ou en dessous) de son prix de
  // départ, on parie sur le « retour » à chaque trade de 10 min. Doit rester sous 100 %.
  'Indice à 2× son départ → VENDRE 88 % (10 min)' => ['v100', 600, fn($p, &$st) => [['side' => 'put', 'mult' => 1.88, 'stake' => 1]], 2.0],
  'Indice à 2× son départ → VENDRE ×5 (10 min)' => ['v100', 600, fn($p, &$st) => [['side' => 'put', 'mult' => 5.0, 'stake' => 1]], 2.0],
  'Indice à 0,5× son départ → ACHETER 88 % (10 min)' => ['v100', 600, fn($p, &$st) => [['side' => 'call', 'mult' => 1.88, 'stake' => 1]], 0.5],
  'Crash à 2× son départ → VENDRE 88 % (10 min)' => ['crash300', 600, fn($p, &$st) => [['side' => 'put', 'mult' => 1.88, 'stake' => 1]], 2.0],
  'Tout en haut → VENDRE ×5 (attendre le retour)' => ['v100', 30, function ($p, &$st) {
    $n = count($p->hist);
    if ($n < 480) return [];
    $win = array_slice($p->hist, -480);
    $hi = max($win);
    $lo = min($win);
    if ($p->c < $hi || ($hi - $lo) < $p->c * 0.004) return [];
    return [['side' => 'put', 'mult' => 5.0, 'stake' => 1]];
  }],
  'Tout en bas → ACHETER ×5 (attendre le retour)' => ['v100', 30, function ($p, &$st) {
    $n = count($p->hist);
    if ($n < 480) return [];
    $win = array_slice($p->hist, -480);
    $hi = max($win);
    $lo = min($win);
    if ($p->c > $lo || ($hi - $lo) < $p->c * 0.004) return [];
    return [['side' => 'call', 'mult' => 5.0, 'stake' => 1]];
  }],
  'Tout en haut → VENDRE 88 % (attendre le retour)' => ['v100', 60, function ($p, &$st) {
    if (count($p->hist) < 480) return [];
    $win = array_slice($p->hist, -480);
    return $p->c >= max($win) ? [['side' => 'put', 'mult' => 1.88, 'stake' => 1]] : [];
  }],
];

// Filtre facultatif : php scripts/test-strategies.php joueurs trades "mot"
if (isset($argv[3]) && $argv[3] !== '') $S = array_filter($S, static fn($k) => str_contains($k, $argv[3]), ARRAY_FILTER_USE_KEY);
$rows = [];
$t0 = microtime(true);
foreach ($S as $name => $spec) {
  [$asset, $dur, $fn] = $spec;
  $startMult = (float) ($spec[3] ?? 1.0);
  $staked = 0.0; $back = 0.0; $up = 0; $ruined = 0; $best = -INF; $worst = INF; $n = 0;
  for ($pl = 0; $pl < $players; $pl++) {
    $p = new Path($A[$asset], $asset);
    // Indice placé loin de son prix de départ (test de l'élastique de long terme).
    if ($startMult !== 1.0) $p->c = (int) round($p->c * $startMult);
    $p->run(600);
    $bal = 1000.0; $st = []; $start = $bal;
    // Seuls les vrais trades comptent (une stratégie qui attend son moment passe son tour).
    for ($i = 0, $waits = 0; $i < $tradesPer && $waits < $tradesPer * 300; ) {
      $orders = $fn($p, $st);
      if (!$orders) { $p->run(4); $waits++; continue; }
      $i++;
      $need = array_sum(array_column($orders, 'stake'));
      if ($need > $bal) {
        if (isset($orders[0]['mart']) || isset($orders[0]['anti'])) { $orders[0]['stake'] = floor($bal); $st['m'] = 1.0; $need = $orders[0]['stake']; }
        if ($need < 1) { $ruined++; break; }
      }
      $bal -= $need;
      $got = settle($p, $dur, $orders);
      $bal += $got;
      $staked += $need; $back += $got; $n += count($orders);
      if (isset($orders[0]['mart'])) $st['m'] = $got > $need ? 1.0 : ($got > 0 ? $st['m'] : $st['m'] * 2);
      if (isset($orders[0]['anti'])) $st['m'] = $got > $need ? min($st['m'] * 2, 16) : 1.0;
      $p->run(random_int(4, 20));
    }
    $res = $bal - $start;
    if ($res > 0) $up++;
    $best = max($best, $res); $worst = min($worst, $res);
  }
  $rows[] = [$name, $n, $staked, $back, $back / max(1, $staked) * 100, $up / $players * 100, $ruined, $best, $worst];
  fprintf(STDERR, "  %-50s %6.2f %%  (%.0f s)\n", $name, $back / max(1, $staked) * 100, microtime(true) - $t0);
}

$out = "OROLADO — stratégies de joueurs contre le vrai moteur de prix et de règlement\n";
$out .= date('Y-m-d H:i') . " — $players joueurs par stratégie, jusqu'à $tradesPer tours chacun, 1 000 \$ de départ, mise 1 \$\n";
$out .= "Retour joueur = argent rendu ÷ argent misé. Moins de 100 % = la stratégie perd sur la durée.\n\n";
$out .= sprintf("%-50s %9s %12s %9s %12s %8s\n", 'Stratégie', 'Ordres', 'Misé ($)', 'Retour', 'Joueurs +', 'Ruinés');
foreach ($rows as $r) {
  $out .= sprintf("%-50s %9d %12s %8.2f%% %11.1f%% %8d\n", $r[0], $r[1], number_format($r[2], 0, ',', ' '), $r[4], $r[5], $r[6]);
}
$out .= "\n« Joueurs + » = part des joueurs qui finissent au-dessus de leur départ (chance à court terme).\n";
file_put_contents(__DIR__ . (isset($argv[3]) && $argv[3] !== '' ? '/rapport-strategies-elastique.txt' : '/rapport-strategies.txt'), $out);
echo $out;
