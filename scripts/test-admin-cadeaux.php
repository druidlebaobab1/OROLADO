<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2426 — Rubrique admin « F · Cadeaux » (admin_gift_lib.php) : Invitation (affiliés, amis + alerte « même IP »),
 * Tournoi démo, Bonus dépôt, Défi du jour. Lecture seule. Dossier temporaire, faux Supabase : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_admgift_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'bonus_lib.php', 'top_lib.php', 'defi_lib.php', 'admin_gift_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['OROLADO_FAKE_HTTP'] = static fn() => [];
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
// Petites fonctions de l'admin utilisées par la rubrique.
function admin_money($v): string { return number_format((float) $v, 2, ',', ' ') . ' $'; }
function admin_page(array $rows, array $req): array { return [$rows, count($rows), 1, 1]; }
require $tmp . '/admin_gift_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'affilie@gmail.com', 'role' => 'user', 'publicId' => 'ORO-111111', 'name' => 'Awa', 'sbId' => 'sb-a'];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'ami1@gmail.com', 'role' => 'user', 'publicId' => 'ORO-222222', 'sbId' => 'sb-b'];
$db['users']['u_c'] = ['id' => 'u_c', 'email' => 'ami2@gmail.com', 'role' => 'user', 'publicId' => 'ORO-333333', 'sbId' => 'sb-c'];
save_db(orolado_data_file(), $db);
orolado_aff_with(orolado_aff_owner_name('u_a'), static function (&$st) {
  $st = ['clicks' => 7, 'earned' => 12.5, 'friends' => [
    ['uid' => 'u_b', 'at' => date('c', time() - 3600), 'ip' => '1.2.3.4', 'deposit' => 200, 'gift' => 10, 'paid' => true],
    ['uid' => 'u_c', 'at' => date('c'), 'ip' => '9.9.9.9', 'deposit' => 50, 'gift' => 2.5, 'paid' => true],
  ]];
});
orolado_bonus_with('u_b', static function (&$st) { $st['weeks']['2026-W41'] = ['activatedAt' => time() - 100, 'depositId' => 'd1', 'depositAmount' => 200, 'target' => 20, 'credited' => 4, 'staked' => 120, 'until' => time() + 86400]; });
orolado_defi_with('u_c', static function (&$st) { $st = ['activatedAt' => time() - 60, 'expiresAt' => time() + 3600, 'market' => 'horizon50', 'streak' => 2, 'finished' => false, 'won' => false, 'history' => [['market' => 'v100', 'won' => true, 'reward' => 6]]]; });
$people = [['email' => 'affilie@gmail.com', 'ip' => '9.9.9.9']];

echo "1) Invitation : affiliés\n";
$r = admin_gift_payload('gift_aff', [], $people);
$c = $r['rows'][0]['cells'] ?? [];
check('une ligne pour l’affilié, ses chiffres', count($r['rows']) === 1 && $c[0] === 'ORO-111111' && $c[3] === '7' && $c[4] === '2' && $c[5] === '2', json_encode($c));
check('alerte : un ami a la même IP que l’affilié', str_contains((string) ($c[8] ?? ''), '1 ami'), (string) ($c[8] ?? ''));
check('clic sur la ligne → fiche du joueur (identifiant Supabase)', ($r['rows'][0]['userId'] ?? '') === 'sb-a');

echo "2) Invitation : amis invités\n";
$r = admin_gift_payload('gift_friends', [], $people);
check('2 amis, le plus récent en premier', count($r['rows']) === 2 && $r['rows'][0]['cells'][0] === 'ORO-333333');
check('l’ami à la même IP est marqué', str_contains($r['rows'][0]['cells'][7], 'même IP'));
check('recherche par e-mail', count(admin_gift_payload('gift_friends', ['q' => 'ami1@'], $people)['rows']) === 1);

echo "3) Bonus dépôt et Défi du jour\n";
$r = admin_gift_payload('gift_bon', [], $people);
check('bonus en cours : 4 $ versés sur 20 $', count($r['rows']) === 1 && $r['rows'][0]['cells'][9] === 'Se remplit' && str_starts_with($r['rows'][0]['cells'][7], '4,00'), json_encode($r['rows'][0]['cells'] ?? []));
$r = admin_gift_payload('gift_defi', [], $people);
check('défi en cours sur ORO 999, 2 / 5, 1 défi gagné avant', count($r['rows']) === 1 && $r['rows'][0]['cells'][3] === 'ORO 999' && $r['rows'][0]['cells'][5] === '2 / 5' && $r['rows'][0]['cells'][8] === '1', json_encode($r['rows'][0]['cells'] ?? []));

