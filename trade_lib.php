<?php
declare(strict_types=1);

/**
 * OROLADO — passage et règlement des trades (jeu équitable).
 *
 * Règles de l'argent (réel) :
 *   - MOINS : la mise est retirée UNE fois, à l'ouverture, par la base (debit_real : refuse si solde
 *     insuffisant, jamais de solde négatif). Un fichier marqueur empêche un 2e débit sur un retry.
 *   - PLUS  : au règlement, gain (mise × cote) ou mise rendue (égalité) crédités UNE fois par la base
 *     (resolve_trade : la clé orderId bloque tout 2e crédit, même simultané).
 *   - Perte : rien à faire, la mise est déjà partie.
 * Aucune écriture « valeur absolue » du solde ici : uniquement des + et − atomiques.
 *
 * Le résultat ne vient JAMAIS du navigateur : le serveur lit le prix d'expiration dans son flux.
 */

require_once __DIR__ . '/feed_lib.php';

const OROLADO_UUID_RE = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

function orolado_trade_rpc(string $fn, array $args): ?array {
  $hdrs = supabase_admin_headers();
  $url = rtrim(supabase_project_url(), '/');
  if (!$hdrs || $url === '') return null;
  $res = supabase_http($url . '/rest/v1/rpc/' . $fn, $hdrs, json_encode($args, JSON_PRESERVE_ZERO_FRACTION), 'POST');
  if (is_array($res) && isset($res[0]) && is_array($res[0])) $res = $res[0];
  return is_array($res) ? $res : null;
}

/**
 * Retire la mise une seule fois. Retour : ['ok' => true, 'real' => solde après]
 * ou ['ok' => false, 'reason' => 'insufficient'|'unavailable'].
 */
function orolado_trade_debit(string $payId, string $orderId, float $stake): array {
  $stake = orolado_money($stake);
  if ($stake <= 0 || $orderId === '' || !preg_match(OROLADO_UUID_RE, $payId)) {
    return ['ok' => false, 'reason' => 'unavailable'];
  }
  $dir = orolado_data_dir() . '/stakes';
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $key = hash('sha256', $payId . '|' . $orderId);
  $marker = $dir . '/' . $key . '.ok';
  $fp = @fopen($dir . '/' . $key . '.lock', 'c');
  if (!$fp || !flock($fp, LOCK_EX)) {
    if ($fp) fclose($fp);
    return ['ok' => false, 'reason' => 'unavailable'];
  }
  try {
    if (is_file($marker)) {
      $meta = json_decode((string) @file_get_contents($marker), true);
      return ['ok' => true, 'real' => orolado_money($meta['real'] ?? 0), 'duplicate' => true];
    }
    $rpc = orolado_trade_rpc('debit_real', ['p_user' => $payId, 'p_amount' => $stake]);
    if (!$rpc) return ['ok' => false, 'reason' => 'unavailable'];
    if (empty($rpc['ok'])) {
      return ['ok' => false, 'reason' => (($rpc['reason'] ?? '') === 'insufficient') ? 'insufficient' : 'unavailable'];
    }
    $real = orolado_money($rpc['real'] ?? 0);
    @file_put_contents($marker, json_encode(['at' => date('c'), 'stake' => $stake, 'real' => $real]));
    return ['ok' => true, 'real' => $real];
  } finally {
    flock($fp, LOCK_UN);
    fclose($fp);
  }
}

/**
 * Crédite une seule fois par clé (gain, égalité, remboursement). Montant 0 = marque juste réglé.
 * Retour : solde réel après, ou null si la base ne répond pas (on réessaiera plus tard).
 */
function orolado_trade_credit_once(string $payId, string $key, float $amount): ?float {
  if ($key === '' || !preg_match(OROLADO_UUID_RE, $payId)) return null;
  $rpc = orolado_trade_rpc('resolve_trade', ['p_user' => $payId, 'p_order' => $key, 'p_amount' => orolado_money(max(0, $amount))]);
  if (!$rpc || empty($rpc['ok'])) return null;
  return orolado_money($rpc['real'] ?? 0);
}

function orolado_trade_find(array $db, string $uid, string $oid): ?array {
  foreach (($db['orders'] ?? []) as $o) {
    if (is_array($o) && ($o['id'] ?? '') === $oid && ($o['userId'] ?? '') === $uid) return $o;
  }
  return null;
}

