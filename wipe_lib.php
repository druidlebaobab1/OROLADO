<?php
declare(strict_types=1);

/**
 * Bouton « Nettoyer » de l'admin (demandé et autorisé par le propriétaire le 2026-09-27).
 * VRAIE suppression, pas un masquage.
 *
 * Garde toujours le compte admin. Option « garder les comptes @gmail.com ».
 * Tout le reste est effacé : base Supabase (connexion, profils, soldes, dépôts, retraits,
 * trades, transactions), fichier du site, archives d'historique, codes en attente, journaux,
 * alertes et caches du tableau. Les comptes gardés conservent toutes leurs données.
 *
 * Deux étapes : orolado_wipe_plan() montre la liste (rien n'est touché), puis
 * orolado_wipe_run() efface, seulement si le mot de confirmation est tapé.
 */

require_once __DIR__ . '/orolado_lib.php';

const OROLADO_WIPE_CONFIRM = 'SUPPRIMER';

function orolado_wipe_is_admin(array $u, string $id): bool {
  if ($id === 'admin_master' || (string) ($u['id'] ?? '') === 'admin_master') return true;
  if (strtolower((string) ($u['role'] ?? '')) === 'admin') return true;
  $em = strtolower(trim((string) ($u['email'] ?? $u['originalEmail'] ?? '')));
  return $em !== '' && function_exists('orolado_is_reserved_admin_email') && orolado_is_reserved_admin_email($em);
}

function orolado_wipe_is_gmail(string $email): bool {
  return (bool) preg_match('/@gmail\.com$/', strtolower(trim($email)));
}

function orolado_wipe_uuid(string $id): bool {
  return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
}

/** Tous les comptes connus (fichier du site + base), regroupés par personne (e-mail). */
function orolado_wipe_accounts(): array {
  $acc = [];
  $add = static function (string $id, string $email, array $extra = []) use (&$acc): void {
    $email = strtolower(trim($email));
    $key = $email !== '' ? 'e:' . $email : 'i:' . $id;
    if (!isset($acc[$key])) $acc[$key] = ['email' => $email, 'ids' => [], 'admin' => false, 'name' => '', 'real' => 0.0, 'pid' => ''];
    if ($id !== '') $acc[$key]['ids'][$id] = true;
    if (!empty($extra['admin'])) $acc[$key]['admin'] = true;
    if (isset($extra['real'])) $acc[$key]['real'] = max($acc[$key]['real'], (float) $extra['real']);
    if (($extra['name'] ?? '') !== '' && $acc[$key]['name'] === '') $acc[$key]['name'] = (string) $extra['name'];
    if (($extra['pid'] ?? '') !== '' && $acc[$key]['pid'] === '') $acc[$key]['pid'] = (string) $extra['pid'];
  };
  $db = load_db(orolado_data_file());
  foreach (($db['users'] ?? []) as $id => $u) {
    if (!is_array($u)) continue;
    $id = (string) ($u['id'] ?? $id);
    $add($id, (string) ($u['email'] ?? ''), [
      'admin' => orolado_wipe_is_admin($u, $id),
      'name' => (string) ($u['displayName'] ?? ''),
      'real' => (float) ($db['vault'][$id]['real'] ?? 0),
      'pid' => (string) ($u['publicId'] ?? ''),
    ]);
    $sb = (string) ($u['sbId'] ?? '');
    if ($sb !== '') $add($sb, (string) ($u['email'] ?? ''));
  }
  if (supabase_admin_ready()) {
    $url = rtrim(supabase_project_url(), '/');
    $hdrs = supabase_admin_headers();
    for ($from = 0; $from < 100000; $from += 1000) {
      $rows = supabase_http($url . '/rest/v1/profiles?select=id,email,display_name,role&order=created_at.asc&offset=' . $from . '&limit=1000', $hdrs);
      if (!is_array($rows) || !$rows) break;
      foreach ($rows as $p) {
        if (!is_array($p)) continue;
        $pid = (string) ($p['id'] ?? '');
        $add($pid, (string) ($p['email'] ?? ''), ['admin' => orolado_wipe_is_admin($p, $pid), 'name' => (string) ($p['display_name'] ?? '')]);
      }
      if (count($rows) < 1000) break;
    }
    for ($page = 1; $page <= 200; $page++) {
      $res = supabase_http($url . '/auth/v1/admin/users?page=' . $page . '&per_page=200', $hdrs);
      $users = is_array($res['users'] ?? null) ? $res['users'] : ((is_array($res) && isset($res[0])) ? $res : []);
      if (!$users) break;
      foreach ($users as $a) {
        if (!is_array($a)) continue;
        $aid = (string) ($a['id'] ?? '');
        $add($aid, (string) ($a['email'] ?? ''), ['admin' => orolado_wipe_is_admin($a, $aid)]);
      }
      if (count($users) < 200) break;
    }
  }
  return array_values($acc);
}

