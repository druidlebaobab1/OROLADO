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
  if ($st !== $before) $st['uid'] = $uid; // 2026-11-23 : le propriétaire du fichier (la ronde de reprise n'a plus à lire tous les joueurs)
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

/** Compte démo affilié (partenaire) : son solde « réel » est rechargé par l'admin, il ne doit jamais sortir. */
function orolado_xfer_is_demo_account(array $db, array $user): bool {
  if (!empty($user['partner'])) return true;
  $uid = (string) ($user['id'] ?? '');
  return $uid !== '' && function_exists('orolado_is_partner') && orolado_is_partner($db, $uid);
}

/** « Nom (ID) », ou seulement le nom, ou seulement l'ID. */
function orolado_xfer_label(string $name, string $id): string {
  $name = trim($name); $id = trim($id);
  if ($name !== '' && $id !== '' && $name !== $id) return $name . ' (' . $id . ')';
  return $name !== '' ? $name : ($id !== '' ? $id : '?');
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
    // v2694 (propriétaire) : tout l'historique reste gardé ; on en montre jusqu'à 300 (sans les numéros internes des comptes)
    $log = array_map(static function ($l) { unset($l['to'], $l['from']); return $l; }, array_slice(array_reverse((array) ($st['log'] ?? [])), 0, 300));
    return ['can' => orolado_money($st['cap']), 'log' => $log];
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
  // 2026-11-20 (revue « comptes démo ») : un compte démo affilié (partenaire, rechargé par l'admin) n'envoie JAMAIS d'argent,
  // vérifié ICI aussi (pas seulement dans api.php) : son argent ne doit jamais devenir celui d'un vrai joueur.
  if (orolado_xfer_is_demo_account($db, $user)) return ['ok' => false, 'reason' => 'off'];
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
  $v0 = function_exists('supabase_admin_vault') ? supabase_admin_vault($payFrom) : null;
  $deb = orolado_trade_debit($payFrom, $ref, $amount);
  // 2026-11-08 (revue « transferts très importants ») : réponse perdue (base lente / coupure) → on ne sait pas si l'argent est
  // parti. Avant : on annulait toujours → l'envoyeur pouvait être débité SANS que l'ami soit crédité. Maintenant on relit le
  // vrai solde : s'il a baissé d'au moins le montant, le retrait a bien eu lieu → on le note et l'ami est crédité.
  if (empty($deb['ok']) && ($deb['reason'] ?? '') !== 'insufficient' && is_array($v0) && function_exists('supabase_admin_vault')) {
    $b0 = orolado_money($v0['real'] ?? 0);
    for ($try = 0; $try < 3; $try++) {
      if ($try) usleep(400000);
      $v1 = supabase_admin_vault($payFrom);
      if (!is_array($v1)) continue;
      $b1 = orolado_money($v1['real'] ?? 0);
      if ($b1 <= $b0 - $amount + 0.009) {
        orolado_xfer_mark_debited($payFrom, $ref, $amount, $b1);
        $deb = ['ok' => true, 'real' => $b1, 'recovered' => true];
      }
      break;
    }
  }
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
  orolado_xfer_history($uid, $ref, -$amount, 'transfer', 'Transfert envoyé à ' . orolado_xfer_label((string) ($to['name'] ?? ''), (string) ($to['id'] ?? '')));
  // 3) Créditer l'ami (bonus ×2), une seule fois. En cas d'échec : réessayé plus tard (orolado_xfer_retry / ronde automatique).
  if (!orolado_xfer_credit($db, $uid, $ref)) orolado_xfer_flag($uid);
  return ['ok' => true, 'amount' => $amount, 'ref' => $ref, 'fromName' => $fromName];
}

/** Note « débit fait » (même marqueur que orolado_trade_debit) : un nouvel essai ne retire jamais une 2e fois. */
function orolado_xfer_mark_debited(string $payId, string $ref, float $amount, float $real): void {
  $dir = orolado_data_dir() . '/stakes';
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $key = hash('sha256', $payId . '|' . $ref);
  $marker = $dir . '/' . $key . '.ok';
  if (!is_file($marker)) @file_put_contents($marker, json_encode(['at' => date('c'), 'stake' => orolado_money($amount), 'real' => orolado_money($real), 'recovered' => 1]));
}

