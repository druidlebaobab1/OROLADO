<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/** v2636 — fichier « clients » pour Facebook : seulement les vrais déposants, bons formats, pas de doublon. */
$src = (string) file_get_contents(__DIR__ . '/../admin_lib.php');
$a = strpos($src, 'function admin_fb_export_rows');
$b = strpos($src, '/** v2632 — canal');
eval(substr($src, $a, $b - $a));

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$pmap = [
  'u1' => ['id' => 'u1', 'email' => 'Awa@Yahoo.fr', 'phone' => '0701020304', 'country' => '+225', 'role' => 'user'],
  'u2' => ['id' => 'u2', 'email' => 'moussa@gmail.com', 'phone' => '770000000', 'country' => '+221', 'role' => 'user'],
  'u3' => ['id' => 'u3', 'email' => 'tunde@gmail.com', 'phone' => '08031234567', 'country' => 'NG', 'role' => 'user'],
  'u4' => ['id' => 'u4', 'email' => 'test@orolado.local', 'phone' => '', 'country' => '', 'role' => 'user'],
  'adm' => ['id' => 'adm', 'email' => 'admin@orolado.com', 'phone' => '', 'country' => '', 'role' => 'admin'],
  'u5' => ['id' => 'u5', 'email' => 'jamais@gmail.com', 'phone' => '', 'country' => '+225', 'role' => 'user'],
];
$deps = [
  ['userId' => 'u1', 'status' => 'COMPLETED', 'operator' => 'flutterwave', 'amount' => 3],
  ['userId' => 'u1', 'status' => 'COMPLETED', 'operator' => 'oxapay', 'amount' => 10],
  ['userId' => 'u2', 'status' => 'PAID', 'operator' => 'flutterwave', 'amount' => 5],
  ['userId' => 'u3', 'status' => 'COMPLETED', 'operator' => 'flutterwave', 'amount' => 20],
  ['userId' => 'u4', 'status' => 'COMPLETED', 'operator' => 'flutterwave', 'amount' => 50],
  ['userId' => 'adm', 'status' => 'COMPLETED', 'operator' => 'flutterwave', 'amount' => 99],
  ['userId' => 'u5', 'status' => 'PENDING', 'operator' => 'flutterwave', 'amount' => 30],
  ['userId' => 'u5', 'status' => 'COMPLETED', 'operator' => 'admin', 'amount' => 30],
];
$rows = admin_fb_export_rows($deps, $pmap);
$by = []; foreach ($rows as $r) $by[$r['email'] !== '' ? $r['email'] : $r['phone']] = $r;
check('seulement les 3 vrais déposants (pas de compte test, admin, en attente, crédit admin)', count($rows) === 3, json_encode($rows));
check('Côte d\'Ivoire : e-mail en minuscules, 2250701020304, CI, total 13 $', ($by['awa@yahoo.fr']['phone'] ?? '') === '2250701020304' && $by['awa@yahoo.fr']['country'] === 'CI' && abs($by['awa@yahoo.fr']['value'] - 13) < 0.001);
check('Sénégal : 221770000000, SN', ($by['moussa@gmail.com']['phone'] ?? '') === '221770000000' && $by['moussa@gmail.com']['country'] === 'SN');
check('Nigeria : 0 de tête retiré → 2348031234567, NG', ($by['tunde@gmail.com']['phone'] ?? '') === '2348031234567' && $by['tunde@gmail.com']['country'] === 'NG');
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
