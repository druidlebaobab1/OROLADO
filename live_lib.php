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
