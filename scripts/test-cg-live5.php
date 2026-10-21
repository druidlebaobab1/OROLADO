<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2901 — groupe « live5 » : 16 nouveaux jeux EN DIRECT « courses & sports » (casino_live5.php, CASINO_LIVE5, moteur casino_draw_*).
 * 1) déclaration ; 2) retour EXACT de chaque choix (énumération de TOUS les résultats possibles, faite ici indépendamment du jeu)
 * entre 93 et 94 %, cote ≤ ×1000 ; 3) simulation de vrais tirages (cohérence de ce que le téléphone dessine + fréquences + retour
 * simulé) ; 4) vrais paris (argent retiré une fois, versé une fois, retard / double refusés, ancien tour sûr) ; 5) coût serveur.
 * Fausse caisse, dossier temporaire. Option : php scripts/test-cg-live5.php <jeu> … (seulement ces jeux).
 */
$tmp = sys_get_temp_dir() . '/orolado_live5_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'casino_ext.php', 'casino_live4.php', 'casino_live5.php'] as $f) if (is_file(__DIR__ . '/../' . $f)) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = []; $credits = 0;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$credits) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') {
    if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient'];
    $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bal[$u]];
  }
  if ($fn === 'resolve_trade') {
    $k = $u . '|' . $a['p_order'];
    if (!isset($keys[$k])) { $keys[$k] = 1; $credits++; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); }
    return ['ok' => true, 'real' => $bal[$u]];
  }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
mkdir($tmp . '/casino_ext');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$ALL = array_keys(CASINO_LIVE5);
$G = array_slice($argv, 1) ?: $ALL;
$T0 = microtime(true);

echo "1) Déclaration : 16 jeux en direct, clés libres, anciens jeux inchangés\n";
check('CASINO_LIVE5 = 16 jeux, mises ouvertes 120 s, période ≥ 140 s, clés = CASINO_LIVE5_KEYS', count($ALL) === 16 && $ALL === CASINO_LIVE5_KEYS && count(array_filter(CASINO_LIVE5, static fn($pb) => $pb[1] === 120 && $pb[0] >= 140)) === 16);
check('CASINO_DRAW, CASINO_LIVE2, CASINO_LIVE3 inchangés' . (CASINO_LIVE4 ? ', CASINO_LIVE4 présent (12)' : ''), count(CASINO_DRAW) === 5 && count(CASINO_LIVE2) === 4 && count(CASINO_LIVE3) === 12 && CASINO_LIVE3['moonshot'] === [165, 120] && (!CASINO_LIVE4 || count(CASINO_LIVE4) === 12));
check('aucune clé en double dans CASINO_GAMES / CASINO_MULTI ; aucune clé commune avec LIVE 4', count(CASINO_GAMES) === count(array_unique(CASINO_GAMES)) && count(CASINO_MULTI) === count(array_unique(CASINO_MULTI)) && !array_intersect($ALL, CASINO_LIVE4_KEYS));
$tour = (string) file_get_contents(__DIR__ . '/../casino-tour.php');
foreach ($ALL as $g) check("$g : clé valide, jeu à tirage, plusieurs étapes, pas une fiche ext, lisible par casino-tour.php", (bool) preg_match('/^[a-z][a-z0-9]{1,15}$/', $g) && casino_is_draw($g)
  && in_array($g, CASINO_GAMES, true) && in_array($g, CASINO_MULTI, true) && casino_ext_type($g) === '' && casino_draw_pb($g) === CASINO_LIVE5[$g]
  && strpos($tour, 'CASINO_LIVE5_KEYS') !== false && !isset(CASINO_DRAW[$g]) && !isset(CASINO_LIVE2[$g]) && !isset(CASINO_LIVE3[$g]) && !isset(CASINO_LIVE4[$g]));
$clash = [];
foreach (array_merge(glob(__DIR__ . '/../casino_ext/*.php') ?: [], glob(__DIR__ . '/../js/games/cat-*.js') ?: []) as $f) {
  if (basename($f) === 'cat-live5.js') continue;
  $src = (string) file_get_contents($f);
  foreach ($ALL as $g) if (preg_match("/'" . $g . "'\s*=>\s*\[/", $src) || preg_match("/\bk:\s*'" . $g . "'/", $src) || preg_match("/A\('" . $g . "'/", $src)) $clash[] = "$g@" . basename($f);
}
check('aucune clé déjà prise (fiches casino_ext, catalogues js)', !$clash, implode(',', $clash));

