<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-10-21 — 4e série (sp_suggestions4) : grands événements réels de la semaine + questions. Cotes plus basses que le
 * marché, marge maison ≥ 6 %, image partout, heures de fin, pas de doublon avec les séries 2 et 3, publiés une seule fois,
 * réglables par l'admin (résultat, nul, annulé). Dossier temporaire (aucune vraie donnée touchée).
 */
$tmp = sys_get_temp_dir() . '/orolado_pseed4_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
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
// seule la 4e série se publie toute seule pendant ce test
foreach (['seed-2026-10.done', 'seed-2026-10b.done', 'seed-2026-10c.done', 'seed-2026-10e.done', 'draw-2026-10.done', 'stale-2026-10.done', 'market-2026-10-21.done'] as $f) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $f, '1');
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $B];
save_db(orolado_data_file(), $db); $bal[$A] = 100.0; $bal[$B] = 100.0;

$list = sp_suggestions4();
$now = time();
$future = array_values(array_filter($list, static fn($r) => $r[3] >= $now + 120));
// --- la liste ---
$cats = []; foreach ($list as $r) $cats[$r[2]] = ($cats[$r[2]] ?? 0) + 1;
echo '       catégories : ' . json_encode($cats) . "\n";
check('au moins 15 événements (foot, NBA, questions)', count($list) >= 15 && ($cats['foot'] ?? 0) >= 8 && ($cats['basket'] ?? 0) >= 3 && ($cats['event'] ?? 0) >= 3, (string) count($list));
check('sp_m2o : cote du marché baissée (2,00 → 1,84 ; 1,95 → 1,79 ; 3,50 → 3,15 ; 5,00 → 4,40)', sp_m2o(2.00) === 1.84 && sp_m2o(1.95) === 1.79 && sp_m2o(3.50) === 3.15 && sp_m2o(5.00) === 4.40);
check('titres ≤ 80 caractères, compétitions ≤ 40', !array_filter($list, static fn($r) => mb_strlen_safe($r[0]) > 80 || mb_strlen_safe($r[1]) > 40));
$titles = array_map(static fn($r) => sp_lower($r[0]), $list);
check('aucun titre en double', count($titles) === count(array_unique($titles)));
$old = array_map(static fn($r) => sp_lower($r[0]), array_merge(sp_suggestions2(), sp_suggestions3()));
check('aucun titre déjà dans les séries 2 et 3', !array_intersect($titles, $old));
// même match déjà proposé (même jour, mêmes équipes, dans un sens ou dans l'autre) ?
$g23 = []; foreach (array_merge(sp_suggestions2(), sp_suggestions3()) as $r) foreach (sp_corr_groups(['title' => $r[0], 'league' => $r[1], 'sport' => $r[2], 'start' => $r[3], 'logos' => $r[5]]) as $g) if (str_starts_with($g, 'm:')) $g23[$g] = $r[0];
$dupM = []; foreach ($list as $r) if ($r[2] !== 'event') foreach (sp_corr_groups(['title' => $r[0], 'league' => $r[1], 'sport' => $r[2], 'start' => $r[3], 'logos' => $r[5]]) as $g) if (isset($g23[$g])) $dupM[] = $r[0];
check('aucun match déjà proposé dans les séries 2 et 3', !$dupM, implode(' | ', $dupM));
$badT = array_filter($list, static fn($r) => $r[3] < strtotime('2026-10-21 00:00 UTC') || $r[3] > strtotime('2026-10-27 23:59 UTC'));
check('dates de la semaine (21/10 → 27/10/2026)', !$badT, implode(' | ', array_column($badT, 0)));
$badE = array_filter($list, static fn($r) => (int) ($r[6] ?? 0) < $r[3] + 7200);
check('heure de FIN ≥ 2 h après la fermeture des paris (foot +2 h, NBA +3 h)', !$badE, implode(' | ', array_column($badE, 0)));
$badM = array_filter($list, static function ($r) { $s = 0; foreach ($r[4] as $o) $s += 1 / $o[1]; return $s < 1 / 0.94 - 1e-9; });
check('marge maison ≥ 6 % sur chaque événement (somme des 1/cote ≥ 1/0,94)', !$badM, implode(' | ', array_column($badM, 0)));
$mx = 0; foreach ($list as $r) { $s = 0; foreach ($r[4] as $o) $s += 1 / $o[1]; $mx = max($mx, $s); }
check('marge pas absurde (somme des 1/cote ≤ 1,18)', $mx <= 1.18, (string) round($mx, 3));
$ms = sp_mset([1.95, 3.75, 3.00]); $ms2 = sp_mset([2.15, 3.67, 3.40]);
check('sp_mset : chaque cote OROLADO reste sous la cote du marché', $ms[0] < 1.95 && $ms[1] < 3.75 && $ms[2] < 3.00 && $ms2[0] < 2.15 && $ms2[1] < 3.67 && $ms2[2] < 3.40, json_encode([$ms, $ms2]));
$badF = array_filter($list, static fn($r) => $r[2] === 'foot' && (count($r[4]) !== 3 || $r[4][1][0] !== 'Nul'));
check('foot : 1 · Nul · 2', !$badF, implode(' | ', array_column($badF, 0)));
$badN = array_filter($list, static fn($r) => $r[2] === 'basket' && count($r[4]) !== 2);
check('NBA : 2 choix (pas de nul)', !$badN);
$qs = array_values(array_filter($list, static fn($r) => $r[2] === 'event'));
check('questions : Oui / Non, jamais « question de prix » (pas de fermeture à 72 h)', $qs && !array_filter($qs, static fn($r) => $r[4][0][0] !== 'Oui' || $r[4][1][0] !== 'Non' || sp_is_price(['title' => $r[0], 'league' => $r[1], 'sport' => 'event', 'logos' => $r[5]])));
$badL = array_filter($qs, static fn($r) => count(array_filter((array) ($r[7] ?? []), static fn($x) => is_string($x) && $x !== '')) < 11);
check('chaque question est traduite dans les 11 autres langues', !$badL, implode(' | ', array_column($badL, 0)));
$js = (string) file_get_contents(__DIR__ . '/../js/sports.js');
$badI = [];
foreach ($list as $r) {
  $need = $r[2] === 'event' ? 1 : 2;
  $lg = array_values(array_filter((array) $r[5]));
  $ok = count($lg) >= $need;
  foreach ($lg as $l) {
    if (str_starts_with($l, 'img/teams/')) $ok = $ok && is_file(__DIR__ . '/../' . $l) && substr((string) file_get_contents(__DIR__ . '/../' . $l), 0, 4) === "\x89PNG" && (bool) preg_match('#^img/teams/[a-z0-9-]{2,30}\.png$#', $l);
    elseif (preg_match('/^q:([a-z]+)$/', $l, $m)) $ok = $ok && (bool) preg_match('/QIMG\.' . $m[1] . ' = |\b' . $m[1] . ": '<svg/", $js);
    else $ok = false;
  }
  if (!$ok) $badI[] = $r[0];
}
check('chaque événement a son image (écusson dans img/teams/ ou icône)', !$badI, implode(' | ', $badI));
check('compétitions traduites (Ligue Europa, total de points) dans js/sports.js', str_contains($js, "'Ligue Europa': {") && str_contains($js, "'total de points': {"));

