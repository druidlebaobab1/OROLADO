<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2689 — Envoyer de l'argent à un ami (transfer_lib.php). Fausse caisse, dossier temporaire : rien ne part en ligne.
 * Vérifie : seuls les VRAIS dépôts sont envoyables ; bonus / admin / argent reçu jamais ; l'ami reçoit un bonus ×2 ;
 * pas de renvoi en chaîne ; jamais plus que le solde ; double envoi ; panne de la base ; jamais payé deux fois.
 */
$tmp = sys_get_temp_dir() . '/orolado_xfer_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'transfer_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OROLADO_XFER_START=2026-10-01 00:00:00 UTC');
// Fausse caisse : solde par compte, crédit une seule fois par clé, retrait refusé si solde insuffisant.
$bal = []; $keys = []; $down = false; $debits = 0;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$down, &$debits) {
  if ($down) return null;
  $u = $a['p_user'];
  if ($fn === 'debit_real') {
    if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient'];
    $debits++;
    $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bal[$u]];
  }
  if ($fn === 'resolve_trade') {
    $k = $u . '|' . $a['p_order'];
    if (!isset($keys[$k])) { $keys[$k] = 1; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); }
    return ['ok' => true, 'real' => $bal[$u]];
  }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/transfer_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$n = 0;
function dep(string $uid, float $amount, string $when, string $op = 'flutterwave'): void {
  global $n, $bal; $n++;
  $db = load_db();
  $id = ($op === 'admin' ? 'adm_' : 'flw_') . 'x' . $n;
  $db['deposits'][] = ['id' => $id, 'ref' => $id, 'userId' => $uid, 'amount' => $amount, 'status' => 'COMPLETED', 'operator' => $op, 'createdAt' => date('c', strtotime($when)), 'paidAt' => date('c', strtotime($when))];
  $sb = $db['users'][$uid]['sbId'];
  $bal[$sb] = round(($bal[$sb] ?? 0) + $amount, 2);
  $db['vault'][$uid]['real'] = $bal[$sb];
  save_db(orolado_data_file(), $db);
}
function syncv(): void { global $bal; $db = load_db(); foreach ($db['users'] as $id => $u) if (!empty($u['sbId'])) $db['vault'][$id]['real'] = $bal[$u['sbId']] ?? 0; save_db(orolado_data_file(), $db); }
function setbal(string $uid, float $v): void { global $bal; $db = load_db(); $bal[$db['users'][$uid]['sbId']] = $v; syncv(); }
function st(string $uid): array { $db = load_db(); return orolado_xfer_status($db, $db['users'][$uid]); }
function send(string $from, string $to, float $amt): array { $db = load_db(); return orolado_xfer_send($db, $db['users'][$from], ['uid' => $to, 'id' => 'OR' . strtoupper(substr(md5($to), 0, 10)), 'name' => $to], $amt); }

$U = ['u_paul' => 'aaaaaaaa-1111-2222-3333-444444444444', 'u_frere' => 'bbbbbbbb-1111-2222-3333-444444444444', 'u_faux' => 'cccccccc-1111-2222-3333-444444444444', 'u_ali' => 'dddddddd-1111-2222-3333-444444444444'];
$db = blank_db();
foreach ($U as $id => $sb) { $db['users'][$id] = ['id' => $id, 'email' => $id . '@gmail.com', 'role' => 'user', 'sbId' => $sb, 'displayName' => $id]; $db['vault'][$id] = ['demo' => 0, 'real' => 0]; }
save_db(orolado_data_file(), $db);

echo "1) Fermé tant que ce n'est pas ouvert à tous\n";
check('joueur normal : pas de transfert', empty(st('u_paul')['enabled']));
check('envoi refusé', send('u_paul', 'u_frere', 5)['ok'] === false);
putenv('OROLADO_XFER_PUBLIC=1');

echo "2) Un faux compte avec seulement des bonus ne peut rien envoyer\n";
dep('u_faux', 0.90, '2026-10-17', 'admin');
dep('u_faux', 25, '2026-10-17', 'admin');
check('bonus tournoi 0,90 $ + bonus admin 25 $ : envoyable = 0 $', st('u_faux')['can'] == 0, (string) st('u_faux')['can']);
$r = send('u_faux', 'u_paul', 0.9);
check('envoi de 0,90 $ refusé (minimum 1 $)', $r['ok'] === false && $r['reason'] === 'min');
$r = send('u_faux', 'u_paul', 5);
check('envoi de 5 $ de bonus refusé', $r['ok'] === false && $r['reason'] === 'tooMuch');
check('aucun argent n\'a bougé', $bal[$U['u_faux']] == 25.9 && ($bal[$U['u_paul']] ?? 0) == 0);

