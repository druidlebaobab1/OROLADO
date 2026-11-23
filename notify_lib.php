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
    // 2026-11-08 (propriétaire, affiliés) : commission d'affiliation versée
    'aff' => [
      'fr' => ['Commission reçue 🤝', 'Vos amis vous ont rapporté %s sur OROLADO. C\'est déjà sur votre solde réel, retirable quand vous voulez.'],
      'en' => ['Commission received 🤝', 'Your friends earned you %s on OROLADO. It is already on your real balance, withdraw it anytime.'],
      'es' => ['Comisión recibida 🤝', 'Tus amigos te hicieron ganar %s en OROLADO. Ya está en tu saldo real, retíralo cuando quieras.'],
      'pt' => ['Comissão recebida 🤝', 'Os seus amigos renderam-lhe %s na OROLADO. Já está no seu saldo real, levante quando quiser.'],
      'ar' => ['وصلتك عمولة 🤝', 'ربحت %s من أصدقائك على OROLADO. المبلغ في رصيدك الحقيقي، اسحبه متى شئت.'],
      'tr' => ['Komisyon geldi 🤝', 'Arkadaşların sana OROLADO\'da %s kazandırdı. Gerçek bakiyende, istediğin zaman çek.'],
      'vi' => ['Đã nhận hoa hồng 🤝', 'Bạn bè đã mang về cho bạn %s trên OROLADO. Tiền đã vào số dư thật, rút bất cứ lúc nào.'],
      'id' => ['Komisi diterima 🤝', 'Temanmu menghasilkan %s untukmu di OROLADO. Sudah di saldo asli, tarik kapan saja.'],
      'ru' => ['Комиссия получена 🤝', 'Друзья принесли вам %s в OROLADO. Деньги уже на реальном балансе, выводите когда угодно.'],
      'de' => ['Provision erhalten 🤝', 'Deine Freunde haben dir %s auf OROLADO eingebracht. Schon auf deinem Echtgeld-Guthaben, jederzeit auszahlbar.'],
      'hi' => ['कमीशन मिला 🤝', 'आपके दोस्तों से आपको OROLADO पर %s मिले। यह आपके असली बैलेंस में है, कभी भी निकालें।'],
      'zh' => ['佣金到账 🤝', '好友为您在 OROLADO 赚到 %s，已进入真实余额，可随时提现。'],
    ],
    'xfer' => [
      'fr' => ['Transfert reçu 💸', '%2$s vous a envoyé %1$s sur OROLADO.'],
      'en' => ['Transfer received 💸', '%2$s sent you %1$s on OROLADO.'],
      'es' => ['Transferencia recibida 💸', '%2$s te envió %1$s en OROLADO.'],
      'pt' => ['Transferência recebida 💸', '%2$s enviou %1$s para você na OROLADO.'],
      'ar' => ['تحويل مستلم 💸', 'أرسل لك %2$s مبلغ %1$s على OROLADO.'],
      'tr' => ['Transfer alındı 💸', '%2$s size OROLADO\'da %1$s gönderdi.'],
      'vi' => ['Đã nhận chuyển tiền 💸', '%2$s đã gửi cho bạn %1$s trên OROLADO.'],
      'id' => ['Transfer diterima 💸', '%2$s mengirimimu %1$s di OROLADO.'],
      'ru' => ['Перевод получен 💸', '%2$s отправил вам %1$s в OROLADO.'],
      'de' => ['Überweisung erhalten 💸', '%2$s hat dir %1$s auf OROLADO geschickt.'],
      'hi' => ['ट्रांसफ़र मिला 💸', '%2$s ने आपको OROLADO पर %1$s भेजे।'],
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

/**
 * 2026-11-23 (propriétaire : « quand je réponds aux gens dans Messages, ça doit partir aussi en e-mail, comme les e-mails
 * Brevo ; souvent ils mettent longtemps avant de revenir ») — RÉPONSE DE L'ADMIN dans Messages : en plus de la notification
 * (déjà envoyée par admin.php), un e-mail soigné dans la langue du joueur, avec le texte de la réponse et un bouton « Lire et
 * répondre » (ouvre Messages sur le site). Au plus un e-mail toutes les 3 minutes par joueur (plusieurs petites réponses à la
 * suite = un seul e-mail, avec la dernière). Jamais bloquant ; jamais vers une adresse admin réservée.
 */
function orolado_notify_reply_texts(string $lang): array {
  $T = [
    'fr' => ['Nouveau message d\'OROLADO 💬', 'Le service client OROLADO vous a répondu :', 'Lire et répondre'],
    'en' => ['New message from OROLADO 💬', 'OROLADO customer service has replied to you:', 'Read and reply'],
    'es' => ['Nuevo mensaje de OROLADO 💬', 'El servicio de atención de OROLADO te ha respondido:', 'Leer y responder'],
    'pt' => ['Nova mensagem da OROLADO 💬', 'O atendimento da OROLADO respondeu-lhe:', 'Ler e responder'],
    'ar' => ['رسالة جديدة من OROLADO 💬', 'ردّت عليك خدمة عملاء OROLADO:', 'اقرأ وردّ'],
    'tr' => ['OROLADO\'dan yeni mesaj 💬', 'OROLADO müşteri hizmetleri size yanıt verdi:', 'Oku ve yanıtla'],
    'vi' => ['Tin nhắn mới từ OROLADO 💬', 'Bộ phận hỗ trợ OROLADO đã trả lời bạn:', 'Đọc và trả lời'],
    'id' => ['Pesan baru dari OROLADO 💬', 'Layanan pelanggan OROLADO membalas Anda:', 'Baca dan balas'],
    'ru' => ['Новое сообщение от OROLADO 💬', 'Служба поддержки OROLADO ответила вам:', 'Прочитать и ответить'],
    'de' => ['Neue Nachricht von OROLADO 💬', 'Der OROLADO-Kundendienst hat dir geantwortet:', 'Lesen und antworten'],
    'hi' => ['OROLADO से नया संदेश 💬', 'OROLADO ग्राहक सेवा ने आपको जवाब दिया है:', 'पढ़ें और जवाब दें'],
    'zh' => ['来自 OROLADO 的新消息 💬', 'OROLADO 客服已回复您：', '阅读并回复'],
  ];
  return $T[$lang] ?? $T['en'];
}
function orolado_notify_reply(string $uid, string $msg, bool $photo = false): string {
  if ($uid === '') return 'none';
  try {
    $dir = orolado_data_dir() . '/live'; if (!is_dir($dir)) @mkdir($dir, 0750, true);
    $mark = $dir . '/mailed_' . hash('sha256', 'reply|' . $uid) . '.at';
    if ((int) @file_get_contents($mark) > time() - 180) return 'throttled';
    $db = load_db();
    $u = (isset($db['users'][$uid]) && is_array($db['users'][$uid])) ? $db['users'][$uid] : [];
    $email = trim((string) ($u['email'] ?? ''));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !function_exists('orolado_mail_send')
      || (function_exists('orolado_is_reserved_admin_email') && orolado_is_reserved_admin_email($email))) return 'none';
    $lang = strtolower(substr((string) ($u['lang'] ?? $u['language'] ?? 'fr'), 0, 2));
    [$t, $intro, $btn] = orolado_notify_reply_texts($lang);
    $hi = ['fr' => 'Bonjour', 'es' => 'Hola', 'pt' => 'Olá', 'de' => 'Hallo', 'tr' => 'Merhaba', 'id' => 'Halo', 'vi' => 'Xin chào', 'ru' => 'Здравствуйте', 'ar' => 'مرحبًا', 'hi' => 'नमस्ते', 'zh' => '您好'][$lang] ?? 'Hello';
    $name = trim((string) ($u['displayName'] ?? $u['name'] ?? ''));
    $greet = $hi . ($name !== '' ? ' ' . $name : '') . ',';
    $body = trim($msg) !== '' ? trim($msg) : '📷';
    if (mb_strlen($body) > 1500) $body = mb_substr($body, 0, 1500) . '…';
    $e = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $url = 'https://orolado.com/?live=1';
    $html = '<!doctype html><html dir="' . ($lang === 'ar' ? 'rtl' : 'ltr') . '"><body style="margin:0;padding:0;background:#0F0B2A;">' .
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0F0B2A;padding:24px 0;"><tr><td align="center">' .
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1B1442;border-radius:16px;">' .
      '<tr><td style="padding:22px 28px 6px;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;letter-spacing:3px;color:#FBBF24;">OROLADO</td></tr>' .
      '<tr><td style="padding:6px 28px 14px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#FFFFFF;">' . $e($t) . '</td></tr>' .
      '<tr><td style="padding:0 28px 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#E8EEF9;">' . $e($greet) . '</td></tr>' .
      '<tr><td style="padding:0 28px 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#E8EEF9;">' . $e($intro) . '</td></tr>' .
      '<tr><td style="padding:0 28px 16px;"><div style="padding:14px 16px;border-radius:12px;background:#0F0B2A;border-left:4px solid #FBBF24;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#FFFFFF;white-space:pre-wrap;">' . nl2br($e($body)) . ($photo && trim($msg) !== '' ? '<br>📷' : '') . '</div></td></tr>' .
      '<tr><td style="padding:0 28px 22px;"><a href="' . $url . '" style="display:inline-block;padding:12px 22px;border-radius:10px;background:#FBBF24;color:#1A1205;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;">' . $e($btn) . '</a></td></tr>' .
      '<tr><td style="padding:0 28px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#A5B4D8;">OROLADO · <a href="https://orolado.com" style="color:#A5B4D8;">orolado.com</a></td></tr>' .
      '</table></td></tr></table></body></html>';
    $text = $greet . "\n\n" . $intro . "\n\n" . $body . "\n\n" . $btn . ' : ' . $url . "\n\nOROLADO\nhttps://orolado.com\n";
    if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_MAIL']) && is_callable($GLOBALS['OROLADO_FAKE_MAIL'])) $r = ($GLOBALS['OROLADO_FAKE_MAIL'])($email, $t, $text);
    else $r = orolado_mail_send($email, $name, $t, $html, $text);
    if (is_array($r) && !empty($r['ok'])) { @file_put_contents($mark, (string) time(), LOCK_EX); return 'sent'; }
    error_log('OROLADO mail réponse Messages non envoyé : ' . (string) (is_array($r) ? ($r['reason'] ?? '?') : '?'));
    return 'failed';
  } catch (Throwable $e) { return 'failed'; }
}
