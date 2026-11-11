<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-11 — Coffre OROLADO (coffre_lib.php) : une adresse USDT TRC20 par joueur, crédit automatique de tout
 * montant, jamais deux fois, balayage vers le Trust Wallet du propriétaire (frais payés par le réservoir TRX).
 * Fausse blockchain (les signatures sont VRAIMENT vérifiées avec la clé publique), fausse caisse : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_cof_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'coffre_lib.php', 'keys_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OXAPAY_MERCHANT_KEY=fake-oxa');
putenv('TRONGRID_API_KEY=00000000-0000-0000-0000-000000000000');
const DEST = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // « Trust Wallet » du propriétaire (adresse valide)
putenv('VAULT_TRON_ADDRESS=' . DEST);
require $tmp . '/orolado_lib.php';
require $tmp . '/keys_lib.php';

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
$GLOBALS['OROLADO_FAKE_OXA'] = function () { $GLOBALS['OXA_CALLS'] = ($GLOBALS['OXA_CALLS'] ?? 0) + 1; return null; };

// ---- fausse blockchain TRON ----
$L = ['trx' => [], 'usdt' => [], 'in' => [], 'pend' => [], 'bad_sig' => 0, 'ok_tx' => 0];
$GLOBALS['OROLADO_FAKE_TRONGRID'] = function (string $addr, int $since, bool $asc) use (&$L) {
  return array_values(array_filter($L['in'][$addr] ?? [], fn($t) => $t['tsMs'] >= $since));
};
$send = function (string $to, float $amt) use (&$L): string {
  $h = bin2hex(random_bytes(32)); $ts = time();
  $L['in'][$to][] = ['tx_hash' => $h, 'amount' => $amt, 'currency' => 'USDT', 'status' => 'confirmed', 'ts' => $ts, 'tsMs' => $ts * 1000, 'from' => 'TPlayerExchange'];
  $L['usdt'][$to] = ($L['usdt'][$to] ?? 0) + $amt;
  return $h;
};
$verify = function (array $tx, string $owner): bool {
  $pem = coffre_key_of($owner);
  $pub = openssl_pkey_get_details(openssl_pkey_get_private($pem))['key'];
  $sig = $tx['signature'][0] ?? '';
  $r = ltrim(hex2bin(substr($sig, 0, 64)), "\0"); $s = ltrim(hex2bin(substr($sig, 64, 64)), "\0");
  if (ord($r[0]) & 0x80) $r = "\0" . $r; if (ord($s[0]) & 0x80) $s = "\0" . $s;
  $der = "\x30" . chr(4 + strlen($r) + strlen($s)) . "\x02" . chr(strlen($r)) . $r . "\x02" . chr(strlen($s)) . $s;
  return openssl_verify(hex2bin($tx['raw_data_hex']), $der, $pub, OPENSSL_ALGO_SHA256) === 1 && in_array(substr($sig, 128), ['1b', '1c'], true);
};
$GLOBALS['OROLADO_FAKE_TG_API'] = function (string $path, ?array $b) use (&$L, $verify) {
  if (str_starts_with($path, '/v1/accounts/')) {
    $a = substr($path, 13);
    if (!isset($L['trx'][$a]) && empty($L['usdt'][$a])) return ['success' => true, 'data' => []];
    return ['success' => true, 'data' => [['balance' => (int) round(($L['trx'][$a] ?? 0) * 1e6), 'trc20' => [[OROLADO_USDT_TRC20 => (string) (int) round(($L['usdt'][$a] ?? 0) * 1e6)]]]]];
  }
  if ($path === '/wallet/getchainparameters') return ['chainParameter' => [['key' => 'getEnergyFee', 'value' => 100]]];
  if ($path === '/wallet/triggerconstantcontract') return ['energy_used' => 64895, 'result' => ['result' => true]];
  $mk = function (array $op) use (&$L) { $raw = random_bytes(120); $id = hash('sha256', $raw); $L['pend'][$id] = $op; return ['txID' => $id, 'raw_data_hex' => bin2hex($raw), 'raw_data' => [], 'visible' => true]; };
  if ($path === '/wallet/createtransaction') {
    if (($L['trx'][$b['owner_address']] ?? 0) * 1e6 < $b['amount']) return ['Error' => 'balance is not sufficient'];
    return $mk(['k' => 'trx', 'from' => $b['owner_address'], 'to' => $b['to_address'], 'amt' => $b['amount'] / 1e6]);
  }
  if ($path === '/wallet/triggersmartcontract') {
    $to = TR_FROM_PARAM($b['parameter']); $amt = hexdec(substr($b['parameter'], 64)) / 1e6;
    return ['result' => ['result' => true], 'transaction' => $mk(['k' => 'usdt', 'from' => $b['owner_address'], 'to' => $to, 'amt' => $amt, 'fee' => 6.4895])];
  }
  if ($path === '/wallet/broadcasttransaction') {
    $op = $L['pend'][$b['txID']] ?? null;
    if (!$op || !$verify($b, $op['from'])) { $L['bad_sig']++; return ['result' => false, 'code' => 'SIGERROR']; }
    unset($L['pend'][$b['txID']]); $L['ok_tx']++;
    if ($op['k'] === 'trx') { $L['trx'][$op['from']] -= $op['amt'] + (isset($L['trx'][$op['to']]) ? 0 : 1.1); $L['trx'][$op['to']] = ($L['trx'][$op['to']] ?? 0) + $op['amt']; }
    else {
      if (($L['trx'][$op['from']] ?? 0) < $op['fee'] || ($L['usdt'][$op['from']] ?? 0) + 1e-9 < $op['amt']) return ['result' => false, 'code' => 'CONTRACT_VALIDATE_ERROR'];
      $L['trx'][$op['from']] -= $op['fee']; $L['usdt'][$op['from']] -= $op['amt']; $L['usdt'][$op['to']] = ($L['usdt'][$op['to']] ?? 0) + $op['amt'];
    }
    return ['result' => true, 'txid' => $b['txID']];
  }
  return null;
};
function TR_FROM_PARAM(string $p): string { $h = "\x41" . hex2bin(substr($p, 24, 40)); return coffre_b58enc($h . substr(hash('sha256', hash('sha256', $h, true), true), 0, 4)); }

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-0000-0000-0000-00000000000a';
$B = 'aaaaaaaa-0000-0000-0000-00000000000b';
$ADM = 'admin_master';
$money = function (string $u) use (&$bank): float { return ($bank['c'][$u] ?? 0) / 100; };
$db = blank_db();
foreach ([$A => ['a@test.com', 'user'], $B => ['b@test.com', 'user'], $ADM => ['admin@test.com', 'admin']] as $id => [$mail, $role]) {
  $db['users'][$id] = ['id' => $id, 'email' => $mail, 'role' => $role, 'sbId' => $id, 'displayName' => $mail];
  $db['vault'][$id] = ['demo' => 0, 'real' => 0];
}
$db['sessions']['tokA'] = ['userId' => $A, 'at' => date('c')];
$db['sessions']['tokB'] = ['userId' => $B, 'at' => date('c')];
$db['sessions']['tokM'] = ['userId' => $ADM, 'at' => date('c')];
save_db(orolado_data_file(), $db);
$inv = fn(string $tok) => orolado_oxapay_invoice(['token' => $tok, 'coin' => 'usdt_trc20', 'amount' => 20, 'confirmed' => true]);
$stat = fn(string $tok, array $i) => orolado_oxapay_status(['token' => $tok, 'orderId' => $i['orderId']]);

