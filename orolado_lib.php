<?php
declare(strict_types=1);

function orolado_load_env(?string $path = null): void {
  $path = $path ?: (__DIR__ . '/.env');
  if (!is_file($path)) return;
  $lines = file($path, FILE_IGNORE_NEW_LINES);
  if (!is_array($lines)) return;
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

function orolado_data_dir(): string {
  $dir = __DIR__ . '/data';
  if (!is_dir($dir)) mkdir($dir, 0755, true);
  return $dir;
}

function orolado_data_file(): string {
  return orolado_data_dir() . '/orolado.json';
}

function blank_db(): array {
  return ['users' => [], 'vault' => [], 'withdrawals' => [], 'sessions' => [], 'orders' => [], 'deposits' => [], 'processedTx' => []];
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

function supabase_credit_real(string $userId, int $amount): void {
  $url = supabase_project_url();
  $hdrs = supabase_admin_headers();
  if ($url === '' || $amount === 0 || !$hdrs) {
    if (!$hdrs) error_log('OROLADO: SUPABASE_SERVICE_ROLE_KEY absente — impossible de créditer via service_role');
    return;
  }
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return;
  $rpc = supabase_http($url . '/rest/v1/rpc/credit_real', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount]), 'POST');
  if ($rpc === null) {
    $alt = supabase_http($url . '/rest/v1/rpc/increment_balance', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount]), 'POST');
    if ($alt === null) error_log('OROLADO credit_real/increment_balance échec user=' . $userId);
  }
  supabase_http($url . '/rest/v1/transactions', $hdrs, json_encode([
    'id' => 'dep_' . bin2hex(random_bytes(8)),
    'user_id' => $userId,
    'type' => 'deposit',
    'amount' => $amount,
    'note' => 'Recharge Maketou',
    'mode' => 'real',
  ]), 'POST');
}

