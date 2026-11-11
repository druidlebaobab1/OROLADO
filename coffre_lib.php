<?php
/**
 * 2026-11-11 — COFFRE OROLADO : adresses de dépôt PROPRES au site, comme les grandes plateformes
 * (propriétaire : « tout rentre dans un coffre, personne ne peut me bloquer, n'importe quel montant, automatique »).
 *
 *  - Chaque joueur a SA propre adresse USDT (réseau TRON / TRC20), permanente. Il envoie n'importe quel montant,
 *    n'importe quand, sans rien taper ni coller : le site voit l'argent arriver (TronGrid) et crédite seul.
 *  - Les clés de ces adresses sont créées PAR LE SERVEUR (OpenSSL, courbe secp256k1) et gardées chiffrées
 *    (AES-256-GCM, clé maîtresse dans data/.env). Aucun prestataire au milieu : personne ne peut bloquer.
 *  - « Balayage » : dès qu'une adresse contient assez (réglable, 20 $ par défaut), le site envoie TOUT vers le
 *    coffre du propriétaire (son Trust Wallet, VAULT_TRON_ADDRESS). Le site ne garde jamais longtemps l'argent.
 *  - Les frais du réseau TRON (énergie ≈ 7 TRX par balayage) sont payés par un « réservoir TRX » (adresse du site
 *    que le propriétaire recharge en TRX) : il envoie juste ce qu'il faut à l'adresse du joueur avant le balayage.
 *  - Jamais deux crédits pour un même envoi (registre commun de tous les dépôts). Faux jetons « USDT » ignorés.
 *  - Éteint pour les joueurs tant que le propriétaire ne l'active pas (admin → 🏦 Coffre) ; l'admin peut tester avant.
 */

const COFFRE_N = 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'; // ordre de secp256k1
const COFFRE_MIN_CREDIT = 1.0;  // en dessous : poussière (« empoisonnement d'adresse »), jamais créditée
const COFFRE_SWEEP_DEFAULT = 20.0;

/* ===================== Outils cryptographiques (PHP pur + OpenSSL) ===================== */

/** Keccak-256 (celui d'Ethereum / TRON, PAS le SHA3-256 normalisé). */
function coffre_keccak256(string $in): string {
  static $rc = null, $rot = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44],
    $pil = [10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1];
  if ($rc === null) {
    $rc = [];
    foreach (['0000000000000001', '0000000000008082', '800000000000808a', '8000000080008000', '000000000000808b', '0000000080000001',
      '8000000080008081', '8000000000008009', '000000000000008a', '0000000000000088', '0000000080008009', '000000008000000a',
      '000000008000808b', '800000000000008b', '8000000000008089', '8000000000008003', '8000000000008002', '8000000000000080',
      '000000000000800a', '800000008000000a', '8000000080008081', '8000000000008080', '0000000080000001', '8000000080008008'] as $h)
      $rc[] = unpack('J', hex2bin($h))[1];
  }
  $rotl = static function (int $x, int $n): int { return $n === 0 ? $x : (($x << $n) | (($x >> (64 - $n)) & ((1 << $n) - 1))); };
  $rate = 136;
  $msg = $in . "\x01";
  while (strlen($msg) % $rate !== 0) $msg .= "\x00";
  $msg[strlen($msg) - 1] = chr(ord($msg[strlen($msg) - 1]) | 0x80);
  $s = array_fill(0, 25, 0);
  for ($off = 0; $off < strlen($msg); $off += $rate) {
    for ($i = 0; $i < 17; $i++) $s[$i] ^= unpack('P', substr($msg, $off + $i * 8, 8))[1];
    for ($round = 0; $round < 24; $round++) {
      $c = [];
      for ($x = 0; $x < 5; $x++) $c[$x] = $s[$x] ^ $s[$x + 5] ^ $s[$x + 10] ^ $s[$x + 15] ^ $s[$x + 20];
      for ($x = 0; $x < 5; $x++) {
        $d = $c[($x + 4) % 5] ^ $rotl($c[($x + 1) % 5], 1);
        for ($y = 0; $y < 25; $y += 5) $s[$y + $x] ^= $d;
      }
      $t = $s[1];
      for ($i = 0; $i < 24; $i++) { $j = $pil[$i]; $tmp = $s[$j]; $s[$j] = $rotl($t, $rot[$i]); $t = $tmp; }
      for ($y = 0; $y < 25; $y += 5) {
        $r = [$s[$y], $s[$y + 1], $s[$y + 2], $s[$y + 3], $s[$y + 4]];
        for ($x = 0; $x < 5; $x++) $s[$y + $x] = $r[$x] ^ ((~$r[($x + 1) % 5]) & $r[($x + 2) % 5]);
      }
      $s[0] ^= $rc[$round];
    }
  }
  $out = '';
  for ($i = 0; $i < 4; $i++) $out .= pack('P', $s[$i]);
  return $out;
}

