<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-19 — GeniusPay : paiement ouvert, crédit SEULEMENT si l'API dit « completed » pour CE dépôt (metadata.ref),
 * montant venu de GeniusPay (jamais plus que demandé), une seule fois ; paiement de test refusé avec des clés réelles ;
 * clés de test : admin seulement. Faux GeniusPay, dossier temporaire.
 */
$tmp = sys_get_temp_dir() . '/orolado_gp_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'geniuspay_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['BANK'] = ['aaaaaaaa-1111-2222-3333-444444444444' => 0.0];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) {
  $b = $body ? json_decode($body, true) : [];
  if (preg_match('#/rest/v1/vaults\?user_id=eq\.([^&]+)#', $url, $m)) {
    $u = rawurldecode($m[1]);
    return isset($GLOBALS['BANK'][$u]) ? [['demo' => 0, 'real' => $GLOBALS['BANK'][$u]]] : [];
  }
  if (str_contains($url, '/rpc/resolve_trade')) {
    static $keys = [];
    $u = $b['p_user'];
    if (isset($keys[$b['p_order']])) return ['ok' => true, 'duplicate' => true, 'real' => $GLOBALS['BANK'][$u]];
    $keys[$b['p_order']] = 1;
    $GLOBALS['BANK'][$u] = round(($GLOBALS['BANK'][$u] ?? 0) + $b['p_amount'], 2);
    return ['ok' => true, 'real' => $GLOBALS['BANK'][$u]];
  }
  return [];
};
$GLOBALS['GP'] = []; // référence GeniusPay → paiement
$GLOBALS['GP_CALLS'] = [];
$GLOBALS['OROLADO_FAKE_GP'] = function (string $method, string $path, ?array $body) {
  $GLOBALS['GP_CALLS'][] = [$method, $path, $body];
  if ($method === 'POST' && $path === '/payments') {
    $ref = 'MTX-' . strtoupper(bin2hex(random_bytes(5)));
    $GLOBALS['GP'][$ref] = ['reference' => $ref, 'amount' => $body['amount'], 'currency' => 'XOF', 'status' => 'pending', 'metadata' => $body['metadata'], 'environment' => $GLOBALS['GP_ENV'] ?? 'live'];
    $d = ['reference' => $ref, 'amount' => $body['amount'], 'checkout_url' => 'https://geniuspay.ci/checkout/' . $ref];
    if (($body['payment_method'] ?? '') === 'wave') $d['payment_url'] = 'https://pay.wave.com/c/cos-' . $ref;
    return ['success' => true, 'data' => $d, '_http' => 201];
  }
  if ($method === 'GET' && preg_match('#^/payments/([A-Za-z0-9_\-]+)$#', $path, $m)) {
    $p = $GLOBALS['GP'][$m[1]] ?? null;
    return $p ? ['success' => true, 'data' => $p, '_http' => 200] : ['success' => false, '_http' => 404];
  }
  return ['_http' => 404];
};
$GLOBALS['OROLADO_FAKE_GP_SANDBOX'] = false;
require $tmp . '/orolado_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
function bank(): float { return (float) $GLOBALS['BANK']['aaaaaaaa-1111-2222-3333-444444444444']; }
function lastPost(): array { foreach (array_reverse($GLOBALS['GP_CALLS']) as $c) if ($c[0] === 'POST' && $c[1] === '/payments') return $c[2]; return []; }

$uid = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users'][$uid] = ['id' => $uid, 'email' => 'awa@yahoo.fr', 'role' => 'user', 'displayName' => 'Awa Kone', 'country' => 'CI'];
$db['sessions']['tokG'] = ['userId' => $uid, 'createdAt' => date('c')];
save_db(orolado_data_file(), $db);
$rate = orolado_usd_fcfa_rate();

echo "1) Page de paiement GeniusPay (bouton principal)\n";
$r = orolado_geniuspay_start(['token' => 'tokG', 'amount' => 1, 'mode' => 'checkout']);
check('réponse OK, lien geniuspay.ci', !empty($r['ok']) && str_starts_with((string) $r['url'], 'https://geniuspay.ci/checkout/'), json_encode($r));
$p = lastPost();
check('1 $ envoyé en XOF au taux du site, sans moyen imposé', (int) $p['amount'] === max(200, (int) round($rate)) && $p['currency'] === 'XOF' && !isset($p['payment_method']), json_encode($p));
check('notre référence dans metadata + retour vers /api/geniuspay-return.php', ($p['metadata']['ref'] ?? '') === $r['ref'] && str_contains((string) $p['success_url'], '/api/geniuspay-return.php?ref=' . $r['ref']));
check('pas d\'e-mail du joueur envoyé', !isset($p['customer']['email']));
$dep = gp_find_dep($r['ref']);
check('dépôt PENDING enregistré avec la référence GeniusPay', $dep && $dep['status'] === 'PENDING' && str_starts_with((string) $dep['gpRef'], 'MTX-'));

