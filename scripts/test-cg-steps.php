<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2795 — jeux en plusieurs étapes refaits (Mines, Tour, Verger, Ballon) : Mines accepte 1 à 24 mines (comme Spribe),
 * chaque nombre de mines rend ≤ 94 % (même calcul), mines cachées, gain = mise × multiplicateur, plafond = fin automatique.
 * Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_cgsteps_' . bin2hex(random_bytes(4));
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

echo "1) Mines : retour exact pour 1 à 24 mines et chaque nombre de cases (≤ 94 %)\n";
$worst = 1.0; $best = 0.0;
for ($m = 1; $m <= 24; $m++) for ($k = 1; $k <= 25 - $m; $k++) {
  $p = 1.0; for ($j = 0; $j < $k; $j++) $p *= (25 - $m - $j) / (25 - $j);
  $ev = $p * casino_mines_mult($m, $k); $worst = min($worst, $ev); $best = max($best, $ev);
}
check(sprintf('toutes les combinaisons rendent entre %.2f %% et %.2f %%', $worst * 100, $best * 100), $best <= 0.94 + 1e-9 && $worst > 0.9);
check('24 mines, 1 case : ×23,50', abs(casino_mines_mult(24, 1) - 23.5) < 0.001);

echo "2) Mines : partie réelle avec 1, 5, 20, 24 mines\n";
$U = 'aaaaaaaa-1111-2222-3333-555555555555';
$db = blank_db();
$db['users']['u_st'] = ['id' => 'u_st', 'email' => 'st@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 0];
$db['vault']['u_st'] = ['demo' => 0, 'real' => 1000];
save_db(orolado_data_file(), $db);
$bal[$U] = 1000.0;
$me = load_db()['users']['u_st'];
$file = casino_user_file('u_st');
foreach ([1, 5, 20, 24] as $m) {
  $b0 = $bal[$U];
  $s = casino_multi(load_db(), $me, 'mines', 'start', 'real', 1, ['mines' => $m]);
  check("$m mine(s) : départ accepté, mines cachées", $s['ok'] && $s['m'] === $m && !isset($s['mines']) && abs($bal[$U] - ($b0 - 1)) < 0.001, json_encode($s));
  $mines = casino_with($file, fn(array &$st) => $st['g']['mines']['mines']);
  check("$m mine(s) : le serveur en cache exactement $m", count($mines) === $m && count(array_unique($mines)) === $m);
  $safe = array_values(array_diff(range(0, 24), $mines));
  $o = casino_multi(load_db(), $me, 'mines', 'open', 'real', 0, ['cell' => $safe[0]]);
  if ($m === 24) {
    check('24 mines : la seule case sûre termine et paie ×23,50', $o['done'] && abs($o['win'] - 23.5) < 0.001 && abs($bal[$U] - ($b0 - 1 + 23.5)) < 0.001, json_encode($o));
    continue;
  }
  check("$m mine(s) : 1re case sûre, suivante ×" . $o['next'], $o['ok'] && !$o['done'] && abs($o['mult'] - casino_mines_mult($m, 1)) < 0.001 && abs($o['next'] - casino_mines_mult($m, 2)) < 0.001);
  $c = casino_multi(load_db(), $me, 'mines', 'cash', 'real', 0, []);
  check("$m mine(s) : encaisser paie mise × multiplicateur et montre les mines", $c['done'] && abs($c['win'] - casino_mines_mult($m, 1)) < 0.001 && count($c['mines']) === $m && abs($bal[$U] - ($b0 - 1 + $c['win'])) < 0.001);
}
$s = casino_multi(load_db(), $me, 'mines', 'start', 'real', 1, ['mines' => 99]);
check('99 mines demandées : ramené à 24', $s['ok'] && $s['m'] === 24);
casino_with($file, function (array &$st) { unset($st['g']['mines']); return true; });
$s = casino_multi(load_db(), $me, 'mines', 'start', 'real', 1, ['mines' => 0]);
check('0 mine demandée : ramené à 1', $s['ok'] && $s['m'] === 1);
$mines = casino_with($file, fn(array &$st) => $st['g']['mines']['mines']);
$o = casino_multi(load_db(), $me, 'mines', 'open', 'real', 0, ['cell' => $mines[0]]);
check('mine touchée : perdu, toutes les mines montrées', $o['done'] && $o['win'] == 0.0 && $o['boom'] === $mines[0] && $o['mines'] === $mines);

echo "3) Mines : plafond de gain → fin automatique\n";
$bal[$U] = 1000.0; $db = load_db(); $db['vault']['u_st']['real'] = 1000; save_db(orolado_data_file(), $db);
$b0 = $bal[$U];
$s = casino_multi(load_db(), $me, 'mines', 'start', 'real', 1000, ['mines' => 20]);
$mines = casino_with($file, fn(array &$st) => $st['g']['mines']['mines']);
$safe = array_values(array_diff(range(0, 24), $mines));
$o = casino_multi(load_db(), $me, 'mines', 'open', 'real', 0, ['cell' => $safe[0]]);
$o = $o['done'] ? $o : casino_multi(load_db(), $me, 'mines', 'open', 'real', 0, ['cell' => $safe[1]]);
check('20 mines à 1000 $ : terminé et payé au plafond', $o['done'] && abs($o['win'] - CASINO_MAX_WIN) < 0.001 && abs($bal[$U] - ($b0 - 1000 + CASINO_MAX_WIN)) < 0.001, json_encode([$o['win'], $o['done']]));

echo "4) Tour, Verger, Ballon : échelles inchangées (94 %)\n";
for ($k = 1; $k <= CASINO_TOWER_ROWS; $k++) { $ev = pow(2 / 3, $k) * casino_tower_mult($k); if ($ev > 0.94 + 1e-9) check("tour $k", false); }
check('tour : chaque étage rend ≤ 94 %', true);
for ($lv = 1; $lv <= 4; $lv++) { $mx = 0; for ($k = 1; $k <= CASINO_APPLE_ROWS; $k++) $mx = max($mx, pow((5 - $lv) / 5, $k) * casino_apple_mult($k, $lv)); check("verger niveau $lv : ≤ 94 %", $mx <= 0.94 + 1e-9, (string) round($mx * 100, 2)); }
$mx = 0; for ($k = 1; $k <= 60; $k++) $mx = max($mx, pow(0.9, $k) * casino_balloon_mult($k));
check('ballon : chaque souffle rend ≤ 94 %', $mx <= 0.94 + 1e-9);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