/** Aperçu : qui est gardé, qui est supprimé. Rien n'est touché. */
function orolado_wipe_plan(bool $keepGmail): array {
  $keep = [];
  $del = [];
  foreach (orolado_wipe_accounts() as $a) {
    $row = [
      'email' => $a['email'] !== '' ? $a['email'] : '(sans e-mail)',
      'name' => $a['name'],
      'ids' => array_keys($a['ids']),
      'real' => round($a['real'], 2),
      'admin' => $a['admin'],
      'pid' => $a['pid'],
    ];
    if ($a['admin'] || ($keepGmail && orolado_wipe_is_gmail($a['email']))) $keep[] = $row;
    else $del[] = $row;
  }
  $hasAdmin = false;
  foreach ($keep as $k) if ($k['admin']) $hasAdmin = true;
  return ['ok' => true, 'keep' => $keep, 'delete' => $del, 'nKeep' => count($keep), 'nDelete' => count($del), 'hasAdmin' => $hasAdmin];
}

/**
 * Suppression définitive. Sur une grosse base, faite par lots (~15 s) : tant que
 * 'more' = true, le tableau rappelle automatiquement pour terminer.
 *
 * $only = null  : nettoyage complet (tout sauf l'admin, et les @gmail.com si la case est cochée).
 * $only = [...] : seulement les comptes COCHÉS (e-mails ou identifiants) ; le reste ne bouge pas.
 *                 L'admin n'est jamais supprimé, même coché.
 */
