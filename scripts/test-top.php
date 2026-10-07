<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Classement DÉMO de la semaine (top_lib.php) : semaine lundi → dimanche, 20 trades minimum,
 * points = 1000 × gain net ÷ total misé, chaque trade compté une seule fois, archives relues,
 * admin et comptes bloqués exclus. Dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_top_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'top_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['OROLADO_FAKE_HTTP'] = fn() => [];
require $tmp . '/orolado_lib.php';
require $tmp . '/top_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$n = 0;
function ord_(string $uid, bool $won, float $stake, float $t, string $mode = 'demo', float $payout = 1.9): array {
  global $n; $n++;
  return ['id' => 'o' . $n, 'userId' => $uid, 'mode' => $mode, 'stake' => $stake, 'status' => $won ? 'won' : 'lost',
    'net' => $won ? round($stake * ($payout - 1), 2) : -$stake, 'openedAt' => $t, 'at' => $t, 'settledAt' => $t + 10];
}

echo "1) Dates de la semaine\n";
$wed = (int) strtotime('2026-10-07 15:00:00');
$wk = orolado_top_week($wed);
check('mercredi 7 oct. → semaine du lundi 5 oct. 00:00', date('Y-m-d H:i:s', $wk['start']) === '2026-10-05 00:00:00', date('Y-m-d H:i:s', $wk['start']));
check('fin : dimanche 11 oct. 23:59:59', date('Y-m-d H:i:s', $wk['end']) === '2026-10-11 23:59:59', date('Y-m-d H:i:s', $wk['end']));
$mon = orolado_top_week((int) strtotime('2026-10-05 00:00:00'));
check('lundi 00:00 pile → nouvelle semaine', $mon['start'] === (int) strtotime('2026-10-05 00:00:00'));
$sun = orolado_top_week((int) strtotime('2026-10-11 23:59:59'));
check('dimanche 23:59:59 → encore la même semaine', $sun['key'] === $wk['key']);

echo "2) Classement\n";
$now = time();
$w = orolado_top_week($now);
$t = $w['start'] + 3600;
$db = blank_db();
foreach (['u_a' => 'Awa Koné', 'u_b' => 'Bruno', 'u_c' => 'Chloé Martin', 'u_peu' => 'Petit', 'u_ban' => 'Banni'] as $id => $nm) $db['users'][$id] = ['id' => $id, 'email' => $id . '@gmail.com', 'role' => 'user', 'displayName' => $nm, 'publicId' => 'ORO-' . substr(md5($id), 0, 6), 'country' => 'CI'];
$db['users']['u_ban']['role'] = 'suspended';
$db['users']['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin', 'displayName' => 'Admin'];
$o = [];
// A : 20 trades de 10 $, 14 gagnés → net = 14×9 − 6×10 = 66 ; misé 200 → 330 points.
for ($i = 0; $i < 20; $i++) $o[] = ord_('u_a', $i < 14, 10, $t + $i);
// B : 25 trades de 10 $, 15 gagnés → net = 135 − 100 = 35 ; misé 250 → 140 points.
for ($i = 0; $i < 25; $i++) $o[] = ord_('u_b', $i < 15, 10, $t + $i);
// C : 20 trades, 10 gagnés → net = 90 − 100 = −10 → −50 points.
for ($i = 0; $i < 20; $i++) $o[] = ord_('u_c', $i < 10, 10, $t + $i);
// Peu : 19 trades tous gagnés → pas assez de trades.
for ($i = 0; $i < 19; $i++) $o[] = ord_('u_peu', true, 10, $t + $i);
// Banni et admin : très bons, mais exclus.
for ($i = 0; $i < 30; $i++) { $o[] = ord_('u_ban', true, 10, $t + $i); $o[] = ord_('admin_master', true, 10, $t + $i); }
// Trades réels, semaine dernière, ouverts : ignorés.
for ($i = 0; $i < 30; $i++) { $o[] = ord_('u_c', true, 10, $t + $i, 'real'); $o[] = ord_('u_c', true, 10, $w['start'] - 3600); }
$o[] = ['id' => 'open1', 'userId' => 'u_c', 'mode' => 'demo', 'stake' => 10, 'status' => 'open', 'openedAt' => $t];
$db['orders'] = $o;
save_db(orolado_data_file(), $db);
putenv('OROLADO_TOP_PUBLIC=1');
$r = orolado_top_status(load_db(), $db['users']['u_b']);
$names = array_map(fn($x) => $x['name'] . ':' . $x['points'], $r['top']);
check('ordre : Awa (330) > Bruno (140) > Chloé (−50)', $names === ['Awa K.:330', 'Bruno:140', 'Chloé M.:-50'], implode(' | ', $names));
check('moins de 20 trades : absent', !in_array('Petit', array_column($r['top'], 'name'), true));
check('admin et compte suspendu : absents', count($r['top']) === 3);
check('Bruno voit sa place : 2e', $r['me']['rank'] === 2 && !empty($r['top'][1]['me']));
check('réel / semaine dernière / ordre ouvert : ignorés (Chloé = 20 trades)', $r['top'][2]['trades'] === 20);
check('aucun e-mail montré à un joueur', !isset($r['top'][0]['email']));
$rp = orolado_top_status(load_db(), $db['users']['u_peu']);
check('Petit : encore 1 trade pour entrer', $rp['me']['need'] === 1 && $rp['me']['rank'] === 0);
$ra = orolado_top_status(load_db(), $db['users']['admin_master']);
check('admin : voit numéro ORO et e-mail (pour récompenser)', ($ra['top'][0]['email'] ?? '') === 'u_a@gmail.com' && str_starts_with((string) ($ra['top'][0]['publicId'] ?? ''), 'ORO-'));
check('fin de semaine annoncée = dimanche 23:59:59', $r['endsAt'] === $w['end']);