function supabase_insert_deposit(array $row): void {
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return;
  supabase_http(supabase_project_url() . '/rest/v1/deposits', $hdrs, json_encode($row, JSON_UNESCAPED_UNICODE), 'POST');
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

function supabase_admin_vault(string $userId): ?array {
  $hdrs = supabase_admin_headers();
  if (!$hdrs || !preg_match('/^[0-9a-f-]{36}$/i', $userId)) return null;
  $rows = supabase_http(supabase_project_url() . '/rest/v1/vaults?user_id=eq.' . rawurlencode($userId) . '&select=demo,real', $hdrs);
  if (!is_array($rows) || !isset($rows[0])) return null;
  return ['demo' => (int) ($rows[0]['demo'] ?? 0), 'real' => (int) ($rows[0]['real'] ?? 0)];
}

function supabase_complete_deposit(string $ref, int $amount, string $userId): ?array {
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
  if (!isset($db['sessions']) || !is_array($db['sessions'])) $db['sessions'] = [];
  if (!isset($db['users']) || !is_array($db['users'])) $db['users'] = [];
  foreach ($db['sessions'] as $sid => $sess) {
    if ($sid === $token && isset($db['users'][$sess['userId']])) {
      return $db['users'][$sess['userId']];
    }
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
    if (!isset($db['vault'][$id])) $db['vault'][$id] = ['demo' => 50000, 'real' => 0];
    save_db(orolado_data_file(), $db);
  }
  return $db['users'][$id];
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

function maketou_checkout_url(string $aliasEmail, string $aliasPhone, string $ref, int $amount = 0, string $op = 'wave', string $name = 'Client Orolado', string $returnUrl = ''): string {
  [$first, $last] = maketou_split_name($name);
  $phoneLocal = preg_replace('/\D/', '', $aliasPhone) ?? '';
  if (str_starts_with($phoneLocal, '225')) $phoneLocal = substr($phoneLocal, 3);
  if ($returnUrl === '') $returnUrl = orolado_public_origin() . '/pay-done.html?ref=' . rawurlencode($ref);
  $dashUrl = orolado_public_origin() . '/?deposit=success&ref=' . rawurlencode($ref);
  $qs = [
    'customPrice' => $amount,
    'price' => $amount,
    'amount' => $amount,
    'firstName' => $first,
    'lastName' => $last,
    'firstname' => $first,
    'lastname' => $last,
    'email' => $aliasEmail,
    'phone' => $phoneLocal !== '' ? $phoneLocal : $aliasPhone,
    'phoneNumber' => $phoneLocal !== '' ? $phoneLocal : $aliasPhone,
    'country' => 'CI',
    'countryCode' => 'CI',
    'currency' => 'XOF',
    'product_id' => maketou_product_id(),
    'ref' => $ref,
    'operator' => $op,
    'payment_method' => $op,
    'step' => 'payment',
    'success_url' => $dashUrl,
    'return_url' => $returnUrl,
    'redirect_url' => $dashUrl,
    'cancel_url' => orolado_public_origin() . '/?payment=cancel&ref=' . rawurlencode($ref),
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
      if (preg_match('/paid|success|completed|captured|successful|sale/i', $lv)) $paid = true;
    }
    if ($amount <= 0 && (str_contains($k, 'total_price') || str_contains($k, 'current_total') || $k === 'amount' || str_ends_with($k, '.amount') || str_contains($k, 'amount_paid'))) {
      $n = (int) round((float) preg_replace('/[^\d.]/', '', $v));
      if ($n > 0) $amount = $n;
    }
  }
  $topic = strtolower((string) ($_SERVER['HTTP_X_SHOPLINE_TOPIC'] ?? $_SERVER['HTTP_X_MAKETOU_TOPIC'] ?? ''));
  if (str_contains($topic, 'paid') || str_contains($topic, 'orders/create') || str_contains($topic, 'orders/updated') || str_contains($topic, 'sale')) $paid = true;
  return ['ref' => $ref, 'email' => $email, 'amount' => $amount, 'paid' => $paid, 'extId' => $extId, 'sellId' => $sellId, 'phone' => $phone];
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
  if ($extId !== '' && in_array($extId, $db['processedTx'], true)) {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => true, 'duplicate' => true];
  }
  if ($refHit !== '' && in_array($refHit, $db['processedTx'], true)) {
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
    return ['ok' => true, 'duplicate' => true, 'amount' => (int) ($dep['amount'] ?? 0), 'userId' => (string) ($dep['userId'] ?? '')];
  }

  $amount = (int) ($hit['amount'] ?? 0);
  $pendingAmt = (int) ($dep['amount'] ?? 0);
  if ($amount <= 0 && $pendingAmt >= 1000) $amount = $pendingAmt;
  if ($amount < 200 || $amount > 5000000) {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => false, 'reason' => 'amount'];
  }
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
  if (!isset($db['vault'][$uid])) $db['vault'][$uid] = ['demo' => 0, 'real' => 0];
  $db['vault'][$uid]['real'] = (int) ($db['vault'][$uid]['real'] ?? 0) + $amount;
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
  if ($url === '') $url = 'https://welcome-6.mymaketou.shop/api/v1/checkouts';
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
    if (stripos($u, 'paystral.com') !== false) return $u;
  }
  foreach ($urls as $u) {
    $low = strtolower($u);
    if (str_contains($low, '/checkout/custom') || str_contains($low, '/checkout/buy') || str_contains($low, 'app.paystral')) return $u;
  }
  foreach ($urls as $u) {
    $low = strtolower($u);
    if (str_contains($low, '/checkout') && !preg_match('#/products/[^/]+$#', parse_url($u, PHP_URL_PATH) ?: '')) return $u;
  }
  return $fallback;
}

