<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * casb (round 6) — 23 jeux instantanés de tables / cartes / dés / hasard d'arcade + Comet Queen (crash) :
 * chaque fiche se charge, le retour aux joueurs est entre 93,5 % et 94 % (somme exacte ET simulation des tirages du serveur),
 * les tables exactes (dés, cartes, roulette, skee-ball, derby) sont recalculées ici, une vraie partie retire la mise une fois
 * et verse le gain une fois ; Comet Queen : départ / encaisser / fin secrète payés par l'horloge du serveur.
 * Fausse caisse, dossier temporaire : rien ne part en ligne.   php scripts/test-cg-casb.php
 */
$tmp = sys_get_temp_dir() . '/orolado_casb_' . bin2hex(random_bytes(4));
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
copy(__DIR__ . '/../casino_ext/casb.php', $tmp . '/casino_ext/casb.php');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$all = include __DIR__ . '/../casino_ext/casb.php';
$want = ['blackjack', 'tcpoker', 'holdem', 'niuniu', 'acerace', 'trente', 'clocksol', 'yatzy', 'crownanchor', 'derby', 'ceelo', 'shipcrew',
  'dblroul', 'twinwheel', 'twoup', 'fantan', 'pachinko', 'ladder', 'skeeball', 'ducks', 'dreidel', 'oracle', 'rpsduel', 'cometqueen'];
$fiches = array_filter($all, static fn($d) => $d['type'] !== 'skill');
echo "1) Fiches : les 24 jeux se chargent (clé libre, retour ≤ 94,5 %)\n";
$k = casino_ext_keys();
check('24 fiches casb', array_keys($all) === $want, json_encode(array_keys($all)));
foreach ($want as $g) check("fiche $g chargée (" . casino_ext_type($g) . ')', in_array($g, $k, true) && !in_array($g, CASINO_GAMES, true));
$others = [];
foreach (glob(__DIR__ . '/../casino_ext/*.php') as $f) { if (preg_match('/casb\.php$/', $f)) continue; $others += (array) include $f; }
check('aucune clé déjà prise par un autre groupe', !array_intersect($want, array_keys($others)), json_encode(array_values(array_intersect($want, array_keys($others)))));
$cat = (string) file_get_contents(__DIR__ . '/../js/games/cat-casb.js');
$mods = ''; foreach (glob(__DIR__ . '/../js/games/casb*.js') as $f) $mods .= file_get_contents($f);
foreach ($want as $g) check("$g : logo au catalogue + module avec règles en 12 langues", strpos($cat, "['$g', ") !== false && strpos($mods, "key: '$g'") !== false);
$casino = (string) file_get_contents(__DIR__ . '/../js/casino.js');
check('cat-casb dans CAT_FILES, les 24 clés dans MO_POS', strpos($casino, "'cat-casb'") !== false && !array_filter($want, static fn($g) => strpos($casino, "'$g'") === false));

echo "2) Retour aux joueurs : somme exacte entre 93,5 % et 94 %, multiplicateur max ≤ 1000\n";
foreach ($fiches as $g => $d) {
  if ($d['type'] === 'table') {
    $w = 0.0; $ev = 0.0; $mx = 0.0;
    foreach ($d['out'] as $o) { $w += $o[1]; $ev += $o[0] * $o[1]; $mx = max($mx, $o[0]); }
    check(sprintf('%-11s table : %.3f %% (max ×%s, %d lignes)', $g, $ev / $w * 100, $mx, count($d['out'])), $ev / $w >= 0.935 && $ev / $w <= 0.94 + 1e-9 && $mx <= 1000);
  } else {
    foreach ($d['opts'] as $i => $p) { $m = casino_ext_pick_mult($p); check(sprintf('%-11s option %d : ×%.2f → %.3f %%', $g, $i, $m, $p * $m * 100), $p * $m >= 0.935 && $p * $m <= 0.94 + 1e-9); }
  }
}
check('comet queen : vitesse 0,12 (×2 après ' . round(casino_skill_secs('cometqueen', 2), 1) . ' s), moment secret = loi de l’avion', casino_skill_rate('cometqueen') === 0.12);

