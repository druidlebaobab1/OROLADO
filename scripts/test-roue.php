<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2689 — Roue et grande jauge (gifts_lib.php) : chances (maison toujours gagnante), 1 tour par VRAI dépôt de 10 $+,
 * pas de limite par jour, bonus/admin ne donnent pas de tour, jamais payé deux fois, jauge pleine à 1 000 $ → 30 $.
 * Faux Supabase, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_roue_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'gifts_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OROLADO_GIFTS_START=2026-10-01 00:00:00 UTC');
$credits = [];
$calls = 0;
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$credits, &$calls) {
  if (str_contains($url, '/rpc/resolve_trade')) {
    $calls++;
    $b = json_decode((string) $body, true) ?: [];
    $k = $b['p_user'] . '|' . $b['p_order'];
    if (!isset($credits[$k])) $credits[$k] = (float) $b['p_amount'];
    $mine = 0.0;
    foreach ($credits as $kk => $v) if (str_starts_with($kk, $b['p_user'] . '|')) $mine += $v;
    return ['ok' => true, 'real' => $mine];
  }
  return [];
};
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/gifts_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
function paid(array $credits, string $uuid, string $pre): float { $s = 0.0; foreach ($credits as $k => $v) if (str_starts_with($k, $uuid . '|' . $pre)) $s += $v; return round($s, 2); }
$n = 0;
function dep(string $uid, float $amount, int $ts, string $op = 'flutterwave'): void {
  global $n; $n++;
  $db = load_db();
  $id = ($op === 'admin' ? 'adm_' : 'flw_') . 'r' . $n;
  $db['deposits'][] = ['id' => $id, 'ref' => $id, 'userId' => $uid, 'amount' => $amount, 'status' => 'COMPLETED', 'operator' => $op, 'createdAt' => date('c', $ts), 'paidAt' => date('c', $ts)];
  save_db(orolado_data_file(), $db);
}

echo "1) Les chances : la maison gagne toujours\n";
$ev = 0.0; $tot = 0;
foreach (OROLADO_WHEEL_ODDS as [$p, $w]) { $ev += $p * $w; $tot += $w; }
$ev /= $tot;
check('total des chances = 100 %', $tot === 10000);
check('coût moyen d\'un tour = 0,44 $ (avec l\'Invitation, un tricheur à 2 comptes perd encore)', abs($ev - 0.4375) < 0.001, (string) $ev);
check('pas de zéro : chaque tour gagne au moins 0,25 $', min(array_map(static fn($o) => $o[0], OROLADO_WHEEL_ODDS)) >= 0.25 && min(OROLADO_WHEEL_SEGS) >= 0.25);
$sum = 0.0; $N = 200000; $big = 0;
for ($i = 0; $i < $N; $i++) { $p = orolado_wheel_draw(); $sum += $p; if ($p >= 100) $big++; }
check('200 000 tirages : moyenne proche de 0,44 $', abs($sum / $N - 0.4375) < 0.06, (string) round($sum / $N, 3));
check('100 $ très rare (≈ 1 sur 2 000)', $big > 40 && $big < 180, (string) $big);
$segOk = true;
foreach (OROLADO_WHEEL_ODDS as [$p, $w]) { $s = orolado_wheel_seg($p); if (abs(OROLADO_WHEEL_SEGS[$s] - $p) > 0.001) $segOk = false; }
check('l\'aiguille s\'arrête toujours sur une case qui porte le gain tiré', $segOk);

$A = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_jo'] = ['id' => 'u_jo', 'email' => 'jo@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['vault']['u_jo'] = ['demo' => 1000000, 'real' => 0];
save_db(orolado_data_file(), $db);
$jo = $db['users']['u_jo'];

echo "2) Fermé aux joueurs tant que ce n'est pas ouvert à tous\n";
check('joueur normal : pas de roue', empty(orolado_gifts_status(load_db(), $jo)['enabled']));
putenv('OROLADO_GIFTS_PUBLIC=1');

echo "3) Tours gagnés seulement avec de vrais dépôts de 10 \$ ou plus\n";
$now = (int) strtotime('2026-10-20 12:00:00 UTC');
$r = orolado_gifts_status(load_db(), $jo, false, $now);
check('aucun dépôt : 0 tour', $r['tickets'] === 0);
$r = orolado_gifts_status(load_db(), $jo, true, $now);
check('tourner sans tour : refusé', $r['ok'] === false && $r['reason'] === 'noTicket');
dep('u_jo', 9, $now - 500);
dep('u_jo', 50, $now - 500, 'admin');
dep('u_jo', 25, (int) strtotime('2026-09-20 UTC'));
$r = orolado_gifts_status(load_db(), $jo, false, $now);
check('dépôt de 9 $, bonus admin 50 $, ancien dépôt avant la roue : toujours 0 tour', $r['tickets'] === 0, (string) $r['tickets']);
dep('u_jo', 10, $now - 400);
dep('u_jo', 30, $now - 300);
$r = orolado_gifts_status(load_db(), $jo, false, $now);
check('2 vrais dépôts de 10 $ et 30 $ : 2 tours', $r['tickets'] === 2);

