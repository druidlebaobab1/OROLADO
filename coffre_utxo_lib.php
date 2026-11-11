<?php
/**
 * 2026-11-11 — COFFRE OROLADO, famille BITCOIN (Bitcoin, Litecoin, Dogecoin).
 *
 * Même principe que TRON / Ethereum :
 *  - chaque joueur a SA propre adresse par réseau (bc1… / ltc1… / D…), tirée de SA clé du coffre (même clé) ;
 *  - le site lit « total reçu CONFIRMÉ » de l'adresse et crédite ce qui est NOUVEAU (jamais deux fois) ;
 *  - puis il envoie tout vers le Trust Wallet du propriétaire (VAULT_BTC/LTC/DOGE_ADDRESS).
 *    Pas besoin de réservoir : les frais sont pris sur le montant envoyé.
 *
 * Crédit sans double compte : à créditer = total reçu confirmé − déjà crédité. Les envois du site vers le Trust
 * Wallet prennent TOUT (aucune monnaie rendue) : ils ne changent jamais le « total reçu ».
 * Signature : clé secp256k1 du joueur (coffre_ec.php, RFC 6979, s bas) ; Bitcoin/Litecoin en SegWit (BIP143),
 * Dogecoin en classique (P2PKH).
 */

require_once __DIR__ . '/coffre_ec.php';

function cutxo_chains(): array {
  return [
    'btc' => ['name' => 'Bitcoin', 'sym' => 'BTC', 'hrp' => 'bc', 'pkh' => [0x00], 'sh' => [0x05], 'seg' => true, 'env' => 'VAULT_BTC_ADDRESS',
      'api' => ['https://mempool.space/api', 'https://blockstream.info/api'], 'kind' => 'esplora', 'floor' => 2, 'dust' => 546, 'min' => 30.0, 'every' => 60],
    'ltc' => ['name' => 'Litecoin', 'sym' => 'LTC', 'hrp' => 'ltc', 'pkh' => [0x30], 'sh' => [0x32, 0x05], 'seg' => true, 'env' => 'VAULT_LTC_ADDRESS',
      'api' => ['https://litecoinspace.org/api'], 'kind' => 'esplora', 'floor' => 2, 'dust' => 5460, 'min' => 10.0, 'every' => 60],
    'doge' => ['name' => 'Dogecoin', 'sym' => 'DOGE', 'hrp' => '', 'pkh' => [0x1e], 'sh' => [0x16], 'seg' => false, 'env' => 'VAULT_DOGE_ADDRESS',
      'api' => ['https://api.blockcypher.com/v1/doge/main'], 'kind' => 'blockcypher', 'floor' => 2000, 'dust' => 1000000, 'min' => 10.0, 'every' => 120],
  ];
}

/** Pièce de l'écran de dépôt → réseau. */
function cutxo_coin_chain(string $coin): string {
  return ['btc' => 'btc', 'ltc' => 'ltc', 'doge' => 'doge'][$coin] ?? '';
}

/* ===================== Outils ===================== */

function cutxo_dsha(string $b): string { return hash('sha256', hash('sha256', $b, true), true); }
function cutxo_h160(string $b): string { return hash('ripemd160', hash('sha256', $b, true), true); }
function cutxo_varint(int $n): string {
  if ($n < 0xfd) return chr($n);
  if ($n <= 0xffff) return "\xfd" . pack('v', $n);
  return "\xfe" . pack('V', $n);
}
function cutxo_push(string $d): string { return chr(strlen($d)) . $d; } // données < 76 octets

function cutxo_b58check(string $payload): string { return coffre_b58enc($payload . substr(cutxo_dsha($payload), 0, 4)); }
function cutxo_b58check_dec(string $s): ?string {
  $raw = coffre_b58dec($s);
  if (strlen($raw) < 5) return null;
  $p = substr($raw, 0, -4);
  return substr(cutxo_dsha($p), 0, 4) === substr($raw, -4) ? $p : null;
}

