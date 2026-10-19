<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2690 — Casino (casino_lib.php) : chaque jeu rend MOINS que la mise sur la durée (maison gagnante), les dessins
 * correspondent toujours au gain, l'argent bouge une seule fois, on ne peut pas tricher (rejouer, voir la mine,
 * encaisser après l'explosion, partie gratuite). Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_casino_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
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
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

echo "1) Retour aux joueurs de chaque jeu (doit rester sous 100 %)\n";
$params = [
  'coin' => fn() => ['side' => random_int(0, 1)], 'dice' => fn() => ['chance' => random_int(2, 95), 'over' => random_int(0, 1)],
  'limbo' => fn() => ['target' => [1.5, 2, 3, 10, 50][random_int(0, 4)]], 'wheel' => fn() => [],
  'roulette' => fn() => ['bet' => ['red', 'black', 'even', 'odd', 'd2', 'n17', 'n0'][random_int(0, 6)]], 'slots' => fn() => [], 'plinko' => fn() => [],
  'keno' => fn() => ['picks' => [3, 9, 15]], 'scratch' => fn() => [], 'penalty' => fn() => ['aim' => random_int(0, 2)],
  'colors' => fn() => ['bet' => ['green', 'red', 'violet', 'n3'][random_int(0, 3)]],
  'dragon' => fn() => ['bet' => ['dragon', 'tiger', 'tie'][random_int(0, 2)]], 'baccarat' => fn() => ['bet' => ['player', 'banker', 'tie'][random_int(0, 2)]],
  'sicbo' => fn() => ['bet' => ['small', 'big'][random_int(0, 1)]], 'chests' => fn() => ['pick' => random_int(0, 2)],
  'darts' => fn() => [],
  'dice#duel' => fn() => ['duel' => ['red', 'black'][random_int(0, 1)]],
  'rps' => fn() => ['pick' => random_int(0, 2)],
  // v2791 : Oro Lotto — chaque nombre de numéros choisis (1 à 10) a son tableau, chacun doit rendre ≈ 94 %
  'lotto#1' => fn() => ['picks' => [7]], 'lotto#3' => fn() => ['picks' => [5, 17, 33]],
  'lotto#5' => fn() => ['picks' => [3, 11, 19, 27, 36]], 'lotto#7' => fn() => ['picks' => [1, 6, 12, 18, 25, 31, 40]],
  'lotto#10' => fn() => ['picks' => [2, 4, 8, 10, 15, 21, 26, 30, 35, 39]],
];
foreach ($params as $g => $pf) {
  $N = 300000; $sum = 0.0; $bad = 0;
  for ($i = 0; $i < $N; $i++) {
    $r = casino_instant(explode('#', $g)[0], $pf(), 1.0);
    $sum += $r['mult'];
    // le dessin doit correspondre au gain
    if ($g === 'slots') { $s = $r['view']['reels']; $same = $s[0] === $s[1] && $s[1] === $s[2]; $ch = count(array_filter($s, fn($x) => $x === 'cherry'));
      if (($r['mult'] > 0) !== ($same || $ch >= 2)) $bad++; }
    if ($g === 'scratch') { $c = array_count_values($r['view']['grid']); $three = max($c) >= 3; if (($r['mult'] > 0) !== $three || max($c) > 3 || count($r['view']['grid']) !== 9) $bad++; }
    if ($g === 'dice#duel' && ($r['view']['r'] === $r['view']['b'] ? $r['mult'] != 1.0 : (($r['view']['side'] === 'red') === ($r['view']['r'] > $r['view']['b'])) !== ($r['mult'] > 1))) $bad++;
    if ($g === 'rps' && ($r['view']['me'] === $r['view']['bot'] ? $r['mult'] != 1.0 : (((($r['view']['me'] - $r['view']['bot'] + 3) % 3) === 1) !== ($r['mult'] > 1)))) $bad++;
    if (strpos($g, 'lotto') === 0) { $pk = $pf()['picks']; $d = $r['view']['draw'];
      if (count($d) !== 10 || count(array_unique($d)) !== 10 || min($d) < 1 || max($d) > 40 || CASINO_LOTTO[count($pk)][count(array_intersect($pk, $d))] != $r['mult']) $bad++; }
    if ($g === 'darts' && CASINO_DARTS[$r['view']['z']][0] != $r['mult']) $bad++;
    if ($g === 'plinko' && CASINO_PLINKO[array_sum($r['view']['path'])] != $r['mult']) $bad++;
    if ($g === 'keno' && CASINO_KENO[count(array_intersect([3, 9, 15], $r['view']['draw']))] != $r['mult']) $bad++;
    if ($g === 'race' && (($r['view']['order'][0] === 0) !== ($r['mult'] > 0)) && false) $bad++;
  }
  $rtp = $sum / $N;
  check(sprintf('%-9s retour %.2f %%', $g, $rtp * 100), $rtp < 0.995 && $rtp > 0.85, $bad ? "$bad dessins faux" : '');
  if ($bad) check("$g : dessin = gain", false, (string) $bad);
}
// Avion : P(point ≥ x) ≈ 0,97 / x → n'importe quelle cible rend ≈ 97 %
foreach ([1.2, 2, 5, 20] as $x) {
  $N = 300000; $w = 0;
  for ($i = 0; $i < $N; $i++) if (casino_crash_point() > $x) $w++;
  check(sprintf('avion : encaisser à x%s rend %.1f %%', $x, $w / $N * $x * 100), $w / $N * $x < 0.995);
}
// Mines : n'importe quel nombre de cases ouvertes rend 97 %
foreach ([[3, 1], [3, 5], [5, 3], [10, 2]] as [$m, $k]) {
  $p = 1.0; for ($j = 0; $j < $k; $j++) $p *= (25 - $m - $j) / (25 - $j);
  $ev = $p * casino_mines_mult($m, $k);
  check(sprintf('mines %d, %d case(s) puis encaisser : retour %.1f %%', $m, $k, $ev * 100), $ev < 0.975 && $ev > 0.9);
}
foreach ([1, 7, 13] as $a) { $ev = ((14 - $a) / 13) * casino_hilo_mult($a, true); check("hi-lo carte $a « plus haut » : retour " . round($ev * 100, 1) . ' %', $ev <= 0.971); }

