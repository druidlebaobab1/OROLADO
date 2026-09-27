<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * GROS MONTANTS : dépôts d'un million, mises de 1 000 à 500 000 $, gains ×50 (jusqu'à 25 M$),
 * centaines de trades d'affilée. Fausse caisse, vrai code du site : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_big_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';

// Fausse caisse en CENTIMES entiers (comme numeric(14,2) en base) : aucune erreur d'arrondi possible côté caisse.
$bank = ['c' => [], 'keys' => []];
$cents = static fn(float $x): int => (int) round($x * 100);
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bank, $cents) {
  $u = $a['p_user'];
  $bank['c'][$u] = $bank['c'][$u] ?? 0;
  if ($fn === 'debit_real') {
    if ($bank['c'][$u] < $cents((float) $a['p_amount'])) return ['ok' => false, 'reason' => 'insufficient'];
    $bank['c'][$u] -= $cents((float) $a['p_amount']);
    return ['ok' => true, 'real' => $bank['c'][$u] / 100];
  }
  if ($fn === 'resolve_trade') {
    if (isset($bank['keys'][$a['p_order']])) return ['ok' => true, 'duplicate' => true, 'real' => $bank['c'][$u] / 100];
    $bank['keys'][$a['p_order']] = 1;
    $bank['c'][$u] += $cents((float) $a['p_amount']);
    return ['ok' => true, 'real' => $bank['c'][$u] / 100];
  }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$bank, $cents) {
  $b = $body ? json_decode($body, true) : [];
  if (str_contains($url, '/rpc/resolve_trade')) return ($GLOBALS['OROLADO_FAKE_RPC'])('resolve_trade', $b);
  if (str_contains($url, '/rest/v1/vaults?user_id=eq.')) {
    preg_match('/user_id=eq\.([^&]+)/', $url, $m);
    $u = rawurldecode($m[1]);
    return isset($bank['c'][$u]) ? [['demo' => 1000000, 'real' => $bank['c'][$u] / 100]] : [];
  }
  return [];
};

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$money = static fn(float $x): string => number_format($x, 2, ',', ' ') . ' $';

