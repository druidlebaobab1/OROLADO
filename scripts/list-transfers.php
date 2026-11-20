<?php
declare(strict_types=1);
// Script de maintenance : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-20 — Liste TOUS les transferts d'argent entre joueurs (« Envoyer de l'argent à un ami »).
 * Lecture seule : rien n'est modifié.
 *
 * Où c'est rangé : data/xfer/<sha256("xfer|" + id du compte)>.json (un fichier par compte, transfer_lib.php).
 * Chaque envoi y est noté chez celui qui envoie (« out ») et chez celui qui reçoit (« in ») ; ici une ligne par envoi.
 *
 * Usage :  php scripts/list-transfers.php            (tableau lisible)
 *          php scripts/list-transfers.php --csv      (CSV : date;de;à;montant;état;réf)
 *          php scripts/list-transfers.php --json
 *          php scripts/list-transfers.php OR12345    (seulement les transferts d'un joueur : ID, e-mail, nom ou id interne)
 */
require_once __DIR__ . '/../orolado_lib.php';
require_once __DIR__ . '/../transfer_lib.php';

$args = array_slice($argv, 1);
$fmt = 'table';
$q = '';
foreach ($args as $a) {
  if ($a === '--csv') $fmt = 'csv';
  else if ($a === '--json') $fmt = 'json';
  else if ($a === '-h' || $a === '--help') { echo "Usage : php scripts/list-transfers.php [--csv|--json] [joueur]\n"; exit(0); }
  else $q = strtolower(trim($a));
}

$db = load_db();
$rows = orolado_xfer_all($db);
if ($q !== '') {
  $rows = array_values(array_filter($rows, static function (array $r) use ($db, $q): bool {
    foreach (['from', 'to'] as $s) {
      $u = $db['users'][$r[$s . 'Uid']] ?? [];
      $blob = strtolower(implode(' ', [$r[$s . 'Uid'], $r[$s . 'Id'], $r[$s . 'Name'], (string) ($u['email'] ?? ''), (string) ($u['publicId'] ?? ''), (string) ($u['sbId'] ?? '')]));
      if (str_contains($blob, $q)) return true;
    }
    return str_contains(strtolower($r['ref']), $q);
  }));
}

$when = static fn(int $t): string => $t > 0 ? gmdate('Y-m-d H:i', $t) . ' UTC' : '—';
$who = static fn(array $r, string $s): string => orolado_xfer_label($r[$s . 'Name'], $r[$s . 'Id']) . ($r[$s . 'Uid'] !== '' ? ' [' . $r[$s . 'Uid'] . ']' : '');

if ($fmt === 'json') {
  echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "\n";
  exit(0);
}
if ($fmt === 'csv') {
  $out = fopen('php://stdout', 'w');
  fputcsv($out, ['date_utc', 'de', 'de_uid', 'a', 'a_uid', 'montant', 'etat', 'ref'], ';', '"', '\\');
  foreach ($rows as $r) {
    fputcsv($out, [$when((int) $r['at']), orolado_xfer_label($r['fromName'], $r['fromId']), $r['fromUid'], orolado_xfer_label($r['toName'], $r['toId']), $r['toUid'],
      number_format((float) $r['amount'], 2, '.', ''), $r['state'], $r['ref']], ';', '"', '\\');
  }
  exit(0);
}

$sum = 0.0;
foreach ($rows as $r) {
  $sum += (float) $r['amount'];
  printf("%s  %10s $  %-14s  DE %s  →  À %s  (%s)\n", $when((int) $r['at']), number_format((float) $r['amount'], 2, '.', ' '),
    orolado_xfer_state_label((string) $r['state']), $who($r, 'from'), $who($r, 'to'), $r['ref']);
}
echo "\n" . count($rows) . ' transfert(s) · total ' . number_format($sum, 2, '.', ' ') . " $\n";
echo 'Dossier lu : ' . rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . "xfer\n";
