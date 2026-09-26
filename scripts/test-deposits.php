<?php
declare(strict_types=1);
/**
 * Test du double crédit de dépôt (fausse base Supabase, dossier data/ temporaire).
 * Scénario réel reproduit : un dépôt est crédité, puis une vieille copie du fichier le
 * remet en « PENDING », puis il est retraité (webhook + vérification du téléphone).
 */
$tmp = sys_get_temp_dir() . '/orolado_dep_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';

$uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
$bank = ['real' => [$uuid => 50.0], 'keys' => []];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$bank) {
  $b = $body ? json_decode($body, true) : [];
  if (str_contains($url, '/rpc/resolve_trade')) {
    $u = $b['p_user'];
    if (isset($bank['keys'][$b['p_order']])) return ['ok' => true, 'duplicate' => true, 'real' => $bank['real'][$u] ?? 0];
    $bank['keys'][$b['p_order']] = 1;
    $bank['real'][$u] = round(($bank['real'][$u] ?? 0) + $b['p_amount'], 2);
    return ['ok' => true, 'real' => $bank['real'][$u]];
  }
  if (str_contains($url, '/rest/v1/vaults?user_id=eq.')) {
    preg_match('/user_id=eq\.([^&]+)/', $url, $m);
    $u = rawurldecode($m[1]);
    return isset($bank['real'][$u]) ? [['demo' => 1000000, 'real' => $bank['real'][$u]]] : [];
  }
  if (str_contains($url, '/rpc/credit_real')) {
    // L'ANCIEN chemin : s'il est encore utilisé, le test le verra (crédit sans clé).
    $bank['real'][$b['p_user']] = round(($bank['real'][$b['p_user']] ?? 0) + $b['p_amount'], 2);
    return [];
  }
  return [];
};

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$db = blank_db();
$db['users'][$uuid] = ['id' => $uuid, 'email' => 'j@orolado.local'];
$db['deposits'][] = ['id' => 'oro_test_1', 'ref' => 'oro_test_1', 'userId' => $uuid, 'amount' => 100, 'status' => 'PENDING', 'operator' => 'oxapay'];
save_db(orolado_data_file(), $db);
$stale = load_db();   // copie « vieille » gardée par une autre requête

echo "1) Dépôt de 100 \$ crédité\n";
$r = credit_paid_deposit(['ref' => 'oro_test_1', 'amount' => 100, 'paid' => true, 'creditReceived' => true, 'operator' => 'oxapay', 'extId' => 'TRK1']);
check('crédit accepté', !empty($r['ok']), json_encode($r));
check('solde 50 → 150', abs($bank['real'][$uuid] - 150) < 0.001, (string) $bank['real'][$uuid]);

echo "2) Une vieille copie du fichier remet le dépôt en attente\n";
save_db(orolado_data_file(), $stale);
check('le fichier dit à nouveau PENDING', load_db()['deposits'][0]['status'] === 'PENDING');

echo "3) Le webhook et la vérification du téléphone le retraitent (3 fois)\n";
credit_paid_deposit(['ref' => 'oro_test_1', 'amount' => 100, 'paid' => true, 'creditReceived' => true, 'operator' => 'oxapay', 'extId' => 'TRK1']);
credit_paid_deposit(['ref' => 'oro_test_1', 'amount' => 100, 'paid' => true, 'creditReceived' => true, 'operator' => 'oxapay']);
credit_paid_deposit(['ref' => 'oro_test_1', 'amount' => 100, 'paid' => true, 'creditReceived' => true, 'operator' => 'oxapay', 'extId' => 'TRK1']);
check('SOLDE TOUJOURS 150 : aucun double crédit', abs($bank['real'][$uuid] - 150) < 0.001, (string) $bank['real'][$uuid]);
$after = load_db();
check('dépôt remis à COMPLETED', $after['deposits'][0]['status'] === 'COMPLETED');
// L'historique financier affiché au joueur est construit à partir des dépôts (history_lib).
$deps = array_filter($after['deposits'], fn($d) => ($d['id'] ?? '') === 'oro_test_1');
check('le dépôt apparaît une seule fois dans l’historique', count($deps) === 1, (string) count($deps));

echo "4) Un 2e dépôt différent est bien crédité\n";
with_db_lock(function ($box) use ($uuid) { $box->db['deposits'][] = ['id' => 'oro_test_2', 'ref' => 'oro_test_2', 'userId' => $uuid, 'amount' => 20, 'status' => 'PENDING', 'operator' => 'flutterwave']; return ['ok' => true]; });
credit_paid_deposit(['ref' => 'oro_test_2', 'amount' => 20, 'paid' => true, 'creditReceived' => true, 'operator' => 'flutterwave']);
check('solde 150 → 170', abs($bank['real'][$uuid] - 170) < 0.001, (string) $bank['real'][$uuid]);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
