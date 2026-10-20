<?php
declare(strict_types=1);
/**
 * v2690 — CASINO OROLADO (propriétaire, 2026-10-16) : 15 jeux créés par nous, mise dès 0,10 $, même solde RÉEL que le
 * trading (ou DÉMO). Tout est tiré par le SERVEUR (random_int, générateur cryptographique) ; le navigateur ne fait
 * qu'afficher. Chaque jeu a une marge maison fixe (retour aux joueurs 95 à 97 %) → la maison gagne sur la durée.
 *
 * Argent : mise retirée UNE fois (orolado_trade_debit, référence unique), gain versé UNE fois
 * (orolado_trade_credit_once, même référence) — mêmes fonctions que les trades, déjà éprouvées.
 * Les mises réelles comptent pour la règle « miser ×2 avant retrait » (comme un trade).
 * Gain maximal caché par partie : CASINO_MAX_WIN. Mise maximale cachée : CASINO_MAX_STAKE.
 * v2690b (propriétaire) : ARGENT RÉEL SEULEMENT — pas de démo ni d'essai dans le casino (un visiteur doit s'inscrire et déposer).
 */

const CASINO_MIN = 0.10;
const CASINO_MAX_STAKE = 1000.0;
const CASINO_MAX_WIN = 10000.0;
const CASINO_GAMES = ['crash', 'jet', 'rocket', 'coin', 'dice', 'limbo', 'wheel', 'race', 'roulette', 'slots', 'plinko', 'keno', 'scratch', 'hilo', 'penalty', 'colors', 'mines', 'apple',
  'tower', 'dragon', 'baccarat', 'sicbo', 'chests', 'balloon', 'darts', 'cryptox', 'horses', 'rps', 'lotto', 'planets',
  'catwalk', 'fleets', 'gemcount', 'claw', // v2830 : 4 nouveaux jeux en direct (CASINO_LIVE2)
  'dtlive', 'hilolive', 'sicbolive', 'kenolive', 'lucky10', 'moneywheel', 'coinlive', 'pegdrop', 'football', 'bullseye', 'ladderlive', 'moonshot']; // v2850 : 12 nouveaux jeux en direct (CASINO_LIVE3)
const CASINO_MULTI = ['crash', 'jet', 'rocket', 'hilo', 'mines', 'apple', 'tower', 'balloon', 'penalty', 'cryptox', 'horses', 'roulette', 'race', 'planets',
  'catwalk', 'fleets', 'gemcount', 'claw', // jeux en plusieurs étapes (état gardé par le serveur)
  'dtlive', 'hilolive', 'sicbolive', 'kenolive', 'lucky10', 'moneywheel', 'coinlive', 'pegdrop', 'football', 'bullseye', 'ladderlive', 'moonshot']; // v2850 : CASINO_LIVE3
/*
 * v2718 (propriétaire) — JEUX EN DIRECT À TIRAGE : le serveur fait un tirage commun à heure fixe, tout le monde voit le même.
 *  - période P secondes ; tour n° i = floor(maintenant / P) ; mises ouvertes de i·P à i·P + B ; à i·P + B le résultat est
 *    révélé (le téléphone l'anime jusqu'à la fin du tour). Le résultat est tiré au hasard la 1re fois qu'on en a besoin
 *    (sous verrou) et reste SECRET jusqu'à i·P + B. Un pari par joueur, par jeu et par tour.
 *  - Crypto Live : 15 cryptos, la bonne paie ×14,4 (retour 96 %). Chevaux Live : 10 chevaux, le gagnant paie ×9,6 (96 %).
 *    Roulette Live : roulette européenne (rouge / noir / pair / impair ×2, douzaine ×3, numéro ×36 — retour 97,3 %).
 */
/* v2811 (propriétaire, round 4) — tours plus LONGS et plus haletants, plus légers pour le serveur :
 *  ~2 min de mises (compte à rebours « Prochain tour dans 1:54 »), puis le spectacle : Crypto Live 45 s de roue, Roulette
 *  30 s de bille, Horse Race / Racing ~75 s de course, Lucky Planets 30 s de comète, puis le résultat affiché.
 *  Le n° de tour continue d'AUGMENTER malgré la nouvelle période (CASINO_DRAW_I0 ajouté) : les tirages déjà gardés
 *  (draw-<jeu>.json, n° ≈ maintenant ÷ 40 ou ÷ 60) restent plus petits que les nouveaux → rien n'est re-tiré, aucun tour bloqué.
 *  Les paris en cours gardent leur propre fermeture et leur propre résultat (v2810) : ils se règlent comme avant. */
const CASINO_DRAW = ['cryptox' => [180, 120], 'horses' => [210, 120], 'roulette' => [160, 120], 'race' => [210, 120], 'planets' => [160, 120]]; // [période P, mises ouvertes B]
const CASINO_DRAW_I0 = 100000000; // v2811 : décalage des n° de tour (toujours > aux anciens n°, ~4,5·10⁷ au plus)
/** v2811 — n° du tour en cours à l'instant $now. */
function casino_draw_i(string $g, float $now): int { return CASINO_DRAW_I0 + (int) floor($now / casino_draw_pb($g)[0]); }
/** v2811 — heure d'ouverture du tour $i (les mises ferment à + B, le tour finit à + P). */
function casino_draw_start(string $g, int $i): float { return (float) (($i - CASINO_DRAW_I0) * casino_draw_pb($g)[0]); }
/* v2830 (propriétaire, round 5) — 4 NOUVEAUX JEUX EN DIRECT (tour commun, mêmes règles que Lucky Planets : ~2 min de mises,
 * résultat tiré une fois sous verrou, SECRET jusqu'à la fermeture, gardé avec le pari ; un pari par joueur et par tour).
 * Chaque choix a sa chance exacte p et sa cote = 0,94 ÷ p arrondie VERS LE BAS au centime → retour ≤ 94 % pour CHAQUE choix.
 *  - Miss Catwalk : 6 mannequins défilent, 3 juges notent, la meilleure note gagne. À chaque tour les 6 chances
 *    (30 · 22 · 17 · 13 · 10 · 8 %) sont redistribuées entre les mannequins (favorite ×3,13 … outsider ×11,75), visibles avant.
 *  - Star Fleets : 5 salves entre la flotte Or et la flotte Violette (chaque salve : 1 chance sur 2 pour chacune) ;
 *    vainqueur ×1,88 · score exact 3–2 ×3,00 · 4–1 ×6,01 · 5–0 ×30,08 (et l'inverse).
 *  - Gem Count (fan-tan) : un tas de 32 à 63 gemmes est compté 4 par 4 ; reste 1, 2, 3 ou 4 ×3,76 · impair / pair ×1,88.
 *  - Lucky Claw : la pince attrape UN des 6 lots (30 · 24 · 18 · 13 · 9 · 6 %) : ×3,13 … ×15,66.
 * Constante à part (CASINO_DRAW reste celle des 5 jeux existants) ; même moteur casino_draw_*. [période P, mises ouvertes B] */
const CASINO_LIVE2 = ['catwalk' => [200, 120], 'fleets' => [180, 120], 'gemcount' => [170, 120], 'claw' => [165, 120]];
const CASINO_CATWALK_W = [30, 22, 17, 13, 10, 8]; // chances (%) par rang : favorite → outsider
const CASINO_CLAW_W = [30, 24, 18, 13, 9, 6];     // ourson, canard, robot, fusée, couronne, diamant
/** v2830 — [P, B] d'un jeu en direct (anciens : CASINO_DRAW, nouveaux : CASINO_LIVE2). */
function casino_draw_pb(string $g): array { return CASINO_DRAW[$g] ?? CASINO_LIVE2[$g] ?? CASINO_LIVE3[$g]; } // v2850 : + CASINO_LIVE3
function casino_live2_odd(float $p): float { return floor(CASINO_EDGE / $p * 100 + 1e-6) / 100; }
/** Choix possibles et leur chance exacte (catwalk : chance du mannequin dans CE tour, lue dans le résultat ; sans résultat 1/6). */
function casino_live2_probs(string $g, array $out = []): array {
  if ($g === 'catwalk') { $p = []; for ($m = 0; $m < 6; $m++) $p[(string) $m] = isset($out['w'][$m]) ? $out['w'][$m] / 100 : 1 / 6; return $p; }
  if ($g === 'fleets') {
    $p = ['g' => 0.5, 'v' => 0.5]; $c = [1, 5, 10, 10, 5, 1];
    for ($k = 0; $k <= 5; $k++) $p['s' . $k] = $c[$k] / 32;
    return $p;
  }
  if ($g === 'gemcount') return ['1' => 0.25, '2' => 0.25, '3' => 0.25, '4' => 0.25, 'odd' => 0.5, 'even' => 0.5];
  $p = []; foreach (CASINO_CLAW_W as $i => $w) $p[(string) $i] = $w / 100; return $p; // claw
}
/** Cotes affichées (catwalk : celles du tour, tirées avec lui). */
function casino_live2_odds(string $g, array $out = []): array {
  if ($g === 'catwalk' && isset($out['o'])) { $o = []; foreach ($out['o'] as $m => $v) $o[(string) $m] = (float) $v; return $o; }
  return array_map('casino_live2_odd', casino_live2_probs($g, $out));
}
/** La sélection gagne-t-elle avec ce résultat ? */
function casino_live2_hit(string $g, string $sel, array $out): bool {
  $n = (int) ($out['n'] ?? -1);
  if ($g === 'fleets') return $sel === 'g' ? $n >= 3 : ($sel === 'v' ? $n <= 2 : $sel === 's' . $n);
  if ($g === 'gemcount') return $sel === 'odd' ? $n % 2 === 1 : ($sel === 'even' ? $n % 2 === 0 : (int) $sel === $n);
  return (int) $sel === $n;
}
function casino_live2_pick(array $w): int { $r = random_int(1, (int) array_sum($w)); $acc = 0; foreach ($w as $i => $x) { $acc += $x; if ($r <= $acc) return (int) $i; } return 0; }
/** Tirage d'un tour (appelé une fois, sous le verrou de draw-<jeu>.json). */
function casino_live2_draw(string $g): array {
  if ($g === 'catwalk') {
    $rank = [0, 1, 2, 3, 4, 5]; for ($i = 5; $i > 0; $i--) { $j = random_int(0, $i); [$rank[$i], $rank[$j]] = [$rank[$j], $rank[$i]]; } // rang de chaque mannequin
    $w = []; $o = []; foreach ($rank as $m => $r) { $w[$m] = CASINO_CATWALK_W[$r]; $o[$m] = casino_live2_odd(CASINO_CATWALK_W[$r] / 100); }
    $n = casino_live2_pick($w);
    $q = [0, 1, 2, 3, 4, 5]; for ($i = 5; $i > 0; $i--) { $j = random_int(0, $i); [$q[$i], $q[$j]] = [$q[$j], $q[$i]]; } // ordre de passage
    // notes des 3 juges (×10 : 72 = 7,2) ; la gagnante a le meilleur total, strictement
    $s = []; for ($m = 0; $m < 6; $m++) $s[$m] = [random_int(72, 96), random_int(72, 96), random_int(72, 96)];
    $tot = static fn(array $a) => $a[0] + $a[1] + $a[2];
    $best = 0; for ($m = 1; $m < 6; $m++) if ($tot($s[$m]) > $tot($s[$best])) $best = $m;
    if ($best !== $n) [$s[$n], $s[$best]] = [$s[$best], $s[$n]];
    $mx = 0; for ($m = 0; $m < 6; $m++) if ($m !== $n) $mx = max($mx, $tot($s[$m]));
    while ($tot($s[$n]) <= $mx) { $j = array_search(min($s[$n]), $s[$n], true); $s[$n][$j]++; }
    return ['n' => $n, 'w' => $w, 'o' => $o, 'q' => $q, 's' => $s];
  }
  if ($g === 'fleets') { $h = []; for ($k = 0; $k < 5; $k++) $h[] = random_int(0, 1); return ['n' => array_sum($h), 'h' => $h]; } // 1 = l'Or touche
  if ($g === 'gemcount') { $k = random_int(32, 63); return ['n' => ($k - 1) % 4 + 1, 'k' => $k]; }
  $n = casino_live2_pick(CASINO_CLAW_W); $d = random_int(0, 4); if ($d >= $n) $d++; // claw : 1er essai raté sur un autre lot ($d)
  return ['n' => $n, 'd' => $d];
}
/* v2807 (propriétaire) — LUCKY PLANETS (jeu en direct) : toutes les 40 s une comète choisit UNE des 6 planètes, la même pour
 * tout le monde. Chances fixes (sur 100) : Lune 32 · Mars 24 · Terre 18 · Neptune 13 · Saturne 9 · Soleil 4 ;
 * cote = 0,94 ÷ chance (arrondie vers le bas) → marge maison 6 % quel que soit le choix (×2,93 … ×23,50). */
const CASINO_PLANETS_W = [32, 24, 18, 13, 9, 4];
function casino_planets_odds(): array { return array_map(static fn($w) => floor(CASINO_EDGE * 100 / $w * 100 + 1e-6) / 100, CASINO_PLANETS_W); }
function casino_planets_draw(): int { $r = random_int(1, 100); $acc = 0; foreach (CASINO_PLANETS_W as $i => $w) { $acc += $w; if ($r <= $acc) return $i; } return 0; }
/*
 * v2792 (propriétaire, comme les courses virtuelles des grands sites) — RACING devient EN DIRECT (10 voitures) et HORSE RACE
 * reçoit des COTES : à chaque tour, chaque coureur a sa chance p (favoris → outsiders), tirée par le serveur et montrée
 * AVANT la fermeture des mises ; sa cote = 0,94 ÷ p (arrondie vers le bas) → marge maison 6 % quel que soit le choix.
 * L'arrivée suit ces chances (le 1er tiré selon p, puis le 2e parmi les autres, etc.) et reste SECRÈTE jusqu'à la fermeture.
 * Chevaux : « Gagnant » (1 cheval, sa cote) ou « Couplé » (2 chevaux = les 2 premiers, dans n'importe quel ordre, sa cote).
 */
