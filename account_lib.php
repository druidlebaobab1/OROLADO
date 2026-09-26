<?php
declare(strict_types=1);

/**
 * Compte joueur : changement d'e-mail (code à l'ancienne adresse, puis à la nouvelle)
 * et déconnexion des autres appareils.
 *
 * Le changement ne s'applique qu'après les DEUX codes. L'ancienne adresse est alors
 * remplacée partout (fiche locale, compte de connexion Supabase, profil Supabase) :
 * elle ne permet plus de se connecter. Les autres appareils sont déconnectés.
 */

require_once __DIR__ . '/orolado_lib.php';

const OROLADO_EMAIL_CHANGE_TTL = 900;

function orolado_email_uuid_ok(string $id): bool {
  return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
}

/** L'adresse appartient-elle déjà à un autre compte (ici ou dans Supabase) ? */
function orolado_email_taken(array $db, string $email, string $exceptUid, string $exceptSb = ''): bool {
  $email = strtolower(trim($email));
  if ($email === '') return true;
  if (orolado_is_reserved_admin_email($email)) return true;
  foreach (($db['users'] ?? []) as $id => $u) {
    if (!is_array($u)) continue;
    $uid = (string) ($u['id'] ?? $id);
    if ($uid === $exceptUid) continue;
    foreach (['email', 'originalEmail'] as $k) {
      if (strtolower(trim((string) ($u[$k] ?? ''))) === $email) return true;
    }
  }
  if (supabase_admin_ready()) {
    $url = rtrim(supabase_project_url(), '/');
    $rows = supabase_http($url . '/rest/v1/profiles?email=eq.' . rawurlencode($email) . '&select=id', supabase_admin_headers());
    foreach ((array) $rows as $row) {
      $id = is_array($row) ? (string) ($row['id'] ?? '') : '';
      if ($id !== '' && $id !== $exceptUid && $id !== $exceptSb) return true;
    }
  }
  return false;
}

function orolado_email_change_send(array &$row, string $to): array {
  $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $row['codeHash'] = orolado_otp_hash($to, $code);
  $row['expiresAt'] = time() + OROLADO_EMAIL_CHANGE_TTL;
  $row['lastSentAt'] = time();
  $row['attempts'] = 0;
  return brevo_send_otp($to, $code);
}

/** Étape 1 : nouvelle adresse choisie → code envoyé à l'ANCIENNE adresse. */
function orolado_email_change_start(array &$db, array $me, string $newEmail): array {
  $uid = (string) ($me['id'] ?? '');
  $old = strtolower(trim((string) ($me['email'] ?? '')));
  $new = strtolower(trim($newEmail));
  if ($uid === '' || $old === '') return ['ok' => false, 'reason' => 'Compte introuvable'];
  if (!filter_var($new, FILTER_VALIDATE_EMAIL) || str_ends_with($new, '.local') || str_ends_with($new, '.invalid')) {
    return ['ok' => false, 'code' => 'email', 'reason' => 'Adresse e-mail invalide'];
  }
  if ($new === $old) return ['ok' => false, 'code' => 'same', 'reason' => 'C’est déjà votre adresse actuelle'];
  if (orolado_identity_block($db, $new, '')) return ['ok' => false, 'code' => 'taken', 'reason' => 'Cette adresse ne peut pas être utilisée'];
  $sb = orolado_balance_uuid($db, $uid);
  if (orolado_email_taken($db, $new, $uid, $sb)) return ['ok' => false, 'code' => 'taken', 'reason' => 'Cette adresse est déjà utilisée par un autre compte'];
  if (!orolado_rate_ok('email_change', $uid, 6, 3600)) return ['ok' => false, 'code' => 'rate', 'reason' => 'Trop de demandes, réessayez plus tard'];
  $prev = $db['pendingEmailChanges'][$uid] ?? null;
  if (is_array($prev) && ($prev['newEmail'] ?? '') === $new && ($prev['step'] ?? '') === 'old'
    && time() - (int) ($prev['lastSentAt'] ?? 0) < OROLADO_OTP_RESEND_COOLDOWN) {
    return ['ok' => true, 'step' => 'old', 'sentTo' => $old, 'resendIn' => OROLADO_OTP_RESEND_COOLDOWN - (time() - (int) $prev['lastSentAt'])];
  }
  $row = ['newEmail' => $new, 'oldEmail' => $old, 'sbId' => $sb, 'step' => 'old', 'at' => time()];
  $sent = orolado_email_change_send($row, $old);
  if (empty($sent['ok'])) return ['ok' => false, 'reason' => 'Envoi du code impossible pour le moment'];
  if (!isset($db['pendingEmailChanges']) || !is_array($db['pendingEmailChanges'])) $db['pendingEmailChanges'] = [];
  $db['pendingEmailChanges'][$uid] = $row;
  return ['ok' => true, 'step' => 'old', 'sentTo' => $old, 'resendIn' => OROLADO_OTP_RESEND_UI];
}