function cutxo_polymod(array $v): int {
  $gen = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  $chk = 1;
  foreach ($v as $x) {
    $b = $chk >> 25;
    $chk = (($chk & 0x1ffffff) << 5) ^ $x;
    for ($i = 0; $i < 5; $i++) if (($b >> $i) & 1) $chk ^= $gen[$i];
  }
  return $chk;
}
function cutxo_hrp_exp(string $hrp): array {
  $a = []; $b = [];
  for ($i = 0; $i < strlen($hrp); $i++) { $a[] = ord($hrp[$i]) >> 5; $b[] = ord($hrp[$i]) & 31; }
  return array_merge($a, [0], $b);
}
function cutxo_bits(array $data, int $from, int $to, bool $pad): ?array {
  $acc = 0; $bits = 0; $out = []; $max = (1 << $to) - 1;
  foreach ($data as $v) {
    if ($v < 0 || ($v >> $from)) return null;
    $acc = ($acc << $from) | $v; $bits += $from;
    while ($bits >= $to) { $bits -= $to; $out[] = ($acc >> $bits) & $max; }
    $acc &= (1 << $bits) - 1;
  }
  if ($pad) { if ($bits) $out[] = ($acc << ($to - $bits)) & $max; }
  elseif ($bits >= $from || (($acc << ($to - $bits)) & $max)) return null;
  return $out;
}
const CUTXO_B32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
function cutxo_segwit_enc(string $hrp, int $ver, string $prog): string {
  $data = array_merge([$ver], cutxo_bits(array_values(unpack('C*', $prog)), 8, 5, true));
  $const = $ver === 0 ? 1 : 0x2bc830a3;
  $pm = cutxo_polymod(array_merge(cutxo_hrp_exp($hrp), $data, [0, 0, 0, 0, 0, 0])) ^ $const;
  $s = $hrp . '1';
  foreach ($data as $d) $s .= CUTXO_B32[$d];
  for ($i = 0; $i < 6; $i++) $s .= CUTXO_B32[($pm >> (5 * (5 - $i))) & 31];
  return $s;
}
/** Retour : [version, programme] ou null. */
function cutxo_segwit_dec(string $hrp, string $addr): ?array {
  if (strtolower($addr) !== $addr && strtoupper($addr) !== $addr) return null;
  $a = strtolower($addr);
  $p = strrpos($a, '1');
  if ($p === false || substr($a, 0, $p) !== $hrp || strlen($a) - $p - 1 < 7 || strlen($a) > 90) return null;
  $data = [];
  for ($i = $p + 1; $i < strlen($a); $i++) { $v = strpos(CUTXO_B32, $a[$i]); if ($v === false) return null; $data[] = $v; }
  $pm = cutxo_polymod(array_merge(cutxo_hrp_exp($hrp), $data));
  $ver = $data[0];
  if ($ver > 16 || $pm !== ($ver === 0 ? 1 : 0x2bc830a3)) return null;
  $prog = cutxo_bits(array_slice($data, 1, -6), 5, 8, false);
  if ($prog === null || count($prog) < 2 || count($prog) > 40 || ($ver === 0 && !in_array(count($prog), [20, 32], true))) return null;
  return [$ver, pack('C*', ...$prog)];
}

/** Script de sortie d'une adresse (null = adresse invalide pour ce réseau). */
function cutxo_script(string $chain, string $addr): ?string {
  $c = cutxo_chains()[$chain] ?? null;
  if (!$c) return null;
  if ($c['hrp'] !== '' && ($w = cutxo_segwit_dec($c['hrp'], $addr))) {
    [$ver, $prog] = $w;
    return chr($ver === 0 ? 0 : 0x50 + $ver) . cutxo_push($prog);
  }
  $p = cutxo_b58check_dec($addr);
  if ($p === null || strlen($p) !== 21) return null;
  $v = ord($p[0]); $h = substr($p, 1);
  if (in_array($v, $c['pkh'], true)) return "\x76\xa9\x14" . $h . "\x88\xac";
  if (in_array($v, $c['sh'], true)) return "\xa9\x14" . $h . "\x87";
  return null;
}
function cutxo_addr_ok(string $chain, string $addr): bool { return cutxo_script($chain, trim($addr)) !== null; }

/** Clé publique compressée (33 octets). */
function cutxo_cpub(string $priv32): string {
  $p = cec_pub($priv32);
  return (ord($p[63]) & 1 ? "\x03" : "\x02") . substr($p, 0, 32);
}
/** Adresse d'une clé sur un réseau (SegWit bc1q/ltc1q, ou classique pour Dogecoin). */
function cutxo_addr_of(string $chain, string $priv32): string {
  $c = cutxo_chains()[$chain];
  $h = cutxo_h160(cutxo_cpub($priv32));
  return $c['seg'] ? cutxo_segwit_enc($c['hrp'], 0, $h) : cutxo_b58check(chr($c['pkh'][0]) . $h);
}

function cutxo_der(array $sig): string {
  $i = static function (string $b): string { $b = ltrim($b, "\0"); if ($b === '' || ord($b[0]) & 0x80) $b = "\0" . $b; return "\x02" . chr(strlen($b)) . $b; };
  $body = $i($sig['r']) . $i($sig['s']);
  return "\x30" . chr(strlen($body)) . $body;
}

