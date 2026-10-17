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
  unset($j['__write']); // v2689 : jamais le contenu interne d'un fichier (membres, jeton du groupe…) vers le navigateur
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
    // v2680 : photo d'une conversation du joueur (équipe ou ami), jamais celle des autres.
    $mine = $f !== '' && $me && (live_img_allowed((string) $me['id'], $name) || live_img_in_groups((string) $me['id'], $name));
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
    $dmUn = 0;
    foreach (live_inbox((string) $me['id']) as $row) $dmUn += (int) ($row['un'] ?? 0) > 0 ? 1 : 0;
    $out['me'] = ['msgs' => $msgs, 'unread' => (int) ($th['unreadUser'] ?? 0), 'dmUnread' => $dmUn];
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
  $auto = null;
  try {
    $ar = live_auto_reply($uid, substr(preg_replace('/[^a-z]/', '', strtolower((string) ($req['lang'] ?? 'fr'))), 0, 2));
    if (is_array($ar) && !empty($ar['ok'])) $auto = ['id' => $ar['msg']['id'], 'f' => 'a', 't' => $ar['msg']['t'], 'at' => $ar['msg']['at']];
  } catch (Throwable $e) { $auto = null; }
  echo json_encode(['ok' => true, 'msg' => $o, 'auto' => $auto], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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

/* ---------- v2680 — AMIS ---------- */
$dmOut = static function (array $m, string $me, string $peerOid): array {
  $o = ['id' => (string) ($m['id'] ?? ''), 'mine' => (string) ($m['f'] ?? '') === $me, 't' => (string) ($m['t'] ?? ''), 'at' => (int) ($m['at'] ?? 0)];
  if (!empty($m['img'])) $o['img'] = 'live.php?i=' . rawurlencode((string) $m['img']);
  return $o;
};
$pushTo = static function (string $uid, string $title, string $body): void {
  if (!is_file(__DIR__ . '/push_lib.php')) return;
  try {
    require_once __DIR__ . '/push_lib.php';
    $rows = [];
    foreach (push_sub_files() as $pf) { $r = json_decode((string) @file_get_contents($pf), true); if (is_array($r) && (string) ($r['uid'] ?? '') === $uid) $rows[] = $r; }
    if ($rows) push_send_rows($rows, push_payload($title, $body, '/?live=amis'));
  } catch (Throwable $e) { /* jamais bloquant */ }
};

// v2685 — défi vu par le joueur $me (moi / mon ami), sans jamais donner les identifiants internes.
$duelOut = static function (?array $d, string $me): ?array {
  if (!$d) return null;
  $d = live_duel_state($d);
  $iAmA = (string) ($d['a'] ?? '') === $me;
  $o = ['id' => (string) $d['id'], 'st' => (string) $d['st'], 'min' => (int) $d['min'], 'mine' => $iAmA, 'now' => time()];
  if (isset($d['start'])) { $o['start'] = (int) $d['start']; $o['end'] = (int) $d['end']; }
  if (isset($d['sa'])) { $o['me'] = $iAmA ? $d['sa'] : $d['sb']; $o['him'] = $iAmA ? $d['sb'] : $d['sa']; }
  if (($d['st'] ?? '') === 'done') $o['res'] = ($d['win'] ?? '') === '' ? 'tie' : (((string) $d['win'] === $me) ? 'win' : 'lose');
  return $o;
};

// v2772 (propriétaire) : le code unique du joueur (ORO-XXXX-XXXX) pour le profil
if ($action === 'myid') {
  $me = live_me($tok);
  if (!$me) live_out(['ok' => false, 'login' => true]);
  live_oro_id($me);
  live_out(['ok' => true, 'id' => live_code_of((string) $me['id'])]);
}
if (in_array($action, ['friends', 'find', 'dm', 'dmSend', 'block', 'report', 'duelCreate', 'duelAnswer'], true)) {
  $me = live_me($tok);
  if (!$me) live_out(['ok' => false, 'login' => true]);
  $uid = (string) $me['id'];
  $myId = live_oro_id($me);

  if ($action === 'friends') {
    $list = [];
    $blocked = live_blocks($uid);
    foreach (live_inbox($uid) as $peer => $row) {
      $w = live_who_uid((string) $peer);
      if (!$w) continue;
      $last = live_dm_thread($uid, (string) $peer);
      $l = $last ? end($last) : null;
      $list[] = ['id' => $w['id'], 'name' => $w['name'], 'at' => (int) ($row['at'] ?? 0), 'un' => (int) ($row['un'] ?? 0),
        'last' => is_array($l) ? (((string) ($l['f'] ?? '') === $uid ? '✓ ' : '') . ((string) ($l['t'] ?? '') !== '' ? (string) $l['t'] : '📷')) : '',
        'blocked' => in_array((string) $peer, $blocked, true),
        'duel' => (static function () use ($uid, $peer) { $d = live_duel_last($uid, (string) $peer); if (!$d) return ''; if (($d['st'] ?? '') === 'pending' && !live_duel_expired($d) && (string) $d['b'] === $uid) return 'invite'; return ($d['st'] ?? '') === 'active' && time() < (int) ($d['end'] ?? 0) ? 'live' : ''; })()];
    }
    live_out(['ok' => true, 'me' => live_code_of($uid), 'name' => (string) ($me['displayName'] ?? ''), 'list' => $list, 'stats' => live_duel_stats($uid)]);
  }

  // Trouver un ami par son identifiant (au-delà de 10 essais ratés en 1 h : bloqué).
  $peerId = live_norm_oro_id((string) ($req['id'] ?? ''));
  if ($action === 'find' || $action === 'dm' || $action === 'dmSend' || $action === 'block' || $action === 'report' || $action === 'duelCreate' || $action === 'duelAnswer') {
    if ($action === 'find' && !live_find_allowed($uid)) live_out(['ok' => false, 'reason' => 'findLocked']);
    $peer = $peerId !== '' ? live_who($peerId) : null;
    if (!$peer || $peer['uid'] === $uid) {
      if ($action === 'find') live_find_miss($uid);
      live_out(['ok' => false, 'reason' => $peer ? 'self' : 'notFound']);
    }
    $p = $peer['uid'];
    if ($action === 'find') live_out(['ok' => true, 'peer' => ['id' => $peer['id'], 'name' => $peer['name']]]);
    if ($action === 'dm') {
      live_inbox_read($uid, $p);
      live_out(['ok' => true, 'peer' => ['id' => $peer['id'], 'name' => $peer['name']], 'blocked' => live_is_blocked($uid, $p),
        'msgs' => array_map(static fn($m) => $dmOut($m, $uid, $peer['id']), array_slice(live_dm_thread($uid, $p), -80)),
        'duel' => $duelOut(live_duel_last($uid, $p), $uid), 'stats' => live_duel_stats($uid), 'hisStats' => live_duel_stats($p)]);
    }
    if ($action === 'duelCreate') {
      if (live_is_blocked($p, $uid) || live_is_blocked($uid, $p)) live_out(['ok' => false, 'reason' => 'duelGone']);
      $r = live_duel_create($uid, $p, (int) ($req['min'] ?? 5));
      if (empty($r['ok'])) live_out(['ok' => false, 'reason' => (string) ($r['reason'] ?? 'fail'), 'duel' => isset($r['duel']) ? $duelOut($r['duel'], $uid) : null]);
      echo json_encode(['ok' => true, 'duel' => $duelOut($r['duel'], $uid)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ } }
      $fromW = live_who_uid($uid);
      $pushTo($p, '⚔️ ' . (string) ($fromW['name'] ?? 'Un ami'), 'Défi en démo : ' . (int) $r['duel']['min'] . ' min · touche pour accepter');
      exit;
    }
    if ($action === 'duelAnswer') {
      $cur = live_duel_last($uid, $p);
      if (!$cur) live_out(['ok' => false, 'reason' => 'duelGone']);
      $r = live_duel_answer((string) $cur['id'], $uid, !empty($req['accept']));
      live_out(['ok' => !empty($r['ok']), 'reason' => (string) ($r['reason'] ?? ''), 'duel' => isset($r['duel']) ? $duelOut($r['duel'], $uid) : null]);
    }
    if ($action === 'block') { live_set_block($uid, $p, !empty($req['on'])); live_out(['ok' => true]); }
    if ($action === 'report') {
      $why = live_clean_text((string) ($req['why'] ?? ''));
      if (!live_quota_ok($uid, 'report', 10, 86400)) live_out(['ok' => true]);
      live_report($uid, $p, $why);
      live_set_block($uid, $p, true); // signaler = ne plus recevoir ses messages
      echo json_encode(['ok' => true]);
      if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ } }
      try { require_once __DIR__ . '/push_lib.php'; push_notify_admin('🚩 Signalement Live', $myId . ' a signalé ' . $peer['id'] . ($why !== '' ? ' : ' . $why : ''), '/admin.php'); } catch (Throwable $e) { /* ignore */ }
      exit;
    }
    if ($action === 'dmSend') {
      if (live_is_blocked($uid, $p)) live_out(['ok' => false, 'reason' => 'youBlocked']);
      $text = live_clean_text((string) ($req['text'] ?? ''));
      $imgData = (string) ($req['img'] ?? '');
      if ($text === '' && $imgData === '') live_out(['ok' => false, 'reason' => 'empty']);
      if (!live_quota_ok($uid, 'dm', LIVE_DM_HOUR, 3600)) live_out(['ok' => false, 'reason' => 'tooMany']);
      if (!live_dm_thread($uid, $p) && !live_quota_ok($uid, 'newconv', LIVE_NEWCONV_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooMany']);
      $img = '';
      if ($imgData !== '') {
        if (!live_quota_ok($uid, 'img', LIVE_IMG_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooManyImg']);
        $img = live_save_image($imgData, 'img');
        if ($img === '') live_out(['ok' => false, 'reason' => 'badImg']);
      }
      $r = live_dm_send($uid, $p, $text, $img);
      echo json_encode(['ok' => true, 'msg' => $dmOut($r['msg'], $uid, $peer['id'])], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      if (!empty($r['delivered'])) {
        if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ } }
        $fromW = live_who_uid($uid);
        $pushTo($p, '💬 ' . (string) ($fromW['name'] ?? 'OROLADO'), $text !== '' ? $text : '📷 Photo');
      }
      exit;
    }
  }
}

/* ---------- v2688 — GROUPES ---------- */
if (in_array($action, ['groups', 'gCreate', 'gJoin', 'gGet', 'gSend', 'gLeave', 'gKick', 'gAdd'], true)) {
  $me = live_me($tok);
  if (!$me) live_out(['ok' => false, 'login' => true]);
  $uid = (string) $me['id'];
  live_oro_id($me); // le joueur a un identifiant (nom visible dans les groupes)
  $gOut = static function (array $g, string $uid, bool $withMsgs) {
    $o = ['id' => (string) $g['id'], 'name' => (string) $g['name'], 'emoji' => (string) ($g['emoji'] ?? '💬'), 'n' => count((array) $g['members']),
      'owner' => (string) $g['owner'] === $uid, 'at' => (int) ($g['at'] ?? 0), 'link' => 'https://orolado.com/?g=' . rawurlencode((string) $g['tok'])];
    $last = $g['msgs'] ? end($g['msgs']) : null;
    if (is_array($last) && empty($last['sys'])) { $w = live_who_uid((string) $last['f']); $o['last'] = ((string) $last['f'] === $uid ? '✓ ' : (($w['name'] ?? '') . ' : ')) . ((string) ($last['t'] ?? '') !== '' ? (string) $last['t'] : '📷'); }
    if ($withMsgs) {
      $o['msgs'] = array_map(static function ($m) use ($uid) {
        $w = live_who_uid((string) $m['f']);
        $x = ['mine' => (string) $m['f'] === $uid, 'who' => (string) ($w['name'] ?? 'Joueur'), 'wid' => (string) ($w['id'] ?? ''), 't' => (string) ($m['t'] ?? ''), 'at' => (int) ($m['at'] ?? 0)];
        if (!empty($m['sys'])) { $ww = live_who_uid((string) ($m['w'] ?? '')); $x['sys'] = (string) $m['sys']; $x['whom'] = (string) ($ww['name'] ?? 'Joueur'); } // v2706 : « X a ajouté Y »
        if (!empty($m['img'])) $x['img'] = 'live.php?i=' . rawurlencode((string) $m['img']);
        return $x;
      }, array_slice((array) $g['msgs'], -80));
      $o['members'] = array_map(static function ($m) use ($g) { $w = live_who_uid((string) $m); return ['name' => (string) ($w['name'] ?? 'Joueur'), 'id' => (string) ($w['id'] ?? ''), 'owner' => (string) $m === (string) $g['owner']]; }, array_slice((array) $g['members'], 0, 300));
    }
    return $o;
  };
  if ($action === 'groups') {
    $list = [];
    foreach (live_ugroups($uid) as $gid) { $g = live_group_get((string) $gid); if ($g && in_array($uid, (array) $g['members'], true)) $list[] = $gOut($g, $uid, false); }
    usort($list, static fn($a, $b) => $b['at'] <=> $a['at']);
    live_out(['ok' => true, 'list' => $list]);
  }
  if ($action === 'gCreate') {
    $r = live_group_create($uid, (string) ($req['name'] ?? ''), (string) ($req['emoji'] ?? ''));
    live_out(empty($r['ok']) ? $r : ['ok' => true, 'g' => $gOut($r['g'], $uid, true)]);
  }
  if ($action === 'gJoin') {
    $r = live_group_join($uid, (string) ($req['tok'] ?? ''));
    live_out(empty($r['ok']) ? $r : ['ok' => true, 'g' => $gOut($r['g'], $uid, false)]);
  }
  $gid = live_safe_id((string) ($req['gid'] ?? ''));
  $g = $gid !== '' ? live_group_get($gid) : null;
  if (!$g || !in_array($uid, (array) $g['members'], true)) live_out(['ok' => false, 'reason' => 'gGone']);
  if ($action === 'gGet') live_out(['ok' => true, 'g' => $gOut($g, $uid, true)]);
  if ($action === 'gLeave') live_out(live_group_leave($uid, $gid));
  if ($action === 'gAdd') {
    // v2706 : ajouter ses contacts (identifiants des amis) directement dans le groupe
    if (!live_quota_ok($uid, 'gadd', 100, 3600)) live_out(['ok' => false, 'reason' => 'tooMany']);
    $peers = [];
    foreach (array_slice((array) ($req['ids'] ?? []), 0, 30) as $oid) { $w = live_who(live_norm_oro_id((string) $oid)); if ($w) $peers[] = (string) $w['uid']; }
    $r = live_group_add($uid, $gid, $peers);
    if (empty($r['ok'])) live_out($r);
    echo json_encode(['ok' => true, 'n' => count($r['added']), 'g' => $gOut($r['g'], $uid, true)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($r['added']) {
      if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ } }
      $fromW = live_who_uid($uid);
      foreach ($r['added'] as $p) $pushTo($p, '👪 ' . (string) $r['g']['name'], (string) ($fromW['name'] ?? 'Un ami') . ' t’a ajouté au groupe');
    }
    exit;
  }
  if ($action === 'gKick') {
    $w = live_who(live_norm_oro_id((string) ($req['id'] ?? '')));
    if (!$w || $w['uid'] === $uid) live_out(['ok' => false]);
    live_out(live_group_leave($uid, $gid, $w['uid']));
  }
  if ($action === 'gSend') {
    $text = live_clean_text((string) ($req['text'] ?? ''));
    $imgData = (string) ($req['img'] ?? '');
    if ($text === '' && $imgData === '') live_out(['ok' => false, 'reason' => 'empty']);
    if (!live_quota_ok($uid, 'gmsg', LIVE_GROUP_HOUR, 3600)) live_out(['ok' => false, 'reason' => 'tooMany']);
    $img = '';
    if ($imgData !== '') {
      if (!live_quota_ok($uid, 'img', LIVE_IMG_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooManyImg']);
      $img = live_save_image($imgData, 'img');
      if ($img === '') live_out(['ok' => false, 'reason' => 'badImg']);
    }
    $r = live_group_send($uid, $gid, $text, $img);
    live_out(empty($r['ok']) ? $r : ['ok' => true]);
  }
}

/* ---------- v2687 — jeux du jour (démo) ---------- */
if (in_array($action, ['fun', 'wheel', 'quiz', 'mystats'], true)) {
  $me = live_me($tok);
  if (!$me) live_out(['ok' => false, 'login' => true]);
  $uid = (string) $me['id'];
  if ($action === 'fun') live_out(['ok' => true] + live_fun_state($uid));
  // v2689 (propriétaire) : la roue démo est retirée de Live (elle faussait le tournoi démo) ; une roue réelle ira dans Cadeaux.
  if ($action === 'wheel') live_out(['ok' => false, 'reason' => 'off']);
  if ($action === 'quiz') live_out(live_quiz_answer($uid, (int) ($req['q'] ?? -1), (int) ($req['pick'] ?? -1)));
  if ($action === 'mystats') live_out(['ok' => true] + live_my_stats($uid));
}

// Publications vues / aimées pour la 1re fois sur ce téléphone (le téléphone retient lesquelles).
if ($action === 'seen' || $action === 'like') {
  if (!orolado_rate_ok('live_' . $action, 'ip:' . orolado_client_ip(), 60, 3600)) live_out(['ok' => true]);
  live_post_count((array) ($req['ids'] ?? []), $action === 'like' ? 'likes' : 'views');
  live_out(['ok' => true]);
}

live_out(['ok' => false], 400);
