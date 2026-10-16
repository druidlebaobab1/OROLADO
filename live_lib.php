<?php
declare(strict_types=1);
/**
 * v2676 — « Live » (ancien « Aide ») : conversation joueur ↔ OROLADO (texte + photos) et Actualités (publications).
 * Fichiers à part dans data/live/ : ne touche JAMAIS aux soldes, trades, dépôts ou retraits.
 *  - data/live/threads/<id>.json : une conversation par joueur
 *  - data/live/posts.json        : publications (Actualités)
 *  - data/live/img/<nom>.jpg     : photos PRIVÉES des conversations (réduites par le téléphone, 400 Ko max)
 *  - data/live/pub/<nom>.jpg     : photos des publications (publiques)
 */

const LIVE_MSG_MAX = 1000;        // lettres par message
const LIVE_IMG_MAX = 409600;      // 400 Ko par photo (le téléphone la réduit avant)
const LIVE_IMG_DAY = 10;          // photos par joueur et par jour
const LIVE_MSG_HOUR = 30;         // messages par joueur et par heure
const LIVE_THREAD_KEEP = 200;     // derniers messages gardés par conversation

function live_dir(string $sub = ''): string {
  $d = rtrim(str_replace('\\', '/', orolado_data_dir()), '/') . '/live' . ($sub !== '' ? '/' . $sub : '');
  if (!is_dir($d)) @mkdir($d, 0775, true);
  return $d;
}

function live_safe_id(string $id): string {
  return preg_replace('/[^a-zA-Z0-9_-]/', '', $id) ?: '';
}

function live_thread_file(string $uid): string {
  return live_dir('threads') . '/' . live_safe_id($uid) . '.json';
}

function live_read_json(string $f, $def) {
  if (!is_file($f)) return $def;
  $j = json_decode((string) @file_get_contents($f), true);
  return is_array($j) ? $j : $def;
}

/** Écriture sûre (fichier temporaire puis renommage). */
function live_write_json(string $f, array $data): bool {
  $tmp = $f . '.tmp' . bin2hex(random_bytes(3));
  if (@file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) === false) return false;
  if (!@rename($tmp, $f)) { @unlink($f); return @rename($tmp, $f); }
  return true;
}

/** Modification sous verrou (deux messages envoyés en même temps ne s'effacent pas). */
function live_update(string $f, callable $fn, array $def = []) {
  $lock = @fopen($f . '.lock', 'c');
  if ($lock) flock($lock, LOCK_EX);
  $cur = live_read_json($f, $def);
  $res = $fn($cur);
  if (is_array($res) && isset($res['__write'])) live_write_json($f, $res['__write']);
  if ($lock) { flock($lock, LOCK_UN); fclose($lock); }
  return $res;
}

function live_clean_text(string $t): string {
  $t = str_replace(["\r\n", "\r"], "\n", $t);
  $t = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $t) ?? '';
  $t = preg_replace("/\n{4,}/", "\n\n\n", $t) ?? $t;
  $t = trim($t);
  if (preg_match('/^.{0,' . LIVE_MSG_MAX . '}/us', $t, $m)) $t = $m[0];
  return $t;
}

/** Photo envoyée en « data:image/jpeg;base64,… » → fichier ; '' si refusée. */
function live_save_image(string $dataUrl, string $sub = 'img'): string {
  if (!preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)$#', $dataUrl, $m)) return '';
  $bin = base64_decode(preg_replace('/\s+/', '', $m[2]) ?? '', true);
  if ($bin === false || strlen($bin) < 200 || strlen($bin) > LIVE_IMG_MAX) return '';
  // Vraie image (pas un fichier déguisé) : signature JPEG / PNG / WEBP.
  $ok = str_starts_with($bin, "\xFF\xD8\xFF") || str_starts_with($bin, "\x89PNG") || (str_starts_with($bin, 'RIFF') && substr($bin, 8, 4) === 'WEBP');
  if (!$ok) return '';
  $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
  $name = date('ymd') . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
  return @file_put_contents(live_dir($sub === 'pub' ? 'pub' : 'img') . '/' . $name, $bin) !== false ? $name : '';
}

function live_img_path(string $name, string $sub = 'img'): string {
  if (!preg_match('/^\d{6}_[a-f0-9]{16}\.(jpg|png|webp)$/', $name)) return '';
  $f = live_dir($sub === 'pub' ? 'pub' : 'img') . '/' . $name;
  return is_file($f) ? $f : '';
}