echo "4) Chaque tour payé une seule fois (pas de limite par jour)\n";
$r = orolado_gifts_status(load_db(), $jo, true, $now);
check('1er tour accepté, gain tiré par le serveur', $r['ok'] === true && is_array($r['won']), json_encode($r['won']));
$prize1 = (float) $r['won']['prize'];
check('gain versé (bonus) = gain tiré', abs(paid($credits, $A, 'whl_') - $prize1) < 0.001, paid($credits, $A, 'whl_') . ' / ' . $prize1);
check('il reste 1 tour', orolado_gifts_status(load_db(), $jo, false, $now + 60)['tickets'] === 1);
for ($i = 0; $i < 3; $i++) orolado_gifts_status(load_db(), $jo, false, $now + 70 + $i);
check('relire l\'état ne repaie jamais', abs(paid($credits, $A, 'whl_') - $prize1) < 0.001);
$r3 = orolado_gifts_status(load_db(), $jo, true, $now + 90);
check('2e tour le même jour (2e dépôt, pas de limite par jour) : accepté', $r3['ok'] === true);
$r4 = orolado_gifts_status(load_db(), $jo, true, $now + 120);
check('plus de tour : refusé', $r4['ok'] === false && $r4['reason'] === 'noTicket');
$prizes = $prize1 + (float) $r3['won']['prize'];
check('total versé = somme des 2 gains', abs(paid($credits, $A, 'whl_') - $prizes) < 0.001);
$dbx = load_db();
$bon = 0.0;
foreach ($dbx['deposits'] as $d) if (str_starts_with((string) $d['id'], 'whl_')) { $bon += (float) $d['amount']; if (($d['operator'] ?? '') !== 'admin') $bon = -999; }
check('gain enregistré comme BONUS (miser ×2, pas transférable)', abs($bon - $prizes) < 0.001);

echo "5) Tours gagnés par la roue elle-même ? Non\n";
$r = orolado_gifts_status(load_db(), $jo, false, $now + 3 * 86400);
check('les bonus de la roue ne donnent pas de nouveau tour', $r['tickets'] === 0);

echo "6) Grande jauge : pleine à 1 000 \$ de vrais dépôts → 30 \$ en bonus, une seule fois\n";
check('jauge à 4 % (40 $ déposés)', $r['jauge'] === 4, (string) $r['jauge']);
dep('u_jo', 500, $now + 100);
dep('u_jo', 500, $now + 200, 'admin');
$r = orolado_gifts_status(load_db(), $jo, false, $now + 3 * 86400);
check('540 $ de vrais dépôts (le bonus admin ne compte pas) : 54 %', $r['jauge'] === 54 && $r['jaugeDone'] === 0, (string) $r['jauge']);
dep('u_jo', 470, $now + 300);
$r = orolado_gifts_status(load_db(), $jo, false, $now + 3 * 86400);
check('1 010 $ : jauge pleine, cadeau 30 $ versé, la jauge repart à 1 %', $r['jaugeDone'] === 1 && $r['jauge'] === 1 && abs(paid($credits, $A, 'jg_') - 30) < 0.001, json_encode([$r['jauge'], paid($credits, $A, 'jg_')]));
orolado_gifts_status(load_db(), $jo, false, $now + 3 * 86400 + 5);
check('relire : le cadeau de la jauge n\'est jamais repayé', abs(paid($credits, $A, 'jg_') - 30) < 0.001);

echo "7) 40 jours de tours : chaque gain versé exactement une fois\n";
$L = 'cccccccc-1111-2222-3333-444444444444';
$db = load_db();
$db['users']['u_lucky'] = ['id' => 'u_lucky', 'email' => 'lucky@gmail.com', 'role' => 'user', 'sbId' => $L];
$db['vault']['u_lucky'] = ['demo' => 0, 'real' => 0];
save_db(orolado_data_file(), $db);
$lu = $db['users']['u_lucky'];
for ($i = 0; $i < 40; $i++) dep('u_lucky', 10, $now - 1000 + $i);
$won = 0.0; $nz = 0;
for ($d = 0; $d < 40; $d++) { $r = orolado_gifts_status(load_db(), $lu, true, $now + $d * 86400); if (!empty($r['won'])) { $won += (float) $r['won']['prize']; if ($r['won']['prize'] > 0) $nz++; } }
check('40 tours joués, 40 gains (aucun zéro)', $nz === 40, $nz . ' gains, ' . $won . ' $');
check('total versé = total gagné (jamais en double)', abs(paid($credits, $L, 'whl_') - $won) < 0.001, paid($credits, $L, 'whl_') . ' / ' . $won);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
