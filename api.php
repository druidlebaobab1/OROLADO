<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'reason' => 'POST requis']);
  exit;
}

$ADMIN_EMAIL = 'admin@orolado.com';
$ADMIN_PASS = 'AdminOrolado2026!';
$SECRET = 'orolado-host-secret-2026';

require_once __DIR__ . '/orolado_lib.php';
orolado_load_env();

$dir = orolado_data_dir();
$file = orolado_data_file();

function hash_pw(string $pw): string {
  return hash('sha256', 'orolado|' . $pw);
}

function ensure_admin_user(array &$db, string $email, string $hash): array {
  $admin = find_user($db, $email);
  if (!$admin) {
    $admin = [
      'id' => 'admin_master',
      'displayName' => 'Orolado',
      'email' => $email,
      'phone' => '0000000000',
      'countryCode' => '+225',
      'passwordHash' => $hash,
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
    $db['users']['admin_master'] = $admin;
    $db['vault']['admin_master'] = ['demo' => 50000, 'real' => 0];
  } else {
    $admin['email'] = $email;
    $admin['role'] = 'admin';
    $admin['passwordHash'] = $hash;
    $db['users'][$admin['id']] = $admin;
  }
  return $admin;
}

function make_token(string $userId, string $secret): string {
  return hash('sha256', $userId . '|' . $secret . '|' . bin2hex(random_bytes(8)));
}

function find_user(array $db, string $email): ?array {
  foreach ($db['users'] as $u) {
    if (isset($u['email']) && strtolower($u['email']) === $email) return $u;
  }
  return null;
}

function session_user(array &$db, ?string $token): ?array {
  return orolado_session_user($db, $token);
}

function metrics(array $db): array {
  $deposits = 0;
  $pending = 0;
  $approved = 0;
  foreach ($db['users'] as $u) {
    foreach ($u['transactions'] ?? [] as $tx) {
      if (($tx['type'] ?? '') === 'deposit' && (($tx['mode'] ?? 'real') === 'real' || empty($tx['mode']))) {
        $deposits += (int) ($tx['amount'] ?? 0);
      }
    }
  }
  foreach ($db['withdrawals'] as $w) {
    if (($w['status'] ?? '') === 'pending') $pending += (int) $w['amount'];
    if (($w['status'] ?? '') === 'approved') $approved += (int) $w['amount'];
  }
  return [
    'deposits' => $deposits,
    'pending' => $pending,
    'withdrawals' => $pending + $approved,
    'profit' => $deposits - $approved,
    'users' => count($db['users'])
  ];
}

$raw = file_get_contents('php://input');
$req = json_decode($raw ?: '', true);
if (!is_array($req)) {
  echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Requête invalide']);
  exit;
}

$action = $req['action'] ?? '';
$token = $req['token'] ?? '';
$db = load_db($file);

if ($action === 'ping') {
  echo json_encode([
    'ok' => true,
    'server' => true,
    'writable' => is_dir($dir) && is_writable($dir)
  ]);
  exit;
}

if ($action === 'ensureAdmin') {
  $admin = ensure_admin_user($db, $ADMIN_EMAIL, hash_pw($ADMIN_PASS));
  $saved = save_db($file, $db);
  echo json_encode(['ok' => $saved, 'server' => true, 'writable' => $saved, 'id' => $admin['id']]);
  exit;
}

if ($action === 'register') {
  $user = $req['user'] ?? null;
  $vault = $req['vault'] ?? ['demo' => 50000, 'real' => 0];
  if (!is_array($user) || empty($user['email']) || empty($user['id'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Inscription invalide']);
    exit;
  }
  $email = strtolower(trim($user['email']));
  if (find_user($db, $email)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Un compte existe déjà avec cet e-mail']);
    exit;
  }
  $user['email'] = $email;
  $user['role'] = 'user';
  $db['users'][$user['id']] = $user;
  $vault = [
    'demo' => (int) ($vault['demo'] ?? 50000),
    'real' => 0
  ];
  $db['vault'][$user['id']] = $vault;
  $tok = make_token($user['id'], $SECRET);
  $db['sessions'][$tok] = ['userId' => $user['id'], 'at' => date('c')];
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'user' => $user, 'vault' => $vault, 'token' => $tok]);
  exit;
}

if ($action === 'login') {
  $email = strtolower(trim($req['email'] ?? ''));
  $password = (string) ($req['password'] ?? '');
  $user = find_user($db, $email);
  if ($email === $ADMIN_EMAIL && $password === $ADMIN_PASS) {
    $user = ensure_admin_user($db, $ADMIN_EMAIL, hash_pw($ADMIN_PASS));
    save_db($file, $db);
  } elseif (!$user || empty($user['passwordHash']) || !hash_equals($user['passwordHash'], hash_pw($password))) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Identifiants introuvables']);
    exit;
  }
  $tok = make_token($user['id'], $SECRET);
  $db['sessions'][$tok] = ['userId' => $user['id'], 'at' => date('c')];
  save_db($file, $db);
  $vault = $db['vault'][$user['id']] ?? ['demo' => 0, 'real' => 0];
  echo json_encode(['ok' => true, 'server' => true, 'user' => $user, 'vault' => $vault, 'token' => $tok]);
  exit;
}

