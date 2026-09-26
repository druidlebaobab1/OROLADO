<?php
declare(strict_types=1);
/**
 * Test de l'enregistrement « à 3 versions » (save_db) : une requête qui avait lu une vieille
 * version du fichier ne doit plus effacer ce qu'une autre requête a ajouté entre-temps.
 */
$tmp = sys_get_temp_dir() . '/orolado_merge_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
copy(__DIR__ . '/../orolado_lib.php', $tmp . '/orolado_lib.php');
require $tmp . '/orolado_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . "\n"; }
$file = orolado_data_file();

// État de départ.
$db = blank_db();
$db['users']['u1'] = ['id' => 'u1', 'email' => 'a@x.local', 'lastSeen' => 'hier'];
$db['sessions']['tokVieux'] = ['uid' => 'u1'];
$db['deposits'][] = ['id' => 'd1', 'userId' => 'u1', 'status' => 'PENDING', 'amount' => 100];
file_put_contents($file, json_encode($db));

// Requête A (ex. « me » ou « upsert ») lit le fichier…
unset($GLOBALS['OROLADO_DB_BASE']);
$a = load_db($file);

// … pendant ce temps, d'autres requêtes écrivent (sous verrou, comme le vrai site) :
with_db_lock(function ($box) {
  $box->db['sessions']['tokNeuf'] = ['uid' => 'u1'];                        // connexion
  $box->db['deposits'][0]['status'] = 'COMPLETED';                          // dépôt crédité
  $box->db['deposits'][] = ['id' => 'd2', 'userId' => 'u2', 'status' => 'PENDING', 'amount' => 20]; // nouveau dépôt
  $box->db['users']['u2'] = ['id' => 'u2', 'email' => 'b@x.local'];        // nouvel inscrit
  return ['ok' => true];
});

// Requête A fait SES changements sur sa vieille copie, puis enregistre.
$a['users']['u1']['lastSeen'] = 'maintenant';
unset($a['sessions']['tokVieux']);                                          // déconnexion voulue
save_db($file, $a);

$f = json_decode((string) file_get_contents($file), true);
echo "Après l'enregistrement de la vieille copie :\n";
check('la nouvelle connexion (session) n’est PAS effacée → plus de « Session invalide »', isset($f['sessions']['tokNeuf']));
check('la déconnexion voulue est bien appliquée', !isset($f['sessions']['tokVieux']));
check('le dépôt crédité reste COMPLETED (pas de 2e crédit)', ($f['deposits'][0]['status'] ?? '') === 'COMPLETED');
check('le nouveau dépôt n’est PAS perdu', count(array_filter($f['deposits'], fn($d) => ($d['id'] ?? '') === 'd2')) === 1);
check('le nouvel inscrit n’est PAS perdu', isset($f['users']['u2']));
check('le changement de la requête A est gardé', ($f['users']['u1']['lastSeen'] ?? '') === 'maintenant');

// Suppression faite par une autre requête (ex. archivage d'un ordre) : pas de résurrection.
file_put_contents($file, json_encode(array_merge(blank_db(), ['orders' => [['id' => 'o1', 'status' => 'won'], ['id' => 'o2', 'status' => 'open']]])));
unset($GLOBALS['OROLADO_DB_BASE']);
$b = load_db($file);
with_db_lock(function ($box) { $box->db['orders'] = [['id' => 'o2', 'status' => 'open']]; return ['ok' => true]; }); // o1 archivé
$b['support_messages'][] = ['id' => 'm1', 'message' => 'bonjour'];
save_db($file, $b);
$g = json_decode((string) file_get_contents($file), true);
check('un ordre archivé par une autre requête ne revient pas', count(array_filter($g['orders'], fn($o) => ($o['id'] ?? '') === 'o1')) === 0);
check('le message de la requête est bien enregistré', count($g['support_messages']) === 1);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
