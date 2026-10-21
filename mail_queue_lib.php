<?php
declare(strict_types=1);

/**
 * v3000 (propriétaire) — « E-mail à tous » EN ARRIÈRE-PLAN : l'admin colle le message, clique, peut FERMER la page.
 * Le serveur envoie ensuite LENTEMENT (1 e-mail toutes les 6 à 9 s au plus, pour ne pas être classé spam),
 * un e-mail par « tic », le tic tournant APRÈS la réponse des requêtes des joueurs (api.php) et de l'admin (admin.php).
 *
 * Fichiers (dans data/) :
 *  - mail_job.json      : l'envoi en cours (un seul à la fois) ; liste des destinataires figée au départ.
 *  - mail_<id>.json     : journal par message (MÊME fichier que « Envoyer à tous » page ouverte) : 1 = reçu, heure = échec.
 *  - mail_<id>.lock     : verrou d'envoi (tic + mail_send) : jamais deux envois vers la même adresse.
 *  - mail_job.lock      : verrou court pour lire-modifier-écrire mail_job.json.
 *
 * Ce fichier ne dépend que de orolado_lib.php (brevo_send_smtp, brevo_env, orolado_data_dir) : il peut être chargé
 * par api.php (côté joueurs) sans admin_lib.php.
 */

/** Essais maximum par adresse dans un envoi en arrière-plan (au-delà : adresse laissée de côté). */
const MAILQ_MAX_TRIES = 3;
/** Échecs d'affilée avant de mettre l'envoi en pause (clé Brevo absente, réseau coupé…). */
const MAILQ_MAX_CONSEC_FAIL = 8;

function mailq_dir(): string {
  return rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR;
}

function mailq_job_file(): string {
  return mailq_dir() . 'mail_job.json';
}

/** Même règle que mail_send : id donné par la page (s'il est valide), sinon empreinte du groupe + objet + texte + bouton. */
function mailq_id(string $group, string $subject, string $msg, string $btn, string $reqId = ''): string {
  return preg_match('/^[a-z0-9]{6,24}$/', $reqId) ? $reqId : 'm' . substr(sha1($group . "\n" . $subject . "\n" . $msg . "\n" . $btn), 0, 16);
}

function mailq_log_file(string $id): string {
  return mailq_dir() . 'mail_' . $id . '.json';
}

function mailq_log_read(string $id): array {
  $f = mailq_log_file($id);
  if (!is_file($f)) return [];
  $d = json_decode((string) @file_get_contents($f), true);
  return is_array($d) ? $d : [];
}

function mailq_log_write(string $id, array $done): void {
  @file_put_contents(mailq_log_file($id), json_encode($done), LOCK_EX);
}

/** 1 = reçu ; sinon heure de l'échec (réessayé plus tard, pas dans les 2 minutes). Identique à mail_send. */
function mailq_skip($v): bool {
  return $v === 1 || (is_int($v) && $v > time() - 120);
}

/** Verrou d'envoi d'un message (partagé par le tic et mail_send). Renvoie la ressource, ou null si occupé (non bloquant). */
function mailq_lock(string $id, bool $block) {
  $h = @fopen(mailq_dir() . 'mail_' . $id . '.lock', 'c');
  if ($h === false) return null;
  if (!flock($h, $block ? LOCK_EX : (LOCK_EX | LOCK_NB))) { fclose($h); return null; }
  return $h;
}

function mailq_unlock($h): void {
  if (is_resource($h)) { flock($h, LOCK_UN); fclose($h); }
}

/**
 * Envoie UN e-mail sous verrou : relit le journal, saute l'adresse si elle est déjà faite (par l'autre chemin),
 * envoie, note aussitôt. Renvoie null si sauté (déjà fait ou verrou occupé en mode non bloquant), sinon le résultat d'envoi.
 */
function mailq_send_logged(string $id, string $em, string $subject, string $msg, bool $block = true): ?array {
  $h = mailq_lock($id, $block);
  if ($h === null) return null;
  try {
    $done = mailq_log_read($id);
    if (isset($done[$em]) && mailq_skip($done[$em])) return null;
    $r = admin_mail_plain($em, $subject, $msg);
    $done = mailq_log_read($id); // relu : rien d'autre n'écrit sans le verrou, mais par prudence
    $done[$em] = !empty($r['ok']) ? 1 : time();
    mailq_log_write($id, $done);
    return $r;
  } finally {
    mailq_unlock($h);
  }
}

