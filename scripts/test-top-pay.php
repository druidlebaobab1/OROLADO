<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-10-21 — Tournoi démo : « Payer tout le monde » (admin_gift_lib.php, admin_top_pay_*) et crédit admin
 * sorti en fonction (admin_credit_player, action « adjust »).
 * Dossier temporaire + FAUSSE caisse Supabase (OROLADO_FAKE_SB / _HTTP / _RPC / _MAIL) : rien ne part en ligne,
 * aucun vrai argent. Lancer : php scripts/test-top-pay.php
 *  1. montants (ligne droite, arrondi au cent inférieur, bornes)      5. arrêt au premier refus, reprise, « limit »
 *  2. paramètres refusés                                              6. relancer ne paie personne ; verrou « en cours »
 *  3. aperçu (classés, montants, total)                               7. paiement interrompu (« pending ») jamais repayé
 *  4. « déjà payés à la main » (1 à 3) jamais payés                  8. « adjust » : même résultat qu'AVANT la refonte
 *  E-mail : le même que pour un crédit à la main (orolado_notify_player), une fois par joueur payé, noté au registre,
 *  un e-mail raté ne défait ni ne bloque le crédit ; paquets de 5 par appel (« more ») et reprise après coupure.
 */
$root = realpath(__DIR__ . '/..');
$tmp = sys_get_temp_dir() . '/orolado_toppay_' . bin2hex(random_bytes(4));
$LIBS = ['orolado_lib.php', 'admin_lib.php', 'mail_queue_lib.php', 'admin.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'history_lib.php',
  'wipe_lib.php', 'admin_gift_lib.php', 'push_lib.php', 'aff_lib.php', 'top_lib.php', 'defi_lib.php', 'bonus_lib.php', 'notify_lib.php'];

$U = static fn(int $n): string => sprintf('%08d-aaaa-bbbb-cccc-%012d', $n, $n);

