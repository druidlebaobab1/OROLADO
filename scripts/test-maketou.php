<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2621 — DÉPÔTS MOBILE MONEY (Maketou) : faux Maketou + fausse caisse Supabase, dossier temporaire.
 * Vérifie qu'un paiement est crédité UNE fois (retour du joueur, webhook, rattrapage automatique),
 * jamais sans preuve de Maketou, jamais pour un montant plus petit, et que le bon dépôt est retrouvé.
 */
$tmp = sys_get_temp_dir() . '/orolado_mkt_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'history_lib.php', 'account_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);

// Faux services partagés entre processus (fichiers) : caisse Supabase + paniers Maketou.
$fakes = <<<'R'
<?php
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OROLADO_PAY_MAKETOU=1');
putenv('MAKETOU_API_KEY=cle-de-test-locale');
$GLOBALS['OROLADO_TMP'] = __DIR__;
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) {
  $fp = fopen($GLOBALS['OROLADO_TMP'] . '/bank.json', 'c+'); flock($fp, LOCK_EX);
  $bank = json_decode(stream_get_contents($fp) ?: '{}', true) ?: [];
  $b = $body ? json_decode($body, true) : [];
  $out = [];
  if (preg_match('#/rest/v1/vaults\?user_id=eq\.([^&]+)#', $url, $m)) {
    $u = rawurldecode($m[1]);
    if ($method === 'GET') $out = isset($bank['c'][$u]) ? [['demo' => 0, 'real' => $bank['c'][$u] / 100]] : [];
  } elseif (str_contains($url, '/rpc/resolve_trade')) {
    $u = $b['p_user']; $k = $b['p_order'];
    if (isset($bank['keys'][$k])) $out = ['ok' => true, 'duplicate' => true, 'real' => $bank['c'][$u] / 100];
    else { $bank['keys'][$k] = 1; $bank['c'][$u] = ($bank['c'][$u] ?? 0) + (int) round($b['p_amount'] * 100); $out = ['ok' => true, 'real' => $bank['c'][$u] / 100]; }
  } elseif (str_contains($url, '/rpc/credit_real')) {
    $u = $b['p_user']; $bank['c'][$u] = ($bank['c'][$u] ?? 0) + (int) round($b['p_amount'] * 100); $bank['oldCredit'] = ($bank['oldCredit'] ?? 0) + 1; $out = ['ok' => true];
  }
  rewind($fp); ftruncate($fp, 0); fwrite($fp, json_encode($bank)); fflush($fp); flock($fp, LOCK_UN); fclose($fp);
  return $out;
};
// Faux api.maketou.net : carts.json = { cartId: {status, total} }.
$GLOBALS['OROLADO_FAKE_MAKETOU'] = function (string $url) {
  $carts = json_decode((string) @file_get_contents($GLOBALS['OROLADO_TMP'] . '/carts.json'), true) ?: [];
  if (!preg_match('#/api/v1/stores/cart/([^/?]+)#', $url, $m)) return [404, null];
  $c = $carts[rawurldecode($m[1])] ?? null;
  if (!$c) return [404, null];
  return [200, ['id' => $m[1], 'status' => $c['status'], 'total_price' => $c['total']]];
};
R;
file_put_contents($tmp . '/fakes.php', $fakes);
$runner = <<<'R'
<?php
require __DIR__ . '/fakes.php';
$GLOBALS['OROLADO_FAKE_INPUT'] = (string) file_get_contents($argv[1]);
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$h = json_decode((string) file_get_contents($argv[2]), true) ?: [];
foreach ($h as $k => $v) $_SERVER[$k] = $v;
require __DIR__ . '/orolado_lib.php';
maketou_handle_webhook();
R;
file_put_contents($tmp . '/hook.php', $runner);