echo "4) Tournoi démo\n";
$r = admin_gift_payload('gift_top', [], $people);
check('vue du tournoi sans erreur (personne de classé ici)', $r['ok'] === true && count($r['cols']) === 10 && end($r['cols']) === 'Payé', $r['summary']);

echo "5) Bonus à tous\n";
$U = static fn(int $i): string => sprintf('%08d-1111-2222-3333-444444444444', $i);
$prof = [
  ['id' => $U(1), 'email' => 'p1@gmail.com', 'name' => 'Awa', 'role' => 'user'],
  ['id' => $U(2), 'email' => '', 'name' => 'Sans Mail', 'role' => 'user'],
  ['id' => $U(3), 'email' => 'ban@gmail.com', 'role' => 'banned'],
  ['id' => $U(4), 'email' => 'adm@gmail.com', 'role' => 'admin'],
  ['id' => $U(5), 'email' => 'maison@gmail.com', 'role' => 'user'],
  ['id' => 'pas-un-uuid', 'email' => 'x@gmail.com', 'role' => 'user'],
  ['id' => $U(1), 'email' => 'p1@gmail.com', 'role' => 'user'],
  ['id' => $U(6), 'email' => 'p6@gmail.com', 'name' => 'Moussa', 'role' => 'user'],
];
$pl = admin_all_pay_players($prof, static fn(string $id, array $r): bool => $id === $U(5));
check('joueurs : bannis, admin, maison, faux id et doublons exclus', array_column($pl, 'id') === [$U(1), $U(2), $U(6)], json_encode(array_column($pl, 'id')));
check('montant : 0 refusé, 6 $ refusé, « 0,20 » accepté', !admin_all_pay_params(['amount' => '0'])['ok'] && !admin_all_pay_params(['amount' => '6'])['ok'] && admin_all_pay_params(['amount' => '0,20'])['amount'] === 0.2);
$pv = admin_all_pay_preview(['amount' => '0.20'], $pl);
check('aperçu : 3 joueurs, total 0,60 $, 2 avec e-mail', $pv['count'] === 3 && $pv['total'] === 0.6 && $pv['withMail'] === 2, json_encode($pv));
check('sans « PAYER » : rien', admin_all_pay_run(['amount' => '0.20'], $pl, static fn() => ['ok' => true])['ok'] === false);
$got = [];
$pay = static function (string $id, float $amt, string $motif, array $hint) use (&$got): array { $got[] = [$id, $amt]; $GLOBALS['OROLADO_NOTIFY_LAST'] = ['mail' => $hint['email'] !== '' ? 'sent' : 'none']; return ['ok' => true]; };
$r1 = admin_all_pay_run(['amount' => '0.20', 'confirm' => 'PAYER'], $pl, $pay, 2);
check('par paquets : 2 payés, il en reste 1', $r1['ok'] && $r1['paid'] === 2 && $r1['remaining'] === 1 && $r1['more'] === true, json_encode($r1));
$r2 = admin_all_pay_run(['amount' => '0.20', 'confirm' => 'PAYER'], $pl, $pay, 5);
check('suite : le dernier payé, plus rien', $r2['paid'] === 1 && $r2['remaining'] === 0 && !$r2['more']);
$r3 = admin_all_pay_run(['amount' => '0.20', 'confirm' => 'PAYER'], $pl, $pay, 5);
check('relancé (double clic / page rechargée) : personne payé deux fois', $r3['paid'] === 0 && count($got) === 3 && count(array_unique(array_column($got, 0))) === 3);
check('aperçu après : 3 déjà payés aujourd’hui', admin_all_pay_preview(['amount' => '0.20'], $pl)['already'] === 3);
$pl2 = array_merge($pl, [['id' => $U(7), 'email' => 'p7@gmail.com', 'name' => '', 'publicId' => '']]);
$r4 = admin_all_pay_run(['amount' => '0.20', 'confirm' => 'PAYER'], $pl2, static fn() => ['ok' => false, 'reason' => 'Solde base indisponible'], 5);
check('crédit refusé : arrêt, rien noté (pourra être retenté)', $r4['ok'] === false && $r4['paid'] === 0 && admin_all_pay_preview(['amount' => '0.20'], $pl2)['count'] === 1, json_encode($r4));

echo "\n" . ($fail === 0 ? "TOUT EST BON" : "PROBLÈME") . " : $pass OK, $fail échec(s)\n";
exit($fail === 0 ? 0 : 1);
