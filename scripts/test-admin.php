<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Test du tableau admin : chaque bouton, les compteurs, les bonus séparés, la détection
 * « Suspects à vérifier » et la santé du site — avec une FAUSSE base (rien ne part en ligne).
 * Lancer : php scripts/test-admin.php
 */
$tmp = sys_get_temp_dir() . '/orolado_adm_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
mkdir($tmp . '/feedcache', 0755, true);
foreach (['orolado_lib.php', 'admin_lib.php', 'mail_queue_lib.php', 'admin.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'history_lib.php', 'wipe_lib.php', 'admin_gift_lib.php', 'push_lib.php', 'aff_lib.php', 'top_lib.php', 'defi_lib.php', 'bonus_lib.php', 'casino_lib.php', 'sports_lib.php', 'admin_games_lib.php'] as $f) {
  if (is_file(__DIR__ . '/../' . $f)) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
}
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');

$now = time();
$iso = static fn(int $t): string => gmdate('Y-m-d\TH:i:s\Z', $t);
$U = static fn(int $n): string => sprintf('%08d-aaaa-bbbb-cccc-%012d', $n, $n);
$T = [
  'profiles' => [], 'deposits' => [], 'withdrawals' => [], 'orders' => [], 'vaults' => [], 'transactions' => [],
];
$auth = [];
$mk = function (int $n, float $depTotal, float $real, string $ip = '') use (&$T, &$auth, $U, $iso, $now) {
  $id = $U($n);
  $T['profiles'][] = ['id' => $id, 'email' => "joueur$n@test.com", 'display_name' => "Joueur $n", 'phone' => '', 'country_code' => '+225',
    'role' => 'user', 'created_at' => $iso($now - 3 * 86400 - $n), 'last_seen' => $iso($now - 3600), 'real_deposit_total' => $depTotal, 'real_trades' => 0];
  $T['vaults'][] = ['user_id' => $id, 'real' => $real, 'demo' => 1000000];
  $auth[] = ['id' => $id, 'email' => "joueur$n@test.com", 'last_sign_in_ip' => $ip, 'created_at' => $iso($now - 3 * 86400 - $n), 'user_metadata' => []];
  return $id;
};
$dep = function (string $uid, float $amt, string $op, string $id) use (&$T, $iso, $now) {
  $T['deposits'][] = ['id' => $id, 'user_id' => $uid, 'amount' => $amt, 'status' => 'COMPLETED', 'operator' => $op, 'reference' => $id,
    'created_at' => $iso($now - 7200), 'completed_at' => $iso($now - 7200)];
};
$wd = function (string $uid, float $amt, string $status, string $phone, string $id) use (&$T, $iso, $now) {
  $T['withdrawals'][] = ['id' => $id, 'user_id' => $uid, 'amount' => $amt, 'status' => $status, 'operator' => 'wave', 'phone' => $phone,
    'reference' => $id, 'destination' => $phone, 'created_at' => $iso($now - 1800)];
};
$ord = function (string $uid, float $stake, float $net, string $side, int $ago, float $payout = 1.88) use (&$T, $iso, $now) {
  static $k = 0;
  $k++;
  $T['orders'][] = ['id' => 'o' . $k, 'user_id' => $uid, 'asset_id' => 'v100', 'side' => $side, 'stake' => $stake, 'duration' => 10,
    'mode' => 'real', 'won' => $net > 0, 'net' => $net, 'status' => $net > 0 ? 'won' : 'lost', 'payout' => $payout, 'created_at' => $iso($now - $ago)];
};

// P1 honnête : dépôt 100, 10 trades variés (−20), retrait 50 en attente, solde cohérent 30.
$p1 = $mk(1, 100, 30);
$dep($p1, 100, 'flutterwave', 'd1');
for ($i = 0; $i < 10; $i++) $ord($p1, 2 + $i, $i % 2 ? -(2 + $i) : 0.5, $i % 3 ? 'call' : 'put', 600 + $i * 60);
$T['orders'][count($T['orders']) - 1]['net'] = 0; // ajustement : total net exactement −20 plus bas
$sum = 0.0; foreach ($T['orders'] as $o) if ($o['user_id'] === $p1) $sum += $o['net'];
$T['orders'][0]['net'] += -20 - $sum;
$wd($p1, 50, 'pending', '+2250711111111', 'w1');
// P2 : bonus seulement (20 $), demande un retrait de 15 $.
$p2 = $mk(2, 20, 5);
$dep($p2, 20, 'admin', 'adm_p2');
$wd($p2, 15, 'pending', '+2250722222222', 'w2');
// P3 : dépôt 10, gain net 5, mais solde 500 : incohérent.
$p3 = $mk(3, 10, 500);
$dep($p3, 10, 'oxapay', 'd3');
$ord($p3, 5, 5, 'call', 900);
$wd($p3, 100, 'pending', '+2250733333333', 'w3');
// P4 et P5 : même numéro de retrait.
$p4 = $mk(4, 50, 10);
$dep($p4, 50, 'flutterwave', 'd4');
for ($i = 0; $i < 5; $i++) $ord($p4, 1 + $i, -0.0, $i % 2 ? 'call' : 'put', 700 + $i * 50);
$wd($p4, 40, 'pending', '+225 07 01 02 03 04', 'w4');
$p5 = $mk(5, 30, 0);
$dep($p5, 30, 'flutterwave', 'd5');
$wd($p5, 25, 'approved', '0701020304', 'w5');
// P6 : bonus 30 $, jamais de retrait : pas suspect, mais « sans dépôt payé ».
$p6 = $mk(6, 30, 30);
$dep($p6, 30, 'admin', 'adm_p6');
// P7 : gros gain ×50 aujourd'hui (+800) puis retrait 300, solde cohérent.
$p7 = $mk(7, 20, 520);
$dep($p7, 20, 'flutterwave', 'd7');
$ord($p7, 16.33, 800, 'call', 500, 50);
$ord($p7, 5, 0, 'put', 450);
$wd($p7, 300, 'pending', '+2250777777777', 'w7');
// P8/P9 : même IP (petit groupe) ; P9 a reçu un bonus.
$p8 = $mk(8, 40, 40, '41.1.1.1');
$dep($p8, 40, 'flutterwave', 'd8');
$p9 = $mk(9, 10, 10, '41.1.1.1');
$dep($p9, 10, 'admin', 'adm_p9');
// 10 comptes sur l'IP d'un opérateur mobile : ne doivent PAS être signalés.
for ($n = 20; $n < 30; $n++) { $id = $mk($n, 0, 0, '102.0.0.1'); }
$dep($U(20), 5, 'admin', 'adm_p20');

// 2026-10-22 (propriétaire) — COMPTE ADMIN (maison) : son vrai dépôt carte, ses recharges « Recharger mon compte admin »
// (self_topup → admin_credit_player('admin_master', …)), son retrait et son trade ne doivent changer AUCUN chiffre :
// tous les totaux vérifiés plus bas restent ceux des vrais joueurs.
$pAdm = $U(99);
$T['profiles'][] = ['id' => $pAdm, 'email' => 'admin@orolado.com', 'display_name' => 'Admin', 'phone' => '', 'country_code' => '+977',
  'role' => 'admin', 'created_at' => $iso($now - 600), 'last_seen' => $iso($now - 10), 'real_deposit_total' => 2500, 'real_trades' => 1];
$T['vaults'][] = ['user_id' => $pAdm, 'real' => 5000, 'demo' => 1000000];
$auth[] = ['id' => $pAdm, 'email' => 'admin@orolado.com', 'last_sign_in_ip' => '27.34.0.1', 'created_at' => $iso($now - 600), 'user_metadata' => []];
$dep($pAdm, 500, 'flutterwave', 'd_adm');
$dep('admin_master', 1000, 'admin', 'adm_self1');
$dep($pAdm, 1000, 'admin', 'adm_self2');
$wd($pAdm, 200, 'pending', '+9779800000000', 'w_adm');
$ord($pAdm, 50, 45, 'call', 300);

$GLOBALS['OROLADO_FAKE_SB'] = function (string $path, string $method, ?string $body, array $hdr) use (&$T, &$auth) {
  $ok = static fn(array $rows): array => ['ok' => true, 'code' => 200, 'rows' => $rows, 'count' => count($rows), 'raw' => json_encode($rows)];
  if (str_starts_with($path, '/auth/v1/admin/users')) {
    parse_str((string) parse_url($path, PHP_URL_QUERY), $q);
    $page = (int) ($q['page'] ?? 1);
    $users = $page === 1 ? $auth : [];
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
    else if (str_starts_with($v, 'gte.')) $rows = array_values(array_filter($rows, static fn($r) => strcmp((string) ($r[$k] ?? ''), substr($v, 4)) >= 0));
    else if (str_starts_with($v, 'in.') || str_starts_with($v, 'ilike.')) $rows = [];
    else if ($v === 'not.is.null') $rows = array_values(array_filter($rows, static fn($r) => ($r[$k] ?? null) !== null));
  }
  $from = 0; $to = 999;
  foreach ($hdr as $h) if (preg_match('/^Range:\s*(\d+)-(\d+)/i', (string) $h, $mm)) { $from = (int) $mm[1]; $to = (int) $mm[2]; }
  return $ok(array_slice($rows, $from, $to - $from + 1));
};

// Base locale : un trade réel resté ouvert 10 min après sa fin (règlement bloqué).
// Un vrai retrait est toujours enregistré aussi par le serveur (fichier) : on recopie les retraits.
$localWds = array_map(static fn($w) => ['id' => $w['id'], 'userId' => $w['user_id'], 'amount' => $w['amount'], 'status' => $w['status'],
  'operator' => $w['operator'], 'phone' => $w['phone'], 'destination' => $w['destination'], 'at' => $w['created_at']], $T['withdrawals']);
// P8 : joueur dont le fichier utilise un identifiant LOCAL (« ulocal8 », lié à son profil Supabase).
// Son retrait n'existe que dans le fichier, sous l'identifiant local : l'admin doit quand même le voir.
$p8 = $mk(8, 10, 5);
$localWds[] = ['id' => 'wd_local8', 'userId' => 'ulocal8', 'amount' => 5, 'status' => 'pending', 'operator' => 'opay',
  'phone' => '0788888888', 'destination' => '0788888888', 'at' => $iso($now - 900)];
$localUsers8 = ['ulocal8' => ['id' => 'ulocal8', 'email' => 'joueur8@test.com', 'sbId' => $p8]];
// P9 (v2613) : inscrit il y a 5 jours sur le site, mais sa caisse Supabase n'a été créée qu'AUJOURD'HUI
// (1er bonus admin) : il ne doit pas réapparaître dans « Inscriptions du Jour ».
$p9 = $mk(9, 0, 0);
$T['profiles'][count($T['profiles']) - 1]['created_at'] = $iso($now - 120);
$auth[count($auth) - 1]['created_at'] = $iso($now - 120);
$localUsers8['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin'];
$localUsers8['uadmloc'] = ['id' => 'uadmloc', 'email' => 'admin@orolado.com', 'role' => 'admin', 'sbId' => $pAdm];
$localUsers8['ulocal9'] = ['id' => 'ulocal9', 'email' => 'joueur9@test.com', 'sbId' => $p9, 'createdAt' => date('c', $now - 5 * 86400)];
// Faux retrait écrit directement dans Supabase depuis un téléphone (aucun débit) : doit être bloqué.
$T['withdrawals'][] = ['id' => 'wd_fake_phone', 'user_id' => $p1, 'amount' => 9999, 'status' => 'pending', 'operator' => 'wave', 'phone' => '0799999999',
  'reference' => 'wd_fake_phone', 'destination' => '0799999999', 'created_at' => $iso($now - 600)];
file_put_contents($tmp . '/data/orolado.json', json_encode([
  'users' => $localUsers8, 'vault' => [], 'sessions' => [], 'deposits' => [], 'withdrawals' => $localWds, 'support_messages' => [],
  'orders' => [['id' => 'stuck1', 'userId' => $p1, 'mode' => 'real', 'status' => 'open', 'stake' => 3, 'expiryAt' => $now - 600, 'at' => $now - 610]],
]));
file_put_contents($tmp . '/feedcache/live.json', '{}');
file_put_contents($tmp . '/data/otp_mail.log', json_encode(['ts' => date('c'), 'email' => 'a@b.c', 'status' => 'échec']) . "\n" . json_encode(['ts' => date('c'), 'email' => 'a@b.c', 'status' => 'envoyé']) . "\n");

$GLOBALS['OROLADO_FAKE_PROBE'] = static fn(string $url): int => 200;
ob_start();
require $tmp . '/admin.php';
ob_end_clean();

// Aperçu visuel (php scripts/test-admin.php --preview) : page admin avec les fausses données,
// les réponses du serveur sont pré-calculées et servies à la page sans connexion.
if (in_array('--preview', $argv ?? [], true)) {
  $db = json_decode((string) file_get_contents($tmp . '/data/orolado.json'), true);
  $db['users']['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin'];
  file_put_contents($tmp . '/data/orolado.json', json_encode($db));
  $_SESSION['admin_uid'] = 'admin_master';
  $resp = ['badges' => ['ok' => true, 'badges' => admin_badges(), 'board' => admin_board_watch()], 'list' => [], 'profile' => [], 'wipe' => ['ok' => true, 'keep' => [['email' => 'admin@orolado.com', 'name' => 'Admin', 'ids' => ['admin_master'], 'real' => 0, 'admin' => true, 'pid' => 'ORO-ADMIN'], ['email' => 'vraijoueur@gmail.com', 'name' => 'Vrai', 'ids' => ['g1'], 'real' => 12, 'admin' => false, 'pid' => 'ORO-2']], 'delete' => [['email' => 'cc33@laoia.com', 'name' => 'Faux 1', 'ids' => ['f1'], 'real' => 900, 'admin' => false, 'pid' => 'ORO-3'], ['email' => 'x9@tempmail.xyz', 'name' => 'Faux 2', 'ids' => ['f2'], 'real' => 5000, 'admin' => false, 'pid' => 'ORO-4']]]];
  foreach ($ADMIN_TABS as $ts) foreach ($ts as $t) $resp['list'][$t[0]] = admin_list_payload($t[0], ['preset' => 'all', 'page' => 1]);
  foreach ([$p1, $p2, $p3, $p7] as $uid) $resp['profile'][$uid] = admin_profile_payload($uid);
  push_app_user_ping($p1, 'ios', $now - 2 * 86400); push_app_user_ping($p2, 'android', $now - 600); push_app_user_ping('', 'ios', $now - 60);
  $resp['app'] = ['ok' => true] + admin_app_users_payload();
  $logged = true;
  ob_start();
  $html = (static function () use ($tmp, $ADMIN_TABS) {
    $src = file_get_contents($tmp . '/admin.php');
    return substr($src, strpos($src, '?><!DOCTYPE html>') + 2);
  })();
  eval('?>' . $html);
  $page = ob_get_clean();
  $inject = '<script>window.fetch = async (u, o) => { const b = JSON.parse(o.body); const R = ' . json_encode($resp, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) . ';'
    . ' let j = {ok:false, reason:"aperçu"}; if (b.action === "badges") j = R.badges; else if (b.action === "list") j = R.list[b.view] || j; else if (b.action === "profile") j = R.profile[b.userId] || j; else if (b.action === "wipe_plan") j = R.wipe; else if (b.action === "app_users") j = R.app;'
    . ' return { json: async () => j }; };</script>';
  $page = preg_replace('/<script>/', $inject . '<script>', $page, 1);
  $out = __DIR__ . '/../admin-apercu.html';
  file_put_contents($out, $page);
  echo "Aperçu : $out\n";
  exit(0);
}

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$pidOf = static function (string $uid): string {
  foreach (admin_profiles() as $p) if ($p['id'] === $uid) return (string) $p['publicId'];
  return '';
};
$ids = static fn(array $j): array => array_map(static fn($r) => (string) ($r['userId'] ?? ''), $j['rows'] ?? []);

echo "1) Chaque bouton répond\n";
$views = [];
foreach ($ADMIN_TABS as $ts) foreach ($ts as $t) $views[] = $t[0];
$slow = [];
foreach ($views as $v) {
  $t0 = microtime(true);
  $j = admin_list_payload($v, ['preset' => 'all', 'page' => 1]);
  $ms = (microtime(true) - $t0) * 1000;
  if ($ms > 1500) $slow[] = "$v " . round($ms) . ' ms';
  if (empty($j['ok'])) check("bouton $v", false, (string) ($j['reason'] ?? ''));
}
check(count($views) . ' boutons ouvrent leur liste sans erreur', $fail === 0);
check('aucun bouton lent (> 1,5 s)', $slow === [], implode(', ', $slow));

echo "1b) Retrait enregistré sous l'identifiant local du joueur\n";
$w8 = null;
foreach (admin_withdrawals() as $w) if (($w['id'] ?? '') === 'wd_local8') $w8 = $w;
check('le retrait apparaît dans l\'onglet Retraits, rattaché au profil du joueur', $w8 !== null && ($w8['userId'] ?? '') === $p8, json_encode($w8));
check('il est payable (pas « hors site »)', $w8 !== null && empty($w8['offsite']));
$pp8 = admin_profile_payload($p8);
check('il apparaît sur la fiche du joueur, en attente 5 $', in_array('wd_local8', array_map(static fn($r) => (string) ($r['id'] ?? ''), $pp8['withdrawals'] ?? []), true) && abs(($pp8['totals']['wdOpen'] ?? 0) - 5) < 0.01, json_encode($pp8['totals'] ?? []));

echo "1c) Vraie date d'inscription gardée quand la caisse est créée plus tard\n";
$j = admin_list_payload('signup_today', ['preset' => 'all']);
$todayIds = array_map(static fn($r) => (string) ($r['userId'] ?? ''), $j['rows'] ?? []);
check('joueur inscrit il y a 5 jours (caisse créée aujourd\'hui) absent des « Inscriptions du Jour »', !in_array($p9, $todayIds, true), implode(',', $todayIds));
$p9row = null;
foreach (admin_profiles() as $pr) if (($pr['id'] ?? '') === $p9) $p9row = $pr;
check('sa date d\'inscription affichée = la vraie (il y a 5 jours)', $p9row !== null && abs((strtotime((string) $p9row['createdAt']) ?: 0) - ($now - 5 * 86400)) < 5, (string) ($p9row['createdAt'] ?? 'absent'));

echo "2) Bonus jamais mélangés aux dépôts\n";
$j = admin_list_payload('dep_all', ['preset' => 'all']);
check('« Historique Global Dépôts » : 6 dépôts payés, 250 $, aucun bonus', ($j['total'] ?? 0) === 6 && str_contains($j['summary'], '250'), $j['summary'] ?? '');
// v2961 — dépôts / retraits par pays : [pays, nombre, total] ; filtre un pays
$cty = $j['countries'] ?? [];
$nC = array_sum(array_map(static fn($c) => (int) $c[1], $cty)); $sC = array_sum(array_map(static fn($c) => (float) $c[2], $cty));
check('dépôts par pays : nombre et total = toute la liste (6 dépôts, 250 $)', $nC === 6 && abs($sC - 250) < 0.01 && count($cty[0] ?? []) === 3, json_encode($cty));
if ($cty) { $j1 = admin_list_payload('dep_all', ['preset' => 'all', 'country' => $cty[0][0]]); check('filtre « un seul pays » sur les dépôts', ($j1['total'] ?? -1) === (int) $cty[0][1], (string) ($j1['summary'] ?? '')); }
$jw = admin_list_payload('wd_all', ['preset' => 'all']);
check('retraits par pays : nombre = toute la liste', array_sum(array_map(static fn($c) => (int) $c[1], $jw['countries'] ?? [])) === ($jw['total'] ?? -1), json_encode($jw['countries'] ?? []));
$j = admin_list_payload('dep_bonus', ['preset' => 'all']);
check('« Bonus Offerts » : 4 bonus, 65 $ depuis le début', ($j['total'] ?? 0) === 4 && str_contains($j['summary'], 'Depuis le début $ 65'), $j['summary'] ?? '');
$j = admin_list_payload('payers', ['preset' => 'all']);
check('« Payeurs » : sans les joueurs qui n’ont reçu qu’un bonus', !in_array($p2, $ids($j), true) && !in_array($p6, $ids($j), true) && in_array($p1, $ids($j), true));
$j = admin_list_payload('no_deposit', ['preset' => 'all']);
check('« Avec dépôt » (2026-10-25) : seulement les joueurs qui ont vraiment déposé, jamais « bonus seulement »', in_array($p1, $ids($j), true) && !in_array($p2, $ids($j), true) && !in_array($p6, $ids($j), true));
$j = admin_list_payload('profit_total', ['preset' => 'all']);
check('Bénéfice = 250 − 25 = 225 $, bonus à part', str_contains($j['summary'], 'Bénéfice $ 225') && !in_array('Bonus', array_map(static fn($r) => $r['cells'][0], $j['rows']), true), $j['summary'] ?? '');
$pp = admin_profile_payload($p2);
check('Fiche joueur : argent déposé 0 $ / bonus 20 $ séparés', ($pp['totals']['deposits'] ?? -1) == 0 && ($pp['totals']['bonus'] ?? 0) == 20 && count($pp['deposits']) === 0 && count($pp['bonuses']) === 1);
check('Fiche joueur (v2433) : bonus rangés par sorte, le bonus envoyé depuis l’admin est dans « Bonus admin »', ($pp['totals']['bonusBy']['adm'] ?? 0) == 20 && ($pp['totals']['bonusBy']['defi'] ?? -1) == 0 && ($pp['totals']['bonusBy']['dep'] ?? -1) == 0, json_encode($pp['totals']['bonusBy'] ?? null));
$pp = admin_profile_payload($p1);
check('Fiche joueur honnête : 100 $ déposés, 11 trades (dont 1 en cours), net −20 $', ($pp['totals']['deposits'] ?? 0) == 100 && ($pp['totals']['trades'] ?? 0) === 11 && abs(($pp['totals']['net'] ?? 0) + 20) < 0.01, json_encode($pp['totals'] ?? []));

echo "3) Suspects à vérifier\n";
$sus = admin_suspects();
$why = static fn(string $uid): string => (string) ($sus[$uid]['reason'] ?? '');
check('joueur honnête NON signalé', !isset($sus[$p1]), $why($p1));
check('retrait avec bonus seulement', str_contains($why($p2), 'bonus seulement'), $why($p2));
check('solde incohérent (500 $ au lieu de 10 + 5 − 100 en retrait = −85 : +585 $)', str_contains($why($p3), 'Solde plus élevé') && str_contains($why($p3), '585'), $why($p3));
check('même numéro de retrait qu’un autre compte', str_contains($why($p4), 'Même destination') && str_contains($why($p4), $pidOf($p5)), $why($p4));
check('gros gain puis retrait', str_contains($why($p7), 'Gros gain'), $why($p7));
check('même IP + bonus (petit groupe)', str_contains($why($p9), 'Même IP'), $why($p9));
check('IP d’opérateur mobile (10 comptes) ignorée', !isset($sus[$U(20)]), $why($U(20)));
check('bonus sans retrait NON signalé', !isset($sus[$p6]), $why($p6));
$b = admin_badges();
$j = admin_list_payload('wd_suspect', ['preset' => 'all']);
check('compteur « Suspects » = nombre de lignes de la liste', (int) $b['wd_suspect'] === (int) $j['total'], $b['wd_suspect'] . ' / ' . $j['total']);

echo "4) Compteurs\n";
[$d0, $d1] = admin_day_bounds('today');
$wantToday = 0;
foreach ($T['orders'] as $o) if ($o['user_id'] !== $pAdm && admin_in_range($o['created_at'], $d0, $d1)) $wantToday++; // jamais le trade de l'admin
check('compteurs figés supprimés (Temps de jeu / Payout = vrais trades du jour)', $b['trade_minutes'] === $b['games'] && $b['games'] === $wantToday + 1, 'trades du jour ' . $b['games'] . ' (attendu ' . ($wantToday + 1) . ', dont 1 local)');
$netToday = [];
foreach ($T['orders'] as $o) if ($o['user_id'] !== $pAdm && admin_in_range($o['created_at'], $d0, $d1)) $netToday[$o['user_id']] = ($netToday[$o['user_id']] ?? 0) + $o['net'];
$wantWin = count(array_filter($netToday, static fn($v) => $v > 0.009));
check('Top gagnants du jour compté', $b['top_winners'] === $wantWin, $b['top_winners'] . ' (attendu ' . $wantWin . ')');
check('Bonus Offerts compté', $b['dep_bonus'] === 4, (string) $b['dep_bonus']);
check('Retraits en cours = 6 (dont celui sous identifiant local ; le faux « hors site » n’est pas compté)', $b['wd_pending'] === 6, (string) $b['wd_pending']);
$fake = admin_find_wd_row('wd_fake_phone');
check('faux retrait écrit depuis un téléphone : marqué « hors site », non validable', !empty($fake['offsite']) && !admin_wd_is_open($fake), (string) ($fake['status'] ?? 'absent'));
check('un vrai retrait reste validable', admin_wd_has_local(admin_local_db(), (string) $T['withdrawals'][0]['id']));

echo "5) Santé du site (pannes) et « À surveiller » (le reste)\n";
$h = admin_health_rows();
$w = admin_watch_rows();
$find = static function (array $rows, string $svc): array { foreach ($rows as $r) if (($r['service'] ?? '') === $svc) return $r; return []; };
check('trade en retard → « À surveiller », pas dans la santé', ($find($w, 'Trades en retard')['level'] ?? '') === 'warn' && ($find($h, 'Trades')['level'] ?? '') === 'ok', $find($w, 'Trades en retard')['message'] ?? '');
check('gros gain → « À surveiller »', ($find($w, 'Gros gains')['level'] ?? '') === 'warn' && $find($h, 'Gros gains') === []);
check('beaucoup d’e-mails ratés → panne dans la santé', ($find($h, 'E-mails')['level'] ?? '') === 'error', $find($h, 'E-mails')['message'] ?? '');
check('services externes qui répondent → OK', ($find($h, 'Paiement crypto (OxaPay)')['level'] ?? 'ok') === 'ok');
check('problèmes affichés en premier', in_array($h[0]['level'] ?? '', ['error', 'warn'], true));
$GLOBALS['OROLADO_FAKE_PROBE'] = static fn(string $url): int => str_contains($url, 'oxapay') ? 0 : 200;
admin_bust_cache();
$h2 = admin_health_rows();
check('OxaPay injoignable → panne dans la santé', ($find($h2, 'Paiement crypto (OxaPay)')['level'] ?? '') === 'error', $find($h2, 'Paiement crypto (OxaPay)')['message'] ?? '');
$GLOBALS['OROLADO_FAKE_PROBE'] = static fn(string $url): int => 200;
orolado_health_event('Dépôts', 'Dépôt payé mais pas encore crédité (test)');
admin_bust_cache();
$h = admin_health_rows();
$hit = false; foreach ($h as $r) if (str_contains((string) ($r['message'] ?? ''), 'pas encore crédité (test)')) $hit = ($r['level'] === 'error');
check('panne signalée par le site (dépôt non crédité) visible dans la santé', $hit);
$b = admin_badges();
foreach ($h as $r) if (($r['level'] ?? '') === 'error') echo '     [panne] ' . $r['service'] . ' : ' . $r['message'] . "
";
check('compteur Santé en rouge (pannes comptées à part)', ($b['alerts_err'] ?? 0) >= 1 && $b['alerts'] >= $b['alerts_err'], $b['alerts_err'] . ' panne(s), ' . $b['alerts'] . ' au total');

echo "6) Application installée (joueurs, nouveaux du jour, iPhone / Android, sans compte)\n";
check('vide au départ', (admin_app_users_payload()['n']['total'] ?? -1) === 0);
push_app_user_ping($p1, 'ios', $now - 3 * 86400);
push_app_user_ping($p1, 'ios', $now - 3 * 86400 + 60); // même jour : pas un jour de plus
push_app_user_ping($p1, 'ios', $now - 60);
push_app_user_ping($p2, 'android', $now - 30);
push_app_user_ping('ulocal9', 'android', $now - 10);
push_app_user_ping('admin_master', 'android', $now - 100); // comptes admin : jamais comptés dans l'appli
push_app_user_ping($pAdm, 'ios', $now - 90);
push_app_user_ping('', 'ios', $now - 5);
push_app_user_ping('', 'android', $now - 4);
check('identifiant invalide refusé', !push_app_user_ping('a b<script>', 'ios') && !push_app_user_ping($p1, 'tv'));
$ap = admin_app_users_payload();
$an = $ap['n'];
check('3 joueurs dans l’appli (2 Android, 1 iPhone)', $an['total'] === 3 && $an['ios'] === 1 && $an['android'] === 2, json_encode($an));
check('nouveaux aujourd’hui = 2 (le 1er est venu il y a 3 jours)', $an['today'] === 2, (string) $an['today']);
check('2 ouvertures sans compte aujourd’hui', $an['anonToday'] === 2, (string) $an['anonToday']);
$r1 = null; foreach ($ap['list'] as $r) if ($r['id'] === $p1) $r1 = $r;
check('joueur 1 : 2 jours, e-mail et heures', $r1 && $r1['days'] === 2 && $r1['email'] === 'joueur1@test.com' && preg_match('#^\d\d/\d\d/\d{4} \d\d:\d\d$#', $r1['first']), json_encode($r1));
check('liste : plus récents d’abord', ($ap['list'][0]['id'] ?? '') === 'ulocal9' && ($ap['list'][2]['id'] ?? '') === $p1);
check('compte du site : e-mail retrouvé', ($ap['list'][0]['email'] ?? '') === 'joueur9@test.com', json_encode($ap['list'][0] ?? []));
check('fichier jamais à moitié écrit (aucun .tmp restant)', !glob(dirname(push_app_users_file()) . '/app_users.json.tmp*'));

echo "7) Comptes admin (maison) : dans AUCUN chiffre du tableau\n";
check('un seul contrôle : admin_master, profil admin, fiche locale liée = maison ; un joueur non',
  admin_is_house_account('admin_master') && admin_is_house_account($pAdm, ['id' => $pAdm, 'email' => 'admin@orolado.com'])
  && admin_is_house_account($pAdm) && admin_is_house_account('uadmloc') && admin_is_house_account('x', ['email' => 'admin@6diablo.com'])
  && !admin_is_house_account($p1, ['id' => $p1, 'email' => 'joueur1@test.com']) && !admin_is_house_account('ulocal8'));
admin_bust_cache();
$b = admin_badges();
check('Bénéfice total = 225 $ (ni le dépôt carte de l’admin, ni ses recharges, ni son retrait)', abs((float) $b['profit_total'] - 225) < 0.01 && abs((float) $b['profit_today'] - 225) < 0.01, $b['profit_total'] . ' / ' . $b['profit_today']);
check('Total des dépôts = 250 $, retraits validés = 25 $', abs((float) $b['sum_dep_all'] - 250) < 0.01 && abs((float) $b['sum_wd_paid'] - 25) < 0.01, $b['sum_dep_all'] . ' / ' . $b['sum_wd_paid']);
check('compteurs dépôts : 6 payés, 6 aujourd’hui, bonus 4 (la recharge admin n’est pas un bonus)', $b['dep_all'] === 6 && $b['dep_today'] === 6 && $b['dep_bonus'] === 4, $b['dep_all'] . '/' . $b['dep_today'] . '/' . $b['dep_bonus']);
$allIds = array_map(static fn($p) => (string) $p['id'], admin_profiles());
check('l’admin reste dans la liste des comptes (gérable)', in_array($pAdm, $allIds, true));
check('nombre d’inscrits sans l’admin', $b['inscrits'] === count($allIds) - 1 && admin_inscrits_count() === count($allIds) - 1, $b['inscrits'] . ' / ' . count($allIds));
check('« Joueurs en ligne » : l’admin connecté ne compte pas', $b['online'] === 0 && admin_online_count() === 0, (string) $b['online']);
check('« Inscriptions du Jour » : 0 (l’admin, inscrit il y a 10 min, ne compte pas)', $b['signup_today'] === 0, (string) $b['signup_today']);
$vAdm = static function (string $view, array $req = []) use ($pAdm, $ids): bool { return !in_array($pAdm, $ids(admin_list_payload($view, $req + ['preset' => 'all', 'page' => 1])), true); };
$okViews = [];
foreach (['signup_today', 'signup_date', 'online', 'top_balances', 'payers', 'dep_all', 'dep_today', 'dep_bonus', 'dep_top', 'wd_pending', 'wd_all', 'top_winners', 'profit_total', 'wd_suspect'] as $v) if (!$vAdm($v)) $okViews[] = $v;
check('aucune liste-chiffre ne contient l’admin', $okViews === [], implode(', ', $okViews));
check('mais la recherche le retrouve (e-mail admin)', in_array($pAdm, $ids(admin_list_payload('signup_date', ['preset' => 'all', 'q' => 'admin@orolado.com'])), true));
$jg = admin_list_payload('signup_geo', ['preset' => 'all']);
check('pays des inscrits : pas de Népal (+977, l’admin)', !in_array('+977', array_map(static fn($r) => (string) $r['cells'][0], $jg['rows']), true) && $jg['total'] === count($allIds) - 1, (string) $jg['total']);
$jt = admin_list_payload('games', ['preset' => 'all']);
$stakeAll = 0.0; foreach ($T['orders'] as $o) if ($o['user_id'] !== $pAdm) $stakeAll += $o['stake'];
$stakeGot = 0.0; foreach (admin_orders() as $o) $stakeGot += (float) $o['stake'];
check('trades : la mise de 50 $ de l’admin n’est pas comptée', abs($stakeGot - $stakeAll - 3) < 0.01, $stakeGot . ' vs ' . $stakeAll . ' (+3 trade local)');
check('« Application installée » : 3 joueurs (les 2 comptes admin ne comptent pas)', (admin_app_users_payload()['n']['total'] ?? -1) === 3);
// Un VRAI joueur, lui, change les chiffres ; un nouveau dépôt / recharge de l'admin non.
$dep($p1, 40, 'flutterwave', 'd1b');
$dep($pAdm, 777, 'flutterwave', 'd_adm2');
$dep('admin_master', 300, 'admin', 'adm_self3');
admin_bust_cache();
$b = admin_badges();
check('dépôt d’un vrai joueur : +40 $ (250 → 290), dépôts de l’admin ignorés', abs((float) $b['sum_dep_all'] - 290) < 0.01 && abs((float) $b['profit_total'] - 265) < 0.01 && $b['dep_bonus'] === 4, $b['sum_dep_all'] . ' / ' . $b['profit_total']);

echo "8) Casino : jeux les plus joués, aujourd’hui, depuis le début, joueurs — sans les parties des comptes admin\n";
require_once $tmp . '/casino_lib.php';
require_once $tmp . '/sports_lib.php';
require_once $tmp . '/admin_games_lib.php';
$day = gmdate('Y-m-d'); $yday = gmdate('Y-m-d', $now - 86400);
$cell = static fn(int $n, float $in, float $out): array => ['n' => $n, 'in' => $in, 'out' => $out];
// stats.json d'avant : 2 parties de dés d'un vrai joueur + 3 de l'admin aujourd'hui, 2 coin flip de l'admin hier, paris : 1 coupon de chacun
file_put_contents(casino_dir() . '/stats.json', json_encode([
  'all' => ['real' => ['dice' => $cell(5, 50, 40), 'coin' => $cell(2, 20, 30), 'sports' => $cell(2, 15, 20)], 'demo' => ['dice' => $cell(1, 1, 0)]],
  $day => ['real' => ['dice' => $cell(5, 50, 40), 'sports' => $cell(1, 5, 0)]],
  $yday => ['real' => ['coin' => $cell(2, 20, 30), 'sports' => $cell(1, 10, 20)]],
]));
$line = static fn(float $t, string $u, string $g, string $m, float $st, float $w): string => json_encode(['t' => $t, 'u' => $u, 'g' => $g, 'm' => $m, 's' => $st, 'w' => $w, 'x' => 0]) . "\n";
file_put_contents(casino_round_user_file('ulocal8'), $line($now - 50, 'ulocal8', 'dice', 'real', 10, 10) . $line($now - 40, 'ulocal8', 'dice', 'real', 10, 10));
file_put_contents(casino_round_user_file('admin_master'), $line($now - 86400, 'admin_master', 'coin', 'real', 10, 15) . $line($now - 86390, 'admin_master', 'coin', 'real', 10, 15)
  . $line($now - 30, 'admin_master', 'dice', 'real', 10, 20) . $line($now - 20, 'admin_master', 'dice', 'demo', 1, 0));
file_put_contents(casino_round_user_file('uadmloc'), $line($now - 25, 'uadmloc', 'dice', 'real', 10, 0) . $line($now - 15, 'uadmloc', 'dice', 'real', 10, 0));
sp_with('bets.json', static function (array &$s) use ($now) {
  $s['b'] = [['id' => 'sb1', 'uid' => 'admin_master', 'mode' => 'real', 'status' => 'won', 'stake' => 10, 'win' => 20, 'done' => $now - 86400, 'sel' => []],
    ['id' => 'sb2', 'uid' => 'ulocal8', 'mode' => 'real', 'status' => 'lost', 'stake' => 5, 'win' => 0, 'done' => $now, 'sel' => []]];
  return true;
});
$cs = static fn(): array => admin_cs_stats_clean(casino_with(casino_dir() . '/stats.json', static fn(array &$s) => $s) ?: [], $day);
[$ca, $ct] = $cs();
check('« Depuis le début » : dés = 2 parties / 20 $ misés / 20 $ payés (les 3 de l’admin retirées)', ($ca['real']['dice'] ?? null) == $cell(2, 20.0, 20.0), json_encode($ca['real']['dice'] ?? null));
check('« Depuis le début » : coin flip (joué seulement par l’admin) disparaît', !isset($ca['real']['coin']), json_encode($ca['real'] ?? []));
check('« Depuis le début » : paris = le coupon du vrai joueur seulement', ($ca['real']['sports'] ?? null) == $cell(1, 5.0, 0.0), json_encode($ca['real']['sports'] ?? null));
check('« Aujourd’hui » : dés 2 parties / 20 $ ; paris 1 coupon / 5 $', ($ct['real']['dice'] ?? null) == $cell(2, 20.0, 20.0) && ($ct['real']['sports'] ?? null) == $cell(1, 5.0, 0.0), json_encode($ct));
// Désormais casino_stat() ne compte plus l'admin : sa nouvelle partie n'est ni ajoutée, ni retirée deux fois
casino_stat('dice', 'real', 10, 0, 'admin_master', ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin']);
casino_stat('dice', 'real', 10, 0, 'uadmloc', ['id' => 'uadmloc', 'email' => 'admin@orolado.com']);
usleep(2000);
file_put_contents(casino_round_user_file('admin_master'), $line(microtime(true), 'admin_master', 'dice', 'real', 10, 0), FILE_APPEND);
$raw = json_decode((string) file_get_contents(casino_dir() . '/stats.json'), true);
check('partie d’un compte admin : stats.json inchangé (5 parties de dés)', (int) ($raw['all']['real']['dice']['n'] ?? 0) === 5 && !empty($raw['hsFrom']), json_encode($raw['all']['real']['dice'] ?? null));
[$ca, $ct] = $cs();
check('… et l’affichage reste 2 parties (jamais retirée deux fois)', ($ca['real']['dice'] ?? null) == $cell(2, 20.0, 20.0) && ($ct['real']['dice'] ?? null) == $cell(2, 20.0, 20.0), json_encode($ca['real']['dice'] ?? null));
casino_stat('dice', 'real', 10, 5, 'ulocal8', ['id' => 'ulocal8', 'email' => 'joueur8@test.com']);
[$ca, $ct] = $cs();
check('partie d’un vrai joueur : comptée (3 parties / 30 $ misés / 25 $ payés)', ($ca['real']['dice'] ?? null) == $cell(3, 30.0, 25.0) && ($ct['real']['dice'] ?? null) == $cell(3, 30.0, 25.0), json_encode($ca['real']['dice'] ?? null));
$src = (string) file_get_contents($tmp . '/casino_lib.php');
check('les deux fins de partie du casino donnent le joueur à casino_stat()', substr_count($src, 'casino_stat($game, $mode, $stake, $win, $uid, $user)') === 1 && str_contains($src, "casino_stat(\$game, (string) \$g['mode'], (float) \$g['stake'], (float) (\$g['win'] ?? 0), \$uid,"));
check('les paris donnent aussi le joueur à casino_stat()', str_contains((string) file_get_contents($tmp . '/sports_lib.php'), "casino_stat('sports', (string) \$p['mode'], (float) \$p['s'], (float) \$p['w'], (string) \$p['uid'],"));
casino_hist_add('admin_master', ['g' => 'dice', 'm' => 'real', 's' => 500, 'w' => 0, 'at' => $now]);
casino_hist_add('uadmloc', ['g' => 'dice', 'm' => 'real', 's' => 400, 'w' => 0, 'at' => $now]);
casino_hist_add('ulocal8', ['g' => 'dice', 'm' => 'real', 's' => 10, 'w' => 5, 'at' => $now]);
$cpl = array_map(static fn($r) => (string) $r['uid'], admin_cs_players_list(60));
check('« Joueurs du casino » : le vrai joueur, jamais les comptes admin', in_array('ulocal8', $cpl, true) && !in_array('admin_master', $cpl, true) && !in_array('uadmloc', $cpl, true), implode(',', $cpl));
$adm = (string) file_get_contents($tmp . '/admin.php');
check('ligne « Dont vos comptes admin (tests) » retirée', !str_contains($adm, 'Dont vos comptes admin') && !str_contains($adm, "'adm' => \$adm"));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
