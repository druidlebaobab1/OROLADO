<?php
declare(strict_types=1);

function orolado_load_env(?string $path = null): void {
  static $loaded = false;
  if ($loaded && $path === null) return;
  $paths = $path ? [$path] : [__DIR__ . '/.env', __DIR__ . '/data/.env'];
  foreach ($paths as $file) {
    if (!is_file($file)) continue;
    $lines = file($file, FILE_IGNORE_NEW_LINES);
    if (!is_array($lines)) continue;
    foreach ($lines as $line) {
      $line = trim($line);
      if ($line === '' || str_starts_with($line, '#')) continue;
      $eq = strpos($line, '=');
      if ($eq === false) continue;
      $key = trim(substr($line, 0, $eq));
      $val = trim(substr($line, $eq + 1));
      if ($key === '') continue;
      if ($val !== '' && (($val[0] === '"' && str_ends_with($val, '"')) || ($val[0] === "'" && str_ends_with($val, "'")))) {
        $val = substr($val, 1, -1);
      }
      $cur = getenv($key);
      if ($cur === false || $cur === '') {
        putenv($key . '=' . $val);
        $_ENV[$key] = $val;
        $_SERVER[$key] = $val;
      }
    }
  }
  if ($path === null) $loaded = true;
}

function orolado_data_dir(): string {
  $dir = __DIR__ . '/data';
  if (!is_dir($dir)) mkdir($dir, 0755, true);
  return $dir;
}

function orolado_data_file(): string {
  return orolado_data_dir() . '/orolado.json';
}

/** Journal de diagnostic Maketou : dossier /data protégé par .htaccess. */
function maketou_log_file(): string {
  return orolado_data_dir() . '/debug_maketou.log';
}

/** Masque un secret : on garde juste de quoi identifier la valeur. */
function maketou_log_mask(string $v): string {
  $v = trim($v);
  if ($v === '') return '';
  $n = strlen($v);
  if ($n <= 8) return str_repeat('*', $n);
  return substr($v, 0, 4) . '…' . substr($v, -4) . ' (' . $n . ')';
}

function maketou_log(string $event, array $data = []): void {
  $file = maketou_log_file();
  if (is_file($file) && filesize($file) > 1048576) {
    $lines = file($file, FILE_IGNORE_NEW_LINES) ?: [];
    @file_put_contents($file, implode("\n", array_slice($lines, -400)) . "\n", LOCK_EX);
  }
  $row = array_merge(['ts' => date('c'), 'event' => $event], $data);
  $line = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
  if ($line === false) $line = json_encode(['ts' => date('c'), 'event' => $event, 'encode' => 'failed']);
  @file_put_contents($file, $line . "\n", FILE_APPEND | LOCK_EX);
}

/** Capture brute de la requête entrante : GET, corps et en-têtes (secrets masqués). */
function maketou_log_request(string $event): void {
  $headers = [];
  foreach ($_SERVER as $k => $v) {
    if (!str_starts_with((string) $k, 'HTTP_') && !in_array($k, ['CONTENT_TYPE', 'CONTENT_LENGTH'], true)) continue;
    $name = str_replace('_', '-', strtolower(str_starts_with((string) $k, 'HTTP_') ? substr((string) $k, 5) : (string) $k));
    $val = (string) $v;
    if (in_array($name, ['authorization', 'cookie', 'x-api-key', 'api-key'], true)) $val = maketou_log_mask($val);
    $headers[$name] = $val;
  }
  $raw = file_get_contents('php://input');
  if (!is_string($raw)) $raw = '';
  $json = json_decode($raw, true);
  if (is_array($json) && isset($json['token'])) $json['token'] = maketou_log_mask((string) $json['token']);
  $raw = preg_replace('/("token"\s*:\s*")[^"]*(")/i', '$1***$2', $raw) ?? $raw;
  maketou_log($event, [
    'method' => (string) ($_SERVER['REQUEST_METHOD'] ?? ''),
    'uri' => (string) ($_SERVER['REQUEST_URI'] ?? ''),
    'ip' => (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
    'get' => $_GET,
    'post' => $_POST,
    'body_raw' => substr($raw, 0, 6000),
    'body_json' => is_array($json) ? $json : null,
    'headers' => $headers,
  ]);
}

function blank_db(): array {
  return ['users' => [], 'vault' => [], 'withdrawals' => [], 'sessions' => [], 'orders' => [], 'deposits' => [], 'processedTx' => [], 'support_messages' => [], 'admin_logs' => [], 'currency' => 'USD'];
}

/** Montants plateforme en USD (2 décimales). */
function orolado_money($n): float {
  return round((float) $n, 2);
}

/** Taux fixe Mobile Money local : 1 USD = 600 FCFA (ex. 3 $ = 1 800 FCFA). */
function orolado_usd_fcfa_rate(): float {
  orolado_load_env();
  $r = (float) (getenv('USD_FCFA_RATE') ?: ($_ENV['USD_FCFA_RATE'] ?? 600));
  return $r > 0 ? $r : 600.0;
}

function orolado_usd_to_fcfa($usd): int {
  return (int) round(orolado_money($usd) * orolado_usd_fcfa_rate());
}

function orolado_fcfa_to_usd($fcfa): float {
  return orolado_money(((float) $fcfa) / orolado_usd_fcfa_rate());
}

function orolado_min_withdraw(): float {
  return 3.0;
}

function orolado_max_deposit_usd(): float {
  return 100000.0;
}

function supabase_env(string $key): string {
  orolado_load_env();
  $v = getenv($key);
  if ($v === false || $v === '') $v = $_ENV[$key] ?? '';
  return trim((string) $v);
}

function supabase_project_url(): string {
  $url = rtrim(supabase_env('SUPABASE_URL'), '/');
  if ($url !== '') return $url;
  return 'https://tubyuyxuswwzebicrhkg.supabase.co';
}

function supabase_usable_key(string $key): string {
  $key = trim($key);
  if ($key === '' || preg_match('#^https?://#i', $key)) return '';
  return $key;
}

function supabase_anon_key(): string {
  $k = supabase_usable_key(supabase_env('SUPABASE_ANON_KEY'));
  if ($k !== '') return $k;
  return 'sb_publishable_zaJSnXA3yY17-I4eBXCtsw_F_-tCW1z';
}

function supabase_service_key(): string {
  return supabase_usable_key(supabase_env('SUPABASE_SERVICE_ROLE_KEY'));
}

function supabase_http(string $url, array $headers, ?string $body = null, string $method = 'GET'): ?array {
  if (!function_exists('curl_init')) return null;
  $ch = curl_init($url);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => $headers,
  ];
  $method = strtoupper($method);
  if ($method === 'POST') {
    $opts[CURLOPT_POST] = true;
    $opts[CURLOPT_POSTFIELDS] = $body ?? '{}';
  } else if ($method !== 'GET') {
    $opts[CURLOPT_CUSTOMREQUEST] = $method;
    if ($body !== null) $opts[CURLOPT_POSTFIELDS] = $body;
  }
  curl_setopt_array($ch, $opts);
  $raw = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code < 200 || $code >= 300) {
    error_log('OROLADO supabase HTTP ' . $code . ' ' . $url . ' ' . substr((string) $raw, 0, 300));
    return null;
  }
  if (!is_string($raw) || $raw === '') return [];
  $json = json_decode($raw, true);
  return is_array($json) ? $json : [];
}

function supabase_fetch_auth_user(string $token): ?array {
  $url = supabase_project_url();
  $anon = supabase_anon_key();
  if ($url === '' || $anon === '' || $token === '' || !str_starts_with($token, 'eyJ')) return null;
  $json = supabase_http($url . '/auth/v1/user', [
    'Authorization: Bearer ' . $token,
    'apikey: ' . $anon,
  ]);
  if (!is_array($json) || empty($json['id'])) return null;
  return $json;
}

function supabase_admin_headers(): array {
  $key = supabase_service_key();
  if ($key === '') return [];
  return [
    'Content-Type: application/json',
    'apikey: ' . $key,
    'Authorization: Bearer ' . $key,
    'Prefer: return=representation',
  ];
}

function supabase_admin_ready(): bool {
  return supabase_service_key() !== '' && supabase_project_url() !== '';
}

function supabase_credit_real(string $userId, $amount, bool $depositTx = true): void {
  $amount = orolado_money($amount);
  $url = supabase_project_url();
  $hdrs = supabase_admin_headers();
  if ($url === '' || abs($amount) < 0.0001 || !$hdrs) {
    if (!$hdrs) error_log('OROLADO: SUPABASE_SERVICE_ROLE_KEY absente — impossible d’écrire vaults.real');
    return;
  }
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return;
  $rpc = supabase_http($url . '/rest/v1/rpc/credit_real', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount]), 'POST');
  if ($rpc === null) {
    $alt = supabase_http($url . '/rest/v1/rpc/increment_balance', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount]), 'POST');
    if ($alt === null) error_log('OROLADO credit_real/increment_balance échec user=' . $userId);
  }
  if ($depositTx && $amount > 0) {
    supabase_http($url . '/rest/v1/transactions', $hdrs, json_encode([
      'id' => 'dep_' . bin2hex(random_bytes(8)),
      'user_id' => $userId,
      'type' => 'deposit',
      'amount' => $amount,
      'note' => 'Recharge Maketou',
      'mode' => 'real',
    ]), 'POST');
  }
}

function supabase_debit_real(string $userId, $amount): bool {
  $amount = orolado_money($amount);
  if ($amount <= 0) return true;
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return false;
  $url = supabase_project_url();
  $rpc = supabase_http($url . '/rest/v1/rpc/debit_real', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount]), 'POST');
  if (is_array($rpc) && isset($rpc[0]) && is_array($rpc[0])) $rpc = $rpc[0];
  if (is_array($rpc) && !empty($rpc['ok'])) return true;
  if (is_array($rpc) && isset($rpc['reason']) && $rpc['reason'] === 'insufficient') return false;
  $vault = supabase_admin_vault($userId);
  if ($vault && (int) $vault['real'] < $amount) return false;
  supabase_credit_real($userId, -$amount, false);
  return true;
}

/**
 * Crédit de gain confié à la base : `resolve_trade` additionne et refuse le
 * double règlement d'un même orderId, donc 5 trades simultanés ne s'écrasent pas.
 */
function supabase_resolve_trade(string $userId, string $orderId, int $amount): ?array {
  $hdrs = supabase_admin_headers();
  if (!$hdrs || $orderId === '') return null;
  $rpc = supabase_http(
    supabase_project_url() . '/rest/v1/rpc/resolve_trade',
    $hdrs,
    json_encode(['p_user' => $userId, 'p_order' => $orderId, 'p_amount' => $amount]),
    'POST'
  );
  if (is_array($rpc) && isset($rpc[0]) && is_array($rpc[0])) $rpc = $rpc[0];
  if (!is_array($rpc) || empty($rpc['ok'])) return null;
  return [
    'real' => (int) ($rpc['real'] ?? 0),
    'duplicate' => !empty($rpc['duplicate']),
  ];
}

function supabase_sync_real_min(string $userId, $minReal): void {
  $minReal = orolado_money($minReal);
  if ($minReal <= 0) return;
  $vault = supabase_admin_vault($userId);
  $cur = $vault ? orolado_money($vault['real'] ?? 0) : 0;
  if ($minReal > $cur) supabase_credit_real($userId, $minReal - $cur, false);
}

function supabase_insert_deposit(array $row): void {
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return;
  $url = supabase_project_url() . '/rest/v1/deposits';
  $res = supabase_http($url, $hdrs, json_encode($row, JSON_UNESCAPED_UNICODE), 'POST');
  if ($res === null && isset($row['reference'])) {
    unset($row['reference']);
    supabase_http($url, $hdrs, json_encode($row, JSON_UNESCAPED_UNICODE), 'POST');
  }
}

function supabase_patch_deposit(string $ref, array $fields): void {
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return;
  supabase_http(
    supabase_project_url() . '/rest/v1/deposits?id=eq.' . rawurlencode($ref),
    $hdrs,
    json_encode($fields, JSON_UNESCAPED_UNICODE),
    'PATCH'
  );
}

function supabase_get_deposit(string $ref): ?array {
  $hdrs = supabase_admin_headers();
  if (!$hdrs || $ref === '') return null;
  $url = supabase_project_url();
  $rows = supabase_http($url . '/rest/v1/deposits?id=eq.' . rawurlencode($ref) . '&select=id,user_id,amount,status,sell_id', $hdrs);
  if (!is_array($rows) || !isset($rows[0])) {
    $rows = supabase_http($url . '/rest/v1/deposits?reference=eq.' . rawurlencode($ref) . '&select=id,user_id,amount,status,sell_id', $hdrs);
  }
  if (!is_array($rows) || !isset($rows[0])) return null;
  return $rows[0];
}

function supabase_admin_vault(string $userId): ?array {
  $hdrs = supabase_admin_headers();
  if (!$hdrs || !preg_match('/^[0-9a-f-]{36}$/i', $userId)) return null;
  $rows = supabase_http(supabase_project_url() . '/rest/v1/vaults?user_id=eq.' . rawurlencode($userId) . '&select=demo,real', $hdrs);
  if (!is_array($rows) || !isset($rows[0])) return null;
  return ['demo' => (int) ($rows[0]['demo'] ?? 0), 'real' => (int) ($rows[0]['real'] ?? 0)];
}

function supabase_complete_deposit(string $ref, $amount, string $userId): ?array {
  $amount = orolado_money($amount);
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return null;
  $url = supabase_project_url();
  $rpc = supabase_http($url . '/rest/v1/rpc/complete_deposit', $hdrs, json_encode(['p_ref' => $ref, 'p_amount' => $amount]), 'POST');
  if (is_array($rpc) && isset($rpc[0]) && is_array($rpc[0])) $rpc = $rpc[0];
  if (is_array($rpc) && !empty($rpc['ok'])) return $rpc;
  if (is_array($rpc) && !empty($rpc['duplicate'])) return $rpc;
  if (is_array($rpc) && isset($rpc['reason']) && $rpc['reason'] !== 'unknown') return $rpc;
  supabase_credit_real($userId, $amount);
  supabase_patch_deposit($ref, ['status' => 'COMPLETED', 'completed_at' => date('c'), 'amount' => $amount]);
  return ['ok' => true, 'amount' => $amount, 'user_id' => $userId, 'fallback' => true];
}

