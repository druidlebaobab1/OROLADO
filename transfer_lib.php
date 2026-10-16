<?php
declare(strict_types=1);
/**
 * v2689 — ENVOYER DE L'ARGENT À UN AMI (règles du propriétaire, 2026-10-16).
 *
 *  - En RÉEL seulement. On choisit l'ami par son identifiant Live (OR…).
 *  - « Argent envoyable » = les VRAIS dépôts faits depuis l'ouverture du transfert, moins ce qui a déjà été envoyé,
 *    et jamais plus que le solde. Les bonus (tournoi, roue, jauge, défi, admin, invitation) et l'argent REÇU d'un ami
 *    n'augmentent jamais ce compteur → aucun bonus ne peut être regroupé d'un compte à l'autre.
 *    Calcul de sûreté : tout ce qui sort par un transfert a d'abord été payé par un vrai dépôt du même compte.
 *  - Celui qui envoie n'a rien à miser avant. Celui qui reçoit reçoit un BONUS (opérateur admin) : à miser ×2 avant
 *    retrait, et il ne peut pas le renvoyer (ce n'est pas un vrai dépôt).
 *  - Pas de limite affichée ; limite cachée de sécurité par jour (compte volé, erreur de frappe).
 *  - Retrait de l'envoyeur une seule fois (orolado_trade_debit, référence unique) ; crédit de l'ami une seule fois
 *    (orolado_aff_pay_friend, référence unique) ; si la base ne répond pas, on réessaie plus tard, jamais en double.
 * Ouverture à tous : OROLADO_XFER_PUBLIC=1 ; sinon seul le compte admin voit la fonction (test).
 */

const OROLADO_XFER_MIN = 1.0;
const OROLADO_XFER_DAY_MAX = 1000.0; // caché, jamais affiché aux joueurs

