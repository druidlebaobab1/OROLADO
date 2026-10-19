<?php
declare(strict_types=1);

/**
 * v2843 (propriétaire) — ADMIN : LES PARTIES DE JEUX (Action, Live, Casino), comme les trades.
 *
 * Lecture seule du journal écrit par casino_round_log() (casino_lib.php) :
 *   data/casino/rounds/AAAA-MM.jsonl  — toutes les parties (direct + statistiques)
 *   data/casino/ur/<joueur>.jsonl     — les parties d'un joueur (sa fiche)
 * Les parties d'avant le journal (40 dernières par joueur, fichier casino du joueur) s'affichent aussi dans la fiche.
 *
 * Statistiques : mêmes règles que les trades — le compte admin ne compte pas (admin_stat_visible_user_ids),
 * rien avant admin_stat_cutoff_ts(). Rien ne touche à l'argent.
 */

require_once __DIR__ . '/casino_lib.php';

const ADMIN_GM_SEC_LABEL = ['action' => 'Action', 'live' => 'Live', 'casino' => 'Casino'];

/** Section du jeu, comme dans la salle de jeux : Action (à toi de jouer), Live (tours communs), Casino (le reste). */
function admin_gm_section(string $g): string {
  if (function_exists('casino_ext_type') && casino_ext_type($g) === 'skill') return 'action';
  if (casino_is_crash($g) || casino_is_draw($g)) return 'live';
  return 'casino';
}

/** Nom affiché du jeu (le même que sur le site). */
function admin_gm_name(string $g): string {
  static $names = null;
  if ($names === null) {
    $names = ['crash' => 'Sky Rush', 'jet' => 'Jet Man', 'rocket' => 'Rocket', 'mines' => 'Mines', 'apple' => 'Golden Orchard', 'tower' => 'Tower',
      'plinko' => 'Cascade', 'dice' => 'Dice', 'limbo' => 'Target', 'wheel' => 'Lucky Wheel', 'roulette' => 'Roulette', 'slots' => 'Lucky 777',
      'coin' => 'Coin Flip', 'keno' => 'Keno', 'scratch' => 'Scratch Card', 'hilo' => 'Hi-Lo', 'dragon' => 'Dragon Tiger', 'baccarat' => 'Baccarat',
      'sicbo' => 'Sic Bo', 'chests' => 'Treasure', 'balloon' => 'Balloon', 'penalty' => 'Penalty', 'race' => 'Racing', 'colors' => 'Colors',
      'darts' => 'Darts', 'cryptox' => 'Crypto Live', 'horses' => 'Horse Race', 'rps' => 'Rock Paper Scissors', 'lotto' => 'Oro Lotto',
      'planets' => 'Lucky Planets', 'catwalk' => 'Miss Catwalk', 'fleets' => 'Star Fleets', 'gemcount' => 'Gem Count', 'claw' => 'Lucky Claw'];
    if (function_exists('casino_ext_names')) foreach (casino_ext_names() as $k => $n) if (!isset($names[$k])) $names[$k] = $n;
  }
  return $names[$g] ?? ucfirst($g);
}

/** Tous les jeux connus du serveur (les anciens + toutes les fiches casino_ext). */
function admin_gm_all_games(): array {
  return array_values(array_unique(array_merge(CASINO_GAMES, function_exists('casino_ext_keys') ? casino_ext_keys() : [])));
}

/** Date de début du journal (0 = aucune partie encore enregistrée). */
function admin_gm_log_start(): int {
  $f = casino_dir('rounds') . DIRECTORY_SEPARATOR . '.start';
  return is_file($f) ? (int) @file_get_contents($f) : 0;
}

/** Une ligne du journal → ligne propre (null si illisible). */
function admin_gm_parse(string $line): ?array {
  $line = trim($line);
  if ($line === '' || $line[0] !== '{') return null;
  $r = json_decode($line, true);
  // ligne précédente coupée (écriture interrompue) collée devant celle-ci : on garde la partie complète
  if (!is_array($r) && ($p = strrpos($line, '{"t":')) > 0) $r = json_decode(substr($line, $p), true);
  if (!is_array($r) || !isset($r['t'], $r['u'], $r['g'], $r['m'])) return null;
  return ['t' => (float) $r['t'], 'u' => (string) $r['u'], 'g' => (string) $r['g'], 'm' => (string) $r['m'] === 'real' ? 'real' : 'demo',
    's' => (float) ($r['s'] ?? 0), 'w' => (float) ($r['w'] ?? 0), 'x' => (float) ($r['x'] ?? 0), 'r' => (string) ($r['r'] ?? ''), 'v' => !empty($r['v'])];
}