function orolado_session_user(array &$db, ?string $token): ?array {
  if (!$token) return null;
  $token = trim((string) $token);
  if ($token === '') return null;
  if (!isset($db['sessions']) || !is_array($db['sessions'])) $db['sessions'] = [];
  if (!isset($db['users']) || !is_array($db['users'])) $db['users'] = [];
  foreach ($db['sessions'] as $sid => $sess) {
    if ($sid !== $token) continue;
    $uid = (string) ($sess['userId'] ?? '');
    if ($uid === '' || !isset($db['users'][$uid])) return null;
    return $db['users'][$uid];
  }
  $sb = supabase_fetch_auth_user($token);
  if (!$sb || empty($sb['id'])) return null;
  $id = (string) $sb['id'];
  if (!isset($db['users'][$id])) {
    $email = strtolower((string) ($sb['email'] ?? ''));
    $meta = is_array($sb['user_metadata'] ?? null) ? $sb['user_metadata'] : [];
    $name = (string) ($meta['display_name'] ?? '');
    if ($name === '') $name = $email !== '' ? explode('@', $email)[0] : 'Trader';
    $db['users'][$id] = [
      'id' => $id,
      'displayName' => $name,
      'email' => $email,
      'phone' => (string) ($meta['phone'] ?? ''),
      'countryCode' => (string) ($meta['country_code'] ?? '+225'),
      'passwordHash' => '',
      'role' => 'user',
      'createdAt' => date('c'),
      'mode' => 'demo',
      'assetId' => 'v100',
      'duration' => 10,
      'trades' => 0,
      'wins' => 0,
      'realTrades' => 0,
      'realStakeVolume' => 0,
      'transactions' => [],
      'positions' => []
    ];
    if (!isset($db['vault'][$id])) $db['vault'][$id] = ['demo' => 1000000, 'real' => 0];
    save_db(orolado_data_file(), $db);
  }
  return $db['users'][$id];
}

function orolado_admin_emails(): array {
  $primary = strtolower(trim((string) (getenv('ADMIN_EMAIL') ?: ($_ENV['ADMIN_EMAIL'] ?? 'admin@orolado.com'))));
  if ($primary === '') $primary = 'admin@orolado.com';
  return array_values(array_unique([$primary, 'admin@orolado.com']));
}

function orolado_is_reserved_admin_email(string $email): bool {
  $email = strtolower(trim($email));
  return $email !== '' && in_array($email, orolado_admin_emails(), true);
}

function orolado_session_ttl(): int {
  return 100 * 365 * 24 * 60 * 60;
}

function orolado_master_admin_password(): string {
  return 'AdminOrolado2026!';
}

function orolado_admin_plain_passwords(): array {
  $env = trim((string) (getenv('ADMIN_PASSWORD') ?: ($_ENV['ADMIN_PASSWORD'] ?? '')));
  $out = [orolado_master_admin_password()];
  if ($env !== '') $out[] = $env;
  return array_values(array_unique($out));
}

function orolado_hash_password(string $pw): string {
  $pw = trim($pw);
  if ($pw === '') return '';
  $hash = password_hash($pw, PASSWORD_DEFAULT);
  return is_string($hash) && $hash !== '' ? $hash : hash('sha256', 'orolado|' . $pw);
}

function orolado_verify_password(string $password, string $storedHash): bool {
  $password = trim($password);
  $storedHash = trim($storedHash);
  if ($password === '' || $storedHash === '') return false;
  if (str_starts_with($storedHash, '$2y$') || str_starts_with($storedHash, '$2a$') || str_starts_with($storedHash, '$2b$')
    || str_starts_with($storedHash, '$argon2')) {
    return password_verify($password, $storedHash);
  }
  if (hash_equals($storedHash, hash('sha256', 'orolado|' . $password))) return true;
  if (hash_equals($storedHash, hash('sha256', '6diablo|' . $password))) return true;
  return false;
}

function orolado_admin_password_ok(string $password, ?array $user): bool {
  $password = trim($password);
  if ($password === '') return false;
  foreach (orolado_admin_plain_passwords() as $plain) {
    if (hash_equals($plain, $password)) return true;
  }
  if ($user && orolado_verify_password($password, (string) ($user['passwordHash'] ?? ''))) return true;
  return false;
}

function orolado_set_session_cookie(string $tok): void {
  if ($tok === '') return;
  $ttl = orolado_session_ttl();
  $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
  if (PHP_VERSION_ID >= 70300) {
    setcookie('oro_token', $tok, [
      'expires' => time() + $ttl,
      'path' => '/',
      'secure' => $secure,
      'httponly' => false,
      'samesite' => 'Lax',
    ]);
  } else {
    setcookie('oro_token', $tok, time() + $ttl, '/; SameSite=Lax', '', $secure, false);
  }
}

function orolado_new_session(string $userId): array {
  return [
    'userId' => $userId,
    'at' => date('c'),
    'exp' => time() + orolado_session_ttl(),
  ];
}

function orolado_bootstrap_admin(array &$db, string $file): void {
  $email = 'admin@orolado.com';
  $master = orolado_master_admin_password();
  $admin = null;
  $adminId = 'admin_master';
  foreach ($db['users'] as $id => $u) {
    if (!is_array($u)) continue;
    $mail = strtolower(trim((string) ($u['email'] ?? '')));
    if ((string) ($u['id'] ?? $id) === 'admin_master' || $mail === $email) {
      $admin = $u;
      $adminId = (string) ($u['id'] ?? $id);
      break;
    }
  }
  $needSave = false;
  if (!$admin) {
    $admin = [
      'id' => 'admin_master',
      'displayName' => 'Orolado',
      'email' => $email,
      'phone' => '0000000000',
      'countryCode' => '+225',
      'passwordHash' => orolado_hash_password($master),
      'role' => 'admin',
      'createdAt' => date('c'),
      'mode' => 'demo',
      'assetId' => 'v100',
      'duration' => 10,
      'trades' => 0,
      'wins' => 0,
      'realTrades' => 0,
      'realStakeVolume' => 0,
      'transactions' => [],
      'positions' => []
    ];
    $adminId = 'admin_master';
    $needSave = true;
  } else {
    if (strtolower(trim((string) ($admin['email'] ?? ''))) !== $email) {
      $admin['email'] = $email;
      $needSave = true;
    }
    if ((string) ($admin['role'] ?? '') !== 'admin') {
      $admin['role'] = 'admin';
      $needSave = true;
    }
    if (!orolado_verify_password($master, (string) ($admin['passwordHash'] ?? ''))) {
      $admin['passwordHash'] = orolado_hash_password($master);
      $needSave = true;
    }
  }
  $admin['id'] = $adminId;
  $db['users'][$adminId] = $admin;
  if (!isset($db['vault'][$adminId])) {
    $db['vault'][$adminId] = ['demo' => 1000000, 'real' => 0];
    $needSave = true;
  }
  if ($needSave) save_db($file, $db);
}

/** Accès admin : session + rôle serveur + e-mail autorisé. Jamais un flag client. */
function orolado_is_admin_user(?array $me): bool {
  if (!$me) return false;
  if ((string) ($me['role'] ?? '') !== 'admin') return false;
  $id = (string) ($me['id'] ?? '');
  $email = strtolower(trim((string) ($me['email'] ?? '')));
  if ($id === 'admin_master') return true;
  return orolado_is_reserved_admin_email($email);
}

function orolado_public_user(array $user): array {
  unset($user['passwordHash'], $user['password'], $user['is_admin']);
  return $user;
}

function orolado_deny_admin(): void {
  $code = http_response_code();
  if ($code === 200 || $code === false) http_response_code(403);
  echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Accès admin refusé']);
  exit;
}

function orolado_require_admin(array &$db, ?string $token): array {
  $me = orolado_session_user($db, $token);
  if (!$me || !orolado_is_admin_user($me)) {
    http_response_code($me ? 403 : 401);
    orolado_deny_admin();
  }
  return $me;
}

function orolado_public_origin(): string {
  $env = getenv('OROLADO_ORIGIN');
  if ($env === false || $env === '') $env = $_ENV['OROLADO_ORIGIN'] ?? '';
  if (is_string($env) && $env !== '') return rtrim($env, '/');
  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
    || (($_SERVER['SERVER_PORT'] ?? '') === '443');
  $host = $_SERVER['HTTP_HOST'] ?? 'orolado.com';
  return ($https ? 'https://' : 'http://') . $host;
}

function load_db(?string $file = null): array {
  $file = $file ?: orolado_data_file();
  if (!is_file($file)) return blank_db();
  $fp = fopen($file, 'r');
  if (!$fp) return blank_db();
  flock($fp, LOCK_SH);
  $raw = stream_get_contents($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  $data = json_decode($raw ?: '', true);
  return is_array($data) ? array_merge(blank_db(), $data) : blank_db();
}

function save_db(string $file, array $db): bool {
  $fp = fopen($file, 'c+');
  if (!$fp) return false;
  flock($fp, LOCK_EX);
  ftruncate($fp, 0);
  rewind($fp);
  $ok = fwrite($fp, json_encode($db, JSON_UNESCAPED_UNICODE)) !== false;
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  return $ok;
}

/** Lecture + écriture atomique du JSON (évite les courses entre trades simultanés). */
function with_db_lock(callable $fn) {
  $file = orolado_data_file();
  $fp = fopen($file, 'c+');
  if (!$fp) return ['ok' => false, 'reason' => 'Stockage indisponible'];
  flock($fp, LOCK_EX);
  $raw = stream_get_contents($fp);
  $data = json_decode($raw ?: '', true);
  $box = new stdClass();
  $box->db = is_array($data) ? array_merge(blank_db(), $data) : blank_db();
  $result = $fn($box);
  $db = $box->db;
  if (!is_array($result) || empty($result['skip_write'])) {
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($db, JSON_UNESCAPED_UNICODE));
    fflush($fp);
  }
  flock($fp, LOCK_UN);
  fclose($fp);
  if (is_array($result)) unset($result['skip_write']);
  return $result;
}

function maketou_alias_email(?string $userId = null): string {
  $tag = $userId ? substr(hash('sha256', $userId), 0, 8) : bin2hex(random_bytes(4));
  return 'trader_' . $tag . '_' . bin2hex(random_bytes(3)) . '@orolado-pay.com';
}

function maketou_alias_phone(): string {
  return '+22507' . str_pad((string) random_int(10000000, 99999999), 8, '0', STR_PAD_LEFT);
}

function maketou_checkout_base(): string {
  return 'https://welcome-6.mymaketou.shop/products/welcome/checkout';
}

function maketou_product_id(): string {
  return 'dc38d82a-9074-4f73-9cca-50959ea58e94';
}

function maketou_catalog_product_id(): string {
  return '44ea6357-b8da-45e5-9d12-4fb0fe41acfe';
}

function maketou_store_id(): string {
  return 'ab0c8fa8-853c-4a01-b9a9-8ff504f6aadf';
}

function maketou_split_name(string $name): array {
  $name = trim(preg_replace('/\s+/', ' ', $name) ?? '');
  if ($name === '' || strcasecmp($name, 'Client Orolado') === 0) return ['Trader', 'Orolado'];
  $parts = explode(' ', $name, 2);
  $first = trim((string) ($parts[0] ?? ''));
  $last = trim((string) ($parts[1] ?? ''));
  if ($first === '') $first = 'Trader';
  if (strlen($last) < 2) $last = 'Orolado';
  return [$first, $last];
}

/** Coordonnées client pour Maketou : e-mail toujours anonymisé (jamais l’e-mail Orolado réel). */
function maketou_customer_from_user(array $me): array {
  $email = maketou_alias_email((string) ($me['id'] ?? ''));
  $cc = '225';
  $phoneRaw = maketou_alias_phone();
  $phone = preg_replace('/\D/', '', $phoneRaw) ?? '';
  if (str_starts_with($phone, $cc) && strlen($phone) > strlen($cc)) {
    $phone = substr($phone, strlen($cc));
  }
  [$first, $last] = maketou_split_name((string) ($me['displayName'] ?? 'Trader'));
  return [
    'email' => $email,
    'phone' => $phone,
    'phoneE164' => '+' . $cc . $phone,
    'countryCode' => $cc,
    'firstName' => $first,
    'lastName' => $last,
    'displayName' => trim($first . ' ' . $last),
  ];
}

function maketou_checkout_url(string $email, string $phone, string $ref, int $amount = 0, string $op = 'wave', string $name = 'Client Orolado', string $returnUrl = '', array $extra = []): string {
  [$first, $last] = maketou_split_name($name);
  if (!empty($extra['firstName'])) $first = (string) $extra['firstName'];
  if (!empty($extra['lastName'])) $last = (string) $extra['lastName'];
  $phoneLocal = preg_replace('/\D/', '', $phone) ?? '';
  if (str_starts_with($phoneLocal, '225')) $phoneLocal = substr($phoneLocal, 3);
  $origin = orolado_public_origin();
  $dashUrl = $origin . '/?deposit=success&ref=' . rawurlencode($ref);
  if ($returnUrl === '') $returnUrl = $dashUrl;
  $amount = max(1, (int) $amount);
  $qs = [
    'customPrice' => $amount,
    'customerPrice' => $amount,
    'price' => $amount,
    'amount' => $amount,
    'total' => $amount,
    'totalPrice' => $amount,
    'firstName' => $first,
    'lastName' => $last,
    'firstname' => $first,
    'lastname' => $last,
    'name' => trim($first . ' ' . $last),
    'fullName' => trim($first . ' ' . $last),
    'email' => $email,
    'phone' => $phoneLocal !== '' ? $phoneLocal : $phone,
    'phoneNumber' => $phoneLocal !== '' ? $phoneLocal : $phone,
    'tel' => $phoneLocal !== '' ? $phoneLocal : $phone,
    'country' => 'CI',
    'countryCode' => 'CI',
    'currency' => 'XOF',
    'product_id' => maketou_product_id(),
    'ref' => $ref,
    'operator' => $op,
    'payment_method' => $op,
    'step' => 'payment',
    'success_url' => $dashUrl,
    'return_url' => $dashUrl,
    'redirect_url' => $dashUrl,
    'cancel_url' => $origin . '/?payment=cancel&ref=' . rawurlencode($ref),
  ];
  return maketou_checkout_base() . '?' . http_build_query($qs);
}

function maketou_api_key(): string {
  orolado_load_env();
  $key = getenv('MAKETOU_API_KEY');
  if ($key === false || $key === '') $key = $_ENV['MAKETOU_API_KEY'] ?? ($_SERVER['MAKETOU_API_KEY'] ?? '');
  return trim((string) $key);
}

