/* v2900 — LIVE 4 (owner request, round 5): 12 NEW live games "cards, dice & draws", one shared round for everyone (same server
   engine as Lucky Planets, live2 and live3: casino_live4.php CASINO_LIVE4 + casino_draw_*, public state casino-tour.php?g=<key>,
   polled ~8 s, precise at close / result / next round). Odds = 0.94 ÷ exact chance, rounded down (6 % margin on every bet).
   baccaratlive Baccarat Live · andarlive Andar Bahar Live · teenpattilive Teen Patti Live · pokerlive Poker Showdown Live ·
   redblacklive Red or Black Live · lucky7live Lucky 7 Live · diceduellive Dice Duel Live · peryalive Color Game Live (Perya) ·
   bingolive Bingo Live · lotto649live Lotto 6/49 Live · megaballlive Mega Ball Live · bustlive Dealer Bust Live.
   Everything is drawn from (drawn result, time since bets closed): every viewer sees the same show, joining late too.
   One requestAnimationFrame loop (K.S.raf), attributes written only when they change, no filters per frame. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { ppair: 'P Pair', bpair: 'B Pair', bo: 'Place your bets', lastc: 'Bets closing', bclosed: 'Bets closed', rs: 'Results', nx: 'Next round in', mc: 'Market closed', placed: 'Bet placed', bet: 'Place bet', pick: 'Make your choice first',
      dl: 'Dealing the cards', sd: 'Showdown', l7: 'Drawing the card', dr: 'Dice rolling', cf: 'Dice falling', bd: 'Draw in progress', dp: 'Dealer is playing',
      player: 'Player', banker: 'Banker', tie: 'Tie', pair: 'Pair', andar: 'Andar', bahar: 'Bahar', joker: 'Joker', cards: 'cards', pla: 'Player A', plb: 'Player B', pplus: 'Pair Plus',
      red: 'Red', blue: 'Blue', black: 'Black', twop: '2 Pair+', dbl: 'Double', dbl2: '2 Doubles', mixed: 'Mixed', triple: 'Triple', balls: 'balls', ball: 'Ball', odd: 'Odd', even: 'Even',
      line: 'line', lines: 'lines', bust: 'Bust', bj: 'Blackjack', dealer: 'Dealer', sum: 'Sum', wins: 'wins',
      tp: ['High card', 'Pair', 'Color', 'Sequence', 'Pure sequence', 'Trail'], pk: ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'] },
    fr: { ppair: 'Paire J', bpair: 'Paire B', bo: 'Pariez maintenant', lastc: 'Clôture des paris', bclosed: 'Paris fermés', rs: 'Résultats', nx: 'Prochain tour dans', mc: 'Marché fermé', placed: 'Pari enregistré', bet: 'Parier', pick: 'Faites d’abord votre choix',
      dl: 'Distribution des cartes', sd: 'Abattage', l7: 'Tirage de la carte', dr: 'Lancer des dés', cf: 'Les dés tombent', bd: 'Tirage en cours', dp: 'Le croupier joue',
      player: 'Joueur', banker: 'Banquier', tie: 'Égalité', pair: 'Paire', andar: 'Andar', bahar: 'Bahar', joker: 'Joker', cards: 'cartes', pla: 'Joueur A', plb: 'Joueur B', pplus: 'Paire Plus',
      red: 'Rouge', blue: 'Bleu', black: 'Noir', twop: '2 Paires+', dbl: 'Double', dbl2: '2 Doubles', mixed: 'Mélange', triple: 'Triple', balls: 'boules', ball: 'Boule', odd: 'Impair', even: 'Pair',
      line: 'ligne', lines: 'lignes', bust: 'Bust', bj: 'Blackjack', dealer: 'Croupier', sum: 'Somme', wins: 'gagne',
      tp: ['Carte haute', 'Paire', 'Couleur', 'Suite', 'Suite couleur', 'Brelan'], pk: ['Carte haute', 'Paire', 'Double paire', 'Brelan', 'Quinte', 'Couleur', 'Full', 'Carré', 'Quinte flush'] },
    es: { ppair: 'Pareja J', bpair: 'Pareja B', bo: 'Apueste ahora', lastc: 'Cierre de apuestas', bclosed: 'Apuestas cerradas', rs: 'Resultados', nx: 'Próxima ronda en', mc: 'Mercado cerrado', placed: 'Apuesta registrada', bet: 'Apostar', pick: 'Elija primero',
      dl: 'Repartiendo cartas', sd: 'Enfrentamiento', l7: 'Sacando la carta', dr: 'Dados rodando', cf: 'Caen los dados', bd: 'Sorteo en curso', dp: 'El crupier juega',
      player: 'Jugador', banker: 'Banca', tie: 'Empate', pair: 'Pareja', andar: 'Andar', bahar: 'Bahar', joker: 'Comodín', cards: 'cartas', pla: 'Jugador A', plb: 'Jugador B', pplus: 'Pareja Plus',
      red: 'Rojo', blue: 'Azul', black: 'Negro', twop: '2 Parejas+', dbl: 'Doble', dbl2: '2 Dobles', mixed: 'Mixto', triple: 'Triple', balls: 'bolas', ball: 'Bola', odd: 'Impar', even: 'Par',
      line: 'línea', lines: 'líneas', bust: 'Se pasa', bj: 'Blackjack', dealer: 'Crupier', sum: 'Suma', wins: 'gana',
      tp: ['Carta alta', 'Pareja', 'Color', 'Escalera', 'Escalera de color', 'Trío'], pk: ['Carta alta', 'Pareja', 'Doble pareja', 'Trío', 'Escalera', 'Color', 'Full', 'Póker', 'Escalera de color'] },
    pt: { ppair: 'Par J', bpair: 'Par B', bo: 'Aposte agora', lastc: 'Encerramento das apostas', bclosed: 'Apostas encerradas', rs: 'Resultados', nx: 'Próxima rodada em', mc: 'Mercado fechado', placed: 'Aposta registrada', bet: 'Apostar', pick: 'Escolha primeiro',
      dl: 'Distribuindo as cartas', sd: 'Confronto', l7: 'Tirando a carta', dr: 'Dados rolando', cf: 'Os dados caem', bd: 'Sorteio em andamento', dp: 'O crupiê joga',
      player: 'Jogador', banker: 'Banca', tie: 'Empate', pair: 'Par', andar: 'Andar', bahar: 'Bahar', joker: 'Coringa', cards: 'cartas', pla: 'Jogador A', plb: 'Jogador B', pplus: 'Par Plus',
      red: 'Vermelho', blue: 'Azul', black: 'Preto', twop: '2 Pares+', dbl: 'Duplo', dbl2: '2 Duplos', mixed: 'Misto', triple: 'Trio', balls: 'bolas', ball: 'Bola', odd: 'Ímpar', even: 'Par',
      line: 'linha', lines: 'linhas', bust: 'Estoura', bj: 'Blackjack', dealer: 'Crupiê', sum: 'Soma', wins: 'vence',
      tp: ['Carta alta', 'Par', 'Cor', 'Sequência', 'Sequência pura', 'Trinca'], pk: ['Carta alta', 'Par', 'Dois pares', 'Trinca', 'Sequência', 'Flush', 'Full house', 'Quadra', 'Straight flush'] },
    ar: { ppair: 'زوج اللاعب', bpair: 'زوج المصرف', bo: 'ضع رهانك الآن', lastc: 'الرهانات تُغلق قريبًا', bclosed: 'الرهانات مغلقة', rs: 'النتائج', nx: 'الجولة التالية خلال', mc: 'السوق مغلق', placed: 'تم تسجيل الرهان', bet: 'راهن', pick: 'اختر أولاً',
      dl: 'توزيع الأوراق', sd: 'كشف الأوراق', l7: 'سحب الورقة', dr: 'رمي النرد', cf: 'النرد يسقط', bd: 'السحب جارٍ', dp: 'الموزّع يلعب',
      player: 'اللاعب', banker: 'المصرف', tie: 'تعادل', pair: 'زوج', andar: 'أندار', bahar: 'باهار', joker: 'الجوكر', cards: 'أوراق', pla: 'اللاعب A', plb: 'اللاعب B', pplus: 'زوج بلس',
      red: 'أحمر', blue: 'أزرق', black: 'أسود', twop: 'زوجان+', dbl: 'دبل', dbl2: 'دبلان', mixed: 'مختلط', triple: 'ثلاثي', balls: 'كرات', ball: 'كرة', odd: 'فردي', even: 'زوجي',
      line: 'خط', lines: 'خطوط', bust: 'تجاوز', bj: 'بلاك جاك', dealer: 'الموزّع', sum: 'المجموع', wins: 'يفوز',
      tp: ['ورقة عالية', 'زوج', 'لون', 'تسلسل', 'تسلسل نقي', 'ثلاثية'], pk: ['ورقة عالية', 'زوج', 'زوجان', 'ثلاثة متشابهة', 'متتالية', 'فلاش', 'فل هاوس', 'أربعة متشابهة', 'ستريت فلاش'] },
    tr: { ppair: 'O. Per', bpair: 'K. Per', bo: 'Bahislerinizi yapın', lastc: 'Bahisler kapanıyor', bclosed: 'Bahisler kapandı', rs: 'Sonuçlar', nx: 'Sonraki tur', mc: 'Piyasa kapalı', placed: 'Bahis alındı', bet: 'Bahis yap', pick: 'Önce seçiminizi yapın',
      dl: 'Kartlar dağıtılıyor', sd: 'Kartlar açılıyor', l7: 'Kart çekiliyor', dr: 'Zarlar atılıyor', cf: 'Zarlar düşüyor', bd: 'Çekiliş sürüyor', dp: 'Krupiye oynuyor',
      player: 'Oyuncu', banker: 'Kasa', tie: 'Beraberlik', pair: 'Per', andar: 'Andar', bahar: 'Bahar', joker: 'Joker', cards: 'kart', pla: 'Oyuncu A', plb: 'Oyuncu B', pplus: 'Per Plus',
      red: 'Kırmızı', blue: 'Mavi', black: 'Siyah', twop: '2 Per+', dbl: 'Çift', dbl2: '2 Çift', mixed: 'Karışık', triple: 'Üçlü', balls: 'top', ball: 'Top', odd: 'Tek', even: 'Çift',
      line: 'çizgi', lines: 'çizgi', bust: 'Patladı', bj: 'Blackjack', dealer: 'Krupiye', sum: 'Toplam', wins: 'kazanır',
      tp: ['Yüksek kart', 'Per', 'Renk', 'Sıralı', 'Renkli sıralı', 'Üçlü'], pk: ['Yüksek kart', 'Per', 'Döper', 'Üçlü', 'Kent', 'Floş', 'Ful', 'Kare', 'Sıralı floş'] },
    vi: { ppair: 'Đôi Con', bpair: 'Đôi Cái', bo: 'Mời đặt cược', lastc: 'Sắp đóng cược', bclosed: 'Đã đóng cược', rs: 'Kết quả', nx: 'Vòng tiếp theo sau', mc: 'Thị trường đóng cửa', placed: 'Đã đặt cược', bet: 'Đặt cược', pick: 'Hãy chọn trước',
      dl: 'Đang chia bài', sd: 'Lật bài', l7: 'Đang rút bài', dr: 'Đang lắc xúc xắc', cf: 'Xúc xắc đang rơi', bd: 'Đang quay số', dp: 'Nhà cái đang rút',
      player: 'Con', banker: 'Cái', tie: 'Hòa', pair: 'Đôi', andar: 'Andar', bahar: 'Bahar', joker: 'Joker', cards: 'lá', pla: 'Người A', plb: 'Người B', pplus: 'Đôi Plus',
      red: 'Đỏ', blue: 'Xanh', black: 'Đen', twop: 'Thú+', dbl: 'Đôi', dbl2: '2 Đôi', mixed: 'Khác màu', triple: 'Bộ ba', balls: 'bóng', ball: 'Bóng', odd: 'Lẻ', even: 'Chẵn',
      line: 'hàng', lines: 'hàng', bust: 'Quắc', bj: 'Blackjack', dealer: 'Nhà cái', sum: 'Tổng', wins: 'thắng',
      tp: ['Mậu thầu', 'Đôi', 'Đồng chất', 'Sảnh', 'Sảnh đồng chất', 'Sám'], pk: ['Mậu thầu', 'Đôi', 'Thú', 'Sám', 'Sảnh', 'Thùng', 'Cù lũ', 'Tứ quý', 'Thùng phá sảnh'] },
    id: { ppair: 'P Pair', bpair: 'B Pair', bo: 'Pasang taruhan Anda', lastc: 'Taruhan segera ditutup', bclosed: 'Taruhan ditutup', rs: 'Hasil', nx: 'Ronde berikutnya dalam', mc: 'Pasar tutup', placed: 'Taruhan tercatat', bet: 'Pasang', pick: 'Pilih dulu',
      dl: 'Membagikan kartu', sd: 'Buka kartu', l7: 'Menarik kartu', dr: 'Dadu bergulir', cf: 'Dadu jatuh', bd: 'Undian berlangsung', dp: 'Bandar bermain',
      player: 'Player', banker: 'Banker', tie: 'Seri', pair: 'Pair', andar: 'Andar', bahar: 'Bahar', joker: 'Joker', cards: 'kartu', pla: 'Pemain A', plb: 'Pemain B', pplus: 'Pair Plus',
      red: 'Merah', blue: 'Biru', black: 'Hitam', twop: '2 Pair+', dbl: 'Dobel', dbl2: '2 Dobel', mixed: 'Campur', triple: 'Triple', balls: 'bola', ball: 'Bola', odd: 'Ganjil', even: 'Genap',
      line: 'garis', lines: 'garis', bust: 'Bust', bj: 'Blackjack', dealer: 'Bandar', sum: 'Jumlah', wins: 'menang',
      tp: ['Kartu tinggi', 'Pair', 'Warna', 'Urutan', 'Urutan murni', 'Trail'], pk: ['Kartu tinggi', 'One pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'] },
    ru: { ppair: 'Пара И', bpair: 'Пара Б', bo: 'Делайте ставки', lastc: 'Приём ставок завершается', bclosed: 'Ставки закрыты', rs: 'Результаты', nx: 'Следующий раунд через', mc: 'Рынок закрыт', placed: 'Ставка принята', bet: 'Поставить', pick: 'Сначала сделайте выбор',
      dl: 'Раздача карт', sd: 'Вскрытие', l7: 'Открываем карту', dr: 'Кости катятся', cf: 'Кости падают', bd: 'Идёт розыгрыш', dp: 'Дилер берёт карты',
      player: 'Игрок', banker: 'Банкир', tie: 'Ничья', pair: 'Пара', andar: 'Андар', bahar: 'Бахар', joker: 'Джокер', cards: 'карт', pla: 'Игрок A', plb: 'Игрок B', pplus: 'Пара плюс',
      red: 'Красные', blue: 'Синие', black: 'Чёрные', twop: '2 пары+', dbl: 'Дубль', dbl2: '2 дубля', mixed: 'Разные', triple: 'Тройка', balls: 'шаров', ball: 'Шар', odd: 'Нечёт', even: 'Чёт',
      line: 'линия', lines: 'линий', bust: 'Перебор', bj: 'Блэкджек', dealer: 'Дилер', sum: 'Сумма', wins: 'побеждает',
      tp: ['Старшая карта', 'Пара', 'Масть', 'Стрит', 'Чистый стрит', 'Тройка'], pk: ['Старшая карта', 'Пара', 'Две пары', 'Сет', 'Стрит', 'Флеш', 'Фулл-хаус', 'Каре', 'Стрит-флеш'] },
    de: { ppair: 'S-Paar', bpair: 'B-Paar', bo: 'Jetzt setzen', lastc: 'Einsätze schließen gleich', bclosed: 'Einsätze geschlossen', rs: 'Ergebnisse', nx: 'Nächste Runde in', mc: 'Markt geschlossen', placed: 'Einsatz platziert', bet: 'Setzen', pick: 'Bitte zuerst wählen',
      dl: 'Karten werden verteilt', sd: 'Showdown', l7: 'Karte wird gezogen', dr: 'Würfel rollen', cf: 'Würfel fallen', bd: 'Ziehung läuft', dp: 'Der Dealer spielt',
      player: 'Spieler', banker: 'Bank', tie: 'Unentschieden', pair: 'Paar', andar: 'Andar', bahar: 'Bahar', joker: 'Joker', cards: 'Karten', pla: 'Spieler A', plb: 'Spieler B', pplus: 'Paar Plus',
      red: 'Rot', blue: 'Blau', black: 'Schwarz', twop: '2 Paare+', dbl: 'Pasch', dbl2: '2 Pasche', mixed: 'Gemischt', triple: 'Drilling', balls: 'Kugeln', ball: 'Kugel', odd: 'Ungerade', even: 'Gerade',
      line: 'Linie', lines: 'Linien', bust: 'Bust', bj: 'Blackjack', dealer: 'Dealer', sum: 'Summe', wins: 'gewinnt',
      tp: ['Höchste Karte', 'Paar', 'Farbe', 'Straße', 'Reine Straße', 'Drilling'], pk: ['Höchste Karte', 'Paar', 'Zwei Paare', 'Drilling', 'Straße', 'Flush', 'Full House', 'Vierling', 'Straight Flush'] },
    hi: { ppair: 'P पेयर', bpair: 'B पेयर', bo: 'अभी दांव लगाएं', lastc: 'दांव बंद होने वाले हैं', bclosed: 'दांव बंद', rs: 'नतीजे', nx: 'अगला राउंड', mc: 'बाज़ार बंद', placed: 'दांव दर्ज हुआ', bet: 'दांव लगाएं', pick: 'पहले चुनें',
      dl: 'पत्ते बाँटे जा रहे हैं', sd: 'पत्ते खुल रहे हैं', l7: 'पत्ता खुल रहा है', dr: 'पासे लुढ़क रहे हैं', cf: 'पासे गिर रहे हैं', bd: 'ड्रॉ जारी है', dp: 'डीलर खेल रहा है',
      player: 'प्लेयर', banker: 'बैंकर', tie: 'टाई', pair: 'पेयर', andar: 'अंदर', bahar: 'बाहर', joker: 'जोकर', cards: 'पत्ते', pla: 'प्लेयर A', plb: 'प्लेयर B', pplus: 'पेयर प्लस',
      red: 'लाल', blue: 'नीला', black: 'काला', twop: '2 पेयर+', dbl: 'डबल', dbl2: '2 डबल', mixed: 'मिश्रित', triple: 'ट्रिपल', balls: 'गेंदें', ball: 'गेंद', odd: 'विषम', even: 'सम',
      line: 'लाइन', lines: 'लाइनें', bust: 'बस्ट', bj: 'ब्लैकजैक', dealer: 'डीलर', sum: 'योग', wins: 'जीता',
      tp: ['हाई कार्ड', 'पेयर', 'कलर', 'सीक्वेंस', 'प्योर सीक्वेंस', 'ट्रेल'], pk: ['हाई कार्ड', 'पेयर', 'टू पेयर', 'थ्री ऑफ़ अ काइंड', 'स्ट्रेट', 'फ्लश', 'फुल हाउस', 'फोर ऑफ़ अ काइंड', 'स्ट्रेट फ्लश'] },
    zh: { ppair: '闲对', bpair: '庄对', bo: '请下注', lastc: '即将停止下注', bclosed: '停止下注', rs: '开奖结果', nx: '下一局', mc: '暂停交易', placed: '已下注', bet: '下注', pick: '请先选择',
      dl: '发牌中', sd: '比牌中', l7: '开牌中', dr: '摇骰中', cf: '骰子落下', bd: '开奖中', dp: '庄家补牌',
      player: '闲', banker: '庄', tie: '和', pair: '对子', andar: '安达', bahar: '巴哈', joker: '王牌', cards: '张', pla: '玩家 A', plb: '玩家 B', pplus: '对子加注',
      red: '红', blue: '蓝', black: '黑', twop: '两对+', dbl: '对子', dbl2: '双对子', mixed: '杂色', triple: '围骰', balls: '球', ball: '球', odd: '单', even: '双',
      line: '条线', lines: '条线', bust: '爆牌', bj: '黑杰克', dealer: '庄家', sum: '总和', wins: '胜',
      tp: ['散牌', '对子', '金花', '顺子', '同花顺', '豹子'], pk: ['高牌', '一对', '两对', '三条', '顺子', '同花', '葫芦', '四条', '同花顺'] }
  };
  function L() { var l = Object.assign({}, T.en, T[K.lang()] || {}); return l; }
  var COMMA = { fr: 1, es: 1, pt: 1, tr: 1, vi: 1, id: 1, ru: 1, de: 1 };
  // rules: intro + step 2 shared; each game gives steps 1 and 3 in 12 languages, {key} = payout of that bet in the language's format
  var R_INTRO = { en: '🔴 LIVE: a new round every {P} s, the same for everyone.', fr: '🔴 EN DIRECT : un tour toutes les {P} s, le même pour tout le monde.', es: '🔴 EN VIVO: una ronda cada {P} s, la misma para todos.',
    pt: '🔴 AO VIVO: uma rodada a cada {P} s, a mesma para todos.', ar: '🔴 مباشر: جولة جديدة كل {P} ثانية، نفسها للجميع.', tr: '🔴 CANLI: her {P} sn’de yeni bir tur, herkes için aynı.',
    vi: '🔴 TRỰC TIẾP: mỗi {P} giây một vòng, giống nhau cho mọi người.', id: '🔴 LANGSUNG: ronde baru tiap {P} dtk, sama untuk semua.', ru: '🔴 В ПРЯМОМ ЭФИРЕ: новый раунд каждые {P} с, общий для всех.',
    de: '🔴 LIVE: alle {P} s eine neue Runde, für alle gleich.', hi: '🔴 लाइव: हर {P} सेकंड में नया राउंड, सबके लिए एक जैसा।', zh: '🔴 直播：每 {P} 秒一局，所有人同一结果。' };
  var R_STEP2 = { en: '2. Set your stake and tap “Place bet” before bets close. One bet per round.', fr: '2. Choisis ta mise et touche « Parier » avant la fermeture des paris. Un pari par tour.',
    es: '2. Elige tu apuesta y toca «Apostar» antes del cierre. Una apuesta por ronda.', pt: '2. Escolha o valor e toque em «Apostar» antes do fechamento. Uma aposta por rodada.',
    ar: '2. اختر مبلغ الرهان والمس «راهن» قبل إغلاق الرهانات. رهان واحد لكل جولة.', tr: '2. Tutarını seç ve bahisler kapanmadan “Bahis yap”a dokun. Her turda bir bahis.',
    vi: '2. Chọn mức cược và chạm «Đặt cược» trước khi đóng cược. Mỗi vòng một cược.', id: '2. Atur taruhan lalu sentuh «Pasang» sebelum taruhan ditutup. Satu taruhan per ronde.',
    ru: '2. Выберите сумму и нажмите «Поставить» до закрытия ставок. Одна ставка за раунд.', de: '2. Wähle deinen Einsatz und tippe auf „Setzen“, bevor die Einsätze schließen. Ein Einsatz pro Runde.',
    hi: '2. राशि चुनें और दांव बंद होने से पहले «दांव लगाएं» छुएं। हर राउंड में एक दांव।', zh: '2. 设定金额，在停止下注前点击“下注”。每局一注。' };
  function rules(P, odds, R) {
    var o = {};
    Object.keys(R_INTRO).forEach(function (lg) {
      var r = R[lg] || R.en, f = function (s) { return s.replace(/\{(\w+)\}/g, function (m, k) { var v = odds[k]; return v == null ? m : '×' + Number(v).toFixed(2).replace('.', COMMA[lg] ? ',' : '.'); }); };
      o[lg] = R_INTRO[lg].replace('{P}', P) + '\n1. ' + f(r[0]) + '\n' + R_STEP2[lg] + '\n3. ' + f(r[1]);
    });
    return o;
  }
  function mmss(v) { v = Math.max(0, Math.ceil(v)); return Math.floor(v / 60) + ':' + (v % 60 < 10 ? '0' : '') + (v % 60); }
  function cl01(k) { return Math.max(0, Math.min(1, k)); }
  function seg(e, a, b) { return cl01((e - a) / (b - a)); }
  function eio(k) { k = cl01(k); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function eo(k) { k = cl01(k); return 1 - Math.pow(1 - k, 3); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function hr(a, b) { var h = ((a | 0) ^ Math.imul(b | 0, 0x9E3779B1)) >>> 0; h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B) >>> 0; h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function sa(el, n, v) { if (!el) return; var c = el._c || (el._c = {}); if (c[n] !== v) { c[n] = v; el.setAttribute(n, v); } }
  function tr(x, y, s, r) { return 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' + (s != null && s !== 1 ? ' scale(' + s.toFixed(3) + ')' : '') + (r ? ' rotate(' + r.toFixed(1) + ')' : ''); }
  // SVG text that never overflows: squeezed (textLength) when wider than max
  function txt(el, v, max) {
    if (!el || el.textContent === v) return;
    el.textContent = v; el.removeAttribute('textLength'); el.removeAttribute('lengthAdjust');
    if (max && v) { try { if (el.getComputedTextLength() > max) { el.setAttribute('textLength', String(max)); el.setAttribute('lengthAdjust', 'spacingAndGlyphs'); } } catch (eT) { /* not rendered yet */ } }
  }
  function cls(el, v) { sa(el, 'class', v); }
  function pollDelay(R, t, hasRes) {
    if (t < R.close) { var a = R.close - t; return a > 14 ? Math.min(8000, (a - 10) * 1000) : a > 1.3 ? Math.min(2500, (a - 1.1) * 1000) : Math.max(100, (a + 0.1) * 1000); }
    if (!hasRes) return 400;
    var b = R.end - t; return b > 14 ? Math.min(8000, (b - 10) * 1000) : b > 1.3 ? Math.min(2500, (b - 1.1) * 1000) : Math.max(150, (b + 0.25) * 1000);
  }
  function normOdds(o) { var r = {}; if (!o) return r; if (Array.isArray(o)) o.forEach(function (v, i) { r[String(i)] = +v; }); else Object.keys(o).forEach(function (k) { r[k] = +o[k]; }); return r; }
  var GID = 0;
  function rgd(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="' + a + '"/><stop offset=".6" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lgd(id, a, b, v) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (v ? 0 : 1) + '" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  function felt(uid, a, b) { return '<radialGradient id="ft' + uid + '" cx="50%" cy="22%" r="85%"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient>'; }
  function table(uid, bg, edge) { return '<rect x="-300" y="-300" width="960" height="830" fill="' + bg + '"/><rect x="6" y="4" width="348" height="222" rx="20" fill="url(#ft' + uid + ')" stroke="' + edge + '" stroke-width="3"/>'; }

  /* ======================================================= shared live engine ===================================================== */
  // G: { SHOW (s) or show(res), lab, odds0, rules, scene(uid,l), board(uid,l,oddTxt,odds), init(c), frame(c,R,t,e,res,odds),
  //      wins(res) → winning selections, hist(n,c), beat(e,res,R) → int that changes at each highlight, bev: sound event name }
  function live(key, G) {
    var showOf = function (res) { return G.show ? G.show(res) : G.SHOW; };
    K.register(key, function (box) {
      var l = L(), uid = ++GID, dc = K.dec();
      var oddTxt = function (v) { return v == null || !isFinite(v) ? '×–' : '×' + Number(v).toFixed(2).replace('.', dc); };
      box.classList.add('cg-game', 'cg-live4', 'cg-' + key);
      box.innerHTML = '<div class="cg-stage l4-stage" data-ph="open"><div class="l4-head"><span class="l4-live"><i></i><b>LIVE</b></span><b class="l4-ph fit"></b><em class="l4-tm fit"></em></div>' +
        '<i class="l4-bar"><b></b></i>' +
        '<div class="l4-scene"><svg class="l4-svg" viewBox="0 0 360 230" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + G.scene(uid, l) + '</svg></div>' +
        '<div class="l4-last"></div></div>' +
        K.stakePanel(l.bet, '<div class="l4-board l4-b-' + key + '" dir="ltr">' + G.board(uid, l, oddTxt, G.odds0 || {}) + '</div>');
      K.bindStake(box);
      var q = function (s) { return box.querySelector(s); };
      var ph = q('.l4-ph'), tm = q('.l4-tm'), bar = q('.l4-bar b'), barB = q('.l4-bar'), go = $('csGo'), stage = q('.l4-stage'), lastEl = q('.l4-last'), svg = q('.l4-svg');
      var st = { R: null, me: null, sel: null, off: 0, first: true, shown: null, busy: false, lastKey: '', mk: '', odds: Object.assign({}, G.odds0 || {}), cls: '' };
      var ctx = { box: box, svg: svg, uid: uid, l: l, oddTxt: oddTxt, dc: dc, q: q, st: st };
      G.init(ctx);
      var nowS = function () { return Date.now() / 1000 + st.off; };
      var locked = function () { return !!(st.me && st.R && st.me.rid === st.R.i); };
      var choose = function (s) { if (locked() || s == null) return; st.sel = String(s); st.mk = ''; K.sfx('click'); };
      box.querySelectorAll('[data-s]').forEach(function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-s')); }); });
      box.addEventListener('stake', function () { st.mk = ''; });
      go.addEventListener('click', async function () {
        var R = st.R; if (st.busy || !R || locked() || nowS() >= R.close) return;
        if (st.sel == null) { K.toast(l.pick); return; }
        if (st.odds[st.sel] == null) return;
        st.busy = true; go.disabled = true;
        var r = await K.multi(key, 'bet', { sel: st.sel });
        st.busy = false;
        if (r) { st.me = r; if (r.round) { st.R = r.round; if (r.round.odds) st.odds = normOdds(r.round.odds); } st.mk = ''; }
      });
      var alive = function () { return box.isConnected && K.S.game === key; };
      var sync = async function () {
        if (!alive()) return;
        var r = null;
        try { var rq = await fetch('casino-tour.php?g=' + key, { cache: 'no-store' }); r = await rq.json(); } catch (e) { r = null; }
        if ((!r || !r.ok) && !K.guest()) { r = await K.multi(key, 'dround', null, true); if (r) r.mine = 1; }
        if (!alive()) return;
        var delay = 4000;
        if (r && r.round) {
          st.off = r.now - Date.now() / 1000; st.R = r.round; st.fails = 0;
          if (r.round.odds) { st.odds = normOdds(r.round.odds); st.mk = ''; }
          delay = pollDelay(st.R, nowS(), !!st.R.res);
        } else { st.fails = (st.fails || 0) + 1; delay = Math.min(10000, 1500 * st.fails); }
        clearTimeout(K.S.timer); K.S.timer = setTimeout(sync, delay);
        if (!r || !r.round) return;
        var mine = r.mine ? r : null, open0 = st.me && !st.me.done;
        if (!K.guest() && !mine && (st.first || (open0 && st.R.res && st.R.i >= (st.me.rid || 0)))) {
          mine = await K.multi(key, 'dround', null, true);
          if (!alive()) return;
        }
        if (mine && mine.round) { st.me = mine.has ? mine : null; if (st.first) { st.first = false; if (st.me && st.me.done) st.shown = st.me.ref; } st.mk = ''; }
      };
      var showMine = function (t) {
        var me = st.me, R = st.R;
        if (!me || !me.done || !me.ref || st.shown === me.ref || !R) return;
        if (me.rid === R.i && (!R.res || t < R.close + showOf(R.res))) return; // the amount only once the show is over
        st.shown = me.ref;
        K.resultLine(box, me);
      };
      var wasWin = '';
      var amb = function (on, k) { try { if (D6.Sfx && D6.Sfx.amb) D6.Sfx.amb(key, on, k); } catch (eA) { /* ignore */ } };
      var ambOn = false;
      var tick = function () {
        if (!alive()) { if (ambOn) { ambOn = false; amb(false); } return; }
        var R = st.R;
        if (R) {
          var t = nowS();
          if (t >= R.end + 0.6) { // round over: the next one is already open (the server confirms at the next poll)
            var lst = (R.last || []).slice(); if (R.res) lst.unshift(+R.res.n);
            st.R = R = { i: R.i + 1, t0: R.end, close: R.end + R.B, end: R.end + R.P, P: R.P, B: R.B, phase: 'bet', last: lst.slice(0, 6) };
          }
          var bet = t < R.close, e = t - R.close, res = R.res || null, SH = res ? showOf(res) : 99, rev = !!res && e >= SH;
          if (bet) {
            var left = R.close - t;
            K.setText(ph, left <= 10 ? l.lastc : l.bo); K.setText(tm, mmss(left));
            bar.style.transform = 'scaleX(' + cl01(left / R.B).toFixed(4) + ')';
          } else {
            var rs = rev && e < SH + 5;
            K.setText(ph, rs ? l.rs : rev ? l.nx : (res ? l[G.lab] : l.bclosed)); K.setText(tm, rev && !rs ? mmss(R.end - t) : '');
            bar.style.transform = 'scaleX(0)';
          }
          var cl = bet ? (R.close - t <= 10 ? 'warn' : 'open') : 'shut';
          if (st.cls !== cl) { st.cls = cl; barB.className = 'l4-bar ' + cl; stage.setAttribute('data-ph', cl); }
          G.frame(ctx, R, t, e, bet ? null : res, st.odds);
          if (bet) st.goArm = R.i; else if (st.goArm === R.i && e < 1.5) { st.goArm = -1; K.sfx('go'); }
          if (!bet && res && e >= 0 && e < SH && G.beat) K.sfxBeat(st, 'bt', G.beat(e, res, R), G.bev || 'tick');
          var aOn = !bet && !!res && e >= 0 && e < SH;
          if (aOn !== ambOn) { ambOn = aOn; amb(aOn, aOn ? .6 : 0); }
          if (rev && st.revI !== R.i && e < SH + 1.5) { st.revI = R.i; try { if (D6.Sfx && D6.Sfx.play) D6.Sfx.play(G.endEv || 'coin', null, key); } catch (eP) { /* ignore */ } }
          var wins = rev ? G.wins(res).join(',') : '';
          if (wins !== wasWin) {
            wasWin = wins; var ws = wins ? wins.split(',') : [];
            stage.classList.toggle('l4-done', !!wins);
            box.querySelectorAll('[data-s]').forEach(function (b) { b.classList.toggle('win', ws.indexOf(b.getAttribute('data-s')) >= 0); });
          }
          var list = (R.last || []).slice(); if (rev) list.unshift(+res.n);
          var lk = R.i + ':' + list.join(',');
          if (lk !== st.lastKey) { st.lastKey = lk; lastEl.innerHTML = list.slice(0, 12).map(function (v, j) { return '<i class="l4-li' + (j === 0 && rev ? ' new' : '') + '">' + G.hist(+v, ctx) + '</i>'; }).join(''); }
          var mineNow = !!(st.me && st.me.rid === R.i);
          if (mineNow) { K.setText(go, l.placed + ' · ' + oddTxt(st.odds[st.me.sel])); go.disabled = true; go.classList.add('placed'); go.classList.remove('wait'); }
          else if (!bet) { K.setText(go, l.bclosed); go.disabled = true; go.classList.remove('placed'); go.classList.add('wait'); }
          else { K.setText(go, st.sel == null || st.odds[st.sel] == null ? l.bet : l.bet + ' · ' + oddTxt(st.odds[st.sel])); go.disabled = st.busy; go.classList.remove('placed', 'wait'); }
          var sel = mineNow ? String(st.me.sel) : st.sel;
          var mk = [sel, mineNow ? 1 : 0, JSON.stringify(st.odds)].join('|');
          if (mk !== st.mk) {
            st.mk = mk;
            box.querySelectorAll('[data-s]').forEach(function (b) { var s = b.getAttribute('data-s'); b.classList.toggle('on', s === sel); b.classList.toggle('mine', mineNow && s === sel); });
            box.querySelectorAll('[data-o]').forEach(function (x) { var v = oddTxt(st.odds[x.getAttribute('data-o')]); if (x.textContent !== v) { x.textContent = v; if (x.classList.contains('fit')) K.fitEl(x); } });
          }
          showMine(t);
        } else {
          G.frame(ctx, null, nowS(), -1, null, st.odds);
          if ((st.fails || 0) >= 2) { K.setText(ph, l.mc); K.setText(tm, ''); }
        }
        K.S.raf = requestAnimationFrame(tick);
      };
      requestAnimationFrame(function () { K.fitAll(box); });
      sync(); tick();
    }, { rules: G.rules });
  }
  // banner (pill) in the scene: countdown during bets, then the result
  function banner(y) { return '<g class="bn" opacity="0" transform="translate(180 ' + y + ')"><rect x="-60" y="-15" width="120" height="30" rx="15"/><text y="6" text-anchor="middle"></text></g>'; }
  function bnInit(c) { var g = c.q('.bn'); c.bn = { g: g, r: g.querySelector('rect'), t: g.querySelector('text'), v: null }; }
  function bnSet(c, v, kind) {
    var b = c.bn; sa(b.g, 'opacity', v ? '1' : '0'); cls(b.g, 'bn ' + (kind || ''));
    if (!v || b.v === v) return; b.v = v; txt(b.t, v, 290);
    var w = 40; try { w = Math.min(320, b.t.getComputedTextLength() + 34); } catch (eB) { /* ignore */ } sa(b.r, 'x', (-w / 2).toFixed(1)); sa(b.r, 'width', w.toFixed(1));
  }
  function bnCd(c, R, t, e) { if (R && e < 0) { bnSet(c, mmss(R.close - t), R.close - t <= 10 ? 'cd warn' : 'cd'); return true; } return false; }
  function btn(s, inner, extra) { return '<button type="button" data-s="' + s + '" class="' + (extra || '') + '">' + inner + '</button>'; }
  function lab(t) { return '<span class="fit">' + K.esc(t) + '</span>'; }
  function odd(s, oddTxt, o) { return '<b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b>'; }

  /* =========================================================== playing cards =========================================================== */
  // card code 0…51: rank = (c >> 2) + 1 (1 = A … 13 = K), suit = c & 3 (0 ♠, 1 ♥, 2 ♦, 3 ♣ ; ♥ ♦ red)
  var SUIT = ['M0-6.6C2.6-3.4 6.2-1 6.2 2.2C6.2 4.8 3.4 6 1.2 4.4L2.2 7.4H-2.2L-1.2 4.4C-3.4 6-6.2 4.8-6.2 2.2C-6.2-1-2.6-3.4 0-6.6Z',
    'M0 6.4C-4.4 3.2-6.4.4-6.4-2.2C-6.4-4.6-4.6-6.2-2.8-6.2C-1.4-6.2-.4-5.4 0-4.4C.4-5.4 1.4-6.2 2.8-6.2C4.6-6.2 6.4-4.6 6.4-2.2C6.4.4 4.4 3.2 0 6.4Z',
    'M0-6.8L5.2 0L0 6.8L-5.2 0Z',
    'M0-6.6A2.9 2.9 0 1 1 -.01-6.6ZM-3.2-.8A2.9 2.9 0 1 1 -3.21-.8ZM3.2-.8A2.9 2.9 0 1 1 3.19-.8ZM-1 1.4L-2.2 6.8H2.2L1 1.4Z'];
  function cRank(c) { return (c >> 2) + 1; }
  function cSuit(c) { return c & 3; }
  function cRed(c) { return (c & 3) === 1 || (c & 3) === 2; }
  function rankTxt(r) { return r === 1 || r === 14 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r); }
  function suitP(s, fill, tf) { return '<path d="' + SUIT[s] + '" fill="' + fill + '"' + (tf ? ' transform="' + tf + '"' : '') + '/>'; }
  function cardFace(c) {
    var r = cRank(c), s = cSuit(c), col = cRed(c) ? '#DC2626' : '#111827';
    return '<rect x="-22" y="-31" width="44" height="62" rx="5" fill="#FFFDF7" stroke="#CBD5E1" stroke-width=".8"/>' +
      '<rect x="-19" y="-28" width="38" height="56" rx="3.5" fill="none" stroke="' + col + '" stroke-opacity=".18"/>' +
      '<text x="-14" y="-14" text-anchor="middle" class="cd-r" fill="' + col + '">' + rankTxt(r) + '</text>' + suitP(s, col, 'translate(-14 -5) scale(.75)') +
      '<text x="14" y="23" text-anchor="middle" class="cd-r" fill="' + col + '" transform="rotate(180 14 19)">' + rankTxt(r) + '</text>' + suitP(s, col, 'translate(0 5) scale(2.2)');
  }
  function cardBack(tone) {
    var a = tone || ['#1E1B4B', '#4338CA'];
    return '<rect x="-22" y="-31" width="44" height="62" rx="5" fill="' + a[0] + '" stroke="#FDE68A" stroke-width="1.2"/>' +
      '<rect x="-17" y="-26" width="34" height="52" rx="3" fill="' + a[1] + '" stroke="#FDE68A" stroke-opacity=".55" stroke-dasharray="2 2"/>' +
      '<circle r="9" fill="none" stroke="#FDE68A" stroke-width="1.6" opacity=".9"/><path d="M0-6L1.8-1.8 6 0 1.8 1.8 0 6-1.8 1.8-6 0-1.8-1.8Z" fill="#FDE68A"/>';
  }
  function cardEl(cl, tone) { return '<g class="cd ' + cl + '" opacity="0"><g class="cd-in"><g class="cd-f"></g><g class="cd-b">' + cardBack(tone) + '</g></g></g>'; }
  function cardSet(c, code) { if (c.face === code) return; c.face = code; c.f.innerHTML = code == null || code < 0 ? '' : cardFace(code); }
  function cardInit(g) { return { g: g, inn: g.querySelector('.cd-in'), f: g.querySelector('.cd-f'), b: g.querySelector('.cd-b'), face: null }; }
  // flip k: 0 = back, 1 = face (scaleX through 0)
  function cardPose(c, x, y, s, rot, flip, op) {
    sa(c.g, 'opacity', op == null ? '1' : String(op)); if (op === 0) return;
    sa(c.g, 'transform', tr(x, y, s, rot));
    var sx = Math.abs(Math.cos(cl01(flip) * Math.PI)); sa(c.inn, 'transform', 'scale(' + Math.max(.02, sx).toFixed(3) + ' 1)');
    var face = flip >= .5; sa(c.f, 'opacity', face ? '1' : '0'); sa(c.b, 'opacity', face ? '0' : '1');
  }
  function cardsInit(c, sel) { return [].slice.call(c.box.querySelectorAll(sel)).map(cardInit); }
  // a card that flies from (x0,y0) at time a (dur d) to (x,y), then flips at f (0.45 s)
  function deal(c, code, e, a, d, x0, y0, s0, x, y, s, rot, f) {
    if (e < a) { cardPose(c, 0, 0, 1, 0, 0, 0); return; }
    cardSet(c, code);
    var k = eio(seg(e, a, a + d));
    cardPose(c, lerp(x0, x, k), lerp(y0, y, k), lerp(s0, s, k), lerp(-25, rot || 0, k), f == null ? 1 : seg(e, f, f + .45), 1);
  }
  function hideCards(L) { L.forEach(function (c) { cardPose(c, 0, 0, 1, 0, 0, 0); }); }
  function shoe(x, y, tone) { return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-30" y="-15" width="60" height="30" rx="6" fill="#1C1917" stroke="#B45309" stroke-width="1.4"/><g transform="translate(-6 -2) rotate(-12) scale(.42)">' + cardBack(tone) + '</g><path d="M-30 15h60l-8 6h-44z" fill="#292524"/></g>'; }
  function chipS(t, cl) { return '<span class="h-c ' + cl + '">' + K.esc(String(t)) + '</span>'; }

  /* ================================================================ Baccarat ================================================================ */
  function bv(c) { var r = cRank(c); return r >= 10 ? 0 : r; }
  function bacTimes(res) {
    var P3 = (res.pl || []).length > 2, B3 = (res.bk || []).length > 2, t = 5.8, o = { p3: -1, b3: -1 };
    if (P3) { o.p3 = t; t += 1.5; }
    if (B3) { o.b3 = t; t += 1.5; }
    o.end = (P3 || B3) ? t - .4 : 5.6; return o;
  }
  live('baccaratlive', {
    lab: 'dl', bev: 'card', show: function (res) { return bacTimes(res).end + 1.6; },
    odds0: { pp: 12.22, pl: 2.10, tie: 9.85, bk: 2.05, bp: 12.22 },
    beat: function (e, res) { var a = [.3, .85, 1.4, 1.95, 2.8, 3.4, 4.2, 4.8], b = bacTimes(res), n = 0; if (b.p3 >= 0) a.push(b.p3, b.p3 + .7); if (b.b3 >= 0) a.push(b.b3, b.b3 + .7); a.forEach(function (x) { if (e >= x) n++; }); return n; },
    rules: rules(150, { pp: 12.22, pl: 2.10, tie: 9.85, bk: 2.05, bp: 12.22 }, {
      en: ['Bet on Player ({pl}), Banker ({bk}) or Tie ({tie}); side bets: Player Pair or Banker Pair ({pp}, the first two cards of that hand have the same rank).', 'Real baccarat rules: two cards each, a third card by the classic table, the total closest to 9 wins (10, J, Q, K count 0). Each card is drawn at random from a continuously shuffled shoe. On a Tie, Player and Banker bets lose.'],
      fr: ['Parie sur Joueur ({pl}), Banquier ({bk}) ou Égalité ({tie}) ; paris annexes : Paire Joueur ou Paire Banquier ({pp}, les deux premières cartes de cette main ont le même rang).', 'Vraies règles du baccara : deux cartes chacun, une 3e carte selon le tableau classique, le total le plus proche de 9 gagne (10, V, D, R valent 0). Chaque carte est tirée au hasard d’un sabot mélangé en continu. En cas d’Égalité, Joueur et Banquier perdent.'],
      es: ['Apuesta a Jugador ({pl}), Banca ({bk}) o Empate ({tie}); apuestas extra: Pareja Jugador o Pareja Banca ({pp}, las dos primeras cartas de esa mano tienen el mismo valor).', 'Reglas reales del baccarat: dos cartas cada uno, una tercera según la tabla clásica, gana el total más cercano a 9 (10, J, Q, K valen 0). Cada carta sale al azar de un zapato barajado sin parar. Si hay Empate, Jugador y Banca pierden.'],
      pt: ['Aposte em Jogador ({pl}), Banca ({bk}) ou Empate ({tie}); apostas extras: Par do Jogador ou Par da Banca ({pp}, as duas primeiras cartas dessa mão têm o mesmo valor).', 'Regras reais do bacará: duas cartas cada, uma terceira pela tabela clássica, vence o total mais próximo de 9 (10, J, Q, K valem 0). Cada carta sai ao acaso de um sapato embaralhado continuamente. Em caso de Empate, Jogador e Banca perdem.'],
      ar: ['راهن على اللاعب ({pl}) أو المصرف ({bk}) أو التعادل ({tie})؛ رهانات جانبية: زوج اللاعب أو زوج المصرف ({pp}، أول ورقتين في اليد من نفس الرتبة).', 'قواعد الباكارا الحقيقية: ورقتان لكل جانب، وورقة ثالثة حسب الجدول الكلاسيكي، والمجموع الأقرب إلى 9 يفوز (10 والصور تساوي 0). كل ورقة تُسحب عشوائيًا من حذاء يُخلط باستمرار. عند التعادل يخسر رهانا اللاعب والمصرف.'],
      tr: ['Oyuncu ({pl}), Kasa ({bk}) veya Beraberlik ({tie}) oyna; yan bahisler: Oyuncu Per veya Kasa Per ({pp}, o elin ilk iki kartı aynı değerde).', 'Gerçek bakara kuralları: herkese iki kart, klasik tabloya göre üçüncü kart, 9’a en yakın toplam kazanır (10, J, Q, K 0 sayılır). Her kart sürekli karıştırılan bir kutudan rastgele çekilir. Beraberlikte Oyuncu ve Kasa bahisleri kaybeder.'],
      vi: ['Cược Con ({pl}), Cái ({bk}) hoặc Hòa ({tie}); cược phụ: Đôi Con hoặc Đôi Cái ({pp}, hai lá đầu của tay đó cùng số).', 'Luật baccarat thật: mỗi bên hai lá, lá thứ ba theo bảng cổ điển, tổng gần 9 nhất thắng (10, J, Q, K tính 0). Mỗi lá được rút ngẫu nhiên từ hộp bài xáo liên tục. Nếu Hòa, cược Con và Cái thua.'],
      id: ['Pasang Player ({pl}), Banker ({bk}) atau Seri ({tie}); taruhan samping: Player Pair atau Banker Pair ({pp}, dua kartu pertama tangan itu sama nilainya).', 'Aturan baccarat asli: masing-masing dua kartu, kartu ketiga menurut tabel klasik, total terdekat ke 9 menang (10, J, Q, K bernilai 0). Setiap kartu diambil acak dari shoe yang terus dikocok. Jika Seri, taruhan Player dan Banker kalah.'],
      ru: ['Ставьте на Игрока ({pl}), Банкира ({bk}) или Ничью ({tie}); доп. ставки: Пара Игрока или Пара Банкира ({pp}, первые две карты этой руки одного номинала).', 'Настоящие правила баккара: по две карты, третья по классической таблице, побеждает сумма ближе к 9 (10, В, Д, К = 0). Каждая карта берётся случайно из постоянно тасуемого шуза. При Ничьей ставки на Игрока и Банкира проигрывают.'],
      de: ['Setze auf Spieler ({pl}), Bank ({bk}) oder Unentschieden ({tie}); Nebenwetten: Spieler-Paar oder Bank-Paar ({pp}, die ersten zwei Karten dieser Hand haben denselben Rang).', 'Echte Baccarat-Regeln: je zwei Karten, eine dritte nach der klassischen Tabelle, die Summe am nächsten an 9 gewinnt (10, B, D, K zählen 0). Jede Karte kommt zufällig aus einem ständig gemischten Schlitten. Bei Unentschieden verlieren Spieler und Bank.'],
      hi: ['प्लेयर ({pl}), बैंकर ({bk}) या टाई ({tie}) पर दांव लगाएं; साइड दांव: प्लेयर पेयर या बैंकर पेयर ({pp}, उस हाथ के पहले दो पत्ते एक ही रैंक के)।', 'असली बैकारेट नियम: दोनों को दो पत्ते, क्लासिक तालिका से तीसरा पत्ता, 9 के सबसे करीब योग जीतता है (10, J, Q, K = 0)। हर पत्ता लगातार फेंटे जाने वाले शू से रैंडम आता है। टाई पर प्लेयर और बैंकर के दांव हारते हैं।'],
      zh: ['押闲（{pl}）、庄（{bk}）或和（{tie}）；边注：闲对或庄对（{pp}，该方前两张牌点数相同）。', '真实百家乐规则：各发两张，按经典补牌表补第三张，点数最接近 9 者胜（10、J、Q、K 为 0 点）。每张牌从连续洗牌的牌靴中随机抽出。开和时押闲、押庄皆输。']
    }),
    scene: function (uid, l) {
      var side = function (x, b) {
        var c = b ? ['#7F1D1D', '#F87171'] : ['#1E3A8A', '#60A5FA'];
        return '<g class="ba-side ' + (b ? 'b' : 'p') + '"><rect x="' + (x - 70) + '" y="42" width="140" height="176" rx="16" fill="' + c[0] + '" fill-opacity=".5" stroke="' + c[1] + '" stroke-opacity=".75" stroke-width="1.6"/>' +
          '<rect class="ba-glow" x="' + (x - 70) + '" y="42" width="140" height="176" rx="16" fill="none" stroke="#FDE68A" stroke-width="3" opacity="0"/>' +
          '<text class="ba-n" x="' + (x - 14) + '" y="63" text-anchor="middle">' + K.esc(b ? l.banker : l.player) + '</text>' +
          '<circle cx="' + (x + 48) + '" cy="58" r="12" class="ba-sc ' + (b ? 'b' : 'p') + '"/><text class="ba-s" x="' + (x + 48) + '" y="63" text-anchor="middle"></text>' +
          '<rect x="' + (x - 50) + '" y="78" width="46" height="64" rx="6" class="ba-slot"/><rect x="' + (x + 4) + '" y="78" width="46" height="64" rx="6" class="ba-slot"/></g>';
      };
      return '<defs>' + felt(uid, '#0E6B47', '#032619') + '</defs>' + table(uid, '#021A10', '#B45309') +
        side(92, 0) + side(268, 1) + shoe(318, 22, ['#1E3A8A', '#2563EB']) +
        [0, 1, 2, 3, 4, 5].map(function (i) { return cardEl('ba-c ba-c' + i, ['#1E3A8A', '#2563EB']); }).join('') + banner(23);
    },
    board: function (uid, l, oddTxt, o) {
      return btn('pp', lab(l.ppair) + odd('pp', oddTxt, o), 'ba-b pp') + btn('pl', lab(l.player) + odd('pl', oddTxt, o), 'ba-b pl') +
        btn('tie', lab(l.tie) + odd('tie', oddTxt, o), 'ba-b tie') + btn('bk', lab(l.banker) + odd('bk', oddTxt, o), 'ba-b bk') + btn('bp', lab(l.bpair) + odd('bp', oddTxt, o), 'ba-b bp');
    },
    hist: function (n) { return chipS(['P', 'B', 'T'][n] || '?', 'ba' + n); },
    wins: function (res) { var w = [['pl', 'bk', 'tie'][+res.n]]; var P = res.pl || [], B = res.bk || []; if (P.length > 1 && cRank(P[0]) === cRank(P[1])) w.push('pp'); if (B.length > 1 && cRank(B[0]) === cRank(B[1])) w.push('bp'); return w; },
    init: function (c) { c.cs = cardsInit(c, '.ba-c'); c.sc = [].slice.call(c.box.querySelectorAll('.ba-s')); c.gl = [].slice.call(c.box.querySelectorAll('.ba-glow')); bnInit(c); },
    frame: function (c, R, t, e, res) {
      if (!res) { hideCards(c.cs); txt(c.sc[0], ''); txt(c.sc[1], ''); if (!bnCd(c, R, t, e)) bnSet(c, ''); c.gl.forEach(function (g) { sa(g, 'opacity', '0'); }); return; }
      var P = res.pl || [], B = res.bk || [], tm = bacTimes(res);
      // slots: P1 (60,110) P2 (114,110) · B1 (236,110) B2 (290,110) · third cards across below
      var SX = [65, 119, 241, 295], dealT = [.3, .85, 1.4, 1.95], flipT = [2.8, 4.2, 3.4, 4.8], code = [P[0], B[0], P[1], B[1]], slot = [0, 2, 1, 3];
      for (var i = 0; i < 4; i++) deal(c.cs[i], code[i], e, dealT[i], .5, 318, 22, .45, SX[slot[i]], 112, .98, 0, flipT[i]);
      if (P.length > 2) deal(c.cs[4], P[2], e, tm.p3, .55, 318, 22, .45, 92, 184, .9, 90, tm.p3 + .7); else cardPose(c.cs[4], 0, 0, 1, 0, 0, 0);
      if (B.length > 2) deal(c.cs[5], B[2], e, tm.b3, .55, 318, 22, .45, 268, 184, .9, 90, tm.b3 + .7); else cardPose(c.cs[5], 0, 0, 1, 0, 0, 0);
      var ps = 0, bs = 0, pv = false, bvv = false;
      if (e >= 3.0) { ps += bv(P[0]); pv = true; } if (e >= 3.6) ps += bv(P[1]); if (P.length > 2 && e >= tm.p3 + .9) ps += bv(P[2]);
      if (e >= 4.4) { bs += bv(B[0]); bvv = true; } if (e >= 5.0) bs += bv(B[1]); if (B.length > 2 && e >= tm.b3 + .9) bs += bv(B[2]);
      txt(c.sc[0], pv ? String(ps % 10) : ''); txt(c.sc[1], bvv ? String(bs % 10) : '');
      var n = +res.n, w = e >= tm.end + .3, pulse = (.6 + .4 * Math.sin(t * 6)).toFixed(2);
      sa(c.gl[0], 'opacity', w && n !== 1 ? pulse : '0'); sa(c.gl[1], 'opacity', w && n !== 0 ? pulse : '0');
      bnSet(c, w ? (n === 2 ? c.l.tie + ' ' + res.ps + '–' + res.bs : (n ? c.l.banker : c.l.player) + ' ' + c.l.wins + ' ' + (n ? res.bs + '–' + res.ps : res.ps + '–' + res.bs)) : '', 'n' + n);
    }
  });

  /* ============================================================== Andar Bahar ============================================================== */
  var AB_K = [[1, 5], [6, 10], [11, 15], [16, 25], [26, 49]], AB_D = .42, AB_0 = .9;
  live('andarlive', {
    lab: 'dl', bev: 'card', show: function (res) { return AB_0 + (+res.n) * AB_D + 1.6; },
    odds0: { a: 1.82, b: 1.93, k0: 3.46, k1: 4.33, k2: 5.56, k3: 4.31, k4: 7.52 },
    beat: function (e) { return e < AB_0 ? 0 : 1 + Math.floor((e - AB_0) / AB_D); },
    rules: rules(155, { a: 1.82, b: 1.93, k0: 3.46, k1: 4.33, k2: 5.56, k3: 4.31, k4: 7.52 }, {
      en: ['The Joker card is shown during the bets. Bet on the side where the first card of the same rank will land: Andar ({a}) or Bahar ({b}); or on how many cards will be dealt: 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 or more ({k4}).', 'Cards are dealt from the rest of a 52-card deck, one to Andar, one to Bahar, starting with Andar, until a card matches the Joker’s rank (suits do not count). That side wins.'],
      fr: ['Le Joker est montré pendant les paris. Parie sur le côté où tombera la première carte du même rang : Andar ({a}) ou Bahar ({b}) ; ou sur le nombre de cartes distribuées : 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 ou plus ({k4}).', 'Les cartes viennent du reste d’un jeu de 52, une pour Andar, une pour Bahar, en commençant par Andar, jusqu’à une carte du rang du Joker (les couleurs ne comptent pas). Ce côté gagne.'],
      es: ['El Comodín se muestra durante las apuestas. Apuesta al lado donde caerá la primera carta del mismo valor: Andar ({a}) o Bahar ({b}); o a cuántas cartas se repartirán: 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 o más ({k4}).', 'Las cartas salen del resto de una baraja de 52, una a Andar y otra a Bahar, empezando por Andar, hasta que una tenga el valor del Comodín (los palos no cuentan). Ese lado gana.'],
      pt: ['O Coringa é mostrado durante as apostas. Aposte no lado onde cairá a primeira carta do mesmo valor: Andar ({a}) ou Bahar ({b}); ou em quantas cartas serão distribuídas: 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 ou mais ({k4}).', 'As cartas saem do resto de um baralho de 52, uma para Andar, outra para Bahar, começando por Andar, até uma carta com o valor do Coringa (os naipes não contam). Esse lado vence.'],
      ar: ['تظهر ورقة الجوكر أثناء الرهانات. راهن على الجهة التي ستسقط فيها أول ورقة من نفس الرتبة: أندار ({a}) أو باهار ({b})؛ أو على عدد الأوراق الموزّعة: 1–5 ({k0})، 6–10 ({k1})، 11–15 ({k2})، 16–25 ({k3})، 26 أو أكثر ({k4}).', 'تُوزّع الأوراق من بقية مجموعة 52 ورقة، واحدة لأندار وواحدة لباهار بدءًا بأندار، حتى تظهر ورقة برتبة الجوكر (الأشكال لا تُحتسب). تلك الجهة تفوز.'],
      tr: ['Joker kartı bahisler sırasında gösterilir. Aynı değerdeki ilk kartın düşeceği tarafa oyna: Andar ({a}) veya Bahar ({b}); ya da dağıtılacak kart sayısına: 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 veya fazla ({k4}).', 'Kartlar 52’lik destenin kalanından, Andar’dan başlayarak birer birer Andar ve Bahar’a dağıtılır; Joker’in değerinde bir kart gelene kadar (renkler sayılmaz). O taraf kazanır.'],
      vi: ['Lá Joker được lật trong lúc đặt cược. Cược bên nhận lá cùng số đầu tiên: Andar ({a}) hoặc Bahar ({b}); hoặc số lá được chia: 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 trở lên ({k4}).', 'Bài được chia từ phần còn lại của bộ 52 lá, một lá Andar, một lá Bahar, bắt đầu từ Andar, cho đến khi ra lá cùng số với Joker (chất không tính). Bên đó thắng.'],
      id: ['Kartu Joker ditampilkan selama taruhan. Pasang sisi tempat kartu pertama dengan nilai sama akan jatuh: Andar ({a}) atau Bahar ({b}); atau jumlah kartu yang dibagikan: 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 atau lebih ({k4}).', 'Kartu dibagikan dari sisa dek 52 kartu, satu ke Andar, satu ke Bahar, mulai dari Andar, sampai keluar kartu bernilai sama dengan Joker (jenis tidak dihitung). Sisi itu menang.'],
      ru: ['Джокер открыт во время ставок. Ставьте на сторону, куда ляжет первая карта того же номинала: Андар ({a}) или Бахар ({b}); или на число розданных карт: 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 и больше ({k4}).', 'Карты сдаются из остатка колоды в 52 карты, по одной в Андар и Бахар, начиная с Андара, пока не выпадет карта номинала Джокера (масти не важны). Эта сторона побеждает.'],
      de: ['Der Joker wird während der Einsätze gezeigt. Setze auf die Seite, auf der die erste Karte gleichen Rangs landet: Andar ({a}) oder Bahar ({b}); oder auf die Zahl der ausgeteilten Karten: 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 oder mehr ({k4}).', 'Die Karten kommen aus dem Rest eines 52er-Decks, abwechselnd Andar und Bahar, beginnend mit Andar, bis eine Karte den Rang des Jokers hat (Farben zählen nicht). Diese Seite gewinnt.'],
      hi: ['दांव के समय जोकर पत्ता दिखाया जाता है। उस तरफ़ दांव लगाएं जहाँ उसी रैंक का पहला पत्ता गिरेगा: अंदर ({a}) या बाहर ({b}); या बाँटे जाने वाले पत्तों की गिनती पर: 1–5 ({k0}), 6–10 ({k1}), 11–15 ({k2}), 16–25 ({k3}), 26 या ज़्यादा ({k4})।', '52 पत्तों की गड्डी के बाक़ी पत्ते, अंदर से शुरू करके एक-एक अंदर और बाहर बाँटे जाते हैं, जब तक जोकर की रैंक का पत्ता न आए (रंग नहीं गिने जाते)। वही तरफ़ जीतती है।'],
      zh: ['下注时亮出王牌。押第一张同点数牌落在哪一边：安达（{a}）或巴哈（{b}）；或押发出的牌数：1–5（{k0}）、6–10（{k1}）、11–15（{k2}）、16–25（{k3}）、26 张及以上（{k4}）。', '从 52 张牌的剩余牌中发牌，从安达开始，安达、巴哈轮流各一张，直到出现与王牌同点数的牌（不比花色）。该边获胜。']
    }),
    scene: function (uid, l) {
      var row = function (y, cl, name) {
        return '<g class="ab-row ' + cl + '"><rect x="92" y="' + (y - 38) + '" width="256" height="76" rx="14" class="ab-r"/><rect class="ab-glow" x="92" y="' + (y - 38) + '" width="256" height="76" rx="14" fill="none" stroke="#FDE68A" stroke-width="3" opacity="0"/>' +
          '<text class="ab-n" x="104" y="' + (y - 22) + '">' + K.esc(name) + '</text><text class="ab-k" x="336" y="' + (y - 22) + '" text-anchor="end"></text></g>';
      };
      var cards = []; for (var i = 0; i < 12; i++) cards.push(cardEl('ab-c ab-c' + i, ['#7C2D12', '#C2410C']));
      return '<defs>' + felt(uid, '#7F1D1D', '#2A0606') + '</defs>' + table(uid, '#170303', '#CA8A04') +
        row(76, 'a', l.andar) + row(168, 'b', l.bahar) +
        '<rect x="14" y="56" width="70" height="132" rx="14" fill="#000" fill-opacity=".28" stroke="#FDE68A" stroke-opacity=".5"/><text class="ab-j" x="49" y="74" text-anchor="middle">' + K.esc(l.joker) + '</text>' +
        cardEl('ab-jk', ['#7C2D12', '#C2410C']) + shoe(49, 210, ['#7C2D12', '#C2410C']).replace('translate(49 210)', 'translate(49 210) scale(.7)') +
        cards.join('') + banner(122).replace('translate(180 ', 'translate(220 ');
    },
    board: function (uid, l, oddTxt, o) {
      var h = btn('a', lab(l.andar) + odd('a', oddTxt, o), 'ab-b a w') + btn('b', lab(l.bahar) + odd('b', oddTxt, o), 'ab-b b w');
      AB_K.forEach(function (k, i) { h += btn('k' + i, lab(i === 4 ? '26+' : k[0] + '–' + k[1]) + odd('k' + i, oddTxt, o), 'ab-b k'); });
      return h;
    },
    hist: function (n) { return chipS(n % 2 ? 'A' : 'B', n % 2 ? 'aa' : 'ab'); },
    wins: function (res) { var n = +res.n, w = [n % 2 ? 'a' : 'b']; AB_K.forEach(function (k, i) { if (n >= k[0] && n <= k[1]) w.push('k' + i); }); return w; },
    init: function (c) { c.cs = cardsInit(c, '.ab-c'); c.jk = cardInit(c.q('.ab-jk')); bnInit(c); c.kk = [].slice.call(c.box.querySelectorAll('.ab-k')); c.gl = [].slice.call(c.box.querySelectorAll('.ab-glow')); },
    frame: function (c, R, t, e, res) {
      var j = res ? +res.j : (R && R.pre && R.pre.j != null ? +R.pre.j : -1);
      if (j >= 0) cardSet(c.jk, j);
      cardPose(c.jk, 49, 122, 1.15, 0, j >= 0 ? 1 : 0, 1);
      if (!res) { hideCards(c.cs); if (!bnCd(c, R, t, e)) bnSet(c, ''); txt(c.kk[0], ''); txt(c.kk[1], ''); c.gl.forEach(function (g) { sa(g, 'opacity', '0'); }); return; }
      var ks = res.k || [], n = ks.length, dealt = e < AB_0 ? 0 : Math.min(n, 1 + Math.floor((e - AB_0) / AB_D));
      var cnt = [Math.ceil(dealt / 2), Math.floor(dealt / 2)];
      txt(c.kk[0], cnt[0] ? cnt[0] + ' ' + c.l.cards : ''); txt(c.kk[1], cnt[1] ? cnt[1] + ' ' + c.l.cards : '');
      // each row shows its last 6 cards, fanned; the newest flies in from the shoe
      for (var s = 0; s < 12; s++) c.cs[s]._used = 0;
      var slot = 0;
      for (var side = 0; side < 2; side++) {
        var idx = []; for (var i = side; i < dealt; i += 2) idx.push(i);
        var vis = idx.slice(-6), y = side ? 176 : 84;
        vis.forEach(function (ci, p) {
          var cc = c.cs[slot++], a = AB_0 + ci * AB_D, x = 132 + p * 34 + (idx.length > 6 ? 0 : 0);
          deal(cc, ks[ci], e, a, .34, 49, 210, .4, x, y, .86, (p - 2.5) * 2, null);
        });
      }
      for (; slot < 12; slot++) cardPose(c.cs[slot], 0, 0, 1, 0, 0, 0);
      var end = AB_0 + n * AB_D + .2, w = e >= end, win = n % 2 ? 0 : 1, pulse = (.6 + .4 * Math.sin(t * 6)).toFixed(2);
      sa(c.gl[0], 'opacity', w && win === 0 ? pulse : '0'); sa(c.gl[1], 'opacity', w && win === 1 ? pulse : '0');
      bnSet(c, w ? (win ? c.l.bahar : c.l.andar) + ' ' + c.l.wins + ' · ' + n + ' ' + c.l.cards : '', 'n' + win);
    }
  });

  /* ======================================================= Teen Patti & Poker Showdown ======================================================= */
  // hand strength (same as casino_live4.php): category, ranks, then suits (♠ > ♥ > ♦ > ♣) — never a tie
  function hiR(c) { var r = cRank(c); return r === 1 ? 14 : r; }
  function suitsOrd(h) { return h.map(function (c) { return hiR(c) * 4 + (3 - cSuit(c)); }).sort(function (a, b) { return b - a; }).map(function (x) { return x % 4; }); }
  function tpCat(h) {
    var r = h.map(hiR).sort(function (a, b) { return b - a; }), fl = cSuit(h[0]) === cSuit(h[1]) && cSuit(h[1]) === cSuit(h[2]);
    var seq = r[0] - r[1] === 1 && r[1] - r[2] === 1; if (!seq && r[0] === 14 && r[1] === 3 && r[2] === 2) seq = true;
    return r[0] === r[2] ? 5 : seq && fl ? 4 : seq ? 3 : fl ? 2 : (r[0] === r[1] || r[1] === r[2]) ? 1 : 0;
  }
  function pkCat(h) {
    var r = h.map(hiR), cnt = {}; r.forEach(function (v) { cnt[v] = (cnt[v] || 0) + 1; });
    var sh = Object.keys(cnt).map(function (k) { return cnt[k]; }).sort(function (a, b) { return b - a; }).join('');
    var fl = h.every(function (c) { return cSuit(c) === cSuit(h[0]); }), u = Object.keys(cnt).map(Number).sort(function (a, b) { return b - a; });
    var st = u.length === 5 && (u[0] - u[4] === 4 || u.join() === '14,5,4,3,2');
    return st && fl ? 8 : sh === '41' ? 7 : sh === '32' ? 6 : fl ? 5 : st ? 4 : sh === '311' ? 3 : sh === '221' ? 2 : sh === '2111' ? 1 : 0;
  }
  function duel(key, o) {
    var M = o.m, poker = M === 5;
    var DT = .3, DI = poker ? .3 : .45, F1 = DT + 2 * M * DI + .5, F2 = F1 + (poker ? 1.9 : 1.6), END = F2 + (poker ? 1.6 : 1.4);
    live(key, {
      lab: poker ? 'sd' : 'dl', bev: 'card', SHOW: END + 1.4, odds0: o.odds0, rules: o.rules,
      beat: function (e) { var n = 0; for (var i = 0; i < 2 * M; i++) if (e >= DT + i * DI) n++; if (e >= F1) n++; if (e >= F2) n++; return n; },
      scene: function (uid, l) {
        var side = function (b) {
          var g = poker ? { x: 30, y: b ? 128 : 30, w: 300, h: 82 } : { x: b ? 190 : 14, y: 50, w: 156, h: 150 };
          var c = o.col[b];
          return '<g class="du-side s' + b + '"><rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="14" fill="' + c[0] + '" fill-opacity=".5" stroke="' + c[1] + '" stroke-opacity=".8" stroke-width="1.6"/>' +
            '<rect class="du-glow" x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="14" fill="none" stroke="#FDE68A" stroke-width="3" opacity="0"/>' +
            (poker ? '<text class="du-n" x="' + (g.x + 10) + '" y="' + (g.y + 16) + '">' + K.esc(o.name(l, b)) + '</text><text class="du-h" x="' + (g.x + g.w - 10) + '" y="' + (g.y + 16) + '" text-anchor="end"></text>'
              : '<text class="du-n" x="' + (g.x + g.w / 2) + '" y="' + (g.y + 20) + '" text-anchor="middle">' + K.esc(o.name(l, b)) + '</text><text class="du-h" x="' + (g.x + g.w / 2) + '" y="' + (g.y + g.h - 12) + '" text-anchor="middle"></text>') + '</g>';
        };
        var cards = []; for (var i = 0; i < 2 * M; i++) cards.push(cardEl('du-c', o.back));
        return '<defs>' + felt(uid, o.felt[0], o.felt[1]) + '</defs>' + table(uid, o.felt[2], o.felt[3]) + side(0) + side(1) +
          (poker ? '' : shoe(180, 25, o.back) + '<text class="du-vs" x="180" y="130" text-anchor="middle">VS</text>') +
          cards.join('') + banner(poker ? 120 : 213);
      },
      board: o.board,
      hist: o.hist,
      wins: function (res) {
        var w = [o.sel[+res.n]], A = res.ha || [], B = res.hb || [], f = poker ? pkCat : tpCat, need = poker ? 2 : 1;
        if (A.length === M && f(A) >= need) w.push(o.side[0]); if (B.length === M && f(B) >= need) w.push(o.side[1]); return w;
      },
      init: function (c) { c.cs = cardsInit(c, '.du-c'); c.hh = [].slice.call(c.box.querySelectorAll('.du-h')); c.gl = [].slice.call(c.box.querySelectorAll('.du-glow')); bnInit(c); c.vs = c.q('.du-vs'); },
      frame: function (c, R, t, e, res) {
        if (!res) { hideCards(c.cs); txt(c.hh[0], ''); txt(c.hh[1], ''); if (!bnCd(c, R, t, e)) bnSet(c, ''); c.gl.forEach(function (g) { sa(g, 'opacity', '0'); }); if (c.vs) sa(c.vs, 'opacity', '1'); return; }
        var H = [res.ha || [], res.hb || []];
        for (var i = 0; i < 2 * M; i++) {
          var b = i % 2, k = i >> 1, x, y, s, rot;
          if (poker) { x = 112 + k * 46; y = b ? 176 : 78; s = .9; rot = 0; }
          else { x = (b ? 268 : 92) + (k - 1) * 38; y = 126 + Math.abs(k - 1) * 4; s = 1.02; rot = (k - 1) * 9; }
          var f = (b ? F2 : F1) + k * (poker ? .22 : .25);
          deal(c.cs[i], H[b][k], e, DT + i * DI, .4, poker ? 344 : 180, poker ? 120 : 25, .45, x, y, s, rot, f);
        }
        var cat = poker ? pkCat : tpCat, names = poker ? c.l.pk : c.l.tp;
        txt(c.hh[0], e >= F1 + M * .25 + .3 && H[0].length === M ? names[cat(H[0])] : '', poker ? 160 : 140);
        txt(c.hh[1], e >= F2 + M * .25 + .3 && H[1].length === M ? names[cat(H[1])] : '', poker ? 160 : 140);
        var n = +res.n, w = e >= END, pulse = (.6 + .4 * Math.sin(t * 6)).toFixed(2);
        sa(c.gl[0], 'opacity', w && n === 0 ? pulse : '0'); sa(c.gl[1], 'opacity', w && n === 1 ? pulse : '0');
        if (c.vs) sa(c.vs, 'opacity', w ? '.2' : '1');
        bnSet(c, w ? o.name(c.l, n) + ' ' + c.l.wins : '', 'n' + n);
      }
    });
  }
  duel('teenpattilive', {
    m: 3, col: [['#4C1D95', '#C084FC'], ['#134E4A', '#2DD4BF']], felt: ['#5B21B6', '#1E0B3A', '#0F0420', '#CA8A04'], back: ['#4C1D95', '#7C3AED'],
    name: function (l, b) { return b ? l.plb : l.pla; }, sel: ['a', 'b'], side: ['pa', 'pb'],
    odds0: { a: 1.88, pa: 3.67, pb: 3.67, b: 1.88 },
    board: function (uid, l, oddTxt, o) {
      return btn('a', lab(l.pla) + odd('a', oddTxt, o), 'du-b a') + btn('pa', lab(l.pplus) + '<i>A</i>' + odd('pa', oddTxt, o), 'du-b pa') +
        btn('pb', lab(l.pplus) + '<i>B</i>' + odd('pb', oddTxt, o), 'du-b pb') + btn('b', lab(l.plb) + odd('b', oddTxt, o), 'du-b b');
    },
    hist: function (n) { return chipS(n ? 'B' : 'A', 'tp' + n); },
    rules: rules(145, { a: 1.88, b: 1.88, pa: 3.67 }, {
      en: ['Bet on Player A or Player B ({a} each), or on Pair Plus A / Pair Plus B ({pa}: that player gets a Pair or better).', 'Three cards each from one 52-card deck. Teen Patti ranking: Trail (three of a kind) > Pure sequence > Sequence > Color > Pair > High card (A-K-Q is the top sequence, A-2-3 the lowest). Equal hands: the highest card’s suit decides (♠ > ♥ > ♦ > ♣), so there is never a tie.'],
      fr: ['Parie sur le Joueur A ou le Joueur B ({a} chacun), ou sur Paire Plus A / Paire Plus B ({pa} : ce joueur a une Paire ou mieux).', 'Trois cartes chacun d’un même jeu de 52. Ordre du Teen Patti : Brelan > Suite couleur > Suite > Couleur > Paire > Carte haute (A-R-D est la plus haute suite, A-2-3 la plus basse). Mains égales : la couleur de la plus haute carte décide (♠ > ♥ > ♦ > ♣), il n’y a donc jamais d’égalité.'],
      es: ['Apuesta al Jugador A o al Jugador B ({a} cada uno), o a Pareja Plus A / Pareja Plus B ({pa}: ese jugador tiene Pareja o más).', 'Tres cartas cada uno de una baraja de 52. Orden del Teen Patti: Trío > Escalera de color > Escalera > Color > Pareja > Carta alta (A-K-Q es la escalera más alta, A-2-3 la más baja). Manos iguales: decide el palo de la carta más alta (♠ > ♥ > ♦ > ♣), así nunca hay empate.'],
      pt: ['Aposte no Jogador A ou no Jogador B ({a} cada), ou em Par Plus A / Par Plus B ({pa}: esse jogador tem Par ou melhor).', 'Três cartas cada de um baralho de 52. Ordem do Teen Patti: Trinca > Sequência pura > Sequência > Cor > Par > Carta alta (A-K-Q é a maior sequência, A-2-3 a menor). Mãos iguais: decide o naipe da carta mais alta (♠ > ♥ > ♦ > ♣), então nunca há empate.'],
      ar: ['راهن على اللاعب A أو اللاعب B ‏({a} لكل منهما)، أو على زوج بلس A / زوج بلس B ‏({pa}: يحصل ذلك اللاعب على زوج أو أفضل).', 'ثلاث أوراق لكل لاعب من مجموعة واحدة من 52 ورقة. ترتيب تين باتي: ثلاثية > تسلسل نقي > تسلسل > لون > زوج > ورقة عالية (A-K-Q أعلى تسلسل وA-2-3 أدناه). عند تساوي اليدين يحسم شكل أعلى ورقة (♠ > ♥ > ♦ > ♣)، فلا تعادل أبدًا.'],
      tr: ['Oyuncu A veya Oyuncu B’ye (her biri {a}) ya da Per Plus A / Per Plus B’ye ({pa}: o oyuncu Per veya daha iyisini alır) oyna.', 'Tek bir 52’lik desteden herkese üç kart. Teen Patti sırası: Üçlü > Renkli sıralı > Sıralı > Renk > Per > Yüksek kart (A-K-Q en yüksek, A-2-3 en düşük sıralı). Eşit ellerde en yüksek kartın rengi karar verir (♠ > ♥ > ♦ > ♣), yani beraberlik olmaz.'],
      vi: ['Cược Người A hoặc Người B (mỗi cửa {a}), hoặc Đôi Plus A / Đôi Plus B ({pa}: người đó có Đôi trở lên).', 'Mỗi người ba lá từ một bộ 52 lá. Thứ tự Teen Patti: Sám > Sảnh đồng chất > Sảnh > Đồng chất > Đôi > Mậu thầu (A-K-Q là sảnh cao nhất, A-2-3 thấp nhất). Bài bằng nhau: chất của lá cao nhất quyết định (♠ > ♥ > ♦ > ♣), nên không bao giờ hòa.'],
      id: ['Pasang Pemain A atau Pemain B (masing-masing {a}), atau Pair Plus A / Pair Plus B ({pa}: pemain itu mendapat Pair atau lebih baik).', 'Masing-masing tiga kartu dari satu dek 52 kartu. Urutan Teen Patti: Trail > Urutan murni > Urutan > Warna > Pair > Kartu tinggi (A-K-Q urutan tertinggi, A-2-3 terendah). Tangan sama: jenis kartu tertinggi menentukan (♠ > ♥ > ♦ > ♣), jadi tidak pernah seri.'],
      ru: ['Ставьте на Игрока A или Игрока B (по {a}) либо на Пару плюс A / Пару плюс B ({pa}: у этого игрока пара или лучше).', 'По три карты из одной колоды в 52 карты. Старшинство Тин Патти: Тройка > Чистый стрит > Стрит > Масть > Пара > Старшая карта (A-K-Q — старший стрит, A-2-3 — младший). При равных руках решает масть старшей карты (♠ > ♥ > ♦ > ♣), поэтому ничьей не бывает.'],
      de: ['Setze auf Spieler A oder Spieler B (je {a}) oder auf Paar Plus A / Paar Plus B ({pa}: dieser Spieler hat ein Paar oder besser).', 'Je drei Karten aus einem 52er-Deck. Teen-Patti-Rangfolge: Drilling > Reine Straße > Straße > Farbe > Paar > Höchste Karte (A-K-D ist die höchste Straße, A-2-3 die niedrigste). Gleiche Hände: die Farbe der höchsten Karte entscheidet (♠ > ♥ > ♦ > ♣), es gibt also nie Gleichstand.'],
      hi: ['प्लेयर A या प्लेयर B (हर एक {a}), या पेयर प्लस A / पेयर प्लस B ({pa}: उस खिलाड़ी को पेयर या बेहतर) पर दांव लगाएं।', '52 पत्तों की एक गड्डी से दोनों को तीन-तीन पत्ते। तीन पत्ती क्रम: ट्रेल > प्योर सीक्वेंस > सीक्वेंस > कलर > पेयर > हाई कार्ड (A-K-Q सबसे ऊँचा, A-2-3 सबसे नीचा सीक्वेंस)। बराबर हाथ: सबसे बड़े पत्ते का रंग तय करता है (♠ > ♥ > ♦ > ♣), इसलिए कभी टाई नहीं।'],
      zh: ['押玩家 A 或玩家 B（各 {a}），或押对子加注 A / B（{pa}：该玩家拿到对子或更好）。', '从同一副 52 张牌各发三张。炸金花大小：豹子 > 同花顺 > 顺子 > 金花 > 对子 > 散牌（A-K-Q 最大顺子，A-2-3 最小）。牌型相同时比最大一张牌的花色（♠ > ♥ > ♦ > ♣），所以永远不会平局。']
    })
  });
  duel('pokerlive', {
    m: 5, col: [['#7F1D1D', '#F87171'], ['#1E3A8A', '#60A5FA']], felt: ['#065F46', '#022C22', '#011A12', '#CA8A04'], back: ['#7F1D1D', '#B91C1C'],
    name: function (l, b) { return b ? l.blue : l.red; }, sel: ['r', 'b'], side: ['r2', 'b2'],
    odds0: { r: 1.88, r2: 12.32, b2: 12.32, b: 1.88 },
    board: function (uid, l, oddTxt, o) {
      return btn('r', lab(l.red) + odd('r', oddTxt, o), 'du-b r') + btn('r2', lab(l.twop) + '<i class="dot r"></i>' + odd('r2', oddTxt, o), 'du-b r2') +
        btn('b2', lab(l.twop) + '<i class="dot b"></i>' + odd('b2', oddTxt, o), 'du-b b2') + btn('b', lab(l.blue) + odd('b', oddTxt, o), 'du-b b');
    },
    hist: function (n) { return '<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="10" fill="' + (n ? '#2563EB' : '#DC2626') + '" stroke="#fff" stroke-opacity=".6"/><path d="M0-5.5C2-3 4.6-1 4.6 1.4C4.6 3.4 2.6 4.4 1 3.2L1.6 5.4H-1.6L-1 3.2C-2.6 4.4-4.6 3.4-4.6 1.4C-4.6-1-2-3 0-5.5Z" fill="#fff"/></svg>'; },
    rules: rules(150, { r: 1.88, r2: 12.32 }, {
      en: ['Bet on the Red hand or the Blue hand ({r} each), or on Red 2 Pair+ / Blue 2 Pair+ ({r2}: that hand is Two pair or better).', 'Five cards each from one 52-card deck, classic poker ranking: Straight flush > Four of a kind > Full house > Flush > Straight > Three of a kind > Two pair > Pair > High card. Equal hands: the highest card’s suit decides (♠ > ♥ > ♦ > ♣), so there is never a tie.'],
      fr: ['Parie sur la main Rouge ou la main Bleue ({r} chacune), ou sur Rouge 2 Paires+ / Bleu 2 Paires+ ({r2} : cette main a une Double paire ou mieux).', 'Cinq cartes chacun d’un même jeu de 52, ordre classique du poker : Quinte flush > Carré > Full > Couleur > Quinte > Brelan > Double paire > Paire > Carte haute. Mains égales : la couleur de la plus haute carte décide (♠ > ♥ > ♦ > ♣), il n’y a donc jamais d’égalité.'],
      es: ['Apuesta a la mano Roja o a la Azul ({r} cada una), o a Rojo 2 Parejas+ / Azul 2 Parejas+ ({r2}: esa mano tiene Doble pareja o más).', 'Cinco cartas cada una de una baraja de 52, orden clásico del póker: Escalera de color > Póker > Full > Color > Escalera > Trío > Doble pareja > Pareja > Carta alta. Manos iguales: decide el palo de la carta más alta (♠ > ♥ > ♦ > ♣), así nunca hay empate.'],
      pt: ['Aposte na mão Vermelha ou na Azul ({r} cada), ou em Vermelho 2 Pares+ / Azul 2 Pares+ ({r2}: essa mão tem Dois pares ou melhor).', 'Cinco cartas cada de um baralho de 52, ordem clássica do pôquer: Straight flush > Quadra > Full house > Flush > Sequência > Trinca > Dois pares > Par > Carta alta. Mãos iguais: decide o naipe da carta mais alta (♠ > ♥ > ♦ > ♣), então nunca há empate.'],
      ar: ['راهن على اليد الحمراء أو الزرقاء ({r} لكل منهما)، أو على أحمر زوجان+ / أزرق زوجان+ ({r2}: تلك اليد زوجان أو أفضل).', 'خمس أوراق لكل يد من مجموعة واحدة من 52 ورقة، بترتيب البوكر الكلاسيكي: ستريت فلاش > أربعة متشابهة > فل هاوس > فلاش > متتالية > ثلاثة متشابهة > زوجان > زوج > ورقة عالية. عند تساوي اليدين يحسم شكل أعلى ورقة (♠ > ♥ > ♦ > ♣)، فلا تعادل أبدًا.'],
      tr: ['Kırmızı ele veya Mavi ele (her biri {r}) ya da Kırmızı 2 Per+ / Mavi 2 Per+’ya ({r2}: o el Döper veya daha iyisi) oyna.', 'Tek bir 52’lik desteden her ele beş kart, klasik poker sırası: Sıralı floş > Kare > Ful > Floş > Kent > Üçlü > Döper > Per > Yüksek kart. Eşit ellerde en yüksek kartın rengi karar verir (♠ > ♥ > ♦ > ♣), yani beraberlik olmaz.'],
      vi: ['Cược tay Đỏ hoặc tay Xanh (mỗi cửa {r}), hoặc Đỏ Thú+ / Xanh Thú+ ({r2}: tay đó có Thú trở lên).', 'Mỗi tay năm lá từ một bộ 52 lá, thứ tự poker cổ điển: Thùng phá sảnh > Tứ quý > Cù lũ > Thùng > Sảnh > Sám > Thú > Đôi > Mậu thầu. Bài bằng nhau: chất của lá cao nhất quyết định (♠ > ♥ > ♦ > ♣), nên không bao giờ hòa.'],
      id: ['Pasang tangan Merah atau Biru (masing-masing {r}), atau Merah 2 Pair+ / Biru 2 Pair+ ({r2}: tangan itu Two pair atau lebih baik).', 'Masing-masing lima kartu dari satu dek 52, urutan poker klasik: Straight flush > Four of a kind > Full house > Flush > Straight > Three of a kind > Two pair > One pair > Kartu tinggi. Tangan sama: jenis kartu tertinggi menentukan (♠ > ♥ > ♦ > ♣), jadi tidak pernah seri.'],
      ru: ['Ставьте на Красную или Синюю руку (по {r}) либо на Красные 2 пары+ / Синие 2 пары+ ({r2}: у этой руки две пары или лучше).', 'По пять карт из одной колоды в 52 карты, классическое старшинство покера: Стрит-флеш > Каре > Фулл-хаус > Флеш > Стрит > Сет > Две пары > Пара > Старшая карта. При равных руках решает масть старшей карты (♠ > ♥ > ♦ > ♣), поэтому ничьей не бывает.'],
      de: ['Setze auf die rote oder die blaue Hand (je {r}) oder auf Rot 2 Paare+ / Blau 2 Paare+ ({r2}: diese Hand hat Zwei Paare oder besser).', 'Je fünf Karten aus einem 52er-Deck, klassische Poker-Rangfolge: Straight Flush > Vierling > Full House > Flush > Straße > Drilling > Zwei Paare > Paar > Höchste Karte. Gleiche Hände: die Farbe der höchsten Karte entscheidet (♠ > ♥ > ♦ > ♣), es gibt also nie Gleichstand.'],
      hi: ['लाल हाथ या नीले हाथ (हर एक {r}), या लाल 2 पेयर+ / नीला 2 पेयर+ ({r2}: उस हाथ में टू पेयर या बेहतर) पर दांव लगाएं।', '52 पत्तों की एक गड्डी से दोनों हाथों को पाँच-पाँच पत्ते, क्लासिक पोकर क्रम: स्ट्रेट फ्लश > फोर ऑफ़ अ काइंड > फुल हाउस > फ्लश > स्ट्रेट > थ्री ऑफ़ अ काइंड > टू पेयर > पेयर > हाई कार्ड। बराबर हाथ: सबसे बड़े पत्ते का रंग तय करता है (♠ > ♥ > ♦ > ♣), इसलिए कभी टाई नहीं।'],
      zh: ['押红方或蓝方（各 {r}），或押红方两对+ / 蓝方两对+（{r2}：该手牌为两对或更好）。', '从同一副 52 张牌各发五张，经典扑克大小：同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌。牌型相同时比最大一张牌的花色（♠ > ♥ > ♦ > ♣），所以永远不会平局。']
    })
  });

  /* ============================================================== Red or Black ============================================================== */
  var RB_F = 2.4, RB_D = .8;
  live('redblacklive', {
    lab: 'dl', bev: 'card', SHOW: RB_F + 5 * RB_D + 1.6,
    odds0: { r: 1.88, k: 1.88, s5: 18.56, s4: 3.14, s3: 1.44 },
    beat: function (e) { var n = 0; for (var i = 0; i < 5; i++) { if (e >= .3 + i * .35) n++; if (e >= RB_F + i * RB_D) n++; } return n; },
    rules: rules(140, { r: 1.88, s5: 18.56, s4: 3.14, s3: 1.44 }, {
      en: ['Five cards are dealt from a 52-card deck (26 red, 26 black). Bet on the colour of the majority: Red or Black ({r} each); or on the split: 5–0 ({s5}), 4–1 ({s4}) or 3–2 ({s3}), whatever the colour.', 'The five cards are turned over one by one. With five cards there is always a majority, so Red or Black always wins.'],
      fr: ['Cinq cartes sont tirées d’un jeu de 52 (26 rouges, 26 noires). Parie sur la couleur majoritaire : Rouge ou Noir ({r} chacun) ; ou sur la répartition : 5–0 ({s5}), 4–1 ({s4}) ou 3–2 ({s3}), quelle que soit la couleur.', 'Les cinq cartes sont retournées une à une. Avec cinq cartes il y a toujours une majorité : Rouge ou Noir gagne toujours.'],
      es: ['Se reparten cinco cartas de una baraja de 52 (26 rojas, 26 negras). Apuesta al color de la mayoría: Rojo o Negro ({r} cada uno); o al reparto: 5–0 ({s5}), 4–1 ({s4}) o 3–2 ({s3}), sea cual sea el color.', 'Las cinco cartas se giran una a una. Con cinco cartas siempre hay mayoría: Rojo o Negro siempre gana.'],
      pt: ['Cinco cartas saem de um baralho de 52 (26 vermelhas, 26 pretas). Aposte na cor da maioria: Vermelho ou Preto ({r} cada); ou na divisão: 5–0 ({s5}), 4–1 ({s4}) ou 3–2 ({s3}), seja qual for a cor.', 'As cinco cartas são viradas uma a uma. Com cinco cartas sempre há maioria: Vermelho ou Preto sempre ganha.'],
      ar: ['تُسحب خمس أوراق من مجموعة 52 ورقة (26 حمراء و26 سوداء). راهن على لون الأغلبية: أحمر أو أسود ({r} لكل منهما)؛ أو على التوزيع: 5–0 ({s5}) أو 4–1 ({s4}) أو 3–2 ({s3}) أيًا كان اللون.', 'تُقلب الأوراق الخمس واحدة تلو الأخرى. مع خمس أوراق توجد أغلبية دائمًا، فإما الأحمر أو الأسود يفوز.'],
      tr: ['52’lik desteden (26 kırmızı, 26 siyah) beş kart açılır. Çoğunluğun rengine oyna: Kırmızı veya Siyah (her biri {r}); ya da dağılıma: 5–0 ({s5}), 4–1 ({s4}) veya 3–2 ({s3}), renk fark etmez.', 'Beş kart tek tek çevrilir. Beş kartta her zaman bir çoğunluk vardır: Kırmızı ya da Siyah mutlaka kazanır.'],
      vi: ['Chia năm lá từ bộ 52 lá (26 đỏ, 26 đen). Cược màu chiếm đa số: Đỏ hoặc Đen (mỗi cửa {r}); hoặc tỉ lệ: 5–0 ({s5}), 4–1 ({s4}) hay 3–2 ({s3}), màu nào cũng được.', 'Năm lá được lật lần lượt. Với năm lá luôn có màu đa số, nên Đỏ hoặc Đen luôn thắng.'],
      id: ['Lima kartu dibagikan dari dek 52 (26 merah, 26 hitam). Pasang warna mayoritas: Merah atau Hitam (masing-masing {r}); atau pembagian: 5–0 ({s5}), 4–1 ({s4}) atau 3–2 ({s3}), apa pun warnanya.', 'Kelima kartu dibuka satu per satu. Dengan lima kartu selalu ada mayoritas, jadi Merah atau Hitam selalu menang.'],
      ru: ['Из колоды в 52 карты (26 красных, 26 чёрных) сдаются пять карт. Ставьте на цвет большинства: Красные или Чёрные (по {r}); или на расклад: 5–0 ({s5}), 4–1 ({s4}) или 3–2 ({s3}), любого цвета.', 'Пять карт открываются по одной. Из пяти карт всегда есть большинство, поэтому Красные или Чёрные всегда выигрывают.'],
      de: ['Fünf Karten kommen aus einem 52er-Deck (26 rote, 26 schwarze). Setze auf die Farbe der Mehrheit: Rot oder Schwarz (je {r}); oder auf die Verteilung: 5–0 ({s5}), 4–1 ({s4}) oder 3–2 ({s3}), egal welche Farbe.', 'Die fünf Karten werden nacheinander aufgedeckt. Bei fünf Karten gibt es immer eine Mehrheit: Rot oder Schwarz gewinnt immer.'],
      hi: ['52 पत्तों की गड्डी (26 लाल, 26 काले) से पाँच पत्ते निकलते हैं। बहुमत वाले रंग पर दांव लगाएं: लाल या काला (हर एक {r}); या बँटवारे पर: 5–0 ({s5}), 4–1 ({s4}) या 3–2 ({s3}), रंग कोई भी हो।', 'पाँचों पत्ते एक-एक कर खुलते हैं। पाँच पत्तों में हमेशा बहुमत होता है, इसलिए लाल या काला ज़रूर जीतता है।'],
      zh: ['从 52 张牌（26 红、26 黑）中发五张。押多数的颜色：红或黑（各 {r}）；或押分布：5–0（{s5}）、4–1（{s4}）或 3–2（{s3}），不论颜色。', '五张牌逐一翻开。五张牌总有一种颜色占多数，所以红或黑必有一方胜。']
    }),
    scene: function (uid) {
      var slots = ''; for (var i = 0; i < 5; i++) slots += '<rect x="' + (72 + i * 54 - 23) + '" y="66" width="46" height="66" rx="6" class="rb-slot"/>';
      var cards = ''; for (var k = 0; k < 5; k++) cards += cardEl('rb-c', ['#111827', '#7F1D1D']);
      return '<defs>' + felt(uid, '#3F0A12', '#0A0204') + '</defs>' + table(uid, '#050102', '#B91C1C') + slots +
        '<g transform="translate(110 180)"><circle r="22" class="rb-cr"/><text class="rb-cn r" y="8" text-anchor="middle"></text></g>' +
        '<g transform="translate(250 180)"><circle r="22" class="rb-ck"/><text class="rb-cn k" y="8" text-anchor="middle"></text></g>' +
        '<g transform="translate(180 180)"><path class="rb-hp" d="' + SUIT[1] + '" transform="translate(-10 0) scale(1.3)"/><path class="rb-sp" d="' + SUIT[0] + '" transform="translate(10 0) scale(1.3)"/></g>' +
        shoe(318, 24, ['#111827', '#7F1D1D']) + cards + banner(26);
    },
    board: function (uid, l, oddTxt, o) {
      return btn('r', '<svg viewBox="-8 -8 16 16"><path d="' + SUIT[1] + '" fill="#EF4444"/></svg>' + lab(l.red) + odd('r', oddTxt, o), 'rb-b r') +
        btn('k', '<svg viewBox="-8 -8 16 16"><path d="' + SUIT[0] + '" fill="#E5E7EB"/></svg>' + lab(l.black) + odd('k', oddTxt, o), 'rb-b k') +
        btn('s5', lab('5–0') + odd('s5', oddTxt, o), 'rb-b s') + btn('s4', lab('4–1') + odd('s4', oddTxt, o), 'rb-b s') + btn('s3', lab('3–2') + odd('s3', oddTxt, o), 'rb-b s');
    },
    hist: function (n) { return chipS(n >= 3 ? n + '–' + (5 - n) : (5 - n) + '–' + n, n >= 3 ? 'rbr' : 'rbk'); },
    wins: function (res) { var n = +res.n; return [n >= 3 ? 'r' : 'k', n === 0 || n === 5 ? 's5' : n === 1 || n === 4 ? 's4' : 's3']; },
    init: function (c) { c.cs = cardsInit(c, '.rb-c'); c.cn = [c.q('.rb-cn.r'), c.q('.rb-cn.k')]; bnInit(c); },
    frame: function (c, R, t, e, res) {
      if (!res) { hideCards(c.cs); txt(c.cn[0], '0'); txt(c.cn[1], '0'); if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var ks = res.k || [], nr = 0, nk = 0;
      for (var i = 0; i < 5; i++) {
        var f = RB_F + i * RB_D; deal(c.cs[i], ks[i], e, .3 + i * .35, .45, 318, 24, .45, 72 + i * 54, 99, 1, 0, f);
        if (e >= f + .3) { if (cRed(ks[i])) nr++; else nk++; }
      }
      txt(c.cn[0], String(nr)); txt(c.cn[1], String(nk));
      var n = +res.n, w = e >= RB_F + 5 * RB_D + .3;
      bnSet(c, w ? (n >= 3 ? c.l.red + ' ' + n + '–' + (5 - n) : c.l.black + ' ' + (5 - n) + '–' + n) : '', 'n0');
    }
  });

  /* ================================================================ Lucky 7 ================================================================ */
  live('lucky7live', {
    lab: 'l7', bev: 'card', SHOW: 5.2,
    odds0: { lo: 2.03, s7: 12.22, hi: 2.03, red: 1.88, blk: 1.88, pic: 4.07 },
    beat: function (e) { return (e >= .3) + (e >= 1.6) + (e >= 3.4); },
    rules: rules(140, { lo: 2.03, s7: 12.22, red: 1.88, pic: 4.07 }, {
      en: ['One card is drawn from a full 52-card deck. Bet on A–6 ({lo}), Lucky 7 ({s7}), 8–K ({lo}), Red or Black ({red}), or a picture J Q K ({pic}).', 'The card is turned over: Ace is the lowest (1), King the highest (13). A 7 makes A–6 and 8–K lose.'],
      fr: ['Une carte est tirée d’un jeu complet de 52. Parie sur A–6 ({lo}), Lucky 7 ({s7}), 8–R ({lo}), Rouge ou Noir ({red}), ou une figure V D R ({pic}).', 'La carte est retournée : l’As est la plus basse (1), le Roi la plus haute (13). Un 7 fait perdre A–6 et 8–R.'],
      es: ['Se saca una carta de una baraja completa de 52. Apuesta a A–6 ({lo}), Lucky 7 ({s7}), 8–K ({lo}), Rojo o Negro ({red}), o una figura J Q K ({pic}).', 'La carta se gira: el As es la más baja (1), el Rey la más alta (13). Un 7 hace perder A–6 y 8–K.'],
      pt: ['Uma carta sai de um baralho completo de 52. Aposte em A–6 ({lo}), Lucky 7 ({s7}), 8–K ({lo}), Vermelho ou Preto ({red}), ou uma figura J Q K ({pic}).', 'A carta é virada: o Ás é a mais baixa (1), o Rei a mais alta (13). Um 7 faz A–6 e 8–K perderem.'],
      ar: ['تُسحب ورقة واحدة من مجموعة كاملة من 52 ورقة. راهن على A–6 ‏({lo}) أو Lucky 7 ‏({s7}) أو 8–K ‏({lo}) أو أحمر أو أسود ({red}) أو صورة J Q K ‏({pic}).', 'تُقلب الورقة: الآس أدناها (1) والملك أعلاها (13). الرقم 7 يجعل A–6 و8–K تخسر.'],
      tr: ['52’lik tam desteden bir kart çekilir. A–6 ({lo}), Şanslı 7 ({s7}), 8–K ({lo}), Kırmızı veya Siyah ({red}) ya da J Q K resimli kart ({pic}) oyna.', 'Kart çevrilir: As en düşük (1), Papaz en yüksek (13). 7 gelirse A–6 ve 8–K kaybeder.'],
      vi: ['Rút một lá từ bộ 52 lá đầy đủ. Cược A–6 ({lo}), Lucky 7 ({s7}), 8–K ({lo}), Đỏ hoặc Đen ({red}), hoặc lá hình J Q K ({pic}).', 'Lá bài được lật: A thấp nhất (1), K cao nhất (13). Ra 7 thì A–6 và 8–K thua.'],
      id: ['Satu kartu ditarik dari dek 52 lengkap. Pasang A–6 ({lo}), Lucky 7 ({s7}), 8–K ({lo}), Merah atau Hitam ({red}), atau kartu gambar J Q K ({pic}).', 'Kartu dibuka: As terendah (1), King tertinggi (13). Angka 7 membuat A–6 dan 8–K kalah.'],
      ru: ['Из полной колоды в 52 карты вытягивается одна карта. Ставьте на A–6 ({lo}), Счастливую 7 ({s7}), 8–K ({lo}), Красное или Чёрное ({red}) или картинку J Q K ({pic}).', 'Карта открывается: туз — младшая (1), король — старшая (13). При семёрке A–6 и 8–K проигрывают.'],
      de: ['Eine Karte wird aus einem vollen 52er-Deck gezogen. Setze auf A–6 ({lo}), Glücks-7 ({s7}), 8–K ({lo}), Rot oder Schwarz ({red}) oder ein Bild B D K ({pic}).', 'Die Karte wird aufgedeckt: Ass ist die niedrigste (1), König die höchste (13). Eine 7 lässt A–6 und 8–K verlieren.'],
      hi: ['52 पत्तों की पूरी गड्डी से एक पत्ता निकलता है। A–6 ({lo}), लकी 7 ({s7}), 8–K ({lo}), लाल या काला ({red}), या तस्वीर J Q K ({pic}) पर दांव लगाएं।', 'पत्ता खुलता है: इक्का सबसे छोटा (1), बादशाह सबसे बड़ा (13)। 7 आने पर A–6 और 8–K हारते हैं।'],
      zh: ['从一副完整的 52 张牌中抽一张。押 A–6（{lo}）、幸运 7（{s7}）、8–K（{lo}）、红或黑（{red}），或人头牌 J Q K（{pic}）。', '翻开该牌：A 最小（1），K 最大（13）。开出 7 时 A–6 和 8–K 皆输。']
    }),
    scene: function (uid) {
      var zone = function (x, w, cl, t) { return '<g class="l7-z ' + cl + '"><rect x="' + x + '" y="182" width="' + w + '" height="30" rx="10"/><text x="' + (x + w / 2) + '" y="202" text-anchor="middle">' + t + '</text></g>'; };
      return '<defs>' + felt(uid, '#1E3A8A', '#0A0F2C') + '<radialGradient id="l7g' + uid + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FDE68A" stop-opacity=".55"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient></defs>' +
        table(uid, '#05081A', '#CA8A04') + '<text class="l7-bg" x="180" y="166" text-anchor="middle">7</text>' +
        '<circle class="l7-glow" cx="180" cy="98" r="78" fill="url(#l7g' + uid + ')" opacity="0"/>' +
        zone(30, 120, 'lo', 'A – 6') + zone(156, 48, 's7', '7') + zone(210, 120, 'hi', '8 – K') + '<path class="l7-ptr" d="M0 0L-7-10H7Z" opacity="0"/>' +
        shoe(318, 24, ['#1E3A8A', '#B45309']) + cardEl('l7-c', ['#1E3A8A', '#B45309']) + banner(26);
    },
    board: function (uid, l, oddTxt, o) {
      return btn('lo', lab('A–6') + odd('lo', oddTxt, o), 'l7-b lo') + btn('s7', lab('7') + odd('s7', oddTxt, o), 'l7-b s7') + btn('hi', lab('8–K') + odd('hi', oddTxt, o), 'l7-b hi') +
        btn('red', '<svg viewBox="-8 -8 16 16"><path d="' + SUIT[1] + '" fill="#EF4444"/></svg>' + odd('red', oddTxt, o), 'l7-b red') +
        btn('blk', '<svg viewBox="-8 -8 16 16"><path d="' + SUIT[0] + '" fill="#E5E7EB"/></svg>' + odd('blk', oddTxt, o), 'l7-b blk') + btn('pic', lab('J Q K') + odd('pic', oddTxt, o), 'l7-b pic');
    },
    hist: function (n) { return chipS(rankTxt(n), n === 7 ? 'l7s' : n < 7 ? 'l7l' : 'l7h'); },
    wins: function (res) { var c = +res.k, r = cRank(c), w = [r < 7 ? 'lo' : r === 7 ? 's7' : 'hi', cRed(c) ? 'red' : 'blk']; if (r >= 11) w.push('pic'); return w; },
    init: function (c) { c.c = cardInit(c.q('.l7-c')); c.gl = c.q('.l7-glow'); c.ptr = c.q('.l7-ptr'); c.z = [].slice.call(c.box.querySelectorAll('.l7-z')); bnInit(c); },
    frame: function (c, R, t, e, res) {
      if (!res) { cardPose(c.c, 0, 0, 1, 0, 0, 0); sa(c.gl, 'opacity', '0'); sa(c.ptr, 'opacity', '0'); c.z.forEach(function (z) { cls(z, z.getAttribute('class').replace(' on', '')); }); if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var code = +res.k, r = cRank(code), k = eio(seg(e, .3, 1.2));
      cardSet(c.c, code);
      var wob = e > 1.2 && e < 1.6 ? Math.sin(e * 40) * 2 : 0;
      cardPose(c.c, lerp(318, 180, k), lerp(24, 98, k), lerp(.45, 1.75, k), lerp(-25, 0, k) + wob, seg(e, 1.6, 2.8), 1);
      sa(c.gl, 'opacity', e >= 2.8 ? (.5 + .5 * Math.sin(t * 5)).toFixed(2) : '0');
      var zi = r < 7 ? 0 : r === 7 ? 1 : 2, on = e >= 3.4, px = [90, 180, 270][zi];
      c.z.forEach(function (z, i) { var b = z.getAttribute('class').replace(' on', ''); cls(z, b + (on && i === zi ? ' on' : '')); });
      sa(c.ptr, 'opacity', on ? '1' : '0'); sa(c.ptr, 'transform', 'translate(' + px + ' ' + (180 - Math.abs(Math.sin(t * 4)) * 3).toFixed(1) + ')');
      bnSet(c, on ? rankTxt(r) + ' ' + (cRed(code) ? c.l.red : c.l.black) : '', 'n0');
    }
  });

  /* ================================================================ Dice Duel ================================================================ */
  var PIPS = { 1: [[0, 0]], 2: [[-7, -7], [7, 7]], 3: [[-7, -7], [0, 0], [7, 7]], 4: [[-7, -7], [7, -7], [-7, 7], [7, 7]], 5: [[-7, -7], [7, -7], [0, 0], [-7, 7], [7, 7]], 6: [[-7, -7], [7, -7], [-7, 0], [7, 0], [-7, 7], [7, 7]] };
  function pipsSvg(v, col) { return (PIPS[v] || []).map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.9" fill="' + col + '"/>'; }).join(''); }
  var DD_X = [62, 114, 246, 298];
  live('diceduellive', {
    lab: 'dr', bev: 'roll', SHOW: 5.2,
    odds0: { r: 2.11, x: 8.34, b: 2.11, dd: 3.07, d2: 33.84 },
    beat: function (e) { return e < 2.4 ? Math.floor(e / .3) : 20 + (e >= 3.2); },
    rules: rules(140, { r: 2.11, x: 8.34, dd: 3.07, d2: 33.84 }, {
      en: ['Red and Blue each roll two dice. Bet on Red or Blue ({r} each, the higher total wins) or on a Tie ({x}); side bets: Double ({dd}, at least one side rolls a pair) or 2 Doubles ({d2}, both sides roll a pair).', 'All four dice are fair. On a Tie, Red and Blue bets lose.'],
      fr: ['Rouge et Bleu lancent chacun deux dés. Parie sur Rouge ou Bleu ({r} chacun, le plus grand total gagne) ou sur l’Égalité ({x}) ; paris annexes : Double ({dd}, au moins un côté fait un double) ou 2 Doubles ({d2}, les deux côtés font un double).', 'Les quatre dés sont équilibrés. En cas d’Égalité, Rouge et Bleu perdent.'],
      es: ['Rojo y Azul tiran dos dados cada uno. Apuesta a Rojo o Azul ({r} cada uno, gana el total mayor) o al Empate ({x}); extras: Doble ({dd}, al menos un lado saca dobles) o 2 Dobles ({d2}, ambos lados sacan dobles).', 'Los cuatro dados son justos. Si hay Empate, Rojo y Azul pierden.'],
      pt: ['Vermelho e Azul lançam dois dados cada. Aposte em Vermelho ou Azul ({r} cada, vence o maior total) ou no Empate ({x}); extras: Duplo ({dd}, pelo menos um lado tira dupla) ou 2 Duplos ({d2}, os dois lados tiram dupla).', 'Os quatro dados são honestos. Em caso de Empate, Vermelho e Azul perdem.'],
      ar: ['يرمي الأحمر والأزرق حجري نرد لكل منهما. راهن على الأحمر أو الأزرق ({r} لكل منهما، المجموع الأعلى يفوز) أو على التعادل ({x})؛ رهانات جانبية: دبل ({dd}، جانب واحد على الأقل يرمي رقمين متطابقين) أو دبلان ({d2}، الجانبان معًا).', 'أحجار النرد الأربعة عادلة. عند التعادل يخسر رهانا الأحمر والأزرق.'],
      tr: ['Kırmızı ve Mavi ikişer zar atar. Kırmızı veya Mavi’ye (her biri {r}, yüksek toplam kazanır) ya da Beraberliğe ({x}) oyna; yan bahisler: Çift ({dd}, en az bir taraf çift atar) veya 2 Çift ({d2}, iki taraf da çift atar).', 'Dört zar da adildir. Beraberlikte Kırmızı ve Mavi kaybeder.'],
      vi: ['Đỏ và Xanh mỗi bên gieo hai xúc xắc. Cược Đỏ hoặc Xanh (mỗi cửa {r}, tổng cao hơn thắng) hoặc Hòa ({x}); cược phụ: Đôi ({dd}, ít nhất một bên ra đôi) hoặc 2 Đôi ({d2}, cả hai bên ra đôi).', 'Bốn xúc xắc đều công bằng. Nếu Hòa, cược Đỏ và Xanh thua.'],
      id: ['Merah dan Biru masing-masing melempar dua dadu. Pasang Merah atau Biru ({r} masing-masing, total lebih tinggi menang) atau Seri ({x}); taruhan samping: Dobel ({dd}, minimal satu sisi dapat kembar) atau 2 Dobel ({d2}, kedua sisi kembar).', 'Keempat dadu adil. Jika Seri, taruhan Merah dan Biru kalah.'],
      ru: ['Красные и Синие бросают по две кости. Ставьте на Красных или Синих (по {r}, побеждает большая сумма) или на Ничью ({x}); доп. ставки: Дубль ({dd}, хотя бы у одной стороны дубль) или 2 дубля ({d2}, дубль у обеих).', 'Все четыре кости честные. При Ничьей ставки на Красных и Синих проигрывают.'],
      de: ['Rot und Blau würfeln je zwei Würfel. Setze auf Rot oder Blau (je {r}, die höhere Summe gewinnt) oder auf Unentschieden ({x}); Nebenwetten: Pasch ({dd}, mindestens eine Seite würfelt einen Pasch) oder 2 Pasche ({d2}, beide Seiten).', 'Alle vier Würfel sind fair. Bei Unentschieden verlieren Rot und Blau.'],
      hi: ['लाल और नीला दोनों दो-दो पासे फेंकते हैं। लाल या नीला (हर एक {r}, बड़ा योग जीतता है) या टाई ({x}) पर दांव लगाएं; साइड दांव: डबल ({dd}, कम से कम एक तरफ़ जोड़ी) या 2 डबल ({d2}, दोनों तरफ़ जोड़ी)।', 'चारों पासे निष्पक्ष हैं। टाई पर लाल और नीले के दांव हारते हैं।'],
      zh: ['红方和蓝方各掷两颗骰子。押红或蓝（各 {r}，点数和大者胜）或押和（{x}）；边注：对子（{dd}，至少一方掷出对子）或双对子（{d2}，双方都掷出对子）。', '四颗骰子完全公平。开和时押红、押蓝皆输。']
    }),
    scene: function (uid, l) {
      var dice = DD_X.map(function (x, k) { return '<g class="dd-d ' + (k < 2 ? 'r' : 'b') + '" transform="translate(' + x + ' 112)"><g class="dd-in"><rect x="-19" y="-19" width="38" height="38" rx="9" fill="url(#ddD' + (k < 2 ? 'r' : 'b') + uid + ')" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/><rect x="-15" y="-16" width="20" height="7" rx="3.5" fill="#fff" opacity=".25"/><g class="dd-p"></g></g></g>'; }).join('');
      var side = function (x, b) { return '<g class="dd-side s' + b + '"><rect x="' + (x - 76) + '" y="44" width="152" height="170" rx="16" class="dd-r"/><rect class="dd-glow" x="' + (x - 76) + '" y="44" width="152" height="170" rx="16" fill="none" stroke="#FDE68A" stroke-width="3" opacity="0"/><text class="dd-n" x="' + x + '" y="66" text-anchor="middle">' + K.esc(b ? l.blue : l.red) + '</text><circle cx="' + x + '" cy="178" r="20" class="dd-sc"/><text class="dd-s" x="' + x + '" y="185" text-anchor="middle"></text></g>'; };
      return '<defs>' + felt(uid, '#312E81', '#0B0A24') + lgd('ddDr' + uid, '#F87171', '#991B1B') + lgd('ddDb' + uid, '#60A5FA', '#1E3A8A') + '</defs>' + table(uid, '#06051A', '#CA8A04') +
        side(88, 0) + side(272, 1) + '<text class="dd-vs" x="180" y="120" text-anchor="middle">VS</text>' + dice + banner(24);
    },
    board: function (uid, l, oddTxt, o) {
      return btn('r', lab(l.red) + odd('r', oddTxt, o), 'dd-b r') + btn('x', lab(l.tie) + odd('x', oddTxt, o), 'dd-b x') + btn('b', lab(l.blue) + odd('b', oddTxt, o), 'dd-b b') +
        btn('dd', lab(l.dbl) + odd('dd', oddTxt, o), 'dd-b dd') + btn('d2', lab(l.dbl2) + odd('d2', oddTxt, o), 'dd-b d2');
    },
    hist: function (n) { return chipS(n === 2 ? '=' : '', 'ddh' + n); },
    wins: function (res) { var d = res.d || [], w = [['r', 'b', 'x'][+res.n]]; var a = d[0] === d[1], b = d[2] === d[3]; if (a || b) w.push('dd'); if (a && b) w.push('d2'); return w; },
    init: function (c) { c.d = [].slice.call(c.box.querySelectorAll('.dd-d')); c.in = c.d.map(function (g) { return g.querySelector('.dd-in'); }); c.p = c.d.map(function (g) { return g.querySelector('.dd-p'); }); c.pv = [0, 0, 0, 0]; c.sc = [].slice.call(c.box.querySelectorAll('.dd-s')); c.gl = [].slice.call(c.box.querySelectorAll('.dd-glow')); c.vs = c.q('.dd-vs'); bnInit(c); },
    frame: function (c, R, t, e, res) {
      var face = function (k, v) { if (c.pv[k] !== v) { c.pv[k] = v; c.p[k].innerHTML = pipsSvg(v, '#fff'); } };
      var k;
      if (!res) {
        var lr = R && R.last && R.last.length ? null : null;
        for (k = 0; k < 4; k++) { face(k, [6, 6, 6, 6][k] && (k % 2 ? 5 : 6)); sa(c.in[k], 'transform', 'rotate(' + (Math.sin(t * 1.4 + k) * 4).toFixed(1) + ')'); }
        txt(c.sc[0], ''); txt(c.sc[1], ''); c.gl.forEach(function (g) { sa(g, 'opacity', '0'); }); sa(c.vs, 'opacity', '1');
        if (!bnCd(c, R, t, e)) bnSet(c, ''); return;
      }
      var d = res.d || [1, 1, 1, 1], land = [2.0, 2.2, 2.4, 2.6];
      for (k = 0; k < 4; k++) {
        if (e < land[k]) {
          var ph = e / land[k], hop = Math.abs(Math.sin(ph * Math.PI * 3)) * (1 - ph) * 34;
          face(k, 1 + Math.floor(hr(Math.floor(e * 9), k + 1) * 6));
          sa(c.in[k], 'transform', 'translate(0 ' + (-hop).toFixed(1) + ') rotate(' + ((1 - ph) * 720 * (k % 2 ? -1 : 1)).toFixed(0) + ')');
        } else { face(k, +d[k]); sa(c.in[k], 'transform', 'rotate(0)'); }
      }
      txt(c.sc[0], e >= 2.4 ? String(+d[0] + +d[1]) : ''); txt(c.sc[1], e >= 2.8 ? String(+d[2] + +d[3]) : '');
      var n = +res.n, w = e >= 3.2, pulse = (.6 + .4 * Math.sin(t * 6)).toFixed(2);
      sa(c.gl[0], 'opacity', w && n !== 1 ? pulse : '0'); sa(c.gl[1], 'opacity', w && n !== 0 ? pulse : '0'); sa(c.vs, 'opacity', w ? '.25' : '1');
      bnSet(c, w ? (n === 2 ? c.l.tie : (n ? c.l.blue : c.l.red) + ' ' + c.l.wins) : '', 'n' + n);
    }
  });

  /* ========================================================== Color Game (Perya) ========================================================== */
  var PC = ['#FACC15', '#F8FAFC', '#EC4899', '#3B82F6', '#EF4444', '#22C55E'], PC2 = ['#A16207', '#94A3B8', '#9D174D', '#1E3A8A', '#991B1B', '#15803D'];
  var PY_L = [1.7, 2.3, 2.9];
  function pyDie(c) { return '<rect x="-21" y="-21" width="42" height="42" rx="9" fill="' + PC[c] + '" stroke="' + PC2[c] + '" stroke-width="2"/><rect x="-16" y="-17" width="22" height="8" rx="4" fill="#fff" opacity=".45"/><circle r="6" fill="#fff" opacity=".3"/>'; }
  live('peryalive', {
    lab: 'cf', bev: 'roll', SHOW: 5.0,
    odds0: { k0: 2.23, k1: 2.23, k2: 2.23, k3: 2.23, k4: 2.23, k5: 2.23, mix: 1.69, pair: 2.25, tri: 33.84 },
    beat: function (e) { return (e >= PY_L[0]) + (e >= PY_L[1]) + (e >= PY_L[2]) + (e >= 3.4); },
    rules: rules(140, { k0: 2.23, mix: 1.69, pair: 2.25, tri: 33.84 }, {
      en: ['The Perya colour game: three dice with six colours (yellow, white, pink, blue, red, green) drop onto the board. Bet on a colour ({k0}: it shows on at least one die), or on Mixed ({mix}: three different colours), Pair ({pair}: exactly two dice alike) or Triple ({tri}: three dice alike).', 'Each die lands on any colour with the same chance. One bet per round.'],
      fr: ['Le jeu des couleurs Perya : trois dés à six couleurs (jaune, blanc, rose, bleu, rouge, vert) tombent sur le plateau. Parie sur une couleur ({k0} : elle sort sur au moins un dé), ou sur Mélange ({mix} : trois couleurs différentes), Paire ({pair} : exactement deux dés pareils) ou Triple ({tri} : trois dés pareils).', 'Chaque dé tombe sur chaque couleur avec la même chance. Un pari par tour.'],
      es: ['El juego de colores Perya: tres dados de seis colores (amarillo, blanco, rosa, azul, rojo, verde) caen en el tablero. Apuesta a un color ({k0}: sale en al menos un dado), o a Mixto ({mix}: tres colores distintos), Pareja ({pair}: exactamente dos dados iguales) o Triple ({tri}: tres iguales).', 'Cada dado cae en cualquier color con la misma probabilidad. Una apuesta por ronda.'],
      pt: ['O jogo das cores Perya: três dados de seis cores (amarelo, branco, rosa, azul, vermelho, verde) caem no tabuleiro. Aposte numa cor ({k0}: sai em pelo menos um dado), ou em Misto ({mix}: três cores diferentes), Par ({pair}: exatamente dois dados iguais) ou Trio ({tri}: três iguais).', 'Cada dado cai em qualquer cor com a mesma chance. Uma aposta por rodada.'],
      ar: ['لعبة الألوان بيريا: ثلاثة أحجار نرد بستة ألوان (أصفر، أبيض، وردي، أزرق، أحمر، أخضر) تسقط على اللوحة. راهن على لون ({k0}: يظهر على حجر واحد على الأقل)، أو مختلط ({mix}: ثلاثة ألوان مختلفة)، أو زوج ({pair}: حجران متطابقان تمامًا)، أو ثلاثي ({tri}: الثلاثة متطابقة).', 'كل حجر يقع على أي لون بالفرصة نفسها. رهان واحد لكل جولة.'],
      tr: ['Perya renk oyunu: altı renkli (sarı, beyaz, pembe, mavi, kırmızı, yeşil) üç zar tahtaya düşer. Bir renge ({k0}: en az bir zarda çıkar) ya da Karışık ({mix}: üç farklı renk), Çift ({pair}: tam iki zar aynı) veya Üçlü ({tri}: üçü aynı) oyna.', 'Her zar her renge aynı olasılıkla düşer. Her turda bir bahis.'],
      vi: ['Trò chơi màu Perya: ba xúc xắc sáu màu (vàng, trắng, hồng, xanh dương, đỏ, xanh lá) rơi xuống bàn. Cược một màu ({k0}: ra trên ít nhất một viên), hoặc Khác màu ({mix}: ba màu khác nhau), Đôi ({pair}: đúng hai viên giống nhau) hay Bộ ba ({tri}: ba viên giống nhau).', 'Mỗi viên rơi vào mọi màu với cùng xác suất. Mỗi vòng một cược.'],
      id: ['Permainan warna Perya: tiga dadu enam warna (kuning, putih, merah muda, biru, merah, hijau) jatuh ke papan. Pasang satu warna ({k0}: muncul di minimal satu dadu), atau Campur ({mix}: tiga warna berbeda), Pair ({pair}: tepat dua dadu sama) atau Triple ({tri}: ketiganya sama).', 'Setiap dadu jatuh ke warna mana pun dengan peluang sama. Satu taruhan per ronde.'],
      ru: ['Цветная игра Перья: три кости шести цветов (жёлтый, белый, розовый, синий, красный, зелёный) падают на поле. Ставьте на цвет ({k0}: выпадет хотя бы на одной кости), или на Разные ({mix}: три разных цвета), Пару ({pair}: ровно две одинаковые) или Тройку ({tri}: все три одинаковые).', 'Каждая кость выпадает на любой цвет с равной вероятностью. Одна ставка за раунд.'],
      de: ['Das Perya-Farbspiel: drei Würfel mit sechs Farben (gelb, weiß, rosa, blau, rot, grün) fallen aufs Brett. Setze auf eine Farbe ({k0}: sie liegt auf mindestens einem Würfel), oder auf Gemischt ({mix}: drei verschiedene Farben), Paar ({pair}: genau zwei gleich) oder Drilling ({tri}: alle drei gleich).', 'Jeder Würfel fällt mit gleicher Chance auf jede Farbe. Ein Einsatz pro Runde.'],
      hi: ['पेर्या रंग खेल: छह रंगों (पीला, सफ़ेद, गुलाबी, नीला, लाल, हरा) वाले तीन पासे बोर्ड पर गिरते हैं। किसी रंग ({k0}: कम से कम एक पासे पर आए), या मिश्रित ({mix}: तीन अलग रंग), जोड़ी ({pair}: ठीक दो पासे एक जैसे) या ट्रिपल ({tri}: तीनों एक जैसे) पर दांव लगाएं।', 'हर पासा हर रंग पर बराबर संभावना से गिरता है। हर राउंड में एक दांव।'],
      zh: ['菲律宾 Perya 颜色游戏：三颗六色骰子（黄、白、粉、蓝、红、绿）落到台面上。押一种颜色（{k0}：至少一颗骰子出现该色），或押杂色（{mix}：三种不同颜色）、对子（{pair}：恰好两颗相同）或围骰（{tri}：三颗相同）。', '每颗骰子落在各颜色的机会相同。每局一注。']
    }),
    scene: function (uid) {
      var tiles = ''; for (var i = 0; i < 6; i++) tiles += '<g class="py-t" transform="translate(' + (40 + i * 56) + ' 194)"><rect x="-25" y="-17" width="50" height="34" rx="8" fill="' + PC[i] + '" stroke="' + PC2[i] + '" stroke-width="2"/><rect class="py-tg" x="-25" y="-17" width="50" height="34" rx="8" fill="none" stroke="#fff" stroke-width="3" opacity="0"/><text class="py-tn" y="7" text-anchor="middle"></text></g>';
      var dice = ''; for (var k = 0; k < 3; k++) dice += '<g class="py-d"><g class="py-in"></g></g>';
      return '<defs>' + felt(uid, '#831843', '#1F0614') + '</defs>' + table(uid, '#14040D', '#F472B6') +
        '<path d="M40 30H320L300 150H60Z" class="py-chute"/><g class="py-bulbs">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<circle cx="' + (52 + i * 28.5) + '" cy="38" r="3.2"/>'; }).join('') + '</g>' + tiles + dice + banner(24);
    },
    board: function (uid, l, oddTxt, o) {
      var h = ''; for (var i = 0; i < 6; i++) h += btn('k' + i, '<i class="sw" style="background:' + PC[i] + '"></i>' + odd('k' + i, oddTxt, o), 'py-b c');
      return h + btn('mix', lab(l.mixed) + odd('mix', oddTxt, o), 'py-b w') + btn('pair', lab(l.pair) + odd('pair', oddTxt, o), 'py-b w') + btn('tri', lab(l.triple) + odd('tri', oddTxt, o), 'py-b w');
    },
    hist: function (n) { var d = [Math.floor(n / 36), Math.floor(n / 6) % 6, n % 6]; return '<span class="py-h">' + d.map(function (x) { return '<i style="background:' + PC[x] + '"></i>'; }).join('') + '</span>'; },
    wins: function (res) { var n = +res.n, d = [Math.floor(n / 36), Math.floor(n / 6) % 6, n % 6], w = []; d.forEach(function (x) { if (w.indexOf('k' + x) < 0) w.push('k' + x); }); w.push(w.length === 3 ? 'mix' : w.length === 2 ? 'pair' : 'tri'); return w; },
    init: function (c) { c.d = [].slice.call(c.box.querySelectorAll('.py-d')); c.in = c.d.map(function (g) { return g.querySelector('.py-in'); }); c.cv = [-1, -1, -1]; c.tn = [].slice.call(c.box.querySelectorAll('.py-tn')); c.tg = [].slice.call(c.box.querySelectorAll('.py-tg')); c.tl = [].slice.call(c.box.querySelectorAll('.py-t')); c.bul = [].slice.call(c.box.querySelectorAll('.py-bulbs circle')); bnInit(c); },
    frame: function (c, R, t, e, res) {
      var col = function (k, v) { if (c.cv[k] !== v) { c.cv[k] = v; c.in[k].innerHTML = pyDie(v); } };
      var bi = Math.floor(t * 6); c.bul.forEach(function (b, i) { sa(b, 'class', (i + bi) % 3 === 0 ? 'on' : ''); });
      var k;
      if (!res) {
        for (k = 0; k < 3; k++) { col(k, [2, 3, 0][k]); sa(c.d[k], 'transform', 'translate(' + (120 + k * 60) + ' ' + (92 + Math.sin(t * 2 + k) * 4).toFixed(1) + ') rotate(' + (Math.sin(t + k) * 8).toFixed(1) + ')'); }
        c.tn.forEach(function (x) { txt(x, ''); }); c.tg.forEach(function (g) { sa(g, 'opacity', '0'); });
        if (!bnCd(c, R, t, e)) bnSet(c, ''); return;
      }
      var n = +res.n, d = [Math.floor(n / 36), Math.floor(n / 6) % 6, n % 6], cnt = [0, 0, 0, 0, 0, 0];
      for (k = 0; k < 3; k++) {
        var L0 = PY_L[k], x = 120 + k * 60;
        if (e < L0) {
          var ph = cl01(e / L0), y = lerp(-40, 108, ph * ph), sp = (1 - ph) * 900;
          col(k, Math.floor(hr(Math.floor(e * 10), k + 7) * 6));
          sa(c.d[k], 'transform', 'translate(' + x + ' ' + y.toFixed(1) + ') rotate(' + sp.toFixed(0) + ')');
        } else {
          var b = e - L0, bounce = b < .4 ? Math.sin(b / .4 * Math.PI) * 10 : 0;
          col(k, d[k]); sa(c.d[k], 'transform', 'translate(' + x + ' ' + (108 - bounce).toFixed(1) + ')'); cnt[d[k]]++;
        }
      }
      var show = e >= 3.4, pulse = (.6 + .4 * Math.sin(t * 6)).toFixed(2);
      for (k = 0; k < 6; k++) { txt(c.tn[k], show && cnt[k] ? '×' + cnt[k] : ''); sa(c.tg[k], 'opacity', show && cnt[k] ? pulse : '0'); sa(c.tl[k], 'opacity', show && !cnt[k] ? '.35' : '1'); }
      var u = cnt.filter(function (x) { return x; }).length;
      bnSet(c, show ? (u === 3 ? c.l.mixed : u === 2 ? c.l.pair : c.l.triple) : '', 'n0');
    }
  });

  /* ================================================================ Bingo Live ================================================================ */
  var BG_T = [[4, 33], [34, 39], [40, 44], [45, 50], [51, 75]], BG_I = .45, BG_0 = .8;
  var BG_COL = ['#2563EB', '#DC2626', '#16A34A', '#CA8A04', '#7C3AED'];
  var LINES = (function () { var L = [], r, c; for (r = 0; r < 5; r++) L.push([0, 1, 2, 3, 4].map(function (x) { return r * 5 + x; })); for (c = 0; c < 5; c++) L.push([0, 1, 2, 3, 4].map(function (x) { return x * 5 + c; })); L.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]); return L; })();
  function cardLines(cd, called) { var out = []; LINES.forEach(function (ln, i) { if (ln.every(function (x) { return x === 12 || called[cd[x]]; })) out.push(i); }); return out; }
  function lineSeg(i, x0, y0, s) { var ln = LINES[i], a = ln[0], b = ln[4]; return [x0 + (a % 5 + .5) * s, y0 + (Math.floor(a / 5) + .5) * s, x0 + (b % 5 + .5) * s, y0 + (Math.floor(b / 5) + .5) * s]; }
  function grid(cl, x0, y0, s) {
    var h = ''; for (var i = 0; i < 25; i++) { var x = x0 + (i % 5) * s, y = y0 + Math.floor(i / 5) * s; h += '<g class="' + cl + '-cl" transform="translate(' + (x + s / 2) + ' ' + (y + s / 2) + ')"><rect x="' + (-s / 2 + 1.5) + '" y="' + (-s / 2 + 1.5) + '" width="' + (s - 3) + '" height="' + (s - 3) + '" rx="5"/><circle class="dab" r="' + (s * .36).toFixed(1) + '" opacity="0"/><text y="' + (s * .17).toFixed(1) + '" text-anchor="middle"></text></g>'; }
    for (var k = 0; k < 12; k++) h += '<line class="' + cl + '-ln" x1="0" y1="0" x2="0" y2="0" opacity="0"/>';
    return h;
  }
  function gridInit(c, cl) { c.cells = [].slice.call(c.box.querySelectorAll('.' + cl + '-cl')).map(function (g) { return { g: g, d: g.querySelector('.dab'), t: g.querySelector('text'), r: g.querySelector('rect') }; }); c.lns = [].slice.call(c.box.querySelectorAll('.' + cl + '-ln')); c.cdKey = ''; }
  function gridCard(c, cd, freeTxt) { var key = cd ? cd.join(',') : ''; if (c.cdKey === key) return; c.cdKey = key; c.cells.forEach(function (x, i) { txt(x.t, cd ? (i === 12 ? freeTxt : String(cd[i])) : ''); cls(x.g, x.g.getAttribute('class').replace(' free', '') + (i === 12 ? ' free' : '')); }); }
  function gridMarks(c, cd, called, lines, x0, y0, s, last) {
    var mk = c.cdKey + '|' + Object.keys(called).length + '|' + last + '|' + lines.join(','); if (c.gmk === mk) return; c.gmk = mk;
    c.cells.forEach(function (x, i) { var on = !!cd && (i === 12 || !!called[cd[i]]); sa(x.d, 'opacity', on ? (i !== 12 && cd[i] === last ? '1' : '.85') : '0'); cls(x.g, x.g.getAttribute('class').replace(/ (on|hot)/g, '') + (on ? ' on' : '') + (cd && cd[i] === last ? ' hot' : '')); });
    c.lns.forEach(function (ln, k) { var i = lines[k]; if (i == null) { sa(ln, 'opacity', '0'); return; } var p = lineSeg(i, x0, y0, s); sa(ln, 'x1', p[0].toFixed(1)); sa(ln, 'y1', p[1].toFixed(1)); sa(ln, 'x2', p[2].toFixed(1)); sa(ln, 'y2', p[3].toFixed(1)); sa(ln, 'opacity', '1'); });
  }
  function drumBalls(n, cl) { var h = ''; for (var i = 0; i < n; i++) h += '<circle class="' + cl + '" r="6"/>'; return h; }
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function drumFrame(balls, cx, cy, R, t, fast) { if (lite() && !fast) t = 0; balls.forEach(function (b, i) { var sp = fast ? 3.2 : .7, a = t * sp * (1 + i * .13) + i * 1.7, r = R * (.25 + .6 * Math.abs(Math.sin(t * sp * .6 + i))); sa(b, 'cx', (cx + Math.cos(a) * r).toFixed(1)); sa(b, 'cy', (cy + Math.sin(a * 1.3) * r).toFixed(1)); }); }
  function bingoL(v) { return 'BINGO'.charAt(Math.floor((v - 1) / 15)); }
  live('bingolive', {
    lab: 'bd', bev: 'ball', show: function (res) { return BG_0 + (+res.n - 1) * BG_I + 2.4; },
    odds0: { t0: 4.38, t1: 4.85, t2: 4.86, t3: 4.41, t4: 5.06 },
    beat: function (e) { return e < BG_0 ? 0 : 1 + Math.floor((e - BG_0) / BG_I); },
    rules: rules(170, { t0: 4.38, t1: 4.85, t2: 4.86, t3: 4.41, t4: 5.06 }, {
      en: ['The shared 75-ball card (centre square free) is shown during the bets. Bet on how many balls it takes to complete the first line (row, column or diagonal): up to 33 ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), 51 or more ({t4}).', 'Balls 1–75 are drawn one by one at random and marked on the card; the draw stops at the first complete line.'],
      fr: ['La carte commune du bingo 75 boules (case centrale offerte) est montrée pendant les paris. Parie sur le nombre de boules pour compléter la première ligne (ligne, colonne ou diagonale) : jusqu’à 33 ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), 51 ou plus ({t4}).', 'Les boules 1–75 sortent une à une au hasard et sont cochées sur la carte ; le tirage s’arrête à la première ligne complète.'],
      es: ['El cartón común de bingo de 75 bolas (casilla central libre) se muestra durante las apuestas. Apuesta a cuántas bolas hacen falta para la primera línea (fila, columna o diagonal): hasta 33 ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), 51 o más ({t4}).', 'Las bolas 1–75 salen una a una al azar y se marcan en el cartón; el sorteo para en la primera línea completa.'],
      pt: ['A cartela comum do bingo de 75 bolas (casa central livre) aparece durante as apostas. Aposte em quantas bolas serão precisas para a primeira linha (linha, coluna ou diagonal): até 33 ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), 51 ou mais ({t4}).', 'As bolas 1–75 saem uma a uma ao acaso e são marcadas na cartela; o sorteio para na primeira linha completa.'],
      ar: ['تظهر بطاقة البينغو المشتركة (75 كرة، المربع الأوسط مجاني) أثناء الرهانات. راهن على عدد الكرات اللازم لإكمال أول خط (صف أو عمود أو قطر): حتى 33 ({t0})، 34–39 ({t1})، 40–44 ({t2})، 45–50 ({t3})، 51 أو أكثر ({t4}).', 'تُسحب الكرات من 1 إلى 75 واحدة تلو الأخرى عشوائيًا وتُعلَّم على البطاقة؛ يتوقف السحب عند أول خط مكتمل.'],
      tr: ['75 toplu ortak bingo kartı (orta kare bedava) bahisler sırasında gösterilir. İlk çizgiyi (satır, sütun veya çapraz) tamamlamak için kaç top gerektiğine oyna: 33’e kadar ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), 51 veya fazla ({t4}).', '1–75 arası toplar tek tek rastgele çekilip kartta işaretlenir; ilk tam çizgide çekiliş durur.'],
      vi: ['Thẻ bingo chung 75 số (ô giữa miễn phí) được hiện trong lúc đặt cược. Cược số bóng cần để hoàn thành hàng đầu tiên (hàng, cột hoặc chéo): đến 33 ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), từ 51 trở lên ({t4}).', 'Các bóng 1–75 được quay ngẫu nhiên từng quả và đánh dấu trên thẻ; quay dừng khi có hàng đầu tiên hoàn thành.'],
      id: ['Kartu bingo bersama 75 bola (kotak tengah gratis) ditampilkan selama taruhan. Pasang berapa bola yang dibutuhkan untuk garis pertama (baris, kolom atau diagonal): sampai 33 ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), 51 atau lebih ({t4}).', 'Bola 1–75 ditarik acak satu per satu dan ditandai di kartu; undian berhenti pada garis lengkap pertama.'],
      ru: ['Общая карточка бинго на 75 шаров (центр бесплатный) показана во время ставок. Ставьте на число шаров до первой полной линии (строка, столбец или диагональ): до 33 ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), 51 и больше ({t4}).', 'Шары 1–75 вынимаются по одному случайно и отмечаются на карточке; розыгрыш останавливается на первой полной линии.'],
      de: ['Die gemeinsame 75-Kugel-Bingokarte (Mittelfeld frei) wird während der Einsätze gezeigt. Setze darauf, wie viele Kugeln es bis zur ersten vollen Linie braucht (Reihe, Spalte oder Diagonale): bis 33 ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), 51 oder mehr ({t4}).', 'Die Kugeln 1–75 werden einzeln zufällig gezogen und auf der Karte markiert; die Ziehung endet bei der ersten vollen Linie.'],
      hi: ['75 गेंदों वाला साझा बिंगो कार्ड (बीच का खाना फ्री) दांव के समय दिखता है। पहली लाइन (पंक्ति, कॉलम या तिरछी) पूरी होने में कितनी गेंदें लगेंगी, उस पर दांव लगाएं: 33 तक ({t0}), 34–39 ({t1}), 40–44 ({t2}), 45–50 ({t3}), 51 या ज़्यादा ({t4})।', '1–75 की गेंदें एक-एक कर रैंडम निकलती हैं और कार्ड पर मार्क होती हैं; पहली पूरी लाइन पर ड्रॉ रुक जाता है।'],
      zh: ['下注时显示共享的 75 球宾果卡（中心格免费）。押完成第一条线（横、竖或斜）需要多少个球：33 个以内（{t0}）、34–39（{t1}）、40–44（{t2}）、45–50（{t3}）、51 个及以上（{t4}）。', '1–75 号球逐个随机抽出并在卡上标记；出现第一条完整的线即停止。']
    }),
    scene: function (uid) {
      var hd = ''; for (var i = 0; i < 5; i++) hd += '<rect x="' + (18 + i * 31 + 1.5) + '" y="24" width="28" height="22" rx="5" fill="' + BG_COL[i] + '"/><text class="bg-hd" x="' + (18 + i * 31 + 15.5) + '" y="40" text-anchor="middle">' + 'BINGO'.charAt(i) + '</text>';
      return '<defs>' + felt(uid, '#9A3412', '#2A0A04') + rgd('bgG' + uid, '#FFFFFF', '#FED7AA', '#EA580C') + '</defs>' + table(uid, '#160602', '#FB923C') +
        '<rect x="12" y="18" width="167" height="198" rx="12" class="bg-card"/>' + hd + grid('bg', 18, 50, 31) +
        '<circle cx="268" cy="82" r="56" class="bg-drum"/>' + drumBalls(8, 'bg-mb') + '<path d="M246 136h44l-6 14h-32z" class="bg-neck"/>' +
        '<g class="bg-cur" transform="translate(268 178)"><circle r="27" fill="url(#bgG' + uid + ')" stroke="#fff" stroke-width="2"/><circle r="17" fill="#fff"/><text class="bg-ltr" y="-4" text-anchor="middle"></text><text class="bg-num" y="10" text-anchor="middle"></text></g>' +
        '<text class="bg-cnt" x="268" y="221" text-anchor="middle"></text>' + banner(24).replace('translate(180 ', 'translate(268 ');
    },
    board: function (uid, l, oddTxt, o) { return BG_T.map(function (r, i) { return btn('t' + i, lab(i === 0 ? '≤ 33' : i === 4 ? '51+' : r[0] + '–' + r[1]) + '<i>' + K.esc(l.balls) + '</i>' + odd('t' + i, oddTxt, o), 'bg-b'); }).join(''); },
    hist: function (n) { var k = 0; BG_T.forEach(function (r, i) { if (n >= r[0] && n <= r[1]) k = i; }); return chipS(n, 'bgh' + k); },
    wins: function (res) { var n = +res.n, w = []; BG_T.forEach(function (r, i) { if (n >= r[0] && n <= r[1]) w.push('t' + i); }); return w; },
    init: function (c) { gridInit(c, 'bg'); c.mb = [].slice.call(c.box.querySelectorAll('.bg-mb')); c.cur = c.q('.bg-cur'); c.cl = c.q('.bg-ltr'); c.cn = c.q('.bg-num'); c.cnt = c.q('.bg-cnt'); bnInit(c); },
    frame: function (c, R, t, e, res) {
      var cd = res ? res.cd : (R && R.pre ? R.pre.cd : null);
      gridCard(c, cd, '★');
      if (!res) { drumFrame(c.mb, 268, 82, 44, t, false); gridMarks(c, cd, {}, [], 18, 50, 31, -1); sa(c.cur, 'opacity', '.35'); txt(c.cl, ''); txt(c.cn, '?'); txt(c.cnt, ''); if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var b = res.b || [], n = b.length, k = e < BG_0 ? 0 : Math.min(n, 1 + Math.floor((e - BG_0) / BG_I)), called = {};
      for (var i = 0; i < k; i++) called[b[i]] = 1;
      var last = k ? b[k - 1] : -1, lines = k === n ? (c.lk === k + c.cdKey ? c.lv : (c.lk = k + c.cdKey, c.lv = cardLines(cd, called))) : [];
      drumFrame(c.mb, 268, 82, 44, t, k < n);
      gridMarks(c, cd, called, lines, 18, 50, 31, last);
      var pop = k ? eo(seg(e - BG_0 - (k - 1) * BG_I, 0, .25)) : 0;
      sa(c.cur, 'opacity', k ? '1' : '.35'); sa(c.cur, 'transform', 'translate(268 178) scale(' + (.7 + .3 * pop).toFixed(3) + ')');
      txt(c.cl, k ? bingoL(last) : ''); txt(c.cn, k ? String(last) : '?'); txt(c.cnt, k ? c.l.ball + ' ' + k : '', 150);
      var w = e >= BG_0 + (n - 1) * BG_I + .6;
      bnSet(c, w ? 'BINGO! ' + n + ' ' + c.l.balls : '', 'n0');
    }
  });

  /* ================================================================ Lotto 6/49 ================================================================ */
  var LO_0 = 1.0, LO_I = 1.5, LO_X = [65, 111, 157, 203, 249, 295];
  function loCol(v) { return ['#EAB308', '#2563EB', '#DC2626', '#16A34A', '#9333EA'][Math.min(4, Math.floor(v / 10))]; }
  function loBall(v, r) { return '<circle r="' + r + '" fill="' + loCol(v) + '" stroke="#fff" stroke-opacity=".7"/><circle r="' + (r * .62).toFixed(1) + '" fill="#fff"/><circle cx="' + (-r * .45).toFixed(1) + '" cy="' + (-r * .5).toFixed(1) + '" r="' + (r * .22).toFixed(1) + '" fill="#fff" opacity=".6"/><text y="' + (r * .3).toFixed(1) + '" text-anchor="middle" class="lo-n" style="font-size:' + (r * .78).toFixed(1) + 'px">' + v + '</text>'; }
  live('lotto649live', {
    lab: 'bd', bev: 'ball', SHOW: LO_0 + 5 * LO_I + 2.6,
    odds0: { lo: 1.90, hi: 1.90, odd: 2.65, even: 2.99, eq: 2.82 },
    beat: function (e) { var n = 0; for (var i = 0; i < 6; i++) if (e >= LO_0 + i * LO_I) n++; return n; },
    rules: rules(145, { lo: 1.90, odd: 2.65, even: 2.99, eq: 2.82 }, {
      en: ['6 balls are drawn from 49. Bet on the sum of the 6 numbers: under 150 or over 150 ({lo} each; exactly 150 makes both lose), or on odd and even numbers: 4+ odd ({odd}), 4+ even ({even}) or 3–3 ({eq}).', 'Each set of 6 numbers has exactly the same chance (like a real 6/49 lottery draw).'],
      fr: ['6 boules sont tirées sur 49. Parie sur la somme des 6 numéros : moins de 150 ou plus de 150 ({lo} chacun ; pile 150 fait perdre les deux), ou sur les impairs et pairs : 4+ impairs ({odd}), 4+ pairs ({even}) ou 3–3 ({eq}).', 'Chaque combinaison de 6 numéros a exactement la même chance (comme un vrai tirage 6/49).'],
      es: ['Se sacan 6 bolas de 49. Apuesta a la suma de los 6 números: menos de 150 o más de 150 ({lo} cada una; exactamente 150 hace perder ambas), o a impares y pares: 4+ impares ({odd}), 4+ pares ({even}) o 3–3 ({eq}).', 'Cada combinación de 6 números tiene exactamente la misma probabilidad (como un sorteo 6/49 real).'],
      pt: ['6 bolas são sorteadas entre 49. Aposte na soma dos 6 números: abaixo de 150 ou acima de 150 ({lo} cada; exatamente 150 faz ambos perderem), ou em ímpares e pares: 4+ ímpares ({odd}), 4+ pares ({even}) ou 3–3 ({eq}).', 'Cada combinação de 6 números tem exatamente a mesma chance (como um sorteio 6/49 real).'],
      ar: ['تُسحب 6 كرات من 49. راهن على مجموع الأرقام الستة: أقل من 150 أو أكثر من 150 ({lo} لكل منهما؛ المجموع 150 تمامًا يُخسر الاثنين)، أو على الفردي والزوجي: 4+ فردية ({odd})، 4+ زوجية ({even}) أو 3–3 ({eq}).', 'لكل مجموعة من 6 أرقام الفرصة نفسها تمامًا (مثل سحب يانصيب 6/49 حقيقي).'],
      tr: ['49 toptan 6 top çekilir. 6 sayının toplamına oyna: 150’nin altı veya üstü (her biri {lo}; tam 150 ikisini de kaybettirir), ya da tek ve çiftlere: 4+ tek ({odd}), 4+ çift ({even}) veya 3–3 ({eq}).', 'Her 6 sayılı kombinasyonun şansı tamamen aynıdır (gerçek bir 6/49 çekilişi gibi).'],
      vi: ['Quay 6 bóng trong 49. Cược tổng 6 số: dưới 150 hoặc trên 150 (mỗi cửa {lo}; đúng 150 thì cả hai thua), hoặc số lẻ và chẵn: 4+ lẻ ({odd}), 4+ chẵn ({even}) hoặc 3–3 ({eq}).', 'Mỗi bộ 6 số có cơ hội hoàn toàn như nhau (như xổ số 6/49 thật).'],
      id: ['6 bola ditarik dari 49. Pasang jumlah 6 angka: di bawah 150 atau di atas 150 ({lo} masing-masing; tepat 150 membuat keduanya kalah), atau ganjil dan genap: 4+ ganjil ({odd}), 4+ genap ({even}) atau 3–3 ({eq}).', 'Setiap kombinasi 6 angka punya peluang yang persis sama (seperti undian 6/49 sungguhan).'],
      ru: ['Из 49 шаров вынимаются 6. Ставьте на сумму 6 чисел: меньше 150 или больше 150 (по {lo}; ровно 150 — проигрыш обеих), или на нечётные и чётные: 4+ нечётных ({odd}), 4+ чётных ({even}) или 3–3 ({eq}).', 'Каждая комбинация из 6 чисел имеет ровно одинаковый шанс (как настоящий тираж 6/49).'],
      de: ['Aus 49 Kugeln werden 6 gezogen. Setze auf die Summe der 6 Zahlen: unter 150 oder über 150 (je {lo}; genau 150 lässt beide verlieren), oder auf ungerade und gerade: 4+ ungerade ({odd}), 4+ gerade ({even}) oder 3–3 ({eq}).', 'Jede Kombination von 6 Zahlen hat genau dieselbe Chance (wie eine echte 6-aus-49-Ziehung).'],
      hi: ['49 में से 6 गेंदें निकलती हैं। 6 नंबरों के योग पर दांव लगाएं: 150 से कम या 150 से ज़्यादा (हर एक {lo}; ठीक 150 पर दोनों हारते हैं), या विषम और सम पर: 4+ विषम ({odd}), 4+ सम ({even}) या 3–3 ({eq})।', '6 नंबरों के हर सेट की संभावना बिल्कुल बराबर है (असली 6/49 लॉटरी ड्रॉ की तरह)।'],
      zh: ['从 49 个球中抽出 6 个。押 6 个号码之和：小于 150 或大于 150（各 {lo}；恰好 150 两者皆输），或押单双：4 个以上单数（{odd}）、4 个以上双数（{even}）或 3–3（{eq}）。', '每组 6 个号码的机会完全相同（就像真正的 6/49 乐透开奖）。']
    }),
    scene: function (uid) {
      var slots = LO_X.map(function (x) { return '<circle cx="' + x + '" cy="188" r="19" class="lo-slot"/>'; }).join('');
      var bl = ''; for (var i = 0; i < 6; i++) bl += '<g class="lo-b" opacity="0"></g>';
      var mix = ''; for (var k = 0; k < 12; k++) mix += '<circle class="lo-m" r="7" fill="' + loCol((k * 7) % 49 + 1) + '"/>';
      return '<defs>' + felt(uid, '#075985', '#03111F') + rgd('loG' + uid, '#FFFFFF', '#BAE6FD', '#0284C7') + '</defs>' + table(uid, '#020A14', '#38BDF8') +
        '<path d="M150 150h60l8 18h-76z" class="lo-base"/><circle cx="180" cy="94" r="60" fill="url(#loG' + uid + ')" class="lo-glb"/>' + mix +
        '<path d="M140 62Q160 42 190 42" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>' +
        '<rect x="38" y="166" width="284" height="44" rx="22" class="lo-tray"/>' + slots + bl + banner(22);
    },
    board: function (uid, l, oddTxt, o) {
      return btn('lo', lab('Σ < 150') + odd('lo', oddTxt, o), 'lo-bt') + btn('hi', lab('Σ > 150') + odd('hi', oddTxt, o), 'lo-bt') + btn('odd', lab(l.odd + ' 4+') + odd('odd', oddTxt, o), 'lo-bt') +
        btn('even', lab(l.even + ' 4+') + odd('even', oddTxt, o), 'lo-bt') + btn('eq', lab('3–3') + odd('eq', oddTxt, o), 'lo-bt');
    },
    hist: function (n) { return chipS(n, n < 150 ? 'loh0' : n > 150 ? 'loh1' : 'loh2'); },
    wins: function (res) { var n = +res.n, b = res.b || [], od = b.filter(function (v) { return v % 2; }).length, w = []; if (n < 150) w.push('lo'); if (n > 150) w.push('hi'); w.push(od >= 4 ? 'odd' : od <= 2 ? 'even' : 'eq'); return w; },
    init: function (c) { c.bs = [].slice.call(c.box.querySelectorAll('.lo-b')); c.bv = [0, 0, 0, 0, 0, 0]; c.mx = [].slice.call(c.box.querySelectorAll('.lo-m')); bnInit(c); },
    frame: function (c, R, t, e, res) {
      var b = res ? (res.b || []) : [], k = 0, fast = !!res && e < LO_0 + 5 * LO_I + .8;
      c.mx.forEach(function (m, i) { if (res && i >= 12 - Math.min(6, Math.max(0, Math.floor((e - LO_0) / LO_I) + 1)) && e >= LO_0) { sa(m, 'opacity', '0'); return; } sa(m, 'opacity', '1'); var sp = fast ? 3.4 : .8, a = t * sp * (1 + i * .11) + i * 2.1, r = 46 * (.2 + .75 * Math.abs(Math.sin(t * sp * .5 + i * .7))); sa(m, 'cx', (180 + Math.cos(a) * r).toFixed(1)); sa(m, 'cy', (94 + Math.sin(a * 1.2) * r * .9).toFixed(1)); });
      if (!res) { c.bs.forEach(function (g) { sa(g, 'opacity', '0'); }); if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var sum = 0, od = 0;
      for (var i = 0; i < 6; i++) {
        var a = LO_0 + i * LO_I, g = c.bs[i];
        if (e < a || b[i] == null) { sa(g, 'opacity', '0'); continue; }
        if (c.bv[i] !== b[i]) { c.bv[i] = b[i]; g.innerHTML = loBall(b[i], 17); }
        var q = eio(seg(e, a, a + .7)), x = lerp(180, LO_X[i], q), y = lerp(150, 188, q) - Math.sin(q * Math.PI) * 30;
        sa(g, 'opacity', '1'); sa(g, 'transform', tr(x, y, lerp(.5, 1, q), (1 - q) * 360));
        if (e >= a + .7) { sum += b[i]; if (b[i] % 2) od++; k++; }
      }
      var w = e >= LO_0 + 5 * LO_I + .8;
      bnSet(c, k ? 'Σ ' + sum + (w ? ' · ' + c.l.odd + ' ' + od + ' · ' + c.l.even + ' ' + (6 - od) : '') : '', w ? 'n0' : 'cd');
    }
  });

  /* ================================================================ Mega Ball ================================================================ */
  var MB_0 = .8, MB_I = .42, MB_N = 26;
  function mbT(k) { return MB_0 + k * MB_I + (k === MB_N - 1 ? .9 : 0); }
  live('megaballlive', {
    lab: 'bd', bev: 'ball', SHOW: mbT(MB_N - 1) + 2.4,
    odds0: { l0: 1.50, l1: 3.17, l2: 14.14, l3: 86.27 },
    beat: function (e) { var n = 0; for (var k = 0; k < MB_N; k++) if (e >= mbT(k)) n++; return n; },
    rules: rules(155, { l0: 1.50, l1: 3.17, l2: 14.14, l3: 86.27 }, {
      en: ['The shared Mega card (24 numbers from 1–51, centre free) is shown during the bets. Bet on how many lines (rows, columns, diagonals) it will complete: 0 ({l0}), 1 ({l1}), 2 ({l2}) or 3 and more ({l3}).', '26 balls out of 51 are drawn at random, the last one is the gold Mega Ball; then the complete lines of the card are counted.'],
      fr: ['La carte Mega commune (24 numéros de 1 à 51, centre offert) est montrée pendant les paris. Parie sur le nombre de lignes (lignes, colonnes, diagonales) qu’elle complétera : 0 ({l0}), 1 ({l1}), 2 ({l2}) ou 3 et plus ({l3}).', '26 boules sur 51 sont tirées au hasard, la dernière est la Mega Ball dorée ; puis on compte les lignes complètes de la carte.'],
      es: ['El cartón Mega común (24 números del 1 al 51, centro libre) se muestra durante las apuestas. Apuesta a cuántas líneas (filas, columnas, diagonales) completará: 0 ({l0}), 1 ({l1}), 2 ({l2}) o 3 o más ({l3}).', 'Se sacan al azar 26 bolas de 51; la última es la Mega Ball dorada. Luego se cuentan las líneas completas.'],
      pt: ['A cartela Mega comum (24 números de 1 a 51, centro livre) aparece durante as apostas. Aposte em quantas linhas (linhas, colunas, diagonais) ela completará: 0 ({l0}), 1 ({l1}), 2 ({l2}) ou 3 ou mais ({l3}).', '26 bolas de 51 são sorteadas ao acaso, a última é a Mega Ball dourada; depois contam-se as linhas completas.'],
      ar: ['تظهر بطاقة ميغا المشتركة (24 رقمًا من 1 إلى 51، المربع الأوسط مجاني) أثناء الرهانات. راهن على عدد الخطوط (صفوف، أعمدة، أقطار) التي ستكتمل: 0 ({l0})، 1 ({l1})، 2 ({l2}) أو 3 فأكثر ({l3}).', 'تُسحب 26 كرة من 51 عشوائيًا، والأخيرة هي الميغا بول الذهبية؛ ثم تُعدّ الخطوط المكتملة في البطاقة.'],
      tr: ['Ortak Mega kart (1–51 arası 24 sayı, orta bedava) bahisler sırasında gösterilir. Kaç çizgi (satır, sütun, çapraz) tamamlanacağına oyna: 0 ({l0}), 1 ({l1}), 2 ({l2}) veya 3 ve fazla ({l3}).', '51 toptan 26’sı rastgele çekilir, sonuncusu altın Mega Top’tur; sonra kartın tam çizgileri sayılır.'],
      vi: ['Thẻ Mega chung (24 số từ 1–51, ô giữa miễn phí) được hiện trong lúc đặt cược. Cược số hàng (hàng ngang, cột, chéo) sẽ hoàn thành: 0 ({l0}), 1 ({l1}), 2 ({l2}) hoặc từ 3 trở lên ({l3}).', 'Quay ngẫu nhiên 26 bóng trong 51, bóng cuối là Mega Ball vàng; sau đó đếm các hàng hoàn thành.'],
      id: ['Kartu Mega bersama (24 angka dari 1–51, tengah gratis) ditampilkan selama taruhan. Pasang berapa garis (baris, kolom, diagonal) yang akan lengkap: 0 ({l0}), 1 ({l1}), 2 ({l2}) atau 3 lebih ({l3}).', '26 dari 51 bola ditarik acak, yang terakhir adalah Mega Ball emas; lalu garis lengkap di kartu dihitung.'],
      ru: ['Общая Мега-карточка (24 числа от 1 до 51, центр бесплатный) показана во время ставок. Ставьте на число линий (строки, столбцы, диагонали), которые она закроет: 0 ({l0}), 1 ({l1}), 2 ({l2}) или 3 и больше ({l3}).', 'Случайно вынимаются 26 шаров из 51, последний — золотой Мега-шар; затем считаются полные линии карточки.'],
      de: ['Die gemeinsame Mega-Karte (24 Zahlen von 1–51, Mitte frei) wird während der Einsätze gezeigt. Setze darauf, wie viele Linien (Reihen, Spalten, Diagonalen) sie vervollständigt: 0 ({l0}), 1 ({l1}), 2 ({l2}) oder 3 und mehr ({l3}).', '26 von 51 Kugeln werden zufällig gezogen, die letzte ist der goldene Mega Ball; dann werden die vollen Linien gezählt.'],
      hi: ['साझा मेगा कार्ड (1–51 के 24 नंबर, बीच का खाना फ्री) दांव के समय दिखता है। कितनी लाइनें (पंक्ति, कॉलम, तिरछी) पूरी होंगी, उस पर दांव लगाएं: 0 ({l0}), 1 ({l1}), 2 ({l2}) या 3 और ज़्यादा ({l3})।', '51 में से 26 गेंदें रैंडम निकलती हैं, आख़िरी सुनहरी मेगा बॉल है; फिर कार्ड की पूरी लाइनें गिनी जाती हैं।'],
      zh: ['下注时显示共享的 Mega 卡（1–51 中的 24 个号码，中心格免费）。押它会完成几条线（横、竖、斜）：0（{l0}）、1（{l1}）、2（{l2}）或 3 条及以上（{l3}）。', '从 51 个球中随机抽出 26 个，最后一个是金色 Mega 球；然后计算卡上完成的线数。']
    }),
    scene: function (uid) {
      var slots = ''; for (var k = 0; k < MB_N; k++) slots += '<g class="mb-s" opacity="0"><circle r="' + (k === MB_N - 1 ? 13 : 11) + '" class="mb-bc' + (k === MB_N - 1 ? ' mega' : '') + '"/><text y="4" text-anchor="middle"></text></g>';
      return '<defs>' + felt(uid, '#581C87', '#0B0316') + '</defs>' + table(uid, '#07020F', '#E879F9') +
        '<rect x="12" y="38" width="163" height="163" rx="14" class="mb-card"/><text class="mb-t" x="93" y="30" text-anchor="middle">MEGA</text>' + grid('mb', 18, 44, 30.2) +
        '<rect x="186" y="38" width="164" height="163" rx="14" class="mb-tray"/>' + slots + '<text class="mb-lc" x="93" y="219" text-anchor="middle"></text>' + banner(22).replace('translate(180 ', 'translate(268 ');
    },
    board: function (uid, l, oddTxt, o) { return ['0', '1', '2', '3+'].map(function (v, i) { return btn('l' + i, lab(v) + '<i>' + K.esc(i === 1 ? l.line : l.lines) + '</i>' + odd('l' + i, oddTxt, o), 'mb-b'); }).join(''); },
    hist: function (n) { return chipS(n, 'mbh' + Math.min(3, n)); },
    wins: function (res) { return ['l' + Math.min(3, +res.n)]; },
    init: function (c) { gridInit(c, 'mb'); c.ss = [].slice.call(c.box.querySelectorAll('.mb-s')).map(function (g) { return { g: g, t: g.querySelector('text') }; }); c.lc = c.q('.mb-lc'); bnInit(c); },
    frame: function (c, R, t, e, res) {
      var cd = res ? res.cd : (R && R.pre ? R.pre.cd : null), k;
      gridCard(c, cd, '★');
      if (!res) { gridMarks(c, cd, {}, [], 18, 44, 30.2, -1); c.ss.forEach(function (s) { sa(s.g, 'opacity', '0'); }); txt(c.lc, ''); if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var b = res.b || [], called = {}, n = 0, last = -1;
      for (k = 0; k < MB_N; k++) {
        var s = c.ss[k], a = mbT(k);
        if (e < a || b[k] == null) { sa(s.g, 'opacity', '0'); continue; }
        called[b[k]] = 1; n++; last = b[k]; txt(s.t, String(b[k]));
        var q = eo(seg(e, a, a + .3)), x = 203 + (k % 5) * 32.5, y = 56 + Math.floor(k / 5) * 27;
        if (k === MB_N - 1) { x = 268; y = 56 + 5 * 27; }
        sa(s.g, 'opacity', '1'); sa(s.g, 'transform', tr(lerp(268, x, q), lerp(-10, y, q), (k === MB_N - 1 ? 1 + .25 * Math.sin(Math.min(1, e - a) * Math.PI) : 1)));
      }
      var lines = c.lk === n + c.cdKey ? c.lv : (c.lk = n + c.cdKey, c.lv = cardLines(cd, called));
      gridMarks(c, cd, called, lines, 18, 44, 30.2, last);
      txt(c.lc, lines.length + ' ' + (lines.length === 1 ? c.l.line : c.l.lines), 150);
      var w = e >= mbT(MB_N - 1) + .8;
      bnSet(c, w ? lines.length + ' ' + (lines.length === 1 ? c.l.line : c.l.lines) : '', 'n0');
    }
  });

  /* ============================================================== Dealer Bust ============================================================== */
  var BU_0 = .4, BU_I = 1.1;
  function bjTot(ks) { var t = 0, a = false; ks.forEach(function (c) { var r = cRank(c); t += Math.min(10, r); if (r === 1) a = true; }); return { hard: t, best: a && t + 10 <= 21 ? t + 10 : t, soft: a && t + 10 <= 21 }; }
  live('bustlive', {
    lab: 'dp', bev: 'card', show: function (res) { return BU_0 + (res.k || []).length * BU_I + 1.6; },
    odds0: { bu: 3.33, s17: 6.47, s18: 6.73, s19: 7.04, s20: 5.21, s21: 12.92, bj: 19.85 },
    beat: function (e) { return e < BU_0 ? 0 : 1 + Math.floor((e - BU_0) / BU_I); },
    rules: rules(145, { bu: 3.33, s17: 6.47, s18: 6.73, s19: 7.04, s20: 5.21, s21: 12.92, bj: 19.85 }, {
      en: ['Only the blackjack dealer plays. Bet on how the dealer’s hand ends: Bust over 21 ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 21 with 3+ cards ({s21}) or Blackjack, 21 with the first two cards ({bj}).', 'The dealer draws until 17 or more and stands on all 17s (also soft 17). Ace = 1 or 11, J Q K = 10. Each card is drawn at random from a continuously shuffled shoe.'],
      fr: ['Seul le croupier de blackjack joue. Parie sur la fin de sa main : Bust au-delà de 21 ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 21 en 3 cartes ou plus ({s21}) ou Blackjack, 21 avec les deux premières cartes ({bj}).', 'Le croupier tire jusqu’à 17 ou plus et reste sur tous les 17 (même souples). As = 1 ou 11, V D R = 10. Chaque carte est tirée au hasard d’un sabot mélangé en continu.'],
      es: ['Solo juega el crupier de blackjack. Apuesta a cómo termina su mano: se pasa de 21 ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 21 con 3 cartas o más ({s21}) o Blackjack, 21 con las dos primeras cartas ({bj}).', 'El crupier pide hasta 17 o más y se planta en todos los 17 (también blandos). As = 1 u 11, J Q K = 10. Cada carta sale al azar de un zapato barajado sin parar.'],
      pt: ['Só o crupiê de blackjack joga. Aposte em como termina a mão dele: Estoura acima de 21 ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 21 com 3+ cartas ({s21}) ou Blackjack, 21 com as duas primeiras cartas ({bj}).', 'O crupiê compra até 17 ou mais e para em todos os 17 (inclusive suaves). Ás = 1 ou 11, J Q K = 10. Cada carta sai ao acaso de um sapato embaralhado continuamente.'],
      ar: ['يلعب موزّع البلاك جاك وحده. راهن على نهاية يده: تجاوز 21 ({bu})، 17 ({s17})، 18 ({s18})، 19 ({s19})، 20 ({s20})، 21 بثلاث أوراق أو أكثر ({s21}) أو بلاك جاك، 21 بأول ورقتين ({bj}).', 'يسحب الموزّع حتى 17 أو أكثر ويتوقف عند كل 17 (حتى الناعمة). الآس = 1 أو 11، والصور = 10. كل ورقة تُسحب عشوائيًا من حذاء يُخلط باستمرار.'],
      tr: ['Yalnızca blackjack krupiyesi oynar. Elinin nasıl biteceğine oyna: 21’i aşar ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 3+ kartla 21 ({s21}) ya da ilk iki kartla 21, Blackjack ({bj}).', 'Krupiye 17 veya üstüne kadar kart çeker ve tüm 17’lerde (yumuşak dahil) durur. As = 1 veya 11, J Q K = 10. Her kart sürekli karıştırılan kutudan rastgele çekilir.'],
      vi: ['Chỉ nhà cái blackjack rút bài. Cược kết thúc tay của nhà cái: Quắc quá 21 ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 21 với 3 lá trở lên ({s21}) hoặc Blackjack, 21 với hai lá đầu ({bj}).', 'Nhà cái rút đến khi đạt 17 trở lên và dừng ở mọi 17 (kể cả 17 mềm). A = 1 hoặc 11, J Q K = 10. Mỗi lá rút ngẫu nhiên từ hộp bài xáo liên tục.'],
      id: ['Hanya bandar blackjack yang bermain. Pasang akhir tangan bandar: Bust lewat 21 ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 21 dengan 3+ kartu ({s21}) atau Blackjack, 21 dengan dua kartu pertama ({bj}).', 'Bandar menarik kartu sampai 17 atau lebih dan berhenti di semua 17 (termasuk soft). As = 1 atau 11, J Q K = 10. Setiap kartu diambil acak dari shoe yang terus dikocok.'],
      ru: ['Играет только дилер блэкджека. Ставьте на итог его руки: Перебор больше 21 ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 21 из 3+ карт ({s21}) или Блэкджек, 21 с первых двух карт ({bj}).', 'Дилер берёт карты до 17 и больше и останавливается на любых 17 (и мягких). Туз = 1 или 11, В Д К = 10. Каждая карта берётся случайно из постоянно тасуемого шуза.'],
      de: ['Nur der Blackjack-Dealer spielt. Setze darauf, wie seine Hand endet: Bust über 21 ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 21 mit 3+ Karten ({s21}) oder Blackjack, 21 mit den ersten zwei Karten ({bj}).', 'Der Dealer zieht bis 17 oder mehr und steht auf allen 17 (auch soft). Ass = 1 oder 11, B D K = 10. Jede Karte kommt zufällig aus einem ständig gemischten Schlitten.'],
      hi: ['सिर्फ़ ब्लैकजैक डीलर खेलता है। उसके हाथ के अंत पर दांव लगाएं: 21 से ऊपर बस्ट ({bu}), 17 ({s17}), 18 ({s18}), 19 ({s19}), 20 ({s20}), 3+ पत्तों से 21 ({s21}) या ब्लैकजैक, पहले दो पत्तों से 21 ({bj})।', 'डीलर 17 या ज़्यादा तक पत्ते लेता है और हर 17 (सॉफ़्ट भी) पर रुकता है। इक्का = 1 या 11, J Q K = 10। हर पत्ता लगातार फेंटे जाने वाले शू से रैंडम आता है।'],
      zh: ['只有二十一点庄家补牌。押庄家手牌的结局：爆牌超过 21（{bu}）、17（{s17}）、18（{s18}）、19（{s19}）、20（{s20}）、三张及以上 21（{s21}）或黑杰克，前两张即 21（{bj}）。', '庄家补牌到 17 点或以上，所有 17 点（含软 17）都停牌。A = 1 或 11，J Q K = 10。每张牌从连续洗牌的牌靴中随机抽出。']
    }),
    scene: function (uid, l) {
      var cards = ''; for (var i = 0; i < 9; i++) cards += cardEl('bu-c', ['#7F1D1D', '#B91C1C']);
      return '<defs>' + felt(uid, '#065F46', '#022C22') + '</defs>' + table(uid, '#011A12', '#CA8A04') +
        '<path d="M24 26Q180 250 336 26" class="bu-arc"/><path d="M50 26Q180 205 310 26" class="bu-arc2"/>' +
        '<text class="bu-d" x="180" y="40" text-anchor="middle">' + K.esc(l.dealer) + '</text>' +
        '<g class="bu-tg" transform="translate(180 176)"><circle r="24" class="bu-tc"/><text class="bu-t" y="7" text-anchor="middle"></text></g>' +
        shoe(318, 24, ['#7F1D1D', '#B91C1C']) + cards +
        '<g class="bu-st" opacity="0" transform="translate(180 178) rotate(-6)"><rect x="-70" y="-22" width="140" height="44" rx="10"/><text y="11" text-anchor="middle"></text></g>' + banner(214);
    },
    board: function (uid, l, oddTxt, o) {
      return btn('bu', lab(l.bust) + odd('bu', oddTxt, o), 'bu-b bu') + ['17', '18', '19', '20', '21'].map(function (v) { return btn('s' + v, lab(v) + odd('s' + v, oddTxt, o), 'bu-b'); }).join('') + btn('bj', lab('BJ') + odd('bj', oddTxt, o), 'bu-b bj');
    },
    hist: function (n) { return n === 0 ? chipS('✕', 'buh0') : n === 22 ? chipS('BJ', 'buh2') : chipS(n, 'buh1'); },
    wins: function (res) { var n = +res.n; return [n === 0 ? 'bu' : n === 22 ? 'bj' : 's' + n]; },
    init: function (c) { c.cs = cardsInit(c, '.bu-c'); c.tt = c.q('.bu-t'); c.st = c.q('.bu-st'); c.tg = c.q('.bu-tg'); c.stt = c.st.querySelector('text'); bnInit(c); },
    frame: function (c, R, t, e, res) {
      if (!res) { hideCards(c.cs); txt(c.tt, ''); sa(c.st, 'opacity', '0'); sa(c.tg, 'opacity', '1'); if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var ks = (res.k || []).slice(0, 9), m = ks.length, sp = Math.min(46, 250 / Math.max(1, m)), x0 = 180 - (m - 1) * sp / 2, shown = [];
      for (var i = 0; i < 9; i++) {
        if (i >= m) { cardPose(c.cs[i], 0, 0, 1, 0, 0, 0); continue; }
        var a = BU_0 + i * BU_I; deal(c.cs[i], ks[i], e, a, .45, 318, 24, .45, x0 + i * sp, 104, 1, (i - (m - 1) / 2) * 2, a + .45);
        if (e >= a + .7) shown.push(ks[i]);
      }
      var tt = bjTot(shown), n = +res.n, done = e >= BU_0 + (m - 1) * BU_I + .9;
      txt(c.tt, shown.length ? (tt.hard > 21 ? String(tt.hard) : tt.soft && !done ? tt.hard + '/' + tt.best : String(tt.best)) : '', 44);
      sa(c.st, 'opacity', done ? '1' : '0'); sa(c.tg, 'opacity', done ? '0' : '1'); cls(c.st, 'bu-st ' + (n === 0 ? 'x' : n === 22 ? 'bj' : 'ok'));
      txt(c.stt, n === 0 ? c.l.bust : n === 22 ? c.l.bj : String(n), 120);
      bnSet(c, '', '');
    }
  });
})(window.D6 = window.D6 || {});
