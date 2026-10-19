<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2807 — groupe « more3 » : Star Bowling (fiche 'table', liste « Tous les jeux ») et Lucky Planets (nouveau jeu EN DIRECT,
 * casino_draw_* de casino_lib.php). Retour ≤ 94 % (somme exacte ET simulation), argent retiré une fois / versé une fois.
 * Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_more3_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'casino_ext.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = []; $down = false;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$down) {
  if ($down) return null;
  $u = $a['p_user'];
  if ($fn === 'debit_real') {
    if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient'];
    $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bal[$u]];
  }
  if ($fn === 'resolve_trade') {
    $k = $u . '|' . $a['p_order'];
    if (!isset($keys[$k])) { $keys[$k] = 1; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); }
    return ['ok' => true, 'real' => $bal[$u]];
  }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
mkdir($tmp . '/casino_ext');
copy(__DIR__ . '/../casino_ext/more3.php', $tmp . '/casino_ext/more3.php');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }


$fiches = include __DIR__ . '/../casino_ext/more3.php';
echo "1) Star Bowling : la fiche se charge (clé libre)\n";
check('fiche bowling chargée (table)', casino_ext_type('bowling') === 'table' && !in_array('bowling', CASINO_GAMES, true));
check('nom affiché « Star Bowling »', (casino_ext_names()['bowling'] ?? '') === 'Star Bowling');
$d = $fiches['bowling'];
check('12 lignes : 0…10 quilles + strike doré', count($d['out']) === 12);
check('gains du dessin : 6 ×0,3 · 7 ×0,8 · 8 ×1,2 · 9 ×1,8 · strike ×3,25 · doré ×15', array_column($d['out'], 0) === [0, 0, 0, 0, 0, 0, 0.3, 0.8, 1.2, 1.8, 3.25, 15]);
$w = 0.0; $ev = 0.0; foreach ($d['out'] as $o) { $w += $o[1]; $ev += $o[0] * $o[1]; }
check(sprintf('retour exact %.3f %% (entre 93,5 et 94)', $ev / $w * 100), $ev / $w >= 0.935 && $ev / $w <= 0.94);
$N = 400000; $s = 0.0; $bad = 0;
for ($i = 0; $i < $N; $i++) { $r = casino_ext_instant('bowling', []); $s += $r['mult']; if ((float) $d['out'][$r['view']['i']][0] !== (float) $r['mult']) $bad++; }
check(sprintf('retour simulé %.2f %% · dessin = gain', $s / $N * 100), abs($s / $N - $ev / $w) < 0.012 && $bad === 0, "bad=$bad");

echo "2) Lucky Planets : 6 planètes, cote = 0,94 ÷ chance → marge 6 % pour CHAQUE choix\n";
check('jeu en direct déclaré (tirage commun, v2811 : P 160 s, mises 120 s)', in_array('planets', CASINO_GAMES, true) && in_array('planets', CASINO_MULTI, true) && (CASINO_DRAW['planets'] ?? null) === [160, 120]);
check('chances : total 100', array_sum(CASINO_PLANETS_W) === 100 && count(CASINO_PLANETS_W) === 6);
$od = casino_planets_odds();
check('cotes affichées ×2,93 ×3,91 ×5,22 ×7,23 ×10,44 ×23,50', $od === [2.93, 3.91, 5.22, 7.23, 10.44, 23.5], json_encode($od));
foreach (CASINO_PLANETS_W as $i => $wt) check(sprintf('planète %d : retour %.2f %%', $i, $wt * $od[$i]), $wt * $od[$i] <= 94.0 + 1e-9 && $wt * $od[$i] >= 93.5);
$cnt = array_fill(0, 6, 0); $M = 200000; for ($k = 0; $k < $M; $k++) $cnt[casino_planets_draw()]++;
$okd = true; foreach (CASINO_PLANETS_W as $i => $wt) if (abs($cnt[$i] / $M - $wt / 100) > 0.004) $okd = false;
check('tirage selon les chances (200 000 tirages)', $okd, json_encode($cnt));
$ev = 0.0; foreach ($cnt as $i => $c) $ev += $c / $M * $od[$i]; // retour simulé d'un joueur qui mise toujours sur la même planète
check('sélections invalides refusées', casino_draw_mult('planets', '6', []) === null && casino_draw_mult('planets', 'x', []) === null && casino_draw_mult('planets', '3', []) === 0.0);

