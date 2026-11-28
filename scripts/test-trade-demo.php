<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-28 (propriétaire : « la démo à ×2,10, sur TOUS les indices, le réel ne doit pas bouger ») :
 * sur CHAQUE indice, chaque gain (×1,90 / ×5 / ×10 / ×50) et chaque durée, un trade DÉMO et un trade RÉEL sont posés ;
 * les trades de 5 s sont réglés pour de vrai. Vérifié : démo payée ×2,10 / ×5,83 / ×11,66 / ×58,33, réel ×1,90 / ×5 / ×10 / ×50,
 * même ligne gagnante en démo et en réel, crédit exact (gagné = mise × cote, égalité = mise rendue, perdu = 0).
 * Fausse caisse, dossier data/ temporaire : ne touche jamais aux vraies données. Usage : php scripts/test-trade-demo.php
 */
$tmp = sys_get_temp_dir() . '/orolado_tdemo_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'indices.json'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
$bank = ['real' => [], 'settled' => []];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bank) {
  $u = $a['p_user']; $bank['real'][$u] = $bank['real'][$u] ?? 0.0;
  if ($fn === 'debit_real') { if ($bank['real'][$u] + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient']; $bank['real'][$u] = round($bank['real'][$u] - $a['p_amount'], 2); return ['ok' => true, 'real' => $bank['real'][$u]]; }
  if ($fn === 'resolve_trade') { if (isset($bank['settled'][$a['p_order']])) return ['ok' => true, 'duplicate' => true, 'real' => $bank['real'][$u]]; $bank['settled'][$a['p_order']] = $a['p_amount']; $bank['real'][$u] = round($bank['real'][$u] + $a['p_amount'], 2); return ['ok' => true, 'real' => $bank['real'][$u]]; }
  return null;
};
$pass = 0; $fail = 0; $fails = [];
function ck(string $what, bool $ok, string $d = ''): void { global $pass, $fail, $fails; if ($ok) $pass++; else { $fail++; if (count($fails) < 30) $fails[] = $what . ($d !== '' ? " ($d)" : ''); } }
$uid = '11111111-2222-3333-4444-555555555555';
$db = blank_db();
$db['users'][$uid] = ['id' => $uid, 'email' => 'test@orolado.local', 'role' => 'user'];
$db['vault'][$uid] = ['demo' => 1000000.0, 'real' => 100000.0];
save_db(orolado_data_file(), $db);
$bank['real'][$uid] = 100000.0;
$me = $db['users'][$uid];
$DEMO = ['1.9' => 2.1, '5' => 5.83, '10' => 11.66, '50' => 58.33];
$assets = array_keys(orolado_feed_assets());
$short = []; $n = 0; $nPlaced = 0;
echo count($assets) . " indices × 4 gains × 6 durées × démo/réel\n";
foreach ($assets as $a) {
  foreach (OROLADO_MULTS as $m) {
    foreach (OROLADO_DURATIONS as $d) {
      foreach (['demo', 'real'] as $mode) {
        $side = ($n++ % 2) ? 'put' : 'call';
        $id = 'x' . $n;
        $r = orolado_trade_place($me, ['id' => $id, 'stake' => 1, 'side' => $side, 'duration' => $d, 'mode' => $mode, 'assetId' => $a, 'payout' => $m]);
        if (empty($r['ok'])) { ck("$a ×$m {$d}s $mode : posé", false, (string) ($r['reason'] ?? '')); continue; }
        $nPlaced++;
        $o = $r['order'];
        $want = $mode === 'demo' ? $DEMO[(string) (float) $m === '1.9' ? '1.9' : (string) (int) $m] : (float) $m;
        ck("$a ×$m {$d}s $mode : cote", abs((float) $o['payout'] - $want) < 0.0001, $o['payout'] . ' au lieu de ' . $want);
        $eC = (int) round((float) $o['entryPrice'] * 100); $bC = (int) round((float) $o['barrier'] * 100);
        ck("$a ×$m {$d}s $mode : même ligne qu'en réel", $bC === orolado_fair_barrier($a, $d, $side, (float) $m, $eC), "$bC");
        if ($d === 5) $short[] = [$id, $mode, (float) $m, $a];
      }
    }
  }
}
echo "$nPlaced trades posés ; attente du règlement des trades de 5 s…\n";
sleep(7);
$stat = ['demo' => ['won' => 0, 'lost' => 0, 'void' => 0], 'real' => ['won' => 0, 'lost' => 0, 'void' => 0]];
$demo0 = (float) load_db()['vault'][$uid]['demo'];
foreach ($short as [$id, $mode, $m, $a]) {
  $before = $mode === 'real' ? $bank['real'][$uid] : (float) load_db()['vault'][$uid]['demo'];
  $s = null; for ($k = 0; $k < 20; $k++) { $s = orolado_trade_settle($uid, $id); if (empty($s['pending'])) break; usleep(300000); }
  $o = $s['order'] ?? [];
  $st = (string) ($o['status'] ?? '?');
  if (!isset($stat[$mode][$st])) { ck("$a $id $mode : réglé", false, json_encode($s)); continue; }
  $stat[$mode][$st]++;
  $after = $mode === 'real' ? $bank['real'][$uid] : (float) load_db()['vault'][$uid]['demo'];
  $mult = $mode === 'demo' ? $DEMO[abs($m - 1.9) < 0.001 ? '1.9' : (string) (int) $m] : $m;
  $want = $st === 'won' ? round($mult, 2) : ($st === 'void' ? 1.0 : 0.0);
  ck("$a ×$m $mode $st : crédit exact", abs(($after - $before) - $want) < 0.0001, ($after - $before) . " au lieu de $want");
  $again = orolado_trade_settle($uid, $id);
  $after2 = $mode === 'real' ? $bank['real'][$uid] : (float) load_db()['vault'][$uid]['demo'];
  ck("$a $mode : jamais payé deux fois", abs($after2 - $after) < 0.0001);
}
foreach ($stat as $mode => $c) echo "  $mode : " . json_encode($c) . "\n";
foreach ($fails as $f) echo "  ÉCHEC $f\n";
echo "RÉSULTAT : $pass OK, $fail échec(s)\n";
