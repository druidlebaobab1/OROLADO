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
  return ['users' => [], 'vault' => [], 'withdrawals' => [], 'sessions' => [], 'orders' => [], 'deposits' => [], 'processedTx' => [], 'support_messages' => [], 'admin_logs' => [], 'bans' => [], 'currency' => 'USD'];
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

function orolado_withdraw_min_for(string $op): float {
  $map = [
    'usdt' => 10.0, 'trx' => 10.0, 'sol' => 10.0, 'bnb' => 10.0, 'btc' => 15.0, 'eth' => 15.0,
    'opay' => 5.0, 'palmpay' => 5.0, 'wave' => 5.0, 'orange' => 5.0, 'mtn' => 5.0, 'mpesa' => 5.0,
    'moov' => 5.0, 'airtel' => 5.0, 'pix' => 5.0, 'mercadopago' => 5.0, 'nequi' => 5.0,
    'gcash' => 5.0, 'upi' => 5.0, 'stcpay' => 10.0, 'picpay' => 10.0, 'papara' => 10.0,
    'paypal' => 25.0, 'skrill' => 25.0, 'neteller' => 25.0, 'card' => 25.0, 'bank' => 25.0,
  ];
  return $map[$op] ?? 5.0;
}

function orolado_max_deposit_usd(): float {
  return 100000.0;
}

function orolado_meta_pixel_id(): string {
  $id = supabase_env('META_PIXEL_ID');
  return $id !== '' ? $id : '935068479097391';
}

function orolado_meta_access_token(): string {
  $tok = supabase_env('META_ACCESS_TOKEN');
  if ($tok === '') $tok = supabase_env('META_CAPI_TOKEN');
  return $tok;
}

function orolado_request_ip(): string {
  $xff = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
  if ($xff !== '') {
    $first = trim(explode(',', $xff)[0]);
    if (filter_var($first, FILTER_VALIDATE_IP)) return $first;
  }
  $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
  return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '';
}

function orolado_request_ua(): string {
  return substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 512);
}

/** CAPI Purchase — jamais lever, timeout court, n’altère pas le crédit. */
function orolado_meta_capi_purchase(array $opts): void {
  try {
    $token = orolado_meta_access_token();
    $pixel = orolado_meta_pixel_id();
    if ($token === '' || $pixel === '') return;
    $value = orolado_money($opts['value'] ?? 0);
    if ($value <= 0) return;
    $userData = [];
    $email = strtolower(trim((string) ($opts['email'] ?? '')));
    if ($email !== '' && str_contains($email, '@')) {
      $userData['em'] = [hash('sha256', $email)];
    }
    $ip = trim((string) ($opts['ip'] ?? ''));
    if ($ip !== '') $userData['client_ip_address'] = explode(',', $ip)[0];
    $ua = trim((string) ($opts['ua'] ?? ''));
    if ($ua !== '') $userData['client_user_agent'] = $ua;
    $event = [
      'event_name' => 'Purchase',
      'event_time' => time(),
      'action_source' => 'website',
      'user_data' => $userData,
      'custom_data' => ['value' => $value, 'currency' => 'USD'],
    ];
    $eid = trim((string) ($opts['event_id'] ?? ''));
    if ($eid !== '') $event['event_id'] = $eid;
    $url = 'https://graph.facebook.com/v25.0/' . rawurlencode($pixel) . '/events?access_token=' . rawurlencode($token);
    $ch = curl_init($url);
    if ($ch === false) return;
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => json_encode(['data' => [$event]], JSON_UNESCAPED_UNICODE),
      CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 2,
      CURLOPT_CONNECTTIMEOUT => 1,
    ]);
    curl_exec($ch);
    curl_close($ch);
  } catch (Throwable $e) {
    /* le tracking ne doit jamais casser un dépôt */
  }
}

