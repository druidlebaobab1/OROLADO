<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2807 — 3e série de matchs / prédictions (sp_suggestions3) : nombre, marge 6 %, cotes serrées, image partout, heures de fin,
 * publiés une seule fois, jamais sur un événement qui a déjà des paris ; l'admin voit qui a gagné / perdu. Dossier temporaire.
 */
$tmp = sys_get_temp_dir() . '/orolado_pseed3_' . bin2hex(random_bytes(4));
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
foreach (['seed-2026-10.done', 'seed-2026-10b.done', 'seed-2026-10d.done', 'seed-2026-10e.done', 'draw-2026-10.done'] as $f) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $f, '1');
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $B];
save_db(orolado_data_file(), $db); $bal[$A] = 100.0; $bal[$B] = 100.0;

$list = sp_suggestions3();
$now = time();
// (2026-10-21 : une question de PRIX aux cotes du 18/10 ferme 72 h après — même règle que sp_admin_seed)
$pm3 = sp_seed_priced();
$future = array_values(array_filter($list, static fn($r) => sp_close_at(['title' => $r[0], 'league' => $r[1], 'sport' => $r[2], 'start' => $r[3], 'logos' => $r[5], 'pricedAt' => $pm3[sp_lower($r[0])] ?? $now]) >= $now + 120));
// --- la liste elle-même ---
check('au moins 40 événements dans la 3e série', count($list) >= 40, (string) count($list));
$cats = []; foreach ($list as $r) { $k = $r[2] === 'event' ? (string) ($r[5][0] ?? '') : $r[2]; $cats[$k] = ($cats[$k] ?? 0) + 1; }
echo '       catégories : ' . json_encode($cats) . "\n";
check('titres ≤ 80 caractères, compétitions ≤ 40 (jamais coupés)', !array_filter($list, static fn($r) => mb_strlen_safe($r[0]) > 80 || mb_strlen_safe($r[1]) > 40));
$titles = array_map(static fn($r) => sp_lower($r[0]), $list);
check('aucun titre en double', count($titles) === count(array_unique($titles)));
$badT = array_filter($list, static fn($r) => $r[3] < strtotime('2026-10-23 00:00 UTC') || $r[3] > strtotime('2026-11-30 23:59 UTC'));
check('dates entre le 23/10 et le 30/11/2026', !$badT, implode(' | ', array_column($badT, 0)));
$badE = array_filter($list, static fn($r) => (int) ($r[6] ?? 0) <= $r[3]);
check('chaque événement a une heure de FIN exacte, après la fermeture des paris', !$badE, implode(' | ', array_column($badE, 0)));
// marge 6 % : somme des 1/cote ≥ 1/0,94 (la maison garde au moins 6 %), et pas plus de ~7,5 %
$badM = array_filter($list, static function ($r) { $s = 0; foreach ($r[4] as $o) $s += 1 / $o[1]; return $s < 1 / 0.94 - 1e-9 || $s > 1.075; });
check('marge maison entre 6 % et 7,5 % sur chaque événement', !$badM, implode(' | ', array_column($badM, 0)));
// cotes serrées : hors foot, 2 choix entre 1,55 et 2,30 ; foot : 1 · Nul · 2 avec deux équipes proches (cotes 2,10 à 3,20)
$badC = array_filter($list, static function ($r) {
  if ($r[2] === 'foot') return count($r[4]) !== 3 || $r[4][1][0] !== 'Nul' || $r[4][0][1] < 2.10 || $r[4][0][1] > 3.20 || $r[4][2][1] < 2.10 || $r[4][2][1] > 3.20;
  return !sp_is_tight(['opts' => array_map(static fn($o) => ['odd' => $o[1]], $r[4])]) || count($r[4]) !== 2;
});
check('cotes SERRÉES partout (presque pile ou face)', !$badC, implode(' | ', array_column($badC, 0)));
// une image pour chaque événement : écusson présent dans img/teams/ ou icône dessinée connue de js/sports.js
$js = (string) file_get_contents(__DIR__ . '/../js/sports.js');
$badI = [];
foreach ($list as $r) {
  $need = $r[2] === 'event' ? 1 : 2;
  $lg = array_values(array_filter((array) $r[5]));
  $ok = count($lg) >= $need;
  foreach ($lg as $l) {
    if (str_starts_with($l, 'img/teams/')) $ok = $ok && is_file(__DIR__ . '/../' . $l) && substr((string) file_get_contents(__DIR__ . '/../' . $l), 0, 4) === "\x89PNG";
    elseif (preg_match('/^q:([a-z]+)$/', $l, $m)) $ok = $ok && (bool) preg_match('/QIMG\.' . $m[1] . ' = |\b' . $m[1] . ": '<svg/", $js) // même règle que logoHtml() de js/sports.js
      && (bool) preg_match('#\|' . $m[1] . '\||\(' . $m[1] . '\||\|' . $m[1] . '\)#', (string) file_get_contents(__DIR__ . '/../sports_lib.php')); // accepté par sp_admin_save
    else $ok = false;
  }
  if (!$ok) $badI[] = $r[0];
}
check('chaque événement a son image (écusson ou icône)', !$badI, implode(' | ', $badI));
$badL = array_filter($list, static fn($r) => $r[2] === 'event' && count(array_filter((array) ($r[7] ?? []), static fn($x) => is_string($x) && $x !== '')) < 11);
check('chaque question est traduite dans les 11 autres langues', !$badL, implode(' | ', array_column($badL, 0)));

