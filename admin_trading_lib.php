<?php
declare(strict_types=1);
/**
 * 2026-10-23 (propriétaire : « une case Trading : statistiques, les plus joués, plus grands gagnants / perdants, alertes ») —
 * tableau de bord du TRADING en argent réel (lecture seule). Source : admin_orders() (30 derniers jours, comptes de la maison
 * déjà retirés). net = gain net du JOUEUR sur l'ordre (+0,9 gagné, −1 perdu) ; maison = −net.
 */
function admin_trading_dash(string $per, array $orders, callable $who, ?int $now = null): array {
  require_once __DIR__ . '/admin_paris_lib.php';
  [$from, $to] = admin_paris_period($per, $now);
  $tz = admin_tz();
  $tot = ['n' => 0, 'in' => 0.0, 'pnet' => 0.0, 'won' => 0, 'lost' => 0, 'open' => 0, 'players' => 0];
  $hours = array_fill(0, 24, ['n' => 0, 'in' => 0.0]);
  $assets = []; $pl = []; $rows = [];
  foreach ($orders as $o) {
    if (!is_array($o)) continue;
    $t = strtotime((string) ($o['created_at'] ?? '')) ?: 0;
    if ($t < $from || $t >= $to) continue;
    $uid = (string) ($o['user_id'] ?? $o['userId'] ?? '');
    $stake = (float) ($o['stake'] ?? 0);
    $st = strtolower((string) ($o['status'] ?? ''));
    $settled = !in_array($st, ['open', 'pending', 'active', ''], true) || isset($o['won']) && $o['won'] !== null;
    $won = !empty($o['won']) && $o['won'] !== 'false';
    $net = $settled ? (float) ($o['net'] ?? ($won ? (float) ($o['payout'] ?? 0) - $stake : -$stake)) : 0.0;
    $tot['n']++; $tot['in'] += $stake;
    if ($settled) { $tot['pnet'] += $net; $won ? $tot['won']++ : $tot['lost']++; } else $tot['open']++;
    $h = (int) (new DateTimeImmutable('@' . $t))->setTimezone($tz)->format('G'); $hours[$h]['n']++; $hours[$h]['in'] += $stake;
    $a = strtoupper((string) ($o['asset_id'] ?? '?'));
    $A = $assets[$a] ?? ['a' => $a, 'n' => 0, 'in' => 0.0, 'pnet' => 0.0, 'won' => 0, 'players' => []];
    $A['n']++; $A['in'] += $stake; $A['pnet'] += $net; if ($won) $A['won']++; $A['players'][$uid] = 1; $assets[$a] = $A;
    $P = $pl[$uid] ?? ['uid' => $uid, 'n' => 0, 'in' => 0.0, 'pnet' => 0.0, 'won' => 0, 'settled' => 0, 'max' => 0.0, 'last' => 0, 'fav' => []];
    $P['n']++; $P['in'] += $stake; $P['pnet'] += $net; if ($settled) $P['settled']++; if ($won) $P['won']++; $P['max'] = max($P['max'], $stake); $P['last'] = max($P['last'], $t);
    $P['fav'][$a] = ($P['fav'][$a] ?? 0) + 1; $pl[$uid] = $P;
    $rows[] = ['t' => $t, 'uid' => $uid, 'a' => $a, 'side' => (string) ($o['side'] ?? ''), 'stake' => $stake, 'dur' => (int) ($o['duration'] ?? 0), 'won' => $settled ? $won : null, 'net' => round($net, 2)];
  }
  $tot['players'] = count($pl);
  $r2 = static function (array $x): array { foreach ($x as $k => $v) if (is_float($v)) $x[$k] = round($v, 2); return $x; };
  $tot = $r2($tot); $tot['house'] = round(-$tot['pnet'], 2);
  $assets = array_values(array_map(static fn($A) => ['a' => $A['a'], 'n' => $A['n'], 'in' => round($A['in'], 2), 'house' => round(-$A['pnet'], 2), 'won' => $A['won'], 'players' => count($A['players'])], $assets));
  usort($assets, static fn($x, $y) => $y['n'] <=> $x['n']);
  $alerts = [];
  foreach ($pl as $P) {
    $rate = $P['settled'] > 0 ? $P['won'] / $P['settled'] : 0;
    if ($P['settled'] >= 20 && $rate >= 0.65) $alerts[] = ['lvl' => 'red', 'uid' => $P['uid'], 'txt' => 'Gagne ' . round($rate * 100) . ' % de ses trades (' . $P['won'] . '/' . $P['settled'] . ') : à vérifier'];
    elseif ($P['pnet'] >= 50) $alerts[] = ['lvl' => 'orange', 'uid' => $P['uid'], 'txt' => 'Gain net +' . number_format($P['pnet'], 2, ',', ' ') . ' $ au trading'];
  }
  $pl = array_values(array_map(static function ($P) use ($r2) { arsort($P['fav']); $P['fav'] = (string) array_key_first($P['fav']); return $r2($P); }, $pl));
  $sortBy = static function (array $a, callable $f): array { usort($a, $f); return array_slice($a, 0, 15); };
  $lists = ['win' => $sortBy(array_values(array_filter($pl, static fn($p) => $p['pnet'] > 0)), static fn($a, $b) => $b['pnet'] <=> $a['pnet']),
    'lose' => $sortBy(array_values(array_filter($pl, static fn($p) => $p['pnet'] < 0)), static fn($a, $b) => $a['pnet'] <=> $b['pnet']),
    'stake' => $sortBy($pl, static fn($a, $b) => $b['in'] <=> $a['in']),
    'active' => $sortBy($pl, static fn($a, $b) => $b['n'] <=> $a['n'])];
  usort($rows, static fn($a, $b) => $b['t'] <=> $a['t']);
  $addWho = static fn(array $rs) => array_map(static fn($r) => $r + $who((string) ($r['uid'] ?? '')), $rs);
  return ['ok' => true, 'tot' => $tot, 'hours' => array_map($r2, $hours), 'assets' => array_slice($assets, 0, 30), 'pl' => array_map($addWho, $lists),
    'alerts' => $addWho($alerts), 'recent' => $addWho(array_slice($rows, 0, 80)), 'nRecent' => count($rows)];
}
