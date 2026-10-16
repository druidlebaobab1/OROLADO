<?php
declare(strict_types=1);
/**
 * v2607 — Notifications sur le téléphone (comme une vraie application), sans e-mail ni service payant.
 *
 * - Clés VAPID (la « signature » du site auprès de Google / Apple / Mozilla) : créées automatiquement
 *   la première fois dans data/push/vapid.json (jamais dans le code, jamais affichées).
 * - Abonnés : un petit fichier par téléphone dans data/push/subs/ (adresse donnée par le navigateur).
 * - Applis ouvertes : data/push/apps/ (un fichier par appareil, pour compter Android / iPhone).
 * - Envoi : message chiffré (norme RFC 8291 « aes128gcm ») + signature (RFC 8292), par paquets.
 * Rien ici ne touche aux soldes, aux trades ni aux connexions.
 */

function push_dir(string $sub = ''): string {
  $d = dirname(orolado_data_file()) . '/push' . ($sub !== '' ? '/' . $sub : '');
  if (!is_dir($d)) @mkdir($d, 0755, true);
  return $d;
}

function push_b64u_enc(string $bin): string {
  return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function push_b64u_dec(string $s): string {
  $s = strtr(trim($s), '-_', '+/');
  $pad = strlen($s) % 4;
  if ($pad) $s .= str_repeat('=', 4 - $pad);
  $out = base64_decode($s, true);
  return is_string($out) ? $out : '';
}

/** Clé publique brute P-256 (65 octets : 04 || x || y) d'une clé openssl. */
function push_raw_pub($key): string {
  $det = openssl_pkey_get_details($key);
  if (!is_array($det) || empty($det['ec']['x']) || empty($det['ec']['y'])) return '';
  return "\x04" . str_pad($det['ec']['x'], 32, "\0", STR_PAD_LEFT) . str_pad($det['ec']['y'], 32, "\0", STR_PAD_LEFT);
}

/** Clé publique brute (65 octets) → clé openssl. */
function push_pub_from_raw(string $raw) {
  if (strlen($raw) !== 65 || $raw[0] !== "\x04") return false;
  $der = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200') . $raw;
  $pem = "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END PUBLIC KEY-----\n";
  return openssl_pkey_get_public($pem);
}

function push_new_ec_key() {
  return openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1'] + push_win_cfg());
}

/** Clés VAPID du site : lues, ou créées une seule fois (sous verrou). ['pub' => b64u, 'pem' => privée]. */
function push_vapid(): array {
  static $cache = null;
  if (is_array($cache)) return $cache;
  $file = push_dir() . '/vapid.json';
  $read = static function () use ($file): ?array {
    $j = is_file($file) ? json_decode((string) @file_get_contents($file), true) : null;
    return (is_array($j) && !empty($j['pub']) && !empty($j['pem'])) ? $j : null;
  };
  $v = $read();
  if (!$v) {
    $fp = @fopen($file . '.lock', 'c');
    if ($fp) flock($fp, LOCK_EX);
    $v = $read();
    if (!$v) {
      $key = push_new_ec_key();
      $pem = '';
      if ($key) openssl_pkey_export($key, $pem, null, push_win_cfg());
      $pub = $key ? push_raw_pub($key) : '';
      if ($pem !== '' && $pub !== '') {
        $v = ['pub' => push_b64u_enc($pub), 'pem' => $pem, 'at' => date('c')];
        $tmp = $file . '.tmp' . bin2hex(random_bytes(3));
        file_put_contents($tmp, json_encode($v));
        @chmod($tmp, 0600);
        rename($tmp, $file);
      }
    }
    if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
  }
  $cache = $v ?: ['pub' => '', 'pem' => ''];
  return $cache;
}

/** Windows (tests sur le PC) : openssl a besoin de son fichier de réglages. Le serveur Linux le trouve seul. */
function push_win_cfg(): array {
  if (DIRECTORY_SEPARATOR !== '\\' || getenv('OPENSSL_CONF')) return [];
  foreach ([dirname(PHP_BINARY) . '/extras/ssl/openssl.cnf', 'C:/Program Files/Common Files/SSL/openssl.cnf'] as $c) {
    if (is_file($c)) return ['config' => $c];
  }
  return [];
}

/** Signature ECDSA DER → 64 octets r || s (format JWT ES256). */
function push_der_to_raw(string $der): string {
  $o = 0;
  if (ord($der[$o++] ?? "\0") !== 0x30) return '';
  $len = ord($der[$o++]);
  if ($len & 0x80) $o += $len & 0x7f;
  $parts = [];
  for ($i = 0; $i < 2; $i++) {
    if (ord($der[$o++] ?? "\0") !== 0x02) return '';
    $l = ord($der[$o++]);
    $v = substr($der, $o, $l);
    $o += $l;
    $v = ltrim($v, "\0");
    $parts[] = str_pad($v, 32, "\0", STR_PAD_LEFT);
  }
  return $parts[0] . $parts[1];
}

/** En-tête Authorization VAPID pour l'adresse d'envoi (valable 12 h). */
function push_vapid_header(string $endpoint, ?array $vapid = null): string {
  $vapid = $vapid ?: push_vapid();
  $u = parse_url($endpoint);
  $aud = ($u['scheme'] ?? 'https') . '://' . ($u['host'] ?? '');
  $h = push_b64u_enc(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
  $c = push_b64u_enc(json_encode(['aud' => $aud, 'exp' => time() + 12 * 3600, 'sub' => 'mailto:support@orolado.com']));
  $priv = openssl_pkey_get_private((string) $vapid['pem']);
  $sig = '';
  if (!$priv || !openssl_sign($h . '.' . $c, $sig, $priv, OPENSSL_ALGO_SHA256)) return '';
  $raw = push_der_to_raw($sig);
  if (strlen($raw) !== 64) return '';
  return 'vapid t=' . $h . '.' . $c . '.' . push_b64u_enc($raw) . ', k=' . $vapid['pub'];
}

/** Chiffre le message pour un abonné (RFC 8291, aes128gcm). Corps binaire prêt à envoyer, '' si erreur. */
function push_encrypt(string $payload, string $p256dhB64, string $authB64): string {
  $uaPub = push_b64u_dec($p256dhB64);
  $auth = push_b64u_dec($authB64);
  $peer = push_pub_from_raw($uaPub);
  if (!$peer || strlen($auth) < 16) return '';
  $mine = push_new_ec_key();
  if (!$mine) return '';
  $asPub = push_raw_pub($mine);
  $secret = openssl_pkey_derive($peer, $mine, 32);
  if (!is_string($secret) || strlen($secret) !== 32 || strlen($asPub) !== 65) return '';
  $ikm = hash_hkdf('sha256', $secret, 32, "WebPush: info\0" . $uaPub . $asPub, $auth);
  $salt = random_bytes(16);
  $cek = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\0", $salt);
  $nonce = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\0", $salt);
  $tag = '';
  $ct = openssl_encrypt($payload . "\x02", 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag, '', 16);
  if (!is_string($ct)) return '';
  return $salt . pack('N', 4096) . chr(65) . $asPub . $ct . $tag;
}

/** Adresses d'envoi acceptées (services officiels des navigateurs). */
function push_endpoint_ok(string $ep): bool {
  if (strlen($ep) < 20 || strlen($ep) > 800) return false;
  $u = parse_url($ep);
  if (!is_array($u) || ($u['scheme'] ?? '') !== 'https') return false;
  $host = strtolower((string) ($u['host'] ?? ''));
  foreach (['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com', 'push.services.mozilla.com', 'web.push.apple.com', 'push.apple.com', 'notify.windows.com'] as $ok) {
    if ($host === $ok || str_ends_with($host, '.' . $ok)) return true;
  }
  return false;
}

function push_sub_file(string $endpoint): string {
  return push_dir('subs') . '/' . sha1($endpoint) . '.json';
}

/** Enregistre (ou met à jour) un abonné. */
function push_save_sub(array $sub, array $info): bool {
  $ep = (string) ($sub['endpoint'] ?? '');
  $p = (string) ($sub['keys']['p256dh'] ?? '');
  $a = (string) ($sub['keys']['auth'] ?? '');
  if (!push_endpoint_ok($ep) || strlen(push_b64u_dec($p)) !== 65 || strlen(push_b64u_dec($a)) < 16) return false;
  $file = push_sub_file($ep);
  $old = is_file($file) ? (json_decode((string) @file_get_contents($file), true) ?: []) : [];
  $row = [
    'endpoint' => $ep,
    'p256dh' => $p,
    'auth' => $a,
    'plat' => in_array($info['plat'] ?? '', ['android', 'ios', 'pc'], true) ? $info['plat'] : 'pc',
    'app' => !empty($info['app']) ? 1 : 0,
    'lang' => preg_match('/^[a-z]{2}$/', (string) ($info['lang'] ?? '')) ? $info['lang'] : 'fr',
    'uid' => (string) ($info['uid'] ?? '') !== '' ? (string) $info['uid'] : (string) ($old['uid'] ?? ''),
    'test' => !empty($info['test']) || !empty($old['test']) ? 1 : 0,
    'at' => (string) ($old['at'] ?? date('c')),
    'seen' => date('c'),
  ];
  $tmp = $file . '.tmp' . bin2hex(random_bytes(3));
  if (@file_put_contents($tmp, json_encode($row)) === false) return false;
  return @rename($tmp, $file);
}

function push_drop_sub(string $endpoint): void {
  $f = push_sub_file($endpoint);
  if (is_file($f)) @unlink($f);
}

/** Liste des fichiers d'abonnés (ordre stable, pour l'envoi par paquets). */
function push_sub_files(): array {
  $list = glob(push_dir('subs') . '/*.json') ?: [];
  sort($list);
  return $list;
}

/** Appli ouverte sur un appareil (compteur Android / iPhone) — au plus une écriture par jour et par appareil. */
function push_app_ping(string $dev, string $plat): bool {
  if (!preg_match('/^[a-z0-9]{12,40}$/', $dev) || !in_array($plat, ['android', 'ios', 'pc'], true)) return false;
  $f = push_dir('apps') . '/' . $dev . '.json';
  $old = is_file($f) ? (json_decode((string) @file_get_contents($f), true) ?: []) : [];
  if (($old['day'] ?? '') === date('Y-m-d') && ($old['plat'] ?? '') === $plat) return true;
  $row = ['plat' => $plat, 'first' => (string) ($old['first'] ?? date('c')), 'day' => date('Y-m-d'), 'last' => time()];
  return @file_put_contents($f, json_encode($row)) !== false;
}

/** Chiffres pour l'admin. */
function push_stats(): array {
  $s = ['subs' => 0, 'android' => 0, 'ios' => 0, 'pc' => 0, 'test' => 0, 'langs' => [],
    'apps30' => ['android' => 0, 'ios' => 0, 'pc' => 0], 'apps7' => ['android' => 0, 'ios' => 0, 'pc' => 0], 'appsAll' => ['android' => 0, 'ios' => 0, 'pc' => 0]];
  foreach (push_sub_files() as $f) {
    $r = json_decode((string) @file_get_contents($f), true);
    if (!is_array($r)) continue;
    $s['subs']++;
    $pl = (string) ($r['plat'] ?? 'pc');
    if (isset($s[$pl])) $s[$pl]++;
    if (!empty($r['test'])) $s['test']++;
    $lg = (string) ($r['lang'] ?? 'fr');
    $s['langs'][$lg] = ($s['langs'][$lg] ?? 0) + 1;
  }
  arsort($s['langs']);
  $now = time();
  foreach (glob(push_dir('apps') . '/*.json') ?: [] as $f) {
    $r = json_decode((string) @file_get_contents($f), true);
    if (!is_array($r)) continue;
    $pl = (string) ($r['plat'] ?? '');
    if (!isset($s['appsAll'][$pl])) continue;
    $s['appsAll'][$pl]++;
    $age = $now - (int) ($r['last'] ?? 0);
    if ($age <= 30 * 86400) $s['apps30'][$pl]++;
    if ($age <= 7 * 86400) $s['apps7'][$pl]++;
  }
  return $s;
}

/**
 * Envoie un paquet de notifications (en parallèle). $rows = lignes d'abonnés.
 * Retour : ['sent' => n, 'gone' => n (abonnés partis, effacés), 'fail' => n, 'codes' => [...]].
 */
function push_send_rows(array $rows, string $payload): array {
  $out = ['sent' => 0, 'gone' => 0, 'fail' => 0, 'codes' => []];
  if (!$rows) return $out;
  $vapid = push_vapid();
  if (($vapid['pub'] ?? '') === '') { $out['fail'] = count($rows); $out['codes']['cle'] = count($rows); return $out; }
  if (isset($GLOBALS['OROLADO_FAKE_PUSH']) && is_callable($GLOBALS['OROLADO_FAKE_PUSH'])) {
    foreach ($rows as $r) {
      $body = push_encrypt($payload, (string) $r['p256dh'], (string) $r['auth']);
      $code = (int) ($GLOBALS['OROLADO_FAKE_PUSH'])($r, $body, push_vapid_header((string) $r['endpoint'], $vapid));
      push_count_code($out, $code, (string) $r['endpoint']);
    }
    return $out;
  }
  $mh = curl_multi_init();
  $hs = [];
  foreach ($rows as $r) {
    $ep = (string) ($r['endpoint'] ?? '');
    $body = push_encrypt($payload, (string) ($r['p256dh'] ?? ''), (string) ($r['auth'] ?? ''));
    $auth = $body !== '' ? push_vapid_header($ep, $vapid) : '';
    if ($body === '' || $auth === '' || !push_endpoint_ok($ep)) { push_count_code($out, 0, ''); continue; }
    $ch = curl_init($ep);
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => $body,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 15,
      CURLOPT_CONNECTTIMEOUT => 6,
      CURLOPT_HTTPHEADER => [
        'Content-Type: application/octet-stream',
        'Content-Encoding: aes128gcm',
        'TTL: 86400',
        'Urgency: normal',
        'Authorization: ' . $auth,
      ],
    ]);
    curl_multi_add_handle($mh, $ch);
    $hs[] = [$ch, $ep];
  }
  do {
    $st = curl_multi_exec($mh, $running);
    if ($running) curl_multi_select($mh, 1.0);
  } while ($running && $st === CURLM_OK);
  foreach ($hs as [$ch, $ep]) {
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($code === 0 && !isset($out['err'])) $out['err'] = substr((string) curl_error($ch), 0, 160);
    elseif ($code >= 400 && $code !== 404 && $code !== 410 && !isset($out['err'])) $out['err'] = $code . ' ' . substr((string) curl_multi_getcontent($ch), 0, 160);
    push_count_code($out, $code, $ep);
    curl_multi_remove_handle($mh, $ch);
    curl_close($ch);
  }
  curl_multi_close($mh);
  return $out;
}