require $tmp . '/fakes.php';
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$bankFile = $tmp . '/bank.json';
$cartsFile = $tmp . '/carts.json';
$bal = function (string $u) use ($bankFile): float { $b = json_decode((string) @file_get_contents($bankFile), true) ?: []; return ($b['c'][$u] ?? 0) / 100; };
$cart = function (string $id, string $status, int $total) use ($cartsFile): void { $c = json_decode((string) @file_get_contents($cartsFile), true) ?: []; $c[$id] = ['status' => $status, 'total' => $total]; file_put_contents($cartsFile, json_encode($c)); };
$dep = function (string $id, string $uid, float $usd, string $cartId) {
  with_db_lock(function ($box) use ($id, $uid, $usd, $cartId) {
    $box->db['deposits'][] = ['id' => $id, 'ref' => $id, 'userId' => $uid, 'aliasEmail' => 'trader_x_' . $id . '@orolado-pay.com', 'operator' => 'wave',
      'status' => 'PENDING', 'amount' => $usd, 'amountFcfa' => orolado_usd_to_fcfa($usd), 'currency' => 'USD', 'at' => date('c'), 'sellId' => $cartId, 'cartId' => $cartId];
    return ['ok' => true];
  });
};
$status = function (string $id): string { foreach (load_db()['deposits'] ?? [] as $d) if (($d['id'] ?? '') === $id) return (string) $d['status']; return '?'; };
$hook = function (array $payload, array $headers = []) use ($tmp): array {
  $raw = json_encode($payload);
  if (isset($headers['_sign'])) { $headers['HTTP_X_MAKETOU_HMAC_SHA256'] = base64_encode(hash_hmac('sha256', $raw, (string) $headers['_sign'], true)); unset($headers['_sign']); }
  $fi = $tmp . '/in_' . bin2hex(random_bytes(3)); file_put_contents($fi, $raw);
  $fh = $tmp . '/h_' . bin2hex(random_bytes(3)); file_put_contents($fh, json_encode($headers));
  $out = shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($tmp . '/hook.php') . ' ' . escapeshellarg($fi) . ' ' . escapeshellarg($fh));
  return json_decode((string) $out, true) ?: ['raw' => $out];
};

$U1 = 'aaaaaaaa-1111-2222-3333-444444444444';
$U2 = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
foreach ([$U1, $U2] as $u) { $db['users'][$u] = ['id' => $u, 'email' => $u . '@test.local', 'role' => 'user', 'displayName' => 'Joueur Test']; }
$db['sessions']['tok1'] = ['userId' => $U1, 'createdAt' => date('c')];
$db['sessions']['tok2'] = ['userId' => $U2, 'createdAt' => date('c')];
save_db(orolado_data_file(), $db);
file_put_contents($bankFile, json_encode(['c' => [$U1 => 0, $U2 => 0]]));

echo "1) Le joueur revient du paiement (bouton / retour de page)\n";
$dep('oro_a', $U1, 3, 'CARTAAAA1');
$cart('CARTAAAA1', 'pending', 1800);
$r = orolado_confirm_deposit(['token' => 'tok1', 'ref' => 'oro_a', 'manual' => 1]);
check('Maketou dit « en attente » : rien n’est crédité', empty($r['paid']) && $bal($U1) == 0.0, (string) $bal($U1));
$cart('CARTAAAA1', 'completed', 1800);
$r = orolado_confirm_deposit(['token' => 'tok1', 'ref' => 'oro_a']);
check('Maketou dit « payé » : +3 $ crédités', !empty($r['paid']) && abs($bal($U1) - 3) < 0.001, (string) $bal($U1));
check('dépôt enregistré COMPLETED', $status('oro_a') === 'COMPLETED', $status('oro_a'));
orolado_confirm_deposit(['token' => 'tok1', 'ref' => 'oro_a']);
orolado_confirm_deposit(['token' => 'tok1', 'ref' => 'oro_a']);
check('re-cliqué 2 fois : toujours 3 $ (pas de double crédit)', abs($bal($U1) - 3) < 0.001, (string) $bal($U1));

echo "2) Montant payé plus petit que le panier\n";
$dep('oro_b', $U1, 10, 'CARTBBBB1');
$cart('CARTBBBB1', 'completed', 1000);
$r = orolado_confirm_deposit(['token' => 'tok1', 'ref' => 'oro_b']);
check('1 000 FCFA payés pour 6 000 attendus : refusé', empty($r['paid']) && abs($bal($U1) - 3) < 0.001, (string) $bal($U1));
check('le dépôt reste en attente (pas perdu)', $status('oro_b') === 'PENDING', $status('oro_b'));