echo "2) Retour EXACT de chaque choix : TOUS les résultats possibles (énumérés ici, sans les calculs du jeu), chance × gain, entre 93 et 94 %\n";
/** toutes les permutations de 0…n−1 */
function perms(int $n): array { if ($n === 1) return [[0]]; $o = []; foreach (perms($n - 1) as $p) for ($i = 0; $i < $n; $i++) { $q = $p; array_splice($q, $i, 0, [$n - 1]); $o[] = $q; } return $o; }
/** [[chance, résultat], …] : tous les résultats d'un jeu, chances exactes. */
function all_outcomes(string $g): array {
  $L = [];
  if (isset(CASINO_L5_RACE[$g])) {
    $w = CASINO_L5_RACE[$g];
    foreach (perms(count($w)) as $o) { $p = 1.0; $rest = array_sum($w); foreach ($o as $i) { $p *= $w[$i] / $rest; $rest -= $w[$i]; } $L[] = [$p, ['n' => $o[0], 'r' => $o]]; }
    return $L;
  }
  switch ($g) {
    case 'monsterlive': foreach (CASINO_L5_MONSTER as $k => $pm) $L[] = [$pm / 1000, ['n' => $k]]; break;
    case 'penaltylive': // 2^10 suites de tirs ; égalité après 10 : mort subite, chaque camp la gagne avec 1/2 (tour par tour : 3/16 contre 3/16)
      for ($m = 0; $m < 1024; $m++) {
        $k = []; $p = 1.0; for ($j = 0; $j < 10; $j++) { $b = $m >> $j & 1; $k[] = $b; $p *= $b ? 0.75 : 0.25; }
        $g2 = [0, 0]; $st = 0;
        for ($j = 0; $j < 10; $j++) { $g2[$j % 2] += $k[$j]; $leftH = 5 - intdiv($j + 2, 2); $leftA = 5 - intdiv($j + 1, 2); if ($g2[0] > $g2[1] + $leftA || $g2[1] > $g2[0] + $leftH) { $st = $j + 1; break; } }
        if ($st === 0) { $L[] = [$p / 2, ['n' => 0, 'k' => array_merge($k, [1, 0]), 'st' => 0]]; $L[] = [$p / 2, ['n' => 1, 'k' => array_merge($k, [0, 1]), 'st' => 0]]; }
        else { $kk = array_slice($k, 0, $st); $h = 0; $a = 0; foreach ($kk as $j => $x) { if ($j % 2) $a += $x; else $h += $x; } $L[] = [$p, ['n' => $h > $a ? 0 : 1, 'k' => $kk, 'st' => $st]]; }
      }
      break;
    case 'basketlive':
      for ($m = 0; $m < 1024; $m++) { $s = []; $p = 1.0; for ($j = 0; $j < 10; $j++) { $b = $m >> $j & 1; $s[] = $b; $p *= $b ? 0.55 : 0.45; } $L[] = [$p, ['n' => array_sum($s), 's' => $s]]; }
      break;
    case 'boxinglive':
      foreach ([0 => .22, 1 => .25, 2 => .06, 3 => .25, 4 => .22] as $n => $p) { if ($n === 0 || $n === 4) foreach ([1 => .20, 2 => .19, 3 => .18, 4 => .16, 5 => .14, 6 => .13] as $r => $q) $L[] = [$p * $q, ['n' => $n, 'r' => $r]]; else $L[] = [$p, ['n' => $n, 'r' => 6]]; }
      break;
    case 'tennislive': for ($k = 0; $k <= 40; $k++) $L[] = [$k < 40 ? 0.8 ** $k * 0.2 : 0.8 ** 40, ['n' => $k]]; break;
    case 'cricketlive': // 7^6 suites de balles, regroupées par (points, un six, un guichet)
      $V = [[0, .36], [1, .30], [2, .10], [3, .02], [4, .11], [6, .05], [-1, .06]]; $cls = [];
      for ($m = 0; $m < 117649; $m++) {
        $b = []; $p = 1.0; $x = $m; for ($j = 0; $j < 6; $j++) { [$v, $q] = $V[$x % 7]; $x = intdiv($x, 7); $b[] = $v; $p *= $q; }
        $r = 0; foreach ($b as $v) $r += max(0, $v); $key = $r . '|' . (in_array(6, $b, true) ? 1 : 0) . '|' . (in_array(-1, $b, true) ? 1 : 0);
        if (!isset($cls[$key])) $cls[$key] = [0.0, ['n' => $r, 'b' => $b]]; $cls[$key][0] += $p;
      }
      $L = array_values($cls);
      break;
    case 'archerylive':
      $A = [10 => .16, 9 => .22, 8 => .20, 7 => .15, 6 => .10, 5 => .07, 4 => .04, 3 => .03, 2 => .02, 1 => .005, 0 => .005];
      foreach ($A as $a => $pa) foreach ($A as $b => $pb) foreach ($A as $c => $pc) $L[] = [$pa * $pb * $pc, ['n' => $a + $b + $c, 'a' => [$a, $b, $c]]];
      break;
    case 'fishinglive': foreach ([.18, .30, .24, .16, .08, .04] as $n => $p) $L[] = [$p, ['n' => $n]]; break;
    case 'balloonlive': // les ballons sont mélangés au hasard : chaque trio de places = un trio de ballons au hasard (220 trios, même chance)
      $col = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3];
      for ($a = 0; $a < 12; $a++) for ($b = $a + 1; $b < 12; $b++) for ($c = $b + 1; $c < 12; $c++) $L[] = [1 / 220, ['n' => 0, 'l' => $col, 'h' => [$a, $b, $c]]];
      break;
    case 'volcanolive':
      foreach ([.16, .15, .14, .12, .11, .09, .08, .06, .05, .04] as $i => $p) for ($m = 0; $m < 32; $m++) { $b = []; for ($j = 0; $j < 5; $j++) $b[] = $m >> $j & 1; $L[] = [$p / 32, ['n' => $i + 1, 'b' => $b]]; }
      break;
  }
  return $L;
}
$okR = true; $rows = [];
foreach ($G as $g) {
  $L = all_outcomes($g); $sum = array_sum(array_column($L, 0));
  $od = casino_live5_odds($g); $pr = casino_live5_probs($g); $txt = []; $okG = abs($sum - 1) < 1e-9; $maxO = 0;
  foreach ($od as $sel => $o) {
    $rtp = 0.0; $pw = 0.0;
    foreach ($L as [$p, $out]) { $m = casino_draw_mult($g, (string) $sel, $out); $rtp += $p * $m; if ($m > 0) $pw += $p; }
    $ok = $rtp <= 0.94 + 1e-9 && $rtp >= 0.93 && abs($pw - $pr[$sel]) < 1e-9 && $o <= 1000 && $o > 1.01; $maxO = max($maxO, $o);
    if (!$ok) { $okR = false; $okG = false; }
    $txt[] = "$sel ×$o " . number_format($rtp * 100, 2) . '%' . ($ok ? '' : ' !!');
  }
  $rows[] = sprintf('     %-15s %s', $g, implode(' · ', $txt));
  check(sprintf('%s : %d résultats (Σ chances = 1), chaque choix entre 93 %% et 94 %%, chance gagnante = chance déclarée, cote max ×%.2f ≤ ×1000', $g, count($L), $maxO), $okG);
}
echo implode("\n", $rows) . "\n";

