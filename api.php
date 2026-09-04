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
    $incoming = $req['vault'];
    $serverReal = (int) ($db['vault'][$id]['real'] ?? 0);
    $clientReal = (int) ($incoming['real'] ?? 0);
    if ($serverReal > $clientReal) $incoming['real'] = $serverReal;
    $db['vault'][$id] = $incoming;
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
  echo json_encode([
    'ok' => true,
    'server' => true,
    'metrics' => metrics($db),
    'users' => $list,
    'withdrawals' => $db['withdrawals']
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
  if (!isset($db['orders']) || !is_array($db['orders'])) $db['orders'] = [];
  $open = 0;
  foreach ($db['orders'] as $o) {
    if (($o['id'] ?? '') === $oid) {
      echo json_encode(['ok' => true, 'server' => true, 'orderId' => $oid, 'payout' => $o['payout'] ?? 1.88, 'vault' => $db['vault'][$me['id']] ?? null, 'duplicate' => true]);
      exit;
    }
    if (($o['userId'] ?? '') === $me['id'] && ($o['status'] ?? '') === 'open') $open++;
  }
  if ($open >= 5) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Maximum 5 positions ouvertes']);
    exit;
  }
  $uid = $me['id'];
  if (!isset($db['vault'][$uid])) $db['vault'][$uid] = ['demo' => 50000, 'real' => 0];
  $bal = (int) ($db['vault'][$uid][$mode] ?? 0);
  if ($stake > $bal) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Solde insuffisant']);
    exit;
  }
  $db['vault'][$uid][$mode] = $bal - $stake;
  $pWin = $mode === 'real' ? 0.44 : 0.82;
  $won = (random_int(0, 10000) / 10000) < $pWin;
  $payout = $mode === 'real' ? 1.88 : (1.85 + (random_int(0, 100) / 1000));
  $db['orders'][] = [
    'id' => $oid,
    'userId' => $uid,
    'stake' => $stake,
    'side' => $side,
    'duration' => $duration,
    'mode' => $mode,
    'payout' => $payout,
    'won' => $won,
    'status' => 'open',
    'at' => microtime(true)
  ];
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'orderId' => $oid, 'payout' => $payout, 'vault' => $db['vault'][$uid]]);
  exit;
}

if ($action === 'settleOrder') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $oid = preg_replace('/[^a-zA-Z0-9_\-.]/', '', (string) ($req['orderId'] ?? ''));
  if (!isset($db['orders']) || !is_array($db['orders'])) $db['orders'] = [];
  foreach ($db['orders'] as &$o) {
    if (($o['id'] ?? '') !== $oid || ($o['userId'] ?? '') !== $me['id']) continue;
    $won = !empty($o['won']);
    $stake = (int) $o['stake'];
    $payout = (float) ($o['payout'] ?? 1.88);
    $credit = $won ? (int) floor($stake * $payout) : 0;
    $net = $won ? $credit - $stake : -$stake;
    if (($o['status'] ?? '') === 'open') {
      $elapsed = microtime(true) - (float) ($o['at'] ?? 0);
      if ($elapsed < max(0, ((int) $o['duration']) - 0.6)) {
        echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Position encore ouverte']);
        exit;
      }
      $mode = ($o['mode'] ?? 'demo') === 'real' ? 'real' : 'demo';
      if (!isset($db['vault'][$me['id']])) $db['vault'][$me['id']] = ['demo' => 0, 'real' => 0];
      if ($won) $db['vault'][$me['id']][$mode] = (int) $db['vault'][$me['id']][$mode] + $credit;
      $o['status'] = 'closed';
      save_db($file, $db);
    }
    echo json_encode([
      'ok' => true,
      'server' => true,
      'won' => $won,
      'net' => $net,
      'payout' => $payout,
      'vault' => $db['vault'][$me['id']] ?? null
    ]);
    exit;
  }
  echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Ordre introuvable']);
  exit;
}

if ($action === 'me') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  echo json_encode([
    'ok' => true,
    'server' => true,
    'user' => $me,
    'vault' => $db['vault'][$me['id']] ?? ['demo' => 0, 'real' => 0]
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
  echo json_encode(orolado_confirm_deposit(['token' => $token] + $req));
  exit;
}

echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Action inconnue']);