function maketou_verify_hmac(string $raw): bool {
  $secret = maketou_api_key();
  if ($secret === '') return true;
  $headers = [
    $_SERVER['HTTP_X_SHOPLINE_HMAC_SHA256'] ?? '',
    $_SERVER['HTTP_X_MAKETOU_HMAC_SHA256'] ?? '',
    $_SERVER['HTTP_X_HMAC_SHA256'] ?? '',
    $_SERVER['HTTP_X_SIGNATURE'] ?? '',
  ];
  $expectedB64 = base64_encode(hash_hmac('sha256', $raw, $secret, true));
  $expectedHex = hash_hmac('sha256', $raw, $secret);
  foreach ($headers as $h) {
    $h = trim($h);
    if ($h === '') continue;
    if (hash_equals($expectedB64, $h) || hash_equals($expectedHex, strtolower($h))) return true;
  }
  return false;
}

function maketou_flatten($node, string $prefix, array &$bag): void {
  if (!is_array($node)) return;
  foreach ($node as $k => $v) {
    $key = $prefix === '' ? (string) $k : $prefix . '.' . $k;
    if (is_array($v)) maketou_flatten($v, $key, $bag);
    elseif (is_scalar($v) || $v === null) $bag[strtolower($key)] = (string) $v;
  }
}

function maketou_extract_payment(array $payload): array {
  $bag = [];
  maketou_flatten($payload, '', $bag);
  $ref = '';
  $email = '';
  $amount = 0;
  $paid = false;
  $refused = false;
  $extId = '';
  $sellId = '';
  $phone = '';
  foreach ($bag as $k => $v) {
    $lv = strtolower($v);
    if ($email === '' && str_contains($lv, '@') && (
      str_contains($lv, '@privatesync.net')
      || str_contains($lv, '@privateroute.net')
      || str_contains($lv, '@orolado-pay.com')
      || (str_contains($lv, '@orolado.com') && str_starts_with($lv, 'client'))
      || str_starts_with($lv, 'usr_')
    )) $email = $lv;
    if ($ref === '' && (str_contains($k, 'ref') || $k === 'note' || str_ends_with($k, '.note') || str_contains($k, 'reference'))) {
      if (str_starts_with($v, 'oro_')) $ref = $v;
    }
    if ($extId === '' && (str_contains($k, 'order_id') || $k === 'id' || str_ends_with($k, '.id'))) {
      if ($v !== '') $extId = $v;
    }
    if ($sellId === '' && (str_contains($k, 'sellid') || $k === 'sell_id' || str_contains($k, 'sell_id'))) {
      if ($v !== '') $sellId = $v;
    }
    if ($phone === '' && (str_contains($k, 'phone') || str_contains($k, 'whatsapp') || str_contains($k, 'msisdn'))) {
      $digits = preg_replace('/\D/', '', $v) ?? '';
      if (strlen($digits) >= 8) $phone = $digits;
    }
    if (str_contains($k, 'financial_status') || str_contains($k, 'payment_status') || $k === 'status' || str_ends_with($k, '.status') || str_contains($k, 'event')) {
      if (preg_match('/(unpaid|not_?paid|pending|failed|refused|declined|cancell?ed|expired|refunded|voided)/i', $lv)) $refused = true;
      elseif (preg_match('/paid|success|completed|captured|successful|sale/i', $lv)) $paid = true;
    }
    if ($amount <= 0 && (str_contains($k, 'total_price') || str_contains($k, 'current_total') || $k === 'amount' || str_ends_with($k, '.amount') || str_contains($k, 'amount_paid'))) {
      $n = (int) round((float) preg_replace('/[^\d.]/', '', $v));
      if ($n > 0) $amount = $n;
    }
  }
  $topic = strtolower((string) ($_SERVER['HTTP_X_SHOPLINE_TOPIC'] ?? $_SERVER['HTTP_X_MAKETOU_TOPIC'] ?? ''));
  if (str_contains($topic, 'paid') || str_contains($topic, 'sale')) $paid = true;
  return ['ref' => $ref, 'email' => $email, 'amount' => $amount, 'paid' => ($paid && !$refused), 'extId' => $extId, 'sellId' => $sellId, 'phone' => $phone];
}

/** Base officielle de vérification Maketou (surchargeable par MAKETOU_VERIFY_URL). */
function maketou_verify_base(): string {
  $url = supabase_env('MAKETOU_VERIFY_URL');
  if ($url === '') $url = 'https://api.maketou.net';
  return rtrim($url, '/');
}

/** Seuls ces statuts valent « payé ». Tout le reste laisse le dépôt en attente. */
function maketou_is_paid_status($status): bool {
  $status = strtolower(trim((string) $status));
  $status = str_replace([' ', '-'], '_', $status);
  return in_array($status, [
    'completed', 'complete', 'paid', 'success', 'successful', 'approved',
    'succeeded', 'settled', 'captured', 'processed', 'confirmed',
    'payment_success', 'payment_successful', 'done'
  ], true);
}

/** Statut du panier Maketou, quel que soit le niveau où il est publié. */
function maketou_extract_status($data): string {
  if (!is_array($data)) return '';
  $nested = is_array($data['data'] ?? null) ? $data['data'] : [];
  $cart = is_array($data['cart'] ?? null) ? $data['cart'] : (is_array($nested['cart'] ?? null) ? $nested['cart'] : []);
  $order = is_array($data['order'] ?? null) ? $data['order'] : (is_array($nested['order'] ?? null) ? $nested['order'] : []);
  $tx = is_array($data['transaction'] ?? null) ? $data['transaction'] : (is_array($nested['transaction'] ?? null) ? $nested['transaction'] : []);
  $candidates = [
    $data['status'] ?? '',
    $data['paymentStatus'] ?? '',
    $data['payment_status'] ?? '',
    $data['financial_status'] ?? '',
    $cart['status'] ?? '',
    $nested['status'] ?? '',
    $order['status'] ?? '',
    $tx['status'] ?? '',
  ];
  foreach ($candidates as $c) {
    if (is_string($c) && trim($c) !== '') return trim($c);
  }
  return '';
}

/** Le panier est-il payé ? Statut d'abord, drapeaux booléens ensuite. */
function maketou_payload_looks_paid($data): bool {
  if (maketou_is_paid_status(maketou_extract_status($data))) return true;
  if (!is_array($data)) return false;
  $nested = is_array($data['data'] ?? null) ? $data['data'] : [];
  $flags = [
    $data['paid'] ?? null, $data['isPaid'] ?? null, $data['is_paid'] ?? null, $data['completed'] ?? null,
    $nested['paid'] ?? null, $nested['isPaid'] ?? null, $nested['is_paid'] ?? null, $nested['completed'] ?? null,
  ];
  foreach ($flags as $flag) {
    if ($flag === true || $flag === 1 || $flag === '1') return true;
    if (is_string($flag) && maketou_is_paid_status($flag)) return true;
  }
  $event = strtolower(trim((string) ($data['event'] ?? ($data['type'] ?? ($nested['event'] ?? '')))));
  if ($event !== '' && preg_match('/paid|success|complet|approved|settled/i', $event)) return true;
  return false;
}

/** Montant réellement payé, cherché à plat dans toute la réponse. */
function maketou_extract_amount($data): int {
  if (!is_array($data)) return 0;
  $bag = [];
  maketou_flatten($data, '', $bag);
  foreach ($bag as $k => $v) {
    if (str_contains($k, 'total_price') || str_contains($k, 'current_total') || $k === 'amount'
      || str_ends_with($k, '.amount') || str_contains($k, 'amount_paid') || str_contains($k, 'totalprice')) {
      $n = (int) round((float) preg_replace('/[^\d.]/', '', (string) $v));
      if ($n > 0) return $n;
    }
  }
  return 0;
}

/** Identifiant utilisable comme référence de panier Maketou. */
function maketou_looks_like_ref($value): bool {
  $value = trim((string) $value);
  if ($value === '' || str_contains($value, '.')) return false;
  return (bool) preg_match('/^[A-Za-z0-9_-]{8,80}$/', $value);
}

function maketou_http_get(string $url, string $key, ?int &$status = null): ?array {
  $status = 0;
  if (!function_exists('curl_init')) {
    maketou_log('maketou_api_call', ['url' => $url, 'status' => 0, 'error' => 'curl indisponible']);
    return null;
  }
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER => [
      // Format accepté par api.maketou.net : jeton Bearer, réponse JSON.
      'Authorization: Bearer ' . $key,
      'Content-Type: application/json',
      'Accept: application/json',
    ],
  ]);
  $raw = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  $note = '';
  if ($status === 401 || $status === 403) $note = 'CLE API REJETEE (' . $status . ') — vérifier MAKETOU_API_KEY sur Hostinger';
  elseif ($status === 404) $note = 'ENDPOINT INEXISTANT (404) — vérifier MAKETOU_API_URL';
  elseif ($status === 0) $note = 'AUCUNE REPONSE (réseau/DNS/timeout)';
  maketou_log('maketou_api_call', [
    'url' => $url,
    'key' => maketou_log_mask($key),
    'status' => $status,
    'curl_error' => $err,
    'note' => $note,
    'body_raw' => is_string($raw) ? substr($raw, 0, 4000) : '',
  ]);
  if ($raw === false || $status < 200 || $status >= 300) return null;
  $json = json_decode((string) $raw, true);
  return is_array($json) ? $json : null;
}

/**
 * Interroge Maketou de serveur à serveur : seule preuve acceptée pour créditer
 * quand le webhook signé n'a pas été reçu. Sans clé API, on ne crédite jamais.
 */
function maketou_verify_remote_payment(array $dep, int $attempts = 1, int $waitSec = 2): array {
  $key = maketou_api_key();
  if ($key === '') {
    error_log('OROLADO: MAKETOU_API_KEY absente — aucun dépôt ne peut être vérifié ni crédité');
    return ['ok' => false, 'paid' => false, 'reason' => 'unverifiable'];
  }
  $ref = (string) ($dep['id'] ?? $dep['ref'] ?? '');
  $sellId = (string) ($dep['sellId'] ?? $dep['cartId'] ?? '');
  $extId = (string) ($dep['extId'] ?? '');
  // Vérifie d'abord le cartId Maketou (seul ID reconnu par l'API officielle).
  $cart = maketou_verify_base() . '/api/v1/stores/cart/';
  $candidates = [];
  $seen = [];
  foreach ([$sellId, $extId] as $id) {
    if (!maketou_looks_like_ref($id) || isset($seen[$id])) continue;
    $seen[$id] = true;
    $candidates[] = $cart . rawurlencode($id);
  }
  if (!$candidates) {
    maketou_log('maketou_verify', ['ref' => $ref, 'result' => 'no_cart_id', 'hint' => 'sellId/cartId manquant']);
    return ['ok' => false, 'paid' => false, 'reason' => 'no_cart_id'];
  }
  $attempts = max(1, min(3, $attempts));
  // Maketou peut mettre quelques secondes à publier le paiement : on retente,
  // mais un montant insuffisant reste un refus immédiat. La butée de temps
  // garantit une réponse HTTP avant que le client n'abandonne.
  $deadline = microtime(true) + 14.0;
  $statuses = [];
  for ($i = 0; $i < $attempts; $i++) {
    if ($i > 0) {
      if (microtime(true) + $waitSec >= $deadline) break;
      sleep(max(1, $waitSec));
    }
    foreach ($candidates as $url) {
      if (microtime(true) >= $deadline) break 2;
      $code = 0;
      $json = maketou_http_get($url, $key, $code);
      $statuses[] = $code;
      if ($json === null) continue;
      $status = maketou_extract_status($json);
      if (maketou_payload_looks_paid($json)) {
        $expectedUsd = orolado_money($dep['amount'] ?? 0);
        $expectedFcfa = (int) ($dep['amountFcfa'] ?? 0);
        if ($expectedFcfa <= 0) $expectedFcfa = orolado_usd_to_fcfa($expectedUsd);
        $gotFcfa = maketou_extract_amount($json);
        if ($expectedFcfa > 0 && $gotFcfa > 0 && $gotFcfa < $expectedFcfa) {
          maketou_log('maketou_verify', ['ref' => $ref, 'result' => 'amount_mismatch', 'expectedUsd' => $expectedUsd, 'expectedFcfa' => $expectedFcfa, 'gotFcfa' => $gotFcfa]);
          return ['ok' => false, 'paid' => false, 'reason' => 'amount_mismatch'];
        }
        maketou_log('maketou_verify', ['ref' => $ref, 'url' => $url, 'status' => $status, 'result' => 'paid', 'amountUsd' => $expectedUsd, 'gotFcfa' => $gotFcfa]);
        return ['ok' => true, 'paid' => true, 'amount' => $expectedUsd];
      }
      maketou_log('maketou_verify_step', ['ref' => $ref, 'url' => $url, 'http' => $code, 'status' => $status]);
    }
  }
  // Aucune réponse exploitable : on nomme la cause au lieu de dire « en attente ».
  $ok2xx = false;
  foreach ($statuses as $s) { if ($s >= 200 && $s < 300) $ok2xx = true; }
  $reason = 'not_paid';
  if (!$ok2xx && $statuses) {
    if (in_array(401, $statuses, true) || in_array(403, $statuses, true)) $reason = 'api_key_rejected';
    elseif (in_array(404, $statuses, true)) $reason = 'endpoint_not_found';
    elseif (max($statuses) === 0) $reason = 'api_unreachable';
    else $reason = 'api_error_' . max($statuses);
  }
  maketou_log('maketou_verify', ['ref' => $ref, 'sellId' => $sellId, 'result' => $reason, 'http' => $statuses]);
  return ['ok' => false, 'paid' => false, 'reason' => $reason];
}

/** L'API Maketou est-elle hors service pour ce dépôt ? */
function maketou_reason_is_blocking(string $reason): bool {
  return in_array($reason, ['unverifiable', 'api_key_rejected', 'endpoint_not_found', 'api_unreachable'], true)
    || str_starts_with($reason, 'api_error_');
}

/** Retrouve le dépôt local visé par un webhook (ref, alias e-mail, sellId ou extId). */
function orolado_find_deposit_by_hit(array $hit): ?array {
  $db = load_db(orolado_data_file());
  foreach (($db['deposits'] ?? []) as $d) {
    $matchRef = ($hit['ref'] ?? '') !== '' && (($d['id'] ?? '') === $hit['ref'] || ($d['ref'] ?? '') === $hit['ref']);
    $matchMail = ($hit['email'] ?? '') !== '' && strtolower((string) ($d['aliasEmail'] ?? '')) === strtolower((string) $hit['email']);
    $matchExt = ($hit['extId'] ?? '') !== '' && (($d['extId'] ?? '') === $hit['extId']);
    $matchSell = ($hit['sellId'] ?? '') !== '' && (($d['sellId'] ?? '') === $hit['sellId']);
    if ($matchRef || $matchMail || $matchExt || $matchSell) return $d;
  }
  return null;
}

