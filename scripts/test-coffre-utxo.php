<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-11 — Coffre OROLADO, famille Bitcoin (coffre_utxo_lib.php) sur un FAUX réseau Bitcoin / Litecoin / Dogecoin :
 * une adresse par joueur et par réseau, crédit seulement une fois CONFIRMÉ, jamais deux fois, envoi de tout vers le
 * Trust Wallet (frais pris sur le montant), nouveau dépôt après un envoi.
 * Le faux réseau vérifie chaque transaction en la RE-CONSTRUISANT avec chaque clé connue (signature déterministe) :
 * une signature fausse ou des pièces inventées seraient refusées.
 */
$tmp = sys_get_temp_dir() . '/orolado_cutxo_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'coffre_lib.php', 'coffre_ec.php', 'coffre_evm_lib.php', 'coffre_utxo_lib.php', 'keys_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OXAPAY_MERCHANT_KEY=fake-oxa');
const D_BTC = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
const D_LTC = 'ltc1qg42tkwuuxefutzxezdkdel39gfstuap288mfea';
const D_DOGE = 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L';
putenv('VAULT_BTC_ADDRESS=' . D_BTC); putenv('VAULT_LTC_ADDRESS=' . D_LTC); putenv('VAULT_DOGE_ADDRESS=' . D_DOGE);
require $tmp . '/orolado_lib.php';
$GLOBALS['OROLADO_FAKE_PRICES'] = ['BTC' => 60000.0, 'LTC' => 80.0, 'DOGE' => 0.2];
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