/** Compteur simple par joueur (messages / heure, photos / jour). */
function live_quota_ok(string $uid, string $kind, int $max, int $window): bool {
  $f = live_dir('quota') . '/' . live_safe_id($uid) . '_' . $kind . '.json';
  $now = time();
  $res = live_update($f, function ($q) use ($now, $max, $window) {
    $list = array_values(array_filter((array) ($q['t'] ?? []), static fn($t) => is_int($t) && $t > $now - $window));
    if (count($list) >= $max) return ['ok' => false];
    $list[] = $now;
    return ['ok' => true, '__write' => ['t' => $list]];
  });
  return !empty($res['ok']);
}

/** Message dans la conversation d'un joueur. $from = 'u' (joueur) ou 'a' (OROLADO). */
function live_add_msg(array $user, string $from, string $text, string $img = ''): array {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '' || ($text === '' && $img === '')) return ['ok' => false];
  $msg = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => $from === 'a' ? 'a' : 'u', 't' => $text, 'at' => time()];
  if ($img !== '') $msg['img'] = $img;
  return live_update(live_thread_file($uid), function ($th) use ($user, $uid, $msg, $from) {
    $th['uid'] = $uid;
    if ($from !== 'a') {
      $th['email'] = (string) ($user['email'] ?? $th['email'] ?? '');
      $th['name'] = (string) ($user['displayName'] ?? $user['name'] ?? $th['name'] ?? '');
      $th['publicId'] = (string) ($user['publicId'] ?? $th['publicId'] ?? '');
    }
    $msgs = (array) ($th['msgs'] ?? []);
    $msgs[] = $msg;
    $th['msgs'] = array_slice($msgs, -LIVE_THREAD_KEEP);
    $th['at'] = $msg['at'];
    if ($from === 'a') { $th['unreadUser'] = (int) ($th['unreadUser'] ?? 0) + 1; $th['unreadAdmin'] = 0; }
    else { $th['unreadAdmin'] = (int) ($th['unreadAdmin'] ?? 0) + 1; }
    return ['ok' => true, 'msg' => $msg, '__write' => $th];
  });
}

function live_thread(string $uid): array {
  return live_read_json(live_thread_file($uid), ['uid' => $uid, 'msgs' => []]);
}

function live_mark_read(string $uid, string $who): void {
  $f = live_thread_file($uid);
  if (!is_file($f)) return;
  live_update($f, function ($th) use ($who) {
    $k = $who === 'a' ? 'unreadAdmin' : 'unreadUser';
    if ((int) ($th[$k] ?? 0) === 0) return ['ok' => true];
    $th[$k] = 0;
    return ['ok' => true, '__write' => $th];
  });
}

/** Liste des conversations pour l'admin (plus récentes d'abord). */
function live_threads(int $limit = 200): array {
  $out = [];
  foreach (glob(live_dir('threads') . '/*.json') ?: [] as $f) {
    $th = live_read_json($f, []);
    if (!$th || empty($th['msgs'])) continue;
    $last = end($th['msgs']);
    $out[] = [
      'uid' => (string) ($th['uid'] ?? ''), 'publicId' => (string) ($th['publicId'] ?? ''), 'name' => (string) ($th['name'] ?? ''),
      'email' => (string) ($th['email'] ?? ''), 'at' => (int) ($th['at'] ?? 0), 'unread' => (int) ($th['unreadAdmin'] ?? 0),
      'last' => is_array($last) ? (($last['f'] === 'a' ? 'Vous : ' : '') . ((string) ($last['t'] ?? '') !== '' ? (string) $last['t'] : '📷 Photo')) : '',
    ];
  }
  usort($out, static fn($a, $b) => [$b['unread'] > 0, $b['at']] <=> [$a['unread'] > 0, $a['at']]);
  return array_slice($out, 0, $limit);
}

function live_unread_admin(): int {
  $n = 0;
  foreach (glob(live_dir('threads') . '/*.json') ?: [] as $f) {
    $th = live_read_json($f, []);
    if ((int) ($th['unreadAdmin'] ?? 0) > 0) $n++;
  }
  return $n;
}

/* ---------- Actualités ---------- */

function live_posts_file(): string { return live_dir() . '/posts.json'; }

function live_posts(): array {
  $p = live_read_json(live_posts_file(), ['list' => []]);
  return array_values((array) ($p['list'] ?? []));
}

