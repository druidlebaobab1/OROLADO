<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Bonus dépôt de la semaine (bonus_lib.php) : activation, dépôt de 100 $ ou plus, +1 $ par 30 $ misés,
 * jusqu'à +10 %, 7 jours, une fois par semaine, pas de cumul avec le cadeau d'ami, jamais versé deux fois.
 * Faux Supabase, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_bonus_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'bonus_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$credits = [];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$credits) {
  if (str_contains($url, '/rpc/resolve_trade')) {
    $b = json_decode((string) $body, true) ?: [];
    $k = $b['p_user'] . '|' . $b['p_order'];
    if (!isset($credits[$k])) $credits[$k] = (float) $b['p_amount'];
    $mine = 0.0;
    foreach ($credits as $kk => $v) if (str_starts_with($kk, $b['p_user'] . '|')) $mine += $v;
    return ['ok' => true, 'real' => $mine];
  }
  return [];
};
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/bonus_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
function bsum(array $credits, string $uuid): float { $s = 0.0; foreach ($credits as $k => $v) if (str_starts_with($k, $uuid . '|adm_bon_')) $s += $v; return round($s, 2); }
$n = 0;
function dep(string $uid, float $amount, int $ts, string $op = 'flutterwave'): string {
  global $n; $n++;
  $db = load_db();
  $id = ($op === 'admin' ? 'adm_' : 'flw_') . 'b' . $n;
  $db['deposits'][] = ['id' => $id, 'ref' => $id, 'userId' => $uid, 'amount' => $amount, 'status' => 'COMPLETED', 'operator' => $op, 'createdAt' => date('c', $ts), 'paidAt' => date('c', $ts)];
  save_db(orolado_data_file(), $db);
  return $id;
}
function play(string $uid, float $stake, int $ts, string $mode = 'real', int $count = 1): void {
  global $n;
  $db = load_db();
  for ($i = 0; $i < $count; $i++) { $n++; $db['orders'][] = ['id' => 'ob' . $n, 'userId' => $uid, 'mode' => $mode, 'stake' => $stake, 'status' => $i % 2 ? 'lost' : 'won', 'openedAt' => $ts + $i, 'at' => $ts + $i, 'settledAt' => $ts + $i + 5, 'net' => 0]; }
  save_db(orolado_data_file(), $db);
}

$A = 'aaaaaaaa-1111-2222-3333-444444444444';
$B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin'];
$db['users']['u_jo'] = ['id' => 'u_jo', 'email' => 'jo@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_ami'] = ['id' => 'u_ami', 'email' => 'ami@gmail.com', 'role' => 'user', 'sbId' => $B];
$db['vault']['admin_master'] = ['demo' => 1000, 'real' => 0];
$db['vault']['u_jo'] = ['demo' => 1000000, 'real' => 0];
$db['vault']['u_ami'] = ['demo' => 1000000, 'real' => 0];
save_db(orolado_data_file(), $db);
$jo = $db['users']['u_jo'];

echo "1) Fermé aux joueurs tant que ce n'est pas ouvert à tous\n";
check('joueur normal : pas de bonus', empty(orolado_bonus_status(load_db(), $jo, true)['enabled']));
putenv('OROLADO_BONUS_PUBLIC=1');

echo "2) Activation et dépôt\n";
$now = time();
dep('u_jo', 500, $now - 60);
$r = orolado_bonus_status(load_db(), $jo, true);
check('activé, en attente du dépôt (le dépôt fait AVANT l\'activation ne compte pas)', $r['phase'] === 'waiting', $r['phase']);
dep('u_jo', 90, $now + 1);
$r = orolado_bonus_status(load_db(), $jo);
check('dépôt de 90 $ : pas assez (100 $ minimum)', $r['phase'] === 'waiting');
dep('u_jo', 200, $now + 2);
$r = orolado_bonus_status(load_db(), $jo);
check('dépôt de 200 $ : bonus de +20 $ à remplir', $r['phase'] === 'filling' && abs($r['target'] - 20) < 0.001, json_encode($r));
check('7 jours pour le remplir', $r['until'] === $now + 2 + 7 * 86400);

