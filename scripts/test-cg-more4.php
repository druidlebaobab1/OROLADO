<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2830 — groupes « more4 » + « more5 » (29 nouveaux jeux instantanés, round 5) : chaque fiche se charge, le retour aux joueurs
 * est entre 93,5 % et 94 % (somme exacte ET simulation), les tables recalculées (dés, binomiale, machines à sous) sont exactes,
 * une vraie partie retire la mise une fois et verse le gain une fois.
 * Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_more4_' . bin2hex(random_bytes(4));
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
copy(__DIR__ . '/../casino_ext/more4.php', $tmp . '/casino_ext/more4.php');
copy(__DIR__ . '/../casino_ext/more5.php', $tmp . '/casino_ext/more5.php');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$f4 = include __DIR__ . '/../casino_ext/more4.php';
$f5 = include __DIR__ . '/../casino_ext/more5.php';
$fiches = $f4 + $f5;
$want = ['coinpush', 'fishing', 'pinball', 'horseshoe', 'golf', 'nails', 'jewelbox', 'daisy', 'safe', 'striker', 'snakes', 'skijump', 'fireworks', 'gumball', 'bingo', 'cricket',
  'pool', 'pinata', 'checkers', 'moles', 'tennis', 'domino', 'goldpan', 'connect4', 'bouquet', 'craps', 'cluster', 'megaways', 'coinlink'];
echo "1) Fiches : les 29 jeux se chargent (clé libre, retour ≤ 94,5 %)\n";
$k = casino_ext_keys();
check('29 fiches (more4 + more5)', array_keys($fiches) === $want, json_encode(array_keys($fiches)));
foreach ($want as $g) check("fiche $g chargée (" . casino_ext_type($g) . ')', in_array($g, $k, true) && !in_array($g, CASINO_GAMES, true));
check('noms affichés', count(array_intersect_key(casino_ext_names(), array_flip($want))) === 29);
// aucune clé partagée avec les autres groupes
$others = [];
foreach (glob(__DIR__ . '/../casino_ext/*.php') as $f) { if (preg_match('/more[45]\.php$/', $f)) continue; $others += (array) include $f; }
check('aucune clé déjà prise par un autre groupe', !array_intersect($want, array_keys($others)), json_encode(array_values(array_intersect($want, array_keys($others)))));

echo "2) Retour aux joueurs : somme exacte entre 93,5 % et 94 %, multiplicateur max ≤ 1000\n";
foreach ($fiches as $g => $d) {
  if ($d['type'] === 'table') {
    $w = 0.0; $ev = 0.0; $mx = 0.0;
    foreach ($d['out'] as $o) { $w += $o[1]; $ev += $o[0] * $o[1]; $mx = max($mx, $o[0]); }
    check(sprintf('%-9s table : %.3f %% (max ×%s, %d lignes)', $g, $ev / $w * 100, $mx, count($d['out'])), $ev / $w >= 0.935 && $ev / $w <= 0.94 + 1e-9 && $mx <= 1000);
  } else {
    foreach ($d['opts'] as $i => $p) { $m = casino_ext_pick_mult($p); check(sprintf('%-9s option %d : ×%.2f → %.3f %%', $g, $i, $m, $p * $m * 100), $p * $m >= 0.935 && $p * $m <= 0.94 + 1e-9); }
  }
}