function live_add_post(string $text, string $img = '', string $link = ''): array {
  $post = ['id' => 'p' . bin2hex(random_bytes(6)), 't' => $text, 'at' => time(), 'views' => 0, 'likes' => 0];
  if ($img !== '') $post['img'] = $img;
  if ($link !== '' && preg_match('#^https://[^\s"<>]{4,300}$#', $link)) $post['link'] = $link;
  return live_update(live_posts_file(), function ($p) use ($post) {
    $list = (array) ($p['list'] ?? []);
    array_unshift($list, $post);
    return ['ok' => true, 'post' => $post, '__write' => ['list' => array_slice($list, 0, 60)]];
  }, ['list' => []]);
}

function live_del_post(string $id): bool {
  $r = live_update(live_posts_file(), function ($p) use ($id) {
    $list = array_values(array_filter((array) ($p['list'] ?? []), static fn($x) => ($x['id'] ?? '') !== $id));
    return ['ok' => true, '__write' => ['list' => $list]];
  }, ['list' => []]);
  return !empty($r['ok']);
}

/** Vues / « j'aime » : le téléphone envoie la liste des publications vues pour la 1re fois (une fois chacune). */
function live_post_count(array $ids, string $field): void {
  $ids = array_slice(array_values(array_filter($ids, static fn($i) => is_string($i) && preg_match('/^p[a-f0-9]{12}$/', $i))), 0, 30);
  if (!$ids || !in_array($field, ['views', 'likes'], true)) return;
  live_update(live_posts_file(), function ($p) use ($ids, $field) {
    $list = (array) ($p['list'] ?? []);
    $hit = false;
    foreach ($list as &$x) if (in_array($x['id'] ?? '', $ids, true)) { $x[$field] = (int) ($x[$field] ?? 0) + 1; $hit = true; }
    unset($x);
    return $hit ? ['ok' => true, '__write' => ['list' => $list]] : ['ok' => true];
  }, ['list' => []]);
}

/* =====================================================================================================
 * v2680 — AMIS : identifiant secret (OR + 10 caractères, sans O/0, I/1, L), conversations privées entre
 * joueurs (texte + photos), bloquer / signaler, recherche limitée (10 essais ratés / heure).
 * Fichiers : data/live/ids.json, data/live/dm/<a>__<b>.json, data/live/inbox/<uid>.json,
 * data/live/blocks/<uid>.json, data/live/reports.json
 * ===================================================================================================== */
const LIVE_ID_ALPHA = '23456789ABCDEFGHJKMNPQRSTVWXYZ'; // 30 signes : ni O/0, ni I/1, ni L, ni U
const LIVE_DM_HOUR = 60;        // messages privés par heure
const LIVE_NEWCONV_DAY = 20;    // nouvelles personnes contactées par jour
const LIVE_FIND_MISS = 10;      // recherches ratées par heure avant blocage

function live_ids_file(): string { return live_dir() . '/ids.json'; }

function live_new_oro_id(array $taken): string {
  do {
    $s = 'OR';
    for ($i = 0; $i < 10; $i++) $s .= LIVE_ID_ALPHA[random_int(0, strlen(LIVE_ID_ALPHA) - 1)];
  } while (isset($taken[$s]));
  return $s;
}

/** Identifiant secret du joueur (créé à la 1re demande, puis toujours le même). */
function live_oro_id(array $user): string {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return '';
  $r = live_update(live_ids_file(), function ($m) use ($uid, $user) {
    $m['u'] = (array) ($m['u'] ?? []); $m['i'] = (array) ($m['i'] ?? []); $m['n'] = (array) ($m['n'] ?? []);
    $name = trim((string) ($user['displayName'] ?? $user['name'] ?? ''));
    if (isset($m['u'][$uid])) {
      if ($name !== '' && ($m['n'][$uid] ?? '') !== $name) { $m['n'][$uid] = $name; return ['id' => $m['u'][$uid], '__write' => $m]; }
      return ['id' => $m['u'][$uid]];
    }
    $id = live_new_oro_id($m['i']);
    $m['u'][$uid] = $id; $m['i'][$id] = $uid; $m['n'][$uid] = $name !== '' ? $name : 'Joueur';
    return ['id' => $id, '__write' => $m];
  }, ['u' => [], 'i' => [], 'n' => []]);
  return (string) ($r['id'] ?? '');
}

function live_norm_oro_id(string $s): string {
  $s = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $s) ?? '');
  return preg_match('/^OR[2-9A-HJKMNP-TV-Z]{10}$/', $s) ? $s : '';
}

