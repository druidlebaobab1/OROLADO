<?php
declare(strict_types=1);

require_once __DIR__ . '/orolado_lib.php';
require_once __DIR__ . '/admin_lib.php';
require_once __DIR__ . '/trade_lib.php';
require_once __DIR__ . '/wipe_lib.php';
require_once __DIR__ . '/admin_gift_lib.php';
require_once __DIR__ . '/push_lib.php';
orolado_load_env();
date_default_timezone_set('Africa/Abidjan');

if (session_status() !== PHP_SESSION_ACTIVE) {
  session_name('oro_admin');
  session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
    'cookie_secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
  ]);
}

function admin_json(array $payload, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function admin_me(): ?array {
  $uid = (string) ($_SESSION['admin_uid'] ?? '');
  if ($uid === '') return null;
  $db = admin_local_db();
  $u = $db['users'][$uid] ?? null;
  if (!is_array($u) || !orolado_is_admin_user($u)) return null;
  return $u;
}

function admin_require(): array {
  $me = admin_me();
  if (!$me) admin_json(['ok' => false, 'reason' => 'Session expirée'], 401);
  return $me;
}

// v2676 — photos des conversations « Live » : visibles seulement par l'admin connecté.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && isset($_GET['live_img'])) {
  require_once __DIR__ . '/live_lib.php';
  $f = admin_me() ? live_img_path((string) $_GET['live_img'], 'img') : '';
  if ($f === '') { http_response_code(404); exit; }
  header('Content-Type: ' . (str_ends_with($f, '.png') ? 'image/png' : (str_ends_with($f, '.webp') ? 'image/webp' : 'image/jpeg')));
  header('Cache-Control: private, max-age=86400');
  header('X-Content-Type-Options: nosniff');
  readfile($f);
  exit;
}

function admin_login_check(string $email, string $password): ?array {
  $email = strtolower(trim($email));
  if (!orolado_is_reserved_admin_email($email)) return null;
  $db = admin_local_db();
  $st = admin_json_state();
  if (empty($st['exists']) || !empty($st['readable'])) {
    orolado_bootstrap_admin($db, orolado_data_file());
  }
  $user = null;
  foreach (orolado_users_by_email($db, $email) as $u) {
    if (strtolower((string) ($u['email'] ?? '')) === $email && orolado_is_admin_user($u)) {
      $user = $u;
      break;
    }
  }
  if (!$user) return null;
  $hash = (string) ($user['passwordHash'] ?? '');
  $ok = $hash !== '' && orolado_verify_password($password, $hash);
  if (!$ok) {
    foreach (orolado_admin_plain_passwords() as $plain) {
      if (hash_equals($plain, $password)) { $ok = true; break; }
    }
  }
  return $ok ? $user : null;
}

// v2606 — L'admin reste connecté jusqu'à « Déconnexion » (avant : la session PHP s'effaçait à la
// fermeture du navigateur ou après ~24 min sans clic → mot de passe redemandé à chaque retour).
// Une connexion longue est rangée dans les connexions du site + un cookie illisible par la page.
// Elle tombe aussi si le mot de passe admin change (empreinte « pw »).
const ADMIN_KEEP_COOKIE = 'oro_admin_keep';

function admin_keep_pwtag(): string {
  return hash('sha256', 'orolado-admin-keep|' . orolado_master_admin_password());
}

function admin_keep_cookie(string $tok, int $expires): void {
  setcookie(ADMIN_KEEP_COOKIE, $tok, [
    'expires' => $expires,
    'path' => '/',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
}

function admin_keep_issue(string $uid): void {
  if ($uid === '') return;
  $tok = 'adm' . bin2hex(random_bytes(32));
  $pw = admin_keep_pwtag();
  with_db_lock(static function ($box) use ($tok, $uid, $pw): array {
    $db =& $box->db;
    $db['sessions'][$tok] = orolado_new_session($uid) + ['adminKeep' => 1, 'pw' => $pw];
    return ['ok' => true];
  });
  admin_keep_cookie($tok, time() + orolado_session_ttl());
}

function admin_keep_drop(): void {
  $tok = trim((string) ($_COOKIE[ADMIN_KEEP_COOKIE] ?? ''));
  if ($tok !== '') {
    with_db_lock(static function ($box) use ($tok): array {
      $db =& $box->db;
      if (isset($db['sessions'][$tok])) unset($db['sessions'][$tok]);
      return ['ok' => true];
    });
  }
  admin_keep_cookie('', time() - 3600);
}

/** Page rechargée sans session PHP : on reprend la connexion longue (ou celle du jeu, si admin). */
function admin_keep_restore(): void {
  if (admin_me()) return;
  $db = admin_local_db();
  $keep = trim((string) ($_COOKIE[ADMIN_KEEP_COOKIE] ?? ''));
  if ($keep !== '') {
    $sess = $db['sessions'][$keep] ?? null;
    $u = null;
    if (is_array($sess) && !empty($sess['adminKeep']) && hash_equals(admin_keep_pwtag(), (string) ($sess['pw'] ?? ''))) {
      $u = orolado_session_user($db, $keep);
    }
    if (is_array($u) && orolado_is_admin_user($u)) {
      session_regenerate_id(true);
      $_SESSION['admin_uid'] = (string) ($u['id'] ?? '');
      $_SESSION['admin_email'] = (string) ($u['email'] ?? '');
      return;
    }
    admin_keep_cookie('', time() - 3600);
  }
  $tok = trim((string) ($_COOKIE['oro_token'] ?? ''));
  if ($tok !== '' && isset($db['sessions'][$tok])) {
    $uTok = orolado_session_user($db, $tok);
    if (is_array($uTok) && orolado_is_admin_user($uTok)) {
      session_regenerate_id(true);
      $_SESSION['admin_uid'] = (string) ($uTok['id'] ?? '');
      $_SESSION['admin_email'] = (string) ($uTok['email'] ?? '');
    }
  }
}

function admin_apply_filters(array $rows, array $req, string $dateField = 'createdAt'): array {
  $q = strtolower(trim((string) ($req['q'] ?? '')));
  $preset = (string) ($req['preset'] ?? 'all');
  $from = (string) ($req['dateFrom'] ?? '');
  $to = (string) ($req['dateTo'] ?? '');
  $cal = (string) ($req['cal'] ?? '');
  if ($preset === 'date' && $cal !== '') {
    $from = $cal;
    $to = $cal;
    [$a, $b] = admin_day_bounds('date', $from, $to);
  } else {
    [$a, $b] = admin_day_bounds($preset, $from, $to);
  }
  $out = [];
  foreach ($rows as $row) {
    if (!is_array($row)) continue;
    if ($q !== '' && !admin_match_q($row, $q)) continue;
    $iso = (string) ($row[$dateField] ?? $row['created_at'] ?? $row['at'] ?? '');
    if (!admin_in_range($iso !== '' ? $iso : null, $a, $b)) continue;
    $out[] = $row;
  }
  return $out;
}

/** v2641 — date d'inscription lisible, à l'heure du tableau (avant : texte brut, fuseaux mélangés). */
function admin_when_cell(string $iso): string {
  $ts = $iso !== '' ? strtotime($iso) : false;
  if (!$ts) return '—';
  try { return (new DateTimeImmutable('@' . $ts))->setTimezone(admin_tz())->format('d/m/Y H:i'); } catch (Throwable $e) { return date('d/m/Y H:i', $ts); }
}

function admin_page(array $rows, array $req): array {
  $page = max(1, (int) ($req['page'] ?? 1));
  $per = 80;
  $total = count($rows);
  $slice = array_slice($rows, ($page - 1) * $per, $per);
  return [$slice, $total, $page, (int) ceil($total / $per)];
}

function admin_user_lookup(string $id, array $pmap): array {
  if ($id !== '' && isset($pmap[$id])) return $pmap[$id];
  foreach ($pmap as $p) {
    if ($id !== '' && (string) ($p['publicId'] ?? '') === $id) return $p;
    if ($id !== '' && (string) ($p['id'] ?? '') === $id) return $p;
  }
  return ['id' => $id, 'publicId' => $id, 'email' => '', 'name' => '', 'phone' => ''];
}

function admin_is_uuid(string $id): bool {
  $id = strtolower(trim($id));
  return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $id);
}

/** UUID Supabase du joueur (fiche, e-mail, publicId) — hors OxaPay. */
function admin_resolve_player_uuid(string $uid, array $found = []): string {
  if (admin_is_uuid($uid)) return $uid;
  $cand = (string) ($found['id'] ?? '');
  if (admin_is_uuid($cand)) return $cand;
  $email = strtolower(trim((string) ($found['email'] ?? '')));
  $publicId = strtoupper(trim((string) ($found['publicId'] ?? '')));
  if ($publicId === '' && preg_match('/^ORO-/i', $uid)) $publicId = strtoupper(trim($uid));
  $hdrs = function_exists('supabase_admin_headers') ? supabase_admin_headers() : [];
  $url = function_exists('supabase_project_url') ? rtrim(supabase_project_url(), '/') : '';
  if ($hdrs && $url !== '' && $email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $rows = supabase_http($url . '/rest/v1/profiles?email=eq.' . rawurlencode($email) . '&select=id', $hdrs);
    if (is_array($rows) && isset($rows[0]['id']) && admin_is_uuid((string) $rows[0]['id'])) {
      return (string) $rows[0]['id'];
    }
  }
  if ($hdrs && $url !== '' && $uid !== '') {
    $rows = supabase_http($url . '/rest/v1/profiles?public_id=eq.' . rawurlencode($uid) . '&select=id', $hdrs);
    if (is_array($rows) && isset($rows[0]['id']) && admin_is_uuid((string) $rows[0]['id'])) {
      return (string) $rows[0]['id'];
    }
  }
  // Miroir JSON local : e-mail / publicId → id UUID
  if (function_exists('admin_local_db')) {
    $local = admin_local_db();
    foreach (($local['users'] ?? []) as $oid => $ou) {
      if (!is_array($ou)) continue;
      $oid = (string) ($ou['id'] ?? $oid);
      $oem = strtolower(trim((string) ($ou['email'] ?? '')));
      $opid = strtoupper(trim((string) ($ou['publicId'] ?? '')));
      $match = ($email !== '' && $oem === $email)
        || ($publicId !== '' && $opid === $publicId)
        || (strcasecmp($oid, $uid) === 0);
      if ($match && admin_is_uuid($oid)) return $oid;
    }
    // Joueur connu en local mais sans coffre Supabase (inscription miroir ratée) :
    // on crée son coffre maintenant, au lieu de répondre « joueur introuvable ».
    if (function_exists('orolado_ensure_balance_uuid')) {
      foreach (($local['users'] ?? []) as $oid => $ou) {
        if (!is_array($ou)) continue;
        $oid = (string) ($ou['id'] ?? $oid);
        $oem = strtolower(trim((string) ($ou['email'] ?? '')));
        $opid = strtoupper(trim((string) ($ou['publicId'] ?? '')));
        if (($email !== '' && $oem === $email) || ($publicId !== '' && $opid === $publicId) || strcasecmp($oid, $uid) === 0) {
          $made = orolado_ensure_balance_uuid($oid);
          if (admin_is_uuid($made)) return $made;
          break;
        }
      }
    }
  }
  return $uid;
}

/** Crée le coffre Supabase s’il manque, sans écraser un solde réel existant. */
function admin_ensure_sb_vault(string $uid, float $minReal = 0.0): ?array {
  if (!admin_is_uuid($uid) || !function_exists('supabase_admin_vault')) return null;
  $v = supabase_admin_vault($uid);
  if ($v) return $v;
  $hdrs = function_exists('supabase_admin_headers') ? supabase_admin_headers() : [];
  $url = function_exists('supabase_project_url') ? rtrim(supabase_project_url(), '/') : '';
  if (!$hdrs || $url === '') return null;
  $startReal = max(0.0, orolado_money($minReal));
  supabase_http($url . '/rest/v1/vaults', $hdrs, json_encode([
    'user_id' => $uid,
    'real' => $startReal,
    'demo' => 1000000,
    'updated_at' => date('c'),
  ], JSON_UNESCAPED_UNICODE), 'POST');
  return supabase_admin_vault($uid);
}

function admin_is_admin_account(string $uid, array $found = []): bool {
  if ($uid === 'admin_master') return true;
  if (isset($_SESSION['admin_uid']) && $uid === $_SESSION['admin_uid']) return true;
  $em = strtolower(trim((string) ($found['email'] ?? '')));
  if ($em === 'admin@orolado.com' || $em === 'admin@6diablo.com') return true;
  return function_exists('orolado_admin_emails') && $em !== '' && in_array($em, orolado_admin_emails(), true);
}

function admin_credit_target_ids(string $uid, array $found = []): array {
  $ids = [];
  $uuid = admin_resolve_player_uuid($uid, $found);
  if (admin_is_uuid($uuid)) $ids[] = $uuid;
  if (admin_is_admin_account($uid, $found) || admin_is_admin_account($uuid, $found)) {
    $ids[] = 'admin_master';
  }
  if (!$ids && $uid !== '') $ids[] = $uid;
  return array_values(array_unique(array_filter($ids)));
}

/** Journal JSON : le solde réel écrit est la valeur absolue déjà enregistrée en base. */
function admin_persist_json_real(string $uid, float $real, ?array $tx = null, ?array $dep = null): void {
  if ($uid === '' || !function_exists('with_db_lock')) return;
  $real = orolado_money($real);
  with_db_lock(static function ($box) use ($uid, $real, $tx, $dep) {
    if (!isset($box->db['vault']) || !orolado_is_map($box->db['vault'])) $box->db['vault'] = [];
    $targets = [$uid];
    $email = '';
    if (isset($box->db['users'][$uid]) && is_array($box->db['users'][$uid])) {
      $email = strtolower(trim((string) ($box->db['users'][$uid]['email'] ?? '')));
    }
    if ($email !== '') {
      foreach (orolado_users_by_email($box->db, $email) as $oid => $ou) {
        if (strtolower(trim((string) ($ou['email'] ?? ''))) === $email) $targets[] = (string) $oid;
      }
    }
    $targets = array_values(array_unique(array_filter($targets)));
    foreach ($targets as $tid) {
      if (!isset($box->db['vault'][$tid]) || !is_array($box->db['vault'][$tid])) {
        $box->db['vault'][$tid] = ['demo' => 1000000, 'real' => 0];
      }
      $box->db['vault'][$tid]['real'] = $real;
    }
    if ($dep) {
      if (!isset($box->db['deposits']) || !is_array($box->db['deposits'])) $box->db['deposits'] = [];
      $box->db['deposits'][] = $dep;
    }
    if (isset($box->db['users'][$uid]) && is_array($box->db['users'][$uid])) {
      if ($dep) {
        $add = orolado_money($dep['amount'] ?? 0);
        $tot = orolado_money(($box->db['users'][$uid]['realDepositTotal'] ?? 0) + $add);
        $box->db['users'][$uid]['realDepositTotal'] = $tot;
        $box->db['users'][$uid]['requiredWagering'] = orolado_money($tot * 2);
        $box->db['users'][$uid]['lastDepositAmount'] = $add;
        $box->db['users'][$uid]['wagerLock'] = orolado_money(($box->db['users'][$uid]['wagerLock'] ?? 0) + $add);
        $box->db['users'][$uid]['wagerNeed'] = orolado_money(($box->db['users'][$uid]['wagerNeed'] ?? 0) + ($add * 2));
      }
      if ($tx) {
        if (!isset($box->db['users'][$uid]['transactions']) || !is_array($box->db['users'][$uid]['transactions'])) {
          $box->db['users'][$uid]['transactions'] = [];
        }
        array_unshift($box->db['users'][$uid]['transactions'], $tx);
        if (count($box->db['users'][$uid]['transactions']) > 80) {
          $box->db['users'][$uid]['transactions'] = array_slice($box->db['users'][$uid]['transactions'], 0, 80);
        }
      }
    }
    return ['ok' => true];
  });
}

function admin_persist_admin_log(string $adminEmail, string $targetPid, string $type, $amount, string $motif): void {
  if (!function_exists('with_db_lock') || !function_exists('admin_log')) return;
  with_db_lock(static function ($box) use ($adminEmail, $targetPid, $type, $amount, $motif) {
    admin_log($box->db, $adminEmail, $targetPid, $type, $amount, $motif);
    return ['ok' => true];
  });
}

function admin_badges(): array {
  $cached = admin_cache_get('badges_epoch3', 12);
  if (is_array($cached) && isset($cached['inscrits'])) return $cached;
  $people = admin_profiles();
  $wds = admin_withdrawals();
  $deps = admin_deposits();
  [$t0, $t1] = admin_day_bounds('today');
  [$y0, $y1] = admin_day_bounds('yesterday');
  $signupToday = 0;
  $signupYest = 0;
  $noDep = 0;
  $inactive = 0;
  $cut7 = time() - 7 * 86400;
  foreach ($people as $p) {
    if (admin_in_range($p['createdAt'] ?? null, $t0, $t1)) $signupToday++;
    if (admin_in_range($p['createdAt'] ?? null, $y0, $y1)) $signupYest++;
    $paid = (float) ($p['depositTotal'] ?? 0);
    if ($paid <= 0) $noDep++;
    if ($paid > 0) {
      $ls = strtotime((string) ($p['lastSeen'] ?? '')) ?: 0;
      if ($ls < $cut7) $inactive++;
    }
  }
  $wdOpen = 0;
  $wdOpenSum = 0.0;
  $wdToday = 0;
  $wdRej = 0;
  $wdVisible = 0;
  $closedN = 0;
  foreach ($people as $p) {
    $role = strtolower((string) ($p['role'] ?? ''));
    if (in_array($role, ['suspended', 'banned', 'deleted'], true)) $closedN++;
  }
  foreach ($wds as $w) {
    if (!admin_wd_is_silenced($w)) $wdVisible++;
    if (admin_wd_is_open($w)) {
      $wdOpen++;
      $wdOpenSum += (float) $w['amount'];
    }
    if (admin_wd_is_paid($w) && admin_in_range(admin_wd_paid_at($w) ?: null, $t0, $t1)) $wdToday++;
    if (admin_wd_is_rejected($w)) $wdRej++;
  }
  $depToday = 0;
  $depPend = 0;
  $depFail = 0;
  $depPaidN = 0;
  foreach ($deps as $d) {
    if (admin_dep_is_paid($d)) {
      $depPaidN++;
      if (admin_in_range($d['createdAt'] ?? null, $t0, $t1)) $depToday++;
    }
    if (admin_dep_is_pending($d)) {
      $age = strtotime((string) ($d['createdAt'] ?? '')) ?: 0;
      if ($age === 0 || $age >= time() - 7 * 86400) $depPend++;
    }
    if (admin_dep_is_failed($d)) $depFail++;
  }
  $otp = 0;
  foreach (admin_otp_rows() as $r) {
    if (admin_in_range($r['at'] ?? null, $t0, $t1)) $otp++;
  }
  $healthErr = 0;
  $ackedHealth = function_exists('admin_health_ack_map') ? admin_health_ack_map() : [];
  foreach (admin_health_rows() as $h) {
    if (($h['level'] ?? '') !== 'error') continue;
    $fp = function_exists('admin_health_fp') ? admin_health_fp($h) : '';
    if ($fp !== '' && isset($ackedHealth[$fp])) continue;
    $healthErr++;
  }
  $online = admin_online_count();
  $nInscrits = admin_inscrits_count();
  $openByUser = [];
  foreach ($wds as $w) {
    if (!admin_wd_is_open($w)) continue;
    $uid = (string) ($w['userId'] ?? '');
    if ($uid !== '') $openByUser[$uid][] = $w;
  }
  // Même calcul que la liste « Suspect » (avant : compteur et liste ne comptaient pas pareil).
  $wdSuspect = count(admin_suspects());
  $payers = 0;
  foreach ($people as $p) {
    if ((float) ($p['depositTotal'] ?? 0) > 0) $payers++;
  }
  // Trades réels du jour (compteurs Jeux / Top gagnants / Positions ouvertes).
  $tradesToday = 0;
  $winnersToday = [];
  $liveNow = 0;
  foreach (admin_orders() as $o) {
    if (admin_order_is_live_real($o)) $liveNow++;
    if (!admin_in_range((string) ($o['created_at'] ?? ''), $t0, $t1)) continue;
    $tradesToday++;
    $ou = (string) ($o['user_id'] ?? '');
    if ($ou !== '') $winnersToday[$ou] = ($winnersToday[$ou] ?? 0.0) + (float) ($o['net'] ?? 0);
  }
  $nWinners = count(array_filter($winnersToday, static fn($v) => $v > 0.009));
  $bonusN = 0;
  $depositors = [];
  $channels = [];
  foreach ($deps as $d) {
    if (admin_dep_bonus_paid($d)) $bonusN++;
    if (admin_dep_is_paid($d)) {
      $depositors[(string) ($d['userId'] ?? '')] = true;
      $channels[admin_dep_channel_row($d)] = true;
    }
  }
  $healthWarn = 0;
  foreach (admin_health_rows() as $h) {
    if (($h['level'] ?? '') !== 'warn') continue;
    $fp = function_exists('admin_health_fp') ? admin_health_fp($h) : '';
    if ($fp !== '' && isset($ackedHealth[$fp])) continue;
    $healthWarn++;
  }
  [$w0, $w1] = admin_day_bounds('range', admin_now()->modify('-6 days')->format('Y-m-d'), admin_now()->format('Y-m-d'));
  $profitToday = admin_profit_between($deps, $wds, $t0, $t1);
  $profit7 = admin_profit_between($deps, $wds, $w0, $w1);
  $profitAll = admin_profit_between($deps, $wds, '', '');
  // Barres B / C : mêmes règles que le bénéfice (dépôts payés ; retraits validés, hors masqués).
  $sumDepAll = 0.0;
  foreach ($deps as $d) { if (admin_dep_is_paid($d)) $sumDepAll += (float) ($d['amount'] ?? 0); }
  $sumWdPaid = 0.0;
  foreach ($wds as $w) { if (admin_wd_is_paid($w) && !admin_wd_is_silenced($w)) $sumWdPaid += (float) ($w['amount'] ?? 0); }
  $unreadMsg = 0;
  foreach ((admin_local_db()['support_messages'] ?? []) as $m) {
    if (!is_array($m)) continue;
    $st = strtolower((string) ($m['status'] ?? 'ouvert'));
    if ($st === 'ouvert' || $st === 'unread') $unreadMsg++;
  }
  $out = [
    'signup_today' => $signupToday,
    'signup_yesterday' => $signupYest,
    'signup_google' => count(array_filter($people, static fn($p) => ($p['via'] ?? '') === 'google')),
    'signup_email' => count(array_filter($people, static fn($p) => ($p['via'] ?? '') === 'email')),
    'signup_date' => $nInscrits,
    'signup_hour' => $signupToday,
    'signup_geo' => $nInscrits,
    'visits' => count(glob(rtrim(orolado_data_dir(), DIRECTORY_SEPARATOR . '/') . '/visits/' . date('Y-m-d') . '/*') ?: []),
    'no_deposit' => $noDep,
    'signup_closed' => count(admin_closed_accounts($people ?? admin_profiles())),
    'dep_today' => $depToday,
    'dep_pending' => $depPend,
    'dep_failed' => $depFail,
    'dep_top' => count($depositors),
    'dep_all' => $depPaidN,
    'dep_method' => count($channels),
    'dep_bonus' => $bonusN,
    'wd_pending' => $wdOpen,
    'wd_today' => $wdToday,
    'wd_all' => $wdVisible,
    'wd_rejected' => $wdRej,
    'wd_volume' => round($wdOpenSum, 2),
    'wd_suspect' => $wdSuspect,
    'online' => $online,
    'top_balances' => $payers,
    'top_winners' => $nWinners,
    'games' => $tradesToday,
    'trade_minutes' => $tradesToday,
    'inactive' => $inactive,
    'payers' => $payers,
    'open_positions' => $liveNow,
    'profit_today' => round($profitToday, 2),
    'profit_7d' => round($profit7, 2),
    'profit_total' => round($profitAll, 2),
    'sum_dep_all' => round($sumDepAll, 2),
    'sum_wd_paid' => round($sumWdPaid, 2),
    'payout_stats' => $tradesToday,
    'traffic' => $nInscrits,
    'otp_mails' => $otp,
    'alerts' => $healthErr + $healthWarn,
    // Pastille « À surveiller » : seulement ce qui n'a pas encore été marqué « C'est réglé ».
    'watch' => count(array_filter(admin_watch_rows(), static fn($r) => ($r['level'] ?? '') === 'warn'
      && !isset($ackedHealth[function_exists('admin_health_fp') ? admin_health_fp($r) : '']))),
    'alerts_err' => $healthErr,
    'messages' => $unreadMsg,
    'inscrits' => $nInscrits,
  ];
  admin_cache_set('badges_epoch3', $out);
  return $out;
}

/** Personnes connectées maintenant (inscrites ou non) : signal de présence de moins de 60 s. */
function admin_online_now(): int {
  $dir = rtrim(orolado_data_dir(), DIRECTORY_SEPARATOR . '/') . '/online';
  $n = 0;
  $lim = time() - 60;
  foreach ((array) @scandir($dir) as $f) {
    if ($f === '.' || $f === '..') continue;
    if ((int) @filemtime($dir . '/' . $f) >= $lim) $n++;
  }
  return $n;
}

/** Visiteurs uniques (1 par appareil et par jour) : [pays ISO => nombre] pour ces jours. */
function admin_visits_by_country(array $days): array {
  $base = rtrim(orolado_data_dir(), DIRECTORY_SEPARATOR . '/') . '/visits/';
  $out = [];
  foreach ($days as $d) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) || !is_dir($base . $d)) continue;
    foreach ((array) @scandir($base . $d) as $f) {
      if ($f === '.' || $f === '..') continue;
      $cc = strtoupper(trim((string) @file_get_contents($base . $d . '/' . $f)));
      if (!preg_match('/^[A-Z?]{2}$/', $cc)) $cc = '??';
      $out[$cc] = ($out[$cc] ?? 0) + 1;
    }
  }
  arsort($out);
  return $out;
}

