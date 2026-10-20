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

// Photos : publiques (publications) pour tout le monde ; privées (conversation) seulement pour leur joueur.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
  if (isset($_GET['p'])) {
    $f = live_img_path((string) $_GET['p'], 'pub');
    if ($f === '') { http_response_code(404); exit; }
    live_send_media($f, 'public, max-age=2592000, immutable');
  }
  if (isset($_GET['i'])) {
    $name = (string) $_GET['i'];
    $f = live_img_path($name, 'img');
    $me = live_me((string) ($_COOKIE['oro_token'] ?? ''));
    // v2680 : photo d'une conversation du joueur (équipe ou ami), jamais celle des autres.
    $mine = $f !== '' && $me && (live_img_allowed((string) $me['id'], $name) || live_img_in_groups((string) $me['id'], $name));
    if (!$mine) { http_response_code(404); exit; }
    live_send_media($f, 'private, max-age=86400');
  }
  http_response_code(404);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') live_out(['ok' => false], 405);
$raw = (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_INPUT'])) ? (string) $GLOBALS['OROLADO_FAKE_INPUT'] : (string) file_get_contents('php://input', false, null, 0, 3000000);
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
      if (!empty($m['wh'])) $o['wh'] = (string) $m['wh'];
      return $o;
    }, array_slice((array) ($th['msgs'] ?? []), -80));
    $dmUn = 0;
    foreach (live_inbox((string) $me['id']) as $row) $dmUn += (int) ($row['un'] ?? 0) > 0 ? 1 : 0;
    $out['me'] = ['msgs' => $msgs, 'unread' => (int) ($th['unreadUser'] ?? 0), 'dmUnread' => $dmUn];
    live_seen_touch((string) $me['id']); // v2796 : point vert « en ligne » dans Social
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
  $audData = (string) ($req['aud'] ?? ''); // v2790 : note vocale (10 s max)
  if ($text === '' && $imgData === '' && $audData === '') live_out(['ok' => false, 'reason' => 'empty']);
  if (!live_burst_ok($uid)) live_out(['ok' => false, 'reason' => 'slow']); // v2905 : rafale de robot
  if (!live_quota_ok($uid, 'msg', LIVE_MSG_HOUR, 3600)) live_out(['ok' => false, 'reason' => 'tooMany']);
  $img = '';
  if ($imgData !== '') {
    if (!live_quota_ok($uid, 'img', LIVE_IMG_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooManyImg']);
    $img = live_save_image($imgData, 'img');
    if ($img === '') live_out(['ok' => false, 'reason' => 'badImg']);
  } elseif ($audData !== '') {
    if (!live_quota_ok($uid, 'aud', LIVE_AUD_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooManyAud']);
    $img = live_save_audio($audData);
    if ($img === '') live_out(['ok' => false, 'reason' => 'badAud']);
  }
  $wh = $imgData !== '' ? live_img_wh($req['wh'] ?? '') : '';
  $r = live_add_msg($me, 'u', $text, $img, $wh);
  if (empty($r['ok'])) live_out(['ok' => false, 'reason' => 'fail']);
  $m = $r['msg'];
  $o = ['id' => $m['id'], 'f' => 'u', 't' => $m['t'], 'at' => $m['at']];
  if ($img !== '') $o['img'] = 'live.php?i=' . rawurlencode($img);
  if ($wh !== '') $o['wh'] = $wh;
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
      push_notify_admin('💬 Live · ' . ($who !== '' ? $who : 'Joueur'), live_media_label($m), '/admin.php');
    } catch (Throwable $e) { /* jamais bloquant */ }
  }
  exit;
}

/* ---------- v2680 — AMIS ---------- */
$dmOut = static function (array $m, string $me, string $peerOid): array {
  $o = ['id' => (string) ($m['id'] ?? ''), 'mine' => (string) ($m['f'] ?? '') === $me, 't' => (string) ($m['t'] ?? ''), 'at' => (int) ($m['at'] ?? 0)];
  if (!empty($m['img'])) $o['img'] = 'live.php?i=' . rawurlencode((string) $m['img']);
  if (!empty($m['wh'])) $o['wh'] = (string) $m['wh'];
  return $o;
};
// 2026-10-20 : textes des alertes aux joueurs dans la langue de leur téléphone (avant : français pour tous).
// Ordre : fr, en, es, pt, ar, tr, vi, id, ru, de, hi, zh ; langue inconnue → anglais.
$pushTxt = static function (string $key, string $lang, array $v = []): string {
  static $T = [
    'friend' => ['Un ami', 'A friend', 'Un amigo', 'Um amigo', 'صديق', 'Bir arkadaş', 'Một người bạn', 'Seorang teman', 'Друг', 'Ein Freund', 'एक दोस्त', '一位好友'],
    'duel' => ['Défi en démo : {n} min · touche pour accepter', 'Demo challenge: {n} min · tap to accept', 'Reto en demo: {n} min · toca para aceptar', 'Desafio em demo: {n} min · toque para aceitar', 'تحدٍّ تجريبي: {n} د · اضغط للقبول', 'Demo düellosu: {n} dk · kabul etmek için dokun', 'Thách đấu demo: {n} phút · chạm để nhận', 'Tantangan demo: {n} mnt · ketuk untuk menerima', 'Вызов в демо: {n} мин · нажмите, чтобы принять', 'Demo-Duell: {n} Min · tippen zum Annehmen', 'डेमो चुनौती: {n} मिनट · स्वीकार करने के लिए टैप करें', '模拟挑战：{n} 分钟 · 点击接受'],
    'group' => ['{name} t’invite dans le groupe', '{name} invites you to the group', '{name} te invita al grupo', '{name} convidou você para o grupo', '{name} يدعوك إلى المجموعة', '{name} seni gruba davet ediyor', '{name} mời bạn vào nhóm', '{name} mengundangmu ke grup', '{name} приглашает вас в группу', '{name} lädt dich in die Gruppe ein', '{name} आपको ग्रुप में बुला रहे हैं', '{name} 邀请你加入群组'],
    'voice' => ['🎤 Note vocale', '🎤 Voice note', '🎤 Nota de voz', '🎤 Mensagem de voz', '🎤 رسالة صوتية', '🎤 Sesli mesaj', '🎤 Tin nhắn thoại', '🎤 Pesan suara', '🎤 Голосовое сообщение', '🎤 Sprachnachricht', '🎤 वॉइस नोट', '🎤 语音消息'],
    'photo' => ['📷 Photo', '📷 Photo', '📷 Foto', '📷 Foto', '📷 صورة', '📷 Fotoğraf', '📷 Ảnh', '📷 Foto', '📷 Фото', '📷 Foto', '📷 फ़ोटो', '📷 照片'],
  ];
  $i = array_search($lang, ['fr', 'en', 'es', 'pt', 'ar', 'tr', 'vi', 'id', 'ru', 'de', 'hi', 'zh'], true);
  $s = (string) ($T[$key][$i === false ? 1 : $i] ?? '');
  foreach ($v as $k => $x) $s = str_replace('{' . $k . '}', (string) $x, $s);
  return $s;
};
/** $title / $body : texte, ou fonction (langue du téléphone) → texte. */
$pushTo = static function (string $uid, $title, $body): void {
  if (!is_file(__DIR__ . '/push_lib.php')) return;
  try {
    require_once __DIR__ . '/push_lib.php';
    foreach (push_sub_files() as $pf) {
      $r = json_decode((string) @file_get_contents($pf), true);
      if (!is_array($r) || (string) ($r['uid'] ?? '') !== $uid) continue;
      $lg = (string) ($r['lang'] ?? 'fr');
      $t = is_callable($title) ? (string) $title($lg) : (string) $title;
      $b = is_callable($body) ? (string) $body($lg) : (string) $body;
      push_send_rows([$r], push_payload($t, $b, '/?live=amis'));
    }
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

// v2777 (propriétaire) : l'identifiant unique du joueur (R + 8 signes au hasard) pour le profil
if ($action === 'myid') {
  $me = live_me($tok);
  if (!$me) live_out(['ok' => false, 'login' => true]);
  live_oro_id($me);
  live_out(['ok' => true, 'id' => live_code_of((string) $me['id']), 'ph' => live_photo_of((string) $me['id'])]);
}
// v2905 (propriétaire) : photo de profil (carrée, réduite par le téléphone ; 300 Ko max) — img '' = retirer la photo
if ($action === 'setPhoto') {
  $me = live_me($tok);
  if (!$me) live_out(['ok' => false, 'login' => true]);
  $uid = (string) $me['id'];
  live_oro_id($me);
  $data = (string) ($req['img'] ?? '');
  if ($data === '') { live_photo_set($uid, ''); live_out(['ok' => true, 'ph' => '']); }
  if (!live_quota_ok($uid, 'photo', LIVE_PHOTO_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooMany']);
  $f = live_save_image($data, 'pub', LIVE_PHOTO_MAX);
  if ($f === '') live_out(['ok' => false, 'reason' => 'badImg']);
  live_photo_set($uid, $f);
  live_out(['ok' => true, 'ph' => live_photo_of($uid)]);
}
// v2905 (propriétaire) : aperçu d'un lien d'invitation de groupe (orolado.com/?g=…), même sans compte
if ($action === 'gPeek') {
  if (!orolado_rate_ok('live_gpeek', 'ip:' . orolado_client_ip(), 120, 3600)) live_out(['ok' => false, 'reason' => 'tooMany']);
  $me = live_me($tok);
  live_out(live_group_peek((string) ($req['tok'] ?? ''), $me ? (string) $me['id'] : ''));
}
if (in_array($action, ['friends', 'find', 'dm', 'dmSend', 'block', 'report', 'duelCreate', 'duelAnswer', 'friendAnswer'], true)) {
  $me = live_me($tok);
  if (!$me) live_out(['ok' => false, 'login' => true]);
  $uid = (string) $me['id'];
  live_seen_touch($uid); // v2796
  $myId = live_oro_id($me);

  if ($action === 'friends') {
    $list = [];
    $blocked = live_blocks($uid);
    foreach (live_inbox($uid) as $peer => $row) {
      $w = live_who_uid((string) $peer);
      if (!$w) continue;
      $isBlocked = in_array((string) $peer, $blocked, true);
      if ((int) ($row['ok'] ?? 0) === -1 && $isBlocked) continue; // v2796 : demande refusée → cachée
      $last = live_dm_thread($uid, (string) $peer);
      $l = $last ? end($last) : null;
      $list[] = ['id' => $w['id'], 'name' => $w['name'], 'ph' => (string) ($w['ph'] ?? ''), 'at' => (int) ($row['at'] ?? 0), 'un' => (int) ($row['un'] ?? 0),
        'last' => is_array($l) ? (((string) ($l['f'] ?? '') === $uid ? '✓ ' : '') . ((string) ($l['t'] ?? '') !== '' ? (string) $l['t'] : (live_is_audio((string) ($l['img'] ?? '')) ? '🎤' : '📷'))) : '',
        'mine' => is_array($l) && (string) ($l['f'] ?? '') === $uid, // v2796 : dernier message envoyé par moi
        'req' => live_dm_is_request($uid, (array) $row, $last), // v2796 : demande de contact (Accepter / Refuser)
        'on' => live_seen_on((string) $peer), // v2796 : en ligne dans Social
        'blocked' => $isBlocked,
        'duel' => (static function () use ($uid, $peer) { $d = live_duel_last($uid, (string) $peer); if (!$d) return ''; if (($d['st'] ?? '') === 'pending' && !live_duel_expired($d) && (string) $d['b'] === $uid) return 'invite'; return ($d['st'] ?? '') === 'active' && time() < (int) ($d['end'] ?? 0) ? 'live' : ''; })()];
    }
    live_out(['ok' => true, 'me' => live_code_of($uid), 'name' => (string) ($me['displayName'] ?? ''), 'ph' => live_photo_of($uid), 'list' => $list, 'stats' => live_duel_stats($uid)]);
  }

  // Trouver un ami par son identifiant (au-delà de 10 essais ratés en 1 h : bloqué).
  $peerId = live_norm_oro_id((string) ($req['id'] ?? ''));
  if ($action === 'find' || $action === 'dm' || $action === 'dmSend' || $action === 'block' || $action === 'report' || $action === 'duelCreate' || $action === 'duelAnswer' || $action === 'friendAnswer') {
    if ($action === 'find' && !live_find_allowed($uid)) live_out(['ok' => false, 'reason' => 'findLocked']);
    $peer = $peerId !== '' ? live_who($peerId) : null;
    if (!$peer || $peer['uid'] === $uid) {
      if ($action === 'find') live_find_miss($uid);
      live_out(['ok' => false, 'reason' => $peer ? 'self' : 'notFound']);
    }
    $p = $peer['uid'];
    if ($action === 'find') live_out(['ok' => true, 'peer' => ['id' => $peer['id'], 'name' => $peer['name'], 'ph' => (string) ($peer['ph'] ?? '')]]);
    if ($action === 'friendAnswer') { live_dm_answer($uid, $p, !empty($req['yes'])); live_out(['ok' => true]); } // v2796
    if ($action === 'dm' && (string) ($req['before'] ?? '') !== '') {
      // 2026-10-20 : les 80 messages juste AVANT celui-là (on remonte dans la discussion) ; ne marque rien comme lu
      $thr = live_dm_thread($uid, $p); $before = (string) $req['before']; $ix = -1;
      foreach ($thr as $i => $mm) if ((string) ($mm['id'] ?? '') === $before) { $ix = $i; break; }
      if ($ix <= 0) live_out(['ok' => true, 'older' => [], 'more' => false]);
      $from = max(0, $ix - 80);
      live_out(['ok' => true, 'older' => array_map(static fn($m) => $dmOut($m, $uid, $peer['id']), array_slice($thr, $from, $ix - $from)), 'more' => $from > 0]);
    }
    if ($action === 'dm') {
      // v2905 : « peek » = lecture en avance (Social prépare les discussions) → ne marque rien comme lu
      if (empty($req['peek'])) live_inbox_read($uid, $p);
      // v2905 : « since » = seulement les messages après celui-là (ouverture instantanée, petites réponses)
      $thr = live_dm_thread($uid, $p); $since = (string) ($req['since'] ?? ''); $delta = false;
      if ($since !== '') { foreach ($thr as $ix => $mm) if ((string) ($mm['id'] ?? '') === $since) { $thr = array_slice($thr, $ix + 1); $delta = true; break; } }
      // v2796 : « lu » (✓✓) = l'ami n'a plus de message non lu de moi ; s'il m'a bloqué, rien n'apparaît jamais lu
      $peerUn = live_is_blocked($p, $uid) ? 9999 : (int) ((live_inbox($p)[$uid] ?? [])['un'] ?? 0);
      $myRow = (array) (live_inbox($uid)[$p] ?? []);
      live_out(['ok' => true, 'peer' => ['id' => $peer['id'], 'name' => $peer['name'], 'ph' => (string) ($peer['ph'] ?? '')], 'blocked' => live_is_blocked($uid, $p),
        'on' => live_seen_on($p), 'peerUn' => $peerUn, 'req' => live_dm_is_request($uid, $myRow, live_dm_thread($uid, $p)),
        'delta' => $delta, 'more' => !$delta && count($thr) > 80, 'msgs' => array_map(static fn($m) => $dmOut($m, $uid, $peer['id']), array_slice($thr, -80)),
        'duel' => $duelOut(live_duel_last($uid, $p), $uid), 'stats' => live_duel_stats($uid), 'hisStats' => live_duel_stats($p)]);
    }
    if ($action === 'duelCreate') {
      if (live_is_blocked($p, $uid) || live_is_blocked($uid, $p)) live_out(['ok' => false, 'reason' => 'duelGone']);
      $r = live_duel_create($uid, $p, (int) ($req['min'] ?? 5));
      if (empty($r['ok'])) live_out(['ok' => false, 'reason' => (string) ($r['reason'] ?? 'fail'), 'duel' => isset($r['duel']) ? $duelOut($r['duel'], $uid) : null]);
      echo json_encode(['ok' => true, 'duel' => $duelOut($r['duel'], $uid)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ } }
      $fromW = live_who_uid($uid);
      $dMin = (int) $r['duel']['min'];
      $pushTo($p, static fn(string $l): string => '⚔️ ' . (string) ($fromW['name'] ?? $pushTxt('friend', $l)), static fn(string $l): string => $pushTxt('duel', $l, ['n' => $dMin]));
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
      try { require_once __DIR__ . '/push_lib.php'; push_notify_admin('🚩 Signalement Live', live_code_of($uid) . ' a signalé ' . $peer['id'] . ($why !== '' ? ' : ' . $why : ''), '/admin.php'); } catch (Throwable $e) { /* ignore */ }
      exit;
    }
    if ($action === 'dmSend') {
      if (live_is_blocked($uid, $p)) live_out(['ok' => false, 'reason' => 'youBlocked']);
      $text = live_clean_text((string) ($req['text'] ?? ''));
      $imgData = (string) ($req['img'] ?? '');
      $audData = $imgData === '' ? (string) ($req['aud'] ?? '') : ''; // v2796 : note vocale (10 s) aussi entre amis
      if ($text === '' && $imgData === '' && $audData === '') live_out(['ok' => false, 'reason' => 'empty']);
      if (!live_burst_ok($uid)) live_out(['ok' => false, 'reason' => 'slow']); // v2905 : rafale de robot
      if (!live_quota_ok($uid, 'dm', LIVE_DM_HOUR, 3600)) live_out(['ok' => false, 'reason' => 'tooMany']);
      if (!live_dm_thread($uid, $p) && !live_quota_ok($uid, 'newconv', LIVE_NEWCONV_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooMany']);
      $img = '';
      if ($imgData !== '') {
        if (!live_quota_ok($uid, 'img', LIVE_IMG_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooManyImg']);
        $img = live_save_image($imgData, 'img');
        if ($img === '') live_out(['ok' => false, 'reason' => 'badImg']);
      } elseif ($audData !== '') {
        if (!live_quota_ok($uid, 'aud', LIVE_AUD_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooManyAud']);
        $img = live_save_audio($audData);
        if ($img === '') live_out(['ok' => false, 'reason' => 'badAud']);
      }
      $r = live_dm_send($uid, $p, $text, $img, $imgData !== '' ? live_img_wh($req['wh'] ?? '') : '');
      echo json_encode(['ok' => true, 'msg' => $dmOut($r['msg'], $uid, $peer['id'])], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      if (!empty($r['delivered'])) {
        if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ } }
        $fromW = live_who_uid($uid);
        $pushTo($p, '💬 ' . (string) ($fromW['name'] ?? 'OROLADO'), (string) $text !== '' ? (string) $text
          : static fn(string $l): string => $pushTxt(live_is_audio((string) $img) ? 'voice' : 'photo', $l));
      }
      exit;
    }
  }
}

/* ---------- v2688 — GROUPES ---------- */
// v2905 (propriétaire) : gDelete (le créateur supprime son groupe), gPhoto / gEmoji (photo ou logo du groupe) ; le créateur
// ne « quitte » plus son groupe ; vieux fichiers de groupe lus sans erreur (live_group_norm).
if (in_array($action, ['groups', 'gCreate', 'gJoin', 'gGet', 'gSend', 'gLeave', 'gKick', 'gAdd', 'gInvite', 'gAnswer', 'gDelete', 'gPhoto', 'gEmoji'], true)) {
  $me = live_me($tok);
  if (!$me) live_out(['ok' => false, 'login' => true]);
  $uid = (string) $me['id'];
  live_seen_touch($uid); // v2796
  live_oro_id($me); // le joueur a un identifiant (nom visible dans les groupes)
  $gOut = static function (array $g, string $uid, bool $withMsgs, string $since = '') {
    $g = live_group_norm($g);
    $delta = false;
    if ($withMsgs && $since !== '') { foreach ($g['msgs'] as $ix => $mm) if ((string) ($mm['id'] ?? '') === $since) { $g['msgs'] = array_slice($g['msgs'], $ix + 1); $delta = true; break; } }
    $o = ['id' => $g['id'], 'name' => $g['name'], 'emoji' => $g['emoji'] !== '' ? $g['emoji'] : '💬', 'n' => count($g['members']),
      'owner' => $g['owner'] === $uid, 'canWrite' => $g['owner'] === $uid, 'at' => $g['at'], 'link' => $g['tok'] !== '' ? 'https://orolado.com/?g=' . rawurlencode($g['tok']) : ''];
    if (!empty($g['photo'])) $o['photo'] = 'live.php?p=' . rawurlencode((string) $g['photo']);
    $last = $g['msgs'] ? end($g['msgs']) : null;
    if (is_array($last) && empty($last['sys'])) { $w = live_who_uid((string) ($last['f'] ?? '')); $o['last'] = ((string) ($last['f'] ?? '') === $uid ? '✓ ' : (($w['name'] ?? '') . ' : ')) . ((string) ($last['t'] ?? '') !== '' ? (string) $last['t'] : (live_is_audio((string) ($last['img'] ?? '')) ? '🎤' : '📷')); }
    if ($withMsgs) {
      $o['msgs'] = array_map(static function ($m) use ($uid) {
        $w = live_who_uid((string) ($m['f'] ?? ''));
        $x = ['id' => (string) ($m['id'] ?? ''), 'mine' => (string) ($m['f'] ?? '') === $uid, 'who' => (string) ($w['name'] ?? 'Joueur'), 'wid' => (string) ($w['id'] ?? ''), 't' => (string) ($m['t'] ?? ''), 'at' => (int) ($m['at'] ?? 0)];
        if (!empty($m['sys'])) { $ww = live_who_uid((string) ($m['w'] ?? '')); $x['sys'] = (string) $m['sys']; $x['whom'] = (string) ($ww['name'] ?? 'Joueur'); } // v2706 : « X a ajouté Y »
        if (!empty($m['img'])) $x['img'] = 'live.php?i=' . rawurlencode((string) $m['img']);
        if (!empty($m['wh'])) $x['wh'] = (string) $m['wh'];
        if (!$x['mine'] && !empty($w['ph'])) $x['wph'] = (string) $w['ph']; // 2026-10-20 : photo de profil de l'auteur (groupes)
        return $x;
      }, array_slice($g['msgs'], -80));
      $o['delta'] = $delta;
      $o['more'] = !$delta && count($g['msgs']) > 80; // 2026-10-20 : il reste des messages plus anciens (chargés en remontant)
      if (!$delta) $o['members'] = array_map(static function ($m) use ($g) { $w = live_who_uid((string) $m); return ['name' => (string) ($w['name'] ?? 'Joueur'), 'id' => (string) ($w['id'] ?? ''), 'ph' => (string) ($w['ph'] ?? ''), 'owner' => (string) $m === $g['owner']]; }, array_slice($g['members'], 0, 300));
    }
    return $o;
  };
  if ($action === 'groups') {
    $list = [];
    foreach (live_ugroups_all($uid) as $gid) { $g = live_group_get((string) $gid); if ($g && in_array($uid, $g['members'], true)) $list[] = $gOut($g, $uid, false); }
    usort($list, static fn($a, $b) => $b['at'] <=> $a['at']);
    // v2790 : invitations reçues (Accepter / Refuser)
    $inv = [];
    foreach (live_group_invites($uid) as $i) {
      $gg = live_group_get((string) ($i['g'] ?? ''));
      if (!$gg || in_array($uid, $gg['members'], true)) continue;
      $w = live_who_uid((string) ($i['by'] ?? ''));
      $iv = ['gid' => $gg['id'], 'name' => $gg['name'], 'emoji' => $gg['emoji'] !== '' ? $gg['emoji'] : '💬', 'n' => count($gg['members']), 'by' => (string) ($w['name'] ?? 'Joueur'), 'at' => (int) ($i['at'] ?? 0)];
      if (!empty($gg['photo'])) $iv['photo'] = 'live.php?p=' . rawurlencode((string) $gg['photo']);
      $inv[] = $iv;
    }
    live_out(['ok' => true, 'list' => $list, 'inv' => $inv]);
  }
  if ($action === 'gCreate') {
    $r = live_group_create($uid, (string) ($req['name'] ?? ''), (string) ($req['emoji'] ?? ''));
    live_out(empty($r['ok']) ? $r : ['ok' => true, 'g' => $gOut($r['g'], $uid, true)]);
  }
  if ($action === 'gJoin') {
    $r = live_group_join($uid, (string) ($req['tok'] ?? ''));
    live_out(empty($r['ok']) ? $r : ['ok' => true, 'already' => !empty($r['already']), 'g' => $gOut($r['g'], $uid, false)]);
  }
  $gid = live_safe_id((string) ($req['gid'] ?? ''));
  if ($action === 'gAnswer') {
    $r = live_group_answer($uid, $gid, !empty($req['yes']));
    live_out(empty($r['ok']) || empty($r['g']) ? $r : ['ok' => true, 'g' => $gOut($r['g'], $uid, false)]);
  }
  $g = $gid !== '' ? live_group_get($gid) : null;
  if (!$g || !in_array($uid, $g['members'], true)) {
    if ($action === 'gDelete' && live_group_deleted($gid)) live_out(['ok' => true]); // déjà supprimé : rien à refaire
    live_out(['ok' => false, 'reason' => $gid !== '' && live_group_deleted($gid) ? 'gDeleted' : 'gGone']);
  }
  if ($action === 'gGet') {
    // 2026-10-20 : « before » = les 80 messages juste AVANT celui-là (on remonte dans la discussion, comme WhatsApp)
    $before = (string) ($req['before'] ?? '');
    if ($before !== '') {
      $all = live_group_norm($g)['msgs']; $ix = -1;
      foreach ($all as $i => $mm) if ((string) ($mm['id'] ?? '') === $before) { $ix = $i; break; }
      if ($ix <= 0) live_out(['ok' => true, 'older' => [], 'more' => false]);
      $from = max(0, $ix - 80); $g2 = $g; $g2['msgs'] = array_slice($all, $from, $ix - $from);
      $o2 = $gOut($g2, $uid, true, '');
      live_out(['ok' => true, 'older' => $o2['msgs'] ?? [], 'more' => $from > 0]);
    }
    if ($g['owner'] === $uid) $g = live_group_ensure_tok($g); // v2905 : le lien d'invitation du créateur marche toujours
    live_out(['ok' => true, 'g' => $gOut($g, $uid, true, (string) ($req['since'] ?? ''))]);
  }
  if ($action === 'gLeave') live_out(live_group_leave($uid, $gid));
  if ($action === 'gDelete') live_out(live_group_delete($uid, $gid));
  if ($action === 'gPhoto') {
    if ($g['owner'] !== $uid) live_out(['ok' => false, 'reason' => 'gOwner']);
    $data = (string) ($req['img'] ?? '');
    $f = '';
    if ($data !== '') {
      if (!live_quota_ok($uid, 'photo', LIVE_PHOTO_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooMany']);
      $f = live_save_image($data, 'pub', LIVE_PHOTO_MAX);
      if ($f === '') live_out(['ok' => false, 'reason' => 'badImg']);
    }
    $r = live_group_set_photo($uid, $gid, $f);
    live_out(empty($r['ok']) ? $r : ['ok' => true, 'photo' => $f !== '' ? 'live.php?p=' . rawurlencode($f) : '']);
  }
  if ($action === 'gEmoji') live_out(live_group_set_emoji($uid, $gid, (string) ($req['emoji'] ?? '')));
  if ($action === 'gAdd' || $action === 'gInvite') {
    // v2790 (propriétaire) : plus d'ajout forcé — le joueur reçoit une INVITATION (identifiant R…, e-mail ou un contact) et choisit
    $ids = array_slice((array) ($req['ids'] ?? []), 0, 30);
    if (!live_quota_ok($uid, 'ginv', 40, 3600)) live_out(['ok' => false, 'reason' => 'tooMany']);
    $sent = []; $nf = 0; $in = 0;
    foreach ($ids as $oid) {
      $w = live_who(live_norm_oro_id((string) $oid));
      if (!$w) { $nf++; continue; }
      $st = live_group_invite($uid, $gid, (string) $w['uid']);
      if ($st === 'ok') $sent[] = (string) $w['uid']; elseif ($st === 'in') $in++;
    }
    echo json_encode(['ok' => true, 'n' => count($sent), 'nf' => $nf, 'in' => $in], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($sent) {
      if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ } }
      $fromW = live_who_uid($uid);
      foreach ($sent as $pp) $pushTo($pp, '👪 ' . $g['name'], static fn(string $l): string => $pushTxt('group', $l, ['name' => (string) ($fromW['name'] ?? $pushTxt('friend', $l))]));
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
    $audData = $imgData === '' ? (string) ($req['aud'] ?? '') : ''; // v2796 : note vocale du créateur
    if ($text === '' && $imgData === '' && $audData === '') live_out(['ok' => false, 'reason' => 'empty']);
    if ($g['owner'] !== $uid) live_out(['ok' => false, 'reason' => 'gOwnerOnly']); // avant tout compteur : un membre ne consomme rien
    if (!live_burst_ok($uid)) live_out(['ok' => false, 'reason' => 'slow']);
    if (!live_quota_ok($uid, 'gmsg', LIVE_GROUP_HOUR, 3600) || !live_quota_ok($uid, 'gday', LIVE_GROUP_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooMany']);
    $img = '';
    if ($imgData !== '') {
      if (!live_quota_ok($uid, 'img', LIVE_IMG_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooManyImg']);
      $img = live_save_image($imgData, 'img');
      if ($img === '') live_out(['ok' => false, 'reason' => 'badImg']);
    } elseif ($audData !== '') {
      if (!live_quota_ok($uid, 'aud', LIVE_AUD_DAY, 86400)) live_out(['ok' => false, 'reason' => 'tooManyAud']);
      $img = live_save_audio($audData);
      if ($img === '') live_out(['ok' => false, 'reason' => 'badAud']);
    }
    $wh = $imgData !== '' ? live_img_wh($req['wh'] ?? '') : '';
    $r = live_group_send($uid, $gid, $text, $img, $wh);
    if (empty($r['ok'])) live_out($r);
    $m = $r['msg'];
    $o = ['id' => $m['id'], 'mine' => true, 't' => $m['t'], 'at' => $m['at']];
    if ($img !== '') $o['img'] = 'live.php?i=' . rawurlencode($img);
    if ($wh !== '') $o['wh'] = $wh;
    live_out(['ok' => true, 'msg' => $o]);
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
