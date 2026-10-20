<?php
declare(strict_types=1);

/**
 * Flux de prix public (lecture seule, sans compte).
 *   feed.php?all=1&hist=1440          → les 1440 derniers ticks des 10 actifs (ouverture du site)
 *   feed.php?all=1&hist=1440&ids=odin,v100 → mêmes données, seulement pour ces marchés (12 au plus)
 *   feed.php?all=1&s=v100.N,stable.M  → les nouveaux ticks de chaque actif (~2 fois par seconde)
 *   feed.php?a=v100&hist=5400         → historique long d'un actif (zoom arrière)
 *   feed.php?a=v100&since=N           → les ticks après N pour un actif
 *   feed.php?a=v100&at=N              → le prix du tick N (règlement du mode démo invité)
 * Les prix sont en centimes. Jamais de tick futur : il n'existe pas encore.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
if (!ini_get('zlib.output_compression') && function_exists('ob_gzhandler')) ob_start('ob_gzhandler');

require_once __DIR__ . '/feed_lib.php';
require_once __DIR__ . '/feed_live_lib.php';

/*
 * Signal de présence (feed.php?hb=1&v=<id de l'appareil>), envoyé toutes les 20 s par chaque
 * page ouverte, inscrit ou non. Sert à : compter les personnes connectées maintenant et les
 * visiteurs du jour (tableau admin), et faire tourner le moteur des prix seulement quand
 * quelqu'un regarde. Très léger : un fichier touché, aucune base de données.
 */
// 2026-10-20 : relevé de santé du serveur (lecture seule, aucune donnée de joueur) : charge, mémoire, processus PHP.
if (isset($_GET['diag'])) {
  $la = function_exists('sys_getloadavg') ? sys_getloadavg() : [0, 0, 0];
  $cpu = 0; $mem = [];
  if (is_readable('/proc/cpuinfo')) $cpu = substr_count((string) @file_get_contents('/proc/cpuinfo'), 'processor');
  if (is_readable('/proc/meminfo')) foreach (explode("\n", (string) @file_get_contents('/proc/meminfo')) as $ln) {
    if (preg_match('/^(MemTotal|MemAvailable|SwapTotal|SwapFree):\s+(\d+)/', $ln, $m)) $mem[$m[1]] = round(((int) $m[2]) / 1024);
  }
  $fpm = 0; $fpmBusy = 0;
  foreach ((array) @glob('/proc/[0-9]*/stat') as $f) {
    $st = (string) @file_get_contents($f);
    if (strpos($st, '(php-fpm') !== false) { $fpm++; if (preg_match('/\) ([RD]) /', $st)) $fpmBusy++; }
  }
  $dbf = __DIR__ . '/data/orolado.json';
  echo json_encode(['ok' => true, 'load' => $la, 'cpus' => $cpu, 'memMo' => $mem, 'phpFpm' => $fpm, 'phpFpmActifs' => $fpmBusy,
    'dbMo' => is_file($dbf) ? round(filesize($dbf) / 1048576, 2) : null, 'disqueLibreGo' => round((float) @disk_free_space(__DIR__) / 1073741824, 1), 'a' => date('H:i:s')]);
  exit;
}
if (isset($_GET['hb'])) {
  $vid = substr(preg_replace('/[^a-f0-9]/', '', strtolower((string) ($_GET['v'] ?? ''))) ?? '', 0, 32);
  // Appareil de l'admin (a=1) : ni compté comme connecté, ni comme visiteur.
  if (strlen($vid) >= 12 && !isset($_GET['a'])) {
    $data = __DIR__ . '/data';
    $on = $data . '/online';
    if (!is_dir($on)) @mkdir($on, 0755, true);
    @touch($on . '/' . $vid);
    $day = date('Y-m-d');
    $vd = $data . '/visits/' . $day;
    // Nettoyage UNIQUE du 29/09/2026 : ~170 fausses visites faites par le simulateur de foule
    // (avant qu'il soit exclu du comptage). S'exécute une seule fois, puis plus jamais.
    if ($day === '2026-09-29' && !is_file($data . '/visits/.reset-2026-09-29')) {
      @file_put_contents($data . '/visits/.reset-2026-09-29', date('c'));
      foreach ((array) @scandir($vd) as $f) if ($f !== '.' && $f !== '..') @unlink($vd . '/' . $f);
    }
    if (!is_file($vd . '/' . $vid)) {
      if (!is_dir($vd)) @mkdir($vd, 0755, true);
      $cc = strtoupper(preg_replace('/[^A-Za-z]/', '', (string) ($_SERVER['HTTP_CF_IPCOUNTRY'] ?? '')) ?? '');
      if (strlen($cc) !== 2 || in_array($cc, ['XX', 'T1'], true)) $cc = '??';
      @file_put_contents($vd . '/' . $vid, $cc);
    }
    @file_put_contents(__DIR__ . '/feedcache/visit.beat', (string) time());
    // Ménage de temps en temps : présences de plus d'un jour, visites de plus de 90 jours.
    if (random_int(1, 300) === 1) {
      foreach ((array) @scandir($on) as $f) {
        if ($f !== '.' && $f !== '..' && @filemtime($on . '/' . $f) < time() - 86400) @unlink($on . '/' . $f);
      }
      foreach ((array) @scandir($data . '/visits') as $d) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $d) || strtotime($d) > time() - 90 * 86400) continue;
        foreach ((array) @scandir($data . '/visits/' . $d) as $f) if ($f !== '.' && $f !== '..') @unlink($data . '/visits/' . $d . '/' . $f);
        @rmdir($data . '/visits/' . $d);
      }
    }
  }
  // Quelqu'un regarde (admin compris) : le moteur des prix reste actif.
  if (strlen($vid) >= 12) @file_put_contents(__DIR__ . '/feedcache/visit.beat', (string) time());
  echo '{"ok":true}';
  exit;
}

