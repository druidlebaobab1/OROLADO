<?php
declare(strict_types=1);
/**
 * v2676 — « Live » (ancien « Aide ») : conversation joueur ↔ OROLADO (texte + photos) et Actualités (publications).
 * Fichiers à part dans data/live/ : ne touche JAMAIS aux soldes, trades, dépôts ou retraits.
 *  - data/live/threads/<id>.json : une conversation par joueur
 *  - data/live/posts.json        : publications (Actualités)
 *  - data/live/img/<nom>.jpg     : photos PRIVÉES des conversations (réduites par le téléphone, 400 Ko max)
 *  - data/live/pub/<nom>.jpg     : photos des publications (publiques)
 */

const LIVE_MSG_MAX = 4000;        // lettres par message (v2905 : 1000 → 4000, un long message passe en entier)
const LIVE_IMG_MAX = 409600;      // 400 Ko par photo (le téléphone la réduit avant)
const LIVE_IMG_DAY = 60;          // photos par joueur et par jour (v2905 : 10 → 60)
const LIVE_MSG_HOUR = 120;        // messages à l'équipe par joueur et par heure (v2905 : 30 → 120)
const LIVE_BURST_N = 20;          // v2905 : anti-robot — au plus 20 messages en 10 s (un humain n'y arrive pas)
const LIVE_BURST_SEC = 10;
const LIVE_THREAD_KEEP = 5000;    // derniers messages gardés par conversation (2026-10-20, propriétaire : rien ne doit s'effacer ; avant 200)

function live_dir(string $sub = ''): string {
  $d = rtrim(str_replace('\\', '/', orolado_data_dir()), '/') . '/live' . ($sub !== '' ? '/' . $sub : '');
  if (!is_dir($d)) @mkdir($d, 0775, true);
  return $d;
}

function live_safe_id(string $id): string {
  return preg_replace('/[^a-zA-Z0-9_-]/', '', $id) ?: '';
}

function live_thread_file(string $uid): string {
  return live_dir('threads') . '/' . live_safe_id($uid) . '.json';
}

function live_read_json(string $f, $def) {
  if (!is_file($f)) return $def;
  $j = json_decode((string) @file_get_contents($f), true);
  return is_array($j) ? $j : $def;
}

/** Écriture sûre (fichier temporaire puis renommage). */
function live_write_json(string $f, array $data): bool {
  $tmp = $f . '.tmp' . bin2hex(random_bytes(3));
  if (@file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) === false) return false;
  if (!@rename($tmp, $f)) { @unlink($f); return @rename($tmp, $f); }
  return true;
}

/** Modification sous verrou (deux messages envoyés en même temps ne s'effacent pas). */
function live_update(string $f, callable $fn, array $def = []) {
  $lock = @fopen($f . '.lock', 'c');
  if ($lock) flock($lock, LOCK_EX);
  $cur = live_read_json($f, $def);
  $res = $fn($cur);
  if (is_array($res) && isset($res['__write'])) live_write_json($f, $res['__write']);
  if ($lock) { flock($lock, LOCK_UN); fclose($lock); }
  return $res;
}

function live_clean_text(string $t): string {
  $t = str_replace(["\r\n", "\r"], "\n", $t);
  $t = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $t) ?? '';
  $t = preg_replace("/\n{4,}/", "\n\n\n", $t) ?? $t;
  $t = trim($t);
  if (preg_match('/^.{0,' . LIVE_MSG_MAX . '}/us', $t, $m)) $t = $m[0];
  return $t;
}

/** Photo envoyée en « data:image/jpeg;base64,… » → fichier ; '' si refusée. */
function live_save_image(string $dataUrl, string $sub = 'img', int $max = LIVE_IMG_MAX): string {
  if (!preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)$#', $dataUrl, $m)) return '';
  $bin = base64_decode(preg_replace('/\s+/', '', $m[2]) ?? '', true);
  if ($bin === false || strlen($bin) < 200 || strlen($bin) > $max) return '';
  // Vraie image (pas un fichier déguisé) : signature JPEG / PNG / WEBP.
  $ok = str_starts_with($bin, "\xFF\xD8\xFF") || str_starts_with($bin, "\x89PNG") || (str_starts_with($bin, 'RIFF') && substr($bin, 8, 4) === 'WEBP');
  if (!$ok) return '';
  $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
  $name = date('ymd') . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
  return @file_put_contents(live_dir($sub === 'pub' ? 'pub' : 'img') . '/' . $name, $bin) !== false ? $name : '';
}

/* v2790 (propriétaire) — NOTE VOCALE dans la conversation avec l'équipe : 10 s max, enregistrée par le téléphone
   (Android : webm/opus, iPhone : mp4/aac), 256 Ko max, 20 par jour. Rangée avec les photos privées (mêmes droits). */
const LIVE_AUD_MAX = 1258291;     // v2905 : notes vocales jusqu'à 3 min (1,2 Mo max ; avant 256 Ko = 10 s)
const LIVE_AUD_DAY = 100;         // v2905 : 20 → 100 par jour
function live_save_audio(string $dataUrl): string {
  if (!preg_match('#^data:audio/(webm|mp4|ogg|x-m4a|aac)(?:;[a-z0-9=.,+ -]*)?;base64,([A-Za-z0-9+/=\s]+)$#i', $dataUrl, $m)) return '';
  $bin = base64_decode(preg_replace('/\s+/', '', $m[2]) ?? '', true);
  if ($bin === false || strlen($bin) < 400 || strlen($bin) > LIVE_AUD_MAX) return '';
  // Vrai fichier son (pas un fichier déguisé) : signature WEBM / MP4 / OGG.
  if (str_starts_with($bin, "\x1A\x45\xDF\xA3")) $ext = 'webm';
  elseif (substr($bin, 4, 4) === 'ftyp') $ext = 'm4a';
  elseif (str_starts_with($bin, 'OggS')) $ext = 'ogg';
  else return '';
  $name = date('ymd') . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
  return @file_put_contents(live_dir('img') . '/' . $name, $bin) !== false ? $name : '';
}
function live_is_audio(string $name): bool { return (bool) preg_match('/\.(webm|m4a|ogg)$/', $name); }
function live_media_type(string $f): string {
  $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
  return ['png' => 'image/png', 'webp' => 'image/webp', 'webm' => 'audio/webm', 'm4a' => 'audio/mp4', 'ogg' => 'audio/ogg'][$ext] ?? 'image/jpeg';
}
/** Envoie une photo ou une note vocale (avec « Range » : l'iPhone lit le son par morceaux). */
function live_send_media(string $f, string $cache): void {
  $size = (int) filesize($f);
  header('Content-Type: ' . live_media_type($f));
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: ' . $cache);
  header('Accept-Ranges: bytes');
  $a = 0; $b = $size - 1;
  if (preg_match('/^bytes=(\d*)-(\d*)$/', (string) ($_SERVER['HTTP_RANGE'] ?? ''), $r) && $size > 0) {
    if ($r[1] === '' && $r[2] !== '') { $a = max(0, $size - (int) $r[2]); }
    else { $a = (int) $r[1]; if ($r[2] !== '') $b = min($b, (int) $r[2]); }
    if ($a > $b || $a >= $size) { http_response_code(416); header('Content-Range: bytes */' . $size); exit; }
    http_response_code(206);
    header('Content-Range: bytes ' . $a . '-' . $b . '/' . $size);
  }
  header('Content-Length: ' . (string) ($b - $a + 1));
  $h = @fopen($f, 'rb');
  if ($h) { fseek($h, $a); echo fread($h, max(1, $b - $a + 1)); fclose($h); }
  exit;
}
function live_media_label(array $m): string {
  $t = (string) ($m['t'] ?? '');
  if ($t !== '') return $t;
  return live_is_audio((string) ($m['img'] ?? '')) ? '🎤 Note vocale' : '📷 Photo';
}

function live_img_path(string $name, string $sub = 'img'): string {
  if (!preg_match('/^\d{6}_[a-f0-9]{16}\.(jpg|png|webp|webm|m4a|ogg)$/', $name)) return '';
  if ($sub === 'pub' && live_is_audio($name)) return '';
  $f = live_dir($sub === 'pub' ? 'pub' : 'img') . '/' . $name;
  return is_file($f) ? $f : '';
}

/** v2905 : anti-robot — rafale de messages (plus de LIVE_BURST_N en LIVE_BURST_SEC secondes) refusée. */
function live_burst_ok(string $uid): bool { return live_quota_ok($uid, 'burst', LIVE_BURST_N, LIVE_BURST_SEC); }

/** Taille d'une photo envoyée par le téléphone (« 640x480 ») : la bulle garde sa place avant que la photo arrive. */
function live_img_wh($wh): string { return preg_match('/^([1-9][0-9]{0,4})x([1-9][0-9]{0,4})$/', (string) $wh, $m) ? $m[1] . 'x' . $m[2] : ''; }

/* v2905 (propriétaire) — PHOTO DE PROFIL : choisie dans le téléphone, recadrée en carré et réduite (≈ 256 px) par le
   téléphone, vérifiée ici (vraie image, 300 Ko max), rangée avec les photos publiques (nom au hasard, impossible à deviner).
   Fichier : data/live/photos.json { p: { uid: nom } }. Sans photo : l'initiale, comme avant. */
const LIVE_PHOTO_MAX = 307200;
const LIVE_PHOTO_DAY = 20;
function live_photos_file(): string { return live_dir() . '/photos.json'; }
function live_photo_of(string $uid): string {
  static $mem = null;
  if ($mem === null || isset($GLOBALS['LIVE_PHOTO_RELOAD'])) { unset($GLOBALS['LIVE_PHOTO_RELOAD']); $mem = (array) (live_read_json(live_photos_file(), [])['p'] ?? []); }
  $f = (string) ($mem[$uid] ?? '');
  return $f !== '' ? 'live.php?p=' . rawurlencode($f) : '';
}
function live_photo_set(string $uid, string $file): void {
  live_update(live_photos_file(), function ($q) use ($uid, $file) {
    $p = (array) ($q['p'] ?? []);
    if ($file === '') unset($p[$uid]); else $p[$uid] = $file;
    return ['ok' => true, '__write' => ['p' => $p]];
  }, ['p' => []]);
  $GLOBALS['LIVE_PHOTO_RELOAD'] = 1;
}

/** Compteur simple par joueur (messages / heure, photos / jour). */
function live_quota_ok(string $uid, string $kind, int $max, int $window): bool {
  $f = live_dir('quota') . '/' . live_safe_id($uid) . '_' . $kind . '.json';
  $now = time();
  $res = live_update($f, function ($q) use ($now, $max, $window) {
    $list = array_values(array_filter((array) ($q['t'] ?? []), static fn($t) => is_int($t) && $t > $now - $window));
    if (count($list) >= $max) return ['ok' => false];
    $list[] = $now;
    return ['ok' => true, '__write' => ['t' => $list]];
  });
  return !empty($res['ok']);
}

