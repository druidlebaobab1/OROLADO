<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * RETRAITS : le vrai api.php est appelé (un processus par demande), avec une fausse caisse
 * Supabase (fichier temporaire). Vérifie qu'un retrait ne peut plus fabriquer d'argent,
 * que les comptes « u_… » passent bien par leur coffre, que deux demandes simultanées avec
 * le même code ne passent qu'une fois, et qu'un refus ne rembourse qu'une seule fois.
 */
$tmp = sys_get_temp_dir() . '/orolado_wd_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['api.php', 'orolado_lib.php', 'trade_lib.php', 'history_lib.php', 'account_lib.php', 'feed_lib.php', 'fair_table.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
require $tmp . '/orolado_lib.php';

$bankFile = $tmp . '/bank.json';
// Fausse caisse Supabase partagée entre processus (verrou fichier = comme la vraie base).
$fakeBank = <<<'R'
<?php
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) use ($tmp) {
  $fp = fopen($tmp . '/bank.json', 'c+'); flock($fp, LOCK_EX);
  $bank = json_decode(stream_get_contents($fp) ?: '{}', true) ?: [];
  $b = $body ? json_decode($body, true) : [];
  $out = [];
  if (preg_match('#/rest/v1/vaults\?user_id=eq\.([^&]+)#', $url, $m)) {
    $u = rawurldecode($m[1]);
    if ($method === 'GET') $out = isset($bank['c'][$u]) ? [['demo' => 0, 'real' => $bank['c'][$u] / 100]] : [];
    else { $bank['absWrites'] = ($bank['absWrites'] ?? 0) + 1; if (isset($b['real'])) $bank['c'][$u] = (int) round($b['real'] * 100); }
  } elseif (str_contains($url, '/rpc/debit_real')) {
    $u = $b['p_user']; $c = (int) round($b['p_amount'] * 100);
    if (($bank['c'][$u] ?? 0) < $c) $out = ['ok' => false, 'reason' => 'insufficient'];
    else { $bank['c'][$u] -= $c; $out = ['ok' => true, 'real' => $bank['c'][$u] / 100]; }
  } elseif (str_contains($url, '/rpc/resolve_trade')) {
    $u = $b['p_user']; $k = $b['p_order'];
    if (isset($bank['keys'][$k])) $out = ['ok' => true, 'duplicate' => true, 'real' => $bank['c'][$u] / 100];
    else { $bank['keys'][$k] = 1; $bank['c'][$u] = ($bank['c'][$u] ?? 0) + (int) round($b['p_amount'] * 100); $out = ['ok' => true, 'real' => $bank['c'][$u] / 100]; }
  } elseif (str_contains($url, '/rpc/credit_real')) {
    $u = $b['p_user']; $bank['c'][$u] = ($bank['c'][$u] ?? 0) + (int) round($b['p_amount'] * 100); $out = ['ok' => true];
  }
  rewind($fp); ftruncate($fp, 0); fwrite($fp, json_encode($bank)); fflush($fp); flock($fp, LOCK_UN); fclose($fp);
  return $out;
};
R;
file_put_contents($tmp . '/fakebank.php', $fakeBank);
$runner = <<<'R'
<?php
$tmp = $argv[1];
require $tmp . '/fakebank.php';
$GLOBALS['OROLADO_FAKE_MAIL'] = fn() => ['ok' => true];
$GLOBALS['OROLADO_FAKE_INPUT'] = file_get_contents($argv[2]);
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
require $tmp . '/api.php';
R;
file_put_contents($tmp . '/runner.php', $runner);