// ---------- faux réseau : pièces (UTXO) par adresse ----------
$N = ['u' => [], 'mem' => [], 'bad' => 0, 'fee' => ['btc' => 5, 'ltc' => 2, 'doge' => 2000], 'calls' => 0];
function rd(string $s, int &$i, int $n): string { $v = substr($s, $i, $n); $i += $n; return $v; }
function rv(string $s, int &$i): int { $b = ord($s[$i++]); if ($b < 0xfd) return $b; if ($b === 0xfd) return unpack('v', rd($s, $i, 2))[1]; return unpack('V', rd($s, $i, 4))[1]; }
$fund = function (string $chain, string $addr, int $sats, bool $conf = true) use (&$N) {
  $N['u'][$chain][$addr][] = ['txid' => bin2hex(random_bytes(32)), 'vout' => random_int(0, 3), 'value' => $sats, 'conf' => $conf, 'spent' => false];
};
$GLOBALS['OROLADO_FAKE_UTXO'] = function (string $chain, string $method, string $path, ?string $body) use (&$N) {
  $N['calls']++;
  $esp = $chain !== 'doge';
  if ($method === 'GET' && ($path === '/v1/fees/recommended')) return [200, json_encode(['halfHourFee' => $N['fee'][$chain]])];
  if ($method === 'GET' && $path === '') return [200, json_encode(['medium_fee_per_kb' => $N['fee'][$chain] * 1000])];
  if ($method === 'GET' && preg_match('#^/(?:address|addrs)/([A-Za-z0-9]+)(/utxo|/balance|\?unspentOnly.*)?$#', $path, $m)) {
    $list = $N['u'][$chain][$m[1]] ?? [];
    $rc = 0; $rw = 0; $bal = 0; $spentC = 0;
    $spentM = 0;
    foreach ($list as $u) { if ($u['conf']) { $rc += $u['value']; if (!$u['spent']) $bal += $u['value']; elseif ($u['spentConf'] ?? false) $spentC += $u['value']; else $spentM += $u['value']; } else $rw += $u['value']; }
    $sub = $m[2] ?? '';
    if ($esp && $sub === '') return [200, json_encode(['chain_stats' => ['funded_txo_sum' => $rc, 'spent_txo_sum' => $spentC], 'mempool_stats' => ['funded_txo_sum' => $rw, 'spent_txo_sum' => $spentM]])];
    if ($esp && $sub === '/utxo') return [200, json_encode(array_values(array_map(fn($u) => ['txid' => $u['txid'], 'vout' => $u['vout'], 'value' => $u['value'], 'status' => ['confirmed' => $u['conf']]], array_filter($list, fn($u) => !$u['spent']))))];
    if (!$esp && $sub === '/balance') return [200, json_encode(['total_received' => $rc, 'balance' => $bal + $spentM, 'unconfirmed_balance' => $rw - $spentM])];
    if (!$esp) return [200, json_encode(['txrefs' => array_values(array_map(fn($u) => ['tx_hash' => $u['txid'], 'tx_output_n' => $u['vout'], 'value' => $u['value'], 'confirmations' => $u['conf'] ? 3 : 0], array_filter($list, fn($u) => !$u['spent'])))])];
  }
  if ($method === 'POST') {
    $hex = $esp ? (string) $body : (string) (json_decode((string) $body, true)['tx'] ?? '');
    $raw = hex2bin($hex); $i = 4; $seg = false;
    if (substr($raw, 4, 2) === "\x00\x01") { $seg = true; $i = 6; }
    $nin = rv($raw, $i); $ins = [];
    for ($k = 0; $k < $nin; $k++) { $txid = bin2hex(strrev(rd($raw, $i, 32))); $vout = unpack('V', rd($raw, $i, 4))[1]; $sl = rv($raw, $i); rd($raw, $i, $sl); rd($raw, $i, 4); $ins[] = [$txid, $vout]; }
    $nout = rv($raw, $i); $outs = [];
    for ($k = 0; $k < $nout; $k++) { $v = unpack('P', rd($raw, $i, 8))[1]; $sl = rv($raw, $i); $outs[] = [$v, rd($raw, $i, $sl)]; }
    // Les pièces existent, ne sont pas dépensées, et appartiennent toutes à la même adresse.
    $from = null; $full = [];
    foreach ($ins as [$t, $v]) {
      $found = false;
      foreach ($N['u'][$chain] ?? [] as $ad => $list) foreach ($list as $j => $u) if ($u['txid'] === $t && $u['vout'] === $v && !$u['spent'] && $u['conf']) { $found = true; $from ??= $ad; if ($from !== $ad) $found = false; $full[] = ['txid' => $t, 'vout' => $v, 'value' => $u['value']]; }
      if (!$found) { $N['bad']++; return [400, 'bad-txns-inputs-missingorspent']; }
    }
    if (count($outs) !== 1 || $outs[0][0] > array_sum(array_column($full, 'value'))) { $N['bad']++; return [400, 'bad-txns-in-belowout']; }
    // Signature : seule la vraie clé de l'adresse redonne EXACTEMENT la même transaction.
    $okSig = false;
    foreach (glob(coffre_dir() . '/w_*.json') as $f) {
      $k = cevm_key_from_pem(coffre_dec((string) (coffre_json($f)['enc'] ?? ''))); if (!$k) continue;
      if (cutxo_addr_of($chain, $k['priv']) !== $from) continue;
      $re = cutxo_build($chain, $k['priv'], $full, $outs[0][1], $outs[0][0]);
      if ($re['hex'] === $hex) { $okSig = true; $txid = $re['txid']; }
    }
    if (!$okSig) { $N['bad']++; return [400, 'mandatory-script-verify-flag-failed']; }
    $N['mem'][] = ['chain' => $chain, 'from' => $from, 'ins' => $ins, 'out' => $outs[0], 'txid' => $txid];
    foreach ($N['u'][$chain][$from] as $j => $u) foreach ($ins as [$t, $v]) if ($u['txid'] === $t && $u['vout'] === $v) $N['u'][$chain][$from][$j]['spent'] = true;
    return $esp ? [200, $txid] : [201, json_encode(['tx' => ['hash' => $txid]])];
  }
  return [404, 'inconnu ' . $path];
};
/** « Un bloc passe » : tout ce qui attend est confirmé ; les envois arrivent sur le Trust Wallet. */
$mine = function () use (&$N) {
  foreach ($N['u'] as $ch => $by) foreach ($by as $ad => $list) foreach ($list as $j => $u) { $N['u'][$ch][$ad][$j]['conf'] = true; if ($u['spent']) $N['u'][$ch][$ad][$j]['spentConf'] = true; }
  foreach ($N['mem'] as $t) {
    $dest = ['btc' => D_BTC, 'ltc' => D_LTC, 'doge' => D_DOGE][$t['chain']];
    if ($t['out'][1] !== cutxo_script($t['chain'], $dest)) { $N['bad']++; continue; }
    $N['u'][$t['chain']][$dest][] = ['txid' => $t['txid'], 'vout' => 0, 'value' => $t['out'][0], 'conf' => true, 'spent' => false];
  }
  $N['mem'] = [];
};
$destBal = function (string $ch, string $d) use (&$N) { return array_sum(array_column($N["u"][$ch][$d] ?? [], "value")); };

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-0000-0000-0000-00000000000a'; $B = 'aaaaaaaa-0000-0000-0000-00000000000b';
$money = function (string $u) use (&$bank) { return ($bank['c'][$u] ?? 0) / 100; };
$db = blank_db();
foreach ([$A => 'a@t.com', $B => 'b@t.com'] as $id => $mail) { $db['users'][$id] = ['id' => $id, 'email' => $mail, 'role' => 'user', 'sbId' => $id, 'displayName' => $mail]; $db['vault'][$id] = ['demo' => 0, 'real' => 0]; }
$db['sessions']['tokA'] = ['userId' => $A, 'at' => date('c')]; $db['sessions']['tokB'] = ['userId' => $B, 'at' => date('c')];
save_db(orolado_data_file(), $db);
coffre_cfg_set(['on' => true, 'evm_on' => true, 'utxo_on' => false, 'min' => 20]);
$inv = fn($tok, $coin) => orolado_oxapay_invoice(['token' => $tok, 'coin' => $coin, 'amount' => 20, 'confirmed' => true]);
$scanAll = function () { foreach (array_keys(coffre_json(cutxo_index_file())) as $ad) coffre_json_rw(cutxo_index_file(), function (&$st) use ($ad) { $st[$ad]['seen'] = 0; }); cutxo_scan(100, 30); };

