<?php
declare(strict_types=1);
/**
 * Défi OROLADO (v2409) : « gagne 5 trades d'affilée sur le marché du défi → ta plus petite mise des
 * 5 trades ×5 offerte en bonus ». Chrono de 7 jours après l'activation.
 *
 * Ne touche NI aux prix NI aux trades : lit seulement les ordres déjà réglés ($db['orders']).
 * La récompense passe par orolado_trade_credit_once (crédit une seule fois par référence, comme les
 * gains et les bonus admin) et s'enregistre comme un bonus admin (règle « miser ×2 avant retrait »).
 * L'état de chaque joueur est dans data/defi/<empreinte>.json (fichier à part, verrouillé).
 *
 * Mode test (avant ouverture à tous) : seul le compte admin voit le Défi ; pour lui les trades DÉMO
 * comptent et la récompense va sur son solde démo (aucun argent réel).
 */

const OROLADO_DEFI_STREAK = 5;
const OROLADO_DEFI_MIN_STAKE = 1.0;

function orolado_defi_markets(): array {
  return ['v100', 'v75', 'stable', 'crash300', 'apex500', 'horizon50', 'goldtrend', 'boomspike', 'nexusprime', 'titanpulse'];
}

/** Ouvert à tous seulement quand le propriétaire valide (variable OROLADO_DEFI_PUBLIC=1 sur le serveur). */
function orolado_defi_public(): bool {
  $v = getenv('OROLADO_DEFI_PUBLIC');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_DEFI_PUBLIC'] ?? '';
  return (string) $v === '1';
}

function orolado_defi_is_tester(array $user): bool {
  return function_exists('orolado_is_admin_user') && orolado_is_admin_user($user);
}

function orolado_defi_allowed(array $user): bool {
  return orolado_defi_public() || orolado_defi_is_tester($user);
}

function orolado_defi_file(string $uid): string {
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'defi';
  if (!is_dir($dir)) @mkdir($dir, 0750, true);
  return $dir . DIRECTORY_SEPARATOR . hash('sha256', 'defi|' . $uid) . '.json';
}

/** Lit / modifie l'état du joueur sous verrou. $fn reçoit l'état (tableau) par référence. */
function orolado_defi_with(string $uid, callable $fn) {
  $fp = @fopen(orolado_defi_file($uid), 'c+');
  if (!$fp) return ['ok' => false, 'reason' => 'Stockage indisponible'];
  flock($fp, LOCK_EX);
  $raw = stream_get_contents($fp);
  $st = json_decode($raw ?: '', true);
  if (!is_array($st)) $st = [];
  $before = $st;
  $res = $fn($st);
  if ($st !== $before) {
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($st, JSON_UNESCAPED_UNICODE));
    fflush($fp);
  }
  flock($fp, LOCK_UN);
  fclose($fp);
  return $res;
}

/** Jour du défi (heure du serveur) : un nouveau défi toutes les 24 h. */
function orolado_defi_day(int $now): string {
  return date('Y-m-d', $now);
}

/** Fin du jour du défi (minuit, heure du serveur). */
function orolado_defi_day_end(int $now): int {
  return (int) strtotime(date('Y-m-d', $now) . ' 23:59:59');
}

/** Marché du jour : tiré au hasard pour CHAQUE joueur, chaque jour (jamais le même qu'hier pour lui). */
function orolado_defi_pick_market(string $uid, int $now): string {
  $m = orolado_defi_markets();
  $n = count($m);
  // Marche jour après jour depuis le 1er octobre 2026 : chaque jour avance de 1 à n-1 cases → jamais le même que la veille.
  $debut = (int) strtotime('2026-10-01 12:00:00');
  $jours = max(0, (int) floor(((int) strtotime(orolado_defi_day($now) . ' 12:00:00') - $debut) / 86400 + 0.5));
  $i = crc32('orolado-defi|' . $uid) % $n;
  for ($d = 1; $d <= $jours; $d++) $i = ($i + 1 + crc32('orolado-defi|' . $uid . '|' . $d) % ($n - 1)) % $n;
  return $m[$i];
}

/**
 * Série en cours sur le marché du défi, entre l'activation et la fin du chrono.
 * Comptent : trades réglés, du bon compte (réel, ou démo pour le testeur), mise ≥ 1 $.
 * Gagné → la série monte ; perdu → la série repart à 0 ; égalité ou petite mise → ignoré.
 * Dès que 5 victoires d'affilée existent : réussi, récompense = 5 × la plus petite des 5 mises.
 */