echo "3) Lucky Planets : un vrai pari (argent retiré une fois, réglé selon le tirage commun, versé une fois)\n";
$U = 'aaaaaaaa-1111-2222-3333-777777777777';
$db = blank_db();
$db['users']['u_p'] = ['id' => 'u_p', 'email' => 'p@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_p'] = ['demo' => 500, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$U] = 50.0; $me = $db['users']['u_p'];
$file = casino_user_file('u_p');
[$P, $B] = CASINO_DRAW['planets'];
foreach (['0', '5'] as $n => $sel) {
  $i0 = casino_draw_i('planets', time()) + 50 + $n * 3; $t = casino_draw_start('planets', $i0) + 2.0;
  casino_with($file, static function (array &$st) { unset($st['g']['planets']); return true; });
  $b0 = $bal[$U];
  $pub = casino_draw_public('planets', $t);
  check("sel $sel : pendant les mises, résultat CACHÉ, cotes visibles", $pub['phase'] === 'bet' && !isset($pub['res']) && ($pub['odds'] ?? null) === $od);
  $r = casino_draw_act(load_db(), $me, 'u_p', $file, 'planets', 'bet', 'real', 2, ['sel' => '9'], $t);
  check("sel $sel : sélection invalide refusée, rien de retiré", $r['ok'] === false && $bal[$U] == $b0);
  $r = casino_draw_act(load_db(), $me, 'u_p', $file, 'planets', 'bet', 'real', 2, ['sel' => $sel], $t);
  check("sel $sel : pari accepté, 2 $ retirés", $r['ok'] && abs($bal[$U] - ($b0 - 2)) < 0.001, json_encode($r));
  $r2 = casino_draw_act(load_db(), $me, 'u_p', $file, 'planets', 'bet', 'real', 2, ['sel' => $sel], $t + 1);
  check("sel $sel : 2e pari sur le même tour refusé", $r2['ok'] === false && abs($bal[$U] - ($b0 - 2)) < 0.001);
  $tShow = casino_draw_start('planets', $i0) + $B + 0.5;
  $dr = casino_draw_act(load_db(), $me, 'u_p', $file, 'planets', 'dround', 'real', 0, [], $tShow);
  $out = casino_draw_outcome('planets', $i0);
  $want = casino_money(2 * (float) casino_draw_mult('planets', $sel, $out));
  check("sel $sel : réglé selon le tirage commun (planète {$out['n']}, gain $want $)", !empty($dr['done']) && abs($dr['win'] - $want) < 0.001 && abs($bal[$U] - ($b0 - 2 + $want)) < 0.001, json_encode([$dr['win'] ?? null, $bal[$U]]));
  casino_draw_act(load_db(), $me, 'u_p', $file, 'planets', 'dround', 'real', 0, [], $tShow + 2);
  check("sel $sel : gain versé UNE seule fois", abs($bal[$U] - ($b0 - 2 + $want)) < 0.001);
  check("sel $sel : résultat public = le même pour tous", (casino_draw_public('planets', $tShow)['res']['n'] ?? null) === $out['n']);
  $late = casino_draw_act(load_db(), $me, 'u_p', $file, 'planets', 'bet', 'real', 2, ['sel' => $sel], casino_draw_start('planets', $i0) + $B - 0.3);
  check("sel $sel : pari après la fermeture refusé", $late['ok'] === false);
}
// un gain forcé : on cherche un tour futur dont le tirage est la planète 0
for ($i0 = casino_draw_i('planets', time()) + 200; casino_draw_outcome('planets', $i0)['n'] !== 0; $i0++);
casino_with($file, static function (array &$st) { unset($st['g']['planets']); return true; });
$b0 = $bal[$U];
casino_draw_act(load_db(), $me, 'u_p', $file, 'planets', 'bet', 'real', 1, ['sel' => '0'], casino_draw_start('planets', $i0) + 1);
$dr = casino_draw_act(load_db(), $me, 'u_p', $file, 'planets', 'dround', 'real', 0, [], casino_draw_start('planets', $i0) + $B + 1);
check('planète gagnante : 1 $ × 2,93 = 2,93 $ versés', abs($dr['win'] - 2.93) < 0.001 && abs($bal[$U] - ($b0 - 1 + 2.93)) < 0.001, json_encode([$dr['win'] ?? null, $bal[$U] - $b0]));

echo "4) Star Bowling : une vraie partie retire la mise une fois et verse le gain une fois\n";
$b0 = $bal[$U];
$r = casino_play(load_db(), $me, 'bowling', 'real', 1, []);
check('bowling : solde = avant − 1 + gain (×' . ($r['mult'] ?? '?') . ')', $r['ok'] === true && abs($bal[$U] - ($b0 - 1 + $r['win'])) < 0.001 && isset($r['view']['i']), json_encode([$b0, $bal[$U], $r['win'] ?? null]));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