echo "2) Pas payé → rien\n";
gp_check_dep($dep);
check('solde inchangé', bank() == 0.0);

echo "3) Payé → crédité une seule fois\n";
$GLOBALS['GP'][$dep['gpRef']]['status'] = 'completed';
$c = orolado_geniuspay_confirm(['token' => 'tokG'], gp_find_dep($r['ref']));
check('crédité 1 $', abs(bank() - 1.0) < 0.001, (string) bank());
orolado_geniuspay_webhook(json_encode(['event' => 'payment.success', 'data' => ['reference' => $dep['gpRef'], 'metadata' => ['ref' => $r['ref']]]]));
orolado_geniuspay_recheck(['token' => 'tokG']);
check('webhook + rattrapage après coup : pas de 2e crédit', abs(bank() - 1.0) < 0.001, (string) bank());
check('dépôt marqué payé', in_array(gp_find_dep($r['ref'])['status'], ['COMPLETED', 'PAID'], true));

echo "4) Montant : jamais plus que demandé\n";
$r2 = orolado_geniuspay_start(['token' => 'tokG', 'amount' => 2, 'mode' => 'card']);
$d2 = gp_find_dep($r2['ref']);
check('carte : payment_method=card', (lastPost()['payment_method'] ?? '') === 'card');
$GLOBALS['GP'][$d2['gpRef']]['status'] = 'completed';
$GLOBALS['GP'][$d2['gpRef']]['amount'] = 999999;
gp_check_dep($d2);
check('crédité 2 $ (pas 999 999 F)', abs(bank() - 3.0) < 0.001, (string) bank());

echo "5) Paiement d'un AUTRE dépôt → refusé\n";
$r3 = orolado_geniuspay_start(['token' => 'tokG', 'amount' => 5, 'mode' => 'checkout']);
$d3 = gp_find_dep($r3['ref']);
$d3['gpRef'] = $d2['gpRef']; // pirate : réutilise le paiement réussi de r2
$v = gp_verify($d3);
check('référence différente → pas payé', empty($v['paid']), json_encode($v));

echo "6) Paiement de TEST avec les clés réelles → refusé\n";
$GLOBALS['GP_ENV'] = 'sandbox';
$r4 = orolado_geniuspay_start(['token' => 'tokG', 'amount' => 1, 'mode' => 'checkout']);
$d4 = gp_find_dep($r4['ref']);
$GLOBALS['GP'][$d4['gpRef']]['status'] = 'completed';
gp_check_dep($d4);
check('pas crédité', abs(bank() - 3.0) < 0.001, (string) bank());
$GLOBALS['GP_ENV'] = 'live';

echo "7) Wave direct\n";
$r5 = orolado_geniuspay_start(['token' => 'tokG', 'amount' => 1, 'mode' => 'wave', 'phone' => '2250701020304']);
check('lien Wave direct (wave.com)', !empty($r5['ok']) && str_contains((string) $r5['url'], 'wave.com'), json_encode($r5));
check('numéro +225 et payment_method=wave', (lastPost()['customer']['phone'] ?? '') === '+2250701020304' && (lastPost()['payment_method'] ?? '') === 'wave');
$r6 = orolado_geniuspay_start(['token' => 'tokG', 'amount' => 1, 'mode' => 'wave', 'phone' => '22507010203']);
check('numéro trop court refusé', empty($r6['ok']) && ($r6['code'] ?? '') === 'phone');
$r7 = orolado_geniuspay_start(['token' => 'tokG', 'amount' => 0.5, 'mode' => 'checkout']);
check('moins de 1 $ refusé', empty($r7['ok']) && ($r7['code'] ?? '') === 'min');

echo "8) Clés de test : seul l'admin\n";
$GLOBALS['OROLADO_FAKE_GP_SANDBOX'] = true;
$r8 = orolado_geniuspay_start(['token' => 'tokG', 'amount' => 1, 'mode' => 'checkout']);
check('joueur : GeniusPay pas activé (il garde l\'ancien moyen)', empty($r8['ok']) && ($r8['code'] ?? '') === 'off');
check('admin : activé', gp_on_for(['id' => 'admin_master', 'role' => 'admin']));
$GLOBALS['OROLADO_FAKE_GP_SANDBOX'] = false;

echo "\n$pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