/** Crédit de l'ami pour un envoi déjà retiré à l'envoyeur. */
function orolado_xfer_credit(array $db, string $uid, string $ref): bool {
  $l = orolado_xfer_with($uid, static function (array &$st) use ($ref) {
    foreach ((array) ($st['log'] ?? []) as $x) if (($x['ref'] ?? '') === $ref) return $x;
    return null;
  });
  if (!is_array($l) || ($l['state'] ?? '') !== 'credit') return false;
  $from = function_exists('live_who_uid') ? live_who_uid($uid) : null;
  if (!$from && is_array($db['users'][$uid] ?? null)) {
    // Secours (Live indisponible) : nom et ID du compte, pour que l'ami sache QUI lui a envoyé.
    $su = $db['users'][$uid];
    $from = ['name' => trim((string) ($su['displayName'] ?? $su['name'] ?? '')), 'id' => (string) ($su['publicId'] ?? '')];
    if ($from['name'] === '' && $from['id'] === '') $from = null;
  }
  $fromLabel = $from ? orolado_xfer_label((string) $from['name'], (string) $from['id']) : 'un ami';
  $note = 'Transfert reçu de ' . $fromLabel;
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

/**
 * 2026-11-23 (propriétaire : « vérifier qu'il n'y a pas d'erreur dans les envois d'argent ») — avant, un envoi retiré à
 * l'envoyeur mais pas encore crédité à l'ami (base injoignable un instant) n'était repris QUE quand l'envoyeur rouvrait
 * « Envoyer de l'argent ». Maintenant la ronde automatique (toutes les 2 min, après une réponse) les reprend tous, tout seule :
 * mêmes références uniques (jamais retiré ni crédité deux fois). Au plus 20 comptes par ronde.
 */
function orolado_xfer_flag(string $uid): void {
  $f = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'xfer' . DIRECTORY_SEPARATOR . 'pending.json';
  $p = json_decode((string) @file_get_contents($f), true); if (!is_array($p)) $p = [];
  $p[$uid] = time(); @file_put_contents($f, json_encode($p), LOCK_EX);
}
/** Léger : ne lit QUE les comptes notés « en attente » (aucun envoi en attente = rien à faire, aucune lecture). */
function orolado_xfer_retry_all(array $db): int {
  $f = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'xfer' . DIRECTORY_SEPARATOR . 'pending.json';
  if (!is_file($f)) return 0;
  $p = json_decode((string) @file_get_contents($f), true); if (!is_array($p) || !$p) { @unlink($f); return 0; }
  $n = 0; $left = [];
  foreach (array_slice($p, 0, 20, true) as $uid => $at) {
    $uid = (string) $uid;
    try { orolado_xfer_retry($db, $uid); } catch (Throwable $e) { /* jamais bloquant */ }
    $n++;
    $st = orolado_xfer_read($uid); $still = false;
    foreach ((array) ($st['log'] ?? []) as $l) if (($l['dir'] ?? '') === 'out' && in_array((string) ($l['state'] ?? ''), ['credit', 'debit'], true)) { $still = true; break; }
    if ($still && (int) $at > time() - 7 * 86400) $left[$uid] = (int) $at;
  }
  foreach (array_slice($p, 20, null, true) as $uid => $at) $left[(string) $uid] = (int) $at;
  if ($left) @file_put_contents($f, json_encode($left), LOCK_EX); else @unlink($f);
  return $n;
}

/** Lecture seule (sans verrou) de l'état des transferts d'un compte. */
function orolado_xfer_read(string $uid): array {
  $f = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'xfer' . DIRECTORY_SEPARATOR . hash('sha256', 'xfer|' . $uid) . '.json';
  if (!is_file($f)) return [];
  $st = json_decode((string) @file_get_contents($f), true);
  return is_array($st) ? $st : [];
}

/**
 * Lignes « transfert » de l'historique financier d'un joueur (comptes liés compris) :
 *  - ['in'][ref]  = nom / ID de celui qui a envoyé (pour réétiqueter le bonus adm_xf_… reçu) ;
 *  - ['out'][]    = envois déjà retirés du solde (état credit / done), montant négatif.
 */
function orolado_xfer_history_rows(array $ids): array {
  $in = []; $out = [];
  foreach (array_unique(array_filter(array_map('strval', $ids))) as $uid) {
    foreach ((array) (orolado_xfer_read($uid)['log'] ?? []) as $l) {
      if (!is_array($l) || ($l['ref'] ?? '') === '') continue;
      $ref = (string) $l['ref'];
      if (($l['dir'] ?? '') === 'in') {
        $in[$ref] = ['name' => (string) ($l['name'] ?? ''), 'id' => (string) ($l['fromId'] ?? '')];
      } else if (($l['dir'] ?? '') === 'out' && in_array((string) ($l['state'] ?? ''), ['credit', 'done'], true)) {
        $out[$ref] = [
          'at' => date('c', (int) ($l['at'] ?? 0)), 'ref' => $ref, 'amount' => -abs(orolado_money($l['amount'] ?? 0)),
          'kind' => 'xfer_out', 'status' => 'COMPLETED', 'gateway' => 'OROLADO',
          'peer' => trim((string) ($l['name'] ?? '')) !== '' ? (string) $l['name'] : (string) ($l['toId'] ?? ''),
          'peerId' => (string) ($l['toId'] ?? ''),
        ];
      }
    }
  }
  return ['in' => $in, 'out' => array_values($out)];
}

/**
 * TOUS les transferts entre joueurs (admin + scripts/list-transfers.php), du plus récent au plus ancien.
 * Source : data/xfer/<sha256("xfer|" + id du compte)>.json. Chaque envoi y est noté deux fois : « out » chez celui qui
 * envoie (avec le compte qui reçoit), « in » chez celui qui reçoit (avec le compte qui envoie) ; ici, une ligne par envoi.
 */
/** 2026-11-23 : les joueurs sont dans un OroladoMap (pas un tableau) — « (array) » donnait ses champs internes, pas les joueurs. */
function orolado_xfer_user_ids(array $db): array {
  $u = $db['users'] ?? [];
  if (is_object($u) && method_exists($u, 'toArray')) $u = $u->toArray();
  return is_array($u) ? array_map('strval', array_keys($u)) : [];
}
function orolado_xfer_all(array $db): array {
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'xfer';
  if (!is_dir($dir)) return [];
  $owner = [];
  foreach (orolado_xfer_user_ids($db) as $uid) $owner[hash('sha256', 'xfer|' . $uid) . '.json'] = (string) $uid;
  $rows = [];
  foreach (glob($dir . DIRECTORY_SEPARATOR . '*.json') ?: [] as $f) {
    $me = $owner[basename($f)] ?? '';
    $st = json_decode((string) @file_get_contents($f), true);
    if (!is_array($st)) continue;
    foreach ((array) ($st['log'] ?? []) as $l) {
      if (!is_array($l) || ($l['ref'] ?? '') === '') continue;
      $ref = (string) $l['ref'];
      $r = $rows[$ref] ?? ['ref' => $ref, 'at' => 0, 'amount' => 0.0, 'fromUid' => '', 'fromId' => '', 'fromName' => '', 'toUid' => '', 'toId' => '', 'toName' => '', 'state' => ''];
      if (($l['dir'] ?? '') === 'out') {
        $r['at'] = (int) ($l['at'] ?? 0) ?: $r['at'];
        $r['amount'] = orolado_money($l['amount'] ?? 0);
        $r['state'] = (string) ($l['state'] ?? '');
        if ($me !== '') $r['fromUid'] = $me;
        $r['toUid'] = (string) ($l['to'] ?? $r['toUid']);
        $r['toId'] = (string) ($l['toId'] ?? '') ?: $r['toId'];
        $r['toName'] = (string) ($l['name'] ?? '') ?: $r['toName'];
      } else if (($l['dir'] ?? '') === 'in') {
        if (!$r['at']) $r['at'] = (int) ($l['at'] ?? 0);
        if ($r['amount'] <= 0) $r['amount'] = orolado_money($l['amount'] ?? 0);
        if ($r['state'] === '') $r['state'] = (string) ($l['state'] ?? 'done');
        $r['fromUid'] = (string) ($l['from'] ?? '') ?: $r['fromUid'];
        $r['fromId'] = (string) ($l['fromId'] ?? '') ?: $r['fromId'];
        $r['fromName'] = (string) ($l['name'] ?? '') ?: $r['fromName'];
        if ($me !== '' && $r['toUid'] === '') $r['toUid'] = $me;
      } else {
        continue;
      }
      $rows[$ref] = $r;
    }
  }
  foreach ($rows as &$r) {
    foreach (['from', 'to'] as $side) {
      $u = $db['users'][$r[$side . 'Uid']] ?? null;
      if (!is_array($u)) continue;
      if ($r[$side . 'Name'] === '') $r[$side . 'Name'] = trim((string) ($u['displayName'] ?? $u['name'] ?? ''));
      if ($r[$side . 'Id'] === '') $r[$side . 'Id'] = (string) ($u['publicId'] ?? '');
    }
  }
  unset($r);
  $rows = array_values($rows);
  usort($rows, static fn($a, $b) => ($b['at'] <=> $a['at']) ?: strcmp($a['ref'], $b['ref']));
  return $rows;
}

/** État lisible d'un envoi : « Réussi » (ami crédité), « En cours » (ami pas encore crédité, réessayé tout seul). */
function orolado_xfer_state_label(string $state): string {
  return $state === 'done' ? 'Réussi' : ($state === 'credit' ? 'En cours (ami pas encore crédité)' : ($state === 'debit' ? 'En cours (retrait en route)' : $state));
}
