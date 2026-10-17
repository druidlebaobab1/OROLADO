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

/**
 * v2689 (propriétaire) — réponse automatique : après le message d'un joueur, si l'équipe ne lui a rien écrit
 * depuis 12 h (ni réponse automatique), on ajoute « bien reçu, merci de patienter ». Ne touche pas au compteur
 * « non lu » de l'admin (le message du joueur reste à traiter).
 */
function live_auto_reply(string $uid, string $lang): ?array {
  $txt = [
    'fr' => 'Merci pour ton message 🙏 Il est bien reçu. Notre équipe te répondra ici dès que possible : merci de patienter un peu.',
    'en' => 'Thanks for your message 🙏 We received it. Our team will answer you here as soon as possible: please be patient.',
    'zh' => '感谢你的留言 🙏 我们已收到。团队会尽快在这里回复你，请耐心等待。',
    'es' => 'Gracias por tu mensaje 🙏 Lo hemos recibido. Nuestro equipo te responderá aquí lo antes posible: ten un poco de paciencia.',
    'pt' => 'Obrigado pela tua mensagem 🙏 Recebemos. A nossa equipa vai responder-te aqui o mais rápido possível: tem um pouco de paciência.',
    'ar' => 'شكرًا على رسالتك 🙏 لقد استلمناها. سيرد عليك فريقنا هنا في أقرب وقت: يرجى الانتظار قليلًا.',
    'tr' => 'Mesajın için teşekkürler 🙏 Aldık. Ekibimiz en kısa sürede burada yanıt verecek: lütfen biraz bekle.',
    'vi' => 'Cảm ơn tin nhắn của bạn 🙏 Chúng tôi đã nhận được. Đội ngũ sẽ trả lời bạn tại đây sớm nhất: vui lòng chờ một chút.',
    'id' => 'Terima kasih atas pesanmu 🙏 Sudah kami terima. Tim kami akan membalas di sini secepatnya: mohon tunggu sebentar.',
    'ru' => 'Спасибо за сообщение 🙏 Мы его получили. Наша команда ответит здесь как можно скорее: пожалуйста, подождите.',
    'de' => 'Danke für deine Nachricht 🙏 Sie ist angekommen. Unser Team antwortet dir hier so schnell wie möglich: bitte hab etwas Geduld.',
    'hi' => 'आपके संदेश के लिए धन्यवाद 🙏 हमें मिल गया है। हमारी टीम जल्द से जल्द यहाँ जवाब देगी: कृपया थोड़ा इंतज़ार करें।',
  ];
  $t = $txt[$lang] ?? $txt['en'];
  return live_update(live_thread_file($uid), function ($th) use ($t) {
    $now = time();
    foreach (array_reverse((array) ($th['msgs'] ?? [])) as $m) {
      if (($m['f'] ?? '') === 'a') {
        if ((int) ($m['at'] ?? 0) > $now - 12 * 3600) return ['ok' => false];
        break;
      }
    }
    $msg = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => 'a', 't' => $t, 'at' => $now, 'auto' => 1];
    $th['msgs'] = array_slice(array_merge((array) ($th['msgs'] ?? []), [$msg]), -LIVE_THREAD_KEEP);
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

/* v2773 (propriétaire) — UN SEUL IDENTIFIANT sur tout le site, comme les grands sites : « ORO » + des chiffres, COLLÉS,
   sans tiret et sans mélange (ex. ORO159978) — c'est le numéro du profil. Compris même tapé « 0R0… », « oro », avec des
   espaces ou un tiret, ou seulement les chiffres. L'ancien code de Social (OR + 10 signes) reste compris en coulisses. */
function live_norm_oro_id(string $s): string {
  $s = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $s) ?? '');
  if (preg_match('/^(?:[O0]R[O0])?(\d{4,9})$/', $s, $mm)) return 'ORO-' . $mm[1]; // numéro du profil (forme interne)
  if (preg_match('/^[O0]R([2-9A-HJKMNP-TV-Z]{10})$/', $s, $mm)) return 'OR' . $mm[1]; // ancien code de Social
  return '';
}
/** Forme AFFICHÉE d'un numéro (sans tiret). */
function live_id_show(string $pid): string { return str_replace('-', '', $pid); }
/** La base des comptes (lue une seule fois par demande). */
function live_users_db() { static $db = null; if ($db === null) $db = load_db(); return $db; }
/** Joueur derrière un ancien numéro de profil (ORO-123456). */
function live_uid_of_pub(string $pid): string {
  $db = live_users_db();
  $ids = function_exists('orolado_store_idx_get') && function_exists('orolado_store_dir') ? orolado_store_idx_get($db['_store'] ?? orolado_store_dir(), 'p:' . $pid) : [];
  foreach ($ids as $id) { $u = $db['users'][$id] ?? null; if (is_array($u) && (string) ($u['publicId'] ?? '') === $pid) return (string) $id; }
  if (!$ids) foreach ($db['users'] as $id => $u) if (is_array($u) && (string) ($u['publicId'] ?? '') === $pid) return (string) $id;
  return '';
}
/** L'identifiant AFFICHÉ d'un joueur : son numéro du profil sans tiret (ORO159978). */
function live_code_of(string $uid): string {
  $u = live_users_db()['users'][$uid] ?? null;
  $pid = is_array($u) ? trim((string) ($u['publicId'] ?? '')) : '';
  if ($pid !== '') return live_id_show($pid);
  return live_oro_id(['id' => $uid] + (is_array($u) ? $u : [])); // compte sans numéro (très rare) : ancien code
}