/**
 * Lit un fichier du journal À L'ENVERS (la plus récente d'abord), par blocs de 64 Ko : le direct ne relit pas tout le mois.
 * $fn(ligne) renvoie false pour arrêter. Renvoie false si on a arrêté.
 */
function admin_gm_read_rev(string $file, callable $fn): bool {
  $fp = @fopen($file, 'rb');
  if (!$fp) return true;
  @flock($fp, LOCK_SH);
  fseek($fp, 0, SEEK_END);
  $pos = ftell($fp);
  $buf = '';
  $go = true;
  while ($go && $pos > 0) {
    $n = (int) min(65536, $pos);
    $pos -= $n;
    fseek($fp, $pos);
    $buf = fread($fp, $n) . $buf;
    $lines = explode("\n", $buf);
    $buf = $pos > 0 ? array_shift($lines) : '';
    for ($i = count($lines) - 1; $i >= 0; $i--) {
      $r = admin_gm_parse($lines[$i]);
      if ($r !== null && $fn($r) === false) { $go = false; break; }
    }
  }
  if ($go && $buf !== '') { $r = admin_gm_parse($buf); if ($r !== null && $fn($r) === false) $go = false; }
  @flock($fp, LOCK_UN);
  fclose($fp);
  return $go;
}

/** Fichiers mensuels du journal, du plus récent au plus ancien (seulement depuis $sinceTs si donné). */
function admin_gm_month_files(int $sinceTs = 0): array {
  $files = glob(casino_dir('rounds') . DIRECTORY_SEPARATOR . '*.jsonl') ?: [];
  rsort($files);
  if ($sinceTs > 0) {
    $min = gmdate('Y-m', $sinceTs);
    $files = array_values(array_filter($files, static fn($f) => basename($f, '.jsonl') >= $min));
  }
  return $files;
}

/**
 * Qui a joué : id du journal (id local du site ou UUID) → fiche du joueur dans l'admin
 * {pid (id de la fiche), publicId, name, email, vis (compte dans les stats), adm (compte admin)}.
 */
function admin_gm_who(string $uid): array {
  static $idx = null, $memo = [];
  if (isset($memo[$uid])) return $memo[$uid];
  if ($idx === null) {
    $idx = ['p' => [], 'em' => [], 'vis' => [], 'loc' => []];
    foreach (admin_profiles() as $p) {
      $id = (string) ($p['id'] ?? '');
      if ($id === '') continue;
      $idx['p'][$id] = $p;
      $em = strtolower(trim((string) ($p['email'] ?? '')));
      if ($em !== '') $idx['em'][$em] = $id;
    }
    $idx['vis'] = admin_stat_visible_user_ids();
    foreach ((admin_local_db()['users'] ?? []) as $id => $u) if (is_array($u)) $idx['loc'][(string) $id] = $u;
  }
  $pid = '';
  $loc = $idx['loc'][$uid] ?? [];
  if (isset($idx['p'][$uid])) $pid = $uid;
  elseif ($loc && isset($idx['p'][(string) ($loc['sbId'] ?? '')])) $pid = (string) $loc['sbId'];
  elseif ($loc) $pid = $idx['em'][strtolower(trim((string) ($loc['email'] ?? '')))] ?? '';
  $p = $pid !== '' ? $idx['p'][$pid] : [];
  $adm = admin_is_protected_account($loc ?: $p, $uid) || ($p && admin_is_protected_account($p, $pid));
  return $memo[$uid] = [
    'pid' => $pid,
    'publicId' => (string) ($p['publicId'] ?? ($loc['publicId'] ?? '')),
    'name' => (string) (($p['name'] ?? '') !== '' ? $p['name'] : ($loc['displayName'] ?? $loc['name'] ?? '')),
    'email' => (string) (($p['email'] ?? '') !== '' ? $p['email'] : ($loc['email'] ?? '')),
    'vis' => !$adm && $pid !== '' && isset($idx['vis'][$pid]),
    'adm' => $adm,
  ];
}

