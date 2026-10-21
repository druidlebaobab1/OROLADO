<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2641 — Inscription Google → tableau admin (Inscriptions du Jour, Google / E-mail, plus récent en haut) : le vrai api.php est appelé, faux Supabase
 * (réponses lues dans des fichiers du dossier temporaire), faux e-mails. Rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_ggl_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['admin_lib.php', 'mail_queue_lib.php', 'wipe_lib.php', 'aff_lib.php', 'api.php', 'orolado_lib.php', 'trade_lib.php', 'history_lib.php', 'account_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('SUPABASE_ANON_KEY=fake-anon-key');
require $tmp . '/orolado_lib.php';

file_put_contents($tmp . '/runner.php', <<<'R'
<?php
$tmp = $argv[1];
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('SUPABASE_ANON_KEY=fake-anon-key');
// Faux Supabase : /auth/v1/user = joueur Google du fichier authuser.json ; coffres dans vaults.json ;
// chaque crédit (resolve_trade) est noté dans credits.log.
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use ($tmp) {
  $vaults = json_decode((string) @file_get_contents($tmp . '/vaults.json'), true) ?: [];
  if (str_contains($url, '/auth/v1/user')) return json_decode((string) @file_get_contents($tmp . '/authuser.json'), true);
  if (str_contains($url, '/rest/v1/rpc/resolve_trade')) {
    $b = json_decode((string) $body, true) ?: [];
    $done = json_decode((string) @file_get_contents($tmp . '/credited.json'), true) ?: [];
    if (empty($done[$b['p_order']])) {
      $done[$b['p_order']] = 1;
      file_put_contents($tmp . '/credited.json', json_encode($done));
      $vaults[$b['p_user']]['real'] = ($vaults[$b['p_user']]['real'] ?? 0) + (float) $b['p_amount'];
      file_put_contents($tmp . '/vaults.json', json_encode($vaults));
      file_put_contents($tmp . '/credits.log', $b['p_user'] . ' ' . $b['p_amount'] . "\n", FILE_APPEND);
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
    file_put_contents($tmp . '/admincreated.log', ($b['email'] ?? '') . ' ' . $id . "\n", FILE_APPEND);
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
// Faux Google (vérification du ticket) : contenu lu dans googleinfo.json, null si absent.
$GLOBALS['OROLADO_FAKE_GOOGLE'] = function (string $tok) use ($tmp) { return json_decode((string) @file_get_contents($tmp . '/googleinfo.json'), true); };
$GLOBALS['OROLADO_FAKE_INPUT'] = file_get_contents($argv[2]);
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
require $tmp . '/api.php';
R);
$php = PHP_BINARY;
$call = function (array $req) use ($php, $tmp): array {
  $f = $tmp . '/req_' . bin2hex(random_bytes(4)) . '.json';
  file_put_contents($f, json_encode($req));
  $out = (string) shell_exec(escapeshellarg($php) . ' ' . escapeshellarg($tmp . '/runner.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($f));
  return json_decode($out, true) ?: ['raw' => $out];
};
$googleUser = function (string $id, string $email, array $providers = ['google'], bool $confirmed = true, string $name = 'Awa Koné') use ($tmp): void {
  file_put_contents($tmp . '/authuser.json', json_encode([
    'id' => $id, 'email' => $email,
    'email_confirmed_at' => $confirmed ? date('c') : null,
    'app_metadata' => ['provider' => $providers[0] ?? '', 'providers' => $providers],
    'user_metadata' => ['full_name' => $name, 'email_verified' => $confirmed],
  ]));
};
$setVaults = fn(array $v) => file_put_contents($tmp . '/vaults.json', json_encode($v));

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$old = 'aaaaaaaa-1111-2222-3333-444444444444';
$linked = 'bbbbbbbb-1111-2222-3333-444444444444';
$fresh = 'cccccccc-1111-2222-3333-444444444444';
$db = blank_db();
// Joueur déjà relié à son coffre Supabase (cas normal).
$db['users']['u_relie'] = ['id' => 'u_relie', 'email' => 'relie@gmail.com', 'role' => 'user', 'sbId' => $linked, 'displayName' => 'Relié', 'publicId' => 'ORO-111111'];
$db['vault']['u_relie'] = ['demo' => 500, 'real' => 40];
// Ancien joueur SANS coffre Supabase, 30 $ réels notés ici, 50 $ déposés, 10 $ retirés.
$db['users']['u_ancien'] = ['id' => 'u_ancien', 'email' => 'ancien@gmail.com', 'role' => 'user', 'displayName' => 'Ancien', 'realDepositTotal' => 50, 'publicId' => 'ORO-222222'];
$db['vault']['u_ancien'] = ['demo' => 1000000, 'real' => 30];
$db['deposits'] = [['id' => 'd1', 'userId' => 'u_ancien', 'amount' => 50, 'status' => 'completed']];
$db['withdrawals'] = [['id' => 'w1', 'userId' => 'u_ancien', 'amount' => 10, 'status' => 'paid']];
// Joueur suspendu.
$db['users']['u_banni'] = ['id' => 'u_banni', 'email' => 'banni@gmail.com', 'role' => 'suspended', 'displayName' => 'Banni'];
save_db(orolado_data_file(), $db);
$setVaults([$linked => ['real' => 40]]);

$CID = '549155545150-2efbga9m4me35us0a70q3tkrfbhq7sjn.apps.googleusercontent.com';
// Un ancien inscrit par e-mail (avec mot de passe), inscrit hier.
$db = load_db();
$db['users']['u_mail'] = ['id' => 'u_mail', 'email' => 'mail@gmail.com', 'role' => 'user', 'displayName' => 'Mail', 'passwordHash' => str_repeat('a', 64), 'createdAt' => date('c', time() - 86400), 'publicId' => 'ORO-333333'];
save_db(orolado_data_file(), $db);
foreach (['neuf1@gmail.com' => 'n1', 'neuf2@gmail.com' => 'n2'] as $em => $nonce) {
  file_put_contents($tmp . '/googleinfo.json', json_encode(['aud' => $CID, 'iss' => 'accounts.google.com', 'email_verified' => 'true', 'exp' => time() + 600, 'nonce' => hash('sha256', $nonce), 'email' => $em, 'name' => 'Test']));
  $r = $call(['action' => 'googleLogin', 'idToken' => 'tok' . $nonce, 'nonce' => $nonce, 'trafficSource' => 'facebook']);
  check("inscription Google $em : nouveau compte", !empty($r['ok']) && !empty($r['new']), (string) ($r['reason'] ?? ''));
  sleep(1);
}
// Faux Supabase pour l'admin : les comptes créés par le serveur (fournisseur « email » côté Supabase).
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use ($tmp) {
  if (str_contains($url, '/auth/v1/admin/users') && $method === 'GET') {
    $us = [];
    foreach (@file($tmp . '/admincreated.log', FILE_IGNORE_NEW_LINES) ?: [] as $l) { [$e, $id] = explode(' ', $l); $us[] = ['id' => $id, 'email' => $e, 'created_at' => gmdate('Y-m-d\TH:i:s.u\Z'), 'app_metadata' => ['provider' => 'email']]; }
    return ['users' => $us];
  }
  return [];
};
require_once $tmp . '/admin_lib.php';
$people = admin_profiles();
[$t0, $t1] = admin_day_bounds('today');
$by = []; foreach ($people as $p) $by[strtolower((string) ($p['email'] ?? ''))] = $p;
check('les 2 joueurs Google sont dans le tableau', isset($by['neuf1@gmail.com'], $by['neuf2@gmail.com']));
check('comptés dans « Inscriptions du Jour »', admin_in_range($by['neuf1@gmail.com']['createdAt'] ?? null, $t0, $t1) && admin_in_range($by['neuf2@gmail.com']['createdAt'] ?? null, $t0, $t1));
check('marqués « Google »', ($by['neuf1@gmail.com']['via'] ?? '') === 'google' && ($by['neuf2@gmail.com']['via'] ?? '') === 'google');
check('inscrit par e-mail marqué « E-mail »', ($by['mail@gmail.com']['via'] ?? '') === 'email');
$list = $people;
usort($list, static fn($a, $b) => (strtotime((string) ($b['createdAt'] ?? '')) ?: 0) <=> (strtotime((string) ($a['createdAt'] ?? '')) ?: 0));
check('le plus récent est en haut de la liste', strtolower((string) ($list[0]['email'] ?? '')) === 'neuf2@gmail.com', (string) ($list[0]['email'] ?? ''));
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";