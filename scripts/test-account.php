<?php
declare(strict_types=1);
/**
 * Test du changement d'e-mail et de « Déconnecter mes autres appareils »
 * (fausse base Supabase, faux e-mails, dossier data/ temporaire : rien ne part en ligne).
 */
$tmp = sys_get_temp_dir() . '/orolado_acc_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'account_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
require $tmp . '/account_lib.php';

$sb = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
$other = 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee';
$auth = [$sb => ['email' => 'ancien@test.com', 'password' => 'Ancien123'], $other => ['email' => 'pris@test.com', 'password' => 'x']];
$profiles = [$sb => 'ancien@test.com', $other => 'pris@test.com'];
$logouts = [];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$auth, &$profiles, &$logouts) {
  $b = $body ? json_decode($body, true) : [];
  if (preg_match('#/auth/v1/admin/users/([0-9a-f-]+)/logout$#', $url, $m)) { $logouts[] = $m[1]; return []; }
  if (preg_match('#/auth/v1/admin/users/([0-9a-f-]+)$#', $url, $m) && $method === 'PUT') {
    if (!isset($auth[$m[1]])) return null;
    if (isset($b['email'])) $auth[$m[1]]['email'] = $b['email'];
    if (isset($b['password'])) $auth[$m[1]]['password'] = $b['password'];
    return ['id' => $m[1], 'email' => $auth[$m[1]]['email']];
  }
  if (str_contains($url, '/rest/v1/profiles?email=eq.')) {
    preg_match('/email=eq\.([^&]+)/', $url, $m);
    $e = rawurldecode($m[1]);
    $out = [];
    foreach ($profiles as $id => $pe) if ($pe === $e) $out[] = ['id' => $id];
    return $out;
  }
  if (preg_match('#/rest/v1/profiles\?id=eq\.([0-9a-f-]+)#', $url, $m) && $method === 'PATCH') {
    $profiles[rawurldecode($m[1])] = $b['email'];
    return [];
  }
  return [];
};
$mails = [];
$GLOBALS['OROLADO_FAKE_MAIL'] = function (string $to, string $code) use (&$mails) { $mails[] = [$to, $code]; return ['ok' => true]; };
function lastCodeFor(array $mails, string $to): string {
  for ($i = count($mails) - 1; $i >= 0; $i--) if ($mails[$i][0] === $to) return $mails[$i][1];
  return '';
}
/** Même recherche que l'action « login » d'api.php (e-mail OU originalEmail). */
function loginFinds(array $db, string $email): ?string {
  foreach ($db['users'] as $id => $u) {
    if (in_array($email, [strtolower((string) ($u['email'] ?? '')), strtolower((string) ($u['originalEmail'] ?? ''))], true)) return (string) $id;
  }
  return null;
}

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$db = blank_db();
$db['users']['u1'] = ['id' => 'u1', 'email' => 'ancien@test.com', 'originalEmail' => 'ancien@test.com', 'sbId' => $sb, 'createdAt' => '2026-01-01T00:00:00+00:00'];
$db['users']['u2'] = ['id' => 'u2', 'email' => 'pris@test.com', 'sbId' => $other];
$db['sessions'] = ['tokA' => ['userId' => 'u1'], 'tokB' => ['userId' => 'u1'], 'tokC' => ['userId' => 'u1'], 'tokX' => ['userId' => 'u2']];
save_db(orolado_data_file(), $db);
$db = load_db();
$me = $db['users']['u1'];

echo "1) Refus propres\n";
$r = orolado_email_change_start($db, $me, 'pas-une-adresse');
check('adresse invalide refusée', empty($r['ok']));
$r = orolado_email_change_start($db, $me, 'ancien@test.com');
check('même adresse refusée', empty($r['ok']));
$r = orolado_email_change_start($db, $me, 'pris@test.com');
check('adresse d’un autre compte refusée', empty($r['ok']) && ($r['code'] ?? '') === 'taken');
check('aucun e-mail envoyé pour ces refus', count($mails) === 0);

echo "2) Code envoyé à l'ANCIENNE adresse d'abord\n";
$r = orolado_email_change_start($db, $me, 'Nouveau@Test.com');
check('demande acceptée', !empty($r['ok']) && $r['step'] === 'old', json_encode($r));
check('code parti à ancien@test.com', lastCodeFor($mails, 'ancien@test.com') !== '' && lastCodeFor($mails, 'nouveau@test.com') === '');
check('rien n’est encore changé', $db['users']['u1']['email'] === 'ancien@test.com' && $auth[$sb]['email'] === 'ancien@test.com');
$bad = lastCodeFor($mails, 'ancien@test.com') === '000000' ? '111111' : '000000';
$r = orolado_email_change_verify($db, $me, $bad, 'tokA');
check('mauvais code refusé', empty($r['ok']) && ($r['code'] ?? '') === 'bad');

echo "3) Bon code de l'ancienne → code envoyé à la NOUVELLE\n";
$oldCode = lastCodeFor($mails, 'ancien@test.com');
$r = orolado_email_change_verify($db, $me, $oldCode, 'tokA');
check('étape suivante', !empty($r['ok']) && $r['step'] === 'new', json_encode($r));
check('code parti à nouveau@test.com', lastCodeFor($mails, 'nouveau@test.com') !== '');
$r = orolado_email_change_verify($db, $me, $oldCode === lastCodeFor($mails, 'nouveau@test.com') ? '222222' : $oldCode, 'tokA');
check('l’ancien code ne valide pas la nouvelle adresse', empty($r['ok']));
check('toujours rien de changé avant le 2e code', $db['users']['u1']['email'] === 'ancien@test.com');

