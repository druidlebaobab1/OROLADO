<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2850 — groupe « live3 » : 12 nouveaux jeux EN DIRECT (casino_lib.php CASINO_LIVE3, moteur casino_draw_*).
 * 1) déclaration ; 2) retour EXACT de chaque choix par énumération de TOUS les résultats possibles (≤ 94 %) ;
 * 3) simulation de vrais tirages (fréquences + retour simulé de chaque choix) ; 4) vrais paris (argent retiré une fois,
 * versé une fois, retard / double refusés, ancien tour sûr) ; 5) coût serveur mesuré (tirage, lecture publique, fichier).
 * Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_live3_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'casino_ext.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = []; $credits = 0;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$credits) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') {
    if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient'];
    $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2);
    return ['ok' => true, 'real' => $bal[$u]];
  }
  if ($fn === 'resolve_trade') {
    $k = $u . '|' . $a['p_order'];
    if (!isset($keys[$k])) { $keys[$k] = 1; $credits++; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); }
    return ['ok' => true, 'real' => $bal[$u]];
  }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
mkdir($tmp . '/casino_ext');
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_lib.php';
require $tmp . '/casino_lib.php';
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$G = array_keys(CASINO_LIVE3);

echo "1) Déclaration : 12 jeux en direct, clés libres, anciens jeux inchangés\n";
check('CASINO_LIVE3 = 12 jeux, mises ouvertes 120 s', count($G) === 12 && count(array_filter(CASINO_LIVE3, static fn($pb) => $pb[1] === 120 && $pb[0] >= 140)) === 12);
check('CASINO_DRAW (5) et CASINO_LIVE2 (4) inchangés', CASINO_DRAW === ['cryptox' => [180, 120], 'horses' => [210, 120], 'roulette' => [160, 120], 'race' => [210, 120], 'planets' => [160, 120]]
  && CASINO_LIVE2 === ['catwalk' => [200, 120], 'fleets' => [180, 120], 'gemcount' => [170, 120], 'claw' => [165, 120]]);
$tour = (string) file_get_contents(__DIR__ . '/../casino-tour.php');
foreach ($G as $g) check("$g : jeu à tirage, plusieurs étapes, pas une fiche ext, lisible par casino-tour.php", casino_is_draw($g) && in_array($g, CASINO_GAMES, true) && in_array($g, CASINO_MULTI, true)
  && casino_ext_type($g) === '' && casino_draw_pb($g) === CASINO_LIVE3[$g] && strpos($tour, "'$g'") !== false && !isset(CASINO_DRAW[$g]) && !isset(CASINO_LIVE2[$g]));
$ext = glob(__DIR__ . '/../casino_ext/*.php') ?: []; $clash = [];
foreach ($ext as $f) foreach ($G as $g) if (preg_match("/'" . $g . "'\s*=>\s*\[/", (string) file_get_contents($f))) $clash[] = "$g@" . basename($f);
check('aucune clé déjà prise par une fiche casino_ext', !$clash, implode(',', $clash));