/** Joueur derrière un identifiant (OR… ou ancien numéro) : ['uid','id' (OR…),'name'] ou null. */
function live_who(string $oroId): ?array {
  $m = live_read_json(live_ids_file(), []);
  if (preg_match('/^ORO-\d+$/', $oroId)) {
    $uid = live_uid_of_pub($oroId);
    if ($uid === '') return null;
    $u0 = live_users_db()['users'][$uid] ?? [];
    live_oro_id(['id' => $uid] + (is_array($u0) ? $u0 : [])); // le joueur existe aussi dans Social (nom, messages)
    $m = live_read_json(live_ids_file(), []);
  } else { $uid = (string) ($m['i'][$oroId] ?? ''); }
  $id = $uid !== '' ? live_code_of($uid) : '';
  if ($uid === '') return null;
  $u = live_users_db()['users'][$uid] ?? [];
  return ['uid' => $uid, 'id' => $id, 'name' => (string) ($m['n'][$uid] ?? (is_array($u) ? ($u['displayName'] ?? 'Joueur') : 'Joueur'))];
}

function live_who_uid(string $uid): ?array {
  $m = live_read_json(live_ids_file(), []);
  if (!isset($m['u'][$uid])) return null;
  return ['uid' => $uid, 'id' => live_code_of($uid), 'name' => (string) ($m['n'][$uid] ?? 'Joueur')];
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

/* =====================================================================================================
 * v2687 — JEUX DU JOUR (démo uniquement, aucune valeur réelle) : Roue du jour, Quiz du jour, statistiques, badges.
 * Une roue et un quiz par jour et par joueur (contrôlé par le serveur). Le gain va sur le solde DÉMO.
 * ===================================================================================================== */
const LIVE_WHEEL = [1000, 1000, 2000, 2000, 3000, 5000, 5000, 10000, 20000, 50000];

function live_fun_file(string $uid): string { return live_dir('fun') . '/' . live_safe_id($uid) . '.json'; }
function live_day(): string { return gmdate('Y-m-d'); }

/** Crédite le solde DÉMO du joueur (sans toucher au réel). */
function live_demo_credit(string $uid, float $amount): float {
  $r = with_db_lock(function ($box) use ($uid, $amount) {
    if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 0, 'real' => 0];
    $box->db['vault'][$uid]['demo'] = orolado_money((float) ($box->db['vault'][$uid]['demo'] ?? 0) + $amount);
    return ['ok' => true, 'demo' => $box->db['vault'][$uid]['demo']];
  });
  return (float) ($r['demo'] ?? 0);
}


