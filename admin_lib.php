<?php
declare(strict_types=1);

/**
 * Couche données du dashboard admin.php — lecture Supabase (service_role)
 * + fusion du JSON local. Aucun DROP / TRUNCATE.
 */

function admin_tz(): DateTimeZone {
  return new DateTimeZone('Africa/Abidjan');
}

function admin_now(): DateTimeImmutable {
  return new DateTimeImmutable('now', admin_tz());
}

function admin_day_bounds(string $which, string $from = '', string $to = ''): array {
  $tz = admin_tz();
  $today = admin_now()->setTime(0, 0, 0);
  if ($which === 'today') {
    return [$today->format('c'), $today->modify('+1 day')->format('c')];
  }
  if ($which === 'yesterday') {
    $y = $today->modify('-1 day');
    return [$y->format('c'), $today->format('c')];
  }
  if ($which === 'range' || $which === 'date') {
    $a = $from !== '' ? new DateTimeImmutable($from, $tz) : $today;
    $b = $to !== '' ? new DateTimeImmutable($to, $tz) : $a;
    $a = $a->setTime(0, 0, 0);
    $b = $b->setTime(0, 0, 0)->modify('+1 day');
    if ($b <= $a) $b = $a->modify('+1 day');
    return [$a->format('c'), $b->format('c')];
  }
  return ['', ''];
}

function admin_in_range(?string $iso, string $from, string $to): bool {
  if ($from === '' && $to === '') return true;
  if (!$iso) return false;
  $t = strtotime($iso);
  if (!$t) return false;
  if ($from !== '' && $t < strtotime($from)) return false;
  if ($to !== '' && $t >= strtotime($to)) return false;
  return true;
}

function admin_money($n): string {
  return number_format((float) $n, 2, '.', ' ') . ' $';
}