/** Joueur derrière un identifiant : ['uid','id','name'] ou null. */
function live_who(string $oroId): ?array {
  $m = live_read_json(live_ids_file(), []);
  $uid = (string) ($m['i'][$oroId] ?? '');
  if ($uid === '') return null;
  return ['uid' => $uid, 'id' => $oroId, 'name' => (string) ($m['n'][$uid] ?? 'Joueur')];
}

function live_who_uid(string $uid): ?array {
  $m = live_read_json(live_ids_file(), []);
  $id = (string) ($m['u'][$uid] ?? '');
  return $id === '' ? null : ['uid' => $uid, 'id' => $id, 'name' => (string) ($m['n'][$uid] ?? 'Joueur')];
}

/** Recherche d'un ami : au-delà de 10 essais ratés en 1 h, plus de recherche (anti-devinette). */
function live_find_allowed(string $uid): bool {
  $f = live_dir('quota') . '/' . live_safe_id($uid) . '_miss.json';
  $q = live_read_json($f, []);
  $list = array_filter((array) ($q['t'] ?? []), static fn($t) => is_int($t) && $t > time() - 3600);
  return count($list) < LIVE_FIND_MISS;
}

function live_find_miss(string $uid): void { live_quota_ok($uid, 'miss', 1000, 3600); }

function live_pair(string $a, string $b): string {
  $x = [live_safe_id($a), live_safe_id($b)]; sort($x);
  return $x[0] . '__' . $x[1];
}

function live_dm_file(string $pair): string { return live_dir('dm') . '/' . live_safe_id(str_replace('__', 'XX9XX', $pair)) . '.json'; }

function live_blocks(string $uid): array { return array_values((array) (live_read_json(live_dir('blocks') . '/' . live_safe_id($uid) . '.json', [])['b'] ?? [])); }

function live_is_blocked(string $by, string $who): bool { return in_array($who, live_blocks($by), true); }

function live_set_block(string $uid, string $other, bool $on): void {
  live_update(live_dir('blocks') . '/' . live_safe_id($uid) . '.json', function ($q) use ($other, $on) {
    $b = array_values(array_filter((array) ($q['b'] ?? []), static fn($x) => $x !== $other));
    if ($on) $b[] = $other;
    return ['ok' => true, '__write' => ['b' => array_slice($b, -500)]];
  });
}

/** Boîte de réception : liste des conversations privées d'un joueur. */
function live_inbox_touch(string $uid, string $peer, int $at, bool $unread): void {
  live_update(live_dir('inbox') . '/' . live_safe_id($uid) . '.json', function ($q) use ($peer, $at, $unread) {
    $c = (array) ($q['c'] ?? []);
    $row = (array) ($c[$peer] ?? []);
    $row['at'] = $at;
    $row['un'] = $unread ? (int) ($row['un'] ?? 0) + 1 : 0;
    $c[$peer] = $row;
    uasort($c, static fn($x, $y) => (int) ($y['at'] ?? 0) <=> (int) ($x['at'] ?? 0));
    return ['ok' => true, '__write' => ['c' => array_slice($c, 0, 300, true)]];
  });
}

function live_inbox(string $uid): array { return (array) (live_read_json(live_dir('inbox') . '/' . live_safe_id($uid) . '.json', [])['c'] ?? []); }

function live_inbox_read(string $uid, string $peer): void {
  $f = live_dir('inbox') . '/' . live_safe_id($uid) . '.json';
  if (!is_file($f)) return;
  live_update($f, function ($q) use ($peer) {
    if ((int) ($q['c'][$peer]['un'] ?? 0) === 0) return ['ok' => true];
    $q['c'][$peer]['un'] = 0;
    return ['ok' => true, '__write' => $q];
  });
}

