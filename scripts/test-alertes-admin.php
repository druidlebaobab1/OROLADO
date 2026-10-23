<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-10-23 (propriétaire : « je ne reçois plus les alertes de retrait ni de messages ») — test des ALERTES ADMIN avec de
 * FAUX Telegram et de FAUX téléphones (rien ne part sur internet) :
 *   - Telegram part en premier, avec le texte complet ; la raison d'un échec est donnée (non relié, robot bloqué…) ;
 *   - téléphones admin = appareils « test » + appareils du compte admin (pas les joueurs) ;
 *   - journal des alertes (sans le code du robot) ;
 *   - gros dépôt / dépôt record (seuil réglable, comptes admin ignorés) ;
 *   - messagerie : aperçu sans la réponse automatique, « non lu » remis par l'admin.
 * Lancer : php scripts/test-alertes-admin.php
 */
if (!function_exists('openssl_pkey_derive')) { echo "openssl absent : relancer avec -d extension=openssl\n"; exit(1); }
$tmp = sys_get_temp_dir() . '/orolado_alertes_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'push_lib.php', 'tg_lib.php', 'live_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php';
require $tmp . '/push_lib.php';
require $tmp . '/tg_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' && !$ok ? "  ($d)" : '') . "\n"; }
$phone = static function (string $ep): array {
  $k = push_new_ec_key();
  return ['endpoint' => $ep, 'keys' => ['p256dh' => push_b64u_enc(push_raw_pub($k)), 'auth' => push_b64u_enc(random_bytes(16))]];
};
$order = [];
$tgSent = [];
$pushSent = [];
$GLOBALS['OROLADO_FAKE_TG'] = static function (string $method, array $data) use (&$tgSent, &$order) {
  if ($method !== 'sendMessage') return ['ok' => true, 'result' => []];
  $order[] = 'tg';
  if (($GLOBALS['TG_MODE'] ?? '') === 'blocked') return ['ok' => false, 'description' => 'Forbidden: bot was blocked by the user'];
  $tgSent[] = $data['text'];
  return ['ok' => true];
};
$GLOBALS['OROLADO_FAKE_PUSH'] = static function (array $r, string $body, string $auth) use (&$pushSent, &$order): int {
  $order[] = 'push';
  $pushSent[] = $r['endpoint'];
  return str_contains($r['endpoint'], 'oldkey') ? 403 : 201;
};
$TOKEN = '123456789:' . str_repeat('A', 35);

echo "1) Rien de relié : la raison est donnée\n";
$r = push_notify_admin('💸 Retrait 50,00 $ à payer', 'RX1 · Wave', '/admin.php', "RETRAIT À PAYER\nfiche");
check('Telegram : « pas relié » expliqué', isset($r['tg']) && empty($r['tg']['ok']) && str_contains((string) $r['tg']['why'], 'pas relié'), json_encode($r));
check('Téléphone : « aucun téléphone admin » expliqué', str_contains(push_why($r), 'Aucun téléphone admin'));

echo "2) Telegram relié + téléphones\n";
tg_save(['token' => $TOKEN, 'chat' => '42', 'on' => 1, 'bot' => 'oro_bot']);
push_save_sub($phone('https://web.push.apple.com/ADMINTEST'), ['plat' => 'ios', 'app' => 1, 'test' => 1, 'uid' => 'admin_master']);
push_save_sub($phone('https://fcm.googleapis.com/fcm/send/ADMINACCOUNT'), ['plat' => 'android', 'admin' => 1, 'uid' => 'u_adm2']);
push_save_sub($phone('https://fcm.googleapis.com/fcm/send/ADMINUID'), ['plat' => 'android', 'uid' => 'u_owner']);
push_save_sub($phone('https://fcm.googleapis.com/fcm/send/PLAYER'), ['plat' => 'android', 'uid' => 'u_player']);
push_admin_uid_note('u_owner');
check('3 appareils admin (test, compte admin, identifiant admin noté), joueur exclu', count(push_admin_rows()) === 3);
$order = []; $tgSent = []; $pushSent = [];
$r = push_notify_admin('💸 Retrait 50,00 $ à payer', 'RX1 · Wave 0700', '/admin.php', "💸 RETRAIT À PAYER : 50,00 $\n👤 Nom : Aka");
check('Telegram parti avec la fiche complète', count($tgSent) === 1 && str_contains($tgSent[0], 'Nom : Aka'));
check('Telegram AVANT les téléphones', ($order[0] ?? '') === 'tg');
check('3 téléphones admin ont reçu, pas le joueur', (int) $r['sent'] === 3 && !in_array('https://fcm.googleapis.com/fcm/send/PLAYER', $pushSent, true), json_encode($r));
$log = push_alert_log_list();
check('alerte notée dans le journal (Telegram ✓, 3 téléphones)', ($log[0]['t'] ?? '') === '💸 Retrait 50,00 $ à payer' && !empty($log[0]['tg']['ok']) && (int) $log[0]['push']['sent'] === 3);
check('le code du robot n’est jamais dans le journal', !str_contains((string) file_get_contents(push_alert_log_file()), $TOKEN));

echo "3) Message d'un joueur : même texte recopié sur Telegram (réglable)\n";
$tgSent = [];
push_notify_admin('💬 Message de RX1 Aka', 'Bonjour, mon retrait ?', '/admin.php?live=u1');
check('message recopié sur Telegram avec le lien vers la conversation', count($tgSent) === 1 && str_contains($tgSent[0], 'Bonjour, mon retrait ?') && str_contains($tgSent[0], '/admin.php?live=u1'));
$c = tg_conf(); $c['mirror'] = 0; tg_save($c);
$tgSent = [];
push_notify_admin('💬 Message de RX1 Aka', 'Encore moi', '/admin.php');
check('« recopier sur Telegram » coupé : plus de message Telegram', count($tgSent) === 0);
push_notify_admin('💸 Retrait 9,00 $ à payer', 'RX2', '/admin.php', "RETRAIT À PAYER 9 $");
check('… mais les RETRAITS partent toujours sur Telegram', count($tgSent) === 1);
$c['mirror'] = 1; tg_save($c);

