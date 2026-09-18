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
  $headers = array_merge($hdrs, $extraHdr);
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
    '/rest/v1/' . $table . '?' . $q,
    ['Prefer: count=exact', 'Range: 0-0'],
    'GET'
  );
  if (!empty($res['count'])) return (int) $res['count'];
  if (!empty($res['ok'])) return count($res['rows']);
  return 0;
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

function admin_local_db(): array {
  $db = load_db(orolado_data_file());
  return is_array($db) ? $db : blank_db();
}

function admin_wd_is_open(array $w): bool {
  $st = strtolower(trim((string) ($w['status'] ?? '')));
  return in_array($st, [
    'pending', 'review', 'processing', 'requested', 'waiting', 'open',
    'unpaid', 'hold', 'en_attente', 'en cours', 'queued', 'new',
  ], true);
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
  $cached = admin_cache_get('profiles', 40);
  if (is_array($cached) && isset($cached['list'])) return $cached['list'];

  $rows = admin_sb_all(
    'profiles',
    'id,email,display_name,phone,country_code,role,created_at,last_seen,real_deposit_total,real_trades,updated_at',
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
      'phone' => (string) ($p['phone'] ?? ''),
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
      if ($byId[$id]['email'] === '' && $email !== '') $byId[$id]['email'] = $email;
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
  admin_cache_set('profiles', ['list' => $list]);
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

function admin_withdrawals(): array {
  $cached = admin_cache_get('withdrawals', 20);
  if (is_array($cached)) return $cached;
  $sb = admin_sb_all(
    'withdrawals',
    'id,user_id,amount,status,operator,phone,reference,created_at',
    'created_at.desc',
    1000
  );
  $byId = [];
  foreach ($sb as $w) {
    $id = (string) ($w['id'] ?? '');
    if ($id === '') $id = 'sb_' . md5(json_encode($w));
    $byId[$id] = [
      'id' => $id,
      'userId' => (string) ($w['user_id'] ?? ''),
      'amount' => (float) ($w['amount'] ?? 0),
      'status' => (string) ($w['status'] ?? 'pending'),
      'operator' => (string) ($w['operator'] ?? ''),
      'phone' => (string) ($w['phone'] ?? ''),
      'reference' => (string) ($w['reference'] ?? $id),
      'createdAt' => (string) ($w['created_at'] ?? ''),
      'reason' => '',
      'adminHidden' => false,
    ];
  }
  $local = admin_local_db();
  foreach (($local['withdrawals'] ?? []) as $w) {
    if (!is_array($w)) continue;
    $id = (string) ($w['id'] ?? '');
    if ($id === '') continue;
    $row = [
      'id' => $id,
      'userId' => (string) ($w['userId'] ?? $w['user_id'] ?? ''),
      'amount' => (float) ($w['amount'] ?? 0),
      'status' => (string) ($w['status'] ?? 'pending'),
      'operator' => (string) ($w['operator'] ?? $w['method'] ?? ''),
      'phone' => (string) ($w['phone'] ?? $w['destination'] ?? ''),
      'reference' => (string) ($w['reference'] ?? $id),
      'createdAt' => (string) ($w['at'] ?? $w['createdAt'] ?? $w['created_at'] ?? ''),
      'reason' => (string) ($w['playerNote'] ?? $w['reason'] ?? $w['motif'] ?? ''),
      'adminHidden' => !empty($w['adminHidden']),
      'name' => (string) ($w['name'] ?? $w['beneficiary'] ?? ''),
      'email' => (string) ($w['email'] ?? ''),
    ];
    if (!isset($byId[$id])) {
      $byId[$id] = $row;
    } else {
      if ($byId[$id]['phone'] === '' && $row['phone'] !== '') $byId[$id]['phone'] = $row['phone'];
      if ($byId[$id]['reason'] === '' && $row['reason'] !== '') $byId[$id]['reason'] = $row['reason'];
      if (!empty($row['name'])) $byId[$id]['name'] = $row['name'];
      if (!empty($row['email'])) $byId[$id]['email'] = $row['email'];
    }
  }
  $list = array_values($byId);
  usort($list, static function ($a, $b) {
    return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
  });
  admin_cache_set('withdrawals', $list);
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
  foreach (['profiles', 'vaults', 'withdrawals', 'deposits', 'orders', 'auth_users'] as $k) {
    $f = admin_cache_file('admin_cache_' . $k . '.json');
    if (is_file($f)) @unlink($f);
  }
}