/** Vue publique d'un ordre (ce que le navigateur reçoit). */
function orolado_trade_public(array $o): array {
  $tickMs = OROLADO_TICK_MS;
  $st = (string) ($o['status'] ?? 'open');
  $out = [
    'id' => (string) ($o['id'] ?? ''),
    'assetId' => (string) ($o['assetId'] ?? ''),
    'side' => (($o['side'] ?? '') === 'put') ? 'put' : 'call',
    'stake' => orolado_money($o['stake'] ?? 0),
    'payout' => (float) ($o['payout'] ?? 1.88),
    'duration' => (int) ($o['duration'] ?? 10),
    'mode' => (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo',
    'status' => $st,
    'entryPrice' => isset($o['entryCents']) ? ((int) $o['entryCents']) / 100 : (float) ($o['openPrice'] ?? 0),
    'barrier' => isset($o['barrierCents']) ? ((int) $o['barrierCents']) / 100 : null,
    'entryTick' => isset($o['entryTick']) ? (int) $o['entryTick'] : null,
    'expiryTick' => isset($o['expiryTick']) ? (int) $o['expiryTick'] : null,
    'startTime' => isset($o['entryTick']) ? ((int) $o['entryTick']) * $tickMs : (int) round(((float) ($o['openedAt'] ?? $o['at'] ?? 0)) * 1000),
    'expiryTime' => isset($o['expiryTick']) ? ((int) $o['expiryTick']) * $tickMs : (int) round(((float) ($o['expiryAt'] ?? 0)) * 1000),
    'settled' => $st !== 'open',
  ];
  if ($st !== 'open') {
    $out['won'] = $st === 'won';
    $out['voided'] = $st === 'void';
    $out['net'] = orolado_money($o['net'] ?? 0);
    $out['exitPrice'] = isset($o['exitCents']) ? ((int) $o['exitCents']) / 100 : (isset($o['closePrice']) ? (float) $o['closePrice'] : null);
  }
  return $out;
}

/** Gains potentiels (mise × cote) des trades réels encore ouverts. */
function orolado_trade_exposure(array $db, string $assetId = '', string $uid = ''): float {
  $sum = 0.0;
  foreach (($db['orders'] ?? []) as $o) {
    if (!is_array($o) || ($o['status'] ?? '') !== 'open' || ($o['mode'] ?? '') !== 'real') continue;
    if ($assetId !== '' && ($o['assetId'] ?? '') !== $assetId) continue;
    if ($uid !== '' && ($o['userId'] ?? '') !== $uid) continue;
    $sum += orolado_money($o['stake'] ?? 0) * (float) ($o['payout'] ?? 1.88);
  }
  return $sum;
}

/**
 * Ouvre un trade. $req = données du navigateur (mise, sens, durée, actif, cote, id, mode).
 * Le prix d'entrée et la ligne objectif sont décidés ICI, jamais par le navigateur.
 */
function orolado_trade_place(array $me, array $req): array {
  $uid = (string) ($me['id'] ?? '');
  $stake = orolado_money($req['stake'] ?? 0);
  $side = (($req['side'] ?? '') === 'put') ? 'put' : 'call';
  $duration = orolado_fair_duration((int) ($req['duration'] ?? 10));
  $mode = (($req['mode'] ?? '') === 'real') ? 'real' : 'demo';
  $payout = orolado_fair_mult((float) ($req['payout'] ?? $req['odds'] ?? 1.88));
  $assetId = orolado_feed_asset_id((string) ($req['assetId'] ?? ''));
  $oid = preg_replace('/[^a-zA-Z0-9_\-.]/', '', (string) ($req['id'] ?? '')) ?? '';
  if ($uid === '' || $oid === '' || strlen($oid) > 64) return ['ok' => false, 'reason' => 'Ordre invalide'];
  if ($assetId === '') return ['ok' => false, 'reason' => 'Actif inconnu'];
  if ($stake < 1) return ['ok' => false, 'reason' => 'Mise minimum : 1 $'];
  $maxPay = orolado_limit_max_payout();
  if ($mode === 'real' && $stake * $payout > $maxPay + 0.001) {
    $maxStake = floor(($maxPay / $payout) * 100) / 100;
    return ['ok' => false, 'reason' => 'Mise maximum pour cette cote : ' . number_format($maxStake, 2, '.', ' ') . ' $', 'limit' => true];
  }

  $db = load_db();
  $dup = orolado_trade_find($db, $uid, $oid);
  if ($dup) return ['ok' => true, 'duplicate' => true, 'order' => orolado_trade_public($dup)];

  $payId = $uid;
  if ($mode === 'real') {
    $resolved = orolado_balance_uuid($db, $uid);
    if ($resolved !== '') $payId = $resolved;
    if (!preg_match(OROLADO_UUID_RE, $payId)) return ['ok' => false, 'reason' => 'Coffre réel introuvable'];
    $expo = $stake * $payout;
    if (orolado_trade_exposure($db, $assetId) + $expo > orolado_limit_asset_exposure()) {
      return ['ok' => false, 'reason' => 'Volume maximum atteint sur cet actif, réessayez dans quelques secondes', 'limit' => true];
    }
    if (orolado_trade_exposure($db, '', $uid) + $expo > orolado_limit_user_exposure()) {
      return ['ok' => false, 'reason' => 'Trop de gains potentiels ouverts, attendez la fin d’un trade', 'limit' => true];
    }
  }

  // Prix d'entrée = dernier tick du serveur à la réception de l'ordre.
  $st = orolado_feed_advance($assetId);
  $entryTick = $st['n'];
  $entryCents = $st['c'];
  $expiryTick = $entryTick + intdiv($duration * 1000, OROLADO_TICK_MS);
  $barrierCents = orolado_fair_barrier($assetId, $duration, $side, $payout, $entryCents);

  $realAfter = null;
  if ($mode === 'real') {
    $deb = orolado_trade_debit($payId, $oid, $stake);
    if (empty($deb['ok'])) {
      return ['ok' => false, 'reason' => ($deb['reason'] ?? '') === 'insufficient' ? 'Solde insuffisant' : 'Caisse indisponible, réessayez'];
    }
    $realAfter = $deb['real'];
  }

  $now = microtime(true);
  $order = [
    'id' => $oid,
    'userId' => $uid,
    'payId' => $payId,
    'stake' => $stake,
    'side' => $side,
    'duration' => $duration,
    'mode' => $mode,
    'accountType' => $mode,
    'assetId' => $assetId,
    'payout' => $payout,
    'payoutMult' => $payout,
    'entryTick' => $entryTick,
    'entryCents' => $entryCents,
    'expiryTick' => $expiryTick,
    'barrierCents' => $barrierCents,
    'openPrice' => $entryCents / 100,
    'won' => null,
    'status' => 'open',
    'at' => $now,
    'openedAt' => $now,
    'expiryAt' => ($expiryTick * OROLADO_TICK_MS) / 1000,
    'stakeTaken' => $mode === 'real',
    'fair' => 1,
  ];
  $placed = with_db_lock(function ($box) use ($order, $uid, $mode, $stake, $realAfter) {
    $locked =& $box->db;
    if (!isset($locked['orders']) || !is_array($locked['orders'])) $locked['orders'] = [];
    foreach ($locked['orders'] as $o) {
      if (is_array($o) && ($o['id'] ?? '') === $order['id'] && ($o['userId'] ?? '') === $uid) {
        return ['ok' => true, 'duplicate' => true, 'order' => $o, 'skip_write' => true];
      }
    }
    if (!isset($locked['vault'][$uid]) || !is_array($locked['vault'][$uid])) {
      $locked['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
    }
    if ($mode === 'demo') {
      $bal = orolado_money($locked['vault'][$uid]['demo'] ?? 0);
      if ($stake > $bal + 0.009) return ['ok' => false, 'reason' => 'Solde insuffisant', 'skip_write' => true];
      $locked['vault'][$uid]['demo'] = orolado_money($bal - $stake);
    } else {
      $locked['vault'][$uid]['real'] = $realAfter;
      if (isset($locked['users'][$uid]) && is_array($locked['users'][$uid])) {
        $u =& $locked['users'][$uid];
        $u['realStakeVolume'] = orolado_money(($u['realStakeVolume'] ?? 0) + $stake);
        $u['totalWageredSinceDeposit'] = $u['realStakeVolume'];
        $u['requiredWagering'] = orolado_money(($u['realDepositTotal'] ?? 0) * 2);
        $u['realTrades'] = (int) ($u['realTrades'] ?? 0) + 1;
        if (function_exists('orolado_apply_wager_progress')) orolado_apply_wager_progress($u, $stake);
        unset($u);
      }
    }
    $locked['orders'][] = $order;
    return ['ok' => true, 'order' => $order, 'vault' => $locked['vault'][$uid]];
  });

  if (empty($placed['ok'])) {
    // Mise prise mais ordre non enregistré : on la rend (clé dédiée, jamais deux fois).
    if ($mode === 'real') orolado_trade_credit_once($payId, 'refund_' . $oid, $stake);
    return ['ok' => false, 'reason' => $placed['reason'] ?? 'Ordre refusé'];
  }
  if (!empty($placed['duplicate'])) return ['ok' => true, 'duplicate' => true, 'order' => orolado_trade_public($placed['order'])];

  if ($mode === 'real' && function_exists('supabase_put_order')) {
    supabase_put_order($payId, [
      'id' => $oid, 'asset_id' => $assetId, 'side' => $side, 'stake' => $stake, 'duration' => $duration,
      'mode' => 'real', 'payout' => $payout, 'entry_price' => $entryCents / 100, 'status' => 'open',
    ]);
  }
  return ['ok' => true, 'order' => orolado_trade_public($order), 'vault' => $placed['vault']];
}

/**
 * Règle un trade arrivé à expiration. Idempotent : appelé 10 fois, crédite 1 fois.
 * Retour : ['ok' => true, 'order' => ..., 'vault' => ...] ou ['ok' => false, 'pending' => true].
 */
function orolado_trade_settle(string $uid, string $oid): array {
  $db = load_db();
  $o = orolado_trade_find($db, $uid, $oid);
  if (!$o) return ['ok' => false, 'reason' => 'Ordre introuvable'];
  if (($o['status'] ?? '') !== 'open') {
    return ['ok' => true, 'order' => orolado_trade_public($o), 'vault' => $db['vault'][$uid] ?? null];
  }
  $mode = (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo';
  $stake = orolado_money($o['stake'] ?? 0);
  $payout = (float) ($o['payout'] ?? 1.88);
  $side = (($o['side'] ?? '') === 'put') ? 'put' : 'call';

  if (!isset($o['expiryTick'], $o['barrierCents'])) {
    // Ordre ouvert avant la mise à jour (ancien système) : mise rendue, personne n'est lésé.
    $verdict = 'void';
    $exitCents = null;
  } else {
    $asset = orolado_feed_asset_id((string) ($o['assetId'] ?? ''));
    if ($asset === '') {
      $verdict = 'void';
      $exitCents = null;
    } else {
      $st = orolado_feed_advance($asset);
      $expiryTick = (int) $o['expiryTick'];
      if ($st['n'] < $expiryTick) {
        return ['ok' => false, 'pending' => true, 'reason' => 'Position encore ouverte', 'retryMs' => ($expiryTick - $st['n']) * OROLADO_TICK_MS + 60];
      }
      $exitCents = orolado_feed_price_at($asset, $expiryTick);
      $verdict = $exitCents === null ? 'void' : orolado_fair_verdict($side, $exitCents, (int) $o['barrierCents']);
    }
  }
  $credit = orolado_fair_credit($verdict, $stake, $payout);
  $net = $verdict === 'won' ? orolado_money($credit - $stake) : ($verdict === 'void' ? 0.0 : orolado_money(-$stake));

  $realAfter = null;
  if ($mode === 'real') {
    $payId = (string) ($o['payId'] ?? '');
    if (!preg_match(OROLADO_UUID_RE, $payId)) $payId = orolado_balance_uuid($db, $uid);
    // Ancien ordre déjà réglé par l'ancien système (son marqueur existe) : on ne recrédite pas.
    if (!isset($o['expiryTick']) && is_file(orolado_data_dir() . '/settle_' . hash('sha256', $payId . '|' . $oid) . '.ok')) {
      $credit = 0.0;
      $net = 0.0;
    }
    $realAfter = orolado_trade_credit_once($payId, $oid, $credit);
    if ($realAfter === null) {
      return ['ok' => false, 'pending' => true, 'reason' => 'Règlement en cours', 'retryMs' => 2000];
    }
  }

  $done = with_db_lock(function ($box) use ($uid, $oid, $mode, $verdict, $credit, $net, $exitCents, $realAfter) {
    $locked =& $box->db;
    foreach ($locked['orders'] as &$row) {
      if (!is_array($row) || ($row['id'] ?? '') !== $oid || ($row['userId'] ?? '') !== $uid) continue;
      if (($row['status'] ?? '') !== 'open') {
        return ['ok' => true, 'order' => $row, 'vault' => $locked['vault'][$uid] ?? null, 'skip_write' => true];
      }
      if (!isset($locked['vault'][$uid]) || !is_array($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 0, 'real' => 0];
      if ($mode === 'demo' && $credit > 0) {
        $locked['vault'][$uid]['demo'] = orolado_money(($locked['vault'][$uid]['demo'] ?? 0) + $credit);
      }
      if ($mode === 'real') {
        $locked['vault'][$uid]['real'] = $realAfter;
        if (isset($locked['users'][$uid]) && is_array($locked['users'][$uid])) {
          if (!isset($locked['users'][$uid]['transactions']) || !is_array($locked['users'][$uid]['transactions'])) {
            $locked['users'][$uid]['transactions'] = [];
          }
          array_unshift($locked['users'][$uid]['transactions'], [
            'id' => 'tr_' . bin2hex(random_bytes(6)),
            'at' => date('c'),
            'type' => $verdict === 'void' ? 'void' : ($verdict === 'won' ? 'win' : 'loss'),
            'amount' => $verdict === 'lost' ? orolado_money(-($row['stake'] ?? 0)) : $credit,
            'note' => $verdict === 'void' ? 'Égalité — mise rendue' : ($verdict === 'won' ? 'Gain' : 'Perte'),
            'mode' => 'real',
          ]);
          $locked['users'][$uid]['transactions'] = array_slice($locked['users'][$uid]['transactions'], 0, 80);
        }
      }
      $row['status'] = $verdict;
      $row['won'] = $verdict === 'won';
      $row['voided'] = $verdict === 'void';
      $row['net'] = $net;
      $row['exitCents'] = $exitCents;
      $row['closePrice'] = $exitCents !== null ? $exitCents / 100 : null;
      $row['settledAt'] = microtime(true);
      $row['paidOut'] = true;
      return ['ok' => true, 'order' => $row, 'vault' => $locked['vault'][$uid], 'fresh' => true];
    }
    unset($row);
    return ['ok' => false, 'reason' => 'Ordre introuvable', 'skip_write' => true];
  });
  if (empty($done['ok'])) return $done;

  if ($mode === 'real' && !empty($done['fresh']) && function_exists('supabase_put_order')) {
    supabase_put_order((string) ($o['payId'] ?? $uid), [
      'id' => $oid, 'asset_id' => $o['assetId'] ?? '', 'side' => $side, 'stake' => $stake,
      'duration' => (int) ($o['duration'] ?? 10), 'mode' => 'real', 'payout' => $payout,
      'entry_price' => ((int) ($o['entryCents'] ?? 0)) / 100,
      'exit_price' => $exitCents !== null ? $exitCents / 100 : null,
      'won' => $verdict === 'won', 'net' => $net, 'status' => $verdict,
    ]);
  }
  return ['ok' => true, 'order' => orolado_trade_public($done['order']), 'vault' => $done['vault']];
}

/** Règle les trades expirés d'un joueur (retour sur le site, F5, téléphone réveillé). */
function orolado_trade_settle_due(string $uid, int $max = 25): int {
  $db = load_db();
  $n = 0;
  foreach (($db['orders'] ?? []) as $o) {
    if ($n >= $max) break;
    if (!is_array($o) || ($o['userId'] ?? '') !== $uid || ($o['status'] ?? '') !== 'open') continue;
    $expMs = isset($o['expiryTick']) ? ((int) $o['expiryTick']) * OROLADO_TICK_MS : (int) round(((float) ($o['expiryAt'] ?? 0)) * 1000);
    if ($expMs > orolado_feed_now_ms()) continue;
    $res = orolado_trade_settle($uid, (string) ($o['id'] ?? ''));
    if (!empty($res['ok'])) $n++;
  }
  return $n;
}
