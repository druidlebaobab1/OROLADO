/* v2900 — "You're in control" group 9 (owner request, round 5 games: racing & reflexes) — KART DASH, DESERT RALLY, ROOFTOP NINJA and LAVA ESCAPE.
   Original names and drawings. MIXED MODE like every "You're in control" game: the multiplier follows the SERVER clock
   (×e^(rate·s), casino_ext.php 'skill', casino_ext/skill9.php rate 0.03 → ×2 after ~23 s), the gold button cashes out, a mistake
   loses (K.multi 'fail'), and the server's secret end arrives as an unavoidable event. ONE gesture per game, canvas 2D,
   sprites pre-drawn once per size, DPR ≤ 2, one RAF, pauses when hidden. Same engine as js/games/skill8.js (copied: each
   module file stands alone) + a "hold" gesture (finger down / up, Space on PC). This file only draws: the server decides and pays. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit;
  if (!K) return;
  var $ = K.$, TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ texts (12 languages) */
  var C = {
    en: { go: 'Place a bet to start', bet: 'Bet', cash: 'Cash out', won: 'Cashed out', r1: 'Bet and play: the multiplier grows while you play.', r3: 'The round can also end at any random moment (like Aviator): cash out before!' },
    fr: { go: 'Placez une mise pour commencer', bet: 'Miser', cash: 'Encaisser', won: 'Encaissé', r1: 'Mise et joue : le multiplicateur monte pendant que tu joues.', r3: 'La partie peut aussi s’arrêter à tout moment, au hasard (comme Aviator) : encaisse avant !' },
    es: { go: 'Haz una apuesta para empezar', bet: 'Apostar', cash: 'Retirar', won: 'Retirado', r1: 'Apuesta y juega: el multiplicador sube mientras juegas.', r3: 'La ronda también puede terminar en cualquier momento al azar (como Aviator): ¡retira antes!' },
    pt: { go: 'Faça uma aposta para começar', bet: 'Apostar', cash: 'Sacar', won: 'Sacado', r1: 'Aposte e jogue: o multiplicador sobe enquanto você joga.', r3: 'A rodada também pode terminar a qualquer momento, ao acaso (como no Aviator): saque antes!' },
    ar: { go: 'ضع رهانًا للبدء', bet: 'راهن', cash: 'اسحب', won: 'تم السحب', r1: 'راهن والعب: يرتفع المضاعف أثناء لعبك.', r3: 'قد تنتهي الجولة أيضًا في أي لحظة عشوائية (مثل Aviator): اسحب قبلها!' },
    tr: { go: 'Başlamak için bahis yapın', bet: 'Bahis', cash: 'Çek', won: 'Çekildi', r1: 'Bahis yap ve oyna: sen oynarken çarpan yükselir.', r3: 'Tur her an rastgele de bitebilir (Aviator gibi): önce çek!' },
    vi: { go: 'Đặt cược để bắt đầu', bet: 'Cược', cash: 'Rút tiền', won: 'Đã rút', r1: 'Đặt cược và chơi: hệ số nhân tăng khi bạn chơi.', r3: 'Ván cũng có thể kết thúc ngẫu nhiên bất cứ lúc nào (như Aviator): hãy rút trước!' },
    id: { go: 'Pasang taruhan untuk mulai', bet: 'Pasang', cash: 'Tarik', won: 'Ditarik', r1: 'Pasang dan main: pengali naik selama kamu bermain.', r3: 'Ronde juga bisa berakhir kapan saja secara acak (seperti Aviator): tarik sebelumnya!' },
    ru: { go: 'Сделайте ставку, чтобы начать', bet: 'Ставка', cash: 'Забрать', won: 'Забрано', r1: 'Сделай ставку и играй: множитель растёт, пока ты играешь.', r3: 'Раунд может закончиться и в любой случайный момент (как в Aviator): забери раньше!' },
    de: { go: 'Einsatz setzen, um zu starten', bet: 'Setzen', cash: 'Auszahlen', won: 'Ausgezahlt', r1: 'Setze und spiele: Der Multiplikator steigt, während du spielst.', r3: 'Die Runde kann auch jederzeit zufällig enden (wie bei Aviator): zahle vorher aus!' },
    hi: { go: 'शुरू करने के लिए दांव लगाएँ', bet: 'दांव', cash: 'कैश आउट', won: 'कैश आउट हुआ', r1: 'दांव लगाएँ और खेलें: खेलते समय गुणक बढ़ता है।', r3: 'राउंड किसी भी समय अचानक खत्म हो सकता है (Aviator की तरह): पहले कैश आउट करें!' },
    zh: { go: '下注即可开始', bet: '下注', cash: '兑现', won: '已兑现', r1: '下注并开始：游戏进行中倍数不断上升。', r3: '回合也可能在任意随机时刻结束（如 Aviator）：请提前兑现！' }
  };
  // per game: hint (gesture), fail (mistake), end (the secret end's event), rule (step 2 of the rules), [second mistake]
  var G = {
    kartdash: {
      en: ['Drag to steer the kart', 'Crash!', 'Engine blown!', 'Your kart races on a twisting track seen from behind. Drag left or right to steer: the bends push you outward, so steer into them. Dodge the cones, crates, banana peels and slower karts. Hitting one, or the tyre wall at the edge, ends the round.'],
      fr: ['Glisse pour diriger le kart', 'Crash !', 'Moteur cassé !', 'Ton kart file sur une piste sinueuse vue de derrière. Glisse à gauche ou à droite pour diriger : les virages te poussent vers l’extérieur, braque vers l’intérieur. Évite les cônes, caisses, peaux de banane et karts plus lents. En toucher un, ou le mur de pneus au bord, termine la partie.'],
      es: ['Desliza para guiar el kart', '¡Choque!', '¡Motor roto!', 'Tu kart corre por una pista con curvas vista desde atrás. Desliza a la izquierda o derecha para girar: las curvas te empujan hacia fuera, así que gira hacia dentro. Esquiva conos, cajas, cáscaras de plátano y karts más lentos. Chocar con uno, o con el muro de neumáticos, termina la ronda.'],
      pt: ['Deslize para guiar o kart', 'Batida!', 'Motor quebrado!', 'Seu kart corre numa pista cheia de curvas vista de trás. Deslize para a esquerda ou direita: as curvas te empurram para fora, então vire para dentro. Desvie de cones, caixas, cascas de banana e karts mais lentos. Bater em um, ou no muro de pneus, encerra a rodada.'],
      ar: ['اسحب لتوجيه الكارت', 'اصطدام!', 'تعطل المحرك!', 'تتسابق عربتك على مسار متعرج تراه من الخلف. اسحب يسارًا أو يمينًا للتوجيه: المنعطفات تدفعك للخارج فانعطف للداخل. تجنب الأقماع والصناديق وقشور الموز والعربات الأبطأ. الاصطدام بأحدها أو بجدار الإطارات ينهي الجولة.'],
      tr: ['Kartı kaydırarak yönet', 'Çarptın!', 'Motor patladı!', 'Kartın arkadan görülen virajlı bir pistte yarışır. Yönlendirmek için sola ya da sağa kaydır: virajlar seni dışa iter, içe doğru dön. Konilerden, sandıklardan, muz kabuklarından ve yavaş kartlardan kaç. Birine ya da kenardaki lastik duvara çarpmak turu bitirir.'],
      vi: ['Kéo để lái xe kart', 'Va chạm!', 'Nổ máy!', 'Xe kart đua trên đường cong nhìn từ phía sau. Kéo trái hoặc phải để lái: khúc cua đẩy bạn ra ngoài, hãy lái vào trong. Né cọc, thùng, vỏ chuối và xe chậm hơn. Va vào một thứ, hoặc tường lốp ở mép đường, là kết thúc ván.'],
      id: ['Geser untuk mengemudikan gokart', 'Tabrakan!', 'Mesin meledak!', 'Gokartmu melaju di lintasan berliku dilihat dari belakang. Geser ke kiri atau kanan: tikungan mendorongmu ke luar, jadi arahkan ke dalam. Hindari kerucut, peti, kulit pisang, dan gokart yang lebih lambat. Menabrak salah satunya, atau dinding ban di tepi, mengakhiri ronde.'],
      ru: ['Веди — управляй картом', 'Авария!', 'Мотор сгорел!', 'Карт мчится по извилистой трассе, вид сзади. Веди влево или вправо: повороты выносят наружу, рули внутрь. Объезжай конусы, ящики, банановые шкурки и медленные карты. Столкновение или удар о стену из шин на краю завершает раунд.'],
      de: ['Ziehen, um das Kart zu lenken', 'Crash!', 'Motorschaden!', 'Dein Kart rast über eine kurvige Strecke, von hinten gesehen. Ziehe nach links oder rechts zum Lenken: Kurven drücken dich nach außen, lenke also hinein. Weiche Hütchen, Kisten, Bananenschalen und langsameren Karts aus. Ein Treffer oder die Reifenwand am Rand beendet die Runde.'],
      hi: ['कार्ट चलाने को खींचें', 'टक्कर!', 'इंजन फट गया!', 'आपका कार्ट घुमावदार ट्रैक पर दौड़ता है, पीछे से दिखता है। चलाने के लिए बाएँ या दाएँ खींचें: मोड़ बाहर धकेलते हैं, इसलिए अंदर की ओर मोड़ें। कोन, बक्सों, केले के छिलकों और धीमे कार्ट से बचें। किसी से या किनारे की टायर दीवार से टकराए तो राउंड खत्म।'],
      zh: ['拖动驾驶卡丁车', '撞上了！', '引擎爆了！', '你的卡丁车在弯道众多的赛道上飞驰（后方视角）。左右拖动转向：弯道会把你甩向外侧，要往内侧打方向。避开路锥、木箱、香蕉皮和较慢的卡丁车。撞上任何一个或撞上边缘的轮胎墙，本回合结束。']
    },
    desertrally: {
      en: ['Hold for gas, release to coast', 'Flipped over!', 'Sandstorm!', 'Your rally truck crosses the dunes. Hold your finger down for gas (in the air, gas lifts the nose), release to coast (in the air, the nose drops). Land on your wheels and grab the fuel cans before the tank is empty. Landing on the roof, or running out of fuel, ends the round.', 'Out of fuel!'],
      fr: ['Maintiens pour accélérer, lâche pour rouler', 'Sur le toit !', 'Tempête de sable !', 'Ton camion de rallye traverse les dunes. Garde le doigt posé pour accélérer (en l’air, l’accélérateur lève le nez), lâche pour rouler en roue libre (en l’air, le nez plonge). Retombe sur tes roues et attrape les bidons d’essence avant que le réservoir soit vide. Atterrir sur le toit, ou tomber en panne d’essence, termine la partie.', 'Panne d’essence !'],
      es: ['Mantén para acelerar, suelta para rodar', '¡Volcaste!', '¡Tormenta de arena!', 'Tu camión de rally cruza las dunas. Mantén el dedo para acelerar (en el aire, el gas levanta el morro) y suelta para rodar (en el aire, el morro baja). Cae sobre las ruedas y recoge los bidones antes de vaciar el depósito. Caer sobre el techo, o quedarte sin gasolina, termina la ronda.', '¡Sin gasolina!'],
      pt: ['Segure para acelerar, solte para rolar', 'Capotou!', 'Tempestade de areia!', 'Seu caminhão de rali cruza as dunas. Segure o dedo para acelerar (no ar, o acelerador levanta o bico) e solte para rolar (no ar, o bico desce). Caia sobre as rodas e pegue os galões antes de o tanque esvaziar. Cair de capota, ou ficar sem combustível, encerra a rodada.', 'Sem combustível!'],
      ar: ['اضغط للتسارع وأفلت للانطلاق الحر', 'انقلبت!', 'عاصفة رملية!', 'تعبر شاحنة الرالي الكثبان. أبقِ إصبعك مضغوطًا للتسارع (في الهواء يرفع الوقود المقدمة) وأفلت للسير الحر (في الهواء تنخفض المقدمة). اهبط على العجلات واجمع عبوات الوقود قبل أن يفرغ الخزان. الهبوط على السقف أو نفاد الوقود ينهي الجولة.', 'نفد الوقود!'],
      tr: ['Gaz için bas, serbest için bırak', 'Takla attın!', 'Kum fırtınası!', 'Ralli kamyonun kum tepelerini aşar. Gaz için parmağını basılı tut (havada gaz burnu kaldırır), serbest gitmek için bırak (havada burun düşer). Tekerleklerin üstüne in ve depo boşalmadan yakıt bidonlarını topla. Tavan üstü inmek ya da yakıtın bitmesi turu bitirir.', 'Yakıt bitti!'],
      vi: ['Giữ để tăng ga, thả để trôi', 'Lật xe!', 'Bão cát!', 'Xe tải rally vượt qua các đụn cát. Giữ ngón tay để tăng ga (trên không, ga làm đầu xe ngóc lên), thả ra để trôi (trên không, đầu xe chúc xuống). Đáp bằng bánh xe và nhặt can xăng trước khi hết bình. Đáp ngửa mui, hoặc hết xăng, là kết thúc ván.', 'Hết xăng!'],
      id: ['Tahan untuk gas, lepas untuk meluncur', 'Terbalik!', 'Badai pasir!', 'Truk relimu melintasi bukit pasir. Tahan jarimu untuk gas (di udara, gas mengangkat moncong), lepas untuk meluncur (di udara, moncong turun). Mendaratlah di roda dan ambil jeriken bensin sebelum tangki kosong. Mendarat terbalik, atau kehabisan bensin, mengakhiri ronde.', 'Bensin habis!'],
      ru: ['Держи — газ, отпусти — накат', 'Перевернулся!', 'Песчаная буря!', 'Раллийный грузовик мчится по дюнам. Держи палец — газ (в воздухе газ поднимает нос), отпусти — накат (в воздухе нос опускается). Приземляйся на колёса и собирай канистры, пока бак не опустел. Приземление на крышу или пустой бак завершает раунд.', 'Кончилось топливо!'],
      de: ['Halten für Gas, loslassen zum Rollen', 'Überschlagen!', 'Sandsturm!', 'Dein Rallye-Truck fährt über die Dünen. Halte den Finger gedrückt für Gas (in der Luft hebt Gas die Nase), lass los zum Rollen (in der Luft sinkt die Nase). Lande auf den Rädern und sammle die Kanister, bevor der Tank leer ist. Auf dem Dach landen oder leerer Tank beendet die Runde.', 'Tank leer!'],
      hi: ['गैस को दबाएँ, छोड़ें तो लुढ़के', 'पलट गए!', 'रेतीला तूफ़ान!', 'आपका रैली ट्रक रेत के टीलों को पार करता है। गैस के लिए उँगली दबाए रखें (हवा में गैस आगे का हिस्सा उठाती है), छोड़ें तो लुढ़के (हवा में आगे का हिस्सा झुकता है)। पहियों पर उतरें और टंकी खाली होने से पहले ईंधन के डिब्बे लें। छत के बल उतरना या ईंधन खत्म होना राउंड खत्म करता है।', 'ईंधन खत्म!'],
      zh: ['按住加油，松开滑行', '翻车了！', '沙尘暴！', '你的拉力卡车穿越沙丘。按住手指加油（空中加油会抬起车头），松开滑行（空中车头下沉）。用车轮着地，并在油箱见底前拿到油桶。车顶着地或燃油耗尽，本回合结束。', '没油了！']
    },
    rooftopninja: {
      en: ['Tap to leap to the other wall', 'Spiked!', 'Spotted by a drone!', 'Your ninja runs up between two skyscrapers. Tap to leap to the other wall. Spikes stick out of the walls: always be on the other side when you reach them. The climb gets faster and the spikes closer together. Touching a spike ends the round.'],
      fr: ['Touche pour bondir sur l’autre mur', 'Piqué !', 'Repéré par un drone !', 'Ton ninja grimpe en courant entre deux gratte-ciel. Touche pour bondir sur l’autre mur. Des pics sortent des murs : sois toujours de l’autre côté quand tu les atteins. La montée accélère et les pics se rapprochent. Toucher un pic termine la partie.'],
      es: ['Toca para saltar a la otra pared', '¡Pinchado!', '¡Te vio un dron!', 'Tu ninja sube corriendo entre dos rascacielos. Toca para saltar a la otra pared. De las paredes salen pinchos: estate siempre del otro lado al llegar a ellos. La subida se acelera y los pinchos se acercan. Tocar un pincho termina la ronda.'],
      pt: ['Toque para saltar para a outra parede', 'Espetado!', 'Visto por um drone!', 'Seu ninja sobe correndo entre dois arranha-céus. Toque para saltar para a outra parede. Espetos saem das paredes: esteja sempre do outro lado quando chegar neles. A subida acelera e os espetos ficam mais próximos. Tocar num espeto encerra a rodada.'],
      ar: ['المس للقفز إلى الجدار الآخر', 'أصابتك الأشواك!', 'رصدتك طائرة مسيّرة!', 'يركض النينجا صاعدًا بين ناطحتي سحاب. المس للقفز إلى الجدار الآخر. تبرز أشواك من الجدران: كن دائمًا في الجهة الأخرى عند الوصول إليها. يتسارع الصعود وتقترب الأشواك. لمس شوكة ينهي الجولة.'],
      tr: ['Diğer duvara atlamak için dokun', 'Dikene takıldın!', 'Drone fark etti!', 'Ninjan iki gökdelen arasında koşarak tırmanır. Diğer duvara atlamak için dokun. Duvarlardan dikenler çıkar: onlara geldiğinde hep diğer tarafta ol. Tırmanış hızlanır, dikenler sıklaşır. Bir dikene değmek turu bitirir.'],
      vi: ['Chạm để nhảy sang tường bên kia', 'Dính gai!', 'Bị drone phát hiện!', 'Ninja chạy lên giữa hai tòa nhà chọc trời. Chạm để nhảy sang tường bên kia. Gai nhô ra từ tường: luôn ở phía bên kia khi tới chỗ chúng. Leo ngày càng nhanh và gai càng dày. Chạm gai là kết thúc ván.'],
      id: ['Ketuk untuk melompat ke dinding lain', 'Kena duri!', 'Ketahuan drone!', 'Ninjamu berlari naik di antara dua gedung pencakar langit. Ketuk untuk melompat ke dinding seberang. Duri mencuat dari dinding: selalu berada di sisi lain saat mencapainya. Pendakian makin cepat dan durinya makin rapat. Menyentuh duri mengakhiri ronde.'],
      ru: ['Тап — прыжок на другую стену', 'Шипы!', 'Заметил дрон!', 'Ниндзя бежит вверх между двумя небоскрёбами. Нажимай, чтобы перепрыгнуть на другую стену. Из стен торчат шипы: будь на другой стороне, когда добежишь до них. Подъём ускоряется, шипы всё ближе. Касание шипа завершает раунд.'],
      de: ['Tippen zum Sprung an die andere Wand', 'Aufgespießt!', 'Von einer Drohne entdeckt!', 'Dein Ninja rennt zwischen zwei Wolkenkratzern nach oben. Tippe, um an die andere Wand zu springen. Stacheln ragen aus den Wänden: sei immer auf der anderen Seite, wenn du sie erreichst. Der Aufstieg wird schneller, die Stacheln dichter. Ein Stachel beendet die Runde.'],
      hi: ['दूसरी दीवार पर कूदने को टैप करें', 'काँटे लग गए!', 'ड्रोन ने देख लिया!', 'आपका निंजा दो गगनचुंबी इमारतों के बीच ऊपर दौड़ता है। दूसरी दीवार पर कूदने के लिए टैप करें। दीवारों से काँटे निकले हैं: उन तक पहुँचते समय हमेशा दूसरी तरफ़ रहें। चढ़ाई तेज़ होती है और काँटे पास-पास आते हैं। काँटा छूने पर राउंड खत्म।'],
      zh: ['点击跳到另一面墙', '被尖刺扎到了！', '被无人机发现了！', '你的忍者在两座摩天大楼之间向上奔跑。点击跳到另一面墙。墙上伸出尖刺：到达尖刺时一定要在另一侧。攀爬越来越快，尖刺越来越密。碰到尖刺，本回合结束。']
    },
    lavaescape: {
      en: ['Tap to jump to the ledge above', 'Missed the ledge!', 'Eruption!', 'Lava rises in the volcano. Tap to jump straight up to the rock ledge above: it slides from side to side, so jump when it will be over you. Ledges get narrower and faster, and the lava rises quicker. Missing a ledge, or letting the lava reach you, ends the round.', 'Burnt by the lava!'],
      fr: ['Touche pour sauter sur la corniche au-dessus', 'Corniche ratée !', 'Éruption !', 'La lave monte dans le volcan. Touche pour sauter tout droit sur la corniche au-dessus : elle glisse de gauche à droite, saute donc quand elle sera au-dessus de toi. Les corniches rétrécissent et accélèrent, la lave monte plus vite. Rater une corniche, ou laisser la lave t’atteindre, termine la partie.', 'Brûlé par la lave !'],
      es: ['Toca para saltar a la cornisa de arriba', '¡Fallaste la cornisa!', '¡Erupción!', 'La lava sube en el volcán. Toca para saltar recto a la cornisa de arriba: se desliza de lado a lado, así que salta cuando vaya a estar sobre ti. Las cornisas se estrechan y aceleran, y la lava sube más rápido. Fallar una cornisa, o dejar que la lava te alcance, termina la ronda.', '¡Quemado por la lava!'],
      pt: ['Toque para pular na saliência acima', 'Errou a saliência!', 'Erupção!', 'A lava sobe no vulcão. Toque para pular reto na saliência de rocha acima: ela desliza de um lado para o outro, então pule quando ela estiver sobre você. As saliências ficam mais estreitas e rápidas, e a lava sobe mais depressa. Errar uma saliência, ou deixar a lava te alcançar, encerra a rodada.', 'Queimado pela lava!'],
      ar: ['المس للقفز إلى الحافة العلوية', 'فاتتك الحافة!', 'ثوران!', 'ترتفع الحمم في البركان. المس للقفز مباشرة إلى الحافة الصخرية في الأعلى: تنزلق يمينًا ويسارًا فاقفز عندما تكون فوقك. تضيق الحواف وتتسارع وترتفع الحمم أسرع. تفويت حافة أو وصول الحمم إليك ينهي الجولة.', 'احترقت بالحمم!'],
      tr: ['Üstteki çıkıntıya zıplamak için dokun', 'Çıkıntıyı kaçırdın!', 'Patlama!', 'Yanardağda lav yükseliyor. Üstteki kaya çıkıntısına dümdüz zıplamak için dokun: sağa sola kayar, tam üstüne geleceği an zıpla. Çıkıntılar daralır ve hızlanır, lav daha hızlı yükselir. Bir çıkıntıyı kaçırmak ya da lavın sana ulaşması turu bitirir.', 'Lavda yandın!'],
      vi: ['Chạm để nhảy lên gờ đá phía trên', 'Trượt gờ đá!', 'Phun trào!', 'Dung nham dâng lên trong núi lửa. Chạm để nhảy thẳng lên gờ đá phía trên: nó trượt qua lại, hãy nhảy khi nó sắp ở trên bạn. Gờ đá hẹp và nhanh dần, dung nham dâng nhanh hơn. Trượt gờ đá, hoặc để dung nham chạm tới, là kết thúc ván.', 'Bị dung nham thiêu!'],
      id: ['Ketuk untuk lompat ke tebing di atas', 'Meleset dari tebing!', 'Letusan!', 'Lava naik di dalam gunung berapi. Ketuk untuk melompat lurus ke tebing batu di atas: tebing bergeser ke kiri dan kanan, jadi lompatlah saat ia akan berada di atasmu. Tebing makin sempit dan cepat, lava naik makin cepat. Meleset dari tebing, atau tersentuh lava, mengakhiri ronde.', 'Terbakar lava!'],
      ru: ['Тап — прыжок на уступ выше', 'Мимо уступа!', 'Извержение!', 'В вулкане поднимается лава. Нажимай, чтобы прыгнуть прямо вверх на каменный уступ: он скользит из стороны в сторону, прыгай, когда он окажется над тобой. Уступы всё уже и быстрее, лава поднимается всё быстрее. Промах мимо уступа или лава под ногами завершает раунд.', 'Сгорел в лаве!'],
      de: ['Tippen zum Sprung auf den Sims darüber', 'Sims verfehlt!', 'Ausbruch!', 'Im Vulkan steigt die Lava. Tippe, um senkrecht auf den Felssims darüber zu springen: Er gleitet hin und her, spring also, wenn er über dir sein wird. Die Simse werden schmaler und schneller, die Lava steigt schneller. Einen Sims verfehlen oder von der Lava erreicht werden beendet die Runde.', 'Von der Lava verbrannt!'],
      hi: ['ऊपर की चट्टान पर कूदने को टैप करें', 'चट्टान छूट गई!', 'विस्फोट!', 'ज्वालामुखी में लावा ऊपर उठ रहा है। ऊपर की चट्टानी पट्टी पर सीधा कूदने के लिए टैप करें: वह इधर-उधर खिसकती है, इसलिए तब कूदें जब वह आपके ऊपर होगी। पट्टियाँ पतली और तेज़ होती हैं, लावा तेज़ी से उठता है। पट्टी चूकी या लावा पहुँच गया तो राउंड खत्म।', 'लावा में जल गए!'],
      zh: ['点击跳上上方的岩架', '没跳上岩架！', '火山喷发！', '火山里的岩浆不断上涨。点击直直跳上上方的岩架：岩架左右滑动，要在它移到你头顶时起跳。岩架越来越窄、越来越快，岩浆也涨得更快。没跳上岩架或被岩浆追上，本回合结束。', '被岩浆烧到了！']
    }
  };
  function L(key) {
    var lg = K.lang(), c = Object.assign({}, C.en, C[lg] || {}), g = (G[key][lg] || G[key].en);
    c.hint = g[0]; c.fail = g[1]; c.end = g[2]; c.fail2 = g[4] || g[1];
    return c;
  }
  function rules(key) {
    var o = {};
    Object.keys(C).forEach(function (lg) { var g = G[key][lg] || G[key].en; o[lg] = '1. ' + C[lg].r1 + '\n2. ' + g[3] + '\n3. ' + C[lg].r3; });
    return o;
  }

  /* ------------------------------------------------------------------ small drawing helpers */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function ease(k) { return 1 - Math.pow(1 - clamp(k, 0, 1), 3); }
  function num(v) { return Number(v).toFixed(2).replace('.', K.dec()); }
  function xm(v) { return '⁦×' + num(v) + '⁩'; }
  function money(v) { return '⁦$ ' + K.m2(v).replace('.', K.dec()) + '⁩'; }
  // pre-rendered sprite (drawn once, then drawImage: cheap on old phones)
  function mkc(w, h, dpr, fn) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * dpr)); c.height = Math.max(1, Math.ceil(h * dpr));
    var x = c.getContext('2d'); x.scale(dpr, dpr); fn(x, w, h);
    c.w = w; c.h = h;
    return c;
  }
  function lg(c, x0, y0, x1, y1, st) { var g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(function (s, i) { g.addColorStop(i / (st.length - 1), s); }); return g; }
  function rg(c, x, y, r, st, fx, fy) { var g = c.createRadialGradient(x + (fx || 0), y + (fy || 0), r * 0.05, x, y, r); st.forEach(function (s, i) { g.addColorStop(i / (st.length - 1), s); }); return g; }
  function circ(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fill(); }
  function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function stars(c, W, H, n, y0, y1) {
    y0 = y0 || 0; y1 = y1 || H;
    for (var i = 0; i < n; i++) {
      var r = Math.random(); c.globalAlpha = 0.25 + Math.random() * 0.75;
      c.fillStyle = r > 0.92 ? '#FDE68A' : r > 0.82 ? '#C4B5FD' : '#fff';
      var s = r > 0.96 ? 2 : r > 0.7 ? 1.3 : 0.9; c.fillRect(Math.random() * W, y0 + Math.random() * (y1 - y0), s, s);
    }
    c.globalAlpha = 1;
  }
  function poly(c, pts, fill) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } }
  // little sparkle star (4 points)
  function spark(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }

  /* hand hint: tap = finger; aim = finger on a target; lr = arrows left / right; drag = finger sliding; swipe4 = 4 arrows */
  var FINGER = '<path d="M11 21V9.5a2 2 0 0 1 4 0V16m0-2a2 2 0 0 1 4 0v2m0-1a2 2 0 0 1 4 0v5c0 4.5-3 8-7.5 8H14c-2.4 0-4-1-5.3-2.9L6 23a2 2 0 0 1 3.2-2.4L11 23"/>';
  var HAND = {
    tap: '<svg viewBox="0 0 32 32" aria-hidden="true">' + FINGER + '</svg>',
    aim: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="sk-tg" cx="13" cy="6" r="4.5"/><path class="sk-tg" d="M13 0v3M13 9v3M7 6h3M16 6h3"/>' + FINGER + '</svg>',
    lr: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 9l5-4v8zM31 9l-5-4v8z"/>' + FINGER + '</svg>',
    drag: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 9l5-4v8zM31 9l-5-4v8z"/>' + FINGER + '</svg>',
    hold: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="sk-rip" cx="13" cy="9" r="7"/>' + FINGER + '</svg>',
    swipe4: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 11l4.5-3.5v7zM31 11l-4.5-3.5v7zM13 0l3.5 4h-7z"/>' + FINGER + '</svg>'
  };

  /* ------------------------------------------------------------------ shared engine (round flow + canvas loop + gestures)
     A game object: size(W, H, u, dpr, top) · reset(live) · step(dt, live) · draw(ctx) · boom() (secret end) · win() ·
     act(k, x, y) for tap / aim / lr / swipe4 · down / move / up (x, y) for drag · dbg() (read by the touch tests only). */
  function boot(key, mk, gest, hy) {
    K.register(key, function (box) {
      var l = L(key), lite = document.documentElement.classList.contains('oro-lite'), hist = [];
      try { hist = JSON.parse(localStorage.getItem('cg_' + key + '_h') || '[]').slice(0, 12); } catch (e) { hist = []; }
      box.classList.add('cg-game', 'cg-s4', 'cg-' + key);
      box.style.setProperty('--hy', (hy || 0.45) * 100 + '%');
      box.innerHTML = '<div class="cg-stage s4-st idle" id="s4St"><canvas class="s4-bg" id="s4Bg"></canvas><canvas class="s4-cv" id="s4Cv"></canvas><div class="cg-hist s4-hist" id="s4Hist"></div>' +
        '<div class="s4-hud" id="s4Hud"><b class="fit s4-m idle" id="s4M">' + xm(1) + '</b><small class="fit s4-msg" id="s4Msg"></small></div>' +
        '<div class="sk-hint g-' + gest + '" id="s4Hint"><i class="sk-hand">' + HAND[gest] + '</i><small class="fit">' + K.esc(l.hint) + '</small></div></div>' + K.stakePanel(l.bet);
      K.bindStake(box);
      var st = $('s4St'), cv = $('s4Cv'), ctx = cv.getContext('2d'), btn = $('csGo'), mEl = $('s4M'), msgEl = $('s4Msg'), hud = $('s4Hud'), hintEl = $('s4Hint'), gN = 0, nudgeT = 0;
      var W = 0, H = 0, dpr = 1, rect = null, sized = false, fadeS = null, fadeH = 0, phase = 'idle', R = null, off = 0, busy = false, playT = 0, overT = 0, last = 0, drawn = false;
      var P = [], RG = [], shake = 0, flash = 0, mShown = '';
      var bgCv = $('s4Bg'), bgOn = null;
      // v2850: immersive audio (js/sfx.js amb / play, added by the audio round): harmless if the API is not there
      var ambOn = false, ambT = 0;
      var amb = function (on, k) { if (ambOn === on && !k) return; ambOn = on; try { if (D6.Sfx && D6.Sfx.amb) D6.Sfx.amb(key, on, on ? (k || 0.45) : 0); } catch (e) { /* ignore */ } };
      var sx = function (ev, o) { try { if (D6.Sfx && D6.Sfx.amb) D6.Sfx.play(ev, o || {}, key); } catch (e) { /* ignore */ } };
      var hintOn = function (on) { hintEl.classList.toggle('off', !on); st.classList.toggle('idle', phase === 'idle'); };
      var A = {
        l: l, lite: lite, sx: sx,
        // the static background lives in its own canvas behind the scene: painted once, never redrawn each frame
        bg: function (img) { if (bgOn === img) return; bgOn = img; bgCv.width = img.width; bgCv.height = img.height; bgCv.getContext('2d').drawImage(img, 0, 0); },
        lv: function () { return Math.min(1.25, playT / 110); },            // difficulty: fair at the start, really hard after ~2 min
        live: function () { return phase === 'play'; },
        idle: function () { return phase === 'idle'; },
        fail: function (why) {                                              // the player's own mistake
          if (phase !== 'play') return false;
          phase = 'failing'; sx('fail'); amb(false); say(why || l.fail, 'lost'); setBtn(l.bet, '', 'wait'); btn.disabled = true;
          sendFail(); return true;
        },
        burst: function (x, y, n, cols, sp, life, sz, grav) {
          if (phase === 'play' && !A._xb) K.sfx('hit'); // v2832 : un bon coup (fruit coupé, brique, pièce…) sonne ; jamais l'explosion d'une erreur
          if (lite) n = Math.ceil(n / 3);
          for (var i = 0; i < n; i++) {
            if (P.length > 160) P.shift();
            var a = Math.random() * TAU, s = sp * rnd(0.25, 1);
            P.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, m: (life || 0.7) * rnd(0.5, 1.2), c: cols[i % cols.length], r: (sz || 3) * rnd(0.6, 1.3), g: grav === undefined ? 40 : grav });
          }
        },
        ring: function (x, y, r, col) { RG.push({ x: x, y: y, r: r, t: 0, c: col || '#FDE68A' }); },
        explode: function (x, y, s) {
          s = s || 1;
          A._xb = 1;
          A.burst(x, y, 34, ['#FFF7ED', '#FDE68A', '#FB923C', '#F43F5E', '#C4B5FD'], 260 * s, 0.9, 3.4 * Math.sqrt(s));
          A._xb = 0;
          A.ring(x, y, 70 * s, '#FDBA74'); shake = Math.max(shake, 0.45); flash = Math.max(flash, 0.55);
        },
        shake: function (a) { shake = Math.max(shake, a); },
        flash: function (a) { flash = Math.max(flash, a); }
      };
      var g = mk(A);
      box._s4 = g; // read-only hook for the touch tests (scripts in /tmp); nothing reads it in the app

      function say(t, cls) { K.setText(msgEl, t || ''); mEl.classList.remove('won', 'lost', 'idle'); if (cls) mEl.classList.add(cls); }
      function tx(el, s) { if (el.textContent === s) return; if (el.textContent.length !== s.length) K.setText(el, s); else el.textContent = s; }
      function setBtn(main, sub, cls) {
        btn.classList.remove('cash', 'wait');
        if (cls) btn.classList.add(cls);
        if (sub) { btn.innerHTML = '<span class="fit s4-b1"></span><span class="fit s4-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
        else { btn.innerHTML = '<span class="fit cg-gol"></span>'; K.setText(btn.firstChild, main); }
      }
      function paintHist() {
        $('s4Hist').innerHTML = hist.map(function (h) { var v = Math.abs(h); return '<i class="' + (h < 0 ? 'x' : v >= 10 ? 'hi' : v >= 2 ? 'mid' : 'lo') + '">' + xm(v) + '</i>'; }).join('');
      }
      function nowS() { return Date.now() / 1000 + off; }
      function mult() { return R ? Math.max(1, Math.floor(Math.exp(R.rate * Math.max(0, nowS() - R.t0)) * 100 + 1e-9) / 100) : 1; }

      function resize() {
        if (!box.isConnected) return;
        var r = st.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
        rect = r;
        if (!w || !h || (w === W && h === H)) return;
        W = w; H = h; dpr = lite ? 1 : Math.min(2, window.devicePixelRatio || 1);
        if (W * H * dpr * dpr > 2.6e6) dpr = Math.max(1, Math.sqrt(2.6e6 / (W * H))); // TV / big screens: at most ~2.6 M pixels
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        var top = hud.offsetTop + mEl.offsetHeight + Math.max(22, msgEl.offsetHeight) + 10; // below the multiplier AND the status pill
        g.size(W, H, Math.min(W, H * 0.8) / 100, dpr, top);
        fadeH = Math.round(top * 0.8);
        fadeS = mkc(W, fadeH, dpr, function (c) { var q = c.createLinearGradient(0, 0, 0, fadeH); q.addColorStop(0, 'rgba(8,6,26,.55)'); q.addColorStop(1, 'rgba(8,6,26,0)'); c.fillStyle = q; c.fillRect(0, 0, W, fadeH); });
        if (!sized) { sized = true; if (phase === 'idle') g.reset(false); }
        drawn = false;
        frame(); // the scene appears at once (no black frame while waiting for the next animation frame)
      }
      var ro = null;
      if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(st); } else window.addEventListener('resize', resize);

      function frame(dt) {
        if (!W) return;
        dt = dt || 0;
        var moving = phase !== 'idle' || !lite;
        if (moving && dt) g.step(dt, phase === 'play' || phase === 'cashing');
        for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; p.t += dt; if (p.t >= p.m) { P.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.vy = p.vy * 0.985 + p.g * dt; }
        for (i = RG.length - 1; i >= 0; i--) { RG[i].t += dt; if (RG[i].t > 0.6) RG.splice(i, 1); }
        shake = Math.max(0, shake - dt * 1.4); flash = Math.max(0, flash - dt * 2.2);
        var sx = shake ? (Math.random() - 0.5) * 16 * shake : 0, sy = shake ? (Math.random() - 0.5) * 16 * shake : 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
        g.draw(ctx);
        if (fadeS) ctx.drawImage(fadeS, -sx, -sy, W, fadeH);
        for (i = 0; i < P.length; i++) { p = P[i]; ctx.globalAlpha = 1 - p.t / p.m; ctx.fillStyle = p.c; ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r); }
        for (i = 0; i < RG.length; i++) { var q = RG[i], k = q.t / 0.6; ctx.globalAlpha = 1 - k; ctx.strokeStyle = q.c; ctx.lineWidth = 4 * (1 - k) + 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * ease(k), 0, TAU); ctx.stroke(); }
        ctx.globalAlpha = 1;
        if (flash) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = flash * 0.8; ctx.fillStyle = '#FFF4E0'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
        drawn = true;
      }
      function loop(ts) {
        if (!box.isConnected) { if (ro) ro.disconnect(); amb(false); return; }
        K.S.raf = requestAnimationFrame(loop);
        if (document.hidden) { last = 0; return; }                      // paused while the tab is hidden
        var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
        if (!W) { resize(); if (!W) return; }
        if (lite && phase === 'idle' && drawn && !P.length) return;      // old phones: still idle scene
        if (phase === 'play') { playT += dt; ambT += dt; if (ambT > 3) { ambT = 0; amb(true, 0.4 + 0.45 * Math.min(1, playT / 110)); } }
        if (phase === 'over') { overT -= dt; if (overT <= 0) toIdle(); }
        frame(dt);
        // multiplier + cash-out amount follow the server clock
        if (phase === 'play' || phase === 'cashing') {
          var m = mult(), s = xm(m);
          if (s !== mShown) { mShown = s; tx(mEl, s); if (phase === 'play' && btn.lastChild && btn.lastChild.className === 'fit s4-b2') tx(btn.lastChild, money(R.stake * m)); }
        }
      }

      async function start() {
        if (K.guest()) { K.signup(); return; }
        if (busy) return;
        busy = true; btn.disabled = true;
        var r = await K.multi(key, 'start');
        busy = false; btn.disabled = false;
        if (!r || !box.isConnected) return;
        if (K.afterPlay) K.afterPlay(r);
        begin(r);
      }
      function begin(r) {
        if (!W) resize();
        R = r; off = (Number(r.now) || Date.now() / 1000) - Date.now() / 1000; playT = r.resume ? Math.max(0, r.now - r.t0) : 0;
        if (r.done) { result(r); return; }
        g.reset(true); P.length = 0; RG.length = 0; gs = null;
        phase = 'play'; mShown = ''; gN = 0; box.setAttribute('data-gn', '0'); say('', ''); hintOn(false); // the hint leaves as soon as the round starts
        btn.classList.remove('sk-nudge'); st.querySelectorAll('.cs-toast').forEach(function (t) { t.remove(); });
        setBtn(l.cash, money(r.stake * mult()), 'cash'); ambT = 0; amb(true, 0.4);
        poll();
      }
      function poll() {
        clearTimeout(K.S.timer);
        K.S.timer = setTimeout(async function () {
          if (!box.isConnected || phase !== 'play') return;
          var ref = R && R.ref, r = await K.multi(key, 'state', null, true);
          if (!box.isConnected || phase !== 'play' || !R || R.ref !== ref) return;
          if (r && r.ref && r.ref !== ref) { poll(); return; }
          if (r && r.now) off = r.now - Date.now() / 1000;
          if (r && r.done) { ended(r); return; }
          poll();
        }, 700);
      }
      // the server's secret moment came: an unavoidable event, then the loss
      function ended(r) {
        phase = 'over'; overT = 99; btn.disabled = true; hintOn(false); gs = null;
        g.boom(); sx('boom'); amb(false); say(l.end, 'lost'); setBtn(l.bet, '', 'wait');
        setTimeout(function () { if (box.isConnected) result(r); }, 1500);
      }
      async function sendFail(n) {
        n = n || 0;
        var ref = R && R.ref, r = await K.multi(key, n % 2 ? 'state' : 'fail', null, true); // network trouble: alternate fail / state
        if (!box.isConnected || !R || R.ref !== ref) return;
        if (r && r.ref && r.ref !== ref) r = null;
        if (r && !r.done) { if (n % 2) r = null; }
        if (!r) {
          if (n >= 9) { phase = 'over'; overT = 1; btn.disabled = false; setBtn(l.bet); R = null; return; } // give up waiting: the server settles it anyway
          clearTimeout(K.S.timer); K.S.timer = setTimeout(function () { sendFail(n + 1); }, 1200); return;
        }
        setTimeout(function () { if (box.isConnected) result(r); }, 650);
      }
      async function cash() {
        if (phase !== 'play') return;
        phase = 'cashing'; btn.disabled = true; clearTimeout(K.S.timer);
        var r = await K.multi(key, 'cash');
        btn.disabled = false;
        if (!box.isConnected) return;
        if (!r) { if (phase === 'cashing') { phase = 'play'; poll(); } return; }
        if ((Number(r.win) || 0) > 0) { amb(false); sx('cashout'); if (g.win) g.win(); say(l.won + ' ' + xm(r.out), 'won'); tx(mEl, xm(r.out)); result(r); }
        else ended(r);
      }
      function result(r) {
        phase = 'over'; overT = 3.2; clearTimeout(K.S.timer); hintOn(false); gs = null; amb(false);
        btn.disabled = true; setTimeout(function () { if (box.isConnected) btn.disabled = false; }, 900); // a late "cash out" tap never places a new bet
        var won = (Number(r.win) || 0) > 0, v = won ? Number(r.out) || mult() : (r.why === 'end' && r.c ? Number(r.c) : mult());
        if (!won) tx(mEl, xm(Math.max(1, v)));
        hist.unshift(won ? v : -Math.max(1, v)); hist = hist.slice(0, 12);
        try { localStorage.setItem('cg_' + key + '_h', JSON.stringify(hist)); } catch (e) { /* ignore */ }
        paintHist(); setBtn(l.bet); R = null;
        K.resultLine(box, r);
      }
      function toIdle() { phase = 'idle'; g.reset(false); say('', 'idle'); tx(mEl, xm(1)); mShown = ''; drawn = false; hintOn(true); }

      /* ---- gestures on the WHOLE scene. tap / aim: act on the touch itself; lr / swipe4: a swipe acts as soon as the finger
         has moved ~16 px (no wait for the release), a short touch without movement = the left / right half; drag: the game
         follows the finger. No ripple: the game itself answers. ---- */
      function pt(e) { var r = rect || st.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      function nudge() { // touching the scene before betting: the BET button pulses + one clear line
        if (K.guest()) return;
        say(l.go, 'idle'); btn.classList.remove('sk-nudge'); void btn.offsetWidth; btn.classList.add('sk-nudge');
        clearTimeout(nudgeT); nudgeT = setTimeout(function () { if (!box.isConnected) return; btn.classList.remove('sk-nudge'); if (phase === 'idle') say('', 'idle'); }, 1800);
      }
      function count() { gN++; box.setAttribute('data-gn', String(gN)); }
      function did(what, x, y) { if (phase !== 'play') return; count(); K.sfx('act'); g.act(what, x, y); }
      var gs = null, drg = gest === 'drag' || gest === 'hold';
      cv.addEventListener('pointerdown', function (e) {
        e.preventDefault(); rect = st.getBoundingClientRect();
        if (e.pointerType === 'mouse' && e.button) return;
        if (phase !== 'play') { if (phase === 'idle') nudge(); return; }
        try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        var p = pt(e);
        if (gest === 'tap' || gest === 'aim') { did('tap', p[0], p[1]); gs = null; return; } // one-tap games act on the touch itself
        if (drg) { count(); gs = { id: e.pointerId }; g.down(p[0], p[1]); return; }
        gs = { x: p[0], y: p[1], id: e.pointerId, done: false };
      });
      cv.addEventListener('pointermove', function (e) {
        if (!gs || e.pointerId !== gs.id) return;
        if (drg) {
          if (phase !== 'play') { if (g.up) g.up(); gs = null; return; }
          if (!g.move) return;
          var ev = e.getCoalescedEvents ? e.getCoalescedEvents() : null; if (!ev || !ev.length) ev = [e];
          var q = pt(ev[ev.length - 1]); g.move(q[0], q[1]); return;
        }
        if (gs.done) return;
        var p = pt(e), dx = p[0] - gs.x, dy = p[1] - gs.y, th = Math.max(14, Math.min(W, H) * 0.04);
        if (Math.abs(dx) < th && Math.abs(dy) < th) return;
        gs.done = true;
        if (gest === 'lr' && Math.abs(dy) > Math.abs(dx)) { gs.done = false; gs.x = p[0]; gs.y = p[1]; return; } // vertical slip: wait
        did(Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'), p[0], p[1]);
      });
      var up = function (e) {
        if (!gs || e.pointerId !== gs.id) return;
        var s = gs; gs = null;
        if (drg) { if (g.up) g.up(); return; }
        if (!s.done && gest === 'lr') did(s.x < W / 2 ? 'left' : 'right', s.x, s.y); // a tap on the left / right half
        else if (!s.done && gest === 'swipe4') did('tap', s.x, s.y); // v2850: a short touch without movement = tap (rotate, …)
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', function () { if (gs && drg && g.up) g.up(); gs = null; });
      cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      // iOS Safari: no page scroll, no double-tap zoom, no long-press magnifier / callout on the scene
      var stopT = function (e) { if (e.cancelable) e.preventDefault(); };
      ['touchstart', 'touchmove', 'touchend'].forEach(function (ev) { st.addEventListener(ev, stopT, { passive: false }); });
      // keyboard (PC / TV remote): arrows, WASD, Space
      var KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', q: 'left', z: 'up', ' ': 'up' };
      var onKey = function (e) {
        if (!box.isConnected) { document.removeEventListener('keydown', onKey); return; }
        if (phase !== 'play' || (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return;
        var k = KEYS[e.key] || KEYS[String(e.key || '').toLowerCase()];
        if (!k || (e.repeat && gest !== 'drag')) return;
        e.preventDefault();
        if (gest === 'hold') { if (!e.repeat && (k === 'up' || k === 'down')) { count(); kHeld = true; g.down(W / 2, H / 2); } return; }
        if (gest === 'drag') { if (g.key) { count(); g.key(k); } return; }
        if (gest === 'aim') { if (g.key) { count(); g.key(k); } return; }
        did(gest === 'tap' ? 'tap' : k, W / 2, H / 2);
      };
      document.addEventListener('keydown', onKey);
      // hold games (PC / TV): Space / ↑ held = finger down, released = finger up
      var kHeld = false, onKeyUp = function (e) {
        if (!box.isConnected) { document.removeEventListener('keyup', onKeyUp); return; }
        if (!kHeld) return; kHeld = false; if (g.up) g.up();
      };
      if (gest === 'hold') document.addEventListener('keyup', onKeyUp);
      btn.addEventListener('click', function () {
        try { btn.blur(); } catch (e) { /* ignore */ } // Space = jump, never a second click on this button
        if (phase === 'play') cash();
        else if (phase === 'idle' || phase === 'over') { if (phase === 'over') toIdle(); start(); }
      });

      paintHist(); setBtn(l.bet); say('', 'idle'); hintOn(true);
      resize(); // draws the idle scene right away
      cancelAnimationFrame(K.S.raf || 0); K.S.raf = requestAnimationFrame(loop);
      // a round still running (page reloaded, game reopened): pick it up
      if (!K.guest()) K.multi(key, 'state', null, true).then(function (r) { if (r && !r.done && r.t0 && box.isConnected && phase === 'idle') { r.resume = 1; requestAnimationFrame(function () { begin(r); }); } });
    }, { rules: rules(key) });
  }


  /* ------------------------------------------------------------------ shared drawing for the racing games */
  function boomFx(A, x, y, s) { A.explode(x, y, s); A.sx('boom', { v: Math.min(1, s) }); }
  function limb(c, x0, y0, x1, y1, w0, w1, col) { // tapered limb with rounded ends
    var a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
    c.fillStyle = col; c.beginPath();
    c.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); c.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); c.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); c.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); c.closePath(); c.fill();
    circ(c, x0, y0, w0 / 2, col); circ(c, x1, y1, w1 / 2, col);
  }
  function puff(A, x, y, n, cols, sp, life, sz, grav) { A._xb = 1; A.burst(x, y, n, cols, sp, life, sz, grav); A._xb = 0; } // particles without the 'hit' sound
  function sdpr() { return document.documentElement.classList.contains('oro-lite') ? 1 : Math.min(2, window.devicePixelRatio || 1); }
  // a person from js/art-rig.js (pre-drawn once), feet at the bottom centre of a 1.2h × 1.12h sprite; null when the rig is missing
  function rigOne(h, o) {
    if (!D6.Rig) return null;
    return mkc(h * 1.2, h * 1.12, sdpr(), function (c) { c.translate(h * 0.6, h * 1.08); D6.Rig.draw(c, h, o); });
  }
  // a horizontal strip (pre-drawn, w wide) repeated to cover the screen, scrolled by off (parallax)
  function tile(c, img, off, y, W, h) {
    var w = img.w, x = -(((off % w) + w) % w);
    for (; x < W; x += w) c.drawImage(img, x, y, w + 1, h || img.h);
  }
  // a glossy helmet (side view, facing right) centred at (x, y), radius r
  function helmet(c, x, y, r, col, dark) {
    circ(c, x, y, r, rg(c, x - r * 0.35, y - r * 0.4, r * 1.1, ['#FFFFFF', col, dark]));
    c.fillStyle = lg(c, x, y - r * 0.3, x + r, y + r * 0.2, ['#0F172A', '#334155', '#0B1020']);
    c.beginPath(); c.moveTo(x + r * 0.1, y - r * 0.28); c.quadraticCurveTo(x + r * 1.05, y - r * 0.3, x + r * 0.98, y + r * 0.22); c.lineTo(x + r * 0.2, y + r * 0.18); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.5, r * 0.32, r * 0.14, -0.5, 0, TAU); c.fill();
  }
  // a wheel with tyre, rim and spokes turned by angle a
  function wheel(c, x, y, r, a, rim) {
    circ(c, x, y, r, '#0B0B10');
    c.strokeStyle = '#27272A'; c.lineWidth = r * 0.12; c.beginPath(); c.arc(x, y, r * 0.86, 0, TAU); c.stroke();
    circ(c, x, y, r * 0.66, rim || '#A1A1AA'); circ(c, x, y, r * 0.54, '#18181B');
    c.strokeStyle = rim || '#D4D4D8'; c.lineWidth = Math.max(1.2, r * 0.08); c.beginPath();
    for (var i = 0; i < 5; i++) { var q = a + i * TAU / 5; c.moveTo(x, y); c.lineTo(x + Math.cos(q) * r * 0.56, y + Math.sin(q) * r * 0.56); }
    c.stroke(); circ(c, x, y, r * 0.16, '#E4E4E7');
  }
  // soft ground shadow
  function shadow(c, x, y, w, h, a) { c.fillStyle = 'rgba(0,0,0,' + (a || 0.3) + ')'; c.beginPath(); c.ellipse(x, y, Math.max(1, w), Math.max(1, h), 0, 0, TAU); c.fill(); }
  // speed lines (cheap): n thin streaks moving left
  function streaks(c, W, y0, y1, t, n, sp, col) {
    c.strokeStyle = col || 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.beginPath();
    for (var i = 0; i < n; i++) { var yy = y0 + (y1 - y0) * ((i * 0.618) % 1), xx = W - ((t * sp * (0.7 + (i % 3) * 0.3) + i * 97) % (W + 80)); c.moveTo(xx, yy); c.lineTo(xx + 30 + (i % 4) * 12, yy); }
    c.stroke();
  }

  /* ================================================================== 9. KART DASH — a pseudo-3D track seen from behind (road made of
     projected segments). Drag left / right; the bends push the kart outward. Cones, crates, peels and slower karts. */
  boot('kartdash', function (A) {
    var W, H, T, dpr, bg, hills, kart, sprC = {}, hor, Kh, Ks, NS = 64, segs = [], z = 0, sp = 0, px = 0, tx = 0, camX = 0, t = 0, dead = null, won = 0, smoke = null, drag = null, cur = 0, curT = 0, curN = 0, sky = 0, ZK = 1.35, bump = 0, lv0 = 0;
    function newSeg(live) {
      var lv = live ? A.lv() : 0.3, i = segs.length ? segs[segs.length - 1].i + 1 : 0;
      if (curN <= 0) { curN = Math.floor(rnd(20, 50)); curT = Math.random() < 0.35 ? 0 : (Math.random() < 0.5 ? -1 : 1) * rnd(0.012, 0.024 + lv * 0.01); }
      curN--; cur += (curT - cur) * 0.08;
      var s = { i: i, c: cur, o: null };
      if (i > 30 && i % 6 === 0 && Math.random() < 0.42 + lv * 0.25) { var k = pick(['cone', 'crate', 'peel', 'kart', 'cone']); s.o = { k: k, x: pick([-0.62, 0, 0.62]) + rnd(-0.12, 0.12), dz: 0 }; }
      segs.push(s);
    }
    function reset(live) { segs = []; cur = 0; curN = 30; curT = 0; for (var i = 0; i < 260; i++) newSeg(live); z = 0; sp = 9; px = tx = 0; camX = 0; dead = null; won = 0; smoke = null; drag = null; bump = 0; }
    function segAt(n) { return segs[Math.floor(z) + n]; }
    function best() { // autopilot: lane away from what is coming, against the push of the bend
      var lanes = [-0.62, 0, 0.62], bx = 0, bs = -1e9;
      lanes.forEach(function (L) { var m = 0; for (var n = 1; n < 26; n++) { var s = segAt(n); if (s && s.o && Math.abs(s.o.x - L) < 0.45) m -= 30 - n; } m -= Math.abs(L - px) * 2; if (m > bs) { bs = m; bx = L; } });
      var s0 = segAt(2); return bx + (s0 ? s0.c * 4 : 0);
    }
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; hor = T + (H - T) * 0.32; Kh = (H - hor) * 1.05; Ks = W * 0.62;
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, hor, ['#1D4ED8', '#60A5FA', '#BFDBFE']); c.fillRect(0, 0, W, hor + 2);
          for (var i = 0; i < 4; i++) { var cx2 = W * (0.1 + i * 0.28), cy = T + (hor - T) * (0.3 + (i % 2) * 0.2); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(cx2, cy, W * 0.07, W * 0.022, 0, 0, TAU); c.ellipse(cx2 + W * 0.035, cy - W * 0.014, W * 0.045, W * 0.02, 0, 0, TAU); c.fill(); }
          c.fillStyle = '#16A34A'; c.fillRect(0, hor, W, H - hor);
        });
        var hw = Math.max(W, 600) * 1.5, hh2 = (hor - T) * 0.5;
        hills = mkc(hw, hh2, dpr, function (c) { c.fillStyle = '#15803D'; c.beginPath(); c.moveTo(0, hh2); for (var x = 0; x <= hw; x += 8) c.lineTo(x, hh2 * (0.35 + 0.25 * Math.sin(x / hw * TAU * 3) + 0.15 * Math.sin(x / hw * TAU * 7))); c.lineTo(hw, hh2); c.fill(); c.fillStyle = '#166534'; c.beginPath(); c.moveTo(0, hh2); for (x = 0; x <= hw; x += 8) c.lineTo(x, hh2 * (0.65 + 0.18 * Math.sin(x / hw * TAU * 5 + 1))); c.lineTo(hw, hh2); c.fill(); });
        hills.w = hw; hills.h = hh2;
        var kw = clamp(W * 0.3, 90, 220), kh = kw * 0.62; // the player's kart from behind
        kart = mkc(kw, kh, sdpr(), function (c, w, h) {
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(w / 2, h * 0.93, w * 0.48, h * 0.07, 0, 0, TAU); c.fill();
          [[0.02, 0.5], [0.8, 0.5]].forEach(function (q) { c.fillStyle = '#111827'; rr(c, w * q[0], h * q[1], w * 0.18, h * 0.42, w * 0.04); c.fill(); c.fillStyle = '#374151'; for (var i = 0; i < 4; i++) c.fillRect(w * q[0] + 2, h * (q[1] + 0.06 + i * 0.09), w * 0.18 - 4, 2); });
          c.fillStyle = lg(c, 0, h * 0.35, 0, h * 0.85, ['#FCA5A5', '#DC2626', '#7F1D1D']); rr(c, w * 0.17, h * 0.45, w * 0.66, h * 0.36, w * 0.06); c.fill();
          c.fillStyle = '#1F2937'; rr(c, w * 0.12, h * 0.33, w * 0.76, h * 0.08, 3); c.fill(); c.fillStyle = '#FACC15'; c.fillRect(w * 0.12, h * 0.33, w * 0.76, h * 0.025); // spoiler
          c.fillStyle = '#9CA3AF'; circ(c, w * 0.38, h * 0.82, w * 0.04, '#9CA3AF'); circ(c, w * 0.62, h * 0.82, w * 0.04, '#9CA3AF');
          c.fillStyle = '#F8FAFC'; c.font = '900 ' + Math.round(h * 0.16) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.fillText('7', w / 2, h * 0.7);
          limb(c, w * 0.38, h * 0.3, w * 0.3, h * 0.42, h * 0.08, h * 0.07, '#1E3A8A'); limb(c, w * 0.62, h * 0.3, w * 0.7, h * 0.42, h * 0.08, h * 0.07, '#1E3A8A');
          c.fillStyle = '#1E3A8A'; rr(c, w * 0.36, h * 0.18, w * 0.28, h * 0.22, w * 0.05); c.fill();
          circ(c, w / 2, h * 0.13, h * 0.13, rg(c, w * 0.46, h * 0.08, h * 0.15, ['#FFFFFF', '#F59E0B', '#92400E']));
          c.fillStyle = '#111827'; c.fillRect(w / 2 - h * 0.11, h * 0.12, h * 0.22, h * 0.035);
        });
        kart.kw = kw; kart.kh = kh;
        var mk = function (fn) { return mkc(100, 100, sdpr(), fn); };
        sprC.cone = mk(function (c) { c.fillStyle = '#1F2937'; c.fillRect(20, 88, 60, 10); c.fillStyle = lg(c, 30, 0, 70, 0, ['#C2410C', '#FB923C', '#C2410C']); poly(c, [50, 8, 28, 90, 72, 90], null); c.fill(); c.fillStyle = '#F8FAFC'; poly(c, [41, 40, 59, 40, 63, 56, 37, 56], '#F8FAFC'); });
        sprC.crate = mk(function (c) { c.fillStyle = lg(c, 0, 10, 0, 98, ['#D97706', '#92400E']); c.fillRect(10, 18, 80, 80); c.strokeStyle = '#78350F'; c.lineWidth = 6; c.strokeRect(13, 21, 74, 74); c.beginPath(); c.moveTo(13, 21); c.lineTo(87, 95); c.moveTo(87, 21); c.lineTo(13, 95); c.stroke(); });
        sprC.peel = mk(function (c) { c.fillStyle = '#FACC15'; for (var i = -1; i <= 1; i++) { c.save(); c.translate(50, 86); c.rotate(i * 0.9); c.beginPath(); c.ellipse(0, -14, 9, 20, 0, 0, TAU); c.fill(); c.restore(); } circ(c, 50, 84, 10, '#FDE68A'); c.fillStyle = '#713F12'; c.fillRect(47, 64, 6, 8); });
        sprC.kart = mk(function (c) { c.fillStyle = '#111827'; rr(c, 4, 58, 18, 38, 4); c.fill(); rr(c, 78, 58, 18, 38, 4); c.fill(); c.fillStyle = lg(c, 0, 40, 0, 90, ['#86EFAC', '#16A34A', '#14532D']); rr(c, 20, 52, 60, 36, 8); c.fill(); c.fillStyle = '#1F2937'; c.fillRect(14, 42, 72, 8); circ(c, 50, 30, 13, rg(c, 46, 26, 14, ['#FFFFFF', '#60A5FA', '#1E3A8A'])); });
        reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.3, i;
        if (won) { won += dt; sp *= 1 - dt * 1.4; z += sp * dt; return; }
        if (dead) { dead.t += dt; sp *= 1 - dt * 3; z += sp * dt; return; }
        if (smoke) { smoke.t += dt; sp *= 1 - dt * 1.2; z += sp * dt; if (Math.random() < 0.5) puff(A, W / 2 + (px - camX) * Ks / ZK, H - kart.kh * 0.5, 2, ['#475569', '#94A3B8', '#1F2937'], 60, 1, 8, -60); return; }
        var top = 13 + 9 * lv, off = Math.abs(px) > 1.15;
        sp += ((off ? top * 0.55 : top) - sp) * Math.min(1, dt * 1.2); z += sp * dt;
        while (segs.length - Math.floor(z) < 120) newSeg(live);
        if (Math.floor(z) > 40) { var cut = Math.floor(z) - 20; segs.splice(0, cut); z -= cut; }
        if (A.idle()) tx = clamp(best(), -0.9, 0.9);
        var s0 = segAt(Math.round(ZK)); px += clamp(tx - px, -3.2 * dt, 3.2 * dt) - (s0 ? s0.c : 0) * sp * 0.55 * dt;
        camX += (px * 0.55 - camX) * Math.min(1, dt * 5); sky -= (s0 ? s0.c : 0) * sp * dt * 30;
        bump = off ? Math.sin(t * 40) * 2 : 0;
        // obstacles: rival karts drive forward (slower); hits when they reach the kart's depth
        for (i = 0; i < 30; i++) {
          var s = segAt(i); if (!s || !s.o) continue;
          var oz = s.i + (s.o.dz || 0) - (segs[0].i + z) + 0.6;
          if (s.o.k === 'kart') s.o.dz = (s.o.dz || 0) + sp * 0.45 * dt;
          if (!s.o.hit && oz > ZK - 0.6 && oz < ZK + 0.4 && Math.abs(s.o.x - px) < 0.34) {
            s.o.hit = 1;
            if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0 }; boomFx(A, W / 2 + (px - camX) * Ks / ZK, H - kart.kh * 0.6, 0.6); } return; }
          }
        }
        if (Math.abs(px) > 1.32) {
          if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0 }; A.shake(0.35); puff(A, W / 2 + (px - camX) * Ks / ZK, H - kart.kh * 0.5, 20, ['#111827', '#6B7280', '#FDE68A'], 180, 0.6, 3.4); } return; }
          px = tx = 0;
        }
      },
      draw: function (c) {
        A.bg(bg);
        tile(c, hills, sky, hor - hills.h + 2, W);
        // project the next NS segments (near → far), then draw far → near
        var P = [], x = 0, dx = 0, base = Math.floor(z), f = z - base, n, s;
        var s0 = segs[base]; dx = -(s0 ? s0.c : 0) * f;
        for (n = 0; n < NS; n++) {
          s = segs[base + n]; if (!s) break;
          var zn = n - f + 0.6, k = 1 / zn;
          P.push({ y: hor + Kh * k, x: W / 2 + (x - camX) * Ks * k, w: Ks * k, s: s, k: k });
          x += dx; dx += s.c;
        }
        for (n = P.length - 1; n > 0; n--) {
          var a = P[n], b = P[n - 1]; if (b.y <= a.y) continue;
          var stripe = (a.s.i >> 2) % 2;
          c.fillStyle = stripe ? '#22C55E' : '#16A34A'; c.fillRect(0, a.y, W, b.y - a.y + 1);
          var trap = function (wa, wb, col) { c.fillStyle = col; c.beginPath(); c.moveTo(a.x - a.w * wa, a.y); c.lineTo(a.x + a.w * wa, a.y); c.lineTo(b.x + b.w * wb, b.y + 1); c.lineTo(b.x - b.w * wb, b.y + 1); c.closePath(); c.fill(); };
          trap(1.32, 1.32, stripe ? '#F8FAFC' : '#DC2626');
          trap(1.18, 1.18, stripe ? '#6B7280' : '#71717A');
          if (stripe) trap(0.04, 0.04, '#F8FAFC');
          if (stripe) { // tyre walls at the edge
            c.fillStyle = '#111827'; var tw = a.w * 0.08; c.fillRect(a.x - a.w * 1.38 - tw, a.y - tw * 1.4, tw * 1.6, tw * 1.4); c.fillRect(a.x + a.w * 1.38 - tw * 0.6, a.y - tw * 1.4, tw * 1.6, tw * 1.4);
          }
        }
        // objects far → near
        for (n = P.length - 1; n >= 1; n--) {
          s = P[n].s; if (!s.o || s.o.hit) continue;
          var oz = n - f + 0.6 + (s.o.dz || 0); if (oz < 0.7) continue;
          var kk = 1 / oz, nn = Math.min(P.length - 1, Math.max(0, Math.round(oz - 0.6 + f))), q = P[nn];
          var sxp = q.x + s.o.x * Ks * kk, syp = hor + Kh * kk, ss = Ks * kk * (s.o.k === 'kart' ? 0.55 : s.o.k === 'peel' ? 0.32 : 0.38);
          if (syp > H + ss) continue;
          c.drawImage(sprC[s.o.k], sxp - ss / 2, syp - ss, ss, ss);
        }
        // the player's kart
        var kx = W / 2 + (px - camX) * Ks / ZK, ky = H - kart.kh * 1.02 + bump, tilt = clamp((tx - px) * 0.25, -0.15, 0.15);
        if (dead) { tilt += dead.t * 6; ky -= Math.sin(Math.min(1, dead.t * 2) * Math.PI) * kart.kh * 0.4; }
        c.save(); c.translate(kx, ky + kart.kh / 2); c.rotate(tilt); c.drawImage(kart, -kart.kw / 2, -kart.kh / 2, kart.kw, kart.kh); c.restore();
        if (!dead && sp > 5) streaks(c, W, hor + (H - hor) * 0.2, H, t, 6, sp * 60, 'rgba(255,255,255,.15)');
      },
      down: function (xx) { drag = { x: xx, s: tx }; },
      move: function (xx) { if (drag && !dead) tx = clamp(drag.s + (xx - drag.x) / (W * 0.32), -1.5, 1.5); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') tx = Math.max(-1.2, tx - 0.62); else if (k === 'right') tx = Math.min(1.2, tx + 0.62); },
      boom: function () { smoke = { t: 0 }; drag = null; A.sx('crash'); A.shake(0.2); },
      win: function () { won = 0.001; drag = null; A.burst(W / 2, H - kart.kh, 16, ['#FDE68A', '#DC2626', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { px: px, tx: tx, best: best(), dead: dead ? 1 : 0, sp: sp }; }
    };
  }, 'drag', 0.55);

  /* ================================================================== 10. DESERT RALLY — hill-climb over dunes. Hold = gas (in the air:
     the nose lifts), release = coast (in the air: the nose drops). Land on the wheels; grab fuel cans before the tank is empty. */
  boot('desertrally', function (A) {
    var W, H, T, dpr, bg, dune, G0, amp, wl, car, cw, ch, wr, x = 0, y = 0, s = 0, vx = 0, vy = 0, ang = 0, av = 0, air = false, held = false, rot = 0, fuel = 1, cans = [], nextCan = 0, camY = 0, t = 0, dead = null, won = 0, storm = 0, ph = 0, GR, cx0;
    function gy(xx) { var a = amp * (1 + Math.min(1, Math.max(0, xx) / (W * 50))); return G0 + a * (0.55 * Math.sin(xx / wl * TAU + ph) + 0.3 * Math.sin(xx / (wl * 0.47) * TAU + ph * 2) + 0.15 * Math.sin(xx / (wl * 0.21) * TAU)); }
    function slope(xx) { return (gy(xx + 2) - gy(xx - 2)) / 4; }
    function reset(live) { ph = rnd(0, TAU); x = cx0; s = W * 0.3; air = false; ang = Math.atan(slope(x)); av = 0; y = gy(x); fuel = 1; cans = []; nextCan = x + W * 1.2; dead = null; won = 0; storm = 0; held = false; camY = 0; }
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; G0 = T + (H - T) * 0.62; amp = (H - T) * 0.12; wl = clamp(W * 1.1, 360, 1000); GR = (H - T) * 2.2; cx0 = W * 0.32;
        cw = clamp(Math.min(W * 0.22, (H - T) * 0.2), 64, 160); ch = cw * 0.55; wr = cw * 0.17;
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#7C2D12', '#EA580C', '#FDBA74', '#FEF3C7']); c.fillRect(0, 0, W, H);
          circ(c, W * 0.75, T + (H - T) * 0.22, Math.min(W, H) * 0.08, rg(c, W * 0.75, T + (H - T) * 0.22, Math.min(W, H) * 0.08, ['#FFFBEB', '#FDE047', '#F59E0B']));
        });
        var dw = Math.max(W, 600) * 1.4, dh = (H - T) * 0.35;
        dune = mkc(dw, dh, dpr, function (c) { c.fillStyle = '#C2410C'; c.globalAlpha = 0.55; c.beginPath(); c.moveTo(0, dh); for (var xx = 0; xx <= dw; xx += 8) c.lineTo(xx, dh * (0.45 + 0.25 * Math.sin(xx / dw * TAU * 3) + 0.1 * Math.sin(xx / dw * TAU * 8))); c.lineTo(dw, dh); c.fill(); c.globalAlpha = 1;
          for (var i = 0; i < 4; i++) { var px2 = dw * (0.1 + i * 0.25), py2 = dh * 0.55; c.fillStyle = '#7C2D12'; c.fillRect(px2 - 2, py2 - dh * 0.28, 4, dh * 0.28); c.fillRect(px2 - dh * 0.1, py2 - dh * 0.2, dh * 0.1, 3); c.fillRect(px2 - dh * 0.1, py2 - dh * 0.26, 3, dh * 0.07); c.fillRect(px2, py2 - dh * 0.16, dh * 0.09, 3); c.fillRect(px2 + dh * 0.09 - 3, py2 - dh * 0.22, 3, dh * 0.07); } });
        dune.w = dw; dune.h = dh;
        car = mkc(cw * 1.1, ch * 1.2, sdpr(), function (c, w, h) { // side view facing right, wheels drawn apart; origin = centre of the axle line
          c.translate(w * 0.5, h * 0.78);
          c.fillStyle = '#1F2937'; c.fillRect(-cw * 0.42, -ch * 0.12, cw * 0.84, ch * 0.12); // chassis
          c.fillStyle = lg(c, 0, -ch * 0.75, 0, 0, ['#FDE68A', '#F59E0B', '#B45309']); c.beginPath(); c.moveTo(-cw * 0.5, -ch * 0.12); c.lineTo(-cw * 0.48, -ch * 0.48); c.lineTo(-cw * 0.15, -ch * 0.5); c.lineTo(-cw * 0.02, -ch * 0.82); c.lineTo(cw * 0.22, -ch * 0.82); c.lineTo(cw * 0.32, -ch * 0.5); c.lineTo(cw * 0.52, -ch * 0.42); c.lineTo(cw * 0.54, -ch * 0.12); c.closePath(); c.fill();
          c.fillStyle = 'rgba(15,23,42,.85)'; c.beginPath(); c.moveTo(-cw * 0.0, -ch * 0.76); c.lineTo(cw * 0.19, -ch * 0.76); c.lineTo(cw * 0.27, -ch * 0.52); c.lineTo(-cw * 0.08, -ch * 0.52); c.closePath(); c.fill();
          c.fillStyle = '#DC2626'; c.fillRect(-cw * 0.48, -ch * 0.36, cw * 1.0, ch * 0.08); c.fillStyle = '#F8FAFC'; c.font = '900 ' + Math.round(ch * 0.22) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.fillText('21', -cw * 0.28, -ch * 0.17);
          c.fillStyle = '#111827'; c.fillRect(-cw * 0.2, -ch * 0.96, cw * 0.34, ch * 0.06); c.fillStyle = '#FDE68A'; c.fillRect(cw * 0.48, -ch * 0.34, cw * 0.05, ch * 0.08);
          c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(-cw * 0.4, -ch * 0.46, cw * 0.3, ch * 0.04);
        });
        reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.25, i;
        if (A.idle() && !dead) { if (air) { var tg = Math.atan(slope(x + vx * 0.25)); held = ang > tg + 0.05; } else held = s < W * 0.75; if (fuel < 0.3) fuel = 1; }
        if (won) { won += dt; s *= 1 - dt * 1.5; if (!air) { x += s * dt; y = gy(x); ang = Math.atan(slope(x)); } return; }
        if (dead) { dead.t += dt; if (dead.k === 'flip') { ang += av * dt; av *= 1 - dt; } else { s *= 1 - dt * 1.5; x += s * dt; y = gy(x); } return; }
        if (storm) { storm += dt; s *= 1 - dt; x += s * dt; y = gy(x); return; }
        fuel -= dt / (8.5 - 2.5 * lv) * (held ? 1.15 : 0.8);
        if (fuel <= 0) { fuel = 0; if (A.live()) { if (A.fail(A.l.fail2)) dead = { t: 0, k: 'fuel' }; return; } fuel = 1; }
        var n = 3, h = dt / n;
        for (var k = 0; k < n; k++) {
          if (!air) {
            var th = Math.atan(slope(x));
            s += ((held ? W * 0.95 : 0) + GR * Math.sin(th) - s * 0.35) * h; s = clamp(s, -W * 0.4, W * 1.25);
            vx = s * Math.cos(th); vy = s * Math.sin(th);
            var nx = x + vx * h, ny = y + vy * h + 0.5 * GR * h * h;
            if (ny < gy(nx) - 1 && s > W * 0.35) { air = true; x = nx; y = ny; av = 0; }
            else { x = nx; y = gy(x); ang += (th - ang) * Math.min(1, h * 18); }
          } else {
            vy += GR * h; x += vx * h; y += vy * h; av += (held ? -5.5 : 4) * h; av *= 1 - 0.8 * h; ang += av * h;
            if (y >= gy(x)) {
              var tg2 = Math.atan(slope(x)), dif = Math.atan2(Math.sin(ang - tg2), Math.cos(ang - tg2));
              y = gy(x); air = false;
              if (Math.abs(dif) > 1.05) { if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, k: 'flip' }; av = dif > 0 ? 4 : -4; A.shake(0.35); puff(A, cx0, y - camY, 18, ['#FDBA74', '#FED7AA', '#9A3412'], 170, 0.7, 3.4); } return; } }
              s = Math.hypot(vx, vy) * Math.cos(Math.atan2(vy, vx) - tg2) * (Math.abs(dif) < 0.35 ? 1 : 0.7); ang = tg2; av = 0;
              puff(A, cx0, y - camY, 8, ['#FDBA74', '#FED7AA'], 100, 0.5, 3);
            }
          }
        }
        // fuel cans on the dunes
        while (nextCan < x + W * 1.5) { cans.push({ x: nextCan }); nextCan += W * rnd(1.6, 2.4) * (1 + lv * 0.25); }
        for (i = cans.length - 1; i >= 0; i--) {
          var cn = cans[i];
          if (Math.abs(cn.x - x) < cw * 0.55 && Math.abs(gy(cn.x) - ch * 0.4 - y + ch * 0.3) < ch * 1.4) { cans.splice(i, 1); fuel = 1; A.burst(cx0, y - camY - ch * 0.5, 12, ['#FDE68A', '#22C55E', '#FFFFFF'], 130, 0.5, 3); continue; }
          if (cn.x < x - W) cans.splice(i, 1);
        }
        var tyc = Math.min(0, y - (T + (H - T) * 0.45)); camY += (tyc - camY) * Math.min(1, dt * 4);
      },
      draw: function (c) {
        A.bg(bg);
        var ox = x - cx0, X, i;
        var dy = G0 - amp * 1.4 - dune.h * 0.7 - camY * 0.3; tile(c, dune, ox * 0.15, dy, W); c.fillStyle = 'rgba(194,65,12,.55)'; c.fillRect(0, dy + dune.h - 1, W, H);
        var stp = Math.max(6, W / 70);
        c.beginPath(); c.moveTo(0, H); for (X = 0; X <= W + stp; X += stp) c.lineTo(X, gy(X + ox) - camY); c.lineTo(W, H); c.closePath();
        c.fillStyle = '#F59E0B'; c.fill();
        c.strokeStyle = '#FCD34D'; c.lineWidth = 3; c.beginPath(); for (X = 0; X <= W + stp; X += stp) { if (X) c.lineTo(X, gy(X + ox) - camY); else c.moveTo(X, gy(X + ox) - camY); } c.stroke();
        c.strokeStyle = 'rgba(180,83,9,.35)'; c.lineWidth = 2; c.beginPath(); for (X = 0; X <= W + stp; X += stp) { var yy = gy(X + ox) - camY + (H - T) * 0.06; if (X) c.lineTo(X, yy); else c.moveTo(X, yy); } c.stroke();
        // fuel cans
        for (i = 0; i < cans.length; i++) {
          var cxx = cans[i].x - ox; if (cxx < -40 || cxx > W + 40) continue;
          var cyy = gy(cans[i].x) - camY - wr * 2.4 + Math.sin(t * 4 + i) * 3;
          circ(c, cxx, cyy, wr * 1.6, 'rgba(253,230,138,.35)');
          c.fillStyle = lg(c, cxx - wr, 0, cxx + wr, 0, ['#991B1B', '#EF4444', '#991B1B']); rr(c, cxx - wr * 0.8, cyy - wr, wr * 1.6, wr * 2, wr * 0.3); c.fill();
          c.fillStyle = '#FDE68A'; c.fillRect(cxx - wr * 0.25, cyy - wr * 1.35, wr * 0.5, wr * 0.4); c.strokeStyle = '#FDE68A'; c.lineWidth = 2; c.beginPath(); c.moveTo(cxx - wr * 0.5, cyy - wr * 0.6); c.lineTo(cxx + wr * 0.5, cyy + wr * 0.6); c.stroke();
        }
        // the truck: body rotated with the angle, wheels at both ends of the axle line
        var by = y - camY, rot2 = t * s / wr;
        c.save(); c.translate(cx0, by - wr); c.rotate(ang);
        if (held && !dead && !air && Math.random() < 0.5) puff(A, cx0 - Math.cos(ang) * cw * 0.45, by - wr * 0.6, 1, ['rgba(253,186,116,.8)', 'rgba(254,215,170,.7)'], 40, 0.6, 6, -20);
        c.drawImage(car, -cw * 0.55, -ch * 1.2 * 0.78, cw * 1.1, ch * 1.2);
        wheel(c, -cw * 0.33, 0, wr, rot2, '#E5E7EB'); wheel(c, cw * 0.33, 0, wr, rot2, '#E5E7EB');
        c.restore();
        // fuel gauge (top left, under the HUD)
        var gw = clamp(W * 0.26, 80, 160), gx = 10, gyy = T + 4, gh = 10;
        c.fillStyle = 'rgba(10,6,30,.6)'; rr(c, gx - 4, gyy - 4, gw + 8 + 18, gh + 8, 8); c.fill();
        c.fillStyle = fuel < 0.25 ? (Math.sin(t * 12) > 0 ? '#EF4444' : '#7F1D1D') : lg(c, gx, 0, gx + gw, 0, ['#EF4444', '#FACC15', '#22C55E']); rr(c, gx + 18, gyy, gw * fuel, gh, 5); c.fill();
        c.fillStyle = '#EF4444'; rr(c, gx, gyy - 2, 12, 14, 3); c.fill(); c.fillStyle = '#FDE68A'; c.fillRect(gx + 3, gyy - 4, 6, 3);
        if (storm) { c.fillStyle = 'rgba(194,65,12,' + Math.min(0.6, storm * 0.5) + ')'; c.fillRect(0, T, W, H - T); c.fillStyle = 'rgba(254,215,170,.7)'; for (i = 0; i < 40; i++) c.fillRect((i * 89 - t * 900) % W + W, T + (i * 47 + t * 60) % (H - T), 8, 2); }
      },
      down: function () { held = true; },
      move: function () { },
      up: function () { held = false; },
      boom: function () { storm = 0.001; held = false; A.sx('crash'); },
      win: function () { won = 0.001; held = false; A.burst(cx0, y - camY - ch, 16, ['#FDE68A', '#F59E0B', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { var tg = Math.atan(slope(x + vx * 0.25)); return { air: air, ang: ang, tg: tg, s: s / W, fuel: fuel, want: air ? (ang > tg + 0.05 ? 1 : 0) : (s < W * 0.75 ? 1 : 0), dead: dead ? dead.k : '' }; }
    };
  }, 'hold', 0.4);

  /* ================================================================== 11. ROOFTOP NINJA — the ninja runs up between two walls; tap = leap
     to the other wall. Spikes stick out of the walls: be on the other side when you reach them. */
  boot('rooftopninja', function (A) {
    var W, H, T, dpr, bg, wallS, xL, xR, ns, nin = [], jf, side = -1, jump = null, y = 0, v = 0, cam = 0, ny, t = 0, haz = [], nextY = 0, dead = null, won = 0, drone = null, run = 0;
    var JT = 0.3;
    function reset(live) { side = -1; jump = null; y = 0; cam = 0; haz = []; nextY = -(H - T) * (live ? 0.9 : 0.5); dead = null; won = 0; drone = null; v = (H - T) * 0.42; }
    function addHaz(live) {
      var lv = live ? A.lv() : 0.25, len = (H - T) * rnd(0.12, 0.22 + lv * 0.06), last = haz[haz.length - 1], s = Math.random() < 0.5 ? -1 : 1;
      if (last && Math.random() < 0.65) s = -last.s; // mostly alternating
      var bottom = nextY, gapMin = v * (JT + 0.5 - lv * 0.12);
      haz.push({ s: s, b: bottom, tp: bottom - len }); nextY = bottom - len - gapMin - (H - T) * rnd(0.02, 0.18) * (1.1 - lv * 0.5);
    }
    function onHaz(s, yy) { for (var i = 0; i < haz.length; i++) { var h = haz[i]; if (h.s === s && yy <= h.b + ns * 0.25 && yy >= h.tp - ns * 0.25) return true; } return false; }
    function want() { // autopilot: leap when a spike on my side comes close and the other side is clear on landing
      if (jump || dead) return false;
      var ahead = v * (JT + 0.18);
      return onHaz(side, y - ahead) && !onHaz(-side, y - v * JT) && !onHaz(-side, y - v * (JT + 0.15));
    }
    function wallX(s) { return s < 0 ? xL + ns * 0.42 : xR - ns * 0.42; }
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; var sw = Math.min(W * 0.66, (H - T) * 0.62); xL = (W - sw) / 2; xR = W - xL; ny = T + (H - T) * 0.7; ns = clamp(Math.min(sw * 0.2, (H - T) * 0.12), 30, 80);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#020617', '#1E1B4B', '#4C1D95', '#BE185D']); c.fillRect(0, 0, W, H);
          stars(c, W, H, Math.round(W * H / 4000), 0, H * 0.7);
          circ(c, W * 0.5, T + (H - T) * 0.2, Math.min(xR - xL, H) * 0.12, rg(c, W * 0.5, T + (H - T) * 0.2, Math.min(xR - xL, H) * 0.12, ['#FEFCE8', '#FEF08A', '#CA8A04'], -5, -5));
          var x = xL; while (x < xR) { var bw = rnd(18, 40), bh = (H - T) * rnd(0.15, 0.4); c.fillStyle = '#1E1B4B'; c.fillRect(x, H - bh, bw, bh); c.fillStyle = 'rgba(253,224,71,.5)'; for (var yy = H - bh + 5; yy < H - 4; yy += 8) for (var xx = x + 3; xx < x + bw - 3; xx += 6) if (Math.random() < 0.3) c.fillRect(xx, yy, 2, 3); x += bw + 2; }
        });
        var th = (H - T) * 0.25, ww2 = Math.max(xL, 10);
        wallS = mkc(ww2 + 6, th, dpr, function (c, w, h) { // facade tile: concrete, window rows, a ledge
          c.fillStyle = lg(c, 0, 0, w, 0, ['#334155', '#475569', '#1E293B']); c.fillRect(0, 0, w, h);
          for (var r = 0; r < 3; r++) for (var q = 0; q < Math.max(1, Math.floor(w / 26)); q++) { var lit = Math.random() < 0.4; c.fillStyle = lit ? '#FDE68A' : '#0F172A'; c.fillRect(6 + q * 26, r * h / 3 + h * 0.08, 14, h / 3 * 0.55); }
          c.fillStyle = '#64748B'; c.fillRect(0, h - 5, w, 5);
        });
        wallS.w = ww2 + 6; wallS.h = th;
        var drawN = function (c, k, mode) { // the ninja, side view facing the wall on the left (mirrored for the right wall)
          var u = ns; c.translate(u * 0.6, u * 0.6);
          if (mode === 'jump') { c.rotate(k * TAU); }
          var sw2 = Math.sin(k * TAU) * 0.5;
          var cl = '#111827', cl2 = '#1F2937';
          limb(c, 0, u * 0.05, -u * 0.3, u * (0.25 + sw2 * 0.2), u * 0.13, u * 0.1, cl2); limb(c, 0, u * 0.05, -u * 0.25, u * (0.32 - sw2 * 0.2), u * 0.13, u * 0.1, cl);
          limb(c, 0, -u * 0.22, -u * 0.32, -u * (0.3 - sw2 * 0.2), u * 0.1, u * 0.08, cl2);
          c.fillStyle = cl; c.beginPath(); c.ellipse(0, -u * 0.08, u * 0.15, u * 0.22, 0.15, 0, TAU); c.fill();
          limb(c, 0, -u * 0.22, -u * 0.3, -u * (0.18 + sw2 * 0.2), u * 0.1, u * 0.08, cl);
          circ(c, u * 0.02, -u * 0.38, u * 0.14, cl); c.fillStyle = '#DC2626'; c.fillRect(-u * 0.13, -u * 0.43, u * 0.28, u * 0.06);
          c.strokeStyle = '#DC2626'; c.lineWidth = u * 0.04; c.beginPath(); c.moveTo(u * 0.13, -u * 0.41); c.quadraticCurveTo(u * 0.28, -u * 0.38 + sw2 * u * 0.1, u * 0.36, -u * 0.3); c.stroke();
          c.fillStyle = '#FDE68A'; c.fillRect(-u * 0.1, -u * 0.39, u * 0.1, u * 0.03); // eyes slit
          c.strokeStyle = '#94A3B8'; c.lineWidth = u * 0.03; c.beginPath(); c.moveTo(u * 0.12, -u * 0.25); c.lineTo(u * 0.3, u * 0.05); c.stroke(); // sword on the back
        };
        nin = []; for (var i = 0; i < 6; i++) nin.push(mkc(ns * 1.2, ns * 1.2, sdpr(), (function (k) { return function (c) { drawN(c, k, 'run'); }; })(i / 6)));
        jf = mkc(ns * 1.2, ns * 1.2, sdpr(), function (c) { drawN(c, 0.1, 'run'); });
        reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.25, i;
        if (won) { won += dt; return; }
        if (dead) { dead.t += dt; dead.vy += (H - T) * 3 * dt; y += dead.vy * dt; dead.x += dead.vx * dt; return; }
        if (drone) { drone.t += dt; drone.x += (wallX(side) - drone.x) * dt * 3; if (drone.t > 0.8 && !drone.hit) { drone.hit = 1; dead = { t: 0, x: wallX(side), vx: -side * (xR - xL) * 0.5, vy: -(H - T) * 0.3 }; boomFx(A, wallX(side), ny, 0.5); } return; }
        v += ((H - T) * (0.42 + 0.3 * lv) - v) * Math.min(1, dt); y -= v * dt; run += dt * v / ns * 1.4;
        if (A.idle() && want()) this.act();
        if (jump) { jump.t += dt; if (jump.t >= JT) { side = jump.to; jump = null; A.burst(wallX(side) + side * ns * 0.3, ny, 5, ['#CBD5E1', '#FFFFFF'], 80, 0.35, 2.2); } }
        cam += (y - cam) * Math.min(1, dt * 8);
        while (nextY > y - (H - T) * 1.5) addHaz(live);
        for (i = haz.length - 1; i >= 0; i--) if (haz[i].tp > y + (H - T)) haz.splice(i, 1);
        if (!jump && onHaz(side, y)) {
          if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, x: wallX(side), vx: -side * (xR - xL) * 0.4, vy: -(H - T) * 0.4 }; A.shake(0.3); A.burst(wallX(side), ny, 16, ['#F43F5E', '#FFFFFF', '#94A3B8'], 170, 0.6, 3); } return; }
          side = -side;
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, off = ny - cam;
        // walls (tiles scroll with the climb)
        var th = wallS.h, ty0 = ((off % th) + th) % th - th;
        for (var yy = ty0; yy < H; yy += th) { c.drawImage(wallS, xL - wallS.w, yy, wallS.w, th); c.save(); c.translate(xR + wallS.w, yy); c.scale(-1, 1); c.drawImage(wallS, 0, 0, wallS.w, th); c.restore(); }
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(xL - 4, 0, 4, H); c.fillRect(xR, 0, 4, H);
        // spikes
        for (i = 0; i < haz.length; i++) {
          var h = haz[i], y1 = h.tp + off, y2 = h.b + off; if (y2 < T - 20 || y1 > H + 20) continue;
          var bx = h.s < 0 ? xL : xR, dir = -h.s, sl = ns * 0.42, n = Math.max(2, Math.round((y2 - y1) / (ns * 0.3)));
          c.fillStyle = '#7F1D1D'; c.fillRect(h.s < 0 ? xL - 4 : xR - 2, y1, 6, y2 - y1);
          for (var k = 0; k < n; k++) { var sy = y1 + (k + 0.5) * (y2 - y1) / n, hw = (y2 - y1) / n * 0.45; c.fillStyle = lg(c, bx, 0, bx + dir * sl, 0, ['#E2E8F0', '#94A3B8', '#475569']); poly(c, [bx, sy - hw, bx + dir * sl, sy, bx, sy + hw], null); c.fill(); }
        }
        // the ninja
        var nx2, nyy = ny + (dead ? (y - cam) - 0 : 0), img, flip;
        if (dead) { nx2 = dead.x; nyy = ny + (y - cam); img = jf; flip = side; }
        else if (jump) { var k2 = jump.t / JT, fx = wallX(jump.from), tx2 = wallX(jump.to); nx2 = fx + (tx2 - fx) * ease(k2); nyy = ny - Math.sin(k2 * Math.PI) * ns * 0.4; img = jf; flip = jump.to; }
        else { nx2 = wallX(side); img = nin[Math.floor(run) % nin.length]; flip = side; }
        c.save(); c.translate(nx2, nyy); if (flip > 0) c.scale(-1, 1); if (jump) c.rotate(-jump.t / JT * TAU); if (dead) c.rotate(dead.t * 8);
        c.drawImage(img, -ns * 0.6, -ns * 0.6, ns * 1.2, ns * 1.2); c.restore();
        if (drone) { var dx2 = drone.x, dy2 = T + (H - T) * 0.25; c.fillStyle = 'rgba(254,249,195,.18)'; poly(c, [dx2 - 8, dy2, dx2 + 8, dy2, wallX(side) + ns * 0.5, ny + ns * 0.4, wallX(side) - ns * 0.5, ny + ns * 0.4], null); c.fill(); c.fillStyle = '#1F2937'; rr(c, dx2 - ns * 0.4, dy2 - ns * 0.12, ns * 0.8, ns * 0.24, 6); c.fill(); c.strokeStyle = '#94A3B8'; c.lineWidth = 2; c.beginPath(); c.moveTo(dx2 - ns * 0.6, dy2 - ns * 0.2); c.lineTo(dx2 - ns * 0.2, dy2 - ns * 0.2); c.moveTo(dx2 + ns * 0.2, dy2 - ns * 0.2); c.lineTo(dx2 + ns * 0.6, dy2 - ns * 0.2); c.stroke(); circ(c, dx2, dy2 + ns * 0.08, 4, Math.sin(t * 20) > 0 ? '#EF4444' : '#FCA5A5'); }
      },
      act: function () { if (jump || dead || drone || won) return; jump = { from: side, to: -side, t: 0 }; A.sx('whoosh', { v: 0.35 }); },
      boom: function () { drone = { t: 0, x: W / 2 }; A.sx('crash'); },
      win: function () { won = 0.001; A.burst(wallX(side), ny, 16, ['#FDE68A', '#DC2626', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { want: want() ? 1 : 0, side: side, jump: jump ? 1 : 0, dead: dead ? 1 : 0, haz: haz.length }; }
    };
  }, 'tap', 0.45);

  /* ================================================================== 12. LAVA ESCAPE — inside a volcano; tap = jump straight up to the
     ledge above, which slides from side to side. Lava rises faster and faster: keep climbing. */
  boot('lavaescape', function (A) {
    var W, H, T, dpr, bg, wallS, lavaS, hs, hero, heroJ, DY, ledges = [], k = 0, ox = 0, hx = 0, jump = null, lava = 0, cam = 0, t = 0, dead = null, won = 0, erupt = null, sy0, lt = 0, emb = [];
    var JT = 0.42;
    function addLedge(live) {
      var i = ledges.length, lv = live ? A.lv() : 0.25, w = i === 0 ? W * 0.6 : Math.max(hs * 1.3, W * (0.36 - lv * 0.12) * rnd(0.85, 1.1)), amp = i === 0 ? 0 : (W - w) / 2 * rnd(0.55, 0.95);
      ledges.push({ y: -i * DY, w: w, a: amp, om: rnd(1.1, 1.6) * (1 + lv * 0.6), ph: rnd(0, TAU) });
    }
    function lx(L, tt) { return W / 2 + L.a * Math.sin(L.om * tt + L.ph); }
    function reset(live) { ledges = []; for (var i = 0; i < 8; i++) addLedge(live); k = 0; ox = 0; jump = null; lava = DY * 1.3; cam = 0; dead = null; won = 0; erupt = null; lt = 0; hx = W / 2; }
    function want() { var N = ledges[k + 1]; if (!N || jump || dead) return false; var X = lx(ledges[k], lt) + ox, nx = lx(N, lt + JT); return Math.abs(X - nx) < N.w / 2 - hs * 0.45 || (lava - ledges[k].y < DY * 0.2 && Math.abs(X - nx) < N.w / 2); }
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; DY = (H - T) * 0.2; hs = clamp(Math.min(DY * 0.85, W * 0.15), 34, 100); sy0 = T + (H - T) * 0.68;
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0C0A09', '#292524', '#7C2D12', '#C2410C']); c.fillRect(0, 0, W, H);
          for (var i = 0; i < 30; i++) circ(c, Math.random() * W, Math.random() * H * 0.7, rnd(1, 2.4), 'rgba(251,146,60,' + rnd(0.2, 0.6) + ')');
        });
        var th = (H - T) * 0.3, ww2 = Math.max(16, W * 0.06);
        wallS = mkc(ww2, th, dpr, function (c, w, h) { c.fillStyle = lg(c, 0, 0, w, 0, ['#1C1917', '#44403C', '#292524']); c.fillRect(0, 0, w, h); c.strokeStyle = '#F97316'; c.lineWidth = 1.6; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(w * 0.3, 0); c.lineTo(w * 0.6, h * 0.3); c.lineTo(w * 0.2, h * 0.55); c.lineTo(w * 0.7, h); c.stroke(); c.globalAlpha = 1; });
        wallS.w = ww2; wallS.h = th;
        var pal = { skin: '#C08552', hair: '#2B1B10', top: ['#0EA5E9', '#0369A1'], bottom: ['#78350F', '#451A03'], shoe: '#1C1917' };
        hero = rigOne(hs, { view: 'side', pose: 'stand', pal: pal }); heroJ = rigOne(hs, { view: 'side', pose: 'jump', pal: pal });
        if (!hero) { hero = heroJ = mkc(hs * 1.2, hs * 1.12, sdpr(), function (c) { c.translate(hs * 0.6, hs * 1.08); limb(c, 0, 0, 0, -hs * 0.5, hs * 0.14, hs * 0.14, '#78350F'); limb(c, 0, -hs * 0.5, 0, -hs * 0.8, hs * 0.2, hs * 0.18, '#0EA5E9'); circ(c, 0, -hs * 0.9, hs * 0.1, '#C08552'); }); }
        lavaS = mkc(W, (H - T) * 0.45, dpr, function (c, w, h) { c.fillStyle = lg(c, 0, 0, 0, h, ['#FDE047', '#F97316', '#B91C1C', '#450A0A']); c.fillRect(0, 0, w, h); });
        emb = []; for (var e = 0; e < 18; e++) emb.push({ x: Math.random() * W, y: Math.random(), s: rnd(0.3, 1) });
        reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; lt += dt; var lv = live ? A.lv() : 0.25, i, L = ledges[k];
        for (i = 0; i < emb.length; i++) { emb[i].y -= dt * 0.12 * emb[i].s; if (emb[i].y < 0) { emb[i].y = 1; emb[i].x = Math.random() * W; } }
        if (won) { won += dt; return; }
        var tgtCam = (jump ? ledges[jump.to].y : L.y); cam += (tgtCam - cam) * Math.min(1, dt * 3);
        if (dead) { dead.t += dt; dead.vy += (H - T) * 2.6 * dt; dead.y += dead.vy * dt; return; }
        if (erupt) { erupt.t += dt; if (erupt.t > 0.55 && !erupt.hit) { erupt.hit = 1; dead = { t: 0, y: L.y, vy: -(H - T) * 0.9, x: hx }; boomFx(A, hx, sy0 + (L.y - cam), 0.5); } return; }
        // the lava keeps rising (faster with time), never too far below
        lava -= dt * DY / (3.4 - 1.4 * Math.min(1, lv)); lava = Math.min(lava, (jump ? ledges[jump.to].y : L.y) + DY * 1.3);
        if (A.idle() && want()) this.act();
        if (jump) {
          jump.t += dt;
          if (jump.t >= JT) {
            var N = ledges[jump.to], nx = lx(N, lt);
            if (Math.abs(hx - nx) <= N.w / 2) { k = jump.to; ox = hx - nx; jump = null; puff(A, hx, sy0 + (N.y - cam), 6, ['#A8A29E', '#FED7AA'], 70, 0.4, 2.4); A.sx('tick', { v: 0.4 }); }
            else if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, y: N.y, vy: 0, x: hx }; } return; }
            else { k = jump.to; ox = 0; jump = null; }
            while (ledges.length < k + 8) addLedge(live);
          }
        } else hx = lx(L, lt) + ox;
        var feet = jump ? ledges[jump.from].y - Math.sin(Math.min(1, jump.t / JT) * Math.PI) * DY * 1.1 - (ledges[jump.from].y - ledges[jump.to].y) * Math.min(1, jump.t / JT) : L.y;
        if (lava <= feet + 2) {
          if (A.live()) { if (A.fail(A.l.fail2)) { dead = { t: 0, y: feet, vy: -(H - T) * 0.6, x: hx, burn: 1 }; A.burst(hx, sy0 + (feet - cam), 22, ['#FDE047', '#F97316', '#7F1D1D'], 200, 0.7, 3.4); A.shake(0.3); } return; }
          lava = feet + DY * 2;
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, Y = function (wy) { return sy0 + (wy - cam); };
        var th = wallS.h, ty0 = (((sy0 - cam) % th) + th) % th - th;
        for (var yy = ty0; yy < H; yy += th) { c.drawImage(wallS, 0, yy, wallS.w, th); c.save(); c.translate(W, yy); c.scale(-1, 1); c.drawImage(wallS, 0, 0, wallS.w, th); c.restore(); }
        c.fillStyle = 'rgba(251,146,60,.8)'; for (i = 0; i < emb.length; i++) c.fillRect(emb[i].x, T + emb[i].y * (H - T), 2, 2);
        // ledges
        for (i = 0; i < ledges.length; i++) {
          var L = ledges[i], y = Y(L.y); if (y < T - 30 || y > H + 30) continue;
          var x = lx(L, lt), w = L.w, h = DY * 0.22;
          c.fillStyle = 'rgba(249,115,22,.25)'; c.beginPath(); c.ellipse(x, y + h * 0.9, w * 0.5, h * 0.6, 0, 0, TAU); c.fill();
          c.fillStyle = lg(c, 0, y, 0, y + h, ['#78716C', '#44403C', '#1C1917']); c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w * 0.42, y + h); c.lineTo(x + w * 0.1, y + h * 1.3); c.lineTo(x - w * 0.3, y + h * 1.1); c.lineTo(x - w * 0.46, y + h * 0.6); c.closePath(); c.fill();
          c.fillStyle = '#A8A29E'; c.fillRect(x - w / 2, y - 2, w, 3);
          if (i === k + 1 && !jump && !dead) { c.strokeStyle = 'rgba(253,230,138,.6)'; c.setLineDash([6, 6]); c.lineWidth = 2; c.beginPath(); c.moveTo(x - w / 2, y - 6); c.lineTo(x + w / 2, y - 6); c.stroke(); c.setLineDash([]); }
        }
        // the hero
        var feet, im = hero, hx2 = hx;
        if (dead) { feet = dead.y; hx2 = dead.x; im = heroJ; }
        else if (jump) { var q = Math.min(1, jump.t / JT), y0 = ledges[jump.from].y, y1 = ledges[jump.to].y; feet = y0 + (y1 - y0) * q - Math.sin(q * Math.PI) * DY * 0.5; im = heroJ; }
        else feet = ledges[k].y;
        if (!(dead && dead.burn && dead.t > 0.3)) { c.save(); c.translate(hx2, Y(feet)); if (dead) c.rotate(dead.t * 5); c.drawImage(im, -im.w / 2, -im.h + hs * 0.04, im.w, im.h); c.restore(); }
        // lava
        var ly = Y(lava);
        if (ly < H + 20) {
          c.drawImage(lavaS, 0, ly + 3, W, lavaS.h); if (ly + 3 + lavaS.h < H) { c.fillStyle = '#450A0A'; c.fillRect(0, ly + 2 + lavaS.h, W, H - ly); }
          c.fillStyle = '#FDE047'; c.beginPath(); c.moveTo(0, ly + 8); for (var xx = 0; xx <= W; xx += W / 12) c.lineTo(xx, ly + Math.sin(xx * 0.05 + t * 3) * 4); c.lineTo(W, ly + 8); c.closePath(); c.fill();
          for (i = 0; i < 5; i++) { var bxx = (i * W / 5 + t * 30 * (i % 2 ? 1 : -1) + W) % W; circ(c, bxx, ly + 10 + (i % 3) * 8, 3 + Math.abs(Math.sin(t * 2 + i)) * 4, 'rgba(254,240,138,.7)'); }
          c.fillStyle = 'rgba(251,146,60,.15)'; c.fillRect(0, ly - (H - T) * 0.12, W, (H - T) * 0.12);
        }
        if (erupt) { var gx = hx, gt = Math.min(1, erupt.t / 0.55); c.fillStyle = lg(c, 0, ly, 0, ly - (ly - Y(ledges[k].y)) * gt, ['#B91C1C', '#F97316', '#FEF08A']); rr(c, gx - hs * 0.4, ly - (ly - Y(ledges[k].y) + hs) * gt, hs * 0.8, (ly - Y(ledges[k].y) + hs) * gt + 10, hs * 0.4); c.fill(); }
      },
      act: function () { if (jump || dead || erupt || won) return; jump = { from: k, to: k + 1, t: 0 }; A.sx('whoosh', { v: 0.35 }); },
      boom: function () { erupt = { t: 0 }; A.shake(0.25); A.sx('crash'); },
      win: function () { won = 0.001; A.burst(hx, sy0 - hs, 16, ['#FDE68A', '#F97316', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { want: want() ? 1 : 0, k: k, jump: jump ? 1 : 0, lavaGap: (lava - (ledges[k] ? ledges[k].y : 0)) / DY, dead: dead ? 1 : 0 }; }
    };
  }, 'tap', 0.3);
})(window.D6 = window.D6 || {});
