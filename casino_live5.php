<?php
declare(strict_types=1);
/* v2901 (propriétaire, round 5) — LIVE 5 : 16 NOUVEAUX JEUX EN DIRECT « courses & sports » (même moteur casino_draw_* que Lucky Planets,
 * live2, live3 et live4 : un tirage par tour et par jeu, fait la 1re fois qu'on en a besoin, sous verrou, gardé dans draw-<jeu>.json,
 * SECRET jusqu'à la fermeture des mises, le même pour tout le monde ; un pari par joueur et par tour).
 * Fichier à part, chargé par casino_lib.php (require_once en haut) : constantes + fonctions pures, aucun argent ici.
 * Chaque choix a sa chance EXACTE p et sa cote = 0,94 ÷ p arrondie VERS LE BAS au centime (casino_live2_odd) → retour entre 93 et 94 %
 * pour CHAQUE choix (vérifié par scripts/test-cg-live5.php : calcul exact + simulation). Cote maximale ×1000.
 * COURSES (ordre d'arrivée tiré au hasard, chaque concurrent a son poids : le 1er arrivé est tiré avec la chance poids ÷ somme des poids
 * restants, puis le 2e parmi les autres, etc. — chances exactes par énumération de tous les ordres) :
 *  - dogracelive     Dog Race Live : 6 lévriers ; gagnant · numéro impair / pair.
 *  - camelracelive   Camel Race Live : 5 chameaux ; gagnant · dernier.
 *  - snailracelive   Snail Race Live : 4 escargots (chances égales) ; gagnant · duo de tête (les 2 premiers, dans n'importe quel ordre).
 *  - chickenracelive Chicken Race Live : 6 poules ; gagnant · 1–3 / 4–6.
 *  - boatracelive    Boat Race Live : 5 bateaux ; gagnant · dans les 2 premiers.
 *  - spaceracelive   Space Race Live : 6 fusées en 3 équipes de couleur ; gagnant · équipe gagnante.
 * SPORTS & SPECTACLES :
 *  - monsterlive     Monster Truck Live : nombre de voitures sautées (0–12, table fixe) ; 0 · 1–4 · 5–7 · 8–10 · 11–12 · 12 parfait.
 *  - penaltylive     Penalty Shootout Live : 5 tirs chacun (75 % de buts), arrêt dès que c'est joué, puis mort subite ;
 *                    Domicile · Extérieur · mort subite · décidé avant le 10e tir.
 *  - basketlive      Basketball Shots Live : 10 tirs à 55 % ; 0–4 · 5 · 6 · 7–10 · 4 de suite · 10/10.
 *  - boxinglive      Boxing Live : table fixe (KO / aux points / nul) + round du KO ; Rouge · nul · Bleu · KO · aux points · KO rounds 1–2.
 *  - tennislive      Tennis Rally Live : chaque coup est bon à 80 % (le 41e coup est toujours faute) ; serveur · relanceur · 0–3 · 4–9 · 10+ · 20+.
 *  - cricketlive     Cricket Over Live : 6 balles (table fixe par balle) ; points 0–5 · 6–9 · 10–14 · 15+ · un six · un guichet.
 *  - archerylive     Archery Live : 3 flèches (table fixe par flèche) ; total ≤ 21 · 22–24 · 25–27 · 28–30 · un 10 · 30 parfait.
 *  - fishinglive     Fishing Live : une prise (table fixe) ; botte · petit · moyen · gros · requin · poisson d'or · grosse prise.
 *  - balloonlive     Balloon Pop Live : 12 ballons (4 rouges, 4 bleus, 3 verts, 1 or), 3 fléchettes = 3 ballons différents au hasard ;
 *                    or touché · 2+ rouges · 2+ bleus · 2+ verts · 3 couleurs · 3 pareils.
 *  - volcanolive     Volcano Live : puissance 1–10 (table fixe) + 5 bombes de lave à gauche / droite (50 %) ; 1–3 · 4–6 · 7–9 · 10 · gauche · droite.
 * [période P, mises ouvertes B] */
