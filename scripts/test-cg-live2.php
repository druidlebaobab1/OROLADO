<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2830 — groupe « live2 » : 4 nouveaux jeux EN DIRECT (casino_lib.php CASINO_LIVE2, moteur casino_draw_*) :
 * Miss Catwalk, Star Fleets, Gem Count, Lucky Claw. Retour EXACT ≤ 94 % pour chaque choix, fréquences des tirages,
 * vrais paris (argent retiré une fois, versé une fois), paris en retard / en double refusés, ancien tour sûr.
 * Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_live2_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'casino_ext.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = []; $credits = 0;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$credits) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') {
    if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient'];
    $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bal[$u]];
  }
  if ($fn === 'resolve_trade') {
    $k = $u . '|' . $a['p_order'];
    if (!isset($keys[$k])) { $keys[$k] = 1; $credits++; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); }
    return ['ok' => true, 'real' => $bal[$u]];
  }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
mkdir($tmp . '/casino_ext');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$G = ['catwalk' => [200, 120], 'fleets' => [180, 120], 'gemcount' => [170, 120], 'claw' => [165, 120]];
echo "1) Déclaration : 4 jeux en direct, clés libres, anciens jeux inchangés\n";
check('CASINO_LIVE2 = 4 jeux (P, B)', CASINO_LIVE2 === $G, json_encode(CASINO_LIVE2));
check('CASINO_DRAW (5 anciens jeux) inchangé', CASINO_DRAW === ['cryptox' => [180, 120], 'horses' => [210, 120], 'roulette' => [160, 120], 'race' => [210, 120], 'planets' => [160, 120]]);
foreach ($G as $g => $pb) check("$g : jeu à tirage, plusieurs étapes, pas une fiche ext", casino_is_draw($g) && in_array($g, CASINO_GAMES, true) && in_array($g, CASINO_MULTI, true) && casino_ext_type($g) === '' && casino_draw_pb($g) === $pb);
check('anciens jeux : mêmes durées via casino_draw_pb', casino_draw_pb('planets') === [160, 120] && casino_draw_pb('horses') === [210, 120]);

echo "2) Retour EXACT de chaque choix (chance × cote ≤ 94 %, ≥ 93,5 %)\n";
$okR = true; $txt = [];
foreach (['fleets', 'gemcount', 'claw'] as $g) {
  foreach (casino_live2_probs($g) as $sel => $p) { $o = casino_live2_odds($g)[$sel]; $rtp = $p * $o; if ($rtp > 0.94 + 1e-9 || $rtp < 0.935) $okR = false; $txt[] = "$g:$sel ×$o " . round($rtp * 100, 2) . '%'; }
  check("$g : somme des chances des choix exclusifs = 1", abs(array_sum(array_intersect_key(casino_live2_probs($g), array_flip($g === 'fleets' ? ['s0', 's1', 's2', 's3', 's4', 's5'] : ($g === 'gemcount' ? ['1', '2', '3', '4'] : ['0', '1', '2', '3', '4', '5'])))) - 1) < 1e-12);
}
foreach (CASINO_CATWALK_W as $w) { $o = casino_live2_odd($w / 100); $rtp = $w / 100 * $o; if ($rtp > 0.94 + 1e-9 || $rtp < 0.935) $okR = false; $txt[] = "catwalk:$w% ×$o " . round($rtp * 100, 2) . '%'; }
check('chaque choix des 4 jeux : retour ≤ 94 % exact', $okR);
echo '       ' . implode(' · ', $txt) . "\n";
check('cotes Star Fleets ×1,88 / ×3,00 / ×6,01 / ×30,08', casino_live2_odds('fleets') === ['g' => 1.88, 'v' => 1.88, 's0' => 30.08, 's1' => 6.01, 's2' => 3.0, 's3' => 3.0, 's4' => 6.01, 's5' => 30.08], json_encode(casino_live2_odds('fleets')));
check('cotes Gem Count ×3,76 / ×1,88', casino_live2_odds('gemcount') === ['1' => 3.76, '2' => 3.76, '3' => 3.76, '4' => 3.76, 'odd' => 1.88, 'even' => 1.88]);
check('cotes Lucky Claw ×3,13 ×3,91 ×5,22 ×7,23 ×10,44 ×15,66', array_values(casino_live2_odds('claw')) === [3.13, 3.91, 5.22, 7.23, 10.44, 15.66], json_encode(casino_live2_odds('claw')));
check('cotes Catwalk par rang ×3,13 ×4,27 ×5,52 ×7,23 ×9,40 ×11,75', array_map(static fn($w) => casino_live2_odd($w / 100), CASINO_CATWALK_W) === [3.13, 4.27, 5.52, 7.23, 9.4, 11.75]);

