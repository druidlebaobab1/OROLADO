<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Test des notifications automatiques (notif_daily_lib.php) avec un FAUX service d'envoi (rien ne part sur internet)
 * et de fausses données Paris / Trade : créneau envoyé une seule fois (même avec un 2e processus), langue de chaque
 * appareil (déchiffrée comme le ferait le téléphone), paquets enchaînés sans doublon, thème de secours sans Paris,
 * rien sans données, au plus 2 par jour et par appareil, créneau en retard sauté, arrêt, test admin seul, abonnés partis.
 * Lancer : php scripts/test-notif-daily.php
 */
if (!function_exists('openssl_pkey_derive')) { echo "openssl absent : relancer avec -d extension=openssl\n"; exit(1); }
$tmp = sys_get_temp_dir() . '/orolado_nd_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'push_lib.php', 'notif_daily_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php';
require $tmp . '/push_lib.php';
require $tmp . '/notif_daily_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' && !$ok ? "  ($d)" : '') . "\n"; }

// Faux téléphones (vraies clés P-256) : on garde la clé privée pour DÉCHIFFRER ce qui arrive, comme le téléphone.
$keys = [];
$phone = static function (string $ep) use (&$keys): array {
  $k = push_new_ec_key(); $auth = random_bytes(16);
  $keys[$ep] = ['k' => $k, 'pub' => push_raw_pub($k), 'auth' => $auth];
  return ['endpoint' => $ep, 'keys' => ['p256dh' => push_b64u_enc(push_raw_pub($k)), 'auth' => push_b64u_enc($auth)]];
};
$decrypt = static function (string $ep, string $body) use (&$keys): ?array {
  $p = $keys[$ep] ?? null; if (!$p || strlen($body) < 86) return null;
  $salt = substr($body, 0, 16); $idl = ord($body[20]); $as = substr($body, 21, $idl); $ct = substr($body, 21 + $idl);
  $peer = push_pub_from_raw($as); $secret = openssl_pkey_derive($peer, $p['k'], 32);
  $ikm = hash_hkdf('sha256', $secret, 32, "WebPush: info\0" . $p['pub'] . $as, $p['auth']);
  $cek = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\0", $salt);
  $nonce = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\0", $salt);
  $pt = openssl_decrypt(substr($ct, 0, -16), 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, substr($ct, -16));
  return is_string($pt) ? json_decode(rtrim($pt, "\x02"), true) : null;
};

// Abonnés : 1 appareil admin (fr), 1 iPhone en, es, pt, ar (→ anglais), + 70 joueurs (fr / en / es / pt) pour les paquets
$subs = [
  'https://fcm.googleapis.com/fcm/send/admin1' => ['plat' => 'android', 'lang' => 'fr', 'test' => 1, 'admin' => 1],
  'https://web.push.apple.com/en1' => ['plat' => 'ios', 'lang' => 'en'],
  'https://fcm.googleapis.com/fcm/send/es1' => ['plat' => 'android', 'lang' => 'es'],
  'https://fcm.googleapis.com/fcm/send/pt1' => ['plat' => 'android', 'lang' => 'pt'],
  'https://fcm.googleapis.com/fcm/send/ar1' => ['plat' => 'android', 'lang' => 'ar'],
  'https://fcm.googleapis.com/fcm/send/gone1' => ['plat' => 'android', 'lang' => 'fr'],
];
$L = ['fr', 'en', 'es', 'pt'];
for ($i = 0; $i < 70; $i++) $subs['https://fcm.googleapis.com/fcm/send/p' . $i] = ['plat' => 'android', 'lang' => $L[$i % 4]];
foreach ($subs as $ep => $info) push_save_sub($phone($ep), $info);
$N = count($subs);

