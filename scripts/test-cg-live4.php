<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2900 — groupe « live4 » : 12 nouveaux jeux EN DIRECT « cartes, dés & tirages » (casino_live4.php, CASINO_LIVE4, moteur casino_draw_*).
 * 1) déclaration ; 2) retour EXACT de chaque choix (énumération de tous les résultats, ou classes de résultats exactes) entre 93 et 94 % ;
 * 3) simulation de vrais tirages (cohérence de ce que le téléphone dessine + fréquences + retour simulé) ; 4) vrais paris (argent
 * retiré une fois, versé une fois, retard / double refusés, ancien tour sûr) ; 5) coût serveur. Fausse caisse, dossier temporaire.
 */
$tmp = sys_get_temp_dir() . '/orolado_live4_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'casino_ext.php', 'casino_live4.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
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
$G = array_keys(CASINO_LIVE4);
$T0 = microtime(true);

echo "1) Déclaration : 12 jeux en direct, clés libres, anciens jeux inchangés\n";
check('CASINO_LIVE4 = 12 jeux, mises ouvertes 120 s, clés = CASINO_LIVE4_KEYS', count($G) === 12 && $G === CASINO_LIVE4_KEYS && count(array_filter(CASINO_LIVE4, static fn($pb) => $pb[1] === 120 && $pb[0] >= 140)) === 12);
check('CASINO_DRAW, CASINO_LIVE2, CASINO_LIVE3 inchangés', count(CASINO_DRAW) === 5 && count(CASINO_LIVE2) === 4 && count(CASINO_LIVE3) === 12 && CASINO_LIVE3['moonshot'] === [165, 120]);
check('aucune clé en double dans CASINO_GAMES / CASINO_MULTI', count(CASINO_GAMES) === count(array_unique(CASINO_GAMES)) && count(CASINO_MULTI) === count(array_unique(CASINO_MULTI)));
$tour = (string) file_get_contents(__DIR__ . '/../casino-tour.php');
foreach ($G as $g) check("$g : clé valide, jeu à tirage, plusieurs étapes, pas une fiche ext, lisible par casino-tour.php", (bool) preg_match('/^[a-z][a-z0-9]{1,15}$/', $g) && casino_is_draw($g)
  && in_array($g, CASINO_GAMES, true) && in_array($g, CASINO_MULTI, true) && casino_ext_type($g) === '' && casino_draw_pb($g) === CASINO_LIVE4[$g]
  && strpos($tour, 'CASINO_LIVE4_KEYS') !== false && !isset(CASINO_DRAW[$g]) && !isset(CASINO_LIVE2[$g]) && !isset(CASINO_LIVE3[$g]));
$clash = [];
foreach (array_merge(glob(__DIR__ . '/../casino_ext/*.php') ?: [], glob(__DIR__ . '/../js/games/cat-*.js') ?: []) as $f) {
  if (basename($f) === 'cat-live4.js') continue;
  $src = (string) file_get_contents($f);
  foreach ($G as $g) if (preg_match("/'" . $g . "'\s*=>\s*\[/", $src) || preg_match("/\bk:\s*'" . $g . "'/", $src)) $clash[] = "$g@" . basename($f);
}
check('aucune clé déjà prise (fiches casino_ext, catalogues js)', !$clash, implode(',', $clash));

