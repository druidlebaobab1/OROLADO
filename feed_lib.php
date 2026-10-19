<?php
declare(strict_types=1);

/**
 * OROLADO — flux de prix serveur (jeu équitable).
 *
 * Principe : le prix de chaque actif est fabriqué ICI, sur le serveur, un tick toutes les
 * 250 ms, avec le générateur aléatoire cryptographique de PHP (random_int). Un tick futur
 * n'existe pas avant son heure : personne ne peut le deviner, ni le joueur, ni le code du
 * navigateur. Tout le monde voit la même courbe, et le règlement d'un trade lit simplement
 * le tick d'expiration. Aucun résultat n'est décidé à l'avance.
 *
 * Stockage : data/feed/<actif>/h<heure>.bin = prix en centimes (uint32), 4 octets par tick,
 * 14 400 ticks par fichier (1 h). state.json = dernier tick écrit.
 *
 * Les paramètres des actifs doivent rester identiques à scripts/FairCalib.cs, qui calcule
 * les lignes objectif (fair_table.php). Toute modification ici => relancer la calibration.
 */

require_once __DIR__ . '/fair_table.php';

const OROLADO_TICK_MS = 250;
const OROLADO_TICKS_PER_FILE = 14400;
const OROLADO_FEED_KEEP_FILES = 48;
// Au-delà de 3 jours sans aucune visite, on repart du dernier prix au lieu de tout recalculer.
const OROLADO_FEED_MAX_GAP = 1036800;
const OROLADO_FEED_BOOT_TICKS = 5400;
const OROLADO_DURATIONS = [5, 10, 30, 60, 300, 600];
// Payout de base : 90 % (×1,90) depuis le 2026-10-04 (avant 88 %, ×1,88). 50 % de chance.
const OROLADO_MULTS = [1.9, 5.0, 10.0, 50.0];

function orolado_feed_assets(): array {
  static $a = null;
  if ($a !== null) return $a;
  $plain = static function (float $base, float $sigma): array {
    return ['base' => $base, 'sigma' => $sigma, 'drift' => 0.0, 'jumpP' => 0.0, 'jumpMin' => 0.0, 'jumpMax' => 0.0, 'jumpDir' => 0];
  };
  $a = [
    'v100' => $plain(13000.42, 0.00020),
    'stable' => $plain(10000.00, 0.0001125),
    'apex500' => $plain(5480.25, 0.00036),
    // BAAL façon « Boom » (demande du propriétaire, 2026-10-03) : petites bougies qui descendent doucement,
    // grands pics vers le haut AU HASARD (en moyenne 1 tous les 300 ticks = 75 s, sans mémoire : attendre ne
    // rend pas un pic plus probable). Descente et pics s'équilibrent : mouvement moyen nul.
    // ORO 999 (2026-10-04) : zigzags + grands pics SURPRISE dans les deux sens (haut ou bas, à chance égale),
    // aucune pente → en 90 % la ligne est au prix d'entrée, comme les 9 autres marchés.
    'horizon50' => ['base' => 10120.40, 'sigma' => 0.00009, 'drift' => 0.0, 'jumpP' => 1 / 100, 'jumpMin' => 0.0004, 'jumpMax' => 0.003, 'jumpDir' => 2],
    'goldtrend' => $plain(7340.80, 0.000195),
    'v75' => $plain(8700.18, 0.000256),
    'nexusprime' => $plain(8120.60, 0.00027),
    'titanpulse' => $plain(9560.40, 0.00084),
    'boomspike' => $plain(3890.20, 0.00012),
    'crash300' => $plain(4210.55, 0.00022),
  ];
  // 2026-10 : indices ajoutés (indices.json, même fichier que le téléphone). Un indice mal écrit est
  // simplement ignoré (jamais d'erreur pour les 10 marchés d'origine).
  foreach (orolado_indices_defs() as $id => $d) {
    if (!isset($a[$id])) $a[$id] = $d['model'];
  }
  return $a;
}

