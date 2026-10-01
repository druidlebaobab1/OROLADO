<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Dépôts crypto qui « disparaissaient » : nouvel envoi sur une adresse déjà payée (pris pour un
 * doublon), message d'OxaPay perdu (rattrapage), numéro de suivi différent. Jamais deux crédits.
 * Faux OxaPay, fausse caisse : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_oxx_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OXAPAY_MERCHANT_KEY=fake-oxa');
require $tmp . '/orolado_lib.php';

$bank = ['c' => [], 'keys' => []];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$bank) {
  $b = $body ? json_decode($body, true) : [];
  if (str_contains($url, '/rpc/resolve_trade')) {
    $u = $b['p_user']; $bank['c'][$u] = $bank['c'][$u] ?? 0;
    if (isset($bank['keys'][$b['p_order']])) return ['ok' => true, 'duplicate' => true, 'real' => $bank['c'][$u] / 100];
    $bank['keys'][$b['p_order']] = 1; $bank['c'][$u] += (int) round($b['p_amount'] * 100);
    return ['ok' => true, 'real' => $bank['c'][$u] / 100];
  }
  if (preg_match('/vaults\?user_id=eq\.([^&]+)/', $url, $m)) return [['demo' => 0, 'real' => ($bank['c'][rawurldecode($m[1])] ?? 0) / 100]];
  return [];
};
$OXA = [];
$GLOBALS['OROLADO_FAKE_OXA'] = function ($m, $p) use (&$OXA) {
  foreach ($OXA as $tid => $resp) if (str_contains($p, '/payment/' . $tid)) return ['data' => $resp];
  return null;
};
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-0000-0000-0000-00000000000a';
$V = 'aaaaaaaa-0000-0000-0000-00000000000b';
$money = function (string $u) use (&$bank): float { return ($bank['c'][$u] ?? 0) / 100; };
$fresh = function (array $deps) use (&$bank, &$OXA, $A, $V) {
  $bank = ['c' => [], 'keys' => []]; $OXA = [];
  @unlink(orolado_data_file());
  foreach (glob(orolado_data_dir() . '/*') ?: [] as $f) if (is_file($f)) @unlink($f);
  $db = blank_db();
  foreach ([$A => 'a@test.com', $V => 'v@test.com'] as $id => $mail) {
    $db['users'][$id] = ['id' => $id, 'email' => $mail, 'role' => 'user', 'sbId' => $id];
    $db['vault'][$id] = ['demo' => 0, 'real' => 0];
  }
  $db['sessions']['tokA'] = ['userId' => $A, 'at' => date('c')];
  $db['sessions']['tokV'] = ['userId' => $V, 'at' => date('c')];
  $db['deposits'] = $deps;
  save_db(orolado_data_file(), $db);
};
$pay = fn(string $tid, string $oid, string $addr, array $txs, string $st = 'Paid') => ['track_id' => $tid, 'order_id' => $oid, 'status' => $st, 'amount' => 5, 'currency' => 'USD', 'pay_currency' => 'USDT', 'network' => 'TRC20', 'address' => $addr, 'txs' => $txs];
$tx = fn(string $h, float $a) => ['status' => 'confirmed', 'currency' => 'USDT', 'network' => 'TRC20', 'amount' => $a, 'value' => $a, 'tx_hash' => $h];
$dep = fn(string $id, string $uid, string $tid, string $addr, string $st, float $amt = 5, string $txid = '') => ['id' => $id, 'ref' => $id, 'userId' => $uid, 'operator' => 'oxapay', 'network' => 'TRC20', 'coin' => 'usdt_trc20', 'status' => $st, 'amount' => $amt, 'currency' => 'USD', 'trackId' => $tid, 'address' => $addr, 'txid' => $txid, 'at' => date('c')];
$hook = fn(string $tid, string $oid) => orolado_oxapay_webhook(json_encode(['track_id' => $tid, 'order_id' => $oid, 'status' => 'Paid']), '');

echo "1) Premier envoi : crédité comme avant\n";
$fresh([$dep('o1', $A, 'T1', 'ADDR1', 'UNFINISHED')]);
$OXA['T1'] = $pay('T1', 'o1', 'ADDR1', [$tx('h1', 3.43)]);
$hook('T1', 'o1');
check('3,43 USDT sur une facture de 5 $ → 3,43 $', abs($money($A) - 3.43) < 0.001, (string) $money($A));
$hook('T1', 'o1');
check('même message reçu 2 fois → toujours 3,43 $', abs($money($A) - 3.43) < 0.001, (string) $money($A));

echo "2) Nouvel envoi sur une adresse déjà payée (avant : jamais crédité)\n";
$fresh([$dep('o2', $A, 'T2', 'ADDR2', 'COMPLETED', 7.27, 'hOld')]);
$OXA['T2'] = $pay('T2', 'o2', 'ADDR2', [$tx('hOld', 7.27), $tx('hNew', 3.43)]);
$hook('T2', 'o2');
check('2e envoi 3,43 $ → crédité 3,43 $', abs($money($A) - 3.43) < 0.001, (string) $money($A));
$hook('T2', 'o2');
check('message répété → pas de 2e crédit', abs($money($A) - 3.43) < 0.001, (string) $money($A));
$rows = array_values(array_filter(load_db()['deposits'], fn($d) => ($d['parentId'] ?? '') === 'o2'));
check('le dépôt apparaît (historique / admin) en COMPLETED', count($rows) === 1 && strtoupper($rows[0]['status']) === 'COMPLETED');
$OXA['T2'] = $pay('T2', 'o2', 'ADDR2', [$tx('hOld', 7.27), $tx('hNew', 3.43), $tx('hNew2', 10)]);
$hook('T2', 'o2');
check('3e envoi 10 $ → crédité aussi (total 13,43 $)', abs($money($A) - 13.43) < 0.001, (string) $money($A));

