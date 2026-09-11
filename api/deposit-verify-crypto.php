<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once dirname(__DIR__) . '/orolado_lib.php';
orolado_load_env();
@set_time_limit(20);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'code' => 'invalid', 'reason' => 'POST requis']);
  exit;
}

$raw = file_get_contents('php://input') ?: '';
$req = json_decode($raw, true);
if (!is_array($req)) $req = [];
$auth = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if ($auth !== '' && preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
  $req['token'] = trim($m[1]);
}

echo json_encode(orolado_verify_crypto_deposit($req));
