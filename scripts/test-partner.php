<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v3628 — COMPTE PARTENAIRE (affiliés) : retrait sans code, débité du solde, visible dans SON historique « en traitement »,
 * jamais dans la file des retraits à payer ; pas de commission d'affiliation ; un joueur normal n'est pas concerné.
 * Fausse caisse Supabase, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_ptn_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'history_lib.php', 'aff_rev_lib.php', 'aff_lib.php'] as $f) if (is_file(__DIR__ . '/../' . $f)) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['BANK'] = [];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) {
  $b = $body ? json_decode($body, true) : [];
  if (preg_match('#/rest/v1/vaults\?user_id=eq\.([^&]+)#', $url, $m)) { $u = rawurldecode($m[1]); return isset($GLOBALS['BANK'][$u]) ? [['demo' => 0, 'real' => $GLOBALS['BANK'][$u]]] : []; }
  if (str_contains($url, '/rpc/debit_real') || str_contains($url, '/rpc/resolve_trade')) {
    $u = $b['p_user'] ?? ''; $a = (float) ($b['p_amount'] ?? 0);
    if (str_contains($url, 'debit_real')) { if (($GLOBALS['BANK'][$u] ?? 0) + 1e-9 < $a) return ['ok' => false]; $GLOBALS['BANK'][$u] = round($GLOBALS['BANK'][$u] - $a, 2); return ['ok' => true, 'real' => $GLOBALS['BANK'][$u]]; }
    $GLOBALS['BANK'][$u] = round(($GLOBALS['BANK'][$u] ?? 0) + $a, 2); return ['ok' => true, 'real' => $GLOBALS['BANK'][$u]];
  }
  return [];
};
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/history_lib.php';
if (is_file($tmp . '/aff_rev_lib.php')) { if (is_file($tmp . '/aff_lib.php')) require_once $tmp . '/aff_lib.php'; require_once $tmp . '/aff_rev_lib.php'; }
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$P = 'pppppppp-0000-0000-0000-00000000000p'; $N = 'nnnnnnnn-0000-0000-0000-00000000000n';
$P = 'aaaaaaaa-0000-0000-0000-0000000000aa'; $N = 'bbbbbbbb-0000-0000-0000-0000000000bb';
$db = blank_db();
$db['users'][$P] = ['id' => $P, 'email' => 'p@test.com', 'role' => 'user', 'sbId' => $P, 'partner' => true];
$db['users'][$N] = ['id' => $N, 'email' => 'n@test.com', 'role' => 'user', 'sbId' => $N];
$db['vault'][$P] = ['demo' => 0, 'real' => 500]; $db['vault'][$N] = ['demo' => 0, 'real' => 50];
save_db(orolado_data_file(), $db);
$GLOBALS['BANK'][$P] = 500; $GLOBALS['BANK'][$N] = 50;

echo "0) Compte affilié créé par l'admin (fiche u_…) mais connecté par son id Supabase\n";
$S = 'cccccccc-0000-0000-0000-0000000000cc';
$db0 = load_db(orolado_data_file());
$db0['users']['u_aff1'] = ['id' => 'u_aff1', 'email' => 'aff1@orolado.com', 'role' => 'user', 'sbId' => $S, 'partner' => true];
check('reconnu par son id Supabase', orolado_is_partner($db0, $S) && orolado_is_partner($db0, 'u_aff1'));
check('compte maison (hors des chiffres)', orolado_is_house_account('u_aff1', $db0['users']['u_aff1']) && !orolado_is_house_account($N, $db0['users'][$N]));
check('profil envoyé au téléphone : partner=true', !empty(orolado_public_user(['id' => $S, 'email' => 'aff1@orolado.com'], $db0)['partner']) && empty(orolado_public_user($db0['users'][$N], $db0)['partner']));
echo "1) Retrait d'un compte partenaire\n";
$db = load_db(orolado_data_file());
check('reconnu partenaire / joueur normal non', orolado_is_partner($db, $P) && !orolado_is_partner($db, $N));
$r = orolado_partner_withdraw($db, $db['users'][$P], ['amount' => 120, 'operator' => 'wave', 'destination' => '0700000000', 'beneficiary' => 'Test']);
check('retrait accepté sans code', !empty($r['ok']), json_encode($r));
check('solde débité (500 → 380)', abs($GLOBALS['BANK'][$P] - 380) < 0.01, (string) $GLOBALS['BANK'][$P]);
$db = load_db(orolado_data_file());
check('jamais dans la file des retraits à payer', count((array) ($db['withdrawals'] ?? [])) === 0);
check('noté à part (partnerWd)', count((array) ($db['partnerWd'] ?? [])) === 1);
$h = orolado_finance_history($db, $P, false, 0, 50);
$rows = $h['rows'] ?? $h['items'] ?? $h;
check('visible dans SON historique (retrait)', str_contains(json_encode($rows), '"withdraw"') && str_contains(json_encode($rows), '-120'), substr(json_encode($rows), 0, 200));
$db2 = $db; $db2['deposits'][] = ['userId' => $P, 'status' => 'COMPLETED', 'operator' => 'admin', 'id' => 'adm_t1', 'amount' => 500, 'at' => date('c')];
$hb = json_encode(orolado_finance_history($db2, $P, false, 0, 50));
check('recharge admin (Bonus) cachée dans SON historique', !str_contains($hb, '"bonus"') && !str_contains($hb, 'adm_t1'), substr($hb, 0, 200));
$r2 = orolado_partner_withdraw($db, $db['users'][$P], ['amount' => 1000, 'operator' => 'wave', 'destination' => '0700000000']);
check('plus que le solde → refusé', empty($r2['ok']) && abs($GLOBALS['BANK'][$P] - 380) < 0.01, json_encode($r2));
echo "2) Pas de commission d'affiliation sur un compte partenaire\n";
if (function_exists('orolado_aff_rev_friend')) { $f = orolado_aff_rev_friend($db, $P); check('NGR = 0', (float) $f['ngr'] == 0.0, json_encode($f)); }
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