/** Message privé de $from vers $to. Refusé (sans le dire) si $to a bloqué $from. */
function live_dm_send(string $from, string $to, string $text, string $img = ''): array {
  if ($from === '' || $to === '' || $from === $to || ($text === '' && $img === '')) return ['ok' => false, 'reason' => 'empty'];
  $msg = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => $from, 't' => $text, 'at' => time()];
  if ($img !== '') $msg['img'] = $img;
  $pair = live_pair($from, $to);
  // Bloqué par le destinataire : le message reste visible pour l'expéditeur seulement (il ne sait pas qu'il est bloqué).
  if (live_is_blocked($to, $from)) $msg['hid'] = $to;
  live_update(live_dm_file($pair), function ($th) use ($msg, $pair) {
    $th['pair'] = $pair;
    $msgs = (array) ($th['msgs'] ?? []);
    $msgs[] = $msg;
    $th['msgs'] = array_slice($msgs, -LIVE_THREAD_KEEP);
    $th['at'] = $msg['at'];
    return ['ok' => true, '__write' => $th];
  });
  live_inbox_touch($from, $to, $msg['at'], false);
  $delivered = !live_is_blocked($to, $from);
  if ($delivered) live_inbox_touch($to, $from, $msg['at'], true);
  return ['ok' => true, 'msg' => $msg, 'delivered' => $delivered];
}

/** Messages d'une conversation vus par $a (sans ceux envoyés par quelqu'un que $a a bloqué). */
function live_dm_thread(string $a, string $b): array {
  $all = (array) (live_read_json(live_dm_file(live_pair($a, $b)), [])['msgs'] ?? []);
  return array_values(array_filter($all, static fn($m) => (string) ($m['hid'] ?? '') !== $a));
}

/** Une photo appartient-elle à une conversation de ce joueur (support ou privée) ? */
function live_img_allowed(string $uid, string $name): bool {
  foreach ((array) (live_thread($uid)['msgs'] ?? []) as $m) if (($m['img'] ?? '') === $name) return true;
  foreach (array_keys(live_inbox($uid)) as $peer) {
    foreach (live_dm_thread($uid, (string) $peer) as $m) if (($m['img'] ?? '') === $name) return true;
  }
  return false;
}

/** Signalement d'un joueur : gardé pour l'admin avec les 20 derniers messages de la conversation. */
function live_report(string $by, string $who, string $why): void {
  $snap = array_slice(live_dm_thread($by, $who), -20);
  live_update(live_dir() . '/reports.json', function ($q) use ($by, $who, $why, $snap) {
    $l = (array) ($q['l'] ?? []);
    array_unshift($l, ['id' => 'r' . bin2hex(random_bytes(5)), 'by' => $by, 'who' => $who, 'why' => $why, 'at' => time(), 'snap' => $snap, 'done' => 0]);
    return ['ok' => true, '__write' => ['l' => array_slice($l, 0, 500)]];
  }, ['l' => []]);
}

function live_reports(): array { return (array) (live_read_json(live_dir() . '/reports.json', [])['l'] ?? []); }

/* =====================================================================================================
 * v2685 — DÉFIE TON AMI (en DÉMO, aucun argent réel) : invitation → accepte → compte à rebours 10 s →
 * chacun joue en démo pendant 3, 5 ou 10 min → le plus gros gain démo gagne. Score = somme des gains nets
 * des trades DÉMO ouverts pendant le défi (lus dans les ordres du serveur, impossible à truquer côté téléphone).
 * Fichiers : data/live/duels/<id>.json, data/live/duelpair/<paire>.json, data/live/duelstats.json
 * ===================================================================================================== */
const LIVE_DUEL_DAY = 30;          // défis lancés par joueur et par jour
const LIVE_DUEL_PENDING = 600;     // une invitation expire après 10 min

function live_duel_file(string $id): string { return live_dir('duels') . '/' . live_safe_id($id) . '.json'; }
function live_duel_pair_file(string $a, string $b): string { return live_dir('duelpair') . '/' . live_safe_id(str_replace('__', 'X9X', live_pair($a, $b))) . '.json'; }

function live_duel_last(string $a, string $b): ?array {
  $p = live_read_json(live_duel_pair_file($a, $b), []);
  $id = (string) ($p['id'] ?? '');
  if ($id === '') return null;
  $d = live_read_json(live_duel_file($id), []);
  return $d ?: null;
}

function live_duel_create(string $from, string $to, int $minutes): array {
  if (!in_array($minutes, [3, 5, 10], true)) $minutes = 5;
  $cur = live_duel_last($from, $to);
  if ($cur && in_array($cur['st'] ?? '', ['pending', 'active'], true) && !live_duel_expired($cur)) return ['ok' => false, 'reason' => 'duelBusy', 'duel' => $cur];
  if (!live_quota_ok($from, 'duel', LIVE_DUEL_DAY, 86400)) return ['ok' => false, 'reason' => 'tooMany'];
  $d = ['id' => 'd' . bin2hex(random_bytes(6)), 'a' => $from, 'b' => $to, 'min' => $minutes, 'st' => 'pending', 'at' => time()];
  live_write_json(live_duel_file($d['id']), $d);
  live_write_json(live_duel_pair_file($from, $to), ['id' => $d['id']]);
  return ['ok' => true, 'duel' => $d];
}

