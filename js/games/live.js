/* v2795 — Live draws rebuilt (owner request): Roulette = Auto-Roulette style (tilted 3D wheel + ball, European table),
   Racing / Horse Race = virtual racing (odds board, camera that follows the pack, live positions, podium),
   Crypto Live = game-show money wheel (15 cryptos, pointer). One shared result for everyone at fixed times:
   the server draws (casino_draw_*), the public state comes from casino-tour.php?g=<key>; the browser only animates. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;

  /* ------------------------------------------------------------------ texts (12 languages) */
  var T = {
    en: { open: 'Place your bets', lastc: 'Last bets', closed: 'No more bets', next: 'Next round', bet: 'Place bet', placed: 'Bet placed', bclosed: 'Bets closed', pick: 'Pick your bet on the board first', red: 'Red', black: 'Black', even: 'Even', odd: 'Odd', win1: 'Winner', pair: 'Forecast', pairHint: 'Pick 2 horses · any order', m: 'm' },
    fr: { open: 'Faites vos jeux', lastc: 'Derniers paris', closed: 'Rien ne va plus', next: 'Prochain tour', bet: 'Parier', placed: 'Pari placé', bclosed: 'Paris fermés', pick: 'Choisis d’abord ton pari sur le tableau', red: 'Rouge', black: 'Noir', even: 'Pair', odd: 'Impair', win1: 'Gagnant', pair: 'Couplé', pairHint: 'Choisis 2 chevaux · ordre libre', m: 'm' },
    es: { open: 'Hagan sus apuestas', lastc: 'Últimas apuestas', closed: 'No va más', next: 'Próxima ronda', bet: 'Apostar', placed: 'Apuesta hecha', bclosed: 'Apuestas cerradas', pick: 'Elige primero tu apuesta en el tablero', red: 'Rojo', black: 'Negro', even: 'Par', odd: 'Impar', win1: 'Ganador', pair: 'Pronóstico', pairHint: 'Elige 2 caballos · cualquier orden', m: 'm' },
    pt: { open: 'Façam suas apostas', lastc: 'Últimas apostas', closed: 'Apostas encerradas', next: 'Próxima rodada', bet: 'Apostar', placed: 'Aposta feita', bclosed: 'Apostas fechadas', pick: 'Escolha primeiro sua aposta no quadro', red: 'Vermelho', black: 'Preto', even: 'Par', odd: 'Ímpar', win1: 'Vencedor', pair: 'Dupla', pairHint: 'Escolha 2 cavalos · qualquer ordem', m: 'm' },
    ar: { open: 'ضعوا رهاناتكم', lastc: 'آخر الرهانات', closed: 'لا مزيد من الرهانات', next: 'الجولة التالية', bet: 'راهن', placed: 'تم الرهان', bclosed: 'الرهانات مغلقة', pick: 'اختر رهانك على اللوحة أولاً', red: 'أحمر', black: 'أسود', even: 'زوجي', odd: 'فردي', win1: 'الفائز', pair: 'الثنائي', pairHint: 'اختر حصانين · بأي ترتيب', m: 'م' },
    tr: { open: 'Bahislerinizi yapın', lastc: 'Son bahisler', closed: 'Bahisler kapandı', next: 'Sonraki tur', bet: 'Bahis yap', placed: 'Bahis alındı', bclosed: 'Bahis kapalı', pick: 'Önce tablodan bahsini seç', red: 'Kırmızı', black: 'Siyah', even: 'Çift', odd: 'Tek', win1: 'Kazanan', pair: 'İkili', pairHint: '2 at seç · sıra önemsiz', m: 'm' },
    vi: { open: 'Mời đặt cược', lastc: 'Cược cuối', closed: 'Hết giờ cược', next: 'Vòng tiếp theo', bet: 'Đặt cược', placed: 'Đã đặt cược', bclosed: 'Đã đóng cược', pick: 'Hãy chọn cược trên bảng trước', red: 'Đỏ', black: 'Đen', even: 'Chẵn', odd: 'Lẻ', win1: 'Thắng', pair: 'Cặp đôi', pairHint: 'Chọn 2 ngựa · không cần thứ tự', m: 'm' },
    id: { open: 'Pasang taruhan', lastc: 'Taruhan terakhir', closed: 'Taruhan ditutup', next: 'Ronde berikutnya', bet: 'Pasang', placed: 'Taruhan dipasang', bclosed: 'Taruhan tutup', pick: 'Pilih dulu taruhanmu di papan', red: 'Merah', black: 'Hitam', even: 'Genap', odd: 'Ganjil', win1: 'Pemenang', pair: 'Pasangan', pairHint: 'Pilih 2 kuda · urutan bebas', m: 'm' },
    ru: { open: 'Делайте ставки', lastc: 'Последние ставки', closed: 'Ставки сделаны', next: 'Следующий раунд', bet: 'Поставить', placed: 'Ставка принята', bclosed: 'Ставки закрыты', pick: 'Сначала выберите ставку на поле', red: 'Красное', black: 'Чёрное', even: 'Чёт', odd: 'Нечет', win1: 'Победитель', pair: 'Пара', pairHint: 'Выберите 2 лошади · любой порядок', m: 'м' },
    de: { open: 'Machen Sie Ihr Spiel', lastc: 'Letzte Einsätze', closed: 'Nichts geht mehr', next: 'Nächste Runde', bet: 'Setzen', placed: 'Einsatz platziert', bclosed: 'Einsätze geschlossen', pick: 'Wähle zuerst deinen Einsatz auf dem Tisch', red: 'Rot', black: 'Schwarz', even: 'Gerade', odd: 'Ungerade', win1: 'Sieger', pair: 'Zweierwette', pairHint: 'Wähle 2 Pferde · beliebige Reihenfolge', m: 'm' },
    hi: { open: 'दांव लगाएं', lastc: 'आखिरी दांव', closed: 'दांव बंद', next: 'अगला राउंड', bet: 'दांव लगाएं', placed: 'दांव लग गया', bclosed: 'दांव बंद', pick: 'पहले बोर्ड पर अपना दांव चुनें', red: 'लाल', black: 'काला', even: 'सम', odd: 'विषम', win1: 'विजेता', pair: 'जोड़ी', pairHint: '2 घोड़े चुनें · कोई भी क्रम', m: 'मी' },
    zh: { open: '请下注', lastc: '最后下注', closed: '停止下注', next: '下一局', bet: '下注', placed: '已下注', bclosed: '下注已截止', pick: '请先在桌面上选择投注', red: '红', black: '黑', even: '双', odd: '单', win1: '独赢', pair: '连赢', pairHint: '选 2 匹马 · 不分顺序', m: '米' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }

  var RULES = {
    roulette: {
      en: '🔴 LIVE: one spin every 40 s, the same for everyone.\n1. Tap a spot on the table: a number 0 to 36 (×36), Red / Black / Even / Odd (×2) or a dozen 1-12 · 13-24 · 25-36 (×3). Your chip appears on it.\n2. Set your stake and tap “Place bet” before “No more bets”. One bet per spin.\n3. The ball lands on a number: if your spot wins, you get stake × its payout. 0 is green: Red, Black, Even, Odd and the dozens lose on 0.',
      fr: '🔴 EN DIRECT : un lancer toutes les 40 s, le même pour tout le monde.\n1. Touche une case du tapis : un numéro de 0 à 36 (×36), Rouge / Noir / Pair / Impair (×2) ou une douzaine 1-12 · 13-24 · 25-36 (×3). Ton jeton s’y pose.\n2. Choisis ta mise et touche « Parier » avant « Rien ne va plus ». Un pari par lancer.\n3. La bille tombe sur un numéro : si ta case gagne, tu touches mise × son gain. Le 0 est vert : Rouge, Noir, Pair, Impair et les douzaines perdent sur le 0.',
      es: '🔴 EN VIVO: una tirada cada 40 s, la misma para todos.\n1. Toca una casilla de la mesa: un número del 0 al 36 (×36), Rojo / Negro / Par / Impar (×2) o una docena 1-12 · 13-24 · 25-36 (×3). Tu ficha aparece en ella.\n2. Elige tu apuesta y toca «Apostar» antes de «No va más». Una apuesta por tirada.\n3. La bola cae en un número: si tu casilla gana, cobras apuesta × su pago. El 0 es verde: Rojo, Negro, Par, Impar y las docenas pierden con el 0.',
      pt: '🔴 AO VIVO: um giro a cada 40 s, o mesmo para todos.\n1. Toque numa casa da mesa: um número de 0 a 36 (×36), Vermelho / Preto / Par / Ímpar (×2) ou uma dúzia 1-12 · 13-24 · 25-36 (×3). Sua ficha aparece nela.\n2. Escolha o valor e toque em «Apostar» antes de «Apostas encerradas». Uma aposta por giro.\n3. A bola cai num número: se sua casa ganhar, você recebe aposta × o pagamento. O 0 é verde: Vermelho, Preto, Par, Ímpar e as dúzias perdem no 0.',
      ar: '🔴 مباشر: دورة كل 40 ثانية، نفسها للجميع.\n1. المس خانة على الطاولة: رقم من 0 إلى 36 (×36)، أحمر / أسود / زوجي / فردي (×2) أو دزينة 1-12 · 13-24 · 25-36 (×3). تظهر فيشتك عليها.\n2. اختر مبلغ الرهان والمس «راهن» قبل «لا مزيد من الرهانات». رهان واحد لكل دورة.\n3. تسقط الكرة على رقم: إذا ربحت خانتك تحصل على الرهان × عائدها. الصفر أخضر: الأحمر والأسود والزوجي والفردي والدزينات تخسر عند الصفر.',
      tr: '🔴 CANLI: her 40 sn’de bir çevirme, herkes için aynı.\n1. Masada bir alana dokun: 0-36 arası bir sayı (×36), Kırmızı / Siyah / Çift / Tek (×2) veya bir düzine 1-12 · 13-24 · 25-36 (×3). Fişin oraya konur.\n2. Bahis tutarını seç ve “Bahisler kapandı” demeden “Bahis yap”a dokun. Her çevirmede bir bahis.\n3. Top bir sayıya düşer: alanın kazanırsa bahis × ödemesini alırsın. 0 yeşildir: Kırmızı, Siyah, Çift, Tek ve düzineler 0’da kaybeder.',
      vi: '🔴 TRỰC TIẾP: mỗi 40 giây một lần quay, giống nhau cho mọi người.\n1. Chạm một ô trên bàn: một số từ 0 đến 36 (×36), Đỏ / Đen / Chẵn / Lẻ (×2) hoặc một tá 1-12 · 13-24 · 25-36 (×3). Phỉnh của bạn hiện trên đó.\n2. Chọn mức cược và chạm «Đặt cược» trước khi «Hết giờ cược». Mỗi lần quay một cược.\n3. Bi rơi vào một số: nếu ô của bạn thắng, bạn nhận cược × tỷ lệ trả. Số 0 màu xanh: Đỏ, Đen, Chẵn, Lẻ và các tá đều thua khi ra 0.',
      id: '🔴 LANGSUNG: satu putaran tiap 40 dtk, sama untuk semua.\n1. Sentuh kotak di meja: angka 0 sampai 36 (×36), Merah / Hitam / Genap / Ganjil (×2) atau lusin 1-12 · 13-24 · 25-36 (×3). Chipmu muncul di sana.\n2. Atur taruhan lalu sentuh «Pasang» sebelum «Taruhan ditutup». Satu taruhan per putaran.\n3. Bola jatuh di satu angka: jika kotakmu menang, kamu dapat taruhan × bayarannya. 0 berwarna hijau: Merah, Hitam, Genap, Ganjil dan lusin kalah di 0.',
      ru: '🔴 В ПРЯМОМ ЭФИРЕ: один запуск каждые 40 с, общий для всех.\n1. Нажмите на поле стола: число от 0 до 36 (×36), Красное / Чёрное / Чёт / Нечет (×2) или дюжина 1-12 · 13-24 · 25-36 (×3). Ваша фишка появится там.\n2. Выберите сумму и нажмите «Поставить» до «Ставки сделаны». Одна ставка за запуск.\n3. Шарик падает на число: если ваше поле выиграло, вы получаете ставку × выплату. 0 зелёный: Красное, Чёрное, Чёт, Нечет и дюжины на 0 проигрывают.',
      de: '🔴 LIVE: alle 40 s ein Wurf, für alle gleich.\n1. Tippe auf ein Feld des Tisches: eine Zahl von 0 bis 36 (×36), Rot / Schwarz / Gerade / Ungerade (×2) oder ein Dutzend 1-12 · 13-24 · 25-36 (×3). Dein Jeton erscheint dort.\n2. Wähle deinen Einsatz und tippe auf „Setzen“, bevor „Nichts geht mehr“ kommt. Ein Einsatz pro Wurf.\n3. Die Kugel fällt auf eine Zahl: Gewinnt dein Feld, erhältst du Einsatz × Auszahlung. Die 0 ist grün: Rot, Schwarz, Gerade, Ungerade und die Dutzende verlieren bei 0.',
      hi: '🔴 लाइव: हर 40 सेकंड में एक स्पिन, सबके लिए एक जैसा।\n1. टेबल पर कोई खाना छुएं: 0 से 36 तक कोई नंबर (×36), लाल / काला / सम / विषम (×2) या दर्जन 1-12 · 13-24 · 25-36 (×3)। आपकी चिप वहां दिखेगी।\n2. राशि चुनें और «दांव बंद» से पहले «दांव लगाएं» छुएं। हर स्पिन में एक दांव।\n3. गेंद किसी नंबर पर रुकती है: आपका खाना जीता तो आपको दांव × भुगतान मिलता है। 0 हरा है: 0 आने पर लाल, काला, सम, विषम और दर्जन हारते हैं।',
      zh: '🔴 直播：每 40 秒开一局，所有人同一结果。\n1. 点击桌面上的位置：0 到 36 任一号码（×36）、红 / 黑 / 双 / 单（×2）或一打 1-12 · 13-24 · 25-36（×3）。你的筹码会放在上面。\n2. 设定金额，在“停止下注”前点击“下注”。每局一注。\n3. 小球落在一个号码上：你的位置中奖即得 投注 × 赔率。0 为绿色：开 0 时红、黑、单、双和各打均输。'
    },
    cryptox: {
      en: '🔴 LIVE: one spin every 60 s, the same for everyone.\n1. Pick one of the 15 cryptos on the board (BTC, ETH, USDT…).\n2. Set your stake and tap “Place bet” before the countdown ends. One bet per spin.\n3. The big wheel stops under the pointer: if it is your crypto, you win ×14.4.',
      fr: '🔴 EN DIRECT : un tour de roue toutes les 60 s, le même pour tout le monde.\n1. Choisis une des 15 cryptos du tableau (BTC, ETH, USDT…).\n2. Choisis ta mise et touche « Parier » avant la fin du compte à rebours. Un pari par tour.\n3. La grande roue s’arrête sous la flèche : si c’est ta crypto, tu gagnes ×14,4.',
      es: '🔴 EN VIVO: un giro cada 60 s, el mismo para todos.\n1. Elige una de las 15 criptos del tablero (BTC, ETH, USDT…).\n2. Elige tu apuesta y toca «Apostar» antes del fin de la cuenta atrás. Una apuesta por giro.\n3. La gran rueda se detiene bajo la flecha: si es tu cripto, ganas ×14,4.',
      pt: '🔴 AO VIVO: um giro a cada 60 s, o mesmo para todos.\n1. Escolha uma das 15 criptos do quadro (BTC, ETH, USDT…).\n2. Escolha o valor e toque em «Apostar» antes do fim da contagem. Uma aposta por giro.\n3. A grande roda para sob a seta: se for a sua cripto, você ganha ×14,4.',
      ar: '🔴 مباشر: دورة كل 60 ثانية، نفسها للجميع.\n1. اختر واحدة من 15 عملة رقمية على اللوحة (BTC، ETH، USDT…).\n2. اختر مبلغ الرهان والمس «راهن» قبل نهاية العد التنازلي. رهان واحد لكل دورة.\n3. تتوقف العجلة الكبيرة تحت المؤشر: إذا كانت عملتك تربح ×14.4.',
      tr: '🔴 CANLI: her 60 sn’de bir çevirme, herkes için aynı.\n1. Tablodaki 15 kriptodan birini seç (BTC, ETH, USDT…).\n2. Bahis tutarını seç ve geri sayım bitmeden “Bahis yap”a dokun. Her çevirmede bir bahis.\n3. Büyük çark okun altında durur: senin kriptonsa ×14,4 kazanırsın.',
      vi: '🔴 TRỰC TIẾP: mỗi 60 giây một lần quay, giống nhau cho mọi người.\n1. Chọn một trong 15 đồng crypto trên bảng (BTC, ETH, USDT…).\n2. Chọn mức cược và chạm «Đặt cược» trước khi hết giờ. Mỗi lần quay một cược.\n3. Vòng quay lớn dừng dưới mũi tên: nếu là đồng của bạn, bạn thắng ×14,4.',
      id: '🔴 LANGSUNG: satu putaran tiap 60 dtk, sama untuk semua.\n1. Pilih satu dari 15 kripto di papan (BTC, ETH, USDT…).\n2. Atur taruhan lalu sentuh «Pasang» sebelum hitung mundur habis. Satu taruhan per putaran.\n3. Roda besar berhenti di bawah panah: jika itu kriptomu, kamu menang ×14,4.',
      ru: '🔴 В ПРЯМОМ ЭФИРЕ: одно вращение каждые 60 с, общее для всех.\n1. Выберите одну из 15 криптовалют на поле (BTC, ETH, USDT…).\n2. Выберите сумму и нажмите «Поставить» до конца отсчёта. Одна ставка за вращение.\n3. Большое колесо останавливается под стрелкой: если это ваша криптовалюта, вы выигрываете ×14,4.',
      de: '🔴 LIVE: alle 60 s eine Drehung, für alle gleich.\n1. Wähle eine der 15 Kryptos auf dem Tableau (BTC, ETH, USDT…).\n2. Wähle deinen Einsatz und tippe auf „Setzen“, bevor der Countdown endet. Ein Einsatz pro Drehung.\n3. Das große Rad stoppt unter dem Zeiger: Ist es deine Krypto, gewinnst du ×14,4.',
      hi: '🔴 लाइव: हर 60 सेकंड में एक स्पिन, सबके लिए एक जैसा।\n1. बोर्ड पर 15 क्रिप्टो में से एक चुनें (BTC, ETH, USDT…)।\n2. राशि चुनें और उलटी गिनती खत्म होने से पहले «दांव लगाएं» छुएं। हर स्पिन में एक दांव।\n3. बड़ा पहिया तीर के नीचे रुकता है: अगर वह आपकी क्रिप्टो है तो आप ×14.4 जीतते हैं।',
      zh: '🔴 直播：每 60 秒转一次，所有人同一结果。\n1. 在面板上从 15 种加密货币中选一种（BTC、ETH、USDT…）。\n2. 设定金额，在倒计时结束前点击“下注”。每轮一注。\n3. 大转盘停在指针下：如果是你选的币，你赢 ×14.4。'
    },
    race: {
      en: '🔴 LIVE: one race every 60 s, the same for everyone.\n1. 10 cars, each with its odds on the board (favourite = low odds, outsider = high odds).\n2. Pick your car, set your stake and tap “Place bet” before the start. One bet per race.\n3. Watch the race: if your car crosses the line 1st, you win stake × its odds.',
      fr: '🔴 EN DIRECT : une course toutes les 60 s, la même pour tout le monde.\n1. 10 voitures, chacune avec sa cote au tableau (favorite = petite cote, outsider = grosse cote).\n2. Choisis ta voiture, ta mise et touche « Parier » avant le départ. Un pari par course.\n3. Regarde la course : si ta voiture passe la ligne en 1re, tu gagnes mise × sa cote.',
      es: '🔴 EN VIVO: una carrera cada 60 s, la misma para todos.\n1. 10 coches, cada uno con su cuota en el tablero (favorito = cuota baja, outsider = cuota alta).\n2. Elige tu coche y tu apuesta y toca «Apostar» antes de la salida. Una apuesta por carrera.\n3. Mira la carrera: si tu coche cruza la meta 1.º, ganas apuesta × su cuota.',
      pt: '🔴 AO VIVO: uma corrida a cada 60 s, a mesma para todos.\n1. 10 carros, cada um com sua cotação no quadro (favorito = cotação baixa, azarão = cotação alta).\n2. Escolha seu carro e o valor e toque em «Apostar» antes da largada. Uma aposta por corrida.\n3. Assista à corrida: se seu carro cruzar a linha em 1.º, você ganha aposta × a cotação.',
      ar: '🔴 مباشر: سباق كل 60 ثانية، نفسه للجميع.\n1. 10 سيارات، لكل منها احتمالها على اللوحة (المرشحة = احتمال منخفض، المغمورة = احتمال مرتفع).\n2. اختر سيارتك ومبلغ الرهان والمس «راهن» قبل الانطلاق. رهان واحد لكل سباق.\n3. شاهد السباق: إذا عبرت سيارتك الخط أولاً تربح الرهان × احتمالها.',
      tr: '🔴 CANLI: her 60 sn’de bir yarış, herkes için aynı.\n1. 10 araba, her birinin tabloda oranı var (favori = düşük oran, sürpriz = yüksek oran).\n2. Arabanı ve tutarını seç, start öncesi “Bahis yap”a dokun. Her yarışta bir bahis.\n3. Yarışı izle: araban çizgiyi 1. geçerse bahis × oranını kazanırsın.',
      vi: '🔴 TRỰC TIẾP: mỗi 60 giây một cuộc đua, giống nhau cho mọi người.\n1. 10 xe, mỗi xe có tỷ lệ trên bảng (xe được ưa chuộng = tỷ lệ thấp, xe ít cơ hội = tỷ lệ cao).\n2. Chọn xe, mức cược và chạm «Đặt cược» trước khi xuất phát. Mỗi cuộc đua một cược.\n3. Xem cuộc đua: nếu xe của bạn về nhất, bạn thắng cược × tỷ lệ của xe.',
      id: '🔴 LANGSUNG: satu balapan tiap 60 dtk, sama untuk semua.\n1. 10 mobil, masing-masing dengan odds di papan (favorit = odds rendah, kuda hitam = odds tinggi).\n2. Pilih mobil dan taruhan, lalu sentuh «Pasang» sebelum start. Satu taruhan per balapan.\n3. Tonton balapan: jika mobilmu finis pertama, kamu menang taruhan × odds-nya.',
      ru: '🔴 В ПРЯМОМ ЭФИРЕ: одна гонка каждые 60 с, общая для всех.\n1. 10 машин, у каждой свой коэффициент на табло (фаворит = низкий, аутсайдер = высокий).\n2. Выберите машину и сумму и нажмите «Поставить» до старта. Одна ставка за гонку.\n3. Смотрите гонку: если ваша машина финиширует 1-й, вы выигрываете ставку × её коэффициент.',
      de: '🔴 LIVE: alle 60 s ein Rennen, für alle gleich.\n1. 10 Autos, jedes mit seiner Quote auf der Tafel (Favorit = niedrige Quote, Außenseiter = hohe Quote).\n2. Wähle dein Auto und deinen Einsatz und tippe vor dem Start auf „Setzen“. Ein Einsatz pro Rennen.\n3. Schau das Rennen: Fährt dein Auto als 1. über die Linie, gewinnst du Einsatz × Quote.',
      hi: '🔴 लाइव: हर 60 सेकंड में एक रेस, सबके लिए एक जैसी।\n1. 10 कारें, बोर्ड पर हर एक का भाव (पसंदीदा = कम भाव, कमजोर = ऊंचा भाव)।\n2. अपनी कार और राशि चुनें और स्टार्ट से पहले «दांव लगाएं» छुएं। हर रेस में एक दांव।\n3. रेस देखें: आपकी कार पहले लाइन पार करे तो आप दांव × उसका भाव जीतते हैं।',
      zh: '🔴 直播：每 60 秒一场比赛，所有人同一结果。\n1. 10 辆赛车，面板上各有赔率（热门 = 赔率低，冷门 = 赔率高）。\n2. 选好赛车和金额，在发车前点击“下注”。每场一注。\n3. 观看比赛：你的赛车第一个冲线，即赢 投注 × 该车赔率。'
    },
    horses: {
      en: '🔴 LIVE: one race every 60 s, the same for everyone. Each horse has its odds on the board.\n1. Winner: pick 1 horse; if it finishes 1st you win stake × its odds.\n2. Forecast: pick 2 horses; if they finish 1st and 2nd in any order you win stake × the forecast odds (shown on the button).\n3. Tap “Place bet” before the start, then watch the race. One bet per race.',
      fr: '🔴 EN DIRECT : une course toutes les 60 s, la même pour tout le monde. Chaque cheval a sa cote au tableau.\n1. Gagnant : choisis 1 cheval ; s’il arrive 1er, tu gagnes mise × sa cote.\n2. Couplé : choisis 2 chevaux ; s’ils arrivent 1er et 2e dans n’importe quel ordre, tu gagnes mise × la cote du couplé (écrite sur le bouton).\n3. Touche « Parier » avant le départ, puis regarde la course. Un pari par course.',
      es: '🔴 EN VIVO: una carrera cada 60 s, la misma para todos. Cada caballo tiene su cuota en el tablero.\n1. Ganador: elige 1 caballo; si llega 1.º, ganas apuesta × su cuota.\n2. Pronóstico: elige 2 caballos; si llegan 1.º y 2.º en cualquier orden, ganas apuesta × la cuota del pronóstico (en el botón).\n3. Toca «Apostar» antes de la salida y mira la carrera. Una apuesta por carrera.',
      pt: '🔴 AO VIVO: uma corrida a cada 60 s, a mesma para todos. Cada cavalo tem sua cotação no quadro.\n1. Vencedor: escolha 1 cavalo; se chegar em 1.º, você ganha aposta × a cotação.\n2. Dupla: escolha 2 cavalos; se chegarem em 1.º e 2.º em qualquer ordem, você ganha aposta × a cotação da dupla (no botão).\n3. Toque em «Apostar» antes da largada e assista à corrida. Uma aposta por corrida.',
      ar: '🔴 مباشر: سباق كل 60 ثانية، نفسه للجميع. لكل حصان احتماله على اللوحة.\n1. الفائز: اختر حصاناً واحداً؛ إذا وصل أولاً تربح الرهان × احتماله.\n2. الثنائي: اختر حصانين؛ إذا وصلا أولاً وثانياً بأي ترتيب تربح الرهان × احتمال الثنائي (على الزر).\n3. المس «راهن» قبل الانطلاق ثم شاهد السباق. رهان واحد لكل سباق.',
      tr: '🔴 CANLI: her 60 sn’de bir yarış, herkes için aynı. Her atın tabloda oranı var.\n1. Kazanan: 1 at seç; 1. gelirse bahis × oranını kazanırsın.\n2. İkili: 2 at seç; herhangi bir sırayla 1. ve 2. gelirlerse bahis × ikili oranını kazanırsın (butonda yazar).\n3. Start öncesi “Bahis yap”a dokun ve yarışı izle. Her yarışta bir bahis.',
      vi: '🔴 TRỰC TIẾP: mỗi 60 giây một cuộc đua, giống nhau cho mọi người. Mỗi ngựa có tỷ lệ trên bảng.\n1. Thắng: chọn 1 ngựa; nếu về nhất, bạn thắng cược × tỷ lệ của nó.\n2. Cặp đôi: chọn 2 ngựa; nếu về nhất và nhì theo bất kỳ thứ tự nào, bạn thắng cược × tỷ lệ cặp (ghi trên nút).\n3. Chạm «Đặt cược» trước khi xuất phát rồi xem đua. Mỗi cuộc đua một cược.',
      id: '🔴 LANGSUNG: satu balapan tiap 60 dtk, sama untuk semua. Tiap kuda punya odds di papan.\n1. Pemenang: pilih 1 kuda; jika finis pertama kamu menang taruhan × odds-nya.\n2. Pasangan: pilih 2 kuda; jika finis 1 dan 2 dalam urutan apa pun kamu menang taruhan × odds pasangan (tertulis di tombol).\n3. Sentuh «Pasang» sebelum start, lalu tonton balapannya. Satu taruhan per balapan.',
      ru: '🔴 В ПРЯМОМ ЭФИРЕ: один забег каждые 60 с, общий для всех. У каждой лошади свой коэффициент на табло.\n1. Победитель: выберите 1 лошадь; если она придёт 1-й, вы выигрываете ставку × её коэффициент.\n2. Пара: выберите 2 лошади; если они займут 1-е и 2-е места в любом порядке, вы выигрываете ставку × коэффициент пары (на кнопке).\n3. Нажмите «Поставить» до старта и смотрите забег. Одна ставка за забег.',
      de: '🔴 LIVE: alle 60 s ein Rennen, für alle gleich. Jedes Pferd hat seine Quote auf der Tafel.\n1. Sieger: wähle 1 Pferd; kommt es als 1. ins Ziel, gewinnst du Einsatz × Quote.\n2. Zweierwette: wähle 2 Pferde; belegen sie Platz 1 und 2 in beliebiger Reihenfolge, gewinnst du Einsatz × Zweierquote (auf dem Knopf).\n3. Tippe vor dem Start auf „Setzen“ und schau das Rennen. Ein Einsatz pro Rennen.',
      hi: '🔴 लाइव: हर 60 सेकंड में एक रेस, सबके लिए एक जैसी। बोर्ड पर हर घोड़े का भाव है।\n1. विजेता: 1 घोड़ा चुनें; वह पहले आए तो आप दांव × उसका भाव जीतते हैं।\n2. जोड़ी: 2 घोड़े चुनें; वे किसी भी क्रम में पहले और दूसरे आएं तो आप दांव × जोड़ी का भाव (बटन पर लिखा) जीतते हैं।\n3. स्टार्ट से पहले «दांव लगाएं» छुएं और रेस देखें। हर रेस में एक दांव।',
      zh: '🔴 直播：每 60 秒一场比赛，所有人同一结果。面板上每匹马都有赔率。\n1. 独赢：选 1 匹马；它跑第一，即赢 投注 × 该马赔率。\n2. 连赢：选 2 匹马；它们跑出前两名（不分顺序），即赢 投注 × 连赢赔率（显示在按钮上）。\n3. 在开跑前点击“下注”，然后观看比赛。每场一注。'
    }
  };

  /* ------------------------------------------------------------------ helpers */
  function esc(s) { return K.esc(s); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mod(a, n) { return ((a % n) + n) % n; }
  // stable pseudo-random per round / runner (integer hash: identical on every phone)
  function rnd(a, b) {
    var x = (((a % 99991) * 7919) + b * 104729 + 12345) | 0;
    x = Math.imul(x ^ (x >>> 15), 2246822507); x = Math.imul(x ^ (x >>> 13), 3266489909); x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  }
  function decs(s) { return K.dec() === ',' ? String(s).replace('.', ',') : String(s); }
  function oddTxt(v) { if (!v) return '—'; var t = (Math.floor(Number(v) * 100 + 1e-6) / 100).toFixed(2).replace(/0$/, '').replace(/\.0$/, ''); return '×' + decs(t); }
  function chipAmt(v) { v = Number(v) || 0; return v >= 1000 ? decs(Math.round(v / 100) / 10) + 'K' : v >= 100 ? String(Math.round(v)) : v >= 10 ? decs(Math.round(v * 10) / 10) : decs(Math.round(v * 100) / 100); }
  function chipHtml(placed) { return '<i class="lz-chip' + (placed ? ' placed' : '') + '"><b>' + chipAmt(K.S.stake) + '</b></i>'; }
  // the big bet button: cg.css sets its font with !important, so K.fitEl's inline size cannot shrink it — we fit it here
  function goFit(el) {
    if (!el || !el.isConnected) return;
    el.style.removeProperty('font-size');
    var fs = parseFloat(getComputedStyle(el).fontSize) || 16, min = Math.max(8, fs * 0.42), n = 0;
    while (el.scrollWidth > el.clientWidth + 1 && fs > min && n++ < 40) { fs = Math.max(min, fs * 0.93); el.style.setProperty('font-size', fs.toFixed(1) + 'px', 'important'); }
  }
  function goText(el, t) { if (el.textContent === t) return; el.textContent = t; goFit(el); }
  function lite() { return document.documentElement.classList.contains('oro-lite'); }

  /* ================================================================== ROULETTE */
  var RL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  var KZ = 0.56;                 // tilt of the wheel (orthographic: circle squashed vertically)
  var RT = 119, RP = 84, TB = 7.4; // ball track radius, pocket radius, ball run time (s)
  function rcol(n) { n = +n; return n === 0 ? 'g' : RED.indexOf(n) >= 0 ? 'r' : 'k'; }
  function pk(n) { return RL_ORDER.indexOf(+n) * 360 / 37; }
  function P(r, a) { a = a * Math.PI / 180; return (r * Math.sin(a)).toFixed(2) + ' ' + (-r * Math.cos(a)).toFixed(2); }
  function bowlSvg() {
    var dia = '';
    for (var k = 0; k < 8; k++) { var a = (k * 45 + 22.5) * Math.PI / 180, x = Math.sin(a) * 117, y = -Math.cos(a) * 117 * KZ; dia += '<path d="M' + (x - 3.2).toFixed(1) + ' ' + y.toFixed(1) + 'l3.2 -1.6l3.2 1.6l-3.2 1.6z" fill="#F5D06F" stroke="#8a6410" stroke-width=".4"/>'; }
    var ry = function (r) { return (r * KZ).toFixed(2); };
    return '<svg viewBox="-131 -74 262 162" aria-hidden="true"><defs>' +
      '<linearGradient id="lzBwS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0f3d"/><stop offset="1" stop-color="#0b0418"/></linearGradient>' +
      '<radialGradient id="lzBwT" cx="50%" cy="40%" r="60%"><stop offset=".7" stop-color="#3b1a5c"/><stop offset="1" stop-color="#1a0b2e"/></radialGradient>' +
      '<radialGradient id="lzBwR" cx="50%" cy="35%" r="55%"><stop offset=".82" stop-color="#191030"/><stop offset=".93" stop-color="#2f2453"/><stop offset="1" stop-color="#0e0820"/></radialGradient></defs>' +
      '<ellipse cx="0" cy="12" rx="130" ry="' + ry(130) + '" fill="url(#lzBwS)"/>' +
      '<ellipse cx="0" cy="0" rx="130" ry="' + ry(130) + '" fill="url(#lzBwT)" stroke="#F5D06F" stroke-width="1.2"/>' +
      '<ellipse cx="0" cy="0" rx="126" ry="' + ry(126) + '" fill="url(#lzBwR)" stroke="rgba(245,208,111,.55)" stroke-width=".8"/>' +
      '<ellipse cx="0" cy="0" rx="112" ry="' + ry(112) + '" fill="#07040f" stroke="rgba(245,208,111,.7)" stroke-width="1"/>' + dia + '</svg>';
  }
  function wheelSvg() {
    var s = '', st = 360 / 37;
    RL_ORDER.forEach(function (n, i) {
      var a0 = i * st - st / 2, a1 = a0 + st, c = n === 0 ? '#15924A' : RED.indexOf(n) >= 0 ? '#C81E2C' : '#15111F';
      var c2 = n === 0 ? '#0E6B36' : RED.indexOf(n) >= 0 ? '#8E1520' : '#0A0812';
      s += '<path d="M' + P(92, a0) + 'L' + P(110, a0) + 'A110 110 0 0 1 ' + P(110, a1) + 'L' + P(92, a1) + 'A92 92 0 0 0 ' + P(92, a0) + 'Z" fill="' + c + '"/>';
      s += '<path d="M' + P(74, a0) + 'L' + P(92, a0) + 'A92 92 0 0 1 ' + P(92, a1) + 'L' + P(74, a1) + 'A74 74 0 0 0 ' + P(74, a0) + 'Z" fill="' + c2 + '"/>';
      s += '<path d="M' + P(74, a0) + 'L' + P(110, a0) + '" stroke="#E9D8A6" stroke-width=".9"/>';
      s += '<text transform="rotate(' + (i * st).toFixed(2) + ') translate(0 -101)" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="900" font-family="system-ui,sans-serif" fill="#fff">' + n + '</text>';
    });
    var arms = '';
    for (var k = 0; k < 4; k++) arms += '<g transform="rotate(' + (k * 90 + 45) + ')"><path d="M-2.4 -6L-1.4 -34L1.4 -34L2.4 -6Z" fill="url(#lzRwG)"/><circle cy="-36" r="4" fill="url(#lzRwG)"/></g>';
    return '<svg viewBox="-112 -112 224 224" aria-hidden="true"><defs>' +
      '<radialGradient id="lzRwC" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#6d4bb3"/><stop offset=".6" stop-color="#3a2470"/><stop offset="1" stop-color="#1c1040"/></radialGradient>' +
      '<radialGradient id="lzRwG" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".55" stop-color="#F5B700"/><stop offset="1" stop-color="#9A6A00"/></radialGradient></defs>' +
      '<circle r="111" fill="#0b0716"/>' + s + '<circle r="110" fill="none" stroke="#F5D06F" stroke-width="1.6"/><circle r="92" fill="none" stroke="#E9D8A6" stroke-width="1.1"/>' +
      '<circle r="74" fill="url(#lzRwC)" stroke="#F5D06F" stroke-width="1.6"/><circle r="56" fill="none" stroke="rgba(245,208,111,.35)" stroke-width="1"/>' + arms +
      '<circle r="12" fill="url(#lzRwG)" stroke="#9A6A00" stroke-width="1"/><circle r="4" fill="#FFF6C8"/></svg>';
  }
  function rlTable(l) {
    var h = '<div class="lz-rt" dir="ltr"><button type="button" data-s="n0" class="lz-c g" style="grid-column:1;grid-row:1/4"><span>0</span></button>';
    for (var c = 0; c < 12; c++) for (var r = 0; r < 3; r++) { var n = c * 3 + 3 - r; h += '<button type="button" data-s="n' + n + '" class="lz-c ' + rcol(n) + '" style="grid-column:' + (c + 2) + ';grid-row:' + (r + 1) + '"><span>' + n + '</span></button>'; }
    [['d1', '1-12', 2], ['d2', '13-24', 6], ['d3', '25-36', 10]].forEach(function (d) { h += '<button type="button" data-s="' + d[0] + '" class="lz-c o" style="grid-column:' + d[2] + '/span 4;grid-row:4"><span class="fit">' + d[1] + '</span></button>'; });
    h += '<button type="button" data-s="even" class="lz-c o" style="grid-column:2/span 3;grid-row:5"><span class="fit">' + esc(l.even) + '</span></button>';
    h += '<button type="button" data-s="red" class="lz-c o" style="grid-column:5/span 3;grid-row:5" aria-label="' + esc(l.red) + '"><i class="lz-dia r"></i></button>';
    h += '<button type="button" data-s="black" class="lz-c o" style="grid-column:8/span 3;grid-row:5" aria-label="' + esc(l.black) + '"><i class="lz-dia k"></i></button>';
    h += '<button type="button" data-s="odd" class="lz-c o" style="grid-column:11/span 3;grid-row:5"><span class="fit">' + esc(l.odd) + '</span></button>';
    return h + '</div>';
  }
  function rlWins(sel, n) {
    if (/^n\d+$/.test(sel)) return +sel.slice(1) === n;
    if (n === 0) return false;
    if (sel === 'red') return RED.indexOf(n) >= 0;
    if (sel === 'black') return RED.indexOf(n) < 0;
    if (sel === 'even') return n % 2 === 0;
    if (sel === 'odd') return n % 2 === 1;
    var d = /^d(\d)$/.exec(sel); if (d) return n >= (+d[1] - 1) * 12 + 1 && n <= +d[1] * 12;
    return false;
  }
  function rlChip(v) { return '<i class="lz-rn ' + rcol(v) + '">' + v + '</i>'; }

  var ROULETTE = {
    reveal: 8,
    scene: function () {
      return '<div class="lz-rw" id="rwBox" dir="ltr"><div class="lz-rw-bowl">' + bowlSvg() + '</div><div class="lz-rw-wheel" id="rwW">' + wheelSvg() + '</div>' +
        '<i class="lz-rw-shine"></i><i class="lz-rw-ball" id="rwBall"></i></div><div class="lz-rw-res" id="rwRes"></div>';
    },
    board: function (l) { return rlTable(l); },
    init: function (st) {
      st.box.querySelectorAll('.lz-rt [data-s]').forEach(function (b) { b.addEventListener('click', function () { st.setSel(b.getAttribute('data-s')); }); });
    },
    layout: function (st) {
      var sc = $('lzScene'), bx = $('rwBox'); if (!sc || !bx) return;
      var W = sc.clientWidth, H = sc.clientHeight; if (!W || !H) return;
      var S = Math.max(80, Math.min(W * 0.98, (H - 4) / 0.62, 620));
      bx.style.width = S + 'px'; bx.style.height = (S * 162 / 262) + 'px';
      var ws = S * 224 / 262, w = $('rwW');
      w.style.width = ws + 'px'; w.style.height = ws + 'px'; w.style.left = ((S - ws) / 2) + 'px'; w.style.top = (S * 74 / 262 - ws / 2) + 'px';
      st.S = S; st.cx = S / 2; st.cy = S * 74 / 262; st.bs = Math.max(6, S * 0.042);
      var b = $('rwBall'); b.style.width = b.style.height = st.bs + 'px';
    },
    paint: function (st, R, t, e, rev) {
      if (!st.S) this.layout(st); if (!st.S) return;
      var A = mod(t * 21, 360), res = R.res, rel, r = RP;
      $('rwW').style.transform = 'scaleY(' + KZ + ') rotate(' + A.toFixed(2) + 'deg)';
      if (e < 0) { var pv = (R.last || [])[0]; rel = pk(pv == null ? 0 : pv); }
      else {
        // launched at the close: the ball runs against the wheel, slows down, drops, bounces, settles in the server's pocket
        var k = Math.min(1, e / TB), L0 = 180 + rnd(R.i, 1) * 180, Pn = res ? pk(res.n) : L0 - 180;
        var Q = 1440 + mod(L0 - Pn, 360), g = 1 - (1 - k) * (1 - k);
        rel = L0 - Q * g;
        if (k < 0.6) r = RT;
        else if (k < 0.78) { var q = (k - 0.6) / 0.18; r = RT - (RT - RP - 5) * (0.5 - 0.5 * Math.cos(Math.PI * q)); rel += Math.sin(q * 9) * 3 * (1 - q); }
        else if (k < 1) { var z = (k - 0.78) / 0.22; r = RP + 9 * Math.abs(Math.sin(z * Math.PI * 3)) * Math.pow(1 - z, 1.5); }
        if (!res && k > 0.5) r = RT;
      }
      var a = (A + rel) * Math.PI / 180, u = st.S / 262;
      var x = st.cx + Math.sin(a) * r * u - st.bs / 2, y = st.cy - Math.cos(a) * r * u * KZ - st.bs / 2;
      $('rwBall').style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      var key = rev && res ? R.i : -1;
      if (st.resKey !== key) { st.resKey = key; var rb = $('rwRes'); rb.innerHTML = key < 0 ? '' : '<i class="lz-rn big ' + rcol(res.n) + '">' + res.n + '</i>'; rb.classList.toggle('on', key >= 0); }
    },
    mark: function (st, o) {
      var n = o.rev && o.R.res ? +o.R.res.n : -1;
      st.box.querySelectorAll('.lz-rt [data-s]').forEach(function (b) {
        var s = b.getAttribute('data-s'), mine = s === o.sel, hit = n >= 0 && rlWins(s, n);
        b.classList.toggle('hit', hit); b.classList.toggle('on', mine);
        var c = b.querySelector('.lz-chip'); if (c) c.remove();
        if (mine) b.insertAdjacentHTML('beforeend', chipHtml(o.placed));
      });
    },
    mult: function (sel) { return /^n/.test(sel) ? '×36' : /^d/.test(sel) ? '×3' : '×2'; },
    label: function (sel, l) { var m = { red: l.red, black: l.black, even: l.even, odd: l.odd, d1: '1-12', d2: '13-24', d3: '25-36' }; return m[sel] || String(sel).replace(/^n/, ''); },
    resVal: function (res) { return +res.n; },
    chip: rlChip
  };

  /* ================================================================== CRYPTO LIVE (money wheel) */
  var CRYPTOS = [['BTC', '#F7931A'], ['ETH', '#627EEA'], ['USDT', '#26A17B'], ['BNB', '#F3BA2F'], ['SOL', '#9945FF'], ['XRP', '#2B3440'], ['DOGE', '#C2A633'], ['TON', '#0098EA'],
    ['ADA', '#0033AD'], ['TRX', '#EB0029'], ['LTC', '#345D9D'], ['DOT', '#E6007A'], ['AVAX', '#E84142'], ['SHIB', '#FFA409'], ['LINK', '#2A5ADA']];
  // logos copied from js/casino.js (CRYPTO_ART, v2749) — our own drawings of the 15 coins
  var CRYPTO_ART = [
    '<circle cx="16" cy="16" r="16" fill="#F7931A"/><g transform="rotate(14 16 16)"><path d="M12.2 9.4h5.2c2.1 0 3.6 1.1 3.6 2.9 0 1.3-.8 2.2-1.9 2.5 1.5.3 2.5 1.3 2.5 2.9 0 2.1-1.7 3.3-4 3.3h-5.4zm2.5 2v3.2h2.5c1 0 1.6-.6 1.6-1.6s-.6-1.6-1.6-1.6zm0 5.2v3.4h2.8c1.1 0 1.8-.6 1.8-1.7s-.7-1.7-1.8-1.7z" fill="#fff"/><path d="M14 7.6v2M16.4 7.6v2M14 21v2M16.4 21v2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#627EEA"/><path d="M16 5l-6.4 10.8L16 19.5l6.4-3.7z" fill="#fff"/><path d="M16 5v14.5l6.4-3.7z" fill="#C0CBF6"/><path d="M16 20.8l-6.4-3.7L16 27l6.4-9.9z" fill="#fff"/><path d="M16 20.8V27l6.4-9.9z" fill="#C0CBF6"/>',
    '<circle cx="16" cy="16" r="16" fill="#26A17B"/><path d="M9 8.5h14v3.4h-5.2v3c3.4.2 5.9.9 5.9 1.8s-2.5 1.6-5.9 1.8v6.3h-3.6v-6.3c-3.4-.2-5.9-.9-5.9-1.8s2.5-1.6 5.9-1.8v-3H9z" fill="#fff"/><ellipse cx="16" cy="16.7" rx="5.6" ry="1.1" fill="#26A17B"/>',
    '<circle cx="16" cy="16" r="16" fill="#F3BA2F"/><g fill="#fff"><path d="M16 7.5l2.8 2.8-2.8 2.8-2.8-2.8z"/><path d="M16 18.9l2.8 2.8-2.8 2.8-2.8-2.8z"/><path d="M10.3 13.2l2.8 2.8-2.8 2.8-2.8-2.8z"/><path d="M21.7 13.2l2.8 2.8-2.8 2.8-2.8-2.8z"/><path d="M16 13.6l2.4 2.4-2.4 2.4-2.4-2.4z"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#111827"/><g fill="#14F195"><path d="M10.5 10h12.5l-2 2.4H8.5z" fill="#9945FF"/><path d="M8.5 14.8H21l2 2.4H10.5z" fill="#5FA2D0"/><path d="M10.5 19.6h12.5l-2 2.4H8.5z"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#23292F"/><path d="M9 9h2.6l3.1 3.1c.7.7 1.9.7 2.6 0L20.4 9H23l-4.5 4.4a3.6 3.6 0 0 1-5 0zM9 23h2.6l3.1-3.1c.7-.7 1.9-.7 2.6 0l3.1 3.1H23l-4.5-4.4a3.6 3.6 0 0 0-5 0z" fill="#fff"/>',
    '<circle cx="16" cy="16" r="16" fill="#C2A633"/><path d="M11.5 9.5h4.6c4 0 6.4 2.6 6.4 6.5s-2.4 6.5-6.4 6.5h-4.6zm2.6 2.3v8.4h1.9c2.5 0 3.8-1.6 3.8-4.2s-1.3-4.2-3.8-4.2z" fill="#fff"/><path d="M9.6 15.2h7v1.8h-7z" fill="#fff"/>',
    '<circle cx="16" cy="16" r="16" fill="#0098EA"/><path d="M9.6 10h12.8c.9 0 1.4 1 1 1.7L16 24.4 8.6 11.7c-.4-.7.1-1.7 1-1.7z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M16 10v14" stroke="#fff" stroke-width="2"/>',
    '<circle cx="16" cy="16" r="16" fill="#0033AD"/><g fill="#fff"><circle cx="16" cy="16" r="2.2"/><circle cx="16" cy="9.2" r="1.4"/><circle cx="16" cy="22.8" r="1.4"/><circle cx="10.1" cy="12.6" r="1.4"/><circle cx="21.9" cy="12.6" r="1.4"/><circle cx="10.1" cy="19.4" r="1.4"/><circle cx="21.9" cy="19.4" r="1.4"/><circle cx="16" cy="5.6" r=".9"/><circle cx="16" cy="26.4" r=".9"/><circle cx="7" cy="10.8" r=".9"/><circle cx="25" cy="10.8" r=".9"/><circle cx="7" cy="21.2" r=".9"/><circle cx="25" cy="21.2" r=".9"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#EB0029"/><path d="M8 8.5l17 3.6-9.4 12.4z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 8.5l7.6 16 1.4-8.9 8-3.5M17 15.6L8 8.5" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>',
    '<circle cx="16" cy="16" r="16" fill="#345D9D"/><path d="M14.2 8h3l-1.7 7 2.6-1-.6 2.3-2.6 1-1.2 4.6h8l-.7 2.6H10.2l1.6-6.2-2.4.9.6-2.2 2.4-.9z" fill="#fff"/>',
    '<circle cx="16" cy="16" r="16" fill="#E6007A"/><g fill="#fff"><ellipse cx="16" cy="7.8" rx="3.6" ry="2.1"/><ellipse cx="16" cy="24.2" rx="3.6" ry="2.1"/><ellipse cx="8.9" cy="11.9" rx="3.6" ry="2.1" transform="rotate(-60 8.9 11.9)"/><ellipse cx="23.1" cy="11.9" rx="3.6" ry="2.1" transform="rotate(60 23.1 11.9)"/><ellipse cx="8.9" cy="20.1" rx="3.6" ry="2.1" transform="rotate(60 8.9 20.1)"/><ellipse cx="23.1" cy="20.1" rx="3.6" ry="2.1" transform="rotate(-60 23.1 20.1)"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#E84142"/><path d="M15 8.3c.4-.8 1.6-.8 2 0l2.1 3.8-6.2 10.8H8.6c-.9 0-1.4-1-1-1.7zM19.6 15.6c.4-.8 1.6-.8 2 0l3.2 5.6c.4.7-.1 1.7-1 1.7h-6.4c-.9 0-1.4-1-1-1.7z" fill="#fff"/>',
    '<circle cx="16" cy="16" r="16" fill="#FFA409"/><path d="M9 8l4.2 4.2h5.6L23 8l.6 8.4c0 4-3.4 7.6-7.6 7.6s-7.6-3.6-7.6-7.6z" fill="#fff"/><circle cx="13.2" cy="16" r="1.4" fill="#B45309"/><circle cx="18.8" cy="16" r="1.4" fill="#B45309"/><path d="M14.6 19.4h2.8L16 21z" fill="#B45309"/>',
    '<circle cx="16" cy="16" r="16" fill="#2A5ADA"/><path d="M16 7l7.8 4.5v9L16 25l-7.8-4.5v-9z" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>'
  ];
  function logo(i, cls) { return '<svg class="' + (cls || 'lz-logo') + '" viewBox="0 0 32 32" aria-hidden="true">' + (CRYPTO_ART[i] || CRYPTO_ART[0]) + '</svg>'; }
  var SEG = 24, IDLE = 7, TS = 10;
  function cwOff(i) { return (rnd(i, 11) - 0.5) * 13; }
  function cwFinal(i, n) { return -n * SEG + cwOff(i); }
  function moneyWheelSvg() {
    var s = '', hl = '', lg = '', bulbs = '', pegs = '';
    for (var i = 0; i < 15; i++) {
      var a0 = i * SEG - SEG / 2, a1 = a0 + SEG, c = CRYPTOS[i][1];
      var d = 'M' + P(36, a0) + 'L' + P(178, a0) + 'A178 178 0 0 1 ' + P(178, a1) + 'L' + P(36, a1) + 'A36 36 0 0 0 ' + P(36, a0) + 'Z';
      s += '<path d="' + d + '" fill="' + c + '"/>';
      hl += '<path class="lz-cw-hl" data-i="' + i + '" d="' + d + '"/>';
      lg += '<g transform="rotate(' + (i * SEG) + ') translate(0 -134)"><circle r="27" fill="rgba(0,0,0,.28)"/><g transform="translate(-24 -24) scale(1.5)">' + CRYPTO_ART[i] + '</g></g>' +
        '<text transform="rotate(' + (i * SEG) + ') translate(0 -76) rotate(-90)" text-anchor="middle" dominant-baseline="central" font-size="' + (CRYPTOS[i][0].length > 3 ? 14 : 16) + '" font-weight="900" font-family="system-ui,sans-serif" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width="2" paint-order="stroke">' + CRYPTOS[i][0] + '</text>';
      pegs += '<circle cx="' + P(184, a1).split(' ')[0] + '" cy="' + P(184, a1).split(' ')[1] + '" r="4.2" fill="url(#lzCwP)" stroke="#6b4a00" stroke-width=".8"/>';
    }
    for (var b = 0; b < 60; b++) { var pp = P(193, b * 6 + 3).split(' '); bulbs += '<circle class="lz-cw-b' + (b % 2) + '" cx="' + pp[0] + '" cy="' + pp[1] + '" r="2.6"/>'; }
    var sep = ''; for (var j = 0; j < 15; j++) sep += '<path d="M' + P(36, j * SEG + SEG / 2) + 'L' + P(178, j * SEG + SEG / 2) + '" stroke="rgba(255,255,255,.85)" stroke-width="1.6"/>';
    return '<svg viewBox="-200 -200 400 400" aria-hidden="true"><defs>' +
      '<radialGradient id="lzCwS" r="50%"><stop offset=".2" stop-color="#000" stop-opacity=".55"/><stop offset=".55" stop-color="#000" stop-opacity=".1"/><stop offset=".9" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient>' +
      '<linearGradient id="lzCwR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".45" stop-color="#E7A600"/><stop offset="1" stop-color="#8A5A00"/></linearGradient>' +
      '<radialGradient id="lzCwP" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FFFBEB"/><stop offset="1" stop-color="#C08A00"/></radialGradient></defs>' +
      '<circle r="199" fill="url(#lzCwR)"/><circle r="188" fill="#1a0f33"/>' + s + '<circle r="178" fill="url(#lzCwS)"/>' + sep + lg + hl +
      '<circle r="178" fill="none" stroke="#FDE68A" stroke-width="2"/>' + pegs + '<g class="lz-cw-bulbs">' + bulbs + '</g></svg>';
  }
  function cxChip(v) { return '<i class="lz-cc">' + logo(+v) + '</i>'; }

  var CRYPTOX = {
    reveal: TS + 0.6,
    scene: function () {
      return '<div class="lz-cw" id="cwBox" dir="ltr"><div class="lz-cw-wheel" id="cwW">' + moneyWheelSvg() + '</div>' +
        '<div class="lz-cw-hub" id="cwHub"><svg viewBox="-40 -40 80 80" aria-hidden="true"><defs><radialGradient id="lzCwH" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".55" stop-color="#F5B700"/><stop offset="1" stop-color="#8A5A00"/></radialGradient></defs>' +
        '<circle r="39" fill="#2b1a55" stroke="url(#lzCwH)" stroke-width="5"/><circle r="30" fill="url(#lzCwH)"/><text y="1" text-anchor="middle" dominant-baseline="central" font-size="17" font-weight="900" font-family="system-ui,sans-serif" fill="#3b2300">×' + decs('14.4') + '</text></svg></div>' +
        '<i class="lz-cw-ptr" id="cwPtr"><svg viewBox="0 0 40 52" aria-hidden="true"><defs><linearGradient id="lzCwQ" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".5" stop-color="#F5B700"/><stop offset="1" stop-color="#9A6A00"/></linearGradient></defs>' +
        '<path d="M4 8Q4 2 10 2H30Q36 2 36 8V16L20 50L4 16Z" fill="url(#lzCwQ)" stroke="#5c3d00" stroke-width="1.5"/><circle cx="20" cy="13" r="6" fill="#E11D48" stroke="#fff" stroke-width="1.5"/></svg></i>' +
        '<div class="lz-cw-pop" id="cwPop"></div></div>';
    },
    board: function () {
      return '<div class="lz-tiles g5 lz-cx">' + CRYPTOS.map(function (c, i) { return '<button type="button" data-s="' + i + '" class="lz-tl">' + logo(i) + '<span class="fit">' + c[0] + '</span></button>'; }).join('') + '</div>';
    },
    init: function (st) { st.box.querySelectorAll('.lz-cx [data-s]').forEach(function (b) { b.addEventListener('click', function () { st.setSel(b.getAttribute('data-s')); }); }); },
    layout: function (st) {
      var sc = $('lzScene'), bx = $('cwBox'); if (!sc || !bx) return;
      var W = sc.clientWidth, H = sc.clientHeight; if (!W || !H) return;
      var S = Math.max(90, Math.min(W * 0.96, (H - 10) * 1.3, 640)), top = 10;
      if (S < H - 14) top = Math.max(10, (H - S) / 2);
      var w = $('cwW'); w.style.width = w.style.height = S + 'px'; w.style.left = ((W - S) / 2) + 'px'; w.style.top = top + 'px';
      var hb = $('cwHub'), hs = S * 0.2; hb.style.width = hb.style.height = hs + 'px'; hb.style.left = ((W - hs) / 2) + 'px'; hb.style.top = (top + S / 2 - hs / 2) + 'px';
      var p = $('cwPtr'), pw = Math.max(18, S * 0.085); p.style.width = pw + 'px'; p.style.height = (pw * 1.3) + 'px'; p.style.left = ((W - pw) / 2) + 'px'; p.style.top = (top - pw * 0.42) + 'px';
      st.S = S;
    },
    paint: function (st, R, t, e, rev) {
      if (!st.S) this.layout(st); if (!st.S) return;
      var prevN = (R.last || [])[0] || 0, F0 = cwFinal(R.i - 1, prevN), A, sp = 0;
      if (e < 0) A = F0 + (t - R.t0) * IDLE;
      else {
        var A0 = F0 + (R.close - R.t0) * IDLE, k = Math.min(1, e / TS), g = 1 - Math.pow(1 - k, 3);
        var corr = R.res ? mod(cwFinal(R.i, R.res.n) - A0 - 1800, 360) : 0;
        A = A0 + (1800 + corr) * g; sp = 3 * Math.pow(1 - k, 2) * (1800 + corr) / TS;
      }
      $('cwW').style.transform = 'rotate(' + A.toFixed(2) + 'deg)';
      // pointer flapper: kicked by each peg passing under it
      var f = mod(A + SEG / 2, SEG) / SEG, kick = sp > 4 ? Math.max(0, 1 - f * 3.2) * Math.min(1, sp / 120) * 26 : 0;
      $('cwPtr').style.transform = 'rotate(' + (-kick).toFixed(1) + 'deg)';
      st.box.querySelector('.lz-cw').classList.toggle('spin', e >= 0 && e < TS);
      var key = rev && R.res ? R.i : -1;
      if (st.popKey !== key) {
        st.popKey = key;
        st.box.querySelectorAll('.lz-cw-hl').forEach(function (h) { h.classList.toggle('on', key >= 0 && +h.getAttribute('data-i') === +R.res.n); });
        var pop = $('cwPop');
        if (key >= 0) { var n = +R.res.n; pop.innerHTML = logo(n, 'lz-cw-pl') + '<b>' + CRYPTOS[n][0] + '</b><em>×' + decs('14.4') + '</em>'; pop.classList.add('on'); }
        else pop.classList.remove('on');
      }
    },
    mark: function (st, o) {
      var n = o.rev && o.R.res ? +o.R.res.n : -1;
      st.box.querySelectorAll('.lz-cx [data-s]').forEach(function (b) {
        var s = b.getAttribute('data-s'), mine = s === o.sel;
        b.classList.toggle('on', mine); b.classList.toggle('hit', +s === n);
        var c = b.querySelector('.lz-chip'); if (c) c.remove();
        if (mine) b.insertAdjacentHTML('beforeend', chipHtml(o.placed));
      });
    },
    mult: function () { return '×' + decs('14.4'); },
    label: function (sel) { return (CRYPTOS[+sel] || CRYPTOS[0])[0]; },
    resVal: function (res) { return +res.n; },
    chip: cxChip
  };

  /* ================================================================== RACES (cars / horses) */
  var RC_C = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6', '#F97316', '#FACC15', '#E5E7EB'];
  var RC_INK = ['#fff', '#fff', '#06210f', '#3b2300', '#fff', '#fff', '#04231f', '#fff', '#3b2f00', '#111'];
  var COATS = [['#F8FAFC', '#94A3B8'], ['#26201c', '#0b0907'], ['#8B5A2B', '#4a2c12'], ['#9CA3AF', '#4B5563'], ['#C2410C', '#6b220a'],
    ['#E9C46A', '#9a6a1a'], ['#4A2C16', '#1e1006'], ['#D6D3D1', '#78716C'], ['#A16207', '#5a3505'], ['#F5E1C8', '#b08d62']];
  function badge(i, kind) { return '<i class="lz-bd ' + kind + '" style="--c:' + RC_C[i] + ';--k:' + RC_INK[i] + '">' + (i + 1) + '</i>'; }
  function leg(x, y, cls, col) {
    return '<g transform="translate(' + x + ' ' + y + ')"><g class="lzL ' + cls + '"><path d="M-2.8 -1L2.8 -1L1.7 15L-1.7 15Z" fill="' + col + '"/>' +
      '<g transform="translate(0 15)"><g class="lzK ' + cls + 'k"><path d="M-1.7 0L1.7 0L1.1 12.5L-1.1 12.5Z" fill="' + col + '"/><path d="M-1.8 11.6L2.8 11.6L3.2 14.6L-1.8 14.6Z" fill="#111"/></g></g></g></g>';
  }
  function horseSvg(i) {
    var c = COATS[i], body = c[0], dk = c[1], j = RC_C[i], ink = RC_INK[i];
    return '<svg viewBox="0 -8 124 86" aria-hidden="true"><g class="lzBd">' +
      leg(37, 39, 'lzH2', dk) + leg(80, 39, 'lzF2', dk) +
      '<g transform="translate(32 30)"><path class="lzTl" d="M0 0C-9 -3 -17 3 -23 16C-15 12 -8 10 1 8Z" fill="' + dk + '"/></g>' +
      '<path d="M29 33C29 23 45 19 62 20C76 21 84 22 88 28C92 37 84 46 64 46C46 46 29 44 29 33Z" fill="' + body + '" stroke="' + dk + '" stroke-width=".8"/>' +
      '<path d="M77 25C83 16 89 8 95 3L104 7C101 14 98 22 94 34C90 38 84 36 79 32Z" fill="' + body + '" stroke="' + dk + '" stroke-width=".8"/>' +
      '<path d="M93 2C98 -3 105 -1 109 5L117 16C118.5 19.5 116 22.5 112.5 21.5L102 16C98 14 94 10 93 6Z" fill="' + body + '" stroke="' + dk + '" stroke-width=".8"/>' +
      '<path d="M96 0L98 -7L101.5 -1Z" fill="' + body + '" stroke="' + dk + '" stroke-width=".8"/><circle cx="103" cy="5" r="1.4" fill="#111"/><circle cx="114.6" cy="17.5" r="1" fill="' + dk + '"/>' +
      '<path d="M79 22C85 13 90 6 95 1" stroke="' + dk + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      leg(41, 39, 'lzH1', body) + leg(84, 39, 'lzF1', body) +
      '<path d="M49 23L71 23L72.5 40L49 40Z" fill="' + j + '" stroke="rgba(255,255,255,.7)" stroke-width=".8"/>' +
      '<text x="60.8" y="35.6" text-anchor="middle" font-size="11" font-weight="900" font-family="system-ui,sans-serif" fill="' + ink + '">' + (i + 1) + '</text>' +
      '<path d="M108 9L70 16" stroke="#FDE68A" stroke-width=".9"/>' +
      '<path d="M61 21L57 29L63 31" stroke="#F8FAFC" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M62 30.5L66 31" stroke="#111" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M57 22C58 13 66 8 74 8L78 12C72 14 67 18 64 24Z" fill="' + j + '" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>' +
      '<path d="M71 12L79 16L88 15" stroke="' + j + '" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="78.5" cy="3.5" r="5.6" fill="' + j + '" stroke="rgba(255,255,255,.8)" stroke-width=".8"/><path d="M80 0A5.2 5.2 0 0 1 84 4.6L79.6 4.6Z" fill="#7DD3FC"/>' +
      '</g></svg>';
  }
  function carSvg(i) {
    var c = RC_C[i], ink = RC_INK[i], id = 'lzCg' + i;
    var wheel = function (x) { return '<g transform="translate(' + x + ' 44)"><circle r="11" fill="#0b0b12"/><circle r="7.4" fill="#A1A1AA"/><g class="lzWh"><path d="M0 -7V7M-7 0H7M-5 -5L5 5M5 -5L-5 5" stroke="#3F3F46" stroke-width="1.8"/></g><circle r="2.4" fill="' + c + '"/></g>'; };
    return '<svg viewBox="-14 0 154 60" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>' +
      '<ellipse class="lzGl" cx="70" cy="54" rx="64" ry="4.5" fill="' + c + '" opacity=".5"/>' +
      '<g transform="translate(3 36)"><path class="lzFl" d="M0 -3.6L-15 0L0 3.6Z" fill="#22D3EE"/><path class="lzFl" d="M0 -2L-8 0L0 2Z" fill="#fff"/></g>' +
      '<g class="lzBd"><path d="M2 21L19 20L22 30L8 32Z" fill="#1f1b2e"/><path d="M13 30L17 38" stroke="#1f1b2e" stroke-width="3"/>' +
      '<path d="M4 40L10 30L40 26L56 15Q60 12 66 12L86 12Q92 12 96 17L104 25L128 29Q136 31 136 38L134 44L6 44Z" fill="' + c + '"/>' +
      '<path d="M4 40L10 30L40 26L56 15Q60 12 66 12L86 12Q92 12 96 17L104 25L128 29Q136 31 136 38L134 44L6 44Z" fill="url(#' + id + ')" stroke="#0b0820" stroke-width="1.2"/>' +
      '<path d="M58 25L64 15.5Q66 14 69 14L84 14Q89 14 92 17.5L98 25Z" fill="#7DD3FC" opacity=".9"/><path d="M66 17L74 17" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M14 37.5L128 37.5" stroke="#fff" stroke-width="1.6" opacity=".55"/><path d="M128 32.5L135.5 33.5" stroke="#FEF08A" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="76" cy="32" r="8" fill="#fff" stroke="#0b0820" stroke-width="1"/><text x="76" y="32.5" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="900" font-family="system-ui,sans-serif" fill="#111">' + (i + 1) + '</text></g>' +
      wheel(32) + wheel(110) + '</svg>';
  }
  function planetSvg(horses) {
    return '<svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' +
      '<radialGradient id="lzPl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + (horses ? '#FDBA74' : '#F0ABFC') + '"/><stop offset=".55" stop-color="' + (horses ? '#C2410C' : '#7C3AED') + '"/><stop offset="1" stop-color="#1e0b3a"/></radialGradient>' +
      '<linearGradient id="lzHz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8B5CF6" stop-opacity="0"/><stop offset="1" stop-color="' + (horses ? '#F59E0B' : '#22D3EE') + '" stop-opacity=".35"/></linearGradient></defs>' +
      '<rect x="0" y="60" width="400" height="60" fill="url(#lzHz)"/>' +
      '<circle cx="318" cy="40" r="26" fill="url(#lzPl)"/><ellipse cx="318" cy="42" rx="44" ry="8" fill="none" stroke="rgba(253,230,138,.65)" stroke-width="2" transform="rotate(-14 318 42)"/>' +
      '<circle cx="92" cy="24" r="6" fill="#E9D5FF" opacity=".85"/><circle cx="90" cy="22.5" r="1.4" fill="#C4B5FD"/></svg>';
  }
  var FAR_URI = 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="40" viewBox="0 0 240 40"><path d="M0 40V30Q20 18 40 30T80 28Q96 14 112 28L130 26Q150 8 170 26Q190 20 210 30Q228 22 240 30V40Z" fill="#241650"/><path d="M58 30a12 12 0 0 1 24 0Z" fill="#2f1d66"/><circle cx="70" cy="22" r="1.3" fill="#22D3EE"/><path d="M186 30V14h3v16ZM187.5 12l-2 2h4Z" fill="#2f1d66"/><circle cx="187.5" cy="11" r="1.2" fill="#F472B6"/></svg>') + '")';

  function makeRace(horses) {
    var D = horses ? 400 : 1500, TW = 16.2, GAP = 0.3, TAU = 0.8, C0 = 0.07;
    var HP1 = (1 - Math.exp(-1 / C0)) / (1 - C0 * (1 - Math.exp(-1 / C0)));
    var kind = horses ? 'h' : 'c';
    function hS(s) { return (s - C0 * (1 - Math.exp(-s / C0))) / (1 - C0 * (1 - Math.exp(-1 / C0))); }
    function plan(st, R) {
      if (st.planI === R.i || !R.res || !R.res.order) return !!st.pl && st.planI === R.i;
      var o = R.res.order, pl = { T: [], a: [], b: [], v: [] };
      for (var h = 0; h < 10; h++) {
        var rank = o.indexOf(h); if (rank < 0) rank = 9;
        pl.T[h] = TW + rank * GAP + (rnd(R.i, h + 20) - 0.5) * 0.12;
        pl.a[h] = (rnd(R.i, h + 40) - 0.5) * 0.36; pl.b[h] = (rnd(R.i, h + 60) - 0.5) * 0.1;
        pl.v[h] = D / pl.T[h] * HP1 * (1 - pl.a[h] * Math.PI + 2 * pl.b[h] * Math.PI);
      }
      pl.last = TW + 9 * GAP + 0.1; st.pl = pl; st.planI = R.i; return true;
    }
    function posAt(pl, h, e) {
      if (e <= 0) return 0;
      var T = pl.T[h];
      if (e < T) { var u = hS(e / T); return D * (u + pl.a[h] * Math.sin(Math.PI * u) + pl.b[h] * Math.sin(2 * Math.PI * u)); }
      return D + pl.v[h] * TAU * (1 - Math.exp(-(e - T) / TAU));
    }
    return {
      reveal: TW + 9 * GAP + 0.9,
      scene: function () {
        var r = '', ln = '', pos = '';
        for (var i = 0; i < 10; i++) {
          r += '<i class="lz-sp ' + kind + '" id="rcR' + i + '" style="--d:-' + (rnd(i, 3) * 0.5).toFixed(2) + 's">' + (horses ? horseSvg(i) : carSvg(i)) + '</i>';
          ln += '<i class="lz-ln" id="rcL' + i + '"></i>';
          pos += '<i class="lz-ps" id="rcP' + i + '">' + badge(i, kind) + '</i>';
        }
        var posts = ''; for (var p = 0; p < 8; p++) posts += '<i class="lz-post" id="rcQ' + p + '"><i></i></i>';
        return '<div class="lz-rc ' + kind + '" id="rcBox" dir="ltr"><div class="lz-rc-sky">' + planetSvg(horses) + '</div><i class="lz-rc-far" id="rcFar" style="background-image:' + FAR_URI + '"></i>' +
          '<div class="lz-rc-trk" id="rcTrk"><i class="lz-rc-tex" id="rcTex"></i>' + ln + '<i class="lz-rc-fin" id="rcFin"></i><i class="lz-rc-gate" id="rcGate"></i>' + r + '</div>' +
          '<div class="lz-rc-rail" id="rcRail">' + posts + '<i class="lz-rc-arch" id="rcArch"></i></div>' +
          '<div class="lz-rc-pos" id="rcPos">' + pos + '</div><span class="lz-rc-dist" id="rcDist"></span><div class="lz-rc-pod" id="rcPod"></div></div>';
      },
      board: function (l) {
        var b = '';
        for (var i = 0; i < 10; i++) b += '<button type="button" data-h="' + i + '" class="lz-tl rc">' + badge(i, kind) + '<span class="fit" data-o="' + i + '">—</span></button>';
        return (horses ? '<div class="lz-seg"><button type="button" data-m="w" class="on"><span class="fit">' + esc(l.win1) + '</span></button><button type="button" data-m="c"><span class="fit">' + esc(l.pair) + '</span></button></div>' : '') +
          '<div class="lz-tiles g5 lz-odds">' + b + '</div>';
      },
      init: function (st) {
        st.hm = { mode: 'w', two: [] };
        var emit = function () {
          var two = st.hm.two;
          if (!horses) st.setSel(two.length ? String(two[0]) : null);
          else if (st.hm.mode === 'w') st.setSel(two.length ? 'w' + two[0] : null);
          else if (two.length === 2) st.setSel('c' + Math.min(two[0], two[1]) + '-' + Math.max(two[0], two[1]));
          else st.setSel(null);
          st.mk = '';
        };
        st.box.querySelectorAll('.lz-seg [data-m]').forEach(function (z) {
          z.addEventListener('click', function () {
            if (st.locked()) return;
            st.hm.mode = z.getAttribute('data-m'); st.hm.two = st.hm.two.slice(0, st.hm.mode === 'w' ? 1 : 2);
            st.box.querySelectorAll('.lz-seg [data-m]').forEach(function (y) { y.classList.toggle('on', y === z); });
            emit();
          });
        });
        st.box.querySelectorAll('.lz-odds [data-h]').forEach(function (z) {
          z.addEventListener('click', function () {
            if (st.locked()) return;
            var h = +z.getAttribute('data-h'), two = st.hm.two, i = two.indexOf(h);
            if (st.hm.mode === 'w') st.hm.two = [h];
            else if (i >= 0) two.splice(i, 1);
            else { two.push(h); if (two.length > 2) two.shift(); }
            emit();
          });
        });
      },
      layout: function (st) {
        var bx = $('rcBox'); if (!bx) return;
        var W = bx.clientWidth, H = bx.clientHeight; if (!W || !H) return;
        var yT = Math.round(H * 0.4), yB = H - 3, tot = 0, w = [], y = yT;
        for (var k = 0; k < 10; k++) { w[k] = 0.72 + 0.28 * k / 9; tot += w[k]; }
        st.lane = [];
        var trk = $('rcTrk'); trk.style.top = yT + 'px';
        for (var h = 0; h < 10; h++) {
          var lh = (yB - yT) * w[h] / tot, sp = $('rcR' + h), sh = lh * (horses ? 3.5 : 2.5), sw = sh * (horses ? 124 / 86 : 154 / 60);
          sp.style.width = sw + 'px'; sp.style.height = sh + 'px'; sp.style.top = (y - yT + lh * 0.92 - sh) + 'px'; sp.style.zIndex = 3 + h;
          var ln = $('rcL' + h); ln.style.top = (y - yT + lh) + 'px';
          st.lane[h] = { w: sw }; y += lh;
        }
        st.W = W; st.H = H; st.yT = yT;
        var cw = Math.min(26, (W - 12) / 10.4); st.cw = cw;
        for (var p = 0; p < 10; p++) { var ps = $('rcP' + p); ps.style.width = cw + 'px'; ps.style.height = cw + 'px'; }
        st.S = 1;
      },
      round: function (st, R) {
        st.oddsKey = null; st.podI = -1;
        var pd = $('rcPod'); if (pd) { pd.classList.remove('on'); pd.innerHTML = ''; }
      },
      paint: function (st, R, t, e, rev) {
        if (!st.S) this.layout(st); if (!st.S) return;
        var ok = String(R.odds || '');
        if (st.oddsKey !== ok) { st.oddsKey = ok; st.box.querySelectorAll('[data-o]').forEach(function (b) { K.setText(b, oddTxt((R.odds || [])[+b.getAttribute('data-o')])); }); st.mk = ''; }
        var has = e >= 0 && plan(st, R), pl = st.pl, p = [], lead = 0, last = 1e9, h;
        for (h = 0; h < 10; h++) { p[h] = has ? posAt(pl, h, e) : 0; if (p[h] > lead) lead = p[h]; if (p[h] < last) last = p[h]; }
        var spread = lead - last, VW = clamp(spread * 1.35 + D * 0.03, D * 0.08, D * 0.24);
        var cam = Math.min(Math.max(lead - 0.66 * VW, -0.5 * VW), D - 0.6 * VW), ppm = st.W / VW;
        var run = has && e < pl.last + 0.6;
        for (h = 0; h < 10; h++) {
          var sp = $('rcR' + h), x = (p[h] - cam) * ppm - st.lane[h].w * 0.88;
          sp.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
          if (sp.classList.contains('run') !== run) sp.classList.toggle('run', run);
        }
        $('rcTex').style.transform = 'translate3d(' + (-mod(cam * ppm * 1.25, 48)).toFixed(1) + 'px,0,0)';
        $('rcFar').style.transform = 'translate3d(' + (-mod(cam * ppm * 0.22, 240)).toFixed(1) + 'px,0,0)';
        var fx = (D - cam) * ppm, gx = (0 - cam) * ppm;
        $('rcFin').style.transform = 'translate3d(' + fx.toFixed(1) + 'px,0,0)';
        $('rcArch').style.transform = 'translate3d(' + fx.toFixed(1) + 'px,0,0)';
        $('rcGate').style.transform = 'translate3d(' + gx.toFixed(1) + 'px,0,0)';
        // distance poles every 1/10 of the race (numbers = metres to go, like real furlong poles)
        var step = D / 10, first = Math.max(step, Math.ceil(cam / step) * step);
        for (var q = 0; q < 8; q++) {
          var m = first + q * step, el = $('rcQ' + q), vis = m >= 0 && m < D && (m - cam) * ppm < st.W + 40;
          el.style.visibility = vis ? 'visible' : 'hidden';
          if (vis) { el.style.transform = 'translate3d(' + ((m - cam) * ppm).toFixed(1) + 'px,0,0)'; var tx = String(Math.round(D - m)); if (el.firstChild.textContent !== tx) el.firstChild.textContent = tx; }
        }
        // live positions
        var order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        if (has) {
          order.sort(function (a, b) { var fa = p[a] >= D, fb = p[b] >= D; if (fa && fb) return pl.T[a] - pl.T[b]; return p[b] - p[a]; });
        }
        var okey = order.join(',');
        if (st.okey !== okey) { st.okey = okey; for (var r = 0; r < 10; r++) $('rcP' + order[r]).style.transform = 'translate3d(' + (r * st.cw * 1.04).toFixed(1) + 'px,0,0)'; }
        var togo = Math.max(0, Math.ceil((D - lead) / 10) * 10), dt = togo + ' ' + st.l.m;
        var de = $('rcDist'); if (de.textContent !== dt) de.textContent = dt;
        // podium 1-2-3 once everybody is home
        var showPod = has && e >= pl.last + 0.5 && rev;
        if (showPod && st.podI !== R.i) {
          st.podI = R.i; var o = R.res.order, pd = $('rcPod');
          pd.innerHTML = [[o[1], 2], [o[0], 1], [o[2], 3]].map(function (x) { return '<div class="lz-pd p' + x[1] + '"><span class="lz-pd-r">' + (horses ? horseSvg(x[0]) : carSvg(x[0])) + '</span>' + badge(x[0], kind) + '<i class="lz-pd-s"><b>' + x[1] + '</b></i></div>'; }).join('');
          requestAnimationFrame(function () { pd.classList.add('on'); });
        }
        st.box.querySelector('.lz-rc').classList.toggle('pod', !!showPod);
      },
      mark: function (st, o) {
        var picks = [], s = o.sel == null ? '' : String(o.sel), m;
        if (o.placed) {
          if ((m = /^w?(\d)$/.exec(s))) picks = [+m[1]];
          else if ((m = /^c(\d)-(\d)$/.exec(s))) picks = [+m[1], +m[2]];
          if (horses) { var md = /^c/.test(s) ? 'c' : 'w'; st.box.querySelectorAll('.lz-seg [data-m]').forEach(function (y) { y.classList.toggle('on', y.getAttribute('data-m') === md); }); }
        } else picks = st.hm.two.slice();
        var res = o.rev && o.R.res ? o.R.res.order : null;
        st.box.querySelectorAll('.lz-odds [data-h]').forEach(function (b) {
          var h = +b.getAttribute('data-h'), mine = picks.indexOf(h) >= 0;
          b.classList.toggle('on', mine); b.classList.toggle('hit', !!res && res[0] === h); b.classList.toggle('hit2', !!res && horses && res[1] === h);
          var c = b.querySelector('.lz-chip'); if (c) c.remove();
          if (mine) b.insertAdjacentHTML('beforeend', chipHtml(o.placed));
        });
      },
      mult: function (sel, R) {
        if (!R) return '';
        var m = /^w?(\d)$/.exec(sel); if (m) return oddTxt(R.odds && R.odds[+m[1]]);
        m = /^c(\d)-(\d)$/.exec(sel); if (m) return oddTxt(R.pair && R.pair[m[1] + '-' + m[2]]);
        return '';
      },
      label: function (sel) { var m = /^c(\d)-(\d)$/.exec(String(sel)); if (m) return '#' + (+m[1] + 1) + ' + #' + (+m[2] + 1); return '#' + (+String(sel).replace('w', '') + 1); },
      hint: function (st, l) { return horses && st.hm.mode === 'c' && st.hm.two.length < 2 && st.sel == null ? l.pairHint : ''; },
      resVal: function (res) { return +res.order[0]; },
      chip: function (v) { return badge(+v, kind); }
    };
  }

  var GAMES = { roulette: ROULETTE, cryptox: CRYPTOX, race: makeRace(false), horses: makeRace(true) };

  /* ================================================================== shared live engine */
  function makeLive(game) {
    var G = GAMES[game];
    return function (box) {
      var l = L();
      box.classList.add('cg-game', 'lz-game', 'cg-' + game);
      box.innerHTML = '<div class="cg-stage lz-stage"><div class="lz-head"><span class="lz-live"><i></i>LIVE</span><b class="lz-ph fit" id="lzPh"></b><em class="lz-tm fit" id="lzTm"></em></div>' +
        '<i class="lz-bar" id="lzBarB"><b id="lzBar"></b></i><div class="lz-scene" id="lzScene">' + G.scene(l) + '</div><div class="lz-last" id="lzLast"></div></div>' +
        K.stakePanel(l.bet, '<div class="lz-board">' + G.board(l) + '</div>');
      K.bindStake(box);
      var st = { box: box, l: l, R: null, me: null, sel: null, off: 0, first: true, shown: null, lastKey: '', mk: '', ri: null, busy: false };
      st.now = function () { return Date.now() / 1000 + st.off; };
      st.locked = function () { return !!(st.me && st.R && st.me.rid === st.R.i); };
      st.setSel = function (v) { if (st.locked()) return; st.sel = v; st.mk = ''; };
      G.init(st);
      box.addEventListener('stake', function () { st.mk = ''; });
      var ph = $('lzPh'), tm = $('lzTm'), bar = $('lzBar'), barB = $('lzBarB'), go = $('csGo'), stage = box.querySelector('.lz-stage');
      var onRs = function () { if (!box.isConnected) { window.removeEventListener('resize', onRs); return; } setTimeout(function () { goFit(go); }, 200); };
      window.addEventListener('resize', onRs);
      if (window.ResizeObserver) {
        var ro = new ResizeObserver(function () { if (!box.isConnected) { ro.disconnect(); return; } st.S = 0; G.layout(st); st.okey = ''; });
        ro.observe($('lzScene'));
      }
      go.addEventListener('click', async function () {
        var R = st.R; if (st.busy || !R || st.locked()) return;
        if (st.now() >= R.close) return;
        if (st.sel == null) { K.toast(G.hint && G.hint(st, l) || l.pick); return; }
        st.busy = true; go.disabled = true;
        var r = await K.multi(game, 'bet', { sel: st.sel });
        st.busy = false;
        if (r) { st.me = r; if (r.round) st.R = r.round; st.mk = ''; }
      });
      var alive = function () { return box.isConnected && K.S.game === game; };
      var sync = async function () {
        if (!alive()) return;
        var r = null;
        try { var rq = await fetch('casino-tour.php?g=' + game, { cache: 'no-store' }); r = await rq.json(); } catch (e) { r = null; }
        if (!r || !r.ok) { r = await K.multi(game, 'dround', null, true); if (r) r.mine = 1; }
        if (!alive()) return;
        var delay = 1000;
        if (r && r.round) {
          st.off = r.now - Date.now() / 1000; st.R = r.round;
          var t = st.now(), R0 = st.R;
          // read the result right at the close (everyone's animation starts on time)
          if (t < R0.close && R0.close - t < 1.3) delay = Math.max(100, (R0.close - t + 0.1) * 1000);
          else if (t >= R0.close && !R0.res) delay = 300;
        }
        clearTimeout(K.S.timer); K.S.timer = setTimeout(sync, delay);
        if (!r || !r.round) return;
        var mine = r.mine ? r : null, open0 = st.me && !st.me.done;
        if (!K.guest() && !mine && (st.first || (open0 && st.R.res && st.R.i >= (st.me.rid || 0)))) {
          mine = await K.multi(game, 'dround', null, true);
          if (!alive()) return;
        }
        if (mine && mine.round) { st.me = mine.has ? mine : null; if (st.first) { st.first = false; if (st.me && st.me.done) st.shown = st.me.ref; } st.mk = ''; }
      };
      var showMine = function (t) {
        var me = st.me, R = st.R;
        if (!me || !me.done || !me.ref || st.shown === me.ref || !R) return;
        if (me.rid === R.i && t < R.close + G.reveal) return; // amount only once the animation has shown the result
        st.shown = me.ref;
        K.resultLine(box, me);
      };
      var tick = function () {
        if (!alive()) return;
        var R = st.R;
        if (R) {
          var t = st.now(), bet = t < R.close, e = t - R.close, rev = !!R.res && e >= G.reveal;
          if (st.ri !== R.i) { st.ri = R.i; st.mk = ''; if (G.round) G.round(st, R); }
          if (bet) {
            var left = R.close - t;
            K.setText(ph, left <= 5 ? l.lastc : l.open); K.setText(tm, Math.ceil(left) + ' s');
            bar.style.transform = 'scaleX(' + clamp(left / R.B, 0, 1).toFixed(4) + ')';
          } else {
            K.setText(ph, rev ? l.next : l.closed); K.setText(tm, Math.max(0, Math.ceil(R.end - t)) + ' s');
            bar.style.transform = 'scaleX(0)';
          }
          var cls = bet ? (R.close - t <= 5 ? 'warn' : 'open') : 'shut';
          if (st.cls !== cls) { st.cls = cls; barB.className = 'lz-bar ' + cls; stage.setAttribute('data-ph', cls); }
          G.paint(st, R, t, e, rev);
          var list = (R.last || []).slice(); if (rev && R.res) list.unshift(G.resVal(R.res));
          var lk = R.i + ':' + list.join(',');
          if (lk !== st.lastKey) { st.lastKey = lk; $('lzLast').innerHTML = list.map(function (v, i) { return '<span class="lz-li' + (i === 0 && rev ? ' new' : '') + '">' + G.chip(v) + '</span>'; }).join(''); }
          var mineNow = !!(st.me && st.me.rid === R.i);
          if (mineNow) { goText(go, l.placed + ' · ' + G.label(st.me.sel, l)); go.disabled = true; go.classList.add('placed'); go.classList.remove('wait'); }
          else if (!bet) { goText(go, l.bclosed); go.disabled = true; go.classList.remove('placed'); go.classList.add('wait'); }
          else {
            var hint = G.hint ? G.hint(st, l) : '';
            var mm = st.sel == null ? '' : G.mult(st.sel, R);
            goText(go, hint || (l.bet + (mm ? ' · ' + mm : ''))); go.disabled = st.busy; go.classList.remove('placed', 'wait');
          }
          var mk = [st.sel, mineNow ? st.me.sel : '', K.S.stake, rev ? 1 : 0, R.i, mineNow ? 1 : 0].join('|');
          if (mk !== st.mk) { st.mk = mk; G.mark(st, { sel: mineNow ? st.me.sel : st.sel, placed: mineNow, rev: rev, R: R }); }
          showMine(t);
        }
        K.S.raf = requestAnimationFrame(tick);
      };
      sync(); tick();
    };
  }

  ['roulette', 'cryptox', 'race', 'horses'].forEach(function (k) { K.register(k, makeLive(k), { rules: RULES[k] }); });
})(window.D6 = window.D6 || {});