echo "3) Tables exactes (ce que le navigateur dessine)\n";
check('crownanchor : 0 / 1 / 2 / 3 fois le symbole sur 3 dés = 125 / 75 / 15 / 1 (/216)', array_column($fiches['crownanchor']['out'], 1) === [125, 75, 15, 1]);
// cee-lo : résultats valides d'un lancer de 3 dés (on relance sinon), toi contre la banque
$ceeRank = static function (array $d): int { sort($d); $s = implode('', $d); if ($s === '456') return 20; if ($s === '123') return 0; if ($d[0] === $d[2]) return 10 + $d[0]; if ($d[0] === $d[1]) return $d[2]; if ($d[1] === $d[2]) return $d[0]; return -1; };
$res = []; for ($a = 1; $a <= 6; $a++) for ($b = 1; $b <= 6; $b++) for ($c = 1; $c <= 6; $c++) { $r = $ceeRank([$a, $b, $c]); if ($r >= 0) $res[] = $r; }
$cc = [0, 0, 0, 0, 0]; foreach ($res as $p) foreach ($res as $q) { if ($p < $q) $cc[0]++; elseif ($p === $q) $cc[1]++; else $cc[$p === 20 ? 4 : ($p > 10 ? 3 : 2)]++; }
check('ceelo : 108 résultats valides, perdu / égalité / point / brelan / 4-5-6 exacts sur 11 664', count($res) === 108 && array_column($fiches['ceelo']['out'], 1) === $cc, json_encode($cc));
// niu niu : les 2 598 960 mains de 5 cartes (valeurs As = 1, figures = 10 ; 12 figures)
$val = []; for ($s = 0; $s < 4; $s++) for ($r = 1; $r <= 13; $r++) $val[] = [$r > 10 ? 10 : $r, $r > 10];
$niu = array_fill(0, 12, 0); $T = microtime(true);
for ($a = 0; $a < 52; $a++) for ($b = $a + 1; $b < 52; $b++) for ($c = $b + 1; $c < 52; $c++) for ($e = $c + 1; $e < 52; $e++) for ($f = $e + 1; $f < 52; $f++) {
  $h = [$val[$a], $val[$b], $val[$c], $val[$e], $val[$f]];
  if ($h[0][1] && $h[1][1] && $h[2][1] && $h[3][1] && $h[4][1]) { $niu[11]++; continue; }
  $v = [$h[0][0], $h[1][0], $h[2][0], $h[3][0], $h[4][0]]; $tot = array_sum($v); $bull = -1;
  for ($x = 0; $x < 5 && $bull < 0; $x++) for ($y = $x + 1; $y < 5 && $bull < 0; $y++) { // les 2 cartes restantes = x, y : les 3 autres font un compte rond ?
    if (($tot - $v[$x] - $v[$y]) % 10 === 0) { $m = ($v[$x] + $v[$y]) % 10; $bull = $m === 0 ? 10 : $m; }
  }
  $niu[$bull < 0 ? 0 : $bull]++;
}
check(sprintf('niuniu : rien / bœuf 1…9 / niu niu / cinq figures exacts sur 2 598 960 (%.1f s)', microtime(true) - $T), array_column($fiches['niuniu']['out'], 1) === $niu, json_encode($niu));
check('dblroul : rouge-rouge 324 · un de chaque 648 · noir-noir 324 · un zéro 73 (/1369 = 37²)', $fiches['dblroul']['opts'] === [324 / 1369, 648 / 1369, 324 / 1369, 73 / 1369] && 324 + 648 + 324 + 73 === 1369);
// skee-ball : 5 balles, trous 10/20/30/40/50/100 à 30/25/18/12/10/5 %
$dist = [0 => 1]; foreach (range(1, 5) as $_) { $nd = []; foreach ($dist as $t => $w) foreach ([10 => 30, 20 => 25, 30 => 18, 40 => 12, 50 => 10, 100 => 5] as $pt => $pw) $nd[$t + $pt] = ($nd[$t + $pt] ?? 0) + $w * $pw; $dist = $nd; }
$band = [0, 0, 0, 0, 0, 0]; foreach ($dist as $t => $w) $band[$t < 150 ? 0 : ($t < 200 ? 1 : ($t < 250 ? 2 : ($t < 300 ? 3 : ($t < 350 ? 4 : 5))))] += $w;
check('skeeball : loi exacte des totaux de 5 balles (÷1000, arrondi)', array_column($fiches['skeeball']['out'], 1) === array_map(static fn($w) => (int) round($w / 1000), $band), json_encode($band));
// twin wheel : 12 × 8 cases, gain = produit
$O = [0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 6]; $I = [0.4, 1, 0.6, 1.5, 0.4, 1, 0.6, 2]; $ok = count($fiches['twinwheel']['out']) === 96;
foreach ($O as $a => $x) foreach ($I as $b => $y) if (abs($fiches['twinwheel']['out'][$a * 8 + $b][0] - $x * $y) > 1e-9) $ok = false;
check('twinwheel : 96 lignes = roue extérieure × roue intérieure', $ok);
// dice derby : chances exactes (programmation dynamique sur les positions des 6 chevaux, 4…9 pas)
$N6 = [4, 5, 6, 7, 8, 9]; $memo = [];
$derby = static function (array $pos) use (&$derby, &$memo, $N6): array {
  $key = implode(',', $pos); if (isset($memo[$key])) return $memo[$key];
  $out = array_fill(0, 6, 0.0);
  for ($h = 0; $h < 6; $h++) { if ($pos[$h] + 1 >= $N6[$h]) { $out[$h] += 1 / 6; continue; } $np = $pos; $np[$h]++; $sub = $derby($np); for ($j = 0; $j < 6; $j++) $out[$j] += $sub[$j] / 6; }
  return $memo[$key] = $out;
};
$pd = $derby([0, 0, 0, 0, 0, 0]); $ok = abs(array_sum($fiches['derby']['opts']) - 1) < 1e-9;
foreach ($pd as $h => $p) if (abs($p - $fiches['derby']['opts'][$h]) > 2e-6) $ok = false;
check('derby : chances = loi exacte de la course (±2·10⁻⁶) ' . implode(' ', array_map(static fn($p) => sprintf('%.6f', $p), $pd)), $ok);
check('ladder / dreidel / rpsduel / acerace / fantan : issues équiprobables', count(array_unique(array_column($fiches['ladder']['out'], 1))) === 1 && count(array_unique(array_column($fiches['dreidel']['out'], 1))) === 1
  && count(array_unique(array_column($fiches['rpsduel']['out'], 1))) === 1 && $fiches['acerace']['opts'] === [0.25, 0.25, 0.25, 0.25] && $fiches['fantan']['opts'] === [0.25, 0.25, 0.25, 0.25]);

