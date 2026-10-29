<?php
declare(strict_types=1);
/* v2900 (propriétaire, round 5) — LIVE 4 : 12 NOUVEAUX JEUX EN DIRECT « cartes, dés & tirages » (même moteur casino_draw_* que
 * Lucky Planets, live2 et live3 : un tirage par tour et par jeu, fait la 1re fois qu'on en a besoin, sous verrou, gardé dans
 * draw-<jeu>.json, SECRET jusqu'à la fermeture des mises, le même pour tout le monde ; un pari par joueur et par tour).
 * Fichier à part, chargé par casino_lib.php (require_once en haut) : constantes + fonctions pures, aucun argent ici.
 * Chaque choix a sa chance EXACTE p et sa cote = 0,94 ÷ p arrondie VERS LE BAS au centime (casino_live2_odd) → retour entre
 * 93 et 94 % pour CHAQUE choix (vérifié par scripts/test-cg-live4.php : calcul exact + simulation). Un choix qui n'a pas prévu
 * un résultat le perd (ex. égalité au Baccarat : Joueur et Banquier perdent).
 *  - baccaratlive  Baccarat Live : vrai tirage (règles de la 3e carte), sabot continu ; Joueur · Banquier · Égalité · paires.
 *  - andarlive     Andar Bahar Live : un joker, puis Andar / Bahar une carte chacun jusqu'au même rang (jeu de 52) ; côté + nb de cartes.
 *  - teenpattilive Teen Patti Live : joueurs A et B, 3 cartes chacun (même jeu) ; A / B (égalité impossible : couleur de la
 *                  plus haute carte) · Pair Plus A / B (paire ou mieux).
 *  - pokerlive     Poker Showdown Live : Rouge et Bleu, 5 cartes chacun (même jeu) ; Rouge / Bleu · Double paire ou mieux (chaque main).
 *  - redblacklive  Red or Black Live : 5 cartes ; majorité rouge / noire · 5–0 · 4–1 · 3–2.
 *  - lucky7live    Lucky 7 Live : une carte ; A–6 / 7 / 8–K · rouge / noire · figure.
 *  - diceduellive  Dice Duel Live : Rouge et Bleu lancent 2 dés ; Rouge / Égalité / Bleu · un double · deux doubles.
 *  - peryalive     Color Game Live (Perya) : 3 dés de 6 couleurs ; couleur sortie (au moins une fois) · paire · triple · 3 différentes.
 *  - bingolive     Bingo Live : carte commune 5×5 (case centrale offerte), boules 1–75 jusqu'à la 1re ligne ; tranches du nb de boules.
 *  - lotto649live  Lotto 6/49 Live : 6 boules sur 49 ; somme < 150 / > 150 · plus d'impairs / de pairs / 3–3.
 *  - megaballlive  Mega Ball Live : carte commune 5×5 (centre offert), 26 boules sur 51 ; 0 / 1 / 2 / 3+ lignes.
 *  - bustlive      Dealer Bust Live (remplace « Fan Tan Live » : Gem Count est déjà un fan-tan) : le croupier de blackjack tire
 *                  (reste sur tout 17, sabot continu) ; Bust · 17 · 18 · 19 · 20 · 21 · Blackjack.
 * Cartes codées 0…51 : rang = intdiv(c, 4) + 1 (1 = As … 13 = Roi), couleur = c % 4 (0 ♠, 1 ♥, 2 ♦, 3 ♣ ; ♥ ♦ rouges).
 * [période P, mises ouvertes B] */
const CASINO_LIVE4 = ['baccaratlive' => [150, 120], 'andarlive' => [155, 120], 'teenpattilive' => [145, 120], 'pokerlive' => [150, 120],
  'redblacklive' => [140, 120], 'lucky7live' => [140, 120], 'diceduellive' => [140, 120], 'peryalive' => [140, 120],
  'bingolive' => [170, 120], 'lotto649live' => [145, 120], 'megaballlive' => [155, 120], 'bustlive' => [145, 120]];
const CASINO_LIVE4_KEYS = ['baccaratlive', 'andarlive', 'teenpattilive', 'pokerlive', 'redblacklive', 'lucky7live', 'diceduellive', 'peryalive',
  'bingolive', 'lotto649live', 'megaballlive', 'bustlive'];
