<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2850 — skill6 (round 6 : les classiques que tout le monde connaît + les jeux de guerre, mode mixte « Tu contrôles »).
 * Liste lue dans casino_ext/skill6.php (lot par lot). Vérifie : fiches chargées (rate 0,03), catalogue cat-skill6.js
 * (section skill, module skill6/7/8, nom dans les 12 langues), modules (règles 12 langues, jamais d'argent côté navigateur),
 * et SURTOUT : quel que soit le moment où l'on encaisse (même un robot parfait, même instantané), retour ≤ 94 % ;
 * un client trafiqué (m=999, win, out) ne change rien ; argent bougé une seule fois. Fausse caisse, dossier temporaire.
 */
$tmp = sys_get_temp_dir() . '/orolado_sk6_' . bin2hex(random_bytes(4));
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
// notre fiche + celles des autres groupes (s'il y en a) : nos clés doivent se charger même avec tout le monde
foreach (glob(__DIR__ . '/../casino_ext/*.php') ?: [] as $f) copy($f, $tmp . '/casino_ext/' . basename($f));
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$GAMES = array_keys(include __DIR__ . '/../casino_ext/skill6.php');
$OLD = ['hamster', 'highway', 'jungledash', 'metrodash', 'spacerun', 'flappyrock', 'stack', 'knifehit', 'basket', 'starbridge', 'archer', 'slicer', 'chicken', 'dodge', 'dartspro', 'orbit',
  'airstrike', 'zombiesiege', 'brickbreak', 'neonsnake', 'helixdrop', 'colorjump', 'cupcake', 'princess'];
$ALL = array_merge($OLD, $GAMES);
$LANGS = ['en', 'fr', 'es', 'pt', 'ar', 'tr', 'vi', 'id', 'ru', 'de', 'hi', 'zh'];
echo "1) Fiches : " . count($GAMES) . " nouveaux jeux (skill, rate 0,03), catalogue, modules, ordre de la salle\n";
$k = casino_ext_keys();
foreach ($GAMES as $g) {
  $r = casino_skill_rate($g);
  check("$g chargé (skill, rate $r)", in_array($g, $k, true) && casino_ext_type($g) === 'skill' && abs($r - 0.03) < 1e-9);
  check("$g : clé libre (pas un ancien jeu)", !in_array($g, CASINO_GAMES, true) && !in_array($g, $OLD, true));
}
foreach ($ALL as $g) check(sprintf('%-11s : ×2 après %.1f s, ×5 après %.1f s', $g, casino_skill_secs($g, 2), casino_skill_secs($g, 5)), in_array($g, $k, true) && casino_skill_secs($g, 2) >= 20 && casino_skill_secs($g, 5) >= 50);
$cat = (string) file_get_contents(__DIR__ . '/../js/games/cat-skill6.js');
preg_match_all("/\{ k: '([a-z0-9]+)', name: '([^']+)', sec: 'skill', file: '(skill[678])', pal: \[[^\]]+\],\n    nm: \{([^}]*)\}/", $cat, $m);
check('catalogue cat-skill6 : les mêmes jeux que la fiche serveur', $m[1] == $GAMES, implode(',', $m[1]));
$NM = casino_ext_names();
foreach ($m[1] as $i => $g) {
  check("$g : même nom anglais (catalogue / serveur)", ($NM[$g] ?? '') === $m[2][$i]);
  $langs = []; preg_match_all("/([a-z]{2}): '([^']+)'/", $m[4][$i], $q); foreach ($q[1] as $j => $l) $langs[$l] = $q[2][$j];
  check("$g : nom dans les 12 langues (≤ 22 caractères)", array_keys($langs) == $LANGS && max(array_map('mb_strlen', $langs)) <= 22, json_encode($langs, JSON_UNESCAPED_UNICODE));
  $js = (string) file_get_contents(__DIR__ . '/../js/games/' . $m[3][$i] . '.js');
  check("module {$m[3][$i]} : $g enregistré + règles (12 langues)", strpos($js, "boot('$g'") !== false && preg_match("/    $g: \{\n(      [a-z]{2}: \[.*\],?\n){12}    \}/", $js) === 1);
}
foreach (array_unique($m[3]) as $file) {
  $js = (string) file_get_contents(__DIR__ . "/../js/games/$file.js");
  check("module $file : textes communs en 12 langues", count(array_filter($LANGS, function ($l) use ($js) { return strpos($js, "    $l: { go:") !== false; })) === 12);
  check("module $file : encaisser = serveur, jamais d'argent côté navigateur", strpos($js, "K.multi(key, 'cash')") !== false && !preg_match('/casino_(debit|credit|finish|win)/', $js));
  check("css/games/$file.css présent", is_file(__DIR__ . "/../css/games/$file.css"));
}
check('aucune clé déjà prise par un autre catalogue', (function () use ($GAMES) { foreach (glob(__DIR__ . '/../js/games/cat-*.js') as $f) { if (basename($f) === 'cat-skill6.js') continue; $c = (string) file_get_contents($f); foreach ($GAMES as $g) if (preg_match("/k: '$g'/", $c)) return false; } return true; })());
$cj = (string) file_get_contents(__DIR__ . '/../js/casino.js');
preg_match('/var SK_POS = \[(.*?)\];/s', $cj, $sk); preg_match_all("/'([a-z0-9]+)'/", $sk[1] ?? '', $sk2);
check('salle : SK_POS contient les anciens + les nouveaux jeux, sans doublon', count($sk2[1]) === count(array_unique($sk2[1])) && !array_diff($ALL, $sk2[1]), count($sk2[1]) . ' jeux');
check('cat-skill6 chargé par la salle (CAT_FILES)', strpos($cj, "'cat-skill6'") !== false);

echo "2) Retour ≤ 94 % QUELLE QUE SOIT l'adresse : la fin secrète c suit la loi de l'avion, payée seulement si encaissé avant\n";
// exact : P(c > x) = 0,94 / (x + 0,01) → encaisser à ×x rend 0,94·x / (x + 0,01) < 94 % pour tout x
$worst = 0.0; for ($x = 1.01; $x <= 1000; $x *= 1.05) { $worst = max($worst, CASINO_EDGE * $x / ($x + 0.01)); }
check(sprintf('exact : meilleur seuil possible rend %.3f %% (< 94 %%)', $worst * 100), $worst < 0.94);
// simulation : un robot PARFAIT (aucune faute, réflexes infinis) ne connaît pas c ; quelle que soit sa règle d'encaissement…
$N = 400000; $cs = []; for ($i = 0; $i < $N; $i++) $cs[] = casino_crash_point();
$strats = [
  'toujours ×1,10' => fn($i) => 1.10, 'toujours ×1,50' => fn($i) => 1.50, 'toujours ×2' => fn($i) => 2.0, 'toujours ×5' => fn($i) => 5.0,
  'toujours ×20' => fn($i) => 20.0, 'au hasard ×1–×10' => fn($i) => 1 + mt_rand() / mt_getrandmax() * 9,
  'martingale du seuil (×1,2 → ×4)' => fn($i) => [1.2, 2.0, 4.0][$i % 3], 'à 60 s de jeu (rate 0,03)' => fn($i) => floor(exp(0.03 * 60) * 100) / 100,
  'robot instantané ×1,01' => fn($i) => 1.01, 'robot réflexes 0,3 s (×1,00 → ×1,01)' => fn($i) => max(1.0, floor(exp(0.03 * 0.3) * 100) / 100),
];
foreach ($strats as $nm => $f) {
  $s = 0.0; for ($i = 0; $i < $N; $i++) { $x = $f($i); if ($x < $cs[$i]) $s += $x; }
  check(sprintf('robot parfait, %-30s : retour %.2f %%', $nm, $s / $N * 100), $s / $N < 0.955);
}
echo "3) Vraies parties par le MOTEUR (960 par stratégie) : le serveur ne paie que si l'encaissement précède la fin secrète\n";
$U = 'aaaaaaaa-1111-2222-3333-555555555555';
$db = blank_db();
$db['users']['u_y'] = ['id' => 'u_y', 'email' => 'y@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_y'] = ['demo' => 0, 'real' => 100000];
save_db(orolado_data_file(), $db); $bal[$U] = 100000.0; $me = $db['users']['u_y'];
$file = casino_user_file('u_y');
foreach (['1.5' => 1.5, '3' => 3.0] as $lab => $x) {
  $b0 = $bal[$U]; $n = 960; $bad = 0; $paid = 0.0;
  for ($i = 0; $i < $n; $i++) {
    $g = $ALL[$i % count($ALL)];
    $r = casino_multi(load_db(), $me, $g, 'start', 'real', 1, []);
    if (empty($r['ok'])) { check("départ $g", false, json_encode($r)); break; }
    $secs = casino_skill_secs($g, $x) + 0.05; // le robot attend pile le temps qu'il faut pour ×x (horloge du serveur reculée)
    casino_with($file, static function (array &$st) use ($g, $secs) { $st['g'][$g]['t0'] -= $secs; return true; });
    $r = casino_multi(load_db(), $me, $g, 'cash', 'real', 0, ['m' => 999]); // un client trafiqué qui demande ×999 : ignoré
    $c = (float) ($r['c'] ?? 0); $w = (float) ($r['win'] ?? 0); $paid += $w;
    // exact, partie par partie : payé ×x (horloge du serveur) SI ET SEULEMENT SI x < c, sinon rien
    if (($x < $c) ? abs($w - casino_win(1.0, $x)) > 0.011 : $w > 0) $bad++;
  }
  check(sprintf('moteur, %d parties sur les %d jeux, encaisser à ×%s : payé seulement avant la fin secrète (%d erreur)', $n, count($ALL), $lab, $bad), $bad === 0);
  $ret = ($bal[$U] - $b0 + $n) / $n;
  check(sprintf('  … retour observé %.1f %% (attendu ≈ 94 %%, bruit ±%d %%)', $ret * 100, $x > 2 ? 15 : 8), $ret < ($x > 2 ? 1.15 : 1.08) && abs($ret - $paid / $n) < 0.01);
}

echo "4) Argent : départ / encaisser / faute / fin secrète, pour chaque nouveau jeu\n";
$U = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_x'] = ['id' => 'u_x', 'email' => 'x@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_x'] = ['demo' => 500, 'real' => 500]; // v3276 : solde dimensionné pour le nombre de jeux (3 manches chacun)
save_db(orolado_data_file(), $db); $bal[$U] = 500.0; $me = $db['users']['u_x'];
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
  casino_with($file, static function (array &$st) use ($g) { $st['g'][$g]['t0'] -= 12.0; $st['g'][$g]['c'] = 1.2; /* v2812 : rate 0,03 → ×1,43 après 12 s (> ×1,2) */ return true; });
  $b3 = $bal[$U];
  $r = casino_multi(load_db(), $me, $g, 'state', 'real', 0, []);
  check("$g fin secrète : état done, why=end, c révélé", !empty($r['done']) && ($r['why'] ?? '') === 'end' && (float) $r['c'] === 1.2 && abs($bal[$U] - $b3) < 0.001, json_encode($r));
  $r = casino_multi(load_db(), $me, $g, 'cash', 'real', 0, []);
  check("$g encaisser après la fin : rien", (float) ($r['win'] ?? 0) === 0.0 && abs($bal[$U] - $b3) < 0.001);
}
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
