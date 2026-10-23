<?php
declare(strict_types=1);
/**
 * 2026-10-23 (propriétaire : « séparer Jeux / Paris / Predict ; dans Paris, tout ce que les grands patrons regardent pour
 * repérer une faille ») — tableau de bord des PARIS (lecture seule) : coupons en ARGENT RÉEL, comptes de la maison exclus.
 * Période à l'heure du téléphone de l'admin (admin_tz). Trois familles : direct (live), avant-match (football et autres
 * sports), Predict. Alertes : joueurs qui gagnent trop souvent en direct, rafales de paris en direct sur un même match.
 */
function admin_paris_period(string $per, ?int $now = null): array {
  $now = $now ?? time();
  $d = new DateTimeImmutable('@' . $now); $d = $d->setTimezone(admin_tz());
  $d0 = $d->setTime(0, 0)->getTimestamp();
  if ($per === 'yday') return [$d0 - 86400, $d0];
  if ($per === '7') return [$d0 - 6 * 86400, $now + 1];
  if ($per === '30') return [$d0 - 29 * 86400, $now + 1];
  return [$d0, $now + 1];
}

/** Famille d'un coupon : 'live' | 'pred' | 'pre'. */
function admin_paris_kind(array $b, array $predIds): string {
  if (!empty($b['live'])) return 'live';
  foreach ((array) ($b['sel'] ?? []) as $s) if (isset($predIds[(string) ($s['ev'] ?? '')])) return 'pred';
  return 'pre';
}