/** Message dans la conversation d'un joueur. $from = 'u' (joueur) ou 'a' (OROLADO). */
function live_add_msg(array $user, string $from, string $text, string $img = '', string $wh = ''): array {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '' || ($text === '' && $img === '')) return ['ok' => false];
  $msg = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => $from === 'a' ? 'a' : 'u', 't' => $text, 'at' => time()];
  if ($img !== '') { $msg['img'] = $img; if ($wh !== '') $msg['wh'] = $wh; }
  return live_update(live_thread_file($uid), function ($th) use ($user, $uid, $msg, $from) {
    $th['uid'] = $uid;
    if ($from !== 'a') {
      $th['email'] = (string) ($user['email'] ?? $th['email'] ?? '');
      $th['name'] = (string) ($user['displayName'] ?? $user['name'] ?? $th['name'] ?? '');
      $th['publicId'] = (string) ($user['publicId'] ?? $th['publicId'] ?? '');
    }
    $msgs = (array) ($th['msgs'] ?? []);
    $msgs[] = $msg;
    $th['msgs'] = array_slice($msgs, -LIVE_THREAD_KEEP);
    $th['at'] = $msg['at'];
    if ($from === 'a') { $th['unreadUser'] = (int) ($th['unreadUser'] ?? 0) + 1; $th['unreadAdmin'] = 0; }
    else { $th['unreadAdmin'] = (int) ($th['unreadAdmin'] ?? 0) + 1; }
    return ['ok' => true, 'msg' => $msg, '__write' => $th];
  });
}

/**
 * v2689 (propriétaire) — réponse automatique : après le message d'un joueur, si l'équipe ne lui a rien écrit
 * depuis 12 h (ni réponse automatique), on ajoute « bien reçu, merci de patienter ». Ne touche pas au compteur
 * « non lu » de l'admin (le message du joueur reste à traiter).
 */
function live_auto_reply(string $uid, string $lang): ?array {
  // v3200 (propriétaire) : réponse automatique PROFESSIONNELLE et au VOUVOIEMENT, et GÉNÉRALE (pas seulement « dépôt »).
  // On accuse réception, on dit qu'on examine, et on demande une preuve SEULEMENT si c'est une réclamation.
  $txt = [
    'fr' => 'Bonjour, et merci d\'avoir contacté le support OROLADO. Votre message a bien été reçu. Notre équipe va l\'examiner et vous répondra ici dès que possible. Si votre demande concerne un paiement ou un problème précis, merci de joindre une capture d\'écran avec les détails (montant, date, moyen utilisé) : cela nous permettra de traiter votre demande plus rapidement. Merci de votre confiance.',
    'en' => 'Hello, and thank you for contacting OROLADO support. Your message has been received. Our team will review it and reply to you here as soon as possible. If your request concerns a payment or a specific issue, please attach a screenshot with the details (amount, date, method used) so we can process it faster. Thank you for your trust.',
    'zh' => '您好，感谢您联系 OROLADO 客服。我们已收到您的留言。我们的团队会进行核实，并尽快在这里回复您。如果您的问题涉及付款或具体事项，请附上带有详细信息（金额、日期、所用方式）的截图，以便我们更快处理。感谢您的信任。',
    'es' => 'Hola, y gracias por contactar con el soporte de OROLADO. Hemos recibido su mensaje. Nuestro equipo lo revisará y le responderá aquí lo antes posible. Si su solicitud se refiere a un pago o a un problema concreto, le rogamos adjuntar una captura de pantalla con los detalles (monto, fecha, método utilizado) para poder atenderla más rápido. Gracias por su confianza.',
    'pt' => 'Olá, e obrigado por contactar o suporte da OROLADO. A sua mensagem foi recebida. A nossa equipa irá analisá-la e responder-lhe aqui o mais rápido possível. Se o seu pedido diz respeito a um pagamento ou a um problema específico, por favor anexe uma captura de ecrã com os detalhes (valor, data, método utilizado) para que possamos tratá-lo mais depressa. Obrigado pela sua confiança.',
    'ar' => 'مرحبًا، وشكرًا لتواصلكم مع دعم OROLADO. لقد استلمنا رسالتكم. سيقوم فريقنا بمراجعتها والرد عليكم هنا في أقرب وقت ممكن. إذا كان طلبكم يتعلق بعملية دفع أو بمشكلة محددة، يُرجى إرفاق لقطة شاشة مع التفاصيل (المبلغ، التاريخ، الوسيلة المستخدمة) حتى نتمكن من معالجته بسرعة أكبر. شكرًا لثقتكم.',
    'tr' => 'Merhaba ve OROLADO desteğine ulaştığınız için teşekkür ederiz. Mesajınız tarafımıza ulaştı. Ekibimiz inceleyip en kısa sürede buradan size yanıt verecektir. Talebiniz bir ödeme veya belirli bir sorunla ilgiliyse, daha hızlı işleme alabilmemiz için lütfen ayrıntıları içeren bir ekran görüntüsü ekleyin (tutar, tarih, kullanılan yöntem). Güveniniz için teşekkür ederiz.',
    'vi' => 'Xin chào, và cảm ơn Quý khách đã liên hệ với bộ phận hỗ trợ của OROLADO. Chúng tôi đã nhận được tin nhắn của Quý khách. Đội ngũ của chúng tôi sẽ xem xét và phản hồi tại đây trong thời gian sớm nhất. Nếu yêu cầu của Quý khách liên quan đến một khoản thanh toán hoặc một vấn đề cụ thể, vui lòng đính kèm ảnh chụp màn hình cùng thông tin chi tiết (số tiền, ngày, phương thức) để chúng tôi xử lý nhanh hơn. Cảm ơn Quý khách đã tin tưởng.',
    'id' => 'Halo, dan terima kasih telah menghubungi dukungan OROLADO. Pesan Anda telah kami terima. Tim kami akan meninjaunya dan membalas Anda di sini sesegera mungkin. Jika permintaan Anda berkaitan dengan pembayaran atau masalah tertentu, mohon lampirkan tangkapan layar beserta detailnya (jumlah, tanggal, metode yang digunakan) agar kami dapat memprosesnya lebih cepat. Terima kasih atas kepercayaan Anda.',
    'ru' => 'Здравствуйте и спасибо, что обратились в поддержку OROLADO. Ваше сообщение получено. Наша команда рассмотрит его и ответит вам здесь в ближайшее время. Если ваш вопрос касается платежа или конкретной проблемы, пожалуйста, приложите скриншот с деталями (сумма, дата, способ оплаты), чтобы мы обработали его быстрее. Спасибо за ваше доверие.',
    'de' => 'Hallo und vielen Dank, dass Sie den OROLADO-Support kontaktiert haben. Ihre Nachricht ist bei uns eingegangen. Unser Team wird sie prüfen und Ihnen hier so schnell wie möglich antworten. Falls Ihr Anliegen eine Zahlung oder ein konkretes Problem betrifft, fügen Sie bitte einen Screenshot mit den Details bei (Betrag, Datum, verwendete Methode), damit wir es schneller bearbeiten können. Vielen Dank für Ihr Vertrauen.',
    'hi' => 'नमस्ते, और OROLADO सहायता से संपर्क करने के लिए धन्यवाद। आपका संदेश हमें प्राप्त हो गया है। हमारी टीम इसकी समीक्षा करेगी और जल्द से जल्द यहाँ आपको जवाब देगी। यदि आपका अनुरोध किसी भुगतान या किसी विशेष समस्या से संबंधित है, तो कृपया विवरण (रक़म, तारीख, उपयोग किया गया माध्यम) के साथ एक स्क्रीनशॉट संलग्न करें, ताकि हम इसे तेज़ी से संसाधित कर सकें। आपके भरोसे के लिए धन्यवाद।',
  ];
  // v3200 (propriétaire) : 2e message automatique, FERME, PROFESSIONNEL et au VOUVOIEMENT. Il part SEULEMENT si le joueur
  // revient écrire (au moins 2 min après le 1er) et tant qu'aucun humain n'a répondu. Ensuite plus d'auto : le silence répond.
  $txt2 = [
    'fr' => 'Bonjour, nous confirmons la bonne réception de votre demande, qui est actuellement à l\'étude 🔎 Si les informations fournies sont vérifiées et confirmées de notre côté, une réponse vous sera apportée ici avec la suite à donner. Pour toute réclamation, une preuve (capture d\'écran, montant, date) est indispensable : sans élément justificatif, nous ne serons pas en mesure d\'y donner suite. Nous vous remercions de votre compréhension.',
    'en' => 'Hello, we confirm that your request has been received and is currently under review 🔎 If the information provided is verified and confirmed on our side, a reply will be sent to you here with the next steps. For any claim, proof (screenshot, amount, date) is required: without supporting evidence, we will not be able to proceed. Thank you for your understanding.',
    'zh' => '您好，我们确认已收到您的请求，目前正在审核中 🔎 如果所提供的信息经我们核实确认，我们会在这里回复您后续处理。对于任何申诉，凭证（截图、金额、日期）是必需的：没有证明材料，我们将无法继续处理。感谢您的理解。',
    'es' => 'Hola, confirmamos la recepción de su solicitud, que está siendo revisada 🔎 Si la información proporcionada se verifica y se confirma por nuestra parte, recibirá aquí una respuesta con los siguientes pasos. Para cualquier reclamación es indispensable una prueba (captura de pantalla, monto, fecha): sin un justificante, no podremos darle seguimiento. Gracias por su comprensión.',
    'pt' => 'Olá, confirmamos a receção do seu pedido, que está a ser analisado 🔎 Se as informações fornecidas forem verificadas e confirmadas do nosso lado, receberá aqui uma resposta com os próximos passos. Para qualquer reclamação é indispensável uma prova (captura de ecrã, valor, data): sem um comprovativo, não poderemos dar seguimento. Agradecemos a sua compreensão.',
    'ar' => 'مرحبًا، نؤكد استلام طلبكم الذي تجري مراجعته حاليًا 🔎 إذا تم التحقق من المعلومات المقدمة وتأكيدها من جانبنا، فسيصلكم هنا رد بالخطوات التالية. بالنسبة لأي مطالبة، يلزم تقديم إثبات (لقطة شاشة، المبلغ، التاريخ): بدون مستند مؤيد لن نتمكن من المتابعة. نشكر لكم تفهمكم.',
    'tr' => 'Merhaba, talebinizin tarafımıza ulaştığını ve şu anda incelenmekte olduğunu teyit ederiz 🔎 Verilen bilgiler doğrulanır ve tarafımızca onaylanırsa, sonraki adımlarla ilgili yanıt burada size iletilecektir. Her türlü talep için bir kanıt (ekran görüntüsü, tutar, tarih) gereklidir: destekleyici bir belge olmadan işleme devam edemeyiz. Anlayışınız için teşekkür ederiz.',
    'vi' => 'Xin chào, chúng tôi xác nhận đã nhận được yêu cầu của Quý khách và đang trong quá trình xem xét 🔎 Nếu các thông tin cung cấp được kiểm tra và xác nhận từ phía chúng tôi, Quý khách sẽ nhận được phản hồi tại đây về các bước tiếp theo. Đối với mọi khiếu nại, bằng chứng (ảnh chụp màn hình, số tiền, ngày) là bắt buộc: nếu không có tài liệu chứng minh, chúng tôi sẽ không thể tiếp tục xử lý. Cảm ơn sự thông cảm của Quý khách.',
    'id' => 'Halo, kami konfirmasikan bahwa permintaan Anda telah kami terima dan sedang ditinjau 🔎 Jika informasi yang diberikan terverifikasi dan dikonfirmasi dari pihak kami, Anda akan menerima balasan di sini mengenai langkah selanjutnya. Untuk setiap klaim, bukti (tangkapan layar, jumlah, tanggal) wajib disertakan: tanpa dokumen pendukung, kami tidak dapat melanjutkan. Terima kasih atas pengertian Anda.',
    'ru' => 'Здравствуйте, подтверждаем получение вашего запроса, он находится на рассмотрении 🔎 Если предоставленная информация будет проверена и подтверждена с нашей стороны, вы получите здесь ответ с дальнейшими шагами. Для любой претензии необходимо подтверждение (скриншот, сумма, дата): без подтверждающего документа мы не сможем продолжить. Благодарим за понимание.',
    'de' => 'Hallo, wir bestätigen den Eingang Ihrer Anfrage, die derzeit geprüft wird 🔎 Wenn die angegebenen Informationen überprüft und von unserer Seite bestätigt werden, erhalten Sie hier eine Antwort mit den nächsten Schritten. Für jede Reklamation ist ein Nachweis (Screenshot, Betrag, Datum) erforderlich: ohne Beleg können wir nicht fortfahren. Vielen Dank für Ihr Verständnis.',
    'hi' => 'नमस्ते, हम पुष्टि करते हैं कि आपका अनुरोध प्राप्त हो गया है और उसकी समीक्षा की जा रही है 🔎 यदि दी गई जानकारी सत्यापित होकर हमारी ओर से पुष्ट होती है, तो आपको यहाँ अगले क़दम के साथ जवाब मिलेगा। किसी भी शिकायत के लिए प्रमाण (स्क्रीनशॉट, रक़म, तारीख) आवश्यक है: बिना दस्तावेज़ के हम आगे कार्यवाही नहीं कर सकते। आपकी समझ के लिए धन्यवाद।',
  ];
  $t1 = $txt[$lang] ?? $txt['en'];
  $t2 = $txt2[$lang] ?? $txt2['en'];
  return live_update(live_thread_file($uid), function ($th) use ($t1, $t2) {
    $now = time();
    $autoCount = 0; $lastAuto = 0; $humanReply = false;
    foreach ((array) ($th['msgs'] ?? []) as $m) {
      if (($m['f'] ?? '') !== 'a') continue;
      if (!empty($m['auto'])) { $autoCount++; $lastAuto = max($lastAuto, (int) ($m['at'] ?? 0)); }
      else { $humanReply = true; }
    }
    // Un humain a déjà répondu → on ne met plus de message automatique (le cas est suivi à la main).
    if ($humanReply) return ['ok' => false];
    if ($autoCount === 0) {
      $t = $t1;                                   // 1er message : chaleureux, « envoie une capture »
    } elseif ($autoCount === 1 && $lastAuto > 0 && $lastAuto <= $now - 120) {
      $t = $t2;                                   // 2e message : ferme, seulement si le joueur revient 2 min+ après
    } else {
      return ['ok' => false];                     // déjà 2 messages auto, ou trop rapproché → silence
    }
    $msg = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => 'a', 't' => $t, 'at' => $now, 'auto' => 1];
    $th['msgs'] = array_slice(array_merge((array) ($th['msgs'] ?? []), [$msg]), -LIVE_THREAD_KEEP);
    return ['ok' => true, 'msg' => $msg, '__write' => $th];
  });
}