const CASINO_LIVE5 = ['dogracelive' => [150, 120], 'camelracelive' => [155, 120], 'snailracelive' => [150, 120], 'chickenracelive' => [150, 120],
  'monsterlive' => [140, 120], 'boatracelive' => [150, 120], 'spaceracelive' => [150, 120], 'penaltylive' => [170, 120],
  'basketlive' => [145, 120], 'boxinglive' => [150, 120], 'tennislive' => [150, 120], 'cricketlive' => [145, 120],
  'archerylive' => [140, 120], 'fishinglive' => [140, 120], 'balloonlive' => [140, 120], 'volcanolive' => [140, 120]];
const CASINO_LIVE5_KEYS = ['dogracelive', 'camelracelive', 'snailracelive', 'chickenracelive', 'monsterlive', 'boatracelive', 'spaceracelive', 'penaltylive',
  'basketlive', 'boxinglive', 'tennislive', 'cricketlive', 'archerylive', 'fishinglive', 'balloonlive', 'volcanolive'];
// poids des concurrents (favori → outsider)
const CASINO_L5_RACE = ['dogracelive' => [26, 21, 18, 14, 12, 9], 'camelracelive' => [30, 25, 20, 15, 10], 'snailracelive' => [1, 1, 1, 1],
  'chickenracelive' => [24, 20, 18, 15, 13, 10], 'boatracelive' => [28, 24, 20, 16, 12], 'spaceracelive' => [22, 20, 17, 16, 13, 12]];
const CASINO_L5_TEAMS = [[0, 3], [1, 4], [2, 5]]; // Space Race : équipes or, cyan, rose
const CASINO_L5_MONSTER = [120, 60, 70, 85, 100, 110, 105, 95, 80, 65, 50, 35, 25]; // ‰ : voitures sautées 0…12
const CASINO_L5_MONSTER_B = ['c0' => [0, 0], 'c1' => [1, 4], 'c2' => [5, 7], 'c3' => [8, 10], 'c4' => [11, 12], 'c12' => [12, 12]];
const CASINO_L5_PEN = 0.75;   // chance de marquer un tir au but
const CASINO_L5_BASKET = 0.55; // chance de réussir un tir
const CASINO_L5_BOX = [22, 25, 6, 25, 22]; // % : KO Rouge · Rouge aux points · nul · Bleu aux points · KO Bleu
const CASINO_L5_BOX_R = [20, 19, 18, 16, 14, 13]; // % : round du KO (1…6)
const CASINO_L5_TEN = 0.8; const CASINO_L5_TEN_MAX = 40; // tennis : coup bon à 80 %, 40 coups au plus
const CASINO_L5_CRICKET = [[0, 36], [1, 30], [2, 10], [3, 2], [4, 11], [6, 5], [-1, 6]]; // % par balle (−1 = guichet, 0 point)
const CASINO_L5_ARROW = [10 => 160, 9 => 220, 8 => 200, 7 => 150, 6 => 100, 5 => 70, 4 => 40, 3 => 30, 2 => 20, 1 => 5, 0 => 5]; // ‰ par flèche
const CASINO_L5_FISH = [18, 30, 24, 16, 8, 4]; // % : botte, petit, moyen, gros, requin, or
const CASINO_L5_BALLOON = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3]; // couleurs des 12 ballons : 0 rouge, 1 bleu, 2 vert, 3 or
const CASINO_L5_VOLCANO = [16, 15, 14, 12, 11, 9, 8, 6, 5, 4]; // % : puissance 1…10

