<?php
declare(strict_types=1);

/**
 * Moteur continu des prix (serveur VPS). Lancé et surveillé par serveur-direct/direct.js.
 *
 * Remplace l'astuce de l'hébergement mutualisé (une page PHP qui tourne 30 s puis se relance) :
 * ici le moteur tourne sans fin, juste après chaque tick (4 fois par seconde). Il utilise
 * EXACTEMENT le même code que feed.php (feed_live_write → orolado_feed_advance) : mêmes prix,
 * mêmes fichiers, même verrou ; les trades continuent de lire ces fichiers.
 *
 * À chaque tour :
 *  - feedcache/live.js et live.json sont refaits (les téléphones qui lisent encore le fichier
 *    continuent de marcher) ;
 *  - pump.beat est écrit → feed.php sait qu'un moteur tourne et n'en lance pas d'autre ;
 *  - une ligne JSON (le direct complet) est écrite sur la sortie : direct.js l'envoie aux joueurs.
 */

if (PHP_SAPI !== 'cli') {
  http_response_code(404);
  exit;
}

require_once __DIR__ . '/../feed_live_lib.php';

@set_time_limit(0);
ignore_user_abort(true);

$dir = dirname(__DIR__) . '/feedcache';
$file = $dir . '/live.json';
// direct = 1 : les téléphones savent qu'ils peuvent se brancher sur la ligne directe (/direct).
$base = ['ok' => true, 'tickMs' => OROLADO_TICK_MS, 'direct' => 1];
$mem = [];
$lastStat = 0;
// 2026-10-27 : la liste des marchés est figée au démarrage (cache statique de orolado_feed_assets()).
// Quand indices.json change (nouveaux indices mis en ligne), ce moteur ne les voit pas et n'écrit
// PAS leur fichier direct (feedcache/a/<id>.js) → sur mobile ces indices « tic-tic » (lecture lente
// au lieu du direct). Solution : on surveille la date de indices.json ; dès qu'elle change, on sort,
// et direct.js relance aussitôt un moteur neuf qui relit indices.json et diffuse TOUS les marchés.
$idxPath = dirname(__DIR__) . '/indices.json';
clearstatcache(true, $idxPath);
$idxMtime = @filemtime($idxPath) ?: 0;
$stat = ['tours' => 0, 'travail_moy' => 0.0, 'travail_max' => 0.0, 'prix_moy' => 0.0, 'prix_max' => 0.0];
$out = fopen('php://stdout', 'w');

while (true) {
  try {
    $tm = [0, 0];
    $j = feed_live_write($dir, $file, $base, 0.03, true, $tm, $mem);
    @file_put_contents($dir . '/pump.beat', (string) orolado_feed_now_ms());
    if (fwrite($out, json_encode($j, JSON_UNESCAPED_SLASHES) . "\n") === false) exit(1);
    fflush($out);
    $stat['tours']++;
    $stat['travail_moy'] += ($tm[0] - $stat['travail_moy']) / $stat['tours'];
    $stat['travail_max'] = max($stat['travail_max'], $tm[0]);
    $stat['prix_moy'] += ($tm[1] - $stat['prix_moy']) / $stat['tours'];
    $stat['prix_max'] = max($stat['prix_max'], $tm[1]);
    if (time() - $lastStat >= 2) {
      $lastStat = time();
      @file_put_contents($dir . '/pump.stat', json_encode(array_map(static fn($v) => is_float($v) ? round($v) : $v, $stat) + ['moteur' => 'vps', 'a' => date('H:i:s')]));
      // Mesure « depuis le démarrage » remise à zéro chaque heure : on voit les à-coups récents.
      if ($stat['tours'] > 14400) $stat = ['tours' => 0, 'travail_moy' => 0.0, 'travail_max' => 0.0, 'prix_moy' => 0.0, 'prix_max' => 0.0];
      // indices.json a-t-il changé ? (nouveaux marchés mis en ligne) → sortir pour être relancé neuf.
      clearstatcache(true, $idxPath);
      $mt = @filemtime($idxPath) ?: 0;
      if ($mt !== 0 && $mt !== $idxMtime) {
        error_log('OROLADO moteur-prix : indices.json a changé → relance (prise en compte des nouveaux indices)');
        fflush($out);
        exit(0); // direct.js relance aussitôt un moteur neuf (relit indices.json)
      }
    }
  } catch (Throwable $e) {
    error_log('OROLADO moteur-prix ' . $e->getMessage());
  }
  // Juste après le prochain tick (toutes les 250 ms).
  $now = orolado_feed_now_ms();
  $next = (intdiv($now, OROLADO_TICK_MS) + 1) * OROLADO_TICK_MS + 15;
  usleep(max(5000, ($next - $now) * 1000));
}