const CASINO_RUNNERS = 10;
const CASINO_ODDS_MAX = 500.0;
/** Chances des 10 coureurs d'un tour : de ~3 % (outsider) à ~30 % (favori), total 1. */
function casino_runner_probs(): array {
  $w = [];
  for ($i = 0; $i < CASINO_RUNNERS; $i++) { $g = sqrt(-2 * log(casino_rand())) * cos(2 * M_PI * casino_rand()); $w[] = exp(0.6 * $g); }
  for ($k = 0; $k < 8; $k++) { $t = array_sum($w); foreach ($w as $i => $v) $w[$i] = max(0.03, min(0.30, $v / $t)); }
  $t = array_sum($w);
  return array_map(static fn($v) => round($v / $t, 6), $w);
}
/** Cote affichée et payée pour une chance $p (marge 6 %). */
function casino_odds(float $p): float { return $p <= 0 ? 0.0 : min(CASINO_ODDS_MAX, max(1.01, floor(CASINO_EDGE / $p * 100) / 100)); }
/** Arrivée complète tirée selon les chances (1er selon p, puis le suivant parmi ceux qui restent). */
function casino_runner_order(array $p): array {
  $left = array_keys($p); $order = [];
  while ($left) {
    $tot = 0.0; foreach ($left as $i) $tot += $p[$i];
    $r = random_int(1, 1000000000) / 1000000000 * $tot; $acc = 0.0; $pick = end($left);
    foreach ($left as $i) { $acc += $p[$i]; if ($r <= $acc) { $pick = $i; break; } }
    $order[] = $pick; $left = array_values(array_diff($left, [$pick]));
  }
  return $order;
}
/** Couplé : chance que $a et $b finissent 1er et 2e (n'importe quel ordre). */
function casino_pair_p(array $p, int $a, int $b): float { return $p[$a] * $p[$b] / max(1e-9, 1 - $p[$a]) + $p[$b] * $p[$a] / max(1e-9, 1 - $p[$b]); }
/** Carte des cotes d'un tour : 'o' = gagnant par coureur ; chevaux : 'c' = couplé « a-b » (a < b). */
function casino_runner_card(string $g, array $p): array {
  $c = ['p' => $p, 'o' => array_map('casino_odds', $p)];
  if ($g === 'horses') { $c['c'] = []; for ($a = 0; $a < CASINO_RUNNERS; $a++) for ($b = $a + 1; $b < CASINO_RUNNERS; $b++) $c['c'][$a . '-' . $b] = casino_odds(casino_pair_p($p, $a, $b)); }
  return $c;
}
const CASINO_CRYPTOX_N = 15;
const CASINO_CRYPTOX_MULT = 14.4; // v2781 : jeu où la chance se voit → gain des grands sites (retour 96 %)
const CASINO_HORSES_N = 10;
const CASINO_HORSES_MULT = 9.6;   // v2781 : jeu où la chance se voit → retour 96 %
// v2695 (propriétaire, comme Evoplay) : Penalty en série de 8 tirs ; chaque but ×1,5 (×1,44 → ×24,60), on encaisse quand on veut.
// Le gardien couvre 1 zone sur 3 à chaque tir (tiré par le serveur) : retour aux joueurs 96 % quel que soit le moment où l'on encaisse.
const CASINO_PEN_ROWS = 8;
const CASINO_TOWER_ROWS = 8;  // La Tour : 8 étages, 3 portes, 1 piège → ×1,45 par étage environ
const CASINO_BALLOON_POP = 0.10; // Ballon : 10 % de risque d'éclater à chaque souffle
/** La Tour : multiplicateur après $k étages (2 chances sur 3 à chaque étage). */
function casino_tower_mult(int $k): float { return $k < 1 ? 0.0 : floor(CASINO_EDGE / pow(2 / 3, $k) * 100) / 100; }
/** Ballon : multiplicateur après $k souffles réussis. */
function casino_balloon_mult(int $k): float { return $k < 1 ? 0.0 : floor(CASINO_EDGE / pow(1 - CASINO_BALLOON_POP, $k) * 100) / 100; }
/** Baccara : valeur d'une carte (1 à 13) → points (10, V, D, R = 0). */
function casino_bac_v(int $c): int { return $c >= 10 ? 0 : $c; }
/** Baccara : vraie règle de tirage (3e carte). Retour : [cartes joueur, cartes banque, total joueur, total banque]. */
function casino_baccarat_deal(): array {
  $d = static fn() => random_int(1, 13);
  $p = [$d(), $d()]; $b = [$d(), $d()];
  $tp = (casino_bac_v($p[0]) + casino_bac_v($p[1])) % 10; $tb = (casino_bac_v($b[0]) + casino_bac_v($b[1])) % 10;
  if ($tp < 8 && $tb < 8) {
    $p3 = null;
    if ($tp <= 5) { $p3 = $d(); $p[] = $p3; $tp = ($tp + casino_bac_v($p3)) % 10; }
    if ($p3 === null) { if ($tb <= 5) { $b[] = $d(); $tb = ($tb + casino_bac_v(end($b))) % 10; } }
    else {
      $v = casino_bac_v($p3); $draw = false;
      if ($tb <= 2) $draw = true;
      elseif ($tb === 3) $draw = $v !== 8;
      elseif ($tb === 4) $draw = $v >= 2 && $v <= 7;
      elseif ($tb === 5) $draw = $v >= 4 && $v <= 7;
      elseif ($tb === 6) $draw = $v === 6 || $v === 7;
      if ($draw) { $b[] = $d(); $tb = ($tb + casino_bac_v(end($b))) % 10; }
    }
  }
  return [$p, $b, $tp, $tb];
}
const CASINO_CRASH = ['crash', 'jet', 'rocket'];                          // v2691 : 3 jeux « ça monte » (même calcul, décor différent)
const CASINO_APPLE_ROWS = 10;                                             // Pomme de la fortune : 10 étages, 5 pommes, 1 pourrie
function casino_is_crash(string $g): bool { return in_array($g, CASINO_CRASH, true); }
/*
 * v2701 (propriétaire, comme Aviator) — TOUR COMMUN pour Sky Rush / Jet Man / Rocket : tout le monde voit le même vol.
 * Un fichier par jeu (data/casino/round-<jeu>.json) : n° du tour, départ (t0), point d'explosion (secret jusqu'à l'explosion),
 * fin du tour, et le point du tour SUIVANT (secret). ~7 s pour miser, puis le vol, puis 3 s d'affichage du résultat.
 * Le point d'explosion suit la même loi qu'avant (casino_crash_point) : retour joueurs 97 %, rien ne change pour l'argent.
 */
const CASINO_ROUND_BET = 5.0;   // secondes pour miser avant le départ (v2730 : 5 s au lieu de 7, on voit voler plus vite)
const CASINO_ROUND_SHOW = 3.0;  // secondes d'affichage après l'explosion
function casino_crash_secs(float $c): float { return $c <= 1.0 ? 0.0 : log($c) / 0.08 + 0.05; }
function casino_round_file(string $game): string { return casino_dir() . DIRECTORY_SEPARATOR . 'round-' . preg_replace('/[^a-z]/', '', $game) . '.json'; }
/** Fait avancer le tour commun jusqu'à maintenant (dans le fichier verrouillé). */
function casino_round_advance(array &$r, float $now): void {
  if (empty($r['i']) || $now - (float) ($r['end'] ?? 0) > 3600) {
    $r = ['i' => (int) ($r['i'] ?? 0) + 1, 't0' => $now + CASINO_ROUND_BET, 'c' => casino_crash_point(), 'nc' => casino_crash_point()];
    $r['end'] = $r['t0'] + casino_crash_secs((float) $r['c']) + CASINO_ROUND_SHOW;
    return;
  }
  while ($now >= (float) $r['end']) {
    $t0 = (float) $r['end'] + CASINO_ROUND_BET;
    $h = array_slice(array_merge([(float) $r['c']], (array) ($r['h'] ?? [])), 0, 24); // v2795 : derniers points d'explosion (bandeau d'historique)
    $r = ['i' => (int) $r['i'] + 1, 't0' => $t0, 'c' => (float) $r['nc'], 'nc' => casino_crash_point(), 'h' => $h];
    $r['end'] = $t0 + casino_crash_secs((float) $r['c']) + CASINO_ROUND_SHOW;
  }
}
/** Le tour sur lequel une mise posée MAINTENANT va jouer : ce tour s'il n'a pas décollé, sinon le suivant. */
function casino_round_slot(string $game, float $now): array {
  return casino_with(casino_round_file($game), static function (array &$r) use ($now) {
    casino_round_advance($r, $now);
    if ($now < (float) $r['t0']) return ['i' => (int) $r['i'], 't0' => (float) $r['t0'], 'c' => (float) $r['c']];
    return ['i' => (int) $r['i'] + 1, 't0' => (float) $r['end'] + CASINO_ROUND_BET, 'c' => (float) $r['nc']];
  }) ?: [];
}
/** Ce que tout le monde voit du tour commun (le point d'explosion n'apparaît QU'APRÈS l'explosion). */
function casino_round_public(string $game, float $now): array {
  $r = casino_with(casino_round_file($game), static function (array &$r) use ($now) { casino_round_advance($r, $now); return $r; }) ?: [];
  if (!$r) return [];
  $crashAt = (float) $r['t0'] + casino_crash_secs((float) $r['c']);
  $phase = $now < (float) $r['t0'] ? 'bet' : ($now < $crashAt ? 'fly' : 'end');
  $o = ['i' => (int) $r['i'], 't0' => (float) $r['t0'], 'phase' => $phase, 'next' => (float) $r['end'] + CASINO_ROUND_BET, 'bet' => CASINO_ROUND_BET, 'h' => array_values((array) ($r['h'] ?? []))]; // v2795 : historique public (tours finis)
  if ($phase === 'end') $o['c'] = (float) $r['c'];
  return $o;
}
/** Pomme de la fortune : multiplicateur après $k étages réussis (1 pomme pourrie sur 5 → 80 % de chances par étage). */
function casino_apple_mult(int $k, int $lv = 1): float { $p = (5 - max(1, min(4, $lv))) / 5; return $k < 1 ? 0.0 : floor(CASINO_EDGE / pow($p, $k) * 100) / 100; }
/** Verger : pommes pourries d'un étage (liste ; ancien format = un seul nombre). */
function casino_apple_bad(array $g, int $row): array { $b = $g['bad'][$row] ?? []; return is_array($b) ? array_map('intval', $b) : [(int) $b]; }

// Tables publiques (affichées telles quelles par le navigateur).
// v2690b — roue casino : 24 cases [multiplicateur, chances sur 1000] ; chaque case est DESSINÉE à la taille de sa chance
// (honnête : le ×50 est une toute petite case). Retour aux joueurs 94,6 %.
// v2691 (propriétaire : « trop de zéros ») : 21 cases [multiplicateur, chances sur 10 000], ×0,5 = moitié rendue.
// Zéro 25 %, moitié rendue 32 %, gain 43 %. Retour aux joueurs 95 %.
// v2780 (propriétaire, marge 6 %) : cases ×0,5 un peu plus petites, cases ×0 un peu plus grandes → retour 94 %.
const CASINO_WHEEL = [[0.5, 600], [1.2, 500], [0, 680], [1.5, 550], [0.5, 600], [2, 325], [0, 680], [1.2, 500], [0.5, 600], [3, 350], [0, 681], [1.2, 500], [0.5, 600], [5, 120], [1.5, 550], [0, 681], [0.5, 600], [1.2, 500], [2, 325], [10, 50], [50, 8]];
const CASINO_PLINKO = [12, 3, 1.4, 0.6, 0.33, 0.6, 1.4, 3, 12];                                     // 8 rangées, retour 94 % (v2780)
const CASINO_KENO = [0, 0.6, 3.37, 25];                                                              // 3 numéros choisis sur 20, 5 tirés : retour 94 % (v2780)
const CASINO_RACE_MULT = 5.7;                                                                         // 6 voitures : retour 95 % (v2781 : chance visible)
// v2791 (propriétaire) : ORO LOTTO remplace Pierre-Feuille-Ciseaux — loterie comme les grands sites : le joueur choisit 1 à 10
// numéros sur 40, le serveur tire 10 boules. CASINO_LOTTO[k][h] = gain ÷ mise pour h bons numéros sur k choisis.
// Chaque ligne est calculée (loi hypergéométrique) pour un retour aux joueurs de 93,8 à 94 % : marge maison 6 %, comme les autres jeux.
const CASINO_LOTTO_N = 40;
const CASINO_LOTTO_DRAW = 10;
const CASINO_LOTTO = [
  1 => [0, 3.76], 2 => [0, 1.45, 6.61], 3 => [0, 0, 4.25, 29.5], 4 => [0, 0, 2.07, 8.03, 78],
  5 => [0, 0, 0, 5.92, 32.1, 422], 6 => [0, 0, 0, 3.24, 12.3, 90.8, 1000], 7 => [0, 0, 0, 2.07, 6.09, 31.4, 309, 1000],
  8 => [0, 0, 0, 0, 5.56, 22.1, 153, 1000, 1000], 9 => [0, 0, 0, 0, 3.39, 10.9, 58.4, 546, 1000, 1000],
  10 => [0, 0, 0, 0, 2.35, 6.36, 27.5, 198, 1000, 1000, 1000],
];
const CASINO_RPS_MULT = 1.91;                                                                         // Pierre-Feuille-Ciseaux (égalité = mise rendue) : retour 97 % (v2781 : chance visible)
const CASINO_DICE_DUEL = 1.92;                                                                         // dé rouge contre dé noir (égalité = mise rendue) : retour 96,7 % (v2781 : chance visible)
const CASINO_COIN_MULT = 1.94;                                                                        // retour 97 % (v2781 : chance visible)
const CASINO_PENALTY_MULT = 1.44;                                                                     // 3 zones, le gardien en couvre 1 : retour 96 % (v2781 : chance visible)
const CASINO_EDGE = 0.94;                                                                             // v2780 (propriétaire) : marge 6 % — limbo, avion, jet, fusée, mines, hi-lo, tour, ballon, verger
// Machine à sous : [catégorie, multiplicateur, chances sur 1000] — retour 94 % (v2780)
const CASINO_SLOTS = [['gem', 50, 1], ['seven', 20, 4], ['bell', 10, 10], ['lemon', 5, 30], ['cherry3', 3, 60], ['cherry2', 1.5, 253]];
// Grattage : [multiplicateur, chances sur 1000] — retour 94 % (v2780)
const CASINO_SCRATCH = [[20, 10], [5, 40], [2, 120], [1, 300]];
// v2694 — Fléchettes : [multiplicateur, chances sur 10 000] — centre ×20, anneaux ×5 / ×2 / ×1, bord ×0 : retour 95 %
const CASINO_DARTS = [[20, 100], [5, 400], [2, 1500], [1, 2400], [0, 5600]]; // v2780 : retour 94 %