function orolado_meta_capi_purchase_later(array $opts): void {
  if (!isset($GLOBALS['__oro_meta_capi']) || !is_array($GLOBALS['__oro_meta_capi'])) {
    $GLOBALS['__oro_meta_capi'] = [];
  }
  $GLOBALS['__oro_meta_capi'][] = $opts;
  static $reg = false;
  if ($reg) return;
  $reg = true;
  register_shutdown_function(static function () {
    if (function_exists('fastcgi_finish_request')) {
      try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ }
    }
    foreach (($GLOBALS['__oro_meta_capi'] ?? []) as $row) {
      if (is_array($row)) orolado_meta_capi_purchase($row);
    }
  });
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
function supabase_resolve_trade(string $userId, string $orderId, $amount): ?array {
  $hdrs = supabase_admin_headers();
  if (!$hdrs || $orderId === '') return null;
  $amount = orolado_money($amount);
  $rpc = supabase_http(
    supabase_project_url() . '/rest/v1/rpc/resolve_trade',
    $hdrs,
    json_encode(['p_user' => $userId, 'p_order' => $orderId, 'p_amount' => $amount]),
    'POST'
  );
  if (is_array($rpc) && isset($rpc[0]) && is_array($rpc[0])) $rpc = $rpc[0];
  if (!is_array($rpc) || empty($rpc['ok'])) return null;
  return [
    'real' => orolado_money($rpc['real'] ?? 0),
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

/** Écrit le solde réel JSON vers Supabase (valeur absolue, pas un max). */
function supabase_set_real(string $userId, $amount): void {
  $amount = orolado_money($amount);
  $hdrs = supabase_admin_headers();
  if (!$hdrs || $amount < 0) return;
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return;
  $url = supabase_project_url();
  $payload = json_encode(['real' => $amount, 'updated_at' => date('c')]);
  supabase_http($url . '/rest/v1/vaults?user_id=eq.' . rawurlencode($userId), $hdrs, $payload, 'PATCH');
  $again = supabase_admin_vault($userId);
  if ($again === null) {
    supabase_http($url . '/rest/v1/vaults', $hdrs, json_encode([
      'user_id' => $userId,
      'real' => $amount,
      'demo' => 0,
      'updated_at' => date('c'),
    ], JSON_UNESCAPED_UNICODE), 'POST');
    return;
  }
  if (orolado_money($again['real'] ?? 0) + 0.009 < $amount) {
    supabase_http($url . '/rest/v1/vaults?user_id=eq.' . rawurlencode($userId), $hdrs, $payload, 'PATCH');
  }
}

function orolado_blocked_roles(): array {
  return ['suspended', 'banned', 'deleted'];
}

function orolado_norm_email(string $email): string {
  return strtolower(trim($email));
}

function orolado_norm_phone(string $phone): string {
  return preg_replace('/\D+/', '', $phone) ?? '';
}

function orolado_remember_blocked_identity(array &$db, array $user, string $kind): void {
  if (!isset($db['blocked_identities']) || !is_array($db['blocked_identities'])) {
    $db['blocked_identities'] = [];
  }
  $kind = $kind === 'deleted' ? 'deleted' : 'suspended';
  $email = orolado_norm_email((string) ($user['originalEmail'] ?? $user['email'] ?? ''));
  if (str_ends_with($email, '@orolado.invalid')) {
    $email = orolado_norm_email((string) ($user['originalEmail'] ?? ''));
  }
  $phone = orolado_norm_phone((string) ($user['phone'] ?? ''));
  $uid = (string) ($user['id'] ?? '');
  $row = ['uid' => $uid, 'kind' => $kind, 'email' => $email, 'phone' => $phone, 'at' => date('c')];
  if ($email !== '') $db['blocked_identities']['email:' . $email] = $row;
  if ($phone !== '' && strlen($phone) >= 8) $db['blocked_identities']['phone:' . $phone] = $row;
}

function orolado_identity_block(array $db, string $email = '', string $phone = ''): ?array {
  $email = orolado_norm_email($email);
  $phone = orolado_norm_phone($phone);
  $ids = is_array($db['blocked_identities'] ?? null) ? $db['blocked_identities'] : [];
  if ($email !== '' && isset($ids['email:' . $email]) && is_array($ids['email:' . $email])) {
    return $ids['email:' . $email];
  }
  if ($phone !== '' && isset($ids['phone:' . $phone]) && is_array($ids['phone:' . $phone])) {
    return $ids['phone:' . $phone];
  }
  foreach (($db['users'] ?? []) as $u) {
    if (!is_array($u)) continue;
    $uid = (string) ($u['id'] ?? '');
    $kind = orolado_user_block_kind($db, $uid);
    if ($kind === '') {
      $role = strtolower((string) ($u['role'] ?? ''));
      if (in_array($role, orolado_blocked_roles(), true)) {
        $kind = $role === 'deleted' ? 'deleted' : 'suspended';
      }
    }
    if ($kind === '') continue;
    $mails = [
      orolado_norm_email((string) ($u['email'] ?? '')),
      orolado_norm_email((string) ($u['originalEmail'] ?? '')),
    ];
    if ($email !== '' && in_array($email, $mails, true)) {
      return ['uid' => $uid, 'kind' => $kind, 'email' => $email];
    }
    $ph = orolado_norm_phone((string) ($u['phone'] ?? ''));
    if ($phone !== '' && $ph !== '' && $ph === $phone) {
      return ['uid' => $uid, 'kind' => $kind, 'phone' => $phone];
    }
  }
  return null;
}

function orolado_block_message(string $kind): string {
  if ($kind === 'deleted') {
    return 'Ce compte a été fermé définitivement. Contactez le support Orolado si vous pensez qu’il s’agit d’une erreur.';
  }
  return 'Votre compte a été suspendu pour non-respect des règles d’utilisation. Si vous pensez qu’il s’agit d’une erreur, contactez le support Orolado.';
}

function orolado_block_payload(string $kind = 'suspended'): array {
  $kind = $kind === 'deleted' ? 'deleted' : 'suspended';
  return [
    'ok' => false,
    'server' => true,
    'banned' => true,
    'kind' => $kind,
    'reason' => orolado_block_message($kind),
  ];
}

function orolado_user_block_kind(array $db, string $uid): string {
  if ($uid === '') return '';
  $ban = $db['bans'][$uid] ?? null;
  if (is_array($ban)) {
    return strtolower((string) ($ban['kind'] ?? 'suspended')) === 'deleted' ? 'deleted' : 'suspended';
  }
  if (is_string($ban) && $ban !== '') {
    return strtolower($ban) === 'deleted' ? 'deleted' : 'suspended';
  }
  $role = strtolower((string) (($db['users'][$uid]['role'] ?? '')));
  if ($role === 'deleted') return 'deleted';
  if (in_array($role, ['suspended', 'banned'], true)) return 'suspended';
  return '';
}

function supabase_admin_profile_role(string $userId): string {
  $hdrs = supabase_admin_headers();
  if (!$hdrs || $userId === '') return '';
  $rows = supabase_http(
    supabase_project_url() . '/rest/v1/profiles?id=eq.' . rawurlencode($userId) . '&select=role',
    $hdrs,
    null,
    'GET'
  );
  if (!is_array($rows) || !isset($rows[0]) || !is_array($rows[0])) return '';
  return strtolower(trim((string) ($rows[0]['role'] ?? '')));
}

function supabase_force_logout(string $userId): void {
  $hdrs = supabase_admin_headers();
  if (!$hdrs || $userId === '') return;
  $url = rtrim(supabase_project_url(), '/');
  supabase_http($url . '/auth/v1/admin/users/' . rawurlencode($userId) . '/logout', $hdrs, '{}', 'POST');
  supabase_http($url . '/auth/v1/admin/users/' . rawurlencode($userId), $hdrs, json_encode(['ban_duration' => '876000h']), 'PUT');
}

function orolado_kick_file(string $uid): string {
  $dir = rtrim(str_replace('\\', '/', orolado_data_dir()), '/') . '/kicks';
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  $safe = preg_replace('/[^a-zA-Z0-9_-]/', '', $uid) ?: 'x';
  return $dir . '/' . $safe . '.kick';
}

function orolado_kick_now(string $uid): void {
  if ($uid === '') return;
  @file_put_contents(orolado_kick_file($uid), date('c'));
}

function orolado_is_kicked(string $uid): bool {
  return $uid !== '' && is_file(orolado_kick_file($uid));
}

function orolado_clear_kick(string $uid): void {
  $f = orolado_kick_file($uid);
  if (is_file($f)) @unlink($f);
}

function supabase_admin_delete_auth(string $userId): void {
  $hdrs = supabase_admin_headers();
  if (!$hdrs || $userId === '') return;
  supabase_http(rtrim(supabase_project_url(), '/') . '/auth/v1/admin/users/' . rawurlencode($userId), $hdrs, null, 'DELETE');
}

function orolado_force_suspend(array &$db, string $uid, string $kind = 'suspended'): void {
  if ($uid === '' || $uid === 'admin_master') return;
  $kind = $kind === 'deleted' ? 'deleted' : 'suspended';
  if (!isset($db['bans']) || !is_array($db['bans'])) $db['bans'] = [];
  $db['bans'][$uid] = ['at' => date('c'), 'kind' => $kind];
  if (isset($db['users'][$uid]) && is_array($db['users'][$uid])) {
    $u = $db['users'][$uid];
    $orig = orolado_norm_email((string) ($u['originalEmail'] ?? $u['email'] ?? ''));
    if ($orig !== '' && !str_ends_with($orig, '@orolado.invalid')) {
      $db['users'][$uid]['originalEmail'] = $orig;
    }
    $db['users'][$uid]['role'] = $kind;
    orolado_remember_blocked_identity($db, $db['users'][$uid], $kind);
  }
  if (function_exists('admin_kill_user_sessions')) {
    admin_kill_user_sessions($db, $uid);
  }
  orolado_revoke_user_sessions($db, $uid);
  $hdrs = supabase_admin_headers();
  if ($hdrs) {
    supabase_http(
      rtrim(supabase_project_url(), '/') . '/rest/v1/profiles?id=eq.' . rawurlencode($uid),
      $hdrs,
      json_encode(['role' => $kind]),
      'PATCH'
    );
  }
  orolado_kick_now($uid);
  supabase_force_logout($uid);
}

function orolado_force_delete_account(array &$db, string $uid): void {
  if ($uid === '' || $uid === 'admin_master') return;
  orolado_force_suspend($db, $uid, 'deleted');
  if (isset($db['users'][$uid]) && is_array($db['users'][$uid])) {
    $orig = orolado_norm_email((string) ($db['users'][$uid]['originalEmail'] ?? $db['users'][$uid]['email'] ?? ''));
    if ($orig !== '' && !str_ends_with($orig, '@orolado.invalid')) {
      $db['users'][$uid]['originalEmail'] = $orig;
      $db['users'][$uid]['email'] = $orig;
    }
    $db['users'][$uid]['displayName'] = (string) ($db['users'][$uid]['displayName'] ?? 'Compte fermé');
    $db['users'][$uid]['passwordHash'] = '';
    $db['users'][$uid]['password'] = '';
    $db['users'][$uid]['deletedAt'] = date('c');
    orolado_remember_blocked_identity($db, $db['users'][$uid], 'deleted');
  }
}

function orolado_token_user_id(array $db, ?string $token): string {
  $token = trim((string) $token);
  if ($token === '') return '';
  if (isset($db['sessions'][$token]) && is_array($db['sessions'][$token])) {
    return (string) ($db['sessions'][$token]['userId'] ?? '');
  }
  $sb = supabase_fetch_auth_user($token);
  return ($sb && !empty($sb['id'])) ? (string) $sb['id'] : '';
}

function orolado_session_inspect(array &$db, ?string $token): array {
  $uidHint = orolado_token_user_id($db, $token);
  if ($uidHint !== '' && orolado_is_kicked($uidHint)) {
    $kind = orolado_user_block_kind($db, $uidHint) ?: 'suspended';
    return orolado_block_payload($kind);
  }
  $me = orolado_session_user($db, $token);
  if ($me) {
    $uid = (string) ($me['id'] ?? '');
    if ($uid !== '' && orolado_is_kicked($uid)) {
      return orolado_block_payload(orolado_user_block_kind($db, $uid) ?: 'suspended');
    }
    return ['ok' => true, 'user' => $me];
  }
  $uid = $uidHint;
  if ($uid === '') return ['ok' => false, 'server' => true, 'reason' => 'Session invalide'];
  $kind = orolado_user_block_kind($db, $uid);
  if ($kind === '') {
    $sbRole = supabase_admin_profile_role($uid);
    if (in_array($sbRole, orolado_blocked_roles(), true)) {
      $kind = $sbRole === 'deleted' ? 'deleted' : 'suspended';
    }
  }
  if ($kind !== '') return orolado_block_payload($kind);
  return ['ok' => false, 'server' => true, 'reason' => 'Session invalide'];
}

/** Aligne Supabase sur le grand livre JSON sans jamais écraser un solde plus élevé côté dépôt. */
function orolado_sync_official_real(string $uid, float $jsonReal): float {
  $jsonReal = orolado_money($jsonReal);
  $sb = supabase_admin_vault($uid);
  $sbReal = $sb ? orolado_money($sb['real'] ?? 0) : null;
  if ($sbReal === null) return $jsonReal;
  if ($jsonReal > $sbReal + 0.009) {
    supabase_set_real($uid, $jsonReal);
    return $jsonReal;
  }
  return $sbReal;
}

function orolado_trade_credit(bool $won, bool $voided, float $stake, float $payout): float {
  if ($voided) return orolado_money($stake);
  if ($won) return orolado_money($stake * $payout);
  return 0.0;
}

function orolado_wd_is_hidden_from_player(array $w): bool {
  $st = strtolower(trim((string) ($w['status'] ?? '')));
  return !empty($w['adminHidden']) || !empty($w['playerHidden'])
    || in_array($st, ['silenced', 'silent', 'hidden', 'deleted'], true);
}

function orolado_official_real(array $db, string $uid): float {
  $json = orolado_money($db['vault'][$uid]['real'] ?? 0);
  $sb = supabase_admin_vault($uid);
  $sbReal = $sb ? orolado_money($sb['real'] ?? 0) : null;
  if ($sbReal === null) return $json;
  return orolado_money(max($json, $sbReal));
}

/** Crédit/débit réel définitif (valeur absolue). Option dépôt = même registre que les vrais paiements. */
function orolado_ledger_apply(array &$db, string $uid, float $delta, string $note, bool $asDeposit = false): array {
  $delta = orolado_money($delta);
  if ($uid === '' || abs($delta) < 0.0001) {
    return ['ok' => false, 'reason' => 'Montant invalide', 'real' => 0.0];
  }
  if (!isset($db['vault'][$uid]) || !is_array($db['vault'][$uid])) {
    $db['vault'][$uid] = ['demo' => 0, 'real' => 0];
  }
  $cur = orolado_official_real($db, $uid);
  $next = orolado_money(max(0, $cur + $delta));
  if ($delta < 0 && $cur + $delta < -0.009) {
    return ['ok' => false, 'reason' => 'Solde insuffisant', 'real' => $cur];
  }
  $db['vault'][$uid]['real'] = $next;
  supabase_set_real($uid, $next);
  $again = supabase_admin_vault($uid);
  if ($again && orolado_money($again['real'] ?? 0) + 0.009 < $next) {
    supabase_set_real($uid, $next);
  }
  if ($asDeposit && $delta > 0) {
    $ref = 'adm_' . bin2hex(random_bytes(6));
    if (!isset($db['deposits']) || !is_array($db['deposits'])) $db['deposits'] = [];
    $db['deposits'][] = [
      'id' => $ref,
      'ref' => $ref,
      'userId' => $uid,
      'amount' => $delta,
      'status' => 'COMPLETED',
      'operator' => 'admin',
      'createdAt' => date('c'),
      'paidAt' => date('c'),
      'note' => $note,
    ];
    if (isset($db['users'][$uid]) && is_array($db['users'][$uid])) {
      $db['users'][$uid]['realDepositTotal'] = orolado_money(($db['users'][$uid]['realDepositTotal'] ?? 0) + $delta);
    }
    supabase_insert_deposit([
      'id' => $ref,
      'user_id' => $uid,
      'amount' => $delta,
      'status' => 'COMPLETED',
      'operator' => 'admin',
      'reference' => $ref,
    ]);
  }
  return ['ok' => true, 'real' => $next, 'delta' => $delta];
}

function orolado_refund_wd_once(array &$db, array &$w): bool {
  if (!empty($w['refundedAt']) || !empty($w['refunded'])) return false;
  $uid = (string) ($w['userId'] ?? $w['user_id'] ?? '');
  $amt = orolado_money(abs((float) ($w['amount'] ?? 0)));
  if ($uid === '' || $amt <= 0) {
    $w['refundedAt'] = date('c');
    $w['refunded'] = true;
    return false;
  }
  $res = orolado_ledger_apply($db, $uid, $amt, 'Remboursement retrait refusé', false);
  $w['refundedAt'] = date('c');
  $w['refunded'] = !empty($res['ok']);
  $w['refundReal'] = $res['real'] ?? null;
  return !empty($res['ok']);
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
  return ['demo' => orolado_money($rows[0]['demo'] ?? 0), 'real' => orolado_money($rows[0]['real'] ?? 0)];
}

function orolado_outcome_from_prices($side, $entry, $exit): ?array {
  $side = (($side ?? '') === 'put') ? 'put' : ((($side ?? '') === 'call') ? 'call' : '');
  if ($side === '') return null;
  $entry = orolado_money($entry);
  $exit = orolado_money($exit);
  if ($entry <= 0 || $exit <= 0) return null;
  if (abs($exit - $entry) < 0.005) return ['voided' => true, 'won' => false];
  $won = $side === 'put' ? ($exit < $entry) : ($exit > $entry);
  return ['voided' => false, 'won' => $won];
}

function orolado_repair_overwritten_reals_once(): void {
  if (!supabase_admin_ready()) return;
  $dir = orolado_data_dir();
  $marker = rtrim($dir, '/\\') . '/vault_repair_v529.done';
  $lockPath = rtrim($dir, '/\\') . '/vault_repair_v529.lock';
  if (is_file($marker)) return;
  $fp = @fopen($lockPath, 'c');
  if (!$fp) return;
  if (!flock($fp, LOCK_EX | LOCK_NB)) {
    fclose($fp);
    return;
  }
  if (is_file($marker)) {
    flock($fp, LOCK_UN);
    fclose($fp);
    return;
  }
  $report = orolado_repair_overwritten_reals();
  try {
    file_put_contents($marker, json_encode(['at' => date('c'), 'report' => $report], JSON_UNESCAPED_UNICODE));
  } catch (Throwable $e1) { /* ignore */ }
  flock($fp, LOCK_UN);
  fclose($fp);
}

function orolado_repair_overwritten_reals(): array {
  $hdrs = supabase_admin_headers();
  $url = supabase_project_url();
  if (!$hdrs || $url === '') return ['ok' => false, 'reason' => 'supabase'];
  $vaults = supabase_http($url . '/rest/v1/vaults?select=user_id,real&real=gt.0&limit=500', $hdrs);
  if (!is_array($vaults)) return ['ok' => false, 'reason' => 'list'];
  $fixed = [];
  $skipped = 0;
  foreach ($vaults as $row) {
    $uid = (string) ($row['user_id'] ?? '');
    $cur = orolado_money($row['real'] ?? 0);
    if ($uid === '' || $cur <= 0) { $skipped++; continue; }
    $deps = supabase_http($url . '/rest/v1/deposits?user_id=eq.' . rawurlencode($uid) . '&select=amount,status,completed_at,created_at&order=created_at.asc&limit=80', $hdrs);
    $wds = supabase_http($url . '/rest/v1/withdrawals?user_id=eq.' . rawurlencode($uid) . '&select=amount,status&limit=80', $hdrs);
    $ords = supabase_http($url . '/rest/v1/orders?user_id=eq.' . rawurlencode($uid) . '&select=stake,payout,won,status,mode,net&limit=500', $hdrs);
    $depAmt = 0.0;
    $depMatch = false;
    if (is_array($deps)) {
      foreach ($deps as $d) {
        $st = strtoupper((string) ($d['status'] ?? ''));
        if ($st !== 'COMPLETED' && $st !== 'PAID') continue;
        $amt = orolado_money($d['amount'] ?? 0);
        if ($amt <= 0) continue;
        $depAmt += $amt;
        if (abs($amt - $cur) < 0.06) $depMatch = true;
      }
    }
    if (!$depMatch) { $skipped++; continue; }
    $wdAmt = 0.0;
    if (is_array($wds)) {
      foreach ($wds as $w) {
        $st = strtoupper((string) ($w['status'] ?? ''));
        if ($st !== 'APPROVED' && $st !== 'PAID' && $st !== 'COMPLETED' && $st !== 'SUCCESS') continue;
        $wdAmt += orolado_money($w['amount'] ?? 0);
      }
    }
    $net = 0.0;
    if (is_array($ords)) {
      foreach ($ords as $o) {
        if (($o['mode'] ?? 'demo') !== 'real') continue;
        $stake = orolado_money($o['stake'] ?? 0);
        if ($stake <= 0) continue;
        $st = strtolower((string) ($o['status'] ?? ''));
        $payout = (float) ($o['payout'] ?? 1.88);
        if ($payout < 1.01) $payout = 1.88;
        if ($st === 'void') continue;
        if ($st === 'open') { $net -= $stake; continue; }
        if (!empty($o['won']) || $st === 'won') $net += orolado_money($stake * ($payout - 1));
        else $net -= $stake;
      }
    }
    $expected = orolado_money(max(0, $depAmt - $wdAmt + $net));
    if ($expected <= $cur + 0.04) { $skipped++; continue; }
    $delta = orolado_money($expected - $cur);
    if ($delta <= 0) { $skipped++; continue; }
    supabase_credit_real($uid, $delta, false);
    $fixed[] = ['user_id' => $uid, 'from' => $cur, 'to' => $expected, 'delta' => $delta];
  }
  return ['ok' => true, 'fixed' => $fixed, 'skipped' => $skipped];
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
  if (!isset($db['bans']) || !is_array($db['bans'])) $db['bans'] = [];
  foreach ($db['sessions'] as $sid => $sess) {
    if ($sid !== $token) continue;
    $uid = (string) ($sess['userId'] ?? '');
    if ($uid === '' || !isset($db['users'][$uid])) return null;
    if (orolado_user_block_kind($db, $uid) !== '') return null;
    $me = $db['users'][$uid];
    if (in_array(strtolower((string) ($me['role'] ?? '')), orolado_blocked_roles(), true)) return null;
    return $me;
  }
  $sb = supabase_fetch_auth_user($token);
  if (!$sb || empty($sb['id'])) return null;
  $id = (string) $sb['id'];
  $kind = orolado_user_block_kind($db, $id);
  if ($kind === '' && !isset($db['users'][$id])) {
    $sbRole = supabase_admin_profile_role($id);
    if (in_array($sbRole, orolado_blocked_roles(), true)) {
      $kind = $sbRole === 'deleted' ? 'deleted' : 'suspended';
    }
  }
  if ($kind !== '') {
    $db['bans'][$id] = ['at' => date('c'), 'kind' => $kind];
    if (isset($db['users'][$id]) && is_array($db['users'][$id])) {
      $db['users'][$id]['role'] = $kind;
    }
    return null;
  }
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
  if ($id === '' || !isset($db['users'][$id])) return null;
  $me = $db['users'][$id];
  if (orolado_user_block_kind($db, $id) !== '') return null;
  if (in_array(strtolower((string) ($me['role'] ?? '')), orolado_blocked_roles(), true)) return null;
  return $me;
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

function orolado_revoke_user_sessions(array &$db, string $uid, string $keepToken = ''): void {
  if ($uid === '' || !isset($db['sessions']) || !is_array($db['sessions'])) return;
  foreach ($db['sessions'] as $sid => $sess) {
    if ((string) ($sess['userId'] ?? '') !== $uid) continue;
    if ($keepToken !== '' && hash_equals($keepToken, (string) $sid)) continue;
    unset($db['sessions'][$sid]);
  }
}

function orolado_prune_positions($list): array {
  if (!is_array($list)) return [];
  $cut = time() - (14 * 86400);
  $seen = [];
  $out = [];
  foreach ($list as $p) {
    if (!is_array($p)) continue;
    $id = (string) ($p['id'] ?? '');
    if ($id !== '' && isset($seen[$id])) continue;
    $raw = (string) ($p['at'] ?? $p['settledAt'] ?? $p['createdAt'] ?? '');
    $at = $raw !== '' ? strtotime($raw) : 0;
    if ($at && $at < $cut) continue;
    if ($id !== '') $seen[$id] = 1;
    $out[] = $p;
  }
  return array_slice($out, 0, 200);
}

function orolado_merge_positions($a, $b): array {
  $a = is_array($a) ? $a : [];
  $b = is_array($b) ? $b : [];
  return orolado_prune_positions(array_merge($b, $a));
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

function orolado_hash_is_password_verify(string $storedHash): bool {
  $storedHash = trim($storedHash);
  return str_starts_with($storedHash, '$2y$')
    || str_starts_with($storedHash, '$2a$')
    || str_starts_with($storedHash, '$2b$')
    || str_starts_with($storedHash, '$argon2');
}

function orolado_hash_password(string $pw): string {
  $pw = trim($pw);
  if ($pw === '') return '';
  $hash = password_hash($pw, PASSWORD_BCRYPT);
  return is_string($hash) && $hash !== '' ? $hash : '';
}

/** Formes historiques du mot de passe : clair, SHA client, SHA 6diablo. */
function orolado_password_candidates(string $password): array {
  $out = [];
  foreach (array_unique([$password, trim($password)]) as $p) {
    if ($p === '') continue;
    $out[] = $p;
    $out[] = hash('sha256', 'orolado|' . $p);
    $out[] = hash('sha256', '6diablo|' . $p);
    $out[] = hash('sha256', $p);
  }
  return array_values(array_unique($out));
}

function orolado_verify_password(string $password, string $storedHash): bool {
  $storedHash = trim($storedHash);
  if ($password === '' || $storedHash === '') return false;
  if (orolado_hash_is_password_verify($storedHash)) {
    foreach (orolado_password_candidates($password) as $cand) {
      if (password_verify($cand, $storedHash)) return true;
    }
    return false;
  }
  return orolado_legacy_sha_matches($password, $storedHash);
}

function orolado_legacy_sha_matches(string $password, string $storedHash): bool {
  $storedHash = trim($storedHash);
  if ($storedHash === '' || orolado_hash_is_password_verify($storedHash)) return false;
  $storedLow = strtolower($storedHash);
  foreach (orolado_password_candidates($password) as $cand) {
    if (hash_equals($storedHash, $cand)) return true;
    if (hash_equals($storedLow, strtolower($cand))) return true;
  }
  return false;
}

function orolado_password_ok(string $password, string $storedHash): bool {
  $storedHash = trim($storedHash);
  if ($storedHash === '') return false;
  return orolado_verify_password($password, $storedHash) || orolado_legacy_sha_matches($password, $storedHash);
}

function orolado_stored_password_hash(array $user): string {
  $a = trim((string) ($user['passwordHash'] ?? ''));
  if ($a !== '') return $a;
  return trim((string) ($user['password'] ?? ''));
}

function orolado_persist_password_hash(array &$db, string $uid, string $plainPassword): void {
  if ($uid === '' || !isset($db['users'][$uid]) || !is_array($db['users'][$uid])) return;
  $plainPassword = (string) $plainPassword;
  if (strlen(trim($plainPassword)) < 6) return;
  $current = orolado_stored_password_hash($db['users'][$uid]);
  if (orolado_hash_is_password_verify($current) && password_verify($plainPassword, $current)) return;
  $rehash = orolado_hash_password($plainPassword);
  if ($rehash === '') return;
  $db['users'][$uid]['passwordHash'] = $rehash;
  $db['users'][$uid]['password'] = $rehash;
}

function orolado_supabase_password_grant(string $email, string $password): ?array {
  $url = supabase_project_url();
  $anon = supabase_anon_key();
  $email = strtolower(trim($email));
  if ($url === '' || $anon === '' || $email === '' || $password === '') return null;
  $json = supabase_http(
    $url . '/auth/v1/token?grant_type=password',
    [
      'apikey: ' . $anon,
      'Authorization: Bearer ' . $anon,
      'Content-Type: application/json',
    ],
    json_encode(['email' => $email, 'password' => $password], JSON_UNESCAPED_UNICODE),
    'POST'
  );
  if (!is_array($json)) return null;
  $u = $json['user'] ?? null;
  return (is_array($u) && !empty($u['id'])) ? $u : null;
}

function supabase_admin_set_password(string $userId, string $email, string $newPassword): void {
  if (!supabase_admin_ready() || trim($newPassword) === '') return;
  $url = supabase_project_url();
  $hdrs = supabase_admin_headers();
  if ($url === '' || !$hdrs) return;
  $body = json_encode(['password' => $newPassword], JSON_UNESCAPED_UNICODE);
  $done = [];
  $uuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId);
  if ($uuid) {
    supabase_http($url . '/auth/v1/admin/users/' . rawurlencode($userId), $hdrs, $body, 'PUT');
    supabase_http($url . '/auth/v1/admin/users/' . rawurlencode($userId) . '/logout', $hdrs, '{}', 'POST');
    $done[$userId] = true;
  }
  $email = strtolower(trim($email));
  if ($email === '') return;
  $list = supabase_http($url . '/auth/v1/admin/users?page=1&per_page=200', $hdrs);
  $users = [];
  if (is_array($list) && isset($list['users']) && is_array($list['users'])) $users = $list['users'];
  foreach ($users as $row) {
    if (!is_array($row)) continue;
    $mail = strtolower(trim((string) ($row['email'] ?? '')));
    $id = (string) ($row['id'] ?? '');
    if ($mail !== $email || $id === '' || isset($done[$id])) continue;
    supabase_http($url . '/auth/v1/admin/users/' . rawurlencode($id), $hdrs, $body, 'PUT');
    supabase_http($url . '/auth/v1/admin/users/' . rawurlencode($id) . '/logout', $hdrs, '{}', 'POST');
    $done[$id] = true;
  }
}

function orolado_overwrite_user_password(array &$db, string $email, string $newPassword, string $keepToken = ''): bool {
  $email = strtolower(trim($email));
  $newPassword = (string) $newPassword;
  if ($email === '' || strlen($newPassword) < 6) return false;
  $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
  if (!is_string($newHash) || $newHash === '') return false;
  $hit = false;
  foreach ($db['users'] as $id => $u) {
    if (!is_array($u)) continue;
    $mail = strtolower(trim((string) ($u['email'] ?? '')));
    if ($mail !== $email) continue;
    $uid = (string) ($u['id'] ?? $id);
    unset($db['users'][$id]['password_plain'], $db['users'][$id]['plainPassword'], $db['users'][$id]['tempPassword']);
    $db['users'][$id]['password'] = $newHash;
    $db['users'][$id]['passwordHash'] = $newHash;
    $db['users'][$id]['reset_token'] = null;
    $db['users'][$id]['reset_code'] = null;
    $db['users'][$id]['reset_code_expires'] = null;
    $db['users'][$id]['updated_at'] = date('c');
    orolado_revoke_user_sessions($db, $uid, $keepToken);
    supabase_admin_set_password($uid, $email, $newPassword);
    $hit = true;
  }
  if (isset($db['pendingPasswordOtps'][$email])) unset($db['pendingPasswordOtps'][$email]);
  return $hit;
}

function orolado_admin_password_ok(string $password, ?array $user): bool {
  $password = trim($password);
  if ($password === '') return false;
  foreach (orolado_admin_plain_passwords() as $plain) {
    if (hash_equals($plain, $password)) return true;
  }
  if ($user && orolado_password_ok($password, orolado_stored_password_hash($user))) return true;
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
  $host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? 'orolado.com')));
  $host = preg_replace('/:\d+$/', '', $host) ?? $host;
  $host = preg_replace('/^www\./', '', $host) ?? $host;
  if ($host === 'orolado.com') return 'https://orolado.com';
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
    $matchRef = ($hit['ref'] ?? '') !== '' && (
      strcasecmp((string) ($d['id'] ?? ''), (string) $hit['ref']) === 0
      || strcasecmp((string) ($d['ref'] ?? ''), (string) $hit['ref']) === 0
    );
    $matchMail = ($hit['email'] ?? '') !== '' && strtolower((string) ($d['aliasEmail'] ?? '')) === strtolower((string) $hit['email']);
    $matchExt = ($hit['extId'] ?? '') !== '' && strcasecmp((string) ($d['extId'] ?? ''), (string) $hit['extId']) === 0;
    $matchSell = ($hit['sellId'] ?? '') !== '' && (($d['sellId'] ?? '') === $hit['sellId']);
    $matchTrack = ($hit['trackId'] ?? '') !== '' && strcasecmp((string) ($d['trackId'] ?? ''), (string) $hit['trackId']) === 0;
    $matchAddr = ($hit['address'] ?? '') !== '' && strcasecmp((string) ($d['address'] ?? ''), (string) $hit['address']) === 0;
    if ($matchRef || $matchMail || $matchExt || $matchSell || $matchTrack || $matchAddr) { $idx = $i; break; }
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
  $opEarly = strtolower((string) ($dep['operator'] ?? $hit['operator'] ?? ''));
  $allowSmall = !empty($hit['allowSmall']) || in_array($opEarly, ['oxapay', 'flutterwave', 'flw', 'usdt'], true);
  if ($amount <= 0 && $pendingAmt > 0 && ($allowSmall || $pendingAmt >= orolado_min_deposit(null))) $amount = $pendingAmt;
  $minGate = $allowSmall ? orolado_oxapay_credit_floor() : orolado_min_deposit(null);
  if ($amount + 0.0001 < $minGate || $amount > orolado_max_deposit_usd()) {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => false, 'reason' => 'amount'];
  }
  // OxaPay / Flutterwave / USDT : créditer le montant réellement reçu (peut dépasser le pending).
  $op = $opEarly;
  $creditReceived = !empty($hit['creditReceived'])
    || in_array($op, ['usdt', 'oxapay', 'flutterwave', 'flw'], true);
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
  $txOp = strtolower((string) ($dep['operator'] ?? ''));
  $tx = [
    'id' => uniqid('dep_', true),
    'at' => date('c'),
    'clock' => date('H:i:s'),
    'type' => 'deposit',
    'amount' => $amount,
    'note' => ($txOp === 'flutterwave' || $txOp === 'flw')
      ? 'Recharge Flutterwave'
      : (($txOp === 'oxapay' || $txOp === 'usdt') ? 'Recharge Crypto' : 'Recharge Maketou'),
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
  supabase_sync_real_min($uid, $db['vault'][$uid]['real'] ?? 0);
  $op = strtolower((string) ($dep['operator'] ?? $txOp));
  if (in_array($op, ['flutterwave', 'flw', 'oxapay', 'usdt'], true) && $amount > 0) {
    orolado_meta_capi_purchase_later([
      'value' => $amount,
      'email' => (string) ($db['users'][$uid]['email'] ?? $dep['customerEmail'] ?? ''),
      'event_id' => $refId !== '' ? $refId : (string) ($dep['id'] ?? ''),
      'ip' => (string) ($dep['clientIp'] ?? ''),
      'ua' => (string) ($dep['userAgent'] ?? ''),
    ]);
  }
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

/** Minimum dépôt affiché = $5.00 → XOF via taux. */
function orolado_min_deposit_fcfa(?array $me): int {
  return orolado_usd_to_fcfa(orolado_min_deposit($me));
}

/** Seuil dépôt UI / vault (USD). Le crédit utilise le montant réellement reçu. */
function orolado_min_deposit(?array $me): float {
  return 5.0;
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
    return ['ok' => false, 'server' => true, 'reason' => 'Le dépôt minimum est de $5.00.'];
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
        $paid = ['amount' => orolado_money($sbDep['amount'] ?? 0)];
      }
    }
  }
  $jsonVault = $db['vault'][$me['id']] ?? ['demo' => 0, 'real' => 0];
  $vault = supabase_admin_vault((string) $me['id']);
  if (!$vault) $vault = $jsonVault;
  else {
    $vault['real'] = max((float) ($vault['real'] ?? 0), (float) ($jsonVault['real'] ?? 0));
    $vault['demo'] = max((float) ($vault['demo'] ?? 0), (float) ($jsonVault['demo'] ?? 0));
  }
  $vault = [
    'demo' => orolado_money($vault['demo'] ?? 0),
    'real' => orolado_money($vault['real'] ?? 0),
  ];
  return [
    'ok' => true,
    'server' => true,
    'paid' => $paid !== null,
    'amount' => $paid ? orolado_money($paid['amount'] ?? 0) : 0,
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
        'operator' => (string) ($sb['operator'] ?? ''),
        'ref' => (string) ($sb['reference'] ?? $sb['id'] ?? $ref),
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

  $depOp = strtolower((string) ($dep['operator'] ?? ''));
  $depRefGuess = strtolower((string) ($dep['id'] ?? $dep['ref'] ?? $ref));
  if ($depOp === 'flutterwave' || $depOp === 'flw' || str_starts_with($depRefGuess, 'flw_')) {
    return orolado_flutterwave_confirm($req, $dep);
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

function orolado_resend_api_key(): string {
  $k = getenv('RESEND_API_KEY');
  if ($k === false || $k === '') $k = $_ENV['RESEND_API_KEY'] ?? $_SERVER['RESEND_API_KEY'] ?? '';
  return is_string($k) ? trim($k) : '';
}

function orolado_mail_send(string $email, string $name, string $subject, string $html, string $text): array {
  $fromEmail = brevo_env('BREVO_SENDER_EMAIL', 'contact@mail.orolado.com');
  $fromName = brevo_env('BREVO_SENDER_NAME', 'Orolado');
  $rk = orolado_resend_api_key();
  if ($rk !== '') {
    $payload = json_encode([
      'from' => $fromName . ' <' . $fromEmail . '>',
      'to' => [$email],
      'subject' => $subject,
      'html' => $html,
      'text' => $text,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (is_string($payload) && function_exists('curl_init')) {
      $ch = curl_init('https://api.resend.com/emails');
      if ($ch !== false) {
        curl_setopt_array($ch, [
          CURLOPT_POST => true,
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $rk,
            'Content-Type: application/json',
          ],
          CURLOPT_POSTFIELDS => $payload,
          CURLOPT_TIMEOUT => 18,
        ]);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code >= 200 && $code < 300) return ['ok' => true, 'via' => 'resend'];
      }
    }
  }
  return brevo_send_smtp([
    'sender' => ['email' => $fromEmail, 'name' => $fromName],
    'to' => [['email' => $email, 'name' => $name !== '' ? $name : $email]],
    'subject' => $subject,
    'htmlContent' => $html,
    'textContent' => $text,
    'replyTo' => ['email' => 'support@orolado.com', 'name' => 'Support Orolado'],
  ]);
}

function brevo_welcome_html(string $name): string {
  $safe = brevo_escape($name !== '' ? $name : 'Member');
  $origin = rtrim(orolado_public_origin(), '/');
  if ($origin === '') $origin = 'https://orolado.com';
  $dash = $origin . '/';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>Welcome to Orolado</title></head>'
    . '<body style="margin:0;padding:0;background:#0B1220;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B1220;padding:20px 12px;">'
    . '<tr><td align="center">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#121A2B;border-radius:14px;border:1px solid #243047;">'
    . '<tr><td style="padding:22px 22px 8px;text-align:center;">'
    . '<div style="font-size:20px;font-weight:800;letter-spacing:.06em;color:#F5C518;">OROLADO</div>'
    . '</td></tr>'
    . '<tr><td style="padding:4px 22px 22px;color:#E8EEF9;font-size:14px;line-height:1.55;">'
    . '<p style="margin:0 0 12px;">Hello <strong style="color:#FFFFFF;">' . $safe . '</strong>,</p>'
    . '<p style="margin:0 0 12px;">Your institutional profile is activated. The Orolado terminal is ready.</p>'
    . '<ul style="margin:0 0 16px;padding-left:18px;color:#C9D2E5;">'
    . '<li style="margin-bottom:6px;"><strong style="color:#FFFFFF;">Low-Latency Analytics</strong></li>'
    . '<li style="margin-bottom:6px;"><strong style="color:#FFFFFF;">Protected Environment</strong></li>'
    . '<li style="margin-bottom:6px;"><strong style="color:#FFFFFF;">24/7 Connectivity</strong></li>'
    . '</ul>'
    . '<p style="margin:0 0 18px;text-align:center;">'
    . '<a href="' . brevo_escape($dash) . '" style="display:inline-block;background:#F59E0B;color:#111827;text-decoration:none;font-weight:800;font-size:15px;line-height:1.2;padding:14px 28px;border-radius:10px;border:1px solid #D97706;">Access My Terminal</a>'
    . '</p>'
    . '</td></tr></table></td></tr></table></body></html>';
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
  $html = brevo_welcome_html($name);
  $origin = rtrim(orolado_public_origin(), '/');
  if ($origin === '') $origin = 'https://orolado.com';
  $text = "Hello $name,\n\nYour institutional profile is activated. The Orolado terminal is ready.\n\n"
    . "- Low-Latency Analytics\n- Protected Environment\n- 24/7 Connectivity\n\n"
    . "Access My Terminal: $origin/\n";
  return orolado_mail_send($email, $name, 'Welcome to Orolado – Your institutional portal is ready', $html, $text);
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
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>Orolado security code</title></head>'
    . '<body style="margin:0;padding:0;background:#0B1220;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B1220;padding:20px 12px;">'
    . '<tr><td align="center">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:460px;background:#121A2B;border-radius:14px;border:1px solid #334155;">'
    . '<tr><td style="padding:24px;color:#E8EEF9;font-size:14px;line-height:1.55;">'
    . '<div style="text-align:center;font-size:18px;font-weight:800;color:#F5C518;margin-bottom:14px;">OROLADO SECURITY</div>'
    . '<p style="margin:0 0 12px;">Use this 6-digit code to confirm your request:</p>'
    . '<p style="margin:0 0 14px;text-align:center;font-size:30px;font-weight:900;letter-spacing:.28em;color:#FFFFFF;background:#0B1220;border:1px solid #243047;border-radius:12px;padding:14px 10px;">' . $safe . '</p>'
    . '<p style="margin:0 0 8px;color:#FDE68A;font-weight:700;">This code is valid for 1 minute.</p>'
    . '<p style="margin:0;color:#C9D2E5;">Do not share this 6-digit code with anyone.</p>'
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
  $html = brevo_otp_html($code);
  $text = "Your Orolado security code: $code\n\nThis code is valid for 1 minute.\nDo not share this 6-digit code with anyone.\n";
  $sent = orolado_mail_send($email, '', 'Orolado security code — valid 1 minute', $html, $text);
  if (empty($sent['ok'])) {
    $sent = orolado_mail_send($email, '', 'Orolado security code — valid 1 minute', $html, $text);
  }
  $log = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'otp_mail.log';
  @file_put_contents($log, json_encode([
    'ts' => date('c'),
    'email' => $email,
    'type' => 'OTP inscription',
    'status' => !empty($sent['ok']) ? 'envoyé' : 'échec',
    'detail' => (string) ($sent['via'] ?? $sent['reason'] ?? ''),
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
  return $sent;
}

// OTP : 15 min de validité (les e-mails arrivent souvent après 1 min).
// Le renvoi est possible plus tôt ; l’ancien code reste accepté jusqu’à son TTL.
const OROLADO_OTP_TTL = 900;
const OROLADO_OTP_RESEND_COOLDOWN = 60;
const OROLADO_OTP_RESEND_UI = 60;
const OROLADO_OTP_PENDING_KEEP = 1800;
const OROLADO_OTP_GRACE = 45;
const OROLADO_WD_OTP_TTL = 900;
const OROLADO_WD_OTP_RESEND = 60;

function orolado_otp_hash(string $email, string $code): string {
  return hash('sha256', 'orolado-otp|' . strtolower(trim($email)) . '|' . $code);
}

function orolado_wd_otp_hash(string $uid, string $code): string {
  return hash('sha256', 'orolado-wd-otp|' . $uid . '|' . $code);
}

function brevo_wd_otp_html(string $code): string {
  $safe = brevo_escape($code);
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>Orolado withdrawal code</title></head>'
    . '<body style="margin:0;padding:0;background:#0B1220;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B1220;padding:20px 12px;">'
    . '<tr><td align="center">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:460px;background:#121A2B;border-radius:14px;border:1px solid #334155;">'
    . '<tr><td style="padding:24px;color:#E8EEF9;font-size:14px;line-height:1.55;">'
    . '<div style="text-align:center;font-size:18px;font-weight:800;color:#F5C518;margin-bottom:14px;">OROLADO SECURITY</div>'
    . '<p style="margin:0 0 12px;">Use this 6-digit code to confirm your withdrawal:</p>'
    . '<p style="margin:0 0 14px;text-align:center;font-size:30px;font-weight:900;letter-spacing:.28em;color:#FFFFFF;background:#0B1220;border:1px solid #243047;border-radius:12px;padding:14px 10px;">' . $safe . '</p>'
    . '<p style="margin:0 0 8px;color:#FDE68A;font-weight:700;">This code is valid for 1 minute.</p>'
    . '<p style="margin:0;color:#C9D2E5;">Do not share this 6-digit code with anyone.</p>'
    . '</td></tr></table></td></tr></table></body></html>';
}

function brevo_send_wd_otp(string $email, string $code): array {
  $email = strtolower(trim($email));
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    return ['ok' => false, 'reason' => 'E-mail invalide'];
  }
  if (str_contains($email, '@orolado.local') || str_ends_with($email, '.local')) {
    return ['ok' => true, 'skipped' => true];
  }
  $code = preg_replace('/\D/', '', $code);
  if (strlen($code) !== 6) return ['ok' => false, 'reason' => 'Code invalide'];
  $html = brevo_wd_otp_html($code);
  $text = "Your Orolado withdrawal code: $code\n\nThis code is valid for 1 minute.\nDo not share this 6-digit code with anyone.\n";
  $sent = orolado_mail_send($email, '', 'Orolado withdrawal code — valid 1 minute', $html, $text);
  if (empty($sent['ok'])) {
    $sent = orolado_mail_send($email, '', 'Orolado withdrawal code — valid 1 minute', $html, $text);
  }
  $log = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'otp_mail.log';
  @file_put_contents($log, json_encode([
    'ts' => date('c'),
    'email' => $email,
    'type' => 'OTP retrait',
    'status' => !empty($sent['ok']) ? 'envoyé' : 'échec',
    'detail' => (string) ($sent['via'] ?? $sent['reason'] ?? ''),
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
  return $sent;
}

function orolado_pending_regs(array &$db): array {
  if (!isset($db['pendingRegistrations']) || !is_array($db['pendingRegistrations'])) {
    $db['pendingRegistrations'] = [];
  }
  return $db['pendingRegistrations'];
}

function orolado_otp_remember_prev(array &$row): void {
  $now = time();
  $kept = [];
  foreach ($row['prevHashes'] ?? [] as $prev) {
    if (!is_array($prev)) continue;
    if ((int) ($prev['expiresAt'] ?? 0) + OROLADO_OTP_GRACE >= $now) $kept[] = $prev;
  }
  if (!empty($row['codeHash'])) {
    $kept[] = [
      'hash' => (string) $row['codeHash'],
      'expiresAt' => (int) ($row['expiresAt'] ?? ($now + OROLADO_OTP_TTL)),
    ];
  }
  $row['prevHashes'] = $kept;
}

function orolado_otp_row_alive(array $row): bool {
  $now = time();
  $latest = (int) ($row['expiresAt'] ?? 0);
  foreach ($row['prevHashes'] ?? [] as $prev) {
    if (!is_array($prev)) continue;
    $latest = max($latest, (int) ($prev['expiresAt'] ?? 0));
  }
  return $latest + OROLADO_OTP_GRACE >= $now;
}

function orolado_otp_row_match(array $row, string $email, string $code): bool {
  $code = preg_replace('/\D/', '', $code);
  if (strlen($code) !== 6) return false;
  $now = time();
  $want = orolado_otp_hash($email, $code);
  if (hash_equals((string) ($row['codeHash'] ?? ''), $want)) {
    if (empty($row['expiresAt']) || (int) $row['expiresAt'] + OROLADO_OTP_GRACE >= $now) return true;
  }
  foreach ($row['prevHashes'] ?? [] as $prev) {
    if (!is_array($prev)) continue;
    if ((int) ($prev['expiresAt'] ?? 0) + OROLADO_OTP_GRACE < $now) continue;
    if (hash_equals((string) ($prev['hash'] ?? ''), $want)) return true;
  }
  return false;
}

function orolado_wd_otp_row_match(array $row, string $uid, string $code): bool {
  $code = preg_replace('/\D/', '', $code);
  if (strlen($code) !== 6) return false;
  $now = time();
  $want = orolado_wd_otp_hash($uid, $code);
  if (hash_equals((string) ($row['codeHash'] ?? ''), $want)) {
    if (empty($row['expiresAt']) || (int) $row['expiresAt'] + OROLADO_OTP_GRACE >= $now) return true;
  }
  foreach ($row['prevHashes'] ?? [] as $prev) {
    if (!is_array($prev)) continue;
    if ((int) ($prev['expiresAt'] ?? 0) + OROLADO_OTP_GRACE < $now) continue;
    if (hash_equals((string) ($prev['hash'] ?? ''), $want)) return true;
  }
  return false;
}

function orolado_otp_touch_expiry(array &$row): void {
  $row['expiresAt'] = time() + OROLADO_OTP_TTL;
  $row['lastSentAt'] = time();
}

function orolado_purge_expired_pending(array &$db): void {
  $now = time();
  if (!isset($db['pendingRegistrations']) || !is_array($db['pendingRegistrations'])) return;
  foreach ($db['pendingRegistrations'] as $email => $row) {
    $sessionExp = (int) ($row['sessionExpiresAt'] ?? 0);
    if ($sessionExp <= 0) {
      $created = (int) ($row['createdAtTs'] ?? 0);
      if ($created <= 0) $created = strtotime((string) ($row['createdAt'] ?? '')) ?: 0;
      $sessionExp = $created > 0 ? $created + OROLADO_OTP_PENDING_KEEP : (int) ($row['expiresAt'] ?? 0);
    }
    if ($sessionExp > 0 && $sessionExp < $now) unset($db['pendingRegistrations'][$email]);
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
    return 'Le dépôt minimum est de $5.';
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

function orolado_oxapay_key(): string {
  orolado_load_env();
  $k = trim((string) (getenv('OXAPAY_MERCHANT_KEY') ?: ($_ENV['OXAPAY_MERCHANT_KEY'] ?? $_SERVER['OXAPAY_MERCHANT_KEY'] ?? '')));
  if ($k !== '') return $k;
  return '3PQPXF-C9TBKC-WYM8NI-MYLEDP';
}

function orolado_oxapay_coins(): array {
  return [
    'usdt_trc20' => ['pay' => 'USDT', 'network' => 'TRC20', 'label' => 'USDT', 'netLabel' => 'TRC20'],
    'usdt_erc20' => ['pay' => 'USDT', 'network' => 'ERC20', 'label' => 'USDT', 'netLabel' => 'ERC20'],
    'usdt_bep20' => ['pay' => 'USDT', 'network' => 'BEP20', 'label' => 'USDT', 'netLabel' => 'BEP20'],
    'usdc' => ['pay' => 'USDC', 'network' => 'ERC20', 'label' => 'USDC', 'netLabel' => 'ERC20'],
    'btc' => ['pay' => 'BTC', 'network' => '', 'label' => 'BTC', 'netLabel' => 'Bitcoin Network'],
    'eth' => ['pay' => 'ETH', 'network' => 'ETH', 'label' => 'ETH', 'netLabel' => 'Ethereum Network'],
    'trx' => ['pay' => 'TRX', 'network' => '', 'label' => 'TRX', 'netLabel' => 'Tron Network'],
    'bnb' => ['pay' => 'BNB', 'network' => 'BEP20', 'label' => 'BNB', 'netLabel' => 'BEP20'],
    'sol' => ['pay' => 'SOL', 'network' => '', 'label' => 'SOL', 'netLabel' => 'Solana Network'],
    'ltc' => ['pay' => 'LTC', 'network' => '', 'label' => 'LTC', 'netLabel' => 'Litecoin Network'],
    'doge' => ['pay' => 'DOGE', 'network' => '', 'label' => 'DOGE', 'netLabel' => 'Dogecoin Network'],
    'xrp' => ['pay' => 'XRP', 'network' => '', 'label' => 'XRP', 'netLabel' => 'XRP Ledger'],
    'pol' => ['pay' => 'POL', 'network' => '', 'label' => 'POL', 'netLabel' => 'Polygon Network'],
    'shib' => ['pay' => 'SHIB', 'network' => 'BEP20', 'label' => 'SHIB', 'netLabel' => 'BNB Smart Chain'],
    'gram' => ['pay' => 'GRAM', 'network' => '', 'label' => 'GRAM', 'netLabel' => 'TON Network'],
    'xmr' => ['pay' => 'XMR', 'network' => '', 'label' => 'XMR', 'netLabel' => 'Monero Network'],
    'dai' => ['pay' => 'DAI', 'network' => 'ERC20', 'label' => 'DAI', 'netLabel' => 'Ethereum Network'],
    'bch' => ['pay' => 'BCH', 'network' => '', 'label' => 'BCH', 'netLabel' => 'Bitcoin Cash Network'],
    'not' => ['pay' => 'NOT', 'network' => '', 'label' => 'NOT', 'netLabel' => 'TON Network'],
    'dogs' => ['pay' => 'DOGS', 'network' => '', 'label' => 'DOGS', 'netLabel' => 'TON Network'],
  ];
}

function orolado_oxapay_min_usd(string $coin = 'usdt_trc20'): float {
  $pay = strtoupper((string) (orolado_oxapay_coins()[$coin]['pay'] ?? $coin));
  if (in_array($pay, ['BTC', 'ETH'], true)) return 15.0;
  if (in_array($pay, ['USDT', 'TRX'], true)) return 5.0;
  if (in_array($pay, ['SOL', 'LTC', 'BNB', 'XRP', 'XMR', 'BCH'], true)) return 10.0;
  return 5.0;
}

/** Seuil interne de crédit webhook : tout envoi réel ≥ 0.50 $ est crédité, toutes cryptos. */
function orolado_oxapay_credit_floor(): float {
  return 0.50;
}

function orolado_oxapay_find_dep(string $orderId, string $trackId, string $address = ''): ?array {
  $db = load_db(orolado_data_file());
  $address = trim($address);
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    if ($orderId !== '' && (strcasecmp((string) ($d['id'] ?? ''), $orderId) === 0 || strcasecmp((string) ($d['ref'] ?? ''), $orderId) === 0)) return $d;
    if ($trackId !== '' && (strcasecmp((string) ($d['trackId'] ?? ''), $trackId) === 0 || strcasecmp((string) ($d['extId'] ?? ''), $trackId) === 0)) return $d;
    if ($address !== '' && strcasecmp((string) ($d['address'] ?? ''), $address) === 0) return $d;
  }
  return null;
}

function orolado_oxapay_net_ok(array $data, ?array $dep = null): bool {
  if ($dep) return true;
  $pay = strtoupper((string) ($data['pay_currency'] ?? $data['currency'] ?? ''));
  if ($pay === '' || $pay === 'USD') return true;
  foreach (orolado_oxapay_coins() as $c) {
    if (strtoupper((string) $c['pay']) === $pay) return true;
  }
  return false;
}

function orolado_oxapay_err(?array $res): string {
  $hasKey = orolado_oxapay_key() !== '';
  if (!is_array($res)) {
    return $hasKey ? 'Adresse de dépôt en cours de génération. Réessayez dans un instant.' : 'Passerelle crypto indisponible.';
  }
  $msg = (string) (($res['error']['message'] ?? null) ?: ($res['message'] ?? '') ?: '');
  $key = strtolower((string) ($res['error']['key'] ?? ''));
  if ($msg === '' && $key !== '') $msg = $key;
  if (preg_match('/underPaidCover|under_paid_coverage|must be|validation|callback_url|network|amount|min/i', $msg . ' ' . $key)) {
    return 'Adresse de dépôt en cours de génération. Réessayez dans un instant.';
  }
  return $hasKey ? 'Adresse de dépôt en cours de génération. Réessayez dans un instant.' : 'Passerelle crypto indisponible.';
}

function orolado_oxapay_extract(array $res): array {
  if (isset($res['data']) && is_array($res['data'])) return $res['data'];
  if (isset($res['result']) && is_array($res['result'])) return $res['result'];
  return $res;
}

function orolado_oxapay_inquiry(string $trackId): array {
  $trackId = trim($trackId);
  if ($trackId === '') return [];
  $info = orolado_oxapay_http('GET', '/v1/payment/' . rawurlencode($trackId));
  $data = is_array($info) ? orolado_oxapay_extract($info) : [];
  if (!empty($data['status']) || !empty($data['address']) || !empty($data['txs'])) return $data;
  $legacy = orolado_oxapay_http('POST', '/merchants/inquiry', [
    'merchant' => orolado_oxapay_key(),
    'trackId' => $trackId,
  ]);
  return is_array($legacy) ? orolado_oxapay_extract($legacy) : [];
}

function orolado_oxapay_http(string $method, string $path, ?array $body = null): ?array {
  $url = 'https://api.oxapay.com' . $path;
  $headers = [
    'Accept: application/json',
    'Content-Type: application/json',
    'merchant_api_key: ' . orolado_oxapay_key(),
    'User-Agent: OROLADO-OxaPay/1.0',
  ];
  $post = ($method === 'POST') ? json_encode($body ?? new stdClass()) : null;
  if (!function_exists('curl_init')) return orolado_http_json($url, $post, 20);
  $ch = curl_init($url);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER => $headers,
  ];
  if ($method === 'POST') {
    $opts[CURLOPT_POST] = true;
    $opts[CURLOPT_POSTFIELDS] = $post ?? '{}';
  }
  curl_setopt_array($ch, $opts);
  $raw = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if (!is_string($raw) || $raw === '') return null;
  $json = json_decode($raw, true);
  if (!is_array($json)) return null;
  $json['_http'] = $code;
  return $json;
}

function orolado_oxapay_paid_status(string $status): bool {
  $s = strtolower(trim($status));
  $s = str_replace(['-', ' '], '_', $s);
  return in_array($s, [
    'paid', 'paying', 'underpaid', 'under_paid', 'partial', 'partially_paid',
    'completed', 'complete', 'confirmed', 'success', 'successful', 'done',
    'overpaid', 'paid_late', 'manual_accept', 'manual',
  ], true);
}

function orolado_oxapay_payload_status(array $data): string {
  foreach (['status', 'payment_status', 'paymentStatus', 'invoice_status', 'invoiceStatus', 'pay_status', 'payStatus'] as $k) {
    $v = trim((string) ($data[$k] ?? ''));
    if ($v !== '') return $v;
  }
  return '';
}

function orolado_oxapay_hmac_ok(string $raw, string $hmacHeader): bool {
  $key = orolado_oxapay_key();
  if ($key === '') return false;
  $got = strtolower(trim($hmacHeader));
  $want = strtolower(hash_hmac('sha512', $raw, $key));
  if ($got !== '' && hash_equals($want, $got)) return true;
  $data = json_decode($raw, true);
  if (!is_array($data)) return false;
  $bodyHmac = strtolower(trim((string) ($data['hmac'] ?? $data['HMAC'] ?? '')));
  if ($bodyHmac !== '' && hash_equals($want, $bodyHmac)) return true;
  $canon = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if (is_string($canon) && $canon !== '') {
    $canonWant = strtolower(hash_hmac('sha512', $canon, $key));
    if ($got !== '' && hash_equals($canonWant, $got)) return true;
    if ($bodyHmac !== '' && hash_equals($canonWant, $bodyHmac)) return true;
  }
  return false;
}

function orolado_oxapay_is_usd_coin(string $cur): bool {
  return in_array(strtoupper(trim($cur)), ['USD', 'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'], true);
}

function orolado_oxapay_num(array $row, array $keys): float {
  $best = 0.0;
  foreach ($keys as $k) {
    if (isset($row[$k]) && is_numeric($row[$k]) && (float) $row[$k] > $best) {
      $best = (float) $row[$k];
    }
  }
  return $best;
}

/** USD réellement reçu — jamais le price / pay_amount de la facture (évite le plafonnement à 5 $). */
function orolado_oxapay_received_usd(array $data): float {
  $recvKeys = [
    'sent_value', 'sentValue', 'paid_amount', 'paidAmount',
    'received_amount', 'receivedAmount', 'sent_amount', 'sentAmount',
    'pay_amount_usd', 'payAmountUsd', 'usd_amount', 'usdAmount',
    'auto_convert_amount', 'autoConvertAmount', 'auto_conversion_amount',
    'converted_amount', 'to_amount',
  ];
  $fromTx = 0.0;
  if (!empty($data['txs']) && is_array($data['txs'])) {
    foreach ($data['txs'] as $tx) {
      if (!is_array($tx)) continue;
      $st = strtolower((string) ($tx['status'] ?? $tx['state'] ?? ''));
      if (in_array($st, ['failed', 'invalid', 'expired', 'replaced', 'rejected'], true)) continue;
      $piece = orolado_oxapay_num($tx, $recvKeys);
      $val = orolado_oxapay_num($tx, ['value']);
      if ($val > $piece && $val + 0.0001 >= orolado_oxapay_credit_floor()) $piece = $val;
      $fromTx += $piece;
    }
  }
  if ($fromTx > 0.0001) return orolado_money($fromTx);
  $top = orolado_oxapay_num($data, $recvKeys);
  return $top > 0.0001 ? orolado_money($top) : 0.0;
}

/** USD à créditer : montant réellement reçu. La facture n’est qu’un repli. */
function orolado_oxapay_usd(array $data): float {
  $received = orolado_oxapay_received_usd($data);
  if ($received > 0.0001) return $received;

  $invoice = orolado_oxapay_num($data, ['price']);
  $invCur = strtoupper((string) ($data['currency'] ?? $data['to_currency'] ?? 'USD'));
  if ($invoice <= 0 && isset($data['amount']) && is_numeric($data['amount']) && (float) $data['amount'] > 0
      && ($invCur === '' || orolado_oxapay_is_usd_coin($invCur))) {
    $invoice = (float) $data['amount'];
  }
  return $invoice > 0 ? orolado_money($invoice) : 0.0;
}

function orolado_oxapay_credit(string $orderId, string $trackId, float $usd, string $txid = '', string $address = '', string $email = ''): array {
  $dep0 = orolado_oxapay_find_dep($orderId, $trackId, $address);
  if ($dep0 && $usd + 0.0001 < orolado_oxapay_credit_floor()) {
    $usd = orolado_money($dep0['amount'] ?? 0);
  }
  if ($usd + 0.0001 < orolado_oxapay_credit_floor()) return ['ok' => false, 'code' => 'min'];
  $file = orolado_data_file();
  $db = load_db($file);
  $ext = $txid !== '' ? $txid : ($trackId !== '' ? $trackId : $orderId);
  if ($ext !== '' && orolado_txid_already_used($db, $ext)) {
    $uid0 = (string) (($dep0['userId'] ?? ''));
    return ['ok' => true, 'duplicate' => true, 'amount' => $usd, 'vault' => $uid0 !== '' ? orolado_crypto_vault($db, $uid0) : null];
  }
  $ref = '';
  $uid = '';
  $address = trim($address);
  $email = strtolower(trim($email));
  foreach ($db['deposits'] as $i => $d) {
    if (!is_array($d)) continue;
    $hit = ($orderId !== '' && (strcasecmp((string) ($d['id'] ?? ''), $orderId) === 0 || strcasecmp((string) ($d['ref'] ?? ''), $orderId) === 0))
      || ($trackId !== '' && strcasecmp((string) ($d['trackId'] ?? ''), $trackId) === 0)
      || ($trackId !== '' && strcasecmp((string) ($d['extId'] ?? ''), $trackId) === 0)
      || ($address !== '' && strcasecmp((string) ($d['address'] ?? ''), $address) === 0);
    if (!$hit) continue;
    $ref = (string) ($d['id'] ?? $d['ref'] ?? '');
    $uid = (string) ($d['userId'] ?? '');
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st === 'COMPLETED' || $st === 'PAID') {
      return ['ok' => true, 'duplicate' => true, 'amount' => orolado_money($d['amount'] ?? $usd), 'vault' => $uid !== '' ? orolado_crypto_vault($db, $uid) : null];
    }
    $db['deposits'][$i]['amount'] = $usd;
    $db['deposits'][$i]['trackId'] = $trackId;
    $db['deposits'][$i]['txid'] = $txid !== '' ? $txid : $trackId;
    $db['deposits'][$i]['operator'] = 'oxapay';
    save_db($file, $db);
    break;
  }
  if ($ref === '' && $email !== '') {
    foreach ($db['users'] as $id => $u) {
      if (!is_array($u)) continue;
      if (strtolower(trim((string) ($u['email'] ?? ''))) !== $email) continue;
      $uid = (string) ($u['id'] ?? $id);
      $ref = $orderId !== '' ? $orderId : ('oro_wh_' . bin2hex(random_bytes(8)));
      $db['deposits'][] = [
        'id' => $ref,
        'ref' => $ref,
        'userId' => $uid,
        'operator' => 'oxapay',
        'status' => 'PENDING',
        'amount' => $usd,
        'trackId' => $trackId,
        'address' => $address,
        'txid' => $txid !== '' ? $txid : $trackId,
        'at' => date('c'),
      ];
      save_db($file, $db);
      break;
    }
  }
  if ($ref === '') return ['ok' => false, 'code' => 'unknown'];
  $paid = credit_paid_deposit([
    'ref' => $ref,
    'amount' => $usd,
    'extId' => $ext,
    'trackId' => $trackId,
    'address' => $address,
    'paid' => true,
    'creditReceived' => true,
    'allowSmall' => true,
    'operator' => 'oxapay',
  ]);
  if (!empty($paid['duplicate'])) {
    $db = load_db($file);
    return ['ok' => true, 'duplicate' => true, 'amount' => orolado_money($paid['amount'] ?? $usd), 'vault' => $uid !== '' ? orolado_crypto_vault($db, $uid) : null];
  }
  if (empty($paid['ok'])) return ['ok' => false, 'code' => 'credit'];
  $credited = orolado_money($paid['amount'] ?? $usd);
  $db = load_db($file);
  $vault = $uid !== '' ? orolado_crypto_vault($db, $uid) : null;
  if ($uid !== '' && $vault) supabase_sync_real_min($uid, $vault['real'] ?? 0);
  return [
    'ok' => true,
    'paid' => true,
    'success' => true,
    'amount' => $credited,
    'vault' => $vault,
    'ref' => $ref,
    'trackId' => $trackId,
  ];
}

function orolado_abandon_open_deposit(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $token = (string) ($req['token'] ?? '');
  $me = orolado_session_user($db, $token);
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide'];
  $oid = (string) ($req['orderId'] ?? $req['ref'] ?? '');
  if ($oid === '') return ['ok' => false, 'server' => true, 'reason' => 'Référence manquante'];
  $uid = (string) $me['id'];
  $changed = false;
  foreach (($db['deposits'] ?? []) as $i => $d) {
    if ((string) ($d['userId'] ?? '') !== $uid) continue;
    $id = (string) ($d['id'] ?? $d['ref'] ?? '');
    if ($id !== $oid) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st === 'PAID' || $st === 'COMPLETED' || $st === 'SUCCESS') continue;
    if (!empty($d['confirmed'])) continue;
    $db['deposits'][$i]['status'] = 'UNFINISHED';
    $changed = true;
  }
  if ($changed) save_db($file, $db);
  return ['ok' => true, 'server' => true, 'abandoned' => $changed];
}

function orolado_oxapay_invoice(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $token = (string) ($req['token'] ?? '');
  $me = orolado_session_user($db, $token);
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide', 'code' => 'session'];
  $coin = strtolower(trim((string) ($req['coin'] ?? 'usdt_trc20')));
  if ($coin === 'usdt') $coin = 'usdt_trc20';
  if ($coin === 'ethereum' || $coin === 'eth_erc20') $coin = 'eth';
  $coins = orolado_oxapay_coins();
  if (!isset($coins[$coin])) {
    return ['ok' => false, 'server' => true, 'reason' => 'Crypto non acceptée.', 'code' => 'coin'];
  }
  $meta = $coins[$coin];
  $minUsd = orolado_oxapay_min_usd($coin);
  $amount = orolado_money($req['amount'] ?? 0);
  if ($amount <= 0) $amount = $minUsd;
  if ($amount + 0.0001 < $minUsd) {
    return [
      'ok' => false,
      'server' => true,
      'reason' => 'Le dépôt minimum pour ' . $meta['label'] . ' est de $' . number_format($minUsd, 0) . '.',
      'code' => 'min',
      'minUsd' => $minUsd,
    ];
  }
  $uid = (string) $me['id'];
  $orderId = 'oro_' . preg_replace('/[^a-zA-Z0-9]/', '', $uid) . '_' . bin2hex(random_bytes(6));
  $callback = rtrim(orolado_public_origin(), '/') . '/api/oxapay/webhook';
  $base = [
    'amount' => $amount,
    'currency' => 'USD',
    'pay_currency' => $meta['pay'],
    'lifetime' => 1440,
    'callback_url' => $callback,
    'order_id' => $orderId,
    'email' => (string) ($me['email'] ?? ''),
    'under_paid_coverage' => 60,
    'description' => 'OROLADO ' . $meta['label'] . ' ' . $meta['netLabel'],
  ];
  if ($meta['network'] !== '') $base['network'] = $meta['network'];
  $res = orolado_oxapay_http('POST', '/v1/payment/white-label', $base);
  $data = is_array($res) ? orolado_oxapay_extract($res) : [];
  if (empty($data['address']) && $coin === 'eth') {
    foreach (['ETH', 'ERC20'] as $netTry) {
      $try = $base;
      $try['network'] = $netTry;
      $res = orolado_oxapay_http('POST', '/v1/payment/white-label', $try);
      $data = is_array($res) ? orolado_oxapay_extract($res) : [];
      if (!empty($data['address'])) {
        $meta['network'] = $netTry;
        break;
      }
    }
  }
  if (empty($data['address']) && $meta['network'] !== '') {
    $try = $base;
    unset($try['network']);
    $res = orolado_oxapay_http('POST', '/v1/payment/white-label', $try);
    $data = is_array($res) ? orolado_oxapay_extract($res) : [];
    if (!empty($data['address'])) $meta['network'] = '';
  }
  if (empty($data['address'])) {
    $legacy = [
      'merchant' => orolado_oxapay_key(),
      'payCurrency' => $meta['pay'],
      'amount' => $amount,
      'currency' => 'USD',
      'lifeTime' => 1440,
      'callbackUrl' => $callback,
      'orderId' => $orderId,
      'email' => (string) ($me['email'] ?? ''),
      'underPaidCover' => 60,
      'description' => 'OROLADO ' . $meta['label'],
    ];
    if ($meta['network'] !== '') $legacy['network'] = $meta['network'];
    $res = orolado_oxapay_http('POST', '/merchants/request/whitelabel', $legacy);
    $data = is_array($res) ? orolado_oxapay_extract($res) : [];
    if (empty($data['address']) && $coin === 'eth') {
      foreach (['ETH', 'ERC20'] as $netTry) {
        $legacy['network'] = $netTry;
        $res = orolado_oxapay_http('POST', '/merchants/request/whitelabel', $legacy);
        $data = is_array($res) ? orolado_oxapay_extract($res) : [];
        if (!empty($data['address'])) break;
      }
    }
  }
  $addr = trim((string) ($data['address'] ?? ''));
  if (preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:/', $addr)) {
    $addr = (string) preg_replace('/^[a-zA-Z][a-zA-Z0-9+.-]*:/', '', $addr);
  }
  $qPos = strpos($addr, '?');
  if ($qPos !== false) $addr = substr($addr, 0, $qPos);
  $addr = trim($addr, "/ \t\n\r");
  if (preg_match('#^https?://#i', $addr)) $addr = '';
  if ($addr === '') {
    return ['ok' => false, 'server' => true, 'reason' => orolado_oxapay_err(is_array($res) ? $res : null), 'code' => 'oxapay', 'minUsd' => $minUsd];
  }
  $trackId = (string) ($data['track_id'] ?? $data['trackId'] ?? '');
  $payAmt = $data['pay_amount'] ?? $data['payAmount'] ?? $amount;
  $qr = '';
  $network = (string) ($data['network'] ?? $meta['netLabel']);
  $expired = (int) ($data['expired_at'] ?? $data['expiredAt'] ?? 0);
  $confirmed = !empty($req['confirmed']) && $req['confirmed'] !== '0' && $req['confirmed'] !== 'false';
  $depStatus = $confirmed ? 'PENDING' : 'UNFINISHED';
  $db = load_db($file);
  $db['deposits'][] = [
    'id' => $orderId,
    'ref' => $orderId,
    'userId' => $uid,
    'operator' => 'oxapay',
    'network' => $network !== '' ? $network : $meta['netLabel'],
    'coin' => $coin,
    'status' => $depStatus,
    'confirmed' => $confirmed,
    'amount' => $amount,
    'currency' => 'USD',
    'trackId' => $trackId,
    'address' => $addr,
    'clientIp' => orolado_request_ip(),
    'userAgent' => orolado_request_ua(),
    'at' => date('c')
  ];
  save_db($file, $db);
  if ($confirmed) {
    supabase_insert_deposit([
      'id' => $orderId,
      'user_id' => $uid,
      'amount' => $amount,
      'status' => 'PENDING',
      'reference' => $orderId,
      'operator' => 'oxapay',
    ]);
  }
  return [
    'ok' => true,
    'server' => true,
    'orderId' => $orderId,
    'trackId' => $trackId,
    'address' => $addr,
    'amount' => $amount,
    'payAmount' => is_numeric($payAmt) ? (float) $payAmt : $amount,
    'payCurrency' => $meta['pay'],
    'network' => $network !== '' ? $network : $meta['netLabel'],
    'coin' => $coin,
    'qr' => $qr,
    'expiredAt' => $expired,
    'memo' => (string) ($data['memo'] ?? ''),
  ];
}

function orolado_oxapay_status(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $token = (string) ($req['token'] ?? '');
  $me = orolado_session_user($db, $token);
  if (!$me) return ['ok' => false, 'server' => true, 'code' => 'session', 'reason' => 'Session invalide'];
  $orderId = trim((string) ($req['orderId'] ?? $req['ref'] ?? ''));
  $trackId = trim((string) ($req['trackId'] ?? ''));
  $uid = (string) $me['id'];
  $dep = null;
  foreach ($db['deposits'] as $d) {
    if (!is_array($d) || (string) ($d['userId'] ?? '') !== $uid) continue;
    if (($orderId !== '' && ((string) ($d['id'] ?? '') === $orderId || (string) ($d['ref'] ?? '') === $orderId))
      || ($trackId !== '' && (string) ($d['trackId'] ?? '') === $trackId)) {
      $dep = $d;
      break;
    }
  }
  if (!$dep) return ['ok' => true, 'pending' => true];
  $st = strtoupper((string) ($dep['status'] ?? ''));
  if ($st === 'COMPLETED' || $st === 'PAID') {
    return [
      'ok' => true,
      'paid' => true,
      'success' => true,
      'amount' => orolado_money($dep['amount'] ?? 0),
      'vault' => orolado_crypto_vault($db, $uid),
    ];
  }
  $tid = $trackId !== '' ? $trackId : (string) ($dep['trackId'] ?? '');
  if ($tid === '') return ['ok' => true, 'pending' => true];
  $data = orolado_oxapay_inquiry($tid);
  $status = orolado_oxapay_payload_status($data);
  $received = orolado_oxapay_received_usd($data);
  $usd = $received > 0.0001 ? $received : orolado_oxapay_usd($data);
  $payable = orolado_oxapay_paid_status($status) || $received + 0.0001 >= orolado_oxapay_credit_floor();
  if (!$payable) {
    return ['ok' => true, 'pending' => true, 'oxaStatus' => $status];
  }
  if ($received + 0.0001 >= orolado_oxapay_credit_floor()) $usd = $received;
  elseif ($usd + 0.0001 < orolado_oxapay_credit_floor()) $usd = orolado_money($dep['amount'] ?? 0);
  if (!orolado_oxapay_net_ok($data, $dep)) return ['ok' => true, 'pending' => true];
  if ($usd + 0.0001 < orolado_oxapay_credit_floor()) return ['ok' => true, 'pending' => true];
  $txid = (string) ($data['txs'][0]['tx_hash'] ?? $data['txs'][0]['txHash'] ?? $data['txs'][0]['hash'] ?? $tid);
  $addr = trim((string) ($data['address'] ?? $dep['address'] ?? ''));
  return orolado_oxapay_credit((string) ($dep['id'] ?? $orderId), $tid, $usd, $txid, $addr, (string) ($me['email'] ?? ''));
}

function orolado_oxapay_apply_payload(array $data): array {
  if (isset($data['data']) && is_array($data['data'])) $data = array_merge($data, $data['data']);
  $type = strtolower((string) ($data['type'] ?? ''));
  if ($type === 'payout') return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $orderId = (string) ($data['order_id'] ?? $data['orderId'] ?? '');
  $trackId = (string) ($data['track_id'] ?? $data['trackId'] ?? '');
  $address = trim((string) ($data['address'] ?? ''));
  $depProbe = orolado_oxapay_find_dep($orderId, $trackId, $address);
  if ($trackId === '' && $depProbe) $trackId = (string) ($depProbe['trackId'] ?? '');
  if ($trackId !== '') {
    $live = orolado_oxapay_inquiry($trackId);
    if ($live) $data = array_merge($data, $live);
  }
  $status = orolado_oxapay_payload_status($data);
  $received = orolado_oxapay_received_usd($data);
  $usd = $received > 0.0001 ? $received : orolado_oxapay_usd($data);
  $orderId = (string) ($data['order_id'] ?? $data['orderId'] ?? $orderId);
  $trackId = (string) ($data['track_id'] ?? $data['trackId'] ?? $trackId);
  $address = trim((string) ($data['address'] ?? $address));
  $email = strtolower(trim((string) ($data['email'] ?? $data['payer_email'] ?? '')));
  $dep = orolado_oxapay_find_dep($orderId, $trackId, $address);
  $payable = orolado_oxapay_paid_status($status) || $received + 0.0001 >= orolado_oxapay_credit_floor();
  if (!$payable) return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  if ($received + 0.0001 >= orolado_oxapay_credit_floor()) $usd = $received;
  elseif ($dep && $usd + 0.0001 < orolado_oxapay_credit_floor()) $usd = orolado_money($dep['amount'] ?? 0);
  if (!orolado_oxapay_net_ok($data, $dep)) return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $txid = (string) ($data['txs'][0]['tx_hash'] ?? $data['txs'][0]['txHash'] ?? $data['txs'][0]['hash'] ?? $trackId);
  if ($orderId === '' && $trackId === '' && $address === '' && $email === '') return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  if ($usd + 0.0001 < orolado_oxapay_credit_floor()) return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  orolado_oxapay_credit($orderId, $trackId, $usd, $txid, $address, $email);
  return ['ok' => true, 'http' => 200, 'body' => 'OK'];
}

function orolado_oxapay_webhook(string $raw, string $hmacHeader): array {
  $data = json_decode($raw, true);
  if (!is_array($data)) return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $signed = orolado_oxapay_hmac_ok($raw, $hmacHeader);
  if (!$signed) {
    $probe = $data;
    if (isset($probe['data']) && is_array($probe['data'])) $probe = array_merge($probe, $probe['data']);
    $trackId = (string) ($probe['track_id'] ?? $probe['trackId'] ?? '');
    $orderId = (string) ($probe['order_id'] ?? $probe['orderId'] ?? '');
    if ($trackId === '' && $orderId === '') return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  }
  return orolado_oxapay_apply_payload($data);
}

function orolado_flw_secret(): string {
  orolado_load_env();
  return trim((string) (getenv('FLW_SECRET_KEY') ?: ($_ENV['FLW_SECRET_KEY'] ?? $_SERVER['FLW_SECRET_KEY'] ?? '')));
}

function orolado_flw_public(): string {
  orolado_load_env();
  return trim((string) (getenv('FLW_PUBLIC_KEY') ?: ($_ENV['FLW_PUBLIC_KEY'] ?? $_SERVER['FLW_PUBLIC_KEY'] ?? '')));
}

function orolado_flw_webhook_hash(): string {
  orolado_load_env();
  return trim((string) (getenv('FLW_WEBHOOK_HASH') ?: ($_ENV['FLW_WEBHOOK_HASH'] ?? $_SERVER['FLW_WEBHOOK_HASH'] ?? '')));
}

function orolado_flw_configured(): bool {
  return orolado_flw_secret() !== '' && orolado_flw_public() !== '';
}

function orolado_flw_xof_countries(): array {
  return ['CI', 'SN', 'BF', 'ML', 'TG', 'BJ'];
}

function orolado_flw_xaf_countries(): array {
  return ['CM', 'GA', 'CG', 'GQ', 'CF', 'TD'];
}

/** 3 USD = 2000 XOF/XAF — Flutterwave n’accepte pas les centimes CFA. */
function orolado_usd_to_cfa_int($usd): int {
  return (int) max(100, round(orolado_money($usd) * 2000 / 3));
}

function orolado_cfa_to_usd($cfa): float {
  return orolado_money(((float) $cfa) * 3 / 2000);
}

function orolado_flw_norm_cc(string $raw): string {
  $cc = strtoupper(preg_replace('/[^A-Z]/', '', $raw) ?? '');
  if (strlen($cc) !== 2) return '';
  if (in_array($cc, ['XX', 'T1', 'A1', 'A2', 'ZZ'], true)) return '';
  return $cc;
}

function orolado_flw_lang_country(string $lang): string {
  $raw = strtolower(str_replace('_', '-', trim($lang)));
  if ($raw === '') return '';
  if (preg_match('/^(pt-br|en-ng|en-gh|en-ke|en-za|fr-ci|fr-sn|fr-bf|fr-ml|fr-tg|fr-bj|fr-cm|fr-ga|fr-cg)$/', $raw)) {
    return strtoupper(substr($raw, -2));
  }
  if (preg_match('/^[a-z]{2}-([a-z]{2})$/', $raw, $m)) {
    $cc = orolado_flw_norm_cc($m[1]);
    if ($cc === 'FR' || $cc === 'US' || $cc === 'GB') return '';
    return $cc;
  }
  return '';
}

function orolado_flw_iso_country(string $raw): string {
  $t = trim($raw);
  if ($t === '' || str_starts_with($t, '+') || preg_match('/^\d+$/', $t)) return '';
  return orolado_flw_norm_cc($t);
}

function orolado_flw_client_ip(): string {
  foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'HTTP_X_FORWARDED_FOR'] as $h) {
    $v = trim((string) ($_SERVER[$h] ?? ''));
    if ($v === '') continue;
    $ip = trim(explode(',', $v)[0]);
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return $ip;
  }
  $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
  if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return $ip;
  return '';
}

function orolado_flw_ip_country(): string {
  foreach (['HTTP_CF_IPCOUNTRY', 'HTTP_X_COUNTRY_CODE', 'HTTP_X_APPENGINE_COUNTRY', 'HTTP_CLOUDFRONT_VIEWER_COUNTRY'] as $h) {
    $cc = orolado_flw_norm_cc((string) ($_SERVER[$h] ?? ''));
    if ($cc !== '') return $cc;
  }
  $ip = orolado_flw_client_ip();
  if ($ip === '' || !function_exists('curl_init')) return '';
  $ch = curl_init('https://api.country.is/' . rawurlencode($ip));
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 3,
    CURLOPT_CONNECTTIMEOUT => 2,
  ]);
  $raw = curl_exec($ch);
  curl_close($ch);
  if (!is_string($raw) || $raw === '') return '';
  $json = json_decode($raw, true);
  if (!is_array($json)) return '';
  return orolado_flw_norm_cc((string) ($json['country'] ?? $json['country_code'] ?? ''));
}

function orolado_flw_dial_country(string $dial, string $phone = ''): string {
  $d = preg_replace('/\D/', '', $dial . $phone) ?? '';
  $map = [
    '225' => 'CI', '221' => 'SN', '226' => 'BF', '223' => 'ML', '228' => 'TG', '229' => 'BJ',
    '237' => 'CM', '241' => 'GA', '242' => 'CG', '240' => 'GQ', '236' => 'CF', '235' => 'TD',
  ];
  foreach ($map as $pref => $cc) {
    if (str_starts_with($d, $pref)) return $cc;
  }
  return '';
}

function orolado_flw_resolve_country(array $req, array $me): string {
  $fromClient = orolado_flw_iso_country((string) ($req['country'] ?? $req['countryCode'] ?? ''));
  if ($fromClient !== '') return $fromClient;
  $ip = orolado_flw_ip_country();
  if ($ip !== '') return $ip;
  $prof = orolado_flw_iso_country((string) ($me['country'] ?? $me['countryIso'] ?? ''));
  if ($prof !== '') return $prof;
  $lang = orolado_flw_lang_country((string) ($req['lang'] ?? $req['language'] ?? ''));
  if ($lang !== '') return $lang;
  $dial = orolado_flw_dial_country((string) ($me['countryCode'] ?? $me['dial'] ?? ''), (string) ($me['phone'] ?? ''));
  if ($dial !== '') return $dial;
  return 'INTL';
}

function orolado_flw_payment_options(string $cc): string {
  if (in_array($cc, orolado_flw_xof_countries(), true) || in_array($cc, orolado_flw_xaf_countries(), true)) {
    return 'card,mobilemoneyfranco';
  }
  return '';
}

function orolado_flw_rate(string $key, float $fallback): float {
  $r = (float) (getenv($key) ?: ($_ENV[$key] ?? $fallback));
  return $r > 0 ? $r : $fallback;
}

function orolado_flw_charge(string $cc, float $usd): array {
  $usd = max(orolado_money($usd), 3.0);
  if (in_array($cc, orolado_flw_xof_countries(), true)) {
    return ['currency' => 'XOF', 'amount' => orolado_usd_to_cfa_int($usd)];
  }
  if (in_array($cc, orolado_flw_xaf_countries(), true)) {
    return ['currency' => 'XAF', 'amount' => orolado_usd_to_cfa_int($usd)];
  }
  if ($cc === 'NG') return ['currency' => 'NGN', 'amount' => round($usd * orolado_flw_rate('USD_NGN_RATE', 1500), 2)];
  if ($cc === 'GH') return ['currency' => 'GHS', 'amount' => round($usd * orolado_flw_rate('USD_GHS_RATE', 12), 2)];
  if ($cc === 'KE') return ['currency' => 'KES', 'amount' => round($usd * orolado_flw_rate('USD_KES_RATE', 130), 2)];
  if ($cc === 'ZA') return ['currency' => 'ZAR', 'amount' => round($usd * orolado_flw_rate('USD_ZAR_RATE', 18), 2)];
  return ['currency' => 'USD', 'amount' => $usd];
}

function orolado_flw_email_ok(string $email): bool {
  $email = trim($email);
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) return false;
  if (str_contains(strtolower($email), '@orolado.local')) return false;
  if (str_contains(strtolower($email), '@orolado-pay.com')) return false;
  return true;
}