echo "1b) v2791 : Oro Lotto refuse les grilles fausses (0 numéro, 11 numéros, hors 1-40) ; chaque tableau rend 93,5 à 94,1 %\n";
check('lotto : 0 numéro refusé', isset(casino_instant('lotto', ['picks' => []], 1)['err']));
check('lotto : 11 numéros refusés', isset(casino_instant('lotto', ['picks' => range(1, 11)], 1)['err']));
check('lotto : numéros hors grille ignorés (0, 41)', isset(casino_instant('lotto', ['picks' => [0, 41]], 1)['err']));
check('lotto : doublons comptés une fois', casino_instant('lotto', ['picks' => [5, 5, 5]], 1)['view']['k'] === 1);
$cmb = static function (int $n, int $k): float { if ($k < 0 || $k > $n) return 0.0; $r = 1.0; for ($i = 1; $i <= $k; $i++) $r = $r * ($n - $k + $i) / $i; return $r; };
foreach (CASINO_LOTTO as $k => $row) {
  $ev = 0.0; foreach ($row as $h => $m) $ev += $cmb($k, $h) * $cmb(40 - $k, 10 - $h) / $cmb(40, 10) * $m;
  check(sprintf('lotto %2d numéro(s) : retour exact %.2f %%', $k, $ev * 100), $ev > 0.935 && $ev < 0.941);
}
echo "2) Argent réel : mise retirée une fois, gain versé une fois\n";
$U = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_cs'] = ['id' => 'u_cs', 'email' => 'cs@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_cs'] = ['demo' => 500, 'real' => 20];
save_db(orolado_data_file(), $db);
$bal[$U] = 20.0;
$me = load_db()['users']['u_cs'];
$r = casino_play(load_db(), $me, 'coin', 'real', 0.05, ['side' => 0]);
check('mise de 0,05 $ refusée (minimum 0,10 $)', $r['ok'] === false && $r['reason'] === 'min');
$r = casino_play(load_db(), $me, 'coin', 'real', 50, ['side' => 0]);
check('mise plus grande que le solde : refusée, rien ne bouge', $r['ok'] === false && $bal[$U] == 20.0, json_encode($r));
$before = $bal[$U]; $tot = 0.0;
for ($i = 0; $i < 200; $i++) { $r = casino_play(load_db(), load_db()['users']['u_cs'], 'coin', 'real', 0.10, ['side' => $i % 2]); if (!$r['ok']) break; $tot += $r['win'] - 0.10; }
check('200 parties à 0,10 $ : le solde suit exactement mises et gains', abs(($before + $tot) - $bal[$U]) < 0.001, $before . ' + ' . round($tot, 2) . ' = ' . $bal[$U]);
$dbx = load_db();
check('les mises réelles comptent pour « miser ×2 » (20 $ misés)', abs((float) $dbx['users']['u_cs']['realStakeVolume'] - 20) < 0.001 && abs((float) $dbx['users']['u_cs']['wagerNeed'] - 20) < 0.001, $dbx['users']['u_cs']['realStakeVolume'] . ' / need ' . $dbx['users']['u_cs']['wagerNeed']);
$r = casino_play(load_db(), $me, 'limbo', 'real', 20, ['target' => 1000]);
check('limbo : gain possible au-delà du maximum caché → refusé', $r['ok'] === false && $r['reason'] === 'maxWin');
$r = casino_play(load_db(), null, 'dice', 'real', 5, ['chance' => 50]);
check('visiteur : refusé (inscription obligatoire)', $r['ok'] === false && $r['reason'] === 'login');
$d0 = load_db()['vault']['u_cs']['demo']; $b0 = $bal[$U];
$r = casino_play(load_db(), $me, 'wheel', 'demo', 1, []);
check('« démo » demandée : jouée en RÉEL, le solde démo ne bouge pas', $r['mode'] === 'real' && load_db()['vault']['u_cs']['demo'] == $d0 && abs($bal[$U] - ($b0 - 1 + $r['win'])) < 0.001);

echo "3) Avion (plusieurs étapes)\n";
$bal[$U] = 100.0; syncv();
$s = casino_multi(load_db(), $me, 'crash', 'start', 'real', 10, []);
check('départ : mise retirée, point d\'explosion CACHÉ', $s['ok'] && !isset($s['c']) && $bal[$U] == 90.0, json_encode(array_keys($s)));
casino_with(casino_user_file('u_cs'), function (array &$st) { $st['g']['crash']['c'] = 5.0; return true; }); // vol sûr pour la suite du test (3 % des vols explosent à ×1,00)
$s2 = casino_multi(load_db(), $me, 'crash', 'start', 'real', 10, []);
check('2e départ pendant le vol : refusé (on reprend le même vol)', !empty($s2['resume']) && $bal[$U] == 90.0);
$c = casino_multi(load_db(), $me, 'crash', 'cash', 'real', 0, []);
check('encaisser tout de suite : environ ×1,00 (le serveur compte le temps écoulé)', $c['ok'] && $c['done'] && $c['win'] >= 10.0 && $c['win'] < 10.6, json_encode([$c['win'], $c['c']]));
$c2 = casino_multi(load_db(), $me, 'crash', 'cash', 'real', 0, []);
check('encaisser une 2e fois : rien de plus', abs($bal[$U] - (90 + $c['win'])) < 0.001);
// encaissement après l'explosion : on simule un vol commencé il y a longtemps
casino_multi(load_db(), $me, 'crash', 'start', 'real', 1, []);
casino_with(casino_user_file('u_cs'), function (array &$st) { $st['g']['crash']['t0'] -= 600; $st['g']['crash']['c'] = 3.0; return true; });
$b0 = $bal[$U];
$c = casino_multi(load_db(), $me, 'crash', 'cash', 'real', 0, []);
check('encaisser APRÈS l\'explosion : perdu (le serveur compte le temps)', $c['done'] && $c['win'] == 0.0 && $bal[$U] == $b0);

echo "4) Mines\n";
$s = casino_multi(load_db(), $me, 'mines', 'start', 'real', 1, ['mines' => 3]);
check('départ : les mines sont CACHÉES', $s['ok'] && !isset($s['mines']));
$mines = casino_with(casino_user_file('u_cs'), fn(array &$st) => $st['g']['mines']['mines']);
$safe = array_values(array_diff(range(0, 24), $mines));
$o = casino_multi(load_db(), $me, 'mines', 'open', 'real', 0, ['cell' => $safe[0]]);
$o = casino_multi(load_db(), $me, 'mines', 'open', 'real', 0, ['cell' => $safe[0]]);
check('ouvrir 2 fois la même case ne compte qu\'une fois', count($o['open']) === 1);
$o = casino_multi(load_db(), $me, 'mines', 'open', 'real', 0, ['cell' => $safe[1]]);
$b0 = $bal[$U];
$c = casino_multi(load_db(), $me, 'mines', 'cash', 'real', 0, []);
check('encaisser après 2 cases : gain = mise × multiplicateur', abs($c['win'] - casino_mines_mult(3, 2)) < 0.001 && abs($bal[$U] - ($b0 + $c['win'])) < 0.001, (string) $c['win']);
casino_multi(load_db(), $me, 'mines', 'start', 'real', 1, ['mines' => 3]);
$mines = casino_with(casino_user_file('u_cs'), fn(array &$st) => $st['g']['mines']['mines']);
$b0 = $bal[$U];
$o = casino_multi(load_db(), $me, 'mines', 'open', 'real', 0, ['cell' => $mines[0]]);
check('tomber sur une mine : perdu, mines montrées à la fin', $o['done'] && $o['win'] == 0.0 && isset($o['mines']) && $bal[$U] == $b0);
$c = casino_multi(load_db(), $me, 'mines', 'cash', 'real', 0, []);
check('encaisser après la mine : rien', $bal[$U] == $b0);

