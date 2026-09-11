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

require_once __DIR__ . '/orolado_lib.php';
orolado_load_env();

$ADMIN_EMAIL = strtolower(trim((string) (getenv('ADMIN_EMAIL') ?: ($_ENV['ADMIN_EMAIL'] ?? 'admin@orolado.com'))));
if ($ADMIN_EMAIL === '') $ADMIN_EMAIL = 'admin@orolado.com';
$ADMIN_PASS = trim((string) (getenv('ADMIN_PASSWORD') ?: ($_ENV['ADMIN_PASSWORD'] ?? '')));
if ($ADMIN_PASS === '') $ADMIN_PASS = orolado_master_admin_password();
$SECRET = 'orolado-host-secret-2026';

$dir = orolado_data_dir();
$file = orolado_data_file();

function hash_pw(string $pw): string {
  return hash('sha256', 'orolado|' . $pw);
}

function orolado_pass_matches(string $password, string $storedHash): bool {
  return orolado_verify_password($password, $storedHash);
}

function orolado_admin_pass_ok(string $password, ?array $user, string $adminPass): bool {
  return orolado_admin_password_ok($password, $user);
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
    $db['vault']['admin_master'] = ['demo' => 1000000, 'real' => 0];
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

function is_admin_account(array $db, string $userId): bool {
  if ($userId === '' || $userId === 'admin_master') return true;
  $u = $db['users'][$userId] ?? null;
  if (!is_array($u)) return false;
  if (($u['role'] ?? '') === 'admin') return true;
  if (!empty($u['is_admin'])) return true;
  $mail = strtolower((string) ($u['email'] ?? ''));
  if ($mail === 'admin@orolado.com' || $mail === 'admin@6diablo.com') return true;
  $pid = strtoupper((string) ($u['publicId'] ?? ''));
  if ($pid === 'ORO-568782') return true;
  return false;
}

function metrics(array $db): array {
  $deposits = 0;
  $pendingWd = 0;
  $paidWd = 0;
  $exposure = 0;
  $userCount = 0;
  // Dépôts validés uniquement (COMPLETED/PAID) — hors compte admin.
  foreach (($db['deposits'] ?? []) as $d) {
    $uid = (string) ($d['userId'] ?? $d['user_id'] ?? '');
    if ($uid !== '' && is_admin_account($db, $uid)) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st === 'COMPLETED' || $st === 'PAID') $deposits += (int) ($d['amount'] ?? 0);
  }
  if ($deposits === 0) {
    foreach ($db['users'] as $uid => $u) {
      if (is_admin_account($db, (string) $uid)) continue;
      foreach ($u['transactions'] ?? [] as $tx) {
        if (($tx['type'] ?? '') === 'deposit' && (($tx['mode'] ?? 'real') === 'real' || empty($tx['mode']))) {
          $deposits += (int) ($tx['amount'] ?? 0);
        }
      }
    }
  }
  foreach ($db['withdrawals'] as $w) {
    $uid = (string) ($w['userId'] ?? $w['user_id'] ?? '');
    if ($uid !== '' && is_admin_account($db, $uid)) continue;
    if (($w['status'] ?? '') === 'pending') $pendingWd += (int) $w['amount'];
    if (($w['status'] ?? '') === 'approved') $paidWd += (int) $w['amount'];
  }
  foreach ($db['vault'] as $uid => $v) {
    if (is_admin_account($db, (string) $uid)) continue;
    $exposure += (int) ($v['real'] ?? 0);
  }
  foreach ($db['users'] as $uid => $u) {
    if (is_admin_account($db, (string) $uid)) continue;
    $userCount++;
  }
  return [
    'deposits' => $deposits,
    'pending' => $pendingWd,
    'withdrawals' => $paidWd,
    'exposure' => $exposure,
    'profit' => $deposits - $paidWd - $exposure,
    'users' => $userCount
  ];
}

function alloc_public_id(array &$db): string {
  $used = [];
  foreach ($db['users'] as $u) {
    $p = (string) ($u['publicId'] ?? '');
    if ($p !== '') $used[$p] = true;
  }
  for ($i = 0; $i < 40; $i++) {
    $pid = 'ORO-' . (string) random_int(100000, 999999);
    if (empty($used[$pid])) return $pid;
  }
  return 'ORO-' . substr((string) time(), -6);
}

function admin_log(array &$db, string $adminEmail, string $targetPublicId, string $type, int $amount, string $motif): void {
  if (!isset($db['admin_logs']) || !is_array($db['admin_logs'])) $db['admin_logs'] = [];
  array_unshift($db['admin_logs'], [
    'adminEmail' => $adminEmail,
    'targetPublicId' => $targetPublicId,
    'type' => $type,
    'amount' => $amount,
    'motif' => $motif,
    'at' => date('c')
  ]);
  $db['admin_logs'] = array_slice($db['admin_logs'], 0, 500);
}

