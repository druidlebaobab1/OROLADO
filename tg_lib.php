<?php
declare(strict_types=1);
/**
 * v2959 (propriétaire) — ALERTES TELEGRAM pour l'admin : un message dès qu'un joueur demande un retrait.
 * Le code du robot (token) n'est JAMAIS dans le dépôt : l'admin le colle une fois dans l'admin (Notifications → Telegram),
 * il est rangé dans data/telegram.json (hors GitHub). Le compte Telegram de l'admin est relié en envoyant /start au robot.
 * Jamais bloquant : une erreur Telegram ne change rien au retrait.
 */
require_once __DIR__ . '/orolado_lib.php';

function tg_file(): string { return rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'telegram.json'; }
function tg_conf(): array {
  $c = json_decode((string) @file_get_contents(tg_file()), true);
  return is_array($c) ? $c : [];
}
function tg_save(array $c): bool {
  $ok = @file_put_contents(tg_file(), json_encode($c, JSON_UNESCAPED_UNICODE), LOCK_EX) !== false;
  @chmod(tg_file(), 0600);
  return $ok;
}
function tg_token_ok(string $t): bool { return (bool) preg_match('/^\d{6,12}:[A-Za-z0-9_-]{30,60}$/', $t); }

/** Appel de l'API Telegram (POST JSON). */
function tg_api(string $token, string $method, array $data = [], int $timeout = 8): array {
  // 2026-10-23 : chaque échec dit POURQUOI (« description ») — jamais le code du robot (diagnostic de l'admin).
  if (!tg_token_ok($token)) return ['ok' => false, 'description' => 'code du robot absent ou invalide'];
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_TG']) && is_callable($GLOBALS['OROLADO_FAKE_TG'])) return ($GLOBALS['OROLADO_FAKE_TG'])($method, $data);
  if (!function_exists('curl_init')) return ['ok' => false, 'description' => 'module PHP « curl » absent sur le serveur'];
  $ch = curl_init('https://api.telegram.org/bot' . $token . '/' . $method);
  if ($ch === false) return ['ok' => false, 'description' => 'curl indisponible'];
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => min(4, $timeout),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_POSTFIELDS => json_encode($data, JSON_UNESCAPED_UNICODE)]);
  $raw = curl_exec($ch);
  $err = $raw === false ? (string) curl_error($ch) : '';
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $j = json_decode((string) $raw, true);
  if (is_array($j)) return $j;
  return ['ok' => false, 'description' => $err !== '' ? 'Telegram injoignable depuis le serveur (' . substr($err, 0, 120) . ')' : 'réponse illisible de Telegram (HTTP ' . $code . ')'];
}

/** Admin : enregistre le code du robot et cherche le compte qui lui a envoyé /start (le plus récent). */
function tg_link(string $token = ''): array {
  $c = tg_conf();
  if ($token !== '') {
    if (!tg_token_ok($token)) return ['ok' => false, 'reason' => 'Code du robot invalide (copiez toute la ligne donnée par BotFather).'];
    $me = tg_api($token, 'getMe');
    if (empty($me['ok'])) return ['ok' => false, 'reason' => 'Telegram refuse ce code. Vérifiez-le dans BotFather.'];
    $c['token'] = $token;
    $c['bot'] = (string) ($me['result']['username'] ?? '');
  }
  $tok = (string) ($c['token'] ?? '');
  if ($tok === '') return ['ok' => false, 'reason' => 'Collez d’abord le code du robot.'];
  $up = tg_api($tok, 'getUpdates', ['limit' => 50, 'timeout' => 0]);
  $chat = '';
  foreach (array_reverse((array) ($up['result'] ?? [])) as $u) {
    $m = $u['message'] ?? $u['my_chat_member'] ?? null;
    if (is_array($m) && isset($m['chat']['id']) && ($m['chat']['type'] ?? '') === 'private') { $chat = (string) $m['chat']['id']; break; }
  }
  if ($chat === '' && empty($c['chat'])) {
    tg_save($c);
    return ['ok' => false, 'saved' => true, 'reason' => 'Code enregistré. Ouvrez maintenant le robot @' . ($c['bot'] ?? '') . ' dans Telegram, touchez DÉMARRER (/start), puis revenez appuyer sur « Relier ».'];
  }
  if ($chat !== '') $c['chat'] = $chat;
  $c['on'] = 1;
  tg_save($c);
  $t = tg_api($tok, 'sendMessage', ['chat_id' => $c['chat'], 'text' => "✅ OROLADO relié.\nVous recevrez ici une alerte à chaque demande de retrait, nouveau message de joueur et gros dépôt."]);
  return ['ok' => !empty($t['ok']), 'bot' => $c['bot'] ?? '', 'reason' => !empty($t['ok']) ? '' : 'Relié, mais le message de test n’est pas parti.'];
}

function tg_status(): array {
  $c = tg_conf();
  return ['ok' => true, 'has' => !empty($c['token']), 'linked' => !empty($c['chat']) && !empty($c['on']), 'bot' => (string) ($c['bot'] ?? ''), 'mirror' => tg_mirror_on()];
}

/**
 * 2026-10-23 — envoi à l'admin avec la raison d'un échec : ['ok' => bool, 'why' => texte simple pour l'admin].
 * (Avant : un simple vrai / faux, l'admin ne savait jamais pourquoi rien n'arrivait.)
 */
function tg_send_admin(string $text): array {
  $c = tg_conf();
  if (empty($c['token'])) return ['ok' => false, 'why' => 'Telegram pas relié : aucun code de robot enregistré sur ce serveur (Notifications → Telegram → coller le code puis « Relier »).'];
  if (empty($c['chat'])) return ['ok' => false, 'why' => 'Telegram pas relié : touchez DÉMARRER dans le robot puis « Relier » dans l’admin.'];
  if (empty($c['on'])) return ['ok' => false, 'why' => 'Alertes Telegram coupées : appuyez sur « Relier » pour les remettre.'];
  if (function_exists('mb_substr') && mb_strlen($text) > 4000) $text = mb_substr($text, 0, 3990) . '…';
  $r = tg_api((string) $c['token'], 'sendMessage', ['chat_id' => $c['chat'], 'text' => $text, 'disable_web_page_preview' => true], 6);
  if (!empty($r['ok'])) return ['ok' => true, 'why' => ''];
  $d = (string) ($r['description'] ?? '');
  $why = $d === '' ? 'Telegram a refusé l’envoi.' : 'Telegram a refusé : ' . $d;
  if (stripos($d, 'blocked') !== false) $why = 'Le robot est bloqué dans votre Telegram : ouvrez-le, touchez « Débloquer » / DÉMARRER, puis « Relier ».';
  elseif (stripos($d, 'unauthorized') !== false) $why = 'Code du robot refusé par Telegram (changé dans BotFather ?) : collez le nouveau code puis « Relier ».';
  elseif (stripos($d, 'chat not found') !== false) $why = 'Conversation Telegram introuvable : touchez DÉMARRER dans le robot puis « Relier ».';
  error_log('OROLADO telegram : ' . $why);
  return ['ok' => false, 'why' => $why];
}

/** Envoi à l'admin (texte simple). */
function tg_notify_admin(string $text): bool {
  return !empty(tg_send_admin($text)['ok']);
}

/** 2026-10-23 : recopier aussi sur Telegram les autres alertes admin (messages, grosses mises, gros dépôts…). Oui par défaut. */
function tg_mirror_on(): bool {
  $c = tg_conf();
  return !array_key_exists('mirror', $c) || !empty($c['mirror']);
}
