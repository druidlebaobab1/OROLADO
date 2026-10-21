<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Test de « E-mail à tous en arrière-plan » (mail_queue_lib.php) avec un FAUX expéditeur (aucun e-mail ne part,
 * aucun réseau) : démarrage, un e-mail par tic avec délai, pas de doublon (tics + mail_send mélangés, 2 processus),
 * pause / reprise, fin, pause automatique sur quota Brevo, tic sans envoi = rien et rapide.
 * Lancer : php scripts/test-mail-queue.php
 */
$tmp = sys_get_temp_dir() . '/orolado_mq_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'mail_queue_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
require $tmp . '/orolado_lib.php';
require $tmp . '/mail_queue_lib.php';

$fails = 0;
$ok = static function (bool $c, string $what) use (&$fails): void {
  echo ($c ? '  ok   ' : '  FAIL ') . $what . "\n";
  if (!$c) $fails++;
};
$sentLog = [];
$mode = 'ok';
$GLOBALS['OROLADO_FAKE_MAIL'] = function (string $to, string $subject, string $text) use (&$sentLog, &$mode) {
  if ($mode === 'quota') return ['ok' => false, 'reason' => 'You have exceeded your daily sending limit', 'http' => 400];
  if ($mode === 'down') return ['ok' => false, 'reason' => 'Erreur réseau Brevo'];
  $sentLog[] = [$to, $subject, $text];
  return ['ok' => true];
};
$job = static fn(): array => json_decode((string) file_get_contents($tmp . '/data/mail_job.json'), true);
$unwait = static function () use ($tmp): void { // « le délai est passé » sans attendre 6 à 9 s
  mailq_job_update(static function (?array $j) { if (!$j) return null; $j['nextAt'] = time() - 1; return $j; });
};

echo "1. Pas d'envoi : tic = rien, et rapide\n";
$t = microtime(true);
for ($i = 0; $i < 2000; $i++) $r = mail_queue_tick();
$ms = (microtime(true) - $t) * 1000;
$ok($r === 'none' && $sentLog === [], "tic sans envoi → 'none', rien envoyé");
$ok($ms < 200, sprintf('2000 tics sans envoi en %.1f ms (< 200 ms)', $ms));

echo "2. Démarrage\n";
$list = [];
for ($i = 1; $i <= 6; $i++) $list[] = "joueur$i@test.com";
$names = ['joueur1@test.com' => 'Awa Koné', 'joueur2@test.com' => 'x1'];
$st = mailq_start('fr', 'Bonjour {prenom}', "Salut {prenom},\nViens sur orolado.com", 'Ouvrir OROLADO', $list, $names);
$id = mailq_id('fr', 'Bonjour {prenom}', "Salut {prenom},\nViens sur orolado.com", 'Ouvrir OROLADO');
$ok(!empty($st['ok']) && is_file($tmp . '/data/mail_job.json'), 'mail_job.json créé');
$j = $job();
$ok($j['id'] === $id && $j['active'] === true && $j['sent'] === 0 && $j['group'] === 'fr' && count($j['list']) === 6, 'job : même id que mail_send, actif, 6 destinataires');
$st2 = mailq_start('en', 'Other', 'Other text', 'Open', $list, []);
$ok(empty($st2['ok']) && str_contains((string) $st2['reason'], 'déjà en cours'), 'un seul envoi actif à la fois (2e refusé)');

echo "3. Un e-mail par tic, délai respecté\n";
$r1 = mail_queue_tick();
$ok($r1 === 'sent' && count($sentLog) === 1 && $sentLog[0][0] === 'joueur1@test.com', '1er tic → 1 e-mail (joueur1)');
$ok($sentLog[0][1] === 'Bonjour Awa' && str_starts_with($sentLog[0][2], 'Salut Awa,'), 'prénom rempli ({prenom} → Awa)');
$r2 = mail_queue_tick();
$ok($r2 === 'wait' && count($sentLog) === 1, 'tic suivant tout de suite → attend (rien envoyé)');
$j = $job();
$gap = $j['nextAt'] - $j['lastTick'];
$ok($gap >= 6 && $gap <= 9, "délai tiré entre 6 et 9 s ($gap s)");
$log = json_decode((string) file_get_contents($tmp . '/data/mail_' . $id . '.json'), true);
$ok(($log['joueur1@test.com'] ?? null) === 1, 'journal mail_<id>.json : joueur1 = 1');

echo "4. mail_send mélangé (même journal, même verrou) : pas de doublon\n";
$r = mailq_send_logged($id, 'joueur1@test.com', 'Bonjour {prenom}', 'x', true);
$ok($r === null && count($sentLog) === 1, 'mail_send ne renvoie pas à joueur1 (déjà reçu par le tic)');
$r = mailq_send_logged($id, 'joueur2@test.com', 'Bonjour {prenom}', "Salut {prenom},\nViens sur orolado.com", true);
$ok(!empty($r['ok']) && count($sentLog) === 2 && $sentLog[1][1] === 'Bonjour', 'mail_send envoie joueur2 (prénom douteux « x1 » → vide)');
$unwait();
mail_queue_tick();
$ok(count($sentLog) === 3 && $sentLog[2][0] === 'joueur3@test.com', 'le tic saute joueur2 (fait par mail_send) → joueur3');
// Verrou tenu par « mail_send » : le tic ne fait rien (occupé), puis reprend.
$h = mailq_lock($id, true);
$unwait();
$ok(mail_queue_tick() === 'busy' && count($sentLog) === 3, 'verrou tenu ailleurs → tic « busy », rien envoyé');
mailq_unlock($h);

