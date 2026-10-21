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

/** Champs de la fiche joueur que le téléphone ne peut jamais écrire (action « upsert »). */
function orolado_server_user_fields(): array {
  // « transactions » : la liste des opérations (dépôts, retraits, crédits) est écrite par le
  // serveur seul. Avant, le téléphone pouvait y glisser une FAUSSE demande de retrait, qui
  // s'affichait dans le tableau admin comme une vraie.
  // v2671 : 'clickFav' / 'clickUnfav' (compteurs anti-robot, trade_lib.php) — avant, chaque envoi du profil par le
  // téléphone les EFFAÇAIT (robot jamais repéré) et un tricheur pouvait y écrire de faux chiffres.
  // 2026-10-19 : 'clickFavDemo' / 'clickUnfavDemo' (mêmes compteurs, démo seulement, trade_lib.php).
  // 2026-10-20 : 'clickW' / 'clickW2' / 'clickWn' (même mesure pondérée par la mise, trade_lib.php).
  return ['sbId', 'lastDepositAmount', 'wagerLock', 'wagerNeed', 'requiredWagering', 'publicId', 'originalEmail', 'createdAt', 'emailHistory', 'country', 'countryIso', 'pwTag', 'transactions', 'deletedAt', 'lastOperator', 'clickFav', 'clickUnfav', 'clickFavDemo', 'clickUnfavDemo', 'clickW', 'clickW2', 'clickWn', 'devices'];
}

/** Compteurs d'argent tenus par le serveur seul (dépôts validés, trades réels réglés). */
function orolado_server_user_counters(): array {
  return ['realDepositTotal', 'realStakeVolume', 'totalWageredSinceDeposit', 'realTrades'];
}

/** Adresses officielles de Cloudflare (https://www.cloudflare.com/ips/). */
function orolado_cloudflare_ranges(): array {
  return [
    '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
    '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
    '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
    '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
    '2a06:98c0::/29', '2c0f:f248::/32',
  ];
}

function orolado_ip_in_cidr(string $ip, string $cidr): bool {
  [$net, $bits] = explode('/', $cidr) + [1 => ''];
  $a = @inet_pton($ip);
  $b = @inet_pton($net);
  if ($a === false || $b === false || strlen($a) !== strlen($b)) return false;
  $bits = (int) $bits;
  $bytes = intdiv($bits, 8);
  if (substr($a, 0, $bytes) !== substr($b, 0, $bytes)) return false;
  $rest = $bits % 8;
  if ($rest === 0) return true;
  $mask = (0xFF << (8 - $rest)) & 0xFF;
  return (ord($a[$bytes]) & $mask) === (ord($b[$bytes]) & $mask);
}

/**
 * Adresse du VISITEUR. Derrière Cloudflare, REMOTE_ADDR est l'adresse de Cloudflare (partagée
 * par des milliers de joueurs) : on prend alors CF-Connecting-IP, mais SEULEMENT si la demande
 * vient vraiment de Cloudflare (sinon n'importe qui pourrait inventer cet en-tête).
 */
function orolado_client_ip(): string {
  $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0');
  $cf = trim((string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''));
  if ($cf !== '' && filter_var($cf, FILTER_VALIDATE_IP) && filter_var($ip, FILTER_VALIDATE_IP)) {
    foreach (orolado_cloudflare_ranges() as $r) {
      if (orolado_ip_in_cidr($ip, $r)) { $ip = $cf; break; }
    }
  }
  $ip = preg_replace('/[^0-9a-fA-F:.]/', '', $ip);
  return $ip !== '' ? $ip : '0';
}

function orolado_login_throttle_map(): array {
  $f = orolado_data_dir() . '/login_throttle.json';
  if (!is_file($f)) return [];
  $j = json_decode((string) @file_get_contents($f), true);
  return is_array($j) ? $j : [];
}

function orolado_login_throttle_save(array $map): void {
  @file_put_contents(orolado_data_dir() . '/login_throttle.json', json_encode($map, JSON_UNESCAPED_UNICODE), LOCK_EX);
}

/**
 * Clé du compteur d'essais ratés. Joueurs : IP + e-mail visé. Beaucoup d'opérateurs mobiles
 * (Afrique surtout) font passer des milliers de clients par la MÊME adresse IP : compter par IP
 * seule bloquait tout un opérateur après 8 erreurs de quelques personnes. Le vol de compte par
 * essais reste bloqué (8 essais / 15 min par compte et par IP, + 30 / h par e-mail dans api.php).
 */
function orolado_login_key(string $scope, string $sub = ''): string {
  $key = $scope . ':' . orolado_client_ip();
  $sub = strtolower(trim($sub));
  return $sub === '' ? $key : $key . ':' . substr(hash('sha256', $sub), 0, 20);
}

function orolado_login_gate(string $scope = 'player', string $sub = ''): array {
  $max = 8;
  $window = 900;
  $key = orolado_login_key($scope, $sub);
  $all = orolado_login_throttle_map();
  $row = is_array($all[$key] ?? null) ? $all[$key] : ['n' => 0, 't' => 0];
  $t = (int) ($row['t'] ?? 0);
  $n = (int) ($row['n'] ?? 0);
  if ($t > 0 && (time() - $t) > $window) {
    $n = 0;
    $t = 0;
  }
  if ($n >= $max && $t > 0) {
    $wait = max(60, $window - (time() - $t));
    return ['ok' => false, 'reason' => 'Trop d’essais. Réessayez dans ' . (string) (int) ceil($wait / 60) . ' min.'];
  }
  return ['ok' => true];
}

function orolado_login_fail(string $scope = 'player', string $sub = ''): void {
  $key = orolado_login_key($scope, $sub);
  $all = orolado_login_throttle_map();
  $row = is_array($all[$key] ?? null) ? $all[$key] : ['n' => 0, 't' => 0];
  $t = (int) ($row['t'] ?? 0);
  $n = (int) ($row['n'] ?? 0);
  if ($t > 0 && (time() - $t) > 900) {
    $n = 0;
  }
  $all[$key] = ['n' => $n + 1, 't' => time()];
  if (count($all) > 4000) $all = array_slice($all, -2000, null, true);
  orolado_login_throttle_save($all);
}

/**
 * Limite anti-robot simple : au plus $max actions par $window secondes pour une clé
 * (IP, compte…). Fichier léger data/rate_<scope>.json, sous verrou, nettoyé au passage.
 */
/**
 * Signale un vrai problème au tableau admin (« Santé du Site »). Même fichier que les
 * alertes admin ; un même message n'est noté qu'une fois par heure.
 */
function orolado_health_event(string $service, string $message, string $level = 'error'): void {
  $file = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'admin_alerts.json';
  $fp = @fopen($file, 'c+');
  if (!$fp) return;
  flock($fp, LOCK_EX);
  $rows = json_decode((string) stream_get_contents($fp), true);
  if (!is_array($rows)) $rows = [];
  $sig = md5($service . '|' . $message . '|' . date('Y-m-d-H'));
  foreach ($rows as $r) {
    if (is_array($r) && ($r['sig'] ?? '') === $sig) { flock($fp, LOCK_UN); fclose($fp); return; }
  }
  array_unshift($rows, ['sig' => $sig, 'at' => date('c'), 'service' => $service, 'message' => $message, 'level' => $level]);
  $rows = array_slice($rows, 0, 400);
  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
}

function orolado_rate_ok(string $scope, string $key, int $max, int $window): bool {
  $scope = preg_replace('/[^a-z0-9_]/', '', strtolower($scope)) ?: 'x';
  $h = substr(hash('sha256', $key), 0, 24);
  // 16 petits fichiers par règle (selon l'empreinte de la clé) au lieu d'un gros fichier
  // relu et réécrit en entier à chaque requête : 16× moins d'attente et d'écriture.
  $path = orolado_data_dir() . '/rate_' . $scope . '__' . $h[0] . '.json';
  $fp = @fopen($path, 'c+');
  if (!$fp) return true;
  flock($fp, LOCK_EX);
  $all = json_decode((string) stream_get_contents($fp), true);
  if (!is_array($all)) $all = [];
  $now = time();
  foreach ($all as $k => $hits) {
    $all[$k] = array_values(array_filter((array) $hits, static fn($t) => (int) $t > $now - $window));
    if (!$all[$k]) unset($all[$k]);
  }
  $ok = count($all[$h] ?? []) < $max;
  if ($ok) $all[$h][] = $now;
  if (count($all) > 2000) $all = array_slice($all, -1000, null, true);
  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode($all));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  return $ok;
}

function orolado_login_ok(string $scope = 'player', string $sub = ''): void {
  $key = orolado_login_key($scope, $sub);
  $all = orolado_login_throttle_map();
  if (!isset($all[$key])) return;
  unset($all[$key]);
  orolado_login_throttle_save($all);
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
    // v2591 : 6 cryptos de plus en retrait (demande du propriétaire).
    'ltc' => 10.0, 'doge' => 10.0, 'usdc' => 10.0, 'ada' => 10.0, 'avax' => 10.0, 'matic' => 10.0,
    'opay' => 5.0, 'palmpay' => 5.0, 'wave' => 5.0, 'orange' => 5.0, 'mtn' => 5.0, 'mpesa' => 5.0,
    'moov' => 5.0, 'airtel' => 5.0, 'tmoney' => 5.0, 'celtiis' => 5.0, 'vodafone' => 5.0, 'mynita' => 5.0, 'pix' => 5.0, 'mercadopago' => 5.0, 'nequi' => 5.0,
    'gcash' => 5.0, 'upi' => 5.0, 'stcpay' => 10.0, 'picpay' => 10.0, 'papara' => 10.0,
    'paypal' => 25.0, 'skrill' => 25.0, 'neteller' => 25.0, 'card' => 25.0, 'bank' => 25.0,
    'revolut' => 30.0,
  ];
  return $map[$op] ?? 5.0;
}

/**
 * Plafond par dépôt : AUCUN par défaut (décision du propriétaire). Avant : 100 000 $ ; au-delà,
 * l'argent reçu n'était jamais crédité. Réglable via .env (OROLADO_MAX_DEPOSIT_USD) si besoin.
 */
function orolado_max_deposit_usd(): float {
  $v = getenv('OROLADO_MAX_DEPOSIT_USD');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_MAX_DEPOSIT_USD'] ?? '';
  return is_numeric($v) && (float) $v > 0 ? (float) $v : 0.0;
}

function orolado_deposit_over_cap(float $amount): bool {
  $cap = orolado_max_deposit_usd();
  return $cap > 0 && $amount > $cap;
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
  // Tests locaux uniquement (scripts/test-*.php) : fausse base Supabase, jamais en ligne.
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_HTTP']) && is_callable($GLOBALS['OROLADO_FAKE_HTTP'])) {
    return ($GLOBALS['OROLADO_FAKE_HTTP'])($url, $body, strtoupper($method));
  }
  if (!function_exists('curl_init')) return null;
  $ch = curl_init($url);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 12,
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

/** Écrit vaults.real en valeur absolue. Ne rappelle pas credit_real. */
function supabase_write_real_abs(string $userId, $amount): bool {
  $amount = orolado_money($amount);
  $hdrs = supabase_admin_headers();
  if (!$hdrs || $amount < 0) return false;
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return false;
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
    $again = supabase_admin_vault($userId);
  }
  if (!$again) return false;
  $got = orolado_money($again['real'] ?? 0);
  return abs($got - $amount) <= 0.05 || abs($got - round($amount)) <= 0.009;
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
  $before = supabase_admin_vault($userId);
  if (!$before) {
    // Coffre illisible : incrément RPC seulement. Une écriture absolue
    // recalculée depuis 0 écraserait le solde avec le seul montant du dépôt.
    $rpc = supabase_http($url . '/rest/v1/rpc/credit_real', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount], JSON_PRESERVE_ZERO_FRACTION), 'POST');
    if ($rpc === null) {
      $alt = supabase_http($url . '/rest/v1/rpc/increment_balance', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount], JSON_PRESERVE_ZERO_FRACTION), 'POST');
      if ($alt === null) error_log('OROLADO credit_real coffre illisible user=' . $userId);
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
    return;
  }
  $beforeReal = orolado_money($before['real'] ?? 0);
  $expect = orolado_money(max(0, $beforeReal + $amount));
  $rpc = supabase_http($url . '/rest/v1/rpc/credit_real', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount], JSON_PRESERVE_ZERO_FRACTION), 'POST');
  if ($rpc === null) {
    $alt = supabase_http($url . '/rest/v1/rpc/increment_balance', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount], JSON_PRESERVE_ZERO_FRACTION), 'POST');
    if ($alt === null) error_log('OROLADO credit_real/increment_balance échec user=' . $userId);
  }
  $after = supabase_admin_vault($userId);
  $afterReal = $after ? orolado_money($after['real'] ?? 0) : $beforeReal;
  if (!orolado_credit_landed($beforeReal, $afterReal, $amount)) {
    // Pas d'écriture « solde = X » (risque d'écraser une autre opération) : on prévient l'admin.
    error_log('OROLADO credit_real non persisté user=' . $userId . ' attendu=' . $expect);
    orolado_health_event('Caisse', 'Crédit de ' . $amount . ' $ non confirmé par la base (coffre ' . $userId . ') : vérifiez ce solde.');
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

/**
 * Crédit « une seule fois » garanti par la base (RPC resolve_trade : la clé est une clé
 * primaire, un 2e crédit avec la même clé est refusé, même simultané, même si le fichier
 * JSON a été réécrit entre-temps). Retour : ['real' => solde, 'duplicate' => bool] ou null.
 */
function orolado_vault_credit_once(string $payId, string $key, float $amount): ?array {
  if ($key === '' || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $payId)) return null;
  $hdrs = supabase_admin_headers();
  $url = rtrim(supabase_project_url(), '/');
  if (!$hdrs || $url === '') return null;
  $res = supabase_http($url . '/rest/v1/rpc/resolve_trade', $hdrs, json_encode([
    'p_user' => $payId, 'p_order' => $key, 'p_amount' => orolado_money(max(0, $amount)),
  ], JSON_PRESERVE_ZERO_FRACTION), 'POST');
  if (is_array($res) && isset($res[0]) && is_array($res[0])) $res = $res[0];
  if (!is_array($res) || empty($res['ok'])) return null;
  return ['real' => orolado_money($res['real'] ?? 0), 'duplicate' => !empty($res['duplicate'])];
}

/** Écrit le solde réel exact et vérifie la relecture. Sert aux moins (mise, perte) comme aux plus. */
function orolado_put_real_exact(string $userId, float $amount): ?float {
  $amount = orolado_money(max(0, $amount));
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return null;
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return null;
  $payload = json_encode(['real' => $amount, 'updated_at' => date('c')]);
  supabase_http(supabase_project_url() . '/rest/v1/vaults?user_id=eq.' . rawurlencode($userId), $hdrs, $payload, 'PATCH');
  $again = supabase_admin_vault($userId);
  if (!$again) return null;
  $got = orolado_money($again['real'] ?? 0);
  // Centimes (×1.88) OK ; si la colonne tronque encore, on accepte l’entier le plus proche.
  if (abs($got - $amount) <= 0.05) return $got;
  if (abs($got - round($amount)) <= 0.009) return $got;
  return null;
}

/** Le coffre a-t-il bien reçu un crédit (plus), même avec centimes / arrondi colonne ? */
function orolado_credit_landed(float $beforeReal, float $got, float $credit): bool {
  if ($credit <= 0.009) return true;
  $expect = orolado_money($beforeReal + $credit);
  if (abs($got - $expect) <= 0.05) return true;
  if (abs($got - round($expect)) <= 0.009) return true;
  // Hausse nette = le plus est passé (ne pas refuser pour 1–2 centimes).
  return $got > $beforeReal + 0.009;
}

function supabase_debit_real(string $userId, $amount): bool {
  $amount = orolado_money($amount);
  if ($amount <= 0) return true;
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return false;
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return false;
  $url = supabase_project_url();
  $before = supabase_admin_vault($userId);
  if (!$before) return false;
  $beforeReal = orolado_money($before['real'] ?? 0);
  if ($beforeReal + 0.009 < $amount) return false;
  $expect = orolado_money($beforeReal - $amount);
  $rpc = supabase_http($url . '/rest/v1/rpc/debit_real', $hdrs, json_encode(['p_user' => $userId, 'p_amount' => $amount]), 'POST');
  if (is_array($rpc) && isset($rpc[0]) && is_array($rpc[0])) $rpc = $rpc[0];
  if (is_array($rpc) && !empty($rpc['ok'])) return true;
  if (is_array($rpc) && isset($rpc['reason']) && $rpc['reason'] === 'insufficient') return false;
  // Réponse illisible : on relit seulement. Plus jamais d'écriture « solde = X » en secours :
  // deux opérations en même temps pouvaient s'écraser et fabriquer (ou effacer) de l'argent.
  $after = supabase_admin_vault($userId);
  $afterReal = $after ? orolado_money($after['real'] ?? 0) : $beforeReal;
  if (abs($afterReal - $expect) <= 0.009) return true;
  orolado_health_event('Caisse', 'Débit de ' . $amount . ' $ non confirmé par la base (coffre ' . $userId . ') : opération refusée, vérifiez ce solde.');
  return false;
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
    json_encode(['p_user' => $userId, 'p_order' => $orderId, 'p_amount' => $amount], JSON_PRESERVE_ZERO_FRACTION),
    'POST'
  );
  if (is_array($rpc) && isset($rpc[0]) && is_array($rpc[0])) $rpc = $rpc[0];
  if (!is_array($rpc) || empty($rpc['ok'])) return null;
  return [
    'real' => orolado_money($rpc['real'] ?? 0),
    'duplicate' => !empty($rpc['duplicate']),
  ];
}

/**
 * Le coffre a-t-il vraiment le montant attendu (centimes compris) ?
 */
function orolado_real_is(string $userId, float $expect): ?float {
  $row = supabase_admin_vault($userId);
  if (!$row) return null;
  $got = orolado_money($row['real'] ?? 0);
  if (abs($got - orolado_money($expect)) > 0.05) return null;
  return $got;
}

/**
 * Pose le solde exact. Si l’ajout RPC a coupé les centimes, on réécrit le total.
 * Ne réussit que si la relecture confirme le montant, centimes compris.
 */
function orolado_force_real_total(string $userId, float $expect): ?float {
  $expect = orolado_money(max(0, $expect));
  $got = orolado_real_is($userId, $expect);
  if ($got !== null) return $got;
  return orolado_put_real_exact($userId, $expect);
}

/**
 * UNE CAISSE : ne plus « rattraper » un JSON plus haut que Supabase.
 * (C’était une 2e écriture → dépôts ×2.) Gardée pour compat appels existants.
 */
function supabase_sync_real_min(string $userId, $minReal): void {
  return;
}

/** Écrit le solde réel vers Supabase (valeur absolue : hausse ET baisse). N’écrit jamais 0 par-dessus un coffre illisible. */
function supabase_set_real(string $userId, $amount): void {
  $amount = orolado_money($amount);
  if ($amount < 0) return;
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return;
  if (supabase_write_real_abs($userId, $amount)) return;
  $again = supabase_admin_vault($userId);
  $cur = $again ? orolado_money($again['real'] ?? 0) : 0.0;
  if ($amount <= 0.009 && $cur > 0.009) return;
  $delta = orolado_money($amount - $cur);
  if (abs($delta) > 0.009) supabase_credit_real($userId, $delta, false);
}

function supabase_touch_last_seen(string $userId): void {
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return;
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return;
  $url = rtrim(supabase_project_url(), '/');
  if ($url === '') return;
  supabase_http(
    $url . '/rest/v1/profiles?id=eq.' . rawurlencode($userId),
    $hdrs,
    json_encode(['last_seen' => date('c')], JSON_UNESCAPED_UNICODE),
    'PATCH'
  );
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
  // v2673 (propriétaire) : aussi ses APPAREILS et ses NUMÉROS DE RETRAIT → il ne peut plus revenir avec un autre compte.
  foreach ((array) ($user['devices'] ?? []) as $dv) {
    if (is_string($dv) && orolado_dev_ok($dv)) $db['blocked_identities']['dev:' . $dv] = $row;
  }
  foreach ((array) ($db['withdrawals'] ?? []) as $w) {
    if (!is_array($w) || (string) ($w['userId'] ?? '') !== $uid) continue;
    $k = orolado_dest_key((string) ($w['destination'] ?? $w['phone'] ?? ''));
    if ($k !== '') $db['blocked_identities']['dest:' . $k] = $row;
  }
}

/** v2673 — identifiant d'appareil envoyé par le site (js/api.js, « oro_dev ») : d + 16 à 40 chiffres hexa. */
function orolado_dev_ok(string $d): bool {
  return (bool) preg_match('/^d[a-f0-9]{16,40}$/', $d);
}

function orolado_req_dev(array $req): string {
  $d = strtolower(trim((string) ($req['dev'] ?? '')));
  return orolado_dev_ok($d) ? $d : '';
}

/** Numéro de retrait normalisé : 8 derniers chiffres (téléphone) ou adresse en minuscules (crypto…). */
function orolado_dest_key(string $d): string {
  $d = strtolower(trim($d));
  if ($d === '' || $d === '—') return '';
  if (preg_match('/^[+\d\s().-]{8,}$/', $d)) {
    $dig = preg_replace('/\D/', '', $d) ?? '';
    return strlen($dig) >= 8 ? 't' . substr($dig, -8) : '';
  }
  return strlen($d) >= 6 ? 'a' . $d : '';
}

/** Retient l'appareil sur la fiche du joueur (8 derniers), pour pouvoir le bloquer s'il est suspendu. */
function orolado_note_device(array &$db, string $uid, string $dev): bool {
  if ($uid === '' || $dev === '' || !isset($db['users'][$uid]) || !is_array($db['users'][$uid])) return false;
  $list = array_values(array_filter((array) ($db['users'][$uid]['devices'] ?? []), 'is_string'));
  if (in_array($dev, $list, true)) return false;
  $list[] = $dev;
  $db['users'][$uid]['devices'] = array_slice($list, -8);
  return true;
}

/**
 * v2673 — l'appareil ou le numéro de retrait appartient-il à un compte SUSPENDU (autre que $selfUid) ?
 * Liste des bannis + retraits des comptes déjà suspendus avant cette version.
 */
function orolado_trace_block(array $db, string $dev = '', string $dest = '', string $selfUid = ''): ?array {
  $ids = is_array($db['blocked_identities'] ?? null) ? $db['blocked_identities'] : [];
  $other = static fn($row): bool => is_array($row) && (string) ($row['uid'] ?? '') !== $selfUid;
  if ($dev !== '' && isset($ids['dev:' . $dev]) && $other($ids['dev:' . $dev])) return $ids['dev:' . $dev] + ['by' => 'appareil'];
  $k = orolado_dest_key($dest);
  if ($k === '') return null;
  if (isset($ids['dest:' . $k]) && $other($ids['dest:' . $k])) return $ids['dest:' . $k] + ['by' => 'numéro de retrait'];
  foreach ((array) ($db['withdrawals'] ?? []) as $w) {
    if (!is_array($w)) continue;
    $wu = (string) ($w['userId'] ?? '');
    if ($wu === '' || $wu === $selfUid) continue;
    if (orolado_dest_key((string) ($w['destination'] ?? $w['phone'] ?? '')) !== $k) continue;
    $kind = orolado_user_block_kind($db, $wu);
    if ($kind !== '') return ['uid' => $wu, 'kind' => $kind, 'by' => 'numéro de retrait'];
  }
  return null;
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
  // Seuls les comptes bloqués comptent : ceux trouvés par l'e-mail + ceux de la liste des bannis
  // (plus de parcours de tous les joueurs).
  $cands = orolado_users_by_email($db, $email);
  foreach (array_keys(orolado_map_array($db['bans'] ?? [])) as $bid) {
    $bu = $db['users'][(string) $bid] ?? null;
    if (is_array($bu)) $cands[(string) $bid] = $bu;
  }
  foreach ($cands as $u) {
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

/**
 * Anciennes adresses e-mail (remplacées par un changement d'adresse) : réservées pour toujours.
 * On ne peut plus s'inscrire, se connecter ni demander un code avec. Index « retired_emails »
 * (adresse => id du compte), rempli une fois depuis l'historique des joueurs puis à chaque changement.
 */
function orolado_retired_emails_sync(array &$db): bool {
  if (!empty($db['retired_emails_built']) && is_array($db['retired_emails'] ?? null)) return false;
  $idx = is_array($db['retired_emails'] ?? null) ? $db['retired_emails'] : [];
  foreach (orolado_map_array($db['users'] ?? []) as $id => $u) {
    if (!is_array($u) || empty($u['emailHistory']) || !is_array($u['emailHistory'])) continue;
    foreach ($u['emailHistory'] as $h) {
      $from = orolado_norm_email((string) (is_array($h) ? ($h['from'] ?? '') : ''));
      if ($from !== '' && !isset($idx[$from])) $idx[$from] = (string) ($u['id'] ?? $id);
    }
  }
  $db['retired_emails'] = $idx;
  $db['retired_emails_built'] = 1;
  return true;
}

function orolado_retire_email(array &$db, string $email, string $uid): void {
  orolado_retired_emails_sync($db);
  $email = orolado_norm_email($email);
  if ($email !== '') $db['retired_emails'][$email] = $uid;
}

/** Id du compte qui utilisait cette adresse avant de la changer, sinon ''. */
function orolado_retired_email_owner(array &$db, string $email): string {
  orolado_retired_emails_sync($db);
  $email = orolado_norm_email($email);
  if ($email === '' || !isset($db['retired_emails'][$email])) return '';
  // Si l'adresse est de nouveau l'adresse actuelle d'un compte, elle n'est plus « ancienne ».
  foreach (orolado_users_by_email($db, $email) as $u) {
    if (is_array($u) && orolado_norm_email((string) ($u['email'] ?? '')) === $email) return '';
  }
  return (string) $db['retired_emails'][$email];
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

/**
 * Tous les ids d'un même joueur : fiche courte (u…), fiche de la base (UUID), fiches au même
 * e-mail. Suspendre / supprimer doit toucher TOUTES ces fiches : avant, seule celle ouverte dans
 * l'admin était bloquée et le joueur, connecté par l'autre, continuait à jouer.
 */
function orolado_player_all_ids(array $db, string $uid, string $email = ''): array {
  $ids = function_exists('orolado_linked_balance_ids') ? orolado_linked_balance_ids($db, $uid) : [$uid];
  if (!in_array($uid, $ids, true)) array_unshift($ids, $uid);
  foreach ($ids as $id) {
    if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $id)) {
      foreach (array_keys(orolado_users_by_sb($db, (string) $id)) as $sid) $ids[] = (string) $sid;
    }
    $sb = strtolower(trim((string) ($db['users'][$id]['sbId'] ?? '')));
    if ($sb !== '') $ids[] = $sb;
  }
  $email = orolado_norm_email($email);
  if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    foreach (array_keys(orolado_users_by_email($db, $email)) as $eid) $ids[] = (string) $eid;
  }
  return array_values(array_filter(array_unique(array_map('strval', $ids)), static fn($i) => $i !== '' && $i !== 'admin_master'));
}

