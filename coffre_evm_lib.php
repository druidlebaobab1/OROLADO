<?php
/**
 * 2026-11-11 — COFFRE OROLADO, famille ETHEREUM (Ethereum, BNB Smart Chain, Polygon, Base, Arbitrum).
 *
 * Même principe que TRON (coffre_lib.php) :
 *  - chaque joueur a UNE adresse 0x… (la même sur les 5 réseaux), tirée de SA clé du coffre (même clé que TRON) ;
 *  - le site lit les soldes (USDT, USDC et la monnaie du réseau : ETH, BNB, POL) et crédite ce qui est NOUVEAU ;
 *  - puis il envoie tout vers l'adresse Ethereum du Trust Wallet du propriétaire (VAULT_EVM_ADDRESS), l'essence
 *    étant prise dans le réservoir (même réservoir que TRON, son adresse 0x… sur chaque réseau).
 *
 * Crédit SANS double compte, sans dépendre d'un service d'historique : pour chaque adresse / réseau / pièce, un
 * « grand livre » exact (en plus petites unités, nombres hexadécimaux) :
 *    à créditer = solde + sorti (confirmé) [+ frais payés, pour la monnaie du réseau] − essence reçue − déjà crédité
 * Sorties et frais comptés seulement une fois CONFIRMÉS ; essence reçue comptée dès l'envoi (prudence : jamais
 * créditer au joueur l'essence du site). Tant qu'une transaction du site est en route sur ce réseau : on attend.
 * Chaque crédit porte un numéro unique (adresse + total crédité) : rejoué 100 fois, il n'est payé qu'une fois.
 */

require_once __DIR__ . '/coffre_ec.php';

function cevm_chains(): array {
  return [
    'eth' => ['id' => 1, 'name' => 'Ethereum', 'native' => 'ETH', 'gw' => 'ethereum-mainnet', 'pub' => 'https://ethereum-rpc.publicnode.com', 'min' => 100.0, 'tok_gas' => 70000,
      'tokens' => ['USDT' => ['0xdac17f958d2ee523a2206206994597c13d831ec7', 6], 'USDC' => ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6],
        // 2026-11-11 : + DAI, LINK, UNI, PEPE, AAVE (contrats et décimales vérifiés sur le réseau)
        'DAI' => ['0x6b175474e89094c44da98b954eedeac495271d0f', 18], 'LINK' => ['0x514910771af9ca656af840dff83e8264ecf986ca', 18], 'UNI' => ['0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', 18],
        'PEPE' => ['0x6982508145454ce325ddbe47a25d4ec3d2311933', 18], 'AAVE' => ['0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', 18]]],
    'bsc' => ['id' => 56, 'name' => 'BNB Chain', 'native' => 'BNB', 'gw' => 'bsc-mainnet', 'pub' => 'https://bsc-rpc.publicnode.com', 'min' => 20.0, 'tok_gas' => 70000,
      'tokens' => ['USDT' => ['0x55d398326f99059ff775485246999027b3197955', 18], 'USDC' => ['0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', 18],
        'SHIB' => ['0x2859e4544c4bb03966803b044a93563bd2d0dd4d', 18], 'CAKE' => ['0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', 18]]],
    'polygon' => ['id' => 137, 'name' => 'Polygon', 'native' => 'POL', 'gw' => 'polygon-mainnet', 'pub' => 'https://polygon-bor-rpc.publicnode.com', 'min' => 20.0, 'tok_gas' => 90000,
      'tokens' => ['USDT' => ['0xc2132d05d31c914a87c6611c10748aeb04b58e8f', 6], 'USDC' => ['0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', 6]]],
    'base' => ['id' => 8453, 'name' => 'Base', 'native' => 'ETH', 'gw' => 'base-mainnet', 'pub' => 'https://base-rpc.publicnode.com', 'min' => 20.0, 'tok_gas' => 90000,
      'tokens' => ['USDC' => ['0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', 6]]],
    'arb' => ['id' => 42161, 'name' => 'Arbitrum', 'native' => 'ETH', 'gw' => 'arb-one-mainnet', 'pub' => 'https://arbitrum-one-rpc.publicnode.com', 'min' => 20.0, 'tok_gas' => 1000000,
      'tokens' => ['USDT' => ['0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', 6], 'USDC' => ['0xaf88d065e77c8cc2239327c5edb3a432268e5831', 6], 'ARB' => ['0x912ce59144191c1204e64559fe8253a0e49e6548', 18]]],
    'op' => ['id' => 10, 'name' => 'Optimism', 'native' => 'ETH', 'gw' => 'optimism-mainnet', 'pub' => 'https://optimism-rpc.publicnode.com', 'min' => 20.0, 'tok_gas' => 90000,
      'tokens' => ['USDT' => ['0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', 6], 'USDC' => ['0x0b2c639c533813f4aa9d7837caf62653d097ff85', 6], 'OP' => ['0x4200000000000000000000000000000000000042', 18]]],
    'avax' => ['id' => 43114, 'name' => 'Avalanche', 'native' => 'AVAX', 'gw' => 'avax-mainnet', 'pub' => 'https://avalanche-c-chain-rpc.publicnode.com', 'min' => 20.0, 'tok_gas' => 90000,
      'tokens' => ['USDT' => ['0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', 6], 'USDC' => ['0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', 6]]],
  ];
}