function orolado_xfer_env(string $k): string {
  $v = getenv($k);
  if ($v === false || $v === '') $v = $_ENV[$k] ?? '';
  return (string) $v;
}
function orolado_xfer_public(): bool { return orolado_xfer_env('OROLADO_XFER_PUBLIC') === '1'; }
function orolado_xfer_allowed(array $user): bool {
  return orolado_xfer_public() || (function_exists('orolado_is_admin_user') && orolado_is_admin_user($user));
}
function orolado_xfer_start(): int {
  $v = orolado_xfer_env('OROLADO_XFER_START');
  $t = $v !== '' ? (int) strtotime($v) : 0;
  return $t > 0 ? $t : (int) strtotime('2026-10-16 00:00:00 UTC');
}
function orolado_xfer_file(string $uid): string {
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'xfer';
  if (!is_dir($dir)) @mkdir($dir, 0750, true);
  return $dir . DIRECTORY_SEPARATOR . hash('sha256', 'xfer|' . $uid) . '.json';
}
function orolado_xfer_with(string $uid, callable $fn) {
  $fp = @fopen(orolado_xfer_file($uid), 'c+');
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

/** Ajoute au compteur les nouveaux VRAIS dépôts (pas bonus / admin / transferts reçus), faits depuis l'ouverture. */
function orolado_xfer_absorb(array $db, string $uid, array &$st): void {
  $from = orolado_xfer_start();
  if (!isset($st['seen']) || !is_array($st['seen'])) $st['seen'] = [];
  $st['cap'] = (float) ($st['cap'] ?? 0);
  if (!function_exists('orolado_aff_real_deposits')) return;
  foreach (orolado_aff_real_deposits($db, $uid) as $d) {
    $id = (string) $d['id'];
    if (isset($st['seen'][$id]) || (int) ($d['ts'] ?? 0) < $from) continue;
    $st['seen'][$id] = 1;
    $st['cap'] = orolado_money($st['cap'] + (float) $d['amount']);
  }
}

function orolado_xfer_day_sent(array $st, int $now): float {
  $s = 0.0;
  foreach ((array) ($st['log'] ?? []) as $l) if (($l['dir'] ?? '') === 'out' && (int) ($l['at'] ?? 0) > $now - 86400) $s += (float) ($l['amount'] ?? 0);
  return orolado_money($s);
}

/** Ce que le joueur peut envoyer maintenant + son historique d'envois / réceptions. */
function orolado_xfer_status(array $db, array $user, ?float $balance = null): array {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  if (!orolado_xfer_allowed($user)) return ['ok' => true, 'enabled' => false];
  if ($balance === null) $balance = function_exists('orolado_official_real') ? orolado_official_real($db, $uid) : orolado_money($db['vault'][$uid]['real'] ?? 0);
  orolado_xfer_retry($db, $uid);
  $res = orolado_xfer_with($uid, static function (array &$st) use ($db, $uid, $balance) {
    orolado_xfer_absorb($db, $uid, $st);
    // Le compteur ne dépasse jamais le solde (si le joueur a perdu, il baisse avec).
    if ($st['cap'] > $balance) $st['cap'] = orolado_money(max(0.0, $balance));
    return ['can' => orolado_money($st['cap']), 'log' => array_slice(array_reverse((array) ($st['log'] ?? [])), 0, 30)];
  });
  if (!is_array($res)) return ['ok' => false, 'reason' => 'busy'];
  return ['ok' => true, 'enabled' => true, 'can' => $res['can'], 'min' => OROLADO_XFER_MIN, 'log' => $res['log']];
}

/** Ajoute une ligne dans l'historique (Opérations) du joueur. */
function orolado_xfer_history(string $uid, string $ref, float $amount, string $type, string $note): void {
  with_db_lock(static function ($box) use ($uid, $ref, $amount, $type, $note) {
    if (!isset($box->db['users'][$uid]) || !is_array($box->db['users'][$uid])) return ['ok' => true, 'skip_write' => true];
    $u =& $box->db['users'][$uid];
    if (!isset($u['transactions']) || !is_array($u['transactions'])) $u['transactions'] = [];
    foreach ($u['transactions'] as $t) if (is_array($t) && ($t['id'] ?? '') === $ref) return ['ok' => true, 'skip_write' => true];
    array_unshift($u['transactions'], ['id' => $ref, 'at' => date('c'), 'type' => $type, 'amount' => $amount, 'note' => $note, 'mode' => 'real', 'status' => 'COMPLETED']);
    $u['transactions'] = array_slice($u['transactions'], 0, 80);
    unset($u);
    return ['ok' => true];
  });
}

/**
 * Envoi. $to = ['uid' => …, 'id' => 'OR…', 'name' => …] (trouvé par live_who côté appelant).
 * Retour : ['ok' => true, 'amount', 'can'] ou ['ok' => false, 'reason' => 'min'|'tooMuch'|'dayMax'|'self'|'busy'|'insufficient'|'unavailable'].
 */
function orolado_xfer_send(array $db, array $user, array $to, float $amount, int $now = 0): array {
  $uid = (string) ($user['id'] ?? '');
  $toUid = (string) ($to['uid'] ?? '');
  $now = $now ?: time();
  if ($uid === '' || !orolado_xfer_allowed($user)) return ['ok' => false, 'reason' => 'off'];
  $amount = floor($amount * 100 + 1e-6) / 100;
  if ($amount + 1e-9 < OROLADO_XFER_MIN) return ['ok' => false, 'reason' => 'min'];
  if ($toUid === '' || !isset($db['users'][$toUid])) return ['ok' => false, 'reason' => 'notFound'];
  $mine = function_exists('orolado_linked_balance_ids') ? orolado_linked_balance_ids($db, $uid) : [$uid];
  if ($toUid === $uid || in_array($toUid, $mine, true)) return ['ok' => false, 'reason' => 'self'];
  $role = strtolower((string) ($db['users'][$toUid]['role'] ?? ''));
  if (in_array($role, ['suspended', 'banned', 'deleted'], true)) return ['ok' => false, 'reason' => 'notFound'];
  $payFrom = orolado_aff_pay_uuid($db, $uid);
  if ($payFrom === '' || orolado_aff_pay_uuid($db, $toUid) === '') return ['ok' => false, 'reason' => 'unavailable'];
  $balance = function_exists('orolado_official_real') ? orolado_official_real($db, $uid) : orolado_money($db['vault'][$uid]['real'] ?? 0);
  $ref = 'adm_xf_' . bin2hex(random_bytes(8));
  // 1) Réserver sur le compteur (sous verrou) : deux envois en même temps ne peuvent pas dépasser.
  $res = orolado_xfer_with($uid, static function (array &$st) use ($db, $uid, $balance, $amount, $now, $ref, $to) {
    orolado_xfer_absorb($db, $uid, $st);
    if ($st['cap'] > $balance) $st['cap'] = orolado_money(max(0.0, $balance));
    if ($amount > $st['cap'] + 1e-9) return ['err' => 'tooMuch', 'can' => $st['cap']];
    if (orolado_xfer_day_sent($st, $now) + $amount > OROLADO_XFER_DAY_MAX + 1e-9) return ['err' => 'dayMax'];
    $st['cap'] = orolado_money($st['cap'] - $amount);
    $st['sent'] = orolado_money((float) ($st['sent'] ?? 0) + $amount);
    $st['log'][] = ['dir' => 'out', 'ref' => $ref, 'amount' => $amount, 'at' => $now, 'to' => (string) $to['uid'], 'toId' => (string) ($to['id'] ?? ''), 'name' => (string) ($to['name'] ?? ''), 'state' => 'debit'];
    return ['ok' => true];
  });
  if (!is_array($res)) return ['ok' => false, 'reason' => 'busy'];
  if (isset($res['err'])) return ['ok' => false, 'reason' => $res['err'], 'can' => $res['can'] ?? null];
  // 2) Retirer l'argent de l'envoyeur (une seule fois, refusé par la base si le solde ne suffit pas).
  $deb = orolado_trade_debit($payFrom, $ref, $amount);
  if (empty($deb['ok'])) {
    orolado_xfer_with($uid, static function (array &$st) use ($ref, $amount) {
      $st['cap'] = orolado_money((float) ($st['cap'] ?? 0) + $amount);
      $st['sent'] = orolado_money(max(0.0, (float) ($st['sent'] ?? 0) - $amount));
      $st['log'] = array_values(array_filter((array) ($st['log'] ?? []), static fn($l) => ($l['ref'] ?? '') !== $ref));
      return true;
    });
    return ['ok' => false, 'reason' => ($deb['reason'] ?? '') === 'insufficient' ? 'insufficient' : 'unavailable'];
  }
  orolado_xfer_with($uid, static function (array &$st) use ($ref) {
    foreach ($st['log'] as &$l) if (($l['ref'] ?? '') === $ref) $l['state'] = 'credit';
    unset($l);
    return true;
  });
  @with_db_lock(static function ($box) use ($uid, $deb) {
    if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 0, 'real' => 0];
    $box->db['vault'][$uid]['real'] = orolado_money($deb['real'] ?? 0);
    return ['ok' => true];
  });
  $fromName = trim((string) ($user['displayName'] ?? $user['name'] ?? ''));
  orolado_xfer_history($uid, $ref, -$amount, 'transfer', 'Envoyé à ton ami ' . (string) ($to['name'] ?? '') . ' (' . (string) ($to['id'] ?? '') . ')');
  // 3) Créditer l'ami (bonus ×2), une seule fois. En cas d'échec : réessayé plus tard (orolado_xfer_retry).
  orolado_xfer_credit($db, $uid, $ref);
  return ['ok' => true, 'amount' => $amount, 'ref' => $ref, 'fromName' => $fromName];
}

