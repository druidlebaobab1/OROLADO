<?php
declare(strict_types=1);
/**
 * 2026-10-19 (propriétaire) — le joueur est prévenu (notification sur son téléphone + e-mail soigné, sans pub) quand :
 *   - l'admin lui envoie de l'argent / un bonus (admin.php « adjust », montant positif) ;
 *   - un ami lui envoie de l'argent (api.php « xferSend ») ;
 *   - son dépôt est validé (credit_paid_deposit, orolado_lib.php).
 * Jamais bloquant : une erreur d'e-mail ou de notification ne change rien à l'opération.
 */
require_once __DIR__ . '/orolado_lib.php';
if (is_file(__DIR__ . '/push_lib.php')) require_once __DIR__ . '/push_lib.php';

function orolado_notify_texts(string $kind, string $lang, string $amt, string $from): array {
  $T = [
    'bonus' => [
      'fr' => ['Cadeau reçu 🎁', 'Vous avez reçu %s sur votre compte réel OROLADO. Bon jeu !'],
      'en' => ['Gift received 🎁', 'You received %s on your OROLADO real account. Enjoy!'],
      'es' => ['Regalo recibido 🎁', 'Has recibido %s en tu cuenta real de OROLADO. ¡Buen juego!'],
      'pt' => ['Presente recebido 🎁', 'Você recebeu %s na sua conta real OROLADO. Bom jogo!'],
      'ar' => ['وصلتك هدية 🎁', 'لقد تلقيت %s في حسابك الحقيقي على OROLADO. استمتع!'],
      'tr' => ['Hediye geldi 🎁', 'OROLADO gerçek hesabınıza %s yüklendi. İyi oyunlar!'],
      'vi' => ['Đã nhận quà 🎁', 'Bạn đã nhận %s vào tài khoản thật OROLADO. Chúc chơi vui!'],
      'id' => ['Hadiah diterima 🎁', 'Kamu menerima %s di akun asli OROLADO. Selamat bermain!'],
      'ru' => ['Подарок получен 🎁', 'Вы получили %s на реальный счёт OROLADO. Приятной игры!'],
      'de' => ['Geschenk erhalten 🎁', 'Du hast %s auf dein OROLADO-Echtgeldkonto erhalten. Viel Spaß!'],
      'hi' => ['उपहार मिला 🎁', 'आपके OROLADO असली खाते में %s आए हैं। मज़े करें!'],
      'zh' => ['收到礼物 🎁', '您的 OROLADO 真实账户已收到 %s。祝您玩得开心！'],
    ],
    // 2026-10-24 (propriétaire) : dépôt validé (bouton Valider de l'admin ou paiement automatique) → « Dépôt réussi », son nom, le montant
    'dep' => [
      'fr' => ['Dépôt réussi ✅', 'Votre dépôt de %s a bien été crédité sur votre compte OROLADO. Bon jeu !'],
      'en' => ['Deposit successful ✅', 'Your deposit of %s has been credited to your OROLADO account. Enjoy!'],
      'es' => ['Depósito exitoso ✅', 'Tu depósito de %s ya está acreditado en tu cuenta OROLADO. ¡Buen juego!'],
      'pt' => ['Depósito concluído ✅', 'Seu depósito de %s foi creditado na sua conta OROLADO. Bom jogo!'],
      'ar' => ['تم الإيداع بنجاح ✅', 'تمت إضافة إيداعك بقيمة %s إلى حسابك على OROLADO. استمتع!'],
      'tr' => ['Para yatırma başarılı ✅', '%s tutarındaki yatırımınız OROLADO hesabınıza eklendi. İyi oyunlar!'],
      'vi' => ['Nạp tiền thành công ✅', 'Khoản nạp %s đã được cộng vào tài khoản OROLADO của bạn. Chúc chơi vui!'],
      'id' => ['Deposit berhasil ✅', 'Deposit %s sudah masuk ke akun OROLADO kamu. Selamat bermain!'],
      'ru' => ['Пополнение успешно ✅', 'Ваш депозит %s зачислен на счёт OROLADO. Приятной игры!'],
      'de' => ['Einzahlung erfolgreich ✅', 'Deine Einzahlung von %s wurde deinem OROLADO-Konto gutgeschrieben. Viel Spaß!'],
      'hi' => ['जमा सफल ✅', 'आपकी %s की जमा राशि आपके OROLADO खाते में आ गई है। मज़े करें!'],
      'zh' => ['充值成功 ✅', '您充值的 %s 已到账 OROLADO 账户。祝您玩得开心！'],
    ],
    'xfer' => [
      'fr' => ['Argent reçu 💸', '%2$s vous a envoyé %1$s sur OROLADO.'],
      'en' => ['Money received 💸', '%2$s sent you %1$s on OROLADO.'],
      'es' => ['Dinero recibido 💸', '%2$s te envió %1$s en OROLADO.'],
      'pt' => ['Dinheiro recebido 💸', '%2$s enviou %1$s para você na OROLADO.'],
      'ar' => ['وصلك مال 💸', 'أرسل لك %2$s مبلغ %1$s على OROLADO.'],
      'tr' => ['Para geldi 💸', '%2$s size OROLADO\'da %1$s gönderdi.'],
      'vi' => ['Đã nhận tiền 💸', '%2$s đã gửi cho bạn %1$s trên OROLADO.'],
      'id' => ['Uang diterima 💸', '%2$s mengirimimu %1$s di OROLADO.'],
      'ru' => ['Деньги получены 💸', '%2$s отправил вам %1$s в OROLADO.'],
      'de' => ['Geld erhalten 💸', '%2$s hat dir %1$s auf OROLADO geschickt.'],
      'hi' => ['पैसे मिले 💸', '%2$s ने आपको OROLADO पर %1$s भेजे।'],
      'zh' => ['收到转账 💸', '%2$s 在 OROLADO 上给您转了 %1$s。'],
    ],
  ];
  $x = $T[$kind][$lang] ?? $T[$kind]['en'];
  return [$x[0], sprintf($x[1], $amt, $from !== '' ? $from : 'OROLADO')];
}