/** Pièce du site (écran de dépôt) → réseau surveillé en priorité. */
function cevm_coin_chain(string $coin): string {
  return ['usdt_erc20' => 'eth', 'usdc' => 'eth', 'eth' => 'eth', 'usdt_bep20' => 'bsc', 'bnb' => 'bsc', 'pol' => 'polygon',
    'usdt_polygon' => 'polygon', 'usdc_polygon' => 'polygon', 'usdc_base' => 'base', 'eth_base' => 'base', 'usdt_arb' => 'arb', 'usdc_arb' => 'arb', 'eth_arb' => 'arb',
    'dai' => 'eth', 'link' => 'eth', 'uni' => 'eth', 'pepe' => 'eth', 'aave' => 'eth', 'shib' => 'bsc', 'cake' => 'bsc', 'arb' => 'arb', 'op' => 'op', 'avax' => 'avax'][$coin] ?? '';
}

/* ===================== Outils ===================== */

function cevm_hex_from_wei_bn(array $bn): string { return '0x' . cec_to_hex($bn, 0); }
function cevm_bn(string $hex): array { return cec_from_hex(preg_replace('/^0x/i', '', $hex) ?: '0'); }
function cevm_float(array $bn, int $dec): float {
  $v = 0.0;
  for ($i = count($bn) - 1; $i >= 0; $i--) $v = $v * 65536 + $bn[$i];
  return $v / (10 ** $dec);
}
function cevm_pos_sub(array $a, array $b): array { return cec_cmp($a, $b) > 0 ? cec_sub($a, $b) : [0]; }

/** Adresse 0x avec majuscules de contrôle (EIP-55). */
function cevm_checksum(string $addr): string {
  $a = strtolower(preg_replace('/^0x/i', '', $addr));
  $h = bin2hex(coffre_keccak256($a));
  $o = '0x';
  for ($i = 0; $i < 40; $i++) $o .= (hexdec($h[$i]) >= 8) ? strtoupper($a[$i]) : $a[$i];
  return $o;
}

function cevm_addr_ok(string $a): bool {
  if (!preg_match('/^0x[0-9a-fA-F]{40}$/', $a)) return false;
  $body = substr($a, 2);
  if (strtolower($body) === $body || strtoupper($body) === $body) return true;
  return cevm_checksum($a) === $a;
}

/** Clé privée (32 octets) + adresse 0x à partir d'une clé du coffre (PEM). */
function cevm_key_from_pem(string $pem): ?array {
  $k = $pem !== '' ? openssl_pkey_get_private($pem) : false;
  $d = $k ? openssl_pkey_get_details($k) : null;
  if (!$d || empty($d['ec']['d'])) return null;
  $x = str_pad((string) $d['ec']['x'], 32, "\0", STR_PAD_LEFT); $y = str_pad((string) $d['ec']['y'], 32, "\0", STR_PAD_LEFT);
  return ['priv' => str_pad((string) $d['ec']['d'], 32, "\0", STR_PAD_LEFT), 'addr' => '0x' . bin2hex(substr(coffre_keccak256($x . $y), 12))];
}

function cevm_rlp_bytes(string $b): string {
  $l = strlen($b);
  if ($l === 1 && ord($b) < 0x80) return $b;
  if ($l <= 55) return chr(0x80 + $l) . $b;
  $lb = ltrim(pack('J', $l), "\0");
  return chr(0xb7 + strlen($lb)) . $lb . $b;
}
function cevm_rlp_list(array $items): string {
  $p = implode('', $items); $l = strlen($p);
  if ($l <= 55) return chr(0xc0 + $l) . $p;
  $lb = ltrim(pack('J', $l), "\0");
  return chr(0xf7 + strlen($lb)) . $lb . $p;
}
/** Entier (hex) → octets minimaux (0 → chaîne vide), puis RLP. */
function cevm_rlp_int(string $hex): string {
  $h = ltrim(strtolower(preg_replace('/^0x/i', '', $hex)), '0');
  if ($h === '') return cevm_rlp_bytes('');
  if (strlen($h) % 2) $h = '0' . $h;
  return cevm_rlp_bytes(hex2bin($h));
}

/** Transaction classique signée (EIP-155). Retour : '0x…' prêt à diffuser. */
function cevm_sign_tx(int $chainId, string $priv, string $nonceHex, string $gasPriceHex, int $gas, string $to, string $valueHex, string $dataHex): string {
  $to = hex2bin(strtolower(substr($to, 2)));
  $data = $dataHex === '' ? '' : hex2bin(preg_replace('/^0x/', '', $dataHex));
  $base = [cevm_rlp_int($nonceHex), cevm_rlp_int($gasPriceHex), cevm_rlp_int(dechex($gas)), cevm_rlp_bytes($to), cevm_rlp_int($valueHex), cevm_rlp_bytes($data)];
  $digest = coffre_keccak256(cevm_rlp_list(array_merge($base, [cevm_rlp_int(dechex($chainId)), cevm_rlp_bytes(''), cevm_rlp_bytes('')])));
  $sig = cec_sign($digest, $priv);
  $v = $sig['v'] + $chainId * 2 + 35;
  return '0x' . bin2hex(cevm_rlp_list(array_merge($base, [cevm_rlp_int(dechex($v)), cevm_rlp_int(bin2hex($sig['r'])), cevm_rlp_int(bin2hex($sig['s']))])));
}

