<?php
declare(strict_types=1);
/**
 * Inviter un ami (v2413) — règle choisie par le propriétaire le 2026-10-07 :
 *  - l'ami invité reçoit 5 % de son PREMIER dépôt, une seule fois, en bonus (à miser ×2 avant retrait) ;
 *  - celui qui invite reçoit 5 % de CHAQUE dépôt de l'ami pendant 365 jours, LIBRE (retirable sans jouer).
 *  - tout le reste du site garde la règle normale ×2.
 * Calcul : un tricheur à 2 comptes reçoit 2 × 5 % mais perd ~5,5 % de tout ce qu'il mise
 * (dépôt + bonus misés 2 fois) → il perd ~1,6 $ sur 100 $. Au-delà de 5 %, il gagnerait.
 *
 * Ne touche à AUCUN chemin de paiement : lit seulement la liste des dépôts confirmés (la même que
 * celle qui autorise les retraits). Versements par orolado_trade_credit_once (une seule fois par
 * référence). Données à part : data/aff/ (fichiers verrouillés).
 * Mode test : seul le compte admin a un lien ; ses propres cadeaux vont sur sa démo.
 * Ouverture à tous : OROLADO_AFF_PUBLIC=1 sur le serveur.
 */

const OROLADO_AFF_PCT = 0.05;

function orolado_aff_public(): bool {
  $v = getenv('OROLADO_AFF_PUBLIC');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_AFF_PUBLIC'] ?? '';
  return (string) $v === '1';
}

function orolado_aff_is_tester(array $user): bool {
  return function_exists('orolado_is_admin_user') && orolado_is_admin_user($user);
}

function orolado_aff_allowed(array $user): bool {
  return orolado_aff_public() || orolado_aff_is_tester($user);
}

function orolado_aff_dir(): string {
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'aff';
  if (!is_dir($dir)) @mkdir($dir, 0750, true);
  return $dir;
}

/** Fichier JSON sous verrou ; $fn reçoit le contenu par référence. */
function orolado_aff_with(string $name, callable $fn) {
  $fp = @fopen(orolado_aff_dir() . DIRECTORY_SEPARATOR . $name . '.json', 'c+');
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

function orolado_aff_read(string $name): array {
  $p = orolado_aff_dir() . DIRECTORY_SEPARATOR . $name . '.json';
  if (!is_file($p)) return [];
  $st = json_decode((string) @file_get_contents($p), true);
  return is_array($st) ? $st : [];
}

function orolado_aff_inv_name(string $uid): string { return 'inv_' . hash('sha256', 'aff-inv|' . $uid); }
function orolado_aff_owner_name(string $uid): string { return 'own_' . hash('sha256', 'aff-own|' . $uid); }

/** Code d'invitation du joueur : 8 caractères, toujours le même pour lui. */
function orolado_aff_code(string $uid): string {
  $h = strtoupper(base_convert(substr(hash('sha256', 'orolado-ami|' . $uid), 0, 12), 16, 36));
  return str_pad(substr($h, 0, 8), 8, '0', STR_PAD_LEFT);
}

function orolado_aff_clean_code(string $code): string {
  $c = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code) ?? '');
  return strlen($c) === 8 ? $c : '';
}

/** Enregistre le code du joueur (pour retrouver qui invite à partir du lien). */
function orolado_aff_register_code(string $uid): string {
  $code = orolado_aff_code($uid);
  orolado_aff_with('code_' . $code, static function (&$st) use ($uid) {
    if (empty($st['uid'])) $st = ['uid' => $uid, 'at' => date('c')];
  });
  return $code;
}

function orolado_aff_client_ip(): string {
  $ip = (string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '');
  return substr(preg_replace('/[^0-9a-fA-F:.]/', '', $ip) ?? '', 0, 64);
}

/**
 * À l'inscription d'un NOUVEAU compte avec un lien d'ami : relie le nouveau joueur à celui qui invite.
 * Refusé : code inconnu, soi-même, compte qui invite introuvable / bloqué / non autorisé, déjà relié.
 */