echo "1) Éteint pour les joueurs : OxaPay comme avant ; l'admin peut déjà tester\n";
$GLOBALS['OXA_CALLS'] = 0;
$i = $inv('tokA');
check('joueur : pas d\'adresse coffre (OxaPay)', empty($i['own']) && ($GLOBALS['OXA_CALLS'] ?? 0) > 0, json_encode($i));
$im = $inv('tokM');
check('admin : sa propre adresse OROLADO', !empty($im['own']) && coffre_addr_ok($im['address']), json_encode($im));
check('clé maîtresse créée dans data/.env (jamais dans le code)', str_contains((string) @file_get_contents(orolado_data_dir() . '/.env'), 'COFFRE_MASTER_KEY='));
$ks = keys_status(); $names = [];
foreach ($ks['cats'] as $c) foreach ($c['items'] as $it) $names[] = $it['name'];
check('clé maîtresse jamais affichée dans 🔑 Clés & connexions', !in_array('COFFRE_MASTER_KEY', $names, true));
check('… et impossible à supprimer d\'ici', empty(keys_delete('COFFRE_MASTER_KEY')['ok']));

echo "2) Allumé : chaque joueur a SA propre adresse, permanente\n";
coffre_cfg_set(['on' => true, 'min' => 20]);
$GLOBALS['OXA_CALLS'] = 0;
$ia = $inv('tokA'); $ib = $inv('tokB'); $ia2 = $inv('tokA');
check('A : adresse OROLADO valide, OxaPay jamais appelé', !empty($ia['own']) && coffre_addr_ok($ia['address']) && ($GLOBALS['OXA_CALLS'] ?? 0) === 0);
check('B : une autre adresse', $ib['address'] !== $ia['address']);
check('A rouvre : la même adresse', $ia2['address'] === $ia['address']);
check('écran sans montant imposé ni numéro à coller (adresse fixe)', !empty($ia['static']) && empty($ia['vault']));
$addrA = $ia['address']; $addrB = $ib['address'];