/**
 * Transaction signée qui envoie TOUTES les pièces $ins (même clé) vers $outScript.
 * $ins : [['txid' => hex, 'vout' => int, 'value' => int], …]. Retour : ['hex', 'txid', 'vsize'].
 */
function cutxo_build(string $chain, string $priv, array $ins, string $outScript, int $outValue): array {
  $c = cutxo_chains()[$chain];
  $pub = cutxo_cpub($priv); $h = cutxo_h160($pub);
  $pkScript = "\x76\xa9\x14" . $h . "\x88\xac";
  $ver = $c['seg'] ? pack('V', 2) : pack('V', 1); $lock = pack('V', 0); $seq = "\xff\xff\xff\xff";
  $outs = pack('P', $outValue) . cutxo_varint(strlen($outScript)) . $outScript;
  $op = static fn(array $u): string => strrev(hex2bin($u['txid'])) . pack('V', (int) $u['vout']);
  $base = ''; $wit = '';
  if ($c['seg']) {
    $hp = cutxo_dsha(implode('', array_map($op, $ins)));
    $hs = cutxo_dsha(str_repeat($seq, count($ins)));
    $ho = cutxo_dsha($outs);
    foreach ($ins as $u) {
      $pre = $ver . $hp . $hs . $op($u) . "\x19" . $pkScript . pack('P', (int) $u['value']) . $seq . $ho . $lock . pack('V', 1);
      $sig = cutxo_der(cec_sign(cutxo_dsha($pre), $priv)) . "\x01";
      $wit .= "\x02" . cutxo_push($sig) . cutxo_push($pub);
      $base .= $op($u) . "\x00" . $seq;
    }
    $mid = cutxo_varint(count($ins)) . $base . "\x01" . $outs;
    $noWit = $ver . $mid . $lock;
    $full = $ver . "\x00\x01" . $mid . $wit . $lock;
  } else {
    foreach ($ins as $j => $u) {
      $t = '';
      foreach ($ins as $k => $v) $t .= $op($v) . ($k === $j ? cutxo_varint(strlen($pkScript)) . $pkScript : "\x00") . $seq;
      $pre = $ver . cutxo_varint(count($ins)) . $t . "\x01" . $outs . $lock . pack('V', 1);
      $sig = cutxo_der(cec_sign(cutxo_dsha($pre), $priv)) . "\x01";
      $ss = cutxo_push($sig) . cutxo_push($pub);
      $base .= $op($u) . cutxo_varint(strlen($ss)) . $ss . $seq;
    }
    $noWit = $full = $ver . cutxo_varint(count($ins)) . $base . "\x01" . $outs . $lock;
  }
  $vsize = (int) ceil((strlen($noWit) * 3 + strlen($full)) / 4);
  return ['hex' => bin2hex($full), 'txid' => bin2hex(strrev(cutxo_dsha($noWit))), 'vsize' => $vsize];
}

/** Taille estimée (vbytes) d'un envoi de n pièces vers 1 sortie. */
function cutxo_vsize_est(string $chain, int $n): int {
  return cutxo_chains()[$chain]['seg'] ? (int) ceil(11 + 68.5 * $n + 43) : 10 + 149 * $n + 34;
}

/* ===================== Réseau ===================== */

/** Appel HTTP vers l'explorateur du réseau. $path commence par /. Retour [code, texte] du 1er qui répond. */
function cutxo_http(string $chain, string $method, string $path, ?string $body = null, string $ctype = 'text/plain'): array {
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_UTXO']) && is_callable($GLOBALS['OROLADO_FAKE_UTXO'])) return ($GLOBALS['OROLADO_FAKE_UTXO'])($chain, $method, $path, $body);
  $c = cutxo_chains()[$chain] ?? null;
  if (!$c || !function_exists('curl_init')) return [0, ''];
  $last = [0, ''];
  foreach ($c['api'] as $base) {
    $ch = curl_init($base . $path);
    $opt = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_HTTPHEADER => ['Accept: application/json']];
    if ($method === 'POST') $opt += [CURLOPT_POST => true, CURLOPT_POSTFIELDS => (string) $body, CURLOPT_HTTPHEADER => ['Content-Type: ' . $ctype]];
    curl_setopt_array($ch, $opt);
    $raw = curl_exec($ch); $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    $last = [$code, is_string($raw) ? $raw : ''];
    if ($code >= 200 && $code < 300) return $last;
    if ($method === 'POST' && $code === 400) return $last; // transaction refusée : pas la peine de réessayer ailleurs
  }
  return $last;
}