echo "3) Fréquences des tirages (simulation) et cohérence de ce que le client dessine\n";
$M = 120000;
// catwalk : la gagnante suit SA chance du tour ; notes : la gagnante a le meilleur total, strictement ; ordre de passage = permutation
$byRank = array_fill(0, 6, 0); $okC = true; $ev = 0.0;
for ($k = 0; $k < $M; $k++) {
  $o = casino_live2_draw('catwalk'); $w = $o['w'];
  $sw = $w; sort($sw); if ($sw !== [8, 10, 13, 17, 22, 30]) $okC = false;
  $r = array_search($w[$o['n']], CASINO_CATWALK_W, true); $byRank[$r]++;
  $tot = array_map('array_sum', $o['s']); $mx = max($tot);
  if ($tot[$o['n']] !== $mx || count(array_keys($tot, $mx, true)) !== 1) $okC = false;
  foreach ($o['s'] as $sc) foreach ($sc as $v) if ($v < 72 || $v > 100) $okC = false;
  $q = $o['q']; sort($q); if ($q !== [0, 1, 2, 3, 4, 5]) $okC = false;
  $ev += (float) casino_draw_mult('catwalk', '0', $o); // un joueur qui mise toujours sur le mannequin 0
}
check('catwalk : chances redistribuées, gagnante = meilleur total unique, notes 7,2–10,0, ordre = permutation', $okC);
$okF = true; foreach (CASINO_CATWALK_W as $r => $w) if (abs($byRank[$r] / $M - $w / 100) > 0.006) $okF = false;
check('catwalk : la gagnante suit les chances (30/22/17/13/10/8 %)', $okF, json_encode($byRank));
check(sprintf('catwalk : retour simulé (toujours le mannequin 0) %.2f %%', $ev / $M * 100), abs($ev / $M - 0.94) < 0.03);
$cnt = array_fill(0, 6, 0); $okH = true;
for ($k = 0; $k < $M; $k++) { $o = casino_live2_draw('fleets'); $cnt[$o['n']]++; if (count($o['h']) !== 5 || array_sum($o['h']) !== $o['n']) $okH = false; }
$okF = $okH; foreach ([1, 5, 10, 10, 5, 1] as $k => $c) if (abs($cnt[$k] / $M - $c / 32) > 0.005) $okF = false;
check('fleets : 5 salves, score = salves gagnées par l\'Or, loi binomiale', $okF, json_encode($cnt));
$cnt = array_fill(1, 4, 0); $okH = true; $ks = [];
for ($k = 0; $k < $M; $k++) { $o = casino_live2_draw('gemcount'); $cnt[$o['n']]++; $ks[$o['k']] = 1; if ($o['k'] < 32 || $o['k'] > 63 || ($o['k'] - 1) % 4 + 1 !== $o['n']) $okH = false; }
$okF = $okH && count($ks) === 32; foreach ($cnt as $c) if (abs($c / $M - 0.25) > 0.006) $okF = false;
check('gemcount : tas de 32 à 63, reste (compté 4 par 4) = 1..4 équiprobable', $okF, json_encode($cnt));
$cnt = array_fill(0, 6, 0); $okH = true;
for ($k = 0; $k < $M; $k++) { $o = casino_live2_draw('claw'); $cnt[$o['n']]++; if ($o['d'] === $o['n'] || $o['d'] < 0 || $o['d'] > 5) $okH = false; }
$okF = $okH; foreach (CASINO_CLAW_W as $i => $w) if (abs($cnt[$i] / $M - $w / 100) > 0.006) $okF = false;
check('claw : lot attrapé selon les chances, 1er essai sur un AUTRE lot', $okF, json_encode($cnt));
// gain = cote seulement si le résultat montré correspond
check('fleets : 3–2 → Or gagne + score s3 ; Violette perd', casino_draw_mult('fleets', 'g', ['n' => 3, 'h' => [1, 1, 0, 0, 1]]) === 1.88 && casino_draw_mult('fleets', 's3', ['n' => 3]) === 3.0 && casino_draw_mult('fleets', 'v', ['n' => 3]) === 0.0 && casino_draw_mult('fleets', 's2', ['n' => 3]) === 0.0);
check('gemcount : reste 3 → « 3 » et « impair » gagnent, « pair » perd', casino_draw_mult('gemcount', '3', ['n' => 3, 'k' => 47]) === 3.76 && casino_draw_mult('gemcount', 'odd', ['n' => 3]) === 1.88 && casino_draw_mult('gemcount', 'even', ['n' => 3]) === 0.0);
$inv = ['catwalk' => ['6', 'x', '', 'g'], 'fleets' => ['s6', '1', 'gv', ''], 'gemcount' => ['0', '5', 'big', ''], 'claw' => ['6', '-1', 'odd', '']];
$okI = true; foreach ($inv as $g => $l) foreach ($l as $s) if (casino_draw_mult($g, $s, []) !== null) $okI = false;
check('sélections invalides refusées', $okI);