/* ===================== Réseau (Tatum, sinon nœud public) ===================== */

function cevm_rpc_batch(string $chain, array $calls): ?array {
  if (!$calls) return [];
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_EVM']) && is_callable($GLOBALS['OROLADO_FAKE_EVM'])) {
    $out = [];
    foreach ($calls as $i => [$m, $p]) $out[$i] = ($GLOBALS['OROLADO_FAKE_EVM'])($chain, $m, $p);
    return $out;
  }
  $c = cevm_chains()[$chain] ?? null;
  if (!$c || !function_exists('curl_init')) return null;
  orolado_load_env();
  $key = trim((string) (getenv('TATUM_API_KEY') ?: ($_ENV['TATUM_API_KEY'] ?? '')));
  $body = [];
  foreach (array_values($calls) as $i => [$m, $p]) $body[] = ['jsonrpc' => '2.0', 'id' => $i, 'method' => $m, 'params' => $p];
  $urls = $key !== '' ? [['https://' . $c['gw'] . '.gateway.tatum.io/', ['x-api-key: ' . $key]], [$c['pub'], []]] : [[$c['pub'], []], ['https://' . $c['gw'] . '.gateway.tatum.io/', []]];
  foreach ($urls as [$url, $hdr]) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => json_encode(count($body) === 1 ? $body[0] : $body), CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $hdr)]);
    $raw = curl_exec($ch); $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    if ($code !== 200 || !is_string($raw)) continue;
    $j = json_decode($raw, true);
    if (!is_array($j)) continue;
    if (isset($j['jsonrpc'])) $j = [$j];
    $res = []; $bad = false;
    foreach ($j as $r) { if (!is_array($r) || !array_key_exists('id', $r)) { $bad = true; break; } $res[(int) $r['id']] = $r; }
    if ($bad || count($res) !== count($body)) continue;
    $out = []; $keys = array_keys($calls);
    foreach ($keys as $i => $k) $out[$k] = $res[$i];
    return $out;
  }
  return null;
}

function cevm_rpc(string $chain, string $method, array $params) {
  $r = cevm_rpc_batch($chain, [[$method, $params]]);
  return is_array($r) ? ($r[0] ?? null) : null;
}

/* ===================== Adresses ===================== */

function cevm_dest(): string {
  orolado_load_env();
  $a = trim((string) (getenv('VAULT_EVM_ADDRESS') ?: ($_ENV['VAULT_EVM_ADDRESS'] ?? '')));
  return cevm_addr_ok($a) ? strtolower($a) : '';
}

function cevm_ready(): bool { return cevm_dest() !== '' && function_exists('coffre_master'); }

function cevm_on_for(array $me): bool {
  if (!cevm_ready()) return false;
  if (!empty(coffre_cfg()['evm_on']) || !empty(coffre_cfg()['oxapay_off'])) return true; // allumé pour tous (séparément de TRON, ou OxaPay arrêté)
  $role = strtolower((string) ($me['role'] ?? ''));
  return in_array($role, ['admin', 'owner', 'superadmin'], true) || (string) ($me['id'] ?? '') === 'admin_master' || (function_exists('orolado_is_admin_user') && orolado_is_admin_user($me));
}

function cevm_index_file(): string { return coffre_dir() . '/evm_index.json'; }
function cevm_ledger_file(string $uid): string { return coffre_dir() . '/l_' . sha1('coffre-evm|' . $uid) . '.json'; }

/** Adresse 0x du joueur (même clé que son adresse TRON). */
function cevm_addr_for(string $uid): string {
  coffre_addr_for($uid); // crée la clé si besoin
  $w = coffre_json(coffre_user_file($uid));
  if (!empty($w['evm'])) $evm = (string) $w['evm'];
  else {
    $k = cevm_key_from_pem(coffre_dec((string) ($w['enc'] ?? '')));
    if (!$k) throw new RuntimeException('clé illisible');
    $evm = $k['addr'];
    coffre_json_rw(coffre_user_file($uid), static function (&$st) use ($evm) { $st['evm'] = $evm; });
  }
  coffre_json_rw(cevm_index_file(), static function (&$st) use ($evm, $uid) {
    if (!isset($st[$evm])) $st[$evm] = ['u' => $uid, 'at' => time(), 'open' => time(), 'hint' => '', 'seen' => []];
  });
  return $evm;
}

/** Clé privée d'une adresse 0x (joueur ou réservoir). */
function cevm_priv_of(string $addr): string {
  $addr = strtolower($addr);
  $g = coffre_gas();
  $gk = cevm_key_from_pem(coffre_dec((string) ($g['enc'] ?? '')));
  if ($gk && $gk['addr'] === $addr) return $gk['priv'];
  $uid = (string) (coffre_json(cevm_index_file())[$addr]['u'] ?? '');
  if ($uid === '') return '';
  $k = cevm_key_from_pem(coffre_dec((string) (coffre_json(coffre_user_file($uid))['enc'] ?? '')));
  return ($k && $k['addr'] === $addr) ? $k['priv'] : '';
}

