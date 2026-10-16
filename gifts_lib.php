<?php
declare(strict_types=1);
/**
 * v2689 — Cadeaux : ROUE et GRANDE JAUGE (règles validées par le propriétaire le 2026-10-16).
 *
 * ROUE
 *  - 1 tour gagné par VRAI dépôt de 10 $ ou plus (pas les bonus / cadeaux / ajouts admin), fait après l'ouverture de la roue ;
 *  - PAS de limite par jour (propriétaire, 2026-10-16 : « la roue est illimitée ») : chaque dépôt de 10 $+ = 1 tour ;
 *  - PAS DE ZÉRO (propriétaire) : chaque tour gagne au moins 0,25 $. Gain tiré par le SERVEUR (random_int) — chances :
 *    0,25 $ 85 %, 0,50 $ 9 %, 1 $ 3,5 %, 2 $ 1,5 %, 5 $ 0,6 %, 10 $ 0,35 %, 100 $ 0,05 % → coût moyen 0,4375 $ par tour,
 *    versé en bonus à miser ×2. Pourquoi pas 0,50 $ minimum : avec l'Invitation (5 % libres pour l'inviteur), un tricheur
 *    à 2 comptes aurait gagné ≈ +0,17 $ par dépôt de 10 $ ; à 0,25 $ il perd ≈ 0,13 $ (mise ×2 du dépôt ≈ 1,07 $ perdus).
 *  - versé en BONUS (miser ×2 avant retrait), une seule fois par tour (référence unique).
 * GRANDE JAUGE
 *  - se remplit avec les VRAIS dépôts ; pleine à 1 000 $ → cadeau surprise de 30 $ en BONUS (×2), puis elle repart.
 *
 * Personne ne peut tricher : le navigateur ne choisit rien ; l'état est écrit sous verrou AVANT le paiement,
 * et le paiement passe par orolado_aff_pay_friend (référence unique, jamais en double).
 * Ouverture à tous : OROLADO_GIFTS_PUBLIC=1 ; sinon seul le compte admin teste (sur sa démo).
 */

const OROLADO_WHEEL_MIN_DEPOSIT = 10.0;
const OROLADO_JAUGE_GOAL = 1000.0;
const OROLADO_JAUGE_GIFT = 30.0;
// [gain $, chances sur 10 000]
const OROLADO_WHEEL_ODDS = [[0.25, 8500], [0.5, 900], [1.0, 350], [2.0, 150], [5.0, 60], [10.0, 35], [100.0, 5]];
// Cases dessinées sur la roue (pas de zéro ; la plus petite case 0,25 $ revient souvent) : 12 cases.
const OROLADO_WHEEL_SEGS = [0.25, 0.5, 0.25, 5.0, 0.25, 1.0, 0.25, 100.0, 0.25, 2.0, 0.25, 10.0];

function orolado_gifts_public(): bool {
  $v = getenv('OROLADO_GIFTS_PUBLIC');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_GIFTS_PUBLIC'] ?? '';
  return (string) $v === '1';
}
function orolado_gifts_is_tester(array $user): bool {
  return function_exists('orolado_is_admin_user') && orolado_is_admin_user($user);
}
function orolado_gifts_allowed(array $user): bool {
  return orolado_gifts_public() || orolado_gifts_is_tester($user);
}
/** Date d'ouverture : seuls les dépôts faits après comptent (pas de tours pour les anciens dépôts). */
function orolado_gifts_start(): int {
  $v = getenv('OROLADO_GIFTS_START');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_GIFTS_START'] ?? '';
  $t = $v !== '' ? (int) strtotime((string) $v) : 0;
  return $t > 0 ? $t : (int) strtotime('2026-10-16 00:00:00 UTC');
}

