<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/orolado_lib.php';
orolado_load_env();
@set_time_limit(25);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  header('Content-Type: text/plain; charset=utf-8');
  echo 'OK';
  exit;
}

$raw = file_get_contents('php://input') ?: '';
$hash = (string) ($_SERVER['HTTP_VERIF_HASH'] ?? $_SERVER['REDIRECT_HTTP_VERIF_HASH'] ?? '');
if ($hash === '' && function_exists('getallheaders')) {
  $hdrs = getallheaders();
  if (is_array($hdrs)) {
    foreach ($hdrs as $k => $v) {
      if (strcasecmp((string) $k, 'verif-hash') === 0) {
        $hash = (string) $v;
        break;
      }
    }
  }
}
$out = orolado_flutterwave_webhook($raw, $hash);
http_response_code((int) ($out['http'] ?? 200));
header('Content-Type: text/plain; charset=utf-8');
echo (string) ($out['body'] ?? 'OK');