function cevm_gas_addr(): string {
  $k = cevm_key_from_pem(coffre_dec((string) (coffre_gas()['enc'] ?? '')));
  return $k ? $k['addr'] : '';
}

function cevm_parent_id(string $uid): string { return 'own_' . preg_replace('/[^a-zA-Z0-9]/', '', $uid) . '_evm'; }

/** Écran de dépôt (USDT ERC20/BEP20, USDC, ETH, BNB, POL…) : l'adresse 0x permanente du joueur. */
function cevm_invoice(array $me, string $coin, float $amount): array {
  $uid = (string) ($me['id'] ?? '');
  $chain = cevm_coin_chain($coin);
  try { $addr = cevm_addr_for($uid); } catch (Throwable $e) { return ['ok' => false, 'server' => true, 'reason' => 'Réessayez dans un instant', 'code' => 'coffre']; }
  $pid = cevm_parent_id($uid); $now = microtime(true);
  with_db_lock(function ($box) use ($pid, $uid, $addr, $now, $chain) {
    foreach (($box->db['deposits'] ?? []) as $i => $d) {
      if (is_array($d) && (string) ($d['id'] ?? '') === $pid) { $box->db['deposits'][$i]['openedAt'] = $now; $box->db['deposits'][$i]['hint'] = $chain; return ['ok' => true]; }
    }
    $box->db['deposits'][] = ['id' => $pid, 'ref' => $pid, 'userId' => $uid, 'operator' => 'coffre', 'kind' => 'own', 'fam' => 'evm', 'hint' => $chain,
      'network' => 'EVM', 'coin' => 'evm', 'status' => 'STATIC', 'amount' => 0, 'currency' => 'USD', 'address' => $addr, 'openedAt' => $now, 'at' => date('c')];
    return ['ok' => true];
  });
  coffre_json_rw(cevm_index_file(), static function (&$st) use ($addr, $chain) { if (isset($st[$addr])) { $st[$addr]['open'] = time(); $st[$addr]['hint'] = $chain; } });
  $meta = function_exists('orolado_oxapay_coins') ? (orolado_oxapay_coins()[$coin] ?? []) : [];
  return ['ok' => true, 'server' => true, 'orderId' => $pid, 'trackId' => '', 'address' => cevm_checksum($addr), 'amount' => orolado_money($amount), 'payAmount' => orolado_money($amount),
    'payCurrency' => (string) ($meta['pay'] ?? 'USDT'), 'network' => (string) ($meta['netLabel'] ?? (cevm_chains()[$chain]['name'] ?? 'EVM')), 'coin' => $coin, 'qr' => '', 'expiredAt' => 0, 'memo' => '',
    'reused' => true, 'static' => true, 'own' => true, 'minUsd' => function_exists('orolado_oxapay_min_usd') ? orolado_oxapay_min_usd($coin) : 5.0];
}

/* ===================== Lecture + crédit ===================== */

function cevm_bal_call(string $tokenAddr, string $who): array {
  return ['eth_call', [['to' => $tokenAddr, 'data' => '0x70a08231' . str_pad(substr(strtolower($who), 2), 64, '0', STR_PAD_LEFT)], 'latest']];
}

/**
 * Lit une adresse sur un réseau, confirme les transactions du site en route, crédite le nouveau.
 * Retour : nombre de crédits faits.
 */
