<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-11 — Coffre OROLADO, famille Ethereum (coffre_evm_lib.php) sur un FAUX réseau BNB/Ethereum/Polygon :
 * une adresse 0x par joueur, crédit de tout montant (USDT 18 décimales sur BNB, BNB natif), jamais deux fois, essence
 * du réservoir jamais créditée au joueur, transactions ratées sans double compte, envoi vers le Trust Wallet.
 * Le faux réseau reconnaît l'expéditeur en RE-SIGNANT avec chaque clé connue (signature déterministe) : une signature
 * fausse serait refusée.
 */
$tmp = sys_get_temp_dir() . '/orolado_cevm_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'coffre_lib.php', 'coffre_ec.php', 'coffre_evm_lib.php', 'keys_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OXAPAY_MERCHANT_KEY=fake-oxa');
const DEST = '0x19234aaaaaaaaaaaaaaaaaaaaaaaaaaaaa4ccbc8';
putenv('VAULT_EVM_ADDRESS=' . DEST);
require $tmp . '/orolado_lib.php';
$GLOBALS['OROLADO_FAKE_PRICES'] = ['BNB' => 600.0, 'ETH' => 3000.0, 'POL' => 0.5, 'LINK' => 15.0, 'AVAX' => 25.0];
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
$GLOBALS['OROLADO_FAKE_OXA'] = fn() => null;