echo "2) Retour EXACT de chaque choix : énumération de TOUS les résultats (chance × gain) ≤ 94 %\n";
/** Tous les résultats possibles d'un jeu avec leur chance exacte : [[chance, résultat], …] */
function all_outcomes(string $g, int $base = 8): array {
  $L = [];
  switch ($g) {
    case 'dtlive': for ($d = 1; $d <= 13; $d++) for ($t = 1; $t <= 13; $t++) $L[] = [1 / 169, ['n' => $d > $t ? 0 : ($d < $t ? 1 : 2), 'd' => $d, 't' => $t]]; break;
    case 'hilolive': for ($x = 2; $x <= 14; $x++) $L[] = [1 / 13, ['n' => $x > $base ? 0 : ($x < $base ? 1 : 2), 'b' => $base, 'x' => $x]]; break;
    case 'sicbolive': for ($a = 1; $a <= 6; $a++) for ($b = 1; $b <= 6; $b++) for ($c = 1; $c <= 6; $c++) $L[] = [1 / 216, ['n' => $a + $b + $c, 'd' => [$a, $b, $c]]]; break;
    case 'kenolive': // n (boules 1–40) et q (impaires) suivent la même loi hypergéométrique ; on énumère les deux marges
      $T = casino_live3_c(80, 20);
      for ($k = 0; $k <= 20; $k++) for ($j = 0; $j <= 20; $j++) $L[] = [casino_live3_c(40, $k) * casino_live3_c(40, 20 - $k) / $T * casino_live3_c(40, $j) * casino_live3_c(40, 20 - $j) / $T, ['n' => $k, 'q' => $j]];
      break;
    case 'lucky10': for ($k = 1; $k <= 10; $k++) $L[] = [0.1, ['n' => $k]]; break;
    case 'moneywheel': for ($k = 0; $k < 54; $k++) $L[] = [1 / 54, ['n' => $k]]; break;
    case 'coinlive': for ($m = 0; $m < 8; $m++) $L[] = [1 / 8, ['n' => ($m & 1) + ($m >> 1 & 1) + ($m >> 2 & 1)]]; break;
    case 'pegdrop': for ($m = 0; $m < 256; $m++) { $s = 0; for ($b = 0; $b < 8; $b++) $s += $m >> $b & 1; $L[] = [1 / 256, ['n' => $s]]; } break;
    case 'football': foreach (CASINO_FB_H as $h => $wh) foreach (CASINO_FB_A as $a => $wa) $L[] = [$wh * $wa / 10000, ['n' => $h * 10 + $a]]; break;
    case 'bullseye': foreach (CASINO_BULL_W as $i => $w) $L[] = [$w / 100, ['n' => $i]]; break;
    case 'ladderlive': for ($k = 0; $k < 4; $k++) $L[] = [0.25, ['n' => $k]]; break;
    case 'moonshot': // P(X dans [a, b[) = 1/a − 1/b : on prend un point de chaque tranche élémentaire (bornes 1 · 1,5 · 2 · 3 · 10 · ∞)
      $edges = [1.0, 1.5, 2.0, 3.0, 10.0, INF];
      for ($k = 0; $k < 5; $k++) $L[] = [1 / $edges[$k] - ($edges[$k + 1] === INF ? 0 : 1 / $edges[$k + 1]), ['n' => (int) round($edges[$k] * 100)]];
      break;
  }
  return $L;
}
$okR = true; $rows = [];
foreach ($G as $g) {
  foreach ($g === 'hilolive' ? range(3, 13) : [8] as $base) {
    $L = all_outcomes($g, $base); $sum = array_sum(array_column($L, 0));
    if (abs($sum - 1) > 1e-9) { $okR = false; echo "     $g : somme des chances $sum\n"; }
    $od = casino_live3_odds($g, $g === 'hilolive' ? ['b' => $base] : []);
    $txt = [];
    foreach ($od as $sel => $o) {
      $rtp = 0.0; $pw = 0.0;
      foreach ($L as [$p, $out]) { $m = casino_draw_mult($g, (string) $sel, $out + ($g === 'hilolive' ? ['b' => $base] : [])); $rtp += $p * $m; if ($m > 0) $pw += $p; }
      $ok = $rtp <= 0.94 + 1e-9 && $rtp >= 0.93 && abs($pw - casino_live3_probs($g, ['b' => $base])[$sel]) < 1e-9;
      if (!$ok) $okR = false;
      $txt[] = "$sel ×$o " . number_format($rtp * 100, 2) . '%' . ($ok ? '' : ' !!');
    }
    if ($g !== 'hilolive' || in_array($base, [3, 8, 13], true)) $rows[] = sprintf('     %-10s%s %s', $g, $g === 'hilolive' ? " b=$base" : '', implode(' · ', $txt));
  }
}
echo implode("\n", $rows) . "\n";
check('chaque choix des 12 jeux (High-Low : chaque carte de base 3…K) : retour exact entre 93 % et 94 %, chance gagnante = chance déclarée', $okR);
$all = []; foreach ($G as $g) foreach (casino_live3_probs($g, ['b' => 3]) + casino_live3_probs($g, ['b' => 13]) as $s => $p) $all[] = casino_live2_odd($p);
check('aucune cote ≤ ×1,01', min($all) > 1.01, (string) min($all));

