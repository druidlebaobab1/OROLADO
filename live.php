<?php
declare(strict_types=1);
/**
 * v2676 — « Live » : Actualités (publiques) + conversation du joueur connecté avec OROLADO (texte + photos).
 * Ne touche à rien d'autre (ni soldes, ni trades, ni connexions) : fichiers à part dans data/live/.
 */
require_once __DIR__ . '/orolado_lib.php';
require_once __DIR__ . '/live_lib.php';
orolado_load_env();
date_default_timezone_set('Africa/Abidjan');
header('X-Robots-Tag: noindex, nofollow');

function live_out(array $j, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($j, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

/** Joueur connecté (jeton du site) ou null. */
function live_me(string $tok): ?array {
  $tok = trim($tok);
  if ($tok === '' || strlen($tok) > 300) return null;
  try {
    $db = load_db();
    if (!isset($db['sessions'][$tok])) return null;
    $me = orolado_session_user($db, $tok);
    if (!is_array($me) || ($me['id'] ?? '') === '') return null;
    if (in_array(strtolower((string) ($me['role'] ?? '')), ['suspended', 'banned', 'deleted'], true)) return null;
    return $me;
  } catch (Throwable $e) { return null; }
}

function live_send_image_file(string $f): void {
  $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
  header('Content-Type: ' . ($ext === 'png' ? 'image/png' : ($ext === 'webp' ? 'image/webp' : 'image/jpeg')));
  header('X-Content-Type-Options: nosniff');
  header('Content-Length: ' . (string) filesize($f));
  readfile($f);
  exit;
}

// Photos : publiques (publications) pour tout le monde ; privées (conversation) seulement pour leur joueur.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
  if (isset($_GET['p'])) {
    $f = live_img_path((string) $_GET['p'], 'pub');
    if ($f === '') { http_response_code(404); exit; }
    header('Cache-Control: public, max-age=2592000, immutable');
    live_send_image_file($f);
  }
  if (isset($_GET['i'])) {
    $name = (string) $_GET['i'];
    $f = live_img_path($name, 'img');
    $me = live_me((string) ($_COOKIE['oro_token'] ?? ''));
    $mine = false;
    if ($f !== '' && $me) {
      foreach ((array) (live_thread((string) $me['id'])['msgs'] ?? []) as $m) if (($m['img'] ?? '') === $name) { $mine = true; break; }
    }
    if (!$mine) { http_response_code(404); exit; }
    header('Cache-Control: private, max-age=86400');
    live_send_image_file($f);
  }
  http_response_code(404);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') live_out(['ok' => false], 405);
$raw = (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_INPUT'])) ? (string) $GLOBALS['OROLADO_FAKE_INPUT'] : (string) file_get_contents('php://input', false, null, 0, 700000);
$req = json_decode($raw, true);
if (!is_array($req)) live_out(['ok' => false], 400);
$action = (string) ($req['action'] ?? '');
$tok = (string) ($req['token'] ?? '');
if ($tok === '') $tok = (string) ($_COOKIE['oro_token'] ?? '');

// Tout ce que la page « Live » affiche : publications + conversation (si connecté).
if ($action === 'feed') {
  $posts = array_map(static function ($p) {
    $o = ['id' => $p['id'], 't' => (string) ($p['t'] ?? ''), 'at' => (int) ($p['at'] ?? 0), 'views' => (int) ($p['views'] ?? 0), 'likes' => (int) ($p['likes'] ?? 0)];
    if (!empty($p['img'])) $o['img'] = 'live.php?p=' . rawurlencode((string) $p['img']);
    if (!empty($p['link'])) $o['link'] = (string) $p['link'];
    return $o;
  }, live_posts());
  $out = ['ok' => true, 'posts' => $posts, 'me' => null];
  $me = live_me($tok);
  if ($me) {
    $th = live_thread((string) $me['id']);
    $msgs = array_map(static function ($m) {
      $o = ['id' => (string) ($m['id'] ?? ''), 'f' => (string) ($m['f'] ?? 'u'), 't' => (string) ($m['t'] ?? ''), 'at' => (int) ($m['at'] ?? 0)];
      if (!empty($m['img'])) $o['img'] = 'live.php?i=' . rawurlencode((string) $m['img']);
      return $o;
    }, array_slice((array) ($th['msgs'] ?? []), -80));
    $out['me'] = ['msgs' => $msgs, 'unread' => (int) ($th['unreadUser'] ?? 0)];
    if (!empty($req['read'])) live_mark_read((string) $me['id'], 'u');
  }
  live_out($out);
}

// Le joueur écrit (texte et/ou photo).
if ($action === 'send') {
  $me = live_me($tok);
  if (!$me) live_out(['ok' => false, 'login' => true, 'reason' => 'login']);
  $uid = (string) $me['id'];
  $text = live_clean_text((string) ($req['text'] ?? ''));
  $imgData = (string) ($req['img'] ?? '');
  if ($text === '' && $imgData === '') live_out(['ok' => false, 'reason' => 'empty']);
  if (!live_quota_ok($uid, 'msg', LIVE_MSG_HOUR, 3600)) live_out(['ok' => false, 'reason' => 'tooMany']);
  $img = '';
  if ($imgData !== '') {
    if (!live_quota_ok($uid, 'img', LIVE_IMG_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooManyImg']);
    $img = live_save_image($imgData, 'img');
    if ($img === '') live_out(['ok' => false, 'reason' => 'badImg']);
  }
  $r = live_add_msg($me, 'u', $text, $img);
  if (empty($r['ok'])) live_out(['ok' => false, 'reason' => 'fail']);
  $m = $r['msg'];
  $o = ['id' => $m['id'], 'f' => 'u', 't' => $m['t'], 'at' => $m['at']];
  if ($img !== '') $o['img'] = 'live.php?i=' . rawurlencode($img);
  echo json_encode(['ok' => true, 'msg' => $o], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  // Prévenir le téléphone ADMIN (après la réponse : le joueur n'attend pas).
  if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ } }
  if (is_file(__DIR__ . '/push_lib.php')) {
    try {
      require_once __DIR__ . '/push_lib.php';
      $who = trim((string) ($me['publicId'] ?? '') . ' ' . (string) ($me['displayName'] ?? ''));
      push_notify_admin('💬 Live · ' . ($who !== '' ? $who : 'Joueur'), $text !== '' ? $text : '📷 Photo', '/admin.php');
    } catch (Throwable $e) { /* jamais bloquant */ }
  }
  exit;
}

// Publications vues / aimées pour la 1re fois sur ce téléphone (le téléphone retient lesquelles).
if ($action === 'seen' || $action === 'like') {
  if (!orolado_rate_ok('live_' . $action, 'ip:' . orolado_client_ip(), 60, 3600)) live_out(['ok' => true]);
  live_post_count((array) ($req['ids'] ?? []), $action === 'like' ? 'likes' : 'views');
  live_out(['ok' => true]);
}

live_out(['ok' => false], 400);