function orolado_defi_progress(array $db, string $uid, array $st, string $mode): array {
  $from = (float) ($st['activatedAt'] ?? 0);
  $to = (float) ($st['expiresAt'] ?? 0);
  $market = (string) ($st['market'] ?? '');
  $rows = [];
  foreach (($db['orders'] ?? []) as $o) {
    if (!is_array($o) || (string) ($o['userId'] ?? '') !== $uid) continue;
    if ((string) ($o['assetId'] ?? '') !== $market) continue;
    if ((string) ($o['mode'] ?? $o['accountType'] ?? '') !== $mode) continue;
    $status = (string) ($o['status'] ?? '');
    if ($status !== 'won' && $status !== 'lost') continue;
    $opened = (float) ($o['openedAt'] ?? $o['at'] ?? 0);
    if ($opened < $from || $opened > $to) continue;
    if (orolado_money($o['stake'] ?? 0) + 0.0001 < OROLADO_DEFI_MIN_STAKE) continue;
    $rows[] = [
      'k' => (int) ($o['expiryTick'] ?? 0) * 1000 + (int) round(fmod((float) ($o['settledAt'] ?? $opened), 1) * 999),
      'won' => $status === 'won',
      'stake' => orolado_money($o['stake'] ?? 0),
    ];
  }
  usort($rows, static fn($a, $b) => $a['k'] <=> $b['k']);
  $run = [];
  foreach ($rows as $r) {
    if ($r['won']) {
      $run[] = $r['stake'];
      if (count($run) >= OROLADO_DEFI_STREAK) {
        $last = array_slice($run, -OROLADO_DEFI_STREAK);
        return ['streak' => OROLADO_DEFI_STREAK, 'done' => true, 'stakes' => $last, 'reward' => orolado_money(min($last) * OROLADO_DEFI_STREAK)];
      }
    } else {
      $run = [];
    }
  }
  return ['streak' => count($run), 'done' => false, 'stakes' => $run, 'reward' => 0.0];
}