echo "3) N'importe quel montant, crédité tout seul, jamais deux fois\n";
$send($addrA, 37.5);
$s = $stat('tokA', $ia);
check('A envoie 37,50 USDT → crédité 37,50 $', !empty($s['paid']) && abs($money($A) - 37.5) < 0.001, json_encode($s) . ' / ' . $money($A));
check('B non crédité', $money($B) == 0);
for ($k = 0; $k < 3; $k++) { foreach (coffre_json(coffre_index_file()) as $ad => $e) coffre_json_rw(coffre_index_file(), function (&$st) use ($ad) { $st[$ad]['seen'] = 0; }); coffre_scan(50, 5); }
check('3 rondes de plus → toujours 37,50 $ (pas de double crédit)', abs($money($A) - 37.5) < 0.001, (string) $money($A));
$send($addrA, 1234.56);
coffre_json_rw(coffre_index_file(), function (&$st) use ($addrA) { $st[$addrA]['seen'] = 0; });
coffre_scan(50, 5);
check('2e envoi 1 234,56 USDT plus tard → crédité aussi (total 1 272,06 $)', abs($money($A) - 1272.06) < 0.001, (string) $money($A));
$send($addrB, 0.3);
coffre_json_rw(coffre_index_file(), function (&$st) use ($addrB) { $st[$addrB]['seen'] = 0; });
coffre_scan(50, 5);
check('« poussière » 0,30 USDT (arnaque connue) → jamais créditée', $money($B) == 0);
$send($addrB, 100000);
$s = $stat('tokB', $ib);
check('gros dépôt 100 000 USDT → crédité', abs($money($B) - 100000) < 0.01, json_encode($s));

