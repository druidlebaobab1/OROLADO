<?php
declare(strict_types=1);

/**
 * OROLADO — test des marchés ajoutés (indices.json), avec le VRAI générateur de prix du serveur
 * (orolado_feed_step) et les VRAIES règles de règlement (orolado_fair_barrier / verdict / credit).
 * Rien n'est écrit dans data/.
 *
 *   php scripts/test-indices.php            → test complet (≈ 10 min sur 4 cœurs)
 *   php scripts/test-indices.php --quick    → version courte (≈ 1 min), même contrôles, tolérances plus larges
 *
 * Contrôles :
 *  1. Fiches : ≥ 40 marchés ajoutés, 50+ au total, identifiants / noms uniques (≤ 10 lettres, majuscules),
 *     lignes objectif présentes et ordonnées pour chaque durée, APOCALYPSE (titanpulse) absent de la liste
 *     (il reste le dernier marché, après tous les ajoutés).
 *  2. Jours de cotation (≈ 1 jour simulé par marché) : prix toujours > 0, fini, dans [départ/4 ; départ×4],
 *     mouvement moyen d'un tick ≈ 0 (pas de pente), autant de hausses que de baisses.
 *  3. Trades sur TOUTES les durées (5 s → 10 min), enchaînés sur la courbe (le prix de départ de chaque
 *     trade est celui du moment, loin ou près du prix de base) : hausse ≈ 50 % (±1 % sur l'ensemble,
 *     marché par marché à 4 écarts-types), égalités rares, et ×5 / ×10 / ×50 rendent ≈ 90 %.
 */

require_once __DIR__ . '/../feed_lib.php';

$quick = in_array('--quick', $argv, true);
$part = null;
foreach ($argv as $a) if (preg_match('/^--part=(\d+)\/(\d+)$/', $a, $m)) $part = [(int) $m[1], (int) $m[2]];

$defs = orolado_indices_defs();
$ids = array_keys($defs);
$fail = 0;
$ok = function (bool $cond, string $msg, bool $show = false) use (&$fail): void {
  if (!$cond) $fail++;
  if (!$cond || $show || getenv('VERBOSE')) echo ($cond ? '  ok   ' : '  ÉCHEC ') . $msg . "\n";
};

/* ---------- Travail d'un morceau (lancé en parallèle) ---------- */
if ($part !== null) {
  [$k, $n] = $part;
  $out = [];
  foreach ($ids as $i => $id) {
    if ($i % $n !== $k) continue;
    $out[$id] = run_asset($id, $defs[$id]['model'], $quick);
  }
  echo json_encode($out);
  exit;
}

function run_asset(string $id, array $a, bool $quick): array {
  $res = ['days' => [], 'dur' => []];
  $base = (int) round($a['base'] * 100);
  // 2. Une journée de cotation (345 600 ticks ; version courte : 6 h).
  $T = $quick ? 86400 : 345600;
  $c = $base; $min = $c; $max = $c; $bad = 0; $sum = 0.0; $sum2 = 0.0; $up = 0; $dn = 0;
  for ($t = 0; $t < $T; $t++) {
    $nx = orolado_feed_step($a, $c);
    if (!is_int($nx) || $nx <= 0) { $bad++; $nx = $c; }
    $x = log($nx / $c);
    $sum += $x; $sum2 += $x * $x;
    if ($nx > $c) $up++; elseif ($nx < $c) $dn++;
    $c = $nx;
    if ($c < $min) $min = $c;
    if ($c > $max) $max = $c;
  }
  $res['days'] = ['T' => $T, 'bad' => $bad, 'min' => $min / $base, 'max' => $max / $base, 'mean' => $sum / $T,
    'sd' => sqrt(max(0, $sum2 / $T - ($sum / $T) ** 2)), 'up' => $up, 'dn' => $dn, 'end' => $c / $base];
  // 3. Trades enchaînés, toutes durées. Budget ~2,4 M ticks par durée (version courte : 0,3 M).
  $budget = $quick ? 300000 : 2400000;
  foreach (OROLADO_DURATIONS as $dur) {
    $nt = intdiv($dur * 1000, OROLADO_TICK_MS);
    $N = max(200, intdiv($budget, $nt));
    $r = ['N' => $N, 'up' => 0, 'dn' => 0, 'tie' => 0, 'pay' => ['5' => 0.0, '10' => 0.0, '50' => 0.0], 'win' => ['5' => 0, '10' => 0, '50' => 0], 'far' => 0];
    // Départ : de temps en temps on repart d'un prix tiré entre ½ et 2 fois la base (états variés).
    for ($i = 0; $i < $N; $i++) {
      if ($i % 50 === 0) $c = (int) round($base * exp((orolado_feed_u() * 2 - 1) * 0.69));
      $entry = $c;
      if (abs(log($entry / $base)) > 0.35) $r['far']++;
      $side = $i % 2 ? 'put' : 'call';
      $bar = orolado_fair_barrier($id, $dur, $side, 1.9, $entry);
      $big = [];
      foreach ([5.0, 10.0, 50.0] as $m) $big[(string) (int) $m] = orolado_fair_barrier($id, $dur, $side, $m, $entry);
      for ($k = 0; $k < $nt; $k++) $c = orolado_feed_step($a, $c);
      $v = orolado_fair_verdict($side, $c, $bar);
      // « hausse » = le prix finit au-dessus de la ligne 90 % (achat gagnant), quel que soit le côté joué.
      if ($v === 'void') $r['tie']++;
      elseif (($v === 'won') === ($side === 'call')) $r['up']++;
      else $r['dn']++;
      foreach ($big as $m => $b) {
        $vb = orolado_fair_verdict($side, $c, $b);
        $cr = orolado_fair_credit($vb, 1.0, (float) $m);
        $r['pay'][$m] += $cr;
        if ($vb === 'won') $r['win'][$m]++;
      }
    }
    $res['dur'][(string) $dur] = $r;
  }
  return $res;
}