/** Les 10 marchés d'origine : ce que reçoivent les téléphones pas encore à jour (ancien code). */
function orolado_feed_legacy_ids(): array {
  return ['v100', 'stable', 'apex500', 'horizon50', 'goldtrend', 'v75', 'nexusprime', 'titanpulse', 'boomspike', 'crash300'];
}

/**
 * Indices ajoutés (fichier indices.json) : modèle de prix vérifié + noms + lignes objectif (×5 / ×10 / ×50).
 * Modèle (toujours 50/50 : aucune pente, aucune mémoire d'un tick à l'autre, mouvements symétriques) :
 *   hold  = chance qu'un tick ne bouge pas (courbe « en marches ») ;
 *   wideP / wideK = chance d'un tick plus large (×wideK) : bougies hachées ;
 *   jumpP / jumpMin / jumpMax = pics soudains, vers le haut OU vers le bas à chance égale.
 * Lignes objectif calculées par scripts/indices-calib.js ; vérifiées par scripts/test-indices.php.
 */
function orolado_indices_defs(): array {
  static $defs = null;
  if ($defs !== null) return $defs;
  $defs = [];
  $raw = @file_get_contents(__DIR__ . '/indices.json');
  $j = is_string($raw) ? json_decode($raw, true) : null;
  if (!is_array($j) || !is_array($j['indices'] ?? null)) {
    error_log('OROLADO indices.json illisible : seuls les marchés d\'origine sont actifs');
    return $defs;
  }
  $num = static function ($v, float $min, float $max): ?float {
    if (!is_int($v) && !is_float($v)) return null;
    $f = (float) $v;
    return is_finite($f) && $f >= $min && $f <= $max ? $f : null;
  };
  foreach ($j['indices'] as $e) {
    $id = is_array($e) ? (string) ($e['id'] ?? '') : '';
    $m = is_array($e['model'] ?? null) ? $e['model'] : [];
    $base = $num($e['base'] ?? null, 100.0, 1000000.0);
    $sigma = $num($m['sigma'] ?? null, 0.00002, 0.002);
    $hold = $num($m['hold'] ?? 0, 0.0, 0.7);
    $wideP = $num($m['wideP'] ?? 0, 0.0, 0.5);
    $wideK = $num($m['wideK'] ?? 1, 1.0, 6.0);
    $jumpP = $num($m['jumpP'] ?? 0, 0.0, 0.2);
    $jumpMin = $num($m['jumpMin'] ?? 0, 0.0, 0.02);
    $jumpMax = $num($m['jumpMax'] ?? 0, 0.0, 0.02);
    if (!preg_match('/^[a-z0-9]{2,16}$/', $id) || in_array($id, orolado_feed_legacy_ids(), true) || isset($defs[$id])
      || in_array($id, ['boom300', 'pulseai'], true)
      || $base === null || $sigma === null || $hold === null || $wideP === null || $wideK === null
      || $jumpP === null || $jumpMin === null || $jumpMax === null || $jumpMin > $jumpMax) {
      error_log('OROLADO indices.json : indice ignoré (' . $id . ')');
      continue;
    }
    $fair = [];
    foreach (OROLADO_DURATIONS as $dur) {
      $row = $e['fair'][(string) $dur] ?? null;
      if (!is_array($row) || count($row) !== 7) { $fair = null; break; }
      $row = array_map('floatval', array_values($row));
      // Lignes ×5 < ×10 < ×50 au-dessus (achat), en miroir (en log) en dessous (vente), jamais au-delà de ±50 %.
      if (!($row[1] > 0 && $row[2] > $row[1] && $row[3] > $row[2] && $row[3] < 0.5 && $row[4] < 0 && $row[5] < $row[4] && $row[6] < $row[5] && $row[6] > -0.5)
        || abs(log(1 + $row[1]) + log(1 + $row[4])) > 1e-6 || abs(log(1 + $row[3]) + log(1 + $row[6])) > 1e-6) { $fair = null; break; }
      $fair[(string) $dur] = $row;
    }
    $defs[$id] = [
      'name' => strtoupper(substr(preg_replace('/[^A-Za-z0-9 ]/', '', (string) ($e['name'] ?? $id)) ?? $id, 0, 12)),
      // ext = 1 : mouvement en log (voir orolado_feed_step) et ligne 90 % corrigée de l'élastique.
      'model' => ['base' => $base, 'sigma' => $sigma, 'drift' => 0.0, 'jumpP' => $jumpP, 'jumpMin' => $jumpMin,
        'jumpMax' => $jumpMax, 'jumpDir' => 2, 'hold' => $hold, 'wideP' => $wideP, 'wideK' => $wideK, 'ext' => 1],
      // Sans lignes ×5 / ×10 / ×50 valides, l'indice n'est pas ouvert (voir orolado_feed_assets).
      'fair' => $fair,
    ];
    if ($fair === null) {
      error_log('OROLADO indices.json : lignes objectif absentes pour ' . $id . ' (indice fermé)');
      unset($defs[$id]);
    }
  }
  return $defs;
}