function live_thread(string $uid): array {
  return live_read_json(live_thread_file($uid), ['uid' => $uid, 'msgs' => []]);
}

function live_mark_read(string $uid, string $who): void {
  $f = live_thread_file($uid);
  if (!is_file($f)) return;
  live_update($f, function ($th) use ($who) {
    $k = $who === 'a' ? 'unreadAdmin' : 'unreadUser';
    if ((int) ($th[$k] ?? 0) === 0) return ['ok' => true];
    $th[$k] = 0;
    return ['ok' => true, '__write' => $th];
  });
}

/** 2026-10-23 — l'admin remet une conversation en « non lu » (à traiter plus tard). */
function live_mark_unread_admin(string $uid): bool {
  $f = live_thread_file($uid);
  if ($uid === '' || !is_file($f)) return false;
  $r = live_update($f, function ($th) {
    $th['unreadAdmin'] = max(1, (int) ($th['unreadAdmin'] ?? 0));
    return ['ok' => true, '__write' => $th];
  });
  return !empty($r['ok']);
}

/** Liste des conversations pour l'admin (plus récentes d'abord). */
function live_threads(int $limit = 200): array {
  $out = [];
  foreach (glob(live_dir('threads') . '/*.json') ?: [] as $f) {
    $th = live_read_json($f, []);
    if (!$th || empty($th['msgs'])) continue;
    $last = end($th['msgs']);
    // 2026-10-23 (propriétaire) : l'aperçu montre le dernier VRAI message (pas la réponse automatique « Merci pour ton
    // message 🙏 », qui cachait ce que le joueur avait écrit).
    $show = $last;
    foreach (array_reverse((array) $th['msgs']) as $mm) { if (is_array($mm) && empty($mm['auto'])) { $show = $mm; break; } }
    $out[] = [
      'uid' => (string) ($th['uid'] ?? ''), 'publicId' => (string) ($th['publicId'] ?? ''), 'name' => (string) ($th['name'] ?? ''),
      'email' => (string) ($th['email'] ?? ''), 'at' => (int) ($th['at'] ?? 0), 'unread' => (int) ($th['unreadAdmin'] ?? 0),
      'last' => is_array($last) ? (($last['f'] === 'a' ? 'Vous : ' : '') . live_media_label($last)) : '',
      'prev' => is_array($show) ? (($show['f'] === 'a' ? 'Vous : ' : '') . live_media_label($show)) : '',
      'from' => is_array($show) ? (($show['f'] ?? 'u') === 'a' ? 'a' : 'u') : 'u',
      'ph' => function_exists('live_photo_of') ? live_photo_of((string) ($th['uid'] ?? '')) : '',
    ];
  }
  usort($out, static fn($a, $b) => [$b['unread'] > 0, $b['at']] <=> [$a['unread'] > 0, $a['at']]);
  return array_slice($out, 0, $limit);
}

function live_unread_admin(): int {
  $n = 0;
  foreach (glob(live_dir('threads') . '/*.json') ?: [] as $f) {
    $th = live_read_json($f, []);
    if ((int) ($th['unreadAdmin'] ?? 0) > 0) $n++;
  }
  return $n;
}

/* ---------- Actualités ---------- */

function live_posts_file(): string { return live_dir() . '/posts.json'; }

function live_posts(): array {
  $p = live_read_json(live_posts_file(), ['list' => []]);
  return array_values((array) ($p['list'] ?? []));
}

function live_add_post(string $text, string $img = '', string $link = ''): array {
  $post = ['id' => 'p' . bin2hex(random_bytes(6)), 't' => $text, 'at' => time(), 'views' => 0, 'likes' => 0];
  if ($img !== '') $post['img'] = $img;
  if ($link !== '' && preg_match('#^https://[^\s"<>]{4,300}$#', $link)) $post['link'] = $link;
  return live_update(live_posts_file(), function ($p) use ($post) {
    $list = (array) ($p['list'] ?? []);
    array_unshift($list, $post);
    return ['ok' => true, 'post' => $post, '__write' => ['list' => array_slice($list, 0, 60)]];
  }, ['list' => []]);
}

function live_del_post(string $id): bool {
  $r = live_update(live_posts_file(), function ($p) use ($id) {
    $list = array_values(array_filter((array) ($p['list'] ?? []), static fn($x) => ($x['id'] ?? '') !== $id));
    return ['ok' => true, '__write' => ['list' => $list]];
  }, ['list' => []]);
  return !empty($r['ok']);
}

/** Vues / « j'aime » : le téléphone envoie la liste des publications vues pour la 1re fois (une fois chacune). */
function live_post_count(array $ids, string $field): void {
  $ids = array_slice(array_values(array_filter($ids, static fn($i) => is_string($i) && preg_match('/^p[a-f0-9]{12}$/', $i))), 0, 30);
  if (!$ids || !in_array($field, ['views', 'likes'], true)) return;
  live_update(live_posts_file(), function ($p) use ($ids, $field) {
    $list = (array) ($p['list'] ?? []);
    $hit = false;
    foreach ($list as &$x) if (in_array($x['id'] ?? '', $ids, true)) { $x[$field] = (int) ($x[$field] ?? 0) + 1; $hit = true; }
    unset($x);
    return $hit ? ['ok' => true, '__write' => ['list' => $list]] : ['ok' => true];
  }, ['list' => []]);
}

/* =====================================================================================================
 * v2680 — AMIS : identifiant secret (OR + 10 caractères, sans O/0, I/1, L), conversations privées entre
 * joueurs (texte + photos), bloquer / signaler, recherche limitée (10 essais ratés / heure).
 * Fichiers : data/live/ids.json, data/live/dm/<a>__<b>.json, data/live/inbox/<uid>.json,
 * data/live/blocks/<uid>.json, data/live/reports.json
 * ===================================================================================================== */
const LIVE_ID_ALPHA = '23456789ABCDEFGHJKMNPQRSTVWXYZ'; // 30 signes : ni O/0, ni I/1, ni L, ni U
const LIVE_DM_HOUR = 600;       // messages privés par heure (v2905 : 60 → 600 ; les rafales sont arrêtées par LIVE_BURST_N)
const LIVE_NEWCONV_DAY = 40;    // nouvelles personnes contactées par jour (v2905 : 20 → 40, anti-démarchage)
const LIVE_FIND_MISS = 10;      // recherches ratées par heure avant blocage

function live_ids_file(): string { return live_dir() . '/ids.json'; }

function live_new_oro_id(array $taken): string {
  do {
    $s = 'OR';
    for ($i = 0; $i < 10; $i++) $s .= LIVE_ID_ALPHA[random_int(0, strlen(LIVE_ID_ALPHA) - 1)];
  } while (isset($taken[$s]));
  return $s;
}

/** Identifiant secret du joueur (créé à la 1re demande, puis toujours le même). */
function live_oro_id(array $user): string {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return '';
  $r = live_update(live_ids_file(), function ($m) use ($uid, $user) {
    $m['u'] = (array) ($m['u'] ?? []); $m['i'] = (array) ($m['i'] ?? []); $m['n'] = (array) ($m['n'] ?? []);
    $m['r'] = (array) ($m['r'] ?? []); $m['ri'] = (array) ($m['ri'] ?? []);
    $name = trim((string) ($user['displayName'] ?? $user['name'] ?? ''));
    $write = false;
    if (!isset($m['r'][$uid])) { $c = live_new_rid($m['ri']); $m['r'][$uid] = $c; $m['ri'][$c] = $uid; $write = true; } // v2777 : identifiant R…
    if (isset($m['u'][$uid])) {
      if ($name !== '' && ($m['n'][$uid] ?? '') !== $name) { $m['n'][$uid] = $name; $write = true; }
      return $write ? ['id' => $m['u'][$uid], '__write' => $m] : ['id' => $m['u'][$uid]];
    }
    $id = live_new_oro_id($m['i']);
    $m['u'][$uid] = $id; $m['i'][$id] = $uid; $m['n'][$uid] = $name !== '' ? $name : 'Joueur';
    return ['id' => $id, '__write' => $m];
  }, ['u' => [], 'i' => [], 'n' => [], 'r' => [], 'ri' => []]);
  return (string) ($r['id'] ?? '');
}