function live_duel_expired(array $d): bool {
  return ($d['st'] ?? '') === 'pending' && time() - (int) ($d['at'] ?? 0) > LIVE_DUEL_PENDING;
}

function live_duel_answer(string $id, string $uid, bool $accept): array {
  $r = live_update(live_duel_file($id), function ($d) use ($uid, $accept) {
    if (!$d || ($d['b'] ?? '') !== $uid || ($d['st'] ?? '') !== 'pending' || live_duel_expired($d)) return ['ok' => false, 'reason' => 'duelGone'];
    if (!$accept) { $d['st'] = 'refused'; return ['ok' => true, 'duel' => $d, '__write' => $d]; }
    $d['st'] = 'active';
    $d['start'] = time() + 10;
    $d['end'] = $d['start'] + (int) $d['min'] * 60;
    return ['ok' => true, 'duel' => $d, '__write' => $d];
  });
  return is_array($r) ? $r : ['ok' => false];
}

/** Gain net DÉMO de $uid sur les trades ouverts entre start et end (réglés). */
function live_duel_score(array $db, string $uid, int $start, int $end): array {
  $net = 0.0; $n = 0; $w = 0;
  foreach ((array) ($db['orders'] ?? []) as $o) {
    if (!is_array($o) || (string) ($o['userId'] ?? '') !== $uid || ($o['mode'] ?? '') !== 'demo') continue;
    $at = (float) ($o['at'] ?? $o['openedAt'] ?? 0);
    if ($at < $start || $at > $end) continue;
    if (!isset($o['net']) || ($o['status'] ?? '') === 'open') continue;
    $net += (float) $o['net']; $n++;
    if (!empty($o['won'])) $w++;
  }
  return ['net' => round($net, 2), 'n' => $n, 'w' => $w];
}

/** État du défi (scores en direct ; à la fin : gagnant, statistiques, message dans la conversation). */
function live_duel_state(array $d, ?array $db = null): array {
  if (($d['st'] ?? '') === 'pending' && live_duel_expired($d)) $d['st'] = 'expired';
  if (in_array($d['st'] ?? '', ['active', 'done'], true) && ($d['st'] === 'active' || !isset($d['sa']))) {
    $db = $db ?? load_db();
    $d['sa'] = live_duel_score($db, (string) $d['a'], (int) $d['start'], (int) $d['end']);
    $d['sb'] = live_duel_score($db, (string) $d['b'], (int) $d['start'], (int) $d['end']);
    // Fini (20 s après la fin, le temps que les derniers trades se règlent) : on fige le résultat une seule fois.
    if ($d['st'] === 'active' && time() > (int) $d['end'] + 20) {
      $fin = live_update(live_duel_file((string) $d['id']), function ($x) use ($d) {
        if (($x['st'] ?? '') !== 'active') return ['ok' => true, 'duel' => $x];
        $x['st'] = 'done'; $x['sa'] = $d['sa']; $x['sb'] = $d['sb'];
        $x['win'] = $d['sa']['net'] > $d['sb']['net'] ? $x['a'] : ($d['sb']['net'] > $d['sa']['net'] ? $x['b'] : '');
        return ['ok' => true, 'duel' => $x, 'fresh' => true, '__write' => $x];
      });
      if (is_array($fin) && !empty($fin['fresh'])) {
        $x = $fin['duel'];
        live_update(live_dir() . '/duelstats.json', function ($s) use ($x) {
          foreach ([(string) $x['a'], (string) $x['b']] as $u) {
            $s[$u] = (array) ($s[$u] ?? ['w' => 0, 'l' => 0, 't' => 0]);
            if ($x['win'] === '') $s[$u]['t']++; elseif ($x['win'] === $u) $s[$u]['w']++; else $s[$u]['l']++;
          }
          return ['ok' => true, '__write' => $s];
        });
      }
      if (is_array($fin) && isset($fin['duel'])) $d = $fin['duel'];
    }
  }
  return $d;
}

function live_duel_stats(string $uid): array {
  $s = live_read_json(live_dir() . '/duelstats.json', []);
  return (array) ($s[$uid] ?? ['w' => 0, 'l' => 0, 't' => 0]);
}