function casino_money(float $v): float { return round($v + 1e-9, 2); }
/** v2810 (audit argent) — GAIN versé au joueur : mise × multiplicateur, plafonné, arrondi VERS LE BAS au centime.
 *  Jamais au centime le plus proche : sur les petites mises l'arrondi au plus proche effaçait la marge maison
 *  (Banque du baccara à 0,10 $ : 0,195 → 0,20 = retour 101 %). Les remboursements (égalité, annulation) restent exacts. */
function casino_win(float $stake, float $mult): float {
  $v = min(CASINO_MAX_WIN, $stake * $mult);
  return $v > 0 ? floor($v * 100 + 1e-6) / 100 : 0.0;
}
/** v2810 — jeux retirés du site : plus jouables même par l'API (Pierre-Feuille-Ciseaux, remplacé par Oro Lotto). */
const CASINO_RETIRED = ['rps'];
const CASINO_ROULETTE_RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
/** Roulette européenne (37 cases) : gain ÷ mise pour la mise $bet si la bille tombe sur $n ; null = mise invalide.
 *  v2781 (propriétaire) : gains des grands sites — rouge / noir / pair / impair ×2 · douzaine ×3 · numéro ×36 (retour 97,3 %). */
function casino_roulette_mult(string $bet, int $n): ?float {
  $red = in_array($n, CASINO_ROULETTE_RED, true);
  if ($bet === 'red') return ($n > 0 && $red) ? 2.0 : 0.0;
  if ($bet === 'black') return ($n > 0 && !$red) ? 2.0 : 0.0;
  if ($bet === 'even') return ($n > 0 && $n % 2 === 0) ? 2.0 : 0.0;
  if ($bet === 'odd') return ($n % 2 === 1) ? 2.0 : 0.0;
  if (preg_match('/^d([123])$/', $bet, $mm)) { $d = (int) $mm[1]; return ($n >= ($d - 1) * 12 + 1 && $n <= $d * 12) ? 3.0 : 0.0; }
  if (preg_match('/^n(\d{1,2})$/', $bet, $mm) && (int) $mm[1] <= 36) return $n === (int) $mm[1] ? 36.0 : 0.0;
  return null;
}

/* ---------------------------------------------------------------- v2718 : tirages en direct */
function casino_is_draw(string $g): bool { return isset(CASINO_DRAW[$g]) || isset(CASINO_LIVE2[$g]) || isset(CASINO_LIVE3[$g]); } // v2830 : + CASINO_LIVE2 ; v2850 : + CASINO_LIVE3
/** Résultat secret du tour $i (tiré une seule fois, sous verrou ; on garde les 60 derniers).
 *  v2810 : un tour PLUS ANCIEN que ceux gardés n'est jamais re-tiré (il rendrait un autre résultat que celui montré) :
 *  on renvoie [] — le pari garde de toute façon son propre résultat (casino_draw_act), voir casino_draw_settle. */
function casino_draw_outcome(string $g, int $i): array { return casino_draw_many($g, [$i])[$i] ?? []; }
/** v2811 — plusieurs tours d'un coup, sous UN SEUL verrou (casino-tour.php : 1 ouverture de fichier au lieu de 7). Même règle. */
function casino_draw_many(string $g, array $ids): array {
  return casino_with(casino_dir() . DIRECTORY_SEPARATOR . 'draw-' . $g . '.json', static function (array &$s) use ($g, $ids) {
    $res = [];
    foreach ($ids as $i) {
      $i = (int) $i; $k = (string) $i;
      if (!isset($s[$k])) {
        if (count($s) >= 60 && $i < min(array_map('intval', array_keys($s)))) { $res[$i] = []; continue; }
        if ($g === 'cryptox') $s[$k] = ['n' => random_int(0, CASINO_CRYPTOX_N - 1)];
        elseif ($g === 'planets') $s[$k] = ['n' => casino_planets_draw()];
        elseif (isset(CASINO_LIVE2[$g])) $s[$k] = casino_live2_draw($g); // v2830
        elseif (isset(CASINO_LIVE3[$g])) $s[$k] = casino_live3_draw($g); // v2850
        elseif ($g === 'horses' || $g === 'race') { $pr = casino_runner_probs(); $s[$k] = casino_runner_card($g, $pr) + ['order' => casino_runner_order($pr)]; }
        else $s[$k] = ['n' => random_int(0, 36)];
        if (count($s) > 60) { $ks = array_map('intval', array_keys($s)); sort($ks); foreach (array_slice($ks, 0, count($ks) - 60) as $old) unset($s[(string) $old]); }
      }
      $res[$i] = $s[$k] ?? [];
    }
    return $res;
  }) ?: [];
}
/** v2810 — ce qu'un pari garde du résultat de son tour pour être réglé même si le tour a quitté l'historique (60 tours) :
 *  le résultat sans les chances ('p') ; pour un couplé, seulement la cote de SA paire. Gardé côté serveur, jamais montré avant la fin. */
function casino_draw_keep(string $sel, array $out): array {
  $c = $out['c'] ?? null;
  unset($out['p'], $out['c']);
  if (is_array($c) && preg_match('/^c(\d)-(\d)$/', $sel, $mm) && isset($c[$mm[1] . '-' . $mm[2]])) $out['c'] = [$mm[1] . '-' . $mm[2] => $c[$mm[1] . '-' . $mm[2]]];
  return $out;
}
/** Gain ÷ mise d'une sélection pour un résultat ; null = sélection invalide. Sans résultat ($out vide) : vérifie seulement la sélection. */
function casino_draw_mult(string $g, string $sel, array $out): ?float {
  if (isset(CASINO_LIVE2[$g])) { $od = casino_live2_odds($g, $out); if (!isset($od[$sel])) return null; return $out ? (casino_live2_hit($g, $sel, $out) ? (float) $od[$sel] : 0.0) : 0.0; } // v2830
  if (isset(CASINO_LIVE3[$g])) { $od = casino_live3_odds($g, $out); if (!isset($od[$sel])) return null; return $out ? (casino_live3_hit($g, $sel, $out) ? (float) $od[$sel] : 0.0) : 0.0; } // v2850
  if ($g === 'cryptox') { if (!preg_match('/^\d{1,2}$/', $sel) || (int) $sel >= CASINO_CRYPTOX_N) return null; return $out ? ((int) $sel === (int) $out['n'] ? CASINO_CRYPTOX_MULT : 0.0) : 0.0; }
  if ($g === 'planets') { if (!preg_match('/^[0-5]$/', $sel)) return null; return $out ? ((int) $sel === (int) $out['n'] ? (float) casino_planets_odds()[(int) $sel] : 0.0) : 0.0; }
  if ($g === 'race') { if (!preg_match('/^\d$/', $sel)) return null; return $out ? ((int) $sel === (int) $out['order'][0] ? (float) ($out['o'][(int) $sel] ?? 0) : 0.0) : 0.0; }
  if ($g === 'horses') {
    // ancien format (pari posé avant v2792, tour sans cotes) : « 3 » = cheval gagnant ×9,6
    if (preg_match('/^\d$/', $sel)) return $out ? ((int) $sel === (int) $out['order'][0] ? (isset($out['o']) ? (float) $out['o'][(int) $sel] : CASINO_HORSES_MULT) : 0.0) : 0.0;
    if (preg_match('/^w(\d)$/', $sel, $mm)) return $out ? ((int) $mm[1] === (int) $out['order'][0] ? (float) ($out['o'][(int) $mm[1]] ?? 0) : 0.0) : 0.0;
    if (preg_match('/^c(\d)-(\d)$/', $sel, $mm) && (int) $mm[1] < (int) $mm[2]) {
      if (!$out) return 0.0;
      $top = [(int) $out['order'][0], (int) $out['order'][1]]; sort($top);
      return $top === [(int) $mm[1], (int) $mm[2]] ? (float) ($out['c'][$mm[1] . '-' . $mm[2]] ?? 0) : 0.0;
    }
    return null;
  }
  $m = casino_roulette_mult($sel, $out ? (int) $out['n'] : 0);
  return $m === null ? null : ($out ? $m : 0.0);
}
/** Ce que tout le monde voit : n° du tour, horaires, phase ; le résultat SEULEMENT après la fermeture des mises ; 6 derniers résultats. */
function casino_draw_public(string $g, float $now): array {
  [$P, $B] = casino_draw_pb($g);
  $i = casino_draw_i($g, $now); $t0 = casino_draw_start($g, $i);
  $o = ['i' => $i, 't0' => (float) $t0, 'close' => (float) ($t0 + $B), 'end' => (float) ($t0 + $P), 'phase' => $now < $t0 + $B ? 'bet' : 'show', 'P' => $P, 'B' => $B];
  // v2811 : le tour en cours et les 6 précédents lus sous un seul verrou (le résultat en cours est tiré ici s'il ne l'est pas encore : même chose qu'avant)
  $all = casino_draw_many($g, [$i, $i - 1, $i - 2, $i - 3, $i - 4, $i - 5, $i - 6]);
  $cur = $all[$i] ?? [];
  if (($g === 'horses' || $g === 'race') && isset($cur['o'])) { $o['odds'] = $cur['o']; if (isset($cur['c'])) $o['pair'] = $cur['c']; } // v2792 : cotes visibles, arrivée secrète
  if ($g === 'planets') $o['odds'] = casino_planets_odds();
  if (isset(CASINO_LIVE2[$g])) $o['odds'] = casino_live2_odds($g, $cur); // v2830 : catwalk = cotes de CE tour (gagnante secrète)
  if (isset(CASINO_LIVE3[$g])) { $o['odds'] = casino_live3_odds($g, $cur); if ($pre = casino_live3_pre($g, $cur)) $o['pre'] = $pre; } // v2850 : High-Low = carte de base visible
  if ($now >= $t0 + $B) { $o['res'] = $cur; unset($o['res']['p'], $o['res']['c']); }
  $last = [];
  for ($k = 1; $k <= 6; $k++) { $r = $all[$i - $k] ?? []; $last[] = isset($r['order']) ? (int) $r['order'][0] : (int) ($r['n'] ?? 0); }
  $o['last'] = $last;
  return $o;
}
function casino_rand(): float { return random_int(1, 1000000) / 1000000; } // ]0 ; 1]

function casino_dir(string $sub = ''): string {
  $d = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'casino' . ($sub !== '' ? DIRECTORY_SEPARATOR . $sub : '');
  if (!is_dir($d)) @mkdir($d, 0750, true);
  return $d;
}
function casino_with(string $file, callable $fn) {
  $fp = @fopen($file, 'c+');
  if (!$fp) return null;
  flock($fp, LOCK_EX);
  $st = json_decode(stream_get_contents($fp) ?: '', true);
  if (!is_array($st)) $st = [];
  $before = $st;
  $res = $fn($st);
  if ($st !== $before) { rewind($fp); ftruncate($fp, 0); fwrite($fp, json_encode($st, JSON_UNESCAPED_UNICODE)); fflush($fp); }
  flock($fp, LOCK_UN);
  fclose($fp);
  return $res;
}
function casino_user_file(string $uid): string { return casino_dir('u') . DIRECTORY_SEPARATOR . hash('sha256', 'cs|' . $uid) . '.json'; }
/** v2810 — VERROU PAR JOUEUR autour de « vérifier → retirer la mise → enregistrer la partie » : deux départs (ou deux paris)
 *  envoyés en même temps ne retirent jamais deux mises. Le 2e attend le 1er (1 s au plus) puis voit la partie déjà posée
 *  (reprise / « déjà ») ; s'il n'obtient pas le verrou : « busy », RIEN retiré. Fichier à part (pas le fichier du joueur,
 *  qui est verrouillé à chaque lecture par casino_with). */
const CASINO_USER_LOCK_WAIT = 1.0;
function casino_user_lock(string $uid, callable $fn) {
  $fp = @fopen(casino_user_file($uid) . '.lock', 'c');
  if (!$fp) return ['ok' => false, 'reason' => 'busy'];
  $end = microtime(true) + CASINO_USER_LOCK_WAIT; $got = false;
  while (true) {
    if (flock($fp, LOCK_EX | LOCK_NB)) { $got = true; break; }
    if (microtime(true) >= $end) break;
    usleep(25000);
  }
  if (!$got) { fclose($fp); return ['ok' => false, 'reason' => 'busy']; }
  try { return $fn(); } finally { flock($fp, LOCK_UN); fclose($fp); }
}

/* ---------------------------------------------------------------- tirages (purs, testables) */