/** Comptes suspendus et supprimés : [['kind'=>'suspended'|'deleted','id','publicId','email','at'], …] */
function admin_closed_accounts(array $people): array {
  $db = admin_local_db();
  $out = [];
  $seenEmail = [];
  $bans = is_array($db['bans'] ?? null) ? $db['bans'] : [];
  foreach ($people as $p) {
    $id = (string) ($p['id'] ?? '');
    $role = strtolower((string) ($p['role'] ?? ''));
    $ban = $bans[$id] ?? null;
    $kind = in_array($role, ['suspended', 'banned'], true) ? 'suspended' : ($role === 'deleted' ? 'deleted' : '');
    if ($kind === '' && is_array($ban)) $kind = strtolower((string) ($ban['kind'] ?? '')) === 'deleted' ? 'deleted' : 'suspended';
    if ($kind === '' || admin_is_protected_account($p, $id)) continue;
    $em = strtolower(trim((string) ($p['email'] ?? '')));
    if ($em !== '') $seenEmail[$em] = true;
    $out[] = ['kind' => $kind, 'id' => $id, 'publicId' => (string) ($p['publicId'] ?? ''), 'email' => $em,
      'at' => (string) (is_array($ban) ? ($ban['at'] ?? '') : ($p['updatedAt'] ?? $p['createdAt'] ?? ''))];
  }
  foreach ((is_array($db['blocked_identities'] ?? null) ? $db['blocked_identities'] : []) as $k => $row) {
    if (!is_array($row) || !str_starts_with((string) $k, 'email:')) continue;
    $em = strtolower(trim(substr((string) $k, 6)));
    if ($em === '' || isset($seenEmail[$em])) continue;
    $seenEmail[$em] = true;
    $out[] = ['kind' => (($row['kind'] ?? '') === 'deleted') ? 'deleted' : 'suspended', 'id' => '', 'publicId' => '', 'email' => $em, 'at' => (string) ($row['at'] ?? '')];
  }
  usort($out, static fn($a, $b) => strcmp($b['at'], $a['at']));
  return $out;
}

/** v2433 — Bonus par sorte, arrondis ; Affiliation = cadeau reçu comme ami invité + 5 % gagnés en invitant. */
function admin_bonus_by(array $by, string $uid, array $p): array {
  if (function_exists('orolado_aff_owner_name')) {
    $db = load_db();
    $users = $db['users'] ?? [];
    $local = '';
    if ($uid !== '' && isset($users[$uid])) $local = $uid;
    if ($local === '' && is_iterable($users)) {
      $mail = strtolower(trim((string) ($p['email'] ?? '')));
      foreach ($users as $k => $u) {
        if (!is_array($u)) continue;
        if ((string) ($u['sbId'] ?? '') === $uid || ($mail !== '' && strtolower((string) ($u['email'] ?? '')) === $mail)) { $local = (string) $k; break; }
      }
    }
    if ($local !== '') $by['aff'] += (float) (orolado_aff_read(orolado_aff_owner_name($local))['earned'] ?? 0);
  }
  foreach ($by as $k => $v) $by[$k] = round((float) $v, 2);
  return $by;
}

function admin_list_payload(string $view, array $req): array {
  // v2426 — rubrique F · Cadeaux (lecture seule).
  if (str_starts_with($view, 'gift_')) return admin_gift_payload($view, $req, admin_profiles());
  $needPeople = !in_array($view, ['alerts', 'otp_mails', 'payout_stats', 'games', 'trade_minutes', 'messages'], true);
  $needVaults = !in_array($view, ['alerts', 'otp_mails', 'dep_today', 'dep_pending', 'dep_failed', 'dep_all', 'dep_method', 'messages', 'traffic'], true);
  $needWds = str_starts_with($view, 'wd_') || str_starts_with($view, 'profit_');
  $needDeps = str_starts_with($view, 'dep_') || str_starts_with($view, 'profit_');
  $needOrders = in_array($view, ['open_positions', 'payout_stats', 'games', 'top_winners', 'trade_minutes', 'wd_suspect'], true);

  $people = $needPeople || $needVaults ? admin_profiles() : [];
  $vaults = $needVaults ? admin_vaults() : [];
  $pmap = [];
  foreach ($people as $p) $pmap[(string) $p['id']] = admin_enrich_user_row($p, $vaults);
  $wds = $needWds ? admin_withdrawals() : [];
  $deps = $needDeps ? admin_deposits() : [];
  $orders = $needOrders ? admin_orders() : [];
  [$t0, $t1] = admin_day_bounds('today');
  [$y0, $y1] = admin_day_bounds('yesterday');

  $cols = [];
  $rows = [];
  $summary = '';
  $actions = false;

  $userCols = ['ID', 'Nom', 'E-mail', 'Téléphone', 'Pays', 'Inscrit', 'Via', 'Solde réel'];
  $asUser = static function (array $p) use ($userCols): array {
    return [
      'cells' => [
        (string) ($p['publicId'] ?? ''),
        (string) ($p['name'] ?? '—'),
        (string) ($p['email'] ?? ''),
        admin_phone_cell($p),
        admin_country_cell($p),
        admin_when_cell((string) ($p['createdAt'] ?? '')),
        ($p['via'] ?? '') === 'google' ? 'Google' : (($p['via'] ?? '') === 'email' ? 'E-mail' : '—'),
        admin_money($p['real'] ?? 0),
      ],
      'userId' => (string) ($p['id'] ?? ''),
    ];
  };

  if ($view === 'signup_closed') {
    $all = admin_closed_accounts($people);
    $sus = array_values(array_filter($all, static fn($r) => $r['kind'] === 'suspended'));
    $del = array_values(array_filter($all, static fn($r) => $r['kind'] === 'deleted'));
    $cols = ['Statut', 'ID', 'E-mail', 'Date'];
    $fmt = static fn($at) => $at !== '' ? date('d/m/Y H:i', strtotime($at) ?: time()) : '—';
    foreach ($sus as $r) $rows[] = ['cells' => ['⛔ Suspendu', $r['publicId'] !== '' ? $r['publicId'] : '—', $r['email'] !== '' ? $r['email'] : '—', $fmt($r['at'])], 'userId' => $r['id']];
    foreach ($del as $r) $rows[] = ['cells' => ['🗑 Supprimé', $r['publicId'] !== '' ? $r['publicId'] : '—', $r['email'] !== '' ? $r['email'] : '—', $fmt($r['at'])], 'userId' => ''];
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($rows), 'page' => 1, 'pages' => 1,
      'summary' => count($sus) . ' suspendu(s) · ' . count($del) . ' supprimé(s) — e-mails bloqués pour toujours', 'actions' => false];
  }

  if (in_array($view, ['signup_today', 'signup_yesterday', 'signup_date', 'signup_google', 'signup_email', 'no_deposit', 'online', 'inactive', 'top_balances'], true)) {
    $cols = $userCols;
    $list = $people;
    if ($view === 'signup_today') {
      $list = array_values(array_filter($people, static fn($p) => admin_in_range($p['createdAt'] ?? null, $t0, $t1)));
    } else if ($view === 'signup_google' || $view === 'signup_email') {
      $want = $view === 'signup_google' ? 'google' : 'email';
      $list = array_values(array_filter($people, static fn($p) => ($p['via'] ?? '') === $want));
    } else if ($view === 'signup_yesterday') {
      $list = array_values(array_filter($people, static fn($p) => admin_in_range($p['createdAt'] ?? null, $y0, $y1)));
    } else if ($view === 'no_deposit') {
      $list = array_values(array_filter($people, static fn($p) => (float) ($p['depositTotal'] ?? 0) <= 0));
    } else if ($view === 'online') {
      $cut = time() - 90;
      $list = array_values(array_filter($people, static function ($p) use ($cut) {
        $t = strtotime((string) ($p['lastSeen'] ?? ''));
        return $t && $t >= $cut;
      }));
    } else if ($view === 'inactive') {
      $cut7 = time() - 7 * 86400;
      $list = array_values(array_filter($people, static function ($p) use ($cut7) {
        if ((float) ($p['depositTotal'] ?? 0) <= 0) return false;
        $t = strtotime((string) ($p['lastSeen'] ?? '')) ?: 0;
        return $t < $cut7;
      }));
    } else if ($view === 'top_balances') {
      $tmp = [];
      foreach ($people as $p) $tmp[] = admin_enrich_user_row($p, $vaults);
      usort($tmp, static fn($a, $b) => ($b['real'] <=> $a['real']));
      $list = $tmp;
    } else if ($view === 'signup_closed') {
      $list = array_values(array_filter($people, static function ($p) {
        $role = strtolower((string) ($p['role'] ?? ''));
        return in_array($role, ['suspended', 'banned', 'deleted'], true);
      }));
    }
    $list = admin_apply_filters($list, $req, 'createdAt');
    if ($view !== 'top_balances') {
      // v2641 : rangé par VRAIE heure (les fiches n'écrivent pas l'heure au même format) : le plus récent en haut.
      usort($list, static fn($a, $b) => (strtotime((string) ($b['createdAt'] ?? '')) ?: 0) <=> (strtotime((string) ($a['createdAt'] ?? '')) ?: 0));
    }
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) {
      $p = admin_enrich_user_row($p, $vaults);
      $rows[] = $asUser($p);
    }
    $summary = $total . ' joueur(s)';
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $summary, 'actions' => $actions];
  }

  if ($view === 'signup_idrange') {
    $raw = trim((string) ($req['idFrom'] ?? ''));
    $a = 0;
    $b = 0;
    if (preg_match('/(\d+)\s*[-–àto]+\s*(\d+)/u', $raw, $m)) {
      $a = (int) $m[1];
      $b = (int) $m[2];
    } else {
      $n = (int) preg_replace('/\D/', '', $raw);
      $a = $n;
      $b = $n;
    }
    if ($a <= 0 && $b <= 0) {
      return ['ok' => true, 'cols' => ['Indicateur', 'Valeur'], 'rows' => [], 'total' => 0, 'page' => 1, 'pages' => 1, 'summary' => 'Saisissez un n° ou une plage, ex. 12 ou 12-40', 'actions' => false];
    }
    if ($a <= 0) $a = $b;
    if ($b <= 0) $b = $a;
    if ($b < $a) { $tmp = $a; $a = $b; $b = $tmp; }
    $seen = [];
    $list = [];
    foreach ($people as $p) {
      $seq = (int) ($p['seq'] ?? 0);
      $pidN = (int) preg_replace('/\D/', '', (string) ($p['publicId'] ?? ''));
      $hit = ($seq >= $a && $seq <= $b) || ($pidN >= $a && $pidN <= $b);
      if (!$hit) continue;
      $id = (string) ($p['id'] ?? '');
      if ($id === '' || isset($seen[$id])) continue;
      $seen[$id] = true;
      $list[] = admin_enrich_user_row($p, $vaults);
    }
    $withDep = 0;
    $noDepN = 0;
    $sumDep = 0.0;
    $sumReal = 0.0;
    $closed = 0;
    $geo = [];
    foreach ($list as $p) {
      $dep = (float) ($p['depositTotal'] ?? 0);
      if ($dep > 0) { $withDep++; $sumDep += $dep; } else $noDepN++;
      $sumReal += (float) ($p['real'] ?? 0);
      $role = strtolower((string) ($p['role'] ?? ''));
      if (in_array($role, ['suspended', 'banned', 'deleted'], true)) $closed++;
      $c = admin_country_cell($p);
      if ($c === '—') $c = 'Inconnu';
      $geo[$c] = ($geo[$c] ?? 0) + 1;
    }
    arsort($geo);
    $topCountry = $geo === [] ? '—' : (string) array_key_first($geo);
    $cols = ['Indicateur', 'Valeur'];
    $stat = static function (string $k, string $v): array {
      return ['cells' => [$k, $v], 'userId' => ''];
    };
    $rows = [
      $stat('Tranche', (string) $a . ' → ' . (string) $b),
      $stat('Joueurs uniques', (string) count($list)),
      $stat('Avec dépôt réel', (string) $withDep . ' · ' . admin_pct($withDep, count($list))),
      $stat('Sans dépôt', (string) $noDepN . ' · ' . admin_pct($noDepN, count($list))),
      $stat('Volume déposé', admin_money($sumDep)),
      $stat('Soldes réels cumulés', admin_money($sumReal)),
      $stat('Comptes fermés / suspendus', (string) $closed),
      $stat('Pays principal', $topCountry),
    ];
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($list), 'page' => 1, 'pages' => 1, 'summary' => count($list) . ' joueur(s) unique(s) · n° ' . $a . ' → ' . $b, 'actions' => false];
  }

  if ($view === 'signup_hour') {
    $cols = ['Heure', 'Inscriptions'];
    $bucket = array_fill(0, 24, 0);
    $src = admin_apply_filters($people, $req, 'createdAt');
    if (($req['preset'] ?? 'all') === 'all') {
      $src = array_values(array_filter($people, static fn($p) => admin_in_range($p['createdAt'] ?? null, $t0, $t1)));
    }
    foreach ($src as $p) {
      $t = strtotime((string) ($p['createdAt'] ?? ''));
      if (!$t) continue;
      $h = (int) (new DateTimeImmutable('@' . $t))->setTimezone(admin_tz())->format('G');
      $bucket[$h]++;
    }
    foreach ($bucket as $h => $n) {
      $rows[] = ['cells' => [sprintf('%02d:00 – %02d:59', $h, $h), (string) $n], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => array_sum($bucket), 'page' => 1, 'pages' => 1, 'summary' => 'Pics horaires', 'actions' => false];
  }

  if ($view === 'visits') {
    $preset = (string) ($req['preset'] ?? 'all');
    $days = [date('Y-m-d')];
    $label = 'aujourd’hui';
    if ($preset === 'all') {
      $days = array_values(array_filter((array) @scandir(rtrim(orolado_data_dir(), DIRECTORY_SEPARATOR . '/') . '/visits'), static fn($d) => (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $d)));
      $label = 'depuis le début';
    }
    if ($preset === 'yesterday') { $days = [date('Y-m-d', strtotime('-1 day'))]; $label = 'hier'; }
    if ($preset === 'date' && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($req['cal'] ?? ''))) { $days = [(string) $req['cal']]; $label = 'le ' . date('d/m/Y', strtotime((string) $req['cal'])); }
    if ($preset === 'range' && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($req['dateFrom'] ?? '')) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($req['dateTo'] ?? ''))) {
      $days = [];
      for ($t = strtotime((string) $req['dateFrom']); $t <= strtotime((string) $req['dateTo']) && count($days) < 400; $t += 86400) $days[] = date('Y-m-d', $t);
      $label = 'du ' . date('d/m', strtotime((string) $req['dateFrom'])) . ' au ' . date('d/m', strtotime((string) $req['dateTo']));
    }
    $geo = admin_visits_by_country($days);
    $cols = ['Pays', 'Visiteurs'];
    foreach ($geo as $cc => $n) {
      $name = $cc === '??' ? 'Inconnu' : admin_country_name($cc);
      $rows[] = ['cells' => [$name !== '' ? $name : $cc, (string) $n], 'userId' => ''];
    }
    $total = array_sum($geo);
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => 1, 'pages' => 1, 'summary' => $total . ' visiteurs ' . $label . ' (1 par appareil, inscrits ou non)', 'actions' => false];
  }

  if ($view === 'signup_geo') {
    $cols = ['Pays', 'Joueurs', 'Dernière IP connue'];
    $src = admin_apply_filters($people, $req, 'createdAt');
    $geo = [];
    foreach ($src as $p) {
      $k = admin_country_cell($p);
      if ($k === '—') $k = 'Inconnu';
      if (!isset($geo[$k])) $geo[$k] = ['n' => 0, 'ip' => ''];
      $geo[$k]['n']++;
      if ($geo[$k]['ip'] === '' && !empty($p['ip'])) $geo[$k]['ip'] = (string) $p['ip'];
    }
    arsort($geo);
    foreach ($geo as $k => $g) {
      $rows[] = ['cells' => [$k, (string) $g['n'], $g['ip'] !== '' ? $g['ip'] : '—'], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($src), 'page' => 1, 'pages' => 1, 'summary' => count($src) . ' joueurs', 'actions' => false];
  }

    if (in_array($view, ['dep_today', 'dep_pending', 'dep_failed', 'dep_all'], true)) {
    $cols = ['Réf.', 'ID', 'E-mail', 'Montant', 'Méthode', 'Statut', 'Date'];
    $list = $deps;
    if ($view === 'dep_all') {
      $list = array_values(array_filter($deps, static fn($d) => admin_dep_is_paid($d) && (float) ($d['amount'] ?? 0) > 0.009));
    } else if ($view === 'dep_today') {
      $list = array_values(array_filter($deps, static fn($d) => admin_dep_is_paid($d) && admin_in_range($d['createdAt'] ?? null, $t0, $t1)));
    } else if ($view === 'dep_pending') {
      $list = array_values(array_filter($deps, static fn($d) => admin_dep_is_pending($d)));
      $actions = true;
    } else if ($view === 'dep_failed') {
      $list = array_values(array_filter($deps, static fn($d) => admin_dep_is_failed($d)));
    }
    $enriched = [];
    foreach ($list as $d) {
      $u = admin_user_lookup((string) $d['userId'], $pmap);
      $d['email'] = (string) ($u['email'] ?? '');
      $d['publicId'] = (string) ($u['publicId'] ?? '');
      $d['name'] = (string) ($u['name'] ?? '');
      $d['phone'] = (string) ($u['phone'] ?? '');
      $enriched[] = $d;
    }
    $enriched = admin_apply_filters($enriched, $req, 'createdAt');
    $sum = 0.0;
    foreach ($enriched as $d) $sum += (float) $d['amount'];
    [$slice, $total, $page, $pages] = admin_page($enriched, $req);
    foreach ($slice as $d) {
      $rows[] = [
        'cells' => [
          (string) $d['id'],
          (string) ($d['publicId'] ?? ''),
          (string) ($d['email'] ?? ''),
          admin_money($d['amount']),
          admin_dep_channel_row($d),
          (string) $d['status'],
          substr((string) ($d['createdAt'] ?? ''), 0, 16),
        ],
        'userId' => (string) ($d['userId'] ?? ''),
        'ref' => (string) $d['id'],
        'kind' => 'deposit',
        'pending' => admin_dep_is_pending($d),
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $total . ' dépôt(s) · ' . admin_money($sum), 'actions' => $actions];
  }

  // Bonus envoyés depuis l'admin : jamais mélangés aux dépôts (ce n'est pas de l'argent reçu).
  if ($view === 'dep_bonus') {
    $cols = ['Réf.', 'ID', 'Nom', 'E-mail', 'Montant', 'Motif', 'Date'];
    $list = [];
    foreach ($deps as $d) {
      if (!admin_dep_bonus_paid($d) || (float) ($d['amount'] ?? 0) <= 0) continue;
      $u = admin_user_lookup((string) $d['userId'], $pmap);
      $d['email'] = (string) ($u['email'] ?? '');
      $d['publicId'] = (string) ($u['publicId'] ?? '');
      $d['name'] = (string) ($u['name'] ?? '');
      $list[] = $d;
    }
    [$w0, $w1] = admin_day_bounds('range', admin_now()->modify('-6 days')->format('Y-m-d'), admin_now()->format('Y-m-d'));
    $sumToday = 0.0; $sum7 = 0.0; $sumAll = 0.0;
    foreach ($list as $d) {
      $a = (float) $d['amount'];
      $sumAll += $a;
      if (admin_in_range($d['createdAt'] ?? null, $t0, $t1)) $sumToday += $a;
      if (admin_in_range($d['createdAt'] ?? null, $w0, $w1)) $sum7 += $a;
    }
    $shown = admin_apply_filters($list, $req, 'createdAt');
    $sumShown = 0.0;
    foreach ($shown as $d) $sumShown += (float) $d['amount'];
    [$slice, $total, $page, $pages] = admin_page($shown, $req);
    foreach ($slice as $d) {
      $motif = (string) ($d['motif'] ?? '');
      $rows[] = [
        'cells' => [
          (string) $d['id'],
          (string) ($d['publicId'] ?? ''),
          (string) ($d['name'] ?? '—'),
          (string) ($d['email'] ?? ''),
          admin_money($d['amount']),
          $motif !== '' && $motif !== 'Bonus' ? $motif : '—',
          substr((string) ($d['createdAt'] ?? ''), 0, 16),
        ],
        'userId' => (string) ($d['userId'] ?? ''),
        'wrap' => 5,
      ];
    }
    $summary = $total . ' bonus · ' . admin_money($sumShown) . ' affichés'
      . ' · Aujourd’hui ' . admin_money($sumToday) . ' · 7 jours ' . admin_money($sum7) . ' · Depuis le début ' . admin_money($sumAll)
      . ' — non comptés dans les dépôts ni le bénéfice';
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $summary, 'actions' => false];
  }

  if ($view === 'dep_top') {
    $cols = ['ID', 'Nom', 'E-mail', 'Total déposé', 'Solde réel'];
    $tot = [];
    foreach ($deps as $d) {
      if (!admin_dep_is_paid($d)) continue;
      $uid = (string) $d['userId'];
      if ($uid === '') continue;
      if (!isset($tot[$uid])) $tot[$uid] = 0.0;
      $tot[$uid] += (float) $d['amount'];
    }
    $list = [];
    foreach ($tot as $uid => $amt) {
      $u = admin_enrich_user_row(admin_user_lookup($uid, $pmap), $vaults);
      $u['email'] = (string) ($u['email'] ?? '');
      $u['topAmt'] = $amt;
      $list[] = $u;
    }
    usort($list, static fn($a, $b) => ($b['topAmt'] <=> $a['topAmt']));
    $list = admin_apply_filters($list, $req, 'createdAt');
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) {
      $rows[] = [
        'cells' => [(string) ($p['publicId'] ?? ''), (string) ($p['name'] ?? ''), (string) ($p['email'] ?? ''), admin_money($p['topAmt'] ?? 0), admin_money($p['real'] ?? 0)],
        'userId' => (string) ($p['id'] ?? ''),
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => 'Classement déposants', 'actions' => false];
  }

  if ($view === 'dep_method') {
    $cols = ['Méthode', 'Nombre', 'Volume $'];
    $src = admin_apply_filters(array_values(array_filter($deps, static fn($d) => admin_dep_is_paid($d))), $req, 'createdAt');
    $g = [];
    foreach ($src as $d) {
      $ch = admin_dep_channel_row($d);
      if (!isset($g[$ch])) $g[$ch] = ['n' => 0, 's' => 0.0];
      $g[$ch]['n']++;
      $g[$ch]['s'] += (float) $d['amount'];
    }
    foreach ($g as $k => $v) {
      $rows[] = ['cells' => [$k, (string) $v['n'], admin_money($v['s'])], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($src), 'page' => 1, 'pages' => 1, 'summary' => 'Ventilation des dépôts validés', 'actions' => false];
  }

  if ($view === 'wd_suspect') {
    $cols = ['Joueur', 'Nom', 'E-mail', 'Niveau', 'Alertes', 'Retrait ouvert', 'Trades (30 j)', 'Solde'];
    $list = [];
    foreach (admin_suspects() as $uid => $s) {
      $p = $pmap[$uid] ?? admin_enrich_user_row(['id' => $uid], $vaults);
      $p['_reason'] = $s['reason'];
      $p['_level'] = (string) ($s['level'] ?? 'red');
      $p['_openAmt'] = $s['openAmt'];
      $p['_trades'] = $s['trades'];
      $list[] = $p;
    }
    // v2672 — rouges d'abord, puis le plus gros retrait ouvert.
    usort($list, static fn($a, $b) => [($a['_level'] === 'red' ? 0 : 1), -(float) ($a['_openAmt'] ?? 0)] <=> [($b['_level'] === 'red' ? 0 : 1), -(float) ($b['_openAmt'] ?? 0)]);
    $q = strtolower(trim((string) ($req['q'] ?? '')));
    if ($q !== '') {
      $list = array_values(array_filter($list, static fn($p) => admin_match_q($p, $q) || str_contains(strtolower((string) ($p['_reason'] ?? '')), $q)));
    }
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) {
      $rows[] = [
        'cells' => [
          (string) ($p['publicId'] ?? ''),
          (string) ($p['name'] ?? '—'),
          (string) ($p['email'] ?? ''),
          $p['_level'] === 'red' ? 'Ne pas payer' : 'À suivre',
          (string) ($p['_reason'] ?? ''),
          ((float) ($p['_openAmt'] ?? 0) > 0) ? admin_money($p['_openAmt']) : '—',
          (string) ($p['_trades'] ?? 0),
          admin_money($p['real'] ?? 0),
        ],
        'userId' => (string) ($p['id'] ?? ''),
        'flag' => $p['_level'] === 'red' ? 'suspect' : 'watch',
        'kind' => 'suspect',
        'wrap' => 4,
      ];
    }
    $nRed = count(array_filter($list, static fn($p) => $p['_level'] === 'red'));
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => '🔴 ' . $nRed . ' à ne pas payer · 🟠 ' . ($total - $nRed) . ' à suivre · cliquez une ligne pour voir la fiche', 'actions' => false];
  }

  if (in_array($view, ['wd_pending', 'wd_today', 'wd_all', 'wd_rejected', 'wd_volume'], true)) {
    $cols = ['ID retrait', 'Joueur', 'Nom', 'E-mail', 'Montant', 'Méthode', 'Destination', 'État', 'Statut', 'Date'];
    $list = $wds;
    $ordersByUser = [];
    foreach ($orders as $o) {
      if ((string) ($o['mode'] ?? '') !== 'real') continue;
      $uid = (string) ($o['user_id'] ?? '');
      if ($uid !== '') $ordersByUser[$uid][] = $o;
    }
    if ($view === 'wd_pending' || $view === 'wd_volume') {
      $list = array_values(array_filter($wds, static fn($w) => admin_wd_is_open($w)));
      $actions = true;
    } else if ($view === 'wd_today') {
      // v2655 : TOUS les retraits payés, rangés par date de PAIEMENT (le plus récent en haut) ; la case de
      // dates choisit le jour / la période (avant : seulement ceux DEMANDÉS aujourd'hui → liste souvent vide).
      $list = array_values(array_filter($wds, static fn($w) => admin_wd_is_paid($w)));
      foreach ($list as $i => $w) $list[$i]['createdAt'] = admin_wd_paid_at($w) ?: (string) ($w['createdAt'] ?? '');
      usort($list, static fn($a, $b) => (strtotime((string) ($b['createdAt'] ?? '')) ?: 0) <=> (strtotime((string) ($a['createdAt'] ?? '')) ?: 0));
    } else if ($view === 'wd_rejected') {
      $list = array_values(array_filter($wds, static fn($w) => admin_wd_is_rejected($w)));
    } else {
      $list = array_values(array_filter($wds, static fn($w) => !admin_wd_is_silenced($w)));
      $actions = true;
    }
    $suspects = admin_suspects();
    $enriched = [];
    $sum = 0.0;
    $q = strtolower(trim((string) ($req['q'] ?? '')));
    $preset = (string) ($req['preset'] ?? 'all');
    foreach ($list as $w) {
      $w = admin_enrich_wd($w, $pmap);
      $uid = (string) ($w['userId'] ?? '');
      $p = $pmap[$uid] ?? ['id' => $uid];
      // v2672 — alertes ROUGES (ne pas payer) / ORANGE (à suivre).
      $al = (admin_wd_is_open($w) && isset($suspects[$uid])) ? (array) ($suspects[$uid]['alerts'] ?? []) : admin_alerts($p, $ordersByUser[$uid] ?? [], $w);
      $w['_alerts'] = $al;
      $w['_suspect'] = $al !== [];
      if ($q !== '' && !admin_match_q($w, $q) && !str_contains(strtolower((string) ($w['name'] ?? '')), $q)) continue;
      if ($preset !== 'all' && $preset !== '' && ($w['createdAt'] ?? '') !== '') {
        $tmp = admin_apply_filters([$w], $req, 'createdAt');
        if ($tmp === []) continue;
      }
      $sum += (float) $w['amount'];
      $enriched[] = $w;
    }
    [$slice, $total, $page, $pages] = admin_page($enriched, $req);
    foreach ($slice as $w) {
      $open = admin_wd_is_open($w);
      $method = admin_method_label(admin_fill((string) ($w['operator'] ?? '')));
      $dest = admin_phone_cell(['phone' => admin_fill((string) ($w['phone'] ?? '')), 'countryCode' => (string) ($w['countryCode'] ?? '')]);
      $suspect = !empty($w['_suspect']);
      // v2654 : le MOTIF est écrit sous « Suspect » (avant : seulement le mot, sans raison).
      $why = '';
      $lvl = '';
      if ($suspect) {
        $why = admin_alerts_text((array) $w['_alerts']);
        $lvl = admin_alerts_level((array) $w['_alerts']);
      }
      $rows[] = [
        'cells' => [
          (string) $w['id'],
          (string) ($w['publicId'] ?? ''),
          (string) ($w['name'] ?? '—'),
          (string) ($w['email'] ?? ''),
          admin_money($w['amount']),
          $method !== '' ? $method : '—',
          $dest,
          $suspect ? ($lvl === 'red' ? 'Ne pas payer' : 'À suivre') : 'Vérifié',
          (string) ($w['status'] ?? ''),
          admin_when_cell((string) ($w['createdAt'] ?? '')),
        ],
        'userId' => (string) ($w['userId'] ?? ''),
        'ref' => (string) $w['id'],
        'kind' => 'withdraw',
        'pending' => $open,
        'suspect' => $suspect,
        'why' => $why,
        'flag' => $suspect ? ($lvl === 'red' ? 'suspect' : 'watch') : 'ok',
      ];
    }
    $summary = $total . ' retrait(s) · ' . admin_money($sum);
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $summary, 'actions' => $actions];
  }

  if ($view === 'top_winners') {
    $cols = ['ID', 'Nom', 'E-mail', 'Gains nets du jour', 'Mises'];
    $g = [];
    foreach ($orders as $o) {
      if ((string) ($o['mode'] ?? '') !== 'real') continue;
      if (!admin_in_range((string) ($o['created_at'] ?? ''), $t0, $t1)) continue;
      $uid = (string) ($o['user_id'] ?? '');
      if ($uid === '') continue;
      if (!isset($g[$uid])) $g[$uid] = ['net' => 0.0, 'stake' => 0.0];
      $g[$uid]['net'] += (float) ($o['net'] ?? 0);
      $g[$uid]['stake'] += (float) ($o['stake'] ?? 0);
    }
    $list = [];
    foreach ($g as $uid => $x) {
      $u = admin_user_lookup($uid, $pmap);
      $u['winNet'] = $x['net'];
      $u['winStake'] = $x['stake'];
      $list[] = $u;
    }
    usort($list, static fn($a, $b) => ($b['winNet'] <=> $a['winNet']));
    $list = admin_apply_filters($list, $req, 'createdAt');
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) {
      $rows[] = [
        'cells' => [(string) ($p['publicId'] ?? ''), (string) ($p['name'] ?? ''), (string) ($p['email'] ?? ''), admin_money($p['winNet'] ?? 0), admin_money($p['winStake'] ?? 0)],
        'userId' => (string) ($p['id'] ?? ''),
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => 'Gains réels aujourd’hui', 'actions' => false];
  }

  if ($view === 'games') {
    $cols = ['Jeu', 'Mises $', 'Gains nets $', 'Trades', 'Mode réel'];
    $g = [];
    $src = $orders;
    $preset = (string) ($req['preset'] ?? 'all');
    if ($preset !== 'all') {
      $from = (string) ($req['dateFrom'] ?? '');
      $to = (string) ($req['dateTo'] ?? '');
      $cal = (string) ($req['cal'] ?? '');
      if ($preset === 'date' && $cal !== '') { $from = $cal; $to = $cal; }
      [$a, $b] = admin_day_bounds($preset, $from, $to);
      $src = array_values(array_filter($orders, static fn($o) => admin_in_range((string) ($o['created_at'] ?? ''), $a, $b)));
    }
    foreach ($src as $o) {
      if ((string) ($o['mode'] ?? 'demo') !== 'real') continue;
      $aid = (string) ($o['asset_id'] ?? '—');
      if (!isset($g[$aid])) $g[$aid] = ['stake' => 0.0, 'net' => 0.0, 'n' => 0];
      $g[$aid]['stake'] += (float) ($o['stake'] ?? 0);
      $g[$aid]['net'] += (float) ($o['net'] ?? 0);
      $g[$aid]['n']++;
    }
    foreach ($g as $aid => $x) {
      $rows[] = ['cells' => [admin_asset_name($aid), admin_money($x['stake']), admin_money($x['net']), (string) $x['n'], 'réel'], 'userId' => ''];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($rows), 'page' => 1, 'pages' => 1, 'summary' => 'Performance réelle par jeu', 'actions' => false];
  }

  if ($view === 'traffic') {
    $cols = ['Réseau', 'Canal', 'Campagne / ref.', 'Joueurs', 'Avec dépôt', 'Conversion', 'Pays principal'];
    $src = admin_apply_filters($people, $req, 'createdAt');
    $g = [];
    foreach ($src as $p) {
      $raw = strtolower(trim((string) ($p['traffic'] ?? 'direct'))) ?: 'direct';
      [$net, $fallbackMed] = admin_traffic_network($raw);
      $med = trim((string) ($p['trafficMedium'] ?? ''));
      if ($med === '') $med = $fallbackMed;
      $camp = trim((string) ($p['trafficCampaign'] ?? $p['trafficReferrer'] ?? ''));
      if ($camp === '') $camp = $raw === 'direct' ? '—' : $raw;
      $key = $net . '|' . $med . '|' . $camp;
      if (!isset($g[$key])) {
        $g[$key] = ['net' => $net, 'med' => $med, 'camp' => $camp, 'n' => 0, 'paid' => 0, 'geo' => []];
      }
      $g[$key]['n']++;
      if ((float) ($p['depositTotal'] ?? 0) > 0) $g[$key]['paid']++;
      $c = admin_country_cell($p);
      if ($c === '—') $c = 'Inconnu';
      $g[$key]['geo'][$c] = ($g[$key]['geo'][$c] ?? 0) + 1;
    }
    uasort($g, static fn($a, $b) => ($b['n'] <=> $a['n']));
    foreach ($g as $row) {
      arsort($row['geo']);
      $top = $row['geo'] === [] ? '—' : (string) array_key_first($row['geo']);
      $rows[] = [
        'cells' => [
          $row['net'],
          $row['med'],
          $row['camp'],
          (string) $row['n'],
          (string) $row['paid'],
          admin_pct($row['paid'], $row['n']),
          $top,
        ],
        'userId' => '',
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($src), 'page' => 1, 'pages' => 1, 'summary' => count($src) . ' inscription(s) ventilées par réseau et conversion', 'actions' => false];
  }

  if ($view === 'otp_mails') {
    $cols = ['Heure', 'E-mail', 'Type', 'Statut'];
    $list = admin_apply_filters(admin_otp_rows(), $req, 'at');
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $r) {
      $rows[] = [
        'cells' => [substr((string) ($r['at'] ?? ''), 0, 19), (string) ($r['email'] ?? ''), (string) ($r['type'] ?? ''), (string) ($r['status'] ?? '')],
        'userId' => '',
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $total . ' e-mail(s) / OTP', 'actions' => false];
  }

  if ($view === 'alerts' || $view === 'watch') {
    $cols = ['', 'Heure exacte', 'Service', 'État', 'Description'];
    $list = $view === 'watch' ? admin_watch_rows() : admin_health_rows();
    $list = admin_apply_filters($list, $req, 'at');
    $acked = function_exists('admin_health_ack_map') ? admin_health_ack_map() : [];
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    $errN = 0;
    foreach ($list as $r) {
      $lvl = (string) ($r['level'] ?? 'ok');
      $fp = function_exists('admin_health_fp') ? admin_health_fp($r) : '';
      if ($lvl === 'error' && ($fp === '' || !isset($acked[$fp]))) $errN++;
    }
    foreach ($slice as $r) {
      $lvl = (string) ($r['level'] ?? 'ok');
      $fp = function_exists('admin_health_fp') ? admin_health_fp($r) : '';
      $ackedRow = ($lvl === 'error' || $lvl === 'warn') && $fp !== '' && isset($acked[$fp]);
      if ($ackedRow) $lvl = 'ok';
      $label = $ackedRow ? 'Réglé' : ($lvl === 'error' ? 'Panne' : ($lvl === 'warn' ? 'Attention' : 'OK'));
      $canAck = !$ackedRow && ($lvl === 'error' || $lvl === 'warn') && $fp !== '';
      $rows[] = [
        'cells' => [
          '',
          substr((string) ($r['at'] ?? ''), 0, 19),
          (string) ($r['service'] ?? ''),
          $label,
          (string) ($r['message'] ?? ''),
        ],
        'userId' => '',
        'alert' => $lvl === 'error',
        'flag' => $lvl === 'error' ? 'suspect' : ($lvl === 'warn' ? 'unread' : 'ok'),
        'wrap' => 4,
        'fp' => $fp,
        'canAck' => $canAck,
      ];
    }
    if ($view === 'watch') {
      $warnN = 0;
      foreach ($list as $r) if (($r['level'] ?? '') === 'warn') $warnN++;
      $summary = $warnN === 0 ? 'Rien de particulier à surveiller pour le moment.' : ($warnN . ' point(s) à regarder (ce ne sont pas des pannes)');
    } else {
      $summary = $errN === 0
        ? 'Santé du site : aucune panne. Paiements, e-mails, base, prix et serveur répondent.'
        : ($errN . ' panne(s) à traiter');
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $summary, 'actions' => false, 'alertOpen' => $errN];
  }

  if (in_array($view, ['profit_today', 'profit_7d', 'profit_total'], true)) {
    $from = '';
    $to = '';
    $label = 'Total';
    if ($view === 'profit_today') {
      $from = $t0; $to = $t1; $label = 'Aujourd’hui';
    } else if ($view === 'profit_7d') {
      $from = admin_now()->modify('-6 days')->setTime(0, 0, 0)->format('c');
      $to = admin_now()->modify('+1 day')->setTime(0, 0, 0)->format('c');
      $label = '7 derniers jours';
    }
    $in = 0.0; $out = 0.0;
    $cols = ['Type', 'Réf.', 'Joueur', 'Montant', 'Date'];
    foreach ($deps as $d) {
      if (!admin_dep_is_paid($d)) continue;
      if (!admin_in_range((string) ($d['createdAt'] ?? ''), $from, $to)) continue;
      $in += (float) $d['amount'];
      $u = admin_user_lookup((string) $d['userId'], $pmap);
      $rows[] = ['cells' => ['Dépôt', (string) $d['id'], (string) ($u['name'] ?? $u['publicId'] ?? ''), admin_money($d['amount']), substr((string) ($d['createdAt'] ?? ''), 0, 16)], 'userId' => (string) $d['userId']];
    }
    foreach ($wds as $w) {
      if (!admin_wd_is_paid($w) || admin_wd_is_silenced($w)) continue;
      if (!admin_in_range((string) ($w['createdAt'] ?? ''), $from, $to)) continue;
      $out += (float) $w['amount'];
      $w = admin_enrich_wd($w, $pmap);
      $rows[] = ['cells' => ['Retrait', (string) $w['id'], (string) ($w['name'] ?? $w['publicId'] ?? ''), admin_money($w['amount']), substr((string) ($w['createdAt'] ?? ''), 0, 16)], 'userId' => (string) ($w['userId'] ?? '')];
    }
    // Bonus offerts : affichés pour info. Ce n'est pas de l'argent reçu ; leur coût réel
    // apparaît seulement s'ils finissent retirés (déjà compté dans « Retraits »).
    $bonus = 0.0;
    foreach ($deps as $d) {
      if (!admin_dep_bonus_paid($d)) continue;
      if (!admin_in_range((string) ($d['createdAt'] ?? ''), $from, $to)) continue;
      $bonus += (float) $d['amount'];
    }
    usort($rows, static fn($a, $b) => strcmp((string) ($b['cells'][4] ?? ''), (string) ($a['cells'][4] ?? '')));
    $net = $in - $out;
    // Les bonus ne sont plus mélangés à ce tableau : détail dans le bouton « Bonus Offerts ».
    $summary = $label . ' · Dépôts ' . admin_money($in) . ' − Retraits ' . admin_money($out) . ' = Bénéfice ' . admin_money($net)
      . ' · (Bonus offerts sur la période : ' . admin_money($bonus) . ', détail dans « Bonus Offerts »)';
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($rows), 'page' => 1, 'pages' => 1, 'summary' => $summary, 'actions' => false];
  }

  if ($view === 'payers') {
    $cols = $userCols;
    $list = array_values(array_filter($people, static fn($p) => (float) ($p['depositTotal'] ?? 0) > 0));
    $list = admin_apply_filters($list, $req, 'createdAt');
    usort($list, static fn($a, $b) => ((float) ($b['depositTotal'] ?? 0) <=> (float) ($a['depositTotal'] ?? 0)));
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $p) $rows[] = $asUser(admin_enrich_user_row($p, $vaults));
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $total . ' joueur(s) ayant déposé', 'actions' => false];
  }

  if ($view === 'open_positions') {
    $cols = ['Joueur', 'Nom', 'Jeu', 'Sens', 'Mise', 'Temps restant'];
    $live = [];
    foreach ($orders as $o) {
      if (!admin_order_is_live_real($o)) continue;
      $live[] = $o;
    }
    usort($live, static function ($a, $b) {
      return admin_order_expiry_ts($a) <=> admin_order_expiry_ts($b);
    });
    foreach ($live as $o) {
      $u = admin_user_lookup((string) ($o['user_id'] ?? ''), $pmap);
      $exp = admin_order_expiry_ts($o);
      $left = $exp > 0 ? max(0, $exp - time()) : (int) ($o['duration'] ?? 0);
      $side = strtolower((string) ($o['side'] ?? ''));
      $sens = $side === 'put' ? 'Vente (PUT)' : 'Achat (CALL)';
      $mm = floor($left / 60);
      $ss = $left % 60;
      $rows[] = [
        'cells' => [
          (string) ($u['publicId'] ?? ''),
          (string) ($u['name'] ?? '—'),
          admin_asset_name((string) ($o['asset_id'] ?? '')),
          $sens,
          admin_money($o['stake'] ?? 0),
          sprintf('%d:%02d', $mm, $ss),
        ],
        'userId' => (string) ($o['user_id'] ?? ''),
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => count($rows), 'page' => 1, 'pages' => 1, 'summary' => count($rows) . ' position(s) réelle(s) ouverte(s)', 'actions' => false];
  }

  if ($view === 'payout_stats') {
    $cols = ['Payout', 'Trades', 'Part des trades', 'Joueurs', 'Part des joueurs'];
    $want = [90, 500, 1000, 5000];
    $cnt = [];
    $who = [];
    foreach ($want as $b) { $cnt[$b] = 0; $who[$b] = []; }
    $src = $orders;
    $preset = (string) ($req['preset'] ?? 'all');
    if ($preset !== 'all') {
      $from = (string) ($req['dateFrom'] ?? '');
      $to = (string) ($req['dateTo'] ?? '');
      $cal = (string) ($req['cal'] ?? '');
      if ($preset === 'date' && $cal !== '') { $from = $cal; $to = $cal; }
      [$a, $b] = admin_day_bounds($preset, $from, $to);
      $src = array_values(array_filter($orders, static fn($o) => admin_in_range((string) ($o['created_at'] ?? ''), $a, $b)));
    }
    $allPlayers = [];
    $totalTrades = 0;
    foreach ($src as $o) {
      if ((string) ($o['mode'] ?? '') !== 'real') continue;
      $pay = (float) ($o['payout'] ?? $o['payoutMult'] ?? 0);
      $pct = 0;
      // Payout de base (90 % ; les anciens trades à 88 % sont comptés avec lui).
      if (abs($pay - 1.9) < 0.03 || abs($pay - 90) < 0.05 || abs($pay - 88) < 0.05) $pct = 90;
      else if (abs($pay - 5.0) < 0.02 || abs($pay - 500) < 0.05) $pct = 500;
      else if (abs($pay - 10.0) < 0.02 || abs($pay - 1000) < 0.05) $pct = 1000;
      else if (abs($pay - 50.0) < 0.02 || abs($pay - 5000) < 0.05) $pct = 5000;
      if ($pct === 0 || !isset($cnt[$pct])) continue;
      $uid = (string) ($o['user_id'] ?? '');
      $cnt[$pct]++;
      $totalTrades++;
      if ($uid !== '') {
        $who[$pct][$uid] = true;
        $allPlayers[$uid] = true;
      }
    }
    $nPlayers = count($allPlayers);
    foreach ($want as $b) {
      $nWho = count($who[$b]);
      $rows[] = [
        'cells' => [
          $b . '%',
          (string) $cnt[$b],
          admin_pct($cnt[$b], $totalTrades),
          (string) $nWho,
          admin_pct($nWho, $nPlayers),
        ],
        'userId' => '',
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $totalTrades, 'page' => 1, 'pages' => 1, 'summary' => $totalTrades . ' trade(s) réel(s) · ' . $nPlayers . ' joueur(s)', 'actions' => false];
  }

  if ($view === 'trade_minutes') {
    $cols = ['Durée', 'Trades réels', 'Part des trades'];
    $want = [5, 10, 30, 60, 300, 600];
    $labels = [5 => '5 s', 10 => '10 s', 30 => '30 s', 60 => '1 min', 300 => '5 min', 600 => '10 min'];
    $cnt = array_fill_keys($want, 0);
    $src = $orders;
    $preset = (string) ($req['preset'] ?? 'all');
    if ($preset !== 'all') {
      $from = (string) ($req['dateFrom'] ?? '');
      $to = (string) ($req['dateTo'] ?? '');
      $cal = (string) ($req['cal'] ?? '');
      if ($preset === 'date' && $cal !== '') { $from = $cal; $to = $cal; }
      [$a, $b] = admin_day_bounds($preset, $from, $to);
      $src = array_values(array_filter($orders, static fn($o) => admin_in_range((string) ($o['created_at'] ?? ''), $a, $b)));
    }
    $total = 0;
    foreach ($src as $o) {
      if ((string) ($o['mode'] ?? '') !== 'real') continue;
      $d = (int) ($o['duration'] ?? 0);
      if (!isset($cnt[$d])) continue;
      $cnt[$d]++;
      $total++;
    }
    foreach ($want as $d) {
      $rows[] = [
        'cells' => [$labels[$d], (string) $cnt[$d], admin_pct($cnt[$d], $total)],
        'userId' => '',
      ];
    }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => 1, 'pages' => 1, 'summary' => $total . ' trade(s) réel(s) ventilé(s) par durée', 'actions' => false];
  }

  if ($view === 'messages') {
    $cols = ['État', 'Date', 'Joueur', 'E-mail', 'Sujet', 'Message'];
    $list = [];
    foreach ((admin_local_db()['support_messages'] ?? []) as $m) {
      if (!is_array($m)) continue;
      $st = strtolower((string) ($m['status'] ?? 'ouvert'));
      $unread = ($st === 'ouvert' || $st === 'unread');
      $u = admin_user_lookup((string) ($m['userId'] ?? ''), $pmap);
      $row = [
        'id' => (string) ($m['id'] ?? ''),
        'userId' => (string) ($m['userId'] ?? ''),
        'email' => (string) ($m['email'] ?? $u['email'] ?? ''),
        'name' => (string) ($u['name'] ?? $m['publicId'] ?? ''),
        'publicId' => (string) ($m['publicId'] ?? $u['publicId'] ?? ''),
        'subject' => (string) ($m['subject'] ?? ''),
        'message' => (string) ($m['message'] ?? ''),
        'status' => $st,
        'createdAt' => (string) ($m['createdAt'] ?? $m['at'] ?? ''),
        'unread' => $unread,
      ];
      $list[] = $row;
    }
    $q = strtolower(trim((string) ($req['q'] ?? '')));
    if ($q !== '') {
      $list = array_values(array_filter($list, static function ($r) use ($q) {
        return admin_match_q($r, $q) || str_contains(strtolower((string) ($r['subject'] ?? '')), $q)
          || str_contains(strtolower((string) ($r['message'] ?? '')), $q);
      }));
    }
    $list = admin_apply_filters($list, $req, 'createdAt');
    usort($list, static function ($a, $b) {
      if (!empty($a['unread']) !== !empty($b['unread'])) return !empty($a['unread']) ? -1 : 1;
      return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
    });
    [$slice, $total, $page, $pages] = admin_page($list, $req);
    foreach ($slice as $m) {
      $body = (string) ($m['message'] ?? '');
      $rows[] = [
        'cells' => [
          !empty($m['unread']) ? 'Non lu' : 'Lu',
          substr((string) $m['createdAt'], 0, 16),
          (string) ($m['publicId'] ?: $m['name'] ?: '—'),
          (string) ($m['email'] ?? ''),
          (string) ($m['subject'] ?? ''),
          $body,
        ],
        'userId' => (string) ($m['userId'] ?? ''),
        'ref' => (string) ($m['id'] ?? ''),
        'kind' => 'message',
        'unread' => !empty($m['unread']),
        'flag' => !empty($m['unread']) ? 'unread' : 'ok',
        'wrap' => 5,
        'subject' => (string) ($m['subject'] ?? ''),
        'email' => (string) ($m['email'] ?? ''),
        'name' => (string) ($m['name'] ?? $m['publicId'] ?? ''),
        'body' => $body,
        'at' => (string) ($m['createdAt'] ?? ''),
      ];
    }
    $actions = true;
    $unreadN = 0;
    foreach ($list as $m) { if (!empty($m['unread'])) $unreadN++; }
    return ['ok' => true, 'cols' => $cols, 'rows' => $rows, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $unreadN . ' non lu(s) · ' . $total . ' message(s)', 'actions' => $actions];
  }

  return ['ok' => false, 'reason' => 'Vue inconnue'];
}