/** Crédit de l'ami pour un envoi déjà retiré à l'envoyeur. */
function orolado_xfer_credit(array $db, string $uid, string $ref): bool {
  $l = orolado_xfer_with($uid, static function (array &$st) use ($ref) {
    foreach ((array) ($st['log'] ?? []) as $x) if (($x['ref'] ?? '') === $ref) return $x;
    return null;
  });
  if (!is_array($l) || ($l['state'] ?? '') !== 'credit') return false;
  $from = function_exists('live_who_uid') ? live_who_uid($uid) : null;
  $fromLabel = $from ? ($from['name'] . ' (' . $from['id'] . ')') : 'un ami';
  $note = 'Reçu de ton ami ' . $fromLabel;
  $ok = function_exists('orolado_aff_pay_friend') && orolado_aff_pay_friend($db, (string) $l['to'], (float) $l['amount'], $ref, $note);
  if (!$ok) return false;
  orolado_xfer_with($uid, static function (array &$st) use ($ref) {
    foreach ($st['log'] as &$x) if (($x['ref'] ?? '') === $ref) $x['state'] = 'done';
    unset($x);
    return true;
  });
  // Côté ami : une ligne « reçu » dans son propre historique des transferts.
  orolado_xfer_with((string) $l['to'], static function (array &$st) use ($l, $uid, $from) {
    foreach ((array) ($st['log'] ?? []) as $x) if (($x['ref'] ?? '') === $l['ref']) return true;
    $st['log'][] = ['dir' => 'in', 'ref' => $l['ref'], 'amount' => (float) $l['amount'], 'at' => time(), 'from' => $uid, 'fromId' => $from['id'] ?? '', 'name' => $from['name'] ?? '', 'state' => 'done'];
    return true;
  });
  return true;
}

