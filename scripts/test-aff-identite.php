<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-21 (propriétaire : « les amis de mes affiliés ont disparu de leur page Invitation ; dans l'admin, la fiche d'un
 * ami est vide ») — un même joueur peut avoir PLUSIEURS fiches (id local u_… + fiche à son id Supabase, ou 2e fiche au
 * même e-mail). Avant, la page Invitation lisait les fichiers d'affiliation de la fiche CONNECTÉE : si c'était l'autre,
 * 0 ami, nouveau lien. On prouve ici :
 *   - l'affilié voit TOUS ses amis, son lien d'origine et ses gains, quelle que soit la fiche connectée ;
 *   - rien n'est payé deux fois (versements additionnés sur toutes ses fiches, ami en double compté une fois,
 *     versement « en cours » sur une autre fiche terminé avec la même référence) ;
 *   - un nouvel ami venu par n'importe quel de ses codes est rangé avec les autres ;
 *   - l'admin : une seule ligne par affilié, et un clic sur un ami ouvre sa VRAIE fiche (date, IP, dépôts).
 * Faux Supabase, dossier temporaire : rien ne part en ligne. Lancer : php scripts/test-aff-identite.php
 */
$tmp = sys_get_temp_dir() . '/orolado_affid_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
mkdir($tmp . '/feedcache', 0755, true);
foreach (['orolado_lib.php', 'admin_lib.php', 'mail_queue_lib.php', 'admin.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'history_lib.php', 'wipe_lib.php', 'admin_gift_lib.php', 'push_lib.php', 'aff_lib.php', 'aff_rev_lib.php', 'top_lib.php', 'defi_lib.php', 'bonus_lib.php', 'casino_lib.php', 'sports_lib.php', 'admin_games_lib.php', 'transfer_lib.php', 'live_lib.php'] as $f) {
  if (is_file(__DIR__ . '/../' . $f)) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
}
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OROLADO_AFF_PUBLIC=1');
putenv('OROLADO_AFF_REV_PCT=60');
putenv('OROLADO_AFF_REV_HOLD_H=24');

$now = time();
$iso = static fn(int $t): string => gmdate('Y-m-d\TH:i:s\Z', $t);
$S = static fn(int $n): string => sprintf('%08d-aaaa-bbbb-cccc-%012d', $n, $n);
$SM = $S(1); $SA = $S(2); $SR = $S(3); // Marc (affilié), Awa et « RTRC » (amis)

// Caisse (faux Supabase) : un crédit par référence, jamais deux (comme la vraie resolve_trade).
$credits = [];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$credits) {
  if (str_contains($url, '/rpc/resolve_trade')) {
    $b = json_decode((string) $body, true) ?: [];
    $k = $b['p_user'] . '|' . $b['p_order'];
    if (!isset($credits[$k])) $credits[$k] = (float) $b['p_amount'];
    $mine = 0.0;
    foreach ($credits as $kk => $v) if (str_starts_with($kk, $b['p_user'] . '|')) $mine += $v;
    return ['ok' => true, 'real' => $mine];
  }
  return [];
};
// Liste admin (profils Supabase + comptes de connexion avec IP).
$T = ['profiles' => [], 'deposits' => [], 'withdrawals' => [], 'orders' => [], 'vaults' => [], 'transactions' => []];
$auth = [];
foreach ([[$SM, 'marc@gmail.com', 'Marc'], [$SA, 'awa@gmail.com', 'Awa'], [$SR, 'rtrc@gmail.com', 'Rita']] as [$id, $em, $nm]) {
  $T['profiles'][] = ['id' => $id, 'email' => $em, 'display_name' => $nm, 'phone' => '', 'country_code' => '+225', 'role' => 'user',
    'created_at' => $iso($now - 9 * 86400), 'last_seen' => $iso($now - 3600), 'real_deposit_total' => 0, 'real_trades' => 0];
  $auth[] = ['id' => $id, 'email' => $em, 'last_sign_in_ip' => '41.66.1.' . substr($id, 7, 1), 'created_at' => $iso($now - 9 * 86400), 'user_metadata' => ['country_code' => 'CI']];
}
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
file_put_contents($tmp . '/data/orolado.json', json_encode(['users' => ['admin_master' => ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin']],
  'vault' => [], 'sessions' => [], 'deposits' => [], 'withdrawals' => [], 'support_messages' => [], 'orders' => []]));
file_put_contents($tmp . '/feedcache/live.json', '{}');
$GLOBALS['OROLADO_FAKE_PROBE'] = static fn(string $url): int => 200;
$_SERVER['REQUEST_METHOD'] = 'GET';
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_rev_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
function setu(string $id, array $u): void { $db = load_db(); $db['users'][$id] = ['id' => $id, 'role' => 'user'] + $u; $db['vault'][$id] = $db['vault'][$id] ?? ['demo' => 1000000, 'real' => 0]; save_db(orolado_data_file(), $db); }
function lose(string $uid, float $amt, int $when): void { // dépôt réel + pari perdu, réglés il y a 3 jours (après le délai de 24 h)
  $db = load_db(); $at = date('c', $when);
  $id = 'flw_' . bin2hex(random_bytes(5));
  $db['deposits'][] = ['id' => $id, 'ref' => $id, 'userId' => $uid, 'amount' => $amt, 'status' => 'COMPLETED', 'operator' => 'flutterwave', 'createdAt' => $at, 'paidAt' => $at];
  $db['orders'][] = ['id' => 'o_' . bin2hex(random_bytes(5)), 'userId' => $uid, 'mode' => 'real', 'status' => 'lost', 'won' => false, 'stake' => $amt, 'payout' => 1.9, 'settledAt' => $at, 'createdAt' => $at];
  save_db(orolado_data_file(), $db);
}
function paid_to(string $sb): float { global $credits; $s = 0.0; foreach ($credits as $k => $v) if (str_starts_with($k, $sb . '|affrev_')) $s += $v; return round($s, 2); }
function st(string $uid): array { return orolado_aff_status(load_db(), load_db()['users'][$uid]); }
$OLD = $now - 3 * 86400;

echo "1) Marc invite 2 amis depuis sa fiche locale ; ils perdent 100 \$ chacun → 120 \$ versés\n";
setu('u_marc', ['email' => 'marc@gmail.com', 'displayName' => 'Marc', 'sbId' => $SM, 'publicId' => 'ORO-100001', 'createdAt' => date('c', $now - 9 * 86400)]);
setu('u_awa', ['email' => 'awa@gmail.com', 'displayName' => 'Awa', 'sbId' => $SA, 'publicId' => 'ORO-200002', 'createdAt' => date('c', $now - 8 * 86400)]);
// « RTRC » : fiche locale SANS lien Supabase + une 2e fiche à son id Supabase (autre numéro ORO-) — cas de la fiche admin vide.
setu('u_rtrc', ['email' => 'rtrc@gmail.com', 'displayName' => 'Rita', 'publicId' => 'ORO-300003', 'createdAt' => date('c', $now - 8 * 86400), 'country' => 'CI']);
setu($SR, ['email' => 'rtrc@gmail.com', 'displayName' => 'Rita', 'publicId' => 'ORO-399999', 'createdAt' => date('c', $now - 2 * 86400)]);
$s0 = st('u_marc');
$code = (string) $s0['code'];
check('Awa reliée à Marc', orolado_aff_attach(load_db(), 'u_awa', $code));
check('Rita reliée à Marc', orolado_aff_attach(load_db(), 'u_rtrc', $code));
lose('u_awa', 100, $OLD); lose('u_rtrc', 100, $OLD);
$s1 = st('u_marc');
check('page de Marc : 2 amis', (int) $s1['friends'] === 2 && count($s1['list']) === 2, (string) $s1['friends']);
check('120 $ versés (60 % de 200 $)', abs(paid_to($SM) - 120) < 0.001 && abs((float) $s1['rev']['paid'] - 120) < 0.001, (string) paid_to($SM));

echo "2) LE BUG : une fiche « Trader » à son id Supabase apparaît (crédit / vérification des paiements) et sa connexion tombe dessus\n";
setu($SM, ['email' => '', 'displayName' => 'Trader', 'createdAt' => date('c')]); // comme credit_paid_deposit_core pour un dépôt rangé sous l'id Supabase
check('avant la correction, la page lisait les fichiers de CETTE fiche : 0 ami (c\'est le bug)', orolado_aff_fr_lines($SM) === [] && orolado_aff_code($SM) !== $code);
$s2 = st($SM);
check('maintenant : ses 2 amis sont là', (int) $s2['friends'] === 2 && count($s2['list']) === 2, (string) $s2['friends']);
check('même lien qu\'avant (code d\'origine, pas un nouveau)', (string) $s2['code'] === $code, (string) $s2['code']);
check('ses gains affichés : 120 $ versés', abs((float) $s2['rev']['paid'] - 120) < 0.001, (string) $s2['rev']['paid']);
check('rien de nouveau payé (pas de double versement)', abs(paid_to($SM) - 120) < 0.001 && empty($s2['rev']['justPaid']), (string) paid_to($SM));

echo "3) 2e fiche au même e-mail (connexion Google) : toujours tous ses amis\n";
setu('u_marc_g', ['email' => 'marc@gmail.com', 'displayName' => 'Marc', 'authProvider' => 'google', 'publicId' => 'ORO-100009']);
$s3 = st('u_marc_g');
check('2 amis, même lien, rien payé en plus', (int) $s3['friends'] === 2 && (string) $s3['code'] === $code && abs(paid_to($SM) - 120) < 0.001);

echo "4) Un nouvel ami s'inscrit avec le code qu'avait reçu l'autre fiche → rangé avec les autres\n";
$codeB = orolado_aff_register_code($SM); // ce que faisait l'ancienne page quand la connexion tombait sur l'autre fiche
setu('u_cy', ['email' => 'cy@gmail.com', 'displayName' => 'Cy', 'sbId' => $S(4), 'publicId' => 'ORO-400004']);
check('Cy relié', orolado_aff_attach(load_db(), 'u_cy', $codeB));
check('Cy rangé sur la fiche maison (u_marc)', (orolado_aff_read(orolado_aff_inv_name('u_cy'))['inviter'] ?? '') === 'u_marc');
foreach (['u_marc', $SM, 'u_marc_g'] as $who) check('page vue depuis ' . $who . ' : 3 amis', (int) st($who)['friends'] === 3);
check('se relier soi-même avec sa 2e fiche : refusé', !orolado_aff_attach(load_db(), 'u_marc_g', $code));

echo "5) Ancienne séparation : des amis et un versement déjà faits sur l'AUTRE fiche → additionnés, jamais repayés\n";
// Dan a été relié à la fiche $SM avant la correction (ligne écrite telle quelle), il a perdu 100 $, et 30 $ ont déjà été versés depuis $SM.
setu('u_dan', ['email' => 'dan@gmail.com', 'displayName' => 'Dan', 'sbId' => $S(5), 'publicId' => 'ORO-500005']);
file_put_contents(orolado_aff_fr_file($SM), json_encode(['u' => 'u_dan', 'a' => date('c', $now - 5 * 86400), 'i' => '', 'c' => $codeB, 'nm' => 'Dan']) . "\n", FILE_APPEND);
orolado_aff_with(orolado_aff_inv_name('u_dan'), static function (&$x) use ($SM) { $x = ['inviter' => $SM, 'at' => date('c'), 'paid' => false]; });
lose('u_dan', 100, $OLD);
$credits[$SM . '|affrev_old_split'] = 30.0;
orolado_aff_with(orolado_aff_rev_name($SM), static function (&$x) { $x = ['withdrawn' => 30.0, 'log' => [['ref' => 'affrev_old_split', 'amount' => 30.0, 'at' => date('c', time() - 86400)]]]; });
// Awa a aussi une 2e fiche (id Supabase), reliée par erreur à $SM : même personne → comptée UNE fois.
setu($SA, ['email' => '', 'displayName' => 'Trader']);
file_put_contents(orolado_aff_fr_file($SM), json_encode(['u' => $SA, 'a' => date('c'), 'i' => '', 'c' => $codeB, 'nm' => '']) . "\n", FILE_APPEND);
for ($i = 0; $i < 3; $i++) { st('u_marc'); st($SM); st('u_marc_g'); }
$db = load_db();
orolado_aff_build_indexes($db);
foreach (orolado_aff_index_ids() as $aid) orolado_aff_rev_run($db, (string) $aid); // passage horaire de tous les affiliés
orolado_aff_rev_run($db, $SM); orolado_aff_rev_run($db, 'u_marc_g');
orolado_aff_clear_indexes();
$w = orolado_aff_rev_wallet(load_db(), $SM);
check('dû = 60 % de 300 $ (Awa, Rita, Dan ; Awa pas comptée deux fois) = 180 $', abs((float) $w['entitled'] - 180) < 0.001, (string) $w['entitled']);
check('versé au total = 180 $ exactement (120 + 30 déjà versés + 30 nouveaux)', abs(paid_to($SM) - 180) < 0.001 && abs((float) $w['withdrawn'] - 180) < 0.001, paid_to($SM) . ' / ' . $w['withdrawn']);
$s5 = st($SM);
check('page : 5 lignes d\'amis (Awa, Rita, Cy, Dan + ancienne 2e fiche d\'Awa), versé 180 $, plus rien à verser', count($s5['list']) === 5 && abs((float) $s5['rev']['paid'] - 180) < 0.001 && (float) $s5['rev']['withdrawable'] < 0.01, count($s5['list']) . ' / ' . $s5['rev']['paid']);

echo "6) Versement resté « en cours » sur l'autre fiche (réponse de la caisse perdue) : même référence, jamais payé deux fois\n";
lose('u_cy', 50, $OLD); // +30 $ dus
$credits[$SM . '|affrev_lost_resp'] = 10.0; // la caisse a déjà payé 10 $, la fiche ne l'a jamais noté
orolado_aff_with(orolado_aff_rev_name($SM), static function (&$x) { $x['pending'] = ['ref' => 'affrev_lost_resp', 'amount' => 10.0, 'total' => 40.0, 'at' => date('c')]; });
for ($i = 0; $i < 3; $i++) { st('u_marc_g'); orolado_aff_rev_run(load_db(), 'u_marc'); }
check('dû 210 $, versé 210 $ exactement (le 10 $ « perdu » n\'est pas repayé)', abs(paid_to($SM) - 210) < 0.001, (string) paid_to($SM));
check('plus rien « en cours »', !isset(orolado_aff_read(orolado_aff_rev_name($SM))['pending']) && !isset(orolado_aff_read(orolado_aff_rev_name('u_marc'))['pending']));

echo "7) Une personne déjà reliée ne peut pas l'être une 2e fois par son autre fiche\n";
setu('u_eve', ['email' => 'eve@gmail.com', 'displayName' => 'Eve', 'sbId' => $S(6)]);
check('Eve reliée', orolado_aff_attach(load_db(), 'u_eve', $code));
setu($S(6), ['email' => '', 'displayName' => 'Trader']);
check('sa fiche Supabase : refusée (reliée une seule fois, à vie)', !orolado_aff_attach(load_db(), $S(6), $code));

echo "8) Admin\n";
$er = error_reporting(E_ALL & ~E_WARNING); // (session PHP : sans objet en ligne de commande)
ob_start();
require $tmp . '/admin.php'; // chargé ici : l'admin lit la base une fois par demande (comme en ligne)
ob_end_clean();
error_reporting($er);
admin_bust_cache();
$ov = orolado_aff_admin_overview(load_db());
check('suivi des affiliés : UNE ligne pour Marc (pas une par fiche)', count(array_filter($ov['rows'], static fn($r) => in_array($r['uid'], ['u_marc', $SM, 'u_marc_g'], true))) === 1);
check('admin : fiche maison retrouvée depuis l\'id Supabase', admin_aff_local_uid($SM, '') === 'u_marc');
$det = admin_aff_detail(admin_aff_local_uid($SM, ''));
check('fiche affilié : 6 amis, lien d\'origine', is_array($det) && (int) $det['friends'] === 6 && str_ends_with((string) $det['link'], $code), is_array($det) ? (string) $det['friends'] : 'null');
$g = admin_gift_payload('gift_aff', [], []);
check('« 🤝 Affiliés (suivi complet) » : une seule ligne pour Marc', count(array_filter($g['rows'], static fn($r) => in_array($r['cells'][0], ['ORO-100001', 'ORO-100009', '—'], true) && $r['cells'][1] === 'Marc' || ($r['cells'][4] ?? '') === '6')) === 1, json_encode(array_map(static fn($r) => $r['cells'][0] . '|' . $r['cells'][4], $g['rows'])));
$gf = admin_gift_payload('gift_friends', [], []);
$rita = null; foreach ($gf['rows'] as $r) if (($r['cells'][1] ?? '') === 'rtrc@gmail.com') $rita = $r;
check('liste des amis : Rita a un identifiant à ouvrir', is_array($rita) && ($rita['userId'] ?? '') !== '' && ($rita['userId'] ?? '') !== '—', json_encode($rita['userId'] ?? null));
$pp = admin_profile_payload((string) ($rita['userId'] ?? ''));
check('clic sur Rita → SA fiche (e-mail, date d\'inscription, IP)', ($pp['user']['email'] ?? '') === 'rtrc@gmail.com' && ($pp['user']['createdAt'] ?? '') !== '' && ($pp['user']['ip'] ?? '') !== '' && ($pp['user']['ip'] ?? '') !== '—', json_encode($pp['user'] ?? null));
check('… avec son pari de 100 $ (rangé sous sa fiche locale u_…)', abs((float) ($pp['totals']['stake'] ?? 0) - 100) < 0.001 && (int) ($pp['totals']['trades'] ?? 0) === 1, json_encode($pp['totals'] ?? null));
$pp2 = admin_profile_payload('ORO-300003'); // ancien clic (numéro ORO- de la fiche locale, absent de la liste)
check('ancien clic par son numéro ORO- : plus de fiche vide', ($pp2['user']['email'] ?? '') === 'rtrc@gmail.com' && ($pp2['user']['createdAt'] ?? '') !== '', json_encode($pp2['user'] ?? null));
$pp3 = admin_profile_payload($SA);
check('fiche normale (id dans la liste) inchangée', ($pp3['user']['id'] ?? '') === $SA && ($pp3['user']['email'] ?? '') === 'awa@gmail.com');

echo "9) scripts/aff-diagnose.php (à lancer sur le serveur) : toutes les fiches de la personne et leurs amis\n";
@mkdir($tmp . '/scripts', 0755, true);
copy(__DIR__ . '/aff-diagnose.php', $tmp . '/scripts/aff-diagnose.php');
foreach (['marc@gmail.com', $SM, 'ORO-100009'] as $qq) {
  $js = json_decode((string) shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($tmp . '/scripts/aff-diagnose.php') . ' ' . escapeshellarg($qq) . ' --json 2>&1'), true);
  check('diagnostic « ' . $qq . ' » : 3 fiches, maison u_marc, 6 amis en tout', is_array($js) && ($js['home'] ?? '') === 'u_marc' && count($js['ids'] ?? []) === 3
    && (int) ($js['page']['amis (toutes fiches, sans doublon)'] ?? 0) === 6 && (int) ($js['ids']['u_marc']['amis (lignes)'] ?? 0) === 4 && (int) ($js['ids'][$SM]['amis (lignes)'] ?? 0) === 2,
    is_array($js) ? json_encode(['home' => $js['home'], 'n' => count($js['ids']), 'page' => $js['page']], JSON_UNESCAPED_UNICODE) : 'sortie illisible');
}
$txt = (string) shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($tmp . '/scripts/aff-diagnose.php') . ' marc@gmail.com 2>&1');
check('diagnostic lisible (texte) : fiche maison marquée, amis listés', str_contains($txt, 'MAISON') && str_contains($txt, 'u_awa') && str_contains($txt, 'u_dan'));
$riv = live_rids_for(['u_marc']);
$jr = json_decode((string) shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($tmp . '/scripts/aff-diagnose.php') . ' ' . escapeshellarg((string) ($riv['u_marc'] ?? 'R?')) . ' --json 2>&1'), true);
check('diagnostic par identifiant R… (comme RYRP912)', is_array($jr) && ($jr['home'] ?? '') === 'u_marc', (string) ($riv['u_marc'] ?? ''));

echo "\n" . ($fail === 0 ? 'TOUT EST BON' : 'PROBLÈME') . " : $pass OK, $fail échec(s)\n";
if (in_array('--show', $argv ?? [], true)) echo $txt;
exec('rm -rf ' . escapeshellarg($tmp));
exit($fail === 0 ? 0 : 1);