/* v2778 (propriétaire) — UN SEUL IDENTIFIANT sur tout le site, FACILE À RETENIR comme une plaque :
   « R » + 3 lettres + 3 chiffres, collés (ex. RKBT482). Tiré au hasard. Les lettres n'ont jamais I, L, O ni U (donc
   0 et 1 ne se confondent avec rien). 22³ × 1000 = 10,6 millions d'identifiants ; quand 30 % sont pris, le site passe
   TOUT SEUL à 4 lettres (234 millions), puis 5, etc. — jamais épuisé. Les robots qui devinent sont bloqués après
   10 recherches ratées par heure. Un ami peut aussi être retrouvé par son E-MAIL (jamais montré à personne).
   Le numéro du profil (ORO-123456) n'est pas accepté (il se devinait). L'ancien code de Social (OR…) reste compris. */
const LIVE_RID_LETTERS = 'ABCDEFGHJKMNPQRSTVWXYZ'; // 22 lettres : ni I, ni L, ni O, ni U
function live_new_rid(array $taken): string {
  $n = count($taken); $len = 3;
  while ($n > 0.3 * (22 ** $len) * 1000) $len++; // ça se remplit → une lettre de plus, tout seul
  do {
    $s = 'R';
    for ($i = 0; $i < $len; $i++) $s .= LIVE_RID_LETTERS[random_int(0, 21)];
    $s .= str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
  } while (isset($taken[$s]));
  return $s;
}
function live_norm_oro_id(string $s): string {
  $s = trim($s);
  if (strpos($s, '@') !== false) { // retrouver un ami par son e-mail
    $e = strtolower(preg_replace('/\s+/', '', $s) ?? '');
    return filter_var($e, FILTER_VALIDATE_EMAIL) ? 'E:' . $e : '';
  }
  $s = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $s) ?? '');
  if (preg_match('/^R([A-HJKMNP-TV-Z]{3,8})([0-9OIL]{3})$/', $s, $mm)) return 'R' . $mm[1] . strtr($mm[2], 'OIL', '011'); // O tapé à la place de 0…
  if (preg_match('/^R[2-9A-HJKMNP-TV-Z]{8}$/', $s)) return $s; // identifiants d'essai v2777
  if (preg_match('/^[O0]R([2-9A-HJKMNP-TV-Z]{10})$/', $s, $mm)) return 'OR' . $mm[1]; // ancien code de Social
  return '';
}
/** Joueur derrière un e-mail (adresse ACTUELLE du compte seulement ; comptes supprimés ou invités exclus). */
function live_uid_of_email(string $email): string {
  if (!function_exists('orolado_users_by_email') || str_ends_with($email, '@orolado.local')) return '';
  foreach (orolado_users_by_email(live_users_db(), $email) as $id => $u) {
    if (!is_array($u) || strtolower(trim((string) ($u['email'] ?? ''))) !== $email) continue;
    if (!empty($u['deletedAt']) || (string) ($u['role'] ?? '') === 'guest' || !empty($u['guest'])) continue;
    return (string) $id;
  }
  return '';
}
/** Identifiants R… de plusieurs joueurs d'un coup (créés s'il le faut) : [uid => R…]. Pour l'admin. */
function live_rids_for(array $uids): array {
  $uids = array_values(array_filter(array_map('strval', $uids), static fn($x) => $x !== ''));
  $r = live_update(live_ids_file(), function ($m) use ($uids) {
    $m['r'] = (array) ($m['r'] ?? []); $m['ri'] = (array) ($m['ri'] ?? []);
    $write = false;
    foreach ($uids as $uid) if (!isset($m['r'][$uid])) { $c = live_new_rid($m['ri']); $m['r'][$uid] = $c; $m['ri'][$c] = $uid; $write = true; }
    $out = array_intersect_key($m['r'], array_flip($uids));
    return $write ? ['map' => $out, '__write' => $m] : ['map' => $out];
  }, ['u' => [], 'i' => [], 'n' => [], 'r' => [], 'ri' => []]);
  return (array) ($r['map'] ?? []);
}
/** La base des comptes (lue une seule fois par demande). */
function live_users_db() { static $db = null; if ($db === null) $db = load_db(); return $db; }
/** L'identifiant AFFICHÉ d'un joueur : R + 8 signes au hasard (créé s'il n'existe pas encore). */
function live_code_of(string $uid): string {
  static $mem = null;
  if ($mem === null) $mem = (array) (live_read_json(live_ids_file(), [])['r'] ?? []); // lu une seule fois par demande
  if (isset($mem[$uid])) return (string) $mem[$uid];
  $u = live_users_db()['users'][$uid] ?? null;
  live_oro_id(['id' => $uid] + (is_array($u) ? $u : []));
  $c = (string) (live_read_json(live_ids_file(), [])['r'][$uid] ?? '');
  if ($c !== '') $mem[$uid] = $c;
  return $c;
}

/** Joueur derrière un identifiant (R…, e-mail « E:… » ou ancien code OR…) : ['uid','id' (R…),'name'] ou null. */
function live_who(string $oroId): ?array {
  $m = live_read_json(live_ids_file(), []);
  if (str_starts_with($oroId, 'E:')) $uid = live_uid_of_email(substr($oroId, 2));
  else $uid = (string) (str_starts_with($oroId, 'R') ? ($m['ri'][$oroId] ?? '') : ($m['i'][$oroId] ?? ''));
  $id = $uid !== '' ? live_code_of($uid) : '';
  if ($uid === '') return null;
  $u = live_users_db()['users'][$uid] ?? [];
  return ['uid' => $uid, 'id' => $id, 'name' => (string) ($m['n'][$uid] ?? (is_array($u) ? ($u['displayName'] ?? 'Joueur') : 'Joueur')), 'ph' => live_photo_of($uid)];
}

function live_who_uid(string $uid): ?array {
  $m = live_read_json(live_ids_file(), []);
  if (!isset($m['u'][$uid])) return null;
  return ['uid' => $uid, 'id' => live_code_of($uid), 'name' => (string) ($m['n'][$uid] ?? 'Joueur'), 'ph' => live_photo_of($uid)];
}


/** Recherche d'un ami : au-delà de 10 essais ratés en 1 h, plus de recherche (anti-devinette). */
function live_find_allowed(string $uid): bool {
  $f = live_dir('quota') . '/' . live_safe_id($uid) . '_miss.json';
  $q = live_read_json($f, []);
  $list = array_filter((array) ($q['t'] ?? []), static fn($t) => is_int($t) && $t > time() - 3600);
  return count($list) < LIVE_FIND_MISS;
}

function live_find_miss(string $uid): void { live_quota_ok($uid, 'miss', 1000, 3600); }

function live_pair(string $a, string $b): string {
  $x = [live_safe_id($a), live_safe_id($b)]; sort($x);
  return $x[0] . '__' . $x[1];
}

function live_dm_file(string $pair): string { return live_dir('dm') . '/' . live_safe_id(str_replace('__', 'XX9XX', $pair)) . '.json'; }

function live_blocks(string $uid): array { return array_values((array) (live_read_json(live_dir('blocks') . '/' . live_safe_id($uid) . '.json', [])['b'] ?? [])); }

function live_is_blocked(string $by, string $who): bool { return in_array($who, live_blocks($by), true); }

function live_set_block(string $uid, string $other, bool $on): void {
  live_update(live_dir('blocks') . '/' . live_safe_id($uid) . '.json', function ($q) use ($other, $on) {
    $b = array_values(array_filter((array) ($q['b'] ?? []), static fn($x) => $x !== $other));
    if ($on) $b[] = $other;
    return ['ok' => true, '__write' => ['b' => array_slice($b, -500)]];
  });
}

/** Boîte de réception : liste des conversations privées d'un joueur. */
function live_inbox_touch(string $uid, string $peer, int $at, bool $unread): void {
  live_update(live_dir('inbox') . '/' . live_safe_id($uid) . '.json', function ($q) use ($peer, $at, $unread) {
    $c = (array) ($q['c'] ?? []);
    $row = (array) ($c[$peer] ?? []);
    $row['at'] = $at;
    $row['un'] = $unread ? (int) ($row['un'] ?? 0) + 1 : 0;
    $c[$peer] = $row;
    uasort($c, static fn($x, $y) => (int) ($y['at'] ?? 0) <=> (int) ($x['at'] ?? 0));
    return ['ok' => true, '__write' => ['c' => array_slice($c, 0, 300, true)]];
  });
}

function live_inbox(string $uid): array { return (array) (live_read_json(live_dir('inbox') . '/' . live_safe_id($uid) . '.json', [])['c'] ?? []); }

function live_inbox_read(string $uid, string $peer): void {
  $f = live_dir('inbox') . '/' . live_safe_id($uid) . '.json';
  if (!is_file($f)) return;
  live_update($f, function ($q) use ($peer) {
    if ((int) ($q['c'][$peer]['un'] ?? 0) === 0) return ['ok' => true];
    $q['c'][$peer]['un'] = 0;
    return ['ok' => true, '__write' => $q];
  });
}

/** Message privé de $from vers $to. Refusé (sans le dire) si $to a bloqué $from. */
function live_dm_send(string $from, string $to, string $text, string $img = '', string $wh = ''): array {
  if ($from === '' || $to === '' || $from === $to || ($text === '' && $img === '')) return ['ok' => false, 'reason' => 'empty'];
  $msg = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => $from, 't' => $text, 'at' => time()];
  if ($img !== '') { $msg['img'] = $img; if ($wh !== '') $msg['wh'] = $wh; }
  $pair = live_pair($from, $to);
  // Bloqué par le destinataire : le message reste visible pour l'expéditeur seulement (il ne sait pas qu'il est bloqué).
  if (live_is_blocked($to, $from)) $msg['hid'] = $to;
  live_update(live_dm_file($pair), function ($th) use ($msg, $pair) {
    $th['pair'] = $pair;
    $msgs = (array) ($th['msgs'] ?? []);
    $msgs[] = $msg;
    $th['msgs'] = array_slice($msgs, -LIVE_THREAD_KEEP);
    $th['at'] = $msg['at'];
    return ['ok' => true, '__write' => $th];
  });
  live_inbox_touch($from, $to, $msg['at'], false);
  $delivered = !live_is_blocked($to, $from);
  if ($delivered) live_inbox_touch($to, $from, $msg['at'], true);
  return ['ok' => true, 'msg' => $msg, 'delivered' => $delivered];
}

/** Messages d'une conversation vus par $a (sans ceux envoyés par quelqu'un que $a a bloqué). */
function live_dm_thread(string $a, string $b): array {
  $all = (array) (live_read_json(live_dm_file(live_pair($a, $b)), [])['msgs'] ?? []);
  return array_values(array_filter($all, static fn($m) => (string) ($m['hid'] ?? '') !== $a));
}

/** Une photo appartient-elle à une conversation de ce joueur (support ou privée) ? */
function live_img_allowed(string $uid, string $name): bool {
  foreach ((array) (live_thread($uid)['msgs'] ?? []) as $m) if (($m['img'] ?? '') === $name) return true;
  foreach (array_keys(live_inbox($uid)) as $peer) {
    foreach (live_dm_thread($uid, (string) $peer) as $m) if (($m['img'] ?? '') === $name) return true;
  }
  return false;
}