/** Nom affiché d'un marché (admin, reçus) ; '' si inconnu. */
function orolado_feed_asset_name(string $id): string {
  static $legacy = [
    'v100' => 'VOLATILITY', 'stable' => 'COBRA', 'apex500' => 'BAAL', 'horizon50' => 'ORO 999',
    'crash300' => 'AZAZEL', 'goldtrend' => 'OROF', 'boomspike' => 'VALAC', 'nexusprime' => 'ASMODUS',
    'v75' => 'ZUL', 'titanpulse' => 'APOCALYPSE',
  ];
  $k = strtolower(trim($id));
  if (isset($legacy[$k])) return $legacy[$k];
  $d = orolado_indices_defs()[$k] ?? null;
  return $d ? (string) $d['name'] : '';
}

function orolado_feed_asset_id(string $id): string {
  $id = preg_replace('/[^a-z0-9]/', '', strtolower($id)) ?? '';
  if ($id === 'boom300' || $id === 'pulseai') $id = 'titanpulse';
  return isset(orolado_feed_assets()[$id]) ? $id : '';
}

function orolado_feed_now_ms(): int {
  return (int) floor(microtime(true) * 1000);
}

function orolado_feed_tick_at(int $ms): int {
  return intdiv($ms, OROLADO_TICK_MS);
}

function orolado_feed_dir(string $asset): string {
  $dir = __DIR__ . '/data/feed/' . $asset;
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  return $dir;
}

/** Uniforme ]0,1[ issu du générateur cryptographique. */
function orolado_feed_u(): float {
  return (random_int(0, 9007199254740991) + 0.5) / 9007199254740992.0;
}

function orolado_feed_z(): float {
  $u = orolado_feed_u();
  $v = orolado_feed_u();
  return sqrt(-2.0 * log($u)) * cos(2.0 * M_PI * $v);
}

/**
 * « Élastique » très mou vers le prix de départ, pour que les indices restent dans une zone
 * saine pendant des années (sans lui, un hasard pur finit par partir vers 0 ou vers l'infini).
 * Réglé pour qu'à long terme le prix reste en général entre ~0,5× et ~2× son départ
 * (écart-type du log-prix = OROLADO_PRICE_BAND). Sur un trade de 10 min, l'effet est
 * d'environ 1 à 3 % du mouvement normal : imperceptible, et le rendu aux joueurs ne change pas.
 */
const OROLADO_PRICE_BAND = 0.35;

/** Variance (log) d'un tick : sigma² (+ pics). Indices ajoutés : pauses et ticks larges compris. */
function orolado_feed_tick_var(array $a): float {
  $var = $a['sigma'] * $a['sigma'];
  $hold = (float) ($a['hold'] ?? 0);
  $wideP = (float) ($a['wideP'] ?? 0);
  if ($hold > 0 || $wideP > 0) {
    $k = (float) ($a['wideK'] ?? 1);
    $var *= (1.0 - $hold) * (1.0 - $wideP + $wideP * $k * $k);
  }
  if (($a['jumpP'] ?? 0) > 0) {
    $jmin = (float) $a['jumpMin']; $jmax = (float) $a['jumpMax'];
    $var += $a['jumpP'] * ($jmin * $jmin + $jmin * $jmax + $jmax * $jmax) / 3.0;
  }
  return $var;
}

