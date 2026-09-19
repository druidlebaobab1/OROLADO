<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/orolado_lib.php';
orolado_load_env();
@set_time_limit(25);
ignore_user_abort(true);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'HEAD') {
  http_response_code(200);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'OK';
  exit;
}

$raw = file_get_contents('php://input') ?: '';
if ($raw === '' && !empty($_POST)) {
  $raw = json_encode($_POST, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '';
}
$hmac = (string) ($_SERVER['HTTP_HMAC'] ?? $_SERVER['REDIRECT_HTTP_HMAC'] ?? $_SERVER['HTTP_X_HMAC'] ?? $_SERVER['HTTP_OXAPAY_HMAC'] ?? $_SERVER['HTTP_HMAC_SHA512'] ?? '');
if ($hmac === '' && function_exists('getallheaders')) {
  $hdrs = getallheaders();
  if (is_array($hdrs)) {
    foreach ($hdrs as $k => $v) {
      if (in_array(strtolower((string) $k), ['hmac', 'x-hmac', 'oxapay-hmac', 'signature', 'hmac-sha512'], true)) {
        $hmac = (string) $v;
        break;
      }
    }
  }
}
$out = orolado_oxapay_webhook($raw, $hmac);
http_response_code((int) ($out['http'] ?? 200));
header('Content-Type: text/plain; charset=utf-8');
echo (string) ($out['body'] ?? 'OK');