/** Course : chance de chaque ordre d'arrivée (poids $w) ; [[ordre, chance], …] (N ≤ 6 : 720 ordres). */
function casino_live5_orders(array $w): array {
  $n = count($w); $out = [];
  $rec = static function (array $pre, array $left, float $p) use (&$rec, &$out, $w): void {
    if (!$left) { $out[] = [$pre, $p]; return; }
    $s = 0; foreach ($left as $i) $s += $w[$i];
    foreach ($left as $k => $i) { $l2 = $left; unset($l2[$k]); $rec(array_merge($pre, [$i]), $l2, $p * $w[$i] / $s); }
  };
  $rec([], range(0, $n - 1), 1.0);
  return $out;
}
function casino_live5_pick(array $w, array $left): int {
  $s = 0; foreach ($left as $i) $s += $w[$i];
  $x = random_int(1, $s); foreach ($left as $i) { $x -= $w[$i]; if ($x <= 0) return $i; }
  return (int) end($left);
}
/** Choix gagnants d'une course (ordre d'arrivée $o). */
function casino_live5_race_wins(string $g, array $o): array {
  $n = count(CASINO_L5_RACE[$g]); $f = (int) $o[0]; $w = ['w' . $f];
  switch ($g) {
    case 'dogracelive': $w[] = $f % 2 === 0 ? 'odd' : 'even'; break; // n° 1, 3, 5 = index 0, 2, 4
    case 'camelracelive': $w[] = 'l' . (int) $o[$n - 1]; break;
    case 'snailracelive': $a = min((int) $o[0], (int) $o[1]); $b = max((int) $o[0], (int) $o[1]); $w[] = 'q' . $a . $b; break;
    case 'chickenracelive': $w[] = $f < 3 ? 'lo' : 'hi'; break;
    case 'boatracelive': $w[] = 't' . (int) $o[0]; $w[] = 't' . (int) $o[1]; break;
    case 'spaceracelive': foreach (CASINO_L5_TEAMS as $k => $tm) if (in_array($f, $tm, true)) $w[] = 'k' . $k; break;
  }
  return $w;
}
/** Penalty : à partir des 10 tirs (1 = but) dans l'ordre D1, E1, D2, E2…, n° du tir (1…10) où c'est joué, ou 0 = égalité après 10. */
function casino_live5_pen_stop(array $k): int {
  $g = [0, 0]; $t = [0, 0];
  for ($j = 0; $j < 10; $j++) {
    $s = $j % 2; $t[$s]++; $g[$s] += $k[$j];
    if ($g[0] > $g[1] + 5 - $t[1] || $g[1] > $g[0] + 5 - $t[0]) return $j + 1;
  }
  return 0;
}
/** Basket : plus longue série de paniers. */
function casino_live5_streak(array $s): int { $b = 0; $c = 0; foreach ($s as $x) { $c = $x ? $c + 1 : 0; $b = max($b, $c); } return $b; }
/** Lois exactes réutilisées (calculées une fois). */
function casino_live5_dist(string $what): array {
  static $M = [];
  if (isset($M[$what])) return $M[$what];
  $d = [];
  switch ($what) {
    case 'pen': // [h, a, sd, early] : 2^10 suites de tirs ; mort subite : chaque tour 1/2 pour chacun (symétrie exacte)
      $h = 0.0; $sd = 0.0; $early = 0.0; $q = CASINO_L5_PEN;
      for ($m = 0; $m < 1024; $m++) {
        $k = []; $p = 1.0; for ($j = 0; $j < 10; $j++) { $b = $m >> $j & 1; $k[] = $b; $p *= $b ? $q : 1 - $q; }
        $st = casino_live5_pen_stop($k);
        if ($st === 0) { $sd += $p; $h += $p / 2; continue; }
        if ($st < 10) $early += $p;
        $gh = 0; $ga = 0; for ($j = 0; $j < $st; $j++) { if ($j % 2) $ga += $k[$j]; else $gh += $k[$j]; }
        if ($gh > $ga) $h += $p;
      }
      $d = ['h' => $h, 'a' => 1 - $h, 'sd' => $sd, 'early' => $early];
      break;
    case 'basket': // nb de paniers (binomiale) + série de 4
      $p = CASINO_L5_BASKET; $cnt = array_fill(0, 11, 0.0); $st4 = 0.0;
      for ($m = 0; $m < 1024; $m++) { $s = []; $w = 1.0; for ($j = 0; $j < 10; $j++) { $b = $m >> $j & 1; $s[] = $b; $w *= $b ? $p : 1 - $p; } $cnt[array_sum($s)] += $w; if (casino_live5_streak($s) >= 4) $st4 += $w; }
      $d = ['cnt' => $cnt, 'st4' => $st4];
      break;
    case 'tennis': // P(L = k), k = 0…40 coups bons avant la faute
      $q = CASINO_L5_TEN; for ($k = 0; $k < CASINO_L5_TEN_MAX; $k++) $d[$k] = $q ** $k * (1 - $q); $d[CASINO_L5_TEN_MAX] = $q ** CASINO_L5_TEN_MAX;
      break;
    case 'cricket': // [points][guichets>0][six>0] après 6 balles
      $D = [[0, 0, 0, 1.0]];
      for ($b = 0; $b < 6; $b++) {
        $N = [];
        foreach ($D as [$r, $wk, $sx, $p]) foreach (CASINO_L5_CRICKET as [$v, $pc]) {
          $r2 = $r + max(0, $v); $w2 = $wk || $v < 0 ? 1 : 0; $s2 = $sx || $v === 6 ? 1 : 0; $key = "$r2|$w2|$s2";
          $N[$key] = [$r2, $w2, $s2, ($N[$key][3] ?? 0) + $p * $pc / 100];
        }
        $D = array_values($N);
      }
      $d = $D;
      break;
    case 'arrow': // total de 3 flèches
      $D = [0 => 1.0];
      for ($a = 0; $a < 3; $a++) { $N = []; foreach ($D as $s => $p) foreach (CASINO_L5_ARROW as $v => $pm) $N[$s + $v] = ($N[$s + $v] ?? 0) + $p * $pm / 1000; $D = $N; }
      ksort($D); $d = $D;
      break;
  }
  return $M[$what] = $d;
}
/** Ballons : choix gagnants pour 3 couleurs touchées. */
function casino_live5_balloon_wins(array $cols): array {
  $c = array_count_values(array_map('intval', $cols)); $w = [];
  if (isset($c[3])) $w[] = 'gold';
  foreach (['red' => 0, 'blue' => 1, 'green' => 2] as $s => $k) if (($c[$k] ?? 0) >= 2) $w[] = $s . '2';
  if (count($c) === 3) $w[] = 'mix';
  if (count($c) === 1) $w[] = 'tri';
  return $w;
}