/** Signalement d'un joueur : gardé pour l'admin avec les 20 derniers messages de la conversation. */
function live_report(string $by, string $who, string $why): void {
  $snap = array_slice(live_dm_thread($by, $who), -20);
  live_update(live_dir() . '/reports.json', function ($q) use ($by, $who, $why, $snap) {
    $l = (array) ($q['l'] ?? []);
    array_unshift($l, ['id' => 'r' . bin2hex(random_bytes(5)), 'by' => $by, 'who' => $who, 'why' => $why, 'at' => time(), 'snap' => $snap, 'done' => 0]);
    return ['ok' => true, '__write' => ['l' => array_slice($l, 0, 500)]];
  }, ['l' => []]);
}

function live_reports(): array { return (array) (live_read_json(live_dir() . '/reports.json', [])['l'] ?? []); }

/* =====================================================================================================
 * v2685 — DÉFIE TON AMI (en DÉMO, aucun argent réel) : invitation → accepte → compte à rebours 10 s →
 * chacun joue en démo pendant 3, 5 ou 10 min → le plus gros gain démo gagne. Score = somme des gains nets
 * des trades DÉMO ouverts pendant le défi (lus dans les ordres du serveur, impossible à truquer côté téléphone).
 * Fichiers : data/live/duels/<id>.json, data/live/duelpair/<paire>.json, data/live/duelstats.json
 * ===================================================================================================== */
const LIVE_DUEL_DAY = 30;          // défis lancés par joueur et par jour
const LIVE_DUEL_PENDING = 600;     // une invitation expire après 10 min

function live_duel_file(string $id): string { return live_dir('duels') . '/' . live_safe_id($id) . '.json'; }
function live_duel_pair_file(string $a, string $b): string { return live_dir('duelpair') . '/' . live_safe_id(str_replace('__', 'X9X', live_pair($a, $b))) . '.json'; }

function live_duel_last(string $a, string $b): ?array {
  $p = live_read_json(live_duel_pair_file($a, $b), []);
  $id = (string) ($p['id'] ?? '');
  if ($id === '') return null;
  $d = live_read_json(live_duel_file($id), []);
  return $d ?: null;
}

function live_duel_create(string $from, string $to, int $minutes): array {
  if (!in_array($minutes, [3, 5, 10], true)) $minutes = 5;
  $cur = live_duel_last($from, $to);
  if ($cur && in_array($cur['st'] ?? '', ['pending', 'active'], true) && !live_duel_expired($cur)) return ['ok' => false, 'reason' => 'duelBusy', 'duel' => $cur];
  if (!live_quota_ok($from, 'duel', LIVE_DUEL_DAY, 86400)) return ['ok' => false, 'reason' => 'tooMany'];
  $d = ['id' => 'd' . bin2hex(random_bytes(6)), 'a' => $from, 'b' => $to, 'min' => $minutes, 'st' => 'pending', 'at' => time()];
  live_write_json(live_duel_file($d['id']), $d);
  live_write_json(live_duel_pair_file($from, $to), ['id' => $d['id']]);
  return ['ok' => true, 'duel' => $d];
}

function live_duel_expired(array $d): bool {
  return ($d['st'] ?? '') === 'pending' && time() - (int) ($d['at'] ?? 0) > LIVE_DUEL_PENDING;
}

function live_duel_answer(string $id, string $uid, bool $accept): array {
  $r = live_update(live_duel_file($id), function ($d) use ($uid, $accept) {
    if (!$d || ($d['b'] ?? '') !== $uid || ($d['st'] ?? '') !== 'pending' || live_duel_expired($d)) return ['ok' => false, 'reason' => 'duelGone'];
    if (!$accept) { $d['st'] = 'refused'; return ['ok' => true, 'duel' => $d, '__write' => $d]; }
    $d['st'] = 'active';
    $d['start'] = time() + 10;
    $d['end'] = $d['start'] + (int) $d['min'] * 60;
    return ['ok' => true, 'duel' => $d, '__write' => $d];
  });
  return is_array($r) ? $r : ['ok' => false];
}

/** Gain net DÉMO de $uid sur les trades ouverts entre start et end (réglés). */
function live_duel_score(array $db, string $uid, int $start, int $end): array {
  $net = 0.0; $n = 0; $w = 0;
  foreach (orolado_orders_recent(['orders' => (array) ($db['orders'] ?? [])] + $db, [$uid], 'demo') as $o) {
    if (!is_array($o) || (string) ($o['userId'] ?? '') !== $uid || ($o['mode'] ?? '') !== 'demo') continue;
    $at = (float) ($o['at'] ?? $o['openedAt'] ?? 0);
    if ($at < $start || $at > $end) continue;
    if (!isset($o['net']) || ($o['status'] ?? '') === 'open') continue;
    $net += (float) $o['net']; $n++;
    if (!empty($o['won'])) $w++;
  }
  return ['net' => round($net, 2), 'n' => $n, 'w' => $w];
}

/** État du défi (scores en direct ; à la fin : gagnant, statistiques, message dans la conversation). */
function live_duel_state(array $d, ?array $db = null): array {
  if (($d['st'] ?? '') === 'pending' && live_duel_expired($d)) $d['st'] = 'expired';
  if (in_array($d['st'] ?? '', ['active', 'done'], true) && ($d['st'] === 'active' || !isset($d['sa']))) {
    $db = $db ?? load_db();
    $d['sa'] = live_duel_score($db, (string) $d['a'], (int) $d['start'], (int) $d['end']);
    $d['sb'] = live_duel_score($db, (string) $d['b'], (int) $d['start'], (int) $d['end']);
    // Fini (20 s après la fin, le temps que les derniers trades se règlent) : on fige le résultat une seule fois.
    if ($d['st'] === 'active' && time() > (int) $d['end'] + 20) {
      $fin = live_update(live_duel_file((string) $d['id']), function ($x) use ($d) {
        if (($x['st'] ?? '') !== 'active') return ['ok' => true, 'duel' => $x];
        $x['st'] = 'done'; $x['sa'] = $d['sa']; $x['sb'] = $d['sb'];
        $x['win'] = $d['sa']['net'] > $d['sb']['net'] ? $x['a'] : ($d['sb']['net'] > $d['sa']['net'] ? $x['b'] : '');
        return ['ok' => true, 'duel' => $x, 'fresh' => true, '__write' => $x];
      });
      if (is_array($fin) && !empty($fin['fresh'])) {
        $x = $fin['duel'];
        live_update(live_dir() . '/duelstats.json', function ($s) use ($x) {
          foreach ([(string) $x['a'], (string) $x['b']] as $u) {
            $s[$u] = (array) ($s[$u] ?? ['w' => 0, 'l' => 0, 't' => 0]);
            if ($x['win'] === '') $s[$u]['t']++; elseif ($x['win'] === $u) $s[$u]['w']++; else $s[$u]['l']++;
          }
          return ['ok' => true, '__write' => $s];
        });
      }
      if (is_array($fin) && isset($fin['duel'])) $d = $fin['duel'];
    }
  }
  return $d;
}

function live_duel_stats(string $uid): array {
  $s = live_read_json(live_dir() . '/duelstats.json', []);
  return (array) ($s[$uid] ?? ['w' => 0, 'l' => 0, 't' => 0]);
}

/* =====================================================================================================
 * v2687 — JEUX DU JOUR (démo uniquement, aucune valeur réelle) : Roue du jour, Quiz du jour, statistiques, badges.
 * Une roue et un quiz par jour et par joueur (contrôlé par le serveur). Le gain va sur le solde DÉMO.
 * ===================================================================================================== */
const LIVE_WHEEL = [1000, 1000, 2000, 2000, 3000, 5000, 5000, 10000, 20000, 50000];

function live_fun_file(string $uid): string { return live_dir('fun') . '/' . live_safe_id($uid) . '.json'; }
function live_day(): string { return gmdate('Y-m-d'); }

/** Crédite le solde DÉMO du joueur (sans toucher au réel). */
function live_demo_credit(string $uid, float $amount): float {
  $r = with_db_lock(function ($box) use ($uid, $amount) {
    if (!isset($box->db['vault'][$uid]) || !is_array($box->db['vault'][$uid])) $box->db['vault'][$uid] = ['demo' => 0, 'real' => 0];
    $box->db['vault'][$uid]['demo'] = orolado_money((float) ($box->db['vault'][$uid]['demo'] ?? 0) + $amount);
    return ['ok' => true, 'demo' => $box->db['vault'][$uid]['demo']];
  });
  return (float) ($r['demo'] ?? 0);
}


function live_wheel_spin(string $uid): array {
  $r = live_update(live_fun_file($uid), function ($f) {
    if (($f['wheelDay'] ?? '') === live_day()) return ['ok' => false, 'reason' => 'wheelDone'];
    $i = random_int(0, count(LIVE_WHEEL) - 1);
    $f['wheelDay'] = live_day(); $f['wheels'] = (int) ($f['wheels'] ?? 0) + 1;
    return ['ok' => true, 'i' => $i, 'prize' => LIVE_WHEEL[$i], '__write' => $f];
  });
  if (!empty($r['ok'])) $r['demo'] = live_demo_credit($uid, (float) $r['prize']);
  return $r;
}

/* v2689 (propriétaire) — QUIZ : 50 questions, 5 par jour et par joueur (choisies par le serveur), bonne réponse gardée
 * par le serveur, récompense = POINTS DE NIVEAU (plus d'argent démo : il faussait le tournoi démo).
 * Les textes sont dans js/live-quiz-data.js : la 1re réponse est la bonne ; l'ordre affiché suit live_quiz_perm. */
const LIVE_QUIZ_N = 50;
const LIVE_QUIZ_DAY = 5;
const LIVE_QUIZ_PERMS = [[0, 1, 2], [1, 0, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0]];
function live_quiz_perm(int $i): array { return LIVE_QUIZ_PERMS[($i * 7 + 3) % 6]; }
/** Les 5 questions du jour de ce joueur (toujours les mêmes pour lui ce jour-là). */
function live_quiz_set(string $uid, string $day): array {
  $h = hash('sha256', 'quiz|' . $uid . '|' . $day, true);
  $set = []; $k = 0;
  while (count($set) < LIVE_QUIZ_DAY && $k < 200) {
    $i = (ord($h[$k % 32]) * 256 + ord($h[($k + 7) % 32]) + $k * 13) % LIVE_QUIZ_N;
    if (!in_array($i, $set, true)) $set[] = $i;
    $k++;
  }
  return $set;
}
function live_quiz_answer(string $uid, int $q, int $pick): array {
  $day = live_day();
  if (!in_array($q, live_quiz_set($uid, $day), true) || $pick < 0 || $pick > 2) return ['ok' => false, 'reason' => 'quizDone'];
  $right = (int) array_search(0, live_quiz_perm($q), true);
  $good = $pick === $right;
  $r = live_update(live_fun_file($uid), function ($f) use ($q, $good, $day) {
    if (($f['qDay'] ?? '') !== $day) { $f['qDay'] = $day; $f['qDone'] = []; }
    if (isset($f['qDone'][(string) $q])) return ['ok' => false, 'reason' => 'quizDone'];
    $f['qDone'][(string) $q] = $good ? 1 : 0;
    $f['quizN'] = (int) ($f['quizN'] ?? 0) + 1;
    if ($good) $f['quizOk'] = (int) ($f['quizOk'] ?? 0) + 1;
    $wk = gmdate('o-W');
    if (($f['wk'] ?? '') !== $wk) { $f['wk'] = $wk; $f['wkQuiz'] = 0; }
    $f['wkQuiz'] = (int) ($f['wkQuiz'] ?? 0) + 1;
    return ['ok' => true, '__write' => $f];
  });
  if (empty($r['ok'])) return $r;
  return ['ok' => true, 'good' => $good, 'right' => $right, 'xp' => $good ? LIVE_XP_QUIZ_OK : LIVE_XP_QUIZ];
}