/** Envois retirés mais pas encore crédités (base injoignable) : on réessaie. */
function orolado_xfer_retry(array $db, string $uid): void {
  $todo = orolado_xfer_with($uid, static function (array &$st) {
    $r = [];
    foreach ((array) ($st['log'] ?? []) as $l) {
      if (($l['dir'] ?? '') !== 'out') continue;
      // « debit » resté en route (coupure pendant l'envoi) : seulement après 2 min, pour ne pas croiser l'envoi en cours.
      if (($l['state'] ?? '') === 'credit' || (($l['state'] ?? '') === 'debit' && (int) ($l['at'] ?? 0) < time() - 120)) $r[] = $l;
    }
    return $r;
  }) ?: [];
  foreach ($todo as $l) {
    $ref = (string) $l['ref'];
    if (($l['state'] ?? '') === 'debit') {
      // Le retrait est à référence unique : s'il avait déjà eu lieu, la base le dit (aucun double retrait).
      $payFrom = orolado_aff_pay_uuid($db, $uid);
      $deb = $payFrom !== '' ? orolado_trade_debit($payFrom, $ref, (float) $l['amount']) : ['ok' => false, 'reason' => 'unavailable'];
      if (empty($deb['ok'])) {
        if (($deb['reason'] ?? '') === 'insufficient') {
          orolado_xfer_with($uid, static function (array &$st) use ($ref, $l) {
            $st['cap'] = orolado_money((float) ($st['cap'] ?? 0) + (float) $l['amount']);
            $st['sent'] = orolado_money(max(0.0, (float) ($st['sent'] ?? 0) - (float) $l['amount']));
            $st['log'] = array_values(array_filter((array) ($st['log'] ?? []), static fn($x) => ($x['ref'] ?? '') !== $ref));
            return true;
          });
        }
        continue;
      }
      orolado_xfer_with($uid, static function (array &$st) use ($ref) {
        foreach ($st['log'] as &$x) if (($x['ref'] ?? '') === $ref) $x['state'] = 'credit';
        unset($x);
        return true;
      });
    }
    orolado_xfer_credit($db, $uid, $ref);
  }
}