function admin_paris_dash(string $per, array $bets, array $events, callable $isHouse, callable $who, ?int $now = null): array {
  [$from, $to] = admin_paris_period($per, $now);
  $predIds = [];
  foreach ($events as $e) if (is_array($e) && ($e['sport'] ?? '') === 'pred') $predIds[(string) ($e['id'] ?? '')] = (string) ($e['title'] ?? '');
  $z = static fn() => ['n' => 0, 'in' => 0.0, 'out' => 0.0, 'open' => 0, 'pot' => 0.0, 'won' => 0, 'lost' => 0];
  $tot = ['all' => $z(), 'live' => $z(), 'pre' => $z(), 'pred' => $z()];
  $hours = array_fill(0, 24, ['n' => 0, 'in' => 0.0]);
  $matches = []; $markets = []; $players = []; $big = []; $recent = []; $liveBurst = []; $opts = [];
  $tz = admin_tz();
  foreach ($bets as $b) {
    if (!is_array($b) || ($b['mode'] ?? '') !== 'real' || ($b['status'] ?? '') === 'pend') continue;
    $at = (int) ($b['at'] ?? 0);
    if ($at < $from || $at >= $to) continue;
    $uid = (string) ($b['uid'] ?? '');
    if ($isHouse($uid)) continue;
    $k = admin_paris_kind($b, $predIds);
    $st = (string) ($b['status'] ?? '');
    $stake = (float) ($b['stake'] ?? 0); $win = $st === 'open' ? 0.0 : (float) ($b['win'] ?? 0);
    foreach (['all', $k] as $g) {
      $tot[$g]['n']++; $tot[$g]['in'] += $stake; $tot[$g]['out'] += $win;
      if ($st === 'open') { $tot[$g]['open']++; $tot[$g]['pot'] += (float) ($b['pot'] ?? 0); $tot[$g]['oin'] = ($tot[$g]['oin'] ?? 0) + $stake; }
      if ($st === 'won') $tot[$g]['won']++; elseif ($st === 'lost') $tot[$g]['lost']++;
    }
    $h = (int) (new DateTimeImmutable('@' . $at))->setTimezone($tz)->format('G');
    $hours[$h]['n']++; $hours[$h]['in'] += $stake;
    $p = $players[$uid] ?? ['uid' => $uid, 'n' => 0, 'in' => 0.0, 'out' => 0.0, 'live' => 0, 'liveWon' => 0, 'won' => 0, 'max' => 0.0, 'open' => 0, 'last' => 0];
    $p['n']++; $p['in'] += $stake; $p['out'] += $win; if ($st === 'won') $p['won']++; $p['max'] = max($p['max'], $stake); if ($st === 'open') $p['open']++; $p['last'] = max($p['last'], $at);
    if ($k === 'live') { $p['live']++; if ($st === 'won') $p['liveWon']++; }
    $players[$uid] = $p;
    $nSel = max(1, count((array) ($b['sel'] ?? [])));
    foreach ((array) ($b['sel'] ?? []) as $s) {
      $mid = (string) ($s['fx'] ?? '') !== '' ? (string) $s['fx'] : (string) ($s['ev'] ?? '');
      $m = $matches[$mid] ?? ['t' => (string) ($s['t'] ?? ''), 'n' => 0, 'in' => 0.0, 'out' => 0.0, 'live' => 0];
      $m['n']++; $m['in'] += $stake / $nSel; $m['out'] += $win / $nSel; if (!empty($s['lv'])) $m['live']++;
      $matches[$mid] = $m;
      $fam = isset($s['mk']) ? (string) preg_replace('/:.*$/', '', (string) $s['mk']) : ($k === 'pred' ? 'pred' : 'autre');
      $mk = $markets[$fam] ?? ['mk' => $fam, 'n' => 0, 'in' => 0.0, 'out' => 0.0, 'won' => 0];
      $mk['n']++; $mk['in'] += $stake / $nSel; $mk['out'] += $win / $nSel; if (($s['r'] ?? null) === 'won') $mk['won']++;
      $markets[$fam] = $mk;
      if (!empty($s['lv'])) $liveBurst[$mid][] = $at;
      // option précise (match + choix) : combien de coupons, misé, payé, et ce qu'elle coûterait si elle gagne (coupons ouverts)
      $okey = $mid . '|' . (string) ($s['mk'] ?? '') . '|' . (string) ($s['k'] ?? $s['l'] ?? '');
      $o = $opts[$okey] ?? ['t' => (string) ($s['t'] ?? ''), 'l' => (string) ($s['l'] ?? ''), 'fx' => (string) ($s['fx'] ?? ''), 'n' => 0, 'in' => 0.0, 'out' => 0.0, 'exp' => 0.0, 'live' => 0, 'odd' => 0.0, 'r' => null];
      $o['n']++; $o['in'] += $stake / $nSel; $o['out'] += $win / $nSel; if ($st === 'open') $o['exp'] += (float) ($b['pot'] ?? 0);
      if (!empty($s['lv'])) $o['live']++; $o['odd'] = max($o['odd'], (float) ($s['odd'] ?? 0)); if (isset($s['r'])) $o['r'] = $s['r'];
      $opts[$okey] = $o;
    }
    $row = ['id' => (string) ($b['id'] ?? ''), 'uid' => $uid, 'at' => $at, 'kind' => $k, 'stake' => $stake, 'odd' => (float) ($b['odd'] ?? 0), 'status' => $st, 'win' => $win,
      'pot' => (float) ($b['pot'] ?? 0),
      'sel' => array_map(static fn($s) => ['t' => (string) ($s['t'] ?? ''), 'l' => (string) ($s['l'] ?? ''), 'odd' => (float) ($s['odd'] ?? 0), 'r' => $s['r'] ?? null,
        'lv' => !empty($s['lv']) ? 1 : 0, 'sc' => $s['sc'] ?? null, 'm' => $s['m'] ?? null], array_slice((array) ($b['sel'] ?? []), 0, 30)), 'nSel' => $nSel];
    $recent[] = $row;
    if ($st === 'won') $big[] = $row;
  }
  usort($recent, static fn($a, $b) => $b['at'] <=> $a['at']);
  usort($big, static fn($a, $b) => $b['win'] <=> $a['win']);
  // alertes
  $alerts = [];
  foreach ($players as $p) {
    if ($p['live'] >= 3 && $p['liveWon'] / $p['live'] >= 0.7) $alerts[] = ['lvl' => 'red', 'uid' => $p['uid'], 'txt' => 'Gagne ' . $p['liveWon'] . ' paris en direct sur ' . $p['live'] . ' : à vérifier (paris placés après un but ?)'];
    elseif ($p['out'] - $p['in'] >= 50 && $p['in'] > 0 && $p['out'] / $p['in'] >= 5) $alerts[] = ['lvl' => 'orange', 'uid' => $p['uid'], 'txt' => 'Gain net +' . number_format($p['out'] - $p['in'], 2, ',', ' ') . ' $ pour ' . number_format($p['in'], 2, ',', ' ') . ' $ misés'];
  }
  foreach ($opts as $o) {
    if ($o['n'] >= 5 || $o['exp'] >= 100) $alerts[] = ['lvl' => 'orange', 'uid' => '', 'txt' => 'Option très misée : « ' . $o['t'] . ' → ' . $o['l'] . ' » (' . $o['n'] . ' coupon(s)' . ($o['live'] ? ', dont ' . $o['live'] . ' en direct' : '') . ($o['exp'] > 0 ? ', à payer si elle gagne : ' . number_format($o['exp'], 2, ',', ' ') . ' $' : '') . ') — vérifier la cote'];
    if ($o['n'] >= 3 && $o['out'] >= 3 * max(0.01, $o['in']) && $o['out'] >= 20) $alerts[] = ['lvl' => 'red', 'uid' => '', 'txt' => 'Option qui a beaucoup payé : « ' . $o['t'] . ' → ' . $o['l'] . ' » (' . $o['n'] . ' coupons, payé ' . number_format($o['out'], 2, ',', ' ') . ' $) — cote en retard ?'];
  }
  foreach ($liveBurst as $mid => $ts) {
    sort($ts); $j = 0;
    for ($i = 0; $i < count($ts); $i++) { while ($ts[$i] - $ts[$j] > 600) $j++; if ($i - $j + 1 >= 5) { $alerts[] = ['lvl' => 'orange', 'uid' => '', 'txt' => 'Rafale : ' . ($i - $j + 1) . ' paris en direct en 10 min sur « ' . ($matches[$mid]['t'] ?? $mid) . ' »']; break; } }
  }
  $r2 = static function (array $a): array { foreach ($a as $k => $v) if (is_float($v)) $a[$k] = round($v, 2); return $a; };
  foreach ($tot as $g => $t) { $t['net'] = $t['in'] - (float) ($t['oin'] ?? 0) - $t['out']; unset($t['oin']); $tot[$g] = $r2($t); } // net : coupons réglés seulement
  $players = array_values(array_map($r2, $players));
  $sortBy = static function (array $a, callable $f): array { usort($a, $f); return array_slice($a, 0, 15); };
  $pl = ['win' => $sortBy(array_values(array_filter($players, static fn($p) => $p['out'] - $p['in'] > 0)), static fn($a, $b) => ($b['out'] - $b['in']) <=> ($a['out'] - $a['in'])),
    'lose' => $sortBy(array_values(array_filter($players, static fn($p) => $p['out'] - $p['in'] < 0)), static fn($a, $b) => ($a['out'] - $a['in']) <=> ($b['out'] - $b['in'])),
    'stake' => $sortBy($players, static fn($a, $b) => $b['in'] <=> $a['in']),
    'active' => $sortBy($players, static fn($a, $b) => $b['n'] <=> $a['n']),
    'live' => $sortBy(array_values(array_filter($players, static fn($p) => $p['live'] > 0)), static fn($a, $b) => $b['live'] <=> $a['live'])];
  $opts = array_values(array_map($r2, $opts)); usort($opts, static fn($a, $b) => [$b['n'], $b['in']] <=> [$a['n'], $a['in']]);
  $matches = array_values(array_map($r2, $matches)); usort($matches, static fn($a, $b) => $b['in'] <=> $a['in']);
  $markets = array_values(array_map($r2, $markets)); usort($markets, static fn($a, $b) => $b['in'] <=> $a['in']);
  $addWho = static fn(array $rows) => array_map(static fn($r) => $r + $who((string) ($r['uid'] ?? '')), $rows);
  $nRecent = count($recent);
  return ['ok' => true, 'per' => $per, 'from' => $from, 'to' => $to, 'tot' => $tot, 'hours' => array_map($r2, $hours),
    'matches' => array_slice($matches, 0, 25), 'markets' => array_slice($markets, 0, 15), 'options' => array_slice($opts, 0, 30),
    'pl' => array_map($addWho, $pl), 'big' => $addWho(array_slice($big, 0, 15)),
    'recent' => $addWho(array_slice($recent, 0, 60)), 'nRecent' => $nRecent, 'alerts' => $addWho($alerts)];
}

