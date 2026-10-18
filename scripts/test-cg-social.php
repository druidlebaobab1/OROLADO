<?php
declare(strict_types=1);
// v2796 — Social « messagerie » : demandes de contact (Accepter / Refuser), point « en ligne », ✓✓ lu, notes vocales
// entre amis et dans les groupes. Par le VRAI live.php, dans un dossier temporaire (rien en ligne, rien dans data/).
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$tmp = sys_get_temp_dir() . '/orolado_social_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'live_lib.php', 'live.php', 'live_quiz_data.php'] as $f) if (is_file(__DIR__ . '/../' . $f)) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
foreach ((array) glob(__DIR__ . '/../*_lib.php') as $f) if (!is_file($tmp . '/' . basename((string) $f)) && basename((string) $f) !== 'push_lib.php') copy((string) $f, $tmp . '/' . basename((string) $f));
require $tmp . '/orolado_lib.php';
require $tmp . '/live_lib.php';
$ok = 0; $ko = 0;
$chk = function ($c, string $m) use (&$ok, &$ko) { echo ($c ? '  OK   ' : '  ÉCHEC ') . $m . "\n"; $c ? $ok++ : $ko++; };

$db = load_db(orolado_data_file());
foreach (['uA' => 'Awa', 'uB' => 'Bakary', 'uC' => 'Cheikh'] as $id => $n) {
  $db['users'][$id] = ['id' => $id, 'role' => 'user', 'email' => strtolower($n) . '@test.local', 'displayName' => $n, 'name' => $n];
  $db['sessions']['tok' . $id] = ['userId' => $id, 'exp' => time() + 86400, 'at' => gmdate('c')];
}
save_db(orolado_data_file(), $db);
file_put_contents($tmp . '/runner.php', '<?php $_SERVER["REQUEST_METHOD"] = "POST"; $GLOBALS["OROLADO_FAKE_INPUT"] = file_get_contents($argv[1]); require $argv[2];');
$api = function (string $who, string $action, array $d = []) use ($tmp): array {
  $in = $tmp . '/in.json';
  file_put_contents($in, json_encode(['action' => $action, 'token' => 'tok' . $who] + $d));
  $out = shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($tmp . '/runner.php') . ' ' . escapeshellarg($in) . ' ' . escapeshellarg($tmp . '/live.php') . ' 2>&1');
  $j = json_decode((string) $out, true);
  return is_array($j) ? $j : ['raw' => (string) $out];
};

$ids = [];
foreach (['uA', 'uB', 'uC'] as $u) { $r = $api($u, 'friends'); $ids[$u] = (string) ($r['me'] ?? ''); }
$chk($ids['uA'] !== '' && $ids['uB'] !== '', 'chaque joueur a son identifiant R…');

// 1) B écrit à A pour la 1re fois → demande de contact chez A, pas chez B
$api('uB', 'dmSend', ['id' => $ids['uA'], 'text' => 'salut']);
$la = $api('uA', 'friends'); $rowB = array_values(array_filter($la['list'] ?? [], fn($r) => $r['id'] === $ids['uB']))[0] ?? [];
$chk(!empty($rowB['req']), 'B écrit à A : A voit une DEMANDE (req)');
$lb = $api('uB', 'friends'); $rowA = array_values(array_filter($lb['list'] ?? [], fn($r) => $r['id'] === $ids['uA']))[0] ?? [];
$chk(isset($rowA['req']) && !$rowA['req'] && !empty($rowA['mine']), 'chez B, A n’est pas une demande ; dernier message = le sien');
$chk(array_key_exists('on', $rowB), 'la liste donne le point « en ligne »');
$chk(!empty($rowB['on']), 'B vient d’utiliser Social : en ligne');
// anciens champs toujours là
$chk(isset($rowB['id'], $rowB['name'], $rowB['at'], $rowB['un'], $rowB['last'], $rowB['blocked'], $rowB['duel']), 'anciens champs de la liste inchangés');

// 2) A accepte → plus une demande
$r = $api('uA', 'friendAnswer', ['id' => $ids['uB'], 'yes' => 1]);
$chk(!empty($r['ok']), 'A accepte la demande');
$la = $api('uA', 'friends'); $rowB = array_values(array_filter($la['list'] ?? [], fn($r) => $r['id'] === $ids['uB']))[0] ?? [];
$chk($rowB && empty($rowB['req']), 'après Accepter : B est un contact normal');

// 3) C écrit à A ; A refuse → C bloqué et caché
$api('uC', 'dmSend', ['id' => $ids['uA'], 'text' => 'hello']);
$r = $api('uA', 'friendAnswer', ['id' => $ids['uC'], 'yes' => 0]);
$la = $api('uA', 'friends');
$chk(!array_filter($la['list'] ?? [], fn($r) => $r['id'] === $ids['uC']), 'après Refuser : C disparaît de la liste de A');
$chk(live_is_blocked('uA', 'uC'), 'Refuser = C est bloqué');
$api('uC', 'dmSend', ['id' => $ids['uA'], 'text' => 'encore']);
$chk(count(live_dm_thread('uA', 'uC')) === 1, 'C refusé : ses nouveaux messages n’arrivent pas');
live_set_block('uA', 'uC', false);
$la = $api('uA', 'friends');
$chk((bool) array_filter($la['list'] ?? [], fn($r) => $r['id'] === $ids['uC']), 'si A débloque C, la conversation revient');

