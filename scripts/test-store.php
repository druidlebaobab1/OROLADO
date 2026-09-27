<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * RANGEMENT « UNE FICHE PAR JOUEUR » : passage automatique depuis l'ancien gros fichier (sans
 * rien perdre, avec copie de sécurité), index e-mail / id Supabase / n° public, connexions d'un
 * joueur, et plusieurs requêtes qui écrivent en même temps (vrais processus séparés).
 */
$tmp = sys_get_temp_dir() . '/orolado_store_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$file = orolado_data_file();

echo "1) Passage automatique depuis l'ancien gros fichier\n";
$old = blank_db();
for ($i = 0; $i < 300; $i++) {
  $id = 'u_' . $i;
  $old['users'][$id] = ['id' => $id, 'email' => "j$i@test.com", 'originalEmail' => "j$i@test.com", 'role' => 'user', 'publicId' => 'ORO-' . (500000 + $i), 'sbId' => sprintf('aaaaaaaa-0000-0000-0000-%012d', $i)];
  $old['vault'][$id] = ['demo' => 1000000, 'real' => $i];
  $old['sessions']['tok' . $i] = ['userId' => $id, 'at' => date('c')];
}
$old['pendingRegistrations']['nouveau@test.com'] = ['email' => 'nouveau@test.com', 'createdAtTs' => time()];
$old['withdrawOtps']['u_7'] = ['codeHash' => 'x', 'expiresAt' => time() + 600];
$old['deposits'][] = ['id' => 'd1', 'userId' => 'u_3', 'amount' => 10, 'status' => 'COMPLETED'];
file_put_contents($file, json_encode($old));
$db = load_db();
check('les 300 joueurs sont retrouvés', count(orolado_map_array($db['users'])) === 300);
check('leurs soldes sont intacts', (float) ($db['vault']['u_250']['real'] ?? -1) === 250.0);
check('les connexions marchent toujours (personne n’est déconnecté)', is_array(orolado_session_user($db, 'tok42')));
check('codes en attente gardés (inscription, retrait)', isset($db['pendingRegistrations']['nouveau@test.com'], $db['withdrawOtps']['u_7']));
check('les dépôts restent dans le fichier principal', count($db['deposits']) === 1);
$core = json_decode((string) file_get_contents($file), true);
check('le fichier principal ne contient plus les joueurs (petit)', !isset($core['users']) && filesize($file) < 2000, filesize($file) . ' octets');
check('copie de sécurité complète de l’ancien fichier gardée', count(glob($tmp . '/data/archive/orolado-avant-fiches-*.json') ?: []) === 1);

echo "2) Index (recherches rapides)\n";
check('par e-mail', array_keys(orolado_users_by_email($db, 'J120@test.com')) === ['u_120']);
check('par id Supabase', array_keys(orolado_users_by_sb($db, sprintf('aaaaaaaa-0000-0000-0000-%012d', 77))) === ['u_77']);
check('n° public déjà pris', orolado_public_id_taken($db, 'ORO-500010') && !orolado_public_id_taken($db, 'ORO-999999'));
check('connexions d’un joueur', array_keys(orolado_sessions_of_user($db, 'u_5')) === ['tok5']);
$db['users']['u_5']['email'] = 'change@test.com';
$db['users']['u_5']['originalEmail'] = 'change@test.com';
save_db($file, $db);
unset($GLOBALS['OROLADO_DB_BASE']);
$db = load_db();
check('changement d’e-mail : l’index suit (nouvelle adresse trouvée…)', array_keys(orolado_users_by_email($db, 'change@test.com')) === ['u_5']);
check('… et l’ancienne ne trouve plus rien', orolado_users_by_email($db, 'j5@test.com') === []);
unset($db['users']['u_9']);
save_db($file, $db);
unset($GLOBALS['OROLADO_DB_BASE']);
$db = load_db();
check('compte supprimé : plus trouvable ni par e-mail ni par id', !isset($db['users']['u_9']) && orolado_users_by_email($db, 'j9@test.com') === []);