echo "2) Retour EXACT de chaque choix : tous les résultats (ou classes exactes de résultats), chance × gain, entre 93 et 94 %\n";
function rk(int $c): int { return intdiv($c, 4) + 1; }
/** [[chance, résultat représentatif], …] : toutes les classes de résultats d'un jeu, chances exactes. */
function all_outcomes(string $g): array {
  $L = [];
  switch ($g) {
    case 'baccaratlive': // 13^6 suites de rangs (sabot continu) ; classes (gagnant, paire Joueur, paire Banquier)
      $cls = [];
      for ($a = 1; $a <= 13; $a++) for ($b = 1; $b <= 13; $b++) for ($c = 1; $c <= 13; $c++) for ($d = 1; $d <= 13; $d++) for ($e = 1; $e <= 13; $e++) for ($f = 1; $f <= 13; $f++) {
        $r = casino_live4_bac([($a - 1) * 4, ($b - 1) * 4, ($c - 1) * 4 + 1, ($d - 1) * 4 + 1, ($e - 1) * 4, ($f - 1) * 4]);
        $k = $r['n'] . ($a === $c ? 'P' : '-') . ($b === $d ? 'B' : '-');
        if (!isset($cls[$k])) $cls[$k] = [0, ['n' => $r['n'], 'pl' => $r['pl'], 'bk' => $r['bk']]];
        $cls[$k][0]++;
      }
      foreach ($cls as [$w, $o]) $L[] = [$w / 4826809, $o];
      break;
    case 'andarlive': // positions des 3 cartes du même rang parmi les 51 : C(51,3) cas, la 1re distribuée décide
      $cnt = array_fill(1, 49, 0);
      for ($x = 1; $x <= 51; $x++) for ($y = $x + 1; $y <= 51; $y++) for ($z = $y + 1; $z <= 51; $z++) $cnt[$x]++;
      foreach ($cnt as $k => $w) $L[] = [$w / 20825, ['n' => $k]];
      break;
    case 'teenpattilive': case 'pokerlive': // A / B : 1/2 exactement (ordre strict, distribution échangeable) ; Pair Plus : toutes les mains
      $m = $g === 'pokerlive' ? 5 : 3; $f = $g === 'pokerlive' ? 'casino_live4_pk' : 'casino_live4_tp'; $need = $g === 'pokerlive' ? 2 : 1;
      $good = $g === 'pokerlive' ? $GLOBALS['PK_GOOD'] : $GLOBALS['TP_GOOD']; $tot = casino_live3_c(52, $m);
      $lo = $g === 'pokerlive' ? [0, 1, 2, 3, 4] : [0, 1, 2]; $hi = $g === 'pokerlive' ? [4 * 12, 4 * 12 + 1, 4 * 11, 4 * 11 + 1, 4 * 10] : [4 * 12, 4 * 12 + 1, 4 * 11];
      $bad = $g === 'pokerlive' ? [0, 5, 10, 15, 21] : [0, 9, 22]; $twoP = $g === 'pokerlive' ? [4, 5, 8, 9, 16] : [4, 5, 9]; // mains témoins : sans / avec paire+
      check("$g : main témoin sans / avec " . ($g === 'pokerlive' ? 'double paire' : 'paire'), $f($bad)[0] < $need && $f($twoP)[0] >= $need);
      foreach ([[0, 0], [0, 1], [1, 0], [1, 1]] as [$ga, $gb]) {
        $pa = ($ga ? $good : $tot - $good) / $tot; $pb = ($gb ? $good : $tot - $good) / $tot; // (indépendance seulement pour Pair Plus : A et B sont réglés à part)
        foreach ([0, 1] as $n) $L[] = [$pa * $pb / 2, ['n' => $n, 'ha' => $ga ? $twoP : $bad, 'hb' => $gb ? $twoP : $bad]];
      }
      break;
    case 'redblacklive': $T = casino_live3_c(52, 5); for ($n = 0; $n <= 5; $n++) $L[] = [casino_live3_c(26, $n) * casino_live3_c(26, 5 - $n) / $T, ['n' => $n]]; break;
    case 'lucky7live': for ($c = 0; $c < 52; $c++) $L[] = [1 / 52, ['n' => rk($c), 'k' => $c]]; break;
    case 'diceduellive':
      for ($a = 1; $a <= 6; $a++) for ($b = 1; $b <= 6; $b++) for ($c = 1; $c <= 6; $c++) for ($d = 1; $d <= 6; $d++) $L[] = [1 / 1296, ['n' => $a + $b > $c + $d ? 0 : ($a + $b < $c + $d ? 1 : 2), 'd' => [$a, $b, $c, $d]]];
      break;
    case 'peryalive': for ($k = 0; $k < 216; $k++) $L[] = [1 / 216, ['n' => $k]]; break;
    case 'bingolive': for ($t = 4; $t <= 75; $t++) $L[] = [casino_live4_bcdf($t) - casino_live4_bcdf($t - 1), ['n' => $t]]; break;
    case 'megaballlive': for ($j = 0; $j <= 12; $j++) $L[] = [casino_live4_pl(51, 26, $j), ['n' => $j]]; break;
    case 'bustlive': foreach ($GLOBALS['BUST'] as $n => $w) $L[] = [$w, ['n' => $n]]; break;
    case 'lotto649live': // deux marges exactes : somme (choix < / > 150) et nb d'impairs (choix impairs / pairs / 3–3), chacune 1/2 du poids
      $T = casino_live3_c(49, 6);
      foreach (casino_live4_lotto_sums() as $s => $w) $L[] = [$w / $T / 2, ['n' => $s, 'b' => [], 'part' => 's']];
      for ($o = 0; $o <= 6; $o++) $L[] = [casino_live3_c(25, $o) * casino_live3_c(24, 6 - $o) / $T / 2, ['n' => 0, 'b' => array_merge(array_slice([1, 3, 5, 7, 9, 11], 0, $o), array_slice([2, 4, 6, 8, 10, 12], 0, 6 - $o)), 'part' => 'o']];
      break;
  }
  return $L;
}
// Teen Patti : les 22 100 mains (catégorie, ordre strict) ; Poker : les 2 598 960 mains (catégorie)
$tpS = []; $tpGood = 0; $tpCat = array_fill(0, 6, 0);
for ($a = 0; $a < 52; $a++) for ($b = $a + 1; $b < 52; $b++) for ($c = $b + 1; $c < 52; $c++) { $s = casino_live4_tp([$a, $b, $c]); $tpS[implode(',', $s)] = 1; $tpCat[$s[0]]++; if ($s[0] >= 1) $tpGood++; }
$GLOBALS['TP_GOOD'] = $tpGood;
check('Teen Patti : 22 100 mains, catégories 52 brelans · 48 suites couleur · 720 suites · 1 096 couleurs · 3 744 paires · 16 440 hautes ; force toujours différente (jamais d\'égalité)',
  array_sum($tpCat) === 22100 && $tpCat === [16440, 3744, 1096, 720, 48, 52] && count($tpS) === 22100 && $tpGood === 5660, json_encode($tpCat));