function orolado_feed_pull(array $a): float {
  return orolado_feed_tick_var($a) / (2.0 * OROLADO_PRICE_BAND * OROLADO_PRICE_BAND);
}

/** Un tick, en centimes entiers. Copie exacte de FairCalib.Step (C#) pour les 10 marchés d'origine. */
function orolado_feed_step(array $a, int $cents): int {
  if (!empty($a['ext'])) return orolado_feed_step_ext($a, $cents);
  $hold = (float) ($a['hold'] ?? 0);
  $wideP = (float) ($a['wideP'] ?? 0);
  if ($hold <= 0 && $wideP <= 0) {
    $rel = $a['sigma'] * orolado_feed_z() + $a['drift'];
  } else if ($hold > 0 && orolado_feed_u() < $hold) {
    // Indice « en marches » : ce tick ne bouge pas (sauf pic). Même chance à chaque tick, sans mémoire.
    $rel = (float) $a['drift'];
  } else {
    $s = $wideP > 0 && orolado_feed_u() < $wideP ? $a['sigma'] * (float) $a['wideK'] : $a['sigma'];
    $rel = $s * orolado_feed_z() + $a['drift'];
  }
  $baseCents = (float) $a['base'] * 100.0;
  if ($cents > 0 && $baseCents > 0) $rel -= orolado_feed_pull($a) * log($cents / $baseCents);
  if ($a['jumpP'] > 0 && orolado_feed_u() < $a['jumpP']) {
    // jumpDir = 2 : pic vers le haut OU vers le bas, au hasard à chance égale (ORO 999).
    $dir = (int) $a['jumpDir'] === 2 ? (orolado_feed_u() < 0.5 ? -1 : 1) : $a['jumpDir'];
    $rel += $dir * ($a['jumpMin'] + ($a['jumpMax'] - $a['jumpMin']) * orolado_feed_u());
  }
  $next = $cents + (int) round($cents * $rel, 0, PHP_ROUND_HALF_UP);
  return $next < 100 ? 100 : $next;
}

/**
 * Un tick d'un marché ajouté (indices.json). Même idée que les 10 d'origine, mais le mouvement est
 * appliqué en LOG (prix × e^mouvement au lieu de prix × (1 + mouvement)) : un mouvement de +x et un
 * de −x se compensent exactement, donc sur n'importe quelle durée la hausse et la baisse ont
 * exactement la même chance (avec « prix × (1 + x) », la baisse gagnait d'un cheveu sur 10 min).
 *   - pause (hold) : ce tick ne bouge pas ; tick large (wideP, ×wideK) ; pic (jumpP) ± au hasard ;
 *   - aucune mémoire d'un tick à l'autre : rien à « attendre », rien à deviner ;
 *   - élastique très mou vers le prix de départ (comme les 10 d'origine) + garde-fou : le prix reste
 *     toujours entre 1/20 et 20 fois son départ (jamais 0, jamais l'infini ; en pratique jamais atteint).
 */