echo "3) Tables exactes (ce que le navigateur dessine)\n";
// fers à cheval : 3 fers, raté 0 (5/10) · appuyé 1 (3/10) · ceinture 3 (2/10)
$hs = []; $P = [0, 1, 3]; $W = [5, 3, 2];
for ($a = 0; $a < 3; $a++) for ($b = 0; $b < 3; $b++) for ($c = 0; $c < 3; $c++) { $t = $P[$a] + $P[$b] + $P[$c]; $hs[$t] = ($hs[$t] ?? 0) + $W[$a] * $W[$b] * $W[$c]; }
ksort($hs);
check('horseshoe : poids = loi exacte des totaux 0,1,2,3,4,5,6,7,9 (/1000)', array_column($fiches['horseshoe']['out'], 1) === array_values($hs), json_encode($hs));
// taupes : binomiale 5 coups, 2 chances sur 5
$bi = []; for ($h = 0; $h <= 5; $h++) { $cc = [1, 5, 10, 10, 5, 1][$h]; $bi[] = $cc * (2 ** $h) * (3 ** (5 - $h)); }
check('moles : binomiale exacte (5, 2/5) sur 3125', array_column($fiches['moles']['out'], 1) === $bi);
// vernis : 5 ongles, 6 couleurs → 7 776 tirages
check('nails : 7 776 = 6⁵ (5 pareilles 6 · carré 150 · full 300 · brelan 1200 · 2 paires 1800 · paire 3600 · toutes différentes 720)', array_column($fiches['nails']['out'], 1) === [6, 150, 300, 1200, 1800, 3600, 720]);
// serpents et échelles : les 216 suites de 3 dés
$J = [3 => 11, 7 => 17, 12 => 22, 15 => 5, 20 => 9, 24 => 13]; $fin = [];
for ($a = 1; $a <= 6; $a++) for ($b = 1; $b <= 6; $b++) for ($c = 1; $c <= 6; $c++) { $p = 0; foreach ([$a, $b, $c] as $dd) { if ($p + $dd <= 25) $p += $dd; if (isset($J[$p])) $p = $J[$p]; } $fin[$p] = ($fin[$p] ?? 0) + 1; }
ksort($fin);
$rowP = fn($s) => $s === 25 ? 40 : ($s >= 21 ? 1.2 : ($s >= 16 ? 0.8 : ($s >= 11 ? 0.4 : ($s >= 6 ? 0.2 : 0))));
$sn = array_map(fn($s, $n) => [$rowP($s), $n], array_keys($fin), array_values($fin));
check('snakes : les 216 parties exactes et le gain de la rangée d’arrivée', json_encode($sn) === json_encode($fiches['snakes']['out']));
check('craps : pass 244/495 (×1.90) · don’t pass 251/495 (×1.85)', abs($fiches['craps']['opts'][0] - 244 / 495) < 1e-12 && casino_ext_pick_mult(244 / 495) === 1.9 && casino_ext_pick_mult(251 / 495) === 1.85);
check('bouquet : ×2.68 · ×3.76 · ×4.69 · ×7.83 · ×11.74 (affichés par le jeu)', array_map('casino_ext_pick_mult', $fiches['bouquet']['opts']) === [2.68, 3.76, 4.69, 7.83, 11.74]);
// machines à sous : chaque ligne recalculée comme js/games/more4e.js
$CP = [[1, 1.5, 2, 2.5, 4, 5, 10, 25], [1.2, 2, 2.5, 4, 5, 8, 15, 40], [2, 2.5, 4, 5, 8, 12, 25, 60], [2.5, 4, 5, 8, 12, 20, 40, 125], [5, 8, 12, 20, 30, 50, 125, 500]];
$ok = $fiches['cluster']['out'][0][0] == 0 && count($fiches['cluster']['out']) === 41;
for ($c = 0; $c < 5; $c++) for ($s = 0; $s < 8; $s++) if ((float) $fiches['cluster']['out'][1 + $c * 8 + $s][0] !== (float) $CP[$c][$s]) $ok = false;
check('cluster : 41 lignes = perdu + 5 couleurs × 8 tailles', $ok);
$MP = [[0.5, 1, 2, 4], [0.5, 1, 2, 4], [0.8, 1.5, 3, 6], [0.8, 1.5, 3, 6], [1, 2, 5, 12], [1.5, 3, 8, 20], [2, 5, 12, 30], [4, 10, 25, 100]]; $WY = [1, 2, 4, 8];
$ok = count($fiches['megaways']['out']) === 129;
for ($s = 0; $s < 8; $s++) for ($kk = 0; $kk < 4; $kk++) for ($w = 0; $w < 4; $w++) if (abs($fiches['megaways']['out'][1 + $s * 16 + $kk * 4 + $w][0] - round($MP[$s][$kk] * $WY[$w], 2)) > 1e-9) $ok = false;
check('megaways : 129 lignes = perdu + 8 symboles × 3–6 rouleaux × 1/2/4/8 façons', $ok);
check('coinlink : totaux 3…250 puis GRAND 500', array_column(array_slice($fiches['coinlink']['out'], 1), 0) === [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100, 150, 250, 500]);
check('goldpan : gain = grammes ÷ 10', array_column($fiches['goldpan']['out'], 0) === [0, 0.3, 0.6, 1, 1.5, 2, 3, 5, 10, 25, 100]);
check('daisy : pétales pairs = 0, impairs payés', (function () use ($fiches) { foreach ($fiches['daisy']['out'] as $i => $o) { $pet = [5, 6, 7, 8, 9, 10, 11, 12, 13, 21][$i]; if (($pet % 2 === 0) !== ($o[0] == 0)) return false; } return true; })());

echo "4) Retour simulé (tirages du serveur) · dessin = gain\n";
foreach ($fiches as $g => $d) {
  $N = 300000; $s = 0.0; $n = $d['type'] === 'pick' ? count($d['opts']) : 0; $bad = 0;
  for ($i = 0; $i < $N; $i++) {
    $r = casino_ext_instant($g, $n ? ['pick' => $i % $n] : []);
    $s += $r['mult'];
    if ($n && ($r['mult'] > 0) !== ($r['view']['w'] === $r['view']['pick'])) $bad++;
    if (!$n && (float) $d['out'][$r['view']['i']][0] !== (float) $r['mult']) $bad++;
  }
  // tolérance = 4 écarts-types de la moyenne (calculés sur la table elle-même)
  if ($n) { $m2 = 0.0; foreach ($d['opts'] as $p) $m2 += $p * casino_ext_pick_mult($p) ** 2 / $n; } else { $tw = array_sum(array_column($d['out'], 1)); $m2 = 0.0; foreach ($d['out'] as $o) $m2 += $o[0] ** 2 * $o[1] / $tw; }
  $tol = max(0.004, 4 * sqrt($m2) / sqrt($N));
  check(sprintf('%-9s simulé %.2f %%', $g, $s / $N * 100), abs($s / $N - 0.9375) < $tol + 0.003 && $bad === 0, "bad=$bad");
}

echo "5) Argent : une vraie partie retire la mise une fois et verse le gain une fois\n";
$U = 'aaaaaaaa-1111-2222-3333-555555555555';
$db = blank_db();
$db['users']['u_m'] = ['id' => 'u_m', 'email' => 'm@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_m'] = ['demo' => 500, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$U] = 100.0; $me = $db['users']['u_m'];
foreach ($fiches as $g => $d) {
  $b0 = $bal[$U];
  $r = casino_play(load_db(), $me, $g, 'real', 1, $d['type'] === 'pick' ? ['pick' => 0] : []);
  check("$g : solde = avant − 1 + gain (×" . ($r['mult'] ?? '?') . ')', $r['ok'] === true && abs($bal[$U] - ($b0 - 1 + $r['win'])) < 0.001, json_encode([$b0, $bal[$U], $r['win'] ?? null]));
}
check('choix hors limites refusé', casino_play(load_db(), $me, 'bouquet', 'real', 1, ['pick' => 5])['ok'] === false && casino_play(load_db(), $me, 'craps', 'real', 1, [])['ok'] === false);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
