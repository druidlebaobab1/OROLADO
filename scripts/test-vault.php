<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-11 — Coffre du propriétaire (vault_lib.php) : dépôts USDT TRC20 directement dans SON portefeuille.
 * Montant exact → bon joueur ; montant proche (frais) → seul candidat ; numéro collé → seulement sa propre demande ;
 * jamais deux crédits ; jamais l'envoi d'un autre. Fausse blockchain, fausse caisse : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_vlt_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'vault_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OXAPAY_MERCHANT_KEY=fake-oxa');
putenv('TRONGRID_API_KEY=00000000-0000-0000-0000-000000000000');
const COFFRE = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
require $tmp . '/orolado_lib.php';

$bank = ['c' => [], 'keys' => []];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$bank) {
  $b = $body ? json_decode($body, true) : [];
  if (str_contains($url, '/rpc/resolve_trade')) {
    $u = $b['p_user']; $bank['c'][$u] = $bank['c'][$u] ?? 0;
    if (isset($bank['keys'][$b['p_order']])) return ['ok' => true, 'duplicate' => true, 'real' => $bank['c'][$u] / 100];
    $bank['keys'][$b['p_order']] = 1; $bank['c'][$u] += (int) round($b['p_amount'] * 100);
    return ['ok' => true, 'real' => $bank['c'][$u] / 100];
  }
  if (preg_match('/vaults\?user_id=eq\.([^&]+)/', $url, $m)) return [['demo' => 0, 'real' => ($bank['c'][rawurldecode($m[1])] ?? 0) / 100]];
  return [];
};
$GLOBALS['OROLADO_FAKE_OXA'] = function () { $GLOBALS['OXA_CALLS'] = ($GLOBALS['OXA_CALLS'] ?? 0) + 1; return null; };
$CHAIN = []; // envois reçus dans le coffre
$GLOBALS['OROLADO_FAKE_TRONGRID'] = function (string $addr, int $since, bool $asc) use (&$CHAIN) {
  $o = array_values(array_filter($CHAIN, fn($t) => $addr === COFFRE && $t['tsMs'] >= $since));
  usort($o, fn($a, $b) => $a['tsMs'] <=> $b['tsMs']);
  return $o;
};
$send = function (float $amt, string $from = 'TFromSomeone') use (&$CHAIN): string {
  $h = bin2hex(random_bytes(32)); $ts = time() + 5;
  $CHAIN[] = ['tx_hash' => $h, 'amount' => $amt, 'currency' => 'USDT', 'status' => 'confirmed', 'ts' => $ts, 'tsMs' => $ts * 1000, 'from' => $from];
  return $h;
};
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-0000-0000-0000-00000000000a';
$B = 'aaaaaaaa-0000-0000-0000-00000000000b';
$money = function (string $u) use (&$bank): float { return ($bank['c'][$u] ?? 0) / 100; };
$fresh = function () use (&$bank, &$CHAIN, $A, $B) {
  $bank = ['c' => [], 'keys' => []]; $CHAIN = [];
  @unlink(orolado_data_file());
  foreach (glob(orolado_data_dir() . '/*') ?: [] as $f) if (is_file($f)) @unlink($f);
  foreach (glob(orolado_data_dir() . '/.env') ?: [] as $f) @unlink($f);
  $db = blank_db();
  foreach ([$A => 'a@test.com', $B => 'b@test.com'] as $id => $mail) {
    $db['users'][$id] = ['id' => $id, 'email' => $mail, 'role' => 'user', 'sbId' => $id, 'displayName' => $mail];
    $db['vault'][$id] = ['demo' => 0, 'real' => 0];
  }
  $db['sessions']['tokA'] = ['userId' => $A, 'at' => date('c')];
  $db['sessions']['tokB'] = ['userId' => $B, 'at' => date('c')];
  save_db(orolado_data_file(), $db);
  putenv('VAULT_TRON_ADDRESS=' . COFFRE);
};
$inv = fn(string $tok, float $amt) => orolado_oxapay_invoice(['token' => $tok, 'coin' => 'usdt_trc20', 'amount' => $amt, 'confirmed' => true]);
$stat = fn(string $tok, array $i) => orolado_oxapay_status(['token' => $tok, 'orderId' => $i['orderId']]);

echo "0) Adresse du coffre\n";
check('adresse TRON valide acceptée', vault_tron_addr_ok(COFFRE));
check('une lettre fausse → refusée (somme de contrôle)', !vault_tron_addr_ok('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6u'));
check('adresse vide → coffre éteint', (function () { putenv('VAULT_TRON_ADDRESS='); $r = !vault_enabled(); putenv('VAULT_TRON_ADDRESS=' . COFFRE); return $r; })());