/** Renvoie le code de l'étape en cours (ancienne ou nouvelle adresse). */
function orolado_email_change_resend(array &$db, array $me): array {
  $uid = (string) ($me['id'] ?? '');
  $row = $db['pendingEmailChanges'][$uid] ?? null;
  if (!is_array($row)) return ['ok' => false, 'code' => 'none', 'reason' => 'Recommencez le changement d’adresse'];
  $wait = OROLADO_OTP_RESEND_COOLDOWN - (time() - (int) ($row['lastSentAt'] ?? 0));
  if ($wait > 0) return ['ok' => false, 'cooldown' => true, 'retryIn' => $wait, 'reason' => 'Patientez ' . $wait . ' s avant de relancer.'];
  $to = ($row['step'] ?? '') === 'new' ? (string) $row['newEmail'] : (string) $row['oldEmail'];
  $sent = orolado_email_change_send($row, $to);
  if (empty($sent['ok'])) return ['ok' => false, 'reason' => 'Envoi du code impossible pour le moment'];
  $db['pendingEmailChanges'][$uid] = $row;
  return ['ok' => true, 'step' => $row['step'], 'sentTo' => $to, 'resendIn' => OROLADO_OTP_RESEND_UI];
}

/**
 * Étape 2 : code de l'ancienne adresse → code envoyé à la nouvelle.
 * Étape 3 : code de la nouvelle adresse → changement appliqué partout.
 */
function orolado_email_change_verify(array &$db, array $me, string $code, string $keepToken): array {
  $uid = (string) ($me['id'] ?? '');
  $row = $db['pendingEmailChanges'][$uid] ?? null;
  if (!is_array($row)) return ['ok' => false, 'code' => 'none', 'reason' => 'Recommencez le changement d’adresse'];
  $step = ($row['step'] ?? '') === 'new' ? 'new' : 'old';
  $addr = $step === 'new' ? (string) $row['newEmail'] : (string) $row['oldEmail'];
  if ((int) ($row['attempts'] ?? 0) >= 8) {
    unset($db['pendingEmailChanges'][$uid]);
    return ['ok' => false, 'code' => 'none', 'reason' => 'Trop de tentatives, recommencez'];
  }
  $code = preg_replace('/\D/', '', $code) ?? '';
  $good = strlen($code) === 6 && hash_equals((string) ($row['codeHash'] ?? ''), orolado_otp_hash($addr, $code));
  if (!$good) {
    $row['attempts'] = (int) ($row['attempts'] ?? 0) + 1;
    $db['pendingEmailChanges'][$uid] = $row;
    return ['ok' => false, 'code' => 'bad', 'reason' => 'Code incorrect'];
  }
  if ((int) ($row['expiresAt'] ?? 0) + OROLADO_OTP_GRACE < time()) {
    return ['ok' => false, 'code' => 'expired', 'reason' => 'Code expiré, demandez-en un nouveau'];
  }
  if ($step === 'old') {
    $row['step'] = 'new';
    $sent = orolado_email_change_send($row, (string) $row['newEmail']);
    if (empty($sent['ok'])) return ['ok' => false, 'reason' => 'Envoi du code impossible pour le moment'];
    $db['pendingEmailChanges'][$uid] = $row;
    return ['ok' => true, 'step' => 'new', 'sentTo' => $row['newEmail'], 'resendIn' => OROLADO_OTP_RESEND_UI];
  }
  $applied = orolado_email_apply($db, $uid, (string) $row['newEmail'], (string) ($row['sbId'] ?? ''), $keepToken);
  if (empty($applied['ok'])) return $applied;
  unset($db['pendingEmailChanges'][$uid]);
  return ['ok' => true, 'step' => 'done', 'email' => $row['newEmail'], 'user' => $db['users'][$uid] ?? null];
}

