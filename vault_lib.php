<?php
/**
 * 2026-11-11 — LE COFFRE DU PROPRIÉTAIRE (demande : « arrêter OxaPay, un coffre où ça dépose, comme les grandes plateformes »).
 *
 * Les joueurs envoient leurs USDT TRC20 DIRECTEMENT sur l'adresse du portefeuille du propriétaire (Trust Wallet).
 * Personne au milieu : aucun prestataire ne peut bloquer, retenir ou changer une clé. Le site ne garde AUCUNE clé
 * secrète du portefeuille (jamais les 12 mots) : il ne fait que LIRE la blockchain TRON (clé TronGrid) pour voir
 * l'argent arriver, et crédite le bon joueur.
 *
 * Reconnaître le joueur (une seule adresse pour tout le monde) :
 *  1. Montant unique : le joueur demande 50 $ → le site lui demande d'envoyer 50,0137 USDT (centimes en plus, propres
 *     à sa demande). L'envoi de 50,0137 USDT reçu dans le coffre = ce joueur. Crédité automatiquement.
 *  2. Montant un peu différent (frais retirés par son application / plateforme) : s'il n'y a qu'UNE demande ouverte
 *     qui correspond (montant proche, faite avant l'envoi), elle est créditée automatiquement.
 *  3. Sinon le joueur colle le numéro de la transaction : accepté seulement s'il a lui-même une demande ouverte qui
 *     correspond à ce montant. Sinon le propriétaire est prévenu (« argent reçu dans le coffre, joueur non reconnu »)
 *     et l'attribue d'un clic dans l'admin.
 * Un envoi = un numéro unique, jamais crédité deux fois (même registre que tous les autres dépôts).
 *
 * Réglage : admin → 🔑 Clés & connexions → « Adresse du coffre USDT (TRON) ». Vide = l'ancien système (OxaPay) reprend.
 */

const VAULT_REQ_TTL = 86400;       // une demande reste « ouverte » 24 h
const VAULT_EXACT_WINDOW = 259200; // un envoi au centime près est reconnu jusqu'à 3 jours après la demande

function vault_base58_ok(string $a): bool {
  $alpha = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  $bytes = [];
  for ($i = 0, $n = strlen($a); $i < $n; $i++) {
    $v = strpos($alpha, $a[$i]);
    if ($v === false) return false;
    $carry = $v;
    for ($j = 0; $j < count($bytes); $j++) { $carry += $bytes[$j] * 58; $bytes[$j] = $carry & 0xff; $carry >>= 8; }
    while ($carry > 0) { $bytes[] = $carry & 0xff; $carry >>= 8; }
  }
  for ($i = 0; $i < strlen($a) && $a[$i] === '1'; $i++) $bytes[] = 0;
  $raw = implode('', array_map('chr', array_reverse($bytes)));
  if (strlen($raw) !== 25 || $raw[0] !== "\x41") return false;
  return substr(hash('sha256', hash('sha256', substr($raw, 0, 21), true), true), 0, 4) === substr($raw, 21, 4);
}

/** Vraie adresse TRON (commence par T, 34 caractères, somme de contrôle juste : une faute de frappe est refusée). */
function vault_tron_addr_ok(string $a): bool {
  return (bool) preg_match('/^T[1-9A-HJ-NP-Za-km-z]{33}$/', $a) && vault_base58_ok($a);
}

function vault_tron_addr(): string {
  orolado_load_env();
  $a = trim((string) (getenv('VAULT_TRON_ADDRESS') ?: ($_ENV['VAULT_TRON_ADDRESS'] ?? '')));
  return vault_tron_addr_ok($a) ? $a : '';
}

/** Le coffre est actif quand son adresse ET la clé TronGrid (pour voir l'argent arriver) sont réglées. */
function vault_enabled(): bool {
  return false; // 2026-11-11 : système « montant exact / numéro de transaction » refusé par le propriétaire — désactivé pour toujours (remplacé par coffre_lib.php).
  return vault_tron_addr() !== '' && function_exists('orolado_trongrid_key') && orolado_trongrid_key() !== '';
}

function vault_dep_is_req(array $d): bool {
  return (string) ($d['kind'] ?? '') === 'vault' && (string) ($d['parentId'] ?? '') === '';
}

function vault_dep_ts(array $d): int {
  return (int) (strtotime((string) ($d['at'] ?? '')) ?: 0);
}

