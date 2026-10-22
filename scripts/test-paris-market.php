<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-10-21 — 1) VRAIES COTES DU MARCHÉ (sp_market_fix) : cotes = 0,94 ÷ probabilité du marché, toujours sous la cote moyenne,
 *    paris déjà pris intacts, événements sans cote du marché cachés (« hold »), événements de l'admin pas touchés, une seule fois.
 * 2) ORDRE SÛR des paris (coupon écrit AVANT le retrait de la mise, retiré si la caisse refuse, gardé « pend » si l'issue est
 *    inconnue — jamais remboursé tout seul) et 3) « cotes changées » (cote affichée ≠ cote actuelle → refus « odds »).
 * Dossier temporaire, fausse caisse.
 */
$tmp = sys_get_temp_dir() . '/orolado_pmkt_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = []; $seenAtDebit = []; $boom = false; $credits = 0;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$seenAtDebit, &$boom, &$credits) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') {
    // au moment du retrait, le coupon doit DÉJÀ être écrit (état « pend »)
    $st = json_decode((string) @file_get_contents(sp_dir() . DIRECTORY_SEPARATOR . 'bets.json'), true);
    foreach ((array) ($st['b'] ?? []) as $b) if (($b['status'] ?? '') === 'pend') $seenAtDebit[$b['id']] = 'pend';
    if ($boom) throw new RuntimeException('caisse coupée en plein retrait');
    if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient'];
    $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2); return ['ok' => true, 'real' => $bal[$u]];
  }
  if ($fn === 'resolve_trade') { $credits++; $k = $u . '|' . $a['p_order']; if (!isset($keys[$k])) { $keys[$k] = 1; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); } return ['ok' => true, 'real' => $bal[$u]]; }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php'; require $tmp . '/sports_lib.php';
foreach (['seed-2026-10.done', 'seed-2026-10b.done', 'seed-2026-10c.done', 'seed-2026-10d.done', 'seed-2026-10e.done', 'draw-2026-10.done', 'stale-2026-10.done', 'market-2026-10-21.done'] as $f) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $f, '1');
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
save_db(orolado_data_file(), $db); $bal[$A] = 100.0;
$U = static fn() => load_db()['users']['u_a'];
$ev = static function (string $id): array { foreach (sp_events() as $e) if ($e['id'] === $id) return $e; return []; };
$t0 = time() + 5 * 86400;
$mk = static fn(string $title, array $opts, string $sport = 'foot') => sp_admin_save(['title' => $title, 'league' => 'Test', 'sport' => $sport, 'start' => $t0, 'logos' => ['img/teams/chelsea.png', 'img/teams/tottenham.png'], 'opts' => array_map(static fn($o) => ['label' => $o[0], 'odd' => $o[1]], $opts)])['id'];