$php = PHP_BINARY;
// Windows abîme les guillemets en ligne de commande : la requête passe par un petit fichier.
$reqFile = function (array $req) use ($tmp): string { $f = $tmp . '/req_' . bin2hex(random_bytes(4)) . '.json'; file_put_contents($f, json_encode($req)); return $f; };
$call = function (array $req) use ($php, $tmp, $reqFile): array {
  $cmd = escapeshellarg($php) . ' ' . escapeshellarg($tmp . '/runner.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($reqFile($req));
  $out = shell_exec($cmd);
  $j = json_decode((string) $out, true);
  return is_array($j) ? $j : ['raw' => $out];
};
$callParallel = function (array $reqs) use ($php, $tmp, $reqFile): array {
  $procs = [];
  foreach ($reqs as $i => $req) {
    $cmd = escapeshellarg($php) . ' ' . escapeshellarg($tmp . '/runner.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($reqFile($req));
    $procs[$i] = proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes[$i]);
  }
  $res = [];
  foreach ($procs as $i => $p) {
    $out = stream_get_contents($pipes[$i][1]);
    fclose($pipes[$i][1]); fclose($pipes[$i][2]); proc_close($p);
    $res[$i] = json_decode((string) $out, true) ?: ['raw' => $out];
  }
  return $res;
};
$bank = fn() => json_decode((string) @file_get_contents($bankFile), true) ?: [];
$setBank = fn(array $b) => file_put_contents($bankFile, json_encode($b));

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$sb = 'cccccccc-1111-2222-3333-444444444444';
$db = blank_db();
// Compte « u_… » rattaché à son coffre Supabase ; le fichier annonce 5 000 $ mais la vraie caisse a 100 $.
$db['users']['u_legacy'] = ['id' => 'u_legacy', 'email' => 'wd@test.com', 'role' => 'user', 'sbId' => $sb, 'displayName' => 'Test Retrait', 'realTrades' => 10, 'realStakeVolume' => 1000];
$db['vault']['u_legacy'] = ['demo' => 0, 'real' => 5000];
$db['sessions']['tokW'] = ['userId' => 'u_legacy', 'createdAt' => date('c')];
$otp = function (array &$db) { $db['withdrawOtps']['u_legacy'] = ['codeHash' => orolado_wd_otp_hash('u_legacy', '123456'), 'expiresAt' => time() + 600, 'attempts' => 0]; };
$otp($db);
save_db(orolado_data_file(), $db);
$setBank(['c' => [$sb => 10000]]);
$wd = fn(float $amt) => ['action' => 'withdraw', 'token' => 'tokW', 'otp' => '123456', 'amount' => $amt, 'operator' => 'wave', 'destination' => '0700000000', 'beneficiary' => 'Test Retrait', 'countryCode' => '+225'];

echo "1) Plus de fabrication d'argent\n";
$r = $call($wd(4000));
check('retrait de 4 000 $ refusé (la vraie caisse n’a que 100 $, le fichier en annonçait 5 000)', empty($r['ok']) && ($r['reason'] ?? '') === 'Solde insuffisant', (string) ($r['reason'] ?? json_encode($r)));
$b = $bank();
check('caisse toujours à 100 $, jamais « remontée » au chiffre du fichier', ($b['c'][$sb] ?? 0) === 10000, (string) (($b['c'][$sb] ?? 0) / 100));
check('aucune écriture « solde = X » dans la caisse', empty($b['absWrites']), (string) ($b['absWrites'] ?? 0));

echo "2) Compte « u_… » : le retrait débite bien son coffre\n";
$r = $call($wd(40));
check('retrait de 40 $ accepté', !empty($r['ok']), (string) ($r['reason'] ?? ''));
$b = $bank();
check('coffre Supabase débité : 100 → 60 $', ($b['c'][$sb] ?? 0) === 6000, (string) (($b['c'][$sb] ?? 0) / 100));
$db = load_db();
check('fichier aligné sur la caisse (60 $)', abs((float) ($db['vault']['u_legacy']['real'] ?? 0) - 60) < 0.001, (string) ($db['vault']['u_legacy']['real'] ?? ''));
check('code consommé', !isset($db['withdrawOtps']['u_legacy']));
$r = $call($wd(10));
check('même code réutilisé : refusé', empty($r['ok']), (string) ($r['reason'] ?? ''));

echo "3) 5 demandes au même instant avec le même code\n";
with_db_lock(function ($box) use ($otp) { $otp($box->db); return ['ok' => true]; });
$rs = $callParallel(array_fill(0, 5, $wd(20)));
$okN = count(array_filter($rs, fn($x) => !empty($x['ok'])));
check('une seule acceptée', $okN === 1, $okN . ' acceptée(s)');
$b = $bank();
check('caisse : 60 → 40 $ (débitée une seule fois)', ($b['c'][$sb] ?? 0) === 4000, (string) (($b['c'][$sb] ?? 0) / 100));
$db = load_db();
check('une seule ligne de retrait ajoutée (2 au total)', count($db['withdrawals'] ?? []) === 2, (string) count($db['withdrawals'] ?? []));

echo "4) Refus d'un retrait par l'admin : remboursé une seule fois\n";
$wdId = (string) ($db['withdrawals'][0]['id'] ?? '');
// Remboursement via la fonction réelle, dans 3 processus en parallèle.
$refund = <<<'R'
<?php
$tmp = $argv[1]; $id = $argv[2];
require $tmp . '/fakebank.php';
require $tmp . '/orolado_lib.php';
$db = load_db();
foreach ($db['withdrawals'] as &$w) { if (($w['id'] ?? '') === $id) { orolado_refund_wd_once($db, $w); echo json_encode(['refunded' => !empty($w['refunded'])]); } }
R;
file_put_contents($tmp . '/refund.php', $refund);
$procs = []; $pipes = [];
for ($i = 0; $i < 3; $i++) {
  $procs[$i] = proc_open(escapeshellarg($php) . ' ' . escapeshellarg($tmp . '/refund.php') . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($wdId), [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes[$i]);
}
foreach ($procs as $i => $p) { stream_get_contents($pipes[$i][1]); fclose($pipes[$i][1]); fclose($pipes[$i][2]); proc_close($p); }
$b = $bank();
$amt = (float) ($db['withdrawals'][0]['amount'] ?? 0);
check('3 clics « Refuser » en même temps : remboursé une seule fois (+' . $amt . ' $)', ($b['c'][$sb] ?? 0) === 4000 + (int) round($amt * 100), (string) (($b['c'][$sb] ?? 0) / 100));

echo "5) Caisse injoignable : retrait refusé proprement\n";
with_db_lock(function ($box) use ($otp) { $otp($box->db); return ['ok' => true]; });
$b = $bank(); unset($b['c'][$sb]); $setBank($b);
$r = $call($wd(10));
check('refusé, sans utiliser le chiffre du fichier', empty($r['ok']), (string) ($r['reason'] ?? ''));

echo "6) v2619 — nouveaux moyens (T-Money…) et nom du compte (OPay)\n";
$setBank(['c' => [$sb => 10000]]);
with_db_lock(function ($box) use ($otp) { $otp($box->db); return ['ok' => true]; });
$r = $call(['action' => 'withdraw', 'token' => 'tokW', 'otp' => '123456', 'amount' => 10, 'operator' => 'tmoney', 'destination' => '90000000', 'beneficiary' => 'Test Retrait', 'countryCode' => '+228']);
check('retrait T-Money accepté', !empty($r['ok']), (string) ($r['reason'] ?? ''));
$db = load_db();
$last = $db['withdrawals'][0];
check('enregistré comme T-Money (pas changé en Wave)', ($last['operator'] ?? '') === 'tmoney', (string) ($last['operator'] ?? ''));
check('indicatif Togo gardé', ($last['countryCode'] ?? '') === '+228', (string) ($last['countryCode'] ?? ''));
with_db_lock(function ($box) use ($otp) { $otp($box->db); return ['ok' => true]; });
$r = $call(['action' => 'withdraw', 'token' => 'tokW', 'otp' => '123456', 'amount' => 10, 'operator' => 'opay', 'destination' => '8012345678', 'beneficiary' => 'Kouassi Jean', 'countryCode' => '+234']);
check('retrait OPay accepté', !empty($r['ok']), (string) ($r['reason'] ?? ''));
$db = load_db();
$last = $db['withdrawals'][0];
check('le nom du compte OPay arrive tel quel pour l’admin', ($last['name'] ?? '') === 'Kouassi Jean' && ($last['beneficiary'] ?? '') === 'Kouassi Jean', (string) ($last['name'] ?? ''));
foreach (['vodafone', 'mynita', 'celtiis'] as $op) {
  with_db_lock(function ($box) use ($otp) { $otp($box->db); return ['ok' => true]; });
  $r = $call(['action' => 'withdraw', 'token' => 'tokW', 'otp' => '123456', 'amount' => 5, 'operator' => $op, 'destination' => '0240000000', 'beneficiary' => 'Test Retrait', 'countryCode' => '+233']);
  $db = load_db(); $last = $db['withdrawals'][0];
  check('retrait ' . $op . ' accepté et bien nommé', !empty($r['ok']) && ($last['operator'] ?? '') === $op, (string) ($r['reason'] ?? ($last['operator'] ?? '')));
}

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