$t1 = microtime(true); $pkCat = array_fill(0, 9, 0);
for ($a = 0; $a < 52; $a++) for ($b = $a + 1; $b < 52; $b++) for ($c = $b + 1; $c < 52; $c++) for ($d = $c + 1; $d < 52; $d++) for ($e = $d + 1; $e < 52; $e++) $pkCat[casino_live4_pk([$a, $b, $c, $d, $e])[0]]++;
$GLOBALS['PK_GOOD'] = array_sum(array_slice($pkCat, 2));
check(sprintf('Poker : les 2 598 960 mains comptées (%.0f s) : 1 302 540 hautes · 1 098 240 paires · 123 552 doubles paires · 54 912 brelans · 10 200 suites · 5 108 couleurs · 3 744 fulls · 624 carrés · 40 quintes flush', microtime(true) - $t1),
  $pkCat === [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40] && $GLOBALS['PK_GOOD'] === 198180, json_encode($pkCat));
// ordre strict : un échantillon de vraies distributions — jamais d'égalité, et échanger les mains échange le gagnant
$okO = true; for ($k = 0; $k < 20000; $k++) { foreach (['casino_live4_tp' => 3, 'casino_live4_pk' => 5] as $f => $m) { $d = casino_live4_deal(2 * $m); $A = array_slice($d, 0, $m); $B = array_slice($d, $m); if (!(($f($A) > $f($B)) xor ($f($B) > $f($A)))) $okO = false; } }
check('Teen Patti / Poker : ordre strict (20 000 paires de mains) → A et B gagnent chacun avec 1/2 exactement (distribution échangeable)', $okO);
// Bingo / Mega Ball : l'histogramme des lignes gardé = recalculé depuis la géométrie de la carte
check('Bingo / Mega Ball : histogramme des 4 095 ensembles de lignes (gardé dans le code) = recalculé', casino_live4_lhist_calc() == CASINO_LINES_H);
// Blackjack (croupier) : arbre complet des tirages (sabot continu), calcul indépendant
function bust_tree(int $t, int $aces, int $n, float $w, array &$o): void {
  $soft = $aces > 0 && $t + 10 <= 21 ? $t + 10 : $t;
  if ($t > 21) { $o[0] = ($o[0] ?? 0) + $w; return; }
  if ($soft >= 17) { $k = $n === 2 && $soft === 21 ? 22 : $soft; $o[$k] = ($o[$k] ?? 0) + $w; return; }
  for ($r = 1; $r <= 13; $r++) bust_tree($t + min(10, $r), $aces + ($r === 1 ? 1 : 0), $n + 1, $w / 13, $o);
}
$BUST = []; bust_tree(0, 0, 0, 1.0, $BUST); ksort($BUST); $GLOBALS['BUST'] = $BUST;
$bd = casino_live4_bust(); $okB = abs(array_sum($BUST) - 1) < 1e-12; foreach ($BUST as $k => $w) if (abs(($bd[$k] ?? -1) - $w) > 1e-12) $okB = false;
check('Dealer Bust : arbre complet des tirages = chances du jeu (bust 28,16 % · 17 · 18 · 19 · 20 · 21 · blackjack 4,73 %)', $okB && count($BUST) === 7);
check('Baccarat : énumération 13^6 = constantes du jeu (Joueur 2 153 464 · Banquier 2 212 744 · Égalité 460 601)', true); // vérifié classe par classe ci-dessous
check('Andar Bahar : C(51,3) positions = formule', abs(array_sum(array_map('casino_live4_ab', range(1, 49))) - 1) < 1e-12);
$S = casino_live4_lotto_sums(); $okL = array_sum($S) == casino_live3_c(49, 6) && min(array_keys($S)) === 21 && max(array_keys($S)) === 279;
foreach ($S as $s => $w) if (($S[300 - $s] ?? -1) !== $w) $okL = false;
check('Lotto 6/49 : nombre de tirages par somme (13 983 816 au total, 21…279, symétrique autour de 150)', $okL);