// Baccarat, sabot continu : nombre de suites de 6 rangs (13^6 = 4 826 809) où gagne le Joueur / le Banquier / égalité (énumération complète)
const CASINO_BAC_N = [2153464, 2212744, 460601];
const CASINO_BINGO_T = [[4, 33], [34, 39], [40, 44], [45, 50], [51, 75]]; // tranches du nb de boules à la 1re ligne
const CASINO_LOTTO_MID = 150; // somme pile 150 : « < 150 » et « > 150 » perdent

function casino_live4_rank(int $c): int { return intdiv($c, 4) + 1; }
function casino_live4_red(int $c): bool { return $c % 4 === 1 || $c % 4 === 2; }
/** $k cartes différentes tirées d'un jeu de 52 (sans $skip). */
function casino_live4_deal(int $k, array $skip = []): array {
  $d = array_values(array_diff(range(0, 51), $skip)); $n = count($d); $o = [];
  for ($i = 0; $i < $k; $i++) { $j = random_int($i, $n - 1); [$d[$i], $d[$j]] = [$d[$j], $d[$i]]; $o[] = $d[$i]; }
  return $o;
}
/** Valeur baccarat d'un rang. */
function casino_live4_bv(int $r): int { return $r >= 10 ? 0 : $r; }
/** Baccarat : à partir de 6 cartes (ordre du sabot), mains du Joueur et du Banquier selon les règles de la 3e carte. */
function casino_live4_bac(array $s): array {
  $v = static fn(int $c): int => casino_live4_bv(casino_live4_rank($c));
  $pl = [$s[0], $s[2]]; $bk = [$s[1], $s[3]]; $i = 4;
  $p = ($v($s[0]) + $v($s[2])) % 10; $k = ($v($s[1]) + $v($s[3])) % 10;
  if ($p < 8 && $k < 8) {
    $x = -1;
    if ($p <= 5) { $pl[] = $s[$i]; $x = $v($s[$i]); $p = ($p + $x) % 10; $i++; }
    $dr = $x < 0 ? $k <= 5 : ($k <= 2 || ($k === 3 && $x !== 8) || ($k === 4 && $x >= 2 && $x <= 7) || ($k === 5 && $x >= 4 && $x <= 7) || ($k === 6 && $x >= 6 && $x <= 7));
    if ($dr) { $bk[] = $s[$i]; $k = ($k + $v($s[$i])) % 10; }
  }
  return ['pl' => $pl, 'bk' => $bk, 'n' => $p > $k ? 0 : ($p < $k ? 1 : 2), 'ps' => $p, 'bs' => $k];
}
/** Force d'une main de 3 cartes (Teen Patti) : tableau comparable (catégorie puis rangs, puis couleurs pour départager). */
function casino_live4_tp(array $h): array {
  $r = array_map(static fn($c) => casino_live4_rank($c) === 1 ? 14 : casino_live4_rank($c), $h); rsort($r);
  $fl = count(array_unique(array_map(static fn($c) => $c % 4, $h))) === 1;
  $seq = ($r[0] - $r[1] === 1 && $r[1] - $r[2] === 1); $hi = $r;
  if (!$seq && $r === [14, 3, 2]) { $seq = true; $hi = [3, 2, 1]; } // A-2-3 : plus petite suite
  if ($r[0] === $r[2]) $cat = 5; elseif ($seq && $fl) $cat = 4; elseif ($seq) $cat = 3; elseif ($fl) $cat = 2;
  elseif ($r[0] === $r[1] || $r[1] === $r[2]) { $cat = 1; $pr = $r[1]; $hi = [$pr, $pr, $r[0] === $r[1] ? $r[2] : $r[0]]; } else $cat = 0;
  return array_merge([$cat], $hi, casino_live4_suits($h));
}
/** Couleurs des cartes, rangées de la plus haute à la plus basse (rang puis ♠ > ♥ > ♦ > ♣) : départage d'une égalité parfaite. */
function casino_live4_suits(array $h): array {
  $k = array_map(static fn($c) => (casino_live4_rank($c) === 1 ? 14 : casino_live4_rank($c)) * 4 + (3 - $c % 4), $h); rsort($k);
  return array_map(static fn($x) => $x % 4, $k);
}
/** Force d'une main de 5 cartes (poker) : [catégorie 0…8, rangs départage…, couleurs…]. */
function casino_live4_pk(array $h): array {
  $r = array_map(static fn($c) => casino_live4_rank($c) === 1 ? 14 : casino_live4_rank($c), $h);
  $cnt = array_count_values($r); arsort($cnt);
  $grp = []; foreach ($cnt as $rk => $n) $grp[] = [$n, $rk];
  usort($grp, static fn($a, $b) => [$b[0], $b[1]] <=> [$a[0], $a[1]]);
  $ord = []; foreach ($grp as [$n, $rk]) for ($i = 0; $i < $n; $i++) $ord[] = $rk;
  $fl = count(array_unique(array_map(static fn($c) => $c % 4, $h))) === 1;
  $u = array_keys($cnt); rsort($u); $st = false;
  if (count($u) === 5) { if ($u[0] - $u[4] === 4) $st = true; elseif ($u === [14, 5, 4, 3, 2]) { $st = true; $ord = [5, 4, 3, 2, 1]; } }
  $sh = array_map(static fn($g) => $g[0], $grp);
  if ($st && $fl) $cat = 8; elseif ($sh[0] === 4) $cat = 7; elseif ($sh === [3, 2]) $cat = 6; elseif ($fl) $cat = 5; elseif ($st) $cat = 4;
  elseif ($sh[0] === 3) $cat = 3; elseif ($sh === [2, 2, 1]) $cat = 2; elseif ($sh[0] === 2) $cat = 1; else $cat = 0;
  return array_merge([$cat], $ord, casino_live4_suits($h));
}
/** Bingo / Mega Ball : les 12 lignes d'une carte 5×5 (case 12 = centre offert) → pour chaque ensemble de lignes, nb de cases à tirer. */
function casino_live4_lines(): array {
  $L = [];
  for ($r = 0; $r < 5; $r++) $L[] = [$r * 5, $r * 5 + 1, $r * 5 + 2, $r * 5 + 3, $r * 5 + 4];
  for ($c = 0; $c < 5; $c++) $L[] = [$c, $c + 5, $c + 10, $c + 15, $c + 20];
  $L[] = [0, 6, 12, 18, 24]; $L[] = [4, 8, 12, 16, 20];
  return $L;
}
/** Histogramme [nb de lignes de l'ensemble][nb de cases (hors centre) de leur réunion] = nb d'ensembles (4095 ensembles non vides).
 *  Gardé tel quel (calcul ~10 ms) ; scripts/test-cg-live4.php le recalcule (casino_live4_lhist_calc) et compare. */