/** Chance exacte de chaque choix. */
function casino_live5_probs(string $g, array $out = []): array {
  static $memo = [];
  if (isset($memo[$g])) return $memo[$g];
  $p = [];
  if (isset(CASINO_L5_RACE[$g])) {
    foreach (casino_live5_orders(CASINO_L5_RACE[$g]) as [$o, $q]) foreach (casino_live5_race_wins($g, $o) as $s) $p[$s] = ($p[$s] ?? 0) + $q;
    ksort($p);
    return $memo[$g] = $p;
  }
  switch ($g) {
    case 'monsterlive':
      foreach (CASINO_L5_MONSTER_B as $s => [$lo, $hi]) { $x = 0; for ($k = $lo; $k <= $hi; $k++) $x += CASINO_L5_MONSTER[$k]; $p[$s] = $x / 1000; }
      break;
    case 'penaltylive': $p = casino_live5_dist('pen'); break;
    case 'basketlive':
      $D = casino_live5_dist('basket'); $c = $D['cnt'];
      $p = ['u5' => $c[0] + $c[1] + $c[2] + $c[3] + $c[4], 'e5' => $c[5], 'e6' => $c[6], 'o6' => $c[7] + $c[8] + $c[9] + $c[10], 'st4' => $D['st4'], 'p10' => $c[10]];
      break;
    case 'boxinglive':
      $b = CASINO_L5_BOX; $ko = ($b[0] + $b[4]) / 100;
      $p = ['red' => ($b[0] + $b[1]) / 100, 'draw' => $b[2] / 100, 'blue' => ($b[3] + $b[4]) / 100, 'ko' => $ko, 'pts' => ($b[1] + $b[3]) / 100, 'eko' => $ko * (CASINO_L5_BOX_R[0] + CASINO_L5_BOX_R[1]) / 100];
      break;
    case 'tennislive':
      $p = ['srv' => 0.0, 'rcv' => 0.0, 's' => 0.0, 'm' => 0.0, 'l' => 0.0, 'x' => 0.0];
      foreach (casino_live5_dist('tennis') as $k => $q) { $p[$k % 2 ? 'srv' : 'rcv'] += $q; $p[$k <= 3 ? 's' : ($k <= 9 ? 'm' : 'l')] += $q; if ($k >= 20) $p['x'] += $q; }
      break;
    case 'cricketlive':
      $p = ['r0' => 0.0, 'r1' => 0.0, 'r2' => 0.0, 'r3' => 0.0, 'six' => 0.0, 'wkt' => 0.0];
      foreach (casino_live5_dist('cricket') as [$r, $wk, $sx, $q]) { $p[$r <= 5 ? 'r0' : ($r <= 9 ? 'r1' : ($r <= 14 ? 'r2' : 'r3'))] += $q; if ($sx) $p['six'] += $q; if ($wk) $p['wkt'] += $q; }
      break;
    case 'archerylive':
      $p = ['a0' => 0.0, 'a1' => 0.0, 'a2' => 0.0, 'a3' => 0.0, 'ten' => 1 - (1 - CASINO_L5_ARROW[10] / 1000) ** 3, 'p30' => (CASINO_L5_ARROW[10] / 1000) ** 3];
      foreach (casino_live5_dist('arrow') as $s => $q) $p[$s <= 21 ? 'a0' : ($s <= 24 ? 'a1' : ($s <= 27 ? 'a2' : 'a3'))] += $q;
      break;
    case 'fishinglive':
      foreach (CASINO_L5_FISH as $k => $pc) $p['f' . $k] = $pc / 100;
      $p['big'] = (CASINO_L5_FISH[3] + CASINO_L5_FISH[4] + CASINO_L5_FISH[5]) / 100;
      break;
    case 'balloonlive':
      $p = ['gold' => 0.0, 'red2' => 0.0, 'blue2' => 0.0, 'green2' => 0.0, 'mix' => 0.0, 'tri' => 0.0]; $B = CASINO_L5_BALLOON; $T = 220;
      for ($a = 0; $a < 12; $a++) for ($b = $a + 1; $b < 12; $b++) for ($c = $b + 1; $c < 12; $c++) foreach (casino_live5_balloon_wins([$B[$a], $B[$b], $B[$c]]) as $s) $p[$s] += 1 / $T;
      break;
    case 'volcanolive':
      $v = CASINO_L5_VOLCANO;
      $p = ['v0' => ($v[0] + $v[1] + $v[2]) / 100, 'v1' => ($v[3] + $v[4] + $v[5]) / 100, 'v2' => ($v[6] + $v[7] + $v[8]) / 100, 'v3' => $v[9] / 100, 'left' => 0.5, 'right' => 0.5];
      break;
  }
  return $memo[$g] = $p;
}
function casino_live5_odds(string $g, array $out = []): array { return array_map('casino_live2_odd', casino_live5_probs($g, $out)); }
/** Choix gagnants d'un résultat. */
function casino_live5_wins(string $g, array $out): array {
  $n = (int) ($out['n'] ?? -1);
  if (isset(CASINO_L5_RACE[$g])) { $o = array_map('intval', (array) ($out['r'] ?? [])); return count($o) === count(CASINO_L5_RACE[$g]) ? casino_live5_race_wins($g, $o) : []; }
  switch ($g) {
    case 'monsterlive': $w = []; foreach (CASINO_L5_MONSTER_B as $s => [$lo, $hi]) if ($n >= $lo && $n <= $hi) $w[] = $s; return $w;
    case 'penaltylive':
      $w = [$n === 0 ? 'h' : 'a']; $st = (int) ($out['st'] ?? -1);
      if ($st === 0) $w[] = 'sd'; elseif ($st > 0 && $st < 10) $w[] = 'early';
      return $w;
    case 'basketlive':
      $s = array_map('intval', (array) ($out['s'] ?? [])); if (count($s) !== 10) return [];
      $w = [$n <= 4 ? 'u5' : ($n === 5 ? 'e5' : ($n === 6 ? 'e6' : 'o6'))]; if (casino_live5_streak($s) >= 4) $w[] = 'st4'; if ($n === 10) $w[] = 'p10';
      return $w;
    case 'boxinglive':
      $w = [$n <= 1 ? 'red' : ($n === 2 ? 'draw' : 'blue')];
      if ($n === 0 || $n === 4) { $w[] = 'ko'; if ((int) ($out['r'] ?? 9) <= 2) $w[] = 'eko'; } elseif ($n !== 2) $w[] = 'pts';
      return $w;
    case 'tennislive':
      $w = [$n % 2 ? 'srv' : 'rcv', $n <= 3 ? 's' : ($n <= 9 ? 'm' : 'l')]; if ($n >= 20) $w[] = 'x';
      return $w;
    case 'cricketlive':
      $b = array_map('intval', (array) ($out['b'] ?? [])); if (count($b) !== 6) return [];
      $w = [$n <= 5 ? 'r0' : ($n <= 9 ? 'r1' : ($n <= 14 ? 'r2' : 'r3'))]; if (in_array(6, $b, true)) $w[] = 'six'; if (in_array(-1, $b, true)) $w[] = 'wkt';
      return $w;
    case 'archerylive':
      $a = array_map('intval', (array) ($out['a'] ?? [])); if (count($a) !== 3) return [];
      $w = [$n <= 21 ? 'a0' : ($n <= 24 ? 'a1' : ($n <= 27 ? 'a2' : 'a3'))]; if (in_array(10, $a, true)) $w[] = 'ten'; if ($n === 30) $w[] = 'p30';
      return $w;
    case 'fishinglive': $w = ['f' . $n]; if ($n >= 3) $w[] = 'big'; return $w;
    case 'balloonlive':
      $L = array_map('intval', (array) ($out['l'] ?? [])); $h = array_map('intval', (array) ($out['h'] ?? [])); if (count($L) !== 12 || count($h) !== 3) return [];
      return casino_live5_balloon_wins([$L[$h[0]], $L[$h[1]], $L[$h[2]]]);
    case 'volcanolive':
      $b = array_map('intval', (array) ($out['b'] ?? [])); if (count($b) !== 5) return [];
      return ['v' . ($n <= 3 ? 0 : ($n <= 6 ? 1 : ($n <= 9 ? 2 : 3))), array_sum($b) >= 3 ? 'right' : 'left'];
  }
  return [];
}
/** La sélection gagne-t-elle avec ce résultat ? */
function casino_live5_hit(string $g, string $sel, array $out): bool { return in_array($sel, casino_live5_wins($g, $out), true); }
/** Tirage d'un tour (appelé une fois, sous le verrou de draw-<jeu>.json). Jamais de clé « p » ni « c » (retirées par casino_draw_keep).
 *  « s » = graine du spectacle (dépassements, gestes…), tirée ici aussi : tout le monde voit exactement le même film. */
