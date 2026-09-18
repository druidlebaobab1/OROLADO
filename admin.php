<?php
declare(strict_types=1);

require_once __DIR__ . '/orolado_lib.php';
require_once __DIR__ . '/admin_lib.php';
orolado_load_env();
date_default_timezone_set('Africa/Abidjan');

if (session_status() !== PHP_SESSION_ACTIVE) {
  session_name('oro_admin');
  session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
  ]);
}

function admin_json(array $payload, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function admin_me(): ?array {
  $uid = (string) ($_SESSION['admin_uid'] ?? '');
  if ($uid === '') return null;
  $db = admin_local_db();
  $u = $db['users'][$uid] ?? null;
  if (!is_array($u) || !orolado_is_admin_user($u)) return null;
  return $u;
}

function admin_require(): array {
  $me = admin_me();
  if (!$me) admin_json(['ok' => false, 'reason' => 'Session expirée'], 401);
  return $me;
}

function admin_login_check(string $email, string $password): ?array {
  $email = strtolower(trim($email));
  if (!orolado_is_reserved_admin_email($email)) return null;
  $db = admin_local_db();
  $st = admin_json_state();
  if (empty($st['exists']) || !empty($st['readable'])) {
    orolado_bootstrap_admin($db, orolado_data_file());
  }
  $user = null;
  foreach (($db['users'] ?? []) as $u) {
    if (!is_array($u)) continue;
    if (strtolower((string) ($u['email'] ?? '')) === $email && orolado_is_admin_user($u)) {
      $user = $u;
      break;
    }
  }
  if (!$user) return null;
  $hash = (string) ($user['passwordHash'] ?? '');
  $ok = $hash !== '' && orolado_verify_password($password, $hash);
  if (!$ok) {
    foreach (orolado_admin_plain_passwords() as $plain) {
      if (hash_equals($plain, $password)) { $ok = true; break; }
    }
  }
  return $ok ? $user : null;
}

function admin_apply_filters(array $rows, array $req, string $dateField = 'createdAt'): array {
  $q = strtolower(trim((string) ($req['q'] ?? '')));
  $preset = (string) ($req['preset'] ?? 'all');
  $from = (string) ($req['dateFrom'] ?? '');
  $to = (string) ($req['dateTo'] ?? '');
  $cal = (string) ($req['cal'] ?? '');
  if ($preset === 'date' && $cal !== '') {
    $from = $cal;
    $to = $cal;
    [$a, $b] = admin_day_bounds('date', $from, $to);
  } else {
    [$a, $b] = admin_day_bounds($preset, $from, $to);
  }
  $out = [];
  foreach ($rows as $row) {
    if (!is_array($row)) continue;
    if ($q !== '' && !admin_match_q($row, $q)) continue;
    $iso = (string) ($row[$dateField] ?? $row['created_at'] ?? $row['at'] ?? '');
    if (!admin_in_range($iso !== '' ? $iso : null, $a, $b)) continue;
    $out[] = $row;
  }
  return $out;
}

function admin_page(array $rows, array $req): array {
  $page = max(1, (int) ($req['page'] ?? 1));
  $per = 80;
  $total = count($rows);
  $slice = array_slice($rows, ($page - 1) * $per, $per);
  return [$slice, $total, $page, (int) ceil($total / $per)];
}

function admin_user_lookup(string $id, array $pmap): array {
  if ($id !== '' && isset($pmap[$id])) return $pmap[$id];
  foreach ($pmap as $p) {
    if ($id !== '' && (string) ($p['publicId'] ?? '') === $id) return $p;
    if ($id !== '' && (string) ($p['id'] ?? '') === $id) return $p;
  }
  return ['id' => $id, 'publicId' => $id, 'email' => '', 'name' => '', 'phone' => ''];
}

function admin_badges(): array {
  $cached = admin_cache_get('badges', 12);
  if (is_array($cached) && isset($cached['inscrits'])) return $cached;
  $people = admin_profiles();
  $vaults = admin_vaults();
  $wds = admin_withdrawals();
  $deps = admin_deposits();
  $orders = admin_orders();
  [$t0, $t1] = admin_day_bounds('today');
  [$y0, $y1] = admin_day_bounds('yesterday');
  $signupToday = 0;
  $signupYest = 0;
  $noDep = 0;
  $inactive = 0;
  $cut7 = time() - 7 * 86400;
  foreach ($people as $p) {
    if (admin_in_range($p['createdAt'] ?? null, $t0, $t1)) $signupToday++;
    if (admin_in_range($p['createdAt'] ?? null, $y0, $y1)) $signupYest++;
    $paid = (float) ($p['depositTotal'] ?? 0);
    if ($paid <= 0) $noDep++;
    if ($paid > 0) {
      $ls = strtotime((string) ($p['lastSeen'] ?? '')) ?: 0;
      if ($ls < $cut7) $inactive++;
    }
  }
  $wdOpen = 0;
  $wdOpenSum = 0.0;
  $wdToday = 0;
  $wdRej = 0;
  $wdVisible = 0;
  $closedN = 0;
  foreach ($people as $p) {
    $role = strtolower((string) ($p['role'] ?? ''));
    if (in_array($role, ['suspended', 'banned', 'deleted'], true)) $closedN++;
  }
  foreach ($wds as $w) {
    if (!admin_wd_is_silenced($w)) $wdVisible++;
    if (admin_wd_is_open($w)) {
      $wdOpen++;
      $wdOpenSum += (float) $w['amount'];
    }
    if (admin_wd_is_paid($w) && admin_in_range($w['createdAt'] ?? null, $t0, $t1)) $wdToday++;
    if (admin_wd_is_rejected($w)) $wdRej++;
  }
  $depToday = 0;
  $depPend = 0;
  $depFail = 0;
  $depPaidN = 0;
  foreach ($deps as $d) {
    if (admin_dep_is_paid($d)) {
      $depPaidN++;
      if (admin_in_range($d['createdAt'] ?? null, $t0, $t1)) $depToday++;
    }
    if (admin_dep_is_pending($d)) {
      $age = strtotime((string) ($d['createdAt'] ?? '')) ?: 0;
      if ($age === 0 || $age >= time() - 7 * 86400) $depPend++;
    }
    if (admin_dep_is_failed($d)) $depFail++;
  }
  $winToday = 0;
  foreach ($orders as $o) {
    if (!empty($o['won']) && (string) ($o['mode'] ?? '') === 'real'
      && admin_in_range((string) ($o['created_at'] ?? ''), $t0, $t1)) $winToday++;
  }
  $otp = 0;
  foreach (admin_otp_rows() as $r) {
    if (admin_in_range($r['at'] ?? null, $t0, $t1)) $otp++;
  }
  $alerts = admin_collect_alerts();
  $alertN = 0;
  foreach ($alerts as $a) {
    if (($a['level'] ?? 'error') === 'error') $alertN++;
  }
  $online = admin_online_count();
  $nInscrits = admin_inscrits_count();
  $pmapBadge = [];
  foreach ($people as $p) {
    if (!empty($p['id'])) $pmapBadge[(string) $p['id']] = $p;
  }
  $ordersByUser = [];
  $openPos = 0;
  $stakeBuckets = [88 => 0.0, 112 => 0.0, 500 => 0.0, 1000 => 0.0, 5000 => 0.0];
  foreach ($orders as $o) {
    if ((string) ($o['mode'] ?? '') !== 'real') continue;
    $uid = (string) ($o['user_id'] ?? '');
    if ($uid !== '') $ordersByUser[$uid][] = $o;
    if (admin_order_is_live_real($o)) $openPos++;
    $st = round((float) ($o['stake'] ?? 0), 2);
    foreach (array_keys($stakeBuckets) as $b) {
      if (abs($st - $b) < 0.05) { $stakeBuckets[$b] += $st; break; }
    }
  }
  $wdSuspect = 0;
  foreach ($wds as $w) {
    if (!admin_wd_is_open($w)) continue;
    $uid = (string) ($w['userId'] ?? '');
    $p = $pmapBadge[$uid] ?? ['id' => $uid, 'realTrades' => 0];
    if (admin_is_suspect($p, $ordersByUser[$uid] ?? [], $w)) $wdSuspect++;
  }
  $payers = 0;
  foreach ($people as $p) {
    if ((float) ($p['depositTotal'] ?? 0) > 0) $payers++;
  }
  [$w0, $w1] = admin_day_bounds('range', admin_now()->modify('-6 days')->format('Y-m-d'), admin_now()->format('Y-m-d'));
  $profitToday = admin_profit_between($deps, $wds, $t0, $t1);
  $profit7 = admin_profit_between($deps, $wds, $w0, $w1);
  $profitAll = admin_profit_between($deps, $wds, '', '');
  $unreadMsg = 0;
  foreach ((admin_local_db()['support_messages'] ?? []) as $m) {
    if (!is_array($m)) continue;
    $st = strtolower((string) ($m['status'] ?? 'ouvert'));
    if ($st === 'ouvert' || $st === 'unread') $unreadMsg++;
  }
  $healthErr = 0;
  foreach (admin_health_rows() as $h) {
    if (($h['level'] ?? '') === 'error') $healthErr++;
  }
  $out = [
    'signup_today' => $signupToday,
    'signup_yesterday' => $signupYest,
    'signup_date' => $nInscrits,
    'signup_hour' => $signupToday,
    'signup_geo' => $nInscrits,
    'signup_idrange' => $nInscrits,
    'no_deposit' => $noDep,
    'signup_closed' => $closedN,
    'dep_today' => $depToday,
    'dep_pending' => $depPend,
    'dep_failed' => $depFail,
    'dep_top' => $depPaidN,
    'dep_all' => count($deps),
    'dep_method' => $depPaidN,
    'wd_pending' => $wdOpen,
    'wd_today' => $wdToday,
    'wd_all' => $wdVisible,
    'wd_rejected' => $wdRej,
    'wd_volume' => round($wdOpenSum, 2),
    'wd_suspect' => $wdSuspect,
    'online' => $online,
    'top_balances' => $payers,
    'top_winners' => $winToday,
    'games' => count($orders),
    'inactive' => $inactive,
    'payers' => $payers,
    'open_positions' => $openPos,
    'profit_today' => round($profitToday, 2),
    'profit_7d' => round($profit7, 2),
    'profit_total' => round($profitAll, 2),
    'payout_stats' => round(array_sum($stakeBuckets), 2),
    'traffic' => $nInscrits,
    'otp_mails' => $otp,
    'alerts' => $healthErr,
    'messages' => $unreadMsg,
    'inscrits' => $nInscrits,
  ];
  admin_cache_set('badges', $out);
  return $out;
}

function admin_list_payload(string $view, array $req): array {
  $people = admin_profiles();
  $vaults = admin_vaults();
  $pmap = [];
  foreach ($people as $p) $pmap[(string) $p['id']] = admin_enrich_user_row($p, $vaults);
  $wds = admin_withdrawals();
  $deps = admin_deposits();
  $orders = admin_orders();
  [$t0, $t1] = admin_day_bounds('today');
  [$y0, $y1] = admin_day_bounds('yesterday');

  $cols = [];
  $rows = [];
  $summary = '';
  $actions = false;

  $userCols = ['ID', 'Nom', 'E-mail', 'Téléphone', 'Pays', 'Inscrit', 'Solde réel'];
  $asUser = static function (array $p) use ($userCols): array {
    return [
      'cells' => [
        (string) ($p['publicId'] ?? ''),
        (string) ($p['name'] ?? '—'),
        (string) ($p['email'] ?? ''),
        (string) ($p['phone'] ?? ''),
        (string) ($p['country'] ?? '—'),
        substr((string) ($p['createdAt'] ?? ''), 0, 16),
        admin_money($p['real'] ?? 0),
      ],
      'userId' => (string) ($p['id'] ?? ''),
    ];
  };

  if (in_array($view, ['signup_today', 'signup_yesterday', 'signup_date', 'no_deposit', 'online', 'inactive', 'top_balances', 'signup_closed'], true)) {
    $cols = $userCols;
    $list = $people;
    if ($view === 'signup_today') {
      $list = array_values(array_filter($people, static fn($p) => admin_in_range($p['createdAt'] ?? null, $t0, $t1)));
    } else if ($view === 'signup_yesterday') {
      $list = array_values(array_filter($people, static fn($p) => admin_in_range($p['createdAt'] ?? null, $y0, $y1)));
    } else if ($view === 'no_deposit') {
      $list = array_values(array_filter($people, static fn($p) => (float) ($p['depositTotal'] ?? 0) <= 0));
    } else if ($view === 'online') {
      $cut = time() - 90;
      $list = array_values(array_filter($people, static function ($p) use ($cut) {
        $t = strtotime((string) ($p['lastSeen'] ?? ''));
        return $t && $t >= $cut;
      }));
    } else if ($view === 'inactive') {
      $cut7 = time() - 7 * 86400;
      $list = array_values(array_filter($people, static function ($p) use ($cut7) {
        if ((float) ($p['depositTotal'] ?? 0) <= 0) return false;
        $t = strtotime((string) ($p['lastSeen'] ?? '')) ?: 0;
        return $t < $cut7;
      }));
    } else if ($view === 'top_balances') {
      $tmp = [];
      foreach ($people as $p) $tmp[] = admin_enrich_user_row($p, $vaults);
      usort($tmp, static fn($a, $b) => ($b['real'] <=> $a['real']));
      $list = $tmp;
    } else if ($view === 'signup_closed') {
      $list = array_values(array_filter($people, static function ($p) {
        $role = strtolower((string) ($p['role'] ?? ''));
        return in_array($role, ['suspended', 'banned', 'deleted'], true);
      }));
    }
    $list = admin_apply_filters($list, $req, 'createdAt');
    if ($view !== 'top_balances') {
      usort($list, static fn($a, $b) => strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? '')));
    }
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) {
      $p = admin_enrich_user_row($p, $vaults);
      $rows[] = $asUser($p);
    }
    $summary = $total . ' joueur(s)';
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $summary, 'actions' => $actions];
  }

  if ($view === 'signup_idrange') {
    $cols = $userCols;
    $a = (int) preg_replace('/\D/', '', (string) ($req['idFrom'] ?? '1'));
    $b = (int) preg_replace('/\D/', '', (string) ($req['idTo'] ?? '1000'));
    if ($a <= 0) $a = 1;
    if ($b < $a) $b = $a;
    $list = array_values(array_filter($people, static function ($p) use ($a, $b) {
      $n = (int) ($p['seq'] ?? 0);
      return $n >= $a && $n <= $b;
    }));
    $list = admin_apply_filters($list, $req, 'createdAt');
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) $rows[] = $asUser(admin_enrich_user_row($p, $vaults));
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => 'ORO-' . $a . ' → ORO-' . $b . ' · ' . $total . ' joueur(s)', 'actions' => false];
  }

  if ($view === 'signup_hour') {
    $cols = ['Heure', 'Inscriptions'];
    $bucket = array_fill(0, 24, 0);
    $src = admin_apply_filters($people, $req, 'createdAt');
    if (($req['preset'] ?? 'all') === 'all') {
      $src = array_values(array_filter($people, static fn($p) => admin_in_range($p['createdAt'] ?? null, $t0, $t1)));
    }
    foreach ($src as $p) {
      $t = strtotime((string) ($p['createdAt'] ?? ''));
      if (!$t) continue;
      $h = (int) (new DateTimeImmutable('@' . $t))->setTimezone(admin_tz())->format('G');
      $bucket[$h]++;
    }
    foreach ($bucket as $h => $n) {
      $rows[] = ['cells' => [sprintf('%02d:00 – %02d:59', $h, $h), (string) $n], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => array_sum($bucket), 'page' => 1, 'pages' => 1, 'summary' => 'Pics horaires', 'actions' => false];
  }

  if ($view === 'signup_geo') {
    $cols = ['Pays / indicatif', 'Joueurs', 'Dernière IP connue'];
    $src = admin_apply_filters($people, $req, 'createdAt');
    $geo = [];
    foreach ($src as $p) {
      $k = trim((string) ($p['country'] ?? '')) ?: 'Inconnu';
      if (!isset($geo[$k])) $geo[$k] = ['n' => 0, 'ip' => ''];
      $geo[$k]['n']++;
      if ($geo[$k]['ip'] === '' && !empty($p['ip'])) $geo[$k]['ip'] = (string) $p['ip'];
    }
    arsort($geo);
    foreach ($geo as $k => $g) {
      $rows[] = ['cells' => [$k, (string) $g['n'], $g['ip'] !== '' ? $g['ip'] : '—'], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($src), 'page' => 1, 'pages' => 1, 'summary' => count($src) . ' joueurs', 'actions' => false];
  }

  if (in_array($view, ['dep_today', 'dep_pending', 'dep_failed', 'dep_all'], true)) {
    $cols = ['Réf.', 'ID', 'E-mail', 'Montant', 'Méthode', 'Statut', 'Date'];
    $list = $deps;
    if ($view === 'dep_today') {
      $list = array_values(array_filter($deps, static fn($d) => admin_dep_is_paid($d) && admin_in_range($d['createdAt'] ?? null, $t0, $t1)));
    } else if ($view === 'dep_pending') {
      $list = array_values(array_filter($deps, static fn($d) => admin_dep_is_pending($d)));
      $actions = true;
    } else if ($view === 'dep_failed') {
      $list = array_values(array_filter($deps, static fn($d) => admin_dep_is_failed($d)));
    }
    $enriched = [];
    foreach ($list as $d) {
      $u = admin_user_lookup((string) $d['userId'], $pmap);
      $d['email'] = (string) ($u['email'] ?? '');
      $d['publicId'] = (string) ($u['publicId'] ?? '');
      $d['name'] = (string) ($u['name'] ?? '');
      $d['phone'] = (string) ($u['phone'] ?? '');
      $enriched[] = $d;
    }
    $enriched = admin_apply_filters($enriched, $req, 'createdAt');
    $sum = 0.0;
    foreach ($enriched as $d) $sum += (float) $d['amount'];
    [$slice, $total, $page, $pages] = admin_page($enriched, $req);
    foreach ($slice as $d) {
      $rows[] = [
        'cells' => [
          (string) $d['id'],
          (string) ($d['publicId'] ?? ''),
          (string) ($d['email'] ?? ''),
          admin_money($d['amount']),
          admin_dep_channel((string) ($d['operator'] ?? '')),
          (string) $d['status'],
          substr((string) ($d['createdAt'] ?? ''), 0, 16),
        ],
        'userId' => (string) ($d['userId'] ?? ''),
        'ref' => (string) $d['id'],
        'kind' => 'deposit',
        'pending' => admin_dep_is_pending($d),
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $total . ' dépôt(s) · ' . admin_money($sum), 'actions' => $actions];
  }

  if ($view === 'dep_top') {
    $cols = ['ID', 'Nom', 'E-mail', 'Total déposé', 'Solde réel'];
    $tot = [];
    foreach ($deps as $d) {
      if (!admin_dep_is_paid($d)) continue;
      $uid = (string) $d['userId'];
      if ($uid === '') continue;
      if (!isset($tot[$uid])) $tot[$uid] = 0.0;
      $tot[$uid] += (float) $d['amount'];
    }
    $list = [];
    foreach ($tot as $uid => $amt) {
      $u = admin_enrich_user_row(admin_user_lookup($uid, $pmap), $vaults);
      $u['email'] = (string) ($u['email'] ?? '');
      $u['topAmt'] = $amt;
      $list[] = $u;
    }
    usort($list, static fn($a, $b) => ($b['topAmt'] <=> $a['topAmt']));
    $list = admin_apply_filters($list, $req, 'createdAt');
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) {
      $rows[] = [
        'cells' => [(string) ($p['publicId'] ?? ''), (string) ($p['name'] ?? ''), (string) ($p['email'] ?? ''), admin_money($p['topAmt'] ?? 0), admin_money($p['real'] ?? 0)],
        'userId' => (string) ($p['id'] ?? ''),
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => 'Classement déposants', 'actions' => false];
  }

  if ($view === 'dep_method') {
    $cols = ['Méthode', 'Nombre', 'Volume $'];
    $src = admin_apply_filters(array_values(array_filter($deps, static fn($d) => admin_dep_is_paid($d))), $req, 'createdAt');
    $g = [];
    foreach ($src as $d) {
      $ch = admin_dep_channel((string) ($d['operator'] ?? ''));
      if (!isset($g[$ch])) $g[$ch] = ['n' => 0, 's' => 0.0];
      $g[$ch]['n']++;
      $g[$ch]['s'] += (float) $d['amount'];
    }
    foreach ($g as $k => $v) {
      $rows[] = ['cells' => [$k, (string) $v['n'], admin_money($v['s'])], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($src), 'page' => 1, 'pages' => 1, 'summary' => 'Ventilation des dépôts validés', 'actions' => false];
  }

  if (in_array($view, ['wd_pending', 'wd_today', 'wd_all', 'wd_rejected', 'wd_volume', 'wd_suspect'], true)) {
    $cols = ['ID retrait', 'Joueur', 'Nom', 'E-mail', 'Montant', 'Méthode', 'Destination', 'État', 'Statut', 'Date'];
    $list = $wds;
    $ordersByUser = [];
    foreach ($orders as $o) {
      if ((string) ($o['mode'] ?? '') !== 'real') continue;
      $uid = (string) ($o['user_id'] ?? '');
      if ($uid !== '') $ordersByUser[$uid][] = $o;
    }
    if ($view === 'wd_pending' || $view === 'wd_volume') {
      $list = array_values(array_filter($wds, static fn($w) => admin_wd_is_open($w)));
      $actions = true;
    } else if ($view === 'wd_today') {
      $list = array_values(array_filter($wds, static fn($w) => admin_wd_is_paid($w) && admin_in_range($w['createdAt'] ?? null, $t0, $t1)));
    } else if ($view === 'wd_rejected') {
      $list = array_values(array_filter($wds, static fn($w) => admin_wd_is_rejected($w)));
    } else if ($view === 'wd_suspect') {
      $list = array_values(array_filter($wds, static function ($w) use ($pmap, $ordersByUser) {
        if (!admin_wd_is_open($w)) return false;
        $uid = (string) ($w['userId'] ?? '');
        $p = $pmap[$uid] ?? ['id' => $uid];
        return admin_is_suspect($p, $ordersByUser[$uid] ?? [], $w);
      }));
      $actions = true;
    } else {
      $list = array_values(array_filter($wds, static fn($w) => !admin_wd_is_silenced($w)));
      $actions = true;
    }
    $enriched = [];
    $sum = 0.0;
    $q = strtolower(trim((string) ($req['q'] ?? '')));
    $preset = (string) ($req['preset'] ?? 'all');
    foreach ($list as $w) {
      $w = admin_enrich_wd($w, $pmap);
      $uid = (string) ($w['userId'] ?? '');
      $p = $pmap[$uid] ?? ['id' => $uid];
      $w['_suspect'] = admin_is_suspect($p, $ordersByUser[$uid] ?? [], $w);
      if ($q !== '' && !admin_match_q($w, $q) && !str_contains(strtolower((string) ($w['name'] ?? '')), $q)) continue;
      if ($preset !== 'all' && $preset !== '' && ($w['createdAt'] ?? '') !== '') {
        $tmp = admin_apply_filters([$w], $req, 'createdAt');
        if ($tmp === []) continue;
      }
      $sum += (float) $w['amount'];
      $enriched[] = $w;
    }
    [$slice, $total, $page, $pages] = admin_page($enriched, $req);
    foreach ($slice as $w) {
      $open = admin_wd_is_open($w);
      $method = admin_method_label(admin_fill((string) ($w['operator'] ?? '')));
      $dest = admin_fill((string) ($w['phone'] ?? ''));
      $suspect = !empty($w['_suspect']);
      $rows[] = [
        'cells' => [
          (string) $w['id'],
          (string) ($w['publicId'] ?? ''),
          (string) ($w['name'] ?? '—'),
          (string) ($w['email'] ?? ''),
          admin_money($w['amount']),
          $method !== '' ? $method : '—',
          $dest !== '' ? $dest : '—',
          $suspect ? 'Suspect' : 'Vérifié',
          (string) ($w['status'] ?? ''),
          substr((string) ($w['createdAt'] ?? ''), 0, 16),
        ],
        'userId' => (string) ($w['userId'] ?? ''),
        'ref' => (string) $w['id'],
        'kind' => 'withdraw',
        'pending' => $open,
        'suspect' => $suspect,
        'flag' => $suspect ? 'suspect' : 'ok',
      ];
    }
    $summary = $total . ' retrait(s) · ' . admin_money($sum);
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $summary, 'actions' => $actions];
  }

  if ($view === 'top_winners') {
    $cols = ['ID', 'Nom', 'E-mail', 'Gains nets du jour', 'Mises'];
    $g = [];
    foreach ($orders as $o) {
      if ((string) ($o['mode'] ?? '') !== 'real') continue;
      if (!admin_in_range((string) ($o['created_at'] ?? ''), $t0, $t1)) continue;
      $uid = (string) ($o['user_id'] ?? '');
      if ($uid === '') continue;
      if (!isset($g[$uid])) $g[$uid] = ['net' => 0.0, 'stake' => 0.0];
      $g[$uid]['net'] += (float) ($o['net'] ?? 0);
      $g[$uid]['stake'] += (float) ($o['stake'] ?? 0);
    }
    $list = [];
    foreach ($g as $uid => $x) {
      $u = admin_user_lookup($uid, $pmap);
      $u['winNet'] = $x['net'];
      $u['winStake'] = $x['stake'];
      $list[] = $u;
    }
    usort($list, static fn($a, $b) => ($b['winNet'] <=> $a['winNet']));
    $list = admin_apply_filters($list, $req, 'createdAt');
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) {
      $rows[] = [
        'cells' => [(string) ($p['publicId'] ?? ''), (string) ($p['name'] ?? ''), (string) ($p['email'] ?? ''), admin_money($p['winNet'] ?? 0), admin_money($p['winStake'] ?? 0)],
        'userId' => (string) ($p['id'] ?? ''),
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => 'Gains réels aujourd’hui', 'actions' => false];
  }

  if ($view === 'games') {
    $cols = ['Jeu', 'Mises $', 'Gains nets $', 'Trades', 'Mode réel'];
    $g = [];
    $src = $orders;
    $preset = (string) ($req['preset'] ?? 'all');
    if ($preset !== 'all') {
      [$a, $b] = admin_day_bounds($preset, (string) ($req['dateFrom'] ?? ''), (string) ($req['dateTo'] ?? ''));
      $src = array_values(array_filter($orders, static fn($o) => admin_in_range((string) ($o['created_at'] ?? ''), $a, $b)));
    }
    foreach ($src as $o) {
      if ((string) ($o['mode'] ?? 'demo') !== 'real') continue;
      $aid = (string) ($o['asset_id'] ?? '—');
      if (!isset($g[$aid])) $g[$aid] = ['stake' => 0.0, 'net' => 0.0, 'n' => 0];
      $g[$aid]['stake'] += (float) ($o['stake'] ?? 0);
      $g[$aid]['net'] += (float) ($o['net'] ?? 0);
      $g[$aid]['n']++;
    }
    foreach ($g as $aid => $x) {
      $rows[] = ['cells' => [admin_asset_name($aid), admin_money($x['stake']), admin_money($x['net']), (string) $x['n'], 'réel'], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($rows), 'page' => 1, 'pages' => 1, 'summary' => 'Performance réelle par jeu', 'actions' => false];
  }

  if ($view === 'traffic') {
    $cols = ['Source', 'Joueurs'];
    $src = admin_apply_filters($people, $req, 'createdAt');
    $g = [];
    foreach ($src as $p) {
      $k = strtolower(trim((string) ($p['traffic'] ?? 'direct'))) ?: 'direct';
      if (!isset($g[$k])) $g[$k] = 0;
      $g[$k]++;
    }
    arsort($g);
    foreach ($g as $k => $n) {
      $rows[] = ['cells' => [$k, (string) $n], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($src), 'page' => 1, 'pages' => 1, 'summary' => 'Provenance des inscriptions', 'actions' => false];
  }

  if ($view === 'otp_mails') {
    $cols = ['Heure', 'E-mail', 'Type', 'Statut'];
    $list = admin_apply_filters(admin_otp_rows(), $req, 'at');
    if (($req['preset'] ?? 'all') === 'all') {
      $list = array_values(array_filter(admin_otp_rows(), static fn($r) => admin_in_range($r['at'] ?? null, $t0, $t1)));
    }
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $r) {
      $rows[] = [
        'cells' => [substr((string) ($r['at'] ?? ''), 0, 19), (string) ($r['email'] ?? ''), (string) ($r['type'] ?? ''), (string) ($r['status'] ?? '')],
        'userId' => '',
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $total . ' e-mail(s) / OTP', 'actions' => false];
  }

  if ($view === 'alerts') {
    $cols = ['Heure exacte', 'Service', 'État', 'Description'];
    $list = admin_health_rows();
    $list = admin_apply_filters($list, $req, 'at');
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    $errN = 0;
    foreach ($list as $r) {
      if (($r['level'] ?? '') === 'error') $errN++;
    }
    foreach ($slice as $r) {
      $lvl = (string) ($r['level'] ?? 'ok');
      $rows[] = [
        'cells' => [
          substr((string) ($r['at'] ?? ''), 0, 19),
          (string) ($r['service'] ?? ''),
          $lvl === 'error' ? 'Panne' : 'OK',
          (string) ($r['message'] ?? ''),
        ],
        'userId' => '',
        'alert' => $lvl === 'error',
        'flag' => $lvl === 'error' ? 'suspect' : 'ok',
      ];
    }
    $summary = $errN === 0
      ? 'Santé du site : aucun incident. Serveur, scripts et base joignables.'
      : ($errN . ' incident(s) à traiter');
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $summary, 'actions' => false];
  }

  if (in_array($view, ['profit_today', 'profit_7d', 'profit_total'], true)) {
    $from = '';
    $to = '';
    $label = 'Total';
    if ($view === 'profit_today') {
      $from = $t0; $to = $t1; $label = 'Aujourd’hui';
    } else if ($view === 'profit_7d') {
      $from = admin_now()->modify('-6 days')->setTime(0, 0, 0)->format('c');
      $to = admin_now()->modify('+1 day')->setTime(0, 0, 0)->format('c');
      $label = '7 derniers jours';
    }
    $in = 0.0; $out = 0.0;
    $cols = ['Type', 'Réf.', 'Joueur', 'Montant', 'Date'];
    foreach ($deps as $d) {
      if (!admin_dep_is_paid($d)) continue;
      if (!admin_in_range((string) ($d['createdAt'] ?? ''), $from, $to)) continue;
      $in += (float) $d['amount'];
      $u = admin_user_lookup((string) $d['userId'], $pmap);
      $rows[] = ['cells' => ['Dépôt', (string) $d['id'], (string) ($u['name'] ?? $u['publicId'] ?? ''), admin_money($d['amount']), substr((string) ($d['createdAt'] ?? ''), 0, 16)], 'userId' => (string) $d['userId']];
    }
    foreach ($wds as $w) {
      if (!admin_wd_is_paid($w) || admin_wd_is_silenced($w)) continue;
      if (!admin_in_range((string) ($w['createdAt'] ?? ''), $from, $to)) continue;
      $out += (float) $w['amount'];
      $w = admin_enrich_wd($w, $pmap);
      $rows[] = ['cells' => ['Retrait', (string) $w['id'], (string) ($w['name'] ?? $w['publicId'] ?? ''), admin_money($w['amount']), substr((string) ($w['createdAt'] ?? ''), 0, 16)], 'userId' => (string) ($w['userId'] ?? '')];
    }
    $net = $in - $out;
    $summary = $label . ' · Dépôts ' . admin_money($in) . ' − Retraits ' . admin_money($out) . ' = Bénéfice ' . admin_money($net);
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($rows), 'page' => 1, 'pages' => 1, 'summary' => $summary, 'actions' => false];
  }

  if ($view === 'payers') {
    $cols = $userCols;
    $list = array_values(array_filter($people, static fn($p) => (float) ($p['depositTotal'] ?? 0) > 0));
    $list = admin_apply_filters($list, $req, 'createdAt');
    usort($list, static fn($a, $b) => ((float) ($b['depositTotal'] ?? 0) <=> (float) ($a['depositTotal'] ?? 0)));
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) $rows[] = $asUser(admin_enrich_user_row($p, $vaults));
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $total . ' joueur(s) ayant déposé', 'actions' => false];
  }

  if ($view === 'open_positions') {
    $cols = ['Joueur', 'Nom', 'Jeu', 'Sens', 'Mise', 'Temps restant'];
    $live = [];
    foreach ($orders as $o) {
      if (!admin_order_is_live_real($o)) continue;
      $live[] = $o;
    }
    usort($live, static function ($a, $b) {
      return admin_order_expiry_ts($a) <=> admin_order_expiry_ts($b);
    });
    foreach ($live as $o) {
      $u = admin_user_lookup((string) ($o['user_id'] ?? ''), $pmap);
      $exp = admin_order_expiry_ts($o);
      $left = $exp > 0 ? max(0, $exp - time()) : (int) ($o['duration'] ?? 0);
      $side = strtolower((string) ($o['side'] ?? ''));
      $sens = $side === 'put' ? 'Vente (PUT)' : 'Achat (CALL)';
      $mm = floor($left / 60);
      $ss = $left % 60;
      $rows[] = [
        'cells' => [
          (string) ($u['publicId'] ?? ''),
          (string) ($u['name'] ?? '—'),
          admin_asset_name((string) ($o['asset_id'] ?? '')),
          $sens,
          admin_money($o['stake'] ?? 0),
          sprintf('%d:%02d', $mm, $ss),
        ],
        'userId' => (string) ($o['user_id'] ?? ''),
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($rows), 'page' => 1, 'pages' => 1, 'summary' => count($rows) . ' position(s) réelle(s) ouverte(s)', 'actions' => false];
  }

  if ($view === 'payout_stats') {
    $cols = ['Montant', 'Volume misé', 'Nombre de trades réels'];
    $want = [88.0, 112.0, 500.0, 1000.0, 5000.0];
    $vol = [];
    $cnt = [];
    foreach ($want as $b) { $vol[$b] = 0.0; $cnt[$b] = 0; }
    $src = $orders;
    $preset = (string) ($req['preset'] ?? 'all');
    if ($preset !== 'all') {
      [$a, $b] = admin_day_bounds($preset, (string) ($req['dateFrom'] ?? ''), (string) ($req['dateTo'] ?? ''));
      $src = array_values(array_filter($orders, static fn($o) => admin_in_range((string) ($o['created_at'] ?? ''), $a, $b)));
    }
    foreach ($src as $o) {
      if ((string) ($o['mode'] ?? '') !== 'real') continue;
      $st = (float) ($o['stake'] ?? 0);
      foreach ($want as $b) {
        if (abs($st - $b) < 0.05) {
          $vol[$b] += $st;
          $cnt[$b]++;
          break;
        }
      }
    }
    foreach ($want as $b) {
      $rows[] = ['cells' => [admin_money($b), admin_money($vol[$b]), (string) $cnt[$b]], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => 5, 'page' => 1, 'pages' => 1, 'summary' => 'Volumes des mises 88 / 112 / 500 / 1000 / 5000 $ (compte réel uniquement)', 'actions' => false];
  }

  if ($view === 'messages') {
    $cols = ['État', 'Date', 'Joueur', 'E-mail', 'Sujet', 'Message'];
    $list = [];
    foreach ((admin_local_db()['support_messages'] ?? []) as $m) {
      if (!is_array($m)) continue;
      $st = strtolower((string) ($m['status'] ?? 'ouvert'));
      $unread = ($st === 'ouvert' || $st === 'unread');
      $u = admin_user_lookup((string) ($m['userId'] ?? ''), $pmap);
      $row = [
        'id' => (string) ($m['id'] ?? ''),
        'userId' => (string) ($m['userId'] ?? ''),
        'email' => (string) ($m['email'] ?? $u['email'] ?? ''),
        'name' => (string) ($u['name'] ?? $m['publicId'] ?? ''),
        'publicId' => (string) ($m['publicId'] ?? $u['publicId'] ?? ''),
        'subject' => (string) ($m['subject'] ?? ''),
        'message' => (string) ($m['message'] ?? ''),
        'status' => $st,
        'createdAt' => (string) ($m['createdAt'] ?? $m['at'] ?? ''),
        'unread' => $unread,
      ];
      $list[] = $row;
    }
    $q = strtolower(trim((string) ($req['q'] ?? '')));
    if ($q !== '') {
      $list = array_values(array_filter($list, static function ($r) use ($q) {
        return admin_match_q($r, $q) || str_contains(strtolower((string) ($r['subject'] ?? '')), $q)
          || str_contains(strtolower((string) ($r['message'] ?? '')), $q);
      }));
    }
    usort($list, static function ($a, $b) {
      if (!empty($a['unread']) !== !empty($b['unread'])) return !empty($a['unread']) ? -1 : 1;
      return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
    });
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $m) {
      $rows[] = [
        'cells' => [
          !empty($m['unread']) ? 'Non lu' : 'Lu',
          substr((string) $m['createdAt'], 0, 16),
          (string) ($m['publicId'] ?: $m['name'] ?: '—'),
          (string) ($m['email'] ?? ''),
          (string) ($m['subject'] ?? ''),
          (string) ($m['message'] ?? ''),
        ],
        'userId' => (string) ($m['userId'] ?? ''),
        'ref' => (string) ($m['id'] ?? ''),
        'kind' => 'message',
        'unread' => !empty($m['unread']),
        'flag' => !empty($m['unread']) ? 'unread' : 'ok',
      ];
    }
    $actions = true;
    $unreadN = 0;
    foreach ($list as $m) { if (!empty($m['unread'])) $unreadN++; }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $unreadN . ' non lu(s) · ' . $total . ' message(s)', 'actions' => $actions];
  }

  return ['ok' => false, 'reason' => 'Vue inconnue'];
}

