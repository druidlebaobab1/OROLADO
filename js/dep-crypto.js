/* 2026-11-16 (propriétaire : « Maketou a un souci, frais Flutterwave trop hauts : en attendant, la crypto, mais rangée comme
   les sites pro, avec des explications : où acheter, comment envoyer ») — écran « Recharger en crypto ».
   Actif seulement quand #depositBox porte la classe « dep-crypto-only » (index.html). Une ligne touchée ouvre directement
   l'adresse + le QR de cette crypto (D6.depPick, js/app.js) ; « Comment acheter » ouvre un guide pas à pas. 12 langues. */
(function () {
  'use strict';
  var D6 = window.D6 = window.D6 || {};
  function lg() { var l = String(document.documentElement.lang || 'en').slice(0, 2); return T[l] ? l : 'en'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var COINS = [
    { a: 'usdt', n: 'TRC20', sym: 'USDT', net: 'Tron · TRC20', rec: 1 },
    { a: 'usdt', n: 'BEP20', sym: 'USDT', net: 'BNB Chain · BEP20' },
    { a: 'usdc', sym: 'USDC', net: 'Ethereum · ERC20' },
    { a: 'btc', sym: 'BTC', net: 'Bitcoin' },
    { a: 'eth', sym: 'ETH', net: 'Ethereum' },
    { a: 'bnb', sym: 'BNB', net: 'BNB Chain' },
    { a: 'ltc', sym: 'LTC', net: 'Litecoin' },
    { a: 'doge', sym: 'DOGE', net: 'Dogecoin' }
  ];
  var PLAT = [
    { k: 'Binance', c: '#F0B90B', u: 'https://www.binance.com/fr/p2p' },
    { k: 'Bybit', c: '#F7A600', u: 'https://www.bybit.com/fiat/trade/otc' },
    { k: 'OKX', c: '#E5E7EB', u: 'https://www.okx.com/p2p' },
    { k: 'Bitget', c: '#00F0FF', u: 'https://www.bitget.com/p2p-trade' }
  ];

  // 2026-11-16 (propriétaire) : sites d'échange Mobile Money → USDT (Afrique de l'Ouest), vérifiés le 2026-11-16 :
  // CryptoXOF (sans inscription, Wave / Orange / MTN / Moov / Free, USDT TRC20) ; FasoChange (FOLASHADE SARL, RCCM BF-OUA-01-2024-B13-01418).
  var XCH = [
    { k: 'CryptoXOF', u: 'https://cryptoxof.com/', c: '#22C55E', t: 'tA' },
    { k: 'FasoChange', u: 'https://fasochange.net/', c: '#F59E0B', t: 'tB' }
  ];
  var OPS = ['wave', 'orange', 'mtn', 'moov'];
  var T = {
    fr: { mmT: "Payer avec ton Mobile Money", mmS: "Wave, Orange Money, MTN, Moov : un site d’échange t’envoie des USDT en quelques minutes, directement sur ton adresse OROLADO.", mm1: "Touche « Voir mon adresse » et copie ton adresse USDT · TRC20 OROLADO.", mm2: "Ouvre un des sites ci-dessus et choisis « Acheter USDT », réseau TRC20.", mm3: "Colle ton adresse OROLADO, entre le montant et choisis Wave, Orange Money, MTN ou Moov.", mm4: "Valide le paiement sur ton téléphone : les USDT arrivent en quelques minutes et ton solde OROLADO est crédité tout seul.", mmBtn: "Payer avec Mobile Money", mmAddr: "Voir mon adresse USDT · TRC20", tA: "Sans compte · rapide", tB: "Entreprise enregistrée", mmW: "Ces sites ne font pas partie d’OROLADO. Vérifie toujours le réseau TRC20 et ton adresse avant de payer. La première fois, essaie avec un petit montant.", mmHow: "Comment faire", sum: "En bref : copie ton adresse OROLADO → achète de la crypto sur Binance (ou Bybit, OKX…) → fais un « retrait » vers ton adresse OROLADO. C’est tout.", yt: "Tutos vidéo", ytD: "Sur YouTube, cherche « acheter USDT Binance P2P Orange Money » : beaucoup de vidéos montrent chaque écran pas à pas.", ytB: "Voir les tutos sur YouTube", ytQ: "acheter usdt binance p2p orange money mobile money", title: 'Recharger en crypto', b1: 'Crédit automatique', b2: 'Sécurisé', b3: '24h/24', pick: 'Choisis ta crypto', rec: 'Recommandé · frais très bas', all: 'Toutes les cryptos', allS: '+60 cryptos et réseaux',
      how: 'Comment ça marche', s1: 'Choisis ta crypto, puis copie ton adresse OROLADO (ou scanne le QR).', s2: 'Envoie depuis Binance, Bybit, OKX ou ton portefeuille, sur le MÊME réseau.', s3: 'Ton solde est crédité tout seul, en dollars, en quelques minutes.',
      buy: 'Je n’ai pas de crypto : comment en acheter ?', gT: 'Acheter de la crypto avec ton Mobile Money', gI: 'Tu peux acheter des USDT avec Orange Money, MTN, Moov ou Wave en quelques minutes sur une grande plateforme, puis les envoyer sur OROLADO.',
      gP: 'Où acheter (P2P)', gPd: 'Achat entre particuliers, protégé par la plateforme. Paiement par Orange Money, MTN, Moov, Wave…', gS: 'Étape par étape',
      g1: 'Crée un compte gratuit sur Binance (ou Bybit, OKX, Bitget) et vérifie ton identité.', g2: 'Ouvre « P2P » → « Acheter » → USDT. Choisis ton moyen de paiement (Orange Money, MTN, Moov, Wave) et un vendeur avec beaucoup d’avis positifs.',
      g3: 'Paie le vendeur avec ton Mobile Money dans l’application, puis appuie sur « J’ai payé ». Les USDT arrivent dans ton portefeuille.', g4: 'Sur OROLADO, choisis « USDT · TRC20 » et copie ton adresse.',
      g5: 'Sur Binance : « Retirer » → USDT → colle l’adresse → réseau TRON (TRC20) → confirme.', g6: 'En quelques minutes, ton solde OROLADO est crédité.',
      gE: 'Exemple', gEx: 'Tu veux recharger 10 $ : achète 11 USDT en P2P (environ 6 600 F CFA). Envoie-les en TRC20 : la plateforme garde environ 1 USDT de frais, 10 $ arrivent sur ton solde.',
      gW: 'Important', w1: 'Choisis le même réseau des deux côtés (ex. TRC20 ↔ TRC20). Un mauvais réseau = argent perdu.', w2: 'Ne paie jamais un vendeur en dehors de la plateforme.', w3: 'Besoin d’aide ? Écris-nous dans Social.',
      go: 'Choisir USDT · TRC20', open: 'Ouvrir', close: 'Fermer' },
    en: { mmT: "Pay with Mobile Money", mmS: "Wave, Orange Money, MTN, Moov: an exchange site sends you USDT within minutes, straight to your OROLADO address.", mm1: "Tap “Show my address” and copy your OROLADO USDT · TRC20 address.", mm2: "Open one of the sites above and choose “Buy USDT”, TRC20 network.", mm3: "Paste your OROLADO address, enter the amount and pick Wave, Orange Money, MTN or Moov.", mm4: "Confirm the payment on your phone: the USDT arrive within minutes and your OROLADO balance is credited automatically.", mmBtn: "Pay with Mobile Money", mmAddr: "Show my USDT · TRC20 address", tA: "No account · fast", tB: "Registered company", mmW: "These sites are not part of OROLADO. Always check the TRC20 network and your address before paying. The first time, try a small amount.", mmHow: "How to do it", sum: "In short: copy your OROLADO address → buy crypto on Binance (or Bybit, OKX…) → make a “withdrawal” to your OROLADO address. That’s it.", yt: "Video tutorials", ytD: "On YouTube, search “buy USDT Binance P2P mobile money”: many videos show every screen step by step.", ytB: "Watch tutorials on YouTube", ytQ: "buy usdt binance p2p mobile money", title: 'Deposit with crypto', b1: 'Automatic credit', b2: 'Secure', b3: '24/7', pick: 'Choose your crypto', rec: 'Recommended · very low fees', all: 'All cryptos', allS: '60+ cryptos and networks',
      how: 'How it works', s1: 'Choose your crypto, then copy your OROLADO address (or scan the QR).', s2: 'Send from Binance, Bybit, OKX or your wallet, on the SAME network.', s3: 'Your balance is credited automatically, in dollars, within minutes.',
      buy: 'No crypto yet? How to buy some', gT: 'Buy crypto with Mobile Money', gI: 'You can buy USDT with Orange Money, MTN, Moov or Wave in a few minutes on a major platform, then send it to OROLADO.',
      gP: 'Where to buy (P2P)', gPd: 'Person-to-person purchase, protected by the platform. Pay with Orange Money, MTN, Moov, Wave…', gS: 'Step by step',
      g1: 'Create a free account on Binance (or Bybit, OKX, Bitget) and verify your identity.', g2: 'Open “P2P” → “Buy” → USDT. Pick your payment method (Orange Money, MTN, Moov, Wave) and a seller with many positive reviews.',
      g3: 'Pay the seller with your Mobile Money in the app, then tap “I have paid”. The USDT arrive in your wallet.', g4: 'On OROLADO, choose “USDT · TRC20” and copy your address.',
      g5: 'On Binance: “Withdraw” → USDT → paste the address → TRON (TRC20) network → confirm.', g6: 'Within minutes, your OROLADO balance is credited.',
      gE: 'Example', gEx: 'You want to deposit $10: buy 11 USDT on P2P. Send them on TRC20: the platform keeps about 1 USDT in fees, $10 reach your balance.',
      gW: 'Important', w1: 'Use the same network on both sides (e.g. TRC20 ↔ TRC20). Wrong network = lost money.', w2: 'Never pay a seller outside the platform.', w3: 'Need help? Write to us in Social.',
      go: 'Choose USDT · TRC20', open: 'Open', close: 'Close' },
    es: { mmT: "Pagar con dinero móvil", mmS: "Un sitio de cambio te envía USDT en pocos minutos, directo a tu dirección OROLADO.", mm1: "Pulsa «Ver mi dirección» y copia tu dirección USDT · TRC20 de OROLADO.", mm2: "Abre uno de los sitios de arriba y elige «Comprar USDT», red TRC20.", mm3: "Pega tu dirección OROLADO, indica el monto y elige tu dinero móvil.", mm4: "Confirma el pago en tu teléfono: los USDT llegan en minutos y tu saldo OROLADO se acredita solo.", mmBtn: "Pagar con dinero móvil", mmAddr: "Ver mi dirección USDT · TRC20", tA: "Sin cuenta · rápido", tB: "Empresa registrada", mmW: "Estos sitios no son de OROLADO. Verifica siempre la red TRC20 y tu dirección antes de pagar. La primera vez, prueba con poco.", mmHow: "Cómo hacerlo", sum: "En resumen: copia tu dirección OROLADO → compra cripto en Binance (o Bybit, OKX…) → haz un «retiro» a tu dirección OROLADO. Eso es todo.", yt: "Tutoriales en vídeo", ytD: "En YouTube busca «comprar USDT Binance P2P»: muchos vídeos muestran cada pantalla paso a paso.", ytB: "Ver tutoriales en YouTube", ytQ: "comprar usdt binance p2p", title: 'Recargar con cripto', b1: 'Crédito automático', b2: 'Seguro', b3: '24/7', pick: 'Elige tu cripto', rec: 'Recomendado · comisiones muy bajas', all: 'Todas las criptos', allS: '+60 criptos y redes',
      how: 'Cómo funciona', s1: 'Elige tu cripto y copia tu dirección OROLADO (o escanea el QR).', s2: 'Envía desde Binance, Bybit, OKX o tu billetera, en la MISMA red.', s3: 'Tu saldo se acredita solo, en dólares, en pocos minutos.',
      buy: '¿No tienes cripto? Cómo comprar', gT: 'Comprar cripto con dinero móvil', gI: 'Puedes comprar USDT con tu método de pago local en pocos minutos en una gran plataforma y enviarlos a OROLADO.',
      gP: 'Dónde comprar (P2P)', gPd: 'Compra entre particulares, protegida por la plataforma. Pago con dinero móvil, transferencia…', gS: 'Paso a paso',
      g1: 'Crea una cuenta gratis en Binance (o Bybit, OKX, Bitget) y verifica tu identidad.', g2: 'Abre «P2P» → «Comprar» → USDT. Elige tu método de pago y un vendedor con muchas opiniones positivas.',
      g3: 'Paga al vendedor dentro de la app y pulsa «He pagado». Los USDT llegan a tu billetera.', g4: 'En OROLADO, elige «USDT · TRC20» y copia tu dirección.',
      g5: 'En Binance: «Retirar» → USDT → pega la dirección → red TRON (TRC20) → confirma.', g6: 'En pocos minutos se acredita tu saldo OROLADO.',
      gE: 'Ejemplo', gEx: 'Quieres recargar 10 $: compra 11 USDT en P2P. Envíalos por TRC20: la plataforma cobra cerca de 1 USDT, llegan 10 $ a tu saldo.',
      gW: 'Importante', w1: 'Usa la misma red en ambos lados (TRC20 ↔ TRC20). Red equivocada = dinero perdido.', w2: 'Nunca pagues a un vendedor fuera de la plataforma.', w3: '¿Ayuda? Escríbenos en Social.',
      go: 'Elegir USDT · TRC20', open: 'Abrir', close: 'Cerrar' },
    pt: { mmT: "Pagar com dinheiro móvel", mmS: "Um site de câmbio envia-te USDT em poucos minutos, direto para o teu endereço OROLADO.", mm1: "Toca em «Ver o meu endereço» e copia o teu endereço USDT · TRC20 da OROLADO.", mm2: "Abre um dos sites acima e escolhe «Comprar USDT», rede TRC20.", mm3: "Cola o teu endereço OROLADO, indica o valor e escolhe o teu dinheiro móvel.", mm4: "Confirma o pagamento no telemóvel: os USDT chegam em minutos e o teu saldo OROLADO é creditado sozinho.", mmBtn: "Pagar com dinheiro móvel", mmAddr: "Ver o meu endereço USDT · TRC20", tA: "Sem conta · rápido", tB: "Empresa registada", mmW: "Estes sites não fazem parte da OROLADO. Verifica sempre a rede TRC20 e o endereço antes de pagar. Na primeira vez, testa com pouco.", mmHow: "Como fazer", sum: "Resumindo: copia o teu endereço OROLADO → compra cripto na Binance (ou Bybit, OKX…) → faz um «levantamento» para o teu endereço OROLADO. É só isso.", yt: "Tutoriais em vídeo", ytD: "No YouTube, pesquisa «comprar USDT Binance P2P»: muitos vídeos mostram cada ecrã passo a passo.", ytB: "Ver tutoriais no YouTube", ytQ: "comprar usdt binance p2p", title: 'Recarregar com cripto', b1: 'Crédito automático', b2: 'Seguro', b3: '24h', pick: 'Escolhe a tua cripto', rec: 'Recomendado · taxas muito baixas', all: 'Todas as criptos', allS: '+60 criptos e redes',
      how: 'Como funciona', s1: 'Escolhe a tua cripto e copia o teu endereço OROLADO (ou lê o QR).', s2: 'Envia da Binance, Bybit, OKX ou da tua carteira, na MESMA rede.', s3: 'O teu saldo é creditado sozinho, em dólares, em poucos minutos.',
      buy: 'Não tens cripto? Como comprar', gT: 'Comprar cripto com dinheiro móvel', gI: 'Podes comprar USDT com o teu meio de pagamento local em poucos minutos numa grande plataforma e enviá-los para a OROLADO.',
      gP: 'Onde comprar (P2P)', gPd: 'Compra entre particulares, protegida pela plataforma. Pagamento por dinheiro móvel, PIX, transferência…', gS: 'Passo a passo',
      g1: 'Cria uma conta grátis na Binance (ou Bybit, OKX, Bitget) e verifica a tua identidade.', g2: 'Abre «P2P» → «Comprar» → USDT. Escolhe o meio de pagamento e um vendedor com muitas avaliações positivas.',
      g3: 'Paga ao vendedor na app e toca em «Já paguei». Os USDT chegam à tua carteira.', g4: 'Na OROLADO, escolhe «USDT · TRC20» e copia o teu endereço.',
      g5: 'Na Binance: «Levantar» → USDT → cola o endereço → rede TRON (TRC20) → confirma.', g6: 'Em poucos minutos, o teu saldo OROLADO é creditado.',
      gE: 'Exemplo', gEx: 'Queres recarregar 10 $: compra 11 USDT em P2P. Envia em TRC20: a plataforma fica com cerca de 1 USDT, chegam 10 $ ao teu saldo.',
      gW: 'Importante', w1: 'Usa a mesma rede dos dois lados (TRC20 ↔ TRC20). Rede errada = dinheiro perdido.', w2: 'Nunca pagues a um vendedor fora da plataforma.', w3: 'Precisas de ajuda? Escreve-nos no Social.',
      go: 'Escolher USDT · TRC20', open: 'Abrir', close: 'Fechar' },
    ar: { mmT: "ادفع بالمال عبر الهاتف", mmS: "موقع صرافة يرسل لك USDT خلال دقائق مباشرة إلى عنوان OROLADO الخاص بك.", mm1: "اضغط «عرض عنواني» وانسخ عنوان USDT · TRC20 الخاص بك في OROLADO.", mm2: "افتح أحد المواقع أعلاه واختر «شراء USDT» على شبكة TRC20.", mm3: "الصق عنوان OROLADO، أدخل المبلغ واختر وسيلة الدفع عبر الهاتف.", mm4: "أكّد الدفع على هاتفك: تصل USDT خلال دقائق ويُضاف رصيدك في OROLADO تلقائيًا.", mmBtn: "ادفع بالمال عبر الهاتف", mmAddr: "عرض عنوان USDT · TRC20", tA: "بدون حساب · سريع", tB: "شركة مسجّلة", mmW: "هذه المواقع ليست تابعة لـ OROLADO. تحقّق دائمًا من شبكة TRC20 ومن عنوانك قبل الدفع. في المرة الأولى جرّب بمبلغ صغير.", mmHow: "الطريقة", sum: "باختصار: انسخ عنوان OROLADO ← اشترِ عملة رقمية من Binance (أو Bybit أو OKX…) ← قم «بسحب» إلى عنوان OROLADO. هذا كل شيء.", yt: "شروحات بالفيديو", ytD: "ابحث في YouTube عن «شراء USDT Binance P2P»: فيديوهات كثيرة تشرح كل شاشة خطوة بخطوة.", ytB: "شاهد الشروحات على YouTube", ytQ: "شراء usdt binance p2p", title: 'الشحن بالعملات الرقمية', b1: 'إضافة تلقائية', b2: 'آمن', b3: '24/7', pick: 'اختر عملتك', rec: 'موصى به · رسوم منخفضة جدًا', all: 'كل العملات', allS: '+60 عملة وشبكة',
      how: 'كيف يعمل', s1: 'اختر عملتك ثم انسخ عنوان OROLADO الخاص بك (أو امسح رمز QR).', s2: 'أرسل من Binance أو Bybit أو OKX أو محفظتك على الشبكة نفسها.', s3: 'يُضاف رصيدك تلقائيًا بالدولار خلال دقائق.',
      buy: 'ليس لديك عملات رقمية؟ كيف تشتري', gT: 'اشترِ العملات الرقمية بالمال عبر الهاتف', gI: 'يمكنك شراء USDT بوسيلة الدفع المحلية خلال دقائق على منصة كبيرة ثم إرسالها إلى OROLADO.',
      gP: 'أين تشتري (P2P)', gPd: 'شراء بين الأفراد تحميه المنصة. الدفع بالمال عبر الهاتف أو التحويل…', gS: 'خطوة بخطوة',
      g1: 'أنشئ حسابًا مجانيًا على Binance (أو Bybit أو OKX أو Bitget) ووثّق هويتك.', g2: 'افتح «P2P» ← «شراء» ← USDT. اختر وسيلة الدفع وبائعًا لديه تقييمات إيجابية كثيرة.',
      g3: 'ادفع للبائع داخل التطبيق ثم اضغط «لقد دفعت». تصل USDT إلى محفظتك.', g4: 'على OROLADO اختر «USDT · TRC20» وانسخ عنوانك.',
      g5: 'على Binance: «سحب» ← USDT ← الصق العنوان ← شبكة TRON (TRC20) ← تأكيد.', g6: 'خلال دقائق يُضاف المبلغ إلى رصيدك في OROLADO.',
      gE: 'مثال', gEx: 'تريد شحن 10 $: اشترِ 11 USDT عبر P2P وأرسلها على TRC20. تأخذ المنصة نحو 1 USDT رسومًا ويصل 10 $ إلى رصيدك.',
      gW: 'مهم', w1: 'استخدم الشبكة نفسها في الجهتين (TRC20 ↔ TRC20). الشبكة الخاطئة = ضياع المال.', w2: 'لا تدفع أبدًا لبائع خارج المنصة.', w3: 'تحتاج مساعدة؟ راسلنا في Social.',
      go: 'اختيار USDT · TRC20', open: 'فتح', close: 'إغلاق' },
    tr: { mmT: "Mobil para ile öde", mmS: "Bir döviz sitesi birkaç dakikada USDT’yi doğrudan OROLADO adresine gönderir.", mm1: "“Adresimi göster”e dokun ve OROLADO USDT · TRC20 adresini kopyala.", mm2: "Yukarıdaki sitelerden birini aç ve TRC20 ağında “USDT al”ı seç.", mm3: "OROLADO adresini yapıştır, tutarı gir ve mobil paranı seç.", mm4: "Ödemeyi telefonunda onayla: USDT birkaç dakikada gelir ve OROLADO bakiyen otomatik yüklenir.", mmBtn: "Mobil para ile öde", mmAddr: "USDT · TRC20 adresimi göster", tA: "Hesapsız · hızlı", tB: "Kayıtlı şirket", mmW: "Bu siteler OROLADO’ya ait değildir. Ödemeden önce TRC20 ağını ve adresini her zaman kontrol et. İlk sefer küçük bir tutarla dene.", mmHow: "Nasıl yapılır", sum: "Kısaca: OROLADO adresini kopyala → Binance’ten (veya Bybit, OKX…) kripto al → OROLADO adresine “çekim” yap. Bu kadar.", yt: "Video anlatımlar", ytD: "YouTube’da “Binance P2P USDT alma” ara: birçok video her ekranı adım adım gösterir.", ytB: "YouTube’da anlatımları izle", ytQ: "binance p2p usdt alma", title: 'Kripto ile yükle', b1: 'Otomatik yükleme', b2: 'Güvenli', b3: '7/24', pick: 'Kriptonu seç', rec: 'Önerilen · çok düşük ücret', all: 'Tüm kriptolar', allS: '60+ kripto ve ağ',
      how: 'Nasıl çalışır', s1: 'Kriptonu seç, sonra OROLADO adresini kopyala (veya QR’ı tara).', s2: 'Binance, Bybit, OKX veya cüzdanından AYNI ağda gönder.', s3: 'Bakiyen birkaç dakikada dolar olarak otomatik yüklenir.',
      buy: 'Kriptun yok mu? Nasıl alınır', gT: 'Mobil para ile kripto al', gI: 'Büyük bir platformda yerel ödeme yönteminle birkaç dakikada USDT alıp OROLADO’ya gönderebilirsin.',
      gP: 'Nereden alınır (P2P)', gPd: 'Platform korumalı kişiden kişiye alım. Mobil para, havale… ile ödeme.', gS: 'Adım adım',
      g1: 'Binance’te (veya Bybit, OKX, Bitget) ücretsiz hesap aç ve kimliğini doğrula.', g2: '“P2P” → “Al” → USDT. Ödeme yöntemini ve çok olumlu yorumu olan bir satıcı seç.',
      g3: 'Satıcıya uygulama içinde öde ve “Ödedim”e dokun. USDT cüzdanına gelir.', g4: 'OROLADO’da “USDT · TRC20” seç ve adresini kopyala.',
      g5: 'Binance’te: “Çek” → USDT → adresi yapıştır → TRON (TRC20) ağı → onayla.', g6: 'Birkaç dakikada OROLADO bakiyen yüklenir.',
      gE: 'Örnek', gEx: '10 $ yüklemek istiyorsun: P2P’de 11 USDT al. TRC20 ile gönder: platform yaklaşık 1 USDT ücret alır, bakiyene 10 $ gelir.',
      gW: 'Önemli', w1: 'İki tarafta aynı ağı kullan (TRC20 ↔ TRC20). Yanlış ağ = kaybolan para.', w2: 'Satıcıya asla platform dışında ödeme yapma.', w3: 'Yardım mı lazım? Social’dan yaz.',
      go: 'USDT · TRC20 seç', open: 'Aç', close: 'Kapat' },
    vi: { mmT: "Thanh toán bằng ví điện thoại", mmS: "Một trang đổi tiền gửi USDT cho bạn trong vài phút, thẳng vào địa chỉ OROLADO.", mm1: "Bấm «Xem địa chỉ của tôi» và sao chép địa chỉ USDT · TRC20 OROLADO.", mm2: "Mở một trong các trang bên trên và chọn «Mua USDT», mạng TRC20.", mm3: "Dán địa chỉ OROLADO, nhập số tiền và chọn ví điện thoại.", mm4: "Xác nhận thanh toán trên điện thoại: USDT về trong vài phút và số dư OROLADO được cộng tự động.", mmBtn: "Thanh toán bằng ví điện thoại", mmAddr: "Xem địa chỉ USDT · TRC20", tA: "Không cần tài khoản · nhanh", tB: "Công ty đã đăng ký", mmW: "Các trang này không thuộc OROLADO. Luôn kiểm tra mạng TRC20 và địa chỉ trước khi trả. Lần đầu hãy thử số tiền nhỏ.", mmHow: "Cách làm", sum: "Tóm tắt: sao chép địa chỉ OROLADO → mua crypto trên Binance (hoặc Bybit, OKX…) → «rút» về địa chỉ OROLADO của bạn. Vậy thôi.", yt: "Video hướng dẫn", ytD: "Trên YouTube, tìm «mua USDT Binance P2P»: nhiều video hướng dẫn từng màn hình.", ytB: "Xem hướng dẫn trên YouTube", ytQ: "mua usdt binance p2p", title: 'Nạp bằng crypto', b1: 'Cộng tự động', b2: 'An toàn', b3: '24/7', pick: 'Chọn crypto', rec: 'Khuyên dùng · phí rất thấp', all: 'Tất cả crypto', allS: '60+ crypto và mạng',
      how: 'Cách hoạt động', s1: 'Chọn crypto, rồi sao chép địa chỉ OROLADO của bạn (hoặc quét QR).', s2: 'Gửi từ Binance, Bybit, OKX hoặc ví của bạn, trên CÙNG một mạng.', s3: 'Số dư được cộng tự động bằng đô la trong vài phút.',
      buy: 'Chưa có crypto? Cách mua', gT: 'Mua crypto bằng ví điện thoại', gI: 'Bạn có thể mua USDT bằng phương thức thanh toán địa phương trong vài phút trên sàn lớn, rồi gửi về OROLADO.',
      gP: 'Mua ở đâu (P2P)', gPd: 'Mua giữa người với người, được sàn bảo vệ. Thanh toán bằng ví điện thoại, chuyển khoản…', gS: 'Từng bước',
      g1: 'Tạo tài khoản miễn phí trên Binance (hoặc Bybit, OKX, Bitget) và xác minh danh tính.', g2: 'Mở «P2P» → «Mua» → USDT. Chọn phương thức thanh toán và người bán có nhiều đánh giá tốt.',
      g3: 'Thanh toán cho người bán trong ứng dụng rồi bấm «Tôi đã thanh toán». USDT về ví của bạn.', g4: 'Trên OROLADO, chọn «USDT · TRC20» và sao chép địa chỉ.',
      g5: 'Trên Binance: «Rút» → USDT → dán địa chỉ → mạng TRON (TRC20) → xác nhận.', g6: 'Sau vài phút, số dư OROLADO được cộng.',
      gE: 'Ví dụ', gEx: 'Bạn muốn nạp 10 $: mua 11 USDT qua P2P. Gửi bằng TRC20: sàn giữ khoảng 1 USDT phí, 10 $ vào số dư.',
      gW: 'Quan trọng', w1: 'Dùng cùng một mạng ở hai đầu (TRC20 ↔ TRC20). Sai mạng = mất tiền.', w2: 'Không bao giờ trả tiền cho người bán ngoài sàn.', w3: 'Cần hỗ trợ? Nhắn cho chúng tôi trong Social.',
      go: 'Chọn USDT · TRC20', open: 'Mở', close: 'Đóng' },
    id: { mmT: "Bayar dengan uang seluler", mmS: "Situs penukaran mengirim USDT dalam beberapa menit, langsung ke alamat OROLADO-mu.", mm1: "Ketuk «Lihat alamatku» dan salin alamat USDT · TRC20 OROLADO-mu.", mm2: "Buka salah satu situs di atas dan pilih «Beli USDT», jaringan TRC20.", mm3: "Tempel alamat OROLADO, masukkan jumlah dan pilih uang selulermu.", mm4: "Konfirmasi pembayaran di ponsel: USDT tiba dalam beberapa menit dan saldo OROLADO bertambah otomatis.", mmBtn: "Bayar dengan uang seluler", mmAddr: "Lihat alamat USDT · TRC20", tA: "Tanpa akun · cepat", tB: "Perusahaan terdaftar", mmW: "Situs ini bukan bagian dari OROLADO. Selalu periksa jaringan TRC20 dan alamatmu sebelum membayar. Pertama kali, coba jumlah kecil.", mmHow: "Caranya", sum: "Singkatnya: salin alamat OROLADO → beli kripto di Binance (atau Bybit, OKX…) → lakukan «penarikan» ke alamat OROLADO-mu. Selesai.", yt: "Tutorial video", ytD: "Di YouTube, cari «beli USDT Binance P2P»: banyak video menunjukkan setiap layar langkah demi langkah.", ytB: "Tonton tutorial di YouTube", ytQ: "beli usdt binance p2p", title: 'Isi saldo dengan kripto', b1: 'Kredit otomatis', b2: 'Aman', b3: '24/7', pick: 'Pilih kriptomu', rec: 'Disarankan · biaya sangat rendah', all: 'Semua kripto', allS: '60+ kripto dan jaringan',
      how: 'Cara kerjanya', s1: 'Pilih kriptomu, lalu salin alamat OROLADO-mu (atau pindai QR).', s2: 'Kirim dari Binance, Bybit, OKX atau dompetmu, di jaringan yang SAMA.', s3: 'Saldomu otomatis bertambah dalam dolar dalam beberapa menit.',
      buy: 'Belum punya kripto? Cara membeli', gT: 'Beli kripto dengan uang seluler', gI: 'Kamu bisa membeli USDT dengan metode pembayaran lokal dalam beberapa menit di platform besar, lalu mengirimnya ke OROLADO.',
      gP: 'Tempat membeli (P2P)', gPd: 'Pembelian antarpengguna, dilindungi platform. Bayar dengan uang seluler, transfer…', gS: 'Langkah demi langkah',
      g1: 'Buat akun gratis di Binance (atau Bybit, OKX, Bitget) dan verifikasi identitasmu.', g2: 'Buka «P2P» → «Beli» → USDT. Pilih metode pembayaran dan penjual dengan banyak ulasan positif.',
      g3: 'Bayar penjual di dalam aplikasi, lalu ketuk «Saya sudah bayar». USDT masuk ke dompetmu.', g4: 'Di OROLADO, pilih «USDT · TRC20» dan salin alamatmu.',
      g5: 'Di Binance: «Tarik» → USDT → tempel alamat → jaringan TRON (TRC20) → konfirmasi.', g6: 'Dalam beberapa menit, saldo OROLADO-mu bertambah.',
      gE: 'Contoh', gEx: 'Kamu ingin isi 10 $: beli 11 USDT lewat P2P. Kirim via TRC20: platform mengambil sekitar 1 USDT, 10 $ masuk ke saldomu.',
      gW: 'Penting', w1: 'Gunakan jaringan yang sama di kedua sisi (TRC20 ↔ TRC20). Jaringan salah = uang hilang.', w2: 'Jangan pernah membayar penjual di luar platform.', w3: 'Butuh bantuan? Tulis ke kami di Social.',
      go: 'Pilih USDT · TRC20', open: 'Buka', close: 'Tutup' },
    ru: { mmT: "Оплата мобильными деньгами", mmS: "Обменный сайт за несколько минут отправит USDT прямо на ваш адрес OROLADO.", mm1: "Нажмите «Показать мой адрес» и скопируйте адрес USDT · TRC20 в OROLADO.", mm2: "Откройте один из сайтов выше и выберите «Купить USDT», сеть TRC20.", mm3: "Вставьте адрес OROLADO, введите сумму и выберите мобильные деньги.", mm4: "Подтвердите оплату на телефоне: USDT придут за несколько минут, баланс OROLADO пополнится сам.", mmBtn: "Оплатить мобильными деньгами", mmAddr: "Показать адрес USDT · TRC20", tA: "Без аккаунта · быстро", tB: "Зарегистрированная компания", mmW: "Эти сайты не принадлежат OROLADO. Всегда проверяйте сеть TRC20 и адрес перед оплатой. В первый раз попробуйте небольшую сумму.", mmHow: "Как это сделать", sum: "Коротко: скопируйте адрес OROLADO → купите криптовалюту на Binance (или Bybit, OKX…) → сделайте «вывод» на свой адрес OROLADO. Вот и всё.", yt: "Видеоуроки", ytD: "На YouTube найдите «купить USDT Binance P2P»: много видео показывают каждый экран по шагам.", ytB: "Смотреть уроки на YouTube", ytQ: "купить usdt binance p2p", title: 'Пополнение криптовалютой', b1: 'Автозачисление', b2: 'Безопасно', b3: '24/7', pick: 'Выберите криптовалюту', rec: 'Рекомендуем · очень низкие комиссии', all: 'Все криптовалюты', allS: '60+ монет и сетей',
      how: 'Как это работает', s1: 'Выберите криптовалюту и скопируйте свой адрес OROLADO (или отсканируйте QR).', s2: 'Отправьте с Binance, Bybit, OKX или своего кошелька в ТОЙ ЖЕ сети.', s3: 'Баланс пополнится автоматически, в долларах, за несколько минут.',
      buy: 'Нет криптовалюты? Как купить', gT: 'Купить криптовалюту через мобильные деньги', gI: 'Вы можете за несколько минут купить USDT местным способом оплаты на крупной платформе и отправить их в OROLADO.',
      gP: 'Где купить (P2P)', gPd: 'Покупка между людьми под защитой платформы. Оплата мобильными деньгами, переводом…', gS: 'Пошагово',
      g1: 'Создайте бесплатный аккаунт на Binance (или Bybit, OKX, Bitget) и пройдите проверку личности.', g2: 'Откройте «P2P» → «Купить» → USDT. Выберите способ оплаты и продавца с большим числом положительных отзывов.',
      g3: 'Оплатите продавцу в приложении и нажмите «Я оплатил». USDT придут в ваш кошелёк.', g4: 'В OROLADO выберите «USDT · TRC20» и скопируйте адрес.',
      g5: 'На Binance: «Вывод» → USDT → вставьте адрес → сеть TRON (TRC20) → подтвердите.', g6: 'Через несколько минут баланс OROLADO пополнится.',
      gE: 'Пример', gEx: 'Хотите пополнить на 10 $: купите 11 USDT через P2P. Отправьте в сети TRC20: платформа берёт около 1 USDT, на баланс придут 10 $.',
      gW: 'Важно', w1: 'Используйте одну и ту же сеть с обеих сторон (TRC20 ↔ TRC20). Не та сеть = потерянные деньги.', w2: 'Никогда не платите продавцу вне платформы.', w3: 'Нужна помощь? Напишите нам в Social.',
      go: 'Выбрать USDT · TRC20', open: 'Открыть', close: 'Закрыть' },
    de: { mmT: "Mit Mobile Money bezahlen", mmS: "Eine Tauschseite schickt dir in wenigen Minuten USDT direkt an deine OROLADO-Adresse.", mm1: "Tippe auf „Meine Adresse zeigen“ und kopiere deine OROLADO-Adresse USDT · TRC20.", mm2: "Öffne eine der Seiten oben und wähle „USDT kaufen“, Netzwerk TRC20.", mm3: "Füge deine OROLADO-Adresse ein, gib den Betrag ein und wähle dein Mobile Money.", mm4: "Bestätige die Zahlung am Handy: die USDT kommen in wenigen Minuten, dein OROLADO-Guthaben wird automatisch gutgeschrieben.", mmBtn: "Mit Mobile Money bezahlen", mmAddr: "Meine USDT · TRC20-Adresse zeigen", tA: "Ohne Konto · schnell", tB: "Eingetragene Firma", mmW: "Diese Seiten gehören nicht zu OROLADO. Prüfe vor dem Bezahlen immer das TRC20-Netzwerk und deine Adresse. Beim ersten Mal mit kleinem Betrag testen.", mmHow: "So geht’s", sum: "Kurz gesagt: OROLADO-Adresse kopieren → Krypto bei Binance (oder Bybit, OKX…) kaufen → eine „Auszahlung“ an deine OROLADO-Adresse machen. Fertig.", yt: "Video-Anleitungen", ytD: "Suche auf YouTube nach „USDT kaufen Binance P2P“: viele Videos zeigen jeden Bildschirm Schritt für Schritt.", ytB: "Anleitungen auf YouTube ansehen", ytQ: "usdt kaufen binance p2p", title: 'Mit Krypto einzahlen', b1: 'Automatische Gutschrift', b2: 'Sicher', b3: '24/7', pick: 'Wähle deine Krypto', rec: 'Empfohlen · sehr niedrige Gebühren', all: 'Alle Kryptos', allS: '60+ Kryptos und Netzwerke',
      how: 'So funktioniert’s', s1: 'Wähle deine Krypto und kopiere deine OROLADO-Adresse (oder scanne den QR-Code).', s2: 'Sende von Binance, Bybit, OKX oder deiner Wallet im GLEICHEN Netzwerk.', s3: 'Dein Guthaben wird in wenigen Minuten automatisch in Dollar gutgeschrieben.',
      buy: 'Noch keine Krypto? So kaufst du sie', gT: 'Krypto mit Mobile Money kaufen', gI: 'Du kannst USDT in wenigen Minuten mit deiner lokalen Zahlungsart auf einer großen Plattform kaufen und an OROLADO senden.',
      gP: 'Wo kaufen (P2P)', gPd: 'Kauf von Privat zu Privat, von der Plattform geschützt. Zahlung per Mobile Money, Überweisung…', gS: 'Schritt für Schritt',
      g1: 'Erstelle ein kostenloses Konto bei Binance (oder Bybit, OKX, Bitget) und bestätige deine Identität.', g2: 'Öffne „P2P“ → „Kaufen“ → USDT. Wähle deine Zahlungsart und einen Verkäufer mit vielen positiven Bewertungen.',
      g3: 'Bezahle den Verkäufer in der App und tippe auf „Ich habe bezahlt“. Die USDT kommen in deine Wallet.', g4: 'Wähle bei OROLADO „USDT · TRC20“ und kopiere deine Adresse.',
      g5: 'Bei Binance: „Auszahlen“ → USDT → Adresse einfügen → Netzwerk TRON (TRC20) → bestätigen.', g6: 'In wenigen Minuten ist dein OROLADO-Guthaben gutgeschrieben.',
      gE: 'Beispiel', gEx: 'Du willst 10 $ einzahlen: kaufe 11 USDT per P2P. Sende sie über TRC20: die Plattform behält etwa 1 USDT Gebühr, 10 $ kommen an.',
      gW: 'Wichtig', w1: 'Nutze auf beiden Seiten dasselbe Netzwerk (TRC20 ↔ TRC20). Falsches Netzwerk = Geld verloren.', w2: 'Bezahle einen Verkäufer nie außerhalb der Plattform.', w3: 'Hilfe nötig? Schreib uns in Social.',
      go: 'USDT · TRC20 wählen', open: 'Öffnen', close: 'Schließen' },
    hi: { mmT: "मोबाइल मनी से भुगतान", mmS: "एक एक्सचेंज साइट कुछ मिनटों में USDT सीधे आपके OROLADO पते पर भेजती है।", mm1: "«मेरा पता दिखाएँ» दबाएँ और अपना OROLADO USDT · TRC20 पता कॉपी करें।", mm2: "ऊपर दी गई किसी साइट को खोलें और TRC20 नेटवर्क पर «USDT खरीदें» चुनें।", mm3: "अपना OROLADO पता पेस्ट करें, राशि डालें और अपना मोबाइल मनी चुनें।", mm4: "फ़ोन पर भुगतान की पुष्टि करें: USDT कुछ मिनटों में आते हैं और OROLADO बैलेंस अपने-आप जुड़ जाता है।", mmBtn: "मोबाइल मनी से भुगतान", mmAddr: "मेरा USDT · TRC20 पता दिखाएँ", tA: "बिना खाते · तेज़", tB: "पंजीकृत कंपनी", mmW: "ये साइटें OROLADO की नहीं हैं। भुगतान से पहले हमेशा TRC20 नेटवर्क और पता जाँचें। पहली बार छोटी राशि से आज़माएँ।", mmHow: "कैसे करें", sum: "संक्षेप में: अपना OROLADO पता कॉपी करें → Binance (या Bybit, OKX…) पर क्रिप्टो खरीदें → अपने OROLADO पते पर «निकासी» करें। बस इतना ही।", yt: "वीडियो गाइड", ytD: "YouTube पर «Binance P2P से USDT कैसे खरीदें» खोजें: कई वीडियो हर स्क्रीन कदम दर कदम दिखाते हैं।", ytB: "YouTube पर गाइड देखें", ytQ: "binance p2p usdt kaise kharide", title: 'क्रिप्टो से रिचार्ज', b1: 'अपने-आप क्रेडिट', b2: 'सुरक्षित', b3: '24/7', pick: 'अपनी क्रिप्टो चुनें', rec: 'सुझाया गया · बहुत कम शुल्क', all: 'सभी क्रिप्टो', allS: '60+ क्रिप्टो और नेटवर्क',
      how: 'यह कैसे काम करता है', s1: 'अपनी क्रिप्टो चुनें, फिर अपना OROLADO पता कॉपी करें (या QR स्कैन करें)।', s2: 'Binance, Bybit, OKX या अपने वॉलेट से उसी नेटवर्क पर भेजें।', s3: 'कुछ मिनटों में आपका बैलेंस डॉलर में अपने-आप जुड़ जाता है।',
      buy: 'क्रिप्टो नहीं है? कैसे खरीदें', gT: 'मोबाइल मनी से क्रिप्टो खरीदें', gI: 'आप किसी बड़े प्लेटफ़ॉर्म पर अपने स्थानीय भुगतान तरीके से कुछ मिनटों में USDT खरीदकर OROLADO पर भेज सकते हैं।',
      gP: 'कहाँ खरीदें (P2P)', gPd: 'लोगों के बीच खरीद, प्लेटफ़ॉर्म द्वारा सुरक्षित। मोबाइल मनी, ट्रांसफ़र… से भुगतान।', gS: 'कदम दर कदम',
      g1: 'Binance (या Bybit, OKX, Bitget) पर मुफ़्त खाता बनाएँ और पहचान सत्यापित करें।', g2: '“P2P” → “Buy” → USDT खोलें। भुगतान का तरीका और बहुत अच्छी समीक्षाओं वाला विक्रेता चुनें।',
      g3: 'ऐप में विक्रेता को भुगतान करें, फिर “मैंने भुगतान किया” दबाएँ। USDT आपके वॉलेट में आ जाते हैं।', g4: 'OROLADO पर “USDT · TRC20” चुनें और अपना पता कॉपी करें।',
      g5: 'Binance पर: “Withdraw” → USDT → पता पेस्ट करें → TRON (TRC20) नेटवर्क → पुष्टि करें।', g6: 'कुछ मिनटों में आपका OROLADO बैलेंस जुड़ जाता है।',
      gE: 'उदाहरण', gEx: '10 $ रिचार्ज करना है: P2P पर 11 USDT खरीदें। TRC20 पर भेजें: प्लेटफ़ॉर्म लगभग 1 USDT शुल्क लेता है, 10 $ बैलेंस में आते हैं।',
      gW: 'ज़रूरी', w1: 'दोनों तरफ़ एक ही नेटवर्क चुनें (TRC20 ↔ TRC20)। गलत नेटवर्क = पैसे गए।', w2: 'प्लेटफ़ॉर्म के बाहर कभी किसी विक्रेता को भुगतान न करें।', w3: 'मदद चाहिए? Social में लिखें।',
      go: 'USDT · TRC20 चुनें', open: 'खोलें', close: 'बंद करें' },
    zh: { mmT: "用移动支付付款", mmS: "兑换网站几分钟内把 USDT 直接发送到你的 OROLADO 地址。", mm1: "点“显示我的地址”，复制你的 OROLADO USDT · TRC20 地址。", mm2: "打开上方任一网站，选择“购买 USDT”，网络选 TRC20。", mm3: "粘贴 OROLADO 地址，输入金额，选择你的移动支付。", mm4: "在手机上确认付款：几分钟内 USDT 到账，OROLADO 余额自动增加。", mmBtn: "用移动支付付款", mmAddr: "显示我的 USDT · TRC20 地址", tA: "无需账户 · 快速", tB: "注册公司", mmW: "这些网站不属于 OROLADO。付款前务必核对 TRC20 网络和地址。第一次请先用小额试试。", mmHow: "操作方法", sum: "简单来说：复制你的 OROLADO 地址 → 在 Binance（或 Bybit、OKX…）购买加密货币 → “提现”到你的 OROLADO 地址。就这么简单。", yt: "视频教程", ytD: "在 YouTube 搜索“Binance P2P 购买 USDT”：很多视频一步步展示每个页面。", ytB: "在 YouTube 观看教程", ytQ: "binance p2p 购买 usdt", title: '加密货币充值', b1: '自动到账', b2: '安全', b3: '24小时', pick: '选择你的加密货币', rec: '推荐 · 手续费极低', all: '全部加密货币', allS: '60+ 币种和网络',
      how: '如何操作', s1: '选择加密货币，然后复制你的 OROLADO 地址（或扫描二维码）。', s2: '从 Binance、Bybit、OKX 或你的钱包，在同一网络上发送。', s3: '几分钟内，余额以美元自动到账。',
      buy: '没有加密货币？如何购买', gT: '用移动支付购买加密货币', gI: '你可以在大型平台上用本地支付方式几分钟内买到 USDT，然后发送到 OROLADO。',
      gP: '在哪里买（P2P）', gPd: '个人之间交易，由平台担保。可用移动支付、转账等付款。', gS: '分步说明',
      g1: '在 Binance（或 Bybit、OKX、Bitget）免费注册并完成身份认证。', g2: '打开“P2P”→“购买”→ USDT。选择付款方式，以及好评多的卖家。',
      g3: '在应用内向卖家付款，然后点“我已付款”。USDT 会到你的钱包。', g4: '在 OROLADO 选择“USDT · TRC20”并复制地址。',
      g5: '在 Binance：“提现”→ USDT → 粘贴地址 → TRON（TRC20）网络 → 确认。', g6: '几分钟后，OROLADO 余额到账。',
      gE: '示例', gEx: '想充值 10 $：在 P2P 买 11 USDT，用 TRC20 发送：平台收取约 1 USDT 手续费，10 $ 到账。',
      gW: '重要', w1: '两边使用同一网络（TRC20 ↔ TRC20）。网络选错 = 资金丢失。', w2: '切勿在平台之外向卖家付款。', w3: '需要帮助？在 Social 里联系我们。',
      go: '选择 USDT · TRC20', open: '打开', close: '关闭' }
  };

  var ICO = {
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6"/><circle cx="12" cy="17" r=".9" fill="currentColor"/></svg>',
    yt: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="#FF0000"/><path d="M10 9.2v5.6l4.8-2.8z" fill="#fff"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5L2.5 20h19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/></svg>'
  };
  function logo(a) { return '<img src="/img/coins/' + a + '.png?v=2" alt="" width="34" height="34" loading="lazy" decoding="async">'; }

  // cryptos réellement acceptées par le serveur (coffre OROLADO) : une ligne non acceptée n'est pas montrée
  var only = null, asked = 0;
  function okCoin(c) { if (!only) return true; return c.a === 'usdt' ? only.indexOf('usdt_' + String(c.n || 'trc20').toLowerCase()) >= 0 : only.indexOf(c.a) >= 0; }
  function loadOnly() {
    if (asked && Date.now() - asked < 300000) return; asked = Date.now();
    try { Promise.resolve(D6.Api && D6.Api.post ? D6.Api.post('coffreCoins', {}, 10000) : null).then(function (r) { if (r && r.ok && Array.isArray(r.only)) { only = r.only; var el = document.getElementById('depCryptoPro'); if (el) el.removeAttribute('data-l'); paint(); } }).catch(function () { /* garde tout */ }); } catch (e) { /* ignore */ }
  }
  function paint() {
    loadOnly(); addrLink();
    var box = document.getElementById('depositBox'), sel = document.getElementById('depositStepSelect');
    if (!box || !sel || !box.classList.contains('dep-crypto-only')) return;
    var L = lg(), t = T[L], el = document.getElementById('depCryptoPro');
    if (el && el.getAttribute('data-l') === L) return;
    if (!el) { el = document.createElement('div'); el.id = 'depCryptoPro'; el.className = 'dcp'; var usdt = document.getElementById('payMethodUsdt'); if (usdt && usdt.parentNode) usdt.parentNode.insertBefore(el, usdt); else sel.appendChild(el); }
    el.setAttribute('data-l', L);
    el.innerHTML =
      '<div class="dcp-hero"><h3 class="fit">' + esc(t.title) + '</h3><div class="dcp-badges">' +
        '<span>' + ICO.bolt + esc(t.b1) + '</span><span>' + ICO.lock + esc(t.b2) + '</span><span>' + ICO.clock + esc(t.b3) + '</span></div></div>' +
      '<button type="button" class="dcp-mm" data-mm="1"><span class="dcp-mm-ops">' + OPS.map(function (o) { return '<img src="icons/pay/' + o + '.svg?v=2790" alt="" width="26" height="26">'; }).join('') + '</span>' +
        '<span class="dcp-mm-t"><b>' + esc(t.mmBtn) + '</b><small>' + esc(t.mmS) + '</small></span><span class="dcp-go">' + ICO.chev + '</span></button>' +
      '<button type="button" class="dcp-buy" id="dcpBuy">' + ICO.help + '<span>' + esc(t.buy) + '</span></button>' +
      '<div class="dcp-sec">' + esc(t.pick) + '</div>' +
      '<div class="dcp-list">' + COINS.map(function (c, i) {
        if (!okCoin(c)) return '';
        return '<button type="button" class="dcp-row' + (c.rec ? ' rec' : '') + '" data-i="' + i + '"><span class="dcp-logo">' + logo(c.a) + '</span>' +
          '<span class="dcp-meta"><b>' + c.sym + '</b><small>' + esc(c.net) + '</small>' + (c.rec ? '<em>' + esc(t.rec) + '</em>' : '') + '</span>' +
          '<span class="dcp-go">' + ICO.chev + '</span></button>';
      }).join('') +
      '<button type="button" class="dcp-row dcp-all" data-all="1"><span class="dcp-logo dcp-plus">' + ICO.plus + '</span><span class="dcp-meta"><b>' + esc(t.all) + '</b><small>' + esc(t.allS) + '</small></span><span class="dcp-go">' + ICO.chev + '</span></button></div>' +
      '<div class="dcp-sec">' + esc(t.how) + '</div>' +
      '<ol class="dcp-steps"><li><i>1</i><span>' + esc(t.s1) + '</span></li><li><i>2</i><span>' + esc(t.s2) + '</span></li><li><i>3</i><span>' + esc(t.s3) + '</span></li></ol>' +
      '<button type="button" class="dcp-buy dcp-buy2" data-buy="1">' + ICO.help + '<span>' + esc(t.buy) + '</span></button>';
  }

  function guide() {
    var box = document.getElementById('depositBox'); if (!box) return;
    var t = T[lg()], g = document.getElementById('dcpGuide');
    if (!g) { g = document.createElement('div'); g.id = 'dcpGuide'; g.className = 'dcp-guide'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); box.appendChild(g); }
    g.innerHTML =
      '<div class="dcpg-head"><b>' + esc(t.gT) + '</b><button type="button" class="dcpg-x" data-x="1" aria-label="' + esc(t.close) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></div>' +
      '<div class="dcpg-body"><p class="dcpg-sum">' + esc(t.sum) + '</p><p class="dcpg-intro">' + esc(t.gI) + '</p>' +
        '<div class="dcp-sec">' + esc(t.gP) + '</div><p class="dcpg-pd">' + esc(t.gPd) + '</p>' +
        '<div class="dcpg-plat">' + PLAT.map(function (p) { return '<a href="' + p.u + '" target="_blank" rel="noopener noreferrer"><i style="background:' + p.c + '">' + p.k.charAt(0) + '</i><b>' + p.k + '</b><small>P2P</small></a>'; }).join('') + '</div>' +
        '<div class="dcp-sec">' + esc(t.gS) + '</div>' +
        '<ol class="dcp-steps">' + ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'].map(function (k, i) { return '<li><i>' + (i + 1) + '</i><span>' + esc(t[k]) + '</span></li>'; }).join('') + '</ol>' +
        '<div class="dcpg-ex"><b>' + esc(t.gE) + '</b><p>' + esc(t.gEx) + '</p></div>' +
        '<div class="dcp-sec">' + esc(t.yt) + '</div><p class="dcpg-pd">' + esc(t.ytD) + '</p>' +
        '<a class="dcpg-yt" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(t.ytQ) + '" target="_blank" rel="noopener noreferrer">' + ICO.yt + '<span>' + esc(t.ytB) + '</span></a>' +
        '<div class="dcpg-warn"><b>' + ICO.warn + esc(t.gW) + '</b><ul><li>' + esc(t.w1) + '</li><li>' + esc(t.w2) + '</li><li>' + esc(t.w3) + '</li></ul></div>' +
      '</div><button type="button" class="dcpg-go" data-go="1">' + esc(t.go) + '</button>';
    box.scrollTop = 0; box.classList.add('dcpg-open'); g.classList.add('on');
    var b = g.querySelector('.dcpg-body'); if (b) b.scrollTop = 0;
  }
  function mmGuide() {
    var box = document.getElementById('depositBox'); if (!box) return;
    var t = T[lg()], g = document.getElementById('dcpGuide');
    if (!g) { g = document.createElement('div'); g.id = 'dcpGuide'; g.className = 'dcp-guide'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); box.appendChild(g); }
    g.innerHTML =
      '<div class="dcpg-head"><b>' + esc(t.mmT) + '</b><button type="button" class="dcpg-x" data-x="1" aria-label="' + esc(t.close) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></div>' +
      '<div class="dcpg-body"><div class="dcpg-ops">' + OPS.map(function (o) { return '<img src="icons/pay/' + o + '.svg?v=2790" alt="" width="34" height="34">'; }).join('') + '</div>' +
        '<p class="dcpg-sum">' + esc(t.mmS) + '</p>' +
        '<div class="dcpg-xch">' + XCH.map(function (x) { return '<a href="' + x.u + '" target="_blank" rel="noopener noreferrer"><i style="background:' + x.c + '">' + x.k.charAt(0) + '</i><span><b>' + x.k + '</b><small>' + esc(t[x.t]) + '</small></span>' + ICO.chev + '</a>'; }).join('') + '</div>' +
        '<div class="dcp-sec">' + esc(t.mmHow) + '</div>' +
        '<ol class="dcp-steps">' + ['mm1', 'mm2', 'mm3', 'mm4'].map(function (k, i) { return '<li><i>' + (i + 1) + '</i><span>' + esc(t[k]) + '</span></li>'; }).join('') + '</ol>' +
        '<div class="dcpg-warn"><b>' + ICO.warn + esc(t.gW) + '</b><ul><li>' + esc(t.mmW) + '</li><li>' + esc(t.w3) + '</li></ul></div>' +
      '</div><button type="button" class="dcpg-go" data-go="1">' + esc(t.mmAddr) + '</button>';
    box.scrollTop = 0; box.classList.add('dcpg-open'); g.classList.add('on');
    var b = g.querySelector('.dcpg-body'); if (b) b.scrollTop = 0;
  }
  // sous l'adresse crypto (étape « Dépôt ») : un bouton « Payer avec Mobile Money » ouvre le même guide
  function addrLink() {
    var w = document.getElementById('oxaWalletBox'), box = document.getElementById('depositBox');
    if (!w || !box || !box.classList.contains('dep-crypto-only')) return;
    var t = T[lg()], b = document.getElementById('dcpMmLink');
    if (!b) { b = document.createElement('button'); b.type = 'button'; b.id = 'dcpMmLink'; b.className = 'dcp-mm dcp-mm-addr'; b.setAttribute('data-mm', '1'); w.parentNode.insertBefore(b, w.nextSibling); }
    if (b.getAttribute('data-l') === lg()) return;
    b.setAttribute('data-l', lg());
    b.innerHTML = '<span class="dcp-mm-ops">' + OPS.map(function (o) { return '<img src="icons/pay/' + o + '.svg?v=2790" alt="" width="22" height="22">'; }).join('') + '</span><span class="dcp-mm-t"><b>' + esc(t.mmBtn) + '</b></span><span class="dcp-go">' + ICO.chev + '</span>';
  }
  function closeGuide() { var g = document.getElementById('dcpGuide'), box = document.getElementById('depositBox'); if (g) g.classList.remove('on'); if (box) box.classList.remove('dcpg-open'); }

  document.addEventListener('click', function (e) {
    var tg = e.target && e.target.closest ? e.target : null; if (!tg) return;
    var row = tg.closest('#depCryptoPro .dcp-row');
    if (row) { e.preventDefault(); var c = COINS[+row.getAttribute('data-i')]; if (D6.depPick) D6.depPick(c ? c.a : 'usdt', c ? c.n : '', !!row.getAttribute('data-all')); return; }
    if (tg.closest('#dcpBuy') || tg.closest('#depCryptoPro [data-buy]')) { e.preventDefault(); guide(); return; }
    if (tg.closest('[data-mm]') && tg.closest('#depositBox')) { e.preventDefault(); mmGuide(); return; }
    if (tg.closest('#dcpGuide [data-x]')) { e.preventDefault(); closeGuide(); return; }
    if (tg.closest('#dcpGuide [data-go]')) { e.preventDefault(); closeGuide(); if (D6.depPick) D6.depPick('usdt', 'TRC20', false); }
  }, true);

  // peint quand l'écran Recharger s'ouvre (et à chaque changement de langue)
  var mo = new MutationObserver(function () { var m = document.getElementById('depositModal'); if (m && m.classList.contains('active')) paint(); else closeGuide(); });
  function arm() { var m = document.getElementById('depositModal'); if (m) mo.observe(m, { attributes: true, attributeFilter: ['class', 'style'] }); paint(); }
  new MutationObserver(function () { var el = document.getElementById('depCryptoPro'); if (el && el.getAttribute('data-l') !== lg()) paint(); addrLink(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
  D6.DepCrypto = { paint: paint, guide: guide, mm: mmGuide };
})();