function push_count_code(array &$out, int $code, string $ep): void {
  $out['codes'][(string) $code] = ($out['codes'][(string) $code] ?? 0) + 1;
  if ($code >= 200 && $code < 300) { $out['sent']++; return; }
  // 404 / 410 : le téléphone s'est désabonné (ou l'appli a été supprimée) → on l'efface.
  if (($code === 404 || $code === 410) && $ep !== '') { push_drop_sub($ep); $out['gone']++; return; }
  $out['fail']++;
}

/** Nombre de lettres (UTF-8 : é, émoji, arabe = 1) — sans dépendre du module mbstring. */
function push_len(string $s): int {
  $n = preg_match_all('/./us', $s);
  return $n === false ? strlen($s) : $n;
}

function push_cut(string $s, int $max): string {
  return preg_match('/^.{0,' . $max . '}/us', $s, $m) ? $m[0] : substr($s, 0, $max);
}

/** Texte de la notification (titre, message, lien) → contenu envoyé au téléphone. */
function push_payload(string $title, string $body, string $url = '/'): string {
  $title = push_cut(trim($title), 80);
  $body = push_cut(trim($body), 240);
  if ($url === '' || $url[0] !== '/' || str_starts_with($url, '//')) $url = '/';
  return json_encode(['title' => $title, 'body' => $body, 'url' => $url, 'tag' => 'oro-' . time()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/**
 * v2674 (propriétaire) — notification sur le(s) téléphone(s) ADMIN seulement (abonnés « test », bouton Test de
 * l'admin) : par ex. « nouvelle demande de retrait » pour payer vite. Jamais envoyée aux joueurs.
 */
function push_notify_admin(string $title, string $body, string $url = '/admin.php'): array {
  $rows = [];
  foreach (push_sub_files() as $f) {
    $r = json_decode((string) @file_get_contents($f), true);
    if (is_array($r) && !empty($r['test'])) $rows[] = $r;
  }
  if (!$rows) return ['sent' => 0, 'gone' => 0, 'fail' => 0, 'codes' => []];
  return push_send_rows($rows, push_payload($title, $body, $url));
}

/** Journal des envois (pour l'admin). */
function push_log_add(array $row): void {
  $f = push_dir() . '/journal.json';
  $fp = @fopen($f, 'c+');
  if (!$fp) return;
  flock($fp, LOCK_EX);
  $list = json_decode((string) stream_get_contents($fp), true);
  if (!is_array($list)) $list = [];
  $found = false;
  foreach ($list as &$l) {
    if (($l['id'] ?? '') === ($row['id'] ?? '-')) { $l = array_merge($l, $row); $found = true; break; }
  }
  unset($l);
  if (!$found) array_unshift($list, $row);
  $list = array_slice($list, 0, 40);
  rewind($fp);
  ftruncate($fp, 0);
  fwrite($fp, json_encode($list, JSON_UNESCAPED_UNICODE));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
}

function push_log_list(): array {
  $f = push_dir() . '/journal.json';
  $list = is_file($f) ? json_decode((string) @file_get_contents($f), true) : [];
  return is_array($list) ? $list : [];
}