/** v2668 — prénom du joueur pour « {prenom} » : premier mot du nom, seulement s'il ressemble à un vrai prénom. */
function admin_mail_first_name(string $em): string {
  $n = trim((string) ($GLOBALS['OROLADO_MAIL_NAMES'][strtolower(trim($em))] ?? ''));
  $w = (string) (preg_split('/[\s._\-]+/u', $n)[0] ?? '');
  if (!preg_match('/^\p{L}{2,20}$/u', $w)) return '';
  return mb_strtoupper(mb_substr($w, 0, 1)) . mb_strtolower(mb_substr($w, 1));
}

/**
 * v2668 — e-mail SIMPLE, comme écrit par une personne (propriétaire : arriver dans « Principale », pas « Promotions ») :
 * texte seul (pas de design, pas de bouton, pas de pixel ni de lien suivi), prénom du joueur à la place de {prenom}.
 */
function admin_mail_plain(string $to, string $subject, string $msg): array {
  $first = admin_mail_first_name($to);
  // {prenom}, (prenom) ou [prenom], avec ou sans accent : tous remplacés.
  $fill = static fn(string $s): string => (string) preg_replace('/(\s*)[\{\(\[]\s*pr[eé]nom\s*[\}\)\]]/iu', $first !== '' ? '$1' . $first : '', $s);
  $text = str_replace("\r\n", "\n", $fill($msg)) . "\n";
  $subject = $fill($subject);
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_MAIL']) && is_callable($GLOBALS['OROLADO_FAKE_MAIL'])) return ($GLOBALS['OROLADO_FAKE_MAIL'])($to, $subject, $text);
  return brevo_send_smtp([
    'sender' => ['email' => brevo_env('BREVO_SENDER_EMAIL', 'contact@mail.orolado.com'), 'name' => 'OROLADO'],
    'to' => [['email' => $to, 'name' => $first !== '' ? $first : $to]],
    'subject' => $subject,
    'textContent' => $text,
    'replyTo' => ['email' => 'support@orolado.com', 'name' => 'OROLADO'],
  ]);
}

/** Erreur Brevo de quota / limite (crédits épuisés, trop de requêtes) : on met en pause au lieu d'insister. */
function mailq_is_quota_error(array $r): bool {
  $http = (int) ($r['http'] ?? 0);
  if ($http === 429 || $http === 402) return true;
  return (bool) preg_match('/quota|limit|credit|exceed|too many|not enough|insufficient|daily/i', (string) ($r['reason'] ?? ''));
}

function mailq_job_read(): ?array {
  $f = mailq_job_file();
  if (!is_file($f)) return null;
  $j = json_decode((string) @file_get_contents($f), true);
  return is_array($j) && isset($j['id']) ? $j : null;
}