function orolado_notify_player(string $uid, string $kind, float $amount, string $from = ''): void {
  if ($uid === '' || $amount <= 0) return;
  $amt = '$' . number_format($amount, 2, '.', ' ');
  // 2026-10-21 : résultat de l'e-mail gardé pour qui veut le noter (paiement du Tournoi démo) — 'none' (pas d'e-mail
  // valide), 'sent' ou 'failed'. Rien d'autre ne change : un e-mail raté ne bloque jamais le crédit.
  $GLOBALS['OROLADO_NOTIFY_LAST'] = ['uid' => $uid, 'mail' => 'none', 'email' => ''];
  try {
    $db = load_db();
    $u = (isset($db['users'][$uid]) && is_array($db['users'][$uid])) ? $db['users'][$uid] : [];
    // v2956 : l'admin crédite sur l'identifiant du coffre (UUID) → on retrouve le joueur par son sbId (avant : introuvable,
    // donc ni e-mail ni notification pour les cadeaux de l'admin)
    if (!$u) {
      foreach (($db['users'] ?? []) as $lid => $cand) {
        if (is_array($cand) && (string) ($cand['sbId'] ?? '') === $uid) { $u = $cand; $uid = (string) $lid; break; }
      }
    }
    $lang = strtolower(substr((string) ($u['lang'] ?? $u['language'] ?? 'fr'), 0, 2));
    $email = trim((string) ($u['email'] ?? ''));
    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) && function_exists('orolado_mail_send')
      && !(function_exists('orolado_is_reserved_admin_email') && orolado_is_reserved_admin_email($email))) {
      [$t, $b] = orolado_notify_texts($kind, $lang, $amt, $from);
      $hi = ['fr' => 'Bonjour', 'es' => 'Hola', 'pt' => 'Olá', 'de' => 'Hallo', 'tr' => 'Merhaba', 'id' => 'Halo', 'vi' => 'Xin chào', 'ru' => 'Здравствуйте', 'ar' => 'مرحبًا', 'hi' => 'नमस्ते', 'zh' => '您好'][$lang] ?? 'Hello';
      $name = trim((string) ($u['displayName'] ?? $u['name'] ?? ''));
      $e = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
      $greet = $hi . ($name !== '' ? ' ' . $name : '') . ',';
      $html = '<!doctype html><html dir="' . ($lang === 'ar' ? 'rtl' : 'ltr') . '"><body style="margin:0;padding:0;background:#0F0B2A;">' .
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0F0B2A;padding:24px 0;"><tr><td align="center">' .
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1B1442;border-radius:16px;">' .
        '<tr><td style="padding:22px 28px 6px;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;letter-spacing:3px;color:#FBBF24;">OROLADO</td></tr>' .
        '<tr><td style="padding:6px 28px 18px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#4ADE80;">' . $e($t) . '</td></tr>' .
        '<tr><td style="padding:0 28px 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#E8EEF9;">' . $e($greet) . '</td></tr>' .
        '<tr><td style="padding:0 28px 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#E8EEF9;">' . $e($b) . '</td></tr>' .
        '<tr><td style="padding:10px 28px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#A5B4D8;">OROLADO · <a href="https://orolado.com" style="color:#A5B4D8;">orolado.com</a></td></tr>' .
        '</table></td></tr></table></body></html>';
      $text = $greet . "\n\n" . $b . "\n\nOROLADO\nhttps://orolado.com\n";
      $GLOBALS['OROLADO_NOTIFY_LAST'] = ['uid' => $uid, 'mail' => 'failed', 'email' => $email];
      if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_MAIL']) && is_callable($GLOBALS['OROLADO_FAKE_MAIL'])) $r = ($GLOBALS['OROLADO_FAKE_MAIL'])($email, $t, $text);
      else {
        // v2955 : même chemin que les codes e-mail (Resend, puis Brevo en secours) — avant : Brevo seul
        $r = orolado_mail_send($email, $name, $t, $html, $text);
        if (empty($r['ok'])) error_log('OROLADO mail ' . $kind . ' non envoyé : ' . (string) ($r['reason'] ?? '?'));
      }
      $GLOBALS['OROLADO_NOTIFY_LAST'] = ['uid' => $uid, 'mail' => (is_array($r) && !empty($r['ok'])) ? 'sent' : 'failed', 'email' => $email,
        'reason' => is_array($r) ? (string) ($r['reason'] ?? '') : ''];
    }
  } catch (Throwable $e) { /* jamais bloquant */ }
  try {
    if (function_exists('push_notify_user')) push_notify_user($uid, static fn(string $l): array => orolado_notify_texts($kind, $l, $amt, $from), '/');
  } catch (Throwable $e) { /* jamais bloquant */ }
}