echo "OROLADO — marchés ajoutés (indices.json)" . ($quick ? ' [version courte]' : '') . "\n";

/* ---------- 1. Fiches ---------- */
$all = orolado_feed_assets();
$legacy = orolado_feed_legacy_ids();
$ok(count($ids) >= 40, count($ids) . ' marchés ajoutés (≥ 40)');
$ok(count($all) >= 50, count($all) . ' marchés au total (≥ 50)');
$raw = json_decode((string) file_get_contents(__DIR__ . '/../indices.json'), true);
$ok(count($raw['indices']) === count($ids), 'tous les marchés de indices.json sont valides (' . count($raw['indices']) . ')');
$names = [];
foreach ($legacy as $l) $names[orolado_feed_asset_name($l)] = $l;
foreach ($ids as $id) {
  $nm = $defs[$id]['name'];
  $ok(!isset($names[$nm]), "$id : nom $nm unique");
  $names[$nm] = $id;
  $ok(strlen($nm) <= 10 && $nm === strtoupper($nm) && preg_match('/^[A-Z]+$/', $nm) === 1, "$id : nom court ($nm)");
  $ok(!in_array($id, $legacy, true), "$id : identifiant nouveau");
  foreach (OROLADO_DURATIONS as $d) {
    $row = $defs[$id]['fair'][(string) $d] ?? null;
    $ok(is_array($row) && $row[1] > 0 && $row[2] > $row[1] && $row[3] > $row[2], "$id $d s : lignes ×5 < ×10 < ×50");
    // Lignes calculées (log) : ×50 plus loin que ×10, etc. ; la ligne de vente est le miroir de celle d'achat.
    $ok(is_array($row) && abs(log(1 + $row[1]) + log(1 + $row[4])) < 1e-6, "$id $d s : vente = miroir de l'achat");
  }
  $e = orolado_fair_barrier($id, 60, 'call', 1.9, (int) round($defs[$id]['model']['base'] * 100));
  $ok($e === (int) round($defs[$id]['model']['base'] * 100), "$id : au prix de départ, ligne 90 % = prix d'entrée");
}
$ok(!isset($defs['titanpulse']), 'APOCALYPSE reste un marché d\'origine (affiché en dernier)');
$ok(orolado_feed_asset_id('LUCIFER') === 'lucifer' && orolado_feed_asset_id('zzz') === '', 'identifiants reconnus par le serveur (trade_lib)');

/* ---------- 2 et 3 : en parallèle (4 morceaux) ---------- */
$P = 4;
$procs = [];
$t0 = microtime(true);
for ($k = 0; $k < $P; $k++) {
  $cmd = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__FILE__) . ' --part=' . $k . '/' . $P . ($quick ? ' --quick' : '');
  $procs[$k] = popen($cmd, 'r');
}
$res = [];
foreach ($procs as $k => $h) {
  $txt = stream_get_contents($h);
  pclose($h);
  $j = json_decode((string) $txt, true);
  if (!is_array($j)) { $ok(false, "morceau $k illisible"); continue; }
  $res += $j;
}
echo '  (' . round(microtime(true) - $t0) . " s de calcul)\n";
$ok(count($res) === count($ids), 'tous les marchés simulés');