echo "1) Vraies cotes du marché\n";
$market = sp_market_2026_10_21();
check('table du marché : au moins 25 matchs, 3 bookmakers ou plus, adresse de la source', count($market) >= 25 && !array_filter($market, static fn($r) => (int) $r[1] < 3 || !preg_match('#^https://www\.betexplorer\.com/#', (string) $r[2])), (string) count($market));
$bad = [];
foreach ($market as $t => $r) {
  $o = sp_mkt_odds($r[0]); $inv = 0;
  foreach ($o as $j => $v) { $inv += 1 / $v; if ($v >= $r[0][$j] - 1e-9) $bad[] = $t . ' (cote ' . $v . ' ≥ marché ' . $r[0][$j] . ')'; }
  if ($inv < 1 / 0.94 - 1e-9) $bad[] = $t . ' (marge < 6 %)';
}
check('chaque cote OROLADO est SOUS la cote moyenne du marché, marge maison ≥ 6 %', !$bad, implode(' | ', array_slice($bad, 0, 3)));
$tp = 'Chelsea - Tottenham'; $th = 'Juventus - Napoli';
check('les titres testés viennent bien des séries', isset($market[$tp]) && !isset($market[$th]));
$idP = $mk($tp, [['Chelsea', 2.38], ['Nul', 3.48], ['Tottenham', 2.80]]);
$idH = $mk($th, [['Juventus', 2.47], ['Nul', 3.48], ['Napoli', 2.68]]);
$idA = $mk('Admin FC - Test United', [['Admin FC', 1.90], ['Nul', 3.30], ['Test United', 3.90]]);
$b0 = sp_bet(load_db(), $U(), 'real', 5, [['ev' => $idP, 'k' => 'o0']]);
check('pari pris AVANT la mise à jour (cote 2,38)', !empty($b0['ok']) && $b0['bet']['odd'] === 2.38);
$r = sp_market_fix();
check('mise à jour : 1 événement coté, 1 en attente (l\'événement de l\'admin n\'est pas compté)', ($r['priced'] ?? -1) === 1 && ($r['held'] ?? -1) === 1, json_encode($r));
$eP = $ev($idP); $want = sp_mkt_odds($market[$tp][0]);
check('nouvelles cotes = 0,94 ÷ probabilité du marché (mêmes clés de choix)', array_column($eP['opts'], 'odd') === $want && array_column($eP['opts'], 'k') === ['o0', 'o1', 'o2'], json_encode(array_column($eP['opts'], 'odd')));
check('source gardée sur l\'événement (betexplorer, moyenne, nombre de bookmakers)', ($eP['mkt']['src'] ?? '') === $market[$tp][2] && ($eP['mkt']['n'] ?? 0) === $market[$tp][1]);
$mine = sp_my_bets('u_a');
check('le pari déjà pris garde SA cote (2,38) et son gain possible', $mine && $mine[0]['odd'] === 2.38 && $mine[0]['sel'][0]['odd'] === 2.38 && abs($mine[0]['pot'] - 11.9) < 0.001);
check('événement de l\'admin : pas touché', array_column($ev($idA)['opts'], 'odd') === [1.90, 3.30, 3.90] && empty($ev($idA)['hold']));
$pub = array_column(sp_public_events(), 'id');
check('événement sans cote du marché : caché aux joueurs', !in_array($idH, $pub, true) && in_array($idP, $pub, true) && in_array($idA, $pub, true));
$rb = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idH, 'k' => 'o0']]);
check('… et aucun pari possible dessus (« closed »)', empty($rb['ok']) && ($rb['reason'] ?? '') === 'closed', json_encode($rb));
$ro = sp_admin_odds($idH, ['o0' => 2.30, 'o1' => 3.20, 'o2' => 2.90]);
check('l\'admin pose de vraies cotes → l\'événement réapparaît', !empty($ro['ok']) && empty($ev($idH)['hold']) && in_array($idH, array_column(sp_public_events(), 'id'), true));
// une seule fois (drapeau)
@unlink(sp_dir() . DIRECTORY_SEPARATOR . 'market-2026-10-21.done');
sp_with('events.json', static function (array &$s) use ($idP) { foreach ($s['e'] as $i => $e) if ($e['id'] === $idP) $s['e'][$i]['opts'][0]['odd'] = 1.50; return true; });
sp_public_events(); // 1re ouverture : mise à jour faite
$o1 = $ev($idP)['opts'][0]['odd'];
sp_with('events.json', static function (array &$s) use ($idP) { foreach ($s['e'] as $i => $e) if ($e['id'] === $idP) $s['e'][$i]['opts'][0]['odd'] = 1.50; return true; });
sp_public_events(); sp_public_events();
check('mise à jour faite UNE seule fois (drapeau market-2026-10-21.done)', $o1 === $want[0] && $ev($idP)['opts'][0]['odd'] === 1.50, $o1 . ' / ' . $ev($idP)['opts'][0]['odd']);
sp_admin_odds($idP, ['o0' => $want[0]]);

