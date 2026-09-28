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
const OROLADO_MULTS = [1.88, 5.0, 10.0, 50.0];

function orolado_feed_assets(): array {
  static $a = null;
  if ($a !== null) return $a;
  $plain = static function (float $base, float $sigma): array {
    return ['base' => $base, 'sigma' => $sigma, 'drift' => 0.0, 'jumpP' => 0.0, 'jumpMin' => 0.0, 'jumpMax' => 0.0, 'jumpDir' => 0];
  };
  $a = [
    'v100' => $plain(13000.42, 0.00020),
    'stable' => $plain(10000.00, 0.000045),
    'apex500' => $plain(5480.25, 0.00024),
    'horizon50' => $plain(10120.40, 0.000035),
    'goldtrend' => $plain(7340.80, 0.00015),
    'v75' => $plain(8700.18, 0.00016),
    'nexusprime' => $plain(8120.60, 0.00018),
    'titanpulse' => $plain(9560.40, 0.00028),
    'boomspike' => $plain(3890.20, 0.00012),
    'crash300' => $plain(4210.55, 0.00022),
  ];
  return $a;
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

function orolado_feed_pull(array $a): float {
  $var = $a['sigma'] * $a['sigma'];
  if (($a['jumpP'] ?? 0) > 0) {
    $jmin = (float) $a['jumpMin']; $jmax = (float) $a['jumpMax'];
    $var += $a['jumpP'] * ($jmin * $jmin + $jmin * $jmax + $jmax * $jmax) / 3.0;
  }
  return $var / (2.0 * OROLADO_PRICE_BAND * OROLADO_PRICE_BAND);
}

/** Un tick, en centimes entiers. Copie exacte de FairCalib.Step (C#). */
function orolado_feed_step(array $a, int $cents): int {
  $rel = $a['sigma'] * orolado_feed_z() + $a['drift'];
  $baseCents = (float) $a['base'] * 100.0;
  if ($cents > 0 && $baseCents > 0) $rel -= orolado_feed_pull($a) * log($cents / $baseCents);
  if ($a['jumpP'] > 0 && orolado_feed_u() < $a['jumpP']) {
    $rel += $a['jumpDir'] * ($a['jumpMin'] + ($a['jumpMax'] - $a['jumpMin']) * orolado_feed_u());
  }
  $next = $cents + (int) round($cents * $rel, 0, PHP_ROUND_HALF_UP);
  return $next < 100 ? 100 : $next;
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
  return 1.88;
}

function orolado_fair_duration(int $d): int {
  return in_array($d, OROLADO_DURATIONS, true) ? $d : 10;
}

/** Ligne gagnante en centimes. CALL gagne au-dessus, PUT en dessous, pile dessus = mise rendue. */
function orolado_fair_barrier(string $asset, int $duration, string $side, float $mult, int $entryCents): int {
  $row = orolado_fair_table()[$asset][(string) $duration] ?? null;
  if (!is_array($row) || count($row) < 7) throw new RuntimeException('fair: table absente');
  $mult = orolado_fair_mult($mult);
  $idx = 0;
  if ($mult === 5.0) $idx = 1;
  else if ($mult === 10.0) $idx = 2;
  else if ($mult === 50.0) $idx = 3;
  if ($idx > 0 && $side === 'put') $idx += 3;
  $rel = (float) $row[$idx];
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