function admin_esc(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function admin_dial_map(): array {
  return [
    '+225' => 'CI', '+221' => 'SN', '+223' => 'ML', '+226' => 'BF', '+227' => 'NE',
    '+228' => 'TG', '+229' => 'BJ', '+237' => 'CM', '+241' => 'GA', '+242' => 'CG',
    '+243' => 'CD', '+234' => 'NG', '+233' => 'GH', '+254' => 'KE', '+256' => 'UG',
    '+250' => 'RW', '+255' => 'TZ', '+260' => 'ZM', '+263' => 'ZW', '+27' => 'ZA',
    '+212' => 'MA', '+213' => 'DZ', '+216' => 'TN', '+218' => 'LY', '+20' => 'EG',
    '+33' => 'FR', '+32' => 'BE', '+41' => 'CH', '+49' => 'DE', '+39' => 'IT',
    '+34' => 'ES', '+351' => 'PT', '+44' => 'GB', '+1' => 'US', '+55' => 'BR',
    '+91' => 'IN', '+86' => 'CN', '+81' => 'JP', '+82' => 'KR', '+90' => 'TR',
    '+971' => 'AE', '+966' => 'SA', '+7' => 'RU', '+48' => 'PL', '+31' => 'NL',
    '+224' => 'GN', '+238' => 'CV', '+239' => 'ST',
    '+240' => 'GQ', '+244' => 'AO', '+245' => 'GW', '+248' => 'SC', '+249' => 'SD',
    '+251' => 'ET', '+252' => 'SO', '+253' => 'DJ', '+257' => 'BI', '+258' => 'MZ',
    '+261' => 'MG', '+262' => 'RE', '+264' => 'NA', '+265' => 'MW', '+266' => 'LS',
    '+267' => 'BW', '+268' => 'SZ', '+269' => 'KM', '+290' => 'SH', '+291' => 'ER',
    '+297' => 'AW', '+298' => 'FO', '+299' => 'GL',
  ];
}

function admin_match_dial(string $raw): array {
  $s = strtoupper(trim($raw));
  if (preg_match('/^[A-Z]{2}$/', $s)) return [$s, ''];
  $s = preg_replace('/[^\d+]/', '', $raw) ?? '';
  $map = admin_dial_map();
  uksort($map, static fn($a, $b) => strlen($b) <=> strlen($a));
  if (isset($map[$s])) return [$map[$s], $s];
  foreach ($map as $dial => $iso) {
    if ($s === '') continue;
    if (str_starts_with($s, $dial) || str_starts_with($s, ltrim($dial, '+'))) return [$iso, $dial];
  }
  return ['', ''];
}

function admin_dial_iso(string $raw): string {
  return admin_match_dial($raw)[0];
}

function admin_flag_emoji(string $iso2): string {
  $iso2 = strtoupper($iso2);
  if (!preg_match('/^[A-Z]{2}$/', $iso2)) return '';
  $a = 0x1F1E6 + (ord($iso2[0]) - 65);
  $b = 0x1F1E6 + (ord($iso2[1]) - 65);
  return (function_exists('mb_chr') ? mb_chr($a, 'UTF-8') : html_entity_decode('&#' . $a . ';', ENT_NOQUOTES, 'UTF-8'))
    . (function_exists('mb_chr') ? mb_chr($b, 'UTF-8') : html_entity_decode('&#' . $b . ';', ENT_NOQUOTES, 'UTF-8'));
}

function admin_country_name(string $iso2): string {
  $names = [
    'CI' => 'Côte d’Ivoire', 'SN' => 'Sénégal', 'ML' => 'Mali', 'BF' => 'Burkina Faso',
    'NE' => 'Niger', 'TG' => 'Togo', 'BJ' => 'Bénin', 'CM' => 'Cameroun', 'GA' => 'Gabon',
    'CG' => 'Congo', 'CD' => 'RDC', 'NG' => 'Nigeria', 'GH' => 'Ghana', 'KE' => 'Kenya',
    'UG' => 'Ouganda', 'RW' => 'Rwanda', 'TZ' => 'Tanzanie', 'ZA' => 'Afrique du Sud',
    'MA' => 'Maroc', 'DZ' => 'Algérie', 'TN' => 'Tunisie', 'EG' => 'Égypte',
    'FR' => 'France', 'BE' => 'Belgique', 'CH' => 'Suisse', 'DE' => 'Allemagne',
    'IT' => 'Italie', 'ES' => 'Espagne', 'PT' => 'Portugal', 'GB' => 'Royaume-Uni',
    'US' => 'États-Unis', 'BR' => 'Brésil', 'IN' => 'Inde', 'CN' => 'Chine',
    'AE' => 'Émirats', 'SA' => 'Arabie saoudite', 'GN' => 'Guinée',
    'CO' => 'Colombie', 'VE' => 'Venezuela', 'MX' => 'Mexique', 'AR' => 'Argentine', 'PE' => 'Pérou',
    'CL' => 'Chili', 'EC' => 'Équateur', 'BO' => 'Bolivie', 'PY' => 'Paraguay', 'UY' => 'Uruguay',
    'PA' => 'Panama', 'CR' => 'Costa Rica', 'DO' => 'Rép. dominicaine', 'GT' => 'Guatemala', 'HN' => 'Honduras',
    'SV' => 'Salvador', 'NI' => 'Nicaragua', 'CU' => 'Cuba', 'PR' => 'Porto Rico', 'CA' => 'Canada',
    'QA' => 'Qatar', 'KW' => 'Koweït', 'BH' => 'Bahreïn', 'OM' => 'Oman', 'JO' => 'Jordanie', 'LB' => 'Liban',
    'IQ' => 'Irak', 'LY' => 'Libye', 'SD' => 'Soudan', 'MR' => 'Mauritanie', 'TR' => 'Turquie', 'RU' => 'Russie',
    'ID' => 'Indonésie', 'VN' => 'Viêt Nam', 'PH' => 'Philippines', 'PK' => 'Pakistan', 'BD' => 'Bangladesh',
    'MY' => 'Malaisie', 'TH' => 'Thaïlande', 'SG' => 'Singapour', 'JP' => 'Japon', 'KR' => 'Corée du Sud', 'AU' => 'Australie',
    'NL' => 'Pays-Bas', 'LU' => 'Luxembourg', 'AO' => 'Angola', 'MZ' => 'Mozambique', 'ET' => 'Éthiopie', 'ZM' => 'Zambie',
    'ZW' => 'Zimbabwe', 'MG' => 'Madagascar', 'HT' => 'Haïti', 'TD' => 'Tchad', 'CF' => 'Centrafrique', 'BI' => 'Burundi', 'DJ' => 'Djibouti',
  ];
  if (isset($names[$iso2])) return $names[$iso2];
  // Tous les autres pays : nom français fourni par PHP (extension intl) si elle est installée.
  if (class_exists('Locale')) {
    $n = Locale::getDisplayRegion('-' . $iso2, 'fr');
    if (is_string($n) && $n !== '' && strtoupper($n) !== $iso2) return $n;
  }
  return $iso2;
}

function admin_country_cell(array $p): string {
  $raw = trim((string) ($p['country'] ?? $p['countryCode'] ?? $p['country_code'] ?? ''));
  if (preg_match('/^[A-Za-z]{2}$/', $raw)) {
    $iso2 = strtoupper($raw);
    return trim(admin_flag_emoji($iso2) . ' ' . admin_country_name($iso2));
  }
  $iso = admin_dial_iso($raw);
  if ($iso === '') $iso = admin_dial_iso((string) ($p['phone'] ?? $p['whatsapp'] ?? $p['mobile'] ?? ''));
  if ($iso === '') {
    $lang = strtolower((string) ($p['lang'] ?? $p['locale'] ?? ''));
    $langMap = [
      'fr-ci' => 'CI', 'fr-sn' => 'SN', 'fr-ml' => 'ML', 'fr-bf' => 'BF',
      'fr-tg' => 'TG', 'fr-bj' => 'BJ', 'fr-cm' => 'CM', 'fr-ga' => 'GA',
      'fr-cd' => 'CD', 'fr-gn' => 'GN', 'en-ng' => 'NG', 'en-gh' => 'GH',
      'en-ke' => 'KE', 'pt-ao' => 'AO', 'ar-ma' => 'MA', 'ar-dz' => 'DZ',
    ];
    if (isset($langMap[$lang])) $iso = $langMap[$lang];
    else if (preg_match('/^[a-z]{2}-([a-z]{2})$/', $lang, $m)) $iso = strtoupper($m[1]);
  }
  if ($iso === '') return $raw !== '' && !preg_match('/^\+\d+$/', $raw) ? $raw : '—';
  $flag = admin_flag_emoji($iso);
  return trim($flag . ' ' . admin_country_name($iso));
}

function admin_phone_cell(array $p): string {
  $phone = trim((string) ($p['phone'] ?? ''));
  if ($phone === '') return '—';
  [$iso, $dial] = admin_match_dial($phone);
  if ($iso === '') [$iso, $dial] = admin_match_dial((string) ($p['country'] ?? $p['countryCode'] ?? ''));
  $flag = $iso !== '' ? admin_flag_emoji($iso) : '';
  $shown = $phone;
  if ($dial !== '') {
    $compact = preg_replace('/[^\d+]/', '', $phone) ?? $phone;
    if (str_starts_with($compact, $dial)) $shown = ltrim(substr($compact, strlen($dial)));
    else if (str_starts_with($compact, ltrim($dial, '+'))) $shown = ltrim(substr($compact, strlen(ltrim($dial, '+'))));
    if ($shown === '') $shown = $phone;
  }
  return trim($flag . ' ' . $shown);
}

function admin_traffic_network(string $raw): array {
  $s = strtolower(trim($raw));
  $map = [
    'facebook' => ['Facebook', 'Social'], 'fb' => ['Facebook', 'Social'],
    'instagram' => ['Instagram', 'Social'], 'ig' => ['Instagram', 'Social'],
    'tiktok' => ['TikTok', 'Social'], 'whatsapp' => ['WhatsApp', 'Social'],
    'telegram' => ['Telegram', 'Social'], 'youtube' => ['YouTube', 'Social'],
    'twitter' => ['X / Twitter', 'Social'], 'x' => ['X / Twitter', 'Social'],
    'snapchat' => ['Snapchat', 'Social'], 'linkedin' => ['LinkedIn', 'Social'],
    'google' => ['Google', 'Search / Ads'], 'googleads' => ['Google Ads', 'Ads'],
    'bing' => ['Bing', 'Search'], 'direct' => ['Direct', 'Aucun'],
  ];
  if (isset($map[$s])) return $map[$s];
  if ($s === '' || $s === 'none') return ['Direct', 'Aucun'];
  return [ucfirst($s), 'Autre'];
}

function admin_pct(int $part, int $total): string {
  if ($total <= 0) return '0 %';
  return number_format(($part * 100) / $total, 1, ',', ' ') . ' %';
}

function admin_cache_file(string $name): string {
  return rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . $name;
}

function admin_cache_get(string $key, int $ttl): ?array {
  $f = admin_cache_file('admin_cache_' . preg_replace('/[^a-z0-9_]+/i', '', $key) . '.json');
  if (!is_file($f)) return null;
  if (filemtime($f) + $ttl < time()) return null;
  $j = json_decode((string) file_get_contents($f), true);
  return is_array($j) ? $j : null;
}

function admin_cache_set(string $key, array $data): void {
  $f = admin_cache_file('admin_cache_' . preg_replace('/[^a-z0-9_]+/i', '', $key) . '.json');
  @file_put_contents($f, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function admin_alerts_file(): string {
  return admin_cache_file('admin_alerts.json');
}

function admin_alert_push(string $service, string $message, string $level = 'error'): void {
  $file = admin_alerts_file();
  $rows = [];
  if (is_file($file)) {
    $j = json_decode((string) file_get_contents($file), true);
    if (is_array($j)) $rows = $j;
  }
  $sig = md5($service . '|' . $message . '|' . date('Y-m-d-H'));
  foreach ($rows as $r) {
    if (($r['sig'] ?? '') === $sig) return;
  }
  array_unshift($rows, [
    'sig' => $sig,
    'at' => date('c'),
    'service' => $service,
    'message' => $message,
    'level' => $level,
  ]);
  $rows = array_slice($rows, 0, 400);
  @file_put_contents($file, json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

/** Requête PostgREST avec Content-Range (comptage exact, pagination). */
function admin_sb_req(string $path, array $extraHdr = [], string $method = 'GET', ?string $body = null): array {
  // Tests locaux uniquement (scripts/test-admin.php) : fausse base, jamais en ligne.
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_SB']) && is_callable($GLOBALS['OROLADO_FAKE_SB'])) {
    return ($GLOBALS['OROLADO_FAKE_SB'])($path, strtoupper($method), $body, $extraHdr);
  }
  $base = supabase_project_url();
  $hdrs = supabase_admin_headers();
  if ($base === '' || !$hdrs) {
    return ['ok' => false, 'code' => 0, 'rows' => [], 'count' => 0, 'raw' => ''];
  }
  $prefer = [];
  $headers = [];
  foreach (array_merge($hdrs, $extraHdr) as $h) {
    $h = (string) $h;
    if (stripos($h, 'Prefer:') === 0) {
      $prefer[] = trim(substr($h, 7));
      continue;
    }
    $headers[] = $h;
  }
  if ($prefer) $headers[] = 'Prefer: ' . implode(', ', array_unique($prefer));
  $url = $base . $path;
  if (!function_exists('curl_init')) {
    return ['ok' => false, 'code' => 0, 'rows' => [], 'count' => 0, 'raw' => ''];
  }
  $ch = curl_init($url);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_HTTPHEADER => $headers,
  ];
  $method = strtoupper($method);
  if ($method === 'POST') {
    $opts[CURLOPT_POST] = true;
    $opts[CURLOPT_POSTFIELDS] = $body ?? '{}';
  } else if ($method === 'HEAD') {
    $opts[CURLOPT_NOBODY] = true;
    $opts[CURLOPT_CUSTOMREQUEST] = 'HEAD';
  } else if ($method !== 'GET') {
    $opts[CURLOPT_CUSTOMREQUEST] = $method;
    if ($body !== null) $opts[CURLOPT_POSTFIELDS] = $body;
  }
  curl_setopt_array($ch, $opts);
  $resp = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $hsize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  curl_close($ch);
  if (!is_string($resp)) {
    return ['ok' => false, 'code' => $code, 'rows' => [], 'count' => 0, 'raw' => ''];
  }
  $rawH = substr($resp, 0, $hsize);
  $rawB = substr($resp, $hsize);
  $count = 0;
  if (preg_match('/content-range:\s*\S+\s+(\d+)-(\d+)\/(\d+|\*)/i', $rawH, $m)) {
    $count = $m[3] === '*' ? (int) $m[2] + 1 : (int) $m[3];
  } else if (preg_match('/content-range:\s*\*\/(\d+)/i', $rawH, $m)) {
    $count = (int) $m[1];
  }
  $json = json_decode($rawB, true);
  $rows = [];
  if (is_array($json)) {
    $rows = (isset($json[0]) || $json === []) ? $json : [$json];
  }
  $ok = $code >= 200 && $code < 300;
  return ['ok' => $ok, 'code' => $code, 'rows' => is_array($rows) ? $rows : [], 'count' => $count, 'raw' => $rawB];
}

function admin_sb_count(string $table, string $query = ''): int {
  $q = $query !== '' ? $query : 'select=id';
  $res = admin_sb_req(
    '/rest/v1/' . rawurlencode($table) . '?' . $q,
    ['Prefer: count=exact', 'Range: 0-0'],
    'GET'
  );
  if (!empty($res['count'])) return (int) $res['count'];
  if (!empty($res['ok'])) return count($res['rows']);
  return 0;
}

/** Nombre réel d’inscrits : COUNT profiles + COUNT auth.users (sans LIMIT). */
function admin_auth_users_count(): int {
  $cached = admin_cache_get('auth_n', 60);
  if (is_array($cached) && isset($cached['n'])) return (int) $cached['n'];
  $n = 0;
  for ($page = 1; $page <= 50; $page++) {
    $res = admin_sb_req('/auth/v1/admin/users?page=' . $page . '&per_page=200', []);
    $body = json_decode((string) ($res['raw'] ?? ''), true);
    $users = [];
    if (is_array($body)) {
      if (isset($body['users']) && is_array($body['users'])) $users = $body['users'];
      else if (isset($body[0])) $users = $body;
    }
    $n += count($users);
    if (count($users) < 200) break;
  }
  admin_cache_set('auth_n', ['n' => $n]);
  return $n;
}

function admin_inscrits_count(): int {
  $cached = admin_cache_get('inscrits_n_epoch2', 20);
  if (is_array($cached) && isset($cached['n']) && (int) $cached['n'] > 0) return (int) $cached['n'];
  $n = count(admin_profiles());
  admin_cache_set('inscrits_n_epoch2', ['n' => $n]);
  return $n;
}

function admin_sb_all(string $table, string $select, string $order, int $pageSize = 1000, string $filter = ''): array {
  $out = [];
  $from = 0;
  $sel = $select;
  for ($i = 0; $i < 20; $i++) {
    $to = $from + $pageSize - 1;
    $qs = 'select=' . rawurlencode($sel) . '&order=' . rawurlencode($order);
    if ($filter !== '') $qs .= '&' . $filter;
    // Pas de « count=exact » : le comptage complet ralentit fortement les grosses tables.
    $res = admin_sb_req('/rest/v1/' . $table . '?' . $qs, ['Range: ' . $from . '-' . $to]);
    if (empty($res['ok']) && $sel !== '*') {
      $sel = '*';
      $i--;
      continue;
    }
    $chunk = is_array($res['rows']) ? $res['rows'] : [];
    foreach ($chunk as $row) {
      if (is_array($row)) $out[] = $row;
    }
    $n = count($chunk);
    if ($n < $pageSize) break;
    $from += $pageSize;
  }
  return $out;
}

function admin_log(array &$db, string $adminEmail, string $targetPublicId, string $type, $amount, string $motif): void {
  if (!isset($db['admin_logs']) || !is_array($db['admin_logs'])) $db['admin_logs'] = [];
  array_unshift($db['admin_logs'], [
    'adminEmail' => $adminEmail,
    'targetPublicId' => $targetPublicId,
    'type' => $type,
    'amount' => $amount,
    'motif' => $motif,
    'at' => date('c'),
  ]);
  $db['admin_logs'] = array_slice($db['admin_logs'], 0, 500);
}

function admin_data_candidate_files(): array {
  $out = [];
  $add = static function (string $p) use (&$out): void {
    $p = str_replace('\\', '/', $p);
    if ($p === '' || in_array($p, $out, true)) return;
    $base = basename($p);
    if ($base === '.env' || str_starts_with($base, 'admin_cache_')) return;
    $out[] = $p;
  };
  $add(orolado_data_file());
  $add(__DIR__ . '/data/orolado.json');
  $dir = rtrim(str_replace('\\', '/', orolado_data_dir()), '/');
  $env = getenv('OROLADO_DATA_FILE');
  if (is_string($env) && $env !== '') $add($env);
  $add($dir . '/orolado.json.bak');
  $add($dir . '/orolado.json.save');
  $add(dirname($dir) . '/orolado.json');
  $parent = dirname(__DIR__);
  $add($parent . '/orolado.json');
  $add($parent . '/private/orolado.json');
  if (is_dir($dir)) {
    foreach (glob($dir . '/*orolado*.json*') ?: [] as $g) {
      $add((string) $g);
    }
  }
  return $out;
}

function admin_ensure_php_readable(string $file): bool {
  $dir = dirname($file);
  if (is_dir($dir)) @chmod($dir, 0755);
  if (!is_file($file)) return false;
  if (is_readable($file)) return true;
  @chmod($file, 0644);
  clearstatcache(true, $file);
  return is_readable($file);
}

function admin_decode_db_file(string $file): ?array {
  if (!admin_ensure_php_readable($file)) return null;
  // Fichier principal : lecture normale (joueurs, soldes et connexions sont dans les fiches).
  // Sinon l'admin verrait une liste de joueurs vide… et l'écrirait par-dessus les vraies fiches.
  if (realpath($file) !== false && realpath($file) === realpath(orolado_data_file())) return load_db($file);
  $raw = @file_get_contents($file);
  if (!is_string($raw) || trim($raw) === '') {
    $fp = @fopen($file, 'r');
    if (!$fp) return null;
    @flock($fp, LOCK_SH);
    $raw = stream_get_contents($fp);
    @flock($fp, LOCK_UN);
    fclose($fp);
  }
  if (!is_string($raw) || trim($raw) === '') return null;
  $data = json_decode($raw, true);
  return is_array($data) ? array_merge(blank_db(), $data) : null;
}

/** Diagnostic lecture JSON Hostinger (aucun écriture de lignes, chmod 0644 seulement si illisible). */
function admin_json_state(): array {
  static $state = null;
  if (is_array($state)) return $state;

  $primary = str_replace('\\', '/', orolado_data_file());
  $dir = dirname($primary);
  if (is_dir($dir)) @chmod($dir, 0755);

  $picked = '';
  $db = null;
  $chmodTried = false;
  $chmodOk = false;
  foreach (admin_data_candidate_files() as $f) {
    if (!is_file($f)) continue;
    $wasReadable = is_readable($f);
    if (!$wasReadable) {
      $chmodTried = true;
      $chmodOk = admin_ensure_php_readable($f);
    } else {
      admin_ensure_php_readable($f);
    }
    $decoded = admin_decode_db_file($f);
    if (!is_array($decoded)) continue;
    $picked = $f;
    $db = $decoded;
    if ($f === $primary || basename($f) === 'orolado.json') break;
  }

  $exists = is_file($primary);
  $readable = $exists && is_readable($primary);
  $size = $exists ? (int) @filesize($primary) : 0;
  $perms = $exists ? substr(sprintf('%o', (int) @fileperms($primary)), -4) : '';
  $jsonOk = is_array($db);
  $wdList = [];
  $byStatus = [];
  if (is_array($db)) {
    $wdList = admin_collect_local_wds($db);
    foreach ($wdList as $w) {
      $st = (string) ($w['status'] ?? 'pending');
      if ($st === '') $st = 'pending';
      if (!isset($byStatus[$st])) $byStatus[$st] = 0;
      $byStatus[$st]++;
    }
  }
  $wdOpen = 0;
  foreach ($wdList as $w) {
    if (admin_wd_is_open($w)) $wdOpen++;
  }

  $line = 'JSON ' . basename($primary) . ' : ';
  if (!$exists) {
    $line .= 'INTROUVABLE sur le serveur (fichier gitignoré — vérifiez le gestionnaire de fichiers Hostinger).';
    if ($picked !== '' && $picked !== $primary) {
      $line .= ' Copie lue : ' . basename($picked) . ' (' . count($wdList) . ' retraits).';
    }
  } else if (!$readable) {
    $line .= 'présent mais ILLISIBLE par PHP (droits ' . ($perms !== '' ? $perms : '?') . ')';
    $line .= $chmodTried ? ($chmodOk ? ' — chmod 0644 OK.' : ' — chmod 0644 refusé.') : '.';
  } else if (!$jsonOk) {
    $line .= 'lisible (' . $perms . ', ' . $size . ' o) mais JSON invalide.';
  } else {
    $stBits = [];
    foreach ($byStatus as $k => $n) $stBits[] = $k . ':' . $n;
    $line .= 'lecture PHP OK (' . $perms . ', ' . $size . ' o) · ' . count($wdList) . ' retraits dont ' . $wdOpen . ' en attente';
    if ($stBits) $line .= ' (' . implode(', ', $stBits) . ')';
    $line .= '.';
  }
  $ob = trim((string) ini_get('open_basedir'));
  if ($ob !== '' && $exists && !$readable) {
    $line .= ' open_basedir=' . $ob;
  }

  $state = [
    'file' => basename($primary),
    'path' => $primary,
    'picked' => $picked !== '' ? basename($picked) : '',
    'exists' => $exists,
    'readable' => $readable,
    'chmodTried' => $chmodTried,
    'chmodOk' => $chmodOk,
    'size' => $size,
    'perms' => $perms,
    'jsonOk' => $jsonOk,
    'wd' => count($wdList),
    'wdOpen' => $wdOpen,
    'byStatus' => $byStatus,
    'line' => $line,
    // Jamais un $db vide « ordinaire » : écrit, il remplacerait toutes les fiches des joueurs.
    'db' => is_array($db) ? $db : orolado_store_attach(blank_db(), orolado_data_file()),
  ];
  return $state;
}

function admin_json_probe_public(): array {
  $p = admin_json_state();
  unset($p['db'], $p['path']);
  return $p;
}

function admin_local_db(): array {
  $p = admin_json_state();
  return is_array($p['db'] ?? null) ? $p['db'] : orolado_store_attach(blank_db(), orolado_data_file());
}

function admin_fill(string ...$vals): string {
  foreach ($vals as $v) {
    $v = trim($v);
    if ($v === '' || $v === '—' || strcasecmp($v, 'null') === 0 || strcasecmp($v, 'undefined') === 0) continue;
    return $v;
  }
  return '';
}

function admin_method_label(string $op): string {
  $k = strtolower(trim($op));
  if ($k === '') return '';
  $map = [
    'wave' => 'Wave', 'orange' => 'Orange', 'mtn' => 'MTN', 'moov' => 'Moov',
    'mpesa' => 'M-Pesa', 'airtel' => 'Airtel', 'opay' => 'OPay', 'palmpay' => 'PalmPay',
    'paypal' => 'PayPal', 'bank' => 'Banque', 'card' => 'Carte',
    'usdt' => 'USDT', 'btc' => 'BTC', 'eth' => 'ETH', 'trx' => 'TRX',
    'sol' => 'SOL', 'bnb' => 'BNB', 'ltc' => 'LTC', 'doge' => 'DOGE',
    'pix' => 'PIX', 'gcash' => 'GCash', 'upi' => 'UPI', 'stcpay' => 'STCpay',
  ];
  return $map[$k] ?? $op;
}

function admin_tx_is_withdraw(array $tx): bool {
  $typ = strtolower(trim((string) ($tx['type'] ?? '')));
  if (in_array($typ, ['deposit', 'stake', 'win', 'void', 'lost', 'loss', 'trade', 'bet', 'order', 'bonus', 'credit'], true)) {
    return false;
  }
  if (in_array($typ, ['withdraw', 'withdrawal', 'payout', 'retrait', 'wd', 'cashout', 'cash_out'], true)) {
    return true;
  }
  $note = strtolower((string) ($tx['note'] ?? $tx['playerNote'] ?? $tx['reason'] ?? ''));
  if (str_contains($note, 'retrait') || str_contains($note, 'withdraw') || str_contains($note, 'payout')) {
    return true;
  }
  return false;
}

function admin_looks_like_wd($row): bool {
  if (!is_array($row)) return false;
  $typ = strtolower((string) ($row['type'] ?? ''));
  if (in_array($typ, ['deposit', 'stake', 'win', 'void', 'lost', 'loss', 'trade', 'bet'], true)) return false;
  if (admin_tx_is_withdraw($row)) return true;
  $dest = admin_fill(
    (string) ($row['destination'] ?? ''),
    (string) ($row['phone'] ?? ''),
    (string) ($row['beneficiary'] ?? ''),
    (string) ($row['msisdn'] ?? '')
  );
  if ($dest !== '' && isset($row['amount']) && (isset($row['status']) || isset($row['operator']) || isset($row['method']))) {
    return true;
  }
  return false;
}

function admin_collect_local_wds(array $local): array {
  $rows = [];
  $seen = [];
  $push = static function ($w, string $fb) use (&$rows, &$seen): void {
    if (!is_array($w)) return;
    $n = admin_wd_norm($w, $fb);
    if ($n['id'] === '') return;
    if (abs((float) $n['amount']) < 0.0001) return;
    if (isset($seen[$n['id']])) {
      foreach (['phone', 'reason', 'name', 'email', 'operator', 'createdAt', 'userId'] as $k) {
        if (admin_fill((string) ($rows[$seen[$n['id']]][$k] ?? '')) === '' && admin_fill((string) ($n[$k] ?? '')) !== '') {
          $rows[$seen[$n['id']]][$k] = $n[$k];
        }
      }
      return;
    }
    $seen[$n['id']] = count($rows);
    $rows[] = $n;
  };

  foreach (['withdrawals', 'withdrawal_requests', 'payouts', 'retraits'] as $k) {
    $i = 0;
    foreach (($local[$k] ?? []) as $w) {
      if (!is_array($w)) continue;
      $i++;
      $push($w, $k . '_' . $i);
    }
  }

  $i = 0;
  foreach (($local['transactions'] ?? []) as $tx) {
    if (!is_array($tx) || !admin_looks_like_wd($tx)) continue;
    $i++;
    $push($tx, 'gtx_' . $i);
  }

  foreach (($local['users'] ?? []) as $uid => $u) {
    if (!is_array($u)) continue;
    $i = 0;
    foreach (($u['transactions'] ?? []) as $tx) {
      if (!admin_looks_like_wd($tx)) continue;
      $i++;
      if (admin_fill((string) ($tx['userId'] ?? '')) === '') $tx['userId'] = (string) ($u['id'] ?? $uid);
      if (admin_fill((string) ($tx['email'] ?? '')) === '' && !empty($u['email'])) $tx['email'] = (string) $u['email'];
      if (admin_fill((string) ($tx['phone'] ?? '')) === '' && !empty($u['phone'])) $tx['phone'] = (string) $u['phone'];
      if (admin_fill((string) ($tx['operator'] ?? '')) === '' && !empty($u['lastOperator'])) $tx['operator'] = (string) $u['lastOperator'];
      if (!isset($tx['status']) || $tx['status'] === '') $tx['status'] = 'pending';
      $push($tx, 'utx_' . $uid . '_' . $i);
    }
  }

  admin_walk_local_wds($local, '', $push, 0);
  return $rows;
}

function admin_walk_local_wds($node, string $path, callable $push, int $depth): void {
  if ($depth > 5 || !is_array($node)) return;
  $base = strtolower($path);
  if (in_array($base, [
    'vault', 'sessions', 'positions', 'orders', 'processedtx', 'admin_logs',
    'pendingregistrations', 'users', 'withdrawals', 'withdrawal_requests',
    'payouts', 'retraits',
  ], true)) {
    return;
  }
  $keys = array_keys($node);
  $isList = $node !== [] && $keys === range(0, count($node) - 1);
  if ($isList && isset($node[0]) && is_array($node[0])) {
    $hits = 0;
    foreach ($node as $row) {
      if (is_array($row) && admin_looks_like_wd($row)) $hits++;
    }
    if ($hits > 0 && ($hits * 2 >= count($node) || str_contains($base, 'withdraw') || str_contains($base, 'retrait') || str_contains($base, 'payout'))) {
      $i = 0;
      foreach ($node as $row) {
        if (!is_array($row)) continue;
        $i++;
        $push($row, ($path !== '' ? $path : 'walk') . '_' . $i);
      }
      return;
    }
  }
  foreach ($node as $k => $v) {
    if (!is_array($v)) continue;
    $kk = is_string($k) ? $k : (string) $k;
    admin_walk_local_wds($v, $kk, $push, $depth + 1);
  }
}

function admin_wd_is_silenced(array $w): bool {
  $st = strtolower(trim((string) ($w['status'] ?? '')));
  return !empty($w['adminHidden']) || in_array($st, ['silenced', 'silent'], true);
}

function admin_wd_is_open(array $w): bool {
  if (!empty($w['offsite'])) return false;
  if (admin_wd_is_paid($w) || admin_wd_is_rejected($w) || admin_wd_is_silenced($w)) return false;
  return true;
}

function admin_wd_is_paid(array $w): bool {
  $st = strtolower(trim((string) ($w['status'] ?? '')));
  return in_array($st, ['approved', 'paid', 'completed', 'success', 'sent'], true);
}

function admin_wd_is_rejected(array $w): bool {
  $st = strtolower(trim((string) ($w['status'] ?? '')));
  return in_array($st, ['rejected', 'refused', 'canceled', 'cancelled', 'failed', 'denied'], true);
}

/** Bonus envoyé depuis l'admin (opérateur « admin », référence adm_…) : pas un vrai paiement. */
function admin_dep_is_bonus(array $d): bool {
  $op = strtolower(trim((string) ($d['operator'] ?? '')));
  $ref = (string) ($d['id'] ?? $d['ref'] ?? $d['reference'] ?? '');
  return $op === 'admin' || str_starts_with($ref, 'adm_');
}

function admin_dep_bonus_paid(array $d): bool {
  $st = strtoupper(trim((string) ($d['status'] ?? '')));
  return admin_dep_is_bonus($d) && in_array($st, ['COMPLETED', 'PAID', 'SUCCESS', 'CONFIRMED'], true);
}

/** Vrai dépôt payé. Les bonus sont exclus : ils ne sont pas de l'argent reçu (comptés à part). */
function admin_dep_is_paid(array $d): bool {
  $st = strtoupper(trim((string) ($d['status'] ?? '')));
  return in_array($st, ['COMPLETED', 'PAID', 'SUCCESS', 'CONFIRMED'], true) && !admin_dep_is_bonus($d);
}

function admin_dep_is_pending(array $d): bool {
  $st = strtoupper(trim((string) ($d['status'] ?? '')));
  return in_array($st, ['PENDING', 'PROCESSING', 'WAITING', 'INITIATED', 'CREATED', 'OPEN'], true);
}

function admin_dep_is_failed(array $d): bool {
  $st = strtoupper(trim((string) ($d['status'] ?? '')));
  return in_array($st, ['FAILED', 'CANCELED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'ERROR', 'VOID'], true);
}

/**
 * Époque du tableau admin (affichage seulement).
 * Les comptes plus anciens restent en base, ils ne s’affichent plus.
 * INTERDIT de remettre cutoff à 0 ou user_visible à true sans demande explicite.
 */
function admin_stat_cutoff_ts(): int {
  return strtotime('2026-09-20T21:44:00+00:00') ?: 0;
}

function admin_stat_user_visible(array $p): bool {
  // Plus de masquage par date : le bouton « Nettoyer » supprime vraiment les comptes.
  return true;
  $em = strtolower(trim((string) ($p['email'] ?? '')));
  $pid = strtoupper(trim((string) ($p['publicId'] ?? '')));
  $id = (string) ($p['id'] ?? '');
  if ($em === 'xsw93108@laoia.com') return true;
  if ($pid === 'ORO-705711') return true;
  if ($id === 'admin_master') return true;
  if (function_exists('orolado_admin_emails') && in_array($em, orolado_admin_emails(), true)) return true;
  if ($em === 'admin@orolado.com' || $em === 'admin@6diablo.com') return true;
  $t = strtotime((string) ($p['createdAt'] ?? '')) ?: 0;
  return $t > admin_stat_cutoff_ts();
}

function admin_stat_visible_user_ids(): array {
  $ids = [];
  foreach (admin_profiles() as $p) {
    $id = (string) ($p['id'] ?? '');
    if ($id !== '') $ids[$id] = true;
  }
  return $ids;
}

function admin_stat_keep_deposit_id(string $id): bool {
  return false;
  return $id === 'oro_8297217e1d0843fe8898ac452c3841b2_d6c00b5fd577';
}

function admin_dep_channel(string $op): string {
  $op = strtolower(trim($op));
  if (in_array($op, ['oxapay', 'usdt', 'btc', 'eth', 'trx', 'sol', 'bnb', 'ltc', 'doge', 'crypto'], true)) return 'Crypto';
  if (in_array($op, ['flutterwave', 'flw', 'card', 'card_flw'], true)) return 'Carte';
  if ($op === 'admin') return 'Crédit admin';
  if ($op === 'refund') return 'Remboursement';
  if ($op === '' || $op === 'maketou') return 'Mobile Money';
  if (in_array($op, ['wave', 'orange', 'mtn', 'moov', 'mpesa', 'airtel', 'opay', 'palmpay'], true)) return 'Mobile Money';
  return 'Autre';
}

function admin_fetch_auth_users(): array {
  $cached = admin_cache_get('auth_users', 45);
  if (is_array($cached)) return $cached;
  $base = supabase_project_url();
  $hdrs = supabase_admin_headers();
  $out = [];
  if ($base === '' || !$hdrs) {
    admin_cache_set('auth_users', $out);
    return $out;
  }
  for ($page = 1; $page <= 30; $page++) {
    $res = admin_sb_req('/auth/v1/admin/users?page=' . $page . '&per_page=200', []);
    $body = json_decode((string) ($res['raw'] ?? ''), true);
    $users = [];
    if (is_array($body)) {
      if (isset($body['users']) && is_array($body['users'])) $users = $body['users'];
      else if (isset($body[0])) $users = $body;
    }
    if ($users === []) break;
    foreach ($users as $u) {
      if (is_array($u) && !empty($u['id'])) $out[] = $u;
    }
    if (count($users) < 200) break;
  }
  admin_cache_set('auth_users', $out);
  return $out;
}

function admin_live_seen_map(): array {
  $cached = admin_cache_get('live_seen', 4);
  if (is_array($cached)) return $cached;
  $map = [];
  $cut = time() - 180;
  $rows = admin_sb_all('profiles', 'id,last_seen', 'last_seen.desc', 500, 'last_seen=not.is.null');
  foreach ($rows as $r) {
    $id = (string) ($r['id'] ?? '');
    $ls = (string) ($r['last_seen'] ?? '');
    if ($id === '' || $ls === '') continue;
    $t = strtotime($ls) ?: 0;
    if ($t >= $cut) $map[$id] = $ls;
  }
  $local = admin_local_db();
  foreach (($local['users'] ?? []) as $id => $u) {
    if (!is_array($u)) continue;
    $id = (string) ($u['id'] ?? $id);
    $ls = (string) ($u['lastSeen'] ?? '');
    if ($id === '' || $ls === '') continue;
    $t = strtotime($ls) ?: 0;
    $prev = isset($map[$id]) ? (strtotime((string) $map[$id]) ?: 0) : 0;
    if ($t > $prev) $map[$id] = $ls;
  }
  admin_cache_set('live_seen', $map);
  return $map;
}

function admin_apply_live_seen(array $list): array {
  $live = admin_live_seen_map();
  foreach ($list as $i => $p) {
    $id = (string) ($p['id'] ?? '');
    if ($id === '' || !isset($live[$id])) continue;
    $cur = strtotime((string) ($p['lastSeen'] ?? '')) ?: 0;
    $nxt = strtotime((string) $live[$id]) ?: 0;
    if ($nxt > $cur) $list[$i]['lastSeen'] = $live[$id];
  }
  return $list;
}

function admin_profiles(): array {
  $cached = admin_cache_get('profiles_epoch2', 40);
  if (is_array($cached) && isset($cached['list'])) return admin_apply_live_seen($cached['list']);

  $rows = admin_sb_all(
    'profiles',
    'id,email,display_name,phone,country_code,role,created_at,last_seen,real_deposit_total,real_trades,updated_at,whatsapp,mobile',
    'created_at.asc',
    1000
  );
  $auth = admin_fetch_auth_users();
  $byId = [];
  foreach ($rows as $p) {
    $id = (string) ($p['id'] ?? '');
    if ($id === '') continue;
    $byId[$id] = [
      'id' => $id,
      'email' => (string) ($p['email'] ?? ''),
      'name' => (string) ($p['display_name'] ?? ''),
      'phone' => trim((string) ($p['phone'] ?? ($p['whatsapp'] ?? ($p['mobile'] ?? '')))),
      'country' => (string) ($p['country_code'] ?? ''),
      'role' => (string) ($p['role'] ?? 'user'),
      'createdAt' => (string) ($p['created_at'] ?? ''),
      'lastSeen' => (string) ($p['last_seen'] ?? ''),
      'depositTotal' => (float) ($p['real_deposit_total'] ?? 0),
      'realTrades' => (int) ($p['real_trades'] ?? 0),
      'traffic' => (string) ($p['traffic_source'] ?? ''),
      'ip' => '',
      'publicId' => '',
    ];
  }
  foreach ($auth as $u) {
    $id = (string) ($u['id'] ?? '');
    if ($id === '') continue;
    $meta = is_array($u['user_metadata'] ?? null) ? $u['user_metadata'] : [];
    $email = (string) ($u['email'] ?? ($meta['email'] ?? ''));
    $ip = (string) ($u['last_sign_in_ip'] ?? $u['ip'] ?? ($meta['ip'] ?? ''));
    $created = (string) ($u['created_at'] ?? '');
    $src = (string) ($meta['trafficSource'] ?? $meta['traffic_source'] ?? $meta['utm_source'] ?? '');
    if (!isset($byId[$id])) {
      $byId[$id] = [
        'id' => $id,
        'email' => $email,
        'name' => (string) ($meta['display_name'] ?? $meta['full_name'] ?? ''),
        'phone' => (string) ($u['phone'] ?? ($meta['phone'] ?? '')),
        'country' => (string) ($meta['country_code'] ?? $meta['country'] ?? ''),
        'role' => 'user',
        'createdAt' => $created,
        'lastSeen' => (string) ($u['last_sign_in_at'] ?? ''),
        'depositTotal' => 0.0,
        'realTrades' => 0,
        'traffic' => $src,
        'ip' => $ip,
        'publicId' => '',
      ];
    } else {
      $aphone = trim((string) ($u['phone'] ?? ($meta['phone'] ?? ($meta['destination'] ?? ''))));
      // L'adresse de CONNEXION fait foi (après un changement d'e-mail, le profil peut être en retard).
      if ($email !== '') $byId[$id]['email'] = strtolower($email);
      if ($byId[$id]['phone'] === '' && $aphone !== '') $byId[$id]['phone'] = $aphone;
      if ($byId[$id]['name'] === '') {
        $an = trim((string) ($meta['display_name'] ?? $meta['full_name'] ?? ''));
        if ($an !== '') $byId[$id]['name'] = $an;
      }
      if ($byId[$id]['ip'] === '' && $ip !== '') $byId[$id]['ip'] = $ip;
      if (($byId[$id]['country'] ?? '') === '') {
        $cc = trim((string) ($meta['country_code'] ?? $meta['country'] ?? ''));
        if ($cc !== '') $byId[$id]['country'] = $cc;
      }
      $lang = trim((string) ($meta['lang'] ?? $meta['locale'] ?? $meta['language'] ?? ''));
      if ($lang !== '') $byId[$id]['lang'] = $lang;
      if ($byId[$id]['traffic'] === '' && $src !== '') $byId[$id]['traffic'] = $src;
      if ($byId[$id]['createdAt'] === '' && $created !== '') $byId[$id]['createdAt'] = $created;
      if ($byId[$id]['lastSeen'] === '' && !empty($u['last_sign_in_at'])) {
        $byId[$id]['lastSeen'] = (string) $u['last_sign_in_at'];
      }
    }
  }

  $local = admin_local_db();
  foreach (($local['users'] ?? []) as $id => $u) {
    if (!is_array($u)) continue;
    $id = (string) ($u['id'] ?? $id);
    if ($id === '') continue;
    // Fiche locale à id court liée à son compte de la base : une seule ligne par joueur.
    $sbLink = (string) ($u['sbId'] ?? '');
    if (!isset($byId[$id]) && $sbLink !== '' && isset($byId[$sbLink])) $id = $sbLink;
    $pid = (string) ($u['publicId'] ?? '');
    if (isset($byId[$id])) {
      if (!empty($u['emailHistory']) && (string) ($u['email'] ?? '') !== '') $byId[$id]['email'] = strtolower((string) $u['email']);
      if ($pid !== '') $byId[$id]['publicId'] = $pid;
      if ($byId[$id]['traffic'] === '') $byId[$id]['traffic'] = (string) ($u['trafficSource'] ?? '');
      $byId[$id]['trafficMedium'] = (string) ($u['trafficMedium'] ?? $byId[$id]['trafficMedium'] ?? '');
      $byId[$id]['trafficCampaign'] = (string) ($u['trafficCampaign'] ?? $byId[$id]['trafficCampaign'] ?? '');
      $byId[$id]['trafficReferrer'] = (string) ($u['trafficReferrer'] ?? $byId[$id]['trafficReferrer'] ?? '');
      if ($byId[$id]['phone'] === '') $byId[$id]['phone'] = (string) ($u['phone'] ?? '');
      if ($byId[$id]['name'] === '') $byId[$id]['name'] = (string) ($u['displayName'] ?? '');
      $locSeen = (string) ($u['lastSeen'] ?? '');
      $curSeen = (string) ($byId[$id]['lastSeen'] ?? '');
      $locT = $locSeen !== '' ? (strtotime($locSeen) ?: 0) : 0;
      $curT = $curSeen !== '' ? (strtotime($curSeen) ?: 0) : 0;
      if ($locT > $curT) $byId[$id]['lastSeen'] = $locSeen;
      $locDep = (float) ($u['realDepositTotal'] ?? 0);
      if ($locDep > (float) ($byId[$id]['depositTotal'] ?? 0)) $byId[$id]['depositTotal'] = $locDep;
      $isoLoc = strtoupper((string) ($u['country'] ?? ''));
      if (preg_match('/^[A-Z]{2}$/', $isoLoc)) $byId[$id]['country'] = $isoLoc;
      elseif (($byId[$id]['country'] ?? '') === '') $byId[$id]['country'] = (string) ($u['countryCode'] ?? '');
      if (empty($byId[$id]['lang'])) $byId[$id]['lang'] = (string) ($u['lang'] ?? $u['locale'] ?? '');
      continue;
    }
    $byId[$id] = [
      'id' => $id,
      'email' => (string) ($u['email'] ?? ''),
      'name' => (string) ($u['displayName'] ?? ''),
      'phone' => (string) ($u['phone'] ?? ''),
      'country' => preg_match('/^[A-Z]{2}$/', strtoupper((string) ($u['country'] ?? ''))) ? strtoupper((string) $u['country']) : (string) ($u['countryCode'] ?? ''),
      'role' => (string) ($u['role'] ?? 'user'),
      'createdAt' => (string) ($u['createdAt'] ?? ''),
      'lastSeen' => (string) ($u['lastSeen'] ?? ''),
      'depositTotal' => (float) ($u['realDepositTotal'] ?? 0),
      'realTrades' => (int) ($u['realTrades'] ?? 0),
      'traffic' => (string) ($u['trafficSource'] ?? 'direct'),
      'trafficMedium' => (string) ($u['trafficMedium'] ?? ''),
      'trafficCampaign' => (string) ($u['trafficCampaign'] ?? ''),
      'trafficReferrer' => (string) ($u['trafficReferrer'] ?? ''),
      'ip' => '',
      'publicId' => $pid,
    ];
  }

  $list = array_values($byId);
  $uniq = [];
  foreach ($list as $row) {
    $em = strtolower(trim((string) ($row['email'] ?? '')));
    $key = $em !== '' ? ('e:' . $em) : ('i:' . (string) ($row['id'] ?? ''));
    if ($key === 'e:' || $key === 'i:') continue;
    if (!isset($uniq[$key])) {
      $uniq[$key] = $row;
      continue;
    }
    $prev = $uniq[$key];
    $aId = (string) ($prev['id'] ?? '');
    $bId = (string) ($row['id'] ?? '');
    $aUuid = (bool) preg_match('/^[0-9a-f-]{36}$/i', $aId);
    $bUuid = (bool) preg_match('/^[0-9a-f-]{36}$/i', $bId);
    $preferNew = $bUuid && !$aUuid;
    $keep = $preferNew ? $row : $prev;
    $src = $preferNew ? $prev : $row;
    foreach (['email', 'name', 'phone', 'country', 'createdAt', 'lastSeen', 'publicId', 'ip', 'traffic', 'lang'] as $f) {
      if (($keep[$f] ?? '') === '' && ($src[$f] ?? '') !== '') $keep[$f] = $src[$f];
    }
    if ((float) ($src['depositTotal'] ?? 0) > (float) ($keep['depositTotal'] ?? 0)) {
      $keep['depositTotal'] = (float) $src['depositTotal'];
    }
    $ca = (string) ($keep['createdAt'] ?? '');
    $cb = (string) ($src['createdAt'] ?? '');
    if ($cb !== '' && ($ca === '' || strcmp($cb, $ca) < 0)) $keep['createdAt'] = $cb;
    $uniq[$key] = $keep;
  }
  $list = array_values($uniq);
  usort($list, static function ($a, $b) {
    return strcmp((string) ($a['createdAt'] ?? ''), (string) ($b['createdAt'] ?? ''));
  });
  $n = 0;
  foreach ($list as $i => $row) {
    $n++;
    $list[$i]['seq'] = $n;
    if (($list[$i]['publicId'] ?? '') === '') $list[$i]['publicId'] = 'ORO-' . $n;
    if (($list[$i]['traffic'] ?? '') === '') $list[$i]['traffic'] = 'direct';
  }
  $list = array_values(array_filter($list, static fn($p) => admin_stat_user_visible($p)));
  $n = 0;
  foreach ($list as $i => $row) {
    $n++;
    $list[$i]['seq'] = $n;
    $em = strtolower(trim((string) ($row['email'] ?? '')));
    if ($em === 'admin@orolado.com' || (function_exists('orolado_is_reserved_admin_email') && orolado_is_reserved_admin_email($em))) {
      if (($list[$i]['publicId'] ?? '') === '') $list[$i]['publicId'] = 'ORO-ADMIN';
    } else if (($list[$i]['publicId'] ?? '') === '') {
      $list[$i]['publicId'] = 'ORO-' . $n;
    }
    if (($list[$i]['traffic'] ?? '') === '') $list[$i]['traffic'] = 'direct';
  }
  // Bonus séparés de l'argent réellement payé : « depositTotal » = argent déposé seulement.
  $bonusBy = admin_bonus_by_user();
  foreach ($list as $i => $row) {
    $b = (float) ($bonusBy[(string) ($row['id'] ?? '')] ?? 0);
    $list[$i]['bonusTotal'] = round($b, 2);
    $list[$i]['depositTotal'] = round(max(0.0, (float) ($row['depositTotal'] ?? 0) - $b), 2);
  }
  admin_cache_set('profiles_epoch2', ['list' => $list]);
  return admin_apply_live_seen($list);
}

/**
 * Total des bonus envoyés par l'admin, par joueur (opérateur « admin » / réf. adm_…).
 * Lu directement (sans passer par admin_deposits, qui dépend de la liste des joueurs).
 */
function admin_bonus_by_user(): array {
  $cached = admin_cache_get('bonus_by_user', 20);
  if (is_array($cached)) return $cached;
  $seen = [];
  $by = [];
  $add = static function (array $d) use (&$seen, &$by): void {
    $id = (string) ($d['id'] ?? $d['ref'] ?? $d['reference'] ?? '');
    if ($id === '' || isset($seen[$id]) || !admin_dep_bonus_paid($d)) return;
    $seen[$id] = true;
    $uid = (string) ($d['userId'] ?? $d['user_id'] ?? '');
    if ($uid === '') return;
    $by[$uid] = ($by[$uid] ?? 0.0) + (float) ($d['amount'] ?? 0);
  };
  foreach (admin_sb_all('deposits', 'id,user_id,amount,status,operator,reference', 'created_at.desc', 1000, 'operator=eq.admin') as $d) {
    if (is_array($d)) $add($d);
  }
  foreach ((admin_local_db()['deposits'] ?? []) as $d) {
    if (is_array($d)) $add($d);
  }
  admin_cache_set('bonus_by_user', $by);
  return $by;
}

function admin_profile_map(): array {
  $map = [];
  foreach (admin_profiles() as $p) {
    $map[(string) $p['id']] = $p;
  }
  return $map;
}

function admin_vaults(): array {
  $cached = admin_cache_get('vaults', 25);
  if (is_array($cached)) return $cached;
  $rows = admin_sb_all('vaults', 'user_id,real,demo,updated_at', 'real.desc', 1000);
  $map = [];
  foreach ($rows as $v) {
    $id = (string) ($v['user_id'] ?? '');
    if ($id === '') continue;
    $map[$id] = ['real' => (float) ($v['real'] ?? 0), 'demo' => (float) ($v['demo'] ?? 0)];
  }
  $local = admin_local_db();
  foreach (($local['vault'] ?? []) as $id => $v) {
    if (!is_array($v)) continue;
    $id = (string) $id;
    if (!isset($map[$id])) {
      $map[$id] = ['real' => (float) ($v['real'] ?? 0), 'demo' => (float) ($v['demo'] ?? 0)];
    } else if ((float) ($map[$id]['real'] ?? 0) <= 0.009) {
      $localReal = (float) ($v['real'] ?? 0);
      if ($localReal > 0.009) $map[$id]['real'] = $localReal;
    }
  }
  admin_cache_set('vaults', $map);
  return $map;
}

function admin_wd_norm(array $w, string $fallbackId = ''): array {
  $id = admin_fill((string) ($w['id'] ?? ''), (string) ($w['reference'] ?? ''), $fallbackId);
  $phone = admin_fill(
    (string) ($w['phone'] ?? ''),
    (string) ($w['destination'] ?? ''),
    (string) ($w['dest'] ?? ''),
    (string) ($w['msisdn'] ?? ''),
    (string) ($w['account'] ?? ''),
    (string) ($w['number'] ?? '')
  );
  $st = strtolower(trim((string) ($w['status'] ?? 'pending')));
  if ($st === '') $st = 'pending';
  $op = admin_fill(
    (string) ($w['operator'] ?? ''),
    (string) ($w['method'] ?? ''),
    (string) ($w['methodName'] ?? ''),
    (string) ($w['network'] ?? ''),
    (string) ($w['channel'] ?? ''),
    (string) ($w['wallet'] ?? '')
  );
  if ($id === '') {
    $id = 'wd_' . substr(md5(json_encode([
      $w['userId'] ?? $w['user_id'] ?? '',
      $w['amount'] ?? 0,
      $w['at'] ?? $w['created_at'] ?? $w['createdAt'] ?? '',
      $phone,
      $op,
    ])), 0, 16);
  }
  return [
    'id' => $id,
    'userId' => (string) ($w['userId'] ?? $w['user_id'] ?? ''),
    'amount' => abs((float) ($w['amount'] ?? 0)),
    'status' => $st,
    'operator' => $op,
    'phone' => $phone,
    'reference' => admin_fill((string) ($w['reference'] ?? ''), $id),
    'createdAt' => (string) ($w['at'] ?? $w['createdAt'] ?? $w['created_at'] ?? $w['date'] ?? ''),
    'reason' => (string) ($w['playerNote'] ?? $w['reason'] ?? $w['motif'] ?? $w['note'] ?? ''),
    'adminHidden' => !empty($w['adminHidden']) || in_array($st, ['silenced', 'silent'], true),
    'playerHidden' => !empty($w['playerHidden']),
    'refundedAt' => (string) ($w['refundedAt'] ?? ''),
    'refunded' => !empty($w['refunded']) || !empty($w['refundedAt']),
    'name' => admin_fill((string) ($w['name'] ?? ''), (string) ($w['beneficiary'] ?? '')),
    'email' => (string) ($w['email'] ?? ''),
  ];
}

function admin_wd_status_rank(array $w): int {
  if (admin_wd_is_silenced($w)) return 40;
  if (admin_wd_is_paid($w)) return 30;
  if (admin_wd_is_rejected($w)) return 20;
  return 10;
}

function admin_wd_merge_into(array &$dst, array $src): void {
  foreach (['phone', 'reason', 'name', 'email', 'operator', 'createdAt', 'userId'] as $k) {
    if (admin_fill((string) ($dst[$k] ?? '')) === '' && admin_fill((string) ($src[$k] ?? '')) !== '') {
      $dst[$k] = $src[$k];
    }
  }
  if (!empty($src['adminHidden'])) $dst['adminHidden'] = true;
  if (!empty($src['playerHidden'])) $dst['playerHidden'] = true;
  if (!empty($src['refundedAt'])) $dst['refundedAt'] = $src['refundedAt'];
  if (!empty($src['refunded'])) $dst['refunded'] = true;
  if (admin_wd_status_rank($src) > admin_wd_status_rank($dst)) {
    $dst['status'] = $src['status'];
  }
}

function admin_find_wd_row(string $id): ?array {
  $id = trim($id);
  if ($id === '') return null;
  foreach (admin_withdrawals() as $w) {
    if (!is_array($w)) continue;
    if ((string) ($w['id'] ?? '') === $id) return $w;
    if ((string) ($w['reference'] ?? '') === $id) return $w;
  }
  return null;
}

/** Le serveur a-t-il enregistré ce retrait (= la caisse a bien été débitée) ? */
function admin_wd_has_local(array $db, string $id): bool {
  if ($id === '') return false;
  foreach (admin_collect_local_wds($db) as $w) {
    if ((string) ($w['id'] ?? '') === $id || (string) ($w['reference'] ?? '') === $id) return true;
  }
  return false;
}

function admin_upsert_local_wd(array &$db, array $row): int {
  if (!isset($db['withdrawals']) || !is_array($db['withdrawals'])) $db['withdrawals'] = [];
  $id = (string) ($row['id'] ?? '');
  foreach ($db['withdrawals'] as $i => $w) {
    if (!is_array($w)) continue;
    if ((string) ($w['id'] ?? '') === $id || ($id !== '' && (string) ($w['reference'] ?? '') === $id)) {
      $db['withdrawals'][$i] = array_merge($w, $row);
      return (int) $i;
    }
  }
  $db['withdrawals'][] = $row;
  return count($db['withdrawals']) - 1;
}

function admin_wd_fingerprint(array $w): string {
  $uid = admin_fill((string) ($w['userId'] ?? ''));
  $amt = number_format(abs((float) ($w['amount'] ?? 0)), 2, '.', '');
  $t = strtotime((string) ($w['createdAt'] ?? '')) ?: 0;
  $bucket = $t > 0 ? (string) intdiv($t, 90) : '0';
  if ($uid === '' && $amt === '0.00') return '';
  return $uid . '|' . $amt . '|' . $bucket;
}

function admin_sb_withdraw_txs(): array {
  $cached = admin_cache_get('wd_tx2', 20);
  if (is_array($cached) && isset($cached['rows']) && is_array($cached['rows'])) return $cached['rows'];
  $byId = [];
  $add = static function (array $rows) use (&$byId): void {
    foreach ($rows as $r) {
      if (!is_array($r) || !admin_tx_is_withdraw($r)) continue;
      $id = admin_fill((string) ($r['id'] ?? ''));
      if ($id === '') $id = 'stx_' . md5(json_encode($r));
      $byId[$id] = $r;
    }
  };
  $add(admin_sb_all('transactions', 'id,user_id,type,amount,note,mode,created_at', 'created_at.desc', 1000, 'type=eq.withdraw'));
  $add(admin_sb_all('transactions', 'id,user_id,type,amount,note,mode,created_at', 'created_at.desc', 1000, 'type=in.(withdraw,withdrawal,payout,retrait)'));
  $add(admin_sb_all('transactions', 'id,user_id,type,amount,note,mode,created_at', 'created_at.desc', 1000, 'note=ilike.*retrait*'));
  if (count($byId) < 12) {
    $add(admin_sb_all('transactions', 'id,user_id,type,amount,note,mode,created_at', 'created_at.desc', 1000, ''));
  }
  $rows = array_values($byId);
  admin_cache_set('wd_tx2', ['rows' => $rows]);
  return $rows;
}

function admin_wd_contacts(): array {
  static $c = null;
  if (is_array($c)) return $c;
  $c = [];
  $set = static function (string $uid, array $bits) use (&$c): void {
    if ($uid === '') return;
    if (!isset($c[$uid])) $c[$uid] = ['phone' => '', 'operator' => '', 'email' => '', 'name' => ''];
    foreach (['phone', 'operator', 'email', 'name'] as $k) {
      if (admin_fill((string) ($c[$uid][$k] ?? '')) === '') {
        $v = admin_fill((string) ($bits[$k] ?? ''));
        if ($v !== '') $c[$uid][$k] = $v;
      }
    }
  };
  foreach (admin_profiles() as $p) {
    $set((string) ($p['id'] ?? ''), [
      'phone' => (string) ($p['phone'] ?? ''),
      'email' => (string) ($p['email'] ?? ''),
      'name' => (string) ($p['name'] ?? ''),
    ]);
  }
  $local = admin_local_db();
  foreach (($local['users'] ?? []) as $id => $u) {
    if (!is_array($u)) continue;
    $set((string) ($u['id'] ?? $id), [
      'phone' => admin_fill((string) ($u['phone'] ?? ''), (string) ($u['destination'] ?? '')),
      'operator' => admin_fill((string) ($u['lastOperator'] ?? ''), (string) ($u['operator'] ?? '')),
      'email' => (string) ($u['email'] ?? ''),
      'name' => (string) ($u['displayName'] ?? ''),
    ]);
  }
  foreach (admin_collect_local_wds($local) as $w) {
    $set((string) ($w['userId'] ?? ''), [
      'phone' => (string) ($w['phone'] ?? ''),
      'operator' => (string) ($w['operator'] ?? ''),
      'email' => (string) ($w['email'] ?? ''),
      'name' => (string) ($w['name'] ?? ''),
    ]);
  }
  return $c;
}

function admin_enrich_wd(array $w, array $pmap): array {
  $uid = admin_fill((string) ($w['userId'] ?? ''));
  $u = $uid !== '' ? admin_user_lookup($uid, $pmap) : ['id' => '', 'publicId' => '', 'email' => '', 'name' => '', 'phone' => ''];
  if ($uid === '' && admin_fill((string) ($w['email'] ?? '')) !== '') {
    $em = strtolower((string) $w['email']);
    foreach ($pmap as $p) {
      if (strtolower((string) ($p['email'] ?? '')) === $em) {
        $u = $p;
        $uid = (string) ($p['id'] ?? '');
        $w['userId'] = $uid;
        break;
      }
    }
  }
  $ct = admin_wd_contacts()[$uid] ?? ['phone' => '', 'operator' => '', 'email' => '', 'name' => ''];
  $w['phone'] = admin_fill((string) ($w['phone'] ?? ''), (string) ($u['phone'] ?? ''), (string) ($ct['phone'] ?? ''));
  $w['operator'] = admin_method_label(admin_fill((string) ($w['operator'] ?? ''), (string) ($ct['operator'] ?? '')));
  $w['email'] = admin_fill((string) ($w['email'] ?? ''), (string) ($u['email'] ?? ''), (string) ($ct['email'] ?? ''));
  $w['name'] = admin_fill((string) ($w['name'] ?? ''), (string) ($u['name'] ?? ''), (string) ($ct['name'] ?? ''));
  $w['publicId'] = admin_fill((string) ($u['publicId'] ?? ''), (string) ($w['publicId'] ?? ''));
  return $w;
}

function admin_restore_hidden_wds_once(): void {
  $dir = function_exists('orolado_data_dir') ? orolado_data_dir() : (__DIR__ . '/data');
  $marker = rtrim(str_replace('\\', '/', $dir), '/') . '/wd_restore_visible_v1.done';
  if (is_file($marker)) return;
  $db = admin_local_db();
  $n = 0;
  foreach (($db['withdrawals'] ?? []) as $i => $w) {
    if (!is_array($w)) continue;
    if (admin_wd_is_paid($w) || admin_wd_is_rejected($w)) continue;
    $st = strtolower(trim((string) ($w['status'] ?? '')));
    $hidden = !empty($w['adminHidden']) || in_array($st, ['silenced', 'silent', 'hidden', 'deleted'], true);
    if (!$hidden) continue;
    $db['withdrawals'][$i]['adminHidden'] = false;
    $db['withdrawals'][$i]['playerHidden'] = false;
    if (in_array($st, ['silenced', 'silent', 'hidden', 'deleted'], true)) {
      $db['withdrawals'][$i]['status'] = 'pending';
    }
    $n++;
  }
  if ($n > 0) {
    save_db(orolado_data_file(), $db);
    $hdrs = function_exists('supabase_admin_headers') ? supabase_admin_headers() : null;
    if ($hdrs) {
      admin_sb_req('/rest/v1/withdrawals?status=eq.silenced', [], 'PATCH', json_encode(['status' => 'pending']));
      admin_sb_req('/rest/v1/withdrawals?status=eq.silent', [], 'PATCH', json_encode(['status' => 'pending']));
      admin_sb_req('/rest/v1/withdrawals?status=eq.hidden', [], 'PATCH', json_encode(['status' => 'pending']));
    }
  }
  @file_put_contents($marker, json_encode(['at' => date('c'), 'restored' => $n]));
  admin_bust_cache();
}

function admin_withdrawals(): array {
  admin_restore_hidden_wds_once();
  $cached = admin_cache_get('wd_epoch2', 15);
  if (is_array($cached)) return $cached;
  $byId = [];
  $byFp = [];
  $localIds = [];
  $put = static function (array $row) use (&$byId, &$byFp, &$localIds): void {
    $id = admin_fill((string) ($row['id'] ?? ''));
    if ($id === '') return;
    $fp = admin_wd_fingerprint($row);
    if (isset($byId[$id])) {
      admin_wd_merge_into($byId[$id], $row);
      return;
    }
    if ($fp !== '' && isset($byFp[$fp])) {
      $existId = $byFp[$fp];
      $sameId = $existId === $id;
      $synth = static fn(string $x): bool => (bool) preg_match('/^(walk_|utx_|stx_|withdrawals_|payouts_|retraits_)/', $x);
      if (!$sameId && !$synth($id) && !$synth($existId)) {
        $byId[$id] = $row;
        return;
      }
      admin_wd_merge_into($byId[$existId], $row);
      $preferNew = $synth($existId) && !$synth($id);
      if ($preferNew) {
        admin_wd_merge_into($row, $byId[$existId]);
        unset($byId[$existId]);
        $byId[$id] = $row;
        $byFp[$fp] = $id;
        if (isset($localIds[$existId])) $localIds[$id] = true;
      }
      return;
    }
    $byId[$id] = $row;
    if ($fp !== '') $byFp[$fp] = $id;
  };

  foreach (admin_collect_local_wds(admin_local_db()) as $w) {
    $put($w);
    $localIds[admin_fill((string) ($w['id'] ?? ''))] = true;
  }

  $sbCached = admin_cache_get('wd_sb2', 20);
  if (!is_array($sbCached)) {
    $sbCached = admin_sb_all(
      'withdrawals',
      'id,user_id,amount,status,operator,phone,reference,destination,created_at',
      'created_at.desc',
      1000
    );
    if (!is_array($sbCached)) $sbCached = [];
    admin_cache_set('wd_sb2', $sbCached);
  }
  foreach ($sbCached as $w) {
    if (!is_array($w)) continue;
    $put(admin_wd_norm($w));
  }

  foreach (admin_sb_withdraw_txs() as $tx) {
    if (!is_array($tx)) continue;
    if (!isset($tx['status']) || $tx['status'] === '') $tx['status'] = 'pending';
    $put(admin_wd_norm($tx, (string) ($tx['id'] ?? '')));
  }

  // SÉCURITÉ : un vrai retrait est TOUJOURS enregistré par le serveur (fichier) au moment où il
  // débite la caisse. Une ligne qui n'existe que dans Supabase (écrite depuis un téléphone) n'a
  // débité personne : elle est marquée « hors site » et ne peut pas être validée.
  foreach ($byId as $id => $w) {
    if (isset($localIds[$id]) || !admin_wd_is_open($w)) continue;
    $byId[$id]['offsite'] = true;
    $byId[$id]['status'] = 'hors site (non débité, ne pas payer)';
  }
  $list = array_values($byId);
  usort($list, static function ($a, $b) {
    return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
  });
  $keepIds = admin_stat_visible_user_ids();
  $list = array_values(array_filter($list, static function ($w) use ($keepIds) {
    $uid = (string) ($w['userId'] ?? '');
    return $uid !== '' && isset($keepIds[$uid]);
  }));
  admin_cache_set('wd_epoch2', $list);
  return $list;
}

function admin_deposits(): array {
  $cached = admin_cache_get('deposits_epoch2', 20);
  if (is_array($cached)) return $cached;
  $sb = admin_sb_all(
    'deposits',
    'id,user_id,amount,status,operator,reference,created_at,completed_at,alias_email',
    'created_at.desc',
    1000
  );
  $byId = [];
  foreach ($sb as $d) {
    $id = (string) ($d['id'] ?? $d['reference'] ?? '');
    if ($id === '') continue;
    $byId[$id] = [
      'id' => $id,
      'userId' => (string) ($d['user_id'] ?? ''),
      'amount' => (float) ($d['amount'] ?? 0),
      'status' => strtoupper((string) ($d['status'] ?? 'PENDING')),
      'operator' => (string) ($d['operator'] ?? ''),
      'createdAt' => (string) ($d['completed_at'] ?? $d['created_at'] ?? ''),
      'createdRaw' => (string) ($d['created_at'] ?? ''),
    ];
  }
  $local = admin_local_db();
  foreach (($local['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    $id = (string) ($d['id'] ?? $d['ref'] ?? '');
    if ($id === '') continue;
    $row = [
      'id' => $id,
      'userId' => (string) ($d['userId'] ?? $d['user_id'] ?? ''),
      'amount' => (float) ($d['amount'] ?? 0),
      'status' => strtoupper((string) ($d['status'] ?? 'PENDING')),
      'operator' => (string) ($d['operator'] ?? ''),
      'createdAt' => (string) ($d['paidAt'] ?? $d['createdAt'] ?? $d['at'] ?? ''),
      'createdRaw' => (string) ($d['createdAt'] ?? $d['at'] ?? ''),
      'motif' => (string) ($d['motif'] ?? $d['note'] ?? ''),
    ];
    if (!isset($byId[$id])) {
      $byId[$id] = $row;
    } else {
      if ($row['motif'] !== '') $byId[$id]['motif'] = $row['motif'];
      $cur = $byId[$id];
      $rowPaid = admin_dep_is_paid($row);
      $curPaid = admin_dep_is_paid($cur);
      if ($rowPaid && !$curPaid) {
        $byId[$id] = $row;
      } else if ($rowPaid || !$curPaid) {
        if ((float) ($row['amount'] ?? 0) > (float) ($cur['amount'] ?? 0)) $byId[$id]['amount'] = (float) $row['amount'];
        if ((string) ($row['userId'] ?? '') !== '' && (string) ($cur['userId'] ?? '') === '') $byId[$id]['userId'] = $row['userId'];
        $rowAt = (string) ($row['createdAt'] ?? '');
        $curAt = (string) ($cur['createdAt'] ?? '');
        if ($rowAt !== '' && strcmp($rowAt, $curAt) > 0) $byId[$id]['createdAt'] = $rowAt;
      }
    }
  }
  $list = array_values($byId);
  usort($list, static function ($a, $b) {
    return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
  });
  $keepIds = admin_stat_visible_user_ids();
  $list = array_values(array_filter($list, static function ($d) use ($keepIds) {
    $id = (string) ($d['id'] ?? '');
    if (admin_stat_keep_deposit_id($id)) return true;
    $uid = (string) ($d['userId'] ?? '');
    return $uid !== '' && isset($keepIds[$uid]);
  }));
  admin_cache_set('deposits_epoch2', $list);
  return $list;
}

/** Nombre de jours de trades chargés pour les statistiques du tableau (au-delà : trop lourd). */
const ADMIN_ORDERS_DAYS = 30;

function admin_local_order_row(array $o): array {
  $at = $o['createdAt'] ?? $o['at'] ?? '';
  if (is_numeric($at)) $at = date('c', (int) $at);
  return [
    'id' => (string) ($o['id'] ?? ''),
    'user_id' => (string) ($o['userId'] ?? $o['user_id'] ?? ''),
    'asset_id' => (string) ($o['assetId'] ?? $o['asset_id'] ?? ''),
    'side' => (string) ($o['side'] ?? ''),
    'stake' => (float) ($o['stake'] ?? 0),
    'duration' => (int) ($o['duration'] ?? 0),
    'mode' => (string) ($o['mode'] ?? 'demo'),
    'won' => $o['won'] ?? null,
    'net' => (float) ($o['net'] ?? 0),
    'status' => (string) ($o['status'] ?? ''),
    'payout' => (float) ($o['payout'] ?? $o['payoutMult'] ?? 0),
    'created_at' => (string) $at,
    'expiryAt' => $o['expiryAt'] ?? $o['expiry_at'] ?? null,
  ];
}

/**
 * Trades RÉELS des 30 derniers jours (avant : jusqu'à 20 000 trades de tous les temps,
 * rechargés toutes les 25 s — lent, et les statistiques devenaient fausses au-delà).
 */
function admin_orders(): array {
  $cached = admin_cache_get('orders_epoch3', 25);
  if (is_array($cached)) return $cached;
  $since = gmdate('Y-m-d\TH:i:s\Z', time() - ADMIN_ORDERS_DAYS * 86400);
  $filter = 'mode=eq.real&created_at=gte.' . rawurlencode($since);
  $rows = admin_sb_all('orders', 'id,user_id,asset_id,side,stake,duration,mode,won,net,status,payout,created_at', 'created_at.desc', 1000, $filter);
  $local = admin_local_db();
  $byId = [];
  foreach ($rows as $o) {
    $id = (string) ($o['id'] ?? '');
    if ($id === '') continue;
    $byId[$id] = $o;
  }
  $cut = time() - ADMIN_ORDERS_DAYS * 86400;
  foreach (($local['orders'] ?? []) as $o) {
    if (!is_array($o)) continue;
    $row = admin_local_order_row($o);
    if ($row['id'] === '' || isset($byId[$row['id']]) || $row['mode'] !== 'real') continue;
    $t = strtotime($row['created_at']) ?: time();
    if ($t < $cut) continue;
    $byId[$row['id']] = $row;
  }
  $list = array_values($byId);
  $keepIds = admin_stat_visible_user_ids();
  $list = array_values(array_filter($list, static function ($o) use ($keepIds) {
    $uid = (string) ($o['user_id'] ?? $o['userId'] ?? '');
    return $uid !== '' && isset($keepIds[$uid]);
  }));
  admin_cache_set('orders_epoch3', $list);
  return $list;
}

/** Tous les trades réels d'UN joueur (fiche joueur, contrôle anti-fraude). */
function admin_orders_for_user(string $uid): array {
  if ($uid === '') return [];
  static $memo = [];
  if (isset($memo[$uid])) return $memo[$uid];
  $byId = [];
  if (admin_is_uuid_str($uid)) {
    $rows = admin_sb_all('orders', 'id,user_id,asset_id,side,stake,duration,mode,won,net,status,payout,created_at', 'created_at.desc', 1000,
      'user_id=eq.' . rawurlencode($uid) . '&mode=eq.real');
    foreach ($rows as $o) {
      $id = (string) ($o['id'] ?? '');
      if ($id !== '') $byId[$id] = $o;
    }
  }
  foreach ((admin_local_db()['orders'] ?? []) as $o) {
    if (!is_array($o)) continue;
    $row = admin_local_order_row($o);
    if ($row['id'] === '' || isset($byId[$row['id']]) || $row['mode'] !== 'real' || $row['user_id'] !== $uid) continue;
    $byId[$row['id']] = $row;
  }
  $list = array_values($byId);
  usort($list, static fn($a, $b) => strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? '')));
  return $memo[$uid] = $list;
}

function admin_is_uuid_str(string $id): bool {
  return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
}

function admin_match_q(array $row, string $q): bool {
  $q = strtolower(trim($q));
  if ($q === '') return true;
  $blob = strtolower(implode(' ', [
    (string) ($row['id'] ?? ''),
    (string) ($row['userId'] ?? $row['user_id'] ?? ''),
    (string) ($row['email'] ?? ''),
    (string) ($row['phone'] ?? ''),
    (string) ($row['name'] ?? $row['display_name'] ?? ''),
    (string) ($row['publicId'] ?? ''),
    (string) ($row['seq'] ?? ''),
    'oro-' . (string) ($row['seq'] ?? ''),
  ]));
  return str_contains($blob, $q);
}

function admin_enrich_user_row(array $p, array $vaults): array {
  $id = (string) ($p['id'] ?? '');
  $v = $vaults[$id] ?? ['real' => 0, 'demo' => 0];
  $p['real'] = (float) ($v['real'] ?? 0);
  $p['demo'] = (float) ($v['demo'] ?? 0);
  return $p;
}

function admin_online_count(): int {
  $cut = time() - 90;
  $nProf = 0;
  foreach (admin_profiles() as $p) {
    $t = strtotime((string) ($p['lastSeen'] ?? '')) ?: 0;
    if ($t >= $cut) $nProf++;
  }
  return $nProf;
}

function admin_otp_rows(): array {
  $out = [];
  $local = admin_local_db();
  foreach (($local['pendingRegistrations'] ?? []) as $email => $row) {
    if (!is_array($row)) continue;
    $out[] = [
      'at' => (string) ($row['createdAt'] ?? $row['lastSentAt'] ?? ''),
      'email' => (string) ($row['email'] ?? $email),
      'type' => 'OTP inscription',
      'status' => 'en attente',
    ];
  }
  $log = admin_cache_file('otp_mail.log');
  if (is_file($log)) {
    $lines = @file($log, FILE_IGNORE_NEW_LINES) ?: [];
    foreach (array_slice($lines, -200) as $line) {
      $j = json_decode((string) $line, true);
      if (!is_array($j)) continue;
      $out[] = [
        'at' => (string) ($j['ts'] ?? $j['at'] ?? ''),
        'email' => (string) ($j['email'] ?? ''),
        'type' => (string) ($j['type'] ?? 'mail'),
        'status' => (string) ($j['status'] ?? ''),
      ];
    }
  }
  usort($out, static function ($a, $b) {
    return strcmp((string) ($b['at'] ?? ''), (string) ($a['at'] ?? ''));
  });
  return $out;
}

function admin_collect_alerts(): array {
  $rows = [];
  $file = admin_alerts_file();
  if (is_file($file)) {
    $j = json_decode((string) file_get_contents($file), true);
    if (is_array($j)) $rows = $j;
  }

  $ping = admin_sb_req('/rest/v1/profiles?select=id&limit=1', ['Range: 0-0']);
  if (empty($ping['ok'])) {
    admin_alert_push('Base de données', 'La base joueurs (Supabase) ne répond pas. Vérifiez la connexion internet / l’hébergeur.', 'error');
  }

  $mfile = function_exists('maketou_log_file') ? maketou_log_file() : '';
  if ($mfile !== '' && is_file($mfile)) {
    $lines = @file($mfile, FILE_IGNORE_NEW_LINES) ?: [];
    foreach (array_slice($lines, -120) as $line) {
      $j = json_decode((string) $line, true);
      if (!is_array($j)) continue;
      $ev = strtolower((string) ($j['event'] ?? ''));
      $reason = strtolower((string) ($j['reason'] ?? $j['result'] ?? $j['error'] ?? ''));
      $blob = $ev . ' ' . $reason . ' ' . strtolower((string) ($j['status'] ?? ''));
      if (str_contains($blob, 'fail') || str_contains($blob, 'error') || str_contains($blob, 'unreachable')
        || str_contains($blob, 'invalid') || str_contains($blob, 'mismatch') || str_contains($blob, 'échou')) {
        $msg = 'Un paiement n’a pas pu être confirmé automatiquement.';
        if (str_contains($blob, 'mail') || str_contains($blob, 'otp')) $msg = 'L’envoi d’un e-mail / code de vérification a échoué.';
        if (str_contains($blob, 'webhook')) $msg = 'Le retour de paiement (webhook) a été refusé ou incomplet.';
        $svc = str_contains($blob, 'mail') ? 'Mail' : (str_contains($blob, 'webhook') ? 'Webhook' : 'Paiement');
        admin_alert_push($svc, $msg . ' (' . date('H:i', strtotime((string) ($j['ts'] ?? 'now')) ?: time()) . ')', 'error');
      }
    }
  }

  if (is_file($file)) {
    $j = json_decode((string) file_get_contents($file), true);
    if (is_array($j)) $rows = $j;
  }
  $cut = time() - 7 * 86400;
  $fresh = [];
  foreach ($rows as $r) {
    $t = strtotime((string) ($r['at'] ?? ''));
    if ($t && $t >= $cut) $fresh[] = $r;
  }
  return $fresh;
}

function admin_asset_name(string $id): string {
  $map = [
    'v100' => 'VOLATILITY', 'v75' => 'PYTHON', 'stable' => 'ZUL',
    'apex' => 'ORO 888', 'horizon' => 'BAAL', 'crash' => 'AZAZEL',
    'gold' => 'OROF', 'boom' => 'VALAC', 'nexus' => 'ASMODUS', 'titan' => 'APOCALYPSE',
  ];
  return $map[$id] ?? strtoupper($id !== '' ? $id : '—');
}

function admin_bust_cache(): void {
  foreach (['profiles', 'profiles2', 'profiles3', 'profiles_mask1', 'profiles_live1', 'profiles_epoch2', 'vaults', 'withdrawals', 'deposits', 'deposits_mask1', 'deposits_live1', 'deposits_epoch2', 'orders', 'orders_mask1', 'orders_live1', 'orders_epoch2', 'orders_epoch3', 'bonus_by_user', 'suspects', 'auth_users', 'inscrits_n', 'inscrits_n3', 'inscrits_n_mask1', 'inscrits_n_live1', 'inscrits_n_epoch2', 'auth_n', 'wd_sb', 'wd_tx', 'wd_sb2', 'wd_tx2', 'wd_merged', 'wd_mask1', 'wd_live1', 'wd_epoch2', 'badges', 'badges_mask1', 'badges_live1', 'badges_epoch2', 'badges_epoch3', 'health', 'live_seen', 'board_watch', 'watch', 'service_probes'] as $k) {
    $f = admin_cache_file('admin_cache_' . $k . '.json');
    if (is_file($f)) @unlink($f);
  }
  $dir = rtrim(orolado_data_dir(), '/\\');
  foreach (glob($dir . DIRECTORY_SEPARATOR . 'admin_cache_list*.json') ?: [] as $f) {
    @unlink($f);
  }
}

function admin_is_protected_account(array $u, string $id = ''): bool {
  if ($id === 'admin_master' || (string) ($u['id'] ?? '') === 'admin_master') return true;
  if (function_exists('orolado_is_admin_user') && orolado_is_admin_user($u)) return true;
  $email = strtolower(trim((string) ($u['email'] ?? $u['originalEmail'] ?? '')));
  return $email !== '' && function_exists('orolado_is_reserved_admin_email') && orolado_is_reserved_admin_email($email);
}

/** Comptes à conserver lors du nettoyage : admin, client 50 $, Alain Nda. */
function admin_keep_player_emails(): array {
  $keep = [];
  if (function_exists('orolado_admin_emails')) {
    foreach (orolado_admin_emails() as $em) {
      $em = strtolower(trim((string) $em));
      if ($em !== '') $keep[$em] = true;
    }
  }
  foreach ([
    'xsw93108@laoia.com',
    'alainnda98@gmail.com',
    'alainda98@gmail.com',
    'alain.nda98@gmail.com',
    'alainnda98@googlemail.com',
  ] as $em) {
    $keep[$em] = true;
  }
  return $keep;
}

function admin_keep_is_row(array $p): bool {
  if (function_exists('admin_is_protected_account') && admin_is_protected_account($p, (string) ($p['id'] ?? ''))) {
    return true;
  }
  $em = strtolower(trim((string) ($p['email'] ?? $p['originalEmail'] ?? '')));
  $fixed = admin_keep_player_emails();
  if ($em !== '' && isset($fixed[$em])) return true;
  $local = preg_replace('/[^a-z0-9]+/', '', explode('@', $em)[0] ?? '');
  if (in_array($local, ['alainnda98', 'alainda98', 'alaininda98'], true)) return true;
  $pid = strtoupper(trim((string) ($p['publicId'] ?? '')));
  if ($pid === 'ORO-705711') return true;
  $name = strtolower((string) ($p['name'] ?? $p['display_name'] ?? ''));
  if ($name !== '' && preg_match('/alain/u', $name) && preg_match('/nda|inda|india/u', $name)) return true;
  return false;
}

function admin_keep_purge_marker(): string {
  $dir = function_exists('orolado_data_dir') ? orolado_data_dir() : (__DIR__ . '/data');
  return rtrim(str_replace('\\', '/', $dir), '/') . '/keep_purge_v1.done';
}

/** Nettoyage incrémental : garde admin + 50 $ + Alain Nda. Ne touche pas aux paiements. */
function admin_keep_purge_tick(): array {
  $marker = admin_keep_purge_marker();
  if (is_file($marker)) {
    $prev = json_decode((string) @file_get_contents($marker), true);
    if (is_array($prev) && empty($prev['more']) && !empty($prev['ok'])) return $prev;
  }
  @set_time_limit(20);
  @ini_set('max_execution_time', '20');
  $t0 = microtime(true);
  $keepEmails = admin_keep_player_emails();
  $keep = ['admin_master' => true];
  $db = admin_local_db();
  foreach (($db['users'] ?? []) as $id => $u) {
    if (!is_array($u)) continue;
    $id = (string) ($u['id'] ?? $id);
    $u['id'] = $id;
    if (admin_keep_is_row($u)) {
      $keep[$id] = true;
      $em = strtolower(trim((string) ($u['email'] ?? $u['originalEmail'] ?? '')));
      if ($em !== '') $keepEmails[$em] = true;
    }
  }

  $profiles = [];
  $hdrs = function_exists('supabase_admin_headers') ? supabase_admin_headers() : null;
  if ($hdrs) {
    $profiles = admin_sb_all('profiles', 'id,email,display_name', 'created_at.asc', 1000);
  }
  $foundFifty = false;
  $foundAlain = false;
  $newestOther = null;
  $newestT = 0;
  foreach ($profiles as $p) {
    $pid = (string) ($p['id'] ?? '');
    $row = [
      'id' => $pid,
      'email' => (string) ($p['email'] ?? ''),
      'name' => (string) ($p['display_name'] ?? ''),
    ];
    $em = strtolower(trim($row['email']));
    $t = strtotime((string) ($p['created_at'] ?? '')) ?: 0;
    $isAdmin = $em !== '' && function_exists('orolado_is_reserved_admin_email') && orolado_is_reserved_admin_email($em);
    $isFifty = $em === 'xsw93108@laoia.com' || str_contains($em, 'laoia.com');
    if (!$isAdmin && !$isFifty && $t > $newestT) {
      $newestT = $t;
      $newestOther = $row + ['created_at' => (string) ($p['created_at'] ?? '')];
    }
    if (!admin_keep_is_row($row)) continue;
    if ($pid !== '') $keep[$pid] = true;
    if ($em !== '') $keepEmails[$em] = true;
    if ($isFifty) $foundFifty = true;
    if (preg_match('/alainnda98|alainda98|alaininda98/', preg_replace('/[^a-z0-9]+/', '', explode('@', $em)[0] ?? ''))
      || (preg_match('/alain/u', $row['name']) && preg_match('/nda|inda/u', $row['name']))) {
      $foundAlain = true;
    }
  }
  if (!$foundAlain && is_array($newestOther) && $newestT > time() - 14 * 86400) {
    $nid = (string) ($newestOther['id'] ?? '');
    if ($nid !== '') $keep[$nid] = true;
    $nem = strtolower(trim((string) ($newestOther['email'] ?? '')));
    if ($nem !== '') $keepEmails[$nem] = true;
    $foundAlain = true;
  }
  if (!$foundFifty) {
    return ['ok' => false, 'reason' => 'Client 50 $ introuvable — nettoyage annulé', 'more' => false];
  }

  $keepUuid = [];
  foreach (array_keys($keep) as $id) {
    if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $id)) {
      $keepUuid[] = (string) $id;
    }
  }
  if ($keepUuid === []) {
    return ['ok' => false, 'reason' => 'Aucun UUID à conserver — nettoyage annulé', 'more' => false];
  }

  $wiped = 0;
  foreach (orolado_map_keys($db['users'] ?? []) as $id) {
    $id = (string) $id;
    if (isset($keep[$id])) continue;
    unset($db['users'][$id], $db['vault'][$id], $db['bans'][$id]);
    $wiped++;
  }
  foreach (['deposits', 'withdrawals', 'orders'] as $k) {
    if (!isset($db[$k]) || !is_array($db[$k])) continue;
    $db[$k] = array_values(array_filter($db[$k], static function ($row) use ($keep, $k) {
      if (!is_array($row)) return false;
      $id = (string) ($row['id'] ?? '');
      if ($k === 'deposits' && function_exists('admin_stat_keep_deposit_id') && admin_stat_keep_deposit_id($id)) return true;
      $uid = (string) ($row['userId'] ?? $row['user_id'] ?? '');
      return $uid !== '' && isset($keep[$uid]);
    }));
  }
  if (isset($db['sessions']) && orolado_is_map($db['sessions'])) {
    foreach (orolado_map_array($db['sessions']) as $tok => $s) {
      if (!isset($keep[(string) ($s['userId'] ?? '')])) unset($db['sessions'][$tok]);
    }
  }
  save_db(orolado_data_file(), $db);

  $sb = ['vaults' => false, 'profiles' => false, 'orders' => false, 'deposits' => false, 'withdrawals' => false, 'auth' => 0];
  $in = implode(',', $keepUuid);
  if ($hdrs) {
    admin_sb_req('/rest/v1/orders?user_id=not.in.(' . $in . ')', ['Prefer: return=minimal'], 'DELETE');
    $sb['orders'] = true;
    admin_sb_req('/rest/v1/withdrawals?user_id=not.in.(' . $in . ')', ['Prefer: return=minimal'], 'DELETE');
    $sb['withdrawals'] = true;
    admin_sb_req('/rest/v1/deposits?user_id=not.in.(' . $in . ')', ['Prefer: return=minimal'], 'DELETE');
    $sb['deposits'] = true;
    admin_sb_req('/rest/v1/transactions?user_id=not.in.(' . $in . ')', ['Prefer: return=minimal'], 'DELETE');
    admin_sb_req('/rest/v1/vaults?user_id=not.in.(' . $in . ')', ['Prefer: return=minimal'], 'DELETE');
    $sb['vaults'] = true;
    admin_sb_req('/rest/v1/profiles?id=not.in.(' . $in . ')', ['Prefer: return=minimal'], 'DELETE');
    $sb['profiles'] = true;
  }

  $remaining = 0;
  if ($hdrs && function_exists('supabase_admin_delete_auth')) {
    $auth = admin_fetch_auth_users();
    $toDelete = [];
    foreach ($auth as $a) {
      if (!is_array($a)) continue;
      $aid = (string) ($a['id'] ?? '');
      $em = strtolower(trim((string) ($a['email'] ?? '')));
      $meta = is_array($a['user_metadata'] ?? null) ? $a['user_metadata'] : [];
      $row = ['id' => $aid, 'email' => $em, 'name' => (string) ($meta['display_name'] ?? '')];
      if ($aid === '' || isset($keep[$aid])) continue;
      if (admin_keep_is_row($row)) continue;
      if ($em !== '' && isset($keepEmails[$em])) continue;
      $toDelete[] = $aid;
    }
    $remaining = count($toDelete);
    foreach ($toDelete as $aid) {
      if ((microtime(true) - $t0) > 14 || $sb['auth'] >= 10) break;
      supabase_admin_delete_auth($aid);
      $sb['auth']++;
      $remaining--;
    }
  }

  admin_bust_cache();
  $out = [
    'ok' => true,
    'kept' => count($keepUuid),
    'kept_alain' => $foundAlain,
    'wiped_json' => $wiped,
    'supabase' => $sb,
    'remaining' => $remaining,
    'more' => $remaining > 0,
    'at' => date('c'),
  ];
  @file_put_contents($marker, json_encode($out, JSON_UNESCAPED_UNICODE));
  return $out;
}

function admin_board_ack_file(): string {
  $dir = function_exists('orolado_data_dir') ? orolado_data_dir() : (__DIR__ . '/data');
  return rtrim(str_replace('\\', '/', $dir), '/') . '/admin_board_ack.json';
}

function admin_board_fp(array $issue): string {
  return md5((string) ($issue['id'] ?? '') . '|' . (string) ($issue['message'] ?? ''));
}

function admin_board_issues_raw(): array {
  $cached = admin_cache_get('board_watch', 15);
  if (is_array($cached) && isset($cached['issues'])) return $cached['issues'];
  $issues = [];
  $push = static function (array &$issues, array $ids, string $label, string $msg): void {
    foreach ($ids as $id) {
      $issues[] = ['id' => $id, 'label' => $label, 'message' => $msg];
    }
  };
  $prof = admin_sb_req('/rest/v1/profiles?select=id&limit=1');
  if (empty($prof['ok'])) {
    $push($issues, ['signup_today', 'signup_yesterday', 'signup_date', 'signup_hour', 'signup_geo', 'signup_idrange', 'no_deposit', 'signup_closed', 'traffic'], 'Inscriptions', 'N’arrive plus à suivre les inscrits');
  }
  $dep = admin_sb_req('/rest/v1/deposits?select=id&limit=1');
  if (empty($dep['ok'])) {
    $push($issues, ['dep_today', 'dep_pending', 'dep_failed', 'dep_top', 'dep_all', 'dep_method'], 'Dépôts', 'N’arrive plus à suivre les dépôts');
  }
  $wd = admin_sb_req('/rest/v1/withdrawals?select=id&limit=1');
  if (empty($wd['ok'])) {
    $push($issues, ['wd_pending', 'wd_today', 'wd_all', 'wd_rejected', 'wd_volume', 'wd_suspect'], 'Retraits', 'N’arrive plus à suivre les retraits');
  }
  $seen = admin_sb_req('/rest/v1/profiles?select=id&last_seen=not.is.null&limit=1');
  if (empty($seen['ok'])) {
    $push($issues, ['online'], 'Joueurs en ligne', 'N’arrive plus à suivre les personnes en ligne');
  }
  $vaults = admin_sb_req('/rest/v1/vaults?select=user_id&limit=1');
  if (empty($vaults['ok'])) {
    $push($issues, ['top_balances'], 'Top Balances / Soldes', 'N’arrive plus à suivre les soldes');
  }
  $orders = admin_sb_req('/rest/v1/orders?select=id&limit=1');
  if (empty($orders['ok'])) {
    $push($issues, ['open_positions', 'top_winners', 'games', 'trade_minutes', 'payout_stats'], 'Jeux', 'N’arrive plus à suivre les parties');
  }
  // Le bouton répond, mais ne reçoit plus rien alors qu'il devrait :
  // 1) des codes d'inscription partent depuis 24 h, mais aucun nouvel inscrit n'apparaît.
  if (!empty($prof['ok'])) {
    $codes = 0;
    foreach (admin_otp_rows() as $r) {
      if (($r['type'] ?? '') !== 'OTP inscription') continue;
      $t = strtotime((string) ($r['at'] ?? '')) ?: 0;
      if ($t >= time() - 86400 && ($r['status'] ?? '') !== 'échec') $codes++;
    }
    $newUsers = 0;
    foreach (admin_profiles() as $p) {
      $t = strtotime((string) ($p['createdAt'] ?? '')) ?: 0;
      if ($t >= time() - 86400) $newUsers++;
    }
    if ($codes >= 5 && $newUsers === 0) {
      $push($issues, ['signup_today'], 'Inscriptions du Jour', 'N’enregistre plus les inscrits (' . $codes . ' codes envoyés en 24 h, aucun nouveau compte)');
    }
  }
  // 2) des trades réels ont lieu en ce moment, mais personne n'apparaît « en ligne ».
  $recentTrades = 0;
  foreach (admin_orders() as $o) {
    $t = strtotime((string) ($o['created_at'] ?? '')) ?: 0;
    if ($t >= time() - 300) $recentTrades++;
  }
  if ($recentTrades >= 3 && admin_online_count() === 0) {
    $push($issues, ['online'], 'Joueurs en Ligne', 'Ne reçoit plus le direct (' . $recentTrades . ' trades ces 5 dernières minutes, 0 joueur en ligne affiché)');
  }
  admin_cache_set('board_watch', ['issues' => $issues]);
  return $issues;
}

function admin_board_watch(): array {
  $raw = admin_board_issues_raw();
  $ack = [];
  $f = admin_board_ack_file();
  if (is_file($f)) {
    $j = json_decode((string) @file_get_contents($f), true);
    if (is_array($j) && isset($j['fps']) && is_array($j['fps'])) $ack = $j['fps'];
  }
  $open = [];
  foreach ($raw as $issue) {
    $fp = admin_board_fp($issue);
    if (isset($ack[$fp])) continue;
    $issue['fp'] = $fp;
    $open[] = $issue;
  }
  return [
    'ok' => $open === [],
    'n' => count($open),
    'issues' => $open,
  ];
}

function admin_ack_fp_ok(string $fp): string {
  $fp = strtolower(preg_replace('/[^a-f0-9]/', '', $fp));
  return strlen($fp) === 32 ? $fp : '';
}

function admin_board_ack(string $fp = ''): array {
  $fp = admin_ack_fp_ok($fp);
  if ($fp === '') return ['ok' => false, 'reason' => 'Ligne manquante'];
  if (function_exists('admin_bust_cache')) admin_bust_cache();
  $cf = function_exists('admin_cache_file') ? admin_cache_file('admin_cache_board_watch.json') : '';
  if ($cf !== '' && is_file($cf)) @unlink($cf);
  $map = [];
  $f = admin_board_ack_file();
  if (is_file($f)) {
    $j = json_decode((string) @file_get_contents($f), true);
    if (is_array($j) && isset($j['fps']) && is_array($j['fps'])) $map = $j['fps'];
  }
  $map[$fp] = true;
  @file_put_contents($f, json_encode(['at' => date('c'), 'fps' => $map], JSON_UNESCAPED_UNICODE));
  $w = admin_board_watch();
  return [
    'ok' => true,
    'n' => (int) ($w['n'] ?? 0),
    'issues' => $w['issues'] ?? [],
    'repaired' => ($w['issues'] ?? []) === [],
  ];
}

function admin_health_ack_file(): string {
  $dir = function_exists('orolado_data_dir') ? orolado_data_dir() : (__DIR__ . '/data');
  return rtrim(str_replace('\\', '/', $dir), '/') . '/admin_health_ack.json';
}

function admin_health_fp(array $r): string {
  return md5((string) ($r['service'] ?? '') . '|' . (string) ($r['message'] ?? '') . '|' . (string) ($r['level'] ?? ''));
}

function admin_health_ack_map(): array {
  $f = admin_health_ack_file();
  if (!is_file($f)) return [];
  $j = json_decode((string) @file_get_contents($f), true);
  return (is_array($j) && isset($j['fps']) && is_array($j['fps'])) ? $j['fps'] : [];
}

function admin_health_ack(string $fp = ''): array {
  $fp = admin_ack_fp_ok($fp);
  if ($fp === '') return ['ok' => false, 'reason' => 'Ligne manquante'];
  if (function_exists('admin_bust_cache')) admin_bust_cache();
  $cf = function_exists('admin_cache_file') ? admin_cache_file('admin_cache_health.json') : '';
  if ($cf !== '' && is_file($cf)) @unlink($cf);
  $map = admin_health_ack_map();
  $map[$fp] = true;
  @file_put_contents(admin_health_ack_file(), json_encode(['at' => date('c'), 'fps' => $map], JSON_UNESCAPED_UNICODE));
  return ['ok' => true];
}

function admin_health_summary(): array {
  $rows = admin_health_rows();
  $issues = [];
  $level = 'ok';
  foreach ($rows as $r) {
    $lvl = (string) ($r['level'] ?? 'ok');
    if ($lvl === 'ok') continue;
    $issues[] = trim((string) ($r['service'] ?? 'Service') . ' — ' . (string) ($r['message'] ?? ''));
    if ($lvl === 'error') $level = 'error';
    else if ($level !== 'error') $level = 'warn';
  }
  return [
    'ok' => $level === 'ok',
    'level' => $level,
    'issues' => $issues,
  ];
}

function admin_wipe_except_admin(): array {
  @set_time_limit(25);
  @ini_set('max_execution_time', '25');
  if (function_exists('ignore_user_abort')) @ignore_user_abort(true);
  $t0 = microtime(true);

  $db = admin_local_db();
  $keep = ['admin_master' => true];
  $keepEmails = [];
  if (function_exists('orolado_admin_emails')) {
    foreach (orolado_admin_emails() as $em) {
      $em = strtolower(trim((string) $em));
      if ($em !== '') $keepEmails[$em] = true;
    }
  }
  foreach (($db['users'] ?? []) as $id => $u) {
    if (!is_array($u)) continue;
    $id = (string) ($u['id'] ?? $id);
    if (admin_is_protected_account($u, $id)) {
      $keep[$id] = true;
      $em = strtolower(trim((string) ($u['email'] ?? $u['originalEmail'] ?? '')));
      if ($em !== '') $keepEmails[$em] = true;
    }
  }
  if ($keepEmails === []) {
    return ['ok' => false, 'reason' => 'Compte admin introuvable — reset annulé'];
  }

  $wiped = 0;
  foreach (orolado_map_keys($db['users'] ?? []) as $id) {
    $id = (string) $id;
    if (isset($keep[$id])) continue;
    unset($db['users'][$id], $db['vault'][$id], $db['bans'][$id]);
    $wiped++;
  }
  $db['deposits'] = [];
  $db['withdrawals'] = [];
  $db['orders'] = [];
  $db['support_messages'] = [];
  $db['pendingRegistrations'] = [];
  $db['blocked_identities'] = [];
  if (isset($db['sessions']) && orolado_is_map($db['sessions'])) {
    foreach (orolado_map_array($db['sessions']) as $tok => $s) {
      if (!isset($keep[(string) ($s['userId'] ?? '')])) unset($db['sessions'][$tok]);
    }
  }
  save_db(orolado_data_file(), $db);

  $kickDir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'kicks';
  foreach (glob($kickDir . DIRECTORY_SEPARATOR . '*.kick') ?: [] as $f) {
    $kid = basename((string) $f, '.kick');
    if (!isset($keep[$kid])) @unlink($f);
  }
  $otpLog = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'otp_mail.log';
  if (is_file($otpLog)) @file_put_contents($otpLog, '');

  $hdrs = supabase_admin_headers();
  $sb = ['deposits' => false, 'withdrawals' => false, 'orders' => false, 'profiles' => 0, 'auth' => 0];
  $remaining = 0;
  if ($hdrs) {
    admin_sb_req('/rest/v1/deposits?created_at=gte.1970-01-01', ['Prefer: return=minimal'], 'DELETE');
    admin_sb_req('/rest/v1/withdrawals?created_at=gte.1970-01-01', ['Prefer: return=minimal'], 'DELETE');
    admin_sb_req('/rest/v1/orders?created_at=gte.1970-01-01', ['Prefer: return=minimal'], 'DELETE');
    $sb['deposits'] = true;
    $sb['withdrawals'] = true;
    $sb['orders'] = true;

    $profiles = admin_sb_all('profiles', 'id,email', 'created_at.asc', 1000);
    foreach ($profiles as $p) {
      $pid = (string) ($p['id'] ?? '');
      $em = strtolower(trim((string) ($p['email'] ?? '')));
      if ($pid !== '' && $em !== '' && isset($keepEmails[$em])) $keep[$pid] = true;
    }

    $keepUuid = [];
    foreach (array_keys($keep) as $id) {
      if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $id)) {
        $keepUuid[] = (string) $id;
      }
    }
    if ($keepUuid) {
      $in = implode(',', $keepUuid);
      admin_sb_req('/rest/v1/vaults?user_id=not.in.(' . $in . ')', ['Prefer: return=minimal'], 'DELETE');
      $pr = admin_sb_req('/rest/v1/profiles?id=not.in.(' . $in . ')', ['Prefer: return=minimal'], 'DELETE');
      $sb['profiles'] = (int) ($pr['count'] ?? 0);
    } else {
      foreach ($profiles as $p) {
        $pid = (string) ($p['id'] ?? '');
        $em = strtolower(trim((string) ($p['email'] ?? '')));
        if ($pid === '' || isset($keep[$pid])) continue;
        if ($em !== '' && isset($keepEmails[$em])) continue;
        admin_sb_req('/rest/v1/vaults?user_id=eq.' . rawurlencode($pid), ['Prefer: return=minimal'], 'DELETE');
        admin_sb_req('/rest/v1/profiles?id=eq.' . rawurlencode($pid), ['Prefer: return=minimal'], 'DELETE');
        $sb['profiles']++;
        if ((microtime(true) - $t0) > 12) break;
      }
    }

    $auth = admin_fetch_auth_users();
    $toDelete = [];
    foreach ($auth as $a) {
      $aid = (string) ($a['id'] ?? '');
      $em = strtolower(trim((string) ($a['email'] ?? '')));
      if ($aid === '' || isset($keep[$aid])) continue;
      if ($em !== '' && isset($keepEmails[$em])) continue;
      $toDelete[] = $aid;
    }
    $remaining = count($toDelete);
    foreach ($toDelete as $aid) {
      if ((microtime(true) - $t0) > 16 || $sb['auth'] >= 12) break;
      supabase_admin_delete_auth($aid);
      $sb['auth']++;
      $remaining--;
    }
  }
  admin_bust_cache();
  return [
    'ok' => true,
    'kept' => count($keep),
    'wiped' => $wiped,
    'supabase' => $sb,
    'remaining' => $remaining,
    'more' => $remaining > 0,
  ];
}

function admin_kill_user_sessions(array &$db, string $uid): int {
  $n = 0;
  if ($uid === '' || !isset($db['sessions']) || !orolado_is_map($db['sessions'])) return 0;
  foreach (orolado_sessions_of_user($db, $uid) as $tok => $s) {
    if ((string) ($s['userId'] ?? '') === $uid) {
      unset($db['sessions'][$tok]);
      $n++;
    }
  }
  return $n;
}

function admin_order_expiry_ts(array $o): int {
  $ex = $o['expiryAt'] ?? $o['expiry_at'] ?? $o['expiresAt'] ?? '';
  if (is_numeric($ex) && (float) $ex > 1000000000) {
    $n = (float) $ex;
    return (int) ($n > 20000000000 ? ($n / 1000) : $n);
  }
  if (is_string($ex) && $ex !== '') {
    $t = strtotime($ex);
    if ($t) return $t;
  }
  $created = strtotime((string) ($o['created_at'] ?? $o['at'] ?? '')) ?: 0;
  $dur = (int) ($o['duration'] ?? 0);
  if ($created > 0 && $dur > 0) return $created + $dur;
  return 0;
}

function admin_order_is_live_real(array $o): bool {
  if ((string) ($o['mode'] ?? '') !== 'real') return false;
  $st = strtolower((string) ($o['status'] ?? ''));
  if (in_array($st, ['won', 'lost', 'void', 'closed', 'settled'], true)) return false;
  $exp = admin_order_expiry_ts($o);
  if ($exp > 0) return $exp > time() - 2;
  return $st === 'open' || $st === '';
}

/** Bots / scripts / cash-out sans jeu réel — pas les joueurs normaux. */
function admin_suspect_reason(array $p, array $realOrders, ?array $wd = null, array $ctx = []): string {
  $role = strtolower((string) ($p['role'] ?? ''));
  if (in_array($role, ['suspended', 'banned'], true)) return 'Compte déjà suspendu';
  if ($wd && (!empty($wd['suspect']) || strtolower((string) ($wd['status'] ?? '')) === 'review')) {
    return 'Retrait signalé';
  }
  $paid = (float) ($p['depositTotal'] ?? 0);
  $bonus = (float) ($p['bonusTotal'] ?? 0);
  if ($wd && $paid <= 0) {
    return $bonus > 0 ? 'Retrait sans dépôt payé (bonus seulement)' : 'Retrait sans aucun dépôt payé';
  }
  if ($wd && (float) ($ctx['excess'] ?? 0) >= 1) {
    return 'Solde plus élevé que dépôts + bonus + gains (+' . admin_money($ctx['excess']) . ')';
  }
  if ($wd && !empty($ctx['sameDest'])) {
    return 'Même destination de retrait que ' . implode(', ', array_slice((array) $ctx['sameDest'], 0, 3));
  }
  if ($wd && (float) ($ctx['bigWin'] ?? 0) >= 200) {
    return 'Gros gain récent (+' . admin_money($ctx['bigWin']) . ') puis retrait';
  }
  if (!empty($ctx['sameIp']) && ($wd || $bonus > 0)) {
    return 'Même IP que ' . implode(', ', array_slice((array) $ctx['sameIp'], 0, 3));
  }
  $trades = (int) ($p['realTrades'] ?? 0);
  $wagered = (float) ($p['realStakeVolume'] ?? 0);
  if ($wagered <= 0) {
    foreach ($realOrders as $o) $wagered += (float) ($o['stake'] ?? 0);
  }
  $n = count($realOrders);
  if ($trades <= 0) $trades = $n;
  $amt = $wd ? (float) ($wd['amount'] ?? 0) : 0.0;
  if ($wd && $trades <= 0 && $amt >= 5) return 'Retrait sans aucun trade réel';
  if ($wd && $amt >= 50 && $wagered + 0.01 < $amt && $trades < 4) return 'Retrait supérieur aux mises';
  $created = strtotime((string) ($p['createdAt'] ?? '')) ?: 0;
  if ($wd && $created > 0 && (time() - $created) < 180 && $amt >= 5) return 'Retrait dans les 3 min après inscription';
  $dep = (float) ($p['depositTotal'] ?? 0);
  if ($dep >= 50 && $trades <= 1 && $wd && $amt >= 20) return 'Gros dépôt puis cash-out immédiat';
  if ($dep >= 80 && $trades <= 0) return 'Gros dépôt sans aucun jeu';
  if ($dep >= 20 && $trades <= 0 && $created > 0 && (time() - $created) > 86400) return 'Dépôt ancien jamais joué';
  if ($n >= 8) {
    $times = [];
    foreach ($realOrders as $o) {
      $t = strtotime((string) ($o['created_at'] ?? ''));
      if ($t) $times[] = $t;
    }
    sort($times);
    for ($i = 0; $i + 7 < count($times); $i++) {
      if ($times[$i + 7] - $times[$i] <= 12) return '8 paris en moins de 12 s';
    }
  }
  if ($n >= 12) {
    $stakes = [];
    foreach ($realOrders as $o) {
      $k = (string) round((float) ($o['stake'] ?? 0), 2);
      $stakes[$k] = ($stakes[$k] ?? 0) + 1;
    }
    foreach ($stakes as $c) {
      if ($c >= 12) return '12+ mises identiques (script)';
    }
  }
  $sides = ['call' => 0, 'put' => 0];
  foreach ($realOrders as $o) {
    $side = strtolower((string) ($o['side'] ?? ''));
    if (isset($sides[$side])) $sides[$side]++;
  }
  if ($n >= 15 && max($sides) / max(1, $n) >= 0.95) return 'Toujours le même sens (CALL/PUT)';
  return '';
}

function admin_is_suspect(array $p, array $realOrders, ?array $wd = null, array $ctx = []): bool {
  return admin_suspect_reason($p, $realOrders, $wd, $ctx) !== '';
}

function admin_norm_dest(string $d): string {
  $d = strtolower(trim($d));
  if ($d === '' || $d === '—') return '';
  // Téléphone : chiffres seuls (8 derniers) ; adresse crypto / e-mail : tel quel.
  if (preg_match('/^[+\d\s().-]{8,}$/', $d)) {
    $dig = preg_replace('/\D/', '', $d) ?? '';
    return strlen($dig) >= 8 ? 'tel:' . substr($dig, -8) : '';
  }
  return 'd:' . $d;
}

/**
 * Liste des comptes suspects (même calcul pour le compteur et pour la liste).
 * Retour : [uid => ['reason', 'openAmt', 'trades']]
 */
function admin_suspects(): array {
  $cached = admin_cache_get('suspects', 20);
  if (is_array($cached)) return $cached;
  $people = admin_profiles();
  $pmap = [];
  foreach ($people as $p) $pmap[(string) ($p['id'] ?? '')] = $p;
  $vaults = admin_vaults();
  $wds = admin_withdrawals();
  $orders = admin_orders();
  $ordersBy = [];
  foreach ($orders as $o) {
    $uid = (string) ($o['user_id'] ?? '');
    if ($uid !== '') $ordersBy[$uid][] = $o;
  }
  $openBy = [];
  $wdPaidBy = [];
  $destBy = [];
  foreach ($wds as $w) {
    $uid = (string) ($w['userId'] ?? '');
    if ($uid === '' || admin_wd_is_silenced($w)) continue;
    if (admin_wd_is_open($w)) $openBy[$uid][] = $w;
    if (admin_wd_is_paid($w)) $wdPaidBy[$uid] = ($wdPaidBy[$uid] ?? 0.0) + (float) ($w['amount'] ?? 0);
    if (admin_wd_is_rejected($w)) continue;
    $key = admin_norm_dest(admin_fill((string) ($w['phone'] ?? ''), (string) ($w['destination'] ?? '')));
    if ($key !== '') $destBy[$key][$uid] = true;
  }
  $ipBy = [];
  foreach ($people as $p) {
    $ip = trim((string) ($p['ip'] ?? ''));
    if ($ip !== '' && $ip !== '—') $ipBy[$ip][(string) $p['id']] = true;
  }
  $pidOf = static fn(string $uid): string => (string) (($pmap[$uid]['publicId'] ?? '') ?: $uid);
  $dayAgo = time() - 86400;
  $out = [];
  foreach ($pmap as $uid => $p) {
    if ($uid === '') continue;
    $open = $openBy[$uid] ?? [];
    $ctx = [];
    if ($open) {
      $mine = [];
      foreach ($open as $w) {
        $k = admin_norm_dest(admin_fill((string) ($w['phone'] ?? ''), (string) ($w['destination'] ?? '')));
        if ($k === '') continue;
        foreach (array_keys($destBy[$k] ?? []) as $other) if ($other !== $uid) $mine[$other] = $pidOf($other);
      }
      if ($mine) $ctx['sameDest'] = array_values($mine);
      $big = 0.0;
      foreach ($ordersBy[$uid] ?? [] as $o) {
        $t = strtotime((string) ($o['created_at'] ?? '')) ?: 0;
        if ($t >= $dayAgo) $big = max($big, (float) ($o['net'] ?? 0));
      }
      if ($big > 0) $ctx['bigWin'] = $big;
      // Contrôle de cohérence (seulement pour les retraits en attente : 1 requête par joueur).
      $net = 0.0;
      foreach (admin_orders_for_user($uid) as $o) $net += (float) ($o['net'] ?? 0);
      $openAmt = 0.0;
      foreach ($open as $w) $openAmt += (float) ($w['amount'] ?? 0);
      $expected = (float) ($p['depositTotal'] ?? 0) + (float) ($p['bonusTotal'] ?? 0) + $net - ($wdPaidBy[$uid] ?? 0) - $openAmt;
      $real = (float) ($vaults[$uid]['real'] ?? 0);
      if ($real > $expected + 1) $ctx['excess'] = round($real - $expected, 2);
    }
    $ip = trim((string) ($p['ip'] ?? ''));
    // 2 à 4 comptes sur la même IP = probable multi-comptes. Au-delà, c'est en général
    // l'IP partagée d'un opérateur mobile (des centaines de clients) : on ignore.
    $nIp = count($ipBy[$ip] ?? []);
    if ($ip !== '' && $nIp > 1 && $nIp <= 4) {
      $others = [];
      foreach (array_keys($ipBy[$ip]) as $other) if ($other !== $uid) $others[] = $pidOf($other);
      $ctx['sameIp'] = $others;
    }
    $reason = admin_suspect_reason($p, $ordersBy[$uid] ?? [], $open[0] ?? null, $ctx);
    if ($reason === '') {
      foreach (array_slice($open, 1) as $w) {
        $reason = admin_suspect_reason($p, $ordersBy[$uid] ?? [], $w, $ctx);
        if ($reason !== '') break;
      }
    }
    if ($reason === '') continue;
    $openAmt = 0.0;
    foreach ($open as $w) $openAmt += (float) ($w['amount'] ?? 0);
    $out[$uid] = ['reason' => $reason, 'openAmt' => round($openAmt, 2), 'trades' => count($ordersBy[$uid] ?? [])];
  }
  admin_cache_set('suspects', $out);
  return $out;
}

function admin_profit_between(array $deps, array $wds, string $from, string $to): float {
  $in = 0.0;
  $out = 0.0;
  foreach ($deps as $d) {
    if (!admin_dep_is_paid($d)) continue;
    if (!admin_in_range((string) ($d['createdAt'] ?? ''), $from, $to)) continue;
    $in += (float) ($d['amount'] ?? 0);
  }
  foreach ($wds as $w) {
    if (!admin_wd_is_paid($w) || admin_wd_is_silenced($w)) continue;
    if (!admin_in_range((string) ($w['createdAt'] ?? ''), $from, $to)) continue;
    $out += (float) ($w['amount'] ?? 0);
  }
  return $in - $out;
}

function admin_health_probe(string $label, string $path, string $method = 'GET', ?string $body = null): array {
  $t0 = microtime(true);
  $res = admin_sb_req($path, ['Range: 0-0'], $method, $body);
  $ms = (int) round((microtime(true) - $t0) * 1000);
  $ok = !empty($res['ok']);
  return [
    'at' => date('c'),
    'service' => $label,
    'message' => $ok
      ? ('OK · HTTP ' . (int) ($res['code'] ?? 0) . ' · ' . $ms . ' ms')
      : ('Panne · HTTP ' . (int) ($res['code'] ?? 0) . ' · ' . $ms . ' ms'),
    'level' => $ok ? ($ms > 2500 ? 'warn' : 'ok') : 'error',
  ];
}

function admin_health_rows(): array {
  $cached = admin_cache_get('health', 20);
  if (is_array($cached) && isset($cached['rows'])) return $cached['rows'];
  $rows = [];
  $now = date('c');
  $file = orolado_data_file();
  $jsonOk = is_file($file) && is_readable($file);
  $jsonW = $jsonOk && is_writable($file);
  $sz = $jsonOk ? (int) @filesize($file) : 0;
  $rows[] = [
    'at' => $now,
    'service' => 'Coffre JSON',
    'message' => $jsonOk
      ? ('Lecture ' . ($jsonW ? '+ écriture' : 'seule') . ' · ' . number_format($sz / 1024, 1, '.', ' ') . ' Ko · ' . $file)
      : 'Fichier joueurs introuvable ou illisible',
    'level' => $jsonOk ? ($jsonW ? 'ok' : 'warn') : 'error',
  ];
  $rows[] = admin_health_probe('Base · profiles', '/rest/v1/profiles?select=id&limit=1');
  $rows[] = admin_health_probe('Base · vaults', '/rest/v1/vaults?select=user_id&limit=1');
  $rows[] = admin_health_probe('Base · deposits', '/rest/v1/deposits?select=id&limit=1');
  $rows[] = admin_health_probe('Base · withdrawals', '/rest/v1/withdrawals?select=id&limit=1');
  $rows[] = admin_health_probe('Base · orders', '/rest/v1/orders?select=id&limit=1');
  $auth = admin_sb_req('/auth/v1/admin/users?page=1&per_page=1', []);
  $rows[] = [
    'at' => $now,
    'service' => 'Auth joueurs',
    'message' => !empty($auth['ok']) ? ('OK · HTTP ' . (int) ($auth['code'] ?? 0)) : 'API Auth injoignable',
    'level' => !empty($auth['ok']) ? 'ok' : 'error',
  ];
  $rows[] = [
    'at' => $now,
    'service' => 'PHP',
    'message' => 'v' . PHP_VERSION . ' · ' . PHP_OS . ' · mémoire ' . ini_get('memory_limit') . ' · max ' . ini_get('max_execution_time') . 's',
    'level' => version_compare(PHP_VERSION, '8.0.0', '>=') ? 'ok' : 'warn',
  ];
  if (function_exists('disk_free_space')) {
    $free = @disk_free_space(__DIR__);
    if (is_float($free) || is_int($free)) {
      $gb = $free / 1073741824;
      $rows[] = [
        'at' => $now,
        'service' => 'Disque serveur',
        'message' => number_format($gb, 2, '.', ' ') . ' Go libres',
        'level' => $gb < 0.5 ? 'error' : ($gb < 2 ? 'warn' : 'ok'),
      ];
    }
  }
  $scripts = [
    'api.php', 'admin.php', 'admin_lib.php', 'orolado_lib.php',
    'js/app.js', 'js/store.js', 'js/auth.js', 'js/engine.js', 'js/supabase.js', 'index.html',
  ];
  $miss = [];
  foreach ($scripts as $s) {
    if (!is_file(__DIR__ . '/' . $s)) $miss[] = $s;
  }
  $rows[] = [
    'at' => $now,
    'service' => 'Scripts critiques',
    'message' => $miss === []
      ? (count($scripts) . '/' . count($scripts) . ' fichiers présents')
      : ('Manque : ' . implode(', ', $miss)),
    'level' => $miss === [] ? 'ok' : 'error',
  ];
  $db = admin_local_db();
  // Estimation rapide (échantillon de sous-dossiers) : compter 100 000 fiches à chaque
  // rafraîchissement de l'admin serait trop lent.
  $sessN = orolado_store_estimate_count($db, 'sessions');
  $userN = orolado_store_estimate_count($db, 'users');
  $rows[] = [
    'at' => $now,
    'service' => 'Sessions locales',
    'message' => '≈ ' . $sessN . ' connexion(s) · ≈ ' . $userN . ' compte(s) (fiches)',
    'level' => 'ok',
  ];
  $svc = function_exists('supabase_service_key') ? supabase_service_key() : '';
  $rows[] = [
    'at' => $now,
    'service' => 'Clé service',
    'message' => $svc !== '' ? 'Service role présente' : 'SUPABASE_SERVICE_ROLE_KEY absente',
    'level' => $svc !== '' ? 'ok' : 'error',
  ];
  $dataDir = orolado_data_dir();
  $kickDir = rtrim(str_replace('\\', '/', $dataDir), '/') . '/kicks';
  $rows[] = [
    'at' => $now,
    'service' => 'Dossier data',
    'message' => (is_dir($dataDir) && is_writable($dataDir))
      ? ('OK · ' . $dataDir)
      : 'Dossier data absent ou non inscriptible',
    'level' => (is_dir($dataDir) && is_writable($dataDir)) ? 'ok' : 'error',
  ];
  $rows[] = [
    'at' => $now,
    'service' => 'Expulsions live',
    'message' => is_dir($kickDir) || @mkdir($kickDir, 0775, true)
      ? 'Dossier kicks opérationnel'
      : 'Impossible d’écrire les expulsions',
    'level' => (is_dir($kickDir) && is_writable($kickDir)) ? 'ok' : 'warn',
  ];
  $apiOk = is_file(__DIR__ . '/api.php') && is_readable(__DIR__ . '/api.php');
  $rows[] = [
    'at' => $now,
    'service' => 'API joueurs',
    'message' => $apiOk ? 'api.php présent et lisible' : 'api.php introuvable',
    'level' => $apiOk ? 'ok' : 'error',
  ];
  foreach (admin_health_live_checks() as $r) {
    if (empty($r['watch'])) $rows[] = $r;
  }
  foreach (admin_service_probes() as $r) {
    $rows[] = $r;
  }
  // « Santé du Site » = seulement ce qui est en PANNE (les points à surveiller ont leur bouton).
  foreach (admin_collect_alerts() as $a) {
    if (($a['level'] ?? '') === 'error') $rows[] = $a;
  }
  // Problèmes d'abord (pannes, puis attentions), les lignes OK ensuite.
  $rank = ['error' => 0, 'warn' => 1];
  usort($rows, static function ($a, $b) use ($rank) {
    $ra = $rank[$a['level'] ?? 'ok'] ?? 2;
    $rb = $rank[$b['level'] ?? 'ok'] ?? 2;
    return $ra <=> $rb ?: strcmp((string) ($b['at'] ?? ''), (string) ($a['at'] ?? ''));
  });
  admin_cache_set('health', ['rows' => $rows]);
  return $rows;
}

/**
 * Contrôles « en direct » : ce qui casse vraiment un site de trading (avant, la santé ne
 * vérifiait que la présence des fichiers, donc elle était toujours au vert).
 */
function admin_health_live_checks(): array {
  $now = date('c');
  $rows = [];
  // $watch = true : ce n'est pas une panne → bouton « À surveiller », pas « Santé du Site ».
  $row = static function (string $svc, string $msg, string $lvl, bool $watch = false) use ($now): array {
    return ['at' => $now, 'service' => $svc, 'message' => $msg, 'level' => $lvl, 'watch' => $watch];
  };

  // 0. Secrets encore écrits dans le code (à mettre dans les réglages de l'hébergeur).
  if (function_exists('orolado_admin_password_from_env') && !orolado_admin_password_from_env()) {
    $rows[] = $row('Sécurité', 'Le mot de passe admin est encore celui écrit dans le code. Mettez le vôtre dans les réglages de l’hébergeur (ADMIN_PASSWORD).', 'warn', true);
  }
  if (function_exists('orolado_oxapay_key_from_env') && !orolado_oxapay_key_from_env()) {
    $rows[] = $row('Sécurité', 'La clé OxaPay est encore celle écrite dans le code. Créez une nouvelle clé chez OxaPay et mettez-la dans les réglages de l’hébergeur (OXAPAY_MERCHANT_KEY).', 'warn', true);
  }

  // 1. Flux de prix : figé alors que des joueurs sont en ligne = graphiques bloqués.
  $online = admin_online_count();
  $live = __DIR__ . '/feedcache/live.json';
  $age = is_file($live) ? time() - (int) @filemtime($live) : -1;
  if ($online > 0 && ($age < 0 || $age > 30)) {
    $rows[] = $row('Flux de prix', 'Le flux de prix ne se met plus à jour (' . ($age < 0 ? 'fichier absent' : $age . ' s') . ') alors que ' . $online . ' joueur(s) sont en ligne : les graphiques sont figés.', 'error');
  } else {
    $rows[] = $row('Flux de prix', $online > 0 ? ('En direct · mis à jour il y a ' . max(0, $age) . ' s') : 'En veille (aucun joueur en ligne)', 'ok');
  }

  // 2. Trades réels expirés mais pas réglés (argent du joueur bloqué).
  $stuck = 0;
  $stuckSum = 0.0;
  foreach ((admin_local_db()['orders'] ?? []) as $o) {
    if (!is_array($o) || ($o['mode'] ?? '') !== 'real' || ($o['status'] ?? '') !== 'open') continue;
    $exp = (float) ($o['expiryAt'] ?? 0);
    if ($exp > 0 && $exp < time() - 120) { $stuck++; $stuckSum += (float) ($o['stake'] ?? 0); }
  }
  if ($stuck >= 5) {
    $rows[] = $row('Trades', $stuck . ' trades réels terminés ne sont pas réglés (' . admin_money($stuckSum) . ' misés) : la base ne répond plus correctement.', 'error');
  } else {
    $rows[] = $row('Trades', 'Les trades réels se règlent normalement', 'ok');
    if ($stuck > 0) $rows[] = $row('Trades en retard', $stuck . ' trade(s) réel(s) terminé(s) depuis plus de 2 min, pas encore réglé(s) (' . admin_money($stuckSum) . ' misés). Ils se règlent au retour du joueur.', 'warn', true);
  }

  // 3. Retraits qui attendent depuis plus de 24 h.
  $old = 0;
  foreach (admin_withdrawals() as $w) {
    if (!admin_wd_is_open($w)) continue;
    $t = strtotime((string) ($w['createdAt'] ?? '')) ?: 0;
    if ($t > 0 && $t < time() - 86400) $old++;
  }
  $rows[] = $old > 0
    ? $row('Retraits', $old . ' retrait(s) en attente depuis plus de 24 h : les joueurs attendent leur argent.', 'warn', true)
    : $row('Retraits', 'Aucun retrait en attente depuis plus de 24 h', 'ok', true);

  // 4. E-mails de codes : échecs sur 24 h (inscription et retraits bloqués).
  $sent = 0;
  $fail = 0;
  $log = admin_cache_file('otp_mail.log');
  if (is_file($log)) {
    foreach (array_slice(@file($log, FILE_IGNORE_NEW_LINES) ?: [], -400) as $line) {
      $j = json_decode((string) $line, true);
      if (!is_array($j)) continue;
      $t = strtotime((string) ($j['ts'] ?? '')) ?: 0;
      if ($t < time() - 86400) continue;
      $sent++;
      if (($j['status'] ?? '') !== 'envoyé') $fail++;
    }
  }
  if ($fail > 0) {
    $bad = $fail >= 5 || ($sent > 0 && $fail / $sent >= 0.3);
    if ($bad) {
      $rows[] = $row('E-mails', $fail . ' code(s) sur ' . $sent . ' non envoyé(s) en 24 h : les joueurs ne reçoivent plus leurs codes (inscription, retraits). Vérifiez le service d’e-mails (clé Brevo / quota).', 'error');
    } else {
      $rows[] = $row('E-mails', 'Les codes partent normalement', 'ok');
      $rows[] = $row('E-mails ratés', $fail . ' code(s) sur ' . $sent . ' non envoyé(s) en 24 h (adresse fausse ou envoi ponctuellement refusé).', 'warn', true);
    }
  } else {
    $rows[] = $row('E-mails', $sent > 0 ? ($sent . ' code(s) envoyé(s) en 24 h, aucun échec') : 'Aucun code envoyé ces dernières 24 h', 'ok');
  }

  // 5. Jeu du jour : les joueurs gagnent-ils plus que prévu ? Gros gains à regarder.
  [$t0, $t1] = admin_day_bounds('today');
  $stake = 0.0;
  $net = 0.0;
  $bigWins = [];
  foreach (admin_orders() as $o) {
    if (!admin_in_range((string) ($o['created_at'] ?? ''), $t0, $t1)) continue;
    $stake += (float) ($o['stake'] ?? 0);
    $n = (float) ($o['net'] ?? 0);
    $net += $n;
    if ($n >= 500) $bigWins[] = $n;
  }
  if ($stake >= 300) {
    $rtp = ($stake + $net) / $stake * 100;
    $rows[] = $row('Jeu du jour', 'Mises ' . admin_money($stake) . ' · rendu aux joueurs ' . number_format($rtp, 1, ',', ' ') . ' % (normal ≈ 94 %)', $rtp > 110 ? 'warn' : 'ok', true);
  }
  if ($bigWins) {
    rsort($bigWins);
    $rows[] = $row('Gros gains', count($bigWins) . ' gain(s) de plus de 500 $ aujourd’hui (le plus gros : +' . admin_money($bigWins[0]) . '). Normal avec ×50, mais regardez « Suspects à vérifier » avant de payer un retrait.', 'warn', true);
  }

  // 6. Fichier joueurs trop gros = site plus lent.
  $file = orolado_data_file();
  $mb = is_file($file) ? (int) @filesize($file) / 1048576 : 0;
  if ($mb >= 25) {
    $rows[] = $row('Coffre JSON', 'Le fichier joueurs pèse ' . number_format($mb, 1, ',', ' ') . ' Mo : le site ralentit. Prévenez le développeur.', $mb >= 60 ? 'error' : 'warn', $mb < 60);
  }
  return $rows;
}

/**
 * Les services dont le site dépend répondent-ils ? (paiements, e-mails). Une panne ici veut
 * dire : des joueurs payent ou attendent un code en ce moment et ça ne marche pas.
 * Vérifié au plus toutes les 2 minutes (appels légers, sans effet).
 */
function admin_service_probes(): array {
  $cached = admin_cache_get('service_probes', 120);
  if (is_array($cached) && isset($cached['rows'])) return $cached['rows'];
  $now = date('c');
  $call = static function (string $url, array $headers = []): int {
    if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_PROBE']) && is_callable($GLOBALS['OROLADO_FAKE_PROBE'])) {
      return (int) ($GLOBALS['OROLADO_FAKE_PROBE'])($url);
    }
    if (!function_exists('curl_init')) return -1;
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6, CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_HTTPHEADER => array_merge(['Accept: application/json'], $headers)]);
    curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $code;
  };
  $rows = [];
  $judge = static function (string $svc, int $code, bool $keyed) use ($now): array {
    if ($code >= 200 && $code < 300) return ['at' => $now, 'service' => $svc, 'message' => 'Répond normalement', 'level' => 'ok'];
    if ($keyed && ($code === 401 || $code === 403)) {
      return ['at' => $now, 'service' => $svc, 'message' => 'Clé refusée (HTTP ' . $code . ') : les paiements/envois ne passent plus. Vérifiez la clé dans les réglages de l’hébergeur.', 'level' => 'error'];
    }
    if ($code <= 0 || $code >= 500) {
      return ['at' => $now, 'service' => $svc, 'message' => 'Injoignable' . ($code > 0 ? ' (HTTP ' . $code . ')' : '') . ' : le service est en panne ou bloqué.', 'level' => 'error'];
    }
    return ['at' => $now, 'service' => $svc, 'message' => 'Répond (HTTP ' . $code . ')', 'level' => 'ok'];
  };
  if (function_exists('orolado_oxapay_key') && orolado_oxapay_key() !== '') {
    $rows[] = $judge('Paiement crypto (OxaPay)', $call('https://api.oxapay.com/v1/common/currencies'), false);
  }
  if (function_exists('orolado_flw_secret') && orolado_flw_secret() !== '') {
    $rows[] = $judge('Paiement carte (Flutterwave)', $call('https://api.flutterwave.com/v3/banks/NG', ['Authorization: Bearer ' . orolado_flw_secret()]), true);
  }
  if (function_exists('brevo_api_key') && brevo_api_key() !== '') {
    $rows[] = $judge('E-mails (Brevo)', $call('https://api.brevo.com/v3/account', ['api-key: ' . brevo_api_key()]), true);
  }
  admin_cache_set('service_probes', ['rows' => $rows]);
  return $rows;
}

/**
 * Bouton « À surveiller » : pas des pannes, mais des choses à regarder (retraits qui
 * attendent, gros gains, rendu du jour, trades en retard, e-mails ratés isolés…).
 */
function admin_watch_rows(): array {
  $cached = admin_cache_get('watch', 20);
  if (is_array($cached) && isset($cached['rows'])) return $cached['rows'];
  $rows = [];
  foreach (admin_health_live_checks() as $r) {
    if (!empty($r['watch'])) $rows[] = $r;
  }
  foreach (admin_collect_alerts() as $a) {
    if (($a['level'] ?? '') !== 'error') $rows[] = $a;
  }
  $rank = ['error' => 0, 'warn' => 1];
  usort($rows, static function ($a, $b) use ($rank) {
    $ra = $rank[$a['level'] ?? 'ok'] ?? 2;
    $rb = $rank[$b['level'] ?? 'ok'] ?? 2;
    return $ra <=> $rb ?: strcmp((string) ($b['at'] ?? ''), (string) ($a['at'] ?? ''));
  });
  admin_cache_set('watch', ['rows' => $rows]);
  return $rows;
}
