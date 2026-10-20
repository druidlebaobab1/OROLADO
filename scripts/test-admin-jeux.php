<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2843 — ADMIN « Jeux » : chaque partie (Action, Live, Casino, et tout jeu ajouté par une fiche casino_ext/) est
 * enregistrée dans le journal des parties et visible dans l'admin (fiche joueur, direct, statistiques, trades ou jeux).
 * Fausse caisse, fausse base, dossier temporaire : rien ne part en ligne.
 * Lancer : php scripts/test-admin-jeux.php
 */
$tmp = sys_get_temp_dir() . '/orolado_admjeux_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
mkdir($tmp . '/casino_ext', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'casino_ext.php', 'admin_lib.php', 'admin_games_lib.php',
  'history_lib.php', 'wipe_lib.php', 'admin_gift_lib.php', 'push_lib.php', 'top_lib.php', 'defi_lib.php', 'bonus_lib.php', 'sports_lib.php'] as $f) {
  if (is_file(__DIR__ . '/../' . $f)) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
}
foreach (glob(__DIR__ . '/../casino_ext/*.php') ?: [] as $f) copy($f, $tmp . '/casino_ext/' . basename($f));
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
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php';
require $tmp . '/admin_lib.php'; require $tmp . '/admin_games_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@test.com', 'displayName' => 'Alice', 'role' => 'user', 'sbId' => $A, 'publicId' => 'ORO-101', 'createdAt' => gmdate('c', time() - 86400)];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@test.com', 'displayName' => 'Bob', 'role' => 'user', 'sbId' => $B, 'publicId' => 'ORO-102', 'createdAt' => gmdate('c', time() - 86400)];
$db['users']['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin', 'publicId' => 'ORO-ADMIN'];
$db['vault']['u_a'] = ['demo' => 1000, 'real' => 0]; $db['vault']['u_b'] = ['demo' => 1000, 'real' => 0]; $db['vault']['admin_master'] = ['demo' => 100000, 'real' => 0];
// trades réels (pour « Trades ou jeux ? ») : Alice 4 trades de 5 $, net joueur −10 $
for ($i = 0; $i < 4; $i++) $db['orders'][] = ['id' => 'o' . $i, 'userId' => 'u_a', 'assetId' => 'v100', 'side' => 'call', 'stake' => 5.0, 'duration' => 10, 'mode' => 'real',
  'won' => $i === 0, 'net' => $i === 0 ? 5.0 : -5.0, 'status' => $i === 0 ? 'won' : 'lost', 'payout' => 2.0, 'at' => time() - 60 * ($i + 1)];
save_db(orolado_data_file(), $db);
$bal[$A] = 100000.0; $bal[$B] = 100000.0;
$ua = $db['users']['u_a']; $ub = $db['users']['u_b']; $adm = $db['users']['admin_master'];