/** Résultat d'un jeu instantané : ['mult' => gain ÷ mise, 'view' => ce que le navigateur dessine] ou ['err' => …]. */
function casino_instant(string $game, array $p, float $stake): array {
  switch ($game) {
    case 'coin':
      $side = ((int) ($p['side'] ?? 0)) === 1 ? 1 : 0;
      $r = random_int(0, 1);
      return ['mult' => $r === $side ? CASINO_COIN_MULT : 0.0, 'view' => ['r' => $r]];
    case 'dice':
      // v2724 (propriétaire) : DUEL de dés — dé rouge contre dé noir, le plus grand gagne ×1,92 ; égalité = mise rendue (retour 96,7 %)
      if ((string) ($p['duel'] ?? '') !== '') {
        $side = $p['duel'] === 'black' ? 'black' : 'red';
        $dr = random_int(1, 6); $db2 = random_int(1, 6);
        $m = $dr === $db2 ? 1.0 : (($side === 'red') === ($dr > $db2) ? CASINO_DICE_DUEL : 0.0);
        return ['mult' => $m, 'view' => ['r' => $dr, 'b' => $db2, 'side' => $side]];
      }
      $c = max(2, min(95, (int) ($p['chance'] ?? 50)));
      $over = !empty($p['over']);
      $roll = random_int(0, 9999) / 100; // 0,00 à 99,99
      $win = $over ? $roll >= 100 - $c : $roll < $c;
      return ['mult' => $win ? floor(CASINO_EDGE * 100 / $c * 10000) / 10000 : 0.0, 'view' => ['roll' => $roll, 'c' => $c, 'over' => $over]];
    case 'limbo':
      $t = round((float) ($p['target'] ?? 2), 2);
      if ($t < 1.01 || $t > 1000) return ['err' => 'param'];
      $res = max(1.0, floor(CASINO_EDGE / casino_rand() * 100) / 100);
      return ['mult' => $res >= $t ? $t : 0.0, 'view' => ['res' => min($res, 1000000.0), 't' => $t]];
    case 'wheel':
      $r = random_int(1, 10000); $acc = 0; $i = 0;
      foreach (CASINO_WHEEL as $j => [$x, $w]) { $acc += $w; if ($r <= $acc) { $i = $j; break; } }
      return ['mult' => (float) CASINO_WHEEL[$i][0], 'view' => ['i' => $i]];
    case 'roulette':
      $bet = (string) ($p['bet'] ?? 'red');
      $n = random_int(0, 36);
      $m = casino_roulette_mult($bet, $n);
      if ($m === null) return ['err' => 'param'];
      return ['mult' => $m, 'view' => ['n' => $n, 'red' => in_array($n, CASINO_ROULETTE_RED, true)]];
    case 'slots':
      $r = random_int(1, 1000); $acc = 0; $cat = 'lose'; $m = 0.0;
      foreach (CASINO_SLOTS as [$k, $x, $w]) { $acc += $w; if ($r <= $acc) { $cat = $k; $m = (float) $x; break; } }
      return ['mult' => $m, 'view' => ['reels' => casino_slot_reels($cat)]];
    case 'plinko':
      $path = []; $k = 0;
      for ($i = 0; $i < 8; $i++) { $b = random_int(0, 1); $path[] = $b; $k += $b; }
      return ['mult' => (float) CASINO_PLINKO[$k], 'view' => ['path' => $path, 'bin' => $k]];
    case 'keno':
      $picks = array_values(array_unique(array_map('intval', (array) ($p['picks'] ?? []))));
      $picks = array_values(array_filter($picks, static fn($x) => $x >= 1 && $x <= 20));
      if (count($picks) !== 3) return ['err' => 'param'];
      $all = range(1, 20);
      for ($i = 19; $i > 0; $i--) { $j = random_int(0, $i); [$all[$i], $all[$j]] = [$all[$j], $all[$i]]; }
      $draw = array_slice($all, 0, 5);
      $hits = count(array_intersect($picks, $draw));
      return ['mult' => (float) CASINO_KENO[$hits], 'view' => ['draw' => $draw, 'hits' => $hits]];
    case 'scratch':
      $r = random_int(1, 1000); $acc = 0; $m = 0.0;
      foreach (CASINO_SCRATCH as [$x, $w]) { $acc += $w; if ($r <= $acc) { $m = (float) $x; break; } }
      return ['mult' => $m, 'view' => ['grid' => casino_scratch_grid($m)]];
    case 'penalty':
      $aim = max(0, min(2, (int) ($p['aim'] ?? 0)));
      $keeper = random_int(0, 2);
      return ['mult' => $keeper !== $aim ? CASINO_PENALTY_MULT : 0.0, 'view' => ['keeper' => $keeper, 'aim' => $aim]];
    case 'colors':
      $bet = (string) ($p['bet'] ?? 'green');
      $n = random_int(0, 9);
      $m = 0.0;
      // v2780 : retour 94 % (vert / rouge ×1,97 · violet ×4,7 · numéro ×9,4)
      if ($bet === 'green') $m = in_array($n, [1, 3, 7, 9], true) ? 1.97 : ($n === 5 ? 1.5 : 0);
      elseif ($bet === 'red') $m = in_array($n, [2, 4, 6, 8], true) ? 1.97 : ($n === 0 ? 1.5 : 0);
      elseif ($bet === 'violet') $m = in_array($n, [0, 5], true) ? 4.7 : 0;
      elseif (preg_match('/^n(\d)$/', $bet, $mm)) $m = $n === (int) $mm[1] ? 9.4 : 0;
      else return ['err' => 'param'];
      return ['mult' => (float) $m, 'view' => ['n' => $n]];
    case 'dragon':
      $bet = (string) ($p['bet'] ?? 'dragon');
      if (!in_array($bet, ['dragon', 'tiger', 'tie'], true)) return ['err' => 'param'];
      $dr = random_int(1, 13); $ti = random_int(1, 13);
      // v2781 : gains des grands sites (Dragon / Tigre ×2 · Égalité ×12)
      if ($bet === 'tie') $m = $dr === $ti ? 12.0 : 0.0;
      elseif ($dr === $ti) $m = 0.5; // égalité : la moitié de la mise est rendue
      else $m = (($bet === 'dragon') === ($dr > $ti)) ? 2.0 : 0.0;
      return ['mult' => $m, 'view' => ['d' => $dr, 't' => $ti]];
    case 'baccarat':
      $bet = (string) ($p['bet'] ?? 'player');
      if (!in_array($bet, ['player', 'banker', 'tie'], true)) return ['err' => 'param'];
      [$pc, $bc, $tp, $tb] = casino_baccarat_deal();
      // v2781 : gains des grands sites (Joueur ×2 · Banque ×1,95 · Égalité ×9)
      if ($tp === $tb) $m = $bet === 'tie' ? 9.0 : 1.0; // égalité : Joueur / Banque remboursés
      elseif ($bet === 'player') $m = $tp > $tb ? 2.0 : 0.0;
      elseif ($bet === 'banker') $m = $tb > $tp ? 1.95 : 0.0;
      else $m = 0.0;
      return ['mult' => $m, 'view' => ['p' => $pc, 'b' => $bc, 'tp' => $tp, 'tb' => $tb]];
    case 'sicbo':
      $bet = (string) ($p['bet'] ?? 'small');
      if (!in_array($bet, ['small', 'big'], true)) return ['err' => 'param'];
      $dice = [random_int(1, 6), random_int(1, 6), random_int(1, 6)];
      $sum = array_sum($dice); $triple = $dice[0] === $dice[1] && $dice[1] === $dice[2];
      $win = !$triple && ($bet === 'small' ? ($sum >= 4 && $sum <= 10) : ($sum >= 11 && $sum <= 17));
      return ['mult' => $win ? 2.0 : 0.0, 'view' => ['dice' => $dice, 'sum' => $sum, 'triple' => $triple]]; // v2781 : ×2 comme les grands sites
    case 'chests':
      $pick = max(0, min(2, (int) ($p['pick'] ?? 0)));
      $gold = random_int(0, 2);
      return ['mult' => $gold === $pick ? 2.85 : 0.0, 'view' => ['gold' => $gold, 'pick' => $pick]]; // v2781 : chance visible (retour 95 %)
    case 'rps':
      // v2738 (propriétaire) : PIERRE-FEUILLE-CISEAUX contre le robot. 0 = pierre, 1 = feuille, 2 = ciseaux.
      // Feuille bat pierre, ciseaux bat feuille, pierre bat ciseaux. Gagné ×1,91 · égalité = mise rendue · perdu = 0.
      $me = max(0, min(2, (int) ($p['pick'] ?? 0)));
      $bot = random_int(0, 2);
      $m = $me === $bot ? 1.0 : (($me - $bot + 3) % 3 === 1 ? CASINO_RPS_MULT : 0.0);
      return ['mult' => $m, 'view' => ['me' => $me, 'bot' => $bot]];
    case 'lotto':
      $picks = array_values(array_unique(array_map('intval', (array) ($p['picks'] ?? []))));
      $picks = array_values(array_filter($picks, static fn($x) => $x >= 1 && $x <= CASINO_LOTTO_N));
      $k = count($picks);
      if ($k < 1 || $k > 10) return ['err' => 'param'];
      $all = range(1, CASINO_LOTTO_N);
      for ($i = CASINO_LOTTO_N - 1; $i > 0; $i--) { $j = random_int(0, $i); [$all[$i], $all[$j]] = [$all[$j], $all[$i]]; }
      $draw = array_slice($all, 0, CASINO_LOTTO_DRAW);
      $hits = count(array_intersect($picks, $draw));
      return ['mult' => (float) CASINO_LOTTO[$k][$hits], 'view' => ['draw' => $draw, 'hits' => $hits, 'k' => $k]];
    case 'darts':
      $r = random_int(1, 10000); $acc = 0; $z = 4;
      foreach (CASINO_DARTS as $j => [$x, $w]) { $acc += $w; if ($r <= $acc) { $z = $j; break; } }
      return ['mult' => (float) CASINO_DARTS[$z][0], 'view' => ['z' => $z, 'a' => random_int(0, 359)]];
  }
  return ['err' => 'game'];
}

function casino_slot_reels(string $cat): array {
  $map = ['gem' => 'gem', 'seven' => 'seven', 'bell' => 'bell', 'lemon' => 'lemon', 'cherry3' => 'cherry'];
  if (isset($map[$cat])) return [$map[$cat], $map[$cat], $map[$cat]];
  $sym = ['gem', 'seven', 'bell', 'lemon', 'cherry', 'star'];
  if ($cat === 'cherry2') {
    $other = ['gem', 'seven', 'bell', 'lemon', 'star'][random_int(0, 4)];
    $r = ['cherry', 'cherry', $other];
    for ($i = 2; $i > 0; $i--) { $j = random_int(0, $i); [$r[$i], $r[$j]] = [$r[$j], $r[$i]]; }
    return $r;
  }
  // perdant : jamais 3 identiques, au plus 1 cerise
  do {
    $r = [$sym[random_int(0, 5)], $sym[random_int(0, 5)], $sym[random_int(0, 5)]];
    $ch = count(array_filter($r, static fn($x) => $x === 'cherry'));
  } while (($r[0] === $r[1] && $r[1] === $r[2]) || $ch >= 2);
  return $r;
}

/** Grille de 9 cases cohérente avec le gain : 3 symboles identiques = le gain ; perdant = jamais 3 identiques. */
function casino_scratch_grid(float $m): array {
  $syms = [20 => 'crown', 5 => 'diamond', 2 => 'star', 1 => 'clover'];
  $pool = ['crown', 'diamond', 'star', 'clover', 'coin', 'heart'];
  $grid = [];
  if ($m > 0) { $win = $syms[(int) $m]; $grid = [$win, $win, $win]; }
  $count = array_count_values($grid);
  while (count($grid) < 9) {
    $s = $pool[random_int(0, 5)];
    if (($count[$s] ?? 0) >= 2) continue; // aucun autre symbole ne fait 3
    $grid[] = $s; $count[$s] = ($count[$s] ?? 0) + 1;
  }
  for ($i = 8; $i > 0; $i--) { $j = random_int(0, $i); [$grid[$i], $grid[$j]] = [$grid[$j], $grid[$i]]; }
  return $grid;
}

/** Avion : multiplicateur affiché après $s secondes de vol. */
function casino_crash_mult(float $s): float { return max(1.0, floor(exp(0.08 * max(0.0, $s)) * 100) / 100); }
/** Avion : point d'explosion (même loi que le limbo : P(≥ x) = 0,97 / x), plafonné à 1 000. */
function casino_crash_point(): float { return min(1000.0, max(1.0, floor(CASINO_EDGE / casino_rand() * 100) / 100)); }
/** Mines : multiplicateur après $k cases sûres avec $m mines sur 25. */
function casino_mines_mult(int $m, int $k): float {
  $x = CASINO_EDGE;
  if ($k > 25 - $m) return 0.0; // v2795 : plus aucune case sûre (« suivante » après la dernière) : jamais de division par zéro
  for ($j = 0; $j < $k; $j++) $x *= (25 - $j) / (25 - $m - $j);
  return floor($x * 100) / 100;
}
/** Penalty : multiplicateur après $k buts. */
/** v2811 — le gardien du Penalty (9 zones) : [sa colonne, but ?, hauteur de son plongeon].
 *  $kc / $kr = tirage imposé (test exact) ; null = tirage au hasard du serveur (random_int). Colonne 1 chance sur 3 → but 2/3. */
function casino_pen_keeper(int $aim, int $hgt, ?int $kc = null, ?int $kr = null): array {
  $keeper = $kc ?? random_int(0, 2);
  $goal = $keeper !== $aim;
  $krow = $goal ? ($kr ?? random_int(0, 2)) : $hgt; // sur le ballon s'il a pris la bonne colonne, ailleurs sinon (dessin)
  return [$keeper, $goal, $krow];
}
function casino_pen_mult(int $k): float { return $k < 1 ? 0.0 : floor(0.96 * pow(1.5, $k) * 100 + 1e-6) / 100; } // v2781 : chance visible (retour 96 %)
/** Hi-Lo : multiplicateur pour « plus haut ou égal » / « plus bas ou égal » à la carte $a (1 à 13). */
function casino_hilo_mult(int $a, bool $hi): float {
  $p = $hi ? (14 - $a) / 13 : $a / 13;
  return floor(CASINO_EDGE / $p * 100) / 100;
}

/* ---------------------------------------------------------------- argent */

function casino_payid(array $db, string $uid): string {
  return function_exists('orolado_aff_pay_uuid') ? orolado_aff_pay_uuid($db, $uid) : '';
}

/** Retire la mise. Réel : base (une seule fois par référence) ; démo : coffre démo. */
function casino_debit(array $db, string $uid, string $mode, float $stake, string $ref): array {
  if ($mode === 'try') return ['ok' => true];
  if ($mode === 'demo') {
    return with_db_lock(static function ($box) use ($uid, $stake) {
      if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
      $bal = orolado_money($box->db['vault'][$uid]['demo'] ?? 0);
      if ($stake > $bal + 0.009) return ['ok' => false, 'reason' => 'insufficient', 'skip_write' => true];
      $box->db['vault'][$uid]['demo'] = orolado_money($bal - $stake);
      return ['ok' => true, 'demo' => $box->db['vault'][$uid]['demo']];
    }) ?: ['ok' => false, 'reason' => 'busy'];
  }
  $pay = casino_payid($db, $uid);
  if ($pay === '') return ['ok' => false, 'reason' => 'unavailable'];
  $d = orolado_trade_debit($pay, $ref, $stake);
  if (empty($d['ok'])) return ['ok' => false, 'reason' => ($d['reason'] ?? '') === 'insufficient' ? 'insufficient' : 'unavailable'];
  // Comme un trade : le solde du fichier suit la base, et la mise compte pour « miser ×2 avant retrait ».
  with_db_lock(static function ($box) use ($uid, $d, $stake) {
    if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
    $box->db['vault'][$uid]['real'] = orolado_money($d['real'] ?? 0);
    if (isset($box->db['users'][$uid]) && is_array($box->db['users'][$uid])) {
      $u =& $box->db['users'][$uid];
      $u['realStakeVolume'] = orolado_money(($u['realStakeVolume'] ?? 0) + $stake);
      $u['totalWageredSinceDeposit'] = $u['realStakeVolume'];
      if (function_exists('orolado_apply_wager_progress')) orolado_apply_wager_progress($u, $stake);
      unset($u);
    }
    return ['ok' => true];
  });
  return ['ok' => true, 'real' => (float) ($d['real'] ?? 0)];
}