if ($action === 'upsert') {
  $me = session_user($db, $token);
  $user = $req['user'] ?? null;
  if (!$me || !is_array($user) || ($me['id'] !== $user['id'] && ($me['role'] ?? '') !== 'admin')) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $id = $user['id'];
  $existing = $db['users'][$id] ?? [];
  $user['role'] = $existing['role'] ?? 'user';
  if ($id === 'admin_master') $user['role'] = 'admin';
  $db['users'][$id] = $user;
  if (isset($req['vault']) && is_array($req['vault'])) {
    $serverReal = (int) ($db['vault'][$id]['real'] ?? 0);
    $db['vault'][$id] = [
      'demo' => (int) ($req['vault']['demo'] ?? ($db['vault'][$id]['demo'] ?? 0)),
      'real' => $serverReal
    ];
  }
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true]);
  exit;
}

if ($action === 'admin') {
  $me = session_user($db, $token);
  if (!$me || ($me['role'] ?? '') !== 'admin') {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Accès admin refusé']);
    exit;
  }
  $list = [];
  foreach ($db['users'] as $id => $u) {
    $v = $db['vault'][$id] ?? ['demo' => 0, 'real' => 0];
    $list[] = [
      'id' => $id,
      'displayName' => $u['displayName'] ?? '',
      'email' => $u['email'] ?? '',
      'phone' => $u['phone'] ?? '',
      'countryCode' => $u['countryCode'] ?? '',
      'role' => $u['role'] ?? 'user',
      'createdAt' => $u['createdAt'] ?? '',
      'realBalance' => $v['real'] ?? 0,
      'demoBalance' => $v['demo'] ?? 0,
      'realTrades' => $u['realTrades'] ?? 0
    ];
  }
  $deps = [];
  foreach (($db['deposits'] ?? []) as $d) {
    if (strtoupper((string) ($d['status'] ?? '')) !== 'PENDING') continue;
    $uid = (string) ($d['userId'] ?? '');
    $deps[] = [
      'ref' => (string) ($d['id'] ?? $d['ref'] ?? ''),
      'userId' => $uid,
      'name' => (string) ($db['users'][$uid]['displayName'] ?? ''),
      'email' => (string) ($db['users'][$uid]['email'] ?? ''),
      'amount' => (int) ($d['amount'] ?? 0),
      'operator' => (string) ($d['operator'] ?? ''),
      'at' => (string) ($d['createdAt'] ?? $d['at'] ?? '')
    ];
  }
  $deps = array_slice(array_reverse($deps), 0, 40);
  echo json_encode([
    'ok' => true,
    'server' => true,
    'metrics' => metrics($db),
    'users' => $list,
    'withdrawals' => $db['withdrawals'],
    'deposits' => $deps
  ]);
  exit;
}