function coffre_b58enc(string $bin): string {
  $alpha = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  $digits = [0];
  for ($i = 0; $i < strlen($bin); $i++) {
    $carry = ord($bin[$i]);
    for ($j = 0; $j < count($digits); $j++) { $carry += $digits[$j] << 8; $digits[$j] = $carry % 58; $carry = intdiv($carry, 58); }
    while ($carry > 0) { $digits[] = $carry % 58; $carry = intdiv($carry, 58); }
  }
  $out = '';
  for ($i = 0; $i < strlen($bin) && $bin[$i] === "\0"; $i++) $out .= '1';
  for ($i = count($digits) - 1; $i >= 0; $i--) $out .= $alpha[$digits[$i]];
  return $out;
}

function coffre_b58dec(string $s): string {
  $alpha = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  $bytes = [];
  for ($i = 0; $i < strlen($s); $i++) {
    $v = strpos($alpha, $s[$i]);
    if ($v === false) return '';
    $carry = $v;
    for ($j = 0; $j < count($bytes); $j++) { $carry += $bytes[$j] * 58; $bytes[$j] = $carry & 0xff; $carry >>= 8; }
    while ($carry > 0) { $bytes[] = $carry & 0xff; $carry >>= 8; }
  }
  for ($i = 0; $i < strlen($s) && $s[$i] === '1'; $i++) $bytes[] = 0;
  return implode('', array_map('chr', array_reverse($bytes)));
}

/** Adresse TRON (T…) → 21 octets (0x41 + 20), somme de contrôle vérifiée. '' si invalide. */
function coffre_addr_bin(string $a): string {
  if (!preg_match('/^T[1-9A-HJ-NP-Za-km-z]{33}$/', $a)) return '';
  $raw = coffre_b58dec($a);
  if (strlen($raw) !== 25 || $raw[0] !== "\x41") return '';
  if (substr(hash('sha256', hash('sha256', substr($raw, 0, 21), true), true), 0, 4) !== substr($raw, 21, 4)) return '';
  return substr($raw, 0, 21);
}

function coffre_addr_ok(string $a): bool { return coffre_addr_bin($a) !== ''; }

function coffre_addr_from_pub(string $x, string $y): string {
  $h = "\x41" . substr(coffre_keccak256(str_pad($x, 32, "\0", STR_PAD_LEFT) . str_pad($y, 32, "\0", STR_PAD_LEFT)), 12);
  return coffre_b58enc($h . substr(hash('sha256', hash('sha256', $h, true), true), 0, 4));
}

/** Soustraction de deux nombres de 32 octets (a ≥ b), gros-boutiste. */
function coffre_sub32(string $a, string $b): string {
  $out = ''; $borrow = 0;
  for ($i = 31; $i >= 0; $i--) {
    $v = ord($a[$i]) - ord($b[$i]) - $borrow;
    $borrow = $v < 0 ? 1 : 0;
    $out = chr(($v + 256) % 256) . $out;
  }
  return $out;
}

/** Signature d'une transaction TRON : signe sha256(raw_data) (= txID). Renvoie les 2 signatures possibles (v = 0 / 1). */
function coffre_sign(string $rawHex, string $txId, string $pem): array {
  $raw = hex2bin($rawHex);
  if ($raw === false || hash('sha256', $raw) !== strtolower($txId)) return [];
  if (!openssl_sign($raw, $der, $pem, OPENSSL_ALGO_SHA256)) return [];
  // DER : 30 len 02 lr r 02 ls s
  $p = 2; if (ord($der[1]) & 0x80) $p += ord($der[1]) & 0x7f;
  if (ord($der[$p]) !== 0x02) return [];
  $lr = ord($der[$p + 1]); $r = substr($der, $p + 2, $lr); $p += 2 + $lr;
  if (ord($der[$p]) !== 0x02) return [];
  $ls = ord($der[$p + 1]); $s = substr($der, $p + 2, $ls);
  $r = str_pad(ltrim($r, "\0"), 32, "\0", STR_PAD_LEFT);
  $s = str_pad(ltrim($s, "\0"), 32, "\0", STR_PAD_LEFT);
  $n = hex2bin(COFFRE_N);
  $half = hex2bin('7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0');
  if (strcmp($s, $half) > 0) $s = coffre_sub32($n, $s); // « s bas » (norme)
  $rs = bin2hex($r . $s);
  return [$rs . '1b', $rs . '1c']; // v = 27 / 28 (comme TronWeb)
}

/* ===================== Stockage des clés (chiffrées) ===================== */

function coffre_dir(): string {
  $d = orolado_data_dir() . '/coffre';
  if (!is_dir($d)) { @mkdir($d, 0700, true); @file_put_contents($d . '/.htaccess', "Require all denied\nDeny from all\n"); }
  return $d;
}

