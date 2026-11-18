<?php
declare(strict_types=1);

/*
 * 2026-11-19 (propriétaire : « GeniusPay nous a acceptés, branche-le comme Flutterwave ») — Mobile Money par GeniusPay
 * (Wave, Orange, MTN, Moov, carte). Doc : https://geniuspay.ci/docs/api
 *
 *  - Clés : collées par le propriétaire dans l'admin 🔑 (data/.env), JAMAIS dans le code :
 *      GENIUSPAY_API_KEY    = « Clé publique (API Key) » du tableau GeniusPay (sk_sandbox_… / sk_live_…)
 *      GENIUSPAY_API_SECRET = « Clé secrète (API Secret) » (ss_sandbox_… / ss_live_…)
 *  - Clés de TEST (sandbox) : seul le compte admin paie par GeniusPay (faux argent simulé) ; les joueurs gardent
 *    l'ancien moyen. Clés LIVE : tout le monde.
 *  - Crédit UNIQUEMENT quand l'API GeniusPay (GET /payments/{référence}) dit « completed » pour CE dépôt (notre
 *    référence est dans metadata.ref) ; le montant crédité vient de GeniusPay, jamais du message reçu. Une seule fois
 *    (credit_paid_deposit). Rattrapages : retour de la page de paiement, message GeniusPay (webhook), surveillance
 *    pendant que le joueur attend, ronde serveur toutes les 2 min (orolado_pay_check_one).
 */

const GP_BASE = 'https://geniuspay.ci/api/v1/merchant';

function gp_env(string $k): string {
  orolado_load_env();
  return trim((string) (getenv($k) ?: ($_ENV[$k] ?? $_SERVER[$k] ?? '')));
}
function gp_key(): string { return gp_env('GENIUSPAY_API_KEY'); }
function gp_secret(): string { return gp_env('GENIUSPAY_API_SECRET'); }
function gp_configured(): bool {
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_GP'])) return true;
  return gp_key() !== '' && gp_secret() !== '';
}
/** Clés de test : sk_sandbox_ / ss_sandbox_ (ou réglage GENIUSPAY_MODE=sandbox). */
function gp_sandbox(): bool {
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_GP_SANDBOX'])) return (bool) $GLOBALS['OROLADO_FAKE_GP_SANDBOX'];
  if (strtolower(gp_env('GENIUSPAY_MODE')) === 'sandbox') return true;
  return stripos(gp_key(), '_sandbox_') !== false || stripos(gp_secret(), '_sandbox_') !== false;
}
/** GeniusPay utilisable par ce joueur ? Live : tous. Sandbox : compte admin seulement. */
function gp_on_for(?array $me): bool {
  if (!gp_configured() || !$me) return false;
  if (gp_env('GENIUSPAY_OFF') === '1') return false;
  return !gp_sandbox() || orolado_is_admin_user($me);
}

