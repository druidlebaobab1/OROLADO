<?php
declare(strict_types=1);

$data = trim((string) ($_GET['d'] ?? $_GET['data'] ?? ''));
if ($data === '' || strlen($data) > 256) {
  http_response_code(400);
  exit;
}
if (!preg_match('/^[A-Za-z0-9:_+=.\\/-]+$/', $data)) {
  http_response_code(400);
  exit;
}

$urls = [
  'https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=' . rawurlencode($data),
  'https://quickchart.io/qr?size=160&margin=1&text=' . rawurlencode($data),
  'https://image-charts.com/chart?chs=160x160&cht=qr&chld=M|1&chl=' . rawurlencode($data),
];
$bin = '';
foreach ($urls as $url) {
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_TIMEOUT => 8,
      CURLOPT_CONNECTTIMEOUT => 4,
      CURLOPT_USERAGENT => 'OROLADO-QR/1.0',
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $type = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    if (is_string($raw) && $raw !== '' && $code >= 200 && $code < 300 && strncmp($raw, "\x89PNG", 4) === 0) {
      $bin = $raw;
      break;
    }
    if (is_string($raw) && $raw !== '' && $code >= 200 && $code < 300 && stripos($type, 'image/') === 0) {
      $bin = $raw;
      break;
    }
  } else {
    $raw = @file_get_contents($url);
    if (is_string($raw) && $raw !== '' && (strncmp($raw, "\x89PNG", 4) === 0 || strncmp($raw, "\xFF\xD8", 2) === 0)) {
      $bin = $raw;
      break;
    }
  }
}
if ($bin === '') {
  http_response_code(502);
  exit;
}
header('Content-Type: image/png');
header('Cache-Control: public, max-age=3600');
echo $bin;
