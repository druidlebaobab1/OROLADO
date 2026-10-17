<?php
// v2778 — Identifiant unique « R + 3 lettres + 3 chiffres » (facile à retenir, au hasard) + recherche par e-mail.
// Ligne de commande, dossier temporaire, rien en ligne.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$tmp = sys_get_temp_dir() . '/orolado_rid_' . bin2hex(random_bytes(4)); mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'live_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php'; require $tmp . '/live_lib.php';
$ok = 0; $ko = 0; $chk = function ($c, $m) use (&$ok, &$ko) { echo ($c ? '  OK   ' : '  ÉCHEC ') . $m . "\n"; $c ? $ok++ : $ko++; };
$db = load_db();
$db['users']['uA'] = ['id' => 'uA', 'displayName' => 'Awa', 'email' => 'awa@gmail.com', 'originalEmail' => 'awa.old@gmail.com', 'publicId' => 'ORO-159978', 'role' => 'user'];
$db['users']['uB'] = ['id' => 'uB', 'displayName' => 'Bakary', 'email' => 'bakary@yahoo.fr', 'role' => 'user'];
$db['users']['uG'] = ['id' => 'uG', 'displayName' => 'Invité', 'email' => 'guest_1@orolado.local', 'guest' => true];
$db['users']['uD'] = ['id' => 'uD', 'displayName' => 'Parti', 'email' => 'parti@gmail.com', 'deletedAt' => date('c')];
save_db(orolado_data_file(), $db);
live_oro_id($db['users']['uA']); live_oro_id($db['users']['uB']);
$m = live_read_json(live_ids_file(), []);
$ra = (string) ($m['r']['uA'] ?? ''); $rb = (string) ($m['r']['uB'] ?? '');
$chk(preg_match('/^R[A-HJKMNP-TV-Z]{3}[0-9]{3}$/', $ra) === 1, "format R + 3 lettres + 3 chiffres ($ra, $rb)");
$chk($ra !== $rb, 'deux joueurs = deux identifiants différents');
live_oro_id($db['users']['uA']);
$chk((string) (live_read_json(live_ids_file(), [])['r']['uA'] ?? '') === $ra, 'identifiant gardé pour toujours');
$typed = strtolower(substr($ra, 0, 4)) . ' ' . strtr(substr($ra, 4), '01', 'OI');
$chk(live_norm_oro_id($typed) === $ra, "compris en minuscules, avec espace, O tapé pour 0 ($typed)");
$chk(live_norm_oro_id('ORO159978') === '' && live_norm_oro_id('ORO-159978') === '' && live_norm_oro_id('159978') === '', 'ancien numéro ORO… refusé (ne se devine plus)');
$w = live_who(live_norm_oro_id($ra));
$chk(is_array($w) && $w['uid'] === 'uA' && $w['id'] === $ra, 'identifiant → bon joueur');
$w = live_who(live_norm_oro_id(' Awa@Gmail.com '));
$chk(is_array($w) && $w['uid'] === 'uA' && $w['id'] === $ra, 'e-mail (majuscules, espaces) → bon joueur, montré par son identifiant R…');
$chk(live_who(live_norm_oro_id('awa.old@gmail.com')) === null, 'ancien e-mail d’un compte : refusé');
$chk(live_who(live_norm_oro_id('guest_1@orolado.local')) === null && live_who(live_norm_oro_id('parti@gmail.com')) === null, 'compte invité ou supprimé : jamais trouvé');
$chk(live_who(live_norm_oro_id('personne@gmail.com')) === null && live_norm_oro_id('pas-un-email@') === '', 'e-mail inconnu ou faux : personne');
$oldOr = (string) ($m['u']['uB'] ?? '');
$wb = live_who(live_norm_oro_id($oldOr));
$chk(is_array($wb) && $wb['id'] === $rb, 'ancien code OR… encore compris, montré en R…');
$map = live_rids_for(['uA', 'uB', 'uC']);
$chk(($map['uA'] ?? '') === $ra && preg_match('/^R[A-Z]{3}\d{3}$/', (string) ($map['uC'] ?? '')) === 1, 'admin : identifiants de tous, créés si besoin');
// 300 000 identifiants : jamais de doublon, et ça passe tout seul à 4 lettres quand 30 % sont pris
$taken = []; for ($i = 0; $i < 300000; $i++) { $c = live_new_rid($taken); $taken[$c] = 1; }
$chk(count($taken) === 300000, '300 000 identifiants, aucun doublon');
$big = array_fill_keys(range(1, 3200000), 1);
$chk(preg_match('/^R[A-Z]{4}\d{3}$/', live_new_rid($big)) === 1, 'plus de 3,2 millions de joueurs → passe tout seul à R + 4 lettres + 3 chiffres');
printf("Possibilités : 3 lettres = %s ; 4 lettres = %s\n", number_format(22 ** 3 * 1000, 0, ',', ' '), number_format(22 ** 4 * 1000, 0, ',', ' '));
echo "\nRÉSULTAT : $ok OK, $ko échec(s)\n";
exit($ko ? 1 : 0);
