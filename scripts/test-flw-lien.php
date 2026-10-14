<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2625 — Flutterwave : le serveur demande un LIEN de paiement (page ouverte en plein, pour que Wave s'ouvre),
 * et garde l'ancienne fenêtre en secours si Flutterwave ne donne pas de lien. Faux Flutterwave, dossier temporaire.
 */
$tmp = sys_get_temp_dir() . '/orolado_flw_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('FLW_SECRET_KEY=faux-secret-de-test');
putenv('FLW_PUBLIC_KEY=faux-public-de-test');
$GLOBALS['OROLADO_FAKE_HTTP'] = fn() => [];
$calls = [];
$mode = 'ok';
$GLOBALS['OROLADO_FAKE_FLW'] = function (string $method, string $path, ?array $body) use (&$calls, &$mode) {
  $calls[] = [$method, $path, $body];
  if ($method === 'POST' && $path === '/payments') {
    if ($mode === 'ok') return ['status' => 'success', 'data' => ['link' => 'https://checkout.flutterwave.com/v3/hosted/pay/abc123'], '_http' => 200];
    if ($mode === 'pirate') return ['status' => 'success', 'data' => ['link' => 'https://evil.example.com/pay'], '_http' => 200];
    return ['status' => 'error', '_http' => 500];
  }
  return ['_http' => 404];
};
require $tmp . '/orolado_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$uid = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users'][$uid] = ['id' => $uid, 'email' => 'awa@yahoo.fr', 'role' => 'user', 'displayName' => 'Awa Kone', 'country' => 'CI', 'phone' => '+2250701020304'];
$db['sessions']['tokF'] = ['userId' => $uid, 'createdAt' => date('c')];
save_db(orolado_data_file(), $db);

echo "1) Lien de paiement Flutterwave (page en plein → Wave peut s'ouvrir)\n";
$r = orolado_flutterwave_checkout(['token' => 'tokF', 'amount' => 3, 'country' => 'CI', 'currency' => 'XOF']);
check('réponse OK avec un lien flutterwave.com', !empty($r['ok']) && str_starts_with((string) ($r['link'] ?? ''), 'https://checkout.flutterwave.com/'), (string) ($r['link'] ?? json_encode($r)));
$p = null; foreach ($calls as $c) if ($c[1] === '/payments') $p = $c[2];
check('même référence, montant 1 800 FCFA en XOF, retour vers /api/flutterwave/callback', is_array($p) && $p['tx_ref'] === $r['tx_ref'] && (int) $p['amount'] === 1800 && $p['currency'] === 'XOF' && str_ends_with((string) $p['redirect_url'], '/api/flutterwave/callback'), json_encode($p));
check('dépôt enregistré en attente (crédit seulement après vérification Flutterwave)', (function () use ($r) { foreach (load_db()['deposits'] ?? [] as $d) if (($d['id'] ?? '') === $r['tx_ref']) return $d['status'] === 'PENDING'; return false; })());

echo "2) Secours\n";
$mode = 'panne';
$r = orolado_flutterwave_checkout(['token' => 'tokF', 'amount' => 3, 'country' => 'CI', 'currency' => 'XOF']);
check('Flutterwave ne donne pas de lien : ancienne fenêtre gardée (inline + clé publique)', !empty($r['ok']) && ($r['link'] ?? 'x') === '' && !empty($r['inline']) && ($r['public_key'] ?? '') !== '', json_encode(['link' => $r['link'] ?? null]));
$mode = 'pirate';
$r = orolado_flutterwave_checkout(['token' => 'tokF', 'amount' => 3, 'country' => 'CI', 'currency' => 'XOF']);
check('lien qui n’est pas flutterwave.com : refusé', ($r['link'] ?? 'x') === '', (string) ($r['link'] ?? ''));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