echo "5) Hi-Lo\n";
$s = casino_multi(load_db(), $me, 'hilo', 'start', 'real', 1, []);
check('départ : une carte montrée', $s['ok'] && $s['card'] >= 1 && $s['card'] <= 13);
$c = casino_multi(load_db(), $me, 'hilo', 'cash', 'real', 0, []);
check('encaisser sans avoir joué : refusé', $c['ok'] === false);

echo "5b) v2691 : Jet, Fusée (même calcul que l'avion) et Pomme de la fortune\n";
foreach ([1, 3, 6, 10] as $k) { $ev = pow(0.8, $k) * casino_apple_mult($k); check("pomme : $k étage(s) puis encaisser : retour " . round($ev * 100, 1) . ' %', $ev <= 0.9405 && $ev > 0.92); }
foreach (['jet', 'rocket'] as $cg) {
  $bal[$U] = 50.0; syncv();
  $s = casino_multi(load_db(), $me, $cg, 'start', 'real', 2, []);
  check("$cg : départ, point d'explosion caché, mise retirée", $s['ok'] && !isset($s['c']) && $bal[$U] == 48.0);
  casino_with(casino_user_file('u_cs'), function (array &$st) use ($cg) { $st['g'][$cg]['t0'] -= 600; $st['g'][$cg]['c'] = 2.0; return true; });
  $c = casino_multi(load_db(), $me, $cg, 'cash', 'real', 0, []);
  check("$cg : encaisser après l'explosion = perdu", $c['done'] && $c['win'] == 0.0 && $bal[$U] == 48.0);
}
$bal[$U] = 50.0; syncv();
$s = casino_multi(load_db(), $me, 'apple', 'start', 'real', 1, []);
check('pomme : départ, pommes pourries CACHÉES', $s['ok'] && !isset($s['bad']) && $s['k'] === 0);
$bad = casino_with(casino_user_file('u_cs'), fn(array &$st) => $st['g']['apple']['bad']);
$o = casino_multi(load_db(), $me, 'apple', 'pick', 'real', 0, ['cell' => array_values(array_diff([0, 1, 2, 3, 4], (array) $bad[0]))[0]]);
$o = casino_multi(load_db(), $me, 'apple', 'pick', 'real', 0, ['cell' => array_values(array_diff([0, 1, 2, 3, 4], (array) $bad[1]))[0]]);
check('pomme : 2 bons étages', $o['k'] === 2);
$b0 = $bal[$U];
$c = casino_multi(load_db(), $me, 'apple', 'cash', 'real', 0, []);
check('pomme : encaisser après 2 étages = mise × ' . casino_apple_mult(2), abs($c['win'] - casino_apple_mult(2)) < 0.001 && abs($bal[$U] - ($b0 + $c['win'])) < 0.001);
casino_multi(load_db(), $me, 'apple', 'start', 'real', 1, []);
$bad = casino_with(casino_user_file('u_cs'), fn(array &$st) => $st['g']['apple']['bad']);
$b0 = $bal[$U];
$o = casino_multi(load_db(), $me, 'apple', 'pick', 'real', 0, ['cell' => ((array) $bad[0])[0]]);
check('pomme pourrie : perdu, rien de payé', $o['done'] && $o['win'] == 0.0 && $bal[$U] == $b0 && isset($o['bad']));
$s0 = 0.0; $N = 200000;
for ($i = 0; $i < $N; $i++) { $r = casino_instant('wheel', [], 1.0); $s0 += $r['mult']; }
check('roue casino (nouvelle) : retour ' . round($s0 / $N * 100, 2) . ' %', $s0 / $N < 0.975 && $s0 / $N > 0.92);

echo "5c) v2693 : La Tour, Ballon, Verger (niveaux)
";
foreach ([1, 4, 8] as $k) { $ev = pow(2 / 3, $k) * casino_tower_mult($k); check("tour : $k étage(s) : retour " . round($ev * 100, 1) . ' %', $ev <= 0.9405 && $ev > 0.92); }
foreach ([1, 5, 15] as $k) { $ev = pow(0.9, $k) * casino_balloon_mult($k); check("ballon : $k souffle(s) : retour " . round($ev * 100, 1) . ' %', $ev <= 0.9405 && $ev > 0.92); }
foreach ([1, 2, 3, 4] as $lv) { $k = 3; $ev = pow((5 - $lv) / 5, $k) * casino_apple_mult($k, $lv); check("verger niveau $lv, 3 étages : retour " . round($ev * 100, 1) . ' %', $ev <= 0.9405 && $ev > 0.92); }
$bal[$U] = 50.0; syncv();
$s = casino_multi(load_db(), $me, 'tower', 'start', 'real', 1, []);
$traps = casino_with(casino_user_file('u_cs'), fn(array &$st) => $st['g']['tower']['traps']);
check('tour : pièges cachés', $s['ok'] && !isset($s['traps']));
$o = casino_multi(load_db(), $me, 'tower', 'pick', 'real', 0, ['door' => ($traps[0] + 1) % 3]);
$b0 = $bal[$U]; $c = casino_multi(load_db(), $me, 'tower', 'cash', 'real', 0, []);
check('tour : 1 étage puis encaisser', abs($c['win'] - casino_tower_mult(1)) < 0.001 && abs($bal[$U] - ($b0 + $c['win'])) < 0.001);
$s = casino_multi(load_db(), $me, 'balloon', 'start', 'real', 1, []);
check('ballon : point d\'éclatement caché', $s['ok'] && !isset($s['pop']));
casino_with(casino_user_file('u_cs'), function (array &$st) { $st['g']['balloon']['pop'] = 2; return true; });
casino_multi(load_db(), $me, 'balloon', 'pump', 'real', 0, []); casino_multi(load_db(), $me, 'balloon', 'pump', 'real', 0, []);
$b0 = $bal[$U]; $o = casino_multi(load_db(), $me, 'balloon', 'pump', 'real', 0, []);
check('ballon : 3e souffle éclate (point 2) → perdu', $o['done'] && $o['win'] == 0.0 && $bal[$U] == $b0);
$s = casino_multi(load_db(), $me, 'apple', 'start', 'real', 1, ['level' => 4]);
$bad = casino_with(casino_user_file('u_cs'), fn(array &$st) => $st['g']['apple']['bad']);
check('verger niveau 4 : 4 pommes pourries par étage', count($bad[0]) === 4 && $s['lv'] === 4);
$good = array_values(array_diff([0, 1, 2, 3, 4], $bad[0]))[0];
$o = casino_multi(load_db(), $me, 'apple', 'pick', 'real', 0, ['cell' => $good]);
check('verger niveau 4 : 1 étage = ×' . casino_apple_mult(1, 4), $o['k'] === 1 && abs($o['mult'] - casino_apple_mult(1, 4)) < 0.001);
casino_multi(load_db(), $me, 'apple', 'cash', 'real', 0, []);