function orolado_gifts_file(string $uid): string {
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'gifts';
  if (!is_dir($dir)) @mkdir($dir, 0750, true);
  return $dir . DIRECTORY_SEPARATOR . hash('sha256', 'gifts|' . $uid) . '.json';
}
function orolado_gifts_with(string $uid, callable $fn) {
  $fp = @fopen(orolado_gifts_file($uid), 'c+');
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

function orolado_gifts_day(int $now): string { return gmdate('Y-m-d', $now); }

/** Vrais dépôts depuis l'ouverture. Compte admin (test) : dépôts simulés enregistrés dans son état. */
function orolado_gifts_deposits(array $db, string $uid, array $st, bool $tester): array {
  $from = orolado_gifts_start();
  $out = [];
  if (function_exists('orolado_aff_real_deposits')) {
    foreach (orolado_aff_real_deposits($db, $uid) as $d) {
      if ((int) ($d['ts'] ?? 0) >= $from) $out[] = ['id' => (string) $d['id'], 'amount' => (float) $d['amount']];
    }
  }
  if ($tester) foreach ((array) ($st['testDeps'] ?? []) as $d) $out[] = ['id' => (string) $d['id'], 'amount' => (float) $d['amount']];
  return $out;
}

/** Tire le gain (serveur seulement). */
function orolado_wheel_draw(): float {
  $r = random_int(1, 10000);
  $acc = 0;
  foreach (OROLADO_WHEEL_ODDS as [$p, $w]) { $acc += $w; if ($r <= $acc) return (float) $p; }
  return 0.0;
}
/** Case de la roue où l'aiguille s'arrête (une des cases qui portent ce gain, au hasard). */
function orolado_wheel_seg(float $prize): int {
  $idx = [];
  foreach (OROLADO_WHEEL_SEGS as $i => $v) if (abs($v - $prize) < 0.001) $idx[] = $i;
  return $idx ? $idx[random_int(0, count($idx) - 1)] : 0;
}

/** Verse un gain (bonus ×2). Admin en test : sur sa démo. */
function orolado_gifts_pay(array $db, string $uid, float $amount, string $ref, string $note, bool $tester): bool {
  if ($amount < 0.01) return true;
  if ($tester) {
    $done = with_db_lock(static function ($box) use ($uid, $amount) {
      if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 0, 'real' => 0];
      $box->db['vault'][$uid]['demo'] = orolado_money(($box->db['vault'][$uid]['demo'] ?? 0) + $amount);
      return ['ok' => true];
    });
    return !empty($done['ok']);
  }
  return function_exists('orolado_aff_pay_friend') && orolado_aff_pay_friend($db, $uid, $amount, $ref, $note);
}

/** Paiements en attente (si la base n'a pas répondu la première fois) : on réessaie, jamais en double. */
function orolado_gifts_retry(array $db, string $uid, bool $tester): void {
  $todo = orolado_gifts_with($uid, static function (array &$st) {
    $l = [];
    foreach ((array) ($st['spins'] ?? []) as $s) if (empty($s['paid']) && ($s['prize'] ?? 0) > 0) $l[] = ['k' => 's', 'ref' => $s['ref'], 'a' => (float) $s['prize']];
    foreach ((array) ($st['jauge'] ?? []) as $j) if (empty($j['paid'])) $l[] = ['k' => 'j', 'ref' => $j['ref'], 'a' => (float) $j['gift']];
    return $l;
  }) ?: [];
  foreach ($todo as $t) {
    $ok = orolado_gifts_pay($db, $uid, $t['a'], $t['ref'], $t['k'] === 's' ? 'Roue cadeau' : 'Grande jauge', $tester);
    if (!$ok) continue;
    orolado_gifts_with($uid, static function (array &$st) use ($t) {
      $key = $t['k'] === 's' ? 'spins' : 'jauge';
      foreach ($st[$key] as &$x) if (($x['ref'] ?? '') === $t['ref']) $x['paid'] = 1;
      unset($x);
      return true;
    });
  }
}