echo "1) Montant exact : crédité au bon joueur, sans OxaPay\n";
$fresh();
$GLOBALS['OXA_CALLS'] = 0;
$ia = $inv('tokA', 50);
check('le joueur reçoit l\'adresse du coffre', !empty($ia['vault']) && $ia['address'] === COFFRE, json_encode($ia));
check('montant exact unique (50,00xx)', $ia['payAmount'] > 50 && $ia['payAmount'] < 50.1, (string) $ia['payAmount']);
check('OxaPay n\'est jamais appelé', ($GLOBALS['OXA_CALLS'] ?? 0) === 0);
$ib = $inv('tokB', 50);
check('autre joueur, même montant → autres centimes', $ib['payExact'] !== $ia['payExact'], $ia['payExact'] . ' / ' . $ib['payExact']);
$ia2 = $inv('tokA', 50);
check('le même joueur rouvre → même montant exact', $ia2['payExact'] === $ia['payExact']);
$hA = $send((float) $ia['payExact']);
$s = $stat('tokA', $ia);
check('envoi exact vu → joueur A crédité de 50,00 $', !empty($s['paid']) && abs($money($A) - round((float) $ia['payExact'], 2)) < 0.011, json_encode($s) . ' / ' . $money($A));
check('joueur B non crédité', $money($B) == 0);
vault_scan(0, true); vault_scan(0, true);
check('rondes suivantes → pas de 2e crédit', abs($money($A) - round((float) $ia['payExact'], 2)) < 0.011, (string) $money($A));
$r = vault_claim(['token' => 'tokB', 'txid' => $hA]);
check('B colle le numéro de l\'envoi de A → refusé', empty($r['paid']) && $money($B) == 0, json_encode($r));
$s = $stat('tokB', $ib);
check('écran de B toujours « en attente »', !empty($s['pending']));

echo "2) Montant un peu différent (frais retirés) : seul candidat → crédité\n";
$fresh();
$ia = $inv('tokA', 100);
$send(99.0);
vault_scan(0, true);
check('99 USDT reçus pour une demande de 100 $ → A crédité 99 $', abs($money($A) - 99) < 0.001, (string) $money($A));

echo "3) Deux demandes proches : pas d'attribution au hasard, le joueur colle son numéro\n";
$fresh();
$ia = $inv('tokA', 20); $ib = $inv('tokB', 20);
$h = $send(19.0);
vault_scan(0, true);
check('personne crédité automatiquement', $money($A) == 0 && $money($B) == 0);
check('envoi listé « joueur non reconnu » pour l\'admin', isset(vault_unmatched()[strtolower($h)]));
$r = vault_claim(['token' => 'tokB', 'txid' => 'https://tronscan.org/#/transaction/' . $h]);
check('B colle son numéro (lien tronscan accepté) → crédité 19 $', !empty($r['paid']) && abs($money($B) - 19) < 0.001, json_encode($r));
$r = vault_claim(['token' => 'tokA', 'txid' => $h]);
check('A recolle le même numéro → refusé', empty($r['paid']) && $money($A) == 0, json_encode($r));
$r = vault_claim(['token' => 'tokB', 'txid' => $h]);
check('B recolle → rien de plus', abs($money($B) - 19) < 0.001);

echo "4) Envoi sans demande : l'admin l'attribue, une seule fois\n";
$fresh();
$h = $send(42.5);
vault_scan(0, true);
check('envoi inconnu listé pour l\'admin', count(vault_admin_view()['unmatched']) === 1);
$r = vault_claim(['token' => 'tokA', 'txid' => $h]);
check('A sans demande colle le numéro → refusé', empty($r['paid']) && $money($A) == 0, json_encode($r));
$r = vault_admin_assign($h, 'a@test.com', 'admin');
check('admin attribue à A (par e-mail) → 42,50 $', !empty($r['ok']) && abs($money($A) - 42.5) < 0.001, json_encode($r));
$r = vault_admin_assign($h, 'b@test.com', 'admin');
check('2e attribution du même envoi → refusée', empty($r['ok']) && $money($B) == 0);
check('liste « non reconnu » vidée', count(vault_admin_view()['unmatched']) === 0);

echo "5) Demande faite APRÈS l'envoi : jamais attribuée\n";
$fresh();
$CHAIN[] = ['tx_hash' => str_repeat('ab', 32), 'amount' => 30.0, 'currency' => 'USDT', 'status' => 'confirmed', 'ts' => time() - 3600, 'tsMs' => (time() - 3600) * 1000, 'from' => 'X'];
$ia = $inv('tokA', 30);
vault_scan(0, true);
check('envoi d\'il y a 1 h + nouvelle demande de 30 $ → pas crédité', $money($A) == 0);
$r = vault_claim(['token' => 'tokA', 'txid' => str_repeat('ab', 32)]);
check('et le coller ne marche pas non plus', empty($r['paid']), json_encode($r));

echo "6) Coffre non réglé → l'ancien système (OxaPay) reprend\n";
$fresh();
putenv('VAULT_TRON_ADDRESS=');
$GLOBALS['OXA_CALLS'] = 0;
$i = $inv('tokA', 10);
check('pas de facture coffre', empty($i['vault']));
check('OxaPay sollicité', ($GLOBALS['OXA_CALLS'] ?? 0) > 0);

echo "\nRésultat : $pass OK, $fail échec(s)\n";
exec('rm -rf ' . escapeshellarg($tmp));
exit($fail ? 1 : 0);
