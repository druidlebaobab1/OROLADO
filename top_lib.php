<?php
declare(strict_types=1);
/**
 * Classement DÉMO de la semaine (v2414) — du lundi 00:00 au dimanche 23:59:59 (heure du serveur, UTC).
 * Score = rendement en points : 1000 × (gain net ÷ total misé). Il faut au moins 20 trades réglés
 * (gagnés ou perdus) en démo pour entrer. Aucun montant en dollars n'est montré aux joueurs.
 * Le propriétaire récompense lui-même les meilleurs (liste complète visible par l'admin).
 *
 * Ne touche NI aux prix NI aux trades : lit seulement les ordres déjà réglés. Comme les trades de plus
 * de 2 jours partent dans data/archive/orders-AAAA-MM.jsonl, le classement garde son propre compteur
 * (data/top/AAAA-Wss.json, chaque trade compté une seule fois par son identifiant) et relit les
 * archives de la semaine si personne ne l'a mis à jour depuis plus d'un jour.
 */

const OROLADO_TOP_MIN_TRADES = 20;
const OROLADO_TOP_SHOW = 50;

function orolado_top_public(): bool {
  $v = getenv('OROLADO_TOP_PUBLIC');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_TOP_PUBLIC'] ?? '';
  return (string) $v === '1';
}

function orolado_top_allowed(array $user): bool {
  return orolado_top_public() || (function_exists('orolado_is_admin_user') && orolado_is_admin_user($user));
}

/** Début (lundi 00:00) et fin (dimanche 23:59:59) de la semaine qui contient $now. */
function orolado_top_week(int $now): array {
  $start = (int) strtotime('monday this week 00:00:00', $now);
  if ($start > $now) $start -= 7 * 86400;
  return ['key' => date('o-\WW', $start), 'start' => $start, 'end' => $start + 7 * 86400 - 1];
}

function orolado_top_file(string $key): string {
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'top';
  if (!is_dir($dir)) @mkdir($dir, 0750, true);
  return $dir . DIRECTORY_SEPARATOR . preg_replace('/[^0-9W-]/', '', $key) . '.json';
}

/** Ajoute un ordre réglé au compteur de la semaine (une seule fois par identifiant). */
function orolado_top_add(array &$st, array $o, int $start, int $end): void {
  if (!is_array($o) || (string) ($o['mode'] ?? $o['accountType'] ?? '') !== 'demo') return;
  $status = (string) ($o['status'] ?? '');
  if ($status !== 'won' && $status !== 'lost') return;
  $id = (string) ($o['id'] ?? '');
  $uid = (string) ($o['userId'] ?? '');
  if ($id === '' || $uid === '' || isset($st['seen'][$id])) return;
  $t = (float) ($o['openedAt'] ?? $o['at'] ?? 0);
  if ($t < $start || $t > $end) return;
  $stake = orolado_money($o['stake'] ?? 0);
  if ($stake <= 0) return;
  $net = isset($o['net']) ? orolado_money($o['net']) : ($status === 'lost' ? -$stake : 0.0);
  $st['seen'][$id] = 1;
  if (!isset($st['users'][$uid])) $st['users'][$uid] = ['n' => 0, 'w' => 0, 'stake' => 0.0, 'net' => 0.0];
  $u =& $st['users'][$uid];
  $u['n']++;
  if ($status === 'won') $u['w']++;
  $u['stake'] = round($u['stake'] + $stake, 2);
  $u['net'] = round($u['net'] + $net, 2);
  unset($u);
}

/** Met à jour le compteur de la semaine (au plus une fois toutes les 30 s). */
function orolado_top_scan(array $db, array $wk, bool $force = false): array {
  $file = orolado_top_file($wk['key']);
  $fp = @fopen($file, 'c+');
  if (!$fp) return [];
  flock($fp, LOCK_EX);
  $st = json_decode(stream_get_contents($fp) ?: '', true);
  if (!is_array($st)) $st = [];
  $st += ['seen' => [], 'users' => [], 'scanAt' => 0, 'archAt' => 0];
  $now = time();
  if ($force || $now - (int) $st['scanAt'] >= 30) {
    // Archives de la semaine : la première fois, puis si personne n'a regardé depuis plus d'un jour.
    if ((int) $st['archAt'] === 0 || $now - (int) $st['scanAt'] > 86400) {
      $months = array_unique([date('Y-m', $wk['start']), date('Y-m', min($now, $wk['end']))]);
      foreach ($months as $ym) {
        $af = orolado_data_dir() . '/archive/orders-' . $ym . '.jsonl';
        $h = is_file($af) ? @fopen($af, 'r') : false;
        if (!$h) continue;
        while (($line = fgets($h)) !== false) {
          if (strpos($line, '"demo"') === false) continue;
          $o = json_decode($line, true);
          if (is_array($o)) orolado_top_add($st, $o, $wk['start'], $wk['end']);
        }
        fclose($h);
      }
      $st['archAt'] = $now;
    }
    foreach (($db['orders'] ?? []) as $o) orolado_top_add($st, $o, $wk['start'], $wk['end']);
    $st['scanAt'] = $now;
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($st));
    fflush($fp);
  }
  flock($fp, LOCK_UN);
  fclose($fp);
  return $st;
}

