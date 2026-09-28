<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Grand contrôle des 4 payouts (88 %, 500 %, 1000 %, 5000 %) sur les 10 actifs et les 6 durées,
 * avec le VRAI moteur de prix (orolado_feed_step) et les VRAIES règles de règlement
 * (orolado_fair_barrier / verdict / credit). Rien n'est écrit dans data/.
 *
 * Mesure pour chaque combinaison :
 *  - le retour joueur (argent rendu ÷ misé), qui doit rester sous 100 % ;
 *  - les « failles » : acheter/vendre juste après une grosse montée ou une grosse chute ;
 *  - l'alternance gain/perte : gagner après un gain est-il plus probable qu'après une perte ?
 *
 * Lancer un actif : php scripts/test-payouts.php <actif> <millions de ticks>  → JSON
 * Lancer tout     : php scripts/test-payouts.php all <millions>              → rapport
 */
require __DIR__ . '/../feed_lib.php';
ini_set('memory_limit', '-1');

$NAMES = [
  'v100' => 'VOLATILITY', 'stable' => 'ZUL', 'apex500' => 'ORO 888', 'horizon50' => 'BAAL',
  'goldtrend' => 'OROF', 'v75' => 'PYTHON', 'nexusprime' => 'ASMODUS', 'titanpulse' => 'APOCALYPSE',
  'boomspike' => 'VALAC', 'crash300' => 'AZAZEL',
];
$MULTS = OROLADO_MULTS;
$DURS = OROLADO_DURATIONS;
$TPS = intdiv(1000, OROLADO_TICK_MS); // ticks par seconde

$asset = (string) ($argv[1] ?? 'all');
$millions = max(0.2, (float) ($argv[2] ?? 4));

if ($asset === 'all') {
  // Un processus par actif, en parallèle.
  $php = PHP_BINARY;
  $procs = [];
  foreach (array_keys(orolado_feed_assets()) as $a) {
    $cmd = escapeshellarg($php) . ' ' . escapeshellarg(__FILE__) . ' ' . escapeshellarg($a) . ' ' . $millions;
    $procs[$a] = popen($cmd, 'r');
  }
  $res = [];
  foreach ($procs as $a => $p) {
    $out = stream_get_contents($p);
    pclose($p);
    $j = json_decode((string) $out, true);
    if (!is_array($j)) { fwrite(STDERR, "échec $a : $out\n"); exit(1); }
    $res[$a] = $j;
  }
  report($res, $NAMES, $MULTS, $DURS, $millions);
  exit(0);
}

/* ------------------------- simulation d'un actif ------------------------- */
$A = orolado_feed_assets();
if (!isset($A[$asset])) { fwrite(STDERR, "actif inconnu\n"); exit(1); }
$cfg = $A[$asset];
$N = (int) round($millions * 1e6);
// 4 fils de prix indépendants (redémarrage au prix de base, comme le serveur).
$paths = [];
$per = intdiv($N, 4);
for ($k = 0; $k < 4; $k++) {
  $c = (int) round($cfg['base'] * 100);
  $P = new SplFixedArray($per);
  for ($i = 0; $i < $per; $i++) { $c = orolado_feed_step($cfg, $c); $P[$i] = $c; }
  $paths[] = $P;
}

$table = orolado_fair_table()[$asset];
// Écart-type des mouvements passés (10 s et 60 s) pour repérer les « grosses » montées / chutes.
$lb = [10 * $TPS, 60 * $TPS];
$sd = [];
foreach ($lb as $L) {
  $s = 0.0; $s2 = 0.0; $n = 0;
  $P = $paths[0];
  for ($i = $L; $i < $per; $i += 37) { $r = $P[$i] / $P[$i - $L] - 1; $s += $r; $s2 += $r * $r; $n++; }
  $m = $s / $n;
  $sd[$L] = sqrt(max(1e-18, $s2 / $n - $m * $m));
}

