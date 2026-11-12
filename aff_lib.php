<?php
declare(strict_types=1);
/**
 * Inviter un ami — lien, codes, clics, amis, liste et chiffres de l'affilié.
 * 2026-11-09 (propriétaire : « retirer les anciens systèmes, les 5 % ») : le SEUL gain est la part de revenu
 * (aff_rev_lib.php : 60 % de ce qu'OROLADO gagne réellement sur les amis, à vie, versé 24 h après, argent libre).
 * L'ancien système (5 % du 1er dépôt pour l'ami + 5 % de chaque dépôt pendant 365 jours) est supprimé :
 * plus rien n'est versé ici ; les anciens gains déjà versés restent visibles (journal, totaux).
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

/*
 * 2026-11-11 (propriétaire : « même 10 000, 1 million d'inscrits par un lien, ça doit toujours s'afficher, solide 10-20 ans »)
 * GRANDE ÉCHELLE — avant, la liste des amis était DANS le fichier du parrain : chaque inscription réécrivait tout le
 * fichier (de plus en plus lent), et la page de l'affilié recalculait tout à chaque ouverture (mesuré : 5 000 amis =
 * 18 s → page vide). Maintenant, comme les grandes plateformes :
 *   - fr_<…>.jsonl : un ami = UNE ligne ajoutée à la fin (temps constant, même au millionième) ;
 *   - le fichier du parrain ne garde que des compteurs (n = inscrits, nPaid = ont déposé) ;
 *   - les chiffres de chaque ami (dépôts) sont dans SA fiche d'invitation (inv_…), mise à jour à part ;
 *   - la part de revenu de chaque ami est gardée en mémoire (rc_…) et recalculée seulement s'il a bougé.
 * Les anciens fichiers sont convertis automatiquement, une fois, sans rien perdre (orolado_aff_migrate).
 */
function orolado_aff_fr_file(string $uid): string { return orolado_aff_dir() . DIRECTORY_SEPARATOR . 'fr_' . hash('sha256', 'aff-fr|' . $uid) . '.jsonl'; }

/** Lignes d'amis (une par ami, sans doublon). Une ligne coupée (coupure de courant) est simplement ignorée. */
function orolado_aff_fr_lines(string $uid): array {
  $f = orolado_aff_fr_file($uid);
  if (!is_file($f) || !($fh = @fopen($f, 'r'))) return [];
  $out = []; $seen = [];
  while (($l = fgets($fh)) !== false) {
    $j = json_decode($l, true);
    if (!is_array($j) || !isset($j['u']) || (string) $j['u'] === '' || isset($seen[(string) $j['u']])) continue;
    $seen[(string) $j['u']] = true;
    $out[] = $j;
  }
  fclose($fh);
  return $out;
}

/** Conversion unique d'un ancien fichier de parrain (liste « friends » dedans) vers le fichier d'ajout. */
function orolado_aff_migrate(string $uid): void {
  $p = orolado_aff_dir() . DIRECTORY_SEPARATOR . orolado_aff_owner_name($uid) . '.json';
  if (!is_file($p)) return;
  $raw = (string) @file_get_contents($p);
  if (strpos($raw, '"friends"') === false) return;
  orolado_aff_with(orolado_aff_owner_name($uid), static function (&$own) use ($uid) {
    if (!isset($own['friends']) || !is_array($own['friends'])) return;
    $have = [];
    foreach (orolado_aff_fr_lines($uid) as $l) $have[(string) $l['u']] = true;
    $buf = '';
    foreach ($own['friends'] as $fr) {
      $fu = (string) ($fr['uid'] ?? '');
      if ($fu === '' || isset($have[$fu])) continue;
      $have[$fu] = true;
      // Anciens chiffres gardés tels quels (d = déposé, p = a déposé, k = nombre de dépôts) : jamais perdus.
      $buf .= json_encode(['u' => $fu, 'a' => (string) ($fr['at'] ?? ''), 'i' => (string) ($fr['ip'] ?? ''), 'nm' => (string) ($fr['name'] ?? ''), 'g' => (float) ($fr['gift'] ?? 0),
        'd' => (float) ($fr['deposit'] ?? 0), 'p' => !empty($fr['paid']) ? 1 : 0, 'k' => (int) ($fr['n'] ?? 0)], JSON_UNESCAPED_UNICODE) . "\n";
    }
    if ($buf !== '' && @file_put_contents(orolado_aff_fr_file($uid), $buf, FILE_APPEND | LOCK_EX) === false) return; // réessayé au prochain passage
    $own['n'] = count($have);
    $own['nPaid'] = count(array_filter($own['friends'], static fn($x) => is_array($x) && !empty($x['paid'])));
    $own['friendsMigratedAt'] = date('c');
    unset($own['friends']);
  });
}

/** Les amis d'un affilié, même forme qu'avant (uid, at, ip, name, deposit, paid, n, gift). */
function orolado_aff_friends(string $uid): array {
  orolado_aff_migrate($uid);
  $out = [];
  foreach (orolado_aff_fr_lines($uid) as $l) {
    $fu = (string) $l['u'];
    $inv = orolado_aff_read(orolado_aff_inv_name($fu));
    $deps = is_array($inv['deps'] ?? null) ? $inv['deps'] : [];
    $out[] = ['uid' => $fu, 'name' => (string) ($l['nm'] ?? ''), 'at' => (string) ($l['a'] ?? ''), 'ip' => (string) ($l['i'] ?? ''),
      'code' => (string) ($l['c'] ?? ''), 'gift' => (float) ($l['g'] ?? 0), 'paid' => !empty($inv['friendPaid']) || !empty($l['p']),
      'deposit' => max((float) ($inv['depositTotal'] ?? 0), (float) ($l['d'] ?? 0)), 'n' => max(count($deps), (int) ($l['k'] ?? 0))];
  }
  return $out;
}

