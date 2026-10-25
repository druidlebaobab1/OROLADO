<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2673 — Un compte SUSPENDU ne peut plus revenir : le vrai api.php est appelé (un processus par demande),
 * fausse caisse Supabase, faux e-mails, dossier temporaire. Rien ne part en ligne.
 *  - nouveau compte depuis l'APPAREIL d'un suspendu : refusé ;
 *  - retrait vers le NUMÉRO d'un suspendu, ou depuis son appareil : compte suspendu aussitôt, rien débité ;
 *  - joueur honnête : retrait normal, appareil retenu ; suspendu ensuite → appareil + numéro bloqués.
 */
$tmp = sys_get_temp_dir() . '/orolado_ban_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['api.php', 'orolado_lib.php', 'trade_lib.php', 'history_lib.php', 'account_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
require $tmp . '/orolado_lib.php';

file_put_contents($tmp . '/fakebank.php', <<<'R'
<?php
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use ($tmp) {
  $fp = fopen($tmp . '/bank.json', 'c+'); flock($fp, LOCK_EX);
  $bank = json_decode(stream_get_contents($fp) ?: '{}', true) ?: [];
  $b = $body ? json_decode($body, true) : [];
  $out = [];
  if (preg_match('#/rest/v1/vaults\?user_id=eq\.([^&]+)#', $url, $m)) {
    $u = rawurldecode($m[1]);
    if ($method === 'GET') $out = isset($bank['c'][$u]) ? [['demo' => 0, 'real' => $bank['c'][$u] / 100]] : [];
  } elseif (str_contains($url, '/rpc/debit_real')) {
    $u = $b['p_user']; $c = (int) round($b['p_amount'] * 100);
    if (($bank['c'][$u] ?? 0) < $c) $out = ['ok' => false, 'reason' => 'insufficient'];
    else { $bank['c'][$u] -= $c; $out = ['ok' => true, 'real' => $bank['c'][$u] / 100]; }
  }
  rewind($fp); ftruncate($fp, 0); fwrite($fp, json_encode($bank)); fflush($fp); flock($fp, LOCK_UN); fclose($fp);
  return $out;
};
R);
file_put_contents($tmp . '/runner.php', <<<'R'
<?php
$tmp = $argv[1];
require $tmp . '/fakebank.php';
$GLOBALS['OROLADO_FAKE_MAIL'] = fn() => ['ok' => true];
$GLOBALS['OROLADO_FAKE_INPUT'] = file_get_contents($argv[2]);
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
require $tmp . '/api.php';
R);
$php = PHP_BINARY;
$call = function (array $req) use ($php, $tmp): array {
  $f = $tmp . '/req_' . bin2hex(random_bytes(4)) . '.json';
  file_put_contents($f, json_encode($req));
  $out = shell_exec(escapeshellarg($php) . ' ' . escapeshellarg($tmp . '/runner.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($f));
  return json_decode((string) $out, true) ?: ['raw' => $out];
};
$bank = fn() => json_decode((string) @file_get_contents($tmp . '/bank.json'), true) ?: [];
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$DEV_BAN = 'd' . str_repeat('ab', 12);
$DEV_A = 'd' . str_repeat('12', 12);
$DEV_B = 'd' . str_repeat('34', 12);
$DEV_C = 'd' . str_repeat('56', 12);
$sb = fn(int $i) => sprintf('cccccccc-1111-2222-3333-%012d', $i);
$db = blank_db();
// Le tricheur déjà suspendu : son appareil et son numéro Wave (retrait d'avant).
$db['users']['u_ban'] = ['id' => 'u_ban', 'email' => 'tricheur@test.com', 'role' => 'suspended', 'publicId' => 'ORO-900857', 'devices' => [$DEV_BAN]];
$db['bans']['u_ban'] = ['at' => date('c'), 'kind' => 'suspended'];
$db['withdrawals'][] = ['id' => 'wd_old', 'userId' => 'u_ban', 'amount' => 15, 'status' => 'approved', 'destination' => '+221 77 012 34 56', 'phone' => '+221 77 012 34 56'];
orolado_remember_blocked_identity($db, $db['users']['u_ban'], 'suspended');
$users = ['u_n1' => 1, 'u_n2' => 2, 'u_ok' => 3];
foreach ($users as $u => $i) {
  $db['users'][$u] = ['id' => $u, 'email' => $u . '@test.com', 'role' => 'user', 'sbId' => $sb($i), 'displayName' => 'Joueur ' . $i, 'realTrades' => 10, 'realStakeVolume' => 1000, 'publicId' => 'ORO-10000' . $i];
  $db['vault'][$u] = ['demo' => 0, 'real' => 100];
  $db['sessions']['tok_' . $u] = ['userId' => $u, 'createdAt' => date('c')];
  $db['withdrawOtps'][$u] = ['codeHash' => orolado_wd_otp_hash($u, '123456'), 'expiresAt' => time() + 600, 'attempts' => 0];
  $db['deposits'][] = ['id' => 'oro_dep_' . $u, 'ref' => 'oro_dep_' . $u, 'userId' => $u, 'amount' => 1, 'status' => 'COMPLETED', 'operator' => 'flutterwave']; // 2026-10-25 : un retrait demande un dépôt
}
save_db(orolado_data_file(), $db);
file_put_contents($tmp . '/bank.json', json_encode(['c' => [$sb(1) => 10000, $sb(2) => 10000, $sb(3) => 10000]]));
$wd = fn(string $u, string $dest, string $dev) => ['action' => 'withdraw', 'token' => 'tok_' . $u, 'otp' => '123456', 'amount' => 20, 'operator' => 'wave', 'destination' => $dest, 'beneficiary' => 'Joueur', 'countryCode' => '+221', 'dev' => $dev];

echo "1) Nouveau compte depuis l'appareil du tricheur\n";
$r = $call(['action' => 'registerStart', 'email' => 'nouveau@test.com', 'displayName' => 'Nouveau', 'passwordHash' => str_repeat('a', 64), 'dev' => $DEV_BAN]);
check('inscription refusée (message neutre)', empty($r['ok']) && str_contains((string) ($r['reason'] ?? ''), 'Inscription impossible'), (string) ($r['reason'] ?? json_encode($r)));
$r = $call(['action' => 'registerStart', 'email' => 'honnete@test.com', 'displayName' => 'Honnête', 'passwordHash' => str_repeat('a', 64), 'dev' => $DEV_A]);
check('inscription normale depuis un autre appareil : acceptée', !empty($r['ok']), (string) ($r['reason'] ?? ''));

echo "2) Retrait vers le numéro Wave du tricheur (autre compte, autre appareil)\n";
$r = $call($wd('u_n1', '770123456', $DEV_B));
$d = load_db();
check('retrait refusé, compte bloqué', empty($r['ok']) && !empty($r['banned']), json_encode($r));
check('compte suspendu aussitôt', ($d['users']['u_n1']['role'] ?? '') === 'suspended', (string) ($d['users']['u_n1']['role'] ?? ''));
check('motif noté pour l’admin', str_contains((string) ($d['users']['u_n1']['banReason'] ?? ''), 'ORO-900857'), (string) ($d['users']['u_n1']['banReason'] ?? ''));
check('rien débité (100 $)', ($bank()['c'][$sb(1)] ?? 0) === 10000);
check('aucun retrait créé', count($d['withdrawals'] ?? []) === 1);

echo "3) Retrait depuis l'appareil du tricheur (autre numéro)\n";
$r = $call($wd('u_n2', '0709998877', $DEV_BAN));
$d = load_db();
check('compte suspendu aussitôt', empty($r['ok']) && ($d['users']['u_n2']['role'] ?? '') === 'suspended', json_encode($r));
check('rien débité (100 $)', ($bank()['c'][$sb(2)] ?? 0) === 10000);

echo "4) Joueur honnête\n";
$r = $call($wd('u_ok', '0701112233', $DEV_C));
$d = load_db();
check('retrait normal accepté', !empty($r['ok']), (string) ($r['reason'] ?? ''));
check('caisse débitée 100 → 80 $', ($bank()['c'][$sb(3)] ?? 0) === 8000);
check('son appareil est retenu', in_array($DEV_C, (array) ($d['users']['u_ok']['devices'] ?? []), true), json_encode($d['users']['u_ok']['devices'] ?? null));
$r = $call(['action' => 'upsert', 'token' => 'tok_u_ok', 'user' => ['id' => 'u_ok', 'email' => 'u_ok@test.com', 'displayName' => 'Joueur 3', 'devices' => []]]);
$d = load_db();
check('le téléphone ne peut pas effacer ses appareils', in_array($DEV_C, (array) ($d['users']['u_ok']['devices'] ?? []), true), json_encode($d['users']['u_ok']['devices'] ?? null));

echo "5) L'admin le suspend ensuite : il ne peut plus revenir\n";
$d = load_db();
orolado_force_suspend($d, 'u_ok', 'suspended', 'u_ok@test.com');
save_db(orolado_data_file(), $d);
$d = load_db();
check('appareil bloqué', isset($d['blocked_identities']['dev:' . $DEV_C]));
check('numéro de retrait bloqué', isset($d['blocked_identities']['dest:t01112233']), implode(', ', array_keys($d['blocked_identities'] ?? [])));
$r = $call(['action' => 'registerStart', 'email' => 'revenu@test.com', 'displayName' => 'Revenu', 'passwordHash' => str_repeat('a', 64), 'dev' => $DEV_C]);
check('nouveau compte depuis son appareil : refusé', empty($r['ok']), (string) ($r['reason'] ?? ''));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