echo "0) Pas encore allumé pour tous : le joueur reste chez OxaPay pour BTC\n";
$i0 = $inv('tokA', 'btc');
check('joueur : BTC pas encore au coffre', empty($i0['own']), json_encode($i0));
coffre_cfg_set(['utxo_on' => true]);

echo "1) Une adresse par joueur et par réseau\n";
$ia = $inv('tokA', 'btc'); $il = $inv('tokA', 'ltc'); $id = $inv('tokA', 'doge'); $ib = $inv('tokB', 'btc');
check('A : adresse Bitcoin bc1q… valide', !empty($ia['own']) && str_starts_with($ia['address'], 'bc1q') && cutxo_addr_ok('btc', $ia['address']), json_encode($ia));
check('A : adresse Litecoin ltc1q… valide', !empty($il['own']) && str_starts_with($il['address'], 'ltc1q') && cutxo_addr_ok('ltc', $il['address']), json_encode($il));
check('A : adresse Dogecoin D… valide', !empty($id['own']) && $id['address'][0] === 'D' && cutxo_addr_ok('doge', $id['address']), json_encode($id));
check('B : une autre adresse Bitcoin', $ib['address'] !== $ia['address']);
check('rouvrir l’écran → même adresse', $inv('tokA', 'btc')['address'] === $ia['address']);
$a = $ia['address']; $al = $il['address']; $ad = $id['address'];

echo "2) Crédit seulement une fois confirmé, jamais deux fois\n";
$fund('btc', $a, 100000, false); // 0,001 BTC en attente
$s = orolado_oxapay_status(['token' => 'tokA', 'orderId' => $ia['orderId']]);
check('non confirmé → pas encore crédité, l’écran dit « en confirmation »', empty($s['paid']) && !empty($s['confirming']) && $money($A) == 0, json_encode($s));
$mine(); $scanAll();
check('confirmé : 0,001 BTC (60 000 $) → 60 $', abs($money($A) - 60) < 0.001, (string) $money($A));
$scanAll(); $scanAll();
check('rondes suivantes → toujours 60 $', abs($money($A) - 60) < 0.001);
$fund('ltc', $al, 25000000); $scanAll(); // 0,25 LTC = 20 $
check('0,25 LTC (80 $) → +20 $', abs($money($A) - 80) < 0.001, (string) $money($A));
$fund('doge', $ad, 10000000000); $scanAll(); // 100 DOGE = 20 $
check('100 DOGE (0,20 $) → +20 $', abs($money($A) - 100) < 0.001, (string) $money($A));
$fund('btc', $ib['address'], 1000); $scanAll(); // 0,6 $
check('poussière (0,60 $) → rien', $money($B) == 0);