/** Coupons de la période, page par page (filtre : all | live | pre | pred | won | open | big). */
function admin_paris_coupons(string $per, string $f, int $offset, array $bets, array $events, callable $isHouse, callable $who, ?int $now = null): array {
  [$from, $to] = admin_paris_period($per, $now);
  $predIds = [];
  foreach ($events as $e) if (is_array($e) && ($e['sport'] ?? '') === 'pred') $predIds[(string) ($e['id'] ?? '')] = 1;
  $rows = [];
  foreach ($bets as $b) {
    if (!is_array($b) || ($b['mode'] ?? '') !== 'real' || ($b['status'] ?? '') === 'pend') continue;
    $at = (int) ($b['at'] ?? 0); if ($at < $from || $at >= $to) continue;
    $uid = (string) ($b['uid'] ?? ''); if ($isHouse($uid)) continue;
    $k = admin_paris_kind($b, $predIds); $st = (string) ($b['status'] ?? '');
    if (in_array($f, ['live', 'pre', 'pred'], true) && $k !== $f) continue;
    if ($f === 'won' && $st !== 'won') continue;
    if ($f === 'open' && $st !== 'open') continue;
    if ($f === 'big' && (float) ($b['stake'] ?? 0) < 10 && (float) ($b['win'] ?? 0) < 50) continue;
    $nSel = max(1, count((array) ($b['sel'] ?? [])));
    $rows[] = ['id' => (string) ($b['id'] ?? ''), 'uid' => $uid, 'at' => $at, 'kind' => $k, 'stake' => (float) ($b['stake'] ?? 0), 'odd' => (float) ($b['odd'] ?? 0), 'status' => $st,
      'win' => $st === 'open' ? 0.0 : (float) ($b['win'] ?? 0), 'pot' => (float) ($b['pot'] ?? 0), 'nSel' => $nSel,
      'sel' => array_map(static fn($s) => ['t' => (string) ($s['t'] ?? ''), 'l' => (string) ($s['l'] ?? ''), 'odd' => (float) ($s['odd'] ?? 0), 'r' => $s['r'] ?? null,
        'lv' => !empty($s['lv']) ? 1 : 0, 'sc' => $s['sc'] ?? null, 'm' => $s['m'] ?? null], array_slice((array) ($b['sel'] ?? []), 0, 30))];
  }
  usort($rows, static fn($a, $b) => $b['at'] <=> $a['at']);
  $page = array_slice($rows, max(0, $offset), 50);
  return ['ok' => true, 'rows' => array_map(static fn($r) => $r + $who($r['uid']), $page), 'more' => count($rows) > $offset + 50, 'total' => count($rows)];
}