function gp_http(string $method, string $path, ?array $body = null): ?array {
  // Tests locaux uniquement (scripts/test-geniuspay.php) : faux GeniusPay, jamais en ligne.
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_GP']) && is_callable($GLOBALS['OROLADO_FAKE_GP'])) return ($GLOBALS['OROLADO_FAKE_GP'])($method, $path, $body);
  if (!function_exists('curl_init') || gp_key() === '' || gp_secret() === '') return null;
  $ch = curl_init(GP_BASE . $path);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_CONNECTTIMEOUT => 6,
    CURLOPT_HTTPHEADER => [
      'Accept: application/json',
      'Content-Type: application/json',
      'X-API-Key: ' . gp_key(),
      'X-API-Secret: ' . gp_secret(),
    ],
  ];
  if (strtoupper($method) === 'POST') {
    $opts[CURLOPT_POST] = true;
    $opts[CURLOPT_POSTFIELDS] = json_encode($body ?? new stdClass(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  }
  curl_setopt_array($ch, $opts);
  $raw = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $json = is_string($raw) ? json_decode($raw, true) : null;
  if (!is_array($json)) return ['_http' => $code];
  $json['_http'] = $code;
  return $json;
}

function gp_is_ours(array $d): bool {
  return strtolower((string) ($d['operator'] ?? '')) === 'geniuspay' || str_starts_with(strtolower((string) ($d['id'] ?? '')), 'gp_');
}

/**
 * Le joueur ouvre un paiement. mode : 'checkout' (page GeniusPay : le joueur choisit Wave, Orange, MTN, Moov ou la carte),
 * 'wave' (numéro Wave tapé sur OROLADO → lien Wave direct), 'card' (carte bancaire).
 */
function orolado_geniuspay_start(array $req): array {
  $tok = trim((string) ($req['token'] ?? ''));
  if ($tok !== '' && !orolado_rate_ok('pay_geniuspay', $tok, 30, 3600)) return ['ok' => false, 'server' => true, 'rate' => true, 'reason' => 'Trop de demandes. Réessayez dans un moment.'];
  $db = load_db(orolado_data_file());
  $me = orolado_session_user($db, $tok);
  if (!$me) return ['ok' => false, 'server' => true, 'reason' => 'Session invalide', 'code' => 'session'];
  if (!gp_on_for($me)) return ['ok' => false, 'server' => true, 'code' => 'off', 'reason' => 'GeniusPay pas activé'];
  $amountUsd = orolado_money($req['amount'] ?? 0);
  // 2026-11-19 (propriétaire) : 3 $ minimum (avant 1 $).
  if ($amountUsd + 0.0001 < 3.0) return ['ok' => false, 'server' => true, 'code' => 'min', 'min' => 3, 'reason' => 'Le dépôt minimum est de $3.'];
  if (function_exists('orolado_deposit_over_cap') && orolado_deposit_over_cap($amountUsd)) return ['ok' => false, 'server' => true, 'code' => 'max', 'reason' => 'Montant trop élevé.'];
  $cfa = max(200, orolado_usd_to_cfa_int($amountUsd)); // GeniusPay : 200 F minimum
  $mode = strtolower(trim((string) ($req['mode'] ?? 'checkout')));
  if (!in_array($mode, ['checkout', 'wave', 'card'], true)) $mode = 'checkout';
  $digits = '';
  if ($mode === 'wave') {
    $digits = preg_replace('/\D/', '', (string) ($req['phone'] ?? '')) ?? '';
    if (strlen($digits) === 10 && $digits[0] === '0') $digits = '225' . $digits;
    $okCi = strlen($digits) === 13 && str_starts_with($digits, '225');
    $okSn = strlen($digits) === 12 && str_starts_with($digits, '221');
    if (!$okCi && !$okSn) return ['ok' => false, 'server' => true, 'code' => 'phone', 'reason' => 'Numéro Wave invalide.'];
  }
  $uid = (string) $me['id'];
  $ref = 'gp_' . substr(preg_replace('/[^a-zA-Z0-9]/', '', $uid) ?? '', 0, 24) . '_' . bin2hex(random_bytes(6));
  $origin = rtrim(orolado_public_origin(), '/');
  $sandbox = gp_sandbox();
  $name = trim((string) ($me['displayName'] ?? ''));
  $customer = ['name' => $name !== '' ? mb_substr($name, 0, 60) : 'Joueur OROLADO'];
  if ($digits !== '') { $customer['phone'] = '+' . $digits; $customer['country'] = str_starts_with($digits, '221') ? 'SN' : 'CI'; }
  $body = [
    'amount' => $cfa,
    'currency' => 'XOF',
    'description' => 'Recharge OROLADO',
    'customer' => $customer,
    'success_url' => $origin . '/api/geniuspay-return.php?ref=' . rawurlencode($ref),
    'error_url' => $origin . '/?payment=cancel&ref=' . rawurlencode($ref),
    'metadata' => ['ref' => $ref, 'user' => substr(hash('sha256', $uid), 0, 16)],
  ];
  if ($mode === 'wave') $body['payment_method'] = 'wave';
  if ($mode === 'card') $body['payment_method'] = 'card';
  with_db_lock(function ($box) use ($ref, $uid, $amountUsd, $cfa, $mode, $sandbox, $digits) {
    if (!isset($box->db['deposits']) || !is_array($box->db['deposits'])) $box->db['deposits'] = [];
    $box->db['deposits'][] = [
      'id' => $ref, 'ref' => $ref, 'userId' => $uid, 'operator' => 'geniuspay', 'status' => 'PENDING',
      'amount' => $amountUsd, 'payAmount' => $cfa, 'payCurrency' => 'XOF', 'method' => 'geniuspay_' . $mode,
      'sandbox' => $sandbox, 'customerPhone' => $digits !== '' ? '+' . $digits : '', 'currency' => 'USD',
      'clientIp' => orolado_request_ip(), 'userAgent' => orolado_request_ua(), 'at' => date('c'),
    ];
    return ['ok' => true];
  });
  if (function_exists('supabase_insert_deposit')) {
    supabase_insert_deposit(['id' => $ref, 'user_id' => orolado_balance_uuid($db, $uid), 'amount' => $amountUsd, 'status' => 'PENDING', 'reference' => $ref, 'operator' => 'geniuspay']);
  }
  gp_ensure_webhook();
  $res = gp_http('POST', '/payments', $body);
  $data = is_array($res['data'] ?? null) ? $res['data'] : [];
  $gpRef = (string) ($data['reference'] ?? '');
  $checkout = (string) ($data['checkout_url'] ?? '');
  $payUrl = (string) ($data['payment_url'] ?? '');
  // Wave : le lien direct de Wave (wave.com…) s'ouvre dans l'application ; sinon la page GeniusPay.
  $url = ($mode === 'wave' && preg_match('#^https://[a-z0-9.-]*wave\.com/#i', $payUrl)) ? $payUrl : ($checkout !== '' ? $checkout : $payUrl);
  if (empty($res['success']) || $gpRef === '' || !preg_match('#^https://#i', $url)) {
    $why = is_array($res['error'] ?? null) ? (string) ($res['error']['message'] ?? '') : (string) ($res['message'] ?? '');
    error_log('OROLADO geniuspay refus : ' . $why . ' (http ' . (int) ($res['_http'] ?? 0) . ')');
    gp_mark($ref, ['status' => 'FAILED', 'failWhy' => substr($why, 0, 160)]);
    return ['ok' => false, 'server' => true, 'code' => 'gp', 'reason' => 'Paiement momentanément indisponible. Réessayez dans un instant.', 'detail' => substr($why, 0, 160)];
  }
  gp_mark($ref, ['gpRef' => $gpRef, 'sellId' => $gpRef]);
  return ['ok' => true, 'server' => true, 'ref' => $ref, 'url' => $url, 'redirect' => $url, 'mode' => $mode, 'sandbox' => $sandbox];
}

/** Petite mise à jour d'un dépôt GeniusPay (référence GeniusPay, échec). */
function gp_mark(string $ref, array $set): void {
  with_db_lock(function ($box) use ($ref, $set) {
    foreach (($box->db['deposits'] ?? []) as $i => $d) {
      if (is_array($d) && (string) ($d['id'] ?? '') === $ref) {
        if (strtoupper((string) ($d['status'] ?? '')) !== 'PENDING' && isset($set['status'])) unset($set['status']);
        $box->db['deposits'][$i] = array_merge($d, $set);
        break;
      }
    }
    return ['ok' => true];
  });
}

function gp_find_dep(string $ref): ?array {
  if ($ref === '') return null;
  foreach (array_reverse(load_db(orolado_data_file())['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    if (strcasecmp((string) ($d['id'] ?? ''), $ref) === 0 || strcasecmp((string) ($d['gpRef'] ?? ''), $ref) === 0) return $d;
  }
  return null;
}

/** Demande à GeniusPay si CE dépôt est payé. Jamais de confiance dans un message reçu. */
function gp_verify(array $dep): array {
  $gpRef = (string) ($dep['gpRef'] ?? $dep['sellId'] ?? '');
  $ours = (string) ($dep['id'] ?? '');
  if ($gpRef === '' || !preg_match('/^[A-Za-z0-9_\-]{6,64}$/', $gpRef)) return ['ok' => false, 'paid' => false, 'r' => 'pas de référence GeniusPay'];
  $res = gp_http('GET', '/payments/' . rawurlencode($gpRef));
  $data = is_array($res['data'] ?? null) ? $res['data'] : [];
  if (empty($res['success']) || !$data) return ['ok' => false, 'paid' => false, 'r' => 'GeniusPay ne répond pas'];
  $st = strtolower((string) ($data['status'] ?? ''));
  $meta = is_array($data['metadata'] ?? null) ? $data['metadata'] : [];
  // SÉCURITÉ : le paiement doit être CELUI de ce dépôt (notre référence dans metadata.ref).
  if ((string) ($meta['ref'] ?? '') !== $ours) return ['ok' => true, 'paid' => false, 'r' => 'référence différente'];
  // Un paiement de TEST (sandbox) ne crédite jamais un dépôt ouvert avec les clés réelles.
  $env = strtolower((string) ($data['environment'] ?? ''));
  if ($env === 'sandbox' && empty($dep['sandbox'])) return ['ok' => true, 'paid' => false, 'r' => 'paiement de test'];
  if ($st !== 'completed') return ['ok' => true, 'paid' => false, 'status' => $st, 'r' => 'pas payé chez GeniusPay (' . ($st ?: '?') . ')'];
  $cur = strtoupper((string) ($data['currency'] ?? 'XOF'));
  $amt = (float) ($data['amount'] ?? 0);
  $usd = ($cur === 'XOF' || $cur === 'XAF') ? orolado_cfa_to_usd($amt) : ($cur === 'USD' ? orolado_money($amt) : 0.0);
  return ['ok' => true, 'paid' => true, 'gpRef' => $gpRef, 'amount_usd' => $usd, 'amount' => $amt, 'currency' => $cur];
}

function gp_credit(array $dep, array $proof): array {
  $ref = (string) ($dep['id'] ?? '');
  $usd = orolado_money($proof['amount_usd'] ?? 0);
  if ($usd <= 0) {
    orolado_health_event('Dépôts', 'GeniusPay : paiement ' . $ref . ' confirmé mais montant/monnaie non reconnus — pas crédité. Vérifiez sur GeniusPay.', 'warn');
    return ['ok' => false, 'code' => 'amount_unverified'];
  }
  $pending = orolado_money($dep['amount'] ?? 0);
  if ($pending > 0 && $usd > $pending) $usd = $pending; // jamais plus que le montant demandé
  $paid = credit_paid_deposit([
    'ref' => $ref, 'amount' => $usd, 'extId' => (string) ($proof['gpRef'] ?? $ref), 'paid' => true,
    'creditReceived' => true, 'allowSmall' => true, 'operator' => 'geniuspay',
  ]);
  if (!empty($paid['ok']) || !empty($paid['duplicate'])) {
    $uid = (string) ($dep['userId'] ?? '');
    $vault = $uid !== '' ? orolado_crypto_vault(load_db(orolado_data_file()), $uid) : null;
    if ($uid !== '' && $vault && function_exists('supabase_sync_real_min')) supabase_sync_real_min($uid, $vault['real'] ?? 0);
    return ['ok' => true, 'paid' => empty($paid['duplicate']), 'duplicate' => !empty($paid['duplicate']), 'amount' => orolado_money($paid['amount'] ?? $usd), 'vault' => $vault, 'ref' => $ref];
  }
  return ['ok' => false, 'code' => 'credit'];
}

/** Vérifie un dépôt et le crédite s'il est payé (ronde serveur, retour, webhook, admin). */
function gp_check_dep(array $dep): array {
  if (!gp_configured()) return ['r' => 'GeniusPay non configuré'];
  if (strtoupper((string) ($dep['status'] ?? '')) !== 'PENDING') return ['r' => 'déjà traité'];
  $p = gp_verify($dep);
  if (empty($p['paid'])) return ['r' => (string) ($p['r'] ?? 'pas payé')];
  $c = gp_credit($dep, $p);
  return ['r' => !empty($c['ok']) ? 'payé chez GeniusPay' : 'payé mais crédit refusé (' . ($c['code'] ?? '?') . ')', 'paid' => !empty($c['ok']) ? 1 : 0];
}

/** Statut demandé par le site (retour ?deposit=success&ref=…). */
function orolado_geniuspay_confirm(array $req, array $dep): array {
  gp_check_dep($dep);
  $ref = (string) ($dep['id'] ?? '');
  $out = orolado_deposit_status(['token' => $req['token'] ?? '', 'ref' => $ref]);
  $out['ref'] = $ref;
  $out['success'] = !empty($out['paid']);
  $out['new_balance'] = orolado_money($out['vault']['real'] ?? 0);
  if (empty($out['paid'])) { $out['status'] = 'PENDING'; $out['pending'] = true; } else { $out['status'] = 'COMPLETED'; }
  return $out;
}

/** Pendant que le joueur attend : ses dépôts GeniusPay des dernières 48 h (4 au plus, toutes les 60 s). */
function orolado_geniuspay_recheck(array $req): array {
  if (!gp_configured()) return ['ok' => true, 'skipped' => true];
  $db = load_db(orolado_data_file());
  $me = orolado_session_user($db, (string) ($req['token'] ?? ''));
  if (!$me) return ['ok' => false, 'server' => true, 'code' => 'session'];
  $uid = (string) $me['id'];
  if (!orolado_rate_ok('gp_recheck', $uid, 1, 60)) return ['ok' => true, 'skipped' => true];
  $cut = time() - 48 * 3600;
  $n = 0; $credited = 0;
  foreach (array_reverse($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || (string) ($d['userId'] ?? '') !== $uid || !gp_is_ours($d)) continue;
    if (strtoupper((string) ($d['status'] ?? '')) !== 'PENDING') continue;
    if ((strtotime((string) ($d['at'] ?? '')) ?: 0) < $cut) continue;
    $r = gp_check_dep($d);
    if (!empty($r['paid'])) $credited++;
    if (++$n >= 4) break;
  }
  return ['ok' => true, 'checked' => $n, 'credited' => $credited];
}

/** Message de GeniusPay (webhook) : on lit seulement la référence, puis on DEMANDE à GeniusPay. */
function orolado_geniuspay_webhook(string $raw): array {
  $p = json_decode($raw, true);
  if (!is_array($p)) return ['http' => 200, 'body' => 'OK'];
  $data = is_array($p['data'] ?? null) ? $p['data'] : [];
  $meta = is_array($data['metadata'] ?? null) ? $data['metadata'] : [];
  $ours = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($meta['ref'] ?? '')) ?? '';
  $gpRef = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($data['reference'] ?? '')) ?? '';
  $dep = gp_find_dep($ours !== '' ? $ours : $gpRef);
  if ($dep && gp_is_ours($dep)) gp_check_dep($dep);
  return ['http' => 200, 'body' => 'OK'];
}

/** Retour de la page de paiement : on vérifie, puis on ramène le joueur sur le site. */
function orolado_geniuspay_return(array $q): void {
  $ref = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) ($q['ref'] ?? '')) ?? '';
  $dep = gp_find_dep($ref);
  if ($dep && gp_is_ours($dep)) { try { gp_check_dep($dep); } catch (Throwable $e) { /* la surveillance prendra le relais */ } }
  $origin = rtrim(orolado_public_origin(), '/');
  header('Location: ' . $origin . '/?deposit=success' . ($ref !== '' ? '&ref=' . rawurlencode($ref) : ''), true, 302);
  exit;
}