function coffre_master(): string {
  orolado_load_env();
  $k = trim((string) (getenv('COFFRE_MASTER_KEY') ?: ($_ENV['COFFRE_MASTER_KEY'] ?? '')));
  if ($k === '') {
    // Première fois : clé maîtresse créée et rangée dans data/.env (jamais dans GitHub, jamais affichée).
    $lk = @fopen(coffre_dir() . '/master.lock', 'c');
    if ($lk) flock($lk, LOCK_EX);
    $envF = orolado_data_dir() . '/.env';
    foreach ((array) @file($envF, FILE_IGNORE_NEW_LINES) as $l) if (preg_match('/^COFFRE_MASTER_KEY=(.+)$/', (string) $l, $m)) $k = trim($m[1]);
    if ($k === '') {
      $k = base64_encode(random_bytes(32));
      @file_put_contents($envF, "COFFRE_MASTER_KEY=" . $k . "\n", FILE_APPEND | LOCK_EX);
      @chmod($envF, 0600);
    }
    putenv('COFFRE_MASTER_KEY=' . $k);
    $_ENV['COFFRE_MASTER_KEY'] = $k;
    if ($lk) { flock($lk, LOCK_UN); fclose($lk); }
  }
  $bin = base64_decode($k, true);
  if ($bin === false || strlen($bin) !== 32) throw new RuntimeException('Clé maîtresse du coffre invalide');
  return $bin;
}

function coffre_enc(string $plain): string {
  $iv = random_bytes(12); $tag = '';
  $ct = openssl_encrypt($plain, 'aes-256-gcm', coffre_master(), OPENSSL_RAW_DATA, $iv, $tag);
  return base64_encode($iv . $tag . $ct);
}

function coffre_dec(string $box): string {
  $b = base64_decode($box, true);
  if ($b === false || strlen($b) < 29) return '';
  $p = openssl_decrypt(substr($b, 28), 'aes-256-gcm', coffre_master(), OPENSSL_RAW_DATA, substr($b, 0, 12), substr($b, 12, 16));
  return is_string($p) ? $p : '';
}

/** Nouvelle clé : ['addr' => T…, 'enc' => PEM chiffré]. */
function coffre_new_key(): array {
  $k = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'secp256k1']);
  if (!$k) throw new RuntimeException('OpenSSL : création de clé impossible');
  $det = openssl_pkey_get_details($k);
  openssl_pkey_export($k, $pem);
  $addr = coffre_addr_from_pub((string) $det['ec']['x'], (string) $det['ec']['y']);
  // Contrôle : la clé chiffrée se relit et redonne la même adresse (sinon on n'utilise jamais cette adresse).
  $enc = coffre_enc($pem);
  $back = openssl_pkey_get_private(coffre_dec($enc));
  $d2 = $back ? openssl_pkey_get_details($back) : null;
  if (!$d2 || coffre_addr_from_pub((string) $d2['ec']['x'], (string) $d2['ec']['y']) !== $addr || !coffre_addr_ok($addr)) throw new RuntimeException('Contrôle de clé échoué');
  return ['addr' => $addr, 'enc' => $enc];
}

function coffre_json_rw(string $file, callable $fn) {
  $fp = @fopen($file, 'c+');
  if (!$fp) throw new RuntimeException('Écriture impossible : ' . basename($file));
  flock($fp, LOCK_EX);
  try {
    $raw = stream_get_contents($fp);
    $st = json_decode((string) $raw, true);
    if (!is_array($st)) $st = [];
    $before = $st;
    $ret = $fn($st);
    if ($st !== $before) { ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($st)); fflush($fp); }
    return $ret;
  } finally { flock($fp, LOCK_UN); fclose($fp); }
}

function coffre_json(string $file): array {
  $j = json_decode((string) @file_get_contents($file), true);
  return is_array($j) ? $j : [];
}

function coffre_index_file(): string { return coffre_dir() . '/index.json'; }
function coffre_user_file(string $uid): string { return coffre_dir() . '/w_' . sha1('coffre|' . $uid) . '.json'; }
function coffre_cfg(): array { return coffre_json(coffre_dir() . '/cfg.json') + ['on' => false, 'min' => COFFRE_SWEEP_DEFAULT]; }
function coffre_cfg_set(array $patch): array { return coffre_json_rw(coffre_dir() . '/cfg.json', static function (&$st) use ($patch) { $st = array_merge($st, $patch); return $st; }); }

/** Adresse du coffre du propriétaire (destination du balayage) — son Trust Wallet. */
function coffre_dest(): string {
  orolado_load_env();
  $a = trim((string) (getenv('VAULT_TRON_ADDRESS') ?: ($_ENV['VAULT_TRON_ADDRESS'] ?? '')));
  return coffre_addr_ok($a) ? $a : '';
}

function coffre_ready(): bool {
  return coffre_dest() !== '' && function_exists('orolado_trongrid_key') && orolado_trongrid_key() !== '' && function_exists('openssl_pkey_new');
}

/** Actif pour ce joueur ? (allumé par le propriétaire, ou compte admin pour tester avant). */
function coffre_on_for(array $me): bool {
  if (!coffre_ready()) return false;
  if (!empty(coffre_cfg()['on'])) return true;
  $role = strtolower((string) ($me['role'] ?? ''));
  return in_array($role, ['admin', 'owner', 'superadmin'], true) || (string) ($me['id'] ?? '') === 'admin_master';
}