/** Lire-modifier-écrire mail_job.json sous un verrou court. $fn reçoit le job (ou null) et renvoie le nouveau job (ou null = ne rien écrire). */
function mailq_job_update(callable $fn): ?array {
  $h = @fopen(mailq_dir() . 'mail_job.lock', 'c');
  if ($h !== false) flock($h, LOCK_EX);
  try {
    $job = mailq_job_read();
    $new = $fn($job);
    if (is_array($new)) {
      $tmp = mailq_job_file() . '.tmp' . getmypid();
      if (@file_put_contents($tmp, json_encode($new, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) !== false) @rename($tmp, mailq_job_file());
      // Petit fichier lu à chaque tic (évite de relire toute la liste à chaque requête) : « off » ou l'heure du prochain envoi.
      @file_put_contents(mailq_dir() . 'mail_job.next', !empty($new['active']) ? (string) (int) ($new['nextAt'] ?? 0) : 'off', LOCK_EX);
      return $new;
    }
    return $job;
  } finally {
    if ($h !== false) { flock($h, LOCK_UN); fclose($h); }
  }
}

/** Prochain destinataire (ni reçu, ni en attente de réessai, ni abandonné après 3 essais), ou '' si fini. */
function mailq_next(array $job, array $done): string {
  $tries = (array) ($job['tries'] ?? []);
  foreach ((array) ($job['list'] ?? []) as $em) {
    if (isset($done[$em]) && mailq_skip($done[$em])) continue;
    if ((int) ($tries[$em] ?? 0) >= MAILQ_MAX_TRIES) continue;
    return (string) $em;
  }
  return '';
}

/** Restants : pas reçus et encore à essayer (y compris ceux en attente de réessai de 2 min). */
function mailq_left(array $job, array $done): int {
  $tries = (array) ($job['tries'] ?? []);
  $n = 0;
  foreach ((array) ($job['list'] ?? []) as $em) {
    if (($done[$em] ?? null) === 1) continue;
    if ((int) ($tries[$em] ?? 0) >= MAILQ_MAX_TRIES) continue;
    $n++;
  }
  return $n;
}

/**
 * Démarre l'envoi en arrière-plan. $list = adresses du groupe (admin_mail_groups()[$group]), $names = prénoms.
 * Refusé si un envoi est déjà actif (on renvoie alors son état).
 */
function mailq_start(string $group, string $subject, string $msg, string $btn, array $list, array $names): array {
  $id = mailq_id($group, $subject, $msg, $btn);
  $refused = null;
  mailq_job_update(static function (?array $job) use ($id, $group, $subject, $msg, $btn, $list, $names, &$refused) {
    if ($job && !empty($job['active'])) { $refused = $job; return null; }
    $same = $job && (string) $job['id'] === $id;
    $nm = [];
    foreach ($list as $em) { $k = (string) ($names[$em] ?? ''); if ($k !== '') $nm[$em] = $k; }
    return [
      'id' => $id, 'group' => $group, 'subject' => $subject, 'message' => $msg, 'button' => $btn,
      'active' => true, 'startedAt' => time(), 'lastTick' => 0, 'nextAt' => 0,
      'sent' => $same ? (int) ($job['sent'] ?? 0) : 0, 'fail' => $same ? (int) ($job['fail'] ?? 0) : 0,
      'consecFail' => 0, 'tries' => $same ? (array) ($job['tries'] ?? []) : [],
      'lastError' => '', 'reason' => '', 'finishedAt' => 0,
      'list' => array_values($list), 'names' => $nm,
    ];
  });
  if ($refused) return ['ok' => false, 'reason' => 'Un envoi en arrière-plan est déjà en cours (« ' . (string) ($refused['subject'] ?? '') . ' ») : mettez-le en pause d’abord.', 'status' => mailq_status()];
  return ['ok' => true, 'status' => mailq_status()];
}

function mailq_status(): array {
  $job = mailq_job_read();
  if (!$job) return ['job' => false];
  $done = mailq_log_read((string) $job['id']);
  $list = (array) ($job['list'] ?? []);
  $received = 0;
  foreach ($list as $em) if (($done[$em] ?? null) === 1) $received++;
  $left = mailq_left($job, $done);
  $elapsed = max(1, (int) ($job['lastTick'] ?? 0) - (int) ($job['startedAt'] ?? 0));
  $sent = (int) ($job['sent'] ?? 0);
  return [
    'job' => true, 'id' => (string) $job['id'], 'group' => (string) $job['group'], 'subject' => (string) $job['subject'],
    'active' => !empty($job['active']), 'total' => count($list), 'received' => $received, 'sent' => $sent,
    'fail' => (int) ($job['fail'] ?? 0), 'left' => $left,
    'perHour' => $sent >= 5 ? (int) round($sent * 3600 / $elapsed) : 0,
    'lastError' => (string) ($job['lastError'] ?? ''), 'reason' => (string) ($job['reason'] ?? ''),
    'startedAt' => (int) ($job['startedAt'] ?? 0), 'lastTick' => (int) ($job['lastTick'] ?? 0), 'finishedAt' => (int) ($job['finishedAt'] ?? 0),
  ];
}

function mailq_set_active(bool $on): array {
  mailq_job_update(static function (?array $job) use ($on) {
    if (!$job) return null;
    $job['active'] = $on;
    if ($on) { $job['reason'] = ''; $job['nextAt'] = 0; $job['consecFail'] = 0; $job['finishedAt'] = 0; }
    else $job['reason'] = 'Mis en pause par l’admin.';
    return $job;
  });
  return mailq_status();
}

/**
 * UN tic : coûte un is_file() quand il n'y a pas d'envoi. Sinon, au plus 1 e-mail toutes les 6 à 9 s, un seul processus à la fois.
 * Renvoie ce qui s'est passé (pour les tests) : 'none' | 'idle' | 'busy' | 'wait' | 'sent' | 'fail' | 'paused' | 'finished'.
 */
function mail_queue_tick(): string {
  $f = mailq_dir() . 'mail_job.json';
  if (!is_file($f)) return 'none';
  $nx = @file_get_contents(mailq_dir() . 'mail_job.next');
  if ($nx === 'off') return 'idle';
  if (is_string($nx) && ctype_digit($nx) && time() < (int) $nx) return 'wait';
  $job = mailq_job_read();
  if (!$job || empty($job['active'])) return 'idle';
  if (time() < (int) ($job['nextAt'] ?? 0)) return 'wait';
  $id = (string) $job['id'];
  $h = mailq_lock($id, false);
  if ($h === null) return 'busy';
  try {
    $job = mailq_job_read(); // relu sous verrou (un autre tic vient peut-être de passer)
    if (!$job || empty($job['active']) || (string) $job['id'] !== $id) return 'idle';
    if (time() < (int) ($job['nextAt'] ?? 0)) return 'wait';
    @set_time_limit(25);
    @ignore_user_abort(true);
    $done = mailq_log_read($id);
    $em = mailq_next($job, $done);
    if ($em === '') {
      $left = mailq_left($job, $done);
      mailq_job_update(static function (?array $j) use ($id, $left) {
        if (!$j || (string) $j['id'] !== $id) return null;
        if ($left > 0) { $j['nextAt'] = time() + 30; return $j; } // seulement des réessais en attente (2 min)
        $j['active'] = false; $j['finishedAt'] = time(); $j['reason'] = 'Terminé.';
        return $j;
      });
      return $left > 0 ? 'wait' : 'finished';
    }
    // Réserver le créneau AVANT d'envoyer : un autre processus ne retentera pas pendant l'envoi.
    $gap = (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_MAILQ_GAP'])) ? (int) $GLOBALS['OROLADO_MAILQ_GAP'] : random_int(6, 9); // test seulement : délai forcé
    mailq_job_update(static function (?array $j) use ($id, $gap) {
      if (!$j || (string) $j['id'] !== $id) return null;
      $j['lastTick'] = time(); $j['nextAt'] = time() + $gap;
      return $j;
    });
    $GLOBALS['OROLADO_MAIL_NAMES'] = array_merge((array) ($GLOBALS['OROLADO_MAIL_NAMES'] ?? []), (array) ($job['names'] ?? []));
    $r = admin_mail_plain($em, (string) $job['subject'], (string) $job['message']);
    $ok = !empty($r['ok']);
    $done = mailq_log_read($id);
    $done[$em] = $ok ? 1 : time();
    mailq_log_write($id, $done);
    $quota = !$ok && mailq_is_quota_error($r);
    $out = 'sent';
    mailq_job_update(static function (?array $j) use ($id, $em, $ok, $r, $quota, &$out) {
      if (!$j || (string) $j['id'] !== $id) return null;
      $j['lastTick'] = time();
      if ($ok) { $j['sent'] = (int) ($j['sent'] ?? 0) + 1; $j['consecFail'] = 0; $out = 'sent'; return $j; }
      $j['fail'] = (int) ($j['fail'] ?? 0) + 1;
      $j['consecFail'] = (int) ($j['consecFail'] ?? 0) + 1;
      $j['tries'][$em] = (int) ($j['tries'][$em] ?? 0) + 1;
      $j['lastError'] = mb_substr($em . ' : ' . (string) ($r['reason'] ?? 'échec'), 0, 300);
      $out = 'fail';
      if ($quota || $j['consecFail'] >= MAILQ_MAX_CONSEC_FAIL) {
        $j['active'] = false;
        $j['reason'] = $quota ? 'Pause automatique : limite / quota Brevo atteint (' . mb_substr((string) ($r['reason'] ?? ''), 0, 160) . '). Reprenez plus tard.'
          : 'Pause automatique : ' . $j['consecFail'] . ' échecs d’affilée. Vérifiez Brevo puis reprenez.';
        $out = 'paused';
      }
      return $j;
    });
    return $out;
  } finally {
    mailq_unlock($h);
  }
}

/**
 * À appeler à la fin d'une requête (register_shutdown_function) : rend d'abord la réponse au navigateur,
 * puis fait un tic. Sans fastcgi_finish_request / litespeed_finish_request, ne fait RIEN si $mustDetach
 * (requêtes des joueurs : jamais les ralentir).
 */
function mail_queue_after_response(bool $mustDetach): void {
  try {
    if (!is_file(rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'mail_job.json')) return;
    $detached = false;
    if (session_status() === PHP_SESSION_ACTIVE) @session_write_close(); // ne pas bloquer la requête suivante de l'admin
    if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); $detached = true; } catch (Throwable $e) { /* ignore */ } }
    elseif (function_exists('litespeed_finish_request')) { try { litespeed_finish_request(); $detached = true; } catch (Throwable $e) { /* ignore */ } }
    if (!$detached && $mustDetach) return;
    mail_queue_tick();
  } catch (Throwable $e) {
    /* jamais bloquant */
  }
}
