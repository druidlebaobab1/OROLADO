<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-10-21 — 5e série (sp_suggestions5 : Ligue des champions J4 / J5) : dates UEFA, marge maison ≥ 6 %, écussons présents,
 * publiés une seule fois, pari + résultat payés une fois. Dossier temporaire, fausse caisse.
 */
$tmp = sys_get_temp_dir() . '/orolado_pseed5_' . bin2hex(random_bytes(4));
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
foreach (['seed-2026-10.done', 'seed-2026-10b.done', 'seed-2026-10c.done', 'seed-2026-10d.done', 'draw-2026-10.done', 'stale-2026-10.done', 'market-2026-10-21.done'] as $f) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $f, '1');
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $B];
save_db(orolado_data_file(), $db); $bal[$A] = 100.0; $bal[$B] = 100.0;

$list = sp_suggestions5();
check('15 à 20 événements', count($list) >= 15 && count($list) <= 20, (string) count($list));
// heures officielles UEFA : 3-4/11 et 24-25/11, 17:45 ou 20:00 UTC (18 h 45 / 21 h à Paris, heure d'hiver)
$okD = ['2026-11-03', '2026-11-04', '2026-11-24', '2026-11-25'];
$badT = array_filter($list, static fn($r) => !in_array(gmdate('Y-m-d', $r[3]), $okD, true) || !in_array(gmdate('H:i', $r[3]), ['17:45', '20:00'], true));
check('dates / heures des journées 4 et 5 (UEFA)', !$badT, implode(' | ', array_column($badT, 0)));
check('fin réelle = coup d\'envoi + 2 h', !array_filter($list, static fn($r) => $r[6] !== $r[3] + 7200));
$titles = array_map(static fn($r) => sp_lower($r[0]), $list);
check('aucun titre en double', count($titles) === count(array_unique($titles)));
$older = []; foreach ([sp_suggestions3(), sp_suggestions4()] as $l) foreach ($l as $r) $older[sp_lower($r[0])] = 1;
check('aucun match déjà dans les séries 3 / 4', !array_filter($titles, static fn($t) => isset($older[$t])));
$badM = array_filter($list, static function ($r) { $s = 0; foreach ($r[4] as $o) $s += 1 / $o[1]; return $s < 1 / 0.94 - 1e-9 || $s > 1.08; });
check('marge maison entre 6 % et 8 % (cotes jamais généreuses)', !$badM, implode(' | ', array_column($badM, 0)));
check('1 · Nul · 2 partout', !array_filter($list, static fn($r) => count($r[4]) !== 3 || $r[4][1][0] !== 'Nul'));
$badI = array_filter($list, static function ($r) { foreach ($r[5] as $l) if (!is_file(__DIR__ . '/../' . $l) || substr((string) file_get_contents(__DIR__ . '/../' . $l), 0, 4) !== "\x89PNG") return true; return count($r[5]) !== 2; });
check('deux écussons PNG présents pour chaque match', !$badI, implode(' | ', array_column($badI, 0)));
check('titres ≤ 80 caractères', !array_filter($list, static fn($r) => mb_strlen_safe($r[0]) > 80));

$n0 = count(sp_events());
$pub = sp_public_events();
$mine = array_values(array_filter($pub, static fn($e) => in_array(sp_lower($e['title']), $titles, true)));
check('publiés tout seuls à la 1re ouverture', count($mine) === count($list), count($mine) . ' / ' . count($list));
check('cotes publiées = cotes de la liste', !array_filter($mine, static function ($e) use ($list) { foreach ($list as $r) if ($r[0] === $e['title']) { foreach ($r[4] as $i => $o) if ((float) $e['opts'][$i]['odd'] !== (float) $o[1]) return true; return false; } return true; }));
sp_public_events(); sp_public_events();
$r2 = sp_admin_seed(sp_suggestions5());
check('jamais ajoutés deux fois', count(sp_events()) === $n0 + count($list) && $r2['added'] === 0, json_encode($r2));
// combiné de 2 matchs (journée 4 + journée 5), cote = produit arrondi au cent inférieur, gain payé une fois
$e1 = $mine[0]; $e2 = $mine[count($mine) - 1];
$b = sp_bet(load_db(), $db['users']['u_a'], 'real', 2, [['ev' => $e1['id'], 'k' => 'o0'], ['ev' => $e2['id'], 'k' => $e2['opts'][1]['k']]]);
$want = floor($e1['opts'][0]['odd'] * $e2['opts'][1]['odd'] * 100 + 1e-6) / 100;
check('combiné accepté, cote stockée = cotes affichées multipliées', !empty($b['ok']) && abs($b['bet']['odd'] - $want) < 1e-9, json_encode($b['bet']['odd'] ?? $b));
$b2 = sp_bet(load_db(), $db['users']['u_b'], 'real', 3, [['ev' => $e1['id'], 'k' => 'o1']]);
sp_admin_settle(load_db(), $e1['id'], 'o0');
check('1er match réglé : combiné encore en cours, perdant payé 0', ($bal[$A] === 98.0) && $bal[$B] === 97.0, $bal[$A] . ' / ' . $bal[$B]);
sp_admin_settle(load_db(), $e2['id'], $e2['opts'][1]['k']);
check('2e match réglé : gain = mise × cote + bonus, payé une fois', abs($bal[$A] - round(98 + sp_pay(2, $want, 2), 2)) < 0.001, (string) $bal[$A]);
sp_resolve(load_db());
check('re-règlement : rien payé deux fois', abs($bal[$A] - round(98 + sp_pay(2, $want, 2), 2)) < 0.001);
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
