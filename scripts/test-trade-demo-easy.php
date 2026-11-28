<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/** 2026-11-28 — « démo facile » (−30 %) en TEST pour le compte admin seulement : retour démo ≈ 130 % pour l'admin,
 *  joueur normal en démo et compte RÉEL inchangés. Fausse caisse, dossier temporaire. */
$tmp = sys_get_temp_dir() . '/orolado_easy_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'indices.json'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
$pass = 0; $fail = 0;
function ck(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
// Taux de gain mesurés sans attendre : on applique la règle à 40 000 trades « perdus / gagnés » tirés à la chance normale.
$adm = 'admin_master'; $usr = '11111111-2222-3333-4444-555555555555';
$db = ['users' => [$adm => ['id' => $adm, 'role' => 'admin', 'email' => 'admin@orolado.com'], $usr => ['id' => $usr, 'role' => 'user', 'email' => 'u@test.oro']]];
foreach (['1.9' => 0.50, '5' => 0.18, '10' => 0.09, '50' => 0.018] as $m => $p) {
  $N = 40000; $wa = 0; $wu = 0;
  for ($i = 0; $i < $N; $i++) {
    $v = (random_int(0, 1000000) / 1000000 < $p) ? 'won' : 'lost';
    if (orolado_trade_demo_easy($db, $adm, 'o' . $i . $m, (float) $m, $v) === 'won') $wa++;
    if (orolado_trade_demo_easy($db, $usr, 'o' . $i . $m, (float) $m, $v) === 'won') $wu++;
  }
  $rtpA = $wa / $N * (float) $m; $rtpU = $wu / $N * (float) $m;
  ck(sprintf('admin démo ×%s : %.1f gagnés sur 100, retour %.0f %% (voulu ≈ 130 %%)', $m, 100 * $wa / $N, 100 * $rtpA), abs($rtpA - 1.30) < ($m === '50' ? 0.16 : 0.05));
  ck(sprintf('joueur démo ×%s : %.1f gagnés sur 100 (démo normale)', $m, 100 * $wu / $N), abs($wu / $N - $p) < 0.012);
}
ck('un trade gagnant le reste toujours', orolado_trade_demo_easy($db, $adm, 'x', 1.9, 'won') === 'won');
ck('égalité (mise rendue) inchangée', orolado_trade_demo_easy($db, $adm, 'x', 1.9, 'void') === 'void');
ck('même trade → même résultat (jamais tiré deux fois)', orolado_trade_demo_easy($db, $adm, 'abc', 1.9, 'lost') === orolado_trade_demo_easy($db, $adm, 'abc', 1.9, 'lost'));
$src = file_get_contents(__DIR__ . '/../trade_lib.php');
ck('le RÉEL ne passe jamais par la démo facile', str_contains($src, "if (\$mode === 'demo' && \$verdict === 'lost') \$verdict = orolado_trade_demo_easy("));
ck('mis de côté (2026-11-28 au soir)', OROLADO_DEMO_EASY_ALL === false);
$wa = 0; $wb = 0; for ($i = 0; $i < 20000; $i++) { $v = random_int(0, 1) ? 'won' : 'lost'; if (orolado_trade_demo_easy($db, $usr, 'q' . $i, 1.9, $v, true) === 'won') $wa++; if (orolado_trade_demo_easy($db, $usr, 'q' . $i, 1.9, $v, false) === 'won') $wb++; }
ck(sprintf('téléphone de test (?demotest=1), compte joueur : %.1f gagnés sur 100', $wa / 200), abs($wa / 20000 - 0.684) < 0.02);
ck(sprintf('démo normale : %.1f gagnés sur 100', $wb / 200), abs($wb / 20000 - 0.5) < 0.02);
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
