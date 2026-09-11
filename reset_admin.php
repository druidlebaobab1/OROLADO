<?php
declare(strict_types=1);

/**
 * Réinitialise uniquement le mot de passe admin (aucune autre donnée).
 *
 * CLI : php reset_admin.php
 * HTTP : créer le fichier data/RESET_ADMIN (vide) via FTP, puis ouvrir
 *        https://orolado.com/reset_admin.php — le fichier drapeau est
 *        supprimé automatiquement après succès.
 */
require_once __DIR__ . '/orolado_lib.php';
orolado_load_env();

$cli = PHP_SAPI === 'cli';
$flag = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'RESET_ADMIN';
if (!$cli && !is_file($flag)) {
  http_response_code(404);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Not found';
  exit;
}

$email = strtolower(trim((string) (getenv('ADMIN_EMAIL') ?: ($_ENV['ADMIN_EMAIL'] ?? 'admin@orolado.com'))));
if ($email === '') $email = 'admin@orolado.com';
$pass = trim((string) (getenv('ADMIN_PASSWORD') ?: ($_ENV['ADMIN_PASSWORD'] ?? '')));
if ($pass === '') $pass = orolado_master_admin_password();

$file = orolado_data_file();
$db = load_db($file);
$hash = orolado_hash_password($pass);

$admin = null;
foreach ($db['users'] as $u) {
  if (!is_array($u)) continue;
  if (($u['id'] ?? '') === 'admin_master' || strtolower((string) ($u['email'] ?? '')) === $email) {
    $admin = $u;
    break;
  }
}
if (!$admin) {
  $admin = [
    'id' => 'admin_master',
    'displayName' => 'Orolado',
    'email' => $email,
    'phone' => '0000000000',
    'countryCode' => '+225',
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
}
$admin['email'] = $email;
$admin['role'] = 'admin';
$admin['passwordHash'] = $hash;
$db['users'][$admin['id']] = $admin;
if (!isset($db['vault'][$admin['id']])) {
  $db['vault'][$admin['id']] = ['demo' => 1000000, 'real' => 0];
}
save_db($file, $db);
if (!$cli && is_file($flag)) @unlink($flag);

$msg = 'Admin password reset for ' . $email;
if ($cli) {
  fwrite(STDOUT, $msg . PHP_EOL);
} else {
  header('Content-Type: text/plain; charset=utf-8');
  echo $msg;
}
