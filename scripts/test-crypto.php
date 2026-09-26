<?php
declare(strict_types=1);
/**
 * Test des dépôts crypto : chaque pièce doit être convertie en DOLLARS au bon cours.
 * Bug corrigé : 20 TRX (≈ 7 $) étaient crédités 20 $, et 0,001 BTC (≈ 60 $) aurait donné 0,001 $.
 * Faux cours et fausse base : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_cry_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
require $tmp . '/orolado_lib.php';

$GLOBALS['OROLADO_FAKE_PRICES'] = ['TRX' => 0.35, 'BTC' => 60000, 'ETH' => 3000, 'SOL' => 150, 'DOGE' => 0.12, 'LTC' => 80, 'XRP' => 0.5, 'BNB' => 550];
$credits = [];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$credits) {
  if (str_contains($url, '/rpc/')) $credits[] = $url;
  return [];
};

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$usd = static fn(array $d): float => orolado_oxapay_received_usd($d);
$near = static fn(float $a, float $b): bool => abs($a - $b) < 0.011;

echo "1) Conversion au bon cours\n";
$r = $usd(['pay_currency' => 'TRX', 'txs' => [['status' => 'confirmed', 'currency' => 'TRX', 'received_amount' => 20]]]);
check('20 TRX à 0,35 $ → 7,00 $ (avant : 20 $)', $near($r, 7.0), (string) $r);
$r = $usd(['pay_currency' => 'TRX', 'txs' => [['currency' => 'TRX', 'amount' => 20, 'value' => 20]]]);
check('20 TRX dont la « valeur » répète le nombre de pièces → 7,00 $', $near($r, 7.0), (string) $r);
$r = $usd(['txs' => [['currency' => 'TRX', 'received_amount' => 20, 'value' => 6.95]]]);
check('20 TRX + valeur OxaPay 6,95 $ (même ordre) → 6,95 $', $near($r, 6.95), (string) $r);
$r = $usd(['txs' => [['currency' => 'BTC', 'received_amount' => 0.001]]]);
check('0,001 BTC à 60 000 $ → 60,00 $ (avant : 0,001 $)', $near($r, 60.0), (string) $r);
$r = $usd(['txs' => [['currency' => 'ETH', 'amount' => 0.01]]]);
check('0,01 ETH à 3 000 $ → 30,00 $', $near($r, 30.0), (string) $r);
$r = $usd(['txs' => [['currency' => 'USDT', 'received_amount' => 15]]]);
check('15 USDT → 15,00 $', $near($r, 15.0), (string) $r);
$r = $usd(['txs' => [['currency' => 'TRX', 'received_amount' => 20, 'auto_convert' => ['amount' => 6.9, 'currency' => 'USDT']]]]);
check('20 TRX convertis automatiquement en 6,90 USDT → 6,90 $', $near($r, 6.9), (string) $r);
$r = $usd(['txs' => [['currency' => 'TRX', 'received_amount' => 10], ['currency' => 'TRX', 'received_amount' => 10], ['currency' => 'TRX', 'received_amount' => 50, 'status' => 'failed']]]);
check('2 envois de 10 TRX (+1 échoué ignoré) → 7,00 $', $near($r, 7.0), (string) $r);
$r = $usd(['txs' => [['currency' => 'DOGE', 'received_amount' => 1]]]);
check('petit dépôt : 1 DOGE → 0,12 $ (aucun minimum)', $near($r, 0.12), (string) $r);
$all = true;
foreach (['SOL' => 2, 'LTC' => 0.5, 'XRP' => 40, 'BNB' => 0.1] as $c => $n) {
  $r = $usd(['txs' => [['currency' => $c, 'received_amount' => $n]]]);
  if (!$near($r, $n * $GLOBALS['OROLADO_FAKE_PRICES'][$c])) $all = false;
}
check('SOL, LTC, XRP, BNB : tous convertis au bon cours', $all);

echo "2) Cours introuvable : on ne devine pas\n";
$x = orolado_oxapay_received(['txs' => [['currency' => 'DOGS', 'received_amount' => 1000, 'value' => 1000]]]);
check('pièce sans cours → pas de crédit, dépôt laissé en attente', $x['known'] === false && orolado_oxapay_received_usd(['txs' => [['currency' => 'DOGS', 'received_amount' => 1000]]]) === 0.0);
$x = orolado_oxapay_received(['txs' => [['currency' => 'DOGS', 'received_amount' => 1000, 'value' => 4.2]]]);
check('pièce sans cours mais valeur en $ fournie par OxaPay → 4,20 $', $x['known'] && $near($x['usd'], 4.2), json_encode($x));

echo "3) Faux avis de paiement (non signé)\n";
$db = blank_db();
$uid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
$db['users'][$uid] = ['id' => $uid, 'email' => 'j@test.com', 'sbId' => $uid];
$db['deposits'][] = ['id' => 'oro_x1', 'ref' => 'oro_x1', 'userId' => $uid, 'amount' => 5, 'status' => 'PENDING', 'operator' => 'oxapay', 'address' => 'TFakeAddress123'];
save_db(orolado_data_file(), $db);
$out = orolado_oxapay_apply_payload(['status' => 'paid', 'address' => 'TFakeAddress123', 'txs' => [['currency' => 'USDT', 'received_amount' => 10000]]], false);
$d = load_db()['deposits'][0];
check('avis non signé de 10 000 $ : rien crédité', $credits === [] && strtoupper((string) $d['status']) === 'PENDING', json_encode($credits));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