// ---------- faux réseau EVM ----------
const GP = 1000000000; // 1 gwei
$N = ['nat' => [], 'tok' => [], 'nonce' => [], 'mem' => [], 'rcpt' => [], 'bad' => 0, 'failNext' => false];
function W(float $units, int $dec = 18): array { return cec_from_hex(dechex((int) round($units * 1e6)) ); }
function U(float $units, int $dec): array { $v = cec_from_hex(dechex((int) round($units * 1e6))); return cec_mul($v, cec_from_hex(dechex(10 ** ($dec - 6)))); }
function rlp_dec(string $s, int &$i): array|string {
  $b = ord($s[$i]);
  if ($b < 0x80) { $i++; return $s[$i - 1]; }
  if ($b <= 0xb7) { $l = $b - 0x80; $v = substr($s, $i + 1, $l); $i += 1 + $l; return $v; }
  if ($b <= 0xbf) { $ll = $b - 0xb7; $l = hexdec(bin2hex(substr($s, $i + 1, $ll))); $v = substr($s, $i + 1 + $ll, $l); $i += 1 + $ll + $l; return $v; }
  $l = $b <= 0xf7 ? $b - 0xc0 : hexdec(bin2hex(substr($s, $i + 1, $b - 0xf7)));
  $start = $i + 1 + ($b <= 0xf7 ? 0 : $b - 0xf7); $end = $start + $l; $i = $start; $out = [];
  while ($i < $end) $out[] = rlp_dec($s, $i);
  return $out;
}
$tok = function (string $chain, string $sym) { return cevm_chains()[$chain]['tokens'][$sym][0]; };
$GLOBALS['OROLADO_FAKE_EVM'] = function (string $chain, string $m, array $p) use (&$N, $tok) {
  $get = fn($a) => $N['nat'][$chain][strtolower($a)] ?? [0];
  if ($m === 'eth_getBalance') return ['result' => '0x' . cec_to_hex($get($p[0]), 0)];
  if ($m === 'eth_gasPrice') return ['result' => '0x' . dechex(GP)];
  if ($m === 'eth_estimateGas') return ['result' => !empty($p[0]['data']) ? '0xc350' : '0x5208'];
  if ($m === 'eth_getTransactionCount') return ['result' => '0x' . dechex($N['nonce'][$chain][strtolower($p[0])] ?? 0)];
  if ($m === 'eth_call') {
    $who = '0x' . substr($p[0]['data'], -40);
    return ['result' => '0x' . str_pad(cec_to_hex($N['tok'][$chain][strtolower($p[0]['to'])][$who] ?? [0], 0), 64, '0', STR_PAD_LEFT)];
  }
  if ($m === 'eth_getTransactionReceipt') return ['result' => $N['rcpt'][$p[0]] ?? null];
  if ($m === 'eth_sendRawTransaction') {
    $raw = hex2bin(substr($p[0], 2)); $i = 0; $f = rlp_dec($raw, $i);
    [$nonce, $gp, $gas, $to, $val, $data, $v, $r, $s] = $f;
    $cid = cevm_chains()[$chain]['id'];
    // Qui a signé ? on re-signe avec chaque clé connue : seule la vraie clé redonne exactement la même signature.
    $base = [cevm_rlp_bytes($nonce), cevm_rlp_bytes($gp), cevm_rlp_bytes($gas), cevm_rlp_bytes($to), cevm_rlp_bytes($val), cevm_rlp_bytes($data)];
    $digest = coffre_keccak256(cevm_rlp_list(array_merge($base, [cevm_rlp_int(dechex($cid)), cevm_rlp_bytes(''), cevm_rlp_bytes('')])));
    $from = null;
    foreach (array_merge([coffre_gas()], array_map(fn($f) => coffre_json($f), glob(coffre_dir() . '/w_*.json'))) as $w) {
      $k = cevm_key_from_pem(coffre_dec((string) ($w['enc'] ?? ''))); if (!$k) continue;
      $sg = cec_sign($digest, $k['priv']);
      if ($sg['r'] === str_pad($r, 32, "\0", STR_PAD_LEFT) && $sg['s'] === str_pad($s, 32, "\0", STR_PAD_LEFT) && hexdec(bin2hex($v)) === $sg['v'] + $cid * 2 + 35) { $from = $k['addr']; break; }
    }
    if ($from === null) { $N['bad']++; return ['error' => ['message' => 'invalid sender']]; }
    $n0 = $N['nonce'][$chain][$from] ?? 0;
    if (hexdec(bin2hex($nonce) ?: '0') !== $n0) return ['error' => ['message' => 'nonce']];
    $N['nonce'][$chain][$from] = $n0 + 1;
    $h = '0x' . bin2hex(random_bytes(32));
    $N['mem'][] = ['chain' => $chain, 'h' => $h, 'from' => $from, 'to' => '0x' . bin2hex($to), 'val' => cec_from_bin($val ?: "\0"), 'data' => bin2hex($data), 'gas' => hexdec(bin2hex($gas)), 'gp' => hexdec(bin2hex($gp))];
    return ['result' => $h];
  }
  return ['error' => ['message' => 'méthode inconnue ' . $m]];
};
/** « Un bloc passe » : les transactions en attente sont exécutées (comme le vrai réseau : frais payés même si ça échoue). */
$mine = function () use (&$N) {
  foreach ($N['mem'] as $t) {
    $ch = $t['chain']; $used = $t['data'] ? 50000 : 21000; $fee = cec_mul(cec_from_hex(dechex($used)), cec_from_hex(dechex($t['gp'])));
    $bal = $N['nat'][$ch][$t['from']] ?? [0];
    $ok = !$N['failNext'];
    if (cec_cmp($bal, cec_add($fee, $t['val'])) < 0) $ok = false;
    if ($t['data'] && $ok) {
      $to = '0x' . substr($t['data'], 8 + 24, 40); $amt = cec_from_hex(substr($t['data'], 8 + 64));
      $have = $N['tok'][$ch][$t['to']][$t['from']] ?? [0];
      if (cec_cmp($have, $amt) < 0) $ok = false;
      else { $N['tok'][$ch][$t['to']][$t['from']] = cec_sub($have, $amt); $N['tok'][$ch][$t['to']][$to] = cec_add($N['tok'][$ch][$t['to']][$to] ?? [0], $amt); }
    }
    if (cec_cmp($bal, $fee) >= 0) $N['nat'][$ch][$t['from']] = cec_sub($bal, $fee); else { $N['nat'][$ch][$t['from']] = [0]; }
    if ($ok && !$t['data']) { $N['nat'][$ch][$t['from']] = cec_sub($N['nat'][$ch][$t['from']], $t['val']); $N['nat'][$ch][$t['to']] = cec_add($N['nat'][$ch][$t['to']] ?? [0], $t['val']); }
    $N['rcpt'][$t['h']] = ['status' => $ok ? '0x1' : '0x0', 'gasUsed' => '0x' . dechex($used), 'effectiveGasPrice' => '0x' . dechex($t['gp'])];
    $N['failNext'] = false;
  }
  $N['mem'] = [];
};
$deposit = function (string $chain, string $to, string $sym, float $units) use (&$N, $tok) {
  if ($sym === 'N') { $N['nat'][$chain][$to] = cec_add($N['nat'][$chain][$to] ?? [0], U($units, 18)); return; }
  $t = $tok($chain, $sym); $dec = cevm_chains()[$chain]['tokens'][$sym][1];
  $N['tok'][$chain][$t][$to] = cec_add($N['tok'][$chain][$t][$to] ?? [0], U($units, $dec));
};
$tokBal = function ($chain, $sym, $who) use (&$N, $tok) { return cevm_float($N['tok'][$chain][$tok($chain, $sym)][$who] ?? [0], cevm_chains()[$chain]['tokens'][$sym][1]); };
$natBal = function ($chain, $who) use (&$N) { return cevm_float($N['nat'][$chain][$who] ?? [0], 18); };

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-0000-0000-0000-00000000000a'; $B = 'aaaaaaaa-0000-0000-0000-00000000000b';
$money = function (string $u) use (&$bank) { return ($bank['c'][$u] ?? 0) / 100; };
$db = blank_db();
foreach ([$A => 'a@t.com', $B => 'b@t.com'] as $id => $mail) { $db['users'][$id] = ['id' => $id, 'email' => $mail, 'role' => 'user', 'sbId' => $id, 'displayName' => $mail]; $db['vault'][$id] = ['demo' => 0, 'real' => 0]; }
$db['sessions']['tokA'] = ['userId' => $A, 'at' => date('c')]; $db['sessions']['tokB'] = ['userId' => $B, 'at' => date('c')];
save_db(orolado_data_file(), $db);
coffre_cfg_set(['on' => true, 'evm_on' => false, 'min' => 20, 'oxapay_off' => false]);
echo "0) Pas encore allumé pour tous : seul l'admin voit l'adresse 0x (même si TRON est allumé)\n";
$i0 = orolado_oxapay_invoice(['token' => 'tokA', 'coin' => 'usdt_bep20', 'amount' => 20, 'confirmed' => true]);
check('joueur : USDT BEP20 reste chez OxaPay tant que la famille Ethereum n’est pas allumée', empty($i0['own']), json_encode($i0));
coffre_cfg_set(['evm_on' => true]);
$inv = fn($tok, $coin) => orolado_oxapay_invoice(['token' => $tok, 'coin' => $coin, 'amount' => 20, 'confirmed' => true]);
$scanAll = function () { foreach (coffre_json(cevm_index_file()) as $ad => $e) coffre_json_rw(cevm_index_file(), function (&$st) use ($ad) { $st[$ad]['seen'] = []; }); cevm_scan(100, 30); };

