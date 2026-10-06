<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Connexion Google (action googleLogin d'api.php) : le vrai api.php est appelé, faux Supabase
 * (réponses lues dans des fichiers du dossier temporaire), faux e-mails. Rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_ggl_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['api.php', 'orolado_lib.php', 'trade_lib.php', 'history_lib.php', 'account_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
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

echo "1) Jeton refusé (faux, pas Google, e-mail non confirmé)\n";
file_put_contents($tmp . '/authuser.json', 'null');
$r = $call(['action' => 'googleLogin', 'accessToken' => 'eyJfaux']);
check('faux jeton refusé', empty($r['ok']) && empty($r['token']), (string) ($r['reason'] ?? ''));
$googleUser($fresh, 'mdp@gmail.com', ['email']);
$r = $call(['action' => 'googleLogin', 'accessToken' => 'eyJmdp']);
check('compte e-mail/mot de passe (pas Google) refusé', empty($r['ok']));
$googleUser($fresh, 'nonconf@gmail.com', ['google'], false);
$r = $call(['action' => 'googleLogin', 'accessToken' => 'eyJnc']);
check('e-mail non confirmé refusé', empty($r['ok']));
$googleUser($fresh, 'admin@orolado.com');
$r = $call(['action' => 'googleLogin', 'accessToken' => 'eyJadm']);
check('adresse admin refusée', empty($r['ok']) && empty($r['token']));
check('aucun compte créé', !isset(load_db()['users'][$fresh]));

echo "2) Nouveau joueur Google\n";
$googleUser($fresh, 'Nouveau@Gmail.com');
$r = $call(['action' => 'googleLogin', 'accessToken' => 'eyJnew', 'trafficSource' => 'facebook']);
$u = load_db()['users'][$fresh] ?? null;
check('connecté avec une session du site', !empty($r['ok']) && is_string($r['token'] ?? null) && strpos($r['token'], 'eyJ') !== 0, (string) ($r['reason'] ?? ''));
check('compte créé (id Supabase, e-mail en minuscules)', is_array($u) && ($u['email'] ?? '') === 'nouveau@gmail.com');
check('nom Google repris', ($u['displayName'] ?? '') === 'Awa Koné', (string) ($u['displayName'] ?? ''));
check('numéro ORO attribué', str_starts_with((string) ($u['publicId'] ?? ''), 'ORO-'));
check('source de pub notée', ($u['trafficSource'] ?? '') === 'facebook');
check('démo 1 000 000, réel 0', (float) ($r['vault']['demo'] ?? 0) === 1000000.0 && (float) ($r['vault']['real'] ?? -1) === 0.0);
check('pas de mot de passe', ($u['passwordHash'] ?? 'x') === '');
$r2 = $call(['action' => 'googleLogin', 'accessToken' => 'eyJnew']);
$n = 0; foreach (load_db()['users'] as $x) if (strtolower((string) ($x['email'] ?? '')) === 'nouveau@gmail.com') $n++;
check('2e connexion : même compte, pas de doublon', !empty($r2['ok']) && ($r2['user']['id'] ?? '') === $fresh && $n === 1);

echo "3) Joueur existant (même Gmail) : retrouve SON compte et SON solde\n";
$googleUser($linked, 'relie@gmail.com');
$r = $call(['action' => 'googleLogin', 'accessToken' => 'eyJrel']);
check('même compte (u_relie)', !empty($r['ok']) && ($r['user']['id'] ?? '') === 'u_relie', (string) ($r['user']['id'] ?? ''));
check('solde réel 40 $ conservé', (float) ($r['vault']['real'] ?? 0) === 40.0, (string) ($r['vault']['real'] ?? ''));
check('aucun crédit ajouté', !is_file($tmp . '/credits.log'));

echo "4) Ancien joueur sans coffre Supabase : solde reporté UNE fois, sans gonfler\n";
$oldVault = $old;
$googleUser($oldVault, 'ancien@gmail.com');
$r = $call(['action' => 'googleLogin', 'accessToken' => 'eyJanc']);
check('même compte (u_ancien)', !empty($r['ok']) && ($r['user']['id'] ?? '') === 'u_ancien');
check('solde réel 30 $ retrouvé (pas 0)', (float) ($r['vault']['real'] ?? 0) === 30.0, (string) ($r['vault']['real'] ?? ''));
check('lien de caisse enregistré', (load_db()['users']['u_ancien']['sbId'] ?? '') === $old);
$call(['action' => 'googleLogin', 'accessToken' => 'eyJanc']);
$r = $call(['action' => 'googleLogin', 'accessToken' => 'eyJanc']);
check('3 connexions : toujours 30 $ (pas de double report)', (float) ($r['vault']['real'] ?? 0) === 30.0, (string) ($r['vault']['real'] ?? ''));
check('un seul report noté', count(file($tmp . '/credits.log', FILE_IGNORE_NEW_LINES)) === 1);

echo "5) Suspendu / liste noire\n";
$googleUser('dddddddd-1111-2222-3333-444444444444', 'banni@gmail.com');
$r = $call(['action' => 'googleLogin', 'accessToken' => 'eyJban']);
check('compte suspendu refusé', empty($r['ok']) && empty($r['token']));

echo "6) Bouton officiel : ticket Google vérifié par le serveur (sans Supabase)\n";
$cid = '549155545150-2efbga9m4me35us0a70q3tkrfbhq7sjn.apps.googleusercontent.com';
$gInfo = function (string $email, array $over = []) use ($tmp, $cid): void {
  file_put_contents($tmp . '/googleinfo.json', json_encode(array_merge([
    'iss' => 'https://accounts.google.com', 'aud' => $cid, 'email' => $email, 'email_verified' => 'true',
    'name' => 'Kofi Mensah', 'exp' => (string) (time() + 600), 'nonce' => hash('sha256', 'n0nce'),
  ], $over)));
};
$gInfo('kofi@gmail.com', ['aud' => 'autre-site.apps.googleusercontent.com']);
$r = $call(['action' => 'googleLogin', 'idToken' => 'a.b.c', 'nonce' => 'n0nce']);
check('ticket d\'un AUTRE site refusé', empty($r['ok']) && empty($r['token']));
$gInfo('kofi@gmail.com', ['exp' => (string) (time() - 5)]);
$r = $call(['action' => 'googleLogin', 'idToken' => 'a.b.c', 'nonce' => 'n0nce']);
check('ticket expiré refusé', empty($r['ok']));
$gInfo('kofi@gmail.com', ['email_verified' => 'false']);
$r = $call(['action' => 'googleLogin', 'idToken' => 'a.b.c', 'nonce' => 'n0nce']);
check('e-mail non vérifié par Google refusé', empty($r['ok']));
$gInfo('kofi@gmail.com');
$r = $call(['action' => 'googleLogin', 'idToken' => 'a.b.c', 'nonce' => 'mauvais']);
check('ticket rejoué (mauvais nonce) refusé', empty($r['ok']));
@unlink($tmp . '/googleinfo.json');
$r = $call(['action' => 'googleLogin', 'idToken' => 'a.b.c', 'nonce' => 'n0nce']);
check('Google injoignable / faux ticket refusé', empty($r['ok']));
$nk0 = 0; foreach (load_db()['users'] as $x) if (($x['email'] ?? '') === 'kofi@gmail.com') $nk0++;
check('aucun compte créé par ces essais', $nk0 === 0);
$gInfo('Kofi@Gmail.com');
$r = $call(['action' => 'googleLogin', 'idToken' => 'a.b.c', 'nonce' => 'n0nce', 'trafficSource' => 'facebook']);
$kid = (string) ($r['user']['id'] ?? '');
$ku = load_db()['users'][$kid] ?? [];
check('nouveau joueur connecté (session du site)', !empty($r['ok']) && !empty($r['token']), (string) ($r['reason'] ?? ''));
check('compte du site u_… créé, nom Google, source pub', str_starts_with($kid, 'u_') && ($ku['displayName'] ?? '') === 'Kofi Mensah' && ($ku['trafficSource'] ?? '') === 'facebook' && ($ku['email'] ?? '') === 'kofi@gmail.com');
check('coffre Supabase créé par le serveur et relié', str_contains((string) @file_get_contents($tmp . '/admincreated.log'), 'kofi@gmail.com') && str_starts_with((string) ($ku['sbId'] ?? ''), 'eeeeeeee-'));
check('démo 1 000 000, réel 0', (float) ($r['vault']['demo'] ?? 0) === 1000000.0 && (float) ($r['vault']['real'] ?? -1) === 0.0);
$r2 = $call(['action' => 'googleLogin', 'idToken' => 'a.b.c', 'nonce' => 'n0nce']);
$nk = 0; foreach (load_db()['users'] as $x) if (($x['email'] ?? '') === 'kofi@gmail.com') $nk++;
check('2e connexion : même compte, pas de doublon', ($r2['user']['id'] ?? '') === $kid && $nk === 1);
$gInfo('relie@gmail.com');
$r = $call(['action' => 'googleLogin', 'idToken' => 'a.b.c', 'nonce' => 'n0nce']);
check('joueur existant (même Gmail) : SON compte, solde 40 $', ($r['user']['id'] ?? '') === 'u_relie' && (float) ($r['vault']['real'] ?? 0) === 40.0);
$gInfo('admin@orolado.com');
$r = $call(['action' => 'googleLogin', 'idToken' => 'a.b.c', 'nonce' => 'n0nce']);
check('adresse admin refusée', empty($r['ok']) && empty($r['token']));

echo "\n" . ($fail === 0 ? "TOUT EST BON" : "PROBLÈME") . " : $pass OK, $fail échec(s)\n";
exit($fail === 0 ? 0 : 1);
