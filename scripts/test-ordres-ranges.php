<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * ORDRES RÉGLÉS RANGÉS HORS DE orolado.json (orolado_orders_maintain / orolado_orders_recent).
 * Base de 10 000 trades (démo + réel, 40 joueurs, 40 dernières heures) : on calcule tout ce que les
 * joueurs et l'admin voient AVANT le rangement, on range (en plusieurs passages bornés, comme sur le
 * vrai site), puis on recalcule : tout doit être IDENTIQUE. Ensuite : règlement redemandé et ordre
 * renvoyé après le rangement → jamais payé ni créé deux fois ; lignes en double (arrêt brutal) sans effet.
 * Dossier data/ temporaire, faux Supabase : rien ne part en ligne.
 *
 * php scripts/test-ordres-ranges.php
 */
$root = dirname(__DIR__);

// ------------------------------------------------------------------------------------------------
// Sous-processus : une « phase » (chaque phase dans son propre processus : aucune mémoire partagée).
// ------------------------------------------------------------------------------------------------
if (($argv[1] ?? '') === 'phase') {
  [, , $tmp, $what] = $argv;
  define('OROLADO_ORDERS_MOVE_MAX', 1500);
  define('OROLADO_ORDERS_HOT_SEC', 300); // marge : le test peut être lent, les trades « tout juste réglés » restent
  putenv('SUPABASE_URL=https://fake.supabase.test');
  putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
  putenv('SUPABASE_ANON_KEY=fake-anon-key');
  $GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use ($tmp) {
    if (str_contains($url, '/rpc/')) {
      file_put_contents($tmp . '/rpc.log', $url . ' ' . $body . "\n", FILE_APPEND);
      if (str_contains($url, '/rpc/resolve_trade')) return ['ok' => true, 'real' => 100];
      return ['ok' => true, 'real' => 100, 'duplicate' => false];
    }
    if (preg_match('#/rest/v1/vaults\?user_id=eq\.([0-9a-f-]+)#', $url, $m)) return [['user_id' => rawurldecode($m[1]), 'demo' => 1000000, 'real' => 100]];
    return [];
  };
  $GLOBALS['OROLADO_FAKE_MAIL'] = fn() => ['ok' => true];
  require $tmp . '/orolado_lib.php';
  require $tmp . '/trade_lib.php';
  require $tmp . '/history_lib.php';
  require $tmp . '/aff_lib.php';
  require $tmp . '/top_lib.php';
  require $tmp . '/bonus_lib.php';
  require $tmp . '/defi_lib.php';
  require $tmp . '/live_lib.php';
  $seed = json_decode((string) file_get_contents($tmp . '/seed.json'), true);
  $now = (float) $seed['now'];

  if ($what === 'migrate') {
    $passes = 0;
    $moved = 0;
    do {
      $n = orolado_orders_maintain(true);
      $moved += $n;
      $passes++;
    } while ($n > 0 && $passes < 50);
    echo json_encode(['passes' => $passes, 'moved' => $moved, 'size' => filesize(orolado_data_file())]);
    exit;
  }

  if ($what === 'replay') {
    // Règlement redemandé d'un ordre RANGÉ + même ordre renvoyé (démo et réel).
    $out = [];
    $db = load_db();
    foreach (['real' => $seed['movedReal'], 'demo' => $seed['movedDemo']] as $mode => [$uid, $oid]) {
      $vaultBefore = $db['vault'][$uid] ?? null;
      $s = orolado_trade_settle($uid, $oid);
      $p = orolado_trade_place(['id' => $uid, 'email' => $uid . '@t.local', 'role' => 'user'],
        ['id' => $oid, 'stake' => 5, 'side' => 'call', 'duration' => 10, 'mode' => $mode, 'assetId' => 'v100', 'payout' => 1.9]);
      $db2 = load_db();
      $inMain = 0;
      foreach ($db2['orders'] as $o) if (($o['id'] ?? '') === $oid) $inMain++;
      $out[$mode] = ['settle' => $s, 'place' => $p, 'inMain' => $inMain, 'vaultBefore' => $vaultBefore, 'vaultAfter' => $db2['vault'][$uid] ?? null];
    }
    $out['rpc'] = is_file($tmp . '/rpc.log') ? (string) file_get_contents($tmp . '/rpc.log') : '';
    echo json_encode($out);
    exit;
  }

  if ($what === 'api') {
    // Une requête au VRAI api.php (« me »).
    $GLOBALS['OROLADO_FAKE_INPUT'] = (string) file_get_contents($argv[4]);
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_SERVER['REMOTE_ADDR'] = '127.0.0.9';
    require $tmp . '/api.php';
    exit;
  }

  // what === 'snap' : tout ce que voient les joueurs et l'admin.
  // Pas de rangement pendant la photo (comme entre deux passages).
  @touch(orolado_data_dir() . '/archive/.last');
  @mkdir(orolado_orders_dir(), 0755, true);
  @touch(orolado_orders_dir() . '/.move');
  foreach (glob(orolado_data_dir() . '/top/*.json') ?: [] as $f) @unlink($f);
  $db = load_db();
  $snap = [];
  $api = function (array $req) use ($tmp): array {
    $f = $tmp . '/req_' . bin2hex(random_bytes(4)) . '.json';
    file_put_contents($f, json_encode($req));
    $o = (string) shell_exec(escapeshellarg(PHP_BINARY) . ' -d memory_limit=1G ' . escapeshellarg(__FILE__) . ' phase ' . escapeshellarg($tmp) . ' api ' . escapeshellarg($f));
    @unlink($f);
    return json_decode($o, true) ?: ['raw' => substr($o, 0, 400)];
  };
  foreach ($seed['users'] as $i => $uid) {
    $u = $db['users'][$uid];
    $r = [];
    if ($i < 6) {
      $me = $api(['action' => 'me', 'token' => $seed['tokens'][$uid]]);
      $r['me.positions'] = $me['positions'] ?? $me;
      $r['me.openOrders'] = $me['openOrders'] ?? null;
    }
    $r['tradeHistory'] = orolado_trade_history($db, $uid, 0, 200);
    $r['wagered'] = orolado_user_real_wagered($db, $u + ['id' => $uid]);
    $r['books'] = orolado_real_from_books($db, $uid, $u);
    $w = ['depositTs' => (int) ($now - 3 * 86400), 'until' => (int) ($now + 86400)];
    orolado_bonus_scan($db, $uid, $w, false);
    $r['bonus.real'] = [$w['staked'] ?? 0, count($w['seen'] ?? [])];
    $w = ['depositTs' => (int) ($now - 3 * 86400), 'until' => (int) ($now + 86400)];
    orolado_bonus_scan($db, $uid, $w, true);
    $r['bonus.demo'] = [$w['staked'] ?? 0, count($w['seen'] ?? [])];
    foreach (['v100', 'v75', 'stable'] as $mk) {
      $st = ['activatedAt' => $now - 30 * 3600, 'expiresAt' => $now, 'market' => $mk];
      $r['defi.' . $mk] = [orolado_defi_progress($db, $uid, $st, 'demo'), orolado_defi_progress($db, $uid, $st, 'real')];
    }
    $r['duel'] = live_duel_score($db, $uid, (int) ($now - 20 * 3600), (int) ($now - 2 * 3600));
    $ms = live_my_stats($uid);
    unset($ms['duels']);
    $r['mystats'] = $ms;
    $snap['user.' . $i] = $r;
  }
  $top = orolado_top_status($db, ['id' => $seed['users'][0]] + $db['users'][$seed['users'][0]]);
  unset($top['now']);
  $snap['top'] = $top;
  $snap['gameStats'] = orolado_orders_game_stats($db);
  $snap['found'] = [];
  foreach ($seed['sample'] as [$uid, $oid]) {
    $o = orolado_trade_find($db, $uid, $oid);
    $snap['found'][] = $o ? orolado_trade_public($o) : null;
  }
  // Admin : trades réels (30 jours) et fiche d'un joueur, partie « fichier local » (Supabase vide ici).
  if (is_file($tmp . '/admin_lib.php')) {
    try {
      require_once $tmp . '/admin_lib.php';
      foreach (glob(orolado_data_dir() . '/admin_cache_*.json') ?: [] as $f) @unlink($f);
      $ao = admin_orders();
      usort($ao, static fn($a, $b) => strcmp((string) $a['id'], (string) $b['id']));
      $snap['admin_orders'] = $ao;
      $snap['admin_orders_for_user'] = admin_orders_for_user($seed['users'][1]);
    } catch (Throwable $e) {
      $snap['admin_error'] = $e->getMessage();
    }
  }
  echo json_encode($snap, JSON_PRESERVE_ZERO_FRACTION);
  exit;
}