/** Fausse caisse partagée (fichier d'état) : utilisée par ce script ET par les requêtes « admin.php » lancées à part. */
$FAKES = <<<'PHP'
<?php
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
function fk_load(): array { return json_decode((string) file_get_contents(getenv('FAKE_STATE')), true); }
function fk_save(array $s): void { file_put_contents(getenv('FAKE_STATE'), json_encode($s)); }
$GLOBALS['OROLADO_FAKE_SB'] = static function (string $path, string $method, ?string $body, array $hdr) {
  $s = fk_load();
  $ok = static fn(array $rows): array => ['ok' => true, 'code' => 200, 'rows' => $rows, 'count' => count($rows), 'raw' => json_encode($rows)];
  if (str_starts_with($path, '/auth/v1/admin/users')) {
    parse_str((string) parse_url($path, PHP_URL_QUERY), $q);
    $users = (int) ($q['page'] ?? 1) === 1 ? $s['auth'] : [];
    return ['ok' => true, 'code' => 200, 'rows' => [], 'count' => count($users), 'raw' => json_encode(['users' => $users])];
  }
  if ($method !== 'GET' || !preg_match('#^/rest/v1/([a-z_]+)\?(.*)$#', $path, $m)) return $ok([]);
  $rows = $s['tables'][$m[1]] ?? [];
  foreach (explode('&', $m[2]) as $part) {
    [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
    $v = rawurldecode($v);
    if (str_starts_with($v, 'eq.')) $rows = array_values(array_filter($rows, static fn($r) => (string) ($r[$k] ?? '') === substr($v, 3)));
    elseif (str_starts_with($v, 'in.') || str_starts_with($v, 'ilike.')) $rows = [];
  }
  $from = 0; $to = 999;
  foreach ($hdr as $h) if (preg_match('/^Range:\s*(\d+)-(\d+)/i', (string) $h, $mm)) { $from = (int) $mm[1]; $to = (int) $mm[2]; }
  return $ok(array_slice($rows, $from, $to - $from + 1));
};
$GLOBALS['OROLADO_FAKE_HTTP'] = static function (string $url, ?string $body, string $method) {
  $s = fk_load();
  $p = (string) parse_url($url, PHP_URL_PATH);
  parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
  $eq = static fn(string $k): string => str_starts_with((string) ($q[$k] ?? ''), 'eq.') ? substr((string) $q[$k], 3) : '';
  $args = json_decode((string) $body, true) ?: [];
  $out = [];
  if ($p === '/rest/v1/vaults' && $method === 'GET') {
    $id = $eq('user_id');
    $out = isset($s['bal'][$id]) ? [['demo' => 1000000, 'real' => $s['bal'][$id]]] : [];
  } elseif ($p === '/rest/v1/vaults' && $method === 'POST') {
    $s['bal'][(string) ($args['user_id'] ?? '')] = (float) ($args['real'] ?? 0);
  } elseif ($p === '/rest/v1/rpc/debit_real') {
    $id = (string) $args['p_user'];
    if (($s['bal'][$id] ?? 0) + 0.009 < (float) $args['p_amount']) $out = [['ok' => false]];
    else { $s['bal'][$id] = round(($s['bal'][$id] ?? 0) - (float) $args['p_amount'], 2); $s['moves'][] = ['debit', $id, (float) $args['p_amount']]; $out = [['ok' => true, 'real' => $s['bal'][$id]]]; }
  } elseif ($p === '/rest/v1/profiles' && $method === 'GET') {
    foreach ($s['tables']['profiles'] as $r) {
      if (($eq('email') !== '' && $r['email'] === $eq('email')) || ($eq('id') !== '' && $r['id'] === $eq('id'))) $out[] = $r + ['real_deposit_total' => 0];
    }
  } elseif ($p === '/rest/v1/profiles' && $method === 'PATCH') {
    $s['patch'][] = [$eq('id'), $args['real_deposit_total'] ?? null];
  } elseif ($p === '/rest/v1/deposits' && $method === 'POST') {
    $s['sbdeps'][] = $args;
  }
  fk_save($s);
  return $out;
};
$GLOBALS['OROLADO_FAKE_RPC'] = static function (string $fn, array $args) {
  if ($fn !== 'resolve_trade') return null;
  $s = fk_load();
  $id = (string) $args['p_user'];
  if (in_array($id, $s['fail'] ?? [], true)) return ['ok' => false];
  if (isset($s['orders'][$args['p_order']])) return ['ok' => true, 'real' => $s['bal'][$id] ?? 0];
  $s['orders'][$args['p_order']] = 1;
  $s['bal'][$id] = round(($s['bal'][$id] ?? 0) + (float) $args['p_amount'], 2);
  $s['moves'][] = ['credit', $id, (float) $args['p_amount']];
  fk_save($s);
  return ['ok' => true, 'real' => $s['bal'][$id]];
};
$GLOBALS['OROLADO_FAKE_MAIL'] = static function (...$a) {
  $s = fk_load(); $s['mails'][] = (string) ($a[0] ?? ''); $s['mailSubj'][] = (string) ($a[1] ?? ''); fk_save($s);
  return in_array((string) ($a[0] ?? ''), $s['mailfail'] ?? [], true) ? ['ok' => false, 'reason' => 'Brevo HTTP 500'] : ['ok' => true];
};
$GLOBALS['OROLADO_FAKE_PROBE'] = static fn(string $url): int => 200;
PHP;

/** Requête admin « POST admin.php?ajax=1 » dans un processus à part (vraie répartition des actions, session admin). */
$RUNNER = <<<'PHP'
<?php
declare(strict_types=1);
[$_, $dir, $json] = $argv;
require __DIR__ . '/fakes.php';
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['ajax'] = '1';
$_POST = json_decode($json, true);
session_save_path(dirname(__DIR__) . '/sess');
session_name('oro_admin');
session_start();
$_SESSION['admin_uid'] = 'admin_master';
$_SESSION['admin_email'] = 'admin@orolado.com';
require $dir . '/admin.php';
PHP;

/** Installe un dossier de site avec ses fausses données. */
$setup = static function (string $dir, string $src) use ($LIBS, $U, $FAKES, $RUNNER): void {
  @mkdir($dir . '/data/archive', 0755, true);
  @mkdir($dir . '/feedcache', 0755, true);
  foreach ($LIBS as $f) {
    if (is_file($src . '/' . $f)) copy($src . '/' . $f, $dir . '/' . $f);
  }
  file_put_contents($dir . '/fakes.php', $FAKES);
  file_put_contents($dir . '/run.php', $RUNNER);
  file_put_contents($dir . '/feedcache/live.json', '{}');
  $now = time();
  $users = ['admin_master' => ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin', 'publicId' => 'ORO-ADMIN']];
  $profiles = []; $auth = []; $bal = []; $orders = [];
  for ($i = 1; $i <= 13; $i++) {
    $uuid = $U($i);
    $users['u_' . $i] = ['id' => 'u_' . $i, 'email' => "joueur$i@test.com", 'role' => 'user', 'publicId' => sprintf('ORO-%06d', 100000 + $i),
      'name' => "Joueur $i", 'displayName' => "Joueur $i", 'sbId' => $uuid];
    $profiles[] = ['id' => $uuid, 'email' => "joueur$i@test.com", 'display_name' => "Joueur $i", 'role' => 'user',
      'created_at' => gmdate('c', $now - 10 * 86400), 'last_seen' => gmdate('c', $now - 60), 'real_deposit_total' => 0, 'real_trades' => 0];
    $auth[] = ['id' => $uuid, 'email' => "joueur$i@test.com", 'created_at' => gmdate('c', $now - 10 * 86400), 'user_metadata' => []];
    $bal[$uuid] = 1.0;
    // Semaine en cours : joueurs 1 à 12 classés (20 trades), le 13e n'a que 10 trades (pas classé).
    $n = $i === 13 ? 10 : 20;
    for ($k = 0; $k < $n; $k++) {
      $orders[] = ['id' => "c{$i}_$k", 'userId' => 'u_' . $i, 'mode' => 'demo', 'status' => $k === 0 ? 'won' : 'lost', 'stake' => 10,
        'net' => $k === 0 ? (13 - $i) * 10 : 0, 'openedAt' => $now - 30];
    }
    // Semaine dernière : joueurs 1 à 3.
    if ($i <= 3) for ($k = 0; $k < 20; $k++) {
      $orders[] = ['id' => "p{$i}_$k", 'userId' => 'u_' . $i, 'mode' => 'demo', 'status' => $k === 0 ? 'won' : 'lost', 'stake' => 10,
        'net' => $k === 0 ? (4 - $i) * 10 : 0, 'openedAt' => orolado_top_week_start_prev($now) + 3600];
    }
  }
  file_put_contents($dir . '/data/orolado.json', json_encode(['users' => $users, 'vault' => [], 'sessions' => [], 'deposits' => [],
    'withdrawals' => [], 'support_messages' => [], 'orders' => $orders]));
  file_put_contents($dir . '/state.json', json_encode(['tables' => ['profiles' => $profiles], 'auth' => $auth, 'bal' => $bal,
    'moves' => [], 'mails' => [], 'orders' => (object) [], 'fail' => []]));
};
function orolado_top_week_start_prev(int $now): int {
  $start = (int) strtotime('monday this week 00:00:00', $now);
  if ($start > $now) $start -= 7 * 86400;
  return $start - 7 * 86400;
}

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$new = $tmp . '/new';
@mkdir($tmp . '/sess', 0755, true);
$setup($new, $root);
putenv('FAKE_STATE=' . $new . '/state.json');
require $new . '/fakes.php';
$_SESSION = [];
$_SERVER['REQUEST_METHOD'] = 'GET';
ob_start();
require $new . '/admin.php';
ob_end_clean();
$_SESSION['admin_uid'] = 'admin_master';
$_SESSION['admin_email'] = 'admin@orolado.com';
$st = static fn(): array => fk_load();
$credits = static fn(): array => array_values(array_filter(fk_load()['moves'], static fn($m) => $m[0] === 'credit'));
$ledger = static fn(string $k): array => admin_top_paid_read($k);
$pay = static fn(string $id, float $amt, string $motif, array $hint): array => admin_credit_player($id, $amt, $motif, $hint, 'admin@orolado.com');
$wk = orolado_top_week(time())['key'];
$wkPrev = orolado_top_week(time() - 7 * 86400)['key'];

echo "1) Montants : ligne droite du premier au dernier, au cent inférieur, jamais hors bornes\n";
check('1 joueur → le montant du premier', admin_top_pay_amounts(1, 0.90, 0.20) === [0.90]);
check('2 joueurs → 0,90 puis 0,20', admin_top_pay_amounts(2, 0.90, 0.20) === [0.90, 0.20]);
check('0 joueur → rien', admin_top_pay_amounts(0, 0.90, 0.20) === []);
$allOk = true; $why = '';
foreach ([3, 7, 12, 37, 40, 71, 150, 1000] as $n) foreach ([[0.90, 0.20], [0.80, 0.02], [0.50, 0.50], [1.00, 0.01]] as [$mx, $mn]) {
  $a = admin_top_pay_amounts($n, $mx, $mn);
  $c = array_map(static fn($x) => (int) round($x * 100), $a);
  $mxC = (int) round($mx * 100); $mnC = (int) round($mn * 100);
  if (count($a) !== $n || $c[0] !== $mxC || $c[$n - 1] !== $mnC) { $allOk = false; $why = "n=$n bornes"; }
  foreach ($c as $i => $v) {
    $exact = $mxC - ($mxC - $mnC) * $i / ($n - 1); // valeur exacte de la droite
    if ($v < $mnC || $v > $mxC || $v > $exact + 1e-9 || $v <= $exact - 1 - 1e-9) { $allOk = false; $why = "n=$n i=$i $v vs $exact"; }
    if ($i > 0 && $v > $c[$i - 1]) { $allOk = false; $why = "n=$n remonte en $i"; }
    if (abs($a[$i] * 100 - $v) > 1e-9) { $allOk = false; $why = "n=$n pas au cent"; }
  }
}
check('toujours : 1er = max, dernier = min, jamais en dessous / au-dessus, jamais de remontée, au cent inférieur de la droite', $allOk, $why);
$a12 = admin_top_pay_amounts(12, 0.90, 0.20);
check('12 joueurs (0,90 → 0,20) : 0,90 0,83 0,77 0,70 … 0,20', array_slice($a12, 0, 4) === [0.90, 0.83, 0.77, 0.70] && end($a12) === 0.20, implode(' ', $a12));
$a40 = admin_top_pay_amounts(40, 0.90, 0.20);
echo '     exemple 40 classés (rang 1 → 40) : ' . implode(' ', array_map(static fn($x) => number_format($x, 2), $a40)) . ' · total ' . number_format(array_sum($a40), 2) . " $\n";

echo "2) Paramètres refusés\n";
check('valeurs par défaut : rang 1, 0,90 $ → 0,20 $', ($p = admin_top_pay_params([])) && $p['fromRank'] === 1 && $p['max'] === 0.90 && $p['min'] === 0.20, json_encode($p));
check('premier > 5 $ refusé', empty(admin_top_pay_params(['max' => 6])['ok']));
check('dernier > premier refusé', empty(admin_top_pay_params(['max' => 0.10, 'min' => 0.20])['ok']));
check('dernier à 0 refusé', empty(admin_top_pay_params(['min' => 0])['ok']));
check('rang 0 refusé', empty(admin_top_pay_params(['fromRank' => 0])['ok']));

echo "3) Aperçu\n";
$pv = admin_top_pay_preview(['week' => 'cur']);
$ranks = array_column($pv['rows'] ?? [], 'rank');
check('12 classés (le joueur à 10 trades n’y est pas), rangs 1 à 12', ($pv['ok'] ?? false) && $ranks === range(1, 12), json_encode($ranks));
check('rang 1 = joueur 1, avec ID, nom, e-mail, points', ($pv['rows'][0]['id'] ?? '') === 'ORO-100001' && $pv['rows'][0]['name'] === 'Joueur 1' && $pv['rows'][0]['email'] === 'joueur1@test.com' && $pv['rows'][0]['points'] === 600, json_encode($pv['rows'][0] ?? []));
check('montants = la droite 0,90 → 0,20', array_column($pv['rows'], 'amount') === $a12);
check('total = somme des 12 montants, 12 à payer', abs($pv['total'] - round(array_sum($a12), 2)) < 0.001 && $pv['count'] === 12, $pv['total'] . ' / ' . $pv['count']);
check('aucun argent bougé par l’aperçu', $credits() === []);
$pv4 = admin_top_pay_preview(['week' => 'cur', 'fromRank' => 4, 'max' => 0.80, 'min' => 0.02]);
check('« à partir du rang 4 » : rangs 4 à 12, 0,80 → 0,02', array_column($pv4['rows'], 'rank') === range(4, 12) && $pv4['rows'][0]['amount'] === 0.80 && end($pv4['rows'])['amount'] === 0.02);

echo "4) Rangs 1 à 3 « déjà payés à la main »\n";
$mk = admin_top_pay_mark(['week' => 'cur', 'ranks' => [1, 2, 3]]);
check('marqués 1, 2, 3', ($mk['marked'] ?? []) === [1, 2, 3], json_encode($mk));
check('remarquer : rien de nouveau', admin_top_pay_mark(['week' => 'cur', 'ranks' => [1, 2, 3]])['already'] === [1, 2, 3]);
check('rang inexistant signalé', admin_top_pay_mark(['week' => 'cur', 'ranks' => [99]])['missing'] === [99]);
$L = $ledger($wk);
check('registre : rangs 1–3 « ok, à la main, 0 $ »', !empty($L['u_1']['ok']) && !empty($L['u_1']['manual']) && $L['u_3']['amount'] === 0 && count($L) === 3, json_encode($L));
$pv = admin_top_pay_preview(['week' => 'cur']);
check('aperçu : 9 à payer, 3 déjà payés, montants des rangs 4–12 inchangés', $pv['count'] === 9 && $pv['already'] === 3 && array_column(array_slice($pv['rows'], 3), 'amount') === array_slice($a12, 3)
  && abs($pv['total'] - round(array_sum(array_slice($a12, 3)), 2)) < 0.001, $pv['count'] . ' · ' . $pv['total']);
check('aucun argent bougé', $credits() === []);

echo "5) Paiement : arrêt au premier refus, puis reprise\n";
check('sans « PAYER » : refusé', empty(admin_top_pay_run(['week' => 'cur'], $pay)['ok']) && $credits() === []);
$bad = admin_top_pay_run(['week' => 'cur', 'confirm' => 'PAYER', 'sig' => 'autre'], $pay);
check('aperçu périmé (empreinte différente) : refusé, rien payé', empty($bad['ok']) && !empty($bad['changed']) && $credits() === []);
$s = fk_load(); $s['fail'] = [$U(8)]; fk_save($s); // la caisse refuse le joueur du rang 8
$r = admin_top_pay_run(['week' => 'cur', 'confirm' => 'PAYER', 'sig' => $pv['sig']], $pay);
check('rangs 4 à 7 payés, arrêt au rang 8', $r['ok'] === false && $r['paid'] === 4 && ($r['errors'][0]['rank'] ?? 0) === 8 && count($r['errors']) === 1, json_encode(['paid' => $r['paid'], 'e' => $r['errors'], 'why' => $r['reason']]));
check('total payé = rangs 4 à 7', abs($r['total'] - round(array_sum(array_slice($a12, 3, 4)), 2)) < 0.001, (string) $r['total']);
$cr = $credits();
check('caisse : 4 crédits, le bon joueur et le bon montant', count($cr) === 4 && $cr[0][1] === $U(4) && abs($cr[0][2] - $a12[3]) < 0.001 && $cr[3][1] === $U(7), json_encode($cr));
check('rien après le refus (rangs 9–12 pas touchés)', !array_filter($cr, static fn($m) => in_array($m[1], [$U(9), $U(10), $U(11), $U(12)], true)));
$L = $ledger($wk);
check('registre : 4–7 ok avec montant, 8 en erreur, 9–12 absents', !empty($L['u_4']['ok']) && $L['u_4']['rank'] === 4 && abs($L['u_4']['amount'] - $a12[3]) < 0.001
  && isset($L['u_4']['at']) && $L['u_8']['ok'] === false && !empty($L['u_8']['error']) && empty($L['u_8']['pending']) && !isset($L['u_9']), json_encode($L['u_8'] ?? null));
$db = load_db();
$deps = array_values(array_filter($db['deposits'] ?? [], static fn($d) => ($d['userId'] ?? '') === $U(4)));
check('crédité comme un bonus admin : opérateur admin, note « Bonus », motif « Bonus tournoi démo — semaine … — rang 4 »',
  count($deps) === 1 && $deps[0]['operator'] === 'admin' && $deps[0]['note'] === 'Bonus' && $deps[0]['motif'] === 'Bonus tournoi démo — semaine ' . $wk . ' — rang 4' && admin_dep_is_bonus($deps[0]), json_encode($deps));
$logs = array_values(array_filter($db['admin_logs'] ?? [], static fn($l) => str_starts_with((string) ($l['motif'] ?? ''), 'Bonus tournoi démo')));
check('journal admin : 4 lignes « credit » par admin@orolado.com', count($logs) === 4 && $logs[0]['type'] === 'credit' && $logs[0]['adminEmail'] === 'admin@orolado.com', (string) count($logs));
check('joueurs prévenus (e-mail) : 4', count(array_filter(fk_load()['mails'], static fn($m) => preg_match('/^joueur[4-7]@/', $m))) === 4, json_encode(fk_load()['mails']));
$pv = admin_top_pay_preview(['week' => 'cur']);
check('aperçu : il reste 5 à payer (rang 8 en erreur compris)', $pv['count'] === 5, (string) $pv['count']);
$s = fk_load(); $s['fail'] = []; fk_save($s);
$r = admin_top_pay_run(['week' => 'cur', 'confirm' => 'PAYER', 'sig' => $pv['sig'], 'limit' => 2], $pay, 2);
check('par paquets (limit 2) : rangs 8 et 9 payés, il en reste 3', $r['ok'] && $r['paid'] === 2 && $r['remaining'] === 3 && array_column($r['done'], 'rank') === [8, 9], json_encode($r['done']));
$r = admin_top_pay_run(['week' => 'cur', 'confirm' => 'PAYER', 'sig' => $pv['sig']], $pay);
check('suite : rangs 10 à 12 payés, plus personne', $r['ok'] && $r['paid'] === 3 && $r['remaining'] === 0 && $r['skipped'] === 9, json_encode(['paid' => $r['paid'], 'skip' => $r['skipped']]));
$cr = $credits();
$per = [];
foreach ($cr as $m) $per[$m[1]] = ($per[$m[1]] ?? 0) + 1;
check('chacun des rangs 4 à 12 payé UNE fois, les rangs 1–3 jamais', count($cr) === 9 && max($per) === 1 && !isset($per[$U(1)], $per[$U(2)], $per[$U(3)]), json_encode($per));
$want = 0.0; foreach (array_slice($a12, 3) as $x) $want += $x;
check('total versé = somme des montants 4–12', abs(array_sum(array_column($cr, 2)) - $want) < 0.001, (string) array_sum(array_column($cr, 2)));
check('solde du rang 12 = 1 $ + 0,20 $', abs(fk_load()['bal'][$U(12)] - 1.20) < 0.001);
$mc = array_count_values(fk_load()['mails']);
$okMail = true; for ($i = 4; $i <= 12; $i++) if (($mc["joueur$i@test.com"] ?? 0) !== 1) $okMail = false;
check('e-mail : exactement 1 par joueur payé (rangs 4–12), aucun aux rangs 1–3 marqués', $okMail && !isset($mc['joueur1@test.com'], $mc['joueur2@test.com'], $mc['joueur3@test.com']), json_encode($mc));
check('e-mail : celui du crédit à la main (« bonus », orolado_notify_player)', count(array_unique(fk_load()['mailSubj'])) === 1 && fk_load()['mailSubj'][0] === orolado_notify_texts('bonus', 'fr', '$0.70', '')[0], json_encode(array_unique(fk_load()['mailSubj']), JSON_UNESCAPED_UNICODE));
$L = $ledger($wk);
check('registre : « mail: sent » pour chaque payé', count(array_filter($L, static fn($e) => ($e['mail'] ?? '') === 'sent')) === 9, json_encode(array_column($L, 'mail')));

echo "6) Relancer ne paie personne\n";
$r = admin_top_pay_run(['week' => 'cur', 'confirm' => 'PAYER'], $pay);
check('relance : 0 payé, 12 sautés, aucun crédit de plus', $r['ok'] && $r['paid'] === 0 && $r['skipped'] === 12 && count($credits()) === 9, json_encode(['paid' => $r['paid'], 'skip' => $r['skipped']]));
$lk = fopen(admin_top_paid_file($wkPrev) . '.run.lock', 'c'); flock($lk, LOCK_EX);
$r2 = admin_top_pay_run(['week' => 'prev', 'confirm' => 'PAYER'], static function () { throw new RuntimeException('ne doit pas être appelé'); });
check('paiement déjà en cours (verrou pris) : refusé', empty($r2['ok']) && str_contains((string) $r2['reason'], 'déjà en cours'), (string) ($r2['reason'] ?? ''));
flock($lk, LOCK_UN); fclose($lk);
$view = admin_gift_payload('gift_top', [], admin_profiles());
$byRank = []; foreach ($view['rows'] as $row) $byRank[(int) $row['cells'][0]] = end($row['cells']);
check('vue du tournoi : colonne « Payé »', end($view['cols']) === 'Payé' && $byRank[1] === 'Oui (à la main)' && str_starts_with($byRank[4], 'Oui · ') && str_contains($view['summary'], '12 déjà payé'), json_encode($byRank));

echo "7) Paiement interrompu : jamais repayé tout seul (semaine dernière)\n";
admin_top_paid_with($wkPrev, static function (array &$led) { $led['u_2'] = ['rank' => 2, 'amount' => 0.55, 'at' => date('c'), 'ok' => false, 'pending' => true]; });
$pv = admin_top_pay_preview(['week' => 'prev']);
check('semaine dernière : 3 classés, 2 à payer, 1 « à vérifier »', count($pv['rows']) === 3 && $pv['count'] === 2 && $pv['check'] === 1 && $pv['week'] === $wkPrev, json_encode(['n' => count($pv['rows']), 'c' => $pv['count'], 'k' => $pv['check']]));
$before = count($credits());
$s = fk_load(); $s['mailfail'] = ['joueur3@test.com']; fk_save($s); // l'e-mail du rang 3 ne part pas
$r = admin_top_pay_run(['week' => 'prev', 'confirm' => 'PAYER', 'sig' => $pv['sig']], $pay);
$cr = array_slice($credits(), $before);
check('rangs 1 et 3 payés (0,90 et 0,20), rang 2 sauté', $r['ok'] && $r['paid'] === 2 && count($cr) === 2 && $cr[0][1] === $U(1) && abs($cr[0][2] - 0.90) < 0.001 && $cr[1][1] === $U(3) && abs($cr[1][2] - 0.20) < 0.001, json_encode($cr));
check('e-mail raté (rang 3) : crédit quand même fait, noté « mail: failed », signalé, la suite n’est pas bloquée', ($ledger($wkPrev)['u_3']['ok'] ?? false) === true
  && ($ledger($wkPrev)['u_3']['mail'] ?? '') === 'failed' && $r['mailFailed'] === [3] && abs(fk_load()['bal'][$U(3)] - 1.20) < 0.001 && $r['errors'] === [], json_encode($ledger($wkPrev)['u_3'] ?? null));
$s = fk_load(); $s['mailfail'] = []; fk_save($s);
check('registre de la semaine dernière à part (fichier top_paid_' . $wkPrev . '.json)', is_file(admin_top_paid_file($wkPrev)) && !empty($ledger($wkPrev)['u_2']['pending']) && admin_top_paid_file($wkPrev) !== admin_top_paid_file($wk));
$mk = admin_top_pay_mark(['week' => 'prev', 'ranks' => [2]]);
check('« marquer payé » le rang interrompu (après vérification du solde)', $mk['marked'] === [2] && !empty($ledger($wkPrev)['u_2']['ok']) && admin_top_pay_preview(['week' => 'prev'])['count'] === 0);

echo "7b) Coupure PENDANT un crédit : la ligne reste « à vérifier », jamais repayée\n";
// 3 nouveaux classés la semaine dernière (joueurs 4 à 6) ; le paiement du 1er « plante » après le crédit.
$db = load_db();
for ($i = 4; $i <= 6; $i++) for ($k = 0; $k < 20; $k++) $db['orders'][] = ['id' => "q{$i}_$k", 'userId' => 'u_' . $i, 'mode' => 'demo', 'status' => $k === 0 ? 'won' : 'lost',
  'stake' => 10, 'net' => $k === 0 ? 5 - $i : 0, 'openedAt' => orolado_top_week_start_prev(time()) + 7200];
save_db(orolado_data_file(), $db);
orolado_top_scan(load_db(), orolado_top_week(time() - 7 * 86400), true);
$pv = admin_top_pay_preview(['week' => 'prev']);
$first = null; foreach ($pv['rows'] as $row) if ($row['state'] === 'todo') { $first = $row; break; }
check('semaine dernière : 3 nouveaux à payer', $pv['count'] === 3 && $first !== null, (string) $pv['count']);
$before = count($credits());
$r = admin_top_pay_run(['week' => 'prev', 'confirm' => 'PAYER'], static function (string $id, float $amt, string $motif, array $hint) use ($pay) {
  $pay($id, $amt, $motif, $hint);
  throw new RuntimeException('connexion coupée');
});
check('arrêt, rien d’autre payé', $r['ok'] === false && $r['paid'] === 0 && count($credits()) === $before + 1 && str_contains($r['reason'], 'vérifiez'), $r['reason']);
check('la ligne reste « à vérifier » (pending) dans le registre', !empty($ledger($wkPrev)[$first['uid']]['pending']));
$r = admin_top_pay_run(['week' => 'prev', 'confirm' => 'PAYER'], $pay);
$per = []; foreach (array_slice($credits(), $before) as $m) $per[$m[1]] = ($per[$m[1]] ?? 0) + 1;
check('re-clic : les 2 autres payés, celui « à vérifier » JAMAIS repayé', $r['ok'] && $r['paid'] === 2 && $per[$first['payId']] === 1 && count($per) === 3, json_encode($per));

echo "8) « adjust » (admin_credit_player) : même comportement qu'avant la refonte\n";
check('admin.php : l’action « adjust » appelle admin_credit_player avec userId / delta / motif / email / publicId',
  (bool) preg_match("/if \\(\\\$action === 'adjust'\\) \\{\\s*admin_json\\(admin_credit_player\\(\\s*\\(string\\) \\(\\\$req\\['userId'\\] \\?\\? ''\\),\\s*\\(float\\) \\(\\\$req\\['delta'\\] \\?\\? 0\\),\\s*\\(string\\) \\(\\\$req\\['motif'\\] \\?\\? ''\\),\\s*\\['email' => \\(string\\) \\(\\\$req\\['email'\\] \\?\\? ''\\), 'publicId' => \\(string\\) \\(\\\$req\\['publicId'\\] \\?\\? ''\\)\\],\\s*\\(string\\) \\(\\\$me\\['email'\\] \\?\\? ''\\)/", (string) file_get_contents($root . '/admin.php')));
// Même suite de requêtes « adjust » sur l'admin.php d'AVANT (git HEAD) et sur le nouveau, chacun avec sa caisse neuve.
$orig = $tmp . '/orig';
$headSrc = $tmp . '/headsrc';
@mkdir($headSrc, 0755, true);
$gitOk = true;
// Version « d'avant » : le parent du commit qui a créé admin_credit_player (sinon HEAD, si la refonte n'est pas encore commitée).
$intro = [];
exec('git -C ' . escapeshellarg($root) . ' log --reverse --format=%H -S' . escapeshellarg('function admin_credit_player') . ' -- admin.php 2>/dev/null', $intro);
$baseRef = $intro ? $intro[0] . '^' : 'HEAD';
foreach ($LIBS as $f) {
  $out = []; $code = 0;
  exec('git -C ' . escapeshellarg($root) . ' show ' . escapeshellarg($baseRef . ':' . $f) . ' 2>/dev/null', $out, $code);
  if ($code !== 0) { if ($f === 'admin.php') $gitOk = false; continue; }
  file_put_contents($headSrc . '/' . $f, implode("\n", $out) . "\n");
}
$hasRefactor = $gitOk && !str_contains((string) file_get_contents($headSrc . '/admin.php'), 'function admin_credit_player');
if (!$gitOk || !$hasRefactor) {
  echo "     (git HEAD indisponible ou déjà refondu : comparaison avant/après sautée)\n";
} else {
  $fresh = $tmp . '/fresh';
  $setup($orig, $headSrc);
  $setup($fresh, $root);
  $seq = [
    ['action' => 'adjust', 'userId' => $U(5), 'delta' => 0, 'motif' => 'x'],
    ['action' => 'adjust', 'userId' => '', 'delta' => 2],
    ['action' => 'adjust', 'userId' => $U(5), 'delta' => 2.5, 'motif' => ''],
    ['action' => 'adjust', 'userId' => $U(5), 'delta' => 2.5, 'motif' => ''],
    ['action' => 'adjust', 'userId' => $U(6), 'delta' => 3, 'motif' => 'Cadeau', 'email' => 'joueur6@test.com', 'publicId' => 'ORO-100006'],
    ['action' => 'adjust', 'userId' => 'ORO-100007', 'delta' => 1.25, 'motif' => 'Par numéro', 'publicId' => 'ORO-100007'],
    ['action' => 'adjust', 'userId' => $U(5), 'delta' => -1, 'motif' => 'Correction'],
    ['action' => 'adjust', 'userId' => $U(6), 'delta' => -50, 'motif' => 'Trop'],
    ['action' => 'adjust', 'userId' => 'inconnu-xyz', 'delta' => 1, 'motif' => 'Qui ?'],
  ];
  $runAll = static function (string $dir) use ($seq): array {
    $outs = [];
    foreach ($seq as $req) {
      $o = []; $code = 0;
      exec('FAKE_STATE=' . escapeshellarg($dir . '/state.json') . ' ' . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($dir . '/run.php') . ' '
        . escapeshellarg($dir) . ' ' . escapeshellarg(json_encode($req)) . ' 2>/dev/null', $o, $code);
      $outs[] = json_decode((string) end($o), true);
    }
    $s = json_decode((string) file_get_contents($dir . '/state.json'), true);
    $db = json_decode((string) file_get_contents($dir . '/data/orolado.json'), true);
    $clean = static fn(array $rows, array $drop): array => array_map(static fn($r) => array_diff_key($r, array_flip($drop)), $rows);
    return [
      'replies' => $outs,
      'moves' => $s['moves'], 'bal' => $s['bal'], 'mails' => $s['mails'], 'patch' => $s['patch'] ?? [],
      'sbdeps' => $clean($s['sbdeps'] ?? [], ['id', 'reference']),
      'deposits' => $clean($db['deposits'] ?? [], ['id', 'ref', 'createdAt', 'paidAt']),
      'logs' => $clean($db['admin_logs'] ?? [], ['at']),
      'vault' => $db['vault'] ?? [],
      'tx' => array_map(static fn($u) => $clean((array) ($u['transactions'] ?? []), ['id', 'at']), $db['users'] ?? []),
    ];
  };
  $A = $runAll($orig);
  $B = $runAll($fresh);
  check('9 requêtes « adjust » : réponses identiques avant / après', $A['replies'] === $B['replies'] && !in_array(null, $A['replies'], true), json_encode($B['replies'], JSON_UNESCAPED_UNICODE));
  foreach (['moves' => 'mouvements de caisse', 'bal' => 'soldes', 'mails' => 'e-mails aux joueurs', 'patch' => 'total déposé (profil)', 'sbdeps' => 'lignes « deposits »',
    'deposits' => 'dépôts/bonus du fichier', 'logs' => 'journal admin', 'vault' => 'coffres du fichier', 'tx' => 'historique des joueurs'] as $k => $lbl) {
    check("même effet : $lbl", $A[$k] == $B[$k], $A[$k] == $B[$k] ? '' : json_encode([$A[$k], $B[$k]], JSON_UNESCAPED_UNICODE));
  }
  check('ce qui est attendu : montant 0 refusé, doublon 2 min refusé, débit trop grand refusé, crédit par numéro ORO passé',
    ($B['replies'][0]['reason'] ?? '') === 'Montant obligatoire' && empty($B['replies'][3]['ok']) && str_contains((string) ($B['replies'][3]['reason'] ?? ''), 'moins de 2 minutes')
    && !empty($B['replies'][2]['ok']) && !empty($B['replies'][5]['ok']) && empty($B['replies'][7]['ok']) && abs(($B['bal'][$U(5)] ?? 0) - 2.5) < 0.001, json_encode($B['bal']));
  // Les nouvelles actions passent par la vraie répartition (session admin) dans le nouveau admin.php.
  $o = []; exec('FAKE_STATE=' . escapeshellarg($fresh . '/state.json') . ' ' . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($fresh . '/run.php') . ' ' . escapeshellarg($fresh) . ' '
    . escapeshellarg(json_encode(['action' => 'gift_top_pay_preview', 'week' => 'cur'])) . ' 2>/dev/null', $o);
  $j = json_decode((string) end($o), true);
  check('action gift_top_pay_preview (admin.php) : 12 lignes', ($j['ok'] ?? false) && count($j['rows']) === 12, substr((string) end($o), 0, 200));
  $o = []; exec('FAKE_STATE=' . escapeshellarg($fresh . '/state.json') . ' ' . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($fresh . '/run.php') . ' ' . escapeshellarg($fresh) . ' '
    . escapeshellarg(json_encode(['action' => 'gift_top_mark', 'week' => 'cur', 'ranks' => [1]])) . ' 2>/dev/null', $o);
  check('action gift_top_mark (admin.php)', (json_decode((string) end($o), true)['marked'] ?? null) === [1], (string) end($o));
  $o = []; exec('FAKE_STATE=' . escapeshellarg($fresh . '/state.json') . ' ' . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($fresh . '/run.php') . ' ' . escapeshellarg($fresh) . ' '
    . escapeshellarg(json_encode(['action' => 'gift_top_pay_run', 'week' => 'cur', 'confirm' => 'PAYER', 'limit' => 3])) . ' 2>/dev/null', $o);
  $j = json_decode((string) end($o), true);
  $sB = json_decode((string) file_get_contents($fresh . '/state.json'), true);
  check('action gift_top_pay_run (admin.php, limit 3) : rangs 2 à 4 payés par la vraie caisse, « more »', ($j['ok'] ?? false) && $j['paid'] === 3 && array_column($j['done'], 'rank') === [2, 3, 4]
    && !empty($j['more']) && count(array_filter($sB['moves'], static fn($m) => $m[0] === 'credit' && $m[1] === $U(2))) === 1, (string) end($o));
  // « Page fermée » après ce paquet, puis re-clic : la page rappelle sans « limit » (5 par appel) jusqu'à « more: false ».
  $batches = [];
  for ($g = 0; $g < 10; $g++) {
    $o = []; exec('FAKE_STATE=' . escapeshellarg($fresh . '/state.json') . ' ' . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($fresh . '/run.php') . ' ' . escapeshellarg($fresh) . ' '
      . escapeshellarg(json_encode(['action' => 'gift_top_pay_run', 'week' => 'cur', 'confirm' => 'PAYER'])) . ' 2>/dev/null', $o);
    $j = json_decode((string) end($o), true);
    $batches[] = $j['paid'] ?? -1;
    if (empty($j['ok']) || empty($j['more'])) break;
  }
  $sB = json_decode((string) file_get_contents($fresh . '/state.json'), true);
  $per = []; foreach ($sB['moves'] as $m) if ($m[0] === 'credit') $per[$m[1]] = ($per[$m[1]] ?? 0) + 1;
  $mc = array_count_values($sB['mails']);
  $once = true; for ($i = 2; $i <= 12; $i++) { $n = in_array($i, [5, 6, 7], true) ? 2 : 1; if (($per[$U($i)] ?? 0) !== $n || ($mc["joueur$i@test.com"] ?? 0) !== $n) $once = false; }
  check('reprise par paquets de 5 : 5 puis 3, puis plus rien (« more » faux)', $batches === [5, 3] && ($j['remaining'] ?? -1) === 0, json_encode($batches));
  check('chaque classé (2–12) payé et prévenu UNE fois par le tournoi (5, 6, 7 ont aussi eu un « adjust » avant), le rang 1 jamais', $once && !isset($per[$U(1)]), json_encode([$per, $mc]));
}

if (str_starts_with($tmp, sys_get_temp_dir() . '/orolado_toppay_')) exec('rm -rf ' . escapeshellarg($tmp));
echo "\n" . ($fail === 0 ? 'TOUT EST BON' : 'PROBLÈME') . " : $pass OK, $fail échec(s)\n";
exit($fail === 0 ? 0 : 1);