/** État + (option) tour de roue. */
function orolado_gifts_status(array $db, array $user, bool $spin = false, int $now = 0): array {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  $now = $now ?: time();
  $enabled = orolado_gifts_allowed($user);
  if (!$enabled) return ['ok' => true, 'enabled' => false, 'segs' => OROLADO_WHEEL_SEGS];
  $tester = orolado_gifts_is_tester($user) && !orolado_gifts_public();
  $day = orolado_gifts_day($now);
  $result = orolado_gifts_with($uid, static function (array &$st) use ($db, $uid, $tester, $spin, $day, $now) {
    $deps = orolado_gifts_deposits($db, $uid, $st, $tester);
    $earned = 0; $sum = 0.0;
    foreach ($deps as $d) { if ($d['amount'] + 0.001 >= OROLADO_WHEEL_MIN_DEPOSIT) $earned++; $sum += $d['amount']; }
    $used = count((array) ($st['spins'] ?? []));
    $todayDone = false;
    foreach ((array) ($st['spins'] ?? []) as $s) if (($s['day'] ?? '') === $day) $todayDone = true;
    // Grande jauge : un cadeau à chaque tranche de 1 000 $ de vrais dépôts.
    $cycles = (int) floor(($sum + 0.001) / OROLADO_JAUGE_GOAL);
    $paidCycles = count((array) ($st['jauge'] ?? []));
    for ($c = $paidCycles + 1; $c <= $cycles; $c++) {
      $st['jauge'][] = ['n' => $c, 'gift' => OROLADO_JAUGE_GIFT, 'ref' => 'jg_' . substr(hash('sha256', $uid), 0, 16) . '_' . $c, 'at' => $now, 'paid' => 0];
    }
    $newJauge = $cycles > $paidCycles;
    $won = null;
    if ($spin) {
      if ($earned - $used <= 0) return ['err' => 'noTicket'];
      $prize = orolado_wheel_draw();
      $seg = orolado_wheel_seg($prize);
      $ref = 'whl_' . substr(hash('sha256', $uid), 0, 16) . '_' . ($used + 1);
      $st['spins'][] = ['day' => $day, 'at' => $now, 'prize' => $prize, 'seg' => $seg, 'ref' => $ref, 'paid' => $prize > 0 ? 0 : 1];
      $used++;
      $won = ['prize' => $prize, 'seg' => $seg];
    }
    $last = !empty($st['spins']) ? end($st['spins']) : null;
    return [
      'tickets' => max(0, $earned - $used), 'today' => false, 'won' => $won,
      'last' => $last ? ['prize' => (float) $last['prize'], 'at' => (int) $last['at']] : null,
      'jaugeSum' => round($sum - $cycles * OROLADO_JAUGE_GOAL, 2), 'jaugeN' => $cycles, 'jaugeNew' => $newJauge,
    ];
  });
  if (!is_array($result)) return ['ok' => false, 'reason' => 'busy'];
  if (isset($result['err'])) return ['ok' => false, 'reason' => $result['err']];
  orolado_gifts_retry($db, $uid, $tester);
  $pct = max(0, min(100, (int) floor(($result['jaugeSum'] / OROLADO_JAUGE_GOAL) * 100)));
  return [
    'ok' => true, 'enabled' => true, 'test' => $tester, 'segs' => OROLADO_WHEEL_SEGS,
    'tickets' => $result['tickets'], 'spunToday' => $result['today'], 'won' => $result['won'], 'last' => $result['last'],
    'jauge' => $pct, 'jaugeDone' => $result['jaugeN'], 'jaugeNew' => $result['jaugeNew'],
    'minDeposit' => OROLADO_WHEEL_MIN_DEPOSIT, 'next' => strtotime('tomorrow 00:00:00 UTC', $now) ?: ($now + 86400),
  ];
}

/** Compte admin seulement (test) : dépôt simulé, aucun argent réel ne bouge. */
function orolado_gifts_test_deposit(array $user, float $amount): bool {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '' || !orolado_gifts_is_tester($user) || $amount <= 0 || $amount > 100000) return false;
  return (bool) orolado_gifts_with($uid, static function (array &$st) use ($amount) {
    $st['testDeps'][] = ['id' => 'test_' . bin2hex(random_bytes(4)), 'amount' => round($amount, 2)];
    return true;
  });
}
