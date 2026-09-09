<?php
declare(strict_types=1);
/**
 * CORRECTION URGENTE — soldes réels FCFA affichés à tort comme USD.
 *
 * Formule : Nouveau_USD = Ancien_FCFA / 500  (1000 FCFA = $2.00)
 * Exemples : 1800 → 3.60 | 1000 → 2.00 | 500 → 1.00 | 88 → 0.18 | 0 → 0.00
 *
 * Usage :
 *   php correct_real_balances_usd.php
 *   php correct_real_balances_usd.php --dry-run
 *   /correct_real_balances_usd.php?key=DEBUG_LOG_KEY&run=1
 *   /correct_real_balances_usd.php?key=DEBUG_LOG_KEY&dry=1
 *
 * SÉCURITÉ :
 *  - Ne touche PAS demo (reste 1 000 000 $)
 *  - Ne touche PAS emails, passwords, IDs, sessions, messages
 *  - Idempotent via db.fxCorrectedRate500At (une seule passe)
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
    echo json_encode(['ok' => false, 'reason' => 'Ajoutez &run=1 pour exécuter (ou &dry=1)']);
    exit;
  }
}

$RATE = 500.0; // 1000 FCFA = $2.00

$file = orolado_data_file();
$fp = fopen($file, 'c+');
if (!$fp) {
  echo json_encode(['ok' => false, 'reason' => 'cannot open db']);
  exit(1);
}
flock($fp, LOCK_EX);
$raw = stream_get_contents($fp);
$db = json_decode($raw ?: '', true);
if (!is_array($db)) $db = blank_db();
$db = array_merge(blank_db(), $db);

if (!$force && !empty($db['fxCorrectedRate500At'])) {
  flock($fp, LOCK_UN);
  fclose($fp);
  $out = [
    'ok' => true,
    'skipped' => true,
    'reason' => 'already_corrected_rate_500',
    'at' => $db['fxCorrectedRate500At'],
  ];
  echo $isCli ? (json_encode($out, JSON_PRETTY_PRINT) . PHP_EOL) : json_encode($out);
  exit(0);
}

function corr_usd($n, float $rate): float {
  return round(((float) $n) / $rate, 2);
}

/** Montants encore en FCFA brut (ex. 88, 1800) vs déjà en USD (ex. 3.60, 0.18). */
function looks_like_raw_fcfa($n): bool {
  $n = (float) $n;
  if ($n <= 0) return false;
  // Déjà converti : petits montants avec centimes typiques.
  if ($n < 20 && abs($n - round($n)) > 0.001) return false;
  // Déjà converti : petit solde USD entier plausible (< 20 $).
  if ($n > 0 && $n < 20) return false;
  return true;
}

$samples = [];
$stats = [
  'vaultsRealFixed' => 0,
  'vaultsSkipped' => 0,
  'usersFixed' => 0,
  'depositsFixed' => 0,
  'withdrawalsFixed' => 0,
  'rate' => $RATE,
  'dry' => $dry,
];

if (!isset($db['vault']) || !is_array($db['vault'])) $db['vault'] = [];
foreach ($db['vault'] as $uid => $v) {
  if (!is_array($v)) continue;
  $before = (float) ($v['real'] ?? 0);
  // Ne jamais toucher au démo.
  if (!isset($db['vault'][$uid]['demo'])) {
    $db['vault'][$uid]['demo'] = 1000000;
  }
  if ($before <= 0) {
    $db['vault'][$uid]['real'] = 0.0;
    $stats['vaultsSkipped']++;
    continue;
  }
  if (!$force && !looks_like_raw_fcfa($before)) {
    $stats['vaultsSkipped']++;
    continue;
  }
  $after = corr_usd($before, $RATE);
  $db['vault'][$uid]['real'] = $after;
  $stats['vaultsRealFixed']++;
  if (count($samples) < 12) {
    $samples[] = ['userId' => $uid, 'before' => $before, 'after' => $after];
  }
}

if (!isset($db['users']) || !is_array($db['users'])) $db['users'] = [];
foreach ($db['users'] as $uid => $u) {
  if (!is_array($u)) continue;
  $changed = false;
  foreach (['realDepositTotal', 'realStakeVolume', 'requiredWagering', 'totalWageredSinceDeposit'] as $k) {
    if (!isset($u[$k])) continue;
    $val = (float) $u[$k];
    if ($val <= 0) continue;
    if (!$force && !looks_like_raw_fcfa($val)) continue;
    $db['users'][$uid][$k] = corr_usd($val, $RATE);
    $changed = true;
  }
  $dep = (float) ($db['users'][$uid]['realDepositTotal'] ?? 0);
  if ($dep > 0) {
    $db['users'][$uid]['requiredWagering'] = round($dep * 2, 2);
    $changed = true;
  }
  if ($changed) $stats['usersFixed']++;
}

if (!isset($db['deposits']) || !is_array($db['deposits'])) $db['deposits'] = [];
foreach ($db['deposits'] as $i => $d) {
  if (!is_array($d) || !isset($d['amount'])) continue;
  $amt = (float) $d['amount'];
  if ($amt <= 0) continue;
  if (!$force && !looks_like_raw_fcfa($amt)) continue;
  $db['deposits'][$i]['amount'] = corr_usd($amt, $RATE);
  $db['deposits'][$i]['currency'] = 'USD';
  $stats['depositsFixed']++;
}

if (!isset($db['withdrawals']) || !is_array($db['withdrawals'])) $db['withdrawals'] = [];
foreach ($db['withdrawals'] as $i => $w) {
  if (!is_array($w) || !isset($w['amount'])) continue;
  $amt = (float) $w['amount'];
  if ($amt <= 0) continue;
  if (!$force && !looks_like_raw_fcfa($amt)) continue;
  $db['withdrawals'][$i]['amount'] = corr_usd($amt, $RATE);
  $db['withdrawals'][$i]['currency'] = 'USD';
  $stats['withdrawalsFixed']++;
}

$db['currency'] = 'USD';
$db['fxRate'] = $RATE;
$db['fxCorrectedRate500At'] = date('c');
$db['fxCorrectedNote'] = 'Real balances corrected FCFA/500 → USD; demo untouched';

if ($dry) {
  flock($fp, LOCK_UN);
  fclose($fp);
  $out = ['ok' => true, 'dryRun' => true, 'stats' => $stats, 'samples' => $samples];
  echo $isCli ? (json_encode($out, JSON_PRETTY_PRINT) . PHP_EOL) : json_encode($out);
  exit(0);
}

$json = json_encode($db, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
  flock($fp, LOCK_UN);
  fclose($fp);
  echo json_encode(['ok' => false, 'reason' => 'encode_failed']);
  exit(1);
}
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, $json);
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

$out = [
  'ok' => true,
  'corrected' => true,
  'stats' => $stats,
  'samples' => $samples,
  'at' => $db['fxCorrectedRate500At'],
];
echo $isCli ? (json_encode($out, JSON_PRETTY_PRINT) . PHP_EOL) : json_encode($out);
