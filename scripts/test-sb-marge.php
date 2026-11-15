<?php
// Contrôle des marges VERROUILLÉES (propriétaire, 2026-11-12) : direct 3 %, avant-match 1 %.
// Lancer : php scripts/test-sb-marge.php
declare(strict_types=1);
$tmp = sys_get_temp_dir() . '/oro_marge_' . getmypid(); @mkdir($tmp);
putenv('OROLADO_DATA=' . $tmp);
require __DIR__ . '/../sb_lib.php';
$ok = 0; $ko = 0;
$check = function (string $n, bool $c, string $d = '') use (&$ok, &$ko) { if ($c) { $ok++; echo "  OK $n\n"; } else { $ko++; echo "  ÉCHEC $n $d\n"; } };
$check('constantes : direct 3 %, avant-match 1 %', SB_MARGE_DIRECT === 0.03 && SB_MARGE_FIXE === 0.01);
$check('sb_margin (avant-match) = 1 %', sb_margin('1x2', []) === 0.01);
$check('sb_o_margin (autres sports) = 1 %', sb_o_margin('1x2', []) === 0.01);
// direct : flux type 1xBet (≈ 7 %) — Cieza / Valencia II
$r = ['fixture' => ['status' => ['elapsed' => 63]], 'odds' => [['name' => 'Fulltime Result', 'values' => [
  ['value' => 'Home', 'odd' => '1.408'], ['value' => 'Draw', 'odd' => '4.09'], ['value' => 'Away', 'odd' => '8.77']]]]];
$unk = []; $m = sb_live_markets($r, [], [1, 0], $unk);
$row = $m['1x2'] ?? null; $inv = 0.0; foreach ((array) $row as $o) $inv += 1 / $o[1];
$marge = $row ? (1 - 1 / $inv) : 0;
$check('direct 1x2 : marge réelle ≈ 3 % (2,7 à 3,5 %, arrondi au centime inférieur)', $row && $marge > 0.027 && $marge < 0.035, json_encode($row) . ' marge=' . round($marge * 100, 2) . ' %');
// répartition égale : chaque cote = (1 − 3 %) / p juste
$fair = [1 / 1.408, 1 / 4.09, 1 / 8.77]; $s = array_sum($fair);
$ex = array_map(fn($p) => floor((1 - 0.03) / ($p / $s) * 100 + 1e-6) / 100, $fair);
$check('direct 1x2 : répartie également sur les 3 choix', $row && abs($row[0][1] - $ex[0]) < 0.011 && abs($row[1][1] - $ex[1]) < 0.011 && abs($row[2][1] - $ex[2]) < 0.011, json_encode([$row, $ex]));
// VERROU 3 % (propriétaire, 2026-11-16) : 2 000 matchs au hasard — chaque choix du direct garde AU MOINS 3 % pour la maison
// (jamais une cote plus généreuse que la cote juste − 3 %) ; l'arrondi au centime inférieur ajoute au plus quelques dixièmes.
mt_srand(7); $worst = 1.0; $bad = 0; $maxEdge = 0.0;
for ($i = 0; $i < 2000; $i++) {
  $a = mt_rand(5, 90) / 100; $b = mt_rand(5, 60) / 100; $c = mt_rand(3, 60) / 100; $t = $a + $b + $c;
  $rr = ['fixture' => ['status' => ['elapsed' => 30]], 'odds' => [['name' => 'Fulltime Result', 'values' => [
    ['value' => 'Home', 'odd' => (string) round(1 / ($a / $t * 1.07), 3)], ['value' => 'Draw', 'odd' => (string) round(1 / ($b / $t * 1.07), 3)], ['value' => 'Away', 'odd' => (string) round(1 / ($c / $t * 1.07), 3)]]]]];
  $u = []; $mm = sb_live_markets($rr, [], [0, 0], $u); $rw = $mm['1x2'] ?? null; if (!$rw) continue;
  $fair = [$a / $t, $b / $t, $c / $t];
  foreach ($rw as $j => $o) { if ($o[1] <= 1.01) continue; $ret = $fair[$j] * $o[1]; if ($ret > 0.97 + 0.0005) $bad++; $maxEdge = max($maxEdge, 1 - $ret); $worst = min($worst, 1 - $ret); }
}
$check('VERROU direct 3 % : sur 2 000 matchs, aucun choix ne rend plus que 97 %', $bad === 0, 'mauvais=' . $bad . ' · part maison min ' . round($worst * 100, 2) . ' %');
$check('VERROU direct 3 % : le code du direct lit bien la constante', (bool) preg_match('/\$m = SB_MARGE_DIRECT;/', (string) file_get_contents(__DIR__ . '/../sb_lib.php')));
echo "\nRésultat : $ok OK, $ko échec(s)\n";
exit($ko ? 1 : 0);
