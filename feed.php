<?php
declare(strict_types=1);

/**
 * Flux de prix public (lecture seule, sans compte).
 *   feed.php?a=v100&hist=5400   → les 5400 derniers ticks (historique du graphique)
 *   feed.php?a=v100&since=N     → les ticks après N (rafraîchissement, ~2 fois par seconde)
 *   feed.php?a=v100&at=N        → le prix du tick N (règlement du mode démo invité)
 * Les prix sont en centimes. Jamais de tick futur : il n'existe pas encore.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

require_once __DIR__ . '/feed_lib.php';

function feed_out(array $j, int $code = 200): void {
  http_response_code($code);
  echo json_encode($j, JSON_UNESCAPED_SLASHES);
  exit;
}

$asset = orolado_feed_asset_id((string) ($_GET['a'] ?? ''));
if ($asset === '') feed_out(['ok' => false, 'reason' => 'actif inconnu'], 400);

try {
  $st = orolado_feed_advance($asset);
} catch (Throwable $e) {
  error_log('OROLADO feed ' . $asset . ' ' . $e->getMessage());
  feed_out(['ok' => false, 'reason' => 'flux indisponible'], 503);
}
$last = $st['n'];
$base = ['ok' => true, 'a' => $asset, 'tickMs' => OROLADO_TICK_MS, 'serverMs' => orolado_feed_now_ms(), 'last' => $last];

if (isset($_GET['at'])) {
  $at = (int) $_GET['at'];
  if ($at > $last) feed_out($base + ['pending' => true]);
  $v = orolado_feed_read($asset, $at, $at)[0] ?? 0;
  feed_out($base + ['tick' => $at, 'c' => $v > 0 ? $v : null]);
}

if (isset($_GET['since'])) {
  $since = (int) $_GET['since'];
  $from = max($since + 1, $last - 399);
} else {
  $n = max(1, min(OROLADO_FEED_BOOT_TICKS, (int) ($_GET['hist'] ?? 2400)));
  $from = $last - $n + 1;
}
if ($from > $last) feed_out($base + ['first' => $last + 1, 'c' => []]);
feed_out($base + ['first' => $from, 'c' => orolado_feed_read($asset, $from, $last)]);