function orolado_supabase_profile_row(string $uid): array {
  $hdrs = supabase_admin_headers();
  if (!$hdrs || $uid === '') return [];
  $rows = supabase_http(
    supabase_project_url() . '/rest/v1/profiles?id=eq.' . rawurlencode($uid) . '&select=display_name,phone,country_code,email',
    $hdrs
  );
  if (is_array($rows) && isset($rows[0]) && is_array($rows[0])) return $rows[0];
  return [];
}

function orolado_flw_real_phone(string $phone, string $dial = ''): string {
  $digits = preg_replace('/\D/', '', $phone) ?? '';
  if ($digits === '' || preg_match('/^0+$/', $digits)) return '';
  $dialDigits = preg_replace('/\D/', '', $dial) ?? '';
  if ($dialDigits !== '' && str_starts_with($digits, $dialDigits)) {
    $local = substr($digits, strlen($dialDigits));
  } else {
    $local = $digits;
  }
  $local = ltrim($local, '0');
  if ($local === '' || preg_match('/^0+$/', $local) || strlen($local) < 8) return '';
  if (strlen($digits) < 8 || strlen($digits) > 15) return '';
  if ($dialDigits !== '' && !str_starts_with($digits, $dialDigits) && strlen($digits) <= 12) {
    $digits = $dialDigits . $digits;
  }
  if (preg_match('/^(225|221|226|223|228|229|237|241|242|240|236|235)0+$/', $digits)) return '';
  return '+' . $digits;
}

