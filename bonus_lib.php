<?php
declare(strict_types=1);
/**
 * Bonus dépôt de la semaine (v2417) — règle validée par le propriétaire le 2026-10-07 :
 *  - le joueur clique « Activer mon bonus de la semaine » (une fois par semaine, lundi → dimanche, UTC) ;
 *  - son premier VRAI dépôt de 100 $ ou plus fait APRÈS l'activation, dans la semaine, lui donne droit à +10 % ;
 *  - le bonus se REMPLIT en jouant : +1 $ pour chaque 30 $ misés en réel (trades terminés), pendant 7 jours ;
 *  - pas de cumul avec le cadeau d'ami invité sur ce même dépôt (le bonus est diminué de ce cadeau) ;
 *  - chaque morceau versé est un bonus (opérateur admin) → règle « miser ×2 avant retrait », comme les autres.
 * Calcul anti-triche : pour remplir 10 $, il faut miser 300 $ (≈ 16,50 $ perdus en moyenne) ; même avec les
 * 5 % de l'affilié, un tricheur à 2 comptes perd ≈ 2,50 $ par 100 $.
 *
 * Ne touche à AUCUN chemin de paiement ni aux trades : lit la liste des dépôts confirmés et les trades réglés
 * (y compris archivés). Versements par orolado_trade_credit_once (référence unique par palier : jamais en double).
 * Mode test : seul le compte admin (sur sa démo). Ouverture à tous : OROLADO_BONUS_PUBLIC=1.
 */

const OROLADO_BONUS_PCT = 0.10;
const OROLADO_BONUS_MIN_DEPOSIT = 100.0;
const OROLADO_BONUS_PER_STAKE = 30.0;
const OROLADO_BONUS_DAYS = 7;

function orolado_bonus_public(): bool {
  $v = getenv('OROLADO_BONUS_PUBLIC');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_BONUS_PUBLIC'] ?? '';
  return (string) $v === '1';
}

function orolado_bonus_is_tester(array $user): bool {
  return function_exists('orolado_is_admin_user') && orolado_is_admin_user($user);
}

function orolado_bonus_allowed(array $user): bool {
  return orolado_bonus_public() || orolado_bonus_is_tester($user);
}

/** Semaine en cours : lundi 00:00 → dimanche 23:59:59 (UTC). */
function orolado_bonus_week(int $now): array {
  $start = (int) strtotime('monday this week 00:00:00', $now);
  if ($start > $now) $start -= 7 * 86400;
  return ['key' => date('o-\WW', $start), 'start' => $start, 'end' => $start + 7 * 86400 - 1];
}

function orolado_bonus_file(string $uid): string {
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'bonus';
  if (!is_dir($dir)) @mkdir($dir, 0750, true);
  return $dir . DIRECTORY_SEPARATOR . hash('sha256', 'bonus|' . $uid) . '.json';
}

/** Lit / modifie l'état du joueur sous verrou. */
function orolado_bonus_with(string $uid, callable $fn) {
  $fp = @fopen(orolado_bonus_file($uid), 'c+');
  if (!$fp) return null;
  flock($fp, LOCK_EX);
  $st = json_decode(stream_get_contents($fp) ?: '', true);
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

/** Premier vrai dépôt (pas bonus / cadeau) de 100 $ ou plus, confirmé entre $from et $to. */
function orolado_bonus_find_deposit(array $db, string $uid, int $from, int $to): ?array {
  $ids = function_exists('orolado_linked_balance_ids') ? orolado_linked_balance_ids($db, $uid) : [$uid];
  if (!$ids) $ids = [$uid];
  $best = null;
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || !in_array((string) ($d['userId'] ?? $d['user_id'] ?? ''), $ids, true)) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st !== 'COMPLETED' && $st !== 'PAID') continue;
    $id = (string) ($d['id'] ?? $d['ref'] ?? '');
    if ($id === '' || strtolower((string) ($d['operator'] ?? '')) === 'admin' || str_starts_with($id, 'adm_')) continue;
    $amt = orolado_money($d['amount'] ?? 0);
    if ($amt + 0.0001 < OROLADO_BONUS_MIN_DEPOSIT) continue;
    $ts = (int) strtotime((string) ($d['paidAt'] ?? $d['createdAt'] ?? $d['at'] ?? ''));
    if ($ts < $from || $ts > $to) continue;
    if ($best === null || $ts < $best['ts']) $best = ['id' => $id, 'amount' => $amt, 'ts' => $ts];
  }
  return $best;
}