function orolado_wipe_run(bool $keepGmail, string $confirm, ?array $only = null): array {
  if ($confirm !== OROLADO_WIPE_CONFIRM) return ['ok' => false, 'reason' => 'Tapez ' . OROLADO_WIPE_CONFIRM . ' pour confirmer.'];
  @set_time_limit(40);
  if (function_exists('ignore_user_abort')) @ignore_user_abort(true);
  $t0 = microtime(true);
  $full = $only === null;
  $plan = orolado_wipe_plan($keepGmail);
  if (!$plan['hasAdmin']) return ['ok' => false, 'reason' => 'Compte admin introuvable : nettoyage annulé par sécurité.'];
  if (!$full) {
    $want = [];
    foreach ($only as $v) { $v = strtolower(trim((string) $v)); if ($v !== '') $want[$v] = true; }
    $all = array_merge($plan['keep'], $plan['delete']);
    $sel = [];
    $rest = [];
    foreach ($all as $a) {
      $hit = isset($want[strtolower($a['email'])]);
      foreach ($a['ids'] as $id) if (isset($want[strtolower((string) $id)])) $hit = true;
      if ($hit && !$a['admin']) $sel[] = $a; else $rest[] = $a;
    }
    if (!$sel) return ['ok' => false, 'reason' => 'Aucun compte coché.'];
    $plan['delete'] = $sel;
    $plan['keep'] = $rest;
    $plan['nDelete'] = count($sel);
    $plan['nKeep'] = count($rest);
  }
  $keepIds = ['admin_master' => true];
  $keepEmails = [];
  foreach ($plan['keep'] as $k) {
    foreach ($k['ids'] as $id) $keepIds[(string) $id] = true;
    if ($k['email'] !== '(sans e-mail)') $keepEmails[$k['email']] = true;
  }
  $delIds = [];
  $delEmails = [];
  foreach ($plan['delete'] as $d) {
    foreach ($d['ids'] as $id) if (!isset($keepIds[(string) $id])) $delIds[(string) $id] = true;
    if ($d['email'] !== '(sans e-mail)') $delEmails[$d['email']] = true;
  }
  $keepUuid = array_values(array_filter(array_keys($keepIds), static fn($id) => orolado_wipe_uuid((string) $id)));
  $delUuid = array_values(array_filter(array_keys($delIds), static fn($id) => orolado_wipe_uuid((string) $id)));
  // Complet : tout ce qui n'est pas gardé part. Ciblé : seulement les comptes cochés partent.
  $isKept = $full
    ? static fn(string $uid): bool => $uid !== '' && isset($keepIds[$uid])
    : static fn(string $uid): bool => $uid === '' || !isset($delIds[$uid]);
  $out = ['ok' => true, 'deletedAccounts' => $plan['nDelete'], 'kept' => $plan['nKeep'], 'site' => [], 'base' => [], 'files' => 0, 'more' => false, 'left' => 0];

  // 1. Fichier du site, sous verrou (écrit directement : rien ne peut revenir).
  $local = with_db_lock(static function ($box) use ($isKept, $keepEmails, $delEmails, $full): array {
    $db =& $box->db;
    $n = ['comptes' => 0];
    foreach (orolado_map_keys($db['users'] ?? []) as $id) {
      $u = $db['users'][$id];
      $uid = is_array($u) ? (string) ($u['id'] ?? $id) : (string) $id;
      if ($isKept($uid) || $isKept((string) $id)) continue;
      unset($db['users'][$id]);
      $n['comptes']++;
    }
    foreach (['vault', 'bans'] as $map) {
      foreach (orolado_map_keys($db[$map] ?? []) as $id) if (!$isKept((string) $id)) unset($db[$map][$id]);
    }
    foreach (($db['sessions'] ?? []) as $tok => $s) {
      if (!is_array($s) || !$isKept((string) ($s['userId'] ?? ''))) unset($db['sessions'][$tok]);
    }
    foreach (['deposits', 'withdrawals', 'orders', 'support_messages'] as $list) {
      if (!isset($db[$list]) || !is_array($db[$list])) continue;
      $before = count($db[$list]);
      $db[$list] = array_values(array_filter($db[$list], static fn($r) => is_array($r) && $isKept((string) ($r['userId'] ?? $r['user_id'] ?? ''))));
      $n[$list] = $before - count($db[$list]);
    }
    // Ordres réglés rangés hors du fichier (data/orders) : même tri, sous le même verrou.
    if (function_exists('orolado_orders_store_filter')) $n['orders'] = ($n['orders'] ?? 0) + orolado_orders_store_filter(static fn(string $uid): bool => $isKept($uid));
    foreach (['pendingRegistrations', 'pendingPasswordOtps', 'withdrawOtps'] as $map) {
      foreach (orolado_map_keys($db[$map] ?? []) as $k) {
        $em = strtolower((string) $k);
        if ($full ? !isset($keepEmails[$em]) : isset($delEmails[$em])) unset($db[$map][$k]);
      }
    }
    foreach (orolado_map_keys($db['pendingEmailChanges'] ?? []) as $k) if (!$isKept((string) $k)) unset($db['pendingEmailChanges'][$k]);
    // Nettoyage complet seulement : liste noire et journal admin remis à zéro. En ciblé, un
    // compte banni puis supprimé reste bloqué (il ne peut pas se réinscrire avec le même e-mail).
    if ($full) {
      $db['blocked_identities'] = [];
      $db['retired_emails'] = [];
      $db['admin_logs'] = [];
    } else {
      // Compte supprimé un par un (bouton « Supprimer ce compte » ou comptes cochés) : son e-mail
      // va sur la liste noire. Il ne peut plus se réinscrire ni se connecter avec (« compte supprimé »).
      if (!isset($db['blocked_identities']) || !is_array($db['blocked_identities'])) $db['blocked_identities'] = [];
      foreach (array_keys($delEmails) as $em) {
        $em = strtolower(trim((string) $em));
        if ($em === '' || !filter_var($em, FILTER_VALIDATE_EMAIL)) continue;
        $db['blocked_identities']['email:' . $em] = ['uid' => '', 'kind' => 'deleted', 'email' => $em, 'phone' => '', 'at' => date('c')];
      }
    }
    return ['ok' => true, 'n' => $n];
  });
  $out['site'] = $local['n'] ?? [];

  // 2. Fichiers annexes : archives d'historique, journaux, alertes, caches du tableau.
  $dir = rtrim(orolado_data_dir(), '/\\');
  foreach (glob($dir . '/archive/*.jsonl') ?: [] as $f) {
    $keepLines = [];
    foreach (@file($f, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
      $j = json_decode((string) $line, true);
      if (is_array($j) && $isKept((string) ($j['userId'] ?? $j['user_id'] ?? ''))) $keepLines[] = $line;
    }
    @file_put_contents($f, $keepLines ? implode("\n", $keepLines) . "\n" : '', LOCK_EX);
    $out['files']++;
  }
  $patterns = $full
    ? ['admin_cache_*.json', 'admin_alerts.json', 'admin_health_ack.json', 'admin_board_ack.json', 'otp_mail.log',
      'oxapay_webhook.log', 'debug_maketou.log', 'rate_*.json', 'keep_purge_v1.done', 'settle_*.ok', 'login_throttle.json']
    : ['admin_cache_*.json'];
  foreach ($patterns as $pat) {
    foreach (glob($dir . '/' . $pat) ?: [] as $f) {
      if (is_file($f) && @unlink($f)) $out['files']++;
    }
  }
  foreach ($full ? ['kicks', 'cash_ops'] : [] as $sub) {
    foreach (glob($dir . '/' . $sub . '/*') ?: [] as $f) {
      if ($sub === 'kicks' && $isKept(pathinfo((string) $f, PATHINFO_FILENAME))) continue;
      if (is_file($f) && @unlink($f)) $out['files']++;
    }
  }

  // 3. Base Supabase : données de jeu et d'argent des comptes supprimés, puis soldes et profils.
  if (supabase_admin_ready()) {
    $url = rtrim(supabase_project_url(), '/');
    $hdrs = array_merge(supabase_admin_headers(), ['Prefer: return=minimal']);
    $tables = ['orders' => 'user_id', 'deposits' => 'user_id', 'withdrawals' => 'user_id', 'transactions' => 'user_id', 'vaults' => 'user_id', 'profiles' => 'id'];
    if ($full) {
      $notKept = $keepUuid ? 'not.in.(' . implode(',', $keepUuid) . ')' : 'not.is.null';
      foreach ($tables as $table => $col) {
        $r = supabase_http($url . '/rest/v1/' . $table . '?' . $col . '=' . $notKept, $hdrs, null, 'DELETE');
        $out['base'][$table] = $r !== null ? 'effacé' : 'à revérifier';
        // Lignes sans propriétaire (anciens essais) : effacées aussi.
        if ($col === 'user_id') supabase_http($url . '/rest/v1/' . $table . '?user_id=is.null', $hdrs, null, 'DELETE');
      }
    } else {
      // Ciblé : seulement les identifiants des comptes cochés (par paquets de 100).
      foreach ($tables as $table => $col) {
        $okT = true;
        foreach (array_chunk($delUuid, 100) as $chunk) {
          $r = supabase_http($url . '/rest/v1/' . $table . '?' . $col . '=in.(' . implode(',', $chunk) . ')', $hdrs, null, 'DELETE');
          if ($r === null) $okT = false;
        }
        $out['base'][$table] = $delUuid ? ($okT ? 'effacé' : 'à revérifier') : 'rien';
      }
    }
    // 4. Comptes de connexion, un par un, par lots pour rester sous le délai du serveur.
    $done = 0;
    $left = 0;
    foreach ($plan['delete'] as $d) {
      foreach ($d['ids'] as $id) {
        $id = (string) $id;
        if (!orolado_wipe_uuid($id) || isset($keepIds[$id])) continue;
        if ((microtime(true) - $t0) > 15) { $left++; continue; }
        supabase_http($url . '/auth/v1/admin/users/' . rawurlencode($id), supabase_admin_headers(), null, 'DELETE');
        $done++;
      }
    }
    $out['base']['connexions'] = $done;
    $out['more'] = $left > 0;
    $out['left'] = $left;
  }
  return $out;
}