/** Compteurs rapides (sans lire la liste) : ['n' => inscrits, 'paid' => ont déposé, 'clicks' => clics]. */
function orolado_aff_counts(string $uid): array {
  orolado_aff_migrate($uid);
  $own = orolado_aff_read(orolado_aff_owner_name($uid));
  return ['n' => (int) ($own['n'] ?? 0), 'paid' => (int) ($own['nPaid'] ?? 0), 'clicks' => (int) ($own['clicks'] ?? 0)];
}

/** Code d'invitation du joueur : 8 caractères, toujours le même pour lui. */
function orolado_aff_code(string $uid): string {
  $h = strtoupper(base_convert(substr(hash('sha256', 'orolado-ami|' . $uid), 0, 12), 16, 36));
  return str_pad(substr($h, 0, 8), 8, '0', STR_PAD_LEFT);
}

function orolado_aff_clean_code(string $code): string {
  $c = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code) ?? '');
  return strlen($c) === 8 ? $c : '';
}

/** Code normalisé : MAJUSCULES, lettres/chiffres, 3 à 16 caractères (couvre le code par défaut de 8 ET les codes promo personnalisés). */
function orolado_aff_norm_code(string $code): string {
  $c = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code) ?? '');
  return (strlen($c) >= 3 && strlen($c) <= 16) ? $c : '';
}

const OROLADO_AFF_MAX_CODES = 5; // codes promo personnalisés max par affilié (demande du propriétaire)

/** Codes de l'affilié : son code par défaut + ses codes promo personnalisés. */
function orolado_aff_codes(string $uid): array {
  $own = orolado_aff_read(orolado_aff_owner_name($uid));
  $custom = [];
  foreach ((array) ($own['codes'] ?? []) as $c) { $c = orolado_aff_norm_code((string) $c); if ($c !== '') $custom[$c] = true; }
  return ['default' => orolado_aff_code($uid), 'custom' => array_keys($custom), 'max' => OROLADO_AFF_MAX_CODES];
}

/** Crée un code promo personnalisé (max OROLADO_AFF_MAX_CODES). Retour: ['ok'=>bool,'code'=>..,'reason'=>..]. */
function orolado_aff_code_create(array $db, string $uid, string $raw): array {
  $u = $db['users'][$uid] ?? null;
  if (!is_array($u) || !orolado_aff_allowed($u + ['id' => $uid])) return ['ok' => false, 'reason' => 'not_allowed'];
  $code = orolado_aff_norm_code($raw);
  if ($code === '') return ['ok' => false, 'reason' => 'bad'];
  if ($code === orolado_aff_code($uid)) return ['ok' => false, 'reason' => 'default'];
  if (in_array($code, ['OROLADO', 'ADMIN', 'SUPPORT', 'ORO', 'TEST'], true)) return ['ok' => false, 'reason' => 'reserved'];
  $cur = orolado_aff_codes($uid);
  if (in_array($code, $cur['custom'], true)) return ['ok' => true, 'code' => $code]; // déjà à lui
  if (count($cur['custom']) >= OROLADO_AFF_MAX_CODES) return ['ok' => false, 'reason' => 'max'];
  $taken = false;
  orolado_aff_with('code_' . $code, static function (&$st) use ($uid, &$taken) {
    $owner = (string) ($st['uid'] ?? '');
    if ($owner === '') { $st = ['uid' => $uid, 'custom' => true, 'at' => date('c')]; }
    else if ($owner !== $uid) { $taken = true; }
  });
  if ($taken) return ['ok' => false, 'reason' => 'taken'];
  orolado_aff_with(orolado_aff_owner_name($uid), static function (&$st) use ($code) {
    if (!isset($st['codes']) || !is_array($st['codes'])) $st['codes'] = [];
    if (!in_array($code, $st['codes'], true)) $st['codes'][] = $code;
    $st['codes'] = array_slice($st['codes'], 0, OROLADO_AFF_MAX_CODES);
  });
  return ['ok' => true, 'code' => $code];
}