function orolado_force_suspend(array &$db, string $uid, string $kind = 'suspended', string $email = ''): void {
  if ($uid === '' || $uid === 'admin_master') return;
  $kind = $kind === 'deleted' ? 'deleted' : 'suspended';
  if (!isset($db['bans']) || !is_array($db['bans'])) $db['bans'] = [];
  $ids = orolado_player_all_ids($db, $uid, $email);
  if (!$ids) return;
  $hdrs = supabase_admin_headers();
  foreach ($ids as $id) {
    $db['bans'][$id] = ['at' => date('c'), 'kind' => $kind];
    if (isset($db['users'][$id]) && is_array($db['users'][$id])) {
      $u = $db['users'][$id];
      $orig = orolado_norm_email((string) ($u['originalEmail'] ?? $u['email'] ?? ''));
      if ($orig !== '' && !str_ends_with($orig, '@orolado.invalid')) {
        $db['users'][$id]['originalEmail'] = $orig;
      }
      $db['users'][$id]['role'] = $kind;
      orolado_remember_blocked_identity($db, $db['users'][$id], $kind);
    }
    if (function_exists('admin_kill_user_sessions')) {
      admin_kill_user_sessions($db, $id);
    }
    orolado_revoke_user_sessions($db, $id);
    orolado_kick_now($id);
    if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
      if ($hdrs) {
        supabase_http(
          rtrim(supabase_project_url(), '/') . '/rest/v1/profiles?id=eq.' . rawurlencode($id),
          $hdrs,
          json_encode(['role' => $kind]),
          'PATCH'
        );
      }
      supabase_force_logout($id);
    }
  }
  // Fiche absente du fichier local (joueur connu seulement de la base) : l'e-mail est quand même
  // mis sur la liste noire, sinon il pourrait se réinscrire.
  $email = orolado_norm_email($email);
  if ($email !== '' && !isset($db['blocked_identities']['email:' . $email])) {
    orolado_remember_blocked_identity($db, ['id' => $uid, 'email' => $email], $kind);
  }
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
    if (!orolado_session_alive($db['sessions'][$token])) return '';
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

/**
 * Ids liés au même joueur : `u_…` local + UUID Supabase + autres fiches même e-mail.
 * Évite solde à 0 quand les dépôts sont sur u_ et le coffre cloud sur UUID.
 */
function orolado_linked_balance_ids(array $db, string $uid): array {
  static $cache = [];
  $uid = (string) $uid;
  if ($uid === '') return [];
  if (isset($cache[$uid])) return $cache[$uid];
  $ids = [$uid];
  $uuid = function_exists('orolado_balance_uuid') ? orolado_balance_uuid($db, $uid) : '';
  if ($uuid !== '' && !in_array($uuid, $ids, true)) $ids[] = $uuid;
  $email = '';
  foreach ($ids as $id) {
    if (!isset($db['users'][$id]) || !is_array($db['users'][$id])) continue;
    $email = strtolower(trim((string) ($db['users'][$id]['email'] ?? '')));
    if ($email !== '') break;
  }
  if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    foreach (orolado_users_by_email($db, $email) as $id => $u) {
      if (strtolower(trim((string) ($u['email'] ?? ''))) !== $email) continue;
      $id = (string) $id;
      if ($id !== '' && !in_array($id, $ids, true)) $ids[] = $id;
    }
  }
  $cache[$uid] = $ids;
  return $ids;
}

/** Écrit le même solde réel sur toutes les clés vault liées (u_ + UUID). */
function orolado_mirror_vault_real(array &$db, string $uid, float $real): void {
  $real = orolado_money(max(0, $real));
  foreach (orolado_linked_balance_ids($db, $uid) as $id) {
    if ($id === '') continue;
    if (!isset($db['vault'][$id]) || !is_array($db['vault'][$id])) {
      $db['vault'][$id] = ['demo' => 1000000, 'real' => 0];
    }
    $db['vault'][$id]['real'] = $real;
  }
}

/** Anti-doublon crédits (admin double-clic / retry même minute). */
function orolado_cash_ops_dir(): string {
  $dir = rtrim(orolado_data_dir(), "/\\") . DIRECTORY_SEPARATOR . 'cash_ops';
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  return $dir;
}

function orolado_cash_op_get(string $opKey): ?array {
  $opKey = preg_replace('/[^a-zA-Z0-9_\-.:]/', '', $opKey) ?? '';
  if ($opKey === '') return null;
  $f = orolado_cash_ops_dir() . DIRECTORY_SEPARATOR . hash('sha256', $opKey) . '.json';
  if (!is_file($f)) return null;
  $j = json_decode((string) @file_get_contents($f), true);
  return is_array($j) ? $j : null;
}

function orolado_cash_op_put(string $opKey, array $payload): void {
  $opKey = preg_replace('/[^a-zA-Z0-9_\-.:]/', '', $opKey) ?? '';
  if ($opKey === '') return;
  $f = orolado_cash_ops_dir() . DIRECTORY_SEPARATOR . hash('sha256', $opKey) . '.json';
  @file_put_contents($f, json_encode($payload + ['at' => date('c'), 'key' => $opKey], JSON_UNESCAPED_UNICODE));
}

/** Somme à vie des dépôts validés (liste + compteur), jamais le premier seul. */
function orolado_user_deposit_total(array $db, string $uid, array $user = []): float {
  $ids = function_exists('orolado_linked_balance_ids') ? orolado_linked_balance_ids($db, $uid) : [$uid];
  if (!$ids) $ids = [$uid];
  $sum = 0.0;
  $seen = [];
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    $owner = (string) ($d['userId'] ?? $d['user_id'] ?? '');
    if ($owner === '' || !in_array($owner, $ids, true)) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st !== 'COMPLETED' && $st !== 'PAID') continue;
    $did = (string) ($d['id'] ?? $d['ref'] ?? '');
    if ($did !== '' && isset($seen[$did])) continue;
    if ($did !== '') $seen[$did] = true;
    $sum += orolado_money($d['amount'] ?? 0);
  }
  $field = orolado_money($user['realDepositTotal'] ?? 0);
  foreach ($ids as $id) {
    if (!isset($db['users'][$id]) || !is_array($db['users'][$id])) continue;
    $field = orolado_money(max($field, orolado_money($db['users'][$id]['realDepositTotal'] ?? 0)));
  }
  // Compteur seul sans aucune ligne de dépôt = fantôme (ex. 5.88 collé) : on ignore.
  if ($sum <= 0.009 && $field > 0.009) return 0.0;
  return orolado_money(max($sum, $field));
}

function orolado_completed_deposit_list(array $db, string $uid, array $user = []): array {
  $list = [];
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    $owner = (string) ($d['userId'] ?? $d['user_id'] ?? '');
    if ($uid === '' || $owner !== $uid) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st !== 'COMPLETED' && $st !== 'PAID') continue;
    $amt = orolado_money($d['amount'] ?? 0);
    if ($amt <= 0.009) continue;
    $list[] = [
      'amount' => $amt,
      'at' => (string) ($d['paidAt'] ?? $d['createdAt'] ?? $d['at'] ?? ''),
    ];
  }
  usort($list, function ($a, $b) {
    return strcmp((string) ($a['at'] ?? ''), (string) ($b['at'] ?? ''));
  });
  $sum = 0.0;
  foreach ($list as $row) $sum += (float) ($row['amount'] ?? 0);
  $field = orolado_money($user['realDepositTotal'] ?? 0);
  $gap = orolado_money($field - $sum);
  if ($gap > 0.009) {
    array_unshift($list, ['amount' => $gap, 'at' => '']);
  }
  return $list;
}

function orolado_wager_lock_fifo(array $deposits, float $done): float {
  $pool = orolado_money($done);
  $lock = 0.0;
  foreach ($deposits as $d) {
    $amt = orolado_money(is_array($d) ? ($d['amount'] ?? 0) : $d);
    if ($amt <= 0.009) continue;
    $need = orolado_money($amt * 2);
    if ($pool + 0.001 >= $need) {
      $pool = orolado_money($pool - $need);
    } else {
      $lock = orolado_money($lock + $amt);
      $pool = 0.0;
    }
  }
  return $lock;
}

function orolado_last_completed_deposit(array $db, string $uid): float {
  $last = 0.0;
  $lastAt = '';
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    $owner = (string) ($d['userId'] ?? $d['user_id'] ?? '');
    if ($uid === '' || $owner !== $uid) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st !== 'COMPLETED' && $st !== 'PAID') continue;
    $at = (string) ($d['paidAt'] ?? $d['createdAt'] ?? $d['at'] ?? '');
    if ($lastAt === '' || $at >= $lastAt) {
      $lastAt = $at;
      $last = orolado_money($d['amount'] ?? 0);
    }
  }
  return $last;
}

function orolado_user_real_wagered(array $db, array $user): float {
  $uid = (string) ($user['id'] ?? '');
  $fromUser = max(
    orolado_money($user['realStakeVolume'] ?? 0),
    orolado_money($user['totalWageredSinceDeposit'] ?? 0)
  );
  $ids = ($uid !== '' && function_exists('orolado_linked_balance_ids'))
    ? orolado_linked_balance_ids($db, $uid)
    : ($uid !== '' ? [$uid] : []);
  foreach ($ids as $id) {
    if (!isset($db['users'][$id]) || !is_array($db['users'][$id])) continue;
    $fromUser = max(
      $fromUser,
      orolado_money($db['users'][$id]['realStakeVolume'] ?? 0),
      orolado_money($db['users'][$id]['totalWageredSinceDeposit'] ?? 0)
    );
  }
  $fromOrders = 0.0;
  $seen = [];
  foreach (orolado_orders_recent($db, $ids ?: [$uid], 'real') as $o) {
    if (!is_array($o)) continue;
    $owner = (string) ($o['userId'] ?? $o['user_id'] ?? '');
    if ($owner === '' || ($ids && !in_array($owner, $ids, true)) || (!$ids && $owner !== $uid)) continue;
    $oid = (string) ($o['id'] ?? '');
    if ($oid !== '' && isset($seen[$oid])) continue;
    if ($oid !== '') $seen[$oid] = true;
    $mode = strtolower((string) ($o['mode'] ?? $o['accountType'] ?? $o['account_type'] ?? 'real'));
    if ($mode !== '' && $mode !== 'real') continue;
    $fromOrders += orolado_money($o['stake'] ?? $o['amount'] ?? 0);
  }
  return orolado_money(max($fromUser, $fromOrders));
}

function orolado_apply_wager_progress(array &$user, float $stake): void {
  if (!array_key_exists('wagerNeed', $user)) return;
  $need = orolado_money($user['wagerNeed']);
  if ($need <= 0.0001) return;
  $need = orolado_money(max(0.0, $need - orolado_money($stake)));
  $user['wagerNeed'] = $need;
  if ($need <= 0.0001) {
    $user['wagerNeed'] = 0.0;
    $user['wagerLock'] = 0.0;
  }
}

/** Premier dépôt : x2. Nouveau dépôt : seul ce montant est bloqué ; le déjà joué/gagné reste retirable. */
function orolado_wager_check(array $db, array $user, $balance = null): array {
  $uid = (string) ($user['id'] ?? '');
  $deposits = orolado_user_deposit_total($db, $uid, $user);
  $required = orolado_money($deposits * 2);
  $done = orolado_user_real_wagered($db, $user);
  $left = orolado_money(max(0.0, $required - $done));
  $ok = ($required <= 0.0001) || ($done + 0.0001 >= $required);
  if ($balance === null) {
    $balance = function_exists('orolado_official_real')
      ? orolado_official_real($db, $uid)
      : orolado_money($db['vault'][$uid]['real'] ?? 0);
  }
  $balance = orolado_money($balance);
  $list = orolado_completed_deposit_list($db, $uid, $user);
  $last = orolado_last_completed_deposit($db, $uid);
  if ($last <= 0 && isset($user['lastDepositAmount'])) $last = orolado_money($user['lastDepositAmount']);
  $old = orolado_money(max(0.0, $deposits - $last));
  $uncovered = orolado_money(max(0.0, $deposits - ($done / 2.0)));
  if ($ok) {
    $lockAmt = 0.0;
  } else if ($list) {
    $lockAmt = orolado_wager_lock_fifo($list, $done);
  } else if ($last > 0.009 && $old > 0.009 && ($done + 0.001 >= $old)) {
    $extra = orolado_money(max(0.0, $done - $old));
    $lockAmt = ($extra + 0.001 >= $last * 2) ? 0.0 : $last;
  } else {
    $lockAmt = $uncovered;
  }
  $locked = orolado_money(min($balance, max(0.0, $lockAmt)));
  $free = orolado_money(max(0.0, $balance - $locked));
  $slices = [];
  foreach ($list as $row) {
    $amt = orolado_money(is_array($row) ? ($row['amount'] ?? 0) : $row);
    if ($amt > 0.009) $slices[] = $amt;
  }
  return [
    'ok' => $ok,
    'canWithdraw' => $free > 0.009,
    'required' => $required,
    'done' => $done,
    'left' => $left,
    'deposits' => $deposits,
    'locked' => $locked,
    'free' => $free,
    'balance' => $balance,
    'last' => $last,
    'old' => $old,
    'slices' => $slices,
    'msg' => 'Vous devez miser x2 de votre dépôt avant de pouvoir effectuer un retrait.',
  ];
}

/** Ajustements admin (hors dépôts / paris / retraits déjà comptés ailleurs). */
function orolado_real_admin_adjustments(array $user): float {
  $adj = 0.0;
  foreach (($user['transactions'] ?? []) as $t) {
    if (!is_array($t)) continue;
    $mode = strtolower((string) ($t['mode'] ?? 'real'));
    if ($mode !== '' && $mode !== 'real') continue;
    $type = strtolower((string) ($t['type'] ?? ''));
    if (in_array($type, ['deposit', 'win', 'loss', 'void', 'withdraw', 'withdrawal'], true)) continue;
    $amt = orolado_money($t['amount'] ?? 0);
    if (in_array($type, ['credit', 'admin_credit', 'adjust', 'ajuste'], true)) $adj += abs($amt);
    if (in_array($type, ['debit', 'admin_debit'], true)) $adj -= abs($amt);
  }
  return orolado_money($adj);
}

/**
 * Grand livre réel : dépôts + crédits admin − retraits − mises ouvertes/réglées + gains/voids.
 * Null si aucune piste (pas de dépôt, pas d’ordre).
 */
function orolado_real_from_books(array $db, string $uid, array $user = []): ?float {
  if ($uid === '') return null;
  $ids = function_exists('orolado_linked_balance_ids') ? orolado_linked_balance_ids($db, $uid) : [$uid];
  if (!$ids) $ids = [$uid];
  if (!$user && isset($db['users'][$uid]) && is_array($db['users'][$uid])) $user = $db['users'][$uid];
  $deps = orolado_user_deposit_total($db, $uid, $user);
  $wd = 0.0;
  $wdSeen = [];
  foreach (($db['withdrawals'] ?? []) as $w) {
    if (!is_array($w)) continue;
    $owner = (string) ($w['userId'] ?? $w['user_id'] ?? '');
    if ($owner === '' || !in_array($owner, $ids, true)) continue;
    $st = strtolower((string) ($w['status'] ?? ''));
    if (!in_array($st, ['approved', 'paid', 'completed', 'success'], true)) continue;
    $wid = (string) ($w['id'] ?? '');
    if ($wid !== '' && isset($wdSeen[$wid])) continue;
    if ($wid !== '') $wdSeen[$wid] = true;
    $wd += orolado_money($w['amount'] ?? 0);
  }
  $stakes = 0.0;
  $credits = 0.0;
  $n = 0;
  $seen = [];
  foreach (orolado_orders_recent($db, $ids, 'real') as $o) {
    if (!is_array($o)) continue;
    $owner = (string) ($o['userId'] ?? $o['user_id'] ?? '');
    if ($owner === '' || !in_array($owner, $ids, true)) continue;
    $mode = strtolower((string) ($o['mode'] ?? $o['accountType'] ?? 'demo'));
    if ($mode !== 'real') continue;
    $oid = (string) ($o['id'] ?? '');
    if ($oid !== '' && isset($seen[$oid])) continue;
    if ($oid !== '') $seen[$oid] = true;
    $st = strtolower((string) ($o['status'] ?? ''));
    if (!in_array($st, ['open', 'won', 'lost', 'void', 'closed'], true)) continue;
    $stake = orolado_money($o['stake'] ?? 0);
    if ($stake <= 0.009) continue;
    $n++;
    $stakes += $stake;
    $payout = (float) ($o['payout'] ?? $o['payoutMult'] ?? 1.88);
    $voided = $st === 'void' || !empty($o['voided']);
    $won = !$voided && ($st === 'won' || !empty($o['won']));
    if ($voided) $credits += $stake;
    else if ($won) $credits += orolado_money($stake * $payout);
  }
  $adj = orolado_real_admin_adjustments($user);
  foreach ($ids as $id) {
    if ($id === $uid || !isset($db['users'][$id]) || !is_array($db['users'][$id])) continue;
    $adj = orolado_money($adj + orolado_real_admin_adjustments($db['users'][$id]));
  }
  if ($n === 0 && $deps <= 0.009 && abs($adj) <= 0.009 && $wd <= 0.009) return null;
  return orolado_money(max(0, $deps + $adj - $wd - $stakes + $credits));
}

/**
 * UNE CAISSE : si Supabase est lisible, son chiffre gagne toujours (même à 0).
 * JSON / books ne servent que si le coffre cloud est illisible.
 */
function orolado_pick_persisted_real(float $jsonReal, $sbReal, $books, bool $played): float {
  $jsonReal = orolado_money($jsonReal);
  if ($sbReal !== null) return orolado_money($sbReal);
  if (is_numeric($books) && orolado_money($books) > $jsonReal + 0.009) return orolado_money($books);
  return $jsonReal;
}

/** UUID Supabase du coffre réel. Un id local `u_…` est rattaché au profil du même e-mail. */
function orolado_balance_uuid(array $db, string $uid): string {
  if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uid)) return $uid;
  $email = '';
  if (isset($db['users'][$uid]) && is_array($db['users'][$uid])) {
    // Lien déjà connu (enregistré par orolado_ensure_balance_uuid) : pas d'appel réseau.
    $known = (string) ($db['users'][$uid]['sbId'] ?? '');
    if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $known)) return $known;
    $email = strtolower(trim((string) ($db['users'][$uid]['email'] ?? '')));
  }
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) return '';
  $hdrs = supabase_admin_headers();
  $url = rtrim(supabase_project_url(), '/');
  if (!$hdrs || $url === '') return '';
  $rows = supabase_http($url . '/rest/v1/profiles?email=eq.' . rawurlencode($email) . '&select=id', $hdrs);
  if (!is_array($rows) || !isset($rows[0]['id'])) return '';
  $id = (string) $rows[0]['id'];
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) return '';
  return $id;
}

/**
 * Comme orolado_balance_uuid, mais CRÉE le coffre Supabase s'il manque.
 * Cause : l'inscription « miroir » faite par le téléphone (signUp avec e-mail) est limitée
 * par Supabase à quelques inscriptions/heure ; beaucoup de joueurs n'ont donc pas de coffre
 * réel (admin : « joueur introuvable », trade réel : « coffre introuvable »).
 * Ici on passe par l'API admin (clé service, e-mail confirmé d'office, aucun e-mail envoyé,
 * donc aucune limite). Le trigger Supabase crée alors le profil et le coffre.
 * $password : si connu (connexion), le joueur pourra aussi se connecter à Supabase avec.
 * Le solde réel déjà noté en local est reporté UNE fois dans le nouveau coffre.
 */
function orolado_ensure_balance_uuid(string $uid, ?string $password = null): string {
  $db = load_db();
  $id = orolado_balance_uuid($db, $uid);
  $u = (isset($db['users'][$uid]) && is_array($db['users'][$uid])) ? $db['users'][$uid] : null;
  if ($id === '' && $u) {
    $email = strtolower(trim((string) ($u['email'] ?? '')));
    $hdrs = supabase_admin_headers();
    $url = rtrim(supabase_project_url(), '/');
    if ($hdrs && $url !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) && !str_ends_with($email, '.local') && !str_ends_with($email, '.invalid')) {
      $pw = ($password !== null && strlen($password) >= 6) ? $password : bin2hex(random_bytes(16));
      $made = supabase_http($url . '/auth/v1/admin/users', $hdrs, json_encode([
        'email' => $email,
        'password' => $pw,
        'email_confirm' => true,
        'user_metadata' => [
          'display_name' => (string) ($u['displayName'] ?? ''),
          'phone' => (string) ($u['phone'] ?? ''),
          'country_code' => (string) ($u['countryCode'] ?? '+225'),
        ],
      ], JSON_UNESCAPED_UNICODE), 'POST');
      $newId = is_array($made) ? (string) ($made['id'] ?? ($made['user']['id'] ?? '')) : '';
      if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $newId)) {
        // Déjà inscrit côté Supabase (e-mail existant) : on relit le profil.
        $newId = orolado_balance_uuid($db, $uid);
      }
      $id = $newId;
      if ($id !== '' && function_exists('orolado_ensure_sb_vault')) {
        orolado_ensure_sb_vault($id, 0.0);
        $local = orolado_money($db['vault'][$uid]['real'] ?? 0);
        // Plafond de sécurité : jamais plus que (dépôts payés − retraits payés) du joueur.
        $paidIn = function_exists('orolado_user_deposit_total') ? orolado_user_deposit_total($db, $uid, $u) : 0.0;
        $paidOut = 0.0;
        foreach (($db['withdrawals'] ?? []) as $w) {
          if (!is_array($w) || (string) ($w['userId'] ?? '') !== $uid) continue;
          if (in_array(strtolower((string) ($w['status'] ?? '')), ['approved', 'paid', 'completed', 'success', 'pending'], true)) {
            $paidOut += orolado_money($w['amount'] ?? 0);
          }
        }
        $local = orolado_money(min($local, max(0.0, $paidIn - $paidOut)));
        if ($local > 0.009 && function_exists('orolado_trade_credit_once')) {
          orolado_trade_credit_once($id, 'migrate_' . $uid, $local);
        }
      }
    }
  }
  if ($id !== '' && $u && (string) ($u['sbId'] ?? '') !== $id) {
    with_db_lock(function ($box) use ($uid, $id) {
      if (!isset($box->db['users'][$uid]) || !is_array($box->db['users'][$uid])) return ['ok' => true, 'skip_write' => true];
      $box->db['users'][$uid]['sbId'] = $id;
      return ['ok' => true];
    });
  }
  return $id;
}

/**
 * UNE CAISSE : lecture seule. Aligne le miroir JSON, n’écrit JAMAIS vers Supabase.
 */
function orolado_sync_official_real(string $uid, float $jsonReal): float {
  $jsonReal = orolado_money($jsonReal);
  // Id déjà au format Supabase : orolado_balance_uuid le rend tel quel sans regarder le fichier → pas de relecture
  // complète de orolado.json (2026-10-20, tenue de charge : « me » toutes les 20 s par joueur).
  if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uid)) {
    $uuid = $uid;
  } else {
    $db = function_exists('load_db') ? load_db() : [];
    if (!is_array($db)) $db = [];
    $uuid = orolado_balance_uuid($db, $uid);
  }
  $look = $uuid !== '' ? supabase_vault_lookup($uuid) : ['state' => 'skip', 'real' => 0.0];
  $state = (string) ($look['state'] ?? 'skip');
  $GLOBALS['OROLADO_VAULT_READ_OK'] = $state === 'ok';
  if ($state === 'error' || $state === 'skip') return $jsonReal;
  if ($state === 'ok') return orolado_money($look['real'] ?? 0);
  // missing : pas d’invention depuis books/json
  return 0.0;
}

function orolado_trade_credit(bool $won, bool $voided, float $stake, float $payout): float {
  if ($voided) return orolado_money($stake);
  if ($won) return orolado_money($stake * $payout);
  return 0.0;
}

function orolado_odds_key($payout): string {
  $n = (float) $payout;
  if (abs($n - 1.9) < 0.001) return '1.9';
  if (abs($n - 1.88) < 0.001) return '1.88';
  if (abs($n - 5.0) < 0.001) return '5';
  if (abs($n - 10.0) < 0.001) return '10';
  if ($n >= 40) return '50';
  return '1.88';
}

function orolado_wd_is_hidden_from_player(array $w): bool {
  $st = strtolower(trim((string) ($w['status'] ?? '')));
  return !empty($w['adminHidden']) || !empty($w['playerHidden'])
    || in_array($st, ['silenced', 'silent', 'hidden', 'deleted'], true);
}

function orolado_official_real(array $db, string $uid): float {
  $uuid = orolado_balance_uuid($db, $uid);
  $json = orolado_money($db['vault'][$uid]['real'] ?? 0);
  if ($uuid !== '' && $uuid !== $uid) {
    $json = orolado_money(max($json, $db['vault'][$uuid]['real'] ?? 0));
  }
  $sb = $uuid !== '' ? supabase_admin_vault($uuid) : null;
  $sbReal = $sb ? orolado_money($sb['real'] ?? 0) : null;
  if ($sbReal === null) return $json;
  $booksId = $uuid !== '' ? $uuid : $uid;
  $user = (isset($db['users'][$booksId]) && is_array($db['users'][$booksId])) ? $db['users'][$booksId] : [];
  if (!$user && isset($db['users'][$uid]) && is_array($db['users'][$uid])) $user = $db['users'][$uid];
  $played = orolado_user_real_wagered($db, $user + ['id' => $booksId]) > 0.009;
  $books = function_exists('orolado_real_from_books') ? orolado_real_from_books($db, $booksId, $user) : null;
  if ($books === null && $booksId !== $uid && function_exists('orolado_real_from_books')) {
    $books = orolado_real_from_books($db, $uid, $user);
  }
  return orolado_pick_persisted_real($json, $sbReal, $books, $played);
}

/**
 * UNE CAISSE : plus de réécriture inventée (dépôts/books → Supabase).
 * Lecture seule du solde officiel.
 */
function orolado_recover_wiped_real(array &$db, string $uid, array $user = []): float {
  return orolado_official_real($db, $uid);
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
  $payId = $uid;
  if (function_exists('orolado_balance_uuid')) {
    $resolved = orolado_balance_uuid($db, $uid);
    if ($resolved !== '') $payId = $resolved;
  }
  $sbCur = supabase_admin_vault($payId);
  $cur = $sbCur ? orolado_money($sbCur['real'] ?? 0) : orolado_official_real($db, $uid);
  if ($delta < 0 && $cur + $delta < -0.009) {
    return ['ok' => false, 'reason' => 'Solde insuffisant', 'real' => $cur];
  }
  if ($delta > 0) {
    supabase_credit_real($payId, $delta, false);
  } else if (!supabase_debit_real($payId, abs($delta))) {
    return ['ok' => false, 'reason' => 'Solde insuffisant', 'real' => $cur];
  }
  $again = supabase_admin_vault($payId);
  $next = $again ? orolado_money($again['real'] ?? 0) : orolado_money(max(0, $cur + $delta));
  $expect = orolado_money(max(0, $cur + $delta));
  // Écart possible si le joueur tradait au même moment : c'est normal, on garde le chiffre de la
  // base (plus d'écriture « solde = X » qui effacerait son trade).
  if ($again && abs($next - $expect) > 0.05) error_log('OROLADO ledger_apply écart user=' . $uid . ' attendu=' . $expect . ' lu=' . $next);
  if (function_exists('orolado_mirror_vault_real')) orolado_mirror_vault_real($db, $uid, $next);
  else $db['vault'][$uid]['real'] = $next;
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
      $db['users'][$uid]['requiredWagering'] = orolado_money(($db['users'][$uid]['realDepositTotal'] ?? 0) * 2);
      $db['users'][$uid]['lastDepositAmount'] = orolado_money($delta);
      $db['users'][$uid]['wagerLock'] = orolado_money(($db['users'][$uid]['wagerLock'] ?? 0) + $delta);
      $db['users'][$uid]['wagerNeed'] = orolado_money(($db['users'][$uid]['wagerNeed'] ?? 0) + ($delta * 2));
    }
    supabase_insert_deposit([
      'id' => $ref,
      'user_id' => orolado_balance_uuid($db, $uid),
      'amount' => $delta,
      'status' => 'COMPLETED',
      'operator' => 'admin',
      'reference' => $ref,
    ]);
    $hdrsProf = supabase_admin_headers();
    if ($hdrsProf) {
      supabase_http(
        rtrim(supabase_project_url(), '/') . '/rest/v1/profiles?id=eq.' . rawurlencode($uid),
        $hdrsProf,
        json_encode([
          'real_deposit_total' => $db['users'][$uid]['realDepositTotal'] ?? $delta,
          'updated_at' => date('c'),
        ], JSON_UNESCAPED_UNICODE),
        'PATCH'
      );
    }
  }
    if (isset($db['users'][$uid]) && is_array($db['users'][$uid])) {
      if (!isset($db['users'][$uid]['transactions']) || !is_array($db['users'][$uid]['transactions'])) {
        $db['users'][$uid]['transactions'] = [];
      }
      array_unshift($db['users'][$uid]['transactions'], [
        'id' => 'adj_' . bin2hex(random_bytes(4)),
        'at' => date('c'),
        'type' => ($asDeposit && $delta > 0) ? 'deposit' : ($delta >= 0 ? 'credit' : 'debit'),
        'amount' => abs($delta),
        'note' => $note,
        'mode' => 'real',
        'status' => 'COMPLETED',
      ]);
      if (count($db['users'][$uid]['transactions']) > 1500) {
        $db['users'][$uid]['transactions'] = array_slice($db['users'][$uid]['transactions'], 0, 1500);
      }
    }
  return ['ok' => true, 'real' => $next, 'delta' => $delta];
}