echo "3) Simulation de vrais tirages : ce que le téléphone dessine est cohérent ; fréquences = chances ; retour simulé\n";
$simTxt = [];
foreach ($G as $g) {
  $M = 120000; $hit = []; $ret = []; $okS = true; $bad = ''; $t0 = hrtime(true); $len = 0;
  for ($k = 0; $k < $M; $k++) {
    $o = casino_live5_draw($g);
    if (isset($o['p']) || isset($o['c']) || !is_int($o['n'])) $okS = false;
    if (isset(CASINO_L5_RACE[$g])) { $r = $o['r']; $c = $r; sort($c); if ($c !== range(0, count(CASINO_L5_RACE[$g]) - 1) || $o['n'] !== $r[0]) $okS = false; }
    switch ($g) {
      case 'monsterlive': if ($o['n'] < 0 || $o['n'] > 12) $okS = false; break;
      case 'penaltylive':
        $kk = $o['k']; $nk = count($kk); $len += $nk; $h = 0; $a = 0; foreach ($kk as $j => $x) { if ($j % 2) $a += $x; else $h += $x; }
        if ($o['st'] > 0 && ($nk !== $o['st'] || casino_live5_pen_stop(array_pad($kk, 10, 0)) !== $o['st'])) $okS = false; // arrêté au bon tir
        if ($o['st'] === 0) { if ($nk < 12 || $nk % 2 || casino_live5_pen_stop(array_slice($kk, 0, 10)) !== 0) $okS = false; for ($j = 10; $j < $nk; $j += 2) if (($kk[$j] === $kk[$j + 1]) !== ($j + 2 < $nk)) $okS = false; } // mort subite
        if (($h > $a ? 0 : 1) !== $o['n'] || $h === $a) { $okS = false; $bad = json_encode($o); }
        break;
      case 'basketlive': if (count($o['s']) !== 10 || array_sum($o['s']) !== $o['n']) $okS = false; break;
      case 'boxinglive': if ($o['n'] < 0 || $o['n'] > 4 || $o['r'] < 1 || $o['r'] > 6 || (!in_array($o['n'], [0, 4], true) && $o['r'] !== 6)) $okS = false; break;
      case 'tennislive': if ($o['n'] < 0 || $o['n'] > 40) $okS = false; break;
      case 'cricketlive': $s = 0; foreach ($o['b'] as $v) { if (!in_array($v, [0, 1, 2, 3, 4, 6, -1], true)) $okS = false; $s += max(0, $v); } if (count($o['b']) !== 6 || $s !== $o['n']) $okS = false; break;
      case 'archerylive': if (count($o['a']) !== 3 || array_sum($o['a']) !== $o['n'] || max($o['a']) > 10 || min($o['a']) < 0) $okS = false; break;
      case 'fishinglive': if ($o['n'] < 0 || $o['n'] > 5) $okS = false; break;
      case 'balloonlive': $c = $o['l']; sort($c); if ($c !== CASINO_L5_BALLOON || count(array_unique($o['h'])) !== 3 || max($o['h']) > 11 || min($o['h']) < 0) $okS = false; break;
      case 'volcanolive': if ($o['n'] < 1 || $o['n'] > 10 || count($o['b']) !== 5) $okS = false; break;
    }
    foreach (casino_live5_odds($g) as $sel => $od) { $m = (float) casino_draw_mult($g, (string) $sel, $o); $ret[$sel] = ($ret[$sel] ?? 0) + $m; if ($m > 0) $hit[$sel] = ($hit[$sel] ?? 0) + 1; }
  }
  $us = (hrtime(true) - $t0) / 1e3 / $M;
  $tx = []; $okF = $okS; $worst = 0.0;
  foreach (casino_live5_probs($g) as $sel => $p) {
    $f = ($hit[$sel] ?? 0) / $M; $sd = sqrt($p * (1 - $p) / $M); $z = abs($f - $p) / $sd; $worst = max($worst, $z);
    if ($z > 5) $okF = false;
    $tx[] = $sel . ' ' . number_format(($ret[$sel] ?? 0) / $M * 100, 1) . '%';
  }
  check(sprintf('%s : %d tirages cohérents, fréquences = chances (écart max %.1fσ ≤ 5σ), %.1f µs par tirage%s', $g, $M, $worst, $us, $g === 'penaltylive' ? sprintf(', %.1f tirs en moyenne', $len / $M) : ''), $okF, $bad);
  $simTxt[] = sprintf('     %-15s %s', $g, implode(' · ', $tx));
}
echo implode("\n", $simTxt) . "\n";
$inv = ['dogracelive' => ['w6', 'l0', 'x'], 'camelracelive' => ['w5', 'l5', 'odd'], 'snailracelive' => ['q10', 'q44', 'w4'], 'chickenracelive' => ['w6', 'even'], 'boatracelive' => ['t5', 'w9'],
  'spaceracelive' => ['k3', 'w6'], 'monsterlive' => ['c5', 'c13'], 'penaltylive' => ['x', 'H'], 'basketlive' => ['p9', 'e7'], 'boxinglive' => ['ko2', 'green'], 'tennislive' => ['srv2', 'y'],
  'cricketlive' => ['r4', 'four'], 'archerylive' => ['a4', 'nine'], 'fishinglive' => ['f6', 'boot'], 'balloonlive' => ['gold2', 'red3'], 'volcanolive' => ['v4', 'up']];
