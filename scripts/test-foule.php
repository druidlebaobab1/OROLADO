<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Simulateur de FOULE sur le vrai site : N visiteurs en même temps, qui se comportent comme
 * de vrais téléphones (moteur js/engine.js) :
 *  - lisent feedcache/live.js?t=<heure serveur / 250 ms> toutes les 300 ms ;
 *  - si les prix ont plus d'1 s de retard, demandent feed.php?live=1 (relance du serveur) ;
 *  - envoient leur signal de présence feed.php?hb=1 toutes les 20 s.
 * Pour chaque visiteur on rejoue l'affichage de la courbe (retard adapté, comme engine.js) et
 * on compte les « arrêts » : moments où le prix à afficher n'était pas encore arrivé.
 *
 * php -d extension=curl -d extension=openssl scripts/test-foule.php [visiteurs] [secondes] [site]
 */
$N = max(1, (int) ($argv[1] ?? 100));
$DUR = max(10, (int) ($argv[2] ?? 120));
$SITE = rtrim((string) ($argv[3] ?? 'https://orolado.com'), '/');
// Visiteurs « méchants » : bombardent feed.php?live=1 (passe par PHP, pas par Cloudflare).
$BAD = max(0, (int) ($argv[4] ?? 0));
if (!function_exists('curl_multi_init')) { fwrite(STDERR, "curl manquant\n"); exit(1); }