echo "2) Ordre sûr : coupon écrit AVANT le retrait de la mise\n";
$bal[$A] = 50.0; $seenAtDebit = [];
$b1 = sp_bet(load_db(), $U(), 'real', 2, [['ev' => $idA, 'k' => 'o0']]);
check('pari de match accepté', !empty($b1['ok']));
check('au moment du retrait, le coupon était déjà écrit (« pend »)', ($seenAtDebit[$b1['bet']['id']] ?? '') === 'pend', json_encode($seenAtDebit));
$stored = array_values(array_filter((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []), static fn($b) => $b['id'] === $b1['bet']['id']));
check('après le retrait : coupon « open », montré dans Mes paris, mise retirée une fois', $stored && $stored[0]['status'] === 'open' && in_array($b1['bet']['id'], array_column(sp_my_bets('u_a'), 'id'), true) && abs($bal[$A] - 48.0) < 0.001, (string) $bal[$A]);
$n0 = count((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []));
$b2 = sp_bet(load_db(), $U(), 'real', 500, [['ev' => $idA, 'k' => 'o0']]);
$n1 = count((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []));
check('solde insuffisant : refus net, coupon réservé retiré, rien pris', empty($b2['ok']) && ($b2['reason'] ?? '') === 'insufficient' && $n1 === $n0 && abs($bal[$A] - 48.0) < 0.001, json_encode($b2));
$boom = true; $threw = false; $credits0 = $credits;
try { sp_bet(load_db(), $U(), 'real', 3, [['ev' => $idA, 'k' => 'o2']]); } catch (Throwable $ex) { $threw = true; }
$boom = false;
$all = (array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []);
$unk = array_values(array_filter($all, static fn($b) => ($b['status'] ?? '') === 'pend'));
check('caisse coupée pendant le retrait : erreur remontée, coupon GARDÉ « pend » + « chk » pour l\'admin', $threw && count($unk) === 1 && !empty($unk[0]['chk']));
check('… jamais remboursé tout seul, jamais montré au joueur, jamais réglé', $credits === $credits0 && !in_array($unk[0]['id'], array_column(sp_my_bets('u_a'), 'id'), true));
sp_admin_settle(load_db(), $idA, 'o2');
$unk2 = array_values(array_filter((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []), static fn($b) => $b['id'] === $unk[0]['id']));
check('… même après le résultat du match (reste « pend » pour vérification)', $unk2 && $unk2[0]['status'] === 'pend' && $credits === $credits0 + 1, (string) $credits);
check('l\'admin voit ce coupon dans la liste des paris de l\'événement', in_array($unk[0]['id'], array_column(sp_admin_event_bets($idA)['bets'] ?? [], 'id'), true));

