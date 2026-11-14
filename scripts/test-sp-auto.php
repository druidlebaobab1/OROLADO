<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-13 — Règlement automatique des matchs entrés à la main (sports_lib.php, sp_auto_settle_maybe) :
 * annulé (mises rendues) 72 h après la fin sans résultat sûr, une seule fois ; au plus toutes les 20 min.
 * Fausse caisse, dossier temporaire : rien ne part en ligne. (SPORTS_LIB=/chemin/ancien/sports_lib.php pour tester une autre version.)
 */
$tmp = sys_get_temp_dir() . '/orolado_paris_safe_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
if (getenv('SPORTS_LIB')) copy((string) getenv('SPORTS_LIB'), $tmp . '/sports_lib.php');
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
foreach (['seed-2026-10.done', 'seed-2026-10b.done', 'seed-2026-10c.done', 'seed-2026-10d.done', 'seed-2026-10e.done', 'draw-2026-10.done', 'stale-2026-10.done', 'market-2026-10-21.done'] as $f) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $f, '1');
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $B];
save_db(orolado_data_file(), $db); $bal[$A] = 2000.0; $bal[$B] = 2000.0;
$ua = $db['users']['u_a']; $ub = $db['users']['u_b'];
$now = time(); $D = 86400;
$mk = static function (array $in) { $r = sp_admin_save($in); return (string) ($r['id'] ?? ''); };
$yn = static fn(float $y, float $n) => [['label' => 'Oui', 'odd' => $y], ['label' => 'Non', 'odd' => $n]];
$ev = static function (string $id): array { foreach (sp_events() as $e) if ($e['id'] === $id) return $e; return []; };
$fn = static fn(string $f): bool => function_exists($f);

echo "1) Règlement automatique : question finie depuis plus de 72 h sans résultat sûr → annulée, mise rendue une fois\n";
$q = $mk(['title' => 'Question test : il pleuvra à Paris le 01/11 ?', 'league' => 'Test', 'sport' => 'event', 'start' => $now + 3600, 'endAt' => $now + 7200, 'opts' => $yn(1.9, 1.9)]);
check('question créée', $q !== '');
$e = $ev($q); $k = $e['opts'][0]['k'];
$r = sp_bet(load_db(), $ua, 'real', 5.0, [['ev' => $q, 'k' => $k]], $now);
check('pari réel posé', !empty($r['ok']), json_encode($r));
check('solde après pari 1995', abs($bal[$A] - 1995.0) < 0.001, (string) $bal[$A]);
$r1 = sp_auto_settle_maybe($now + 7200 + 3600, true);
check('1 h après la fin : rien d\'annulé', ($r1['voided'] ?? -1) === 0 && $ev($q)['status'] !== 'settled', json_encode($r1));
$r2 = sp_auto_settle_maybe($now + 7200 + 73 * 3600, true);
check('73 h après la fin : annulée', ($r2['voided'] ?? 0) === 1 && $ev($q)['status'] === 'settled' && $ev($q)['result'] === 'void', json_encode($r2));
check('mise rendue (2000)', abs($bal[$A] - 2000.0) < 0.001, (string) $bal[$A]);
$r3 = sp_auto_settle_maybe($now + 7200 + 80 * 3600, true);
check('2e passage : rien de plus, pas rendu 2 fois', ($r3['voided'] ?? -1) === 0 && abs($bal[$A] - 2000.0) < 0.001, json_encode($r3) . ' ' . $bal[$A]);
$r4 = sp_auto_settle_maybe($now + 7200 + 80 * 3600 + 60);
check('sans forçage : arrêté (le propriétaire valide lui-même)', !empty($r4['off']), json_encode($r4));
echo "2) Nettoyage unique des anciens matchs (vrais résultats connus, sinon annulés ; à venir : intouchés)\n";
$cl = $mk(['title' => 'FC Barcelona - Real Madrid', 'league' => 'LaLiga', 'sport' => 'football', 'start' => $now + 600, 'endAt' => $now + 1200, 'opts' => [['label' => 'Barcelona', 'odd' => 1.58], ['label' => 'Nul', 'odd' => 5.32], ['label' => 'Real Madrid', 'odd' => 4.09]]]);
$ok1 = $ev($cl)['opts'][0]['k'];
$rb = sp_bet(load_db(), $ub, 'real', 3.0, [['ev' => $cl, 'k' => $ok1]], $now);
check('pari sur Barcelona posé', !empty($rb['ok']), json_encode($rb));
$old = $mk(['title' => 'Vieux match inconnu', 'league' => 'Test', 'sport' => 'football', 'start' => $now + 600, 'endAt' => $now + 1200, 'opts' => [['label' => 'A', 'odd' => 2.0], ['label' => 'B', 'odd' => 2.0]]]);
$rb2 = sp_bet(load_db(), $ub, 'real', 2.0, [['ev' => $old, 'k' => $ev($old)['opts'][0]['k']]], $now);
$fut = $mk(['title' => 'Prédiction à venir', 'league' => 'Test', 'sport' => 'event', 'start' => $now + 5 * $D, 'endAt' => $now + 6 * $D, 'opts' => $yn(1.9, 1.9)]);
$b0 = $bal[$B];
$c1 = sp_old_cleanup_once($now + 3 * $D);
check('Clásico réglé : Real Madrid', $ev($cl)['status'] === 'settled' && $ev($cl)['result'] === $ev($cl)['opts'][2]['k'], json_encode($c1));
check('vieux match inconnu annulé', $ev($old)['result'] === 'void');
check('pari Barcelona perdu, mise du vieux match rendue (+2)', abs($bal[$B] - ($b0 + 2.0)) < 0.001, $b0 . ' → ' . $bal[$B]);
check('prédiction à venir intouchée', $ev($fut)['status'] === 'open');
$c2 = sp_old_cleanup_once($now + 4 * $D);
check('2e passage : rien (une seule fois)', !empty($c2['skip']));
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
