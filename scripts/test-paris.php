<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2690 — Paris sportifs manuels (sports_lib.php). Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_paris_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = [];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') { if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient']; $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2); return ['ok' => true, 'real' => $bal[$u]]; }
  if ($fn === 'resolve_trade') { $k = $u . '|' . $a['p_order']; if (!isset($keys[$k])) { $keys[$k] = 1; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); } return ['ok' => true, 'real' => $bal[$u]]; }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php'; require $tmp . '/sports_lib.php';
@file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10.done', '1'); @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10b.done', '1'); // pas de publication automatique pendant le test
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $B];
$db['vault']['u_a'] = ['demo' => 1000, 'real' => 100]; $db['vault']['u_b'] = ['demo' => 1000, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$A] = 100.0; $bal[$B] = 100.0;
$ua = $db['users']['u_a']; $ub = $db['users']['u_b'];
$t = time() + 3600;

echo "1) L'admin crée des matchs\n";
$r = sp_admin_save(['title' => 'Real – Barça', 'league' => 'Liga', 'sport' => 'foot', 'start' => $t, 'opts' => [['label' => 'Real', 'odd' => 1.9], ['label' => 'Nul', 'odd' => 3.2], ['label' => 'Barça', 'odd' => 2.1]], 'maxStake' => 20]);
check('match 1 créé', $r['ok'] === true); $e1 = $r['id'];
$r = sp_admin_save(['title' => 'Lakers – Celtics', 'league' => 'NBA', 'sport' => 'basket', 'start' => $t, 'opts' => [['label' => 'Lakers', 'odd' => 1.8], ['label' => 'Celtics', 'odd' => 1.95]]]);
check('match 2 créé', $r['ok'] === true); $e2 = $r['id'];
check('cote invalide refusée', sp_admin_save(['title' => 'X – Y', 'start' => $t, 'opts' => [['label' => 'X', 'odd' => 0.5], ['label' => 'Y', 'odd' => 2]]])['ok'] === false);
check('date passée refusée', sp_admin_save(['title' => 'X – Y', 'start' => time() - 10, 'opts' => [['label' => 'X', 'odd' => 2], ['label' => 'Y', 'odd' => 2]]])['ok'] === false);
check('les joueurs voient 2 matchs ouverts', count(array_filter(sp_public_events(), fn($e) => $e['open'])) === 2);

echo "2) Coupons\n";
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => $e1, 'k' => 'o0'], ['ev' => $e2, 'k' => 'o1']]);
check('coupon 2 matchs : cote 1,90 × 1,95 = 3,70, gain possible 37 $', $r['ok'] && abs($r['bet']['odd'] - 3.70) < 0.001 && abs($r['bet']['pot'] - 37) < 0.01 && $bal[$A] == 90.0, json_encode($r['bet'] ?? $r));
$r = sp_bet(load_db(), $ub, 'real', 30, [['ev' => $e1, 'k' => 'o2']]);
check('v2779 : AUCUNE mise maximale — B parie 30 $ sur Barça (ancienne limite du match : 20 $)', $r['ok'] === true && $bal[$B] == 70.0);
$r = sp_bet(load_db(), $ub, 'real', 1, [['ev' => $e1, 'k' => 'o0'], ['ev' => $e1, 'k' => 'o2']]);
check('2 choix du même match dans un coupon : refusé', $r['ok'] === false);
$r = sp_bet(load_db(), $ub, 'real', 0.05, [['ev' => $e2, 'k' => 'o0']]);
check('mise de 0,05 $ : refusée', $r['ok'] === false && $r['reason'] === 'min');
$r = sp_bet(load_db(), $ub, 'real', 0.10, [['ev' => $e2, 'k' => 'o0']]);
check('v2779 : mise de 0,10 $ acceptée', $r['ok'] === true && abs($bal[$B] - 69.90) < 0.001);
$r = sp_bet(load_db(), $ub, 'demo', 5, [['ev' => $e2, 'k' => 'o0']]);
check('« démo » demandée : pari en RÉEL (pas de démo)', $r['ok'] === true && $r['bet']['mode'] === 'real' && load_db()['vault']['u_b']['demo'] == 1000 && abs($bal[$B] - 64.90) < 0.001);
sp_admin_close($e2);
$r = sp_bet(load_db(), $ua, 'real', 1, [['ev' => $e2, 'k' => 'o0']]);
check('match fermé par l\'admin : plus de pari', $r['ok'] === false && $r['reason'] === 'closed');