function orolado_feed_step_ext(array $a, int $cents): int {
  $baseCents = (float) $a['base'] * 100.0;
  $lo = (int) max(100, floor($baseCents / 20));
  $hi = (int) ceil($baseCents * 20);
  if ($cents < $lo || $cents > $hi) $cents = $cents < $lo ? $lo : $hi;
  $hold = (float) ($a['hold'] ?? 0);
  $wideP = (float) ($a['wideP'] ?? 0);
  if ($hold > 0 && orolado_feed_u() < $hold) {
    $x = 0.0;
  } else {
    $s = $wideP > 0 && orolado_feed_u() < $wideP ? $a['sigma'] * (float) $a['wideK'] : $a['sigma'];
    $x = $s * orolado_feed_z();
  }
  $x -= orolado_feed_pull($a) * log($cents / $baseCents);
  if ($a['jumpP'] > 0 && orolado_feed_u() < $a['jumpP']) {
    $x += (orolado_feed_u() < 0.5 ? -1 : 1) * ($a['jumpMin'] + ($a['jumpMax'] - $a['jumpMin']) * orolado_feed_u());
  }
  $next = $cents * exp($x);
  if (!is_finite($next)) return $cents;
  $next = (int) round($next, 0, PHP_ROUND_HALF_UP);
  return $next < $lo ? $lo : ($next > $hi ? $hi : $next);
}

function orolado_feed_state_read(string $asset): ?array {
  $raw = @file_get_contents(orolado_feed_dir($asset) . '/state.json');
  if (!is_string($raw) || $raw === '') return null;
  $j = json_decode($raw, true);
  if (!is_array($j) || !isset($j['n'], $j['c'])) return null;
  return ['n' => (int) $j['n'], 'c' => (int) $j['c']];
}

function orolado_feed_state_write(string $asset, int $n, int $c): void {
  $dir = orolado_feed_dir($asset);
  $tmp = $dir . '/state.' . bin2hex(random_bytes(4)) . '.tmp';
  file_put_contents($tmp, json_encode(['n' => $n, 'c' => $c, 'at' => date('c')]));
  if (!@rename($tmp, $dir . '/state.json')) {
    @unlink($dir . '/state.json');
    @rename($tmp, $dir . '/state.json');
  }
}

/** Écrit une suite de ticks consécutifs [first .. first+count-1]. */
function orolado_feed_write_ticks(string $asset, int $first, array $cents): void {
  $dir = orolado_feed_dir($asset);
  $i = 0;
  $total = count($cents);
  while ($i < $total) {
    $tick = $first + $i;
    $file = intdiv($tick, OROLADO_TICKS_PER_FILE);
    $pos = $tick % OROLADO_TICKS_PER_FILE;
    $take = min($total - $i, OROLADO_TICKS_PER_FILE - $pos);
    $bin = pack('V*', ...array_slice($cents, $i, $take));
    $fp = @fopen($dir . '/h' . $file . '.bin', 'c+b');
    if (!$fp) throw new RuntimeException('feed: écriture impossible');
    fseek($fp, $pos * 4);
    fwrite($fp, $bin);
    fflush($fp);
    fclose($fp);
    $i += $take;
  }
}

function orolado_feed_prune(string $asset, int $nowTick): void {
  $keepFrom = intdiv($nowTick, OROLADO_TICKS_PER_FILE) - OROLADO_FEED_KEEP_FILES;
  foreach ((array) glob(orolado_feed_dir($asset) . '/h*.bin') as $f) {
    if (preg_match('/h(\d+)\.bin$/', (string) $f, $m) && (int) $m[1] < $keepFrom) @unlink((string) $f);
  }
}

/**
 * Fait avancer la courbe jusqu'au tick courant. Retourne l'état à jour ['n' => tick, 'c' => centimes].
 * Un seul processus écrit à la fois (verrou), les lecteurs n'attendent jamais.
 */
