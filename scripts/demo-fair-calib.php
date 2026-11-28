<?php
declare(strict_types=1);
// Ligne de commande seulement. 2026-11-28 (propriétaire) — DÉMO PLUS FACILE : calcule, pour chaque indice et chaque durée,
// la ligne objectif de la DÉMO (ratio barrière / prix d'entrée) avec le VRAI moteur de prix (orolado_feed_step), pour que
// le joueur démo gagne ≈ 62 % à 90 % et récupère ≈ 118 % à ×5 / ×10 / ×50. Écrit demo_fair.json (serveur) et js/demo_fair.js
// (téléphone). Le RÉEL n'utilise jamais ces lignes (fair_table.php / feed_lib.php inchangés).
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
chdir(__DIR__ . '/..');
require 'orolado_lib.php'; require_once 'trade_lib.php';
$N = (int) ($argv[1] ?? 1500);
$only = $argv[2] ?? '';
$part = $argv[3] ?? ''; [$pk, $pn] = $part !== '' ? array_map('intval', explode('/', $part)) : [0, 1];
$outF = $part !== '' ? 'demo_fair.part' . $pk . '.json' : 'demo_fair.json';
const DF_P = ['1.9' => 0.62, '5' => 0.236, '10' => 0.118, '50' => 0.0236];
$durs = OROLADO_DURATIONS; $ticks = []; foreach ($durs as $d) $ticks[$d] = intdiv($d * 1000, OROLADO_TICK_MS);
$maxT = max($ticks);
$out = is_file($outF) ? (json_decode((string) file_get_contents($outF), true) ?: []) : [];
$ix = -1;
foreach (orolado_feed_assets() as $id => $a) {
  $ix++;
  if ($only !== '' && $only !== $id) continue;
  if ($ix % $pn !== $pk || isset($out[$id])) continue;
  $c0 = (int) round((float) $a['base'] * 100);
  $X = []; foreach ($durs as $d) $X[$d] = [];
  for ($s = 0; $s < $N; $s++) {
    $c = $c0;
    for ($t = 1; $t <= $maxT; $t++) { $c = orolado_feed_step($a, $c); foreach ($durs as $d) if ($ticks[$d] === $t) $X[$d][] = $c / $c0; }
  }
  $row = [];
  foreach ($durs as $d) {
    $v = $X[$d]; sort($v); $n = count($v); $r = [];
    foreach (DF_P as $m => $p) {
      $kc = max(0, min($n - 1, (int) floor((1 - $p) * $n))); // CALL gagne si sortie > ligne
      $kp = max(0, min($n - 1, (int) floor($p * $n)));       // PUT gagne si sortie < ligne
      $r[$m] = [round($v[$kc] - 1, 7), round($v[$kp] - 1, 7)];
    }
    $row[(string) $d] = $r;
  }
  $out[$id] = $row;
  file_put_contents($outF, json_encode($out, JSON_UNESCAPED_UNICODE));
  fwrite(STDERR, $id . ' ');
}
if ($part !== '') { echo "\nOK part $pk\n"; exit; }
file_put_contents('js/demo_fair.js', "/* Généré par scripts/demo-fair-calib.php — lignes objectif de la DÉMO (jamais du réel). */\nwindow.D6 = window.D6 || {}; D6.DEMO_FAIR = " . json_encode($out) . ";\n");
echo "\nOK " . count($out) . " indices\n";