/** Ligne envoyée au navigateur. */
function admin_gm_out(array $r, bool $withWho): array {
  $o = [
    'k' => $r['r'] !== '' ? substr(hash('sha256', $r['r']), 0, 12) : substr(hash('sha256', $r['u'] . '|' . $r['t'] . '|' . $r['g']), 0, 12),
    't' => $r['t'],
    'at' => gmdate('c', (int) $r['t']),
    'g' => $r['g'],
    'name' => admin_gm_name($r['g']),
    'sec' => admin_gm_section($r['g']),
    'm' => $r['m'],
    's' => round($r['s'], 2),
    'w' => round($r['w'], 2),
    'x' => $r['x'] > 0 ? $r['x'] : ($r['s'] > 0 ? floor($r['w'] / $r['s'] * 100 + 1e-6) / 100 : 0),
    'res' => !empty($r['v']) ? 'void' : ($r['w'] > $r['s'] + 0.004 ? 'won' : (abs($r['w'] - $r['s']) <= 0.004 ? 'even' : ($r['w'] > 0.004 ? 'part' : 'lost'))),
  ];
  if (!empty($r['old'])) $o['old'] = 1;
  if ($withWho) {
    $w = admin_gm_who($r['u']);
    $o += ['pid' => $w['pid'], 'publicId' => $w['publicId'], 'pname' => $w['name'], 'email' => $w['email'], 'adm' => $w['adm'] ? 1 : 0];
  }
  return $o;
}

/** Ids (journal) d'un joueur de l'admin : son id, l'id local lié (sbId) et le compte local au même e-mail. */
function admin_gm_player_ids(string $pid, string $email = ''): array {
  $ids = [$pid => 1];
  $em = strtolower(trim($email));
  foreach ((admin_local_db()['users'] ?? []) as $id => $u) {
    if (!is_array($u)) continue;
    if ((string) ($u['sbId'] ?? '') === $pid || ($em !== '' && strtolower(trim((string) ($u['email'] ?? ''))) === $em)) $ids[(string) $id] = 1;
  }
  return array_keys(array_filter($ids, static fn($v, $k) => $k !== '', ARRAY_FILTER_USE_BOTH));
}

/**
 * Fiche joueur : ses parties, de la plus récente à la plus ancienne, page par page ($before = curseur « plus ancien que »).
 * $mode : '' (toutes), 'real' ou 'demo'. Avec les totaux du filtre choisi.
 */
function admin_gm_player(string $pid, string $email, string $mode, float $before, int $limit): array {
  $limit = max(1, min(200, $limit));
  $rows = [];
  $seen = [];
  $start = admin_gm_log_start();
  foreach (admin_gm_player_ids($pid, $email) as $uid) {
    $f = casino_round_user_file($uid);
    if (is_file($f)) {
      foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $r = admin_gm_parse($line);
        if ($r === null) continue;
        $key = $r['r'] !== '' ? $r['r'] : ($r['u'] . $r['t']);
        if (isset($seen[$key])) continue;
        $seen[$key] = 1;
        $rows[] = $r;
      }
    }
    // parties d'avant le journal (40 dernières gardées par joueur)
    foreach ((array) (casino_admin_player($uid)['h'] ?? []) as $k => $h) {
      if (!is_array($h)) continue;
      $at = (int) ($h['at'] ?? 0);
      if ($start > 0 && $at >= $start) continue;
      $rows[] = ['t' => $at - $k * 0.0001, 'u' => $uid, 'g' => (string) ($h['g'] ?? ''), 'm' => ($h['m'] ?? '') === 'real' ? 'real' : 'demo',
        's' => (float) ($h['s'] ?? 0), 'w' => (float) ($h['w'] ?? 0), 'x' => 0.0, 'r' => '', 'v' => false, 'old' => 1];
    }
  }
  if ($mode === 'real' || $mode === 'demo') $rows = array_values(array_filter($rows, static fn($r) => $r['m'] === $mode));
  usort($rows, static fn($a, $b) => $b['t'] <=> $a['t']);
  $tot = ['n' => 0, 'in' => 0.0, 'out' => 0.0, 'won' => 0, 'last' => 0, 'byGame' => []];
  foreach ($rows as $r) {
    $tot['n']++; $tot['in'] += $r['s']; $tot['out'] += $r['w'];
    if ($r['w'] > $r['s'] + 0.004) $tot['won']++;
    $tot['byGame'][$r['g']] = ($tot['byGame'][$r['g']] ?? 0) + 1;
  }
  arsort($tot['byGame']);
  $fav = array_slice(array_map(static fn($g, $n) => ['g' => $g, 'name' => admin_gm_name($g), 'n' => $n], array_keys($tot['byGame']), $tot['byGame']), 0, 3);
  $tot = ['n' => $tot['n'], 'in' => round($tot['in'], 2), 'out' => round($tot['out'], 2), 'house' => round($tot['in'] - $tot['out'], 2), 'won' => $tot['won'], 'fav' => $fav];
  if ($before > 0) $rows = array_values(array_filter($rows, static fn($r) => $r['t'] < $before));
  $page = array_slice($rows, 0, $limit);
  return ['ok' => true, 'rows' => array_map(static fn($r) => admin_gm_out($r, false), $page), 'more' => count($rows) > $limit, 'tot' => $tot];
}