/**
 * État d'une adresse : total reçu confirmé, en attente (non confirmé), pièces confirmées dépensables.
 * Retour null si l'explorateur ne répond pas.
 */
function cutxo_addr_state(string $chain, string $addr): ?array {
  $c = cutxo_chains()[$chain];
  if ($c['kind'] === 'esplora') {
    [$code, $raw] = cutxo_http($chain, 'GET', '/address/' . $addr);
    $j = $code === 200 ? json_decode($raw, true) : null;
    if (!is_array($j) || !isset($j['chain_stats']['funded_txo_sum'])) return null;
    return ['rcv' => (int) $j['chain_stats']['funded_txo_sum'], 'wait' => (int) ($j['mempool_stats']['funded_txo_sum'] ?? 0),
      // Sur l'adresse maintenant : un envoi du site encore non confirmé est déjà déduit (l'admin voit 0 tout de suite).
      'bal' => max(0, (int) $j['chain_stats']['funded_txo_sum'] - (int) ($j['chain_stats']['spent_txo_sum'] ?? 0) - (int) ($j['mempool_stats']['spent_txo_sum'] ?? 0))];
  }
  [$code, $raw] = cutxo_http($chain, 'GET', '/addrs/' . $addr . '/balance');
  $j = $code === 200 ? json_decode($raw, true) : null;
  if (!is_array($j) || !isset($j['total_received'])) return null;
  $unc = (int) ($j['unconfirmed_balance'] ?? 0); // net : négatif quand un envoi du site attend sa confirmation
  return ['rcv' => (int) $j['total_received'], 'wait' => max(0, $unc), 'bal' => max(0, (int) ($j['balance'] ?? 0) + min(0, $unc))];
}

/** Pièces confirmées (non dépensées) d'une adresse. */
function cutxo_utxos(string $chain, string $addr): ?array {
  $c = cutxo_chains()[$chain];
  $out = [];
  if ($c['kind'] === 'esplora') {
    [$code, $raw] = cutxo_http($chain, 'GET', '/address/' . $addr . '/utxo');
    $j = $code === 200 ? json_decode($raw, true) : null;
    if (!is_array($j)) return null;
    foreach ($j as $u) if (!empty($u['status']['confirmed']) && preg_match('/^[0-9a-f]{64}$/', (string) ($u['txid'] ?? ''))) $out[] = ['txid' => $u['txid'], 'vout' => (int) $u['vout'], 'value' => (int) $u['value']];
    return $out;
  }
  [$code, $raw] = cutxo_http($chain, 'GET', '/addrs/' . $addr . '?unspentOnly=true&limit=200');
  $j = $code === 200 ? json_decode($raw, true) : null;
  if (!is_array($j)) return null;
  foreach ((array) ($j['txrefs'] ?? []) as $u) {
    if ((int) ($u['confirmations'] ?? 0) < 1 || (int) ($u['tx_output_n'] ?? -1) < 0 || !preg_match('/^[0-9a-f]{64}$/', (string) ($u['tx_hash'] ?? ''))) continue;
    $out[] = ['txid' => $u['tx_hash'], 'vout' => (int) $u['tx_output_n'], 'value' => (int) $u['value']];
  }
  return $out;
}

/** Frais (en plus petite unité par vbyte). */
function cutxo_feerate(string $chain): int {
  $c = cutxo_chains()[$chain];
  $r = 0;
  if ($c['kind'] === 'esplora') {
    [$code, $raw] = cutxo_http($chain, 'GET', '/v1/fees/recommended');
    $j = $code === 200 ? json_decode($raw, true) : null;
    $r = (int) ceil((float) ($j['halfHourFee'] ?? 0));
    if ($r <= 0) { [$code, $raw] = cutxo_http($chain, 'GET', '/fee-estimates'); $j = json_decode($raw, true); $r = (int) ceil((float) ($j['6'] ?? 0)); }
  } else {
    [$code, $raw] = cutxo_http($chain, 'GET', '');
    $j = $code === 200 ? json_decode($raw, true) : null;
    $r = (int) ceil((float) ($j['medium_fee_per_kb'] ?? 0) / 1000);
  }
  return max($c['floor'], min($r, $c['floor'] * 200));
}