function live_wheel_spin(string $uid): array {
  $r = live_update(live_fun_file($uid), function ($f) {
    if (($f['wheelDay'] ?? '') === live_day()) return ['ok' => false, 'reason' => 'wheelDone'];
    $i = random_int(0, count(LIVE_WHEEL) - 1);
    $f['wheelDay'] = live_day(); $f['wheels'] = (int) ($f['wheels'] ?? 0) + 1;
    return ['ok' => true, 'i' => $i, 'prize' => LIVE_WHEEL[$i], '__write' => $f];
  });
  if (!empty($r['ok'])) $r['demo'] = live_demo_credit($uid, (float) $r['prize']);
  return $r;
}

/* v2689 (propriétaire) — QUIZ : 50 questions, 5 par jour et par joueur (choisies par le serveur), bonne réponse gardée
 * par le serveur, récompense = POINTS DE NIVEAU (plus d'argent démo : il faussait le tournoi démo).
 * Les textes sont dans js/live-quiz-data.js : la 1re réponse est la bonne ; l'ordre affiché suit live_quiz_perm. */
const LIVE_QUIZ_N = 50;
const LIVE_QUIZ_DAY = 5;
const LIVE_QUIZ_PERMS = [[0, 1, 2], [1, 0, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0]];
function live_quiz_perm(int $i): array { return LIVE_QUIZ_PERMS[($i * 7 + 3) % 6]; }
/** Les 5 questions du jour de ce joueur (toujours les mêmes pour lui ce jour-là). */
function live_quiz_set(string $uid, string $day): array {
  $h = hash('sha256', 'quiz|' . $uid . '|' . $day, true);
  $set = []; $k = 0;
  while (count($set) < LIVE_QUIZ_DAY && $k < 200) {
    $i = (ord($h[$k % 32]) * 256 + ord($h[($k + 7) % 32]) + $k * 13) % LIVE_QUIZ_N;
    if (!in_array($i, $set, true)) $set[] = $i;
    $k++;
  }
  return $set;
}
function live_quiz_answer(string $uid, int $q, int $pick): array {
  $day = live_day();
  if (!in_array($q, live_quiz_set($uid, $day), true) || $pick < 0 || $pick > 2) return ['ok' => false, 'reason' => 'quizDone'];
  $right = (int) array_search(0, live_quiz_perm($q), true);
  $good = $pick === $right;
  $r = live_update(live_fun_file($uid), function ($f) use ($q, $good, $day) {
    if (($f['qDay'] ?? '') !== $day) { $f['qDay'] = $day; $f['qDone'] = []; }
    if (isset($f['qDone'][(string) $q])) return ['ok' => false, 'reason' => 'quizDone'];
    $f['qDone'][(string) $q] = $good ? 1 : 0;
    $f['quizN'] = (int) ($f['quizN'] ?? 0) + 1;
    if ($good) $f['quizOk'] = (int) ($f['quizOk'] ?? 0) + 1;
    $wk = gmdate('o-W');
    if (($f['wk'] ?? '') !== $wk) { $f['wk'] = $wk; $f['wkQuiz'] = 0; }
    $f['wkQuiz'] = (int) ($f['wkQuiz'] ?? 0) + 1;
    return ['ok' => true, '__write' => $f];
  });
  if (empty($r['ok'])) return $r;
  return ['ok' => true, 'good' => $good, 'right' => $right, 'xp' => $good ? LIVE_XP_QUIZ_OK : LIVE_XP_QUIZ];
}

/* v2689 — NIVEAUX (points d'expérience, aucune valeur en argent) et MISSIONS DE LA SEMAINE. */
const LIVE_XP_QUIZ = 1;
const LIVE_XP_QUIZ_OK = 3;
// v2760 (propriétaire) : monter est DUR — la plupart des joueurs restent niveau 1 ou 2 ; ceux qui montent jouent beaucoup
// (surtout en réel), déposent, invitent des amis qui déposent, créent des groupes, réussissent les missions.
const LIVE_XP_LEVELS = [0, 150, 500, 1200, 2500, 5000, 9000, 15000, 25000, 40000, 65000, 100000];
const LIVE_MISSION_XP = 40;