$stat = [];   // [dur][mult][side] = [n, won, void]
$cond = [];   // [dur][mult][side][bucket] = [n, won, void]   bucket = up10/down10/up60/down60
$seq = [];    // [dur][mult] = [afterWin_n, afterWin_won, afterLoss_n, afterLoss_won]
$stride = 3;
$maxL = max($lb);
foreach ($DURS as $d) {
  $D = $d * $TPS;
  $rows = [];
  foreach ($MULTS as $mi => $m) {
    foreach (['call', 'put'] as $side) {
      $idx = 0;
      if ($m === 5.0) $idx = 1; else if ($m === 10.0) $idx = 2; else if ($m === 50.0) $idx = 3;
      if ($idx > 0 && $side === 'put') $idx += 3;
      $rows["$mi|$side"] = (float) $table[(string) $d][$idx];
      $stat[$d][$mi][$side] = [0, 0, 0];
      foreach (['up10', 'down10', 'up60', 'down60'] as $b) $cond[$d][$mi][$side][$b] = [0, 0, 0];
    }
    $seq[$d][$mi] = [0, 0, 0, 0];
  }
  foreach ($paths as $P) {
    for ($i = $maxL; $i + $D < $per; $i += $stride) {
      $e = $P[$i];
      $x = $P[$i + $D];
      $z10 = ($e / $P[$i - $lb[0]] - 1) / $sd[$lb[0]];
      $z60 = ($e / $P[$i - $lb[1]] - 1) / $sd[$lb[1]];
      $bk = [];
      if ($z10 > 2) $bk[] = 'up10'; else if ($z10 < -2) $bk[] = 'down10';
      if ($z60 > 2) $bk[] = 'up60'; else if ($z60 < -2) $bk[] = 'down60';
      foreach ($rows as $key => $rel) {
        [$mi, $side] = explode('|', $key);
        $bar = (int) round($e * (1 + $rel), 0, PHP_ROUND_HALF_UP);
        $v = orolado_fair_verdict($side, $x, $bar);
        $w = $v === 'won' ? 1 : 0;
        $vo = $v === 'void' ? 1 : 0;
        $st =& $stat[$d][$mi][$side];
        $st[0]++; $st[1] += $w; $st[2] += $vo;
        foreach ($bk as $b) { $c =& $cond[$d][$mi][$side][$b]; $c[0]++; $c[1] += $w; $c[2] += $vo; unset($c); }
        unset($st);
      }
    }
    // Trades l'un après l'autre (on relance dès que le précédent se termine) : CALL.
    foreach ($MULTS as $mi => $m) {
      $rel = $rows["$mi|call"];
      $prev = null;
      for ($i = $maxL; $i + $D < $per; $i += $D) {
        $bar = (int) round($P[$i] * (1 + $rel), 0, PHP_ROUND_HALF_UP);
        $v = orolado_fair_verdict('call', $P[$i + $D], $bar);
        if ($v === 'void') continue;
        $w = $v === 'won';
        if ($prev === true) { $seq[$d][$mi][0]++; if ($w) $seq[$d][$mi][1]++; }
        if ($prev === false) { $seq[$d][$mi][2]++; if ($w) $seq[$d][$mi][3]++; }
        $prev = $w;
      }
    }
  }
}
echo json_encode(['ticks' => $per * 4, 'stat' => $stat, 'cond' => $cond, 'seq' => $seq]);
exit(0);

