<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');

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
  if (orolado_verify_password($password, $storedHash)) return true;
  return orolado_legacy_sha_matches($password, $storedHash);
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
  $email = strtolower(trim($email));
  foreach ($db['users'] as $u) {
    if (!is_array($u)) continue;
    $mails = [
      strtolower(trim((string) ($u['email'] ?? ''))),
      strtolower(trim((string) ($u['originalEmail'] ?? ''))),
    ];
    if ($email !== '' && in_array($email, $mails, true)) return $u;
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
    if (function_exists('supabase_touch_last_seen')) {
      supabase_touch_last_seen((string) $me['id']);
    }
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
  $trafficMedium = strtolower(trim((string) ($req['trafficMedium'] ?? '')));
  $trafficCampaign = strtolower(trim((string) ($req['trafficCampaign'] ?? '')));
  $trafficReferrer = strtolower(trim((string) ($req['trafficReferrer'] ?? '')));
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Adresse e-mail invalide', 'field' => 'regEmail']);
    exit;
  }
  if (orolado_is_reserved_admin_email($email)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Un compte existe déjà avec cet e-mail', 'field' => 'regEmail']);
    exit;
  }
  $blocked = orolado_identity_block($db, $email, $phone);
  if ($blocked) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Cet e-mail ne peut plus être utilisé pour une inscription.', 'field' => 'regEmail']);
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
  if (is_array($prev) && !empty($prev['lastSentAt']) && ($now - (int) $prev['lastSentAt']) < OROLADO_OTP_RESEND_COOLDOWN) {
    $wait = OROLADO_OTP_RESEND_COOLDOWN - ($now - (int) $prev['lastSentAt']);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => '', 'retryIn' => $wait, 'cooldown' => true]);
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
    'trafficMedium' => $trafficMedium,
    'trafficCampaign' => $trafficCampaign,
    'trafficReferrer' => $trafficReferrer,
    'codeHash' => orolado_otp_hash($email, $code),
    'expiresAt' => $now + OROLADO_OTP_TTL,
    'lastSentAt' => $now,
    'attempts' => 0,
    'createdAt' => date('c'),
    'createdAtTs' => $now,
    'sessionExpiresAt' => $now + OROLADO_OTP_PENDING_KEEP,
    'prevHashes' => []
  ];
  $db['pendingRegistrations'] = $pending;
  save_db($file, $db);
  ignore_user_abort(true);
  $sent = brevo_send_otp($email, $code);
  if (empty($sent['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $sent['reason'] ?? 'Impossible d’envoyer le code. Réessayez.']);
    exit;
  }
  $pending[$email]['expiresAt'] = time() + OROLADO_OTP_TTL;
  $pending[$email]['lastSentAt'] = time();
  $db['pendingRegistrations'] = $pending;
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'pendingOtp' => true, 'email' => $email, 'expiresIn' => OROLADO_OTP_TTL, 'resendIn' => OROLADO_OTP_RESEND_UI]);
  exit;
}

if ($action === 'registerResend') {
  $email = strtolower(trim((string) ($req['email'] ?? '')));
  orolado_purge_expired_pending($db);
  $row = $db['pendingRegistrations'][$email] ?? null;
  if (!is_array($row)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré', 'expired' => true]);
    exit;
  }
  $now = time();
  if (!empty($row['lastSentAt']) && ($now - (int) $row['lastSentAt']) < OROLADO_OTP_RESEND_COOLDOWN) {
    $wait = OROLADO_OTP_RESEND_COOLDOWN - ($now - (int) $row['lastSentAt']);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => '', 'retryIn' => $wait, 'cooldown' => true]);
    exit;
  }
  $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  orolado_otp_remember_prev($row);
  $row['codeHash'] = orolado_otp_hash($email, $code);
  $row['expiresAt'] = $now + OROLADO_OTP_TTL;
  $row['lastSentAt'] = $now;
  $row['attempts'] = 0;
  $row['sessionExpiresAt'] = $now + OROLADO_OTP_PENDING_KEEP;
  $db['pendingRegistrations'][$email] = $row;
  save_db($file, $db);
  ignore_user_abort(true);
  $sent = brevo_send_otp($email, $code);
  if (empty($sent['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $sent['reason'] ?? 'Envoi impossible']);
    exit;
  }
  $row['expiresAt'] = time() + OROLADO_OTP_TTL;
  $row['lastSentAt'] = time();
  $db['pendingRegistrations'][$email] = $row;
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'resendIn' => OROLADO_OTP_RESEND_UI, 'expiresIn' => OROLADO_OTP_TTL]);
  exit;
}