echo "4) Retour simulé (tirages du serveur) · dessin = gain\n";
foreach ($fiches as $g => $d) {
  $N = 300000; $s = 0.0; $n = $d['type'] === 'pick' ? count($d['opts']) : 0; $bad = 0;
  for ($i = 0; $i < $N; $i++) {
    $r = casino_ext_instant($g, $n ? ['pick' => $i % $n] : []);
    $s += $r['mult'];
    if ($n && ($r['mult'] > 0) !== ($r['view']['w'] === $r['view']['pick'])) $bad++;
    if (!$n && (float) $d['out'][$r['view']['i']][0] !== (float) $r['mult']) $bad++;
  }
  if ($n) { $m2 = 0.0; foreach ($d['opts'] as $p) $m2 += $p * casino_ext_pick_mult($p) ** 2 / $n; } else { $tw = array_sum(array_column($d['out'], 1)); $m2 = 0.0; foreach ($d['out'] as $o) $m2 += $o[0] ** 2 * $o[1] / $tw; }
  $tol = max(0.004, 4 * sqrt($m2) / sqrt($N));
  check(sprintf('%-11s simulé %.2f %%', $g, $s / $N * 100), abs($s / $N - 0.9375) < $tol + 0.003 && $bad === 0, "bad=$bad");
}

