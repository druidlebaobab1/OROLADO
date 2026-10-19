<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Test local du jeu équitable avec une FAUSSE caisse (aucun appel à Supabase).
 * Usage : php scripts/test-trades.php
 * Utilise un dossier data/ temporaire : ne touche jamais aux vraies données.
 */

$tmp = sys_get_temp_dir() . '/orolado_test_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
// Copie du code dans un dossier temporaire pour isoler data/.
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) {
  copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
}
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';

// Fausse caisse Supabase : mêmes règles que debit_real / resolve_trade.
$bank = ['real' => [], 'settled' => []];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bank) {
  $u = $a['p_user'];
  $bank['real'][$u] = $bank['real'][$u] ?? 0.0;
  if ($fn === 'debit_real') {
    if ($bank['real'][$u] + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient'];
    $bank['real'][$u] = round($bank['real'][$u] - $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bank['real'][$u]];
  }
  if ($fn === 'resolve_trade') {
    if (isset($bank['settled'][$a['p_order']])) return ['ok' => true, 'duplicate' => true, 'real' => $bank['real'][$u]];
    $bank['settled'][$a['p_order']] = $a['p_amount'];
    $bank['real'][$u] = round($bank['real'][$u] + $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bank['real'][$u]];
  }
  return null;
};

$pass = 0;
$fail = 0;
function check(string $what, bool $ok, string $detail = ''): void {
  global $pass, $fail;
  if ($ok) $pass++; else $fail++;
  echo ($ok ? '  OK   ' : '  ÉCHEC ') . $what . ($detail !== '' ? '  (' . $detail . ')' : '') . "\n";
}

$uid = '11111111-2222-3333-4444-555555555555';
$db = blank_db();
$db['users'][$uid] = ['id' => $uid, 'email' => 'test@orolado.local', 'role' => 'user'];
$db['vault'][$uid] = ['demo' => 1000.0, 'real' => 100.0];
save_db(orolado_data_file(), $db);
$bank['real'][$uid] = 100.0;
$me = $db['users'][$uid];

echo "1) Flux de prix\n";
$s1 = orolado_feed_advance('v100');
usleep(600000);
$s2 = orolado_feed_advance('v100');
check('le flux avance (~2 ticks en 0,6 s)', $s2['n'] - $s1['n'] >= 2 && $s2['n'] - $s1['n'] <= 4, ($s2['n'] - $s1['n']) . ' ticks');
$hist = orolado_feed_read('v100', $s2['n'] - 99, $s2['n']);
check('historique lisible, prix > 0', count($hist) === 100 && min($hist) > 0);
check('le dernier tick lu = état', end($hist) === $s2['c']);
check('pas de tick futur', orolado_feed_price_at('v100', $s2['n'] + 50) === null);
foreach (array_keys(orolado_feed_assets()) as $a) {
  $st = orolado_feed_advance($a);
  check("actif $a démarre", $st['c'] > 0, number_format($st['c'] / 100, 2, '.', ''));
}

echo "2) Trade réel 10 \$ CALL 88 % sur 5 s\n";
$r = orolado_trade_place($me, ['id' => 't1', 'stake' => 10, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => 'v100', 'payout' => 1.9]);
check('ordre accepté', !empty($r['ok']), $r['reason'] ?? '');
check('MOINS : caisse 100 → 90', abs($bank['real'][$uid] - 90) < 0.001, (string) $bank['real'][$uid]);
// 2026-10-19 : la ligne 90 % suit le petit retour vers le départ (faille fermée) : = règle publique, à 0,1 % de l'entrée au plus.
$eC = (int) round(((float) ($r['order']['entryPrice'] ?? 0)) * 100);
$bC = (int) round(((float) ($r['order']['barrier'] ?? -1)) * 100);
check('ligne 90 % = règle publique, au plus près du prix d’entrée', $eC > 0 && $bC === orolado_fair_barrier('v100', 5, 'call', 1.9, $eC) && abs($bC - $eC) <= max(1, $eC * 0.001), $bC . ' / ' . $eC);
$r2 = orolado_trade_place($me, ['id' => 't1', 'stake' => 10, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => 'v100', 'payout' => 1.9]);
check('double clic même ordre : pas de 2e débit', !empty($r2['duplicate']) && abs($bank['real'][$uid] - 90) < 0.001);
$early = orolado_trade_settle($uid, 't1');
check('règlement avant la fin : refusé (en cours)', !empty($early['pending']));
sleep(6);
$s = orolado_trade_settle($uid, 't1');
$o = $s['order'] ?? [];
$exit = orolado_feed_price_at('v100', (int) $o['expiryTick']);
$expect = $exit > (int) round($o['barrier'] * 100) ? 'won' : ($exit === (int) round($o['barrier'] * 100) ? 'void' : 'lost');
check('verdict = vrai prix d’expiration', ($o['status'] ?? '') === $expect, ($o['status'] ?? '?') . ' entrée ' . $o['entryPrice'] . ' sortie ' . ($exit / 100));
$want = $expect === 'won' ? 109.0 : ($expect === 'void' ? 100.0 : 90.0);
check('PLUS/perte : caisse correcte', abs($bank['real'][$uid] - $want) < 0.001, $bank['real'][$uid] . ' attendu ' . $want);
orolado_trade_settle($uid, 't1');
orolado_trade_settle($uid, 't1');
check('3 règlements = 1 seul crédit', abs($bank['real'][$uid] - $want) < 0.001);

echo "3) Refus (pas de plafond de gain)\n";
$bal = $bank['real'][$uid];
$r = orolado_trade_place($me, ['id' => 't2', 'stake' => 5000, 'side' => 'put', 'duration' => 5, 'mode' => 'real', 'assetId' => 'v100', 'payout' => 1.9]);
check('mise > solde (aucun plafond de gain) : refusée', empty($r['ok']) && abs($bank['real'][$uid] - $bal) < 0.001, $r['reason'] ?? '');
$r = orolado_trade_place($me, ['id' => 't3', 'stake' => 500, 'side' => 'put', 'duration' => 5, 'mode' => 'real', 'assetId' => 'v100', 'payout' => 1.9]);
check('solde insuffisant : refusé, caisse intacte', empty($r['ok']) && abs($bank['real'][$uid] - $bal) < 0.001, $r['reason'] ?? '');
$r = orolado_trade_place($me, ['id' => 't4', 'stake' => 1, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => 'nope', 'payout' => 1.9]);
check('actif inconnu : refusé', empty($r['ok']));

echo "4) ×5 PUT sur Boom + ×50 CALL sur Crash + démo\n";
$r = orolado_trade_place($me, ['id' => 't5', 'stake' => 2, 'side' => 'put', 'duration' => 5, 'mode' => 'real', 'assetId' => 'boomspike', 'payout' => 5]);
check('×5 accepté, ligne sous l’entrée', !empty($r['ok']) && $r['order']['barrier'] < $r['order']['entryPrice'], ($r['order']['entryPrice'] ?? '') . ' → ' . ($r['order']['barrier'] ?? ''));
$r = orolado_trade_place($me, ['id' => 't6', 'stake' => 1, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => 'crash300', 'payout' => 50]);
check('×50 accepté, ligne au-dessus', !empty($r['ok']) && $r['order']['barrier'] > $r['order']['entryPrice']);
$r = orolado_trade_place($me, ['id' => 'd1', 'stake' => 100, 'side' => 'put', 'duration' => 5, 'mode' => 'demo', 'assetId' => 'stable', 'payout' => 1.9]);
$dv = load_db()['vault'][$uid]['demo'];
check('démo : 1000 → 900', !empty($r['ok']) && abs($dv - 900) < 0.001, (string) $dv);

echo "5) Retour sur le site après expiration (F5) : règlement automatique\n";
$before = $bank['real'][$uid];
sleep(6);
$n = orolado_trade_settle_due($uid);
check('3 trades réglés d’un coup', $n === 3, (string) $n);
$db2 = load_db();
$open = array_filter($db2['orders'], fn($x) => ($x['status'] ?? '') === 'open');
check('plus aucun trade bloqué « en cours »', count($open) === 0);
$credits = 0.0;
foreach ($db2['orders'] as $x) {
  if (in_array($x['id'], ['t5', 't6'], true)) $credits += orolado_fair_credit($x['status'], (float) $x['stake'], (float) $x['payout']);
}
check('caisse réelle = avant + gains', abs($bank['real'][$uid] - ($before + $credits)) < 0.001, $before . ' + ' . $credits . ' = ' . $bank['real'][$uid]);
$demoOrder = array_values(array_filter($db2['orders'], fn($x) => $x['id'] === 'd1'))[0];
$wantDemo = 900 + orolado_fair_credit($demoOrder['status'], 100, (float) ($demoOrder['payout'] ?? 1.9));
check('démo créditée une fois', abs($db2['vault'][$uid]['demo'] - $wantDemo) < 0.001, $demoOrder['status'] . ' → ' . $db2['vault'][$uid]['demo']);

echo "6) Ancien trade ouvert (avant mise à jour) : mise rendue\n";
with_db_lock(function ($box) use ($uid) {
  $box->db['orders'][] = ['id' => 'old1', 'userId' => $uid, 'payId' => $uid, 'stake' => 7, 'side' => 'call', 'duration' => 10, 'mode' => 'real', 'assetId' => 'v100', 'payout' => 1.9, 'status' => 'open', 'at' => microtime(true) - 100, 'expiryAt' => microtime(true) - 90];
  return ['ok' => true];
});
$before = $bank['real'][$uid];
orolado_trade_settle_due($uid);
check('ancien trade : +7 $ rendus une fois', abs($bank['real'][$uid] - ($before + 7)) < 0.001);
orolado_trade_settle_due($uid);
check('pas de 2e remboursement', abs($bank['real'][$uid] - ($before + 7)) < 0.001);

echo "7) Même ordre envoyé 2 fois EN MÊME TEMPS (réseau lent) : une seule mise prise\n";
$orig = $GLOBALS['OROLADO_FAKE_RPC'];
$race = true;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use ($orig, $uid, &$race, &$bank) {
  if ($fn === 'debit_real' && $race) {
    // Pendant ce débit, l'AUTRE demande (même ordre) a déjà débité et enregistré le trade.
    $race = false;
    $bank['real'][$uid] = round($bank['real'][$uid] - $a['p_amount'], 2);
    with_db_lock(function ($box) use ($uid) {
      $box->db['orders'][] = ['id' => 'race1', 'userId' => $uid, 'payId' => $uid, 'stake' => 5, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => 'v100', 'payout' => 1.9, 'status' => 'open', 'at' => microtime(true), 'expiryAt' => microtime(true) + 5];
      return ['ok' => true];
    });
  }
  return $orig($fn, $a);
};
$before = $bank['real'][$uid];
$r = orolado_trade_place($me, ['id' => 'race1', 'stake' => 5, 'side' => 'call', 'duration' => 5, 'mode' => 'real', 'assetId' => 'v100', 'payout' => 1.9]);
$GLOBALS['OROLADO_FAKE_RPC'] = $orig;
$nRace = count(array_filter(load_db()['orders'], fn($x) => ($x['id'] ?? '') === 'race1'));
check('un seul trade enregistré', !empty($r['duplicate']) && $nRace === 1);
check('une seule mise de 5 $ prise (la 2e est rendue)', abs($bank['real'][$uid] - ($before - 5)) < 0.001, $before . ' → ' . $bank['real'][$uid]);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