if ($action === 'registerVerify') {
  $email = strtolower(trim((string) ($req['email'] ?? '')));
  $code = preg_replace('/\D/', '', (string) ($req['code'] ?? ''));
  orolado_purge_expired_pending($db);
  $row = $db['pendingRegistrations'][$email] ?? null;
  if (!is_array($row)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré', 'expired' => true]);
    exit;
  }
  $now = time();
  $attempts = (int) ($row['attempts'] ?? 0);
  if ($attempts >= 8) {
    unset($db['pendingRegistrations'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré', 'expired' => true]);
    exit;
  }
  if (!orolado_otp_row_match($row, $email, $code)) {
    if (!orolado_otp_row_alive($row)) {
      unset($db['pendingRegistrations'][$email]);
      save_db($file, $db);
      echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré', 'expired' => true]);
      exit;
    }
    $row['attempts'] = $attempts + 1;
    $db['pendingRegistrations'][$email] = $row;
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code incorrect']);
    exit;
  }
  $phoneRow = (string) ($row['phone'] ?? '');
  $created = with_db_lock(function ($box) use ($email, $row, $SECRET, $phoneRow) {
    $locked =& $box->db;
    if (find_user($locked, $email) || orolado_identity_block($locked, $email, $phoneRow)) {
      unset($locked['pendingRegistrations'][$email]);
      return ['ok' => false, 'reason' => 'Cet e-mail ne peut plus être utilisé pour une inscription.'];
    }
    $uid = 'u_' . bin2hex(random_bytes(8));
    $user = [
      'id' => $uid,
      'displayName' => (string) ($row['displayName'] ?? 'Membre'),
      'email' => $email,
      'phone' => $phoneRow,
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
      'trafficMedium' => (string) ($row['trafficMedium'] ?? ''),
      'trafficCampaign' => (string) ($row['trafficCampaign'] ?? ''),
      'trafficReferrer' => (string) ($row['trafficReferrer'] ?? ''),
      'publicId' => alloc_public_id($locked),
      'transactions' => [],
      'positions' => []
    ];
    $vault = ['demo' => 1000000, 'real' => 0];
    $locked['users'][$uid] = $user;
    $locked['vault'][$uid] = $vault;
    unset($locked['pendingRegistrations'][$email]);
    $tok = make_token($uid, $SECRET);
    $locked['sessions'][$tok] = orolado_new_session($uid);
    return ['ok' => true, 'user' => $user, 'vault' => $vault, 'token' => $tok];
  });
  if (empty($created['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $created['reason'] ?? 'Inscription impossible']);
    exit;
  }
  $user = $created['user'];
  $vault = $created['vault'];
  $tok = $created['token'];
  orolado_set_session_cookie($tok);
  $db = load_db($file);
  $welcome = ['ok' => false];
  if (!brevo_welcome_already_sent($db, $email)) {
    $welcome = brevo_send_welcome($email, (string) $user['displayName']);
    if (!empty($welcome['ok'])) {
      brevo_mark_welcome_sent($db, $email);
      save_db($file, $db);
    }
  }
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

if ($action === 'passwordOtpStart') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $email = strtolower(trim((string) ($me['email'] ?? '')));
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Adresse e-mail invalide']);
    exit;
  }
  if (!isset($db['pendingPasswordOtps']) || !is_array($db['pendingPasswordOtps'])) $db['pendingPasswordOtps'] = [];
  $prev = $db['pendingPasswordOtps'][$email] ?? null;
  $now = time();
  if (is_array($prev) && !empty($prev['lastSentAt']) && ($now - (int) $prev['lastSentAt']) < OROLADO_OTP_RESEND_COOLDOWN) {
    $wait = OROLADO_OTP_RESEND_COOLDOWN - ($now - (int) $prev['lastSentAt']);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => '', 'retryIn' => $wait, 'cooldown' => true]);
    exit;
  }
  $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $prevRow = is_array($prev) ? $prev : [];
  orolado_otp_remember_prev($prevRow);
  $db['pendingPasswordOtps'][$email] = [
    'userId' => (string) ($me['id'] ?? ''),
    'codeHash' => orolado_otp_hash($email, $code),
    'expiresAt' => $now + OROLADO_OTP_TTL,
    'lastSentAt' => $now,
    'attempts' => 0,
    'verified' => false,
    'otpToken' => '',
    'prevHashes' => $prevRow['prevHashes'] ?? []
  ];
  save_db($file, $db);
  ignore_user_abort(true);
  $sent = brevo_send_otp($email, $code);
  if (empty($sent['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $sent['reason'] ?? 'Impossible d’envoyer le code. Réessayez.']);
    exit;
  }
  $db['pendingPasswordOtps'][$email]['expiresAt'] = time() + OROLADO_OTP_TTL;
  $db['pendingPasswordOtps'][$email]['lastSentAt'] = time();
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'email' => $email, 'expiresIn' => OROLADO_OTP_TTL, 'resendIn' => OROLADO_OTP_RESEND_UI]);
  exit;
}

if ($action === 'passwordOtpVerify') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $email = strtolower(trim((string) ($me['email'] ?? '')));
  $code = preg_replace('/\D/', '', (string) ($req['code'] ?? ''));
  $row = $db['pendingPasswordOtps'][$email] ?? null;
  if (!is_array($row)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Aucun code en attente']);
    exit;
  }
  $now = time();
  $attempts = (int) ($row['attempts'] ?? 0);
  if ($attempts >= 8) {
    unset($db['pendingPasswordOtps'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Trop de tentatives']);
    exit;
  }
  if (!orolado_otp_row_match($row, $email, $code)) {
    if (!orolado_otp_row_alive($row)) {
      unset($db['pendingPasswordOtps'][$email]);
      save_db($file, $db);
      echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré']);
      exit;
    }
    $row['attempts'] = $attempts + 1;
    $db['pendingPasswordOtps'][$email] = $row;
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code incorrect']);
    exit;
  }
  $otpToken = bin2hex(random_bytes(16));
  $row['verified'] = true;
  $row['otpToken'] = hash('sha256', $otpToken);
  $row['verifiedUntil'] = $now + 600;
  $db['pendingPasswordOtps'][$email] = $row;
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'otpToken' => $otpToken]);
  exit;
}

if ($action === 'forgotOtpStart') {
  $email = strtolower(trim((string) ($req['email'] ?? '')));
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Invalid email']);
    exit;
  }
  if (!isset($db['pendingPasswordOtps']) || !is_array($db['pendingPasswordOtps'])) $db['pendingPasswordOtps'] = [];
  $now = time();
  $prev = $db['pendingPasswordOtps'][$email] ?? null;
  if (is_array($prev) && !empty($prev['lastSentAt']) && ($now - (int) $prev['lastSentAt']) < OROLADO_OTP_RESEND_COOLDOWN) {
    $wait = OROLADO_OTP_RESEND_COOLDOWN - ($now - (int) $prev['lastSentAt']);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => '', 'retryIn' => $wait, 'cooldown' => true]);
    exit;
  }
  $found = find_user($db, $email);
  if ($found) {
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $prevRow = is_array($prev) ? $prev : [];
    orolado_otp_remember_prev($prevRow);
    $db['pendingPasswordOtps'][$email] = [
      'userId' => (string) ($found['id'] ?? ''),
      'codeHash' => orolado_otp_hash($email, $code),
      'expiresAt' => $now + OROLADO_OTP_TTL,
      'lastSentAt' => $now,
      'attempts' => 0,
      'verified' => false,
      'otpToken' => '',
      'forgot' => true,
      'prevHashes' => $prevRow['prevHashes'] ?? []
    ];
    save_db($file, $db);
    ignore_user_abort(true);
    $sent = brevo_send_otp($email, $code);
    if (empty($sent['ok'])) {
      echo json_encode(['ok' => false, 'server' => true, 'reason' => $sent['reason'] ?? 'Unable to send code']);
      exit;
    }
    $db['pendingPasswordOtps'][$email]['expiresAt'] = time() + OROLADO_OTP_TTL;
    $db['pendingPasswordOtps'][$email]['lastSentAt'] = time();
    save_db($file, $db);
  }
  echo json_encode(['ok' => true, 'server' => true, 'email' => $email, 'expiresIn' => OROLADO_OTP_TTL, 'resendIn' => OROLADO_OTP_RESEND_UI]);
  exit;
}

if ($action === 'forgotOtpVerify') {
  $email = strtolower(trim((string) ($req['email'] ?? '')));
  $code = preg_replace('/\D/', '', (string) ($req['code'] ?? ''));
  $row = $db['pendingPasswordOtps'][$email] ?? null;
  if (!is_array($row)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'No pending code']);
    exit;
  }
  $now = time();
  $attempts = (int) ($row['attempts'] ?? 0);
  if ($attempts >= 8) {
    unset($db['pendingPasswordOtps'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Too many attempts']);
    exit;
  }
  if (!orolado_otp_row_match($row, $email, $code)) {
    if (!orolado_otp_row_alive($row)) {
      unset($db['pendingPasswordOtps'][$email]);
      save_db($file, $db);
      echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expired']);
      exit;
    }
    $row['attempts'] = $attempts + 1;
    $db['pendingPasswordOtps'][$email] = $row;
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Incorrect code']);
    exit;
  }
  $otpToken = bin2hex(random_bytes(16));
  $row['verified'] = true;
  $row['otpToken'] = hash('sha256', $otpToken);
  $row['verifiedUntil'] = $now + 300;
  $db['pendingPasswordOtps'][$email] = $row;
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'otpToken' => $otpToken]);
  exit;
}

