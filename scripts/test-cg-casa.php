<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * casa (round 6) — 24 nouveaux jeux Casino : 12 machines à sous (casa1.js) + 12 jeux instantanés (casa2/3.js) : chaque fiche se charge, le retour aux joueurs
 * est entre 93,5 % et 94 % (somme exacte ET simulation), les tables recalculées (dés, binomiale, machines à sous) sont exactes,
 * une vraie partie retire la mise une fois et verse le gain une fois.
 * Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_casa_' . bin2hex(random_bytes(4));
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
copy(__DIR__ . '/../casino_ext/casa.php', $tmp . '/casino_ext/casa.php');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$fiches = include __DIR__ . '/../casino_ext/casa.php';
$slots = ['scarab', 'kraken', 'donut', 'cherrybar', 'ufo', 'koi', 'goldtrain', 'viking', 'safari', 'rubymine', 'pumpkin', 'medusa'];
$inst = ['scratchwin', 'pickbox', 'ladder', 'hilorun', 'envelope', 'treasure', 'flip21', 'popdarts', 'egghunt', 'shells', 'colorwheel', 'luckyten'];
$want = array_merge($slots, $inst);
echo "1) Fiches : les 24 jeux se chargent (clé libre, retour ≤ 94,5 %)\n";
$k = casino_ext_keys();
check('24 fiches casa', array_keys($fiches) === $want, json_encode(array_keys($fiches)));
foreach ($want as $g) check("fiche $g chargée (" . casino_ext_type($g) . ')', in_array($g, $k, true) && !in_array($g, CASINO_GAMES, true));
check('noms affichés', count(array_intersect_key(casino_ext_names(), array_flip($want))) === 24);
$others = [];
foreach (glob(__DIR__ . '/../casino_ext/*.php') as $f) { if (preg_match('/casa\.php$/', $f)) continue; $others += (array) include $f; }
check('aucune clé déjà prise par un autre groupe', !array_intersect($want, array_keys($others)), json_encode(array_values(array_intersect($want, array_keys($others)))));

echo "2) Retour aux joueurs : somme exacte entre 93,5 % et 94 %, multiplicateur max ≤ 1000\n";
foreach ($fiches as $g => $d) {
  if ($d['type'] === 'table') {
    $w = 0.0; $ev = 0.0; $mx = 0.0; $hit = 0.0;
    foreach ($d['out'] as $o) { $w += $o[1]; $ev += $o[0] * $o[1]; $mx = max($mx, $o[0]); if ($o[0] > 0) $hit += $o[1]; }
    check(sprintf('%-10s table : %.3f %% (gagne %.1f %% des parties, max ×%s, %d lignes)', $g, $ev / $w * 100, $hit / $w * 100, $mx, count($d['out'])), $ev / $w >= 0.935 && $ev / $w <= 0.94 + 1e-9 && $mx <= 1000 && $d['out'][0][1] > 0);
  } else {
    foreach ($d['opts'] as $i => $p) { $m = casino_ext_pick_mult($p); check(sprintf('%-10s option %d : ×%.2f → %.3f %%', $g, $i, $m, $p * $m * 100), $p * $m >= 0.935 && $p * $m <= 0.94 + 1e-9); }
  }
}

