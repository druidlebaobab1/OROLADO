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
  'tower', 'dragon', 'baccarat', 'sicbo', 'chests', 'balloon', 'darts'];
const CASINO_MULTI = ['crash', 'jet', 'rocket', 'hilo', 'mines', 'apple', 'tower', 'balloon', 'penalty']; // jeux en plusieurs étapes (état gardé par le serveur)
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
/** Pomme de la fortune : multiplicateur après $k étages réussis (1 pomme pourrie sur 5 → 80 % de chances par étage). */
function casino_apple_mult(int $k, int $lv = 1): float { $p = (5 - max(1, min(4, $lv))) / 5; return $k < 1 ? 0.0 : floor(CASINO_EDGE / pow($p, $k) * 100) / 100; }
/** Verger : pommes pourries d'un étage (liste ; ancien format = un seul nombre). */
function casino_apple_bad(array $g, int $row): array { $b = $g['bad'][$row] ?? []; return is_array($b) ? array_map('intval', $b) : [(int) $b]; }

// Tables publiques (affichées telles quelles par le navigateur).
// v2690b — roue casino : 24 cases [multiplicateur, chances sur 1000] ; chaque case est DESSINÉE à la taille de sa chance
// (honnête : le ×50 est une toute petite case). Retour aux joueurs 94,6 %.
// v2691 (propriétaire : « trop de zéros ») : 21 cases [multiplicateur, chances sur 10 000], ×0,5 = moitié rendue.
// Zéro 25 %, moitié rendue 32 %, gain 43 %. Retour aux joueurs 95 %.
const CASINO_WHEEL = [[0.5, 640], [1.2, 500], [0, 630], [1.5, 550], [0.5, 640], [2, 325], [0, 630], [1.2, 500], [0.5, 640], [3, 350], [0, 631], [1.2, 500], [0.5, 640], [5, 120], [1.5, 550], [0, 631], [0.5, 640], [1.2, 500], [2, 325], [10, 50], [50, 8]];
const CASINO_PLINKO = [12, 3, 1.4, 0.6, 0.4, 0.6, 1.4, 3, 12];                                      // 8 rangées, retour 95,9 %
const CASINO_KENO = [0, 0.6, 3.5, 25];                                                               // 3 numéros choisis sur 20, 5 tirés : retour 95,6 %
const CASINO_RACE_MULT = 5.7;                                                                         // 6 voitures : retour 95 %
const CASINO_COIN_MULT = 1.94;                                                                        // retour 97 %
const CASINO_PENALTY_MULT = 1.44;                                                                     // 3 zones, le gardien en couvre 1 : retour 96 %
const CASINO_EDGE = 0.97;                                                                             // dés, limbo, avion, mines, hi-lo
// Machine à sous : [catégorie, multiplicateur, chances sur 1000] — retour 96 %
const CASINO_SLOTS = [['gem', 50, 1], ['seven', 20, 4], ['bell', 10, 10], ['lemon', 5, 30], ['cherry3', 3, 60], ['cherry2', 1.5, 260]];
// Grattage : [multiplicateur, chances sur 1000] — retour 96 %
const CASINO_SCRATCH = [[20, 10], [5, 40], [2, 120], [1, 320]];
// v2694 — Fléchettes : [multiplicateur, chances sur 10 000] — centre ×20, anneaux ×5 / ×2 / ×1, bord ×0 : retour 95 %
const CASINO_DARTS = [[20, 100], [5, 400], [2, 1500], [1, 2500], [0, 5500]];

function casino_money(float $v): float { return round($v + 1e-9, 2); }
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

/* ---------------------------------------------------------------- tirages (purs, testables) */

