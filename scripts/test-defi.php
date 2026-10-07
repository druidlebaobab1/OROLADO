<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Défi OROLADO (defi_lib.php) : série de 5 victoires, récompense 5 × plus petite mise, une seule fois,
 * un défi par jour (même marché pour tous, jusqu'à minuit), réservé à l'admin tant que ce n'est pas ouvert à tous.
 * Faux Supabase, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_defi_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'defi_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$credits = [];
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use (&$credits) {
  if (str_contains($url, '/rpc/resolve_trade')) {
    $b = json_decode((string) $body, true) ?: [];
    $k = $b['p_user'] . '|' . $b['p_order'];
    if (!isset($credits[$k])) $credits[$k] = (float) $b['p_amount'];
    return ['ok' => true, 'real' => array_sum($credits)];
  }
  return [];
};
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/defi_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$uuid = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin'];
$db['users']['u_joueur'] = ['id' => 'u_joueur', 'email' => 'joueur@gmail.com', 'role' => 'user', 'sbId' => $uuid];
$db['vault']['admin_master'] = ['demo' => 1000, 'real' => 0];
$db['vault']['u_joueur'] = ['demo' => 1000000, 'real' => 100];
save_db(orolado_data_file(), $db);
$tick = 1000;
function trade(array &$db, string $uid, string $market, string $mode, float $stake, bool $won): void {
  global $tick; $tick += 40;
  $db['orders'][] = ['id' => 'o' . $tick, 'userId' => $uid, 'assetId' => $market, 'mode' => $mode, 'accountType' => $mode, 'stake' => $stake,
    'status' => $won ? 'won' : 'lost', 'openedAt' => microtime(true), 'at' => microtime(true), 'entryTick' => $tick, 'expiryTick' => $tick + 40, 'settledAt' => microtime(true)];
}
$admin = $db['users']['admin_master'];
$joueur = $db['users']['u_joueur'];

echo "1) Fermé aux joueurs tant que ce n'est pas ouvert à tous\n";
$r = orolado_defi_status($db, $joueur, true);
check('joueur normal : pas de défi', empty($r['enabled']));

echo "2) Admin : activation, marché du jour (au hasard pour chacun), fin à minuit\n";
$r = orolado_defi_status($db, $admin, true);
$m = (string) $r['market'];
check('activé, mode démo (aucun argent réel)', !empty($r['active']) && $r['mode'] === 'demo', $m);
check("défi valable jusqu'à minuit (aujourd'hui)", $r['expiresAt'] === (int) strtotime(date('Y-m-d') . ' 23:59:59'));
$vus = []; foreach (range(1, 40) as $k) $vus[orolado_defi_pick_market('u_' . $k, time())] = 1;
check('marché au hasard pour chaque joueur (40 joueurs → plusieurs marchés)', count($vus) >= 5, count($vus) . ' marchés');
check('même joueur, même jour : même marché', $m === orolado_defi_pick_market('admin_master', time()));
$diff = true; foreach (range(1, 40) as $k) { $t = time() + $k * 86400; if (orolado_defi_pick_market('u_x', $t) === orolado_defi_pick_market('u_x', $t - 86400)) $diff = false; }
check('pas le même marché que la veille (40 jours de suite)', $diff);
$other = $m === 'v100' ? 'v75' : 'v100';

echo "3) Série : victoires, défaite qui remet à 0, autres marchés et petites mises ignorés\n";
trade($db, 'admin_master', $m, 'demo', 10, true);
trade($db, 'admin_master', $m, 'demo', 10, true);
trade($db, 'admin_master', $other, 'demo', 10, false);
trade($db, 'admin_master', $m, 'demo', 0.5, false);
$r = orolado_defi_status($db, $admin);
check('2 victoires (autre marché et petite mise ignorés)', $r['streak'] === 2, (string) $r['streak']);
trade($db, 'admin_master', $m, 'demo', 10, false);
$r = orolado_defi_status($db, $admin);
check('défaite sur le marché : série à 0', $r['streak'] === 0);
trade($db, 'admin_master', $m, 'real', 50, true);
$r = orolado_defi_status($db, $admin);
check('trade du mauvais compte (réel) ignoré pour le testeur', $r['streak'] === 0);

echo "4) 5 victoires d'affilée : récompense = 5 × la plus petite mise, versée une seule fois\n";
foreach ([2, 5, 3, 10, 4] as $s) trade($db, 'admin_master', $m, 'demo', $s, true);
$demoBefore = (float) load_db()['vault']['admin_master']['demo'];
$r = orolado_defi_status($db, $admin);
$demoAfter = (float) load_db()['vault']['admin_master']['demo'];
check('défi réussi', !empty($r['won']) && !empty($r['paid']));
check('récompense 5 × 2 $ = 10 $', abs($r['reward'] - 10) < 0.001, (string) $r['reward']);
check('versée sur la démo du testeur (+10)', abs(($demoAfter - $demoBefore) - 10) < 0.001, $demoBefore . ' → ' . $demoAfter);
orolado_defi_status($db, $admin); orolado_defi_status($db, $admin);
check('3 lectures de plus : toujours une seule récompense', abs((float) load_db()['vault']['admin_master']['demo'] - $demoAfter) < 0.001);
$r = orolado_defi_status($db, $admin, true);
check('pas de nouveau défi avant demain', empty($r['active']) && empty($r['canActivate']) && !empty($r['won']));

echo "5) Ouvert à tous : joueur en réel, bonus versé une fois sur le vrai solde\n";
putenv('OROLADO_DEFI_PUBLIC=1');
$r = orolado_defi_status($db, $joueur, true);
$jm = (string) $r['market'];
check('joueur : défi actif en compte réel', !empty($r['active']) && $r['mode'] === 'real');
foreach ([10, 10, 10, 10] as $s) trade($db, 'u_joueur', $jm, 'real', $s, true);
$r = orolado_defi_status($db, $joueur);
check('4 victoires : pas encore réussi', $r['streak'] === 4 && empty($r['won']));
trade($db, 'u_joueur', $jm, 'real', 10, true);
$r = orolado_defi_status($db, $joueur);
check('5e victoire : 50 $ (5 × 10 $)', !empty($r['paid']) && abs($r['reward'] - 50) < 0.001, (string) $r['reward']);
check('crédit réel envoyé une seule fois sur le coffre du joueur', count(array_filter(array_keys($credits), fn($k) => str_starts_with($k, $uuid . '|adm_defi_'))) === 1 && abs(array_sum($credits) - 50) < 0.001);
$d = load_db();
$dep = array_values(array_filter((array) $d['deposits'], fn($x) => str_starts_with((string) ($x['id'] ?? ''), 'adm_defi_')));
check('enregistré comme bonus (opérateur admin) avec la règle « miser ×2 »', count($dep) === 1 && ($dep[0]['operator'] ?? '') === 'admin' && (float) ($d['users']['u_joueur']['wagerNeed'] ?? 0) >= 100);
orolado_defi_status($db, $joueur); orolado_defi_status($db, $joueur);
check('pas de double paiement', abs(array_sum($credits) - 50) < 0.001);

echo "6) Tricheur : 4 toutes petites mises (1 $) puis une grosse\n";
$db['users']['u_malin'] = ['id' => 'u_malin', 'email' => 'malin@gmail.com', 'role' => 'user', 'sbId' => 'bbbbbbbb-1111-2222-3333-444444444444'];
$malin = $db['users']['u_malin'];
$r = orolado_defi_status($db, $malin, true);
foreach ([1, 1, 1, 1, 500] as $s) trade($db, 'u_malin', (string) $r['market'], 'real', $s, true);
$r = orolado_defi_status($db, $malin);
check('récompense = 5 × 1 $ = 5 $ (pas 504 $)', abs($r['reward'] - 5) < 0.001, (string) $r['reward']);

echo "7) Ancien défi de 7 jours (avant v2411) : ramené à minuit de son jour\n";
$db['users']['u_vieux'] = ['id' => 'u_vieux', 'email' => 'vieux@gmail.com', 'role' => 'user', 'sbId' => 'dddddddd-1111-2222-3333-444444444444'];
$hier = time() - 86400;
orolado_defi_with('u_vieux', function (&$st) use ($hier) { $st = ['id' => 'x', 'market' => 'v100', 'activatedAt' => $hier, 'expiresAt' => $hier + 7 * 86400, 'streak' => 0, 'history' => []]; });
$r = orolado_defi_status($db, $db['users']['u_vieux']);
check('ancien défi d\'hier : terminé (plus de chrono de 6 jours)', empty($r['active']) && !empty($r['canActivate']));
$r = orolado_defi_status($db, $db['users']['u_vieux'], true);
check('nouveau défi du jour, fin à minuit', !empty($r['active']) && $r['expiresAt'] === (int) strtotime(date('Y-m-d') . ' 23:59:59'));

echo "\n" . ($fail === 0 ? "TOUT EST BON" : "PROBLÈME") . " : $pass OK, $fail échec(s)\n";
exit($fail === 0 ? 0 : 1);