/** Verse le gain (montant 0 = partie perdue, marquée réglée). Réel : une seule fois par référence. */
function casino_credit(array $db, string $uid, string $mode, float $amount, string $ref): ?float {
  if ($mode === 'try') return null;
  if ($mode === 'demo') {
    if ($amount < 0.005) return (float) (load_db()['vault'][$uid]['demo'] ?? 0); // perdu : on renvoie le solde démo actuel
    $r = with_db_lock(static function ($box) use ($uid, $amount) {
      $box->db['vault'][$uid]['demo'] = orolado_money(($box->db['vault'][$uid]['demo'] ?? 0) + $amount);
      return ['ok' => true, 'demo' => $box->db['vault'][$uid]['demo']];
    });
    return (float) ($r['demo'] ?? 0);
  }
  $pay = casino_payid($db, $uid);
  if ($pay === '') return null;
  $got = orolado_trade_credit_once($pay, $ref, $amount);
  if ($got !== null) {
    with_db_lock(static function ($box) use ($uid, $got) {
      if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
      $box->db['vault'][$uid]['real'] = orolado_money($got);
      return ['ok' => true];
    });
  }
  return $got;
}

/** Statistiques pour l'admin (mises, gains versés, parties) — par jeu et par mode réel / démo. */
function casino_stat(string $game, string $mode, float $stake, float $win): void {
  if ($mode === 'try') return;
  casino_with(casino_dir() . DIRECTORY_SEPARATOR . 'stats.json', static function (array &$s) use ($game, $mode, $stake, $win) {
    $day = gmdate('Y-m-d');
    foreach (['all', $day] as $k) {
      $s[$k][$mode][$game]['n'] = (int) ($s[$k][$mode][$game]['n'] ?? 0) + 1;
      $s[$k][$mode][$game]['in'] = casino_money((float) ($s[$k][$mode][$game]['in'] ?? 0) + $stake);
      $s[$k][$mode][$game]['out'] = casino_money((float) ($s[$k][$mode][$game]['out'] ?? 0) + $win);
    }
    // on garde 40 jours de détail
    $days = array_values(array_filter(array_keys($s), static fn($k) => $k !== 'all'));
    sort($days);
    while (count($days) > 40) unset($s[array_shift($days)]);
    return true;
  });
}

/**
 * v2843 (propriétaire : « je veux voir TOUTES les parties de chaque joueur dans l'admin ») — JOURNAL DES PARTIES.
 * Chaque partie terminée (tous les jeux : Action, Live, Casino, et tout jeu ajouté plus tard par les fiches casino_ext/,
 * car ils passent tous par casino_hist_add) est AJOUTÉE à la fin de deux fichiers, jamais réécrits :
 *   data/casino/rounds/AAAA-MM.jsonl  (toutes les parties du mois, pour le direct et les statistiques de l'admin)
 *   data/casino/ur/<joueur>.jsonl     (toutes les parties d'un joueur, pour sa fiche dans l'admin)
 * Affichage seulement : rien ne change dans les mises ni les gains. Une erreur d'écriture n'arrête jamais la partie.
 */