// ------------------------------------------------------------------------------------------------
// Test principal.
// ------------------------------------------------------------------------------------------------
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$tmp = sys_get_temp_dir() . '/orolado_rng_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (glob($root . '/*.php') ?: [] as $f) copy($f, $tmp . '/' . basename($f));
foreach (['indices.json'] as $f) if (is_file($root . '/' . $f)) copy($root . '/' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['OROLADO_FAKE_HTTP'] = fn() => [];
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';

// --- Base : 40 joueurs, 10 000 trades réglés sur 40 h + trades récents + trades ouverts. ---
mt_srand(20261020);
$now = microtime(true);
$db = blank_db();
$users = [];
$tokens = [];
for ($i = 0; $i < 40; $i++) {
  $h = md5('rng' . $i);
  $uid = substr($h, 0, 8) . '-' . substr($h, 8, 4) . '-4' . substr($h, 13, 3) . '-a' . substr($h, 17, 3) . '-' . substr($h, 20, 12);
  $users[] = $uid;
  $db['users'][$uid] = ['id' => $uid, 'email' => "rng$i@test.local", 'displayName' => "Joueur $i", 'role' => 'user', 'createdAt' => date('c', (int) $now - 9 * 86400),
    'publicId' => 'ORO-' . (200000 + $i), 'realStakeVolume' => 0, 'transactions' => []];
  $db['vault'][$uid] = ['demo' => 500000, 'real' => 100];
  $tok = bin2hex(random_bytes(24));
  $db['sessions'][$tok] = ['userId' => $uid, 'at' => date('c'), 'exp' => time() + 86400 * 30];
  $tokens[$uid] = $tok;
}
$assets = ['v100', 'v75', 'stable', 'apex500', 'horizon50'];
$durs = [5, 10, 30, 60];
$K = 10000;
$span = 40 * 3600;
$ids = [];
$movedReal = $movedDemo = null;
$sample = [];
$mk = function (int $k, string $uid, float $at, string $status) use (&$assets, &$durs): array {
  $mode = mt_rand(1, 100) <= 15 ? 'real' : 'demo';
  $stake = [1, 2, 5, 10, 20, 50][mt_rand(0, 5)];
  $dur = $durs[mt_rand(0, 3)];
  $payout = [1.5, 1.88, 1.9, 2.5][mt_rand(0, 3)];
  $o = ['id' => 'r' . $k . '_' . bin2hex(random_bytes(3)), 'userId' => $uid, 'payId' => $uid, 'stake' => $stake, 'side' => mt_rand(0, 1) ? 'call' : 'put',
    'duration' => $dur, 'mode' => $mode, 'accountType' => $mode, 'assetId' => $assets[mt_rand(0, 4)], 'payout' => $payout, 'payoutMult' => $payout,
    'entryTick' => 7000000 + $k, 'entryCents' => 123400 + mt_rand(0, 300), 'expiryTick' => 7000000 + $k + $dur * 4, 'barrierCents' => 123456,
    'openPrice' => 1234.5, 'won' => null, 'status' => 'open', 'at' => $at, 'openedAt' => $at, 'expiryAt' => $at + $dur, 'stakeTaken' => $mode === 'real', 'fair' => 1];
  if ($mode === 'real') $o['settleKey'] = 'trs_x_' . $o['id'];
  if ($status !== 'open') {
    $o['status'] = $status;
    $o['won'] = $status === 'won';
    $o['voided'] = $status === 'void';
    $o['net'] = $status === 'won' ? round($stake * ($payout - 1), 2) : ($status === 'void' ? 0.0 : -$stake);
    $o['exitCents'] = 123500;
    $o['closePrice'] = 1235.0;
    $o['settledAt'] = $at + $dur + mt_rand(0, 900) / 1000;
    $o['paidOut'] = true;
  }
  return $o;
};
for ($k = 0; $k < $K; $k++) {
  // Joueur 0 très actif, les autres au hasard. Heures croissantes (ordre du fichier = ordre des heures).
  $uid = mt_rand(1, 5) === 1 ? $users[0] : $users[mt_rand(1, 39)];
  $at = $now - $span + $k * ($span - 600) / $K;
  $st = ['won', 'lost', 'lost', 'won', 'void'][mt_rand(0, 4)];
  $o = $mk($k, $uid, $at, $st);
  // Un ordre sans « mode » de temps en temps (anciens ordres) : lu par tous les lecteurs comme avant.
  if ($k % 997 === 0) unset($o['mode']);
  $db['orders'][] = $o;
  $ids[$uid . '|' . $o['id']] = 1;
  if ($k % 500 === 7) $sample[] = [$uid, $o['id']];
  if ($k === 4000 && ($o['mode'] ?? '') === 'real') $movedReal = [$uid, $o['id']];
}
// Garantit un ordre réel et un démo bien anciens (rangés ensuite) pour le test de rejeu.
foreach ($db['orders'] as $o) {
  if ($movedReal === null && ($o['mode'] ?? '') === 'real' && $o['status'] !== 'void') $movedReal = [$o['userId'], $o['id']];
  if ($movedDemo === null && ($o['mode'] ?? '') === 'demo') $movedDemo = [$o['userId'], $o['id']];
}
// Réglés il y a quelques secondes (moins de OROLADO_ORDERS_HOT_SEC : restent dans le fichier).
for ($k = $K; $k < $K + 60; $k++) {
  $uid = $users[$k % 6];
  $o = $mk($k, $uid, $now - 80 + ($k - $K), 'won');
  $o['settledAt'] = $now - 3 - ($k - $K) * 0.1;
  $db['orders'][] = $o;
  $ids[$uid . '|' . $o['id']] = 1;
}
// Trades ouverts (expiration dans 1 h : pas réglés pendant le test).
for ($k = $K + 60; $k < $K + 80; $k++) {
  $uid = $users[$k % 6];
  $o = $mk($k, $uid, $now - 5, 'open');
  $o['expiryTick'] = (int) ((($now + 3600) * 1000) / OROLADO_TICK_MS);
  $o['expiryAt'] = $now + 3600;
  $db['orders'][] = $o;
  $ids[$uid . '|' . $o['id']] = 1;
}
save_db(orolado_data_file(), $db);
file_put_contents($tmp . '/seed.json', json_encode(['now' => $now, 'users' => $users, 'tokens' => $tokens, 'sample' => $sample,
  'movedReal' => $movedReal, 'movedDemo' => $movedDemo]));
$size0 = filesize(orolado_data_file());
printf("Base : %d trades, orolado.json = %.2f Mo\n", count($db['orders']), $size0 / 1048576);

$phase = function (string $what) use ($tmp): array {
  $o = (string) shell_exec(escapeshellarg(PHP_BINARY) . ' -d memory_limit=2G ' . escapeshellarg(__FILE__) . ' phase ' . escapeshellarg($tmp) . ' ' . $what . ' 2>&1');
  $j = json_decode($o, true);
  if (!is_array($j)) { echo "  sortie : " . substr($o, 0, 600) . "\n"; return []; }
  return $j;
};
$diff = function (array $a, array $b, string $path = '') use (&$diff): string {
  foreach (array_unique(array_merge(array_keys($a), array_keys($b))) as $k) {
    if (!array_key_exists($k, $a) || !array_key_exists($k, $b)) return $path . '/' . $k . ' (absent d’un côté)';
    if (is_array($a[$k]) && is_array($b[$k])) { $d = $diff($a[$k], $b[$k], $path . '/' . $k); if ($d !== '') return $d; continue; }
    if ($a[$k] !== $b[$k]) return $path . '/' . $k . ' : ' . json_encode($a[$k]) . ' ≠ ' . json_encode($b[$k]);
  }
  return '';
};

echo "1) Photo AVANT rangement (tout dans orolado.json)\n";
$before = $phase('snap');
check('photo prise', count($before) > 40, (string) count($before));
check('admin lisible', !isset($before['admin_error']), (string) ($before['admin_error'] ?? ''));
$posCount = count($before['user.0']['me.positions'] ?? []);
check('« me » rend les positions du joueur actif', $posCount > 100, (string) $posCount);
check('« me » rend ses trades ouverts', count($before['user.0']['me.openOrders'] ?? []) > 0 || count($before['user.1']['me.openOrders'] ?? []) > 0);
// La photo n'est pas vide (sinon « identique » ne prouverait rien).
$u0 = $before['user.0'] ?? [];
check('historique réel, misé, grand livre non vides', count($u0['tradeHistory']['rows'] ?? []) > 50 && ($u0['wagered'] ?? 0) > 0 && $u0['books'] !== null,
  count($u0['tradeHistory']['rows'] ?? []) . ' / ' . json_encode($u0['wagered'] ?? null) . ' / ' . json_encode($u0['books'] ?? null));
check('bonus (réel et démo) non vides', ($u0['bonus.real'][1] ?? 0) > 50 && ($u0['bonus.demo'][1] ?? 0) > 500, json_encode([$u0['bonus.real'] ?? null, $u0['bonus.demo'] ?? null]));
check('défi, duel, statistiques non vides', ($u0['duel']['n'] ?? 0) > 100 && json_encode($u0['mystats'] ?? []) !== '[]', json_encode([$u0['duel'] ?? null]));
check('classement et statistiques admin non vides', ($before['top']['players'] ?? 0) > 5 && ($before['gameStats']['total'] ?? 0) === 10080
  && count($before['admin_orders'] ?? []) > 1000, json_encode([$before['top']['players'] ?? null, $before['gameStats']['total'] ?? null, count($before['admin_orders'] ?? [])]));

echo "2) Rangement progressif (1 500 ordres par passage, sous le verrou)\n";
$m = $phase('migrate');
check('plusieurs passages bornés', ($m['passes'] ?? 0) >= 7, json_encode($m));
$db = load_db();
$size1 = filesize(orolado_data_file());
check('fichier principal petit après rangement', $size1 < 0.1 * $size0 && $size1 < 512 * 1024, sprintf('%.2f Mo → %.0f Ko', $size0 / 1048576, $size1 / 1024));
$left = 0; $open = 0;
foreach ($db['orders'] as $o) { $left++; if (($o['status'] ?? '') === 'open') $open++; }
check('restent : trades ouverts + réglés depuis quelques secondes', $left === 80 && $open === 20, "$left / $open");
check('copie de sécurité de l’ancien fichier', count(glob($tmp . '/data/archive/orolado-avant-ordres-*.json') ?: []) === 1
  && filesize((glob($tmp . '/data/archive/orolado-avant-ordres-*.json'))[0]) === $size0);
// Aucun ordre perdu ni doublé : fichier + rangement = la base de départ, exactement.
$all = [];
$dup = 0;
foreach ($db['orders'] as $o) { $k = $o['userId'] . '|' . $o['id']; if (isset($all[$k])) $dup++; $all[$k] = 1; }
foreach (glob($tmp . '/data/orders/day/*.jsonl') ?: [] as $f) {
  foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) { $o = json_decode($l, true); $k = $o['userId'] . '|' . $o['id']; if (isset($all[$k])) $dup++; $all[$k] = 1; }
}
check('aucun ordre perdu', count(array_diff_key($ids, $all)) === 0, (string) count(array_diff_key($ids, $all)));
check('aucun ordre en double, aucun inventé', $dup === 0 && count($all) === count($ids), "$dup / " . count($all));
$perUser = 0;
foreach (glob($tmp . '/data/orders/user/*/*.jsonl') ?: [] as $f) $perUser += count(file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES));
check('fichiers par joueur complets', $perUser === count($ids) - 80, (string) $perUser);