function cevm_scan_addr(string $chain, string $addr, string $uid): int {
  $c = cevm_chains()[$chain] ?? null;
  if (!$c) return 0;
  $lf = cevm_ledger_file($uid);
  $L = coffre_json($lf);
  $pend = (array) ($L[$chain]['pend'] ?? []);
  $calls = ['bal' => ['eth_getBalance', [$addr, 'latest']]];
  foreach ($c['tokens'] as $sym => [$ta, $dec]) $calls['t_' . $sym] = cevm_bal_call($ta, $addr);
  foreach ($pend as $i => $p) $calls['r_' . $i] = ['eth_getTransactionReceipt', [(string) $p['h']]];
  $r = cevm_rpc_batch($chain, $calls);
  if (!is_array($r)) return 0;
  foreach ($r as $k => $v) if (!is_array($v) || isset($v['error'])) { if (!str_starts_with((string) $k, 'r_')) return 0; }
  $n = 0;
  $lk = @fopen($lf . '.lock', 'c');
  if ($lk) flock($lk, LOCK_EX);
  try {
    $L = coffre_json($lf);
    $C = (array) ($L[$chain] ?? []);
    $keep = [];
    foreach ((array) ($C['pend'] ?? []) as $i => $p) {
      $rc = $r['r_' . $i]['result'] ?? null;
      $age = time() - (int) ($p['at'] ?? 0);
      if (!is_array($rc)) {
        if ($age < 7200) { $keep[] = $p; continue; }
        // Jamais arrivée en 2 h : abandonnée. Une essence « reçue » qui n'est jamais arrivée est retirée du compte.
        if (($p['k'] ?? '') === 'top') $C['N']['top'] = cec_to_hex(cevm_pos_sub(cevm_bn((string) ($C['N']['top'] ?? '0')), cevm_bn((string) $p['v'])), 0);
        continue;
      }
      $okTx = (string) ($rc['status'] ?? '0x1') === '0x1';
      $fee = cec_mul(cevm_bn((string) ($rc['gasUsed'] ?? '0x0')), cevm_bn((string) ($rc['effectiveGasPrice'] ?? '0x0')));
      $kind = (string) ($p['k'] ?? '');
      if ($kind === 'top') {
        if (!$okTx) $C['N']['top'] = cec_to_hex(cevm_pos_sub(cevm_bn((string) ($C['N']['top'] ?? '0')), cevm_bn((string) $p['v'])), 0);
        continue;
      }
      // Transaction partie DE l'adresse du joueur : frais toujours payés ; valeur sortie seulement si réussie.
      $C['N']['fees'] = cec_to_hex(cec_add(cevm_bn((string) ($C['N']['fees'] ?? '0')), $fee), 0);
      if ($okTx) {
        $a = (string) $p['a'];
        $C[$a]['out'] = cec_to_hex(cec_add(cevm_bn((string) ($C[$a]['out'] ?? '0')), cevm_bn((string) $p['v'])), 0);
        $C['due'] = 0; // envoyé : le compteur « petits montants » repart du prochain dépôt
      }
      coffre_log('confirme', ['net' => $chain, 'addr' => $addr, 'k' => $kind, 'a' => (string) ($p['a'] ?? ''), 'ok' => $okTx, 'tx' => (string) $p['h']]);
    }
    $C['pend'] = $keep;
    if (!$keep) {
      // Rien en route : on crédite ce qui est nouveau, pièce par pièce.
      $assets = ['N' => [$r['bal']['result'] ?? '0x0', 18, $c['native']]];
      foreach ($c['tokens'] as $sym => [$ta, $dec]) $assets[$sym] = [$r['t_' . $sym]['result'] ?? '0x0', $dec, $sym];
      foreach ($assets as $a => [$balHex, $dec, $sym]) {
        $bal = cevm_bn((string) $balHex);
        $plus = cec_add($bal, cevm_bn((string) ($C[$a]['out'] ?? '0')));
        $minus = cevm_bn((string) ($C[$a]['cred'] ?? '0'));
        if ($a === 'N') { $plus = cec_add($plus, cevm_bn((string) ($C['N']['fees'] ?? '0'))); $minus = cec_add($minus, cevm_bn((string) ($C['N']['top'] ?? '0'))); }
        $new = cevm_pos_sub($plus, $minus);
        if (cec_is_zero($new)) continue;
        $units = cevm_float($new, $dec);
        // Dollars : USDT / USDC / DAI = 1 $ ; ETH, BNB, LINK, PEPE… = pièces × cours du moment.
        $stable = in_array($sym, ['USDT', 'USDC', 'DAI'], true);
        $usd = $stable ? $units : (function_exists('orolado_crypto_usd_price') ? (($pr = orolado_crypto_usd_price($sym)) !== null ? $units * $pr : -1.0) : -1.0);
        if ($usd < 0) continue; // pas de cours pour l'instant : au prochain passage
        if ($usd + 0.0001 < COFFRE_MIN_CREDIT) continue; // poussière : jamais créditée (reste comptée au prochain vrai dépôt)
        $newCred = cec_to_hex(cec_add($minus, $new), 0);
        if ($a === 'N') $newCred = cec_to_hex(cec_add(cevm_bn((string) ($C['N']['cred'] ?? '0')), $new), 0);
        $ref = 'evm:' . $chain . ':' . $addr . ':' . $a . ':' . $newCred;
        $res = cevm_credit($uid, $addr, $chain, $sym, orolado_money($usd), $units, $ref);
        if (!empty($res['ok'])) {
          $C[$a]['cred'] = $newCred;
          if (empty($res['duplicate'])) { $n++; if (empty($C['due'])) $C['due'] = time(); }
        }
      }
    }
    $L[$chain] = $C;
    @file_put_contents($lf, json_encode($L), LOCK_EX);
  } finally { if ($lk) { flock($lk, LOCK_UN); fclose($lk); } }
  coffre_json_rw(cevm_index_file(), static function (&$st) use ($addr, $chain) { if (isset($st[$addr])) $st[$addr]['seen'][$chain] = time(); });
  return $n;
}

