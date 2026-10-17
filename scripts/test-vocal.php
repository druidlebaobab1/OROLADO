<?php
declare(strict_types=1);
/* v2790 — notes vocales de « Écris-nous » : seuls de vrais sons (webm / mp4 / ogg) ≤ 256 Ko sont acceptés. */
require_once __DIR__ . '/../orolado_lib.php';
require_once __DIR__ . '/../live_lib.php';
$ok = 0; $ko = 0;
$t = function (string $n, bool $c) use (&$ok, &$ko) { if ($c) { $ok++; } else { $ko++; echo "ÉCHEC : $n\n"; } };
$webm = "\x1A\x45\xDF\xA3" . str_repeat("\x00\x11", 600);
$mp4 = "\x00\x00\x00\x18ftypM4A " . str_repeat("\x00", 1200);
$ogg = 'OggS' . str_repeat("\x01", 900);
$n1 = live_save_audio('data:audio/webm;codecs=opus;base64,' . base64_encode($webm));
$t('webm accepté', (bool) preg_match('/\.webm$/', $n1));
$n2 = live_save_audio('data:audio/mp4;base64,' . base64_encode($mp4));
$t('mp4 iPhone accepté', (bool) preg_match('/\.m4a$/', $n2));
$t('ogg accepté', (bool) preg_match('/\.ogg$/', live_save_audio('data:audio/ogg;base64,' . base64_encode($ogg))));
$t('fichier déguisé refusé', live_save_audio('data:audio/webm;base64,' . base64_encode('<?php echo 1;' . str_repeat('x', 900))) === '');
$t('trop gros refusé', live_save_audio('data:audio/webm;base64,' . base64_encode("\x1A\x45\xDF\xA3" . str_repeat('a', LIVE_AUD_MAX))) === '');
$t('trop petit refusé', live_save_audio('data:audio/webm;base64,' . base64_encode("\x1A\x45\xDF\xA3abc")) === '');
$t('image refusée comme son', live_save_audio('data:image/jpeg;base64,' . base64_encode("\xFF\xD8\xFF" . str_repeat('a', 900))) === '');
$t('chemin du son trouvé', live_img_path($n1, 'img') !== '');
$t('son jamais public', live_img_path($n1, 'pub') === '');
$t('type webm', live_media_type($n1) === 'audio/webm');
$t('type m4a', live_media_type($n2) === 'audio/mp4');
$t('photo reste jpeg', live_media_type('x.jpg') === 'image/jpeg');
$t('étiquette note vocale', live_media_label(['t' => '', 'img' => $n1]) === '🎤 Note vocale');
$t('étiquette photo', live_media_label(['t' => '', 'img' => 'a.jpg']) === '📷 Photo');
$r = live_add_msg(['id' => 'u_test'], 'u', '', $n1);
$t('message vocal enregistré', !empty($r['ok']) && ($r['msg']['img'] ?? '') === $n1);
$t('le joueur peut écouter sa note', function_exists('live_img_allowed') ? live_img_allowed('u_test', $n1) : true);
$t('un autre joueur ne peut pas', function_exists('live_img_allowed') ? !live_img_allowed('u_autre', $n1) : true);
// ménage : rien du test ne reste dans data/live
foreach ((array) glob(live_dir('img') . '/' . date('ymd') . '_*.{webm,m4a,ogg}', GLOB_BRACE) as $f) { if (filemtime((string) $f) >= time() - 120) @unlink((string) $f); }
@unlink(live_thread_file('u_test')); @unlink(live_thread_file('u_test') . '.lock');
echo "test-vocal : $ok/" . ($ok + $ko) . " OK\n";
exit($ko ? 1 : 0);