echo "3) Webhook signé par Maketou\n";
$dep('oro_c', $U1, 5, 'CARTCCCC1');
$r = $hook(['status' => 'paid', 'ref' => 'oro_c', 'total_price' => 3000], ['_sign' => 'cle-de-test-locale']);
check('payé : +5 $ crédités', !empty($r['ok']) && abs($bal($U1) - 8) < 0.001, json_encode($r) . ' / ' . $bal($U1));
$r = $hook(['status' => 'paid', 'ref' => 'oro_c', 'total_price' => 3000], ['_sign' => 'cle-de-test-locale']);
check('le même message renvoyé : pas de double crédit', abs($bal($U1) - 8) < 0.001, (string) $bal($U1));
$dep('oro_d', $U1, 5, 'CARTDDDD1');
$hook(['status' => 'paid', 'ref' => 'oro_d', 'total_price' => 100], ['_sign' => 'cle-de-test-locale']);
check('signé mais 100 FCFA au lieu de 3 000 : rien crédité', abs($bal($U1) - 8) < 0.001 && $status('oro_d') === 'PENDING', (string) $bal($U1));

echo "4) Faux messages (pirate) et signature non reconnue\n";
$dep('oro_e', $U1, 50, 'CARTEEEE1');
$cart('CARTEEEE1', 'pending', 30000);
$hook(['status' => 'paid', 'ref' => 'oro_e', 'total_price' => 30000]);
check('message NON signé « payé » mais Maketou dit en attente : rien', abs($bal($U1) - 8) < 0.001 && $status('oro_e') === 'PENDING', (string) $bal($U1));
$hook(['status' => 'paid', 'ref' => 'oro_e', 'total_price' => 30000], ['_sign' => 'mauvaise-cle']);
check('signature fausse + Maketou dit en attente : rien', abs($bal($U1) - 8) < 0.001, (string) $bal($U1));
$cart('CARTEEEE1', 'completed', 30000);
$r = $hook(['status' => 'paid', 'ref' => 'oro_e', 'total_price' => 30000], ['_sign' => 'autre-signature']);
check('signature non reconnue mais Maketou confirme : crédité (avant : message jeté)', abs($bal($U1) - 58) < 0.001, json_encode($r) . ' / ' . $bal($U1));

echo "5) Message sans notre référence : retrouvé par le panier Maketou\n";
$dep('oro_f', $U2, 4, 'CARTFFFF1');
$dep('oro_g', $U2, 7, 'CARTGGGG1');
$cart('CARTGGGG1', 'completed', 4200);
$hook(['data' => ['cartId' => 'CARTGGGG1', 'status' => 'completed', 'amount' => 4200]]);
check('le bon dépôt (7 $) est crédité, pas l’autre', abs($bal($U2) - 7) < 0.001 && $status('oro_g') === 'COMPLETED' && $status('oro_f') === 'PENDING', $bal($U2) . ' ' . $status('oro_f') . '/' . $status('oro_g'));

echo "6) Rattrapage automatique (joueur parti sans revenir, webhook perdu)\n";
$cart('CARTFFFF1', 'completed', 2400);
$r = orolado_maketou_recheck(['token' => 'tok2']);
check('le dépôt payé de 4 $ est retrouvé et crédité', abs($bal($U2) - 11) < 0.001 && $status('oro_f') === 'COMPLETED', json_encode($r) . ' / ' . $bal($U2));
$r = orolado_maketou_recheck(['token' => 'tok2']);
check('2e passage tout de suite : limité (pas de double appel)', !empty($r['skipped']), json_encode($r));
$r = orolado_maketou_recheck(['token' => 'tok1']);
check('joueur 1 : le dépôt « 100 FCFA » reste refusé, rien de plus', abs($bal($U1) - 58) < 0.001 && $status('oro_d') === 'PENDING', json_encode($r) . ' / ' . $bal($U1));

$b = json_decode((string) file_get_contents($bankFile), true);
check('aucun crédit par l’ancien chemin sans clé (credit_real)', empty($b['oldCredit']), (string) ($b['oldCredit'] ?? 0));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