function credit_paid_deposit(array $hit): array {
  $file = orolado_data_file();
  $fp = fopen($file, 'c+');
  if (!$fp) return ['ok' => false, 'reason' => 'db'];
  flock($fp, LOCK_EX);
  $raw = stream_get_contents($fp);
  $db = json_decode($raw ?: '', true);
  if (!is_array($db)) $db = blank_db();
  $db = array_merge(blank_db(), $db);
  if (!isset($db['deposits']) || !is_array($db['deposits'])) $db['deposits'] = [];
  if (!isset($db['processedTx']) || !is_array($db['processedTx'])) $db['processedTx'] = [];

  $extId = (string) ($hit['extId'] ?? '');
  $refHit = (string) ($hit['ref'] ?? '');
  if ($extId !== '' && orolado_txid_already_used($db, $extId)) {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => true, 'duplicate' => true];
  }
  if ($refHit !== '' && orolado_txid_already_used($db, $refHit)) {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => true, 'duplicate' => true];
  }

  $idx = -1;
  foreach ($db['deposits'] as $i => $d) {
    $matchRef = ($hit['ref'] ?? '') !== '' && (($d['id'] ?? '') === $hit['ref'] || ($d['ref'] ?? '') === $hit['ref']);
    $matchMail = ($hit['email'] ?? '') !== '' && strtolower((string) ($d['aliasEmail'] ?? '')) === strtolower((string) $hit['email']);
    $matchExt = ($hit['extId'] ?? '') !== '' && (($d['extId'] ?? '') === $hit['extId']);
    $matchSell = ($hit['sellId'] ?? '') !== '' && (($d['sellId'] ?? '') === $hit['sellId']);
    if ($matchRef || $matchMail || $matchExt || $matchSell) { $idx = $i; break; }
  }
  if ($idx < 0) {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => false, 'reason' => 'unknown'];
  }
  $dep = $db['deposits'][$idx];
  $st = strtoupper((string) ($dep['status'] ?? ''));
  if ($st === 'PAID' || $st === 'COMPLETED') {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => true, 'duplicate' => true, 'amount' => orolado_money($dep['amount'] ?? 0), 'userId' => (string) ($dep['userId'] ?? '')];
  }

  // Crédit toujours le montant USD du dépôt pending (pas le FCFA Maketou).
  $pendingAmt = orolado_money($dep['amount'] ?? 0);
  $amount = orolado_money($hit['amount'] ?? 0);
  if ($amount <= 0 && $pendingAmt >= orolado_min_deposit(null)) $amount = $pendingAmt;
  if ($amount < orolado_min_deposit(null) || $amount > orolado_max_deposit_usd()) {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => false, 'reason' => 'amount'];
  }
  // USDT : créditer le montant réellement reçu (peut dépasser le pending, ex. 3.50 vs 3.00).
  $creditReceived = !empty($hit['creditReceived'])
    || strtolower((string) ($dep['operator'] ?? '')) === 'usdt';
  if ($pendingAmt > 0 && !$creditReceived) $amount = min($amount, $pendingAmt);
  $uid = (string) ($dep['userId'] ?? '');
  if ($uid === '') {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => false, 'reason' => 'user'];
  }
  if (!isset($db['users'][$uid])) {
    $db['users'][$uid] = [
      'id' => $uid,
      'displayName' => 'Trader',
      'email' => '',
      'phone' => '',
      'role' => 'user',
      'createdAt' => date('c'),
      'transactions' => [],
    ];
  }
  if (!isset($db['vault'][$uid])) $db['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
  $db['vault'][$uid]['real'] = orolado_money(($db['vault'][$uid]['real'] ?? 0) + $amount);
  $db['users'][$uid]['realDepositTotal'] = orolado_money(($db['users'][$uid]['realDepositTotal'] ?? 0) + $amount);
  $db['users'][$uid]['requiredWagering'] = orolado_money(($db['users'][$uid]['realDepositTotal'] ?? 0) * 2);
  if (!isset($db['users'][$uid]['totalWageredSinceDeposit'])) {
    $db['users'][$uid]['totalWageredSinceDeposit'] = orolado_money($db['users'][$uid]['realStakeVolume'] ?? 0);
  }
  $db['deposits'][$idx]['status'] = 'COMPLETED';
  $db['deposits'][$idx]['amount'] = $amount;
  $db['deposits'][$idx]['paidAt'] = date('c');
  if ($extId !== '') {
    $db['deposits'][$idx]['extId'] = $extId;
    $db['processedTx'][] = $extId;
    $db['processedTx'] = array_values(array_unique(array_slice($db['processedTx'], -400)));
  }
  $refId = (string) ($dep['id'] ?? $hit['ref'] ?? '');
  if ($refId !== '') {
    $db['processedTx'][] = $refId;
    $db['processedTx'] = array_values(array_unique(array_slice($db['processedTx'], -400)));
  }
  $tx = [
    'id' => uniqid('dep_', true),
    'at' => date('c'),
    'clock' => date('H:i:s'),
    'type' => 'deposit',
    'amount' => $amount,
    'note' => 'Recharge Maketou',
    'mode' => 'real'
  ];
  if (!isset($db['users'][$uid]['transactions']) || !is_array($db['users'][$uid]['transactions'])) {
    $db['users'][$uid]['transactions'] = [];
  }
  array_unshift($db['users'][$uid]['transactions'], $tx);
  $db['users'][$uid]['transactions'] = array_slice($db['users'][$uid]['transactions'], 0, 80);

  rewind($fp);
  ftruncate($fp, 0);
  fwrite($fp, json_encode($db, JSON_UNESCAPED_UNICODE));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  supabase_complete_deposit((string) ($dep['id'] ?? $refHit), $amount, (string) $uid);
  return ['ok' => true, 'amount' => $amount, 'userId' => $uid];
}

function maketou_api_url(): string {
  $url = getenv('MAKETOU_API_URL');
  if ($url === false || $url === '') $url = $_ENV['MAKETOU_API_URL'] ?? '';
  $url = trim((string) $url);
  // Endpoint officiel de création de panier (comme Crash Predictor).
  if ($url === '') $url = 'https://api.maketou.net/api/v1/stores/cart/checkout';
  return $url;
}

function maketou_find_url($node): string {
  if (is_string($node) && preg_match('#^https?://#i', $node)) {
    $low = strtolower($node);
    if (str_contains($low, 'pay') || str_contains($low, 'checkout') || str_contains($low, 'wave')
      || str_contains($low, 'orange') || str_contains($low, 'mtn') || str_contains($low, 'moov')
      || str_contains($low, 'maketou') || str_contains($low, 'gateway')) {
      return $node;
    }
  }
  if (!is_array($node)) return '';
  foreach (['url', 'checkout_url', 'checkoutUrl', 'payment_url', 'paymentUrl', 'redirect_url', 'redirectUrl', 'gateway_url', 'gatewayUrl', 'link', 'session_url'] as $k) {
    if (!empty($node[$k]) && is_string($node[$k]) && preg_match('#^https?://#i', $node[$k])) return $node[$k];
  }
  foreach ($node as $v) {
    $found = maketou_find_url($v);
    if ($found !== '') return $found;
  }
  return '';
}

function maketou_collect_urls($node, array &$urls): void {
  if (is_string($node) && preg_match('#^https?://#i', $node)) {
    $urls[] = $node;
    return;
  }
  if (!is_array($node)) return;
  foreach ($node as $v) maketou_collect_urls($v, $urls);
}

function maketou_pick_checkout_url($node, string $fallback): string {
  $urls = [];
  maketou_collect_urls($node, $urls);
  foreach ($urls as $u) {
    $low = strtolower($u);
    if (str_contains($low, 'paystral.com') || str_contains($low, 'moneroo.io') || str_contains($low, 'checkout.moneroo')) return $u;
  }
  foreach ($urls as $u) {
    $low = strtolower($u);
    if (str_contains($low, '/checkout/custom') || str_contains($low, '/checkout/buy') || str_contains($low, 'app.paystral')) return $u;
  }
  foreach ($urls as $u) {
    $low = strtolower($u);
    // Accepter /pay… (Moneroo/Paystral) hors page produit WELCOME.
    if ((str_contains($low, '/checkout') || preg_match('#/(py_|pay)[a-z0-9]#', $low))
      && !str_contains($low, '/products/welcome')) {
      return $u;
    }
  }
  return $fallback;
}

/** Devise shop (legacy). Checkout Orolado envoie toujours du XOF/FCFA. */
function maketou_shop_currency(): string {
  return 'XOF';
}

/** Message d’erreur lisible depuis la réponse API Maketou. */
function maketou_api_error_text(?array $json, string $raw, int $status): string {
  if (is_array($json)) {
    $code = (string) ($json['code'] ?? $json['errorCode'] ?? $json['error_code'] ?? '');
    $msg = (string) ($json['message'] ?? $json['error'] ?? $json['error_description'] ?? '');
    if (is_array($json['error'] ?? null)) {
      $msg = (string) ($json['error']['message'] ?? $json['error']['msg'] ?? $msg);
      if ($code === '') $code = (string) ($json['error']['code'] ?? '');
    }
    if ($msg === '' && isset($json['errors'])) {
      $errs = $json['errors'];
      if (is_array($errs)) {
        $parts = [];
        foreach ($errs as $e) {
          if (is_string($e)) $parts[] = $e;
          elseif (is_array($e)) $parts[] = (string) ($e['message'] ?? $e['msg'] ?? json_encode($e, JSON_UNESCAPED_UNICODE));
        }
        $msg = implode(' · ', array_filter($parts));
      } elseif (is_string($errs)) {
        $msg = $errs;
      }
    }
    $map = [
      'INVALID_API_KEY' => 'Clé API Maketou invalide',
      'INVALID_PRODUCT' => 'Produit Maketou invalide ou indisponible',
      'VALIDATION_ERROR' => 'Payload Maketou rejeté (validation)',
      'RATE_LIMITED' => 'Limite API Maketou dépassée, réessayez',
    ];
    if ($code !== '' && isset($map[$code])) {
      return $map[$code] . ($msg !== '' && stripos($msg, $map[$code]) === false ? ' — ' . $msg : '');
    }
    if ($msg !== '') return ($code !== '' ? $code . ' — ' : '') . $msg;
    if ($code !== '') return $code;
  }
  $trim = trim($raw);
  if ($trim !== '' && strlen($trim) < 400 && !str_starts_with($trim, '<')) return $trim;
  if ($status === 401 || $status === 403) return 'Clé API Maketou refusée (HTTP ' . $status . ')';
  if ($status === 404) return 'Endpoint Maketou introuvable (HTTP 404)';
  if ($status === 422) return 'Validation Maketou échouée (HTTP 422)';
  if ($status === 429) return 'Trop de requêtes Maketou (HTTP 429)';
  if ($status > 0) return 'Erreur Maketou HTTP ' . $status;
  return 'Pas de redirectUrl Maketou';
}

function maketou_http_json(string $url, string $key, array $body): array {
  $payload = json_encode($body, JSON_UNESCAPED_UNICODE);
  if ($payload === false) return ['ok' => false, 'status' => 0, 'json' => null, 'raw' => ''];
  $headers = [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer ' . $key,
  ];
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 25,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_POSTFIELDS => $payload,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if (!is_string($raw)) $raw = '';
    $json = json_decode($raw, true);
    maketou_log('maketou_api_call', [
      'method' => 'POST',
      'url' => $url,
      'key' => maketou_log_mask($key),
      'status' => $status,
      'curl_error' => $err,
      'body_raw' => substr($raw, 0, 4000),
    ]);
    return ['ok' => $status >= 200 && $status < 300, 'status' => $status, 'json' => is_array($json) ? $json : null, 'raw' => $raw];
  }
  $ctx = stream_context_create([
    'http' => [
      'method' => 'POST',
      'header' => implode("\r\n", $headers) . "\r\n",
      'content' => $payload,
      'timeout' => 25,
      'ignore_errors' => true,
    ]
  ]);
  $raw = @file_get_contents($url, false, $ctx);
  if (!is_string($raw)) $raw = '';
  $json = json_decode($raw, true);
  return ['ok' => true, 'status' => 0, 'json' => is_array($json) ? $json : null, 'raw' => $raw];
}

function maketou_curl(string $url, string $method = 'GET', ?string $body = null, array $headers = [], int $timeout = 12): array {
  if (!function_exists('curl_init')) return ['ok' => false, 'status' => 0, 'raw' => ''];
  $ch = curl_init($url);
  $hdrs = array_merge([
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language: fr-FR,fr;q=0.9,en;q=0.8',
  ], $headers);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => $timeout,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER => $hdrs,
  ];
  if (strtoupper($method) === 'POST') {
    $opts[CURLOPT_POST] = true;
    $opts[CURLOPT_POSTFIELDS] = $body ?? '';
  }
  curl_setopt_array($ch, $opts);
  $raw = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if (!is_string($raw)) $raw = '';
  return ['ok' => $status >= 200 && $status < 300, 'status' => $status, 'raw' => $raw];
}

function maketou_create_action_id(): string {
  $fallback = '7fc8cd87a6cfada5accfc159783a8cc2256070190f';
  $cache = sys_get_temp_dir() . '/orolado_maketou_action_id.txt';
  if (is_file($cache) && (time() - filemtime($cache)) < 3600) {
    $id = trim((string) @file_get_contents($cache));
    if (preg_match('/^[a-f0-9]{40,64}$/', $id)) return $id;
  }
  $html = maketou_curl(maketou_checkout_base(), 'GET', null, ['Accept: text/html'], 8);
  $jsUrl = '';
  if (preg_match('#(/_next/static/chunks/app/[^"\'>\s]+checkout/page-[a-f0-9]+\.js(?:\?[^"\'>\s]*)?)#', $html['raw'], $m)) {
    $jsUrl = 'https://welcome-6.mymaketou.shop' . html_entity_decode($m[1], ENT_QUOTES);
  }
  $id = $fallback;
  if ($jsUrl !== '') {
    $js = maketou_curl($jsUrl, 'GET', null, ['Accept: */*'], 8);
    if (preg_match('/createServerReference\("([a-f0-9]{40,64})"[^)]*createCheckoutSession/', $js['raw'], $m2)) {
      $id = $m2[1];
    }
  }
  @file_put_contents($cache, $id);
  return $id;
}

