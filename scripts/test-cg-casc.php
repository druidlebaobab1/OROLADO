<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * casc (round 7) — 24 jeux Casino de plus : 12 machines à sous (casc1.js) + 12 jeux instantanés (casc2/3.js) : chaque fiche se charge, le retour aux joueurs
 * est entre 93,5 % et 94 % (somme exacte ET simulation), les tables recalculées (dés, binomiale, machines à sous) sont exactes,
 * une vraie partie retire la mise une fois et verse le gain une fois.
 * Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_casc_' . bin2hex(random_bytes(4));
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
copy(__DIR__ . '/../casino_ext/casc.php', $tmp . '/casino_ext/casc.php');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$fiches = include __DIR__ . '/../casino_ext/casc.php';
$slots = ['samurai', 'mermaid', 'carnival', 'jazzclub', 'oasis', 'arctic', 'steampunk', 'cybercity', 'fairy', 'dinopark', 'sushibar', 'disco'];
$inst = array_values(array_diff(array_keys($fiches), $slots));
$want = array_merge($slots, $inst);
echo "1) Fiches : les jeux casc se chargent (clé libre, retour ≤ 94,5 %)\n";
$k = casino_ext_keys();
check(count($want) . ' fiches casc (12 machines + ' . count($inst) . ' instantanés)', array_keys($fiches) === $want && count($slots) === 12, json_encode(array_keys($fiches)));
foreach ($want as $g) check("fiche $g chargée (" . casino_ext_type($g) . ')', in_array($g, $k, true) && !in_array($g, CASINO_GAMES, true));
check('noms affichés', count(array_intersect_key(casino_ext_names(), array_flip($want))) === count($want));
$others = [];
foreach (glob(__DIR__ . '/../casino_ext/*.php') as $f) { if (preg_match('/casc\.php$/', $f)) continue; $others += (array) include $f; }
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
/*@INSTANT_EXACT@*/
// machines à sous : la liste des lignes de js/games/casa1.js (même règle) = celle du serveur, et chaque ligne se dessine
$js = shell_exec('node ' . escapeshellarg(__DIR__ . '/test-cg-casc-grids.js') . ' 40 2>&1');
$J = json_decode((string) $js, true);
check('casc1.js : chaque ligne de chaque machine se dessine exactement (40 grilles par ligne)', is_array($J) && $J['bad'] === 0, substr((string) $js, 0, 200));
foreach ($slots as $g) check("$g : lignes du navigateur = lignes du serveur (" . count($fiches[$g]['out']) . ')', is_array($J) && array_map('floatval', $J['rows'][$g] ?? []) === array_map('floatval', array_column($fiches[$g]['out'], 0)));

/*@INSTANT_JS@*/
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
/*@PICK_REFUSE@*/

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