echo "3) Paul dépose 20 \$ et envoie à son frère (compte tout neuf, jamais déposé)\n";
dep('u_paul', 20, '2026-10-17');
dep('u_paul', 50, '2026-09-20');
check('dépôt ancien (avant l\'ouverture) ne compte pas : envoyable 20 $', st('u_paul')['can'] == 20, (string) st('u_paul')['can']);
$r = send('u_paul', 'u_frere', 20);
check('envoi de 20 $ accepté', $r['ok'] === true, json_encode($r));
check('Paul : -20 $', $bal[$U['u_paul']] == 50);
check('Frère : +20 $', $bal[$U['u_frere']] == 20);
$dbx = load_db();
$row = null; foreach ($dbx['deposits'] as $d) if (($d['userId'] ?? '') === 'u_frere') $row = $d;
check('chez le frère : BONUS (opérateur admin) « Reçu de ton ami »', $row && $row['operator'] === 'admin' && str_contains((string) $row['note'], 'Reçu de ton ami'));
check('le frère doit miser 40 $ (×2) avant retrait', abs((float) ($dbx['users']['u_frere']['wagerNeed'] ?? 0) - 40) < 0.001);
check('Paul : ligne « Envoyé à ton ami » dans ses opérations', ($dbx['users']['u_paul']['transactions'][0]['type'] ?? '') === 'transfer');
check('Paul : plus rien d\'envoyable', st('u_paul')['can'] == 0);
$r = send('u_paul', 'u_frere', 1);
check('Paul renvoie 1 $ : refusé (ses 50 $ viennent d\'un dépôt ancien)', $r['ok'] === false);

echo "4) Pas de renvoi en chaîne\n";
check('le frère : envoyable 0 $ (l\'argent reçu ne compte pas)', st('u_frere')['can'] == 0);
$r = send('u_frere', 'u_ali', 10);
check('le frère renvoie 10 $ à Ali : refusé', $r['ok'] === false && $r['reason'] === 'tooMuch');
check('historique du frère : 1 réception', count(array_filter(st('u_frere')['log'], fn($l) => $l['dir'] === 'in')) === 1);

echo "5) Le compteur ne dépasse jamais le solde (Ali dépose 10 \$, perd tout, gagne 5 \$ de bonus)\n";
dep('u_ali', 10, '2026-10-17');
check('Ali : envoyable 10 $', st('u_ali')['can'] == 10);
setbal('u_ali', 0);
check('Ali a tout perdu : envoyable 0 $', st('u_ali')['can'] == 0);
dep('u_ali', 5, '2026-10-18', 'admin');
check('bonus de 5 $ reçu ensuite : toujours 0 $ envoyable', st('u_ali')['can'] == 0);
check('envoi des 5 $ de bonus : refusé', send('u_ali', 'u_paul', 5)['ok'] === false);

echo "6) Soi-même, ami inconnu\n";
dep('u_ali', 30, '2026-10-18');
check('à soi-même : refusé', send('u_ali', 'u_ali', 5)['reason'] === 'self');
check('ami inconnu : refusé', send('u_ali', 'u_personne', 5)['reason'] === 'notFound');

echo "7) Deux envois en même temps ne dépassent pas\n";
$r1 = send('u_ali', 'u_paul', 20); $r2 = send('u_ali', 'u_paul', 20);
check('1er envoi de 20 $ accepté, 2e refusé (il ne reste que 10 $)', $r1['ok'] === true && $r2['ok'] === false, json_encode([$r1['ok'], $r2['reason'] ?? '']));

echo "8) Solde insuffisant dans la caisse : rien ne bouge, le compteur est rendu\n";
$before = st('u_ali')['can'];
setbal('u_ali', 3);
$db = load_db(); $db['vault']['u_ali']['real'] = 50; save_db(orolado_data_file(), $db); // fichier en retard sur la vraie caisse
$r = send('u_ali', 'u_paul', 8);
check('caisse à 3 $ : envoi de 8 $ refusé par la caisse', $r['ok'] === false && $r['reason'] === 'insufficient', json_encode($r));
check('compteur rendu', st('u_ali')['can'] <= $before + 0.001);

echo "9) Panne de la base pendant le crédit : réessayé plus tard, payé une seule fois\n";
dep('u_paul', 40, '2026-10-19');
$down = false;
$GLOBALS['OROLADO_FAKE_RPC_BACKUP'] = $GLOBALS['OROLADO_FAKE_RPC'];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$debits) {
  if ($fn === 'resolve_trade') return null; // le crédit de l'ami échoue
  return ($GLOBALS['OROLADO_FAKE_RPC_BACKUP'])($fn, $a);
};
$frere0 = $bal[$U['u_frere']]; $paul0 = $bal[$U['u_paul']];
$r = send('u_paul', 'u_frere', 15);
check('envoi accepté (Paul débité de 15 $)', $r['ok'] === true && abs($bal[$U['u_paul']] - ($paul0 - 15)) < 0.001, (string) $bal[$U['u_paul']]);
check('frère pas encore crédité (base en panne)', $bal[$U['u_frere']] == $frere0);
$GLOBALS['OROLADO_FAKE_RPC'] = $GLOBALS['OROLADO_FAKE_RPC_BACKUP'];
st('u_paul'); st('u_paul'); st('u_paul');
check('base revenue : frère crédité de 15 $, une seule fois', $bal[$U['u_frere']] == $frere0 + 15, (string) $bal[$U['u_frere']]);

echo "10) Limite cachée par jour\n";
dep('u_paul', 2000, '2026-10-19');
$r = send('u_paul', 'u_frere', 900); // déjà 35 $ envoyés aujourd'hui
$r2 = send('u_paul', 'u_frere', 200);
check('plus de 1 000 $ envoyés en 24 h : refusé (sécurité, compte volé)', $r['ok'] === true && $r2['ok'] === false && $r2['reason'] === 'dayMax', json_encode([$r['ok'], $r2['reason'] ?? '']));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