function maketou_finalize_pay_url(string $url, string $phone, string $returnUrl = ''): string {
  $parts = parse_url($url);
  if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) return $url;
  $q = [];
  if (!empty($parts['query'])) parse_str((string) $parts['query'], $q);
  $q['country'] = 'CI';
  $digits = preg_replace('/\D/', '', $phone) ?? '';
  if (str_starts_with($digits, '225') && strlen($digits) > 3) $digits = substr($digits, 3);
  if ($digits !== '') $q['phone'] = $digits;
  if ($returnUrl !== '') {
    $dashUrl = orolado_public_origin() . '/?deposit=success';
    if (preg_match('/ref=([^&]+)/', $returnUrl, $m)) {
      $dashUrl .= '&ref=' . $m[1];
    }
    $q['return_url'] = $returnUrl;
    $q['redirect_url'] = $dashUrl;
    $q['success_url'] = $dashUrl;
    $q['callback_url'] = $returnUrl;
    $q['cancel_url'] = orolado_public_origin() . '/?payment=cancel';
  }
  $port = isset($parts['port']) ? ':' . $parts['port'] : '';
  $path = (string) ($parts['path'] ?? '');
  return $parts['scheme'] . '://' . $parts['host'] . $port . $path . '?' . http_build_query($q);
}

function maketou_pick_redirect_url(string $raw): string {
  if ($raw === '') return '';
  if (preg_match('/"redirectUrl"\s*:\s*"((?:\\\\.|[^"\\\\])*)"/', $raw, $m)) {
    $decoded = json_decode('"' . $m[1] . '"');
    if (is_string($decoded) && preg_match('#^https?://#i', $decoded)) return $decoded;
  }
  if (preg_match('#https?://[^\s"\\\\]+#', $raw, $m)) {
    $u = stripcslashes($m[0]);
    $low = strtolower($u);
    if (str_contains($low, 'paystral') || str_contains($low, '/pay') || str_contains($low, 'checkout/custom')) return $u;
  }
  return '';
}

function maketou_storefront_session(array $info): array {
  $productId = maketou_catalog_product_id();
  $returnUrl = (string) ($info['returnUrl'] ?? '');
  $payload = [
    'productId' => $productId,
    'storeId' => maketou_store_id(),
    'forceNew' => true,
    'customerInfo' => [
      'email' => (string) $info['email'],
      'firstName' => (string) $info['firstName'],
      'lastName' => (string) $info['lastName'],
      'phone' => (string) $info['phone'],
      'countryCode' => 'CI',
      'customerPrices' => [$productId => (int) ($info['amount'] ?? 0)],
    ],
  ];
  $body = json_encode([$payload], JSON_UNESCAPED_UNICODE);
  if ($body === false) return ['url' => '', 'sellId' => ''];
  $action = maketou_create_action_id();
  $res = maketou_curl(maketou_checkout_base(), 'POST', $body, [
    'Content-Type: text/plain;charset=UTF-8',
    'Accept: text/x-component',
    'Next-Action: ' . $action,
    'Origin: https://welcome-6.mymaketou.shop',
    'Referer: ' . maketou_checkout_base(),
  ], 15);
  $url = maketou_pick_redirect_url($res['raw']);
  $sellId = '';
  if (preg_match('/"sellId"\s*:\s*"([^"]+)"/', $res['raw'], $m)) $sellId = $m[1];
  maketou_log('maketou_session_call', [
    'url' => maketou_checkout_base(),
    'status' => (int) $res['status'],
    'sellId' => $sellId,
    'redirect' => $url,
    'body_raw' => substr((string) $res['raw'], 0, 3000),
  ]);
  if ($url === '') {
    error_log('OROLADO maketou session status=' . (string) $res['status'] . ' body=' . substr($res['raw'], 0, 600));
    return ['url' => '', 'sellId' => $sellId];
  }
  return ['url' => maketou_finalize_pay_url($url, (string) $info['phone'], $returnUrl), 'sellId' => $sellId];
}

/**
 * Checkout Maketou (flux pré-$ / 8ec3369) :
 * customerPrice = montant FCFA entier → redirectUrl Moneroo.
 * Infos compte Orolado dans le payload. Jamais /products/welcome.
 */
function maketou_create_checkout(array $opts): array {
  $key = maketou_api_key();
  if ($key === '') {
    error_log('OROLADO: MAKETOU_API_KEY absente');
    return ['ok' => false, 'reason' => 'MAKETOU_API_KEY manquante'];
  }

  $email = trim((string) ($opts['email'] ?? $opts['aliasEmail'] ?? ''));
  if ($email === '') $email = maketou_alias_email((string) ($opts['userId'] ?? ''));
  $cc = preg_replace('/\D/', '', (string) ($opts['countryCode'] ?? '225')) ?: '225';
  $phoneRaw = trim((string) ($opts['phone'] ?? ''));
  if ($phoneRaw === '') $phoneRaw = maketou_alias_phone();
  $phoneDigits = preg_replace('/\D/', '', $phoneRaw) ?? '';
  if (str_starts_with($phoneDigits, $cc) && strlen($phoneDigits) > strlen($cc)) {
    $phoneDigits = substr($phoneDigits, strlen($cc));
  }
  $phone = $phoneDigits !== '' ? ('+' . $cc . $phoneDigits) : $phoneRaw;

  $first = trim((string) ($opts['firstName'] ?? ''));
  $last = trim((string) ($opts['lastName'] ?? ''));
  if ($first === '' || $last === '') {
    [$f2, $l2] = maketou_split_name((string) ($opts['displayName'] ?? 'Trader Orolado'));
    if ($first === '') $first = $f2;
    if ($last === '') $last = $l2;
  }

  // Montant Maketou = FCFA entier (comme avant le passage $).
  $amountFcfa = (int) ($opts['amount'] ?? 0);
  $amountFcfa = max(1, $amountFcfa);
  $ref = (string) ($opts['ref'] ?? '');
  $userId = (string) ($opts['userId'] ?? '');
  $returnUrl = (string) ($opts['returnUrl'] ?? '');
  if ($returnUrl === '') {
    $returnUrl = orolado_public_origin() . '/?deposit=success&ref=' . rawurlencode($ref);
  }

  $payload = [
    'productDocumentId' => maketou_product_id(),
    'email' => $email,
    'firstName' => $first,
    'lastName' => $last,
    'phone' => $phone,
    'customerPrice' => $amountFcfa,
    'redirectURL' => $returnUrl,
    'meta' => [
      'userId' => $userId,
      'amount' => $amountFcfa,
      'amountFcfa' => $amountFcfa,
      'currency' => 'XOF',
      'reference' => $ref,
      'source' => 'orolado',
    ],
  ];

  $apiUrl = maketou_api_url();
  $res = maketou_http_json($apiUrl, $key, $payload);
  $raw = (string) ($res['raw'] ?? '');
  $status = (int) ($res['status'] ?? 0);
  $data = is_array($res['json'] ?? null) ? $res['json'] : [];
  $nested = is_array($data['data'] ?? null) ? $data['data'] : [];
  $cart = is_array($data['cart'] ?? null) ? $data['cart'] : (is_array($nested['cart'] ?? null) ? $nested['cart'] : []);

  maketou_log('maketou_checkout_raw', [
    'ref' => $ref,
    'apiUrl' => $apiUrl,
    'http' => $status,
    'ok' => !empty($res['ok']),
    'payload' => [
      'productDocumentId' => $payload['productDocumentId'],
      'email' => $email,
      'firstName' => $first,
      'lastName' => $last,
      'phone' => $phone,
      'customerPrice' => $amountFcfa,
      'currency' => 'XOF',
      'redirectURL' => $returnUrl,
    ],
    'response_raw' => substr($raw, 0, 12000),
    'response_json' => $data !== [] ? $data : null,
  ]);

  $url = (string) (
    $data['redirectUrl']
    ?? $data['redirect_url']
    ?? $data['checkoutUrl']
    ?? $data['checkout_url']
    ?? $nested['redirectUrl']
    ?? $nested['redirect_url']
    ?? ''
  );
  if ($url === '' && $data !== []) $url = maketou_pick_checkout_url($data, '');
  if ($url !== '' && str_contains(strtolower($url), '/products/welcome')) {
    $url = '';
  }

  $cartId = (string) ($cart['id'] ?? $data['id'] ?? $nested['id'] ?? $data['cartId'] ?? '');

  maketou_log('maketou_checkout_create', [
    'ref' => $ref,
    'userId' => $userId,
    'amount' => $amountFcfa,
    'currency' => 'XOF',
    'http' => $status,
    'cartId' => $cartId,
    'url' => $url,
  ]);

  if (empty($res['ok']) || $url === '') {
    $apiReason = maketou_api_error_text(is_array($res['json'] ?? null) ? $res['json'] : null, $raw, $status);
    $reason = $apiReason;
    if ($raw !== '') {
      $snip = strlen($raw) > 500 ? substr($raw, 0, 500) . '…' : $raw;
      if ($reason === '' || $reason === 'Pas de redirectUrl Maketou') {
        $reason = $snip;
      } else {
        $reason .= ' | ' . $snip;
      }
    }
    return [
      'ok' => false,
      'reason' => $reason !== '' ? $reason : 'checkout_failed',
      'status' => $status,
      'amountFcfa' => $amountFcfa,
      'payload' => ['customerPrice' => $amountFcfa, 'currency' => 'XOF'],
      'missing' => 'redirectUrl',
      'raw' => substr($raw, 0, 1200),
    ];
  }

  return [
    'ok' => true,
    'url' => $url,
    'checkout_url' => $url,
    'sellId' => $cartId,
    'cartId' => $cartId,
    'amountFcfa' => $amountFcfa,
    'payload' => ['customerPrice' => $amountFcfa, 'currency' => 'XOF'],
  ];
}

function orolado_payload_has_real_email(string $haystack, array $user): bool {
  $email = strtolower((string) ($user['email'] ?? ''));
  if ($email === '') return false;
  return str_contains(strtolower($haystack), $email) || str_contains(strtolower($haystack), rawurlencode($email));
}

/** Minimum dépôt affiché = $3.00 → XOF via taux (ex. 1 800 FCFA). */
function orolado_min_deposit_fcfa(?array $me): int {
  return orolado_usd_to_fcfa(orolado_min_deposit($me));
}

/** Seuil dépôt UI / vault (USD). */
function orolado_min_deposit(?array $me): float {
  return 3.0;
}

function orolado_initiate_deposit(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $token = (string) ($req['token'] ?? '');
  $me = orolado_session_user($db, $token);
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide'];

  // UI en USD → conversion fixe → XOF entier pour Maketou (même checkout).
  // Compat explicite : currency=XOF ou amountFcfa → montant déjà en FCFA.
  $unit = strtoupper(trim((string) ($req['currency'] ?? $req['unit'] ?? 'USD')));
  if (isset($req['amountFcfa']) || $unit === 'XOF' || $unit === 'FCFA') {
    $amountFcfa = (int) round((float) ($req['amountFcfa'] ?? $req['amount'] ?? 0));
    $amountUsd = orolado_fcfa_to_usd($amountFcfa);
  } else {
    $amountUsd = orolado_money($req['amount'] ?? 0);
    $amountFcfa = orolado_usd_to_fcfa($amountUsd);
  }
  $minUsd = orolado_min_deposit($me);
  $minFcfa = orolado_min_deposit_fcfa($me);
  if ($amountUsd + 0.0001 < $minUsd && $amountFcfa < $minFcfa) {
    return ['ok' => false, 'server' => true, 'reason' => 'Le dépôt minimum est de $3.00.'];
  }
  if ($amountFcfa < 1 || $amountFcfa > 5000000) {
    return ['ok' => false, 'server' => true, 'reason' => 'Montant invalide'];
  }
  $ops = ['wave', 'orange', 'mtn', 'moov'];
  $op = strtolower((string) ($req['operator'] ?? 'wave'));
  if (!in_array($op, $ops, true)) $op = 'wave';
  $customer = maketou_customer_from_user($me);
  $ref = 'oro_' . bin2hex(random_bytes(12));
  $origin = orolado_public_origin();
  $returnUrl = $origin . '/?deposit=success&ref=' . rawurlencode($ref);
  $webhookUrl = $origin . '/api/deposit/webhook';

  if (!isset($db['deposits']) || !is_array($db['deposits'])) $db['deposits'] = [];
  $db['deposits'][] = [
    'id' => $ref,
    'ref' => $ref,
    'userId' => $me['id'],
    'aliasEmail' => $customer['email'],
    'customerEmail' => $customer['email'],
    'aliasPhone' => $customer['phoneE164'],
    'customerPhone' => $customer['phone'],
    'customerName' => $customer['displayName'],
    'operator' => $op,
    'status' => 'PENDING',
    'amount' => $amountUsd,
    'amountFcfa' => $amountFcfa,
    'currency' => 'USD',
    'at' => date('c')
  ];
  save_db($file, $db);
  supabase_insert_deposit([
    'id' => $ref,
    'user_id' => $me['id'],
    'amount' => $amountUsd,
    'status' => 'PENDING',
    'reference' => $ref,
    'alias_email' => $customer['email'],
    'alias_phone' => $customer['phoneE164'],
    'operator' => $op,
  ]);

  // Même fonction checkout : customerPrice = XOF entier, user prérempli.
  $pay = maketou_create_checkout([
    'email' => $customer['email'],
    'phone' => $customer['phone'],
    'countryCode' => $customer['countryCode'],
    'firstName' => $customer['firstName'],
    'lastName' => $customer['lastName'],
    'displayName' => $customer['displayName'],
    'userId' => (string) $me['id'],
    'amount' => $amountFcfa,
    'operator' => $op,
    'ref' => $ref,
    'returnUrl' => $returnUrl,
    'webhookUrl' => $webhookUrl,
  ]);
  if (empty($pay['ok'])) {
    return [
      'ok' => false,
      'server' => true,
      'reason' => (string) ($pay['reason'] ?? 'Échec création panier Maketou'),
      'ref' => $ref,
      'amount' => $amountUsd,
      'amountFcfa' => $amountFcfa,
      'payload' => $pay['payload'] ?? ['customerPrice' => $amountFcfa, 'currency' => 'XOF'],
      'missing' => $pay['missing'] ?? 'redirectUrl',
      'status' => $pay['status'] ?? 0,
      'raw' => $pay['raw'] ?? '',
    ];
  }
  $url = (string) ($pay['url'] ?? $pay['checkout_url'] ?? '');
  $low = strtolower($url);
  if ($url === '' || str_contains($low, '/products/welcome')) {
    return [
      'ok' => false,
      'server' => true,
      'reason' => (string) ($pay['raw'] ?? 'Pas de redirectUrl Moneroo'),
      'ref' => $ref,
      'amount' => $amountUsd,
      'amountFcfa' => $amountFcfa,
      'payload' => ['customerPrice' => $amountFcfa, 'currency' => 'XOF'],
      'missing' => 'redirectUrl',
    ];
  }
  $cartId = (string) ($pay['cartId'] ?? $pay['sellId'] ?? '');
  if ($cartId !== '') {
    $db = load_db($file);
    foreach ($db['deposits'] as $i => $d) {
      if (($d['id'] ?? '') === $ref) {
        $db['deposits'][$i]['sellId'] = $cartId;
        $db['deposits'][$i]['cartId'] = $cartId;
        break;
      }
    }
    save_db($file, $db);
    supabase_patch_deposit($ref, ['sell_id' => $cartId]);
  }
  return [
    'ok' => true,
    'server' => true,
    'ref' => $ref,
    'cartId' => $cartId,
    'url' => $url,
    'checkout_url' => $url,
    'amount' => $amountUsd,
    'amountFcfa' => $amountFcfa,
    'payload' => ['customerPrice' => $amountFcfa, 'currency' => 'XOF'],
    'customer' => [
      'email' => $customer['email'],
      'phone' => $customer['phone'],
      'firstName' => $customer['firstName'],
      'lastName' => $customer['lastName'],
      'displayName' => $customer['displayName'],
    ],
  ];
}