echo "5. Pause / reprise\n";
$s = mailq_set_active(false);
$ok($s['active'] === false && str_contains($s['reason'], 'pause'), 'pause → inactif');
$unwait();
$ok(mail_queue_tick() === 'idle' && count($sentLog) === 3, 'en pause : tic → rien');
$s = mailq_set_active(true);
$ok($s['active'] === true && $s['left'] === 3, 'reprise → actif, 3 restants');
mail_queue_tick();
$ok(count($sentLog) === 4 && $sentLog[3][0] === 'joueur4@test.com', 'reprise : joueur4 envoyé');

echo "6. Quota Brevo → pause automatique\n";
$mode = 'quota';
$unwait();
$r = mail_queue_tick();
$s = mailq_status();
$ok($r === 'paused' && $s['active'] === false && str_contains($s['reason'], 'quota') && str_contains($s['lastError'], 'joueur5'), 'quota → pause + raison + dernière erreur');
$unwait();
$ok(mail_queue_tick() === 'idle', 'plus de tentative tant que en pause');
$mode = 'ok';
mailq_set_active(true);
// joueur5 a échoué il y a < 2 min : sauté pour l'instant, joueur6 d'abord.
mail_queue_tick();
$ok(end($sentLog)[0] === 'joueur6@test.com', 'après reprise : joueur6 (joueur5 réessayé plus tard)');
$unwait();
$ok(mail_queue_tick() === 'wait' && mailq_status()['active'] === true, 'seul joueur5 reste (attente de réessai) : pas encore fini');
// Échec « vieux » de plus de 2 min → réessayé.
$log = mailq_log_read($id); $log['joueur5@test.com'] = time() - 200; mailq_log_write($id, $log);
$unwait();
mail_queue_tick();
$ok(end($sentLog)[0] === 'joueur5@test.com', 'joueur5 réessayé après 2 min → envoyé');

echo "7. Fin\n";
$unwait();
$r = mail_queue_tick();
$s = mailq_status();
$ok($r === 'finished' && $s['active'] === false && $s['finishedAt'] > 0 && $s['left'] === 0 && $s['received'] === 6, 'tous reçus → terminé (active=false, finishedAt)');
$addr = array_column($sentLog, 0);
$ok(count($addr) === 6 && count(array_unique($addr)) === 6, 'exactement 6 e-mails, aucun doublon');
$unwait();
$ok(mail_queue_tick() === 'idle' && count($sentLog) === 6, 'après la fin : tic → rien');
$st = mailq_start('fr', 'Bonjour {prenom}', "Salut {prenom},\nViens sur orolado.com", 'Ouvrir OROLADO', $list, $names);
$unwait();
mail_queue_tick();
$ok(!empty($st['ok']) && count($sentLog) === 6 && mailq_status()['active'] === false, 'relancer le même message : personne ne le reçoit 2 fois');

echo "8. Échecs d'affilée (Brevo en panne) → pause\n";
$mode = 'down';
$l2 = []; for ($i = 1; $i <= 10; $i++) $l2[] = "b$i@test.com";
mailq_start('en', 'Down', 'Down text', 'Open', $l2, []);
for ($i = 0; $i < 12; $i++) { $unwait(); mail_queue_tick(); }
$s = mailq_status();
$ok($s['active'] === false && $s['fail'] === MAILQ_MAX_CONSEC_FAIL && str_contains($s['reason'], 'échecs'), MAILQ_MAX_CONSEC_FAIL . ' échecs d’affilée → pause');
$mode = 'ok';
mailq_set_active(false);

echo "9. Deux processus en même temps : jamais deux fois la même adresse (flock)\n";
@unlink($tmp . '/data/mail_job.json');
$l3 = []; for ($i = 1; $i <= 25; $i++) $l3[] = "c$i@test.com";
mailq_start('fr', 'Concurrence', 'Texte', 'Ouvrir', $l3, []);
$child = $tmp . '/child.php';
file_put_contents($child, '<?php
declare(strict_types=1);
require ' . var_export($tmp . '/orolado_lib.php', true) . ';
require ' . var_export($tmp . '/mail_queue_lib.php', true) . ';
$GLOBALS["OROLADO_MAILQ_GAP"] = 0;
$GLOBALS["OROLADO_FAKE_MAIL"] = function (string $to) { usleep(30000); file_put_contents(' . var_export($tmp . '/sent.txt', true) . ', $to . "\n", FILE_APPEND | LOCK_EX); return ["ok" => true]; };
$end = microtime(true) + 20;
while (microtime(true) < $end) { $r = mail_queue_tick(); if ($r === "finished" || $r === "idle") break; usleep(random_int(0, 3000)); }
');
$procs = [];
for ($p = 0; $p < 3; $p++) $procs[] = proc_open([PHP_BINARY, $child], [], $pipes);
foreach ($procs as $pr) proc_close($pr);
$got = array_values(array_filter(explode("\n", (string) @file_get_contents($tmp . '/sent.txt'))));
$ok(count($got) === 25 && count(array_unique($got)) === 25, '3 processus : ' . count($got) . ' envois pour 25 adresses, ' . (count($got) - count(array_unique($got))) . ' doublon(s)');
$ok(mailq_status()['active'] === false && mailq_status()['received'] === 25, 'envoi terminé, 25 reçus');

// Nettoyage
foreach (glob($tmp . '/data/*') ?: [] as $f) @unlink($f);
foreach (glob($tmp . '/data/.*') ?: [] as $f) if (is_file($f)) @unlink($f);
foreach (glob($tmp . '/*') ?: [] as $f) if (is_file($f)) @unlink($f);
@rmdir($tmp . '/data'); @rmdir($tmp);

echo $fails === 0 ? "\nOK : file d'envoi d'e-mails en arrière-plan\n" : "\nÉCHEC : $fails test(s)\n";
exit($fails === 0 ? 0 : 1);
