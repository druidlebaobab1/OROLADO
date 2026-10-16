<?php
declare(strict_types=1);
/**
 * v2713 — logo d'équipe gardé chez nous (data/sports/logos/<clé>.png, voir sports_lib.php sp_team_logo).
 * Lecture seule, clé = 16 caractères hexadécimaux : impossible de lire autre chose. Gardé en cache 30 jours.
 */
$k = (string) ($_GET['k'] ?? '');
if (!preg_match('/^[a-f0-9]{16}$/', $k)) { http_response_code(404); exit; }
require_once __DIR__ . '/orolado_lib.php';
$f = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'sports' . DIRECTORY_SEPARATOR . 'logos' . DIRECTORY_SEPARATOR . $k . '.png';
if (!is_file($f)) { http_response_code(404); exit; }
header('Content-Type: image/png');
header('Cache-Control: public, max-age=2592000, immutable');
header('X-Content-Type-Options: nosniff');
header('Content-Length: ' . filesize($f));
readfile($f);
