<?php
declare(strict_types=1);
/**
 * 2026-10-25 (propriétaire : « une alerte qui sonne et me réveille, même la nuit ») — PUSHOVER (appli iPhone / Android).
 * Réglage dans Admin → 🔔 Notifications : « User Key » (écran d'accueil de l'appli) + « API Token » (pushover.net → Create an
 * Application). Gardés dans data/push/pushover.json (jamais dans le code). Niveaux :
 *   2 = URGENCE (retrait à payer) : sonne toutes les 30 s jusqu'à « J'ai vu » (1 h max), passe le mode silencieux si
 *       l'iPhone autorise les « alertes critiques » de Pushover ;
 *   1 = important (dépôt reçu, gros dépôt) : son même pendant les heures calmes ;  0 = normal (message de joueur…).
 * Jamais bloquant : 5 s au plus, une erreur est seulement notée.
 */
function po_file(): string { return (function_exists('push_dir') ? push_dir() : __DIR__ . '/data/push') . '/pushover.json'; }
function po_cfg(): array {
  $j = json_decode((string) @file_get_contents(po_file()), true);
  $j = is_array($j) ? $j : [];
  return ['user' => (string) ($j['user'] ?? ''), 'token' => (string) ($j['token'] ?? ''), 'on' => !array_key_exists('on', $j) || !empty($j['on']),
    'last' => (array) ($j['last'] ?? [])];
}
function po_ready(): bool { $c = po_cfg(); return $c['on'] && preg_match('/^[A-Za-z0-9]{30}$/', $c['user']) && preg_match('/^[A-Za-z0-9]{30}$/', $c['token']); }
function po_save(array $in): array {
  $c = po_cfg();
  foreach (['user', 'token'] as $k) if (isset($in[$k])) { $v = preg_replace('/\s+/', '', (string) $in[$k]); if ($v !== '') $c[$k] = $v; }
  if (array_key_exists('on', $in)) $c['on'] = !empty($in['on']);
  $f = po_file(); $dir = dirname($f); if (!is_dir($dir)) @mkdir($dir, 0750, true);
  $tmp = $f . '.tmp' . bin2hex(random_bytes(3));
  if (@file_put_contents($tmp, json_encode($c, JSON_UNESCAPED_UNICODE)) !== false) @rename($tmp, $f);
  return po_status();
}
function po_status(): array {
  $c = po_cfg(); $m = static fn(string $v): string => $v === '' ? '' : substr($v, 0, 4) . '…' . substr($v, -3);
  return ['ok' => true, 'ready' => po_ready(), 'on' => $c['on'], 'user' => $m($c['user']), 'token' => $m($c['token']), 'last' => $c['last']];
}
/** Niveau d'une alerte admin d'après son titre : retrait = urgence, dépôt = important, le reste = normal. */
function po_prio(string $title): int {
  if (preg_match('/retrait/iu', $title)) return 2;
  if (preg_match('/d[ée]p[ôo]t/iu', $title)) return 1;
  return 0;
}
function po_send(string $title, string $body, string $url = '/admin.php', ?int $prio = null): array {
  if (!po_ready()) return ['ok' => false, 'why' => 'Pushover non réglé'];
  $c = po_cfg(); $prio = $prio ?? po_prio($title);
  $f = ['token' => $c['token'], 'user' => $c['user'], 'title' => mb_substr($title, 0, 250), 'message' => mb_substr($body !== '' ? $body : $title, 0, 1000),
    'url' => 'https://orolado.com' . ($url !== '' && $url[0] === '/' ? $url : '/admin.php'), 'url_title' => 'Ouvrir l’admin', 'priority' => (string) $prio,
    'sound' => $prio >= 2 ? PO_CUSTOM_SOUND : ($prio === 1 ? 'cashregister' : 'pushover')];
  if ($prio >= 2) { $f['retry'] = '30'; $f['expire'] = (string) PO_EXPIRE; }
  if (isset($GLOBALS['PO_FAKE']) && is_callable($GLOBALS['PO_FAKE'])) return ($GLOBALS['PO_FAKE'])($f);
  $ok = false; $why = '';
  if (function_exists('curl_init')) {
    $ch = curl_init('https://api.pushover.net/1/messages.json');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($f), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5, CURLOPT_CONNECTTIMEOUT => 3]);
    $raw = (string) curl_exec($ch); $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    $j = json_decode($raw, true);
    // son maison « oroalarme » pas encore ajouté dans Pushover → on renvoie aussitôt avec le son long intégré (l'alarme part toujours)
    if ($code !== 200 && $f['sound'] === PO_CUSTOM_SOUND && stripos($raw, 'sound') !== false) {
      $f['sound'] = PO_ALARM_SOUND;
      $ch = curl_init('https://api.pushover.net/1/messages.json');
      curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($f), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5, CURLOPT_CONNECTTIMEOUT => 3]);
      $raw = (string) curl_exec($ch); $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
      $j = json_decode($raw, true);
    }
    $ok = $code === 200 && (int) ($j['status'] ?? 0) === 1;
    if ($ok && $prio >= 2 && !empty($j['receipt'])) po_pend_add((string) $j['receipt'], $title, (string) $f['message'], $url);
    if (!$ok) $why = is_array($j) && !empty($j['errors']) ? implode(' · ', array_map('strval', (array) $j['errors'])) : ('HTTP ' . $code);
  } else $why = 'curl absent';
  $c2 = po_cfg(); $c2['last'] = ['at' => time(), 'ok' => $ok, 'why' => $why, 't' => mb_substr($title, 0, 80)];
  @file_put_contents(po_file(), json_encode($c2, JSON_UNESCAPED_UNICODE));
  return ['ok' => $ok, 'why' => $why];
}