/** Supprime un code promo personnalisé (et le libère s'il appartient bien à cet affilié). */
function orolado_aff_code_delete(string $uid, string $raw): array {
  $code = orolado_aff_norm_code($raw);
  if ($code === '') return ['ok' => false, 'reason' => 'bad'];
  orolado_aff_with(orolado_aff_owner_name($uid), static function (&$st) use ($code) {
    if (isset($st['codes']) && is_array($st['codes'])) $st['codes'] = array_values(array_filter($st['codes'], static fn($c) => orolado_aff_norm_code((string) $c) !== $code));
  });
  orolado_aff_with('code_' . $code, static function (&$st) use ($uid) {
    if ((string) ($st['uid'] ?? '') === $uid) $st = ['uid' => '', 'removed' => true, 'at' => date('c')];
  });
  return ['ok' => true];
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
  $code = orolado_aff_norm_code($code); // accepte le code par défaut (8) ET les codes promo personnalisés
  if ($code === '' || $newUid === '') return false;
  $inviter = (string) (orolado_aff_read('code_' . $code)['uid'] ?? '');
  if ($inviter === '' || $inviter === $newUid) return false;
  $iu = $db['users'][$inviter] ?? null;
  if (!is_array($iu) || !orolado_aff_allowed($iu + ['id' => $inviter])) return false;
  if (function_exists('orolado_user_block_kind') && orolado_user_block_kind($db, $inviter) !== '') return false;
  $ip = orolado_aff_client_ip();
  orolado_aff_migrate($inviter);
  $name = (string) ($db['users'][$newUid]['displayName'] ?? '');
  // La fiche d'invitation de l'ami (verrouillée) décide : relié UNE seule fois, à vie. La ligne d'ami est ajoutée
  // pendant ce verrou (jamais deux lignes pour le même ami, même si 2 requêtes arrivent ensemble).
  $ok = orolado_aff_with(orolado_aff_inv_name($newUid), static function (&$st) use ($inviter, $code, $ip, $newUid, $name) {
    if (!empty($st['inviter'])) return false;
    $line = json_encode(['u' => $newUid, 'a' => date('c'), 'i' => $ip, 'c' => $code, 'nm' => $name], JSON_UNESCAPED_UNICODE) . "\n";
    if (@file_put_contents(orolado_aff_fr_file($inviter), $line, FILE_APPEND | LOCK_EX) === false) return false;
    $st = ['inviter' => $inviter, 'code' => $code, 'at' => date('c'), 'ip' => $ip, 'paid' => false];
    return true;
  });
  if (!$ok) return false;
  // Compteurs du parrain (petit fichier) + index des affiliés (ajout d'une ligne, une seule fois par affilié).
  orolado_aff_with(orolado_aff_owner_name($inviter), static function (&$own) use ($inviter) {
    $own['n'] = (int) ($own['n'] ?? 0) + 1;
    $own['lastAt'] = date('c');
    if (empty($own['listed'])) {
      $own['listed'] = 1;
      @file_put_contents(orolado_aff_dir() . DIRECTORY_SEPARATOR . 'index_aff.jsonl', json_encode($inviter) . "\n", FILE_APPEND | LOCK_EX);
    }
  });
  return true;
}

/** Ce joueur a-t-il invité au moins un ami ? (pour le petit badge 🤝 dans l'admin). */
function orolado_aff_is_affiliate(string $uid): bool {
  if ($uid === '') return false;
  return orolado_aff_counts($uid)['n'] > 0;
}

/** Liste des uid affiliés connus (index). Les anciens (avant l'index) sont ajoutés à la volée par l'admin. */
function orolado_aff_index_ids(): array {
  $st = orolado_aff_read('index_aff'); // ancien index (avant 2026-11-11)
  $ids = is_array($st['ids'] ?? null) ? array_map('strval', $st['ids']) : [];
  $f = orolado_aff_dir() . DIRECTORY_SEPARATOR . 'index_aff.jsonl';
  if (is_file($f)) foreach ((array) @file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) { $v = json_decode((string) $l, true); if (is_string($v) && $v !== '') $ids[] = $v; }
  return array_values(array_unique($ids));
}

/** Map uid filleul → uid parrain (joueurs venus par un lien/code d'affiliation). Pour les petits signes admin. */
function orolado_aff_referred_map(): array {
  // Ancien index global (plus écrit depuis 2026-11-11 : il grossissait à chaque inscription du site). Pour un joueur
  // précis, la vérité est sa fiche d'invitation : orolado_aff_read(orolado_aff_inv_name($uid))['inviter'].
  $st = orolado_aff_read('index_referred');
  $map = is_array($st['by'] ?? null) ? $st['by'] : [];
  foreach (orolado_aff_index_ids() as $aid) { orolado_aff_migrate($aid); foreach (orolado_aff_fr_lines($aid) as $l) $map[(string) $l['u']] = $aid; }
  return $map;
}

/**
 * v2492 — dépôts rangés par joueur. Utilisé SEULEMENT pendant le calcul de la page Invitation (affStatus) :
 * avant, toute la liste des dépôts du site était relue pour chaque ami (très lent avec des milliers d'amis).
 * Partout ailleurs (dépôt, webhook…), la liste fraîche est toujours relue.
 */
function orolado_aff_build_deposit_index(array $db): array {
  $idx = [];
  foreach ((array) ($db['deposits'] ?? []) as $d) {
    if (!is_array($d)) continue;
    $u = (string) ($d['userId'] ?? $d['user_id'] ?? '');
    if ($u !== '') $idx[$u][] = $d;
  }
  return $idx;
}

