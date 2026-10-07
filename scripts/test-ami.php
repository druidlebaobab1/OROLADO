<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Inviter un ami (aff_lib.php) : l'ami reçoit 5 % de son 1er dépôt (à miser ×2), celui qui invite
 * reçoit 5 % de chaque dépôt de l'ami pendant 365 jours (libre). Jamais de double paiement.
 * Faux Supabase, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_ami_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
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

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
function sum_for(array $credits, string $uuid, string $prefix = ''): float {
  $s = 0.0;
  foreach ($credits as $k => $v) if (str_starts_with($k, $uuid . '|' . $prefix)) $s += $v;
  return round($s, 2);
}
function deposit(string $uid, float $amount, string $op = 'flutterwave', ?string $when = null): void {
  $db = load_db();
  $id = ($op === 'admin' ? 'adm_' : 'flw_') . bin2hex(random_bytes(5));
  $db['deposits'][] = ['id' => $id, 'ref' => $id, 'userId' => $uid, 'amount' => $amount, 'status' => 'COMPLETED', 'operator' => $op, 'createdAt' => $when ?? date('c'), 'paidAt' => $when ?? date('c')];
  $db['users'][$uid]['realDepositTotal'] = ($db['users'][$uid]['realDepositTotal'] ?? 0) + $amount;
  save_db(orolado_data_file(), $db);
}

$A = 'aaaaaaaa-1111-2222-3333-444444444444';
$B = 'bbbbbbbb-1111-2222-3333-444444444444';
$C = 'cccccccc-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin'];
$db['users']['u_pierre'] = ['id' => 'u_pierre', 'email' => 'pierre@gmail.com', 'role' => 'user', 'sbId' => $A, 'displayName' => 'Pierre'];
$db['users']['u_ami'] = ['id' => 'u_ami', 'email' => 'ami@gmail.com', 'role' => 'user', 'sbId' => $B, 'displayName' => 'Ami'];
$db['users']['u_ami2'] = ['id' => 'u_ami2', 'email' => 'ami2@gmail.com', 'role' => 'user', 'sbId' => $C, 'displayName' => 'Ami2'];
$db['vault']['admin_master'] = ['demo' => 1000, 'real' => 0];
foreach (['u_pierre', 'u_ami', 'u_ami2'] as $u) $db['vault'][$u] = ['demo' => 1000000, 'real' => 0];
save_db(orolado_data_file(), $db);

echo "1) Mode test : seul l'admin a un lien\n";
$r = orolado_aff_status(load_db(), $db['users']['u_pierre']);
check('joueur normal : pas de lien', empty($r['enabled']) && empty($r['code']));
$r = orolado_aff_status(load_db(), $db['users']['admin_master']);
$code = (string) ($r['code'] ?? '');
check('admin : lien avec un code de 8 caractères', !empty($r['enabled']) && strlen($code) === 8, $code);
check('le code ne change pas', orolado_aff_code('admin_master') === $code);
check('le code d\'un joueur non autorisé ne marche pas', !orolado_aff_attach(load_db(), 'u_ami2', orolado_aff_code('u_pierre')));

echo "2) Inscription avec le lien\n";
check('code inconnu refusé', !orolado_aff_attach(load_db(), 'u_ami', 'ZZZZZZZZ'));
check('s\'inviter soi-même refusé', !orolado_aff_attach(load_db(), 'admin_master', $code));
check('l\'ami est relié à l\'admin', orolado_aff_attach(load_db(), 'u_ami', $code));
check('relier une 2e fois refusé', !orolado_aff_attach(load_db(), 'u_ami', $code));
$r = orolado_aff_status(load_db(), load_db()['users']['admin_master']);
check('l\'admin voit 1 ami inscrit, 0 dépôt', $r['friends'] === 1 && $r['deposited'] === 0);

echo "3) Pas de dépôt = rien de versé ; un bonus admin ne compte pas\n";
deposit('u_ami', 50, 'admin');
orolado_aff_status(load_db(), load_db()['users']['u_ami']);
check('rien versé', count($credits) === 0);