/* v2689 — NIVEAUX (points d'expérience, aucune valeur en argent) et MISSIONS DE LA SEMAINE. */
const LIVE_XP_QUIZ = 0;   // v2785 : une mauvaise réponse ne rapporte rien
const LIVE_XP_QUIZ_OK = 1; // v2785 : bonne réponse = 1 point
// v2760 (propriétaire) : monter est DUR — la plupart des joueurs restent niveau 1 ou 2 ; ceux qui montent jouent beaucoup
// (surtout en réel), déposent, invitent des amis qui déposent, créent des groupes, réussissent les missions.
// v2785 (propriétaire) : encore BEAUCOUP plus dur et honnête — on monte par la vraie activité (jours joués, trades réels,
// vrais dépôts, amis qui déposent, groupes actifs, quiz, défis, missions). Les gros montants ne font plus sauter des niveaux
// (racine carrée), l'argent ajouté par l'admin ne compte pas, le compte admin ne gagne rien en « réel ».
const LIVE_XP_LEVELS = [0, 300, 1000, 2500, 5000, 9000, 15000, 25000, 40000, 65000, 100000, 160000];
const LIVE_MISSION_XP = 15;

function live_fun_state(string $uid): array {
  $f = live_read_json(live_fun_file($uid), []);
  $day = live_day();
  $done = (($f['qDay'] ?? '') === $day) ? (array) ($f['qDone'] ?? []) : [];
  return ['quizSet' => live_quiz_set($uid, $day), 'quizDone' => (object) $done, 'quizOk' => (int) ($f['quizOk'] ?? 0), 'quizN' => (int) ($f['quizN'] ?? 0),
    'wheels' => (int) ($f['wheels'] ?? 0)];
}

function live_level(int $xp): array {
  $lv = 1;
  foreach (LIVE_XP_LEVELS as $i => $need) if ($xp >= $need) $lv = $i + 1;
  $cur = LIVE_XP_LEVELS[$lv - 1];
  $next = LIVE_XP_LEVELS[$lv] ?? null;
  return ['level' => $lv, 'xp' => $xp, 'from' => $cur, 'to' => $next, 'pct' => $next ? (int) floor(($xp - $cur) * 100 / max(1, $next - $cur)) : 100];
}

/** Statistiques (trades gardés par le serveur), niveau, missions de la semaine, badges. */
function live_my_stats(string $uid): array {
  $db = load_db();
  $n = 0; $w = 0; $best = 0; $cur = 0; $mk = []; $real = 0; $realVol = 0.0; $wkReal = 0;
  $wkStart = (int) strtotime('monday this week 00:00:00 UTC'); if ($wkStart > time()) $wkStart -= 7 * 86400;
  $wkN = 0; $wkMk = []; $wkBest = 0; $wkCur = 0;
  $rows = array_values(array_filter(orolado_orders_recent(['orders' => (array) ($db['orders'] ?? [])] + $db, [$uid]), static fn($o) => is_array($o) && (string) ($o['userId'] ?? '') === $uid && isset($o['net'])));
  usort($rows, static fn($a, $b) => ((float) ($a['at'] ?? 0)) <=> ((float) ($b['at'] ?? 0)));
  $uRow = $db['users'][$uid] ?? [];
  $isAdm = function_exists('orolado_is_admin_user') && is_array($uRow) && orolado_is_admin_user($uRow + ['id' => $uid]);
  $days = [];
  foreach ($rows as $o) {
    $n++; $isReal = !$isAdm && ($o['mode'] ?? '') === 'real';
    $t = (float) ($o['at'] ?? 0); if ($t > 1e12) $t /= 1000; if ($t > 0) $days[gmdate('Y-m-d', (int) $t)] = 1;
    if ($isReal) { $real++; $realVol += max(0.0, (float) ($o['stake'] ?? 0)); }
    $won = !empty($o['won']);
    if ($won) { $w++; $cur++; $best = max($best, $cur); } elseif (empty($o['voided'])) { $cur = 0; }
    $a = (string) ($o['assetId'] ?? ''); if ($a !== '') $mk[$a] = ($mk[$a] ?? 0) + 1;
    if ((float) ($o['at'] ?? 0) >= $wkStart) {
      $wkN++; if ($a !== '') $wkMk[$a] = 1; if ($isReal) $wkReal++;
      if ($won) { $wkCur++; $wkBest = max($wkBest, $wkCur); } elseif (empty($o['voided'])) { $wkCur = 0; }
    }
  }
  arsort($mk);
  $d = live_duel_stats($uid);
  $f = live_read_json(live_fun_file($uid), []);
  $quizOk = (int) ($f['quizOk'] ?? 0); $quizN = (int) ($f['quizN'] ?? 0);
  $wkQuiz = (($f['wk'] ?? '') === gmdate('o-W')) ? (int) ($f['wkQuiz'] ?? 0) : 0;
  $friends = count(live_inbox($uid));
  // Missions de la semaine (calculées par le serveur ; chaque mission réussie est gardée pour toujours).
  // v2760 (propriétaire) : missions plus difficiles (5 par semaine)
  $missions = [
    'trades' => ['have' => min(50, $wkN), 'need' => 50],
    'real' => ['have' => min(10, $wkReal), 'need' => 10],
    'markets' => ['have' => min(5, count($wkMk)), 'need' => 5],
    'streak' => ['have' => min(5, $wkBest), 'need' => 5],
    'quiz' => ['have' => min(20, $wkQuiz), 'need' => 20],
  ];
  $wk = gmdate('o-W');
  $newDone = [];
  foreach ($missions as $k => $m) if ($m['have'] >= $m['need'] && empty($f['missions'][$wk][$k])) $newDone[] = $k;
  if ($newDone) {
    live_update(live_fun_file($uid), function ($ff) use ($wk, $newDone) {
      foreach ($newDone as $k) $ff['missions'][$wk][$k] = 1;
      // on ne garde que les 12 dernières semaines en détail, le total reste compté
      $ff['missionsTotal'] = (int) ($ff['missionsTotal'] ?? 0) + count($newDone);
      if (count($ff['missions']) > 12) $ff['missions'] = array_slice($ff['missions'], -12, null, true);
      return ['ok' => true, '__write' => $ff];
    });
    $f = live_read_json(live_fun_file($uid), []);
  }
  foreach ($missions as $k => &$m) $m['done'] = !empty($f['missions'][$wk][$k]);
  unset($m);
  $missionsTotal = (int) ($f['missionsTotal'] ?? 0);
  // Points de niveau : on joue, on apprend, on défie, on se fait des amis.
  // v2760 : vrais dépôts du joueur (les cadeaux du Défi / de l'invitation ne comptent pas), amis invités qui ont déposé, groupes créés
  $dep = 0.0;
  foreach ((array) (($db['users'][$uid] ?? [])['transactions'] ?? []) as $tx) {
    if (!is_array($tx) || ($tx['type'] ?? '') !== 'deposit' || (($tx['mode'] ?? 'real') !== 'real')) continue;
    $tid = (string) ($tx['id'] ?? ''); $note = (string) ($tx['note'] ?? '');
    if (strpos($tid, 'aff_') === 0 || stripos($note, 'Défi') !== false || stripos($note, 'bonus') !== false || stripos($note, 'cadeau') !== false) continue;
    if ($isAdm || stripos($note, 'Recharge') !== 0) continue; // v2785 : seulement les VRAIS dépôts (Flutterwave, Crypto, Maketou)
    $dep += max(0.0, (float) ($tx['amount'] ?? 0));
  }
  $invPaid = 0; $invAll = 0;
  if (function_exists('orolado_aff_read') && function_exists('orolado_aff_owner_name')) {
    try { $own = orolado_aff_read(orolado_aff_owner_name($uid)); $fr = is_array($own['friends'] ?? null) ? $own['friends'] : [];
      $invAll = count($fr); $invPaid = count(array_filter($fr, static fn($x) => !empty($x['paid']))); } catch (Throwable $e) { /* jamais bloquant */ }
  }
  $groupsOwned = 0;
  foreach (live_ugroups($uid) as $gid) { $g = live_group_get((string) $gid); if ($g && (string) ($g['owner'] ?? '') === $uid && count((array) ($g['members'] ?? [])) >= 3) $groupsOwned++; }
  // v2785 : jours actifs ×6 · trades démo ÷20 · trade réel ×1 · volume réel √×3 · vrais dépôts √×10 · quiz réussi ×1 ·
  // défi gagné ×5 (joué ×1) · amis ×2 (20 max) · invités ×5 (50 max), invités qui ont déposé ×60 · groupe actif ×25 (5 max) · mission ×15
  $xp = count($days) * 6 + intdiv(max(0, $n - $real), 20) + $real + (int) floor(sqrt($realVol) * 3) + (int) floor(sqrt($dep) * 10)
    + $quizOk + (int) $d['w'] * 5 + ((int) $d['w'] + (int) $d['l'])
    + min(20, $friends) * 2 + min(50, $invAll) * 5 + $invPaid * 60 + min(5, $groupsOwned) * 25 + $missionsTotal * LIVE_MISSION_XP;
  $lv = live_level($xp);
  $badges = [
    'first' => $n >= 1, 't10' => $n >= 10, 't100' => $n >= 100, 'streak5' => $best >= 5, 'sharp' => $n >= 20 && $w / max(1, $n) >= 0.55,
    'duel' => (int) $d['w'] >= 1, 'friend' => $friends >= 1, 'quiz' => $quizOk >= 1, 'quiz50' => $quizOk >= 50, 'mission' => $missionsTotal >= 1,
    'level5' => $lv['level'] >= 5, 'real' => $real >= 1,
  ];
  return ['n' => $n, 'w' => $w, 'rate' => $n ? round($w * 100 / $n) : 0, 'best' => $best, 'fav' => (string) (array_key_first($mk) ?? ''), 'duel' => $d,
    'quizOk' => $quizOk, 'friends' => $friends, 'badges' => $badges, 'lv' => $lv, 'missions' => $missions, 'missionXp' => LIVE_MISSION_XP];
}

/* =====================================================================================================
 * v2688 — GROUPES (communauté) : créer un groupe (nom + emoji), inviter par lien, discuter à plusieurs
 * (texte + photos), membres, quitter, le créateur peut retirer quelqu'un. Limites cachées.
 * Fichiers : data/live/groups/<id>.json, data/live/ugroups/<uid>.json, data/live/gtok/<jeton>.json
 * ===================================================================================================== */
const LIVE_GROUP_OWN = 5;       // v2790 : groupes créés par joueur sur 90 jours (limite jamais affichée à l'avance)
const LIVE_GROUP_DAYS = 90;
const LIVE_GROUP_INV_MAX = 30;  // invitations en attente gardées par joueur (30 jours)
const LIVE_GROUP_MAX = 5000;    // membres par groupe (v2689 : protection du serveur seulement, jamais affichée aux joueurs)
const LIVE_GROUP_HOUR = 120;    // messages de groupe par heure (v2905 : 60 → 120)
const LIVE_GROUP_DAY = 500;     // v2905 : publications d'un créateur par jour (garde-fou, jamais affiché à l'avance)

