<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-20 (propriétaire) — Admin : les dépôts échoués / abandonnés (FAILED, EXPIRED, CANCELLED…, ou en attente depuis
 * plus de 24 h sans paiement) ne sont plus mêlés aux listes ; ils sont dans un volet fermé « ▸ Dépôts échoués / abandonnés (N) ».
 * + liste admin « 💸 Transferts entre joueurs ». Fausse base, dossier temporaire : rien ne part en ligne.
 * Lancer : php scripts/test-admin-depots-abandonnes.php
 */
$tmp = sys_get_temp_dir() . '/orolado_admdep_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
mkdir($tmp . '/feedcache', 0755, true);
foreach (['orolado_lib.php', 'admin_lib.php', 'mail_queue_lib.php', 'admin.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'history_lib.php', 'wipe_lib.php', 'admin_gift_lib.php', 'push_lib.php', 'aff_lib.php', 'aff_rev_lib.php', 'top_lib.php', 'defi_lib.php', 'bonus_lib.php', 'casino_lib.php', 'sports_lib.php', 'admin_games_lib.php', 'transfer_lib.php'] as $f) {
  if (is_file(__DIR__ . '/../' . $f)) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
}
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');

$now = time();
$iso = static fn(int $t): string => gmdate('Y-m-d\TH:i:s\Z', $t);
$U = static fn(int $n): string => sprintf('%08d-aaaa-bbbb-cccc-%012d', $n, $n);
$T = ['profiles' => [], 'deposits' => [], 'withdrawals' => [], 'orders' => [], 'vaults' => [], 'transactions' => []];
$auth = [];
foreach ([1, 2] as $n) {
  $T['profiles'][] = ['id' => $U($n), 'email' => "joueur$n@test.com", 'display_name' => "Joueur $n", 'phone' => '', 'country_code' => '+225',
    'role' => 'user', 'created_at' => $iso($now - 5 * 86400), 'last_seen' => $iso($now - 3600), 'real_deposit_total' => 0, 'real_trades' => 0];
  $T['vaults'][] = ['user_id' => $U($n), 'real' => 10, 'demo' => 1000000];
  $auth[] = ['id' => $U($n), 'email' => "joueur$n@test.com", 'last_sign_in_ip' => '', 'created_at' => $iso($now - 5 * 86400), 'user_metadata' => []];
}
// Dépôts « du jour » : il y a 5 s.
$today = $now - 5;
$dep = function (string $id, string $uid, float $amt, string $status, int $at, bool $done = false) use (&$T, $iso) {
  $T['deposits'][] = ['id' => $id, 'user_id' => $uid, 'amount' => $amt, 'status' => $status, 'operator' => 'flutterwave', 'reference' => $id,
    'created_at' => $iso($at), 'completed_at' => $done ? $iso($at) : null];
};
$dep('d_paid', $U(1), 20, 'COMPLETED', $today, true);
$dep('d_fail', $U(1), 7, 'FAILED', $today);
$dep('d_canc', $U(2), 8, 'CANCELLED', $now - 3 * 86400);
$dep('d_exp', $U(2), 9, 'EXPIRED', $now - 2 * 86400);
$dep('d_pend_new', $U(1), 11, 'PENDING', $now - 3600);
$dep('d_pend_old', $U(2), 12, 'PENDING', $now - 30 * 3600);
$GLOBALS['OROLADO_FAKE_SB'] = function (string $path, string $method, ?string $body, array $hdr) use (&$T, &$auth) {
  $ok = static fn(array $rows): array => ['ok' => true, 'code' => 200, 'rows' => $rows, 'count' => count($rows), 'raw' => json_encode($rows)];
  if (str_starts_with($path, '/auth/v1/admin/users')) {
    parse_str((string) parse_url($path, PHP_URL_QUERY), $q);
    $users = (int) ($q['page'] ?? 1) === 1 ? $auth : [];
    return ['ok' => true, 'code' => 200, 'rows' => [], 'count' => count($users), 'raw' => json_encode(['users' => $users])];
  }
  if (!preg_match('#^/rest/v1/([a-z_]+)\?(.*)$#', $path, $m) || $method !== 'GET') return $ok([]);
  $rows = $T[$m[1]] ?? [];
  foreach (explode('&', $m[2]) as $part) {
    [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
    $v = rawurldecode($v);
    if (in_array($k, ['select', 'order', 'limit'], true)) continue;
    if (str_starts_with($v, 'eq.')) $rows = array_values(array_filter($rows, static fn($r) => (string) ($r[$k] ?? '') === substr($v, 3)));
    else if (str_starts_with($v, 'in.') || str_starts_with($v, 'ilike.')) $rows = [];
    else if ($v === 'not.is.null') $rows = array_values(array_filter($rows, static fn($r) => ($r[$k] ?? null) !== null));
  }
  return $ok($rows);
};
// Base locale : deux comptes liés aux profils, et un transfert Paul → Ali déjà fait (data/xfer/…).
$users = [
  'u_paul' => ['id' => 'u_paul', 'email' => 'joueur1@test.com', 'sbId' => $U(1), 'displayName' => 'Paul', 'publicId' => 'ORPAUL0001'],
  'u_ali' => ['id' => 'u_ali', 'email' => 'joueur2@test.com', 'sbId' => $U(2), 'displayName' => 'Ali', 'publicId' => 'ORALI00002'],
];
file_put_contents($tmp . '/data/orolado.json', json_encode(['users' => $users, 'vault' => [], 'sessions' => [], 'deposits' => [], 'withdrawals' => [], 'support_messages' => [], 'orders' => []]));
file_put_contents($tmp . '/feedcache/live.json', '{}');
mkdir($tmp . '/data/xfer', 0750, true);
$xf = static fn(string $uid): string => $tmp . '/data/xfer/' . hash('sha256', 'xfer|' . $uid) . '.json';
file_put_contents($xf('u_paul'), json_encode(['cap' => 0, 'log' => [['dir' => 'out', 'ref' => 'adm_xf_aaaa', 'amount' => 15, 'at' => $now - 120, 'to' => 'u_ali', 'toId' => 'ORALI00002', 'name' => 'Ali', 'state' => 'done']]]));
file_put_contents($xf('u_ali'), json_encode(['log' => [['dir' => 'in', 'ref' => 'adm_xf_aaaa', 'amount' => 15, 'at' => $now - 119, 'from' => 'u_paul', 'fromId' => 'ORPAUL0001', 'name' => 'Paul', 'state' => 'done']]]));
$GLOBALS['OROLADO_FAKE_PROBE'] = static fn(string $url): int => 200;
$_SERVER['REQUEST_METHOD'] = 'GET';
ob_start();
require $tmp . '/admin.php';
ob_end_clean();

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$refs = static fn(array $rows): array => array_map(static fn($r) => (string) ($r['ref'] ?? $r['cells'][0] ?? ''), $rows);
$sorted = static function (array $a): array { sort($a); return $a; };

echo "1) Règle « échoué / abandonné »\n";
$D = [];
foreach (admin_deposits() as $d) $D[$d['id']] = $d;
check('FAILED / CANCELLED / EXPIRED : abandonnés', admin_dep_is_abandoned($D['d_fail']) && admin_dep_is_abandoned($D['d_canc']) && admin_dep_is_abandoned($D['d_exp']));
check('en attente depuis 30 h : abandonné', admin_dep_is_abandoned($D['d_pend_old']));
check('en attente depuis 1 h : PAS abandonné (peut encore être payé)', !admin_dep_is_abandoned($D['d_pend_new']));
check('payé : jamais abandonné', !admin_dep_is_abandoned($D['d_paid']));

echo "2) Listes : rien de mêlé, volet fermé à part\n";
$j = admin_list_payload('dep_pending', ['preset' => 'all', 'page' => 1]);
check('« Dépôts en Attente » : seulement le dépôt de moins de 24 h', $refs($j['rows'] ?? []) === ['d_pend_new'], json_encode($refs($j['rows'] ?? [])));
check('volet « Dépôts échoués / abandonnés » : 4 lignes', ($j['hidden']['n'] ?? -1) === 4 && $sorted($refs($j['hidden']['rows'] ?? [])) === ['d_canc', 'd_exp', 'd_fail', 'd_pend_old'], json_encode($j['hidden'] ?? null));
check('volet : l\'ancien « en attente » garde Valider / Rejeter (paiement manuel tardif)', (static function () use ($j) { foreach ($j['hidden']['rows'] as $r) if ($r['ref'] === 'd_pend_old') return !empty($r['pending']); return false; })());
$j = admin_list_payload('dep_today', ['preset' => 'all', 'page' => 1]);
check('« Dépôts du Jour » : seulement le dépôt payé', $refs($j['rows'] ?? []) === ['d_paid'], json_encode($refs($j['rows'] ?? [])));
check('« Dépôts du Jour » : volet avec l\'échec du jour seulement', ($j['hidden']['n'] ?? -1) === 1 && $refs($j['hidden']['rows']) === ['d_fail'], json_encode($j['hidden'] ?? null));
$j = admin_list_payload('dep_all', ['preset' => 'all', 'page' => 1]);
check('« Historique Global » : payés seulement + volet de 4', $refs($j['rows'] ?? []) === ['d_paid'] && ($j['hidden']['n'] ?? -1) === 4);
$j = admin_list_payload('dep_failed', ['preset' => 'all', 'page' => 1]);
check('« Dépôts Échoués / Abandonnés » : liste ouverte des 4 (pas de volet)', $sorted($refs($j['rows'] ?? [])) === ['d_canc', 'd_exp', 'd_fail', 'd_pend_old'] && !isset($j['hidden']));
$b = admin_badges();
$b = $b['badges'] ?? $b;
check('compteurs : 1 en attente, 4 échoués / abandonnés', ($b['dep_pending'] ?? -1) === 1 && ($b['dep_failed'] ?? -1) === 4, json_encode(['p' => $b['dep_pending'] ?? null, 'f' => $b['dep_failed'] ?? null]));
$pp = admin_profile_payload($U(2));
$ab = array_values(array_filter($pp['deposits'] ?? [], static fn($d) => !empty($d['abandoned'])));
check('fiche joueur : ses 3 dépôts abandonnés marqués (pour le volet fermé)', count($ab) === 3, json_encode($pp['deposits'] ?? null));
$src = (string) file_get_contents(__DIR__ . '/../admin.php');
check('la page affiche le volet fermé « ▸ … (N) »', str_contains($src, "<details class=\"dep-hidden\"") && str_contains($src, "<span class=\"tri\">▸</span>"));

echo "3) Admin : « 💸 Transferts entre joueurs »\n";
$j = admin_list_payload('xfer_list', ['preset' => 'all', 'page' => 1]);
$c = $j['rows'][0]['cells'] ?? [];
check('une ligne : date, de Paul, à Ali, 15 $, réussi', count($j['rows'] ?? []) === 1 && str_contains($c[1] ?? '', 'Paul') && str_contains($c[2] ?? '', 'Ali') && str_contains($c[3] ?? '', '15') && ($c[4] ?? '') === 'Réussi', json_encode($c, JSON_UNESCAPED_UNICODE));
check('clic sur la ligne = fiche de celui qui envoie', ($j['rows'][0]['userId'] ?? '') === $U(1));
$j = admin_list_payload('xfer_list', ['preset' => 'all', 'page' => 1, 'q' => 'joueur2@test.com']);
check('recherche par e-mail de celui qui reçoit', count($j['rows'] ?? []) === 1);
check('compteur de la case', ($b['xfer_list'] ?? -1) === 1, (string) ($b['xfer_list'] ?? 'absent'));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
