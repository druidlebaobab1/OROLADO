/* Fichier généré par scripts/gen-i18n.js depuis scripts/i18n-core.js — ne pas modifier à la main. */
/*
 * OROLADO — traductions : NOYAU (logique seulement : t(), msg(), choix de la langue, application au DOM).
 * Source de ce noyau : scripts/i18n-core.js. Les TEXTES restent dans js/translations.js, js/i18n-zh.js et js/i18n-src.js
 * (on continue de les modifier là). `node scripts/gen-i18n.js` fabrique js/i18n/core.js (ce noyau + tables) et
 * js/i18n/<langue>.js (une langue par fichier). `node scripts/gen-i18n.js --check` : code 1 si pas à jour.
 * 2026-10-20 (vieux Android) : avant, les 12 langues (≈ 860 Ko) étaient téléchargées à chaque visite ; maintenant
 * seulement l'anglais (secours de t(), comme avant) + la langue du joueur, chargés AVANT la suite (bloquant, même ordre).
 */
(function (D6) {
  'use strict';

  var B = {"langs":[{"code":"en","flag":"🇬🇧","name":"English"},{"code":"fr","flag":"🇫🇷","name":"Français"},{"code":"es","flag":"🇪🇸","name":"Español"},{"code":"pt","flag":"🇧🇷","name":"Português"},{"code":"ar","flag":"🇸🇦","name":"العربية"},{"code":"tr","flag":"🇹🇷","name":"Türkçe"},{"code":"vi","flag":"🇻🇳","name":"Tiếng Việt"},{"code":"id","flag":"🇮🇩","name":"Indonesia"},{"code":"ru","flag":"🇷🇺","name":"Русский"},{"code":"de","flag":"🇩🇪","name":"Deutsch"},{"code":"hi","flag":"🇮🇳","name":"हिन्दी"},{"code":"zh","flag":"🇨🇳","name":"中文"}],"files":{"en":"209fc02aa6","fr":"c968b4ad1e","es":"869e68b688","pt":"a4a9d269e6","ar":"26744b445d","tr":"e403930ceb","vi":"d6fb3a3d65","id":"489cef6e07","ru":"dc4d317377","de":"31dea02909","hi":"823c046e52","zh":"d22c398081"},"msgFr":{"votre compte a été suspendu pour non-respect des règles d'utilisation. si vous pensez qu'il s'agit d'une erreur, contactez le support orolado.":"m2_banned","votre compte a été suspendu pour non-respect des règles d'utilisation. si vous pensez qu'il s'agit d'une erreur, contactez le support orolado":"m2_banned","mise non enregistrée":"m_stakeNotRecorded","adresse copiée !":"m_addrCopied","adresse copiée":"m_addrCopied","adresse en cours de génération…":"m_addrGen","adresse en cours de génération...":"m2_addrGen","montant de paiement invalide.":"m2_payAmount","montant de paiement invalide":"m2_payAmount","erreur":"m2_error","paiement en cours…":"m2_payInProgress","identifiants incorrects":"m_wrongCreds","montant obligatoire":"m2_amountReq","position encore ouverte":"m2_posOpen","requête invalide":"m2_badRequest","référence invalide":"m2_badRef","référence manquante":"m2_badRef","saisissez un txid tron valide":"m2_txid","session expirée":"m2_sessionExp","solde insuffisant":"m_insufficient","envoi impossible":"m_codeSendFail","erreur réseau brevo":"m_codeSendFail","inscription impossible":"m_signupDown","impossible de mettre à jour le mot de passe":"m_passChangeFail","ordre refusé":"m_stakeNotRecorded","moyen de paiement indisponible.":"m_payUnavailable","trop de demandes. réessayez dans un moment.":"m_tooMany","trop de demandes, réessayez plus tard":"m_tooMany","service indisponible, réessayez":"m_busy","service momentanément indisponible, réessayez dans un instant.":"m_busy","changement impossible pour le moment, réessayez plus tard":"m_busy","stockage indisponible":"m_busy","règlement en cours":"m_settling","code expiré":"m_codeExpired","code expiré, demandez-en un nouveau":"m_codeExpired","code expiré. demandez un nouveau code.":"m_codeExpired","aucun code en attente":"m_codeExpired","code incorrect":"m_codeInvalid","code invalide":"m_codeInvalid","code invalide ou expiré. demandez-en un nouveau.":"m_codeInvalid","code incorrect ou expiré":"m_codeInvalid","jeton otp invalide":"m_codeInvalid","trop de tentatives":"m_tooManyAttempts","trop de tentatives, recommencez":"m_tooManyAttempts","trop de tentatives. demandez un nouveau code.":"m_tooManyAttempts","patientez une minute avant de relancer.":"m_waitMin","le paiement n'a pas pu s'ouvrir. réessayez.":"m_payOpenFail","code de confirmation requis":"m_codeRequired","identifiants introuvables":"m_wrongCreds","mot de passe incorrect":"m_wrongCreds","mot de passe invalide":"m_passShort","mot de passe : 6 caractères minimum":"m_passShort","nouveau mot de passe trop court":"m_passShort","les mots de passe ne correspondent pas":"m_passMismatch","vous devez confirmer avoir plus de 18 ans":"m_must18","indiquez votre nom ou pseudo (2 caractères min.)":"m_nameReq","numéro de téléphone invalide":"m_phoneInvalid","numéro invalide":"m_phoneInvalid","un compte existe déjà avec cet e-mail":"m_emailExists","cet e-mail ne peut plus être utilisé pour une inscription.":"m_emailBlocked","cette adresse ne peut pas être utilisée":"m_emailBlocked","cette adresse e-mail a déjà été utilisée et ne peut plus servir.":"m_emailRetired","cette adresse a été remplacée sur son compte. utilisez votre nouvelle adresse e-mail.":"m_emailReplaced","aucun compte n'utilise cet e-mail. vérifiez l'adresse ou créez un compte.":"m_noAccountEmail","mot de passe requis":"m_passReq","saisissez le code à 6 chiffres reçu par e-mail.":"m_enterCode6","impossible d'envoyer le code. réessayez.":"m_codeSendFail","impossible d'envoyer le code de confirmation":"m_codeSendFail","envoi du code impossible pour le moment":"m_codeSendFail","validez d'abord le code e-mail":"m_validateFirst","impossible de modifier le mot de passe":"m_passChangeFail","aucun compte associé":"m_accountNotFound","compte introuvable":"m_accountNotFound","mise minimum : 1 $":"m_minStake","montant invalide":"m_amountInvalid","indiquez le compte / adresse de réception":"m_destReq","nom du bénéficiaire requis":"m_benefReq","vous devez miser x2 de votre dépôt avant de pouvoir effectuer un retrait.":"m_wager","moyen de paiement indisponible":"m_payUnavailable","paiement carte indisponible pour le moment.":"m_payUnavailable","crypto non acceptée.":"m_cryptoNotAccepted","connexion au marché…":"m_connecting","volume maximum atteint sur cet actif, réessayez dans quelques secondes":"m_assetMax","trop de gains potentiels ouverts, attendez la fin d'un trade":"m_tooManyOpen","cette adresse est déjà utilisée par un autre compte":"emailTaken","c'est déjà votre adresse actuelle":"m_sameEmail","recommencez le changement d'adresse":"m_restartEmail","inscription invalide":"m_signupInvalid","vous avez déjà envoyé plusieurs messages. notre équipe vous répond au plus vite, merci de patienter un peu.":"m_supportRate","dépôt introuvable":"m_notFound","retrait introuvable":"m_notFound","ordre introuvable":"m_notFound","transaction introuvable":"m_notFound","génération de l'adresse…":"m_addrGen","adresse en cours…":"m_addrGen","ouverture du paiement...":"m_openingPay","vérification de sécurité":"m_secCheck","service d'inscription indisponible. réessayez.":"m_signupDown","serveur indisponible. réessayez.":"m_serverDown","saisissez votre e-mail":"enterEmail","saisissez l'e-mail du compte":"enterEmail","e-mail invalide":"emailInvalid","adresse e-mail invalide":"emailInvalid","paiement confirmé ! votre solde a été crédité.":"m_payConfirmed","ce hash de transaction a déjà été crédité.":"m_txReused","transaction invalide : les fonds n'ont pas été envoyés à l'adresse officielle de la plateforme.":"m_txInvalid","transaction en cours de confirmation sur le réseau tron. si vous venez d'envoyer les fonds, patientez 30 secondes et réessayez.":"m_propagating","défi indisponible":"m_defiNA","connexion google impossible. réessayez":"m_googleFail","inscription impossible. réessayez":"m_signupFail","ce même montant vient déjà d'être envoyé (il y a moins de 2 minutes). vérifiez le solde avant de recommencer":"m_dupSend","remboursement non passé (base injoignable). réessayez dans un instant":"m_refundFail","coffre réel introuvable":"m_vaultMissing","le paiement n'a pas pu s'ouvrir. réessayez":"m_payOpenFail","trop d'essais":"x_tooManyTries","renvoi impossible":"x_resendFail","numéro déjà utilisé":"x_phoneUsed","échec":"x_failed","fiche trop lourde":"x_dataTooBig","message invalide":"x_msgInvalid","message introuvable":"x_msgNotFound","action inconnue":"x_unknownAction","post requis":"m2_badRequest","ce compte a été créé avec google. touchez « mot de passe oublié » pour créer votre mot de passe (code reçu par e-mail)":"x_googleAcct","adresse de dépôt en cours de génération. réessayez dans un instant":"x_addrGen","passerelle crypto indisponible":"m_payUnavailable","mobile money indisponible pour le moment":"momoOff","numéro mobile money invalide":"x_momoPhone","paiement mobile money refusé pour le moment. réessayez ou choisissez un autre moyen":"x_momoRefused","ordre non enregistré, mise rendue":"x_orderRefunded","ordre déjà en cours d'enregistrement, vérifiez vos trades ouverts":"x_orderPending","ordre invalide":"x_orderInvalid","actif inconnu":"x_assetUnknown","caisse indisponible, réessayez":"m_busy","service indisponible":"m_busy","indisponible":"m_busy","inscription impossible pour le moment":"m_signupDown","échec création panier maketou":"m_payOpenFail","brevo_api_key manquante":"m_codeSendFail","payload invalide":"m_codeSendFail","curl indisponible":"m_codeSendFail","erreur brevo":"m_codeSendFail","la page de paiement est bloquée par votre navigateur. essayez avec chrome, ou désactivez le bloqueur de contenu, puis réessayez":"x_payBlocked"},"msgFrPatterns":[["^trop d'essais\\. réessayez dans (\\d+) min\\.?$","","m_tryInMin"],["^patientez (\\d+) s avant de relancer\\.?$","","m_waitSec"],["^patientez (\\d+)","","m_waitSec"],["^mise maximum pour cette cote : ([\\d .,]+) \\$$","","m_maxStake"],["^le retrait minimum est de \\$([\\d,]+(?:\\.\\d+)?)\\.?$","","m_minWithdraw"],["^le dépôt minimum est de \\$([\\d,]+(?:\\.\\d+)?)\\.?$","","m_minDeposit"],["^votre compte a été suspendu","","m_suspended"],["^ce compte a été fermé définitivement","","m_closed"],["^votre session a expiré","","sessionExpiredMsg"],["^session invalide$","","sessionExpiredMsg"],["^égalité — mise rendue ?(.*)$","","m_tieNote",true],["^position expirée ?(.*)$","","m_expiredNote",true],["^la page de paiement est bloquée par votre navigateur\\. essayez avec chrome, ou désactivez le bloqueur de contenu, puis réessayez\\. (\\[.*\\])$","","x_payBlocked",true]],"msgLangs":["en","fr","es","pt","ar","ru","tr","vi","id","de","hi"],"shortTable":{"s_tradeFail":["Trade not saved","Trade non enregistré","Operación no registrada","Operação não registrada","لم تُسجَّل الصفقة","Сделка не записана","İşlem kaydedilmedi","Lệnh chưa được ghi","Trade tidak tersimpan","Trade nicht gespeichert","ट्रेड सेव नहीं हुआ"],"s_validate":["Validate the email code","Validez le code e-mail","Valida el código del correo","Valide o código do e-mail","أكّد رمز البريد","Подтвердите код из письма","E-posta kodunu doğrulayın","Xác nhận mã email","Validasi kode email","E-Mail-Code bestätigen","ईमेल कोड सत्यापित करें"],"s_emailExists":["Account already exists","Compte déjà existant","La cuenta ya existe","A conta já existe","الحساب موجود بالفعل","Аккаунт уже существует","Hesap zaten var","Tài khoản đã tồn tại","Akun sudah ada","Konto existiert bereits","खाता पहले से मौजूद"],"s_codeSent":["Code sent by email","Code envoyé par e-mail","Código enviado por correo","Código enviado por e-mail","تم إرسال الرمز إلى بريدك","Код отправлен на почту","Kod e-postanıza gönderildi","Đã gửi mã qua email","Kode dikirim ke email","Code per E-Mail gesendet","कोड ईमेल पर भेजा गया"],"s_enterCode":["Enter the email code to confirm","Saisissez le code e-mail pour confirmer","Introduce el código del correo","Digite o código do e-mail para confirmar","أدخل رمز البريد للتأكيد","Введите код из письма","Onaylamak için e-posta kodunu girin","Nhập mã email để xác nhận","Masukkan kode email untuk konfirmasi","E-Mail-Code zur Bestätigung eingeben","पुष्टि के लिए ईमेल कोड डालें"],"s_codeInvalid":["Invalid or expired code","Code invalide ou expiré","Código inválido o caducado","Código inválido ou expirado","رمز غير صالح أو منتهي","Неверный или истёкший код","Geçersiz veya süresi dolmuş kod","Mã sai hoặc hết hạn","Kode salah atau kedaluwarsa","Code ungültig oder abgelaufen","कोड गलत या समाप्त"],"s_conn":["Connection issue, try again","Connexion instable, réessayez","Conexión inestable, reinténtalo","Conexão instável, tente de novo","اتصال غير مستقر، أعد المحاولة","Сбой связи, повторите","Bağlantı sorunu, tekrar deneyin","Kết nối yếu, thử lại","Koneksi bermasalah, coba lagi","Verbindungsproblem, erneut versuchen","कनेक्शन समस्या, फिर कोशिश करें"],"s_sessionExp":["Session expired, please log in","Session expirée, reconnectez-vous","Sesión caducada, inicia sesión","Sessão expirada, entre novamente","انتهت الجلسة، سجّل الدخول","Сессия истекла, войдите снова","Oturum sona erdi, giriş yapın","Phiên hết hạn, hãy đăng nhập","Sesi berakhir, silakan masuk","Sitzung abgelaufen, bitte anmelden","सत्र समाप्त, फिर लॉग इन करें"],"s_passMismatch":["Passwords don’t match","Mots de passe différents","Las contraseñas no coinciden","As senhas não coincidem","كلمتا المرور غير متطابقتين","Пароли не совпадают","Şifreler eşleşmiyor","Mật khẩu không khớp","Kata sandi tidak cocok","Passwörter stimmen nicht überein","पासवर्ड मेल नहीं खाते"],"s_logoutOthers":["Other devices logged out","Autres appareils déconnectés","Otros dispositivos desconectados","Outros dispositivos desconectados","تم تسجيل خروج الأجهزة الأخرى","Другие устройства отключены","Diğer cihazların oturumu kapatıldı","Đã đăng xuất thiết bị khác","Perangkat lain telah keluar","Andere Geräte abgemeldet","अन्य डिवाइस लॉग आउट हुए"],"s_sendFail":["Sending failed, try again","Envoi impossible, réessayez","Envío fallido, reinténtalo","Falha no envio, tente de novo","تعذّر الإرسال، أعد المحاولة","Не отправлено, повторите","Gönderilemedi, tekrar deneyin","Gửi thất bại, thử lại","Gagal mengirim, coba lagi","Senden fehlgeschlagen, erneut versuchen","भेजा नहीं गया, फिर कोशिश करें"],"s_payPending":["Payment awaiting validation","Paiement en attente de validation","Pago pendiente de validación","Pagamento aguardando validação","الدفع بانتظار التأكيد","Платёж ожидает проверки","Ödeme onay bekliyor","Thanh toán đang chờ duyệt","Pembayaran menunggu validasi","Zahlung wird geprüft","भुगतान पुष्टि की प्रतीक्षा में"],"s_destReq":["Receiving address missing","Adresse de réception manquante","Falta la dirección de recepción","Endereço de recebimento ausente","عنوان الاستلام مفقود","Укажите адрес получения","Alıcı adresi eksik","Thiếu địa chỉ nhận","Alamat penerima kosong","Empfangsadresse fehlt","प्राप्ति पता नहीं दिया"],"s_cardErr":["Invalid card number","Numéro de carte invalide","Número de tarjeta inválido","Número de cartão inválido","رقم البطاقة غير صالح","Неверный номер карты","Geçersiz kart numarası","Số thẻ không hợp lệ","Nomor kartu tidak valid","Ungültige Kartennummer","कार्ड नंबर अमान्य"],"s_cardOff":["Card unavailable","Carte indisponible","Tarjeta no disponible","Cartão indisponível","البطاقة غير متاحة","Карта недоступна","Kart kullanılamıyor","Thẻ không khả dụng","Kartu tidak tersedia","Karte nicht verfügbar","कार्ड उपलब्ध नहीं"],"s_payOpen":["Payment didn’t open, try again","Paiement non ouvert, réessayez","El pago no se abrió, reinténtalo","Pagamento não abriu, tente de novo","لم يُفتح الدفع، أعد المحاولة","Оплата не открылась, повторите","Ödeme açılmadı, tekrar deneyin","Không mở được thanh toán, thử lại","Pembayaran gagal dibuka, coba lagi","Zahlung nicht geöffnet, erneut versuchen","भुगतान नहीं खुला, फिर कोशिश करें"],"s_tooManyAttempts":["Too many attempts, request a new code","Trop d’essais, demandez un nouveau code","Demasiados intentos, pide otro código","Muitas tentativas, peça novo código","محاولات كثيرة، اطلب رمزًا جديدًا","Много попыток, запросите новый код","Çok fazla deneme, yeni kod isteyin","Quá nhiều lần, yêu cầu mã mới","Terlalu banyak percobaan, minta kode baru","Zu viele Versuche, neuen Code anfordern","बहुत प्रयास, नया कोड मांगें"],"s_tooMany":["Too many requests, please wait","Trop de demandes, patientez","Demasiadas solicitudes, espera","Muitas solicitações, aguarde","طلبات كثيرة، انتظر قليلًا","Слишком много запросов, подождите","Çok fazla istek, bekleyin","Quá nhiều yêu cầu, vui lòng chờ","Terlalu banyak permintaan, tunggu","Zu viele Anfragen, bitte warten","बहुत अनुरोध, कृपया रुकें"],"s_busy":["Service unavailable, try again","Service indisponible, réessayez","Servicio no disponible, reinténtalo","Serviço indisponível, tente de novo","الخدمة غير متاحة، أعد المحاولة","Сервис недоступен, повторите","Hizmet kullanılamıyor, tekrar deneyin","Dịch vụ tạm ngưng, thử lại","Layanan tidak tersedia, coba lagi","Dienst nicht verfügbar, erneut versuchen","सेवा उपलब्ध नहीं, फिर कोशिश करें"],"s_assetMax":["Market busy, try again","Marché saturé, réessayez","Mercado saturado, reinténtalo","Mercado lotado, tente de novo","السوق مزدحم، أعد المحاولة","Рынок перегружен, повторите","Piyasa yoğun, tekrar deneyin","Thị trường quá tải, thử lại","Pasar penuh, coba lagi","Markt ausgelastet, erneut versuchen","बाज़ार व्यस्त, फिर कोशिश करें"],"s_openMax":["Wait for a trade to finish","Attendez la fin d’un trade","Espera a que termine una operación","Aguarde o fim de uma operação","انتظر انتهاء صفقة","Дождитесь окончания сделки","Bir işlemin bitmesini bekleyin","Chờ một lệnh kết thúc","Tunggu satu trade selesai","Warte, bis ein Trade endet","किसी ट्रेड के खत्म होने तक रुकें"],"s_supportRate":["Message received, reply soon","Message bien reçu, réponse bientôt","Mensaje recibido, respuesta pronto","Mensagem recebida, resposta em breve","تم استلام رسالتك، سنرد قريبًا","Сообщение получено, скоро ответим","Mesaj alındı, yakında yanıt","Đã nhận tin, sẽ trả lời sớm","Pesan diterima, segera dibalas","Nachricht erhalten, Antwort folgt","संदेश मिला, जल्द जवाब"],"s_emailUsed":["Email already used","E-mail déjà utilisé","Correo ya utilizado","E-mail já utilizado","البريد مستخدم من قبل","Почта уже использована","E-posta zaten kullanıldı","Email đã được dùng","Email sudah dipakai","E-Mail bereits verwendet","ईमेल पहले से उपयोग में"],"s_passUpdated":["Password changed","Mot de passe modifié","Contraseña cambiada","Senha alterada","تم تغيير كلمة المرور","Пароль изменён","Şifre değiştirildi","Đã đổi mật khẩu","Kata sandi diubah","Passwort geändert","पासवर्ड बदल गया"],"s_emailChanged":["Email address changed","Adresse e-mail modifiée","Correo electrónico cambiado","E-mail alterado","تم تغيير البريد الإلكتروني","Адрес почты изменён","E-posta adresi değiştirildi","Đã đổi địa chỉ email","Alamat email diubah","E-Mail-Adresse geändert","ईमेल पता बदल गया"],"s_nameShort":["Nickname too short","Pseudo trop court","Apodo demasiado corto","Apelido muito curto","الاسم قصير جدًا","Слишком короткое имя","Takma ad çok kısa","Biệt danh quá ngắn","Nama panggilan terlalu pendek","Spitzname zu kurz","उपनाम बहुत छोटा"]},"shortOf":{"wdOtpSent":"s_codeSent","wdOtpNeed":"s_enterCode","wdOtpErr":"s_codeInvalid","sessionInvalid":"s_conn","sessionExpiredMsg":"s_sessionExp","passMismatch":"s_passMismatch","logoutOthersDone":"s_logoutOthers","helpRetry":"s_sendFail","depositPending":"s_payPending","cryptoErrPending":"s_payPending","wdDestErr":"s_destReq","wdCardErr":"s_cardErr","tradeFailed":"s_tradeFail","passOtpNeed":"s_validate","passUpdated":"s_passUpdated","emailChanged":"s_emailChanged","m_codeInvalid":"s_codeInvalid","m_codeExpired":"s_codeInvalid","m_enterCode6":"s_enterCode","m_tooManyAttempts":"s_tooManyAttempts","m_tooMany":"s_tooMany","m_busy":"s_busy","m_assetMax":"s_assetMax","m_supportRate":"s_supportRate","m_emailRetired":"s_emailUsed","m_nameReq":"s_nameShort","m_payUnavailable":"s_cardOff","m_payOpenFail":"s_payOpen","m_destReq":"s_destReq","m_passMismatch":"s_passMismatch","m_codeSendFail":"s_sendFail","m_validateFirst":"s_validate","m_emailExists":"s_emailExists"},"shortRaw":{"trop de gains potentiels ouverts, attendez la fin d'un trade":"s_openMax"},"shortFr":{"wdOtpSent":"Un code à 6 chiffres a été envoyé à votre e-mail.","wdOtpNeed":"Saisissez le code e-mail à 6 chiffres pour confirmer le retrait.","wdOtpErr":"Code invalide ou expiré. Demandez-en un nouveau.","sessionInvalid":"Action impossible pour le moment. Vérifiez votre connexion et réessayez.","sessionExpiredMsg":"Votre session a expiré. Reconnectez-vous pour continuer.","passMismatch":"Les mots de passe ne correspondent pas","logoutOthersDone":"Vos autres appareils ont été déconnectés.","helpRetry":"Envoi impossible pour le moment, réessayez dans un instant.","depositPending":"Paiement en attente de validation. Votre solde sera actualisé sous peu ou contactez le support avec votre référence.","cryptoErrPending":"En attente de confirmation OxaPay…","wdDestErr":"Indiquez le compte ou l’adresse de réception","wdCardErr":"Saisissez un numéro de carte à 16 chiffres","tradeFailed":"Trade non enregistré, réessayez.","passOtpNeed":"Validez d’abord le code e-mail","passUpdated":"Mot de passe mis à jour avec succès","emailChanged":"Votre adresse e-mail a été modifiée.","m_codeInvalid":"Code incorrect ou expiré.","m_codeExpired":"Code expiré. Demandez un nouveau code.","m_enterCode6":"Saisissez le code à 6 chiffres reçu par e-mail.","m_tooManyAttempts":"Trop de tentatives. Demandez un nouveau code.","m_tooMany":"Trop de demandes. Réessayez dans un moment.","m_busy":"Service momentanément indisponible, réessayez.","m_assetMax":"Volume maximum atteint sur cet actif, réessayez dans quelques secondes.","m_supportRate":"Vous avez déjà envoyé plusieurs messages. Notre équipe vous répond au plus vite, merci de patienter un peu.","m_emailRetired":"Cette adresse e-mail a déjà été utilisée et ne peut plus servir.","m_nameReq":"Indiquez votre nom ou pseudo (2 caractères min.).","m_payUnavailable":"Ce moyen de paiement est momentanément indisponible.","m_payOpenFail":"Le paiement n’a pas pu s’ouvrir. Réessayez.","m_destReq":"Indiquez le compte ou l’adresse de réception.","m_passMismatch":"Les mots de passe ne correspondent pas.","m_codeSendFail":"Impossible d’envoyer le code pour le moment. Réessayez.","m_validateFirst":"Validez d’abord le code e-mail.","m_emailExists":"Un compte existe déjà avec cet e-mail."},"extraKeys":[]};

  var DICT = D6.I18N_DICT = D6.I18N_DICT || {};
  var SUP = {};
  B.langs.forEach(function (l) { SUP[l.code] = 1; });
  D6.LANGS = B.langs.map(function (l) { return { code: l.code, flag: l.flag, name: l.name }; });
  var MSG_FR = B.msgFr;
  var MSG_FR_PATTERNS = B.msgFrPatterns.map(function (p) {
    var row = [new RegExp(p[0], p[1]), p[2]];
    if (p.length > 3) row.push(p[3]);
    return row;
  });
  var MSG_LANGS = B.msgLangs;
  var SHORT_TABLE = B.shortTable;
  var SHORT_OF = B.shortOf;
  var SHORT_RAW = B.shortRaw;
  var SHORT_FR = B.shortFr;

  // Fichiers de langue : à côté de ce noyau (js/i18n/), adresse versionnée par leur contenu.
  var BASE = 'js/i18n/';
  try {
    var cs = document.currentScript;
    if (cs && cs.src) BASE = String(cs.src).replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
  } catch (eBase) { /* ignore */ }
  function langUrl(code) { return BASE + code + '.js?v=' + B.files[code]; }
  var waiting = {};
  function loaded(code) {
    var cbs = waiting[code];
    if (!cbs) return;
    delete waiting[code];
    cbs.forEach(function (cb) { try { cb(); } catch (eCb) { /* ignore */ } });
  }
  /** Charge une langue (sans bloquer) puis appelle cb — tout de suite si elle est déjà là. */
  function loadLang(code, cb) {
    if (DICT[code]) { cb(); return; }
    if (waiting[code]) { waiting[code].push(cb); return; }
    waiting[code] = [cb];
    try {
      var s = document.createElement('script');
      s.src = langUrl(code);
      s.onload = s.onerror = function () { loaded(code); };
      (document.head || document.documentElement).appendChild(s);
    } catch (eLoad) { loaded(code); }
  }

  var LANG_KEY = 'orolado_lang';
  var LANG_USER_KEY = 'orolado_lang_user';
  var LANG_MANUAL_KEY = 'orolado_manual_lang';
  var LANG_SELECTED_KEY = 'orolado_selected_lang';
  var LANG_EXPLICIT_KEY = 'user_explicitly_selected_lang';
  var LANG_SESSION_KEY = 'orolado_lang_session';

  function matchSupportedLang(raw) {
    var code = String(raw || '').toLowerCase().replace('_', '-').replace(/\s+/g, '').trim();
    if (!code) return '';
    if (code.indexOf('ar') === 0) return 'ar';
    if (code.indexOf('es') === 0) return 'es';
    if (code.indexOf('fr') === 0) return 'fr';
    if (code.indexOf('pt') === 0) return 'pt';
    if (code.indexOf('ru') === 0) return 'ru';
    if (code.indexOf('tr') === 0) return 'tr';
    if (code.indexOf('vi') === 0) return 'vi';
    if (code.indexOf('id') === 0) return 'id';
    if (code.indexOf('de') === 0) return 'de';
    if (code.indexOf('hi') === 0) return 'hi';
    if (code.indexOf('zh') === 0) return 'zh';
    if (code.indexOf('en') === 0) return 'en';
    return '';
  }

  function langFromTimezone(tz) {
    tz = String(tz || '');
    if (!tz) return '';
    if (/Dubai|Riyadh|Qatar|Kuwait|Bahrain|Muscat|Baghdad|Damascus|Amman|Beirut|Gaza|Hebron|Cairo|Tripoli|Khartoum|Nouakchott|Casablanca|El_Aaiun|Algiers|Tunis|Aden/.test(tz)) return 'ar';
    if (/Sao_Paulo|Fortaleza|Recife|Bahia|Maceio|Araguaina|Santarem|Boa_Vista|Manaus|Belem|Noronha|Rio_Branco|Cuiaba|Campo_Grande|Porto_Velho|Lisbon|Madeira|Azores|Luanda|Maputo|Bissau|Sao_Tome|Cape_Verde|Dili/.test(tz)) return 'pt';
    if (/Madrid|Ceuta|Canary|Bogota|Lima|Mexico_City|Monterrey|Merida|Cancun|Chihuahua|Hermosillo|Mazatlan|Tijuana|Caracas|Santiago|Buenos_Aires|Argentina|Montevideo|Guayaquil|Galapagos|Panama|Havana|Santo_Domingo|Guatemala|Tegucigalpa|Managua|El_Salvador|Costa_Rica|Asuncion|La_Paz|Puerto_Rico|Malabo/.test(tz)) return 'es';
    if (/Paris|Brussels|Luxembourg|Monaco|Abidjan|Dakar|Bamako|Ouagadougou|Lome|Porto-Novo|Douala|Libreville|Brazzaville|Kinshasa|Lubumbashi|Bangui|Ndjamena|Bujumbura|Djibouti|Niamey|Conakry|Reunion|Mauritius|Mayotte|Comoro|Martinique|Guadeloupe|Cayenne|Noumea|Tahiti|Antananarivo|Port-au-Prince|Miquelon/.test(tz)) return 'fr';
    if (tz.indexOf('Istanbul') >= 0) return 'tr';
    if (tz.indexOf('Ho_Chi_Minh') >= 0 || tz.indexOf('Hanoi') >= 0) return 'vi';
    if (/Jakarta|Pontianak|Makassar|Jayapura/.test(tz)) return 'id';
    if (/Moscow|Volgograd|Kirov|Samara|Saratov|Ulyanovsk|Astrakhan|Yekaterinburg|Omsk|Novosibirsk|Barnaul|Tomsk|Novokuznetsk|Krasnoyarsk|Irkutsk|Chita|Yakutsk|Vladivostok|Magadan|Kamchatka|Kaliningrad|Minsk/.test(tz)) return 'ru';
    if (/Berlin|Busingen|Vienna|Zurich|Vaduz/.test(tz)) return 'de';
    if (tz.indexOf('Kolkata') >= 0 || tz.indexOf('Calcutta') >= 0) return 'hi';
    if (/Shanghai|Chongqing|Harbin|Urumqi|Hong_Kong|Macau|Taipei/.test(tz)) return 'zh';
    return '';
  }

  function langFromCountry(cc) {
    cc = String(cc || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (cc.length !== 2) return '';
    if ({ SA:1, AE:1, EG:1, IQ:1, JO:1, KW:1, QA:1, BH:1, OM:1, YE:1, LY:1, SD:1, SY:1, PS:1, LB:1, MR:1, MA:1, DZ:1, TN:1 }[cc]) return 'ar';
    if ({ FR:1, BE:1, LU:1, MC:1, SN:1, CI:1, CM:1, ML:1, BF:1, NE:1, TG:1, BJ:1, GA:1, CG:1, CD:1, MG:1, HT:1, GN:1, TD:1, GF:1, GP:1, MQ:1, RE:1, YT:1, NC:1, PF:1 }[cc]) return 'fr';
    if ({ ES:1, CO:1, MX:1, AR:1, PE:1, CL:1, VE:1, EC:1, GT:1, CU:1, BO:1, DO:1, HN:1, PY:1, SV:1, NI:1, CR:1, PA:1, UY:1, PR:1 }[cc]) return 'es';
    if ({ BR:1, PT:1, AO:1, MZ:1, GW:1, ST:1, CV:1, TL:1 }[cc]) return 'pt';
    if (cc === 'TR') return 'tr';
    if (cc === 'VN') return 'vi';
    if (cc === 'ID') return 'id';
    if (cc === 'RU') return 'ru';
    if (cc === 'DE' || cc === 'AT') return 'de';
    if (cc === 'IN') return 'hi';
    if ({ CN:1, TW:1, HK:1, MO:1 }[cc]) return 'zh';
    return '';
  }

  function collectLangCandidates() {
    var candidates = [];
    var i;
    try {
      if (navigator.languages && navigator.languages.length) {
        for (i = 0; i < navigator.languages.length; i++) candidates.push(navigator.languages[i]);
      }
    } catch (eLangs) { /* ignore */ }
    try { if (navigator.language) candidates.push(navigator.language); } catch (eLang) { /* ignore */ }
    try { if (navigator.userLanguage) candidates.push(navigator.userLanguage); } catch (eUL) { /* ignore */ }
    try { if (navigator.browserLanguage) candidates.push(navigator.browserLanguage); } catch (eBL) { /* ignore */ }
    try {
      var loc = (Intl.DateTimeFormat().resolvedOptions() || {}).locale;
      if (loc) candidates.push(loc);
    } catch (eLoc) { /* ignore */ }
    return candidates;
  }

  // La 1re langue du téléphone que le site connaît gagne, anglais compris (le site est
  // international : un téléphone en anglais reste en anglais, même en Afrique francophone).
  function detectFromNavigator() {
    var candidates = collectLangCandidates();
    var i;
    for (i = 0; i < candidates.length; i++) {
      var hit = matchSupportedLang(candidates[i]);
      if (hit) return hit;
    }
    return '';
  }

  function detectUserLanguage() {
    var fromPhone = detectFromNavigator();
    if (fromPhone) return fromPhone;
    try {
      var fromTz = langFromTimezone((Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '');
      if (fromTz) return fromTz;
    } catch (eTz) { /* ignore */ }
    return fromPhone || 'en';
  }

  function detectAutoLang() {
    return detectUserLanguage();
  }

  function urlLang() {
    try {
      var q = new URLSearchParams(window.location.search);
      var raw = String(q.get('lang') || q.get('hl') || '').toLowerCase().replace('_', '-');
      var code = raw.split('-')[0];
      if (code && SUP[code]) return code;
    } catch (e) { /* ignore */ }
    return '';
  }

  function hasExplicitLang() {
    try {
      var sess = sessionStorage.getItem(LANG_SESSION_KEY);
      if (sess && SUP[sess]) return true;
    } catch (eEx) { /* ignore */ }
    return false;
  }

  function readManualLang() {
    try {
      var sess = sessionStorage.getItem(LANG_SESSION_KEY);
      if (sess && SUP[sess]) return sess;
    } catch (e) { /* ignore */ }
    return '';
  }

  function persistManualLang(code) {
    try { sessionStorage.setItem(LANG_SESSION_KEY, code); } catch (eSess) { /* ignore */ }
    try {
      localStorage.setItem(LANG_EXPLICIT_KEY, '1');
      localStorage.setItem(LANG_SELECTED_KEY, code);
      localStorage.setItem(LANG_MANUAL_KEY, code);
      localStorage.setItem(LANG_KEY, code);
      localStorage.setItem(LANG_USER_KEY, '1');
    } catch (e) { /* ignore */ }
  }

  function detectLang() {
    var fromUrl = urlLang();
    if (fromUrl) return fromUrl;
    if (hasExplicitLang()) {
      var manual = readManualLang();
      if (manual) return manual;
    }
    return detectAutoLang() || 'en';
  }

  var lang = detectLang();
  if (!SUP[lang]) lang = 'en';
  var lockedLang = !!(urlLang() || hasExplicitLang());

  function syncHtmlDir() {
    var html = document.documentElement;
    if (!html) return;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.setAttribute('data-lang', lang);
    html.setAttribute('translate', 'no');
    html.classList.add('notranslate');
    html.classList.toggle('lang-ar', lang === 'ar');
  }
  syncHtmlDir();

  function t(key) {
    try {
      var packLang = DICT[lang] || DICT.en || {};
      if (Object.prototype.hasOwnProperty.call(packLang, key) && packLang[key] != null && packLang[key] !== '') {
        return packLang[key];
      }
      if (DICT.en && Object.prototype.hasOwnProperty.call(DICT.en, key) && DICT.en[key] != null && DICT.en[key] !== '') {
        return DICT.en[key];
      }
      return key;
    } catch (eT) {
      return key;
    }
  }

  /**
   * Traduit un message affiché au joueur (erreur, avis, notification). Les messages français
   * connus (serveur ou code) deviennent la langue du joueur ; l'anglais par défaut.
   */
  function msg(text) {
    try {
      if (text == null) return text;
      var raw = String(text);
      if (!raw) return raw;
      if (lang === 'fr') return raw;
      var norm = raw.trim().toLowerCase().replace(/[\u2019\u2018]/g, "'").replace(/\s+/g, ' ');
      var key = MSG_FR[norm] || MSG_FR[norm.replace(/[.!]$/, '')];
      if (key) return t(key);
      var i;
      for (i = 0; i < MSG_FR_PATTERNS.length; i++) {
        var m = norm.match(MSG_FR_PATTERNS[i][0]);
        if (!m) continue;
        var out = t(MSG_FR_PATTERNS[i][1]);
        if (MSG_FR_PATTERNS[i][2]) return (out + ' ' + (m[1] ? raw.slice(raw.length - m[1].length) : '')).trim();
        return m[1] != null ? out.replace('{n}', m[1].trim()) : out;
      }
      return raw;
    } catch (eMsg) {
      return text;
    }
  }

  function depositLabel() {
    try {
      var v = t('deposit');
      if (!v || v === 'deposit') v = t('recharge');
      if (!v || v === 'recharge') v = '';
      return v || 'Deposit';
    } catch (eDep) {
      return 'Deposit';
    }
  }

  function apply() {
    try { syncHtmlDir(); } catch (eDir) { /* ignore */ }
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      try {
        var key = el.getAttribute('data-i18n');
        if (key === 'authRealPitch') { el.textContent = ''; return; }
        var val = (key === 'recharge' || key === 'deposit') ? depositLabel() : t(key);
        el.textContent = val;
      } catch (eEl) { /* ignore */ }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      try { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'))); } catch (ePh) { /* ignore */ }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      try { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); } catch (eAr) { /* ignore */ }
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      try { el.setAttribute('title', t(el.getAttribute('data-i18n-title'))); } catch (eTi) { /* ignore */ }
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      try { btn.classList.toggle('on', btn.dataset.lang === lang); } catch (eLg) { /* ignore */ }
    });
    try {
      var dep = document.getElementById('btnDepositLabel');
      if (dep) dep.textContent = depositLabel();
    } catch (eLbl) { /* ignore */ }
    try {
      document.dispatchEvent(new CustomEvent('orolado-i18n'));
    } catch (e3) { /* ignore */ }
  }

  var geoStarted = false;

  function applyAutoLang(code) {
    if (lockedLang || hasExplicitLang() || urlLang()) return;
    if (!SUP[code]) code = 'en';
    if (lang === code) return;
    // La langue est d'abord téléchargée (js/i18n/<langue>.js), puis appliquée comme avant.
    loadLang(code, function () {
      if (lockedLang || hasExplicitLang() || urlLang()) return;
      if (lang === code || !DICT[code]) return;
      lang = code;
      try { localStorage.setItem(LANG_KEY, code); } catch (eAuto) { /* ignore */ }
      apply();
    });
  }

  function refineFromIpCountry() {
    // Ordre : 1) langue du téléphone, 2) fuseau horaire, 3) EN DERNIER RECOURS seulement,
    // le pays vu par Cloudflare (notre propre serveur, pas de service extérieur).
    if (lockedLang || hasExplicitLang() || urlLang()) return;
    if (detectFromNavigator()) return;
    try {
      if (langFromTimezone((Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '')) return;
    } catch (eTz2) { /* ignore */ }
    try {
      fetch('api.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'geo' }) })
        .then(function (r) { return r && r.ok ? r.json() : null; })
        .then(function (j) {
          var hit = langFromCountry(String((j && j.country) || '').toUpperCase());
          if (hit) applyAutoLang(hit);
        }).catch(function () { /* ignore */ });
    } catch (eGeo) { /* ignore */ }
    return;
    // eslint-disable-next-line no-unreachable
    if (lockedLang || hasExplicitLang() || urlLang()) return;
    var phoneLang = detectFromNavigator();
    if (phoneLang && phoneLang !== 'en') return;
    var sources = ['https://api.country.is/', 'https://ipapi.co/json/'];
    var i = 0;
    function next() {
      if (i >= sources.length || lockedLang || hasExplicitLang() || urlLang()) return;
      var url = sources[i++];
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = setTimeout(function () {
        try { if (ctrl) ctrl.abort(); } catch (eAb) { /* ignore */ }
      }, 2500);
      fetch(url, { cache: 'no-store', credentials: 'omit', signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
        return r && r.ok ? r.json() : null;
      }).then(function (j) {
        clearTimeout(timer);
        var cc = String((j && (j.country || j.country_code)) || '').toUpperCase();
        var hit = langFromCountry(cc);
        if (hit) applyAutoLang(hit);
        else next();
      }).catch(function () {
        clearTimeout(timer);
        next();
      });
    }
    try { next(); } catch (eIp) { /* ignore */ }
  }

  function startGeo() {
    if (geoStarted || lockedLang || hasExplicitLang()) return;
    geoStarted = true;
    applyAutoLang(detectAutoLang() || 'en');
    refineFromIpCountry();
  }

  function refineFromGeo() {
    if (lockedLang || hasExplicitLang()) return;
    if (!geoStarted) startGeo();
    else refineFromIpCountry();
  }

  function shortRow(k) {
    var row = SHORT_TABLE[k];
    if (!row) return null;
    var i = MSG_LANGS.indexOf(lang);
    if (i < 0) return null; // v3047 : langue sans texte court (zh) → message complet traduit, plus d'anglais
    return row[i] || row[0];
  }
  /** Texte court pour une notification, ou null si le message est déjà court. */
  function shortMsg(text) {
    try {
      if (text == null) return null;
      var raw = String(text);
      var norm = raw.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
      var k = SHORT_RAW[norm] || SHORT_RAW[norm.replace(/[.!]$/, '')];
      if (k) return shortRow(k);
      var mk = MSG_FR[norm] || MSG_FR[norm.replace(/[.!]$/, '')];
      if (mk && SHORT_OF[mk]) return shortRow(SHORT_OF[mk]);
      var dk;
      for (dk in SHORT_OF) {
        if (!Object.prototype.hasOwnProperty.call(SHORT_OF, dk) || dk.indexOf('m_') === 0) continue;
        var cur = t(dk), fr = SHORT_FR[dk], en = DICT.en && DICT.en[dk];
        if ((cur && cur !== dk && raw === cur) || (fr && raw === fr) || (en && raw === en)) return shortRow(SHORT_OF[dk]);
      }
      return null;
    } catch (eS) {
      return null;
    }
  }

  var pendingSet = null;
  /** Langue choisie dans le menu, chargée après coup : on rejoue le même bouton (js/app.js rafraîchit alors tout l'écran). */
  function replaySet(code) {
    try {
      var btn = document.querySelector('.lang-btn[data-lang="' + code + '"]');
      if (btn && typeof btn.click === 'function') btn.click();
    } catch (eRe) { /* ignore */ }
    if (lang !== code) D6.I18N.set(code);
  }

  D6.I18N = {
    t: t, short: shortMsg,
    keys: function () {
      var s = {};
      Object.keys(DICT).forEach(function (l) { Object.keys(DICT[l] || {}).forEach(function (k) { s[k] = 1; }); });
      B.extraKeys.forEach(function (k) { s[k] = 1; });
      return Object.keys(s);
    },
    msg: msg,
    depositLabel: depositLabel,
    apply: apply,
    refineFromGeo: refineFromGeo,
    get lang() { return lang; },
    set: function (code) {
      if (!SUP[code]) return;
      if (!DICT[code]) {
        // Langue pas encore téléchargée : on la charge, puis on refait exactement le même changement.
        pendingSet = code;
        loadLang(code, function () {
          if (pendingSet !== code) return;
          pendingSet = null;
          if (DICT[code]) replaySet(code);
        });
        return;
      }
      pendingSet = null;
      lang = code;
      lockedLang = true;
      persistManualLang(code);
      apply();
      // v2429 — textes des fenêtres ouvertes réglés pour la nouvelle langue (js/fit.js).
      try { document.dispatchEvent(new Event('oro:lang')); } catch (eEv) { /* ignore */ }
      try { if (D6.Fit) D6.Fit.open(); } catch (eFit) { /* ignore */ }
    }
  };

  // Démarrage : anglais (secours) + langue du joueur, écrits juste après ce script → exécutés AVANT store.js, app.js…
  // (comme l'ancien gros fichier). Puis, comme avant : apply() et startGeo().
  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    try { apply(); } catch (e7) { /* ignore */ }
    try { startGeo(); } catch (e8) { /* ignore */ }
  }
  D6.I18N_BOOT = boot;
  var need = lang === 'en' ? ['en'] : ['en', lang];
  var written = false;
  try {
    if (document.readyState === 'loading' && document.currentScript) {
      document.write(need.map(function (c) { return '<script src="' + langUrl(c) + '"><\/script>'; }).join('') +
        '<script>window.D6&&D6.I18N_BOOT&&D6.I18N_BOOT()<\/script>');
      written = true;
    }
  } catch (eW) { written = false; }
  if (!written) {
    var left = need.length;
    need.forEach(function (c) { loadLang(c, function () { if (--left === 0) boot(); }); });
  }
})(window.D6 = window.D6 || {});
