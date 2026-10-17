<?php
declare(strict_types=1);
/**
 * v2712 (propriétaire) — TOUR COMMUN (Sky Rush / Jet Man / Rocket) : état PUBLIC du tour, très léger.
 * Aucun compte, aucune base, aucun argent : seulement n° du tour, départ, phase, et le point d'explosion
 * UNE FOIS l'avion explosé (jamais avant). Les téléphones le lisent chaque seconde au lieu de api.php,
 * qui n'est appelé que quand le joueur a une mise en cours. ~10× moins de travail pour le serveur.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$g = (string) ($_GET['g'] ?? '');
if (!in_array($g, ['crash', 'jet', 'rocket', 'cryptox', 'horses', 'roulette'], true)) { echo '{"ok":false}'; exit; }
require_once __DIR__ . '/orolado_lib.php';
require_once __DIR__ . '/casino_lib.php';
$now = microtime(true);
$r = casino_is_draw($g) ? casino_draw_public($g, $now) : casino_round_public($g, $now); // v2718 : tirages en direct aussi
echo json_encode($r ? ['ok' => true, 'now' => $now, 'round' => $r] : ['ok' => false]);