echo "6) Panne de la base pendant le gain : versé plus tard, une seule fois\n";
$bal[$U] = 50.0; syncv();
casino_multi(load_db(), $me, 'mines', 'start', 'real', 2, ['mines' => 3]);
$mines = casino_with(casino_user_file('u_cs'), fn(array &$st) => $st['g']['mines']['mines']);
$safe = array_values(array_diff(range(0, 24), $mines));
casino_multi(load_db(), $me, 'mines', 'open', 'real', 0, ['cell' => $safe[0]]);
$GLOBALS['OROLADO_FAKE_RPC_BK'] = $GLOBALS['OROLADO_FAKE_RPC'];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) { return $fn === 'resolve_trade' ? null : ($GLOBALS['OROLADO_FAKE_RPC_BK'])($fn, $a); };
$c = casino_multi(load_db(), $me, 'mines', 'cash', 'real', 0, []);
check('base en panne : gain pas encore versé', $bal[$U] == 48.0, (string) $bal[$U]);
$GLOBALS['OROLADO_FAKE_RPC'] = $GLOBALS['OROLADO_FAKE_RPC_BK'];
casino_multi(load_db(), $me, 'mines', 'state', 'real', 0, []);
casino_multi(load_db(), $me, 'mines', 'state', 'real', 0, []);
check('base revenue : gain versé une seule fois', abs($bal[$U] - (48 + $c['win'])) < 0.001, $bal[$U] . ' vs ' . (48 + $c['win']));

echo "8) Mise maximale réglée par l'admin, jeu par jeu (v2698)\n";
casino_save_limits(['coin' => 200, 'dice' => 'abc', 'inconnu' => 5]);
check('limite Coin Flip 200 $ : 300 $ refusé', casino_check_stake(300, 'coin') === 'max');
check('limite Coin Flip 200 $ : 150 $ accepté', casino_check_stake(150, 'coin') === null);
check('autre jeu sans limite : 900 $ accepté', casino_check_stake(900, 'mines') === null);
check('jamais au-dessus du maximum général', casino_check_stake(CASINO_MAX_STAKE + 1, 'mines') === 'max');
check('valeur fausse ou jeu inconnu ignorés', !isset(casino_limits()['dice']) && !isset(casino_limits()['inconnu']));
casino_save_limits([]);
echo "7) Penalty en série (v2695)\n";
for ($stop = 1; $stop <= 8; $stop++) {
  $N = 200000; $sum = 0.0;
  for ($i = 0; $i < $N; $i++) { $k = 0; while ($k < $stop) { if (random_int(0, 2) === random_int(0, 2)) { $k = -1; break; } $k++; } $sum += $k > 0 ? casino_pen_mult($k) : 0; }
  check(sprintf('penalty encaissé après %d but(s) : retour %.1f %%', $stop, $sum / $N * 100), $sum / $N < 0.985 && $sum / $N > 0.93);
}
check('penalty : échelle ×1,44 → ×24,60', abs(casino_pen_mult(1) - 1.44) < 0.001 && abs(casino_pen_mult(8) - 24.6) < 0.001, casino_pen_mult(8) . '');
echo "10) Tour commun Sky Rush (v2701)\n";
@unlink(casino_round_file('crash'));
$t = microtime(true);
$pub = casino_round_public('crash', $t);
check('tour commun créé : on mise d\'abord (barre de décompte), point d\'explosion CACHÉ', $pub['phase'] === 'bet' && !isset($pub['c']) && $pub['t0'] > $t, json_encode($pub));
$s1 = casino_round_slot('crash', $t); $s2 = casino_round_slot('crash', $t + 1);
check('deux joueurs pendant la mise : même tour, même départ, même point d\'explosion', $s1['i'] === $s2['i'] && $s1['t0'] === $s2['t0'] && $s1['c'] === $s2['c']);
$fly = $s1['t0'] + 0.01;
$s3 = casino_round_slot('crash', $fly);
check('miser pendant le vol : placé sur le tour SUIVANT', $s3['i'] === $s1['i'] + 1 && $s3['t0'] > $s1['t0']);
$pubF = casino_round_public('crash', $fly);
check('pendant le vol : point d\'explosion toujours caché', $pubF['phase'] === 'fly' || ($pubF['phase'] === 'end' && $s1['c'] <= 1.0), json_encode($pubF));
$after = $s1['t0'] + casino_crash_secs($s1['c']) + 0.5;
$pubE = casino_round_public('crash', $after);
check('après l\'explosion : le point est montré à tous, c\'est le même', $pubE['phase'] === 'end' && abs($pubE['c'] - $s1['c']) < 1e-9);
$pubN = casino_round_public('crash', $after + CASINO_ROUND_SHOW + 1);
check('puis un nouveau tour commence tout seul (nouvelle mise)', $pubN['i'] === $s1['i'] + 1 && $pubN['phase'] === 'bet');
$N = 20000; $w = 0; $rr = []; casino_round_advance($rr, 1000.0);
for ($k = 0; $k < $N; $k++) { if ($rr['c'] >= 2) $w++; casino_round_advance($rr, (float) $rr['end'] + 0.001); }
check('les points d\'explosion des tours suivent la même loi (≥ ×2 : ~47 %, v2780)', abs($w / $N - 0.47) < 0.02, (string) round($w / $N, 3));
@unlink(casino_round_file('crash'));