function cutxo_broadcast(string $chain, string $hex): array {
  $c = cutxo_chains()[$chain];
  if ($c['kind'] === 'esplora') {
    [$code, $raw] = cutxo_http($chain, 'POST', '/tx', $hex);
    $t = trim($raw);
    return ($code === 200 && preg_match('/^[0-9a-f]{64}$/', $t)) ? ['ok' => true, 'h' => $t] : ['ok' => false, 'why' => substr($t ?: 'réseau', 0, 160)];
  }
  [$code, $raw] = cutxo_http($chain, 'POST', '/txs/push', json_encode(['tx' => $hex]), 'application/json');
  $j = json_decode($raw, true);
  $h = (string) ($j['tx']['hash'] ?? '');
  return ($code >= 200 && $code < 300 && preg_match('/^[0-9a-f]{64}$/', $h)) ? ['ok' => true, 'h' => $h] : ['ok' => false, 'why' => substr((string) ($j['error'] ?? $raw ?: 'réseau'), 0, 160)];
}

/* ===================== Adresses ===================== */

function cutxo_dest(string $chain): string {
  orolado_load_env();
  $env = cutxo_chains()[$chain]['env'] ?? '';
  $a = $env !== '' ? trim((string) (getenv($env) ?: ($_ENV[$env] ?? ''))) : '';
  return ($a !== '' && cutxo_addr_ok($chain, $a)) ? $a : '';
}
function cutxo_ready(string $chain): bool { return isset(cutxo_chains()[$chain]) && cutxo_dest($chain) !== '' && function_exists('coffre_master'); }
function cutxo_ready_chains(): array { return array_values(array_filter(array_keys(cutxo_chains()), 'cutxo_ready')); }

function cutxo_on_for(array $me, string $chain): bool {
  if (!cutxo_ready($chain)) return false;
  $cfg = coffre_cfg();
  if (!empty($cfg['utxo_on'])) return true; // seulement si le propriétaire l'allume lui-même (même OxaPay arrêté)
  $role = strtolower((string) ($me['role'] ?? ''));
  return in_array($role, ['admin', 'owner', 'superadmin'], true) || (string) ($me['id'] ?? '') === 'admin_master' || (function_exists('orolado_is_admin_user') && orolado_is_admin_user($me));
}

function cutxo_index_file(): string { return coffre_dir() . '/utxo_index.json'; }
function cutxo_parent_id(string $uid, string $chain): string { return 'own_' . preg_replace('/[^a-zA-Z0-9]/', '', $uid) . '_' . $chain; }

function cutxo_user_priv(string $uid): string {
  $k = cevm_key_from_pem(coffre_dec((string) (coffre_json(coffre_user_file($uid))['enc'] ?? '')));
  return $k ? $k['priv'] : '';
}

/** Adresse du joueur sur un réseau (même clé que ses adresses TRON et 0x). */
function cutxo_addr_for(string $uid, string $chain): string {
  coffre_addr_for($uid); // crée la clé si besoin
  $w = coffre_json(coffre_user_file($uid));
  $addr = (string) ($w['utxo'][$chain] ?? '');
  if ($addr === '') {
    $priv = cutxo_user_priv($uid);
    if ($priv === '') throw new RuntimeException('clé illisible');
    $addr = cutxo_addr_of($chain, $priv);
    coffre_json_rw(coffre_user_file($uid), static function (&$st) use ($chain, $addr) { $st['utxo'][$chain] = $addr; });
  }
  coffre_json_rw(cutxo_index_file(), static function (&$st) use ($addr, $uid, $chain) {
    if (!isset($st[$addr])) $st[$addr] = ['u' => $uid, 'c' => $chain, 'at' => time(), 'open' => time(), 'seen' => 0, 'cred' => 0, 'got' => 0.0, 'bal' => 0];
  });
  return $addr;
}