echo "4) Vrais paris : retirés une fois, réglés sur le tirage commun, versés une fois ; retard / double refusés\n";
$U = 'aaaaaaaa-1111-2222-3333-888888888888';
$db = blank_db();
$db['users']['u_l'] = ['id' => 'u_l', 'email' => 'l@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_l'] = ['demo' => 500, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$U] = 500.0; $me = $db['users']['u_l'];
$file = casino_user_file('u_l');
$sels = ['catwalk' => ['0', '5'], 'fleets' => ['g', 's1'], 'gemcount' => ['2', 'odd'], 'claw' => ['0', '5']];
foreach ($sels as $g => $list) {
  [$P, $B] = CASINO_LIVE2[$g];
  foreach ($list as $n => $sel) {
    $i0 = casino_draw_i($g, time()) + 40 + $n * 3; $t = casino_draw_start($g, $i0) + 2.0;
    casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
    $b0 = $bal[$U]; $c0 = $credits;
    $pub = casino_draw_public($g, $t);
    check("$g/$sel : pendant les mises : résultat CACHÉ, cotes visibles", $pub['phase'] === 'bet' && !isset($pub['res']) && isset($pub['odds'][$sel]) && $pub['end'] - $pub['t0'] == $P && $pub['close'] - $pub['t0'] == $B);
    $r = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => 'zz'], $t);
    check("$g/$sel : sélection invalide refusée, rien retiré", $r['ok'] === false && $bal[$U] == $b0);
    $r = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => $sel], $t);
    check("$g/$sel : pari accepté, 2 $ retirés", $r['ok'] && abs($bal[$U] - ($b0 - 2)) < 0.001 && empty($r['done']), json_encode($r));
    $r2 = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => $sel], $t + 1);
    check("$g/$sel : 2e pari sur le même tour refusé", $r2['ok'] === false && ($r2['reason'] ?? '') === 'already' && abs($bal[$U] - ($b0 - 2)) < 0.001);
    $dr0 = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], casino_draw_start($g, $i0) + $B - 1);
    check("$g/$sel : avant la fermeture : pas réglé, pas de résultat", empty($dr0['done']) && !isset($dr0['round']['res']));
    $tShow = casino_draw_start($g, $i0) + $B + 0.5;
    $dr = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $tShow);
    $out = casino_draw_outcome($g, $i0);
    $want = casino_win(2, (float) casino_draw_mult($g, $sel, $out));
    check("$g/$sel : réglé selon le tirage commun (n={$out['n']}, gain $want $)", !empty($dr['done']) && abs($dr['win'] - $want) < 0.001 && abs($bal[$U] - ($b0 - 2 + $want)) < 0.001, json_encode([$dr['win'] ?? null, $bal[$U] - $b0]));
    casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $tShow + 2);
    casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $tShow + 30);
    check("$g/$sel : versé UNE seule fois", abs($bal[$U] - ($b0 - 2 + $want)) < 0.001 && $credits === $c0 + 1);
    check("$g/$sel : résultat public = le même pour tous", (casino_draw_public($g, $tShow)['res'] ?? null) == $out);
    $late = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => $sel], casino_draw_start($g, $i0) + $B - 0.3);
    check("$g/$sel : pari 0,3 s avant la fermeture refusé", $late['ok'] === false && ($late['reason'] ?? '') === 'closed');
  }
  // un gain forcé : on cherche un tour futur où le 1er choix gagne
  $sel = $list[0];
  for ($i0 = casino_draw_i($g, time()) + 300; (float) casino_draw_mult($g, $sel, casino_draw_outcome($g, $i0)) <= 0; $i0++);
  $odd = (float) casino_draw_mult($g, $sel, casino_draw_outcome($g, $i0));
  casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
  $b0 = $bal[$U];
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 0.15, ['sel' => $sel], casino_draw_start($g, $i0) + 1);
  $dr = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], casino_draw_start($g, $i0) + $B + 1);
  $want = floor(0.15 * $odd * 100 + 1e-6) / 100;
  check(sprintf('%s : gain 0,15 $ × %.2f = %.2f $ (arrondi vers le bas)', $g, $odd, $want), abs($dr['win'] - $want) < 1e-9 && abs($bal[$U] - ($b0 - 0.15 + $want)) < 0.001, json_encode([$dr['win'] ?? null]));
}

echo "5) Ancien tour : un pari dont le tour a quitté l'historique se règle avec SON résultat, une fois ; rien n'est re-tiré\n";
foreach (array_keys($G) as $g) {
  [$P, $B] = CASINO_LIVE2[$g];
  $i0 = casino_draw_i($g, time()) + 2000; $t = casino_draw_start($g, $i0) + 3;
  casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
  $b0 = $bal[$U];
  $r = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 1, ['sel' => $sels[$g][0]], $t);
  $kept = casino_draw_outcome($g, $i0);
  for ($k = 1; $k <= 65; $k++) casino_draw_outcome($g, $i0 + $k);
  $gone = casino_draw_outcome($g, $i0) === [];
  $later = casino_draw_start($g, $i0 + 65) + 1;
  $dr = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $later);
  $want = casino_win(1, (float) casino_draw_mult($g, $sels[$g][0], $kept));
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $later + 5);
  check("$g : tour sorti de l'historique, pas re-tiré ; pari réglé avec son résultat ($want $), une fois", $r['ok'] && $gone && !empty($dr['done']) && empty($dr['void']) && abs($bal[$U] - ($b0 - 1 + $want)) < 0.001);
  $nb = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 1, ['sel' => $sels[$g][1]], casino_draw_start($g, $i0 + 66) + 2);
  check("$g : nouveau pari ensuite accepté", $nb['ok'] === true);
}

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
