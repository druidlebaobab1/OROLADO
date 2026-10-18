<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2805 — more2 (15 machines à sous, casino_ext/more2.php + js/games/slots2.js) : chaque fiche se charge, le retour
 * aux joueurs est entre 93,5 et 94 % (somme exacte ET simulation), la fréquence de gain entre 25 et 35 %, le gain max
 * entre ×500 et ×1000, les lignes du serveur sont EXACTEMENT celles que le navigateur dessine (ROWS de slots2.js),
 * et une vraie partie bouge l'argent une seule fois. Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_more2_' . bin2hex(random_bytes(4));
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
copy(__DIR__ . '/../casino_ext/more2.php', $tmp . '/casino_ext/more2.php');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$fiche = require __DIR__ . '/../casino_ext/more2.php';
$KEYS = ['candy', 'gatesgold', 'fruitparty', 'bookstars', 'pharaoh', 'spacegems', 'wildwest', 'aztec', 'ocean', 'dragonf', 'panda', 'clover', 'cosmic7', 'diamond', 'jungle'];
// tables dessinées par le navigateur
$js = (string) file_get_contents(__DIR__ . '/../js/games/slots2.js');
$rows = preg_match('~/\*ROWS\*/(\{.*?\})/\*END\*/~s', $js, $m) ? json_decode(preg_replace('/^\s*(\w+):/m', '"$1":', $m[1]), true) : null;

echo "1) Les 15 fiches se chargent (clés libres, retour ≤ 94,5 %)\n";
$k = casino_ext_keys(); sort($k); $want = $KEYS; sort($want);
check('15 jeux chargés', $k === $want, json_encode($k));
foreach ($KEYS as $g) check("$g : type table", casino_ext_type($g) === 'table');
check('tables du navigateur lisibles (ROWS de slots2.js)', is_array($rows) && count($rows) === 15);

echo "2) Le serveur et le navigateur ont les mêmes lignes ; retour exact, fréquence de gain, gain max\n";
foreach ($KEYS as $g) {
  $out = $fiche[$g]['out']; $w = 0; $ev = 0; $hit = 0; $max = 0; $same = is_array($rows[$g] ?? null) && count($rows[$g]) === count($out);
  foreach ($out as $i => $o) { $w += $o[1]; $ev += $o[0] * $o[1]; if ($o[0] > 0) $hit += $o[1]; $max = max($max, $o[0]); if (!$same || abs((float) $rows[$g][$i][0] - (float) $o[0]) > 1e-9) $same = false; }
  check(sprintf('%-10s mêmes multiplicateurs ligne par ligne (%d lignes)', $g, count($out)), $same);
  check(sprintf('%-10s retour exact %.3f %%', $g, $ev / $w * 100), $ev / $w >= 0.935 && $ev / $w <= 0.94);
  check(sprintf('%-10s gain 1 fois sur %.1f (%.1f %%)', $g, $w / $hit, $hit / $w * 100), $hit / $w >= 0.25 && $hit / $w <= 0.35);
  check(sprintf('%-10s gain max ×%s', $g, $max), $max >= 500 && $max <= 1000);
  check(sprintf('%-10s la ligne 0 est la perte', $g), (float) $out[0][0] === 0.0 && ($rows[$g][0] ?? null) === [0]);
}

echo "3) Retour simulé (tirages du serveur)\n";
foreach ($KEYS as $g) {
  $N = 400000; $s = 0.0; $ok = true;
  for ($i = 0; $i < $N; $i++) { $r = casino_ext_instant($g, []); $s += $r['mult']; if ((float) $fiche[$g]['out'][$r['view']['i']][0] !== (float) $r['mult']) $ok = false; }
  check(sprintf('%-10s retour simulé %.2f %% (view.i = la ligne payée)', $g, $s / $N * 100), $ok && $s / $N > 0.90 && $s / $N < 0.97);
}

echo "4) Argent : mise retirée une fois, gain versé une fois\n";
$U = 'aaaaaaaa-1111-2222-3333-555555555555';
$db = blank_db();
$db['users']['u_x'] = ['id' => 'u_x', 'email' => 'x@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_x'] = ['demo' => 500, 'real' => 50];
save_db(orolado_data_file(), $db); $bal[$U] = 50.0; $me = $db['users']['u_x'];
$wins = 0;
foreach ($KEYS as $g) {
  $b0 = $bal[$U];
  $r = casino_play(load_db(), $me, $g, 'real', 1, []);
  $wins += $r['win'] > 0 ? 1 : 0;
  check("$g : partie jouée, solde = avant − 1 + gain", $r['ok'] === true && abs($bal[$U] - ($b0 - 1 + $r['win'])) < 0.001 && abs($r['win'] - round($r['mult'], 2)) < 0.001 && isset($r['view']['i']), json_encode([$r['mult'] ?? null, $r['win'] ?? null, $bal[$U]]));
}
check('mise trop petite refusée', casino_play(load_db(), $me, 'candy', 'real', 0.01, [])['ok'] === false);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