echo "4) 1er dépôt de l'ami : 100 \$ → ami +5 \$ (à jouer ×2), admin +5 \$ (sur sa démo en test)\n";
$demo0 = (float) load_db()['vault']['admin_master']['demo'];
deposit('u_ami', 100);
$r = orolado_aff_status(load_db(), load_db()['users']['u_ami']);
check('ami : cadeau 5 $', abs(sum_for($credits, $B, 'adm_ami_') - 5) < 0.001 && !empty($r['invited']['justPaid']), (string) sum_for($credits, $B));
$d = load_db();
$row = array_values(array_filter($d['deposits'], fn($x) => str_starts_with((string) $x['id'], 'adm_ami_')));
check('cadeau de l\'ami rangé comme bonus (à jouer ×2)', count($row) === 1 && $row[0]['operator'] === 'admin' && (float) ($d['users']['u_ami']['wagerNeed'] ?? 0) >= 10);
check('admin (test) : +5 $ sur la démo', abs((float) $d['vault']['admin_master']['demo'] - $demo0 - 5) < 0.001);
for ($i = 0; $i < 5; $i++) { orolado_aff_status(load_db(), load_db()['users']['u_ami']); orolado_aff_status(load_db(), load_db()['users']['admin_master']); }
$d = load_db();
check('10 lectures de plus : jamais payé 2 fois', abs(sum_for($credits, $B) - 5) < 0.001 && abs((float) $d['vault']['admin_master']['demo'] - $demo0 - 5) < 0.001);
$r = orolado_aff_status(load_db(), load_db()['users']['u_ami']);
check('le message « cadeau reçu » ne s\'affiche qu\'une fois', empty($r['invited']['justPaid']) && !empty($r['invited']['paid']));

echo "5) 2e dépôt de l'ami : 200 \$ → admin +10 \$, l'ami ne reçoit rien de plus\n";
deposit('u_ami', 200);
$r = orolado_aff_status(load_db(), load_db()['users']['admin_master']);
$d = load_db();
check('admin : +10 $', abs((float) $d['vault']['admin_master']['demo'] - $demo0 - 15) < 0.001, (string) ((float) $d['vault']['admin_master']['demo'] - $demo0));
check('ami : toujours 5 $ seulement', abs(sum_for($credits, $B) - 5) < 0.001);
check('admin voit : 1 ami a déposé, gagné 15 $', $r['deposited'] === 1 && abs($r['earned'] - 15) < 0.001, (string) $r['earned']);

echo "6) Ouvert à tous : Pierre invite, son argent est LIBRE (retirable sans jouer)\n";
putenv('OROLADO_AFF_PUBLIC=1');
$pc = (string) orolado_aff_status(load_db(), load_db()['users']['u_pierre'])['code'];
check('Pierre relie Ami2', orolado_aff_attach(load_db(), 'u_ami2', $pc));
deposit('u_ami2', 40);
orolado_aff_status(load_db(), load_db()['users']['u_ami2']);
check('Ami2 : cadeau 2 $ (5 % de 40 $)', abs(sum_for($credits, $C, 'adm_ami_') - 2) < 0.001);
check('Pierre : 2 $ sur son vrai solde', abs(sum_for($credits, $A, 'aff_') - 2) < 0.001);
$d = load_db();
check('Pierre : aucune ligne de dépôt créée (rien à jouer)', count(array_filter($d['deposits'], fn($x) => ($x['userId'] ?? '') === 'u_pierre')) === 0);
$w = orolado_wager_check($d, $d['users']['u_pierre'], 2.0);
check('Pierre peut retirer ses 2 $ tout de suite', abs($w['free'] - 2) < 0.001 && $w['canWithdraw'], 'libre=' . $w['free']);
deposit('u_pierre', 100);
$d = load_db();
$w = orolado_wager_check($d, $d['users']['u_pierre'], 102.0);
check('Pierre dépose 100 $ pour lui : ses 100 $ bloqués ×2, ses 2 $ restent libres', abs($w['free'] - 2) < 0.001 && abs($w['locked'] - 100) < 0.001, 'libre=' . $w['free'] . ' bloqué=' . $w['locked']);

echo "7) Après 365 jours : plus rien pour celui qui invite\n";
orolado_aff_with(orolado_aff_inv_name('u_ami2'), function (&$st) { $st['at'] = date('c', time() - 400 * 86400); });
deposit('u_ami2', 1000);
orolado_aff_status(load_db(), load_db()['users']['u_pierre']);
check('dépôt de 1000 $ après un an : Pierre ne reçoit rien', abs(sum_for($credits, $A, 'aff_') - 2) < 0.001);

echo "8) Petits montants arrondis vers le bas (jamais plus que 5 %)\n";
check('5 % de 33,33 $ = 1,66 $', abs(orolado_aff_gift(33.33) - 1.66) < 0.001);
check('5 % de 0,10 $ = 0 $ (rien)', orolado_aff_gift(0.10) < 0.01);

echo "\n" . ($fail === 0 ? "TOUT EST BON" : "PROBLÈME") . " : $pass OK, $fail échec(s)\n";
exit($fail === 0 ? 0 : 1);