// Validation manuelle d'un dépôt par l'admin (paiement reçu mais webhook muet).
if ($action === 'resolveDeposit') {
  $me = session_user($db, $token);
  if (!$me || ($me['role'] ?? '') !== 'admin') {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Accès admin refusé']);
    exit;
  }
  $ref = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($req['ref'] ?? '')) ?? '';
  if ($ref === '') {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Référence invalide']);
    exit;
  }
  if (empty($req['approve'])) {
    foreach ($db['deposits'] as $i => $d) {
      if ((string) ($d['id'] ?? '') === $ref || (string) ($d['ref'] ?? '') === $ref) {
        $db['deposits'][$i]['status'] = 'CANCELED';
        save_db($file, $db);
        echo json_encode(['ok' => true, 'server' => true, 'status' => 'CANCELED']);
        exit;
      }
    }
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Dépôt introuvable']);
    exit;
  }
  $amount = (int) ($req['amount'] ?? 0);
  $res = credit_paid_deposit(['ref' => $ref, 'amount' => $amount, 'paid' => true, 'manual' => true]);
  if (empty($res['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => (string) ($res['reason'] ?? 'unknown')]);
    exit;
  }
  echo json_encode([
    'ok' => true,
    'server' => true,
    'amount' => (int) ($res['amount'] ?? $amount),
    'duplicate' => !empty($res['duplicate'])
  ]);
  exit;
}

if ($action === 'adjust') {
  $me = session_user($db, $token);
  if (!$me || ($me['role'] ?? '') !== 'admin') {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Accès admin refusé']);
    exit;
  }
  $uid = $req['userId'] ?? '';
  $delta = (int) ($req['delta'] ?? 0);
  if (!isset($db['vault'][$uid])) $db['vault'][$uid] = ['demo' => 0, 'real' => 0];
  $db['vault'][$uid]['real'] = max(0, (int) $db['vault'][$uid]['real'] + $delta);
  save_db($file, $db);
  supabase_credit_real((string) $uid, $delta);
  echo json_encode(['ok' => true, 'server' => true, 'real' => $db['vault'][$uid]['real']]);
  exit;
}

if ($action === 'withdraw') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $amount = (int) ($req['amount'] ?? 0);
  $real = (int) ($db['vault'][$me['id']]['real'] ?? 0);
  if ($amount < 200 || $amount > $real) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Montant invalide']);
    exit;
  }
  $operator = preg_replace('/[^a-z]/', '', strtolower((string) ($req['operator'] ?? 'wave')));
  if (!in_array($operator, ['wave', 'orange', 'mtn', 'moov'], true)) $operator = 'wave';
  $phone = preg_replace('/\D/', '', (string) ($req['phone'] ?? ''));
  $beneficiary = trim((string) ($req['beneficiary'] ?? $me['displayName'] ?? ''));
  $countryCode = preg_replace('/[^\d+]/', '', (string) ($req['countryCode'] ?? $me['countryCode'] ?? '+225'));
  if (strlen($phone) < 8) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Numéro Mobile Money invalide']);
    exit;
  }
  if (strlen($beneficiary) < 3) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Nom du bénéficiaire requis']);
    exit;
  }
  $suspect = (($me['realTrades'] ?? 0) === 0) || (($me['realStakeVolume'] ?? 0) < $amount);
  $db['vault'][$me['id']]['real'] = $real - $amount;
  $db['withdrawals'][] = [
    'id' => uniqid('wd_', true),
    'userId' => $me['id'],
    'name' => $beneficiary,
    'email' => $me['email'] ?? '',
    'amount' => $amount,
    'status' => 'pending',
    'suspect' => $suspect,
    'operator' => $operator,
    'phone' => $phone,
    'beneficiary' => $beneficiary,
    'countryCode' => $countryCode,
    'at' => date('c'),
    'clock' => date('H:i:s')
  ];
  $db['withdrawals'] = array_values(array_reverse($db['withdrawals']));
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'suspect' => $suspect, 'vault' => $db['vault'][$me['id']]]);
  exit;
}

