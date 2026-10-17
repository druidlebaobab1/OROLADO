<?php
// v2777 — Identifiant unique « R + 8 signes au hasard ». Ligne de commande, dossier temporaire, rien en ligne.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$tmp = sys_get_temp_dir() . '/orolado_rid_' . bin2hex(random_bytes(4)); mkdir($tmp, 0755, true);
foreach (['orolado_lib.php', 'live_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php'; require $tmp . '/live_lib.php';
$ok = 0; $ko = 0; $chk = function ($c, $m) use (&$ok, &$ko) { echo ($c ? '  OK   ' : '  ÉCHEC ') . $m . "\n"; $c ? $ok++ : $ko++; };
$A = ['id' => 'uA', 'displayName' => 'Awa', 'publicId' => 'ORO-159978']; $B = ['id' => 'uB', 'displayName' => 'Bakary'];
live_oro_id($A); live_oro_id($B);
$m = live_read_json(live_ids_file(), []);
$ra = (string) ($m['r']['uA'] ?? ''); $rb = (string) ($m['r']['uB'] ?? '');
$chk(preg_match('/^R[2-9A-HJKMNP-TV-Z]{8}$/', $ra) === 1, "format R + 8 signes ($ra)");
$chk($ra !== $rb, 'deux joueurs = deux identifiants différents');
live_oro_id($A);
$chk((string) (live_read_json(live_ids_file(), [])['r']['uA'] ?? '') === $ra, 'identifiant gardé pour toujours');
$chk(live_norm_oro_id(strtolower(substr($ra, 0, 4)) . ' ' . substr($ra, 4)) === $ra, 'compris en minuscules et avec des espaces');
$chk(live_norm_oro_id('ORO159978') === '' && live_norm_oro_id('ORO-159978') === '' && live_norm_oro_id('159978') === '', 'ancien numéro ORO… refusé (ne se devine plus)');
$w = live_who($ra);
$chk(is_array($w) && $w['uid'] === 'uA' && $w['id'] === $ra, 'retrouve le bon joueur');
$chk(live_who('R' . str_repeat('Z', 8)) === null || live_who('R' . str_repeat('Z', 8))['uid'] !== 'uA', 'identifiant inventé = personne');
$oldOr = (string) ($m['u']['uB'] ?? '');
$wb = live_who(live_norm_oro_id($oldOr));
$chk(is_array($wb) && $wb['id'] === $rb, 'ancien code OR… encore compris, montré en R…');
$map = live_rids_for(['uA', 'uB', 'uC']);
$chk(($map['uA'] ?? '') === $ra && preg_match('/^R/', (string) ($map['uC'] ?? '')) === 1, 'admin : identifiants de tous, créés si besoin');
// 20 000 identifiants : jamais de doublon
$taken = []; for ($i = 0; $i < 20000; $i++) { $c = live_new_rid($taken); $taken[$c] = 1; }
$chk(count($taken) === 20000, '20 000 identifiants, aucun doublon');
printf("Possibilités : 30^8 = %s\n", number_format(30 ** 8, 0, ',', ' '));
echo "\nRÉSULTAT : $ok OK, $ko échec(s)\n";
exit($ko ? 1 : 0);
