<?php
declare(strict_types=1);
/**
 * Migration sécurisée FCFA → USD (1 USD = 600 FCFA).
 *
 * Usage CLI :
 *   php migrate_fcfa_to_usd.php
 *   php migrate_fcfa_to_usd.php --dry-run
 *
 * Ou HTTP (admin) :
 *   /migrate_fcfa_to_usd.php?key=VOTRE_DEBUG_LOG_KEY&run=1
 *
 * Effets :
 *  - vault.real /= 600 (2 décimales)
 *  - vault.demo = 1_000_000 pour tous
 *  - realDepositTotal / realStakeVolume / requiredWagering / totalWageredSinceDeposit /= 600
 *  - montants deposits/withdrawals (pending + historiques monétaires) /= 600
 *  - Ne touche PAS emails, passwords, IDs, messages, sessions
 *  - Idempotent via db.currency === 'USD' + fxMigratedAt
 */
require_once __DIR__ . '/orolado_lib.php';
orolado_load_env();

$isCli = (PHP_SAPI === 'cli');
$dry = $isCli && in_array('--dry-run', $argv ?? [], true);
$force = $isCli && in_array('--force', $argv ?? [], true);

if (!$isCli) {
  header('Content-Type: application/json; charset=utf-8');
  $key = (string) ($_GET['key'] ?? '');
  $expected = trim((string) (getenv('DEBUG_LOG_KEY') ?: ($_ENV['DEBUG_LOG_KEY'] ?? '')));
  if ($expected === '' || !hash_equals($expected, $key)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'reason' => 'forbidden']);
    exit;
  }
  $dry = isset($_GET['dry']);
  $force = isset($_GET['force']);
  if (!isset($_GET['run']) && !$dry) {
    echo json_encode(['ok' => false, 'reason' => 'Ajoutez &run=1 pour exécuter (ou &dry=1 pour simulation)']);
    exit;
  }
}

$file = orolado_data_file();
$rate = orolado_usd_fcfa_rate();
$demoStart = 1000000.0;

$fp = fopen($file, 'c+');
if (!$fp) {
  $out = ['ok' => false, 'reason' => 'cannot open db'];
  echo $isCli ? (json_encode($out, JSON_PRETTY_PRINT) . PHP_EOL) : json_encode($out);
  exit(1);
}
flock($fp, LOCK_EX);
$raw = stream_get_contents($fp);
$db = json_decode($raw ?: '', true);
if (!is_array($db)) $db = blank_db();
$db = array_merge(blank_db(), $db);

if (!$force && (($db['currency'] ?? '') === 'USD') && !empty($db['fxMigratedAt'])) {
  flock($fp, LOCK_UN);
  fclose($fp);
  $out = ['ok' => true, 'skipped' => true, 'reason' => 'already_migrated', 'at' => $db['fxMigratedAt']];
  echo $isCli ? (json_encode($out, JSON_PRETTY_PRINT) . PHP_EOL) : json_encode($out);
  exit(0);
}

function mig_usd($n, float $rate): float {
  return round(((float) $n) / $rate, 2);
}

$stats = [
  'vaults' => 0,
  'users' => 0,
  'deposits' => 0,
  'withdrawals' => 0,
  'rate' => $rate,
  'dry' => $dry,
];

if (!isset($db['vault']) || !is_array($db['vault'])) $db['vault'] = [];
foreach ($db['vault'] as $uid => $v) {
  if (!is_array($v)) continue;
  $real = (float) ($v['real'] ?? 0);
  $db['vault'][$uid]['real'] = mig_usd($real, $rate);
  $db['vault'][$uid]['demo'] = $demoStart;
  $stats['vaults']++;
}

if (!isset($db['users']) || !is_array($db['users'])) $db['users'] = [];
foreach ($db['users'] as $uid => $u) {
  if (!is_array($u)) continue;
  foreach (['realDepositTotal', 'realStakeVolume', 'requiredWagering', 'totalWageredSinceDeposit'] as $k) {
    if (isset($u[$k])) $db['users'][$uid][$k] = mig_usd($u[$k], $rate);
  }
  // Aligne le wagering requis sur les dépôts convertis.
  $dep = (float) ($db['users'][$uid]['realDepositTotal'] ?? 0);
  if ($dep > 0) {
    $db['users'][$uid]['requiredWagering'] = round($dep * 2, 2);
  }
  $stats['users']++;
}

if (!isset($db['deposits']) || !is_array($db['deposits'])) $db['deposits'] = [];
foreach ($db['deposits'] as $i => $d) {
  if (!is_array($d) || !isset($d['amount'])) continue;
  $db['deposits'][$i]['amount'] = mig_usd($d['amount'], $rate);
  $db['deposits'][$i]['currency'] = 'USD';
  $stats['deposits']++;
}

if (!isset($db['withdrawals']) || !is_array($db['withdrawals'])) $db['withdrawals'] = [];
foreach ($db['withdrawals'] as $i => $w) {
  if (!is_array($w) || !isset($w['amount'])) continue;
  $db['withdrawals'][$i]['amount'] = mig_usd($w['amount'], $rate);
  $db['withdrawals'][$i]['currency'] = 'USD';
  $stats['withdrawals']++;
}

$db['currency'] = 'USD';
$db['fxRate'] = $rate;
$db['fxMigratedAt'] = date('c');
$db['fxNote'] = 'Converted from FCFA at fixed rate; demo balances reset to 1000000 USD';

if ($dry) {
  flock($fp, LOCK_UN);
  fclose($fp);
  $out = ['ok' => true, 'dryRun' => true, 'stats' => $stats];
  echo $isCli ? (json_encode($out, JSON_PRETTY_PRINT) . PHP_EOL) : json_encode($out);
  exit(0);
}

$json = json_encode($db, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
  flock($fp, LOCK_UN);
  fclose($fp);
  $out = ['ok' => false, 'reason' => 'encode_failed'];
  echo $isCli ? (json_encode($out, JSON_PRETTY_PRINT) . PHP_EOL) : json_encode($out);
  exit(1);
}

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, $json);
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

$out = ['ok' => true, 'migrated' => true, 'stats' => $stats, 'at' => $db['fxMigratedAt']];
echo $isCli ? (json_encode($out, JSON_PRETTY_PRINT) . PHP_EOL) : json_encode($out);
