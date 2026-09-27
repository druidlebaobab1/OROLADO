<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * SÉCURITÉ : le vrai api.php est appelé (un processus par demande), fausse base Supabase,
 * faux e-mails, dossier temporaire. Rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_sec_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['api.php', 'orolado_lib.php', 'trade_lib.php', 'history_lib.php', 'account_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
require $tmp . '/orolado_lib.php';

file_put_contents($tmp . '/runner.php', <<<'R'
<?php
$tmp = $argv[1];
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['OROLADO_FAKE_HTTP'] = fn() => [];
$GLOBALS['OROLADO_FAKE_MAIL'] = function (string $to, string $code) use ($tmp) { file_put_contents($tmp . '/mails.log', $to . "\n", FILE_APPEND); return ['ok' => true]; };
$GLOBALS['OROLADO_FAKE_INPUT'] = file_get_contents($argv[2]);
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = $argv[3] ?? '127.0.0.1';
if (!empty($argv[4])) $_SERVER['HTTP_CF_CONNECTING_IP'] = $argv[4];
require $tmp . '/api.php';
R);
$php = PHP_BINARY;
$call = function (array $req, string $ip = '127.0.0.1', string $cf = '') use ($php, $tmp): array {
  $f = $tmp . '/req_' . bin2hex(random_bytes(4)) . '.json';
  file_put_contents($f, json_encode($req));
  $cmd = escapeshellarg($php) . ' ' . escapeshellarg($tmp . '/runner.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($f) . ' ' . escapeshellarg($ip) . ($cf !== '' ? ' ' . escapeshellarg($cf) : '');
  $out = (string) shell_exec($cmd);
  return json_decode($out, true) ?: ['raw' => $out];
};

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$victim = 'dddddddd-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_me'] = ['id' => 'u_me', 'email' => 'moi@test.com', 'role' => 'user', 'sbId' => 'eeeeeeee-1111-2222-3333-444444444444', 'realStakeVolume' => 10, 'realTrades' => 1, 'realDepositTotal' => 50, 'displayName' => 'Moi'];
$db['sessions']['tokMe'] = ['userId' => 'u_me', 'createdAt' => date('c')];
save_db(orolado_data_file(), $db);

echo "1) Ancienne inscription directe (sans code e-mail)\n";
$r = $call(['action' => 'register', 'user' => ['id' => 'u_pirate', 'email' => 'pirate@test.com', 'sbId' => $victim]]);
check('refusée', empty($r['ok']), (string) ($r['reason'] ?? ''));
check('aucun compte créé', !isset(load_db()['users']['u_pirate']));

echo "2) Le téléphone ne peut plus gonfler ses compteurs ni changer son lien de caisse\n";
$r = $call(['action' => 'upsert', 'token' => 'tokMe', 'user' => ['id' => 'u_me', 'email' => 'moi@test.com', 'displayName' => 'Nouveau nom', 'sbId' => $victim, 'realStakeVolume' => 999999999, 'totalWageredSinceDeposit' => 999999999, 'realTrades' => 5000, 'realDepositTotal' => 1, 'role' => 'admin', 'countryIso' => 'FR']]);
$u = load_db()['users']['u_me'];
check('mise à jour acceptée (nom changé)', !empty($r['ok']) && ($u['displayName'] ?? '') === 'Nouveau nom', (string) ($u['displayName'] ?? ''));
check('montant misé inchangé (10 $)', (float) ($u['realStakeVolume'] ?? 0) === 10.0, (string) ($u['realStakeVolume'] ?? ''));
check('« misé depuis dépôt » non inventé', empty($u['totalWageredSinceDeposit']), (string) ($u['totalWageredSinceDeposit'] ?? ''));
check('nombre de trades inchangé (1)', (int) ($u['realTrades'] ?? 0) === 1);
check('total déposé inchangé (50 $)', (float) ($u['realDepositTotal'] ?? 0) === 50.0);
check('lien de caisse inchangé (pas celui de la victime)', ($u['sbId'] ?? '') !== $victim);
check('rôle inchangé (pas admin)', ($u['role'] ?? '') === 'user');

echo "3) Limites anti-robots\n";
$codes = [];
for ($i = 1; $i <= 7; $i++) {
  $r = $call(['action' => 'registerStart', 'email' => 'cible@test.com', 'displayName' => 'Cible', 'passwordHash' => str_repeat('a', 64), 'countryCode' => '+225']);
  $codes[] = !empty($r['rate']) ? 'bloqué' : 'ok';
}
check('même e-mail : 5 demandes de code acceptées, puis bloqué', $codes === ['ok', 'ok', 'ok', 'ok', 'ok', 'bloqué', 'bloqué'], implode(',', $codes));
$mails = array_filter(explode("\n", (string) @file_get_contents($tmp . '/mails.log')));
check('au plus 5 e-mails envoyés à cette adresse (le site évite aussi les doublons)', count(array_filter($mails, fn($m) => $m === 'cible@test.com')) >= 1 && count(array_filter($mails, fn($m) => $m === 'cible@test.com')) <= 5, (string) count($mails));
$r = $call(['action' => 'registerStart', 'email' => 'autre@test.com', 'displayName' => 'Autre', 'passwordHash' => str_repeat('b', 64), 'countryCode' => '+225']);
check('une autre adresse, même connexion : pas bloquée', empty($r['rate']), (string) ($r['reason'] ?? 'ok'));
$r = $call(['action' => 'welcomeEmail', 'email' => 'inconnu@test.com']);
$mails = array_filter(explode("\n", (string) @file_get_contents($tmp . '/mails.log')));
check('e-mail de bienvenue refusé pour une adresse non inscrite', !in_array('inconnu@test.com', $mails, true) && !empty($r['skipped']));

echo "4) Adresse du visiteur derrière Cloudflare\n";
$_SERVER['REMOTE_ADDR'] = '172.64.10.20'; $_SERVER['HTTP_CF_CONNECTING_IP'] = '41.202.1.2';
check('vient de Cloudflare : on prend la vraie adresse du joueur', orolado_client_ip() === '41.202.1.2', orolado_client_ip());
$_SERVER['REMOTE_ADDR'] = '2606:4700::1'; $_SERVER['HTTP_CF_CONNECTING_IP'] = '2c0f:f5c0::9';
check('pareil en IPv6', orolado_client_ip() === '2c0f:f5c0::9', orolado_client_ip());
$_SERVER['REMOTE_ADDR'] = '41.66.7.8'; $_SERVER['HTTP_CF_CONNECTING_IP'] = '1.2.3.4';
check('en-tête inventé par un pirate (pas Cloudflare) : ignoré', orolado_client_ip() === '41.66.7.8', orolado_client_ip());
unset($_SERVER['HTTP_CF_CONNECTING_IP']);

echo "5) Durée des connexions : 30 jours sans visite\n";
with_db_lock(function ($box) {
  $box->db['sessions']['tokOld'] = ['userId' => 'u_me', 'at' => date('c', time() - 31 * 86400), 'exp' => time() + 100 * 365 * 86400];
  $box->db['sessions']['tokRecent'] = ['userId' => 'u_me', 'at' => date('c', time() - 29 * 86400), 'exp' => time() + 100 * 365 * 86400];
  return ['ok' => true];
});
$r = $call(['action' => 'me', 'token' => 'tokOld']);
check('ancien jeton (pas de visite depuis 31 jours) : refusé', empty($r['ok']), (string) ($r['reason'] ?? ''));
$r = $call(['action' => 'me', 'token' => 'tokRecent']);
check('jeton utilisé il y a 29 jours : accepté', !empty($r['ok']), (string) ($r['reason'] ?? ''));
$s = load_db()['sessions']['tokRecent'] ?? [];
check('et prolongé de 30 jours', (int) ($s['exp'] ?? 0) > time() + 29 * 86400 && (int) ($s['exp'] ?? 0) < time() + 31 * 86400);
$db = load_db();
$n = orolado_prune_sessions($db);
check('ménage : la session morte est retirée, les vivantes gardées', $n === 1 && !isset($db['sessions']['tokOld']) && isset($db['sessions']['tokMe']), (string) $n);

echo "6) Mot de passe admin\n";
$r = $call(['action' => 'login', 'email' => 'admin@orolado.com', 'password' => 'AdminOrolado2026!']);
check('sans réglage chez l’hébergeur : l’ancien mot de passe marche encore (pas de blocage)', !empty($r['ok']), (string) ($r['reason'] ?? ''));
putenv('ADMIN_PASSWORD=Nouveau-MotDePasse-Test-42');
$r = $call(['action' => 'login', 'email' => 'admin@orolado.com', 'password' => 'AdminOrolado2026!']);
check('réglage fait : l’ancien mot de passe du code est REFUSÉ', empty($r['ok']), (string) ($r['reason'] ?? ''));
$r = $call(['action' => 'login', 'email' => 'admin@orolado.com', 'password' => 'Nouveau-MotDePasse-Test-42']);
check('le nouveau mot de passe marche', !empty($r['ok']), (string) ($r['reason'] ?? ''));
check('l’empreinte du mot de passe n’est jamais renvoyée au téléphone', !isset($r['user']['pwTag']) && !isset($r['user']['passwordHash']));
putenv('ADMIN_PASSWORD');

echo "7) Compte créé directement chez Supabase (en contournant le site)\n";
putenv('SUPABASE_ANON_KEY=fake-anon');
$authUsers = [
  'eyJpirate1' => ['id' => 'f0000000-0000-0000-0000-000000000001', 'email' => 'moi@test.com', 'email_confirmed_at' => date('c')],
  'eyJpirate2' => ['id' => 'f0000000-0000-0000-0000-000000000002', 'email' => 'nouveau@test.com', 'email_confirmed_at' => null],
  'eyJlegit3'  => ['id' => 'f0000000-0000-0000-0000-000000000003', 'email' => 'legit@test.com', 'email_confirmed_at' => date('c')],
];
// Réponse de Supabase selon le jeton présenté.
$db = load_db();
$tryTok = function (string $tok) use (&$db, $authUsers) {
  $GLOBALS['OROLADO_FAKE_HTTP'] = fn(string $url) => str_contains($url, '/auth/v1/user') ? $authUsers[$tok] : [];
  return orolado_session_user($db, $tok);
};
check('e-mail d’un joueur existant (moi@test.com) : pas de compte en double', $tryTok('eyJpirate1') === null && !isset($db['users']['f0000000-0000-0000-0000-000000000001']));
check('e-mail non confirmé : refusé', $tryTok('eyJpirate2') === null);
check('vrai compte Supabase confirmé, e-mail libre : accepté', is_array($tryTok('eyJlegit3')));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