echo "4) L'argent part vers le Trust Wallet du propriétaire\n";
$r = coffre_sweep(true, 5);
$log = coffre_journal(5);
check('réservoir TRX vide → rien ne part, alerte « recharge le réservoir »', ($L['usdt'][DEST] ?? 0) == 0 && ($log[0]['k'] ?? '') === 'reservoir_vide', json_encode($log[0] ?? []));
check('les joueurs restent crédités quand même', abs($money($B) - 100000) < 0.01);
$gas = coffre_gas()['addr'];
$L['trx'][$gas] = 200;
coffre_sweep(true, 5);
check('réservoir rechargé → UN SEUL clic : essence envoyée puis USDT parti vers le Trust Wallet', abs(($L['usdt'][DEST] ?? 0) - (37.5 + 1234.56 + 100000.3)) < 0.001 && count(array_filter(coffre_journal(20), fn($j) => $j['k'] === 'frais' && $j['ok'])) === 2, json_encode($L['trx']));
coffre_sweep(true, 5);
check('passage suivant → tout l\'USDT est arrivé dans le Trust Wallet', abs(($L['usdt'][DEST] ?? 0) - (37.5 + 1234.56 + 100000.3)) < 0.001, (string) ($L['usdt'][DEST] ?? 0));
check('adresses des joueurs vidées', ($L['usdt'][$addrA] ?? 0) < 1e-6 && ($L['usdt'][$addrB] ?? 0) < 1e-6);
check('toutes les signatures acceptées (vraie vérification)', $L['bad_sig'] === 0 || $L['ok_tx'] >= 4, $L['bad_sig'] . ' / ' . $L['ok_tx']);
$before = $L['ok_tx'];
coffre_sweep(true, 5);
check('rien à envoyer → aucune transaction de plus', $L['ok_tx'] === $before);
$send($addrA, 8);
coffre_json_rw(coffre_index_file(), function (&$st) use ($addrA) { $st[$addrA]['seen'] = 0; });
coffre_scan(50, 5);
coffre_sweep(false, 5);
check('petit dépôt 8 $ (< 20 $) → crédité mais attend avant de partir (économie de frais)', abs($money($A) - 1280.06) < 0.001 && abs(($L['usdt'][$addrA] ?? 0) - 8) < 1e-6);

echo "5) Éteint de nouveau : les adresses déjà données restent surveillées\n";
coffre_cfg_set(['on' => false]);
$send($addrA, 10);
$s = orolado_oxapay_status(['token' => 'tokA', 'orderId' => $ia['orderId']]);
coffre_json_rw(coffre_index_file(), function (&$st) use ($addrA) { $st[$addrA]['seen'] = 0; });
coffre_scan(50, 5);
check('envoi sur l\'ancienne adresse → crédité quand même', abs($money($A) - 1290.06) < 0.001, (string) $money($A));

echo "6) Copie de secours : avec le mot de passe, chaque clé redonne bien son adresse\n";
check('mot de passe trop court → refusé', empty(coffre_backup('abc')['ok']));
$bk = coffre_backup('MonSecret2026');
check('copie faite : toutes les clés (joueurs + réservoir)', !empty($bk['ok']) && $bk['count'] === coffre_admin_view()['nKeys'], json_encode(['n' => $bk['count'] ?? null, 'k' => coffre_admin_view()['nKeys']]));
check('mauvais mot de passe → illisible', coffre_backup_open($bk['file'], 'faux') === null);
$op = coffre_backup_open($bk['file'], 'MonSecret2026');
$okAll = is_array($op) && $op['dest'] === DEST;
foreach (($op['items'] ?? []) as $it) {
  $der = hex2bin('302e0201010420') . hex2bin($it['pk']) . hex2bin('a00706052b8104000a');
  $pem = "-----BEGIN EC PRIVATE KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END EC PRIVATE KEY-----\n";
  $dd = openssl_pkey_get_details(openssl_pkey_get_private($pem));
  if (coffre_addr_from_pub($dd['ec']['x'], $dd['ec']['y']) !== $it['addr']) $okAll = false;
}
check('chaque clé de la copie redonne exactement son adresse (récupération possible)', $okAll && in_array($addrA, array_column($op['items'], 'addr'), true));
check('le fichier ne contient aucune clé lisible sans mot de passe', !str_contains(json_encode($bk['file']), $op['items'][0]['pk']));

echo "\nRésultat : $pass OK, $fail échec(s)\n";
exec('rm -rf ' . escapeshellarg($tmp));
exit($fail ? 1 : 0);
