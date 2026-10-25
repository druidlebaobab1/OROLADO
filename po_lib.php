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
    'sound' => $prio >= 2 ? 'siren' : ($prio === 1 ? 'cashregister' : 'pushover')];
  if ($prio >= 2) { $f['retry'] = '30'; $f['expire'] = '3600'; }
  if (isset($GLOBALS['PO_FAKE']) && is_callable($GLOBALS['PO_FAKE'])) return ($GLOBALS['PO_FAKE'])($f);
  $ok = false; $why = '';
  if (function_exists('curl_init')) {
    $ch = curl_init('https://api.pushover.net/1/messages.json');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($f), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5, CURLOPT_CONNECTTIMEOUT => 3]);
    $raw = (string) curl_exec($ch); $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    $j = json_decode($raw, true);
    $ok = $code === 200 && (int) ($j['status'] ?? 0) === 1;
    if (!$ok) $why = is_array($j) && !empty($j['errors']) ? implode(' · ', array_map('strval', (array) $j['errors'])) : ('HTTP ' . $code);
  } else $why = 'curl absent';
  $c2 = po_cfg(); $c2['last'] = ['at' => time(), 'ok' => $ok, 'why' => $why, 't' => mb_substr($title, 0, 80)];
  @file_put_contents(po_file(), json_encode($c2, JSON_UNESCAPED_UNICODE));
  return ['ok' => $ok, 'why' => $why];
}