function cutxo_invoice(array $me, string $coin, float $amount): array {
  $uid = (string) ($me['id'] ?? '');
  $chain = cutxo_coin_chain($coin);
  try { $addr = cutxo_addr_for($uid, $chain); } catch (Throwable $e) { return ['ok' => false, 'server' => true, 'reason' => 'Réessayez dans un instant', 'code' => 'coffre']; }
  $c = cutxo_chains()[$chain];
  $pid = cutxo_parent_id($uid, $chain); $now = microtime(true);
  with_db_lock(function ($box) use ($pid, $uid, $addr, $now, $chain, $c) {
    foreach (($box->db['deposits'] ?? []) as $i => $d) {
      if (is_array($d) && (string) ($d['id'] ?? '') === $pid) { $box->db['deposits'][$i]['openedAt'] = $now; return ['ok' => true]; }
    }
    $box->db['deposits'][] = ['id' => $pid, 'ref' => $pid, 'userId' => $uid, 'operator' => 'coffre', 'kind' => 'own', 'fam' => 'utxo', 'hint' => $chain,
      'network' => $c['name'], 'coin' => $chain, 'status' => 'STATIC', 'amount' => 0, 'currency' => 'USD', 'address' => $addr, 'openedAt' => $now, 'at' => date('c')];
    return ['ok' => true];
  });
  coffre_json_rw(cutxo_index_file(), static function (&$st) use ($addr) { if (isset($st[$addr])) $st[$addr]['open'] = time(); });
  $meta = function_exists('orolado_oxapay_coins') ? (orolado_oxapay_coins()[$coin] ?? []) : [];
  return ['ok' => true, 'server' => true, 'orderId' => $pid, 'trackId' => '', 'address' => $addr, 'amount' => orolado_money($amount), 'payAmount' => orolado_money($amount),
    'payCurrency' => (string) ($meta['pay'] ?? $c['sym']), 'network' => (string) ($meta['netLabel'] ?? $c['name']), 'coin' => $coin, 'qr' => '', 'expiredAt' => 0, 'memo' => '',
    'reused' => true, 'static' => true, 'own' => true, 'minUsd' => function_exists('orolado_oxapay_min_usd') ? orolado_oxapay_min_usd($coin) : 5.0];
}

/* ===================== Lecture + crédit ===================== */

/** Lit une adresse et crédite ce qui est nouveau (confirmé). Retour : nombre de crédits. */
function cutxo_scan_addr(string $addr): int {
  $e = coffre_json(cutxo_index_file())[$addr] ?? null;
  if (!is_array($e)) return 0;
  $chain = (string) $e['c']; $uid = (string) $e['u'];
  $c = cutxo_chains()[$chain] ?? null;
  if (!$c) return 0;
  $st = cutxo_addr_state($chain, $addr);
  if (!$st) return 0;
  $n = 0;
  $lk = @fopen(coffre_dir() . '/utxo_' . sha1($addr) . '.lock', 'c');
  if ($lk) flock($lk, LOCK_EX);
  try {
    $e = coffre_json(cutxo_index_file())[$addr] ?? $e;
    $cred = (int) ($e['cred'] ?? 0);
    $new = $st['rcv'] - $cred;
    $usdAdd = 0.0; $credTo = $cred;
    if ($new > 0) {
      $units = $new / 1e8;
      $pr = function_exists('orolado_crypto_usd_price') ? orolado_crypto_usd_price($c['sym']) : null;
      if ($pr !== null && $pr > 0) {
        $usd = orolado_money($units * $pr);
        if ($usd + 0.0001 >= COFFRE_MIN_CREDIT) {
          $ref = 'utxo:' . $chain . ':' . $addr . ':' . $st['rcv'];
          $res = cutxo_credit($uid, $addr, $chain, $usd, $units, $ref);
          if (!empty($res['ok'])) { $credTo = $st['rcv']; if (empty($res['duplicate'])) { $n++; $usdAdd = $usd; } }
        }
      }
    }
    coffre_json_rw(cutxo_index_file(), static function (&$s) use ($addr, $st, $credTo, $usdAdd) {
      if (!isset($s[$addr])) return;
      $s[$addr]['seen'] = time(); $s[$addr]['cred'] = $credTo; $s[$addr]['bal'] = $st['bal']; $s[$addr]['wait'] = $st['wait'];
      if ($usdAdd > 0) { $s[$addr]['got'] = round((float) ($s[$addr]['got'] ?? 0) + $usdAdd, 2); if (empty($s[$addr]['due'])) $s[$addr]['due'] = time(); }
    });
  } finally { if ($lk) { flock($lk, LOCK_UN); fclose($lk); } }
  return $n;
}

