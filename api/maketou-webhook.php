<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once dirname(__DIR__) . '/orolado_lib.php';
orolado_load_env();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  echo json_encode(['ok' => true, 'listener' => 'maketou-webhook']);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false]);
  exit;
}

$raw = file_get_contents('php://input') ?: '';
if (maketou_api_key() !== '' && !maketou_verify_hmac($raw)) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'reason' => 'signature']);
  exit;
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
  parse_str($raw, $payload);
}
if (!is_array($payload)) $payload = [];

$hit = maketou_extract_payment($payload);
if (!empty($_GET['ref']) && $hit['ref'] === '') $hit['ref'] = (string) $_GET['ref'];

if (!$hit['paid']) {
  echo json_encode(['ok' => true, 'ignored' => true]);
  exit;
}

$result = credit_paid_deposit($hit);
echo json_encode(['ok' => !empty($result['ok']), 'duplicate' => !empty($result['duplicate'])]);
