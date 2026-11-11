<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-11 — AFFILIATION À GRANDE ÉCHELLE (propriétaire : « 10 000, 1 million d'inscrits par un lien : ça doit
 * toujours s'afficher, solide des années »). Prouve : inscription en temps constant, aucun ami perdu ni compté 2 fois,
 * codes en majuscules/minuscules/tirets, anciens affiliés convertis sans perte, clics, dépôts reconnus, page rapide.
 */
$tmp = sys_get_temp_dir() . '/orolado_affs_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'aff_rev_lib.php', 'casino_lib.php', 'admin_gift_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OROLADO_AFF_PUBLIC=1');
$GLOBALS['OROLADO_FAKE_HTTP'] = fn() => ['ok' => true, 'real' => 0];
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_rev_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
function wipe(): void { exec('rm -rf ' . escapeshellarg(orolado_data_dir() . '/aff')); }

$N = 2000;
$db = blank_db();
$db['users']['aff'] = ['id' => 'aff', 'email' => 'aff@x.com', 'role' => 'user', 'displayName' => 'Affilié'];
$db['users']['aff2'] = ['id' => 'aff2', 'email' => 'aff2@x.com', 'role' => 'user'];
for ($i = 0; $i < $N + 20; $i++) $db['users']["f$i"] = ['id' => "f$i", 'email' => "f$i@x.com", 'role' => 'user', 'displayName' => "f$i", 'publicId' => 'ORO-' . substr(md5("f$i"), 0, 6)];
save_db(orolado_data_file(), $db);
$db = load_db();

echo "1) Codes : majuscules, minuscules, tirets, espaces, code promo perso, code supprimé\n";
$code = (string) orolado_aff_status($db, $db['users']['aff'])['code'];
check('code par défaut : 8 caractères', strlen($code) === 8, $code);
check('lien en minuscules → relié', orolado_aff_attach($db, 'f0', strtolower($code)));
check('code tapé avec tirets / espaces (« ' . substr($code, 0, 4) . '-' . substr($code, 4) . ' ») → relié', orolado_aff_attach($db, 'f1', ' ' . substr($code, 0, 4) . '-' . substr($code, 4) . ' '));
check('code promo perso « Diable2026 » créé', !empty(orolado_aff_code_create($db, 'aff', 'Diable2026')['ok']));
check('« diable2026 » (minuscules) → relié', orolado_aff_attach($db, 'f2', 'diable2026'));
check('même ami une 2e fois → refusé (relié une seule fois, à vie)', !orolado_aff_attach($db, 'f2', $code));
orolado_aff_status($db, $db['users']['aff2']);
check('ami déjà relié, autre code → reste chez le 1er parrain', !orolado_aff_attach($db, 'f0', orolado_aff_code('aff2')) && (orolado_aff_read(orolado_aff_inv_name('f0'))['inviter'] ?? '') === 'aff');
check('soi-même → refusé', !orolado_aff_attach($db, 'aff', $code));
check('code inconnu → rien (le compte se crée quand même ailleurs)', !orolado_aff_attach($db, 'f3', 'ZZZZZZZZ'));
orolado_aff_code_delete('aff', 'DIABLE2026');
check('code supprimé → refusé', !orolado_aff_attach($db, 'f3', 'DIABLE2026'));

echo "2) $N inscriptions sur le MÊME lien : temps constant, aucun perdu, aucun doublon\n";
$t0 = microtime(true); $tLast = 0.0;
for ($i = 3; $i < $N; $i++) { $t = microtime(true); orolado_aff_attach($db, "f$i", $code); if ($i >= $N - 100) $tLast += microtime(true) - $t; }
$fr = orolado_aff_friends('aff');
check("$N amis exactement", count($fr) === $N, (string) count($fr));
check('aucun doublon', count(array_unique(array_column($fr, 'uid'))) === $N);
check('100 dernières inscriptions : moins de 5 ms chacune (temps constant)', $tLast / 100 < 0.005, sprintf('%.2f ms', $tLast * 10));
check('compteur du parrain = ' . $N, orolado_aff_counts('aff')['n'] === $N, (string) orolado_aff_counts('aff')['n']);
$t = microtime(true);
$st = orolado_aff_status(load_db(), $db['users']['aff']);
$tS = microtime(true) - $t;
check("page de l'affilié : $N amis affichés", ($st['friends'] ?? 0) === $N && ($st['periods']['day']['signed'] ?? 0) === $N, json_encode(['f' => $st['friends'] ?? null, 'd' => $st['periods']['day']['signed'] ?? null]));
check('liste : les plus récents d\'abord', ($st['list'][0]['at'] ?? 0) >= ($st['list'][count($st['list']) - 1]['at'] ?? 0));
check('page ouverte en moins de 3 s (1re fois)', $tS < 3, sprintf('%.2f s', $tS));

echo "3) Dépôts des amis : reconnus et affichés (sans que le parrain ouvre sa page)\n";
for ($i = 0; $i < 40; $i++) {
  $db = load_db();
  $id = "dep$i";
  $db['deposits'][] = ['id' => $id, 'ref' => $id, 'userId' => "f$i", 'amount' => 25, 'status' => 'COMPLETED', 'operator' => 'oxapay', 'paidAt' => date('c', time() - 3 * 86400)];
  save_db(orolado_data_file(), $db);
  orolado_aff_settle(load_db(), "f$i"); // = ce que fait le crochet après chaque dépôt crédité
}
check('compteur « ont déposé » = 40', orolado_aff_counts('aff')['paid'] === 40, (string) orolado_aff_counts('aff')['paid']);
$st = orolado_aff_status(load_db(), $db['users']['aff']);
check('page : 40 ont déposé, total 1 000 $', ($st['deposited'] ?? 0) === 40 && abs(($st['total'] ?? 0) - 1000) < 0.01, json_encode([$st['deposited'] ?? null, $st['total'] ?? null]));
$db = load_db(); $db['deposits'][] = ['id' => 'dep0b', 'ref' => 'dep0b', 'userId' => 'f0', 'amount' => 75, 'status' => 'COMPLETED', 'operator' => 'oxapay', 'paidAt' => date('c', time() - 3 * 86400)]; save_db(orolado_data_file(), $db);
orolado_aff_settle(load_db(), 'f0');
check('2e dépôt du même ami : compteur inchangé (40), total 1 075 $', orolado_aff_counts('aff')['paid'] === 40 && abs((float) orolado_aff_status(load_db(), $db['users']['aff'])['total'] - 1075) < 0.01);

echo "4) Part de revenu (60 %) : un ami perd → l'affilié le voit (gros affilié : au plus quelques minutes après)\n";
$later = function () { orolado_aff_with('agg_' . hash('sha256', 'aff-agg|aff'), static function (&$st) { $st['at'] = time() - 4000; }); }; // « plus tard » (dernier calcul ancien)
$db = load_db();
$db['orders'][] = ['id' => 'oL1', 'userId' => 'f5', 'mode' => 'real', 'status' => 'lost', 'stake' => 20, 'payout' => 1.9, 'settledAt' => date('c', time() - 2 * 86400)];
save_db(orolado_data_file(), $db);
$later();
$st = orolado_aff_status(load_db(), $db['users']['aff']);
check('NGR 20 $ → dû 12 $ (60 %)', abs(($st['rev']['ngr'] ?? 0) - 20) < 0.01, json_encode($st['rev'] ?? []));
$db = load_db();
$db['orders'][] = ['id' => 'oL2', 'userId' => 'f6', 'mode' => 'real', 'status' => 'lost', 'stake' => 5, 'payout' => 1.9, 'settledAt' => date('c', time() - 2 * 86400)];
save_db(orolado_data_file(), $db);
$later();
$st = orolado_aff_status(load_db(), $db['users']['aff']);
check('nouvelle perte de 5 $ → NGR 25 $ (pas de vieux chiffre en mémoire)', abs(($st['rev']['ngr'] ?? 0) - 25) < 0.01, (string) ($st['rev']['ngr'] ?? ''));

echo "5) Clics : un téléphone = 1 clic par jour, même s'il clique 15 fois\n";
for ($k = 0; $k < 15; $k++) orolado_aff_click($code, 'telephoneA');
$_SERVER['REMOTE_ADDR'] = '10.0.0.2';
orolado_aff_click(strtolower($code), 'telephoneB');
check('2 téléphones → 2 clics', orolado_aff_counts('aff')['clicks'] === 2, (string) orolado_aff_counts('aff')['clicks']);

echo "6) Ancien affilié (liste dans l'ancien format) : converti sans rien perdre\n";
wipe();
$db = load_db();
orolado_aff_with(orolado_aff_owner_name('aff'), static function (&$st) {
  $st = ['clicks' => 9, 'earned' => 3.5, 'log' => [['ref' => 'old1', 'amount' => 3.5, 'at' => date('c', time() - 86400)]], 'friends' => [
    ['uid' => 'f10', 'at' => date('c', time() - 5000), 'ip' => '1.1.1.1', 'deposit' => 70, 'gift' => 3.5, 'paid' => true, 'n' => 1],
    ['uid' => 'f11', 'at' => date('c', time() - 4000), 'ip' => '1.1.1.2', 'deposit' => 0, 'gift' => 0, 'paid' => false]]];
});
orolado_aff_with(orolado_aff_inv_name('f10'), static function (&$st) { $st = ['inviter' => 'aff', 'code' => 'X', 'at' => date('c'), 'friendPaid' => true, 'depositTotal' => 70, 'deps' => ['d' => ['amount' => 70, 'paid' => true]]]; });
orolado_aff_with(orolado_aff_inv_name('f11'), static function (&$st) { $st = ['inviter' => 'aff', 'code' => 'X', 'at' => date('c')]; });
$fr = orolado_aff_friends('aff'); $fr2 = orolado_aff_friends('aff');
check('2 amis retrouvés (et pas 4 en relisant)', count($fr) === 2 && count($fr2) === 2);
check('chiffres gardés : 70 $ déposé, ancien gain 3,50 $', abs($fr[0]['deposit'] - 70) < 0.01 && abs($fr[0]['gift'] - 3.5) < 0.01 && !empty($fr[0]['paid']));
$own = orolado_aff_read(orolado_aff_owner_name('aff'));
check('clics, gains anciens et journal gardés ; compteurs posés', ($own['clicks'] ?? 0) === 9 && abs((float) ($own['earned'] ?? 0) - 3.5) < 0.01 && count($own['log'] ?? []) === 1 && ($own['n'] ?? 0) === 2 && ($own['nPaid'] ?? 0) === 1 && !isset($own['friends']));
orolado_aff_register_code('aff');
check('nouvel ami après conversion → 3 amis', orolado_aff_attach(load_db(), 'f12', $code) && count(orolado_aff_friends('aff')) === 3 && orolado_aff_counts('aff')['n'] === 3);
check('l\'admin voit l\'affilié et ses filleuls', in_array('aff', orolado_aff_index_ids(), true) && (orolado_aff_referred_map()['f12'] ?? '') === 'aff' && (orolado_aff_referred_map()['f10'] ?? '') === 'aff');

echo "7) Très gros affilié (> " . OROLADO_AFF_BIG . " amis) : page servie tout de suite depuis le dernier calcul\n";
wipe();
orolado_aff_register_code('aff');
for ($i = 0; $i < OROLADO_AFF_BIG + 50; $i++) orolado_aff_attach($db, "f$i", $code);
$t = microtime(true); $s1 = orolado_aff_status(load_db(), $db['users']['aff']); $t1 = microtime(true) - $t;
$t = microtime(true); $s2 = orolado_aff_status(load_db(), $db['users']['aff']); $t2 = microtime(true) - $t;
check('mêmes chiffres les 2 fois', ($s1['friends'] ?? 0) === ($s2['friends'] ?? -1) && ($s1['rev']['ngr'] ?? -1) == ($s2['rev']['ngr'] ?? -2));
check('2e ouverture rapide (< 1 s)', $t2 < 1.0, sprintf('1re %.2f s, 2e %.2f s', $t1, $t2));

echo "\nRésultat : $pass OK, $fail échec(s)\n";
exec('rm -rf ' . escapeshellarg($tmp));
exit($fail ? 1 : 0);
