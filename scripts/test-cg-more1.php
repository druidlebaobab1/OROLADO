<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2805 — groupe « more1 » (15 jeux instantanés, liste « Tous les jeux ») : chaque fiche se charge, le retour aux joueurs
 * est entre 93,5 % et 94 % (somme exacte ET simulation), une vraie partie retire la mise une fois et verse le gain une fois.
 * Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_more1_' . bin2hex(random_bytes(4));
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
copy(__DIR__ . '/../casino_ext/more1.php', $tmp . '/casino_ext/more1.php');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$want = ['plinko2', 'goal', 'miniroul', 'keno80', 'thimbles', 'cups', 'highcard', 'reddog', 'war', 'andar', 'teenpatti', 'vpoker', 'colorpred', 'luckydice', 'wheel2'];
$fiches = include __DIR__ . '/../casino_ext/more1.php';
echo "1) Fiches : les 15 jeux se chargent (clé libre, retour ≤ 94,5 %)\n";
$k = casino_ext_keys();
check('15 fiches dans le fichier', array_keys($fiches) === $want, json_encode(array_keys($fiches)));
foreach ($want as $g) check("fiche $g chargée (" . casino_ext_type($g) . ')', in_array($g, $k, true) && !in_array($g, CASINO_GAMES, true));
check('noms affichés', count(array_intersect_key(casino_ext_names(), array_flip($want))) === 15);

echo "2) Retour aux joueurs : somme exacte entre 93,5 % et 94 %, multiplicateur max ≤ 1000\n";
foreach ($fiches as $g => $d) {
  if ($d['type'] === 'table') {
    $w = 0.0; $ev = 0.0; $mx = 0.0;
    foreach ($d['out'] as $o) { $w += $o[1]; $ev += $o[0] * $o[1]; $mx = max($mx, $o[0]); }
    check(sprintf('%-9s table : %.3f %% (max ×%s)', $g, $ev / $w * 100, $mx), $ev / $w >= 0.935 && $ev / $w <= 0.94 + 1e-9 && $mx <= 1000);
  } else {
    foreach ($d['opts'] as $i => $p) { $m = casino_ext_pick_mult($p); check(sprintf('%-9s option %d : ×%.2f → %.3f %%', $g, $i, $m, $p * $m * 100), $p * $m >= 0.935 && $p * $m <= 0.94 + 1e-9); }
  }
}
// tirages exacts attendus par le dessin du navigateur
check('keno80 : poids = hypergéométrique exacte 5 sur 80, 20 tirés', (function () {
  $tot = 316316; $o = include __DIR__ . '/../casino_ext/more1.php'; $ok = true;
  // C(5,h)·C(75,20−h)/C(80,20) calculé en flottant : comparé à poids/316316
  $lc = fn($n, $k) => lgamma_($n + 1) - lgamma_($k + 1) - lgamma_($n - $k + 1);
  foreach ($o['keno80']['out'] as $h => $l) { $p = exp($lc(5, $h) + $lc(75, 20 - $h) - $lc(80, 20)); if (abs($p - $l[1] / $tot) > 1e-6) $ok = false; }
  return $ok;
})());
check('plinko2 : poids = binomiale exacte C(12,k)', array_column($fiches['plinko2']['out'], 1) === [1, 12, 66, 220, 495, 792, 924, 792, 495, 220, 66, 12, 1]);
check('teenpatti : 22 100 mains de 3 cartes', array_sum(array_column($fiches['teenpatti']['out'], 1)) === 22100);
check('vpoker : 2 598 960 mains de 5 cartes', array_sum(array_column($fiches['vpoker']['out'], 1)) === 2598960);
check('reddog : 52·51·50 donnes', array_sum(array_column($fiches['reddog']['out'], 1)) === 132600);
function lgamma_(float $x): float { $s = 0.0; for ($i = 2; $i < $x; $i++) $s += log($i); return $s; }

echo "3) Retour simulé (tirages du serveur)\n";
foreach ($fiches as $g => $d) {
  $N = 400000; $s = 0.0; $n = $d['type'] === 'pick' ? count($d['opts']) : 0; $bad = 0;
  for ($i = 0; $i < $N; $i++) {
    $r = casino_ext_instant($g, $n ? ['pick' => $i % $n] : []);
    $s += $r['mult'];
    if ($n && ($r['mult'] > 0) !== ($r['view']['w'] === $r['view']['pick'])) $bad++;
    if (!$n && (float) $d['out'][$r['view']['i']][0] !== (float) $r['mult']) $bad++;
  }
  // tolérance : écart-type de la moyenne (vpoker / keno ont de gros gains rares)
  $tol = in_array($g, ['vpoker', 'keno80', 'plinko2', 'reddog', 'teenpatti'], true) ? 0.025 : 0.012;
  check(sprintf('%-9s simulé %.2f %% · dessin = gain', $g, $s / $N * 100), abs($s / $N - 0.9375) < $tol && $bad === 0, "bad=$bad");
}

echo "4) Argent : une vraie partie retire la mise une fois et verse le gain une fois\n";
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
check('pick hors limites refusé', casino_play(load_db(), $me, 'miniroul', 'real', 1, ['pick' => 13])['ok'] === false && casino_play(load_db(), $me, 'andar', 'real', 1, [])['ok'] === false);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