function orolado_aff_attach(array $db, string $newUid, string $code): bool {
  $code = orolado_aff_clean_code($code);
  if ($code === '' || $newUid === '') return false;
  $inviter = (string) (orolado_aff_read('code_' . $code)['uid'] ?? '');
  if ($inviter === '' || $inviter === $newUid) return false;
  $iu = $db['users'][$inviter] ?? null;
  if (!is_array($iu) || !orolado_aff_allowed($iu + ['id' => $inviter])) return false;
  if (function_exists('orolado_user_block_kind') && orolado_user_block_kind($db, $inviter) !== '') return false;
  $ip = orolado_aff_client_ip();
  $ok = orolado_aff_with(orolado_aff_inv_name($newUid), static function (&$st) use ($inviter, $code, $ip) {
    if (!empty($st['inviter'])) return false;
    $st = ['inviter' => $inviter, 'code' => $code, 'at' => date('c'), 'ip' => $ip, 'paid' => false];
    return true;
  });
  if (!$ok) return false;
  $name = (string) ($db['users'][$newUid]['displayName'] ?? '');
  orolado_aff_with(orolado_aff_owner_name($inviter), static function (&$st) use ($newUid, $name, $ip) {
    if (!isset($st['friends']) || !is_array($st['friends'])) $st['friends'] = [];
    foreach ($st['friends'] as $f) if (($f['uid'] ?? '') === $newUid) return;
    $st['friends'][] = ['uid' => $newUid, 'name' => $name, 'at' => date('c'), 'ip' => $ip, 'deposit' => 0, 'gift' => 0, 'paid' => false];
  });
  return true;
}

/** Vrais dépôts confirmés du joueur (pas les bonus admin / défi / cadeaux), du plus ancien au plus récent. */
function orolado_aff_real_deposits(array $db, string $uid): array {
  $ids = function_exists('orolado_linked_balance_ids') ? orolado_linked_balance_ids($db, $uid) : [$uid];
  if (!$ids) $ids = [$uid];
  $list = [];
  $seen = [];
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    if (!in_array((string) ($d['userId'] ?? $d['user_id'] ?? ''), $ids, true)) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if ($st !== 'COMPLETED' && $st !== 'PAID') continue;
    $id = (string) ($d['id'] ?? $d['ref'] ?? '');
    if ($id === '' || isset($seen[$id])) continue;
    if (strtolower((string) ($d['operator'] ?? '')) === 'admin' || str_starts_with($id, 'adm_')) continue;
    $amt = orolado_money($d['amount'] ?? 0);
    if ($amt <= 0.009) continue;
    $seen[$id] = true;
    $at = (string) ($d['paidAt'] ?? $d['createdAt'] ?? $d['at'] ?? '');
    $list[] = ['id' => $id, 'amount' => $amt, 'at' => $at, 'ts' => $at !== '' ? (int) strtotime($at) : 0];
  }
  usort($list, static fn($x, $y) => $x['ts'] <=> $y['ts'] ?: strcmp($x['id'], $y['id']));
  return $list;
}
function orolado_aff_pay_uuid(array $db, string $uid): string {
  $payId = function_exists('orolado_balance_uuid') ? orolado_balance_uuid($db, $uid) : '';
  if (!preg_match(OROLADO_UUID_RE, $payId) && function_exists('orolado_ensure_balance_uuid')) $payId = (string) orolado_ensure_balance_uuid($uid, null);
  return preg_match(OROLADO_UUID_RE, $payId) ? $payId : '';
}