echo "3) Photo APRÈS rangement : tout doit être identique\n";
$after = $phase('snap');
foreach ($before as $k => $v) {
  if (str_starts_with($k, 'user.')) {
    foreach ($v as $kk => $vv) {
      $d = is_array($vv) && is_array($after[$k][$kk] ?? null) ? $diff($vv, $after[$k][$kk]) : (($vv === ($after[$k][$kk] ?? '§')) ? '' : json_encode($after[$k][$kk] ?? null));
      if ($d !== '' || !array_key_exists($kk, $after[$k] ?? [])) check("$k $kk identique", false, $d);
      else $pass++;
    }
    continue;
  }
  $d = is_array($v) && is_array($after[$k] ?? null) ? $diff($v, $after[$k]) : (($v === ($after[$k] ?? '§')) ? '' : 'différent');
  check("$k identique", $d === '', $d);
}
echo '  (' . $pass . " comparaisons OK au total)\n";

echo "4) Lignes en double après un arrêt brutal (rangement écrit, fichier principal pas encore) : sans effet\n";
foreach (glob($tmp . '/data/orders/day/*.jsonl') ?: [] as $f) { $c = file_get_contents($f); file_put_contents($f, $c . substr($c, 0, 2000)); }
foreach (glob($tmp . '/data/orders/user/*/*.jsonl') ?: [] as $f) { $c = file_get_contents($f); file_put_contents($f, rtrim($c, "\n") . "\n" . $c); }
foreach (glob($tmp . '/data/orders/day/*.idx') ?: [] as $f) { $c = file_get_contents($f); file_put_contents($f, $c . $c); }
$again = $phase('snap');
$d = $diff($before, $again);
check('photo identique malgré les doublons', $d === '', $d);