/** Demande de dépôt : adresse du coffre + montant exact (unique) à envoyer. Même forme de réponse que les factures OxaPay. */
function vault_invoice(array $me, float $amount): array {
  $addr = vault_tron_addr();
  $uid = (string) ($me['id'] ?? '');
  if ($addr === '' || $uid === '') return ['ok' => false, 'server' => true, 'reason' => 'Dépôt indisponible', 'code' => 'vault'];
  $min = function_exists('orolado_oxapay_min_usd') ? orolado_oxapay_min_usd('usdt_trc20') : 5.0;
  $amount = orolado_money($amount);
  if ($amount + 0.0001 < $min) $amount = $min;
  if (orolado_deposit_over_cap($amount)) return ['ok' => false, 'server' => true, 'reason' => 'Montant trop élevé', 'code' => 'cap'];
  $now = time();
  $out = null;
  with_db_lock(function ($box) use ($uid, $amount, $addr, $now, &$out) {
    $taken = [];
    $reuse = -1;
    foreach (($box->db['deposits'] ?? []) as $i => $d) {
      if (!is_array($d) || !vault_dep_is_req($d)) continue;
      $st = strtoupper((string) ($d['status'] ?? ''));
      $age = $now - vault_dep_ts($d);
      if ($age < VAULT_EXACT_WINDOW) $taken[number_format((float) ($d['payAmount'] ?? 0), 4, '.', '')] = true;
      // Même joueur, même montant, demande encore ouverte, même coffre : on redonne le même montant exact.
      if ($st === 'UNFINISHED' && (string) ($d['userId'] ?? '') === $uid && abs((float) ($d['amount'] ?? 0) - $amount) < 0.001
        && $age < VAULT_REQ_TTL - 3600 && (string) ($d['address'] ?? '') === $addr) $reuse = $i;
    }
    if ($reuse >= 0) {
      $box->db['deposits'][$reuse]['openedAt'] = microtime(true);
      $out = $box->db['deposits'][$reuse];
      return ['ok' => true];
    }
    $pay = 0.0;
    for ($k = 0; $k < 400; $k++) {
      $cents = random_int(11, 999); // 0,0011 à 0,0999 USDT en plus : invisible pour le joueur, unique pour le site
      $try = number_format($amount + $cents / 10000, 4, '.', '');
      if (!isset($taken[$try])) { $pay = (float) $try; break; }
    }
    if ($pay <= 0) return ['ok' => true, 'skip_write' => true];
    $id = 'vlt_' . preg_replace('/[^a-zA-Z0-9]/', '', $uid) . '_' . bin2hex(random_bytes(5));
    $row = [
      'id' => $id, 'ref' => $id, 'userId' => $uid, 'operator' => 'coffre', 'kind' => 'vault',
      'network' => 'TRC20', 'coin' => 'usdt_trc20', 'status' => 'UNFINISHED',
      'amount' => $amount, 'payAmount' => $pay, 'currency' => 'USD', 'address' => $addr,
      'openedAt' => microtime(true), 'clientIp' => orolado_request_ip(), 'userAgent' => orolado_request_ua(), 'at' => date('c', $now),
    ];
    $box->db['deposits'][] = $row;
    $out = $row;
    return ['ok' => true];
  });
  if (!$out) return ['ok' => false, 'server' => true, 'reason' => 'Réessayez dans un instant', 'code' => 'busy'];
  return [
    'ok' => true, 'server' => true, 'vault' => true, 'orderId' => (string) $out['id'], 'trackId' => '',
    'address' => $addr, 'amount' => orolado_money($out['amount']), 'payAmount' => (float) $out['payAmount'],
    'payExact' => number_format((float) $out['payAmount'], 4, '.', ''), 'payCurrency' => 'USDT', 'network' => 'TRC20',
    'coin' => 'usdt_trc20', 'qr' => '', 'expiredAt' => vault_dep_ts($out) + VAULT_REQ_TTL, 'memo' => '', 'minUsd' => $min,
  ];
}