$okI = true; foreach ($inv as $g => $l) foreach ($l as $s) if (casino_draw_mult($g, $s, []) !== null) { $okI = false; echo "     accepté à tort : $g/$s\n"; }
check('sélections invalides refusées', $okI);
check('rien n\'est montré pendant les mises (aucun « pre »)', !array_filter($ALL, static fn($g) => casino_live5_pre($g, casino_live5_draw($g)) !== []));

echo "4) Vrais paris : retirés une fois, réglés sur le tirage commun, versés une fois ; retard / double refusés\n";
$U = 'aaaaaaaa-1111-2222-3333-555555555555';
$db = blank_db();
$db['users']['u_l'] = ['id' => 'u_l', 'email' => 'l5@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_l'] = ['demo' => 500, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$U] = 1000.0; $me = $db['users']['u_l'];
$file = casino_user_file('u_l');
$sels = ['dogracelive' => 'w0', 'camelracelive' => 'l4', 'snailracelive' => 'q01', 'chickenracelive' => 'lo', 'monsterlive' => 'c2', 'boatracelive' => 't1', 'spaceracelive' => 'k0',
  'penaltylive' => 'h', 'basketlive' => 'e5', 'boxinglive' => 'ko', 'tennislive' => 'rcv', 'cricketlive' => 'six', 'archerylive' => 'ten', 'fishinglive' => 'f1', 'balloonlive' => 'mix', 'volcanolive' => 'left'];