echo "3) Simulation de vrais tirages : fréquences et retour simulé de chaque choix\n";
$M = 200000; $simTxt = [];
foreach ($G as $g) {
  $hit = []; $ret = []; $okS = true; $t0 = hrtime(true);
  for ($k = 0; $k < $M; $k++) {
    $o = casino_live3_draw($g);
    switch ($g) { // cohérence de ce que le client dessine
      case 'dtlive': if ($o['d'] < 1 || $o['d'] > 13 || $o['t'] < 1 || $o['t'] > 13 || $o['n'] !== ($o['d'] > $o['t'] ? 0 : ($o['d'] < $o['t'] ? 1 : 2))) $okS = false; break;
      case 'hilolive': if ($o['b'] < 3 || $o['b'] > 13 || $o['x'] < 2 || $o['x'] > 14) $okS = false; break;
      case 'sicbolive': if (array_sum($o['d']) !== $o['n']) $okS = false; break;
      case 'kenolive': if (count(array_unique($o['b'])) !== 20 || min($o['b']) < 1 || max($o['b']) > 80) $okS = false; break;
      case 'coinlive': case 'pegdrop': if (array_sum($o['h']) !== $o['n']) $okS = false; break;
      case 'football':
        $h = 0; $a = 0; $pm = 0; foreach ($o['g'] as [$mn, $w]) { if ($mn <= $pm || $mn > 89) $okS = false; $pm = $mn; $w ? $a++ : $h++; }
        if ($h * 10 + $a !== $o['n']) $okS = false; break;
      case 'moneywheel': if ($o['n'] < 0 || $o['n'] > 53) $okS = false; break;
      case 'moonshot': if ($o['n'] < 100 || $o['n'] > 99999) $okS = false; break;
    }
    foreach (casino_live3_odds($g, $o) as $sel => $od) { $m = (float) casino_draw_mult($g, (string) $sel, $o); $ret[$sel] = ($ret[$sel] ?? 0) + $m; if ($m > 0) $hit[$sel] = ($hit[$sel] ?? 0) + 1; }
  }
  $us = (hrtime(true) - $t0) / 1e3 / $M;
  $tx = []; $okF = $okS;
  foreach (casino_live3_probs($g) as $sel => $p) {
    if ($g === 'hilolive') continue; // chances qui dépendent de la carte de base : vérifiées à part
    $f = ($hit[$sel] ?? 0) / $M; $sd = sqrt($p * (1 - $p) / $M);
    if (abs($f - $p) > 5 * $sd + 1e-6) $okF = false;
    $tx[] = $sel . ' ' . number_format(($ret[$sel] ?? 0) / $M * 100, 1) . '%';
  }
  if ($g === 'hilolive') $tx[] = 'h/l/e ' . number_format(($ret['h'] + $ret['l'] + $ret['e']) / $M / 3 * 100, 1) . '% (moy.)';
  check(sprintf('%s : %d tirages cohérents, fréquences = chances (±5σ), %.1f µs par tirage', $g, $M, $us), $okF);
  $simTxt[] = sprintf('     %-10s %s', $g, implode(' · ', $tx));
}
echo implode("\n", $simTxt) . "\n";
// High-Low : chaque carte de base équiprobable, la suivante uniforme 2…A
$bc = array_fill(3, 11, 0); $okH = true; $tot = 0.0;
for ($k = 0; $k < $M; $k++) { $o = casino_live3_draw('hilolive'); $bc[$o['b']]++; foreach (['h', 'l', 'e'] as $s) $tot += (float) casino_draw_mult('hilolive', $s, $o); }
foreach ($bc as $c) if (abs($c / $M - 1 / 11) > 0.004) $okH = false;
check(sprintf('hilolive : base 3…K équiprobable ; retour simulé moyen (3 choix) %.2f %%', $tot / $M / 3 * 100), $okH && $tot / $M / 3 < 0.95);
// Moon Shot : P(X ≥ m) ≈ 1/m (forme du tirage)
$xs = []; for ($k = 0; $k < $M; $k++) $xs[] = casino_live3_draw('moonshot')['n'] / 100;
$okM = true; foreach ([1.25, 2, 2.5, 5, 20, 50] as $m) { $f = count(array_filter($xs, static fn($x) => $x >= $m)) / $M; if (abs($f - 1 / $m) > 0.006) $okM = false; }
check('moonshot : P(X ≥ m) = 1/m (m = 1,25 · 2 · 2,5 · 5 · 20 · 50)', $okM);
$inv = ['dtlive' => ['D', 'tie', ''], 'hilolive' => ['x', 'H'], 'sicbolive' => ['3', 'any'], 'kenolive' => ['10', 'top '], 'lucky10' => ['0', '11', 'odd2'], 'moneywheel' => ['1', 'v3', 'v50'],
  'coinlive' => ['h4', 'H'], 'pegdrop' => ['d5', '4', 'l'], 'football' => ['3', 'X', 'ng'], 'bullseye' => ['5', '-1', 'gold'], 'ladderlive' => ['c4', 's'], 'moonshot' => ['e', 'o3']];
