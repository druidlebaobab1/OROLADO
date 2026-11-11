<?php
// Contrôle des marges VERROUILLÉES (propriétaire, 2026-11-12) : direct 4 %, avant-match 1 %.
// Lancer : php scripts/test-sb-marge.php
declare(strict_types=1);
$tmp = sys_get_temp_dir() . '/oro_marge_' . getmypid(); @mkdir($tmp);
putenv('OROLADO_DATA=' . $tmp);
require __DIR__ . '/../sb_lib.php';
$ok = 0; $ko = 0;
$check = function (string $n, bool $c, string $d = '') use (&$ok, &$ko) { if ($c) { $ok++; echo "  OK $n\n"; } else { $ko++; echo "  ÉCHEC $n $d\n"; } };
$check('constantes : direct 4 %, avant-match 1 %', SB_MARGE_DIRECT === 0.04 && SB_MARGE_FIXE === 0.01);
$check('sb_margin (avant-match) = 1 %', sb_margin('1x2', []) === 0.01);
$check('sb_o_margin (autres sports) = 1 %', sb_o_margin('1x2', []) === 0.01);
// direct : flux type 1xBet (≈ 7 %) — Cieza / Valencia II
$r = ['fixture' => ['status' => ['elapsed' => 63]], 'odds' => [['name' => 'Fulltime Result', 'values' => [
  ['value' => 'Home', 'odd' => '1.408'], ['value' => 'Draw', 'odd' => '4.09'], ['value' => 'Away', 'odd' => '8.77']]]]];
$unk = []; $m = sb_live_markets($r, [], [1, 0], $unk);
$row = $m['1x2'] ?? null; $inv = 0.0; foreach ((array) $row as $o) $inv += 1 / $o[1];
$marge = $row ? (1 - 1 / $inv) : 0;
$check('direct 1x2 : marge réelle ≈ 4 % (3,7 à 4,4 %)', $row && $marge > 0.037 && $marge < 0.044, json_encode($row) . ' marge=' . round($marge * 100, 2) . ' %');
// répartition égale : chaque cote = (1 − 4 %) / p juste
$fair = [1 / 1.408, 1 / 4.09, 1 / 8.77]; $s = array_sum($fair);
$ex = array_map(fn($p) => floor((1 - 0.04) / ($p / $s) * 100 + 1e-6) / 100, $fair);
$check('direct 1x2 : répartie également sur les 3 choix', $row && abs($row[0][1] - $ex[0]) < 0.011 && abs($row[1][1] - $ex[1]) < 0.011 && abs($row[2][1] - $ex[2]) < 0.011, json_encode([$row, $ex]));
echo "\nRésultat : $ok OK, $ko échec(s)\n";
exit($ko ? 1 : 0);