function admin_profile_payload(string $uid): array {
  $pmap = admin_profile_map();
  $vaults = admin_vaults();
  $p = admin_user_lookup($uid, $pmap);
  if (($p['id'] ?? '') === '' || ($p['id'] ?? '') !== $uid) {
    foreach ($pmap as $row) {
      if ((string) $row['id'] === $uid || (string) ($row['publicId'] ?? '') === $uid) {
        $p = $row;
        $uid = (string) $row['id'];
        break;
      }
    }
  }
  $p = admin_enrich_user_row($p, $vaults);
  $deps = [];
  foreach (admin_deposits() as $d) {
    if ((string) $d['userId'] !== $uid) continue;
    $deps[] = [
      'id' => $d['id'],
      'amount' => $d['amount'],
      'status' => $d['status'],
      'method' => admin_dep_channel((string) ($d['operator'] ?? '')),
      'at' => $d['createdAt'],
    ];
  }
  $wds = [];
  foreach (admin_withdrawals() as $w) {
    if ((string) $w['userId'] !== $uid) continue;
    if (admin_wd_is_silenced($w)) continue;
    $w = admin_enrich_wd($w, $pmap);
    $wds[] = [
      'id' => $w['id'],
      'amount' => $w['amount'],
      'status' => $w['status'],
      'method' => admin_method_label(admin_fill((string) ($w['operator'] ?? ''))),
      'phone' => admin_fill((string) ($w['phone'] ?? '')),
      'at' => $w['createdAt'],
      'reason' => $w['reason'] ?? '',
    ];
  }
  $games = [];
  foreach (admin_orders() as $o) {
    if ((string) ($o['user_id'] ?? '') !== $uid) continue;
    if ((string) ($o['mode'] ?? '') !== 'real') continue;
    $games[] = [
      'id' => $o['id'] ?? '',
      'game' => admin_asset_name((string) ($o['asset_id'] ?? '')),
      'stake' => $o['stake'] ?? 0,
      'net' => $o['net'] ?? 0,
      'won' => $o['won'] ?? null,
      'mode' => $o['mode'] ?? '',
      'at' => $o['created_at'] ?? '',
    ];
  }
  return [
    'ok' => true,
    'user' => [
      'id' => $uid,
      'publicId' => (string) ($p['publicId'] ?? ''),
      'name' => (string) ($p['name'] ?? ''),
      'email' => (string) ($p['email'] ?? ''),
      'phone' => (string) ($p['phone'] ?? ''),
      'country' => (string) ($p['country'] ?? ''),
      'ip' => (string) ($p['ip'] ?? '—'),
      'createdAt' => (string) ($p['createdAt'] ?? ''),
      'lastSeen' => (string) ($p['lastSeen'] ?? ''),
      'role' => (string) ($p['role'] ?? 'user'),
      'real' => (float) ($p['real'] ?? 0),
      'traffic' => (string) ($p['traffic'] ?? 'direct'),
    ],
    'deposits' => $deps,
    'withdrawals' => $wds,
    'games' => array_slice($games, 0, 80),
  ];
}