function feed_out(array $j, int $code = 200): void {
  http_response_code($code);
  echo json_encode($j, JSON_UNESCAPED_SLASHES);
  exit;
}

$base = ['ok' => true, 'tickMs' => OROLADO_TICK_MS];

/*
 * Mode « direct partagé » (tenue de charge) : un seul fichier statique feedcache/live.json
 * (les 12 derniers ticks des 10 actifs) que TOUS les visiteurs lisent directement, servi par
 * l'hébergeur sans PHP. Ce script ne sert qu'à le rafraîchir (au plus ~4 fois par seconde),
 * quel que soit le nombre de visiteurs.
 */
/**
 * Compte les demandes « live=1 » de la seconde en cours et ajuste la probabilité de
 * rafraîchissement : visée ≈ 5 demandes par seconde, quel que soit le nombre de joueurs.
 */
function feed_live_rate(string $dir): float {
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $fp = @fopen($dir . '/live_rate.json', 'c+');
  if (!$fp) return 1.0;
  flock($fp, LOCK_EX);
  $st = json_decode((string) stream_get_contents($fp), true);
  if (!is_array($st)) $st = ['s' => 0, 'n' => 0, 'rp' => 1.0];
  $sec = time();
  $rp = (float) ($st['rp'] ?? 1.0);
  if ((int) ($st['s'] ?? 0) !== $sec) {
    // Nouvelle seconde : on corrige rp selon les demandes de la seconde écoulée (lissé).
    $n = (int) ($st['s'] ?? 0) === $sec - 1 ? max(1, (int) ($st['n'] ?? 0)) : 1;
    $rp = max(0.002, min(1.0, $rp * sqrt(5 / $n)));
    $st = ['s' => $sec, 'n' => 0, 'rp' => $rp];
  }
  $st['n'] = (int) $st['n'] + 1;
  rewind($fp);
  ftruncate($fp, 0);
  fwrite($fp, json_encode($st));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  return round($rp, 4);
}