function orolado_deposit_status(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $me = orolado_session_user($db, (string) ($req['token'] ?? ''));
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide'];
  $ref = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($req['ref'] ?? '')) ?? '';
  $paid = null;
  foreach ($db['deposits'] as $d) {
    if (($d['userId'] ?? '') !== $me['id']) continue;
    if ($ref !== '' && ($d['id'] ?? '') !== $ref && ($d['ref'] ?? '') !== $ref) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st === 'PAID' || $st === 'COMPLETED') {
      $paid = $d;
      if ($ref !== '') break;
    }
  }
  if (!$paid && $ref !== '') {
    $sbDep = supabase_get_deposit($ref);
    if ($sbDep && (string) ($sbDep['user_id'] ?? '') === (string) $me['id']) {
      $st = strtoupper((string) ($sbDep['status'] ?? ''));
      if ($st === 'PAID' || $st === 'COMPLETED') {
        $paid = ['amount' => (int) ($sbDep['amount'] ?? 0)];
      }
    }
  }
  $jsonVault = $db['vault'][$me['id']] ?? ['demo' => 0, 'real' => 0];
  $vault = supabase_admin_vault((string) $me['id']);
  if (!$vault) $vault = $jsonVault;
  else {
    $vault['real'] = max((int) $vault['real'], (int) ($jsonVault['real'] ?? 0));
    $vault['demo'] = max((int) $vault['demo'], (int) ($jsonVault['demo'] ?? 0));
  }
  return [
    'ok' => true,
    'server' => true,
    'paid' => $paid !== null,
    'amount' => $paid ? (int) ($paid['amount'] ?? 0) : 0,
    'vault' => $vault
  ];
}

function orolado_find_owned_deposit(array $db, string $userId, string $ref): ?array {
  $pending = null;
  foreach ($db['deposits'] as $d) {
    if ((string) ($d['userId'] ?? '') !== $userId) continue;
    $id = (string) ($d['id'] ?? '');
    $r = (string) ($d['ref'] ?? '');
    if ($ref !== '' && $id !== $ref && $r !== $ref) continue;
    if ($ref !== '' && ($id === $ref || $r === $ref)) return $d;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st === 'PENDING') $pending = $d;
  }
  return $ref === '' ? $pending : null;
}

/**
 * Validation directe au retour de paiement, sans appel à l'API Maketou.
 * Mettre MAKETOU_DIRECT_RETURN=0 dans .env pour réactiver la vérification
 * serveur à serveur dès que Maketou notifiera correctement les références.
 */
function maketou_direct_return_enabled(): bool {
  return supabase_env('MAKETOU_DIRECT_RETURN') !== '0';
}

/**
 * Le joueur revient-il réellement du paiement ? Retour d'URL Maketou, message
 * de pay-blank.html ou clic explicite sur « J'ai validé mon paiement ».
 * Une simple relecture de statut en arrière-plan ne crédite rien.
 */
function maketou_return_is_present(array $req): bool {
  if (!empty($req['manual'])) return true;
  if (trim((string) ($req['returnStatus'] ?? '')) !== '') return true;
  $params = $req['returnParams'] ?? null;
  return is_array($params) && $params !== [];
}

/**
 * La redirection annonce-t-elle un succès ? On lit le statut renvoyé par
 * l'opérateur, jamais un simple retour de page.
 */
function maketou_return_is_success(array $req): bool {
  if (supabase_env('MAKETOU_TRUST_RETURN') === '0') return false;
  $vals = [];
  $vals[] = strtolower(trim((string) ($req['returnStatus'] ?? '')));
  $params = $req['returnParams'] ?? null;
  if (is_array($params)) {
    foreach ($params as $k => $v) {
      if (!is_scalar($v)) continue;
      $k = strtolower((string) $k);
      if (str_contains($k, 'status') || str_contains($k, 'state') || $k === 'payment' || $k === 'deposit' || $k === 'result') {
        $vals[] = strtolower(trim((string) $v));
      }
    }
  }
  foreach ($vals as $v) {
    if ($v === '') continue;
    if (preg_match('/(cancel|abort|refus|declin|fail|error)/', $v)) return false;
    if (preg_match('/^(1|ok|paid|success|successful|completed|complete|approved|captured)$/', $v)) return true;
  }
  return false;
}

/** Un dépôt créé il y a moins de 2 h et toujours PENDING. */
function orolado_deposit_is_fresh(array $dep, int $maxAgeSec = 7200): bool {
  $st = strtoupper((string) ($dep['status'] ?? ''));
  if ($st !== 'PENDING' && $st !== '') return false;
  $at = (string) ($dep['createdAt'] ?? $dep['at'] ?? '');
  if ($at === '') return true;
  $ts = strtotime($at);
  if ($ts === false) return true;
  return (time() - $ts) <= $maxAgeSec;
}

function orolado_confirm_deposit(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $me = orolado_session_user($db, (string) ($req['token'] ?? ''));
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide'];
  $uid = (string) $me['id'];
  $ref = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($req['ref'] ?? '')) ?? '';

  $dep = orolado_find_owned_deposit($db, $uid, $ref);
  if (!$dep && $ref !== '') {
    $sb = supabase_get_deposit($ref);
    if ($sb && (string) ($sb['user_id'] ?? '') === $uid) {
      $dep = [
        'id' => (string) ($sb['id'] ?? $ref),
        'amount' => (int) ($sb['amount'] ?? 0),
        'status' => (string) ($sb['status'] ?? 'PENDING'),
        'userId' => $uid,
        'sellId' => (string) ($sb['sell_id'] ?? ''),
        'cartId' => (string) ($sb['sell_id'] ?? ''),
      ];
    }
  }
  if (!$dep) {
    $out = orolado_deposit_status($req);
    $out['paid'] = !empty($out['paid']);
    $out['success'] = !empty($out['paid']);
    $out['new_balance'] = (int) ($out['vault']['real'] ?? 0);
    return $out;
  }

  // Harmonise cartId / sellId pour la vérification Maketou.
  if (empty($dep['sellId']) && !empty($dep['cartId'])) $dep['sellId'] = $dep['cartId'];

  $refId = (string) ($dep['id'] ?? $ref);
  $st = strtoupper((string) ($dep['status'] ?? ''));
  $cred = ['ok' => ($st === 'PAID' || $st === 'COMPLETED')];

  // Règle stricte : on ne crédite QUE si l'API Maketou confirme "completed"/"paid".
  // Aucun crédit sur simple retour de page, clic ou redirection.
  if ($st !== 'PAID' && $st !== 'COMPLETED') {
    $proof = maketou_verify_remote_payment($dep, 3, 2);
    if (!empty($proof['paid'])) {
      $cred = credit_paid_deposit([
        'ref' => $refId,
        'amount' => orolado_money($proof['amount'] ?? ($dep['amount'] ?? 0)),
        'paid' => true,
        'extId' => (string) ($dep['extId'] ?? ''),
        'sellId' => (string) ($dep['sellId'] ?? $dep['cartId'] ?? ''),
      ]);
      if (empty($cred['ok'])) {
        $rpc = supabase_complete_deposit($refId, orolado_money($proof['amount'] ?? ($dep['amount'] ?? 0)), $uid);
        if (is_array($rpc) && !empty($rpc['ok'])) $cred = $rpc;
      }
    } else {
      $cred = ['ok' => false, 'reason' => (string) ($proof['reason'] ?? 'not_paid')];
    }
  }

  $out = orolado_deposit_status(['token' => $req['token'] ?? '', 'ref' => $refId]);
  if (empty($out['paid']) && !empty($cred['ok'])) {
    $out['paid'] = true;
    $out['amount'] = (int) ($cred['amount'] ?? ($dep['amount'] ?? 0));
    $vault = supabase_admin_vault($uid);
    if ($vault) $out['vault'] = $vault;
  }
  if (empty($out['paid'])) {
    $out['status'] = 'PENDING';
    $out['pending'] = true;
    $out['reason'] = (string) ($cred['reason'] ?? 'not_paid');
  } else {
    $out['status'] = 'COMPLETED';
  }
  $out['ref'] = $refId;
  $out['success'] = !empty($out['paid']);
  $out['new_balance'] = (int) ($out['vault']['real'] ?? 0);
  maketou_log('deposit_confirm_result', [
    'ref' => $refId,
    'cartId' => (string) ($dep['sellId'] ?? $dep['cartId'] ?? ''),
    'userId' => $uid,
    'success' => $out['success'],
    'amount' => (int) ($out['amount'] ?? 0),
    'new_balance' => $out['new_balance'],
    'reason' => (string) ($out['reason'] ?? ''),
  ]);
  return $out;
}

function maketou_handle_webhook(): void {
  header('Content-Type: application/json; charset=utf-8');
  header('X-Content-Type-Options: nosniff');
  orolado_load_env();
  maketou_log_request('webhook_in');

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $ref = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($_GET['ref'] ?? '')) ?? '';
    if ($ref !== '') {
      header('Location: ' . orolado_public_origin() . '/pay-blank.html?ref=' . rawurlencode($ref));
      exit;
    }
    echo json_encode(['ok' => true, 'listener' => 'deposit-webhook']);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
  }

  $raw = file_get_contents('php://input') ?: '';
  $hasSig = false;
  foreach ([
    $_SERVER['HTTP_X_SHOPLINE_HMAC_SHA256'] ?? '',
    $_SERVER['HTTP_X_MAKETOU_HMAC_SHA256'] ?? '',
    $_SERVER['HTTP_X_HMAC_SHA256'] ?? '',
    $_SERVER['HTTP_X_SIGNATURE'] ?? '',
  ] as $h) {
    if (trim((string) $h) !== '') $hasSig = true;
  }
  if ($hasSig && maketou_api_key() !== '' && !maketou_verify_hmac($raw)) {
    error_log('OROLADO webhook signature invalide');
    http_response_code(401);
    echo json_encode(['ok' => false, 'reason' => 'signature']);
    exit;
  }
  $signed = $hasSig && maketou_api_key() !== '' && maketou_verify_hmac($raw);

  $payload = json_decode($raw, true);
  if (!is_array($payload)) {
    parse_str($raw, $payload);
  }
  if (!is_array($payload)) $payload = [];

  $hit = maketou_extract_payment($payload);
  if (!empty($_GET['ref']) && $hit['ref'] === '') $hit['ref'] = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $_GET['ref']);
  $ident = ($hit['ref'] !== '' || $hit['email'] !== '' || $hit['sellId'] !== '');
  // Même logique de statut que la vérification : « paid », « completed »…
  if (!$hit['paid'] && maketou_payload_looks_paid($payload)) $hit['paid'] = true;
  if (!$ident || !$hit['paid']) {
    echo json_encode(['ok' => true, 'ignored' => true]);
    exit;
  }

  // Un POST non signé peut venir de n'importe qui : on rejoue la vérification
  // chez Maketou avant tout crédit.
  if (!$signed) {
    $dep = orolado_find_deposit_by_hit($hit);
    if (!$dep) {
      error_log('OROLADO webhook non signé sans dépôt correspondant');
      echo json_encode(['ok' => true, 'ignored' => true, 'reason' => 'unknown']);
      exit;
    }
    $proof = maketou_verify_remote_payment($dep, 2, 2);
    if (empty($proof['paid'])) {
      error_log('OROLADO webhook non signé refusé (' . (string) ($proof['reason'] ?? 'not_paid') . ')');
      http_response_code(202);
      echo json_encode(['ok' => false, 'pending' => true, 'reason' => 'unverified']);
      exit;
    }
    $hit['amount'] = (int) ($proof['amount'] ?? $hit['amount']);
  }

  $result = credit_paid_deposit($hit);
  maketou_log('webhook_credit', ['signed' => $signed, 'hit' => $hit, 'result' => $result]);
  echo json_encode(['ok' => !empty($result['ok']), 'duplicate' => !empty($result['duplicate'])]);
}

/** --- Brevo transactional mail --- */
function brevo_env(string $key, string $default = ''): string {
  orolado_load_env();
  $v = getenv($key);
  if ($v === false || $v === '') $v = $_ENV[$key] ?? $_SERVER[$key] ?? $default;
  return is_string($v) ? trim($v) : $default;
}

function brevo_api_key(): string {
  return brevo_env('BREVO_API_KEY');
}

function brevo_sender(): array {
  return [
    'email' => brevo_env('BREVO_SENDER_EMAIL', 'contact@mail.orolado.com'),
    'name' => brevo_env('BREVO_SENDER_NAME', 'Orolado'),
  ];
}

