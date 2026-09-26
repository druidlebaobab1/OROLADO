<?php
declare(strict_types=1);
/** Test local de l'historique durable + mention Bonus + archivage (dossier data/ temporaire). */
$tmp = sys_get_temp_dir() . '/orolado_hist_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'history_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/history_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d ? "  ($d)" : '') . "\n"; }

$uid = '11111111-2222-3333-4444-555555555555';
$db = blank_db();
$db['users'][$uid] = ['id' => $uid, 'email' => 'x@orolado.local'];
$db['deposits'][] = ['id' => 'dep1', 'userId' => $uid, 'amount' => 20, 'status' => 'COMPLETED', 'operator' => 'wave', 'paidAt' => '2026-09-20T10:00:00+00:00'];
$db['deposits'][] = ['id' => 'adm_abc', 'userId' => $uid, 'amount' => 5, 'status' => 'COMPLETED', 'operator' => 'admin', 'paidAt' => '2026-09-21T10:00:00+00:00'];
$db['withdrawals'][] = ['id' => 'wd1', 'userId' => $uid, 'amount' => 8, 'status' => 'approved', 'operator' => 'orange', 'at' => '2026-09-22T10:00:00+00:00'];
for ($i = 0; $i < 3000; $i++) {
  $db['deposits'][] = ['id' => 'bulk' . $i, 'userId' => $uid, 'amount' => 1, 'status' => 'COMPLETED', 'operator' => 'wave', 'paidAt' => sprintf('2025-01-01T00:%02d:%02d+00:00', intdiv($i, 60) % 60, $i % 60)];
}
$old = microtime(true) - 5 * 86400;
$db['orders'][] = ['id' => 'o_old', 'userId' => $uid, 'mode' => 'real', 'status' => 'won', 'stake' => 2, 'at' => $old, 'settledAt' => $old];
$db['orders'][] = ['id' => 'o_new', 'userId' => $uid, 'mode' => 'real', 'status' => 'lost', 'stake' => 2, 'at' => microtime(true), 'settledAt' => microtime(true)];
$db['orders'][] = ['id' => 'o_open', 'userId' => $uid, 'mode' => 'real', 'status' => 'open', 'stake' => 2, 'at' => $old];
save_db(orolado_data_file(), $db);

echo "1) Historique financier\n";
$h = orolado_finance_history(load_db(), $uid, false, 0, 50);
$first3 = array_slice($h['rows'], 0, 3);
check('ordre : retrait, bonus, dépôt (du plus récent)', array_column($first3, 'kind') === ['withdraw', 'bonus', 'deposit'], implode(',', array_column($first3, 'kind')));
check('le bonus admin s’affiche « bonus », sans nom admin', $first3[1]['kind'] === 'bonus' && $first3[1]['gateway'] === 'OROLADO');
check('retrait négatif et validé', $first3[0]['amount'] === -8.0 && $first3[0]['status'] === 'COMPLETED');
check('plafond de 2 000 lignes par joueur', $h['total'] === 2000, (string) $h['total']);
check('pages de 50', count($h['rows']) === 50);
$p2 = orolado_finance_history(load_db(), $uid, false, 50, 50);
check('page 2 différente de la page 1', $p2['rows'][0]['ref'] !== $h['rows'][0]['ref']);
$ha = orolado_finance_history(load_db(), $uid, true, 0, 5);
check('l’admin voit ses propres crédits comme « dépôt »', $ha['rows'][1]['kind'] === 'deposit');

echo "2) Archivage des vieux trades\n";
$n = orolado_archive_orders();
$ids = array_column(load_db()['orders'], 'id');
check('le vieux trade terminé part en archive', $n === 1 && !in_array('o_old', $ids, true), (string) $n);
check('trade récent et trade ouvert gardés', in_array('o_new', $ids, true) && in_array('o_open', $ids, true));
$arch = glob(orolado_data_dir() . '/archive/orders-*.jsonl');
check('archive écrite sur disque', count($arch) === 1 && str_contains((string) file_get_contents($arch[0]), 'o_old'));
check('pas d’archivage répété avant 10 min', orolado_archive_orders() === 0);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