echo "3) Cotes changées\n";
$idC = $mk('Cotes FC - Change United', [['Cotes FC', 2.00], ['Nul', 3.40], ['Change United', 3.50]]);
$bal[$A] = 50.0;
sp_admin_odds($idC, ['o0' => 1.90]);
$r1 = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idC, 'k' => 'o0', 'odd' => 2.00]]);
check('cote affichée 2,00 mais cote actuelle 1,90 : refus « odds » avec la nouvelle cote', empty($r1['ok']) && ($r1['reason'] ?? '') === 'odds' && (float) ($r1['odds'][0]['odd'] ?? 0) === 1.90, json_encode($r1));
check('… rien n\'est retiré, rien n\'est écrit', abs($bal[$A] - 50.0) < 0.001 && !array_filter((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []), static fn($b) => ($b['sel'][0]['ev'] ?? '') === $idC));
$r2 = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idC, 'k' => 'o0', 'odd' => 1.90]]);
check('le joueur confirme à 1,90 : accepté à 1,90', !empty($r2['ok']) && $r2['bet']['odd'] === 1.90);
$r3 = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idC, 'k' => 'o2', 'odd' => '3.5']]);
check('cote envoyée en texte « 3.5 » = 3,50 : acceptée', !empty($r3['ok']));
$r4 = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idC, 'k' => 'o1']]);
check('ancienne page (sans cote envoyée) : acceptée comme avant', !empty($r4['ok']));
// réglage du joueur « si la cote change » (acc)
sp_admin_odds($idC, ['o2' => 3.60]); // la cote MONTE (3,50 → 3,60)
$u1 = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idC, 'k' => 'o2', 'odd' => 3.50]], 0, 'none');
$u2 = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idC, 'k' => 'o2', 'odd' => 3.50]], 0, 'up');
check('« toujours demander » : hausse refusée (« odds ») ; « seulement les hausses » : acceptée à la NOUVELLE cote 3,60', ($u1['reason'] ?? '') === 'odds' && !empty($u2['ok']) && $u2['bet']['odd'] === 3.60, json_encode([$u1['reason'] ?? '', $u2['bet']['odd'] ?? $u2]));
sp_admin_odds($idC, ['o2' => 3.40]); // la cote BAISSE
$u3 = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idC, 'k' => 'o2', 'odd' => 3.60]], 0, 'up');
$u4 = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idC, 'k' => 'o2', 'odd' => 3.60]], 0, 'any');
check('« seulement les hausses » : baisse refusée ; « tout accepter » : accepté à la cote ACTUELLE 3,40 (jamais celle du téléphone)', ($u3['reason'] ?? '') === 'odds' && !empty($u4['ok']) && $u4['bet']['odd'] === 3.40, json_encode([$u3['reason'] ?? '', $u4['bet']['odd'] ?? $u4]));
$u5 = sp_bet(load_db(), $U(), 'real', 1, [['ev' => $idC, 'k' => 'o2', 'odd' => 9.99]], 0, 'bizarre');
check('réglage inconnu = « toujours demander »', ($u5['reason'] ?? '') === 'odds');
$js = (string) file_get_contents(__DIR__ . '/../js/sports.js');
check('le téléphone envoie son réglage « si la cote change »', str_contains($js, "acc: accMode()") && str_contains((string) file_get_contents(__DIR__ . '/../api.php'), "\$req['acc']"));
check('« cotes changées » traduit dans les 12 langues (js/sports.js)', substr_count($js, "e_odds: '") === 12);
check('le téléphone envoie la cote affichée avec chaque choix', str_contains($js, 'k: z.k, odd: z.odd'));
echo "4) Autant de matchs que le joueur veut (50 par coupon)\n";
$many = [];
for ($i = 0; $i < 51; $i++) $many[] = $mk('Equipe' . $i . ' FC - Rival' . $i . ' United', [['Equipe' . $i, 1.05], ['Nul', 9.0], ['Rival' . $i, 20.0]]);
$bal[$A] = 50.0;
$sel50 = array_map(static fn($id) => ['ev' => $id, 'k' => 'o0', 'odd' => 1.05], array_slice($many, 0, 50));
$m50 = sp_bet(load_db(), $U(), 'real', 1, $sel50);
$want50 = 1.0; foreach ($sel50 as $x) $want50 *= 1.05; $want50 = floor($want50 * 100 + 1e-6) / 100;
check('combiné de 50 matchs accepté, cote = produit arrondi au cent inférieur', !empty($m50['ok']) && count($m50['bet']['sel']) === 50 && abs($m50['bet']['odd'] - $want50) < 1e-9, json_encode($m50['bet']['odd'] ?? $m50));
$m51 = sp_bet(load_db(), $U(), 'real', 1, array_map(static fn($id) => ['ev' => $id, 'k' => 'o0'], $many));
check('51 matchs : accepté aussi (aucune limite pratique, 1000 au plus)', !empty($m51['ok']) && count($m51['bet']['sel']) === 51, json_encode($m51['reason'] ?? null));
check('aucune limite de gain (propriétaire) : grosse mise sur très grosse cote acceptée', SP_MAX_SEL === 1000 && !empty(sp_bet(load_db(), $U(), 'real', 1, array_map(static fn($id) => ['ev' => $id, 'k' => 'o2'], array_slice($many, 0, 10)))['ok']));
check('le téléphone accepte aussi 1000 sélections (js/sports.js)', str_contains($js, 'slip.length >= 1000'));
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