/** Verse la récompense une seule fois (référence unique par défi). */
function orolado_defi_pay(array &$db, string $uid, float $reward, string $ref, string $mode): bool {
  if ($reward <= 0.009) return true;
  if ($mode === 'demo') {
    $done = with_db_lock(static function ($box) use ($uid, $reward) {
      if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 0, 'real' => 0];
      $box->db['vault'][$uid]['demo'] = orolado_money(($box->db['vault'][$uid]['demo'] ?? 0) + $reward);
      return ['ok' => true];
    });
    return !empty($done['ok']);
  }
  $payId = function_exists('orolado_balance_uuid') ? orolado_balance_uuid($db, $uid) : '';
  if (!preg_match(OROLADO_UUID_RE, $payId)) {
    if (function_exists('orolado_ensure_balance_uuid')) $payId = orolado_ensure_balance_uuid($uid, null);
  }
  if (!preg_match(OROLADO_UUID_RE, $payId)) return false;
  // Une seule fois par référence (même mécanisme que les gains de trade) : jamais de double paiement.
  $got = orolado_trade_credit_once($payId, $ref, $reward);
  if ($got === null) return false;
  // Enregistré comme un bonus (opérateur admin) : la règle « miser ×2 avant retrait » s'applique.
  with_db_lock(static function ($box) use ($uid, $reward, $ref, $got) {
    $locked =& $box->db;
    foreach (($locked['deposits'] ?? []) as $d) {
      if (is_array($d) && (string) ($d['id'] ?? '') === $ref) return ['ok' => true, 'skip_write' => true];
    }
    if (!isset($locked['deposits']) || !is_array($locked['deposits'])) $locked['deposits'] = [];
    $locked['deposits'][] = [
      'id' => $ref, 'ref' => $ref, 'userId' => $uid, 'amount' => $reward, 'status' => 'COMPLETED',
      'operator' => 'admin', 'createdAt' => date('c'), 'paidAt' => date('c'), 'note' => 'Défi OROLADO', 'motif' => 'Défi OROLADO',
    ];
    if (isset($locked['users'][$uid]) && is_array($locked['users'][$uid])) {
      $u =& $locked['users'][$uid];
      $u['realDepositTotal'] = orolado_money(($u['realDepositTotal'] ?? 0) + $reward);
      $u['requiredWagering'] = orolado_money($u['realDepositTotal'] * 2);
      $u['lastDepositAmount'] = $reward;
      $u['wagerLock'] = orolado_money(($u['wagerLock'] ?? 0) + $reward);
      $u['wagerNeed'] = orolado_money(($u['wagerNeed'] ?? 0) + $reward * 2);
      if (!isset($u['transactions']) || !is_array($u['transactions'])) $u['transactions'] = [];
      array_unshift($u['transactions'], ['id' => $ref, 'at' => date('c'), 'type' => 'deposit', 'amount' => $reward, 'note' => 'Défi OROLADO', 'mode' => 'real', 'status' => 'COMPLETED']);
      $u['transactions'] = array_slice($u['transactions'], 0, 80);
      unset($u);
    }
    if (!isset($locked['vault'][$uid]) || !is_array($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
    $locked['vault'][$uid]['real'] = $got;
    return ['ok' => true];
  });
  if (function_exists('supabase_insert_deposit')) {
    supabase_insert_deposit(['id' => $ref, 'user_id' => $payId, 'amount' => $reward, 'status' => 'COMPLETED', 'operator' => 'admin', 'reference' => $ref]);
  }
  return true;
}

/** Vue publique de l'état (ce que le téléphone reçoit). */
function orolado_defi_view(array $st, int $now, string $uid, string $mode): array {
  $active = !empty($st['activatedAt']) && empty($st['finished']);
  $expiresAt = (float) ($st['expiresAt'] ?? 0);
  if ($active && $expiresAt > 0 && $now > $expiresAt) $active = false;
  return [
    'enabled' => true,
    'mode' => $mode,
    'active' => $active,
    'market' => ($active || $now < $expiresAt) && !empty($st['market']) ? (string) $st['market'] : orolado_defi_pick_market($uid, $now),
    'nextMarket' => orolado_defi_pick_market($uid, $now),
    'streak' => (int) ($st['streak'] ?? 0),
    'stakes' => array_values(array_map('floatval', (array) ($st['stakes'] ?? []))),
    'need' => OROLADO_DEFI_STREAK,
    'minStake' => OROLADO_DEFI_MIN_STAKE,
    'activatedAt' => (int) ($st['activatedAt'] ?? 0),
    'expiresAt' => (int) $expiresAt,
    'now' => $now,
    'canActivate' => !$active && $now >= $expiresAt,
    'finished' => !empty($st['finished']),
    'won' => !empty($st['won']),
    'reward' => (float) ($st['reward'] ?? 0),
    'paid' => !empty($st['paid']),
    'history' => array_slice((array) ($st['history'] ?? []), 0, 5),
  ];
}

/**
 * État du défi (et paiement automatique si la série de 5 vient d'être faite).
 * $activate : démarre un nouveau défi (si aucun n'est en cours).
 */
function orolado_defi_status(array &$db, array $user, bool $activate = false): array {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '' || !orolado_defi_allowed($user)) return ['ok' => true, 'enabled' => false];
  // Le compte admin (testeur) joue le Défi en DÉMO : aucun argent réel pendant les essais.
  $mode = orolado_defi_is_tester($user) ? 'demo' : 'real';
  $now = time();
  return orolado_defi_with($uid, static function (&$st) use (&$db, $uid, $activate, $now, $mode) {
    if (!isset($st['history']) || !is_array($st['history'])) $st['history'] = [];
    $running = !empty($st['activatedAt']) && empty($st['finished']);
    // Chrono fini sans réussite : le défi se termine (on garde une trace).
    if ($running && $now > (float) ($st['expiresAt'] ?? 0)) {
      $st['finished'] = true;
      $st['won'] = false;
      array_unshift($st['history'], ['market' => $st['market'] ?? '', 'won' => false, 'reward' => 0, 'at' => date('c')]);
      $st['history'] = array_slice($st['history'], 0, 20);
      $running = false;
    }
    // UN défi par jour (le même marché pour tous) : un défi réussi ne se relance que le lendemain
    // (sinon on pourrait enchaîner les défis et la récompense coûterait plus que le jeu ne rapporte).
    $periodOver = $now >= (float) ($st['expiresAt'] ?? 0);
    if ($activate && !$running && $periodOver) {
      $hist = (array) ($st['history'] ?? []);
      $st = [
        'id' => bin2hex(random_bytes(6)),
        'market' => orolado_defi_pick_market($uid, $now),
        'activatedAt' => $now,
        'expiresAt' => orolado_defi_day_end($now),
        'streak' => 0,
        'stakes' => [],
        'finished' => false,
        'won' => false,
        'reward' => 0,
        'paid' => false,
        'mode' => $mode,
        'history' => $hist,
      ];
      $running = true;
    }
    if ($running) {
      $p = orolado_defi_progress($db, $uid, $st, (string) ($st['mode'] ?? $mode));
      $st['streak'] = $p['streak'];
      $st['stakes'] = $p['stakes'];
      if ($p['done']) {
        $ref = 'adm_defi_' . (string) ($st['id'] ?? bin2hex(random_bytes(6)));
        $ok = orolado_defi_pay($db, $uid, (float) $p['reward'], $ref, (string) ($st['mode'] ?? $mode));
        if ($ok) {
          $st['finished'] = true;
          $st['won'] = true;
          $st['reward'] = $p['reward'];
          $st['paid'] = true;
          $st['paidAt'] = date('c');
          $st['ref'] = $ref;
          if (!isset($st['history']) || !is_array($st['history'])) $st['history'] = [];
          array_unshift($st['history'], ['market' => $st['market'], 'won' => true, 'reward' => $p['reward'], 'at' => date('c')]);
          $st['history'] = array_slice($st['history'], 0, 20);
        }
      }
    }
    return ['ok' => true] + orolado_defi_view($st, $now, $uid, (string) ($st['mode'] ?? $mode));
  });
}