$raw = file_get_contents('php://input');
$req = json_decode($raw ?: '', true);
if (!is_array($req)) {
  echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Requête invalide']);
  exit;
}

$action = $req['action'] ?? '';
$token = trim((string) ($req['token'] ?? ''));
if ($token === '') $token = trim((string) ($_COOKIE['oro_token'] ?? ''));

if ($action === 'geo') {
  $cc = strtoupper(trim((string) (
    $_SERVER['HTTP_CF_IPCOUNTRY']
    ?? $_SERVER['HTTP_X_COUNTRY_CODE']
    ?? $_SERVER['GEOIP_COUNTRY_CODE']
    ?? ''
  )));
  if ($cc === 'XX' || $cc === 'T1' || $cc === 'A1' || $cc === 'A2') $cc = '';
  echo json_encode(['ok' => true, 'server' => true, 'country' => $cc]);
  exit;
}

$db = load_db($file);
orolado_bootstrap_admin($db, $file);

if ($action === 'ping') {
  echo json_encode([
    'ok' => true,
    'server' => true,
    'writable' => is_dir($dir) && is_writable($dir)
  ]);
  exit;
}

if ($action === 'presence') {
  $me = session_user($db, $token);
  if ($me && !empty($me['id'])) {
    $db['users'][$me['id']]['lastSeen'] = date('c');
    save_db($file, $db);
  }
  echo json_encode(['ok' => true, 'server' => true]);
  exit;
}

if ($action === 'ensureAdmin') {
  orolado_deny_admin();
}

if ($action === 'registerStart') {
  $email = strtolower(trim((string) ($req['email'] ?? '')));
  $displayName = trim((string) ($req['displayName'] ?? ''));
  $phone = preg_replace('/\D/', '', (string) ($req['phone'] ?? ''));
  $countryCode = preg_replace('/[^\d+]/', '', (string) ($req['countryCode'] ?? '+225'));
  $passwordHash = trim((string) ($req['passwordHash'] ?? ''));
  $trafficSource = strtolower(trim((string) ($req['trafficSource'] ?? 'direct')));
  if ($trafficSource === '') $trafficSource = 'direct';
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Adresse e-mail invalide', 'field' => 'regEmail']);
    exit;
  }
  if (orolado_is_reserved_admin_email($email)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Un compte existe déjà avec cet e-mail', 'field' => 'regEmail']);
    exit;
  }
  if (strlen($displayName) < 2 || strlen($displayName) > 32) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Indiquez votre nom ou pseudo (2 caractères min.)', 'field' => 'regName']);
    exit;
  }
  // Téléphone optionnel (plus collecté à l’inscription).
  if (strlen($phone) > 0 && (strlen($phone) < 8 || strlen($phone) > 12)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Numéro de téléphone invalide', 'field' => 'regPhone']);
    exit;
  }
  if (strlen($passwordHash) < 16) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Mot de passe invalide', 'field' => 'regPass']);
    exit;
  }
  if (find_user($db, $email)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Un compte existe déjà avec cet e-mail', 'field' => 'regEmail']);
    exit;
  }
  orolado_purge_expired_pending($db);
  orolado_pending_regs($db);
  $pending =& $db['pendingRegistrations'];
  if (!is_array($pending)) $pending = [];
  $prev = $pending[$email] ?? null;
  $now = time();
  if (is_array($prev) && !empty($prev['lastSentAt']) && ($now - (int) $prev['lastSentAt']) < 60) {
    $wait = 60 - ($now - (int) $prev['lastSentAt']);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Patientez ' . $wait . ' s avant de renvoyer un code', 'retryIn' => $wait]);
    exit;
  }
  $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $pending[$email] = [
    'displayName' => $displayName,
    'email' => $email,
    'phone' => $phone,
    'countryCode' => $countryCode !== '' ? $countryCode : '+225',
    'passwordHash' => $passwordHash,
    'trafficSource' => $trafficSource,
    'codeHash' => orolado_otp_hash($email, $code),
    'expiresAt' => $now + 600,
    'lastSentAt' => $now,
    'attempts' => 0,
    'createdAt' => date('c')
  ];
  $db['pendingRegistrations'] = $pending;
  $sent = brevo_send_otp($email, $code);
  if (empty($sent['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $sent['reason'] ?? 'Impossible d’envoyer le code. Réessayez.']);
    exit;
  }
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'pendingOtp' => true, 'email' => $email, 'expiresIn' => 600, 'resendIn' => 60]);
  exit;
}