function vault_unmatched_file(): string { return orolado_data_dir() . '/vault_unmatched.json'; }
function vault_unmatched(): array {
  $j = json_decode((string) @file_get_contents(vault_unmatched_file()), true);
  return is_array($j) ? $j : [];
}
function vault_unmatched_save(array $u): void {
  // On garde 60 jours.
  $cut = time() - 60 * 86400;
  foreach ($u as $h => $r) if ((int) ($r['ts'] ?? 0) < $cut) unset($u[$h]);
  @file_put_contents(vault_unmatched_file(), json_encode($u), LOCK_EX);
}

/** Tolérance pour un montant « presque juste » (frais retirés par l'application d'envoi). */
function vault_close(float $got, float $want): bool {
  return $got + max(3.0, 0.03 * $want) >= $want && $got <= $want * 1.10 + 1.0;
}

/**
 * Crédite un envoi reçu dans le coffre sur une demande donnée. Le montant crédité = ce qui est VRAIMENT arrivé.
 * L'envoi devient un « dépôt enfant » de la demande (numéro unique par envoi : jamais deux fois).
 */
function vault_credit(array $req, array $tx, string $how): array {
  $h = strtolower((string) ($tx['tx_hash'] ?? ''));
  $usd = orolado_money($tx['amount'] ?? 0);
  if ($h === '' || $usd <= 0) return ['ok' => false, 'code' => 'tx'];
  $lk = @fopen(orolado_data_dir() . '/vault_credit.lock', 'c');
  if ($lk) flock($lk, LOCK_EX);
  try {
    if (orolado_txid_already_used(load_db(orolado_data_file()), $h)) return ['ok' => true, 'duplicate' => true];
    $reqId = (string) ($req['id'] ?? '');
    $uid = (string) ($req['userId'] ?? '');
    $childId = $reqId . '_x' . substr(sha1($h), 0, 10);
    orolado_deposit_append_locked([
      'id' => $childId, 'ref' => $childId, 'parentId' => $reqId, 'userId' => $uid, 'operator' => 'coffre', 'kind' => 'vault',
      'network' => 'TRC20', 'coin' => 'usdt_trc20', 'status' => 'PENDING', 'amount' => $usd, 'currency' => 'USD',
      'txid' => $h, 'txids' => [$h], 'from' => (string) ($tx['from'] ?? ''), 'address' => (string) ($req['address'] ?? ''),
      'match' => $how, 'at' => date('c'),
    ]);
    if (function_exists('supabase_insert_deposit')) {
      try {
        supabase_insert_deposit(['id' => $childId, 'user_id' => orolado_balance_uuid(load_db(orolado_data_file()), $uid), 'amount' => $usd,
          'status' => 'PENDING', 'reference' => $childId, 'operator' => 'coffre']);
      } catch (Throwable $e) { /* le crédit ne dépend pas de la copie */ }
    }
    $paid = credit_paid_deposit(['ref' => $childId, 'amount' => $usd, 'extId' => $h, 'paid' => true, 'creditReceived' => true, 'allowSmall' => true, 'operator' => 'coffre']);
    $ok = !empty($paid['ok']) && empty($paid['duplicate']);
    if ($ok) {
      // La demande est « payée » (l'écran du joueur passe en « reçu »).
      with_db_lock(function ($box) use ($reqId, $usd) {
        foreach (($box->db['deposits'] ?? []) as $i => $d) {
          if (is_array($d) && (string) ($d['id'] ?? '') === $reqId) {
            if (strtoupper((string) ($d['status'] ?? '')) === 'UNFINISHED') $box->db['deposits'][$i]['status'] = 'PAID_CHILD';
            $box->db['deposits'][$i]['gotUsd'] = orolado_money((float) ($d['gotUsd'] ?? 0) + $usd);
            $box->db['deposits'][$i]['paidTs'] = microtime(true);
            return ['ok' => true];
          }
        }
        return ['ok' => true, 'skip_write' => true];
      });
      $u = vault_unmatched();
      if (isset($u[$h])) { unset($u[$h]); vault_unmatched_save($u); }
      try { $vt = orolado_crypto_vault(load_db(orolado_data_file()), $uid); supabase_sync_real_min($uid, $vt['real'] ?? 0); } catch (Throwable $e) { /* ignore */ }
      orolado_oxapay_log('vault_credit', ['uid' => $uid, 'amount' => $usd, 'tx' => substr($h, 0, 16), 'how' => $how]);
    }
    return ['ok' => !empty($paid['ok']), 'duplicate' => !empty($paid['duplicate']), 'amount' => $usd, 'id' => $childId, 'code' => (string) ($paid['reason'] ?? '')];
  } finally {
    if ($lk) { flock($lk, LOCK_UN); fclose($lk); }
  }
}

