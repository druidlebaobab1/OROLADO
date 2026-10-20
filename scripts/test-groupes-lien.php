<?php
// v2905 — Groupes : lien d'invitation (aperçu + rejoindre), le créateur supprime (ne quitte pas), robustesse des vieux
// fichiers, limites de discussion. Ligne de commande, dossier temporaire, rien en ligne.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$tmp = sys_get_temp_dir() . '/orolado_glien_' . bin2hex(random_bytes(4)); mkdir($tmp, 0755, true);
foreach (['orolado_lib.php', 'live_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php'; require $tmp . '/live_lib.php';
$ok = 0; $ko = 0; $chk = function ($c, $m) use (&$ok, &$ko) { echo ($c ? '  OK   ' : '  ÉCHEC ') . $m . "\n"; $c ? $ok++ : $ko++; };
foreach ([['uA', 'Awa'], ['uB', 'Bakary'], ['uC', 'Cheikh'], ['uK', 'Kofi']] as [$id, $n]) live_oro_id(['id' => $id, 'displayName' => $n]);

// --- lien d'invitation ---
$g = live_group_create('uA', 'Les lions', '🦁')['g'];
$tok = $g['tok'];
$p = live_group_peek($tok, '');
$chk(!empty($p['ok']) && $p['g']['name'] === 'Les lions' && $p['g']['n'] === 1 && $p['g']['admin'] === 'Awa' && !isset($p['g']['member']), 'aperçu du lien sans compte : nom, 1 membre, créateur');
$chk(!isset($p['g']['msgs']) && !isset($p['g']['members']) && !isset($p['g']['tok']), 'l’aperçu ne montre ni messages, ni membres, ni jeton');
$p = live_group_peek($tok, 'uA');
$chk(!empty($p['g']['member']) && !empty($p['g']['mine']), 'le créateur qui ouvre son propre lien : déjà membre');
$p = live_group_peek($tok, 'uB');
$chk(empty($p['g']['member']), 'B (connecté) voit l’aperçu, pas encore membre');
$chk(empty(live_group_peek('deadbeef0000', 'uB')['ok']) && live_group_peek('deadbeef0000', 'uB')['reason'] === 'gGone', 'lien inconnu : message propre (gGone)');
$chk(empty(live_group_peek('', '')['ok']) && empty(live_group_peek('../../x', '')['ok']), 'lien vide ou bizarre : refusé sans erreur');
$r = live_group_join('uB', $tok);
$chk(!empty($r['ok']) && !empty($r['joined']) && in_array('uB', live_group_get($g['id'])['members'], true), 'B rejoint avec le lien');
$r = live_group_join('uB', $tok);
$chk(!empty($r['ok']) && !empty($r['already']) && count(live_group_get($g['id'])['members']) === 2, 'rejoindre deux fois : rien ne change (idempotent)');
$chk(in_array($g['id'], live_ugroups('uB'), true), 'le groupe apparaît dans la liste de B');
live_group_join('uK', $tok); live_group_leave('uA', $g['id'], 'uK');
$chk(empty(live_group_join('uK', $tok)['ok']) && empty(live_group_peek($tok, 'uK')['ok']), 'K retiré par le créateur : le lien ne le fait pas revenir');

// --- quitter / supprimer ---
$r = live_group_leave('uA', $g['id']);
$chk(empty($r['ok']) && ($r['reason'] ?? '') === 'gOwnerLeave' && live_group_get($g['id'])['owner'] === 'uA', 'le créateur ne peut pas « quitter » (groupe jamais orphelin)');
$r = live_group_delete('uB', $g['id']);
$chk(empty($r['ok']) && live_group_get($g['id']) !== null, 'un membre ne peut pas supprimer le groupe');
live_group_join('uC', $tok);
$r = live_group_leave('uC', $g['id']);
$chk(!empty($r['ok']) && !in_array('uC', live_group_get($g['id'])['members'], true), 'un membre quitte le groupe');
$chk(!empty(live_group_leave('uC', $g['id'])['ok']), 'quitter deux fois : sans erreur');
$r = live_group_delete('uA', $g['id']);
$chk(!empty($r['ok']) && live_group_get($g['id']) === null && live_group_deleted($g['id']), 'le créateur supprime son groupe pour tout le monde');
$chk(empty(live_group_peek($tok, '')['ok']) && empty(live_group_join('uC', $tok)['ok']), 'après suppression, le lien ne marche plus');
$chk(empty(live_group_send('uA', $g['id'], 'hello')['ok']), 'plus de message dans un groupe supprimé');
$chk(!empty(live_group_delete('uA', $g['id'])['ok']), 'supprimer deux fois : sans erreur (idempotent)');
$chk(is_file(live_group_file($g['id'])), 'le fichier est gardé (marqué supprimé) pour l’équipe');
$chk(live_group_invite('uA', $g['id'], 'uC') === 'gGone' && empty(live_group_answer('uB', $g['id'], true)['ok']), 'ni invitation ni entrée dans un groupe supprimé');

// --- robustesse : le créateur garde toujours son groupe et peut toujours publier ---
$g2 = live_group_create('uA', 'Annonces', '📢')['g'];
for ($i = 0; $i < 30; $i++) { $x = live_group_create('uC', 'G' . $i, '🔥'); if (!empty($x['ok'])) live_group_join('uA', $x['g']['tok']); }
for ($i = 0; $i < 120; $i++) live_ugroups_set('uA', 'gfake' . $i, true); // A est entré dans beaucoup de groupes
$chk(in_array($g2['id'], live_ugroups_all('uA'), true), 'le groupe du créateur reste dans sa liste même après 150 autres groupes');
$chk(!empty(live_group_send('uA', $g2['id'], 'Bonjour')['ok']), 'le créateur publie');
// vieux fichier de groupe (avant v2905) : pas de msgs, pas de at, pas de tok, membres en désordre
$old = ['id' => 'gold1', 'name' => 'Ancien', 'owner' => 'uA', 'members' => ['uA', '', 'uB']];
live_write_json(live_group_file('gold1'), $old);
$go = live_group_get('gold1');
$chk($go !== null && $go['msgs'] === [] && $go['members'] === ['uA', 'uB'] && $go['emoji'] === '💬', 'vieux fichier de groupe lu sans erreur');
$go = live_group_ensure_tok($go);
$chk($go['tok'] !== '' && live_group_by_tok($go['tok']) === 'gold1', 'vieux groupe sans lien : un lien est créé');
$t1 = $go['tok']; $go = live_group_ensure_tok(live_group_get('gold1'));
$chk($go['tok'] === $t1, 'le lien ne change plus ensuite (idempotent)');
$chk(!empty(live_group_send('uA', 'gold1', 'toujours là')['ok']), 'le créateur publie dans un vieux groupe');
$chk(live_group_get('gold1')['owner'] === 'uA', 'personne ne lui prend son groupe');
live_write_json(live_group_file('gbad'), ['oops' => 1]);
$chk(live_group_get('gbad') === null && live_group_get('') === null && live_group_get('../x') === null, 'fichier abîmé ou nom bizarre : ignoré, sans erreur');
// quotas : une fenêtre glissante, jamais de blocage définitif
$q = live_dir('quota') . '/uA_gday.json';
live_write_json($q, ['t' => array_fill(0, LIVE_GROUP_DAY, time() - 86401)]);
$chk(live_quota_ok('uA', 'gday', LIVE_GROUP_DAY, 86400), 'limite du jour : repart à zéro après 24 h');
live_write_json($q, ['t' => 'abîmé']);
$chk(live_quota_ok('uA', 'gday', LIVE_GROUP_DAY, 86400), 'compteur abîmé : on peut quand même publier');

// --- diffusion : chaque membre (entré par le lien ou par invitation) reçoit les publications ; plus rien après le départ
$g3 = live_group_create('uK', 'Diffusion', '⚡')['g'];
live_group_join('uB', $g3['tok']); live_group_invite('uK', $g3['id'], 'uC'); live_group_answer('uC', $g3['id'], true);
live_group_send('uK', $g3['id'], 'Annonce 1');
$seen = static function (string $uid, string $gid): array { $g = live_group_get($gid); if (!$g || !in_array($uid, $g['members'], true) || !in_array($gid, live_ugroups_all($uid), true)) return []; return array_column($g['msgs'], 't'); };
$chk(in_array('Annonce 1', $seen('uB', $g3['id']), true) && in_array('Annonce 1', $seen('uC', $g3['id']), true), 'la publication arrive chez le membre entré par lien ET chez l’invité');
live_group_leave('uB', $g3['id']);
live_group_send('uK', $g3['id'], 'Annonce 2');
$chk($seen('uB', $g3['id']) === [] && in_array('Annonce 2', $seen('uC', $g3['id']), true), 'après son départ, B ne reçoit plus rien ; C reçoit toujours');
live_group_delete('uK', $g3['id']);
$chk($seen('uC', $g3['id']) === [] && $seen('uK', $g3['id']) === [], 'groupe supprimé : plus personne ne reçoit rien');

// --- limites : discussion libre, rafales de robot arrêtées ---
$n = 0; for ($i = 0; $i < 25; $i++) if (live_burst_ok('uB')) $n++;
$chk($n === LIVE_BURST_N, 'rafale : 20 messages passent en 10 s, le 21e est freiné');
$chk(LIVE_DM_HOUR >= 600 && LIVE_GROUP_HOUR >= 120 && LIVE_MSG_MAX >= 4000 && LIVE_AUD_MAX >= 1000000, 'limites généreuses (600/h entre amis, 4000 lettres, notes de 3 min)');
$long = str_repeat('é', 3999) . 'Z';
$chk(live_clean_text($long) === $long, 'un message de 4000 lettres passe en entier');

// --- photo de profil ---
$jpg = 'data:image/jpeg;base64,' . base64_encode("\xFF\xD8\xFF\xE0" . str_repeat('a', 5000));
$f = live_save_image($jpg, 'pub', LIVE_PHOTO_MAX);
$chk($f !== '' && live_img_path($f, 'pub') !== '', 'photo de profil acceptée (vraie image)');
$chk(live_save_image('data:image/jpeg;base64,' . base64_encode("\xFF\xD8\xFF" . str_repeat('a', LIVE_PHOTO_MAX + 10)), 'pub', LIVE_PHOTO_MAX) === '', 'photo de profil trop lourde refusée');
$chk(live_save_image('data:image/jpeg;base64,' . base64_encode('<?php ' . str_repeat('a', 900)), 'pub', LIVE_PHOTO_MAX) === '', 'faux fichier refusé');
live_photo_set('uB', $f);
$chk(str_contains(live_who_uid('uB')['ph'], $f), 'la photo apparaît avec le joueur');
live_photo_set('uB', '');
$chk(live_who_uid('uB')['ph'] === '', 'retirer la photo : retour à l’initiale');
$chk(live_img_wh('640x480') === '640x480' && live_img_wh('9x<b>') === '' && live_img_wh('') === '', 'taille de photo vérifiée');

echo "\nRÉSULTAT : $ok OK, $ko échec(s)\n";
exit($ko ? 1 : 0);
