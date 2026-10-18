<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2795 — jeux rapides refaits (Dice, Coin Flip, Target, Hi-Lo, Penalty) : Hi-Lo « Passer » (comme Spribe),
 * Dice classique (Roll Under / Roll Over) : retour exact 94 %. Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_cgq_' . bin2hex(random_bytes(4));
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

echo "1) Dice classique : retour exact ≤ 94 % pour chaque chance, dessin = gain\n";
$worst = 0.0;
for ($c = 2; $c <= 95; $c++) { $ev = $c / 100 * floor(CASINO_EDGE * 100 / $c * 10000) / 10000; $worst = max($worst, $ev); }
check('Dice : retour exact max ' . round($worst * 100, 3) . ' %', $worst <= 0.9400001 && $worst > 0.939);
$bad = 0;
for ($i = 0; $i < 20000; $i++) {
  $c = random_int(2, 95); $o = random_int(0, 1);
  $r = casino_instant('dice', ['chance' => $c, 'over' => $o], 1);
  $v = $r['view']; $w = $o ? $v['roll'] >= 100 - $c : $v['roll'] < $c;
  if ($w !== ($r['mult'] > 0) || $v['c'] !== $c || $v['roll'] < 0 || $v['roll'] > 99.99) $bad++;
}
check('Dice : le nombre tiré correspond toujours au gain (Roll Under / Roll Over)', $bad === 0, "$bad");

echo "2) Hi-Lo « Passer »\n";
$U = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_cs'] = ['id' => 'u_cs', 'email' => 'cs@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_cs'] = ['demo' => 500, 'real' => 20];
save_db(orolado_data_file(), $db);
$bal[$U] = 20.0;
$me = load_db()['users']['u_cs'];
$s = casino_multi(load_db(), $me, 'hilo', 'start', 'real', 1, []);
check('départ : mise retirée, aucune carte passée', $s['ok'] && $bal[$U] == 19.0 && $s['sk'] === [] && count($s['cards']) === 1);
$k = casino_multi(load_db(), $me, 'hilo', 'skip', 'real', 0, []);
check('passer : nouvelle carte, multiplicateur et argent inchangés', $k['ok'] && count($k['cards']) === 2 && $k['sk'] === [1] && $k['k'] === 0 && $k['mult'] == 1.0 && $bal[$U] == 19.0 && $k['card'] === $k['cards'][1]);
check('passer : multiplicateurs recalculés pour la nouvelle carte', $k['hiMult'] == casino_hilo_mult($k['card'], true) && $k['loMult'] == casino_hilo_mult($k['card'], false));
$c = casino_multi(load_db(), $me, 'hilo', 'cash', 'real', 0, []);
check('encaisser après avoir seulement passé : refusé', $c['ok'] === false && $bal[$U] == 19.0);
for ($i = 0; $i < 29; $i++) casino_multi(load_db(), $me, 'hilo', 'skip', 'real', 0, []);
$k = casino_multi(load_db(), $me, 'hilo', 'skip', 'real', 0, []);
check('31e carte passée : refusé (30 max)', $k['ok'] === false);
// on joue jusqu'à la fin de la partie (perte ou encaissement)
$guard = 0; $g = casino_multi(load_db(), $me, 'hilo', 'state', 'real', 0, []);
while (empty($g['done']) && $guard++ < 50) {
  if ($g['k'] >= 2) { $g = casino_multi(load_db(), $me, 'hilo', 'cash', 'real', 0, []); break; }
  $g = casino_multi(load_db(), $me, 'hilo', 'guess', 'real', 0, ['hi' => $g['card'] <= 7 ? 1 : 0]);
}
check('partie terminée (perdue ou encaissée), cartes passées toujours listées', !empty($g['done']) && count($g['sk']) === 30, json_encode(['done' => $g['done'] ?? null, 'sk' => count($g['sk'] ?? [])]));
$k = casino_multi(load_db(), $me, 'hilo', 'skip', 'real', 0, []);
check('passer après la fin : rien ne change', ($k['ok'] ?? false) === true && !empty($k['done']) && count($k['cards']) === count($g['cards']));
$b0 = $bal[$U];
$s = casino_multi(load_db(), $me, 'hilo', 'start', 'real', 1, []);
check('nouvelle partie : compteur de cartes passées remis à zéro', $s['ok'] && $s['sk'] === [] && $bal[$U] == $b0 - 1.0);

echo "3) Penalty : échelle publique (8 tirs)\n";
$p = casino_multi(load_db(), $me, 'penalty', 'start', 'real', 1, []);
check('départ : échelle ×1,44 → ×24,60, 8 tirs', $p['ok'] && count($p['ladder']) === 8 && abs($p['ladder'][7] - 24.6) < 0.001 && $p['next'] == 1.44);
$t = casino_multi(load_db(), $me, 'penalty', 'shoot', 'real', 0, ['aim' => 2, 'h' => 0]);
check('tir : [visée, hauteur, gardien, but] enregistré', $t['ok'] && count($t['shots']) === 1 && $t['shots'][0][0] === 2 && in_array($t['shots'][0][2], [0, 1, 2], true) && $t['shots'][0][3] === ($t['shots'][0][2] !== 2 ? 1 : 0));
if (empty($t['done'])) casino_multi(load_db(), $me, 'penalty', 'cash', 'real', 0, []);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
