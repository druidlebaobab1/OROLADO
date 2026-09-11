<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/orolado_lib.php';
orolado_load_env();
@set_time_limit(20);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$raw = file_get_contents('php://input') ?: '';
$hmac = (string) ($_SERVER['HTTP_HMAC'] ?? $_SERVER['REDIRECT_HTTP_HMAC'] ?? '');
if ($hmac === '' && function_exists('getallheaders')) {
  $hdrs = getallheaders();
  if (is_array($hdrs)) {
    foreach ($hdrs as $k => $v) {
      if (strcasecmp((string) $k, 'HMAC') === 0) {
        $hmac = (string) $v;
        break;
      }
    }
  }
}
$out = orolado_oxapay_webhook($raw, $hmac);
http_response_code((int) ($out['http'] ?? 200));
header('Content-Type: text/plain; charset=utf-8');
echo (string) ($out['body'] ?? 'ok');