/* ------------------------------- rapport ------------------------------- */
function rtp(array $s, float $m): float {
  [$n, $w, $v] = $s;
  return $n ? ($w * $m + $v) / $n : 0.0;
}
/** Erreur type du retour, en comptant seulement les fenêtres indépendantes. */
function se(array $s, float $m, int $indep): float {
  [$n, $w] = $s;
  if (!$n || !$indep) return 1.0;
  $p = $w / $n;
  $k = min($n, $indep);
  return $m * sqrt(max($p * (1 - $p), 1e-9) / $k);
}
function report(array $res, array $NAMES, array $MULTS, array $DURS, float $millions): void {
  $TPS = intdiv(1000, OROLADO_TICK_MS);
  $lbl = [0 => '88 %', 1 => '500 %', 2 => '1000 %', 3 => '5000 %'];
  $out = [];
  $out[] = 'OROLADO — contrôle complet des 4 payouts, 10 actifs, 6 durées';
  $out[] = date('Y-m-d H:i') . " — " . number_format($millions, 1) . " million(s) de prix simulés par actif (vrai moteur, vraies règles)";
  $out[] = 'Retour = argent rendu ÷ argent misé. Sous 100 % = le site gagne sur la durée. Visé : ~94 %.';
  $out[] = '';
  $flags = [];
  $global = [0 => [0, 0.0], 1 => [0, 0.0], 2 => [0, 0.0], 3 => [0, 0.0]];
  $totalTrades = 0;
  foreach ($res as $a => $r) {
    $name = $NAMES[$a] ?? $a;
    $out[] = str_pad($name, 12) . '  durée   ' . implode('  ', array_map(fn($l) => str_pad($l, 16, ' ', STR_PAD_LEFT), $lbl));
    foreach ($DURS as $d) {
      $cells = [];
      $indep = intdiv((int) $r['ticks'], $d * $TPS);
      foreach ($MULTS as $mi => $m) {
        $st = $r['stat'][$d][$mi];
        $both = [$st['call'][0] + $st['put'][0], $st['call'][1] + $st['put'][1], $st['call'][2] + $st['put'][2]];
        $rt = rtp($both, $m);
        $e = se($both, $m, 2 * $indep);
        $totalTrades += $both[0];
        $global[$mi][0] += $both[0];
        $global[$mi][1] += $rt * $both[0];
        $win = $both[0] ? 100 * $both[1] / $both[0] : 0;
        $cells[] = str_pad(sprintf('%5.1f%% (g %4.1f%%)', 100 * $rt, $win), 16, ' ', STR_PAD_LEFT);
        foreach (['call', 'put'] as $side) {
          $s1 = $st[$side];
          $r1 = rtp($s1, $m);
          $e1 = se($s1, $m, $indep);
          if ($r1 > 1.0 && ($r1 - 1.0) > 3 * $e1) $flags[] = "$name {$d}s {$lbl[$mi]} $side : retour " . sprintf('%.1f%%', 100 * $r1);
        }
        foreach (['call', 'put'] as $side) {
          foreach ($r['cond'][$d][$mi][$side] as $b => $c) {
            if ($c[0] < 2000) continue;
            $rc = rtp($c, $m);
            $ec = se($c, $m, max(1, (int) round($indep * $c[0] / max(1, $st[$side][0]))));
            if ($rc > 1.0 && ($rc - 1.0) > 3 * $ec) {
              $txt = ['up10' => 'après une grosse MONTÉE (10 s)', 'down10' => 'après une grosse CHUTE (10 s)', 'up60' => 'après une grosse MONTÉE (1 min)', 'down60' => 'après une grosse CHUTE (1 min)'][$b];
              $flags[] = "$name {$d}s {$lbl[$mi]} " . strtoupper($side) . " $txt : retour " . sprintf('%.1f%% ± %.1f', 100 * $rc, 100 * $ec) . " sur {$c[0]} trades";
            }
          }
        }
      }
      $out[] = str_pad('', 12) . '  ' . str_pad($d . 's', 5, ' ', STR_PAD_LEFT) . '  ' . implode('  ', $cells);
    }
    $out[] = '';
  }
  $out[] = '(g = part des trades gagnés. Attendu : 88 % → ~50 %, 500 % → ~19 %, 1000 % → ~9 %, 5000 % → ~2 %)';
  $out[] = '';
  $out[] = 'MOYENNE PAR PAYOUT (tous actifs, toutes durées) :';
  foreach ($global as $mi => $g) $out[] = '  ' . str_pad($lbl[$mi], 7) . ' : ' . sprintf('%.2f%%', $g[0] ? 100 * $g[1] / $g[0] : 0) . '  (' . number_format($g[0], 0, ',', ' ') . ' trades)';
  $out[] = '  Total : ' . number_format($totalTrades, 0, ',', ' ') . ' trades simulés';
  $out[] = '';
  $out[] = 'ALTERNANCE GAIN / PERTE (trades l\'un après l\'autre, ACHETER) : chance de gagner après un gain / après une perte';
  $worst = 0.0;
  foreach ($res as $a => $r) {
    foreach ($DURS as $d) foreach ($MULTS as $mi => $m) {
      $q = $r['seq'][$d][$mi];
      if ($q[0] < 300 || $q[2] < 300) continue;
      $pw = $q[1] / $q[0]; $pl = $q[3] / $q[2];
      $p = ($q[1] + $q[3]) / ($q[0] + $q[2]);
      $sez = sqrt(max($p * (1 - $p), 1e-9) * (1 / $q[0] + 1 / $q[2]));
      $z = ($pw - $pl) / $sez;
      if (abs($z) > abs($worst)) $worst = $z;
      if (abs($z) > 4) $flags[] = ($NAMES[$a] ?? $a) . " {$d}s {$lbl[$mi]} : gagne " . sprintf('%.1f%% après un gain contre %.1f%% après une perte', 100 * $pw, 100 * $pl);
    }
  }
  $out[] = '  Plus grand écart trouvé : ' . sprintf('%.1f', abs($worst)) . ' écarts-types (au-dessous de 4 = hasard normal, pas de motif exploitable)';
  $out[] = '';
  $out[] = $flags ? 'FAILLES TROUVÉES :' : 'FAILLES TROUVÉES : aucune (aucune combinaison ni situation ne rapporte plus de 100 % de façon sûre)';
  foreach ($flags as $f) $out[] = '  ⚠ ' . $f;
  $txt = implode("\n", $out) . "\n";
  echo $txt;
  file_put_contents(__DIR__ . '/rapport-payouts.txt', $txt);
}
