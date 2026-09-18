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
  return '$' . number_format((float) $n, 2, '.', ' ');
}

function admin_esc(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
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
  $cached = admin_cache_get('inscrits_n', 20);
  if (is_array($cached) && isset($cached['n']) && (int) $cached['n'] > 0) return (int) $cached['n'];
  $nProfiles = admin_sb_count('profiles', 'select=id');
  $nAuth = admin_auth_users_count();
  $n = max($nProfiles, $nAuth);
  admin_cache_set('inscrits_n', ['n' => $n]);
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
    $res = admin_sb_req('/rest/v1/' . $table . '?' . $qs, ['Range: ' . $from . '-' . $to, 'Prefer: count=exact']);
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
    'db' => is_array($db) ? $db : blank_db(),
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
  return is_array($p['db'] ?? null) ? $p['db'] : blank_db();
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

function admin_wd_is_open(array $w): bool {
  if (admin_wd_is_paid($w) || admin_wd_is_rejected($w)) return false;
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

function admin_dep_is_paid(array $d): bool {
  $st = strtoupper(trim((string) ($d['status'] ?? '')));
  return in_array($st, ['COMPLETED', 'PAID', 'SUCCESS', 'CONFIRMED'], true);
}

function admin_dep_is_pending(array $d): bool {
  $st = strtoupper(trim((string) ($d['status'] ?? '')));
  return in_array($st, ['PENDING', 'PROCESSING', 'WAITING', 'INITIATED', 'CREATED', 'OPEN'], true);
}

function admin_dep_is_failed(array $d): bool {
  $st = strtoupper(trim((string) ($d['status'] ?? '')));
  return in_array($st, ['FAILED', 'CANCELED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'ERROR', 'VOID'], true);
}

function admin_dep_channel(string $op): string {
  $op = strtolower(trim($op));
  if (in_array($op, ['oxapay', 'usdt', 'btc', 'eth', 'trx', 'sol', 'bnb', 'ltc', 'doge', 'crypto'], true)) return 'Crypto';
  if (in_array($op, ['flutterwave', 'flw', 'card', 'card_flw'], true)) return 'Carte';
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

function admin_profiles(): array {
  $cached = admin_cache_get('profiles2', 40);
  if (is_array($cached) && isset($cached['list'])) return $cached['list'];

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
      if ($byId[$id]['email'] === '' && $email !== '') $byId[$id]['email'] = $email;
      if ($byId[$id]['phone'] === '' && $aphone !== '') $byId[$id]['phone'] = $aphone;
      if ($byId[$id]['name'] === '') {
        $an = trim((string) ($meta['display_name'] ?? $meta['full_name'] ?? ''));
        if ($an !== '') $byId[$id]['name'] = $an;
      }
      if ($byId[$id]['ip'] === '' && $ip !== '') $byId[$id]['ip'] = $ip;
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
    if ($id === '' || $id === 'admin_master') continue;
    $pid = (string) ($u['publicId'] ?? '');
    if (isset($byId[$id])) {
      if ($pid !== '') $byId[$id]['publicId'] = $pid;
      if ($byId[$id]['traffic'] === '') $byId[$id]['traffic'] = (string) ($u['trafficSource'] ?? '');
      if ($byId[$id]['phone'] === '') $byId[$id]['phone'] = (string) ($u['phone'] ?? '');
      if ($byId[$id]['name'] === '') $byId[$id]['name'] = (string) ($u['displayName'] ?? '');
      if ($byId[$id]['lastSeen'] === '') $byId[$id]['lastSeen'] = (string) ($u['lastSeen'] ?? '');
      continue;
    }
    $byId[$id] = [
      'id' => $id,
      'email' => (string) ($u['email'] ?? ''),
      'name' => (string) ($u['displayName'] ?? ''),
      'phone' => (string) ($u['phone'] ?? ''),
      'country' => (string) ($u['countryCode'] ?? ''),
      'role' => (string) ($u['role'] ?? 'user'),
      'createdAt' => (string) ($u['createdAt'] ?? ''),
      'lastSeen' => (string) ($u['lastSeen'] ?? ''),
      'depositTotal' => (float) ($u['realDepositTotal'] ?? 0),
      'realTrades' => (int) ($u['realTrades'] ?? 0),
      'traffic' => (string) ($u['trafficSource'] ?? 'direct'),
      'ip' => '',
      'publicId' => $pid,
    ];
  }

  $list = array_values($byId);
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
  admin_cache_set('profiles2', ['list' => $list]);
  return $list;
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
    'adminHidden' => !empty($w['adminHidden']),
    'name' => admin_fill((string) ($w['name'] ?? ''), (string) ($w['beneficiary'] ?? '')),
    'email' => (string) ($w['email'] ?? ''),
  ];
}

function admin_wd_merge_into(array &$dst, array $src): void {
  foreach (['phone', 'reason', 'name', 'email', 'operator', 'createdAt', 'userId'] as $k) {
    if (admin_fill((string) ($dst[$k] ?? '')) === '' && admin_fill((string) ($src[$k] ?? '')) !== '') {
      $dst[$k] = $src[$k];
    }
  }
  if (admin_wd_is_open($src) && !admin_wd_is_open($dst)) {
    $dst['status'] = $src['status'];
  }
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

function admin_withdrawals(): array {
  $byId = [];
  $byFp = [];
  $put = static function (array $row) use (&$byId, &$byFp): void {
    $id = admin_fill((string) ($row['id'] ?? ''));
    if ($id === '') return;
    $fp = admin_wd_fingerprint($row);
    if (isset($byId[$id])) {
      admin_wd_merge_into($byId[$id], $row);
      return;
    }
    if ($fp !== '' && isset($byFp[$fp])) {
      $existId = $byFp[$fp];
      admin_wd_merge_into($byId[$existId], $row);
      $preferNew = admin_fill((string) ($byId[$existId]['phone'] ?? '')) === '' && admin_fill((string) ($row['phone'] ?? '')) !== '';
      if ($preferNew) {
        admin_wd_merge_into($row, $byId[$existId]);
        unset($byId[$existId]);
        $byId[$id] = $row;
        $byFp[$fp] = $id;
      }
      return;
    }
    $byId[$id] = $row;
    if ($fp !== '') $byFp[$fp] = $id;
  };

  foreach (admin_collect_local_wds(admin_local_db()) as $w) {
    $put($w);
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

  $list = array_values($byId);
  usort($list, static function ($a, $b) {
    return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
  });
  return $list;
}

function admin_deposits(): array {
  $cached = admin_cache_get('deposits', 20);
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
    ];
    if (!isset($byId[$id])) $byId[$id] = $row;
  }
  $list = array_values($byId);
  usort($list, static function ($a, $b) {
    return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
  });
  admin_cache_set('deposits', $list);
  return $list;
}

function admin_orders(): array {
  $cached = admin_cache_get('orders', 25);
  if (is_array($cached)) return $cached;
  $rows = admin_sb_all(
    'orders',
    'id,user_id,asset_id,side,stake,duration,mode,won,net,status,created_at',
    'created_at.desc',
    1000
  );
  $local = admin_local_db();
  $byId = [];
  foreach ($rows as $o) {
    $id = (string) ($o['id'] ?? '');
    if ($id === '') continue;
    $byId[$id] = $o;
  }
  foreach (($local['orders'] ?? []) as $o) {
    if (!is_array($o)) continue;
    $id = (string) ($o['id'] ?? '');
    if ($id === '' || isset($byId[$id])) continue;
    $byId[$id] = [
      'id' => $id,
      'user_id' => (string) ($o['userId'] ?? $o['user_id'] ?? ''),
      'asset_id' => (string) ($o['assetId'] ?? $o['asset_id'] ?? ''),
      'side' => (string) ($o['side'] ?? ''),
      'stake' => (float) ($o['stake'] ?? 0),
      'duration' => (int) ($o['duration'] ?? 0),
      'mode' => (string) ($o['mode'] ?? 'demo'),
      'won' => $o['won'] ?? null,
      'net' => (float) ($o['net'] ?? 0),
      'status' => (string) ($o['status'] ?? ''),
      'created_at' => (string) ($o['createdAt'] ?? $o['at'] ?? ''),
    ];
  }
  $list = array_values($byId);
  admin_cache_set('orders', $list);
  return $list;
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
  $res = admin_sb_req('/rest/v1/rpc/count_online', [], 'POST', json_encode(['p_seconds' => 90]));
  $raw = $res['raw'] ?? '';
  if (is_numeric(trim((string) $raw))) return (int) trim((string) $raw);
  $n = 0;
  $cut = time() - 90;
  foreach (admin_profiles() as $p) {
    $t = strtotime((string) ($p['lastSeen'] ?? ''));
    if ($t && $t >= $cut) $n++;
  }
  return $n;
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
    'v100' => 'VOLATILITY 100', 'v75' => 'VOLATILITY 75', 'stable' => 'STABLE CORE',
    'apex' => 'ORO APEX 500', 'horizon' => 'ORO HORIZON 50', 'crash' => 'CRASH 300',
    'gold' => 'ORO GOLD', 'boom' => 'BOOM SPIKE', 'nexus' => 'NEXUS PRIME', 'titan' => 'TITAN PULSE',
  ];
  return $map[$id] ?? strtoupper($id !== '' ? $id : '—');
}

function admin_bust_cache(): void {
  foreach (['profiles', 'profiles2', 'vaults', 'withdrawals', 'deposits', 'orders', 'auth_users', 'inscrits_n', 'auth_n', 'wd_sb', 'wd_tx', 'wd_sb2', 'wd_tx2'] as $k) {
    $f = admin_cache_file('admin_cache_' . $k . '.json');
    if (is_file($f)) @unlink($f);
  }
}