function brevo_escape(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function brevo_welcome_html(string $name): string {
  $safe = brevo_escape($name !== '' ? $name : 'Membre');
  $origin = rtrim(orolado_public_origin(), '/');
  if ($origin === '') $origin = 'https://orolado.com';
  $dash = $origin . '/';
  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>Bienvenue sur Orolado</title></head>'
    . '<body style="margin:0;padding:0;background:#0B1220;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B1220;padding:24px 12px;">'
    . '<tr><td align="center">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#121A2B;border-radius:16px;border:1px solid #243047;overflow:hidden;">'
    . '<tr><td style="padding:28px 28px 12px;text-align:center;">'
    . '<div style="font-size:22px;font-weight:800;letter-spacing:.04em;color:#F5C518;">OROLADO</div>'
    . '<div style="margin-top:6px;font-size:12px;color:#9AA6BF;">orolado.com</div>'
    . '</td></tr>'
    . '<tr><td style="padding:8px 28px 28px;color:#E8EEF9;font-size:15px;line-height:1.6;">'
    . '<p style="margin:0 0 16px;">Bonjour <strong style="color:#FFFFFF;">' . $safe . '</strong>,</p>'
    . '<p style="margin:0 0 16px;">Bienvenue sur Orolado. Votre inscription est confirmée et votre espace membre est désormais activé.</p>'
    . '<p style="margin:0 0 16px;">Notre mission est de vous mettre à disposition une plateforme fiable, rapide et sécurisée pour vous aider à suivre vos indicateurs et exploiter vos outils en toute sérénité :</p>'
    . '<ul style="margin:0 0 20px;padding-left:18px;color:#C9D2E5;">'
    . '<li style="margin-bottom:10px;"><strong style="color:#FFFFFF;">Données en temps réel :</strong> Une interface fluide conçue pour vous apporter clarté et précision au quotidien.</li>'
    . '<li style="margin-bottom:10px;"><strong style="color:#FFFFFF;">Environnement sécurisé :</strong> La confidentialité de vos accès et de vos paramètres reste notre priorité absolue.</li>'
    . '<li style="margin-bottom:10px;"><strong style="color:#FFFFFF;">Assistance dédiée :</strong> Notre support technique se tient à votre disposition pour vous guider lors de vos premières étapes.</li>'
    . '</ul>'
    . '<p style="margin:0 0 22px;text-align:center;">'
    . '<a href="' . brevo_escape($dash) . '" style="display:inline-block;background:linear-gradient(135deg,#FFD700,#FFA000);color:#0A0F1D;text-decoration:none;font-weight:800;font-size:14px;padding:12px 22px;border-radius:10px;">Accéder à mon espace</a>'
    . '</p>'
    . '<p style="margin:0 0 12px;"><strong style="color:#FFFFFF;">Pour démarrer :</strong><br>Connectez-vous à votre tableau de bord pour découvrir les fonctionnalités disponibles et configurer vos préférences.</p>'
    . '<p style="margin:0 0 18px;">Si vous avez besoin d\'aide ou si vous avez des questions, répondez simplement à cet e-mail ou contactez-nous à <a href="mailto:support@orolado.com" style="color:#F5C518;text-decoration:none;">support@orolado.com</a>.</p>'
    . '<p style="margin:0;color:#C9D2E5;">Bien cordialement,<br><strong style="color:#FFFFFF;">L\'équipe Orolado</strong><br><a href="' . brevo_escape($origin) . '" style="color:#F5C518;text-decoration:none;">orolado.com</a></p>'
    . '</td></tr>'
    . '<tr><td style="padding:14px 28px 22px;border-top:1px solid #243047;font-size:11px;color:#7E8AA3;text-align:center;">Cet e-mail a été envoyé suite à votre inscription sur Orolado.</td></tr>'
    . '</table></td></tr></table></body></html>';
}

function brevo_send_smtp(array $payload): array {
  $key = brevo_api_key();
  if ($key === '') return ['ok' => false, 'reason' => 'BREVO_API_KEY manquante'];
  $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if (!is_string($json)) return ['ok' => false, 'reason' => 'Payload invalide'];
  $ch = curl_init('https://api.brevo.com/v3/smtp/email');
  if ($ch === false) return ['ok' => false, 'reason' => 'curl indisponible'];
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
      'accept: application/json',
      'content-type: application/json',
      'api-key: ' . $key,
    ],
    CURLOPT_POSTFIELDS => $json,
    CURLOPT_TIMEOUT => 18,
  ]);
  $raw = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  if ($raw === false) return ['ok' => false, 'reason' => $err !== '' ? $err : 'Erreur réseau Brevo'];
  $decoded = json_decode((string) $raw, true);
  if ($code >= 200 && $code < 300) {
    return ['ok' => true, 'messageId' => is_array($decoded) ? ($decoded['messageId'] ?? null) : null];
  }
  $reason = is_array($decoded) ? (string) ($decoded['message'] ?? $decoded['error'] ?? 'Erreur Brevo') : 'Erreur Brevo';
  return ['ok' => false, 'reason' => $reason, 'http' => $code];
}

function brevo_send_welcome(string $email, string $name): array {
  $email = strtolower(trim($email));
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    return ['ok' => false, 'reason' => 'E-mail invalide'];
  }
  if (str_contains($email, '@orolado.local') || str_ends_with($email, '.local')) {
    return ['ok' => true, 'skipped' => true];
  }
  $name = trim($name);
  if ($name === '') $name = explode('@', $email)[0];
  $sender = brevo_sender();
  $html = brevo_welcome_html($name);
  $origin = rtrim(orolado_public_origin(), '/');
  if ($origin === '') $origin = 'https://orolado.com';
  $text = "Bonjour $name,\n\n"
    . "Bienvenue sur Orolado. Votre inscription est confirmée et votre espace membre est désormais activé.\n\n"
    . "Notre mission est de vous mettre à disposition une plateforme fiable, rapide et sécurisée pour vous aider à suivre vos indicateurs et exploiter vos outils en toute sérénité.\n\n"
    . "Accédez à votre espace : $origin/\n\n"
    . "Bien cordialement,\nL'équipe Orolado\norolado.com\n";
  return brevo_send_smtp([
    'sender' => $sender,
    'to' => [['email' => $email, 'name' => $name]],
    'subject' => 'Bienvenue sur Orolado – Votre espace membre est prêt',
    'htmlContent' => $html,
    'textContent' => $text,
    'replyTo' => ['email' => 'support@orolado.com', 'name' => 'Support Orolado'],
  ]);
}

function brevo_welcome_already_sent(array $db, string $email): bool {
  $email = strtolower(trim($email));
  return !empty($db['welcomeSent'][$email]);
}

function brevo_mark_welcome_sent(array &$db, string $email): void {
  $email = strtolower(trim($email));
  if (!isset($db['welcomeSent']) || !is_array($db['welcomeSent'])) $db['welcomeSent'] = [];
  $db['welcomeSent'][$email] = date('c');
}

function brevo_otp_html(string $code): string {
  $safe = brevo_escape($code);
  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>Code de confirmation Orolado</title></head>'
    . '<body style="margin:0;padding:0;background:#0B1220;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B1220;padding:24px 12px;">'
    . '<tr><td align="center">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#121A2B;border-radius:16px;border:1px solid #243047;">'
    . '<tr><td style="padding:28px;color:#E8EEF9;font-size:15px;line-height:1.6;">'
    . '<div style="text-align:center;font-size:20px;font-weight:800;color:#F5C518;margin-bottom:18px;">OROLADO</div>'
    . '<p style="margin:0 0 14px;">Bonjour,</p>'
    . '<p style="margin:0 0 18px;">Voici votre code de sécurité pour valider votre inscription sur Orolado :</p>'
    . '<p style="margin:0 0 18px;text-align:center;font-size:32px;font-weight:900;letter-spacing:.28em;color:#FFFFFF;background:#0B1220;border:1px solid #243047;border-radius:12px;padding:16px 12px;">' . $safe . '</p>'
    . '<p style="margin:0 0 12px;color:#C9D2E5;">Ce code expire dans 10 minutes. Si vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer cet e-mail.</p>'
    . '<p style="margin:18px 0 0;color:#9AA6BF;font-size:12px;">L\'équipe Orolado · orolado.com</p>'
    . '</td></tr></table></td></tr></table></body></html>';
}

function brevo_send_otp(string $email, string $code): array {
  $email = strtolower(trim($email));
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    return ['ok' => false, 'reason' => 'E-mail invalide'];
  }
  if (str_contains($email, '@orolado.local') || str_ends_with($email, '.local')) {
    return ['ok' => true, 'skipped' => true];
  }
  $code = preg_replace('/\D/', '', $code);
  if (strlen($code) !== 6) return ['ok' => false, 'reason' => 'Code invalide'];
  $sender = brevo_sender();
  $html = brevo_otp_html($code);
  $text = "Bonjour,\n\nVoici votre code de sécurité pour valider votre inscription sur Orolado :\n\n$code\n\nCe code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.\n\nL'équipe Orolado\norolado.com\n";
  return brevo_send_smtp([
    'sender' => $sender,
    'to' => [['email' => $email]],
    'subject' => 'Votre code de confirmation Orolado : ' . $code,
    'htmlContent' => $html,
    'textContent' => $text,
    'replyTo' => ['email' => 'support@orolado.com', 'name' => 'Support Orolado'],
  ]);
}

function orolado_otp_hash(string $email, string $code): string {
  return hash('sha256', 'orolado-otp|' . strtolower(trim($email)) . '|' . $code);
}

function orolado_pending_regs(array &$db): array {
  if (!isset($db['pendingRegistrations']) || !is_array($db['pendingRegistrations'])) {
    $db['pendingRegistrations'] = [];
  }
  return $db['pendingRegistrations'];
}

function orolado_purge_expired_pending(array &$db): void {
  $now = time();
  if (!isset($db['pendingRegistrations']) || !is_array($db['pendingRegistrations'])) return;
  foreach ($db['pendingRegistrations'] as $email => $row) {
    $exp = (int) ($row['expiresAt'] ?? 0);
    if ($exp > 0 && $exp < $now) unset($db['pendingRegistrations'][$email]);
  }
}

function orolado_usdt_wallet(): string {
  return 'TD32ZDYDvhej6MGk7ZsYC5jLKDdCoJquP1';
}

function orolado_usdt_contract(): string {
  return 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
}

function orolado_crypto_msg(string $code): string {
  if ($code === 'propagating') {
    return 'Transaction en cours de confirmation sur le réseau Tron. Si vous venez d\'envoyer les fonds, patientez 30 secondes et réessayez.';
  }
  if ($code === 'invalid') {
    return 'Transaction invalide : les fonds n\'ont pas été envoyés à l\'adresse officielle de la plateforme.';
  }
  if ($code === 'reused') {
    return 'Ce Hash de transaction a déjà été crédité.';
  }
  if ($code === 'min') {
    return 'Le dépôt minimum est de $3.';
  }
  return 'Paiement confirmé ! Votre solde a été crédité.';
}

function orolado_http_json(string $url, ?string $post = null, int $timeout = 10): ?array {
  $headers = [
    'Accept: application/json',
    'Content-Type: application/json',
    'User-Agent: OROLADO-CryptoVerify/1.2',
  ];
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    $opts = [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => $timeout,
      CURLOPT_CONNECTTIMEOUT => 5,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTPHEADER => $headers,
    ];
    if ($post !== null) {
      $opts[CURLOPT_POST] = true;
      $opts[CURLOPT_POSTFIELDS] = $post;
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if (!is_string($raw) || $raw === '' || $code < 200 || $code >= 300) return null;
    $json = json_decode($raw, true);
    return is_array($json) ? $json : null;
  }
  $ctx = stream_context_create([
    'http' => [
      'method' => $post !== null ? 'POST' : 'GET',
      'header' => implode("\r\n", $headers),
      'content' => $post ?? '',
      'timeout' => $timeout,
      'ignore_errors' => true,
    ],
  ]);
  $raw = @file_get_contents($url, false, $ctx);
  if (!is_string($raw) || $raw === '') return null;
  $json = json_decode($raw, true);
  return is_array($json) ? $json : null;
}

function tron_info_has_transfer(array $info): bool {
  if (!empty($info['trigger_info']['parameter']['_to'])) return true;
  foreach (['trc20TransferInfo', 'tokenTransferInfo', 'trc20_info', 'transfersAllList'] as $key) {
    if (!empty($info[$key])) return true;
  }
  return !empty($info['events']) || !empty($info['trc20']);
}

function tronscan_fetch_tx(string $txid): ?array {
  $txid = strtolower(trim($txid));
  $scan = null;
  foreach ([
    'https://apilist.tronscanapi.com/api/transaction-info?hash=' . rawurlencode($txid),
    'https://apilist.tronscan.org/api/transaction-info?hash=' . rawurlencode($txid),
  ] as $url) {
    $json = orolado_http_json($url, null, 10);
    if (!is_array($json) || $json === []) continue;
    if (empty($json['hash'])) $json['hash'] = $txid;
    $scan = $json;
    $ret = strtoupper((string) ($json['contractRet'] ?? ''));
    if (tron_info_has_transfer($json) && (!empty($json['confirmed']) || $ret === 'SUCCESS')) {
      return $json;
    }
  }
  $grid = tron_fetch_trongrid($txid);
  if ($grid && tron_info_has_transfer($grid)) return $grid;
  return $grid ?: $scan;
}

function tron_fetch_trongrid(string $txid): ?array {
  $txid = strtolower(trim($txid));
  $tx = orolado_http_json('https://api.trongrid.io/wallet/gettransactionbyid', json_encode([
    'value' => $txid,
    'visible' => true,
  ]), 10);
  $meta = orolado_http_json('https://api.trongrid.io/wallet/gettransactioninfobyid', json_encode([
    'value' => $txid,
  ]), 10);
  $events = orolado_http_json('https://api.trongrid.io/v1/transactions/' . rawurlencode($txid) . '/events', null, 10);
  $info = [
    'hash' => $txid,
    'txID' => is_array($tx) ? (string) ($tx['txID'] ?? $txid) : $txid,
    'confirmed' => false,
    'contractRet' => '',
    'revert' => false,
    'trc20TransferInfo' => [],
    'trigger_info' => [],
  ];
  if (is_array($tx) && !empty($tx['ret'][0]['contractRet'])) {
    $info['contractRet'] = strtoupper((string) $tx['ret'][0]['contractRet']);
  }
  if (is_array($meta)) {
    $receipt = strtoupper((string) ($meta['receipt']['result'] ?? ''));
    if ($receipt !== '') $info['contractRet'] = $receipt;
    if (!empty($meta['blockNumber']) || !empty($meta['id'])) $info['confirmed'] = true;
    if (!empty($meta['contract_address'])) {
      $info['trigger_info']['contract_address'] = (string) $meta['contract_address'];
    }
  }
  if ($info['contractRet'] === 'SUCCESS') $info['confirmed'] = true;
  if (is_array($tx) && !empty($tx['raw_data']['contract'][0]['parameter']['value'])) {
    $val = $tx['raw_data']['contract'][0]['parameter']['value'];
    $info['trigger_info']['contract_address'] = (string) ($val['contract_address'] ?? $info['trigger_info']['contract_address'] ?? '');
    $data = (string) ($val['data'] ?? '');
    $decoded = tron_decode_trc20_transfer($data);
    if ($decoded) {
      $info['trigger_info']['parameter'] = [
        '_to' => $decoded['to'],
        '_value' => $decoded['value'],
      ];
      $info['trigger_info']['method'] = 'transfer(address _to,uint256 _value)';
    }
  }
  if (is_array($events) && !empty($events['data']) && is_array($events['data'])) {
    foreach ($events['data'] as $ev) {
      if (!is_array($ev)) continue;
      $res = $ev['result'] ?? [];
      if (!is_array($res)) continue;
      $info['trc20TransferInfo'][] = [
        'to_address' => (string) ($res['to'] ?? $res['_to'] ?? ''),
        'from_address' => (string) ($res['from'] ?? $res['_from'] ?? ''),
        'contract_address' => (string) ($ev['contract_address'] ?? ''),
        'symbol' => 'USDT',
        'amount_str' => (string) ($res['value'] ?? $res['_value'] ?? '0'),
      ];
    }
  }
  if (empty($info['trc20TransferInfo']) && empty($info['trigger_info']['parameter']['_to'])) {
    $hist = orolado_http_json(
      'https://api.trongrid.io/v1/accounts/' . rawurlencode(orolado_usdt_wallet())
      . '/transactions/trc20?limit=80&only_to=true&contract_address=' . rawurlencode(orolado_usdt_contract()),
      null,
      10
    );
    if (is_array($hist) && !empty($hist['data']) && is_array($hist['data'])) {
      foreach ($hist['data'] as $row) {
        if (!is_array($row)) continue;
        if (strcasecmp((string) ($row['transaction_id'] ?? ''), $txid) !== 0) continue;
        $info['confirmed'] = true;
        $info['contractRet'] = 'SUCCESS';
        $info['trc20TransferInfo'][] = [
          'to_address' => (string) ($row['to'] ?? ''),
          'from_address' => (string) ($row['from'] ?? ''),
          'contract_address' => (string) ($row['token_info']['address'] ?? orolado_usdt_contract()),
          'symbol' => (string) ($row['token_info']['symbol'] ?? 'USDT'),
          'amount_str' => (string) ($row['value'] ?? '0'),
        ];
      }
    }
  }
  if (!$info['confirmed'] && $info['contractRet'] !== 'SUCCESS' && empty($info['trc20TransferInfo']) && empty($info['trigger_info']['parameter']['_to'])) {
    return null;
  }
  return $info;
}