/* 2026-10-25 (propriétaire : « 1 h ne suffit pas, je dors 6 à 8 h ; un son plus long, plusieurs bips ») — son long
   « Alien Alarm » (plusieurs bips d'affilée) ; Pushover arrête une alarme au bout de 3 h au plus → si personne n'a touché
   « Acknowledge », le site la RELANCE (jusqu'à 9 h après la demande). Vérifié après les requêtes du site (au plus toutes les 5 min). */
const PO_ALARM_SOUND = 'alien';
const PO_CUSTOM_SOUND = 'oroalarme'; // 2026-10-25 : son maison très fort (pushover.net → Your Custom Sounds → nom « oroalarme »)
const PO_EXPIRE = 10800;       // 3 h : maximum permis par Pushover
const PO_KEEP = 32400;         // relances pendant 9 h
function po_pend_file(): string { return dirname(po_file()) . '/pushover_pend.json'; }
function po_pend_read(): array { $j = json_decode((string) @file_get_contents(po_pend_file()), true); return is_array($j) ? $j : []; }
function po_pend_write(array $p): void { $tmp = po_pend_file() . '.tmp' . bin2hex(random_bytes(3)); if (@file_put_contents($tmp, json_encode(array_slice($p, -50, null, true), JSON_UNESCAPED_UNICODE)) !== false) @rename($tmp, po_pend_file()); }
function po_pend_add(string $rc, string $t, string $m, string $url): void {
  $p = po_pend_read(); $first = (int) ($GLOBALS['PO_FIRST'] ?? 0) ?: time();
  foreach ($p as $k => $v) if (($v['t0'] ?? '') === $t && ($v['m'] ?? '') === $m) { $first = (int) ($v['first'] ?? $first); unset($p[$k]); } // relance : garde l'heure de la 1re alarme
  $p[$rc] = ['at' => time(), 'first' => $first, 't0' => $t, 'm' => $m, 'url' => $url];
  po_pend_write($p);
}
function po_after_response(): void {
  $f = po_pend_file(); clearstatcache(true, $f);
  if (!is_file($f) || filemtime($f) > time() - 300) return; // rien en attente, ou vérifié il y a moins de 5 min
  @touch($f);
  if (!po_ready() || !function_exists('curl_init')) return;
  if (PHP_SAPI !== 'cli' && function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* déjà fait */ } } // le joueur n'attend jamais
  $p = po_pend_read(); $now = time(); $c = po_cfg(); $ch = false;
  foreach ($p as $rc => $v) {
    if ($now - (int) ($v['at'] ?? 0) < PO_EXPIRE - 120) continue; // l'alarme sonne encore
    $h = curl_init('https://api.pushover.net/1/receipts/' . rawurlencode((string) $rc) . '.json?token=' . rawurlencode($c['token']));
    curl_setopt_array($h, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5, CURLOPT_CONNECTTIMEOUT => 3]);
    $j = json_decode((string) curl_exec($h), true); curl_close($h);
    unset($p[$rc]); $ch = true;
    if (!empty($j['acknowledged']) || $now - (int) ($v['first'] ?? 0) >= PO_KEEP) continue; // vu, ou plus de 9 h : fini
    po_pend_write($p);
    $t0 = (string) ($v['t0'] ?? 'Retrait à payer');
    $GLOBALS['PO_FIRST'] = (int) ($v['first'] ?? $now); // l'heure de la 1re alarme est gardée (arrêt après 9 h)
    po_send(str_starts_with($t0, '⏰') ? $t0 : '⏰ ' . $t0, (string) ($v['m'] ?? ''), (string) ($v['url'] ?? '/admin.php'), 2);
    unset($GLOBALS['PO_FIRST']);
    $p = po_pend_read();
  }
  if ($ch) po_pend_write($p);
}