if ($action === 'forgotPasswordSet') {
  $email = strtolower(trim((string) ($req['email'] ?? '')));
  $otpToken = trim((string) ($req['otpToken'] ?? ''));
  $newPassword = (string) ($req['newPassword'] ?? '');
  if (strlen($newPassword) < 6) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Password too short']);
    exit;
  }
  $row = $db['pendingPasswordOtps'][$email] ?? null;
  $now = time();
  if (!is_array($row) || empty($row['verified']) || empty($row['otpToken'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Validate the email code first']);
    exit;
  }
  if (!empty($row['verifiedUntil']) && (int) $row['verifiedUntil'] < $now) {
    unset($db['pendingPasswordOtps'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expired']);
    exit;
  }
  if (!empty($row['expiresAt']) && (int) $row['expiresAt'] < $now && empty($row['verified'])) {
    unset($db['pendingPasswordOtps'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expired']);
    exit;
  }
  if (!hash_equals((string) $row['otpToken'], hash('sha256', $otpToken))) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Invalid OTP token']);
    exit;
  }
  $ok = orolado_overwrite_user_password($db, $email, $newPassword);
  save_db($file, $db);
  echo json_encode(['ok' => $ok, 'server' => true, 'reason' => $ok ? null : 'Unable to update password']);
  exit;
}

if ($action === 'passwordChange') {
  $me = session_user($db, $token);
  if (!$me) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Session invalide']);
    exit;
  }
  $email = strtolower(trim((string) ($me['email'] ?? ($req['email'] ?? ''))));
  $otpToken = trim((string) ($req['otpToken'] ?? ''));
  $newPassword = (string) ($req['newPassword'] ?? '');
  if (strlen($newPassword) < 6) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Nouveau mot de passe trop court']);
    exit;
  }
  $row = $db['pendingPasswordOtps'][$email] ?? null;
  $now = time();
  if (!is_array($row) || empty($row['verified']) || empty($row['otpToken'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Validez d’abord le code e-mail']);
    exit;
  }
  if (!empty($row['verifiedUntil']) && (int) $row['verifiedUntil'] < $now) {
    unset($db['pendingPasswordOtps'][$email]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré']);
    exit;
  }
  if (!hash_equals((string) $row['otpToken'], hash('sha256', $otpToken))) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Jeton OTP invalide']);
    exit;
  }
  $ok = orolado_overwrite_user_password($db, $email, $newPassword, '');
  $fresh = '';
  if ($ok) {
    $uidNew = (string) ($me['id'] ?? '');
    $fresh = make_token($uidNew, $SECRET);
    $db['sessions'][$fresh] = orolado_new_session($uidNew);
    orolado_set_session_cookie($fresh);
  }
  save_db($file, $db);
  echo json_encode([
    'ok' => $ok,
    'server' => true,
    'token' => $fresh,
    'reason' => $ok ? null : 'Impossible de mettre à jour le mot de passe',
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
  if (orolado_is_reserved_admin_email($email) || find_user($db, $email) || orolado_identity_block($db, $email, (string) ($user['phone'] ?? ''))) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Cet e-mail ne peut plus être utilisé pour une inscription.']);
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
  $passwordRaw = (string) ($req['password'] ?? '');
  $password = trim($passwordRaw);
  $passTries = [];
  foreach ([$password, $passwordRaw] as $pwTry) {
    if ($pwTry !== '' && !in_array($pwTry, $passTries, true)) $passTries[] = $pwTry;
  }
  $matches = [];
  foreach ($db['users'] as $id => $u) {
    if (!is_array($u)) continue;
    $mails = [
      strtolower(trim((string) ($u['email'] ?? ''))),
      strtolower(trim((string) ($u['originalEmail'] ?? ''))),
    ];
    if ($email === '' || !in_array($email, $mails, true)) continue;
    if (!isset($u['id']) || (string) $u['id'] === '') $u['id'] = (string) $id;
    $matches[] = $u;
  }
  $user = $matches[0] ?? find_user($db, $email);
  if (!$user && isset($db['users']['admin_master']) && orolado_is_reserved_admin_email($email)) {
    $user = $db['users']['admin_master'];
  }
  if (orolado_is_reserved_admin_email($email) || (($user['id'] ?? '') === 'admin_master')) {
    $adminOk = false;
    foreach ($passTries as $pwTry) {
      if (orolado_admin_pass_ok($pwTry, $user, $ADMIN_PASS)) {
        $adminOk = true;
        $password = $pwTry;
        break;
      }
    }
    if (!$adminOk) {
      echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Identifiants introuvables']);
      exit;
    }
    $user = ensure_admin_user($db, $ADMIN_EMAIL !== '' ? $ADMIN_EMAIL : $email, orolado_hash_password($password));
    save_db($file, $db);
  } else {
    $okPass = false;
    foreach ($matches as $candUser) {
      $stored = orolado_stored_password_hash($candUser);
      if ($stored === '') continue;
      foreach ($passTries as $pwTry) {
        if (!orolado_password_ok($pwTry, $stored)) continue;
        $okPass = true;
        $user = $candUser;
        $password = $pwTry;
        break 2;
      }
    }
    if (!$okPass) {
      $sbAuth = null;
      foreach ($passTries as $pwTry) {
        $probe = orolado_supabase_password_grant($email, $pwTry);
        if (is_array($probe) && !empty($probe['id'])) {
          $sbAuth = $probe;
          $password = $pwTry;
          break;
        }
      }
      if (is_array($sbAuth) && !empty($sbAuth['id'])) {
        $okPass = true;
        $sid = (string) $sbAuth['id'];
        $user = null;
        foreach ($matches as $candUser) {
          if ((string) ($candUser['id'] ?? '') === $sid) { $user = $candUser; break; }
        }
        if (!$user) {
          foreach ($matches as $candUser) {
            if (orolado_stored_password_hash($candUser) !== '') { $user = $candUser; break; }
          }
        }
        if (!$user && isset($db['users'][$sid]) && is_array($db['users'][$sid])) {
          $user = $db['users'][$sid];
        }
        if (!$user) {
          $meta = is_array($sbAuth['user_metadata'] ?? null) ? $sbAuth['user_metadata'] : [];
          $name = (string) ($meta['display_name'] ?? '');
          if ($name === '') $name = explode('@', $email)[0];
          $user = [
            'id' => $sid,
            'displayName' => $name !== '' ? $name : 'Trader',
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
            'positions' => [],
          ];
          $db['users'][$sid] = $user;
          if (!isset($db['vault'][$sid])) $db['vault'][$sid] = ['demo' => 1000000, 'real' => 0];
        }
      }
    }
    if (!$okPass) {
      $blockedEarly = orolado_identity_block($db, $email);
      if ($blockedEarly) {
        echo json_encode(orolado_block_payload((string) ($blockedEarly['kind'] ?? 'suspended')));
        exit;
      }
      echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Identifiants introuvables']);
      exit;
    }
    $uidFix = (string) ($user['id'] ?? '');
    if ($uidFix !== '') {
      orolado_persist_password_hash($db, $uidFix, $password);
      $user = $db['users'][$uidFix] ?? $user;
    }
  }
  $banUid = (string) ($user['id'] ?? '');
  $banKind = orolado_user_block_kind($db, $banUid);
  if ($banKind === '') {
    $banRole = strtolower((string) ($user['role'] ?? ''));
    if (in_array($banRole, orolado_blocked_roles(), true)) {
      $banKind = $banRole === 'deleted' ? 'deleted' : 'suspended';
    }
  }
  if ($banKind === '') {
    $idBlock = orolado_identity_block($db, $email, (string) ($user['phone'] ?? ''));
    if ($idBlock) $banKind = (string) ($idBlock['kind'] ?? 'suspended');
  }
  if ($banKind !== '') {
    echo json_encode(orolado_block_payload($banKind));
    exit;
  }
  orolado_revoke_user_sessions($db, (string) $user['id'], '');
  $tok = make_token($user['id'], $SECRET);
  $db['sessions'][$tok] = orolado_new_session((string) $user['id']);
  $uid = (string) $user['id'];
  $jsonReal = orolado_money($db['vault'][$uid]['real'] ?? 0);
  $official = orolado_sync_official_real($uid, $jsonReal);
  if ($official <= 0.009 && function_exists('orolado_recover_wiped_real')) {
    $official = orolado_recover_wiped_real($db, $uid, is_array($user) ? $user : []);
  }
  if (!isset($db['vault'][$uid]) || !is_array($db['vault'][$uid])) {
    $db['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
  }
  $db['vault'][$uid]['real'] = $official;
  $demoNow = orolado_money($db['vault'][$uid]['demo'] ?? 0);
  if ($demoNow <= 0 && (int) ($user['trades'] ?? 0) === 0) {
    $db['vault'][$uid]['demo'] = 1000000;
    $demoNow = 1000000;
  }
  save_db($file, $db);
  orolado_set_session_cookie($tok);
  $vault = [
    'demo' => $demoNow,
    'real' => $official,
  ];
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
  unset($user['passwordHash'], $user['password']);
  $user['passwordHash'] = (string) ($existing['passwordHash'] ?? '');
  $user['positions'] = orolado_merge_positions($existing['positions'] ?? [], $user['positions'] ?? []);
  foreach (['lastDepositAmount', 'wagerLock', 'wagerNeed', 'requiredWagering'] as $keepK) {
    if (!array_key_exists($keepK, $user) && array_key_exists($keepK, $existing)) {
      $user[$keepK] = $existing[$keepK];
    }
  }
  foreach (['realDepositTotal', 'realStakeVolume', 'totalWageredSinceDeposit'] as $maxK) {
    $user[$maxK] = orolado_money(max(
      orolado_money($user[$maxK] ?? 0),
      orolado_money($existing[$maxK] ?? 0)
    ));
  }
  if (!empty($existing['lastSeen']) && empty($user['lastSeen'])) {
    $user['lastSeen'] = $existing['lastSeen'];
  }
  if (!empty($existing['trafficSource']) && empty($user['trafficSource'])) {
    $user['trafficSource'] = $existing['trafficSource'];
  }
  $db['users'][$id] = $user;
  if (isset($req['vault']) && is_array($req['vault'])) {
    $serverReal = orolado_money($db['vault'][$id]['real'] ?? 0);
    $db['vault'][$id] = [
      'demo' => orolado_money($req['vault']['demo'] ?? ($db['vault'][$id]['demo'] ?? 0)),
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
  $delta = function_exists('orolado_money') ? orolado_money($req['delta'] ?? 0) : (float) ($req['delta'] ?? 0);
  $mode = (($req['mode'] ?? 'real') === 'demo') ? 'demo' : 'real';
  $motif = trim((string) ($req['motif'] ?? ''));
  if ($motif === '') {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Motif obligatoire']);
    exit;
  }
  if ($uid === '' || abs($delta) < 0.0001) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Montant invalide']);
    exit;
  }
  if (!isset($db['vault'][$uid])) $db['vault'][$uid] = ['demo' => 0, 'real' => 0];
  if ($mode === 'demo') {
    $db['vault'][$uid]['demo'] = orolado_money(max(0, (float) ($db['vault'][$uid]['demo'] ?? 0) + $delta));
    $targetPid = (string) ($db['users'][$uid]['publicId'] ?? $uid);
    admin_log($db, (string) ($me['email'] ?? ''), $targetPid, 'adjust_demo', (int) round($delta), $motif);
    save_db($file, $db);
    echo json_encode(['ok' => true, 'server' => true, 'vault' => $db['vault'][$uid]]);
    exit;
  }
  $res = orolado_ledger_apply($db, $uid, $delta, $motif, $delta > 0);
  if (empty($res['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => (string) ($res['reason'] ?? 'Échec')]);
    exit;
  }
  $targetPid = (string) ($db['users'][$uid]['publicId'] ?? $uid);
  admin_log($db, (string) ($me['email'] ?? ''), $targetPid, $delta >= 0 ? 'credit' : 'debit', (int) round($delta), $motif);
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'vault' => $db['vault'][$uid], 'real' => $res['real']]);
  exit;
}

if ($action === 'suspendUser') {
  $me = orolado_require_admin($db, $token);
  $uid = (string) ($req['userId'] ?? '');
  if ($uid === '' || $uid === (string) ($me['id'] ?? '')) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Joueur invalide']);
    exit;
  }
  orolado_force_suspend($db, $uid, 'suspended');
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true]);
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

if ($action === 'withdrawOtp') {
  $st = orolado_session_inspect($db, $token);
  if (empty($st['ok'])) {
    echo json_encode($st);
    exit;
  }
  $me = $st['user'];
  $uid = (string) ($me['id'] ?? '');
  $email = strtolower(trim((string) ($me['email'] ?? $me['originalEmail'] ?? '')));
  if ($uid === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Adresse e-mail invalide']);
    exit;
  }
  $freshOtp = (isset($db['users'][$uid]) && is_array($db['users'][$uid]))
    ? array_merge(is_array($me) ? $me : [], $db['users'][$uid])
    : $me;
  $otpBal = function_exists('orolado_official_real') ? orolado_official_real($db, $uid) : null;
  $wagerOtp = function_exists('orolado_wager_check')
    ? orolado_wager_check($db, is_array($freshOtp) ? $freshOtp : [], $otpBal)
    : ['ok' => true, 'canWithdraw' => true];
  if (empty($wagerOtp['canWithdraw'])) {
    echo json_encode([
      'ok' => false,
      'server' => true,
      'reason' => $wagerOtp['msg'] ?? 'Vous devez miser x2 de votre dépôt avant de pouvoir effectuer un retrait.',
      'wager' => [
        'done' => $wagerOtp['done'] ?? 0,
        'required' => $wagerOtp['required'] ?? 0,
        'left' => $wagerOtp['left'] ?? 0,
      ],
    ]);
    exit;
  }
  if (!isset($db['withdrawOtps']) || !is_array($db['withdrawOtps'])) $db['withdrawOtps'] = [];
  $prev = $db['withdrawOtps'][$uid] ?? null;
  $now = time();
  if (is_array($prev) && !empty($prev['lastSentAt']) && ($now - (int) $prev['lastSentAt']) < OROLADO_WD_OTP_RESEND) {
    $wait = OROLADO_WD_OTP_RESEND - ($now - (int) $prev['lastSentAt']);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => '', 'retryIn' => $wait, 'cooldown' => true, 'expiresIn' => max(0, (int) ($prev['expiresAt'] ?? 0) - $now)]);
    exit;
  }
  $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $prevRow = is_array($prev) ? $prev : [];
  orolado_otp_remember_prev($prevRow);
  $db['withdrawOtps'][$uid] = [
    'codeHash' => orolado_wd_otp_hash($uid, $code),
    'expiresAt' => $now + OROLADO_WD_OTP_TTL,
    'lastSentAt' => $now,
    'attempts' => 0,
    'prevHashes' => $prevRow['prevHashes'] ?? [],
  ];
  save_db($file, $db);
  ignore_user_abort(true);
  $sent = brevo_send_wd_otp($email, $code);
  if (empty($sent['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $sent['reason'] ?? 'Impossible d’envoyer le code. Réessayez.']);
    exit;
  }
  $db['withdrawOtps'][$uid]['expiresAt'] = time() + OROLADO_WD_OTP_TTL;
  $db['withdrawOtps'][$uid]['lastSentAt'] = time();
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'expiresIn' => OROLADO_WD_OTP_TTL, 'resendIn' => OROLADO_WD_OTP_RESEND]);
  exit;
}

if ($action === 'withdraw') {
  $st = orolado_session_inspect($db, $token);
  if (empty($st['ok'])) {
    echo json_encode($st);
    exit;
  }
  $me = $st['user'];
  $uidOtp = (string) ($me['id'] ?? '');
  $otpCode = preg_replace('/\D/', '', (string) ($req['otp'] ?? $req['otpCode'] ?? ''));
  if (strlen($otpCode) !== 6) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code de confirmation requis', 'needOtp' => true]);
    exit;
  }
  if (!isset($db['withdrawOtps']) || !is_array($db['withdrawOtps'])) $db['withdrawOtps'] = [];
  $otpRow = $db['withdrawOtps'][$uidOtp] ?? null;
  $nowOtp = time();
  if (!is_array($otpRow)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré. Demandez un nouveau code.', 'needOtp' => true, 'expired' => true]);
    exit;
  }
  $tries = (int) ($otpRow['attempts'] ?? 0);
  if ($tries >= 5) {
    unset($db['withdrawOtps'][$uidOtp]);
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Trop de tentatives. Demandez un nouveau code.', 'needOtp' => true]);
    exit;
  }
  if (!orolado_wd_otp_row_match($otpRow, $uidOtp, $otpCode)) {
    if (!orolado_otp_row_alive($otpRow)) {
      unset($db['withdrawOtps'][$uidOtp]);
      save_db($file, $db);
      echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code expiré. Demandez un nouveau code.', 'needOtp' => true, 'expired' => true]);
      exit;
    }
    $db['withdrawOtps'][$uidOtp]['attempts'] = $tries + 1;
    save_db($file, $db);
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Code invalide ou expiré. Demandez-en un nouveau.', 'needOtp' => true]);
    exit;
  }
  $amount = orolado_money($req['amount'] ?? 0);
  $sbVault = supabase_admin_vault((string) $me['id']);
  $real = $sbVault
    ? orolado_money($sbVault['real'] ?? 0)
    : orolado_money($db['vault'][$me['id']]['real'] ?? 0);
  $operatorEarly = preg_replace('/[^a-z0-9_]/', '', strtolower((string) ($req['operator'] ?? '')));
  $minWithdraw = function_exists('orolado_withdraw_min_for')
    ? orolado_withdraw_min_for($operatorEarly)
    : orolado_min_withdraw();
  if ($amount < $minWithdraw) {
    $minFmt = number_format($minWithdraw, 2, '.', '');
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Le retrait minimum est de $' . $minFmt . '.']);
    exit;
  }
  if ($amount > $real) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Solde insuffisant']);
    exit;
  }
  // Wagering ×2 à vie : mises ≥ 2 × TOUS les dépôts validés (pas le premier seul).
  $freshUser = (isset($db['users'][$uidOtp]) && is_array($db['users'][$uidOtp]))
    ? array_merge($me, $db['users'][$uidOtp])
    : $me;
  $wager = function_exists('orolado_wager_check')
    ? orolado_wager_check($db, is_array($freshUser) ? $freshUser : [], $real)
    : ['ok' => false, 'required' => 0, 'done' => 0, 'left' => 0, 'msg' => 'Vous devez miser x2 de votre dépôt avant de pouvoir effectuer un retrait.'];
  $freeWd = orolado_money($wager['free'] ?? 0);
  if ($amount > $freeWd + 0.009) {
    echo json_encode([
      'ok' => false,
      'server' => true,
      'reason' => $wager['msg'] ?? 'Vous devez miser x2 de votre dépôt avant de pouvoir effectuer un retrait.',
      'wager' => [
        'done' => $wager['done'] ?? 0,
        'required' => $wager['required'] ?? 0,
        'left' => $wager['left'] ?? 0,
        'free' => $freeWd,
        'locked' => $wager['locked'] ?? 0
      ]
    ]);
    exit;
  }
  $operator = preg_replace('/[^a-z0-9_]/', '', strtolower((string) ($req['operator'] ?? 'wave')));
  $allowedOps = ['wave', 'orange', 'mtn', 'moov', 'mpesa', 'airtel', 'usdt', 'btc', 'eth', 'trx', 'sol', 'bnb', 'ltc', 'doge', 'paypal', 'bank', 'card', 'opay', 'palmpay', 'pix', 'mercadopago', 'nequi', 'gcash', 'upi', 'stcpay', 'picpay', 'papara', 'skrill', 'neteller', 'payeer', 'perfectmoney', 'revolut'];
  if (!in_array($operator, $allowedOps, true)) $operator = 'wave';
  $destination = trim((string) ($req['destination'] ?? $req['phone'] ?? ''));
  $beneficiary = trim((string) ($req['beneficiary'] ?? $me['displayName'] ?? ''));
  $countryCode = preg_replace('/[^\d+]/', '', (string) ($req['countryCode'] ?? ''));
  if ($countryCode === '') $countryCode = '+1';
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
  if ($sbVault && !supabase_debit_real((string) $me['id'], $amount)) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Solde insuffisant']);
    exit;
  }
  unset($db['withdrawOtps'][$uidOtp]);
  $after = $sbVault ? supabase_admin_vault((string) $me['id']) : null;
  $db['vault'][$me['id']]['real'] = $after
    ? orolado_money($after['real'] ?? 0)
    : orolado_money($real - $amount);
  $wdId = uniqid('wd_', true);
  $db['withdrawals'][] = [
    'id' => $wdId,
    'userId' => $me['id'],
    'name' => $beneficiary,
    'email' => $me['email'] ?? '',
    'amount' => $amount,
    'amountFcfa' => $amountFcfa,
    'currency' => 'USD',
    'status' => 'pending',
    'suspect' => $suspect,
    'operator' => $operator,
    'method' => $operator,
    'methodName' => trim((string) ($req['methodName'] ?? $operator)),
    'phone' => $destination,
    'destination' => $destination,
    'beneficiary' => $beneficiary,
    'countryCode' => $countryCode,
    'at' => date('c'),
    'clock' => date('H:i:s')
  ];
  $db['withdrawals'] = array_values(array_reverse($db['withdrawals']));
  save_db($file, $db);
  echo json_encode(['ok' => true, 'server' => true, 'suspect' => $suspect, 'vault' => $db['vault'][$me['id']], 'id' => $wdId, 'amount' => $amount]);
  exit;
}

if ($action === 'resolveWithdraw') {
  $me = orolado_require_admin($db, $token);
  $id = $req['id'] ?? '';
  $act = strtolower((string) ($req['act'] ?? ''));
  if ($act === '') $act = !empty($req['approve']) ? 'approve' : 'reject';
  foreach ($db['withdrawals'] as &$w) {
    if (($w['id'] ?? '') !== $id) continue;
    if ($act === 'silent') {
      $w['status'] = 'silenced';
      $w['adminHidden'] = true;
      $w['playerHidden'] = true;
      orolado_refund_wd_once($db, $w);
      save_db($file, $db);
      echo json_encode(['ok' => true, 'server' => true, 'act' => 'silent']);
      exit;
    }
    $st = (string) ($w['status'] ?? '');
    if ($st !== 'pending' && $st !== 'review') continue;
    if ($act === 'suspend') {
      $w['status'] = 'review';
      $w['playerNote'] = 'Vérification de sécurité';
      save_db($file, $db);
      echo json_encode(['ok' => true, 'server' => true, 'act' => 'suspend']);
      exit;
    }
    $approve = ($act === 'approve');
    $w['status'] = $approve ? 'approved' : 'rejected';
    if (!$approve) orolado_refund_wd_once($db, $w);
    save_db($file, $db);
    echo json_encode(['ok' => true, 'server' => true, 'act' => $act]);
    exit;
  }
  echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Retrait introuvable']);
  exit;
}

if ($action === 'placeOrder') {
  $stSess = orolado_session_inspect($db, $token);
  if (empty($stSess['ok'])) {
    echo json_encode($stSess);
    exit;
  }
  $me = $stSess['user'];
  $stake = orolado_money($req['stake'] ?? 0);
  $side = (($req['side'] ?? '') === 'put') ? 'put' : 'call';
  $duration = (int) ($req['duration'] ?? 10);
  if (!in_array($duration, [5, 10, 30, 60, 300, 600], true)) $duration = 10;
  $mode = (($req['mode'] ?? '') === 'real') ? 'real' : 'demo';
  $oid = preg_replace('/[^a-zA-Z0-9_\-.]/', '', (string) ($req['id'] ?? ''));
  if ($stake < 1 || $oid === '') {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Mise invalide']);
    exit;
  }
  $uid = (string) $me['id'];
  if (!isset($db['orders']) || !is_array($db['orders'])) $db['orders'] = [];
  $already = false;
  foreach ($db['orders'] as $o) {
    if (($o['id'] ?? '') === $oid) {
      $already = true;
      break;
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
  $officialReal = null;
  $debitedOfficial = false;
  if ($mode === 'real') {
    $sbVault = supabase_admin_vault($uid);
    if ($already) {
      $officialReal = $sbVault ? orolado_money($sbVault['real'] ?? 0) : null;
    } else if ($sbVault) {
      if (!supabase_debit_real($uid, $stake)) {
        echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Solde insuffisant']);
        exit;
      }
      $debitedOfficial = true;
      $sbVault = supabase_admin_vault($uid);
      $officialReal = $sbVault ? orolado_money($sbVault['real'] ?? 0) : null;
    }
  }
  $placed = with_db_lock(function ($box) use ($uid, $oid, $stake, $side, $duration, $mode, $payout, $assetId, $openPrice, $officialReal) {
    $locked =& $box->db;
    if (!isset($locked['orders']) || !is_array($locked['orders'])) $locked['orders'] = [];
    if (!isset($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
    foreach ($locked['orders'] as $o) {
      if (($o['id'] ?? '') === $oid) {
        return [
          'ok' => true,
          'orderId' => $oid,
          'payout' => $o['payout'] ?? $payout,
          'vault' => $locked['vault'][$uid] ?? null,
          'duplicate' => true
        ];
      }
    }
    $now = microtime(true);
    $open = 0;
    foreach ($locked['orders'] as $o) {
      if (($o['userId'] ?? '') !== $uid || ($o['status'] ?? '') !== 'open') continue;
      $oMode = (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo';
      if ($oMode !== $mode) continue;
      $deadline = (float) ($o['at'] ?? 0) + (int) ($o['duration'] ?? 10) + 30;
      if ($deadline > $now) $open++;
    }
    if ($open >= 10) {
      return ['ok' => false, 'reason' => 'Maximum 10 trades en cours', 'skip_write' => true];
    }
    if ($mode === 'demo') {
      $bal = orolado_money($locked['vault'][$uid]['demo'] ?? 0);
      if ($bal <= 0 && (int) ($locked['users'][$uid]['trades'] ?? 0) === 0) {
        $locked['vault'][$uid]['demo'] = 1000000;
        $bal = 1000000;
      }
      if ($stake > $bal) {
        return ['ok' => false, 'reason' => 'Solde insuffisant', 'skip_write' => true];
      }
      $locked['vault'][$uid]['demo'] = orolado_money($bal - $stake);
    } else {
      $bal = $officialReal !== null
        ? orolado_money($officialReal)
        : orolado_money($locked['vault'][$uid]['real'] ?? 0);
      if ($officialReal === null && $stake > $bal + 0.009) {
        return ['ok' => false, 'reason' => 'Solde insuffisant', 'skip_write' => true];
      }
      $afterOpen = $officialReal !== null ? $bal : orolado_money($bal - $stake);
      $locked['vault'][$uid]['real'] = $afterOpen;
    }
    if ($mode === 'real' && isset($locked['users'][$uid])) {
      $locked['users'][$uid]['realStakeVolume'] = orolado_money(($locked['users'][$uid]['realStakeVolume'] ?? 0) + $stake);
      $locked['users'][$uid]['totalWageredSinceDeposit'] = orolado_money($locked['users'][$uid]['realStakeVolume'] ?? 0);
      $depTot = orolado_money($locked['users'][$uid]['realDepositTotal'] ?? 0);
      $locked['users'][$uid]['requiredWagering'] = $depTot * 2;
      $locked['users'][$uid]['realTrades'] = (int) ($locked['users'][$uid]['realTrades'] ?? 0) + 1;
      if (function_exists('orolado_apply_wager_progress')) {
        orolado_apply_wager_progress($locked['users'][$uid], $stake);
      }
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
      'expiryAt' => microtime(true) + $duration,
      'balAfterOpen' => $mode === 'real' ? orolado_money($locked['vault'][$uid]['real'] ?? 0) : null,
      'stakeTaken' => $mode === 'real'
    ];
    return ['ok' => true, 'orderId' => $oid, 'payout' => $payout, 'vault' => $locked['vault'][$uid]];
  });
  if (empty($placed['ok'])) {
    if ($mode === 'real' && !$already && $debitedOfficial) {
      supabase_credit_real($uid, $stake, false);
    }
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $placed['reason'] ?? 'Ordre refusé']);
    exit;
  }
  $outVault = $placed['vault'] ?? ($db['vault'][$uid] ?? ['demo' => 0, 'real' => 0]);
  if ($mode === 'real') {
    $sbNow = supabase_admin_vault($uid);
    if ($sbNow) {
      $outVault['real'] = orolado_money($sbNow['real'] ?? 0);
      with_db_lock(function ($box) use ($uid, $outVault) {
        if (!isset($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 0, 'real' => 0];
        $box->db['vault'][$uid]['real'] = orolado_money($outVault['real'] ?? 0);
        return ['ok' => true];
      });
    } else if ($officialReal !== null) {
      $outVault['real'] = $officialReal;
    }
  }
  echo json_encode(['ok' => true, 'server' => true, 'orderId' => $oid, 'payout' => $placed['payout'] ?? $payout, 'vault' => $outVault, 'duplicate' => !empty($placed['duplicate'])]);
  exit;
}

if ($action === 'settleOrder') {
  $stSess = orolado_session_inspect($db, $token);
  if (empty($stSess['ok'])) {
    echo json_encode($stSess);
    exit;
  }
  $me = $stSess['user'];
  $oid = preg_replace('/[^a-zA-Z0-9_\-.]/', '', (string) ($req['orderId'] ?? ''));
  $wantWon = array_key_exists('won', $req) ? !empty($req['won']) : null;
  $voided = !empty($req['voided']);
  $closePrice = isset($req['exitPrice']) ? (float) $req['exitPrice'] : (isset($req['closePrice']) ? (float) $req['closePrice'] : null);
  $reqStake = orolado_money($req['stake'] ?? 0);
  $reqMode = (($req['mode'] ?? '') === 'real') ? 'real' : 'demo';
  $reqSide = (($req['side'] ?? '') === 'put') ? 'put' : ((($req['side'] ?? '') === 'call') ? 'call' : '');
  $reqEntry = isset($req['entryPrice']) ? (float) $req['entryPrice'] : (isset($req['openPrice']) ? (float) $req['openPrice'] : 0);
  $reqBal = array_key_exists('balanceAfter', $req) ? orolado_money($req['balanceAfter']) : null;
  if ($reqBal !== null && ($reqBal < 0 || $reqBal > 50000000)) $reqBal = null;
  $oddsAllowed = [1.88, 6.0, 11.0, 51.0];
  $payoutReq = (float) ($req['payout'] ?? $req['odds'] ?? 1.88);
  $reqPayout = 1.88;
  foreach ($oddsAllowed as $od) {
    if (abs($od - $payoutReq) < 0.001) { $reqPayout = $od; break; }
  }
  $uid = (string) $me['id'];
  $isAdmin = orolado_is_admin_user($me);
  $settled = with_db_lock(function ($box) use ($oid, $uid, $wantWon, $voided, $closePrice, $reqStake, $reqMode, $reqPayout, $reqBal, $reqSide, $reqEntry, $isAdmin) {
    $locked =& $box->db;
    if (!isset($locked['orders']) || !is_array($locked['orders'])) $locked['orders'] = [];
    foreach ($locked['orders'] as &$o) {
      if (($o['id'] ?? '') !== $oid || ($o['userId'] ?? '') !== $uid) continue;
      $stake = orolado_money($o['stake']);
      $payout = (float) ($o['payout'] ?? 1.88);
      $mode = ($o['mode'] ?? 'demo') === 'real' ? 'real' : 'demo';
      $st = (string) ($o['status'] ?? '');
      if ($st === 'won' || $st === 'lost' || $st === 'void' || $st === 'closed') {
        $won = !empty($o['won']);
        $isVoid = ($st === 'void') || !empty($o['voided']);
        $credit = $isVoid ? $stake : ($won ? orolado_money($stake * $payout) : 0);
        $net = $isVoid ? 0 : ($won ? orolado_money($credit - $stake) : orolado_money(-$stake));
        return [
          'ok' => true,
          'won' => $won,
          'voided' => $isVoid,
          'net' => $net,
          'payout' => $payout,
          'credit' => $credit,
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
      if ($elapsed < max(0, ((int) $o['duration']) - 2.5)) {
        return ['ok' => false, 'reason' => 'Position encore ouverte', 'skip_write' => true];
      }
      $side = (($o['side'] ?? $reqSide) === 'put') ? 'put' : 'call';
      $entry = (float) ($o['openPrice'] ?? $o['entryPrice'] ?? $reqEntry);
      $profile = ($mode === 'demo') ? 'demo' : ($isAdmin ? 'admin' : 'real');
      $voided = false;
      $won = orolado_sealed_roll($payout, $profile);
      $credit = orolado_trade_credit($won, $voided, $stake, $payout);
      $net = $voided ? 0 : ($won ? orolado_money($credit - $stake) : orolado_money(-$stake));
      $final = $voided ? 'void' : ($won ? 'won' : 'lost');
      if (!isset($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 0, 'real' => 0];
      $balKey = $mode === 'real' ? 'real' : 'demo';
      if ($mode !== 'real' && $credit > 0 && empty($o['paidOut'])) {
        $locked['vault'][$uid][$balKey] = orolado_money(($locked['vault'][$uid][$balKey] ?? 0) + $credit);
        $o['paidOut'] = true;
      }
      if ($mode === 'real') {
        $o['paidOut'] = true;
      }
      if ($mode === 'real' && isset($locked['users'][$uid])) {
        if (!isset($locked['users'][$uid]['transactions']) || !is_array($locked['users'][$uid]['transactions'])) {
          $locked['users'][$uid]['transactions'] = [];
        }
        array_unshift($locked['users'][$uid]['transactions'], [
          'id' => uniqid('tr_', true),
          'at' => date('c'),
          'type' => $voided ? 'void' : ($won ? 'win' : 'loss'),
          'amount' => $voided ? 0 : ($won ? $credit : orolado_money(-$stake)),
          'note' => $voided ? 'Égalité' : ($won ? 'Gain' : 'Perte'),
          'mode' => 'real'
        ]);
        $locked['users'][$uid]['transactions'] = array_slice($locked['users'][$uid]['transactions'], 0, 80);
      }
      if ($mode === 'demo' && $reqBal !== null && $reqBal + 0.009 >= orolado_money($locked['vault'][$uid]['demo'] ?? 0)) {
        $locked['vault'][$uid]['demo'] = $reqBal;
      }
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
    if ($reqMode === 'real' && !$isAdmin) {
      return ['ok' => false, 'reason' => 'Ordre introuvable', 'skip_write' => true];
    }
    if ($oid === '' || $reqStake < 1) {
      return ['ok' => false, 'reason' => 'Ordre introuvable', 'skip_write' => true];
    }
    $lateProfile = ($reqMode === 'demo') ? 'demo' : ($isAdmin ? 'admin' : 'real');
    $voided = false;
    $won = orolado_sealed_roll($reqPayout, $lateProfile);
    $credit = orolado_trade_credit($won, $voided, $reqStake, $reqPayout);
    $net = $voided ? 0 : ($won ? orolado_money($credit - $reqStake) : orolado_money(-$reqStake));
    $final = $voided ? 'void' : ($won ? 'won' : 'lost');
    if (!isset($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 0, 'real' => 0];
    $lateKey = $reqMode === 'real' ? 'real' : 'demo';
    if ($reqMode !== 'real' && $credit > 0) {
      $bal = orolado_money($locked['vault'][$uid][$lateKey] ?? 0);
      $locked['vault'][$uid][$lateKey] = orolado_money($bal + $credit);
    }
    if ($reqMode === 'demo' && $reqBal !== null && $reqBal + 0.009 >= orolado_money($locked['vault'][$uid]['demo'] ?? 0)) {
      $locked['vault'][$uid]['demo'] = $reqBal;
    }
    $locked['orders'][] = [
      'id' => $oid,
      'userId' => $uid,
      'stake' => $reqStake,
      'side' => ($reqSide !== '' ? $reqSide : 'call'),
      'duration' => 0,
      'mode' => $reqMode,
      'accountType' => $reqMode,
      'payout' => $reqPayout,
      'payoutMult' => $reqPayout,
      'won' => $won,
      'voided' => $voided,
      'status' => $final,
      'closePrice' => $closePrice,
      'at' => microtime(true),
      'late' => true
    ];
    return [
      'ok' => true,
      'won' => $won,
      'voided' => $voided,
      'net' => $net,
      'payout' => $reqPayout,
      'credit' => $credit,
      'mode' => $reqMode,
      'fresh' => true,
      'late' => true,
      'vault' => $locked['vault'][$uid]
    ];
  });
  if (empty($settled['ok'])) {
    echo json_encode(['ok' => false, 'server' => true, 'reason' => $settled['reason'] ?? 'Ordre introuvable']);
    exit;
  }
  $vaultOut = $settled['vault'] ?? ['demo' => 0, 'real' => 0];
  if (($settled['mode'] ?? '') === 'real') {
    $creditAmt = orolado_money($settled['credit'] ?? 0);
    $resolved = supabase_resolve_trade($uid, $oid, $creditAmt);
    if (!$resolved && !empty($settled['fresh']) && $creditAmt > 0) {
      supabase_credit_real($uid, $creditAmt, false);
    }
    $sbNow = supabase_admin_vault($uid);
    if ($sbNow) {
      $vaultOut['real'] = orolado_money($sbNow['real'] ?? 0);
      with_db_lock(function ($box) use ($uid, $vaultOut) {
        if (!isset($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 0, 'real' => 0];
        $box->db['vault'][$uid]['real'] = orolado_money($vaultOut['real'] ?? 0);
        return ['ok' => true];
      });
    }
  }
  $won = !empty($settled['won']);
  $net = orolado_money($settled['net'] ?? 0);
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
  $stSess = orolado_session_inspect($db, $token);
  if (empty($stSess['ok'])) {
    echo json_encode($stSess);
    exit;
  }
  $me = $stSess['user'];
  $rows = [];
  foreach (($db['deposits'] ?? []) as $d) {
    if (($d['userId'] ?? '') !== $me['id']) continue;
    $depSt = strtoupper((string) ($d['status'] ?? ''));
    if (!in_array($depSt, ['COMPLETED', 'PAID', 'SUCCESS', 'APPROVED'], true)) continue;
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
    if (orolado_wd_is_hidden_from_player($w)) continue;
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
  $stSess = orolado_session_inspect($db, $token);
  if (empty($stSess['ok'])) {
    echo json_encode($stSess);
    exit;
  }
  $me = $stSess['user'];
  if ($token !== '' && isset($db['sessions'][$token])) {
    $db['sessions'][$token]['exp'] = time() + orolado_session_ttl();
    $db['sessions'][$token]['at'] = date('c');
    save_db($file, $db);
    orolado_set_session_cookie($token);
  }
  $uid = (string) $me['id'];
  orolado_repair_overwritten_reals_once();
  if (isset($db['users'][$uid]) && is_array($db['users'][$uid])) {
    $db['users'][$uid]['lastSeen'] = date('c');
  }
  $jsonVault = $db['vault'][$uid] ?? ['demo' => 1000000, 'real' => 0];
  $jsonReal = orolado_money($jsonVault['real'] ?? 0);
  $sbLive = supabase_admin_vault($uid);
  if ($sbLive) {
    $jsonReal = orolado_money($sbLive['real'] ?? 0);
    $db['vault'][$uid]['real'] = $jsonReal;
  }
  if (function_exists('orolado_recover_wiped_real')) {
    $recovered = orolado_recover_wiped_real($db, $uid, is_array($me) ? $me : []);
    if ($recovered > $jsonReal + 0.009) {
      $jsonReal = $recovered;
      $db['vault'][$uid]['real'] = $jsonReal;
    }
  }
  $demoNow = orolado_money($jsonVault['demo'] ?? 0);
  if ($demoNow <= 0 && (int) ($me['trades'] ?? 0) === 0) {
    $demoNow = 1000000;
    $db['vault'][$uid]['demo'] = 1000000;
  }
  $officialReal = $jsonReal;
  if (!$sbLive && function_exists('orolado_official_real')) {
    $officialReal = orolado_official_real($db, $uid);
  }
  if ($officialReal <= 0.009 && function_exists('orolado_recover_wiped_real')) {
    $again = orolado_recover_wiped_real($db, $uid, is_array($me) ? $me : []);
    if ($again > $officialReal + 0.009) $officialReal = $again;
  }
  $db['vault'][$uid]['real'] = $officialReal;
  save_db($file, $db);
  if (function_exists('supabase_touch_last_seen')) {
    supabase_touch_last_seen($uid);
  }
  $vault = [
    'demo' => $demoNow,
    'real' => $officialReal
  ];
  $openOrders = [];
  $recentPositions = [];
  foreach (($db['orders'] ?? []) as $o) {
    if (($o['userId'] ?? '') !== $uid) continue;
    $st = (string) ($o['status'] ?? '');
    $opened = (float) ($o['openedAt'] ?? $o['at'] ?? 0);
    $openedMs = $opened > 0 && $opened < 1.0e11 ? (int) round($opened * 1000) : (int) $opened;
    $dur = (int) ($o['duration'] ?? 10);
    if ($st === 'open') {
      $exp = (float) ($o['expiryAt'] ?? 0);
      $expMs = $exp > 0 && $exp < 1.0e11 ? (int) round($exp * 1000) : ($openedMs + $dur * 1000);
      $openOrders[] = [
        'id' => (string) ($o['id'] ?? ''),
        'assetId' => (string) ($o['assetId'] ?? 'v100'),
        'side' => (($o['side'] ?? '') === 'put') ? 'put' : 'call',
        'stake' => orolado_money($o['stake'] ?? 0),
        'payout' => (float) ($o['payout'] ?? 1.88),
        'entryPrice' => (float) ($o['openPrice'] ?? $o['entryPrice'] ?? 0),
        'duration' => $dur,
        'startTime' => $openedMs,
        'startedAt' => $openedMs,
        'expiryTime' => $expMs,
        'expiresAt' => $expMs,
        'mode' => (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo',
        'status' => 'open',
        'settled' => false
      ];
    } else if (in_array($st, ['won', 'lost', 'void', 'closed'], true)) {
      $recentPositions[] = [
        'id' => (string) ($o['id'] ?? ''),
        'at' => date('c', $openedMs > 0 ? (int) floor($openedMs / 1000) : time()),
        'assetId' => (string) ($o['assetId'] ?? ''),
        'assetName' => (string) ($o['assetId'] ?? ''),
        'side' => (($o['side'] ?? '') === 'put') ? 'put' : 'call',
        'stake' => orolado_money($o['stake'] ?? 0),
        'payout' => (float) ($o['payout'] ?? 1.88),
        'duration' => $dur,
        'won' => !empty($o['won']),
        'voided' => ($st === 'void') || !empty($o['voided']),
        'status' => $st === 'closed' ? (!empty($o['won']) ? 'won' : 'lost') : $st,
        'net' => orolado_money($o['net'] ?? 0),
        'mode' => (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo'
      ];
    }
  }
  $wagerMe = function_exists('orolado_wager_check')
    ? orolado_wager_check($db, is_array($me) ? $me : [], $officialReal)
    : null;
  echo json_encode([
    'ok' => true,
    'server' => true,
    'user' => orolado_public_user($me),
    'vault' => $vault,
    'wager' => $wagerMe,
    'openOrders' => $openOrders,
    'positions' => array_slice(array_reverse($recentPositions), 0, 80)
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

if ($action === 'abandonDeposit') {
  echo json_encode(orolado_abandon_open_deposit(['token' => $token] + $req));
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

if ($action === 'flutterwaveCheckout' || $action === 'flutterwaveCharge') {
  echo json_encode(orolado_flutterwave_checkout(['token' => $token] + $req));
  exit;
}

if ($action === 'flutterwaveStatus') {
  echo json_encode(orolado_confirm_deposit(['token' => $token] + $req));
  exit;
}

if ($action === 'flutterwaveVerify') {
  echo json_encode(orolado_flutterwave_client_verify(['token' => $token] + $req));
  exit;
}

echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Action inconnue']);