function orolado_refund_wd_once(array &$db, array &$w): bool {
  if (!empty($w['refunded'])) return false;
  $uid = (string) ($w['userId'] ?? $w['user_id'] ?? '');
  $amt = orolado_money(abs((float) ($w['amount'] ?? 0)));
  if ($uid === '' || $amt <= 0) {
    $w['refundedAt'] = date('c');
    $w['refunded'] = true;
    return false;
  }
  // Une seule fois, même si l'admin clique 2 fois en même temps : la clé « wdr_ » est unique en base.
  $payId = orolado_balance_uuid($db, $uid);
  $once = ($payId !== '' && !empty($w['id'])) ? orolado_vault_credit_once($payId, 'wdr_' . $w['id'], $amt) : null;
  if ($once !== null) {
    orolado_mirror_vault_real($db, $uid, (float) $once['real']);
    $w['refundedAt'] = date('c');
    $w['refunded'] = true;
    $w['refundReal'] = $once['real'];
    return !$once['duplicate'];
  }
  if ($payId !== '') {
    // Base injoignable : rien n'est marqué remboursé, l'admin pourra recliquer sans risque.
    orolado_health_event('Retraits', 'Remboursement du retrait ' . ($w['id'] ?? '') . ' (' . $amt . ' $) non passé : base injoignable, recliquez plus tard.');
    return false;
  }
  $res = orolado_ledger_apply($db, $uid, $amt, 'Remboursement retrait refusé', false);
  $w['refundedAt'] = date('c');
  $w['refunded'] = !empty($res['ok']);
  $w['refundReal'] = $res['real'] ?? null;
  return !empty($res['ok']);
}

function supabase_insert_deposit(array $row): void {
  // La table Supabase « deposits » n'accepte qu'un identifiant UUID : un joueur encore sans coffre
  // Supabase (identifiant local « u_… ») est ignoré ici (le dépôt reste dans data/ et sera recopié
  // avec le bon UUID au moment du crédit, cf. credit_paid_deposit). Avant : erreur 400 « 22P02 ».
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) ($row['user_id'] ?? ''))) return;
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

/** Crée le coffre Supabase s’il manque (comme l’admin). Sans UUID → null. */
function orolado_ensure_sb_vault(string $userId, float $minReal = 0.0): ?array {
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return null;
  $v = supabase_admin_vault($userId);
  if ($v) return $v;
  $hdrs = supabase_admin_headers();
  $url = rtrim(supabase_project_url(), '/');
  if (!$hdrs || $url === '') return null;
  supabase_http($url . '/rest/v1/vaults', $hdrs, json_encode([
    'user_id' => $userId,
    'real' => orolado_money(max(0, $minReal)),
    'demo' => 1000000,
    'updated_at' => date('c'),
  ], JSON_UNESCAPED_UNICODE), 'POST');
  return supabase_admin_vault($userId);
}

/** ok = coffre lu, missing = pas de ligne, error = lecture impossible, skip = id non UUID. */
function supabase_vault_lookup(string $userId): array {
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) {
    return ['state' => 'skip', 'real' => 0.0, 'demo' => 0.0];
  }
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return ['state' => 'error', 'real' => 0.0, 'demo' => 0.0];
  $rows = supabase_http(supabase_project_url() . '/rest/v1/vaults?user_id=eq.' . rawurlencode($userId) . '&select=demo,real', $hdrs);
  if ($rows === null) return ['state' => 'error', 'real' => 0.0, 'demo' => 0.0];
  if (!isset($rows[0]) || !is_array($rows[0])) return ['state' => 'missing', 'real' => 0.0, 'demo' => 0.0];
  return [
    'state' => 'ok',
    'demo' => orolado_money($rows[0]['demo'] ?? 0),
    'real' => orolado_money($rows[0]['real'] ?? 0),
  ];
}

function supabase_admin_vault(string $userId): ?array {
  $look = supabase_vault_lookup($userId);
  if (($look['state'] ?? '') !== 'ok') return null;
  return ['demo' => orolado_money($look['demo'] ?? 0), 'real' => orolado_money($look['real'] ?? 0)];
}

function supabase_order_id_ok(string $orderId): bool {
  return $orderId !== '' && (bool) preg_match('/^[a-zA-Z0-9_\-.]+$/', $orderId);
}

/** Enregistre un ordre réel dans Supabase (indépendant du JSON Hostinger). */
function supabase_put_order(string $userId, array $order): bool {
  $hdrs = supabase_admin_headers();
  if (!$hdrs) return false;
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return false;
  $id = preg_replace('/[^a-zA-Z0-9_\-.]/', '', (string) ($order['id'] ?? ''));
  if (!supabase_order_id_ok($id)) return false;
  $won = array_key_exists('won', $order) ? $order['won'] : null;
  $row = [
    'id' => $id,
    'user_id' => $userId,
    'asset_id' => preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($order['asset_id'] ?? 'v100')) ?: 'v100',
    'side' => (($order['side'] ?? '') === 'put') ? 'put' : 'call',
    'stake' => orolado_money($order['stake'] ?? 0),
    'duration' => (int) ($order['duration'] ?? 10),
    'mode' => (($order['mode'] ?? '') === 'real') ? 'real' : 'demo',
    'payout' => (float) ($order['payout'] ?? 1.88),
    'status' => (string) ($order['status'] ?? 'open'),
  ];
  if (isset($order['entry_price'])) $row['entry_price'] = (float) $order['entry_price'];
  if (array_key_exists('exit_price', $order) && $order['exit_price'] !== null) $row['exit_price'] = (float) $order['exit_price'];
  if ($won !== null) $row['won'] = (bool) $won;
  if (array_key_exists('net', $order) && $order['net'] !== null) $row['net'] = orolado_money($order['net']);
  $url = rtrim(supabase_project_url(), '/');
  $insHdrs = [
    'Content-Type: application/json',
    'apikey: ' . supabase_service_key(),
    'Authorization: Bearer ' . supabase_service_key(),
    'Prefer: resolution=merge-duplicates,return=minimal',
  ];
  $res = supabase_http($url . '/rest/v1/orders?on_conflict=id', $insHdrs, json_encode($row, JSON_UNESCAPED_UNICODE), 'POST');
  if ($res !== null) return true;
  $patchHdrs = [
    'Content-Type: application/json',
    'apikey: ' . supabase_service_key(),
    'Authorization: Bearer ' . supabase_service_key(),
    'Prefer: return=minimal',
  ];
  $patch = supabase_http(
    $url . '/rest/v1/orders?id=eq.' . rawurlencode($id) . '&user_id=eq.' . rawurlencode($userId),
    $patchHdrs,
    json_encode($row, JSON_UNESCAPED_UNICODE),
    'PATCH'
  );
  return $patch !== null;
}

function supabase_get_order(string $userId, string $orderId): ?array {
  $hdrs = supabase_admin_headers();
  $id = preg_replace('/[^a-zA-Z0-9_\-.]/', '', $orderId);
  if (!$hdrs || !supabase_order_id_ok($id)) return null;
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $userId)) return null;
  $rows = supabase_http(
    rtrim(supabase_project_url(), '/') . '/rest/v1/orders?id=eq.' . rawurlencode($id) . '&user_id=eq.' . rawurlencode($userId) . '&select=id,status,stake,payout,mode,won,net,side,duration,asset_id,entry_price&limit=1',
    $hdrs
  );
  if (!is_array($rows) || !isset($rows[0]) || !is_array($rows[0])) return null;
  return $rows[0];
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
  if (is_array($rpc) && !empty($rpc['duplicate'])) return $rpc;
  if (is_array($rpc) && !empty($rpc['ok'])) {
    $credited = orolado_money($rpc['amount'] ?? 0);
    if ($amount > 0.0001 && $userId !== '' && $credited + 0.05 < $amount) {
      supabase_credit_real($userId, orolado_money($amount - $credited), false);
    }
    return $rpc;
  }
  // L'ancienne fonction SQL refuse tout montant < 100 (plancher FCFA).
  // Un dépôt USD de 5 à 99 doit quand même créditer le coffre, une seule fois.
  if ($amount > 0.0001 && $userId !== '') {
    supabase_credit_real($userId, $amount, false);
    supabase_patch_deposit($ref, ['status' => 'COMPLETED', 'completed_at' => date('c'), 'amount' => $amount]);
    return ['ok' => true, 'amount' => $amount, 'user_id' => $userId, 'fallback' => true];
  }
  if (is_array($rpc) && isset($rpc['reason']) && $rpc['reason'] !== 'unknown') return $rpc;
  return is_array($rpc) ? $rpc : ['ok' => false, 'reason' => 'credit'];
}

/** Joueur du site ayant cet e-mail (actuel ou d'origine), ou null. */
function find_user_any(array $db, string $email): ?array {
  foreach (orolado_users_by_email($db, $email) as $u) return $u;
  return null;
}