$got = []; // endpoint => [payloads…]
$GLOBALS['OROLADO_FAKE_PUSH'] = static function (array $r, string $body, string $auth) use (&$got, $decrypt): int {
  $ep = (string) $r['endpoint'];
  if (str_ends_with($ep, '/gone1')) return 410; // téléphone désabonné
  $got[$ep][] = $decrypt($ep, $body);
  return 201;
};
$total = static function () use (&$got): int { $n = 0; foreach ($got as $l) $n += count($l); return $n; };

// Fausses données
$D = static fn(string $ymdhi): int => (int) (new DateTimeImmutable($ymdhi, new DateTimeZone('UTC')))->getTimestamp();
$sb = static function (int $now, array $over = [], bool $live = false): array {
  $d = gmdate('Y-m-d', $now);
  $fx = [
    '1' => ['ts' => $now + 3 * 3600, 'st' => 'NS', 'lg' => 140, 'h' => [541, 'Real Madrid', ''], 'a' => [529, 'Barcelona', ''], 'o' => [['H', 2.1], ['D', 3.4], ['A', 3.2]], 'oat' => $now - 600],
    '2' => ['ts' => $now - 1800, 'st' => '1H', 'lg' => 39, 'h' => [1, 'Arsenal', ''], 'a' => [2, 'Chelsea', ''], 'o' => null],
    '3' => ['ts' => $now - 1800, 'st' => '2H', 'lg' => 39, 'h' => [3, 'A', ''], 'a' => [4, 'B', ''], 'o' => null],
    '4' => ['ts' => $now - 1800, 'st' => 'HT', 'lg' => 61, 'h' => [5, 'C', ''], 'a' => [6, 'D', ''], 'o' => null],
  ];
  if (!$live) unset($fx['2'], $fx['3'], $fx['4']); // matchs en direct seulement si demandé
  for ($i = 10; $i < 20; $i++) $fx[(string) $i] = ['ts' => $now + $i * 1200, 'st' => 'NS', 'lg' => 300, 'h' => [$i, 'H' . $i, ''], 'a' => [$i + 100, 'A' . $i, ''], 'o' => [['H', 1.9], ['D', 3.3], ['A', 4.0]], 'oat' => $now - 600];
  return array_replace_recursive(['cfg' => ['public' => true, 'live' => true, 'livePublic' => true, 'liveAll' => true],
    'days' => [$d => ['at' => $now - 300, 'lg' => ['140' => ['n' => 'La Liga', 'p' => 3], '39' => ['p' => 2], '61' => ['p' => 6], '300' => ['p' => 100]], 'fx' => $fx]], 'live' => []], $over);
};
$trade = [['id' => 'v75', 'name' => 'ZUL', 'pct' => 3.24, 'streak' => 2], ['id' => 'odin', 'name' => 'ODIN', 'pct' => -0.4, 'streak' => -6]];
$prefer = static fn(int $slotTs, int $no): string => ((intdiv($slotTs, 86400) + $no) % 2 === 0) ? 'paris' : 'trade';

// Choisir un jour où le créneau de midi préfère Paris
$day = $D('2026-10-24 00:00');
while ($prefer($day + 12 * 3600, 0) !== 'paris') $day += 86400;
$s1 = $day + 12 * 3600; $s2 = $day + 19 * 3600 + 1800;

echo "1) Avant le créneau : rien\n";
$GLOBALS['ND_NOW'] = $s1 - 3600;
$GLOBALS['ND_FAKE_SB'] = $sb($s1 - 3600); $GLOBALS['ND_FAKE_TRADE'] = $trade;
nd_tick($s1 - 3600);
check('aucun envoi avant 12:00 UTC', $total() === 0);
check('prochain créneau noté (date du fichier daily.next = 12:00 UTC)', (int) filemtime(nd_next_file()) === $s1);
check('plus rien à faire tant que l’heure n’est pas venue (un stat)', !nd_due($s1 - 60));
check('dû à 12:00', nd_due($s1));