echo "3) Résultats et paiements\n";
$r = sp_admin_settle(load_db(), $e1, 'o0'); // Real gagne
check('résultat match 1 : Real — B (Barça) perd, coupon de A attend le match 2', $r['ok'] && $r['lost'] === 1 && abs($bal[$B] - 64.90) < 0.001 && $bal[$A] == 90.0, json_encode($r));
$r = sp_admin_settle(load_db(), $e2, 'o1'); // Celtics gagne
check('résultat match 2 : Celtics — A gagne 37 $', $r['ok'] && abs($bal[$A] - 127) < 0.001, (string) $bal[$A]);
check('paris de B sur Lakers perdus', abs($bal[$B] - 64.90) < 0.001);
$r = sp_admin_settle(load_db(), $e2, 'o1');
check('donner le résultat 2 fois : refusé, rien de payé en plus', $r['ok'] === false && abs($bal[$A] - 127) < 0.001);
sp_resolve(load_db()); sp_resolve(load_db());
check('relancer le règlement : jamais payé 2 fois', abs($bal[$A] - 127) < 0.001);
$mine = sp_my_bets('u_a');
check('« mes paris » : coupon gagné avec le détail', $mine[0]['status'] === 'won' && $mine[0]['sel'][0]['r'] === 'won' && $mine[0]['sel'][1]['r'] === 'won');

echo "4) Match annulé : compte ×1\n";
$r = sp_admin_save(['title' => 'Boxe A – B', 'sport' => 'boxe', 'start' => $t, 'opts' => [['label' => 'A', 'odd' => 1.5], ['label' => 'B', 'odd' => 2.5]]]); $e3 = $r['id'];
$r = sp_admin_save(['title' => 'Tennis C – D', 'sport' => 'tennis', 'start' => $t, 'opts' => [['label' => 'C', 'odd' => 2.0], ['label' => 'D', 'odd' => 1.7]]]); $e4 = $r['id'];
sp_bet(load_db(), $ub, 'real', 10, [['ev' => $e3, 'k' => 'o0'], ['ev' => $e4, 'k' => 'o0']]);
$b0 = $bal[$B];
sp_admin_settle(load_db(), $e3, 'void');
sp_admin_settle(load_db(), $e4, 'o0');
check('boxe annulée + tennis gagné : gain = 10 × 2,0 = 20 $', abs($bal[$B] - ($b0 + 20)) < 0.001, (string) ($bal[$B] - $b0));
$r = sp_admin_save(['title' => 'Combat E – F', 'sport' => 'boxe', 'start' => $t, 'opts' => [['label' => 'E', 'odd' => 1.6], ['label' => 'F', 'odd' => 2.3]]]); $e6 = $r['id'];
sp_bet(load_db(), $ub, 'real', 7, [['ev' => $e6, 'k' => 'o1']]);
$b1 = $bal[$B];
sp_admin_settle(load_db(), $e6, 'void');
$mb = sp_my_bets('u_b');
check('v2779 : match annulé seul → coupon « Remboursé », 7 $ rendus, visible dans Mes paris', abs($bal[$B] - ($b1 + 7)) < 0.001 && $mb[0]['status'] === 'void' && $mb[0]['sel'][0]['r'] === 'void' && $mb[0]['done'] > 0);

echo "5) Gain maximal caché\n";
$r = sp_admin_save(['title' => 'Gros match', 'start' => $t, 'opts' => [['label' => 'X', 'odd' => 100], ['label' => 'Y', 'odd' => 1.01]], 'maxStake' => 1000]); $e5 = $r['id'];
$bal[$A] = 1000.0;
$r = sp_bet(load_db(), $ua, 'real', 61, [['ev' => $e5, 'k' => 'o0']]);
check('v2779 : 61 $ à cote 100 (= 6 100 $) : refusé, gain max 6 000 $', $r['ok'] === false && $r['reason'] === 'maxWin');
$r = sp_bet(load_db(), $ua, 'real', 60, [['ev' => $e5, 'k' => 'o0']]);
check('v2779 : 60 $ à cote 100 (= 6 000 $) : accepté', $r['ok'] === true);
$r = sp_bet(load_db(), $ua, 'real', 900, [['ev' => $e5, 'k' => 'o1']]);
check('v2779 : grosse mise 900 $ à cote 1,01 : acceptée (pas de mise max)', $r['ok'] === true);
check('v2779 : « Mes paris » garde jusqu’à 300 coupons', SP_MY_BETS === 300);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