function live_fun_state(string $uid): array {
  $f = live_read_json(live_fun_file($uid), []);
  $day = live_day();
  $done = (($f['qDay'] ?? '') === $day) ? (array) ($f['qDone'] ?? []) : [];
  return ['quizSet' => live_quiz_set($uid, $day), 'quizDone' => (object) $done, 'quizOk' => (int) ($f['quizOk'] ?? 0), 'quizN' => (int) ($f['quizN'] ?? 0),
    'wheels' => (int) ($f['wheels'] ?? 0)];
}

function live_level(int $xp): array {
  $lv = 1;
  foreach (LIVE_XP_LEVELS as $i => $need) if ($xp >= $need) $lv = $i + 1;
  $cur = LIVE_XP_LEVELS[$lv - 1];
  $next = LIVE_XP_LEVELS[$lv] ?? null;
  return ['level' => $lv, 'xp' => $xp, 'from' => $cur, 'to' => $next, 'pct' => $next ? (int) floor(($xp - $cur) * 100 / max(1, $next - $cur)) : 100];
}

/** Statistiques (trades gardés par le serveur), niveau, missions de la semaine, badges. */
function live_my_stats(string $uid): array {
  $db = load_db();
  $n = 0; $w = 0; $best = 0; $cur = 0; $mk = []; $real = 0; $realVol = 0.0; $wkReal = 0;
  $wkStart = (int) strtotime('monday this week 00:00:00 UTC'); if ($wkStart > time()) $wkStart -= 7 * 86400;
  $wkN = 0; $wkMk = []; $wkBest = 0; $wkCur = 0;
  $rows = array_values(array_filter((array) ($db['orders'] ?? []), static fn($o) => is_array($o) && (string) ($o['userId'] ?? '') === $uid && isset($o['net'])));
  usort($rows, static fn($a, $b) => ((float) ($a['at'] ?? 0)) <=> ((float) ($b['at'] ?? 0)));
  foreach ($rows as $o) {
    $n++; $isReal = ($o['mode'] ?? '') === 'real';
    if ($isReal) { $real++; $realVol += max(0.0, (float) ($o['stake'] ?? 0)); }
    $won = !empty($o['won']);
    if ($won) { $w++; $cur++; $best = max($best, $cur); } elseif (empty($o['voided'])) { $cur = 0; }
    $a = (string) ($o['assetId'] ?? ''); if ($a !== '') $mk[$a] = ($mk[$a] ?? 0) + 1;
    if ((float) ($o['at'] ?? 0) >= $wkStart) {
      $wkN++; if ($a !== '') $wkMk[$a] = 1; if ($isReal) $wkReal++;
      if ($won) { $wkCur++; $wkBest = max($wkBest, $wkCur); } elseif (empty($o['voided'])) { $wkCur = 0; }
    }
  }
  arsort($mk);
  $d = live_duel_stats($uid);
  $f = live_read_json(live_fun_file($uid), []);
  $quizOk = (int) ($f['quizOk'] ?? 0); $quizN = (int) ($f['quizN'] ?? 0);
  $wkQuiz = (($f['wk'] ?? '') === gmdate('o-W')) ? (int) ($f['wkQuiz'] ?? 0) : 0;
  $friends = count(live_inbox($uid));
  // Missions de la semaine (calculées par le serveur ; chaque mission réussie est gardée pour toujours).
  // v2760 (propriétaire) : missions plus difficiles (5 par semaine)
  $missions = [
    'trades' => ['have' => min(50, $wkN), 'need' => 50],
    'real' => ['have' => min(10, $wkReal), 'need' => 10],
    'markets' => ['have' => min(5, count($wkMk)), 'need' => 5],
    'streak' => ['have' => min(5, $wkBest), 'need' => 5],
    'quiz' => ['have' => min(20, $wkQuiz), 'need' => 20],
  ];
  $wk = gmdate('o-W');
  $newDone = [];
  foreach ($missions as $k => $m) if ($m['have'] >= $m['need'] && empty($f['missions'][$wk][$k])) $newDone[] = $k;
  if ($newDone) {
    live_update(live_fun_file($uid), function ($ff) use ($wk, $newDone) {
      foreach ($newDone as $k) $ff['missions'][$wk][$k] = 1;
      // on ne garde que les 12 dernières semaines en détail, le total reste compté
      $ff['missionsTotal'] = (int) ($ff['missionsTotal'] ?? 0) + count($newDone);
      if (count($ff['missions']) > 12) $ff['missions'] = array_slice($ff['missions'], -12, null, true);
      return ['ok' => true, '__write' => $ff];
    });
    $f = live_read_json(live_fun_file($uid), []);
  }
  foreach ($missions as $k => &$m) $m['done'] = !empty($f['missions'][$wk][$k]);
  unset($m);
  $missionsTotal = (int) ($f['missionsTotal'] ?? 0);
  // Points de niveau : on joue, on apprend, on défie, on se fait des amis.
  // v2760 : vrais dépôts du joueur (les cadeaux du Défi / de l'invitation ne comptent pas), amis invités qui ont déposé, groupes créés
  $dep = 0.0;
  foreach ((array) (($db['users'][$uid] ?? [])['transactions'] ?? []) as $tx) {
    if (!is_array($tx) || ($tx['type'] ?? '') !== 'deposit' || (($tx['mode'] ?? 'real') !== 'real')) continue;
    $tid = (string) ($tx['id'] ?? ''); $note = (string) ($tx['note'] ?? '');
    if (strpos($tid, 'aff_') === 0 || stripos($note, 'Défi') !== false || stripos($note, 'bonus') !== false || stripos($note, 'cadeau') !== false) continue;
    $dep += max(0.0, (float) ($tx['amount'] ?? 0));
  }
  $invPaid = 0; $invAll = 0;
  if (function_exists('orolado_aff_read') && function_exists('orolado_aff_owner_name')) {
    try { $own = orolado_aff_read(orolado_aff_owner_name($uid)); $fr = is_array($own['friends'] ?? null) ? $own['friends'] : [];
      $invAll = count($fr); $invPaid = count(array_filter($fr, static fn($x) => !empty($x['paid']))); } catch (Throwable $e) { /* jamais bloquant */ }
  }
  $groupsOwned = 0;
  foreach (live_ugroups($uid) as $gid) { $g = live_group_get((string) $gid); if ($g && (string) ($g['owner'] ?? '') === $uid && count((array) ($g['members'] ?? [])) >= 3) $groupsOwned++; }
  $xp = intdiv(max(0, $n - $real), 5) + $real * 2 + (int) floor($realVol) + (int) floor($dep * 2)
    + $quizN + $quizOk * 2 + (int) $d['w'] * 10 + ((int) $d['w'] + (int) $d['l']) * 3
    + min(20, $friends) * 3 + min(50, $invAll) * 20 + $invPaid * 100 + min(5, $groupsOwned) * 30 + $missionsTotal * LIVE_MISSION_XP;
  $lv = live_level($xp);
  $badges = [
    'first' => $n >= 1, 't10' => $n >= 10, 't100' => $n >= 100, 'streak5' => $best >= 5, 'sharp' => $n >= 20 && $w / max(1, $n) >= 0.55,
    'duel' => (int) $d['w'] >= 1, 'friend' => $friends >= 1, 'quiz' => $quizOk >= 1, 'quiz50' => $quizOk >= 50, 'mission' => $missionsTotal >= 1,
    'level5' => $lv['level'] >= 5, 'real' => $real >= 1,
  ];
  return ['n' => $n, 'w' => $w, 'rate' => $n ? round($w * 100 / $n) : 0, 'best' => $best, 'fav' => (string) (array_key_first($mk) ?? ''), 'duel' => $d,
    'quizOk' => $quizOk, 'friends' => $friends, 'badges' => $badges, 'lv' => $lv, 'missions' => $missions, 'missionXp' => LIVE_MISSION_XP];
}

