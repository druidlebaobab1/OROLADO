<?php
declare(strict_types=1);

/**
 * Lecture du journal Maketou. Accès réservé :
 *  - ?key=<DEBUG_LOG_KEY du .env>   (clé dédiée, recommandé)
 *  - ?token=<jeton de session admin>
 * Options : &lines=200 (défaut 200, max 2000), &clear=1 pour vider le journal.
 */

require_once __DIR__ . '/orolado_lib.php';
orolado_load_env();

header('Content-Type: text/plain; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$key = (string) ($_GET['key'] ?? $_POST['key'] ?? '');
$token = (string) ($_GET['token'] ?? $_POST['token'] ?? '');
$expected = supabase_env('DEBUG_LOG_KEY');

$granted = false;
if ($expected !== '' && $key !== '' && hash_equals($expected, $key)) $granted = true;
if (!$granted && $token !== '') {
  $db = load_db(orolado_data_file());
  $me = orolado_session_user($db, $token);
  if ($me && ($me['role'] ?? '') === 'admin') $granted = true;
}

if (!$granted) {
  http_response_code(403);
  echo "Accès refusé. Ajoutez ?key=<DEBUG_LOG_KEY> ou ?token=<jeton admin>.\n";
  exit;
}

$file = maketou_log_file();

if (!empty($_GET['clear'])) {
  @file_put_contents($file, '');
  echo "Journal vidé.\n";
  exit;
}

if (!is_file($file)) {
  echo "Aucun journal pour l'instant : " . $file . "\n";
  exit;
}

$lines = file($file, FILE_IGNORE_NEW_LINES) ?: [];
$want = (int) ($_GET['lines'] ?? 200);
if ($want < 1) $want = 200;
if ($want > 2000) $want = 2000;
$lines = array_slice($lines, -$want);

echo "# " . $file . " — " . count($lines) . " dernières lignes\n\n";
foreach ($lines as $line) {
  $row = json_decode($line, true);
  if (!is_array($row)) {
    echo $line . "\n";
    continue;
  }
  echo '=== ' . (string) ($row['ts'] ?? '') . ' · ' . (string) ($row['event'] ?? '') . " ===\n";
  unset($row['ts'], $row['event']);
  echo json_encode($row, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
}