if (isset($_GET['live'])) {
  $dir = __DIR__ . '/feedcache';
  $file = $dir . '/live.json';
  $raw = @file_get_contents($file);
  $j = is_string($raw) ? json_decode($raw, true) : null;
  $fresh = is_array($j) && isset($j['at']) && (orolado_feed_now_ms() - (int) $j['at']) < 200;
  $pumpAlive = feed_pump_alive($dir);
  // Moteur de diffusion en marche : les téléphones n'ont (presque) plus besoin de PHP.
  // Sinon, ancien auto-réglage « rp » selon le nombre de demandes.
  $rp = $pumpAlive ? 0.03 : feed_live_rate($dir);
  // Moteur en marche : on renvoie le fichier tel quel (pas de travail en double).
  if ((!$fresh && !$pumpAlive) || !is_array($j)) {
    try {
      $j = feed_live_write($dir, $file, $base, $rp);
    } catch (Throwable $e) {
      error_log('OROLADO feed live ' . $e->getMessage());
      feed_out(['ok' => false, 'reason' => 'flux indisponible'], 503);
    }
  }
  $canDetach = function_exists('litespeed_finish_request') || function_exists('fastcgi_finish_request');
  // « relay=1 » : demande envoyée par le moteur en fin de vie pour lancer son remplaçant.
  $relay = isset($_GET['relay']);
  // Un téléphone qui demande le direct = quelqu'un regarde (anciens téléphones sans signal).
  if (!$relay) @file_put_contents($dir . '/visit.beat', (string) time());
  // Réponse : les 10 marchés d'origine (comme live.json) ; les autres se lisent par marché.
  $j = feed_live_legacy($j);
  if (($pumpAlive && !$relay) || !$canDetach) feed_out($j + ['serverMs' => orolado_feed_now_ms()]);

  /*
   * Moteur de diffusion : avant, le fichier des prix n'était refait QUE quand un téléphone le
   * demandait ; avec beaucoup de visiteurs, les demandes faisaient la queue (jusqu'à ~2 s) et
   * les prix arrivaient par à-coups (courbe qui se bloque puis « danse » en rattrapant).
   * Maintenant, la demande répond tout de suite, puis continue seule en arrière-plan pendant
   * 30 s en refaisant le fichier 4 fois par seconde. RELAIS : à 20 s, le moteur lance lui-même
   * son remplaçant (les deux se chevauchent ~10 s) ; avant, il s'arrêtait et le fichier restait
   * vieux jusqu'à ce qu'un téléphone le relance (la courbe « dansait » toutes les minutes).
   * Deux places au plus (verrous a et b) : jamais plus de deux moteurs en même temps.
   */
  $lock = null;
  $mine = '';
  foreach (['a', 'b'] as $slot) {
    $h = @fopen($dir . '/pump-' . $slot . '.lock', 'c');
    if ($h && flock($h, LOCK_EX | LOCK_NB)) { $lock = $h; $mine = $slot; break; }
    if ($h) fclose($h);
  }
  if (!$lock) feed_out($j + ['serverMs' => orolado_feed_now_ms()]);
  http_response_code(200);
  echo json_encode($j + ['serverMs' => orolado_feed_now_ms()], JSON_UNESCAPED_SLASHES);
  while (ob_get_level() > 0) @ob_end_flush();
  @flush();
  if (function_exists('litespeed_finish_request')) litespeed_finish_request();
  else fastcgi_finish_request();
  ignore_user_abort(true);
  @set_time_limit(60);
  $start = microtime(true);
  $end = $start + 30;
  $relayTries = [20, 24, 27];
  $it = 0;
  $mem = [];
  $stat = ['tours' => 0, 'travail_moy' => 0.0, 'travail_max' => 0.0, 'prix_moy' => 0.0, 'prix_max' => 0.0, 'cadence_moy' => 0.0];
  $lastLoop = microtime(true);
  while (microtime(true) < $end) {
    try {
      $it++;
      $tm = [0, 0];
      // live.json refait à CHAQUE tour (4×/s) comme live.js : c'est la voie de secours des
      // téléphones quand la copie Cloudflare de live.js tarde (~1 s), cause des « tic-tic ».
      feed_live_write($dir, $file, $base, 0.03, true, $tm, $mem);
      $nowL = microtime(true);
      $stat['tours']++;
      $stat['travail_moy'] += ($tm[0] - $stat['travail_moy']) / $stat['tours'];
      $stat['travail_max'] = max($stat['travail_max'], $tm[0]);
      $stat['prix_moy'] += ($tm[1] - $stat['prix_moy']) / $stat['tours'];
      $stat['prix_max'] = max($stat['prix_max'], $tm[1]);
      if ($stat['tours'] > 1) $stat['cadence_moy'] += (($nowL - $lastLoop) * 1000 - $stat['cadence_moy']) / ($stat['tours'] - 1);
      $lastLoop = $nowL;
      if ($it % 8 === 0) @file_put_contents($dir . '/pump.stat', json_encode(array_map(static fn($v) => is_float($v) ? round($v) : $v, $stat) + ['moteur' => $mine, 'a' => date('H:i:s')]));
      @file_put_contents($dir . '/pump.beat', (string) orolado_feed_now_ms());
    } catch (Throwable $e) {
      error_log('OROLADO feed pump ' . $e->getMessage());
    }
    // Relais : si l'autre place est libre (pas encore de remplaçant), on le lance.
    // Seulement si quelqu'un regarde le site (signal de présence de moins de 3 min).
    if ($relayTries && microtime(true) - $start >= $relayTries[0] && time() - (int) @file_get_contents($dir . '/visit.beat') < 180) {
      array_shift($relayTries);
      $other = @fopen($dir . '/pump-' . ($mine === 'a' ? 'b' : 'a') . '.lock', 'c');
      $free = $other && flock($other, LOCK_EX | LOCK_NB);
      if ($free) flock($other, LOCK_UN);
      if ($other) fclose($other);
      if ($free) feed_pump_relay();
      else $relayTries = [];
    }
    // Juste après le prochain tick (toutes les 250 ms).
    $now = orolado_feed_now_ms();
    $next = (intdiv($now, OROLADO_TICK_MS) + 1) * OROLADO_TICK_MS + 15;
    usleep(max(20000, ($next - $now) * 1000));
  }
  flock($lock, LOCK_UN);
  exit;
}