echo "3) Rien de nouveau → rien crédité\n";
$fresh([$dep('o3', $A, 'T3', 'ADDR3', 'COMPLETED', 7.27, 'hOld')]);
$OXA['T3'] = $pay('T3', 'o3', 'ADDR3', [$tx('hOld', 7.27)]);
$hook('T3', 'o3');
check('ancien paiement renvoyé → 0 $', $money($A) === 0.0, (string) $money($A));
// Ancien dépôt crédité en une fois pour 2 envois (seul le 1er numéro était noté) : pas recrédité.
$fresh([$dep('o4', $A, 'T4', 'ADDR4', 'COMPLETED', 10, 'hA')]);
$OXA['T4'] = $pay('T4', 'o4', 'ADDR4', [$tx('hA', 5), $tx('hB', 5)]);
$hook('T4', 'o4');
check('ancien dépôt 5+5 déjà crédité 10 $ → 0 $ de plus', $money($A) === 0.0, (string) $money($A));

echo "4) Numéro de suivi différent chez OxaPay, même adresse\n";
$fresh([$dep('o5', $A, 'T5', 'ADDR5', 'UNFINISHED')]);
$OXA['T5b'] = $pay('T5b', 'o5', 'ADDR5', [$tx('h5', 3.43)]);
$hook('T5b', '');
check('payé sous un autre numéro de suivi → 3,43 $ au bon joueur', abs($money($A) - 3.43) < 0.001, (string) $money($A));

echo "5) Vol : un tricheur désigne SON dépôt avec le paiement de la victime\n";
$fresh([$dep('oA', $A, 'TA', 'ADDRA', 'UNFINISHED'), $dep('oV', $V, 'TV', 'ADDRV', 'UNFINISHED')]);
$OXA['TV'] = $pay('TV', 'oV', 'ADDRV', [$tx('hV', 500)]);
$OXA['TA'] = $pay('TA', 'oA', 'ADDRA', [], 'Waiting');
orolado_oxapay_webhook(json_encode(['track_id' => 'TV', 'order_id' => 'oA', 'address' => 'ADDRA', 'status' => 'Paid']), '');
check('tricheur : 0 $', $money($A) === 0.0, (string) $money($A));
check('victime : ses 500 $ (si crédités) restent à elle', in_array($money($V), [0.0, 500.0], true), (string) $money($V));
orolado_oxapay_webhook(json_encode(['track_id' => 'TA', 'order_id' => 'oA', 'status' => 'Paid', 'txs' => [['currency' => 'USDT', 'amount' => 999, 'tx_hash' => 'fake']]]), '');
check('faux message non signé sur un dépôt non payé → 0 $', $money($A) === 0.0, (string) $money($A));
$fresh([$dep('oA', $A, 'TA', 'ADDRA', 'COMPLETED', 5, 'hA'), $dep('oV', $V, 'TV', 'ADDRV', 'UNFINISHED')]);
$OXA['TV'] = $pay('TV', 'oV', 'ADDRV', [$tx('hV', 500)]);
$OXA['TA'] = $pay('TA', 'oA', 'ADDRA', [$tx('hA', 5)]);
orolado_oxapay_webhook(json_encode(['track_id' => 'TA', 'order_id' => 'oA', 'status' => 'Paid', 'txs' => [$tx('hA', 5), $tx('hFake', 900)]]), '');
check('faux « nouvel envoi » non signé sur une adresse payée → 0 $', $money($A) === 0.0, (string) $money($A));

echo "6) Rattrapage (message d'OxaPay perdu, écran fermé)\n";
$fresh([$dep('o6', $A, 'T6', 'ADDR6', 'UNFINISHED'), $dep('o7', $A, 'T7', 'ADDR7', 'COMPLETED', 7.27, 'h7')]);
$OXA['T6'] = $pay('T6', 'o6', 'ADDR6', [$tx('h6', 3.43)]);
$OXA['T7'] = $pay('T7', 'o7', 'ADDR7', [$tx('h7', 7.27), $tx('h7b', 2)]);
$r = orolado_oxapay_recheck(['token' => 'tokA']);
check('ouverture du site → 3,43 $ + 2 $ rattrapés', abs($money($A) - 5.43) < 0.001, json_encode($r));
$r = orolado_oxapay_recheck(['token' => 'tokA']);
check('2e ouverture tout de suite → rien refait (90 s)', !empty($r['skipped']) && abs($money($A) - 5.43) < 0.001);
$r = orolado_oxapay_recheck(['token' => 'tokV']);
check('autre joueur : aucun dépôt touché', ($r['credited'] ?? -1) == 0 && $money($V) === 0.0, json_encode($r));
$r = orolado_oxapay_recheck(['token' => 'nope']);
check('sans connexion → refusé', empty($r['ok']));

echo "\nRésultat : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