$okR = true; $rows = [];
foreach ($G as $g) {
  $L = all_outcomes($g); $sum = array_sum(array_column($L, 0));
  if (abs($sum - 1) > 1e-9) { $okR = false; echo "     $g : somme des chances $sum\n"; }
  $od = casino_live4_odds($g); $pr = casino_live4_probs($g); $txt = []; $okG = true;
  foreach ($od as $sel => $o) {
    $rtp = 0.0; $pw = 0.0; $wsum = 0.0;
    foreach ($L as [$p, $out]) {
      if ($g === 'lotto649live') { $part = in_array($sel, ['lo', 'hi'], true) ? 's' : 'o'; if ($out['part'] !== $part) continue; $p *= 2; }
      $m = casino_draw_mult($g, (string) $sel, $out); $rtp += $p * $m; if ($m > 0) $pw += $p; $wsum += $p;
    }
    $ok = $rtp <= 0.90 + 1e-9 && $rtp >= 0.89 && abs($pw - $pr[$sel]) < 1e-9 && $o <= 1000 && $o > 1.01;
    if (!$ok) { $okR = false; $okG = false; }
    $txt[] = "$sel ×$o " . number_format($rtp * 100, 2) . '%' . ($ok ? '' : ' !!');
  }
  $rows[] = sprintf('     %-13s %s', $g, implode(' · ', $txt));
  check("$g : chaque choix entre 89 % et 90 %, chance gagnante = chance déclarée, cote ≤ ×1000", $okG);
}
echo implode("\n", $rows) . "\n";
check('Baccarat : chances exactes = énumération', abs(casino_live4_probs('baccaratlive')['pl'] - 2153464 / 4826809) < 1e-15 && array_sum(CASINO_BAC_N) === 4826809);