/** Ajoute à $st les mises réelles réglées du joueur entre $from et $to (chaque trade compté une seule fois). */
function orolado_bonus_add_order(array &$w, array $o, string $uid, int $from, int $to, bool $demo): void {
  if (!is_array($o) || (string) ($o['userId'] ?? '') !== $uid) return;
  $mode = (string) ($o['mode'] ?? $o['accountType'] ?? '');
  if ($mode !== ($demo ? 'demo' : 'real')) return;
  $status = (string) ($o['status'] ?? '');
  if ($status !== 'won' && $status !== 'lost') return;
  $id = (string) ($o['id'] ?? '');
  if ($id === '' || isset($w['seen'][$id])) return;
  $t = (float) ($o['openedAt'] ?? $o['at'] ?? 0);
  if ($t < $from || $t > $to) return;
  $w['seen'][$id] = 1;
  $w['staked'] = round((float) ($w['staked'] ?? 0) + orolado_money($o['stake'] ?? 0), 2);
}

/** Met à jour le total misé depuis le dépôt (relit les archives si le dernier passage date de plus d'un jour). */
function orolado_bonus_scan(array $db, string $uid, array &$w, bool $demo): void {
  $from = (int) $w['depositTs'];
  $to = (int) $w['until'];
  if (!isset($w['seen']) || !is_array($w['seen'])) $w['seen'] = [];
  $now = time();
  if (empty($w['archAt']) || $now - (int) ($w['scanAt'] ?? 0) > 86400) {
    $months = array_unique([date('Y-m', $from), date('Y-m', min($now, $to))]);
    foreach ($months as $ym) {
      $af = orolado_data_dir() . '/archive/orders-' . $ym . '.jsonl';
      $h = is_file($af) ? @fopen($af, 'r') : false;
      if (!$h) continue;
      while (($line = fgets($h)) !== false) {
        if (strpos($line, $uid) === false) continue;
        $o = json_decode($line, true);
        if (is_array($o)) orolado_bonus_add_order($w, $o, $uid, $from, $to, $demo);
      }
      fclose($h);
    }
    $w['archAt'] = $now;
  }
  foreach (($db['orders'] ?? []) as $o) orolado_bonus_add_order($w, $o, $uid, $from, $to, $demo);
  $w['scanAt'] = $now;
}

/** Verse un palier de bonus (une seule fois par référence). Compte admin (test) : sur sa démo. */
function orolado_bonus_pay(array $db, string $uid, float $amount, string $ref, bool $demo): bool {
  if ($amount < 0.01) return true;
  if ($demo) {
    $done = with_db_lock(static function ($box) use ($uid, $amount) {
      if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 0, 'real' => 0];
      $box->db['vault'][$uid]['demo'] = orolado_money(($box->db['vault'][$uid]['demo'] ?? 0) + $amount);
      return ['ok' => true];
    });
    return !empty($done['ok']);
  }
  // Même versement que le cadeau d'ami (bonus admin → miser ×2 avant retrait), déjà testé.
  return function_exists('orolado_aff_pay_friend') && orolado_aff_pay_friend($db, $uid, $amount, $ref, 'Bonus dépôt');
}

/** Cadeau d'ami invité déjà reçu sur ce même dépôt (pour ne pas cumuler). */
function orolado_bonus_invite_gift(string $uid, string $depositId): float {
  if (!function_exists('orolado_aff_read')) return 0.0;
  $inv = orolado_aff_read(orolado_aff_inv_name($uid));
  if (empty($inv['friendPaid'])) return 0.0;
  // Le cadeau d'ami porte sur le tout premier vrai dépôt : on compare au dépôt du bonus.
  $first = function_exists('orolado_aff_real_deposits') ? (orolado_aff_real_deposits(load_db(), $uid)[0]['id'] ?? '') : '';
  return $first !== '' && $first === $depositId ? orolado_money($inv['friendGift'] ?? 0) : 0.0;
}

/**
 * État du bonus (et versement des paliers gagnés). $activate : active le bonus de la semaine.
 */