echo "11) Tirages en direct : Crypto Live, Chevaux Live, Roulette Live (v2718)\n";
check('Crypto Live : retour ' . round(CASINO_CRYPTOX_MULT / CASINO_CRYPTOX_N * 100, 1) . ' %', CASINO_CRYPTOX_MULT / CASINO_CRYPTOX_N < 0.97 && CASINO_CRYPTOX_MULT / CASINO_CRYPTOX_N > 0.94);
check('Chevaux Live : retour ' . round(CASINO_HORSES_MULT / CASINO_HORSES_N * 100, 1) . ' %', CASINO_HORSES_MULT / CASINO_HORSES_N < 0.97 && CASINO_HORSES_MULT / CASINO_HORSES_N > 0.94);
$cnt = array_fill(0, 15, 0); for ($k = 0; $k < 3000; $k++) $cnt[casino_draw_outcome('cryptox', 900000 + $k)['n']]++;
check('Crypto Live : les 15 cryptos sortent à peu près autant (hasard juste)', min($cnt) > 140 && max($cnt) < 270, json_encode($cnt));
$file = casino_user_file('u_cs');
// v2792 : Racing en direct (10 voitures, cotes) ; chevaux : gagnant « w3 », couplé « c2-7 », ancien format « 3 »
foreach ([['cryptox', '7'], ['horses', 'w3'], ['horses', 'c2-7'], ['horses', '3'], ['race', '4'], ['roulette', 'red']] as [$dg, $sel]) {
  [$P, $B] = CASINO_DRAW[$dg];
  $i0 = casino_draw_i($dg, time()) + 50; $t = casino_draw_start($dg, $i0) + 2.0; // un tour futur, 2 s après son ouverture
  casino_with($file, static function (array &$st) use ($dg) { unset($st['g'][$dg]); return true; });
  $bal[$U] = 50.0; syncv();
  $pub = casino_draw_public($dg, $t);
  check("$dg : pendant les mises, le résultat est CACHÉ", $pub['phase'] === 'bet' && !isset($pub['res']));
  $r = casino_draw_act(load_db(), $me, 'u_cs', $file, $dg, 'bet', 'real', 2, ['sel' => 'zz'], $t);
  check("$dg : sélection invalide refusée, rien de retiré", $r['ok'] === false && $r['reason'] === 'param' && $bal[$U] == 50.0);
  $r = casino_draw_act(load_db(), $me, 'u_cs', $file, $dg, 'bet', 'real', 2, ['sel' => $sel], $t);
  check("$dg : pari accepté, 2 $ retirés", $r['ok'] && $bal[$U] == 48.0 && !isset($r['res']), json_encode($r));
  $r2 = casino_draw_act(load_db(), $me, 'u_cs', $file, $dg, 'bet', 'real', 2, ['sel' => $sel], $t + 1);
  check("$dg : 2e pari sur le même tour refusé", $r2['ok'] === false && $r2['reason'] === 'already' && $bal[$U] == 48.0);
  $tShow = casino_draw_start($dg, $i0) + $B + 0.5;
  $d = casino_draw_act(load_db(), $me, 'u_cs', $file, $dg, 'dround', 'real', 0, [], $tShow);
  $out = casino_draw_outcome($dg, $i0);
  $want = casino_money(2 * (float) casino_draw_mult($dg, $sel, $out));
  check("$dg : après la fermeture, réglé selon le tirage commun (gain $want $)", !empty($d['done']) && abs($d['win'] - $want) < 0.001 && abs($bal[$U] - (48.0 + $want)) < 0.001, json_encode([$d['win'] ?? null, $bal[$U]]));
  casino_draw_act(load_db(), $me, 'u_cs', $file, $dg, 'dround', 'real', 0, [], $tShow + 2);
  check("$dg : gain versé UNE seule fois", abs($bal[$U] - (48.0 + $want)) < 0.001);
  $pr = casino_draw_public($dg, $tShow)['res'] ?? [];
  check("$dg : le résultat public est le même pour tous", isset($out['order']) ? ($pr['order'] ?? null) === $out['order'] : ($pr['n'] ?? null) === $out['n']);
  $late = casino_draw_act(load_db(), $me, 'u_cs', $file, $dg, 'bet', 'real', 2, ['sel' => $sel], casino_draw_start($dg, $i0) + $B - 0.3);
  check("$dg : pari après la fermeture des mises refusé", $late['ok'] === false);
  $nx = casino_draw_act(load_db(), $me, 'u_cs', $file, $dg, 'bet', 'real', 1, ['sel' => $sel], casino_draw_start($dg, $i0 + 1) + 1);
  check("$dg : tour suivant, nouveau pari accepté", $nx['ok'] === true, json_encode($nx));
  casino_with($file, static function (array &$st) use ($dg) { unset($st['g'][$dg]); return true; });
}
check('roulette : gains des grands sites (rouge ×2, zéro perdu, n°17 ×36, douzaine ×3)', casino_roulette_mult('red', 1) == 2.0 && casino_roulette_mult('red', 0) == 0.0 && casino_roulette_mult('n17', 17) == 36.0 && casino_roulette_mult('d2', 13) == 3.0 && casino_roulette_mult('xx', 3) === null);
echo "11b) v2792 : cotes de Racing et Horse Race — marge 6 % pour CHAQUE choix, arrivée selon les chances, rien de secret avant la fermeture\n";
check('race : plus jouable en instantané (seulement en direct)', casino_play(load_db(), $me, 'race', 'real', 1, ['car' => 2])['ok'] === false);
check('race / horses : sélections invalides refusées', casino_draw_mult('race', '10', []) === null && casino_draw_mult('horses', 'c7-2', []) === null && casino_draw_mult('horses', 'c3-3', []) === null && casino_draw_mult('horses', 'x', []) === null);
$worst = [1, 0]; $nC = 0;
for ($k = 0; $k < 400; $k++) {
  $pp = casino_runner_probs();
  if (abs(array_sum($pp) - 1) > 1e-4 || min($pp) < 0.025 || max($pp) > 0.32) $nC++;
  $cd = casino_runner_card('horses', $pp);
  foreach ($pp as $i => $q) { $ev = $q * $cd['o'][$i]; $worst = [min($worst[0], $ev), max($worst[1], $ev)]; }
  for ($a = 0; $a < 10; $a++) for ($b = $a + 1; $b < 10; $b++) { $q = casino_pair_p($pp, $a, $b); $ev = $q * $cd['c']["$a-$b"]; if ($cd['c']["$a-$b"] < CASINO_ODDS_MAX) $worst = [min($worst[0], $ev), max($worst[1], $ev)]; }
}
check('chances des coureurs : total 1, de 3 % à 30 %', $nC === 0, (string) $nC);
check(sprintf('chaque cote (gagnant et couplé) rend %.2f à %.2f %% : jamais plus de 94 %%', $worst[0] * 100, $worst[1] * 100), $worst[1] <= 0.94 + 1e-9 && $worst[0] > 0.92);
// l'arrivée suit bien les chances (favori gagne plus souvent)
$pp = [0.30, 0.20, 0.12, 0.09, 0.08, 0.07, 0.05, 0.04, 0.03, 0.02]; $win = array_fill(0, 10, 0); $pair01 = 0; $N = 60000;
for ($k = 0; $k < $N; $k++) { $o = casino_runner_order($pp); $win[$o[0]]++; $t2 = [$o[0], $o[1]]; sort($t2); if ($t2 === [0, 1]) $pair01++; if (count(array_unique($o)) !== 10) $nC++; }
check(sprintf('arrivée : le favori (30 %%) gagne %.1f %%, l\'outsider (2 %%) %.1f %%', $win[0] / $N * 100, $win[9] / $N * 100), abs($win[0] / $N - 0.30) < 0.012 && abs($win[9] / $N - 0.02) < 0.004 && $nC === 0);
check(sprintf('couplé 1-2 : %.2f %% (attendu %.2f %%)', $pair01 / $N * 100, casino_pair_p($pp, 0, 1) * 100), abs($pair01 / $N - casino_pair_p($pp, 0, 1)) < 0.01);
// retour réel en jouant (tirages complets, choix au hasard)
foreach (['race', 'horses'] as $dg) { $sum = 0.0; $N = 40000;
  for ($k = 0; $k < $N; $k++) { $pp = casino_runner_probs(); $out = casino_runner_card($dg, $pp) + ['order' => casino_runner_order($pp)];
    $sel = $dg === 'race' ? (string) random_int(0, 9) : 'w' . random_int(0, 9); // couplé (jusqu'à ×500) : vérifié exactement plus haut, trop de hasard pour une simulation
    $sum += casino_draw_mult($dg, $sel, $out); }
  check(sprintf('%s : retour en jouant %.1f %% (≈ 94)', $dg, $sum / $N * 100), $sum / $N > 0.90 && $sum / $N < 0.975);
}
$tB = casino_draw_start('race', casino_draw_i('race', time()) + 80) + 3.0; // v2811 : race et horses ont la même période
$pb = casino_draw_public('race', $tB);
check('race : pendant les mises, les COTES sont visibles mais pas l\'arrivée', count($pb['odds'] ?? []) === 10 && !isset($pb['res']) && !isset($pb['order']));
$ph = casino_draw_public('horses', $tB);
check('horses : cotes gagnant (10) et couplé (45) visibles avant la fermeture', count($ph['odds'] ?? []) === 10 && count($ph['pair'] ?? []) === 45 && !isset($ph['res']));
check('roulette : plus jouable en instantané (seulement en direct)', casino_play(load_db(), $me, 'roulette', 'real', 1, ['bet' => 'red'])['ok'] === false);