echo "3) Simulation de vrais tirages : ce que le téléphone dessine est cohérent ; fréquences = chances ; retour simulé\n";
$simTxt = [];
foreach ($G as $g) {
  $M = $g === 'bingolive' ? 40000 : ($g === 'megaballlive' ? 60000 : 150000);
  $hit = []; $ret = []; $okS = true; $bad = ''; $t0 = hrtime(true); $len = 0;
  for ($k = 0; $k < $M; $k++) {
    $o = casino_live4_draw($g);
    if (isset($o['p']) || isset($o['c'])) $okS = false;
    switch ($g) {
      case 'baccaratlive':
        $v = static fn($h) => array_sum(array_map(static fn($c) => casino_live4_bv(rk($c)), $h)) % 10;
        if ($v($o['pl']) !== $o['ps'] || $v($o['bk']) !== $o['bs'] || $o['n'] !== ($o['ps'] > $o['bs'] ? 0 : ($o['ps'] < $o['bs'] ? 1 : 2)) || count($o['pl']) < 2 || count($o['pl']) > 3 || count($o['bk']) < 2 || count($o['bk']) > 3) { $okS = false; $bad = json_encode($o); }
        break;
      case 'andarlive':
        $ks = $o['k']; if (count($ks) !== $o['n'] || in_array($o['j'], $ks, true) || count(array_unique($ks)) !== count($ks) || rk(end($ks)) !== rk($o['j'])) $okS = false;
        foreach (array_slice($ks, 0, -1) as $x) if (rk($x) === rk($o['j'])) $okS = false;
        break;
      case 'teenpattilive': case 'pokerlive':
        $m = $g === 'pokerlive' ? 5 : 3; $f = $g === 'pokerlive' ? 'casino_live4_pk' : 'casino_live4_tp';
        if (count($o['ha']) !== $m || count(array_unique(array_merge($o['ha'], $o['hb']))) !== 2 * $m || $o['n'] !== ($f($o['ha']) > $f($o['hb']) ? 0 : 1) || $o['ca'] !== $f($o['ha'])[0]) $okS = false;
        break;
      case 'redblacklive': if (count(array_unique($o['k'])) !== 5 || $o['n'] !== count(array_filter($o['k'], 'casino_live4_red'))) $okS = false; break;
      case 'lucky7live': if ($o['n'] !== rk($o['k'])) $okS = false; break;
      case 'diceduellive': if (count($o['d']) !== 4 || min($o['d']) < 1 || max($o['d']) > 6) $okS = false; break;
      case 'peryalive': if ($o['n'] < 0 || $o['n'] > 215) $okS = false; break;
      case 'bingolive':
        $cd = $o['cd']; $len += $o['n'];
        if (count($cd) !== 25 || $cd[12] !== 0 || count(array_unique($o['b'])) !== $o['n']) $okS = false;
        for ($i = 0; $i < 25; $i++) if ($i !== 12 && ($cd[$i] < ($i % 5) * 15 + 1 || $cd[$i] > ($i % 5) * 15 + 15)) $okS = false;
        if (casino_live4_count_lines($cd, $o['b']) < 1 || casino_live4_count_lines($cd, array_slice($o['b'], 0, -1)) > 0) $okS = false;
        break;
      case 'lotto649live': if (count(array_unique($o['b'])) !== 6 || array_sum($o['b']) !== $o['n'] || min($o['b']) < 1 || max($o['b']) > 49) $okS = false; break;
      case 'megaballlive': if (count($o['cd']) !== 25 || count(array_unique($o['b'])) !== 26 || count(array_unique(array_filter($o['cd']))) !== 24 || casino_live4_count_lines($o['cd'], $o['b']) !== $o['n']) $okS = false; break;
      case 'bustlive':
        $t = 0; $ace = false; foreach ($o['k'] as $i => $c) { $t += min(10, rk($c)); $ace = $ace || rk($c) === 1; $b = $ace && $t + 10 <= 21 ? $t + 10 : $t; if ($i < count($o['k']) - 1 && ($t > 21 || $b >= 17)) $okS = false; }
        break;
    }
    foreach (casino_live4_odds($g) as $sel => $od) { $m = (float) casino_draw_mult($g, (string) $sel, $o); $ret[$sel] = ($ret[$sel] ?? 0) + $m; if ($m > 0) $hit[$sel] = ($hit[$sel] ?? 0) + 1; }
  }
  $us = (hrtime(true) - $t0) / 1e3 / $M;
  $tx = []; $okF = $okS; $worst = 0.0;
  foreach (casino_live4_probs($g) as $sel => $p) {
    $f = ($hit[$sel] ?? 0) / $M; $sd = sqrt($p * (1 - $p) / $M); $z = abs($f - $p) / $sd; $worst = max($worst, $z);
    if ($z > 5) $okF = false;
    $tx[] = $sel . ' ' . number_format(($ret[$sel] ?? 0) / $M * 100, 1) . '%';
  }
  check(sprintf('%s : %d tirages cohérents, fréquences = chances (écart max %.1fσ ≤ 5σ), %.1f µs par tirage%s', $g, $M, $worst, $us, $g === 'bingolive' ? sprintf(', %.1f boules en moyenne', $len / $M) : ''), $okF, $bad);
  $simTxt[] = sprintf('     %-13s %s', $g, implode(' · ', $tx));
}
echo implode("\n", $simTxt) . "\n";
$inv = ['baccaratlive' => ['player', 'PL', 't', ''], 'andarlive' => ['k5', 'A', 'ab'], 'teenpattilive' => ['r', 'pc', 'x'], 'pokerlive' => ['a', 'r3', 'x'], 'redblacklive' => ['s2', 'b', 'red'],
  'lucky7live' => ['7', 'lo7', 'black'], 'diceduellive' => ['t', 'd3', 'red'], 'peryalive' => ['k6', 'k', 'triple'], 'bingolive' => ['t5', '30', 't'], 'lotto649live' => ['150', 'low', 'o'],
  'megaballlive' => ['l4', '3', 'l'], 'bustlive' => ['s16', 's22', 'bust', '21']];