function live_group_file(string $gid): string { return live_dir('groups') . '/' . live_safe_id($gid) . '.json'; }
function live_ugroups_file(string $uid): string { return live_dir('ugroups') . '/' . live_safe_id($uid) . '.json'; }
function live_ugroups(string $uid): array { return array_values((array) (live_read_json(live_ugroups_file($uid), [])['g'] ?? [])); }

function live_ugroups_set(string $uid, string $gid, bool $in): void {
  live_update(live_ugroups_file($uid), function ($q) use ($gid, $in) {
    $g = array_values(array_filter((array) ($q['g'] ?? []), static fn($x) => $x !== $gid));
    if ($in) array_unshift($g, $gid);
    // v2790 : garde aussi les créations et invitations ; v2905 : 500 groupes (avant 100 : un vieux groupe pouvait sortir de la liste)
    return ['ok' => true, '__write' => array_merge((array) $q, ['g' => array_slice($g, 0, 500)])];
  });
}

/** v2905 : un groupe tel qu'il est rangé, remis d'aplomb (vieux fichiers, champs manquants) — jamais d'erreur PHP. */
function live_group_norm(array $g): array {
  $g['id'] = (string) ($g['id'] ?? '');
  $g['name'] = (string) ($g['name'] ?? '');
  $g['emoji'] = (string) ($g['emoji'] ?? '💬');
  $g['owner'] = (string) ($g['owner'] ?? '');
  $g['members'] = array_values(array_filter(array_map('strval', (array) ($g['members'] ?? [])), static fn($m) => $m !== ''));
  $g['msgs'] = array_values(array_filter((array) ($g['msgs'] ?? []), 'is_array'));
  $g['tok'] = (string) ($g['tok'] ?? '');
  $g['at'] = (int) ($g['at'] ?? 0);
  return $g;
}
/** Le groupe (null s'il n'existe pas ou a été supprimé par son créateur). */
function live_group_get(string $gid): ?array {
  if (live_safe_id($gid) === '') return null;
  $g = live_read_json(live_group_file($gid), []);
  if (!$g || !empty($g['del'])) return null;
  $g = live_group_norm($g);
  return $g['id'] !== '' ? $g : null;
}
/** v2905 : le groupe a-t-il été supprimé par son créateur ? (pour afficher « groupe supprimé » proprement) */
function live_group_deleted(string $gid): bool {
  if (live_safe_id($gid) === '') return false;
  return !empty(live_read_json(live_group_file($gid), [])['del']);
}
/** v2905 : lien d'invitation toujours valable (vieux groupe sans jeton ou jeton perdu → recréé, idempotent). */
function live_group_ensure_tok(array $g): array {
  if ($g['id'] === '') return $g;
  $tok = preg_replace('/[^a-f0-9]/', '', (string) $g['tok']) ?? '';
  if ($tok !== '' && (string) (live_read_json(live_dir('gtok') . '/' . $tok . '.json', [])['g'] ?? '') === $g['id']) return $g;
  $r = live_update(live_group_file($g['id']), function ($cur) {
    if (!$cur || !empty($cur['del'])) return ['ok' => false];
    $t = preg_replace('/[^a-f0-9]/', '', (string) ($cur['tok'] ?? '')) ?? '';
    if ($t === '') { $t = bin2hex(random_bytes(6)); $cur['tok'] = $t; return ['ok' => true, 'tok' => $t, '__write' => $cur]; }
    return ['ok' => true, 'tok' => $t];
  });
  if (!empty($r['tok'])) { live_write_json(live_dir('gtok') . '/' . $r['tok'] . '.json', ['g' => $g['id']]); $g['tok'] = (string) $r['tok']; }
  return $g;
}
/** v2905 : jeton d'un lien d'invitation → identifiant du groupe ('' si inconnu). */
function live_group_by_tok(string $tok): string {
  $tok = preg_replace('/[^a-f0-9]/', '', strtolower($tok)) ?? '';
  if ($tok === '' || strlen($tok) > 40) return '';
  return live_safe_id((string) (live_read_json(live_dir('gtok') . '/' . $tok . '.json', [])['g'] ?? ''));
}

function live_group_clean_name(string $n): string {
  $n = trim(preg_replace('/\s+/u', ' ', live_clean_text($n)) ?? '');
  return preg_match('/^.{1,40}/us', $n, $m) ? $m[0] : '';
}

function live_group_create(string $uid, string $name, string $emoji): array {
  $name = live_group_clean_name($name);
  if ($name === '' || preg_match_all('/./us', $name) < 2) return ['ok' => false, 'reason' => 'gName'];
  $q = live_read_json(live_ugroups_file($uid), []);
  $since = time() - LIVE_GROUP_DAYS * 86400;
  $made = array_values(array_filter((array) ($q['made'] ?? []), static fn($t) => is_int($t) && $t > $since));
  if (count($made) >= LIVE_GROUP_OWN) return ['ok' => false, 'reason' => 'tooManyG'];
  $emoji = preg_match('/^[^\sA-Za-z0-9<>"\'&]{1,8}$/u', $emoji) ? $emoji : '💬';
  $gid = 'g' . bin2hex(random_bytes(6));
  $tok = bin2hex(random_bytes(6));
  $g = ['id' => $gid, 'name' => $name, 'emoji' => $emoji, 'owner' => $uid, 'members' => [$uid], 'tok' => $tok, 'msgs' => [], 'at' => time()];
  live_write_json(live_group_file($gid), $g);
  live_write_json(live_dir('gtok') . '/' . $tok . '.json', ['g' => $gid]);
  live_update(live_ugroups_file($uid), function ($q) use ($gid) {
    $g = array_values((array) ($q['g'] ?? [])); array_unshift($g, $gid);
    $since = time() - LIVE_GROUP_DAYS * 86400;
    $made = array_values(array_filter((array) ($q['made'] ?? []), static fn($t) => is_int($t) && $t > $since));
    $made[] = time();
    $mine = array_values(array_unique(array_merge([$gid], array_map('strval', (array) ($q['mine'] ?? [])))));
    return ['ok' => true, '__write' => array_merge((array) $q, ['g' => $g, 'own' => (int) ($q['own'] ?? 0) + 1, 'made' => $made, 'mine' => $mine])];
  });
  return ['ok' => true, 'g' => $g];
}
/** v2905 : les groupes d'un joueur, y compris ceux qu'il a créés (jamais perdus de sa liste). */
function live_ugroups_all(string $uid): array {
  $q = live_read_json(live_ugroups_file($uid), []);
  return array_values(array_unique(array_map('strval', array_merge((array) ($q['g'] ?? []), (array) ($q['mine'] ?? [])))));
}

function live_group_join(string $uid, string $tok): array {
  $gid = live_group_by_tok($tok);
  if ($gid === '') return ['ok' => false, 'reason' => 'gGone'];
  $r = live_update(live_group_file($gid), function ($g) use ($uid) {
    if (!$g || !empty($g['del'])) return ['ok' => false, 'reason' => 'gGone'];
    $g = live_group_norm($g);
    if (in_array($uid, $g['members'], true)) return ['ok' => true, 'g' => $g, 'already' => true];
    if (in_array($uid, (array) ($g['kicked'] ?? []), true)) return ['ok' => false, 'reason' => 'gGone'];
    if (count($g['members']) >= LIVE_GROUP_MAX) return ['ok' => false, 'reason' => 'gFull'];
    $g['members'][] = $uid;
    return ['ok' => true, 'g' => $g, 'joined' => true, '__write' => $g];
  });
  if (!empty($r['ok'])) live_ugroups_set($uid, $gid, true);
  unset($r['__write']);
  return $r;
}

/** v2905 : aperçu d'un lien d'invitation (comme WhatsApp) : logo, nom, nombre de membres, créateur — sans les messages. */
function live_group_peek(string $tok, string $uid = ''): array {
  $gid = live_group_by_tok($tok);
  $g = $gid !== '' ? live_group_get($gid) : null;
  if (!$g || $g['tok'] === '' || !hash_equals($g['tok'], preg_replace('/[^a-f0-9]/', '', strtolower($tok)) ?? '')) return ['ok' => false, 'reason' => 'gGone'];
  if ($uid !== '' && in_array($uid, (array) ($g['kicked'] ?? []), true)) return ['ok' => false, 'reason' => 'gGone'];
  $w = live_who_uid($g['owner']);
  $o = ['id' => $g['id'], 'name' => $g['name'], 'emoji' => $g['emoji'], 'n' => count($g['members']), 'admin' => (string) ($w['name'] ?? ''), 'adminPh' => (string) ($w['ph'] ?? '')];
  if (!empty($g['photo'])) $o['photo'] = 'live.php?p=' . rawurlencode((string) $g['photo']);
  if ($uid !== '') { $o['member'] = in_array($uid, $g['members'], true); $o['mine'] = $g['owner'] === $uid; }
  return ['ok' => true, 'g' => $o];
}

function live_group_send(string $uid, string $gid, string $text, string $img = '', string $wh = ''): array {
  $msg = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => $uid, 't' => $text, 'at' => time()];
  if ($img !== '') $msg['img'] = $img;
  if ($img !== '' && $wh !== '') $msg['wh'] = $wh;
  return live_update(live_group_file($gid), function ($g) use ($uid, $msg) {
    if (!$g || !empty($g['del'])) return ['ok' => false, 'reason' => 'gGone'];
    $g = live_group_norm($g);
    if (!in_array($uid, $g['members'], true)) return ['ok' => false, 'reason' => 'gGone'];
    if ($g['owner'] !== $uid) return ['ok' => false, 'reason' => 'gOwnerOnly']; // v2790 (propriétaire) : seul le créateur écrit
    $g['msgs'][] = $msg;
    $g['msgs'] = array_slice($g['msgs'], -LIVE_THREAD_KEEP); $g['at'] = $msg['at'];
    return ['ok' => true, 'msg' => $msg, 'g' => $g, '__write' => $g];
  });
}

/** Quitter un groupe (ou, pour le créateur, retirer quelqu'un). v2905 : le créateur ne quitte jamais son groupe
    (il le supprime : live_group_delete) — avant, il pouvait partir et laisser un groupe orphelin. */
function live_group_leave(string $uid, string $gid, string $who = ''): array {
  $target = $who !== '' ? $who : $uid;
  $r = live_update(live_group_file($gid), function ($g) use ($uid, $target) {
    if (!$g || !empty($g['del'])) return ['ok' => false, 'reason' => 'gGone'];
    $g = live_group_norm($g);
    if ($target !== $uid && $g['owner'] !== $uid) return ['ok' => false, 'reason' => 'gOwner'];
    if ($target === $g['owner']) return ['ok' => false, 'reason' => 'gOwnerLeave'];
    if (!in_array($target, $g['members'], true)) return ['ok' => true, 'gone' => true]; // déjà parti : rien à faire
    $g['members'] = array_values(array_filter($g['members'], static fn($m) => $m !== $target));
    if ($target !== $uid) { $g['kicked'] = array_values(array_unique(array_merge((array) ($g['kicked'] ?? []), [$target]))); }
    return ['ok' => true, '__write' => $g];
  });
  if (!empty($r['ok'])) live_ugroups_set($target, $gid, false);
  unset($r['__write']);
  return $r;
}