/** Nom affiché : prénom + initiale (« Awa K. »), jamais l'e-mail. */
function orolado_top_name(array $u): string {
  $n = trim(preg_replace('/\s+/', ' ', (string) ($u['displayName'] ?? '')) ?? '');
  if ($n === '' || str_contains($n, '@')) $n = 'Joueur';
  $parts = explode(' ', $n);
  // Sans mbstring (absent sur certains serveurs) : découpe par lettres UTF-8.
  $first = preg_match('/^.{1,14}/us', $parts[0], $m1) ? $m1[0] : $parts[0];
  $init = '';
  if (isset($parts[1]) && preg_match('/^./us', $parts[1], $m2)) {
    $c = $m2[0];
    $init = ' ' . (function_exists('mb_strtoupper') ? mb_strtoupper($c) : strtoupper($c)) . '.';
  }
  return $first . $init;
}

/** Classement trié : points décroissants, puis plus de trades, puis plus ancien. */
function orolado_top_rank(array $db, array $st): array {
  $rows = [];
  foreach (($st['users'] ?? []) as $uid => $a) {
    if ((int) $a['n'] < OROLADO_TOP_MIN_TRADES || (float) $a['stake'] <= 0) continue;
    $u = $db['users'][$uid] ?? null;
    if (!is_array($u)) continue;
    if (function_exists('orolado_is_admin_user') && orolado_is_admin_user($u + ['id' => $uid])) continue;
    if (function_exists('orolado_user_block_kind') && orolado_user_block_kind($db, (string) $uid) !== '') continue;
    $rows[] = [
      'uid' => (string) $uid,
      // v2415 : anonyme — seulement le numéro ORO du joueur (ni nom, ni pays).
      'id' => (string) ($u['publicId'] ?? '') !== '' ? (string) $u['publicId'] : 'ORO-' . strtoupper(substr(hash('sha256', (string) $uid), 0, 6)),
      'points' => (int) round(1000 * (float) $a['net'] / (float) $a['stake']),
      'trades' => (int) $a['n'],
      'wins' => (int) $a['w'],
    ];
  }
  usort($rows, static fn($x, $y) => [$y['points'], $y['trades']] <=> [$x['points'], $x['trades']]);
  foreach ($rows as $i => &$r) $r['rank'] = $i + 1;
  unset($r);
  return $rows;
}

/** Ce que voit le joueur : Top 25, sa place, ses chiffres, le temps restant. L'admin voit plus. */
function orolado_top_status(array $db, array $user, bool $prev = false): array {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '' || !orolado_top_allowed($user)) return ['ok' => true, 'enabled' => false];
  $now = time();
  $wk = orolado_top_week($prev ? $now - 7 * 86400 : $now);
  $st = orolado_top_scan($db, $wk);
  $rank = orolado_top_rank($db, $st);
  $isAdmin = function_exists('orolado_is_admin_user') && orolado_is_admin_user($user);
  $top = [];
  foreach (array_slice($rank, 0, OROLADO_TOP_SHOW) as $r) {
    $row = ['rank' => $r['rank'], 'id' => $r['id'], 'points' => $r['points'], 'trades' => $r['trades'], 'me' => $r['uid'] === $uid];
    $top[] = $row;
  }
  $mine = $st['users'][$uid] ?? ['n' => 0, 'w' => 0, 'stake' => 0, 'net' => 0];
  $me = ['trades' => (int) $mine['n'], 'wins' => (int) $mine['w'], 'need' => max(0, OROLADO_TOP_MIN_TRADES - (int) $mine['n']),
    'points' => (float) $mine['stake'] > 0 ? (int) round(1000 * (float) $mine['net'] / (float) $mine['stake']) : 0, 'rank' => 0];
  foreach ($rank as $r) if ($r['uid'] === $uid) { $me['rank'] = $r['rank']; break; }
  return [
    'ok' => true, 'enabled' => true, 'week' => $wk['key'], 'endsAt' => $wk['end'], 'now' => $now,
    'players' => count($rank), 'min' => OROLADO_TOP_MIN_TRADES, 'show' => OROLADO_TOP_SHOW,
    'top' => $top, 'me' => $me, 'prev' => $prev, 'admin' => $isAdmin,
  ];
}