function tron_decode_trc20_transfer(string $data): ?array {
  $hex = strtolower(preg_replace('/^0x/', '', $data) ?? '');
  if (strlen($hex) < 136 || !str_starts_with($hex, 'a9059cbb')) return null;
  $addrHex = substr($hex, 32, 40);
  if (strlen($addrHex) !== 40) $addrHex = substr($hex, 8 + 24, 40);
  $amtHex = substr($hex, 72, 64);
  if (strlen($amtHex) < 1) return null;
  $value = 0;
  if (function_exists('hexdec')) {
    $value = hexdec(ltrim($amtHex, '0') !== '' ? ltrim($amtHex, '0') : '0');
  }
  $to = tron_hex_to_base58('41' . $addrHex);
  if ($to === '') return null;
  return ['to' => $to, 'value' => (string) $value];
}

function tron_hex_to_base58(string $hex): string {
  if (!function_exists('gmp_init')) return '';
  $hex = strtolower(preg_replace('/[^0-9a-f]/', '', $hex) ?? '');
  if ($hex === '' || strlen($hex) % 2 !== 0) return '';
  $bin = hex2bin($hex);
  if ($bin === false) return '';
  $hash0 = hash('sha256', $bin, true);
  $hash1 = hash('sha256', $hash0, true);
  $checksum = substr($hash1, 0, 4);
  $full = $bin . $checksum;
  $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  $num = gmp_init(bin2hex($full), 16);
  $out = '';
  $zero = gmp_init(0);
  $fiftyEight = gmp_init(58);
  while (gmp_cmp($num, $zero) > 0) {
    $mod = gmp_intval(gmp_mod($num, $fiftyEight));
    $out = $alphabet[$mod] . $out;
    $num = gmp_div_q($num, $fiftyEight);
  }
  for ($i = 0, $n = strlen($full); $i < $n && $full[$i] === "\x00"; $i++) {
    $out = '1' . $out;
  }
  return $out;
}

function tronscan_usdt_amount(array $row): float {
  $raw = $row['amount_str'] ?? $row['quant'] ?? $row['amount'] ?? $row['value'] ?? $row['_value'] ?? '0';
  if (is_array($raw)) $raw = $raw['amount_str'] ?? $raw['amount'] ?? $raw['value'] ?? '0';
  $s = trim((string) $raw);
  if ($s === '' || !is_numeric($s)) return 0.0;
  if (strpos($s, '.') !== false) return (float) $s;
  return (float) $s / 1000000;
}

function tronscan_trc20_transfers(array $info): array {
  $out = [];
  $seen = [];
  foreach (['trc20TransferInfo', 'tokenTransferInfo', 'trc20_info', 'transfersAllList'] as $key) {
    $list = $info[$key] ?? null;
    if (is_array($list) && (isset($list['to_address']) || isset($list['toAddress']) || isset($list['amount_str']) || isset($list['to']))) {
      $list = [$list];
    }
    if (!is_array($list)) continue;
    foreach ($list as $row) {
      if (!is_array($row)) continue;
      $sig = strtolower(
        (string) ($row['to_address'] ?? $row['toAddress'] ?? $row['to'] ?? '')
        . '|' . (string) ($row['amount_str'] ?? $row['amount'] ?? $row['value'] ?? '')
        . '|' . (string) ($row['contract_address'] ?? $row['contractAddress'] ?? '')
      );
      if (isset($seen[$sig])) continue;
      $seen[$sig] = true;
      $out[] = $row;
    }
  }
  $ti = $info['trigger_info'] ?? null;
  if (is_array($ti) && !empty($ti['parameter']['_to'])) {
    $row = [
      'to_address' => (string) $ti['parameter']['_to'],
      'contract_address' => (string) ($ti['contract_address'] ?? orolado_usdt_contract()),
      'symbol' => 'USDT',
      'amount_str' => (string) ($ti['parameter']['_value'] ?? '0'),
    ];
    $sig = strtolower($row['to_address'] . '|' . $row['amount_str'] . '|' . $row['contract_address']);
    if (!isset($seen[$sig])) $out[] = $row;
  }
  return $out;
}

function tron_transfer_is_usdt(array $row): bool {
  $c = strtolower((string) ($row['contract_address'] ?? $row['contractAddress'] ?? $row['tokenName'] ?? ''));
  $sym = strtoupper((string) ($row['symbol'] ?? $row['tokenAbbr'] ?? ''));
  return $c === strtolower(orolado_usdt_contract())
    || $sym === 'USDT'
    || strpos($c, 'tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t') !== false;
}

function tronscan_match_usdt(array $info): array {
  $wallet = orolado_usdt_wallet();
  $ret = strtoupper((string) ($info['contractRet'] ?? $info['contract_ret'] ?? ''));
  if (!empty($info['revert']) || $ret === 'REVERT') {
    return ['ok' => false, 'code' => 'invalid'];
  }
  $confirmed = !empty($info['confirmed'])
    || $ret === 'SUCCESS'
    || (int) ($info['confirmations'] ?? 0) > 0
    || (int) ($info['block'] ?? 0) > 0;
  if (!$confirmed) return ['ok' => false, 'code' => 'propagating'];

  $hash = (string) ($info['hash'] ?? $info['txID'] ?? $info['txid'] ?? '');
  if ($hash === '') return ['ok' => false, 'code' => 'propagating'];

  $toUs = 0.0;
  $foundWrong = false;
  $foundUsdt = false;
  foreach (tronscan_trc20_transfers($info) as $row) {
    if (!tron_transfer_is_usdt($row)) continue;
    $foundUsdt = true;
    $to = (string) ($row['to_address'] ?? $row['toAddress'] ?? $row['to'] ?? '');
    $amt = tronscan_usdt_amount($row);
    if (strcasecmp($to, $wallet) !== 0) {
      $foundWrong = true;
      continue;
    }
    $toUs += $amt;
  }
  if ($toUs > 0) return ['ok' => true, 'amount' => $toUs];
  if ($foundUsdt || $foundWrong) return ['ok' => false, 'code' => 'invalid'];
  return ['ok' => false, 'code' => 'propagating'];
}

function orolado_txid_already_used(array $db, string $txid): bool {
  foreach ($db['processedTx'] ?? [] as $seen) {
    if (strcasecmp((string) $seen, $txid) === 0) return true;
  }
  return false;
}

function orolado_crypto_vault(array $db, string $uid): array {
  $jsonVault = $db['vault'][$uid] ?? ['demo' => 0, 'real' => 0];
  $vault = supabase_admin_vault($uid);
  if (!$vault) $vault = $jsonVault;
  else {
    $vault['real'] = max((float) ($vault['real'] ?? 0), (float) ($jsonVault['real'] ?? 0));
    $vault['demo'] = max((float) ($vault['demo'] ?? 0), (float) ($jsonVault['demo'] ?? 0));
  }
  return [
    'demo' => orolado_money($vault['demo'] ?? 0),
    'real' => orolado_money($vault['real'] ?? 0),
  ];
}

function orolado_verify_crypto_deposit(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $token = (string) ($req['token'] ?? '');
  $me = orolado_session_user($db, $token);
  if (!$me) {
    return ['ok' => false, 'server' => true, 'code' => 'session', 'reason' => 'Session invalide'];
  }

  $txid = strtolower(preg_replace('/\s+/', '', (string) ($req['txid'] ?? $req['txId'] ?? $req['hash'] ?? '')) ?? '');
  if (str_starts_with($txid, '0x')) $txid = substr($txid, 2);
  if (strlen($txid) < 8 || strlen($txid) > 128 || !preg_match('/^[a-f0-9]+$/', $txid)) {
    return ['ok' => false, 'server' => true, 'code' => 'txid', 'reason' => 'Saisissez un TxID Tron valide'];
  }

  if (!isset($db['deposits']) || !is_array($db['deposits'])) $db['deposits'] = [];
  $uid = (string) $me['id'];
  foreach ($db['deposits'] as $d) {
    if (strcasecmp((string) ($d['txid'] ?? ''), $txid) !== 0
      && strcasecmp((string) ($d['extId'] ?? ''), $txid) !== 0) {
      continue;
    }
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st === 'COMPLETED' || $st === 'PAID') {
      return ['ok' => false, 'server' => true, 'code' => 'reused', 'reason' => orolado_crypto_msg('reused')];
    }
    $owner = (string) ($d['userId'] ?? '');
    if ($owner !== '' && $owner !== $uid) {
      return ['ok' => false, 'server' => true, 'code' => 'reused', 'reason' => orolado_crypto_msg('reused')];
    }
  }
  if (orolado_txid_already_used($db, $txid)) {
    return ['ok' => false, 'server' => true, 'code' => 'reused', 'reason' => orolado_crypto_msg('reused')];
  }

  $info = tronscan_fetch_tx($txid);
  if (!$info) {
    return ['ok' => false, 'server' => true, 'code' => 'propagating', 'reason' => orolado_crypto_msg('propagating')];
  }
  $match = tronscan_match_usdt($info);
  if (empty($match['ok'])) {
    $code = (string) ($match['code'] ?? 'propagating');
    return ['ok' => false, 'server' => true, 'code' => $code, 'reason' => orolado_crypto_msg($code)];
  }

  $receivedAmount = orolado_money($match['amount'] ?? 0);
  $expectedAmount = orolado_money($req['amount'] ?? $req['expectedAmount'] ?? 0);
  // Jamais received === expected : 3.50 USDT pour une facture 3.00 doit passer.
  if ($expectedAmount > 0 && !($receivedAmount + 0.0001 >= $expectedAmount) && $receivedAmount + 0.0001 < orolado_min_deposit($me)) {
    return ['ok' => false, 'server' => true, 'code' => 'min', 'reason' => orolado_crypto_msg('min')];
  }
  if ($receivedAmount + 0.0001 < orolado_min_deposit($me)) {
    return ['ok' => false, 'server' => true, 'code' => 'min', 'reason' => orolado_crypto_msg('min')];
  }
  if ($receivedAmount > orolado_max_deposit_usd()) {
    return ['ok' => false, 'server' => true, 'code' => 'invalid', 'reason' => orolado_crypto_msg('invalid')];
  }
  $realAmt = $receivedAmount;

  $ref = '';
  foreach ($db['deposits'] as $i => $d) {
    if (strcasecmp((string) ($d['txid'] ?? ''), $txid) === 0 && (string) ($d['userId'] ?? '') === $uid) {
      $ref = (string) ($d['id'] ?? $d['ref'] ?? '');
      $db['deposits'][$i]['amount'] = $realAmt;
      $db['deposits'][$i]['txid'] = $txid;
      save_db($file, $db);
      break;
    }
  }
  if ($ref === '') {
    $ref = 'oro_usdt_' . bin2hex(random_bytes(10));
    $db['deposits'][] = [
      'id' => $ref,
      'ref' => $ref,
      'userId' => $uid,
      'operator' => 'usdt',
      'network' => 'TRC-20',
      'status' => 'PENDING',
      'amount' => $realAmt,
      'currency' => 'USD',
      'txid' => $txid,
      'address' => orolado_usdt_wallet(),
      'at' => date('c')
    ];
    save_db($file, $db);
    supabase_insert_deposit([
      'id' => $ref,
      'user_id' => $uid,
      'amount' => $realAmt,
      'status' => 'PENDING',
      'reference' => $ref,
      'operator' => 'usdt',
    ]);
    supabase_patch_deposit($ref, ['txid' => $txid]);
  }

  $paid = credit_paid_deposit([
    'ref' => $ref,
    'amount' => $realAmt,
    'extId' => $txid,
    'paid' => true,
    'creditReceived' => true,
  ]);
  if (!empty($paid['duplicate'])) {
    return ['ok' => false, 'server' => true, 'code' => 'reused', 'reason' => orolado_crypto_msg('reused')];
  }
  if (empty($paid['ok']) || (!empty($paid['reason']) && empty($paid['amount']))) {
    return ['ok' => false, 'server' => true, 'code' => 'invalid', 'reason' => orolado_crypto_msg('invalid')];
  }

  $credited = orolado_money($paid['amount'] ?? $realAmt);
  $db = load_db($file);
  $vault = orolado_crypto_vault($db, $uid);
  return [
    'ok' => true,
    'server' => true,
    'paid' => true,
    'success' => true,
    'amount' => $credited,
    'vault' => $vault,
    'new_balance' => $vault['real'],
    'ref' => $ref,
    'txid' => $txid,
    'code' => 'credited',
    'reason' => orolado_crypto_msg('credited'),
  ];
}

function orolado_submit_usdt_deposit(array $req): array {
  return orolado_verify_crypto_deposit($req);
}

