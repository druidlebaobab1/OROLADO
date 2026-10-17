<?php
/* v2764 (propriétaire) — Classement du TOURNOI DÉMO visible par les VISITEURS (pas encore inscrits).
   Lecture seule : aucun argent, aucun compte, seulement le Top (identifiants publics ORO-… et points).
   Résultat gardé 60 s dans data/ pour ne pas recalculer à chaque visiteur. */
declare(strict_types=1);
require_once __DIR__ . '/orolado_lib.php';
require_once __DIR__ . '/top_lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');
if (!function_exists('orolado_top_status') || !function_exists('orolado_top_public') || !orolado_top_public()) {
  echo json_encode(['ok' => true, 'server' => true, 'enabled' => false]);
  exit;
}
$prev = !empty($_GET['prev']);
$cache = rtrim((string) orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'top-public' . ($prev ? '-prev' : '') . '.json';
$raw = @file_get_contents($cache);
if (is_string($raw) && $raw !== '' && @filemtime($cache) > time() - 60) { echo $raw; exit; }
try {
  $res = orolado_top_status(load_db(), ['id' => '__visiteur__'], $prev);
} catch (Throwable $e) {
  error_log('OROLADO top-public ' . $e->getMessage());
  echo json_encode(['ok' => false, 'server' => true, 'reason' => 'Indisponible']);
  exit;
}
unset($res['admin'], $res['me']);
$res['guest'] = 1;
$out = json_encode(['server' => true] + $res, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
@file_put_contents($cache, (string) $out, LOCK_EX);
echo $out;