$uid = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users'][$uid] = ['id' => $uid, 'email' => 'gros@test.com', 'role' => 'user', 'sbId' => $uid];
$db['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
$db['deposits'][] = ['id' => 'big_dep1', 'ref' => 'big_dep1', 'userId' => $uid, 'amount' => 0, 'status' => 'PENDING', 'operator' => 'oxapay'];
$db['deposits'][] = ['id' => 'big_dep2', 'ref' => 'big_dep2', 'userId' => $uid, 'amount' => 0, 'status' => 'PENDING', 'operator' => 'flutterwave'];
save_db(orolado_data_file(), $db);
$bank['c'][$uid] = 0;

echo "1) Gros dépôts\n";
$GLOBALS['OROLADO_FAKE_PRICES'] = ['BTC' => 60000.0];
$usd = orolado_oxapay_received_usd(['txs' => [['currency' => 'BTC', 'received_amount' => 20]]]);
check('20 BTC reçus → 1 200 000 $ calculés', abs($usd - 1200000) < 0.01, $money($usd));
$r = credit_paid_deposit(['ref' => 'big_dep1', 'amount' => $usd, 'paid' => true, 'creditReceived' => true, 'operator' => 'oxapay', 'extId' => 'TX_BIG_1']);
check('dépôt crypto de 1 200 000 $ crédité (plus de plafond de 100 000 $)', !empty($r['ok']), json_encode($r));
check('caisse = 1 200 000,00 $', $bank['c'][$uid] === 120000000, $money($bank['c'][$uid] / 100));
$again = credit_paid_deposit(['ref' => 'big_dep1', 'amount' => $usd, 'paid' => true, 'creditReceived' => true, 'operator' => 'oxapay', 'extId' => 'TX_BIG_1']);
check('le même gros dépôt reçu 2 fois : crédité une seule fois', $bank['c'][$uid] === 120000000, $money($bank['c'][$uid] / 100));
$fcfa = orolado_usd_to_cfa_int(1000000);
$xof = orolado_flutterwave_to_usd('XOF', $fcfa);
check('carte : 1 000 000 $ facturés ' . number_format($fcfa, 0, ',', ' ') . ' FCFA → recrédités 1 000 000 $ (même taux dans les 2 sens)', abs($xof - 1000000) < 0.01, $money($xof));
$r = credit_paid_deposit(['ref' => 'big_dep2', 'amount' => $xof, 'paid' => true, 'creditReceived' => true, 'operator' => 'flutterwave', 'extId' => 'FLW_BIG_1']);
check('dépôt carte de 1 000 000 $ crédité', !empty($r['ok']), json_encode($r));
$start = $bank['c'][$uid];
check('caisse = 2 200 000,00 $', $start === 220000000, $money($start / 100));
$db = load_db();
check('total déposé du joueur = 2 200 000 $', abs((float) ($db['users'][$uid]['realDepositTotal'] ?? 0) - 2200000) < 0.01, $money((float) ($db['users'][$uid]['realDepositTotal'] ?? 0)));
check('règle ×2 : 4 400 000 $ à miser', abs((float) ($db['users'][$uid]['requiredWagering'] ?? 0) - 4400000) < 0.01, $money((float) ($db['users'][$uid]['requiredWagering'] ?? 0)));

echo "2) Grosses mises en réel (aucun plafond)\n";
$me = load_db()['users'][$uid];
$orders = [];
$plan = [[1000, 1.88, 'call'], [2000, 1.88, 'put'], [10000, 5, 'call'], [100000, 10, 'put'], [500000, 50, 'call'], [12345.67, 1.88, 'put']];
$staked = 0;
foreach ($plan as $i => [$stake, $mult, $side]) {
  $before = $bank['c'][$uid];
  $r = orolado_trade_place($me, ['id' => 'big' . $i, 'stake' => $stake, 'side' => $side, 'duration' => 5, 'mode' => 'real', 'assetId' => 'v100', 'payout' => $mult]);
  $ok = !empty($r['ok']);
  $debited = ($before - $bank['c'][$uid]) / 100;
  check('mise de ' . $money($stake) . ' ×' . $mult . ' acceptée, débit exact', $ok && abs($debited - $stake) < 0.001, $ok ? $money($debited) : ($r['reason'] ?? ''));
  if ($ok) { $orders[] = ['id' => 'big' . $i, 'stake' => $stake, 'mult' => $mult]; $staked += $stake; }
}
$r = orolado_trade_place($me, ['id' => 'trop', 'stake' => 5000000, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => 'v100', 'payout' => 1.88]);
check('mise plus grande que le solde : refusée proprement', empty($r['ok']), (string) ($r['reason'] ?? ''));
sleep(6);
$credited = 0.0;
$wins = 0;
foreach ($orders as $o) {
  $s = orolado_trade_settle($uid, $o['id']);
  $ord = $s['order'] ?? [];
  $st = (string) ($ord['status'] ?? '');
  $expect = $st === 'won' ? round($o['stake'] * $o['mult'], 2) : ($st === 'void' ? $o['stake'] : 0.0);
  $got = (float) ($bank['keys'][$o['id']] ?? -1) >= 0 ? $expect : -1;
  $credited += $expect;
  if ($st === 'won') $wins++;
  check('règlement ' . $money($o['stake']) . ' ×' . $o['mult'] . ' : ' . ($st ?: '?') . ($st === 'won' ? ' → +' . $money($expect) : ''), in_array($st, ['won', 'lost', 'void'], true) && isset($bank['keys'][$o['id']]));
}
$want = $start - (int) round($staked * 100) + (int) round($credited * 100);
check('caisse finale = départ − mises + gains, au centime près', $bank['c'][$uid] === $want, $money($bank['c'][$uid] / 100) . ' / attendu ' . $money($want / 100));
$db = load_db();
check('solde du fichier = caisse', abs((float) $db['vault'][$uid]['real'] - $bank['c'][$uid] / 100) < 0.001, $money((float) $db['vault'][$uid]['real']));
check('volume misé enregistré au centime', abs((float) ($db['users'][$uid]['realStakeVolume'] ?? 0) - $staked) < 0.001, $money((float) ($db['users'][$uid]['realStakeVolume'] ?? 0)));

echo "3) Gain énorme possible : 500 000 \$ ×50 = 25 000 000 \$\n";
$big = orolado_fair_credit('won', 500000, 50);
check('calcul du gain ×50 exact', abs($big - 25000000) < 0.001, $money($big));
check('arrondi au centime sur 12 345 678,905', orolado_money(12345678.905) === 12345678.91 || orolado_money(12345678.905) === 12345678.9, (string) orolado_money(12345678.905));

echo "4) 300 trades de 10 000 \$ d'affilée : aucune dérive d'arrondi\n";
$bank['c'][$uid] = 1000000000; // 10 000 000 $
with_db_lock(function ($box) use ($uid) { $box->db['vault'][$uid]['real'] = 10000000; return ['ok' => true]; });
$me = load_db()['users'][$uid];
$ids = [];
$sum = 0;
for ($i = 0; $i < 300; $i++) {
  $r = orolado_trade_place($me, ['id' => 'm' . $i, 'stake' => 10000, 'side' => $i % 2 ? 'put' : 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => 'v100', 'payout' => 1.88]);
  if (!empty($r['ok'])) { $ids[] = 'm' . $i; $sum += 10000; }
}
check('300 mises de 10 000 $ acceptées', count($ids) === 300, (string) count($ids));
sleep(6);
$cred = 0;
foreach ($ids as $id) {
  $s = orolado_trade_settle($uid, $id);
  $st = (string) ($s['order']['status'] ?? '');
  if ($st === 'won') $cred += 1880000; elseif ($st === 'void') $cred += 1000000;
}
$want = 1000000000 - $sum * 100 + $cred;
check('caisse exacte au centime après 300 gros trades', $bank['c'][$uid] === $want, $money($bank['c'][$uid] / 100) . ' / attendu ' . $money($want / 100));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