/**
 * Inscrit une fois l'adresse des messages GeniusPay (https://orolado.com/api/geniuspay-webhook.php) pour ces clés.
 * Le message n'est qu'un « réveil » : le crédit passe toujours par gp_verify().
 */
function gp_ensure_webhook(): void {
  if (PHP_SAPI === 'cli' || !gp_configured()) return;
  $f = orolado_data_dir() . '/geniuspay_webhook.json';
  $fp = substr(hash('sha256', gp_key()), 0, 16);
  $st = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null;
  if (is_array($st) && ($st['key'] ?? '') === $fp && (!empty($st['ok']) || time() - (int) ($st['at'] ?? 0) < 3600)) return;
  $url = rtrim(orolado_public_origin(), '/') . '/api/geniuspay-webhook.php';
  $ok = false;
  $list = gp_http('GET', '/webhooks');
  foreach ((is_array($list['data'] ?? null) ? $list['data'] : []) as $w) {
    if (is_array($w) && (string) ($w['url'] ?? '') === $url) { $ok = true; break; }
  }
  if (!$ok) {
    $res = gp_http('POST', '/webhooks', ['name' => 'OROLADO', 'url' => $url, 'events' => ['payment.success', 'payment.failed', 'payment.cancelled', 'payment.expired']]);
    $ok = !empty($res['success']);
  }
  @file_put_contents($f, json_encode(['key' => $fp, 'ok' => $ok, 'at' => time()]), LOCK_EX);
}
