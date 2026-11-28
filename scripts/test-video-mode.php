<?php
declare(strict_types=1);
// Ligne de commande seulement. 2026-11-28 — mode vidéo Trench Defense : compte ADMIN seulement, mise ≤ 1 $, multiplicateur choisi ;
// les joueurs et les autres jeux ne sont jamais touchés. Fausse caisse, dossier temporaire.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$tmp = sys_get_temp_dir() . '/orolado_vid_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'casino_ext.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test'); putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = [];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') { if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient']; $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2); return ['ok' => true, 'real' => $bal[$u]]; }
  if ($fn === 'resolve_trade') { $k = $u . '|' . $a['p_order']; if (!isset($keys[$k])) { $keys[$k] = 1; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); } return ['ok' => true, 'real' => $bal[$u]]; }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
mkdir($tmp . '/casino_ext'); foreach (glob(__DIR__ . '/../casino_ext/*.php') ?: [] as $f) copy($f, $tmp . '/casino_ext/' . basename($f));
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function ck(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$adm = ['id' => 'aaaaaaaa-0000-4000-8000-000000000001', 'role' => 'admin', 'email' => 'admin@orolado.com'];
$usr = ['id' => 'bbbbbbbb-0000-4000-8000-000000000002', 'role' => 'user', 'email' => 'joueur@test.oro'];
foreach ([$adm, $usr] as $u) $bal[$u['id']] = 1000.0;
$db = blank_db(); $db['users'][$adm['id']] = $adm; $db['users'][$usr['id']] = $usr; save_db(orolado_data_file(), $db);
$c = static function (array $u, string $g): float { $st = casino_with(casino_user_file($u['id']), static fn(array &$s) => $s['g'][$g] ?? []); return (float) ($st['c'] ?? 0); };
$r = casino_skill_act($db, $adm, 'trenchdef', 'start', 'real', 0.10, ['video' => 30]);
ck('admin, Trench Defense, ?video=30 : la partie monte jusqu\'à ×30', !empty($r['ok']) && abs($c($adm, 'trenchdef') - 32.4) < 0.001, json_encode($r) . ' c=' . $c($adm, 'trenchdef'));
$N = 0; $hi = 0; for ($i = 0; $i < 40; $i++) { casino_with(casino_user_file($usr['id']), static function (array &$s) { unset($s['g']['trenchdef']); return true; }); casino_skill_act($db, $usr, 'trenchdef', 'start', 'real', 0.10, ['video' => 30]); $N++; if (abs($c($usr, 'trenchdef') - 32.4) < 0.001) $hi++; }
ck('joueur normal qui envoie ?video=30 : jamais', $hi === 0, "$hi sur $N");
casino_with(casino_user_file($adm['id']), static function (array &$s) { unset($s['g']['trenchdef']); return true; });
casino_skill_act($db, $adm, 'trenchdef', 'start', 'real', 2.0, ['video' => 30]);
ck('admin mais mise de 2 $ (> 1 $) : jamais', abs($c($adm, 'trenchdef') - 32.4) > 0.001);
casino_skill_act($db, $adm, 'commando', 'start', 'real', 0.10, ['video' => 30]);
ck('admin sur un autre jeu (Commando) : jamais', abs($c($adm, 'commando') - 32.4) > 0.001);
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