foreach ($G as $g) {
  [$P, $B] = CASINO_LIVE5[$g]; $sel = $sels[$g];
  $i0 = casino_draw_i($g, time()) + 40; $t = casino_draw_start($g, $i0) + 2.0;
  casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
  $b0 = $bal[$U]; $c0 = $credits;
  $pub = casino_draw_public($g, $t);
  check("$g : pendant les mises : résultat CACHÉ, cotes visibles", $pub['phase'] === 'bet' && !isset($pub['res']) && !isset($pub['pre']) && isset($pub['odds'][$sel]) && $pub['end'] - $pub['t0'] == $P && $pub['close'] - $pub['t0'] == $B);
  $r = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => 'zz'], $t);
  check("$g : sélection invalide refusée, rien retiré", $r['ok'] === false && $bal[$U] == $b0);
  $r = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => $sel], $t);
  check("$g/$sel : pari accepté, 2 $ retirés", $r['ok'] && abs($bal[$U] - ($b0 - 2)) < 0.001 && empty($r['done']), json_encode($r));
  $r2 = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => $sel], $t + 1);
  check("$g : 2e pari sur le même tour refusé", $r2['ok'] === false && ($r2['reason'] ?? '') === 'already' && abs($bal[$U] - ($b0 - 2)) < 0.001);
  $dr0 = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], casino_draw_start($g, $i0) + $B - 1);
  check("$g : avant la fermeture : pas réglé, pas de résultat", empty($dr0['done']) && !isset($dr0['round']['res']));
  $tShow = casino_draw_start($g, $i0) + $B + 0.5;
  $dr = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $tShow);
  $out = casino_draw_outcome($g, $i0);
  $want = casino_win(2, (float) casino_draw_mult($g, $sel, $out));
  check("$g : réglé selon le tirage commun (n={$out['n']}, gain $want $)", !empty($dr['done']) && abs($dr['win'] - $want) < 0.001 && abs($bal[$U] - ($b0 - 2 + $want)) < 0.001, json_encode([$dr['win'] ?? null, $bal[$U] - $b0]));
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $tShow + 2);
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $tShow + 30);
  check("$g : versé UNE seule fois ; résultat public = le même pour tous", abs($bal[$U] - ($b0 - 2 + $want)) < 0.001 && $credits === $c0 + 1 && (casino_draw_public($g, $tShow)['res'] ?? null) == $out);
  $late = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => $sel], casino_draw_start($g, $i0) + $B - 0.3);
  check("$g : pari 0,3 s avant la fermeture refusé", $late['ok'] === false && ($late['reason'] ?? '') === 'closed');
  for ($i1 = casino_draw_i($g, time()) + 300; (float) casino_draw_mult($g, $sel, casino_draw_outcome($g, $i1)) <= 0; $i1++);
  $odd = (float) casino_draw_mult($g, $sel, casino_draw_outcome($g, $i1));
  casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
  $b0 = $bal[$U];
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 0.15, ['sel' => $sel], casino_draw_start($g, $i1) + 1);
  $dr = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], casino_draw_start($g, $i1) + $B + 1);
  $want = floor(0.15 * $odd * 100 + 1e-6) / 100;
  check(sprintf('%s : gain 0,15 $ × %.2f = %.2f $ (arrondi vers le bas)', $g, $odd, $want), abs(($dr['win'] ?? -1) - $want) < 1e-9 && abs($bal[$U] - ($b0 - 0.15 + $want)) < 0.001);
  $i2 = $i1 + 2000;
  casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
  $b0 = $bal[$U];
  $r = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 1, ['sel' => $sel], casino_draw_start($g, $i2) + 3);
  $kept = casino_draw_outcome($g, $i2);
  casino_draw_many($g, range($i2 + 1, $i2 + 65));
  $gone = casino_draw_outcome($g, $i2) === [];
  $later = casino_draw_start($g, $i2 + 65) + 1;
  $dr = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $later);
  $want = casino_win(1, (float) casino_draw_mult($g, $sel, $kept));
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $later + 5);
  check("$g : tour sorti de l'historique : pari réglé avec son résultat ($want $), une fois", $r['ok'] && $gone && !empty($dr['done']) && empty($dr['void']) && abs($bal[$U] - ($b0 - 1 + $want)) < 0.001);
}