function orolado_flw_customer(array $me, string $token): array {
  $uid = (string) ($me['id'] ?? '');
  $email = trim((string) ($me['email'] ?? ''));
  $name = trim((string) ($me['displayName'] ?? ''));
  $phone = trim((string) ($me['phone'] ?? ''));
  $dial = trim((string) ($me['countryCode'] ?? ''));
  $iso = orolado_flw_iso_country((string) ($me['country'] ?? ''));
  $auth = supabase_fetch_auth_user($token);
  if (is_array($auth)) {
    $authMail = trim((string) ($auth['email'] ?? ''));
    if (orolado_flw_email_ok($authMail)) $email = $authMail;
    $meta = is_array($auth['user_metadata'] ?? null) ? $auth['user_metadata'] : [];
    if ($name === '') $name = trim((string) ($meta['display_name'] ?? ''));
    if (trim((string) ($meta['phone'] ?? '')) !== '') $phone = trim((string) $meta['phone']);
    $isoMeta = orolado_flw_iso_country((string) ($meta['country'] ?? ''));
    if ($iso === '' && $isoMeta !== '') $iso = $isoMeta;
  }
  $prof = orolado_supabase_profile_row($uid);
  if ($prof) {
    $pMail = trim((string) ($prof['email'] ?? ''));
    if (!orolado_flw_email_ok($email) && orolado_flw_email_ok($pMail)) $email = $pMail;
    if ($name === '') $name = trim((string) ($prof['display_name'] ?? ''));
    if (trim((string) ($prof['phone'] ?? '')) !== '') $phone = trim((string) $prof['phone']);
    $isoProf = orolado_flw_iso_country((string) ($prof['country'] ?? ''));
    if ($iso === '' && $isoProf !== '') $iso = $isoProf;
  }
  return [
    'email' => $email,
    'name' => $name,
    'phone' => orolado_flw_real_phone($phone, $dial),
    'dial' => $dial,
    'country' => $iso,
  ];
}