/** Trouve la demande d'un envoi reçu. Renvoie [demande, 'exact'|'proche'] ou null. */
function vault_match(array $db, array $tx, string $addr): ?array {
  $got = (float) ($tx['amount'] ?? 0);
  $ts = (int) ($tx['ts'] ?? time());
  $gotKey = number_format(round($got, 4), 4, '.', '');
  $close = [];
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || !vault_dep_is_req($d) || (string) ($d['address'] ?? '') !== $addr) continue;
    $at = vault_dep_ts($d);
    if ($at > $ts + 120) continue; // demande faite APRÈS l'envoi : jamais
    if (number_format((float) ($d['payAmount'] ?? 0), 4, '.', '') === $gotKey && $ts - $at <= VAULT_EXACT_WINDOW) return [$d, 'exact'];
    if (strtoupper((string) ($d['status'] ?? '')) === 'UNFINISHED' && $ts - $at <= VAULT_REQ_TTL && vault_close($got, (float) ($d['amount'] ?? 0))) $close[(string) ($d['userId'] ?? '')] = $d;
  }
  if (count($close) === 1) return [reset($close), 'proche'];
  return null;
}

/**
 * Regarde le coffre sur la blockchain (au plus toutes les $every secondes, tous les visiteurs confondus) et crédite.
 * Curseur = date du dernier envoi vu (un peu de recouvrement : les envois déjà traités sont ignorés).
 */