echo "3) Envoi de tout vers le Trust Wallet (frais pris sur le montant)\n";
$fund('btc', $a, 50000); $scanAll(); // +30 $ → 90 $ sur l'adresse Bitcoin
check('2e dépôt BTC (0,0005) → +30 $', abs($money($A) - 130) < 0.001, (string) $money($A));
cutxo_sweep(false, 10);
check('seuil atteint : Bitcoin parti (une seule transaction, 2 pièces)', count($N['mem']) >= 1 && $N['bad'] === 0, (string) json_encode(array_column($N["mem"], "txid")));
$scanAll(); // relu AVANT la confirmation de l'envoi
$v = coffre_json(cutxo_index_file());
check('admin : « sur l’adresse maintenant » = 0 juste après l’envoi, « reçu » garde 90 $', (int) $v[$a]['bal'] === 0 && abs($v[$a]['got'] - 90) < 0.01, json_encode($v[$a]));
$mine(); $scanAll();
$sent = $destBal('btc', D_BTC); $fee = 150000 - $sent;
check('Trust Wallet Bitcoin reçoit 0,0015 BTC moins de petits frais', $sent > 149000 && $fee > 0 && $fee <= 5 * 200, "reçu $sent, frais $fee");
check('après l’envoi : crédit inchangé (130 $)', abs($money($A) - 130) < 0.001, (string) $money($A));
cutxo_sweep(true, 10); $mine(); // force : LTC et DOGE partent
check('bouton « Envoyer maintenant » : Litecoin et Dogecoin partis aussi', $destBal('ltc', D_LTC) > 24000000 && $destBal('doge', D_DOGE) > 9990000000, $destBal('ltc', D_LTC) . ' / ' . $destBal('doge', D_DOGE));
$scanAll();
check('toujours 130 $ crédités', abs($money($A) - 130) < 0.001, (string) $money($A));

echo "4) Nouveau dépôt après un envoi, frais trop chers\n";
$fund('btc', $a, 20000); $mine(); $scanAll(); // 12 $
check('0,0002 BTC de plus → +12 $ seulement', abs($money($A) - 142) < 0.001, (string) $money($A));
coffre_json_rw(cutxo_index_file(), function (&$st) use ($a) { $st[$a]['swAt'] = 0; });
$N['fee']['btc'] = 300; $nMem = count($N['mem']);
cutxo_sweep(true, 10);
check('frais du réseau trop chers (> 50 % même avec le bouton) → rien ne part, l’argent attend', count($N['mem']) === $nMem && count(array_filter(coffre_journal(20), fn($j) => $j['k'] === 'attente')) >= 1);
$N['fee']['btc'] = 5; cutxo_sweep(true, 10); $mine(); $scanAll();
check('frais normaux → parti ; crédit toujours 142 $', abs($money($A) - 142) < 0.001 && $destBal('btc', D_BTC) > 165000, $money($A) . ' / ' . $destBal('btc', D_BTC));
check('aucune transaction refusée par le faux réseau (signatures, pièces)', $N['bad'] === 0, (string) $N['bad']);

echo "5) Liste « Recharger » quand OxaPay est arrêté\n";
coffre_cfg_set(['oxapay_off' => true]);
$only = coffre_only_coins();
check('BTC, LTC, DOGE dans la liste', in_array('btc', $only, true) && in_array('ltc', $only, true) && in_array('doge', $only, true), json_encode($only));
$x = $inv('tokB', 'xrp');
check('crypto pas encore branchée (XRP) → refusée, jamais une adresse OxaPay', ($x['code'] ?? '') === 'coin_off', json_encode($x));
$av = cutxo_admin_view();
check('vue admin : 3 réseaux branchés, adresses listées', count(array_filter($av['nets'], fn($n) => $n['ready'])) === 3 && count($av['addrs']) >= 4);

echo "\nRésultat : $pass OK, $fail échec(s)\n";
exec('rm -rf ' . escapeshellarg($tmp));
exit($fail ? 1 : 0);