function casino_round_log(string $uid, array $row, array $extra = []): void {
  try {
    $m = (string) ($row['m'] ?? '');
    if ($uid === '' || $m === 'try' || $m === '') return;
    $s = casino_money((float) ($row['s'] ?? 0));
    $w = casino_money((float) ($row['w'] ?? 0));
    $t = round(microtime(true), 4);
    $line = ['t' => $t, 'u' => $uid, 'g' => (string) ($row['g'] ?? ''), 'm' => $m, 's' => $s, 'w' => $w,
      'x' => $s > 0 ? floor($w / $s * 100 + 1e-6) / 100 : 0.0];
    if (!empty($extra['r'])) $line['r'] = (string) $extra['r'];
    if (!empty($extra['v'])) $line['v'] = 1; // pari annulé (mise rendue)
    $json = json_encode($line, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    $dir = casino_dir('rounds');
    if (!is_file($dir . DIRECTORY_SEPARATOR . '.start')) @file_put_contents($dir . DIRECTORY_SEPARATOR . '.start', (string) (int) $t, LOCK_EX);
    @file_put_contents($dir . DIRECTORY_SEPARATOR . gmdate('Y-m', (int) $t) . '.jsonl', $json, FILE_APPEND | LOCK_EX);
    @file_put_contents(casino_round_user_file($uid), $json, FILE_APPEND | LOCK_EX);
  } catch (\Throwable $e) {
    error_log('OROLADO casino_round_log: ' . $e->getMessage());
  }
}
function casino_round_user_file(string $uid): string { return casino_dir('ur') . DIRECTORY_SEPARATOR . hash('sha256', 'cs|' . $uid) . '.jsonl'; }

function casino_hist_add(string $uid, array $row, array $extra = []): void {
  casino_round_log($uid, $row, $extra);
  casino_with(casino_user_file($uid), static function (array &$st) use ($row, $uid) {
    $h = (array) ($st['h'] ?? []);
    array_unshift($h, $row);
    $st['h'] = array_slice($h, 0, 40);
    // v2698 — totaux du joueur pour l'admin (argent réel seulement) : parties, misé, payé, dernière partie
    $st['uid'] = $uid;
    if (($row['m'] ?? '') === 'real') {
      $t = (array) ($st['tot'] ?? []);
      $t['n'] = (int) ($t['n'] ?? 0) + 1;
      $t['in'] = casino_money((float) ($t['in'] ?? 0) + (float) ($row['s'] ?? 0));
      $t['out'] = casino_money((float) ($t['out'] ?? 0) + (float) ($row['w'] ?? 0));
      $t['last'] = (int) ($row['at'] ?? time());
      $st['tot'] = $t;
    }
    return true;
  });
}
/** Admin : les joueurs du casino (argent réel), triés par montant misé. */
function casino_admin_players(int $limit = 60): array {
  $rows = [];
  foreach (glob(casino_dir('u') . DIRECTORY_SEPARATOR . '*.json') ?: [] as $f) {
    $st = json_decode((string) @file_get_contents($f), true);
    if (!is_array($st) || empty($st['uid']) || empty($st['tot']['n'])) continue;
    $t = $st['tot'];
    $rows[] = ['uid' => (string) $st['uid'], 'n' => (int) $t['n'], 'in' => (float) $t['in'], 'out' => (float) $t['out'], 'last' => (int) ($t['last'] ?? 0)];
  }
  usort($rows, static fn($a, $b) => $b['in'] <=> $a['in']);
  return array_slice($rows, 0, $limit);
}
/** Admin : détail d'un joueur (40 dernières parties, totaux, partie en cours). */
function casino_admin_player(string $uid): array {
  $st = json_decode((string) @file_get_contents(casino_user_file($uid)), true);
  if (!is_array($st)) $st = [];
  return ['h' => array_values((array) ($st['h'] ?? [])), 'tot' => (array) ($st['tot'] ?? [])];
}

/* ---------------------------------------------------------------- parties */

/** v2698 — mise maximale réglée par l'admin jeu par jeu (data/casino/limits.json) ; jamais au-dessus de CASINO_MAX_STAKE. */
function casino_limits(): array {
  $f = casino_dir() . DIRECTORY_SEPARATOR . 'limits.json';
  $l = is_file($f) ? json_decode((string) @file_get_contents($f), true) : [];
  return is_array($l) ? $l : [];
}
function casino_max_stake(string $game): float {
  $l = casino_limits();
  $v = isset($l[$game]) ? (float) $l[$game] : CASINO_MAX_STAKE;
  return max(CASINO_MIN, min(CASINO_MAX_STAKE, $v));
}
function casino_save_limits(array $in): array {
  $out = [];
  foreach ($in as $g => $v) {
    if (!in_array((string) $g, CASINO_GAMES, true) && casino_ext_type((string) $g) === '') continue;
    $v = round((float) $v, 2);
    if ($v >= CASINO_MIN && $v < CASINO_MAX_STAKE) $out[(string) $g] = $v; // vide ou ≥ max = mise maximale normale
  }
  $f = casino_dir() . DIRECTORY_SEPARATOR . 'limits.json';
  @file_put_contents($f, json_encode($out, JSON_PRETTY_PRINT), LOCK_EX);
  return ['ok' => true, 'limits' => $out, 'max' => CASINO_MAX_STAKE];
}
function casino_check_stake(float $stake, string $game = ''): ?string {
  if (!is_finite($stake) || $stake + 1e-9 < CASINO_MIN) return 'min';
  if ($stake > ($game !== '' ? casino_max_stake($game) : CASINO_MAX_STAKE) + 1e-9) return 'max';
  return null;
}
function casino_mode(string $m, bool $guest, ?array $user = null): string {
  return 'real';
}

/** Jeu instantané : mise → tirage → gain, en un seul appel. */
function casino_play(array $db, ?array $user, string $game, string $mode, float $stake, array $p): array {
  $ext = in_array(casino_ext_type($game), ['table', 'pick'], true); // v2804 : nouveaux jeux décrits par fiche (casino_ext.php)
  if (!$ext && (!in_array($game, CASINO_GAMES, true) || in_array($game, CASINO_MULTI, true))) return ['ok' => false, 'reason' => 'game'];
  if (in_array($game, CASINO_RETIRED, true)) return ['ok' => false, 'reason' => 'game']; // v2810 : retiré de l'écran → refusé aussi par l'API
  $stake = floor($stake * 100 + 1e-6) / 100;
  if ($e = casino_check_stake($stake, $game)) return ['ok' => false, 'reason' => $e];
  // Limbo : on refuse une cible dont le gain dépasserait le gain maximal.
  if ($game === 'limbo' && $stake * (float) ($p['target'] ?? 2) > CASINO_MAX_WIN) return ['ok' => false, 'reason' => 'maxWin'];
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  $mode = casino_mode($mode, false, $user);
  $res = $ext ? casino_ext_instant($game, $p) : casino_instant($game, $p, $stake);
  if (isset($res['err'])) return ['ok' => false, 'reason' => $res['err']];
  $ref = 'cs_' . bin2hex(random_bytes(9));
  $deb = casino_debit($db, $uid, $mode, $stake, $ref);
  if (empty($deb['ok'])) return ['ok' => false, 'reason' => $deb['reason'] ?? 'unavailable'];
  $win = casino_win($stake, (float) $res['mult']);
  $bal = casino_credit($db, $uid, $mode, $win, $ref);
  if ($mode !== 'try') {
    casino_stat($game, $mode, $stake, $win);
    casino_hist_add($uid, ['g' => $game, 'm' => $mode, 's' => $stake, 'w' => $win, 'at' => time()], ['r' => $ref]);
  }
  return ['ok' => true, 'game' => $game, 'mode' => $mode, 'stake' => $stake, 'mult' => (float) $res['mult'], 'win' => $win, 'view' => $res['view'],
    'bal' => $bal, 'pending' => $bal === null && $mode === 'real' ? 1 : 0];
}

/** Jeux en plusieurs étapes (avion, mines, hi-lo) : une partie à la fois par jeu et par joueur, gardée par le serveur. */
function casino_multi(array $db, array $user, string $game, string $act, string $mode, float $stake, array $p): array {
  if (casino_ext_type($game) === 'skill') return casino_skill_act($db, $user, $game, $act, $mode, $stake, $p); // v2804 : jeux « où tu contrôles »
  if (!in_array($game, CASINO_MULTI, true)) return ['ok' => false, 'reason' => 'game'];
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  $file = casino_user_file($uid);
  $now = microtime(true);

  if (casino_is_draw($game)) return casino_draw_act($db, $user, $uid, $file, $game, $act, $mode, $stake, $p, $now);
  if ($act === 'round' && casino_is_crash($game)) {
    $mine = casino_settle_crash($db, $uid, $file, $now, $game);
    $out = ['ok' => true, 'now' => $now, 'round' => casino_round_public($game, $now)];
    if (is_array($mine)) $out += casino_public($game, $mine, $now) + ['has' => 1];
    return $out;
  }
  if ($act === 'start') {
    $stake = floor($stake * 100 + 1e-6) / 100;
    if ($e = casino_check_stake($stake, $game)) return ['ok' => false, 'reason' => $e];
    $mode = casino_mode($mode, false, $user);
    // v2810 : tout le départ sous le verrou du joueur (deux départs simultanés ne retirent jamais deux mises)
    return casino_user_lock($uid, static function () use ($db, $uid, $file, $game, $mode, $stake, $p, $now) {
      $cur = casino_with($file, static fn(array &$st) => $st['g'][$game] ?? null);
      if (is_array($cur) && !empty($cur['done']) && empty($cur['paid'])) {
        $fin = casino_finish($db, $uid, $game, $cur, $now); // gain encore à verser (base injoignable la 1re fois)
        if (($fin['bal'] ?? null) === null && $cur['mode'] === 'real' && (float) ($cur['win'] ?? 0) > 0) return ['ok' => false, 'reason' => 'unavailable'];
      }
      if (is_array($cur) && empty($cur['done'])) {
        // partie précédente encore ouverte : l'avion a forcément explosé depuis ; mines / hi-lo : on la reprend
        if (casino_is_crash($game)) {
          $cur = casino_settle_crash($db, $uid, $file, $now, $game);
          if (is_array($cur) && empty($cur['done'])) return ['ok' => true, 'resume' => 1, 'now' => $now] + casino_public($game, $cur, $now);
        } else return ['ok' => true, 'resume' => 1, 'now' => $now] + casino_public($game, $cur, $now);
      }
      $ref = 'cs_' . bin2hex(random_bytes(9));
      $deb = casino_debit($db, $uid, $mode, $stake, $ref);
      if (empty($deb['ok'])) return ['ok' => false, 'reason' => $deb['reason'] ?? 'unavailable'];
      $g = ['ref' => $ref, 'mode' => $mode, 'stake' => $stake, 't0' => $now, 'done' => 0];
      if (casino_is_crash($game)) {
        // v2701 : tour commun — même départ et même point d'explosion que tous les joueurs de ce tour
        $slot = casino_round_slot($game, $now);
        if (!$slot) { casino_credit($db, $uid, $mode, $stake, $ref); return ['ok' => false, 'reason' => 'busy']; }
        $g['round'] = (int) $slot['i']; $g['t0'] = (float) $slot['t0']; $g['c'] = (float) $slot['c'];
        $auto = round((float) ($p['auto'] ?? 0), 2);
        if ($auto >= 1.01) $g['auto'] = $auto;
      } elseif ($game === 'apple') {
        // v2693 : difficulté = nombre de pommes pourries par étage (1 à 4 sur 5)
        $nb = max(1, min(4, (int) ($p['level'] ?? 1)));
        $g['lv'] = $nb; $g['bad'] = [];
        for ($i = 0; $i < CASINO_APPLE_ROWS; $i++) { $c = range(0, 4); for ($j = 4; $j > 0; $j--) { $r = random_int(0, $j); [$c[$j], $c[$r]] = [$c[$r], $c[$j]]; } $g['bad'][] = array_slice($c, 0, $nb); }
        $g['k'] = 0; $g['picks'] = [];
      } elseif ($game === 'tower') {
        $g['traps'] = []; for ($i = 0; $i < CASINO_TOWER_ROWS; $i++) $g['traps'][] = random_int(0, 2);
        $g['k'] = 0; $g['picks'] = [];
      } elseif ($game === 'penalty') {
        $g['k'] = 0; $g['shots'] = [];
      } elseif ($game === 'balloon') {
        // le point d'éclatement est tiré dès le départ (gardé secret) : nombre de souffles qui passent
        $n = 0; while ($n < 60 && random_int(1, 1000) > CASINO_BALLOON_POP * 1000) $n++;
        $g['pop'] = $n; $g['k'] = 0;
      } elseif ($game === 'mines') {
        $m = max(1, min(24, (int) ($p['mines'] ?? 3))); // v2795 : 1 à 24 mines comme Spribe (même calcul ×0,94)
        $cells = range(0, 24);
        for ($i = 24; $i > 0; $i--) { $j = random_int(0, $i); [$cells[$i], $cells[$j]] = [$cells[$j], $cells[$i]]; }
        $g['m'] = $m; $g['mines'] = array_slice($cells, 0, $m); $g['open'] = [];
      } else { // hilo
        $g['card'] = random_int(1, 13); $g['k'] = 0; $g['mult'] = 1.0; $g['cards'] = [$g['card']];
      }
      casino_with($file, static function (array &$st) use ($game, $g) { $st['g'][$game] = $g; return true; });
      return ['ok' => true, 'now' => $now] + casino_public($game, $g, $now);
    });
  }

  $g = casino_with($file, static fn(array &$st) => $st['g'][$game] ?? null);
  if (!is_array($g)) return ['ok' => false, 'reason' => 'noGame'];
  if (!empty($g['done'])) return empty($g['paid']) ? casino_finish($db, $uid, $game, $g, $now) : (['ok' => true] + casino_public($game, $g, $now));

  if (casino_is_crash($game)) {
    if ($act === 'state') {
      $r = casino_settle_crash($db, $uid, $file, $now, $game);
      return ['ok' => true, 'now' => $now] + casino_public($game, $r ?? $g, $now);
    }
    if ($act === 'cash') {
      $r = casino_with($file, static function (array &$st) use ($game, $now) {
        $g = $st['g'][$game];
        if (!empty($g['done'])) return $g;
        if ($now < (float) $g['t0']) { $g['done'] = 1; $g['out'] = 1.0; $g['win'] = casino_money((float) $g['stake']); $st['g'][$game] = $g; return $g; } // v2701 : avant le départ = pari annulé
        $m = casino_crash_mult($now - (float) $g['t0']);
        if (!empty($g['auto']) && $g['auto'] <= $m && $g['auto'] < $g['c']) $m = (float) $g['auto'];
        if ($m >= (float) $g['c']) { $g['done'] = 1; $g['out'] = 0; $g['win'] = 0.0; }
        else { $g['done'] = 1; $g['out'] = $m; $g['win'] = casino_win((float) $g['stake'], $m); }
        $st['g'][$game] = $g;
        return $g;
      });
      return casino_finish($db, $uid, $game, $r, $now);
    }
  }
  if ($game === 'tower' || $game === 'balloon') {
    $multf = $game === 'tower' ? 'casino_tower_mult' : 'casino_balloon_mult';
    if ($act === 'pick' || $act === 'pump') {
      $door = (int) ($p['door'] ?? 0);
      if ($game === 'tower' && ($door < 0 || $door > 2)) return ['ok' => false, 'reason' => 'param'];
      $r = casino_with($file, static function (array &$st) use ($game, $door, $multf) {
        $g = $st['g'][$game];
        if (!empty($g['done'])) return $g;
        $k = (int) $g['k'];
        $lost = $game === 'tower' ? ($door === (int) $g['traps'][$k]) : ($k >= (int) $g['pop']);
        if ($game === 'tower') $g['picks'][] = $door;
        if ($lost) { $g['done'] = 1; $g['win'] = 0.0; $g['boom'] = $k; }
        else {
          $g['k'] = $k + 1;
          $max = $game === 'tower' ? CASINO_TOWER_ROWS : 60;
          if ($g['k'] >= $max || $g['stake'] * $multf($g['k']) >= CASINO_MAX_WIN) { $g['done'] = 1; $g['win'] = casino_win((float) $g['stake'], $multf($g['k'])); }
        }
        $st['g'][$game] = $g;
        return $g;
      });
      return !empty($r['done']) ? casino_finish($db, $uid, $game, $r, $now) : (['ok' => true] + casino_public($game, $r, $now));
    }
    if ($act === 'cash') {
      $r = casino_with($file, static function (array &$st) use ($game, $multf) {
        $g = $st['g'][$game];
        if (!empty($g['done']) || $g['k'] < 1) return $g;
        $g['done'] = 1; $g['win'] = casino_win((float) $g['stake'], $multf((int) $g['k']));
        $st['g'][$game] = $g;
        return $g;
      });
      if (empty($r['done'])) return ['ok' => false, 'reason' => 'param'];
      return casino_finish($db, $uid, $game, $r, $now);
    }
  }
  if ($game === 'penalty') {
    if ($act === 'shoot') {
      /* v2811 (propriétaire) — 9 ZONES (3 colonnes × 3 hauteurs) : nouveau client {z: 0..8} = hauteur × 3 + colonne
         (hauteur 0 haut, 1 milieu, 2 bas) ; ancien client {aim: 0..2, h: 0|2} toujours accepté (même tir).
         Le gardien choisit SA colonne au hasard (1 chance sur 3) et couvre toute la colonne : s'il prend celle du tir il
         plonge exactement sur le ballon (arrêt), sinon il plonge à une hauteur tirée au hasard ailleurs (but).
         → but 2 fois sur 3 pour CHACUNE des 9 zones, exactement comme avant : mêmes multiplicateurs, même marge. */
      if (isset($p['z'])) {
        $z = (int) $p['z'];
        if ($z < 0 || $z > 8) return ['ok' => false, 'reason' => 'param'];
        $aim = $z % 3; $hgt = intdiv($z, 3);
      } else {
        $aim = (int) ($p['aim'] ?? -1); $hgt = max(0, min(2, (int) ($p['h'] ?? 0))); // hauteur : dessin seulement
        if ($aim < 0 || $aim > 2) return ['ok' => false, 'reason' => 'param'];
      }
      $r = casino_with($file, static function (array &$st) use ($game, $aim, $hgt) {
        $g = $st['g'][$game];
        if (!empty($g['done'])) return $g;
        [$keeper, $goal, $krow] = casino_pen_keeper($aim, $hgt);
        $g['shots'][] = [$aim, $hgt, $keeper, $goal ? 1 : 0, $krow];
        if (!$goal) { $g['done'] = 1; $g['win'] = 0.0; $g['boom'] = (int) $g['k']; }
        else {
          $g['k'] = (int) $g['k'] + 1;
          if ($g['k'] >= CASINO_PEN_ROWS || $g['stake'] * casino_pen_mult($g['k']) >= CASINO_MAX_WIN) { $g['done'] = 1; $g['win'] = casino_win((float) $g['stake'], casino_pen_mult($g['k'])); }
        }
        $st['g'][$game] = $g;
        return $g;
      });
      return !empty($r['done']) ? casino_finish($db, $uid, $game, $r, $now) : (['ok' => true] + casino_public($game, $r, $now));
    }
    if ($act === 'cash') {
      $r = casino_with($file, static function (array &$st) use ($game) {
        $g = $st['g'][$game];
        if (!empty($g['done']) || $g['k'] < 1) return $g;
        $g['done'] = 1; $g['win'] = casino_win((float) $g['stake'], casino_pen_mult((int) $g['k']));
        $st['g'][$game] = $g;
        return $g;
      });
      if (empty($r['done'])) return ['ok' => false, 'reason' => 'param'];
      return casino_finish($db, $uid, $game, $r, $now);
    }
  }
  if ($game === 'apple') {
    if ($act === 'pick') {
      $cell = (int) ($p['cell'] ?? -1);
      if ($cell < 0 || $cell > 4) return ['ok' => false, 'reason' => 'param'];
      $r = casino_with($file, static function (array &$st) use ($game, $cell) {
        $g = $st['g'][$game];
        if (!empty($g['done'])) return $g;
        $row = (int) $g['k'];
        $g['picks'][] = $cell;
        if (in_array($cell, casino_apple_bad($g, $row), true)) { $g['done'] = 1; $g['win'] = 0.0; $g['boom'] = $row; }
        else {
          $g['k'] = $row + 1;
          $mm = casino_apple_mult($g['k'], (int) ($g['lv'] ?? 1));
          if ($g['k'] >= CASINO_APPLE_ROWS || $g['stake'] * $mm >= CASINO_MAX_WIN) { $g['done'] = 1; $g['win'] = casino_win((float) $g['stake'], $mm); }
        }
        $st['g'][$game] = $g;
        return $g;
      });
      return !empty($r['done']) ? casino_finish($db, $uid, $game, $r, $now) : (['ok' => true] + casino_public($game, $r, $now));
    }
    if ($act === 'cash') {
      $r = casino_with($file, static function (array &$st) use ($game) {
        $g = $st['g'][$game];
        if (!empty($g['done']) || $g['k'] < 1) return $g;
        $g['done'] = 1; $g['win'] = casino_win((float) $g['stake'], casino_apple_mult((int) $g['k'], (int) ($g['lv'] ?? 1)));
        $st['g'][$game] = $g;
        return $g;
      });
      if (empty($r['done'])) return ['ok' => false, 'reason' => 'param'];
      return casino_finish($db, $uid, $game, $r, $now);
    }
  }
  if ($game === 'mines') {
    if ($act === 'open') {
      $cell = (int) ($p['cell'] ?? -1);
      if ($cell < 0 || $cell > 24) return ['ok' => false, 'reason' => 'param'];
      $r = casino_with($file, static function (array &$st) use ($game, $cell) {
        $g = $st['g'][$game];
        if (!empty($g['done']) || in_array($cell, $g['open'], true)) return $g;
        if (in_array($cell, $g['mines'], true)) { $g['done'] = 1; $g['boom'] = $cell; $g['win'] = 0.0; }
        else {
          $g['open'][] = $cell;
          if (count($g['open']) >= 25 - $g['m'] || $g['stake'] * casino_mines_mult($g['m'], count($g['open'])) >= CASINO_MAX_WIN) { $g['done'] = 1; $g['win'] = casino_win((float) $g['stake'], casino_mines_mult($g['m'], count($g['open']))); }
        }
        $st['g'][$game] = $g;
        return $g;
      });
      return !empty($r['done']) ? casino_finish($db, $uid, $game, $r, $now) : (['ok' => true] + casino_public($game, $r, $now));
    }
    if ($act === 'cash') {
      $r = casino_with($file, static function (array &$st) use ($game) {
        $g = $st['g'][$game];
        if (!empty($g['done']) || !$g['open']) return $g;
        $g['done'] = 1; $g['win'] = casino_win((float) $g['stake'], casino_mines_mult($g['m'], count($g['open'])));
        $st['g'][$game] = $g;
        return $g;
      });
      if (empty($r['done'])) return ['ok' => false, 'reason' => 'param'];
      return casino_finish($db, $uid, $game, $r, $now);
    }
  }
  if ($game === 'hilo') {
    // v2795 (comme Spribe Hi-Lo) : « Passer » — nouvelle carte sans pari, le multiplicateur ne bouge pas (30 fois max par partie)
    if ($act === 'skip') {
      $r = casino_with($file, static function (array &$st) use ($game) {
        $g = $st['g'][$game];
        if (!empty($g['done']) || count($g['sk'] ?? []) >= 30) return null;
        $g['card'] = random_int(1, 13); $g['cards'][] = $g['card']; $g['sk'][] = count($g['cards']) - 1;
        $st['g'][$game] = $g;
        return $g;
      });
      if (!is_array($r)) return ['ok' => false, 'reason' => 'param'];
      return ['ok' => true] + casino_public($game, $r, $now);
    }
    if ($act === 'guess') {
      $hi = !empty($p['hi']);
      $r = casino_with($file, static function (array &$st) use ($game, $hi) {
        $g = $st['g'][$game];
        if (!empty($g['done'])) return $g;
        $next = random_int(1, 13);
        $ok = $hi ? $next >= $g['card'] : $next <= $g['card'];
        $g['cards'][] = $next;
        if (!$ok) { $g['done'] = 1; $g['win'] = 0.0; $g['card'] = $next; }
        else {
          $g['mult'] = floor($g['mult'] * casino_hilo_mult((int) $g['card'], $hi) * 100) / 100;
          $g['card'] = $next; $g['k']++;
          if ($g['stake'] * $g['mult'] >= CASINO_MAX_WIN) { $g['done'] = 1; $g['win'] = CASINO_MAX_WIN; }
        }
        $st['g'][$game] = $g;
        return $g;
      });
      return !empty($r['done']) ? casino_finish($db, $uid, $game, $r, $now) : (['ok' => true] + casino_public($game, $r, $now));
    }
    if ($act === 'cash') {
      $r = casino_with($file, static function (array &$st) use ($game) {
        $g = $st['g'][$game];
        if (!empty($g['done']) || $g['k'] < 1) return $g;
        $g['done'] = 1; $g['win'] = casino_win((float) $g['stake'], (float) $g['mult']);
        $st['g'][$game] = $g;
        return $g;
      });
      if (empty($r['done'])) return ['ok' => false, 'reason' => 'param'];
      return casino_finish($db, $uid, $game, $r, $now);
    }
  }
  if ($act === 'state') return ['ok' => true, 'now' => $now] + casino_public($game, $g, $now);
  return ['ok' => false, 'reason' => 'param'];
}

/** Avion : si l'explosion est passée (ou l'encaissement automatique atteint), la partie est réglée. */
function casino_settle_crash(array $db, string $uid, string $file, float $now, string $game = 'crash'): ?array {
  $r = casino_with($file, static function (array &$st) use ($now, $game) {
    $g = $st['g'][$game] ?? null;
    if (!is_array($g) || !empty($g['done'])) return $g;
    if ($now < (float) $g['t0']) return $g; // v2701 : rien n'est réglé avant le départ du tour
    $m = casino_crash_mult($now - (float) $g['t0']);
    if (!empty($g['auto']) && $g['auto'] < $g['c'] && $m >= $g['auto']) { $g['done'] = 1; $g['out'] = (float) $g['auto']; $g['win'] = casino_win((float) $g['stake'], (float) $g['auto']); }
    elseif ($m >= (float) $g['c']) { $g['done'] = 1; $g['out'] = 0; $g['win'] = 0.0; }
    else return $g;
    $st['g'][$game] = $g;
    return $g;
  });
  if (is_array($r) && !empty($r['done']) && empty($r['paid'])) casino_finish($db, $uid, $game, $r, $now);
  return $r;
}

/** v2718 — tirage en direct : règle mon pari si son résultat est révélé.
 *  v2810 : le résultat vient du pari lui-même (gardé à la mise) ; ancien pari sans résultat gardé dont le tour a quitté
 *  l'historique → mise RENDUE (une seule fois : même référence, drapeau « payé »). Un pari ne reste donc jamais bloqué. */
function casino_draw_settle(array $db, string $uid, string $file, float $now, string $game): ?array {
  $g0 = casino_with($file, static fn(array &$st) => $st['g'][$game] ?? null);
  if (!is_array($g0) || !empty($g0['done']) || $now < (float) ($g0['close'] ?? 0)) {
    if (is_array($g0) && !empty($g0['done']) && empty($g0['paid'])) casino_finish($db, $uid, $game, $g0, $now);
    return $g0;
  }
  // résultat cherché HORS du verrou du joueur (fichier du tirage verrouillé à part)
  $out = is_array($g0['o'] ?? null) && $g0['o'] ? $g0['o'] : casino_draw_outcome($game, (int) ($g0['round'] ?? 0));
  $r = casino_with($file, static function (array &$st) use ($now, $game, $out, $g0) {
    $g = $st['g'][$game] ?? null;
    if (!is_array($g) || !empty($g['done']) || ($g['ref'] ?? '') !== ($g0['ref'] ?? '')) return $g;
    if ($out) {
      $m = (float) (casino_draw_mult($game, (string) $g['sel'], $out) ?? 0.0);
      $g['done'] = 1; $g['out'] = $m; $g['res'] = casino_draw_keep('', $out); $g['win'] = casino_win((float) $g['stake'], $m);
    } else {
      // tour introuvable (sorti de l'historique) : pari annulé, mise rendue exactement
      $g['done'] = 1; $g['out'] = 1.0; $g['res'] = null; $g['void'] = 1; $g['win'] = casino_money((float) $g['stake']);
    }
    unset($g['o']);
    $st['g'][$game] = $g;
    return $g;
  });
  if (is_array($r) && !empty($r['done']) && empty($r['paid'])) casino_finish($db, $uid, $game, $r, $now);
  return $r;
}
/** v2718 — actions d'un tirage en direct : 'dround' (état du tour + mon pari) et 'bet' (un pari par tour). */
function casino_draw_act(array $db, array $user, string $uid, string $file, string $game, string $act, string $mode, float $stake, array $p, float $now): array {
  $mine = casino_draw_settle($db, $uid, $file, $now, $game);
  if ($act === 'dround') {
    $o = ['ok' => true, 'now' => $now, 'round' => casino_draw_public($game, $now)];
    if (is_array($mine)) $o += casino_public($game, $mine, $now) + ['has' => 1];
    return $o;
  }
  if ($act !== 'bet') return ['ok' => false, 'reason' => 'param'];
  [$P, $B] = casino_draw_pb($game); // v2830
  $i = casino_draw_i($game, $now); $close = casino_draw_start($game, $i) + $B; // v2811
  if ($now > $close - 0.8) return ['ok' => false, 'reason' => 'closed']; // mises fermées (petite marge pour le réseau)
  $sel = (string) ($p['sel'] ?? '');
  if (casino_draw_mult($game, $sel, []) === null) return ['ok' => false, 'reason' => 'param'];
  $stake = floor($stake * 100 + 1e-6) / 100;
  if ($e = casino_check_stake($stake, $game)) return ['ok' => false, 'reason' => $e];
  $mode = casino_mode($mode, false, $user);
  // v2810 : le résultat du tour est fixé (tiré une fois, sous verrou) AVANT la mise et gardé avec le pari
  $out = casino_draw_outcome($game, $i);
  if (!$out) return ['ok' => false, 'reason' => 'busy'];
  // v2810 : vérifier → retirer → enregistrer sous le verrou du joueur (deux paris simultanés : un seul retiré)
  return casino_user_lock($uid, static function () use ($db, $uid, $file, $game, $mode, $stake, $sel, $i, $close, $now, $out) {
    $mine = casino_with($file, static fn(array &$st) => $st['g'][$game] ?? null);
    if (is_array($mine) && empty($mine['done'])) {
      // « déjà » seulement pour un pari dont le tour n'est pas encore fermé ; sinon il se règle au prochain appel
      return ['ok' => false, 'reason' => $now < (float) ($mine['close'] ?? 0) ? 'already' : 'unavailable'];
    }
    if (is_array($mine) && !empty($mine['done']) && empty($mine['paid'])) return ['ok' => false, 'reason' => 'unavailable'];
    $ref = 'cs_' . bin2hex(random_bytes(9));
    $deb = casino_debit($db, $uid, $mode, $stake, $ref);
    if (empty($deb['ok'])) return ['ok' => false, 'reason' => $deb['reason'] ?? 'unavailable'];
    $g = ['ref' => $ref, 'mode' => $mode, 'stake' => $stake, 'round' => $i, 'close' => (float) $close, 'sel' => $sel, 't0' => $now, 'done' => 0, 'o' => casino_draw_keep($sel, $out)];
    casino_with($file, static function (array &$st) use ($game, $g) { $st['g'][$game] = $g; return true; });
    return ['ok' => true, 'now' => $now, 'round' => casino_draw_public($game, $now), 'has' => 1, 'bal' => $mode === 'demo' ? ($deb['demo'] ?? null) : ($deb['real'] ?? null)] + casino_public($game, $g, $now);
  });
}

/** Fin de partie (plusieurs étapes) : versement une seule fois, statistiques, historique. */
function casino_finish(array $db, string $uid, string $game, array $g, float $now): array {
  $file = casino_user_file($uid);
  $first = casino_with($file, static function (array &$st) use ($game) {
    if (!empty($st['g'][$game]['paid'])) return false;
    $st['g'][$game]['paid'] = 1;
    return true;
  });
  $bal = null;
  if ($first) {
    $bal = casino_credit($db, $uid, (string) $g['mode'], (float) ($g['win'] ?? 0), (string) $g['ref']);
    if ($bal === null && $g['mode'] === 'real') {
      // base injoignable : on réessaiera au prochain appel
      casino_with($file, static function (array &$st) use ($game) { $st['g'][$game]['paid'] = 0; return true; });
    } else {
      casino_stat($game, (string) $g['mode'], (float) $g['stake'], (float) ($g['win'] ?? 0));
      casino_hist_add($uid, ['g' => $game, 'm' => $g['mode'], 's' => (float) $g['stake'], 'w' => (float) ($g['win'] ?? 0), 'at' => time()], ['r' => (string) ($g['ref'] ?? ''), 'v' => !empty($g['void'])]);
    }
  }
  $g['paid'] = 1;
  return ['ok' => true, 'bal' => $bal] + casino_public($game, $g, $now);
}

/** Ce que le navigateur a le droit de voir (jamais le point d'explosion ni les mines avant la fin). */
function casino_public(string $game, array $g, float $now): array {
  if (casino_ext_type($game) === 'skill') return casino_skill_public($game, $g, $now);
  $o = ['game' => $game, 'mode' => (string) $g['mode'], 'stake' => (float) $g['stake'], 'done' => !empty($g['done']) ? 1 : 0, 'win' => (float) ($g['win'] ?? 0)];
  if (casino_is_draw($game)) {
    $o['rid'] = (int) ($g['round'] ?? 0); $o['sel'] = (string) ($g['sel'] ?? ''); $o['ref'] = substr(hash('sha256', (string) $g['ref']), 0, 10);
    if (!empty($g['done'])) { $o['out'] = (float) ($g['out'] ?? 0); $o['res'] = $g['res'] ?? null; }
    return $o;
  }
  if (casino_is_crash($game)) {
    $o['t0'] = (float) $g['t0']; $o['auto'] = (float) ($g['auto'] ?? 0); $o['rid'] = (int) ($g['round'] ?? 0); $o['ref'] = substr(hash('sha256', (string) $g['ref']), 0, 10);
    if (!empty($g['done'])) { $o['c'] = (float) $g['c']; $o['out'] = (float) ($g['out'] ?? 0); }
  } elseif ($game === 'apple') {
    $lv = (int) ($g['lv'] ?? 1);
    $o['k'] = (int) $g['k']; $o['picks'] = $g['picks']; $o['rows'] = CASINO_APPLE_ROWS; $o['lv'] = $lv;
    $o['mult'] = casino_apple_mult((int) $g['k'], $lv); $o['next'] = casino_apple_mult((int) $g['k'] + 1, $lv);
    if (!empty($g['done'])) { $o['bad'] = array_map(static fn($b) => is_array($b) ? $b : [$b], $g['bad']); $o['boom'] = $g['boom'] ?? null; }
  } elseif ($game === 'tower') {
    $o['k'] = (int) $g['k']; $o['picks'] = $g['picks']; $o['rows'] = CASINO_TOWER_ROWS;
    $o['mult'] = casino_tower_mult((int) $g['k']); $o['next'] = casino_tower_mult((int) $g['k'] + 1);
    if (!empty($g['done'])) { $o['traps'] = $g['traps']; $o['boom'] = $g['boom'] ?? null; }
  } elseif ($game === 'penalty') {
    $o['k'] = (int) $g['k']; $o['shots'] = $g['shots']; $o['rows'] = CASINO_PEN_ROWS;
    $o['mult'] = casino_pen_mult((int) $g['k']); $o['next'] = casino_pen_mult((int) $g['k'] + 1);
    $o['ladder'] = array_map('casino_pen_mult', range(1, CASINO_PEN_ROWS));
    if (!empty($g['done'])) $o['boom'] = $g['boom'] ?? null;
  } elseif ($game === 'balloon') {
    $o['k'] = (int) $g['k']; $o['mult'] = casino_balloon_mult((int) $g['k']); $o['next'] = casino_balloon_mult((int) $g['k'] + 1);
    if (!empty($g['done'])) $o['boom'] = $g['boom'] ?? null;
  } elseif ($game === 'mines') {
    $o['m'] = (int) $g['m']; $o['open'] = array_values($g['open']); $o['next'] = casino_mines_mult((int) $g['m'], count($g['open']) + 1);
    $o['mult'] = count($g['open']) ? casino_mines_mult((int) $g['m'], count($g['open'])) : 0;
    if (!empty($g['done'])) { $o['mines'] = $g['mines']; $o['boom'] = $g['boom'] ?? null; }
  } else {
    $o['card'] = (int) $g['card']; $o['cards'] = $g['cards']; $o['k'] = (int) $g['k']; $o['mult'] = (float) $g['mult'];
    $o['hiMult'] = casino_hilo_mult((int) $g['card'], true); $o['loMult'] = casino_hilo_mult((int) $g['card'], false);
    $o['sk'] = array_values($g['sk'] ?? []); // v2795 : rangs des cartes passées (« Passer »)
  }
  return $o;
}

function casino_history(string $uid): array {
  return (array) (casino_with(casino_user_file($uid), static fn(array &$st) => $st['h'] ?? []) ?: []);
}

// v2804 : moteur des nouveaux jeux (fiches casino_ext/*.php) — chargé après les constantes ci-dessus
if (is_file(__DIR__ . '/casino_ext.php')) require_once __DIR__ . '/casino_ext.php';
if (!function_exists('casino_ext_type')) { function casino_ext_type(string $g): string { return ''; } function casino_ext_keys(): array { return []; } }

/* v2850 (propriétaire, round 6) — LIVE 3 : 12 NOUVEAUX JEUX EN DIRECT (même moteur casino_draw_* que Lucky Planets et live2 :
 * un tirage par tour et par jeu, fait la 1re fois qu'on en a besoin, sous verrou, gardé dans draw-<jeu>.json, SECRET jusqu'à
 * la fermeture des mises, le même pour tout le monde ; un pari par joueur et par tour). Rien n'est tiré si personne ne regarde.
 * Chaque choix a sa chance EXACTE p et sa cote = 0,94 ÷ p arrondie VERS LE BAS au centime → retour ≤ 94 % pour CHAQUE choix
 * (vérifié par scripts/test-cg-live3.php : calcul exact + simulation). Une égalité fait perdre les choix qui ne l'ont pas prévue.
 *  - dtlive     Dragon Tiger Live : une carte (A…K) pour le Dragon, une pour le Tigre ; Dragon ×2,03 · Tigre ×2,03 · Égalité ×12,22.
 *  - hilolive   High-Low Live : la carte de base (3…K) est montrée pendant les mises ; la suivante (2…A) : plus haute / plus basse /
 *               égale — cotes du tour selon la carte de base (ex. base 8 : ×2,03 / ×2,03 / ×12,22).
 *  - sicbolive  Big Small Live : 3 dés ; Petit (4–10) / Grand (11–17) / Impair / Pair ×1,93 (un triple les fait perdre) · triple ×33,84.
 *  - kenolive   Keno Live : 20 boules sur 80 ; plus de boules en haut (1–40) / en bas (41–80) ×2,35, 10–10 ×4,63 ; idem impairs / pairs.
 *  - lucky10    Lucky Ten : une boule de 1 à 10 ; numéro ×9,40 · impair / pair / 1–5 / 6–10 ×1,88.
 *  - moneywheel Money Wheel : grande roue de 54 cases (25×« 1 », 15×« 2 », 7×« 5 », 4×« 10 », 2×« 20 », 1×« 40 ») ×2,03 … ×50,76.
 *  - coinlive   Coin Toss Live : 3 pièces ; Pile / Face (majorité) ×1,88 · exactement 2 ×2,50 · 3 pareilles ×7,52.
 *  - pegdrop    Peg Drop Live : une bille traverse 8 rangées de clous (9 cases) ; centre ×3,43 · voisins ×2,14 … bords ×120,32 ;
 *               gauche (0–3) / droite (5–8) ×2,58.
 *  - football   Goal Rush : match virtuel de 90 min (buts tirés selon des chances fixes) ; 1 / X / 2, +2,5 / −2,5 buts, les deux marquent.
 *  - bullseye   Bullseye Live : une flèche sur une cible à 5 anneaux (or 7 % … blanc 35 %) ×13,42 … ×2,68.
 *  - ladder     Lucky Ladder : départ gauche / droite, 3 ou 4 barreaux, arrivée gauche / droite ×1,88 ; départ + barreaux ×3,76.
 *  - moonshot   Moon Shot : la fusée monte et explose à X (chance d'atteindre X = 1 ÷ X) ; tranches < 1,5 · 1,5–3 · 3–10 · ≥ 10,
 *               < 2 / ≥ 2. [période P, mises ouvertes B] */
const CASINO_LIVE3 = ['dtlive' => [150, 120], 'hilolive' => [145, 120], 'sicbolive' => [150, 120], 'kenolive' => [180, 120], 'lucky10' => [155, 120], 'moneywheel' => [155, 120],
  'coinlive' => [150, 120], 'pegdrop' => [150, 120], 'football' => [180, 120], 'bullseye' => [150, 120], 'ladderlive' => [155, 120], 'moonshot' => [165, 120]];
const CASINO_MW_SEG = [40, 1, 2, 5, 1, 2, 1, 10, 1, 2, 1, 5, 2, 20, 1, 1, 2, 1, 1, 5, 10, 2, 1, 2, 1, 1, 2, 5, 1, 1, 2, 1, 1, 2, 10, 5, 1, 1, 2, 1, 20, 2, 5, 1, 1, 2, 1, 10, 2, 1, 5, 1, 2, 1];
const CASINO_FB_H = [22, 33, 25, 13, 5, 2]; // buts de l'équipe rouge (0…5), chances sur 100
const CASINO_FB_A = [30, 35, 21, 10, 3, 1]; // buts de l'équipe bleue
const CASINO_BULL_W = [7, 13, 20, 25, 35];  // or, rouge, bleu, noir, blanc (du centre vers le bord)
const CASINO_MOON_B = [[1.0, 1.5, 10], [1.5, 2.0, 5], [2.0, 3.0, 5], [3.0, 10.0, 7], [10.0, 0.0, 3]]; // tranches [de, à, chances sur 30] (P(X ≥ m) = 1/m)
function casino_live3_c(int $n, int $k): float { if ($k < 0 || $k > $n) return 0.0; $r = 1.0; for ($i = 1; $i <= $k; $i++) $r = $r * ($n - $k + $i) / $i; return $r; }
/** Chance exacte de chaque choix (hilolive : selon la carte de base du tour ; sans tour : base 8). */
function casino_live3_probs(string $g, array $out = []): array {
  static $memo = [];
  if ($g === 'hilolive') { $b = (int) ($out['b'] ?? 8); return ['h' => (14 - $b) / 13, 'l' => ($b - 2) / 13, 'e' => 1 / 13]; }
  if (isset($memo[$g])) return $memo[$g];
  switch ($g) {
    case 'dtlive': $p = ['d' => 6 / 13, 't' => 6 / 13, 'x' => 1 / 13]; break;
    case 'sicbolive': $p = ['small' => 105 / 216, 'big' => 105 / 216, 'odd' => 105 / 216, 'even' => 105 / 216, 'triple' => 6 / 216]; break;
    case 'kenolive':
      $p10 = casino_live3_c(40, 10) ** 2 / casino_live3_c(80, 20); $q = (1 - $p10) / 2;
      $p = ['top' => $q, 'bot' => $q, 'tt' => $p10, 'odd' => $q, 'even' => $q, 'oe' => $p10]; break;
    case 'lucky10': $p = []; for ($k = 1; $k <= 10; $k++) $p[(string) $k] = 0.1; $p += ['odd' => 0.5, 'even' => 0.5, 'lo' => 0.5, 'hi' => 0.5]; break;
    case 'moneywheel': $p = []; foreach ([1, 2, 5, 10, 20, 40] as $v) $p['v' . $v] = count(array_keys(CASINO_MW_SEG, $v, true)) / 54; break;
    case 'coinlive': $p = ['h' => 0.5, 't' => 0.5, 'h3' => 1 / 8, 'h2' => 3 / 8, 't2' => 3 / 8, 't3' => 1 / 8]; break;
    case 'pegdrop': $p = ['d0' => 70 / 256, 'd1' => 112 / 256, 'd2' => 56 / 256, 'd3' => 16 / 256, 'd4' => 2 / 256, 'L' => 93 / 256, 'R' => 93 / 256]; break;
    case 'football':
      $p = ['1' => 0, 'x' => 0, '2' => 0, 'o' => 0, 'u' => 0, 'gg' => 0];
      foreach (CASINO_FB_H as $h => $wh) foreach (CASINO_FB_A as $a => $wa) {
        $w = $wh * $wa / 10000;
        $p[$h > $a ? '1' : ($h === $a ? 'x' : '2')] += $w; $p[$h + $a >= 3 ? 'o' : 'u'] += $w; if ($h && $a) $p['gg'] += $w;
      }
      break;
    case 'bullseye': $p = []; foreach (CASINO_BULL_W as $i => $w) $p[(string) $i] = $w / 100; break;
    case 'ladderlive': $p = ['sl' => 0.5, 'sr' => 0.5, 'r3' => 0.5, 'r4' => 0.5, 'el' => 0.5, 'er' => 0.5, 'c0' => 0.25, 'c1' => 0.25, 'c2' => 0.25, 'c3' => 0.25]; break;
    case 'moonshot': $p = ['a' => 10 / 30, 'b' => 10 / 30, 'c' => 7 / 30, 'd' => 3 / 30, 'u2' => 15 / 30, 'o2' => 15 / 30]; break;
    default: $p = [];
  }
  return $memo[$g] = $p;
}
function casino_live3_odds(string $g, array $out = []): array { return array_map('casino_live2_odd', casino_live3_probs($g, $out)); }
/** La sélection gagne-t-elle avec ce résultat ? */
function casino_live3_hit(string $g, string $sel, array $out): bool {
  $n = (int) ($out['n'] ?? -1);
  switch ($g) {
    case 'dtlive': case 'hilolive': return $sel === ['d', 't', 'x', 'h', 'l', 'e'][$n + ($g === 'hilolive' ? 3 : 0)];
    case 'sicbolive':
      $d = (array) ($out['d'] ?? []); $tri = count($d) === 3 && $d[0] === $d[1] && $d[1] === $d[2];
      if ($sel === 'triple') return $tri;
      if ($tri) return false;
      return $sel === 'small' ? $n <= 10 : ($sel === 'big' ? $n >= 11 : ($sel === 'odd' ? $n % 2 === 1 : $n % 2 === 0));
    case 'kenolive':
      $q = (int) ($out['q'] ?? -1);
      return ['top' => $n > 10, 'bot' => $n < 10, 'tt' => $n === 10, 'odd' => $q > 10, 'even' => $q < 10, 'oe' => $q === 10][$sel] ?? false;
    case 'lucky10': return $sel === 'odd' ? $n % 2 === 1 : ($sel === 'even' ? $n % 2 === 0 : ($sel === 'lo' ? $n <= 5 : ($sel === 'hi' ? $n >= 6 : (int) $sel === $n)));
    case 'moneywheel': return $sel === 'v' . (CASINO_MW_SEG[$n] ?? -1);
    case 'coinlive': return ['h' => $n >= 2, 't' => $n <= 1, 'h3' => $n === 3, 'h2' => $n === 2, 't2' => $n === 1, 't3' => $n === 0][$sel] ?? false;
    case 'pegdrop': return $sel === 'L' ? $n <= 3 : ($sel === 'R' ? $n >= 5 : $sel === 'd' . abs($n - 4));
    case 'football':
      $h = intdiv($n, 10); $a = $n % 10;
      return ['1' => $h > $a, 'x' => $h === $a, '2' => $h < $a, 'o' => $h + $a >= 3, 'u' => $h + $a <= 2, 'gg' => $h > 0 && $a > 0][$sel] ?? false;
    case 'bullseye': return (int) $sel === $n && preg_match('/^[0-4]$/', $sel) === 1;
    case 'ladderlive':
      $s = intdiv($n, 2); $r = $n % 2 ? 4 : 3; $e = $r === 3 ? 1 - $s : $s;
      return ['sl' => $s === 0, 'sr' => $s === 1, 'r3' => $r === 3, 'r4' => $r === 4, 'el' => $e === 0, 'er' => $e === 1][$sel] ?? ($sel === 'c' . $n);
    case 'moonshot':
      $x = $n / 100;
      return ['a' => $x < 1.5, 'b' => $x >= 1.5 && $x < 3, 'c' => $x >= 3 && $x < 10, 'd' => $x >= 10, 'u2' => $x < 2, 'o2' => $x >= 2][$sel] ?? false;
  }
  return false;
}
/** Tirage d'un tour (appelé une fois, sous le verrou de draw-<jeu>.json) : quelques random_int, rien de lourd. */
function casino_live3_draw(string $g): array {
  switch ($g) {
    case 'dtlive': $d = random_int(1, 13); $t = random_int(1, 13); return ['n' => $d > $t ? 0 : ($d < $t ? 1 : 2), 'd' => $d, 't' => $t, 's' => [random_int(0, 3), random_int(0, 3)]];
    case 'hilolive': $b = random_int(3, 13); $x = random_int(2, 14); return ['n' => $x > $b ? 0 : ($x < $b ? 1 : 2), 'b' => $b, 'x' => $x, 's' => [random_int(0, 3), random_int(0, 3)]];
    case 'sicbolive': $d = [random_int(1, 6), random_int(1, 6), random_int(1, 6)]; return ['n' => array_sum($d), 'd' => $d];
    case 'kenolive':
      $all = range(1, 80); $b = [];
      for ($i = 0; $i < 20; $i++) { $j = random_int($i, 79); [$all[$i], $all[$j]] = [$all[$j], $all[$i]]; $b[] = $all[$i]; }
      return ['n' => count(array_filter($b, static fn($v) => $v <= 40)), 'q' => count(array_filter($b, static fn($v) => $v % 2 === 1)), 'b' => $b];
    case 'lucky10': return ['n' => random_int(1, 10)];
    case 'moneywheel': return ['n' => random_int(0, 53)];
    case 'coinlive': $h = [random_int(0, 1), random_int(0, 1), random_int(0, 1)]; return ['n' => array_sum($h), 'h' => $h]; // 1 = pile (heads)
    case 'pegdrop': $h = []; for ($k = 0; $k < 8; $k++) $h[] = random_int(0, 1); return ['n' => array_sum($h), 'h' => $h]; // 1 = rebond à droite
    case 'football':
      $h = casino_live2_pick(CASINO_FB_H); $a = casino_live2_pick(CASINO_FB_A);
      $m = []; for ($k = 0; $k < $h + $a; $k++) { do { $v = random_int(2, 89); } while (isset($m[$v])); $m[$v] = 1; } // minutes des buts, toutes différentes
      $mins = array_keys($m); sort($mins);
      $who = array_merge(array_fill(0, $h, 0), array_fill(0, $a, 1)); for ($i = count($who) - 1; $i > 0; $i--) { $j = random_int(0, $i); [$who[$i], $who[$j]] = [$who[$j], $who[$i]]; }
      $goals = []; foreach ($mins as $k => $v) $goals[] = [$v, $who[$k]];
      return ['n' => $h * 10 + $a, 'g' => $goals];
    case 'bullseye': return ['n' => casino_live2_pick(CASINO_BULL_W), 'a' => random_int(0, 359), 'r' => random_int(15, 85)];
    case 'ladderlive': return ['n' => random_int(0, 3)];
    case 'moonshot':
      $w = array_map(static fn($b) => $b[2], CASINO_MOON_B); [$lo, $hi] = CASINO_MOON_B[casino_live2_pick($w)];
      $u = random_int(1, 1000000) / 1000000;
      $x = $hi > 0 ? 1 / (1 / $lo - $u * (1 / $lo - 1 / $hi)) : $lo / $u; // densité ∝ 1/x² dans la tranche (P(X ≥ m) = 1/m)
      $c = (int) floor($x * 100 + 1e-9); $c = max((int) round($lo * 100), min($hi > 0 ? (int) round($hi * 100) - 1 : 99999, $c));
      return ['n' => $c];
  }
  return ['n' => 0];
}
/** Ce qui est montré PENDANT les mises (avant le résultat) : High-Low, la carte de base. */
function casino_live3_pre(string $g, array $cur): array { return $g === 'hilolive' && isset($cur['b']) ? ['b' => (int) $cur['b'], 's' => (int) ($cur['s'][0] ?? 0)] : []; }