echo "4) Bon code de la nouvelle → changement appliqué partout\n";
$r = orolado_email_change_verify($db, $me, lastCodeFor($mails, 'nouveau@test.com'), 'tokA');
check('changement confirmé', !empty($r['ok']) && $r['step'] === 'done', json_encode($r));
save_db(orolado_data_file(), $db);
$db = load_db();
check('fiche : nouvelle adresse', $db['users']['u1']['email'] === 'nouveau@test.com');
check('connexion Supabase : nouvelle adresse', $auth[$sb]['email'] === 'nouveau@test.com');
check('profil Supabase : nouvelle adresse', $profiles[$sb] === 'nouveau@test.com');
check('connexion avec la NOUVELLE adresse trouve le compte', loginFinds($db, 'nouveau@test.com') === 'u1');
check('connexion avec l’ANCIENNE adresse ne trouve plus rien', loginFinds($db, 'ancien@test.com') === null);
check('cet appareil reste connecté', isset($db['sessions']['tokA']));
check('les autres appareils sont déconnectés', !isset($db['sessions']['tokB']) && !isset($db['sessions']['tokC']));
check('l’autre joueur n’est pas touché', isset($db['sessions']['tokX']) && $db['users']['u2']['email'] === 'pris@test.com');
check('historique gardé pour l’admin', ($db['users']['u1']['emailHistory'][0]['from'] ?? '') === 'ancien@test.com');
check('date d’inscription conservée', ($db['users']['u1']['createdAt'] ?? '') === '2026-01-01T00:00:00+00:00');
check('plus de demande en attente', empty($db['pendingEmailChanges']['u1']));

echo "5) Nouveau mot de passe avec la nouvelle adresse\n";
$ok = orolado_overwrite_user_password($db, 'nouveau@test.com', 'Nouveau456', 'tokA');
check('mot de passe remplacé', $ok && password_verify('Nouveau456', $db['users']['u1']['passwordHash']));
check('Supabase : nouveau mot de passe', $auth[$sb]['password'] === 'Nouveau456');
check('l’ancien mot de passe ne marche plus', !password_verify('Ancien123', $db['users']['u1']['passwordHash']));

echo "6) Déconnecter mes autres appareils\n";
$db['sessions']['tokD'] = ['userId' => 'u1'];
$db['sessions']['tokE'] = ['userId' => 'u1'];
$n = orolado_logout_other_devices($db, 'u1', 'tokA');
check('2 appareils fermés, celui-ci gardé', $n === 2 && isset($db['sessions']['tokA']) && !isset($db['sessions']['tokD']), (string) $n);
check('Supabase déconnecté aussi', in_array($sb, $logouts, true));

echo "7) 10 déconnexions / reconnexions de suite\n";
$okAll = true;
for ($i = 0; $i < 10; $i++) {
  $t = 'cyc' . $i;
  $db['sessions'][$t] = orolado_new_session('u1');
  save_db(orolado_data_file(), $db);
  $db = load_db();
  $okAll = $okAll && orolado_session_user($db, $t) !== null;
  unset($db['sessions'][$t]);
  save_db(orolado_data_file(), $db);
  $db = load_db();
  $okAll = $okAll && orolado_session_user($db, $t) === null;
}
check('chaque connexion valide, chaque déconnexion effective', $okAll);

echo "8) Joueur présent 2 fois (fiche à id court + fiche de la base) : l'ancienne adresse disparaît partout\n";
$sb2 = 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee';
$auth[$sb2] = ['email' => 'double@test.com', 'password' => 'x'];
$profiles[$sb2] = 'double@test.com';
$db['users']['u_court'] = ['id' => 'u_court', 'email' => 'double@test.com', 'originalEmail' => 'double@test.com', 'sbId' => $sb2, 'passwordHash' => password_hash('Vieux1', PASSWORD_BCRYPT)];
$db['users'][$sb2] = ['id' => $sb2, 'email' => 'double@test.com', 'passwordHash' => password_hash('Vieux1', PASSWORD_BCRYPT)];
$db['sessions']['tokCourt'] = ['userId' => 'u_court'];
$db['sessions']['tokBase'] = ['userId' => $sb2];
$db['sessions']['tokAutre'] = ['userId' => $sb2];
$me2 = $db['users'][$sb2];
orolado_email_change_start($db, $me2, 'unique@test.com');
orolado_email_change_verify($db, $me2, lastCodeFor($mails, 'double@test.com'), 'tokBase');
$r = orolado_email_change_verify($db, $me2, lastCodeFor($mails, 'unique@test.com'), 'tokBase');
check('changement confirmé', !empty($r['ok']) && ($r['step'] ?? '') === 'done', json_encode($r));
save_db(orolado_data_file(), $db);
$db = load_db();
check('les 2 fiches ont la nouvelle adresse', $db['users']['u_court']['email'] === 'unique@test.com' && $db['users'][$sb2]['email'] === 'unique@test.com');
check('l’ancienne adresse ne trouve plus aucun compte', loginFinds($db, 'double@test.com') === null);
$hitOld = false;
foreach ($db['users'] as $u) foreach (['email', 'originalEmail'] as $k) if (strtolower((string) ($u[$k] ?? '')) === 'double@test.com') $hitOld = true;
check('plus aucune trace de l’ancienne adresse dans les fiches (hors historique admin)', !$hitOld);
check('Supabase : connexion et profil à la nouvelle adresse', $auth[$sb2]['email'] === 'unique@test.com' && $profiles[$sb2] === 'unique@test.com');
check('les sessions de l’autre fiche sont fermées, celle-ci reste', isset($db['sessions']['tokBase']) && !isset($db['sessions']['tokCourt']) && !isset($db['sessions']['tokAutre']));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