function orolado_feed_advance(string $asset): array {
  $a = orolado_feed_assets()[$asset];
  $now = orolado_feed_tick_at(orolado_feed_now_ms());
  $st = orolado_feed_state_read($asset);
  if ($st && $st['n'] >= $now) return $st;

  $lock = @fopen(orolado_feed_dir($asset) . '/state.lock', 'c');
  if (!$lock || !flock($lock, LOCK_EX)) {
    if ($lock) fclose($lock);
    if ($st) return $st;
    throw new RuntimeException('feed: verrou impossible');
  }
  try {
    $st = orolado_feed_state_read($asset);
    if ($st && $st['n'] >= $now) return $st;
    if (!$st) {
      $n = $now - OROLADO_FEED_BOOT_TICKS;
      $c = (int) round($a['base'] * 100);
    } else {
      $n = $st['n'];
      $c = $st['c'];
      if ($now - $n > OROLADO_FEED_MAX_GAP) $n = $now - OROLADO_FEED_BOOT_TICKS;
    }
    $first = $n + 1;
    $out = [];
    for ($t = $first; $t <= $now; $t++) {
      $c = orolado_feed_step($a, $c);
      $out[] = $c;
      if (count($out) >= 20000) {
        orolado_feed_write_ticks($asset, $first, $out);
        $first += count($out);
        $out = [];
      }
    }
    if ($out) orolado_feed_write_ticks($asset, $first, $out);
    orolado_feed_state_write($asset, $now, $c);
    if (!$st || intdiv($st['n'], OROLADO_TICKS_PER_FILE) !== intdiv($now, OROLADO_TICKS_PER_FILE)) {
      orolado_feed_prune($asset, $now);
    }
    return ['n' => $now, 'c' => $c];
  } finally {
    flock($lock, LOCK_UN);
    fclose($lock);
  }
}

/** Lit les ticks [from .. to] (déjà générés). 0 = tick absent (trou après une longue pause). */
function orolado_feed_read(string $asset, int $from, int $to): array {
  $dir = orolado_feed_dir($asset);
  $out = [];
  $t = $from;
  while ($t <= $to) {
    $file = intdiv($t, OROLADO_TICKS_PER_FILE);
    $pos = $t % OROLADO_TICKS_PER_FILE;
    $take = min($to - $t + 1, OROLADO_TICKS_PER_FILE - $pos);
    $bin = '';
    $fp = @fopen($dir . '/h' . $file . '.bin', 'rb');
    if ($fp) {
      fseek($fp, $pos * 4);
      $bin = (string) fread($fp, $take * 4);
      fclose($fp);
    }
    $vals = strlen($bin) >= 4 ? array_values(unpack('V*', substr($bin, 0, intdiv(strlen($bin), 4) * 4))) : [];
    for ($k = 0; $k < $take; $k++) $out[] = (int) ($vals[$k] ?? 0);
    $t += $take;
  }
  return $out;
}

/** Prix (centimes) d'un tick déjà passé, ou null s'il n'existe pas. */
function orolado_feed_price_at(string $asset, int $tick): ?int {
  $st = orolado_feed_advance($asset);
  if ($tick > $st['n']) return null;
  $v = orolado_feed_read($asset, $tick, $tick)[0] ?? 0;
  return $v > 0 ? $v : null;
}

/* ---------------------------------------------------------------------------------------
 * Règles du jeu : lignes objectif et verdict. Identiques pour tous (démo, réel, admin).
 * ------------------------------------------------------------------------------------- */

function orolado_fair_mult(float $m): float {
  foreach (OROLADO_MULTS as $ok) {
    if (abs($ok - $m) < 0.001) return $ok;
  }
  // Ancienne version (téléphone pas encore à jour) qui demande 1,88 : le joueur reçoit 1,90 (à son avantage).
  return 1.9;
}

function orolado_fair_duration(int $d): int {
  return in_array($d, OROLADO_DURATIONS, true) ? $d : 10;
}

