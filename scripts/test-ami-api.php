<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Inviter un ami, de bout en bout par le VRAI api.php : inscription Google et inscription e-mail avec
 * un lien d'ami, puis dépôt, puis affStatus (versement des cadeaux). Faux Supabase / Google / e-mails.
 */
$tmp = sys_get_temp_dir() . '/orolado_amiapi_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['api.php', 'orolado_lib.php', 'trade_lib.php', 'history_lib.php', 'account_lib.php', 'feed_lib.php', 'fair_table.php', 'defi_lib.php', 'aff_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('SUPABASE_ANON_KEY=fake-anon-key');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';

file_put_contents($tmp . '/runner.php', <<<'R'
<?php
$tmp = $argv[1];
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('SUPABASE_ANON_KEY=fake-anon-key');
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use ($tmp) {
  $vaults = json_decode((string) @file_get_contents($tmp . '/vaults.json'), true) ?: [];
  if (str_contains($url, '/rest/v1/rpc/resolve_trade')) {
    $b = json_decode((string) $body, true) ?: [];
    $done = json_decode((string) @file_get_contents($tmp . '/credited.json'), true) ?: [];
    $k = $b['p_user'] . '|' . $b['p_order'];
    if (empty($done[$k])) {
      $done[$k] = (float) $b['p_amount'];
      file_put_contents($tmp . '/credited.json', json_encode($done));
      $vaults[$b['p_user']]['real'] = ($vaults[$b['p_user']]['real'] ?? 0) + (float) $b['p_amount'];
      file_put_contents($tmp . '/vaults.json', json_encode($vaults));
    }
    return ['ok' => true, 'real' => $vaults[$b['p_user']]['real'] ?? 0];
  }
  if (preg_match('#/rest/v1/vaults\?user_id=eq\.([0-9a-f-]+)#', $url, $m)) {
    $id = rawurldecode($m[1]);
    return isset($vaults[$id]) ? [['user_id' => $id, 'demo' => 1000000, 'real' => $vaults[$id]['real']]] : [];
  }
  if (str_contains($url, '/auth/v1/admin/users') && $method === 'POST') {
    $b = json_decode((string) $body, true) ?: [];
    $id = 'eeeeeeee-0000-0000-0000-' . substr(md5((string) ($b['email'] ?? '')), 0, 12);
    $vaults[$id] = $vaults[$id] ?? ['real' => 0];
    file_put_contents($tmp . '/vaults.json', json_encode($vaults));
    return ['id' => $id, 'email' => $b['email'] ?? ''];
  }
  if (str_contains($url, '/rest/v1/profiles?email=eq.')) return [];
  if (str_contains($url, '/rest/v1/vaults') && $method === 'POST') {
    $b = json_decode((string) $body, true) ?: [];
    if (!isset($vaults[$b['user_id']])) $vaults[$b['user_id']] = ['real' => (float) ($b['real'] ?? 0)];
    file_put_contents($tmp . '/vaults.json', json_encode($vaults));
    return [$b];
  }
  return [];
};
$GLOBALS['OROLADO_FAKE_MAIL'] = fn() => ['ok' => true];
$GLOBALS['OROLADO_FAKE_GOOGLE'] = function (string $tok) use ($tmp) { return json_decode((string) @file_get_contents($tmp . '/googleinfo.json'), true); };
$GLOBALS['OROLADO_FAKE_INPUT'] = file_get_contents($argv[2]);
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.' . random_int(2, 250);
require $tmp . '/api.php';
R);
$php = PHP_BINARY;
$call = function (array $req) use ($php, $tmp): array {
  $f = $tmp . '/req_' . bin2hex(random_bytes(4)) . '.json';
  file_put_contents($f, json_encode($req));
  $out = (string) shell_exec(escapeshellarg($php) . ' ' . escapeshellarg($tmp . '/runner.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($f));
  return json_decode($out, true) ?: ['raw' => substr($out, 0, 300)];
};
$google = function (string $email, string $nonce) use ($tmp): void {
  file_put_contents($tmp . '/googleinfo.json', json_encode([
    'aud' => OROLADO_GOOGLE_CLIENT_ID_TEST, 'iss' => 'https://accounts.google.com', 'email' => $email,
    'email_verified' => 'true', 'exp' => (string) (time() + 600), 'name' => 'Ami Google', 'nonce' => hash('sha256', $nonce),
  ]));
};
// Identifiant Google public du site (le même que dans api.php).
preg_match("/const OROLADO_GOOGLE_CLIENT_ID = '([^']+)'/", (string) file_get_contents($tmp . '/api.php'), $mm);
define('OROLADO_GOOGLE_CLIENT_ID_TEST', $mm[1] ?? '');
$credited = fn() => json_decode((string) @file_get_contents($tmp . '/credited.json'), true) ?: [];

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$db = blank_db();
$db['users']['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin'];
$db['vault']['admin_master'] = ['demo' => 1000, 'real' => 0];
$db['users']['u_ancien'] = ['id' => 'u_ancien', 'email' => 'ancien@gmail.com', 'role' => 'user', 'displayName' => 'Ancien', 'sbId' => 'aaaaaaaa-1111-2222-3333-444444444444'];
$db['vault']['u_ancien'] = ['demo' => 1000000, 'real' => 0];
save_db(orolado_data_file(), $db);
$code = orolado_aff_register_code('admin_master');

echo "1) Inscription Google avec le lien de l'admin\n";
$google('amigoogle@gmail.com', 'n1');
$r = $call(['action' => 'googleLogin', 'idToken' => 'tok1', 'nonce' => 'n1', 'ami' => $code]);
$gid = (string) ($r['user']['id'] ?? '');
check('compte Google créé', !empty($r['ok']) && $gid !== '', (string) ($r['reason'] ?? json_encode($r)));
check('relié à l\'admin', (orolado_aff_read(orolado_aff_inv_name($gid))['inviter'] ?? '') === 'admin_master');

echo "2) Un ancien joueur qui se connecte avec Google et un lien : PAS relié (seulement les nouveaux)\n";
$google('ancien@gmail.com', 'n2');
$r = $call(['action' => 'googleLogin', 'idToken' => 'tok2', 'nonce' => 'n2', 'ami' => $code]);
check('connexion ok, pas relié', !empty($r['ok']) && empty(orolado_aff_read(orolado_aff_inv_name('u_ancien'))['inviter']));

echo "3) Inscription par e-mail (code reçu) avec le lien\n";
$email = 'amimail@gmail.com';
$d = load_db();
$d['pendingRegistrations'][$email] = ['displayName' => 'Ami Mail', 'email' => $email, 'phone' => '', 'countryCode' => '+225', 'country' => 'CI',
  'passwordHash' => str_repeat('a', 64), 'trafficSource' => 'direct', 'codeHash' => orolado_otp_hash($email, '123456'),
  'expiresAt' => time() + 600, 'lastSentAt' => time(), 'attempts' => 0, 'createdAt' => date('c'), 'createdAtTs' => time(), 'sessionExpiresAt' => time() + 3600, 'prevHashes' => []];
save_db(orolado_data_file(), $d);
$r = $call(['action' => 'registerVerify', 'email' => $email, 'code' => '123456', 'ami' => $code]);
$mid = (string) ($r['user']['id'] ?? '');
$tok = (string) ($r['token'] ?? '');
check('compte e-mail créé', !empty($r['ok']) && $mid !== '' && $tok !== '', (string) ($r['reason'] ?? ''));
check('relié à l\'admin', (orolado_aff_read(orolado_aff_inv_name($mid))['inviter'] ?? '') === 'admin_master');

echo "4) Faux code dans le lien : rien\n";
$google('autre@gmail.com', 'n3');
$r = $call(['action' => 'googleLogin', 'idToken' => 'tok3', 'nonce' => 'n3', 'ami' => 'XXXXXXXX']);
check('compte créé mais pas relié', !empty($r['ok']) && empty(orolado_aff_read(orolado_aff_inv_name((string) ($r['user']['id'] ?? '')))['inviter']));

echo "5) L'ami dépose 100 \$, puis ouvre le site (affStatus) : cadeaux versés une fois\n";
$d = load_db();
$d['deposits'][] = ['id' => 'flw_test1', 'ref' => 'flw_test1', 'userId' => $mid, 'amount' => 100, 'status' => 'COMPLETED', 'operator' => 'flutterwave', 'createdAt' => date('c'), 'paidAt' => date('c')];
$d['users'][$mid]['realDepositTotal'] = 100;
save_db(orolado_data_file(), $d);
$demo0 = (float) load_db()['vault']['admin_master']['demo'];
$r = $call(['action' => 'affStatus', 'token' => $tok]);
check('réponse : cadeau reçu 5 $ (message à afficher)', !empty($r['invited']['justPaid']) && abs((float) $r['invited']['gift'] - 5) < 0.001, json_encode($r['invited'] ?? $r));
check('ami : 5 $ crédités une fois', abs(array_sum(array_filter($credited(), fn($k) => str_contains($k, 'adm_ami_'), ARRAY_FILTER_USE_KEY)) - 5) < 0.001);
check('admin (test) : +5 $ démo', abs((float) load_db()['vault']['admin_master']['demo'] - $demo0 - 5) < 0.001);
for ($i = 0; $i < 3; $i++) $r = $call(['action' => 'affStatus', 'token' => $tok]);
check('3 appels de plus : rien en double, message plus affiché', count($credited()) === 1 && empty($r['invited']['justPaid']) && abs((float) load_db()['vault']['admin_master']['demo'] - $demo0 - 5) < 0.001);
check('joueur normal (mode test) : pas de lien d\'invitation', empty($r['enabled']) && empty($r['code']));

echo "6) Sans session : refusé\n";
$r = $call(['action' => 'affStatus', 'token' => 'faux']);
check('session invalide', empty($r['ok']));

echo "\n" . ($fail === 0 ? "TOUT EST BON" : "PROBLÈME") . " : $pass OK, $fail échec(s)\n";
exit($fail === 0 ? 0 : 1);