/* =====================================================================================================
 * v2688 — GROUPES (communauté) : créer un groupe (nom + emoji), inviter par lien, discuter à plusieurs
 * (texte + photos), membres, quitter, le créateur peut retirer quelqu'un. Limites cachées.
 * Fichiers : data/live/groups/<id>.json, data/live/ugroups/<uid>.json, data/live/gtok/<jeton>.json
 * ===================================================================================================== */
const LIVE_GROUP_OWN = 5;       // groupes créés par joueur
const LIVE_GROUP_MAX = 5000;    // membres par groupe (v2689 : protection du serveur seulement, jamais affichée aux joueurs)
const LIVE_GROUP_HOUR = 60;     // messages de groupe par heure

function live_group_file(string $gid): string { return live_dir('groups') . '/' . live_safe_id($gid) . '.json'; }
function live_ugroups_file(string $uid): string { return live_dir('ugroups') . '/' . live_safe_id($uid) . '.json'; }
function live_ugroups(string $uid): array { return array_values((array) (live_read_json(live_ugroups_file($uid), [])['g'] ?? [])); }

function live_ugroups_set(string $uid, string $gid, bool $in): void {
  live_update(live_ugroups_file($uid), function ($q) use ($gid, $in) {
    $g = array_values(array_filter((array) ($q['g'] ?? []), static fn($x) => $x !== $gid));
    if ($in) array_unshift($g, $gid);
    return ['ok' => true, '__write' => ['g' => array_slice($g, 0, 100), 'own' => (int) ($q['own'] ?? 0)]];
  });
}