function admin_profile_payload(string $uid): array {
  $pmap = admin_profile_map();
  $vaults = admin_vaults();
  $p = admin_user_lookup($uid, $pmap);
  if (($p['id'] ?? '') === '' || ($p['id'] ?? '') !== $uid) {
    foreach ($pmap as $row) {
      if ((string) $row['id'] === $uid || (string) ($row['publicId'] ?? '') === $uid) {
        $p = $row;
        $uid = (string) $row['id'];
        break;
      }
    }
  }
  $p = admin_enrich_user_row($p, $vaults);
  // Dépôts payés et bonus : deux tableaux séparés, deux totaux séparés.
  $deps = [];
  $bonuses = [];
  $sumDep = 0.0;
  $sumBonus = 0.0;
  $bonusBy = ['defi' => 0.0, 'aff' => 0.0, 'dep' => 0.0, 'adm' => 0.0];
  foreach (admin_deposits() as $d) {
    if ((string) $d['userId'] !== $uid) continue;
    if (admin_dep_is_bonus($d)) {
      if (admin_dep_bonus_paid($d)) {
        $sumBonus += (float) $d['amount'];
        // v2433 — bonus rangés par sorte (Défi du jour, Bonus dépôt, Affiliation, Admin) d'après leur référence.
        $bref = (string) ($d['id'] ?? '');
        $bkind = str_starts_with($bref, 'adm_defi_') ? 'defi' : (str_starts_with($bref, 'adm_bon_') ? 'dep' : (str_starts_with($bref, 'adm_ami_') ? 'aff' : 'adm'));
        $bonusBy[$bkind] += (float) $d['amount'];
      }
      $bonuses[] = ['id' => $d['id'], 'amount' => $d['amount'], 'motif' => (string) ($d['motif'] ?? ''), 'at' => $d['createdAt']];
      continue;
    }
    if (admin_dep_is_paid($d)) $sumDep += (float) $d['amount'];
    $deps[] = [
      'id' => $d['id'],
      'amount' => $d['amount'],
      'status' => $d['status'],
      'paid' => admin_dep_is_paid($d),
      'method' => admin_dep_channel_row($d),
      'at' => $d['createdAt'],
    ];
  }
  $wds = [];
  $sumWdPaid = 0.0;
  $sumWdOpen = 0.0;
  foreach (admin_withdrawals() as $w) {
    if ((string) $w['userId'] !== $uid) continue;
    if (admin_wd_is_silenced($w)) continue;
    if (admin_wd_is_paid($w)) $sumWdPaid += (float) $w['amount'];
    if (admin_wd_is_open($w)) $sumWdOpen += (float) $w['amount'];
    $w = admin_enrich_wd($w, $pmap);
    $wds[] = [
      'id' => $w['id'],
      'amount' => $w['amount'],
      'status' => $w['status'],
      'method' => admin_method_label(admin_fill((string) ($w['operator'] ?? ''))),
      'phone' => admin_phone_cell(['phone' => admin_fill((string) ($w['phone'] ?? '')), 'countryCode' => (string) ($w['countryCode'] ?? '')]),
      'at' => $w['createdAt'],
      'reason' => $w['reason'] ?? '',
    ];
  }
  $games = [];
  $sumNet = 0.0;
  $sumStake = 0.0;
  $nTrades = 0;
  foreach (admin_orders_for_user($uid) as $o) {
    $sumNet += (float) ($o['net'] ?? 0);
    $sumStake += (float) ($o['stake'] ?? 0);
    $nTrades++;
    $games[] = [
      'id' => $o['id'] ?? '',
      'game' => admin_asset_name((string) ($o['asset_id'] ?? '')),
      'stake' => $o['stake'] ?? 0,
      'net' => $o['net'] ?? 0,
      'won' => $o['won'] ?? null,
      'mode' => $o['mode'] ?? '',
      'at' => $o['created_at'] ?? '',
    ];
  }
  return [
    'ok' => true,
    'user' => [
      'id' => $uid,
      'publicId' => (string) ($p['publicId'] ?? ''),
      'name' => (string) ($p['name'] ?? ''),
      'email' => (string) ($p['email'] ?? ''),
      'phone' => admin_phone_cell($p),
      'country' => admin_country_cell($p),
      'ip' => (string) ($p['ip'] ?? '—'),
      'createdAt' => (string) ($p['createdAt'] ?? ''),
      'lastSeen' => (string) ($p['lastSeen'] ?? ''),
      'role' => (string) ($p['role'] ?? 'user'),
      'real' => (float) ($p['real'] ?? 0),
      'traffic' => (string) ($p['traffic'] ?? 'direct'),
    ],
    'totals' => [
      'deposits' => round($sumDep, 2),
      'bonus' => round($sumBonus, 2),
      'bonusBy' => admin_bonus_by($bonusBy, $uid, $p),
      'wdPaid' => round($sumWdPaid, 2),
      'wdOpen' => round($sumWdOpen, 2),
      'stake' => round($sumStake, 2),
      'net' => round($sumNet, 2),
      'trades' => $nTrades,
    ],
    'suspect' => (string) ((admin_suspects()[$uid]['reason'] ?? '') ?: admin_click_reason_for($uid, (string) ($p['email'] ?? ''))),
    'suspectLevel' => (string) (admin_suspects()[$uid]['level'] ?? 'red'),
    'deposits' => $deps,
    'bonuses' => $bonuses,
    'withdrawals' => $wds,
    'games' => array_slice($games, 0, 80),
  ];
}