echo "1) Une adresse 0x par joueur, la même pour BNB, Ethereum, Polygon\n";
$ia = $inv('tokA', 'usdt_bep20'); $ia2 = $inv('tokA', 'eth'); $ib = $inv('tokB', 'usdt_bep20');
check('A : adresse 0x (somme de contrôle valide)', !empty($ia['own']) && cevm_addr_ok($ia['address']), json_encode($ia));
check('même adresse pour USDT BEP20 et ETH', strtolower($ia['address']) === strtolower($ia2['address']));
check('B : une autre adresse', strtolower($ib['address']) !== strtolower($ia['address']));
$a = strtolower($ia['address']); $b = strtolower($ib['address']);
check('même clé que son adresse TRON (une seule clé par joueur, dans la copie de secours)', coffre_addr_bin(coffre_addr_for($A)) === "\x41" . hex2bin(substr($a, 2)));

echo "2) Dépôts crédités une seule fois (USDT BEP20 à 18 décimales, BNB, USDC Polygon)\n";
$deposit('bsc', $a, 'USDT', 50);
$s = orolado_oxapay_status(['token' => 'tokA', 'orderId' => $ia['orderId']]);
check('50 USDT BEP20 → 50,00 $', !empty($s['paid']) && abs($money($A) - 50) < 0.001, json_encode($s) . ' ' . $money($A));
$scanAll(); $scanAll();
check('rondes suivantes → toujours 50 $', abs($money($A) - 50) < 0.001);
$deposit('bsc', $a, 'N', 0.1); $scanAll();
check('0,1 BNB (600 $) → +60 $', abs($money($A) - 110) < 0.01, (string) $money($A));
$deposit('polygon', $a, 'USDC', 12.34); $scanAll();
check('12,34 USDC sur Polygon (même adresse) → +12,34 $', abs($money($A) - 122.34) < 0.01, (string) $money($A));
$deposit('bsc', $b, 'USDT', 0.4); $scanAll();
check('poussière 0,40 USDT → rien', $money($B) == 0);
$deposit('eth', $b, 'LINK', 2); $scanAll();
check('2 LINK (15 $) sur Ethereum → +30 $ (prix du moment, pas 2 $)', abs($money($B) - 30) < 0.01, (string) $money($B));
$deposit('avax', $b, 'USDC', 7); $deposit('avax', $b, 'N', 0.4); $scanAll();
check('Avalanche : 7 USDC + 0,4 AVAX (25 $) → +17 $', abs($money($B) - 47) < 0.01, (string) $money($B));
$ix = $inv('tokB', 'pepe');
check('PEPE / OP / CAKE : même adresse 0x', strtolower($ix['address'] ?? '') === $b && strtolower($inv('tokB', 'op')['address'] ?? '') === $b && strtolower($inv('tokB', 'cake')['address'] ?? '') === $b, json_encode($ix));