function maketou_http_json(string $url, string $key, array $body): array {
  $payload = json_encode($body, JSON_UNESCAPED_UNICODE);
  if ($payload === false) return ['ok' => false, 'status' => 0, 'json' => null, 'raw' => ''];
  $headers = [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer ' . $key,
    'X-API-Key: ' . $key,
    'x-api-key: ' . $key,
  ];
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 8,
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_POSTFIELDS => $payload,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if (!is_string($raw)) $raw = '';
    $json = json_decode($raw, true);
    return ['ok' => $status >= 200 && $status < 300, 'status' => $status, 'json' => is_array($json) ? $json : null, 'raw' => $raw];
  }
  $ctx = stream_context_create([
    'http' => [
      'method' => 'POST',
      'header' => implode("\r\n", $headers) . "\r\n",
      'content' => $payload,
      'timeout' => 8,
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
      'customerPrices' => [$productId => (int) $info['amount']],
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
  if ($url === '') {
    error_log('OROLADO maketou session status=' . (string) $res['status'] . ' body=' . substr($res['raw'], 0, 600));
    return ['url' => '', 'sellId' => $sellId];
  }
  return ['url' => maketou_finalize_pay_url($url, (string) $info['phone'], $returnUrl), 'sellId' => $sellId];
}

function maketou_create_checkout(array $opts): array {
  $aliasEmail = (string) ($opts['aliasEmail'] ?? '');
  if ($aliasEmail === '') $aliasEmail = maketou_alias_email();
  $aliasPhone = (string) ($opts['phone'] ?? '');
  if ($aliasPhone === '') $aliasPhone = maketou_alias_phone();
  $amount = (int) ($opts['amount'] ?? 0);
  $ref = (string) ($opts['ref'] ?? '');
  $op = (string) ($opts['operator'] ?? 'wave');
  $name = trim((string) ($opts['name'] ?? ''));
  if ($name === '') $name = 'Client Orolado';
  [$first, $last] = ['Trader', 'Orolado'];
  $returnUrl = (string) ($opts['returnUrl'] ?? '');
  $direct = maketou_checkout_url($aliasEmail, $aliasPhone, $ref, $amount, $op, 'Trader Orolado', $returnUrl);
  $session = maketou_storefront_session([
    'email' => $aliasEmail,
    'phone' => $aliasPhone,
    'firstName' => $first,
    'lastName' => $last,
    'amount' => $amount,
    'returnUrl' => $returnUrl,
  ]);
  $sessionUrl = (string) ($session['url'] ?? '');
  $sellId = (string) ($session['sellId'] ?? '');
  if ($sessionUrl !== '') {
    return ['ok' => true, 'url' => $sessionUrl, 'checkout_url' => $sessionUrl, 'sellId' => $sellId];
  }
  $key = maketou_api_key();
  if ($key === '') {
    error_log('OROLADO: session Maketou indisponible, checkout prérempli customPrice=' . $amount);
    return ['ok' => true, 'url' => $direct, 'checkout_url' => $direct, 'fallback' => true];
  }
  $catalogId = maketou_catalog_product_id();
  $body = [
    'productId' => $catalogId,
    'product_id' => maketou_product_id(),
    'storeId' => maketou_store_id(),
    'forceNew' => true,
    'custom_price' => $amount,
    'customPrice' => $amount,
    'amount' => $amount,
    'currency' => 'XOF',
    'request_id' => $ref,
    'skip_cart' => true,
    'customerInfo' => [
      'email' => $aliasEmail,
      'firstName' => $first,
      'lastName' => $last,
      'phone' => $aliasPhone,
      'countryCode' => 'CI',
      'customerPrices' => [$catalogId => $amount],
    ],
    'customer' => [
      'email' => $aliasEmail,
      'name' => $first . ' ' . $last,
      'first_name' => $first,
      'last_name' => $last,
      'phone' => $aliasPhone,
    ],
    'checkout_data' => [
      'email' => $aliasEmail,
      'name' => $first . ' ' . $last,
      'phone' => $aliasPhone,
      'custom' => ['ref' => $ref],
    ],
    'email' => $aliasEmail,
    'phone' => $aliasPhone,
    'name' => $first . ' ' . $last,
    'firstName' => $first,
    'lastName' => $last,
    'success_url' => orolado_public_origin() . '/?deposit=success&ref=' . rawurlencode($ref),
    'return_url' => (string) ($opts['returnUrl'] ?? ''),
    'redirect_url' => orolado_public_origin() . '/?deposit=success&ref=' . rawurlencode($ref),
    'cancel_url' => orolado_public_origin() . '/?payment=cancel&ref=' . rawurlencode($ref),
    'postPurchaseActionUrl' => (string) ($opts['returnUrl'] ?? ''),
    'postPurchaseActionType' => 'REDIRECT',
    'webhook_url' => (string) ($opts['webhookUrl'] ?? ''),
    'metadata' => [
      'ref' => $ref,
      'orolado' => true,
      'operator' => $op,
    ],
  ];
  try {
    $res = maketou_http_json(maketou_api_url(), $key, $body);
  } catch (Throwable $e) {
    error_log('OROLADO maketou_create_checkout: ' . $e->getMessage());
    return ['ok' => true, 'url' => $direct, 'checkout_url' => $direct, 'fallback' => true];
  }
  if (empty($res['ok'])) {
    error_log('OROLADO maketou API status=' . (string) ($res['status'] ?? 0) . ' body=' . substr((string) ($res['raw'] ?? ''), 0, 800));
  }
  $url = '';
  if (is_array($res['json'])) $url = maketou_pick_checkout_url($res['json'], '');
  if ($url === '' && $res['raw'] !== '') {
    if (preg_match('#https?://[^\s"\']+#', $res['raw'], $m)) $url = $m[0];
  }
  $path = strtolower((string) (parse_url((string) $url, PHP_URL_PATH) ?: ''));
  $lowUrl = strtolower((string) $url);
  $isProductPage = $url !== '' && (
    preg_match('#/products/[^/]+/?$#', $path)
    || (str_contains($lowUrl, '/products/welcome') && !str_contains($lowUrl, '/checkout'))
  );
  $isBareCheckout = str_contains($lowUrl, '/products/welcome/checkout') && !str_contains($lowUrl, 'customprice=');
  if ($url === '' || (($isProductPage || $isBareCheckout) && !str_contains($lowUrl, 'paystral.com'))) {
    $url = $direct;
  }
  return ['ok' => true, 'url' => $url, 'checkout_url' => $url, 'sellId' => $sellId];
}

function orolado_payload_has_real_email(string $haystack, array $user): bool {
  $email = strtolower((string) ($user['email'] ?? ''));
  if ($email === '') return false;
  return str_contains(strtolower($haystack), $email) || str_contains(strtolower($haystack), rawurlencode($email));
}

function orolado_initiate_deposit(array $req): array {
  $file = orolado_data_file();
  $db = load_db($file);
  $token = (string) ($req['token'] ?? '');
  $me = orolado_session_user($db, $token);
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide'];

  $amount = (int) ($req['amount'] ?? 0);
  if ($amount < 1000 || $amount > 5000000) {
    return ['ok' => false, 'server' => true, 'reason' => 'Montant minimum 1 000 FCFA'];
  }
  $ops = ['wave', 'orange', 'mtn', 'moov'];
  $op = strtolower((string) ($req['operator'] ?? 'wave'));
  if (!in_array($op, $ops, true)) $op = 'wave';
  $aliasEmail = maketou_alias_email((string) $me['id']);
  $aliasPhone = maketou_alias_phone();
  $ref = 'oro_' . bin2hex(random_bytes(12));
  $origin = orolado_public_origin();
  $returnUrl = $origin . '/pay-done.html?ref=' . rawurlencode($ref);
  $webhookUrl = $origin . '/api/deposit/webhook';

  if (!isset($db['deposits']) || !is_array($db['deposits'])) $db['deposits'] = [];
  $db['deposits'][] = [
    'id' => $ref,
    'ref' => $ref,
    'userId' => $me['id'],
    'aliasEmail' => $aliasEmail,
    'aliasPhone' => $aliasPhone,
    'operator' => $op,
    'status' => 'PENDING',
    'amount' => $amount,
    'at' => date('c')
  ];
  save_db($file, $db);
  supabase_insert_deposit([
    'id' => $ref,
    'user_id' => $me['id'],
    'amount' => $amount,
    'status' => 'PENDING',
    'alias_email' => $aliasEmail,
    'alias_phone' => $aliasPhone,
    'operator' => $op,
  ]);

  $pay = maketou_create_checkout([
    'aliasEmail' => $aliasEmail,
    'phone' => $aliasPhone,
    'name' => 'Trader Orolado',
    'amount' => $amount,
    'operator' => $op,
    'ref' => $ref,
    'returnUrl' => $returnUrl,
    'webhookUrl' => $webhookUrl,
  ]);
  $url = (string) ($pay['url'] ?? $pay['checkout_url'] ?? '');
  if ($url === '') $url = maketou_checkout_url($aliasEmail, $aliasPhone, $ref, $amount, $op, 'Trader Orolado', $returnUrl);
  $sellId = (string) ($pay['sellId'] ?? '');
  if ($sellId !== '') {
    $db = load_db($file);
    foreach ($db['deposits'] as $i => $d) {
      if (($d['id'] ?? '') === $ref) {
        $db['deposits'][$i]['sellId'] = $sellId;
        break;
      }
    }
    save_db($file, $db);
    supabase_patch_deposit($ref, ['sell_id' => $sellId]);
  }
  return [
    'ok' => true,
    'server' => true,
    'ref' => $ref,
    'url' => $url,
    'checkout_url' => $url,
    'amount' => $amount
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

function orolado_confirm_deposit(array $req): array {
  return orolado_deposit_status($req);
}

function maketou_handle_webhook(): void {
  header('Content-Type: application/json; charset=utf-8');
  header('X-Content-Type-Options: nosniff');
  orolado_load_env();

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $ref = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($_GET['ref'] ?? '')) ?? '';
    if ($ref !== '') {
      header('Location: ' . orolado_public_origin() . '/pay-done.html?ref=' . rawurlencode($ref));
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

  $payload = json_decode($raw, true);
  if (!is_array($payload)) {
    parse_str($raw, $payload);
  }
  if (!is_array($payload)) $payload = [];

  $hit = maketou_extract_payment($payload);
  if (!empty($_GET['ref']) && $hit['ref'] === '') $hit['ref'] = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $_GET['ref']);
  $ident = ($hit['ref'] !== '' || $hit['email'] !== '' || $hit['sellId'] !== '');
  if (!$ident || !$hit['paid']) {
    echo json_encode(['ok' => true, 'ignored' => true]);
    exit;
  }

  $result = credit_paid_deposit($hit);
  echo json_encode(['ok' => !empty($result['ok']), 'duplicate' => !empty($result['duplicate'])]);
}

