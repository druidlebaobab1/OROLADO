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