echo "3) Chaque trade compté une seule fois, même après l'archivage\n";
$file = orolado_top_file($w['key']);
$st = json_decode((string) file_get_contents($file), true);
$st['scanAt'] = 0;
file_put_contents($file, json_encode($st));
orolado_top_status(load_db(), $db['users']['u_b']);
$r = orolado_top_status(load_db(), $db['users']['u_b']);
check('relu 2 fois : Awa toujours 20 trades', $r['top'][0]['trades'] === 20);
// Les trades d'Awa partent dans l'archive (comme après 2 jours) et 5 nouveaux arrivent.
$d = load_db();
$arch = array_filter($d['orders'], fn($x) => $x['userId'] === 'u_a');
file_put_contents($tmp . '/data/archive/orders-' . date('Y-m', $t) . '.jsonl', implode("\n", array_map('json_encode', $arch)) . "\n");
$d['orders'] = array_values(array_filter($d['orders'], fn($x) => $x['userId'] !== 'u_a'));
for ($i = 0; $i < 5; $i++) $d['orders'][] = ord_('u_a', false, 10, $t + 100 + $i);
save_db(orolado_data_file(), $d);
$st = json_decode((string) file_get_contents($file), true);
$st['scanAt'] = 0;
file_put_contents($file, json_encode($st));
$r = orolado_top_status(load_db(), $db['users']['u_b']);
$awa = array_values(array_filter($r['top'], fn($x) => $x['name'] === 'Awa K.'))[0] ?? [];
check('archivés gardés + 5 nouveaux = 25 trades', ($awa['trades'] ?? 0) === 25, (string) ($awa['trades'] ?? ''));
// Compteur perdu (nouveau fichier) : tout est relu depuis les archives.
@unlink($file);
$r = orolado_top_status(load_db(), $db['users']['u_b']);
$awa = array_values(array_filter($r['top'], fn($x) => $x['name'] === 'Awa K.'))[0] ?? [];
check('compteur effacé : retrouvé grâce aux archives (25 trades)', ($awa['trades'] ?? 0) === 25, (string) ($awa['trades'] ?? ''));

echo "4) Fermé aux joueurs tant que ce n'est pas ouvert à tous\n";
putenv('OROLADO_TOP_PUBLIC=0');
check('joueur normal : pas de classement', empty(orolado_top_status(load_db(), $db['users']['u_b'])['enabled']));
check('admin : classement visible', !empty(orolado_top_status(load_db(), $db['users']['admin_master'])['enabled']));

echo "\n" . ($fail === 0 ? "TOUT EST BON" : "PROBLÈME") . " : $pass OK, $fail échec(s)\n";
exit($fail === 0 ? 0 : 1);
