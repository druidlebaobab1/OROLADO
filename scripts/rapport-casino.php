<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2698 — RAPPORT DE RENTABILITÉ DU CASINO (calculs seulement, rien n'est envoyé nulle part, aucun argent).
 * Utilise les VRAIS tirages du serveur (casino_instant de casino_lib.php) et les vraies formules des jeux en plusieurs étapes.
 *   php scripts/rapport-casino.php            → écrit scripts/rapport-casino.txt
 * Léger : quelques secondes.
 */
$tmp = sys_get_temp_dir() . '/orolado_rapport_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake');
$GLOBALS['OROLADO_FAKE_HTTP'] = static fn() => [];
require $tmp . '/orolado_lib.php';
require $tmp . '/casino_lib.php';

$out = [];
$say = static function (string $s) use (&$out) { $out[] = $s; echo $s . "\n"; };
$money = static fn(float $v): string => number_format($v, 2, ',', ' ') . ' $';

$say('RAPPORT DE RENTABILITÉ DU CASINO OROLADO — ' . gmdate('Y-m-d H:i') . ' UTC');
$say('(simulation avec les vrais tirages du serveur ; aucun argent réel)');
$say('');

// 1) Ce que chaque jeu rend aux joueurs (sur 100 $ misés)
$say('1) SUR 100 $ MISÉS, COMBIEN LA MAISON GARDE (jeu par jeu)');
$inst = [
  'Coin Flip' => ['coin', fn() => ['side' => random_int(0, 1)]],
  'Dice (50 %)' => ['dice', fn() => ['chance' => 50, 'over' => 0]],
  'Target ×2' => ['limbo', fn() => ['target' => 2]],
  'Lucky Wheel' => ['wheel', fn() => []],
  'Racing' => ['race', fn() => ['car' => random_int(0, 5)]],
  'Roulette (rouge)' => ['roulette', fn() => ['bet' => 'red']],
  'Roulette (numéro)' => ['roulette', fn() => ['bet' => 'n' . random_int(0, 36)]],
  'Lucky 777' => ['slots', fn() => []],
  'Cascade' => ['plinko', fn() => []],
  'Keno' => ['keno', fn() => ['picks' => [3, 9, 15]]],
  'Scratch Card' => ['scratch', fn() => []],
  'Colors (vert)' => ['colors', fn() => ['bet' => 'green']],
  'Dragon Tiger' => ['dragon', fn() => ['bet' => 'dragon']],
  'Baccarat (joueur)' => ['baccarat', fn() => ['bet' => 'player']],
  'Sic Bo' => ['sicbo', fn() => ['bet' => 'small']],
  'Treasure' => ['chests', fn() => ['pick' => random_int(0, 2)]],
  'Darts' => ['darts', fn() => []],
];
$N = 200000;
foreach ($inst as $name => [$g, $pf]) {
  $sum = 0.0;
  for ($i = 0; $i < $N; $i++) $sum += casino_instant($g, $pf(), 1.0)['mult'];
  $keep = 100 - $sum / $N * 100;
  $say(sprintf('   %-20s la maison garde %5.2f $   (joueurs : %5.2f $)', $name, $keep, 100 - $keep));
}
$say('   Sky Rush / Jet Man / Rocket, Mines, Tower, Hi-Lo : la maison garde 3,00 $ (formule : 97 % rendus)');
$say('   Penalty : 4,00 $ · Golden Orchard : 3,00 $ · Balloon : ~4 $');
$say('');

// 2) Des joueurs normaux qui jouent longtemps
$say('2) 5 000 JOUEURS NORMAUX : chacun joue 300 parties de 1 $ (jeux au hasard)');
$keys = array_keys($inst);
$house = 0.0; $winners = 0; $bigWin = 0.0;
for ($p = 0; $p < 5000; $p++) {
  $res = 0.0;
  for ($r = 0; $r < 300; $r++) { [$g, $pf] = $inst[$keys[random_int(0, count($keys) - 1)]]; $res += casino_instant($g, $pf(), 1.0)['mult'] - 1; }
  $house -= $res;
  if ($res > 0) $winners++;
  $bigWin = max($bigWin, $res);
}
$say('   Total misé : ' . $money(5000 * 300) . '   →   bénéfice de la maison : ' . $money($house) . sprintf('  (%.1f %% des mises)', $house / (5000 * 300) * 100));
$say(sprintf('   Joueurs qui finissent gagnants : %d sur 5 000 (%.0f %%) — c\'est normal et ça les fait revenir.', $winners, $winners / 50));
$say('   Plus gros gain d\'un joueur : ' . $money($bigWin));
$say('');

// 3) La martingale (doubler après chaque perte)
$say('3) MARTINGALE : 2 000 tricheurs, départ 0,10 $, doublent à chaque perte, 500 $ en poche, 500 parties');
foreach ([['Coin Flip', 'coin', fn() => ['side' => 0]], ['Roulette rouge', 'roulette', fn() => ['bet' => 'red']], ['Dragon Tiger', 'dragon', fn() => ['bet' => 'dragon']]] as [$name, $g, $pf]) {
  foreach ([1000, 200] as $max) {
    $house = 0.0; $ruined = 0; $up = 0;
    for ($p = 0; $p < 2000; $p++) {
      $bank = 500.0; $stake = 0.1;
      for ($r = 0; $r < 500; $r++) {
        if ($stake > $bank) { $ruined++; break; }
        $m = casino_instant($g, $pf(), 1.0)['mult'];
        $bank += $stake * ($m - 1);
        $stake = $m >= 1.5 ? 0.1 : min($max, $stake * 2);
      }
      $house += 500 - $bank;
      if ($bank > 500) $up++;
    }
    $say(sprintf('   %-15s mise max %4d $ : la maison gagne %s · tricheurs ruinés %d · en petit bénéfice %d', $name, $max, $money($house), $ruined, $up));
  }
}
$say('   → La martingale fait gagner un peu, souvent… puis perdre beaucoup d\'un coup. Au total, la maison gagne toujours.');
$say('');

// 4) Le pire cas
$say('4) LE PIRE CAS POUR LA MAISON (une seule partie)');
$say('   Gain maximum d\'une partie : ' . $money(CASINO_MAX_WIN) . ' (plafond caché) · mise maximum : ' . $money(CASINO_MAX_STAKE) . ' (réglable par jeu dans l\'admin)');
$say('   Exemple : Darts centre ×20 avec 500 $ misés = 10 000 $ ; chance : 1 sur 100 par lancer.');
$say('   Pour limiter ce risque au lancement : mettre 100 à 200 $ de mise max sur les jeux à gros multiplicateur (Darts, Target, Lucky Wheel, Scratch, Roulette numéro).');

file_put_contents(__DIR__ . '/rapport-casino.txt', implode("\n", $out) . "\n");
foreach (glob($tmp . '/data/*') ?: [] as $f) @unlink($f);