function orolado_bonus_status(array $db, array $user, bool $activate = false): array {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '' || !orolado_bonus_allowed($user)) return ['ok' => true, 'enabled' => false];
  $demo = orolado_bonus_is_tester($user);
  $now = time();
  $wk = orolado_bonus_week($now);
  $res = orolado_bonus_with($uid, static function (&$st) use ($db, $uid, $activate, $now, $wk, $demo) {
    if (!isset($st['weeks']) || !is_array($st['weeks'])) $st['weeks'] = [];
    $key = $wk['key'];
    $w = is_array($st['weeks'][$key] ?? null) ? $st['weeks'][$key] : [];
    if ($activate && empty($w['activatedAt'])) $w['activatedAt'] = $now;
    // Dépôt de 100 $ ou plus après l'activation, dans la semaine.
    if (!empty($w['activatedAt']) && empty($w['depositId'])) {
      if ($demo) {
        // Compte admin (test, aucun argent réel) : le dépôt est simulé par le bouton « Profiter de l'offre ».
        if (!empty($w['testDeposit'])) {
          $w['depositId'] = 'test_' . $key;
          $w['depositAmount'] = (float) $w['testDeposit'];
          $w['depositTs'] = (int) $w['testDepositTs'];
        }
      } else {
        $dep = orolado_bonus_find_deposit($db, $uid, (int) $w['activatedAt'], $wk['end']);
        if ($dep) {
          $w['depositId'] = $dep['id'];
          $w['depositAmount'] = $dep['amount'];
          $w['depositTs'] = $dep['ts'];
        }
      }
      if (!empty($w['depositId'])) {
        $full = orolado_money(floor($w['depositAmount'] * OROLADO_BONUS_PCT * 100 + 0.0001) / 100);
        $invite = $demo ? 0.0 : orolado_bonus_invite_gift($uid, (string) $w['depositId']);
        $w['target'] = orolado_money(max(0.0, $full - $invite));
        $w['inviteGift'] = $invite;
        $w['until'] = (int) $w['depositTs'] + OROLADO_BONUS_DAYS * 86400;
        $w['credited'] = 0.0;
        $w['staked'] = 0.0;
      }
    }
    // Remplissage : +1 $ pour chaque 30 $ misés, jusqu'au bonus complet, pendant 7 jours.
    if (!empty($w['depositId']) && (float) ($w['credited'] ?? 0) + 0.009 < (float) ($w['target'] ?? 0)) {
      orolado_bonus_scan($db, $uid, $w, $demo);
      $ratio = ((float) $w['staked']) / OROLADO_BONUS_PER_STAKE;
      $earned = $ratio + 0.0001 >= (float) $w['target'] ? (float) $w['target'] : floor($ratio + 0.0001);
      $earned = orolado_money($earned);
      $step = orolado_money($earned - (float) ($w['credited'] ?? 0));
      if ($step >= 0.01) {
        $ref = 'adm_bon_' . substr(hash('sha256', $uid), 0, 12) . '_' . str_replace('-', '', $key) . '_' . (int) round($earned * 100);
        if (orolado_bonus_pay($db, $uid, $step, $ref, $demo)) {
          $w['credited'] = $earned;
          $w['lastStep'] = $step;
          $w['lastStepAt'] = $now;
        }
      }
    }
    $st['weeks'][$key] = $w;
    // On garde les 8 dernières semaines seulement.
    if (count($st['weeks']) > 8) $st['weeks'] = array_slice($st['weeks'], -8, null, true);
    return $w;
  });
  $w = is_array($res) ? $res : [];
  $staked = (float) ($w['staked'] ?? 0);
  $target = (float) ($w['target'] ?? 0);
  $credited = (float) ($w['credited'] ?? 0);
  $phase = empty($w['activatedAt']) ? 'off' : (empty($w['depositId']) ? 'waiting' : ($credited + 0.009 >= $target ? 'full' : ((int) ($w['until'] ?? 0) < $now ? 'expired' : 'filling')));
  return [
    'ok' => true, 'enabled' => true, 'now' => $now, 'weekEnd' => $wk['end'], 'phase' => $phase,
    'min' => OROLADO_BONUS_MIN_DEPOSIT, 'pct' => (int) round(OROLADO_BONUS_PCT * 100), 'per' => OROLADO_BONUS_PER_STAKE,
    'deposit' => (float) ($w['depositAmount'] ?? 0), 'target' => $target, 'credited' => $credited, 'staked' => $staked,
    'nextIn' => $phase === 'filling' ? orolado_money(OROLADO_BONUS_PER_STAKE - fmod($staked, OROLADO_BONUS_PER_STAKE)) : 0,
    'until' => (int) ($w['until'] ?? 0), 'inviteGift' => (float) ($w['inviteGift'] ?? 0), 'test' => $demo,
  ];
}

/** Compte admin (test) : simule un dépôt (aucun argent réel ne bouge, le bonus va sur sa démo). */
function orolado_bonus_test_deposit(array $user, float $amount): bool {
  if (!orolado_bonus_is_tester($user)) return false;
  $uid = (string) ($user['id'] ?? '');
  $wk = orolado_bonus_week(time());
  return (bool) orolado_bonus_with($uid, static function (&$st) use ($wk, $amount) {
    $w = $st['weeks'][$wk['key']] ?? [];
    if (empty($w['activatedAt']) || !empty($w['depositId']) || $amount + 0.0001 < OROLADO_BONUS_MIN_DEPOSIT) return false;
    $w['testDeposit'] = $amount;
    $w['testDepositTs'] = time();
    $st['weeks'][$wk['key']] = $w;
    return true;
  });
}