echo "4) Échecs expliqués\n";
$GLOBALS['TG_MODE'] = 'blocked';
$r = push_notify_admin('Test', 'x', '/admin.php', 'Test');
check('robot bloqué → consigne « Débloquer »', str_contains((string) $r['tg']['why'], 'bloqué'));
unset($GLOBALS['TG_MODE']);
$only = ['endpoint' => 'https://web.push.apple.com/oldkey', 'p256dh' => '', 'auth' => ''];
$rOld = push_send_rows([array_merge($only, ['p256dh' => $phone('x')['keys']['p256dh'], 'auth' => push_b64u_enc(random_bytes(16))])], push_payload('t', 'b'));
check('abonnement avec une ancienne clé (403) → consigne « refaites Activer »', str_contains(push_why($rOld + ['devices' => 1, 'err' => '403 BadJwtToken']), 'ancienne clé'));
check('erreur réseau Telegram : texte clair (pas de code du robot)', !str_contains((string) json_encode(tg_send_admin('x')), $TOKEN));

echo "5) Gros dépôt / record\n";
$alerts = [];
$GLOBALS['OROLADO_FAKE_ADMIN_ALERT'] = static function (string $t, string $b, $tg) use (&$alerts) { $alerts[] = [$t, $b, $tg]; };
$db = blank_db();
$db['users']['u1'] = ['id' => 'u1', 'publicId' => 'RX1', 'displayName' => 'Aka', 'email' => 'aka@test.com', 'role' => 'user'];
$db['users']['admin_master'] = ['id' => 'admin_master', 'role' => 'admin'];
$db['deposits'] = [
  ['id' => 'd1', 'userId' => 'u1', 'amount' => 120, 'status' => 'COMPLETED'],
  ['id' => 'd2', 'userId' => 'admin_master', 'amount' => 90000, 'status' => 'COMPLETED'], // compte maison : ignoré
  ['id' => 'd3', 'userId' => 'u1', 'amount' => 80, 'status' => 'PENDING'],
];
orolado_alert_cfg_save(['depBig' => 500, 'depRecord' => 1]);
orolado_deposit_alert($db, 'u1', 60, 'd4', 'wave', -1);
check('petit dépôt : pas d’alerte', count($alerts) === 0);
orolado_deposit_alert($db, 'u1', 150, 'd5', 'wave', -1);
check('dépôt record (150 $ > 120 $) : alerte RECORD', count($alerts) === 1 && str_contains($alerts[0][0], 'RECORD') && str_contains($alerts[0][1], 'ancien record 120'), json_encode($alerts));
check('fiche Telegram du dépôt (joueur, e-mail, réf.)', is_string($alerts[0][2] ?? null) && str_contains($alerts[0][2], 'aka@test.com') && str_contains($alerts[0][2], 'd5'));
check('record retenu (150 $)', abs(orolado_alert_cfg()['record'] - 150) < 0.001);
$alerts = [];
orolado_deposit_alert($db, 'u1', 140, 'd6', 'wave', -1);
check('140 $ < record 150 $ et < seuil : pas d’alerte', count($alerts) === 0);
orolado_deposit_alert($db, 'u1', 600, 'd7', 'oxapay', -1);
check('600 $ : alerte (record et ≥ seuil)', count($alerts) === 1);
$alerts = [];
orolado_alert_cfg_save(['depRecord' => 0]);
orolado_deposit_alert($db, 'u1', 550, 'd8', 'oxapay', -1);
check('550 $ ≥ seuil 500 $ : « Gros dépôt »', count($alerts) === 1 && str_contains($alerts[0][0], 'Gros dépôt'));
$alerts = [];
orolado_deposit_alert($db, 'admin_master', 99999, 'd9', 'wave', -1);
check('dépôt d’un compte admin : jamais d’alerte', count($alerts) === 0);
orolado_alert_cfg_save(['depBig' => 0]);
orolado_deposit_alert($db, 'u1', 5000, 'd10', 'wave', -1);
check('seuil 0 et record coupé : jamais d’alerte', count($alerts) === 0);

echo "6) Messagerie admin\n";
require $tmp . '/live_lib.php';
live_add_msg(['id' => 'u1', 'publicId' => 'RX1', 'displayName' => 'Aka'], 'u', 'Mon retrait n’est pas arrivé');
live_auto_reply('u1', 'fr');
live_add_msg(['id' => 'u2', 'publicId' => 'RX2', 'displayName' => 'Bob'], 'u', 'Salut');
live_add_msg(['id' => 'u2'], 'a', 'Bonjour Bob');
$th = live_threads();
check('non lus en premier', ($th[0]['uid'] ?? '') === 'u1' && $th[0]['unread'] === 1 && $th[1]['unread'] === 0);
check('aperçu = vrai message du joueur (pas la réponse automatique)', ($th[0]['prev'] ?? '') === 'Mon retrait n’est pas arrivé', (string) ($th[0]['prev'] ?? ''));
live_mark_read('u1', 'a');
check('ouverte → lue', live_unread_admin() === 0);
check('« Non lu » remis par l’admin', live_mark_unread_admin('u1') && live_unread_admin() === 1);
check('conversation inconnue : refusée', !live_mark_unread_admin('nobody'));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