function live_group_get(string $gid): ?array {
  $g = live_read_json(live_group_file($gid), []);
  return $g ?: null;
}

function live_group_clean_name(string $n): string {
  $n = trim(preg_replace('/\s+/u', ' ', live_clean_text($n)) ?? '');
  return preg_match('/^.{1,40}/us', $n, $m) ? $m[0] : '';
}

function live_group_create(string $uid, string $name, string $emoji): array {
  $name = live_group_clean_name($name);
  if ($name === '' || preg_match_all('/./us', $name) < 2) return ['ok' => false, 'reason' => 'gName'];
  $q = live_read_json(live_ugroups_file($uid), []);
  if ((int) ($q['own'] ?? 0) >= LIVE_GROUP_OWN) return ['ok' => false, 'reason' => 'tooMany'];
  $emoji = preg_match('/^[^\sA-Za-z0-9<>"\'&]{1,8}$/u', $emoji) ? $emoji : '💬';
  $gid = 'g' . bin2hex(random_bytes(6));
  $tok = bin2hex(random_bytes(6));
  $g = ['id' => $gid, 'name' => $name, 'emoji' => $emoji, 'owner' => $uid, 'members' => [$uid], 'tok' => $tok, 'msgs' => [], 'at' => time()];
  live_write_json(live_group_file($gid), $g);
  live_write_json(live_dir('gtok') . '/' . $tok . '.json', ['g' => $gid]);
  live_update(live_ugroups_file($uid), function ($q) use ($gid) {
    $g = array_values((array) ($q['g'] ?? [])); array_unshift($g, $gid);
    return ['ok' => true, '__write' => ['g' => $g, 'own' => (int) ($q['own'] ?? 0) + 1]];
  });
  return ['ok' => true, 'g' => $g];
}

function live_group_join(string $uid, string $tok): array {
  $tok = preg_replace('/[^a-f0-9]/', '', strtolower($tok)) ?? '';
  $m = $tok !== '' ? live_read_json(live_dir('gtok') . '/' . $tok . '.json', []) : [];
  $gid = (string) ($m['g'] ?? '');
  if ($gid === '') return ['ok' => false, 'reason' => 'gGone'];
  $r = live_update(live_group_file($gid), function ($g) use ($uid) {
    if (!$g) return ['ok' => false, 'reason' => 'gGone'];
    if (in_array($uid, (array) ($g['kicked'] ?? []), true)) return ['ok' => false, 'reason' => 'gGone'];
    if (in_array($uid, (array) $g['members'], true)) return ['ok' => true, 'g' => $g];
    if (count((array) $g['members']) >= LIVE_GROUP_MAX) return ['ok' => false, 'reason' => 'gFull'];
    $g['members'][] = $uid;
    return ['ok' => true, 'g' => $g, 'joined' => true, '__write' => $g];
  });
  if (!empty($r['ok'])) live_ugroups_set($uid, $gid, true);
  return $r;
}