function cutxo_credit(string $uid, string $addr, string $chain, float $usd, float $units, string $ref): array {
  $c = cutxo_chains()[$chain];
  $h = sha1($ref);
  $pid = cutxo_parent_id($uid, $chain);
  $cid = $pid . '_x' . substr($h, 0, 12);
  orolado_deposit_append_locked(['id' => $cid, 'ref' => $cid, 'parentId' => $pid, 'userId' => $uid, 'operator' => 'coffre', 'kind' => 'own', 'fam' => 'utxo',
    'network' => $c['name'], 'coin' => $chain, 'status' => 'PENDING', 'amount' => $usd, 'units' => $units, 'currency' => 'USD',
    'txid' => $h, 'txids' => [$h], 'address' => $addr, 'at' => date('c')]);
  if (function_exists('supabase_insert_deposit')) {
    try { supabase_insert_deposit(['id' => $cid, 'user_id' => orolado_balance_uuid(load_db(orolado_data_file()), $uid), 'amount' => $usd, 'status' => 'PENDING', 'reference' => $cid, 'operator' => 'coffre']); } catch (Throwable $e) { /* le crédit n'en dépend pas */ }
  }
  $paid = credit_paid_deposit(['ref' => $cid, 'amount' => $usd, 'extId' => $h, 'paid' => true, 'creditReceived' => true, 'allowSmall' => true, 'operator' => 'coffre']);
  if (!empty($paid['ok']) && empty($paid['duplicate'])) {
    try { $vt = orolado_crypto_vault(load_db(orolado_data_file()), $uid); supabase_sync_real_min($uid, $vt['real'] ?? 0); } catch (Throwable $e) { /* ignore */ }
    coffre_log('credit', ['net' => $chain, 'addr' => $addr, 'sym' => $c['sym'], 'units' => $units, 'usd' => $usd]);
    if ($usd >= 500) orolado_health_event('Dépôts', '🏦 Gros dépôt ' . $c['sym'] . ' : ' . $usd . ' $ (joueur ' . $uid . ').', 'info');
  }
  return ['ok' => !empty($paid['ok']), 'duplicate' => !empty($paid['duplicate'])];
}