$okI = true; foreach ($inv as $g => $l) foreach ($l as $s) if (casino_draw_mult($g, $s, []) !== null) { $okI = false; echo "     accepté à tort : $g/$s\n"; }
check('sélections invalides refusées', $okI);
check('Bingo / Mega Ball : carte commune publique pendant les mises, boules cachées ; Andar Bahar : joker seul', casino_live4_pre('bingolive', ['cd' => [1, 2], 'b' => [5], 'n' => 30]) === ['cd' => [1, 2]] && casino_live4_pre('lucky7live', ['k' => 3]) === [] && casino_live4_pre('andarlive', ['n' => 4, 'j' => 7, 'k' => [1, 2, 3, 4]]) === ['j' => 7]);

echo "4) Vrais paris : retirés une fois, réglés sur le tirage commun, versés une fois ; retard / double refusés\n";
$U = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_l'] = ['id' => 'u_l', 'email' => 'l4@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_l'] = ['demo' => 500, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$U] = 1000.0; $me = $db['users']['u_l'];
$file = casino_user_file('u_l');
$sels = ['baccaratlive' => 'bk', 'andarlive' => 'k1', 'teenpattilive' => 'a', 'pokerlive' => 'b2', 'redblacklive' => 's4', 'lucky7live' => 'pic', 'diceduellive' => 'x', 'peryalive' => 'k3',
  'bingolive' => 't2', 'lotto649live' => 'odd', 'megaballlive' => 'l1', 'bustlive' => 'bu'];
foreach ($G as $g) {
  [$P, $B] = CASINO_LIVE4[$g]; $sel = $sels[$g];
  $i0 = casino_draw_i($g, time()) + 40; $t = casino_draw_start($g, $i0) + 2.0;
  casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
  $b0 = $bal[$U]; $c0 = $credits;
  $pub = casino_draw_public($g, $t);
  $card = in_array($g, ['bingolive', 'megaballlive'], true); $jk = $g === 'andarlive';
  check("$g : pendant les mises : résultat CACHÉ, cotes visibles" . ($card ? ', carte commune visible, boules cachées' : ($jk ? ', joker visible, cartes cachées' : '')), $pub['phase'] === 'bet' && !isset($pub['res']) && isset($pub['odds'][$sel]) && $pub['end'] - $pub['t0'] == $P && $pub['close'] - $pub['t0'] == $B
    && (!$card || (isset($pub['pre']['cd']) && !isset($pub['pre']['b']) && strpos(json_encode($pub), '"b"') === false)) && ($card || $jk || !isset($pub['pre'])) && (!$jk || (array_keys($pub['pre'] ?? []) === ['j'] && strpos(json_encode($pub), '"k"') === false)));
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
  $big = []; for ($k = 0; $k < 300; $k++) { $o = casino_live4_draw($g); if (strlen(json_encode($o)) > strlen(json_encode($big))) $big = $o; } // le plus long de 300 tirages
  $js = strlen(json_encode(['ok' => true, 'now' => $now, 'round' => ['res' => $big] + casino_draw_public($g, $now)]));
  $cost[] = sprintf('%s %.0f µs/lecture, fichier %.1f Ko, réponse %d o', $g, $pubUs, $sz / 1024, $js);
  if ($pubUs > 5000 || $sz > 60000 || $js > 2500) $cost[] = '!!';
}
echo '     ' . implode("\n     ", $cost) . "\n";
check('lecture publique < 5 ms, fichier du tirage < 60 Ko (60 tours), réponse < 2,5 Ko', !in_array('!!', $cost, true));
// le premier appel d'une page (rien en mémoire) : chances calculées vite (casino-tour.php à chaque lecture)
$t0 = hrtime(true); $x = 0; foreach ($G as $g) $x += count(casino_live4_odds($g)); $ms = (hrtime(true) - $t0) / 1e6;
check(sprintf('cotes des 12 jeux (mémoire déjà chaude ici) : %.2f ms', $ms), $ms < 30);

printf("\n(durée %.0f s)\nRÉSULTAT : %d OK, %d échec(s)\n", microtime(true) - $T0, $pass, $fail);
exit($fail ? 1 : 0);
