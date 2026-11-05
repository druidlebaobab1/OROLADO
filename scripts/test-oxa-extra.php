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
$HIST = [];
$GLOBALS['OROLADO_FAKE_OXA'] = function ($m, $p, $b = null) use (&$OXA, &$HIST) {
  if ($m === 'POST' && $p === '/v1/payment/static-address') { $GLOBALS['STATIC_CALLS'] = ($GLOBALS['STATIC_CALLS'] ?? 0) + 1; return ($b['network'] ?? '') === 'TRON' ? ['data' => ['track_id' => 'TSTAT', 'address' => 'STATADDR', 'network' => 'TRON'], 'status' => 200] : ['message' => 'bad network', 'status' => 400]; }
  if (str_starts_with($p, '/v1/payment?')) { parse_str(substr($p, 12), $q); return ['data' => ['list' => $HIST[$q['address'] ?? ''] ?? []], 'meta' => ['page' => 1, 'last_page' => 1]]; }
  foreach ($OXA as $tid => $resp) if (str_ends_with($p, '/payment/' . $tid)) return ['data' => $resp];
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

echo "7) 2e envoi compté À PART par OxaPay (nouveau numéro de suivi, seulement le nouvel envoi)\n";
$fresh([$dep('o8', $A, 'T8', 'ADDR8', 'COMPLETED', 7.27, 'h8')]);
$OXA['T8'] = $pay('T8', 'o8', 'ADDR8', [$tx('h8', 7.27)]);
$OXA['T8b'] = $pay('T8b', '', 'ADDR8', [$tx('h8b', 7.70)]);
orolado_oxapay_webhook(json_encode(['track_id' => 'T8b', 'address' => 'ADDR8', 'status' => 'Paid']), '');
check('22 TRX (7,70 $) renvoyés sur l\'adresse TRX déjà payée → 7,70 $', abs($money($A) - 7.70) < 0.001, (string) $money($A));
orolado_oxapay_webhook(json_encode(['track_id' => 'T8b', 'address' => 'ADDR8', 'status' => 'Paid']), '');
check('message répété → pas de 2e crédit', abs($money($A) - 7.70) < 0.001, (string) $money($A));

echo "8) Rattrapage des envois déjà passés (notés dans le journal, jamais crédités)\n";
$fresh([$dep('o9', $A, 'T9', 'ADDR9', 'COMPLETED', 7.27, 'h9'), $dep('oW', $V, 'TW', 'ADDRW', 'COMPLETED', 5, 'hW')]);
$OXA['T9'] = $pay('T9', 'o9', 'ADDR9', [$tx('h9', 7.27)]);
$OXA['T9b'] = $pay('T9b', '', 'ADDR9', [$tx('h9b', 7.70)]);
$OXA['TWb'] = $pay('TWb', '', 'ADDRW', [$tx('hWb', 4)]);
$OXA['TZ'] = $pay('TZ', '', 'ADDR-INCONNUE', [$tx('hZ', 50)]);
@file_put_contents(orolado_data_dir() . '/oxapay_webhook.log', implode("\n", [
  json_encode(['ts' => date('c', time() - 3600), 'event' => 'webhook_in', 'trackId' => 'T9b', 'orderId' => '']),
  json_encode(['ts' => date('c', time() - 3000), 'event' => 'webhook_in', 'trackId' => 'TWb', 'orderId' => '']),
  json_encode(['ts' => date('c', time() - 2000), 'event' => 'webhook_in', 'trackId' => 'TZ', 'orderId' => '']),
  json_encode(['ts' => date('c', time() - 9 * 86400), 'event' => 'webhook_in', 'trackId' => 'TOLD', 'orderId' => '']),
]) . "\n");
$r = orolado_oxapay_recheck(['token' => 'tokA']);
check('ancien envoi TRX jamais crédité → 7,70 $ rattrapés', abs($money($A) - 7.70) < 0.001, json_encode($r));
check('envoi d\'un autre joueur → crédité à LUI (4 $), pas à moi', abs($money($V) - 4.0) < 0.001, (string) $money($V));
check('adresse inconnue → personne n\'est crédité', abs($money($A) + $money($V) - 11.70) < 0.001);
$doneT = json_decode((string) file_get_contents(orolado_data_dir() . '/oxapay_tracks_done.json'), true);
check('chaque numéro interrogé une seule fois, les vieux (> 48 h) ignorés', isset($doneT['T9b'], $doneT['TWb'], $doneT['TZ']) && !isset($doneT['TOLD']));
$x = orolado_oxapay_extra_payment($OXA['T9b'], load_db()['deposits'][0]);
check('rejoué à la main → pas de 2e crédit', !empty($x['duplicate']) && abs($money($A) - 7.70) < 0.001, json_encode($x));

echo "9) v3621 Bouton admin « Revérifier crypto » : 2e envoi sur la même adresse, sans message d'OxaPay\n";
$fresh([$dep('oR', $A, 'TR', 'ADDRR', 'COMPLETED', 103.72, 'hR1')]);
$OXA['TR'] = $pay('TR', 'oR', 'ADDRR', [$tx('hR1', 103.72), $tx('hR2', 79.2)]);
$r1 = orolado_oxapay_admin_recheck($A);
check('le 2e envoi est crédité', abs($money($A) - 79.2) < 0.02 && abs(($r1['credited'] ?? 0) - 79.2) < 0.02, json_encode($r1['credited'] ?? null) . ' / ' . $money($A));
$r2 = orolado_oxapay_admin_recheck($A);
check('2e clic : rien de plus (pas de double crédit)', abs($money($A) - 79.2) < 0.02 && ($r2['credited'] ?? 1) == 0, json_encode($r2['credited'] ?? null) . ' / ' . $money($A));
check("l'admin voit la réponse d'OxaPay", !empty($r1['rows'][0]['resultat']), json_encode($r1['rows'][0] ?? [], JSON_UNESCAPED_UNICODE));
$r3 = orolado_oxapay_admin_recheck($V);
check('un autre joueur ne reçoit rien', $money($V) == 0 && ($r3['credited'] ?? 1) == 0);

echo "10) v3622 Historique OxaPay : 2e envoi sur l'adresse payée, invisible dans le dépôt d'origine\n";
$fresh([$dep('oH', $A, 'TH', 'ADDRH', 'COMPLETED', 103.72, 'hH1')]);
$OXA['TH'] = $pay('TH', 'oH', 'ADDRH', [$tx('hH1', 103.72)]);
$HIST['ADDRH'] = [['track_id' => 'TH', 'txs' => [$tx('hH1', 103.72) + ['address' => 'ADDRH']]], ['track_id' => 'TH2', 'txs' => [$tx('hH2', 79.2) + ['address' => 'ADDRH']]]];
$h1 = orolado_oxapay_admin_recheck($A);
check('2e envoi lu dans l\'historique → crédité', abs($money($A) - 79.2) < 0.02, json_encode($h1['credited'] ?? null) . ' / ' . $money($A));
$h2 = orolado_oxapay_admin_recheck($A);
$GLOBALS['OROLADO_TEST_TOKEN'] = 1;
check('re-clic → rien de plus', abs($money($A) - 79.2) < 0.02 && ($h2['credited'] ?? 1) == 0, json_encode($h2['credited'] ?? null));
echo "11) Dépôt payé SANS hash noté : jamais recompté (total reçu − déjà crédité)\n";
$fresh([$dep('oN', $A, 'TN', 'ADDRN', 'COMPLETED', 50, '')]);
$HIST['ADDRN'] = [['track_id' => 'TN', 'txs' => [$tx('hN1', 50) + ['address' => 'ADDRN']]]];
orolado_oxapay_admin_recheck($A);
check('seul envoi déjà crédité → 0 $', $money($A) == 0, (string) $money($A));
$HIST['ADDRN'][] = ['track_id' => 'TN2', 'txs' => [$tx('hN2', 20) + ['address' => 'ADDRN']]];
orolado_oxapay_admin_recheck($A);
check('+20 $ renvoyés → exactement 20 $', abs($money($A) - 20) < 0.02, (string) $money($A));

echo "12) Automatique : joueur sur le site (sans bouton admin)\n";
$fresh([$dep('oP', $A, 'TP', 'ADDRP', 'COMPLETED', 103.72, 'hP1')]);
$OXA['TP'] = $pay('TP', 'oP', 'ADDRP', [$tx('hP1', 103.72)]);
$HIST['ADDRP'] = [['track_id' => 'TP', 'txs' => [$tx('hP1', 103.72) + ['address' => 'ADDRP']]], ['track_id' => 'TP2', 'txs' => [$tx('hP2', 79.2) + ['address' => 'ADDRP']]]];
$a1 = orolado_oxapay_recheck(['token' => 'tokA']);
check('crédité tout seul en ouvrant le site', abs($money($A) - 79.2) < 0.02, json_encode($a1));

echo "13) v3623 Ronde serveur : dépôt payé, message perdu, joueur parti\n";
$fresh([$dep('oS', $A, 'TS', 'ADDRS', 'PENDING', 15)]);
$OXA['TS'] = $pay('TS', 'oS', 'ADDRS', [$tx('hS1', 15)]);
@unlink(orolado_data_dir() . '/pay_sweep.next');
orolado_pay_sweep_after_response();
check('crédité par la ronde (sans le joueur)', abs($money($A) - 15) < 0.02, (string) $money($A));
@unlink(orolado_data_dir() . '/pay_sweep.next'); @unlink(orolado_data_dir() . '/pay_sweep_seen.json');
orolado_pay_sweep_after_response();
check('2e ronde : pas de 2e crédit', abs($money($A) - 15) < 0.02, (string) $money($A));
orolado_pay_sweep_after_response();
check('ronde trop tôt : ne fait rien (bon marché)', abs($money($A) - 15) < 0.02);
$ar = orolado_pay_admin_recheck($A);
check('bouton admin paiements : rien de plus', abs($money($A) - 15) < 0.02 && ($ar['credited'] ?? 1) == 0, json_encode($ar['credited'] ?? null));

echo "14) v3624 Admin avec le numéro Supabase, dépôt sous le numéro interne (cas Iberto)\n";
$fresh([]);
$UL = 'u9acc179a64721746'; $UU = 'cccccccc-0000-0000-0000-00000000000c';
with_db_lock(function ($box) use ($UL, $UU) { $box->db['users'][$UL] = ['id' => $UL, 'email' => 'ib@test.com', 'role' => 'user', 'sbId' => $UU]; $box->db['vault'][$UL] = ['demo' => 0, 'real' => 0];
  $box->db['deposits'][] = ['id' => 'oro_' . $UL . '_aa', 'ref' => 'oro_' . $UL . '_aa', 'userId' => $UL, 'operator' => 'oxapay', 'network' => 'TRC20', 'coin' => 'usdt_trc20', 'status' => 'COMPLETED', 'amount' => 104.85, 'currency' => 'USD', 'trackId' => 'TIB', 'address' => 'ADDRIB', 'txid' => 'hIB1', 'at' => date('c')]; return ['ok' => true]; });
$OXA['TIB'] = $pay('TIB', 'oro_' . $UL . '_aa', 'ADDRIB', [$tx('hIB1', 103.72)]);
$HIST['ADDRIB'] = [['track_id' => 'TIB', 'txs' => [$tx('hIB1', 103.72) + ['address' => 'ADDRIB']]], ['track_id' => 'TIB2', 'txs' => [$tx('hIB2', 79.2) + ['address' => 'ADDRIB']]]];
$ri = orolado_pay_admin_recheck($UU, 'ib@test.com');
check('dépôt trouvé et 2e envoi crédité', ($ri['credited'] ?? 0) > 70 && count($ri['rows'] ?? []) > 0, json_encode($ri, JSON_UNESCAPED_UNICODE));
$ri2 = orolado_pay_admin_recheck($UU, 'ib@test.com');
check('re-clic : 0', ($ri2['credited'] ?? 1) == 0, json_encode($ri2['credited'] ?? null));

echo "15) v3625 Rapprochement depuis la liste OxaPay (paiements « Paid »)\n";
$fresh([$dep('oQ', $A, 'TQ', 'ADDRQ', 'UNFINISHED', 15)]);
$OXA['TQ'] = $pay('TQ', 'oQ', 'ADDRQ', [$tx('hQ1', 80.2)]);
$HIST[''] = [$pay('TQ', 'oQ', 'ADDRQ', [$tx('hQ1', 80.2) + ['address' => 'ADDRQ']]), ['track_id' => 'TZZ', 'order_id' => 'inconnu_1', 'status' => 'Paid', 'email' => 'x@y.com', 'date' => time(), 'txs' => [$tx('hZ', 12) + ['address' => 'ADDRZ']]]];
$rq = orolado_pay_admin_recheck($A);
check('facture payée (même ancienne / non confirmée) créditée du montant reçu', abs($money($A) - 80.2) < 0.02, json_encode($rq['credited'] ?? null) . ' / ' . $money($A));
check('paiement inconnu montré à l\'admin, jamais crédité', count($rq['unknown'] ?? []) === 1 && $money($V) == 0, json_encode($rq['unknown'] ?? [], JSON_UNESCAPED_UNICODE));
$rq2 = orolado_pay_admin_recheck($A);
check('re-clic : 0', ($rq2['credited'] ?? 1) == 0 && abs($money($A) - 80.2) < 0.02, json_encode($rq2['credited'] ?? null));
$HIST[''] = [];

echo "16) v3626 ADRESSE PERMANENTE par joueur : tout envoi crédité, n'importe quand, n'importe quel montant\n";
$fresh([]);
$inv = orolado_oxapay_invoice(['token' => 'tokA', 'coin' => 'usdt_trc20', 'amount' => 20]);
check('adresse permanente donnée au joueur', ($inv['address'] ?? '') === 'STATADDR' && !empty($inv['static']), json_encode($inv));
$inv2 = orolado_oxapay_invoice(['token' => 'tokA', 'coin' => 'usdt_trc20', 'amount' => 500]);
$inv3 = orolado_oxapay_invoice(['token' => 'tokA', 'coin' => 'trx', 'amount' => 5]);
check('même adresse à chaque fois (USDT et TRX), créée une seule fois chez OxaPay', ($inv2['address'] ?? '') === 'STATADDR' && ($inv3['address'] ?? '') === 'STATADDR' && ($GLOBALS['STATIC_CALLS'] ?? 0) === 1, (string) ($GLOBALS['STATIC_CALLS'] ?? 0));
$OXA['TP1'] = $pay('TP1', 'oxs_' . preg_replace('/[^a-zA-Z0-9]/', '', $A) . '_tron', 'STATADDR', [$tx('hP1', 50) + ['address' => 'STATADDR']]);
orolado_oxapay_webhook(json_encode(['track_id' => 'TP1', 'order_id' => 'oxs_x', 'type' => 'static_address', 'status' => 'Paid']), '');
check('1er envoi 50 $ → crédité', abs($money($A) - 50) < 0.02, (string) $money($A));
$OXA['TP2'] = $pay('TP2', 'oxs_' . preg_replace('/[^a-zA-Z0-9]/', '', $A) . '_tron', 'STATADDR', [$tx('hP2', 1000) + ['address' => 'STATADDR']]);
orolado_oxapay_webhook(json_encode(['track_id' => 'TP2', 'type' => 'static_address', 'status' => 'Paid']), '');
check('2e envoi 1000 $ (même adresse, plus tard) → crédité', abs($money($A) - 1050) < 0.02, (string) $money($A));
orolado_oxapay_webhook(json_encode(['track_id' => 'TP2', 'type' => 'static_address', 'status' => 'Paid']), '');
orolado_oxapay_webhook(json_encode(['track_id' => 'TP1', 'type' => 'static_address', 'status' => 'Paid']), '');
check('messages répétés (OxaPay renvoie 5 fois) → rien de plus', abs($money($A) - 1050) < 0.02, (string) $money($A));
$HIST['STATADDR'] = [$OXA['TP1'], $OXA['TP2'], $pay('TP3', 'oxs_x', 'STATADDR', [$tx('hP3', 7.5) + ['address' => 'STATADDR']])];
$st3 = orolado_pay_admin_recheck($A);
check('3e envoi sans aucun message → rattrapé (7,50 $), le reste pas recompté', abs($money($A) - 1057.5) < 0.02, json_encode($st3['credited'] ?? null) . ' / ' . $money($A));
$anc = null; foreach (load_db(orolado_data_file())['deposits'] as $dd) if (($dd['kind'] ?? '') === 'static') $anc = $dd;
check("l'ancre n'est jamais créditée elle-même (0 $, STATIC)", $anc && ($anc['status'] ?? '') === 'STATIC' && (float) ($anc['amount'] ?? 1) == 0.0, json_encode($anc));
check('adresse permanente pas prise par un autre joueur', $money($V) == 0);

echo "\nRésultat : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