/** v2905 (propriétaire) : le CRÉATEUR supprime son groupe pour tout le monde. Le fichier est gardé (marqué supprimé,
    pour l'équipe), le lien d'invitation ne marche plus, le groupe disparaît chez tous les membres. Idempotent. */
function live_group_delete(string $uid, string $gid): array {
  $r = live_update(live_group_file($gid), function ($g) use ($uid) {
    if (!$g) return ['ok' => false, 'reason' => 'gGone'];
    if (!empty($g['del'])) return ['ok' => (string) ($g['owner'] ?? '') === $uid, 'reason' => 'gGone', 'tok' => ''];
    if ((string) ($g['owner'] ?? '') !== $uid) return ['ok' => false, 'reason' => 'gOwner'];
    $g['del'] = time();
    return ['ok' => true, 'tok' => (string) ($g['tok'] ?? ''), '__write' => $g];
  });
  if (empty($r['ok'])) { unset($r['__write'], $r['tok']); return $r; }
  $tok = preg_replace('/[^a-f0-9]/', '', (string) ($r['tok'] ?? '')) ?? '';
  if ($tok !== '') @unlink(live_dir('gtok') . '/' . $tok . '.json');
  live_ugroups_set($uid, $gid, false);
  live_update(live_ugroups_file($uid), function ($q) use ($gid) {
    $q['mine'] = array_values(array_filter(array_map('strval', (array) ($q['mine'] ?? [])), static fn($x) => $x !== $gid));
    return ['ok' => true, '__write' => $q];
  });
  return ['ok' => true];
}

/** v2905 : photo du groupe (créateur seulement) ; '' = retour au logo. */
function live_group_set_photo(string $uid, string $gid, string $file): array {
  $r = live_update(live_group_file($gid), function ($g) use ($uid, $file) {
    if (!$g || !empty($g['del'])) return ['ok' => false, 'reason' => 'gGone'];
    if ((string) ($g['owner'] ?? '') !== $uid) return ['ok' => false, 'reason' => 'gOwner'];
    if ($file === '') unset($g['photo']); else $g['photo'] = $file;
    return ['ok' => true, '__write' => $g];
  });
  unset($r['__write']);
  return $r;
}
/** v2905 : le créateur change le logo de son groupe. */
function live_group_set_emoji(string $uid, string $gid, string $emoji): array {
  if (!preg_match('/^[^\sA-Za-z0-9<>"\'&]{1,8}$/u', $emoji)) return ['ok' => false, 'reason' => 'fail'];
  $r = live_update(live_group_file($gid), function ($g) use ($uid, $emoji) {
    if (!$g || !empty($g['del'])) return ['ok' => false, 'reason' => 'gGone'];
    if ((string) ($g['owner'] ?? '') !== $uid) return ['ok' => false, 'reason' => 'gOwner'];
    $g['emoji'] = $emoji; unset($g['photo']);
    return ['ok' => true, '__write' => $g];
  });
  unset($r['__write']);
  return $r;
}

/**
 * v2706 (propriétaire, comme WhatsApp) — AJOUTER des membres : un membre ajoute directement ses contacts
 * (les joueurs avec qui il a déjà une conversation dans « Amis »). Pas de lien à partager.
 * Refusé : pas un contact, contact qui l'a bloqué, joueur retiré par le créateur (sauf si c'est le créateur qui ajoute).
 * Chaque ajout laisse une petite ligne dans la discussion (« X a ajouté Y »).
 */
function live_group_add(string $uid, string $gid, array $peers): array {
  $contacts = live_inbox($uid);
  $ok = [];
  foreach (array_slice(array_values(array_unique($peers)), 0, 30) as $p) {
    $p = (string) $p;
    if ($p === '' || $p === $uid || !isset($contacts[$p])) continue;
    if (live_is_blocked($p, $uid)) continue;
    $ok[] = $p;
  }
  if (!$ok) return ['ok' => false, 'reason' => 'gNoneAdded'];
  $added = [];
  $r = live_update(live_group_file($gid), function ($g) use ($uid, $ok, &$added) {
    if (!$g || !empty($g['del']) || !in_array($uid, (array) $g['members'], true)) return ['ok' => false, 'reason' => 'gGone'];
    $isOwner = (string) $g['owner'] === $uid;
    foreach ($ok as $p) {
      if (in_array($p, (array) $g['members'], true)) continue;
      if (in_array($p, (array) ($g['kicked'] ?? []), true)) {
        if (!$isOwner) continue;
        $g['kicked'] = array_values(array_filter((array) $g['kicked'], static fn($k) => $k !== $p));
      }
      if (count((array) $g['members']) >= LIVE_GROUP_MAX) break;
      $g['members'][] = $p; $added[] = $p;
      $g['msgs'][] = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => $uid, 'sys' => 'add', 'w' => $p, 't' => '', 'at' => time()];
    }
    $g['msgs'] = array_slice((array) $g['msgs'], -LIVE_THREAD_KEEP);
    if ($added) $g['at'] = time();
    return ['ok' => true, 'g' => $g, '__write' => $g];
  });
  if (empty($r['ok'])) return $r;
  foreach ($added as $p) live_ugroups_set($p, $gid, true);
  unset($r['__write']);
  $r['added'] = $added;
  return $r;
}

/* v2790 (propriétaire) — INVITATIONS : un membre invite un joueur (identifiant R… ou e-mail) ; le joueur voit
   l'invitation dans « Mes groupes » et choisit Accepter ou Refuser. Personne n'entre dans un groupe sans le vouloir. */
function live_group_invites(string $uid): array {
  $since = time() - 30 * 86400;
  return array_values(array_filter((array) (live_read_json(live_ugroups_file($uid), [])['inv'] ?? []), static fn($i) => is_array($i) && (int) ($i['at'] ?? 0) > $since));
}
function live_group_invite(string $uid, string $gid, string $peer): string {
  if ($peer === '' || $peer === $uid) return 'skip';
  $g = live_group_get($gid);
  if (!$g || !in_array($uid, (array) $g['members'], true)) return 'gGone';
  if (in_array($peer, (array) $g['members'], true)) return 'in';
  if (in_array($peer, (array) ($g['kicked'] ?? []), true) && (string) $g['owner'] !== $uid) return 'skip';
  if (live_is_blocked($peer, $uid)) return 'skip';
  $r = live_update(live_ugroups_file($peer), function ($q) use ($gid, $uid) {
    $since = time() - 30 * 86400;
    $inv = array_values(array_filter((array) ($q['inv'] ?? []), static fn($i) => is_array($i) && (int) ($i['at'] ?? 0) > $since && ($i['g'] ?? '') !== $gid));
    array_unshift($inv, ['g' => $gid, 'by' => $uid, 'at' => time()]);
    return ['ok' => true, '__write' => array_merge((array) $q, ['inv' => array_slice($inv, 0, LIVE_GROUP_INV_MAX)])];
  });
  return !empty($r['ok']) ? 'ok' : 'fail';
}
function live_group_answer(string $uid, string $gid, bool $yes): array {
  $inv = null;
  live_update(live_ugroups_file($uid), function ($q) use ($gid, &$inv) {
    $keep = [];
    foreach ((array) ($q['inv'] ?? []) as $i) { if (is_array($i) && ($i['g'] ?? '') === $gid) $inv = $i; else $keep[] = $i; }
    return ['ok' => true, '__write' => array_merge((array) $q, ['inv' => $keep])];
  });
  if (!$inv) return ['ok' => false, 'reason' => 'gGone'];
  if (!$yes) return ['ok' => true, 'refused' => true];
  $by = (string) ($inv['by'] ?? '');
  $r = live_update(live_group_file($gid), function ($g) use ($uid, $by) {
    if (!$g || !empty($g['del'])) return ['ok' => false, 'reason' => 'gGone'];
    if (in_array($uid, (array) $g['members'], true)) return ['ok' => true, 'g' => $g];
    if (in_array($uid, (array) ($g['kicked'] ?? []), true)) {
      if ((string) $g['owner'] !== $by) return ['ok' => false, 'reason' => 'gGone'];
      $g['kicked'] = array_values(array_filter((array) $g['kicked'], static fn($k) => $k !== $uid));
    }
    if (count((array) $g['members']) >= LIVE_GROUP_MAX) return ['ok' => false, 'reason' => 'gFull'];
    $g['members'][] = $uid;
    $g['msgs'][] = ['id' => 'm' . bin2hex(random_bytes(6)), 'f' => $by !== '' ? $by : $uid, 'sys' => 'add', 'w' => $uid, 't' => '', 'at' => time()];
    $g['msgs'] = array_slice((array) $g['msgs'], -LIVE_THREAD_KEEP);
    return ['ok' => true, 'g' => $g, 'joined' => true, '__write' => $g];
  });
  if (!empty($r['ok'])) live_ugroups_set($uid, $gid, true);
  unset($r['__write']);
  return $r;
}

/** Une photo envoyée dans un groupe dont le joueur est membre. */
function live_img_in_groups(string $uid, string $name): bool {
  foreach (live_ugroups($uid) as $gid) {
    $g = live_group_get((string) $gid);
    if (!$g || !in_array($uid, (array) $g['members'], true)) continue;
    foreach ((array) ($g['msgs'] ?? []) as $m) if (($m['img'] ?? '') === $name) return true;
  }
  return false;
}

/* =====================================================================================================
 * v2796 — Social « messagerie » (comme WhatsApp / Telegram) : petit point vert « en ligne » (le joueur a ouvert
 * Social il y a moins de 2 min 30 — un fichier vide touché au plus toutes les 30 s, rien d'autre) et DEMANDES DE
 * CONTACT : quelqu'un m'écrit pour la 1re fois → Accepter (la conversation passe dans mes discussions) ou Refuser
 * (il est bloqué et disparaît de ma liste). Aucun argent, aucune donnée existante modifiée.
 * ===================================================================================================== */
const LIVE_ONLINE_SEC = 150;
function live_seen_file(string $uid): string { return live_dir('seen') . '/' . live_safe_id($uid); }
function live_seen_touch(string $uid): void {
  if ($uid === '') return;
  $f = live_seen_file($uid);
  $t = @filemtime($f);
  if ($t === false || $t < time() - 30) @touch($f);
}
function live_seen_on(string $uid): bool { clearstatcache(true, live_seen_file($uid)); $t = @filemtime(live_seen_file($uid)); return $t !== false && $t >= time() - LIVE_ONLINE_SEC; }

/** Demande de contact : l'autre m'a écrit, je ne lui ai jamais répondu et je n'ai encore ni accepté ni refusé. */
function live_dm_is_request(string $uid, array $row, array $thread): bool {
  if ((int) ($row['ok'] ?? 0) !== 0 || !$thread) return false;
  foreach ($thread as $m) if ((string) ($m['f'] ?? '') === $uid) return false;
  return true;
}
/** Réponse à une demande : oui → contact accepté ; non → bloqué et caché de la liste. */
function live_dm_answer(string $uid, string $peer, bool $yes): void {
  $f = live_dir('inbox') . '/' . live_safe_id($uid) . '.json';
  live_update($f, function ($q) use ($peer, $yes) {
    if (!isset($q['c'][$peer])) return ['ok' => true];
    $q['c'][$peer]['ok'] = $yes ? 1 : -1;
    if (!$yes) $q['c'][$peer]['un'] = 0;
    return ['ok' => true, '__write' => $q];
  });
  if (!$yes) live_set_block($uid, $peer, true);
}