echo "1) Chaque jeu joué → une ligne dans le journal (tous les jeux : anciens + fiches casino_ext)\n";
$P = ['side' => 0, 'chance' => 50, 'over' => 1, 'target' => 2, 'bet' => 'red', 'picks' => [3, 9, 15], 'pick' => 0, 'aim' => 1, 'z' => 4, 'duel' => 'red'];
$alt = [['bet' => 'dragon'], ['bet' => 'player'], ['bet' => 'small'], ['bet' => 'green'], ['picks' => [5, 17, 33]]];
$played = []; $notPlayed = [];
foreach (admin_gm_all_games() as $g) {
  if (in_array($g, CASINO_RETIRED, true)) continue;
  $t = casino_ext_type($g);
  $ok = false;
  if ($t === 'skill') {
    $r = casino_multi(load_db(), $ua, $g, 'start', 'real', 1, []);
    $r2 = casino_multi(load_db(), $ua, $g, 'cash', 'real', 0, []);
    $ok = !empty($r['ok']) && !empty($r2['done']);
  } elseif (casino_is_draw($g)) {
    // tour en direct : pari, puis le tour se ferme (on avance l'heure de fermeture du pari) et se règle
    $sels = isset(CASINO_LIVE2[$g]) ? array_keys(casino_live2_odds($g)) : ($g === 'horses' ? ['w0'] : ($g === 'roulette' ? ['red'] : ['0']));
    $r = casino_multi(load_db(), $ua, $g, 'bet', 'real', 1, ['sel' => (string) $sels[0]]);
    if (!empty($r['ok'])) {
      casino_with(casino_user_file('u_a'), static function (array &$st) use ($g) { $st['g'][$g]['close'] = microtime(true) - 1; return true; });
      $r2 = casino_multi(load_db(), $ua, $g, 'dround', 'real', 0, []);
      $ok = !empty($r2['done']);
    } else { $notPlayed[$g] = 'mises fermées (' . ($r['reason'] ?? '') . ')'; continue; }
  } elseif (casino_is_crash($g)) {
    $r = casino_multi(load_db(), $ua, $g, 'start', 'real', 1, []);
    $r2 = casino_multi(load_db(), $ua, $g, 'cash', 'real', 0, []);
    $ok = !empty($r['ok']) && !empty($r2['done']);
  } elseif (in_array($g, CASINO_MULTI, true)) {
    $r = casino_multi(load_db(), $ua, $g, 'start', 'real', 1, ['mines' => 3, 'level' => 1]);
    $step = ['tower' => 'pick', 'balloon' => 'pump', 'penalty' => 'shoot', 'apple' => 'pick', 'mines' => 'open', 'hilo' => 'guess'][$g] ?? 'cash';
    $r2 = casino_multi(load_db(), $ua, $g, $step, 'real', 0, ['door' => 0, 'cell' => 0, 'z' => 4, 'hi' => 1]);
    if (empty($r2['done'])) $r2 = casino_multi(load_db(), $ua, $g, 'cash', 'real', 0, []);
    $ok = !empty($r['ok']) && !empty($r2['done']);
  } else {
    $r = casino_play(load_db(), $ua, $g, 'real', 1, $P);
    foreach ($alt as $a) { if (!empty($r['ok'])) break; $r = casino_play(load_db(), $ua, $g, 'real', 1, $a + $P); }
    $ok = !empty($r['ok']);
  }
  if ($ok) $played[] = $g; else $notPlayed[$g] = json_encode($r2 ?? $r);
  unset($r2);
}
check('au moins 100 jeux différents joués en argent réel', count($played) >= 100, count($played) . ' joués, non joués : ' . json_encode($notPlayed));
$st = json_decode((string) file_get_contents(casino_dir() . '/stats.json'), true);
$logN = [];
foreach (file(casino_dir('rounds') . '/' . gmdate('Y-m') . '.jsonl', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) { $j = json_decode($l, true); $logN[$j['m']][$j['g']] = ($logN[$j['m']][$j['g']] ?? 0) + 1; }
$diff = [];
foreach (($st['all'] ?? []) as $m => $gs) foreach ($gs as $g => $v) if (($logN[$m][$g] ?? 0) !== (int) $v['n']) $diff[] = "$m/$g stats={$v['n']} journal=" . ($logN[$m][$g] ?? 0);
check('chaque partie comptée dans les statistiques est aussi dans le journal (même nombre, jeu par jeu)', !$diff, implode(', ', array_slice($diff, 0, 5)));
$missing = array_diff($played, array_keys($logN['real'] ?? []));
check('chaque jeu joué apparaît dans le journal', !$missing, implode(',', $missing));
$skillN = count(array_filter($played, static fn($g) => casino_ext_type($g) === 'skill'));
$liveN = count(array_filter($played, static fn($g) => admin_gm_section($g) === 'live'));
check('sections : jeux Action (adresse) et Live présents', $skillN >= 20 && $liveN >= 3, "Action $skillN, Live $liveN");
// la mise prise et le gain versé correspondent au journal (rien de changé dans l'argent)
$sumS = 0.0; $sumW = 0.0;
foreach (file(casino_dir('rounds') . '/' . gmdate('Y-m') . '.jsonl', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) { $j = json_decode($l, true); if ($j['u'] === 'u_a') { $sumS += $j['s']; $sumW += $j['w']; } }
check('journal = argent réellement bougé (100 000 − misé + payé = solde)', abs((100000 - $sumS + $sumW) - $bal[$A]) < 0.01, sprintf('%.2f vs %.2f', 100000 - $sumS + $sumW, $bal[$A]));

echo "2) Fiche joueur : ses parties, de la plus récente à la plus ancienne, page par page, filtre réel / démo\n";
for ($i = 0; $i < 3; $i++) casino_play(load_db(), $adm, 'dice', 'demo', 1, $P); // admin : solde de test (démo)
for ($i = 0; $i < 5; $i++) casino_play(load_db(), $ub, 'coin', 'real', 2, $P);
$all = admin_gm_player('u_a', 'a@test.com', '', 0, 1000);
$nA = array_sum($logN['real'] ?? []);
check('fiche d\'Alice (id local) : toutes ses parties', $all['tot']['n'] === $nA && count($all['rows']) === $nA, $all['tot']['n'] . ' / ' . $nA);
$viaSb = admin_gm_player($A, 'a@test.com', '', 0, 5);
check('fiche ouverte par l\'id de la base (UUID) : mêmes parties', $viaSb['tot']['n'] === $nA);
$p1 = admin_gm_player('u_a', '', 'real', 0, 20);
$p2 = admin_gm_player('u_a', '', 'real', end($p1['rows'])['t'], 20);
$ts = array_merge(array_column($p1['rows'], 't'), array_column($p2['rows'], 't'));
$sorted = $ts; rsort($sorted);
check('pages : 20 + 20, plus récentes d\'abord, sans doublon', count($p1['rows']) === 20 && count($p2['rows']) === 20 && $ts === $sorted && count(array_unique(array_column(array_merge($p1['rows'], $p2['rows']), 'k'))) === 40 && $p1['more']);
$r0 = $p1['rows'][0];
check('chaque ligne : date, jeu, section, mise, gain, résultat, mode, multiplicateur', isset($r0['at'], $r0['name'], $r0['sec'], $r0['s'], $r0['w'], $r0['res'], $r0['m'], $r0['x']) && $r0['m'] === 'real');
$d = admin_gm_player('admin_master', '', 'demo', 0, 50);
$dr = admin_gm_player('admin_master', '', 'real', 0, 50);
check('filtre démo / réel', $d['tot']['n'] === 3 && $dr['tot']['n'] === 0 && $d['rows'][0]['m'] === 'demo');
// anciennes parties (avant le journal) : visibles, sans doublon
casino_with(casino_user_file('u_old'), static function (array &$st) { $st['h'] = [['g' => 'dice', 'm' => 'real', 's' => 3, 'w' => 0, 'at' => time() - 86400 * 3]]; $st['uid'] = 'u_old'; return true; });
$o = admin_gm_player('u_old', '', '', 0, 10);
check('parties d\'avant le journal visibles dans la fiche (marquées « ancien »)', $o['tot']['n'] === 1 && !empty($o['rows'][0]['old']));
check('pas de doublon entre journal et 40 dernières parties', admin_gm_player('u_b', '', '', 0, 100)['tot']['n'] === 5);

echo "3) Direct : toutes les parties, joueur cliquable, filtres\n";
$f = admin_gm_feed('', '', '', 0, 10);
check('direct : 10 parties, la plus récente d\'abord (Bob, Coin Flip)', count($f['rows']) === 10 && $f['more'] && $f['rows'][0]['g'] === 'coin' && $f['rows'][0]['pid'] === 'u_b' && $f['rows'][0]['pname'] === 'Bob');
$f2 = admin_gm_feed('', '', '', end($f['rows'])['t'], 10);
check('direct : page suivante plus ancienne, sans doublon', $f2['rows'] && $f2['rows'][0]['t'] < end($f['rows'])['t'] && !array_intersect(array_column($f['rows'], 'k'), array_column($f2['rows'], 'k')));
$fd = admin_gm_feed('demo', '', '', 0, 50);
check('direct : filtre démo (admin marqué)', count($fd['rows']) === 3 && $fd['rows'][0]['adm'] === 1);
$fl = admin_gm_feed('real', 'live', '', 0, 200);
check('direct : filtre section Live', $fl['rows'] && !array_filter($fl['rows'], static fn($r) => $r['sec'] !== 'live'));
$newest = $f['rows'][0]['t'];
usleep(2000);
casino_play(load_db(), $ub, 'dice', 'real', 1, $P);
$fa = admin_gm_feed('', '', '', 0, 200, $newest);
check('direct : les nouvelles parties arrivent (depuis la dernière vue)', count($fa['rows']) === 1 && $fa['rows'][0]['g'] === 'dice');
// une ligne coupée (écriture en cours) ne casse rien
file_put_contents(casino_dir('rounds') . '/' . gmdate('Y-m') . '.jsonl', '{"t":17', FILE_APPEND);
check('ligne incomplète ignorée', count(admin_gm_feed('', '', '', 0, 5)['rows']) === 5);

echo "4) Statistiques par jeu, par section, trades ou jeux\n";
$s = admin_gm_summary('today', 'real');
$coin = array_values(array_filter($s['games'], static fn($r) => $r['g'] === 'coin'))[0];
check('par jeu : Coin Flip joué par 2 joueurs (Alice + Bob)', $coin['players'] === 2 && $coin['n'] >= 6);
check('net maison = misé − payé', abs($s['total']['house'] - ($s['total']['in'] - $s['total']['out'])) < 0.01);
$secSum = array_sum(array_column($s['sections'], 'n'));
check('les 3 sections additionnées = total', $secSum === $s['total']['n'] && count($s['sections']) === 3);
check('tous les jeux du serveur listés (même sans partie)', count($s['games']) >= count(admin_gm_all_games()));
$sd = admin_gm_summary('today', 'demo');
check('compte admin non compté dans les statistiques', $sd['total']['n'] === 0);
$c = admin_gm_compare();
$today = $c['rows'][0];
check('trades ou jeux : trades d\'Alice comptés (4 trades, 20 $, maison +10 $)', $today['trades']['n'] === 4 && abs($today['trades']['vol'] - 20) < 0.01 && abs($today['trades']['house'] - 10) < 0.01, json_encode($today['trades']));
check('trades ou jeux : 2 joueurs de jeux, 1 fait les deux', $today['games']['players'] === 2 && $today['both'] === 1, json_encode($today));
check('règles de l\'admin inchangées (date de départ, pas de 0)', admin_stat_cutoff_ts() > 0);

echo "5) Un nouveau jeu ajouté plus tard par une fiche est enregistré tout seul\n";
file_put_contents($tmp . '/casino_ext/zz_test.php', "<?php return ['zztest' => ['type' => 'table', 'name' => 'Zz Test', 'out' => [[0, 60], [2, 40]]]];");
// les fiches sont lues une fois par requête : on relance dans un nouveau processus
$code = 'chdir(' . var_export($tmp, true) . '); $GLOBALS["OROLADO_FAKE_RPC"] = function ($fn, $a) { return $fn === "debit_real" ? ["ok" => true, "real" => 50] : ["ok" => true, "real" => 50]; };'
  . ' require "orolado_lib.php"; require "trade_lib.php"; require "aff_lib.php"; require "casino_lib.php"; $db = load_db();'
  . ' $r = casino_play($db, $db["users"]["u_b"], "zztest", "real", 1, []); echo json_encode($r["ok"] ?? false);';
$out = shell_exec(escapeshellarg(PHP_BINARY) . ' -r ' . escapeshellarg('putenv("SUPABASE_URL=https://fake.supabase.test"); putenv("SUPABASE_SERVICE_ROLE_KEY=x"); ' . $code) . ' 2>&1');
$z = admin_gm_feed('', '', 'zztest', 0, 5);
check('nouveau jeu joué → dans le journal, section Casino', trim((string) $out) === 'true' && count($z['rows']) === 1 && $z['rows'][0]['sec'] === 'casino', (string) $out);

// v2955 — contrôle « solde plus élevé que dépôts + bonus + gains » : les gains aux Jeux et aux Paris (réel) comptent
$C = 'cccccccc-1111-2222-3333-444444444444';
$db2 = load_db();
$db2['users']['u_c'] = ['id' => 'u_c', 'email' => 'c@test.com', 'role' => 'user', 'sbId' => $C, 'publicId' => 'ORO-103'];
save_db(orolado_data_file(), $db2);
casino_round_log('u_c', ['g' => 'mines', 'm' => 'real', 's' => 1, 'w' => 7]);   // +6 aux jeux
casino_round_log('u_c', ['g' => 'dice', 'm' => 'demo', 's' => 1, 'w' => 50]);   // démo : ne compte pas
require_once $tmp . '/sports_lib.php';
sp_with('bets.json', static function (array &$st) {
  $st['b'][] = ['id' => 'sp1', 'uid' => 'u_c', 'mode' => 'real', 'stake' => 2, 'win' => 5, 'status' => 'won', 'at' => time()];   // +3
  $st['b'][] = ['id' => 'sp2', 'uid' => 'u_c', 'mode' => 'real', 'stake' => 1, 'win' => 0, 'status' => 'open', 'at' => time()];  // −1 (en cours)
  $st['b'][] = ['id' => 'sp3', 'uid' => 'u_c', 'mode' => 'real', 'stake' => 4, 'win' => 0, 'status' => 'pend', 'at' => time()];  // réservé : ignoré
  return true;
});
$pn = admin_play_net('u_c', 'c@test.com');
check('gains réels Jeux + Paris comptés pour le contrôle du solde (6 + 3 − 1 = 8)', abs($pn - 8.0) < 0.001, (string) $pn);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
