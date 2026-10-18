<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2690 — Casino (casino_lib.php) : chaque jeu rend MOINS que la mise sur la durée (maison gagnante), les dessins
 * correspondent toujours au gain, l'argent bouge une seule fois, on ne peut pas tricher (rejouer, voir la mine,
 * encaisser après l'explosion, partie gratuite). Fausse caisse, dossier temporaire : rien ne part en ligne.
 */
$tmp = sys_get_temp_dir() . '/orolado_casino_' . bin2hex(random_bytes(4));
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
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? "  OK   " : "  ÉCHEC ") . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

echo "Sky Rush / Jet Man / Rocket (v2795) : historique public du tour commun\n";
foreach (['crash', 'jet', 'rocket'] as $gm) {
  @unlink(casino_round_file($gm));
  $t = 5000.0; $rr = []; casino_round_advance($rr, $t);
  $seen = [];
  for ($k = 0; $k < 30; $k++) { $seen[] = (float) $rr['c']; casino_round_advance($rr, (float) $rr['end'] + 0.001); }
  $want = array_slice(array_reverse($seen), 0, 24);
  check("$gm : historique = 24 derniers points d'explosion, du plus récent au plus ancien", ($rr['h'] ?? null) === $want, json_encode(array_slice($rr['h'] ?? [], 0, 4)));
  check("$gm : le tour EN COURS n'est jamais dans l'historique", !in_array('c', array_keys($rr['h'] ?? []), true) && count($rr['h']) === 24);
  // public : l'historique est vu par tout le monde, le point du tour en cours reste caché pendant la mise et le vol
  $now = microtime(true);
  $p0 = casino_round_public($gm, $now);
  check("$gm : nouveau fichier, historique vide au départ", $p0['h'] === [] && !isset($p0['c']), json_encode($p0));
  $s = casino_round_slot($gm, $now);
  $end = $s['t0'] + casino_crash_secs($s['c']) + CASINO_ROUND_SHOW + 0.01;
  $p1 = casino_round_public($gm, $end);
  check("$gm : au tour suivant, l'historique montre le point du tour fini", ($p1['h'][0] ?? null) === (float) $s['c'] && $p1['phase'] === 'bet' && !isset($p1['c']), json_encode($p1));
  $p2 = casino_round_public($gm, $p1['t0'] + 0.001);
  check("$gm : pendant le vol, rien de secret ne fuit (pas de c, pas de nc)", !isset($p2['c']) && !isset($p2['nc']) || $p2['phase'] === 'end');
  @unlink(casino_round_file($gm));
}
$N = 20000; $w = 0; $rr = []; casino_round_advance($rr, 1000.0);
for ($k = 0; $k < $N; $k++) { if ($rr['c'] >= 2) $w++; casino_round_advance($rr, (float) $rr['end'] + 0.001); }
check('loi des points d\'explosion inchangée (≥ ×2 : ~47 %, RTP 94 %)', abs($w / $N - 0.47) < 0.02, (string) round($w / $N, 3));
foreach ([1.5, 2, 5, 10] as $x) { $win = 0; for ($i = 0; $i < 100000; $i++) if (casino_crash_point() >= $x) $win++; $ev = $win / 100000 * $x; check("encaisser à ×$x : retour " . round($ev * 100, 1) . ' %', $ev < ($x > 4 ? 0.985 : 0.96) && $ev > ($x > 4 ? 0.895 : 0.92)); }

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