/** Direct : toutes les parties, de la plus récente à la plus ancienne. Filtres : mode, section, jeu. */
function admin_gm_feed(string $mode, string $sec, string $game, float $before, int $limit, float $after = 0): array {
  $limit = max(1, min(200, $limit));
  $rows = [];
  $more = false;
  $cut = admin_stat_cutoff_ts();
  foreach (admin_gm_month_files() as $f) {
    $go = admin_gm_read_rev($f, static function (array $r) use (&$rows, &$more, $mode, $sec, $game, $before, $after, $limit, $cut) {
      if ($r['t'] < $cut || ($after > 0 && $r['t'] <= $after)) return false;
      if ($before > 0 && $r['t'] >= $before) return true;
      if (($mode === 'real' || $mode === 'demo') && $r['m'] !== $mode) return true;
      if ($game !== '' && $r['g'] !== $game) return true;
      if ($sec !== '' && admin_gm_section($r['g']) !== $sec) return true;
      if (count($rows) >= $limit) { $more = true; return false; }
      $rows[] = $r;
      return true;
    });
    if (!$go) break;
  }
  return ['ok' => true, 'rows' => array_map(static fn($r) => admin_gm_out($r, true), $rows), 'more' => $more, 'start' => admin_gm_log_start()];
}

/** Début (heure de l'admin) des fenêtres : aujourd'hui, 7 jours, 30 jours. */
function admin_gm_windows(): array {
  $today = strtotime(admin_day_bounds('today')[0]) ?: (time() - time() % 86400);
  return ['today' => $today, 'd7' => $today - 6 * 86400, 'd30' => $today - 29 * 86400];
}

/**
 * Statistiques des parties : par jeu (parties, misé, payé, net maison, joueurs), par section, total.
 * $period : today | d7 | d30. $mode : real | demo. Le compte admin et les comptes masqués ne comptent pas.
 */
function admin_gm_summary(string $period, string $mode): array {
  $W = admin_gm_windows();
  $period = isset($W[$period]) ? $period : 'd7';
  $mode = $mode === 'demo' ? 'demo' : 'real';
  $ck = 'gm_sum_' . $period . '_' . $mode;
  $c = admin_cache_get($ck, 20);
  if (is_array($c)) return $c;
  $since = max($W[$period], admin_stat_cutoff_ts());
  $games = [];
  foreach (admin_gm_all_games() as $g) $games[$g] = ['g' => $g, 'name' => admin_gm_name($g), 'sec' => admin_gm_section($g), 'n' => 0, 'in' => 0.0, 'out' => 0.0, 'u' => []];
  $secs = [];
  foreach (ADMIN_GM_SEC_LABEL as $k => $l) $secs[$k] = ['sec' => $k, 'label' => $l, 'n' => 0, 'in' => 0.0, 'out' => 0.0, 'u' => []];
  $all = ['n' => 0, 'in' => 0.0, 'out' => 0.0, 'u' => []];
  foreach (admin_gm_month_files($since) as $f) {
    $go = admin_gm_read_rev($f, static function (array $r) use (&$games, &$secs, &$all, $since, $mode) {
      if ($r['t'] < $since) return false;
      if ($r['m'] !== $mode) return true;
      $w = admin_gm_who($r['u']);
      if (!$w['vis']) return true;
      $g = $r['g'];
      if (!isset($games[$g])) $games[$g] = ['g' => $g, 'name' => admin_gm_name($g), 'sec' => admin_gm_section($g), 'n' => 0, 'in' => 0.0, 'out' => 0.0, 'u' => []];
      $sec = $games[$g]['sec'];
      $add = static function (array &$b) use ($r, $w): void { $b['n']++; $b['in'] += $r['s']; $b['out'] += $r['w']; $b['u'][$w['pid']] = 1; };
      $add($games[$g]); $add($secs[$sec]); $add($all);
      return true;
    });
    if (!$go) break;
  }
  $fin = static function (array $b): array {
    $b['players'] = count($b['u']); unset($b['u']);
    $b['in'] = round($b['in'], 2); $b['out'] = round($b['out'], 2); $b['house'] = round($b['in'] - $b['out'], 2);
    return $b;
  };
  $out = ['ok' => true, 'period' => $period, 'mode' => $mode, 'since' => gmdate('c', $since), 'start' => admin_gm_log_start(),
    'games' => array_values(array_map($fin, $games)), 'sections' => array_values(array_map($fin, $secs)), 'total' => $fin($all)];
  admin_cache_set($ck, $out);
  return $out;
}

