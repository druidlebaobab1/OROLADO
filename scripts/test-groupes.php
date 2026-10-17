<?php
// v2706 — Groupes : « Ajouter des membres » (contacts seulement). Ligne de commande, dossier temporaire, rien en ligne.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$tmp = sys_get_temp_dir() . '/orolado_grp_' . bin2hex(random_bytes(4)); mkdir($tmp, 0755, true);
foreach (['orolado_lib.php', 'live_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php'; require $tmp . '/live_lib.php';
$ok = 0; $ko = 0; $chk = function ($c, $m) use (&$ok, &$ko) { echo ($c ? '  OK   ' : '  ÉCHEC ') . $m . "\n"; $c ? $ok++ : $ko++; };
$A = ['id' => 'uA', 'displayName' => 'Awa']; $B = ['id' => 'uB', 'displayName' => 'Bakary']; $C = ['id' => 'uC', 'displayName' => 'Cheikh']; $D = ['id' => 'uD', 'displayName' => 'Dado'];
foreach ([$A, $B, $C, $D] as $u) live_oro_id($u);
live_dm_send('uA', 'uB', 'salut'); live_dm_send('uA', 'uC', 'yo'); // A a 2 contacts : B et C (pas D)
$g = live_group_create('uA', 'Les traders', '🔥')['g'];
$r = live_group_add('uA', $g['id'], ['uB', 'uD']);
$chk(!empty($r['ok']) && $r['added'] === ['uB'], 'A ajoute B (contact) ; D refusé (pas un contact)');
$chk(in_array($g['id'], live_ugroups('uB'), true), 'le groupe apparaît dans la liste de B');
$g2 = live_group_get($g['id']); $last = end($g2['msgs']);
$chk(($last['sys'] ?? '') === 'add' && $last['w'] === 'uB', 'ligne « Awa a ajouté Bakary » dans la discussion');
$r = live_group_add('uA', $g['id'], ['uB']);
$chk(empty($r['added']), 'ajouter deux fois la même personne : rien ne change');
live_set_block('uC', 'uA', true);
$r = live_group_add('uA', $g['id'], ['uC']);
$chk(empty($r['ok']) || empty($r['added']), 'C a bloqué A : A ne peut pas l’ajouter');
live_set_block('uC', 'uA', false);
$r = live_group_add('uD', $g['id'], ['uA']);
$chk(empty($r['ok']), 'un non-membre ne peut ajouter personne');
live_group_leave('uB', $g['id']);
$chk(!in_array('uB', live_group_get($g['id'])['members'], true), 'B peut quitter le groupe');
live_dm_send('uB', 'uC', 'hey'); live_group_add('uA', $g['id'], ['uB', 'uC']);
live_group_leave('uA', $g['id'], 'uC'); // le créateur retire C
$r = live_group_add('uB', $g['id'], ['uC']);
$chk(empty($r['added']), 'C retiré par le créateur : un simple membre ne peut pas le remettre');
$r = live_group_add('uA', $g['id'], ['uC']);
$chk(($r['added'] ?? []) === ['uC'], 'le créateur peut le remettre');
// v2790 (propriétaire) : seul le créateur écrit ; invitations à accepter ; 5 créations par 90 jours
$chk(!empty(live_group_send('uA', $g['id'], 'Bonjour à tous')['ok']), 'le créateur écrit dans son groupe');
$r = live_group_send('uC', $g['id'], 'moi aussi');
$chk(empty($r['ok']) && ($r['reason'] ?? '') === 'gOwnerOnly', 'un membre ne peut pas écrire (seul le créateur)');
$E = ['id' => 'uE', 'displayName' => 'Eli']; live_oro_id($E);
$chk(live_group_invite('uA', $g['id'], 'uE') === 'ok', 'A invite E (pas besoin d’être contact)');
$chk(!in_array('uE', live_group_get($g['id'])['members'], true), 'E n’est PAS dans le groupe tant qu’il n’a pas accepté');
$chk(count(live_group_invites('uE')) === 1, 'E voit l’invitation');
$r = live_group_answer('uE', $g['id'], false);
$chk(!empty($r['refused']) && !in_array('uE', live_group_get($g['id'])['members'], true) && !live_group_invites('uE'), 'E refuse : il n’entre pas, l’invitation disparaît');
live_group_invite('uA', $g['id'], 'uE');
$r = live_group_answer('uE', $g['id'], true);
$chk(!empty($r['ok']) && in_array('uE', live_group_get($g['id'])['members'], true) && in_array($g['id'], live_ugroups('uE'), true), 'E accepte : il entre dans le groupe');
$chk(live_group_invite('uA', $g['id'], 'uE') === 'in', 'inviter quelqu’un déjà membre : rien');
$F = ['id' => 'uF', 'displayName' => 'Fanta']; live_oro_id($F);
live_set_block('uF', 'uA', true);
$chk(live_group_invite('uA', $g['id'], 'uF') === 'skip', 'F a bloqué A : pas d’invitation');
for ($i = 0; $i < 4; $i++) live_group_create('uA', 'Groupe ' . $i, '🔥');
$r = live_group_create('uA', 'Groupe 6', '🔥');
$chk(empty($r['ok']) && ($r['reason'] ?? '') === 'tooManyG', '6e groupe en 90 jours refusé (message doux)');
live_update(live_ugroups_file('uA'), function ($q) { $q['made'] = array_map(static fn($t) => $t - 91 * 86400, (array) $q['made']); return ['ok' => true, '__write' => $q]; });
$chk(!empty(live_group_create('uA', 'Groupe après 90 jours', '🔥')['ok']), 'après 90 jours, on peut recréer');
$chk(count(live_ugroups('uA')) >= 6, 'un joueur peut être dans plusieurs groupes');
echo "\nRÉSULTAT : $ok OK, $ko échec(s)\n";