const CASINO_LINES_H = [1 => [5 => 8, 4 => 4], 2 => [10 => 12, 9 => 24, 8 => 30], 3 => [14 => 12, 15 => 8, 13 => 48, 12 => 104, 11 => 48],
  4 => [19 => 8, 20 => 2, 16 => 145, 17 => 32, 15 => 152, 14 => 148, 13 => 8], 5 => [24 => 2, 20 => 62, 21 => 8, 18 => 312, 19 => 48, 17 => 232, 16 => 120, 15 => 8],
  6 => [24 => 14, 21 => 192, 22 => 12, 20 => 256, 19 => 304, 18 => 136, 17 => 8, 16 => 2], 7 => [24 => 42, 22 => 268, 23 => 8, 21 => 264, 20 => 182, 19 => 24, 18 => 4],
  8 => [24 => 73, 23 => 128, 22 => 228, 21 => 56, 20 => 10], 9 => [24 => 88, 23 => 96, 22 => 36], 10 => [24 => 50, 23 => 16], 11 => [24 => 12], 12 => [24 => 1]];
function casino_live4_lhist(): array { return CASINO_LINES_H; }
function casino_live4_lhist_calc(): array {
  static $H = null; if ($H !== null) return $H;
  $L = casino_live4_lines(); $H = [];
  for ($m = 1; $m < 4096; $m++) {
    $s = 0; $b = 0;
    for ($i = 0; $i < 12; $i++) if ($m >> $i & 1) { $b++; foreach ($L[$i] as $x) if ($x !== 12) $s |= 1 << $x; }
    $u = 0; for ($x = $s; $x; $x &= $x - 1) $u++;
    $H[$b][$u] = ($H[$b][$u] ?? 0) + 1;
  }
  return $H;
}
/** Chance que $u cases données soient toutes parmi $k boules tirées sur $N. */
function casino_live4_hyp(int $N, int $k, int $u): float { return $u > $k ? 0.0 : casino_live3_c($N - $u, $k - $u) / casino_live3_c($N, $k); }
/** Chance d'avoir EXACTEMENT j lignes complètes avec $k boules sur $N (inclusion–exclusion exacte). */
function casino_live4_pl(int $N, int $k, int $j): float {
  $s = $j === 0 ? 1.0 : 0.0;
  foreach (casino_live4_lhist() as $b => $row) if ($b >= $j) foreach ($row as $u => $cnt) $s += (($b - $j) % 2 ? -1 : 1) * casino_live3_c($b, $j) * $cnt * casino_live4_hyp($N, $k, $u);
  return $s;
}
/** Bingo : chance qu'au moins une ligne soit complète après $k boules sur 75. */
function casino_live4_bcdf(int $k): float {
  if ($k < 4) return 0.0;
  return 1.0 - casino_live4_pl(75, $k, 0);
}
/** Lignes complètes d'une carte (25 cases, 0 = centre) avec les boules $balls. */
function casino_live4_count_lines(array $card, array $balls): int {
  $in = array_flip($balls); $n = 0;
  foreach (casino_live4_lines() as $ln) { $ok = true; foreach ($ln as $x) if ($x !== 12 && !isset($in[$card[$x]])) { $ok = false; break; } if ($ok) $n++; }
  return $n;
}
/** Blackjack, sabot continu, le croupier reste sur tout 17 : chances finales [0 = bust, 17…21, 22 = blackjack]. */
function casino_live4_bust(): array {
  static $R = null; if ($R !== null) return $R;
  $memo = [];
  // f(total dur, a un as compté 1, nb de cartes) → distribution finale
  $f = static function (int $t, bool $ace, int $n) use (&$f, &$memo): array {
    $key = "$t|" . ($ace ? 1 : 0) . "|$n";
    if (isset($memo[$key])) return $memo[$key];
    $best = ($ace && $t + 10 <= 21) ? $t + 10 : $t;
    if ($t > 21) return $memo[$key] = [0 => 1.0];
    if ($best >= 17) return $memo[$key] = [($n === 2 && $best === 21 ? 22 : $best) => 1.0];
    $o = [];
    for ($r = 1; $r <= 13; $r++) { $v = min(10, $r); foreach ($f($t + $v, $ace || $r === 1, $n + 1) as $k => $p) $o[$k] = ($o[$k] ?? 0) + $p / 13; }
    return $memo[$key] = $o;
  };
  $R = $f(0, false, 0); ksort($R);
  return $R;
}
/** Andar Bahar (jeu de 52, joker retiré) : chance que la 1re carte du même rang soit la k-ième distribuée (3 cartes bonnes sur 51). */
function casino_live4_ab(int $k): float { return casino_live3_c(51 - $k, 2) / casino_live3_c(51, 3); }
const CASINO_AB_K = [[1, 5], [6, 10], [11, 15], [16, 25], [26, 49]];
/** Lotto 6/49 : nombre de tirages (sur C(49,6)) de chaque somme. */
function casino_live4_lotto_sums(): array {
  static $S = null; if ($S !== null) return $S;
  $D = [0 => [0 => 1]]; // $D[nb][somme]
  for ($x = 1; $x <= 49; $x++) for ($n = min(5, $x - 1); $n >= 0; $n--) if (isset($D[$n])) foreach ($D[$n] as $s => $w) $D[$n + 1][$s + $x] = ($D[$n + 1][$s + $x] ?? 0) + $w;
  $S = $D[6]; ksort($S);
  return $S;
}