// --- un événement de la liste existe DÉJÀ avec un pari : il ne doit pas bouger ---
$pre = null; foreach ($future as $r) if ($r[2] === 'foot') { $pre = $r; break; }
$oldE = sp_admin_save(['title' => $pre[0], 'league' => 'Ancien', 'sport' => 'foot', 'start' => $pre[3], 'opts' => [['label' => 'A', 'odd' => 1.90], ['label' => 'B', 'odd' => 1.90]]]);
$bet0 = sp_bet(load_db(), $db['users']['u_a'], 'real', 1, [['ev' => $oldE['id'], 'k' => 'o0']]);
check('pari posé sur un ancien événement du même nom', !empty($bet0['ok']));

// --- publication automatique (1re ouverture de Paris) ---
$n0 = count(sp_events());
sp_public_events();
$ev = sp_events();
$added = count($ev) - $n0;
check('publiés tout seuls à la 1re ouverture (ceux pas encore commencés, sauf le doublon)', $added === count($future) - 1, $added . ' / ' . (count($future) - 1));
$same = array_values(array_filter($ev, static fn($e) => $e['id'] === $oldE['id']))[0];
check('l’événement qui avait déjà un pari n’a pas bougé', $same['league'] === 'Ancien' && (float) $same['opts'][0]['odd'] === 1.90);
$pub = sp_public_events();
$mine = array_values(array_filter($pub, static fn($e) => in_array(sp_lower($e['title']), $titles, true) && $e['id'] !== $oldE['id']));
check('visibles par les joueurs, avec leurs logos et leurs cotes', count($mine) === $added && !array_filter($mine, static fn($e) => !array_filter($e['logos']) || !$e['open']));
$byT = []; foreach ($ev as $e) $byT[sp_lower($e['title'])] = $e;
$badEnd = array_filter($future, static fn($r) => isset($byT[sp_lower($r[0])]) && $byT[sp_lower($r[0])]['id'] !== $oldE['id'] && (int) ($byT[sp_lower($r[0])]['endAt'] ?? 0) !== (int) $r[6]);
check('heure de fin gardée (l’admin est prévenu au bon moment)', !$badEnd);
$q = array_values(array_filter($mine, static fn($e) => $e['sport'] === 'event'));
check('questions : marquées « q » et traduction anglaise envoyée', $q && $q[0]['q'] && !empty(((array) $q[0]['i18n'])['en']));
sp_public_events(); sp_public_events();
$r2 = sp_admin_seed(array_merge(sp_suggestions2(), sp_suggestions3(), sp_suggestions4()));
$r2added = $r2['added'];
check('4e série jamais ajoutée deux fois (ouvertures + bouton de l’admin)', count(array_filter(sp_events(), static fn($e) => in_array(sp_lower($e['title']), $titles, true))) === $added + 1);