echo "3) Le bonus se remplit en jouant : +1 \$ par 30 \$ misés\n";
play('u_jo', 10, $now - 30, 'real', 3);
play('u_jo', 10, $now + 10, 'demo', 30);
$r = orolado_bonus_status(load_db(), $jo);
check('trades avant le dépôt et trades démo : ne comptent pas', $r['credited'] < 0.01 && $r['staked'] < 0.01, (string) $r['staked']);
play('u_jo', 10, $now + 20, 'real', 15);
$r = orolado_bonus_status(load_db(), $jo);
check('150 $ misés → +5 $', abs($r['credited'] - 5) < 0.001 && abs(bsum($credits, $A) - 5) < 0.001, $r['credited'] . ' / ' . bsum($credits, $A));
for ($i = 0; $i < 4; $i++) orolado_bonus_status(load_db(), $jo);
check('lu 4 fois de plus : toujours +5 $ (jamais en double)', abs(bsum($credits, $A) - 5) < 0.001);
$d = load_db();
$rows = array_values(array_filter($d['deposits'], fn($x) => str_starts_with((string) $x['id'], 'adm_bon_')));
check('rangé comme bonus « Bonus dépôt » (à jouer ×2)', count($rows) === 1 && $rows[0]['operator'] === 'admin' && $rows[0]['note'] === 'Bonus dépôt');

echo "4) Trades archivés : toujours comptés\n";
$d = load_db();
$keep = []; $arch = [];
foreach ($d['orders'] as $o) { if ($o['userId'] === 'u_jo') $arch[] = json_encode($o); else $keep[] = $o; }
file_put_contents($tmp . '/data/archive/orders-' . date('Y-m', $now) . '.jsonl', implode("\n", $arch) . "\n");
$d['orders'] = $keep;
save_db(orolado_data_file(), $d);
play('u_jo', 30, $now + 100, 'real', 10);
orolado_bonus_with('u_jo', function (&$st) { foreach ($st['weeks'] as $k => $w) { $st['weeks'][$k]['scanAt'] = time() - 2 * 86400; $st['weeks'][$k]['seen'] = []; $st['weeks'][$k]['staked'] = 0; } });
$r = orolado_bonus_status(load_db(), $jo);
check('150 $ archivés + 300 $ nouveaux = 450 $ → +15 $', abs($r['credited'] - 15) < 0.001 && abs(bsum($credits, $A) - 15) < 0.001, $r['staked'] . ' → ' . $r['credited']);

echo "5) Bonus plein, puis plus rien\n";
play('u_jo', 50, $now + 200, 'real', 10);
$r = orolado_bonus_status(load_db(), $jo);
check('bonus plein : +20 $ au total', $r['phase'] === 'full' && abs(bsum($credits, $A) - 20) < 0.001, (string) bsum($credits, $A));
play('u_jo', 100, $now + 300, 'real', 10);
orolado_bonus_status(load_db(), $jo);
check('on continue à jouer : pas plus de 20 $', abs(bsum($credits, $A) - 20) < 0.001);
$r = orolado_bonus_status(load_db(), $jo, true);
check('réactiver la même semaine : rien ne change (une fois par semaine)', $r['phase'] === 'full' && abs($r['target'] - 20) < 0.001);
dep('u_jo', 1000, $now + 400);
orolado_bonus_status(load_db(), $jo);
check('2e gros dépôt la même semaine : pas de 2e bonus', abs(bsum($credits, $A) - 20) < 0.001);

echo "6) Ami invité : son 1er dépôt a déjà le cadeau de +5 %, il ne donne pas le bonus dépôt (v2426)\n";
orolado_aff_with(orolado_aff_inv_name('u_ami'), function (&$st) { $st = ['inviter' => 'u_jo', 'at' => date('c'), 'friendPaid' => true, 'friendGift' => 10.0, 'deps' => []]; });
$ami = load_db()['users']['u_ami'];
orolado_bonus_status(load_db(), $ami, true);
dep('u_ami', 200, $now + 5);
$r = orolado_bonus_status(load_db(), $ami);
check('1er dépôt de 200 $ d\'un ami invité : pas de bonus dépôt (il a déjà +5 %)', $r['phase'] === 'waiting' && $r['target'] < 0.01, $r['phase'] . ' ' . $r['target']);
dep('u_ami', 150, $now + 6);
$r = orolado_bonus_status(load_db(), $ami);
check('2e dépôt de 150 $ la même semaine : bonus +15 $', $r['phase'] === 'filling' && abs($r['target'] - 15) < 0.001, $r['phase'] . ' ' . $r['target']);