// --- un événement de la liste existe DÉJÀ avec un pari : il ne doit pas bouger ---
$pre = null;
foreach ($future as $r) if ($r[2] === 'foot') { $pre = $r; break; }
$old = sp_admin_save(['title' => $pre[0], 'league' => 'Ancien', 'sport' => 'foot', 'start' => $pre[3], 'opts' => [['label' => 'A', 'odd' => 1.90], ['label' => 'B', 'odd' => 1.90]]]);
$bet0 = sp_bet(load_db(), $db['users']['u_a'], 'real', 1, [['ev' => $old['id'], 'k' => 'o0']]);
check('pari posé sur un ancien événement du même nom', !empty($bet0['ok']));

// --- publication automatique ---
$n0 = count(sp_events());
sp_public_events();
$ev = sp_events();
$added = count($ev) - $n0;
check('publiés tout seuls à la 1re ouverture (tous ceux pas encore commencés, sauf le doublon)', $added === count($future) - 1, $added . ' / ' . (count($future) - 1));
$same = array_values(array_filter($ev, static fn($e) => $e['id'] === $old['id']))[0];
check('l’événement qui avait déjà un pari n’a pas bougé (mêmes cotes)', $same['league'] === 'Ancien' && (float) $same['opts'][0]['odd'] === 1.90 && count($same['opts']) === 2);
check('pas de doublon de titre', count(array_filter($ev, static fn($e) => sp_lower($e['title']) === sp_lower($pre[0]))) === 1);
$pub = sp_public_events();
$mine = array_values(array_filter($pub, static fn($e) => in_array(sp_lower($e['title']), $titles, true) && $e['id'] !== $old['id']));
check('visibles par les joueurs, avec leur image', count($mine) === $added && !array_filter($mine, static fn($e) => !array_filter($e['logos'])));
$q = array_values(array_filter($mine, static fn($e) => $e['sport'] === 'event'));
check('questions : traduction anglaise envoyée au téléphone', $q && !empty(((array) $q[0]['i18n'])['en']));
// --- une seule fois ---
sp_public_events(); sp_public_events();
$r2 = sp_admin_seed(sp_suggestions3());
check('jamais ajoutés deux fois (ouvertures + bouton de l’admin)', count(sp_events()) === count($ev) && $r2['added'] === 0, json_encode($r2));

// --- l'admin voit qui a gagné et qui a perdu ---
$m = $mine[0];
$b1 = sp_bet(load_db(), $db['users']['u_a'], 'real', 2, [['ev' => $m['id'], 'k' => 'o0']]);
$b2 = sp_bet(load_db(), $db['users']['u_b'], 'real', 3, [['ev' => $m['id'], 'k' => $m['opts'][count($m['opts']) - 1]['k']]]);
check('deux joueurs parient sur des choix opposés', !empty($b1['ok']) && !empty($b2['ok']));
$l = sp_admin_event_bets($m['id']);
check('admin : liste des paris de l’événement (en attente avant le résultat)', !empty($l['ok']) && count($l['bets']) === 2 && $l['bets'][0]['r'] === '' && $l['bets'][0]['pick'] !== '');
$st = sp_admin_settle(load_db(), $m['id'], 'o0');
check('résultat donné : 1 coupon gagné, 1 perdu', !empty($st['ok']) && $st['won'] === 1 && $st['lost'] === 1, json_encode($st));
$l = sp_admin_event_bets($m['id']);
$byUid = []; foreach ($l['bets'] as $x) $byUid[$x['uid']] = $x;
check('admin : le gagnant est marqué « won » avec son gain payé', ($byUid['u_a']['r'] ?? '') === 'won' && ($byUid['u_a']['status'] ?? '') === 'won' && abs(($byUid['u_a']['win'] ?? 0) - round(2 * (float) $m['opts'][0]['odd'], 2)) < 0.011);
check('admin : le perdant est marqué « lost »', ($byUid['u_b']['r'] ?? '') === 'lost' && ($byUid['u_b']['status'] ?? '') === 'lost');
$al = array_values(array_filter(sp_admin_list(), static fn($e) => $e['id'] === $m['id']))[0];
check('admin : résumé « 1 gagnant · 1 perdant » dans la liste', ($al['res']['won'] ?? 0) === 1 && ($al['res']['lost'] ?? 0) === 1 && $al['nb'] === 2);
check('argent : gagnant payé une fois', abs($bal[$A] - round(100 - 1 - 2 + 2 * (float) $m['opts'][0]['odd'], 2)) < 0.011, (string) $bal[$A]);
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