function cevm_credit(string $uid, string $addr, string $chain, string $sym, float $usd, float $units, string $ref): array {
  $h = sha1($ref);
  $pid = cevm_parent_id($uid);
  $cid = $pid . '_x' . substr($h, 0, 12);
  orolado_deposit_append_locked(['id' => $cid, 'ref' => $cid, 'parentId' => $pid, 'userId' => $uid, 'operator' => 'coffre', 'kind' => 'own', 'fam' => 'evm',
    'network' => (cevm_chains()[$chain]['name'] ?? $chain), 'coin' => strtolower($sym), 'status' => 'PENDING', 'amount' => $usd, 'units' => $units, 'currency' => 'USD',
    'txid' => $h, 'txids' => [$h], 'address' => $addr, 'at' => date('c')]);
  if (function_exists('supabase_insert_deposit')) {
    try { supabase_insert_deposit(['id' => $cid, 'user_id' => orolado_balance_uuid(load_db(orolado_data_file()), $uid), 'amount' => $usd, 'status' => 'PENDING', 'reference' => $cid, 'operator' => 'coffre']); } catch (Throwable $e) { /* le crédit n'en dépend pas */ }
  }
  $paid = credit_paid_deposit(['ref' => $cid, 'amount' => $usd, 'extId' => $h, 'paid' => true, 'creditReceived' => true, 'allowSmall' => true, 'operator' => 'coffre']);
  if (!empty($paid['ok']) && empty($paid['duplicate'])) {
    try { $vt = orolado_crypto_vault(load_db(orolado_data_file()), $uid); supabase_sync_real_min($uid, $vt['real'] ?? 0); } catch (Throwable $e) { /* ignore */ }
    coffre_log('credit', ['net' => $chain, 'addr' => $addr, 'sym' => $sym, 'units' => $units, 'usd' => $usd]);
    if ($usd >= 500) orolado_health_event('Dépôts', '🏦 Gros dépôt ' . $sym . ' (' . (cevm_chains()[$chain]['name'] ?? $chain) . ') : ' . $usd . ' $ (joueur ' . $uid . ').', 'info');
  }
  return ['ok' => !empty($paid['ok']), 'duplicate' => !empty($paid['duplicate'])];
}

