<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-23 (propriétaire : « les retraits en cours disparaissent tout seuls, puis reviennent ; j'ai validé d'anciens
 * retraits par erreur ») — RETRAITS dans l'admin, avec une FAUSSE base (rien ne part en ligne) :
 *  1) un retrait en attente reste en attente d'un rechargement à l'autre (copies Supabase « approved » / « silenced »,
 *     trace du journal joueur, joueur absent de la liste des profils, comptes démo affiliés) ;
 *  2) Supabase en panne (totale ou partielle) → avertissement, jamais une liste vide ou « 0 » muet ;
 *  3) payé / rejeté : une seule ligne au journal (data/wd_audit.jsonl), qui / quand / ancien → nouvel état ;
 *  4) jamais deux changements d'état : 2e clic, 2 clics en même temps, liste périmée (montant), retrait déjà payé.
 * Lancer : php scripts/test-admin-retraits.php
 */
$tmp = sys_get_temp_dir() . '/orolado_wdx_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
mkdir($tmp . '/feedcache', 0755, true);
foreach (['orolado_lib.php', 'admin_lib.php', 'mail_queue_lib.php', 'admin.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'history_lib.php', 'wipe_lib.php', 'admin_gift_lib.php', 'push_lib.php', 'aff_lib.php', 'aff_rev_lib.php', 'top_lib.php', 'defi_lib.php', 'bonus_lib.php', 'casino_lib.php', 'sports_lib.php', 'admin_games_lib.php'] as $f) {
  if (is_file(__DIR__ . '/../' . $f)) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
}
file_put_contents($tmp . '/feedcache/live.json', '{}');

$now = time();
$iso = static fn(int $t): string => gmdate('Y-m-d\TH:i:s\Z', $t);
$U = static fn(int $n): string => sprintf('%08d-aaaa-bbbb-cccc-%012d', $n, $n);
$T = ['profiles' => [], 'withdrawals' => [], 'deposits' => [], 'orders' => [], 'vaults' => [], 'transactions' => [], 'auth' => []];
for ($n = 1; $n <= 4; $n++) {
  $T['profiles'][] = ['id' => $U($n), 'email' => "joueur$n@test.com", 'display_name' => "Joueur $n", 'phone' => '', 'country_code' => '+225', 'role' => 'user',
    'created_at' => $iso($now - 10 * 86400), 'last_seen' => $iso($now - 3600), 'real_deposit_total' => 50, 'real_trades' => 3];
  $T['vaults'][] = ['user_id' => $U($n), 'real' => 100, 'demo' => 0];
  $T['auth'][] = ['id' => $U($n), 'email' => "joueur$n@test.com", 'created_at' => $iso($now - 10 * 86400), 'user_metadata' => []];
}
$reg = static fn(string $id, string $uid, float $amt, string $st, int $ago, array $x = []): array => $x + ['id' => $id, 'userId' => $uid, 'amount' => $amt, 'status' => $st,
  'operator' => 'wave', 'phone' => '+22507000000' . substr((string) crc32($id), -2), 'destination' => '+22507000000' . substr((string) crc32($id), -2), 'at' => $iso($now - $ago)];
$wds = [
  $reg('wd_old', 'uloc1', 30, 'pending', 3 * 86400),        // ancien (3 jours) : en attente
  $reg('wd_new', 'uloc2', 12, 'pending', 600),              // récent
  $reg('wd_conf', 'uloc1', 20, 'pending', 7200),            // Supabase dit « approved » (copie périmée)
  $reg('wd_sil', 'uloc3', 15, 'pending', 5000),             // Supabase dit « silenced »
  $reg('wd_orph', 'uloc5', 9, 'pending', 4000),             // joueur absent des profils (même e-mail qu'un autre compte)
  $reg('wd_paid', 'uloc3', 40, 'approved', 9 * 3600, ['approvedAt' => $iso($now - 8 * 3600)]),
  $reg('wd_rej', 'uloc4', 25, 'rejected', 20 * 3600, ['refunded' => true, 'refundedAt' => $iso($now - 19 * 3600)]),
  $reg('wd_pay2', 'uloc2', 7, 'pending', 1800),             // servira aux doubles clics
  $reg('wd_rej2', 'uloc4', 11, 'pending', 1500),            // servira au rejet
];
foreach ([['wd_conf', 'approved'], ['wd_sil', 'silenced'], ['wd_old', 'pending'], ['wd_new', 'pending']] as [$id, $st]) {
  foreach ($wds as $w) if ($w['id'] === $id) $T['withdrawals'][] = ['id' => $id, 'user_id' => $U((int) substr($w['userId'], 4)), 'amount' => $w['amount'], 'status' => $st,
    'operator' => 'wave', 'phone' => $w['phone'], 'reference' => $id, 'destination' => $w['phone'], 'created_at' => $w['at']];
}
$users = ['admin_master' => ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin']];
for ($n = 1; $n <= 4; $n++) $users["uloc$n"] = ['id' => "uloc$n", 'email' => "joueur$n@test.com", 'sbId' => $U($n), 'displayName' => "Joueur $n"];
// uloc5 : 2e compte avec le MÊME e-mail que le joueur 1 (doublon) et sans lien Supabase — avant, son retrait sortait de la liste.
$users['uloc5'] = ['id' => 'uloc5', 'email' => 'joueur1@test.com', 'displayName' => 'Joueur 1 bis', 'createdAt' => $iso($now - 86400)];
// Trace du journal du joueur 1 (ancien format) : même retrait que wd_old, mais heure du TÉLÉPHONE (décalée de 4 min).
$users['uloc1']['transactions'] = [['id' => 'tx_client_1', 'type' => 'withdraw', 'amount' => -30, 'note' => 'Retrait demandé', 'mode' => 'real', 'at' => $iso($now - 3 * 86400 + 240)]];
file_put_contents($tmp . '/data/orolado.json', json_encode([
  'users' => $users, 'vault' => [], 'sessions' => [], 'deposits' => [], 'withdrawals' => $wds, 'support_messages' => [], 'orders' => [],
  // Compte démo affilié : retrait jamais payé, jamais dans la file (v3628).
  'partnerWd' => [['id' => 'wd_partner', 'userId' => 'uloc2', 'amount' => 500, 'status' => 'pending', 'operator' => 'wave', 'destination' => '+2250799999999', 'at' => $iso($now - 300), 'partner' => true]],
]));
file_put_contents($tmp . '/sb.json', json_encode($T));
file_put_contents($tmp . '/sbfail.txt', '');

// Fausse base Supabase partagée entre processus : tables dans sb.json ; sbfail.txt = tables « en panne » (« * » = toutes).
$fake = <<<'R'
<?php
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['OROLADO_FAKE_PROBE'] = static fn(string $url): int => 200;
$GLOBALS['OROLADO_FAKE_MAIL'] = static fn() => ['ok' => true];
$GLOBALS['OROLADO_FAKE_SB'] = function (string $path, string $method, ?string $body, array $hdr) use ($tmp) {
  $T = json_decode((string) file_get_contents($tmp . '/sb.json'), true);
  $fail = array_filter(array_map('trim', explode(',', (string) @file_get_contents($tmp . '/sbfail.txt'))));
  $bad = ['ok' => false, 'code' => 503, 'rows' => [], 'count' => 0, 'raw' => ''];
  $ok = static fn(array $rows): array => ['ok' => true, 'code' => 200, 'rows' => $rows, 'count' => count($rows), 'raw' => json_encode($rows)];
  if (str_starts_with($path, '/auth/v1/admin/users')) {
    if (in_array('*', $fail, true) || in_array('auth', $fail, true)) return $bad;
    parse_str((string) parse_url($path, PHP_URL_QUERY), $q);
    $users = (int) ($q['page'] ?? 1) === 1 ? $T['auth'] : [];
    return ['ok' => true, 'code' => 200, 'rows' => [], 'count' => count($users), 'raw' => json_encode(['users' => $users])];
  }
  if (!preg_match('#^/rest/v1/([a-z_]+)\?(.*)$#', $path, $m)) return $ok([]);
  if (in_array('*', $fail, true) || in_array($m[1], $fail, true)) return $bad;
  if ($method !== 'GET') return $ok([]);
  $rows = $T[$m[1]] ?? [];
  foreach (explode('&', $m[2]) as $part) {
    [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
    $v = rawurldecode($v);
    if (in_array($k, ['select', 'order', 'limit'], true)) continue;
    if (str_starts_with($v, 'eq.')) $rows = array_values(array_filter($rows, static fn($r) => (string) ($r[$k] ?? '') === substr($v, 3)));
    else if (str_starts_with($v, 'in.') || str_starts_with($v, 'ilike.')) $rows = [];
    else if ($v === 'not.is.null') $rows = array_values(array_filter($rows, static fn($r) => ($r[$k] ?? null) !== null));
  }
  $from = 0; $to = 999;
  foreach ($hdr as $h) if (preg_match('/^Range:\s*(\d+)-(\d+)/i', (string) $h, $mm)) { $from = (int) $mm[1]; $to = (int) $mm[2]; }
  return $ok(array_slice($rows, $from, $to - $from + 1));
};
// Caisse (remboursement d'un rejet « une seule fois ») : la clé « wdr_… » ne peut être créditée qu'une fois.
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use ($tmp) {
  $fp = fopen($tmp . '/bank.json', 'c+'); flock($fp, LOCK_EX);
  $bank = json_decode(stream_get_contents($fp) ?: '{}', true) ?: [];
  $b = $body ? json_decode($body, true) : [];
  $out = [];
  if (str_contains($url, '/rpc/resolve_trade')) {
    $k = (string) ($b['p_order'] ?? '');
    $dup = isset($bank['keys'][$k]);
    if (!$dup) { $bank['keys'][$k] = 1; $bank['credits'][] = [$k, $b['p_amount'] ?? 0]; }
    $out = ['ok' => true, 'duplicate' => $dup, 'real' => 100];
  } elseif (preg_match('#/rest/v1/vaults\?user_id=eq\.#', $url) && $method === 'GET') {
    $out = [['demo' => 0, 'real' => 100]];
  }
  rewind($fp); ftruncate($fp, 0); fwrite($fp, json_encode($bank)); fflush($fp); flock($fp, LOCK_UN); fclose($fp);
  return $out;
};
R;
file_put_contents($tmp . '/fake.php', '<?php $tmp = ' . var_export($tmp, true) . '; ?>' . $fake);
// Une demande admin = un processus (admin.php répond puis s'arrête), session admin déjà ouverte.
$runner = <<<'R'
<?php
$tmp = $argv[1];
require $tmp . '/fake.php';
session_id('wdxtest' . bin2hex(random_bytes(4)));
@session_start();
$_SESSION['admin_uid'] = 'admin_master';
$_SESSION['admin_email'] = 'admin@orolado.com';
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['CONTENT_TYPE'] = 'application/json';
$_GET['ajax'] = '1';
$_POST = json_decode((string) file_get_contents($argv[2]), true);
require $tmp . '/admin.php';
R;
file_put_contents($tmp . '/runner.php', $runner);
$php = PHP_BINARY;
$reqFile = function (array $req) use ($tmp): string { $f = $tmp . '/req_' . bin2hex(random_bytes(4)) . '.json'; file_put_contents($f, json_encode($req)); return $f; };
$cmdOf = fn(array $req): string => escapeshellarg($php) . ' -d display_errors=stderr ' . escapeshellarg($tmp . '/runner.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($reqFile($req));
$call = function (array $req) use ($cmdOf): array {
  $out = (string) shell_exec($cmdOf($req) . ' 2>/dev/null');
  $j = json_decode(substr($out, (int) strpos($out, '{')), true);
  return is_array($j) ? $j : ['ok' => false, 'raw' => substr($out, 0, 300)];
};
$callParallel = function (array $reqs) use ($cmdOf): array {
  $procs = []; $pipes = [];
  foreach ($reqs as $i => $req) $procs[$i] = proc_open($cmdOf($req), [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes[$i]);
  $res = [];
  foreach ($procs as $i => $p) {
    $out = stream_get_contents($pipes[$i][1]);
    fclose($pipes[$i][1]); fclose($pipes[$i][2]); proc_close($p);
    $res[$i] = json_decode(substr((string) $out, (int) strpos((string) $out, '{')), true) ?: ['ok' => false, 'raw' => $out];
  }
  return $res;
};
$setFail = static function (string $tables) use ($tmp): void { file_put_contents($tmp . '/sbfail.txt', $tables); };
$audit = static function () use ($tmp): array {
  $f = $tmp . '/data/wd_audit.jsonl';
  return is_file($f) ? array_values(array_filter(array_map(static fn($l) => json_decode($l, true), file($f, FILE_IGNORE_NEW_LINES) ?: []))) : [];
};

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$pendIds = static function (array $j): array { $ids = array_column($j['rows'] ?? [], 'id'); sort($ids); return $ids; };
$want = ['wd_conf', 'wd_new', 'wd_old', 'wd_orph', 'wd_pay2', 'wd_rej2', 'wd_sil'];

echo "1) Un retrait en attente reste en attente (rechargements, copies périmées, joueur absent des profils)\n";
$first = $call(['action' => 'wdx', 'tab' => 'pending']);
check('la page « 💸 Retraits » répond', !empty($first['ok']), empty($first['ok']) ? json_encode($first) : '');
check('« À payer » = les 7 retraits en attente du registre', $pendIds($first) === $want, implode(',', $pendIds($first)));
$same = true;
for ($k = 0; $k < 3; $k++) { @unlink($tmp . '/data/admin_cache_wd_epoch3.json'); if ($pendIds($call(['action' => 'wdx', 'tab' => 'pending'])) !== $want) $same = false; }
check('3 rechargements de suite : exactement les mêmes retraits', $same);
$rows = []; foreach ($first['rows'] ?? [] as $r) $rows[$r['id']] = $r;
check('le plus ancien est en haut de la liste', (($first['rows'][0]['id'] ?? '') === 'wd_old'), (string) ($first['rows'][0]['id'] ?? ''));
check('ancien (> 48 h) signalé en rouge', ($rows['wd_old']['level'] ?? '') === 'red' && str_contains(json_encode($rows['wd_old']['flags'] ?? [], JSON_UNESCAPED_UNICODE), 'Ancien'), json_encode($rows['wd_old']['flags'] ?? [], JSON_UNESCAPED_UNICODE));
check('copie Supabase « approved » : le retrait RESTE à payer, avec un avertissement', isset($rows['wd_conf']) && str_contains(json_encode($rows['wd_conf']['flags'] ?? [], JSON_UNESCAPED_UNICODE), 'approved'));
check('copie Supabase « silenced » : le retrait reste à payer', isset($rows['wd_sil']));
check('joueur absent de la liste des profils (e-mail en double) : son retrait reste visible', isset($rows['wd_orph']));
check('trace du journal joueur (heure du téléphone) : pas de 2e retrait fantôme', !preg_grep('/^(utx_|tx_client)/', array_keys($rows)), implode(',', array_keys($rows)));
check('retrait d’un compte démo affilié (partnerWd) : jamais dans « À payer »', !isset($rows['wd_partner']));
check('montant, méthode, numéro et nom affichés', ($rows['wd_new']['amount'] ?? 0) == 12 && ($rows['wd_new']['method'] ?? '') === 'Wave' && ($rows['wd_new']['dest'] ?? '') !== '' && ($rows['wd_new']['name'] ?? '') === 'Joueur 2', json_encode($rows['wd_new'] ?? [], JSON_UNESCAPED_UNICODE));
check('la santé des sources est « OK »', !empty($first['health']['ok']), json_encode($first['health'] ?? null, JSON_UNESCAPED_UNICODE));
$b = $call(['action' => 'badges']);
check('compteur « Retraits en cours » du tableau = 7', (int) ($b['badges']['wd_pending'] ?? -1) === 7, (string) ($b['badges']['wd_pending'] ?? 'absent'));
$lp = $call(['action' => 'list', 'view' => 'wd_pending', 'preset' => 'today', 'page' => 1]);
check('ancienne liste « Retraits en cours » : la case de dates (« Aujourd’hui ») ne cache plus les anciens', (int) ($lp['total'] ?? -1) === 7, (string) ($lp['summary'] ?? json_encode($lp)));

echo "2) Supabase en panne : avertissement, jamais une liste vide ou un « 0 » muet\n";
@unlink($tmp . '/data/admin_cache_wd_epoch3.json');
$setFail('profiles,auth');
foreach (glob($tmp . '/data/admin_cache_*.json') ?: [] as $f) @unlink($f);
$j = $call(['action' => 'wdx', 'tab' => 'pending']);
check('panne partielle (profils) : les 7 retraits restent dans « À payer »', $pendIds($j) === $want, implode(',', $pendIds($j)));
check('panne partielle : avertissement affiché', empty($j['health']['ok']) && count($j['health']['warnings'] ?? []) > 0, json_encode($j['health'] ?? null, JSON_UNESCAPED_UNICODE));
$setFail('*');
foreach (glob($tmp . '/data/admin_cache_*.json') ?: [] as $f) @unlink($f);
$j = $call(['action' => 'wdx', 'tab' => 'pending']);
check('Supabase complètement en panne : les 7 retraits restent dans « À payer »', $pendIds($j) === $want, implode(',', $pendIds($j)));
check('panne totale : avertissement « table retraits n’a pas répondu »', str_contains(json_encode($j['health'] ?? null, JSON_UNESCAPED_UNICODE), 'retraits'), json_encode($j['health'] ?? null, JSON_UNESCAPED_UNICODE));
$b = $call(['action' => 'badges']);
check('compteur du tableau pendant la panne : toujours 7 + avertissement joint', (int) ($b['badges']['wd_pending'] ?? -1) === 7 && empty($b['badges']['wd_health']['ok']), json_encode($b['badges']['wd_health'] ?? null, JSON_UNESCAPED_UNICODE));
$lp = $call(['action' => 'list', 'view' => 'wd_pending', 'preset' => 'all', 'page' => 1]);
check('ancienne liste : le résumé commence par ⚠️ (panne dite clairement)', str_starts_with((string) ($lp['summary'] ?? ''), '⚠️') && (int) ($lp['total'] ?? 0) === 7, (string) ($lp['summary'] ?? ''));
check('une réponse en panne n’est pas gardée en cache (copie Supabase des retraits)', !is_file($tmp . '/data/admin_cache_wd_sb2.json'));
$setFail('');
foreach (glob($tmp . '/data/admin_cache_*.json') ?: [] as $f) @unlink($f);
$j = $call(['action' => 'wdx', 'tab' => 'pending']);
check('la base revient : plus d’avertissement, même liste', !empty($j['health']['ok']) && $pendIds($j) === $want, json_encode($j['health'] ?? null, JSON_UNESCAPED_UNICODE));

echo "3) Payé / rejeté : une seule ligne au journal (qui, quand, ancien → nouvel état)\n";
$r = $call(['action' => 'resolve_wd', 'id' => 'wd_new', 'act' => 'approve', 'expectAmount' => 12, 'expectOpen' => 1]);
check('« Marquer payé » accepté', !empty($r['ok']), json_encode($r, JSON_UNESCAPED_UNICODE));
$a = array_values(array_filter($audit(), static fn($l) => ($l['id'] ?? '') === 'wd_new'));
check('journal : 1 ligne pending → approved, par l’admin, avec montant et numéro', count($a) === 1 && $a[0]['from'] === 'pending' && $a[0]['to'] === 'approved' && str_contains((string) $a[0]['by'], 'admin@orolado.com') && (float) ($a[0]['amount'] ?? 0) === 12.0 && ($a[0]['dest'] ?? '') !== '', json_encode($a, JSON_UNESCAPED_UNICODE));
$r2 = $call(['action' => 'resolve_wd', 'id' => 'wd_new', 'act' => 'approve', 'expectAmount' => 12, 'expectOpen' => 1]);
check('2e « Marquer payé » sur le même retrait : refusé (« déjà payé »)', empty($r2['ok']) && str_contains((string) ($r2['reason'] ?? ''), 'DÉJÀ PAYÉ'), (string) ($r2['reason'] ?? json_encode($r2)));
check('… et le journal n’a toujours qu’1 ligne pour ce retrait', count(array_filter($audit(), static fn($l) => ($l['id'] ?? '') === 'wd_new')) === 1);
$r3 = $call(['action' => 'resolve_wd', 'id' => 'wd_new', 'act' => 'reject', 'motif' => 'x']);
check('« Rejeter » un retrait déjà payé : refusé (pas de remboursement en plus)', empty($r3['ok']), (string) ($r3['reason'] ?? ''));
$j = $call(['action' => 'wdx', 'tab' => 'paid']);
$pr = null; foreach ($j['rows'] ?? [] as $x) if ($x['id'] === 'wd_new') $pr = $x;
check('onglet « Payés » : date de paiement et « par qui » affichés', $pr !== null && $pr['paidAt'] !== '' && str_contains((string) $pr['by'], 'admin@orolado.com') && count($pr['audit'] ?? []) === 1, json_encode($pr, JSON_UNESCAPED_UNICODE));
$r = $call(['action' => 'resolve_wd', 'id' => 'wd_rej2', 'act' => 'reject', 'motif' => 'Numéro faux', 'expectAmount' => 11, 'expectOpen' => 1]);
check('« Rejeter » accepté et remboursé', !empty($r['ok']) && !empty($r['refunded']), json_encode($r, JSON_UNESCAPED_UNICODE));
$a = array_values(array_filter($audit(), static fn($l) => ($l['id'] ?? '') === 'wd_rej2'));
check('journal : 1 ligne pending → rejected avec le motif', count($a) === 1 && $a[0]['to'] === 'rejected' && ($a[0]['note'] ?? '') === 'Numéro faux', json_encode($a, JSON_UNESCAPED_UNICODE));
$r = $call(['action' => 'resolve_wd', 'id' => 'wd_rej2', 'act' => 'reject', 'motif' => 'encore']);
$bank = json_decode((string) @file_get_contents($tmp . '/bank.json'), true) ?: [];
check('2e « Rejeter » : refusé, remboursé UNE seule fois', empty($r['ok']) && count($bank['credits'] ?? []) === 1, json_encode($bank['credits'] ?? []));
$j = $call(['action' => 'wdx', 'tab' => 'rejected']);
check('onglet « Rejetés » : le retrait y est, avec le motif et l’auteur', (bool) array_filter($j['rows'] ?? [], static fn($x) => $x['id'] === 'wd_rej2' && $x['reason'] === 'Numéro faux' && str_contains($x['by'], 'admin')), json_encode(array_column($j['rows'] ?? [], 'id')));

echo "4) Jamais deux changements d'état\n";
$r = $call(['action' => 'resolve_wd', 'id' => 'wd_pay2', 'act' => 'approve', 'expectAmount' => 70, 'expectOpen' => 1]);
check('liste périmée (montant différent) : refusé, rien ne change', empty($r['ok']) && str_contains((string) ($r['reason'] ?? ''), 'montant'), (string) ($r['reason'] ?? ''));
$res = $callParallel([
  ['action' => 'resolve_wd', 'id' => 'wd_pay2', 'act' => 'approve', 'expectAmount' => 7, 'expectOpen' => 1],
  ['action' => 'resolve_wd', 'id' => 'wd_pay2', 'act' => 'approve', 'expectAmount' => 7, 'expectOpen' => 1],
  ['action' => 'resolve_wd', 'id' => 'wd_pay2', 'act' => 'reject', 'motif' => 'clic en même temps', 'expectAmount' => 7, 'expectOpen' => 1],
]);
$nOk = count(array_filter($res, static fn($x) => !empty($x['ok'])));
check('3 clics EN MÊME TEMPS (2 « payé » + 1 « rejeter ») : un seul passe', $nOk === 1, json_encode($res, JSON_UNESCAPED_UNICODE));
check('… une seule ligne au journal pour ce retrait', count(array_filter($audit(), static fn($l) => ($l['id'] ?? '') === 'wd_pay2')) === 1, json_encode(array_values(array_filter($audit(), static fn($l) => ($l['id'] ?? '') === 'wd_pay2')), JSON_UNESCAPED_UNICODE));
$db = json_decode((string) file_get_contents($tmp . '/data/orolado.json'), true);
$st = []; foreach ($db['withdrawals'] ?? [] as $w) $st[$w['id']] = $w;
check('… et le registre est cohérent (payé ⇔ pas remboursé)', isset($st['wd_pay2']) && (($st['wd_pay2']['status'] === 'approved' && empty($st['wd_pay2']['refunded'])) || ($st['wd_pay2']['status'] === 'rejected' && !empty($st['wd_pay2']['refunded']))) && empty($st['wd_pay2']['adminBusy']), json_encode($st['wd_pay2'] ?? null));
$r = $call(['action' => 'resolve_wd', 'id' => 'wd_paid', 'act' => 'approve', 'expectOpen' => 1]);
check('ancien retrait DÉJÀ payé : « Marquer payé » refusé', empty($r['ok']), (string) ($r['reason'] ?? ''));
// Robot des retraits en train d'envoyer : l'admin ne peut pas le marquer payé à la main en même temps.
$db = json_decode((string) file_get_contents($tmp . '/data/orolado.json'), true);
foreach ($db['withdrawals'] as $i => $w) if ($w['id'] === 'wd_old') $db['withdrawals'][$i]['autoTry'] = date('c');
file_put_contents($tmp . '/data/orolado.json', json_encode($db));
foreach (glob($tmp . '/data/admin_cache_*.json') ?: [] as $f) @unlink($f); // la liste se recalcule (cache de 15 s)
$r = $call(['action' => 'resolve_wd', 'id' => 'wd_old', 'act' => 'approve', 'expectAmount' => 30, 'expectOpen' => 1]);
check('robot en train d’envoyer : « Marquer payé » refusé', empty($r['ok']) && str_contains((string) ($r['reason'] ?? ''), 'robot'), (string) ($r['reason'] ?? ''));
$j = $call(['action' => 'wdx', 'tab' => 'pending']);
check('… et il reste dans « À payer », signalé « robot »', (bool) array_filter($j['rows'] ?? [], static fn($x) => $x['id'] === 'wd_old' && str_contains(json_encode($x['flags'], JSON_UNESCAPED_UNICODE), 'robot')));
$rest = $pendIds($j);
check('« À payer » après tout ça : seuls les retraits traités sont partis', $rest === ['wd_conf', 'wd_old', 'wd_orph', 'wd_sil'], implode(',', $rest));
$all = $audit();
check('journal en ajout seulement : 3 lignes en tout, chacune avec qui / quand / ancien → nouvel état', count($all) === 3 && !array_filter($all, static fn($l) => empty($l['t']) || empty($l['by']) || empty($l['from']) || empty($l['to'])), (string) count($all));
$j = $call(['action' => 'wdx', 'tab' => 'history', 'q' => 'joueur 4']);
check('« Historique » : la recherche trouve les retraits du joueur 4', array_column($j['rows'] ?? [], 'id') !== [] && !array_filter($j['rows'] ?? [], static fn($x) => $x['name'] !== 'Joueur 4'), json_encode(array_column($j['rows'] ?? [], 'id')));
$j = $call(['action' => 'wdx', 'tab' => 'history', 'from' => gmdate('Y-m-d', $now + 5 * 86400), 'to' => gmdate('Y-m-d', $now + 6 * 86400)]);
check('« Historique » : filtre de dates (aucun retrait dans le futur)', ($j['total'] ?? -1) === 0, (string) ($j['total'] ?? ''));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
// Nettoyage du dossier temporaire
$rm = static function (string $d) use (&$rm): void { foreach (glob($d . '/{,.}*', GLOB_BRACE) ?: [] as $f) { if (in_array(basename($f), ['.', '..'], true)) continue; is_dir($f) ? $rm($f) : @unlink($f); } @rmdir($d); };
$rm($tmp);
exit($fail === 0 ? 0 : 1);