// 4) ✓✓ lu : A écrit à B ; tant que B n'a pas ouvert, peerUn > 0 ; après ouverture, 0
$api('uA', 'dmSend', ['id' => $ids['uB'], 'text' => 'tu es là ?']);
$d = $api('uA', 'dm', ['id' => $ids['uB']]);
$chk(($d['peerUn'] ?? -1) >= 1, 'message pas encore lu par B (peerUn ≥ 1)');
$chk(isset($d['msgs'], $d['peer'], $d['blocked']) && array_key_exists('duel', $d) && array_key_exists('stats', $d), 'anciens champs de la conversation inchangés');
$api('uB', 'dm', ['id' => $ids['uA']]);
$d = $api('uA', 'dm', ['id' => $ids['uB']]);
$chk(($d['peerUn'] ?? -1) === 0, 'B a ouvert la conversation : lu (peerUn = 0)');
$chk(array_key_exists('on', $d), 'la conversation donne « en ligne »');
live_set_block('uB', 'uA', true);
$d = $api('uA', 'dm', ['id' => $ids['uB']]);
$chk(($d['peerUn'] ?? 0) > 100, 'B a bloqué A : rien n’apparaît jamais « lu » (le blocage reste secret)');
live_set_block('uB', 'uA', false);

// 5) note vocale entre amis
$webm = 'data:audio/webm;codecs=opus;base64,' . base64_encode("\x1A\x45\xDF\xA3" . str_repeat("\x00\x11", 600));
$r = $api('uA', 'dmSend', ['id' => $ids['uB'], 'text' => '', 'aud' => $webm]);
$chk(!empty($r['ok']) && preg_match('/\.webm$/', (string) ($r['msg']['img'] ?? '')), 'note vocale envoyée à un ami');
$name = rawurldecode(substr((string) ($r['msg']['img'] ?? ''), strlen('live.php?i=')));
$chk(live_img_allowed('uB', $name) && !live_img_allowed('uC', $name), 'l’ami peut l’écouter, personne d’autre');
$lb = $api('uB', 'friends'); $rowA = array_values(array_filter($lb['list'] ?? [], fn($r) => $r['id'] === $ids['uA']))[0] ?? [];
$chk(($rowA['last'] ?? '') === '🎤', 'aperçu de la liste : 🎤');
$r = $api('uA', 'dmSend', ['id' => $ids['uB'], 'aud' => 'data:audio/webm;base64,' . base64_encode('<?php echo 1;' . str_repeat('x', 900))]);
$chk(empty($r['ok']) && ($r['reason'] ?? '') === 'badAud', 'faux son refusé');
$r = $api('uA', 'dmSend', ['id' => $ids['uB'], 'text' => 'texte seul']);
$chk(!empty($r['ok']) && empty($r['msg']['img']), 'message texte toujours accepté');

// 6) groupes : note vocale du créateur ; un membre ne publie toujours pas
$g = $api('uA', 'gCreate', ['name' => 'Club test', 'emoji' => '🚀']);
$gid = (string) ($g['g']['id'] ?? '');
$r = $api('uA', 'gSend', ['gid' => $gid, 'aud' => $webm]);
$chk(!empty($r['ok']), 'le créateur publie une note vocale dans son groupe');
$api('uA', 'gInvite', ['gid' => $gid, 'ids' => [$ids['uB']]]);
$gl = $api('uA', 'groups');
$chk(str_contains((string) ($gl['list'][0]['last'] ?? ''), '🎤'), 'aperçu du groupe : 🎤');
$api('uB', 'gAnswer', ['gid' => $gid, 'yes' => 1]);
$gg = $api('uB', 'gGet', ['gid' => $gid]);
$voice = array_values(array_filter((array) ($gg['g']['msgs'] ?? []), fn($m) => preg_match('/\.webm$/', (string) ($m['img'] ?? ''))));
$chk(count($voice) === 1, 'le membre reçoit la note vocale');
$r = $api('uB', 'gSend', ['gid' => $gid, 'text' => 'moi aussi']);
$chk(empty($r['ok']), 'un simple membre ne publie toujours pas');

// ménage
$rm = function ($d) use (&$rm) { foreach ((array) @scandir($d) as $f) { if ($f === '.' || $f === '..') continue; is_dir("$d/$f") ? $rm("$d/$f") : @unlink("$d/$f"); } @rmdir($d); };
$rm($tmp);
echo "\nRÉSULTAT : $ok OK, $ko échec(s)\n";
exit($ko ? 1 : 0);
