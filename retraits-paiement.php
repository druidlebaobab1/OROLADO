<?php
declare(strict_types=1);
/**
 * Liste brute des retraits (lecture seule) pour paiement immédiat.
 * N’écrit rien. N’appelle pas Supabase. Ne modifie pas le site.
 */
require_once __DIR__ . '/orolado_lib.php';
orolado_load_env();
date_default_timezone_set('Africa/Abidjan');

if (session_status() !== PHP_SESSION_ACTIVE) {
  session_name('oro_admin');
  session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
  ]);
}

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$uid = (string) ($_SESSION['admin_uid'] ?? '');
$file = orolado_data_file();
$raw = is_file($file) ? (string) @file_get_contents($file) : '';
$data = json_decode($raw, true);
if (!is_array($data)) $data = [];

$me = null;
if ($uid !== '' && isset($data['users'][$uid]) && is_array($data['users'][$uid])) {
  $me = $data['users'][$uid];
}
if (!$me || !orolado_is_admin_user($me)) {
  header('Location: /admin.php');
  exit;
}

function rp_txt($v): string {
  if ($v === null) return '';
  if (is_bool($v)) return $v ? 'oui' : 'non';
  if (is_scalar($v)) return trim((string) $v);
  return '';
}

function rp_esc(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$rows = [];
$i = 0;
foreach (($data['withdrawals'] ?? []) as $w) {
  if (!is_array($w)) continue;
  $i++;
  $st = strtolower(rp_txt($w['status'] ?? 'pending'));
  if ($st === '') $st = 'pending';
  $rows[] = [
    'src' => 'withdrawals',
    'n' => $i,
    'id' => rp_txt($w['id'] ?? $w['reference'] ?? ('#' . $i)),
    'name' => rp_txt($w['name'] ?? $w['beneficiary'] ?? ''),
    'email' => rp_txt($w['email'] ?? ''),
    'amount' => abs((float) ($w['amount'] ?? 0)),
    'method' => rp_txt($w['methodName'] ?? $w['method'] ?? $w['operator'] ?? ''),
    'phone' => rp_txt($w['phone'] ?? $w['destination'] ?? $w['dest'] ?? ''),
    'status' => $st,
    'date' => rp_txt($w['at'] ?? $w['createdAt'] ?? $w['created_at'] ?? $w['date'] ?? ''),
    'userId' => rp_txt($w['userId'] ?? $w['user_id'] ?? ''),
  ];
}

$ti = 0;
foreach (($data['users'] ?? []) as $id => $u) {
  if (!is_array($u)) continue;
  foreach (($u['transactions'] ?? []) as $tx) {
    if (!is_array($tx)) continue;
    $typ = strtolower(rp_txt($tx['type'] ?? ''));
    $note = strtolower(rp_txt($tx['note'] ?? ''));
    $isWd = in_array($typ, ['withdraw', 'withdrawal', 'payout', 'retrait'], true)
      || str_contains($note, 'retrait');
    if (!$isWd) continue;
    $ti++;
    $rows[] = [
      'src' => 'users.transactions',
      'n' => 'T' . $ti,
      'id' => rp_txt($tx['id'] ?? ('tx-' . $ti)),
      'name' => rp_txt($u['displayName'] ?? $u['name'] ?? ''),
      'email' => rp_txt($u['email'] ?? $tx['email'] ?? ''),
      'amount' => abs((float) ($tx['amount'] ?? 0)),
      'method' => rp_txt($tx['operator'] ?? $tx['method'] ?? ''),
      'phone' => rp_txt($tx['phone'] ?? $tx['destination'] ?? $u['phone'] ?? ''),
      'status' => strtolower(rp_txt($tx['status'] ?? 'pending')) ?: 'pending',
      'date' => rp_txt($tx['at'] ?? $tx['createdAt'] ?? $tx['created_at'] ?? ''),
      'userId' => rp_txt($u['id'] ?? $id),
    ];
  }
}

$open = [];
$seen = [];
foreach ($rows as $r) {
  $paid = in_array($r['status'], ['approved', 'paid', 'completed', 'success', 'sent'], true);
  $rej = in_array($r['status'], ['rejected', 'refused', 'canceled', 'cancelled', 'failed', 'denied'], true);
  if ($paid || $rej) continue;
  $key = strtolower($r['userId'] . '|' . number_format((float) $r['amount'], 2, '.', '') . '|' . substr($r['date'], 0, 16));
  if ($r['userId'] === '' || $r['amount'] <= 0) $key = $r['src'] . '|' . $r['id'];
  if (isset($seen[$key])) {
    if ($seen[$key]['phone'] === '' && $r['phone'] !== '') $seen[$key]['phone'] = $r['phone'];
    if ($seen[$key]['method'] === '' && $r['method'] !== '') $seen[$key]['method'] = $r['method'];
    if ($seen[$key]['name'] === '' && $r['name'] !== '') $seen[$key]['name'] = $r['name'];
    continue;
  }
  $seen[$key] = $r;
}
$open = array_values($seen);

$sum = 0.0;
foreach ($open as $r) $sum += (float) $r['amount'];
$jsonN = is_array($data['withdrawals'] ?? null) ? count($data['withdrawals']) : 0;
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex,nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Retraits à payer</title>
  <style>
    body{font-family:Segoe UI,Arial,sans-serif;background:#0B0E14;color:#F8FAFC;margin:0;padding:24px}
    h1{color:#E8C547;font-size:1.25rem;margin:0 0 8px}
    p{color:#94A3B8;margin:0 0 16px}
    a{color:#E8C547}
    table{border-collapse:collapse;width:100%;background:#121826}
    th,td{border:1px solid #243044;padding:8px 10px;text-align:left;font-size:.92rem}
    th{background:#1A2233;color:#E8C547}
    tr:nth-child(even) td{background:#161D2C}
    .amt{font-weight:700;color:#FBBF24;white-space:nowrap}
    .phone{font-weight:700;letter-spacing:.02em}
  </style>
</head>
<body>
  <h1>Retraits à payer</h1>
  <p>
    <?php echo (int) count($open); ?> en attente · <?php echo rp_esc('$' . number_format($sum, 2, '.', ' ')); ?> ·
    fichier JSON : <?php echo (int) $jsonN; ?> ligne(s) dans withdrawals ·
    <a href="/admin.php">Retour admin</a>
  </p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Nom</th>
        <th>E-mail</th>
        <th>Montant</th>
        <th>Méthode</th>
        <th>Téléphone / destination</th>
        <th>Statut</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
    <?php if (!$open): ?>
      <tr><td colspan="8">Aucun retrait en attente dans le JSON local.</td></tr>
    <?php else: foreach ($open as $n => $r): ?>
      <tr>
        <td><?php echo (int) ($n + 1); ?></td>
        <td><?php echo rp_esc($r['name'] !== '' ? $r['name'] : '—'); ?></td>
        <td><?php echo rp_esc($r['email'] !== '' ? $r['email'] : '—'); ?></td>
        <td class="amt"><?php echo rp_esc('$' . number_format((float) $r['amount'], 2, '.', ' ')); ?></td>
        <td><?php echo rp_esc($r['method'] !== '' ? $r['method'] : '—'); ?></td>
        <td class="phone"><?php echo rp_esc($r['phone'] !== '' ? $r['phone'] : '—'); ?></td>
        <td><?php echo rp_esc($r['status']); ?></td>
        <td><?php echo rp_esc($r['date'] !== '' ? $r['date'] : '—'); ?></td>
      </tr>
    <?php endforeach; endif; ?>
    </tbody>
  </table>
</body>
</html>
