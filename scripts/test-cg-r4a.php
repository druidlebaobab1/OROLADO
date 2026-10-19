<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2811 (round 4) — tirages en direct plus longs (n° de tour qui continue d'augmenter) + Penalty à 9 zones (3 colonnes × 3 hauteurs, tir au doigt ou glissé) : même chance de but (2/3),
 * mêmes multiplicateurs, même marge — prouvé par calcul EXACT + simulation + vraies parties. Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_pen9_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
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
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

echo "1) Calcul EXACT (toutes les possibilités du gardien, fonction du serveur) : but 2/3 dans chacune des 9 zones\n";
// le gardien : colonne kc ∈ {0,1,2} (1/3 chacune), hauteur kr ∈ {0,1,2} (1/3 chacune, dessin) → 9 cas équiprobables
$worstZ = [1.0, 0.0]; $okDraw = true;
for ($z = 0; $z < 9; $z++) {
  $aim = $z % 3; $h = intdiv($z, 3); $pg = 0.0;
  for ($kc = 0; $kc < 3; $kc++) for ($kr = 0; $kr < 3; $kr++) {
    [$k, $goal, $krow] = casino_pen_keeper($aim, $h, $kc, $kr);
    if ($goal) $pg += 1 / 9;
    if (!$goal && ($k !== $aim || $krow !== $h)) $okDraw = false; // un arrêt = le gardien plonge exactement sur le ballon
    if ($goal && $k === $aim) $okDraw = false;
  }
  $worstZ = [min($worstZ[0], $pg), max($worstZ[1], $pg)];
}
check(sprintf('9 zones : chance de but exacte %.6f … %.6f (= 2/3 partout)', $worstZ[0], $worstZ[1]), abs($worstZ[0] - 2 / 3) < 1e-12 && abs($worstZ[1] - 2 / 3) < 1e-12);
check('dessin cohérent : arrêt = même colonne et même hauteur que le ballon ; but = autre colonne', $okDraw);
// retour exact d'un joueur qui encaisse après k buts (k = 1..8) : (2/3)^k × multiplicateur de l'échelle
$rt = []; for ($k = 1; $k <= 8; $k++) $rt[$k] = pow(2 / 3, $k) * casino_pen_mult($k);
check(sprintf('retour exact en encaissant après 1…8 buts : %.4f %% … %.4f %% (≤ 96 %%, comme avant)', min($rt) * 100, max($rt) * 100), max($rt) <= 0.96 + 1e-12 && min($rt) > 0.955, json_encode(array_map(static fn($v) => round($v * 100, 4), $rt)));
check('échelle inchangée ×1,44 ×2,16 ×3,24 … ×24,60', array_map('casino_pen_mult', range(1, 8)) === [1.44, 2.16, 3.24, 4.86, 7.29, 10.93, 16.4, 24.6], json_encode(array_map('casino_pen_mult', range(1, 8))));
// marge de la maison sur une série jouée en entier avec n'importe quelle stratégie de zones : chaque tir est indépendant à 2/3 → identique
check('instantané (ancien mode) inchangé : 2/3 × ×1,44 = 96 %', abs(2 / 3 * CASINO_PENALTY_MULT - 0.96) < 1e-9);

echo "2) Le hasard du serveur : 90 000 tirages réels du gardien (10 000 par zone)\n";
$pz = [];
for ($z = 0; $z < 9; $z++) { $g = 0; for ($n = 0; $n < 10000; $n++) { [, $goal] = casino_pen_keeper($z % 3, intdiv($z, 3)); if ($goal) $g++; } $pz[] = $g / 10000; }
check(sprintf('but %.3f … %.3f par zone (attendu 0,667)', min($pz), max($pz)), min($pz) > 0.64 && max($pz) < 0.695, json_encode($pz));

echo "3) Vraies parties (argent retiré une fois, versé une fois)\n";
$U = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_cs'] = ['id' => 'u_cs', 'email' => 'cs@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_cs'] = ['demo' => 500, 'real' => 5000];
save_db(orolado_data_file(), $db);
$bal[$U] = 5000.0;
$me = load_db()['users']['u_cs'];
$p = casino_multi(load_db(), $me, 'penalty', 'start', 'real', 1, []);
check('départ : 1 $ retiré, échelle 8 tirs', $p['ok'] && abs($bal[$U] - 4999.0) < 1e-9 && count($p['ladder']) === 8);
$bad = casino_multi(load_db(), $me, 'penalty', 'shoot', 'real', 0, ['z' => 9]);
check('zone 9 (hors du but) refusée', $bad['ok'] === false && $bad['reason'] === 'param');
$bad = casino_multi(load_db(), $me, 'penalty', 'shoot', 'real', 0, ['z' => -1]);
check('zone -1 refusée', $bad['ok'] === false);
$t = casino_multi(load_db(), $me, 'penalty', 'shoot', 'real', 0, ['z' => 7]); // bas milieu
$s0 = $t['shots'][0] ?? [];
check('tir z=7 → colonne 1, hauteur 2 ; [colonne, hauteur, gardien, but, hauteur du gardien]', $t['ok'] && $s0[0] === 1 && $s0[1] === 2 && count($s0) === 5 && $s0[3] === ($s0[2] !== 1 ? 1 : 0) && ($s0[3] ? true : $s0[4] === 2), json_encode($s0));
if (empty($t['done'])) casino_multi(load_db(), $me, 'penalty', 'cash', 'real', 0, []);
// ancien client pendant la mise en ligne : {aim, h}
$p = casino_multi(load_db(), $me, 'penalty', 'start', 'real', 1, []);
$t = casino_multi(load_db(), $me, 'penalty', 'shoot', 'real', 0, ['aim' => 2, 'h' => 0]);
$s0 = $t['shots'][0] ?? [];
check('ancien client {aim: 2, h: 0} accepté (colonne 2, haut)', $t['ok'] && $s0[0] === 2 && $s0[1] === 0 && $s0[3] === ($s0[2] !== 2 ? 1 : 0), json_encode($s0));
$t = casino_multi(load_db(), $me, 'penalty', 'shoot', 'real', 0, ['aim' => 3]);
check('ancien client : visée 3 refusée', $t['ok'] === false || !empty($t['done']));
$st = casino_multi(load_db(), $me, 'penalty', 'state', 'real', 0, []);
if (empty($st['done'])) casino_multi(load_db(), $me, 'penalty', 'cash', 'real', 0, []);
// 2 000 séries réelles « encaisser après 2 buts », zones au hasard : argent exact et retour ≈ 96 %
$b0 = $bal[$U]; $N = 2000; $paid = 0.0; $okMoney = true; $goals = 0; $shots = 0;
for ($n = 0; $n < $N; $n++) {
  $before = $bal[$U];
  $p = casino_multi(load_db(), $me, 'penalty', 'start', 'real', 1, []);
  if (!$p['ok']) { $okMoney = false; break; }
  $r = $p;
  for ($k = 0; $k < 2 && empty($r['done']); $k++) { $r = casino_multi(load_db(), $me, 'penalty', 'shoot', 'real', 0, ['z' => random_int(0, 8)]); $shots++; $last = end($r['shots']); if ($last[3]) $goals++; }
  if (empty($r['done'])) $r = casino_multi(load_db(), $me, 'penalty', 'cash', 'real', 0, []);
  $paid += (float) $r['win'];
  if (abs($bal[$U] - ($before - 1 + (float) $r['win'])) > 1e-6) $okMoney = false;
  if (!in_array((float) $r['win'], [0.0, 2.16], true)) $okMoney = false;
}
check(sprintf('%d séries : chaque gain = 0 ou 2,16 $, solde exact à chaque partie', $N), $okMoney);
check(sprintf('but %.1f %% des tirs (attendu 66,7) · retour %.1f %% (attendu 96)', $goals / max(1, $shots) * 100, $paid / $N * 100), abs($goals / max(1, $shots) - 2 / 3) < 0.03 && abs($paid / $N - 0.96) < 0.06);

echo "4) Tirages en direct v2811 : tours plus longs, n° de tour toujours croissant, ancien pari réglé avec SON résultat\n";
$want = ['cryptox' => [180, 120], 'horses' => [210, 120], 'roulette' => [160, 120], 'race' => [210, 120], 'planets' => [160, 120]];
check('durées : ~2 min de mises, puis 40 à 90 s de spectacle', CASINO_DRAW === $want, json_encode(CASINO_DRAW));
$now = (float) time(); $okI = true;
foreach (CASINO_DRAW as $dg => [$P, $B]) {
  $oldMax = (int) floor(($now + 5 * 365 * 86400) / 40); // les anciens n° (période 40 s), même dans 5 ans
  $i = casino_draw_i($dg, $now);
  if ($i <= $oldMax) $okI = false;
  $t0 = casino_draw_start($dg, $i);
  if (!($t0 <= $now && $now < $t0 + $P)) $okI = false;
  if (casino_draw_i($dg, $t0 + $P) !== $i + 1 || casino_draw_i($dg, $t0 + $P - 0.001) !== $i) $okI = false;
  $pub = casino_draw_public($dg, $t0 + 1);
  if ($pub['i'] !== $i || $pub['close'] !== $t0 + $B || $pub['end'] !== $t0 + $P || $pub['phase'] !== 'bet' || isset($pub['res']) || count($pub['last']) !== 6) $okI = false;
  $pub2 = casino_draw_public($dg, $t0 + $B + 0.1);
  if ($pub2['phase'] !== 'show' || empty($pub2['res'])) $okI = false;
}
check('n° de tour > tous les anciens n° (même dans 5 ans), horaires et phases cohérents, résultat caché pendant les mises', $okI);
// le fichier des tirages contient déjà 60 anciens tours (n° ≈ maintenant ÷ 60) : les nouveaux tours se tirent normalement
casino_with(casino_dir() . '/draw-cryptox.json', static function (array &$s) use ($now) { $s = []; $b = (int) floor($now / 60); for ($k = 0; $k < 60; $k++) $s[(string) ($b - $k)] = ['n' => 3]; return true; });
$iN = casino_draw_i('cryptox', $now);
$o = casino_draw_outcome('cryptox', $iN);
check('après la mise en ligne : le nouveau tour est tiré (pas bloqué par les anciens n°)', isset($o['n']) && $o['n'] >= 0 && $o['n'] < CASINO_CRYPTOX_N);
check('un ancien tour encore gardé garde son résultat (pas re-tiré)', casino_draw_outcome('cryptox', (int) floor($now / 60) - 58) === ['n' => 3]);
// pari posé AVANT la mise en ligne (ancienne période 60 s) : réglé avec le résultat gardé dans le pari
$file = casino_user_file('u_cs');
$oi = (int) floor($now / 60) - 1;
casino_with($file, static function (array &$st) use ($oi) { $st['g']['cryptox'] = ['ref' => 'cs_old60_' . $oi, 'mode' => 'real', 'stake' => 2.0, 'round' => $oi, 'close' => (float) ($oi * 60 + 45), 'sel' => '4', 't0' => (float) ($oi * 60 + 3), 'done' => 0, 'o' => ['n' => 4]]; return true; });
$b0 = $bal[$U];
$d = casino_draw_act(load_db(), $me, 'u_cs', $file, 'cryptox', 'dround', 'real', 0, [], $now + 1);
check('ancien pari (période 60 s) réglé après la mise en ligne : 2 × 14,4 = 28,80 $ versés une fois', !empty($d['done']) && abs($bal[$U] - ($b0 + 28.8)) < 1e-6, json_encode([$d['win'] ?? null, $bal[$U] - $b0]));
casino_draw_act(load_db(), $me, 'u_cs', $file, 'cryptox', 'dround', 'real', 0, [], $now + 2);
check('… et pas deux fois', abs($bal[$U] - ($b0 + 28.8)) < 1e-6);
$tb = casino_draw_start('cryptox', $iN + 1) + 5;
$nb = casino_draw_act(load_db(), $me, 'u_cs', $file, 'cryptox', 'bet', 'real', 1, ['sel' => '2'], $tb);
check('nouveau pari sur un nouveau tour accepté (fermeture = ouverture + 120 s)', $nb['ok'] === true && abs((float) $nb['round']['close'] - (casino_draw_start('cryptox', $iN + 1) + 120)) < 1e-6, json_encode($nb['round'] ?? $nb));
$late = casino_draw_act(load_db(), $me, 'u_cs', $file, 'cryptox', 'bet', 'real', 1, ['sel' => '2'], casino_draw_start('cryptox', $iN + 2) + 119.5);
check('pari 0,5 s avant la fermeture refusé (marge réseau inchangée)', $late['ok'] === false);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