echo "2) Créneau de midi : envoyé une fois à tous, dans la langue de chacun\n";
$now = $s1 + 300; $GLOBALS['ND_NOW'] = $now; $GLOBALS['ND_FAKE_SB'] = $sb($now);
$lk = fopen(nd_dir() . '/daily.lock', 'c'); flock($lk, LOCK_EX);
$busy = nd_tick($now);
check('2e processus pendant un envoi : il n’attend pas et n’envoie rien', !empty($busy['busy']) && $total() === 0);
flock($lk, LOCK_UN); fclose($lk);
nd_after_response(); // comme à la fin d'une requête joueur (CLI : sans fastcgi_finish_request)
check('tous les appareils (sauf parti) reçoivent exactement 1 notification', count($got) === $N - 1 && max(array_map('count', $got)) === 1, count($got) . '/' . ($N - 1));
$fr = $got['https://fcm.googleapis.com/fcm/send/admin1'][0] ?? [];
$en = $got['https://web.push.apple.com/en1'][0] ?? [];
$es = $got['https://fcm.googleapis.com/fcm/send/es1'][0] ?? [];
$pt = $got['https://fcm.googleapis.com/fcm/send/pt1'][0] ?? [];
$ar = $got['https://fcm.googleapis.com/fcm/send/ar1'][0] ?? [];
echo '       fr : ' . ($fr['title'] ?? '?') . ' | ' . ($fr['body'] ?? '?') . "\n";
echo '       en : ' . ($en['title'] ?? '?') . ' | ' . ($en['body'] ?? '?') . "\n";
echo '       es : ' . ($es['body'] ?? '?') . "\n       pt : " . ($pt['body'] ?? '?') . "\n";
check('thème Paris (créneau Paris) : grand match du jour avec les vraies cotes', ($fr['title'] ?? '') === '🔥 Real Madrid – Barcelona' && str_contains((string) ($fr['body'] ?? ''), '2,10'));
check('français : « Coup d’envoi dans 3 h »', str_contains((string) ($fr['body'] ?? ''), 'Coup d’envoi dans 3 h'));
check('anglais : « Kick-off in 3 h », cotes avec un point', str_contains((string) ($en['body'] ?? ''), 'Kick-off in 3 h') && str_contains((string) ($en['body'] ?? ''), '2.10'));
check('espagnol / portugais dans leur langue', str_contains((string) ($es['body'] ?? ''), 'Comienza en') && str_contains((string) ($pt['body'] ?? ''), 'Começa em'));
check('langue non traduite (arabe) → anglais', ($ar['body'] ?? '') === ($en['body'] ?? '-'));
check('le toucher ouvre Paris (/?paris=1)', ($fr['url'] ?? '') === '/?paris=1');
check('abonné parti (410) effacé', !is_file(push_sub_file('https://fcm.googleapis.com/fcm/send/gone1')));
$st = nd_state();
check('journal : dernier envoi noté (reçus, partis, fini)', ($st['last']['sent'] ?? 0) === $N - 1 && ($st['last']['gone'] ?? 0) === 1 && !empty($st['last']['done']), json_encode($st['last'] ?? null));
check('envoi fini : plus de marqueur d’envoi', !is_file(nd_job_marker()));

echo "3) Jamais deux fois le même créneau\n";
$before = $total();
for ($i = 0; $i < 5; $i++) { nd_tick($now + 60 * $i); nd_after_response(); }
check('5 passages de plus (requêtes suivantes) : rien de nouveau', $total() === $before);
check('prochain créneau = 19:30 UTC', (int) filemtime(nd_next_file()) === $s2);