$okI = true; foreach ($inv as $g => $l) foreach ($l as $s) if (casino_draw_mult($g, $s, []) !== null) { $okI = false; echo "     accepté à tort : $g/$s\n"; }
check('sélections invalides refusées', $okI);
check('High-Low : carte de base publique pendant les mises, la suivante cachée', casino_live3_pre('hilolive', ['b' => 9, 'x' => 4, 's' => [2, 1]]) === ['b' => 9, 's' => 2] && casino_live3_pre('dtlive', ['d' => 1]) === []);

echo "4) Vrais paris : retirés une fois, réglés sur le tirage commun, versés une fois ; retard / double refusés\n";
$U = 'aaaaaaaa-1111-2222-3333-999999999999';
$db = blank_db();
$db['users']['u_l'] = ['id' => 'u_l', 'email' => 'l3@gmail.com', 'role' => 'user', 'sbId' => $U, 'realStakeVolume' => 0, 'wagerNeed' => 40];
$db['vault']['u_l'] = ['demo' => 500, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$U] = 1000.0; $me = $db['users']['u_l'];
$file = casino_user_file('u_l');
$sels = ['dtlive' => 'd', 'hilolive' => 'h', 'sicbolive' => 'big', 'kenolive' => 'tt', 'lucky10' => '7', 'moneywheel' => 'v5', 'coinlive' => 'h2', 'pegdrop' => 'L', 'football' => 'x', 'bullseye' => '0', 'ladderlive' => 'c2', 'moonshot' => 'o2'];
foreach ($G as $g) {
  [$P, $B] = CASINO_LIVE3[$g]; $sel = $sels[$g];
  $i0 = casino_draw_i($g, time()) + 40; $t = casino_draw_start($g, $i0) + 2.0;
  casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
  $b0 = $bal[$U]; $c0 = $credits;
  $pub = casino_draw_public($g, $t);
  check("$g : pendant les mises : résultat CACHÉ, cotes visibles" . ($g === 'hilolive' ? ', carte de base visible' : ''), $pub['phase'] === 'bet' && !isset($pub['res']) && isset($pub['odds'][$sel]) && $pub['end'] - $pub['t0'] == $P && $pub['close'] - $pub['t0'] == $B
    && ($g !== 'hilolive' || (isset($pub['pre']['b']) && !isset($pub['pre']['x']) && strpos(json_encode($pub), '"x"') === false)));
  $r = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => 'zz'], $t);
  check("$g : sélection invalide refusée, rien retiré", $r['ok'] === false && $bal[$U] == $b0);
  $r = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => $sel], $t);
  check("$g/$sel : pari accepté, 2 $ retirés", $r['ok'] && abs($bal[$U] - ($b0 - 2)) < 0.001 && empty($r['done']), json_encode($r));
  $r2 = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => $sel], $t + 1);
  check("$g : 2e pari sur le même tour refusé", $r2['ok'] === false && ($r2['reason'] ?? '') === 'already' && abs($bal[$U] - ($b0 - 2)) < 0.001);
  $dr0 = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], casino_draw_start($g, $i0) + $B - 1);
  check("$g : avant la fermeture : pas réglé, pas de résultat", empty($dr0['done']) && !isset($dr0['round']['res']));
  $tShow = casino_draw_start($g, $i0) + $B + 0.5;
  $dr = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $tShow);
  $out = casino_draw_outcome($g, $i0);
  $want = casino_win(2, (float) casino_draw_mult($g, $sel, $out));
  check("$g : réglé selon le tirage commun (n={$out['n']}, gain $want $)", !empty($dr['done']) && abs($dr['win'] - $want) < 0.001 && abs($bal[$U] - ($b0 - 2 + $want)) < 0.001, json_encode([$dr['win'] ?? null, $bal[$U] - $b0]));
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $tShow + 2);
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $tShow + 30);
  check("$g : versé UNE seule fois ; résultat public = le même pour tous", abs($bal[$U] - ($b0 - 2 + $want)) < 0.001 && $credits === $c0 + 1 && (casino_draw_public($g, $tShow)['res'] ?? null) == $out);
  $late = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 2, ['sel' => $sel], casino_draw_start($g, $i0) + $B - 0.3);
  check("$g : pari 0,3 s avant la fermeture refusé", $late['ok'] === false && ($late['reason'] ?? '') === 'closed');
  // un gain forcé : on cherche un tour futur où le choix gagne
  for ($i1 = casino_draw_i($g, time()) + 300; (float) casino_draw_mult($g, $sel, casino_draw_outcome($g, $i1)) <= 0; $i1++);
  $odd = (float) casino_draw_mult($g, $sel, casino_draw_outcome($g, $i1));
  casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
  $b0 = $bal[$U];
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 0.15, ['sel' => $sel], casino_draw_start($g, $i1) + 1);
  $dr = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], casino_draw_start($g, $i1) + $B + 1);
  $want = floor(0.15 * $odd * 100 + 1e-6) / 100;
  check(sprintf('%s : gain 0,15 $ × %.2f = %.2f $ (arrondi vers le bas)', $g, $odd, $want), abs(($dr['win'] ?? -1) - $want) < 1e-9 && abs($bal[$U] - ($b0 - 0.15 + $want)) < 0.001);
  // ancien tour : sorti de l'historique, réglé avec SON résultat, une fois
  $i2 = $i1 + 2000;
  casino_with($file, static function (array &$st) use ($g) { unset($st['g'][$g]); return true; });
  $b0 = $bal[$U];
  $r = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'bet', 'real', 1, ['sel' => $sel], casino_draw_start($g, $i2) + 3);
  $kept = casino_draw_outcome($g, $i2);
  casino_draw_many($g, range($i2 + 1, $i2 + 65));
  $gone = casino_draw_outcome($g, $i2) === [];
  $later = casino_draw_start($g, $i2 + 65) + 1;
  $dr = casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $later);
  $want = casino_win(1, (float) casino_draw_mult($g, $sel, $kept));
  casino_draw_act(load_db(), $me, 'u_l', $file, $g, 'dround', 'real', 0, [], $later + 5);
  check("$g : tour sorti de l'historique : pari réglé avec son résultat ($want $), une fois", $r['ok'] && $gone && !empty($dr['done']) && empty($dr['void']) && abs($bal[$U] - ($b0 - 1 + $want)) < 0.001);
}

echo "5) Coût serveur (un tirage par tour et par jeu, partagé par tous ; rien si personne ne regarde)\n";
$cost = [];
foreach ($G as $g) {
  $now = (float) time();
  $t0 = hrtime(true); for ($k = 0; $k < 400; $k++) casino_draw_public($g, $now); $pubUs = (hrtime(true) - $t0) / 1e3 / 400;
  $sz = filesize(casino_dir() . DIRECTORY_SEPARATOR . 'draw-' . $g . '.json');
  $js = strlen(json_encode(['ok' => true, 'now' => $now, 'round' => casino_draw_public($g, casino_draw_start($g, casino_draw_i($g, $now)) + CASINO_LIVE3[$g][1] + 1)]));
  $cost[] = sprintf('%s %.0f µs/lecture, fichier %.1f Ko, réponse %d o', $g, $pubUs, $sz / 1024, $js);
  if ($pubUs > 5000 || $sz > 40000 || $js > 2000) $cost[] = '!!';
}
echo '     ' . implode("\n     ", $cost) . "\n";
check('lecture publique < 5 ms, fichier du tirage < 40 Ko (60 tours), réponse < 2 Ko', !in_array('!!', $cost, true));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