echo "12) v2810 (audit argent) : gains arrondis VERS LE BAS, pari en direct jamais bloqué, deux départs simultanés = une seule mise, PFC refusé\n";
// a) arrondi des gains au centime INFÉRIEUR (mises minuscules : la marge maison ne disparaît plus)
check('Banque du baccara à 0,10 $ : 0,195 → 0,19 (plus 0,20)', casino_win(0.10, 1.95) === 0.19);
check('limbo ×1,05 à 0,10 $ : 0,105 → 0,10', casino_win(0.10, 1.05) === 0.10);
check('dés 89 % à 0,10 $ : 0,10561 → 0,10', casino_win(0.10, floor(CASINO_EDGE * 100 / 89 * 10000) / 10000) === 0.10);
check('remboursement exact (égalité ×1) : 0,29 → 0,29', casino_win(0.29, 1.0) === 0.29 && casino_win(0.10, 1.0) === 0.10 && casino_win(7.77, 1.0) === 7.77);
check('gain rond inchangé (2 $ × 1,94 = 3,88) et plafond respecté', casino_win(2, 1.94) === 3.88 && casino_win(1000, 1000) === CASINO_MAX_WIN && casino_win(1, 0) === 0.0);
$mults = [CASINO_COIN_MULT, CASINO_DICE_DUEL, CASINO_PENALTY_MULT, CASINO_RPS_MULT, 1.95, 2.85, 1.97, 4.7, 9.4, 0.5, 12.0, 9.0];
foreach (CASINO_WHEEL as [$x]) $mults[] = (float) $x; foreach (CASINO_PLINKO as $x) $mults[] = (float) $x; foreach (CASINO_KENO as $x) $mults[] = (float) $x;
for ($c = 2; $c <= 95; $c++) $mults[] = floor(CASINO_EDGE * 100 / $c * 10000) / 10000;
for ($t = 101; $t <= 300; $t++) $mults[] = $t / 100;
for ($k = 1; $k <= 8; $k++) { $mults[] = casino_tower_mult($k); $mults[] = casino_pen_mult($k); }
for ($k = 1; $k <= 20; $k++) $mults[] = casino_balloon_mult($k);
foreach ([1, 3, 5, 10] as $mm) for ($k = 1; $k <= 5; $k++) $mults[] = casino_mines_mult($mm, $k);
for ($a = 1; $a <= 13; $a++) { $mults[] = casino_hilo_mult($a, true); $mults[] = casino_hilo_mult($a, false); }
foreach (casino_planets_odds() as $x) $mults[] = (float) $x;
$over = 0; $worstGap = 0.0;
foreach ($mults as $m) for ($c = 10; $c <= 500; $c++) { $s = $c / 100; $w = casino_win($s, $m); if ($w > $s * $m + 1e-9 || $w < $s * $m - 0.01 - 1e-9 || abs($w * 100 - round($w * 100)) > 1e-6) $over++; }
check('aucun gain au-dessus de mise × multiplicateur (toutes mises 0,10 à 5,00 $, ' . count($mults) . ' multiplicateurs)', $over === 0, (string) $over);
// exact : Banque du baccara à 0,10 $ (probabilités exactes du tirage du jeu) < 100 %
$PB = ['p' => 0.0, 'b' => 0.0, 't' => 0.0]; $vv = static fn($c) => casino_bac_v($c);
for ($a = 1; $a <= 13; $a++) for ($b = 1; $b <= 13; $b++) for ($c = 1; $c <= 13; $c++) for ($e = 1; $e <= 13; $e++) {
  $base = 1 / 28561; $tp0 = ($vv($a) + $vv($b)) % 10; $tb0 = ($vv($c) + $vv($e)) % 10;
  $add = static function ($tp, $tb, $pr) use (&$PB) { if ($tp === $tb) $PB['t'] += $pr; elseif ($tp > $tb) $PB['p'] += $pr; else $PB['b'] += $pr; };
  if ($tp0 >= 8 || $tb0 >= 8) { $add($tp0, $tb0, $base); continue; }
  if ($tp0 <= 5) {
    for ($p3 = 1; $p3 <= 13; $p3++) { $tp = ($tp0 + $vv($p3)) % 10; $x = $vv($p3); $tb = $tb0;
      $dr = $tb <= 2 || ($tb === 3 && $x !== 8) || ($tb === 4 && $x >= 2 && $x <= 7) || ($tb === 5 && $x >= 4 && $x <= 7) || ($tb === 6 && ($x === 6 || $x === 7));
      if ($dr) { for ($b3 = 1; $b3 <= 13; $b3++) $add($tp, ($tb + $vv($b3)) % 10, $base / 169); } else $add($tp, $tb, $base / 13); }
  } elseif ($tb0 <= 5) { for ($b3 = 1; $b3 <= 13; $b3++) $add($tp0, ($tb0 + $vv($b3)) % 10, $base / 13); } else $add($tp0, $tb0, $base);
}
foreach ([0.10, 0.11, 0.13, 0.15, 0.17, 0.19] as $s) { $rtp = ($PB['b'] * casino_win($s, 1.95) + $PB['t'] * casino_win($s, 1.0)) / $s;
  check(sprintf('Banque du baccara à %.2f $ : retour exact %.2f %% (< 100)', $s, $rtp * 100), $rtp < 1.0); }