echo "5) Règlement redemandé / ordre renvoyé APRÈS rangement\n";
$r = $phase('replay');
foreach (['real', 'demo'] as $mode) {
  $x = $r[$mode] ?? [];
  check("$mode : règlement redemandé → ok, déjà réglé", !empty($x['settle']['ok']) && !empty($x['settle']['order']['settled']), json_encode($x['settle'] ?? null));
  check("$mode : ordre renvoyé → doublon, pas de nouvel ordre", !empty($x['place']['duplicate']) && ($x['inMain'] ?? -1) === 0, json_encode([$x['place'] ?? null, $x['inMain'] ?? null]));
  check("$mode : solde inchangé", ($x['vaultBefore'] ?? 1) == ($x['vaultAfter'] ?? 2), json_encode([$x['vaultBefore'] ?? null, $x['vaultAfter'] ?? null]));
}
check('aucun crédit ni débit demandé à la caisse', ($r['rpc'] ?? 'x') === '', substr((string) ($r['rpc'] ?? ''), 0, 200));

echo "6) Archivage de 2 jours (heure de coupe) puis passage des vieux jours dans l'archive mensuelle\n";
// Comme si l'archivage des 10 min passait plus tard : coupe à « maintenant − 20 h ».
$C = $now - 20 * 3600;
with_db_lock(static function ($box) use ($C) { $box->db['ordersArchCut'] = $C; return ['ok' => true]; });
$GLOBALS['OROLADO_ORD_RAW'] = [];
$db = load_db();
$want = [];
foreach ($db['orders'] as $o) $want[$o['userId'] . '|' . $o['id']] = 1;
foreach (glob($tmp . '/data/orders/day/*.jsonl') ?: [] as $f) {
  foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) { $o = json_decode($l, true); if (is_array($o) && orolado_order_key($o) >= $C) $want[$o['userId'] . '|' . $o['id']] = 1; }
}
$got = [];
foreach (orolado_orders_recent($db) as $o) $got[$o['userId'] . '|' . $o['id']] = ($got[$o['userId'] . '|' . $o['id']] ?? 0) + 1;
check('après la coupe : seulement les ordres réglés après elle (comme l’ancien archivage)', count($got) === count($want) && !array_diff_key($want, $got) && max($got) === 1,
  count($got) . ' / ' . count($want));