echo "3) Plusieurs requêtes en même temps (vrais processus)\n";
$worker = <<<'W'
<?php
require $argv[1] . '/orolado_lib.php';
$me = $argv[2];
for ($k = 0; $k < 25; $k++) {
  // Comme le site : lecture sans verrou, puis enregistrement (fusion) ou écriture sous verrou.
  if ($k % 2) {
    unset($GLOBALS['OROLADO_DB_BASE']);
    $db = load_db();
    $db['users'][$me]['n'] = ($db['users'][$me]['n'] ?? 0) + 1;
    $db['deposits'][] = ['id' => $me . '_' . $k, 'userId' => $me, 'amount' => 1, 'status' => 'PENDING'];
    save_db(orolado_data_file(), $db);
  } else {
    with_db_lock(function ($box) use ($me, $k) {
      $box->db['users'][$me]['n'] = ($box->db['users'][$me]['n'] ?? 0) + 1;
      $box->db['sessions']['w' . $me . '_' . $k] = ['userId' => $me, 'at' => date('c')];
      return ['ok' => true];
    });
  }
}
echo 'fini';
W;
file_put_contents($tmp . '/worker.php', $worker);
$procs = []; $pipes = [];
foreach (['u_10', 'u_11', 'u_12', 'u_13', 'u_14', 'u_15'] as $i => $who) {
  $procs[$i] = proc_open(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($tmp . '/worker.php') . ' ' . escapeshellarg($tmp) . ' ' . $who, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes[$i]);
}
$outs = [];
foreach ($procs as $i => $p) { $outs[] = stream_get_contents($pipes[$i][1]) . stream_get_contents($pipes[$i][2]); fclose($pipes[$i][1]); fclose($pipes[$i][2]); proc_close($p); }
unset($GLOBALS['OROLADO_DB_BASE']);
$db = load_db();
$ok = true; $bad = [];
foreach (['u_10', 'u_11', 'u_12', 'u_13', 'u_14', 'u_15'] as $who) {
  if ((int) ($db['users'][$who]['n'] ?? 0) < 13) { $ok = false; $bad[] = $who . '=' . (int) ($db['users'][$who]['n'] ?? 0); }
}
check('6 processus × 25 écritures : aucune erreur', count(array_filter($outs, fn($o) => trim($o) !== 'fini')) === 0, implode(' | ', array_map('trim', $outs)));
check('les écritures « sous verrou » de chacun sont toutes gardées (≥ 13 par joueur)', $ok, implode(', ', $bad));
check('aucun dépôt perdu (6 × 12 ajoutés en même temps)', count(array_filter($db['deposits'], fn($d) => str_starts_with((string) ($d['id'] ?? ''), 'u_1'))) === 72, (string) count($db['deposits']));
check('aucune connexion perdue (6 × 13)', count(array_filter(orolado_map_keys($db['sessions']), fn($t) => str_starts_with((string) $t, 'wu_1'))) === 78);
check('les autres joueurs n’ont pas été touchés', (float) ($db['vault']['u_200']['real'] ?? -1) === 200.0 && count(orolado_map_array($db['users'])) === 299);
check('aucun fichier temporaire oublié', count(glob($tmp . '/data/store/*/*/*.tmp') ?: []) === 0);

echo "4) Juste après une mise en ligne : un vieux code en mémoire écrit encore à l'ancienne\n";
// Ce que ferait l'ancien code (« me » sous verrou) : le fichier principal avec UN seul joueur, à moitié.
$core = json_decode((string) file_get_contents($file), true);
$core['users'] = ['u_20' => ['lastSeen' => 'vieux-code']];
$core['vault'] = ['u_20' => ['demo' => 123]];
file_put_contents($file, json_encode($core));
unset($GLOBALS['OROLADO_DB_BASE']);
$db = load_db();
check('aucun autre joueur effacé', count(orolado_map_array($db['users'])) === 299, (string) count(orolado_map_array($db['users'])));
check('le joueur touché garde son e-mail et reçoit le changement', ($db['users']['u_20']['email'] ?? '') === 'j20@test.com' && ($db['users']['u_20']['lastSeen'] ?? '') === 'vieux-code');
check('son solde réel n’est pas écrasé (seul le démo change)', (float) ($db['vault']['u_20']['real'] ?? -1) === 20.0 && (float) ($db['vault']['u_20']['demo'] ?? 0) === 123.0);
check('les connexions sont toujours là', is_array(orolado_session_user($db, 'tok42')));

echo "5) Réparation des index\n";
foreach (glob($tmp . '/data/store/_idx/*/*.json') ?: [] as $f) unlink($f);
unset($GLOBALS['OROLADO_DB_BASE']);
$db = load_db();
check('index effacé : e-mail introuvable', orolado_users_by_email($db, 'j42@test.com') === []);
orolado_store_rebuild_index();
check('après reconstruction : retrouvé', array_keys(orolado_users_by_email($db, 'j42@test.com')) === ['u_42'] && array_keys(orolado_sessions_of_user($db, 'u_42')) === ['tok42']);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