function vault_scan(int $every = 40, bool $force = false): int {
  $addr = vault_tron_addr();
  if ($addr === '' || orolado_trongrid_key() === '') return 0;
  $dir = orolado_data_dir();
  $stF = $dir . '/vault_scan.json';
  $lk = @fopen($dir . '/vault_scan.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return 0; }
  $credited = 0;
  try {
    $st = json_decode((string) @file_get_contents($stF), true);
    if (!is_array($st) || (string) ($st['addr'] ?? '') !== $addr) $st = ['addr' => $addr, 'cursor' => (time() - 900) * 1000, 'last' => 0]; // nouveau coffre : on part de maintenant (pas l'historique perso du portefeuille)
    if (!$force && time() - (int) $st['last'] < $every) return 0;
    $st['last'] = time();
    @file_put_contents($stF, json_encode($st), LOCK_EX);
    $t0 = microtime(true);
    for ($page = 0; $page < 4 && microtime(true) - $t0 < 8; $page++) {
      $txs = orolado_trongrid_usdt_in($addr, max(0, (int) $st['cursor'] - 600000), true);
      if ($txs === null) break;
      $unm = vault_unmatched(); $unmDirty = false;
      $maxMs = (int) $st['cursor'];
      foreach ($txs as $tx) {
        $maxMs = max($maxMs, (int) ($tx['tsMs'] ?? 0));
        $h = strtolower($tx['tx_hash']);
        $db = load_db(orolado_data_file());
        if (orolado_txid_already_used($db, $h)) continue;
        $m = vault_match($db, $tx, $addr);
        if ($m) {
          $r = vault_credit($m[0], $tx, $m[1]);
          if (!empty($r['ok']) && empty($r['duplicate'])) {
            $credited++;
            if (isset($unm[$h])) { unset($unm[$h]); $unmDirty = true; }
            continue;
          }
        }
        if (!isset($unm[$h])) {
          $unm[$h] = ['amount' => orolado_money($tx['amount']), 'from' => (string) ($tx['from'] ?? ''), 'ts' => (int) $tx['ts'], 'seenAt' => time()];
          $unmDirty = true;
          orolado_health_event('Dépôts', 'Coffre : ' . orolado_money($tx['amount']) . ' USDT reçus mais joueur non reconnu (envoi ' . substr($h, 0, 10) . '…). Le joueur peut coller ce numéro dans son écran de dépôt, ou attribuez-le dans l’admin → 🏦 Coffre.', 'warn');
        }
      }
      if ($unmDirty) vault_unmatched_save($unm);
      $st['cursor'] = $maxMs;
      @file_put_contents($stF, json_encode($st), LOCK_EX);
      if (count($txs) < 50) break;
    }
  } finally {
    flock($lk, LOCK_UN); fclose($lk);
  }
  return $credited;
}

/** État d'une demande pour l'écran du joueur (appelé toutes les 6 s par son téléphone). */
function vault_status(array $dep, string $uid): array {
  $id = (string) ($dep['id'] ?? '');
  $sum = function () use ($id): float {
    $s = 0.0;
    foreach ((load_db(orolado_data_file())['deposits'] ?? []) as $c) {
      if (is_array($c) && (string) ($c['parentId'] ?? '') === $id && in_array(strtoupper((string) ($c['status'] ?? '')), ['COMPLETED', 'PAID'], true)) $s += (float) ($c['amount'] ?? 0);
    }
    return orolado_money($s);
  };
  $got = $sum();
  if ($got <= 0) { vault_scan(20); $got = $sum(); }
  if ($got > 0) return ['ok' => true, 'paid' => true, 'success' => true, 'amount' => $got, 'vault' => orolado_crypto_vault(load_db(orolado_data_file()), $uid)];
  return ['ok' => true, 'pending' => true];
}

/** Le joueur colle le numéro de sa transaction (son montant ne correspondait pas au centime près). */
function vault_claim(array $req): array {
  $db = load_db(orolado_data_file());
  $me = orolado_session_user($db, (string) ($req['token'] ?? ''));
  if (!$me) return ['ok' => false, 'code' => 'session', 'reason' => 'Session invalide'];
  $uid = (string) $me['id'];
  if (!orolado_rate_ok('vault_claim', $uid, 12, 3600)) return ['ok' => false, 'code' => 'rate', 'reason' => 'Trop d’essais. Réessayez dans un moment.'];
  $h = strtolower(preg_replace('/[^0-9a-fA-F]/', '', preg_replace('#^.*/#', '', trim((string) ($req['txid'] ?? '')))) ?? '');
  if (!preg_match('/^[0-9a-f]{64}$/', $h)) return ['ok' => false, 'code' => 'txid'];
  $addr = vault_tron_addr();
  if ($addr === '') return ['ok' => false, 'code' => 'vault'];
  if (orolado_txid_already_used($db, $h)) {
    foreach (($db['deposits'] ?? []) as $d) {
      if (is_array($d) && strtolower((string) ($d['txid'] ?? '')) === $h && (string) ($d['userId'] ?? '') === $uid) return ['ok' => true, 'paid' => true, 'success' => true, 'amount' => orolado_money($d['amount'] ?? 0), 'vault' => orolado_crypto_vault($db, $uid), 'already' => true];
    }
    return ['ok' => false, 'code' => 'reused'];
  }
  $u = vault_unmatched();
  if (!isset($u[$h])) { vault_scan(15, true); $u = vault_unmatched(); }
  if (!isset($u[$h])) {
    // Peut-être crédité à l'instant par la ronde.
    $db = load_db(orolado_data_file());
    foreach (($db['deposits'] ?? []) as $d) {
      if (is_array($d) && strtolower((string) ($d['txid'] ?? '')) === $h && (string) ($d['userId'] ?? '') === $uid) return ['ok' => true, 'paid' => true, 'success' => true, 'amount' => orolado_money($d['amount'] ?? 0), 'vault' => orolado_crypto_vault($db, $uid)];
    }
    return ['ok' => false, 'code' => 'propagating'];
  }
  $tx = ['tx_hash' => $h, 'amount' => (float) $u[$h]['amount'], 'ts' => (int) $u[$h]['ts'], 'from' => (string) ($u[$h]['from'] ?? '')];
  // Seulement sur UNE demande de CE joueur, faite avant l'envoi et d'un montant proche (sinon on pourrait réclamer l'envoi d'un autre).
  $best = null;
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || !vault_dep_is_req($d) || (string) ($d['userId'] ?? '') !== $uid || (string) ($d['address'] ?? '') !== $addr) continue;
    $at = vault_dep_ts($d);
    if ($at > $tx['ts'] + 120 || $tx['ts'] - $at > VAULT_EXACT_WINDOW) continue;
    if (!vault_close($tx['amount'], (float) ($d['amount'] ?? 0))) continue;
    if (!$best || $at > vault_dep_ts($best)) $best = $d;
  }
  if (!$best) return ['ok' => false, 'code' => 'nomatch'];
  $r = vault_credit($best, $tx, 'numéro collé par le joueur');
  if (empty($r['ok'])) return ['ok' => false, 'code' => 'invalid'];
  if (!empty($r['duplicate'])) return ['ok' => false, 'code' => 'reused'];
  return ['ok' => true, 'paid' => true, 'success' => true, 'amount' => $r['amount'], 'vault' => orolado_crypto_vault(load_db(orolado_data_file()), $uid)];
}

