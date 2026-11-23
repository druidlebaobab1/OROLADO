<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-23 (propriétaire : « améliore la partie Messages, rends-la rapide et mieux, sans rien déranger ») —
 * boîte MESSAGES de l'admin (💬 Social → Conversations), avec une FAUSSE base (rien ne part en ligne) :
 *  1) liste par pages (sommaire), compteurs Tous / Non lus / Lus / Résolus, ancienne forme toujours là ;
 *  2) recherche : nom, numéro ORO-…, e-mail, texte d'un message (avec accents) ;
 *  3) conversation par pages (« voir plus » vers le haut), sondage léger (rien de neuf = réponse minuscule), lu à l'ouverture ;
 *  4) répondre (et « Réessayer » ne l'envoie jamais deux fois), non lu, résolu (revient si le joueur réécrit) ;
 *  5) réponses rapides, résumé du joueur (solde réel, dépôts, retraits en attente) ;
 *  6) écritures EN MÊME TEMPS (joueurs + admin) : aucun message perdu, le sommaire reste juste ; sommaire effacé → refait.
 * Lancer : php scripts/test-admin-messages.php
 */
$tmp = sys_get_temp_dir() . '/orolado_msg_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/live/threads', 0755, true);
mkdir($tmp . '/feedcache', 0755, true);
foreach (glob(__DIR__ . '/../*.php') ?: [] as $f) copy($f, $tmp . '/' . basename($f));
file_put_contents($tmp . '/feedcache/live.json', '{}');

