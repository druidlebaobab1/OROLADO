<?php
declare(strict_types=1);

/**
 * 2026-10-22 (propriétaire) — « 🎁 Bonus à tous » en arrière-plan : relance de la chaîne d'envoi.
 * Le serveur s'appelle lui-même (http://127.0.0.1/admin.php, action bonus_all_bg + jeton secret de l'envoi).
 * data/bonus_all_job.on existe seulement pendant un envoi : sans envoi, le chien de garde ne coûte qu'un is_file().
 */
function orolado_bonus_all_marker(): string {
  return rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'bonus_all_job.on';
}

/** Lance le paquet suivant (réponse immédiate : le paquet tourne après sa propre réponse). */
function orolado_bonus_all_kick(string $token): void {
  if ($token === '' || PHP_SAPI === 'cli') return;
  $ctx = stream_context_create(['http' => [
    'method' => 'POST', 'timeout' => 3, 'ignore_errors' => true,
    'header' => "Host: orolado.com\r\nContent-Type: application/json\r\nAccept: application/json\r\n",
    'content' => json_encode(['action' => 'bonus_all_bg', 'token' => $token]),
  ]]);
  @file_get_contents('http://127.0.0.1/admin.php', false, $ctx);
}

/** Chien de garde (fin des requêtes joueurs / admin) : envoi actif mais muet depuis 60 s → relancé. */
function orolado_bonus_all_watchdog(): void {
  $mk = orolado_bonus_all_marker();
  if (!is_file($mk)) return;
  clearstatcache(true, $mk);
  if ((int) @filemtime($mk) > time() - 60) return;
  @touch($mk); // un seul relanceur par minute
  $f = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'bonus_all_job.json';
  $j = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null;
  if (!is_array($j) || empty($j['active'])) { @unlink($mk); return; }
  orolado_bonus_all_kick((string) ($j['token'] ?? ''));
}

/* 2026-11-16 (propriétaire : « le tournoi démo doit payer TOUT SEUL dès qu'il finit, sans bouton ») — paiement automatique du
   Top 50 de la semaine terminée : 1er 0,35 $ → 50e 0,10 $ (ligne droite), crédit + notification + e-mail habituels.
   Le serveur s'appelle lui-même (admin.php, action top_pay_auto + jeton secret), 10 joueurs par passage, jusqu'au bout.
   Jamais deux fois le même joueur (registre top_paid_<semaine>.json + verrou, les mêmes que le bouton de l'admin). */
const OROLADO_TOP_AUTO_MAX = 0.35;
const OROLADO_TOP_AUTO_MIN = 0.10;
function orolado_top_auto_dir(): string { return rtrim(orolado_data_dir(), '/\\'); }
function orolado_top_auto_token(): string {
  $f = orolado_top_auto_dir() . DIRECTORY_SEPARATOR . 'top_auto.token';
  $t = is_file($f) ? trim((string) @file_get_contents($f)) : '';
  if (strlen($t) < 32) { $t = bin2hex(random_bytes(24)); @file_put_contents($f, $t, LOCK_EX); @chmod($f, 0600); }
  return $t;
}
function orolado_top_auto_kick(): void {
  if (PHP_SAPI === 'cli') return;
  $ctx = stream_context_create(['http' => [
    'method' => 'POST', 'timeout' => 3, 'ignore_errors' => true,
    'header' => "Host: orolado.com\r\nContent-Type: application/json\r\nAccept: application/json\r\n",
    'content' => json_encode(['action' => 'top_pay_auto', 'token' => orolado_top_auto_token()]),
  ]]);
  @file_get_contents('http://127.0.0.1/admin.php', false, $ctx);
}
/** Fin des requêtes joueurs : la semaine précédente est terminée et pas encore entièrement payée → on lance / relance. */
function orolado_top_auto_watchdog(): void {
  if (!function_exists('orolado_top_week')) { if (!is_file(__DIR__ . '/top_lib.php')) return; require_once __DIR__ . '/top_lib.php'; }
  $now = time();
  $cur = orolado_top_week($now);
  if ($now < $cur['start'] + 600) return;                    // 10 min après la fin du tournoi (les derniers ordres sont réglés)
  $prev = orolado_top_week($now - 7 * 86400);
  $d = orolado_top_auto_dir() . DIRECTORY_SEPARATOR;
  $key = preg_replace('/[^0-9W-]/', '', $prev['key']);
  if (is_file($d . 'top_auto_' . $key . '.done')) return;   // déjà payé entièrement
  $err = $d . 'top_auto_' . $key . '.err';
  if (is_file($err) && (int) @filemtime($err) > $now - 3600) return; // erreur : nouvel essai dans 1 h
  $mk = $d . 'top_auto.kick';
  clearstatcache(true, $mk);
  if (is_file($mk) && (int) @filemtime($mk) > $now - 90) return; // un seul relanceur toutes les 90 s
  @touch($mk);
  orolado_top_auto_kick();
}