/** Admin : envois reçus dans le coffre sans joueur reconnu + derniers envois crédités. */
function vault_admin_view(): array {
  vault_scan(20);
  $db = load_db(orolado_data_file());
  $u = vault_unmatched();
  uasort($u, static fn($a, $b) => ((int) ($b['ts'] ?? 0)) <=> ((int) ($a['ts'] ?? 0)));
  $un = [];
  foreach ($u as $h => $r) $un[] = ['hash' => $h, 'amount' => (float) ($r['amount'] ?? 0), 'from' => (string) ($r['from'] ?? ''), 'at' => date('c', (int) ($r['ts'] ?? 0))];
  $done = [];
  foreach (array_reverse($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || (string) ($d['kind'] ?? '') !== 'vault' || (string) ($d['parentId'] ?? '') === '') continue;
    $usr = $db['users'][(string) ($d['userId'] ?? '')] ?? [];
    $done[] = ['hash' => (string) ($d['txid'] ?? ''), 'amount' => (float) ($d['amount'] ?? 0), 'user' => (string) ($usr['displayName'] ?? $usr['email'] ?? $d['userId'] ?? ''),
      'uid' => (string) ($d['userId'] ?? ''), 'status' => (string) ($d['status'] ?? ''), 'how' => (string) ($d['match'] ?? ''), 'at' => (string) ($d['at'] ?? '')];
    if (count($done) >= 40) break;
  }
  return ['ok' => true, 'address' => vault_tron_addr(), 'enabled' => vault_enabled(), 'tronKey' => orolado_trongrid_key() !== '', 'unmatched' => $un, 'credited' => $done];
}

/** Admin : attribuer à un joueur un envoi reçu sans joueur reconnu (crédit unique, numéro d'envoi enregistré). */
function vault_admin_assign(string $hash, string $uid, string $by = 'admin'): array {
  $h = strtolower(trim($hash));
  $u = vault_unmatched();
  if (!isset($u[$h])) return ['ok' => false, 'reason' => 'Envoi introuvable (déjà attribué ?)'];
  $db = load_db(orolado_data_file());
  if (!isset($db['users'][$uid])) {
    // On accepte aussi l'identifiant public / e-mail.
    foreach (($db['users'] ?? []) as $id => $usr) {
      if (!is_array($usr)) continue;
      if (strcasecmp((string) ($usr['email'] ?? ''), $uid) === 0 || (string) ($usr['publicId'] ?? '') === $uid || (string) ($usr['sbId'] ?? '') === $uid) { $uid = (string) $id; break; }
    }
  }
  if (!isset($db['users'][$uid])) return ['ok' => false, 'reason' => 'Joueur introuvable'];
  $addr = vault_tron_addr();
  $reqId = 'vlt_' . preg_replace('/[^a-zA-Z0-9]/', '', $uid) . '_adm' . substr($h, 0, 8);
  orolado_deposit_append_locked(['id' => $reqId, 'ref' => $reqId, 'userId' => $uid, 'operator' => 'coffre', 'kind' => 'vault', 'network' => 'TRC20',
    'coin' => 'usdt_trc20', 'status' => 'UNFINISHED', 'amount' => (float) $u[$h]['amount'], 'payAmount' => 0, 'currency' => 'USD', 'address' => $addr,
    'by' => $by, 'at' => date('c', max(0, (int) $u[$h]['ts'] - 60))]);
  $r = vault_credit(['id' => $reqId, 'userId' => $uid, 'address' => $addr], ['tx_hash' => $h, 'amount' => (float) $u[$h]['amount'], 'from' => (string) ($u[$h]['from'] ?? '')], 'attribué par ' . $by);
  if (empty($r['ok']) || !empty($r['duplicate'])) return ['ok' => false, 'reason' => 'Crédit impossible (' . ($r['code'] ?? 'déjà crédité') . ')'];
  return ['ok' => true, 'amount' => $r['amount']];
}