/** Adresse permanente du joueur (créée la 1re fois). */
function coffre_addr_for(string $uid): string {
  if ($uid === '') return '';
  $f = coffre_user_file($uid);
  $have = coffre_json($f);
  if (!empty($have['addr'])) return (string) $have['addr'];
  $addr = coffre_json_rw($f, static function (&$st) use ($uid) {
    if (!empty($st['addr'])) return (string) $st['addr'];
    $k = coffre_new_key();
    $st = ['uid' => $uid, 'addr' => $k['addr'], 'enc' => $k['enc'], 'at' => date('c')];
    return $k['addr'];
  });
  coffre_json_rw(coffre_index_file(), static function (&$st) use ($addr, $uid) {
    if (!isset($st[$addr])) $st[$addr] = ['u' => $uid, 'at' => time(), 'open' => time(), 'seen' => 0, 'due' => 0, 'got' => 0];
  });
  return $addr;
}

function coffre_key_of(string $addr): string {
  $ix = coffre_json(coffre_index_file());
  if ($addr === coffre_gas()['addr']) return coffre_dec((string) coffre_gas()['enc']);
  $uid = (string) ($ix[$addr]['u'] ?? '');
  if ($uid === '') return '';
  $w = coffre_json(coffre_user_file($uid));
  return ((string) ($w['addr'] ?? '') === $addr) ? coffre_dec((string) ($w['enc'] ?? '')) : '';
}

/** Réservoir TRX (paye les frais du réseau pour les balayages). */
function coffre_gas(): array {
  $f = coffre_dir() . '/gas.json';
  $g = coffre_json($f);
  if (!empty($g['addr'])) return $g;
  return coffre_json_rw($f, static function (&$st) {
    if (empty($st['addr'])) { $k = coffre_new_key(); $st = ['addr' => $k['addr'], 'enc' => $k['enc'], 'at' => date('c')]; }
    return $st;
  });
}

/* ===================== TronGrid ===================== */

function coffre_tg(string $path, ?array $body = null): ?array {
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_TG_API']) && is_callable($GLOBALS['OROLADO_FAKE_TG_API'])) return ($GLOBALS['OROLADO_FAKE_TG_API'])($path, $body);
  $key = orolado_trongrid_key();
  if (!function_exists('curl_init')) return null;
  $ch = curl_init('https://api.trongrid.io' . $path);
  $h = ['Accept: application/json', 'Content-Type: application/json'];
  if ($key !== '') $h[] = 'TRON-PRO-API-KEY: ' . $key;
  $o = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_HTTPHEADER => $h];
  if ($body !== null) { $o[CURLOPT_POST] = true; $o[CURLOPT_POSTFIELDS] = json_encode($body); }
  curl_setopt_array($ch, $o);
  $raw = curl_exec($ch); $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if ($code !== 200 || !is_string($raw)) return null;
  $j = json_decode($raw, true);
  return is_array($j) ? $j : null;
}

/** Soldes réels : ['trx' => TRX, 'usdt' => USDT, 'active' => compte activé ?] ou null (réseau). */
function coffre_balances(string $addr): ?array {
  $r = coffre_tg('/v1/accounts/' . $addr);
  if (!is_array($r) || empty($r['success'])) return null;
  $a = $r['data'][0] ?? null;
  if (!is_array($a)) return ['trx' => 0.0, 'usdt' => 0.0, 'active' => false];
  $usdt = 0.0;
  foreach ((array) ($a['trc20'] ?? []) as $t) if (is_array($t) && isset($t[OROLADO_USDT_TRC20])) $usdt = (float) $t[OROLADO_USDT_TRC20] / 1e6;
  return ['trx' => (float) ($a['balance'] ?? 0) / 1e6, 'usdt' => $usdt, 'active' => true];
}

/** Signe et diffuse une transaction préparée par TronGrid. */
function coffre_broadcast(array $tx, string $pem): array {
  $sigs = coffre_sign((string) ($tx['raw_data_hex'] ?? ''), (string) ($tx['txID'] ?? ''), $pem);
  if (!$sigs) return ['ok' => false, 'why' => 'signature'];
  $last = null;
  foreach ($sigs as $sig) {
    $t = $tx; $t['signature'] = [$sig];
    $r = coffre_tg('/wallet/broadcasttransaction', $t);
    $last = $r;
    if (is_array($r) && !empty($r['result'])) return ['ok' => true, 'txid' => (string) $tx['txID']];
    if (strtoupper((string) ($r['code'] ?? '')) !== 'SIGERROR') break; // mauvaise parité de signature → on essaie l'autre
  }
  $msg = (string) ($last['message'] ?? '');
  $dec = @hex2bin($msg);
  return ['ok' => false, 'why' => (string) ($last['code'] ?? 'réseau') . ' ' . substr(($dec !== false && $dec !== '' ? $dec : $msg), 0, 120)];
}