if ($action === 'resolveWithdraw') {
  $me = session_user($db, $token);
  if (!$me || ($me['role'] ?? '') !== 'admin') {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Accès admin refusé']);
    exit;
  }
  $id = $req['id'] ?? '';
  $approve = !empty($req['approve']);
  foreach ($db['withdrawals'] as &$w) {
    if (($w['id'] ?? '') === $id && ($w['status'] ?? '') === 'pending') {
      $w['status'] = $approve ? 'approved' : 'rejected';
      if (!$approve && isset($db['vault'][$w['userId']])) {
        $db['vault'][$w['userId']]['real'] += (int) $w['amount'];
      }
      save_db($file, $db);
      echo json_encode(['ok' => true, 'server' => true]);
      exit;
    }
  }
  echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Retrait introuvable']);
  exit;
}

if ($action === 'placeOrder') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $stake = (int) ($req['stake'] ?? 0);
  $side = (($req['side'] ?? '') === 'put') ? 'put' : 'call';
  $duration = (int) ($req['duration'] ?? 10);
  if (!in_array($duration, [10, 30, 60], true)) $duration = 10;
  $mode = (($req['mode'] ?? '') === 'real') ? 'real' : 'demo';
  $oid = preg_replace('/[^a-zA-Z0-9_\-.]/', '', (string) ($req['id'] ?? ''));
  if ($stake < 100 || $oid === '') {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Mise invalide']);
    exit;
  }
  $uid = (string) $me['id'];
  if (!isset($db['orders']) || !is_array($db['orders'])) $db['orders'] = [];
  foreach ($db['orders'] as $o) {
    if (($o['id'] ?? '') === $oid) {
      echo json_encode(['ok' => true, 'server' => true, 'orderId' => $oid, 'payout' => $o['payout'] ?? 1.88, 'vault' => $db['vault'][$uid] ?? null, 'duplicate' => true]);
      exit;
    }
  }
  $payout = $mode === 'real' ? 1.88 : (1.85 + (random_int(0, 100) / 1000));
  if ($mode === 'real') {
    $sbVault = supabase_admin_vault($uid);
    $jsonReal = (int) (($db['vault'][$uid]['real'] ?? 0));
    $minReal = max($jsonReal, $sbVault ? (int) $sbVault['real'] : 0);
    supabase_sync_real_min($uid, $minReal);
    if (!supabase_debit_real($uid, $stake)) {
      echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Solde insuffisant']);
      exit;
    }
  }
  $placed = with_db_lock(function ($box) use ($uid, $oid, $stake, $side, $duration, $mode, $payout) {
    $locked =& $box->db;
    if (!isset($locked['orders']) || !is_array($locked['orders'])) $locked['orders'] = [];
    foreach ($locked['orders'] as $o) {
      if (($o['id'] ?? '') === $oid) {
        return [
          'ok' => true,
          'orderId' => $oid,
          'payout' => $o['payout'] ?? $payout,
          'vault' => $locked['vault'][$uid] ?? null,
          'duplicate' => true,
          'skip_write' => true
        ];
      }
    }
    // Un seul trade actif. Les ordres dont l'échéance est dépassée depuis plus
    // de 30 s ne bloquent pas : un règlement perdu ne condamne pas le compte.
    $now = microtime(true);
    $open = 0;
    foreach ($locked['orders'] as $o) {
      if (($o['userId'] ?? '') !== $uid || ($o['status'] ?? '') !== 'open') continue;
      $deadline = (float) ($o['at'] ?? 0) + (int) ($o['duration'] ?? 10) + 30;
      if ($deadline > $now) $open++;
    }
    if ($open >= 1) {
      return ['ok' => false, 'reason' => 'Un trade est déjà en cours', 'skip_write' => true];
    }
    if (!isset($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 50000, 'real' => 0];
    $bal = (int) ($locked['vault'][$uid][$mode] ?? 0);
    if ($mode !== 'real' && $stake > $bal) {
      return ['ok' => false, 'reason' => 'Solde insuffisant', 'skip_write' => true];
    }
    if ($mode !== 'real') $locked['vault'][$uid][$mode] = $bal - $stake;
    else $locked['vault'][$uid]['real'] = max(0, $bal - $stake);
    $locked['orders'][] = [
      'id' => $oid,
      'userId' => $uid,
      'stake' => $stake,
      'side' => $side,
      'duration' => $duration,
      'mode' => $mode,
      'payout' => $payout,
      'won' => null,
      'status' => 'open',
      'at' => microtime(true)
    ];
    return ['ok' => true, 'orderId' => $oid, 'payout' => $payout, 'vault' => $locked['vault'][$uid]];
  });
  if (empty($placed['ok'])) {
    if ($mode === 'real') supabase_credit_real($uid, $stake, false);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $placed['reason'] ?? 'Ordre refusé']);
    exit;
  }
  if (!empty($placed['duplicate']) && $mode === 'real') {
    supabase_credit_real($uid, $stake, false);
  }
  $outVault = $placed['vault'] ?? ($db['vault'][$uid] ?? ['demo' => 0, 'real' => 0]);
  $sbAfter = supabase_admin_vault($uid);
  if ($sbAfter) {
    $outVault['real'] = (int) $sbAfter['real'];
    $outVault['demo'] = (int) ($sbAfter['demo'] ?? ($outVault['demo'] ?? 0));
  }
  echo json_encode(['ok' => true, 'server' => true, 'orderId' => $oid, 'payout' => $placed['payout'] ?? $payout, 'vault' => $outVault, 'duplicate' => !empty($placed['duplicate'])]);
  exit;
}