/** Ronde : adresses dont l'écran vient d'être ouvert d'abord (réseau choisi toutes les 30 s, les autres plus rarement). */
function cevm_scan(int $max = 10, float $budget = 6.0): int {
  if (!cevm_ready()) return 0;
  $lk = @fopen(coffre_dir() . '/evm_scan.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return 0; }
  $n = 0; $t0 = microtime(true); $now = time();
  try {
    $todo = [];
    foreach (coffre_json(cevm_index_file()) as $addr => $e) {
      $age = $now - (int) ($e['open'] ?? 0);
      foreach (array_keys(cevm_chains()) as $chain) {
        $hint = ($e['hint'] ?? '') === $chain;
        $every = $age < 7200 ? ($hint ? 30 : 600) : ($age < 172800 ? ($hint ? 300 : 3600) : 86400);
        $late = $now - (int) ($e['seen'][$chain] ?? 0) - $every;
        if ($late >= 0) $todo[] = [$late / $every, (string) $addr, $chain, (string) $e['u']];
      }
    }
    usort($todo, static fn($a, $b) => $b[0] <=> $a[0]);
    foreach ($todo as $i => $t) {
      if ($i >= $max || microtime(true) - $t0 > $budget) break;
      $n += cevm_scan_addr($t[2], $t[1], $t[3]);
    }
  } finally { flock($lk, LOCK_UN); fclose($lk); }
  return $n;
}

/** État pour l'écran du joueur. */
function cevm_status(array $dep, string $uid): array {
  $pid = (string) ($dep['id'] ?? ''); $opened = (float) ($dep['openedAt'] ?? 0);
  $sum = function () use ($pid, $opened): float {
    $s = 0.0;
    foreach ((load_db(orolado_data_file())['deposits'] ?? []) as $c) {
      if (!is_array($c) || (string) ($c['parentId'] ?? '') !== $pid || !in_array(strtoupper((string) ($c['status'] ?? '')), ['COMPLETED', 'PAID'], true)) continue;
      $ts = isset($c['paidTs']) ? (float) $c['paidTs'] : (float) (strtotime((string) ($c['paidAt'] ?? $c['at'] ?? '')) ?: 0);
      if ($ts + 5 >= $opened) $s += (float) ($c['amount'] ?? 0);
    }
    return orolado_money($s);
  };
  $got = $sum();
  $hint = (string) ($dep['hint'] ?? '');
  if ($got <= 0 && orolado_rate_ok('cevm_st', $uid, 1, 15)) {
    // Réseau choisi : toutes les 15 s ; les 5 réseaux : chaque minute (le joueur a pu changer de réseau en route).
    $nets = orolado_rate_ok('cevm_st_all', $uid, 1, 60) ? array_keys(cevm_chains()) : ($hint !== '' ? [$hint] : []);
    foreach ($nets as $nc) cevm_scan_addr($nc, (string) $dep['address'], $uid);
    $got = $sum();
  }
  if ($got > 0) return ['ok' => true, 'paid' => true, 'success' => true, 'amount' => $got, 'vault' => orolado_crypto_vault(load_db(orolado_data_file()), $uid)];
  return ['ok' => true, 'pending' => true];
}

/* ===================== Envoi vers le Trust Wallet ===================== */

function cevm_send(string $chain, string $from, string $to, string $valueHex, string $dataHex, int $gas, string $gasPriceHex): array {
  $priv = cevm_priv_of($from);
  if ($priv === '') return ['ok' => false, 'why' => 'clé'];
  $c = cevm_chains()[$chain];
  $nr = cevm_rpc($chain, 'eth_getTransactionCount', [$from, 'pending']);
  if (!isset($nr['result'])) return ['ok' => false, 'why' => 'nonce'];
  $raw = cevm_sign_tx((int) $c['id'], $priv, (string) $nr['result'], $gasPriceHex, $gas, $to, $valueHex, $dataHex);
  $sr = cevm_rpc($chain, 'eth_sendRawTransaction', [$raw]);
  if (!isset($sr['result'])) return ['ok' => false, 'why' => substr((string) ($sr['error']['message'] ?? 'réseau'), 0, 140)];
  return ['ok' => true, 'h' => (string) $sr['result']];
}

function cevm_add_pend(string $uid, string $chain, array $p, ?string $topHex = null): void {
  $lf = cevm_ledger_file($uid);
  $lk = @fopen($lf . '.lock', 'c'); if ($lk) flock($lk, LOCK_EX);
  try {
    $L = coffre_json($lf);
    $L[$chain]['pend'][] = $p + ['at' => time()];
    if ($topHex !== null) $L[$chain]['N']['top'] = cec_to_hex(cec_add(cevm_bn((string) ($L[$chain]['N']['top'] ?? '0')), cevm_bn($topHex)), 0);
    @file_put_contents($lf, json_encode($L), LOCK_EX);
  } finally { if ($lk) { flock($lk, LOCK_UN); fclose($lk); } }
}

/**
 * Vide les adresses (seuil atteint, ou bouton « Envoyer maintenant ») vers le Trust Wallet. Une seule transaction
 * en route par adresse et par réseau. Essence : envoyée par le réservoir quand il en manque.
 */
function cevm_sweep(bool $force = false, int $max = 4): array {
  $dest = cevm_dest();
  if ($dest === '') return ['ok' => false, 'why' => 'adresse Ethereum du Trust Wallet manquante'];
  $lk = @fopen(coffre_dir() . '/evm_sweep.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return ['ok' => false, 'why' => 'déjà en cours']; }
  $done = []; $gasAddr = cevm_gas_addr();
  try {
    $min = max(1.0, (float) (coffre_cfg()['min'] ?? COFFRE_SWEEP_DEFAULT));
    foreach (coffre_json(cevm_index_file()) as $addr => $e) {
      $uid = (string) ($e['u'] ?? '');
      $L = coffre_json(cevm_ledger_file($uid));
      foreach (cevm_chains() as $chain => $c) {
        if (count($done) >= $max) break 2;
        $C = (array) ($L[$chain] ?? []);
        if (empty($C) || !empty($C['pend'])) continue;
        $hasCred = false; foreach ($C as $k => $v) if (is_array($v) && !empty($v['cred'])) $hasCred = true;
        if (!$hasCred) continue;
        $calls = ['bal' => ['eth_getBalance', [$addr, 'latest']], 'gp' => ['eth_gasPrice', []]];
        foreach ($c['tokens'] as $sym => [$ta, $dec]) $calls['t_' . $sym] = cevm_bal_call($ta, $addr);
        $r = cevm_rpc_batch($chain, $calls);
        if (!is_array($r) || !isset($r['gp']['result'], $r['bal']['result'])) continue;
        $gp = cevm_bn($r['gp']['result']);
        $gpHex = cec_to_hex(cec_add($gp, cevm_pct($gp, 20)), 0); // prix du moment +20 % (passe même si le réseau s'agite)
        $l2 = in_array($chain, ['base', 'arb', 'op'], true); // réseaux « couche 2 » : frais variables en plus → marge plus large
        $nat = cevm_bn($r['bal']['result']);
        // 1) Jetons (USDT, USDC) au-dessus du seuil
        foreach ($c['tokens'] as $sym => [$ta, $dec]) {
          $tb = cevm_bn((string) ($r['t_' . $sym]['result'] ?? '0x0'));
          $units = cevm_float($tb, $dec);
          if ($units < 0.5) continue;
          $chainMin = max($min, (float) $c['min']);
          if (!$force && $units < $chainMin && time() - (int) ($C['due'] ?? time()) < 86400) continue;
          $data = '0xa9059cbb' . str_pad(substr($dest, 2), 64, '0', STR_PAD_LEFT) . str_pad(cec_to_hex($tb, 0), 64, '0', STR_PAD_LEFT);
          $est = cevm_rpc($chain, 'eth_estimateGas', [['from' => $addr, 'to' => $ta, 'data' => $data]]);
          $gas = isset($est['result']) ? max(21000, (int) ceil(hexdec((string) $est['result']) * 1.3)) : (int) $c['tok_gas'];
          $need = cec_mul(cevm_bn($gpHex), cec_from_hex(dechex($gas)));
          if ($l2) $need = cec_add($need, $need);
          if (cec_cmp($nat, $need) < 0) {
            // Essence : le réservoir envoie juste ce qu'il faut (+30 %).
            $send = cec_sub(cec_add($need, cevm_pct($need, 30)), $nat);
            $gb = cevm_rpc($chain, 'eth_getBalance', [$gasAddr, 'latest']);
            $gbal = cevm_bn((string) ($gb['result'] ?? '0x0'));
            $gneed = cec_add($send, cec_mul(cevm_bn($gpHex), cec_from_hex(dechex(21000))));
            if (cec_cmp($gbal, $gneed) < 0) {
              coffre_log('reservoir_vide', ['net' => $chain, 'addr' => $addr, 'need' => round(cevm_float($gneed, 18), 6) . ' ' . $c['native']]);
              if (orolado_rate_ok('cevm_gas_warn', $chain, 1, 3600)) orolado_health_event('Dépôts', '🏦 Réservoir ' . $c['name'] . ' : il manque du ' . $c['native'] . ' (envoie-en à ' . cevm_checksum($gasAddr) . ', réseau ' . $c['name'] . '). Les dépôts restent crédités.', 'warn');
              break;
            }
            $s = cevm_send($chain, $gasAddr, $addr, cec_to_hex($send, 0), '', 21000, $gpHex);
            coffre_log('frais', ['net' => $chain, 'addr' => $addr, 'trx' => round(cevm_float($send, 18), 6) . ' ' . $c['native'], 'ok' => $s['ok'], 'tx' => $s['h'] ?? '', 'why' => $s['why'] ?? '']);
            if ($s['ok']) cevm_add_pend($uid, $chain, ['h' => $s['h'], 'k' => 'top', 'a' => 'N', 'v' => cec_to_hex($send, 0)], cec_to_hex($send, 0));
            $done[] = ['net' => $chain, 'step' => 'frais', 'ok' => $s['ok']];
            continue 2; // l'envoi des jetons partira quand l'essence sera confirmée
          }
          $s = cevm_send($chain, $addr, $ta, '0', $data, $gas, $gpHex);
          coffre_log('balayage', ['net' => $chain, 'addr' => $addr, 'usdt' => round($units, 6), 'sym' => $sym, 'to' => $dest, 'ok' => $s['ok'], 'tx' => $s['h'] ?? '', 'why' => $s['why'] ?? '']);
          if ($s['ok']) cevm_add_pend($uid, $chain, ['h' => $s['h'], 'k' => 'token', 'a' => $sym, 'v' => cec_to_hex($tb, 0)]);
          $done[] = ['net' => $chain, 'step' => 'balayage', 'sym' => $sym, 'ok' => $s['ok']];
          continue 2; // une transaction à la fois par adresse et par réseau
        }
        // 2) Monnaie du réseau (ETH, BNB, POL) déposée par le joueur : on garde de quoi payer l'envoi.
        $est = cevm_rpc($chain, 'eth_estimateGas', [['from' => $addr, 'to' => $dest, 'value' => '0x1']]);
        $ngas = isset($est['result']) ? max(21000, (int) ceil(hexdec((string) $est['result']) * 1.2)) : 21000;
        $fee = cec_mul(cevm_bn($gpHex), cec_from_hex(dechex($ngas)));
        $keep = cec_add($fee, $fee); if ($l2) $keep = cec_add($keep, $keep); // on garde 2× (4× sur couche 2) les frais : l'envoi ne peut pas échouer
        if (cec_cmp($nat, cec_add($keep, $keep)) <= 0) continue; // trop peu : pas la peine
        $val = cec_sub($nat, $keep);
        $usd = function_exists('orolado_crypto_usd_price') && ($pr = orolado_crypto_usd_price($c['native'])) !== null ? cevm_float($val, 18) * $pr : 0.0;
        if (!$force && $usd < max($min, (float) $c['min'])) continue;
        if (empty($L[$chain]['N']['cred'])) continue; // pas de dépôt du joueur dans cette monnaie : rien à envoyer (essence restante)
        $s = cevm_send($chain, $addr, $dest, cec_to_hex($val, 0), '', $ngas, $gpHex);
        coffre_log('balayage', ['net' => $chain, 'addr' => $addr, 'usdt' => round(cevm_float($val, 18), 6), 'sym' => $c['native'], 'to' => $dest, 'ok' => $s['ok'], 'tx' => $s['h'] ?? '', 'why' => $s['why'] ?? '']);
        if ($s['ok']) cevm_add_pend($uid, $chain, ['h' => $s['h'], 'k' => 'native', 'a' => 'N', 'v' => cec_to_hex($val, 0)]);
        $done[] = ['net' => $chain, 'step' => 'balayage', 'sym' => $c['native'], 'ok' => $s['ok']];
      }
    }
  } finally { flock($lk, LOCK_UN); fclose($lk); }
  return ['ok' => true, 'done' => $done];
}

/** pct % d'un grand nombre (arrondi bas). */
function cevm_pct(array $x, int $pct): array {
  // x × pct / 100 : division par 100 « à la main » (chiffres de 16 bits)
  $y = cec_mul($x, cec_from_hex(dechex($pct)));
  $out = []; $rem = 0;
  for ($i = count($y) - 1; $i >= 0; $i--) { $cur = ($rem << 16) | $y[$i]; $out[$i] = intdiv($cur, 100); $rem = $cur % 100; }
  ksort($out);
  return cec_norm(array_values($out));
}

/** Admin : réservoir 0x sur chaque réseau + adresses. */
function cevm_admin_view(): array {
  if (!cevm_ready()) return ['ready' => false, 'dest' => cevm_dest()];
  $gas = cevm_gas_addr(); $res = [];
  foreach (cevm_chains() as $chain => $c) {
    $b = cevm_rpc($chain, 'eth_getBalance', [$gas, 'latest']);
    $res[] = ['net' => $chain, 'name' => $c['name'], 'native' => $c['native'], 'bal' => isset($b['result']) ? round(cevm_float(cevm_bn($b['result']), 18), 6) : null];
  }
  return ['ready' => true, 'on' => !empty(coffre_cfg()['evm_on']), 'dest' => cevm_checksum(cevm_dest()), 'gas' => cevm_checksum($gas), 'gasBal' => $res, 'addresses' => count(coffre_json(cevm_index_file()))];
}