$pool = [];
$worst = ['z' => 0.0, 'what' => ''];
$rows = [];
foreach ($ids as $id) {
  if (!isset($res[$id])) continue;
  $d = $res[$id]['days'];
  $ok($d['bad'] === 0, "$id : jamais de prix nul ou faux sur " . round($d['T'] / 14400, 1) . ' h');
  $ok($d['min'] > 0.25 && $d['max'] < 4.0, sprintf('%s : prix entre %.2f× et %.2f× la base', $id, $d['min'], $d['max']));
  $zMean = $d['sd'] > 0 ? $d['mean'] / ($d['sd'] / sqrt($d['T'])) : 0;
  // L'élastique ramène vers la base : depuis la base, la moyenne reste nulle (aucune pente).
  $ok(abs($zMean) < 4.5, sprintf('%s : pas de pente (moyenne d\'un tick = %.2f écarts-types)', $id, $zMean));
  $mv = $d['up'] + $d['dn'];
  $zUD = $mv > 0 ? ($d['up'] - $mv / 2) / sqrt($mv / 4) : 0;
  $ok(abs($zUD) < 4.5, sprintf('%s : ticks en hausse %.2f %% (z = %.1f)', $id, 100 * $d['up'] / max(1, $mv), $zUD));
  $line = [];
  foreach ($res[$id]['dur'] as $dur => $r) {
    $n = $r['up'] + $r['dn'];
    $p = $n ? $r['up'] / $n : 0.5;
    $z = $n ? ($r['up'] - $n / 2) / sqrt($n / 4) : 0;
    if (abs($z) > abs($worst['z'])) $worst = ['z' => $z, 'what' => "$id $dur s"];
    // Marché par marché : 4,5 écarts-types (≈ 1 fausse alerte sur 100 000 tests).
    $ok(abs($z) < 4.5, sprintf('%s %s s : hausse %.2f %% sur %d trades (z = %.1f)', $id, $dur, 100 * $p, $n, $z));
    $ok($r['tie'] / $r['N'] < 0.01, sprintf('%s %s s : égalités %.3f %%', $id, $dur, 100 * $r['tie'] / $r['N']));
    $pool[$dur] = $pool[$dur] ?? ['up' => 0, 'dn' => 0, 'tie' => 0, 'N' => 0, 'pay' => ['5' => 0.0, '10' => 0.0, '50' => 0.0], 'far' => 0];
    $pool[$dur]['up'] += $r['up']; $pool[$dur]['dn'] += $r['dn']; $pool[$dur]['tie'] += $r['tie']; $pool[$dur]['N'] += $r['N'];
    $pool[$dur]['far'] += $r['far'];
    foreach ($r['pay'] as $m => $v) $pool[$dur]['pay'][$m] += $v;
    $line[] = sprintf('%s:%.1f', $dur, 100 * $p);
  }
  $rows[] = sprintf('  %-10s hausse %%  %s', strtoupper($id), implode('  ', $line));
}
echo "\nHausse (achat gagnant à 90 %) par durée, marché par marché :\n" . implode("\n", $rows) . "\n";

echo "\nEnsemble des " . count($ids) . " marchés, par durée :\n";
foreach ($pool as $dur => $r) {
  $n = $r['up'] + $r['dn'];
  $p = $r['up'] / max(1, $n);
  $tol = $quick ? 0.02 : 0.01;
  $ok(abs($p - 0.5) <= $tol, sprintf('%4s s : hausse %.2f %% sur %d trades (dont %d loin de la base), égalités %.3f %%  — tolérance ±%d %%',
    $dur, 100 * $p, $n, $r['far'], 100 * $r['tie'] / max(1, $r['N']), (int) ($tol * 100)), true);
  foreach ($r['pay'] as $m => $v) {
    $rtp = $v / max(1, $r['N']);
    // Rendu visé 90 % ; tolérance selon le bruit (×50 : gros gains rares).
    $se = (float) $m * sqrt((0.9 / (float) $m) * (1 - 0.9 / (float) $m) / max(1, $r['N']));
    $ok(abs($rtp - 0.90) < max(0.012, 4.5 * $se), sprintf('       ×%-2s rendu %.1f %% (visé 90 %%, ±%.1f)', $m, 100 * $rtp, 100 * max(0.012, 4.5 * $se)), true);
  }
}
printf("\nPire écart marché par marché : %s (z = %.2f)\n", $worst['what'], $worst['z']);
echo "\n" . ($fail === 0 ? 'TOUT EST BON' : $fail . ' échec(s)') . "\n";
exit($fail === 0 ? 0 : 1);
