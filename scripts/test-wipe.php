<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Test du bouton « Nettoyer » (fausse base, dossier temporaire : rien ne part en ligne).
 * Garde l'admin + les @gmail.com, efface VRAIMENT tout le reste, partout.
 */
$tmp = sys_get_temp_dir() . '/orolado_wipe_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
mkdir($tmp . '/data/kicks', 0755, true);
foreach (['orolado_lib.php', 'wipe_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
require $tmp . '/wipe_lib.php';

$U = static fn(int $n): string => sprintf('%08d-aaaa-bbbb-cccc-%012d', $n, $n);
$admin = $U(1); $gmail = $U(2); $fake1 = $U(3); $fake2 = $U(4);
$profiles = [
  ['id' => $admin, 'email' => 'admin@orolado.com', 'display_name' => 'Admin', 'role' => 'admin'],
  ['id' => $gmail, 'email' => 'vraijoueur@gmail.com', 'display_name' => 'Vrai'],
  ['id' => $fake1, 'email' => 'cc33@laoia.com', 'display_name' => 'Faux 1'],
  ['id' => $fake2, 'email' => 'x9@tempmail.xyz', 'display_name' => 'Faux 2'],
];
$authUsers = array_map(static fn($p) => ['id' => $p['id'], 'email' => $p['email']], $profiles);
$calls = [];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$calls, $profiles, $authUsers) {
  $calls[] = $method . ' ' . $url;
  if ($method === 'GET' && str_contains($url, '/rest/v1/profiles')) return str_contains($url, 'offset=0') ? $profiles : [];
  if ($method === 'GET' && str_contains($url, '/auth/v1/admin/users')) return str_contains($url, 'page=1') ? ['users' => $authUsers] : ['users' => []];
  return [];
};

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$db = blank_db();
$db['users']['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin'];
$db['users'][$gmail] = ['id' => $gmail, 'email' => 'vraijoueur@gmail.com'];
$db['users']['u_court'] = ['id' => 'u_court', 'email' => 'cc33@laoia.com', 'sbId' => $fake1];
$db['users'][$fake2] = ['id' => $fake2, 'email' => 'x9@tempmail.xyz'];
$db['vault'] = [$gmail => ['real' => 12, 'demo' => 1], 'u_court' => ['real' => 900, 'demo' => 1], $fake2 => ['real' => 5000, 'demo' => 1]];
$db['deposits'] = [['id' => 'd1', 'userId' => $gmail, 'amount' => 12], ['id' => 'd2', 'userId' => 'u_court', 'amount' => 900], ['id' => 'd3', 'userId' => $fake2, 'amount' => 5000]];
$db['withdrawals'] = [['id' => 'w1', 'userId' => $fake2, 'amount' => 100]];
$db['orders'] = [['id' => 'o1', 'userId' => $gmail], ['id' => 'o2', 'userId' => 'u_court']];
$db['support_messages'] = [['id' => 'm1', 'userId' => $fake2], ['id' => 'm2', 'userId' => $gmail]];
$db['sessions'] = ['tA' => ['userId' => 'admin_master'], 'tG' => ['userId' => $gmail], 'tF' => ['userId' => $fake2]];
$db['pendingRegistrations'] = ['nouveau@yopmail.com' => ['email' => 'nouveau@yopmail.com']];
save_db(orolado_data_file(), $db);
file_put_contents($tmp . '/data/archive/orders-2026-09.jsonl', json_encode(['id' => 'a1', 'userId' => $gmail]) . "\n" . json_encode(['id' => 'a2', 'userId' => $fake2]) . "\n");
file_put_contents($tmp . '/data/otp_mail.log', "x\n");
file_put_contents($tmp . '/data/admin_cache_profiles_epoch2.json', '{}');

echo "1) Aperçu : rien n'est touché\n";
$plan = orolado_wipe_plan(true);
$emails = static fn(array $rows): array => array_map(static fn($r) => $r['email'], $rows);
check('gardés : admin + @gmail.com', array_values(array_diff($emails($plan['keep']), ['admin@orolado.com', 'vraijoueur@gmail.com'])) === [] && $plan['nKeep'] === 2, implode(', ', $emails($plan['keep'])));
check('supprimés : les 2 faux comptes', $plan['nDelete'] === 2, implode(', ', $emails($plan['delete'])));
check('l’aperçu n’a rien effacé', count(load_db()['users']) === 4 && !array_filter($calls, static fn($c) => str_starts_with($c, 'DELETE')));
$planAll = orolado_wipe_plan(false);
check('sans la case @gmail.com : seul l’admin est gardé', $planAll['nKeep'] === 1 && $planAll['nDelete'] === 3);

echo "2) Sécurités\n";
$r = orolado_wipe_run(true, 'supprimer svp');
check('mauvais mot de confirmation : refusé, rien effacé', empty($r['ok']) && count(load_db()['users']) === 4);

echo "3) Suppression définitive\n";
$r = orolado_wipe_run(true, 'SUPPRIMER');
check('nettoyage terminé', !empty($r['ok']) && empty($r['more']), json_encode($r));
$db = load_db();
$keptIds = orolado_map_keys($db['users']);
sort($keptIds);
$wantIds = ['admin_master', $gmail];
sort($wantIds);
check('fichier du site : seuls admin + gmail restent', $keptIds === $wantIds, implode(',', $keptIds));
check('soldes des faux comptes effacés, celui du vrai joueur intact', !isset($db['vault'][$fake2]) && !isset($db['vault']['u_court']) && (float) $db['vault'][$gmail]['real'] === 12.0);
check('dépôts / retraits / trades des faux comptes effacés, ceux du vrai joueur gardés',
  array_column($db['deposits'], 'id') === ['d1'] && $db['withdrawals'] === [] && array_column($db['orders'], 'id') === ['o1']);
check('messages et sessions des faux comptes effacés', array_column($db['support_messages'], 'id') === ['m2'] && !isset($db['sessions']['tF']) && isset($db['sessions']['tA'], $db['sessions']['tG']));
check('inscriptions en attente effacées', orolado_map_array($db['pendingRegistrations'] ?? []) === []);
$arch = (string) file_get_contents($tmp . '/data/archive/orders-2026-09.jsonl');
check('archives d’historique : plus de trace des faux comptes', str_contains($arch, 'a1') && !str_contains($arch, 'a2'));
check('journaux et caches du tableau effacés', !is_file($tmp . '/data/otp_mail.log') && !is_file($tmp . '/data/admin_cache_profiles_epoch2.json'));
$del = array_values(array_filter($calls, static fn($c) => str_starts_with($c, 'DELETE')));
$needTables = ['orders', 'deposits', 'withdrawals', 'transactions', 'vaults', 'profiles'];
$okTables = true;
foreach ($needTables as $tb) {
  $hit = false;
  foreach ($del as $c) if (str_contains($c, '/rest/v1/' . $tb . '?') && str_contains($c, 'not.in.(') && str_contains($c, $admin) && str_contains($c, $gmail)) $hit = true;
  if (!$hit) $okTables = false;
}
check('base : 6 tables nettoyées en gardant admin + gmail', $okTables);
$authDel = array_values(array_filter($del, static fn($c) => str_contains($c, '/auth/v1/admin/users/')));
check('base : comptes de connexion des 2 faux supprimés, jamais admin ni gmail',
  count($authDel) === 2 && !array_filter($authDel, static fn($c) => str_contains($c, $admin) || str_contains($c, $gmail)), implode(' | ', $authDel));

echo "4) Suppression d'UN compte coché (après un bannissement par exemple)\n";
$fake3 = $U(5);
$db = load_db();
$db['users'][$fake3] = ['id' => $fake3, 'email' => 'banni@test.com'];
$db['users']['u_autre'] = ['id' => 'u_autre', 'email' => 'autre@test.com'];
$db['vault'][$fake3] = ['real' => 50, 'demo' => 1];
$db['vault']['u_autre'] = ['real' => 70, 'demo' => 1];
$db['deposits'][] = ['id' => 'd9', 'userId' => $fake3, 'amount' => 50];
$db['deposits'][] = ['id' => 'd10', 'userId' => 'u_autre', 'amount' => 70];
$db['blocked_identities'] = ['email:banni@test.com' => ['kind' => 'suspended']];
$db['admin_logs'] = [['type' => 'debit']];
save_db(orolado_data_file(), $db);
$calls = [];
$r = orolado_wipe_run(true, 'SUPPRIMER', ['banni@test.com', $fake3]);
$db = load_db();
check('suppression ciblée terminée', !empty($r['ok']) && $r['deletedAccounts'] === 1, json_encode($r));
check('le compte coché a disparu (fiche, solde, dépôt)', !isset($db['users'][$fake3]) && !isset($db['vault'][$fake3]) && !in_array('d9', array_column($db['deposits'], 'id'), true));
check('les comptes non cochés restent intacts (même non-gmail)', isset($db['users']['u_autre'], $db['users'][$gmail]) && (float) $db['vault']['u_autre']['real'] === 70.0 && in_array('d10', array_column($db['deposits'], 'id'), true));
check('un banni supprimé reste bloqué (ne peut pas se réinscrire)', isset($db['blocked_identities']['email:banni@test.com']) && count($db['admin_logs'] ?? []) === 1);
$del = array_values(array_filter($calls, static fn($c) => str_starts_with($c, 'DELETE')));
$onlyHim = true;
foreach ($del as $c) if (!str_contains($c, $fake3)) $onlyHim = false;
check('base : seuls les identifiants du compte coché sont visés', $del !== [] && $onlyHim, implode(' | ', array_slice($del, 0, 3)));
$r = orolado_wipe_run(true, 'SUPPRIMER', ['admin@orolado.com']);
check('cocher l’admin ne le supprime jamais', empty($r['ok']) && isset(load_db()['users']['admin_master']), (string) ($r['reason'] ?? ''));

echo "5) Supprimer un joueur NON banni : son e-mail est bloqué pour toujours\n";
$r = orolado_wipe_run(true, 'SUPPRIMER', ['autre@test.com', 'u_autre']);
$db = load_db();
check('suppression faite', !empty($r['ok']) && !isset($db['users']['u_autre']), json_encode($r));
$blk = orolado_identity_block($db, 'Autre@Test.com');
check('son e-mail ne peut plus servir (inscription / connexion / mot de passe oublié)', is_array($blk) && ($blk['kind'] ?? '') === 'deleted', json_encode($blk));
check('le vrai joueur gmail n’est pas bloqué', orolado_identity_block($db, 'vraijoueur@gmail.com') === null);

echo "6) Suspendre un joueur qui a 2 fiches (fiche courte + fiche de la base)\n";
$sus = $U(7);
$db = load_db();
$db['users']['u_sus'] = ['id' => 'u_sus', 'email' => 'fraudeur@test.com', 'sbId' => $sus];
$db['users'][$sus] = ['id' => $sus, 'email' => 'fraudeur@test.com'];
$db['sessions']['tokCourt'] = ['userId' => 'u_sus', 'createdAt' => date('c'), 'lastSeen' => time()];
$db['sessions']['tokBase'] = ['userId' => $sus, 'createdAt' => date('c'), 'lastSeen' => time()];
save_db(orolado_data_file(), $db);
$db = load_db();
orolado_force_suspend($db, $sus, 'suspended', 'fraudeur@test.com');
save_db(orolado_data_file(), $db);
$db = load_db();
check('les DEUX fiches sont suspendues', orolado_user_block_kind($db, 'u_sus') === 'suspended' && orolado_user_block_kind($db, $sus) === 'suspended');
check('ses connexions sur les deux fiches sont coupées', !isset($db['sessions']['tokCourt']) && !isset($db['sessions']['tokBase']));
check('il ne peut plus jouer avec l’ancienne connexion', orolado_session_user($db, 'tokCourt') === null);
check('son e-mail est bloqué (pas de nouveau compte)', is_array(orolado_identity_block($db, 'fraudeur@test.com')));
check('l’admin n’est jamais touché', orolado_user_block_kind($db, 'admin_master') === '');

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