echo "3) Tables exactes et lignes identiques au navigateur\n";
// Lucky 21 : 3 cartes (13 rangs, As = 11 ou 1, figures 10) → 2 197 tirages
$c = ['x' => 0, 18 => 0, 19 => 0, 20 => 0, 21 => 0, '777' => 0];
for ($a = 1; $a <= 13; $a++) for ($b = 1; $b <= 13; $b++) for ($e = 1; $e <= 13; $e++) {
  $t = 0; $ace = 0; foreach ([$a, $b, $e] as $r) { if ($r === 1) { $t += 11; $ace++; } else $t += min(10, $r); } while ($t > 21 && $ace) { $t -= 10; $ace--; }
  if ($a === 7 && $b === 7 && $e === 7) $c['777']++; elseif ($t >= 18 && $t <= 21) $c[$t]++; else $c['x']++;
}
check('flip21 : poids = 2 197 tirages exacts (perdu, 18, 19, 20, 21, 7-7-7)', array_column($fiches['flip21']['out'], 1) === array_values($c), json_encode($c));
// Hi-Lo Run : 6 cartes, montées d'affilée depuis la 1re ; P(≥ k) = C(13, k+1) / 13^(k+1)
$C = function ($n, $kk) { $r = 1; for ($i = 1; $i <= $kk; $i++) $r = $r * ($n - $kk + $i) / $i; return $r; };
$hl = []; for ($kk = 0; $kk <= 5; $kk++) { $ge = $kk ? $C(13, $kk + 1) * 13 ** (5 - $kk) : 13 ** 6; $ge2 = $kk < 5 ? $C(13, $kk + 2) * 13 ** (4 - $kk) : 0; $hl[] = (int) round($ge - $ge2); }
check('hilorun : poids = 13⁶ suites exactes', array_column($fiches['hilorun']['out'], 1) === $hl, json_encode($hl));
// machines à sous : la liste des lignes de js/games/casa1.js (même règle) = celle du serveur, et chaque ligne se dessine
$js = shell_exec('node ' . escapeshellarg(__DIR__ . '/test-cg-casa-grids.js') . ' 40 2>&1');
$J = json_decode((string) $js, true);
check('casa1.js : chaque ligne de chaque machine se dessine exactement (40 grilles par ligne)', is_array($J) && $J['bad'] === 0, substr((string) $js, 0, 200));
foreach ($slots as $g) check("$g : lignes du navigateur = lignes du serveur (" . count($fiches[$g]['out']) . ')', is_array($J) && array_map('floatval', $J['rows'][$g] ?? []) === array_map('floatval', array_column($fiches[$g]['out'], 0)));

// jeux instantanés : les gains dessinés par casa2.js / casa3.js = ceux du serveur
$J2 = file_get_contents(__DIR__ . '/../js/games/casa2.js') . file_get_contents(__DIR__ . '/../js/games/casa3.js');
$arr = function (string $name) use ($J2) { // the array literal after « NAME = » (brackets balanced)
  if (!preg_match('/(?:var |, )' . $name . ' = \[/', $J2, $m, PREG_OFFSET_CAPTURE)) return null;
  $i = $m[0][1] + strlen($m[0][0]) - 1; $d = 0;
  for ($j = $i; $j < strlen($J2); $j++) { if ($J2[$j] === '[') $d++; elseif ($J2[$j] === ']' && --$d === 0) return json_decode(substr($J2, $i, $j - $i + 1), true); }
  return null;
};
foreach (['scratchwin' => 'SW', 'pickbox' => 'PB', 'ladder' => 'LD', 'hilorun' => 'HL', 'flip21' => 'F21', 'popdarts' => 'PD', 'egghunt' => 'EGM'] as $g => $v)
  check("$g : gains du navigateur ($v) = gains du serveur", array_map('floatval', (array) $arr($v)) === array_map('floatval', array_column($fiches[$g]['out'], 0)), json_encode($arr($v)));
$env = $arr('ENV');
check('envelope : chaque trio du navigateur fait le gain du serveur', is_array($env) && array_map(fn($t) => round(array_sum($t), 2), $env) === array_map('floatval', array_column($fiches['envelope']['out'], 0)));
$eg = $arr('EG');
check('egghunt : œufs (argent, or) dans le même ordre', is_array($eg) && count($eg) === count($fiches['egghunt']['out']));
check('pick : ×2.34 · ×3.13 · ×4.69 · ×9.39 | ×3.76 | ×2.08 · ×3.13 · ×4.69 · ×18.79 | ×9.39 (comme affichés)',
  array_map('casino_ext_pick_mult', $fiches['treasure']['opts']) === [2.34, 3.13, 4.69, 9.39] && casino_ext_pick_mult(0.25) === 3.76
  && array_map('casino_ext_pick_mult', $fiches['colorwheel']['opts']) === [2.08, 3.13, 4.69, 18.79] && casino_ext_pick_mult($fiches['luckyten']['opts'][0]) === 9.39);

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
  check(sprintf('%-9s simulé %.2f %%', $g, $s / $N * 100), $s / $N < 0.94 + $tol && $s / $N > 0.93 - $tol && $bad === 0, "bad=$bad");
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
check('choix hors limites refusé', casino_play(load_db(), $me, 'treasure', 'real', 1, ['pick' => 4])['ok'] === false && casino_play(load_db(), $me, 'luckyten', 'real', 1, [])['ok'] === false && casino_play(load_db(), $me, 'shells', 'real', 1, ['pick' => 'x'])['ok'] === false);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
