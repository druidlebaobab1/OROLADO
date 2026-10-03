<?php
declare(strict_types=1);

/**
 * Fabrication du « direct » des prix (feedcache/live.json et live.js), partagée par feed.php
 * et par le moteur continu (scripts/moteur-prix.php). Code déplacé tel quel depuis feed.php.
 */

require_once __DIR__ . '/feed_lib.php';

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

/** Écrit feedcache/live.json : les 40 derniers prix (10 s) des 10 actifs. */
function feed_live_write(string $dir, string $file, array $base, float $rp, bool $withJson = true, ?array &$tm = null, ?array &$mem = null): array {
  $t0 = microtime(true);
  $out = [];
  foreach (array_keys(orolado_feed_assets()) as $id) {
    if ($mem === null) {
      $sl = feed_slice($id, null, 40);
      $out[$id] = feed_pack((int) $sl['first'], $sl['c']);
      continue;
    }
    // Moteur de diffusion : les 40 derniers prix restent en mémoire. On fait avancer le flux
    // (mêmes prix, même fichier, même verrou) puis on n'ajoute que le(s) prix nouveau(x) au lieu
    // de tout relire (avant : ~1 s par tour chez l'hébergeur, fichier refait 1 fois/s au lieu de 4).
    $st = orolado_feed_advance($id);
    $n = (int) $st['n'];
    $m = $mem[$id] ?? null;
    if (!is_array($m) || $n < $m['last'] || $n - $m['last'] > 20) {
      $vals = array_values(orolado_feed_read($id, $n - 39, $n));
      $m = ['last' => $n, 'c' => $vals];
    } else if ($n > $m['last']) {
      $add = $n === $m['last'] + 1 ? [(int) $st['c']] : array_values(orolado_feed_read($id, $m['last'] + 1, $n));
      $m['c'] = array_slice(array_merge($m['c'], $add), -40);
      $m['last'] = $n;
    }
    $mem[$id] = $m;
    $out[$id] = feed_pack($m['last'] - count($m['c']) + 1, $m['c']);
  }  $t1 = microtime(true);
  $j = $base + ['at' => orolado_feed_now_ms(), 'rp' => $rp, 'assets' => $out];
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $json = json_encode($j, JSON_UNESCAPED_SLASHES);
  // live.js (distribué par Cloudflare) à chaque fois ; live.json (anciens téléphones pas encore
  // mis à jour) seulement quand on le demande (1 fois par seconde dans le moteur).
  foreach ($withJson ? [$dir . '/live.js', $file] : [$dir . '/live.js'] as $dest) {
    $tmp = $dir . '/live.' . bin2hex(random_bytes(4)) . '.tmp';
    if (@file_put_contents($tmp, $json) !== false) {
      if (!@rename($tmp, $dest)) { @unlink($dest); @rename($tmp, $dest); }
    }
  }
  $tm = [(microtime(true) - $t0) * 1000, ($t1 - $t0) * 1000];
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