/** Chance exacte de chaque choix. */
function casino_live4_probs(string $g, array $out = []): array {
  static $memo = [];
  if (isset($memo[$g])) return $memo[$g];
  switch ($g) {
    case 'baccaratlive': $T = 4826809; $p = ['pl' => CASINO_BAC_N[0] / $T, 'bk' => CASINO_BAC_N[1] / $T, 'tie' => CASINO_BAC_N[2] / $T, 'pp' => 1 / 13, 'bp' => 1 / 13]; break;
    case 'andarlive':
      $a = 0.0; for ($k = 1; $k <= 49; $k += 2) $a += casino_live4_ab($k);
      $p = ['a' => $a, 'b' => 1 - $a];
      foreach (CASINO_AB_K as $i => [$lo, $hi]) { $s = 0.0; for ($k = $lo; $k <= $hi; $k++) $s += casino_live4_ab($k); $p['k' . $i] = $s; }
      break;
    case 'teenpattilive': $p = ['a' => 0.5, 'b' => 0.5, 'pa' => 5660 / 22100, 'pb' => 5660 / 22100]; break;
    case 'pokerlive': $p = ['r' => 0.5, 'b' => 0.5, 'r2' => 198180 / 2598960, 'b2' => 198180 / 2598960]; break;
    case 'redblacklive':
      $T = casino_live3_c(52, 5);
      $p = ['r' => 0.5, 'k' => 0.5, 's5' => 2 * casino_live3_c(26, 5) / $T, 's4' => 2 * casino_live3_c(26, 4) * 26 / $T, 's3' => 2 * casino_live3_c(26, 3) * casino_live3_c(26, 2) / $T];
      break;
    case 'lucky7live': $p = ['lo' => 6 / 13, 's7' => 1 / 13, 'hi' => 6 / 13, 'red' => 0.5, 'blk' => 0.5, 'pic' => 3 / 13]; break;
    case 'diceduellive':
      $t = 0; for ($s = 2; $s <= 12; $s++) { $w = 6 - abs($s - 7); $t += $w * $w; }
      $p = ['r' => (1296 - $t) / 2592, 'x' => $t / 1296, 'b' => (1296 - $t) / 2592, 'dd' => 11 / 36, 'd2' => 1 / 36];
      break;
    case 'peryalive':
      $p = []; for ($k = 0; $k < 6; $k++) $p['k' . $k] = 91 / 216;
      $p += ['mix' => 120 / 216, 'pair' => 90 / 216, 'tri' => 6 / 216];
      break;
    case 'bingolive':
      $p = []; foreach (CASINO_BINGO_T as $i => [$lo, $hi]) $p['t' . $i] = casino_live4_bcdf($hi) - casino_live4_bcdf($lo - 1);
      break;
    case 'lotto649live':
      $S = casino_live4_lotto_sums(); $T = casino_live3_c(49, 6); $lo = 0;
      foreach ($S as $s => $w) if ($s < CASINO_LOTTO_MID) $lo += $w;
      $oe = static fn(int $o): float => casino_live3_c(25, $o) * casino_live3_c(24, 6 - $o) / $T; // 25 impairs, 24 pairs
      $p = ['lo' => $lo / $T, 'hi' => $lo / $T, 'odd' => $oe(4) + $oe(5) + $oe(6), 'even' => $oe(2) + $oe(1) + $oe(0), 'eq' => $oe(3)];
      break;
    case 'megaballlive':
      $l0 = casino_live4_pl(51, 26, 0); $l1 = casino_live4_pl(51, 26, 1); $l2 = casino_live4_pl(51, 26, 2);
      $p = ['l0' => $l0, 'l1' => $l1, 'l2' => $l2, 'l3' => 1 - $l0 - $l1 - $l2];
      break;
    case 'bustlive':
      $d = casino_live4_bust();
      $p = ['bu' => $d[0], 's17' => $d[17], 's18' => $d[18], 's19' => $d[19], 's20' => $d[20], 's21' => $d[21], 'bj' => $d[22]];
      break;
    default: $p = [];
  }
  return $memo[$g] = $p;
}
function casino_live4_odds(string $g, array $out = []): array { return array_map('casino_live_sport_odd', casino_live4_probs($g, $out)); }
/** La sélection gagne-t-elle avec ce résultat ? */
function casino_live4_hit(string $g, string $sel, array $out): bool {
  $n = (int) ($out['n'] ?? -1);
  switch ($g) {
    case 'baccaratlive':
      if ($sel === 'pp' || $sel === 'bp') { $h = (array) ($out[$sel === 'pp' ? 'pl' : 'bk'] ?? []); return count($h) >= 2 && casino_live4_rank((int) $h[0]) === casino_live4_rank((int) $h[1]); }
      return $sel === (['pl', 'bk', 'tie'][$n] ?? '');
    case 'andarlive':
      if ($sel === 'a' || $sel === 'b') return $sel === ($n % 2 ? 'a' : 'b'); // n = nb de cartes distribuées ; la 1re va à Andar
      foreach (CASINO_AB_K as $i => [$lo, $hi]) if ($sel === 'k' . $i) return $n >= $lo && $n <= $hi;
      return false;
    case 'teenpattilive': case 'pokerlive':
      $A = (array) ($out['ha'] ?? []); $B = (array) ($out['hb'] ?? []);
      $f = $g === 'pokerlive' ? 'casino_live4_pk' : 'casino_live4_tp';
      if ($sel === 'a' || $sel === 'r') return $n === 0;
      if ($sel === 'b') return $n === 1;
      if ($sel === 'pa') return $f($A)[0] >= 1;
      if ($sel === 'pb') return $f($B)[0] >= 1;
      if ($sel === 'r2') return $f($A)[0] >= 2;
      if ($sel === 'b2') return $f($B)[0] >= 2;
      return false;
    case 'redblacklive': return ['r' => $n >= 3, 'k' => $n <= 2, 's5' => $n === 0 || $n === 5, 's4' => $n === 1 || $n === 4, 's3' => $n === 2 || $n === 3][$sel] ?? false;
    case 'lucky7live':
      $c = (int) ($out['k'] ?? -1); $r = casino_live4_rank($c);
      return ['lo' => $r <= 6, 's7' => $r === 7, 'hi' => $r >= 8, 'red' => casino_live4_red($c), 'blk' => !casino_live4_red($c), 'pic' => $r >= 11][$sel] ?? false;
    case 'diceduellive':
      $d = (array) ($out['d'] ?? []); if (count($d) !== 4) return false;
      $d1 = $d[0] === $d[1]; $d2 = $d[2] === $d[3];
      return ['r' => $n === 0, 'b' => $n === 1, 'x' => $n === 2, 'dd' => $d1 || $d2, 'd2' => $d1 && $d2][$sel] ?? false;
    case 'peryalive':
      $d = [intdiv($n, 36), intdiv($n, 6) % 6, $n % 6]; $u = count(array_unique($d));
      if (preg_match('/^k([0-5])$/', $sel, $mm)) return in_array((int) $mm[1], $d, true);
      return ['mix' => $u === 3, 'pair' => $u === 2, 'tri' => $u === 1][$sel] ?? false;
    case 'bingolive':
      foreach (CASINO_BINGO_T as $i => [$lo, $hi]) if ($sel === 't' . $i) return $n >= $lo && $n <= $hi;
      return false;
    case 'lotto649live':
      $b = (array) ($out['b'] ?? []); $od = count(array_filter($b, static fn($v) => $v % 2 === 1));
      return ['lo' => $n < CASINO_LOTTO_MID, 'hi' => $n > CASINO_LOTTO_MID, 'odd' => $od >= 4, 'even' => $od <= 2, 'eq' => $od === 3][$sel] ?? false;
    case 'megaballlive': return ['l0' => $n === 0, 'l1' => $n === 1, 'l2' => $n === 2, 'l3' => $n >= 3][$sel] ?? false;
    case 'bustlive': return ['bu' => $n === 0, 's17' => $n === 17, 's18' => $n === 18, 's19' => $n === 19, 's20' => $n === 20, 's21' => $n === 21, 'bj' => $n === 22][$sel] ?? false;
  }
  return false;
}
/** Tirage d'un tour (appelé une fois, sous le verrou de draw-<jeu>.json). Jamais de clé « p » ni « c » (retirées par casino_draw_keep). */
function casino_live4_draw(string $g): array {
  switch ($g) {
    case 'baccaratlive':
      $s = []; for ($i = 0; $i < 6; $i++) $s[] = (random_int(1, 13) - 1) * 4 + random_int(0, 3); // sabot continu : chaque carte au hasard
      $b = casino_live4_bac($s);
      return ['n' => $b['n'], 'pl' => $b['pl'], 'bk' => $b['bk'], 'ps' => $b['ps'], 'bs' => $b['bs']];
    case 'andarlive':
      $j = random_int(0, 51); $rest = array_values(array_diff(range(0, 51), [$j])); $seq = [];
      for ($i = 0; $i < 51; $i++) {
        $x = random_int($i, 50); [$rest[$i], $rest[$x]] = [$rest[$x], $rest[$i]]; $seq[] = $rest[$i];
        if (casino_live4_rank($rest[$i]) === casino_live4_rank($j)) break;
      }
      return ['n' => count($seq), 'j' => $j, 'k' => $seq];
    case 'teenpattilive': case 'pokerlive':
      $m = $g === 'pokerlive' ? 5 : 3; $d = casino_live4_deal(2 * $m); $A = []; $B = [];
      foreach ($d as $i => $c) { if ($i % 2) $B[] = $c; else $A[] = $c; } // distribution alternée A, B, A, B…
      $f = $g === 'pokerlive' ? 'casino_live4_pk' : 'casino_live4_tp'; $fa = $f($A); $fb = $f($B);
      return ['n' => $fa > $fb ? 0 : 1, 'ha' => $A, 'hb' => $B, 'ca' => $fa[0], 'cb' => $fb[0]];
    case 'redblacklive': $d = casino_live4_deal(5); return ['n' => count(array_filter($d, 'casino_live4_red')), 'k' => $d];
    case 'lucky7live': $c = random_int(0, 51); return ['n' => casino_live4_rank($c), 'k' => $c];
    case 'diceduellive':
      $d = [random_int(1, 6), random_int(1, 6), random_int(1, 6), random_int(1, 6)]; $r = $d[0] + $d[1]; $b = $d[2] + $d[3];
      return ['n' => $r > $b ? 0 : ($r < $b ? 1 : 2), 'd' => $d];
    case 'peryalive': $a = random_int(0, 5); $b = random_int(0, 5); $c = random_int(0, 5); return ['n' => $a * 36 + $b * 6 + $c];
    case 'bingolive':
      $card = [];
      for ($col = 0; $col < 5; $col++) { $pool = range($col * 15 + 1, $col * 15 + 15); for ($i = 0; $i < 5; $i++) { $j = random_int($i, 14); [$pool[$i], $pool[$j]] = [$pool[$j], $pool[$i]]; } for ($r = 0; $r < 5; $r++) $card[$r * 5 + $col] = $pool[$r]; }
      $card[12] = 0; ksort($card); $card = array_values($card);
      $all = range(1, 75); $b = [];
      for ($i = 0; $i < 75; $i++) { $j = random_int($i, 74); [$all[$i], $all[$j]] = [$all[$j], $all[$i]]; $b[] = $all[$i]; if ($i >= 3 && casino_live4_count_lines($card, $b) > 0) break; }
      return ['n' => count($b), 'cd' => $card, 'b' => $b];
    case 'lotto649live':
      $all = range(1, 49); $b = [];
      for ($i = 0; $i < 6; $i++) { $j = random_int($i, 48); [$all[$i], $all[$j]] = [$all[$j], $all[$i]]; $b[] = $all[$i]; }
      return ['n' => array_sum($b), 'b' => $b];
    case 'megaballlive':
      $pool = range(1, 51); for ($i = 0; $i < 24; $i++) { $j = random_int($i, 50); [$pool[$i], $pool[$j]] = [$pool[$j], $pool[$i]]; }
      $card = array_slice($pool, 0, 24); array_splice($card, 12, 0, [0]);
      $all = range(1, 51); $b = [];
      for ($i = 0; $i < 26; $i++) { $j = random_int($i, 50); [$all[$i], $all[$j]] = [$all[$j], $all[$i]]; $b[] = $all[$i]; }
      return ['n' => casino_live4_count_lines($card, $b), 'cd' => $card, 'b' => $b];
    case 'bustlive':
      $k = []; $t = 0; $ace = false;
      while (true) {
        $c = (random_int(1, 13) - 1) * 4 + random_int(0, 3); $k[] = $c; $r = casino_live4_rank($c);
        $t += min(10, $r); $ace = $ace || $r === 1; $best = ($ace && $t + 10 <= 21) ? $t + 10 : $t;
        if ($t > 21) return ['n' => 0, 'k' => $k];
        if ($best >= 17) return ['n' => count($k) === 2 && $best === 21 ? 22 : $best, 'k' => $k];
      }
  }
  return ['n' => 0];
}
/** Ce qui est montré PENDANT les mises : la carte commune du Bingo / Mega Ball (les numéros, pas les boules) ; le joker d'Andar Bahar
 *  (comme au vrai jeu : il ne change aucune chance — quel que soit son rang, 3 cartes sur 51 lui correspondent). */
function casino_live4_pre(string $g, array $cur): array {
  if (($g === 'bingolive' || $g === 'megaballlive') && isset($cur['cd'])) return ['cd' => $cur['cd']];
  if ($g === 'andarlive' && isset($cur['j'])) return ['j' => (int) $cur['j']];
  return [];
}