/** Résultat d'un jeu instantané : ['mult' => gain ÷ mise, 'view' => ce que le navigateur dessine] ou ['err' => …]. */
function casino_instant(string $game, array $p, float $stake): array {
  switch ($game) {
    case 'coin':
      $side = ((int) ($p['side'] ?? 0)) === 1 ? 1 : 0;
      $r = random_int(0, 1);
      return ['mult' => $r === $side ? CASINO_COIN_MULT : 0.0, 'view' => ['r' => $r]];
    case 'dice':
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
    case 'race':
      $pick = max(0, min(5, (int) ($p['car'] ?? 0)));
      $order = [0, 1, 2, 3, 4, 5];
      for ($i = 5; $i > 0; $i--) { $j = random_int(0, $i); [$order[$i], $order[$j]] = [$order[$j], $order[$i]]; }
      return ['mult' => $order[0] === $pick ? CASINO_RACE_MULT : 0.0, 'view' => ['order' => $order]];
    case 'roulette':
      $bet = (string) ($p['bet'] ?? 'red');
      $n = random_int(0, 36);
      $reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      $red = in_array($n, $reds, true);
      $m = 0.0;
      if ($bet === 'red') $m = ($n > 0 && $red) ? 2 : 0;
      elseif ($bet === 'black') $m = ($n > 0 && !$red) ? 2 : 0;
      elseif ($bet === 'even') $m = ($n > 0 && $n % 2 === 0) ? 2 : 0;
      elseif ($bet === 'odd') $m = ($n % 2 === 1) ? 2 : 0;
      elseif (preg_match('/^d([123])$/', $bet, $mm)) { $d = (int) $mm[1]; $m = ($n >= ($d - 1) * 12 + 1 && $n <= $d * 12) ? 3 : 0; }
      elseif (preg_match('/^n(\d{1,2})$/', $bet, $mm) && (int) $mm[1] <= 36) { $m = $n === (int) $mm[1] ? 36 : 0; }
      else return ['err' => 'param'];
      return ['mult' => (float) $m, 'view' => ['n' => $n, 'red' => $red]];
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
      if ($bet === 'green') $m = in_array($n, [1, 3, 7, 9], true) ? 2 : ($n === 5 ? 1.5 : 0);
      elseif ($bet === 'red') $m = in_array($n, [2, 4, 6, 8], true) ? 2 : ($n === 0 ? 1.5 : 0);
      elseif ($bet === 'violet') $m = in_array($n, [0, 5], true) ? 4.5 : 0;
      elseif (preg_match('/^n(\d)$/', $bet, $mm)) $m = $n === (int) $mm[1] ? 9 : 0;
      else return ['err' => 'param'];
      return ['mult' => (float) $m, 'view' => ['n' => $n]];
    case 'dragon':
      $bet = (string) ($p['bet'] ?? 'dragon');
      if (!in_array($bet, ['dragon', 'tiger', 'tie'], true)) return ['err' => 'param'];
      $dr = random_int(1, 13); $ti = random_int(1, 13);
      if ($bet === 'tie') $m = $dr === $ti ? 12.0 : 0.0;
      elseif ($dr === $ti) $m = 0.5; // égalité : la moitié de la mise est rendue
      else $m = (($bet === 'dragon') === ($dr > $ti)) ? 2.0 : 0.0;
      return ['mult' => $m, 'view' => ['d' => $dr, 't' => $ti]];
    case 'baccarat':
      $bet = (string) ($p['bet'] ?? 'player');
      if (!in_array($bet, ['player', 'banker', 'tie'], true)) return ['err' => 'param'];
      [$pc, $bc, $tp, $tb] = casino_baccarat_deal();
      if ($tp === $tb) $m = $bet === 'tie' ? 9.0 : 1.0; // égalité : Joueur / Banque remboursés
      elseif ($bet === 'player') $m = $tp > $tb ? 1.96 : 0.0;
      elseif ($bet === 'banker') $m = $tb > $tp ? 1.92 : 0.0;
      else $m = 0.0;
      return ['mult' => $m, 'view' => ['p' => $pc, 'b' => $bc, 'tp' => $tp, 'tb' => $tb]];
    case 'sicbo':
      $bet = (string) ($p['bet'] ?? 'small');
      if (!in_array($bet, ['small', 'big'], true)) return ['err' => 'param'];
      $dice = [random_int(1, 6), random_int(1, 6), random_int(1, 6)];
      $sum = array_sum($dice); $triple = $dice[0] === $dice[1] && $dice[1] === $dice[2];
      $win = !$triple && ($bet === 'small' ? ($sum >= 4 && $sum <= 10) : ($sum >= 11 && $sum <= 17));
      return ['mult' => $win ? 2.0 : 0.0, 'view' => ['dice' => $dice, 'sum' => $sum, 'triple' => $triple]];
    case 'chests':
      $pick = max(0, min(2, (int) ($p['pick'] ?? 0)));
      $gold = random_int(0, 2);
      return ['mult' => $gold === $pick ? 2.85 : 0.0, 'view' => ['gold' => $gold, 'pick' => $pick]];
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
  for ($j = 0; $j < $k; $j++) $x *= (25 - $j) / (25 - $m - $j);
  return floor($x * 100) / 100;
}
/** Penalty : multiplicateur après $k buts. */
function casino_pen_mult(int $k): float { return $k < 1 ? 0.0 : floor(0.96 * pow(1.5, $k) * 100 + 1e-6) / 100; }
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

function casino_hist_add(string $uid, array $row): void {
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
    if (!in_array((string) $g, CASINO_GAMES, true)) continue;
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
  // v2690b : réel seulement pour les joueurs. Le compte ADMIN joue sur son solde de test (démo) pour vérifier les jeux en ligne.
  if ($user && function_exists('orolado_is_admin_user') && orolado_is_admin_user($user)) return 'demo';
  return 'real';
}

/** Jeu instantané : mise → tirage → gain, en un seul appel. */
function casino_play(array $db, ?array $user, string $game, string $mode, float $stake, array $p): array {
  if (!in_array($game, CASINO_GAMES, true) || in_array($game, CASINO_MULTI, true)) return ['ok' => false, 'reason' => 'game'];
  $stake = floor($stake * 100 + 1e-6) / 100;
  if ($e = casino_check_stake($stake, $game)) return ['ok' => false, 'reason' => $e];
  // Limbo : on refuse une cible dont le gain dépasserait le gain maximal.
  if ($game === 'limbo' && $stake * (float) ($p['target'] ?? 2) > CASINO_MAX_WIN) return ['ok' => false, 'reason' => 'maxWin'];
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  $mode = casino_mode($mode, false, $user);
  $res = casino_instant($game, $p, $stake);
  if (isset($res['err'])) return ['ok' => false, 'reason' => $res['err']];
  $ref = 'cs_' . bin2hex(random_bytes(9));
  $deb = casino_debit($db, $uid, $mode, $stake, $ref);
  if (empty($deb['ok'])) return ['ok' => false, 'reason' => $deb['reason'] ?? 'unavailable'];
  $win = casino_money(min(CASINO_MAX_WIN, $stake * (float) $res['mult']));
  $bal = casino_credit($db, $uid, $mode, $win, $ref);
  if ($mode !== 'try') {
    casino_stat($game, $mode, $stake, $win);
    casino_hist_add($uid, ['g' => $game, 'm' => $mode, 's' => $stake, 'w' => $win, 'at' => time()]);
  }
  return ['ok' => true, 'game' => $game, 'mode' => $mode, 'stake' => $stake, 'mult' => (float) $res['mult'], 'win' => $win, 'view' => $res['view'],
    'bal' => $bal, 'pending' => $bal === null && $mode === 'real' ? 1 : 0];
}

/** Jeux en plusieurs étapes (avion, mines, hi-lo) : une partie à la fois par jeu et par joueur, gardée par le serveur. */
function casino_multi(array $db, array $user, string $game, string $act, string $mode, float $stake, array $p): array {
  if (!in_array($game, CASINO_MULTI, true)) return ['ok' => false, 'reason' => 'game'];
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  $file = casino_user_file($uid);
  $now = microtime(true);

  if ($act === 'start') {
    $stake = floor($stake * 100 + 1e-6) / 100;
    if ($e = casino_check_stake($stake, $game)) return ['ok' => false, 'reason' => $e];
    $mode = casino_mode($mode, false, $user);
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
      $g['c'] = casino_crash_point();
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
      $m = max(1, min(10, (int) ($p['mines'] ?? 3)));
      $cells = range(0, 24);
      for ($i = 24; $i > 0; $i--) { $j = random_int(0, $i); [$cells[$i], $cells[$j]] = [$cells[$j], $cells[$i]]; }
      $g['m'] = $m; $g['mines'] = array_slice($cells, 0, $m); $g['open'] = [];
    } else { // hilo
      $g['card'] = random_int(1, 13); $g['k'] = 0; $g['mult'] = 1.0; $g['cards'] = [$g['card']];
    }
    casino_with($file, static function (array &$st) use ($game, $g) { $st['g'][$game] = $g; return true; });
    return ['ok' => true, 'now' => $now] + casino_public($game, $g, $now);
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
        $m = casino_crash_mult($now - (float) $g['t0']);
        if (!empty($g['auto']) && $g['auto'] <= $m && $g['auto'] < $g['c']) $m = (float) $g['auto'];
        if ($m >= (float) $g['c']) { $g['done'] = 1; $g['out'] = 0; $g['win'] = 0.0; }
        else { $g['done'] = 1; $g['out'] = $m; $g['win'] = casino_money(min(CASINO_MAX_WIN, (float) $g['stake'] * $m)); }
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
          if ($g['k'] >= $max || $g['stake'] * $multf($g['k']) >= CASINO_MAX_WIN) { $g['done'] = 1; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * $multf($g['k']))); }
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
        $g['done'] = 1; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * $multf((int) $g['k'])));
        $st['g'][$game] = $g;
        return $g;
      });
      if (empty($r['done'])) return ['ok' => false, 'reason' => 'param'];
      return casino_finish($db, $uid, $game, $r, $now);
    }
  }
  if ($game === 'penalty') {
    if ($act === 'shoot') {
      $aim = (int) ($p['aim'] ?? -1); $hgt = max(0, min(2, (int) ($p['h'] ?? 0))); // hauteur : dessin seulement
      if ($aim < 0 || $aim > 2) return ['ok' => false, 'reason' => 'param'];
      $r = casino_with($file, static function (array &$st) use ($game, $aim, $hgt) {
        $g = $st['g'][$game];
        if (!empty($g['done'])) return $g;
        $keeper = random_int(0, 2);
        $goal = $keeper !== $aim;
        $g['shots'][] = [$aim, $hgt, $keeper, $goal ? 1 : 0];
        if (!$goal) { $g['done'] = 1; $g['win'] = 0.0; $g['boom'] = (int) $g['k']; }
        else {
          $g['k'] = (int) $g['k'] + 1;
          if ($g['k'] >= CASINO_PEN_ROWS || $g['stake'] * casino_pen_mult($g['k']) >= CASINO_MAX_WIN) { $g['done'] = 1; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * casino_pen_mult($g['k']))); }
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
        $g['done'] = 1; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * casino_pen_mult((int) $g['k'])));
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
          if ($g['k'] >= CASINO_APPLE_ROWS || $g['stake'] * $mm >= CASINO_MAX_WIN) { $g['done'] = 1; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * $mm)); }
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
        $g['done'] = 1; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * casino_apple_mult((int) $g['k'], (int) ($g['lv'] ?? 1))));
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
          if (count($g['open']) >= 25 - $g['m']) { $g['done'] = 1; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * casino_mines_mult($g['m'], count($g['open'])))); }
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
        $g['done'] = 1; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * casino_mines_mult($g['m'], count($g['open']))));
        $st['g'][$game] = $g;
        return $g;
      });
      if (empty($r['done'])) return ['ok' => false, 'reason' => 'param'];
      return casino_finish($db, $uid, $game, $r, $now);
    }
  }
  if ($game === 'hilo') {
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
        $g['done'] = 1; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * $g['mult']));
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
    $m = casino_crash_mult($now - (float) $g['t0']);
    if (!empty($g['auto']) && $g['auto'] < $g['c'] && $m >= $g['auto']) { $g['done'] = 1; $g['out'] = (float) $g['auto']; $g['win'] = casino_money(min(CASINO_MAX_WIN, $g['stake'] * $g['auto'])); }
    elseif ($m >= (float) $g['c']) { $g['done'] = 1; $g['out'] = 0; $g['win'] = 0.0; }
    else return $g;
    $st['g'][$game] = $g;
    return $g;
  });
  if (is_array($r) && !empty($r['done']) && empty($r['paid'])) casino_finish($db, $uid, $game, $r, $now);
  return $r;
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
      casino_hist_add($uid, ['g' => $game, 'm' => $g['mode'], 's' => (float) $g['stake'], 'w' => (float) ($g['win'] ?? 0), 'at' => time()]);
    }
  }
  $g['paid'] = 1;
  return ['ok' => true, 'bal' => $bal] + casino_public($game, $g, $now);
}

/** Ce que le navigateur a le droit de voir (jamais le point d'explosion ni les mines avant la fin). */
function casino_public(string $game, array $g, float $now): array {
  $o = ['game' => $game, 'mode' => (string) $g['mode'], 'stake' => (float) $g['stake'], 'done' => !empty($g['done']) ? 1 : 0, 'win' => (float) ($g['win'] ?? 0)];
  if (casino_is_crash($game)) {
    $o['t0'] = (float) $g['t0']; $o['auto'] = (float) ($g['auto'] ?? 0);
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
  }
  return $o;
}

function casino_history(string $uid): array {
  return (array) (casino_with(casino_user_file($uid), static fn(array &$st) => $st['h'] ?? []) ?: []);
}