/** Vrais dépôts confirmés du joueur (pas les bonus admin / défi / cadeaux), du plus ancien au plus récent. */
function orolado_aff_real_deposits(array $db, string $uid): array {
  $ids = function_exists('orolado_linked_balance_ids') ? orolado_linked_balance_ids($db, $uid) : [$uid];
  if (!$ids) $ids = [$uid];
  $list = [];
  $seen = [];
  $mine = [];
  $idx = $GLOBALS['OROLADO_AFF_DEPIDX'] ?? null;
  if (is_array($idx)) { foreach ($ids as $oneId) foreach ($idx[(string) $oneId] ?? [] as $d) $mine[] = $d; }
  else $mine = (array) ($db['deposits'] ?? []);
  foreach ($mine as $d) {
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
function orolado_aff_pay_friend(array $db, string $uid, float $gift, string $ref, string $note = 'Cadeau invitation'): bool {
  $payId = orolado_aff_pay_uuid($db, $uid);
  if ($payId === '') return false;
  $got = orolado_trade_credit_once($payId, $ref, $gift);
  if ($got === null) return false;
  with_db_lock(static function ($box) use ($uid, $gift, $ref, $got, $note) {
    $locked =& $box->db;
    foreach (($locked['deposits'] ?? []) as $d) {
      if (is_array($d) && (string) ($d['id'] ?? '') === $ref) return ['ok' => true, 'skip_write' => true];
    }
    if (!isset($locked['deposits']) || !is_array($locked['deposits'])) $locked['deposits'] = [];
    $locked['deposits'][] = [
      'id' => $ref, 'ref' => $ref, 'userId' => $uid, 'amount' => $gift, 'status' => 'COMPLETED',
      'operator' => 'admin', 'createdAt' => date('c'), 'paidAt' => date('c'), 'note' => $note, 'motif' => $note,
    ];
    if (isset($locked['users'][$uid]) && is_array($locked['users'][$uid])) {
      $u =& $locked['users'][$uid];
      $u['realDepositTotal'] = orolado_money(($u['realDepositTotal'] ?? 0) + $gift);
      $u['requiredWagering'] = orolado_money($u['realDepositTotal'] * 2);
      $u['wagerLock'] = orolado_money(($u['wagerLock'] ?? 0) + $gift);
      $u['wagerNeed'] = orolado_money(($u['wagerNeed'] ?? 0) + $gift * 2);
      if (!isset($u['transactions']) || !is_array($u['transactions'])) $u['transactions'] = [];
      array_unshift($u['transactions'], ['id' => $ref, 'at' => date('c'), 'type' => 'deposit', 'amount' => $gift, 'note' => $note, 'mode' => 'real', 'status' => 'COMPLETED']);
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
 * Note les vrais dépôts de l'ami (pour les chiffres de l'affilié). Ne verse plus rien (ancien 5 % supprimé).
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
  // Plus de limite « 365 jours » (ancien système) : tous les dépôts de l'ami sont notés, à vie.
  $end = PHP_INT_MAX;
  $todo = false;
  if (empty($inv['friendPaid'])) $todo = true;
  foreach ($deps as $d) {
    if ($d['ts'] > 0 && $d['ts'] <= $end && empty($inv['deps'][$d['id']]['paid'])) $todo = true;
  }
  if (!$todo) return $inv;
  $inviter = (string) $inv['inviter'];
  // 2026-11-09 (propriétaire : « retirer les anciens systèmes, les 5 % ») — l'ancien système 5 % est SUPPRIMÉ.
  // Le seul gain de celui qui invite est la part de revenu (aff_rev_lib.php : 60 % de la marge réelle, à vie).
  // Ici on ne verse PLUS RIEN (ni 5 % à l'ami sur son 1er dépôt, ni 5 % par dépôt à celui qui invite) :
  // on note seulement les dépôts de l'ami (pour les chiffres affichés). Les anciens 5 % déjà versés restent au journal.
  $became = false; // 1er dépôt de cet ami → compteur « ont déposé » du parrain +1 (une seule fois)
  $res = orolado_aff_with(orolado_aff_inv_name($friendUid), static function (&$st) use ($deps, $end, &$became) {
    if (!isset($st['deps']) || !is_array($st['deps'])) $st['deps'] = [];
    if (empty($st['friendPaid'])) {
      $became = true;
      $st['friendPaid'] = true;
      $st['friendGift'] = (float) ($st['friendGift'] ?? 0);
      $st['friendDeposit'] = $deps[0]['amount'];
    }
    foreach ($deps as $d) {
      if ($d['ts'] <= 0 || $d['ts'] > $end) continue;
      if (!empty($st['deps'][$d['id']]['paid'])) continue;
      $st['deps'][$d['id']] = ['amount' => $d['amount'], 'gift' => 0.0, 'paid' => true, 'at' => date('c')];
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
  // 2026-11-11 : chez le parrain, seulement le compteur (les chiffres de l'ami restent dans SA fiche : plus de
  // réécriture du gros fichier du parrain à chaque dépôt d'ami).
  if ($became) {
    orolado_aff_migrate($inviter);
    orolado_aff_with(orolado_aff_owner_name($inviter), static function (&$own) { $own['nPaid'] = (int) ($own['nPaid'] ?? 0) + 1; });
  }
  return $res;
}

/** Ce que voit le joueur : son lien, ses amis, ses gains ; et s'il a été invité, son cadeau. */
function orolado_aff_status(array $db, array $user, array $opts = []): array {
  $uid = (string) ($user['id'] ?? '');
  // 2026-11-09 : le seul pourcentage affiché est celui de la part de revenu (60 %), plus l'ancien 5 %.
  $out = ['ok' => true, 'enabled' => false, 'pct' => (int) round((function_exists('orolado_aff_rev_pct') ? orolado_aff_rev_pct() : 0.6) * 100)];
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
  $friends = orolado_aff_friends($uid);
  $own = orolado_aff_read(orolado_aff_owner_name($uid));
  // Tous les amis (à vie, plus de limite d'un an) : on note leurs nouveaux dépôts au passage.
  orolado_aff_build_indexes($db);
  $changed = false;
  foreach ($friends as $f) {
    $t = (int) strtotime((string) ($f['at'] ?? ''));
    if (!empty($f['uid']) && $t > 0) {
      // v2492 : on ne rouvre le fichier de l'ami QUE s'il a un dépôt pas encore payé (avant : à chaque fois, lent).
      $fd = orolado_aff_real_deposits($db, (string) $f['uid']);
      if (!$fd) continue;
      $inWin = 0;
      foreach ($fd as $d1) if ($d1['ts'] > 0) $inWin++;
      if (!empty($f['paid']) && isset($f['n']) && (int) $f['n'] >= $inWin) continue;
      orolado_aff_settle($db, (string) $f['uid']);
      $changed = true;
    }
  }
  if ($changed) { $friends = orolado_aff_friends($uid); $own = orolado_aff_read(orolado_aff_owner_name($uid)); }
  $out['enabled'] = true;
  $out['code'] = $code;
  $out['codes'] = orolado_aff_codes($uid); // code par défaut + codes promo personnalisés (max 5)
  $out['now'] = time();
  $out['clicks'] = (int) ($own['clicks'] ?? 0);
  $out['friends'] = count($friends);
  $out['deposited'] = count(array_filter($friends, static fn($f) => !empty($f['paid'])));
  $played = 0;
  $total = 0.0;
  $list = [];
  $depCount = 0;
  // Part de revenu (NGR) : gain par ami = pct × ce qu'OROLADO a gardé sur lui. Calculé une fois ici.
  $revOn2 = function_exists('orolado_aff_rev_enabled') && orolado_aff_rev_enabled();
  $revPct2 = $revOn2 && function_exists('orolado_aff_rev_pct') ? orolado_aff_rev_pct() : 0.0;
  $ngrByUid = []; $extByUid = [];
  // 2026-11-11 (grande échelle) : très gros affilié → derniers chiffres calculés affichés TOUT DE SUITE ;
  // le recalcul complet (et le versement) se fait après la réponse, en arrière-plan (orolado_aff_bg_refresh).
  $bigCache = null;
  if ($revOn2 && count($friends) > OROLADO_AFF_BIG) {
    $bc = orolado_aff_read('agg_' . hash('sha256', 'aff-agg|' . $uid));
    // Servi tant qu'il a moins d'1 h (recalculé en arrière-plan dès qu'il a plus de 45 s) ; au-delà, recalcul immédiat.
    if (!empty($bc['at']) && time() - (int) $bc['at'] < 3600 && is_array($bc['agg'] ?? null) && is_array($bc['wallet'] ?? null)) {
      $bigCache = $bc;
      if (time() - (int) $bc['at'] > 45) register_shutdown_function(static function () use ($uid) { orolado_aff_bg_refresh($uid); });
    }
  }
  if ($revOn2 && function_exists('orolado_aff_rev_aggregate')) {
    foreach ((array) (($bigCache ? $bigCache['agg'] : orolado_aff_rev_aggregate($db, $uid))['friends'] ?? []) as $fr) {
      $kf = (string) ($fr['uid'] ?? '');
      $ngrByUid[$kf] = (float) ($fr['ngr'] ?? 0);
      $extByUid[$kf] = ['staked' => (float) ($fr['staked'] ?? 0), 'ngrAll' => (float) ($fr['ngrAll'] ?? ($fr['ngr'] ?? 0))]; // 2026-11-08 : misé, en attente
    }
  }
  $onlineN = 0; $act7N = 0;
  foreach ($friends as $f) {
    $fu = $db['users'][(string) ($f['uid'] ?? '')] ?? [];
    $realTrades = (int) ($fu['realTrades'] ?? 0);
    if ($realTrades > 0) $played++;
    // 2026-11-12 (propriétaire) : ami en ligne (vu il y a moins de 3 min) / actif sur 7 jours — affichage seulement
    $seenT = (int) strtotime((string) ($fu['lastSeen'] ?? '')); $onF = $seenT > 0 && time() - $seenT < 180;
    if ($onF) $onlineN++;
    if ($seenT > 0 && time() - $seenT < 7 * 86400) $act7N++;
    $total += (float) ($f['deposit'] ?? 0);
    $t = (int) strtotime((string) ($f['at'] ?? ''));
    // v2489 : nombre de dépôts de l'ami (affichage seulement, lu dans son fichier d'invitation).
    $nDep = (int) ($f['n'] ?? 0);
    $fuid = (string) ($f['uid'] ?? '');
    $ngrF = $revOn2 ? (float) ($ngrByUid[$fuid] ?? 0) : 0.0;
    $giftF = $revOn2 ? orolado_money(max(0.0, $revPct2 * $ngrF) + (float) ($f['gift'] ?? 0)) : orolado_money($f['gift'] ?? 0); // 2026-11-08 : + l'ancien 5 % déjà versé sur cet ami
    $list[] = [
      'id' => (string) ($fu['publicId'] ?? 'ORO-??????'), 'uid' => $fuid,
      'at' => $t,
      'deposit' => orolado_money($f['deposit'] ?? 0),
      'gift' => $giftF,
      'ngr' => orolado_money($ngrF),
      'n' => $nDep,
      'played' => $realTrades > 0 || (($extByUid[$fuid]['staked'] ?? 0) > 0),
      'on' => $onF ? 1 : 0,
      'seen' => $seenT > 0 ? $seenT : 0, // v3701 : dernière visite (filtres Actifs / Inactifs du portail) — affichage seulement
      'staked' => orolado_money($extByUid[$fuid]['staked'] ?? 0),
      'pend' => $revOn2 ? orolado_money(max(0.0, $revPct2 * (float) ($extByUid[$fuid]['ngrAll'] ?? 0) - max(0.0, $revPct2 * $ngrF))) : 0.0,
    ];
    $depCount += $nDep;
  }
  usort($list, static fn($x, $y) => $y['at'] <=> $x['at']);
  // v2777 (propriétaire) : AFFICHAGE seulement — l'ami se montre avec son identifiant unique R… (comme partout)
  $rid = [];
  if (is_file(__DIR__ . '/live_lib.php')) { require_once __DIR__ . '/live_lib.php'; try { $rid = live_rids_for(array_column($list, 'uid')); } catch (Throwable $e) { $rid = []; } }
  foreach ($list as &$row) { if (!empty($rid[$row['uid']])) $row['id'] = (string) $rid[$row['uid']]; unset($row['uid']); }
  unset($row);
  $out['played'] = $played;
  $out['online'] = $onlineN; $out['act7'] = $act7N;
  $out['total'] = orolado_money($total);
  $out['earned'] = orolado_money($own['earned'] ?? 0);
  // v2492 (audit, accord du propriétaire) : AUCUNE limite d'amis. Les totaux de chaque période (Aujourd'hui,
  // 7 jours, 30 jours, Tout) sont comptés ici sur TOUS les amis, à l'heure du téléphone ; la liste envoyée garde
  // les 2 000 plus récents (léger pour le téléphone) et la recherche (ORO-…) cherche parmi TOUS les amis.
  // Anciens amis (avant v2492) : leur nombre de dépôts est recopié une fois chez le parrain (affichage).
  $out['depCount'] = $depCount;
  $tz = max(-840, min(840, (int) ($opts['tz'] ?? 0)));
  $nowT = time();
  $mid = intdiv($nowT - $tz * 60, 86400) * 86400 + $tz * 60;
  $froms = ['day' => $mid, 'week' => $mid - 6 * 86400, 'month' => $mid - 29 * 86400, 'all' => 0];
  $per = [];
  foreach ($froms as $pk => $from) $per[$pk] = ['from' => $from, 'signed' => 0, 'paid' => 0, 'dep' => 0.0, 'n' => 0, 'big' => 0.0, 'gain' => 0.0];
  foreach ($list as $row) {
    foreach ($froms as $pk => $from) {
      if ($row['at'] < $from) continue;
      $per[$pk]['signed']++;
      if ($row['deposit'] > 0) {
        $per[$pk]['paid']++;
        $per[$pk]['dep'] += $row['deposit'];
        $per[$pk]['n'] += $row['n'];
        if ($row['deposit'] > $per[$pk]['big']) $per[$pk]['big'] = $row['deposit'];
      }
    }
  }
  foreach ((array) ($own['log'] ?? []) as $l) {
    $ts = (int) strtotime((string) ($l['at'] ?? ''));
    $amt = (float) ($l['amount'] ?? 0);
    if ($ts <= 0 || $amt <= 0) continue;
    foreach ($froms as $pk => $from) if ($pk !== 'all' && $ts >= $from) $per[$pk]['gain'] += $amt;
  }
  $per['all']['gain'] = (float) ($own['earned'] ?? 0);
  foreach ($per as $pk => $p) { $per[$pk]['dep'] = orolado_money($p['dep']); $per[$pk]['big'] = orolado_money($p['big']); $per[$pk]['gain'] = orolado_money($p['gain']); }
  $out['periods'] = $per;
  $out['more'] = count($list) > 2000;
  $q = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) ($opts['q'] ?? '')));
  if ($q !== '') {
    $found = [];
    foreach ($list as $row) {
      if (strpos(preg_replace('/[^A-Z0-9]/', '', strtoupper($row['id'])), $q) !== false) { $found[] = $row; if (count($found) >= 200) break; }
    }
    $out['found'] = $found;
  }
  $out['list'] = array_slice($list, 0, 2000);
  // v2491 : gains de celui qui invite, date par date (pour le petit graphique ; affichage seulement).
  $gains = [];
  foreach ((array) ($own['log'] ?? []) as $l) {
    $ts = (int) strtotime((string) ($l['at'] ?? ''));
    $amt = (float) ($l['amount'] ?? 0);
    if ($ts > 0 && $amt > 0) { $h = intdiv($ts, 3600) * 3600; $gains[$h] = ($gains[$h] ?? 0) + $amt; }
  }
  // v2492 : regroupés par heure (tous les gains depuis le début, sans limite de nombre).
  ksort($gains);
  $out['gains'] = [];
  foreach ($gains as $h => $sumH) $out['gains'][] = [$h, orolado_money($sumH)];
  // v2026-10-31 — PART DE REVENU (NGR) : si le drapeau est actif, le gain de l'affilié n'est plus
  // « 5 % des dépôts » mais « 60 % de ce qu'OROLADO garde ». On verse le dû (argent libre) et on
  // expose le portefeuille au portail. Le reste (lien, amis, clics) ne change pas.
  if (function_exists('orolado_aff_rev_enabled') && orolado_aff_rev_enabled()) {
    $rev = $bigCache ? $bigCache['wallet'] : orolado_aff_rev_run($db, $uid);
    if (!$bigCache && count($friends) > OROLADO_AFF_BIG) orolado_aff_agg_save($uid, orolado_aff_rev_aggregate($db, $uid), $rev);
    $out['rev'] = [
      'on' => true,
      'pct' => (int) ($rev['pct'] ?? 60),
      'holdH' => (int) ($rev['holdH'] ?? 24),
      'ngr' => orolado_money($rev['ngr'] ?? 0),
      'entitled' => orolado_money($rev['entitled'] ?? 0),
      'paid' => orolado_money($rev['withdrawn'] ?? 0),       // total déjà versé (argent libre)
      'balance' => orolado_money($rev['balance'] ?? 0),       // peut être négatif (report)
      'withdrawable' => orolado_money($rev['withdrawable'] ?? 0),
      'minWithdraw' => orolado_money($rev['minWithdraw'] ?? 1),
      // 2026-11-08 (propriétaire : « plusieurs cases importantes pour les affiliés ») :
      'pending' => orolado_money($rev['pending'] ?? 0),   // en attente : versé après le délai
      'staked' => orolado_money($rev['staked'] ?? 0),     // total misé en argent réel par les amis
      'active' => (int) ($rev['active'] ?? 0),            // amis qui ont joué en argent réel
      'log' => array_map(static fn($l) => ['a' => orolado_money($l['amount'] ?? 0), 't' => (int) strtotime((string) ($l['at'] ?? ''))], (array) ($rev['log'] ?? [])),
    ];
    if (!empty($rev['justPaid'])) $out['rev']['justPaid'] = orolado_money($rev['justPaid']);
    // 2026-11-08 (propriétaire : « même les anciens affiliés voient leurs résultats ») : ce qu'ils ont gagné avec l'ancien
    // système (5 % des dépôts, déjà versé) s'ajoute au total versé, aux périodes et aux derniers versements.
    $oldPaid = orolado_money($own['earned'] ?? 0);
    $oldLog = array_values(array_filter((array) ($own['log'] ?? []), static fn($l) => is_array($l) && (float) ($l['amount'] ?? 0) > 0));
    $out['rev']['oldPaid'] = $oldPaid;
    $out['rev']['paid60'] = $out['rev']['paid'];
    $out['rev']['paid'] = orolado_money($out['rev']['paid'] + $oldPaid);
    $mergedLog = array_merge($out['rev']['log'], array_map(static fn($l) => ['a' => orolado_money($l['amount'] ?? 0), 't' => (int) strtotime((string) ($l['at'] ?? ''))], $oldLog));
    usort($mergedLog, static fn($x, $y) => $y['t'] <=> $x['t']);
    $out['rev']['log'] = array_slice($mergedLog, 0, 10);
    $out['pct'] = $out['rev']['pct'];
    $out['earned'] = $out['rev']['paid'];
    // Détail : on remplace les gains de l'ancien modèle 5 % par le versé réel (part de revenu),
    // pour que « Tu as gagné » soit cohérent partout (plus de vieux chiffres 5 %).
    $out['gains'] = [];
    if (isset($out['periods']) && is_array($out['periods'])) {
      // 2026-11-08 : gains de chaque période = versements réels (60 %) de cette période (avant : 0 sauf « Tout »)
      $revLog = function_exists('orolado_aff_rev_name') ? (array) (orolado_aff_read(orolado_aff_rev_name($uid))['log'] ?? []) : [];
      foreach ($out['periods'] as $pk => $pv) {
        if ($pk === 'all') { $out['periods'][$pk]['gain'] = $out['rev']['paid']; continue; }
        $g = 0.0;
        foreach (array_merge($revLog, $oldLog) as $l) { $ts = (int) strtotime((string) ($l['at'] ?? '')); if ($ts >= (int) ($pv['from'] ?? 0)) $g += (float) ($l['amount'] ?? 0); }
        $out['periods'][$pk]['gain'] = orolado_money($g);
      }
    }
    // 2026-11-09 : petit graphique « Tes gains » de la page Voir plus = vrais versements (60 % + anciens gains déjà versés).
    $revLogAll = function_exists('orolado_aff_rev_name') ? (array) (orolado_aff_read(orolado_aff_rev_name($uid))['log'] ?? []) : [];
    $gains = [];
    foreach (array_merge($revLogAll, $oldLog) as $l) {
      $ts = (int) strtotime((string) ($l['at'] ?? ''));
      $amt = (float) ($l['amount'] ?? 0);
      if ($ts > 0 && $amt > 0) { $h = intdiv($ts, 3600) * 3600; $gains[$h] = ($gains[$h] ?? 0) + $amt; }
    }
    ksort($gains);
    foreach ($gains as $h => $sumH) $out['gains'][] = [$h, orolado_money($sumH)];
  }
  orolado_aff_clear_indexes();
  return $out;
}

/**
 * 2026-11-11 : index construits UNE fois par requête (dépôts, retraits, ordres par joueur). Avant, chaque ami relisait
 * TOUTE la liste du site (retraits, ordres) : 5 000 amis = des millions de lectures.
 */
const OROLADO_AFF_BIG = 1500; // au-delà : chiffres de la page servis depuis le dernier calcul (recalcul en arrière-plan, ~1 min de retard)

function orolado_aff_agg_save(string $uid, array $agg, array $wallet): void {
  unset($wallet['justPaid'], $wallet['friends']); // le détail par ami est déjà dans $agg
  orolado_aff_with('agg_' . hash('sha256', 'aff-agg|' . $uid), static function (&$st) use ($agg, $wallet) { $st = ['at' => time(), 'agg' => $agg, 'wallet' => $wallet]; });
}

/** Lecture seule (admin, pages) : portefeuille 60 % d'un affilié ; très gros affilié → dernier calcul (< 1 h). */
function orolado_aff_rev_wallet_view(array $db, string $uid): array {
  if (orolado_aff_counts($uid)['n'] > OROLADO_AFF_BIG) {
    $bc = orolado_aff_read('agg_' . hash('sha256', 'aff-agg|' . $uid));
    if (!empty($bc['at']) && time() - (int) $bc['at'] < 3600 && is_array($bc['wallet'] ?? null)) {
      if (time() - (int) $bc['at'] > 45) register_shutdown_function(static function () use ($uid) { orolado_aff_bg_refresh($uid); });
      return $bc['wallet'] + ['friends' => (array) ($bc['agg']['friends'] ?? []), 'friendsCount' => (int) ($bc['agg']['count'] ?? 0)];
    }
  }
  return orolado_aff_rev_wallet($db, $uid);
}

/** Recalcul complet d'un gros affilié APRÈS la réponse (le joueur n'attend pas). Un seul à la fois par affilié. */
function orolado_aff_bg_refresh(string $uid): void {
  $lk = @fopen(orolado_aff_dir() . DIRECTORY_SEPARATOR . 'agg_' . substr(hash('sha256', $uid), 0, 16) . '.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return; }
  try {
    if (function_exists('fastcgi_finish_request')) @fastcgi_finish_request();
    @set_time_limit(300);
    $db = load_db(orolado_data_file());
    orolado_aff_build_indexes($db);
    $w = orolado_aff_rev_run($db, $uid);
    orolado_aff_agg_save($uid, orolado_aff_rev_aggregate($db, $uid), $w);
  } catch (Throwable $e) {
    error_log('OROLADO aff bg ' . $e->getMessage());
  } finally {
    orolado_aff_clear_indexes();
    flock($lk, LOCK_UN); fclose($lk);
  }
}

function orolado_aff_build_indexes(array $db): void {
  orolado_aff_clear_indexes();
  $GLOBALS['OROLADO_AFF_DEPIDX'] = orolado_aff_build_deposit_index($db);
  $wd = [];
  foreach ((array) ($db['withdrawals'] ?? []) as $w) { if (!is_array($w)) continue; $u = (string) ($w['userId'] ?? $w['user_id'] ?? ''); if ($u !== '') $wd[$u][] = $w; }
  $GLOBALS['OROLADO_AFF_WDIDX'] = $wd;
  $od = [];
  foreach ((array) ($db['orders'] ?? []) as $o) { if (!is_array($o)) continue; $u = (string) ($o['userId'] ?? $o['user_id'] ?? ''); if ($u !== '') $od[$u][] = $o; }
  $GLOBALS['OROLADO_AFF_ORDIDX'] = $od;
}

function orolado_aff_clear_indexes(): void {
  unset($GLOBALS['OROLADO_AFF_DEPIDX'], $GLOBALS['OROLADO_AFF_WDIDX'], $GLOBALS['OROLADO_AFF_ORDIDX'], $GLOBALS['OROLADO_AFF_PARTNER'], $GLOBALS['OROLADO_AFF_AGG']);
}

/**
 * Clic sur un lien d'invitation (affichage seulement : « clics sur ton lien »).
 * Un même téléphone (ou une même connexion) n'est compté qu'UNE fois par jour et par lien.
 */
function orolado_aff_click(string $code, string $device): bool {
  $code = orolado_aff_norm_code($code);
  if ($code === '') return false;
  $inviter = (string) (orolado_aff_read('code_' . $code)['uid'] ?? '');
  if ($inviter === '') return false;
  $device = substr(preg_replace('/[^A-Za-z0-9]/', '', $device) ?? '', 0, 40);
  $day = date('Ymd');
  // 2026-11-11 : « déjà compté aujourd'hui ? » = un petit fichier-repère par téléphone / connexion (création atomique),
  // au lieu d'une liste dans le fichier de l'affilié réécrite à chaque clic (100 000 clics par jour tiennent).
  $dir = orolado_aff_dir() . DIRECTORY_SEPARATOR . 'clk' . DIRECTORY_SEPARATOR . $day;
  if (!is_dir($dir)) {
    @mkdir($dir, 0750, true);
    foreach (glob(orolado_aff_dir() . DIRECTORY_SEPARATOR . 'clk' . DIRECTORY_SEPARATOR . '*', GLOB_ONLYDIR) ?: [] as $old) {
      if (basename($old) < date('Ymd', time() - 2 * 86400)) { foreach (glob($old . '/*/*') ?: [] as $f) @unlink($f); foreach (glob($old . '/*') ?: [] as $d) @rmdir($d); @rmdir($old); }
    }
  }
  $keys = [hash('sha256', 'ip|' . orolado_aff_client_ip() . '|' . $inviter), $device !== '' ? hash('sha256', 'dev|' . $device . '|' . $inviter) : ''];
  foreach ($keys as $k) if ($k !== '' && is_file($dir . DIRECTORY_SEPARATOR . substr($k, 0, 2) . DIRECTORY_SEPARATOR . $k)) return false;
  $fresh = false;
  foreach ($keys as $k) {
    if ($k === '') continue;
    $sub = $dir . DIRECTORY_SEPARATOR . substr($k, 0, 2);
    if (!is_dir($sub)) @mkdir($sub, 0750, true);
    $fh = @fopen($sub . DIRECTORY_SEPARATOR . $k, 'x');
    if ($fh) { fclose($fh); $fresh = true; }
  }
  if (!$fresh) return false;
  orolado_aff_with(orolado_aff_owner_name($inviter), static function (&$own) {
    unset($own['clickSeen'], $own['clickDay']); // ancienne liste (avant 2026-11-11)
    $own['clicks'] = (int) ($own['clicks'] ?? 0) + 1;
  });
  return true;
}

/** Lignes d'historique des gains de celui qui invite (affichage : « Cadeau invitation »). */
function orolado_aff_history_rows(string $uid): array {
  $own = orolado_aff_read(orolado_aff_owner_name($uid));
  $rows = [];
  foreach ((array) ($own['log'] ?? []) as $l) {
    if (!is_array($l) || empty($l['ref'])) continue;
    $rows[] = ['at' => (string) ($l['at'] ?? ''), 'ref' => (string) $l['ref'], 'amount' => orolado_money($l['amount'] ?? 0), 'kind' => 'bonus', 'status' => 'COMPLETED', 'gateway' => 'OROLADO', 'note' => 'Invitation'];
  }
  // 2026-11-08 : versements de la part de revenu (60 %) aussi dans l'historique financier (avant : seulement l'ancien 5 %)
  if (function_exists('orolado_aff_rev_name')) {
    foreach ((array) (orolado_aff_read(orolado_aff_rev_name($uid))['log'] ?? []) as $l) {
      if (!is_array($l) || empty($l['ref'])) continue;
      $rows[] = ['at' => (string) ($l['at'] ?? ''), 'ref' => (string) $l['ref'], 'amount' => orolado_money($l['amount'] ?? 0), 'kind' => 'bonus', 'status' => 'COMPLETED', 'gateway' => 'OROLADO', 'note' => 'Invitation'];
    }
  }
  return $rows;
}
