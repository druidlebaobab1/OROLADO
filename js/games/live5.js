/* v2901 — LIVE 5 (owner request, round 5): 16 NEW live games "races & sports", one shared round for everyone (same server engine
   as Lucky Planets, live2, live3 and live4: casino_live5.php CASINO_LIVE5 + casino_draw_*, public state casino-tour.php?g=<key>,
   polled ~8 s, precise at close / result / next round). Odds = 0.94 ÷ exact chance, rounded down (6 % margin on every bet).
   Races: dogracelive Dog Race · camelracelive Camel Race · snailracelive Snail Race · chickenracelive Chicken Race · boatracelive
   Boat Race · spaceracelive Space Race. Sports & shows: monsterlive Monster Truck · penaltylive Penalty Shootout · basketlive
   Basketball Shots · boxinglive Boxing · tennislive Tennis Rally · cricketlive Cricket Over · archerylive Archery · fishinglive
   Fishing · balloonlive Balloon Pop · volcanolive Volcano.
   Everything is drawn from (drawn result + its show seed, time since bets closed): every viewer sees the same film, joining late too.
   One requestAnimationFrame loop (K.S.raf), attributes written only when they change, no filters per frame. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bo: 'Place your bets', lastc: 'Bets closing', bclosed: 'Bets closed', rs: 'Results', nx: 'Next round in', mc: 'Market closed', placed: 'Bet placed', bet: 'Place bet', pick: 'Make your choice first', wins: 'wins',
      rc: 'Race in progress', jp: 'Monster jump', pk: 'Penalty shootout', sh: 'Shooting', fg: 'Fight in progress', ral: 'Rally in progress', ov: 'Over in progress', ar: 'Arrows flying', fi: 'Fishing', bp: 'Darts flying', er: 'Eruption',
      odd: 'Odd', even: 'Even', last: 'Last', top2: 'Top 2', gold: 'Gold', cyan: 'Cyan', pink: 'Pink', cars: 'cars', perfect: 'Perfect', home: 'Home', away: 'Away', sd: 'Sudden death', early: 'Early win',
      streak: '4 in a row', red: 'Red', blue: 'Blue', draw: 'Draw', pts: 'Points', srv: 'Server', rcv: 'Receiver', shots: 'shots', six: 'Six', wkt: 'Wicket', runs: 'runs', ten: 'A 10',
      boot: 'Boot', small: 'Small', medium: 'Medium', bigf: 'Big', shark: 'Shark', goldf: 'Golden', bigc: 'Big catch', r2: '2+ Red', b2: '2+ Blue', g2: '2+ Green', mix: '3 colours', tri: '3 alike',
      left: 'Left', right: 'Right', goal: 'Goal!', saved: 'Saved!', round: 'Round', power: 'Power', out: 'Out!' },
    fr: { bo: 'Pariez maintenant', lastc: 'Clôture des paris', bclosed: 'Paris fermés', rs: 'Résultats', nx: 'Prochain tour dans', mc: 'Marché fermé', placed: 'Pari enregistré', bet: 'Parier', pick: 'Faites d’abord votre choix', wins: 'gagne',
      rc: 'Course en cours', jp: 'Saut du monster', pk: 'Tirs au but', sh: 'Tirs en cours', fg: 'Combat en cours', ral: 'Échange en cours', ov: 'Over en cours', ar: 'Flèches en vol', fi: 'Pêche en cours', bp: 'Fléchettes en vol', er: 'Éruption',
      odd: 'Impair', even: 'Pair', last: 'Dernier', top2: 'Top 2', gold: 'Or', cyan: 'Cyan', pink: 'Rose', cars: 'voitures', perfect: 'Parfait', home: 'Domicile', away: 'Extérieur', sd: 'Mort subite', early: 'Gagné tôt',
      streak: '4 de suite', red: 'Rouge', blue: 'Bleu', draw: 'Nul', pts: 'Aux points', srv: 'Serveur', rcv: 'Relanceur', shots: 'coups', six: 'Six', wkt: 'Guichet', runs: 'points', ten: 'Un 10',
      boot: 'Botte', small: 'Petit', medium: 'Moyen', bigf: 'Gros', shark: 'Requin', goldf: 'Doré', bigc: 'Grosse prise', r2: '2+ rouges', b2: '2+ bleus', g2: '2+ verts', mix: '3 couleurs', tri: '3 pareils',
      left: 'Gauche', right: 'Droite', goal: 'But !', saved: 'Arrêté !', round: 'Round', power: 'Puissance', out: 'Faute !' },
    es: { bo: 'Apueste ahora', lastc: 'Cierre de apuestas', bclosed: 'Apuestas cerradas', rs: 'Resultados', nx: 'Próxima ronda en', mc: 'Mercado cerrado', placed: 'Apuesta registrada', bet: 'Apostar', pick: 'Elija primero', wins: 'gana',
      rc: 'Carrera en curso', jp: 'Salto del monster', pk: 'Tanda de penaltis', sh: 'Lanzamientos', fg: 'Combate en curso', ral: 'Peloteo en curso', ov: 'Over en curso', ar: 'Flechas en vuelo', fi: 'Pescando', bp: 'Dardos en vuelo', er: 'Erupción',
      odd: 'Impar', even: 'Par', last: 'Último', top2: 'Top 2', gold: 'Oro', cyan: 'Cian', pink: 'Rosa', cars: 'coches', perfect: 'Perfecto', home: 'Local', away: 'Visitante', sd: 'Muerte súbita', early: 'Gana pronto',
      streak: '4 seguidos', red: 'Rojo', blue: 'Azul', draw: 'Empate', pts: 'Puntos', srv: 'Sacador', rcv: 'Restador', shots: 'golpes', six: 'Seis', wkt: 'Wicket', runs: 'carreras', ten: 'Un 10',
      boot: 'Bota', small: 'Pequeño', medium: 'Mediano', bigf: 'Grande', shark: 'Tiburón', goldf: 'Dorado', bigc: 'Gran captura', r2: '2+ rojos', b2: '2+ azules', g2: '2+ verdes', mix: '3 colores', tri: '3 iguales',
      left: 'Izquierda', right: 'Derecha', goal: '¡Gol!', saved: '¡Parada!', round: 'Asalto', power: 'Potencia', out: '¡Fuera!' },
    pt: { bo: 'Aposte agora', lastc: 'Encerramento das apostas', bclosed: 'Apostas encerradas', rs: 'Resultados', nx: 'Próxima rodada em', mc: 'Mercado fechado', placed: 'Aposta registrada', bet: 'Apostar', pick: 'Escolha primeiro', wins: 'vence',
      rc: 'Corrida em andamento', jp: 'Salto do monster', pk: 'Disputa de pênaltis', sh: 'Arremessos', fg: 'Luta em andamento', ral: 'Troca de bolas', ov: 'Over em andamento', ar: 'Flechas no ar', fi: 'Pescando', bp: 'Dardos no ar', er: 'Erupção',
      odd: 'Ímpar', even: 'Par', last: 'Último', top2: 'Top 2', gold: 'Ouro', cyan: 'Ciano', pink: 'Rosa', cars: 'carros', perfect: 'Perfeito', home: 'Casa', away: 'Fora', sd: 'Morte súbita', early: 'Vitória cedo',
      streak: '4 seguidos', red: 'Vermelho', blue: 'Azul', draw: 'Empate', pts: 'Pontos', srv: 'Sacador', rcv: 'Recebedor', shots: 'golpes', six: 'Six', wkt: 'Wicket', runs: 'corridas', ten: 'Um 10',
      boot: 'Bota', small: 'Pequeno', medium: 'Médio', bigf: 'Grande', shark: 'Tubarão', goldf: 'Dourado', bigc: 'Grande pesca', r2: '2+ vermelhos', b2: '2+ azuis', g2: '2+ verdes', mix: '3 cores', tri: '3 iguais',
      left: 'Esquerda', right: 'Direita', goal: 'Gol!', saved: 'Defesa!', round: 'Round', power: 'Potência', out: 'Fora!' },
    ar: { bo: 'ضع رهانك الآن', lastc: 'الرهانات تُغلق قريبًا', bclosed: 'الرهانات مغلقة', rs: 'النتائج', nx: 'الجولة التالية خلال', mc: 'السوق مغلق', placed: 'تم تسجيل الرهان', bet: 'راهن', pick: 'اختر أولاً', wins: 'يفوز',
      rc: 'السباق جارٍ', jp: 'قفزة الشاحنة', pk: 'ركلات الترجيح', sh: 'التسديد جارٍ', fg: 'النزال جارٍ', ral: 'تبادل الكرات', ov: 'الأوفر جارٍ', ar: 'السهام تطير', fi: 'الصيد جارٍ', bp: 'السهام تطير', er: 'ثوران',
      odd: 'فردي', even: 'زوجي', last: 'الأخير', top2: 'أول 2', gold: 'ذهبي', cyan: 'سماوي', pink: 'وردي', cars: 'سيارات', perfect: 'مثالي', home: 'المضيف', away: 'الضيف', sd: 'موت مفاجئ', early: 'فوز مبكر',
      streak: '4 متتالية', red: 'أحمر', blue: 'أزرق', draw: 'تعادل', pts: 'بالنقاط', srv: 'المُرسِل', rcv: 'المستقبِل', shots: 'ضربات', six: 'ستة', wkt: 'ويكت', runs: 'نقاط', ten: 'إصابة 10',
      boot: 'حذاء', small: 'صغيرة', medium: 'متوسطة', bigf: 'كبيرة', shark: 'قرش', goldf: 'ذهبية', bigc: 'صيد كبير', r2: '2+ حمراء', b2: '2+ زرقاء', g2: '2+ خضراء', mix: '3 ألوان', tri: '3 متشابهة',
      left: 'يسار', right: 'يمين', goal: 'هدف!', saved: 'تصدٍّ!', round: 'جولة', power: 'القوة', out: 'خارج!' },
    tr: { bo: 'Bahislerinizi yapın', lastc: 'Bahisler kapanıyor', bclosed: 'Bahisler kapandı', rs: 'Sonuçlar', nx: 'Sonraki tur', mc: 'Piyasa kapalı', placed: 'Bahis alındı', bet: 'Bahis yap', pick: 'Önce seçiminizi yapın', wins: 'kazanır',
      rc: 'Yarış sürüyor', jp: 'Monster atlayışı', pk: 'Penaltı atışları', sh: 'Atışlar sürüyor', fg: 'Maç sürüyor', ral: 'Ralli sürüyor', ov: 'Over sürüyor', ar: 'Oklar uçuyor', fi: 'Balık tutuluyor', bp: 'Oklar uçuyor', er: 'Patlama',
      odd: 'Tek', even: 'Çift', last: 'Son', top2: 'İlk 2', gold: 'Altın', cyan: 'Turkuaz', pink: 'Pembe', cars: 'araba', perfect: 'Kusursuz', home: 'Ev sahibi', away: 'Deplasman', sd: 'Ani ölüm', early: 'Erken galibiyet',
      streak: 'Üst üste 4', red: 'Kırmızı', blue: 'Mavi', draw: 'Berabere', pts: 'Puanla', srv: 'Servisçi', rcv: 'Karşılayan', shots: 'vuruş', six: 'Altılık', wkt: 'Wicket', runs: 'sayı', ten: 'Bir 10',
      boot: 'Çizme', small: 'Küçük', medium: 'Orta', bigf: 'Büyük', shark: 'Köpekbalığı', goldf: 'Altın', bigc: 'Büyük av', r2: '2+ kırmızı', b2: '2+ mavi', g2: '2+ yeşil', mix: '3 renk', tri: '3 aynı',
      left: 'Sol', right: 'Sağ', goal: 'Gol!', saved: 'Kurtarış!', round: 'Raunt', power: 'Güç', out: 'Dışarı!' },
    vi: { bo: 'Mời đặt cược', lastc: 'Sắp đóng cược', bclosed: 'Đã đóng cược', rs: 'Kết quả', nx: 'Vòng tiếp theo sau', mc: 'Thị trường đóng cửa', placed: 'Đã đặt cược', bet: 'Đặt cược', pick: 'Hãy chọn trước', wins: 'thắng',
      rc: 'Đang đua', jp: 'Xe tải bay', pk: 'Loạt sút luân lưu', sh: 'Đang ném rổ', fg: 'Đang thi đấu', ral: 'Đang đánh qua lại', ov: 'Đang ném over', ar: 'Mũi tên đang bay', fi: 'Đang câu cá', bp: 'Phi tiêu đang bay', er: 'Phun trào',
      odd: 'Lẻ', even: 'Chẵn', last: 'Bét', top2: 'Top 2', gold: 'Vàng', cyan: 'Lục lam', pink: 'Hồng', cars: 'xe', perfect: 'Hoàn hảo', home: 'Chủ nhà', away: 'Đội khách', sd: 'Đá thêm', early: 'Thắng sớm',
      streak: '4 liên tiếp', red: 'Đỏ', blue: 'Xanh', draw: 'Hòa', pts: 'Tính điểm', srv: 'Người giao', rcv: 'Người đỡ', shots: 'cú', six: 'Six', wkt: 'Wicket', runs: 'điểm', ten: 'Một 10',
      boot: 'Ủng', small: 'Nhỏ', medium: 'Vừa', bigf: 'To', shark: 'Cá mập', goldf: 'Cá vàng', bigc: 'Mẻ lớn', r2: '2+ đỏ', b2: '2+ xanh', g2: '2+ lục', mix: '3 màu', tri: '3 giống',
      left: 'Trái', right: 'Phải', goal: 'Vào!', saved: 'Cản phá!', round: 'Hiệp', power: 'Sức mạnh', out: 'Hỏng!' },
    id: { bo: 'Pasang taruhan Anda', lastc: 'Taruhan segera ditutup', bclosed: 'Taruhan ditutup', rs: 'Hasil', nx: 'Ronde berikutnya dalam', mc: 'Pasar tutup', placed: 'Taruhan tercatat', bet: 'Pasang', pick: 'Pilih dulu', wins: 'menang',
      rc: 'Balapan berlangsung', jp: 'Lompatan monster', pk: 'Adu penalti', sh: 'Menembak', fg: 'Laga berlangsung', ral: 'Reli berlangsung', ov: 'Over berlangsung', ar: 'Panah melesat', fi: 'Memancing', bp: 'Anak panah melesat', er: 'Erupsi',
      odd: 'Ganjil', even: 'Genap', last: 'Terakhir', top2: 'Top 2', gold: 'Emas', cyan: 'Sian', pink: 'Merah muda', cars: 'mobil', perfect: 'Sempurna', home: 'Tuan rumah', away: 'Tamu', sd: 'Sudden death', early: 'Menang cepat',
      streak: '4 beruntun', red: 'Merah', blue: 'Biru', draw: 'Seri', pts: 'Poin', srv: 'Pelayan', rcv: 'Penerima', shots: 'pukulan', six: 'Six', wkt: 'Wicket', runs: 'run', ten: 'Sebuah 10',
      boot: 'Sepatu bot', small: 'Kecil', medium: 'Sedang', bigf: 'Besar', shark: 'Hiu', goldf: 'Emas', bigc: 'Tangkapan besar', r2: '2+ merah', b2: '2+ biru', g2: '2+ hijau', mix: '3 warna', tri: '3 sama',
      left: 'Kiri', right: 'Kanan', goal: 'Gol!', saved: 'Ditepis!', round: 'Ronde', power: 'Kekuatan', out: 'Keluar!' },
    ru: { bo: 'Делайте ставки', lastc: 'Приём ставок завершается', bclosed: 'Ставки закрыты', rs: 'Результаты', nx: 'Следующий раунд через', mc: 'Рынок закрыт', placed: 'Ставка принята', bet: 'Поставить', pick: 'Сначала сделайте выбор', wins: 'побеждает',
      rc: 'Идёт забег', jp: 'Прыжок монстра', pk: 'Серия пенальти', sh: 'Идут броски', fg: 'Идёт бой', ral: 'Идёт розыгрыш', ov: 'Идёт овер', ar: 'Стрелы летят', fi: 'Идёт рыбалка', bp: 'Дротики летят', er: 'Извержение',
      odd: 'Нечёт', even: 'Чёт', last: 'Последний', top2: 'Топ-2', gold: 'Золото', cyan: 'Бирюза', pink: 'Розовые', cars: 'машин', perfect: 'Идеально', home: 'Хозяева', away: 'Гости', sd: 'До промаха', early: 'Досрочно',
      streak: '4 подряд', red: 'Красный', blue: 'Синий', draw: 'Ничья', pts: 'По очкам', srv: 'Подающий', rcv: 'Принимающий', shots: 'ударов', six: 'Шестёрка', wkt: 'Калитка', runs: 'ранов', ten: 'Десятка',
      boot: 'Сапог', small: 'Мелкая', medium: 'Средняя', bigf: 'Крупная', shark: 'Акула', goldf: 'Золотая', bigc: 'Крупный улов', r2: '2+ красных', b2: '2+ синих', g2: '2+ зелёных', mix: '3 цвета', tri: '3 одинаковых',
      left: 'Влево', right: 'Вправо', goal: 'Гол!', saved: 'Сейв!', round: 'Раунд', power: 'Сила', out: 'Аут!' },
    de: { bo: 'Jetzt setzen', lastc: 'Einsätze schließen gleich', bclosed: 'Einsätze geschlossen', rs: 'Ergebnisse', nx: 'Nächste Runde in', mc: 'Markt geschlossen', placed: 'Einsatz platziert', bet: 'Setzen', pick: 'Bitte zuerst wählen', wins: 'gewinnt',
      rc: 'Rennen läuft', jp: 'Monster-Sprung', pk: 'Elfmeterschießen', sh: 'Würfe laufen', fg: 'Kampf läuft', ral: 'Ballwechsel läuft', ov: 'Over läuft', ar: 'Pfeile fliegen', fi: 'Angeln', bp: 'Pfeile fliegen', er: 'Ausbruch',
      odd: 'Ungerade', even: 'Gerade', last: 'Letzter', top2: 'Top 2', gold: 'Gold', cyan: 'Cyan', pink: 'Pink', cars: 'Autos', perfect: 'Perfekt', home: 'Heim', away: 'Gast', sd: 'Sudden Death', early: 'Früh entschieden',
      streak: '4 in Folge', red: 'Rot', blue: 'Blau', draw: 'Remis', pts: 'Nach Punkten', srv: 'Aufschläger', rcv: 'Rückschläger', shots: 'Schläge', six: 'Six', wkt: 'Wicket', runs: 'Runs', ten: 'Eine 10',
      boot: 'Stiefel', small: 'Klein', medium: 'Mittel', bigf: 'Groß', shark: 'Hai', goldf: 'Goldfisch', bigc: 'Großer Fang', r2: '2+ Rot', b2: '2+ Blau', g2: '2+ Grün', mix: '3 Farben', tri: '3 gleiche',
      left: 'Links', right: 'Rechts', goal: 'Tor!', saved: 'Gehalten!', round: 'Runde', power: 'Stärke', out: 'Aus!' },
    hi: { bo: 'अभी दांव लगाएं', lastc: 'दांव बंद होने वाले हैं', bclosed: 'दांव बंद', rs: 'नतीजे', nx: 'अगला राउंड', mc: 'बाज़ार बंद', placed: 'दांव दर्ज हुआ', bet: 'दांव लगाएं', pick: 'पहले चुनें', wins: 'जीता',
      rc: 'रेस जारी है', jp: 'मॉन्स्टर जंप', pk: 'पेनल्टी शूटआउट', sh: 'शॉट जारी हैं', fg: 'मुकाबला जारी है', ral: 'रैली जारी है', ov: 'ओवर जारी है', ar: 'तीर उड़ रहे हैं', fi: 'मछली पकड़ रहे हैं', bp: 'डार्ट उड़ रहे हैं', er: 'विस्फोट',
      odd: 'विषम', even: 'सम', last: 'आख़िरी', top2: 'टॉप 2', gold: 'सुनहरा', cyan: 'आसमानी', pink: 'गुलाबी', cars: 'कारें', perfect: 'परफ़ेक्ट', home: 'होम', away: 'अवे', sd: 'सडन डेथ', early: 'जल्दी जीत',
      streak: 'लगातार 4', red: 'लाल', blue: 'नीला', draw: 'ड्रॉ', pts: 'अंकों से', srv: 'सर्वर', rcv: 'रिसीवर', shots: 'शॉट', six: 'छक्का', wkt: 'विकेट', runs: 'रन', ten: 'एक 10',
      boot: 'जूता', small: 'छोटी', medium: 'मध्यम', bigf: 'बड़ी', shark: 'शार्क', goldf: 'सुनहरी', bigc: 'बड़ी पकड़', r2: '2+ लाल', b2: '2+ नीले', g2: '2+ हरे', mix: '3 रंग', tri: '3 एक जैसे',
      left: 'बाएँ', right: 'दाएँ', goal: 'गोल!', saved: 'बचाव!', round: 'राउंड', power: 'ताक़त', out: 'आउट!' },
    zh: { bo: '请下注', lastc: '即将停止下注', bclosed: '停止下注', rs: '开奖结果', nx: '下一局', mc: '暂停交易', placed: '已下注', bet: '下注', pick: '请先选择', wins: '胜',
      rc: '比赛进行中', jp: '怪兽卡车飞跃', pk: '点球大战', sh: '投篮中', fg: '拳赛进行中', ral: '多拍对打中', ov: '本轮投球中', ar: '箭矢飞行中', fi: '钓鱼中', bp: '飞镖飞行中', er: '火山喷发',
      odd: '单号', even: '双号', last: '最后', top2: '前二', gold: '金队', cyan: '青队', pink: '粉队', cars: '辆车', perfect: '完美', home: '主队', away: '客队', sd: '突然死亡', early: '提前决胜',
      streak: '连中 4 球', red: '红方', blue: '蓝方', draw: '平局', pts: '点数胜', srv: '发球方', rcv: '接球方', shots: '拍', six: '六分球', wkt: '出局', runs: '分', ten: '命中 10 环',
      boot: '靴子', small: '小鱼', medium: '中鱼', bigf: '大鱼', shark: '鲨鱼', goldf: '金鱼', bigc: '大收获', r2: '2+ 红', b2: '2+ 蓝', g2: '2+ 绿', mix: '三色', tri: '三同色',
      left: '左', right: '右', goal: '进球！', saved: '扑出！', round: '回合', power: '威力', out: '出界！' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
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
      box.classList.add('cg-game', 'cg-live5', 'cg-' + key);
      box.innerHTML = '<div class="cg-stage l5-stage" data-ph="open"><div class="l5-head"><span class="l5-live"><i></i><b>LIVE</b></span><b class="l5-ph fit"></b><em class="l5-tm fit"></em></div>' +
        '<i class="l5-bar"><b></b></i>' +
        '<div class="l5-scene"><svg class="l5-svg" viewBox="0 0 360 230" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + G.scene(uid, l) + '</svg></div>' +
        '<div class="l5-last"></div></div>' +
        K.stakePanel(l.bet, '<div class="l5-board l5-b-' + key + '" dir="ltr">' + G.board(uid, l, oddTxt, G.odds0 || {}) + '</div>');
      K.bindStake(box);
      var q = function (s) { return box.querySelector(s); };
      var ph = q('.l5-ph'), tm = q('.l5-tm'), bar = q('.l5-bar b'), barB = q('.l5-bar'), go = $('csGo'), stage = q('.l5-stage'), lastEl = q('.l5-last'), svg = q('.l5-svg');
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
          if (st.cls !== cl) { st.cls = cl; barB.className = 'l5-bar ' + cl; stage.setAttribute('data-ph', cl); }
          G.frame(ctx, R, t, e, bet ? null : res, st.odds);
          if (bet) st.goArm = R.i; else if (st.goArm === R.i && e < 1.5) { st.goArm = -1; K.sfx('go'); }
          if (!bet && res && e >= 0 && e < SH && G.beat) K.sfxBeat(st, 'bt', G.beat(e, res, R), G.bev || 'tick');
          var aOn = !bet && !!res && e >= 0 && e < SH;
          if (aOn !== ambOn) { ambOn = aOn; amb(aOn, aOn ? .6 : 0); }
          if (rev && st.revI !== R.i && e < SH + 1.5) { st.revI = R.i; try { if (D6.Sfx && D6.Sfx.play) D6.Sfx.play(G.endEv || 'coin', null, key); } catch (eP) { /* ignore */ } }
          var wins = rev ? G.wins(res).join(',') : '';
          if (wins !== wasWin) {
            wasWin = wins; var ws = wins ? wins.split(',') : [];
            stage.classList.toggle('l5-done', !!wins);
            box.querySelectorAll('[data-s]').forEach(function (b) { b.classList.toggle('win', ws.indexOf(b.getAttribute('data-s')) >= 0); });
          }
          var list = (R.last || []).slice(); if (rev) list.unshift(+res.n);
          var lk = R.i + ':' + list.join(',');
          if (lk !== st.lastKey) { st.lastKey = lk; lastEl.innerHTML = list.slice(0, 12).map(function (v, j) { return '<i class="l5-li' + (j === 0 && rev ? ' new' : '') + '">' + G.hist(+v, ctx) + '</i>'; }).join(''); }
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

  function hs(s, k) { return hr(s, k * 7919 + 13); } // seeded 0…1 from the show seed
  function badge(k, col, fg, r) { r = r || 9; return '<circle r="' + r + '" fill="' + col + '" stroke="#fff" stroke-opacity=".85" stroke-width="1.2"/><text y="' + (r * .42).toFixed(1) + '" text-anchor="middle" font-size="' + (r * 1.2).toFixed(1) + '" font-weight="900" fill="' + (fg || '#fff') + '">' + k + '</text>'; }
  function badgeSvg(k, col, fg) { return '<svg viewBox="-10 -10 20 20">' + badge(k, col, fg) + '</svg>'; }
  function chipS(t, cl) { return '<span class="h-c ' + cl + '">' + K.esc(String(t)) + '</span>'; }
  function chipB(k, col, fg) { return '<svg viewBox="-10 -10 20 20">' + badge(k, col, fg) + '</svg>'; }

  /* =============================================================== RACES ===============================================================
     A race = N runners in N lanes from the gate (x 44) to the finish (x 318). The drawn finishing order fixes when each one crosses
     (winner after D s, the others a seeded gap behind); in between each runner follows a seeded wavy pace (overtakes happen), always
     moving forward, and crosses EXACTLY at its time → the picture always matches the result. */
  var RS = 1.0, RX0 = 62, RX1 = 318, RY0 = 46, RY1 = 216;
  function raceTimes(res, cfg) {
    var o = (res.r || []).map(Number), s = +res.s || 0, T = [], t = cfg.D;
    for (var k = 0; k < o.length; k++) { if (k) t += cfg.gap[0] + hs(s, 50 + k) * (cfg.gap[1] - cfg.gap[0]); T[o[k]] = t; }
    return { T: T, o: o, last: t };
  }
  function racePos(cfg, s, i, e, Ti) {
    if (e <= RS) return 0;
    var tau = (e - RS) / Ti;
    if (tau >= 1) return 1 + Math.min(.03, (e - RS - Ti) * .03) * (1 - Math.exp(-(e - RS - Ti) * 2));
    var A = .035 + hs(s, i * 3 + 1) * .035, f = [.5, 1, 1.5][Math.floor(hs(s, i * 3 + 2) * 3)], ph = hs(s, i * 3 + 3) * 6.283;
    var p = tau + A * Math.sin(Math.PI * tau) * Math.sin(6.283 * f * tau + ph);
    return Math.max(0, Math.min(1, p));
  }
  function ordTxt(k) { return String(k + 1); }
  function race(key, cfg) {
    var N = cfg.cols.length, LH = (RY1 - RY0) / N, sc = Math.min(1.05, LH / 27);
    var showOf = function (res) { return RS + raceTimes(res, cfg).last + 2.2; };
    var laneY = function (i) { return RY0 + (i + .5) * LH; };
    live(key, {
      lab: 'rc', bev: 'tick', show: showOf, odds0: cfg.odds0, rules: cfg.rules,
      beat: function (e, res) { var tl = raceTimes(res, cfg).last; return e < RS ? 0 : e > RS + tl ? -1 : 1 + Math.floor((e - RS) / .42); },
      scene: function (uid, l) {
        var h = cfg.bg(uid, LH, N);
        for (var i = 0; i < N; i++) {
          var y = laneY(i);
          h += '<rect class="lnh" x="' + RX0 + '" y="' + (y - LH / 2 + 1).toFixed(1) + '" width="' + (RX1 - RX0 + 22) + '" height="' + (LH - 2).toFixed(1) + '" rx="6" fill="#FDE68A" fill-opacity=".12" stroke="#FDE68A" stroke-width="2" opacity="0"/>';
          if (cfg.trail) h += '<rect class="trl" x="' + (RX0 - 6) + '" y="' + (y + cfg.trail[0] * sc).toFixed(1) + '" width="0" height="' + (cfg.trail[1] * sc).toFixed(1) + '" rx="' + (cfg.trail[1] * sc / 2).toFixed(1) + '" fill="' + cfg.trail[2] + '" opacity="' + cfg.trail[3] + '"/>';
          h += '<g transform="translate(16 ' + y.toFixed(1) + ')">' + badge(i + 1, cfg.cols[i], cfg.fg && cfg.fg[i], Math.min(9, LH * .34)) + '</g>';
          h += '<g class="rk" opacity="0" transform="translate(342 ' + y.toFixed(1) + ')"><circle r="' + Math.min(9, LH * .34).toFixed(1) + '"/><text y="' + (Math.min(9, LH * .34) * .4).toFixed(1) + '" text-anchor="middle"></text></g>';
        }
        for (i = 0; i < N; i++) h += '<g class="rn" transform="translate(' + RX0 + ' ' + laneY(i).toFixed(1) + ') scale(' + sc.toFixed(3) + ')">' + cfg.sprite(i, uid) + '</g>';
        return h + banner(24);
      },
      board: cfg.board,
      hist: function (n) { return chipB(n + 1, cfg.cols[n] || '#64748B', cfg.fg && cfg.fg[n]); },
      wins: function (res) { return cfg.wins((res.r || []).map(Number)); },
      init: function (c) {
        c.rn = [].slice.call(c.box.querySelectorAll('.rn')).map(function (g) {
          var parts = [].slice.call(g.querySelectorAll('[data-a]')).map(function (p) { var a = p.getAttribute('data-a').split(' '); return { el: p, k: a[0], x: +a[1] || 0, y: +a[2] || 0, m: +a[3] || 1 }; });
          return { g: g, parts: parts };
        });
        c.rk = [].slice.call(c.box.querySelectorAll('.rk')).map(function (g) { return { g: g, t: g.querySelector('text'), c: g.querySelector('circle') }; });
        c.lnh = [].slice.call(c.box.querySelectorAll('.lnh')); c.trl = [].slice.call(c.box.querySelectorAll('.trl'));
        bnInit(c);
      },
      frame: function (c, R, t, e, res) {
        var i, run = !!res, tm = run ? raceTimes(res, cfg) : null, s = run ? +res.s || 0 : 0, lite = document.documentElement.classList.contains('oro-lite');
        for (i = 0; i < N; i++) {
          var r = c.rn[i], p = run ? racePos(cfg, s, i, e, tm.T[i]) : 0, x = RX0 + p * (RX1 - RX0), mv = run && e > RS && p < 1.05 && e < RS + tm.T[i] + 1.2;
          var spd = cfg.stride * (run ? 1 : .25), ph = (run ? Math.max(0, e - RS) : t) * spd + i * 1.7, bob = mv ? -Math.abs(Math.sin(ph)) * cfg.bob : Math.sin(t * 2 + i) * .4;
          sa(r.g, 'transform', 'translate(' + x.toFixed(1) + ' ' + (laneY(i) + bob * sc).toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
          if (!lite || mv) r.parts.forEach(function (q) {
            var a = mv ? Math.sin(ph + (q.k === 'b' ? Math.PI : 0)) : Math.sin(t * 1.5 + i) * .15;
            if (q.k === 'a' || q.k === 'b') sa(q.el, 'transform', 'rotate(' + (a * cfg.leg * q.m).toFixed(1) + ' ' + q.x + ' ' + q.y + ')');
            else if (q.k === 'f') sa(q.el, 'transform', 'translate(' + q.x + ' ' + q.y + ') scale(' + ((mv ? .8 + .5 * Math.abs(Math.sin(ph * 2.3)) : .35 + .1 * Math.sin(t * 6)) * q.m).toFixed(2) + ' 1)');
            else if (q.k === 's') sa(q.el, 'transform', 'translate(' + q.x + ' ' + q.y + ') scale(' + (1 + (mv ? .07 * Math.sin(ph) : 0)).toFixed(3) + ' ' + (1 - (mv ? .05 * Math.sin(ph) : 0)).toFixed(3) + ') translate(' + (-q.x) + ' ' + (-q.y) + ')');
            else if (q.k === 'o') sa(q.el, 'opacity', mv ? (.55 + .45 * Math.abs(Math.sin(ph))).toFixed(2) : '0');
          });
          if (c.trl[i]) sa(c.trl[i], 'width', Math.max(0, x - RX0 - (cfg.trail[4] || 10) * sc).toFixed(1));
          var crossed = run && e >= RS + tm.T[i], rank = run ? tm.o.indexOf(i) : -1, k = c.rk[i];
          sa(k.g, 'opacity', crossed ? '1' : '0');
          if (crossed) { txt(k.t, ordTxt(rank)); cls(k.g, 'rk r' + Math.min(3, rank)); }
        }
        var done = run && e >= RS + tm.T[tm.o[0]] + .3, w = run ? tm.o[0] : -1, pulse = (.65 + .35 * Math.sin(t * 5)).toFixed(2);
        c.lnh.forEach(function (g, j) { sa(g, 'opacity', done && j === w ? pulse : '0'); });
        if (!run) { if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
        bnSet(c, done ? '#' + (w + 1) + ' ' + c.l.wins : e < RS ? '3 · 2 · 1' : '', 'n0');
      }
    });
  }
  // a race board: the winner buttons (number badge + odds) then the game's own row
  function winBtns(cols, fg, oddTxt, o) { return cols.map(function (col, i) { return btn('w' + i, badgeSvg(i + 1, col, fg && fg[i]) + odd('w' + i, oddTxt, o), 'rw'); }).join(''); }

  /* ------------------------------------------------------------- Dog Race ------------------------------------------------------------- */
  // jacket colours (owner: no black): 1 red, 2 blue, 3 sky, 4 green, 5 orange, 6 pink
  var DOG_C = ['#DC2626', '#2563EB', '#0EA5E9', '#16A34A', '#F97316', '#DB2777'], DOG_F = ['#fff', '#fff', '#fff', '#fff', '#fff', '#fff'];
  function dogSprite(i) {
    var c = DOG_C[i], tc = DOG_F[i];
    return '<g data-a="b -24 2 1"><path d="M-24 1L-31 10M-22 1L-27 11" stroke="#7C5A3C" stroke-width="2.6" stroke-linecap="round"/></g>' +
      '<g data-a="a -8 2 1"><path d="M-8 1L-4 11M-10 1L-8 11" stroke="#8B6646" stroke-width="2.4" stroke-linecap="round"/></g>' +
      '<path d="M-30-3Q-38-4-40 2" stroke="#9A7350" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M-31-1C-31-8-20-9-14-7C-10-6-8-7-5-9L1-6L0-3C-4-2-6 1-8 3C-15 6-28 6-31-1Z" fill="#B08968"/>' +
      '<path d="M-5-9L-7-13L-3-10Z" fill="#7C5A3C"/><circle cx="-3" cy="-7" r=".9" fill="#111"/>' +
      '<path d="M-25-7.5h13l1 8.5h-14.5z" fill="' + c + '" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>' + '' +
      '<text x="-18.5" y="-.4" text-anchor="middle" font-size="7" font-weight="900" fill="' + tc + '">' + (i + 1) + '</text>';
  }
  race('dogracelive', {
    cols: DOG_C, fg: DOG_F, D: 10, gap: [.12, .5], stride: 15, bob: 1.6, leg: 34,
    odds0: { w0: 3.61, w1: 4.47, w2: 5.22, w3: 6.71, w4: 7.83, w5: 10.44, odd: 1.67, even: 2.13 },
    wins: function (o) { return ['w' + o[0], o[0] % 2 === 0 ? 'odd' : 'even']; },
    sprite: dogSprite,
    bg: function (uid, LH, N) {
      var h = '<defs>' + lgd('dgS' + uid, '#0B1630', '#1B2D55', 1) + lgd('dgT' + uid, '#C68B59', '#9C6337', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#07101F"/>' +
        '<rect x="-300" y="-300" width="960" height="344" fill="url(#dgS' + uid + ')"/>';
      for (var k = 0; k < 7; k++) h += '<g transform="translate(' + (26 + k * 52) + ' 10)"><rect x="-1" y="0" width="2" height="22" fill="#334155"/><circle r="4" fill="#FEF9C3" opacity=".9"/><circle r="8" fill="#FEF9C3" opacity=".18"/></g>';
      h += '<path d="M-300 38h960v6H-300z" fill="#14532D"/><rect x="0" y="' + RY0 + '" width="360" height="' + (RY1 - RY0) + '" fill="url(#dgT' + uid + ')"/>';
      for (k = 1; k < N; k++) h += '<path d="M30 ' + (RY0 + k * LH).toFixed(1) + 'H350" stroke="#fff" stroke-opacity=".35" stroke-width="1" stroke-dasharray="6 5"/>';
      return h + '<rect x="-300" y="' + RY1 + '" width="960" height="320" fill="#14532D"/>' + gateFin(N, LH, '#E2E8F0');
    },
    board: function (uid, l, oddTxt, o) { return winBtns(DOG_C, DOG_F, oddTxt, o) + btn('odd', lab(l.odd + ' 1·3·5') + odd('odd', oddTxt, o), 'x3') + btn('even', lab(l.even + ' 2·4·6') + odd('even', oddTxt, o), 'x3'); },
    rules: rules(150, { w0: 3.61, w5: 10.44, odd: 1.67, even: 2.13 }, {
      en: ['Six greyhounds race on the sand track. Bet on the winner (from {w0} for the favourite n°1 to {w5} for the outsider n°6) or on the winner’s trap number: Odd 1·3·5 ({odd}) or Even 2·4·6 ({even}).', 'Each dog has its own fixed chance (favourite → outsider). The finishing order is drawn by the server when bets close; the race you watch shows exactly that order.'],
      fr: ['Six lévriers courent sur la piste en sable. Parie sur le gagnant (de {w0} pour le favori n°1 à {w5} pour l’outsider n°6) ou sur le numéro du gagnant : Impair 1·3·5 ({odd}) ou Pair 2·4·6 ({even}).', 'Chaque chien a sa chance fixe (favori → outsider). L’ordre d’arrivée est tiré par le serveur à la fermeture des paris ; la course que tu vois montre exactement cet ordre.'],
      es: ['Seis galgos corren en la pista de arena. Apuesta al ganador (de {w0} el favorito n°1 a {w5} el n°6) o al número del ganador: Impar 1·3·5 ({odd}) o Par 2·4·6 ({even}).', 'Cada perro tiene su probabilidad fija (favorito → outsider). El orden de llegada lo sortea el servidor al cerrar las apuestas; la carrera muestra exactamente ese orden.'],
      pt: ['Seis galgos correm na pista de areia. Aposte no vencedor (de {w0} o favorito n°1 a {w5} o n°6) ou no número do vencedor: Ímpar 1·3·5 ({odd}) ou Par 2·4·6 ({even}).', 'Cada cão tem sua chance fixa (favorito → azarão). A ordem de chegada é sorteada pelo servidor no fechamento; a corrida mostra exatamente essa ordem.'],
      ar: ['ستة كلاب سلوقية تتسابق على مضمار رملي. راهن على الفائز (من {w0} للمرشح رقم 1 إلى {w5} للرقم 6) أو على رقم الفائز: فردي 1·3·5 ‏({odd}) أو زوجي 2·4·6 ‏({even}).', 'لكل كلب فرصة ثابتة (المرشح ← الأضعف). يسحب الخادم ترتيب الوصول عند إغلاق الرهانات، والسباق يعرض هذا الترتيب بالضبط.'],
      tr: ['Altı tazı kum pistte koşar. Kazananı ({w0} favori 1 numaradan {w5} 6 numaraya) ya da kazananın numarasını oyna: Tek 1·3·5 ({odd}) veya Çift 2·4·6 ({even}).', 'Her köpeğin sabit bir şansı var (favori → sürpriz). Varış sırası bahisler kapanınca sunucu tarafından çekilir; izlediğin yarış tam olarak bu sırayı gösterir.'],
      vi: ['Sáu chó săn đua trên đường cát. Cược con thắng (từ {w0} cho số 1 được ưa chuộng đến {w5} cho số 6) hoặc số của con thắng: Lẻ 1·3·5 ({odd}) hay Chẵn 2·4·6 ({even}).', 'Mỗi con có cơ hội cố định (ưa chuộng → ít khả năng). Thứ tự về đích do máy chủ rút khi đóng cược; cuộc đua hiển thị đúng thứ tự đó.'],
      id: ['Enam anjing greyhound berlari di lintasan pasir. Pasang pemenang (dari {w0} favorit no.1 hingga {w5} no.6) atau nomor pemenang: Ganjil 1·3·5 ({odd}) atau Genap 2·4·6 ({even}).', 'Tiap anjing punya peluang tetap (favorit → kuda hitam). Urutan finis diundi server saat taruhan ditutup; balapan menampilkan urutan itu persis.'],
      ru: ['Шесть борзых бегут по песчаной дорожке. Ставьте на победителя (от {w0} за фаворита №1 до {w5} за №6) или на номер победителя: Нечёт 1·3·5 ({odd}) или Чёт 2·4·6 ({even}).', 'У каждой собаки свой постоянный шанс (фаворит → аутсайдер). Порядок финиша разыгрывает сервер при закрытии ставок; забег показывает именно его.'],
      de: ['Sechs Windhunde rennen auf der Sandbahn. Setze auf den Sieger (von {w0} für Favorit Nr. 1 bis {w5} für Nr. 6) oder auf seine Nummer: Ungerade 1·3·5 ({odd}) oder Gerade 2·4·6 ({even}).', 'Jeder Hund hat seine feste Chance (Favorit → Außenseiter). Die Zieleinlauf-Reihenfolge zieht der Server beim Schließen; das Rennen zeigt genau diese Reihenfolge.'],
      hi: ['छह ग्रेहाउंड रेत के ट्रैक पर दौड़ते हैं। विजेता पर दांव लगाएं (फ़ेवरेट नंबर 1 पर {w0} से नंबर 6 पर {w5} तक) या विजेता के नंबर पर: विषम 1·3·5 ({odd}) या सम 2·4·6 ({even})।', 'हर कुत्ते की तय संभावना है (फ़ेवरेट → कमज़ोर)। दांव बंद होने पर सर्वर फ़िनिश का क्रम निकालता है; रेस ठीक वही क्रम दिखाती है।'],
      zh: ['六只灵缇在沙道上赛跑。押冠军（1 号热门 {w0} 至 6 号冷门 {w5}），或押冠军号码：单号 1·3·5（{odd}）或双号 2·4·6（{even}）。', '每只狗的胜率固定（热门 → 冷门）。停止下注时由服务器抽出名次，比赛画面完全按此名次呈现。']
    })
  });
  // gate (start) + checkered finish line
  function gateFin(N, LH, gc) {
    var h = '<path d="M' + (RX0 + 2) + ' ' + RY0 + 'V' + RY1 + '" stroke="' + gc + '" stroke-opacity=".6" stroke-width="2"/>', sq = 5;
    for (var y = RY0, k = 0; y < RY1; y += sq, k++) h += '<rect x="' + (RX1 + (k % 2 ? sq : 0)) + '" y="' + y + '" width="' + sq + '" height="' + Math.min(sq, RY1 - y) + '" fill="#fff"/><rect x="' + (RX1 + (k % 2 ? 0 : sq)) + '" y="' + y + '" width="' + sq + '" height="' + Math.min(sq, RY1 - y) + '" fill="#111827"/>';
    return h;
  }

  /* ------------------------------------------------------------ Camel Race ------------------------------------------------------------ */
  var CAM_C = ['#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#9333EA'];
  function camelSprite(i) {
    var c = CAM_C[i];
    return '<g data-a="b -22 2 1"><path d="M-22 1L-26 13M-19 1L-21 13" stroke="#A16207" stroke-width="2.2" stroke-linecap="round"/></g>' +
      '<g data-a="a -8 2 1"><path d="M-8 1L-5 13M-10 1L-9 13" stroke="#B4832F" stroke-width="2.2" stroke-linecap="round"/></g>' +
      '<path d="M-27 0Q-31 3-30 8" stroke="#A16207" stroke-width="1.6" fill="none"/>' +
      '<path d="M-28 1C-29-6-25-9-21-9C-19-15-13-15-11-9C-8-8-6-6-4-7L-2-15C-1-18 3-18 4-15L5-13L3-11L1-11L-1-3C-3 3-9 4-14 4C-20 4-27 5-28 1Z" fill="#D6A55C" stroke="#92400E" stroke-width=".6"/>' +
      '<circle cx="2" cy="-14.5" r=".8" fill="#111"/>' +
      '<path d="M-18-13h7l1 5h-9z" fill="' + c + '"/><circle cx="-14.5" cy="-17" r="3" fill="#FDE2C4"/><path d="M-17.5-18.5a3 3 0 0 1 6 0z" fill="' + c + '"/>';
  }
  race('camelracelive', {
    cols: CAM_C, D: 11.5, gap: [.15, .6], stride: 9, bob: 2.4, leg: 26,
    odds0: { w0: 3.13, w1: 3.76, w2: 4.70, w3: 6.26, w4: 9.40, l0: 12.75, l1: 8.92, l2: 5.99, l3: 3.82, l4: 2.24 },
    wins: function (o) { return ['w' + o[0], 'l' + o[o.length - 1]]; },
    sprite: camelSprite,
    bg: function (uid, LH, N) {
      var h = '<defs>' + lgd('cmS' + uid, '#F97316', '#FDE68A', 1) + lgd('cmT' + uid, '#E9B872', '#C98E4A', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#5B3511"/>' +
        '<rect x="-300" y="-300" width="960" height="346" fill="url(#cmS' + uid + ')"/><circle cx="292" cy="24" r="13" fill="#FFF7D6" opacity=".9"/>' +
        '<path d="M0 46Q50 20 110 40T230 36T360 34V46Z" fill="#C2410C" opacity=".55"/><path d="M200 46l20-26 20 26z" fill="#9A3412" opacity=".6"/><path d="M228 46l13-17 13 17z" fill="#7C2D12" opacity=".6"/>' +
        '<rect x="-300" y="' + RY0 + '" width="960" height="' + (RY1 - RY0) + '" fill="url(#cmT' + uid + ')"/>';
      for (var k = 1; k < N; k++) h += '<path d="M30 ' + (RY0 + k * LH).toFixed(1) + 'H350" stroke="#7C2D12" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="2 6"/>';
      return h + '<rect x="-300" y="' + RY1 + '" width="960" height="320" fill="#B45309"/>' + gateFin(N, LH, '#7C2D12');
    },
    board: function (uid, l, oddTxt, o) {
      return winBtns(CAM_C, null, oddTxt, o) + CAM_C.map(function (col, i) { return btn('l' + i, lab(l.last + ' ' + (i + 1)) + odd('l' + i, oddTxt, o), 'rl'); }).join('');
    },
    rules: rules(155, { w0: 3.13, w4: 9.40, l4: 2.24, l0: 12.75 }, {
      en: ['Five camels race across the desert. Bet on the winner ({w0} for n°1 to {w4} for n°5) or on the camel that finishes LAST (from {l4} for n°5 to {l0} for n°1).', 'Each camel has its own fixed chance (n°1 is the favourite). The finishing order is drawn by the server when bets close and the race shows exactly that order.'],
      fr: ['Cinq chameaux traversent le désert. Parie sur le gagnant ({w0} pour le n°1 à {w4} pour le n°5) ou sur le chameau qui arrive DERNIER ({l4} pour le n°5 à {l0} pour le n°1).', 'Chaque chameau a sa chance fixe (le n°1 est le favori). L’ordre d’arrivée est tiré par le serveur à la fermeture des paris et la course montre exactement cet ordre.'],
      es: ['Cinco camellos cruzan el desierto. Apuesta al ganador ({w0} el n°1 a {w4} el n°5) o al camello que llega ÚLTIMO ({l4} el n°5 a {l0} el n°1).', 'Cada camello tiene su probabilidad fija (el n°1 es el favorito). El orden de llegada lo sortea el servidor al cerrar las apuestas y la carrera lo muestra tal cual.'],
      pt: ['Cinco camelos atravessam o deserto. Aposte no vencedor ({w0} o n°1 a {w4} o n°5) ou no camelo que chega em ÚLTIMO ({l4} o n°5 a {l0} o n°1).', 'Cada camelo tem sua chance fixa (o n°1 é o favorito). A ordem de chegada é sorteada pelo servidor no fechamento e a corrida mostra exatamente essa ordem.'],
      ar: ['خمسة جمال تتسابق في الصحراء. راهن على الفائز ({w0} للرقم 1 حتى {w4} للرقم 5) أو على الجمل الذي يصل أخيرًا ({l4} للرقم 5 حتى {l0} للرقم 1).', 'لكل جمل فرصة ثابتة (الرقم 1 هو المرشح). يسحب الخادم ترتيب الوصول عند إغلاق الرهانات ويعرضه السباق بالضبط.'],
      tr: ['Beş deve çölde yarışır. Kazananı ({w0} 1 numaradan {w4} 5 numaraya) ya da SONUNCU gelen deveyi ({l4} 5 numaradan {l0} 1 numaraya) oyna.', 'Her devenin sabit şansı var (1 numara favori). Varış sırası bahisler kapanınca sunucu tarafından çekilir ve yarış tam bu sırayı gösterir.'],
      vi: ['Năm con lạc đà đua qua sa mạc. Cược con thắng ({w0} cho số 1 đến {w4} cho số 5) hoặc con về BÉT ({l4} cho số 5 đến {l0} cho số 1).', 'Mỗi con có cơ hội cố định (số 1 được ưa chuộng). Thứ tự về đích do máy chủ rút khi đóng cược và cuộc đua hiển thị đúng thứ tự đó.'],
      id: ['Lima unta berpacu di gurun. Pasang pemenang ({w0} no.1 hingga {w4} no.5) atau unta yang finis TERAKHIR ({l4} no.5 hingga {l0} no.1).', 'Tiap unta punya peluang tetap (no.1 favorit). Urutan finis diundi server saat taruhan ditutup dan balapan menampilkannya persis.'],
      ru: ['Пять верблюдов бегут по пустыне. Ставьте на победителя ({w0} за №1 … {w4} за №5) или на того, кто придёт ПОСЛЕДНИМ ({l4} за №5 … {l0} за №1).', 'У каждого верблюда свой постоянный шанс (№1 — фаворит). Порядок финиша разыгрывает сервер при закрытии ставок, забег показывает именно его.'],
      de: ['Fünf Kamele rennen durch die Wüste. Setze auf den Sieger ({w0} für Nr. 1 bis {w4} für Nr. 5) oder auf das LETZTE Kamel ({l4} für Nr. 5 bis {l0} für Nr. 1).', 'Jedes Kamel hat seine feste Chance (Nr. 1 ist Favorit). Die Reihenfolge zieht der Server beim Schließen der Einsätze, das Rennen zeigt genau sie.'],
      hi: ['पाँच ऊँट रेगिस्तान में दौड़ते हैं। विजेता पर ({w0} नंबर 1 से {w4} नंबर 5 तक) या सबसे आख़िरी आने वाले ऊँट पर ({l4} नंबर 5 से {l0} नंबर 1 तक) दांव लगाएं।', 'हर ऊँट की तय संभावना है (नंबर 1 फ़ेवरेट)। दांव बंद होने पर सर्वर क्रम निकालता है और रेस ठीक वही दिखाती है।'],
      zh: ['五头骆驼在沙漠中赛跑。押冠军（1 号 {w0} 至 5 号 {w4}），或押最后一名（5 号 {l4} 至 1 号 {l0}）。', '每头骆驼胜率固定（1 号为热门）。停止下注时由服务器抽出名次，比赛完全按此名次呈现。']
    })
  });

  /* ------------------------------------------------------------ Snail Race ------------------------------------------------------------ */
  var SN_C = ['#F43F5E', '#3B82F6', '#22C55E', '#F59E0B'], SN_PAIRS = ['01', '02', '03', '12', '13', '23'];
  function snailSprite(i) {
    var c = SN_C[i];
    return '<g data-a="s -12 6"><path d="M-28 7C-28 3-20 2-10 2L-2 0C0-6 3-8 4-7L4-2L2 4C0 7-6 8-12 8Z" fill="#E7C9A0" stroke="#A16207" stroke-width=".7"/></g>' +
      '<g data-a="a 3 -4 1"><path d="M3-4L5-12M1-4L1-12" stroke="#A16207" stroke-width="1.1"/><circle cx="5" cy="-12.5" r="1.4" fill="#1F2937"/><circle cx="1" cy="-12.5" r="1.4" fill="#1F2937"/></g>' +
      '<circle cx="-12" cy="-3" r="8.6" fill="' + c + '" stroke="#fff" stroke-opacity=".6"/><path d="M-12-3m0 0a2.3 2.3 0 1 1 2.3 2.3a4.6 4.6 0 1 1-4.6-4.6a6.6 6.6 0 1 1 6.6 6.6" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.3"/>';
  }
  race('snailracelive', {
    cols: SN_C, D: 13, gap: [.2, .9], stride: 5, bob: .3, leg: 10, trail: [5, 4, '#BAE6FD', '.45', 22],
    odds0: { w0: 3.76, w1: 3.76, w2: 3.76, w3: 3.76, q01: 5.64, q02: 5.64, q03: 5.64, q12: 5.64, q13: 5.64, q23: 5.64 },
    wins: function (o) { var a = Math.min(o[0], o[1]), b = Math.max(o[0], o[1]); return ['w' + o[0], 'q' + a + b]; },
    sprite: snailSprite,
    bg: function (uid, LH, N) {
      var h = '<defs>' + lgd('snS' + uid, '#14532D', '#166534', 1) + lgd('snT' + uid, '#A16207', '#854D0E', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#052E16"/>' +
        '<rect x="-300" y="-300" width="960" height="346" fill="url(#snS' + uid + ')"/>';
      for (var k = 0; k < 18; k++) h += '<path d="M' + (k * 21 + 4) + ' 46q3-' + (10 + (k * 7) % 9) + ' 7-' + (14 + (k * 5) % 8) + 'q-1 9 2 14z" fill="#22C55E" opacity=".55"/>';
      h += '<rect x="-300" y="' + RY0 + '" width="960" height="' + (RY1 - RY0) + '" fill="url(#snT' + uid + ')"/>';
      for (k = 0; k <= N; k++) h += '<rect x="26" y="' + (RY0 + k * LH - 1.5).toFixed(1) + '" width="330" height="3" fill="#FDE68A" opacity=".5"/>';
      for (k = 0; k < N; k++) h += '<g transform="translate(338 ' + (RY0 + (k + .5) * LH).toFixed(1) + ')"><path d="M-6 6C-9-2-4-9 0-9S9-2 6 6Z" fill="#4ADE80" stroke="#166534"/><path d="M0-8V5" stroke="#166534" stroke-width=".8"/></g>';
      return h + '<rect x="-300" y="' + RY1 + '" width="960" height="320" fill="#14532D"/>' + gateFin(N, LH, '#FDE68A');
    },
    board: function (uid, l, oddTxt, o) {
      return winBtns(SN_C, null, oddTxt, o) + SN_PAIRS.map(function (p) {
        return btn('q' + p, '<span class="pr">' + '<svg viewBox="-10 -10 20 20">' + badge(+p[0] + 1, SN_C[+p[0]]) + '</svg><svg viewBox="-10 -10 20 20">' + badge(+p[1] + 1, SN_C[+p[1]]) + '</svg></span>' + odd('q' + p, oddTxt, o), 'rq');
      }).join('');
    },
    rules: rules(150, { w0: 3.76, q01: 5.64 }, {
      en: ['Four snails slide to the lettuce. Bet on the winner ({w0} each, all four have the same chance) or on the TOP PAIR ({q01}): the two snails that finish 1st and 2nd, in any order.', 'The finishing order is drawn by the server when bets close (every order has the same chance); the race shows exactly that order.'],
      fr: ['Quatre escargots glissent vers la salade. Parie sur le gagnant ({w0} chacun, tous ont la même chance) ou sur le DUO DE TÊTE ({q01}) : les deux escargots arrivés 1er et 2e, dans n’importe quel ordre.', 'L’ordre d’arrivée est tiré par le serveur à la fermeture des paris (chaque ordre a la même chance) ; la course montre exactement cet ordre.'],
      es: ['Cuatro caracoles se deslizan hacia la lechuga. Apuesta al ganador ({w0} cada uno, todos con la misma probabilidad) o al DÚO DE CABEZA ({q01}): los dos que llegan 1.º y 2.º, en cualquier orden.', 'El orden de llegada lo sortea el servidor al cerrar (cada orden con la misma probabilidad); la carrera lo muestra tal cual.'],
      pt: ['Quatro caracóis deslizam até a alface. Aposte no vencedor ({w0} cada, todos com a mesma chance) ou na DUPLA DA FRENTE ({q01}): os dois que chegam em 1.º e 2.º, em qualquer ordem.', 'A ordem de chegada é sorteada pelo servidor no fechamento (cada ordem com a mesma chance); a corrida mostra exatamente essa ordem.'],
      ar: ['أربعة حلزونات تزحف نحو الخس. راهن على الفائز ({w0} لكل منها، الفرصة نفسها للجميع) أو على الثنائي الأول ({q01}): الحلزونان الأول والثاني بأي ترتيب.', 'يسحب الخادم ترتيب الوصول عند إغلاق الرهانات (لكل ترتيب الفرصة نفسها)، والسباق يعرضه بالضبط.'],
      tr: ['Dört salyangoz marula doğru kayar. Kazananı ({w0}, hepsinin şansı aynı) ya da İLK İKİLİYİ ({q01}) oyna: 1. ve 2. olan iki salyangoz, sıra fark etmez.', 'Varış sırası bahisler kapanınca sunucu tarafından çekilir (her sıranın şansı aynı); yarış tam bu sırayı gösterir.'],
      vi: ['Bốn chú ốc sên bò về phía rau diếp. Cược con thắng ({w0} mỗi con, cơ hội như nhau) hoặc CẶP DẪN ĐẦU ({q01}): hai con về nhất và nhì, thứ tự bất kỳ.', 'Thứ tự về đích do máy chủ rút khi đóng cược (mọi thứ tự có cơ hội như nhau); cuộc đua hiển thị đúng thứ tự đó.'],
      id: ['Empat siput meluncur ke selada. Pasang pemenang ({w0} masing-masing, peluang sama) atau PASANGAN TERDEPAN ({q01}): dua siput yang finis 1 dan 2, urutan bebas.', 'Urutan finis diundi server saat taruhan ditutup (setiap urutan berpeluang sama); balapan menampilkannya persis.'],
      ru: ['Четыре улитки ползут к салату. Ставьте на победителя ({w0}, у всех равные шансы) или на ПАРУ ЛИДЕРОВ ({q01}): две улитки на 1-м и 2-м местах, в любом порядке.', 'Порядок финиша разыгрывает сервер при закрытии ставок (все порядки равновероятны); забег показывает именно его.'],
      de: ['Vier Schnecken gleiten zum Salat. Setze auf den Sieger ({w0}, alle haben dieselbe Chance) oder auf das SPITZENDUO ({q01}): die zwei auf Platz 1 und 2, in beliebiger Reihenfolge.', 'Die Reihenfolge zieht der Server beim Schließen (jede gleich wahrscheinlich); das Rennen zeigt genau sie.'],
      hi: ['चार घोंघे सलाद की ओर सरकते हैं। विजेता पर ({w0} हर एक, सबकी संभावना बराबर) या टॉप जोड़ी पर ({q01}) दांव लगाएं: पहले और दूसरे आने वाले दो घोंघे, किसी भी क्रम में।', 'दांव बंद होने पर सर्वर क्रम निकालता है (हर क्रम की संभावना बराबर); रेस ठीक वही दिखाती है।'],
      zh: ['四只蜗牛爬向生菜。押冠军（各 {w0}，机会均等），或押前二组合（{q01}）：第一、第二名的两只蜗牛，顺序不限。', '停止下注时由服务器抽出名次（每种名次机会相同），比赛完全按此名次呈现。']
    })
  });

  /* ----------------------------------------------------------- Chicken Race ----------------------------------------------------------- */
  var CH_C = ['#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#9333EA', '#0EA5E9'];
  function chickSprite(i) {
    var c = CH_C[i];
    return '<g data-a="b -12 4 1"><path d="M-12 3L-15 11M-15 11h-3" stroke="#F59E0B" stroke-width="1.8" stroke-linecap="round" fill="none"/></g>' +
      '<g data-a="a -9 4 1"><path d="M-9 3L-6 11M-6 11h3" stroke="#FBBF24" stroke-width="1.8" stroke-linecap="round" fill="none"/></g>' +
      '<path d="M-23-6L-27-12L-21-9L-24-15L-18-9Z" fill="#E5E7EB"/>' +
      '<ellipse cx="-12" cy="-3" rx="11" ry="8.5" fill="#FAFAF9" stroke="#D6D3D1" stroke-width=".7"/>' +
      '<g data-a="a -14 -4 -1.4"><path d="M-14-4C-20-6-22 0-17 2C-14 3-11 0-14-4Z" fill="#E7E5E4" stroke="#D6D3D1" stroke-width=".6"/></g>' +
      '<circle cx="-2" cy="-10" r="5" fill="#FAFAF9"/><path d="M-4-15q2-4 4-1q2-3 3 1z" fill="#EF4444"/><path d="M3-10l4 1.5-4 1.5z" fill="#F59E0B"/><path d="M1-6.5q1 3-1 3.5q-1-2 1-3.5z" fill="#EF4444"/><circle cx="-1" cy="-11" r=".9" fill="#111"/>' +
      '<path d="M-6-6.5q3 3 6 0l1 2.5q-4 3-8 0z" fill="' + c + '"/>';
  }
  race('chickenracelive', {
    cols: CH_C, D: 10, gap: [.12, .5], stride: 20, bob: 2.2, leg: 38,
    odds0: { w0: 3.91, w1: 4.70, w2: 5.22, w3: 6.26, w4: 7.23, w5: 9.40, lo: 1.51, hi: 2.47 },
    wins: function (o) { return ['w' + o[0], o[0] < 3 ? 'lo' : 'hi']; },
    sprite: chickSprite,
    bg: function (uid, LH, N) {
      var h = '<defs>' + lgd('chS' + uid, '#7DD3FC', '#E0F2FE', 1) + lgd('chT' + uid, '#A16207', '#78350F', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#3F2A10"/>' +
        '<rect x="-300" y="-300" width="960" height="346" fill="url(#chS' + uid + ')"/><path d="M0 46Q90 26 180 40T360 34V46Z" fill="#65A30D"/>' +
        '<g transform="translate(286 14)"><path d="M0 10L18-4L36 10V30H0Z" fill="#B91C1C"/><path d="M-2 11L18-6L38 11" stroke="#FEF2F2" stroke-width="2" fill="none"/><rect x="12" y="16" width="12" height="14" fill="#7F1D1D"/><path d="M12 16l12 14M24 16L12 30" stroke="#FEF2F2" stroke-width="1.2"/></g>';
      for (var k = 0; k < 9; k++) h += '<rect x="' + (6 + k * 30) + '" y="30" width="3" height="16" fill="#FEF3C7"/>';
      h += '<path d="M0 36H270M0 42H270" stroke="#FEF3C7" stroke-width="2"/><rect x="0" y="' + RY0 + '" width="360" height="' + (RY1 - RY0) + '" fill="url(#chT' + uid + ')"/>';
      for (k = 1; k < N; k++) h += '<path d="M30 ' + (RY0 + k * LH).toFixed(1) + 'H350" stroke="#FEF3C7" stroke-opacity=".3" stroke-width="1" stroke-dasharray="4 6"/>';
      for (k = 0; k < 14; k++) h += '<circle cx="' + (40 + (k * 53) % 290) + '" cy="' + (RY0 + 6 + (k * 37) % (RY1 - RY0 - 10)) + '" r="1.2" fill="#FDE68A" opacity=".5"/>';
      return h + '<rect x="-300" y="' + RY1 + '" width="960" height="320" fill="#65A30D"/>' + gateFin(N, LH, '#FEF3C7');
    },
    board: function (uid, l, oddTxt, o) { return winBtns(CH_C, null, oddTxt, o) + btn('lo', lab('1 – 3') + odd('lo', oddTxt, o), 'x3') + btn('hi', lab('4 – 6') + odd('hi', oddTxt, o), 'x3'); },
    rules: rules(150, { w0: 3.91, w5: 9.40, lo: 1.51, hi: 2.47 }, {
      en: ['Six chickens sprint across the farmyard. Bet on the winner ({w0} for n°1 to {w5} for n°6) or on the winner’s number: 1–3 ({lo}) or 4–6 ({hi}).', 'Each chicken has its own fixed chance (n°1 is the favourite). The finishing order is drawn by the server when bets close and the race shows exactly that order.'],
      fr: ['Six poules sprintent dans la cour de la ferme. Parie sur la gagnante ({w0} pour la n°1 à {w5} pour la n°6) ou sur son numéro : 1–3 ({lo}) ou 4–6 ({hi}).', 'Chaque poule a sa chance fixe (la n°1 est la favorite). L’ordre d’arrivée est tiré par le serveur à la fermeture des paris et la course montre exactement cet ordre.'],
      es: ['Seis gallinas corren por la granja. Apuesta a la ganadora ({w0} la n°1 a {w5} la n°6) o a su número: 1–3 ({lo}) o 4–6 ({hi}).', 'Cada gallina tiene su probabilidad fija (la n°1 es la favorita). El orden de llegada lo sortea el servidor al cerrar las apuestas y la carrera lo muestra tal cual.'],
      pt: ['Seis galinhas correm pelo quintal da fazenda. Aposte na vencedora ({w0} a n°1 a {w5} a n°6) ou no número dela: 1–3 ({lo}) ou 4–6 ({hi}).', 'Cada galinha tem sua chance fixa (a n°1 é a favorita). A ordem de chegada é sorteada pelo servidor no fechamento e a corrida mostra exatamente essa ordem.'],
      ar: ['ست دجاجات تركض في ساحة المزرعة. راهن على الفائزة ({w0} للرقم 1 حتى {w5} للرقم 6) أو على رقمها: 1–3 ‏({lo}) أو 4–6 ‏({hi}).', 'لكل دجاجة فرصة ثابتة (الرقم 1 هي المرشحة). يسحب الخادم ترتيب الوصول عند إغلاق الرهانات ويعرضه السباق بالضبط.'],
      tr: ['Altı tavuk çiftlik avlusunda koşar. Kazananı ({w0} 1 numaradan {w5} 6 numaraya) ya da numarasını oyna: 1–3 ({lo}) veya 4–6 ({hi}).', 'Her tavuğun sabit şansı var (1 numara favori). Varış sırası bahisler kapanınca sunucu tarafından çekilir ve yarış tam bu sırayı gösterir.'],
      vi: ['Sáu cô gà chạy nước rút trong sân trại. Cược con thắng ({w0} cho số 1 đến {w5} cho số 6) hoặc số của nó: 1–3 ({lo}) hay 4–6 ({hi}).', 'Mỗi con có cơ hội cố định (số 1 được ưa chuộng). Thứ tự về đích do máy chủ rút khi đóng cược và cuộc đua hiển thị đúng thứ tự đó.'],
      id: ['Enam ayam berlari di halaman peternakan. Pasang pemenang ({w0} no.1 hingga {w5} no.6) atau nomornya: 1–3 ({lo}) atau 4–6 ({hi}).', 'Tiap ayam punya peluang tetap (no.1 favorit). Urutan finis diundi server saat taruhan ditutup dan balapan menampilkannya persis.'],
      ru: ['Шесть кур мчатся по скотному двору. Ставьте на победительницу ({w0} за №1 … {w5} за №6) или на её номер: 1–3 ({lo}) или 4–6 ({hi}).', 'У каждой курицы свой постоянный шанс (№1 — фаворит). Порядок финиша разыгрывает сервер при закрытии ставок, забег показывает именно его.'],
      de: ['Sechs Hühner sprinten über den Hof. Setze auf die Siegerin ({w0} für Nr. 1 bis {w5} für Nr. 6) oder auf ihre Nummer: 1–3 ({lo}) oder 4–6 ({hi}).', 'Jedes Huhn hat seine feste Chance (Nr. 1 ist Favorit). Die Reihenfolge zieht der Server beim Schließen der Einsätze, das Rennen zeigt genau sie.'],
      hi: ['छह मुर्गियाँ फ़ार्म के आँगन में दौड़ती हैं। विजेता पर ({w0} नंबर 1 से {w5} नंबर 6 तक) या उसके नंबर पर दांव लगाएं: 1–3 ({lo}) या 4–6 ({hi})।', 'हर मुर्गी की तय संभावना है (नंबर 1 फ़ेवरेट)। दांव बंद होने पर सर्वर क्रम निकालता है और रेस ठीक वही दिखाती है।'],
      zh: ['六只母鸡在农场里冲刺。押冠军（1 号 {w0} 至 6 号 {w5}），或押冠军号码：1–3（{lo}）或 4–6（{hi}）。', '每只鸡胜率固定（1 号为热门）。停止下注时由服务器抽出名次，比赛完全按此名次呈现。']
    })
  });

  /* ----------------------------------------------------------- Monster Truck -----------------------------------------------------------
     The truck climbs the ramp and flies over the row of 12 cars: it lands ON car n+1 (crushing it) after clearing n cars, or on the
     landing ramp after all 12 (perfect jump). n is the drawn result. */
  var MT_X0 = 64, MT_DX = 20, MT_G = 196;
  function mtLand(n) { return n >= 12 ? { x: 322, y: MT_G - 22 - 11 } : { x: MT_X0 + MT_DX * n + 10, y: MT_G - 13 - 11 }; }
  function mtTimes(n) { var d = mtLand(n).x - 64; return { t0: 2.1, fl: .75 + d / 330 }; }
  live('monsterlive', {
    lab: 'jp', bev: 'stop', show: function (res) { var m = mtTimes(+res.n); return m.t0 + m.fl + 2.6; },
    odds0: { c0: 7.83, c1: 2.98, c2: 3.03, c3: 4.82, c4: 15.66, c12: 37.60 },
    beat: function (e, res) { var m = mtTimes(+res.n); return e < m.t0 ? 0 : e < m.t0 + m.fl ? 1 : 2; },
    rules: rules(140, { c0: 7.83, c1: 2.98, c2: 3.03, c3: 4.82, c4: 15.66, c12: 37.60 }, {
      en: ['The monster truck jumps over a row of 12 cars. Bet on how many cars it clears: 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) or a Perfect jump over all 12 ({c12}).', 'The jump length is drawn by the server when bets close (short jumps are more frequent than long ones). The truck lands on the next car and crushes it, or on the landing ramp after a perfect jump. 12 cars wins both 11–12 and Perfect.'],
      fr: ['Le monster truck saute au-dessus d’une rangée de 12 voitures. Parie sur le nombre de voitures franchies : 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) ou Saut parfait au-dessus des 12 ({c12}).', 'La longueur du saut est tirée par le serveur à la fermeture des paris (les sauts courts sont plus fréquents que les longs). Le camion retombe sur la voiture suivante et l’écrase, ou sur la rampe d’arrivée après un saut parfait. 12 voitures gagne 11–12 et Parfait.'],
      es: ['El monster truck salta sobre una fila de 12 coches. Apuesta a cuántos coches supera: 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) o Salto perfecto sobre los 12 ({c12}).', 'La longitud del salto la sortea el servidor al cerrar (los saltos cortos son más frecuentes). El camión cae sobre el coche siguiente y lo aplasta, o en la rampa tras un salto perfecto. 12 coches gana 11–12 y Perfecto.'],
      pt: ['O monster truck salta sobre uma fila de 12 carros. Aposte em quantos carros ele passa: 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) ou Salto perfeito sobre os 12 ({c12}).', 'O tamanho do salto é sorteado pelo servidor no fechamento (saltos curtos são mais frequentes). O caminhão cai no carro seguinte e o esmaga, ou na rampa após um salto perfeito. 12 carros ganha 11–12 e Perfeito.'],
      ar: ['تقفز الشاحنة العملاقة فوق صف من 12 سيارة. راهن على عدد السيارات التي تتخطاها: 0 ({c0})، 1–4 ({c1})، 5–7 ({c2})، 8–10 ({c3})، 11–12 ({c4}) أو قفزة مثالية فوق الـ12 ({c12}).', 'يسحب الخادم طول القفزة عند إغلاق الرهانات (القفزات القصيرة أكثر من الطويلة). تهبط الشاحنة على السيارة التالية فتسحقها، أو على منحدر الهبوط بعد قفزة مثالية. 12 سيارة تربح 11–12 والمثالية.'],
      tr: ['Monster truck 12 arabalık bir sıranın üzerinden atlar. Kaç arabayı geçeceğine oyna: 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) ya da 12’sinin de üzerinden Kusursuz atlayış ({c12}).', 'Atlayış uzunluğu bahisler kapanınca sunucu tarafından çekilir (kısa atlayışlar daha sık). Kamyon sonraki arabanın üstüne düşüp ezer ya da kusursuz atlayışta iniş rampasına konar. 12 araba hem 11–12 hem Kusursuz kazanır.'],
      vi: ['Xe tải quái vật bay qua hàng 12 chiếc ô tô. Cược số xe nó vượt qua: 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) hoặc Cú nhảy hoàn hảo qua cả 12 ({c12}).', 'Độ dài cú nhảy do máy chủ rút khi đóng cược (nhảy ngắn thường gặp hơn nhảy dài). Xe đáp xuống chiếc kế tiếp và đè bẹp nó, hoặc xuống dốc đáp sau cú nhảy hoàn hảo. 12 xe thắng cả 11–12 và Hoàn hảo.'],
      id: ['Monster truck melompati deretan 12 mobil. Pasang jumlah mobil yang dilewati: 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) atau Lompatan sempurna atas ke-12 mobil ({c12}).', 'Panjang lompatan diundi server saat taruhan ditutup (lompatan pendek lebih sering). Truk mendarat di mobil berikutnya dan menghancurkannya, atau di landasan setelah lompatan sempurna. 12 mobil memenangkan 11–12 dan Sempurna.'],
      ru: ['Монстр-трак прыгает через ряд из 12 машин. Ставьте на число машин, которые он перелетит: 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) или Идеальный прыжок через все 12 ({c12}).', 'Длину прыжка разыгрывает сервер при закрытии ставок (короткие прыжки чаще длинных). Трак приземляется на следующую машину и давит её или на трамплин после идеального прыжка. 12 машин выигрывает и 11–12, и Идеально.'],
      de: ['Der Monster Truck springt über eine Reihe von 12 Autos. Setze darauf, wie viele er überspringt: 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) oder Perfekter Sprung über alle 12 ({c12}).', 'Die Sprungweite zieht der Server beim Schließen (kurze Sprünge sind häufiger als lange). Der Truck landet auf dem nächsten Auto und zerdrückt es oder nach einem perfekten Sprung auf der Landerampe. 12 Autos gewinnt 11–12 und Perfekt.'],
      hi: ['मॉन्स्टर ट्रक 12 कारों की कतार के ऊपर से कूदता है। दांव लगाएं कि वह कितनी कारें पार करेगा: 0 ({c0}), 1–4 ({c1}), 5–7 ({c2}), 8–10 ({c3}), 11–12 ({c4}) या सभी 12 पर परफ़ेक्ट जंप ({c12})।', 'दांव बंद होने पर सर्वर जंप की लंबाई निकालता है (छोटे जंप लंबे से ज़्यादा आते हैं)। ट्रक अगली कार पर गिरकर उसे कुचल देता है, या परफ़ेक्ट जंप के बाद लैंडिंग रैंप पर उतरता है। 12 कारें 11–12 और परफ़ेक्ट दोनों जीतती हैं।'],
      zh: ['怪兽卡车飞越一排 12 辆车。押它飞过的车数：0（{c0}）、1–4（{c1}）、5–7（{c2}）、8–10（{c3}）、11–12（{c4}），或完美飞越全部 12 辆（{c12}）。', '停止下注时由服务器抽出飞跃距离（短跳比长跳常见）。卡车落在下一辆车上把它压扁，完美飞越则落在着陆坡上。12 辆同时赢 11–12 和完美。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + lgd('mtS' + uid, '#1E1B4B', '#7C2D12', 1) + lgd('mtB' + uid, '#F97316', '#B91C1C', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#0C0A1D"/>' +
        '<rect x="-300" y="-300" width="960" height="496" fill="url(#mtS' + uid + ')"/>';
      for (var k = 0; k < 3; k++) { h += '<rect x="-300" y="' + (70 + k * 26) + '" width="960" height="24" fill="#' + ['1E1B4B', '231F55', '2A2460'][k] + '"/>'; for (var q = 0; q < 46; q++) h += '<circle cx="' + (q * 8 + (k % 2) * 4) + '" cy="' + (80 + k * 26) + '" r="3" fill="' + ['#F87171', '#60A5FA', '#FDE68A', '#4ADE80', '#F472B6', '#E2E8F0'][(q * 7 + k * 3) % 6] + '" opacity=".75"/>'; }
      h += '<rect x="-300" y="148" width="960" height="6" fill="#0F172A"/>';
      for (k = 0; k < 6; k++) h += '<g transform="translate(' + (20 + k * 64) + ' 12)"><path d="M-14 0h28l-6 12h-16z" fill="#FDE68A" opacity=".16"/><circle r="3" fill="#FEF3C7"/></g>';
      h += '<rect x="-300" y="' + MT_G + '" width="960" height="320" fill="#3F2A1A"/><rect x="-300" y="' + MT_G + '" width="960" height="4" fill="#78350F"/>' +
        '<path d="M4 ' + MT_G + 'L62 156L64 ' + MT_G + 'Z" fill="url(#mtB' + uid + ')" stroke="#FDE68A" stroke-width="1.2"/><path d="M308 ' + (MT_G - 24) + 'L358 ' + MT_G + 'H308Z" fill="url(#mtB' + uid + ')" stroke="#FDE68A" stroke-width="1.2"/>';
      var CC = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#06B6D4'];
      for (k = 0; k < 12; k++) h += '<g class="mt-car" transform="translate(' + (MT_X0 + MT_DX * k + 10) + ' ' + MT_G + ') scale(1.18)"><g class="mt-ci"><path d="M-8-2v-5l2-1 2-3h7l2 3h3v6z" fill="' + CC[k % 6] + '" stroke="#0F172A" stroke-width=".6"/><path d="M-3-10.5h5l1.6 2.5h-8z" fill="#BAE6FD"/><circle cx="-4.5" cy="-1.5" r="2" fill="#111827"/><circle cx="4.5" cy="-1.5" r="2" fill="#111827"/></g>' +
        '<text class="mt-cn" y="11" text-anchor="middle">' + (k + 1) + '</text></g>';
      h += '<g class="mt-tr"><g transform="scale(1.25)"><g class="mt-tb"><path d="M-18-16h22l6-8h10l3 8h4v10h-45z" fill="#16A34A" stroke="#052E16" stroke-width="1"/><path d="M8-23h7l2 6h-11z" fill="#BAE6FD"/><path d="M-16-12h18" stroke="#FDE047" stroke-width="2.2"/></g>' +
        '<g class="mt-w" transform="translate(-11 0)"><circle r="8.5" fill="#334155" stroke="#64748B" stroke-width="2"/><path d="M-6 0h12M0-6v12" stroke="#CBD5E1" stroke-width="1.6"/></g><g class="mt-w" transform="translate(16 0)"><circle r="8.5" fill="#334155" stroke="#64748B" stroke-width="2"/><path d="M-6 0h12M0-6v12" stroke="#CBD5E1" stroke-width="1.6"/></g></g></g>' +
        '<g class="mt-ct" opacity="0" transform="translate(180 54)"><text class="mt-cv" y="0" text-anchor="middle">0</text><text class="mt-cl" y="16" text-anchor="middle">' + K.esc(l.cars) + '</text></g>' + banner(24);
      return h;
    },
    board: function (uid, l, oddTxt, o) {
      return ['c0', 'c1', 'c2', 'c3', 'c4'].map(function (s, i) { return btn(s, lab(['0', '1–4', '5–7', '8–10', '11–12'][i]) + '<i>' + K.esc(l.cars) + '</i>' + odd(s, oddTxt, o), 'mt-b'); }).join('') +
        btn('c12', lab(l.perfect) + '<i>12 / 12</i>' + odd('c12', oddTxt, o), 'mt-b pf');
    },
    hist: function (n) { return chipS(n, n >= 12 ? 'mth2' : n >= 8 ? 'mth1' : 'mth0'); },
    wins: function (res) { var n = +res.n, w = [n === 0 ? 'c0' : n <= 4 ? 'c1' : n <= 7 ? 'c2' : n <= 10 ? 'c3' : 'c4']; if (n >= 12) w.push('c12'); return w; },
    init: function (c) {
      c.tr = c.q('.mt-tr'); c.tb = c.q('.mt-tb'); c.w = [].slice.call(c.box.querySelectorAll('.mt-w')); c.cars = [].slice.call(c.box.querySelectorAll('.mt-ci'));
      c.ct = c.q('.mt-ct'); c.cv = c.q('.mt-cv'); bnInit(c);
    },
    frame: function (c, R, t, e, res) {
      var x, y, rot = 0, spin, n = res ? +res.n : -1, crush = -1, cnt = 0;
      if (!res) { x = 24 + Math.sin(t * .8) * 2; y = MT_G - 11; spin = t * 2; }
      else {
        var m = mtTimes(n), L = mtLand(n), a = m.t0, f = m.fl;
        if (e < 1.3) { x = lerp(-34, 6, eo(e / 1.3)); y = MT_G - 11; }
        else if (e < a) { var k = (e - 1.3) / (a - 1.3); x = lerp(6, 62, k * k); y = lerp(MT_G - 11, 145, k * k); rot = -36 * Math.min(1, k * 3); }
        else if (e < a + f) { var u = (e - a) / f; x = lerp(62, L.x, u); y = lerp(145, L.y, u) - Math.sin(Math.PI * u) * (30 + (L.x - 62) * .22); rot = lerp(-30, 12, u); }
        else {
          var d = e - a - f;
          if (n >= 12) { x = Math.min(420, L.x + d * 40); y = Math.min(MT_G - 11, L.y + d * 24); rot = 25; }
          else { x = L.x + Math.min(6, d * 20); y = L.y + 6 * Math.min(1, d * 5) - Math.abs(Math.sin(Math.min(d, .9) * 7)) * 6 * Math.max(0, 1 - d); rot = 12 * Math.max(0, 1 - d * 2); crush = n; }
        }
        spin = Math.max(0, e) * 14;
        for (var j = 0; j < 12; j++) if (x - 10 > MT_X0 + MT_DX * j + 10 && j < n) cnt = j + 1;
        if (e >= a + f) cnt = Math.min(12, n);
      }
      sa(c.tr, 'transform', tr(x, y, 1, rot));
      c.w.forEach(function (w, i) { sa(w, 'transform', 'translate(' + (i ? 16 : -11) + ' 0) rotate(' + (spin * 57 % 360).toFixed(0) + ')'); });
      c.cars.forEach(function (g, i) { sa(g, 'transform', i === crush ? 'scale(1.15 .45)' : 'scale(1)'); });
      var land = res ? mtTimes(n).t0 + mtTimes(n).fl + .3 : 0; sa(c.ct, 'opacity', res && e >= mtTimes(n).t0 && e < land ? '1' : '0'); txt(c.cv, String(cnt));
      if (!res) { if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var dn = e >= mtTimes(n).t0 + mtTimes(n).fl + .3;
      bnSet(c, dn ? (n >= 12 ? c.l.perfect + ' 12 / 12' : n + ' ' + c.l.cars) : '', 'n0');
    }
  });

  /* ------------------------------------------------------------ Boat Race ------------------------------------------------------------ */
  var BT_C = ['#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#9333EA'];
  function boatSprite(i) {
    var c = BT_C[i];
    return '<g data-a="o -32 2"><path d="M-30 0L-48-3L-48 5Z" fill="#E0F2FE" opacity=".8"/></g>' +
      '<path d="M-30-4H-2L6 1L-2 5H-28Z" fill="' + c + '" stroke="#fff" stroke-width=".8"/><path d="M-30 2H0" stroke="#fff" stroke-opacity=".6" stroke-width="1"/>' +
      '<path d="M-18-4L-14-10H-6L-4-4Z" fill="#BAE6FD" stroke="#0F172A" stroke-width=".6"/><circle cx="-12" cy="-7" r="2.2" fill="#FDE2C4"/><path d="M-14.2-7.6a2.2 2.2 0 0 1 4.4 0z" fill="' + c + '"/>' +
      '<text x="-22" y="1.6" text-anchor="middle" font-size="6" font-weight="900" fill="#fff">' + (i + 1) + '</text>';
  }
  race('boatracelive', {
    cols: BT_C, D: 10.5, gap: [.12, .55], stride: 7, bob: 1.4, leg: 0, trail: [-1, 3, '#E0F2FE', '.35', 46],
    odds0: { w0: 3.35, w1: 3.91, w2: 4.70, w3: 5.87, w4: 7.83, t0: 1.77, t1: 1.99, t2: 2.31, t3: 2.80, t4: 3.65 },
    wins: function (o) { return ['w' + o[0], 't' + o[0], 't' + o[1]]; },
    sprite: boatSprite,
    bg: function (uid, LH, N) {
      var h = '<defs>' + lgd('btS' + uid, '#38BDF8', '#BAE6FD', 1) + lgd('btW' + uid, '#0369A1', '#075985', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#082F49"/>' +
        '<rect x="-300" y="-300" width="960" height="346" fill="url(#btS' + uid + ')"/><path d="M-300 46L-300 34Q40 28 80 36T200 30T360 36L660 36V46Z" fill="#15803D"/>' +
        '<g transform="translate(250 22)"><path d="M0 14h40l-4 6H4z" fill="#F8FAFC"/><path d="M8 14V2l14 12z" fill="#F8FAFC"/><path d="M22 14V5l10 9z" fill="#E2E8F0"/></g>' +
        '<rect x="-300" y="' + RY0 + '" width="960" height="' + (RY1 - RY0) + '" fill="url(#btW' + uid + ')"/>';
      for (var k = 0; k < 24; k++) h += '<path d="M' + ((k * 47) % 340 + 10) + ' ' + (RY0 + 8 + (k * 29) % (RY1 - RY0 - 12)) + 'q4-3 8 0t8 0" stroke="#7DD3FC" stroke-width="1" fill="none" opacity=".45"/>';
      for (k = 1; k < N; k++) { var y = RY0 + k * LH; h += '<path d="M30 ' + y.toFixed(1) + 'H350" stroke="#F8FAFC" stroke-opacity=".5" stroke-width="1"/>'; for (var b = 0; b < 12; b++) h += '<circle cx="' + (40 + b * 26) + '" cy="' + y.toFixed(1) + '" r="1.8" fill="' + (b % 2 ? '#F97316' : '#F8FAFC') + '"/>'; }
      return h + '<rect x="-300" y="' + RY1 + '" width="960" height="320" fill="#15803D"/>' + gateFin(N, LH, '#F8FAFC');
    },
    board: function (uid, l, oddTxt, o) {
      return winBtns(BT_C, null, oddTxt, o) + BT_C.map(function (col, i) { return btn('t' + i, lab(l.top2 + ' · ' + (i + 1)) + odd('t' + i, oddTxt, o), 'rl'); }).join('');
    },
    rules: rules(150, { w0: 3.35, w4: 7.83, t0: 1.77, t4: 3.65 }, {
      en: ['Five speedboats race on the lake. Bet on the winner ({w0} for n°1 to {w4} for n°5) or on a boat finishing in the TOP 2 ({t0} for n°1 to {t4} for n°5).', 'Each boat has its own fixed chance (n°1 is the favourite). The finishing order is drawn by the server when bets close and the race shows exactly that order. The winner also wins Top 2.'],
      fr: ['Cinq bateaux de course filent sur le lac. Parie sur le gagnant ({w0} pour le n°1 à {w4} pour le n°5) ou sur un bateau dans le TOP 2 ({t0} pour le n°1 à {t4} pour le n°5).', 'Chaque bateau a sa chance fixe (le n°1 est le favori). L’ordre d’arrivée est tiré par le serveur à la fermeture des paris et la course montre exactement cet ordre. Le gagnant gagne aussi Top 2.'],
      es: ['Cinco lanchas compiten en el lago. Apuesta al ganador ({w0} la n°1 a {w4} la n°5) o a una lancha en el TOP 2 ({t0} la n°1 a {t4} la n°5).', 'Cada lancha tiene su probabilidad fija (la n°1 es la favorita). El orden de llegada lo sortea el servidor al cerrar y la carrera lo muestra tal cual. El ganador también gana Top 2.'],
      pt: ['Cinco lanchas correm no lago. Aposte no vencedor ({w0} a n°1 a {w4} a n°5) ou numa lancha no TOP 2 ({t0} a n°1 a {t4} a n°5).', 'Cada lancha tem sua chance fixa (a n°1 é a favorita). A ordem de chegada é sorteada pelo servidor no fechamento e a corrida mostra exatamente essa ordem. O vencedor também ganha Top 2.'],
      ar: ['خمسة زوارق سريعة تتسابق في البحيرة. راهن على الفائز ({w0} للرقم 1 حتى {w4} للرقم 5) أو على زورق ضمن أول 2 ({t0} للرقم 1 حتى {t4} للرقم 5).', 'لكل زورق فرصة ثابتة (الرقم 1 هو المرشح). يسحب الخادم ترتيب الوصول عند إغلاق الرهانات ويعرضه السباق بالضبط. الفائز يربح أيضًا رهان أول 2.'],
      tr: ['Beş sürat teknesi gölde yarışır. Kazananı ({w0} 1 numaradan {w4} 5 numaraya) ya da İLK 2’ye giren tekneyi ({t0} 1 numaradan {t4} 5 numaraya) oyna.', 'Her teknenin sabit şansı var (1 numara favori). Varış sırası bahisler kapanınca sunucu tarafından çekilir ve yarış tam bu sırayı gösterir. Kazanan İlk 2’yi de kazanır.'],
      vi: ['Năm xuồng máy đua trên hồ. Cược chiếc thắng ({w0} cho số 1 đến {w4} cho số 5) hoặc chiếc về TOP 2 ({t0} cho số 1 đến {t4} cho số 5).', 'Mỗi chiếc có cơ hội cố định (số 1 được ưa chuộng). Thứ tự về đích do máy chủ rút khi đóng cược và cuộc đua hiển thị đúng thứ tự đó. Chiếc thắng cũng thắng Top 2.'],
      id: ['Lima speedboat berpacu di danau. Pasang pemenang ({w0} no.1 hingga {w4} no.5) atau perahu yang masuk TOP 2 ({t0} no.1 hingga {t4} no.5).', 'Tiap perahu punya peluang tetap (no.1 favorit). Urutan finis diundi server saat taruhan ditutup dan balapan menampilkannya persis. Pemenang juga menang Top 2.'],
      ru: ['Пять катеров гоняются по озеру. Ставьте на победителя ({w0} за №1 … {w4} за №5) или на катер в ТОП-2 ({t0} за №1 … {t4} за №5).', 'У каждого катера свой постоянный шанс (№1 — фаворит). Порядок финиша разыгрывает сервер при закрытии ставок, гонка показывает именно его. Победитель выигрывает и Топ-2.'],
      de: ['Fünf Rennboote rasen über den See. Setze auf den Sieger ({w0} für Nr. 1 bis {w4} für Nr. 5) oder auf ein Boot in den TOP 2 ({t0} für Nr. 1 bis {t4} für Nr. 5).', 'Jedes Boot hat seine feste Chance (Nr. 1 ist Favorit). Die Reihenfolge zieht der Server beim Schließen, das Rennen zeigt genau sie. Der Sieger gewinnt auch Top 2.'],
      hi: ['पाँच स्पीडबोट झील में रेस करती हैं। विजेता पर ({w0} नंबर 1 से {w4} नंबर 5 तक) या टॉप 2 में आने वाली बोट पर ({t0} नंबर 1 से {t4} नंबर 5 तक) दांव लगाएं।', 'हर बोट की तय संभावना है (नंबर 1 फ़ेवरेट)। दांव बंद होने पर सर्वर क्रम निकालता है और रेस ठीक वही दिखाती है। विजेता टॉप 2 भी जीतता है।'],
      zh: ['五艘快艇在湖上竞速。押冠军（1 号 {w0} 至 5 号 {w4}），或押进入前二的快艇（1 号 {t0} 至 5 号 {t4}）。', '每艘快艇胜率固定（1 号为热门）。停止下注时由服务器抽出名次，比赛完全按此名次呈现。冠军同时赢得前二。']
    })
  });

  /* ------------------------------------------------------------ Space Race ------------------------------------------------------------ */
  var SP_TC = ['#D97706', '#0891B2', '#DB2777'], SP_C = [0, 1, 2, 0, 1, 2].map(function (k) { return SP_TC[k]; });
  function rocketSprite(i) {
    var c = SP_C[i];
    return '<g data-a="f -27 0 1"><path d="M0 0L-12-4.5Q-15 0-12 4.5Z" fill="#FDBA74"/><path d="M0 0L-7-2.5Q-9 0-7 2.5Z" fill="#FEF3C7"/></g>' +
      '<path d="M-27-5L-31-11L-21-5Z" fill="' + c + '"/><path d="M-27 5L-31 11L-21 5Z" fill="' + c + '"/>' +
      '<path d="M-28-5H-8Q2-5 6 0Q2 5-8 5H-28Z" fill="#E2E8F0" stroke="#64748B" stroke-width=".7"/><path d="M-8-5Q2-5 6 0Q2 5-8 5Z" fill="' + c + '"/>' +
      '<circle cx="-13" cy="0" r="2.6" fill="#0EA5E9" stroke="#334155" stroke-width=".8"/><text x="-22" y="2.4" text-anchor="middle" font-size="6.5" font-weight="900" fill="' + c + '">' + (i + 1) + '</text>';
  }
  race('spaceracelive', {
    cols: SP_C, D: 9.5, gap: [.1, .45], stride: 9, bob: .6, leg: 0,
    odds0: { w0: 4.27, w1: 4.70, w2: 5.52, w3: 5.87, w4: 7.23, w5: 7.83, k0: 2.47, k1: 2.84, k2: 3.24 },
    wins: function (o) { return ['w' + o[0], 'k' + (o[0] % 3)]; },
    sprite: rocketSprite,
    bg: function (uid, LH, N) {
      var h = '<defs><radialGradient id="spP' + uid + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FDE68A"/><stop offset=".6" stop-color="#F97316"/><stop offset="1" stop-color="#7C2D12"/></radialGradient></defs><rect x="-300" y="-300" width="960" height="830" fill="#05031A"/>';
      for (var k = 0; k < 60; k++) h += '<circle cx="' + ((k * 97) % 380 - 10) + '" cy="' + ((k * 53) % 250 - 10) + '" r="' + (k % 5 ? .7 : 1.3) + '" fill="#fff" opacity="' + (.3 + (k % 4) * .17).toFixed(2) + '"/>';
      h += '<circle cx="372" cy="131" r="58" fill="url(#spP' + uid + ')" opacity=".9"/><circle cx="40" cy="22" r="10" fill="#94A3B8" opacity=".5"/><circle cx="36" cy="19" r="2" fill="#64748B" opacity=".6"/>';
      for (k = 0; k <= N; k++) h += '<path d="M30 ' + (RY0 + k * LH).toFixed(1) + 'H330" stroke="#818CF8" stroke-opacity=".35" stroke-width="1" stroke-dasharray="1 5"/>';
      return h + gateFin(N, LH, '#818CF8');
    },
    board: function (uid, l, oddTxt, o) {
      return winBtns(SP_C, null, oddTxt, o) +
        [l.gold, l.cyan, l.pink].map(function (n, k) { return btn('k' + k, '<i class="tm" style="background:' + SP_TC[k] + '"></i>' + lab(n + ' ' + (k + 1) + '·' + (k + 4)) + odd('k' + k, oddTxt, o), 'x2 tmb'); }).join('');
    },
    rules: rules(150, { w0: 4.27, w5: 7.83, k0: 2.47, k1: 2.84, k2: 3.24 }, {
      en: ['Six rockets race to the planet, in three colour teams: Gold (n°1 and n°4), Cyan (n°2 and n°5), Pink (n°3 and n°6). Bet on the winning rocket ({w0} for n°1 to {w5} for n°6) or on the winning team (Gold {k0}, Cyan {k1}, Pink {k2}).', 'Each rocket has its own fixed chance (n°1 is the favourite). The finishing order is drawn by the server when bets close and the race shows exactly that order.'],
      fr: ['Six fusées foncent vers la planète, en trois équipes de couleur : Or (n°1 et n°4), Cyan (n°2 et n°5), Rose (n°3 et n°6). Parie sur la fusée gagnante ({w0} pour la n°1 à {w5} pour la n°6) ou sur l’équipe gagnante (Or {k0}, Cyan {k1}, Rose {k2}).', 'Chaque fusée a sa chance fixe (la n°1 est la favorite). L’ordre d’arrivée est tiré par le serveur à la fermeture des paris et la course montre exactement cet ordre.'],
      es: ['Seis cohetes corren hacia el planeta, en tres equipos de color: Oro (n°1 y n°4), Cian (n°2 y n°5), Rosa (n°3 y n°6). Apuesta al cohete ganador ({w0} el n°1 a {w5} el n°6) o al equipo ganador (Oro {k0}, Cian {k1}, Rosa {k2}).', 'Cada cohete tiene su probabilidad fija (el n°1 es el favorito). El orden de llegada lo sortea el servidor al cerrar y la carrera lo muestra tal cual.'],
      pt: ['Seis foguetes correm até o planeta, em três equipes de cor: Ouro (n°1 e n°4), Ciano (n°2 e n°5), Rosa (n°3 e n°6). Aposte no foguete vencedor ({w0} o n°1 a {w5} o n°6) ou na equipe vencedora (Ouro {k0}, Ciano {k1}, Rosa {k2}).', 'Cada foguete tem sua chance fixa (o n°1 é o favorito). A ordem de chegada é sorteada pelo servidor no fechamento e a corrida mostra exatamente essa ordem.'],
      ar: ['ستة صواريخ تتسابق نحو الكوكب في ثلاثة فرق ملونة: ذهبي (1 و4)، سماوي (2 و5)، وردي (3 و6). راهن على الصاروخ الفائز ({w0} للرقم 1 حتى {w5} للرقم 6) أو على الفريق الفائز (ذهبي {k0}، سماوي {k1}، وردي {k2}).', 'لكل صاروخ فرصة ثابتة (الرقم 1 هو المرشح). يسحب الخادم ترتيب الوصول عند إغلاق الرهانات ويعرضه السباق بالضبط.'],
      tr: ['Altı roket gezegene doğru üç renkli takım hâlinde yarışır: Altın (1 ve 4), Turkuaz (2 ve 5), Pembe (3 ve 6). Kazanan roketi ({w0} 1 numaradan {w5} 6 numaraya) ya da kazanan takımı (Altın {k0}, Turkuaz {k1}, Pembe {k2}) oyna.', 'Her roketin sabit şansı var (1 numara favori). Varış sırası bahisler kapanınca sunucu tarafından çekilir ve yarış tam bu sırayı gösterir.'],
      vi: ['Sáu tên lửa đua tới hành tinh, chia ba đội màu: Vàng (số 1 và 4), Lục lam (số 2 và 5), Hồng (số 3 và 6). Cược tên lửa thắng ({w0} cho số 1 đến {w5} cho số 6) hoặc đội thắng (Vàng {k0}, Lục lam {k1}, Hồng {k2}).', 'Mỗi tên lửa có cơ hội cố định (số 1 được ưa chuộng). Thứ tự về đích do máy chủ rút khi đóng cược và cuộc đua hiển thị đúng thứ tự đó.'],
      id: ['Enam roket berpacu ke planet dalam tiga tim warna: Emas (no.1 dan 4), Sian (no.2 dan 5), Merah muda (no.3 dan 6). Pasang roket pemenang ({w0} no.1 hingga {w5} no.6) atau tim pemenang (Emas {k0}, Sian {k1}, Merah muda {k2}).', 'Tiap roket punya peluang tetap (no.1 favorit). Urutan finis diundi server saat taruhan ditutup dan balapan menampilkannya persis.'],
      ru: ['Шесть ракет летят к планете тремя командами: Золото (№1 и №4), Бирюза (№2 и №5), Розовые (№3 и №6). Ставьте на ракету-победителя ({w0} за №1 … {w5} за №6) или на команду (Золото {k0}, Бирюза {k1}, Розовые {k2}).', 'У каждой ракеты свой постоянный шанс (№1 — фаворит). Порядок финиша разыгрывает сервер при закрытии ставок, гонка показывает именно его.'],
      de: ['Sechs Raketen rasen zum Planeten, in drei Farbteams: Gold (Nr. 1 und 4), Cyan (Nr. 2 und 5), Pink (Nr. 3 und 6). Setze auf die Sieger-Rakete ({w0} für Nr. 1 bis {w5} für Nr. 6) oder auf das Siegerteam (Gold {k0}, Cyan {k1}, Pink {k2}).', 'Jede Rakete hat ihre feste Chance (Nr. 1 ist Favorit). Die Reihenfolge zieht der Server beim Schließen, das Rennen zeigt genau sie.'],
      hi: ['छह रॉकेट तीन रंगों की टीमों में ग्रह की ओर दौड़ते हैं: सुनहरा (1 और 4), आसमानी (2 और 5), गुलाबी (3 और 6)। जीतने वाले रॉकेट पर ({w0} नंबर 1 से {w5} नंबर 6 तक) या जीतने वाली टीम पर (सुनहरा {k0}, आसमानी {k1}, गुलाबी {k2}) दांव लगाएं।', 'हर रॉकेट की तय संभावना है (नंबर 1 फ़ेवरेट)। दांव बंद होने पर सर्वर क्रम निकालता है और रेस ठीक वही दिखाती है।'],
      zh: ['六枚火箭分三支颜色队伍飞向星球：金队（1 号和 4 号）、青队（2 号和 5 号）、粉队（3 号和 6 号）。押冠军火箭（1 号 {w0} 至 6 号 {w5}），或押获胜队伍（金 {k0}、青 {k1}、粉 {k2}）。', '每枚火箭胜率固定（1 号为热门）。停止下注时由服务器抽出名次，比赛完全按此名次呈现。']
    })
  });

  /* --------------------------------------------------------- Penalty Shootout ---------------------------------------------------------
     Home (red) and Away (blue) alternate; the drawn list k holds every kick taken (1 = goal), stopped as soon as it is decided, then
     sudden death. Each kick: run-up, shot, keeper dive (saves on a miss, beaten on a goal). Kick length adapts so long shootouts fit. */
  function pkDk(res) { var nk = (res.k || []).length; return Math.min(1.7, 30 / Math.max(1, nk)); }
  var PK_0 = .6;
  function pkSpot(s, j, goal) {
    var a = hs(s, 100 + j), b = hs(s, 200 + j), side = a < .5 ? -1 : 1;
    if (goal) return { x: 180 + side * (22 + b * 58), y: 86 + hs(s, 300 + j) * 46, kx: hs(s, 400 + j) < .7 ? -side : side * .2 };
    var wide = hs(s, 500 + j) < .3;
    return wide ? { x: 180 + side * (92 + b * 18), y: 70 + hs(s, 300 + j) * 50, kx: -side * .6, wide: 1 } : { x: 180 + side * (14 + b * 62), y: 96 + hs(s, 300 + j) * 38, kx: side, save: 1 };
  }
  live('penaltylive', {
    lab: 'pk', bev: 'act', show: function (res) { return PK_0 + (res.k || []).length * pkDk(res) + 2.4; },
    odds0: { h: 1.88, a: 1.88, sd: 3.23, early: 2.12 },
    beat: function (e, res) { var dk = pkDk(res); return e < PK_0 ? 0 : 1 + Math.floor((e - PK_0 + dk * .55) / dk); },
    rules: rules(170, { h: 1.88, sd: 3.23, early: 2.12 }, {
      en: ['Home (red) and Away (blue) take 5 penalties each, alternately; each shot scores 3 times out of 4. Bet on the winner Home or Away ({h}), on Sudden death ({sd}: still level after 5 each) or on an Early win ({early}: decided before the 10th kick).', 'As in real football, the shootout stops as soon as one side can no longer be caught; if level after 5 each, sudden death: one kick each until one scores and the other misses. Every kick is drawn by the server when bets close.'],
      fr: ['Domicile (rouge) et Extérieur (bleu) tirent 5 penalties chacun, à tour de rôle ; chaque tir marque 3 fois sur 4. Parie sur le vainqueur Domicile ou Extérieur ({h}), sur la Mort subite ({sd} : toujours à égalité après 5 tirs chacun) ou sur Gagné tôt ({early} : décidé avant le 10e tir).', 'Comme au vrai football, la séance s’arrête dès qu’une équipe ne peut plus être rattrapée ; à égalité après 5 tirs chacun, mort subite : un tir chacun jusqu’à ce que l’un marque et l’autre rate. Chaque tir est tiré par le serveur à la fermeture des paris.'],
      es: ['Local (rojo) y Visitante (azul) lanzan 5 penaltis cada uno, alternando; cada tiro marca 3 de cada 4 veces. Apuesta al ganador Local o Visitante ({h}), a Muerte súbita ({sd}: empatados tras 5 cada uno) o a Gana pronto ({early}: decidido antes del 10.º tiro).', 'Como en el fútbol real, la tanda termina en cuanto un equipo ya no puede ser alcanzado; si siguen empatados tras 5, muerte súbita: un tiro cada uno hasta que uno marque y el otro falle. Cada tiro lo sortea el servidor al cerrar.'],
      pt: ['Casa (vermelho) e Fora (azul) cobram 5 pênaltis cada, alternando; cada cobrança entra 3 vezes em 4. Aposte no vencedor Casa ou Fora ({h}), em Morte súbita ({sd}: empatados após 5 cada) ou em Vitória cedo ({early}: decidido antes da 10.ª cobrança).', 'Como no futebol real, a disputa para assim que um time não pode mais ser alcançado; empatados após 5, morte súbita: uma cobrança cada até um marcar e o outro errar. Cada cobrança é sorteada pelo servidor no fechamento.'],
      ar: ['يسدد المضيف (أحمر) والضيف (أزرق) 5 ركلات ترجيح لكل منهما بالتناوب؛ كل ركلة تسجل 3 مرات من 4. راهن على الفائز المضيف أو الضيف ({h})، أو على الموت المفاجئ ({sd}: تعادل بعد 5 ركلات لكل فريق) أو على الفوز المبكر ({early}: الحسم قبل الركلة العاشرة).', 'كما في كرة القدم الحقيقية، تتوقف الركلات بمجرد أن يصبح اللحاق مستحيلًا؛ وعند التعادل بعد 5 لكل فريق موت مفاجئ: ركلة لكل فريق حتى يسجل أحدهما ويضيع الآخر. يسحب الخادم كل ركلة عند إغلاق الرهانات.'],
      tr: ['Ev sahibi (kırmızı) ve Deplasman (mavi) sırayla 5’er penaltı atar; her atış 4’te 3 gol olur. Kazanana, Ev sahibi veya Deplasman ({h}), Ani ölüme ({sd}: 5’er atıştan sonra hâlâ eşitlik) ya da Erken galibiyete ({early}: 10. atıştan önce belli olur) oyna.', 'Gerçek futboldaki gibi, bir taraf artık yakalanamayınca atışlar biter; 5’er atıştan sonra eşitlikte ani ölüm: biri atıp diğeri kaçırana kadar birer atış. Her atış bahisler kapanınca sunucu tarafından çekilir.'],
      vi: ['Chủ nhà (đỏ) và Đội khách (xanh) lần lượt sút 5 quả mỗi đội; mỗi cú sút vào 3 trên 4 lần. Cược đội thắng Chủ nhà hoặc Đội khách ({h}), Đá thêm ({sd}: vẫn hòa sau 5 quả mỗi đội) hoặc Thắng sớm ({early}: phân định trước cú sút thứ 10).', 'Như bóng đá thật, loạt sút dừng ngay khi một đội không thể bị bắt kịp; nếu hòa sau 5 quả, đá thêm: mỗi đội một quả đến khi một đội vào và đội kia hỏng. Mỗi cú sút do máy chủ rút khi đóng cược.'],
      id: ['Tuan rumah (merah) dan Tamu (biru) bergantian menendang 5 penalti; tiap tendangan gol 3 dari 4 kali. Pasang pemenang Tuan rumah atau Tamu ({h}), Sudden death ({sd}: masih imbang setelah 5 tendangan) atau Menang cepat ({early}: ditentukan sebelum tendangan ke-10).', 'Seperti sepak bola asli, adu penalti berhenti begitu satu tim tak bisa dikejar; jika imbang setelah 5, sudden death: satu tendangan masing-masing sampai satu gol dan lainnya gagal. Setiap tendangan diundi server saat taruhan ditutup.'],
      ru: ['Хозяева (красные) и Гости (синие) по очереди бьют по 5 пенальти; каждый удар забивается в 3 случаях из 4. Ставьте на победу Хозяев или Гостей ({h}), на удары до промаха ({sd}: ничья после 5 ударов у каждой) или на досрочную победу ({early}: всё решено до 10-го удара).', 'Как в настоящем футболе, серия заканчивается, как только одну команду уже не догнать; при ничьей после 5 ударов — по одному удару, пока один не забьёт, а другой промажет. Каждый удар разыгрывает сервер при закрытии ставок.'],
      de: ['Heim (rot) und Gast (blau) schießen abwechselnd je 5 Elfmeter; jeder Schuss trifft 3-mal von 4. Setze auf den Sieger Heim oder Gast ({h}), auf Sudden Death ({sd}: nach je 5 noch gleich) oder auf Früh entschieden ({early}: vor dem 10. Schuss).', 'Wie im echten Fußball endet das Schießen, sobald eine Seite nicht mehr einholbar ist; bei Gleichstand nach je 5 Sudden Death: je ein Schuss, bis einer trifft und der andere verschießt. Jeder Schuss wird beim Schließen vom Server gezogen.'],
      hi: ['होम (लाल) और अवे (नीली) बारी-बारी से 5-5 पेनल्टी लेती हैं; हर शॉट 4 में से 3 बार गोल होता है। विजेता होम या अवे ({h}), सडन डेथ ({sd}: 5-5 के बाद भी बराबर) या जल्दी जीत ({early}: 10वें शॉट से पहले फ़ैसला) पर दांव लगाएं।', 'असली फ़ुटबॉल की तरह, जैसे ही कोई टीम पकड़ में न आ सके शूटआउट रुक जाता है; 5-5 के बाद बराबरी पर सडन डेथ: एक-एक शॉट जब तक एक गोल करे और दूसरा चूके। हर शॉट दांव बंद होने पर सर्वर निकालता है।'],
      zh: ['主队（红）与客队（蓝）轮流各罚 5 球；每次射门 4 中 3。押主队或客队获胜（{h}）、突然死亡（{sd}：各罚 5 球后仍平）或提前决胜（{early}：第 10 罚之前已分胜负）。', '与真实足球一样，一方已无法追上时点球大战立即结束；各罚 5 球后仍平则进入突然死亡：每队各罚一球，直到一方罚进而另一方罚失。每一脚都由服务器在停止下注时抽出。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + lgd('pkS' + uid, '#0F172A', '#1E3A8A', 1) + lgd('pkG' + uid, '#15803D', '#166534', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#0B1120"/>' +
        '<rect x="-300" y="-300" width="960" height="356" fill="url(#pkS' + uid + ')"/>';
      for (var k = 0; k < 40; k++) h += '<circle cx="' + ((k * 37) % 370) + '" cy="' + (36 + (k * 13) % 18) + '" r="2.2" fill="' + ['#EF4444', '#3B82F6', '#F8FAFC', '#FDE68A'][k % 4] + '" opacity=".5"/>';
      h += '<rect x="-300" y="56" width="960" height="500" fill="url(#pkG' + uid + ')"/>';
      for (k = 0; k < 6; k++) h += '<rect x="-300" y="' + (90 + k * 26) + '" width="960" height="13" fill="#fff" opacity=".035"/>';
      h += '<path d="M60 150H300M110 196L250 196" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" fill="none"/><path d="M128 150L112 196M232 150L248 196" stroke="#fff" stroke-opacity=".4" stroke-width="1.4"/>' +
        '<g opacity=".28" stroke="#fff" stroke-width=".7">';
      for (k = 0; k <= 18; k++) h += '<path d="M' + (90 + k * 10) + ' 66V150"/>';
      for (k = 0; k <= 8; k++) h += '<path d="M90 ' + (66 + k * 10.5) + 'H270"/>';
      h += '</g><path d="M90 150V64H270V150" stroke="#F8FAFC" stroke-width="4" fill="none" stroke-linejoin="round"/><circle cx="180" cy="208" r="2" fill="#fff"/>' +
        '<g class="pk-kp" transform="translate(180 150)"><g class="pk-ki"><rect x="-7" y="-34" width="14" height="20" rx="5" fill="#FACC15"/><circle cy="-40" r="5.5" fill="#FDE2C4"/><path d="M-7-30L-17-40M7-30L17-40" stroke="#FACC15" stroke-width="4" stroke-linecap="round"/><circle cx="-18" cy="-41" r="3" fill="#F8FAFC"/><circle cx="18" cy="-41" r="3" fill="#F8FAFC"/><path d="M-4-14L-6 0M4-14L6 0" stroke="#111827" stroke-width="4" stroke-linecap="round"/></g></g>' +
        '<g class="pk-pl" transform="translate(160 214)"><g class="pk-pc"><rect x="-6" y="-26" width="12" height="16" rx="4" fill="#DC2626"/><circle cy="-31" r="5" fill="#FDE2C4"/><path d="M-3-10L-5 4M3-10L6 3" stroke="#F8FAFC" stroke-width="3.6" stroke-linecap="round"/></g></g>' +
        '<g class="pk-b" transform="translate(180 207)"><circle r="6" fill="#F8FAFC" stroke="#111827" stroke-width=".8"/><path d="M0-2.6L2.4-.8 1.5 2H-1.5L-2.4-.8Z" fill="#111827"/></g>' +
        '<g class="pk-fx" opacity="0"><rect x="-44" y="-13" width="88" height="26" rx="13"/><text y="5" text-anchor="middle"></text></g>' +
        '<g class="pk-sb"><rect x="58" y="6" width="244" height="40" rx="10" fill="rgba(2,6,23,.78)" stroke="#FDE68A" stroke-opacity=".4"/>' +
        '<text class="pk-tn" x="68" y="21">' + K.esc(l.home) + '</text><text class="pk-tn" x="68" y="39">' + K.esc(l.away) + '</text>' +
        [0, 1].map(function (r) { var s = ''; for (var i = 0; i < 5; i++) s += '<circle class="pk-d" cx="' + (172 + i * 16) + '" cy="' + (17 + r * 18) + '" r="5.5"/>'; return s; }).join('') +
        '<text class="pk-sc" x="290" y="21" text-anchor="end">0</text><text class="pk-sc" x="290" y="39" text-anchor="end">0</text><text class="pk-sdt" x="180" y="60" text-anchor="middle"></text></g>' + banner(186);
      return h;
    },
    board: function (uid, l, oddTxt, o) {
      return btn('h', '<i class="tm" style="background:#DC2626"></i>' + lab(l.home) + odd('h', oddTxt, o), 'pk-b2') + btn('a', '<i class="tm" style="background:#2563EB"></i>' + lab(l.away) + odd('a', oddTxt, o), 'pk-b2') +
        btn('sd', lab(l.sd) + odd('sd', oddTxt, o), 'pk-b2') + btn('early', lab(l.early) + odd('early', oddTxt, o), 'pk-b2');
    },
    hist: function (n) { return chipS(n ? 'A' : 'H', 'pkh' + (n ? 1 : 0)); },
    wins: function (res) { var w = [+res.n ? 'a' : 'h'], st = +res.st; if (st === 0) w.push('sd'); else if (st > 0 && st < 10) w.push('early'); return w; },
    init: function (c) {
      c.kp = c.q('.pk-kp'); c.ki = c.q('.pk-ki'); c.pl = c.q('.pk-pl'); c.pc = c.q('.pk-pc rect'); c.b = c.q('.pk-b'); c.fx = c.q('.pk-fx'); c.fxt = c.fx.querySelector('text'); c.fxr = c.fx.querySelector('rect');
      c.d = [].slice.call(c.box.querySelectorAll('.pk-d')); c.sc = [].slice.call(c.box.querySelectorAll('.pk-sc')); c.sdt = c.q('.pk-sdt'); c.sbg = c.q('.pk-sb'); bnInit(c);
    },
    frame: function (c, R, t, e, res) {
      var k = res ? (res.k || []).map(Number) : [], s = res ? +res.s || 0 : 0, dk = res ? pkDk(res) : 1.6, j, i;
      var cur = res ? Math.floor((e - PK_0) / dk) : -1, ph = res ? (e - PK_0) / dk - cur : 0;
      if (cur >= k.length) { cur = k.length - 1; ph = 1.01; }
      var done = function (jj) { return jj < cur || (jj === cur && ph >= .62); }; // the result of kick jj is known
      // scoreboard: the first 5 kicks of each side as dots, totals on the right
      var gs = [0, 0];
      for (j = 0; j < k.length; j++) if (done(j) && k[j]) gs[j % 2]++;
      for (i = 0; i < 10; i++) { var r = Math.floor(i / 5), jj = (i % 5) * 2 + r, v = !res || jj >= k.length || !done(jj) ? 'pk-d' : k[jj] ? 'pk-d g' : 'pk-d x'; cls(c.d[i], v); }
      txt(c.sc[0], String(gs[0])); txt(c.sc[1], String(gs[1]));
      txt(c.sdt, res && cur >= 10 ? c.l.sd : '', 200);
      if (!res || e < PK_0) {
        sa(c.b, 'transform', 'translate(180 207)'); sa(c.kp, 'transform', 'translate(' + (180 + Math.sin(t * 1.3) * 10).toFixed(1) + ' 150)'); sa(c.ki, 'transform', 'rotate(0)');
        sa(c.pl, 'transform', 'translate(160 214)'); sa(c.fx, 'opacity', '0'); sa(c.pc, 'fill', res ? '#DC2626' : '#DC2626');
        if (!bnCd(c, R, t, e)) bnSet(c, ''); return;
      }
      var goal = !!k[cur], sp = pkSpot(s, cur, goal), home = cur % 2 === 0;
      sa(c.pc, 'fill', home ? '#DC2626' : '#2563EB');
      // run-up (0 → .3), shot (.3 → .62), result (.62 → 1)
      var ru = eo(seg(ph, 0, .3)); sa(c.pl, 'transform', 'translate(' + lerp(146, 170, ru).toFixed(1) + ' ' + lerp(226, 214, ru).toFixed(1) + ')');
      var u = seg(ph, .3, .62), bx = lerp(180, sp.x, u), by = lerp(207, sp.y, u) - Math.sin(Math.PI * u) * 16, bs = lerp(1, .55, u);
      if (sp.save && ph > .62) { bx = sp.x + (sp.x < 180 ? -1 : 1) * 30 * seg(ph, .62, 1); by = sp.y + 40 * seg(ph, .62, 1); }
      if (goal && ph > .62) by = sp.y + 8 * seg(ph, .62, .8);
      sa(c.b, 'transform', tr(bx, by, bs, u * 720));
      var dv = eo(seg(ph, .34, .6)), kx = sp.save ? (sp.x - 180) * .9 : sp.kx * 60, ky = sp.save ? Math.min(0, sp.y - 120) * .6 : -12;
      sa(c.kp, 'transform', 'translate(' + (180 + kx * dv).toFixed(1) + ' ' + (150 + ky * dv).toFixed(1) + ')'); sa(c.ki, 'transform', 'rotate(' + (Math.sign(kx) * 70 * dv).toFixed(1) + ')');
      var show = ph >= .62 && ph < 1;
      sa(c.fx, 'opacity', show ? '1' : '0'); sa(c.fx, 'transform', 'translate(180 ' + (goal ? 104 : 104) + ')'); cls(c.fx, 'pk-fx ' + (goal ? 'g' : 'x'));
      txt(c.fxt, goal ? c.l.goal : sp.wide ? c.l.out : c.l.saved, 80);
      var fin = e >= PK_0 + k.length * dk + .2, n = +res.n;
      bnSet(c, fin ? (n ? c.l.away : c.l.home) + ' ' + c.l.wins + ' ' + (n ? gs[1] + '–' + gs[0] : gs[0] + '–' + gs[1]) : '', 'n0');
    }
  });

  /* ------------------------------------------------------------ Basketball ------------------------------------------------------------
     The shooter takes 10 shots (drawn list s: 1 = basket). Made: clean arc through the net. Missed: off the rim. */
  var BK_0 = .4, BK_D = 1.15, BK_RX = 296, BK_RY = 92;
  live('basketlive', {
    lab: 'sh', bev: 'act', SHOW: BK_0 + 10 * BK_D + 2.2,
    odds0: { u5: 3.59, e5: 4.01, e6: 3.94, o6: 3.53, st4: 2.85, p10: 371.10 },
    beat: function (e) { return e < BK_0 ? 0 : Math.min(11, 1 + Math.floor((e - BK_0 + BK_D * .2) / BK_D)); },
    rules: rules(145, { u5: 3.59, e5: 4.01, e6: 3.94, o6: 3.53, st4: 2.85, p10: 371.10 }, {
      en: ['The player takes 10 shots; each one goes in 55 times out of 100. Bet on the number of baskets: 0–4 ({u5}), exactly 5 ({e5}), exactly 6 ({e6}), 7–10 ({o6}); or on a streak of 4 in a row ({st4}) or a perfect 10/10 ({p10}).', 'Every shot is drawn by the server when bets close and the show plays them one by one. 10/10 also wins 7–10 and 4 in a row.'],
      fr: ['Le joueur prend 10 tirs ; chacun rentre 55 fois sur 100. Parie sur le nombre de paniers : 0–4 ({u5}), exactement 5 ({e5}), exactement 6 ({e6}), 7–10 ({o6}) ; ou sur une série de 4 de suite ({st4}) ou un parfait 10/10 ({p10}).', 'Chaque tir est tiré par le serveur à la fermeture des paris et le spectacle les joue un par un. 10/10 gagne aussi 7–10 et 4 de suite.'],
      es: ['El jugador lanza 10 tiros; cada uno entra 55 de cada 100 veces. Apuesta al número de canastas: 0–4 ({u5}), exactamente 5 ({e5}), exactamente 6 ({e6}), 7–10 ({o6}); o a una racha de 4 seguidos ({st4}) o un perfecto 10/10 ({p10}).', 'Cada tiro lo sortea el servidor al cerrar y el show los juega uno a uno. 10/10 también gana 7–10 y 4 seguidos.'],
      pt: ['O jogador faz 10 arremessos; cada um cai 55 vezes em 100. Aposte no número de cestas: 0–4 ({u5}), exatamente 5 ({e5}), exatamente 6 ({e6}), 7–10 ({o6}); ou numa série de 4 seguidas ({st4}) ou num perfeito 10/10 ({p10}).', 'Cada arremesso é sorteado pelo servidor no fechamento e o show os mostra um a um. 10/10 também ganha 7–10 e 4 seguidas.'],
      ar: ['يسدد اللاعب 10 رميات؛ كل رمية تدخل 55 مرة من 100. راهن على عدد السلات: 0–4 ({u5})، 5 بالضبط ({e5})، 6 بالضبط ({e6})، 7–10 ({o6})؛ أو على 4 متتالية ({st4}) أو 10/10 مثالية ({p10}).', 'يسحب الخادم كل رمية عند إغلاق الرهانات ويعرضها العرض واحدة تلو الأخرى. 10/10 تربح أيضًا 7–10 و4 متتالية.'],
      tr: ['Oyuncu 10 atış yapar; her atış 100’de 55 kez girer. Basket sayısına oyna: 0–4 ({u5}), tam 5 ({e5}), tam 6 ({e6}), 7–10 ({o6}); ya da üst üste 4 ({st4}) veya kusursuz 10/10 ({p10}).', 'Her atış bahisler kapanınca sunucu tarafından çekilir ve gösteri bunları tek tek oynatır. 10/10, 7–10 ve üst üste 4’ü de kazanır.'],
      vi: ['Cầu thủ ném 10 quả; mỗi quả vào 55 lần trên 100. Cược số quả vào: 0–4 ({u5}), đúng 5 ({e5}), đúng 6 ({e6}), 7–10 ({o6}); hoặc chuỗi 4 quả liên tiếp ({st4}) hay hoàn hảo 10/10 ({p10}).', 'Mỗi cú ném do máy chủ rút khi đóng cược và màn trình diễn phát lần lượt từng quả. 10/10 cũng thắng 7–10 và 4 liên tiếp.'],
      id: ['Pemain melakukan 10 tembakan; tiap tembakan masuk 55 dari 100 kali. Pasang jumlah keranjang: 0–4 ({u5}), tepat 5 ({e5}), tepat 6 ({e6}), 7–10 ({o6}); atau 4 beruntun ({st4}) atau sempurna 10/10 ({p10}).', 'Setiap tembakan diundi server saat taruhan ditutup dan tayangan memutarnya satu per satu. 10/10 juga memenangkan 7–10 dan 4 beruntun.'],
      ru: ['Игрок делает 10 бросков; каждый попадает в 55 случаях из 100. Ставьте на число попаданий: 0–4 ({u5}), ровно 5 ({e5}), ровно 6 ({e6}), 7–10 ({o6}); или на серию из 4 подряд ({st4}) или идеальные 10/10 ({p10}).', 'Каждый бросок разыгрывает сервер при закрытии ставок, шоу показывает их по одному. 10/10 выигрывает и 7–10, и 4 подряд.'],
      de: ['Der Spieler wirft 10-mal; jeder Wurf trifft 55-mal von 100. Setze auf die Zahl der Körbe: 0–4 ({u5}), genau 5 ({e5}), genau 6 ({e6}), 7–10 ({o6}); oder auf 4 in Folge ({st4}) oder perfekte 10/10 ({p10}).', 'Jeder Wurf wird beim Schließen vom Server gezogen, die Show spielt sie nacheinander ab. 10/10 gewinnt auch 7–10 und 4 in Folge.'],
      hi: ['खिलाड़ी 10 शॉट लेता है; हर शॉट 100 में 55 बार अंदर जाता है। बास्केट की गिनती पर दांव लगाएं: 0–4 ({u5}), ठीक 5 ({e5}), ठीक 6 ({e6}), 7–10 ({o6}); या लगातार 4 ({st4}) या परफ़ेक्ट 10/10 ({p10}) पर।', 'हर शॉट दांव बंद होने पर सर्वर निकालता है और शो उन्हें एक-एक करके दिखाता है। 10/10, 7–10 और लगातार 4 भी जीतता है।'],
      zh: ['球员投篮 10 次，每次命中率 55%。押命中数：0–4（{u5}）、恰好 5（{e5}）、恰好 6（{e6}）、7–10（{o6}）；或连中 4 球（{st4}）、完美 10/10（{p10}）。', '每一投都由服务器在停止下注时抽出，表演逐一呈现。10/10 同时赢 7–10 和连中 4 球。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + lgd('bkF' + uid, '#C2410C', '#7C2D12', 1) + rgd('bkB' + uid, '#FDBA74', '#EA580C', '#7C2D12') + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#0F0A1E"/>' +
        '<rect x="-300" y="-300" width="960" height="470" fill="#1E1B4B"/>';
      for (var k = 0; k < 3; k++) for (var q = 0; q < 46; q++) h += '<circle cx="' + (q * 8 + (k % 2) * 4) + '" cy="' + (100 + k * 18) + '" r="2.8" fill="' + ['#F87171', '#60A5FA', '#FDE68A', '#4ADE80', '#F472B6', '#E2E8F0'][(q * 5 + k) % 6] + '" opacity=".45"/>';
      h += '<rect x="-300" y="154" width="960" height="400" fill="url(#bkF' + uid + ')"/><path d="M-300 160H660" stroke="#FDE68A" stroke-opacity=".5"/><path d="M200 196Q240 164 300 160" stroke="#FDE68A" stroke-opacity=".4" fill="none"/>' +
        '<rect x="324" y="40" width="6" height="156" fill="#475569"/><rect x="310" y="56" width="6" height="52" rx="2" fill="#F8FAFC" stroke="#94A3B8"/><rect x="311" y="76" width="4" height="14" fill="none" stroke="#EF4444" stroke-width="1.2"/>' +
        '<path d="M283 92L288 116H304L309 92" stroke="#F8FAFC" stroke-opacity=".8" stroke-width="1" fill="none"/><path d="M286 98L306 110M306 98L286 110M288 104H304" stroke="#F8FAFC" stroke-opacity=".5" stroke-width=".8"/>' +
        '<g class="bk-pl" transform="translate(74 196)"><path d="M-4-30L-6 0M4-30L6 0" stroke="#FDE2C4" stroke-width="4.4" stroke-linecap="round"/><rect x="-8" y="-50" width="16" height="22" rx="5" fill="#F97316"/><text y="-36" text-anchor="middle" font-size="8" fill="#fff">23</text>' +
        '<g class="bk-arm"><path d="M5-46L14-58" stroke="#FDE2C4" stroke-width="3.6" stroke-linecap="round"/></g><circle cy="-56" r="6.5" fill="#7C4A2D"/></g>' +
        '<g class="bk-b" transform="translate(88 138)"><circle r="6.5" fill="url(#bkB' + uid + ')"/><path d="M-6.5 0H6.5M0-6.5V6.5M-4.6-4.6Q0 0-4.6 4.6M4.6-4.6Q0 0 4.6 4.6" stroke="#431407" stroke-width=".8" fill="none"/></g>' +
        '<path d="M282 92H310" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>' +
        '<g class="bk-sb"><rect x="70" y="6" width="220" height="30" rx="10" fill="rgba(2,6,23,.78)" stroke="#FDE68A" stroke-opacity=".4"/>';
      for (k = 0; k < 10; k++) h += '<circle class="bk-d" cx="' + (90 + k * 16) + '" cy="21" r="5.5"/>';
      return h + '<text class="bk-n" x="276" y="26" text-anchor="end">0</text></g><g class="bk-st" opacity="0" transform="translate(180 54)"><rect x="-56" y="-11" width="112" height="22" rx="11"/><text y="4.5" text-anchor="middle">' + K.esc(l.streak) + '</text></g>' + banner(140);
    },
    board: function (uid, l, oddTxt, o) {
      return ['u5', 'e5', 'e6', 'o6'].map(function (s, i) { return btn(s, lab(['0–4', '5', '6', '7–10'][i]) + odd(s, oddTxt, o), 'bk-k'); }).join('') +
        btn('st4', lab(l.streak) + odd('st4', oddTxt, o), 'x2') + btn('p10', lab('10 / 10') + odd('p10', oddTxt, o), 'x2');
    },
    hist: function (n) { return chipS(n, n >= 7 ? 'bkh2' : n >= 5 ? 'bkh1' : 'bkh0'); },
    wins: function (res) { var s = (res.s || []).map(Number), n = +res.n, w = [n <= 4 ? 'u5' : n === 5 ? 'e5' : n === 6 ? 'e6' : 'o6'], b = 0, c = 0; s.forEach(function (x) { c = x ? c + 1 : 0; b = Math.max(b, c); }); if (b >= 4) w.push('st4'); if (n === 10) w.push('p10'); return w; },
    init: function (c) { c.b = c.q('.bk-b'); c.pl = c.q('.bk-pl'); c.arm = c.q('.bk-arm'); c.d = [].slice.call(c.box.querySelectorAll('.bk-d')); c.n = c.q('.bk-n'); c.st = c.q('.bk-st'); bnInit(c); },
    frame: function (c, R, t, e, res) {
      var s = res ? (res.s || []).map(Number) : [], g = res ? +res.g || 0 : 0, cur = res ? Math.floor((e - BK_0) / BK_D) : -1, ph = res ? (e - BK_0) / BK_D - cur : 0, i;
      if (cur > 9) { cur = 9; ph = 1.01; }
      var known = function (j) { return j < cur || (j === cur && ph >= .72); }, made = 0, run = 0, best = 0;
      for (i = 0; i < 10; i++) { var kn = res && e >= BK_0 && known(i); cls(c.d[i], !kn ? 'bk-d' : s[i] ? 'bk-d g' : 'bk-d x'); if (kn) { made += s[i]; run = s[i] ? run + 1 : 0; best = Math.max(best, run); } }
      txt(c.n, String(made)); sa(c.st, 'opacity', best >= 4 ? '1' : '0');
      if (!res || e < BK_0) { sa(c.b, 'transform', 'translate(' + (88 + Math.sin(t * 3) * 1).toFixed(1) + ' ' + (180 - Math.abs(Math.sin(t * 4)) * 26).toFixed(1) + ')'); sa(c.arm, 'transform', 'rotate(60 5 -46)'); if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var mk = !!s[cur], u = seg(ph, .18, .72), bx, by, rot = ph * 900;
      sa(c.arm, 'transform', 'rotate(' + (ph < .2 ? 60 - ph * 300 : 0).toFixed(0) + ' 5 -46)');
      sa(c.pl, 'transform', 'translate(74 ' + (196 - Math.sin(Math.PI * seg(ph, 0, .3)) * 8).toFixed(1) + ')');
      if (ph < .18) { bx = 82; by = lerp(150, 136, ph / .18); }
      else if (mk) {
        if (ph < .72) { bx = lerp(84, BK_RX, u); by = lerp(134, BK_RY - 6, u) - Math.sin(Math.PI * u) * 70; }
        else { var v = seg(ph, .72, 1); bx = BK_RX; by = lerp(BK_RY - 4, 186, v * v); }
      } else {
        var side = hs(g, 600 + cur) < .5, hx = side ? 283 : 309;
        if (ph < .72) { bx = lerp(84, hx, u); by = lerp(134, BK_RY - 6, u) - Math.sin(Math.PI * u) * 70; }
        else { var w2 = seg(ph, .72, 1); bx = lerp(hx, hx - 40 - hs(g, 700 + cur) * 50, w2); by = lerp(BK_RY - 6, 188, w2) - Math.sin(Math.PI * Math.min(1, w2 * 1.6)) * 26; }
      }
      sa(c.b, 'transform', 'translate(' + bx.toFixed(1) + ' ' + by.toFixed(1) + ') rotate(' + rot.toFixed(0) + ')');
      bnSet(c, e >= BK_0 + 10 * BK_D ? made + ' / 10' : '', 'n0');
    }
  });

  /* -------------------------------------------------------------- Boxing --------------------------------------------------------------
     Red vs Blue over up to 6 rounds. Result n: 0 Red KO · 1 Red on points · 2 draw · 3 Blue on points · 4 Blue KO ; r = round of the KO. */
  var BX_0 = .4, BX_R = 1.7;
  function bxRounds(res) { var n = +res.n; return n === 0 || n === 4 ? +res.r : 6; }
  function boxer(cl, col, trunk) {
    return '<g class="bx ' + cl + '"><g class="bx-in"><path d="M-6-34L-9 0M6-34L8 0" stroke="#7C4A2D" stroke-width="6" stroke-linecap="round"/><rect x="-11" y="-44" width="22" height="13" rx="4" fill="' + trunk + '"/>' +
      '<path d="M-10-74Q0-80 10-74L11-44H-11Z" fill="#9A6B4B"/><circle cy="-84" r="9" fill="#9A6B4B"/><path d="M-9-87Q0-97 9-87V-84H-9Z" fill="' + col + '"/>' +
      '<g class="bx-g2"><path d="M4-70L12-62" stroke="#9A6B4B" stroke-width="5" stroke-linecap="round"/><circle cx="13" cy="-62" r="6.5" fill="' + col + '" stroke="#fff" stroke-opacity=".5"/></g>' +
      '<g class="bx-g1"><path d="M6-72L16-74" stroke="#9A6B4B" stroke-width="5" stroke-linecap="round"/><circle cx="18" cy="-74" r="7" fill="' + col + '" stroke="#fff" stroke-opacity=".6"/></g></g></g>';
  }
  live('boxinglive', {
    lab: 'fg', bev: 'act', show: function (res) { return BX_0 + bxRounds(res) * BX_R + 2.8; },
    odds0: { red: 2.00, draw: 15.66, blue: 2.00, ko: 2.13, pts: 1.88, eko: 5.47 },
    beat: function (e, res) { return e < BX_0 ? 0 : Math.min(bxRounds(res) * 6, Math.floor((e - BX_0) / (BX_R / 6))); },
    rules: rules(150, { red: 2.00, draw: 15.66, ko: 2.13, pts: 1.88, eko: 5.47 }, {
      en: ['Red and Blue fight over 6 rounds. Bet on the winner Red or Blue ({red}), a Draw ({draw}), a win by KO ({ko}), a win on Points ({pts}) or a KO in round 1 or 2 ({eko}).', 'Each fight ends by KO (44 %), on points (50 %) or as a draw (6 %); Red and Blue have the same chance. The result and the round of the KO are drawn by the server when bets close.'],
      fr: ['Rouge et Bleu combattent en 6 rounds. Parie sur le vainqueur Rouge ou Bleu ({red}), un Nul ({draw}), une victoire par KO ({ko}), aux Points ({pts}) ou un KO au round 1 ou 2 ({eko}).', 'Chaque combat se termine par KO (44 %), aux points (50 %) ou par un nul (6 %) ; Rouge et Bleu ont la même chance. Le résultat et le round du KO sont tirés par le serveur à la fermeture des paris.'],
      es: ['Rojo y Azul pelean a 6 asaltos. Apuesta al ganador Rojo o Azul ({red}), al Empate ({draw}), a victoria por KO ({ko}), por Puntos ({pts}) o a KO en el asalto 1 o 2 ({eko}).', 'Cada combate termina por KO (44 %), a los puntos (50 %) o en empate (6 %); Rojo y Azul tienen la misma probabilidad. El resultado y el asalto del KO los sortea el servidor al cerrar.'],
      pt: ['Vermelho e Azul lutam 6 rounds. Aposte no vencedor Vermelho ou Azul ({red}), no Empate ({draw}), em vitória por KO ({ko}), por Pontos ({pts}) ou em KO no round 1 ou 2 ({eko}).', 'Cada luta termina por KO (44 %), por pontos (50 %) ou em empate (6 %); Vermelho e Azul têm a mesma chance. O resultado e o round do KO são sorteados pelo servidor no fechamento.'],
      ar: ['يتنازل الأحمر والأزرق في 6 جولات. راهن على الفائز الأحمر أو الأزرق ({red})، أو التعادل ({draw})، أو الفوز بالضربة القاضية ({ko})، أو بالنقاط ({pts})، أو ضربة قاضية في الجولة 1 أو 2 ({eko}).', 'تنتهي كل مباراة بالضربة القاضية (44 %) أو بالنقاط (50 %) أو بالتعادل (6 %)؛ للأحمر والأزرق الفرصة نفسها. يسحب الخادم النتيجة وجولة الضربة القاضية عند إغلاق الرهانات.'],
      tr: ['Kırmızı ve Mavi 6 raunt dövüşür. Kazanana, Kırmızı veya Mavi ({red}), Beraberliğe ({draw}), KO ile galibiyete ({ko}), Puanla galibiyete ({pts}) ya da 1. veya 2. rauntta KO’ya ({eko}) oyna.', 'Her maç KO (%44), puan (%50) veya beraberlik (%6) ile biter; Kırmızı ve Mavi’nin şansı eşit. Sonuç ve KO raundu bahisler kapanınca sunucu tarafından çekilir.'],
      vi: ['Đỏ và Xanh đấu 6 hiệp. Cược người thắng Đỏ hoặc Xanh ({red}), Hòa ({draw}), thắng KO ({ko}), thắng điểm ({pts}) hoặc KO ở hiệp 1 hay 2 ({eko}).', 'Mỗi trận kết thúc bằng KO (44 %), tính điểm (50 %) hoặc hòa (6 %); Đỏ và Xanh có cơ hội như nhau. Kết quả và hiệp KO do máy chủ rút khi đóng cược.'],
      id: ['Merah dan Biru bertarung 6 ronde. Pasang pemenang Merah atau Biru ({red}), Seri ({draw}), menang KO ({ko}), menang Poin ({pts}) atau KO di ronde 1 atau 2 ({eko}).', 'Setiap laga berakhir KO (44 %), angka (50 %) atau seri (6 %); Merah dan Biru berpeluang sama. Hasil dan ronde KO diundi server saat taruhan ditutup.'],
      ru: ['Красный и Синий бьются 6 раундов. Ставьте на победу Красного или Синего ({red}), на Ничью ({draw}), на победу нокаутом ({ko}), по очкам ({pts}) или на нокаут в 1-м или 2-м раунде ({eko}).', 'Бой заканчивается нокаутом (44 %), по очкам (50 %) или вничью (6 %); у Красного и Синего равные шансы. Итог и раунд нокаута разыгрывает сервер при закрытии ставок.'],
      de: ['Rot und Blau boxen über 6 Runden. Setze auf den Sieger Rot oder Blau ({red}), ein Remis ({draw}), einen Sieg durch KO ({ko}), nach Punkten ({pts}) oder einen KO in Runde 1 oder 2 ({eko}).', 'Jeder Kampf endet durch KO (44 %), nach Punkten (50 %) oder unentschieden (6 %); Rot und Blau haben dieselbe Chance. Ergebnis und KO-Runde zieht der Server beim Schließen.'],
      hi: ['लाल और नीला 6 राउंड लड़ते हैं। विजेता लाल या नीला ({red}), ड्रॉ ({draw}), KO से जीत ({ko}), अंकों से जीत ({pts}) या राउंड 1 या 2 में KO ({eko}) पर दांव लगाएं।', 'हर मुकाबला KO (44 %), अंकों (50 %) या ड्रॉ (6 %) पर ख़त्म होता है; लाल और नीले की संभावना बराबर है। नतीजा और KO का राउंड दांव बंद होने पर सर्वर निकालता है।'],
      zh: ['红方与蓝方进行 6 回合拳赛。押红方或蓝方获胜（{red}）、平局（{draw}）、KO 获胜（{ko}）、点数获胜（{pts}），或第 1、2 回合 KO（{eko}）。', '每场比赛以 KO（44%）、点数（50%）或平局（6%）结束；红蓝双方机会相同。结果与 KO 回合由服务器在停止下注时抽出。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + lgd('bxF' + uid, '#1D4ED8', '#1E3A8A', 1) + '<radialGradient id="bxL' + uid + '" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#FEF3C7" stop-opacity=".35"/><stop offset="1" stop-color="#FEF3C7" stop-opacity="0"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#1E1B4B"/><rect x="-300" y="-300" width="960" height="400" fill="#312E81"/><path d="M110 -10L40 200H320L250 -10Z" fill="url(#bxL' + uid + ')"/>';
      for (var k = 0; k < 2; k++) for (var q = 0; q < 46; q++) h += '<circle cx="' + (q * 8 + k * 4) + '" cy="' + (120 + k * 14) + '" r="3" fill="' + ['#F87171', '#60A5FA', '#FDE68A', '#E2E8F0'][(q * 3 + k) % 4] + '" opacity=".3"/>';
      h += '<path d="M24 196L60 160H300L336 196Z" fill="url(#bxF' + uid + ')"/><rect x="20" y="196" width="320" height="14" fill="#991B1B"/><rect x="-300" y="210" width="960" height="320" fill="#1E1B4B"/>' +
        '<rect x="54" y="98" width="6" height="68" fill="#E5E7EB"/><rect x="300" y="98" width="6" height="68" fill="#E5E7EB"/>' +
        boxer('r', '#DC2626', '#7F1D1D') + boxer('b', '#2563EB', '#1E3A8A') +
        '<g stroke-width="2.2"><path d="M57 110H303" stroke="#F8FAFC"/><path d="M57 126H303" stroke="#EF4444"/><path d="M57 142H303" stroke="#3B82F6"/></g>' +
        '<g class="bx-rd"><rect x="130" y="6" width="100" height="24" rx="12" fill="rgba(2,6,23,.8)" stroke="#FDE68A" stroke-opacity=".5"/><text class="bx-rt" x="180" y="23" text-anchor="middle"></text></g>' +
        '<g class="bx-ko" opacity="0" transform="translate(180 96)"><text text-anchor="middle" y="10">KO</text></g>' + banner(46);
      return h;
    },
    board: function (uid, l, oddTxt, o) {
      return btn('red', '<i class="tm" style="background:#DC2626"></i>' + lab(l.red) + odd('red', oddTxt, o), 'bx-b') + btn('draw', lab(l.draw) + odd('draw', oddTxt, o), 'bx-b') +
        btn('blue', '<i class="tm" style="background:#2563EB"></i>' + lab(l.blue) + odd('blue', oddTxt, o), 'bx-b') +
        btn('ko', lab('KO') + odd('ko', oddTxt, o), 'bx-b') + btn('pts', lab(l.pts) + odd('pts', oddTxt, o), 'bx-b') + btn('eko', lab('KO 1–2') + odd('eko', oddTxt, o), 'bx-b');
    },
    hist: function (n) { return chipS(n === 2 ? '=' : n === 0 || n === 4 ? 'KO' : 'P', 'bxh' + (n < 2 ? 0 : n > 2 ? 1 : 2)); },
    wins: function (res) { var n = +res.n, w = [n <= 1 ? 'red' : n === 2 ? 'draw' : 'blue']; if (n === 0 || n === 4) { w.push('ko'); if (+res.r <= 2) w.push('eko'); } else if (n !== 2) w.push('pts'); return w; },
    init: function (c) {
      c.bx = ['r', 'b'].map(function (k) { var g = c.q('.bx.' + k); return { g: g, inn: g.querySelector('.bx-in'), g1: g.querySelector('.bx-g1'), g2: g.querySelector('.bx-g2') }; });
      c.rt = c.q('.bx-rt'); c.ko = c.q('.bx-ko'); bnInit(c);
    },
    frame: function (c, R, t, e, res) {
      var s = res ? +res.s || 0 : 0, n = res ? +res.n : -1, nr = res ? bxRounds(res) : 6, end = BX_0 + nr * BX_R, ko = n === 0 || n === 4, loser = n === 0 ? 1 : n === 4 ? 0 : -1;
      var rd = res && e >= BX_0 ? Math.min(nr, 1 + Math.floor((e - BX_0) / BX_R)) : 0;
      txt(c.rt, rd ? c.l.round + ' ' + rd : c.l.round + ' 1', 90);
      for (var i = 0; i < 2; i++) {
        var b = c.bx[i], dir = i ? -1 : 1, x = i ? 226 : 134, bob = Math.sin(t * 5 + i * 2) * 2, j1 = 0, j2 = 0, lean = 0, fall = 0;
        if (res && e >= BX_0 && e < end) {
          var k = Math.floor((e - BX_0) / .28), f = ((e - BX_0) / .28) % 1, who = hs(s, 800 + k) < .5 ? 0 : 1, pw = Math.sin(Math.PI * f);
          if (who === i) { if (hs(s, 900 + k) < .55) j1 = pw; else j2 = pw; lean = pw * 4; } else lean = -pw * 3;
          x += Math.sin((e - BX_0) * 1.3 + i) * 6 * dir;
        }
        if (res && e >= end) {
          if (ko && i === loser) fall = Math.min(1, (e - end) * 2.2);
          else if (ko && i !== loser && e < end + .3) j1 = Math.sin(Math.PI * (e - end) / .3);
          if (!ko && e > end + .6 && (n === 2 || (n === 1 && i === 0) || (n === 3 && i === 1))) j2 = -1; // arm raised
        }
        sa(b.g, 'transform', 'translate(' + x.toFixed(1) + ' ' + (192 + fall * 4).toFixed(1) + ') scale(' + (dir * 1.32) + ' 1.32)');
        sa(b.inn, 'transform', 'rotate(' + (lean - fall * 82).toFixed(1) + ' 0 0) translate(0 ' + bob.toFixed(1) + ')');
        sa(b.g1, 'transform', 'translate(' + (j1 * 12).toFixed(1) + ' 0)');
        sa(b.g2, 'transform', j2 < 0 ? 'translate(0 -22) rotate(-40 13 -62)' : 'translate(' + (j2 * 14).toFixed(1) + ' ' + (-j2 * 8).toFixed(1) + ')');
      }
      sa(c.ko, 'opacity', res && ko && e >= end + .2 ? '1' : '0');
      if (!res) { if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var dn = e >= end + .7;
      bnSet(c, dn ? (n === 2 ? c.l.draw : (n <= 1 ? c.l.red : c.l.blue) + ' ' + c.l.wins + ' · ' + (ko ? 'KO R' + nr : c.l.pts)) : '', 'n0');
    }
  });

  /* ------------------------------------------------------------- Tennis ------------------------------------------------------------- */
  // n = good shots before the error; shot j is hit by the server when j is even. The error (shot n) goes in the net or long / wide.
  function tnDs(n) { return Math.min(.62, 17 / (n + 1)); }
  var TN_0 = .5;
  live('tennislive', {
    lab: 'ral', bev: 'act', show: function (res) { return TN_0 + (+res.n + 1) * tnDs(+res.n) + 2.4; },
    odds0: { srv: 2.11, rcv: 1.69, s: 1.59, m: 3.11, l: 8.75, x: 81.53 },
    beat: function (e, res) { var n = +res.n; return e < TN_0 ? 0 : Math.min(n + 2, 1 + Math.floor((e - TN_0) / tnDs(n))); },
    rules: rules(150, { srv: 2.11, rcv: 1.69, s: 1.59, m: 3.11, l: 8.75, x: 81.53 }, {
      en: ['One rally: each shot lands in 80 times out of 100 (at most 40 shots). Bet on who wins the point: Server ({srv}) or Receiver ({rcv}); or on the rally length (good shots before the error): 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}).', 'The player who misses loses the point. The rally is drawn by the server when bets close. 20+ also wins 10+.'],
      fr: ['Un échange : chaque coup est bon 80 fois sur 100 (40 coups au plus). Parie sur qui gagne le point : Serveur ({srv}) ou Relanceur ({rcv}) ; ou sur la longueur de l’échange (coups bons avant la faute) : 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}).', 'Le joueur qui rate perd le point. L’échange est tiré par le serveur à la fermeture des paris. 20+ gagne aussi 10+.'],
      es: ['Un peloteo: cada golpe entra 80 de cada 100 veces (40 golpes como máximo). Apuesta a quién gana el punto: Sacador ({srv}) o Restador ({rcv}); o a la duración (golpes buenos antes del error): 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}).', 'El que falla pierde el punto. El peloteo lo sortea el servidor al cerrar. 20+ también gana 10+.'],
      pt: ['Uma troca de bolas: cada golpe entra 80 vezes em 100 (no máximo 40 golpes). Aposte em quem ganha o ponto: Sacador ({srv}) ou Recebedor ({rcv}); ou na duração (golpes bons antes do erro): 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}).', 'Quem erra perde o ponto. A troca é sorteada pelo servidor no fechamento. 20+ também ganha 10+.'],
      ar: ['تبادل واحد: كل ضربة صحيحة 80 مرة من 100 (40 ضربة كحد أقصى). راهن على من يفوز بالنقطة: المُرسِل ({srv}) أو المستقبِل ({rcv})؛ أو على طول التبادل (الضربات الصحيحة قبل الخطأ): 0–3 ({s})، 4–9 ({m})، 10+ ({l})، 20+ ({x}).', 'من يخطئ يخسر النقطة. يسحب الخادم التبادل عند إغلاق الرهانات. 20+ تربح أيضًا 10+.'],
      tr: ['Tek ralli: her vuruş 100’de 80 kez içeri düşer (en fazla 40 vuruş). Sayıyı kimin alacağına oyna: Servisçi ({srv}) veya Karşılayan ({rcv}); ya da ralli uzunluğuna (hatadan önceki iyi vuruşlar): 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}).', 'Hata yapan sayıyı kaybeder. Ralli bahisler kapanınca sunucu tarafından çekilir. 20+, 10+’yı da kazanır.'],
      vi: ['Một pha bóng: mỗi cú đánh vào sân 80 lần trên 100 (tối đa 40 cú). Cược ai thắng điểm: Người giao ({srv}) hoặc Người đỡ ({rcv}); hoặc độ dài pha bóng (số cú tốt trước lỗi): 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}).', 'Ai đánh hỏng thì mất điểm. Pha bóng do máy chủ rút khi đóng cược. 20+ cũng thắng 10+.'],
      id: ['Satu reli: tiap pukulan masuk 80 dari 100 kali (maksimal 40 pukulan). Pasang siapa yang menang poin: Pelayan ({srv}) atau Penerima ({rcv}); atau panjang reli (pukulan bagus sebelum kesalahan): 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}).', 'Yang gagal kehilangan poin. Reli diundi server saat taruhan ditutup. 20+ juga memenangkan 10+.'],
      ru: ['Один розыгрыш: каждый удар попадает в 80 случаях из 100 (не больше 40 ударов). Ставьте, кто выиграет очко: Подающий ({srv}) или Принимающий ({rcv}); или на длину розыгрыша (точные удары до ошибки): 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}).', 'Кто ошибается, тот проигрывает очко. Розыгрыш определяет сервер при закрытии ставок. 20+ выигрывает и 10+.'],
      de: ['Ein Ballwechsel: jeder Schlag ist 80-mal von 100 im Feld (höchstens 40 Schläge). Setze darauf, wer den Punkt holt: Aufschläger ({srv}) oder Rückschläger ({rcv}); oder auf die Länge (gute Schläge vor dem Fehler): 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}).', 'Wer den Fehler macht, verliert den Punkt. Der Ballwechsel wird beim Schließen vom Server gezogen. 20+ gewinnt auch 10+.'],
      hi: ['एक रैली: हर शॉट 100 में 80 बार अंदर गिरता है (ज़्यादा से ज़्यादा 40 शॉट)। अंक कौन जीतेगा: सर्वर ({srv}) या रिसीवर ({rcv}); या रैली की लंबाई (गलती से पहले के अच्छे शॉट): 0–3 ({s}), 4–9 ({m}), 10+ ({l}), 20+ ({x}) पर दांव लगाएं।', 'जो चूकता है वह अंक हारता है। रैली दांव बंद होने पर सर्वर निकालता है। 20+, 10+ भी जीतता है।'],
      zh: ['一次多拍对打：每拍落在界内的概率为 80%（最多 40 拍）。押谁赢下这一分：发球方（{srv}）或接球方（{rcv}）；或押回合长度（失误前的好球数）：0–3（{s}）、4–9（{m}）、10+（{l}）、20+（{x}）。', '失误的一方丢分。回合由服务器在停止下注时抽出。20+ 同时赢 10+。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + lgd('tnC' + uid, '#2563EB', '#1D4ED8', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#14532D"/>' +
        '<rect x="-300" y="-300" width="960" height="350" fill="#0F172A"/>';
      for (var q = 0; q < 46; q++) h += '<circle cx="' + (q * 8) + '" cy="' + (40 + (q % 2) * 5) + '" r="3" fill="' + ['#F87171', '#60A5FA', '#FDE68A', '#E2E8F0', '#4ADE80'][(q * 3) % 5] + '" opacity=".45"/>';
      h += '<rect x="-300" y="50" width="960" height="500" fill="#15803D"/><rect x="26" y="64" width="308" height="140" fill="url(#tnC' + uid + ')" stroke="#F8FAFC" stroke-width="2.4"/>' +
        '<path d="M26 82H334M26 186H334M96 82V186M264 82V186M96 134H264" stroke="#F8FAFC" stroke-width="1.6" fill="none"/>' +
        '<rect x="178" y="58" width="4" height="152" fill="#E5E7EB"/><path d="M180 58V210" stroke="#0F172A" stroke-width="1" stroke-dasharray="2 2"/>' +
        '<g class="tn-p a"><g transform="scale(1.4)"><ellipse rx="9" ry="4" cy="9" fill="#000" opacity=".3"/><circle r="7" fill="#DC2626" stroke="#fff" stroke-width="1.2"/><circle r="3" cy="-1" fill="#FDE2C4"/><path class="tn-r" d="M5 0L15-6" stroke="#FDE68A" stroke-width="2.4" stroke-linecap="round"/></g></g>' +
        '<g class="tn-p b"><g transform="scale(1.4)"><ellipse rx="9" ry="4" cy="9" fill="#000" opacity=".3"/><circle r="7" fill="#7C3AED" stroke="#fff" stroke-width="1.2"/><circle r="3" cy="-1" fill="#FDE2C4"/><path class="tn-r" d="M-5 0L-15-6" stroke="#FDE68A" stroke-width="2.4" stroke-linecap="round"/></g></g>' +
        '<ellipse class="tn-sh" rx="4" ry="1.8" fill="#000" opacity=".35"/><circle class="tn-b" r="3.6" fill="#D9F99D" stroke="#65A30D" stroke-width=".8"/>' +
        '<g class="tn-ct"><rect x="122" y="6" width="116" height="24" rx="12" fill="rgba(2,6,23,.8)" stroke="#FDE68A" stroke-opacity=".5"/><text class="tn-n" x="180" y="23" text-anchor="middle"></text></g>' +
        '<text class="tn-lb" x="40" y="222">' + K.esc(l.srv) + '</text><text class="tn-lb" x="320" y="222" text-anchor="end">' + K.esc(l.rcv) + '</text>' +
        '<g class="tn-fx" opacity="0" transform="translate(180 110)"><rect x="-40" y="-12" width="80" height="24" rx="12"/><text y="5" text-anchor="middle">' + K.esc(l.out) + '</text></g>' + banner(134);
      return h;
    },
    board: function (uid, l, oddTxt, o) {
      return btn('srv', '<i class="tm" style="background:#DC2626"></i>' + lab(l.srv) + odd('srv', oddTxt, o), 'x3 tmb') + btn('rcv', '<i class="tm" style="background:#7C3AED"></i>' + lab(l.rcv) + odd('rcv', oddTxt, o), 'x3 tmb') +
        ['s', 'm', 'l', 'x'].map(function (s, i) { return btn(s, lab(['0–3', '4–9', '10+', '20+'][i]) + '<i>' + K.esc(l.shots) + '</i>' + odd(s, oddTxt, o), 'tn-k'); }).join('');
    },
    hist: function (n) { return chipS(n, n % 2 ? 'tnh0' : 'tnh1'); },
    wins: function (res) { var n = +res.n, w = [n % 2 ? 'srv' : 'rcv', n <= 3 ? 's' : n <= 9 ? 'm' : 'l']; if (n >= 20) w.push('x'); return w; },
    init: function (c) { c.pa = c.q('.tn-p.a'); c.pb = c.q('.tn-p.b'); c.b = c.q('.tn-b'); c.sh = c.q('.tn-sh'); c.n = c.q('.tn-n'); c.fx = c.q('.tn-fx'); c.fxt = c.fx.querySelector('text'); bnInit(c); },
    frame: function (c, R, t, e, res) {
      var n = res ? +res.n : 0, s = res ? +res.s || 0 : 0, ds = tnDs(n), j = res ? Math.floor((e - TN_0) / ds) : -1, ph = res ? (e - TN_0) / ds - j : 0;
      var py = function (k) { return 84 + hs(s, 1000 + k) * 100; }; // where shot k lands / is hit (y)
      if (!res || e < TN_0) {
        sa(c.pa, 'transform', 'translate(40 ' + (134 + Math.sin(t) * 4).toFixed(1) + ')'); sa(c.pb, 'transform', 'translate(320 ' + (134 - Math.sin(t) * 4).toFixed(1) + ')');
        var bb = Math.abs(Math.sin(t * 3)); sa(c.b, 'transform', 'translate(50 ' + (126 - bb * 14).toFixed(1) + ')'); sa(c.sh, 'transform', 'translate(50 134)');
        txt(c.n, '0', 100); sa(c.fx, 'opacity', '0'); if (!bnCd(c, R, t, e)) bnSet(c, ''); return;
      }
      if (j > n) { j = n; ph = 1.01; }
      var fromA = j % 2 === 0, x0 = fromA ? 44 : 316, x1 = fromA ? 316 : 44, y0 = j ? py(j - 1) : 134, y1 = py(j), err = j === n, bx, by, z;
      var kind = hs(s, 1100 + j) < .45 ? 'net' : 'out';
      var u = cl01(ph);
      if (!err) { bx = lerp(x0, x1, u); by = lerp(y0, y1, u); z = Math.sin(Math.PI * u) * 22 + (u > .75 ? Math.sin(Math.PI * (u - .75) * 4) * 4 : 0); }
      else if (kind === 'net') { var un = Math.min(u, .5) * 2; bx = lerp(x0, 180 + (fromA ? -5 : 5), un); by = lerp(y0, (y0 + y1) / 2, un); z = u < .5 ? Math.sin(Math.PI * un * .8) * 14 : Math.max(0, 6 - (u - .5) * 30); }
      else { var xo = fromA ? 352 : 8; bx = lerp(x0, xo, u); by = lerp(y0, y1 < 134 ? 54 : 214, u * .7); z = Math.sin(Math.PI * u) * 26; }
      sa(c.b, 'transform', 'translate(' + bx.toFixed(1) + ' ' + (by - z).toFixed(1) + ')'); sa(c.sh, 'transform', 'translate(' + bx.toFixed(1) + ' ' + (by + 4).toFixed(1) + ')');
      // players run to where the ball will be
      var ya = fromA ? lerp(y0, 134, u * .5) : lerp(134, y1, eo(u)), yb = fromA ? lerp(134, y1, eo(u)) : lerp(y0, 134, u * .5);
      sa(c.pa, 'transform', 'translate(40 ' + ya.toFixed(1) + ')'); sa(c.pb, 'transform', 'translate(320 ' + yb.toFixed(1) + ')');
      txt(c.n, c.l.shots.replace(/^./, function (m) { return m.toUpperCase(); }) + ' ' + Math.min(j, n), 100);
      var over = err && ph > .55;
      sa(c.fx, 'opacity', over && e < TN_0 + (n + 1) * ds + 1 ? '1' : '0'); txt(c.fxt, kind === 'net' ? 'NET' : c.l.out, 70);
      var fin = e >= TN_0 + (n + 1) * ds + .3;
      bnSet(c, fin ? (n % 2 ? c.l.srv : c.l.rcv) + ' ' + c.l.wins + ' · ' + n + ' ' + c.l.shots : '', 'n0');
    }
  });

  /* ------------------------------------------------------------- Cricket ------------------------------------------------------------- */
  var CK_0 = .4, CK_D = 1.75;
  function ckLab(v) { return v < 0 ? 'W' : v === 0 ? '•' : String(v); }
  live('cricketlive', {
    lab: 'ov', bev: 'act', SHOW: CK_0 + 6 * CK_D + 2.2,
    odds0: { r0: 2.96, r1: 2.53, r2: 3.78, r3: 14.67, six: 3.54, wkt: 3.03 },
    beat: function (e) { return e < CK_0 ? 0 : Math.min(7, 1 + Math.floor((e - CK_0 + CK_D * .5) / CK_D)); },
    rules: rules(145, { r0: 2.96, r1: 2.53, r2: 3.78, r3: 14.67, six: 3.54, wkt: 3.03 }, {
      en: ['One over = 6 balls. Each ball gives 0 (36 %), 1 (30 %), 2 (10 %), 3 (2 %), a FOUR (11 %), a SIX (5 %) or a wicket (6 %, no run). Bet on the runs of the over: 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}); or on at least one Six ({six}) or at least one Wicket ({wkt}).', 'The 6 balls are drawn by the server when bets close and the show plays them one by one.'],
      fr: ['Un over = 6 balles. Chaque balle donne 0 (36 %), 1 (30 %), 2 (10 %), 3 (2 %), un QUATRE (11 %), un SIX (5 %) ou un guichet (6 %, aucun point). Parie sur les points de l’over : 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}) ; ou sur au moins un Six ({six}) ou au moins un Guichet ({wkt}).', 'Les 6 balles sont tirées par le serveur à la fermeture des paris et le spectacle les joue une par une.'],
      es: ['Un over = 6 bolas. Cada bola da 0 (36 %), 1 (30 %), 2 (10 %), 3 (2 %), un CUATRO (11 %), un SEIS (5 %) o un wicket (6 %, sin carrera). Apuesta a las carreras del over: 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}); o a al menos un Seis ({six}) o al menos un Wicket ({wkt}).', 'Las 6 bolas las sortea el servidor al cerrar y el show las juega una a una.'],
      pt: ['Um over = 6 bolas. Cada bola dá 0 (36 %), 1 (30 %), 2 (10 %), 3 (2 %), um FOUR (11 %), um SIX (5 %) ou um wicket (6 %, sem corrida). Aposte nas corridas do over: 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}); ou em pelo menos um Six ({six}) ou um Wicket ({wkt}).', 'As 6 bolas são sorteadas pelo servidor no fechamento e o show as mostra uma a uma.'],
      ar: ['الأوفر = 6 كرات. كل كرة تعطي 0 (36 %)، 1 (30 %)، 2 (10 %)، 3 (2 %)، أربعة (11 %)، ستة (5 %) أو ويكت (6 %، بلا نقاط). راهن على نقاط الأوفر: 0–5 ({r0})، 6–9 ({r1})، 10–14 ({r2})، 15+ ({r3})؛ أو على ستة واحدة على الأقل ({six}) أو ويكت واحد على الأقل ({wkt}).', 'يسحب الخادم الكرات الست عند إغلاق الرهانات ويعرضها العرض واحدة تلو الأخرى.'],
      tr: ['Bir over = 6 top. Her top 0 (%36), 1 (%30), 2 (%10), 3 (%2), DÖRTLÜK (%11), ALTILIK (%5) ya da wicket (%6, sayı yok) verir. Over’ın sayısına oyna: 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}); ya da en az bir Altılık ({six}) veya en az bir Wicket ({wkt}).', '6 top bahisler kapanınca sunucu tarafından çekilir ve gösteri bunları tek tek oynatır.'],
      vi: ['Một over = 6 quả. Mỗi quả cho 0 (36 %), 1 (30 %), 2 (10 %), 3 (2 %), FOUR (11 %), SIX (5 %) hoặc wicket (6 %, không điểm). Cược tổng điểm của over: 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}); hoặc ít nhất một Six ({six}) hay ít nhất một Wicket ({wkt}).', '6 quả do máy chủ rút khi đóng cược và màn trình diễn phát lần lượt từng quả.'],
      id: ['Satu over = 6 bola. Tiap bola memberi 0 (36 %), 1 (30 %), 2 (10 %), 3 (2 %), FOUR (11 %), SIX (5 %) atau wicket (6 %, tanpa run). Pasang run dalam over: 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}); atau minimal satu Six ({six}) atau satu Wicket ({wkt}).', 'Keenam bola diundi server saat taruhan ditutup dan tayangan memutarnya satu per satu.'],
      ru: ['Овер = 6 подач. Каждая даёт 0 (36 %), 1 (30 %), 2 (10 %), 3 (2 %), ЧЕТВЁРКУ (11 %), ШЕСТЁРКУ (5 %) или калитку (6 %, без ранов). Ставьте на раны овера: 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}); или хотя бы на одну Шестёрку ({six}) или одну Калитку ({wkt}).', 'Все 6 подач разыгрывает сервер при закрытии ставок, шоу показывает их по одной.'],
      de: ['Ein Over = 6 Bälle. Jeder Ball bringt 0 (36 %), 1 (30 %), 2 (10 %), 3 (2 %), ein FOUR (11 %), ein SIX (5 %) oder ein Wicket (6 %, kein Run). Setze auf die Runs des Overs: 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}); oder auf mindestens ein Six ({six}) oder ein Wicket ({wkt}).', 'Die 6 Bälle zieht der Server beim Schließen, die Show spielt sie nacheinander ab.'],
      hi: ['एक ओवर = 6 गेंदें। हर गेंद देती है 0 (36 %), 1 (30 %), 2 (10 %), 3 (2 %), चौका (11 %), छक्का (5 %) या विकेट (6 %, कोई रन नहीं)। ओवर के रनों पर दांव लगाएं: 0–5 ({r0}), 6–9 ({r1}), 10–14 ({r2}), 15+ ({r3}); या कम से कम एक छक्का ({six}) या एक विकेट ({wkt})।', '6 गेंदें दांव बंद होने पर सर्वर निकालता है और शो उन्हें एक-एक करके दिखाता है।'],
      zh: ['一轮（over）= 6 个球。每球结果：0 分（36%）、1 分（30%）、2 分（10%）、3 分（2%）、四分球（11%）、六分球（5%）或出局（6%，不得分）。押本轮总分：0–5（{r0}）、6–9（{r1}）、10–14（{r2}）、15+（{r3}）；或至少一个六分球（{six}）、至少一次出局（{wkt}）。', '6 个球由服务器在停止下注时抽出，表演逐一呈现。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + rgd('ckG' + uid, '#4ADE80', '#16A34A', '#14532D') + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#0B2E16"/>' +
        '<rect x="-300" y="-300" width="960" height="356" fill="#1E3A8A"/><ellipse cx="180" cy="150" rx="250" ry="110" fill="url(#ckG' + uid + ')"/><ellipse cx="180" cy="150" rx="236" ry="102" fill="none" stroke="#F8FAFC" stroke-opacity=".5" stroke-dasharray="4 4"/>' +
        '<rect x="56" y="134" width="252" height="36" rx="4" fill="#D6C59A"/><path d="M80 134V170M284 134V170" stroke="#F8FAFC" stroke-width="1.4"/>' +
        '<g class="ck-st0" transform="translate(66 152)"><path d="M-4-18V6M0-18V6M4-18V6" stroke="#FDE68A" stroke-width="2"/><g class="ck-bl"><path d="M-5-19H5" stroke="#F59E0B" stroke-width="2"/></g></g>' +
        '<g transform="translate(298 152)"><path d="M-4-18V6M0-18V6M4-18V6" stroke="#FDE68A" stroke-width="2"/><path d="M-5-19H5" stroke="#F59E0B" stroke-width="2"/></g>' +
        '<g class="ck-bt" transform="translate(84 160)"><path d="M-3-14L-5 0M3-14L4 0" stroke="#F8FAFC" stroke-width="3.6" stroke-linecap="round"/><rect x="-7" y="-30" width="14" height="17" rx="4" fill="#F8FAFC"/><circle cy="-35" r="5.5" fill="#1E3A8A"/>' +
        '<g class="ck-bat"><path d="M4-22L18-34" stroke="#B45309" stroke-width="4" stroke-linecap="round"/></g></g>' +
        '<g class="ck-bw" transform="translate(320 160)"><path d="M-3-14L-5 0M3-14L4 0" stroke="#F8FAFC" stroke-width="3.6" stroke-linecap="round"/><rect x="-7" y="-30" width="14" height="17" rx="4" fill="#0EA5E9"/><circle cy="-35" r="5.5" fill="#7C4A2D"/></g>' +
        '<g class="ck-rn" opacity="0"><path d="M-3-14L-5 0M3-14L4 0" stroke="#F8FAFC" stroke-width="3.6" stroke-linecap="round"/><rect x="-7" y="-30" width="14" height="17" rx="4" fill="#F8FAFC"/><circle cy="-35" r="5.5" fill="#1E3A8A"/></g>' +
        '<ellipse class="ck-sh" rx="3.5" ry="1.5" fill="#000" opacity=".3"/><circle class="ck-b" r="3.4" fill="#DC2626" stroke="#7F1D1D" stroke-width=".7"/>' +
        '<g class="ck-sb"><rect x="58" y="4" width="244" height="30" rx="10" fill="rgba(2,6,23,.8)" stroke="#FDE68A" stroke-opacity=".4"/>';
      for (var k = 0; k < 6; k++) h += '<g transform="translate(' + (78 + k * 26) + ' 19)"><circle class="ck-d" r="9"/><text class="ck-dt" y="4" text-anchor="middle"></text></g>';
      return h + '<text class="ck-tot" x="292" y="25" text-anchor="end">0/0</text></g><g class="ck-fx" opacity="0" transform="translate(180 92)"><rect x="-44" y="-15" width="88" height="30" rx="15"/><text y="6" text-anchor="middle"></text></g>' + banner(214);
    },
    board: function (uid, l, oddTxt, o) {
      return ['r0', 'r1', 'r2', 'r3'].map(function (s, i) { return btn(s, lab(['0–5', '6–9', '10–14', '15+'][i]) + '<i>' + K.esc(l.runs) + '</i>' + odd(s, oddTxt, o), 'ck-k'); }).join('') +
        btn('six', lab(l.six) + odd('six', oddTxt, o), 'x2') + btn('wkt', lab(l.wkt) + odd('wkt', oddTxt, o), 'x2');
    },
    hist: function (n) { return chipS(n, n >= 15 ? 'ckh2' : n >= 10 ? 'ckh1' : 'ckh0'); },
    wins: function (res) { var b = (res.b || []).map(Number), n = +res.n, w = [n <= 5 ? 'r0' : n <= 9 ? 'r1' : n <= 14 ? 'r2' : 'r3']; if (b.indexOf(6) >= 0) w.push('six'); if (b.indexOf(-1) >= 0) w.push('wkt'); return w; },
    init: function (c) {
      c.b = c.q('.ck-b'); c.sh = c.q('.ck-sh'); c.bat = c.q('.ck-bat'); c.bw = c.q('.ck-bw'); c.rn = c.q('.ck-rn'); c.bl = c.q('.ck-bl'); c.tot = c.q('.ck-tot');
      c.d = [].slice.call(c.box.querySelectorAll('.ck-d')); c.dt = [].slice.call(c.box.querySelectorAll('.ck-dt')); c.fx = c.q('.ck-fx'); c.fxt = c.fx.querySelector('text'); bnInit(c);
    },
    frame: function (c, R, t, e, res) {
      var b = res ? (res.b || []).map(Number) : [], s = res ? +res.s || 0 : 0, j = res ? Math.floor((e - CK_0) / CK_D) : -1, ph = res ? (e - CK_0) / CK_D - j : 0, i, runs = 0, wk = 0;
      if (j > 5) { j = 5; ph = 1.01; }
      for (i = 0; i < 6; i++) {
        var kn = res && e >= CK_0 && (i < j || (i === j && ph >= .62));
        cls(c.d[i], !kn ? 'ck-d' : b[i] < 0 ? 'ck-d w' : b[i] >= 4 ? 'ck-d b' : 'ck-d r'); txt(c.dt[i], kn ? ckLab(b[i]) : '');
        if (kn) { if (b[i] < 0) wk++; else runs += b[i]; }
      }
      txt(c.tot, runs + '/' + wk);
      if (!res || e < CK_0) {
        sa(c.b, 'transform', 'translate(316 ' + (138 - Math.abs(Math.sin(t * 2)) * 4).toFixed(1) + ')'); sa(c.sh, 'transform', 'translate(316 170)'); sa(c.bw, 'transform', 'translate(320 160)');
        sa(c.bat, 'transform', 'rotate(0 4 -22)'); sa(c.rn, 'opacity', '0'); sa(c.bl, 'transform', ''); sa(c.fx, 'opacity', '0'); if (!bnCd(c, R, t, e)) bnSet(c, ''); return;
      }
      var v = b[j], bx, by, z = 0, ru = eo(seg(ph, 0, .22));
      sa(c.bw, 'transform', 'translate(' + lerp(346, 306, ru).toFixed(1) + ' 160)');
      var d = seg(ph, .22, .5); // delivery: release (300,128) → bounce (150,160) → bat (92,140)
      if (ph < .22) { bx = lerp(346, 306, ru) - 4; by = 128; z = 0; }
      else if (ph < .5) { bx = lerp(300, 92, d); by = 158; z = d < .7 ? lerp(30, 0, d / .7) : Math.sin(Math.PI * (d - .7) / .3 * .5) * 16; }
      else {
        var a = seg(ph, .5, 1), dir = hs(s, 1200 + j);
        if (v < 0) { bx = lerp(92, 68, Math.min(1, a * 4)); by = 156; z = 4 * (1 - a); }
        else if (v === 0) { bx = lerp(92, 112, eo(a)); by = 158 + a * 6; z = 0; }
        else if (v === 6) { bx = lerp(92, 200 + dir * 140, a); by = lerp(158, 100, a); z = Math.sin(Math.PI * Math.min(1, a * .9)) * 130 + a * 40; }
        else if (v === 4) { bx = lerp(92, 330, eo(a)); by = lerp(158, 92 + dir * 120, eo(a)); z = 0; }
        else { bx = lerp(92, 150 + dir * 80, eo(a)); by = lerp(158, 110 + dir * 80, eo(a)); z = Math.sin(Math.PI * a) * 10; }
      }
      sa(c.b, 'transform', 'translate(' + bx.toFixed(1) + ' ' + (by - z - 10).toFixed(1) + ')'); sa(c.sh, 'transform', 'translate(' + bx.toFixed(1) + ' ' + by.toFixed(1) + ')');
      var sw = v >= 0 && ph > .44 && ph < .62 ? Math.sin(Math.PI * seg(ph, .44, .62)) : 0; sa(c.bat, 'transform', 'rotate(' + (sw * 110).toFixed(0) + ' 4 -22)');
      sa(c.bl, 'transform', v < 0 && ph > .5 ? 'translate(' + (-seg(ph, .5, .8) * 18).toFixed(1) + ' ' + (-Math.sin(Math.PI * seg(ph, .5, .8)) * 20).toFixed(1) + ') rotate(' + (seg(ph, .5, .8) * 200).toFixed(0) + ')' : '');
      var runN = v > 0 && v < 4 ? v : 0, rp = seg(ph, .5, 1) * runN, leg = Math.floor(rp), fr = rp - leg;
      sa(c.rn, 'opacity', runN && ph > .5 && ph < 1 ? '1' : '0'); sa(c.rn, 'transform', 'translate(' + (leg % 2 ? lerp(286, 80, fr) : lerp(80, 286, fr)).toFixed(1) + ' 168)');
      var fxOn = ph > .62 && ph < 1 && v !== 0;
      sa(c.fx, 'opacity', fxOn ? '1' : '0'); cls(c.fx, 'ck-fx ' + (v < 0 ? 'w' : v >= 4 ? 'b' : 'r'));
      txt(c.fxt, v < 0 ? c.l.wkt : v === 6 ? 'SIX!' : v === 4 ? 'FOUR!' : '+' + v, 80);
      var fin = e >= CK_0 + 6 * CK_D;
      bnSet(c, fin ? runs + ' ' + c.l.runs + (wk ? ' · ' + wk + ' W' : '') : '', 'n0');
    }
  });

  /* ------------------------------------------------------------- Archery ------------------------------------------------------------- */
  var AR_0 = .4, AR_D = 2.0, AR_C = [270, 118], AR_R = 7; // target centre, ring width
  function arPt(s, j, v) {
    var a = hs(s, 1300 + j) * 6.283, r = v >= 1 ? (10 - v + .15 + hs(s, 1400 + j) * .7) * AR_R : 10 * AR_R + 3 + hs(s, 1400 + j) * 6;
    return { x: AR_C[0] + Math.cos(a) * r, y: AR_C[1] + Math.sin(a) * r };
  }
  live('archerylive', {
    lab: 'ar', bev: 'shot', SHOW: AR_0 + 3 * AR_D + 2.2,
    odds0: { a0: 2.56, a1: 2.95, a2: 3.67, a3: 15.77, ten: 2.30, p30: 229.49 },
    beat: function (e) { return e < AR_0 ? 0 : Math.min(4, 1 + Math.floor((e - AR_0 - AR_D * .4) / AR_D + 1)); },
    rules: rules(140, { a0: 2.56, a1: 2.95, a2: 3.67, a3: 15.77, ten: 2.30, p30: 229.49 }, {
      en: ['The archer shoots 3 arrows at the target (10 points in the gold centre, down to 1 on the outer ring, 0 if missed). Bet on the total: 21 or less ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}); or on at least one 10 ({ten}) or a perfect 30 ({p30}).', 'Each arrow scores 10 (16 %), 9 (22 %), 8 (20 %), 7 (15 %), 6 (10 %), 5 (7 %), 4 (4 %), 3 (3 %), 2 (2 %), 1 or 0 (0.5 % each). The 3 arrows are drawn by the server when bets close.'],
      fr: ['L’archer tire 3 flèches sur la cible (10 points au centre doré, jusqu’à 1 sur l’anneau extérieur, 0 si raté). Parie sur le total : 21 ou moins ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}) ; ou sur au moins un 10 ({ten}) ou un parfait 30 ({p30}).', 'Chaque flèche fait 10 (16 %), 9 (22 %), 8 (20 %), 7 (15 %), 6 (10 %), 5 (7 %), 4 (4 %), 3 (3 %), 2 (2 %), 1 ou 0 (0,5 % chacun). Les 3 flèches sont tirées par le serveur à la fermeture des paris.'],
      es: ['El arquero lanza 3 flechas a la diana (10 puntos en el centro dorado, hasta 1 en el anillo exterior, 0 si falla). Apuesta al total: 21 o menos ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}); o a al menos un 10 ({ten}) o un 30 perfecto ({p30}).', 'Cada flecha da 10 (16 %), 9 (22 %), 8 (20 %), 7 (15 %), 6 (10 %), 5 (7 %), 4 (4 %), 3 (3 %), 2 (2 %), 1 o 0 (0,5 % cada uno). Las 3 flechas las sortea el servidor al cerrar.'],
      pt: ['O arqueiro atira 3 flechas no alvo (10 pontos no centro dourado, até 1 no anel externo, 0 se errar). Aposte no total: 21 ou menos ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}); ou em pelo menos um 10 ({ten}) ou num 30 perfeito ({p30}).', 'Cada flecha faz 10 (16 %), 9 (22 %), 8 (20 %), 7 (15 %), 6 (10 %), 5 (7 %), 4 (4 %), 3 (3 %), 2 (2 %), 1 ou 0 (0,5 % cada). As 3 flechas são sorteadas pelo servidor no fechamento.'],
      ar: ['يطلق الرامي 3 سهام على الهدف (10 نقاط في المركز الذهبي حتى 1 في الحلقة الخارجية، و0 إن أخطأ). راهن على المجموع: 21 أو أقل ({a0})، 22–24 ({a1})، 25–27 ({a2})، 28–30 ({a3})؛ أو على إصابة 10 واحدة على الأقل ({ten}) أو 30 مثالية ({p30}).', 'كل سهم يعطي 10 (16 %)، 9 (22 %)، 8 (20 %)، 7 (15 %)، 6 (10 %)، 5 (7 %)، 4 (4 %)، 3 (3 %)، 2 (2 %)، 1 أو 0 (0.5 % لكل منهما). يسحب الخادم السهام الثلاثة عند إغلاق الرهانات.'],
      tr: ['Okçu hedefe 3 ok atar (altın merkez 10 puan, dış halka 1, ıska 0). Toplama oyna: 21 veya altı ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}); ya da en az bir 10 ({ten}) veya kusursuz 30 ({p30}).', 'Her ok 10 (%16), 9 (%22), 8 (%20), 7 (%15), 6 (%10), 5 (%7), 4 (%4), 3 (%3), 2 (%2), 1 veya 0 (her biri %0,5) yapar. 3 ok bahisler kapanınca sunucu tarafından çekilir.'],
      vi: ['Cung thủ bắn 3 mũi tên vào bia (10 điểm ở tâm vàng, đến 1 ở vòng ngoài, 0 nếu trượt). Cược tổng điểm: 21 trở xuống ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}); hoặc ít nhất một điểm 10 ({ten}) hay 30 tuyệt đối ({p30}).', 'Mỗi mũi được 10 (16 %), 9 (22 %), 8 (20 %), 7 (15 %), 6 (10 %), 5 (7 %), 4 (4 %), 3 (3 %), 2 (2 %), 1 hoặc 0 (mỗi loại 0,5 %). 3 mũi tên do máy chủ rút khi đóng cược.'],
      id: ['Pemanah menembakkan 3 anak panah ke sasaran (10 poin di pusat emas, hingga 1 di cincin terluar, 0 jika meleset). Pasang total: 21 atau kurang ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}); atau minimal satu 10 ({ten}) atau sempurna 30 ({p30}).', 'Tiap panah mendapat 10 (16 %), 9 (22 %), 8 (20 %), 7 (15 %), 6 (10 %), 5 (7 %), 4 (4 %), 3 (3 %), 2 (2 %), 1 atau 0 (masing-masing 0,5 %). Ketiga panah diundi server saat taruhan ditutup.'],
      ru: ['Лучник стреляет 3 стрелы в мишень (10 очков в золотом центре, до 1 на внешнем кольце, 0 при промахе). Ставьте на сумму: 21 и меньше ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}); или хотя бы на одну десятку ({ten}) или идеальные 30 ({p30}).', 'Каждая стрела даёт 10 (16 %), 9 (22 %), 8 (20 %), 7 (15 %), 6 (10 %), 5 (7 %), 4 (4 %), 3 (3 %), 2 (2 %), 1 или 0 (по 0,5 %). Все 3 стрелы разыгрывает сервер при закрытии ставок.'],
      de: ['Der Bogenschütze schießt 3 Pfeile auf die Scheibe (10 Punkte im goldenen Zentrum, bis 1 auf dem äußeren Ring, 0 bei Fehlschuss). Setze auf die Summe: 21 oder weniger ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}); oder auf mindestens eine 10 ({ten}) oder perfekte 30 ({p30}).', 'Jeder Pfeil bringt 10 (16 %), 9 (22 %), 8 (20 %), 7 (15 %), 6 (10 %), 5 (7 %), 4 (4 %), 3 (3 %), 2 (2 %), 1 oder 0 (je 0,5 %). Die 3 Pfeile zieht der Server beim Schließen.'],
      hi: ['तीरंदाज़ निशाने पर 3 तीर चलाता है (सुनहरे केंद्र में 10 अंक, बाहरी घेरे पर 1, चूकने पर 0)। कुल पर दांव लगाएं: 21 या कम ({a0}), 22–24 ({a1}), 25–27 ({a2}), 28–30 ({a3}); या कम से कम एक 10 ({ten}) या परफ़ेक्ट 30 ({p30})।', 'हर तीर पर 10 (16 %), 9 (22 %), 8 (20 %), 7 (15 %), 6 (10 %), 5 (7 %), 4 (4 %), 3 (3 %), 2 (2 %), 1 या 0 (हर एक 0.5 %)। तीनों तीर दांव बंद होने पर सर्वर निकालता है।'],
      zh: ['弓箭手向靶射出 3 支箭（金色靶心 10 环，最外圈 1 环，脱靶 0 环）。押总环数：21 及以下（{a0}）、22–24（{a1}）、25–27（{a2}）、28–30（{a3}）；或至少一个 10 环（{ten}）、满分 30（{p30}）。', '每支箭：10 环 16%、9 环 22%、8 环 20%、7 环 15%、6 环 10%、5 环 7%、4 环 4%、3 环 3%、2 环 2%、1 环或 0 环各 0.5%。3 支箭由服务器在停止下注时抽出。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + lgd('arS' + uid, '#7DD3FC', '#E0F2FE', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#3F6212"/>' +
        '<rect x="-300" y="-300" width="960" height="430" fill="url(#arS' + uid + ')"/><path d="M-300 130Q0 100 180 120T660 112V140H-300Z" fill="#65A30D"/><rect x="-300" y="136" width="960" height="400" fill="#4D7C0F"/>' +
        '<path d="M250 190L262 128M290 190L278 128" stroke="#78350F" stroke-width="4"/>';
      var RC = ['#F8FAFC', '#F8FAFC', '#7C3AED', '#7C3AED', '#2563EB', '#2563EB', '#DC2626', '#DC2626', '#FACC15', '#FACC15'];
      for (var k = 0; k < 10; k++) h += '<circle cx="' + AR_C[0] + '" cy="' + AR_C[1] + '" r="' + ((10 - k) * AR_R) + '" fill="' + RC[k] + '" stroke="' + (k === 2 || k === 3 ? '#F8FAFC' : '#64748B') + '" stroke-width=".5"/>';
      h += '<circle cx="' + AR_C[0] + '" cy="' + AR_C[1] + '" r="1.2" fill="#7C2D12"/>' +
        '<g transform="translate(46 190)"><path d="M-3-24L-5 0M3-24L5 0" stroke="#1E3A8A" stroke-width="4.4" stroke-linecap="round"/><rect x="-7" y="-46" width="14" height="24" rx="5" fill="#16A34A"/><circle cy="-52" r="6" fill="#FDE2C4"/><path d="M-6-56Q0-62 6-56" stroke="#78350F" stroke-width="3" fill="none"/>' +
        '<path d="M6-40L18-40" stroke="#FDE2C4" stroke-width="3.4" stroke-linecap="round"/><path d="M18-62Q30-40 18-18" stroke="#92400E" stroke-width="2.6" fill="none"/><path class="ar-str" d="M18-62L18-18" stroke="#F8FAFC" stroke-width=".8"/></g>';
      for (k = 0; k < 3; k++) h += '<g class="ar-a" opacity="0"><path d="M0 0L-16 9" stroke="#78350F" stroke-width="2" stroke-linecap="round"/><path d="M-16 9L-21 9M-16 9L-18 13" stroke="#EF4444" stroke-width="2.2"/><circle r="1.6" fill="#334155"/></g>';
      h += '<g class="ar-sb"><rect x="60" y="6" width="240" height="30" rx="10" fill="rgba(2,6,23,.8)" stroke="#FDE68A" stroke-opacity=".4"/>';
      for (k = 0; k < 3; k++) h += '<g transform="translate(' + (88 + k * 36) + ' 21)"><circle class="ar-d" r="11"/><text class="ar-dt" y="4.5" text-anchor="middle"></text></g>';
      return h + '<text class="ar-tot" x="288" y="27" text-anchor="end">0</text></g>' + banner(214);
    },
    board: function (uid, l, oddTxt, o) {
      return ['a0', 'a1', 'a2', 'a3'].map(function (s, i) { return btn(s, lab(['≤ 21', '22–24', '25–27', '28–30'][i]) + odd(s, oddTxt, o), 'ar-b'); }).join('') +
        btn('ten', lab(l.ten) + odd('ten', oddTxt, o), 'x2') + btn('p30', lab('30 / 30') + odd('p30', oddTxt, o), 'x2');
    },
    hist: function (n) { return chipS(n, n >= 28 ? 'arh2' : n >= 25 ? 'arh1' : 'arh0'); },
    wins: function (res) { var a = (res.a || []).map(Number), n = +res.n, w = [n <= 21 ? 'a0' : n <= 24 ? 'a1' : n <= 27 ? 'a2' : 'a3']; if (a.indexOf(10) >= 0) w.push('ten'); if (n === 30) w.push('p30'); return w; },
    init: function (c) { c.ar = [].slice.call(c.box.querySelectorAll('.ar-a')); c.d = [].slice.call(c.box.querySelectorAll('.ar-d')); c.dt = [].slice.call(c.box.querySelectorAll('.ar-dt')); c.tot = c.q('.ar-tot'); c.str = c.q('.ar-str'); bnInit(c); },
    frame: function (c, R, t, e, res) {
      var a = res ? (res.a || []).map(Number) : [], s = res ? +res.s || 0 : 0, tot = 0, i, pull = 0;
      for (i = 0; i < 3; i++) {
        var a0 = AR_0 + i * AR_D, ph = res ? (e - a0) / AR_D : -1, g = c.ar[i], kn = ph >= .45;
        if (res && ph >= 0 && ph < .25) pull = Math.max(pull, Math.sin(Math.PI * ph / .25 * .5));
        if (!res || ph < .25) sa(g, 'opacity', '0');
        else {
          var p = arPt(s, i, a[i]), u = seg(ph, .25, .45), x = lerp(66, p.x, u), y = lerp(150, p.y, u) - Math.sin(Math.PI * u) * 18;
          sa(g, 'opacity', '1'); sa(g, 'transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + lerp(1.4, 1, u).toFixed(2) + ')' + (kn ? '' : ' rotate(' + (-30 + u * 30).toFixed(0) + ')'));
        }
        cls(c.d[i], !kn ? 'ar-d' : a[i] === 10 ? 'ar-d g' : a[i] >= 8 ? 'ar-d r' : 'ar-d b'); txt(c.dt[i], kn ? String(a[i]) : '');
        if (kn) tot += a[i];
      }
      sa(c.str, 'transform', 'translate(' + (-pull * 12).toFixed(1) + ' 0)');
      txt(c.tot, String(tot));
      if (!res) { if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      bnSet(c, e >= AR_0 + 2 * AR_D + AR_D * .5 ? tot + ' / 30' : '', 'n0');
    }
  });

  /* ------------------------------------------------------------- Fishing ------------------------------------------------------------- */
  // n: 0 boot · 1 small fish · 2 medium · 3 big · 4 shark · 5 golden fish
  var FI_COL = [['#78350F', '#451A03'], ['#60A5FA', '#1D4ED8'], ['#4ADE80', '#15803D'], ['#FB923C', '#C2410C'], ['#94A3B8', '#334155'], ['#FDE047', '#B45309']];
  function fishSvg(n, s) {
    var c = FI_COL[n];
    if (n === 0) return '<g transform="scale(' + s + ')"><path d="M-6-12H4V2L14 4Q18 6 16 10H-8Z" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="1.2"/><path d="M-6-9H4" stroke="#FDE68A" stroke-width="1.2"/></g>';
    if (n === 4) return '<g transform="scale(' + s + ')"><path d="M-18 0Q-4-10 14-2L20-1L14 3Q-4 10-18 0Z" fill="' + c[0] + '" stroke="' + c[1] + '"/><path d="M-2-6L4-15L6-5Z" fill="' + c[0] + '"/><path d="M-18 0L-25-7L-23 0L-25 7Z" fill="' + c[0] + '"/><circle cx="11" cy="-1.5" r="1.2" fill="#111"/><path d="M12 2H17" stroke="#F8FAFC" stroke-width=".8" stroke-dasharray="1 .6"/><path d="M-12 3Q0 7 12 3" stroke="#E2E8F0" stroke-width="1.6" fill="none"/></g>';
    return '<g transform="scale(' + s + ')"><path d="M-12 0Q-2-9 11-1Q12 0 11 1Q-2 9-12 0Z" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="1"/><path d="M-12 0L-19-6L-17 0L-19 6Z" fill="' + c[1] + '"/><path d="M-3-6L1-9L3-5" fill="' + c[1] + '"/><circle cx="6" cy="-1.5" r="1.4" fill="#111"/>' +
      (n === 5 ? '<path d="M-6-3Q-2 0-6 3M-1-4Q3 0-1 4" stroke="#FEF3C7" stroke-width="1" fill="none"/>' : '') + '</g>';
  }
  var FI_CAST = 1.2, FI_BITE = 3.4, FI_UP = 4.0, FI_SHOW = 5.2;
  live('fishinglive', {
    lab: 'fi', bev: 'reveal', SHOW: 7.4,
    odds0: { f0: 5.22, f1: 3.13, f2: 3.91, f3: 5.87, f4: 11.75, f5: 23.50, big: 3.35 },
    beat: function (e) { return (e >= .2) + (e >= FI_BITE) + (e >= FI_SHOW); },
    rules: rules(140, { f0: 5.22, f1: 3.13, f2: 3.91, f3: 5.87, f4: 11.75, f5: 23.50, big: 3.35 }, {
      en: ['The angler casts once. Bet on what comes out of the lake: an old Boot ({f0}), a Small fish ({f1}), a Medium fish ({f2}), a Big fish ({f3}), a Shark ({f4}) or the Golden fish ({f5}); or on a Big catch ({big}: big fish, shark or golden fish).', 'Chances: boot 18 %, small 30 %, medium 24 %, big 16 %, shark 8 %, golden 4 %. The catch is drawn by the server when bets close.'],
      fr: ['Le pêcheur lance une fois. Parie sur ce qui sort du lac : une vieille Botte ({f0}), un Petit poisson ({f1}), un Moyen ({f2}), un Gros ({f3}), un Requin ({f4}) ou le Poisson doré ({f5}) ; ou sur une Grosse prise ({big} : gros poisson, requin ou poisson doré).', 'Chances : botte 18 %, petit 30 %, moyen 24 %, gros 16 %, requin 8 %, doré 4 %. La prise est tirée par le serveur à la fermeture des paris.'],
      es: ['El pescador lanza una vez. Apuesta a lo que sale del lago: una Bota vieja ({f0}), un pez Pequeño ({f1}), Mediano ({f2}), Grande ({f3}), un Tiburón ({f4}) o el pez Dorado ({f5}); o a una Gran captura ({big}: pez grande, tiburón o dorado).', 'Probabilidades: bota 18 %, pequeño 30 %, mediano 24 %, grande 16 %, tiburón 8 %, dorado 4 %. La captura la sortea el servidor al cerrar.'],
      pt: ['O pescador lança uma vez. Aposte no que sai do lago: uma Bota velha ({f0}), um peixe Pequeno ({f1}), Médio ({f2}), Grande ({f3}), um Tubarão ({f4}) ou o peixe Dourado ({f5}); ou numa Grande pesca ({big}: peixe grande, tubarão ou dourado).', 'Chances: bota 18 %, pequeno 30 %, médio 24 %, grande 16 %, tubarão 8 %, dourado 4 %. A pesca é sorteada pelo servidor no fechamento.'],
      ar: ['يرمي الصياد صنارته مرة واحدة. راهن على ما يخرج من البحيرة: حذاء قديم ({f0})، سمكة صغيرة ({f1})، متوسطة ({f2})، كبيرة ({f3})، قرش ({f4}) أو السمكة الذهبية ({f5})؛ أو على صيد كبير ({big}: سمكة كبيرة أو قرش أو ذهبية).', 'الفرص: حذاء 18 %، صغيرة 30 %، متوسطة 24 %، كبيرة 16 %، قرش 8 %، ذهبية 4 %. يسحب الخادم الصيد عند إغلاق الرهانات.'],
      tr: ['Balıkçı bir kez olta atar. Gölden ne çıkacağına oyna: eski bir Çizme ({f0}), Küçük balık ({f1}), Orta ({f2}), Büyük ({f3}), Köpekbalığı ({f4}) ya da Altın balık ({f5}); veya Büyük av ({big}: büyük balık, köpekbalığı ya da altın balık).', 'Şanslar: çizme %18, küçük %30, orta %24, büyük %16, köpekbalığı %8, altın %4. Av bahisler kapanınca sunucu tarafından çekilir.'],
      vi: ['Người câu quăng cần một lần. Cược thứ được kéo lên: chiếc Ủng cũ ({f0}), cá Nhỏ ({f1}), cá Vừa ({f2}), cá To ({f3}), Cá mập ({f4}) hoặc Cá vàng ({f5}); hoặc Mẻ lớn ({big}: cá to, cá mập hay cá vàng).', 'Cơ hội: ủng 18 %, nhỏ 30 %, vừa 24 %, to 16 %, cá mập 8 %, cá vàng 4 %. Mẻ câu do máy chủ rút khi đóng cược.'],
      id: ['Pemancing melempar kail sekali. Pasang apa yang keluar dari danau: Sepatu bot tua ({f0}), ikan Kecil ({f1}), Sedang ({f2}), Besar ({f3}), Hiu ({f4}) atau Ikan emas ({f5}); atau Tangkapan besar ({big}: ikan besar, hiu atau ikan emas).', 'Peluang: sepatu 18 %, kecil 30 %, sedang 24 %, besar 16 %, hiu 8 %, emas 4 %. Tangkapan diundi server saat taruhan ditutup.'],
      ru: ['Рыбак делает один заброс. Ставьте на то, что вытащат из озера: старый Сапог ({f0}), Мелкую рыбу ({f1}), Среднюю ({f2}), Крупную ({f3}), Акулу ({f4}) или Золотую рыбку ({f5}); или на Крупный улов ({big}: крупная рыба, акула или золотая).', 'Шансы: сапог 18 %, мелкая 30 %, средняя 24 %, крупная 16 %, акула 8 %, золотая 4 %. Улов разыгрывает сервер при закрытии ставок.'],
      de: ['Der Angler wirft einmal aus. Setze darauf, was aus dem See kommt: ein alter Stiefel ({f0}), ein kleiner Fisch ({f1}), ein mittlerer ({f2}), ein großer ({f3}), ein Hai ({f4}) oder der Goldfisch ({f5}); oder auf einen großen Fang ({big}: großer Fisch, Hai oder Goldfisch).', 'Chancen: Stiefel 18 %, klein 30 %, mittel 24 %, groß 16 %, Hai 8 %, Goldfisch 4 %. Der Fang wird beim Schließen vom Server gezogen.'],
      hi: ['मछुआरा एक बार काँटा डालता है। झील से क्या निकलेगा उस पर दांव लगाएं: पुराना जूता ({f0}), छोटी मछली ({f1}), मध्यम ({f2}), बड़ी ({f3}), शार्क ({f4}) या सुनहरी मछली ({f5}); या बड़ी पकड़ ({big}: बड़ी मछली, शार्क या सुनहरी)।', 'संभावना: जूता 18 %, छोटी 30 %, मध्यम 24 %, बड़ी 16 %, शार्क 8 %, सुनहरी 4 %। पकड़ दांव बंद होने पर सर्वर निकालता है।'],
      zh: ['钓手抛竿一次。押湖里钓上来的东西：旧靴子（{f0}）、小鱼（{f1}）、中鱼（{f2}）、大鱼（{f3}）、鲨鱼（{f4}）或金鱼（{f5}）；或押大收获（{big}：大鱼、鲨鱼或金鱼）。', '概率：靴子 18%、小鱼 30%、中鱼 24%、大鱼 16%、鲨鱼 8%、金鱼 4%。渔获由服务器在停止下注时抽出。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + lgd('fiS' + uid, '#FDBA74', '#FEF3C7', 1) + lgd('fiW' + uid, '#0EA5E9', '#075985', 1) + '<radialGradient id="fiG' + uid + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FDE68A" stop-opacity=".7"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#0C4A6E"/><rect x="-300" y="-300" width="960" height="404" fill="url(#fiS' + uid + ')"/><circle cx="300" cy="80" r="16" fill="#FDE68A" opacity=".85"/>' +
        '<path d="M-300 104L-300 86Q20 60 120 84T260 78T660 88V104Z" fill="#166534" opacity=".7"/><rect x="-300" y="104" width="960" height="430" fill="url(#fiW' + uid + ')"/>';
      for (var k = 0; k < 16; k++) h += '<path d="M' + ((k * 61) % 350) + ' ' + (116 + (k * 23) % 100) + 'q5-3 10 0t10 0" stroke="#BAE6FD" stroke-width="1" fill="none" opacity=".45"/>';
      h += '<path d="M10 100Q20 112 70 112Q96 112 100 100Z" fill="#92400E" stroke="#451A03"/><rect x="10" y="98" width="90" height="4" fill="#B45309"/>' +
        '<g transform="translate(52 98)"><rect x="-7" y="-24" width="14" height="20" rx="4" fill="#DC2626"/><circle cy="-29" r="6" fill="#FDE2C4"/><path d="M-9-33H9L5-38H-5Z" fill="#FACC15"/><path d="M6-18L16-24" stroke="#FDE2C4" stroke-width="3.2" stroke-linecap="round"/></g>' +
        '<path class="fi-rod" d="M66 76L120 30" stroke="#1F2937" stroke-width="2.4" stroke-linecap="round"/><path class="fi-ln" d="M120 30L120 30" stroke="#F8FAFC" stroke-width=".8" fill="none"/>' +
        '<circle class="fi-rip" cx="0" cy="0" r="6" fill="none" stroke="#F8FAFC" stroke-width="1" opacity="0"/>' +
        '<g class="fi-bob"><circle r="3.6" fill="#EF4444" stroke="#fff" stroke-width=".8"/><path d="M-3.6 0H3.6" stroke="#fff" stroke-width="1.6"/></g>' +
        '<g class="fi-c" opacity="0"><circle class="fi-g" r="40" fill="url(#fiG' + uid + ')" opacity="0"/><g class="fi-cs"></g></g>' + banner(26);
      return h;
    },
    board: function (uid, l, oddTxt, o) {
      return [l.boot, l.small, l.medium, l.bigf, l.shark, l.goldf].map(function (nm, i) { return btn('f' + i, '<svg viewBox="-24 -16 48 32">' + fishSvg(i, 1) + '</svg>' + lab(nm) + odd('f' + i, oddTxt, o), 'fi-b'); }).join('') +
        btn('big', lab(l.bigc) + odd('big', oddTxt, o), 'x2');
    },
    hist: function (n) { return '<svg viewBox="-24 -16 48 32">' + fishSvg(n, .9) + '</svg>'; },
    wins: function (res) { var n = +res.n, w = ['f' + n]; if (n >= 3) w.push('big'); return w; },
    init: function (c) { c.ln = c.q('.fi-ln'); c.bob = c.q('.fi-bob'); c.rip = c.q('.fi-rip'); c.c = c.q('.fi-c'); c.cs = c.q('.fi-cs'); c.g = c.q('.fi-g'); c.rod = c.q('.fi-rod'); c.cn = -1; bnInit(c); },
    frame: function (c, R, t, e, res) {
      var n = res ? +res.n : -1, s = res ? +res.s || 0 : 0, tip = [120, 30], bx, by, bob = 0;
      var tx = 214 + (s % 50), ty = 140 + (s % 30);
      if (!res || e < 0) { bx = 160 + Math.sin(t * .6) * 6; by = 128 + Math.sin(t * 2) * 1.5; }
      else if (e < FI_CAST) { var u = eo(e / FI_CAST); bx = lerp(tip[0], tx, u); by = lerp(tip[1], ty, u) - Math.sin(Math.PI * u) * 46; }
      else if (e < FI_UP) {
        bx = tx; by = ty; var nib = e > FI_BITE - 1.1 && e < FI_BITE - .8 ? 2 : 0;
        bob = e >= FI_BITE ? 7 : Math.sin(e * 5) * 1 + nib;
      } else { bx = tx; by = ty; bob = 30; }
      var rodK = res && e >= FI_UP && e < FI_SHOW ? Math.sin(Math.PI * seg(e, FI_UP, FI_SHOW)) : 0;
      sa(c.rod, 'transform', 'rotate(' + (-rodK * 14).toFixed(1) + ' 66 76)');
      var tipx = 66 + (tip[0] - 66) * Math.cos(rodK * .24) + (tip[1] - 76) * Math.sin(rodK * .24), tipy = 76 - (tip[0] - 66) * Math.sin(rodK * .24) + (tip[1] - 76) * Math.cos(rodK * .24);
      var up = res && e >= FI_UP, ck = up ? eo(seg(e, FI_UP, FI_SHOW)) : 0, cx = lerp(tx, 180, ck), cy = lerp(ty, 100, ck) - Math.sin(Math.PI * ck) * 30;
      sa(c.bob, 'opacity', up ? '0' : '1'); sa(c.bob, 'transform', 'translate(' + bx.toFixed(1) + ' ' + (by + bob).toFixed(1) + ')');
      sa(c.ln, 'd', 'M' + tipx.toFixed(1) + ' ' + tipy.toFixed(1) + 'Q' + ((tipx + (up ? cx : bx)) / 2).toFixed(1) + ' ' + ((up ? cy : by + bob) + 10).toFixed(1) + ' ' + (up ? cx : bx).toFixed(1) + ' ' + (up ? cy - 10 : by + bob - 3).toFixed(1));
      var rp = res && e >= FI_CAST ? ((e - FI_CAST) * (e > FI_BITE ? 2.4 : .9)) % 1 : 0;
      sa(c.rip, 'opacity', res && e >= FI_CAST && !up ? (1 - rp).toFixed(2) : '0'); sa(c.rip, 'transform', 'translate(' + tx + ' ' + ty + ') scale(' + (1 + rp * 2.4).toFixed(2) + ' ' + (.4 + rp * .9).toFixed(2) + ')');
      if (c.cn !== n) { c.cn = n; c.cs.innerHTML = n >= 0 ? fishSvg(n, 1) : ''; }
      sa(c.c, 'opacity', up ? '1' : '0'); sa(c.c, 'transform', 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') scale(' + lerp(.5, 2.3, ck).toFixed(2) + ') rotate(' + (e < FI_SHOW ? Math.sin(e * 14) * 18 : Math.sin(t * 3) * 6).toFixed(0) + ')');
      sa(c.g, 'opacity', up && e >= FI_SHOW ? (.6 + .4 * Math.sin(t * 4)).toFixed(2) : '0');
      if (!res) { if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      bnSet(c, e >= FI_SHOW ? [c.l.boot, c.l.small, c.l.medium, c.l.bigf, c.l.shark, c.l.goldf][n] : '', 'n0');
    }
  });

  /* ----------------------------------------------------------- Balloon Pop ----------------------------------------------------------- */
  var BL_C = [['#F87171', '#B91C1C'], ['#60A5FA', '#1D4ED8'], ['#4ADE80', '#15803D'], ['#FDE047', '#B45309']], BL_0 = 1.3, BL_D = 1.5;
  function blPos(i) { return { x: 102 + (i % 4) * 52, y: 64 + Math.floor(i / 4) * 46 }; }
  function balloon(col) { return '<path d="M0 22Q-3 30 2 36" stroke="#E2E8F0" stroke-width=".8" fill="none"/><ellipse rx="15" ry="18" fill="' + col[0] + '" stroke="' + col[1] + '" stroke-width="1.2"/><path d="M-3 17L3 17L0 21Z" fill="' + col[1] + '"/><ellipse cx="-6" cy="-7" rx="4" ry="6" fill="#fff" opacity=".45"/>'; }
  function blSvg(k, sz) { return '<svg viewBox="-17 -20 34 42" style="width:' + sz + 'px;height:' + sz + 'px">' + balloon(BL_C[k]) + '</svg>'; }
  live('balloonlive', {
    lab: 'bp', bev: 'pop', SHOW: BL_0 + 3 * BL_D + 2,
    odds0: { gold: 3.76, red2: 3.97, blue2: 3.97, green2: 7.38, mix: 2.35, tri: 22.97 },
    beat: function (e) { return e < BL_0 ? 0 : Math.min(3, Math.floor((e - BL_0) / BL_D + .6)); },
    rules: rules(140, { gold: 3.76, red2: 3.97, green2: 7.38, mix: 2.35, tri: 22.97 }, {
      en: ['12 balloons (4 red, 4 blue, 3 green, 1 gold) are shuffled on the wall, then 3 darts each pop a different balloon at random. Bet on: Gold popped ({gold}), 2+ Red ({red2}), 2+ Blue ({red2}), 2+ Green ({green2}), 3 different colours ({mix}) or 3 of the same colour ({tri}).', 'The wall and the 3 darts are drawn by the server when bets close; every balloon has the same chance to be hit.'],
      fr: ['12 ballons (4 rouges, 4 bleus, 3 verts, 1 doré) sont mélangés sur le mur, puis 3 fléchettes crèvent chacune un ballon différent au hasard. Parie sur : Doré crevé ({gold}), 2+ rouges ({red2}), 2+ bleus ({red2}), 2+ verts ({green2}), 3 couleurs différentes ({mix}) ou 3 de la même couleur ({tri}).', 'Le mur et les 3 fléchettes sont tirés par le serveur à la fermeture des paris ; chaque ballon a la même chance d’être touché.'],
      es: ['12 globos (4 rojos, 4 azules, 3 verdes, 1 dorado) se mezclan en la pared y 3 dardos revientan cada uno un globo distinto al azar. Apuesta a: Dorado reventado ({gold}), 2+ rojos ({red2}), 2+ azules ({red2}), 2+ verdes ({green2}), 3 colores distintos ({mix}) o 3 del mismo color ({tri}).', 'La pared y los 3 dardos los sortea el servidor al cerrar; cada globo tiene la misma probabilidad.'],
      pt: ['12 balões (4 vermelhos, 4 azuis, 3 verdes, 1 dourado) são embaralhados na parede e 3 dardos estouram cada um um balão diferente ao acaso. Aposte em: Dourado estourado ({gold}), 2+ vermelhos ({red2}), 2+ azuis ({red2}), 2+ verdes ({green2}), 3 cores diferentes ({mix}) ou 3 da mesma cor ({tri}).', 'A parede e os 3 dardos são sorteados pelo servidor no fechamento; cada balão tem a mesma chance.'],
      ar: ['تُخلط 12 بالونة (4 حمراء، 4 زرقاء، 3 خضراء، 1 ذهبية) على الجدار، ثم تفجّر 3 سهام كل منها بالونة مختلفة عشوائيًا. راهن على: انفجار الذهبية ({gold})، 2+ حمراء ({red2})، 2+ زرقاء ({red2})، 2+ خضراء ({green2})، 3 ألوان مختلفة ({mix}) أو 3 من اللون نفسه ({tri}).', 'يسحب الخادم الجدار والسهام الثلاثة عند إغلاق الرهانات؛ لكل بالونة الفرصة نفسها.'],
      tr: ['12 balon (4 kırmızı, 4 mavi, 3 yeşil, 1 altın) duvarda karıştırılır, sonra 3 dart her biri rastgele farklı bir balonu patlatır. Şuna oyna: Altın patladı ({gold}), 2+ kırmızı ({red2}), 2+ mavi ({red2}), 2+ yeşil ({green2}), 3 farklı renk ({mix}) ya da 3 aynı renk ({tri}).', 'Duvar ve 3 dart bahisler kapanınca sunucu tarafından çekilir; her balonun şansı aynı.'],
      vi: ['12 bóng bay (4 đỏ, 4 xanh, 3 lục, 1 vàng) được xáo trên tường, rồi 3 phi tiêu mỗi chiếc bắn nổ một quả khác nhau ngẫu nhiên. Cược: Bóng vàng nổ ({gold}), 2+ đỏ ({red2}), 2+ xanh ({red2}), 2+ lục ({green2}), 3 màu khác nhau ({mix}) hoặc 3 cùng màu ({tri}).', 'Bức tường và 3 phi tiêu do máy chủ rút khi đóng cược; mỗi quả có cơ hội như nhau.'],
      id: ['12 balon (4 merah, 4 biru, 3 hijau, 1 emas) diacak di dinding, lalu 3 anak panah masing-masing memecahkan balon berbeda secara acak. Pasang: Emas pecah ({gold}), 2+ merah ({red2}), 2+ biru ({red2}), 2+ hijau ({green2}), 3 warna berbeda ({mix}) atau 3 warna sama ({tri}).', 'Dinding dan 3 anak panah diundi server saat taruhan ditutup; tiap balon berpeluang sama.'],
      ru: ['12 шаров (4 красных, 4 синих, 3 зелёных, 1 золотой) перемешиваются на стене, затем 3 дротика лопают по одному случайному шару. Ставьте на: лопнул Золотой ({gold}), 2+ красных ({red2}), 2+ синих ({red2}), 2+ зелёных ({green2}), 3 разных цвета ({mix}) или 3 одного цвета ({tri}).', 'Стену и 3 дротика разыгрывает сервер при закрытии ставок; у каждого шара равный шанс.'],
      de: ['12 Ballons (4 rot, 4 blau, 3 grün, 1 gold) werden an der Wand gemischt, dann lässt jeder von 3 Pfeilen zufällig einen anderen Ballon platzen. Setze auf: Gold geplatzt ({gold}), 2+ Rot ({red2}), 2+ Blau ({red2}), 2+ Grün ({green2}), 3 verschiedene Farben ({mix}) oder 3 gleiche Farben ({tri}).', 'Wand und 3 Pfeile zieht der Server beim Schließen; jeder Ballon hat dieselbe Chance.'],
      hi: ['दीवार पर 12 गुब्बारे (4 लाल, 4 नीले, 3 हरे, 1 सुनहरा) मिलाए जाते हैं, फिर 3 डार्ट रैंडम अलग-अलग गुब्बारे फोड़ते हैं। दांव लगाएं: सुनहरा फूटा ({gold}), 2+ लाल ({red2}), 2+ नीले ({red2}), 2+ हरे ({green2}), 3 अलग रंग ({mix}) या 3 एक ही रंग ({tri})।', 'दीवार और 3 डार्ट दांव बंद होने पर सर्वर निकालता है; हर गुब्बारे की संभावना बराबर है।'],
      zh: ['墙上 12 个气球（4 红、4 蓝、3 绿、1 金）随机排列，然后 3 支飞镖各随机扎破一个不同的气球。押：扎破金气球（{gold}）、2+ 红（{red2}）、2+ 蓝（{red2}）、2+ 绿（{green2}）、三种不同颜色（{mix}）或三个同色（{tri}）。', '气球排列与 3 支飞镖由服务器在停止下注时抽出；每个气球被扎中的机会相同。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + lgd('blW' + uid, '#7C3AED', '#4C1D95', 1) + lgd('blF' + uid, '#B45309', '#78350F', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#4C1D95"/>';
      for (var s0 = -300; s0 < 660; s0 += 30) h += '<rect x="' + s0 + '" y="-300" width="15" height="496" fill="#DC2626" opacity=".55"/><rect x="' + (s0 + 15) + '" y="-300" width="15" height="496" fill="#FEF3C7" opacity=".16"/>';
      h += '<path d="M-10 4Q90 26 180 8T370 4" stroke="#FDE68A" stroke-width="1" fill="none"/>';
      for (s0 = 0; s0 < 19; s0++) { var bx0 = s0 * 20, by0 = 4 + Math.sin(s0 / 18 * Math.PI) * 10; h += '<path d="M' + bx0 + ' ' + by0.toFixed(1) + 'l10 0l-5 10z" fill="' + ['#F59E0B', '#22C55E', '#3B82F6', '#EC4899'][s0 % 4] + '"/>'; }
      h += '<rect x="70" y="34" width="220" height="150" rx="12" fill="url(#blW' + uid + ')" stroke="#FDE68A" stroke-width="2.4"/>';
      h +=
        '';
      for (var k = 0; k < 24; k++) h += '<circle cx="' + (72 + (k % 12) * 19.8) + '" cy="' + (k < 12 ? 36 : 182) + '" r="2.2" fill="#FDE68A" class="bl-lt"/>';
      for (k = 0; k < 12; k++) { var p = blPos(k); h += '<g class="bl-o" transform="translate(' + p.x + ' ' + p.y + ')"><g class="bl-in">' + '<g class="bl-k"></g></g><g class="bl-x" opacity="0"><path d="M0-16L4-5L15-8L7 1L13 12L1 6L-9 14L-6 2L-16-4L-4-5Z" fill="#FEF3C7"/></g></g>'; }
      h += '<path d="M-300 192H660V530H-300Z" fill="url(#blF' + uid + ')"/>'; for (k = 0; k < 14; k++) h += '<path d="M' + (k * 28 - 8) + ' 192V530" stroke="#451A03" stroke-opacity=".35"/>';
      for (k = 0; k < 3; k++) h += '<g class="bl-d" opacity="0"><path d="M0 0L0 16" stroke="#E5E7EB" stroke-width="1.6"/><path d="M0 16L-4 22H4Z" fill="#EF4444"/><path d="M0 -3L0 0" stroke="#94A3B8" stroke-width="2"/></g>';
      h += '<g class="bl-sb"><rect x="96" y="194" width="168" height="30" rx="10" fill="rgba(2,6,23,.8)" stroke="#FDE68A" stroke-opacity=".4"/>';
      for (k = 0; k < 3; k++) h += '<g transform="translate(' + (130 + k * 50) + ' 209)"><circle class="bl-s" r="10"/></g>';
      return h + '</g>' + banner(20);
    },
    board: function (uid, l, oddTxt, o) {
      return btn('gold', blSvg(3, 17) + lab(l.gold) + odd('gold', oddTxt, o), 'bl-b') + btn('red2', blSvg(0, 17) + lab(l.r2) + odd('red2', oddTxt, o), 'bl-b') +
        btn('blue2', blSvg(1, 17) + lab(l.b2) + odd('blue2', oddTxt, o), 'bl-b') + btn('green2', blSvg(2, 17) + lab(l.g2) + odd('green2', oddTxt, o), 'bl-b') +
        btn('mix', '<span class="bl-3">' + blSvg(0, 14) + blSvg(1, 14) + blSvg(2, 14) + '</span>' + lab(l.mix) + odd('mix', oddTxt, o), 'bl-b') +
        btn('tri', '<span class="bl-3">' + blSvg(1, 14) + blSvg(1, 14) + blSvg(1, 14) + '</span>' + lab(l.tri) + odd('tri', oddTxt, o), 'bl-b');
    },
    hist: function (n) { return '<span class="bl-h">' + [n >> 4, (n >> 2) & 3, n & 3].map(function (k) { return '<i style="background:' + BL_C[k][0] + '"></i>'; }).join('') + '</span>'; },
    wins: function (res) {
      var L = (res.l || []).map(Number), h = (res.h || []).map(Number), cnt = [0, 0, 0, 0], w = [];
      h.forEach(function (i) { cnt[L[i]]++; });
      if (cnt[3]) w.push('gold'); if (cnt[0] >= 2) w.push('red2'); if (cnt[1] >= 2) w.push('blue2'); if (cnt[2] >= 2) w.push('green2');
      var u = cnt.filter(function (x) { return x; }).length; if (u === 3) w.push('mix'); if (u === 1) w.push('tri');
      return w;
    },
    init: function (c) {
      c.o = [].slice.call(c.box.querySelectorAll('.bl-o')).map(function (g) { return { g: g, inn: g.querySelector('.bl-in'), k: g.querySelector('.bl-k'), x: g.querySelector('.bl-x'), col: -1 }; });
      c.d = [].slice.call(c.box.querySelectorAll('.bl-d')); c.s = [].slice.call(c.box.querySelectorAll('.bl-s')); c.lt = [].slice.call(c.box.querySelectorAll('.bl-lt')); bnInit(c);
    },
    frame: function (c, R, t, e, res) {
      var L = res ? (res.l || []).map(Number) : null, h = res ? (res.h || []).map(Number) : [], i, def = [0, 1, 2, 0, 1, 3, 2, 0, 1, 2, 0, 1];
      var swap = res && e < BL_0 ? Math.abs(Math.sin(Math.PI * cl01(e / (BL_0 - .2)))) : 0; // shuffle: balloons shrink, change colour, come back
      var showL = res && e >= (BL_0 - .2) / 2 ? L : def;
      for (i = 0; i < 12; i++) {
        var o = c.o[i], col = showL[i];
        if (o.col !== col) { o.col = col; o.k.innerHTML = balloon(BL_C[col]); }
        var hitAt = -1; for (var j = 0; j < 3; j++) if (h[j] === i) hitAt = BL_0 + j * BL_D + .5;
        var popped = res && hitAt >= 0 && e >= hitAt, pk = popped ? seg(e, hitAt, hitAt + .25) : 0;
        sa(o.inn, 'transform', 'translate(0 ' + (Math.sin(t * 1.6 + i) * 2).toFixed(1) + ') scale(' + (popped ? Math.max(.01, 1 - pk) : 1 - swap * .8).toFixed(2) + ')');
        sa(o.x, 'opacity', popped && pk < 1 ? (1 - pk).toFixed(2) : '0'); sa(o.x, 'transform', 'scale(' + (.6 + pk * .9).toFixed(2) + ')');
      }
      for (j = 0; j < 3; j++) {
        var a = BL_0 + j * BL_D, d = c.d[j];
        if (!res || e < a) { sa(d, 'opacity', '0'); cls(c.s[j], 'bl-s'); continue; }
        var p = blPos(h[j]), u = seg(e, a, a + .5), x = lerp(180, p.x + 2, u), y = lerp(250, p.y + 2, u) - Math.sin(Math.PI * u) * 20;
        sa(d, 'opacity', e > a + 1.2 ? '0' : '1'); sa(d, 'transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + lerp(10, -8, u).toFixed(0) + ') scale(' + lerp(1.6, 1, u).toFixed(2) + ')');
        cls(c.s[j], e >= a + .5 ? 'bl-s c' + L[h[j]] : 'bl-s');
      }
      var lp = Math.floor(t * 4) % 2; c.lt.forEach(function (g, k) { sa(g, 'opacity', (k + lp) % 2 ? '1' : '.35'); });
      if (!res) { if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var fin = e >= BL_0 + 2 * BL_D + .9, cnt = [0, 0, 0, 0]; h.forEach(function (k) { cnt[L[k]]++; });
      var u2 = cnt.filter(function (x) { return x; }).length;
      bnSet(c, fin ? (cnt[3] ? c.l.gold + ' ★' : u2 === 3 ? c.l.mix : u2 === 1 ? c.l.tri : cnt[0] >= 2 ? c.l.r2 : cnt[1] >= 2 ? c.l.b2 : c.l.g2) : '', 'n0');
    }
  });

  /* ------------------------------------------------------------- Volcano ------------------------------------------------------------- */
  var VO_ER = 1.7, VO_B0 = 2.3, VO_BD = .5;
  live('volcanolive', {
    lab: 'er', bev: 'stop', SHOW: VO_B0 + 5 * VO_BD + 1.4 + 2,
    odds0: { v0: 2.08, v1: 2.93, v2: 4.94, v3: 23.50, left: 1.88, right: 1.88 },
    beat: function (e) { return e < VO_ER ? 0 : e < VO_B0 ? 1 : Math.min(7, 2 + Math.floor((e - VO_B0 + .8) / VO_BD)); },
    rules: rules(140, { v0: 2.08, v1: 2.93, v2: 4.94, v3: 23.50, left: 1.88 }, {
      en: ['The volcano erupts with a power from 1 to 10 and throws 5 lava bombs. Bet on the power: 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) or the MEGA 10 ({v3}); or on the side where most of the 5 bombs land: Left or Right ({left}).', 'Power chances 1→10: 16, 15, 14, 12, 11, 9, 8, 6, 5, 4 %. Each bomb falls left or right with the same chance. Everything is drawn by the server when bets close.'],
      fr: ['Le volcan entre en éruption avec une puissance de 1 à 10 et projette 5 bombes de lave. Parie sur la puissance : 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) ou le MÉGA 10 ({v3}) ; ou sur le côté où tombent la plupart des 5 bombes : Gauche ou Droite ({left}).', 'Chances de la puissance 1→10 : 16, 15, 14, 12, 11, 9, 8, 6, 5, 4 %. Chaque bombe tombe à gauche ou à droite avec la même chance. Tout est tiré par le serveur à la fermeture des paris.'],
      es: ['El volcán entra en erupción con una potencia de 1 a 10 y lanza 5 bombas de lava. Apuesta a la potencia: 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) o el MEGA 10 ({v3}); o al lado donde caen la mayoría de las 5 bombas: Izquierda o Derecha ({left}).', 'Probabilidad de potencia 1→10: 16, 15, 14, 12, 11, 9, 8, 6, 5, 4 %. Cada bomba cae a izquierda o derecha con la misma probabilidad. Todo lo sortea el servidor al cerrar.'],
      pt: ['O vulcão entra em erupção com potência de 1 a 10 e lança 5 bombas de lava. Aposte na potência: 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) ou o MEGA 10 ({v3}); ou no lado onde cai a maioria das 5 bombas: Esquerda ou Direita ({left}).', 'Chances da potência 1→10: 16, 15, 14, 12, 11, 9, 8, 6, 5, 4 %. Cada bomba cai à esquerda ou à direita com a mesma chance. Tudo é sorteado pelo servidor no fechamento.'],
      ar: ['يثور البركان بقوة من 1 إلى 10 ويقذف 5 قنابل حمم. راهن على القوة: 1–3 ({v0})، 4–6 ({v1})، 7–9 ({v2}) أو الميغا 10 ({v3})؛ أو على الجهة التي تسقط فيها معظم القنابل الخمس: يسار أو يمين ({left}).', 'فرص القوة من 1 إلى 10: 16، 15، 14، 12، 11، 9، 8، 6، 5، 4 %. كل قنبلة تسقط يسارًا أو يمينًا بالفرصة نفسها. يسحب الخادم كل شيء عند إغلاق الرهانات.'],
      tr: ['Yanardağ 1’den 10’a bir güçle patlar ve 5 lav bombası fırlatır. Güce oyna: 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) ya da MEGA 10 ({v3}); veya 5 bombanın çoğunun düştüğü tarafa: Sol ya da Sağ ({left}).', 'Güç şansları 1→10: %16, 15, 14, 12, 11, 9, 8, 6, 5, 4. Her bomba eşit şansla sola ya da sağa düşer. Her şey bahisler kapanınca sunucu tarafından çekilir.'],
      vi: ['Núi lửa phun trào với sức mạnh từ 1 đến 10 và bắn ra 5 khối dung nham. Cược sức mạnh: 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) hoặc MEGA 10 ({v3}); hoặc phía mà phần lớn 5 khối rơi xuống: Trái hay Phải ({left}).', 'Cơ hội sức mạnh 1→10: 16, 15, 14, 12, 11, 9, 8, 6, 5, 4 %. Mỗi khối rơi trái hay phải với cơ hội như nhau. Mọi thứ do máy chủ rút khi đóng cược.'],
      id: ['Gunung berapi meletus dengan kekuatan 1 sampai 10 dan melontarkan 5 bom lava. Pasang kekuatan: 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) atau MEGA 10 ({v3}); atau sisi tempat sebagian besar dari 5 bom jatuh: Kiri atau Kanan ({left}).', 'Peluang kekuatan 1→10: 16, 15, 14, 12, 11, 9, 8, 6, 5, 4 %. Tiap bom jatuh ke kiri atau kanan dengan peluang sama. Semuanya diundi server saat taruhan ditutup.'],
      ru: ['Вулкан извергается с силой от 1 до 10 и выбрасывает 5 лавовых бомб. Ставьте на силу: 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) или МЕГА 10 ({v3}); или на сторону, куда упадёт большинство из 5 бомб: Влево или Вправо ({left}).', 'Шансы силы 1→10: 16, 15, 14, 12, 11, 9, 8, 6, 5, 4 %. Каждая бомба падает влево или вправо с равным шансом. Всё разыгрывает сервер при закрытии ставок.'],
      de: ['Der Vulkan bricht mit einer Stärke von 1 bis 10 aus und schleudert 5 Lavabomben. Setze auf die Stärke: 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) oder die MEGA-10 ({v3}); oder auf die Seite, auf der die meisten der 5 Bomben landen: Links oder Rechts ({left}).', 'Chancen der Stärke 1→10: 16, 15, 14, 12, 11, 9, 8, 6, 5, 4 %. Jede Bombe fällt mit gleicher Chance links oder rechts. Alles zieht der Server beim Schließen.'],
      hi: ['ज्वालामुखी 1 से 10 की ताक़त से फटता है और 5 लावा बम फेंकता है। ताक़त पर दांव लगाएं: 1–3 ({v0}), 4–6 ({v1}), 7–9 ({v2}) या मेगा 10 ({v3}); या उस तरफ़ जहाँ 5 में से ज़्यादातर बम गिरें: बाएँ या दाएँ ({left})।', 'ताक़त की संभावना 1→10: 16, 15, 14, 12, 11, 9, 8, 6, 5, 4 %। हर बम बराबर संभावना से बाएँ या दाएँ गिरता है। सब कुछ दांव बंद होने पर सर्वर निकालता है।'],
      zh: ['火山以 1 到 10 的威力喷发，并抛出 5 颗熔岩弹。押威力：1–3（{v0}）、4–6（{v1}）、7–9（{v2}）或超级 10（{v3}）；或押 5 颗熔岩弹多数落下的一侧：左或右（{left}）。', '威力 1→10 的概率：16、15、14、12、11、9、8、6、5、4%。每颗熔岩弹落左落右机会相同。一切由服务器在停止下注时抽出。']
    }),
    scene: function (uid, l) {
      var h = '<defs>' + lgd('voS' + uid, '#1E1B4B', '#7C2D12', 1) + lgd('voM' + uid, '#57534E', '#1C1917', 1) + lgd('voL' + uid, '#FEF08A', '#EA580C', 1) + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#1C1917"/>' +
        '<rect x="-300" y="-300" width="960" height="500" fill="url(#voS' + uid + ')"/>';
      for (var k = 0; k < 30; k++) h += '<circle cx="' + ((k * 83) % 360) + '" cy="' + ((k * 41) % 90) + '" r=".8" fill="#fff" opacity=".5"/>';
      h += '<rect x="-300" y="196" width="960" height="340" fill="#292524"/><path d="M-300 198H660" stroke="#44403C" stroke-width="3"/>' +
        '<g class="vo-sm" opacity="0">' + [0, 1, 2, 3].map(function (i) { return '<circle class="vo-p" r="' + (10 + i * 3) + '" fill="#78716C" opacity=".5"/>'; }).join('') + '</g>' +
        '<path class="vo-col" d="M168 112L192 112L196 112L164 112Z" fill="url(#voL' + uid + ')" opacity="0"/>' +
        '<g class="vo-m"><path d="M80 198L162 108H198L280 198Z" fill="url(#voM' + uid + ')"/><path d="M162 108H198L190 118H170Z" fill="#EA580C"/><path d="M170 118L160 150L176 136L172 170L188 128L196 150L190 118Z" fill="#F97316" opacity=".75" class="vo-lv"/></g>' +
        '<g class="vo-bar" transform="translate(326 52)"><rect x="-9" y="0" width="18" height="140" rx="9" fill="rgba(2,6,23,.75)" stroke="#FDE68A" stroke-opacity=".5"/>';
      for (k = 0; k < 10; k++) h += '<rect class="vo-seg" x="-6" y="' + (126 - k * 13.6).toFixed(1) + '" width="12" height="11" rx="3"/>';
      h += '<text class="vo-pw" y="-6" text-anchor="middle"></text></g>' +
        [0, 1, 2, 3, 4].map(function () { return '<g class="vo-b" opacity="0"><circle r="5.5" fill="#F97316" stroke="#FEF08A" stroke-width="1.2"/><circle r="2.4" fill="#FEF08A"/></g>'; }).join('') +
        '<g class="vo-ct"><text class="vo-cl" x="30" y="216" text-anchor="middle">0</text><text class="vo-cr" x="290" y="216" text-anchor="middle">0</text>' +
        '<text class="vo-lb" x="30" y="228" text-anchor="middle">' + K.esc(l.left) + '</text><text class="vo-lb" x="290" y="228" text-anchor="middle">' + K.esc(l.right) + '</text></g>' + banner(24);
      return h;
    },
    board: function (uid, l, oddTxt, o) {
      return ['v0', 'v1', 'v2', 'v3'].map(function (s, i) { return btn(s, lab(['1–3', '4–6', '7–9', '10'][i]) + '<i>' + K.esc(l.power) + '</i>' + odd(s, oddTxt, o), 'vo-k' + (i === 3 ? ' mg' : '')); }).join('') +
        btn('left', lab('◀ ' + l.left) + odd('left', oddTxt, o), 'x2') + btn('right', lab(l.right + ' ▶') + odd('right', oddTxt, o), 'x2');
    },
    hist: function (n) { return chipS(n, n >= 10 ? 'voh3' : n >= 7 ? 'voh2' : n >= 4 ? 'voh1' : 'voh0'); },
    wins: function (res) { var n = +res.n, b = (res.b || []).map(Number), r = b.reduce(function (a, x) { return a + x; }, 0); return ['v' + (n <= 3 ? 0 : n <= 6 ? 1 : n <= 9 ? 2 : 3), r >= 3 ? 'right' : 'left']; },
    init: function (c) {
      c.m = c.q('.vo-m'); c.col = c.q('.vo-col'); c.sm = c.q('.vo-sm'); c.p = [].slice.call(c.box.querySelectorAll('.vo-p')); c.seg = [].slice.call(c.box.querySelectorAll('.vo-seg')); c.pw = c.q('.vo-pw');
      c.b = [].slice.call(c.box.querySelectorAll('.vo-b')); c.cl = c.q('.vo-cl'); c.cr = c.q('.vo-cr'); c.lv = c.q('.vo-lv'); bnInit(c);
    },
    frame: function (c, R, t, e, res) {
      var n = res ? +res.n : 0, b = res ? (res.b || []).map(Number) : [], s = res ? +res.s || 0 : 0, i;
      var shake = res && e >= 0 && e < VO_ER + 1 ? Math.sin(e * 60) * (e < VO_ER ? e / VO_ER * 2.2 : 2.2 * (1 - (e - VO_ER))) : 0;
      sa(c.m, 'transform', 'translate(' + shake.toFixed(1) + ' 0)');
      sa(c.lv, 'opacity', (.55 + .3 * Math.sin(t * 3)).toFixed(2));
      // lava column: rises to a height set by the power, then sinks
      var hgt = 0; if (res && e >= VO_ER) { var k1 = seg(e, VO_ER, VO_ER + .6), k2 = 1 - seg(e, VO_B0 + 5 * VO_BD, VO_B0 + 5 * VO_BD + 1); hgt = eo(k1) * k2 * (14 + n * 9.2); }
      var top = 110 - hgt, wob = Math.sin(t * 20) * 2;
      sa(c.col, 'opacity', hgt > 1 ? '1' : '0'); sa(c.col, 'd', 'M166 112L' + (172 + wob).toFixed(1) + ' ' + top.toFixed(1) + 'Q180 ' + (top - 12).toFixed(1) + ' ' + (188 - wob).toFixed(1) + ' ' + top.toFixed(1) + 'L194 112Z');
      sa(c.sm, 'opacity', res && e > .2 ? '1' : '0');
      c.p.forEach(function (p, j) { var ph = ((t * .4 + j * .25) % 1); sa(p, 'transform', 'translate(' + (180 + Math.sin(j * 2 + t) * 8 + ph * 20 * (j % 2 ? 1 : -1)).toFixed(1) + ' ' + (100 - ph * 70 - (res && e > VO_ER ? hgt * .6 : 0)).toFixed(1) + ') scale(' + (.5 + ph).toFixed(2) + ')'); sa(p, 'opacity', (.55 * (1 - ph)).toFixed(2)); });
      var pw = res && e >= VO_ER ? Math.min(n, Math.ceil(seg(e, VO_ER, VO_ER + 1.4) * n)) : 0;
      c.seg.forEach(function (g, k) { cls(g, 'vo-seg' + (k < pw ? ' on' + (k >= 9 ? ' mg' : k >= 6 ? ' h' : '') : '')); });
      txt(c.pw, pw ? String(pw) : '', 30);
      var L = 0, Rt = 0;
      for (i = 0; i < 5; i++) {
        var a = VO_B0 + i * VO_BD, g = c.b[i];
        if (!res || e < a) { sa(g, 'opacity', '0'); continue; }
        var right = !!b[i], tx = right ? 226 + hs(s, 1500 + i) * 100 : 26 + hs(s, 1500 + i) * 100, u = seg(e, a, a + 1.1);
        var x = lerp(180, tx, u), y = lerp(108, 194, u) - Math.sin(Math.PI * u) * (60 + n * 6);
        sa(g, 'opacity', u >= 1 && e > a + 2.4 ? '.5' : '1'); sa(g, 'transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (u >= 1 ? 1.3 : 1) + ' ' + (u >= 1 ? .6 : 1) + ')');
        if (u >= 1) { if (right) Rt++; else L++; }
      }
      txt(c.cl, String(L)); txt(c.cr, String(Rt));
      if (!res) { if (!bnCd(c, R, t, e)) bnSet(c, ''); return; }
      var fin = e >= VO_B0 + 4 * VO_BD + 1.2;
      bnSet(c, fin ? c.l.power + ' ' + n + ' · ' + (Rt >= 3 ? c.l.right : c.l.left) : '', 'n0');
    }
  });
})(window.D6 = window.D6 || {});