/**
 * TRADES ou JEUX ? Pour aujourd'hui, 7 jours, 30 jours (argent réel, comptes visibles) : joueurs actifs, nombre,
 * volume misé, net maison, et joueurs qui font les deux.
 */
function admin_gm_compare(): array {
  $c = admin_cache_get('gm_cmp', 20);
  if (is_array($c)) return $c;
  $W = admin_gm_windows();
  $cut = admin_stat_cutoff_ts();
  $blank = static fn(): array => ['n' => 0, 'vol' => 0.0, 'house' => 0.0, 'u' => []];
  $T = []; $G = [];
  foreach ($W as $k => $_) { $T[$k] = $blank(); $G[$k] = $blank(); }
  // Trades réels (admin_orders : 30 derniers jours, comptes visibles, compte admin exclu)
  foreach (admin_orders() as $o) {
    if (($o['mode'] ?? 'real') !== 'real') continue;
    $st = (string) ($o['status'] ?? '');
    if ($st === 'void' || $st === 'open') continue;
    $t = strtotime((string) ($o['created_at'] ?? '')) ?: 0;
    if ($t < $cut) continue;
    $uid = (string) ($o['user_id'] ?? $o['userId'] ?? '');
    foreach ($W as $k => $from) {
      if ($t < $from) continue;
      $T[$k]['n']++; $T[$k]['vol'] += (float) ($o['stake'] ?? 0); $T[$k]['house'] -= (float) ($o['net'] ?? 0); $T[$k]['u'][$uid] = 1;
    }
  }
  // Parties réelles
  $since = max($W['d30'], $cut);
  foreach (admin_gm_month_files($since) as $f) {
    $go = admin_gm_read_rev($f, static function (array $r) use (&$G, $W, $since) {
      if ($r['t'] < $since) return false;
      if ($r['m'] !== 'real') return true;
      $w = admin_gm_who($r['u']);
      if (!$w['vis']) return true;
      foreach ($W as $k => $from) {
        if ($r['t'] < $from) continue;
        $G[$k]['n']++; $G[$k]['vol'] += $r['s']; $G[$k]['house'] += $r['s'] - $r['w']; $G[$k]['u'][$w['pid']] = 1;
      }
      return true;
    });
    if (!$go) break;
  }
  $rows = [];
  foreach (['today' => "Aujourd'hui", 'd7' => '7 jours', 'd30' => '30 jours'] as $k => $label) {
    $both = count(array_intersect_key($T[$k]['u'], $G[$k]['u']));
    $f = static fn(array $b): array => ['players' => count($b['u']), 'n' => $b['n'], 'vol' => round($b['vol'], 2), 'house' => round($b['house'], 2)];
    $rows[] = ['k' => $k, 'label' => $label, 'trades' => $f($T[$k]), 'games' => $f($G[$k]), 'both' => $both];
  }
  $out = ['ok' => true, 'rows' => $rows, 'start' => admin_gm_log_start()];
  admin_cache_set('gm_cmp', $out);
  return $out;
}
