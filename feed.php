<?php
declare(strict_types=1);

/**
 * Flux de prix public (lecture seule, sans compte).
 *   feed.php?all=1&hist=1440          → les 1440 derniers ticks des 10 actifs (ouverture du site)
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

/*
 * Signal de présence (feed.php?hb=1&v=<id de l'appareil>), envoyé toutes les 20 s par chaque
 * page ouverte, inscrit ou non. Sert à : compter les personnes connectées maintenant et les
 * visiteurs du jour (tableau admin), et faire tourner le moteur des prix seulement quand
 * quelqu'un regarde. Très léger : un fichier touché, aucune base de données.
 */
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

/**
 * Compression : premier prix + écarts successifs (les écarts sont de petits nombres),
 * environ 3 fois moins de données à envoyer que les prix complets.
 */
function feed_pack(int $first, array $vals): array {
  if (!$vals) return ['first' => $first, 'p0' => 0, 'd' => []];
  $d = [];
  $prev = (int) $vals[0];
  $n = count($vals);
  for ($i = 1; $i < $n; $i++) {
    $v = (int) $vals[$i];
    $d[] = $v - $prev;
    $prev = $v;
  }
  return ['first' => $first, 'p0' => (int) $vals[0], 'd' => $d];
}

/** Ticks d'un actif : historique (n derniers) ou depuis un tick. */
function feed_slice(string $asset, ?int $since, int $hist): array {
  $st = orolado_feed_advance($asset);
  $last = $st['n'];
  $from = $since !== null ? max($since + 1, $last - 399) : $last - $hist + 1;
  if ($since !== null && $since < $last - 399) $from = $last - $hist + 1; // trop en retard : historique
  if ($from > $last) return ['first' => $last + 1, 'last' => $last, 'c' => []];
  return ['first' => $from, 'last' => $last, 'c' => orolado_feed_read($asset, $from, $last)];
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

/** Écrit feedcache/live.json : les 40 derniers prix (10 s) des 10 actifs. */
function feed_live_write(string $dir, string $file, array $base, float $rp): array {
  $out = [];
  foreach (array_keys(orolado_feed_assets()) as $id) {
    $sl = feed_slice($id, null, 40);
    $out[$id] = feed_pack((int) $sl['first'], $sl['c']);
  }
  $j = $base + ['at' => orolado_feed_now_ms(), 'rp' => $rp, 'assets' => $out];
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $json = json_encode($j, JSON_UNESCAPED_SLASHES);
  // Deux exemplaires : live.json (anciens téléphones) et live.js (distribué par Cloudflare).
  foreach ([$file, $dir . '/live.js'] as $dest) {
    $tmp = $dir . '/live.' . bin2hex(random_bytes(4)) . '.tmp';
    if (@file_put_contents($tmp, $json) !== false) {
      if (!@rename($tmp, $dest)) { @unlink($dest); @rename($tmp, $dest); }
    }
  }
  return $j;
}

/** Lance le moteur suivant (demande au site lui-même, réponse immédiate). */
function feed_pump_relay(): void {
  if (!function_exists('curl_init')) return;
  $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
  if (!preg_match('/^[a-z0-9.-]+(:\d+)?$/', $host)) $host = 'orolado.com';
  $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' || ($_SERVER['HTTP_CF_VISITOR'] ?? '') !== '' ? 'https' : 'http';
  $url = $scheme . '://' . $host . '/feed.php?live=1&relay=1&r=' . bin2hex(random_bytes(3));
  $bare = preg_replace('/:\d+$/', '', $host);
  $port = $scheme === 'https' ? 443 : 80;
  $ip = (string) ($_SERVER['SERVER_ADDR'] ?? '');
  // 1) Directement sur ce serveur (sans passer par Cloudflare ni sa protection anti-robots).
  // 2) En secours, par l'adresse publique.
  $tries = [];
  if (filter_var($ip, FILTER_VALIDATE_IP)) $tries[] = [$bare . ':' . $port . ':' . (str_contains($ip, ':') ? '[' . $ip . ']' : $ip)];
  $tries[] = [];
  foreach ($tries as $resolve) {
    $ch = curl_init($url);
    $opt = [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT_MS => 2500,
      CURLOPT_CONNECTTIMEOUT_MS => 1200,
      CURLOPT_NOSIGNAL => true,
      CURLOPT_USERAGENT => 'Mozilla/5.0 (OROLADO relay)',
    ];
    if ($resolve) {
      // Notre propre serveur : le certificat peut ne pas correspondre à l'adresse interne.
      $opt[CURLOPT_RESOLVE] = $resolve;
      $opt[CURLOPT_SSL_VERIFYPEER] = false;
      $opt[CURLOPT_SSL_VERIFYHOST] = 0;
    }
    curl_setopt_array($ch, $opt);
    $body = @curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code === 200 && is_string($body) && str_contains($body, '"ok":true')) return;
  }
}

/** Le moteur de diffusion a-t-il écrit il y a moins de 2 s ? */
function feed_pump_alive(string $dir): bool {
  $beat = (int) @file_get_contents($dir . '/pump.beat');
  return $beat > 0 && (orolado_feed_now_ms() - $beat) < 2000;
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
  while (microtime(true) < $end) {
    try {
      feed_live_write($dir, $file, $base, 0.03);
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
  $out = [];
  try {
    foreach (array_keys(orolado_feed_assets()) as $id) {
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