echo "7) Après 7 jours : les trades ne comptent plus\n";
$e = 'eeeeeeee-1111-2222-3333-444444444444';
$d = load_db();
$d['users']['u_lent'] = ['id' => 'u_lent', 'email' => 'lent@gmail.com', 'role' => 'user', 'sbId' => $e];
save_db(orolado_data_file(), $d);
$lent = load_db()['users']['u_lent'];
orolado_bonus_status(load_db(), $lent, true);
dep('u_lent', 100, $now + 3);
orolado_bonus_status(load_db(), $lent);
orolado_bonus_with('u_lent', function (&$st) { foreach ($st['weeks'] as $k => $w) { $st['weeks'][$k]['until'] = time() - 10; } });
play('u_lent', 30, $now + 50, 'real', 10);
$r = orolado_bonus_status(load_db(), $lent);
check('délai dépassé : rien de versé, bonus expiré', bsum($credits, $e) < 0.01 && $r['phase'] === 'expired', $r['phase']);

echo "8) Compte admin (test) : dépôt simulé, bonus sur la démo\n";
putenv('OROLADO_BONUS_PUBLIC=0');
$adm = load_db()['users']['admin_master'];
orolado_bonus_status(load_db(), $adm, true);
check('dépôt simulé de 150 $', orolado_bonus_test_deposit($adm, 150));
$demo0 = (float) load_db()['vault']['admin_master']['demo'];
play('admin_master', 10, time() + 2, 'demo', 9);
$r = orolado_bonus_status(load_db(), $adm);
check('90 $ misés en démo → +3 $ sur la démo (cible +15 $)', abs($r['target'] - 15) < 0.001 && abs((float) load_db()['vault']['admin_master']['demo'] - $demo0 - 3) < 0.001, $r['credited'] . ' / ' . $r['target']);

echo "9) Bonus commencé en fin de semaine : il continue de se remplir après lundi (v2426)\n";
putenv('OROLADO_BONUS_PUBLIC=1');
$s9 = 'ffffffff-1111-2222-3333-444444444444';
$d = load_db();
$d['users']['u_sam'] = ['id' => 'u_sam', 'email' => 'sam@gmail.com', 'role' => 'user', 'sbId' => $s9];
save_db(orolado_data_file(), $d);
$sam = load_db()['users']['u_sam'];
$wkNow = orolado_bonus_week(time());
$prev = orolado_bonus_week($wkNow['start'] - 3600);
$satTs = $prev['end'] - 36 * 3600;
$depSam = dep('u_sam', 200, $satTs);
orolado_bonus_with('u_sam', static function (&$st) use ($prev, $satTs, $depSam) {
  $st['weeks'][$prev['key']] = ['activatedAt' => $satTs - 60, 'weekEnd' => $prev['end'], 'depositId' => $depSam, 'depositAmount' => 200,
    'depositTs' => $satTs, 'target' => 20, 'credited' => 0, 'staked' => 0, 'until' => $satTs + 7 * 86400];
});
play('u_sam', 30, $wkNow['start'] + 600, 'real', 10);
$r = orolado_bonus_status(load_db(), $sam);
check('dépôt samedi, 300 $ joués lundi → +10 $ versés, bonus toujours affiché', $r['phase'] === 'filling' && abs(bsum($credits, $s9) - 10) < 0.001, $r['phase'] . ' ' . bsum($credits, $s9));
$r = orolado_bonus_status(load_db(), $sam, true);
check('pas de 2e bonus tant que le premier se remplit (les mêmes mises ne comptent pas deux fois)', $r['phase'] === 'filling' && abs($r['target'] - 20) < 0.001, $r['phase'] . ' ' . $r['target']);
dep('u_sam', 500, time() + 5);
play('u_sam', 30, time() + 10, 'real', 10);
orolado_bonus_status(load_db(), $sam);
check('nouveau dépôt pendant ce temps : seulement le 1er bonus avance (+20 $ au total, pas plus)', abs(bsum($credits, $s9) - 20) < 0.001, (string) bsum($credits, $s9));

echo "\n" . ($fail === 0 ? "TOUT EST BON" : "PROBLÈME") . " : $pass OK, $fail échec(s)\n";
exit($fail === 0 ? 0 : 1);
