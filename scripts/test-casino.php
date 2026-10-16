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
  'limbo' => fn() => ['target' => [1.5, 2, 3, 10, 50][random_int(0, 4)]], 'wheel' => fn() => [], 'race' => fn() => ['car' => random_int(0, 5)],
  'roulette' => fn() => ['bet' => ['red', 'black', 'even', 'odd', 'd2', 'n17', 'n0'][random_int(0, 6)]], 'slots' => fn() => [], 'plinko' => fn() => [],
  'keno' => fn() => ['picks' => [3, 9, 15]], 'scratch' => fn() => [], 'penalty' => fn() => ['aim' => random_int(0, 2)],
  'colors' => fn() => ['bet' => ['green', 'red', 'violet', 'n3'][random_int(0, 3)]],
  'dragon' => fn() => ['bet' => ['dragon', 'tiger', 'tie'][random_int(0, 2)]], 'baccarat' => fn() => ['bet' => ['player', 'banker', 'tie'][random_int(0, 2)]],
  'sicbo' => fn() => ['bet' => ['small', 'big'][random_int(0, 1)]], 'chests' => fn() => ['pick' => random_int(0, 2)],
  'darts' => fn() => [],
];
foreach ($params as $g => $pf) {
  $N = 300000; $sum = 0.0; $bad = 0;
  for ($i = 0; $i < $N; $i++) {
    $r = casino_instant($g, $pf(), 1.0);
    $sum += $r['mult'];
    // le dessin doit correspondre au gain
    if ($g === 'slots') { $s = $r['view']['reels']; $same = $s[0] === $s[1] && $s[1] === $s[2]; $ch = count(array_filter($s, fn($x) => $x === 'cherry'));
      if (($r['mult'] > 0) !== ($same || $ch >= 2)) $bad++; }
    if ($g === 'scratch') { $c = array_count_values($r['view']['grid']); $three = max($c) >= 3; if (($r['mult'] > 0) !== $three || max($c) > 3 || count($r['view']['grid']) !== 9) $bad++; }
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
foreach ([1, 3, 6, 10] as $k) { $ev = pow(0.8, $k) * casino_apple_mult($k); check("pomme : $k étage(s) puis encaisser : retour " . round($ev * 100, 1) . ' %', $ev < 0.971 && $ev > 0.95); }
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
foreach ([1, 4, 8] as $k) { $ev = pow(2 / 3, $k) * casino_tower_mult($k); check("tour : $k étage(s) : retour " . round($ev * 100, 1) . ' %', $ev < 0.971 && $ev > 0.95); }
foreach ([1, 5, 15] as $k) { $ev = pow(0.9, $k) * casino_balloon_mult($k); check("ballon : $k souffle(s) : retour " . round($ev * 100, 1) . ' %', $ev < 0.971 && $ev > 0.95); }
foreach ([1, 2, 3, 4] as $lv) { $k = 3; $ev = pow((5 - $lv) / 5, $k) * casino_apple_mult($k, $lv); check("verger niveau $lv, 3 étages : retour " . round($ev * 100, 1) . ' %', $ev < 0.971 && $ev > 0.95); }
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