function coffre_send_trx(string $from, string $to, int $sun): array {
  $pem = coffre_key_of($from);
  if ($pem === '') return ['ok' => false, 'why' => 'clé'];
  $tx = coffre_tg('/wallet/createtransaction', ['owner_address' => $from, 'to_address' => $to, 'amount' => $sun, 'visible' => true]);
  if (!is_array($tx) || empty($tx['txID'])) return ['ok' => false, 'why' => 'création ' . substr(json_encode($tx), 0, 120)];
  return coffre_broadcast($tx, $pem);
}

function coffre_usdt_param(string $to, int $units): string {
  $bin = coffre_addr_bin($to);
  return str_pad(bin2hex(substr($bin, 1)), 64, '0', STR_PAD_LEFT) . str_pad(dechex($units), 64, '0', STR_PAD_LEFT);
}

/** Énergie nécessaire pour envoyer les USDT (estimation du réseau), en « sun » de TRX à prévoir. */
function coffre_usdt_cost_sun(string $from, string $to, int $units): int {
  $r = coffre_tg('/wallet/triggerconstantcontract', ['owner_address' => $from, 'contract_address' => OROLADO_USDT_TRC20,
    'function_selector' => 'transfer(address,uint256)', 'parameter' => coffre_usdt_param($to, $units), 'visible' => true]);
  $energy = (int) ($r['energy_used'] ?? 0);
  if ($energy <= 0) $energy = 131000; // prudence : coût maximal habituel
  $fee = 100;
  $p = coffre_tg('/wallet/getchainparameters');
  foreach ((array) ($p['chainParameter'] ?? []) as $c) if (($c['key'] ?? '') === 'getEnergyFee') $fee = max(1, (int) ($c['value'] ?? 100));
  return (int) ceil($energy * $fee * 1.15) + 1_000_000; // +15 % et 1 TRX de marge (bande passante)
}

function coffre_send_usdt(string $from, string $to, int $units, int $feeLimitSun): array {
  $pem = coffre_key_of($from);
  if ($pem === '') return ['ok' => false, 'why' => 'clé'];
  $r = coffre_tg('/wallet/triggersmartcontract', ['owner_address' => $from, 'contract_address' => OROLADO_USDT_TRC20,
    'function_selector' => 'transfer(address,uint256)', 'parameter' => coffre_usdt_param($to, $units), 'fee_limit' => $feeLimitSun, 'call_value' => 0, 'visible' => true]);
  $tx = $r['transaction'] ?? null;
  if (!is_array($tx) || empty($tx['txID']) || empty($r['result']['result'])) return ['ok' => false, 'why' => 'création ' . substr(json_encode($r), 0, 120)];
  return coffre_broadcast($tx, $pem);
}

/* ===================== Dépôts : adresse, détection, crédit ===================== */

function coffre_parent_id(string $uid): string { return 'own_' . preg_replace('/[^a-zA-Z0-9]/', '', $uid) . '_tron'; }

/** Écran de dépôt : l'adresse permanente du joueur (même forme de réponse que les adresses OxaPay). */
function coffre_invoice(array $me, float $amount): array {
  $uid = (string) ($me['id'] ?? '');
  try { $addr = coffre_addr_for($uid); } catch (Throwable $e) { orolado_health_event('Dépôts', 'Coffre : adresse impossible à créer (' . $e->getMessage() . ').', 'error'); return ['ok' => false, 'server' => true, 'reason' => 'Réessayez dans un instant', 'code' => 'coffre']; }
  $pid = coffre_parent_id($uid);
  $now = microtime(true);
  with_db_lock(function ($box) use ($pid, $uid, $addr, $now) {
    foreach (($box->db['deposits'] ?? []) as $i => $d) {
      if (is_array($d) && (string) ($d['id'] ?? '') === $pid) { $box->db['deposits'][$i]['openedAt'] = $now; $box->db['deposits'][$i]['address'] = $addr; return ['ok' => true]; }
    }
    $box->db['deposits'][] = ['id' => $pid, 'ref' => $pid, 'userId' => $uid, 'operator' => 'coffre', 'kind' => 'own', 'fam' => 'tron',
      'network' => 'TRC20', 'coin' => 'usdt_trc20', 'status' => 'STATIC', 'amount' => 0, 'currency' => 'USD', 'address' => $addr, 'openedAt' => $now, 'at' => date('c')];
    return ['ok' => true];
  });
  coffre_json_rw(coffre_index_file(), static function (&$st) use ($addr) { if (isset($st[$addr])) $st[$addr]['open'] = time(); });
  $min = function_exists('orolado_oxapay_min_usd') ? orolado_oxapay_min_usd('usdt_trc20') : 5.0;
  return ['ok' => true, 'server' => true, 'orderId' => $pid, 'trackId' => '', 'address' => $addr, 'amount' => orolado_money($amount), 'payAmount' => orolado_money($amount),
    'payCurrency' => 'USDT', 'network' => 'TRC20', 'coin' => 'usdt_trc20', 'qr' => '', 'expiredAt' => 0, 'memo' => '', 'reused' => true, 'static' => true, 'minUsd' => $min, 'own' => true];
}

