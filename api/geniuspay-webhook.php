<?php
declare(strict_types=1);

// 2026-11-19 — messages de GeniusPay (paiement réussi, échoué…). Le message n'est qu'un réveil : le crédit passe
// toujours par une vérification auprès de l'API GeniusPay (geniuspay_lib.php → gp_verify).
require_once dirname(__DIR__) . '/orolado_lib.php';
orolado_load_env();
@set_time_limit(25);
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  header('Content-Type: text/plain; charset=utf-8');
  echo 'OK';
  exit;
}
$raw = (string) (file_get_contents('php://input') ?: '');
$out = function_exists('orolado_geniuspay_webhook') ? orolado_geniuspay_webhook(substr($raw, 0, 200000)) : ['http' => 200, 'body' => 'OK'];
http_response_code((int) ($out['http'] ?? 200));
header('Content-Type: text/plain; charset=utf-8');
echo (string) ($out['body'] ?? 'OK');