$u0 = $users[0];
$gotU = array_filter(orolado_orders_recent($db, [$u0]), static fn($o) => $o['userId'] === $u0);
$wantU = array_filter(array_keys($want), static fn($k) => str_starts_with($k, $u0 . '|'));
check('même chose par joueur', count($gotU) === count($wantU), count($gotU) . ' / ' . count($wantU));
// Les jours entièrement plus vieux que (coupe − 1 jour) partent dans data/archive/orders-AAAA-MM.jsonl.
$before6 = [];
foreach (glob($tmp . '/data/orders/day/*.jsonl') ?: [] as $f) foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) { $o = json_decode($l, true); if (is_array($o)) $before6[$o['userId'] . '|' . $o['id']] = 1; }
$cutFar = $now + 3 * 86400; // tous les jours rangés sont « vieux »
$nT = orolado_orders_transfer_old($cutFar);
$arch = [];
foreach (glob($tmp . '/data/archive/orders-*.jsonl') ?: [] as $f) foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) { $o = json_decode($l, true); if (is_array($o)) $arch[$o['userId'] . '|' . $o['id']] = 1; }
check('tous les jours rangés passés dans l’archive mensuelle, rien perdu', $nT > 0 && !array_diff_key($before6, $arch), $nT . ' lignes, ' . count(array_diff_key($before6, $arch)) . ' manquants');
check('jours rangés et fichiers de joueurs effacés ensuite', !(glob($tmp . '/data/orders/day/*') ?: []) && !(glob($tmp . '/data/orders/user/*/*.jsonl') ?: []));

exec('rm -rf ' . escapeshellarg($tmp));
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