if (isset($_GET['all'])) {
  $hist = max(1, min(OROLADO_FEED_BOOT_TICKS, (int) ($_GET['hist'] ?? 1440)));
  $since = [];
  foreach (explode(',', (string) ($_GET['s'] ?? '')) as $pair) {
    $bits = explode('.', $pair);
    if (count($bits) !== 2) continue;
    $id = orolado_feed_asset_id($bits[0]);
    if ($id !== '') $since[$id] = (int) $bits[1];
  }
  // ids : marchés demandés (téléphone à jour : seulement ceux qu'il regarde, 12 au plus).
  // Sans ids (ancien téléphone, page de présentation) : les 10 marchés d'origine, comme avant.
  $want = [];
  foreach (explode(',', (string) ($_GET['ids'] ?? '')) as $raw) {
    $id = orolado_feed_asset_id($raw);
    if ($id !== '' && !in_array($id, $want, true) && count($want) < 12) $want[] = $id;
  }
  if (!$want) $want = orolado_feed_legacy_ids();
  $out = [];
  try {
    foreach ($want as $id) {
      $sl = feed_slice($id, $since[$id] ?? null, $hist);
      $out[$id] = feed_pack((int) $sl['first'], $sl['c']);
    }
  } catch (Throwable $e) {
    error_log('OROLADO feed all ' . $e->getMessage());
    feed_out(['ok' => false, 'reason' => 'flux indisponible'], 503);
  }
  feed_out($base + ['serverMs' => orolado_feed_now_ms(), 'assets' => $out]);
}

$asset = orolado_feed_asset_id((string) ($_GET['a'] ?? ''));
if ($asset === '') feed_out(['ok' => false, 'reason' => 'actif inconnu'], 400);

try {
  $st = orolado_feed_advance($asset);
} catch (Throwable $e) {
  error_log('OROLADO feed ' . $asset . ' ' . $e->getMessage());
  feed_out(['ok' => false, 'reason' => 'flux indisponible'], 503);
}
$last = $st['n'];
$base += ['a' => $asset, 'serverMs' => orolado_feed_now_ms(), 'last' => $last];

if (isset($_GET['at'])) {
  $at = (int) $_GET['at'];
  if ($at > $last) feed_out($base + ['pending' => true]);
  $v = orolado_feed_read($asset, $at, $at)[0] ?? 0;
  feed_out($base + ['tick' => $at, 'c' => $v > 0 ? $v : null]);
}

$slice = feed_slice($asset, isset($_GET['since']) ? (int) $_GET['since'] : null, max(1, min(OROLADO_FEED_BOOT_TICKS, (int) ($_GET['hist'] ?? 2400))));
feed_out($base + ['first' => $slice['first'], 'c' => $slice['c']]);