// de bout en bout : casino_play paie l'arrondi inférieur
$bal[$U] = 50.0; syncv(); $seen = []; $okBal = true;
for ($k = 0; $k < 400; $k++) { $b0 = $bal[$U]; $r = casino_play(load_db(), $me, 'baccarat', 'real', 0.10, ['bet' => 'banker']); if (!$r['ok']) break; $seen[(string) $r['win']] = 1; if (abs($bal[$U] - ($b0 - 0.10 + $r['win'])) > 0.001) $okBal = false; }
ksort($seen);
check('casino_play Banque 0,10 $ : gains possibles 0 / 0,10 (égalité) / 0,19 seulement, solde exact', !array_diff(array_keys($seen), ['0', '0.1', '0.19']) && isset($seen['0.19']) && $okBal, json_encode(array_keys($seen)));
// plusieurs étapes : Ballon à 0,10 $, 2 souffles (×1,16) puis encaisser → 0,11 (0,116 arrondi vers le bas)
$bal[$U] = 50.0; syncv();
casino_with($file, static function (array &$st) { unset($st['g']['balloon']); return true; });
casino_multi(load_db(), $me, 'balloon', 'start', 'real', 0.10, []);
casino_with($file, static function (array &$st) { $st['g']['balloon']['pop'] = 50; return true; });
casino_multi(load_db(), $me, 'balloon', 'pump', 'real', 0, []); casino_multi(load_db(), $me, 'balloon', 'pump', 'real', 0, []);
$r = casino_multi(load_db(), $me, 'balloon', 'cash', 'real', 0, []);
check(sprintf('Ballon 0,10 $ ×%.2f : gain %.2f $ (vers le bas)', casino_balloon_mult(2), $r['win'] ?? -1), abs(($r['win'] ?? -1) - casino_win(0.10, casino_balloon_mult(2))) < 1e-9 && abs($bal[$U] - (49.90 + casino_win(0.10, casino_balloon_mult(2)))) < 0.001);
// avion à encaissement automatique ×1,05 à 0,10 $ → 0,10
casino_with($file, static function (array &$st) { unset($st['g']['crash']); return true; }); @unlink(casino_round_file('crash'));
$s = casino_multi(load_db(), $me, 'crash', 'start', 'real', 0.10, ['auto' => 1.05]);
casino_with($file, static function (array &$st) { $st['g']['crash']['c'] = 3.0; return true; });
$r = casino_settle_crash(load_db(), 'u_cs', $file, (float) $s['t0'] + 5, 'crash');
check('avion auto ×1,05 à 0,10 $ : gain 0,10 (0,105 vers le bas)', ($r['win'] ?? -1) === 0.10, json_encode($r['win'] ?? null));
casino_with($file, static function (array &$st) { unset($st['g']['crash']); return true; }); @unlink(casino_round_file('crash'));

// b) pari en direct sur un tour sorti de l'historique (60 tours) : jamais bloqué
[$P, $B] = CASINO_DRAW['planets'];
$i0 = casino_draw_i('planets', time()) + 200; $t = casino_draw_start('planets', $i0) + 2.0;
casino_with($file, static function (array &$st) { unset($st['g']['planets']); return true; });
$bal[$U] = 50.0; syncv();
$r = casino_draw_act(load_db(), $me, 'u_cs', $file, 'planets', 'bet', 'real', 0.15, ['sel' => '0'], $t);
check('Lucky Planets : pari 0,15 $ accepté, résultat gardé avec le pari (caché au joueur)', $r['ok'] && !isset($r['o']) && !isset($r['res']) && abs($bal[$U] - 49.85) < 0.001, json_encode($r));
casino_with($file, static function (array &$st) { $st['g']['planets']['o'] = ['n' => 0]; return true; }); // la planète choisie sort (×2,93)
for ($k = 1; $k <= 70; $k++) casino_draw_outcome('planets', $i0 + $k); // le tour quitte l'historique des 60 derniers
check('le tour du pari a quitté l\'historique et n\'est PAS re-tiré', casino_draw_outcome('planets', $i0) === [] && count((array) json_decode((string) file_get_contents(casino_dir() . '/draw-planets.json'), true)) <= 60);
$late = casino_draw_start('planets', $i0 + 70) + 1.0; // le joueur revient 70 tours plus tard
$d = casino_draw_act(load_db(), $me, 'u_cs', $file, 'planets', 'dround', 'real', 0, [], $late);
$wantP = casino_win(0.15, casino_planets_odds()[0]);
check(sprintf('retour 70 tours plus tard : pari réglé avec SON résultat (0,15 × %.2f = %.2f $, vers le bas)', casino_planets_odds()[0], $wantP), !empty($d['done']) && abs((float) $d['win'] - $wantP) < 1e-9 && abs($bal[$U] - (49.85 + $wantP)) < 0.001 && $wantP === 0.43, json_encode([$d['win'] ?? null, $bal[$U]]));
$nb = casino_draw_act(load_db(), $me, 'u_cs', $file, 'planets', 'bet', 'real', 1, ['sel' => '2'], $late + 1);
check('puis un nouveau pari est accepté (pas « déjà »)', $nb['ok'] === true, json_encode($nb));
casino_with($file, static function (array &$st) { unset($st['g']['planets']); return true; });
// ancien pari (posé avant v2810, sans résultat gardé) dont le tour a disparu → mise rendue UNE fois
$bal[$U] = 48.0; syncv();
$oldRound = $i0 - 100000;
casino_with($file, static function (array &$st) use ($oldRound, $P, $B) { $st['g']['planets'] = ['ref' => 'cs_oldbet' . $oldRound, 'mode' => 'real', 'stake' => 2.0, 'round' => $oldRound, 'close' => (float) (casino_draw_start('planets', $oldRound) + $B), 'sel' => '1', 't0' => (float) (casino_draw_start('planets', $oldRound) + 1), 'done' => 0]; return true; });
$x = casino_draw_act(load_db(), $me, 'u_cs', $file, 'planets', 'bet', 'real', 1, ['sel' => '1'], $late + 2);
$st = casino_with($file, static fn(array &$s) => $s['g']['planets'] ?? null);
check('ancien pari au tour introuvable : mise rendue (2 $), puis le nouveau pari passe', abs($bal[$U] - (48.0 + 2.0 - 1.0)) < 0.001 && $x['ok'] === true, json_encode([$x, $bal[$U]]));
casino_with($file, static function (array &$st) use ($oldRound, $P, $B) { $st['g']['planets'] = ['ref' => 'cs_oldbet' . $oldRound, 'mode' => 'real', 'stake' => 2.0, 'round' => $oldRound, 'close' => (float) (casino_draw_start('planets', $oldRound) + $B), 'sel' => '1', 't0' => 0.0, 'done' => 0]; return true; });
$b1 = $bal[$U];
casino_draw_act(load_db(), $me, 'u_cs', $file, 'planets', 'dround', 'real', 0, [], $late + 3);
check('le remboursement ne se fait qu\'UNE fois (même référence)', abs($bal[$U] - $b1) < 0.001, $b1 . ' → ' . $bal[$U]);
casino_with($file, static function (array &$st) { unset($st['g']['planets']); return true; });