/** Cadeau de l'ami : bonus (opérateur admin) → règle « miser ×2 avant retrait ». Une seule fois. */
function orolado_aff_pay_friend(array $db, string $uid, float $gift, string $ref): bool {
  $payId = orolado_aff_pay_uuid($db, $uid);
  if ($payId === '') return false;
  $got = orolado_trade_credit_once($payId, $ref, $gift);
  if ($got === null) return false;
  with_db_lock(static function ($box) use ($uid, $gift, $ref, $got) {
    $locked =& $box->db;
    foreach (($locked['deposits'] ?? []) as $d) {
      if (is_array($d) && (string) ($d['id'] ?? '') === $ref) return ['ok' => true, 'skip_write' => true];
    }
    if (!isset($locked['deposits']) || !is_array($locked['deposits'])) $locked['deposits'] = [];
    $locked['deposits'][] = [
      'id' => $ref, 'ref' => $ref, 'userId' => $uid, 'amount' => $gift, 'status' => 'COMPLETED',
      'operator' => 'admin', 'createdAt' => date('c'), 'paidAt' => date('c'), 'note' => 'Cadeau invitation', 'motif' => 'Cadeau invitation',
    ];
    if (isset($locked['users'][$uid]) && is_array($locked['users'][$uid])) {
      $u =& $locked['users'][$uid];
      $u['realDepositTotal'] = orolado_money(($u['realDepositTotal'] ?? 0) + $gift);
      $u['requiredWagering'] = orolado_money($u['realDepositTotal'] * 2);
      $u['wagerLock'] = orolado_money(($u['wagerLock'] ?? 0) + $gift);
      $u['wagerNeed'] = orolado_money(($u['wagerNeed'] ?? 0) + $gift * 2);
      if (!isset($u['transactions']) || !is_array($u['transactions'])) $u['transactions'] = [];
      array_unshift($u['transactions'], ['id' => $ref, 'at' => date('c'), 'type' => 'deposit', 'amount' => $gift, 'note' => 'Cadeau invitation', 'mode' => 'real', 'status' => 'COMPLETED']);
      $u['transactions'] = array_slice($u['transactions'], 0, 80);
      unset($u);
    }
    if (!isset($locked['vault'][$uid]) || !is_array($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
    $locked['vault'][$uid]['real'] = $got;
    return ['ok' => true];
  });
  if (function_exists('supabase_insert_deposit')) {
    supabase_insert_deposit(['id' => $ref, 'user_id' => $payId, 'amount' => $gift, 'status' => 'COMPLETED', 'operator' => 'admin', 'reference' => $ref]);
  }
  return true;
}

/** Part de celui qui invite : LIBRE (comme un gain), aucune ligne de dépôt → rien à miser. Une seule fois. */
function orolado_aff_pay_inviter(array $db, string $uid, float $gift, string $ref): bool {
  $user = $db['users'][$uid] ?? [];
  if (is_array($user) && orolado_aff_is_tester($user + ['id' => $uid])) {
    // Compte admin (mode test) : sur sa démo, jamais d'argent réel.
    $done = with_db_lock(static function ($box) use ($uid, $gift) {
      if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 0, 'real' => 0];
      $box->db['vault'][$uid]['demo'] = orolado_money(($box->db['vault'][$uid]['demo'] ?? 0) + $gift);
      return ['ok' => true];
    });
    return !empty($done['ok']);
  }
  $payId = orolado_aff_pay_uuid($db, $uid);
  if ($payId === '') return false;
  $got = orolado_trade_credit_once($payId, $ref, $gift);
  if ($got === null) return false;
  with_db_lock(static function ($box) use ($uid, $gift, $ref, $got) {
    $locked =& $box->db;
    if (isset($locked['users'][$uid]) && is_array($locked['users'][$uid])) {
      $u =& $locked['users'][$uid];
      if (!isset($u['transactions']) || !is_array($u['transactions'])) $u['transactions'] = [];
      foreach ($u['transactions'] as $t) if (is_array($t) && ($t['id'] ?? '') === $ref) return ['ok' => true, 'skip_write' => true];
      array_unshift($u['transactions'], ['id' => $ref, 'at' => date('c'), 'type' => 'bonus', 'amount' => $gift, 'note' => 'Invitation ami', 'mode' => 'real', 'status' => 'COMPLETED']);
      $u['transactions'] = array_slice($u['transactions'], 0, 80);
      unset($u);
    }
    if (!isset($locked['vault'][$uid]) || !is_array($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
    $locked['vault'][$uid]['real'] = $got;
    return ['ok' => true];
  });
  return true;
}

/**
 * Verse ce qui est dû, une seule fois par dépôt :
 *  - l'ami : 5 % de son PREMIER vrai dépôt (bonus, à miser ×2) — une seule fois ;
 *  - celui qui invite : 5 % de CHAQUE vrai dépôt de l'ami fait dans les 365 jours après son inscription
 *    (libre, retirable sans jouer).
 * Chaque versement a sa référence unique (par dépôt) : même appelé 100 fois, rien n'est payé deux fois.
 */
const OROLADO_AFF_DAYS = 365;

function orolado_aff_gift(float $amount): float {
  return orolado_money(floor($amount * OROLADO_AFF_PCT * 100 + 0.0001) / 100);
}

function orolado_aff_settle(array $db, string $friendUid): ?array {
  $inv = orolado_aff_read(orolado_aff_inv_name($friendUid));
  if (empty($inv['inviter'])) return null;
  $deps = orolado_aff_real_deposits($db, $friendUid);
  if (!$deps) return $inv;
  $start = (int) strtotime((string) ($inv['at'] ?? ''));
  $end = $start + OROLADO_AFF_DAYS * 86400;
  $todo = false;
  if (empty($inv['friendPaid'])) $todo = true;
  foreach ($deps as $d) {
    if ($d['ts'] > 0 && $d['ts'] <= $end && empty($inv['deps'][$d['id']]['paid'])) $todo = true;
  }
  if (!$todo) return $inv;
  $inviter = (string) $inv['inviter'];
  $res = orolado_aff_with(orolado_aff_inv_name($friendUid), static function (&$st) use ($db, $friendUid, $inviter, $deps, $end) {
    if (!isset($st['deps']) || !is_array($st['deps'])) $st['deps'] = [];
    // 1) Cadeau de l'ami : 5 % de son tout premier vrai dépôt, une fois.
    if (empty($st['friendPaid'])) {
      $g = orolado_aff_gift($deps[0]['amount']);
      $ok = $g < 0.01 ? true : orolado_aff_pay_friend($db, $friendUid, $g, 'adm_ami_' . $friendUid);
      if ($ok) {
        $st['friendPaid'] = true;
        $st['friendGift'] = $g;
        $st['friendDeposit'] = $deps[0]['amount'];
        if ($g >= 0.01) $st['justPaid'] = true;
      }
    }
    // 2) Part de celui qui invite : 5 % de chaque vrai dépôt pendant 365 jours.
    foreach ($deps as $d) {
      if ($d['ts'] <= 0 || $d['ts'] > $end) continue;
      if (!empty($st['deps'][$d['id']]['paid'])) continue;
      $g = orolado_aff_gift($d['amount']);
      $ok = $g < 0.01 ? true : orolado_aff_pay_inviter($db, $inviter, $g, 'aff_' . substr(hash('sha256', $friendUid . '|' . $d['id']), 0, 24));
      if ($ok) {
        $st['deps'][$d['id']] = ['amount' => $d['amount'], 'gift' => $g, 'paid' => true, 'at' => date('c')];
        if ($g >= 0.01) $st['newPays'][] = ['ref' => 'aff_' . substr(hash('sha256', $friendUid . '|' . $d['id']), 0, 24), 'amount' => $g, 'deposit' => $d['amount'], 'at' => date('c')];
      }
    }
    $earned = 0.0;
    $total = 0.0;
    foreach ($st['deps'] as $row) { $earned += (float) ($row['gift'] ?? 0); $total += (float) ($row['amount'] ?? 0); }
    $st['earned'] = orolado_money($earned);
    $st['depositTotal'] = orolado_money($total);
    $st['paid'] = !empty($st['friendPaid']);
    return $st;
  });
  if (!is_array($res)) return $inv;
  $newPays = (array) ($res['newPays'] ?? []);
  if ($newPays) orolado_aff_with(orolado_aff_inv_name($friendUid), static function (&$st) { unset($st['newPays']); });
  unset($res['newPays']);
  // Résumé chez celui qui invite (affichage seulement).
  orolado_aff_with(orolado_aff_owner_name($inviter), static function (&$own) use ($friendUid, $res, $newPays) {
    // Journal des gains de celui qui invite (affiché dans son historique et dans sa liste).
    if (!isset($own['log']) || !is_array($own['log'])) $own['log'] = [];
    $known = [];
    foreach ($own['log'] as $l) $known[(string) ($l['ref'] ?? '')] = 1;
    foreach ($newPays as $p) if (empty($known[$p['ref']])) $own['log'][] = $p + ['friend' => $friendUid];
    $sum = 0.0;
    foreach (($own['friends'] ?? []) as $i => $f) {
      if (($f['uid'] ?? '') === $friendUid) {
        $own['friends'][$i]['paid'] = true;
        $own['friends'][$i]['deposit'] = (float) ($res['depositTotal'] ?? 0);
        $own['friends'][$i]['gift'] = (float) ($res['earned'] ?? 0);
      }
      $sum += (float) ($own['friends'][$i]['gift'] ?? 0);
    }
    $own['earned'] = orolado_money($sum);
  });
  return $res;
}

/** Ce que voit le joueur : son lien, ses amis, ses gains ; et s'il a été invité, son cadeau. */
function orolado_aff_status(array $db, array $user): array {
  $uid = (string) ($user['id'] ?? '');
  $out = ['ok' => true, 'enabled' => false, 'pct' => (int) round(OROLADO_AFF_PCT * 100)];
  // Côté ami invité : vérifier / verser son cadeau (même si le Portail ne lui est pas encore ouvert).
  $inv = $uid !== '' ? orolado_aff_settle($db, $uid) : null;
  if (is_array($inv) && !empty($inv['inviter'])) {
    $out['invited'] = ['paid' => !empty($inv['paid']), 'gift' => orolado_money($inv['friendGift'] ?? 0)];
    if (!empty($inv['justPaid'])) {
      $out['invited']['justPaid'] = true;
      orolado_aff_with(orolado_aff_inv_name($uid), static function (&$st) { unset($st['justPaid']); });
    }
  }
  if ($uid === '' || !orolado_aff_allowed($user)) return $out;
  $code = orolado_aff_register_code($uid);
  $own = orolado_aff_read(orolado_aff_owner_name($uid));
  $friends = is_array($own['friends'] ?? null) ? $own['friends'] : [];
  // Amis encore dans leur année : on vérifie leurs nouveaux dépôts au passage.
  $changed = false;
  foreach ($friends as $f) {
    $t = (int) strtotime((string) ($f['at'] ?? ''));
    if (!empty($f['uid']) && $t > 0 && time() - $t <= (OROLADO_AFF_DAYS + 2) * 86400) {
      orolado_aff_settle($db, (string) $f['uid']);
      $changed = true;
    }
  }
  if ($changed) $own = orolado_aff_read(orolado_aff_owner_name($uid));
  $friends = is_array($own['friends'] ?? null) ? $own['friends'] : [];
  $out['enabled'] = true;
  $out['code'] = $code;
  $out['days'] = OROLADO_AFF_DAYS;
  $out['now'] = time();
  $out['clicks'] = (int) ($own['clicks'] ?? 0);
  $out['friends'] = count($friends);
  $out['deposited'] = count(array_filter($friends, static fn($f) => !empty($f['paid'])));
  $played = 0;
  $total = 0.0;
  $list = [];
  foreach ($friends as $f) {
    $fu = $db['users'][(string) ($f['uid'] ?? '')] ?? [];
    $realTrades = (int) ($fu['realTrades'] ?? 0);
    if ($realTrades > 0) $played++;
    $total += (float) ($f['deposit'] ?? 0);
    $t = (int) strtotime((string) ($f['at'] ?? ''));
    $list[] = [
      'id' => (string) ($fu['publicId'] ?? 'ORO-??????'),
      'at' => $t,
      'until' => $t > 0 ? $t + OROLADO_AFF_DAYS * 86400 : 0,
      'deposit' => orolado_money($f['deposit'] ?? 0),
      'gift' => orolado_money($f['gift'] ?? 0),
      'played' => $realTrades > 0,
    ];
  }
  usort($list, static fn($x, $y) => $y['at'] <=> $x['at']);
  $out['played'] = $played;
  $out['total'] = orolado_money($total);
  $out['earned'] = orolado_money($own['earned'] ?? 0);
  $out['list'] = array_slice($list, 0, 200);
  return $out;
}

/**
 * Clic sur un lien d'invitation (affichage seulement : « clics sur ton lien »).
 * Un même téléphone (ou une même connexion) n'est compté qu'UNE fois par jour et par lien.
 */
function orolado_aff_click(string $code, string $device): bool {
  $code = orolado_aff_clean_code($code);
  if ($code === '') return false;
  $inviter = (string) (orolado_aff_read('code_' . $code)['uid'] ?? '');
  if ($inviter === '') return false;
  $device = substr(preg_replace('/[^A-Za-z0-9]/', '', $device) ?? '', 0, 40);
  $day = date('Y-m-d');
  $keys = [hash('sha256', 'ip|' . orolado_aff_client_ip()), $device !== '' ? hash('sha256', 'dev|' . $device) : ''];
  return (bool) orolado_aff_with(orolado_aff_owner_name($inviter), static function (&$own) use ($keys, $day) {
    if (!isset($own['clickSeen']) || !is_array($own['clickSeen']) || ($own['clickDay'] ?? '') !== $day) {
      $own['clickSeen'] = [];
      $own['clickDay'] = $day;
    }
    foreach ($keys as $k) if ($k !== '' && isset($own['clickSeen'][substr($k, 0, 16)])) return false;
    foreach ($keys as $k) if ($k !== '') $own['clickSeen'][substr($k, 0, 16)] = 1;
    $own['clicks'] = (int) ($own['clicks'] ?? 0) + 1;
    return true;
  });
}

/** Lignes d'historique des gains de celui qui invite (affichage : « Cadeau invitation »). */
function orolado_aff_history_rows(string $uid): array {
  $own = orolado_aff_read(orolado_aff_owner_name($uid));
  $rows = [];
  foreach ((array) ($own['log'] ?? []) as $l) {
    if (!is_array($l) || empty($l['ref'])) continue;
    $rows[] = ['at' => (string) ($l['at'] ?? ''), 'ref' => (string) $l['ref'], 'amount' => orolado_money($l['amount'] ?? 0), 'kind' => 'bonus', 'status' => 'COMPLETED', 'gateway' => 'OROLADO', 'note' => 'Invitation'];
  }
  return $rows;
}