$isAjax = ($_SERVER['REQUEST_METHOD'] === 'POST') && (
  (($_GET['ajax'] ?? '') === '1')
  || str_contains((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')
  || str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json')
);

if ($isAjax) {
  $raw = file_get_contents('php://input') ?: '';
  $req = json_decode($raw, true);
  if (!is_array($req)) $req = $_POST;
  $action = (string) ($req['action'] ?? '');

  if ($action === 'login') {
    $u = admin_login_check((string) ($req['email'] ?? ''), (string) ($req['password'] ?? ''));
    if (!$u) {
      admin_alert_push('Connexion', 'Tentative de connexion admin refusée.', 'error');
      admin_json(['ok' => false, 'reason' => 'Identifiants incorrects'], 403);
    }
    $_SESSION['admin_uid'] = (string) $u['id'];
    $_SESSION['admin_email'] = (string) $u['email'];
    admin_json(['ok' => true]);
  }
  if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    admin_json(['ok' => true]);
  }

  $me = admin_require();

  if ($action === 'badges') {
    admin_json(['ok' => true, 'badges' => admin_badges()]);
  }
  if ($action === 'list') {
    $view = (string) ($req['view'] ?? 'signup_date');
    admin_json(admin_list_payload($view, $req));
  }
  if ($action === 'profile') {
    admin_json(admin_profile_payload((string) ($req['userId'] ?? '')));
  }
  if ($action === 'adjust') {
    $uid = (string) ($req['userId'] ?? '');
    $delta = (float) ($req['delta'] ?? 0);
    $motif = trim((string) ($req['motif'] ?? ''));
    if ($uid === '' || $motif === '' || abs($delta) < 0.0001) {
      admin_json(['ok' => false, 'reason' => 'Montant et motif obligatoires']);
    }
    $db = admin_local_db();
    if (!isset($db['vault'][$uid])) $db['vault'][$uid] = ['demo' => 0, 'real' => 0];
    if ($delta >= 0) {
      $db['vault'][$uid]['real'] = orolado_money(($db['vault'][$uid]['real'] ?? 0) + $delta);
      supabase_credit_real($uid, $delta, false);
    } else {
      $ok = supabase_debit_real($uid, abs($delta));
      if (!$ok) admin_json(['ok' => false, 'reason' => 'Solde insuffisant']);
      $db['vault'][$uid]['real'] = max(0, orolado_money(($db['vault'][$uid]['real'] ?? 0) + $delta));
    }
    admin_log($db, (string) ($me['email'] ?? ''), (string) ($db['users'][$uid]['publicId'] ?? $uid), $delta >= 0 ? 'credit' : 'debit', (int) round($delta), $motif);
    save_db(orolado_data_file(), $db);
    admin_bust_cache();
    admin_json(['ok' => true, 'real' => $db['vault'][$uid]['real']]);
  }
  if ($action === 'suspend') {
    $uid = (string) ($req['userId'] ?? '');
    if ($uid === '') admin_json(['ok' => false, 'reason' => 'Joueur manquant']);
    $db = admin_local_db();
    orolado_force_suspend($db, $uid, 'suspended');
    save_db(orolado_data_file(), $db);
    admin_bust_cache();
    admin_json(['ok' => true]);
  }
  if ($action === 'delete_user') {
    $uid = (string) ($req['userId'] ?? '');
    if ($uid === '') admin_json(['ok' => false, 'reason' => 'Joueur manquant']);
    $db = admin_local_db();
    orolado_force_delete_account($db, $uid);
    save_db(orolado_data_file(), $db);
    admin_bust_cache();
    admin_json(['ok' => true]);
  }
  if ($action === 'resolve_wd') {
    $id = (string) ($req['id'] ?? '');
    $act = strtolower((string) ($req['act'] ?? ''));
    $motif = trim((string) ($req['motif'] ?? ''));
    if ($id === '' || !in_array($act, ['approve', 'reject', 'silent', 'suspend'], true)) {
      admin_json(['ok' => false, 'reason' => 'Action invalide']);
    }
    $db = admin_local_db();
    $found = admin_find_wd_row($id);
    $uid = $found ? (string) ($found['userId'] ?? '') : '';
    $amt = $found ? abs((float) ($found['amount'] ?? 0)) : 0;
    $row = $found ?: [
      'id' => $id,
      'userId' => $uid,
      'amount' => $amt,
      'status' => 'pending',
      'at' => date('c'),
    ];
    foreach (($db['withdrawals'] ?? []) as $local) {
      if (!is_array($local)) continue;
      if ((string) ($local['id'] ?? '') === $id || (string) ($local['reference'] ?? '') === $id) {
        $row = array_merge($row, $local);
        if ($uid === '') $uid = (string) ($local['userId'] ?? '');
        break;
      }
    }
    $row['id'] = $id;
    if ($uid !== '') $row['userId'] = $uid;
    if ($amt > 0) $row['amount'] = $amt;
    if ($motif !== '') $row['reason'] = $motif;

    if ($act === 'approve') {
      $row['status'] = 'approved';
      $row['playerHidden'] = false;
      $row['adminHidden'] = false;
    } else if ($act === 'reject') {
      $row['status'] = 'rejected';
      $row['adminHidden'] = false;
      orolado_refund_wd_once($db, $row);
    } else if ($act === 'silent') {
      $row['status'] = 'silenced';
      $row['adminHidden'] = true;
      $row['playerHidden'] = true;
    } else {
      $row['status'] = 'review';
      $row['suspect'] = true;
      if ($uid !== '') orolado_force_suspend($db, $uid, 'suspended');
    }

    admin_upsert_local_wd($db, $row);
    $hdrs = supabase_admin_headers();
    if ($hdrs && $act !== 'suspend') {
      $st = $act === 'approve' ? 'approved' : ($act === 'silent' ? 'silenced' : 'rejected');
      $patch = ['status' => $st];
      admin_sb_req('/rest/v1/withdrawals?id=eq.' . rawurlencode($id), [], 'PATCH', json_encode($patch));
      admin_sb_req('/rest/v1/withdrawals?reference=eq.' . rawurlencode($id), [], 'PATCH', json_encode($patch));
      $txNote = $act === 'silent' ? 'silenced' : $st;
      admin_sb_req('/rest/v1/transactions?id=eq.' . rawurlencode($id), [], 'PATCH', json_encode(['note' => $txNote]));
    }
    save_db(orolado_data_file(), $db);
    admin_bust_cache();
    admin_json(['ok' => true, 'refunded' => !empty($row['refunded']), 'status' => $row['status'] ?? '']);
  }
  if ($action === 'mark_msg') {
    $id = (string) ($req['id'] ?? '');
    $db = admin_local_db();
    foreach (($db['support_messages'] ?? []) as $i => $m) {
      if ((string) ($m['id'] ?? '') !== $id) continue;
      $db['support_messages'][$i]['status'] = 'resolu';
      $db['support_messages'][$i]['readAt'] = date('c');
      break;
    }
    save_db(orolado_data_file(), $db);
    admin_json(['ok' => true]);
  }
  if ($action === 'resolve_dep') {
    $ref = (string) ($req['id'] ?? '');
    $act = strtolower((string) ($req['act'] ?? ''));
    if ($ref === '') admin_json(['ok' => false, 'reason' => 'Référence manquante']);
    if ($act === 'approve') {
      $res = credit_paid_deposit(['ref' => $ref, 'paid' => true, 'manual' => true, 'creditReceived' => true]);
      admin_bust_cache();
      admin_json(['ok' => !empty($res['ok']) || !empty($res['duplicate']), 'detail' => $res]);
    }
    $db = admin_local_db();
    foreach (($db['deposits'] ?? []) as $i => $d) {
      if ((string) ($d['id'] ?? '') === $ref || (string) ($d['ref'] ?? '') === $ref) {
        $db['deposits'][$i]['status'] = 'CANCELED';
        save_db(orolado_data_file(), $db);
        break;
      }
    }
    $hdrs = supabase_admin_headers();
    if ($hdrs) {
      admin_sb_req('/rest/v1/deposits?id=eq.' . rawurlencode($ref), $hdrs, 'PATCH', json_encode(['status' => 'CANCELED']));
    }
    admin_bust_cache();
    admin_json(['ok' => true]);
  }
  admin_json(['ok' => false, 'reason' => 'Action inconnue'], 400);
}

if (!admin_me()) {
  $tok = trim((string) ($_COOKIE['oro_token'] ?? ''));
  if ($tok !== '') {
    $dbTok = admin_local_db();
    $uTok = orolado_session_user($dbTok, $tok);
    if (is_array($uTok) && orolado_is_admin_user($uTok)) {
      $_SESSION['admin_uid'] = (string) ($uTok['id'] ?? '');
      $_SESSION['admin_email'] = (string) ($uTok['email'] ?? '');
    }
  }
}
$logged = admin_me() !== null;
$ADMIN_TABS = [
  'gA' => [
    ['signup_today', 'Inscriptions du Jour'],
    ['signup_yesterday', 'Inscriptions d’Hier'],
    ['signup_date', 'Inscriptions par Date'],
    ['signup_hour', 'Inscriptions par Heure'],
    ['signup_geo', 'Inscriptions par Pays / IP'],
    ['signup_idrange', 'Recherche par Tranche d’ID'],
    ['no_deposit', 'Joueurs Sans Dépôt'],
    ['signup_closed', 'Comptes fermés / désinscrits'],
  ],
  'gB' => [
    ['dep_today', 'Dépôts du Jour'],
    ['dep_pending', 'Dépôts en Attente'],
    ['dep_failed', 'Dépôts Échoués'],
    ['dep_top', 'Meilleurs Déposants'],
    ['dep_all', 'Historique Global Dépôts'],
    ['dep_method', 'Dépôts par Méthode'],
  ],
  'gC' => [
    ['wd_pending', 'Retraits en Cours'],
    ['wd_today', 'Retraits Validés du Jour'],
    ['wd_all', 'Historique Global Retraits'],
    ['wd_rejected', 'Retraits Rejetés'],
    ['wd_volume', 'Volume Total à Payer'],
    ['wd_suspect', 'Suspect'],
  ],
  'gD' => [
    ['online', 'Joueurs en Ligne'],
    ['payers', 'Joueurs Actifs (Payeurs)'],
    ['top_balances', 'Top Balances / Soldes'],
    ['top_winners', 'Top Gagnants du Jour'],
    ['profit_today', 'Bénéfice du Jour'],
    ['profit_7d', 'Bénéfice 7 Jours'],
    ['profit_total', 'Bénéfice Total'],
    ['open_positions', 'Positions Ouvertes'],
    ['payout_stats', 'Maxi Payout & Stats des Jeux'],
    ['games', 'Statistiques des Jeux'],
    ['inactive', 'Joueurs Inactifs'],
  ],
  'gE' => [
    ['traffic', 'Sources de Trafic'],
    ['otp_mails', 'Mails & Codes OTP Envoyés'],
    ['messages', 'Messages'],
    ['alerts', 'Santé du Site'],
  ],
];
$inscritsHead = $logged ? admin_inscrits_count() : 0;
?><!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>OROLADO · Dashboard Admin</title>
  <style>
    :root{--gold:#F59E0B;--muted:#94A3B8;--bg:#0A0F1D;--card:#121A2B;--line:rgba(255,255,255,.08);--text:#E8EEF9;--red:#F43F5E;--green:#34D399}
    *{box-sizing:border-box} body{margin:0;font-family:Inter,Segoe UI,system-ui,sans-serif;background:linear-gradient(165deg,#0A0F1D,#121A2B);color:var(--text);min-height:100vh}
    .head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line)}
    .head h1{font-size:.95rem;color:var(--gold);margin:0}
    .wrap{padding:14px 12px 40px;max-width:1280px;margin:0 auto}
    .sec{font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:16px 0 8px}
    .metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    @media(min-width:700px){.metrics{grid-template-columns:repeat(3,1fr)}}
    @media(min-width:1100px){.metrics{grid-template-columns:repeat(4,1fr)}}
    .metric-btn{display:block;width:100%;text-align:left;border:1px solid var(--line);background:rgba(10,15,29,.88);color:inherit;font:inherit;border-radius:12px;padding:10px;cursor:pointer}
    .metric-btn:hover{border-color:rgba(245,158,11,.45)}
    .metric-btn.on{border-color:var(--gold);box-shadow:0 0 0 1px rgba(245,158,11,.25)}
    .metric-btn .k{font-size:.62rem;color:var(--muted);text-transform:uppercase;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:8px}
    .badge{display:inline-flex;min-width:22px;justify-content:center;background:linear-gradient(90deg,#F59E0B,#FBBF24);color:#0B0E14;font-size:.68rem;font-weight:900;border-radius:999px;padding:2px 7px}
    .badge.red{background:#F43F5E;color:#fff}
    .badge.zero{background:rgba(255,255,255,.08);color:var(--muted)}
    .filters{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0;align-items:end}
    .filters input,.filters select{min-height:38px;border-radius:10px;border:1px solid var(--line);background:#0E1420;color:var(--text);padding:6px 10px;font:inherit}
    .filters input[type=search]{flex:1;min-width:180px}
    .panel-title{color:var(--gold);font-size:.8rem;margin:8px 0}
    .table-wrap{overflow:auto;max-height:62vh;border:1px solid var(--line);border-radius:10px}
    table{width:100%;border-collapse:collapse;font-size:.72rem}
    th,td{padding:8px 6px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
    th{color:var(--muted);font-size:.62rem;text-transform:uppercase;position:sticky;top:0;background:#121A2B}
    tr.clickable{cursor:pointer} tr.clickable:hover{background:rgba(245,158,11,.08)}
    tr.flag-suspect td:nth-last-child(4), .pill-suspect{color:#FCA5A5;font-weight:800}
    .pill{display:inline-block;border-radius:999px;padding:2px 8px;font-weight:800;font-size:.68rem}
    .pill-ok{background:rgba(52,211,153,.18);color:#34D399}
    .pill-suspect{background:rgba(244,63,94,.18);color:#F43F5E}
    .pill-unread{background:rgba(245,158,11,.2);color:#FBBF24}
    .mini{border:1px solid var(--line);background:#1A2230;color:var(--text);border-radius:6px;padding:4px 8px;font:inherit;font-weight:800;cursor:pointer;margin-right:4px;margin-bottom:3px}
    .mini.ok{border-color:var(--green);color:var(--green)} .mini.bad{border-color:var(--red);color:var(--red)}
    .login{max-width:360px;margin:12vh auto;background:rgba(10,15,29,.92);border:1px solid rgba(245,158,11,.35);border-radius:16px;padding:24px}
    .login h2{color:var(--gold);margin:0 0 16px;font-size:1.05rem}
    .login input{width:100%;min-height:42px;margin:0 0 10px;border-radius:10px;border:1px solid var(--line);background:#0E1420;color:var(--text);padding:8px 10px;font:inherit}
    .btn-gold{width:100%;min-height:44px;border:0;border-radius:12px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#B45309,#F59E0B,#FBBF24);color:#0B0E14}
    .err{color:#FDA4AF;font-size:.8rem;min-height:1.2em}
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.78);display:none;z-index:50;padding:16px;overflow:auto}
    .modal.on{display:block}
    .modal-box{max-width:720px;margin:4vh auto;background:#121A2B;border:1px solid rgba(245,158,11,.35);border-radius:16px;padding:18px}
    .muted{color:var(--muted);font-size:.78rem}
    .pager{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:.75rem}
  </style>
</head>
<body>
<?php if (!$logged): ?>
  <form class="login" id="loginForm">
    <h2>Dashboard administrateur</h2>
    <input type="email" name="email" placeholder="E-mail admin" required autocomplete="username">
    <input type="password" name="password" placeholder="Mot de passe" required autocomplete="current-password">
    <p class="err" id="loginErr"></p>
    <button class="btn-gold" type="submit">Entrer</button>
  </form>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(e.target);
      const r = await fetch('admin.php?ajax=1', {method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'}, body: JSON.stringify({action:'login', email: fd.get('email'), password: fd.get('password')})});
      const j = await r.json();
      if (!j.ok) { document.getElementById('loginErr').textContent = j.reason || 'Accès refusé'; return; }
      location.reload();
    });
  </script>
<?php else: ?>
  <header class="head">
    <h1>Super Admin Dashboard</h1>
    <div>
      <span class="muted" id="inscritsHead">Inscrits Supabase : <?php echo (int) $inscritsHead; ?></span>
      <button class="mini" id="btnBack" type="button">Retour</button>
    </div>
  </header>
  <div class="wrap">
    <div class="sec">A · Inscriptions &amp; suivi pubs</div>
    <div class="metrics" id="gA"><?php foreach ($ADMIN_TABS['gA'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <div class="sec">B · Dépôts &amp; entrées d’argent</div>
    <div class="metrics" id="gB"><?php foreach ($ADMIN_TABS['gB'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <div class="sec">C · Retraits &amp; sorties d’argent</div>
    <div class="metrics" id="gC"><?php foreach ($ADMIN_TABS['gC'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <div class="sec">D · Jouants, balances &amp; jeux</div>
    <div class="metrics" id="gD"><?php foreach ($ADMIN_TABS['gD'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <div class="sec">E · Trafic, mails &amp; alertes</div>
    <div class="metrics" id="gE"><?php foreach ($ADMIN_TABS['gE'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>

    <div class="filters">
      <input id="q" type="search" placeholder="Rechercher ID, e-mail, téléphone">
      <select id="preset">
        <option value="all">Toutes dates</option>
        <option value="today">Aujourd’hui</option>
        <option value="yesterday">Hier</option>
        <option value="range">Plage personnalisée</option>
        <option value="date">Date unique</option>
      </select>
      <input id="cal" type="date" title="Date unique" style="display:none">
      <input id="dateFrom" type="date" title="Du" style="display:none">
      <input id="dateTo" type="date" title="Au" style="display:none">
      <input id="idFrom" placeholder="ORO-1" style="display:none;width:110px">
      <input id="idTo" placeholder="ORO-1000" style="display:none;width:110px">
    </div>
    <div class="panel-title" id="viewTitle">Inscrits</div>
    <p class="muted" id="viewSum"></p>
    <div class="table-wrap" id="panel"><p class="muted" style="padding:12px">Choisissez un bouton…</p></div>
    <div class="pager" id="pager"></div>
  </div>

  <div class="modal" id="userModal">
    <div class="modal-box">
      <button class="mini" type="button" id="closeModal">Fermer</button>
      <div id="userDetail"></div>
    </div>
  </div>

<script>
const TABS = [
  {g:'gA', id:'signup_today', k:'Inscriptions du Jour'},
  {g:'gA', id:'signup_yesterday', k:'Inscriptions d’Hier'},
  {g:'gA', id:'signup_date', k:'Inscriptions par Date'},
  {g:'gA', id:'signup_hour', k:'Inscriptions par Heure'},
  {g:'gA', id:'signup_geo', k:'Inscriptions par Pays / IP'},
  {g:'gA', id:'signup_idrange', k:'Recherche par Tranche d’ID'},
  {g:'gA', id:'no_deposit', k:'Joueurs Sans Dépôt'},
  {g:'gA', id:'signup_closed', k:'Comptes fermés / désinscrits'},
  {g:'gB', id:'dep_today', k:'Dépôts du Jour'},
  {g:'gB', id:'dep_pending', k:'Dépôts en Attente'},
  {g:'gB', id:'dep_failed', k:'Dépôts Échoués'},
  {g:'gB', id:'dep_top', k:'Meilleurs Déposants'},
  {g:'gB', id:'dep_all', k:'Historique Global Dépôts'},
  {g:'gB', id:'dep_method', k:'Dépôts par Méthode'},
  {g:'gC', id:'wd_pending', k:'Retraits en Cours'},
  {g:'gC', id:'wd_today', k:'Retraits Validés du Jour'},
  {g:'gC', id:'wd_all', k:'Historique Global Retraits'},
  {g:'gC', id:'wd_rejected', k:'Retraits Rejetés'},
  {g:'gC', id:'wd_volume', k:'Volume Total à Payer'},
  {g:'gC', id:'wd_suspect', k:'Suspect'},
  {g:'gD', id:'online', k:'Joueurs en Ligne'},
  {g:'gD', id:'payers', k:'Joueurs Actifs (Payeurs)'},
  {g:'gD', id:'top_balances', k:'Top Balances / Soldes'},
  {g:'gD', id:'top_winners', k:'Top Gagnants du Jour'},
  {g:'gD', id:'profit_today', k:'Bénéfice du Jour'},
  {g:'gD', id:'profit_7d', k:'Bénéfice 7 Jours'},
  {g:'gD', id:'profit_total', k:'Bénéfice Total'},
  {g:'gD', id:'open_positions', k:'Positions Ouvertes'},
  {g:'gD', id:'payout_stats', k:'Maxi Payout & Stats des Jeux'},
  {g:'gD', id:'games', k:'Statistiques des Jeux'},
  {g:'gD', id:'inactive', k:'Joueurs Inactifs'},
  {g:'gE', id:'traffic', k:'Sources de Trafic'},
  {g:'gE', id:'otp_mails', k:'Mails & Codes OTP Envoyés'},
  {g:'gE', id:'messages', k:'Messages'},
  {g:'gE', id:'alerts', k:'Santé du Site'},
];
let view = 'wd_pending';
let page = 1;
const TITLES = Object.fromEntries(TABS.map(t => [t.id, t.k]));

function ajax(body) {
  return fetch('admin.php?ajax=1', {
    method: 'POST',
    headers: {'Accept':'application/json','Content-Type':'application/json'},
    body: JSON.stringify(body)
  }).then(r => r.json());
}
function badgeClass(id, n) {
  if (id === 'alerts' || id === 'wd_suspect' || id === 'messages') return n > 0 ? 'badge red' : 'badge zero';
  return n ? 'badge' : 'badge zero';
}
const MONEY_BADGE = {wd_volume:1, profit_today:1, profit_7d:1, profit_total:1, payout_stats:1};
function fmtBadge(id, n) {
  if (MONEY_BADGE[id]) {
    const v = Number(n)||0;
    return v.toLocaleString('fr-FR', {maximumFractionDigits:2}) + ' $';
  }
  return String(n ?? 0);
}
function renderButtons(badges) {
  document.querySelectorAll('.metric-btn[data-view]').forEach(btn => {
    const id = btn.getAttribute('data-view');
    const n = badges[id];
    const el = btn.querySelector('[data-badge]');
    if (el && n != null) {
      el.className = badgeClass(id, n);
      el.textContent = fmtBadge(id, n);
    }
    btn.classList.toggle('on', view === id);
  });
}
document.querySelectorAll('.metric-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => { view = btn.getAttribute('data-view'); page = 1; loadList(); });
});
function filters() {
  const preset = document.getElementById('preset').value;
  document.getElementById('cal').style.display = (preset === 'date' || view === 'signup_date') ? '' : 'none';
  document.getElementById('dateFrom').style.display = preset === 'range' ? '' : 'none';
  document.getElementById('dateTo').style.display = preset === 'range' ? '' : 'none';
  const idr = view === 'signup_idrange';
  document.getElementById('idFrom').style.display = idr ? '' : 'none';
  document.getElementById('idTo').style.display = idr ? '' : 'none';
  return {
    q: document.getElementById('q').value,
    preset: (view === 'signup_date' && preset === 'all') ? 'date' : preset,
    cal: document.getElementById('cal').value,
    dateFrom: document.getElementById('dateFrom').value,
    dateTo: document.getElementById('dateTo').value,
    idFrom: document.getElementById('idFrom').value,
    idTo: document.getElementById('idTo').value,
    page
  };
}
async function loadBadges() {
  const j = await ajax({action:'badges'});
  if (!j.ok) return;
  renderButtons(j.badges || {});
  document.getElementById('inscritsHead').textContent = (j.badges.inscrits||0) + ' inscrits';
}
async function loadList() {
  document.getElementById('viewTitle').textContent = TITLES[view] || view;
  const j = await ajax(Object.assign({action:'list', view}, filters()));
  const panel = document.getElementById('panel');
  if (!j.ok) { panel.innerHTML = '<p class="muted" style="padding:12px">'+(j.reason||'Erreur')+'</p>'; return; }
  document.getElementById('viewSum').textContent = j.summary || '';
  let html = '<table><thead><tr>'+(j.cols||[]).map(c=>'<th>'+c+'</th>').join('');
  if (j.actions) html += '<th></th>';
  html += '</tr></thead><tbody>';
  (j.rows||[]).forEach(r => {
    const flag = r.flag || (r.suspect ? 'suspect' : '');
    html += '<tr class="'+(r.userId?'clickable':'')+(flag==='suspect'?' flag-suspect':'')+'" data-uid="'+(r.userId||'')+'">';
    (r.cells||[]).forEach(c => {
      const s = String(c);
      if (s === 'Suspect') html += '<td><span class="pill pill-suspect">Suspect</span></td>';
      else if (s === 'Vérifié' || s === 'OK') html += '<td><span class="pill pill-ok">'+s+'</span></td>';
      else if (s === 'Non lu') html += '<td><span class="pill pill-unread">Non lu</span></td>';
      else html += '<td>'+s.replace(/</g,'&lt;')+'</td>';
    });
    if (j.actions) {
      html += '<td>';
      if (r.pending && r.kind === 'withdraw') {
        html += '<button class="mini ok" data-act="approve" data-kind="wd" data-id="'+r.ref+'">Valider</button>';
        html += '<button class="mini bad" data-act="reject" data-kind="wd" data-id="'+r.ref+'">Rejeter</button>';
        html += '<button class="mini" data-act="suspend" data-kind="wd" data-id="'+r.ref+'" data-uid="'+(r.userId||'')+'">Suspendre</button>';
        html += '<button class="mini" data-act="silent" data-kind="wd" data-id="'+r.ref+'">Suppression silencieuse</button>';
      }
      if (r.pending && r.kind === 'deposit') {
        html += '<button class="mini ok" data-act="approve" data-kind="dep" data-id="'+r.ref+'">Valider</button>';
        html += '<button class="mini bad" data-act="reject" data-kind="dep" data-id="'+r.ref+'">Annuler</button>';
      }
      if (r.kind === 'message' && r.unread) {
        html += '<button class="mini ok" data-act="read" data-kind="msg" data-id="'+r.ref+'">Marquer lu</button>';
      }
      html += '</td>';
    }
    html += '</tr>';
  });
  html += '</tbody></table>';
  if (!(j.rows||[]).length) html = '<p class="muted" style="padding:12px">Aucune ligne pour ces filtres.</p>';
  panel.innerHTML = html;
  const pg = document.getElementById('pager');
  pg.innerHTML = j.pages > 1 ? ('Page '+j.page+' / '+j.pages+' <button class="mini" id="prevP">←</button> <button class="mini" id="nextP">→</button>') : '';
  const prev = document.getElementById('prevP'); const next = document.getElementById('nextP');
  if (prev) prev.onclick = () => { if (page>1){ page--; loadList(); } };
  if (next) next.onclick = () => { if (page < (j.pages||1)){ page++; loadList(); } };
  panel.querySelectorAll('tr.clickable').forEach(tr => tr.addEventListener('click', ev => {
    if (ev.target.closest('button')) return;
    openUser(tr.getAttribute('data-uid'));
  }));
  panel.querySelectorAll('button[data-act]').forEach(btn => btn.addEventListener('click', async ev => {
    ev.stopPropagation();
    const act = btn.getAttribute('data-act');
    const kind = btn.getAttribute('data-kind');
    const id = btn.getAttribute('data-id');
    if (kind === 'msg') {
      const r = await ajax({action:'mark_msg', id});
      if (!r.ok) alert(r.reason || 'Échec');
      loadBadges(); loadList();
      return;
    }
    let motif = '';
    if (act === 'reject') motif = prompt('Motif du rejet (le montant sera recrédité sur le solde du joueur) :','') || '';
    if (act === 'silent' && !confirm('Masquer cette ligne du tableau de bord, sans modifier le solde du joueur ?')) return;
    if (act === 'suspend' && !confirm('Suspendre ce compte et couper sa session immédiatement ?')) return;
    const a = kind === 'wd' ? 'resolve_wd' : 'resolve_dep';
    const r = await ajax({action:a, id, act, motif});
    if (!r.ok) alert(r.reason || 'Échec');
    loadBadges(); loadList();
  }));
  loadBadges();
}
async function openUser(uid) {
  if (!uid) return;
  const j = await ajax({action:'profile', userId: uid});
  if (!j.ok) return;
  const u = j.user;
  const tbl = (title, arr, cols, map) => {
    if (!arr.length) return '<p class="muted">'+title+' : aucun</p>';
    return '<h3 class="panel-title">'+title+'</h3><div class="table-wrap"><table><thead><tr>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>'+
      arr.map(map).join('')+'</tbody></table></div>';
  };
  document.getElementById('userDetail').innerHTML =
    '<h2 style="color:var(--gold);margin:8px 0 4px">'+(u.publicId||u.id)+'</h2>'+
    '<p class="muted">'+u.name+' · '+u.email+' · '+u.phone+'</p>'+
    '<p>IP : <strong>'+(u.ip||'—')+'</strong> · Pays : <strong>'+(u.country||'—')+'</strong> · Inscription : <strong>'+(u.createdAt||'—')+'</strong></p>'+
    '<p>Solde réel : <strong>'+u.real+' $</strong> · Source : '+(u.traffic||'direct')+' · Rôle : '+(u.role||'user')+'</p>'+
    '<p><input id="adjAmt" type="number" step="0.01" placeholder="Montant $" style="width:120px"> <input id="adjMotif" placeholder="Motif" style="width:200px"> '+
    '<button class="mini ok" id="btnCredit">Créditer</button> <button class="mini bad" id="btnDebit">Débiter</button> '+
    '<button class="mini bad" id="btnSuspend">Suspendre le compte</button> '+
    '<button class="mini bad" id="btnDeleteUser">Supprimer le compte</button></p>'+
    tbl('Dépôts', j.deposits, ['Réf','Montant','Méthode','Statut','Date'], d => '<tr><td>'+d.id+'</td><td>'+d.amount+'</td><td>'+d.method+'</td><td>'+d.status+'</td><td>'+(d.at||'')+'</td></tr>')+
    tbl('Retraits', j.withdrawals, ['Réf','Montant','Méthode','Destination','Statut','Date','Motif'], d => '<tr><td>'+d.id+'</td><td>'+d.amount+'</td><td>'+(d.method||'—')+'</td><td>'+(d.phone||'—')+'</td><td>'+d.status+'</td><td>'+(d.at||'')+'</td><td>'+(d.reason||'')+'</td></tr>')+
    tbl('Jeux', j.games, ['Jeu','Mise','Net','Résultat','Date'], d => '<tr><td>'+d.game+'</td><td>'+d.stake+'</td><td>'+d.net+'</td><td>'+(d.won===true?'gagné':d.won===false?'perdu':d.mode)+'</td><td>'+(d.at||'')+'</td></tr>');
  document.getElementById('userModal').classList.add('on');
  const go = async (delta) => {
    const motif = document.getElementById('adjMotif').value.trim();
    const amt = Number(document.getElementById('adjAmt').value);
    if (!motif || !amt) { alert('Montant et motif obligatoires'); return; }
    const r = await ajax({action:'adjust', userId:u.id, delta: delta * Math.abs(amt), motif});
    if (!r.ok) alert(r.reason||'Échec'); else { openUser(u.id); loadBadges(); }
  };
  document.getElementById('btnCredit').onclick = () => go(1);
  document.getElementById('btnDebit').onclick = () => go(-1);
  document.getElementById('btnSuspend').onclick = async () => {
    if (!confirm('Suspendre ce compte et couper sa session immédiatement ?')) return;
    const r = await ajax({action:'suspend', userId:u.id});
    if (!r.ok) alert(r.reason || 'Échec');
    else openUser(u.id);
  };
  document.getElementById('btnDeleteUser').onclick = async () => {
    if (!confirm('Supprimer définitivement ce compte, détruire ses sessions et lui interdire toute reconnexion ?')) return;
    const r = await ajax({action:'delete_user', userId:u.id});
    if (!r.ok) alert(r.reason || 'Échec');
    else document.getElementById('userModal').classList.remove('on');
    loadBadges(); loadList();
  };
}
document.getElementById('closeModal').onclick = () => document.getElementById('userModal').classList.remove('on');
document.getElementById('btnBack').onclick = () => { window.location.href = '/'; };
['q','preset','cal','dateFrom','dateTo','idFrom','idTo'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { page=1; loadList(); });
});
document.getElementById('q').addEventListener('keydown', e => { if (e.key==='Enter'){ page=1; loadList(); } });
document.getElementById('preset').addEventListener('change', filters);
loadBadges().then(loadList);
</script>
<?php endif; ?>
</body>
</html>