/** Crédite un envoi reçu sur l'adresse d'un joueur (un envoi = un numéro unique, jamais deux fois). */
function coffre_credit(string $uid, string $addr, array $tx): array {
  $h = strtolower((string) ($tx['tx_hash'] ?? ''));
  $usd = orolado_money($tx['amount'] ?? 0);
  if (!preg_match('/^[0-9a-f]{64}$/', $h) || $usd + 0.0001 < COFFRE_MIN_CREDIT) return ['ok' => false, 'code' => 'small'];
  $lk = @fopen(coffre_dir() . '/credit.lock', 'c');
  if ($lk) flock($lk, LOCK_EX);
  try {
    if (orolado_txid_already_used(load_db(orolado_data_file()), $h)) return ['ok' => true, 'duplicate' => true];
    $pid = coffre_parent_id($uid);
    $cid = $pid . '_x' . substr(sha1($h), 0, 12);
    orolado_deposit_append_locked(['id' => $cid, 'ref' => $cid, 'parentId' => $pid, 'userId' => $uid, 'operator' => 'coffre', 'kind' => 'own',
      'network' => 'TRC20', 'coin' => 'usdt_trc20', 'status' => 'PENDING', 'amount' => $usd, 'currency' => 'USD', 'txid' => $h, 'txids' => [$h],
      'from' => (string) ($tx['from'] ?? ''), 'address' => $addr, 'at' => date('c')]);
    if (function_exists('supabase_insert_deposit')) {
      try { supabase_insert_deposit(['id' => $cid, 'user_id' => orolado_balance_uuid(load_db(orolado_data_file()), $uid), 'amount' => $usd, 'status' => 'PENDING', 'reference' => $cid, 'operator' => 'coffre']); } catch (Throwable $e) { /* le crédit n'en dépend pas */ }
    }
    $paid = credit_paid_deposit(['ref' => $cid, 'amount' => $usd, 'extId' => $h, 'paid' => true, 'creditReceived' => true, 'allowSmall' => true, 'operator' => 'coffre']);
    if (!empty($paid['ok']) && empty($paid['duplicate'])) {
      coffre_json_rw(coffre_index_file(), static function (&$st) use ($addr, $usd) { if (isset($st[$addr])) { $st[$addr]['due'] = $st[$addr]['due'] ?: time(); $st[$addr]['got'] = round((float) ($st[$addr]['got'] ?? 0) + $usd, 6); } });
      try { $vt = orolado_crypto_vault(load_db(orolado_data_file()), $uid); supabase_sync_real_min($uid, $vt['real'] ?? 0); } catch (Throwable $e) { /* ignore */ }
      orolado_oxapay_log('coffre_credit', ['uid' => $uid, 'amount' => $usd, 'tx' => substr($h, 0, 16)]);
      if ($usd >= 500) orolado_health_event('Dépôts', '🏦 Gros dépôt reçu sur le coffre : ' . $usd . ' $ (joueur ' . $uid . '). Il partira vers ton Trust Wallet au prochain balayage.', 'info');
    }
    return ['ok' => !empty($paid['ok']), 'duplicate' => !empty($paid['duplicate']), 'amount' => $usd, 'id' => $cid, 'code' => (string) ($paid['reason'] ?? '')];
  } finally { if ($lk) { flock($lk, LOCK_UN); fclose($lk); } }
}

/** Regarde une adresse sur la blockchain et crédite les envois nouveaux. */
function coffre_scan_addr(string $addr, string $uid, int $sinceTs): int {
  $txs = orolado_trongrid_usdt_in($addr, max(0, $sinceTs - 3600) * 1000);
  coffre_json_rw(coffre_index_file(), static function (&$st) use ($addr) { if (isset($st[$addr])) $st[$addr]['seen'] = time(); });
  if (!$txs) return 0;
  $n = 0;
  foreach ($txs as $tx) {
    if (orolado_txid_already_used(load_db(orolado_data_file()), strtolower($tx['tx_hash']))) continue;
    $r = coffre_credit($uid, $addr, $tx);
    if (!empty($r['ok']) && empty($r['duplicate'])) $n++;
  }
  return $n;
}

/**
 * Ronde : on regarde d'abord les adresses dont l'écran de dépôt vient d'être ouvert.
 * Ouvert < 2 h : toutes les 30 s · < 2 jours : 5 min · < 30 jours : 1 h · sinon : 1 fois par jour.
 */