function live_group_send(string $uid, string $gid, string $text, string $img = ''): array {
  $msg = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => $uid, 't' => $text, 'at' => time()];
  if ($img !== '') $msg['img'] = $img;
  return live_update(live_group_file($gid), function ($g) use ($uid, $msg) {
    if (!$g || !in_array($uid, (array) $g['members'], true)) return ['ok' => false, 'reason' => 'gGone'];
    $msgs = (array) ($g['msgs'] ?? []); $msgs[] = $msg;
    $g['msgs'] = array_slice($msgs, -LIVE_THREAD_KEEP); $g['at'] = $msg['at'];
    return ['ok' => true, 'msg' => $msg, 'g' => $g, '__write' => $g];
  });
}

function live_group_leave(string $uid, string $gid, string $who = ''): array {
  $target = $who !== '' ? $who : $uid;
  $r = live_update(live_group_file($gid), function ($g) use ($uid, $target) {
    if (!$g) return ['ok' => false];
    if ($target !== $uid && (string) $g['owner'] !== $uid) return ['ok' => false, 'reason' => 'gOwner'];
    $g['members'] = array_values(array_filter((array) $g['members'], static fn($m) => $m !== $target));
    if ($target !== $uid) { $g['kicked'] = array_values(array_unique(array_merge((array) ($g['kicked'] ?? []), [$target]))); }
    if ((string) $g['owner'] === $target && $g['members']) $g['owner'] = $g['members'][0];
    return ['ok' => true, '__write' => $g];
  });
  if (!empty($r['ok'])) live_ugroups_set($target, $gid, false);
  unset($r['__write']);
  return $r;
}

/**
 * v2706 (propriétaire, comme WhatsApp) — AJOUTER des membres : un membre ajoute directement ses contacts
 * (les joueurs avec qui il a déjà une conversation dans « Amis »). Pas de lien à partager.
 * Refusé : pas un contact, contact qui l'a bloqué, joueur retiré par le créateur (sauf si c'est le créateur qui ajoute).
 * Chaque ajout laisse une petite ligne dans la discussion (« X a ajouté Y »).
 */
function live_group_add(string $uid, string $gid, array $peers): array {
  $contacts = live_inbox($uid);
  $ok = [];
  foreach (array_slice(array_values(array_unique($peers)), 0, 30) as $p) {
    $p = (string) $p;
    if ($p === '' || $p === $uid || !isset($contacts[$p])) continue;
    if (live_is_blocked($p, $uid)) continue;
    $ok[] = $p;
  }
  if (!$ok) return ['ok' => false, 'reason' => 'gNoneAdded'];
  $added = [];
  $r = live_update(live_group_file($gid), function ($g) use ($uid, $ok, &$added) {
    if (!$g || !in_array($uid, (array) $g['members'], true)) return ['ok' => false, 'reason' => 'gGone'];
    $isOwner = (string) $g['owner'] === $uid;
    foreach ($ok as $p) {
      if (in_array($p, (array) $g['members'], true)) continue;
      if (in_array($p, (array) ($g['kicked'] ?? []), true)) {
        if (!$isOwner) continue;
        $g['kicked'] = array_values(array_filter((array) $g['kicked'], static fn($k) => $k !== $p));
      }
      if (count((array) $g['members']) >= LIVE_GROUP_MAX) break;
      $g['members'][] = $p; $added[] = $p;
      $g['msgs'][] = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => $uid, 'sys' => 'add', 'w' => $p, 't' => '', 'at' => time()];
    }
    $g['msgs'] = array_slice((array) $g['msgs'], -LIVE_THREAD_KEEP);
    if ($added) $g['at'] = time();
    return ['ok' => true, 'g' => $g, '__write' => $g];
  });
  if (empty($r['ok'])) return $r;
  foreach ($added as $p) live_ugroups_set($p, $gid, true);
  unset($r['__write']);
  $r['added'] = $added;
  return $r;
}

/** Une photo envoyée dans un groupe dont le joueur est membre. */
function live_img_in_groups(string $uid, string $name): bool {
  foreach (live_ugroups($uid) as $gid) {
    $g = live_group_get((string) $gid);
    if (!$g || !in_array($uid, (array) $g['members'], true)) continue;
    foreach ((array) ($g['msgs'] ?? []) as $m) if (($m['img'] ?? '') === $name) return true;
  }
  return false;
}
