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
  $isAdm = false;
  $tok = trim((string) ($req['token'] ?? ''));
  if ($tok !== '' && strlen($tok) <= 200) {
    try {
      $db = load_db();
      // Seulement une connexion du site (pas d'appel extérieur) : le lien joueur ↔ téléphone est un plus.
      if (isset($db['sessions'][$tok])) {
        $me = orolado_session_user($db, $tok);
        if (is_array($me)) $uid = (string) ($me['id'] ?? '');
        // 2026-10-23 : téléphone connecté avec le compte ADMIN → il reçoit les alertes admin (retraits, messages…)
        if (is_array($me) && function_exists('orolado_is_admin_user')) $isAdm = orolado_is_admin_user(array_merge($me, (array) ($db['users'][$uid] ?? [])));
      }
    } catch (Throwable $e) { $uid = ''; }
  }
  $ok = push_save_sub(is_array($req['sub'] ?? null) ? $req['sub'] : [], [
    'plat' => $plat, 'app' => !empty($req['app']), 'lang' => (string) ($req['lang'] ?? ''), 'uid' => $uid, 'admin' => $isAdm ? 1 : 0,
  ]);
  push_out(['ok' => $ok]);
}

if ($action === 'unsub') {
  $ep = (string) ($req['endpoint'] ?? '');
  if (push_endpoint_ok($ep)) push_drop_sub($ep);
  push_out(['ok' => true]);
}

if ($action === 'ping') {
  $ok = push_app_ping((string) ($req['dev'] ?? ''), $plat);
  // 2026-10-22 : joueur connecté dans l'application installée (liste de l'admin) ; sans compte : simple nombre du jour
  if ($ok) {
    $uid = '';
    $tok = trim((string) ($req['token'] ?? ''));
    if ($tok !== '' && strlen($tok) <= 2000) {
      try { $db = load_db(); $uid = orolado_token_user_id($db, $tok); } catch (Throwable $e) { $uid = ''; }
    }
    push_app_user_ping($uid, $plat);
  }
  push_out(['ok' => $ok]);
}

push_out(['ok' => false], 400);