function orolado_flw_http(string $method, string $path, ?array $body = null): ?array {
  $secret = orolado_flw_secret();
  if ($secret === '') return null;
  $url = 'https://api.flutterwave.com/v3' . $path;
  $headers = [
    'Accept: application/json',
    'Content-Type: application/json',
    'Authorization: Bearer ' . $secret,
  ];
  if (!function_exists('curl_init')) return null;
  $ch = curl_init($url);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 18,
    CURLOPT_CONNECTTIMEOUT => 6,
    CURLOPT_HTTPHEADER => $headers,
  ];
  $method = strtoupper($method);
  if ($method === 'POST') {
    $opts[CURLOPT_POST] = true;
    $opts[CURLOPT_POSTFIELDS] = json_encode($body ?? new stdClass(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  }
  curl_setopt_array($ch, $opts);
  $raw = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if (!is_string($raw) || $raw === '') return ['_http' => $code];
  $json = json_decode($raw, true);
  if (!is_array($json)) return ['_http' => $code];
  $json['_http'] = $code;
  return $json;
}

function orolado_flutterwave_checkout(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $token = (string) ($req['token'] ?? '');
  $me = orolado_session_user($db, $token);
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide', 'code' => 'session'];
  if (!orolado_flw_configured()) {
    return ['ok' => false, 'server' => true, 'reason' => 'Paiement carte indisponible pour le moment.', 'code' => 'keys'];
  }
  $amountUsd = orolado_money($req['amount'] ?? 0);
  $minUsd = 3.0;
  if ($amountUsd + 0.0001 < $minUsd) {
    return ['ok' => false, 'server' => true, 'reason' => 'Le dépôt minimum est de $3.00.', 'code' => 'min'];
  }
  $cust = orolado_flw_customer($me, $token);
  if (!orolado_flw_email_ok((string) ($cust['email'] ?? ''))) {
    return ['ok' => false, 'server' => true, 'reason' => 'E-mail du compte introuvable. Connectez-vous avec votre compte.', 'code' => 'email'];
  }
  $cc = orolado_flw_resolve_country($req, array_merge($me, [
    'country' => $cust['country'] !== '' ? $cust['country'] : (string) ($me['country'] ?? ''),
    'countryCode' => $cust['dial'] !== '' ? $cust['dial'] : (string) ($me['countryCode'] ?? ''),
    'phone' => $cust['phone'] !== '' ? $cust['phone'] : (string) ($me['phone'] ?? ''),
  ]));
  if ($cc === '') $cc = 'INTL';
  $wantCur = strtoupper(trim((string) ($req['currency'] ?? '')));
  if ($wantCur === 'XOF' || $wantCur === 'CFA' || $wantCur === 'FCFA') {
    $cc = in_array($cc, orolado_flw_xof_countries(), true) ? $cc : 'CI';
  }
  if ($wantCur === 'XAF') {
    $cc = in_array($cc, orolado_flw_xaf_countries(), true) ? $cc : 'CM';
  }
  $charge = orolado_flw_charge($cc, $amountUsd);
  $payCur = strtoupper((string) ($charge['currency'] ?? ''));
  if (($payCur === 'XOF' || $payCur === 'XAF') && (float) ($charge['amount'] ?? 0) < 100) {
    $charge = ['currency' => $payCur, 'amount' => orolado_usd_to_cfa_int($amountUsd)];
  }
  $charge['amount'] = ($payCur === 'XOF' || $payCur === 'XAF')
    ? (int) round((float) ($charge['amount'] ?? 0))
    : (float) ($charge['amount'] ?? 0);
  $method = strtolower((string) ($charge['currency'] ?? 'usd'));
  $uid = (string) $me['id'];
  $ref = 'flw_' . preg_replace('/[^a-zA-Z0-9]/', '', $uid) . '_' . bin2hex(random_bytes(6));
  $origin = rtrim(orolado_public_origin(), '/');
  $customer = [
    'email' => $cust['email'],
    'name' => $cust['name'] !== '' ? $cust['name'] : explode('@', $cust['email'])[0],
  ];
  if ($cust['phone'] !== '') $customer['phonenumber'] = $cust['phone'];
  $customizations = [
    'title' => 'OROLADO',
    'description' => 'Recharge de solde sécurisée',
    'logo' => $origin . '/icons/icon.svg',
  ];
  if (!isset($db['deposits']) || !is_array($db['deposits'])) $db['deposits'] = [];
  $db['deposits'][] = [
    'id' => $ref,
    'ref' => $ref,
    'userId' => $uid,
    'operator' => 'flutterwave',
    'status' => 'PENDING',
    'amount' => $amountUsd,
    'payAmount' => $charge['amount'],
    'payCurrency' => $charge['currency'],
    'method' => $method,
    'country' => $cc,
    'customerEmail' => $cust['email'],
    'customerName' => $cust['name'],
    'customerPhone' => $cust['phone'],
    'currency' => 'USD',
    'clientIp' => orolado_request_ip(),
    'userAgent' => orolado_request_ua(),
    'at' => date('c'),
  ];
  save_db($file, $db);
  supabase_insert_deposit([
    'id' => $ref,
    'user_id' => $uid,
    'amount' => $amountUsd,
    'status' => 'PENDING',
    'reference' => $ref,
    'operator' => 'flutterwave',
  ]);
  return [
    'ok' => true,
    'server' => true,
    'inline' => true,
    'public_key' => orolado_flw_public(),
    'ref' => $ref,
    'tx_ref' => $ref,
    'amount' => $charge['amount'],
    'amountUsd' => $amountUsd,
    'currency' => $charge['currency'],
    'country' => $cc,
    'method' => $method,
    'customer' => $customer,
    'customizations' => $customizations,
    'payment_options' => orolado_flw_payment_options($cc),
    'redirect_url' => $origin . '/api/flutterwave/callback',
  ];
}

function orolado_flutterwave_to_usd(string $cur, float $amt): float {
  $cur = strtoupper(trim($cur));
  $amt = (float) $amt;
  if ($amt <= 0) return 0.0;
  if ($cur === 'USD' || $cur === 'USDT') return orolado_money($amt);
  if ($cur === 'XOF' || $cur === 'XAF' || $cur === 'CFA' || $cur === 'FCFA') return orolado_cfa_to_usd($amt);
  $map = [
    'NGN' => ['USD_NGN_RATE', 1500.0],
    'GHS' => ['USD_GHS_RATE', 12.0],
    'KES' => ['USD_KES_RATE', 130.0],
    'ZAR' => ['USD_ZAR_RATE', 18.0],
  ];
  if (!isset($map[$cur])) return 0.0;
  $rate = orolado_flw_rate($map[$cur][0], $map[$cur][1]);
  return $rate > 0 ? orolado_money($amt / $rate) : 0.0;
}

function orolado_flutterwave_payload_usd(array $data): float {
  $cur = (string) ($data['currency'] ?? '');
  $amt = (float) ($data['amount'] ?? 0);
  if ($amt <= 0) $amt = (float) ($data['charged_amount'] ?? $data['chargedAmount'] ?? 0);
  return orolado_flutterwave_to_usd($cur, $amt);
}

function orolado_flutterwave_verify(string $txRef, string $transactionId = ''): array {
  if ($transactionId !== '' && ctype_digit($transactionId)) {
    $res = orolado_flw_http('GET', '/transactions/' . rawurlencode($transactionId) . '/verify');
  } else {
    $res = orolado_flw_http('GET', '/transactions/verify_by_reference?tx_ref=' . rawurlencode($txRef));
  }
  if (!is_array($res) || strtolower((string) ($res['status'] ?? '')) !== 'success') {
    return ['ok' => false, 'paid' => false];
  }
  $data = is_array($res['data'] ?? null) ? $res['data'] : [];
  $st = strtolower((string) ($data['status'] ?? ''));
  if ($st !== 'successful') return ['ok' => true, 'paid' => false, 'status' => $st];
  $gotRef = (string) ($data['tx_ref'] ?? $txRef);
  $cur = strtoupper((string) ($data['currency'] ?? ''));
  $amt = (float) ($data['amount'] ?? 0);
  if ($amt <= 0) $amt = (float) ($data['charged_amount'] ?? 0);
  $usd = orolado_flutterwave_to_usd($cur, $amt);
  return [
    'ok' => true,
    'paid' => true,
    'tx_ref' => $gotRef,
    'extId' => (string) ($data['id'] ?? $data['flw_ref'] ?? $gotRef),
    'flw_ref' => (string) ($data['flw_ref'] ?? ''),
    'currency' => $cur,
    'amount' => $amt,
    'amount_usd' => $usd,
  ];
}

function orolado_flutterwave_credit(string $txRef, string $extId = '', float $verifiedUsd = 0.0): array {
  $dep = orolado_oxapay_find_dep($txRef, $extId);
  if (!$dep) {
    $db = load_db(orolado_data_file());
    foreach (($db['deposits'] ?? []) as $d) {
      if (!is_array($d)) continue;
      if (strcasecmp((string) ($d['id'] ?? ''), $txRef) === 0 || strcasecmp((string) ($d['ref'] ?? ''), $txRef) === 0) {
        $dep = $d;
        break;
      }
    }
  }
  if (!$dep) return ['ok' => false, 'code' => 'unknown'];
  $pending = orolado_money($dep['amount'] ?? 0);
  $verifiedUsd = orolado_money($verifiedUsd);
  $usd = $verifiedUsd > 0 ? $verifiedUsd : $pending;
  if ($usd + 0.0001 < orolado_oxapay_credit_floor()) return ['ok' => false, 'code' => 'min'];
  $paid = credit_paid_deposit([
    'ref' => (string) ($dep['id'] ?? $txRef),
    'amount' => $usd,
    'extId' => $extId !== '' ? $extId : $txRef,
    'paid' => true,
    'creditReceived' => true,
    'allowSmall' => true,
    'operator' => 'flutterwave',
  ]);
  if (!empty($paid['ok']) || !empty($paid['duplicate'])) {
    $uid = (string) ($dep['userId'] ?? $paid['userId'] ?? '');
    $db = load_db(orolado_data_file());
    $vault = $uid !== '' ? orolado_crypto_vault($db, $uid) : null;
    if ($uid !== '' && $vault) supabase_sync_real_min($uid, $vault['real'] ?? 0);
    return [
      'ok' => true,
      'paid' => empty($paid['duplicate']),
      'duplicate' => !empty($paid['duplicate']),
      'amount' => orolado_money($paid['amount'] ?? $usd),
      'vault' => $vault,
      'ref' => (string) ($dep['id'] ?? $txRef),
    ];
  }
  return ['ok' => false, 'code' => 'credit'];
}

function orolado_flutterwave_confirm(array $req, array $dep): array {
  $uid = (string) ($dep['userId'] ?? '');
  $refId = (string) ($dep['id'] ?? $dep['ref'] ?? '');
  $st = strtoupper((string) ($dep['status'] ?? ''));
  if ($st !== 'PAID' && $st !== 'COMPLETED') {
    $txId = '';
    $params = $req['returnParams'] ?? null;
    if (is_array($params)) {
      $txId = (string) ($params['transaction_id'] ?? $params['transactionId'] ?? $params['id'] ?? '');
    }
    $proof = orolado_flutterwave_verify($refId, $txId);
    if (!empty($proof['paid'])) {
      orolado_flutterwave_credit($refId, (string) ($proof['extId'] ?? ''), (float) ($proof['amount_usd'] ?? 0));
    }
  }
  $out = orolado_deposit_status(['token' => $req['token'] ?? '', 'ref' => $refId]);
  $out['ref'] = $refId;
  $out['success'] = !empty($out['paid']);
  $out['new_balance'] = orolado_money($out['vault']['real'] ?? 0);
  if (empty($out['paid'])) {
    $out['status'] = 'PENDING';
    $out['pending'] = true;
  } else {
    $out['status'] = 'COMPLETED';
  }
  return $out;
}

function orolado_flutterwave_client_verify(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $me = orolado_session_user($db, (string) ($req['token'] ?? ''));
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide', 'code' => 'session'];
  $txId = preg_replace('/[^0-9]/', '', (string) ($req['transaction_id'] ?? $req['id'] ?? '')) ?? '';
  $txRef = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($req['tx_ref'] ?? $req['ref'] ?? '')) ?? '';
  if ($txId === '' && $txRef === '') return ['ok' => false, 'reason' => 'Transaction introuvable'];
  $proof = orolado_flutterwave_verify($txRef, $txId);
  if (empty($proof['paid'])) {
    return ['ok' => true, 'paid' => false, 'pending' => true, 'reason' => 'not_paid'];
  }
  $ref = (string) ($proof['tx_ref'] ?? $txRef);
  $cred = orolado_flutterwave_credit($ref, (string) ($proof['extId'] ?? $txId), (float) ($proof['amount_usd'] ?? 0));
  $out = orolado_deposit_status(['token' => $req['token'] ?? '', 'ref' => $ref]);
  $out['ok'] = true;
  $out['ref'] = $ref;
  $out['paid'] = !empty($cred['ok']) || !empty($out['paid']);
  $out['success'] = !empty($out['paid']);
  $out['amount'] = orolado_money($cred['amount'] ?? $proof['amount_usd'] ?? ($out['amount'] ?? 0));
  if (!empty($cred['vault'])) $out['vault'] = $cred['vault'];
  $out['new_balance'] = orolado_money($out['vault']['real'] ?? 0);
  return $out;
}