function casino_live5_draw(string $g): array {
  $seed = random_int(0, 999999);
  if (isset(CASINO_L5_RACE[$g])) {
    $w = CASINO_L5_RACE[$g]; $left = range(0, count($w) - 1); $o = [];
    while ($left) { $i = casino_live5_pick($w, $left); $o[] = $i; $left = array_values(array_diff($left, [$i])); }
    return ['n' => $o[0], 'r' => $o, 's' => $seed];
  }
  switch ($g) {
    case 'monsterlive': return ['n' => casino_live5_pick(CASINO_L5_MONSTER, range(0, 12)), 's' => $seed];
    case 'penaltylive':
      $q = (int) round(CASINO_L5_PEN * 100); $k = []; for ($j = 0; $j < 10; $j++) $k[] = random_int(1, 100) <= $q ? 1 : 0;
      $st = casino_live5_pen_stop($k); $kk = array_slice($k, 0, $st ?: 10);
      if ($st === 0) { do { $a = random_int(1, 100) <= $q ? 1 : 0; $b = random_int(1, 100) <= $q ? 1 : 0; $kk[] = $a; $kk[] = $b; } while ($a === $b); $n = $a > $b ? 0 : 1; }
      else { $gh = 0; $ga = 0; foreach ($kk as $j => $x) { if ($j % 2) $ga += $x; else $gh += $x; } $n = $gh > $ga ? 0 : 1; }
      return ['n' => $n, 'k' => $kk, 'st' => $st, 's' => $seed];
    case 'basketlive':
      $q = (int) round(CASINO_L5_BASKET * 100); $s = []; for ($j = 0; $j < 10; $j++) $s[] = random_int(1, 100) <= $q ? 1 : 0;
      return ['n' => array_sum($s), 's' => $s, 'g' => $seed];
    case 'boxinglive':
      $n = casino_live5_pick(CASINO_L5_BOX, range(0, 4));
      return ['n' => $n, 'r' => ($n === 0 || $n === 4) ? 1 + casino_live5_pick(CASINO_L5_BOX_R, range(0, 5)) : 6, 's' => $seed];
    case 'tennislive':
      $L = 0; $q = (int) round(CASINO_L5_TEN * 100); while ($L < CASINO_L5_TEN_MAX && random_int(1, 100) <= $q) $L++;
      return ['n' => $L, 's' => $seed];
    case 'cricketlive':
      $b = []; foreach (range(1, 6) as $_) { $x = random_int(1, 100); foreach (CASINO_L5_CRICKET as [$v, $pc]) { $x -= $pc; if ($x <= 0) { $b[] = $v; break; } } }
      return ['n' => array_sum(array_map(static fn($v) => max(0, $v), $b)), 'b' => $b, 's' => $seed];
    case 'archerylive':
      $a = []; for ($j = 0; $j < 3; $j++) { $x = random_int(1, 1000); foreach (CASINO_L5_ARROW as $v => $pm) { $x -= $pm; if ($x <= 0) { $a[] = $v; break; } } }
      return ['n' => array_sum($a), 'a' => $a, 's' => $seed];
    case 'fishinglive': return ['n' => casino_live5_pick(CASINO_L5_FISH, range(0, 5)), 's' => $seed];
    case 'balloonlive':
      $L = CASINO_L5_BALLOON; for ($i = 11; $i > 0; $i--) { $j = random_int(0, $i); [$L[$i], $L[$j]] = [$L[$j], $L[$i]]; }
      $pos = range(0, 11); $h = []; for ($i = 0; $i < 3; $i++) { $j = random_int($i, 11); [$pos[$i], $pos[$j]] = [$pos[$j], $pos[$i]]; $h[] = $pos[$i]; }
      $c = [$L[$h[0]], $L[$h[1]], $L[$h[2]]]; sort($c);
      return ['n' => $c[0] * 16 + $c[1] * 4 + $c[2], 'l' => $L, 'h' => $h, 's' => $seed];
    case 'volcanolive':
      $b = []; for ($j = 0; $j < 5; $j++) $b[] = random_int(0, 1);
      return ['n' => 1 + casino_live5_pick(CASINO_L5_VOLCANO, range(0, 9)), 'b' => $b, 's' => $seed];
  }
  return ['n' => 0];
}
/** Ce qui est montré PENDANT les mises : rien (tout le spectacle vient après la fermeture). */
function casino_live5_pre(string $g, array $cur): array { return []; }