// --- paris et règlement par le mécanisme existant ---
$foot = array_values(array_filter($mine, static fn($e) => $e['sport'] === 'foot'));
$bk = array_values(array_filter($mine, static fn($e) => $e['sport'] === 'basket'));
$f0 = $foot[0]; $f1 = $foot[1];
$b1 = sp_bet(load_db(), $db['users']['u_a'], 'real', 2, [['ev' => $f0['id'], 'k' => $f0['opts'][1]['k']]]); // le nul
$b2 = sp_bet(load_db(), $db['users']['u_b'], 'real', 3, [['ev' => $f0['id'], 'k' => $f0['opts'][0]['k']]]);
check('deux joueurs parient (nul / domicile)', !empty($b1['ok']) && !empty($b2['ok']));
$cq = sp_bet(load_db(), $db['users']['u_a'], 'real', 1, [['ev' => $q[0]['id'], 'k' => 'o0'], ['ev' => $f1['id'], 'k' => 'o0']]);
check('une question ne va pas dans un combiné', empty($cq['ok']) && ($cq['reason'] ?? '') === 'single');
$sq = sp_bet(load_db(), $db['users']['u_b'], 'real', 1, [['ev' => $q[0]['id'], 'k' => 'o1']]);
check('une question se joue en simple', !empty($sq['ok']));
$cb = $bk ? sp_bet(load_db(), $db['users']['u_a'], 'real', 1, [['ev' => $bk[0]['id'], 'k' => 'o0'], ['ev' => $f1['id'], 'k' => 'o2']]) : ['ok' => false];
check('combiné NBA + foot accepté', !empty($cb['ok']));
$st = sp_admin_settle(load_db(), $f0['id'], $f0['opts'][1]['k']);
check('admin : résultat « Nul » → 1 gagné, 1 perdu', !empty($st['ok']) && $st['won'] === 1 && $st['lost'] === 1, json_encode($st));
$aExp = round(100 - 1 - 2 + sp_floor2(2 * (float) $f0['opts'][1]['odd']), 2);
check('gagnant du nul payé une fois, à SA cote', abs($bal[$A] - ($aExp - 1)) < 0.011, $bal[$A] . ' / ' . ($aExp - 1));
$st2 = sp_admin_settle(load_db(), $f1['id'], 'void');
$st3 = $bk ? sp_admin_settle(load_db(), $bk[0]['id'], 'o0') : ['ok' => false];
check('match annulé + NBA gagné : combiné payé à la seule cote NBA', !empty($st2['ok']) && !empty($st3['ok']) && abs($bal[$A] - ($aExp - 1 + sp_floor2(1 * (float) $bk[0]['opts'][0]['odd']))) < 0.011, (string) $bal[$A]);
$st4 = sp_admin_settle(load_db(), $q[0]['id'], 'o0');
check('question réglée (Oui) : le « Non » perd', !empty($st4['ok']) && $st4['lost'] === 1);
check('rien n’est payé deux fois (re-règlement refusé)', empty(sp_admin_settle(load_db(), $f0['id'], $f0['opts'][0]['k'])['ok']));
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
