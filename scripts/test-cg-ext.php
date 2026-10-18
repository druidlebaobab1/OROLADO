<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2690 — Casino (casino_lib.php) : chaque jeu rend MOINS que la mise sur la durée (maison gagnante), les dessins
 * correspondent toujours au gain, l'argent bouge une seule fois, on ne peut pas tricher (rejouer, voir la mine,
 * encaisser après l'explosion, partie gratuite). Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_ext_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'casino_ext.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = []; $down = false;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$down) {
  if ($down) return null;
  $u = $a['p_user'];
  if ($fn === 'debit_real') {
    if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient'];
    $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bal[$u]];
  }
  if ($fn === 'resolve_trade') {
    $k = $u . '|' . $a['p_order'];
    if (!isset($keys[$k])) { $keys[$k] = 1; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); }
    return ['ok' => true, 'real' => $bal[$u]];
  }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
mkdir($tmp . '/casino_ext');
// fiches d'essai : une bonne de chaque sorte + une trop généreuse (doit être ignorée) + une clé déjà prise (ignorée)
file_put_contents($tmp . '/casino_ext/t.php', '<?php return ' . var_export([
  'tgood' => ['type' => 'table', 'name' => 'Table OK', 'out' => [[0, 50], [1.5, 30], [2.2, 10]]],
  'tbad' => ['type' => 'table', 'out' => [[0, 10], [2, 90]]],
  'coin' => ['type' => 'table', 'out' => [[0, 1], [0.5, 1]]],
  'pgood' => ['type' => 'pick', 'name' => 'Gobelets', 'opts' => [1 / 3, 1 / 3, 1 / 3]],
  'pbad' => ['type' => 'pick', 'opts' => [0.5, 0.4]],
  'srun' => ['type' => 'skill', 'name' => 'Space Runner', 'rate' => 0.12],
], true) . ';');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

echo "1) Fiches : seules les fiches sûres existent (retour ≤ 94,5 %, clé libre)\n";
$k = casino_ext_keys(); sort($k);
check('jeux chargés : pgood, srun, tgood', $k === ['pgood', 'srun', 'tgood'], json_encode($k));
check('fiche trop généreuse ignorée (180 %)', casino_ext_type('tbad') === '');
check('clé d\'un ancien jeu refusée (coin reste l\'ancien)', casino_ext_type('coin') === '');
check('pick dont les chances ne font pas 1 ignoré', casino_ext_type('pbad') === '');

echo "2) Retour aux joueurs (simulé) ≤ 94 %\n";
$N = 200000; $s = 0.0; for ($i = 0; $i < $N; $i++) $s += casino_ext_instant('tgood', [])['mult'];
check(sprintf('table : retour %.2f %% (attendu 74,4 %%)', $s / $N * 100), abs($s / $N - 0.7444) < 0.01);
$s = 0.0; for ($i = 0; $i < $N; $i++) $s += casino_ext_instant('pgood', ['pick' => $i % 3])['mult'];
check(sprintf('gobelets 1 sur 3 : retour %.2f %% (×%.2f)', $s / $N * 100, casino_ext_pick_mult(1 / 3)), $s / $N < 0.955 && $s / $N > 0.92); // simulation : ±1 % de hasard (le calcul exact, lui, est vérifié au chargement)
check('pick sans choix refusé', isset(casino_ext_instant('pgood', [])['err']) && isset(casino_ext_instant('pgood', ['pick' => 3])['err']));

echo "3) Argent : instantané (table / pick) — mise retirée une fois, gain versé une fois\n";
$U = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_x'] = ['id' => 'u_x', 'email' => 'x@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_x'] = ['demo' => 500, 'real' => 20];
save_db(orolado_data_file(), $db); $bal[$U] = 20.0; $me = $db['users']['u_x'];
$r = casino_play(load_db(), $me, 'pgood', 'real', 1, ['pick' => 1]);
check('gobelets : partie jouée', $r['ok'] === true && in_array($r['view']['w'], [0, 1, 2], true), json_encode($r));
check('gobelets : solde = 20 − 1 + gain', abs($bal[$U] - (19 + $r['win'])) < 0.001, json_encode([$bal[$U], $r['win']]));
check('jeu inconnu refusé', casino_play(load_db(), $me, 'tbad', 'real', 1, [])['ok'] === false);

