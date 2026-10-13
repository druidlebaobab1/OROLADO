<?php
declare(strict_types=1);
/**
 * v2607 — Notifications : le téléphone s'abonne / se désabonne, et signale qu'il ouvre l'appli installée.
 * Ne touche à rien d'autre (ni soldes, ni trades, ni connexions).
 */
require_once __DIR__ . '/orolado_lib.php';
require_once __DIR__ . '/push_lib.php';
orolado_load_env();
date_default_timezone_set('Africa/Abidjan');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

function push_out(array $j, int $code = 200): void {
  http_response_code($code);
  echo json_encode($j, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') push_out(['ok' => false], 405);
$raw = (string) file_get_contents('php://input', false, null, 0, 8192);
$req = json_decode($raw, true);
if (!is_array($req)) push_out(['ok' => false], 400);
$action = (string) ($req['action'] ?? '');
$plat = (string) ($req['plat'] ?? '');
if (!in_array($plat, ['android', 'ios', 'pc'], true)) $plat = 'pc';

if ($action === 'key') {
  $v = push_vapid();
  push_out(['ok' => $v['pub'] !== '', 'key' => $v['pub']]);
}

if ($action === 'sub') {
  $uid = '';
  $tok = trim((string) ($req['token'] ?? ''));
  if ($tok !== '' && strlen($tok) <= 200) {
    try {
      $db = load_db();
      // Seulement une connexion du site (pas d'appel extérieur) : le lien joueur ↔ téléphone est un plus.
      if (isset($db['sessions'][$tok])) {
        $me = orolado_session_user($db, $tok);
        if (is_array($me)) $uid = (string) ($me['id'] ?? '');
      }
    } catch (Throwable $e) { $uid = ''; }
  }
  $ok = push_save_sub(is_array($req['sub'] ?? null) ? $req['sub'] : [], [
    'plat' => $plat, 'app' => !empty($req['app']), 'lang' => (string) ($req['lang'] ?? ''), 'uid' => $uid,
  ]);
  push_out(['ok' => $ok]);
}

if ($action === 'unsub') {
  $ep = (string) ($req['endpoint'] ?? '');
  if (push_endpoint_ok($ep)) push_drop_sub($ep);
  push_out(['ok' => true]);
}

if ($action === 'ping') {
  push_out(['ok' => push_app_ping((string) ($req['dev'] ?? ''), $plat)]);
}

push_out(['ok' => false], 400);