if ($action === 'settleOrder') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $oid = preg_replace('/[^a-zA-Z0-9_\-.]/', '', (string) ($req['orderId'] ?? ''));
  $wantWon = array_key_exists('won', $req) ? !empty($req['won']) : null;
  $uid = (string) $me['id'];
  $settled = with_db_lock(function ($box) use ($oid, $uid, $wantWon) {
    $locked =& $box->db;
    if (!isset($locked['orders']) || !is_array($locked['orders'])) $locked['orders'] = [];
    foreach ($locked['orders'] as &$o) {
      if (($o['id'] ?? '') !== $oid || ($o['userId'] ?? '') !== $uid) continue;
      $won = $wantWon !== null ? $wantWon : !empty($o['won']);
      $stake = (int) $o['stake'];
      $payout = (float) ($o['payout'] ?? 1.88);
      $credit = $won ? (int) floor($stake * $payout) : 0;
      $net = $won ? $credit - $stake : -$stake;
      $mode = ($o['mode'] ?? 'demo') === 'real' ? 'real' : 'demo';
      if (($o['status'] ?? '') === 'open') {
        $elapsed = microtime(true) - (float) ($o['at'] ?? 0);
        if ($elapsed < max(0, ((int) $o['duration']) - 0.6)) {
          return ['ok' => false, 'reason' => 'Position encore ouverte', 'skip_write' => true];
        }
        if (!isset($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 0, 'real' => 0];
        if ($won) $locked['vault'][$uid][$mode] = (int) $locked['vault'][$uid][$mode] + $credit;
        $o['won'] = $won;
        $o['status'] = 'closed';
        return [
          'ok' => true,
          'won' => $won,
          'net' => $net,
          'payout' => $payout,
          'credit' => $credit,
          'mode' => $mode,
          'fresh' => true,
          'vault' => $locked['vault'][$uid]
        ];
      }
      return [
        'ok' => true,
        'won' => $won,
        'net' => $net,
        'payout' => $payout,
        'credit' => 0,
        'mode' => $mode,
        'fresh' => false,
        'vault' => $locked['vault'][$uid] ?? ['demo' => 0, 'real' => 0],
        'skip_write' => true
      ];
    }
    unset($o);
    return ['ok' => false, 'reason' => 'Ordre introuvable', 'skip_write' => true];
  });
  if (empty($settled['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $settled['reason'] ?? 'Ordre introuvable']);
    exit;
  }
  $vaultOut = $settled['vault'] ?? ['demo' => 0, 'real' => 0];
  $rpcReal = null;
  if (($settled['mode'] ?? '') === 'real') {
    // Une seule source de vérité pour le solde réel : l'addition faite par la base.
    $rpc = supabase_resolve_trade($uid, $oid, (int) ($settled['credit'] ?? 0));
    if ($rpc !== null) $rpcReal = (int) $rpc['real'];
    elseif (!empty($settled['fresh']) && (int) ($settled['credit'] ?? 0) > 0) {
      supabase_credit_real($uid, (int) $settled['credit'], false);
    }
  }
  $sbVault = supabase_admin_vault($uid);
  if ($rpcReal !== null) {
    $vaultOut['real'] = $rpcReal;
    if ($sbVault) $vaultOut['demo'] = max((int) $vaultOut['demo'], (int) $sbVault['demo']);
  } elseif ($sbVault) {
    $vaultOut['real'] = max((int) $vaultOut['real'], (int) $sbVault['real']);
    $vaultOut['demo'] = max((int) $vaultOut['demo'], (int) $sbVault['demo']);
  }
  $won = !empty($settled['won']);
  $net = (int) ($settled['net'] ?? 0);
  $payout = (float) ($settled['payout'] ?? 1.88);
  echo json_encode([
    'ok' => true,
    'server' => true,
    'won' => $won,
    'net' => $net,
    'payout' => $payout,
    'vault' => $vaultOut
  ]);
  exit;
}

if ($action === 'financeHistory') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $rows = [];
  foreach (($db['deposits'] ?? []) as $d) {
    if (($d['userId'] ?? '') !== $me['id']) continue;
    $rows[] = [
      'at' => $d['paidAt'] ?? $d['at'] ?? '',
      'ref' => $d['id'] ?? $d['ref'] ?? '',
      'amount' => (int) ($d['amount'] ?? 0),
      'status' => strtoupper((string) ($d['status'] ?? 'PENDING')),
      'label' => 'Recharge'
    ];
  }
  foreach (($db['withdrawals'] ?? []) as $w) {
    if (($w['userId'] ?? '') !== $me['id']) continue;
    $rows[] = [
      'at' => $w['at'] ?? '',
      'ref' => $w['id'] ?? '',
      'amount' => -abs((int) ($w['amount'] ?? 0)),
      'status' => (string) ($w['status'] ?? 'pending'),
      'label' => 'Retrait'
    ];
  }
  echo json_encode(['ok' => true, 'server' => true, 'rows' => $rows]);
  exit;
}

if ($action === 'me') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $vault = $db['vault'][$me['id']] ?? ['demo' => 0, 'real' => 0];
  $sbVault = supabase_admin_vault((string) $me['id']);
  if ($sbVault) {
    $vault['real'] = max((int) $vault['real'], (int) $sbVault['real']);
    $vault['demo'] = max((int) $vault['demo'], (int) $sbVault['demo']);
  }
  echo json_encode([
    'ok' => true,
    'server' => true,
    'user' => $me,
    'vault' => $vault
  ]);
  exit;
}

if ($action === 'startDeposit' || $action === 'initiateDeposit') {
  echo json_encode(orolado_initiate_deposit(['token' => $token] + $req));
  exit;
}

if ($action === 'depositStatus') {
  echo json_encode(orolado_deposit_status(['token' => $token] + $req));
  exit;
}

if ($action === 'confirmDeposit') {
  maketou_log('deposit_confirm_in_api', [
    'ref' => (string) ($req['ref'] ?? ''),
    'returnStatus' => (string) ($req['returnStatus'] ?? ''),
    'returnParams' => $req['returnParams'] ?? null,
  ]);
  echo json_encode(orolado_confirm_deposit(['token' => $token] + $req));
  exit;
}

echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Action inconnue']);