/** Ligne gagnante en centimes. CALL gagne au-dessus, PUT en dessous, pile dessus = mise rendue. */
function orolado_fair_barrier(string $asset, int $duration, string $side, float $mult, int $entryCents): int {
  $row = orolado_fair_table()[$asset][(string) $duration] ?? (orolado_indices_defs()[$asset]['fair'][(string) $duration] ?? null);
  if (!is_array($row) || count($row) < 7) throw new RuntimeException('fair: table absente');
  $mult = orolado_fair_mult($mult);
  $idx = 0;
  if ($mult === 5.0) $idx = 1;
  else if ($mult === 10.0) $idx = 2;
  else if ($mult === 50.0) $idx = 3;
  if ($idx > 0 && $side === 'put') $idx += 3;
  // Payout de base (90 %) : les 10 marchés sont à pile ou face (aucune pente) → la ligne est TOUJOURS
  // exactement le prix d'entrée (le petit écart de la table n'est que le bruit du calcul). Pas de ligne objectif.
  $rel = $idx === 0 ? 0.0 : (float) $row[$idx];
  // Marchés ajoutés : la ligne 90 % suit AUSSI le petit retour attendu vers le prix de départ (même calcul
  // que pour ×5 / ×10 / ×50). Ainsi hausse et baisse ont exactement 50 % de chance, quel que soit le prix
  // du moment (au prix de départ : ligne = prix d'entrée). Les 10 marchés d'origine ne changent pas.
  if ($idx === 0 && !empty(orolado_feed_assets()[$asset]['ext'])) {
    return (int) round($entryCents * exp(orolado_fair_drift($asset, $duration, $entryCents)), 0, PHP_ROUND_HALF_UP);
  }
  // Gros payouts (×5, ×10, ×50) : la ligne suit aussi le petit retour attendu vers le prix de
  // départ (l'élastique). Sans ça, quand un prix est très loin de sa base (ex. moitié), jouer
  // « vers la base » en ×50 sur 10 min rapportait ~108 % : une faille rare mais réelle.
  // Au prix de base, rien ne change. Le 88 % garde sa ligne au prix d'entrée.
  if ($idx > 0) $rel = (1 + $rel) * exp(orolado_fair_drift($asset, $duration, $entryCents)) - 1;
  return (int) round($entryCents * (1 + $rel), 0, PHP_ROUND_HALF_UP);
}

/** Mouvement relatif (log) attendu à cause de l'élastique pendant la durée du trade. */
function orolado_fair_drift(string $asset, int $duration, int $entryCents): float {
  $a = orolado_feed_assets()[$asset] ?? null;
  if (!is_array($a) || $entryCents <= 0) return 0.0;
  $base = (float) $a['base'] * 100.0;
  if ($base <= 0) return 0.0;
  $ticks = intdiv($duration * 1000, OROLADO_TICK_MS);
  return -(1.0 - pow(1.0 - orolado_feed_pull($a), $ticks)) * log($entryCents / $base);
}

/** 'won' | 'lost' | 'void' */
function orolado_fair_verdict(string $side, int $exitCents, int $barrierCents): string {
  if ($exitCents === $barrierCents) return 'void';
  $won = $side === 'put' ? $exitCents < $barrierCents : $exitCents > $barrierCents;
  return $won ? 'won' : 'lost';
}

function orolado_fair_credit(string $verdict, float $stake, float $mult): float {
  if ($verdict === 'void') return round($stake, 2);
  if ($verdict === 'won') return round($stake * $mult, 2);
  return 0.0;
}

/* ---------------------------------------------------------------------------------------
 * Limites de risque : publiques, identiques pour tous. Réglables dans .env.
 * ------------------------------------------------------------------------------------- */

function orolado_fair_env_float(string $key, float $def): float {
  $v = getenv($key);
  if ($v === false || $v === '') $v = $_ENV[$key] ?? '';
  return is_numeric($v) && (float) $v > 0 ? (float) $v : $def;
}

/** Plafonds (0 = aucun, choix du propriétaire). Réactivables via .env si besoin. */
/** Gain maximum possible sur un seul trade (mise × cote). */
function orolado_limit_max_payout(): float {
  return orolado_fair_env_float('OROLADO_MAX_PAYOUT_PER_TRADE', 0.0);
}

/** Gains potentiels maximum de tous les trades réels ouverts sur un même actif. */
function orolado_limit_asset_exposure(): float {
  return orolado_fair_env_float('OROLADO_MAX_ASSET_EXPOSURE', 0.0);
}

/** Gains potentiels maximum des trades réels ouverts d'un même joueur. */
function orolado_limit_user_exposure(): float {
  return orolado_fair_env_float('OROLADO_MAX_USER_EXPOSURE', 0.0);
}