$ms = static fn(): int => (int) floor(microtime(true) * 1000);
$users = [];
for ($i = 0; $i < $N; $i++) {
  $users[$i] = [
    'vid' => bin2hex(random_bytes(12)), 'next' => $ms() + random_int(0, 300), 'hb' => $ms() + random_int(0, 20000),
    'busy' => false, 'last' => 0, 'delay' => 1600.0, 'need' => 1600.0, 'shown' => 0,
    'stalls' => 0, 'stallOn' => false,
  ];
}
$offset = 0; // heure serveur - heure locale
$best = PHP_INT_MAX;
for ($k = 0; $k < 5; $k++) {
  $ch = curl_init($SITE . '/feed.php?all=1&hist=1'); curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_TIMEOUT => 6]);
  $a0 = microtime(true); $b0 = curl_exec($ch); $a1 = microtime(true); curl_close($ch);
  $jj = json_decode((string) $b0, true); $rtt = (int) round(($a1 - $a0) * 1000);
  if (isset($jj['serverMs']) && $rtt < $best) { $best = $rtt; $offset = (int) $jj['serverMs'] - (int) round(($a0 + $a1) * 500); }
}
echo "heure serveur mesurée (écart $offset ms, aller-retour $best ms)
";
$badNext = [];
for ($b = 0; $b < $BAD; $b++) $badNext[$b] = $ms() + random_int(0, 300);
$mh = curl_multi_init();
$jobs = [];
$st = ['req' => 0, 'err' => 0, 'hit' => 0, 'live' => 0, 'php' => 0, 'hb' => 0, 'ages' => [], 'lat' => []];
$add = static function (int $u, string $kind, string $url) use ($mh, &$jobs) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_TIMEOUT => 8,
    CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_USERAGENT => 'Mozilla/5.0 (OROLADO test foule)', CURLOPT_ENCODING => '',
    // Test en lecture seule depuis un PC sans liste de certificats : pas de vérification.
    CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0]);
  curl_multi_add_handle($mh, $ch);
  $jobs[(int) $ch] = [$ch, $u, $kind, microtime(true)];
};
$t0 = $ms();
$end = $t0 + $DUR * 1000;
$lastReport = $t0;
while ($ms() < $end || $jobs) {
  $now = $ms();
  if ($now < $end) {
    foreach ($users as $i => &$u) {
      if (!$u['busy'] && $now >= $u['next']) {
        $u['busy'] = true;
        $u['next'] = $now + 300;
        $t = intdiv($now + $offset, 250);
        $add($i, 'live', $SITE . '/feedcache/live.js?t=' . $t);
      }
      if ($now >= $u['hb']) {
        $u['hb'] = $now + 20000;
        // a=1 : visiteurs de test, jamais comptés dans les visites ni les connectés.
        $add($i, 'hb', $SITE . '/feed.php?hb=1&a=1&v=' . $u['vid']);
      }
      // (voir plus bas : visiteurs méchants)
      // Affichage de la courbe (comme engine.js) : le prix à montrer est-il arrivé ?
      if ($u['last'] > 0) {
        $want = intdiv((int) ($now + $offset - $u['delay']), 250);
        $stall = $want > $u['last'];
        if ($stall && !$u['stallOn']) $u['stalls']++;
        $u['stallOn'] = $stall;
      }
    }
    unset($u);
    foreach ($badNext as $b => $nx) {
      if ($now >= $nx) { $badNext[$b] = $now + 300; $add(-1, 'bad', $SITE . '/feed.php?live=1&x=' . random_int(1, 999999999)); }
    }
  }
  do { $r = curl_multi_exec($mh, $running); } while ($r === CURLM_CALL_MULTI_PERFORM);
  curl_multi_select($mh, 0.02);
  while ($info = curl_multi_info_read($mh)) {
    $ch = $info['handle'];
    [$h, $ui, $kind, $sent] = $jobs[(int) $ch];
    unset($jobs[(int) $ch]);
    $raw = (string) curl_multi_getcontent($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $hsz = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_multi_remove_handle($mh, $ch);
    curl_close($ch);
    $st['req']++;
    $got = $ms();
    $st['lat'][] = (int) round(($got / 1000 - $sent) * 1000);
    if ($kind === 'hb') { $st['hb']++; if ($code !== 200) $st['err']++; continue; }
    if ($kind === 'bad') { $st['bad'] = ($st['bad'] ?? 0) + 1; if ($code !== 200) $st['badErr'] = ($st['badErr'] ?? 0) + 1; continue; }
    $u =& $users[$ui];
    $u['busy'] = false;
    if ($code !== 200) { $st['err']++; unset($u); continue; }
    if (stripos(substr($raw, 0, $hsz), 'cf-cache-status: HIT') !== false) $st['hit']++;
    $j = json_decode(substr($raw, $hsz), true);
    if (!is_array($j) || empty($j['assets']['v100'])) { $st['err']++; unset($u); continue; }
    $a = $j['assets']['v100'];
    $last = (int) $a['first'] + count($a['d']);
    if ($last > $u['last']) $u['last'] = $last;
    $age = $got + $offset - (int) ($j['at'] ?? 0);
    $st['ages'][] = $age;
    if ($kind === 'live') $st['live']++; else $st['php']++;
    // Retard adapté (copie de noteArrival dans engine.js).
    $lag = $got + $offset - $u['last'] * 250;
    if ($lag >= 0 && $lag < 8000) {
      $w = $lag + 400;
      $u['need'] = $w > $u['need'] ? $w : $u['need'] * 0.997 + $w * 0.003;
      $target = max(800, min(2600, $u['need']));
      if ($u['delay'] < $target) $u['delay'] = min($target, $u['delay'] + 80);
      else if ($u['delay'] > $target + 150) $u['delay'] = max($target, $u['delay'] - 4);
    }
    // Prix en retard : le téléphone relance le serveur (comme engine.js).
    if ($kind === 'live' && $age >= 3000 && $got < $end) { $u['busy'] = true; $add($ui, 'php', $SITE . '/feed.php?live=1'); }
    unset($u);
  }
  if ($ms() - $lastReport > 15000 && $ms() < $end) {
    $lastReport = $ms();
    $ag = $st['ages']; sort($ag);
    printf("  %3ds : %d demandes, %d erreurs, âge médian des prix %d ms\n", intdiv($ms() - $t0, 1000), $st['req'], $st['err'], $ag ? $ag[intdiv(count($ag), 2)] : 0);
  }
}
curl_multi_close($mh);
$ag = $st['ages']; sort($ag);
$la = $st['lat']; sort($la);
$stalls = array_column($users, 'stalls');
$delays = array_map(static fn($u) => (int) $u['delay'], $users);
$pc = static fn(array $a, float $p) => $a ? $a[min(count($a) - 1, (int) floor(count($a) * $p))] : 0;
echo "\n=== $N visiteurs pendant {$DUR} s sur $SITE ===\n";
printf("Demandes : %d (%.0f par seconde) | erreurs : %d | servies par Cloudflare : %d %%\n", $st['req'], $st['req'] / $DUR, $st['err'], $st['live'] ? round(100 * $st['hit'] / max(1, $st['live'] + $st['php'])) : 0);
printf("Relances du serveur par les téléphones : %d | signaux de présence : %d\n", $st['php'], $st['hb']);
printf("Visiteurs méchants (bombardent le serveur) : %d demandes, %d refusées ou en erreur
", $st['bad'] ?? 0, $st['badErr'] ?? 0);
printf("Âge des prix reçus : médian %d ms, 95 %% sous %d ms, pire %d ms\n", $pc($ag, 0.5), $pc($ag, 0.95), end($ag) ?: 0);
printf("Temps de réponse : médian %d ms, 95 %% sous %d ms\n", $pc($la, 0.5), $pc($la, 0.95));
printf("Arrêts de courbe par visiteur sur %d s : moyenne %.1f, pire %d | visiteurs sans AUCUN arrêt : %d %%\n", $DUR, array_sum($stalls) / $N, max($stalls), round(100 * count(array_filter($stalls, static fn($s) => $s === 0)) / $N));
printf("Retard d'affichage choisi par les appareils : médian %d ms, max %d ms\n", $pc(($d = $delays) && sort($d) ? $d : $d, 0.5), max($delays));
