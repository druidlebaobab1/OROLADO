<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2805 — skill1 (6 jeux « où tu contrôles », mode mixte) : les fiches casino_ext/skill1.php se chargent, le retour est
 * ≤ 94 % (même loi que l'avion), l'argent bouge une seule fois (départ / encaisser / faute / fin secrète).
 * Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_sk1_' . bin2hex(random_bytes(4));
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
copy(__DIR__ . '/../casino_ext/skill1.php', $tmp . '/casino_ext/skill1.php');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$GAMES = ['spacerun', 'flappyrock', 'stack', 'knifehit', 'basket', 'starbridge', 'kicker']; // kicker : retiré du catalogue, fiche gardée pour régler les anciennes parties
echo "1) Fiches : les 6 jeux (+ kicker retiré) existent, type skill, vitesse entre 0,08 et 0,14\n";
$k = casino_ext_keys();
foreach ($GAMES as $g) {
  $r = casino_skill_rate($g);
  check("$g chargé (skill, rate $r)", in_array($g, $k, true) && casino_ext_type($g) === 'skill' && $r >= 0.08 && $r <= 0.14);
  check("$g : clé libre (pas un ancien jeu)", !in_array($g, CASINO_GAMES, true));
}
check('noms affichés', (casino_ext_names()['stack'] ?? '') === 'Tower Stack' && (casino_ext_names()['spacerun'] ?? '') === 'Space Runner');
check('Star Bridge : nom pour l\'admin, Penalty Kicker garde le sien', (casino_ext_names()['starbridge'] ?? '') === 'Star Bridge' && (casino_ext_names()['kicker'] ?? '') === 'Penalty Kicker');
$cat = (string) file_get_contents(__DIR__ . '/../js/games/cat-skill1.js');
check('catalogue : starbridge affiché, kicker plus affiché', strpos($cat, "k: 'starbridge'") !== false && strpos($cat, "k: 'kicker'") === false);
$js = (string) file_get_contents(__DIR__ . '/../js/games/skill1.js');
check('module : starbridge enregistré, plus de kicker', strpos($js, "'starbridge']") !== false && strpos($js, "'kicker'") === false);

echo "2) Retour aux joueurs : encaisser à ×x rend ≤ 94 % (exact + simulé), multiplicateur = e^(rate·s) arrondi vers le bas\n";
foreach ([1.1, 1.5, 2, 3, 5, 10] as $x) {
  $N = 300000; $w = 0; for ($i = 0; $i < $N; $i++) if (casino_crash_point() > $x) $w++;
  check(sprintf('simulé : encaisser à ×%s rend %.2f %%', $x, $w / $N * $x * 100), $w / $N * $x < 0.955);
}
// exact : c = floor(0,94 / u × 100) / 100 avec u uniforme → P(c > x) = 0,94 / (x + 0,01) → retour = 0,94·x / (x + 0,01) < 94 %
foreach ([1.01, 2, 10, 100] as $x) { $rt = CASINO_EDGE * $x / ($x + 0.01); check(sprintf('exact : encaisser à ×%s rend %.3f %%', $x, $rt * 100), $rt < 0.94 && CASINO_EDGE === 0.94); }
$N = 400000; $s = 0.0; for ($i = 0; $i < $N; $i++) { $c = casino_crash_point(); $s += $c > 2 ? 2 : 0; }
check(sprintf('stratégie « toujours ×2 » : retour %.2f %% (attendu ≈ 94)', $s / $N * 100), $s / $N > 0.92 && $s / $N < 0.955);
foreach ($GAMES as $g) {
  $r = casino_skill_rate($g);
  check("$g : ×2 après ln2/rate s", casino_skill_mult($g, log(2) / $r + 0.001) === 2.0 && casino_skill_mult($g, 0) === 1.0 && casino_skill_mult($g, 1) === floor(exp($r) * 100) / 100);
}

echo "3) Argent : départ / encaisser / faute / fin secrète, pour chaque jeu\n";
$U = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_x'] = ['id' => 'u_x', 'email' => 'x@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_x'] = ['demo' => 500, 'real' => 50];
save_db(orolado_data_file(), $db); $bal[$U] = 50.0; $me = $db['users']['u_x'];
$file = casino_user_file('u_x');
foreach ($GAMES as $g) {
  $b0 = $bal[$U];
  $r = casino_multi(load_db(), $me, $g, 'start', 'real', 2, []);
  check("$g départ : 2 \$ retirés une fois, moment secret caché", $r['ok'] && abs($bal[$U] - ($b0 - 2)) < 0.001 && !isset($r['c']) && isset($r['t0'], $r['rate'], $r['now']), json_encode($r));
  casino_with($file, static function (array &$st) use ($g) { $st['g'][$g]['c'] = 50.0; return true; }); // moment secret tiré au hasard (peut être ×1,00) : fixé pour l'essai
  $s = casino_multi(load_db(), $me, $g, 'state', 'real', 0, []);
  check("$g état : partie en cours, pas de moment secret", $s['ok'] && !$s['done'] && !isset($s['c']));
  // encaisser à ×(e^(rate·8)) avec un moment secret à ×50
  casino_with($file, static function (array &$st) use ($g) { $st['g'][$g]['t0'] -= 8.0; return true; });
  $want = casino_skill_mult($g, 8.0);
  $r = casino_multi(load_db(), $me, $g, 'cash', 'real', 0, ['m' => 999]);
  check(sprintf('%s encaisser : payé ×%.2f (horloge du serveur)', $g, $r['out'] ?? 0), $r['done'] && $r['why'] === 'cash' && abs($r['out'] - $want) < 0.03 && abs($bal[$U] - ($b0 - 2 + $r['win'])) < 0.001, json_encode($r));
  $b1 = $bal[$U];
  casino_multi(load_db(), $me, $g, 'cash', 'real', 0, []);
  check("$g 2e encaissement : rien de plus", abs($bal[$U] - $b1) < 0.001);
  // faute du joueur
  casino_multi(load_db(), $me, $g, 'start', 'real', 1, []);
  casino_with($file, static function (array &$st) use ($g) { $st['g'][$g]['c'] = 50.0; return true; });
  $b2 = $bal[$U];
  $r = casino_multi(load_db(), $me, $g, 'fail', 'real', 0, []);
  check("$g faute : perdu, rien versé", $r['done'] && (float) $r['win'] === 0.0 && $r['why'] === 'fail' && abs($bal[$U] - $b2) < 0.001);
  $r = casino_multi(load_db(), $me, $g, 'cash', 'real', 0, []);
  check("$g encaisser après la faute : rien", (float) ($r['win'] ?? 0) === 0.0 && abs($bal[$U] - $b2) < 0.001);
  // fin secrète passée : l'état la révèle, encaisser ne paie rien
  casino_multi(load_db(), $me, $g, 'start', 'real', 1, []);
  casino_with($file, static function (array &$st) use ($g) { $st['g'][$g]['t0'] -= 5.0; $st['g'][$g]['c'] = 1.2; return true; });
  $b3 = $bal[$U];
  $r = casino_multi(load_db(), $me, $g, 'state', 'real', 0, []);
  check("$g fin secrète : état done, why=end, c révélé", !empty($r['done']) && ($r['why'] ?? '') === 'end' && (float) $r['c'] === 1.2 && abs($bal[$U] - $b3) < 0.001, json_encode($r));
  $r = casino_multi(load_db(), $me, $g, 'cash', 'real', 0, []);
  check("$g encaisser après la fin : rien", (float) ($r['win'] ?? 0) === 0.0 && abs($bal[$U] - $b3) < 0.001);
}
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
