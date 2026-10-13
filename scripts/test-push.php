<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Test des notifications (v2607) avec un FAUX service d'envoi (rien ne part sur internet) :
 * abonnements acceptés / refusés, compteurs Android / iPhone, envoi par paquets, abonnés partis effacés,
 * filtre langue / test, journal, et vérification que soldes / connexions ne sont pas touchés.
 * Lancer : php scripts/test-push.php   (sur PC : php -d extension_dir=… -d extension=openssl scripts/test-push.php)
 */
if (!function_exists('openssl_pkey_derive')) { echo "openssl absent : relancer avec -d extension=openssl\n"; exit(1); }
$tmp = sys_get_temp_dir() . '/orolado_push_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'push_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php';
require $tmp . '/push_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' && !$ok ? "  ($d)" : '') . "\n"; }

// Faux téléphones : vraies clés P-256 (comme un navigateur).
$phone = static function (string $ep): array {
  $k = push_new_ec_key();
  return ['endpoint' => $ep, 'keys' => ['p256dh' => push_b64u_enc(push_raw_pub($k)), 'auth' => push_b64u_enc(random_bytes(16))]];
};

echo "1) Clés du site\n";
$v = push_vapid();
check('clé publique créée (65 octets)', strlen(push_b64u_dec($v['pub'])) === 65);
check('clé privée rangée dans data/push (pas dans le code)', is_file($tmp . '/data/push/vapid.json'));
$v2 = json_decode((string) file_get_contents($tmp . '/data/push/vapid.json'), true);
check('même clé à la relecture (jamais recréée)', $v2['pub'] === $v['pub']);

echo "2) Abonnements\n";
check('Android accepté', push_save_sub($phone('https://fcm.googleapis.com/fcm/send/a1'), ['plat' => 'android', 'app' => 1, 'lang' => 'fr', 'uid' => 'u1']));
check('iPhone accepté', push_save_sub($phone('https://web.push.apple.com/QAbc123'), ['plat' => 'ios', 'app' => 1, 'lang' => 'en']));
check('Firefox accepté', push_save_sub($phone('https://updates.push.services.mozilla.com/wpush/v2/x'), ['plat' => 'pc', 'lang' => 'fr']));
check('adresse d\'un site pirate refusée', !push_save_sub($phone('https://evil.example.com/steal'), ['plat' => 'pc']));
check('adresse http (non sécurisée) refusée', !push_save_sub($phone('http://fcm.googleapis.com/fcm/send/z'), ['plat' => 'pc']));
check('faux domaine « fcm.googleapis.com.evil.com » refusé', !push_save_sub($phone('https://fcm.googleapis.com.evil.com/x'), ['plat' => 'pc']));
$bad = $phone('https://fcm.googleapis.com/fcm/send/bad'); $bad['keys']['p256dh'] = 'abc';
check('clé de téléphone invalide refusée', !push_save_sub($bad, ['plat' => 'android']));
check('même téléphone réabonné = 1 seul fichier', push_save_sub($phone('https://fcm.googleapis.com/fcm/send/a1'), ['plat' => 'android', 'app' => 1, 'lang' => 'fr']) && count(push_sub_files()) === 3);
$r1 = json_decode((string) file_get_contents(push_sub_file('https://fcm.googleapis.com/fcm/send/a1')), true);
check('lien avec le compte gardé au réabonnement', ($r1['uid'] ?? '') === 'u1');

echo "3) Compteur des applis ouvertes\n";
check('appli Android signalée', push_app_ping('abcdefabcdef1234', 'android'));
check('appli iPhone signalée', push_app_ping('zzzzzzzzzzzz9999', 'ios'));
check('identifiant d\'appareil bizarre refusé', !push_app_ping('../../etc/passwd', 'android'));
check('plateforme inconnue refusée', !push_app_ping('abcdefabcdef5678', 'windows-phone'));
$s = push_stats();
check('abonnés : 3 (Android 1, iPhone 1, PC 1)', $s['subs'] === 3 && $s['android'] === 1 && $s['ios'] === 1 && $s['pc'] === 1, json_encode($s));
check('applis 7 jours : Android 1, iPhone 1', $s['apps7']['android'] === 1 && $s['apps7']['ios'] === 1);
check('langues comptées (fr 2, en 1)', ($s['langs']['fr'] ?? 0) === 2 && ($s['langs']['en'] ?? 0) === 1);

echo "4) Envoi (faux service)\n";
$got = [];
$GLOBALS['OROLADO_FAKE_PUSH'] = static function (array $r, string $body, string $auth) use (&$got): int {
  $got[] = ['ep' => $r['endpoint'], 'len' => strlen($body), 'auth' => $auth];
  if (str_contains($r['endpoint'], 'gone')) return 410;
  if (str_contains($r['endpoint'], 'down')) return 500;
  return 201;
};
$rows = array_map(static fn($f) => json_decode((string) file_get_contents($f), true), push_sub_files());
$res = push_send_rows($rows, push_payload('VOLATILITY en vogue 🔥', 'Le marché bouge fort'));
check('3 téléphones ont reçu', $res['sent'] === 3, json_encode($res));
check('message chiffré non vide et signé', count($got) === 3 && $got[0]['len'] > 100 && str_starts_with($got[0]['auth'], 'vapid t='));
// 230 abonnés dont 2 partis et 1 en panne
for ($i = 0; $i < 230; $i++) push_save_sub($phone('https://fcm.googleapis.com/fcm/send/n' . $i . ($i === 7 ? 'gone' : '') . ($i === 150 ? 'gone' : '') . ($i === 99 ? 'down' : '')), ['plat' => 'android', 'lang' => $i % 2 ? 'fr' : 'ar']);
$cursor = ''; $chunks = 0; $tot = ['sent' => 0, 'gone' => 0, 'fail' => 0];
do {
  $part = []; $more = false; $last = $cursor;
  foreach (push_sub_files() as $f) {
    $n = basename($f, '.json');
    if ($cursor !== '' && strcmp($n, $cursor) <= 0) continue;
    if (count($part) >= 100) { $more = true; break; }
    $last = $n;
    $part[] = json_decode((string) file_get_contents($f), true);
  }
  $r = push_send_rows($part, push_payload('t', 'b'));
  foreach ($tot as $k => $x) $tot[$k] += $r[$k];
  $cursor = $last; $chunks++;
} while ($more && $chunks < 10);
check('233 abonnés en 3 paquets', $chunks === 3, (string) $chunks);
check('230 reçus, 2 partis, 1 échec', $tot['sent'] === 230 && $tot['gone'] === 2 && $tot['fail'] === 1, json_encode($tot));
check('abonnés partis effacés (231 restent)', count(push_sub_files()) === 231, (string) count(push_sub_files()));
$p = json_decode(push_payload(str_repeat('é', 200), 'x', '//evil.com'), true);
check('titre coupé à 80 lettres, lien extérieur refusé', push_len($p['title']) === 80 && $p['url'] === '/');
check('émoji / arabe comptés comme 1 lettre', push_len('🔥عé') === 3);

echo "5) Journal\n";
push_log_add(['id' => 'abc123', 'title' => 'T', 'sent' => 5, 'done' => false]);
push_log_add(['id' => 'abc123', 'sent' => 9, 'done' => true]);
$l = push_log_list();
check('journal : une ligne mise à jour', count($l) === 1 && $l[0]['sent'] === 9 && $l[0]['done'] === true && $l[0]['title'] === 'T');

echo "6) Rien d'autre n'est touché\n";
check('aucun fichier de joueurs / soldes créé', !is_file($tmp . '/data/orolado.json') && !is_dir($tmp . '/data/store'));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