echo "5) Argent : une vraie partie retire la mise une fois et verse le gain une fois\n";
$U = 'aaaaaaaa-1111-2222-3333-666666666666';
$db = blank_db();
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_b'] = ['demo' => 500, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$U] = 100.0; $me = $db['users']['u_b'];
foreach ($fiches as $g => $d) {
  $b0 = $bal[$U];
  $r = casino_play(load_db(), $me, $g, 'real', 1, $d['type'] === 'pick' ? ['pick' => 0] : []);
  check("$g : solde = avant − 1 + gain (×" . ($r['mult'] ?? '?') . ')', $r['ok'] === true && abs($bal[$U] - ($b0 - 1 + $r['win'])) < 0.001, json_encode([$b0, $bal[$U], $r['win'] ?? null]));
}
check('choix hors limites refusé', casino_play(load_db(), $me, 'derby', 'real', 1, ['pick' => 6])['ok'] === false && casino_play(load_db(), $me, 'oracle', 'real', 1, [])['ok'] === false);

echo "6) Comet Queen : départ / encaisser / fin secrète (horloge du serveur)\n";
$file = casino_user_file('u_b'); $g = 'cometqueen';
$b0 = $bal[$U];
$r = casino_multi(load_db(), $me, $g, 'start', 'real', 2, []);
check('départ : 2 $ retirés une fois, moment secret caché', $r['ok'] && abs($bal[$U] - ($b0 - 2)) < 0.001 && !isset($r['c']) && isset($r['t0'], $r['rate']), json_encode($r));
$r2 = casino_multi(load_db(), $me, $g, 'start', 'real', 2, []);
check('2e départ pendant la partie : reprise, rien retiré', !empty($r2['resume']) && abs($bal[$U] - ($b0 - 2)) < 0.001);
casino_with($file, static function (array &$st) use ($g) { $st['g'][$g]['c'] = 50.0; $st['g'][$g]['t0'] -= 8.0; return true; });
$want = casino_skill_mult($g, 8.0);
$r = casino_multi(load_db(), $me, $g, 'cash', 'real', 0, ['m' => 999]);
check(sprintf('encaisser : payé ×%.2f (horloge du serveur, pas celle du navigateur)', $r['out'] ?? 0), $r['done'] && $r['why'] === 'cash' && abs($r['out'] - $want) < 0.03 && abs($bal[$U] - ($b0 - 2 + $r['win'])) < 0.001, json_encode($r));
$b1 = $bal[$U]; casino_multi(load_db(), $me, $g, 'cash', 'real', 0, []);
check('2e encaissement : rien de plus', abs($bal[$U] - $b1) < 0.001);
casino_multi(load_db(), $me, $g, 'start', 'real', 1, []);
casino_with($file, static function (array &$st) use ($g) { $st['g'][$g]['t0'] -= 10.0; $st['g'][$g]['c'] = 1.5; return true; });
$b3 = $bal[$U];
$r = casino_multi(load_db(), $me, $g, 'state', 'real', 0, []);
check('la comète s’est écrasée (×1,5 passé) : done, why=end, c révélé', !empty($r['done']) && ($r['why'] ?? '') === 'end' && (float) $r['c'] === 1.5 && abs($bal[$U] - $b3) < 0.001, json_encode($r));
$r = casino_multi(load_db(), $me, $g, 'cash', 'real', 0, []);
check('encaisser après l’écrasement : rien', (float) ($r['win'] ?? 0) === 0.0 && abs($bal[$U] - $b3) < 0.001);
$N = 400000; $s = 0.0; for ($i = 0; $i < $N; $i++) { $c = casino_crash_point(); $s += $c > 2 ? 2 : 0; }
check(sprintf('stratégie « toujours ×2 » : retour %.2f %% (≈ 94)', $s / $N * 100), $s / $N > 0.92 && $s / $N < 0.955);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