echo "4) Paquets enchaînés (une requête = un paquet) sans doublon\n";
$got = [];
$now = $s2 + 120; $GLOBALS['ND_NOW'] = $now; $GLOBALS['ND_FAKE_SB'] = $sb($now);
$ticks = 0;
do { $r = nd_tick($now, 0.0); $ticks++; } while (is_file(nd_job_marker()) && $ticks < 50);
check('plusieurs requêtes ont fini l’envoi (' . $ticks . ' passages)', $ticks >= 3 && !is_file(nd_job_marker()));
check('chaque appareil : exactement 1 notification', count($got) === $N - 1 && max(array_map('count', $got)) === 1, count($got) . ' appareils');
$fr2 = $got['https://fcm.googleapis.com/fcm/send/admin1'][0] ?? [];
echo '       fr : ' . ($fr2['title'] ?? '?') . ' | ' . ($fr2['body'] ?? '?') . "\n";
check('créneau du soir = l’autre thème (Trade) : ZUL +3,2 % en 6 h, ouvre le trading', ($fr2['title'] ?? '') === "📈 ZUL +3,2\u{202F}% en 6 h" && ($fr2['url'] ?? '') === '/?trade=1', (string) ($fr2['title'] ?? ''));

echo "5) Au plus 2 par jour et par appareil\n";
$all = [];
foreach ([$day, $day + 86400] as $dd) {
  $got = [];
  for ($t = $dd; $t < $dd + 86400; $t += 300) { $GLOBALS['ND_NOW'] = $t; $GLOBALS['ND_FAKE_SB'] = $sb($t); nd_tick($t); }
  $all[] = $got;
}
$mx = 0; foreach ($all as $g) foreach ($g as $l) $mx = max($mx, count($l));
check('une journée entière de requêtes toutes les 5 min : jamais plus de 2 par appareil', $mx <= 2, (string) $mx);
check('le lendemain : 2 notifications par appareil', count($all[1]) === $N - 1 && min(array_map('count', $all[1])) === 2);
$s = nd_state(); $d3 = gmdate('Y-m-d', $day + 2 * 86400);
$s['slots'][$d3 . '#x'] = ['st' => 'sent']; $s['slots'][$d3 . '#y'] = ['st' => 'sent']; nd_state_save($s);
$got = []; $t = $day + 2 * 86400 + 12 * 3600 + 60; $GLOBALS['ND_NOW'] = $t; nd_tick($t);
check('déjà 2 envois ce jour-là : le créneau est refusé (plafond)', $got === [] && (nd_state()['slots'][$d3 . '#1']['st'] ?? '') === 'cap');

echo "6) Sans données Paris : Trade ; sans aucune donnée : rien\n";
$d4 = $day + 4 * 86400; $sl = $d4 + 12 * 3600; $no = 0;
if ($prefer($sl, 0) !== 'paris') { $sl = $d4 + 19 * 3600 + 1800; $no = 1; }
for ($t = $d4 - 86400; $t < $sl; $t += 3600) { $GLOBALS['ND_NOW'] = $t; nd_tick($t); } // jours sautés sans envoi intéressant
$got = []; $GLOBALS['ND_NOW'] = $sl + 60;
$GLOBALS['ND_FAKE_SB'] = ['cfg' => ['public' => true, 'live' => true, 'livePublic' => true], 'days' => [], 'live' => []];
nd_tick($sl + 60);
$m = $got['https://web.push.apple.com/en1'][0] ?? [];
echo '       en : ' . ($m['title'] ?? '?') . ' | ' . ($m['body'] ?? '?') . "\n";
check('créneau Paris sans matchs : notification Trade à la place', str_starts_with((string) ($m['title'] ?? ''), '📈 ZUL') || str_starts_with((string) ($m['title'] ?? ''), '📉 ODIN'), (string) ($m['title'] ?? ''));
$old = $sb($sl); $old['days'][gmdate('Y-m-d', $sl)]['at'] = $sl - 7 * 3600; $GLOBALS['ND_FAKE_SB'] = $old; $tmpSnap = [];
check('index des matchs de plus de 6 h : ignoré (jamais de vieux chiffres)', nd_paris_candidates($sl, $tmpSnap) === []);
$GLOBALS['ND_FAKE_SB'] = ['cfg' => ['public' => false]]; $tmpSnap = [];
check('Paris fermé au public : pas de notification Paris', nd_paris_candidates($sl, $tmpSnap) === []);
$GLOBALS['ND_FAKE_SB'] = ['cfg' => null]; $GLOBALS['ND_FAKE_TRADE'] = [['id' => 'x', 'name' => 'X', 'pct' => 0.3, 'streak' => 1]];
$got = []; $nx = nd_next_slot($sl + 60); $GLOBALS['ND_NOW'] = $nx[0] + 60; nd_tick($nx[0] + 60);
check('aucune donnée intéressante : rien n’est envoyé', $got === []);
check('créneau noté « pas de données »', (nd_state()['slots'][$nx[1]]['st'] ?? '') === 'nodata');

