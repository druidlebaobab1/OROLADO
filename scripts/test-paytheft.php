<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * VOL DE PAIEMENT : un tricheur essaie de faire créditer SON dépôt avec le paiement (carte ou
 * crypto) d'un AUTRE joueur. Faux Flutterwave, faux OxaPay, fausse caisse : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_pay_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('FLW_SECRET_KEY=fake-flw');
putenv('FLW_PUBLIC_KEY=fake-flw-pub');
putenv('OXAPAY_MERCHANT_KEY=fake-oxa');
require $tmp . '/orolado_lib.php';

$bank = ['c' => [], 'keys' => []];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bank) {
  $u = $a['p_user'];
  $bank['c'][$u] = $bank['c'][$u] ?? 0;
  if ($fn === 'resolve_trade') {
    if (isset($bank['keys'][$a['p_order']])) return ['ok' => true, 'duplicate' => true, 'real' => $bank['c'][$u] / 100];
    $bank['keys'][$a['p_order']] = 1;
    $bank['c'][$u] += (int) round($a['p_amount'] * 100);
    return ['ok' => true, 'real' => $bank['c'][$u] / 100];
  }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$bank) {
  $b = $body ? json_decode($body, true) : [];
  if (str_contains($url, '/rpc/resolve_trade')) return ($GLOBALS['OROLADO_FAKE_RPC'])('resolve_trade', $b);
  if (preg_match('/vaults\?user_id=eq\.([^&]+)/', $url, $m)) {
    $u = rawurldecode($m[1]);
    return [['demo' => 0, 'real' => ($bank['c'][$u] ?? 0) / 100]];
  }
  return [];
};
// Faux Flutterwave : le paiement n° 111 est celui de la VICTIME (dépôt flw_V, 300 000 XOF = 500 $).
$GLOBALS['OROLADO_FAKE_FLW'] = function (string $method, string $path) {
  if (str_starts_with($path, '/transactions/111/verify')) {
    return ['status' => 'success', 'data' => ['id' => 111, 'tx_ref' => 'flw_V', 'status' => 'successful', 'currency' => 'XOF', 'amount' => 300000]];
  }
  return ['status' => 'error'];
};
// Faux OxaPay : le suivi TV est payé (dépôt oxa_V, 500 USDT) ; TA (le tricheur) n'est pas payé.
$GLOBALS['OROLADO_FAKE_OXA'] = function (string $method, string $path) {
  if (str_contains($path, '/payment/TV')) return ['data' => ['track_id' => 'TV', 'order_id' => 'oxa_V', 'status' => 'Paid', 'pay_currency' => 'USDT', 'network' => 'TRC20',
    'txs' => [['status' => 'confirmed', 'currency' => 'USDT', 'network' => 'TRC20', 'received_amount' => 500, 'tx_hash' => 'hashV']]]];
  if (str_contains($path, '/payment/TA')) return ['data' => ['track_id' => 'TA', 'order_id' => 'oxa_A', 'status' => 'Waiting', 'txs' => []]];
  return null;
};

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$A = 'aaaaaaaa-0000-0000-0000-00000000000a';
$V = 'aaaaaaaa-0000-0000-0000-00000000000b';
$db = blank_db();
foreach ([$A => 'tricheur@test.com', $V => 'victime@test.com'] as $id => $mail) {
  $db['users'][$id] = ['id' => $id, 'email' => $mail, 'role' => 'user', 'sbId' => $id];
  $db['vault'][$id] = ['demo' => 0, 'real' => 0];
}
$db['sessions']['tokA'] = ['userId' => $A, 'at' => date('c')];
$db['sessions']['tokV'] = ['userId' => $V, 'at' => date('c')];
$db['deposits'][] = ['id' => 'flw_A', 'ref' => 'flw_A', 'userId' => $A, 'amount' => 500, 'status' => 'PENDING', 'operator' => 'flutterwave'];
$db['deposits'][] = ['id' => 'flw_V', 'ref' => 'flw_V', 'userId' => $V, 'amount' => 500, 'status' => 'PENDING', 'operator' => 'flutterwave'];
$db['deposits'][] = ['id' => 'oxa_A', 'ref' => 'oxa_A', 'userId' => $A, 'amount' => 500, 'status' => 'PENDING', 'operator' => 'oxapay', 'trackId' => 'TA', 'network' => 'TRC20', 'payCurrency' => 'USDT'];
$db['deposits'][] = ['id' => 'oxa_V', 'ref' => 'oxa_V', 'userId' => $V, 'amount' => 500, 'status' => 'PENDING', 'operator' => 'oxapay', 'trackId' => 'TV', 'network' => 'TRC20', 'payCurrency' => 'USDT'];
save_db(orolado_data_file(), $db);
$bal = function (string $u) use (&$bank): float { return (float) (($bank["c"][$u] ?? 0) / 100); };

echo "1) Carte (Flutterwave)\n";
$p = orolado_flutterwave_verify('flw_A', '111');
check('le paiement n° 111 (de la victime) ne « prouve » pas le dépôt du tricheur', empty($p['paid']), (string) ($p['status'] ?? ''));
orolado_flutterwave_webhook(json_encode(['event' => 'charge.completed', 'data' => ['tx_ref' => 'flw_A', 'id' => 111]]), '');
check('faux message « payé » (dépôt du tricheur + paiement de la victime) : tricheur NON crédité', $bal($A) === 0.0, (string) $bal($A));
orolado_flutterwave_webhook(json_encode(['event' => 'charge.completed', 'data' => ['id' => 111]]), '');
check('le vrai paiement n° 111 crédite bien la victime (500 $)', $bal($V) === 500.0, (string) $bal($V));

echo "2) Crypto (OxaPay)\n";
$r = orolado_oxapay_status(['token' => 'tokA', 'orderId' => 'oxa_A', 'trackId' => 'TV']);
check('« vérifier mon dépôt » avec le numéro de suivi de la victime : tricheur NON crédité', $bal($A) === 0.0 && empty($r['paid']), (string) $bal($A));
orolado_oxapay_webhook(json_encode(['order_id' => 'oxa_A', 'track_id' => 'TV', 'status' => 'Paid']), '');
check('faux message OxaPay non signé (dépôt du tricheur + suivi de la victime) : tricheur NON crédité', $bal($A) === 0.0, (string) $bal($A));
$before = $bal($V);
$r = orolado_oxapay_status(['token' => 'tokV', 'orderId' => 'oxa_V']);
check('la victime, elle, est bien créditée de son paiement crypto (+500 $)', $bal($V) === $before + 500.0 || ($bal($V) === $before && !empty($r['paid'])), $before . ' → ' . $bal($V));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