echo "3) Envoi vers le Trust Wallet : essence, jetons, BNB — et l'essence n'est JAMAIS créditée au joueur\n";
cevm_sweep(true, 10);
check('réservoir vide → rien ne part, alerte', count(array_filter(coffre_journal(10), fn($j) => $j['k'] === 'reservoir_vide')) >= 1);
$gas = cevm_gas_addr();
$N['nat']['bsc'][$gas] = U(1, 18); $N['nat']['polygon'][$gas] = U(50, 18);
cevm_sweep(true, 10); $mine();
check('essence envoyée là où il en manquait (Polygon), signatures acceptées', $N['bad'] === 0 && $natBal('polygon', $a) > 0, $N['bad'] . ' / ' . $natBal('polygon', $a));
$scanAll();
check('essence reçue : PAS créditée au joueur (toujours 122,34 $)', abs($money($A) - 122.34) < 0.01, (string) $money($A));
for ($k = 0; $k < 4; $k++) { cevm_sweep(true, 10); $mine(); $scanAll(); }
check('50 USDT arrivés sur le Trust Wallet (BNB)', abs($tokBal('bsc', 'USDT', DEST) - 50) < 1e-6, (string) $tokBal('bsc', 'USDT', DEST));
check('12,34 USDC arrivés sur le Trust Wallet (Polygon)', abs($tokBal('polygon', 'USDC', DEST) - 12.34) < 1e-6, (string) $tokBal('polygon', 'USDC', DEST));
check('le BNB du joueur parti aussi vers le Trust Wallet', $natBal('bsc', DEST) > 0.09, (string) $natBal('bsc', DEST));
check('après tous ces envois : crédit inchangé (122,34 $)', abs($money($A) - 122.34) < 0.01, (string) $money($A));

echo "4) Nouveau dépôt après un envoi, et transaction ratée\n";
$deposit('bsc', $a, 'USDT', 30); $scanAll();
check('30 USDT de plus → +30 $ (rien de compté en double avec ce qui est déjà parti)', abs($money($A) - 152.34) < 0.01, (string) $money($A));
$N['failNext'] = true; cevm_sweep(true, 10); $mine(); $scanAll();
check('envoi raté sur le réseau → pas de crédit en plus, l’argent est toujours là', abs($money($A) - 152.34) < 0.01 && abs($tokBal('bsc', 'USDT', $a) - 30) < 1e-6, $money($A) . ' / ' . $tokBal('bsc', 'USDT', $a));
for ($k = 0; $k < 3; $k++) { cevm_sweep(true, 10); $mine(); $scanAll(); }
check('nouvel essai → les 30 USDT partent ; total Trust Wallet 80 USDT', abs($tokBal('bsc', 'USDT', DEST) - 80) < 1e-6, (string) $tokBal('bsc', 'USDT', DEST));
check('toujours 152,34 $ crédités (aucun doublon)', abs($money($A) - 152.34) < 0.01);
check('aucune signature refusée par le faux réseau', $N['bad'] === 0);

echo "\nRésultat : $pass OK, $fail échec(s)\n";
exec('rm -rf ' . escapeshellarg($tmp));
exit($fail ? 1 : 0);