/** Remplace l'adresse partout. L'ancienne ne permet plus de se connecter. */
function orolado_email_apply(array &$db, string $uid, string $newEmail, string $sbId, string $keepToken): array {
  $new = strtolower(trim($newEmail));
  if (!isset($db['users'][$uid]) || !is_array($db['users'][$uid])) return ['ok' => false, 'reason' => 'Compte introuvable'];
  if ($sbId === '') $sbId = orolado_balance_uuid($db, $uid);
  if (orolado_email_taken($db, $new, $uid, $sbId)) {
    return ['ok' => false, 'code' => 'taken', 'reason' => 'Cette adresse est déjà utilisée par un autre compte'];
  }
  // Compte de connexion Supabase d'abord : s'il refuse, rien n'est changé ici.
  if (supabase_admin_ready() && orolado_email_uuid_ok($sbId)) {
    $url = rtrim(supabase_project_url(), '/');
    $hdrs = supabase_admin_headers();
    $res = supabase_http($url . '/auth/v1/admin/users/' . rawurlencode($sbId), $hdrs,
      json_encode(['email' => $new, 'email_confirm' => true], JSON_UNESCAPED_UNICODE), 'PUT');
    if (!is_array($res) || strtolower((string) ($res['email'] ?? '')) !== $new) {
      return ['ok' => false, 'reason' => 'Changement impossible pour le moment, réessayez plus tard'];
    }
    supabase_http($url . '/rest/v1/profiles?id=eq.' . rawurlencode($sbId), $hdrs,
      json_encode(['email' => $new], JSON_UNESCAPED_UNICODE), 'PATCH');
  }
  $u = $db['users'][$uid];
  $old = strtolower(trim((string) ($u['email'] ?? '')));
  $hist = is_array($u['emailHistory'] ?? null) ? $u['emailHistory'] : [];
  $hist[] = ['from' => $old, 'to' => $new, 'at' => date('c')];
  $u['emailHistory'] = array_slice($hist, -10);
  $u['email'] = $new;
  // originalEmail servait aussi à la connexion : il suit la nouvelle adresse.
  $u['originalEmail'] = $new;
  if ($sbId !== '' && orolado_email_uuid_ok($sbId)) $u['sbId'] = $sbId;
  $u['updated_at'] = date('c');
  $db['users'][$uid] = $u;
  unset($db['pendingPasswordOtps'][$old]);
  orolado_logout_other_devices($db, $uid, $keepToken, $sbId);
  return ['ok' => true];
}

/** Ferme toutes les sessions du joueur sauf celle de cet appareil. */
function orolado_logout_other_devices(array &$db, string $uid, string $keepToken, string $sbId = ''): int {
  $before = count($db['sessions'] ?? []);
  orolado_revoke_user_sessions($db, $uid, $keepToken);
  if ($sbId === '') $sbId = orolado_balance_uuid($db, $uid);
  if (supabase_admin_ready() && orolado_email_uuid_ok($sbId)) {
    $url = rtrim(supabase_project_url(), '/');
    supabase_http($url . '/auth/v1/admin/users/' . rawurlencode($sbId) . '/logout', supabase_admin_headers(), '{}', 'POST');
  }
  return max(0, $before - count($db['sessions'] ?? []));
}