/** Ronde : écrans ouverts récemment d'abord ; un dépôt vu « en attente de confirmation » est relu chaque minute. */
function cutxo_scan(int $max = 8, float $budget = 5.0): int {
  if (!cutxo_ready_chains() && !coffre_json(cutxo_index_file())) return 0;
  $lk = @fopen(coffre_dir() . '/utxo_scan.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return 0; }
  $n = 0; $t0 = microtime(true); $now = time();
  try {
    $todo = [];
    foreach (coffre_json(cutxo_index_file()) as $addr => $e) {
      $c = cutxo_chains()[(string) ($e['c'] ?? '')] ?? null;
      if (!$c) continue;
      $age = $now - (int) ($e['open'] ?? 0);
      $every = !empty($e['wait']) ? $c['every'] : ($age < 7200 ? $c['every'] : ($age < 172800 ? 900 : 86400));
      $late = $now - (int) ($e['seen'] ?? 0) - $every;
      if ($late >= 0) $todo[] = [$late / $every, (string) $addr];
    }
    usort($todo, static fn($a, $b) => $b[0] <=> $a[0]);
    foreach ($todo as $i => $t) {
      if ($i >= $max || microtime(true) - $t0 > $budget) break;
      $n += cutxo_scan_addr($t[1]);
    }
  } finally { flock($lk, LOCK_UN); fclose($lk); }
  return $n;
}

/** État pour l'écran du joueur. */
function cutxo_status(array $dep, string $uid): array {
  $pid = (string) ($dep['id'] ?? ''); $opened = (float) ($dep['openedAt'] ?? 0); $addr = (string) ($dep['address'] ?? '');
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
  $chain = (string) ($dep['hint'] ?? '');
  $every = (int) (cutxo_chains()[$chain]['every'] ?? 60);
  if ($got <= 0 && $addr !== '' && orolado_rate_ok('cutxo_st', $uid, 1, max(20, (int) ($every / 2)))) { cutxo_scan_addr($addr); $got = $sum(); }
  if ($got > 0) return ['ok' => true, 'paid' => true, 'success' => true, 'amount' => $got, 'vault' => orolado_crypto_vault(load_db(orolado_data_file()), $uid)];
  $wait = (int) (coffre_json(cutxo_index_file())[$addr]['wait'] ?? 0);
  return ['ok' => true, 'pending' => true] + ($wait > 0 ? ['seen' => true, 'confirming' => true] : []);
}

/* ===================== Envoi vers le Trust Wallet ===================== */

/**
 * Envoie tout ce qu'il y a sur les adresses (seuil atteint, ou bouton « Envoyer maintenant ») vers le Trust Wallet.
 * Frais pris sur le montant. Refus si les frais mangent plus de 10 % (50 % avec le bouton).
 */
function cutxo_sweep(bool $force = false, int $max = 4): array {
  // Propriétaire (2026-11-11) : rien ne part tout seul. Seulement quand IL appuie sur « Envoyer maintenant ».
  if (!$force && empty(coffre_cfg()['utxo_auto'])) return ['ok' => true, 'done' => [], 'why' => 'envoi automatique éteint'];
  $lk = @fopen(coffre_dir() . '/utxo_sweep.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return ['ok' => false, 'why' => 'déjà en cours']; }
  $done = []; $tries = 0;
  try {
    $minCfg = max(1.0, (float) (coffre_cfg()['min'] ?? COFFRE_SWEEP_DEFAULT));
    foreach (coffre_json(cutxo_index_file()) as $addr => $e) {
      if ($tries >= $max) break;
      $chain = (string) ($e['c'] ?? ''); $c = cutxo_chains()[$chain] ?? null;
      if (!$c || (int) ($e['bal'] ?? 0) <= 0 || (int) ($e['cred'] ?? 0) <= 0) continue;
      $dest = cutxo_dest($chain);
      if ($dest === '') continue;
      if (time() - (int) ($e['swAt'] ?? 0) < 3600) continue; // un envoi déjà en route : on attend sa confirmation
      $pr = function_exists('orolado_crypto_usd_price') ? orolado_crypto_usd_price($c['sym']) : null;
      if ($pr === null || $pr <= 0) continue;
      $usd = $e['bal'] / 1e8 * $pr;
      $old = !empty($e['due']) && time() - (int) $e['due'] > 7 * 86400;
      if (!$force && !$old && $usd + 0.0001 < max($minCfg, $c['min'])) continue;
      $tries++;
      $priv = cutxo_user_priv((string) $e['u']);
      if ($priv === '' || cutxo_addr_of($chain, $priv) !== $addr) { coffre_log('erreur', ['net' => $chain, 'addr' => $addr, 'why' => 'clé']); continue; }
      $utx = cutxo_utxos($chain, $addr);
      if (!$utx) continue;
      // Pas plus de 200 pièces à la fois (taille de la transaction).
      usort($utx, static fn($a, $b) => $b['value'] <=> $a['value']);
      $utx = array_slice($utx, 0, 200);
      $total = array_sum(array_column($utx, 'value'));
      $fee = cutxo_feerate($chain) * cutxo_vsize_est($chain, count($utx));
      $send = $total - $fee;
      if ($send < $c['dust'] || $fee > $total * ($force ? 0.5 : 0.1)) { coffre_log('attente', ['net' => $chain, 'addr' => $addr, 'why' => 'frais trop hauts', 'fee' => $fee, 'total' => $total]); continue; }
      $tx = cutxo_build($chain, $priv, $utx, cutxo_script($chain, $dest), $send);
      $b = cutxo_broadcast($chain, $tx['hex']);
      if (empty($b['ok'])) { coffre_log('erreur', ['net' => $chain, 'addr' => $addr, 'why' => $b['why'] ?? '']); continue; }
      $usdSent = round($send / 1e8 * $pr, 2);
      coffre_json_rw(cutxo_index_file(), static function (&$s) use ($addr, $b) { if (isset($s[$addr])) { $s[$addr]['swAt'] = time(); $s[$addr]['swTx'] = $b['h']; $s[$addr]['bal'] = 0; $s[$addr]['due'] = 0; } });
      coffre_log('balaye', ['net' => $chain, 'addr' => $addr, 'to' => $dest, 'units' => $send / 1e8, 'usd' => $usdSent, 'fee' => $fee / 1e8, 'tx' => $b['h']]);
      $done[] = ['net' => $c['name'], 'addr' => $addr, 'usd' => $usdSent, 'tx' => $b['h']];
    }
  } finally { flock($lk, LOCK_UN); fclose($lk); }
  return ['ok' => true, 'done' => $done];
}

/** Admin : réseaux branchés + adresses. */
function cutxo_admin_view(): array {
  $nets = [];
  foreach (cutxo_chains() as $k => $c) $nets[] = ['net' => $k, 'name' => $c['name'], 'sym' => $c['sym'], 'ready' => cutxo_ready($k), 'dest' => cutxo_dest($k)];
  $addrs = [];
  foreach (coffre_json(cutxo_index_file()) as $a => $e) {
    $c = cutxo_chains()[(string) ($e['c'] ?? '')] ?? null;
    if (!$c) continue;
    $addrs[] = ['user' => (string) $e['u'], 'addr' => (string) $a, 'net' => $c['name'], 'sym' => $c['sym'], 'got' => (float) ($e['got'] ?? 0), 'bal' => round((int) ($e['bal'] ?? 0) / 1e8, 8), 'wait' => round((int) ($e['wait'] ?? 0) / 1e8, 8), 'at' => (int) ($e['at'] ?? 0)];
  }
  usort($addrs, static fn($a, $b) => $b['at'] <=> $a['at']);
  return ['nets' => $nets, 'on' => !empty(coffre_cfg()['utxo_on']), 'any' => cutxo_ready_chains() !== [], 'addrs' => array_slice($addrs, 0, 100)];
}
