<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2802 — le NUL revient au football (sports_lib.php sp_draw_once). Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_draw_' . bin2hex(random_bytes(4));
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
@file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10.done', '1'); @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10b.done', '1'); // pas de publication automatique pendant le test
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $B];
$db['vault']['u_a'] = ['demo' => 1000, 'real' => 100]; $db['vault']['u_b'] = ['demo' => 1000, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$A] = 100.0; $bal[$B] = 100.0;
$ua = $db['users']['u_a']; $ub = $db['users']['u_b'];
$t = time() + 3600;

echo "1) Le nul est ajouté seulement aux matchs de foot « nul = remboursé » SANS pari\n";
$mk = static fn(string $t, string $lg, string $sp, array $o) => sp_admin_save(['title' => $t, 'league' => $lg, 'sport' => $sp, 'start' => time() + 7200, 'opts' => $o])['id'];
$eA = $mk('Paris FC - Rennes', 'Ligue 1 · nul = remboursé', 'foot', [['label' => 'Paris FC', 'odd' => 1.95], ['label' => 'Rennes', 'odd' => 1.75]]);
$eB = $mk('Lens - Lille', 'Ligue 1 · nul = remboursé', 'foot', [['label' => 'Lens', 'odd' => 1.85], ['label' => 'Lille', 'odd' => 1.85]]);
$eC = $mk('Knicks - Celtics', 'NBA', 'basket', [['label' => 'Knicks', 'odd' => 1.80], ['label' => 'Celtics', 'odd' => 1.88]]);
$eD = $mk('PSG - Barça', 'Ligue des champions', 'foot', [['label' => 'PSG', 'odd' => 2.3], ['label' => 'Nul', 'odd' => 3.4], ['label' => 'Barça', 'odd' => 2.75]]);
// un joueur parie sur Lens - Lille AVANT : ce match garde sa règle « nul = remboursé »
$r = sp_bet(load_db(), $ua, 'real', 2, [['ev' => $eB, 'k' => 'o0']]);
check('pari posé sur Lens - Lille', $r['ok'] === true, json_encode($r));
@unlink(sp_dir() . DIRECTORY_SEPARATOR . 'draw-2026-10.done');
$n = sp_draw_once();
$ev = []; foreach (sp_events() as $e) $ev[$e['id']] = $e;
check('un seul match transformé', $n === 1, (string) $n);
$a = $ev[$eA];
check('Paris FC - Rennes : 3 choix 1 · Nul · 2', count($a['opts']) === 3 && $a['opts'][1]['label'] === 'Nul' && $a['opts'][1]['k'] === 'oD' && $a['opts'][0]['k'] === 'o0' && $a['opts'][2]['k'] === 'o1');
check('« nul = remboursé » retiré de la ligue', $a['league'] === 'Ligue 1', $a['league']);
$rt = 0; foreach ($a['opts'] as $o) $rt += 1 / $o['odd'];
check(sprintf('marge maison ≈ 6 %% (somme des 1/cote = %.3f)', $rt), $rt >= 1 / 0.94 - 0.001 && $rt < 1 / 0.94 + 0.03);
check('le favori reste favori', $a['opts'][2]['odd'] < $a['opts'][0]['odd']);
check('Lens - Lille (déjà parié) ne change pas', count($ev[$eB]['opts']) === 2 && strpos($ev[$eB]['league'], 'nul = remboursé') !== false);
check('NBA : pas de nul', count($ev[$eC]['opts']) === 2);
check('match déjà à 3 choix : inchangé', count($ev[$eD]['opts']) === 3 && $ev[$eD]['opts'][0]['odd'] == 2.3);
check('une seule fois (2e appel : rien)', sp_draw_once() === 0);

echo "2) On peut parier sur le Nul et il se règle comme un choix normal\n";
$r = sp_bet(load_db(), $ub, 'real', 1, [['ev' => $eA, 'k' => 'oD']]);
check('pari sur le Nul accepté', $r['ok'] === true, json_encode($r));
$odD = (float) $a['opts'][1]['odd'];
sp_admin_settle(load_db(), $eA, 'oD');
$mine = array_values(array_filter((array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []), static fn($b) => $b['uid'] === 'u_b'));
check('nul sorti : le pari Nul est gagné', ($mine[0]['status'] ?? '') === 'won' && abs((float) $mine[0]['win'] - floor($odD * 100) / 100) < 0.02, json_encode($mine[0] ?? null));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