if ($action === 'registerResend') {
  $email = strtolower(trim((string) ($req['email'] ?? '')));
  orolado_purge_expired_pending($db);
  $row = $db['pendingRegistrations'][$email] ?? null;
  if (!is_array($row)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Aucune d’inscription introuvable. Recommencez.']);
    exit;
  }
  $now = time();
  if (!empty($row['expiresAt']) && (int) $row['expiresAt'] < $now) {
    unset($db['pendingRegistrations'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré. Recommencez l’inscription.']);
    exit;
  }
  if (!empty($row['lastSentAt']) && ($now - (int) $row['lastSentAt']) < 60) {
    $wait = 60 - ($now - (int) $row['lastSentAt']);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Patientez ' . $wait . ' s', 'retryIn' => $wait]);
    exit;
  }
  $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $row['codeHash'] = orolado_otp_hash($email, $code);
  $row['expiresAt'] = $now + 600;
  $row['lastSentAt'] = $now;
  $row['attempts'] = 0;
  $db['pendingRegistrations'][$email] = $row;
  $sent = brevo_send_otp($email, $code);
  if (empty($sent['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $sent['reason'] ?? 'Envoi impossible']);
    exit;
  }
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'resendIn' => 60, 'expiresIn' => 600]);
  exit;
}

if ($action === 'registerVerify') {
  $email = strtolower(trim((string) ($req['email'] ?? '')));
  $code = preg_replace('/\D/', '', (string) ($req['code'] ?? ''));
  orolado_purge_expired_pending($db);
  $row = $db['pendingRegistrations'][$email] ?? null;
  if (!is_array($row)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session d’inscription introuvable. Recommencez.']);
    exit;
  }
  $now = time();
  if (!empty($row['expiresAt']) && (int) $row['expiresAt'] < $now) {
    unset($db['pendingRegistrations'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré. Demandez un nouveau code ou recommencez.']);
    exit;
  }
  $attempts = (int) ($row['attempts'] ?? 0);
  if ($attempts >= 8) {
    unset($db['pendingRegistrations'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Trop de tentatives. Recommencez l’inscription.']);
    exit;
  }
  if (strlen($code) !== 6 || !hash_equals((string) ($row['codeHash'] ?? ''), orolado_otp_hash($email, $code))) {
    $row['attempts'] = $attempts + 1;
    $db['pendingRegistrations'][$email] = $row;
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code incorrect. Vérifiez votre e-mail.']);
    exit;
  }
  if (find_user($db, $email)) {
    unset($db['pendingRegistrations'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Un compte existe déjà avec cet e-mail']);
    exit;
  }
  $uid = 'u_' . bin2hex(random_bytes(8));
  $user = [
    'id' => $uid,
    'displayName' => (string) ($row['displayName'] ?? 'Membre'),
    'email' => $email,
    'phone' => (string) ($row['phone'] ?? ''),
    'countryCode' => (string) ($row['countryCode'] ?? '+225'),
    'passwordHash' => (string) ($row['passwordHash'] ?? ''),
    'role' => 'user',
    'createdAt' => date('c'),
    'mode' => 'demo',
    'assetId' => 'v100',
    'duration' => 10,
    'trades' => 0,
    'wins' => 0,
    'realTrades' => 0,
    'realStakeVolume' => 0,
    'realDepositTotal' => 0,
    'trafficSource' => (string) ($row['trafficSource'] ?? 'direct'),
    'publicId' => alloc_public_id($db),
    'transactions' => [],
    'positions' => []
  ];
  $vault = ['demo' => 1000000, 'real' => 0];
  $db['users'][$uid] = $user;
  $db['vault'][$uid] = $vault;
  unset($db['pendingRegistrations'][$email]);
  $tok = make_token($uid, $SECRET);
  $db['sessions'][$tok] = orolado_new_session($uid);
  orolado_set_session_cookie($tok);
  $welcome = ['ok' => false];
  if (!brevo_welcome_already_sent($db, $email)) {
    $welcome = brevo_send_welcome($email, (string) $user['displayName']);
    if (!empty($welcome['ok'])) brevo_mark_welcome_sent($db, $email);
  }
  save_db($file, $db);
  echo json_encode([
    'ok' => true,
    'server' => true,
    'user' => orolado_public_user($user),
    'vault' => $vault,
    'token' => $tok,
    'welcome' => !empty($welcome['ok'])
  ]);
  exit;
}

if ($action === 'register') {
  $user = $req['user'] ?? null;
  $vault = $req['vault'] ?? ['demo' => 1000000, 'real' => 0];
  if (!is_array($user) || empty($user['email']) || empty($user['id'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Inscription invalide']);
    exit;
  }
  $email = strtolower(trim($user['email']));
  if (orolado_is_reserved_admin_email($email) || find_user($db, $email)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Un compte existe déjà avec cet e-mail']);
    exit;
  }
  $user['email'] = $email;
  $user['role'] = 'user';
  unset($user['is_admin']);
  if (empty($user['publicId'])) $user['publicId'] = alloc_public_id($db);
  $db['users'][$user['id']] = $user;
  $vault = [
    'demo' => (int) ($vault['demo'] ?? 1000000),
    'real' => 0
  ];
  $db['vault'][$user['id']] = $vault;
  $tok = make_token($user['id'], $SECRET);
  $db['sessions'][$tok] = orolado_new_session((string) $user['id']);
  save_db($file, $db);
  orolado_set_session_cookie($tok);
  echo json_encode(['ok' => true, 'server' => true, 'user' => orolado_public_user($user), 'vault' => $vault, 'token' => $tok]);
  exit;
}

if ($action === 'welcomeEmail') {
  $email = strtolower(trim((string) ($req['email'] ?? '')));
  $name = trim((string) ($req['displayName'] ?? $req['name'] ?? ''));
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'E-mail invalide']);
    exit;
  }
  if (brevo_welcome_already_sent($db, $email)) {
    echo json_encode(['ok' => true, 'server' => true, 'duplicate' => true]);
    exit;
  }
  $sent = brevo_send_welcome($email, $name);
  if (!empty($sent['ok'])) {
    brevo_mark_welcome_sent($db, $email);
    save_db($file, $db);
  }
  echo json_encode(['ok' => !empty($sent['ok']), 'server' => true, 'skipped' => !empty($sent['skipped']), 'reason' => $sent['reason'] ?? null]);
  exit;
}

if ($action === 'login') {
  $email = strtolower(trim($req['email'] ?? ''));
  $password = trim((string) ($req['password'] ?? ''));
  $user = find_user($db, $email);
  if (!$user && isset($db['users']['admin_master']) && orolado_is_reserved_admin_email($email)) {
    $user = $db['users']['admin_master'];
  }
  if (orolado_is_reserved_admin_email($email) || (($user['id'] ?? '') === 'admin_master')) {
    if (!orolado_admin_pass_ok($password, $user, $ADMIN_PASS)) {
      echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Identifiants introuvables']);
      exit;
    }
    $user = ensure_admin_user($db, $ADMIN_EMAIL !== '' ? $ADMIN_EMAIL : $email, orolado_hash_password($password));
    save_db($file, $db);
  } elseif (!$user || empty($user['passwordHash']) || !orolado_pass_matches($password, (string) $user['passwordHash'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Identifiants introuvables']);
    exit;
  }
  $tok = make_token($user['id'], $SECRET);
  $db['sessions'][$tok] = orolado_new_session((string) $user['id']);
  save_db($file, $db);
  orolado_set_session_cookie($tok);
  $vault = $db['vault'][$user['id']] ?? ['demo' => 0, 'real' => 0];
  echo json_encode(['ok' => true, 'server' => true, 'user' => orolado_public_user($user), 'vault' => $vault, 'token' => $tok]);
  exit;
}

if ($action === 'upsert') {
  $me = session_user($db, $token);
  $user = $req['user'] ?? null;
  $isAdm = orolado_is_admin_user($me);
  if (!$me || !is_array($user) || (($me['id'] !== ($user['id'] ?? '')) && !$isAdm)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $id = $user['id'];
  $existing = $db['users'][$id] ?? [];
  $user['role'] = $existing['role'] ?? 'user';
  unset($user['is_admin']);
  if (!$isAdm) {
    $user['email'] = $existing['email'] ?? $user['email'] ?? '';
    if (orolado_is_reserved_admin_email((string) $user['email'])) {
      echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
      exit;
    }
  }
  if ($id === 'admin_master') $user['role'] = 'admin';
  if (!empty($existing['lastSeen']) && empty($user['lastSeen'])) {
    $user['lastSeen'] = $existing['lastSeen'];
  }
  if (!empty($existing['trafficSource']) && empty($user['trafficSource'])) {
    $user['trafficSource'] = $existing['trafficSource'];
  }
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
  $me = orolado_require_admin($db, $token);
  $list = [];
  $depPaidByUser = [];
  $wdPaidByUser = [];
  foreach (($db['deposits'] ?? []) as $d) {
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st !== 'COMPLETED' && $st !== 'PAID') continue;
    $uid = (string) ($d['userId'] ?? '');
    if ($uid === '') continue;
    if (!isset($depPaidByUser[$uid])) $depPaidByUser[$uid] = 0;
    $depPaidByUser[$uid] += (int) ($d['amount'] ?? 0);
  }
  foreach (($db['withdrawals'] ?? []) as $w) {
    if (($w['status'] ?? '') !== 'approved') continue;
    $uid = (string) ($w['userId'] ?? '');
    if ($uid === '') continue;
    if (!isset($wdPaidByUser[$uid])) $wdPaidByUser[$uid] = 0;
    $wdPaidByUser[$uid] += (int) ($w['amount'] ?? 0);
  }
  foreach ($db['users'] as $id => $u) {
    if (empty($u['publicId'])) {
      $db['users'][$id]['publicId'] = alloc_public_id($db);
      $u = $db['users'][$id];
    }
    $v = $db['vault'][$id] ?? ['demo' => 0, 'real' => 0];
    $totalDep = (int) ($depPaidByUser[$id] ?? 0);
    if ($totalDep <= 0) {
      foreach (($u['transactions'] ?? []) as $tx) {
        if (($tx['type'] ?? '') === 'deposit' && (($tx['mode'] ?? 'real') === 'real' || empty($tx['mode']))) {
          $totalDep += (int) ($tx['amount'] ?? 0);
        }
      }
    }
    $totalWd = (int) ($wdPaidByUser[$id] ?? 0);
    $lastAction = (string) ($u['updatedAt'] ?? $u['createdAt'] ?? '');
    $txs = $u['transactions'] ?? [];
    if (is_array($txs) && count($txs)) {
      $lastAction = (string) ($txs[0]['at'] ?? $lastAction);
    }
    $list[] = [
      'id' => $id,
      'publicId' => (string) ($u['publicId'] ?? ''),
      'displayName' => $u['displayName'] ?? '',
      'email' => $u['email'] ?? '',
      'phone' => $u['phone'] ?? '',
      'countryCode' => $u['countryCode'] ?? '',
      'role' => $u['role'] ?? 'user',
      'createdAt' => $u['createdAt'] ?? '',
      'realBalance' => $v['real'] ?? 0,
      'demoBalance' => $v['demo'] ?? 0,
      'realTrades' => $u['realTrades'] ?? 0,
      'totalDeposited' => $totalDep,
      'totalWithdrawn' => $totalWd,
      'lastAction' => $lastAction,
      'lastSeen' => (string) ($u['lastSeen'] ?? ''),
      'trafficSource' => (string) ($u['trafficSource'] ?? 'direct'),
      'transactions' => array_slice($u['transactions'] ?? [], 0, 40),
      'positions' => array_slice($u['positions'] ?? [], 0, 20)
    ];
  }
  usort($list, function ($a, $b) {
    return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
  });
  save_db($file, $db);
  $depsPending = [];
  $depsPaid = [];
  foreach (($db['deposits'] ?? []) as $d) {
    $uid = (string) ($d['userId'] ?? '');
    $row = [
      'ref' => (string) ($d['id'] ?? $d['ref'] ?? ''),
      'userId' => $uid,
      'name' => (string) ($db['users'][$uid]['displayName'] ?? ''),
      'email' => (string) ($db['users'][$uid]['email'] ?? ''),
      'publicId' => (string) ($db['users'][$uid]['publicId'] ?? ''),
      'amount' => (int) ($d['amount'] ?? 0),
      'operator' => (string) ($d['operator'] ?? ''),
      'txid' => (string) ($d['txid'] ?? ''),
      'status' => strtoupper((string) ($d['status'] ?? '')),
      'at' => (string) ($d['paidAt'] ?? $d['createdAt'] ?? $d['at'] ?? '')
    ];
    $st = $row['status'];
    if ($st === 'PENDING') $depsPending[] = $row;
    if ($st === 'COMPLETED' || $st === 'PAID') $depsPaid[] = $row;
  }
  $depsPending = array_slice(array_reverse($depsPending), 0, 80);
  usort($depsPaid, function ($a, $b) {
    return strcmp((string) ($b['at'] ?? ''), (string) ($a['at'] ?? ''));
  });
  $depsPaid = array_slice($depsPaid, 0, 200);
  $msgs = array_slice(array_reverse($db['support_messages'] ?? []), 0, 60);

  $gameStats = null;
  $orders = $db['orders'] ?? [];
  if (is_array($orders) && count($orders) > 0) {
    $byAsset = [];
    $byDur = [];
    $byAssetMode = ['real' => [], 'demo' => []];
    $byDurMode = ['real' => [], 'demo' => []];
    foreach ($orders as $o) {
      if (!is_array($o)) continue;
      $aid = (string) ($o['assetId'] ?? $o['asset_id'] ?? 'v100');
      $dur = (int) ($o['duration'] ?? 0);
      $mode = (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo';
      if (!isset($byAsset[$aid])) $byAsset[$aid] = 0;
      $byAsset[$aid]++;
      if (!isset($byDur[$dur])) $byDur[$dur] = 0;
      $byDur[$dur]++;
      if (!isset($byAssetMode[$mode][$aid])) $byAssetMode[$mode][$aid] = 0;
      $byAssetMode[$mode][$aid]++;
      if (!isset($byDurMode[$mode][$dur])) $byDurMode[$mode][$dur] = 0;
      $byDurMode[$mode][$dur]++;
    }
    $gameStats = [
      'byAsset' => $byAsset,
      'byDuration' => $byDur,
      'byAssetMode' => $byAssetMode,
      'byDurationMode' => $byDurMode,
      'total' => count($orders)
    ];
  }

  $traffic = [];
  foreach ($list as $u) {
    $src = strtolower(trim((string) ($u['trafficSource'] ?? 'direct')));
    if ($src === '') $src = 'direct';
    if (!isset($traffic[$src])) $traffic[$src] = 0;
    $traffic[$src]++;
  }

  echo json_encode([
    'ok' => true,
    'server' => true,
    'metrics' => metrics($db),
    'users' => $list,
    'withdrawals' => $db['withdrawals'],
    'deposits' => $depsPending,
    'depositsPaid' => $depsPaid,
    'messages' => $msgs,
    'gameStats' => $gameStats,
    'traffic' => $traffic
  ]);
  exit;
}

// Validation manuelle d'un dépôt par l'admin (paiement reçu mais webhook muet).
if ($action === 'resolveDeposit') {
  $me = orolado_require_admin($db, $token);
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
  $me = orolado_require_admin($db, $token);
  $uid = (string) ($req['userId'] ?? '');
  $delta = (int) ($req['delta'] ?? 0);
  $mode = (($req['mode'] ?? 'real') === 'demo') ? 'demo' : 'real';
  $motif = trim((string) ($req['motif'] ?? ''));
  if ($motif === '') {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Motif obligatoire']);
    exit;
  }
  if (!isset($db['vault'][$uid])) $db['vault'][$uid] = ['demo' => 0, 'real' => 0];
  $db['vault'][$uid][$mode] = max(0, (int) ($db['vault'][$uid][$mode] ?? 0) + $delta);
  $targetPid = (string) ($db['users'][$uid]['publicId'] ?? $uid);
  admin_log($db, (string) ($me['email'] ?? ''), $targetPid, 'adjust_' . $mode, $delta, $motif);
  save_db($file, $db);
  if ($mode === 'real') {
    if ($delta >= 0) supabase_credit_real((string) $uid, $delta, false);
    else supabase_debit_real((string) $uid, abs($delta));
  }
  echo json_encode(['ok' => true, 'server' => true, 'vault' => $db['vault'][$uid]]);
  exit;
}

if ($action === 'supportMessage') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $subject = trim((string) ($req['subject'] ?? ''));
  $message = trim((string) ($req['message'] ?? ''));
  if ($subject === '' || $message === '' || strlen($message) > 500) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Message invalide']);
    exit;
  }
  if (!isset($db['support_messages']) || !is_array($db['support_messages'])) $db['support_messages'] = [];
  $db['support_messages'][] = [
    'id' => uniqid('msg_', true),
    'userId' => $me['id'],
    'publicId' => (string) ($me['publicId'] ?? ''),
    'email' => (string) ($me['email'] ?? ''),
    'subject' => substr($subject, 0, 80),
    'message' => substr($message, 0, 500),
    'status' => 'ouvert',
    'reply' => '',
    'createdAt' => date('c')
  ];
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true]);
  exit;
}

if ($action === 'resolveMessage') {
  $me = orolado_require_admin($db, $token);
  $id = (string) ($req['id'] ?? '');
  $reply = trim((string) ($req['reply'] ?? ''));
  foreach ($db['support_messages'] ?? [] as $i => $m) {
    if ((string) ($m['id'] ?? '') === $id) {
      $db['support_messages'][$i]['status'] = 'resolu';
      if ($reply !== '') $db['support_messages'][$i]['reply'] = substr($reply, 0, 500);
      save_db($file, $db);
      echo json_encode(['ok' => true, 'server' => true]);
      exit;
    }
  }
  echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Message introuvable']);
  exit;
}

if ($action === 'withdraw') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $amount = orolado_money($req['amount'] ?? 0);
  $real = orolado_money($db['vault'][$me['id']]['real'] ?? 0);
  $minWithdraw = orolado_min_withdraw();
  if ($amount < $minWithdraw) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Le retrait minimum est de $3.00.']);
    exit;
  }
  if ($amount > $real) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Solde insuffisant']);
    exit;
  }
  // Wagering ×2 : volume de MISES réelles ≥ 2 × dépôts réels validés (côté serveur uniquement).
  $depositTotal = orolado_money($me['realDepositTotal'] ?? 0);
  $stakeDone = max(
    orolado_money($me['realStakeVolume'] ?? 0),
    orolado_money($me['totalWageredSinceDeposit'] ?? 0)
  );
  $required = orolado_money($me['requiredWagering'] ?? 0);
  if ($required <= 0) $required = orolado_money($depositTotal * 2);
  if ($stakeDone < $required) {
    $left = max(0.0, orolado_money($required - $stakeDone));
    $leftFmt = number_format($left, 2, '.', ',');
    echo json_encode([
      'ok' => false,
      'server' => true,
      'reason' => 'Vous devez miser encore $' . $leftFmt . ' avant de pouvoir effectuer un retrait (Volume requis : x2 de votre dépôt).',
      'wager' => [
        'done' => $stakeDone,
        'required' => $required,
        'left' => $left
      ]
    ]);
    exit;
  }
  $operator = preg_replace('/[^a-z0-9_]/', '', strtolower((string) ($req['operator'] ?? 'wave')));
  $allowedOps = ['wave', 'orange', 'mtn', 'moov', 'usdt', 'btc', 'paypal'];
  if (!in_array($operator, $allowedOps, true)) $operator = 'wave';
  $destination = trim((string) ($req['destination'] ?? $req['phone'] ?? ''));
  $beneficiary = trim((string) ($req['beneficiary'] ?? $me['displayName'] ?? ''));
  $countryCode = preg_replace('/[^\d+]/', '', (string) ($req['countryCode'] ?? $me['countryCode'] ?? '+225'));
  if (strlen($destination) < 4) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Indiquez le compte / adresse de réception']);
    exit;
  }
  if (strlen($beneficiary) < 2) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Nom du bénéficiaire requis']);
    exit;
  }
  $suspect = (($me['realTrades'] ?? 0) === 0) || (($me['realStakeVolume'] ?? 0) < $amount);
  $amountFcfa = orolado_usd_to_fcfa($amount);
  $db['vault'][$me['id']]['real'] = orolado_money($real - $amount);
  $db['withdrawals'][] = [
    'id' => uniqid('wd_', true),
    'userId' => $me['id'],
    'name' => $beneficiary,
    'email' => $me['email'] ?? '',
    'amount' => $amount,
    'amountFcfa' => $amountFcfa,
    'currency' => 'USD',
    'status' => 'pending',
    'suspect' => $suspect,
    'operator' => $operator,
    'phone' => $destination,
    'destination' => $destination,
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
  $me = orolado_require_admin($db, $token);
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
  if (!in_array($duration, [3, 10, 30, 60, 300, 600], true)) $duration = 10;
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
  $oddsAllowed = [1.88, 6.0, 11.0, 51.0];
  $payoutReq = (float) ($req['payout'] ?? $req['odds'] ?? 1.88);
  $payout = 1.88;
  foreach ($oddsAllowed as $od) {
    if (abs($od - $payoutReq) < 0.001) { $payout = $od; break; }
  }
  $assetId = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($req['assetId'] ?? 'v100'));
  $openPrice = (float) ($req['entryPrice'] ?? $req['openPrice'] ?? 0);
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
  $placed = with_db_lock(function ($box) use ($uid, $oid, $stake, $side, $duration, $mode, $payout, $assetId, $openPrice) {
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
    // Cap 5 open PAR compte (demo|real séparés).
    $now = microtime(true);
    $open = 0;
    foreach ($locked['orders'] as $o) {
      if (($o['userId'] ?? '') !== $uid || ($o['status'] ?? '') !== 'open') continue;
      $oMode = (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo';
      if ($oMode !== $mode) continue;
      $deadline = (float) ($o['at'] ?? 0) + (int) ($o['duration'] ?? 10) + 30;
      if ($deadline > $now) $open++;
    }
    if ($open >= 2) {
      return ['ok' => false, 'reason' => 'Maximum 2 trades en cours', 'skip_write' => true];
    }
    if (!isset($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
    $bal = (int) ($locked['vault'][$uid][$mode] ?? 0);
    if ($mode !== 'real' && $stake > $bal) {
      return ['ok' => false, 'reason' => 'Solde insuffisant', 'skip_write' => true];
    }
    if ($mode !== 'real') $locked['vault'][$uid][$mode] = $bal - $stake;
    else $locked['vault'][$uid]['real'] = max(0, $bal - $stake);
    if ($mode === 'real' && isset($locked['users'][$uid])) {
      $locked['users'][$uid]['realStakeVolume'] = (int) ($locked['users'][$uid]['realStakeVolume'] ?? 0) + $stake;
      $locked['users'][$uid]['totalWageredSinceDeposit'] = (int) ($locked['users'][$uid]['realStakeVolume'] ?? 0);
      $depTot = (int) ($locked['users'][$uid]['realDepositTotal'] ?? 0);
      $locked['users'][$uid]['requiredWagering'] = $depTot * 2;
      $locked['users'][$uid]['realTrades'] = (int) ($locked['users'][$uid]['realTrades'] ?? 0) + 1;
    }
    $locked['orders'][] = [
      'id' => $oid,
      'userId' => $uid,
      'stake' => $stake,
      'side' => $side,
      'duration' => $duration,
      'mode' => $mode,
      'accountType' => $mode,
      'assetId' => $assetId,
      'openPrice' => $openPrice,
      'payout' => $payout,
      'payoutMult' => $payout,
      'won' => null,
      'status' => 'open',
      'at' => microtime(true),
      'openedAt' => microtime(true),
      'expiryAt' => microtime(true) + $duration
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
  $voided = !empty($req['voided']);
  $closePrice = isset($req['exitPrice']) ? (float) $req['exitPrice'] : (isset($req['closePrice']) ? (float) $req['closePrice'] : null);
  $uid = (string) $me['id'];
  $settled = with_db_lock(function ($box) use ($oid, $uid, $wantWon, $voided, $closePrice) {
    $locked =& $box->db;
    if (!isset($locked['orders']) || !is_array($locked['orders'])) $locked['orders'] = [];
    foreach ($locked['orders'] as &$o) {
      if (($o['id'] ?? '') !== $oid || ($o['userId'] ?? '') !== $uid) continue;
      $stake = (int) $o['stake'];
      $payout = (float) ($o['payout'] ?? 1.88);
      $mode = ($o['mode'] ?? 'demo') === 'real' ? 'real' : 'demo';
      $st = (string) ($o['status'] ?? '');
      // Déjà réglé : idempotent, pas de double crédit.
      if ($st === 'won' || $st === 'lost' || $st === 'void' || $st === 'closed') {
        $won = !empty($o['won']);
        $isVoid = ($st === 'void') || !empty($o['voided']);
        $credit = $isVoid ? $stake : ($won ? (int) floor($stake * $payout) : 0);
        $net = $isVoid ? 0 : ($won ? $credit - $stake : -$stake);
        return [
          'ok' => true,
          'won' => $won,
          'voided' => $isVoid,
          'net' => $net,
          'payout' => $payout,
          'credit' => 0,
          'mode' => $mode,
          'fresh' => false,
          'vault' => $locked['vault'][$uid] ?? ['demo' => 0, 'real' => 0],
          'skip_write' => true
        ];
      }
      if ($st !== 'open') {
        return ['ok' => false, 'reason' => 'Ordre introuvable', 'skip_write' => true];
      }
      $elapsed = microtime(true) - (float) ($o['at'] ?? 0);
      if ($elapsed < max(0, ((int) $o['duration']) - 0.6)) {
        return ['ok' => false, 'reason' => 'Position encore ouverte', 'skip_write' => true];
      }
      $won = $voided ? false : ($wantWon !== null ? $wantWon : !empty($o['won']));
      $credit = $voided ? $stake : ($won ? (int) floor($stake * $payout) : 0);
      $net = $voided ? 0 : ($won ? $credit - $stake : -$stake);
      $final = $voided ? 'void' : ($won ? 'won' : 'lost');
      if (!isset($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 0, 'real' => 0];
      if ($credit > 0) $locked['vault'][$uid][$mode] = (int) $locked['vault'][$uid][$mode] + $credit;
      $o['won'] = $won;
      $o['voided'] = $voided;
      $o['status'] = $final;
      $o['closePrice'] = $closePrice;
      return [
        'ok' => true,
        'won' => $won,
        'voided' => $voided,
        'net' => $net,
        'payout' => $payout,
        'credit' => $credit,
        'mode' => $mode,
        'fresh' => true,
        'vault' => $locked['vault'][$uid]
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
    'voided' => !empty($settled['voided']),
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
      'amount' => orolado_money($d['amount'] ?? 0),
      'status' => strtoupper((string) ($d['status'] ?? 'PENDING')),
      'label' => 'Dépôt',
      'operator' => $d['operator'] ?? ($d['op'] ?? '')
    ];
  }
  foreach (($db['withdrawals'] ?? []) as $w) {
    if (($w['userId'] ?? '') !== $me['id']) continue;
    $st = strtoupper((string) ($w['status'] ?? 'pending'));
    if ($st === 'PAID' || $st === 'APPROVED' || $st === 'SUCCESS' || $st === 'COMPLETED') $st = 'COMPLETED';
    elseif ($st === 'REJECT' || $st === 'REJECTED' || $st === 'DENIED') $st = 'REJECTED';
    else $st = 'PENDING';
    $rows[] = [
      'at' => $w['at'] ?? '',
      'ref' => $w['id'] ?? '',
      'amount' => -abs(orolado_money($w['amount'] ?? 0)),
      'status' => $st,
      'label' => 'Retrait',
      'operator' => $w['operator'] ?? ''
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
  if ($token !== '' && isset($db['sessions'][$token])) {
    $db['sessions'][$token]['exp'] = time() + orolado_session_ttl();
    $db['sessions'][$token]['at'] = date('c');
    save_db($file, $db);
    orolado_set_session_cookie($token);
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
    'user' => orolado_public_user($me),
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

if ($action === 'submitUsdtDeposit' || $action === 'verifyCryptoDeposit') {
  echo json_encode(orolado_verify_crypto_deposit(['token' => $token] + $req));
  exit;
}

if ($action === 'oxapayInvoice') {
  echo json_encode(orolado_oxapay_invoice(['token' => $token] + $req));
  exit;
}

if ($action === 'oxapayStatus') {
  echo json_encode(orolado_oxapay_status(['token' => $token] + $req));
  exit;
}

echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Action inconnue']);