echo "4) Mode mixte « où tu contrôles » : rien à gagner en trichant\n";
$b0 = $bal[$U];
$r = casino_multi(load_db(), $me, 'srun', 'start', 'real', 2, []);
check('départ : 2 $ retirés, moment secret caché', $r['ok'] && abs($bal[$U] - ($b0 - 2)) < 0.001 && !isset($r['c']), json_encode($r));
// le moment secret est tiré au hasard (6 % des parties s'arrêtent dès ×1,00, comme l'avion) : on le fixe pour la suite du test
casino_with(casino_user_file('u_x'), static function (array &$st) { $st['g']['srun']['c'] = 5.0; return true; });
$r2 = casino_multi(load_db(), $me, 'srun', 'start', 'real', 2, []);
check('2e départ pendant la partie : la même partie reprend, rien retiré', !empty($r2['resume']) && abs($bal[$U] - ($b0 - 2)) < 0.001);
// on recule l'horloge de départ de 6 s (×e^(0,12·6) = ×2,05) et on fixe le moment secret à ×5
$file = casino_user_file('u_x');
casino_with($file, static function (array &$st) { $st['g']['srun']['t0'] -= 6.0; $st['g']['srun']['c'] = 5.0; return true; });
$r = casino_multi(load_db(), $me, 'srun', 'cash', 'real', 0, ['m' => 999]);
check('encaissement : payé au multiplicateur du SERVEUR (×2,05), pas celui demandé', $r['done'] && abs($r['out'] - 2.05) < 0.02 && abs($bal[$U] - ($b0 - 2 + 2 * $r['out'])) < 0.02, json_encode([$r['out'] ?? null, $bal[$U]]));
$b1 = $bal[$U];
check('2e encaissement : rien de plus', casino_multi(load_db(), $me, 'srun', 'cash', 'real', 0, [])['ok'] && abs($bal[$U] - $b1) < 0.001);
// partie 2 : le moment secret (×1,5) est passé → encaisser ne paie rien
casino_multi(load_db(), $me, 'srun', 'start', 'real', 1, []);
casino_with($file, static function (array &$st) { $st['g']['srun']['t0'] -= 6.0; $st['g']['srun']['c'] = 1.5; return true; });
$b2 = $bal[$U];
$r = casino_multi(load_db(), $me, 'srun', 'cash', 'real', 0, []);
check('encaisser APRÈS le moment secret : perdu', $r['done'] && (float) $r['win'] === 0.0 && abs($bal[$U] - $b2) < 0.001 && (float) $r['c'] === 1.5, json_encode($r));
// partie 3 : faute du joueur
casino_multi(load_db(), $me, 'srun', 'start', 'real', 1, []);
casino_with($file, static function (array &$st) { $st['g']['srun']['c'] = 5.0; return true; }); // pas de fin à ×1,00 pour ce test
$b3 = $bal[$U];
$r = casino_multi(load_db(), $me, 'srun', 'fail', 'real', 0, []);
check('faute du joueur (obstacle) : perdu, moment secret révélé', $r['done'] && (float) $r['win'] === 0.0 && $r['why'] === 'fail' && isset($r['c']) && abs($bal[$U] - $b3) < 0.001);
$r = casino_multi(load_db(), $me, 'srun', 'cash', 'real', 0, []);
check('encaisser après la faute : rien', (float) ($r['win'] ?? 0) === 0.0 && abs($bal[$U] - $b3) < 0.001);
// retour exact du mode mixte : encaisser à ×x quand le moment secret ≥ x … même loi que l'avion
foreach ([1.2, 2, 5, 20] as $x) { $N = 1000000; // 1 million de tirages : la simulation est stable même à ×20 $w = 0; for ($i = 0; $i < $N; $i++) if (casino_crash_point() > $x) $w++;
  check(sprintf('mixte : encaisser à ×%s rend %.1f %% (≤ 94)', $x, $w / $N * $x * 100), $w / $N * $x < 0.95); }
check('admin : la limite de mise accepte les nouveaux jeux', isset(casino_save_limits(['srun' => 5])['limits']['srun']));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