echo "5) Coût serveur (un tirage par tour et par jeu, partagé par tous ; rien si personne ne regarde)\n";
$cost = [];
foreach ($G as $g) {
  $now = (float) time();
  $t0 = hrtime(true); for ($k = 0; $k < 300; $k++) casino_draw_public($g, $now); $pubUs = (hrtime(true) - $t0) / 1e3 / 300;
  $sz = filesize(casino_dir() . DIRECTORY_SEPARATOR . 'draw-' . $g . '.json');
  $big = []; for ($k = 0; $k < 2000; $k++) { $o = casino_live5_draw($g); if (strlen(json_encode($o)) > strlen(json_encode($big))) $big = $o; } // le plus long de 2000 tirages
  $js = strlen(json_encode(['ok' => true, 'now' => $now, 'round' => ['res' => $big] + casino_draw_public($g, $now)]));
  $cost[] = sprintf('%s %.0f µs/lecture, fichier %.1f Ko, réponse %d o', $g, $pubUs, $sz / 1024, $js);
  if ($pubUs > 5000 || $sz > 60000 || $js > 2500) $cost[] = '!!';
}
echo '     ' . implode("\n     ", $cost) . "\n";
check('lecture publique < 5 ms, fichier du tirage < 60 Ko (60 tours), réponse < 2,5 Ko', !in_array('!!', $cost, true));
$t0 = hrtime(true); $x = 0; foreach ($ALL as $g) $x += count(casino_live5_odds($g)); $ms = (hrtime(true) - $t0) / 1e6;
check(sprintf('cotes des 16 jeux (mémoire déjà chaude ici) : %.2f ms', $ms), $ms < 30);
$code = 'require "' . $tmp . '/orolado_lib.php"; require "' . $tmp . '/casino_lib.php"; $t = hrtime(true); foreach (CASINO_LIVE5_KEYS as $g) casino_live5_odds($g); echo (hrtime(true) - $t) / 1e6;';
$cold = (float) shell_exec(escapeshellarg(PHP_BINARY) . ' -r ' . escapeshellarg($code));
check(sprintf('cotes des 16 jeux à froid (nouveau processus, comme casino-tour.php) : %.1f ms', $cold), $cold > 0 && $cold < 60);

printf("\n(durée %.0f s)\nRÉSULTAT : %d OK, %d échec(s)\n", microtime(true) - $T0, $pass, $fail);
exit($fail ? 1 : 0);