// c) deux départs / deux paris simultanés : la 2e demande arrive pendant que la 1re retire la mise
$origRpc = $GLOBALS['OROLADO_FAKE_RPC']; $hook = null;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use ($origRpc, &$hook) { if ($fn === 'debit_real' && $hook) { $h = $hook; $hook = null; $h(); } return $origRpc($fn, $a); };
foreach (['tower', 'mines', 'crash'] as $mg) {
  casino_with($file, static function (array &$st) use ($mg) { unset($st['g'][$mg]); return true; });
  $bal[$U] = 50.0; syncv(); $inner = null;
  $hook = static function () use (&$inner, $me, $mg) { $inner = casino_multi(load_db(), $me, $mg, 'start', 'real', 3, []); };
  $outer = casino_multi(load_db(), $me, $mg, 'start', 'real', 3, []);
  $kept = casino_with($file, static fn(array &$s) => $s['g'][$mg] ?? null);
  check("$mg : 2 départs simultanés → une seule mise retirée, le 2e « busy » sans rien retirer", $outer['ok'] === true && ($inner['ok'] ?? null) === false && ($inner['reason'] ?? '') === 'busy' && abs($bal[$U] - 47.0) < 0.001 && is_array($kept), json_encode([$inner, $bal[$U]]));
  $again = casino_multi(load_db(), $me, $mg, 'start', 'real', 3, []);
  check("$mg : départ suivant = reprise de la partie, rien retiré", !empty($again['resume']) && abs($bal[$U] - 47.0) < 0.001);
  casino_with($file, static function (array &$st) use ($mg) { unset($st['g'][$mg]); return true; });
}
@unlink(casino_round_file('crash'));
[$P, $B] = CASINO_DRAW['cryptox'];
$tC = casino_draw_start('cryptox', casino_draw_i('cryptox', time()) + 300) + 2.0;
casino_with($file, static function (array &$st) { unset($st['g']['cryptox']); return true; });
$bal[$U] = 50.0; syncv(); $inner = null;
$hook = static function () use (&$inner, $me, $file, $tC) { $inner = casino_draw_act(load_db(), $me, 'u_cs', $file, 'cryptox', 'bet', 'real', 2, ['sel' => '3'], $tC + 0.1); };
$outer = casino_draw_act(load_db(), $me, 'u_cs', $file, 'cryptox', 'bet', 'real', 2, ['sel' => '5'], $tC);
$kept = casino_with($file, static fn(array &$s) => $s['g']['cryptox'] ?? null);
check('Crypto Live : 2 paris simultanés → une seule mise retirée, le 2e refusé sans rien retirer', $outer['ok'] === true && ($inner['ok'] ?? null) === false && abs($bal[$U] - 48.0) < 0.001 && ($kept['sel'] ?? '') === '5', json_encode([$inner, $bal[$U]]));
$r2 = casino_draw_act(load_db(), $me, 'u_cs', $file, 'cryptox', 'bet', 'real', 2, ['sel' => '3'], $tC + 1);
check('Crypto Live : pari suivant sur le même tour → « déjà », rien retiré', $r2['ok'] === false && $r2['reason'] === 'already' && abs($bal[$U] - 48.0) < 0.001);
casino_with($file, static function (array &$st) { unset($st['g']['cryptox']); return true; });
// verrou tenu par une autre requête : « busy », rien retiré
$lk = fopen(casino_user_file('u_cs') . '.lock', 'c'); flock($lk, LOCK_EX);
$bal[$U] = 50.0; syncv();
$r = casino_multi(load_db(), $me, 'tower', 'start', 'real', 3, []);
check('joueur occupé par une autre requête : « busy », rien retiré', $r['ok'] === false && $r['reason'] === 'busy' && abs($bal[$U] - 50.0) < 0.001);
flock($lk, LOCK_UN); fclose($lk);
$GLOBALS['OROLADO_FAKE_RPC'] = $origRpc;
casino_with($file, static function (array &$st) { unset($st['g']['tower']); return true; });

// d) Pierre-Feuille-Ciseaux retiré de l'écran → refusé aussi par l'API
$bal[$U] = 50.0; syncv();
$r = casino_play(load_db(), $me, 'rps', 'real', 1, ['pick' => 0]);
check('Pierre-Feuille-Ciseaux : refusé par le serveur, rien retiré', $r['ok'] === false && $r['reason'] === 'game' && abs($bal[$U] - 50.0) < 0.001);

echo "9) Admin : joueurs du casino (v2698)\n";
casino_hist_add('u_admin_t', ['g' => 'coin', 'm' => 'real', 's' => 2.0, 'w' => 3.88, 'at' => time()]);
casino_hist_add('u_admin_t', ['g' => 'dice', 'm' => 'real', 's' => 5.0, 'w' => 0.0, 'at' => time()]);
casino_hist_add('u_admin_t', ['g' => 'coin', 'm' => 'demo', 's' => 100.0, 'w' => 0.0, 'at' => time()]);
$pl = array_values(array_filter(casino_admin_players(500), static fn($r) => $r['uid'] === 'u_admin_t'));
check('le joueur apparaît dans la liste de l\'admin', count($pl) === 1);
check('totaux en argent réel seulement (2 parties, 7 $ misés, 3,88 $ payés)', $pl && $pl[0]['n'] === 2 && abs($pl[0]['in'] - 7) < 0.001 && abs($pl[0]['out'] - 3.88) < 0.001, json_encode($pl[0] ?? []));
$one = casino_admin_player('u_admin_t');
check('détail : 3 dernières parties visibles (test compris)', count($one['h']) === 3);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);

function syncv(): void { global $bal, $U; $db = load_db(); $db['vault']['u_cs']['real'] = $bal[$U]; save_db(orolado_data_file(), $db); }