function orolado_session_user(array &$db, ?string $token): ?array {
  if (!$token) return null;
  $token = trim((string) $token);
  if ($token === '') return null;
  if (!isset($db['sessions']) || !orolado_is_map($db['sessions'])) $db['sessions'] = [];
  if (!isset($db['users']) || !orolado_is_map($db['users'])) $db['users'] = [];
  if (!isset($db['bans']) || !is_array($db['bans'])) $db['bans'] = [];
  // Accès direct à la connexion (avant : parcours de toutes les connexions à chaque clic).
  $directSess = $db['sessions'][$token] ?? null;
  foreach (is_array($directSess) ? [$token => $directSess] : [] as $sid => $sess) {
    if (!orolado_session_alive($sess)) return null;
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
    // SÉCURITÉ : un compte créé directement chez Supabase (en contournant le site) n'ouvre pas
    // de compte ici si son e-mail n'est pas confirmé, ou si cet e-mail appartient déjà à un
    // joueur du site (sinon : compte en double au nom d'un autre, risque de lien vers sa caisse).
    if (empty($sb['email_confirmed_at']) && empty($sb['confirmed_at'])) return null;
    if ($email === '' || find_user_any($db, $email) !== null) return null;
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
  if ($uid === '' || !isset($db['sessions']) || !orolado_is_map($db['sessions'])) return;
  foreach (orolado_sessions_of_user($db, $uid) as $sid => $sess) {
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

/**
 * Durée d'une connexion : 5 ANS sans visite (chaque visite la prolonge) — v2601, décision du propriétaire :
 * un joueur reste connecté pratiquement « à vie » tant qu'il ne se déconnecte pas (beaucoup oublient leur
 * mot de passe). Un retrait demande toujours le code reçu par e-mail. Avant : 30 jours (et encore avant : 100 ans).
 */
function orolado_session_ttl(): int {
  return 5 * 365 * 24 * 60 * 60;
}

/** Une session est vivante si le joueur est venu dans les 5 dernières années. */
function orolado_session_alive($sess): bool {
  if (!is_array($sess)) return false;
  $now = time();
  $exp = (int) ($sess['exp'] ?? 0);
  if ($exp > 0 && $exp < $now) return false;
  $at = strtotime((string) ($sess['at'] ?? '')) ?: 0;
  if ($at > 0 && $at + orolado_session_ttl() < $now) return false;
  return true;
}

/** Retire les sessions mortes (le fichier ne grossit plus pour toujours). */
function orolado_prune_sessions(array &$db, bool $all = false): int {
  $n = 0;
  if (($db['sessions'] ?? null) instanceof OroladoMap) {
    // Fiches : on balaie un seul des 256 sous-dossiers à chaque fois (rapide même avec 1 million
    // de connexions ; en quelques centaines de passages, tout est nettoyé). $all : tout d'un coup.
    return orolado_store_sweep($db, 'sessions', static fn($s) => !orolado_session_alive($s), $all);
  }
  foreach (($db['sessions'] ?? []) as $tok => $sess) {
    if (!orolado_session_alive($sess)) { unset($db['sessions'][$tok]); $n++; }
  }
  return $n;
}

/**
 * Mot de passe admin = celui mis dans les réglages de l'hébergeur (.env : ADMIN_PASSWORD).
 * Dès qu'il existe, l'ancien mot de passe écrit dans le code NE MARCHE PLUS (ni en clair, ni
 * via l'ancienne empreinte : l'empreinte est refaite au premier passage).
 * Tant qu'il n'est pas réglé, l'ancien reste accepté pour ne pas bloquer l'accès.
 */
function orolado_master_admin_password(): string {
  $env = trim((string) (getenv('ADMIN_PASSWORD') ?: ($_ENV['ADMIN_PASSWORD'] ?? '')));
  return $env !== '' ? $env : 'AdminOrolado2026!';
}

/** Vrai si le mot de passe admin vient bien des réglages de l'hébergeur (et plus du code). */
function orolado_admin_password_from_env(): bool {
  return trim((string) (getenv('ADMIN_PASSWORD') ?: ($_ENV['ADMIN_PASSWORD'] ?? ''))) !== '';
}

function orolado_admin_plain_passwords(): array {
  return [orolado_master_admin_password()];
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
  // Recherche EXACTE du compte Supabase par e-mail (avant : seulement parmi les 200 premiers
  // inscrits → pour les autres, l'ancien mot de passe restait valable côté Supabase).
  $ids = [];
  $rows = supabase_http($url . '/rest/v1/profiles?email=eq.' . rawurlencode($email) . '&select=id', $hdrs);
  foreach ((array) $rows as $row) {
    if (is_array($row) && !empty($row['id'])) $ids[] = (string) $row['id'];
  }
  $db = load_db();
  foreach (orolado_users_by_email($db, $email) as $u) {
    if (strtolower(trim((string) ($u['email'] ?? ''))) !== $email) continue;
    if (!empty($u['sbId'])) $ids[] = (string) $u['sbId'];
  }
  foreach (array_unique($ids) as $id) {
    if (isset($done[$id]) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) continue;
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
  foreach (orolado_users_by_email($db, $email) as $id => $u) {
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
  // Accès direct (avant : parcours de TOUS les joueurs à chaque clic de chaque joueur).
  if (isset($db['users']['admin_master']) && is_array($db['users']['admin_master'])) {
    $admin = $db['users']['admin_master'];
  } else {
    foreach (orolado_users_by_email($db, $email) as $id => $u) {
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
    // Empreinte refaite seulement quand le mot de passe change (avant : un calcul lent bcrypt à
    // CHAQUE appel de l'API, pour chaque joueur).
    $pwTag = hash('sha256', 'orolado-admin|' . $master);
    if ((string) ($admin['pwTag'] ?? '') !== $pwTag) {
      $admin['passwordHash'] = orolado_hash_password($master);
      $admin['pwTag'] = $pwTag;
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
  unset($user['passwordHash'], $user['password'], $user['is_admin'], $user['pwTag']);
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

/*
 * 2026-10-20 (tenue de charge, mesuré en local : 100 joueurs, orolado.json de 2 Mo → verrou attendu jusqu'à 17 s,
 * tout le site bloqué) : deux corrections SANS changer les données ni leur format.
 *
 * 1) File d'attente des écritures (« tourniquet », fichier orolado.json.turn) : avant, une écriture (trade, règlement…)
 *    attendait que PLUS PERSONNE ne lise le fichier ; avec des dizaines de lecteurs qui se relaient, elle pouvait attendre
 *    sans fin (toutes les demandes s'empilaient, puis expiraient). Maintenant, une écriture qui attend passe avant les
 *    NOUVELLES lectures : les lectures en cours finissent, l'écriture passe, puis les lectures reprennent.
 *    Le verrou de orolado.json reste exactement le même (une ancienne copie du code, pendant une mise en ligne, reste
 *    donc protégée comme avant). L'attente au tourniquet est limitée (5 s) : il ne peut jamais bloquer le site.
 * 2) Décodage mémorisé pendant la demande : relire le MÊME contenu ne le redécode pas (« me » le décodait 2 à 5 fois).
 */
/** Passage au tourniquet. Lecteur (LOCK_SH) : passe et repart (null). Écrivain (LOCK_EX) : le garde (rendu par l'appelant). */
function orolado_db_turn_wait(string $file, int $mode) {
  $t = @fopen($file . '.turn', 'c') ?: @fopen($file . '.turn', 'r'); // 'r' : fichier créé par un autre utilisateur
  if (!$t) return null;
  $until = microtime(true) + 5.0;
  $pause = 500;
  while (!flock($t, $mode | LOCK_NB)) {
    if (microtime(true) > $until) { fclose($t); return null; } // jamais bloquant : on continue comme avant
    usleep($pause);
    $pause = min(4000, $pause * 2);
  }
  if ($mode !== LOCK_EX) { flock($t, LOCK_UN); fclose($t); return null; }
  return $t;
}

/** Verrou d'ÉCRITURE de orolado.json (même verrou qu'avant, plus la priorité sur les nouvelles lectures). */
function orolado_db_lock_ex($fp, string $file): void {
  $t = orolado_db_turn_wait($file, LOCK_EX);
  flock($fp, LOCK_EX);
  if ($t) { flock($t, LOCK_UN); fclose($t); }
}

/** Verrou de LECTURE de orolado.json : attend d'abord qu'une écriture en attente soit passée. */
function orolado_db_lock_sh($fp, string $file): void {
  orolado_db_turn_wait($file, LOCK_SH);
  flock($fp, LOCK_SH);
}

/** json_decode du fichier, mémorisé : même contenu (octet pour octet) → même résultat, sans redécoder. */
function orolado_db_decode(string $file, $raw) {
  $raw = is_string($raw) ? $raw : '';
  $m = $GLOBALS['OROLADO_DB_DECODED'][$file] ?? null;
  if (is_array($m) && $m[0] === $raw) return $m[1];
  $data = json_decode($raw, true);
  $GLOBALS['OROLADO_DB_DECODED'][$file] = [$raw, $data];
  return $data;
}

function load_db(?string $file = null): array {
  $file = $file ?: orolado_data_file();
  $data = null;
  if (is_file($file)) {
    $fp = fopen($file, 'r');
    if ($fp) {
      orolado_db_lock_sh($fp, $file);
      $raw = stream_get_contents($fp);
      flock($fp, LOCK_UN);
      fclose($fp);
      $data = orolado_db_decode($file, $raw);
    }
  }
  $core = is_array($data) ? array_merge(blank_db(), $data) : blank_db();
  // Ancien format (joueurs dans orolado.json) : passage aux fiches, une seule fois.
  if (orolado_store_has_legacy($core)) $core = orolado_store_migrate_file($file);
  $core = orolado_store_core($core);
  // Photo de départ de la requête (1re lecture) : sert à save_db pour ne jamais effacer
  // ce qu'une autre requête a ajouté entre-temps (voir orolado_db_merge3).
  if (!isset($GLOBALS['OROLADO_DB_BASE'][$file])) $GLOBALS['OROLADO_DB_BASE'][$file] = $core;
  return orolado_store_attach($core, $file);
}

function orolado_store_has_legacy(array $core): bool {
  foreach (orolado_store_maps() as $m) {
    if (isset($core[$m]) && is_array($core[$m]) && $core[$m] !== []) return true;
  }
  return false;
}

/** Passage aux fiches sous verrou (au cas où deux requêtes arrivent en même temps). */
function orolado_store_migrate_file(string $file): array {
  $fp = fopen($file, 'c+');
  if (!$fp) return blank_db();
  orolado_db_lock_ex($fp, $file);
  $raw = stream_get_contents($fp);
  $data = json_decode($raw ?: '', true);
  $core = is_array($data) ? array_merge(blank_db(), $data) : blank_db();
  if (orolado_store_has_legacy($core)) {
    $core = orolado_store_migrate_core($core, $file);
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($core, JSON_UNESCAPED_UNICODE));
    fflush($fp);
  }
  flock($fp, LOCK_UN);
  fclose($fp);
  return orolado_store_core($core);
}

/**
 * Fusion à 3 versions d'une table indexée : base = ce que la requête avait lu, mine = ce
 * qu'elle veut écrire, cur = le fichier à cet instant. Les changements des DEUX côtés sont
 * gardés : une vieille copie ne peut plus effacer une session, un dépôt ou un joueur ajouté
 * entre-temps par une autre requête.
 */
function orolado_merge3_map(array $base, array $mine, array $cur): array {
  $out = [];
  foreach ($cur as $k => $v) {
    $inB = array_key_exists($k, $base);
    if (array_key_exists($k, $mine)) {
      $out[$k] = ($inB && $mine[$k] == $base[$k]) ? $v : $mine[$k];
    } else if (!$inB) {
      $out[$k] = $v; // ajouté par une autre requête : on le garde
    }
    // sinon : supprimé volontairement par cette requête
  }
  foreach ($mine as $k => $v) {
    if (array_key_exists($k, $out) || array_key_exists($k, $cur)) continue;
    if (array_key_exists($k, $base) && $v == $base[$k]) continue; // supprimé par une autre requête
    $out[$k] = $v; // ajouté par cette requête
  }
  return $out;
}

/** Même fusion pour une liste d'enregistrements identifiés par 'id' (dépôts, retraits, ordres…). */
function orolado_merge3_list(array $base, array $mine, array $cur): array {
  $key = static function ($row) {
    if (is_array($row) && isset($row['id']) && $row['id'] !== '') return 'i:' . (string) $row['id'];
    return 'h:' . md5(json_encode($row));
  };
  $toMap = static function (array $list) use ($key): array {
    $m = [];
    foreach ($list as $row) $m[$key($row)] = $row;
    return $m;
  };
  $merged = orolado_merge3_map($toMap($base), $toMap($mine), $toMap($cur));
  // Ordre : celui de la version de cette requête, puis les ajouts des autres.
  $out = [];
  foreach ($mine as $row) {
    $k = $key($row);
    if (array_key_exists($k, $merged)) { $out[] = $merged[$k]; unset($merged[$k]); }
  }
  foreach ($merged as $row) $out[] = $row;
  return $out;
}

function orolado_db_merge3(array $base, array $mine, array $cur): array {
  $maps = ['users', 'vault', 'sessions', 'pendingRegistrations', 'pendingPasswordOtps', 'pendingEmailChanges', 'withdrawOtps', 'bans'];
  $lists = ['deposits', 'withdrawals', 'orders', 'support_messages', 'admin_logs', 'processedTx'];
  $out = $mine;
  foreach ($maps as $k) {
    $b = is_array($base[$k] ?? null) ? $base[$k] : [];
    $m = is_array($mine[$k] ?? null) ? $mine[$k] : [];
    $c = is_array($cur[$k] ?? null) ? $cur[$k] : [];
    if (array_is_list($m) && array_is_list($c) && ($m || $c)) {
      $out[$k] = orolado_merge3_list($b, $m, $c);
    } else {
      $out[$k] = orolado_merge3_map($b, $m, $c);
    }
  }
  foreach ($lists as $k) {
    $b = is_array($base[$k] ?? null) ? $base[$k] : [];
    $m = is_array($mine[$k] ?? null) ? $mine[$k] : [];
    $c = is_array($cur[$k] ?? null) ? $cur[$k] : [];
    $out[$k] = orolado_merge3_list($b, $m, $c);
  }
  // Autres clés du fichier que cette requête ne connaissait pas : on les garde.
  foreach ($cur as $k => $v) {
    if (!array_key_exists($k, $out) && !array_key_exists($k, $base)) $out[$k] = $v;
  }
  // Heure de coupe des ordres rangés (orolado_orders_maintain) : ne recule jamais (vieille copie).
  if (isset($cur['ordersArchCut']) && (float) $cur['ordersArchCut'] > (float) ($out['ordersArchCut'] ?? 0)) {
    $out['ordersArchCut'] = $cur['ordersArchCut'];
  }
  return $out;
}

function save_db(string $file, array $db): bool {
  $fp = fopen($file, 'c+');
  if (!$fp) return false;
  orolado_db_lock_ex($fp, $file);
  $raw = stream_get_contents($fp);
  $cur = orolado_db_decode($file, $raw);
  $curCore = is_array($cur) ? array_merge(blank_db(), $cur) : null;
  if (is_array($curCore) && orolado_store_has_legacy($curCore)) $curCore = orolado_store_migrate_core($curCore, $file);
  // Fiches (joueurs, soldes, connexions, codes) : seules celles modifiées sont écrites.
  orolado_store_flush($db, $file);
  // Reste du fichier : fusion avec le fichier ACTUEL (sous verrou) ; une requête qui avait lu
  // une vieille version n'efface plus les changements faits entre-temps par les autres.
  $mine = orolado_store_core($db);
  $base = $GLOBALS['OROLADO_DB_BASE'][$file] ?? null;
  if (is_array($base) && is_array($curCore)) $mine = orolado_db_merge3($base, $mine, orolado_store_core($curCore));
  $mine = orolado_store_core($mine);
  $ok = true;
  if (!is_array($curCore) || $mine != orolado_store_core($curCore)) {
    ftruncate($fp, 0);
    rewind($fp);
    $ok = fwrite($fp, json_encode($mine, JSON_UNESCAPED_UNICODE)) !== false;
    fflush($fp);
  }
  flock($fp, LOCK_UN);
  fclose($fp);
  // Nouvelle base : ce qui vient d'être écrit (pour un éventuel 2e save_db dans la requête).
  $GLOBALS['OROLADO_DB_BASE'][$file] = $mine;
  return $ok;
}

/** Lecture + écriture atomique (évite les courses entre trades simultanés). */
function with_db_lock(callable $fn) {
  $file = orolado_data_file();
  $fp = fopen($file, 'c+');
  if (!$fp) return ['ok' => false, 'reason' => 'Stockage indisponible'];
  orolado_db_lock_ex($fp, $file);
  $raw = stream_get_contents($fp);
  $data = orolado_db_decode($file, $raw);
  $core = is_array($data) ? array_merge(blank_db(), $data) : blank_db();
  $migrated = false;
  if (orolado_store_has_legacy($core)) { $core = orolado_store_migrate_core($core, $file); $migrated = true; }
  $core = orolado_store_core($core);
  $box = new stdClass();
  $box->db = orolado_store_attach($core, $file);
  $result = $fn($box);
  if (!is_array($result) || empty($result['skip_write'])) {
    orolado_store_flush($box->db, $file);
    $newCore = orolado_store_core($box->db);
    if ($migrated || $newCore != $core) {
      rewind($fp);
      ftruncate($fp, 0);
      fwrite($fp, json_encode($newCore, JSON_UNESCAPED_UNICODE));
      fflush($fp);
    }
  } else if ($migrated) {
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($core, JSON_UNESCAPED_UNICODE));
    fflush($fp);
  }
  flock($fp, LOCK_UN);
  fclose($fp);
  if (is_array($result)) unset($result['skip_write']);
  return $result;
}

/*
 * ============================================================================================
 * RANGEMENT « UNE FICHE PAR JOUEUR » (tient 100 000+ comptes)
 *
 * Avant : TOUS les joueurs, soldes et connexions étaient dans un seul fichier orolado.json, lu
 * en entier à chaque clic (100 000 joueurs = 80 Mo, 7 s de lecture, 16 s d'écriture).
 * Maintenant : chaque joueur, chaque connexion, chaque code en attente a sa petite fiche dans
 * data/store/<table>/xx/<empreinte>.json. Une requête n'ouvre que les fiches dont elle a
 * besoin. Le fichier orolado.json ne garde que le reste (dépôts, retraits, ordres…).
 *
 * Pour le code du site, rien ne change : $db['users'][$id]['role'] = 'x', isset(…), unset(…),
 * foreach… marchent comme avant (OroladoMap se comporte comme un tableau). Seul « parcourir
 * TOUS les joueurs » coûte cher : on passe par les index (e-mail, id Supabase, n° public).
 * ============================================================================================
 */
final class OroladoMap implements ArrayAccess, IteratorAggregate, Countable, JsonSerializable {
  private string $name;
  private string $dir;
  /** @var array<string, mixed> valeurs en mémoire (null = absent) */
  private array $cache = [];
  /** @var array<string, mixed> valeurs lues sur le disque (null = absent) */
  private array $base = [];
  private bool $all = false;

  public function __construct(string $name, string $storeDir) {
    $this->name = $name;
    $this->dir = rtrim($storeDir, '/\\') . '/' . $name;
  }

  public function name(): string { return $this->name; }

  public static function pathFor(string $dir, string $key): string {
    $h = sha1($key);
    return $dir . '/' . substr($h, 0, 2) . '/' . $h . '.json';
  }

  private function readDisk(string $k) {
    $raw = @file_get_contents(self::pathFor($this->dir, $k));
    if ($raw === false || $raw === '') return null;
    $j = json_decode($raw, true);
    return (is_array($j) && (string) ($j['k'] ?? '') === $k) ? ($j['v'] ?? null) : null;
  }

  private function load(string $k): void {
    if (array_key_exists($k, $this->base)) return;
    $v = $this->all ? null : $this->readDisk($k);
    $this->base[$k] = $v;
    if (!array_key_exists($k, $this->cache)) $this->cache[$k] = $v;
  }

  public function offsetExists(mixed $offset): bool {
    $k = (string) $offset;
    $this->load($k);
    return isset($this->cache[$k]);
  }

  public function &offsetGet(mixed $offset): mixed {
    $k = (string) $offset;
    $this->load($k);
    return $this->cache[$k];
  }

  public function offsetSet(mixed $offset, mixed $value): void {
    if ($offset === null) throw new LogicException('OroladoMap : clé obligatoire');
    $k = (string) $offset;
    $this->load($k);
    $this->cache[$k] = $value;
  }

  public function offsetUnset(mixed $offset): void {
    $k = (string) $offset;
    $this->load($k);
    $this->cache[$k] = null;
  }

  /** Toutes les fiches (lent : réservé à l'admin, au nettoyage, aux statistiques). */
  public function toArray(): array {
    if (!$this->all) {
      foreach (glob($this->dir . '/*/*.json') ?: [] as $f) {
        $j = json_decode((string) @file_get_contents($f), true);
        if (!is_array($j) || !isset($j['k'])) continue;
        $k = (string) $j['k'];
        if (array_key_exists($k, $this->base)) continue;
        $this->base[$k] = $j['v'] ?? null;
        if (!array_key_exists($k, $this->cache)) $this->cache[$k] = $this->base[$k];
      }
      $this->all = true;
    }
    return array_filter($this->cache, static fn($v) => $v !== null);
  }

  public function getIterator(): Iterator { return new ArrayIterator($this->toArray()); }
  public function count(): int { return count($this->toArray()); }
  public function jsonSerialize(): mixed { return (object) $this->toArray(); }

  /** Fiches modifiées dans cette requête. */
  public function dirtyKeys(): array {
    $out = [];
    foreach ($this->cache as $k => $v) {
      if (!array_key_exists($k, $this->base) || $v != $this->base[$k]) $out[] = (string) $k;
    }
    return $out;
  }

  /** Remplace TOUT le contenu (équivalent de « $db['users'] = [...] »). */
  public function replaceAll(array $rows): void {
    $this->toArray();
    foreach (array_keys($this->cache) as $k) $this->cache[$k] = null;
    foreach ($rows as $k => $v) {
      $k = (string) $k;
      if (!array_key_exists($k, $this->base)) $this->base[$k] = null;
      $this->cache[$k] = $v;
    }
  }

  /**
   * Écrit les fiches modifiées. Même règle que l'ancienne fusion à 3 versions : si CETTE
   * requête a changé une fiche, sa version gagne ; sinon on garde ce qu'une autre requête a
   * écrit entre-temps. À appeler sous le verrou d'écriture global (orolado_store_write_lock).
   */
  public function flush(?callable $onChange = null): int {
    $n = 0;
    foreach ($this->dirtyKeys() as $k) {
      $mine = $this->cache[$k];
      $base = $this->base[$k] ?? null;
      $cur = $this->readDisk($k);
      if ($mine === null) {
        if ($cur !== null) {
          @unlink(self::pathFor($this->dir, $k));
          if ($onChange) $onChange($k, $cur, null);
          $n++;
        }
      } else {
        orolado_store_write_file(self::pathFor($this->dir, $k), json_encode(['k' => $k, 'v' => $mine], JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION));
        if ($onChange) $onChange($k, $cur, $mine);
        $n++;
      }
      $this->base[$k] = $mine;
    }
    return $n;
  }
}

/**
 * Pour les fonctions qui tiennent elles-mêmes le verrou du fichier ($fp déjà verrouillé) :
 * lecture avec fiches branchées, puis écriture (fiches modifiées + reste du fichier).
 */
function orolado_store_read_locked($fp, string $file): array {
  rewind($fp);
  $raw = stream_get_contents($fp);
  $data = json_decode($raw ?: '', true);
  $core = is_array($data) ? array_merge(blank_db(), $data) : blank_db();
  if (orolado_store_has_legacy($core)) {
    $core = orolado_store_migrate_core($core, $file);
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($core, JSON_UNESCAPED_UNICODE));
    fflush($fp);
  }
  return orolado_store_attach(orolado_store_core($core), $file);
}

function orolado_store_write_locked($fp, string $file, array $db): void {
  orolado_store_flush($db, $file);
  rewind($fp);
  ftruncate($fp, 0);
  fwrite($fp, json_encode(orolado_store_core($db), JSON_UNESCAPED_UNICODE));
  fflush($fp);
}

/** Écriture sûre : fichier temporaire puis renommage (un lecteur ne voit jamais une fiche à moitié écrite). */
function orolado_store_write_file(string $path, string $body): bool {
  $dir = dirname($path);
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $tmp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
  if (@file_put_contents($tmp, $body) === false) return false;
  if (!@rename($tmp, $path)) {
    @unlink($path);
    if (!@rename($tmp, $path)) { @unlink($tmp); return false; }
  }
  return true;
}

/** Tables rangées « une fiche par clé ». */
function orolado_store_maps(): array {
  return ['users', 'vault', 'sessions', 'pendingRegistrations', 'pendingPasswordOtps', 'pendingEmailChanges', 'withdrawOtps'];
}

function orolado_store_dir(?string $file = null): string {
  return dirname($file ?: orolado_data_file()) . '/store';
}

function orolado_is_map($v): bool {
  return is_array($v) || $v instanceof OroladoMap;
}

/** Clés d'une table, tableau ou fiches. */
function orolado_map_keys($v): array {
  if ($v instanceof OroladoMap) return array_keys($v->toArray());
  return is_array($v) ? array_keys($v) : [];
}

function orolado_map_array($v): array {
  if ($v instanceof OroladoMap) return $v->toArray();
  return is_array($v) ? $v : [];
}

/* ---------- Index des joueurs : e-mail, id Supabase, n° public → id(s) ---------- */

function orolado_store_user_index_keys($u): array {
  if (!is_array($u)) return [];
  $keys = [];
  foreach (['email', 'originalEmail'] as $f) {
    $e = strtolower(trim((string) ($u[$f] ?? '')));
    if ($e !== '') $keys[] = 'e:' . $e;
  }
  $sb = trim((string) ($u['sbId'] ?? ''));
  if ($sb !== '') $keys[] = 's:' . strtolower($sb);
  $pid = trim((string) ($u['publicId'] ?? ''));
  if ($pid !== '') $keys[] = 'p:' . $pid;
  return array_values(array_unique($keys));
}

function orolado_store_idx_path(string $storeDir, string $key): string {
  return OroladoMap::pathFor(rtrim($storeDir, '/\\') . '/_idx', $key);
}

function orolado_store_idx_get(string $storeDir, string $key): array {
  $j = json_decode((string) @file_get_contents(orolado_store_idx_path($storeDir, $key)), true);
  return (is_array($j) && ($j['k'] ?? '') === $key && is_array($j['ids'] ?? null)) ? array_values(array_map('strval', $j['ids'])) : [];
}

function orolado_store_idx_put(string $storeDir, string $key, array $ids): void {
  $path = orolado_store_idx_path($storeDir, $key);
  $ids = array_values(array_unique(array_map('strval', $ids)));
  if (!$ids) { @unlink($path); return; }
  orolado_store_write_file($path, json_encode(['k' => $key, 'ids' => $ids]));
}

function orolado_store_user_changed(string $storeDir, string $id, $old, $new): void {
  $before = orolado_store_user_index_keys($old);
  $after = orolado_store_user_index_keys($new);
  foreach (array_diff($before, $after) as $k) {
    orolado_store_idx_put($storeDir, $k, array_diff(orolado_store_idx_get($storeDir, $k), [$id]));
  }
  foreach (array_diff($after, $before) as $k) {
    $ids = orolado_store_idx_get($storeDir, $k);
    if (!in_array($id, $ids, true)) { $ids[] = $id; orolado_store_idx_put($storeDir, $k, $ids); }
  }
}

/** Joueurs ayant cet e-mail (actuel ou d'origine) : [id => fiche]. Rapide (index). */
function orolado_users_by_email(array $db, string $email): array {
  $email = strtolower(trim($email));
  if ($email === '') return [];
  $users = $db['users'] ?? [];
  $out = [];
  if ($users instanceof OroladoMap) {
    foreach (orolado_store_idx_get($db['_store'] ?? orolado_store_dir(), 'e:' . $email) as $id) {
      $u = $users[$id] ?? null;
      if (is_array($u)) $out[$id] = $u;
    }
    // Fiches créées dans cette requête (pas encore dans l'index).
    foreach ($users->dirtyKeys() as $id) {
      $u = $users[$id] ?? null;
      if (is_array($u) && !isset($out[$id]) && in_array('e:' . $email, orolado_store_user_index_keys($u), true)) $out[$id] = $u;
    }
    foreach ($out as $id => $u) {
      if (!in_array('e:' . $email, orolado_store_user_index_keys($u), true)) unset($out[$id]);
    }
    return $out;
  }
  foreach ((array) $users as $id => $u) {
    if (is_array($u) && in_array('e:' . $email, orolado_store_user_index_keys($u), true)) $out[(string) $id] = $u;
  }
  return $out;
}

/** Joueurs rattachés à cet id Supabase (champ sbId) : [id => fiche]. */
function orolado_users_by_sb(array $db, string $sbId): array {
  $sbId = strtolower(trim($sbId));
  if ($sbId === '') return [];
  $users = $db['users'] ?? [];
  $out = [];
  $ids = $users instanceof OroladoMap
    ? array_merge(orolado_store_idx_get($db['_store'] ?? orolado_store_dir(), 's:' . $sbId), $users->dirtyKeys())
    : array_keys((array) $users);
  foreach (array_unique($ids) as $id) {
    $u = $users[$id] ?? null;
    if (is_array($u) && strtolower(trim((string) ($u['sbId'] ?? ''))) === $sbId) $out[(string) $id] = $u;
  }
  return $out;
}

function orolado_public_id_taken(array $db, string $pid): bool {
  $users = $db['users'] ?? [];
  if ($users instanceof OroladoMap) {
    if (orolado_store_idx_get($db['_store'] ?? orolado_store_dir(), 'p:' . $pid)) return true;
    foreach ($users->dirtyKeys() as $id) {
      if ((string) ($users[$id]['publicId'] ?? '') === $pid) return true;
    }
    return false;
  }
  foreach ((array) $users as $u) if (is_array($u) && (string) ($u['publicId'] ?? '') === $pid) return true;
  return false;
}

/* ---------- Branchement sur load_db / save_db / with_db_lock ---------- */

/** Branche les tables « une fiche par clé » sur un $db lu depuis orolado.json. */
function orolado_store_attach(array $db, string $file): array {
  $store = orolado_store_dir($file);
  foreach (orolado_store_maps() as $m) $db[$m] = new OroladoMap($m, $store);
  $db['_store'] = $store;
  return $db;
}

/** Retire les tables « fiches » avant d'écrire orolado.json. */
function orolado_store_core(array $db): array {
  foreach (orolado_store_maps() as $m) unset($db[$m]);
  unset($db['_store']);
  return $db;
}

/** Écrit les fiches modifiées (sous le verrou d'écriture global). */
function orolado_store_flush(array $db, string $file): void {
  $store = orolado_store_dir($file);
  foreach (orolado_store_maps() as $m) {
    $v = $db[$m] ?? null;
    if (is_array($v)) {
      // Tableau ordinaire (« $db['users'] = [...] ») : il remplace toute la table.
      $map = new OroladoMap($m, $store);
      $map->replaceAll($v);
      $v = $map;
    }
    if (!$v instanceof OroladoMap) continue;
    $v->flush(orolado_store_index_callback($m, $store));
  }
}

/** Mise à jour des index quand une fiche change (joueurs : e-mail… ; connexions : joueur → jetons). */
function orolado_store_index_callback(string $map, string $store): ?callable {
  if ($map === 'users') {
    return static function (string $k, $old, $new) use ($store): void { orolado_store_user_changed($store, $k, $old, $new); };
  }
  if ($map === 'sessions') {
    return static function (string $k, $old, $new) use ($store): void {
      $before = is_array($old) ? (string) ($old['userId'] ?? '') : '';
      $after = is_array($new) ? (string) ($new['userId'] ?? '') : '';
      if ($before === $after) return;
      if ($before !== '') orolado_store_idx_put($store, 'su:' . $before, array_diff(orolado_store_idx_get($store, 'su:' . $before), [$k]));
      if ($after !== '') {
        $ids = orolado_store_idx_get($store, 'su:' . $after);
        if (!in_array($k, $ids, true)) { $ids[] = $k; orolado_store_idx_put($store, 'su:' . $after, $ids); }
      }
    };
  }
  return null;
}

/** Connexions d'un joueur : [jeton => session]. Rapide (index). */
function orolado_sessions_of_user(array $db, string $uid): array {
  $sessions = $db['sessions'] ?? [];
  $out = [];
  if ($sessions instanceof OroladoMap) {
    $toks = array_merge(orolado_store_idx_get($db['_store'] ?? orolado_store_dir(), 'su:' . $uid), $sessions->dirtyKeys());
    foreach (array_unique($toks) as $t) {
      $s = $sessions[$t] ?? null;
      if (is_array($s) && (string) ($s['userId'] ?? '') === $uid) $out[(string) $t] = $s;
    }
    return $out;
  }
  foreach ((array) $sessions as $t => $s) {
    if (is_array($s) && (string) ($s['userId'] ?? '') === $uid) $out[(string) $t] = $s;
  }
  return $out;
}

/** Nombre approximatif de fiches d'une table (exact sous 2 000, sinon échantillon de 16 sous-dossiers). */
function orolado_store_estimate_count(array $db, string $map): int {
  $m = $db[$map] ?? null;
  if (!$m instanceof OroladoMap) return is_array($m) ? count($m) : 0;
  $dir = rtrim($db['_store'] ?? orolado_store_dir(), '/\\') . '/' . $map;
  $shards = glob($dir . '/*', GLOB_ONLYDIR) ?: [];
  if (!$shards) return 0;
  $sample = count($shards) <= 16 ? $shards : array_intersect_key($shards, array_flip(array_rand($shards, 16)));
  $n = 0;
  foreach ($sample as $sh) $n += count(glob($sh . '/*.json') ?: []);
  $est = count($shards) <= 16 ? $n : (int) round($n / count($sample) * count($shards));
  return $est;
}

/**
 * Ménage d'une table « fiches » : supprime les fiches mortes d'UN sous-dossier pris au hasard
 * (ou de tous si $all). Écrit sous le verrou global, index mis à jour.
 */
function orolado_store_sweep(array &$db, string $map, callable $isDead, bool $all = false): int {
  $m = $db[$map] ?? null;
  if (!$m instanceof OroladoMap) return 0;
  $store = $db['_store'] ?? orolado_store_dir();
  $dir = rtrim($store, '/\\') . '/' . $map;
  $shards = $all ? (glob($dir . '/*', GLOB_ONLYDIR) ?: []) : [$dir . '/' . bin2hex(chr(random_int(0, 255)))];
  $n = 0;
  foreach ($shards as $sh) {
    foreach (glob($sh . '/*.json') ?: [] as $f) {
      $j = json_decode((string) @file_get_contents($f), true);
      if (!is_array($j) || !isset($j['k'])) continue;
      if (!$isDead($j['v'] ?? null)) continue;
      unset($m[(string) $j['k']]);
      $n++;
    }
  }
  return $n;
}

/**
 * Passage à l'ancien format → fiches (une seule fois, automatique, sous verrou). Une copie
 * complète de l'ancien fichier est gardée dans data/archive/ avant tout changement.
 */
function orolado_store_migrate_core(array $core, string $file): array {
  $legacy = false;
  foreach (orolado_store_maps() as $m) {
    if (isset($core[$m]) && is_array($core[$m]) && $core[$m] !== []) { $legacy = true; break; }
  }
  if (!$legacy) return orolado_store_core($core);
  $arch = dirname($file) . '/archive';
  if (!is_dir($arch)) @mkdir($arch, 0755, true);
  @file_put_contents($arch . '/orolado-avant-fiches-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json', json_encode($core, JSON_UNESCAPED_UNICODE));
  $store = orolado_store_dir($file);
  // Première fois (fiches encore vides) : l'ancien fichier est une photo complète, les fiches
  // deviennent exactement cette photo. Ensuite (fiches déjà en service), un « ancien format »
  // ne peut venir que d'un vieux code encore en mémoire juste après une mise en ligne : il ne
  // contient que les quelques joueurs qu'il a touchés, parfois à moitié. On COMPLÈTE alors les
  // fiches (champ par champ), sans jamais rien effacer.
  $first = !orolado_store_initialized($store);
  foreach (orolado_store_maps() as $m) {
    $rows = array_filter((isset($core[$m]) && is_array($core[$m])) ? $core[$m] : [], static fn($v, $k) => $v !== null && (string) $k !== '', ARRAY_FILTER_USE_BOTH);
    $map = new OroladoMap($m, $store);
    if ($first) {
      $map->replaceAll($rows);
    } else {
      foreach ($rows as $k => $v) {
        $cur = $map[(string) $k] ?? null;
        $map[(string) $k] = (is_array($cur) && is_array($v)) ? array_replace($cur, $v) : $v;
      }
    }
    $map->flush(orolado_store_index_callback($m, $store));
  }
  if ($first) orolado_store_write_file(rtrim($store, '/\\') . '/.ready', date('c'));
  return orolado_store_core($core);
}

/** Les fiches sont-elles déjà en service ? (repère .ready, ou dossier des joueurs non vide) */
function orolado_store_initialized(string $store): bool {
  $store = rtrim($store, '/\\');
  if (is_file($store . '/.ready')) return true;
  $dirs = @scandir($store . '/users');
  return is_array($dirs) && count($dirs) > 2;
}

/** Reconstruit les index des joueurs (outil de réparation, lent). */
function orolado_store_rebuild_index(?string $file = null): int {
  $store = orolado_store_dir($file);
  $idx = $store . '/_idx';
  foreach (glob($idx . '/*/*.json') ?: [] as $f) @unlink($f);
  $n = 0;
  foreach (['users', 'sessions'] as $name) {
    $cb = orolado_store_index_callback($name, $store);
    $map = new OroladoMap($name, $store);
    foreach ($map->toArray() as $id => $row) { $cb((string) $id, null, $row); $n++; }
  }
  return $n;
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

/**
 * v2623 (propriétaire) — e-mail envoyé à Maketou : le vrai e-mail du joueur avec UN seul caractère du milieu remplacé
 * au hasard (lettre ou chiffre). Il ressemble à un e-mail normal mais Maketou n'a jamais le vrai.
 * Repli (e-mail absent ou interne) : adresse anonyme comme avant.
 */
function maketou_mask_email(string $email, ?string $userId = null): string {
  $email = strtolower(trim($email));
  $at = strrpos($email, '@');
  $bad = $at === false || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || str_ends_with($email, '.local') || str_ends_with($email, '.invalid') || str_contains($email, '@orolado');
  if ($bad) return maketou_alias_email($userId);
  $local = substr($email, 0, $at);
  $domain = substr($email, $at);
  $n = strlen($local);
  $spots = [];
  for ($i = 1; $i < $n - 1; $i++) { if (ctype_alnum($local[$i])) $spots[] = $i; }
  $pool = 'abcdefghijklmnopqrstuvwxyz0123456789';
  if (!$spots) {
    // Partie avant @ trop courte : on glisse un caractère au milieu.
    $mid = max(1, intdiv($n, 2));
    return substr($local, 0, $mid) . $pool[random_int(0, 35)] . substr($local, $mid) . $domain;
  }
  // On évite le tout début et la toute fin : un caractère « à l'intérieur ».
  $inner = array_values(array_filter($spots, static fn($i) => $i >= (int) floor($n / 4) && $i <= (int) ceil($n * 3 / 4)));
  if ($inner) $spots = $inner;
  $i = $spots[random_int(0, count($spots) - 1)];
  do { $c = $pool[random_int(0, 35)]; } while ($c === $local[$i]);
  $local[$i] = $c;
  return $local . $domain;
}

/** Même principe pour un numéro : un seul chiffre du milieu remplacé (le format ne change pas). */
function maketou_mask_digits(string $digits): string {
  $n = strlen($digits);
  if ($n < 6) return $digits;
  $i = random_int(max(2, intdiv($n, 3)), max(2, $n - 3));
  do { $c = (string) random_int(0, 9); } while ($c === $digits[$i]);
  $digits[$i] = $c;
  return $digits;
}

/** Coordonnées client pour Maketou : jamais le vrai e-mail ni le vrai numéro (un caractère changé), vrai nom. */
function maketou_customer_from_user(array $me): array {
  $email = maketou_mask_email((string) ($me['email'] ?? ''), (string) ($me['id'] ?? ''));
  $cc = '225';
  $phoneRaw = maketou_alias_phone();
  $realDigits = preg_replace('/\D/', '', (string) ($me['phone'] ?? '')) ?? '';
  // Numéro ivoirien du joueur (225 + 10 chiffres) : gardé avec un seul chiffre du milieu changé.
  if (strlen($realDigits) === 13 && str_starts_with($realDigits, '225')) $phoneRaw = '+225' . maketou_mask_digits(substr($realDigits, 3));
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
    // v2621 : le panier Maketou peut aussi s'appeler cartId / cart_id / cart.id.
    if ($sellId === '' && (str_contains($k, 'cartid') || str_contains($k, 'cart_id') || $k === 'cart.id' || str_ends_with($k, '.cart.id'))) {
      if (maketou_looks_like_ref($v)) $sellId = $v;
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
  // Tests en ligne de commande seulement (scripts/test-maketou.php) : faux Maketou.
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_MAKETOU']) && is_callable($GLOBALS['OROLADO_FAKE_MAKETOU'])) {
    [$status, $json] = ($GLOBALS['OROLADO_FAKE_MAKETOU'])($url);
    return ($status >= 200 && $status < 300 && is_array($json)) ? $json : null;
  }
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
  $deps = $db['deposits'] ?? [];
  if (!is_array($deps)) return null;
  // v2621 : ordre de confiance — notre référence, puis le panier Maketou, puis l'e-mail unique du dépôt,
  // puis l'identifiant externe (avant : le premier dépôt qui collait à N'IMPORTE lequel des quatre).
  $ref = (string) ($hit['ref'] ?? '');
  $sell = (string) ($hit['sellId'] ?? '');
  $mail = strtolower((string) ($hit['email'] ?? ''));
  $ext = (string) ($hit['extId'] ?? '');
  $tests = [
    static fn($d) => $ref !== '' && (($d['id'] ?? '') === $ref || ($d['ref'] ?? '') === $ref),
    static fn($d) => $sell !== '' && (($d['sellId'] ?? '') === $sell || ($d['cartId'] ?? '') === $sell),
    static fn($d) => $mail !== '' && strtolower((string) ($d['aliasEmail'] ?? '')) === $mail,
    static fn($d) => $ext !== '' && (($d['extId'] ?? '') === $ext || ($d['sellId'] ?? '') === $ext || ($d['cartId'] ?? '') === $ext),
  ];
  foreach ($tests as $test) {
    foreach ($deps as $d) {
      if (is_array($d) && $test($d)) return $d;
    }
  }
  return null;
}

function credit_paid_deposit(array $hit): array {
  $file = orolado_data_file();
  $fp = fopen($file, 'c+');
  if (!$fp) return ['ok' => false, 'reason' => 'db'];
  orolado_db_lock_ex($fp, $file);
  // Lecture sous verrou, fiches branchées (joueurs, soldes, connexions hors du gros fichier).
  $db = orolado_store_read_locked($fp, $file);
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
  if ($amount + 0.0001 < $minGate || orolado_deposit_over_cap($amount)) {
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
    $uid = 'admin_master';
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
  // === CAISSE UNIQUE (= admin) : UUID + crédit Supabase AVANT COMPLETED / toast ===
  $payId = $uid;
  if (function_exists('orolado_balance_uuid')) {
    $resolvedPay = orolado_balance_uuid($db, $uid);
    if ($resolvedPay !== '') $payId = $resolvedPay;
  }
  if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $payId)) {
    flock($fp, LOCK_UN);
    fclose($fp);
    // Joueur sans coffre Supabase (inscription miroir ratée) : on le crée, puis on refait
    // le crédit UNE fois. Sans ça, un dépôt payé restait non crédité.
    if (empty($hit['_ensured']) && $uid !== 'admin_master' && function_exists('orolado_ensure_balance_uuid')) {
      $made = orolado_ensure_balance_uuid($uid);
      if ($made !== '') {
        $hit['_ensured'] = 1;
        return credit_paid_deposit($hit);
      }
    }
    return ['ok' => false, 'reason' => 'no_uuid'];
  }
  $vaultRow = function_exists('orolado_ensure_sb_vault') ? orolado_ensure_sb_vault($payId, 0) : supabase_admin_vault($payId);
  if (!$vaultRow) {
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['ok' => false, 'reason' => 'vault_error'];
  }
  $refId = (string) ($dep['id'] ?? $hit['ref'] ?? '');

  // Crédit du coffre UNE SEULE FOIS par dépôt, garanti par la base (clé « dep_<réf> »).
  // Avant : un crédit « + montant » refait à chaque passage ; si le fichier JSON avait été
  // réécrit avec une ancienne version (dépôt redevenu PENDING), le dépôt était crédité 2 fois.
  // Clé = référence du dépôt (identique dans tous les chemins : webhook, vérification,
  // page de retour, validation admin) : un même dépôt ne peut jamais être crédité 2 fois.
  $once = $refId !== '' ? orolado_vault_credit_once($payId, 'dep_' . $refId, $amount) : null;
  if ($once === null) {
    flock($fp, LOCK_UN);
    fclose($fp);
    // PENDING reste → webhook / vérification peuvent réessayer, sans risque de double crédit.
    orolado_health_event('Dépôts', 'Dépôt payé mais pas encore crédité (réf. ' . $refId . ', ' . $amount . ' $) : la base n’a pas répondu, nouvel essai automatique. Si ça dure, validez-le dans « Dépôts en Attente ».');
    return ['ok' => false, 'reason' => 'credit'];
  }
  $got = $once['real'];
  if ($amount >= 10000 && empty($once['duplicate'])) {
    orolado_health_event('Gros dépôt', 'Dépôt de ' . number_format($amount, 2, ',', ' ') . ' $ crédité (réf. ' . $refId . ').', 'warn');
  }

  // Journal dépôt cloud (sans 2e crédit via complete_deposit RPC).
  if ($refId !== '') {
    $sbDep = function_exists('supabase_get_deposit') ? supabase_get_deposit($refId) : null;
    if (!$sbDep && function_exists('supabase_insert_deposit')) {
      supabase_insert_deposit([
        'id' => $refId,
        'user_id' => $payId,
        'amount' => $amount,
        'status' => 'COMPLETED',
        'operator' => $opEarly !== '' ? $opEarly : 'oxapay',
        'reference' => $refId,
        'completed_at' => date('c'),
      ]);
    } else if ($sbDep && function_exists('supabase_patch_deposit')) {
      $stSb = strtoupper((string) ($sbDep['status'] ?? ''));
      if ($stSb === 'PENDING' || $stSb === '') {
        supabase_patch_deposit($refId, [
          'status' => 'COMPLETED',
          'amount' => $amount,
          'completed_at' => date('c'),
        ]);
      }
    }
  }

  // Miroir JSON = solde réellement lu en base (pas un inventé).
  if (function_exists('orolado_mirror_vault_real')) orolado_mirror_vault_real($db, $uid, $got);
  else $db['vault'][$uid]['real'] = $got;
  if ($payId !== $uid) {
    if (!isset($db['vault'][$payId]) || !is_array($db['vault'][$payId])) {
      $db['vault'][$payId] = ['demo' => 0, 'real' => 0];
    }
    $db['vault'][$payId]['real'] = $got;
  }
  // Déjà crédité par la base (le fichier avait « oublié ») : on remet juste le statut à jour,
  // sans recompter le dépôt dans les totaux ni la condition de mise.
  $alreadyCredited = !empty($once['duplicate']);
  if (!$alreadyCredited) {
    $db['users'][$uid]['realDepositTotal'] = orolado_money(($db['users'][$uid]['realDepositTotal'] ?? 0) + $amount);
    $db['users'][$uid]['requiredWagering'] = orolado_money(($db['users'][$uid]['realDepositTotal'] ?? 0) * 2);
    $db['users'][$uid]['lastDepositAmount'] = $amount;
    $db['users'][$uid]['wagerLock'] = orolado_money(($db['users'][$uid]['wagerLock'] ?? 0) + $amount);
    $db['users'][$uid]['wagerNeed'] = orolado_money(($db['users'][$uid]['wagerNeed'] ?? 0) + ($amount * 2));
  }
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
  if (!$alreadyCredited) {
    array_unshift($db['users'][$uid]['transactions'], $tx);
    $db['users'][$uid]['transactions'] = array_slice($db['users'][$uid]['transactions'], 0, 1500);
  }

  orolado_store_write_locked($fp, $file, $db);
  flock($fp, LOCK_UN);
  fclose($fp);
  $op = strtolower((string) ($dep['operator'] ?? $txOp));
  if (!$alreadyCredited && in_array($op, ['flutterwave', 'flw', 'oxapay', 'usdt'], true) && $amount > 0) {
    orolado_meta_capi_purchase_later([
      'value' => $amount,
      'email' => (string) ($db['users'][$uid]['email'] ?? $dep['customerEmail'] ?? ''),
      'event_id' => $refId !== '' ? $refId : (string) ($dep['id'] ?? ''),
      'ip' => (string) ($dep['clientIp'] ?? ''),
      'ua' => (string) ($dep['userAgent'] ?? ''),
    ]);
  }
  return ['ok' => true, 'amount' => $amount, 'userId' => $uid, 'real' => $got];
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
  // v2621 (propriétaire) : 3 $ comme affiché sur le site (avant 5 $ : un dépôt Mobile Money de 3 $ était refusé).
  // v3020 (propriétaire, 2026-10-21) : 1 $ (carte, Mobile Money / Wave). La crypto (OxaPay) ne passe pas par ici.
  return 1.0;
}

/**
 * Moyens de paiement en pause (Maketou, USDT direct sur adresse fixe) : fermés côté serveur,
 * pas seulement cachés à l'écran. Pour en rallumer un un jour : .env OROLADO_PAY_MAKETOU=1
 * ou OROLADO_PAY_USDT_DIRECT=1. (Actifs : Flutterwave et OxaPay, qui ne passent pas par ici.)
 */
function orolado_pay_enabled(string $method): bool {
  return supabase_env('OROLADO_PAY_' . strtoupper($method)) === '1';
}

function orolado_initiate_deposit(array $req): array {
  if (!orolado_pay_enabled('maketou')) return ['ok' => false, 'server' => true, 'code' => 'disabled', 'reason' => 'Moyen de paiement indisponible'];
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
  // v2624 (propriétaire) : Maketou ajoute ses frais (2 %) au prix → 3 $ affichait 1 836 FCFA au lieu de 1 800
  // (même taux que Flutterwave). On envoie le prix sans ces frais pour que le TOTAL payé soit le même.
  // Réglable : .env MAKETOU_CLIENT_FEE_PCT (0 = aucune compensation).
  $feeEnv = supabase_env('MAKETOU_CLIENT_FEE_PCT');
  $feePct = $feeEnv !== '' && is_numeric($feeEnv) ? max(0.0, min(10.0, (float) $feeEnv)) : 2.0;
  $fullFcfa = $amountFcfa;
  if ($feePct > 0) $amountFcfa = (int) round($amountFcfa / (1 + $feePct / 100));
  if ($amountUsd + 0.0001 < $minUsd && $fullFcfa < $minFcfa) {
    return ['ok' => false, 'server' => true, 'reason' => 'Le dépôt minimum est de $1.'];
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
    'user_id' => orolado_balance_uuid($db, (string) $me['id']),
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

  if (!orolado_pay_enabled('maketou')) {
    $out = orolado_deposit_status($req);
    $out['paid'] = !empty($out['paid']);
    $out['success'] = !empty($out['paid']);
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
      // Plus de 2e chemin de crédit (complete_deposit) : il pouvait ajouter le dépôt une
      // 2e fois. En cas d'échec, le dépôt reste en attente et sera réessayé (crédit unique).
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

/**
 * v2621 — Rattrapage Mobile Money : un joueur qui a payé chez Maketou mais n'est pas revenu sur le site (page fermée,
 * réseau coupé) et dont le webhook n'est pas arrivé est crédité quand même. Appelé par le téléphone toutes les 2 min
 * (avec oxapayRecheck) : on redemande à Maketou l'état de SES dépôts Mobile Money en attente (48 h, 4 au plus).
 * Crédit seulement si Maketou dit « payé » (même règle que orolado_confirm_deposit), une seule fois.
 */
function orolado_maketou_recheck(array $req): array {
  if (!orolado_pay_enabled('maketou')) return ['ok' => true, 'skipped' => true];
  $db = load_db(orolado_data_file());
  $me = orolado_session_user($db, (string) ($req['token'] ?? ''));
  if (!$me) return ['ok' => false, 'server' => true, 'code' => 'session'];
  $uid = (string) $me['id'];
  if (!orolado_rate_ok('mkt_recheck', $uid, 1, 90)) return ['ok' => true, 'skipped' => true];
  $cut = time() - 48 * 3600;
  $list = [];
  foreach (array_reverse($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || (string) ($d['userId'] ?? '') !== $uid) continue;
    if (strtoupper((string) ($d['status'] ?? '')) !== 'PENDING') continue;
    $op = strtolower((string) ($d['operator'] ?? ''));
    if (in_array($op, ['oxapay', 'flutterwave', 'flw', 'usdt', 'admin', 'refund', 'card'], true)) continue;
    if (str_starts_with(strtolower((string) ($d['id'] ?? '')), 'flw_')) continue;
    if (trim((string) ($d['sellId'] ?? $d['cartId'] ?? '')) === '') continue;
    if ((strtotime((string) ($d['at'] ?? '')) ?: 0) < $cut) continue;
    $list[] = $d;
    if (count($list) >= 4) break;
  }
  $credited = 0.0;
  foreach ($list as $d) {
    $proof = maketou_verify_remote_payment($d, 1, 1);
    if (empty($proof['paid'])) continue;
    $res = credit_paid_deposit([
      'ref' => (string) ($d['id'] ?? $d['ref'] ?? ''),
      'amount' => orolado_money($proof['amount'] ?? ($d['amount'] ?? 0)),
      'paid' => true,
      'extId' => '',
      'sellId' => (string) ($d['sellId'] ?? $d['cartId'] ?? ''),
    ]);
    maketou_log('recheck_credit', ['ref' => (string) ($d['id'] ?? ''), 'result' => $res]);
    if (!empty($res['ok']) && empty($res['duplicate'])) $credited += (float) ($res['amount'] ?? 0);
  }
  return ['ok' => true, 'checked' => count($list), 'credited' => $credited];
}

/**
 * v2634 — Rattrapage Flutterwave (Wave / Mobile Money / carte) : un joueur qui a payé mais n'est pas revenu sur le
 * site, ou dont le message de Flutterwave n'est pas arrivé, est crédité quand même. Appelé avec oxapayRecheck
 * (toutes les 2 min par le téléphone) : on redemande à Flutterwave l'état de SES dépôts en attente (48 h, 4 au plus).
 * Crédit seulement si Flutterwave dit « successful » pour CETTE référence (orolado_flutterwave_verify), une seule fois.
 */
function orolado_flw_recheck(array $req): array {
  if (!function_exists('orolado_flw_configured') || !orolado_flw_configured()) return ['ok' => true, 'skipped' => true];
  $db = load_db(orolado_data_file());
  $me = orolado_session_user($db, (string) ($req['token'] ?? ''));
  if (!$me) return ['ok' => false, 'server' => true, 'code' => 'session'];
  $uid = (string) $me['id'];
  if (!orolado_rate_ok('flw_recheck', $uid, 1, 90)) return ['ok' => true, 'skipped' => true];
  $cut = time() - 48 * 3600;
  $list = [];
  foreach (array_reverse($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || (string) ($d['userId'] ?? '') !== $uid) continue;
    if (strtoupper((string) ($d['status'] ?? '')) !== 'PENDING') continue;
    $op = strtolower((string) ($d['operator'] ?? ''));
    $id = (string) ($d['id'] ?? '');
    if ($op !== 'flutterwave' && $op !== 'flw' && !str_starts_with(strtolower($id), 'flw_')) continue;
    if ((strtotime((string) ($d['at'] ?? '')) ?: 0) < $cut) continue;
    $list[] = $d;
    if (count($list) >= 4) break;
  }
  $credited = 0;
  foreach ($list as $d) {
    $ref = (string) ($d['id'] ?? $d['ref'] ?? '');
    $proof = orolado_flutterwave_verify($ref, '');
    if (empty($proof['paid'])) continue;
    orolado_flutterwave_credit($ref, (string) ($proof['extId'] ?? ''), (float) ($proof['amount_usd'] ?? 0));
    $credited++;
  }
  return ['ok' => true, 'checked' => count($list), 'credited' => $credited];
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

  if (!orolado_pay_enabled('maketou')) {
    echo json_encode(['ok' => true, 'ignored' => true, 'reason' => 'disabled']);
    exit;
  }
  $raw = (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_INPUT'])) ? (string) $GLOBALS['OROLADO_FAKE_INPUT'] : (file_get_contents('php://input') ?: '');
  $hasSig = false;
  foreach ([
    $_SERVER['HTTP_X_SHOPLINE_HMAC_SHA256'] ?? '',
    $_SERVER['HTTP_X_MAKETOU_HMAC_SHA256'] ?? '',
    $_SERVER['HTTP_X_HMAC_SHA256'] ?? '',
    $_SERVER['HTTP_X_SIGNATURE'] ?? '',
  ] as $h) {
    if (trim((string) $h) !== '') $hasSig = true;
  }
  $signed = $hasSig && maketou_api_key() !== '' && maketou_verify_hmac($raw);
  // v2621 : signature non reconnue → on ne jette plus le message (avant : 401, le paiement n'était jamais crédité
  // par le webhook) ; il est traité comme non signé, donc revérifié directement chez Maketou avant tout crédit.
  if ($hasSig && !$signed) maketou_log('webhook_bad_signature', ['len' => strlen($raw)]);

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

  $dep = orolado_find_deposit_by_hit($hit);
  if (!$dep) {
    maketou_log('webhook_unknown', ['hit' => $hit, 'signed' => $signed]);
    echo json_encode(['ok' => true, 'ignored' => true, 'reason' => 'unknown']);
    exit;
  }
  $expectedFcfa = (int) ($dep['amountFcfa'] ?? 0);
  if ($expectedFcfa <= 0) $expectedFcfa = orolado_usd_to_fcfa(orolado_money($dep['amount'] ?? 0));
  if ($signed) {
    // v2621 : même message signé, un montant payé plus petit que le panier ne crédite rien (FCFA comparés à FCFA).
    $gotFcfa = (int) ($hit['amount'] ?? 0);
    if ($gotFcfa > 0 && $expectedFcfa > 0 && $gotFcfa < $expectedFcfa) {
      maketou_log('webhook_amount_mismatch', ['ref' => (string) ($dep['id'] ?? ''), 'expectedFcfa' => $expectedFcfa, 'gotFcfa' => $gotFcfa]);
      http_response_code(202);
      echo json_encode(['ok' => false, 'reason' => 'amount']);
      exit;
    }
  } else {
    // Un POST non signé peut venir de n'importe qui : on rejoue la vérification chez Maketou avant tout crédit.
    $proof = maketou_verify_remote_payment($dep, 2, 2);
    if (empty($proof['paid'])) {
      maketou_log('webhook_unverified', ['ref' => (string) ($dep['id'] ?? ''), 'reason' => (string) ($proof['reason'] ?? 'not_paid')]);
      http_response_code(202);
      echo json_encode(['ok' => false, 'pending' => true, 'reason' => 'unverified']);
      exit;
    }
  }

  // v2621 : on crédite LE dépôt retrouvé, en dollars (avant : le chiffre FCFA du message, ou le montant arrondi
  // à l'entier, était passé tel quel).
  $result = credit_paid_deposit([
    'ref' => (string) ($dep['id'] ?? $dep['ref'] ?? ''),
    'amount' => orolado_money($dep['amount'] ?? 0),
    'paid' => true,
    // Pas d'identifiant externe : un « id » générique du message (boutique, produit…) aurait bloqué les paiements
    // suivants comme « déjà traité ». Le double crédit reste impossible : le dépôt passe COMPLETED sous verrou.
    'extId' => '',
    'sellId' => (string) ($dep['sellId'] ?? $dep['cartId'] ?? ''),
  ]);
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

function brevo_otp_code_cells(string $code): string {
  $cells = '';
  foreach (str_split($code) as $d) {
    $cells .= '<td align="center" valign="middle" width="38" style="width:38px;height:46px;background-color:#0B1220;border:1px solid #334155;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:900;color:#FFFFFF;line-height:46px;">' . $d . '</td>'
      . '<td width="6" style="width:6px;font-size:0;line-height:0;">&nbsp;</td>';
  }
  return $cells;
}

function brevo_otp_html(string $code): string {
  $safe = brevo_escape($code);
  return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
    . '<html xmlns="http://www.w3.org/1999/xhtml" lang="fr"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
    . '<meta name="viewport" content="width=device-width,initial-scale=1" /><title>OROLADO SECURITY</title></head>'
    . '<body style="margin:0;padding:0;background-color:#0B1220;">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0B1220;width:100%;">'
    . '<tr><td align="center" style="padding:24px 12px;">'
    . '<table role="presentation" width="460" cellspacing="0" cellpadding="0" border="0" style="max-width:460px;width:100%;background-color:#121A2B;border:1px solid #334155;">'
    . '<tr><td align="center" style="padding:22px 20px 12px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#F5C518;letter-spacing:1px;">OROLADO SECURITY</td></tr>'
    . '<tr><td align="center" style="padding:0 20px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#E8EEF9;">Your OROLADO 6-digit code:</td></tr>'
    . '<tr><td align="center" style="padding:0 20px 16px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>' . brevo_otp_code_cells($safe) . '</tr></table></td></tr>'
    . '<tr><td align="center" style="padding:0 20px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#FDE68A;">Valid for 15 minutes. Go back to OROLADO and enter this code.</td></tr>'
    . '<tr><td align="center" style="padding:0 20px 22px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#C9D2E5;">Do not share this code with anyone.</td></tr>'
    . '</table></td></tr></table></body></html>';
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
  // Tests locaux uniquement (scripts/test-*.php) : aucun vrai e-mail envoyé.
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_MAIL']) && is_callable($GLOBALS['OROLADO_FAKE_MAIL'])) {
    return ($GLOBALS['OROLADO_FAKE_MAIL'])($email, $code);
  }
  $html = brevo_otp_html($code);
  // v2645 : e-mail en ANGLAIS (langue du site, une seule langue), code dans le TITRE (visible dans la notification du téléphone sans ouvrir
  // l'e-mail), « valable 15 minutes » (vraie durée ; avant : « valid for 1 minute » en anglais → abandons).
  $text = "Your OROLADO code: $code\n\nValid for 15 minutes. Go back to OROLADO and enter this code.\nDo not share this code with anyone.\n";
  $subj = 'Your OROLADO code: ' . $code;
  $sent = orolado_mail_send($email, '', $subj, $html, $text);
  if (empty($sent['ok'])) {
    $sent = orolado_mail_send($email, '', $subj, $html, $text);
  }
  $log = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'otp_mail.log';
  @file_put_contents($log, json_encode([
    'ts' => date('c'),
    'email' => $email,
    'type' => 'OTP inscription',
    'status' => !empty($sent['ok']) ? 'envoyé' : 'échec',
    'detail' => (string) ($sent['via'] ?? $sent['reason'] ?? ''),
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
  if (empty($sent['ok'])) {
    orolado_health_event('E-mails', 'Un code de vérification n’a pas pu être envoyé (' . (string) ($sent['reason'] ?? 'service e-mail') . '). Les joueurs ne peuvent plus s’inscrire ni retirer si ça continue.');
  }
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
  return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
    . '<html xmlns="http://www.w3.org/1999/xhtml" lang="fr"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
    . '<meta name="viewport" content="width=device-width,initial-scale=1" /><title>OROLADO SECURITY</title></head>'
    . '<body style="margin:0;padding:0;background-color:#0B1220;">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0B1220;width:100%;">'
    . '<tr><td align="center" style="padding:24px 12px;">'
    . '<table role="presentation" width="460" cellspacing="0" cellpadding="0" border="0" style="max-width:460px;width:100%;background-color:#121A2B;border:1px solid #334155;">'
    . '<tr><td align="center" style="padding:22px 20px 12px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#F5C518;letter-spacing:1px;">OROLADO SECURITY</td></tr>'
    . '<tr><td align="center" style="padding:0 20px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#E8EEF9;">Use this 6-digit code to confirm your withdrawal:</td></tr>'
    . '<tr><td align="center" style="padding:0 20px 16px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>' . brevo_otp_code_cells($safe) . '</tr></table></td></tr>'
    . '<tr><td align="center" style="padding:0 20px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#FDE68A;">Valid for 15 minutes. Go back to OROLADO and enter this code.</td></tr>'
    . '<tr><td align="center" style="padding:0 20px 22px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#C9D2E5;">Do not share this code with anyone.</td></tr>'
    . '</table></td></tr></table></body></html>';
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
  // v2646 : code dans le TITRE (visible dans la notification), vraie durée 15 min (OROLADO_WD_OTP_TTL).
  $text = "Your OROLADO withdrawal code: $code\n\nValid for 15 minutes. Go back to OROLADO and enter this code.\nDo not share this code with anyone.\n";
  $subj = 'Your OROLADO withdrawal code: ' . $code;
  $sent = orolado_mail_send($email, '', $subj, $html, $text);
  if (empty($sent['ok'])) {
    $sent = orolado_mail_send($email, '', $subj, $html, $text);
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

function orolado_pending_regs(array &$db): array|OroladoMap {
  if (!isset($db['pendingRegistrations']) || !orolado_is_map($db['pendingRegistrations'])) {
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
  if (!isset($db['pendingRegistrations']) || !orolado_is_map($db['pendingRegistrations'])) return;
  $dead = static function ($row) use ($now): bool {
    if (!is_array($row)) return true;
    $sessionExp = (int) ($row['sessionExpiresAt'] ?? 0);
    if ($sessionExp <= 0) {
      $created = (int) ($row['createdAtTs'] ?? 0);
      if ($created <= 0) $created = strtotime((string) ($row['createdAt'] ?? '')) ?: 0;
      $sessionExp = $created > 0 ? $created + OROLADO_OTP_PENDING_KEEP : (int) ($row['expiresAt'] ?? 0);
    }
    return $sessionExp > 0 && $sessionExp < $now;
  };
  // Fiches : ménage d'un seul sous-dossier par inscription (rapide, même avec 1 million de codes).
  if ($db['pendingRegistrations'] instanceof OroladoMap) {
    orolado_store_sweep($db, 'pendingRegistrations', $dead);
    return;
  }
  foreach ($db['pendingRegistrations'] as $email => $row) {
    if ($dead($row)) unset($db['pendingRegistrations'][$email]);
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
  $hitAddr = $wallet;
  foreach (tronscan_trc20_transfers($info) as $row) {
    if (!tron_transfer_is_usdt($row)) continue;
    $foundUsdt = true;
    $to = (string) ($row['to_address'] ?? $row['toAddress'] ?? $row['to'] ?? '');
    $amt = tronscan_usdt_amount($row);
    $hit = strcasecmp($to, $wallet) === 0;
    if (!$hit && !empty($info['_accept_addrs']) && is_array($info['_accept_addrs'])) {
      foreach ($info['_accept_addrs'] as $okAddr) {
        if (strcasecmp($to, (string) $okAddr) === 0) { $hit = true; break; }
      }
    }
    if (!$hit) {
      $foundWrong = true;
      continue;
    }
    $hitAddr = $to !== '' ? $to : $wallet;
    $toUs += $amt;
  }
  if ($toUs > 0) return ['ok' => true, 'amount' => $toUs, 'address' => $hitAddr];
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
  // Adresse USDT fixe partagée : n'importe qui pourrait « réclamer » la transaction d'un autre.
  if (!orolado_pay_enabled('usdt_direct')) return ['ok' => false, 'server' => true, 'code' => 'disabled', 'reason' => 'Moyen de paiement indisponible'];
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
  $info['_accept_addrs'] = orolado_user_crypto_addrs($db, $uid);
  $match = tronscan_match_usdt($info);
  if (empty($match['ok'])) {
    $code = (string) ($match['code'] ?? 'propagating');
    return ['ok' => false, 'server' => true, 'code' => $code, 'reason' => orolado_crypto_msg($code)];
  }

  $receivedAmount = orolado_money($match['amount'] ?? 0);
  $expectedAmount = orolado_money($req['amount'] ?? $req['expectedAmount'] ?? 0);
  $floor = orolado_oxapay_credit_floor();
  if ($expectedAmount > 0 && !($receivedAmount + 0.0001 >= $expectedAmount) && $receivedAmount + 0.0001 < $floor) {
    return ['ok' => false, 'server' => true, 'code' => 'min', 'reason' => orolado_crypto_msg('min')];
  }
  if ($receivedAmount + 0.0001 < $floor) {
    return ['ok' => false, 'server' => true, 'code' => 'min', 'reason' => orolado_crypto_msg('min')];
  }
  if (orolado_deposit_over_cap($receivedAmount)) {
    return ['ok' => false, 'server' => true, 'code' => 'invalid', 'reason' => orolado_crypto_msg('invalid')];
  }
  $realAmt = $receivedAmount;

  $ref = '';
  $paidAddr = trim((string) ($match['address'] ?? ''));
  foreach ($db['deposits'] as $i => $d) {
    if ((string) ($d['userId'] ?? '') !== $uid) continue;
    $sameTx = strcasecmp((string) ($d['txid'] ?? ''), $txid) === 0 || strcasecmp((string) ($d['extId'] ?? ''), $txid) === 0;
    $sameAddr = $paidAddr !== '' && strcasecmp((string) ($d['address'] ?? ''), $paidAddr) === 0;
    if (!$sameTx && !$sameAddr) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if (in_array($st, ['COMPLETED', 'PAID', 'SUCCESS'], true) && !$sameTx) continue;
    $ref = (string) ($d['id'] ?? $d['ref'] ?? '');
    $db['deposits'][$i]['amount'] = $realAmt;
    $db['deposits'][$i]['txid'] = $txid;
    save_db($file, $db);
    break;
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
      'user_id' => orolado_balance_uuid($db, $uid),
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
    'allowSmall' => true,
    'operator' => 'usdt',
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

/** Vrai si la clé OxaPay vient des réglages de l'hébergeur (et plus de la clé de secours du code). */
function orolado_oxapay_key_from_env(): bool {
  orolado_load_env();
  return trim((string) (getenv('OXAPAY_MERCHANT_KEY') ?: ($_ENV['OXAPAY_MERCHANT_KEY'] ?? $_SERVER['OXAPAY_MERCHANT_KEY'] ?? ''))) !== '';
}

// Clé de secours gardée seulement pour ne pas couper les dépôts crypto tant que la vraie clé
// n'est pas dans les réglages de l'hébergeur (rappel affiché dans l'admin « À surveiller »).
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

/** Seuil interne de crédit webhook : tout envoi réel ≥ 0.01 $ est crédité, toutes cryptos. */
function orolado_oxapay_credit_floor(): float {
  return 0.01;
}

function orolado_oxapay_open_invoice(array $db, string $uid, string $coin): ?array {
  $cut = time() - 20 * 3600;
  $coin = strtolower(trim($coin));
  foreach (array_reverse($db['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    if ((string) ($d['userId'] ?? '') !== $uid) continue;
    if (strtolower((string) ($d['operator'] ?? '')) !== 'oxapay') continue;
    if ($coin !== '' && strtolower((string) ($d['coin'] ?? '')) !== $coin) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if (in_array($st, ['COMPLETED', 'PAID', 'SUCCESS'], true)) continue;
    $addr = trim((string) ($d['address'] ?? ''));
    if ($addr === '') continue;
    $at = strtotime((string) ($d['at'] ?? '')) ?: 0;
    if ($at > 0 && $at < $cut) continue;
    return $d;
  }
  return null;
}

function orolado_user_crypto_addrs(array $db, string $uid): array {
  $out = [];
  $static = trim(orolado_usdt_wallet());
  if ($static !== '') $out[] = $static;
  foreach ($db['deposits'] ?? [] as $d) {
    if (!is_array($d) || (string) ($d['userId'] ?? '') !== $uid) continue;
    $a = trim((string) ($d['address'] ?? ''));
    if ($a !== '') $out[] = $a;
  }
  return array_values(array_unique($out));
}

function orolado_oxapay_uid_from_order(string $orderId, array $db): string {
  $orderId = trim($orderId);
  if ($orderId === '' || !preg_match('/^oro_([a-zA-Z0-9]+)_/', $orderId, $m)) return '';
  $compact = strtolower((string) $m[1]);
  // D'abord le dépôt lui-même (il connaît son joueur).
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    $oid = (string) ($d['id'] ?? $d['ref'] ?? '');
    if ($oid !== '' && strcasecmp($oid, $orderId) === 0) return (string) ($d['userId'] ?? '');
  }
  // Sinon : l'id compacté (sans tirets) est retrouvé directement, sans parcourir tous les joueurs.
  $cands = [];
  if (preg_match('/^[0-9a-f]{32}$/', $compact)) {
    $cands[] = substr($compact, 0, 8) . '-' . substr($compact, 8, 4) . '-' . substr($compact, 12, 4) . '-' . substr($compact, 16, 4) . '-' . substr($compact, 20);
  }
  if (str_starts_with($compact, 'u')) $cands[] = 'u_' . substr($compact, 1);
  $cands[] = $compact;
  foreach ($cands as $cand) {
    if (isset($db['users'][$cand]) && is_array($db['users'][$cand])) return (string) ($db['users'][$cand]['id'] ?? $cand);
  }
  return '';
}

function orolado_oxapay_find_dep(string $orderId, string $trackId, string $address = '', string $email = ''): ?array {
  $db = load_db(orolado_data_file());
  $address = trim($address);
  $email = strtolower(trim($email));
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    if ($orderId !== '' && (strcasecmp((string) ($d['id'] ?? ''), $orderId) === 0 || strcasecmp((string) ($d['ref'] ?? ''), $orderId) === 0)) return $d;
    if ($trackId !== '' && (strcasecmp((string) ($d['trackId'] ?? ''), $trackId) === 0 || strcasecmp((string) ($d['extId'] ?? ''), $trackId) === 0)) return $d;
    if ($address !== '' && strcasecmp((string) ($d['address'] ?? ''), $address) === 0) return $d;
    if ($email !== '' && strtolower(trim((string) ($d['aliasEmail'] ?? $d['email'] ?? $d['customerEmail'] ?? ''))) === $email) return $d;
  }
  return null;
}

function orolado_oxapay_log(string $event, array $data = []): void {
  $file = orolado_data_dir() . '/oxapay_webhook.log';
  if (is_file($file) && filesize($file) > 524288) {
    $lines = file($file, FILE_IGNORE_NEW_LINES) ?: [];
    @file_put_contents($file, implode("\n", array_slice($lines, -200)) . "\n", LOCK_EX);
  }
  $row = array_merge(['ts' => date('c'), 'event' => $event], $data);
  $line = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
  if ($line === false) $line = json_encode(['ts' => date('c'), 'event' => $event]);
  @file_put_contents($file, $line . "\n", FILE_APPEND | LOCK_EX);
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

function orolado_oxapay_payer_email(array $me): string {
  $email = strtolower(trim((string) ($me['email'] ?? '')));
  if ($email === '' || !str_contains($email, '@') || str_contains($email, '.local')) return '';
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return '';
  return $email;
}

function orolado_oxapay_addr(array $data): string {
  $addr = '';
  foreach (['address', 'pay_address', 'payAddress', 'wallet_address', 'walletAddress', 'wallet'] as $k) {
    $v = trim((string) ($data[$k] ?? ''));
    if ($v !== '') { $addr = $v; break; }
  }
  if (preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:/', $addr)) {
    $addr = (string) preg_replace('/^[a-zA-Z][a-zA-Z0-9+.-]*:/', '', $addr);
  }
  $qPos = strpos($addr, '?');
  if ($qPos !== false) $addr = substr($addr, 0, $qPos);
  $addr = trim($addr, "/ \t\n\r");
  if (preg_match('#^https?://#i', $addr)) $addr = '';
  if ($addr !== '' && preg_match('/[:\/?#]/', $addr)) $addr = '';
  return $addr;
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
  // Tests locaux uniquement (scripts/test-*.php) : faux OxaPay, jamais en ligne.
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_OXA']) && is_callable($GLOBALS['OROLADO_FAKE_OXA'])) return ($GLOBALS['OROLADO_FAKE_OXA'])($method, $path, $body);
  $url = 'https://api.oxapay.com' . $path;
  $headers = [
    'Accept: application/json',
    'Content-Type: application/json',
    'merchant_api_key: ' . orolado_oxapay_key(),
    'Authorization: Bearer ' . orolado_oxapay_key(),
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
    'completed', 'complete', 'confirmed', 'confirming', 'confirming_payment',
    'success', 'successful', 'done',
    'overpaid', 'paid_late', 'manual_accept', 'manual',
  ], true);
}

/** Paiement ENTIÈREMENT terminé (pas « en cours » ni « payé en partie »). */
function orolado_oxapay_full_status(string $status): bool {
  $s = str_replace(['-', ' '], '_', strtolower(trim($status)));
  return in_array($s, ['paid', 'completed', 'complete', 'confirmed', 'success', 'successful', 'done', 'overpaid', 'paid_late', 'manual_accept'], true);
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

/**
 * Cours d'une crypto en dollars (1 pièce = X $). Stablecoins = 1. Sources publiques, sans clé :
 * OxaPay, puis Binance, puis CoinGecko. Gardé 60 s. null si aucune source ne répond.
 */
function orolado_crypto_usd_price(string $sym): ?float {
  $sym = strtoupper(trim($sym));
  if ($sym === '') return null;
  if (orolado_oxapay_is_usd_coin($sym)) return 1.0;
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_PRICES']) && is_array($GLOBALS['OROLADO_FAKE_PRICES'])) {
    $p = $GLOBALS['OROLADO_FAKE_PRICES'][$sym] ?? null;
    return is_numeric($p) && (float) $p > 0 ? (float) $p : null;
  }
  $file = orolado_data_dir() . '/crypto_prices.json';
  $cache = json_decode((string) @file_get_contents($file), true);
  if (!is_array($cache)) $cache = [];
  $hit = $cache[$sym] ?? null;
  if (is_array($hit) && (time() - (int) ($hit['at'] ?? 0)) < 60 && (float) ($hit['p'] ?? 0) > 0) return (float) $hit['p'];
  $price = null;
  $get = static function (string $url): ?array {
    $raw = null;
    if (function_exists('curl_init')) {
      $ch = curl_init($url);
      curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6, CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_HTTPHEADER => ['Accept: application/json', 'User-Agent: OROLADO/1.0']]);
      $raw = curl_exec($ch);
      curl_close($ch);
    }
    $j = is_string($raw) ? json_decode($raw, true) : null;
    return is_array($j) ? $j : null;
  };
  // 1) OxaPay (même prestataire que les dépôts)
  $ox = $get('https://api.oxapay.com/v1/common/prices');
  $oxData = is_array($ox['data'] ?? null) ? $ox['data'] : $ox;
  if (is_array($oxData)) {
    if (isset($oxData[$sym]) && is_numeric($oxData[$sym])) $price = (float) $oxData[$sym];
    foreach ($oxData as $row) {
      if ($price || !is_array($row)) continue;
      $s = strtoupper((string) ($row['symbol'] ?? $row['currency'] ?? ''));
      $v = $row['price'] ?? $row['usd'] ?? $row['rate'] ?? null;
      if ($s === $sym && is_numeric($v)) $price = (float) $v;
    }
  }
  // 2) Binance
  if (!($price > 0)) {
    $bn = $get('https://api.binance.com/api/v3/ticker/price?symbol=' . rawurlencode(($sym === 'POL' ? 'POL' : $sym) . 'USDT'));
    if (is_array($bn) && is_numeric($bn['price'] ?? null)) $price = (float) $bn['price'];
  }
  // 3) CoinGecko
  if (!($price > 0)) {
    $ids = ['BTC' => 'bitcoin', 'ETH' => 'ethereum', 'TRX' => 'tron', 'BNB' => 'binancecoin', 'SOL' => 'solana', 'LTC' => 'litecoin',
      'DOGE' => 'dogecoin', 'XRP' => 'ripple', 'POL' => 'polygon-ecosystem-token', 'SHIB' => 'shiba-inu', 'GRAM' => 'gram-2',
      'XMR' => 'monero', 'BCH' => 'bitcoin-cash', 'NOT' => 'notcoin', 'DOGS' => 'dogs-2', 'TON' => 'the-open-network'];
    if (isset($ids[$sym])) {
      $cg = $get('https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=' . $ids[$sym]);
      if (is_array($cg) && is_numeric($cg[$ids[$sym]]['usd'] ?? null)) $price = (float) $cg[$ids[$sym]]['usd'];
    }
  }
  if (!($price > 0)) return null;
  $cache[$sym] = ['p' => $price, 'at' => time()];
  @file_put_contents($file, json_encode($cache), LOCK_EX);
  return $price;
}

/**
 * Dollars réellement reçus pour une transaction crypto.
 * Avant : le nombre de PIÈCES reçues était pris pour des dollars (20 TRX ≈ 7 $ crédités 20 $,
 * 0,001 BTC ≈ 60 $ crédités 0,001 $). Maintenant : pièces × cours du moment, recoupé avec
 * la valeur en dollars annoncée par OxaPay quand elle existe.
 * Retour : ['usd' => float, 'known' => bool] (known = false : conversion impossible).
 */
function orolado_oxapay_piece_usd(array $row, string $fallbackCur): array {
  $cur = strtoupper(trim((string) ($row['currency'] ?? $row['pay_currency'] ?? $row['payCurrency'] ?? $fallbackCur)));
  $coins = 0.0;
  foreach (['received_amount', 'receivedAmount', 'sent_amount', 'sentAmount', 'pay_amount', 'payAmount', 'amount'] as $k) {
    if (isset($row[$k]) && is_numeric($row[$k]) && (float) $row[$k] > 0) { $coins = (float) $row[$k]; break; }
  }
  // Valeur en dollars annoncée par OxaPay (conversion automatique incluse).
  $said = 0.0;
  foreach (['value', 'sent_value', 'sentValue', 'usd_value', 'usdValue', 'amount_usd', 'usd_amount'] as $k) {
    if (isset($row[$k]) && is_numeric($row[$k]) && (float) $row[$k] > 0) { $said = (float) $row[$k]; break; }
  }
  $ac = is_array($row['auto_convert'] ?? null) ? $row['auto_convert'] : [];
  $acCur = strtoupper((string) ($ac['currency'] ?? $row['auto_convert_currency'] ?? ''));
  $acAmt = (float) ($ac['amount'] ?? $row['auto_convert_amount'] ?? 0);
  if ($acAmt > 0 && orolado_oxapay_is_usd_coin($acCur)) $said = max($said, $acAmt);
  if ($coins <= 0 && $said <= 0) return ['usd' => 0.0, 'known' => true];
  if ($cur === '' || orolado_oxapay_is_usd_coin($cur)) {
    return ['usd' => orolado_money($coins > 0 ? $coins : $said), 'known' => true];
  }
  if ($coins <= 0) return ['usd' => orolado_money($said), 'known' => $said > 0];
  $price = orolado_crypto_usd_price($cur);
  if ($price === null && isset($row['rate']) && is_numeric($row['rate']) && (float) $row['rate'] > 0) $price = (float) $row['rate'];
  if ($price !== null) {
    $calc = $coins * $price;
    // Même ordre de grandeur (±20 %) : on garde le chiffre exact d'OxaPay au moment du paiement.
    if ($said > 0 && abs($said - $calc) <= 0.2 * $calc) return ['usd' => orolado_money($said), 'known' => true];
    return ['usd' => orolado_money($calc), 'known' => true];
  }
  // Pas de cours : la valeur annoncée n'est fiable que si ce n'est pas simplement le nombre de pièces.
  if ($said > 0 && abs($said - $coins) > 1e-9) return ['usd' => orolado_money($said), 'known' => true];
  return ['usd' => 0.0, 'known' => false];
}

/** Dollars reçus pour un paiement OxaPay (somme des transactions). */
function orolado_oxapay_received(array $data): array {
  $cur = strtoupper((string) ($data['pay_currency'] ?? $data['payCurrency'] ?? $data['currency'] ?? ''));
  $total = 0.0;
  $known = true;
  $any = false;
  if (!empty($data['txs']) && is_array($data['txs'])) {
    foreach ($data['txs'] as $tx) {
      if (!is_array($tx)) continue;
      $st = strtolower((string) ($tx['status'] ?? $tx['state'] ?? ''));
      if (in_array($st, ['failed', 'invalid', 'expired', 'replaced', 'rejected'], true)) continue;
      $any = true;
      $p = orolado_oxapay_piece_usd($tx, $cur);
      $total += $p['usd'];
      if (!$p['known']) $known = false;
    }
  }
  if (!$any) {
    // Pas de détail des transactions : seulement les champs « reçu » du paiement lui-même.
    $top = [];
    foreach (['received_amount', 'receivedAmount', 'sent_amount', 'sentAmount', 'paid_amount', 'paidAmount', 'sent_value', 'sentValue', 'value'] as $k) {
      if (isset($data[$k])) $top[$k] = $data[$k];
    }
    if ($top) {
      $top['currency'] = $cur;
      $p = orolado_oxapay_piece_usd($top, $cur);
      $total = $p['usd'];
      $known = $p['known'];
    }
  }
  return ['usd' => orolado_money($total), 'known' => $known];
}

/** USD réellement reçu (0 si rien de reçu ou conversion impossible). */
function orolado_oxapay_received_usd(array $data): float {
  $r = orolado_oxapay_received($data);
  return $r['known'] ? (float) $r['usd'] : 0.0;
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

/** Ajoute un dépôt sous verrou (sans réécrire une vieille copie du fichier), s'il n'existe pas déjà. */
function orolado_deposit_append_locked($dep): void {
  if (!is_array($dep)) return;
  with_db_lock(function ($box) use ($dep) {
    $id = (string) ($dep['id'] ?? '');
    foreach (($box->db['deposits'] ?? []) as $row) {
      if (is_array($row) && (string) ($row['id'] ?? '') === $id) return ['ok' => true, 'skip_write' => true];
    }
    $box->db['deposits'][] = $dep;
    return ['ok' => true];
  });
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
    // Mise à jour sous verrou, sur le fichier à jour (une vieille copie pouvait remettre un
    // dépôt déjà crédité en « PENDING » et provoquer un 2e crédit).
    $depRef = $ref;
    with_db_lock(function ($box) use ($depRef, $usd, $trackId, $txid) {
      foreach ($box->db['deposits'] as $k => $row) {
        if (!is_array($row) || (string) ($row['id'] ?? $row['ref'] ?? '') !== $depRef) continue;
        $stRow = strtoupper((string) ($row['status'] ?? ''));
        if ($stRow === 'COMPLETED' || $stRow === 'PAID') return ['ok' => true, 'skip_write' => true];
        $box->db['deposits'][$k]['amount'] = $usd;
        $box->db['deposits'][$k]['trackId'] = $trackId;
        $box->db['deposits'][$k]['txid'] = $txid !== '' ? $txid : $trackId;
        $box->db['deposits'][$k]['operator'] = 'oxapay';
        return ['ok' => true];
      }
      return ['ok' => true, 'skip_write' => true];
    });
    break;
  }
  if ($ref === '' && $email !== '') {
    foreach (orolado_users_by_email($db, $email) as $id => $u) {
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
      orolado_deposit_append_locked(end($db['deposits']));
      break;
    }
  }
  if ($ref === '') {
    $uidGuess = orolado_oxapay_uid_from_order($orderId, $db);
    if ($uidGuess !== '') {
      $uid = $uidGuess;
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
      orolado_deposit_append_locked(end($db['deposits']));
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
  if ($amount <= 0 || $amount + 0.0001 < $minUsd) $amount = $minUsd;
  $uid = (string) $me['id'];
  $reuse = orolado_oxapay_open_invoice($db, $uid, $coin);
  if ($reuse && trim((string) ($reuse['address'] ?? '')) !== '') {
    return [
      'ok' => true,
      'server' => true,
      'orderId' => (string) ($reuse['id'] ?? $reuse['ref'] ?? ''),
      'trackId' => (string) ($reuse['trackId'] ?? ''),
      'address' => trim((string) $reuse['address']),
      'amount' => orolado_money($reuse['amount'] ?? $amount),
      'payAmount' => orolado_money($reuse['amount'] ?? $amount),
      'payCurrency' => $meta['pay'],
      'network' => (string) ($reuse['network'] ?? $meta['netLabel']),
      'coin' => $coin,
      'qr' => '',
      'expiredAt' => 0,
      'memo' => '',
      'reused' => true,
    ];
  }
  // Anti-robots : on ne compte que les NOUVELLES adresses créées chez OxaPay (60 par heure et par
  // compte). Les adresses déjà créées et réutilisées (changer de monnaie, rouvrir) ne comptent pas.
  $rlTok = trim((string) ($req['token'] ?? ''));
  if ($rlTok !== '' && !orolado_rate_ok('pay_oxapay', $rlTok, 60, 3600)) return ['ok' => false, 'server' => true, 'rate' => true, 'reason' => 'Trop de demandes. Réessayez dans un moment.'];
  $orderId = 'oro_' . preg_replace('/[^a-zA-Z0-9]/', '', $uid) . '_' . bin2hex(random_bytes(6));
  $callback = rtrim(orolado_public_origin(), '/') . '/api/oxapay/webhook';
  $payerEmail = orolado_oxapay_payer_email($me);
  $base = [
    'amount' => $amount,
    'currency' => 'USD',
    'pay_currency' => $meta['pay'],
    'lifetime' => 1440,
    'callback_url' => $callback,
    'order_id' => $orderId,
    'under_paid_coverage' => 60,
    'description' => 'OROLADO ' . $meta['label'] . ' ' . $meta['netLabel'],
  ];
  if ($payerEmail !== '') $base['email'] = $payerEmail;
  if ($meta['network'] !== '') $base['network'] = $meta['network'];
  $res = orolado_oxapay_http('POST', '/v1/payment/white-label', $base);
  $data = is_array($res) ? orolado_oxapay_extract($res) : [];
  if (orolado_oxapay_addr($data) === '' && $coin === 'eth') {
    foreach (['ETH', 'ERC20'] as $netTry) {
      $try = $base;
      $try['network'] = $netTry;
      $res = orolado_oxapay_http('POST', '/v1/payment/white-label', $try);
      $data = is_array($res) ? orolado_oxapay_extract($res) : [];
      if (orolado_oxapay_addr($data) !== '') {
        $meta['network'] = $netTry;
        break;
      }
    }
  }
  if (orolado_oxapay_addr($data) === '' && $meta['network'] !== '') {
    $try = $base;
    unset($try['network']);
    $res = orolado_oxapay_http('POST', '/v1/payment/white-label', $try);
    $data = is_array($res) ? orolado_oxapay_extract($res) : [];
    if (orolado_oxapay_addr($data) !== '') $meta['network'] = '';
  }
  if (orolado_oxapay_addr($data) === '') {
    $retry = $base;
    unset($retry['under_paid_coverage'], $retry['email'], $retry['network']);
    $res = orolado_oxapay_http('POST', '/v1/payment/white-label', $retry);
    $data = is_array($res) ? orolado_oxapay_extract($res) : [];
  }
  if (orolado_oxapay_addr($data) === '') {
    $legacy = [
      'merchant' => orolado_oxapay_key(),
      'payCurrency' => $meta['pay'],
      'amount' => $amount,
      'currency' => 'USD',
      'lifeTime' => 1440,
      'callbackUrl' => $callback,
      'orderId' => $orderId,
      'underPaidCover' => 60,
      'description' => 'OROLADO ' . $meta['label'],
    ];
    if ($payerEmail !== '') $legacy['email'] = $payerEmail;
    if ($meta['network'] !== '') $legacy['network'] = $meta['network'];
    $res = orolado_oxapay_http('POST', '/merchants/request/whitelabel', $legacy);
    $data = is_array($res) ? orolado_oxapay_extract($res) : [];
    if (orolado_oxapay_addr($data) === '' && $coin === 'eth') {
      foreach (['ETH', 'ERC20'] as $netTry) {
        $legacy['network'] = $netTry;
        $res = orolado_oxapay_http('POST', '/merchants/request/whitelabel', $legacy);
        $data = is_array($res) ? orolado_oxapay_extract($res) : [];
        if (orolado_oxapay_addr($data) !== '') break;
      }
    }
  }
  $addr = orolado_oxapay_addr(is_array($data) ? $data : []);
  if ($addr === '') {
    orolado_oxapay_log('invoice_fail', [
      'coin' => $coin,
      'http' => is_array($res) ? (int) ($res['_http'] ?? 0) : 0,
      'key' => is_array($res) ? (string) ($res['error']['key'] ?? '') : '',
      'msg' => is_array($res) ? substr((string) (($res['error']['message'] ?? '') ?: ($res['message'] ?? '')), 0, 180) : 'no_res',
    ]);
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
      'user_id' => orolado_balance_uuid($db, $uid),
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
  // SÉCURITÉ : on vérifie TOUJOURS le paiement enregistré pour ce dépôt, jamais un numéro de
  // suivi envoyé par le téléphone (sinon on pouvait faire créditer son dépôt avec le paiement
  // d'un autre joueur).
  $tid = (string) ($dep['trackId'] ?? '');
  if ($tid === '') return ['ok' => true, 'pending' => true];
  $data = orolado_oxapay_inquiry($tid);
  $dataOrder = (string) ($data['order_id'] ?? $data['orderId'] ?? '');
  if ($dataOrder !== '' && strcasecmp($dataOrder, (string) ($dep['id'] ?? '')) !== 0 && strcasecmp($dataOrder, (string) ($dep['ref'] ?? '')) !== 0) {
    return ['ok' => true, 'pending' => true];
  }
  $status = orolado_oxapay_payload_status($data);
  $recv = orolado_oxapay_received($data);
  if (!$recv['known']) {
    orolado_health_event('Dépôts', 'Dépôt crypto reçu (suivi ' . $tid . ') mais cours introuvable pour le convertir en dollars : il reste en attente. Validez-le à la main dans « Dépôts en Attente » après vérification sur OxaPay.', 'warn');
    return ['ok' => true, 'pending' => true];
  }
  $received = (float) $recv['usd'];
  $usd = $received > 0.0001 ? $received : orolado_oxapay_usd($data);
  $payable = orolado_oxapay_paid_status($status) || $received + 0.0001 >= orolado_oxapay_credit_floor();
  if (!$payable) {
    return ['ok' => true, 'pending' => true, 'oxaStatus' => $status];
  }
  if ($received + 0.0001 >= orolado_oxapay_credit_floor()) $usd = $received;
  elseif ($usd + 0.0001 < orolado_oxapay_credit_floor() && orolado_oxapay_full_status($status)) $usd = orolado_money($dep['amount'] ?? 0);
  if (!orolado_oxapay_net_ok($data, $dep)) return ['ok' => true, 'pending' => true];
  if ($usd + 0.0001 < orolado_oxapay_credit_floor()) return ['ok' => true, 'pending' => true];
  $txid = (string) ($data['txs'][0]['tx_hash'] ?? $data['txs'][0]['txHash'] ?? $data['txs'][0]['hash'] ?? $tid);
  $addr = trim((string) ($data['address'] ?? $dep['address'] ?? ''));
  return orolado_oxapay_credit((string) ($dep['id'] ?? $orderId), $tid, $usd, $txid, $addr, (string) ($me['email'] ?? ''));
}

/**
 * Nouvel envoi sur une adresse DÉJÀ payée (l'adresse du profil / du Recharger reste la même) :
 * avant, il était pris pour un doublon et jamais crédité. On ne crédite que les transactions
 * nouvelles, jamais plus que le total reçu moins ce qui a déjà été crédité sur cette adresse.
 * $data doit venir d'OxaPay (lecture directe ou message signé).
 */
function orolado_oxapay_extra_payment(array $data, array $dep): array {
  $parentId = (string) ($dep['id'] ?? $dep['ref'] ?? '');
  $uid = (string) ($dep['userId'] ?? '');
  if ($parentId === '' || $uid === '' || empty($data['txs']) || !is_array($data['txs'])) return ['ok' => false, 'code' => 'none'];
  $cur = strtoupper((string) ($data['pay_currency'] ?? $data['payCurrency'] ?? $data['currency'] ?? ''));
  $db = load_db(orolado_data_file());
  $known = [];
  $already = orolado_money($dep['amount'] ?? 0);
  foreach ([(string) ($dep['txid'] ?? ''), (string) ($dep['extId'] ?? '')] as $h) if ($h !== '') $known[strtolower($h)] = true;
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || (string) ($d['parentId'] ?? '') !== $parentId) continue;
    $stc = strtoupper((string) ($d['status'] ?? ''));
    if ($stc === 'COMPLETED' || $stc === 'PAID') $already = orolado_money($already + (float) ($d['amount'] ?? 0));
    foreach (array_merge([(string) ($d['extId'] ?? ''), (string) ($d['txid'] ?? '')], (array) ($d['txids'] ?? [])) as $h) if ($h !== '') $known[strtolower((string) $h)] = true;
  }
  $total = 0.0; $newUsd = 0.0; $newHashes = [];
  foreach ($data['txs'] as $tx) {
    if (!is_array($tx)) continue;
    $st = strtolower((string) ($tx['status'] ?? $tx['state'] ?? ''));
    if (in_array($st, ['failed', 'invalid', 'expired', 'replaced', 'rejected'], true)) continue;
    $p = orolado_oxapay_piece_usd($tx, $cur);
    if (!$p['known']) return ['ok' => false, 'code' => 'no_price'];
    $total += $p['usd'];
    $h = trim((string) ($tx['tx_hash'] ?? $tx['txHash'] ?? $tx['hash'] ?? ''));
    if ($h !== '' && (isset($known[strtolower($h)]) || orolado_txid_already_used($db, $h))) { $oldInList = true; continue; }
    if ($h === '') continue;
    $newUsd += $p['usd'];
    $newHashes[] = $h;
  }
  if (!$newHashes) return ['ok' => true, 'duplicate' => true];
  // Les anciens envois sont dans la même liste : on retire ce qui a déjà été crédité.
  // Paiement séparé chez OxaPay (seulement les nouveaux envois) : tout est nouveau.
  $usd = orolado_money(!empty($oldInList) ? min($newUsd, $total - $already) : $newUsd);
  // Moins de la moitié des nouvelles transactions est « en plus » : elles étaient déjà comptées.
  if ($usd + 0.0001 < orolado_oxapay_credit_floor() || $usd + 0.0001 < 0.5 * $newUsd) return ['ok' => true, 'duplicate' => true];
  sort($newHashes);
  $childId = $parentId . '_x' . substr(sha1(implode('|', $newHashes)), 0, 10);
  orolado_deposit_append_locked([
    'id' => $childId,
    'ref' => $childId,
    'parentId' => $parentId,
    'userId' => $uid,
    'operator' => 'oxapay',
    'network' => (string) ($dep['network'] ?? ''),
    'coin' => (string) ($dep['coin'] ?? ''),
    'status' => 'PENDING',
    'amount' => $usd,
    'currency' => 'USD',
    'txid' => $newHashes[0],
    'txids' => $newHashes,
    'at' => date('c'),
  ]);
  // Seulement ref + extId : le numéro de suivi / l'adresse désigneraient l'ancien dépôt déjà payé.
  $paid = credit_paid_deposit([
    'ref' => $childId,
    'amount' => $usd,
    'extId' => $newHashes[0],
    'paid' => true,
    'creditReceived' => true,
    'allowSmall' => true,
    'operator' => 'oxapay',
  ]);
  if (!empty($paid['ok']) && empty($paid['duplicate'])) {
    $db = load_db(orolado_data_file());
    $vault = orolado_crypto_vault($db, $uid);
    supabase_sync_real_min($uid, $vault['real'] ?? 0);
  }
  return ['ok' => !empty($paid['ok']), 'duplicate' => !empty($paid['duplicate']), 'amount' => $usd, 'id' => $childId, 'code' => (string) ($paid['reason'] ?? '')];
}

/**
 * Rattrapage : le joueur ouvre le site → on redemande à OxaPay l'état de ses dépôts crypto des
 * 2 derniers jours (message d'OxaPay perdu, écran « En attente » fermé trop tôt, nouvel envoi
 * sur une adresse déjà payée). Au plus une fois toutes les 90 s par joueur, 4 dépôts maximum.
 */
function orolado_oxapay_recheck(array $req): array {
  $db = load_db(orolado_data_file());
  $token = (string) ($req['token'] ?? '');
  $me = orolado_session_user($db, $token);
  if (!$me) return ['ok' => false, 'server' => true, 'code' => 'session'];
  $uid = (string) $me['id'];
  if (!orolado_rate_ok('oxa_recheck', $uid, 1, 90)) return ['ok' => true, 'skipped' => true];
  $cut = time() - 48 * 3600;
  $list = [];
  foreach (array_reverse($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || (string) ($d['userId'] ?? '') !== $uid) continue;
    if (strtolower((string) ($d['operator'] ?? '')) !== 'oxapay' || (string) ($d['parentId'] ?? '') !== '') continue;
    if (trim((string) ($d['trackId'] ?? '')) === '') continue;
    $at = strtotime((string) ($d['at'] ?? '')) ?: 0;
    if ($at < $cut) continue;
    $list[] = $d;
    if (count($list) >= 6) break;
  }
  $credited = 0.0;
  // Envois déjà passés sur une adresse payée, sous un autre numéro de suivi chez OxaPay : on
  // reprend les numéros notés dans le journal (48 h), chacun interrogé UNE seule fois en tout.
  // Le dépôt est celui qu'OxaPay désigne lui-même (numéro de commande ou adresse).
  $doneFile = orolado_data_dir() . '/oxapay_tracks_done.json';
  $done = is_file($doneFile) ? (json_decode((string) @file_get_contents($doneFile), true) ?: []) : [];
  $knownTracks = [];
  foreach (($db['deposits'] ?? []) as $d) if (is_array($d) && ($d['trackId'] ?? '') !== '') $knownTracks[strtolower((string) $d['trackId'])] = true;
  $logFile = orolado_data_dir() . '/oxapay_webhook.log';
  $todo = [];
  if (is_file($logFile)) {
    foreach (array_reverse(array_slice(file($logFile, FILE_IGNORE_NEW_LINES) ?: [], -3000)) as $line) {
      $row = json_decode($line, true);
      if (!is_array($row)) continue;
      $tid = trim((string) ($row['trackId'] ?? ''));
      if ($tid === '' || isset($knownTracks[strtolower($tid)]) || isset($done[$tid]) || isset($todo[$tid])) continue;
      if ((strtotime((string) ($row['ts'] ?? '')) ?: 0) < $cut) continue;
      $todo[$tid] = true;
      if (count($todo) >= 4) break;
    }
  }
  foreach (array_keys($todo) as $tid) {
    $tid = (string) $tid;
    $live = orolado_oxapay_inquiry($tid);
    if (!$live) continue;
    $liveOrder = (string) ($live['order_id'] ?? $live['orderId'] ?? '');
    $liveAddr = orolado_oxapay_addr($live);
    $d = ($liveOrder !== '' || $liveAddr !== '') ? orolado_oxapay_find_dep($liveOrder, '', $liveAddr) : null;
    $st = $d ? strtoupper((string) ($d['status'] ?? '')) : '';
    if ($st !== 'COMPLETED' && $st !== 'PAID') { $done[$tid] = time(); continue; }
    // Envoi pas encore confirmé : on réessaiera à la prochaine ouverture.
    $recvL = orolado_oxapay_received($live);
    if (!$recvL['known'] || $recvL['usd'] + 0.0001 < orolado_oxapay_credit_floor()) continue;
    $done[$tid] = time();
    $x = orolado_oxapay_extra_payment($live, $d);
    if (!empty($x['ok']) && empty($x['duplicate'])) {
      if ((string) ($d['userId'] ?? '') === $uid) $credited += (float) ($x['amount'] ?? 0);
      orolado_oxapay_log('recheck_extra', ['orderId' => (string) ($d['id'] ?? ''), 'track' => $tid] + $x);
    }
  }
  if ($todo) {
    foreach ($done as $k => $t) if ((int) $t < time() - 7 * 86400) unset($done[$k]);
    @file_put_contents($doneFile, json_encode($done), LOCK_EX);
  }
  foreach ($list as $d) {
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st === 'COMPLETED' || $st === 'PAID') {
      $live = orolado_oxapay_inquiry((string) $d['trackId']);
      $liveOrder = (string) ($live['order_id'] ?? $live['orderId'] ?? '');
      if (!$live || ($liveOrder !== '' && strcasecmp($liveOrder, (string) ($d['id'] ?? '')) !== 0)) continue;
      $x = orolado_oxapay_extra_payment($live, $d);
      if (!empty($x['ok']) && empty($x['duplicate'])) {
        $credited += (float) ($x['amount'] ?? 0);
        orolado_oxapay_log('recheck_extra', ['orderId' => (string) ($d['id'] ?? '')] + $x);
      }
      continue;
    }
    $r = orolado_oxapay_status(['token' => $token, 'orderId' => (string) ($d['id'] ?? '')]);
    if (!empty($r['paid']) && empty($r['duplicate'])) {
      $credited += (float) ($r['amount'] ?? 0);
      orolado_oxapay_log('recheck_credit', ['orderId' => (string) ($d['id'] ?? ''), 'usd' => $r['amount'] ?? 0]);
    }
  }
  return ['ok' => true, 'checked' => count($list), 'credited' => orolado_money($credited)];
}


function orolado_oxapay_apply_payload(array $data, bool $signed = false): array {
  if (isset($data['data']) && is_array($data['data'])) $data = array_merge($data, $data['data']);
  if (isset($data['result']) && is_array($data['result'])) $data = array_merge($data, $data['result']);
  $type = strtolower((string) ($data['type'] ?? ''));
  if ($type === 'payout') return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $orderId = (string) ($data['order_id'] ?? $data['orderId'] ?? $data['merchant_order_id'] ?? $data['merchantOrderId'] ?? '');
  $trackId = (string) ($data['track_id'] ?? $data['trackId'] ?? $data['trackid'] ?? '');
  $address = orolado_oxapay_addr($data);
  if ($address === '') $address = trim((string) ($data['address'] ?? $data['pay_address'] ?? $data['wallet_address'] ?? ''));
  $email = strtolower(trim((string) ($data['email'] ?? $data['payer_email'] ?? $data['payerEmail'] ?? '')));
  $depProbe = orolado_oxapay_find_dep($orderId, $trackId, $address, $email);
  if ($trackId === '' && $depProbe) $trackId = (string) ($depProbe['trackId'] ?? '');
  $hookPaid = orolado_oxapay_paid_status(orolado_oxapay_payload_status($data))
    || orolado_oxapay_received_usd($data) + 0.0001 >= orolado_oxapay_credit_floor();
  $livePaid = false;
  $liveData = [];
  if ($trackId !== '') {
    $live = orolado_oxapay_inquiry($trackId);
    if ($live) {
      $liveStatus = orolado_oxapay_payload_status($live);
      $liveRecv = orolado_oxapay_received_usd($live);
      $livePaid = orolado_oxapay_paid_status($liveStatus) || $liveRecv + 0.0001 >= orolado_oxapay_credit_floor();
      if ($livePaid) { $data = array_merge($data, $live); $liveData = $live; }
    }
  }
  $known = is_array($depProbe);
  // Sécurité : sans signature valide, seuls les chiffres lus directement chez OxaPay comptent.
  if (!$livePaid && !($signed && $hookPaid)) {
    orolado_oxapay_log('webhook_skip', ['reason' => 'unconfirmed', 'signed' => $signed, 'hookPaid' => $hookPaid, 'known' => $known, 'orderId' => $orderId, 'trackId' => $trackId]);
    return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  }
  $status = orolado_oxapay_payload_status($data);
  $recv = orolado_oxapay_received($data);
  if (!$recv['known']) {
    orolado_health_event('Dépôts', 'Dépôt crypto reçu (suivi ' . $trackId . ') mais cours introuvable pour le convertir en dollars : il reste en attente. Validez-le à la main après vérification sur OxaPay.', 'warn');
    orolado_oxapay_log('webhook_skip', ['reason' => 'no_price', 'trackId' => $trackId]);
    return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  }
  $received = (float) $recv['usd'];
  $usd = $received > 0.0001 ? $received : orolado_oxapay_usd($data);
  $orderId = (string) ($data['order_id'] ?? $data['orderId'] ?? $orderId);
  $trackId = (string) ($data['track_id'] ?? $data['trackId'] ?? $trackId);
  $address = trim((string) ($data['address'] ?? $address));
  $email = strtolower(trim((string) ($data['email'] ?? $data['payer_email'] ?? $email)));
  $dep = orolado_oxapay_find_dep($orderId, $trackId, $address, $email);
  // SÉCURITÉ : message non signé = on ne crédite que le dépôt dont le numéro de suivi est
  // EXACTEMENT celui du paiement vérifié chez OxaPay (pas un autre dépôt désigné par l'envoyeur).
  if (!$signed && (!$dep || strcasecmp((string) ($dep['trackId'] ?? ''), $trackId) !== 0)) {
    // Dernière chance, sans croire l'envoyeur : le dépôt désigné par OxaPay LUI-MÊME (numéro de
    // commande ou adresse lus directement chez OxaPay pour ce paiement).
    $liveOrder = (string) ($liveData['order_id'] ?? $liveData['orderId'] ?? '');
    $liveAddr = orolado_oxapay_addr($liveData);
    $depLive = ($liveOrder !== '' || $liveAddr !== '') ? orolado_oxapay_find_dep($liveOrder, '', $liveAddr) : null;
    if (!$depLive) {
      orolado_oxapay_log('webhook_skip', ['reason' => 'track_mismatch', 'orderId' => $orderId, 'trackId' => $trackId]);
      return ['ok' => true, 'http' => 200, 'body' => 'OK'];
    }
    $dep = $depLive;
    $orderId = (string) ($depLive['id'] ?? $depLive['ref'] ?? '');
    $address = (string) ($depLive['address'] ?? '');
    $email = '';
  }
  $payable = orolado_oxapay_paid_status($status) || $received + 0.0001 >= orolado_oxapay_credit_floor() || $livePaid || ($signed && $hookPaid);
  if (!$payable) return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $depSt = $dep ? strtoupper((string) ($dep['status'] ?? '')) : '';
  if ($depSt === 'COMPLETED' || $depSt === 'PAID') {
    $extra = orolado_oxapay_extra_payment($data, $dep);
    orolado_oxapay_log('webhook_extra', ['orderId' => $orderId, 'trackId' => $trackId, 'signed' => $signed, 'livePaid' => $livePaid] + $extra);
    return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  }
  if ($received + 0.0001 >= orolado_oxapay_credit_floor()) $usd = $received;
  elseif ($dep && $usd + 0.0001 < orolado_oxapay_credit_floor() && orolado_oxapay_full_status($status)) $usd = orolado_money($dep['amount'] ?? 0);
  if (!orolado_oxapay_net_ok($data, $dep)) return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $txid = (string) ($data['txs'][0]['tx_hash'] ?? $data['txs'][0]['txHash'] ?? $data['txs'][0]['hash'] ?? $data['tx_hash'] ?? $data['txHash'] ?? $trackId);
  if ($orderId === '' && $trackId === '' && $address === '' && $email === '') return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  if ($usd + 0.0001 < orolado_oxapay_credit_floor()) return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  $credited = orolado_oxapay_credit($orderId, $trackId, $usd, $txid, $address, $email);
  orolado_oxapay_log('webhook_credit', [
    'orderId' => $orderId,
    'trackId' => $trackId,
    'usd' => $usd,
    'signed' => $signed,
    'livePaid' => $livePaid,
    'ok' => !empty($credited['ok']),
    'code' => $credited['code'] ?? '',
    'duplicate' => !empty($credited['duplicate']),
  ]);
  return ['ok' => true, 'http' => 200, 'body' => 'OK'];
}

function orolado_oxapay_parse_body(string $raw): array {
  $data = json_decode($raw, true);
  if (is_array($data)) return $data;
  if ($raw !== '') {
    $parsed = [];
    parse_str($raw, $parsed);
    if (is_array($parsed) && $parsed !== []) return $parsed;
  }
  return is_array($_POST) ? $_POST : [];
}

function orolado_oxapay_webhook(string $raw, string $hmacHeader): array {
  $data = orolado_oxapay_parse_body($raw);
  if (!is_array($data) || $data === []) {
    orolado_oxapay_log('webhook_empty', ['len' => strlen($raw)]);
    return ['ok' => true, 'http' => 200, 'body' => 'OK'];
  }
  $signed = orolado_oxapay_hmac_ok($raw, $hmacHeader);
  orolado_oxapay_log('webhook_in', [
    'signed' => $signed,
    'keys' => array_keys($data),
    'status' => orolado_oxapay_payload_status($data),
    'orderId' => (string) ($data['order_id'] ?? $data['orderId'] ?? ''),
    'trackId' => (string) ($data['track_id'] ?? $data['trackId'] ?? ''),
  ]);
  return orolado_oxapay_apply_payload($data, $signed);
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
// Un seul taux pour la carte en francs CFA, dans les deux sens : 600 FCFA = 1 $ par défaut
// (réglable dans .env : USD_FCFA_RATE). Avant : 666,67 FCFA par dollar.
function orolado_usd_to_cfa_int($usd): int {
  return (int) max(100, round(orolado_money($usd) * orolado_usd_fcfa_rate()));
}

function orolado_cfa_to_usd($cfa): float {
  return orolado_money(((float) $cfa) / orolado_usd_fcfa_rate());
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
    // (string) : PHP range les clés '225'… comme des nombres → str_starts_with plantait (bug trouvé en v2626).
    if (str_starts_with($d, (string) $pref)) return $cc;
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
  $usd = max(orolado_money($usd), 1.0); // v3020 : 1 $ minimum (avant 3 $)
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
  // Tests locaux uniquement (scripts/test-*.php) : faux Flutterwave, jamais en ligne.
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_FLW']) && is_callable($GLOBALS['OROLADO_FAKE_FLW'])) return ($GLOBALS['OROLADO_FAKE_FLW'])($method, $path, $body);
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
  // Anti-robots : 30 demandes de paiement par heure et par compte (toutes portes confondues).
  $rlTok = trim((string) ($req['token'] ?? ''));
  if ($rlTok !== '' && !orolado_rate_ok('pay_flutterwave', $rlTok, 30, 3600)) return ['ok' => false, 'server' => true, 'rate' => true, 'reason' => 'Trop de demandes. Réessayez dans un moment.'];
  $file = orolado_data_file();
  $db = load_db($file);
  $token = (string) ($req['token'] ?? '');
  $me = orolado_session_user($db, $token);
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide', 'code' => 'session'];
  if (!orolado_flw_configured()) {
    return ['ok' => false, 'server' => true, 'reason' => 'Paiement carte indisponible pour le moment.', 'code' => 'keys'];
  }
  $amountUsd = orolado_money($req['amount'] ?? 0);
  $minUsd = 1.0; // v3020 (propriétaire) : 1 $ (avant 3 $)
  if ($amountUsd + 0.0001 < $minUsd) {
    return ['ok' => false, 'server' => true, 'reason' => 'Le dépôt minimum est de $1.00.', 'code' => 'min'];
  }
  $cust = orolado_flw_customer($me, $token);
  if (!orolado_flw_email_ok((string) ($cust['email'] ?? ''))) {
    $cust['email'] = 'admin@orolado.com';
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
    'logo' => $origin . '/icons/icon-192.png?v=2656',
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
    'user_id' => orolado_balance_uuid($db, $uid),
    'amount' => $amountUsd,
    'status' => 'PENDING',
    'reference' => $ref,
    'operator' => 'flutterwave',
  ]);
  // v2625 (propriétaire) — WAVE NE S'OUVRAIT PAS chez Flutterwave : leur fenêtre « inline » est une page intégrée,
  // et iPhone / Android interdisent à une page intégrée d'ouvrir l'application Wave. On demande à Flutterwave un
  // LIEN de paiement (page ouverte en plein) ; au retour, /api/flutterwave/callback vérifie, crédite et ramène le
  // joueur sur le site. Si le lien n'est pas obtenu, l'ancienne fenêtre reste en secours.
  $link = '';
  $std = orolado_flw_http('POST', '/payments', [
    'tx_ref' => $ref,
    'amount' => $charge['amount'],
    'currency' => $charge['currency'],
    'redirect_url' => $origin . '/api/flutterwave/callback',
    'customer' => $customer,
    'customizations' => $customizations,
    'payment_options' => orolado_flw_payment_options($cc),
  ]);
  $cand = is_array($std) ? (string) ($std['data']['link'] ?? '') : '';
  if ($cand !== '' && preg_match('#^https://[a-z0-9.-]*flutterwave\.com/#i', $cand)) $link = $cand;
  return [
    'ok' => true,
    'server' => true,
    'inline' => true,
    'link' => $link,
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

/**
 * v2626 (propriétaire) — Mobile Money PAR FLUTTERWAVE EN DIRECT (Wave, Orange, MTN, Moov).
 * Pourquoi : dans l'écran de Flutterwave, Wave s'affiche dans un cadre intégré et le téléphone refuse d'ouvrir
 * l'application Wave (Flutterwave le dit lui-même dans sa documentation). Ici, notre serveur demande le paiement
 * directement (POST /v3/charges?type=mobile_money_franco) et renvoie le lien Wave, ouvert EN PLEIN par le site.
 * Crédit : seulement après vérification Flutterwave (retour /api/flutterwave/callback, webhook, surveillance).
 */
function orolado_flw_momo_networks(): array {
  return ['wave' => 'WAVE', 'orange' => 'ORANGEMONEY', 'mtn' => 'MTN', 'moov' => 'MOOV'];
}

function orolado_flutterwave_momo_charge(array $req): array {
  $rlTok = trim((string) ($req['token'] ?? ''));
  if ($rlTok !== '' && !orolado_rate_ok('pay_flutterwave', $rlTok, 30, 3600)) return ['ok' => false, 'server' => true, 'rate' => true, 'reason' => 'Trop de demandes. Réessayez dans un moment.'];
  $file = orolado_data_file();
  $db = load_db($file);
  $me = orolado_session_user($db, (string) ($req['token'] ?? ''));
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide', 'code' => 'session'];
  if (!orolado_flw_configured()) return ['ok' => false, 'server' => true, 'reason' => 'Mobile Money indisponible pour le moment.', 'code' => 'keys'];
  $amountUsd = orolado_money($req['amount'] ?? 0);
  if ($amountUsd + 0.0001 < 1.0) return ['ok' => false, 'server' => true, 'reason' => 'Le dépôt minimum est de $1.', 'code' => 'min']; // v3020 : 1 $ (avant 3 $)
  $nets = orolado_flw_momo_networks();
  $netKey = strtolower(trim((string) ($req['network'] ?? 'wave')));
  if (!isset($nets[$netKey])) $netKey = 'wave';
  $digits = preg_replace('/\D/', '', (string) ($req['phone'] ?? '')) ?? '';
  // Pays d'après l'indicatif (Côte d'Ivoire par défaut : 10 chiffres sans indicatif).
  if (strlen($digits) === 10 && $digits[0] === '0') $digits = '225' . $digits;
  $cc = orolado_flw_dial_country('', $digits);
  // v2631 : longueur exacte par pays (CI = 225 + 10 chiffres, SN = 221 + 9) : un numéro d'un pays ne part jamais
  // vers l'autre. Wave : seulement Côte d'Ivoire et Sénégal.
  $lenOk = ['CI' => 13, 'SN' => 12, 'BF' => 11, 'CM' => 12];
  if ($netKey === 'wave' && !in_array($cc, ['CI', 'SN'], true)) $cc = '';
  if ($cc !== '' && isset($lenOk[$cc]) && strlen($digits) !== $lenOk[$cc]) $cc = '';
  if ($cc === '' || strlen($digits) < 11 || strlen($digits) > 15) {
    return ['ok' => false, 'server' => true, 'reason' => 'Numéro Mobile Money invalide.', 'code' => 'phone'];
  }
  $isXaf = in_array($cc, orolado_flw_xaf_countries(), true);
  $currency = $isXaf ? 'XAF' : 'XOF';
  $payAmount = orolado_usd_to_cfa_int($amountUsd);
  $cust = orolado_flw_customer($me, (string) ($req['token'] ?? ''));
  $email = orolado_flw_email_ok((string) ($cust['email'] ?? '')) ? (string) $cust['email'] : 'admin@orolado.com';
  $name = trim((string) ($cust['name'] ?? '')) !== '' ? (string) $cust['name'] : (string) ($me['displayName'] ?? 'Client');
  $uid = (string) $me['id'];
  $ref = 'flw_' . preg_replace('/[^a-zA-Z0-9]/', '', $uid) . '_' . bin2hex(random_bytes(6));
  $origin = rtrim(orolado_public_origin(), '/');
  with_db_lock(function ($box) use ($ref, $uid, $amountUsd, $payAmount, $currency, $cc, $netKey, $email, $name, $digits) {
    if (!isset($box->db['deposits']) || !is_array($box->db['deposits'])) $box->db['deposits'] = [];
    $box->db['deposits'][] = [
      'id' => $ref, 'ref' => $ref, 'userId' => $uid, 'operator' => 'flutterwave', 'status' => 'PENDING',
      'amount' => $amountUsd, 'payAmount' => $payAmount, 'payCurrency' => $currency, 'method' => 'mobilemoney_' . $netKey,
      'country' => $cc, 'customerEmail' => $email, 'customerName' => $name, 'customerPhone' => '+' . $digits,
      'currency' => 'USD', 'clientIp' => orolado_request_ip(), 'userAgent' => orolado_request_ua(), 'at' => date('c'),
    ];
    return ['ok' => true];
  });
  supabase_insert_deposit(['id' => $ref, 'user_id' => orolado_balance_uuid($db, $uid), 'amount' => $amountUsd, 'status' => 'PENDING', 'reference' => $ref, 'operator' => 'flutterwave']);
  $res = orolado_flw_http('POST', '/charges?type=mobile_money_franco', [
    'tx_ref' => $ref,
    'amount' => $payAmount,
    'currency' => $currency,
    'country' => $cc,
    'network' => $nets[$netKey],
    'phone_number' => $digits,
    'email' => $email,
    'fullname' => $name,
    'redirect_url' => $origin . '/api/flutterwave/callback',
    'client_ip' => orolado_request_ip(),
  ]);
  $ok = is_array($res) && strtolower((string) ($res['status'] ?? '')) === 'success';
  if (!$ok) {
    $why = is_array($res) ? (string) ($res['message'] ?? '') : '';
    error_log('OROLADO flutterwave momo refus : ' . $why . ' (http ' . (is_array($res) ? (int) ($res['_http'] ?? 0) : 0) . ')');
    return ['ok' => false, 'server' => true, 'reason' => 'Paiement Mobile Money refusé pour le moment. Réessayez ou choisissez un autre moyen.', 'code' => 'flw', 'detail' => substr($why, 0, 160)];
  }
  $auth = is_array($res['meta']['authorization'] ?? null) ? $res['meta']['authorization'] : [];
  $redirect = (string) ($auth['redirect_url'] ?? $auth['redirect'] ?? '');
  if ($redirect !== '' && !preg_match('#^https://#i', $redirect)) $redirect = '';
  return [
    'ok' => true,
    'server' => true,
    'ref' => $ref,
    'tx_ref' => $ref,
    'mode' => (string) ($auth['mode'] ?? ''),
    'redirect' => $redirect,
    'network' => $netKey,
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
  $gotRef = (string) ($data['tx_ref'] ?? '');
  // SÉCURITÉ : le paiement trouvé chez Flutterwave doit être CELUI de ce dépôt. Sinon on pouvait
  // faire créditer son dépôt avec le numéro de paiement (facile à deviner) d'un autre joueur.
  if ($txRef !== '' && ($gotRef === '' || strcasecmp($gotRef, $txRef) !== 0)) {
    error_log('OROLADO flutterwave verify: paiement ' . $transactionId . ' appartient à ' . $gotRef . ', pas à ' . $txRef);
    return ['ok' => true, 'paid' => false, 'status' => 'mismatch'];
  }
  if ($gotRef === '') $gotRef = $txRef;
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
  // Jamais plus que le montant demandé (le paiement carte est d'un montant fixe) : protège aussi
  // un paiement lancé à l'ancien taux et confirmé après un changement de taux.
  if ($pending > 0 && $usd > $pending) $usd = $pending;
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


/*
 * ============================================================================================
 * ORDRES RÉGLÉS HORS DE orolado.json (2026-10-20, tenue de charge)
 *
 * orolado.json est relu (et réécrit à chaque trade) en entier : il ne doit garder que les ordres
 * OUVERTS et ceux réglés depuis moins de OROLADO_ORDERS_HOT_SEC (10 s). Les ordres réglés plus
 * anciens partent, sous le verrou global, dans un rangement « ajout seulement » :
 *   data/orders/day/AAAA-MM-JJ.<real|demo|x>.jsonl  (jour UTC du règlement, une ligne JSON par ordre)
 *   data/orders/day/AAAA-MM-JJ.idx                  (résumé léger pour les statistiques de l'admin)
 *   data/orders/user/xx/<sha1 joueur>.<mode>.jsonl  (les mêmes lignes, par joueur : historique rapide)
 * puis, comme avant, dans data/archive/orders-AAAA-MM.jsonl quand ils ont plus de 2 jours.
 *
 * Pour le code du site RIEN ne change : orolado_orders_recent() rend exactement la liste que
 * $db['orders'] contenait avant (ordres du fichier + ordres rangés pas encore « archivés », c.-à-d.
 * réglés après $db['ordersArchCut'], l'heure de coupe du dernier archivage de 2 jours).
 * Un ordre rangé est toujours réglé : il ne peut plus être réglé ni payé une 2e fois, et
 * orolado_trade_find() le retrouve encore (règlement redemandé → même réponse qu'avant ;
 * même ordre renvoyé → « doublon », jamais un 2e ordre).
 * ============================================================================================
 */
// Délai avant rangement d'un ordre réglé, et fréquence des passages. Court exprès : avec 600 joueurs
// (≈ 30 trades/s), chaque seconde gardée pèse ≈ 20 Ko dans orolado.json, réécrit à CHAQUE trade
// (mesuré, 600 joueurs : 30 s / 10 s → p95 ≈ 5 s ; 10 s / 5 s → p95 ≈ 0,26 s).
// Aucun lecteur n'a besoin que l'ordre soit encore dans le fichier (tout passe par orolado_orders_recent).
if (!defined('OROLADO_ORDERS_HOT_SEC')) define('OROLADO_ORDERS_HOT_SEC', 10);
if (!defined('OROLADO_ORDERS_MOVE_EVERY')) define('OROLADO_ORDERS_MOVE_EVERY', 5);
// Travail borné par passage (premier passage sur un gros fichier : migration en plusieurs fois).
if (!defined('OROLADO_ORDERS_MOVE_MAX')) define('OROLADO_ORDERS_MOVE_MAX', 3000);
const OROLADO_ORDERS_DONE = ['won', 'lost', 'void', 'closed'];

function orolado_orders_dir(): string {
  return orolado_data_dir() . '/orders';
}

/** Heure de référence d'un ordre réglé (la même que l'archivage de 2 jours). */
function orolado_order_key($o): float {
  return is_array($o) ? (float) ($o['settledAt'] ?? $o['at'] ?? 0) : 0.0;
}

function orolado_order_owner(array $o): string {
  $u = $o['userId'] ?? $o['user_id'] ?? '';
  return is_scalar($u) ? (string) $u : '';
}

/** Rangement par compte : 'real', 'demo', ou 'x' (ancien ordre sans compte clair, lu avec les deux). */
function orolado_order_tag(array $o): string {
  $m = $o['mode'] ?? $o['accountType'] ?? '';
  return $m === 'real' ? 'real' : ($m === 'demo' ? 'demo' : 'x');
}

function orolado_orders_user_file(string $uid, string $tag): string {
  $h = sha1($uid);
  return orolado_orders_dir() . '/user/' . substr($h, 0, 2) . '/' . $h . '.' . $tag . '.jsonl';
}

function orolado_orders_day_file(string $day, string $tag): string {
  return orolado_orders_dir() . '/day/' . $day . '.' . $tag . '.jsonl';
}

/** Contenu brut d'un fichier rangé, mémorisé pendant la requête (relu seulement s'il a changé). */
function orolado_orders_raw(string $f): string {
  clearstatcache(true, $f);
  $st = @stat($f);
  if (!$st) {
    unset($GLOBALS['OROLADO_ORD_RAW'][$f]);
    return '';
  }
  $sig = $st['ino'] . ':' . $st['size'] . ':' . $st['mtime'];
  $c = $GLOBALS['OROLADO_ORD_RAW'][$f] ?? null;
  if (is_array($c) && $c['sig'] === $sig) return $c['raw'];
  $raw = (string) @file_get_contents($f);
  if (count($GLOBALS['OROLADO_ORD_RAW'] ?? []) >= 256) $GLOBALS['OROLADO_ORD_RAW'] = [];
  $GLOBALS['OROLADO_ORD_RAW'][$f] = ['sig' => $sig, 'raw' => $raw, 'rows' => null];
  return $raw;
}

/** Ordres d'un fichier rangé (lignes JSON ; une ligne abîmée est ignorée). */
function orolado_orders_rows(string $f): array {
  $raw = orolado_orders_raw($f);
  if ($raw === '') return [];
  if (is_array($GLOBALS['OROLADO_ORD_RAW'][$f]['rows'] ?? null)) return $GLOBALS['OROLADO_ORD_RAW'][$f]['rows'];
  $rows = [];
  foreach (explode("\n", $raw) as $line) {
    if ($line === '') continue;
    $o = json_decode($line, true);
    if (is_array($o)) $rows[] = $o;
  }
  $GLOBALS['OROLADO_ORD_RAW'][$f]['rows'] = $rows;
  return $rows;
}

/** Ajout en fin de fichier ; recommence toujours sur une nouvelle ligne (jamais collé à une ligne coupée). */
function orolado_orders_append(string $f, string $body): bool {
  if ($body === '') return true;
  $dir = dirname($f);
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $fh = @fopen($f, 'a+b');
  if (!$fh) return false;
  flock($fh, LOCK_EX);
  $size = (int) (fstat($fh)['size'] ?? 0);
  if ($size > 0) {
    fseek($fh, $size - 1);
    if (fread($fh, 1) !== "\n") $body = "\n" . $body;
  }
  $len = strlen($body);
  $done = 0;
  while ($done < $len) {
    $w = fwrite($fh, substr($body, $done));
    if ($w === false || $w === 0) break;
    $done += $w;
  }
  fflush($fh);
  flock($fh, LOCK_UN);
  fclose($fh);
  unset($GLOBALS['OROLADO_ORD_RAW'][$f]);
  return $done === $len;
}

/** Ajout dans le fichier d'un joueur ; au passage, retire ses lignes plus vieilles que $pruneBefore. */
function orolado_orders_user_append(string $f, string $body, float $pruneBefore): bool {
  if ($pruneBefore > 0 && is_file($f)) {
    $fh = @fopen($f, 'rb');
    $first = $fh ? fgets($fh) : false;
    if ($fh) fclose($fh);
    $j = is_string($first) ? json_decode($first, true) : null;
    if (is_array($j) && orolado_order_key($j) < $pruneBefore) {
      $keep = '';
      foreach (@file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $o = json_decode((string) $line, true);
        if (!is_array($o) || orolado_order_key($o) < $pruneBefore) continue;
        $keep .= $line . "\n";
      }
      unset($GLOBALS['OROLADO_ORD_RAW'][$f]);
      return orolado_store_write_file($f, $keep . $body);
    }
  }
  return orolado_orders_append($f, $body);
}

/** Le rangement a-t-il déjà servi ? */
function orolado_orders_store_used(): bool {
  return (bool) (glob(orolado_orders_dir() . '/day/*.jsonl') ?: []);
}

/**
 * LA liste des ordres telle que $db['orders'] la contenait avant le rangement : ordres du fichier
 * + ordres rangés pas encore archivés (réglés après $db['ordersArchCut']), sans doublon, dans
 * l'ordre des heures d'ouverture (celui du fichier).
 *   $uids  : seulement les ordres rangés de ces joueurs (rapide) ; null = tous (admin).
 *            Les ordres du fichier sont TOUS rendus : chaque appelant garde son propre filtre.
 *   $mode  : 'real' / 'demo' : seulement ce compte côté rangement (+ anciens ordres sans compte clair).
 *   $all   : true = aussi les ordres rangés déjà passés l'heure de coupe (lecteurs qui relisent
 *            l'archive et dédoublonnent eux-mêmes par identifiant : bonus).
 */
function orolado_orders_recent(array $db, ?array $uids = null, ?string $mode = null, bool $all = false): array {
  $main = $db['orders'] ?? [];
  if (!is_array($main)) return [];
  $main = array_values($main);
  $tags = $mode === null ? ['real', 'demo', 'x'] : [$mode === 'real' ? 'real' : 'demo', 'x'];
  $files = [];
  if ($uids !== null) {
    foreach (array_unique(array_map('strval', $uids)) as $u) {
      if ($u === '') continue;
      foreach ($tags as $t) $files[] = orolado_orders_user_file($u, $t);
    }
  } else {
    foreach ($tags as $t) foreach (glob(orolado_orders_dir() . '/day/*.' . $t . '.jsonl') ?: [] as $f) $files[] = $f;
  }
  if (!$files) return $main;
  $cut = $all ? null : (float) ($db['ordersArchCut'] ?? 0);
  $seen = [];
  foreach ($main as $o) {
    if (is_array($o) && isset($o['id'])) $seen[orolado_order_owner($o) . "\0" . (is_scalar($o['id']) ? (string) $o['id'] : '')] = 1;
  }
  $store = [];
  foreach ($files as $f) {
    foreach (orolado_orders_rows($f) as $o) {
      if ($cut !== null && orolado_order_key($o) < $cut) continue;
      $k = orolado_order_owner($o) . "\0" . (is_scalar($o['id'] ?? null) ? (string) $o['id'] : '');
      if (isset($seen[$k])) continue;
      $seen[$k] = 1;
      $store[] = $o;
    }
  }
  if (!$store) return $main;
  usort($store, static fn($a, $b) => ((float) ($a['at'] ?? 0)) <=> ((float) ($b['at'] ?? 0)));
  // Fusion par heure d'ouverture : les ordres du fichier gardent exactement leur ordre entre eux.
  $out = [];
  $i = 0;
  $j = 0;
  $ns = count($store);
  $nm = count($main);
  while ($i < $ns && $j < $nm) {
    $ma = is_array($main[$j]) ? (float) ($main[$j]['at'] ?? 0) : 0.0;
    if ((float) ($store[$i]['at'] ?? 0) < $ma) $out[] = $store[$i++];
    else $out[] = $main[$j++];
  }
  while ($i < $ns) $out[] = $store[$i++];
  while ($j < $nm) $out[] = $main[$j++];
  return $out;
}

/** Un ordre rangé de ce joueur (null si absent ou déjà archivé). Lecture sans décoder tout le fichier. */
function orolado_orders_store_find(array $db, string $uid, string $oid): ?array {
  if ($uid === '' || $oid === '') return null;
  $needle = '"id":' . json_encode($oid, JSON_UNESCAPED_UNICODE);
  $cut = (float) ($db['ordersArchCut'] ?? 0);
  foreach (['real', 'demo', 'x'] as $tag) {
    $raw = orolado_orders_raw(orolado_orders_user_file($uid, $tag));
    if ($raw === '') continue;
    $pos = 0;
    while (($p = strpos($raw, $needle, $pos)) !== false) {
      $pos = $p + 1;
      $ls = $p === 0 ? false : strrpos(substr($raw, 0, $p), "\n");
      $ls = $ls === false ? 0 : $ls + 1;
      $le = strpos($raw, "\n", $p);
      $o = json_decode(substr($raw, $ls, $le === false ? null : $le - $ls), true);
      if (!is_array($o) || (string) ($o['id'] ?? '') !== $oid || orolado_order_owner($o) !== $uid) continue;
      if (orolado_order_key($o) < $cut) continue;
      return $o;
    }
  }
  return null;
}

/** Ligne du résumé léger (statistiques de l'admin) : joueur, id, heure de coupe, actif, durée, compte. */
function orolado_orders_idx_line(array $o): string {
  return rawurlencode(orolado_order_owner($o)) . "\t" . rawurlencode(is_scalar($o['id'] ?? null) ? (string) $o['id'] : '') . "\t"
    . orolado_order_key($o) . "\t" . rawurlencode((string) ($o['assetId'] ?? $o['asset_id'] ?? 'v100')) . "\t"
    . (int) ($o['duration'] ?? 0) . "\t" . ((($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo');
}

/**
 * Statistiques « jeux » du tableau admin (par actif, par durée, par compte) sur la même liste
 * qu'avant (ordres du fichier + ordres rangés pas encore archivés). Même calcul, même résultat.
 */
function orolado_orders_game_stats(array $db): ?array {
  $orders = $db['orders'] ?? [];
  if (!is_array($orders)) $orders = [];
  $byAsset = [];
  $byDur = [];
  $byAssetMode = ['real' => [], 'demo' => []];
  $byDurMode = ['real' => [], 'demo' => []];
  $total = 0;
  $add = static function (string $aid, int $dur, string $mode) use (&$byAsset, &$byDur, &$byAssetMode, &$byDurMode): void {
    if (!isset($byAsset[$aid])) $byAsset[$aid] = 0;
    $byAsset[$aid]++;
    if (!isset($byDur[$dur])) $byDur[$dur] = 0;
    $byDur[$dur]++;
    if (!isset($byAssetMode[$mode][$aid])) $byAssetMode[$mode][$aid] = 0;
    $byAssetMode[$mode][$aid]++;
    if (!isset($byDurMode[$mode][$dur])) $byDurMode[$mode][$dur] = 0;
    $byDurMode[$mode][$dur]++;
  };
  $seen = [];
  foreach ($orders as $o) {
    $total++;
    if (!is_array($o)) continue;
    if (isset($o['id'])) $seen[orolado_order_owner($o) . "\0" . (is_scalar($o['id']) ? (string) $o['id'] : '')] = 1;
    $add((string) ($o['assetId'] ?? $o['asset_id'] ?? 'v100'), (int) ($o['duration'] ?? 0), (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo');
  }
  $cut = (float) ($db['ordersArchCut'] ?? 0);
  foreach (glob(orolado_orders_dir() . '/day/*.idx') ?: [] as $f) {
    $h = @fopen($f, 'rb');
    if (!$h) continue;
    while (($line = fgets($h)) !== false) {
      $c = explode("\t", rtrim($line, "\r\n"));
      if (count($c) < 6 || (float) $c[2] < $cut) continue;
      $k = rawurldecode($c[0]) . "\0" . rawurldecode($c[1]);
      if (isset($seen[$k])) continue;
      $seen[$k] = 1;
      $total++;
      $add(rawurldecode($c[3]), (int) $c[4], $c[5] === 'real' ? 'real' : 'demo');
    }
    fclose($h);
  }
  if ($total === 0) return null;
  return ['byAsset' => $byAsset, 'byDuration' => $byDur, 'byAssetMode' => $byAssetMode, 'byDurationMode' => $byDurMode, 'total' => $total];
}

/**
 * Rangement + archivage (appelé par « me », via orolado_archive_orders). Sous le verrou global :
 *  - toutes les OROLADO_ORDERS_MOVE_EVERY s : ordres réglés depuis plus de 10 s → data/orders ;
 *  - toutes les 10 min (comme avant) : ordres réglés depuis plus de 2 jours → data/archive, et
 *    nouvelle heure de coupe ($db['ordersArchCut']).
 * Les fichiers rangés sont écrits AVANT de retirer quoi que ce soit du fichier principal : en cas
 * d'échec, rien n'est retiré (au pire une ligne en double, ignorée à la lecture). Au premier
 * rangement, copie complète de orolado.json dans data/archive/. Rend le nombre d'ordres sortis.
 */
function orolado_orders_maintain(bool $force = false): int {
  $dataDir = orolado_data_dir();
  $archDir = $dataDir . '/archive';
  $ordDir = orolado_orders_dir();
  $archFlag = $archDir . '/.last';
  $moveFlag = $ordDir . '/.move';
  $now = time();
  $doArch = $force || !is_file($archFlag) || $now - (int) @filemtime($archFlag) >= 600;
  $doHot = $force || !is_file($moveFlag) || $now - (int) @filemtime($moveFlag) >= OROLADO_ORDERS_MOVE_EVERY;
  if (!$doArch && !$doHot) return 0;
  if (!is_dir($archDir)) @mkdir($archDir, 0755, true);
  if (!is_dir($ordDir)) @mkdir($ordDir, 0755, true);
  // Un seul passage à la fois (les autres requêtes ne l'attendent pas).
  $lk = @fopen($ordDir . '/.move.lock', 'c');
  if (!$lk) return 0;
  if (!flock($lk, LOCK_EX | LOCK_NB)) { fclose($lk); return 0; }
  if ($doArch) @touch($archFlag);
  if ($doHot) @touch($moveFlag);
  $nowF = microtime(true);
  $cutArch = $nowF - 2 * 86400;
  $cutHot = $nowF - OROLADO_ORDERS_HOT_SEC;
  $max = max(1, (int) OROLADO_ORDERS_MOVE_MAX);
  $res = with_db_lock(function ($box) use ($doArch, $doHot, $cutArch, $cutHot, $max, $archDir, $ordDir) {
    $orders = $box->db['orders'] ?? [];
    if (!is_array($orders)) return ['ok' => true, 'skip_write' => true, 'moved' => 0];
    $keep = [];
    $byMonth = [];
    $toStore = [];
    $n = 0;
    foreach ($orders as $o) {
      $done = is_array($o) && in_array((string) ($o['status'] ?? ''), OROLADO_ORDERS_DONE, true);
      $at = $done ? orolado_order_key($o) : 0.0;
      if ($done && $at > 0 && $at < $cutArch) {
        // Plus de 2 jours : archive mensuelle (comme avant), seulement au passage des 10 min.
        if ($doArch && $n < $max) {
          $byMonth[date('Y-m', (int) ($o['at'] ?? time()))][] = json_encode($o, JSON_UNESCAPED_UNICODE);
          $n++;
          continue;
        }
      } else if ($doHot && $done && $at > 0 && $at < $cutHot && $n < $max && is_scalar($o['id'] ?? null) && (string) $o['id'] !== '') {
        $line = json_encode($o, JSON_UNESCAPED_UNICODE);
        if (is_string($line) && $line !== '') {
          $toStore[] = [$o, $line];
          $n++;
          continue;
        }
      }
      $keep[] = $o;
    }
    $oldCut = (float) ($box->db['ordersArchCut'] ?? 0);
    $setCut = $doArch && $cutArch > $oldCut && ($toStore || isset($box->db['ordersArchCut']) || orolado_orders_store_used());
    if (!$byMonth && !$toStore && !$setCut) return ['ok' => true, 'skip_write' => true, 'moved' => 0];
    // Copie de sécurité complète avant le tout premier rangement.
    if ($toStore && !is_file($ordDir . '/.backup-done')) {
      $bak = $archDir . '/orolado-avant-ordres-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json';
      if (!@copy(orolado_data_file(), $bak) || (int) @filesize($bak) !== (int) @filesize(orolado_data_file())) {
        return ['ok' => false, 'skip_write' => true, 'moved' => 0];
      }
      @file_put_contents($ordDir . '/.backup-done', basename($bak) . "\n");
    }
    // L'archive est écrite AVANT de retirer quoi que ce soit : en cas d'échec, on ne touche à rien.
    foreach ($byMonth as $ym => $lines) {
      $ok = @file_put_contents($archDir . '/orders-' . $ym . '.jsonl', implode("\n", $lines) . "\n", FILE_APPEND | LOCK_EX);
      if ($ok === false) return ['ok' => false, 'skip_write' => true, 'moved' => 0];
    }
    if ($toStore) {
      $byDay = [];
      $idx = [];
      $byUser = [];
      foreach ($toStore as [$o, $line]) {
        $tag = orolado_order_tag($o);
        $day = gmdate('Y-m-d', (int) orolado_order_key($o));
        $byDay[$day][$tag] = ($byDay[$day][$tag] ?? '') . $line . "\n";
        $idx[$day] = ($idx[$day] ?? '') . orolado_orders_idx_line($o) . "\n";
        $u = orolado_order_owner($o);
        $byUser[$u][$tag] = ($byUser[$u][$tag] ?? '') . $line . "\n";
      }
      foreach ($byDay as $day => $parts) {
        foreach ($parts as $tag => $body) {
          if (!orolado_orders_append(orolado_orders_day_file((string) $day, (string) $tag), $body)) return ['ok' => false, 'skip_write' => true, 'moved' => 0];
        }
        if (!orolado_orders_append($ordDir . '/day/' . $day . '.idx', $idx[$day])) return ['ok' => false, 'skip_write' => true, 'moved' => 0];
      }
      $prune = max($oldCut, $doArch ? $cutArch : 0.0) - 86400;
      foreach ($byUser as $u => $parts) {
        foreach ($parts as $tag => $body) {
          if (!orolado_orders_user_append(orolado_orders_user_file((string) $u, (string) $tag), $body, $prune)) return ['ok' => false, 'skip_write' => true, 'moved' => 0];
        }
      }
    }
    $box->db['orders'] = $keep;
    if ($setCut) $box->db['ordersArchCut'] = $cutArch;
    return ['ok' => true, 'moved' => $n, 'full' => $n >= $max, 'cut' => $setCut ? $cutArch : $oldCut];
  });
  $moved = (int) ($res['moved'] ?? 0);
  // Encore du travail (migration d'un gros fichier) : le prochain passage peut venir tout de suite.
  if (!empty($res['full'])) @touch($moveFlag, $now - OROLADO_ORDERS_MOVE_EVERY - 1);
  flock($lk, LOCK_UN);
  fclose($lk);
  if ($doArch && !empty($res['ok']) && (float) ($res['cut'] ?? 0) > 0) {
    $cut = (float) $res['cut'];
    if (orolado_orders_transfer_due($cut)) {
      if (PHP_SAPI === 'cli') {
        orolado_orders_transfer_old($cut);
      } else {
        register_shutdown_function(static function () use ($cut) {
          if (function_exists('fastcgi_finish_request')) @fastcgi_finish_request();
          try { orolado_orders_transfer_old($cut); } catch (Throwable $e) { error_log('OROLADO orders transfer ' . $e->getMessage()); }
        });
      }
    }
  }
  return $moved;
}

/** Fin (UTC) du jour d'un fichier rangé « AAAA-MM-JJ.… ». */
function orolado_orders_file_day_end(string $f): int {
  $day = substr(basename($f), 0, 10);
  $t = strtotime($day . ' 00:00:00 UTC');
  return $t === false ? PHP_INT_MAX : $t + 86399;
}

function orolado_orders_transfer_due(float $cut): bool {
  $lim = $cut - 86400;
  $day = orolado_orders_dir() . '/day';
  if (glob($day . '/*.arch') ?: []) return true;
  foreach (glob($day . '/*.jsonl') ?: [] as $f) if (orolado_orders_file_day_end($f) < $lim) return true;
  return false;
}

/**
 * Jours rangés entièrement plus vieux que (coupe − 1 jour) → archive mensuelle (même format
 * qu'avant), une fois par jour environ, hors du verrou global. Ordre : renommage (.arch), ajout à
 * l'archive, effacement ; si le serveur s'arrête au milieu, le .arch est repris au passage suivant.
 */
function orolado_orders_transfer_old(float $cut): int {
  $ordDir = orolado_orders_dir();
  $dayDir = $ordDir . '/day';
  $archDir = orolado_data_dir() . '/archive';
  if (!is_dir($archDir)) @mkdir($archDir, 0755, true);
  $lk = @fopen($ordDir . '/.arch.lock', 'c');
  if (!$lk) return 0;
  if (!flock($lk, LOCK_EX | LOCK_NB)) { fclose($lk); return 0; }
  $lim = $cut - 86400;
  foreach (glob($dayDir . '/*.jsonl') ?: [] as $f) {
    if (orolado_orders_file_day_end($f) < $lim) @rename($f, $f . '.arch');
  }
  $n = 0;
  foreach (glob($dayDir . '/*.jsonl.arch') ?: [] as $f) {
    $h = @fopen($f, 'rb');
    if (!$h) continue;
    $buf = [];
    $ok = true;
    $flush = static function () use (&$buf, &$ok, $archDir): void {
      foreach ($buf as $ym => $body) {
        if (@file_put_contents($archDir . '/orders-' . $ym . '.jsonl', $body, FILE_APPEND | LOCK_EX) === false) $ok = false;
      }
      $buf = [];
    };
    $i = 0;
    while (($line = fgets($h)) !== false) {
      $line = rtrim($line, "\r\n");
      if ($line === '') continue;
      $o = json_decode($line, true);
      if (!is_array($o)) continue;
      $ym = date('Y-m', (int) ($o['at'] ?? time()));
      $buf[$ym] = ($buf[$ym] ?? '') . $line . "\n";
      $n++;
      if (++$i % 2000 === 0) $flush();
    }
    $flush();
    fclose($h);
    if ($ok) @unlink($f);
  }
  foreach (glob($dayDir . '/*.idx') ?: [] as $f) {
    if (orolado_orders_file_day_end($f) < $lim) @unlink($f);
  }
  // Fichiers de joueurs dont toutes les lignes sont plus vieilles que la limite (dernier ajout avant elle).
  foreach (glob($ordDir . '/user/*/*.jsonl') ?: [] as $f) {
    if ((int) @filemtime($f) < $lim) @unlink($f);
  }
  flock($lk, LOCK_UN);
  fclose($lk);
  $GLOBALS['OROLADO_ORD_RAW'] = [];
  return $n;
}

/**
 * Nettoyage des comptes (effacement admin) : garde seulement les ordres rangés des joueurs que
 * $keepUid accepte. À appeler sous le verrou global (comme le reste du nettoyage du fichier).
 */
function orolado_orders_store_filter(callable $keepUid): int {
  $ordDir = orolado_orders_dir();
  if (!is_dir($ordDir)) return 0;
  $lk = @fopen($ordDir . '/.arch.lock', 'c');
  if ($lk) flock($lk, LOCK_EX);
  $n = 0;
  foreach (array_merge(glob($ordDir . '/day/*.jsonl') ?: [], glob($ordDir . '/day/*.jsonl.arch') ?: []) as $f) {
    $keep = '';
    $drop = 0;
    foreach (@file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
      $o = json_decode((string) $line, true);
      if (is_array($o) && $keepUid(orolado_order_owner($o))) $keep .= $line . "\n";
      else $drop++;
    }
    if ($drop === 0) continue;
    $n += $drop;
    if ($keep === '') @unlink($f);
    else orolado_store_write_file($f, $keep);
  }
  foreach (glob($ordDir . '/day/*.idx') ?: [] as $f) {
    $keep = '';
    $drop = 0;
    foreach (@file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
      $c = explode("\t", (string) $line);
      if ($keepUid(rawurldecode($c[0]))) $keep .= $line . "\n";
      else $drop++;
    }
    if ($drop === 0) continue;
    if ($keep === '') @unlink($f);
    else orolado_store_write_file($f, $keep);
  }
  foreach (glob($ordDir . '/user/*/*.jsonl') ?: [] as $f) {
    $fh = @fopen($f, 'rb');
    $owner = null;
    while ($fh && ($line = fgets($fh)) !== false) {
      $o = json_decode($line, true);
      if (is_array($o)) { $owner = orolado_order_owner($o); break; }
    }
    if ($fh) fclose($fh);
    if ($owner === null || !$keepUid($owner)) @unlink($f);
  }
  if ($lk) { flock($lk, LOCK_UN); fclose($lk); }
  $GLOBALS['OROLADO_ORD_RAW'] = [];
  return $n;
}

/**
 * Lit, depuis le dernier passage, les nouvelles lignes des jours rangés (fichiers « ajout
 * seulement ») : $offs garde la position atteinte dans chaque fichier. Pour les compteurs qui
 * dédoublonnent eux-mêmes par identifiant (classement de la semaine).
 */
function orolado_orders_tail(array &$offs, array $tags, string $needle, callable $fn): void {
  $files = [];
  foreach ($tags as $t) foreach (glob(orolado_orders_dir() . '/day/*.' . $t . '.jsonl') ?: [] as $f) $files[basename($f)] = $f;
  foreach (array_keys($offs) as $k) if (!isset($files[$k])) unset($offs[$k]);
  foreach ($files as $b => $f) {
    clearstatcache(true, $f);
    $st = @stat($f);
    if (!$st) continue;
    $ino = (int) $st['ino'];
    $off = (isset($offs[$b][0], $offs[$b][1]) && (int) $offs[$b][0] === $ino && (int) $offs[$b][1] <= (int) $st['size']) ? (int) $offs[$b][1] : 0;
    if ($off >= (int) $st['size']) { $offs[$b] = [$ino, $off]; continue; }
    $h = @fopen($f, 'rb');
    if (!$h) continue;
    fseek($h, $off);
    while (($line = fgets($h)) !== false) {
      if (substr($line, -1) !== "\n") break; // ligne en cours d'écriture : reprise au prochain passage
      $off += strlen($line);
      if ($needle !== '' && strpos($line, $needle) === false) continue;
      $o = json_decode($line, true);
      if (is_array($o)) $fn($o);
    }
    fclose($h);
    $offs[$b] = [$ino, $off];
  }
}