function orolado_flutterwave_webhook(string $raw, string $hashHeader): array {
  $payload = json_decode($raw, true);
  if (!is_array($payload)) return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $event = strtolower((string) ($payload['event'] ?? ''));
  $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
  if ($event !== '' && $event !== 'charge.completed' && $event !== 'charge.success') {
    return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  }
  $txRef = (string) ($data['tx_ref'] ?? $data['txRef'] ?? '');
  $txId = (string) ($data['id'] ?? $data['transaction_id'] ?? '');
  if ($txRef === '' && $txId === '') return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $proof = orolado_flutterwave_verify($txRef, $txId);
  if (empty($proof['paid'])) return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $ref = (string) ($proof['tx_ref'] ?? $txRef);
  $usd = (float) ($proof['amount_usd'] ?? 0);
  if ($usd <= 0) $usd = orolado_flutterwave_payload_usd($data);
  if ($usd > 0) {
    orolado_flutterwave_credit($ref, (string) ($proof['extId'] ?? $txId), $usd);
  }
  return ['ok' => true, 'http' => 200, 'body' => 'OK'];
}

function orolado_flutterwave_callback(array $q): void {
  $ref = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($q['tx_ref'] ?? $q['ref'] ?? '')) ?? '';
  $status = strtolower(trim((string) ($q['status'] ?? '')));
  $txId = preg_replace('/[^0-9]/', '', (string) ($q['transaction_id'] ?? $q['id'] ?? '')) ?? '';
  if ($ref !== '' && $status === 'successful') {
    $proof = orolado_flutterwave_verify($ref, $txId);
    if (!empty($proof['paid'])) {
      orolado_flutterwave_credit($ref, (string) ($proof['extId'] ?? $txId), (float) ($proof['amount_usd'] ?? 0));
    }
  }
  $origin = rtrim(orolado_public_origin(), '/');
  $dest = $origin . '/?deposit=' . rawurlencode($status !== '' ? $status : 'return') . ($ref !== '' ? ('&ref=' . rawurlencode($ref)) : '');
  header('Location: ' . $dest, true, 302);
  exit;
}