function coffre_scan(int $max = 25, float $budget = 8.0): int {
  if (!coffre_ready()) return 0;
  $lk = @fopen(coffre_dir() . '/scan.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return 0; }
  $n = 0;
  try {
    $now = time(); $t0 = microtime(true);
    $cand = [];
    foreach (coffre_json(coffre_index_file()) as $addr => $e) {
      $age = $now - (int) ($e['open'] ?? 0);
      $every = $age < 7200 ? 30 : ($age < 172800 ? 300 : ($age < 2592000 ? 3600 : 86400));
      $late = $now - (int) ($e['seen'] ?? 0) - $every;
      if ($late >= 0) $cand[] = [$late / $every, (string) $addr, $e];
    }
    usort($cand, static fn($a, $b) => $b[0] <=> $a[0]);
    foreach ($cand as $i => $c) {
      if ($i >= $max || microtime(true) - $t0 > $budget) break;
      $n += coffre_scan_addr($c[1], (string) $c[2]['u'], (int) ($c[2]['at'] ?? 0));
    }
  } finally { flock($lk, LOCK_UN); fclose($lk); }
  return $n;
}

/** État pour l'écran du joueur (son téléphone demande toutes les 6 s). */
function coffre_status(array $dep, string $uid): array {
  $pid = (string) ($dep['id'] ?? '');
  $opened = (float) ($dep['openedAt'] ?? 0);
  $sum = function () use ($pid, $opened): float {
    $s = 0.0;
    foreach ((load_db(orolado_data_file())['deposits'] ?? []) as $c) {
      if (!is_array($c) || (string) ($c['parentId'] ?? '') !== $pid) continue;
      if (!in_array(strtoupper((string) ($c['status'] ?? '')), ['COMPLETED', 'PAID'], true)) continue;
      $ts = isset($c['paidTs']) ? (float) $c['paidTs'] : (float) (strtotime((string) ($c['paidAt'] ?? $c['at'] ?? '')) ?: 0);
      if ($ts + 5 < $opened) continue;
      $s += (float) ($c['amount'] ?? 0);
    }
    return orolado_money($s);
  };
  $got = $sum();
  $addr = (string) ($dep['address'] ?? '');
  if ($got <= 0 && $addr !== '' && orolado_rate_ok('coffre_st', $uid, 1, 15)) {
    $e = coffre_json(coffre_index_file())[$addr] ?? null;
    if ($e) { coffre_scan_addr($addr, $uid, (int) ($e['at'] ?? 0)); $got = $sum(); }
  }
  if ($got > 0) return ['ok' => true, 'paid' => true, 'success' => true, 'amount' => $got, 'vault' => orolado_crypto_vault(load_db(orolado_data_file()), $uid)];
  return ['ok' => true, 'pending' => true];
}

/* ===================== Balayage vers le coffre du propriétaire ===================== */

function coffre_log(string $kind, array $row): void {
  @file_put_contents(coffre_dir() . '/journal.log', json_encode(['t' => date('c'), 'k' => $kind] + $row, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
}

function coffre_journal(int $n = 40): array {
  $lines = @file(coffre_dir() . '/journal.log', FILE_IGNORE_NEW_LINES) ?: [];
  $out = [];
  foreach (array_reverse(array_slice($lines, -400)) as $l) { $j = json_decode($l, true); if (is_array($j)) $out[] = $j; if (count($out) >= $n) break; }
  return $out;
}

/**
 * Envoie l'argent des adresses des joueurs vers le coffre (Trust Wallet du propriétaire).
 * Étape 1 : si l'adresse n'a pas assez de TRX pour les frais, le réservoir lui en envoie juste assez.
 * Étape 2 (ronde suivante, quand le TRX est arrivé) : tout l'USDT part vers le coffre.
 */
function coffre_sweep(bool $force = false, int $max = 3): array {
  $dest = coffre_dest();
  if (!coffre_ready()) return ['ok' => false, 'why' => 'pas prêt'];
  $lk = @fopen(coffre_dir() . '/sweep.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return ['ok' => false, 'why' => 'déjà en cours']; }
  $done = [];
  try {
    $cfg = coffre_cfg();
    $min = max(1.0, (float) ($cfg['min'] ?? COFFRE_SWEEP_DEFAULT));
    $gas = coffre_gas();
    $now = time();
    $ix = coffre_json(coffre_index_file());
    $due = array_filter($ix, static fn($e) => (int) ($e['due'] ?? 0) > 0);
    uasort($due, static fn($a, $b) => ((int) $a['due']) <=> ((int) $b['due']));
    $k = 0;
    foreach ($due as $addr => $e) {
      if ($k >= $max) break;
      if (!$force && $now - (int) ($e['tried'] ?? 0) < 90) continue;
      $bal = coffre_balances((string) $addr);
      if ($bal === null) continue;
      coffre_json_rw(coffre_index_file(), static function (&$st) use ($addr, $now, $bal) { if (isset($st[$addr])) { $st[$addr]['tried'] = $now; $st[$addr]['bal'] = $bal['usdt']; } });
      if ($bal['usdt'] < 0.5) { // déjà vide (balayé) : plus rien à faire
        coffre_json_rw(coffre_index_file(), static function (&$st) use ($addr) { if (isset($st[$addr])) $st[$addr]['due'] = 0; });
        continue;
      }
      // Petit montant : on attend d'avoir le minimum (frais), sauf s'il dort depuis 24 h.
      if (!$force && $bal['usdt'] < $min && $now - (int) $e['due'] < 86400) continue;
      $k++;
      $units = (int) floor($bal['usdt'] * 1e6 + 0.5);
      $need = coffre_usdt_cost_sun((string) $addr, $dest, $units);
      $have = (int) round($bal['trx'] * 1e6);
      if ($have < $need) {
        $send = $need - $have + 300_000;
        $gb = coffre_balances((string) $gas['addr']);
        if (!$gb || $gb['trx'] * 1e6 < $send + 1_200_000) {
          coffre_log('reservoir_vide', ['addr' => $addr, 'need' => round($send / 1e6, 2)]);
          if (orolado_rate_ok('coffre_gas_warn', 'x', 1, 3600)) orolado_health_event('Dépôts', '🏦 Réservoir TRX presque vide : ' . (int) (($gb['trx'] ?? 0)) . ' TRX. Envoie des TRX à ' . $gas['addr'] . ' (admin → 🏦 Coffre) pour que l’argent des joueurs parte vers ton Trust Wallet. Les dépôts des joueurs, eux, sont crédités normalement.', 'warn');
          break;
        }
        $r = coffre_send_trx((string) $gas['addr'], (string) $addr, $send);
        coffre_log('frais', ['addr' => $addr, 'trx' => round($send / 1e6, 2), 'ok' => $r['ok'], 'tx' => $r['txid'] ?? '', 'why' => $r['why'] ?? '']);
        $done[] = ['addr' => $addr, 'step' => 'frais', 'ok' => $r['ok'], 'why' => $r['why'] ?? ''];
        continue; // le transfert USDT partira au passage suivant, une fois le TRX arrivé
      }
      $r = coffre_send_usdt((string) $addr, $dest, $units, $need);
      coffre_log('balayage', ['addr' => $addr, 'usdt' => $units / 1e6, 'to' => $dest, 'ok' => $r['ok'], 'tx' => $r['txid'] ?? '', 'why' => $r['why'] ?? '']);
      $done[] = ['addr' => $addr, 'step' => 'balayage', 'usdt' => $units / 1e6, 'ok' => $r['ok'], 'why' => $r['why'] ?? ''];
      if ($r['ok']) {
        coffre_json_rw(coffre_index_file(), static function (&$st) use ($addr, $now) { if (isset($st[$addr])) { $st[$addr]['due'] = 0; $st[$addr]['swept'] = $now; } });
      } elseif (orolado_rate_ok('coffre_sweep_fail', (string) $addr, 1, 3600)) {
        orolado_health_event('Dépôts', '🏦 Balayage refusé pour ' . $addr . ' : ' . ($r['why'] ?? '') . '. Nouvel essai automatique.', 'warn');
      }
    }
  } finally { flock($lk, LOCK_UN); fclose($lk); }
  return ['ok' => true, 'done' => $done];
}

/* ===================== Admin ===================== */

function coffre_admin_view(): array {
  $cfg = coffre_cfg();
  $ix = coffre_json(coffre_index_file());
  $gas = coffre_ready() ? coffre_gas() : [];
  $gb = !empty($gas['addr']) ? coffre_balances((string) $gas['addr']) : null;
  $db = load_db(orolado_data_file());
  $waiting = 0.0; $got = 0.0; $rows = [];
  foreach ($ix as $addr => $e) {
    $got += (float) ($e['got'] ?? 0);
    if ((int) ($e['due'] ?? 0) > 0) $waiting += (float) ($e['bal'] ?? 0);
  }
  foreach (array_reverse($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || (string) ($d['operator'] ?? '') !== 'coffre' || (string) ($d['kind'] ?? '') !== 'own' || (string) ($d['parentId'] ?? '') === '') continue;
    $u = $db['users'][(string) ($d['userId'] ?? '')] ?? [];
    $rows[] = ['at' => (string) ($d['at'] ?? ''), 'user' => (string) ($u['displayName'] ?? $u['email'] ?? $d['userId'] ?? ''), 'amount' => (float) ($d['amount'] ?? 0), 'hash' => (string) ($d['txid'] ?? ''), 'status' => (string) ($d['status'] ?? '')];
    if (count($rows) >= 40) break;
  }
  return ['ok' => true, 'ready' => coffre_ready(), 'on' => !empty($cfg['on']), 'min' => (float) ($cfg['min'] ?? COFFRE_SWEEP_DEFAULT), 'dest' => coffre_dest(),
    'tronKey' => function_exists('orolado_trongrid_key') && orolado_trongrid_key() !== '', 'gas' => (string) ($gas['addr'] ?? ''), 'gasTrx' => $gb ? round($gb['trx'], 2) : null,
    'addresses' => count($ix), 'credited' => round($got, 2), 'waiting' => round($waiting, 2), 'deposits' => $rows, 'journal' => coffre_journal(30)];
}