echo "7) Créneau en retard / arrêt\n";
$GLOBALS['ND_FAKE_SB'] = $sb($sl); $GLOBALS['ND_FAKE_TRADE'] = $trade;
$d6 = $day + 6 * 86400; $got = [];
for ($t = $d6 - 86400 + 20 * 3600; $t < $d6; $t += 3600) { $GLOBALS['ND_NOW'] = $t; nd_tick($t); }
$got = []; $t = $d6 + 12 * 3600 + 4 * 3600; $GLOBALS['ND_NOW'] = $t; nd_tick($t); // aucune visite de 12:00 à 16:00
check('aucune visite pendant 4 h : le créneau de midi est sauté (pas envoyé en retard)', $got === [] && (nd_state()['slots'][gmdate('Y-m-d', $d6) . '#1']['st'] ?? '') === 'late');
$i = nd_set_on(false);
check('arrêt depuis l’admin', $i['on'] === false);
$t = $d6 + 19 * 3600 + 1800 + 60; $GLOBALS['ND_NOW'] = $t; nd_tick($t);
check('éteintes : rien ne part', $got === [] && (nd_state()['slots'][gmdate('Y-m-d', $d6) . '#2']['st'] ?? '') === 'off');
check('rallumées', nd_set_on(true)['on'] === true);

echo "8) Test admin : seulement les appareils admin, ne compte pas comme un créneau\n";
$got = []; $before = nd_state()['slots'];
$GLOBALS['ND_NOW'] = $t; $GLOBALS['ND_FAKE_SB'] = $sb($t);
$r = nd_test_admin();
echo '       ' . ($r['title'] ?? '?') . ' | ' . ($r['body'] ?? '?') . "\n";
check('envoyé au seul appareil admin', !empty($r['ok']) && array_keys($got) === ['https://fcm.googleapis.com/fcm/send/admin1'], json_encode(array_keys($got)));
check('aucun créneau réservé ni changé', nd_state()['slots'] === $before);
check('test noté pour l’admin', (nd_state()['test']['sent'] ?? 0) === 1);
$info = nd_info();
check('infos admin : prochain créneau + dernier envoi', $info['ok'] && $info['next']['at'] > $t && is_array($info['last']));