$now = time();
$iso = static fn(int $t): string => gmdate('Y-m-d\TH:i:s\Z', $t);
$U = static fn(int $n): string => sprintf('%08d-aaaa-bbbb-cccc-%012d', $n, $n);
$T = ['profiles' => [], 'withdrawals' => [], 'deposits' => [], 'orders' => [], 'vaults' => [], 'transactions' => [], 'auth' => []];
$users = ['admin_master' => ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin']];
$N = 95; // 95 conversations : 3 pages de 40
for ($n = 1; $n <= $N; $n++) {
  $T['profiles'][] = ['id' => $U($n), 'email' => "joueur$n@test.com", 'display_name' => "Joueur $n", 'phone' => '', 'country_code' => '+225', 'role' => 'user',
    'created_at' => $iso($now - 10 * 86400), 'last_seen' => $iso($now - 3600), 'real_deposit_total' => 0, 'real_trades' => 0];
  $T['auth'][] = ['id' => $U($n), 'email' => "joueur$n@test.com", 'created_at' => $iso($now - 10 * 86400), 'user_metadata' => []];
  $users["u$n"] = ['id' => "u$n", 'email' => "joueur$n@test.com", 'sbId' => $U($n), 'displayName' => "Joueur $n", 'publicId' => 'ORO-' . (5000 + $n)];
  $msgs = [];
  $cnt = $n === 1 ? 250 : 3;
  for ($k = 0; $k < $cnt; $k++) $msgs[] = ['id' => sprintf('m%d_%04d', $n, $k), 'f' => $k % 2 ? 'a' : 'u', 't' => "Message $k du joueur $n", 'at' => $now - 86400 + $n * 60 + $k];
  if ($n === 7) $msgs[] = ['id' => 'm7_txt', 'f' => 'u', 't' => 'Mon dépôt Wave de 5000 FCFA n’est pas arrivé', 'at' => $now - 86400 + 7 * 60 + 9];
  if ($n === 8) $msgs[] = ['id' => 'm8_auto', 'f' => 'a', 't' => 'Bonjour, et merci d’avoir contacté le support', 'at' => $now - 86400 + 8 * 60 + 9, 'auto' => 1];
  $th = ['uid' => "u$n", 'email' => "joueur$n@test.com", 'name' => "Joueur $n", 'publicId' => 'ORO-' . (5000 + $n), 'msgs' => $msgs, 'at' => end($msgs)['at'], 'unreadAdmin' => $n % 10 === 0 ? 1 : 0];
  // ancien format (accents échappés « é ») pour le joueur 9 : la recherche doit le trouver quand même
  if ($n === 9) { $th['msgs'][] = ['id' => 'm9_esc', 'f' => 'u', 't' => 'Retrait bloqué depuis hier', 'at' => $now - 86400 + 9 * 60 + 9]; file_put_contents($tmp . "/data/live/threads/u$n.json", json_encode($th)); continue; }
  file_put_contents($tmp . "/data/live/threads/u$n.json", json_encode($th, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}
file_put_contents($tmp . '/data/live/threads/vide.json', json_encode(['uid' => 'vide', 'msgs' => []])); // conversation vide : jamais listée
// Joueur 3 : 2 dépôts payés + 1 bonus (pas compté), 1 retrait en attente, 1 payé ; solde réel 42,5 $
$T['vaults'][] = ['user_id' => $U(3), 'real' => 42.5, 'demo' => 0];
$deps = [
  ['id' => 'dep_a', 'userId' => $U(3), 'amount' => 10, 'status' => 'PAID', 'operator' => 'wave', 'createdAt' => $iso($now - 5 * 86400)],
  ['id' => 'dep_b', 'userId' => $U(3), 'amount' => 25, 'status' => 'PAID', 'operator' => 'orange', 'createdAt' => $iso($now - 2 * 86400)],
  ['id' => 'dep_c', 'userId' => $U(3), 'amount' => 99, 'status' => 'PENDING', 'operator' => 'wave', 'createdAt' => $iso($now - 3600)],
];
$wds = [
  ['id' => 'wd_open', 'userId' => 'u3', 'amount' => 15, 'status' => 'pending', 'operator' => 'wave', 'phone' => '+2250700000001', 'at' => $iso($now - 7200)],
  ['id' => 'wd_done', 'userId' => 'u3', 'amount' => 8, 'status' => 'approved', 'operator' => 'wave', 'phone' => '+2250700000001', 'at' => $iso($now - 9 * 86400)],
];
file_put_contents($tmp . '/data/orolado.json', json_encode(['users' => $users, 'vault' => [], 'sessions' => [], 'deposits' => $deps, 'withdrawals' => $wds,
  'support_messages' => [['id' => 'sm1', 'userId' => 'u1', 'message' => 'ancien formulaire', 'status' => 'ouvert']], 'orders' => []]));
file_put_contents($tmp . '/sb.json', json_encode($T));

// Fausse base Supabase (lecture seule) : profils, coffres ; le reste vide.
$fake = <<<'R'
<?php
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['OROLADO_FAKE_PROBE'] = static fn(string $url): int => 200;
$GLOBALS['OROLADO_FAKE_MAIL'] = static fn() => ['ok' => true];
$GLOBALS['OROLADO_FAKE_SB'] = function (string $path, string $method, ?string $body, array $hdr) use ($tmp) {
  $T = json_decode((string) file_get_contents($tmp . '/sb.json'), true);
  $ok = static fn(array $rows): array => ['ok' => true, 'code' => 200, 'rows' => $rows, 'count' => count($rows), 'raw' => json_encode($rows)];
  if (str_starts_with($path, '/auth/v1/admin/users')) {
    parse_str((string) parse_url($path, PHP_URL_QUERY), $q);
    $users = (int) ($q['page'] ?? 1) === 1 ? $T['auth'] : [];
    return ['ok' => true, 'code' => 200, 'rows' => [], 'count' => count($users), 'raw' => json_encode(['users' => $users])];
  }
  if (!preg_match('#^/rest/v1/([a-z_]+)\?(.*)$#', $path, $m)) return $ok([]);
  if ($method !== 'GET') return $ok([]);
  $rows = $T[$m[1]] ?? [];
  foreach (explode('&', $m[2]) as $part) {
    [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
    $v = rawurldecode($v);
    if (in_array($k, ['select', 'order', 'limit'], true)) continue;
    if (str_starts_with($v, 'eq.')) $rows = array_values(array_filter($rows, static fn($r) => (string) ($r[$k] ?? '') === substr($v, 3)));
    else if (str_starts_with($v, 'in.') || str_starts_with($v, 'ilike.')) $rows = [];
  }
  $from = 0; $to = 999;
  foreach ($hdr as $h) if (preg_match('/^Range:\s*(\d+)-(\d+)/i', (string) $h, $mm)) { $from = (int) $mm[1]; $to = (int) $mm[2]; }
  return $ok(array_slice($rows, $from, $to - $from + 1));
};
$GLOBALS['OROLADO_FAKE_HTTP'] = static fn() => [];
R;
file_put_contents($tmp . '/fake.php', '<?php $tmp = ' . var_export($tmp, true) . '; ?>' . $fake);
// Une demande admin = un processus, session admin déjà ouverte.
file_put_contents($tmp . '/runner.php', <<<'R'
<?php
$tmp = $argv[1];
require $tmp . '/fake.php';
session_id('msgtest' . bin2hex(random_bytes(4)));
@session_start();
$_SESSION['admin_uid'] = 'admin_master';
$_SESSION['admin_email'] = 'admin@orolado.com';
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['CONTENT_TYPE'] = 'application/json';
$_GET['ajax'] = '1';
$_POST = json_decode((string) file_get_contents($argv[2]), true);
require $tmp . '/admin.php';
R);
// Un joueur écrit (comme live.php « send ») : n messages de suite.
file_put_contents($tmp . '/player.php', <<<'R'
<?php
$tmp = $argv[1];
require $tmp . '/orolado_lib.php';
require $tmp . '/live_lib.php';
for ($i = 0; $i < (int) $argv[4]; $i++) live_add_msg(['id' => $argv[2], 'displayName' => 'Joueur', 'email' => 'x@test.com'], 'u', $argv[3] . ' #' . $i);
echo 'ok';
R);
$php = PHP_BINARY;
$reqFile = function (array $req) use ($tmp): string { $f = $tmp . '/req_' . bin2hex(random_bytes(4)) . '.json'; file_put_contents($f, json_encode($req)); return $f; };
$cmdOf = fn(array $req): string => escapeshellarg($php) . ' -d display_errors=stderr ' . escapeshellarg($tmp . '/runner.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($reqFile($req));
$call = function (array $req) use ($cmdOf): array {
  $out = (string) shell_exec($cmdOf($req) . ' 2>&1');
  $j = json_decode(substr($out, (int) strpos($out, '{')), true);
  return is_array($j) ? $j : ['ok' => false, 'raw' => substr($out, 0, 400)];
};
$player = fn(string $uid, string $txt, int $n = 1): string => escapeshellarg($php) . ' ' . escapeshellarg($tmp . '/player.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($uid) . ' ' . escapeshellarg($txt) . ' ' . $n;
$parallel = function (array $cmds): array {
  $procs = []; $pipes = [];
  foreach ($cmds as $i => $c) $procs[$i] = proc_open($c, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes[$i]);
  $res = [];
  foreach ($procs as $i => $p) { $res[$i] = stream_get_contents($pipes[$i][1]) . stream_get_contents($pipes[$i][2]); fclose($pipes[$i][1]); fclose($pipes[$i][2]); proc_close($p); }
  return $res;
};
$thread = static fn(string $uid): array => json_decode((string) file_get_contents($tmp . "/data/live/threads/$uid.json"), true) ?: [];

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$uids = static fn(array $j): array => array_column($j['threads'] ?? [], 'uid');

echo "1) Liste par pages et compteurs\n";
$p1 = $call(['action' => 'live_threads', 'filter' => 'all', 'offset' => 0, 'limit' => 40]);
check('la liste répond', !empty($p1['ok']), empty($p1['ok']) ? json_encode($p1, JSON_UNESCAPED_UNICODE) : '');
check('page 1 : 40 conversations, « voir plus » proposé', count($p1['threads'] ?? []) === 40 && !empty($p1['more']), count($p1['threads'] ?? []) . ' / more=' . json_encode($p1['more'] ?? null));
check('total = 95 (la conversation vide n’apparaît pas)', ($p1['total'] ?? 0) === 95 && !in_array('vide', $uids($p1), true), (string) ($p1['total'] ?? ''));
check('compteurs : 9 non lus, 86 lus, 0 résolu', ($p1['counts'] ?? []) == ['all' => 95, 'unread' => 9, 'read' => 86, 'resolved' => 0], json_encode($p1['counts'] ?? null));
check('badge du bouton 💬 = 9', ($p1['unread'] ?? -1) === 9);
check('« Tous » : les 9 non lus en haut, du plus récent au plus ancien', array_slice($uids($p1), 0, 9) === ['u90', 'u80', 'u70', 'u60', 'u50', 'u40', 'u30', 'u20', 'u10'], implode(',', array_slice($uids($p1), 0, 9)));
check('… puis les autres, le plus récent d’abord', array_slice($uids($p1), 9, 3) === ['u95', 'u94', 'u93'], implode(',', array_slice($uids($p1), 9, 3)));
$p3 = $call(['action' => 'live_threads', 'filter' => 'all', 'offset' => 80, 'limit' => 40]);
check('page 3 : les 15 dernières, plus de « voir plus »', count($p3['threads'] ?? []) === 15 && empty($p3['more']));
$all = array_merge($uids($p1), $uids($call(['action' => 'live_threads', 'filter' => 'all', 'offset' => 40, 'limit' => 40])), $uids($p3));
check('les 3 pages ensemble : 95 conversations, aucune en double', count($all) === 95 && count(array_unique($all)) === 95);
$r8 = null; foreach ($p1['threads'] as $t) if ($t['uid'] === 'u1') $r8 = $t;
$x = $call(['action' => 'live_threads', 'q' => 'ORO-5008', 'limit' => 40]);
check('aperçu : le dernier VRAI message (pas la réponse automatique)', ($x['threads'][0]['prev'] ?? '') === 'Message 2 du joueur 8', (string) ($x['threads'][0]['prev'] ?? ''));
$u = $call(['action' => 'live_threads', 'filter' => 'unread', 'limit' => 40]);
check('filtre « Non lus » : seulement les 9', count($u['threads'] ?? []) === 9 && !array_filter($u['threads'], static fn($t) => $t['state'] !== 'unread'));
$old = $call(['action' => 'live_threads']);
check('ancienne demande (sans paramètre) : toujours la liste complète', count($old['threads'] ?? []) === 95 && ($old['unread'] ?? -1) === 9);
check('sommaire écrit sur le disque (data/live/threads_idx.json)', is_file($tmp . '/data/live/threads_idx.json'));
$b = $call(['action' => 'live_badge']);
check('compteur seul (live_badge) = 9', !empty($b['ok']) && ($b['unread'] ?? -1) === 9);

echo "2) Recherche\n";
check('par nom (« joueur 42 »)', $uids($call(['action' => 'live_threads', 'q' => 'joueur 42', 'limit' => 40])) === ['u42']);
check('par numéro (« oro-5017 »)', $uids($call(['action' => 'live_threads', 'q' => 'oro-5017', 'limit' => 40])) === ['u17']);
check('par e-mail', $uids($call(['action' => 'live_threads', 'q' => 'joueur55@test.com', 'limit' => 40])) === ['u55']);
$s = $call(['action' => 'live_threads', 'q' => 'wave de 5000', 'limit' => 40]);
check('par texte d’un message, avec la phrase trouvée', $uids($s) === ['u7'] && str_contains((string) ($s['threads'][0]['hit'] ?? ''), 'Wave de 5000'), json_encode($s['threads'] ?? null, JSON_UNESCAPED_UNICODE));
check('par texte avec accent (« dépôt »)', $uids($call(['action' => 'live_threads', 'q' => 'dépôt wave', 'limit' => 40])) === ['u7']);
check('ancien fichier (accents écrits « \\u00e9 ») trouvé aussi (« bloqué »)', $uids($call(['action' => 'live_threads', 'q' => 'bloqué', 'limit' => 40])) === ['u9']);
check('rien trouvé → liste vide', ($call(['action' => 'live_threads', 'q' => 'zzzqqq', 'limit' => 40])['total'] ?? -1) === 0);

echo "3) Conversation par pages, sondage léger, lu à l'ouverture\n";
$c = $call(['action' => 'live_thread', 'uid' => 'u10', 'limit' => 60]);
check('ouvrir une conversation non lue', !empty($c['ok']) && count($c['msgs'] ?? []) === 3 && empty($c['more']));
check('… elle passe en « lu » (badge 9 → 8)', ($c['unread'] ?? -1) === 8 && (int) ($thread('u10')['unreadAdmin'] ?? -1) === 0, (string) ($c['unread'] ?? ''));
$c = $call(['action' => 'live_thread', 'uid' => 'u1', 'limit' => 60]);
check('grosse conversation (250 messages) : seulement les 60 derniers + « plus anciens »', count($c['msgs'] ?? []) === 60 && !empty($c['more']) && ($c['msgs'][59]['id'] ?? '') === 'm1_0249' && ($c['n'] ?? 0) === 250);
$o = $call(['action' => 'live_thread', 'uid' => 'u1', 'limit' => 60, 'before' => $c['msgs'][0]['id']]);
check('« plus anciens » : les 60 d’avant, sans trou ni doublon', count($o['msgs'] ?? []) === 60 && ($o['msgs'][59]['id'] ?? '') === 'm1_0189' && ($o['msgs'][0]['id'] ?? '') === 'm1_0130');
$o = $call(['action' => 'live_thread', 'uid' => 'u1', 'limit' => 200, 'before' => 'm1_0030']);
check('… jusqu’au tout premier message (plus rien avant)', count($o['msgs'] ?? []) === 30 && empty($o['more']) && ($o['msgs'][0]['id'] ?? '') === 'm1_0000');
$same = $call(['action' => 'live_thread', 'uid' => 'u1', 'sig' => $c['sig'] ?? 'x', 'after' => 'm1_0249']);
check('sondage sans nouveauté : réponse minuscule (« same »)', !empty($same['same']) && !isset($same['msgs']));
shell_exec($player('u1', 'Vous êtes là ?'));
$nw = $call(['action' => 'live_thread', 'uid' => 'u1', 'sig' => $c['sig'] ?? 'x', 'after' => 'm1_0249']);
check('sondage après un message du joueur : seulement le nouveau message', ($nw['mode'] ?? '') === 'after' && count($nw['msgs'] ?? []) === 1 && ($nw['msgs'][0]['t'] ?? '') === 'Vous êtes là ? #0');

echo "4) Répondre, non lu, résolu\n";
$r = $call(['action' => 'live_reply', 'uid' => 'u2', 'text' => 'Bonjour, c’est réglé ✅', 'cid' => 'cTEST1']);
check('répondre : accepté', !empty($r['ok']) && ($r['msg']['t'] ?? '') === 'Bonjour, c’est réglé ✅', json_encode($r, JSON_UNESCAPED_UNICODE));
$r2 = $call(['action' => 'live_reply', 'uid' => 'u2', 'text' => 'Bonjour, c’est réglé ✅', 'cid' => 'cTEST1']);
check('« Réessayer » (même clé d’envoi) : pas envoyé deux fois', !empty($r2['ok']) && !empty($r2['dup']) && ($r2['msg']['id'] ?? '') === ($r['msg']['id'] ?? '-'));
$mine = array_filter($thread('u2')['msgs'], static fn($m) => ($m['t'] ?? '') === 'Bonjour, c’est réglé ✅');
check('… une seule réponse dans la conversation, le joueur a 1 non lu', count($mine) === 1 && (int) ($thread('u2')['unreadUser'] ?? 0) === 1);
$l = $call(['action' => 'live_threads', 'q' => 'ORO-5002', 'limit' => 5]);
check('la liste montre aussitôt « Vous : … » en aperçu', ($l['threads'][0]['prev'] ?? '') === 'Vous : Bonjour, c’est réglé ✅', (string) ($l['threads'][0]['prev'] ?? ''));
check('réponse vide refusée', empty($call(['action' => 'live_reply', 'uid' => 'u2', 'text' => '   '])['ok']));
check('réponse à un joueur sans conversation refusée', empty($call(['action' => 'live_reply', 'uid' => 'inconnu', 'text' => 'x'])['ok']));
$x = $call(['action' => 'live_unread', 'uid' => 'u2']);
check('« Non lu » : la conversation revient dans les non lus', !empty($x['ok']) && ($x['unread'] ?? 0) === 9);
$x = $call(['action' => 'live_resolve', 'uid' => 'u2', 'on' => 1]);
check('« ✓ Résolu » : rangée, plus dans les non lus', !empty($x['ok']) && ($x['unread'] ?? 0) === 8);
$rs = $call(['action' => 'live_threads', 'filter' => 'resolved', 'limit' => 40]);
check('filtre « Résolus » : elle y est', $uids($rs) === ['u2'] && ($rs['counts']['resolved'] ?? 0) === 1);
check('… et plus dans « Lus »', !in_array('u2', $uids($call(['action' => 'live_threads', 'filter' => 'read', 'limit' => 200])), true));
shell_exec($player('u2', 'Merci mais encore une question'));
$rs = $call(['action' => 'live_threads', 'filter' => 'unread', 'limit' => 40]);
check('le joueur réécrit : la conversation revient dans « Non lus » (plus « résolue »)', in_array('u2', $uids($rs), true) && ($rs['counts']['resolved'] ?? -1) === 0);
$call(['action' => 'live_resolve', 'uid' => 'u3', 'on' => 1]);
$x = $call(['action' => 'live_resolve', 'uid' => 'u3', 'on' => 0]);
check('retirer « Résolu » : redevient « Lu »', !empty($x['ok']) && in_array('u3', $uids($call(['action' => 'live_threads', 'filter' => 'read', 'limit' => 200])), true));

echo "5) Réponses rapides, résumé du joueur\n";
$q = $call(['action' => 'live_qr']);
check('réponses rapides par défaut (en français)', !empty($q['ok']) && count($q['l'] ?? []) >= 3 && str_starts_with((string) $q['l'][0], 'Bonjour'));
$q = $call(['action' => 'live_qr_set', 'l' => ['  Ok, je regarde  ', '', 'Retrait envoyé ✅']]);
check('modifier les réponses rapides (lignes vides retirées)', ($q['l'] ?? []) === ['Ok, je regarde', 'Retrait envoyé ✅']);
check('… gardées', ($call(['action' => 'live_qr'])['l'] ?? []) === ['Ok, je regarde', 'Retrait envoyé ✅']);
$p = $call(['action' => 'live_player', 'uid' => 'u3']);
check('résumé du joueur : solde réel 42,50 $', !empty($p['ok']) && abs((float) ($p['real'] ?? 0) - 42.5) < 0.001, json_encode($p, JSON_UNESCAPED_UNICODE));
check('… 2 dépôts payés = 35 $ (en attente non compté), dernier = 25 $', ($p['depN'] ?? 0) === 2 && abs((float) ($p['depSum'] ?? 0) - 35) < 0.001 && abs((float) ($p['lastDep']['amount'] ?? 0) - 25) < 0.001);
check('… 1 retrait en attente de 15 $', ($p['wdN'] ?? 0) === 1 && abs((float) ($p['wdSum'] ?? 0) - 15) < 0.001);

echo "6) Écritures en même temps : aucun message perdu\n";
$before = count($thread('u5')['msgs']);
$cmds = [];
for ($k = 0; $k < 6; $k++) $cmds[] = $player('u5', "joueur$k", 10);
for ($k = 0; $k < 4; $k++) $cmds[] = $cmdOf(['action' => 'live_reply', 'uid' => 'u5', 'text' => "admin $k", 'cid' => "cpar$k"]);
for ($k = 0; $k < 3; $k++) $cmds[] = $cmdOf(['action' => 'live_threads', 'limit' => 40]); // la liste se lit pendant les écritures
$cmds[] = $cmdOf(['action' => 'live_thread', 'uid' => 'u5']);
$parallel($cmds);
$th5 = $thread('u5');
check('6 joueurs × 10 messages + 4 réponses admin en même temps : les 64 sont là', count($th5['msgs']) === $before + 64, count($th5['msgs']) . ' / attendu ' . ($before + 64));
check('aucun identifiant en double', count(array_unique(array_column($th5['msgs'], 'id'))) === count($th5['msgs']));
$l = $call(['action' => 'live_threads', 'q' => 'joueur 5', 'limit' => 5]);
$row = null; foreach ($l['threads'] ?? [] as $t) if ($t['uid'] === 'u5') $row = $t;
check('le sommaire suit : bon nombre de messages et bon aperçu', $row !== null && ($row['n'] ?? 0) === count($th5['msgs']) && ($row['prev'] ?? '') === ((end($th5['msgs'])['f'] === 'a' ? 'Vous : ' : '') . end($th5['msgs'])['t']), json_encode($row, JSON_UNESCAPED_UNICODE));
$cmds = [];
for ($k = 0; $k < 8; $k++) $cmds[] = $player('u' . (60 + $k), "nouveau $k", 2);
$parallel($cmds);
$u = $call(['action' => 'live_threads', 'filter' => 'unread', 'limit' => 100]);
check('8 joueurs écrivent en même temps : tous dans « Non lus »', !array_diff(array_map(static fn($k) => 'u' . (60 + $k), range(0, 7)), $uids($u)), implode(',', $uids($u)));
@unlink($tmp . '/data/live/threads_idx.json');
$again = $call(['action' => 'live_threads', 'filter' => 'unread', 'limit' => 100]);
check('sommaire effacé : refait tout seul, mêmes non lus', $uids($again) === $uids($u) && ($again['counts'] ?? null) == ($u['counts'] ?? []));
// une conversation modifiée hors de live_update (copie, restauration) est quand même vue (empreinte du fichier)
$th = $thread('u33'); $th['msgs'][] = ['id' => 'mext', 'f' => 'u', 't' => 'restauré à la main, plus long', 'at' => $now]; $th['unreadAdmin'] = 3; $th['at'] = $now;
file_put_contents($tmp . '/data/live/threads/u33.json', json_encode($th, JSON_UNESCAPED_UNICODE));
$x = $call(['action' => 'live_threads', 'q' => 'ORO-5033', 'limit' => 5]);
check('conversation changée à la main : vue dans la liste (3 non lus, nouvel aperçu)', ($x['threads'][0]['unread'] ?? 0) === 3 && ($x['threads'][0]['prev'] ?? '') === 'restauré à la main, plus long', json_encode($x['threads'][0] ?? null, JSON_UNESCAPED_UNICODE));

echo "7) Ancienne boîte (formulaire) : rien ne casse\n";
$mt = filemtime($tmp . '/data/orolado.json'); clearstatcache(); sleep(1);
$call(['action' => 'mark_msg', 'id' => 'inexistant']);
clearstatcache();
check('« mark_msg » d’un message inconnu : la grosse base n’est pas réécrite', filemtime($tmp . '/data/orolado.json') === $mt);
$call(['action' => 'mark_msg', 'id' => 'sm1']);
$db = json_decode((string) file_get_contents($tmp . '/data/orolado.json'), true);
check('« mark_msg » d’un vrai message : passé en résolu', ($db['support_messages'][0]['status'] ?? '') === 'resolu');

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
$rm = static function (string $d) use (&$rm): void { foreach (glob($d . '/{,.}*', GLOB_BRACE) ?: [] as $f) { if (in_array(basename($f), ['.', '..'], true)) continue; is_dir($f) ? $rm($f) : @unlink($f); } @rmdir($d); };
$rm($tmp);
exit($fail === 0 ? 0 : 1);