/** Crédit admin : même caisse que le crypto (incrément), enregistré comme dépôt. Pas d’OxaPay. */
function admin_manual_credit(array &$db, string $uid, float $delta, string $motif, array $hint = []): array {
  $delta = orolado_money($delta);
  if ($uid === '' || $delta <= 0) {
    return ['ok' => false, 'reason' => 'Montant invalide', 'real' => 0.0];
  }
  $uid = trim($uid);
  if (!admin_is_uuid($uid) && $uid !== 'admin_master' && !admin_is_admin_account($uid, $hint)) {
    $retry = admin_resolve_player_uuid($uid, array_merge(['id' => $uid], $hint));
    if (admin_is_uuid($retry)) {
      $uid = $retry;
    } else {
      // Dernier recours : e-mail explicite → profiles Supabase
      $em = strtolower(trim((string) ($hint['email'] ?? '')));
      if ($em !== '' && filter_var($em, FILTER_VALIDATE_EMAIL) && function_exists('supabase_http')) {
        $hdrs = function_exists('supabase_admin_headers') ? supabase_admin_headers() : [];
        $url = function_exists('supabase_project_url') ? rtrim(supabase_project_url(), '/') : '';
        if ($hdrs && $url !== '') {
          $rows = supabase_http($url . '/rest/v1/profiles?email=eq.' . rawurlencode($em) . '&select=id', $hdrs);
          if (is_array($rows) && isset($rows[0]['id']) && admin_is_uuid((string) $rows[0]['id'])) {
            $uid = (string) $rows[0]['id'];
          }
        }
      }
    }
    if (!admin_is_uuid($uid) && $uid !== 'admin_master' && !admin_is_admin_account($uid, $hint)) {
      return ['ok' => false, 'reason' => 'Joueur introuvable (id invalide). Rouvre la fiche puis réessaie.', 'real' => 0.0];
    }
  }
  $opKey = 'adm:' . $uid . ':' . sprintf('%.2f', $delta) . ':' . substr(md5(strtolower(trim($motif))), 0, 10) . ':' . date('YmdHi');
  if (function_exists('orolado_cash_op_get')) {
    $prev = orolado_cash_op_get($opKey);
    if (is_array($prev) && !empty($prev['ok'])) {
      return [
        'ok' => true,
        'real' => orolado_money($prev['real'] ?? 0),
        'delta' => $delta,
        'ref' => (string) ($prev['ref'] ?? ''),
        'duplicate' => true,
      ];
    }
  }
  if (!isset($db['vault'][$uid]) || !is_array($db['vault'][$uid])) {
    $db['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
  }
  $jsonReal = orolado_money($db['vault'][$uid]['real'] ?? 0);
  $got = null;
  $ref = 'adm_' . bin2hex(random_bytes(6));
  if (admin_is_uuid($uid)) {
    admin_ensure_sb_vault($uid, 0);
    // Crédit atomique, une seule fois par référence (même fonction que les gains de trade) :
    // jamais d'écriture « valeur absolue » qui pourrait écraser un trade en cours.
    $got = function_exists('orolado_trade_credit_once') ? orolado_trade_credit_once($uid, $ref, $delta) : null;
    if ($got === null) {
      return ['ok' => false, 'reason' => 'Le crédit n’a pas été enregistré en base. Réessayez.', 'real' => $jsonReal];
    }
  } else {
    $got = orolado_money($jsonReal + $delta);
  }
  $db['vault'][$uid]['real'] = $got;

  $isSelf = ($uid === ($_SESSION['admin_uid'] ?? ''));
  $depRow = [
    'id' => $ref,
    'ref' => $ref,
    'userId' => $uid,
    'amount' => $delta,
    'status' => 'COMPLETED',
    'operator' => 'admin',
    'createdAt' => date('c'),
    'paidAt' => date('c'),
    'note' => $isSelf ? $motif : 'Bonus',
    'motif' => $motif,
    'by' => (string) ($_SESSION['admin_email'] ?? ''),
  ];
  $txRow = [
    'id' => $ref,
    'at' => date('c'),
    'type' => 'deposit',
    'amount' => abs($delta),
    'note' => $isSelf ? $motif : 'Bonus',
    'mode' => 'real',
    'status' => 'COMPLETED',
  ];
  if (function_exists('supabase_insert_deposit') && admin_is_uuid($uid)) {
    supabase_insert_deposit([
      'id' => $ref,
      'user_id' => $uid,
      'amount' => $delta,
      'status' => 'COMPLETED',
      'operator' => 'admin',
      'reference' => $ref,
    ]);
  }
  $hdrs = function_exists('supabase_admin_headers') ? supabase_admin_headers() : [];
  $url = function_exists('supabase_project_url') ? rtrim(supabase_project_url(), '/') : '';
  if ($hdrs && $url !== '' && admin_is_uuid($uid)) {
    $prof = supabase_http(
      $url . '/rest/v1/profiles?id=eq.' . rawurlencode($uid) . '&select=real_deposit_total',
      $hdrs
    );
    $depTot = $delta;
    if (is_array($prof) && isset($prof[0])) {
      $depTot = orolado_money(($prof[0]['real_deposit_total'] ?? 0) + $delta);
    }
    supabase_http(
      $url . '/rest/v1/profiles?id=eq.' . rawurlencode($uid),
      $hdrs,
      json_encode(['real_deposit_total' => $depTot, 'updated_at' => date('c')], JSON_UNESCAPED_UNICODE),
      'PATCH'
    );
  }
  admin_persist_json_real($uid, $got, $txRow, $depRow);
  if (function_exists('orolado_cash_op_put')) {
    orolado_cash_op_put($opKey, ['ok' => true, 'real' => $got, 'ref' => $ref, 'delta' => $delta]);
  }
  return ['ok' => true, 'real' => $got, 'delta' => $delta, 'ref' => $ref];
}

$isAjax = ($_SERVER['REQUEST_METHOD'] === 'POST') && (
  (($_GET['ajax'] ?? '') === '1')
  || str_contains((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')
  || str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json')
);

admin_keep_restore();

if ($isAjax) {
  $raw = file_get_contents('php://input') ?: '';
  $req = json_decode($raw, true);
  if (!is_array($req)) $req = $_POST;
  $action = (string) ($req['action'] ?? '');

  if ($action === 'login') {
    $gate = function_exists('orolado_login_gate') ? orolado_login_gate('admin') : ['ok' => true];
    if (empty($gate['ok'])) {
      admin_json(['ok' => false, 'reason' => (string) ($gate['reason'] ?? 'Trop d’essais')], 429);
    }
    $u = admin_login_check((string) ($req['email'] ?? ''), (string) ($req['password'] ?? ''));
    if (!$u) {
      if (function_exists('orolado_login_fail')) orolado_login_fail('admin');
      admin_alert_push('Connexion', 'Tentative de connexion admin refusée.', 'error');
      admin_json(['ok' => false, 'reason' => 'Identifiants incorrects'], 403);
    }
    if (function_exists('orolado_login_ok')) orolado_login_ok('admin');
    // Nouvel identifiant de session à chaque connexion (un identifiant « planté » d'avance ne sert à rien).
    session_regenerate_id(true);
    $_SESSION['admin_uid'] = (string) $u['id'];
    $_SESSION['admin_email'] = (string) $u['email'];
    admin_keep_issue((string) $u['id']);
    admin_json(['ok' => true]);
  }
  if ($action === 'logout') {
    admin_keep_drop();
    $_SESSION = [];
    session_destroy();
    admin_json(['ok' => true]);
  }

  $me = admin_require();
  if ($action === 'online_now') {
    admin_json(['ok' => true, 'online' => admin_online_now()]);
  }
  if ($action === 'badges') {
    admin_json(['ok' => true, 'badges' => admin_badges(), 'board' => admin_board_watch()]);
  }
  if ($action === 'board_ack') {
    admin_json(admin_board_ack((string) ($req['fp'] ?? '')));
  }
  if ($action === 'health_ack') {
    admin_json(admin_health_ack((string) ($req['fp'] ?? '')));
  }
  if ($action === 'list') {
    $view = (string) ($req['view'] ?? 'signup_date');
    if ($view === 'online' || $view === 'messages' || $view === 'alerts' || $view === 'watch') {
      admin_json(admin_list_payload($view, $req));
    }
    $ck = 'list_e2_' . preg_replace('/[^a-z0-9_]+/i', '', $view) . '_' . md5(json_encode([
      $req['q'] ?? '', $req['preset'] ?? '', $req['cal'] ?? '',
      $req['dateFrom'] ?? '', $req['dateTo'] ?? '', $req['idFrom'] ?? '', $req['page'] ?? 1,
    ]));
    $cached = admin_cache_get($ck, 10);
    if (is_array($cached) && !empty($cached['ok'])) admin_json($cached);
    $out = admin_list_payload($view, $req);
    if (!empty($out['ok'])) admin_cache_set($ck, $out);
    admin_json($out);
  }
  if ($action === 'profile') {
    admin_json(admin_profile_payload((string) ($req['userId'] ?? '')));
  }
  if ($action === 'adjust') {
    $uid = (string) ($req['userId'] ?? '');
    $delta = (float) ($req['delta'] ?? 0);
    $motif = trim((string) ($req['motif'] ?? ''));
    if ($motif === '') $motif = 'Crédit admin';
    if ($uid === '' || abs($delta) < 0.0001) {
      admin_json(['ok' => false, 'reason' => 'Montant obligatoire']);
    }
    $db = admin_local_db();
    $hint = [
      'id' => $uid,
      'email' => strtolower(trim((string) ($req['email'] ?? ''))),
      'publicId' => strtoupper(trim((string) ($req['publicId'] ?? ''))),
    ];
    $found = admin_user_lookup($uid, admin_profile_map());
    if ((string) ($found['email'] ?? '') === '' && $hint['email'] !== '') $found['email'] = $hint['email'];
    if ((string) ($found['publicId'] ?? '') === '' && $hint['publicId'] !== '') $found['publicId'] = $hint['publicId'];
    if ((string) ($found['id'] ?? '') !== '') $uid = (string) $found['id'];
    $resolved = admin_resolve_player_uuid($uid, $found);
    if (admin_is_uuid($resolved)) $uid = $resolved;
    $targets = admin_credit_target_ids($uid, $found);
    if (!$targets) {
      admin_json(['ok' => false, 'reason' => 'Joueur introuvable (id invalide). Rouvre la fiche puis réessaie.']);
    }
    // UNE CAISSE : un seul id (UUID), jamais une boucle multi-cibles.
    $targets = [$targets[0]];
    // Si la cible n’est pas un UUID, dernière passe e-mail / publicId.
    if (!admin_is_uuid((string) $targets[0]) && (string) $targets[0] !== 'admin_master') {
      $retry = admin_resolve_player_uuid((string) $targets[0], $found + $hint);
      if (admin_is_uuid($retry)) $targets = [$retry];
    }
    // Anti-doublon : un même crédit/débit (même joueur, même montant, même motif) ne passe qu'une
    // fois en 2 minutes, même si le bouton est touché 2 fois ou si 4 demandes arrivent ensemble.
    // Création de fichier « x » = atomique : une seule demande gagne. (Avant : fenêtre à la minute
    // pile, franchie à 20h39 → 20h40, et pas de blocage des demandes simultanées.)
    $claimF = '';
    if (function_exists('orolado_cash_ops_dir')) {
      $claimF = orolado_cash_ops_dir() . DIRECTORY_SEPARATOR . hash('sha256', 'admclaim:' . $targets[0] . ':' . sprintf('%.2f', $delta) . ':' . strtolower($motif)) . '.lock';
      if (is_file($claimF) && (time() - (int) @filemtime($claimF)) >= 120) @unlink($claimF);
      $h = @fopen($claimF, 'x');
      if ($h === false) {
        admin_json(['ok' => false, 'reason' => 'Ce même montant vient déjà d’être envoyé à ce joueur (il y a moins de 2 minutes). Vérifiez son solde avant de recommencer.']);
      }
      fclose($h);
    }
    $ok = false;
    $lastReal = 0.0;
    $reason = 'Échec';
    foreach ($targets as $tid) {
      if ($delta > 0) {
        $res = admin_manual_credit($db, $tid, $delta, $motif, $found + $hint);
      } else if (admin_is_uuid($tid) && function_exists('orolado_ledger_apply')) {
        $res = orolado_ledger_apply($db, $tid, $delta, $motif, false);
      } else {
        $cur = orolado_money($db['vault'][$tid]['real'] ?? 0);
        if ($cur + $delta < -0.009) {
          $res = ['ok' => false, 'reason' => 'Solde insuffisant', 'real' => $cur];
        } else {
          $res = ['ok' => true, 'real' => orolado_money(max(0, $cur + $delta)), 'delta' => $delta];
        }
      }
      if (!empty($res['ok'])) {
        $ok = true;
        $lastReal = orolado_money($res['real'] ?? 0);
        if ($delta < 0) {
          admin_persist_json_real($tid, $lastReal, [
            'id' => 'adm_' . bin2hex(random_bytes(4)),
            'at' => date('c'),
            'type' => 'debit',
            'amount' => abs($delta),
            'note' => $motif,
            'mode' => 'real',
            'status' => 'COMPLETED',
          ]);
        }
        break;
      } else {
        $reason = (string) ($res['reason'] ?? $reason);
      }
    }
    if (!$ok) {
      if ($claimF !== '') @unlink($claimF);
      admin_json(['ok' => false, 'reason' => $reason]);
    }
    admin_persist_admin_log(
      (string) ($me['email'] ?? ''),
      (string) ($found['publicId'] ?? $uid),
      $delta >= 0 ? 'credit' : 'debit',
      $delta,
      $motif
    );
    admin_bust_cache();
    admin_json(['ok' => true, 'real' => $lastReal]);
  }
  if ($action === 'suspend') {
    $uid = (string) ($req['userId'] ?? '');
    if ($uid === '') admin_json(['ok' => false, 'reason' => 'Joueur manquant']);
    $db = admin_local_db();
    orolado_force_suspend($db, $uid, 'suspended', strtolower(trim((string) ($req['email'] ?? ''))));
    save_db(orolado_data_file(), $db);
    admin_bust_cache();
    admin_json(['ok' => true]);
  }
  if ($action === 'delete_user') {
    admin_json(['ok' => false, 'reason' => 'La suppression de compte est désactivée. Utilisez Suspendre.']);
  }
  if ($action === 'resolve_wd') {
    $id = (string) ($req['id'] ?? '');
    $act = strtolower((string) ($req['act'] ?? ''));
    $motif = trim((string) ($req['motif'] ?? ''));
    if ($id === '' || !in_array($act, ['approve', 'reject', 'silent', 'suspend'], true)) {
      admin_json(['ok' => false, 'reason' => 'Action invalide']);
    }
    $db = admin_local_db();
    $found = admin_find_wd_row($id);
    $uid = $found ? (string) ($found['userId'] ?? '') : '';
    $amt = $found ? abs((float) ($found['amount'] ?? 0)) : 0;
    $row = $found ?: [
      'id' => $id,
      'userId' => $uid,
      'amount' => $amt,
      'status' => 'pending',
      'at' => date('c'),
    ];
    foreach (($db['withdrawals'] ?? []) as $local) {
      if (!is_array($local)) continue;
      if ((string) ($local['id'] ?? '') === $id || (string) ($local['reference'] ?? '') === $id) {
        $row = array_merge($row, $local);
        if ($uid === '') $uid = (string) ($local['userId'] ?? '');
        break;
      }
    }
    $row['id'] = $id;
    if ($uid !== '') $row['userId'] = $uid;
    if ($amt > 0) $row['amount'] = $amt;
    if ($motif !== '') $row['reason'] = $motif;

    if ($act === 'approve') {
      if (!empty($row['offsite']) || !admin_wd_has_local($db, $id)) {
        admin_json(['ok' => false, 'reason' => 'Retrait créé hors du site : aucun argent n’a été débité. Ne le payez pas.']);
      }
      $row['status'] = 'approved';
      $row['approvedAt'] = date('c'); // v2655 : date de paiement (liste « Retraits validés »)
      $row['playerHidden'] = false;
      $row['adminHidden'] = false;
    } else if ($act === 'reject') {
      // Un retrait déjà validé (donc payé) ne peut plus être « refusé » : ça rembourserait le joueur une 2e fois.
      if (in_array(strtolower((string) ($row['status'] ?? '')), ['approved', 'paid', 'completed'], true)) {
        admin_json(['ok' => false, 'reason' => 'Ce retrait est déjà validé : il ne peut plus être refusé.']);
      }
      orolado_refund_wd_once($db, $row);
      if (empty($row['refunded'])) {
        admin_json(['ok' => false, 'reason' => 'Remboursement non passé (base injoignable). Réessayez dans un instant.']);
      }
      $row['status'] = 'rejected';
      $row['adminHidden'] = false;
    } else if ($act === 'silent') {
      $row['status'] = 'silenced';
      $row['adminHidden'] = true;
      $row['playerHidden'] = true;
    } else {
      $row['status'] = 'review';
      $row['suspect'] = true;
      if ($uid !== '') orolado_force_suspend($db, $uid, 'suspended');
    }

    admin_upsert_local_wd($db, $row);
    $hdrs = supabase_admin_headers();
    if ($hdrs && $act !== 'suspend') {
      $st = $act === 'approve' ? 'approved' : ($act === 'silent' ? 'silenced' : 'rejected');
      $patch = ['status' => $st];
      admin_sb_req('/rest/v1/withdrawals?id=eq.' . rawurlencode($id), [], 'PATCH', json_encode($patch));
      admin_sb_req('/rest/v1/withdrawals?reference=eq.' . rawurlencode($id), [], 'PATCH', json_encode($patch));
      $txNote = $act === 'silent' ? 'silenced' : $st;
      admin_sb_req('/rest/v1/transactions?id=eq.' . rawurlencode($id), [], 'PATCH', json_encode(['note' => $txNote]));
    }
    save_db(orolado_data_file(), $db);
    admin_bust_cache();
    admin_json(['ok' => true, 'refunded' => !empty($row['refunded']), 'status' => $row['status'] ?? '']);
  }
  if ($action === 'mark_msg') {
    $id = (string) ($req['id'] ?? '');
    $db = admin_local_db();
    foreach (($db['support_messages'] ?? []) as $i => $m) {
      if ((string) ($m['id'] ?? '') !== $id) continue;
      $db['support_messages'][$i]['status'] = 'resolu';
      $db['support_messages'][$i]['readAt'] = date('c');
      break;
    }
    save_db(orolado_data_file(), $db);
    admin_json(['ok' => true]);
  }
  if ($action === 'resolve_dep') {
    $ref = (string) ($req['id'] ?? '');
    $act = strtolower((string) ($req['act'] ?? ''));
    if ($ref === '') admin_json(['ok' => false, 'reason' => 'Référence manquante']);
    if ($act === 'approve') {
      $res = credit_paid_deposit(['ref' => $ref, 'paid' => true, 'manual' => true, 'creditReceived' => true]);
      admin_bust_cache();
      admin_json(['ok' => !empty($res['ok']) || !empty($res['duplicate']), 'detail' => $res]);
    }
    $db = admin_local_db();
    foreach (($db['deposits'] ?? []) as $i => $d) {
      if ((string) ($d['id'] ?? '') === $ref || (string) ($d['ref'] ?? '') === $ref) {
        $db['deposits'][$i]['status'] = 'CANCELED';
        save_db(orolado_data_file(), $db);
        break;
      }
    }
    $hdrs = supabase_admin_headers();
    if ($hdrs) {
      admin_sb_req('/rest/v1/deposits?id=eq.' . rawurlencode($ref), $hdrs, 'PATCH', json_encode(['status' => 'CANCELED']));
    }
    admin_bust_cache();
    admin_json(['ok' => true]);
  }
  // Bouton « Nettoyer » : 1) aperçu (rien n'est touché), 2) suppression définitive confirmée.
  if ($action === 'wipe_plan') {
    admin_json(orolado_wipe_plan(!empty($req['keepGmail'])));
  }
  if ($action === 'wipe_run') {
    $only = isset($req['only']) && is_array($req['only']) ? array_map('strval', $req['only']) : null;
    $res = orolado_wipe_run(!empty($req['keepGmail']), (string) ($req['confirm'] ?? ''), $only);
    admin_bust_cache();
    if (!empty($res['ok'])) admin_persist_admin_log((string) ($me['email'] ?? ''), 'TOUS', 'nettoyage', 0, 'Nettoyage : ' . (int) ($res['deletedAccounts'] ?? 0) . ' compte(s) supprimé(s)');
    admin_json($res);
  }
  // v2676 — « Live » : conversations avec les joueurs + Actualités (fichiers à part, data/live/).
  // v2690 — CASINO (statistiques) et PARIS SPORTIFS (créer un match, fermer, donner le résultat → paiement).
  if (str_starts_with($action, 'sp_') || $action === 'cs_stats' || $action === 'cs_limits_save' || $action === 'cs_players' || $action === 'cs_player') {
    require_once __DIR__ . '/casino_lib.php';
    require_once __DIR__ . '/sports_lib.php';
    if ($action === 'cs_stats') {
      $st = casino_with(casino_dir() . DIRECTORY_SEPARATOR . 'stats.json', static fn(array &$s) => $s) ?: [];
      admin_json(['ok' => true, 'all' => $st['all'] ?? [], 'today' => $st[gmdate('Y-m-d')] ?? [], 'limits' => casino_limits(), 'max' => CASINO_MAX_STAKE, 'games' => CASINO_GAMES]);
    }
    // v2698 — joueurs du casino : liste (nom, e-mail, ID public) et détail d'un joueur (parties + paris sportifs)
    if ($action === 'cs_players' || $action === 'cs_player') {
      $ldb = admin_local_db();
      $who = static function (string $uid) use ($ldb): array {
        $u = (array) ($ldb['users'][$uid] ?? []);
        return ['name' => (string) ($u['displayName'] ?? $u['name'] ?? ''), 'email' => (string) ($u['email'] ?? ''), 'publicId' => (string) ($u['publicId'] ?? '')];
      };
      if ($action === 'cs_players') {
        $list = array_map(static fn($r) => $r + $who($r['uid']), casino_admin_players(60));
        admin_json(['ok' => true, 'players' => $list]);
      }
      $q = strtolower(trim((string) ($req['q'] ?? '')));
      $uid = '';
      foreach ((array) ($ldb['users'] ?? []) as $id => $u) {
        if ($q !== '' && ($q === strtolower((string) $id) || $q === strtolower((string) ($u['email'] ?? '')) || $q === strtolower((string) ($u['publicId'] ?? '')))) { $uid = (string) $id; break; }
      }
      if ($uid === '') admin_json(['ok' => false, 'reason' => 'Joueur introuvable (e-mail ou ID OR…)']);
      admin_json(['ok' => true, 'uid' => $uid] + $who($uid) + casino_admin_player($uid) + ['bets' => sp_my_bets($uid)]);
    }
    // v2698 — mise maximale jeu par jeu (vide = mise maximale normale)
    if ($action === 'cs_limits_save') {
      $res = casino_save_limits((array) ($req['limits'] ?? []));
      admin_persist_admin_log((string) ($me['email'] ?? ''), 'TOUS', 'casino', 0, 'Mises maximales du casino : ' . json_encode($res['limits']));
      admin_json($res);
    }
    if ($action === 'sp_list') admin_json(['ok' => true, 'events' => sp_admin_list()]);
    if ($action === 'sp_save') admin_json(sp_admin_save((array) ($req['ev'] ?? [])));
    if ($action === 'sp_close') admin_json(sp_admin_close((string) ($req['id'] ?? '')));
    if ($action === 'sp_settle') admin_json(sp_admin_settle(admin_local_db(), (string) ($req['id'] ?? ''), (string) ($req['k'] ?? '')));
    admin_json(['ok' => false, 'reason' => 'Action inconnue']);
  }

  if (str_starts_with($action, 'live_')) {
    require_once __DIR__ . '/live_lib.php';
    $imgOut = static fn(array $m): array => array_merge(
      ['id' => (string) ($m['id'] ?? ''), 'f' => (string) ($m['f'] ?? 'u'), 't' => (string) ($m['t'] ?? ''), 'at' => (int) ($m['at'] ?? 0)],
      !empty($m['img']) ? ['img' => 'admin.php?live_img=' . rawurlencode((string) $m['img'])] : []
    );
    if ($action === 'live_threads') admin_json(['ok' => true, 'threads' => live_threads(), 'unread' => live_unread_admin()]);
    if ($action === 'live_thread') {
      $uid = live_safe_id((string) ($req['uid'] ?? ''));
      $th = live_thread($uid);
      live_mark_read($uid, 'a');
      admin_json(['ok' => true, 'uid' => $uid, 'name' => (string) ($th['name'] ?? ''), 'publicId' => (string) ($th['publicId'] ?? ''), 'email' => (string) ($th['email'] ?? ''),
        'msgs' => array_map($imgOut, array_slice((array) ($th['msgs'] ?? []), -120))]);
    }
    if ($action === 'live_reply') {
      $uid = live_safe_id((string) ($req['uid'] ?? ''));
      $text = live_clean_text((string) ($req['text'] ?? ''));
      $img = (string) ($req['img'] ?? '') !== '' ? live_save_image((string) $req['img'], 'img') : '';
      if ($uid === '' || ($text === '' && $img === '') || !is_file(live_thread_file($uid))) admin_json(['ok' => false, 'reason' => 'Message vide ou joueur introuvable.']);
      $r = live_add_msg(['id' => $uid], 'a', $text, $img);
      // Notification sur le téléphone du joueur (s'il a accepté les notifications).
      $rows = [];
      foreach (push_sub_files() as $pf) { $row = json_decode((string) @file_get_contents($pf), true); if (is_array($row) && (string) ($row['uid'] ?? '') === $uid) $rows[] = $row; }
      $sent = $rows ? push_send_rows($rows, push_payload('💬 OROLADO Live', $text !== '' ? $text : '📷 Photo', '/?live=1')) : ['sent' => 0];
      admin_json(['ok' => !empty($r['ok']), 'msg' => !empty($r['msg']) ? $imgOut($r['msg']) : null, 'pushed' => (int) ($sent['sent'] ?? 0)]);
    }
    if ($action === 'live_posts') {
      admin_json(['ok' => true, 'posts' => array_map(static fn($p) => array_merge($p, !empty($p['img']) ? ['img' => 'live.php?p=' . rawurlencode((string) $p['img'])] : []), live_posts())]);
    }
    if ($action === 'live_post') {
      $text = live_clean_text((string) ($req['text'] ?? ''));
      $img = (string) ($req['img'] ?? '') !== '' ? live_save_image((string) $req['img'], 'pub') : '';
      if ($text === '' && $img === '') admin_json(['ok' => false, 'reason' => 'Écrivez un texte ou ajoutez une photo.']);
      $r = live_add_post($text, $img, trim((string) ($req['link'] ?? '')));
      admin_json(['ok' => !empty($r['ok'])]);
    }
    if ($action === 'live_post_del') admin_json(['ok' => live_del_post((string) ($req['id'] ?? ''))]);
    // v2680 — signalements entre joueurs (avec les derniers messages de la conversation).
    if ($action === 'live_reports') {
      $name = static fn(string $u): string => (string) ((live_who_uid($u)['id'] ?? '') . ' ' . (live_who_uid($u)['name'] ?? $u));
      admin_json(['ok' => true, 'reports' => array_map(static fn($r) => [
        'id' => (string) $r['id'], 'by' => $name((string) $r['by']), 'who' => $name((string) $r['who']), 'whoUid' => (string) $r['who'],
        'why' => (string) ($r['why'] ?? ''), 'at' => (int) ($r['at'] ?? 0),
        'snap' => array_map(static fn($m) => ['f' => ((string) ($m['f'] ?? '') === (string) $r['who']) ? 'signalé' : 'signaleur', 't' => (string) ($m['t'] ?? '') !== '' ? (string) $m['t'] : '📷 Photo'], (array) ($r['snap'] ?? [])),
      ], array_slice(live_reports(), 0, 100))]);
    }
    admin_json(['ok' => false, 'reason' => 'Action inconnue']);
  }
  // v2664 (propriétaire) — E-mail à tous : français pour les pays francophones, anglais pour les autres.
  // Envoi par paquets de 40 (Brevo), sans doublon (journal par envoi), test sur l'e-mail de l'admin d'abord.
  if ($action === 'mail_stats') {
    $g = admin_mail_groups();
    admin_json(['ok' => true, 'fr' => count($g['fr']), 'en' => count($g['en'])]);
  }
  if ($action === 'mail_send') {
    $subject = trim((string) ($req['subject'] ?? ''));
    $msg = trim((string) ($req['message'] ?? ''));
    $btn = trim((string) ($req['button'] ?? ''));
    $target = (string) ($req['target'] ?? 'test') === 'all' ? 'all' : 'test';
    $group = in_array((string) ($req['group'] ?? ''), ['fr', 'en'], true) ? (string) $req['group'] : 'fr';
    // v2667 — même message (groupe + objet + texte + bouton) = même journal : si l'admin quitte la page
    // ou retouche « Envoyer à tous », l'envoi REPREND là où il s'était arrêté, jamais de doublon.
    $id = preg_match('/^[a-z0-9]{6,24}$/', (string) ($req['id'] ?? '')) ? (string) $req['id'] : 'm' . substr(sha1($group . "\n" . $subject . "\n" . $msg . "\n" . $btn), 0, 16);
    if ($subject === '' || $msg === '' || mb_strlen($subject) > 120 || mb_strlen($msg) > 2000) {
      admin_json(['ok' => false, 'reason' => 'Objet (120 lettres max) et message (2000 max) obligatoires.']);
    }
    if ($btn === '') $btn = $group === 'fr' ? 'Ouvrir OROLADO' : 'Open OROLADO';
    if ($target === 'all' && (string) ($req['confirm'] ?? '') !== 'ENVOYER') admin_json(['ok' => false, 'reason' => 'Confirmation manquante.']);
    @set_time_limit(55);
    if ($target === 'test') {
      // v2665 — adresse du test choisie par l'admin (son vrai e-mail), sinon celle du compte admin.
      $to = strtolower(trim((string) ($req['testTo'] ?? '')));
      if ($to === '') $to = strtolower(trim((string) ($me['email'] ?? '')));
      if (!filter_var($to, FILTER_VALIDATE_EMAIL)) admin_json(['ok' => false, 'reason' => 'Adresse du test incorrecte.']);
      admin_mail_groups(); // charge les prénoms (si l'adresse du test est celle d'un joueur)
      $r = admin_mail_plain($to, $subject, $msg);
      admin_json(['ok' => !empty($r['ok']), 'id' => $id, 'sent' => !empty($r['ok']) ? 1 : 0, 'fail' => empty($r['ok']) ? 1 : 0, 'more' => false, 'reason' => (string) ($r['reason'] ?? '')]);
    }
    $list = admin_mail_groups()[$group];
    $logF = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'mail_' . $id . '.json';
    $done = is_file($logF) ? (json_decode((string) @file_get_contents($logF), true) ?: []) : [];
    // 1 = reçu ; sinon heure de l'échec (réessayé au prochain « Envoyer à tous », pas dans la même minute).
    $skip = static fn($v): bool => $v === 1 || (is_int($v) && $v > time() - 120);
    $already = count(array_filter($done, static fn($v): bool => $v === 1));
    // Le paquet en cours se termine même si l'admin quitte la page, et chaque e-mail est noté aussitôt.
    @ignore_user_abort(true);
    $sent = 0; $fail = 0; $n = 0; $err = '';
    foreach ($list as $em) {
      if (isset($done[$em]) && $skip($done[$em])) continue;
      // v2668/v2670 — envoi LENT, pas à pas (pause variable de 5 à 8 s, 5 par paquet) : ressemble moins à une campagne.
      if ($n >= 5) break;
      if ($n > 0) sleep(random_int(5, 8));
      $n++;
      $r = admin_mail_plain($em, $subject, $msg);
      $done[$em] = !empty($r['ok']) ? 1 : time();
      if (!empty($r['ok'])) $sent++; else { $fail++; $err = (string) ($r['reason'] ?? ''); }
      @file_put_contents($logF, json_encode($done), LOCK_EX);
    }
    @file_put_contents($logF, json_encode($done), LOCK_EX);
    $left = count(array_filter($list, static fn($em): bool => !isset($done[$em]) || !$skip($done[$em])));
    admin_json(['ok' => true, 'id' => $id, 'sent' => $sent, 'fail' => $fail, 'err' => $err, 'already' => $already, 'more' => $left > 0 && $n > 0, 'left' => $left, 'total' => count($list)]);
  }
  // v2607 — Notifications : chiffres, abonnement test de l'appareil admin, envoi par paquets.
  if ($action === 'push_stats') {
    $v = push_vapid();
    admin_json(['ok' => true, 'stats' => push_stats(), 'journal' => push_log_list(), 'key' => (string) ($v['pub'] ?? '')]);
  }
  if ($action === 'push_test_sub') {
    $ok = push_save_sub(is_array($req['sub'] ?? null) ? $req['sub'] : [], [
      'plat' => (string) ($req['plat'] ?? 'pc'), 'app' => !empty($req['app']), 'lang' => 'fr',
      'uid' => (string) ($me['id'] ?? ''), 'test' => 1,
    ]);
    admin_json(['ok' => $ok, 'reason' => $ok ? '' : 'Abonnement refusé par le serveur']);
  }
  if ($action === 'push_send') {
    $title = trim((string) ($req['title'] ?? ''));
    $body = trim((string) ($req['body'] ?? ''));
    $target = (string) ($req['target'] ?? 'test') === 'all' ? 'all' : 'test';
    $lang = preg_match('/^[a-z]{2}$/', (string) ($req['lang'] ?? '')) ? (string) $req['lang'] : '';
    $id = preg_match('/^[a-z0-9]{6,20}$/', (string) ($req['id'] ?? '')) ? (string) $req['id'] : '';
    $after = preg_match('/^[a-f0-9]{40}$/', (string) ($req['after'] ?? '')) ? (string) $req['after'] : '';
    if ($title === '' || push_len($title) > 80 || push_len($body) > 240) {
      admin_json(['ok' => false, 'reason' => 'Titre obligatoire (80 lettres max), message 240 lettres max.']);
    }
    if ($target === 'all' && (string) ($req['confirm'] ?? '') !== 'ENVOYER') {
      admin_json(['ok' => false, 'reason' => 'Confirmation manquante.']);
    }
    if (!function_exists('openssl_pkey_derive') || !function_exists('curl_multi_init')) {
      admin_json(['ok' => false, 'reason' => 'Le serveur ne peut pas envoyer (module openssl / curl absent).']);
    }
    @set_time_limit(50);
    $payload = push_payload($title, $body, '/');
    $rows = [];
    $last = $after;
    $more = false;
    foreach (push_sub_files() as $f) {
      $name = basename($f, '.json');
      if ($after !== '' && strcmp($name, $after) <= 0) continue;
      if (count($rows) >= 100) { $more = true; break; }
      $last = $name;
      $r = json_decode((string) @file_get_contents($f), true);
      if (!is_array($r)) continue;
      if ($target === 'test' && empty($r['test'])) continue;
      if ($lang !== '' && (string) ($r['lang'] ?? '') !== $lang) continue;
      $rows[] = $r;
    }
    $res = push_send_rows($rows, $payload);
    if ($id === '') $id = date('ymdHis') . substr(bin2hex(random_bytes(2)), 0, 3);
    $prev = [];
    foreach (push_log_list() as $l) if (($l['id'] ?? '') === $id) { $prev = $l; break; }
    push_log_add([
      'id' => $id, 'at' => (string) ($prev['at'] ?? date('c')), 'title' => $title, 'body' => $body,
      'target' => $target, 'lang' => $lang, 'by' => (string) ($me['email'] ?? ''),
      'sent' => (int) ($prev['sent'] ?? 0) + $res['sent'], 'gone' => (int) ($prev['gone'] ?? 0) + $res['gone'],
      'fail' => (int) ($prev['fail'] ?? 0) + $res['fail'], 'done' => !$more,
      'err' => (string) ($res['err'] ?? ($prev['err'] ?? '')),
    ]);
    admin_json(['ok' => true, 'id' => $id, 'more' => $more, 'after' => $last, 'res' => $res]);
  }
  admin_json(['ok' => false, 'reason' => 'Action inconnue'], 400);
}

$logged = admin_me() !== null;
$ADMIN_TABS = [
  'gA' => [
    ['signup_today', 'Inscriptions du Jour'],
    ['signup_yesterday', 'Inscriptions d’Hier'],
    ['signup_google', 'Inscrits par Google'],
    ['signup_email', 'Inscrits par E-mail'],
    ['signup_date', 'Inscriptions par Date'],
    ['signup_hour', 'Inscriptions par Heure'],
    ['signup_geo', 'Inscriptions par Pays / IP'],
    ['visits', 'Visites du Site'],
    ['no_deposit', 'Joueurs Sans Dépôt'],
    ['signup_closed', 'Comptes suspendus / supprimés'],
  ],
  'gB' => [
    ['dep_today', 'Dépôts du Jour'],
    ['dep_pending', 'Dépôts en Attente'],
    ['dep_failed', 'Dépôts Échoués'],
    ['dep_top', 'Meilleurs Déposants'],
    ['dep_all', 'Historique Global Dépôts'],
    ['dep_method', 'Dépôts par Méthode'],
    ['dep_bonus', 'Bonus Offerts'],
  ],
  'gC' => [
    ['wd_pending', 'Retraits en Cours'],
    ['wd_today', 'Retraits Validés du Jour'],
    ['wd_all', 'Historique Global Retraits'],
    ['wd_rejected', 'Retraits Rejetés'],
    ['wd_volume', 'Volume Total à Payer'],
    ['wd_suspect', 'Suspects à vérifier'],
  ],
  'gD' => [
    ['online', 'Joueurs en Ligne'],
    ['payers', 'Joueurs Actifs (Payeurs)'],
    ['top_balances', 'Top Balances / Soldes'],
    ['top_winners', 'Top Gagnants du Jour'],
    ['profit_today', 'Bénéfice du Jour'],
    ['profit_7d', 'Bénéfice 7 Jours'],
    ['profit_total', 'Bénéfice Total'],
    ['open_positions', 'Positions Ouvertes'],
    ['payout_stats', 'Payout Classement'],
    ['games', 'Statistiques des Jeux'],
    ['trade_minutes', 'Temps de jeu'],
    ['inactive', 'Joueurs Inactifs'],
  ],
  'gE' => [
    ['traffic', 'Sources de Trafic'],
    ['otp_mails', 'Mails & Codes OTP Envoyés'],
    ['messages', 'Messages'],
    ['alerts', 'Santé du Site'],
    ['watch', 'À surveiller'],
  ],
  'gF' => [
    ['gift_aff', 'Invitation : Affiliés'],
    ['gift_friends', 'Invitation : Amis invités'],
    ['gift_top', 'Tournoi démo : cette semaine'],
    ['gift_top_prev', 'Tournoi démo : semaine dernière'],
    ['gift_bon', 'Bonus dépôt'],
    ['gift_defi', 'Défi du jour'],
  ],
];
$inscritsHead = $logged ? admin_inscrits_count() : 0;
?><!DOCTYPE html>
<html lang="fr">
<head>
  <!-- v2601 : fond sombre dès la 1re image (plus d'écran blanc à l'ouverture de l'admin dans son onglet). -->
  <meta name="color-scheme" content="dark"><style>html{background:#0A0F1D}</style>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>OROLADO · Dashboard Admin</title>
  <style>
    :root{--gold:#F59E0B;--muted:#94A3B8;--bg:#0A0F1D;--card:#121A2B;--line:rgba(255,255,255,.08);--text:#E8EEF9;--red:#F43F5E;--green:#34D399}
    *{box-sizing:border-box} body{margin:0;font-family:Inter,Segoe UI,system-ui,sans-serif;background:linear-gradient(165deg,#0A0F1D,#121A2B);color:var(--text);min-height:100vh}
    .online-bar{padding:10px 16px 2px}
    .online-box{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;padding:14px 18px;min-height:64px;border-radius:14px;border:1px solid rgba(34,197,94,.55);background:rgba(34,197,94,.12);color:#4ADE80;vertical-align:middle;max-width:100%}
    .online-box b{font-size:clamp(1.6rem,6vw,2.4rem);line-height:1;font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}
    .online-box small{font-size:.8rem;color:#86EFAC;text-transform:uppercase;letter-spacing:.04em}
    .online-box .dot{width:12px;height:12px;flex:none;border-radius:50%;background:#22C55E;box-shadow:0 0 8px #22C55E;opacity:.35}
    .online-box.live .dot{opacity:1;animation:onlinePulse 1.6s ease-in-out infinite}
    @keyframes onlinePulse{50%{opacity:.35}}
    .head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line)}
    .head h1{font-size:.95rem;color:var(--gold);margin:0}
    .wrap{padding:14px 12px 40px;max-width:1280px;margin:0 auto}
    .sec{font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:16px 0 8px}
    .metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    @media(min-width:700px){.metrics{grid-template-columns:repeat(3,1fr)}}
    @media(min-width:1100px){.metrics{grid-template-columns:repeat(4,1fr)}}
    .metric-btn{display:block;width:100%;text-align:left;border:1px solid var(--line);background:rgba(10,15,29,.88);color:inherit;font:inherit;border-radius:12px;padding:10px;cursor:pointer}
    .metric-btn:hover{border-color:rgba(245,158,11,.45)}
    .metric-btn.on{border-color:var(--gold);box-shadow:0 0 0 1px rgba(245,158,11,.25)}
    .metric-btn .k{font-size:.62rem;color:var(--muted);text-transform:uppercase;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:8px}
    .badge{display:inline-flex;min-width:22px;justify-content:center;background:linear-gradient(90deg,#F59E0B,#FBBF24);color:#0B0E14;font-size:.68rem;font-weight:900;border-radius:999px;padding:2px 7px}
    .badge.red{background:#F43F5E;color:#fff}
    .badge.zero{background:rgba(255,255,255,.08);color:var(--muted)}
    .badge.orange{background:#F97316;color:#fff}
    .health-bar.warn{background:linear-gradient(135deg,#C2410C,#F97316);color:#fff}
    .totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}
    .totals div{background:#0E1420;border:1px solid var(--line);border-radius:10px;padding:8px 10px}
    .totals b{display:block;font-size:.95rem;color:var(--text)}
    .totals span{font-size:.62rem;color:var(--muted);text-transform:uppercase;font-weight:800}
    .sus-box{background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.45);color:#FECDD3;border-radius:10px;padding:8px 10px;margin:8px 0;font-weight:700}
    .filters{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0;align-items:end}
    .filters input,.filters select{min-height:38px;border-radius:10px;border:1px solid var(--line);background:#0E1420;color:var(--text);padding:6px 10px;font:inherit}
    .filters input[type=search]{flex:1;min-width:180px}
    .panel-title{color:var(--gold);font-size:.8rem;margin:8px 0}
    .table-wrap{overflow:auto;max-height:62vh;border:1px solid var(--line);border-radius:10px}
    table{width:100%;border-collapse:collapse;font-size:.72rem}
    th,td{padding:8px 6px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
    td.wrap{white-space:normal;max-width:440px;line-height:1.4;word-break:break-word}
    th{color:var(--muted);font-size:.62rem;text-transform:uppercase;position:sticky;top:0;background:#121A2B}
    tr.clickable{cursor:pointer} tr.clickable:hover{background:rgba(245,158,11,.08)}
    tr.flag-suspect td:nth-last-child(4), .pill-suspect{color:#FCA5A5;font-weight:800}
    .pill{display:inline-block;border-radius:999px;padding:2px 8px;font-weight:800;font-size:.68rem}
    .pill-ok{background:rgba(52,211,153,.18);color:#34D399}
    .pill-suspect{background:rgba(244,63,94,.18);color:#F43F5E}
    .sus-why{margin-top:6px;max-width:260px;white-space:normal;font-size:12px;line-height:1.35;color:#FCA5A5;font-weight:600}
    .pill-unread{background:rgba(245,158,11,.2);color:#FBBF24}
    .pill-warn{background:rgba(245,158,11,.2);color:#FBBF24}
    /* v2672 — alerte ORANGE « À suivre » (couleur OROLADO) */
    .pill-watch{background:rgba(245,165,36,.18);color:#F5A524;font-weight:800}
    .sus-why.watch{color:#F5C46B}
    .sus-box.watch{background:rgba(245,165,36,.12);border-color:rgba(245,165,36,.5);color:#FDE3B0}
    .msg-full{white-space:pre-wrap;line-height:1.5;background:#0E1420;border:1px solid var(--line);border-radius:10px;padding:12px;margin-top:10px;max-height:50vh;overflow:auto}
    .mini{border:1px solid var(--line);background:#1A2230;color:var(--text);border-radius:6px;padding:4px 8px;font:inherit;font-weight:800;cursor:pointer;margin-right:4px;margin-bottom:3px}
    .mini.ok{border-color:var(--green);color:var(--green)} .mini.bad{border-color:var(--red);color:var(--red)}
    .login{max-width:360px;margin:12vh auto;background:rgba(10,15,29,.92);border:1px solid rgba(245,158,11,.35);border-radius:16px;padding:24px}
    .login h2{color:var(--gold);margin:0 0 16px;font-size:1.05rem}
    .login input{width:100%;min-height:42px;margin:0 0 10px;border-radius:10px;border:1px solid var(--line);background:#0E1420;color:var(--text);padding:8px 10px;font:inherit}
    .btn-gold{width:100%;min-height:44px;border:0;border-radius:12px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#B45309,#F59E0B,#FBBF24);color:#0B0E14}
    .err{color:#FDA4AF;font-size:.8rem;min-height:1.2em}
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.78);display:none;z-index:50;padding:16px;overflow:auto}
    .modal.on{display:block}
    .modal-box{max-width:720px;margin:4vh auto;background:#121A2B;border:1px solid rgba(245,158,11,.35);border-radius:16px;padding:18px}
    .muted{color:var(--muted);font-size:.78rem}
    .pager{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:.75rem}
    .health-bar{display:block;width:100%;margin:10px 0 0;min-height:52px;border:0;border-radius:14px;font:inherit;font-size:.92rem;font-weight:900;letter-spacing:.02em;cursor:pointer;padding:14px 16px;text-align:center}
    .health-bar.ok{background:linear-gradient(135deg,#059669,#34D399);color:#06281d;box-shadow:0 0 0 1px rgba(52,211,153,.35)}
    .health-bar.bad{background:linear-gradient(135deg,#BE123C,#F43F5E);color:#fff;box-shadow:0 0 0 1px rgba(244,63,94,.4)}
    .health-bar:hover{filter:brightness(1.06)}
    .sum-bar{display:block;width:100%;margin:10px 0 0;min-height:52px;border-radius:14px;font-size:.92rem;font-weight:900;letter-spacing:.02em;padding:14px 16px;text-align:center;box-sizing:border-box}
    .sum-bar b{font-size:1.08rem;margin-left:4px}
    .sum-bar.dep{background:linear-gradient(135deg,#059669,#34D399);color:#06281d}
    .sum-bar.wd{background:linear-gradient(135deg,#C2410C,#F97316);color:#fff}
    .health-ack{display:none;width:100%;margin:8px 0 0;min-height:44px;border:1px solid rgba(52,211,153,.45);border-radius:12px;background:rgba(52,211,153,.12);color:#34D399;font:inherit;font-weight:800;cursor:pointer}
    .health-ack.on{display:block}
    .health-panel{display:none;margin-top:8px;border:1px solid var(--line);border-radius:12px;background:#0E1420;padding:12px;font-size:.8rem;line-height:1.45}
    .health-panel.on{display:block}
    .health-panel p{margin:0 0 8px;color:var(--muted)}
    .health-panel li{margin:0 0 8px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
    .health-panel .mini{margin:0;flex-shrink:0}
    /* v2713 (propriétaire) : admin rangé — menu du haut en grille droite, grands boutons, chaque bouton ouvre SA page (« ← Menu »), grands tableaux */
    .head{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
    .head h1{font-size:1.15rem!important;text-align:center}
    .head > div{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    @media (min-width:760px){.head > div{grid-template-columns:repeat(6,minmax(0,1fr))}}
    .head > div > .mini{width:100%;min-height:48px;margin:0!important;font-size:.92rem;font-weight:800;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:6px}
    #btnBack{grid-column:1/-1}
    @media (min-width:760px){.head > div{grid-template-columns:repeat(7,minmax(0,1fr))}#btnBack{grid-column:auto}}
    #inscritsHead{grid-column:1/-1;text-align:center;font-size:.95rem;font-weight:800;color:var(--text)}
    .metric-btn{padding:14px 12px!important;min-height:58px}
    .metric-btn .k{font-size:.74rem!important;line-height:1.25}
    .metric-btn .badge{font-size:.9rem;min-width:34px;text-align:center}
    .adm-back{display:none;position:sticky;top:0;z-index:30;width:100%;margin:0 0 10px;min-height:50px;border:1px solid var(--gold);border-radius:12px;background:#0E1420;color:var(--gold);font:inherit;font-size:1rem;font-weight:900;cursor:pointer}
    body.adm-page .adm-back{display:block}
    body.adm-page .online-bar,body.adm-page .wrap > .sec,body.adm-page .wrap > .metrics,body.adm-page .sum-bar,body.adm-page .health-bar,body.adm-page .health-panel{display:none!important}
    body.adm-page .panel-title{font-size:1.25rem;font-weight:900}
    body:not(.adm-page) .wrap > .filters,body:not(.adm-page) #viewTitle,body:not(.adm-page) #viewSum,body:not(.adm-page) #panel,body:not(.adm-page) #pager{display:none!important}
    .table-wrap table{font-size:14px}
    .table-wrap td,.table-wrap th{padding:10px 8px!important}
  </style>
</head>
<body>
<?php if (!$logged): ?>
  <form class="login" id="loginForm">
    <h2>Dashboard administrateur</h2>
    <input type="email" name="email" placeholder="E-mail admin" required autocomplete="username">
    <input type="password" name="password" placeholder="Mot de passe" required autocomplete="current-password">
    <p class="err" id="loginErr"></p>
    <button class="btn-gold" type="submit">Entrer</button>
  </form>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(e.target);
      const r = await fetch('admin.php?ajax=1', {method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'}, body: JSON.stringify({action:'login', email: fd.get('email'), password: fd.get('password')})});
      const j = await r.json();
      if (!j.ok) { document.getElementById('loginErr').textContent = j.reason || 'Accès refusé'; return; }
      location.reload();
    });
  </script>
<?php else: ?>
  <header class="head">
    <h1>Super Admin Dashboard</h1>
    <div>
      <span class="muted" id="inscritsHead">Inscrits (total) : <?php echo (int) $inscritsHead; ?></span>
      <button class="mini" id="btnNotif" type="button" style="border-color:#F59E0B;color:#FCD34D">🔔 Notifications</button>
      <button class="mini" id="btnMail" type="button" style="border-color:#60A5FA;color:#93C5FD">✉️ E-mail à tous</button>
      <button class="mini" id="btnLiveA" type="button" style="border-color:#F43F6E;color:#FF7AA8">📡 Live <b id="lvBadge" style="background:#F43F6E;color:#fff;border-radius:9px;padding:0 6px"></b></button>
      <button class="mini" id="btnCasA" type="button" style="border-color:#1FD86B;color:#5CF59A">🎰 Casino &amp; Paris</button>
      <button class="mini" id="btnTopG" type="button" style="border-color:#FACC15;color:#FDE68A">🏆 Jeux les plus joués</button>
      <button class="mini bad" id="btnWipe" type="button">Nettoyer</button>
      <button class="mini" id="btnBack" type="button">Retour</button>
    </div>
  </header>
  <div class="online-bar"><div class="online-box" title="Personnes sur le site en ce moment (inscrites ou non, hors appareil admin)"><i class="dot"></i><b id="onlineNow">…</b><small>personnes connectées en direct sur le site</small></div></div>
  <div class="wrap">
    <div class="sec">A · Inscriptions &amp; suivi pubs</div>
    <div class="metrics" id="gA"><?php foreach ($ADMIN_TABS['gA'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <div class="sec">B · Dépôts &amp; entrées d’argent</div>
    <div class="metrics" id="gB"><?php foreach ($ADMIN_TABS['gB'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <div class="sum-bar dep" id="sumDepBar">Total de tous les dépôts : <b id="sumDepVal">—</b></div>
    <div class="sec">C · Retraits &amp; sorties d’argent</div>
    <div class="metrics" id="gC"><?php foreach ($ADMIN_TABS['gC'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <div class="sum-bar wd" id="sumWdBar">Total des retraits validés : <b id="sumWdVal">—</b></div>
    <div class="sec">D · Joueurs, soldes &amp; jeux</div>
    <div class="metrics" id="gD"><?php foreach ($ADMIN_TABS['gD'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <div class="sec">E · Trafic, mails &amp; alertes</div>
    <div class="metrics" id="gE"><?php foreach ($ADMIN_TABS['gE'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <div class="sec">F · Cadeaux (Invitation, Tournoi, Bonus, Défi)</div>
    <div class="metrics" id="gF"><?php foreach ($ADMIN_TABS['gF'] as $t) { echo '<button type="button" class="metric-btn" data-view="'.admin_esc($t[0]).'"><div class="k">'.admin_esc($t[1]).' <span class="badge zero" data-badge="'.admin_esc($t[0]).'">—</span></div></button>'; } ?></div>
    <button type="button" class="health-bar ok" id="btnHealthBar">Tous les boutons suivent</button>
    <div class="health-panel" id="healthPanel"></div>

    <button type="button" class="adm-back" id="admBack">← Menu</button>
    <div class="filters">
      <input id="q" type="search" placeholder="Rechercher ID, e-mail, téléphone">
      <select id="preset">
        <option value="all">Toutes dates</option>
        <option value="today">Aujourd’hui</option>
        <option value="yesterday">Hier</option>
        <option value="range">Plage personnalisée</option>
        <option value="date">Date unique</option>
      </select>
      <input id="cal" type="date" title="Date unique" style="display:none">
      <input id="dateFrom" type="date" title="Du" style="display:none">
      <input id="dateTo" type="date" title="Au" style="display:none">
      <input id="idFrom" placeholder="12 ou 12-40" style="display:none;width:160px">
    </div>
    <div class="panel-title" id="viewTitle">Inscrits</div>
    <p class="muted" id="viewSum"></p>
    <div class="table-wrap" id="panel"><p class="muted" style="padding:12px">Choisissez un bouton…</p></div>
    <div class="pager" id="pager"></div>
  </div>

  <div class="modal" id="wipeModal">
    <div class="modal-box">
      <button class="mini" type="button" id="closeWipe">Fermer</button>
      <h2 style="color:var(--red);margin:10px 0 4px">Nettoyer : suppression définitive</h2>
      <p class="muted">Les comptes supprimés et toutes leurs données (soldes, dépôts, retraits, trades, historiques, messages) sont effacés pour de bon, dans la base et sur le serveur. Rien ne reviendra. Le compte admin est toujours gardé.</p>
      <p><label><input type="checkbox" id="wipeKeepGmail" checked> Ne pas cocher d’office les comptes <strong>@gmail.com</strong></label></p>
      <p><button class="mini" type="button" id="btnWipePlan">1. Afficher les comptes</button></p>
      <div id="wipeTools" style="display:none;margin:8px 0">
        <input id="wipeSearch" type="search" placeholder="Rechercher : e-mail, nom, ORO-…" style="min-height:38px;width:100%;max-width:420px;border-radius:10px;border:1px solid var(--line);background:#0E1420;color:var(--text);padding:6px 10px;font:inherit">
        <div style="margin-top:8px">
          <button class="mini" type="button" id="btnWipeAll">Tout cocher</button>
          <button class="mini" type="button" id="btnWipeNone">Tout décocher</button>
          <span class="muted" id="wipeCount"></span>
        </div>
      </div>
      <div id="wipePlan"></div>
      <div id="wipeConfirmBox" style="display:none;margin-top:12px">
        <p>2. Pour confirmer, tapez <strong>SUPPRIMER</strong> :</p>
        <input id="wipeConfirm" autocomplete="off" style="min-height:38px;border-radius:10px;border:1px solid var(--line);background:#0E1420;color:var(--text);padding:6px 10px;font:inherit">
        <button class="mini bad" type="button" id="btnWipeRun" style="margin-left:6px">Supprimer définitivement</button>
      </div>
      <p class="muted" id="wipeStatus"></p>
    </div>
  </div>

  <div class="modal" id="mailModal">
    <div class="modal-box">
      <button class="mini" type="button" id="closeMail">Fermer</button>
      <h2 style="color:#93C5FD;margin:10px 0 4px">✉️ E-mail à tous les joueurs</h2>
      <p class="muted" id="mlWho" style="margin:6px 0">Chargement…</p>
      <div class="nt-card">
        <label class="nt-lab">Envoyer à</label>
        <select id="mlGroup" class="nt-in"><option value="fr">Pays francophones (message en français)</option><option value="en">Autres pays (message en anglais)</option></select>
        <label class="nt-lab">Objet</label>
        <input id="mlSubject" maxlength="120" class="nt-in" placeholder="Ex. : Volatility est en mouvement sur OROLADO">
        <label class="nt-lab">Message</label>
        <textarea id="mlBody" maxlength="2000" rows="8" class="nt-in" placeholder="Bonjour {prenom},&#10;&#10;Les marchés bougent bien aujourd'hui. Passe faire quelques trades : orolado.com&#10;&#10;À bientôt,&#10;L'équipe OROLADO"></textarea>
        <p class="muted" style="margin:4px 0 0">E-mail simple, comme écrit à la main (meilleure chance d'arriver dans « Principale »). Écrivez <b>{prenom}</b> : il est remplacé par le prénom du joueur. Mettez <b>orolado.com</b> dans le texte. Envoi lent : environ 1 e-mail toutes les 5 à 8 secondes (laissez la page ouverte).</p>
        <input id="mlBtn" type="hidden" value="">
        <label class="nt-lab">Envoyer le test à (votre vraie adresse e-mail)</label>
        <input id="mlTestTo" type="email" maxlength="120" class="nt-in" placeholder="exemple@gmail.com" autocomplete="email">
        <p style="margin-top:12px">
          <button class="mini ok" type="button" id="btnMlTest">1. M’envoyer un test</button>
          <button class="mini bad" type="button" id="btnMlAll">2. Envoyer à tous</button>
        </p>
        <p class="muted" id="mlSt"></p>
      </div>
    </div>
  </div>
  <div class="modal" id="liveModal">
    <div class="modal-box lvA-box">
      <button class="mini" type="button" id="closeLiveA">Fermer</button>
      <h2 style="color:#FF7AA8;margin:10px 0 4px">📡 Live — messages des joueurs et actualités</h2>
      <div class="lvA-tabs"><button class="mini ok" type="button" id="lvTabMsg">💬 Conversations <b id="lvUnread"></b></button><button class="mini" type="button" id="lvTabPost">📢 Publier une actualité</button><button class="mini" type="button" id="lvTabRep">🚩 Signalements</button></div>
      <div id="lvPaneRep" hidden><div class="nt-card"><b>Joueurs signalés par d'autres joueurs</b><p class="muted" style="margin:4px 0 8px">Celui qui signale bloque aussitôt l'autre. Regardez les messages ; en cas d'arnaque, suspendez le compte depuis sa fiche.</p><div id="lvReps">Chargement…</div></div></div>
      <div id="lvPaneMsg">
        <div class="lvA-grid">
          <div class="lvA-list" id="lvList"><p class="muted">Chargement…</p></div>
          <div class="lvA-conv">
            <div class="lvA-head" id="lvHead">Choisissez une conversation</div>
            <div class="lvA-msgs" id="lvMsgs"></div>
            <div class="lvA-send">
              <label class="mini lvA-cam" title="Photo">📷<input type="file" id="lvImg" accept="image/*" hidden></label>
              <textarea id="lvText" rows="2" maxlength="1000" class="nt-in" placeholder="Votre réponse…"></textarea>
              <button class="mini ok" type="button" id="lvSend">Envoyer</button>
            </div>
            <p class="muted" id="lvSt" style="margin:4px 0 0"></p>
          </div>
        </div>
      </div>
      <div id="lvPanePost" hidden>
        <div class="nt-card">
          <label class="nt-lab">Texte de l'actualité (vu par tous, même sans compte)</label>
          <textarea id="lvPostText" rows="4" maxlength="1000" class="nt-in" placeholder="Ex. : 🔥 Wave est disponible ! Recharge en 1 toucher."></textarea>
          <label class="nt-lab">Photo (facultatif)</label>
          <input type="file" id="lvPostImg" accept="image/*" class="nt-in">
          <label class="nt-lab">Lien vidéo YouTube / TikTok (facultatif, commence par https://)</label>
          <input id="lvPostLink" maxlength="300" class="nt-in" placeholder="https://…">
          <p style="margin-top:10px"><button class="mini ok" type="button" id="lvPostBtn">📢 Publier</button> <span class="muted" id="lvPostSt"></span></p>
          <p class="muted" style="margin:4px 0 0">Astuce : pour prévenir tout le monde, envoyez ensuite une notification (bouton 🔔 Notifications).</p>
        </div>
        <div class="nt-card"><b>Publications</b><div id="lvPosts" style="margin-top:8px"></div></div>
      </div>
    </div>
  </div>
  <style>
    .lvA-box{max-width:980px!important;width:96vw}
    .lvA-tabs{display:flex;gap:8px;margin:8px 0}
    .lvA-tabs b{background:#F43F6E;color:#fff;border-radius:9px;padding:0 6px;font-size:.75rem}
    .lvA-tabs b:empty{display:none}
    .lvA-grid{display:grid;grid-template-columns:280px 1fr;gap:10px;min-height:60vh}
    @media (max-width:760px){.lvA-grid{grid-template-columns:1fr}.lvA-list{max-height:30vh}}
    .lvA-list{border:1px solid var(--line);border-radius:12px;overflow:auto;max-height:68vh;background:#0E1420}
    .lvA-it{padding:9px 10px;border-bottom:1px solid var(--line);cursor:pointer}
    .lvA-it:hover,.lvA-it.on{background:#1A2234}
    .lvA-it b{display:block;font-size:.85rem}.lvA-it small{color:var(--muted);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lvA-it.unread b::after{content:" ●";color:#F43F6E}
    .lvA-conv{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px;background:#0E1420;min-height:60vh}
    .lvA-head{padding:9px 12px;border-bottom:1px solid var(--line);font-weight:700}
    .lvA-msgs{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:6px;max-height:52vh}
    .lvA-m{max-width:78%;padding:7px 10px;border-radius:12px;font-size:.88rem;white-space:pre-wrap;word-break:break-word}
    .lvA-m.u{align-self:flex-start;background:#1E293B}
    .lvA-m.a{align-self:flex-end;background:linear-gradient(145deg,#F43F6E,#C8174C);color:#fff}
    .lvA-m img{display:block;max-width:220px;border-radius:9px;margin-bottom:4px;cursor:zoom-in}
    .lvA-m small{display:block;opacity:.6;font-size:.68rem;margin-top:3px}
    .lvA-send{display:flex;gap:6px;align-items:flex-end;padding:8px;border-top:1px solid var(--line)}
    .lvA-cam{cursor:pointer;font-size:1.1rem}
    .lvA-post{border-bottom:1px solid var(--line);padding:8px 0;font-size:.86rem;white-space:pre-wrap}
    .lvA-post img{max-width:200px;border-radius:9px;display:block;margin:4px 0}
  </style>
  <!-- v2690 — CASINO & PARIS : gérer les matchs (cotes, fermer, résultat → paiement) et voir le bénéfice de la maison -->
  <div class="modal" id="casModal">
    <div class="modal-box lvA-box">
      <button class="mini" type="button" id="closeCasA">Fermer</button>
      <h2 style="color:#5CF59A;margin:10px 0 4px">🎰 Casino &amp; Paris sportifs</h2>
      <div class="lvA-tabs"><button class="mini ok" type="button" id="csTabSp">⚽ Paris sportifs</button><button class="mini" type="button" id="csTabSt">📊 Casino : gains / pertes</button></div>
      <div id="csPaneSp">
        <div class="nt-card">
          <b>Créer un match ou un ÉVÉNEMENT</b>
          <p class="muted" style="margin:4px 0 8px">Vous écrivez la question (match, élection, Bitcoin, boxe…), la date de fin des paris et VOS cotes (serrées = la maison gagne). Exemple : « Le Bitcoin sera-t-il au-dessus de 100 000 $ demain à 18 h ? » → Oui 1,60 / Non 2,20. Tout est mélangé chez les joueurs. Quand c'est fini : cliquez le résultat → les gagnants sont payés tout de suite.<br>🛡️ Logos automatiques : écrivez « Équipe A - Équipe B » avec le nom COMPLET (ex. « Los Angeles Lakers - Boston Celtics », « Barcelona - Real Madrid ») ; si le logo n'est pas trouvé, une pastille avec la lettre s'affiche.</p>
          <div style="display:grid;gap:6px">
            <input id="spTitle" placeholder="Match (ex. Real Madrid – FC Barcelone) ou question (ex. Qui gagnera l'élection ?)" maxlength="80">
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <select id="spSport"><option value="foot">⚽ Football</option><option value="basket">🏀 Basket</option><option value="boxe">🥊 Boxe</option><option value="tennis">🎾 Tennis</option><option value="mma">🥋 MMA</option><option value="event">📅 Événement</option><option value="crypto">₿ Crypto (Bitcoin…)</option><option value="politique">🗳️ Politique / élections</option><option value="autre">🏆 Autre</option></select>
              <input id="spLeague" placeholder="Compétition (ex. Liga)" maxlength="40" style="flex:1">
              <input id="spStart" type="datetime-local">
            </div>
            <div id="spOpts"></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
              <button class="mini" type="button" id="spAddOpt">+ un choix</button>
              <label class="muted">Mise max par coupon ($) <input id="spMax" type="number" value="50" min="1" max="1000" style="width:80px"></label>
              <button class="mini ok" type="button" id="spSave">Publier le match</button>
              <span id="spSt" class="muted"></span>
            </div>
          </div>
        </div>
        <div id="spList" style="margin-top:10px"><p class="muted">Chargement…</p></div>
      </div>
      <div id="csPaneSt" hidden><div id="csStats"><p class="muted">Chargement…</p></div></div>
    </div>
  </div>
  <div class="modal" id="notifModal">
    <div class="modal-box">
      <button class="mini" type="button" id="closeNotif">Fermer</button>
      <h2 style="color:#FCD34D;margin:10px 0 4px">🔔 Notifications sur les téléphones</h2>
      <div class="nt-stats" id="ntStats">Chargement…</div>
      <div class="nt-card">
        <b>Cet appareil (pour vos tests)</b>
        <p class="muted" style="margin:4px 0 8px">iPhone : ouvrez l’admin depuis l’application OROLADO installée sur l’écran d’accueil (pas dans Safari).</p>
        <button class="mini ok" type="button" id="btnNtDevice">Activer les notifications sur cet appareil</button>
        <span class="muted" id="ntDeviceSt"></span>
      </div>
      <div class="nt-card">
        <b>Nouveau message</b>
        <label class="nt-lab">Titre <small id="ntTitleN">0/80</small></label>
        <input id="ntTitle" maxlength="80" class="nt-in" placeholder="Ex. : VOLATILITY est en vogue 🔥">
        <label class="nt-lab">Message <small id="ntBodyN">0/240</small></label>
        <textarea id="ntBody" maxlength="240" rows="3" class="nt-in" placeholder="Ex. : Le marché bouge fort en ce moment. Venez trader !"></textarea>
        <label class="nt-lab">Envoyer aux joueurs qui ont le site en</label>
        <select id="ntLang" class="nt-in">
          <option value="">Toutes les langues</option>
          <option value="fr">Français</option><option value="en">Anglais</option><option value="es">Espagnol</option>
          <option value="pt">Portugais</option><option value="ar">Arabe</option><option value="tr">Turc</option>
          <option value="vi">Vietnamien</option><option value="id">Indonésien</option><option value="ru">Russe</option>
          <option value="de">Allemand</option><option value="hi">Hindi</option>
        </select>
        <div class="nt-lab">Aperçu sur le téléphone</div>
        <div class="nt-prev"><img src="/icons/icon-192.png?v=2656" alt=""><div><small>OROLADO · maintenant</small><b id="ntPrevT">Titre</b><span id="ntPrevB">Message</span></div></div>
        <p class="nt-who" id="ntWho"></p>
        <p style="margin-top:12px">
          <button class="mini ok" type="button" id="btnNtTest">1. Envoyer un test (mes appareils)</button>
          <button class="mini bad" type="button" id="btnNtAll">2. Envoyer à tous les abonnés</button>
        </p>
        <p class="muted" id="ntSt"></p>
      </div>
      <div class="nt-card"><b>Derniers envois</b><div id="ntLog" class="muted" style="margin-top:6px">—</div></div>
    </div>
  </div>
  <style>
    .nt-stats{margin:8px 0 10px;font-size:.85rem;line-height:1.6}
    .nt-stats b{color:#FCD34D}
    .nt-card{border:1px solid var(--line);border-radius:12px;background:#0E1420;padding:12px;margin:10px 0}
    .nt-lab{display:flex;justify-content:space-between;margin:10px 0 4px;font-size:.8rem;color:var(--muted)}
    .nt-in{width:100%;box-sizing:border-box;min-height:38px;border-radius:10px;border:1px solid var(--line);background:#0B111C;color:var(--text);padding:8px 10px;font:inherit}
    .nt-prev{display:flex;gap:10px;align-items:flex-start;max-width:380px;background:#F3F4F6;color:#111827;border-radius:16px;padding:10px 12px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
    .nt-prev img{width:38px;height:38px;border-radius:9px;flex-shrink:0}
    .nt-prev div{display:flex;flex-direction:column;min-width:0}
    .nt-prev small{font-size:.7rem;color:#6B7280}
    .nt-prev b{font-size:.9rem;margin:1px 0}
    .nt-prev span{font-size:.85rem;color:#374151;white-space:pre-wrap;word-break:break-word}
    .nt-who{margin:12px 0 0;font-size:.85rem;color:#FCD34D;font-weight:800}
    .nt-log td,.nt-log th{padding:4px 6px;border-bottom:1px solid var(--line);font-size:.78rem;text-align:left;vertical-align:top}
  </style>

  <div class="modal" id="userModal">
    <div class="modal-box">
      <button class="mini" type="button" id="closeModal">Fermer</button>
      <div id="userDetail"></div>
    </div>
  </div>

<script>
const TABS = <?php $jsTabs = []; foreach ($ADMIN_TABS as $g => $ts) { foreach ($ts as $t) $jsTabs[] = ['g' => $g, 'id' => $t[0], 'k' => $t[1]]; } echo json_encode($jsTabs, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG); ?>;
let view = 'wd_pending';
let page = 1;
const TITLES = Object.fromEntries(TABS.map(t => [t.id, t.k]));

function ajax(body) {
  return fetch('admin.php?ajax=1', {
    method: 'POST',
    headers: {'Accept':'application/json','Content-Type':'application/json'},
    body: JSON.stringify(body)
  }).then(r => r.json());
}
const URGENT = {wd_pending:1, dep_pending:1, wd_suspect:1, messages:1};
let alertsErr = 0;
function badgeClass(id, n) {
  if (id === 'alerts') return n > 0 ? (alertsErr > 0 ? 'badge red' : 'badge orange') : 'badge zero';
  if (id === 'watch') return n > 0 ? 'badge orange' : 'badge zero';
  if (URGENT[id]) return n > 0 ? 'badge red' : 'badge zero';
  return n ? 'badge' : 'badge zero';
}
const MONEY_BADGE = {wd_volume:1, profit_today:1, profit_7d:1, profit_total:1};
function fmtBadge(id, n) {
  if (MONEY_BADGE[id]) {
    const v = Number(n)||0;
    return '$ ' + v.toLocaleString('fr-FR', {maximumFractionDigits:2});
  }
  return String(n ?? 0);
}
function renderButtons(badges) {
  document.querySelectorAll('.metric-btn[data-view]').forEach(btn => {
    const id = btn.getAttribute('data-view');
    const n = badges[id];
    const el = btn.querySelector('[data-badge]');
    if (el && n != null) {
      el.className = badgeClass(id, n);
      el.textContent = fmtBadge(id, n);
    }
    btn.classList.toggle('on', view === id);
  });
}
document.querySelectorAll('.metric-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => { view = btn.getAttribute('data-view'); page = 1; loadList(); admOpenPage(btn); });
});
// v2713 : chaque bouton ouvre SA page (le menu se cache, « ← Menu » pour revenir à l'endroit exact)
let admFrom = null;
function admOpenPage(btn) { admFrom = btn; document.body.classList.add('adm-page'); window.scrollTo(0, 0); }
document.getElementById('btnTopG').addEventListener('click', () => { document.getElementById('btnCasA').click(); setTimeout(() => { const t = document.getElementById('csTabSt'); if (t) t.click(); }, 60); });
document.getElementById('admBack').addEventListener('click', () => {
  document.body.classList.remove('adm-page');
  if (admFrom) admFrom.scrollIntoView({block: 'center'});
});
function filters() {
  const preset = document.getElementById('preset').value;
  document.getElementById('cal').style.display = (preset === 'date' || view === 'signup_date') ? '' : 'none';
  document.getElementById('dateFrom').style.display = preset === 'range' ? '' : 'none';
  document.getElementById('dateTo').style.display = preset === 'range' ? '' : 'none';
  const idr = view === 'signup_idrange';
  document.getElementById('idFrom').style.display = idr ? '' : 'none';
  return {
    q: document.getElementById('q').value,
    preset: preset,
    cal: document.getElementById('cal').value,
    dateFrom: document.getElementById('dateFrom').value,
    dateTo: document.getElementById('dateTo').value,
    idFrom: document.getElementById('idFrom').value,
    page
  };
}
let listCache = {};
let listReq = 0;
function bustList() { listCache = {}; }
function fdate(s) { if (!s) return '—'; const d = new Date(s); return isNaN(d) ? String(s) : d.toLocaleString('fr-FR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}); }
function money(n) { return '$ ' + (Number(n)||0).toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2}); }
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function paintHealth(h) {
  const bar = document.getElementById('btnHealthBar');
  const pan = document.getElementById('healthPanel');
  if (!bar || !h) return;
  const issues = h.issues || [];
  const bad = issues.length > 0;
  window._boardIssues = issues;
  bar.className = 'health-bar ' + (bad ? 'bad' : 'ok');
  bar.textContent = bad ? (issues.length + ' bouton(s) ne suivent plus — cliquer pour voir') : 'Tous les boutons suivent';
  if (pan && !bad) { pan.classList.remove('on'); pan.innerHTML = ''; }
}
function showBoardPanel() {
  const pan = document.getElementById('healthPanel');
  if (!pan) return;
  const issues = window._boardIssues || [];
  if (!issues.length) {
    pan.className = 'health-panel on';
    pan.innerHTML = '<p>Tous les boutons du tableau suivent normalement.</p>';
    return;
  }
  const names = {};
  TABS.forEach(t => { names[t.id] = t.k; });
  pan.className = 'health-panel on';
  pan.innerHTML = '<p>Chaque bouton a son C’est réglé :</p><ul>' +
    issues.map(i => '<li><span><strong>'+esc(names[i.id] || i.label || i.id)+'</strong> — '+esc(i.message||'')+'</span>'+
      (i.fp ? ' <button class="mini ok" type="button" data-board-fp="'+esc(i.fp)+'">C’est réglé</button>' : '')+
      '</li>').join('') +
    '</ul>';
  pan.querySelectorAll('[data-board-fp]').forEach(btn => btn.addEventListener('click', async ev => {
    ev.stopPropagation();
    const r = await ajax({action:'board_ack', fp: btn.getAttribute('data-board-fp')});
    if (!r.ok) { alert(r.reason || 'Échec'); return; }
    paintHealth(r);
    showBoardPanel();
    loadBadges();
  }));
}
try { localStorage.setItem('oro_admin_dev', '1'); } catch (e) { /* ignore */ }
async function loadOnline() {
  try {
    const j = await ajax({action:'online_now'});
    if (j && j.ok) {
      const n = Number(j.online || 0);
      document.getElementById('onlineNow').textContent = n.toLocaleString('fr-FR');
      document.querySelector('.online-box').classList.toggle('live', n > 0);
    }
  } catch (e) { /* ignore */ }
}
if (document.getElementById('onlineNow')) { loadOnline(); setInterval(loadOnline, 10000); }
async function loadBadges() {
  const j = await ajax({action:'badges'});
  if (!j.ok) return;
  const bd = j.badges || {};
  alertsErr = Number(bd.alerts_err || 0);
  renderButtons(bd);
  const sfmt = v => Number(v || 0).toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' $';
  const sd = document.getElementById('sumDepVal'), sw = document.getElementById('sumWdVal');
  if (sd && bd.sum_dep_all != null) sd.textContent = sfmt(bd.sum_dep_all);
  if (sw && bd.sum_wd_paid != null) sw.textContent = sfmt(bd.sum_wd_paid);
  paintHealth(j.board);
  document.getElementById('inscritsHead').textContent = (j.badges.inscrits||0) + ' inscrits (total)';
}
function renderList(j) {
  const panel = document.getElementById('panel');
  if (!j.ok) { panel.innerHTML = '<p class="muted" style="padding:12px">'+esc(j.reason||'Erreur')+'</p>'; return; }
  document.getElementById('viewSum').textContent = j.summary || '';
  let html = '<table><thead><tr>'+(j.cols||[]).map(c=>'<th>'+esc(c)+'</th>').join('');
  if (j.actions) html += '<th></th>';
  html += '</tr></thead><tbody>';
  (j.rows||[]).forEach((r, i) => {
    const flag = r.flag || (r.suspect ? 'suspect' : '');
    const clickable = r.userId || r.kind === 'message';
    html += '<tr class="'+(clickable?'clickable':'')+(flag==='suspect'?' flag-suspect':'')+'" data-uid="'+esc(r.userId||'')+'" data-row="'+i+'">';
    (r.cells||[]).forEach((c, ci) => {
      if ((view === 'alerts' || view === 'watch') && ci === 0) {
        html += '<td>';
        if (r.canAck && r.fp) html += '<button class="mini ok" data-act="healthack" data-fp="'+esc(r.fp)+'">C’est réglé</button>';
        html += '</td>';
        return;
      }
      const s = String(c ?? '');
      const wrap = r.wrap === ci || r.kind === 'message' && ci === 5;
      if (s === 'Suspect' || s === 'Ne pas payer') html += '<td><span class="pill pill-suspect">🔴 '+s+'</span>'+(r.why ? '<div class="sus-why">'+esc(r.why)+'</div>' : '')+'</td>';
      else if (s === 'À suivre') html += '<td><span class="pill pill-watch">🟠 À suivre</span>'+(r.why ? '<div class="sus-why watch">'+esc(r.why)+'</div>' : '')+'</td>';
      else if (s === 'Vérifié' || s === 'OK' || s === 'Réglé') html += '<td><span class="pill pill-ok">'+s+'</span></td>';
      else if (s === 'Attention') html += '<td><span class="pill pill-warn">Attention</span></td>';
      else if (s === 'Panne') html += '<td><span class="pill pill-suspect">Panne</span></td>';
      else if (s === 'Non lu') html += '<td><span class="pill pill-unread">Non lu</span></td>';
      else html += '<td'+(wrap?' class="wrap"':'')+'>'+esc(s)+'</td>';
    });
    if (j.actions) {
      html += '<td>';
      if (r.pending && r.kind === 'withdraw') {
        html += '<button class="mini ok" data-act="approve" data-kind="wd" data-id="'+esc(r.ref)+'">Valider</button>';
        html += '<button class="mini bad" data-act="reject" data-kind="wd" data-id="'+esc(r.ref)+'">Rejeter</button>';
        html += '<button class="mini" data-act="suspend" data-kind="wd" data-id="'+esc(r.ref)+'" data-uid="'+esc(r.userId||'')+'">Suspendre</button>';
        html += '<button class="mini" data-act="silent" data-kind="wd" data-id="'+esc(r.ref)+'">Masquer</button>';
      }
      if (r.pending && r.kind === 'deposit') {
        html += '<button class="mini ok" data-act="approve" data-kind="dep" data-id="'+esc(r.ref)+'">Valider</button>';
        html += '<button class="mini bad" data-act="reject" data-kind="dep" data-id="'+esc(r.ref)+'">Rejeter</button>';
      }
      if (r.kind === 'message') {
        html += '<button class="mini" data-act="openmsg" data-kind="msg" data-id="'+i+'">Lire</button>';
        if (r.unread) html += '<button class="mini ok" data-act="read" data-kind="msg" data-id="'+esc(r.ref)+'">Marquer lu</button>';
      }
      html += '</td>';
    }
    html += '</tr>';
  });
  html += '</tbody></table>';
  if (!(j.rows||[]).length) html = '<p class="muted" style="padding:12px">Aucune ligne pour ces filtres.</p>';
  panel.innerHTML = html;
  const pg = document.getElementById('pager');
  pg.innerHTML = j.pages > 1 ? ('Page '+j.page+' / '+j.pages+' <button class="mini" id="prevP">←</button> <button class="mini" id="nextP">→</button>') : '';
  const prev = document.getElementById('prevP'); const next = document.getElementById('nextP');
  if (prev) prev.onclick = () => { if (page>1){ page--; loadList(); } };
  if (next) next.onclick = () => { if (page < (j.pages||1)){ page++; loadList(); } };
  panel.querySelectorAll('tr.clickable').forEach(tr => tr.addEventListener('click', ev => {
    if (ev.target.closest('button')) return;
    const idx = Number(tr.getAttribute('data-row'));
    const row = (j.rows||[])[idx];
    if (row && row.kind === 'message') { openMessage(row); return; }
    openUser(tr.getAttribute('data-uid'));
  }));
  panel.querySelectorAll('button[data-act]').forEach(btn => btn.addEventListener('click', async ev => {
    ev.stopPropagation();
    const act = btn.getAttribute('data-act');
    const kind = btn.getAttribute('data-kind');
    const id = btn.getAttribute('data-id');
    if (act === 'openmsg') {
      const row = (j.rows||[])[Number(id)];
      if (row) openMessage(row);
      return;
    }
    if (act === 'healthack') {
      const fp = btn.getAttribute('data-fp');
      const r = await ajax({action:'health_ack', fp});
      if (!r.ok) alert(r.reason || 'Échec');
      bustList(); loadBadges(); loadList(true);
      return;
    }
    if (kind === 'msg') {
      const r = await ajax({action:'mark_msg', id});
      if (!r.ok) alert(r.reason || 'Échec');
      bustList(); loadBadges(); loadList(true);
      return;
    }
    let motif = '';
    if (act === 'reject') motif = prompt('Motif du rejet (le montant sera recrédité définitivement sur le solde du joueur) :','') || '';
    if (act === 'silent' && !confirm('Masquer cette ligne du tableau de bord, sans modifier le solde du joueur ?')) return;
    if (act === 'suspend' && !confirm('Suspendre ce compte et couper sa session immédiatement ?')) return;
    const a = kind === 'wd' ? 'resolve_wd' : 'resolve_dep';
    const r = await ajax({action:a, id, act, motif});
    if (!r.ok) alert(r.reason || 'Échec');
    bustList(); loadBadges(); loadList(true);
  }));
}
async function loadList(force) {
  const my = ++listReq;
  document.getElementById('viewTitle').textContent = TITLES[view] || view;
  document.querySelectorAll('.metric-btn[data-view]').forEach(btn => {
    btn.classList.toggle('on', btn.getAttribute('data-view') === view);
  });
  const f = filters();
  const key = view + '|' + JSON.stringify(f);
  if (!force && listCache[key] && Date.now() - listCache[key].t < 20000) {
    renderList(listCache[key].j);
    return;
  }
  const j = await ajax(Object.assign({action:'list', view}, f));
  if (my !== listReq) return;
  listCache[key] = { t: Date.now(), j };
  renderList(j);
}
function openMessage(m) {
  document.getElementById('userDetail').innerHTML =
    '<h2 style="color:var(--gold);margin:8px 0 4px">Message</h2>'+
    '<p class="muted">'+esc(m.at||'')+' · '+(m.unread?'Non lu':'Lu')+'</p>'+
    '<p><strong>'+esc(m.name||'—')+'</strong> · '+esc(m.email||'')+'</p>'+
    '<p>Sujet : <strong>'+esc(m.subject||'(sans sujet)')+'</strong></p>'+
    '<div class="msg-full">'+esc(m.body||m.cells&&m.cells[5]||'')+'</div>'+
    (m.unread && m.ref ? '<p style="margin-top:12px"><button class="mini ok" id="btnMsgRead">Marquer lu</button></p>' : '')+
    (m.userId ? '<p><button class="mini" id="btnMsgUser">Voir le joueur</button></p>' : '');
  document.getElementById('userModal').classList.add('on');
  const br = document.getElementById('btnMsgRead');
  if (br) br.onclick = async () => {
    const r = await ajax({action:'mark_msg', id: m.ref});
    if (!r.ok) alert(r.reason||'Échec');
    else { bustList(); loadBadges(); loadList(true); document.getElementById('userModal').classList.remove('on'); }
  };
  const bu = document.getElementById('btnMsgUser');
  if (bu) bu.onclick = () => openUser(m.userId);
}
async function openUser(uid) {
  if (!uid) return;
  const j = await ajax({action:'profile', userId: uid});
  if (!j.ok) return;
  const u = j.user;
  const tbl = (title, arr, cols, map) => {
    if (!arr.length) return '<p class="muted">'+title+' : aucun</p>';
    return '<h3 class="panel-title">'+title+'</h3><div class="table-wrap"><table><thead><tr>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>'+
      arr.map(map).join('')+'</tbody></table></div>';
  };
  document.getElementById('userDetail').innerHTML =
    '<h2 style="color:var(--gold);margin:8px 0 4px">'+esc(u.publicId||u.id)+'</h2>'+
    '<p class="muted">'+esc(u.name)+' · '+esc(u.email)+' · '+esc(u.phone)+'</p>'+
    '<p>IP : <strong>'+esc(u.ip||'—')+'</strong> · Pays : <strong>'+esc(u.country||'—')+'</strong> · Inscription : <strong>'+esc(fdate(u.createdAt))+'</strong></p>'+
    '<p>Solde réel : <strong>$ '+esc(u.real)+'</strong> · Source : '+esc(u.traffic||'direct')+' · Rôle : '+esc(u.role||'user')+' · Vu : '+esc(fdate(u.lastSeen))+'</p>'+
    (j.suspect ? '<div class="sus-box'+(j.suspectLevel === 'orange' ? ' watch' : '')+'">'+(j.suspectLevel === 'orange' ? 'À suivre : ' : 'Ne pas payer sans vérifier : ')+esc(j.suspect)+'</div>' : '')+
    (j.totals ? '<div class="totals">'+
      '<div style="background:linear-gradient(180deg,rgba(34,197,94,.28),rgba(22,163,74,.12));border:1px solid rgba(74,222,128,.75);box-shadow:0 0 12px rgba(34,197,94,.35)"><span style="color:#BBF7D0">Solde réel actuel</span><b style="color:#4ADE80;font-size:1.25em">'+money(u.real)+'</b></div>'+
      '<div><span>Argent déposé</span><b>'+money(j.totals.deposits)+'</b></div>'+
      '<div><span>Bonus reçus</span><b>'+money(j.totals.bonus)+'</b></div>'+
      '<div><span>Retraits payés</span><b>'+money(j.totals.wdPaid)+'</b></div>'+
      '<div><span>Retraits en attente</span><b>'+money(j.totals.wdOpen)+'</b></div>'+
      '<div><span>Misé (réel)</span><b>'+money(j.totals.stake)+'</b></div>'+
      '<div><span>Gains nets jeux</span><b>'+money(j.totals.net)+'</b></div>'+
      '<div><span>Trades réels</span><b>'+esc(j.totals.trades)+'</b></div>'+
      (j.totals.bonusBy ? '<div style="border-color:rgba(255,104,124,.55)"><span>Bonus Défi du jour</span><b style="color:#FF9AA8">'+money(j.totals.bonusBy.defi)+'</b></div>'+
      '<div style="border-color:rgba(43,212,154,.55)"><span>Bonus Affiliation</span><b style="color:#7FF5CF">'+money(j.totals.bonusBy.aff)+'</b></div>'+
      '<div style="border-color:rgba(92,155,255,.55)"><span>Bonus dépôt</span><b style="color:#A9C8FF">'+money(j.totals.bonusBy.dep)+'</b></div>'+
      '<div style="border-color:rgba(242,179,61,.55)"><span>Bonus admin</span><b style="color:#FFD27A">'+money(j.totals.bonusBy.adm)+'</b></div>' : '')+
    '</div>' : '')+
    '<p><input id="adjAmt" type="number" step="0.01" min="0.01" placeholder="Montant" style="width:120px"> <input id="adjMotif" placeholder="Motif" style="width:200px"> '+
    '<button class="mini ok" id="btnCredit">Créditer +</button> '+
    '<button class="mini bad" id="btnDebit">Débiter</button> '+
    '<button class="mini bad" id="btnSuspend">Suspendre</button></p>'+
    // v2405 : seuls les dépôts VRAIMENT payés sous « argent payé » ; les pages de paiement ouvertes puis
    // abandonnées (en attente, jamais payées) à part, pour ne plus croire qu'un joueur a payé.
    tbl('Dépôts (argent payé)', (j.deposits||[]).filter(d => d.paid !== false), ['Réf','Montant','Méthode','Statut','Date'], d => '<tr><td>'+esc(d.id)+'</td><td>'+esc(d.amount)+'</td><td>'+esc(d.method)+'</td><td>'+esc(d.status)+'</td><td>'+esc(fdate(d.at))+'</td></tr>')+
    tbl('Dépôts NON payés (page ouverte, jamais payée)', (j.deposits||[]).filter(d => d.paid === false), ['Réf','Montant','Méthode','Statut','Date'], d => '<tr><td>'+esc(d.id)+'</td><td>'+esc(d.amount)+'</td><td>'+esc(d.method)+'</td><td>'+esc(d.status)+'</td><td>'+esc(fdate(d.at))+'</td></tr>')+
    tbl('Bonus reçus', j.bonuses || [], ['Réf','Montant','Motif','Date'], d => '<tr><td>'+esc(d.id)+'</td><td>'+esc(d.amount)+'</td><td>'+esc(d.motif && d.motif !== 'Bonus' ? d.motif : '—')+'</td><td>'+esc(fdate(d.at))+'</td></tr>')+
    tbl('Retraits', j.withdrawals, ['Réf','Montant','Méthode','Destination','Statut','Date','Motif'], d => '<tr><td>'+esc(d.id)+'</td><td>'+esc(d.amount)+'</td><td>'+esc(d.method||'—')+'</td><td>'+esc(d.phone||'—')+'</td><td>'+esc(d.status)+'</td><td>'+esc(fdate(d.at))+'</td><td>'+esc(d.reason||'')+'</td></tr>')+
    tbl('Jeux', j.games, ['Jeu','Mise','Net','Résultat','Date'], d => '<tr><td>'+esc(d.game)+'</td><td>'+esc(d.stake)+'</td><td>'+esc(d.net)+'</td><td>'+(d.won===true?'gagné':d.won===false?'perdu':esc(d.mode))+'</td><td>'+esc(fdate(d.at))+'</td></tr>');
  document.getElementById('userModal').classList.add('on');
  const go = async (sign) => {
    const motif = document.getElementById('adjMotif').value.trim() || (sign > 0 ? 'Crédit admin' : 'Débit admin');
    const amt = Number(document.getElementById('adjAmt').value);
    if (!(amt > 0)) { alert('Montant obligatoire'); return; }
    if (sign < 0 && !confirm('Débiter '+amt+' $ de ce compte réel ?')) return;
    // Boutons bloqués pendant l'envoi : un double toucher ne crédite plus deux fois.
    if (go.busy) return;
    go.busy = true;
    [btnCredit, btnDebit].forEach(b => { if (b) { b.disabled = true; b.style.opacity = '.5'; } });
    let r;
    try {
      r = await ajax({action:'adjust', userId:u.id, email:u.email||'', publicId:u.publicId||'', delta: sign * Math.abs(amt), motif});
    } catch (e) {
      r = {ok:false, reason:'Réseau lent : vérifiez le solde du joueur avant de recommencer.'};
    } finally {
      go.busy = false;
      [btnCredit, btnDebit].forEach(b => { if (b) { b.disabled = false; b.style.opacity = ''; } });
    }
    if (!r.ok) alert(r.reason||'Échec');
    else { bustList(); openUser(u.id); loadBadges(); }
  };
  const btnCredit = document.getElementById('btnCredit');
  const btnDebit = document.getElementById('btnDebit');
  if (btnCredit) btnCredit.onclick = () => go(1);
  if (btnDebit) btnDebit.onclick = () => go(-1);
  document.getElementById('btnSuspend').onclick = async () => {
    if (!confirm('Suspendre ce joueur ? Il sera déconnecté tout de suite et ne pourra plus jamais se connecter ni créer un compte avec cet e-mail.')) return;
    const r = await ajax({action:'suspend', userId:u.id, email:u.email||''});
    if (!r.ok) alert(r.reason || 'Échec');
    else { bustList(); openUser(u.id); loadBadges(); }
  };
}
document.getElementById('closeModal').onclick = () => document.getElementById('userModal').classList.remove('on');
(function () {
  const $w = id => document.getElementById(id);
  let rows = [];          // comptes (hors admin) : {email, name, pid, real, key, checked}
  let admins = [];
  const keepGmail = () => $w('wipeKeepGmail').checked;
  const visible = () => {
    const q = ($w('wipeSearch').value || '').trim().toLowerCase();
    return q ? rows.filter(r => (r.email + ' ' + (r.name || '') + ' ' + (r.pid || '')).toLowerCase().includes(q)) : rows;
  };
  function paint() {
    const vis = visible();
    const nSel = rows.filter(r => r.checked).length;
    $w('wipeCount').textContent = nSel + ' coché(s) sur ' + rows.length;
    $w('wipePlan').innerHTML =
      (admins.length ? '<p class="muted">Toujours gardé : ' + admins.map(a => esc(a.email)).join(', ') + '</p>' : '') +
      '<div class="table-wrap" style="max-height:40vh"><table><thead><tr><th></th><th>E-mail</th><th>ID</th><th>Nom</th><th>Solde réel</th></tr></thead><tbody>' +
      (vis.length ? vis.map(r => '<tr><td><input type="checkbox" data-wkey="' + esc(r.key) + '"' + (r.checked ? ' checked' : '') + '></td><td>' + esc(r.email) + '</td><td>' + esc(r.pid || '—') + '</td><td>' + esc(r.name || '—') + '</td><td>' + money(r.real) + '</td></tr>').join('')
        : '<tr><td colspan="5" class="muted">Aucun compte ne correspond.</td></tr>') +
      '</tbody></table></div>';
    $w('wipePlan').querySelectorAll('input[data-wkey]').forEach(cb => cb.onchange = () => {
      const r = rows.find(x => x.key === cb.getAttribute('data-wkey'));
      if (r) r.checked = cb.checked;
      $w('wipeCount').textContent = rows.filter(x => x.checked).length + ' coché(s) sur ' + rows.length;
      $w('wipeConfirmBox').style.display = rows.some(x => x.checked) ? '' : 'none';
    });
    $w('wipeConfirmBox').style.display = nSel ? '' : 'none';
  }
  async function load(onlyEmail) {
    $w('wipeStatus').textContent = 'Lecture des comptes…';
    const j = await ajax({action:'wipe_plan', keepGmail: keepGmail()});
    if (!j.ok) { $w('wipeStatus').textContent = j.reason || 'Échec'; return; }
    admins = (j.keep || []).filter(a => a.admin);
    const toDel = new Set((j.delete || []).map(r => r.email + '|' + (r.ids || []).join(',')));
    rows = [...(j.keep || []).filter(a => !a.admin), ...(j.delete || [])].map(r => {
      const key = r.email + '|' + (r.ids || []).join(',');
      return {email: r.email, name: r.name, pid: r.pid, real: r.real, ids: r.ids || [], key,
        checked: onlyEmail ? r.email === onlyEmail : toDel.has(key)};
    });
    rows.sort((a, b) => (b.checked - a.checked) || a.email.localeCompare(b.email));
    $w('wipeTools').style.display = '';
    $w('wipeSearch').value = onlyEmail || '';
    $w('wipeStatus').textContent = '';
    paint();
  }
  window.openWipe = (onlyEmail) => {
    $w('wipePlan').innerHTML = ''; $w('wipeTools').style.display = 'none'; $w('wipeConfirmBox').style.display = 'none';
    $w('wipeStatus').textContent = ''; $w('wipeConfirm').value = ''; rows = [];
    $w('wipeModal').classList.add('on');
    if (onlyEmail) load(onlyEmail);
  };
  $w('btnWipe').onclick = () => window.openWipe('');
  $w('closeWipe').onclick = () => $w('wipeModal').classList.remove('on');
  $w('wipeKeepGmail').onchange = () => { if (rows.length) load(''); };
  $w('btnWipePlan').onclick = () => load('');
  $w('wipeSearch').oninput = paint;
  $w('btnWipeAll').onclick = () => { visible().forEach(r => { r.checked = true; }); paint(); };
  $w('btnWipeNone').onclick = () => { visible().forEach(r => { r.checked = false; }); paint(); };
  $w('btnWipeRun').onclick = async () => {
    const sel = rows.filter(r => r.checked);
    if (!sel.length) { alert('Cochez au moins un compte.'); return; }
    if ($w('wipeConfirm').value.trim() !== 'SUPPRIMER') { alert('Tapez SUPPRIMER pour confirmer.'); return; }
    if (!confirm('Supprimer définitivement ' + sel.length + ' compte(s) et toutes leurs données ?')) return;
    const only = [];
    sel.forEach(r => { if (r.email && r.email !== '(sans e-mail)') only.push(r.email); r.ids.forEach(id => only.push(id)); });
    $w('btnWipeRun').disabled = true;
    let j;
    do {
      $w('wipeStatus').textContent = 'Suppression en cours… ne fermez pas cette page.';
      j = await ajax({action:'wipe_run', keepGmail: keepGmail(), confirm: 'SUPPRIMER', only});
      if (!j.ok) { $w('wipeStatus').textContent = j.reason || 'Échec'; $w('btnWipeRun').disabled = false; return; }
    } while (j.more);
    $w('btnWipeRun').disabled = false;
    $w('wipeStatus').textContent = 'Terminé : ' + sel.length + ' compte(s) supprimé(s) définitivement.';
    $w('wipeConfirm').value = '';
    bustList(); loadBadges(); loadList(true);
    load('');
  };
})();
// v2600 (propriétaire) : « Retour » sans recharger le jeu. Admin ouvert dans un onglet à part → on le ferme (le jeu est
// resté ouvert derrière). Sinon, page précédente du site si possible, et en dernier recours l'accueil.
document.getElementById('btnBack').onclick = () => {
  try { if (window.opener && !window.opener.closed) { window.opener.focus(); window.close(); return; } } catch (e) { /* ignore */ }
  try { if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { history.back(); return; } } catch (e) { /* ignore */ }
  window.location.href = '/';
};
document.getElementById('btnHealthBar').onclick = () => { showBoardPanel(); };
// v2676 — Live : conversations avec les joueurs (texte + photos) et Actualités.
(function () {
  const $l = id => document.getElementById(id);
  if (!$l('btnLiveA')) return;
  let cur = '', timer = 0;
  const when = t => { const d = new Date(t * 1000); return d.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'}) + ' ' + d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}); };
  // Photo réduite sur l'appareil avant l'envoi (≤ 1280 px, JPEG) : léger pour le serveur.
  function shrink(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { const im = new Image(); im.onload = () => {
        let w = im.width, h = im.height; const k = Math.min(1, 1280 / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
        let q = .78, out = c.toDataURL('image/jpeg', q); while (out.length > 520000 && q > .4) { q -= .12; out = c.toDataURL('image/jpeg', q); }
        res(out); }; im.onerror = rej; im.src = fr.result; };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  async function badge() { try { const j = await ajax({action:'live_threads'}); if (j.ok) { $l('lvBadge').textContent = j.unread || ''; $l('lvUnread').textContent = j.unread || ''; return j; } } catch (e) { /* ignore */ } return null; }
  async function list() {
    const j = await badge(); if (!j) return;
    $l('lvList').innerHTML = j.threads.length ? j.threads.map(t => '<div class="lvA-it'+(t.unread?' unread':'')+(t.uid===cur?' on':'')+'" data-u="'+esc(t.uid)+'"><b>'+esc((t.publicId||'')+' '+(t.name||''))+'</b><small>'+esc(t.last)+'</small><small>'+when(t.at)+'</small></div>').join('') : '<p class="muted" style="padding:10px">Aucun message pour le moment.</p>';
    $l('lvList').querySelectorAll('.lvA-it').forEach(el => el.onclick = () => open(el.dataset.u));
  }
  async function open(uid) {
    cur = uid; const j = await ajax({action:'live_thread', uid}); if (!j.ok) return;
    $l('lvHead').textContent = (j.publicId || '') + ' ' + (j.name || '') + (j.email ? ' · ' + j.email : '');
    $l('lvMsgs').innerHTML = j.msgs.map(m => '<div class="lvA-m '+(m.f==='a'?'a':'u')+'">'+(m.img?'<img src="'+esc(m.img)+'" alt="" onclick="window.open(this.src)">':'')+esc(m.t)+'<small>'+when(m.at)+'</small></div>').join('');
    $l('lvMsgs').scrollTop = 1e9; list();
  }
  async function send() {
    if (!cur) { $l('lvSt').textContent = 'Choisissez d’abord une conversation.'; return; }
    const text = $l('lvText').value.trim(); const f = $l('lvImg').files[0];
    if (!text && !f) return;
    $l('lvSend').disabled = true; $l('lvSt').textContent = 'Envoi…';
    try {
      const img = f ? await shrink(f) : '';
      const j = await ajax({action:'live_reply', uid: cur, text, img});
      if (j.ok) { $l('lvText').value = ''; $l('lvImg').value = ''; $l('lvSt').textContent = j.pushed ? 'Envoyé ✓ (notification envoyée sur son téléphone)' : 'Envoyé ✓ (il le verra dans Live)'; open(cur); }
      else $l('lvSt').textContent = j.reason || 'Échec';
    } catch (e) { $l('lvSt').textContent = 'Échec : ' + (e.message || e); }
    $l('lvSend').disabled = false;
  }
  async function posts() {
    const j = await ajax({action:'live_posts'}); if (!j.ok) return;
    $l('lvPosts').innerHTML = j.posts.length ? j.posts.map(p => '<div class="lvA-post">'+(p.img?'<img src="'+esc(p.img)+'" alt="">':'')+esc(p.t||'')+(p.link?'<br><a href="'+esc(p.link)+'" target="_blank" rel="noopener">'+esc(p.link)+'</a>':'')+'<br><small class="muted">'+when(p.at)+' · 👁 '+(p.views||0)+' · ❤️ '+(p.likes||0)+'</small> <button class="mini bad" data-del="'+esc(p.id)+'">Supprimer</button></div>').join('') : '<p class="muted">Aucune publication.</p>';
    $l('lvPosts').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (confirm('Supprimer cette publication ?')) { await ajax({action:'live_post_del', id: b.dataset.del}); posts(); } });
  }
  async function publish() {
    const text = $l('lvPostText').value.trim(), link = $l('lvPostLink').value.trim(), f = $l('lvPostImg').files[0];
    if (!text && !f) { $l('lvPostSt').textContent = 'Écrivez un texte ou ajoutez une photo.'; return; }
    $l('lvPostBtn').disabled = true; $l('lvPostSt').textContent = 'Publication…';
    try {
      const img = f ? await shrink(f) : '';
      const j = await ajax({action:'live_post', text, link, img});
      $l('lvPostSt').textContent = j.ok ? 'Publié ✓' : (j.reason || 'Échec');
      if (j.ok) { $l('lvPostText').value = ''; $l('lvPostLink').value = ''; $l('lvPostImg').value = ''; posts(); }
    } catch (e) { $l('lvPostSt').textContent = 'Échec : ' + (e.message || e); }
    $l('lvPostBtn').disabled = false;
  }
  async function reps() {
    const j = await ajax({action:'live_reports'}); if (!j.ok) return;
    $l('lvReps').innerHTML = j.reports.length ? j.reports.map(r => '<div class="lvA-post"><b>'+esc(r.by)+'</b> a signalé <b style="color:#FCA5A5">'+esc(r.who)+'</b> · <small class="muted">'+when(r.at)+'</small>'+(r.why?'<br>Motif : '+esc(r.why):'')+'<div class="muted" style="margin-top:4px;font-size:.8rem">'+r.snap.map(m => (m.f==='signalé'?'🚩 ':'• ')+esc(m.t)).join('<br>')+'</div></div>').join('') : '<p class="muted">Aucun signalement.</p>';
  }
  const tab = w => { $l('lvPaneMsg').hidden = w !== 'msg'; $l('lvPanePost').hidden = w !== 'post'; $l('lvPaneRep').hidden = w !== 'rep'; $l('lvTabMsg').classList.toggle('ok', w === 'msg'); $l('lvTabPost').classList.toggle('ok', w === 'post'); $l('lvTabRep').classList.toggle('ok', w === 'rep'); if (w === 'post') posts(); if (w === 'rep') reps(); };
  $l('btnLiveA').onclick = () => { $l('liveModal').classList.add('on'); tab('msg'); list(); clearInterval(timer); timer = setInterval(() => { list(); if (cur) open(cur); }, 20000); };
  $l('closeLiveA').onclick = () => { $l('liveModal').classList.remove('on'); clearInterval(timer); };
  $l('lvTabMsg').onclick = () => tab('msg'); $l('lvTabPost').onclick = () => tab('post'); $l('lvTabRep').onclick = () => tab('rep');
  $l('lvSend').onclick = send; $l('lvPostBtn').onclick = publish;
  $l('lvText').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); });
  badge(); setInterval(badge, 60000);
})();
// v2664 — E-mail à tous (français pour les pays francophones, anglais pour les autres), par paquets de 40.
(function () {
  const $m = id => document.getElementById(id);
  if (!$m('btnMail')) return;
  async function stats() {
    try { const j = await ajax({action:'mail_stats'}); if (j.ok) $m('mlWho').textContent = 'Pays francophones : ' + j.fr + ' joueur(s) · Autres pays : ' + j.en + ' joueur(s)'; } catch (e) { /* ignore */ }
  }
  $m('btnMail').onclick = () => {
    $m('mailModal').classList.add('on'); $m('mlSt').textContent = ''; stats();
    try { if (!$m('mlTestTo').value) $m('mlTestTo').value = localStorage.getItem('oro_mail_test_to') || ''; } catch (e) { /* ignore */ }
  };
  $m('closeMail').onclick = () => $m('mailModal').classList.remove('on');
  async function send(target) {
    const subject = $m('mlSubject').value.trim(), message = $m('mlBody').value.trim(), button = $m('mlBtn').value.trim(), group = $m('mlGroup').value;
    if (!subject || !message) { $m('mlSt').textContent = 'Écrivez l’objet et le message.'; return; }
    const testTo = $m('mlTestTo').value.trim();
    if (target === 'test') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo)) { $m('mlSt').textContent = 'Écrivez l’adresse e-mail qui reçoit le test.'; return; }
      try { localStorage.setItem('oro_mail_test_to', testTo); } catch (e) { /* ignore */ }
    }
    let confirmTxt = '';
    if (target === 'all') {
      confirmTxt = prompt('Envoyer « ' + subject + ' » à tous les joueurs ' + (group === 'fr' ? 'des pays francophones' : 'des autres pays') + ' ?\nEnvoi lent (environ 1 e-mail toutes les 5 à 8 secondes) : gardez la page ouverte.\nTapez ENVOYER pour confirmer :') || '';
      if (confirmTxt.trim().toUpperCase() !== 'ENVOYER') { $m('mlSt').textContent = 'Envoi annulé.'; return; }
      confirmTxt = 'ENVOYER';
    }
    $m('btnMlTest').disabled = $m('btnMlAll').disabled = true;
    let id = '', sent = 0, fail = 0, err = '', already = -1, j;
    try {
      // v2668 — « Envoyer à tous » : l'adresse du propriétaire (case du test) reçoit d'abord une copie, pour voir que c'est parti.
      if (target === 'all' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo)) {
        $m('mlSt').textContent = 'Copie envoyée à ' + testTo + '…';
        try { await ajax({action:'mail_send', target:'test', group, subject, message, button, testTo}); } catch (eCopy) { /* ignore */ }
      }
      do {
        $m('mlSt').textContent = 'Envoi en cours… ' + (already > 0 ? already + ' déjà reçu(s) avant, ' : '') + sent + ' e-mail(s) parti(s)' + (j && j.total ? ' sur ' + j.total : '') + (j && j.left ? ' · environ ' + Math.max(1, Math.round(j.left * 7.5 / 60)) + ' min restante(s)' : '') + '. Gardez la page ouverte.';
        j = await ajax({action:'mail_send', target, group, subject, message, button, id, confirm: confirmTxt, testTo});
        if (!j.ok) { $m('mlSt').textContent = j.reason || 'Échec'; break; }
        if (already < 0) already = j.already || 0;
        id = j.id; sent += j.sent || 0; fail += j.fail || 0; if (j.err) err = j.err;
      } while (j.more);
      if (j && j.ok) $m('mlSt').textContent = target === 'test'
        ? 'Test envoyé. Regardez la boîte ' + testTo + ' (et le dossier Spam / Promotions).'
        : 'Terminé : ' + (already + sent) + ' joueur(s) sur ' + (j.total || 0) + ' ont reçu cet e-mail'
          + (already > 0 ? ' (dont ' + already + ' déjà avant : pas renvoyé)' : '')
          + (fail ? '. ' + fail + ' échec(s)' + (err ? ' (' + err + ')' : '') + ' : retouchez « Envoyer à tous » pour réessayer seulement ceux-là' : '') + '.';
    } catch (e) { $m('mlSt').textContent = 'Échec : ' + (e && e.message ? e.message : e); }
    $m('btnMlTest').disabled = $m('btnMlAll').disabled = false;
  }
  $m('btnMlTest').onclick = () => send('test');
  $m('btnMlAll').onclick = () => send('all');
})();
// v2607 — Notifications : chiffres, test sur l'appareil admin, envoi à tous (par paquets de 100).
(function () {
  const $n = id => document.getElementById(id);
  let pubKey = '';
  let lastStats = null;
  // Nombre de téléphones qui recevront le message « à tous » (selon la langue choisie).
  const reach = () => {
    if (!lastStats) return null;
    const lg = $n('ntLang').value;
    return lg ? ((lastStats.langs || {})[lg] || 0) : lastStats.subs;
  };
  const paintWho = () => {
    const r = reach();
    $n('ntWho').textContent = r === null ? '' : '« Envoyer à tous » partira vers ' + r + ' téléphone(s)' + ($n('ntLang').value ? ' (' + (LANGN[$n('ntLang').value] || '') + ')' : '') + '.';
  };
  const LANGN = {fr:'Français',en:'Anglais',es:'Espagnol',pt:'Portugais',ar:'Arabe',tr:'Turc',vi:'Vietnamien',id:'Indonésien',ru:'Russe',de:'Allemand',hi:'Hindi'};
  const plat = () => /android/i.test(navigator.userAgent) ? 'android' : (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : 'pc');
  const isApp = () => !!(navigator.standalone || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches);
  async function loadStats() {
    const j = await ajax({action:'push_stats'});
    if (!j.ok) { $n('ntStats').textContent = j.reason || 'Erreur'; return; }
    pubKey = j.key || '';
    lastStats = j.stats;
    paintWho();
    const s = j.stats, a7 = s.apps7, a30 = s.apps30, aa = s.appsAll;
    const langs = Object.entries(s.langs || {}).map(([k, v]) => esc(LANGN[k] || k) + ' ' + v).join(' · ') || '—';
    $n('ntStats').innerHTML =
      'Abonnés aux notifications : <b>' + s.subs + '</b> (Android ' + s.android + ' · iPhone ' + s.ios + ' · Ordinateur ' + s.pc + ' · dont tests ' + s.test + ')<br>' +
      'Application installée ouverte — 7 derniers jours : <b>Android ' + a7.android + ' · iPhone ' + a7.ios + '</b><br>' +
      '30 derniers jours : Android ' + a30.android + ' · iPhone ' + a30.ios + ' — depuis le début : Android ' + aa.android + ' · iPhone ' + aa.ios + '<br>' +
      'Langues des abonnés : ' + langs;
    const log = j.journal || [];
    $n('ntLog').innerHTML = !log.length ? 'Aucun envoi pour l’instant.' :
      '<table class="nt-log"><tr><th>Date</th><th>Message</th><th>Pour</th><th>Reçus</th><th>Partis</th><th>Échecs</th></tr>' +
      log.map(l => '<tr><td>' + esc(String(l.at || '').replace('T', ' ').slice(0, 16)) + '</td><td><b>' + esc(l.title) + '</b><br>' + esc(l.body) + '</td><td>' +
        (l.target === 'all' ? 'Tous' : 'Test') + (l.lang ? ' · ' + esc(LANGN[l.lang] || l.lang) : '') + (l.done ? '' : ' (en cours)') + '</td><td>' + (l.sent | 0) + '</td><td>' + (l.gone | 0) + '</td><td>' + (l.fail | 0) + (l.fail && l.err ? '<br><small>' + esc(l.err) + '</small>' : '') + '</td></tr>').join('') + '</table>';
  }
  function preview() {
    $n('ntPrevT').textContent = $n('ntTitle').value.trim() || 'Titre';
    $n('ntPrevB').textContent = $n('ntBody').value.trim() || 'Message';
    $n('ntTitleN').textContent = $n('ntTitle').value.length + '/80';
    $n('ntBodyN').textContent = $n('ntBody').value.length + '/240';
  }
  $n('ntLang').onchange = paintWho;
  $n('ntTitle').oninput = preview;
  $n('ntBody').oninput = preview;
  $n('btnNotif').onclick = () => { $n('notifModal').classList.add('on'); $n('ntSt').textContent = ''; loadStats(); };
  $n('closeNotif').onclick = () => $n('notifModal').classList.remove('on');
  $n('btnNtDevice').onclick = async () => {
    const st = $n('ntDeviceSt');
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        st.textContent = plat() === 'ios' ? 'Sur iPhone : ouvrez l’admin depuis l’application installée (écran d’accueil).' : 'Ce navigateur ne gère pas les notifications.';
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { st.textContent = 'Refusé : autorisez les notifications pour orolado.com dans les réglages du téléphone.'; return; }
      if (!pubKey) await loadStats();
      const reg = (await navigator.serviceWorker.getRegistration('/')) || (await navigator.serviceWorker.register('/sw.js?v=2000'));
      await navigator.serviceWorker.ready;
      const raw = atob(pubKey.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((pubKey.length + 3) % 4));
      const key = Uint8Array.from(raw, c => c.charCodeAt(0));
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: key}));
      const j = await ajax({action:'push_test_sub', sub: sub.toJSON(), plat: plat(), app: isApp() ? 1 : 0});
      st.textContent = j.ok ? 'Cet appareil recevra les tests ✓' : (j.reason || 'Échec');
      loadStats();
    } catch (e) { st.textContent = 'Échec : ' + (e && e.message ? e.message : e); }
  };
  async function send(target) {
    const title = $n('ntTitle').value.trim(), body = $n('ntBody').value.trim(), lang = $n('ntLang').value;
    if (!title) { $n('ntSt').textContent = 'Écrivez un titre.'; return; }
    let confirmTxt = '';
    if (target === 'all') {
      const r = reach();
      confirmTxt = prompt('Envoyer « ' + title + ' » à TOUS les abonnés' + (lang ? ' (' + (LANGN[lang] || lang) + ')' : '') + (r !== null ? ' — ' + r + ' téléphone(s)' : '') + ' ?\nTapez ENVOYER pour confirmer :') || '';
      if (confirmTxt.trim().toUpperCase() !== 'ENVOYER') { $n('ntSt').textContent = 'Envoi annulé.'; return; }
      confirmTxt = 'ENVOYER';
    }
    $n('btnNtTest').disabled = $n('btnNtAll').disabled = true;
    let id = '', after = '', sent = 0, gone = 0, fail = 0, lastErr = '', j;
    try {
      do {
        $n('ntSt').textContent = 'Envoi en cours… ' + sent + ' reçu(s)';
        j = await ajax({action:'push_send', target, title, body, lang, id, after, confirm: confirmTxt});
        if (!j.ok) { $n('ntSt').textContent = j.reason || 'Échec'; break; }
        id = j.id; after = j.after; sent += j.res.sent; gone += j.res.gone; fail += j.res.fail;
        if (j.res.err) lastErr = j.res.err;
      } while (j.more);
      if (j && j.ok) $n('ntSt').textContent = 'Terminé : ' + sent + ' téléphone(s) ont reçu le message' + (gone ? ', ' + gone + ' abonné(s) parti(s) retiré(s)' : '') + (fail ? ', ' + fail + ' échec(s)' + (lastErr ? ' (' + lastErr + ')' : '') : '') + '.' + (target === 'test' && !sent ? ' Aucun appareil test : appuyez d’abord sur « Activer les notifications sur cet appareil ».' : '');
    } catch (e) { $n('ntSt').textContent = 'Échec : ' + (e && e.message ? e.message : e); }
    $n('btnNtTest').disabled = $n('btnNtAll').disabled = false;
    loadStats();
  }
  $n('btnNtTest').onclick = () => send('test');
  $n('btnNtAll').onclick = () => send('all');
})();
['q','preset','cal','dateFrom','dateTo','idFrom'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { page=1; bustList(); loadList(true); });
});
document.getElementById('q').addEventListener('keydown', e => { if (e.key==='Enter'){ page=1; bustList(); loadList(true); } });
document.getElementById('preset').addEventListener('change', filters);
loadBadges().then(() => loadList(true));
setInterval(() => {
  loadBadges();
  if (view === 'online') loadList(true);
}, 8000);
// v2690 — Casino & Paris (admin)
(function () {
  const $c = id => document.getElementById(id);
  if (!$c('btnCasA')) return;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const m2 = v => (Number(v) || 0).toFixed(2) + ' $';
  const ICO = {foot:'⚽', basket:'🏀', boxe:'🥊', tennis:'🎾', mma:'🥋', event:'📅', crypto:'₿', politique:'🗳️', autre:'🏆'};
  const GN = {crash:'Sky Rush (avion)', jet:'Jet Man', rocket:'Rocket (fusée)', coin:'Coin Flip (pile ou face)', dice:'Dice (dés)', limbo:'Target (cible)', wheel:'Lucky Wheel (roue)', race:'Racing (course)', roulette:'Roulette', slots:'Lucky 777 (machine à sous)', plinko:'Cascade', keno:'Keno', scratch:'Scratch Card (grattage)', hilo:'Hi-Lo', penalty:'Penalty', colors:'Colors (couleurs)', mines:'Mines', apple:'Golden Orchard (pommes)', tower:'Tower (tour)', dragon:'Dragon Tiger', baccarat:'Baccarat', sicbo:'Sic Bo', chests:'Treasure (coffres)', balloon:'Balloon (ballon)', darts:'Darts (fléchettes)', sports:'Paris sportifs'};
  function optRow(label, odd) {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;gap:6px;margin-bottom:4px';
    d.innerHTML = '<input class="spL" placeholder="Choix (ex. Real / Nul / Barça)" maxlength="40" style="flex:1" value="' + esc(label || '') + '"><input class="spO" type="number" step="0.01" min="1.01" placeholder="Cote" style="width:90px" value="' + esc(odd || '') + '"><button class="mini" type="button">✕</button>';
    d.querySelector('button').onclick = () => d.remove();
    $c('spOpts').appendChild(d);
  }
  function resetForm() { $c('spOpts').innerHTML = ''; optRow('', ''); optRow('Nul', ''); optRow('', ''); $c('spTitle').value = ''; }
  async function list() {
    const j = await ajax({action:'sp_list'}); if (!j.ok) { $c('spList').innerHTML = '<p class="muted">' + esc(j.reason || 'Erreur') + '</p>'; return; }
    $c('spList').innerHTML = j.events.length ? j.events.map(e => {
      const st = {open:'🟢 Ouvert', closed:'🟠 Paris fermés', settled:'✅ Réglé'}[e.status] || e.status;
      const opts = e.opts.map(o => { const x = (e.exp && e.exp[o.k]) || {}; return '<div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid rgba(255,255,255,.06)"><span>' + esc(o.label) + ' <b style="color:#FFD27A">' + Number(o.odd).toFixed(2) + '</b>' + (e.result === o.k ? ' 🏆' : '') + '</span><span class="muted">' + (x.n || 0) + ' coupon(s) · misé ' + m2(x.in) + (x.risk ? ' · à payer si gagne ' + m2(x.risk) : '') + '</span>' + (e.status !== 'settled' ? '<button class="mini ok" type="button" data-set="' + esc(e.id) + '" data-k="' + esc(o.k) + '">Résultat : ' + esc(o.label) + '</button>' : '') + '</div>'; }).join('');
      return '<div class="nt-card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + (ICO[e.sport] || '🏆') + ' ' + esc(e.title) + '</b><span>' + st + '</span></div><div class="muted">' + esc(e.league || '') + ' · début ' + new Date(e.start * 1000).toLocaleString() + ' · mise max ' + m2(e.maxStake) + '</div>' + opts +
        (e.status === 'open' ? '<button class="mini" type="button" data-close="' + esc(e.id) + '">Fermer les paris</button> ' : '') + (e.status !== 'settled' ? '<button class="mini" type="button" data-set="' + esc(e.id) + '" data-k="void">Match annulé (mises rendues)</button>' : '') + '</div>';
    }).join('') : '<p class="muted">Aucun match. Créez le premier ci-dessus.</p>';
    $c('spList').querySelectorAll('[data-close]').forEach(b => b.onclick = async () => { if (!confirm('Fermer les paris de ce match ?')) return; await ajax({action:'sp_close', id:b.dataset.close}); list(); });
    $c('spList').querySelectorAll('[data-set]').forEach(b => b.onclick = async () => {
      const lbl = b.dataset.k === 'void' ? 'ANNULER ce match (toutes les mises de ce match comptent ×1)' : 'Confirmer le résultat : ' + b.textContent.replace('Résultat : ', '') + ' ? Les gagnants seront payés tout de suite.';
      if (!confirm(lbl)) return;
      b.disabled = true;
      const r = await ajax({action:'sp_settle', id:b.dataset.set, k:b.dataset.k});
      alert(r.ok ? ('Réglé ✓ — coupons gagnés : ' + r.won + ' · perdus : ' + r.lost + (r.retry ? ' · ' + r.retry + ' paiement(s) à refaire (base injoignable) : recliquez plus tard' : '')) : (r.reason || 'Échec'));
      list();
    });
  }
  async function stats() {
    const j = await ajax({action:'cs_stats'}); if (!j.ok) return;
    const table = (o, title) => {
      const rows = Object.entries((o && o.real) || {}).map(([g, v]) => ({g, n:v.n, i:v.in, o:v.out, p:(v.in - v.out)})).sort((a, b) => b.i - a.i);
      const t = rows.reduce((a, r) => ({n:a.n + r.n, i:a.i + r.i, o:a.o + r.o, p:a.p + r.p}), {n:0, i:0, o:0, p:0});
      return '<div class="nt-card" style="margin-bottom:10px"><b>' + title + '</b><table style="width:100%;margin-top:6px;font-size:13px"><tr class="muted"><td>Jeu</td><td>Parties</td><td>Misé</td><td>Payé</td><td>Bénéfice maison</td></tr>' +
        rows.map(r => '<tr><td>' + esc(GN[r.g] || r.g) + '</td><td>' + r.n + '</td><td>' + m2(r.i) + '</td><td>' + m2(r.o) + '</td><td style="color:' + (r.p >= 0 ? '#5CF59A' : '#FF7A90') + '">' + m2(r.p) + '</td></tr>').join('') +
        '<tr style="font-weight:800"><td>Total</td><td>' + t.n + '</td><td>' + m2(t.i) + '</td><td>' + m2(t.o) + '</td><td style="color:' + (t.p >= 0 ? '#5CF59A' : '#FF7A90') + '">' + m2(t.p) + '</td></tr></table></div>';
    };
    const lim = j.limits || {}, max = j.max || 1000;
    const limCard = '<div class="nt-card" style="margin-bottom:10px"><b>Mise maximale par jeu ($)</b><p class="muted" style="margin:4px 0 8px">Vide = ' + max + ' $ (normal). Exemple : mettre 200 sur les jeux à 1 chance sur 2 (Coin Flip, Dice, Roulette…).</p>' +
      '<div style="display:grid;grid-template-columns:1fr 90px;gap:6px 8px;align-items:center;font-size:13px">' +
      (j.games || []).map(g => '<span>' + esc(GN[g] || g) + '</span><input class="csLim" data-g="' + g + '" inputmode="decimal" placeholder="' + max + '" value="' + (lim[g] != null ? lim[g] : '') + '" style="width:90px">').join('') +
      '</div><button class="mini ok" type="button" id="csLimSave" style="margin-top:10px">Enregistrer les mises maximales</button> <span id="csLimSt" class="muted"></span></div>';
    const plCard = '<div class="nt-card" style="margin-bottom:10px"><b>Joueurs du casino (argent réel)</b><p class="muted" style="margin:4px 0 8px">Touche un joueur pour voir ses dernières parties et ses paris. Ou cherche par e-mail / ID.</p>' +
      '<div style="display:flex;gap:6px;margin-bottom:8px"><input id="csPlQ" placeholder="e-mail ou ID OR…" style="flex:1"><button class="mini ok" type="button" id="csPlGo">Voir</button></div><div id="csPlList"><p class="muted">Chargement…</p></div><div id="csPlOne"></div></div>';
    // v2713 (propriétaire) : JEUX LES PLUS JOUÉS — classement par nombre de parties (argent réel), avec une barre
    const top = Object.entries(((j.all || {}).real) || {}).map(([g, v]) => ({g, n:v.n, i:v.in})).sort((a, b) => b.n - a.n || b.i - a.i);
    const topMax = top.length ? top[0].n : 1;
    const today = ((j.today || {}).real) || {};
    const topCard = '<div class="nt-card" style="margin-bottom:10px"><b style="font-size:1.05rem">🏆 Jeux les plus joués (argent réel)</b>' +
      (top.length ? top.map((r, k) => '<div style="display:grid;grid-template-columns:26px 1fr auto;gap:8px;align-items:center;margin-top:8px"><b style="color:' + (k < 3 ? '#FCD34D' : 'var(--muted)') + '">' + (k + 1) + '</b>' +
        '<div><div style="display:flex;justify-content:space-between;gap:6px"><span>' + esc(GN[r.g] || r.g) + '</span><span class="muted">' + m2(r.i) + ' $ misés</span></div>' +
        '<i style="display:block;height:7px;border-radius:4px;margin-top:4px;background:linear-gradient(90deg,#22C55E,#5CF59A);width:' + Math.max(4, Math.round(r.n / topMax * 100)) + '%"></i></div>' +
        '<b>' + r.n + '<small class="muted"> parties' + (today[r.g] ? ' · ' + today[r.g].n + " aujourd'hui" : '') + '</small></b></div>').join('')
        : '<p class="muted">Aucune partie en argent réel pour le moment.</p>') + '</div>';
    $c('csStats').innerHTML = topCard + table(j.today, "Aujourd'hui (argent réel)") + table(j.all, 'Depuis le début (argent réel)') + plCard + limCard + '<p class="muted">Sur 100 $ misés par les joueurs, la maison garde en moyenne 3 à 8 $ (chaque jeu rend 92 à 97 %). Un jour peut être négatif à cause d\'un gros gain : c\'est normal, sur la durée la maison gagne.</p>';
    const showOne = async q => {
      const r = await ajax({action:'cs_player', q}); const box = $c('csPlOne');
      if (!r.ok) { box.innerHTML = '<p class="muted">' + esc(r.reason || 'Introuvable') + '</p>'; return; }
      const t = r.tot || {}, res = (t.out || 0) - (t.in || 0);
      box.innerHTML = '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.12)"><b>' + esc(r.name || r.email || r.uid) + '</b> <span class="muted">' + esc(r.email) + ' ' + esc(r.publicId) + '</span>' +
        '<p style="margin:6px 0">Parties : <b>' + (t.n || 0) + '</b> · Misé : <b>' + m2(t.in || 0) + ' $</b> · Payé : <b>' + m2(t.out || 0) + ' $</b> · Résultat du joueur : <b style="color:' + (res > 0 ? '#FF7A90' : '#5CF59A') + '">' + (res > 0 ? '+' : '') + m2(res) + ' $</b></p>' +
        '<table style="width:100%;font-size:12.5px"><tr class="muted"><td>Quand</td><td>Jeu</td><td>Mise</td><td>Gain</td></tr>' +
        (r.h || []).map(p => '<tr><td>' + new Date(p.at * 1000).toLocaleString('fr-FR') + '</td><td>' + esc(GN[p.g] || p.g) + (p.m === 'demo' ? ' (test)' : '') + '</td><td>' + m2(p.s) + '</td><td style="color:' + (p.w > 0 ? '#5CF59A' : '#94A3B8') + '">' + m2(p.w) + '</td></tr>').join('') + '</table>' +
        ((r.bets || []).length ? '<p style="margin:10px 0 4px"><b>Paris sportifs</b></p>' + r.bets.map(b => '<div class="muted" style="font-size:12.5px">' + esc(b.status) + ' · ' + m2(b.stake) + ' $ × ' + Number(b.odd).toFixed(2) + ' → ' + m2(b.status === 'won' ? b.win : b.pot) + ' $ · ' + b.sel.map(s => esc(s.t) + ' (' + esc(s.l) + ')').join(' + ') + '</div>').join('') : '') + '</div>';
    };
    (async () => {
      const r = await ajax({action:'cs_players'}); const box = $c('csPlList'); if (!box) return;
      const list = (r && r.players) || [];
      box.innerHTML = list.length ? '<table style="width:100%;font-size:12.5px"><tr class="muted"><td>Joueur</td><td>Parties</td><td>Misé</td><td>Maison</td></tr>' +
        list.map(p => { const h = p.in - p.out; return '<tr class="csPlRow" data-q="' + esc(p.email || p.uid) + '" style="cursor:pointer"><td>' + esc(p.name || p.email || p.uid) + '</td><td>' + p.n + '</td><td>' + m2(p.in) + '</td><td style="color:' + (h >= 0 ? '#5CF59A' : '#FF7A90') + '">' + (h >= 0 ? '+' : '') + m2(h) + '</td></tr>'; }).join('') + '</table>'
        : '<p class="muted">Aucun joueur en argent réel pour l\'instant.</p>';
      box.querySelectorAll('.csPlRow').forEach(tr => tr.onclick = () => showOne(tr.dataset.q));
    })();
    $c('csPlGo').onclick = () => showOne($c('csPlQ').value);
    $c('csLimSave').onclick = async () => {
      const limits = {}; document.querySelectorAll('.csLim').forEach(i => { const v = parseFloat(String(i.value).replace(',', '.')); if (v > 0) limits[i.dataset.g] = v; });
      const r = await ajax({action:'cs_limits_save', limits}); $c('csLimSt').textContent = r.ok ? 'Enregistré ✓' : (r.reason || 'Échec');
    };
  }
  const tab = w => { $c('csPaneSp').hidden = w !== 'sp'; $c('csPaneSt').hidden = w !== 'st'; $c('csTabSp').classList.toggle('ok', w === 'sp'); $c('csTabSt').classList.toggle('ok', w === 'st'); if (w === 'sp') list(); else stats(); };
  $c('csTabSp').onclick = () => tab('sp');
  $c('csTabSt').onclick = () => tab('st');
  $c('spAddOpt').onclick = () => { if ($c('spOpts').children.length < 6) optRow('', ''); };
  // v2706 : événement / crypto / politique → 2 choix Oui / Non prêts (modifiables) au lieu de Équipe / Nul / Équipe
  $c('spSport').onchange = () => {
    const ev = ['event', 'crypto', 'politique'].includes($c('spSport').value);
    const empty = [...$c('spOpts').children].every(d => !d.querySelector('.spO').value);
    if (!empty) return;
    $c('spOpts').innerHTML = '';
    if (ev) { optRow('Oui', ''); optRow('Non', ''); } else { optRow('', ''); optRow('Nul', ''); optRow('', ''); }
  };
  $c('spSave').onclick = async () => {
    const opts = [...$c('spOpts').children].map(d => ({label: d.querySelector('.spL').value.trim(), odd: parseFloat(d.querySelector('.spO').value)})).filter(o => o.label);
    const start = Math.floor(new Date($c('spStart').value).getTime() / 1000);
    $c('spSave').disabled = true;
    const r = await ajax({action:'sp_save', ev:{title:$c('spTitle').value, league:$c('spLeague').value, sport:$c('spSport').value, start, opts, maxStake:parseFloat($c('spMax').value)}});
    $c('spSave').disabled = false;
    $c('spSt').textContent = r.ok ? 'Publié ✓' : (r.reason || 'Échec');
    if (r.ok) { resetForm(); list(); }
  };
  $c('btnCasA').onclick = () => { $c('casModal').classList.add('on'); resetForm(); tab('sp'); };
  $c('closeCasA').onclick = () => $c('casModal').classList.remove('on');
})();
</script>
<?php endif; ?>
</body>
</html>