echo "9) Textes\n";
$tmpSnap = []; $lv = nd_paris_candidates($t, $tmpSnap); $GLOBALS['ND_FAKE_SB'] = $sb($t, [], true); $lv = nd_paris_candidates($t, $tmpSnap);
check('matchs en direct comptés (3) et passés en premier', ($lv[0]['kind'] ?? '') === 'live' && ($lv[0]['n'] ?? 0) === 3, json_encode($lv[0] ?? null));
$GLOBALS['ND_FAKE_SB'] = $sb($t, ['live' => ['fat' => $t - 30, 'fx' => [['st' => '1H', 'lg' => 1], ['st' => '2H', 'lg' => 1], ['st' => 'HT', 'lg' => 2], ['st' => 'FT', 'lg' => 2], ['st' => 'ET', 'lg' => 3]]]]); $lv = nd_paris_candidates($t, $tmpSnap);
check('direct lu dans live.json quand il est frais (4 en cours, le match fini ne compte pas)', ($lv[0]['kind'] ?? '') === 'live' && ($lv[0]['n'] ?? 0) === 4, json_encode($lv[0] ?? null));
$GLOBALS['ND_FAKE_SB'] = $sb($t, ['cfg' => ['livePublic' => false]], true); $lv = nd_paris_candidates($t, $tmpSnap);
check('direct fermé au public : pas de notification « en direct »', ($lv[0]['kind'] ?? '') !== 'live');
$GLOBALS['ND_FAKE_SB'] = $sb($t); $lv = nd_paris_candidates($t, $tmpSnap); $cnt = null; foreach ($lv as $c) if ($c['kind'] === 'count') $cnt = $c;
check('nombre de matchs avec cotes dans les 12 h (11)', $cnt && $cnt['n'] === 11, json_encode($cnt));
$c = ['kind' => 'live', 'n' => 15];
check('direct : « 🔴 15 matchs en direct »', nd_text($c, 'fr')[0] === '🔴 15 matchs en direct');
check('compte : « ⚽ 152 matchs à parier »', nd_text(['kind' => 'count', 'n' => 152], 'fr')[0] === '⚽ 152 matchs à parier');
check('série : « 📉 ODIN : 6 heures de baisse d’affilée »', nd_text(['kind' => 'streak', 'name' => 'ODIN', 'n' => -6], 'fr')[0] === '📉 ODIN : 6 heures de baisse d’affilée');
check('cote : « Arsenal passe de 2,10 à 1,75 »', str_contains(nd_text(['kind' => 'odds', 'h' => 'Arsenal', 'a' => 'Chelsea', 'team' => 'Arsenal', 'from' => 2.1, 'to' => 1.75], 'fr')[1], 'Arsenal passe de 2,10 à 1,75'));
check('baisse en anglais : « 📉 ZUL −4.0% in 6 h »', nd_text(['kind' => 'move', 'name' => 'ZUL', 'pct' => -4.0], 'en')[0] === '📉 ZUL −4.0% in 6 h');
$long = nd_text(['kind' => 'big', 'h' => str_repeat('Borussia Mönchengladbach ', 2), 'a' => 'Bayer Leverkusen', 'in' => 9000, 'o' => ['H' => 2, 'D' => 3, 'A' => 4]], 'pt');
check('titres et messages courts (≤ 80 / 120 lettres)', push_len(push_cut($long[0], 80)) <= 80 && push_len($long[1]) <= 120);

echo "10) Cote en mouvement (photo des cotes du créneau précédent)\n";
$snap = []; $t0 = $d6 + 3 * 86400; $GLOBALS['ND_FAKE_SB'] = $sb($t0);
nd_paris_candidates($t0, $snap);
$sbB = $sb($t0 + 7 * 3600); $dB = gmdate('Y-m-d', $t0 + 7 * 3600);
$sbB['days'][$dB]['fx']['1']['ts'] = $t0 + 3 * 3600 + 7 * 3600 + 3600; // même match, plus tard dans la journée
$sbB['days'][$dB]['fx']['1']['o'] = [['H', 1.75], ['D', 3.6], ['A', 3.3]];
$GLOBALS['ND_FAKE_SB'] = $sbB;
$cands = nd_paris_candidates($t0 + 7 * 3600, $snap);
$odd = null; foreach ($cands as $c) if ($c['kind'] === 'odds') $odd = $c;
check('cote de Real Madrid 2,10 → 1,75 repérée', $odd && $odd['team'] === 'Real Madrid' && abs($odd['from'] - 2.1) < 1e-9 && abs($odd['to'] - 1.75) < 1e-9, json_encode($odd));
if ($odd) echo '       fr : ' . implode(' | ', nd_text($odd, 'fr')) . "\n";

// ménage
$rm = static function (string $d) use (&$rm): void { foreach (glob($d . '/{,.}[!.,!..]*', GLOB_BRACE) ?: [] as $f) is_dir($f) ? $rm($f) : @unlink($f); @rmdir($d); };
$rm($tmp);
echo "\n" . ($fail === 0 ? "OK : $pass vérifications" : "ÉCHEC : $fail sur " . ($pass + $fail)) . "\n";
exit($fail === 0 ? 0 : 1);
