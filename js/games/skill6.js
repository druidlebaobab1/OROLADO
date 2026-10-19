/* v2850 — "You're in control" group 6 (owner request, round 6): the CLASSICS everybody already knows — BLOCK FALL (falling
   blocks), MERGE 2048, MAZE MUNCHER, BUBBLE POP, GEM SWAP (match-3 sprint), MEMORY FLIP, ECHO PADS (repeat the colours)
   and PIANO KEYS. Original names and drawings. MIXED MODE like every "You're in control" game: the multiplier follows the
   SERVER clock (×e^(rate·s), casino_ext.php 'skill', rate 0.03 → ×2 after ~23 s), the gold button cashes out, a mistake
   loses (K.multi 'fail'), and the server's secret end arrives as an unavoidable event. Each game gets harder with the time
   played. Canvas 2D at 60 fps, sprites pre-drawn once per size, DPR ≤ 2, pauses when the tab is hidden, one RAF (K.S.raf).
   Same engine as js/games/skill5.js (copied: each module file stands alone) + immersive audio hooks (D6.Sfx.amb / play).
   This file only draws: the server decides and pays. */
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
    blockfall: {
      en: ['Drag to move · tap to turn', 'Stack full!', 'Block storm!', 'Swipe left or right to move the falling block, tap to turn it, swipe down to drop it. Fill a whole row to clear it. Blocks fall faster and faster. If the stack reaches the top, the round ends.'],
      fr: ['Glisse pour bouger · touche pour tourner', 'Pile pleine !', 'Tempête de blocs !', 'Glisse à gauche ou à droite pour déplacer le bloc qui tombe, touche pour le tourner, glisse vers le bas pour le lâcher. Remplis une ligne entière pour l’effacer. Les blocs tombent de plus en plus vite. Si la pile atteint le haut, la partie est finie.'],
      es: ['Desliza para mover · toca para girar', '¡Pila llena!', '¡Tormenta de bloques!', 'Desliza a la izquierda o a la derecha para mover el bloque que cae, toca para girarlo, desliza hacia abajo para soltarlo. Completa una fila para borrarla. Los bloques caen cada vez más rápido. Si la pila llega arriba, la ronda termina.'],
      pt: ['Deslize para mover · toque para girar', 'Pilha cheia!', 'Tempestade de blocos!', 'Deslize para a esquerda ou direita para mover o bloco que cai, toque para girá-lo, deslize para baixo para soltá-lo. Complete uma linha inteira para apagá-la. Os blocos caem cada vez mais rápido. Se a pilha chegar ao topo, a rodada termina.'],
      ar: ['اسحب للتحريك · المس للتدوير', 'امتلأت الكومة!', 'عاصفة مكعبات!', 'اسحب يسارًا أو يمينًا لتحريك المكعب الساقط، والمس لتدويره، واسحب لأسفل لإسقاطه. املأ صفًا كاملًا لمسحه. تسقط المكعبات أسرع فأسرع. إذا وصلت الكومة إلى الأعلى تنتهي الجولة.'],
      tr: ['Kaydırıp taşı · dokunup çevir', 'Yığın doldu!', 'Blok fırtınası!', 'Düşen bloğu taşımak için sola ya da sağa kaydır, çevirmek için dokun, bırakmak için aşağı kaydır. Silmek için bir sırayı tamamen doldur. Bloklar giderek hızlanır. Yığın tepeye ulaşırsa tur biter.'],
      vi: ['Vuốt để di chuyển · chạm để xoay', 'Đầy chồng!', 'Bão khối!', 'Vuốt trái hoặc phải để di chuyển khối đang rơi, chạm để xoay, vuốt xuống để thả nhanh. Lấp đầy một hàng để xóa hàng đó. Khối rơi ngày càng nhanh. Chồng khối chạm đỉnh là kết thúc ván.'],
      id: ['Geser untuk gerak · ketuk untuk putar', 'Tumpukan penuh!', 'Badai balok!', 'Geser ke kiri atau kanan untuk memindahkan balok yang jatuh, ketuk untuk memutarnya, geser ke bawah untuk menjatuhkannya. Penuhi satu baris untuk menghapusnya. Balok jatuh makin cepat. Jika tumpukan mencapai atas, ronde berakhir.'],
      ru: ['Свайп — сдвиг · тап — поворот', 'Стакан полон!', 'Буря блоков!', 'Проводи влево или вправо, чтобы двигать падающий блок, нажимай, чтобы повернуть, проведи вниз, чтобы сбросить. Заполни ряд целиком, чтобы он исчез. Блоки падают всё быстрее. Если стопка дойдёт до верха, раунд окончен.'],
      de: ['Wischen zum Schieben · Tippen zum Drehen', 'Stapel voll!', 'Blocksturm!', 'Wische nach links oder rechts, um den fallenden Block zu schieben, tippe zum Drehen, wische nach unten zum Fallenlassen. Fülle eine ganze Reihe, um sie zu löschen. Die Blöcke fallen immer schneller. Erreicht der Stapel den oberen Rand, endet die Runde.'],
      hi: ['खिसकाने को स्वाइप · घुमाने को टैप', 'ढेर भर गया!', 'ब्लॉक तूफ़ान!', 'गिरते ब्लॉक को खिसकाने के लिए बाएँ या दाएँ स्वाइप करें, घुमाने के लिए टैप करें, गिराने के लिए नीचे स्वाइप करें। पूरी पंक्ति भरें तो वह मिट जाती है। ब्लॉक तेज़ी से गिरते जाते हैं। ढेर ऊपर तक पहुँचा तो राउंड खत्म।'],
      zh: ['滑动移动 · 点击旋转', '堆满了！', '方块风暴！', '左右滑动移动下落的方块，点击旋转，向下滑动直接落下。填满一整行即可消除。方块会越落越快。方块堆到顶部，本回合结束。']
    },
    merge2048: {
      en: ['Swipe to slide the tiles', 'Board full!', 'Earthquake!', 'Swipe to slide every tile; two equal tiles merge into one. A new tile appears after each move — and the clock adds one too, faster and faster. When the board is full with no merge left, the round ends.'],
      fr: ['Glisse pour pousser les tuiles', 'Grille pleine !', 'Tremblement de terre !', 'Glisse pour pousser toutes les tuiles ; deux tuiles égales fusionnent. Une nouvelle tuile apparaît après chaque coup — et l’horloge en ajoute aussi, de plus en plus vite. Quand la grille est pleine sans fusion possible, la partie est finie.'],
      es: ['Desliza para mover las fichas', '¡Tablero lleno!', '¡Terremoto!', 'Desliza para mover todas las fichas; dos fichas iguales se fusionan. Aparece una ficha nueva tras cada jugada, y el reloj también añade una, cada vez más rápido. Si el tablero se llena sin fusiones posibles, la ronda termina.'],
      pt: ['Deslize para mover as peças', 'Tabuleiro cheio!', 'Terremoto!', 'Deslize para mover todas as peças; duas peças iguais se fundem. Uma peça nova aparece após cada jogada — e o relógio também adiciona uma, cada vez mais rápido. Se o tabuleiro encher sem fusão possível, a rodada termina.'],
      ar: ['اسحب لتحريك المربعات', 'امتلأت اللوحة!', 'زلزال!', 'اسحب لتحريك كل المربعات؛ يندمج كل مربعين متساويين. يظهر مربع جديد بعد كل حركة، والساعة تضيف واحدًا أيضًا وبسرعة متزايدة. إذا امتلأت اللوحة دون دمج ممكن تنتهي الجولة.'],
      tr: ['Taşları kaydırmak için kaydır', 'Tahta doldu!', 'Deprem!', 'Tüm taşları kaydırmak için kaydır; iki eşit taş birleşir. Her hamleden sonra yeni bir taş gelir — saat de giderek hızlanarak taş ekler. Tahta dolar ve birleşme kalmazsa tur biter.'],
      vi: ['Vuốt để đẩy các ô số', 'Đầy bảng!', 'Động đất!', 'Vuốt để đẩy mọi ô; hai ô bằng nhau sẽ gộp thành một. Mỗi lượt có thêm một ô mới — đồng hồ cũng tự thêm ô, ngày càng nhanh. Bảng đầy mà không gộp được nữa là kết thúc ván.'],
      id: ['Geser untuk mendorong ubin', 'Papan penuh!', 'Gempa bumi!', 'Geser untuk mendorong semua ubin; dua ubin sama menyatu. Ubin baru muncul setiap langkah — dan jam juga menambah ubin, makin cepat. Jika papan penuh tanpa gabungan tersisa, ronde berakhir.'],
      ru: ['Свайп — сдвинуть плитки', 'Поле заполнено!', 'Землетрясение!', 'Проводи, чтобы сдвинуть все плитки; две одинаковые сливаются в одну. После каждого хода появляется новая плитка — и часы тоже добавляют их всё быстрее. Если поле заполнено и слить нечего, раунд окончен.'],
      de: ['Wischen, um die Kacheln zu schieben', 'Feld voll!', 'Erdbeben!', 'Wische, um alle Kacheln zu schieben; zwei gleiche Kacheln verschmelzen. Nach jedem Zug kommt eine neue Kachel — und die Uhr fügt auch welche hinzu, immer schneller. Ist das Feld voll und nichts mehr verschmelzbar, endet die Runde.'],
      hi: ['टाइलें खिसकाने को स्वाइप करें', 'बोर्ड भर गया!', 'भूकंप!', 'सभी टाइलें खिसकाने के लिए स्वाइप करें; दो बराबर टाइलें मिलकर एक बनती हैं। हर चाल के बाद नई टाइल आती है — और घड़ी भी टाइल जोड़ती है, तेज़ होते हुए। बोर्ड भर जाए और कोई मेल न बचे तो राउंड खत्म।'],
      zh: ['滑动推动方块', '棋盘满了！', '地震！', '滑动推动所有方块，两个相同的数字会合并。每走一步会出现新方块——计时器也会越来越快地添加方块。棋盘填满且无法合并时，本回合结束。']
    },
    mazechomp: {
      en: ['Swipe to turn', 'Caught!', 'Ghost storm!', 'Swipe to steer the muncher through the maze and eat the dots. A big glowing dot makes the ghosts run away for a moment. Ghosts get faster and more numerous. A ghost catching you ends the round.'],
      fr: ['Glisse pour tourner', 'Attrapé !', 'Tempête de fantômes !', 'Glisse pour guider le glouton dans le labyrinthe et manger les points. Un gros point lumineux fait fuir les fantômes un moment. Les fantômes deviennent plus rapides et plus nombreux. Si un fantôme t’attrape, la partie est finie.'],
      es: ['Desliza para girar', '¡Atrapado!', '¡Tormenta de fantasmas!', 'Desliza para guiar al comilón por el laberinto y comer los puntos. Un punto grande brillante hace huir a los fantasmas un momento. Los fantasmas son cada vez más rápidos y numerosos. Si un fantasma te atrapa, la ronda termina.'],
      pt: ['Deslize para virar', 'Pego!', 'Tempestade de fantasmas!', 'Deslize para guiar o comilão pelo labirinto e comer os pontos. Um ponto grande brilhante faz os fantasmas fugirem por um momento. Os fantasmas ficam mais rápidos e numerosos. Se um fantasma te pegar, a rodada termina.'],
      ar: ['اسحب للالتفاف', 'تم الإمساك بك!', 'عاصفة أشباح!', 'اسحب لتوجيه الآكل داخل المتاهة وأكل النقاط. النقطة الكبيرة المضيئة تجعل الأشباح تهرب لحظة. تزداد الأشباح سرعة وعددًا. إذا أمسكك شبح تنتهي الجولة.'],
      tr: ['Dönmek için kaydır', 'Yakalandın!', 'Hayalet fırtınası!', 'Oburu labirentte yönlendirmek ve noktaları yemek için kaydır. Büyük parlayan nokta hayaletleri bir süre kaçırır. Hayaletler hızlanır ve çoğalır. Bir hayalet seni yakalarsa tur biter.'],
      vi: ['Vuốt để rẽ', 'Bị bắt!', 'Bão bóng ma!', 'Vuốt để dẫn nhân vật qua mê cung và ăn các chấm. Chấm lớn phát sáng khiến bóng ma bỏ chạy một lúc. Bóng ma ngày càng nhanh và đông hơn. Bị bóng ma bắt là kết thúc ván.'],
      id: ['Geser untuk berbelok', 'Tertangkap!', 'Badai hantu!', 'Geser untuk mengarahkan si pemakan di labirin dan memakan titik. Titik besar bercahaya membuat hantu kabur sebentar. Hantu makin cepat dan makin banyak. Jika hantu menangkapmu, ronde berakhir.'],
      ru: ['Свайп — поворот', 'Пойман!', 'Буря призраков!', 'Проводи, чтобы вести обжору по лабиринту и есть точки. Большая светящаяся точка ненадолго обращает призраков в бегство. Призраки становятся быстрее и многочисленнее. Если призрак поймает тебя, раунд окончен.'],
      de: ['Wischen zum Abbiegen', 'Erwischt!', 'Geistersturm!', 'Wische, um den Fresser durch das Labyrinth zu lenken und die Punkte zu fressen. Ein großer leuchtender Punkt lässt die Geister kurz fliehen. Die Geister werden schneller und zahlreicher. Erwischt dich ein Geist, endet die Runde.'],
      hi: ['मुड़ने को स्वाइप करें', 'पकड़े गए!', 'भूतों का तूफ़ान!', 'भूलभुलैया में आगे बढ़ने और बिंदु खाने के लिए स्वाइप करें। बड़ा चमकता बिंदु भूतों को कुछ देर भगा देता है। भूत तेज़ और ज़्यादा होते जाते हैं। भूत ने पकड़ा तो राउंड खत्म।'],
      zh: ['滑动转向', '被抓住了！', '幽灵风暴！', '滑动控制吃豆者在迷宫中前进并吃掉豆子。发光的大豆子会让幽灵暂时逃跑。幽灵会越来越快、越来越多。被幽灵抓住，本回合结束。']
    },
    bubblepop: {
      en: ['Aim with your finger, release to shoot', 'Bubbles too low!', 'Bubble flood!', 'Aim with your finger and release to shoot the bubble (it bounces off the walls). Three or more of the same color pop. The ceiling comes down by itself, faster and faster. A bubble crossing the red line ends the round.'],
      fr: ['Vise avec le doigt, lâche pour tirer', 'Bulles trop basses !', 'Déluge de bulles !', 'Vise avec le doigt et lâche pour tirer la bulle (elle rebondit sur les murs). Trois bulles ou plus de la même couleur éclatent. Le plafond descend tout seul, de plus en plus vite. Une bulle qui passe la ligne rouge termine la partie.'],
      es: ['Apunta con el dedo, suelta para disparar', '¡Burbujas muy abajo!', '¡Diluvio de burbujas!', 'Apunta con el dedo y suelta para disparar la burbuja (rebota en las paredes). Tres o más del mismo color explotan. El techo baja solo, cada vez más rápido. Una burbuja que cruza la línea roja termina la ronda.'],
      pt: ['Mire com o dedo, solte para atirar', 'Bolhas baixas demais!', 'Dilúvio de bolhas!', 'Mire com o dedo e solte para atirar a bolha (ela quica nas paredes). Três ou mais da mesma cor estouram. O teto desce sozinho, cada vez mais rápido. Uma bolha que passa a linha vermelha encerra a rodada.'],
      ar: ['صوّب بإصبعك ثم ارفعه للإطلاق', 'الفقاعات منخفضة جدًا!', 'طوفان فقاعات!', 'صوّب بإصبعك ثم ارفعه لإطلاق الفقاعة (ترتد عن الجدران). ثلاث فقاعات أو أكثر من اللون نفسه تنفجر. ينزل السقف وحده بسرعة متزايدة. فقاعة تعبر الخط الأحمر تنهي الجولة.'],
      tr: ['Parmağınla nişan al, bırakıp at', 'Balonlar çok aşağıda!', 'Balon seli!', 'Parmağınla nişan al ve balonu atmak için bırak (duvarlardan seker). Aynı renkten üç veya daha fazlası patlar. Tavan kendi kendine, giderek hızlanarak iner. Kırmızı çizgiyi geçen bir balon turu bitirir.'],
      vi: ['Ngắm bằng ngón tay, thả ra để bắn', 'Bóng xuống quá thấp!', 'Lũ bong bóng!', 'Ngắm bằng ngón tay rồi thả ra để bắn bong bóng (bóng nảy khỏi tường). Ba quả cùng màu trở lên sẽ nổ. Trần tự hạ xuống, ngày càng nhanh. Một quả bóng vượt vạch đỏ là kết thúc ván.'],
      id: ['Bidik dengan jari, lepas untuk menembak', 'Gelembung terlalu rendah!', 'Banjir gelembung!', 'Bidik dengan jari lalu lepas untuk menembak gelembung (memantul di dinding). Tiga atau lebih yang sewarna pecah. Langit-langit turun sendiri, makin cepat. Gelembung yang melewati garis merah mengakhiri ronde.'],
      ru: ['Целься пальцем, отпусти — выстрел', 'Пузыри слишком низко!', 'Потоп пузырей!', 'Целься пальцем и отпусти, чтобы выстрелить пузырём (он отскакивает от стен). Три и больше одного цвета лопаются. Потолок опускается сам, всё быстрее. Пузырь за красной линией завершает раунд.'],
      de: ['Mit dem Finger zielen, loslassen', 'Blasen zu tief!', 'Blasenflut!', 'Ziele mit dem Finger und lass los, um die Blase zu schießen (sie prallt von den Wänden ab). Drei oder mehr gleiche Farben platzen. Die Decke senkt sich von selbst, immer schneller. Eine Blase hinter der roten Linie beendet die Runde.'],
      hi: ['उँगली से निशाना, छोड़ें तो फायर', 'बुलबुले बहुत नीचे!', 'बुलबुलों की बाढ़!', 'उँगली से निशाना लगाएँ और बुलबुला मारने के लिए छोड़ें (दीवारों से उछलता है)। एक रंग के तीन या ज़्यादा बुलबुले फूटते हैं। छत खुद नीचे आती है, तेज़ होते हुए। लाल रेखा पार करने वाला बुलबुला राउंड खत्म करता है।'],
      zh: ['手指瞄准，松开发射', '泡泡太低了！', '泡泡洪水！', '用手指瞄准，松开即可发射泡泡（会在墙上反弹）。三个或以上同色泡泡会消除。天花板会自己下降，而且越来越快。有泡泡越过红线，本回合结束。']
    },
    gemswap: {
      en: ['Swipe a gem to swap it', 'Time’s up!', 'Gem quake!', 'Swipe a gem toward a neighbour to swap them. Line up three or more of the same gem to clear them and refill the time bar. The bar drains faster and faster. When it is empty, the round ends.'],
      fr: ['Glisse un joyau pour l’échanger', 'Temps écoulé !', 'Séisme de joyaux !', 'Glisse un joyau vers un voisin pour les échanger. Aligne trois joyaux identiques ou plus pour les effacer et remplir la barre de temps. La barre se vide de plus en plus vite. Quand elle est vide, la partie est finie.'],
      es: ['Desliza una gema para cambiarla', '¡Se acabó el tiempo!', '¡Terremoto de gemas!', 'Desliza una gema hacia una vecina para intercambiarlas. Alinea tres o más gemas iguales para borrarlas y llenar la barra de tiempo. La barra se vacía cada vez más rápido. Cuando se vacía, la ronda termina.'],
      pt: ['Deslize uma gema para trocar', 'Tempo esgotado!', 'Terremoto de gemas!', 'Deslize uma gema na direção de uma vizinha para trocá-las. Alinhe três ou mais gemas iguais para apagá-las e encher a barra de tempo. A barra esvazia cada vez mais rápido. Quando esvaziar, a rodada termina.'],
      ar: ['اسحب جوهرة لتبديلها', 'انتهى الوقت!', 'زلزال الجواهر!', 'اسحب جوهرة نحو جارتها لتبديلهما. صفّ ثلاث جواهر متطابقة أو أكثر لمسحها وملء شريط الوقت. يفرغ الشريط أسرع فأسرع. عندما يفرغ تنتهي الجولة.'],
      tr: ['Değiştirmek için taşı kaydır', 'Süre bitti!', 'Mücevher depremi!', 'Bir mücevheri komşusuyla yer değiştirmek için ona doğru kaydır. Aynı mücevherden üç veya daha fazlasını dizerek sil ve süre çubuğunu doldur. Çubuk giderek hızlı boşalır. Boşalınca tur biter.'],
      vi: ['Vuốt viên ngọc để đổi chỗ', 'Hết giờ!', 'Động đất ngọc!', 'Vuốt một viên ngọc về phía viên bên cạnh để đổi chỗ. Xếp ba viên giống nhau trở lên để xóa và nạp lại thanh thời gian. Thanh thời gian cạn ngày càng nhanh. Cạn hết là kết thúc ván.'],
      id: ['Geser permata untuk menukar', 'Waktu habis!', 'Gempa permata!', 'Geser permata ke arah tetangganya untuk menukarnya. Jajarkan tiga atau lebih permata sama untuk menghapusnya dan mengisi bar waktu. Bar terkuras makin cepat. Saat kosong, ronde berakhir.'],
      ru: ['Свайп камня — обмен', 'Время вышло!', 'Каменетрясение!', 'Проведи камень к соседнему, чтобы поменять их местами. Собери в ряд три и больше одинаковых камня, чтобы убрать их и пополнить шкалу времени. Шкала пустеет всё быстрее. Когда она пуста, раунд окончен.'],
      de: ['Edelstein wischen zum Tauschen', 'Zeit um!', 'Edelsteinbeben!', 'Wische einen Edelstein zu seinem Nachbarn, um beide zu tauschen. Reihe drei oder mehr gleiche Steine auf, um sie zu löschen und den Zeitbalken zu füllen. Der Balken leert sich immer schneller. Ist er leer, endet die Runde.'],
      hi: ['बदलने को रत्न स्वाइप करें', 'समय खत्म!', 'रत्न भूकंप!', 'रत्न को पड़ोसी की ओर स्वाइप करके जगह बदलें। एक जैसे तीन या ज़्यादा रत्न लाइन में लाएँ, वे मिटते हैं और समय पट्टी भरती है। पट्टी तेज़ी से खाली होती है। खाली हुई तो राउंड खत्म।'],
      zh: ['滑动宝石进行交换', '时间到！', '宝石地震！', '把宝石向相邻宝石滑动即可交换。三个或以上相同宝石连成一线即可消除，并补充时间条。时间条消耗越来越快。时间条耗尽，本回合结束。']
    },
    memoflip: {
      en: ['Tap two cards to find a pair', 'Time’s up!', 'Whirlwind!', 'Look at the cards, then tap two cards: if they match they stay open. Find every pair before the time bar runs out; a wrong pair costs time. Each new board is bigger.'],
      fr: ['Touche deux cartes pour une paire', 'Temps écoulé !', 'Tourbillon !', 'Regarde les cartes, puis touche deux cartes : si elles sont pareilles, elles restent ouvertes. Trouve toutes les paires avant la fin de la barre de temps ; une mauvaise paire coûte du temps. Chaque nouveau plateau est plus grand.'],
      es: ['Toca dos cartas para una pareja', '¡Se acabó el tiempo!', '¡Torbellino!', 'Mira las cartas y toca dos: si son iguales, quedan abiertas. Encuentra todas las parejas antes de que se acabe la barra de tiempo; una pareja equivocada cuesta tiempo. Cada tablero nuevo es más grande.'],
      pt: ['Toque duas cartas para um par', 'Tempo esgotado!', 'Redemoinho!', 'Olhe as cartas e toque duas: se forem iguais, ficam abertas. Encontre todos os pares antes que a barra de tempo acabe; um par errado custa tempo. Cada novo tabuleiro é maior.'],
      ar: ['المس بطاقتين لإيجاد زوج', 'انتهى الوقت!', 'زوبعة!', 'انظر إلى البطاقات ثم المس بطاقتين: إذا تطابقتا تبقيان مفتوحتين. جد كل الأزواج قبل نفاد شريط الوقت؛ الزوج الخاطئ يكلّف وقتًا. كل لوحة جديدة أكبر.'],
      tr: ['Çift bulmak için iki karta dokun', 'Süre bitti!', 'Kasırga!', 'Kartlara bak, sonra iki karta dokun: aynıysa açık kalırlar. Süre çubuğu bitmeden tüm çiftleri bul; yanlış çift süre kaybettirir. Her yeni tahta daha büyüktür.'],
      vi: ['Chạm hai thẻ để tìm cặp', 'Hết giờ!', 'Lốc xoáy!', 'Nhìn các thẻ, rồi chạm hai thẻ: nếu giống nhau chúng sẽ mở. Tìm hết các cặp trước khi thanh thời gian cạn; chọn sai sẽ mất thời gian. Mỗi bàn mới lớn hơn.'],
      id: ['Ketuk dua kartu untuk pasangan', 'Waktu habis!', 'Angin puyuh!', 'Lihat kartunya, lalu ketuk dua kartu: jika sama, keduanya tetap terbuka. Temukan semua pasangan sebelum bar waktu habis; pasangan salah memakan waktu. Setiap papan baru lebih besar.'],
      ru: ['Тап по двум картам — пара', 'Время вышло!', 'Вихрь!', 'Посмотри на карты, затем открой две: если они одинаковые, они остаются открытыми. Найди все пары, пока не кончилась шкала времени; неверная пара отнимает время. Каждое новое поле больше.'],
      de: ['Zwei Karten tippen: ein Paar finden', 'Zeit um!', 'Wirbelsturm!', 'Schau dir die Karten an und tippe dann zwei an: Sind sie gleich, bleiben sie offen. Finde alle Paare, bevor der Zeitbalken leer ist; ein falsches Paar kostet Zeit. Jedes neue Feld ist größer.'],
      hi: ['जोड़ी के लिए दो कार्ड टैप करें', 'समय खत्म!', 'बवंडर!', 'कार्ड देखें, फिर दो कार्ड टैप करें: एक जैसे हों तो खुले रहते हैं। समय पट्टी खत्म होने से पहले सारी जोड़ियाँ खोजें; गलत जोड़ी समय घटाती है। हर नया बोर्ड बड़ा होता है।'],
      zh: ['点击两张牌找出一对', '时间到！', '旋风！', '先记住牌面，再点击两张牌：相同则保持翻开。在时间条耗尽前找出所有配对；配错会扣时间。每个新牌局都会更大。']
    },
    echopads: {
      en: ['Watch, then repeat the colors', 'Wrong pad!', 'Power cut!', 'Watch the pads light up, then tap them in the same order. Each time you get it right the sequence grows by one and plays faster. A wrong pad — or waiting too long — ends the round.', 'Too slow!'],
      fr: ['Regarde, puis répète les couleurs', 'Mauvaise touche !', 'Coupure de courant !', 'Regarde les pastilles s’allumer, puis touche-les dans le même ordre. À chaque réussite, la suite s’allonge d’une couleur et va plus vite. Une mauvaise pastille — ou trop d’attente — termine la partie.', 'Trop lent !'],
      es: ['Mira y repite los colores', '¡Botón equivocado!', '¡Apagón!', 'Mira cómo se encienden los botones y tócalos en el mismo orden. Cada acierto alarga la secuencia en uno y la acelera. Un botón equivocado, o esperar demasiado, termina la ronda.', '¡Demasiado lento!'],
      pt: ['Observe e repita as cores', 'Botão errado!', 'Apagão!', 'Veja os botões acenderem e toque-os na mesma ordem. A cada acerto a sequência cresce um passo e fica mais rápida. Um botão errado — ou esperar demais — encerra a rodada.', 'Lento demais!'],
      ar: ['شاهد ثم كرّر الألوان', 'زر خاطئ!', 'انقطاع الكهرباء!', 'شاهد الأزرار تضيء ثم المسها بالترتيب نفسه. مع كل نجاح تطول السلسلة خطوة وتصبح أسرع. زر خاطئ أو انتظار طويل ينهي الجولة.', 'بطيء جدًا!'],
      tr: ['İzle, sonra renkleri tekrarla', 'Yanlış tuş!', 'Elektrik kesintisi!', 'Tuşların yanışını izle, sonra aynı sırayla dokun. Her doğruda dizi bir adım uzar ve hızlanır. Yanlış tuş — ya da çok beklemek — turu bitirir.', 'Çok yavaş!'],
      vi: ['Xem rồi lặp lại màu', 'Sai nút!', 'Mất điện!', 'Xem các nút sáng lên, rồi chạm theo đúng thứ tự. Mỗi lần đúng, chuỗi dài thêm một và nhanh hơn. Chạm sai nút — hoặc chờ quá lâu — là kết thúc ván.', 'Chậm quá!'],
      id: ['Lihat, lalu ulangi warnanya', 'Tombol salah!', 'Listrik padam!', 'Lihat tombol menyala, lalu ketuk dengan urutan yang sama. Setiap benar, urutan bertambah satu dan makin cepat. Tombol salah — atau menunggu terlalu lama — mengakhiri ronde.', 'Terlalu lambat!'],
      ru: ['Смотри и повторяй цвета', 'Не та кнопка!', 'Отключение тока!', 'Смотри, как загораются кнопки, и нажимай их в том же порядке. После каждого успеха цепочка растёт на один шаг и ускоряется. Неверная кнопка — или долгое ожидание — завершает раунд.', 'Слишком медленно!'],
      de: ['Zuschauen, dann Farben wiederholen', 'Falsches Feld!', 'Stromausfall!', 'Sieh zu, wie die Felder aufleuchten, und tippe sie in derselben Reihenfolge. Nach jedem Erfolg wird die Folge um eins länger und schneller. Ein falsches Feld — oder zu langes Warten — beendet die Runde.', 'Zu langsam!'],
      hi: ['देखें, फिर रंग दोहराएँ', 'गलत बटन!', 'बिजली गुल!', 'बटनों को जलते देखें, फिर उसी क्रम में टैप करें। हर सही बार क्रम एक बढ़ता है और तेज़ होता है। गलत बटन — या ज़्यादा इंतज़ार — राउंड खत्म करता है।', 'बहुत धीमे!'],
      zh: ['先看，再重复颜色', '按错了！', '停电了！', '看色块依次亮起，再按相同顺序点击。每答对一次，序列加长一步并变快。按错——或等待太久——本回合结束。', '太慢了！']
    },
    pianokeys: {
      en: ['Tap the black keys', 'Wrong key!', 'Strings snap!', 'Tap each black key as it scrolls down, from the bottom up — never the white ones. The music speeds up. A wrong key, or a black key slipping past, ends the round.', 'Missed one!'],
      fr: ['Touche les touches noires', 'Mauvaise touche !', 'Les cordes cassent !', 'Touche chaque touche noire qui descend, de bas en haut — jamais les blanches. La musique accélère. Une mauvaise touche, ou une touche noire qui passe, termine la partie.', 'Une de ratée !'],
      es: ['Toca las teclas negras', '¡Tecla equivocada!', '¡Se rompen las cuerdas!', 'Toca cada tecla negra mientras baja, de abajo arriba; nunca las blancas. La música se acelera. Una tecla equivocada, o una negra que se escapa, termina la ronda.', '¡Se te escapó una!'],
      pt: ['Toque as teclas pretas', 'Tecla errada!', 'As cordas arrebentam!', 'Toque cada tecla preta enquanto desce, de baixo para cima — nunca as brancas. A música acelera. Uma tecla errada, ou uma preta que passa, encerra a rodada.', 'Perdeu uma!'],
      ar: ['المس المفاتيح السوداء', 'مفتاح خاطئ!', 'انقطعت الأوتار!', 'المس كل مفتاح أسود أثناء نزوله، من الأسفل إلى الأعلى — ولا تلمس الأبيض أبدًا. تتسارع الموسيقى. مفتاح خاطئ أو مفتاح أسود يفوتك ينهي الجولة.', 'فاتك واحد!'],
      tr: ['Siyah tuşlara dokun', 'Yanlış tuş!', 'Teller koptu!', 'Aşağı kayan her siyah tuşa aşağıdan yukarı dokun — beyazlara asla. Müzik hızlanır. Yanlış tuş ya da kaçan bir siyah tuş turu bitirir.', 'Birini kaçırdın!'],
      vi: ['Chạm phím đen', 'Sai phím!', 'Đứt dây đàn!', 'Chạm từng phím đen khi nó trôi xuống, từ dưới lên — không bao giờ chạm phím trắng. Nhạc ngày càng nhanh. Chạm sai phím, hoặc để lọt một phím đen, là kết thúc ván.', 'Lọt một phím!'],
      id: ['Ketuk tuts hitam', 'Tuts salah!', 'Senar putus!', 'Ketuk setiap tuts hitam yang turun, dari bawah ke atas — jangan yang putih. Musik makin cepat. Tuts salah, atau tuts hitam yang terlewat, mengakhiri ronde.', 'Ada yang terlewat!'],
      ru: ['Нажимай чёрные клавиши', 'Не та клавиша!', 'Струны лопнули!', 'Нажимай каждую чёрную клавишу, пока она едет вниз, снизу вверх — никогда белые. Музыка ускоряется. Неверная клавиша или пропущенная чёрная завершает раунд.', 'Пропущена!'],
      de: ['Tippe die schwarzen Tasten', 'Falsche Taste!', 'Saiten gerissen!', 'Tippe jede schwarze Taste, während sie herunterläuft, von unten nach oben — nie die weißen. Die Musik wird schneller. Eine falsche Taste oder eine verpasste schwarze beendet die Runde.', 'Eine verpasst!'],
      hi: ['काली कीज़ टैप करें', 'गलत की!', 'तार टूट गए!', 'नीचे आती हर काली की को नीचे से ऊपर टैप करें — सफ़ेद कभी नहीं। संगीत तेज़ होता जाता है। गलत की या छूटी काली की राउंड खत्म करती है।', 'एक छूट गई!'],
      zh: ['点击黑色琴键', '点错了！', '琴弦断了！', '黑色琴键向下滚动时，从下往上逐个点击——不要点白色。音乐会越来越快。点错或漏掉一个黑键，本回合结束。', '漏掉了一个！']
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
      var gs = null;
      cv.addEventListener('pointerdown', function (e) {
        e.preventDefault(); rect = st.getBoundingClientRect();
        if (e.pointerType === 'mouse' && e.button) return;
        if (phase !== 'play') { if (phase === 'idle') nudge(); return; }
        try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        var p = pt(e);
        if (gest === 'tap' || gest === 'aim') { did('tap', p[0], p[1]); gs = null; return; } // one-tap games act on the touch itself
        if (gest === 'drag') { count(); gs = { id: e.pointerId }; g.down(p[0], p[1]); return; }
        gs = { x: p[0], y: p[1], id: e.pointerId, done: false };
      });
      cv.addEventListener('pointermove', function (e) {
        if (!gs || e.pointerId !== gs.id) return;
        if (gest === 'drag') {
          if (phase !== 'play') { gs = null; return; }
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
        if (gest === 'drag') { if (g.up) g.up(); return; }
        if (!s.done && gest === 'lr') did(s.x < W / 2 ? 'left' : 'right', s.x, s.y); // a tap on the left / right half
        else if (!s.done && gest === 'swipe4') did('tap', s.x, s.y); // v2850: a short touch without movement = tap (rotate, …)
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', function () { if (gs && gest === 'drag' && g.up) g.up(); gs = null; });
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
        if (gest === 'drag') { if (g.key) { count(); g.key(k); } return; }
        if (gest === 'aim') { if (g.key) { count(); g.key(k); } return; }
        did(gest === 'tap' ? 'tap' : k, W / 2, H / 2);
      };
      document.addEventListener('keydown', onKey);
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


  /* ================================================================== 1. BLOCK FALL — the falling-blocks puzzle: drag the block
     left / right (it follows the finger, one cell at a time), tap to turn it, flick down to drop it. Full rows clear.
     Gravity speeds up with the time played. Fair: a ghost shows where the block lands; the next block is shown. */
  boot('blockfall', function (A) {
    var W, H, T, dpr, bg, cs, ox, oy, NC = 10, NR = 16, spr = [], ghostS = null;
    var SH = [
      { n: 4, c: [[0, 1], [1, 1], [2, 1], [3, 1]] }, { n: 3, c: [[0, 0], [0, 1], [1, 1], [2, 1]] }, { n: 3, c: [[2, 0], [0, 1], [1, 1], [2, 1]] },
      { n: 2, c: [[0, 0], [1, 0], [0, 1], [1, 1]] }, { n: 3, c: [[1, 0], [2, 0], [0, 1], [1, 1]] }, { n: 3, c: [[1, 0], [0, 1], [1, 1], [2, 1]] },
      { n: 3, c: [[0, 0], [1, 0], [1, 1], [2, 1]] }];
    var PC = [['#A5F3FC', '#06B6D4', '#0E7490'], ['#BFDBFE', '#3B82F6', '#1E40AF'], ['#FED7AA', '#F97316', '#9A3412'], ['#FEF08A', '#EAB308', '#854D0E'],
      ['#BBF7D0', '#22C55E', '#166534'], ['#E9D5FF', '#A855F7', '#6B21A8'], ['#FECDD3', '#F43F5E', '#9F1239'], ['#E2E8F0', '#64748B', '#334155']];
    var grid = [], cur = null, nxt = 0, fallT = 0, lockT = 0, clr = null, dead = 0, won = 0, storm = null, drag = null, ai = null, aiT = 0, t = 0, bag = [];
    function blank() { grid = []; for (var r = 0; r < NR; r++) { var row = []; for (var c = 0; c < NC; c++) row.push(0); grid.push(row); } }
    function draw7() { if (!bag.length) { bag = [0, 1, 2, 3, 4, 5, 6]; for (var i = 6; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, x = bag[i]; bag[i] = bag[j]; bag[j] = x; } } return bag.pop(); }
    function cells(p, rot, px, py) {
      var s = SH[p.t], out = [], r = rot === undefined ? p.r : rot;
      for (var i = 0; i < 4; i++) {
        var x = s.c[i][0], y = s.c[i][1];
        for (var k = 0; k < (s.n === 2 ? 0 : r); k++) { var nx = s.n - 1 - y; y = x; x = nx; }
        out.push([(px === undefined ? p.x : px) + x, (py === undefined ? p.y : py) + y]);
      }
      return out;
    }
    function fits(cl) { for (var i = 0; i < 4; i++) { var x = cl[i][0], y = cl[i][1]; if (x < 0 || x >= NC || y >= NR) return false; if (y >= 0 && grid[y][x]) return false; } return true; }
    function spawn(live) {
      cur = { t: nxt, r: 0, x: 3, y: -1 }; nxt = draw7(); fallT = 0; lockT = 0; ai = null;
      if (SH[cur.t].n === 2) cur.x = 4;
      if (!fits(cells(cur))) {
        if (A.live() && live) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); } return; }
        blank(); A.burst(W / 2, oy + NR * cs / 2, 20, ['#C4B5FD', '#FDE68A', '#fff'], 200, 0.7, 3.2);
      }
      if (A.idle()) ai = plan();
    }
    function tryMove(dx, dy) { if (!cur) return false; var cl = cells(cur, cur.r, cur.x + dx, cur.y + dy); if (!fits(cl)) return false; cur.x += dx; cur.y += dy; if (dx) lockT = Math.min(lockT, 0.2); return true; }
    function rotate() {
      if (!cur || SH[cur.t].n === 2) return;
      var nr = (cur.r + 1) % 4, kicks = [0, -1, 1, -2, 2];
      for (var i = 0; i < kicks.length; i++) { if (fits(cells(cur, nr, cur.x + kicks[i], cur.y))) { cur.r = nr; cur.x += kicks[i]; lockT = Math.min(lockT, 0.2); return; } }
      if (fits(cells(cur, nr, cur.x, cur.y - 1))) { cur.r = nr; cur.y--; }
    }
    function dropY() { var y = cur.y; while (fits(cells(cur, cur.r, cur.x, y + 1))) y++; return y; }
    function lock() {
      var cl = cells(cur), top = false;
      for (var i = 0; i < 4; i++) { if (cl[i][1] < 0) top = true; else grid[cl[i][1]][cl[i][0]] = cur.t + 1; }
      cur = null;
      if (top) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); } return; } blank(); }
      var rows = [];
      for (var r = 0; r < NR; r++) { var full = true; for (var c = 0; c < NC; c++) if (!grid[r][c]) { full = false; break; } if (full) rows.push(r); }
      if (rows.length) {
        clr = { rows: rows, t: 0 };
        rows.forEach(function (r) { A.burst(ox + NC * cs / 2, oy + (r + 0.5) * cs, 6 + rows.length * 3, ['#FFFFFF', '#FDE68A', '#A5F3FC'], 220, 0.5, 3, 0); });
        if (rows.length >= 3) { A.ring(ox + NC * cs / 2, oy + (rows[0] + 0.5) * cs, NC * cs * 0.6, '#FDE68A'); A.shake(0.12); }
      } else spawn(true);
    }
    function hard() { if (!cur) return; var y = dropY(), d = y - cur.y; cur.y = y; if (d > 1) A.ring(ox + (cur.x + 1.5) * cs, oy + (y + 1.5) * cs, cs * 1.4, '#E0F2FE'); lock(); }
    // attract mode: a small planner (holes, height, bumps, lines) places each block
    function plan() {
      var best = null;
      for (var r = 0; r < 4; r++) for (var x = -2; x < NC; x++) {
        var p = { t: cur.t, r: r, x: x, y: cur.y };
        if (!fits(cells(p))) continue;
        while (fits(cells(p, r, x, p.y + 1))) p.y++;
        var cl = cells(p), g2 = grid.map(function (row) { return row.slice(); }), ok = true;
        cl.forEach(function (q) { if (q[1] < 0) ok = false; else g2[q[1]][q[0]] = 1; });
        if (!ok) continue;
        var lines = 0, holes = 0, agg = 0, bump = 0, hs = [];
        for (var rr2 = 0; rr2 < NR; rr2++) if (g2[rr2].every(function (v) { return v; })) lines++;
        for (var c = 0; c < NC; c++) { var h = 0, seen = false; for (var y2 = 0; y2 < NR; y2++) { if (g2[y2][c]) { if (!seen) h = NR - y2; seen = true; } else if (seen) holes++; } hs.push(h); agg += h; }
        for (c = 0; c < NC - 1; c++) bump += Math.abs(hs[c] - hs[c + 1]);
        var sc = -0.51 * agg + 0.76 * lines - 0.36 * holes - 0.18 * bump + Math.random() * 0.3;
        if (!best || sc > best.sc) best = { sc: sc, r: r, x: x };
      }
      return best;
    }
    function blockS(i) {
      var p = PC[i];
      return mkc(cs, cs, dpr, function (c, w) {
        rr(c, 0.5, 0.5, w - 1, w - 1, w * 0.2); c.fillStyle = lg(c, 0, 0, w, w, [p[0], p[1], p[2]]); c.fill();
        rr(c, w * 0.18, w * 0.14, w * 0.64, w * 0.3, w * 0.12); c.fillStyle = 'rgba(255,255,255,.38)'; c.fill();
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; rr(c, 0.5, 0.5, w - 1, w - 1, w * 0.2); c.stroke();
      });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top;
        cs = Math.floor(Math.min((H - T - 10) / NR, (W - 24) / (NC + 3.2)));
        cs = Math.max(8, cs);
        ox = Math.round((W - cs * NC) / 2 - cs * 1.4); oy = Math.round(T + (H - T - cs * NR) / 2);
        spr = PC.map(function (p, i) { return blockS(i); });
        ghostS = mkc(cs, cs, dpr, function (c, w) { rr(c, 2, 2, w - 4, w - 4, w * 0.2); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.5; c.setLineDash([3, 3]); c.stroke(); });
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0B1026', '#1B1747', '#0F0B2E']); c.fillRect(0, 0, W, H);
          stars(c, W, H, A.lite ? 30 : 70);
          rr(c, ox - 5, oy - 5, NC * cs + 10, NR * cs + 10, 10); c.fillStyle = 'rgba(8,10,30,.85)'; c.fill(); c.strokeStyle = '#6366F1'; c.lineWidth = 2; c.stroke();
          c.strokeStyle = 'rgba(148,163,184,.08)'; c.lineWidth = 1; c.beginPath();
          for (var i = 1; i < NC; i++) { c.moveTo(ox + i * cs + 0.5, oy); c.lineTo(ox + i * cs + 0.5, oy + NR * cs); }
          for (i = 1; i < NR; i++) { c.moveTo(ox, oy + i * cs + 0.5); c.lineTo(ox + NC * cs, oy + i * cs + 0.5); }
          c.stroke();
          var px = ox + NC * cs + 10; rr(c, px, oy, cs * 2.8, cs * 2.8, 8); c.fillStyle = 'rgba(8,10,30,.7)'; c.fill(); c.strokeStyle = 'rgba(99,102,241,.6)'; c.stroke();
        });
      },
      reset: function (live) { blank(); bag = []; nxt = draw7(); dead = 0; won = 0; storm = null; clr = null; drag = null; spawn(live); },
      step: function (dt, live) {
        t += dt;
        if (storm) {
          storm.t += dt; storm.k += dt;
          while (storm.k > 0.06 && storm.n < NR) { storm.k -= 0.06; storm.n++; grid.shift(); var row = []; for (var c = 0; c < NC; c++) row.push(Math.random() < 0.9 ? 8 : 0); grid.push(row); }
          if (!storm.hit && storm.t > 0.9) { storm.hit = 1; A.explode(ox + NC * cs / 2, oy + NR * cs * 0.4, 1.5); }
          return;
        }
        if (dead || won) return;
        if (clr) {
          clr.t += dt;
          if (clr.t > 0.22) { clr.rows.forEach(function (r) { grid.splice(r, 1); var row = []; for (var c = 0; c < NC; c++) row.push(0); grid.unshift(row); }); clr = null; spawn(live); }
          return;
        }
        if (!cur) return;
        var lv = live ? A.lv() : 0, iv = A.idle() ? 0.32 : Math.max(0.11, 0.78 - 0.56 * lv);
        if (A.idle() && ai) {
          aiT += dt;
          if (aiT > 0.09) { aiT = 0; if (cur.r !== ai.r) rotate(); else if (cur.x < ai.x) tryMove(1, 0); else if (cur.x > ai.x) tryMove(-1, 0); else hard(); }
          if (!cur) return;
        }
        fallT += dt;
        if (fallT >= iv) { fallT = 0; tryMove(0, 1); }
        if (!fits(cells(cur, cur.r, cur.x, cur.y + 1))) { lockT += dt; if (lockT > 0.42) lock(); } else lockT = 0;
      },
      draw: function (c) {
        A.bg(bg);
        var r, x;
        for (r = 0; r < NR; r++) {
          var flashRow = clr && clr.rows.indexOf(r) >= 0;
          for (x = 0; x < NC; x++) {
            var v = grid[r][x]; if (!v) continue;
            if (flashRow) { c.globalAlpha = 1 - clr.t / 0.22; c.fillStyle = '#fff'; c.fillRect(ox + x * cs, oy + r * cs, cs, cs); c.globalAlpha = 1; continue; }
            c.drawImage(spr[v - 1], ox + x * cs, oy + r * cs, cs, cs);
          }
        }
        if (cur && !dead && !storm) {
          var gy = dropY(), cl = cells(cur, cur.r, cur.x, gy), i;
          for (i = 0; i < 4; i++) if (cl[i][1] >= 0) c.drawImage(ghostS, ox + cl[i][0] * cs, oy + cl[i][1] * cs, cs, cs);
          cl = cells(cur);
          var sm = Math.min(1, fallT / 0.08) * 0;
          for (i = 0; i < 4; i++) if (cl[i][1] >= 0) c.drawImage(spr[cur.t], ox + cl[i][0] * cs, oy + (cl[i][1] + sm) * cs, cs, cs);
        }
        // next block
        var s = SH[nxt], q = cs * 0.55, px = ox + NC * cs + 10 + cs * 1.4, py = oy + cs * 1.4, mx = 0, my = 0, nx2 = 9, ny2 = 9;
        s.c.forEach(function (p) { mx = Math.max(mx, p[0]); my = Math.max(my, p[1]); nx2 = Math.min(nx2, p[0]); ny2 = Math.min(ny2, p[1]); });
        s.c.forEach(function (p) { c.drawImage(spr[nxt], px + (p[0] - (mx + nx2 + 1) / 2) * q, py + (p[1] - (my + ny2 + 1) / 2) * q, q, q); });
        if (won) { c.globalAlpha = Math.max(0, 0.5 - won * 0.2); c.fillStyle = '#FDE68A'; c.fillRect(ox, oy, NC * cs, NR * cs); c.globalAlpha = 1; }
      },
      down: function (x, y) { if (dead || !cur) return; drag = { x: x, y: y, x0: x, y0: y, t: performance.now(), mv: 0, dr: 0 }; },
      move: function (x, y) {
        if (!drag || dead || !cur) return;
        var step = cs * 0.9;
        while (x - drag.x > step) { drag.x += step; drag.mv = 1; tryMove(1, 0); }
        while (drag.x - x > step) { drag.x -= step; drag.mv = 1; tryMove(-1, 0); }
        if (!drag.dr && y - drag.y0 > cs * 2.4 && Math.abs(y - drag.y0) > Math.abs(x - drag.x0) * 1.3) { drag.dr = 1; drag.mv = 1; hard(); }
      },
      up: function () { if (!drag) return; var d = drag; drag = null; if (!d.mv && performance.now() - d.t < 450 && cur && !dead) { rotate(); K.sfx('act'); } },
      key: function (k) { if (dead || !cur) return; if (k === 'left') tryMove(-1, 0); else if (k === 'right') tryMove(1, 0); else if (k === 'up') rotate(); else if (k === 'down') hard(); },
      boom: function () { storm = { t: 0, k: 0, n: 0 }; cur = null; drag = null; A.flash(0.3); A.shake(0.3); },
      win: function () { won = 0.001; drag = null; A.burst(ox + NC * cs / 2, oy + NR * cs / 2, 22, ['#FDE68A', '#FFFFFF', '#A5F3FC'], 200, 0.7, 3); },
      dbg: function () { return { grid: grid, cur: cur, nxt: nxt, cs: cs, ox: ox, oy: oy, dead: dead, clr: !!clr }; }
    };
  }, 'drag', 0.62);

  /* ================================================================== 2. MERGE 2048 — swipe to slide every tile, equal tiles
     merge. Each move brings a new tile and the clock brings one too (faster and faster). Full board + no merge = end. */
  boot('merge2048', function (A) {
    var W, H, T, dpr, bg, gs, cs, gap, ox, oy, tiles = [], grid = [], dead = 0, won = 0, quake = null, clk = 0, t = 0, aiT = 0, best = 1, cache = {};
    var COL = ['#EDE9FE', '#E0E7FF', '#FDE68A', '#FDBA74', '#FB923C', '#F87171', '#F43F5E', '#FACC15', '#EAB308', '#A3E635', '#22D3EE', '#818CF8', '#C084FC', '#F472B6'];
    function idx(d, line, i) { return d === 0 ? line * 4 + i : d === 1 ? line * 4 + 3 - i : d === 2 ? i * 4 + line : (3 - i) * 4 + line; }
    function empty() { var e = []; for (var i = 0; i < 16; i++) if (!grid[i]) e.push(i); return e; }
    function add() {
      var e = empty(); if (!e.length) return false;
      var i = e[(Math.random() * e.length) | 0], tl = { v: Math.random() < 0.1 ? 2 : 1, i: i, x: i % 4, y: (i / 4) | 0, nw: 0.001, mg: 0, gone: 0 };
      grid[i] = tl; tiles.push(tl); return true;
    }
    function canMove() {
      if (empty().length) return true;
      for (var i = 0; i < 16; i++) { var v = grid[i].v; if (i % 4 < 3 && grid[i + 1].v === v) return true; if (i < 12 && grid[i + 4].v === v) return true; }
      return false;
    }
    function check() { if (!canMove()) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); } } else if (A.idle()) setTimeout(function () { if (A.idle()) reset0(); }, 600); } }
    function move(d) {
      var moved = false, merges = 0;
      for (var line = 0; line < 4; line++) {
        var cl = [], list = [], i;
        for (i = 0; i < 4; i++) { cl.push(idx(d, line, i)); if (grid[cl[i]]) list.push(grid[cl[i]]); }
        cl.forEach(function (q) { grid[q] = null; });
        var k = 0, o = 0;
        while (k < list.length) {
          var a = list[k], b = list[k + 1], c = cl[o];
          if (b && b.v === a.v) {
            b.i = c; b.gone = 0.001; a.v++; a.mg = 0.001; merges++; moved = true; k += 2;
            if (a.v > best) best = a.v;
            A.burst(ox + (c % 4 + 0.5) * (cs + gap), oy + (((c / 4) | 0) + 0.5) * (cs + gap), 4 + Math.min(10, a.v), [COL[Math.min(13, a.v - 1)], '#fff'], 120, 0.45, 2.6, 0);
          } else k++;
          if (a.i !== c) moved = true;
          a.i = c; grid[c] = a; o++;
        }
      }
      if (moved) { add(); check(); }
      return moved;
    }
    function reset0() { tiles = []; grid = []; for (var i = 0; i < 16; i++) grid.push(null); add(); add(); clk = 0; best = 1; }
    function tileS(v) {
      var key = v + '|' + cs; if (cache[key]) return cache[key];
      var col = COL[Math.min(13, v - 1)], n = String(Math.pow(2, v));
      cache[key] = mkc(cs, cs, dpr, function (c, w) {
        rr(c, 0, 0, w, w, w * 0.16); c.fillStyle = lg(c, 0, 0, 0, w, ['#FFFFFF', col, col]); c.fill();
        rr(c, 0, w * 0.86, w, w * 0.14, w * 0.08); c.fillStyle = 'rgba(0,0,0,.12)'; c.fill();
        var fs = w * (n.length <= 2 ? 0.46 : n.length === 3 ? 0.38 : n.length === 4 ? 0.3 : 0.24);
        c.font = '900 ' + fs + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = v <= 3 ? '#4C1D95' : '#FFFFFF'; if (v > 3) { c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 3; }
        c.fillText(n, w / 2, w * 0.53);
      });
      return cache[key];
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; cache = {};
        gs = Math.floor(Math.min(W - 28, (H - T) - 34, 440)); gap = Math.max(4, Math.round(gs * 0.025)); cs = Math.floor((gs - gap * 5) / 4); gs = cs * 4 + gap * 5;
        ox = Math.round((W - gs) / 2) + gap; oy = Math.round(T + (H - T - gs - 16) / 2) + gap;
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#1E1B4B', '#312E81', '#1E1B4B']); c.fillRect(0, 0, W, H);
          circ(c, W / 2, oy + gs / 2, gs * 0.9, rg(c, W / 2, oy + gs / 2, gs * 0.9, ['rgba(250,204,21,.14)', 'rgba(250,204,21,0)']));
          stars(c, W, H, A.lite ? 25 : 60);
          rr(c, ox - gap, oy - gap, gs, gs, gap * 2.5); c.fillStyle = 'rgba(15,12,45,.85)'; c.fill(); c.strokeStyle = 'rgba(196,181,253,.35)'; c.lineWidth = 2; c.stroke();
          for (var i = 0; i < 16; i++) { rr(c, ox + (i % 4) * (cs + gap), oy + ((i / 4) | 0) * (cs + gap), cs, cs, cs * 0.16); c.fillStyle = 'rgba(167,139,250,.12)'; c.fill(); }
        });
      },
      reset: function () { reset0(); dead = 0; won = 0; quake = null; },
      step: function (dt, live) {
        t += dt;
        var i, tl;
        for (i = tiles.length - 1; i >= 0; i--) {
          tl = tiles[i];
          var tx = tl.i % 4, ty = (tl.i / 4) | 0, k = Math.min(1, dt * 22);
          if (!quake) { tl.x += (tx - tl.x) * k; tl.y += (ty - tl.y) * k; if (Math.abs(tx - tl.x) < 0.01) tl.x = tx; if (Math.abs(ty - tl.y) < 0.01) tl.y = ty; }
          if (tl.nw) { tl.nw += dt; if (tl.nw > 0.18) tl.nw = 0; }
          if (tl.mg) { tl.mg += dt; if (tl.mg > 0.2) tl.mg = 0; }
          if (tl.gone) { tl.gone += dt; if (tl.gone > 0.1) tiles.splice(i, 1); }
          if (quake) { tl.vy = (tl.vy || -rnd(60, 200)) + 1600 * dt; tl.y += tl.vy * dt / (cs + gap); tl.x += (tl.vx || 0) * dt; tl.rot = (tl.rot || 0) + (tl.vr || 0) * dt; }
        }
        if (quake) { quake.t += dt; if (!quake.hit && quake.t > 0.25) { quake.hit = 1; A.explode(W / 2, oy + gs * 0.45, 1.3); } return; }
        if (dead || won) return;
        if (A.live()) {
          clk += dt / Math.max(1.05, 3.1 - 1.7 * A.lv());
          if (clk >= 1) { clk = 0; add(); check(); }
        } else if (A.idle()) {
          aiT += dt;
          if (aiT > 0.42) { aiT = 0; var ord = Math.random() < 0.7 ? [3, 0, 1, 2] : [0, 3, 1, 2]; for (i = 0; i < 4; i++) if (move(ord[i])) break; }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, tl, s = cs + gap;
        for (i = 0; i < tiles.length; i++) {
          tl = tiles[i]; if (tl.gone && !quake) continue;
          var sc = tl.nw ? 0.3 + 0.7 * ease(tl.nw / 0.18) : tl.mg ? 1 + 0.16 * Math.sin(tl.mg / 0.2 * Math.PI) : 1, x = ox + tl.x * s + cs / 2, y = oy + tl.y * s + cs / 2;
          if (quake && tl.rot) { c.save(); c.translate(x, y); c.rotate(tl.rot); c.drawImage(tileS(tl.v), -cs / 2, -cs / 2, cs, cs); c.restore(); continue; }
          c.drawImage(tileS(tl.v), x - cs * sc / 2, y - cs * sc / 2, cs * sc, cs * sc);
        }
        for (i = 0; i < tiles.length; i++) { tl = tiles[i]; if (tl.gone && !quake) { c.globalAlpha = 0.7; c.drawImage(tileS(tl.v), ox + tl.x * s, oy + tl.y * s, cs, cs); c.globalAlpha = 1; } }
        // the clock: a bar under the board that fills up — when full, a tile drops in
        if (!quake) {
          var bw = gs - gap * 2, by = oy + gs - gap + 8;
          rr(c, ox, by, bw, 6, 3); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill();
          if (A.live() && clk > 0) { rr(c, ox, by, Math.max(6, bw * clk), 6, 3); c.fillStyle = clk > 0.8 ? '#FB7185' : '#FACC15'; c.fill(); }
        }
      },
      act: function (k) { if (dead || quake || won) return; move(k === 'left' ? 0 : k === 'right' ? 1 : k === 'up' ? 2 : k === 'down' ? 3 : -1); },
      boom: function () { quake = { t: 0 }; tiles.forEach(function (tl) { tl.vx = rnd(-1.5, 1.5); tl.vy = -rnd(100, 380); tl.vr = rnd(-4, 4); }); A.shake(0.6); },
      win: function () { won = 0.001; A.burst(W / 2, oy + gs / 2, 22, ['#FDE68A', '#FFFFFF', '#FACC15'], 200, 0.7, 3); },
      dbg: function () { return { g: grid.map(function (q) { return q ? q.v : 0; }), dead: dead, clk: clk }; }
    };
  }, 'swipe4', 0.6);

  /* ================================================================== 3. MAZE MUNCHER — swipe to steer through the maze, eat the
     dots; a big glowing dot turns the ghosts blue for a moment (eat them!). More and faster ghosts with time. */
  boot('mazechomp', function (A) {
    var MAP = [
      '###############',
      '#o.....#.....o#',
      '#.##.#.#.#.##.#',
      '#....#...#....#',
      '##.#.###.###.##',
      '#..#.......#..#',
      '#.##.##.##.##.#',
      '#......G......#',
      '#.##.##.##.##.#',
      '#..#.......#..#',
      '##.#.###.###.##',
      '#....#...#....#',
      '#.##.#.#.#.##.#',
      '#o.....#.....o#',
      '###############'];
    var NC = 15, NR = 15, W, H, T, dpr, bg, cs, ox, oy, dots = [], nd = 0, P = null, GH = [], dead = 0, won = 0, storm = null, fright = 0, t = 0, want = null, gSpawn = [7, 7], nG = 0;
    var DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }, GC = ['#F43F5E', '#F472B6', '#22D3EE', '#FB923C', '#A3E635', '#C084FC'];
    function wall(c, r) { if (r < 0 || r >= NR || c < 0 || c >= NC) return true; return MAP[r][c] === '#'; }
    function fill() { dots = []; nd = 0; for (var r = 0; r < NR; r++) { var row = []; for (var c = 0; c < NC; c++) { var ch = MAP[r][c], v = ch === '.' ? 1 : ch === 'o' ? 2 : 0; if (r === 11 && c === 7) v = 0; row.push(v); if (v) nd++; } dots.push(row); } }
    function ent(c, r, sp) { return { c: c, r: r, d: [0, 0], p: 0, sp: sp, mouth: 0 }; }
    function pos(e) { return [e.c + e.d[0] * e.p, e.r + e.d[1] * e.p]; }
    function open(c, r, d) { return !wall(c + d[0], r + d[1]); }
    function addGhost() { var g = ent(gSpawn[0], gSpawn[1], 0); g.k = nG % GC.length; g.wait = 0.6 + nG * 0.5; g.d = [nG % 2 ? 1 : -1, 0]; nG++; GH.push(g); }
    function ghostDir(g, live) {
      var opts = [], q;
      for (q in DIRS) { var d = DIRS[q]; if (open(g.c, g.r, d) && !(d[0] === -g.d[0] && d[1] === -g.d[1])) opts.push(d); }
      if (!opts.length) return [-g.d[0], -g.d[1]];
      if (fright > 0 || Math.random() < (live ? 0.22 - 0.12 * A.lv() : 0.5) || g.eaten) return opts[(Math.random() * opts.length) | 0];
      var pp = pos(P), tx = pp[0], ty = pp[1];
      if (g.k === 1) { tx += P.d[0] * 3; ty += P.d[1] * 3; } else if (g.k === 2) { tx = NC - 1 - tx; ty = NR - 1 - ty; }
      opts.sort(function (a, b) { return Math.hypot(g.c + a[0] - tx, g.r + a[1] - ty) - Math.hypot(g.c + b[0] - tx, g.r + b[1] - ty); });
      return opts[0];
    }
    function advance(e, dt, onCell) {
      if (!e.d[0] && !e.d[1]) { onCell(e); return; }
      e.p += e.sp * dt;
      while (e.p >= 1) { e.c += e.d[0]; e.r += e.d[1]; e.p -= 1; onCell(e); if (!e.d[0] && !e.d[1]) { e.p = 0; break; } }
    }
    function playerCell(e) {
      var v = dots[e.r][e.c];
      if (v) {
        dots[e.r][e.c] = 0; nd--;
        if (v === 2) { fright = Math.max(2.2, 5.5 - 2.6 * A.lv()); GH.forEach(function (g) { g.d = [-g.d[0], -g.d[1]]; }); A.burst(ox + (e.c + 0.5) * cs, oy + (e.r + 0.5) * cs, 12, ['#FDE68A', '#fff'], 140, 0.5, 3, 0); }
        else if (A.live() && !A.lite && Math.random() < 0.18) K.sfx('tick', { as: 'peg', p: 0.6 });
        if (nd <= 0) { fill(); A.ring(W / 2, oy + NR * cs / 2, NC * cs * 0.6, '#FDE68A'); A.burst(W / 2, oy + NR * cs / 2, 20, ['#FDE68A', '#FFFFFF', '#22D3EE'], 220, 0.7, 3); if (GH.length < 6) addGhost(); }
      }
      if (A.idle()) { // attract: pick the way that keeps far from ghosts and finds dots
        var best = null, q;
        for (q in DIRS) {
          var d = DIRS[q]; if (!open(e.c, e.r, d)) continue;
          var sc = Math.random() * 0.6 + (d[0] === -e.d[0] && d[1] === -e.d[1] ? -1.2 : 0), nc = e.c + d[0], nr = e.r + d[1];
          for (var k = 0; k < 5 && !wall(nc, nr); k++) { if (dots[nr][nc]) sc += 0.5 / (k + 1); nc += d[0]; nr += d[1]; }
          GH.forEach(function (g) { var dd = Math.hypot(g.c - (e.c + d[0]), g.r - (e.r + d[1])); if (dd < 3) sc -= (3 - dd) * 1.5; });
          if (!best || sc > best.s) best = { s: sc, d: d };
        }
        if (best) e.d = best.d;
        return;
      }
      if (want && open(e.c, e.r, want)) { e.d = want; }
      if (!open(e.c, e.r, e.d)) e.d = [0, 0];
    }
    function reset0(live) {
      fill(); GH = []; nG = 0; fright = 0; want = null;
      P = ent(7, 11, 0); P.d = [-1, 0];
      addGhost(); addGhost(); if (!live) addGhost();
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top;
        cs = Math.floor(Math.min((W - 16) / NC, (H - T - 8) / NR)); cs = Math.max(10, cs);
        ox = Math.round((W - cs * NC) / 2); oy = Math.round(T + (H - T - cs * NR) / 2);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#020617', '#0B1033', '#020617']); c.fillRect(0, 0, W, H);
          for (var r = 0; r < NR; r++) for (var x = 0; x < NC; x++) {
            if (!wall(x, r)) continue;
            var m = cs * 0.18; rr(c, ox + x * cs + m * (wall(x - 1, r) ? 0 : 1), oy + r * cs + m * (wall(x, r - 1) ? 0 : 1), cs - m * ((wall(x - 1, r) ? 0 : 1) + (wall(x + 1, r) ? 0 : 1)), cs - m * ((wall(x, r - 1) ? 0 : 1) + (wall(x, r + 1) ? 0 : 1)), cs * 0.25);
            c.fillStyle = '#1E3A8A'; c.fill();
          }
          c.strokeStyle = '#60A5FA'; c.lineWidth = Math.max(1.5, cs * 0.08);
          for (r = 0; r < NR; r++) for (x = 0; x < NC; x++) {
            if (!wall(x, r)) continue;
            var X0 = ox + x * cs, Y0 = oy + r * cs; c.beginPath();
            if (!wall(x, r - 1)) { c.moveTo(X0, Y0 + cs * 0.18); c.lineTo(X0 + cs, Y0 + cs * 0.18); }
            if (!wall(x, r + 1)) { c.moveTo(X0, Y0 + cs * 0.82); c.lineTo(X0 + cs, Y0 + cs * 0.82); }
            if (!wall(x - 1, r)) { c.moveTo(X0 + cs * 0.18, Y0); c.lineTo(X0 + cs * 0.18, Y0 + cs); }
            if (!wall(x + 1, r)) { c.moveTo(X0 + cs * 0.82, Y0); c.lineTo(X0 + cs * 0.82, Y0 + cs); }
            c.stroke();
          }
        });
      },
      reset: function (live) { reset0(live); dead = 0; won = 0; storm = null; },
      step: function (dt, live) {
        t += dt;
        if (storm) {
          storm.t += dt;
          GH.forEach(function (g) { var pp = pos(P), gp = pos(g); g.fx = (g.fx === undefined ? gp[0] : g.fx) + (pp[0] - (g.fx === undefined ? gp[0] : g.fx)) * Math.min(1, dt * 2.5); g.fy = (g.fy === undefined ? gp[1] : g.fy) + (pp[1] - (g.fy === undefined ? gp[1] : g.fy)) * Math.min(1, dt * 2.5); });
          if (!storm.hit && storm.t > 0.9) { storm.hit = 1; var pp = pos(P); A.explode(ox + (pp[0] + 0.5) * cs, oy + (pp[1] + 0.5) * cs, 1.2); }
          return;
        }
        if (dead || won) return;
        var lv = live ? A.lv() : 0.3;
        fright = Math.max(0, fright - dt);
        P.sp = 5.6 + 0.8 * lv; P.mouth += dt * 10;
        advance(P, dt, playerCell);
        if (live && GH.length < 2 + (lv > 0.25 ? 1 : 0) + (lv > 0.6 ? 1 : 0) + (lv > 0.95 ? 1 : 0)) addGhost();
        for (var i = 0; i < GH.length; i++) {
          var g = GH[i];
          if (g.wait > 0) { g.wait -= dt; continue; }
          if (g.eaten) { g.eaten -= dt; if (g.eaten <= 0) { g.eaten = 0; g.c = gSpawn[0]; g.r = gSpawn[1]; g.p = 0; } continue; }
          g.sp = fright > 0 ? 2.8 : (live ? 3.9 + 2.1 * lv : 4.2);
          advance(g, dt, function (e) { e.d = ghostDir(e, live); });
          var a = pos(P), b = pos(g);
          if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) < 0.62) {
            if (fright > 0) { g.eaten = 2.5; A.burst(ox + (b[0] + 0.5) * cs, oy + (b[1] + 0.5) * cs, 14, ['#93C5FD', '#fff'], 160, 0.5, 3, 0); A.ring(ox + (b[0] + 0.5) * cs, oy + (b[1] + 0.5) * cs, cs * 1.5, '#93C5FD'); }
            else if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.burst(ox + (a[0] + 0.5) * cs, oy + (a[1] + 0.5) * cs, 18, ['#FDE68A', '#F43F5E', '#fff'], 180, 0.6, 3.2); A.shake(0.35); } return; }
            else if (A.idle()) { reset0(false); return; }
          }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var r, x, i;
        c.fillStyle = '#FDE68A';
        for (r = 0; r < NR; r++) for (x = 0; x < NC; x++) {
          var v = dots[r][x]; if (!v) continue;
          var cx = ox + (x + 0.5) * cs, cy = oy + (r + 0.5) * cs;
          if (v === 1) c.fillRect(cx - cs * 0.07, cy - cs * 0.07, cs * 0.14, cs * 0.14);
          else { c.beginPath(); c.arc(cx, cy, cs * (0.2 + 0.05 * Math.sin(t * 6)), 0, TAU); c.fill(); }
        }
        // ghosts
        for (i = 0; i < GH.length; i++) {
          var g = GH[i]; if (g.eaten) continue;
          var gp = pos(g), gx = ox + ((storm && g.fx !== undefined ? g.fx : gp[0]) + 0.5) * cs, gy = oy + ((storm && g.fy !== undefined ? g.fy : gp[1]) + 0.5) * cs, R = cs * 0.42;
          var blue = fright > 0 && !storm, col = storm ? '#DC2626' : blue ? (fright < 1.2 && (t * 6 | 0) % 2 ? '#F8FAFC' : '#3B82F6') : GC[g.k];
          c.fillStyle = col; c.beginPath(); c.arc(gx, gy - R * 0.1, R, Math.PI, 0); c.lineTo(gx + R, gy + R * 0.8);
          for (var q = 0; q < 4; q++) { var xx = gx + R - (q + 0.5) * R / 2; c.lineTo(xx, gy + R * (0.8 - 0.28 * ((q + (t * 8 | 0)) % 2))); }
          c.lineTo(gx - R, gy + R * 0.8); c.closePath(); c.fill();
          circ(c, gx - R * 0.35, gy - R * 0.15, R * 0.26, '#fff'); circ(c, gx + R * 0.35, gy - R * 0.15, R * 0.26, '#fff');
          var lx = g.d[0] * R * 0.1, ly = g.d[1] * R * 0.1;
          circ(c, gx - R * 0.35 + lx, gy - R * 0.15 + ly, R * 0.12, blue ? '#1E3A8A' : '#0F172A'); circ(c, gx + R * 0.35 + lx, gy - R * 0.15 + ly, R * 0.12, blue ? '#1E3A8A' : '#0F172A');
        }
        // the muncher: a round orange critter with a chomping mouth and two eyes on top
        if (!dead || (t * 8 | 0) % 2) {
          var pp = pos(P), px = ox + (pp[0] + 0.5) * cs, py = oy + (pp[1] + 0.5) * cs, PR = cs * 0.44, ang = Math.atan2(P.d[1], P.d[0] || (P.d[1] ? 0 : 1)), mo = 0.12 + 0.3 * Math.abs(Math.sin(P.mouth));
          c.save(); c.translate(px, py); c.rotate(ang);
          c.fillStyle = '#FB923C'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, PR, mo, TAU - mo); c.closePath(); c.fill();
          c.fillStyle = '#FDBA74'; c.beginPath(); c.arc(-PR * 0.15, -PR * 0.2, PR * 0.5, Math.PI * 1.1, Math.PI * 1.6); c.lineTo(-PR * 0.15, -PR * 0.2); c.fill();
          circ(c, PR * 0.15, -PR * 0.5, PR * 0.2, '#fff'); circ(c, PR * 0.2, -PR * 0.5, PR * 0.1, '#1F2937');
          c.restore();
        }
        if (won) { c.globalAlpha = Math.max(0, 0.4 - won * 0.2); c.fillStyle = '#FDE68A'; c.fillRect(ox, oy, NC * cs, NR * cs); c.globalAlpha = 1; }
      },
      act: function (k) {
        if (dead || storm || won) return; var d = DIRS[k]; if (!d) return;
        want = d;
        if (d[0] === -P.d[0] && d[1] === -P.d[1] && P.p > 0) { P.c += P.d[0]; P.r += P.d[1]; P.p = 1 - P.p; P.d = d; }
        else if (P.p === 0 && open(P.c, P.r, d)) P.d = d;
      },
      boom: function () { storm = { t: 0 }; for (var i = 0; i < 3; i++) addGhost(); GH.forEach(function (g) { g.wait = 0; g.eaten = 0; }); A.flash(0.2); },
      win: function () { won = 0.001; var pp = pos(P); A.burst(ox + (pp[0] + 0.5) * cs, oy + (pp[1] + 0.5) * cs, 18, ['#FDE68A', '#FFFFFF', '#FB923C'], 160, 0.6, 3); },
      dbg: function () { return { P: { c: P.c, r: P.r, d: P.d, p: P.p }, G: GH.map(function (g) { return { c: g.c, r: g.r, d: g.d, p: g.p, w: g.wait, e: g.eaten }; }), nd: nd, fright: fright, dead: dead, map: MAP }; }
    };
  }, 'swipe4', 0.55);

  /* ================================================================== 4. BUBBLE POP — aim with the finger (a dotted guide shows
     the path, one bounce), release to shoot. 3+ of a colour pop, loose bubbles drop. The ceiling comes down with time. */
  boot('bubblepop', function (A) {
    var W, H, T, dpr, bg, r, NCo = 9, x0, y0, rowH, sx, sy, rows = [], shot = null, cur = 0, nxt = 0, aim = null, dead = 0, won = 0, flood = null, falls = [], t = 0, push = 0, aiT = 0, dangerY;
    var COL = [['#FECDD3', '#F43F5E', '#9F1239'], ['#FEF08A', '#EAB308', '#854D0E'], ['#BBF7D0', '#22C55E', '#14532D'], ['#BAE6FD', '#0EA5E9', '#0C4A6E'], ['#E9D5FF', '#A855F7', '#581C87'], ['#FED7AA', '#F97316', '#7C2D12']], spr = [];
    function ncol(i) { return rows[i].odd ? NCo - 1 : NCo; }
    function cx(i, j) { return x0 + r + j * 2 * r + (rows[i].odd ? r : 0); }
    function cy(i) { return y0 + r + i * rowH; }
    function nColors() { return A.live() ? (A.lv() > 0.5 ? 6 : 5) : 5; }
    function newRow(odd) { var c = []; for (var j = 0; j < (odd ? NCo - 1 : NCo); j++) c.push((Math.random() * nColors()) | 0); return { odd: odd, c: c }; }
    function ensure(i) { while (rows.length <= i) { var o = rows.length ? !rows[rows.length - 1].odd : false, c = []; for (var j = 0; j < (o ? NCo - 1 : NCo); j++) c.push(-1); rows.push({ odd: o, c: c }); } }
    function nb(i, j) {
      var o = [[i, j - 1], [i, j + 1]], odd = rows[i].odd;
      [i - 1, i + 1].forEach(function (k) { if (odd) { o.push([k, j]); o.push([k, j + 1]); } else { o.push([k, j - 1]); o.push([k, j]); } });
      return o.filter(function (q) { return q[0] >= 0 && q[0] < rows.length && q[1] >= 0 && q[1] < ncol(q[0]); });
    }
    function present() { var s = {}; rows.forEach(function (rw) { rw.c.forEach(function (v) { if (v >= 0) s[v] = 1; }); }); var k = Object.keys(s).map(Number); return k.length ? k : [((Math.random() * nColors()) | 0)]; }
    function pickCol() { var p = present(); return p[(Math.random() * p.length) | 0]; }
    function lowest() { for (var i = rows.length - 1; i >= 0; i--) if (rows[i].c.some(function (v) { return v >= 0; })) return i; return -1; }
    function checkLow() {
      var lo = lowest(); if (lo < 0 || cy(lo) + r < dangerY) return;
      if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); } } else if (A.idle()) reset0();
    }
    function addTop() { var o = rows.length ? !rows[0].odd : false; rows.unshift(newRow(o)); push = 0; A.shake(0.08); checkLow(); }
    function place(px, py, col) {
      var best = null, i, j;
      var ri = Math.max(0, Math.round((py - y0 - r) / rowH)); ensure(ri + 1);
      for (i = Math.max(0, ri - 1); i <= ri + 1; i++) for (j = 0; j < ncol(i); j++) {
        if (rows[i].c[j] >= 0) continue;
        var ok = i === 0 || nb(i, j).some(function (q) { return rows[q[0]].c[q[1]] >= 0; }); if (!ok) continue;
        var d = Math.hypot(cx(i, j) - px, cy(i) - py); if (!best || d < best.d) best = { d: d, i: i, j: j };
      }
      if (!best) return;
      rows[best.i].c[best.j] = col;
      // same colour group
      var seen = {}, st = [[best.i, best.j]], grp = []; seen[best.i + ',' + best.j] = 1;
      while (st.length) { var q = st.pop(); grp.push(q); nb(q[0], q[1]).forEach(function (n) { var k = n[0] + ',' + n[1]; if (!seen[k] && rows[n[0]].c[n[1]] === col) { seen[k] = 1; st.push(n); } }); }
      if (grp.length >= 3) {
        grp.forEach(function (q) { rows[q[0]].c[q[1]] = -1; A.burst(cx(q[0], q[1]), cy(q[0]), 4, [COL[col][0], COL[col][1], '#fff'], 150, 0.45, 3, 60); });
        // loose bubbles fall
        var keep = {}; st = [];
        for (j = 0; j < ncol(0); j++) if (rows[0].c[j] >= 0) { keep['0,' + j] = 1; st.push([0, j]); }
        while (st.length) { q = st.pop(); nb(q[0], q[1]).forEach(function (n) { var k = n[0] + ',' + n[1]; if (!keep[k] && rows[n[0]].c[n[1]] >= 0) { keep[k] = 1; st.push(n); } }); }
        for (i = 0; i < rows.length; i++) for (j = 0; j < ncol(i); j++) if (rows[i].c[j] >= 0 && !keep[i + ',' + j]) { falls.push({ x: cx(i, j), y: cy(i), vy: rnd(-60, 20), vx: rnd(-40, 40), c: rows[i].c[j] }); rows[i].c[j] = -1; }
        if (grp.length >= 5) A.ring(cx(best.i, best.j), cy(best.i), r * 4, '#FDE68A');
        if (lowest() < 0) { for (i = 0; i < 4; i++) addTop(); }
      }
      while (rows.length && rows[rows.length - 1].c.every(function (v) { return v < 0; })) rows.pop();
      if (A.live()) { push++; if (push >= Math.max(4, 8 - Math.round(4 * A.lv()))) addTop(); }
      checkLow();
    }
    function fire(dx, dy) {
      if (shot || dead || flood || won) return;
      var a = Math.atan2(dy, dx); a = clamp(a, -Math.PI + 0.2, -0.2);
      var sp = Math.max(700, H * 1.9);
      shot = { x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, c: cur }; cur = nxt; nxt = pickCol();
    }
    function reset0() { rows = []; for (var i = 0; i < 5; i++) rows.push(newRow(i % 2 === 1)); cur = pickCol(); nxt = pickCol(); shot = null; push = 0; falls = []; }
    function guide(ax, ay) { // path of the shot (with one wall bounce) for the dotted guide
      var a = clamp(Math.atan2(ay, ax), -Math.PI + 0.2, -0.2), x = sx, y = sy, vx = Math.cos(a), vy = Math.sin(a), pts = [], bounced = 0;
      for (var k = 0; k < 160; k++) {
        x += vx * r * 0.6; y += vy * r * 0.6;
        if (x < x0 + r) { x = 2 * (x0 + r) - x; vx = -vx; if (bounced++) break; }
        if (x > x0 + NCo * 2 * r - r) { x = 2 * (x0 + NCo * 2 * r - r) - x; vx = -vx; if (bounced++) break; }
        if (y < y0 + r || hit(x, y)) break;
        if (k % 3 === 0) pts.push([x, y]);
      }
      return pts;
    }
    function hit(x, y) {
      var ri = Math.round((y - y0 - r) / rowH);
      for (var i = Math.max(0, ri - 1); i <= Math.min(rows.length - 1, ri + 1); i++) for (var j = 0; j < ncol(i); j++) if (rows[i].c[j] >= 0 && Math.hypot(cx(i, j) - x, cy(i) - y) < r * 1.75) return true;
      return false;
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top;
        r = Math.floor(Math.min((W - 16) / (NCo * 2), (H - T) / 26, 26)); rowH = r * Math.sqrt(3);
        x0 = Math.round((W - NCo * 2 * r) / 2); y0 = T + 2; sx = W / 2; sy = H - r * 2.2; dangerY = sy - r * 2.4;
        spr = COL.map(function (cl) { return mkc(r * 2 + 2, r * 2 + 2, dpr, function (c) { circ(c, r + 1, r + 1, r, rg(c, r + 1, r + 1, r, [cl[0], cl[1], cl[2]], -r * 0.35, -r * 0.4)); circ(c, r * 0.65, r * 0.6, r * 0.25, 'rgba(255,255,255,.7)'); }); });
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0C1445', '#1E3A8A', '#0E7490']); c.fillRect(0, 0, W, H);
          for (var i = 0; i < 14; i++) { var bx = Math.random() * W, by = T + Math.random() * (H - T), br = rnd(4, 18); c.strokeStyle = 'rgba(186,230,253,.12)'; c.lineWidth = 1.5; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.stroke(); }
          c.fillStyle = 'rgba(2,6,23,.35)'; c.fillRect(x0, y0, NCo * 2 * r, H - y0);
          c.strokeStyle = 'rgba(244,63,94,.75)'; c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(x0, dangerY); c.lineTo(x0 + NCo * 2 * r, dangerY); c.stroke(); c.setLineDash([]);
          // the launcher
          c.fillStyle = lg(c, sx - r * 2, sy, sx + r * 2, sy, ['#475569', '#CBD5E1', '#334155']); rr(c, sx - r * 1.9, sy + r * 0.5, r * 3.8, r * 1.4, r * 0.6); c.fill();
        });
      },
      reset: function () { reset0(); dead = 0; won = 0; flood = null; aim = null; },
      step: function (dt) {
        t += dt; var i;
        for (i = falls.length - 1; i >= 0; i--) { var f = falls[i]; f.vy += 1500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.y > H + r) falls.splice(i, 1); }
        if (flood) {
          flood.t += dt; flood.k += dt;
          while (flood.k > 0.08) { flood.k -= 0.08; var o = rows.length ? !rows[0].odd : false; rows.unshift(newRow(o)); }
          if (!flood.hit && flood.t > 0.8) { flood.hit = 1; A.explode(sx, sy - r * 2, 1.3); }
          return;
        }
        if (dead || won) return;
        if (A.idle()) { aiT += dt; if (!shot && aiT > 0.9) { aiT = 0; fire(rnd(-1, 1), -1); } }
        if (shot) {
          var n = 6; for (var k = 0; k < n && shot; k++) {
            shot.x += shot.vx * dt / n; shot.y += shot.vy * dt / n;
            if (shot.x < x0 + r) { shot.x = x0 + r; shot.vx = Math.abs(shot.vx); }
            if (shot.x > x0 + NCo * 2 * r - r) { shot.x = x0 + NCo * 2 * r - r; shot.vx = -Math.abs(shot.vx); }
            if (shot.y < y0 + r || hit(shot.x, shot.y)) { var s = shot; shot = null; place(s.x, Math.max(y0 + r, s.y), s.c); }
          }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, j, d2 = r * 2 + 2;
        for (i = 0; i < rows.length; i++) for (j = 0; j < ncol(i); j++) { var v = rows[i].c[j]; if (v >= 0) c.drawImage(spr[v], cx(i, j) - r - 1, cy(i) - r - 1, d2, d2); }
        for (i = 0; i < falls.length; i++) c.drawImage(spr[falls[i].c], falls[i].x - r - 1, falls[i].y - r - 1, d2, d2);
        if (aim && !dead && !flood) { var pts = guide(aim[0], aim[1]); c.fillStyle = 'rgba(255,255,255,.75)'; for (i = 0; i < pts.length; i++) { c.globalAlpha = 1 - i / (pts.length + 4); c.beginPath(); c.arc(pts[i][0], pts[i][1], Math.max(1.5, r * 0.14), 0, TAU); c.fill(); } c.globalAlpha = 1; }
        if (shot) c.drawImage(spr[shot.c], shot.x - r - 1, shot.y - r - 1, d2, d2);
        if (!dead && !flood) { c.drawImage(spr[cur], sx - r - 1, sy - r - 1, d2, d2); c.globalAlpha = 0.85; c.drawImage(spr[nxt], sx + r * 2.6 - r * 0.65, sy + r * 0.4 - r * 0.65, r * 1.3, r * 1.3); c.globalAlpha = 1; }
      },
      down: function (x, y) { if (dead) return; aim = [x - sx, Math.min(-8, y - sy)]; },
      move: function (x, y) { if (aim) aim = [x - sx, Math.min(-8, y - sy)]; },
      up: function () { if (!aim) return; var a = aim; aim = null; fire(a[0], a[1]); K.sfx('act'); },
      key: function (k) { if (!this._a) this._a = -Math.PI / 2; if (k === 'left') this._a -= 0.08; else if (k === 'right') this._a += 0.08; else if (k === 'up') { fire(Math.cos(this._a), Math.sin(this._a)); aim = null; return; } aim = [Math.cos(this._a) * 100, Math.sin(this._a) * 100]; },
      boom: function () { flood = { t: 0, k: 0 }; aim = null; shot = null; A.flash(0.25); },
      win: function () { won = 0.001; aim = null; A.burst(sx, sy - r * 3, 18, ['#FDE68A', '#FFFFFF', '#38BDF8'], 180, 0.6, 3); },
      dbg: function () { return { rows: rows, cur: cur, r: r, x0: x0, y0: y0, rowH: rowH, sx: sx, sy: sy, shot: !!shot, dead: dead, low: lowest() }; }
    };
  }, 'drag', 0.7);

  /* ================================================================== 5. GEM SWAP — the match-3 sprint: swipe a gem toward a
     neighbour (or tap two neighbours) to swap. 3+ in a line clear and refill the time bar, which drains faster and faster. */
  boot('gemswap', function (A) {
    var N = 7, W, H, T, dpr, bg, cs, ox, oy, b = [], spr = [], busy = 0, sel = null, drag = null, tb = 1, dead = 0, won = 0, quake = null, t = 0, aiT = 0, swapA = null, combo = 0;
    var GC = [['#FECACA', '#EF4444', '#7F1D1D'], ['#FED7AA', '#F97316', '#7C2D12'], ['#FEF08A', '#EAB308', '#713F12'], ['#BBF7D0', '#22C55E', '#14532D'], ['#BAE6FD', '#0EA5E9', '#0C4A6E'], ['#E9D5FF', '#A855F7', '#4C1D95']];
    function gemS(k) {
      var g = GC[k];
      return mkc(cs, cs, dpr, function (c, w) {
        var m = w / 2, R = w * 0.4; c.translate(m, m);
        var f = lg(c, -R, -R, R, R, [g[0], g[1], g[2]]); c.fillStyle = f; c.beginPath();
        if (k === 0) { for (var i = 0; i < 6; i++) { var a = i / 6 * TAU + Math.PI / 6; c.lineTo(Math.cos(a) * R, Math.sin(a) * R); } }
        else if (k === 1) c.arc(0, 0, R * 0.92, 0, TAU);
        else if (k === 2) { c.moveTo(0, -R); c.lineTo(R * 0.85, 0); c.lineTo(0, R); c.lineTo(-R * 0.85, 0); }
        else if (k === 3) { rr(c, -R * 0.8, -R * 0.8, R * 1.6, R * 1.6, R * 0.25); }
        else if (k === 4) { c.moveTo(0, -R); c.quadraticCurveTo(R * 1.1, R * 0.3, 0, R); c.quadraticCurveTo(-R * 1.1, R * 0.3, 0, -R); }
        else { for (i = 0; i < 10; i++) { a = -Math.PI / 2 + i * Math.PI / 5; var q = i % 2 ? R * 0.48 : R; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } }
        c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = Math.max(1, w * 0.03); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-R * 0.25, -R * 0.35, R * 0.28, R * 0.14, -0.5, 0, TAU); c.fill();
      });
    }
    function at(i, j) { return b[i * N + j]; }
    function rndGem(i, j) { var k, tries = 0; do { k = (Math.random() * 6) | 0; tries++; } while (tries < 20 && ((j >= 2 && at(i, j - 1) && at(i, j - 2) && at(i, j - 1).k === k && at(i, j - 2).k === k) || (i >= 2 && at(i - 1, j) && at(i - 2, j) && at(i - 1, j).k === k && at(i - 2, j).k === k))); return { k: k, x: j, y: i, vy: 0 }; }
    function fill0() { b = []; for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) b.push(null), b[i * N + j] = rndGem(i, j); if (!findMove()) fill0(); }
    function matches() {
      var m = {}, i, j, k, run;
      for (i = 0; i < N; i++) for (j = 0; j < N;) { k = at(i, j).k; run = 1; while (j + run < N && at(i, j + run).k === k) run++; if (run >= 3) for (var q = 0; q < run; q++) m[i * N + j + q] = 1; j += run; }
      for (j = 0; j < N; j++) for (i = 0; i < N;) { k = at(i, j).k; run = 1; while (i + run < N && at(i + run, j).k === k) run++; if (run >= 3) for (q = 0; q < run; q++) m[(i + q) * N + j] = 1; i += run; }
      return Object.keys(m).map(Number);
    }
    function swp(a, c) { var x = b[a]; b[a] = b[c]; b[c] = x; }
    function findMove() {
      for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
        var a = i * N + j;
        if (j < N - 1) { swp(a, a + 1); var ok = matches().length; swp(a, a + 1); if (ok) return [a, a + 1]; }
        if (i < N - 1) { swp(a, a + N); ok = matches().length; swp(a, a + N); if (ok) return [a, a + N]; }
      }
      return null;
    }
    function trySwap(a, c) {
      if (busy || dead || quake || won) return;
      var ai = (a / N) | 0, aj = a % N, ci = (c / N) | 0, cj = c % N;
      if (Math.abs(ai - ci) + Math.abs(aj - cj) !== 1) return;
      swp(a, c); var m = matches();
      busy = 1; swapA = { a: a, c: c, t: 0, back: !m.length };
      if (!m.length) swp(a, c); // bounce back: shown by the animation
      sel = null;
    }
    function resolve() {
      var m = matches();
      if (!m.length) { combo = 0; busy = 0; if (!findMove()) { A.ring(W / 2, oy + N * cs / 2, N * cs * 0.6, '#C4B5FD'); fill0(); } return; }
      combo++;
      m.forEach(function (q) { var g = b[q]; A.burst(ox + (q % N + 0.5) * cs, oy + (((q / N) | 0) + 0.5) * cs, 4, [GC[g.k][0], GC[g.k][1], '#fff'], 140, 0.45, 3, 30); b[q] = null; });
      if (A.live()) tb = Math.min(1, tb + m.length * 0.028 * (1 + 0.25 * (combo - 1)));
      if (m.length >= 5 || combo >= 3) A.ring(W / 2, oy + N * cs / 2, N * cs * 0.4, '#FDE68A');
      for (var j = 0; j < N; j++) {
        var col = []; for (var i = N - 1; i >= 0; i--) if (b[i * N + j]) col.push(b[i * N + j]);
        for (i = N - 1, k = 0; i >= 0; i--, k++) { var g = col[k]; if (!g) { g = { k: (Math.random() * 6) | 0, x: j, y: -1 - (k - col.length), vy: 0 }; } b[i * N + j] = g; }
      }
      for (var k2 = 0; k2 < N * N; k2++) b[k2].tx = k2 % N;
      busy = 2;
    }
    var k;
    function cellAt(x, y) { var j = Math.floor((x - ox) / cs), i = Math.floor((y - oy) / cs); return i >= 0 && i < N && j >= 0 && j < N ? i * N + j : -1; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top;
        cs = Math.floor(Math.min((W - 20) / N, (H - T - 30) / N, 64)); ox = Math.round((W - cs * N) / 2); oy = Math.round(T + (H - T - cs * N - 20) / 2) + 18;
        spr = GC.map(function (g, i) { return gemS(i); });
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#2E1065', '#4C1D95', '#1E1B4B']); c.fillRect(0, 0, W, H);
          stars(c, W, H, A.lite ? 25 : 60);
          rr(c, ox - 6, oy - 6, N * cs + 12, N * cs + 12, 12); c.fillStyle = 'rgba(15,10,40,.75)'; c.fill(); c.strokeStyle = 'rgba(250,204,21,.45)'; c.lineWidth = 2; c.stroke();
          for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) if ((i + j) % 2) { c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(ox + j * cs, oy + i * cs, cs, cs); }
        });
      },
      reset: function () { fill0(); busy = 0; sel = null; drag = null; tb = 1; dead = 0; won = 0; quake = null; swapA = null; combo = 0; },
      step: function (dt, live) {
        t += dt; var i, g;
        if (quake) { quake.t += dt; b.forEach(function (q) { if (!q) return; q.vy += 1400 * dt; q.fy = (q.fy || 0) + q.vy * dt; q.fx = (q.fx || 0) + q.vx * dt; }); if (!quake.hit && quake.t > 0.2) { quake.hit = 1; A.explode(W / 2, oy + N * cs / 2, 1.3); } return; }
        if (dead) return;
        if (A.live() && !won) { tb -= dt / 15 * (1 + 1.1 * A.lv()); if (tb <= 0) { tb = 0; if (A.fail(A.l.fail)) { dead = 1; A.shake(0.3); } return; } }
        if (swapA) { swapA.t += dt; if (swapA.t > (swapA.back ? 0.3 : 0.16)) { var back = swapA.back; swapA = null; if (back) busy = 0; else resolve(); } }
        if (busy === 2) {
          var moving = false;
          for (i = 0; i < N * N; i++) { g = b[i]; var ty = (i / N) | 0; if (g.y < ty) { g.vy += 2600 * dt / cs; g.y = Math.min(ty, g.y + g.vy * dt); moving = true; } else { g.y = ty; g.vy = 0; } g.x = i % N; }
          if (!moving) resolve();
        }
        if (A.idle() && !busy && !won) { aiT += dt; if (aiT > 1.1) { aiT = 0; var mv = findMove(); if (mv) trySwap(mv[0], mv[1]); } }
      },
      draw: function (c) {
        A.bg(bg);
        var i, g, x, y;
        for (i = 0; i < N * N; i++) {
          g = b[i]; if (!g) continue; x = g.x; y = g.y;
          if (swapA && (i === swapA.a || i === swapA.c)) {
            var o = i === swapA.a ? swapA.c : swapA.a, k1 = swapA.back ? Math.sin(Math.min(1, swapA.t / 0.3) * Math.PI) : 1 - Math.min(1, swapA.t / 0.16);
            if (swapA.back) { x = i % N + ((o % N) - (i % N)) * k1; y = ((i / N) | 0) + (((o / N) | 0) - ((i / N) | 0)) * k1; }
            else { x = i % N + ((o % N) - (i % N)) * k1; y = ((i / N) | 0) + (((o / N) | 0) - ((i / N) | 0)) * k1; }
          }
          if (y < -0.5) continue;
          var px = ox + x * cs + (g.fx || 0), py = oy + y * cs + (g.fy || 0);
          if (sel === i) { rr(c, px + 2, py + 2, cs - 4, cs - 4, cs * 0.2); c.fillStyle = 'rgba(253,230,138,.28)'; c.fill(); }
          c.drawImage(spr[g.k], px, py, cs, cs);
        }
        // time bar
        var bw = N * cs, by = oy - 18;
        rr(c, ox, by, bw, 8, 4); c.fillStyle = 'rgba(255,255,255,.14)'; c.fill();
        rr(c, ox, by, Math.max(8, bw * tb), 8, 4); c.fillStyle = tb < 0.25 ? '#F43F5E' : tb < 0.5 ? '#FACC15' : '#4ADE80'; c.fill();
      },
      down: function (x, y) { var q = cellAt(x, y); drag = q >= 0 ? { q: q, x: x, y: y, mv: 0 } : null; },
      move: function (x, y) {
        if (!drag || drag.mv) return; var dx = x - drag.x, dy = y - drag.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < cs * 0.35) return;
        drag.mv = 1; var q = drag.q, i = (q / N) | 0, j = q % N, c2 = -1;
        if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0 && j < N - 1) c2 = q + 1; else if (dx < 0 && j > 0) c2 = q - 1; } else { if (dy > 0 && i < N - 1) c2 = q + N; else if (dy < 0 && i > 0) c2 = q - N; }
        if (c2 >= 0) trySwap(q, c2);
      },
      up: function () {
        if (!drag) return; var d = drag; drag = null; if (d.mv || busy) return;
        if (sel !== null && sel !== d.q) { var s = sel; sel = null; var si = (s / N) | 0, sj = s % N, qi = (d.q / N) | 0, qj = d.q % N; if (Math.abs(si - qi) + Math.abs(sj - qj) === 1) { trySwap(s, d.q); return; } }
        sel = sel === d.q ? null : d.q; K.sfx('act');
      },
      key: function () { },
      boom: function () { quake = { t: 0 }; b.forEach(function (q) { if (q) { q.vx = rnd(-300, 300); q.vy = -rnd(200, 600); } }); A.shake(0.6); swapA = null; },
      win: function () { won = 0.001; A.burst(W / 2, oy + N * cs / 2, 22, ['#FDE68A', '#FFFFFF', '#C084FC'], 200, 0.7, 3); },
      dbg: function () { return { k: b.map(function (g) { return g ? g.k : -1; }), N: N, cs: cs, ox: ox, oy: oy, busy: busy, tb: tb, dead: dead, mv: findMove() }; }
    };
  }, 'drag', 0.55);

  /* ================================================================== 6. MEMORY FLIP — the cards show for a moment, then turn:
     tap two cards to find a pair before the time bar runs out (a wrong pair costs time). Each board is bigger. */
  boot('memoflip', function (A) {
    var W, H, T, dpr, bg, cards = [], cols = 4, rowsN = 3, cw, ch, ox, oy, open1 = -1, open2 = -1, waitT = 0, tb = 1, tMax = 20, peek = 0, lvl = 0, dead = 0, won = 0, wind = null, t = 0, aiT = 0, mem = {}, backS = null, faceS = [], next = 0;
    var SY = ['#F43F5E', '#F59E0B', '#22C55E', '#0EA5E9', '#A855F7', '#EC4899', '#14B8A6', '#EAB308', '#6366F1', '#EF4444', '#84CC16', '#06B6D4'];
    function sym(c, k, R) { // 12 simple original pictograms
      c.fillStyle = SY[k]; c.strokeStyle = SY[k]; c.lineWidth = R * 0.18; c.lineCap = 'round'; c.beginPath();
      switch (k) {
        case 0: c.moveTo(0, R * 0.8); c.bezierCurveTo(-R * 1.3, -R * 0.1, -R * 0.5, -R * 1.1, 0, -R * 0.35); c.bezierCurveTo(R * 0.5, -R * 1.1, R * 1.3, -R * 0.1, 0, R * 0.8); c.fill(); break; // heart
        case 1: for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * 0.42 : R; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.fill(); break; // star
        case 2: c.ellipse(0, 0, R * 0.55, R * 0.95, 0.6, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = R * 0.1; c.beginPath(); c.moveTo(-R * 0.45, R * 0.6); c.lineTo(R * 0.45, -R * 0.6); c.stroke(); break; // leaf
        case 3: c.moveTo(0, -R); c.quadraticCurveTo(R * 0.9, R * 0.2, 0, R * 0.9); c.quadraticCurveTo(-R * 0.9, R * 0.2, 0, -R); c.fill(); break; // drop
        case 4: c.arc(0, 0, R * 0.9, 0.6, TAU - 0.6 + 0.0); c.arc(R * 0.35, -R * 0.1, R * 0.7, TAU - 0.9, 0.9, true); c.fill(); break; // moon
        case 5: c.arc(0, 0, R * 0.5, 0, TAU); c.fill(); for (i = 0; i < 8; i++) { a = i / 8 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.68, Math.sin(a) * R * 0.68); c.lineTo(Math.cos(a) * R, Math.sin(a) * R); c.stroke(); } break; // sun
        case 6: c.moveTo(-R * 0.2, -R); c.lineTo(R * 0.6, -R); c.lineTo(R * 0.05, -R * 0.1); c.lineTo(R * 0.55, -R * 0.1); c.lineTo(-R * 0.45, R); c.lineTo(-R * 0.05, R * 0.15); c.lineTo(-R * 0.55, R * 0.15); c.closePath(); c.fill(); break; // bolt
        case 7: c.moveTo(-R * 0.9, R * 0.6); c.lineTo(-R * 0.9, -R * 0.4); c.lineTo(-R * 0.45, R * 0.05); c.lineTo(0, -R * 0.7); c.lineTo(R * 0.45, R * 0.05); c.lineTo(R * 0.9, -R * 0.4); c.lineTo(R * 0.9, R * 0.6); c.closePath(); c.fill(); break; // crown
        case 8: c.moveTo(0, -R); c.lineTo(R * 0.9, -R * 0.2); c.lineTo(0, R); c.lineTo(-R * 0.9, -R * 0.2); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(0, -R); c.lineTo(R * 0.3, -R * 0.2); c.lineTo(-R * 0.3, -R * 0.2); c.fill(); break; // gem
        case 9: c.arc(-R * 0.25, R * 0.55, R * 0.3, 0, TAU); c.fill(); c.fillRect(-R * 0.02, -R * 0.9, R * 0.16, R * 1.5); c.beginPath(); c.moveTo(R * 0.1, -R * 0.9); c.quadraticCurveTo(R * 0.8, -R * 0.6, R * 0.6, -R * 0.1); c.stroke(); break; // note
        case 10: for (i = 0; i < 5; i++) { a = i / 5 * TAU - Math.PI / 2; c.beginPath(); c.arc(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, R * 0.4, 0, TAU); c.fill(); } circ(c, 0, 0, R * 0.32, '#FDE68A'); break; // flower
        default: c.ellipse(-R * 0.1, 0, R * 0.75, R * 0.45, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(R * 0.55, 0); c.lineTo(R, -R * 0.45); c.lineTo(R, R * 0.45); c.closePath(); c.fill(); circ(c, -R * 0.45, -R * 0.08, R * 0.1, '#fff'); // fish
      }
    }
    function layout() {
      var n = cards.length; cols = n <= 12 ? 4 : n <= 16 ? 4 : n <= 20 ? 5 : 6; rowsN = Math.ceil(n / cols);
      var gw = W - 20, gh = H - T - 30; cw = Math.floor(Math.min(gw / cols, gh / rowsN * 0.78, 96)); ch = Math.floor(cw / 0.78);
      if (ch * rowsN > gh) { ch = Math.floor(gh / rowsN); cw = Math.floor(ch * 0.78); }
      ox = Math.round((W - cw * cols) / 2); oy = Math.round(T + 20 + (gh - ch * rowsN) / 2);
      backS = mkc(cw - 6, ch - 6, dpr, function (c, w, h) {
        rr(c, 0, 0, w, h, w * 0.12); c.fillStyle = lg(c, 0, 0, w, h, ['#6366F1', '#4338CA', '#312E81']); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; rr(c, w * 0.1, w * 0.1, w * 0.8, h - w * 0.2, w * 0.08); c.stroke();
        c.save(); c.translate(w / 2, h / 2); c.fillStyle = 'rgba(253,230,138,.85)'; for (var i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, -w * 0.22); c.lineTo(w * 0.07, 0); c.lineTo(-w * 0.07, 0); c.fill(); } c.restore();
      });
      faceS = SY.map(function (s, k) { return mkc(cw - 6, ch - 6, dpr, function (c, w, h) { rr(c, 0, 0, w, h, w * 0.12); c.fillStyle = lg(c, 0, 0, 0, h, ['#FFFFFF', '#EEF2FF']); c.fill(); c.translate(w / 2, h / 2); sym(c, k, w * 0.3); }); });
    }
    function deal(live) {
      var pairs = [6, 8, 10, 12][Math.min(3, lvl)], ks = [], i;
      var pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].sort(function () { return Math.random() - 0.5; }).slice(0, pairs);
      pool.forEach(function (k) { ks.push(k, k); });
      for (i = ks.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, x = ks[i]; ks[i] = ks[j]; ks[j] = x; }
      cards = ks.map(function (k) { return { k: k, up: 1, f: 1, done: 0 }; });
      open1 = open2 = -1; waitT = 0; mem = {};
      var lv = live ? A.lv() : 0;
      peek = Math.max(0.9, 1.9 - 0.8 * lv) + pairs * 0.08; tMax = (3 + pairs * 2.5) * (1 - 0.32 * Math.min(1, lv)); tb = 1;
      if (W) layout();
    }
    function flipBack() { if (open1 >= 0) cards[open1].up = 0; if (open2 >= 0) cards[open2].up = 0; open1 = open2 = -1; waitT = 0; }
    function tapCard(i) {
      if (i < 0 || dead || wind || won || peek > 0) return;
      var cd = cards[i]; if (cd.done || cd.up) return;
      if (open2 >= 0) flipBack();
      cd.up = 1; mem[i] = cd.k;
      if (open1 < 0) { open1 = i; return; }
      open2 = i;
      if (cards[open1].k === cd.k) {
        cards[open1].done = cd.done = 1; var a = open1; open1 = open2 = -1;
        [a, i].forEach(function (q) { A.burst(ox + (q % cols + 0.5) * cw, oy + (((q / cols) | 0) + 0.5) * ch, 8, [SY[cd.k], '#FDE68A', '#fff'], 140, 0.5, 3, 30); });
        if (cards.every(function (q) { return q.done; })) { next = 0.7; A.ring(W / 2, oy + rowsN * ch / 2, Math.min(W, rowsN * ch) * 0.5, '#FDE68A'); }
      } else { waitT = 0.7; if (A.live()) tb = Math.max(0, tb - 1.2 / tMax); }
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top;
        bg = mkc(W, H, dpr, function (c) { c.fillStyle = lg(c, 0, 0, 0, H, ['#0F172A', '#1E1B4B', '#3B0764']); c.fillRect(0, 0, W, H); stars(c, W, H, A.lite ? 25 : 60); });
        if (cards.length) layout();
      },
      reset: function (live) { lvl = 0; dead = 0; won = 0; wind = null; next = 0; deal(live); },
      step: function (dt, live) {
        t += dt; var i;
        for (i = 0; i < cards.length; i++) { var cd = cards[i], tg = cd.up || cd.done ? 1 : 0; cd.f += (tg - cd.f) * Math.min(1, dt * 14); if (wind) { cd.wx = (cd.wx || 0) + (cd.vx || 0) * dt; cd.wy = (cd.wy || 0) + (cd.vy || 0) * dt; cd.vy = (cd.vy || 0) + 900 * dt; cd.wr = (cd.wr || 0) + 8 * dt; } }
        if (wind) { wind.t += dt; if (!wind.hit && wind.t > 0.3) { wind.hit = 1; A.explode(W / 2, oy + rowsN * ch / 2, 1.2); } return; }
        if (dead || won) return;
        if (peek > 0) { peek -= dt; if (peek <= 0) cards.forEach(function (q) { q.up = 0; }); return; }
        if (next > 0) { next -= dt; if (next <= 0) { lvl++; deal(live); } return; }
        if (waitT > 0) { waitT -= dt; if (waitT <= 0) flipBack(); }
        if (A.live()) { tb -= dt / tMax; if (tb <= 0) { tb = 0; if (A.fail(A.l.fail)) { dead = 1; A.shake(0.3); } return; } }
        if (A.idle()) {
          aiT += dt;
          if (aiT > 0.55 && waitT <= 0) {
            aiT = 0;
            var pick2 = -1;
            if (open1 >= 0) { for (var k in mem) if (+k !== open1 && mem[k] === cards[open1].k && !cards[k].done) pick2 = +k; if (pick2 < 0 || Math.random() < 0.3) { var cand = cards.map(function (q, j) { return j; }).filter(function (j) { return !cards[j].done && !cards[j].up; }); pick2 = cand[(Math.random() * cand.length) | 0]; } tapCard(pick2); }
            else { var c2 = cards.map(function (q, j) { return j; }).filter(function (j) { return !cards[j].done && !cards[j].up; }); if (c2.length) tapCard(c2[(Math.random() * c2.length) | 0]); }
          }
        }
      },
      draw: function (c) {
        A.bg(bg);
        if (!backS) return;
        for (var i = 0; i < cards.length; i++) {
          var cd = cards[i], x = ox + (i % cols) * cw + 3, y = oy + ((i / cols) | 0) * ch + 3, w = cw - 6, h = ch - 6, s = Math.abs(cd.f * 2 - 1), face = cd.f > 0.5;
          c.save(); c.translate(x + w / 2 + (cd.wx || 0), y + h / 2 + (cd.wy || 0)); if (cd.wr) c.rotate(cd.wr * (i % 2 ? 1 : -1));
          c.scale(Math.max(0.04, s), 1);
          if (cd.done && !wind) c.globalAlpha = 0.55;
          c.drawImage(face ? faceS[cd.k] : backS, -w / 2, -h / 2, w, h);
          c.restore(); c.globalAlpha = 1;
        }
        var bw = cols * cw - 6, by = oy - 16;
        rr(c, ox + 3, by, bw, 8, 4); c.fillStyle = 'rgba(255,255,255,.14)'; c.fill();
        if (A.live() || dead) { rr(c, ox + 3, by, Math.max(8, bw * tb), 8, 4); c.fillStyle = tb < 0.25 ? '#F43F5E' : tb < 0.5 ? '#FACC15' : '#4ADE80'; c.fill(); }
      },
      act: function (k, x, y) { var j = Math.floor((x - ox) / cw), i = Math.floor((y - oy) / ch); if (j >= 0 && j < cols && i >= 0 && i < rowsN && i * cols + j < cards.length) tapCard(i * cols + j); },
      key: function () { },
      boom: function () { wind = { t: 0 }; cards.forEach(function (q) { q.vx = rnd(-500, 500); q.vy = -rnd(200, 700); q.up = 1; }); A.shake(0.3); },
      win: function () { won = 0.001; A.burst(W / 2, oy + rowsN * ch / 2, 20, ['#FDE68A', '#FFFFFF', '#818CF8'], 180, 0.6, 3); },
      dbg: function () { return { cards: cards.map(function (q) { return [q.k, q.up, q.done]; }), cols: cols, rows: rowsN, cw: cw, ch: ch, ox: ox, oy: oy, peek: peek, tb: tb, dead: dead, lvl: lvl, wait: waitT }; }
    };
  }, 'aim', 0.5);

  /* ================================================================== 7. ECHO PADS — four coloured pads light up in a sequence:
     tap them back in the same order. Each success adds one step and speeds it up. Wrong pad or a long wait = end. */
  boot('echopads', function (A) {
    var W, H, T, dpr, bg, cx, cy, R, seq = [], mode = 'show', si = 0, st = 0, lit = -1, litT = 0, inp = 0, idleT = 0, dead = 0, won = 0, cut = null, t = 0, wrong = -1, padS = [], ok = 0;
    var PC = [['#86EFAC', '#16A34A', '#14532D'], ['#FCA5A5', '#DC2626', '#7F1D1D'], ['#93C5FD', '#2563EB', '#1E3A8A'], ['#FDE68A', '#EAB308', '#713F12']];
    // pads: 0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left
    function padAt(x, y) { var dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d < R * 0.3 || d > R * 1.08) return -1; return dy < 0 ? (dx < 0 ? 0 : 1) : (dx < 0 ? 3 : 2); }
    function speed() { return A.live() ? Math.max(0.2, 0.46 - 0.06 * seq.length * 0.5 - 0.14 * A.lv()) : 0.42; }
    function newRound(add) { if (add) seq.push((Math.random() * 4) | 0); mode = 'show'; si = 0; st = -0.55; lit = -1; inp = 0; }
    function press(p) {
      if (dead || cut || won || p < 0) return;
      if (mode !== 'input') return;
      lit = p; litT = 0.22; idleT = 0; K.sfx('tick', { as: 'peg', p: p * 0.3 });
      if (p !== seq[inp]) { wrong = p; if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); } } else newRound(false); return; }
      inp++;
      if (inp >= seq.length) { mode = 'wait'; st = 0; ok++; A.burst(cx, cy, 12 + Math.min(10, seq.length), [PC[p][0], '#FDE68A', '#fff'], 160, 0.55, 3); if (seq.length % 4 === 3) A.ring(cx, cy, R * 1.1, '#FDE68A'); }
    }
    function padS1(k, on) {
      return mkc(R * 2 + 4, R * 2 + 4, dpr, function (c) {
        var m = R + 2, a0 = [Math.PI, Math.PI * 1.5, 0, Math.PI * 0.5][k], gap = 0.06;
        c.beginPath(); c.arc(m, m, R, a0 + gap, a0 + Math.PI / 2 - gap); c.arc(m, m, R * 0.36, a0 + Math.PI / 2 - gap * 2.4, a0 + gap * 2.4, true); c.closePath();
        var p = PC[k]; c.fillStyle = on ? rg(c, m, m, R, ['#FFFFFF', p[0], p[1]]) : rg(c, m, m, R, [p[1], p[2], p[2]]); c.fill();
        c.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.18)'; c.lineWidth = on ? 3 : 1.5; c.stroke();
      });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; cx = W / 2; cy = T + (H - T) / 2; R = Math.min(W * 0.42, (H - T) * 0.44, 210);
        padS = []; for (var k = 0; k < 4; k++) padS.push([padS1(k, false), padS1(k, true)]);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#09090B', '#1C1917', '#0C0A09']); c.fillRect(0, 0, W, H);
          circ(c, cx, cy, R * 1.5, rg(c, cx, cy, R * 1.5, ['rgba(250,204,21,.12)', 'rgba(250,204,21,0)']));
          circ(c, cx, cy, R * 1.1, '#18181B'); c.strokeStyle = '#3F3F46'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R * 1.1, 0, TAU); c.stroke();
        });
      },
      reset: function (live) { seq = []; for (var i = 0; i < (live ? 3 : 3); i++) seq.push((Math.random() * 4) | 0); newRound(false); dead = 0; won = 0; cut = null; wrong = -1; ok = 0; idleT = 0; },
      step: function (dt) {
        t += dt; litT = Math.max(0, litT - dt); if (litT <= 0 && mode === 'input') lit = -1;
        if (cut) { cut.t += dt; if (!cut.hit && cut.t > 0.6) { cut.hit = 1; A.explode(cx, cy, 1.3); } return; }
        if (dead || won) return;
        var sp = speed();
        if (mode === 'show') {
          st += dt;
          if (st >= 0) {
            var k = Math.floor(st / (sp * 1.3)), ph = st - k * sp * 1.3;
            if (k >= seq.length) { mode = 'input'; inp = 0; idleT = 0; lit = -1; return; }
            var nl = ph < sp ? seq[k] : -1;
            if (nl !== lit && nl >= 0) K.sfx('tick', { as: 'peg', p: nl * 0.3 });
            lit = nl;
          }
          return;
        }
        if (mode === 'wait') { st += dt; if (st > 0.6) newRound(true); return; }
        if (mode === 'input') {
          idleT += dt;
          if (A.live() && idleT > Math.max(2.4, 4 - 1.2 * A.lv())) { if (A.fail(A.l.fail2)) { dead = 1; } return; }
          if (A.idle() && idleT > 0.45) press(seq[inp]);
        }
      },
      draw: function (c) {
        A.bg(bg);
        for (var k = 0; k < 4; k++) {
          var on = !cut && (lit === k || (dead && wrong === k && (t * 6 | 0) % 2));
          if (cut) c.globalAlpha = Math.max(0.15, 1 - cut.t * 1.5);
          c.drawImage(padS[k][on ? 1 : 0], cx - R - 2, cy - R - 2, R * 2 + 4, R * 2 + 4);
          c.globalAlpha = 1;
        }
        circ(c, cx, cy, R * 0.3, lg(c, cx, cy - R * 0.3, cx, cy + R * 0.3, ['#3F3F46', '#18181B']));
        // step counter in the middle: dots for the sequence length
        var n = seq.length, rr2 = Math.max(2, R * 0.03), span = Math.min(R * 0.46, n * rr2 * 3);
        for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + i / n * TAU; circ(c, cx + Math.cos(a) * R * 0.2, cy + Math.sin(a) * R * 0.2, rr2, mode === 'input' && i < inp ? '#FDE68A' : mode === 'show' ? '#A1A1AA' : '#52525B'); }
        void span;
        if (mode === 'input' && !dead && A.live()) { var lim = Math.max(2.4, 4 - 1.2 * A.lv()), f = Math.min(1, idleT / lim); c.strokeStyle = f > 0.7 ? '#F43F5E' : '#FDE68A'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R * 0.3 + 4, -Math.PI / 2, -Math.PI / 2 + (1 - f) * TAU); c.stroke(); }
        if (cut && cut.t < 1.2) { for (i = 0; i < 6; i++) { var a2 = Math.random() * TAU, rd = R * rnd(0.4, 1.1); spark(c, cx + Math.cos(a2) * rd, cy + Math.sin(a2) * rd, R * 0.06, '#FDE68A'); } }
      },
      act: function (k, x, y) { press(padAt(x, y)); },
      key: function (k) { press({ up: 0, right: 1, down: 2, left: 3 }[k]); },
      boom: function () { cut = { t: 0 }; lit = -1; A.flash(0.4); },
      win: function () { won = 0.001; A.burst(cx, cy, 20, ['#FDE68A', '#FFFFFF', '#86EFAC'], 180, 0.6, 3); },
      dbg: function () { return { seq: seq, mode: mode, inp: inp, lit: lit, cx: cx, cy: cy, R: R, dead: dead, idle: idleT }; }
    };
  }, 'aim', 0.5);

  /* ================================================================== 8. PIANO KEYS — rows of keys scroll down; tap the black key
     of each row, from the bottom up. White key or a missed black key = end. The tempo rises with time. */
  boot('pianokeys', function (A) {
    var topS = '#0F172A', fadeT = null, W, H, T, dpr, bg, ox, cw, rh, rowsK = [], off = 0, sp = 0, nextI = 0, gen = 0, dead = 0, won = 0, snap = null, t = 0, bad = null, startT = 0, aiT = 0, lastC = -1;
    function addRow() { var c; do { c = (Math.random() * 4) | 0; } while (c === lastC && Math.random() < 0.6); lastC = c; rowsK.push({ i: gen++, c: c, hit: 0, ht: 0 }); }
    function rowY(r) { return H - (r.i + 1) * rh + off; } // top of the row
    function hitRow(c) {
      var r = rowsK.filter(function (q) { return !q.hit; })[0]; if (!r) return;
      if (c === r.c) { r.hit = 1; r.ht = 0; K.sfx('tick', { as: 'peg', p: 0.2 + c * 0.25 }); A.burst(ox + (c + 0.5) * cw, rowY(r) + rh / 2, 5, ['#E0E7FF', '#A5B4FC', '#fff'], 110, 0.4, 2.6, 0); if (startT > 0) startT = 0; return true; }
      bad = { r: r, c: c, t: 0 };
      if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.35); } }
      return false;
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top;
        fadeT = mkc(W, 24, dpr, function (c) { c.fillStyle = lg(c, 0, 0, 0, 24, ['rgba(15,23,42,1)', 'rgba(15,23,42,0)']); c.fillRect(0, 0, W, 24); });
        cw = Math.floor(Math.min((W - 8) / 4, 130)); ox = Math.round((W - cw * 4) / 2); rh = Math.max(60, Math.round((H - T) / 3.6));
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#F8FAFC', '#E2E8F0']); c.fillRect(0, 0, W, H);
          c.fillStyle = '#0F172A'; c.fillRect(0, 0, ox, H); c.fillRect(ox + cw * 4, 0, W, H);
          c.strokeStyle = 'rgba(15,23,42,.18)'; c.lineWidth = 1; c.beginPath(); for (var i = 1; i < 4; i++) { c.moveTo(ox + i * cw + 0.5, 0); c.lineTo(ox + i * cw + 0.5, H); } c.stroke();
        });
      },
      reset: function (live) { rowsK = []; gen = 0; off = 0; lastC = -1; for (var i = 0; i < 8; i++) addRow(); dead = 0; won = 0; snap = null; bad = null; startT = live ? 1.2 : 0; nextI = 0; },
      step: function (dt, live) {
        t += dt;
        if (snap) { snap.t += dt; rowsK.forEach(function (r) { r.fy = (r.fy || 0) + (r.vy = (r.vy || rnd(-100, 0)) + 1500 * dt) * dt; }); if (!snap.hit && snap.t > 0.3) { snap.hit = 1; A.explode(W / 2, H * 0.6, 1.2); } return; }
        if (bad) bad.t += dt;
        if (dead || won) return;
        var lv = live ? A.lv() : 0;
        sp = (A.idle() ? 2.2 : 1.9 + 2.6 * lv) * rh;
        if (startT > 0) { startT -= dt; if (startT > 0) return; }
        off += sp * dt;
        rowsK.forEach(function (r) { if (r.hit) r.ht += dt; });
        while (rowY(rowsK[rowsK.length - 1]) > T - rh * 2) addRow();
        while (rowsK.length && rowY(rowsK[0]) > H + rh) rowsK.shift();
        var first = rowsK.filter(function (q) { return !q.hit; })[0];
        if (A.idle() && first && rowY(first) + rh > H * 0.62) hitRow(first.c);
        if (first && rowY(first) > H - rh * 0.15) {
          if (A.live()) { bad = { r: first, c: first.c, t: 0, miss: 1 }; off -= rh * 0.6; if (A.fail(A.l.fail2)) { dead = 1; A.shake(0.3); } }
          else first.hit = 1;
        }
      },
      draw: function (c) {
        A.bg(bg);
        for (var i = 0; i < rowsK.length; i++) {
          var r = rowsK[i], y = rowY(r) + (r.fy || 0); if (y > H || y + rh < 0) continue;
          var x = ox + r.c * cw;
          if (r.hit) { c.fillStyle = 'rgba(100,116,139,' + Math.max(0.18, 0.5 - r.ht) + ')'; c.fillRect(x + 1, y + 1, cw - 2, rh - 2); continue; }
          c.fillStyle = lg(c, x, y, x, y + rh, ['#1E293B', '#020617']); c.fillRect(x + 1, y + 1, cw - 2, rh - 2);
          c.fillStyle = 'rgba(148,163,184,.25)'; c.fillRect(x + cw * 0.15, y + rh - 10, cw * 0.7, 3);
          if (startT > 0 && r.i === 0) { c.fillStyle = '#FDE68A'; c.font = '800 ' + Math.round(cw * 0.2) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('▶', x + cw / 2, y + rh / 2); }
        }
        c.strokeStyle = 'rgba(15,23,42,.12)'; c.lineWidth = 1; c.beginPath();
        for (i = 0; i < rowsK.length; i++) { var yy = Math.round(rowY(rowsK[i])) + 0.5; c.moveTo(ox, yy); c.lineTo(ox + cw * 4, yy); } c.stroke();
        if (bad && (bad.t * 6 | 0) % 2 === 0) { var by = rowY(bad.r); c.fillStyle = 'rgba(244,63,94,.75)'; c.fillRect(ox + bad.c * cw + 1, by + 1, cw - 2, rh - 2); }
        // the top band (multiplier + status) stays dark: keys slide in under it
        c.fillStyle = topS; c.fillRect(0, 0, W, T); c.drawImage(fadeT, 0, T, W, 24);
      },
      act: function (k, x, y) {
        if (dead || snap || won) return;
        var col = Math.floor((x - ox) / cw); if (col < 0 || col > 3) return;
        var r = rowsK.filter(function (q) { return !q.hit; })[0]; if (!r) return;
        var top = rowY(r);
        if (y < top - rh * 0.6) return; // far above the next row: ignored (no punishment)
        hitRow(col);
      },
      key: function (k) { if (dead || snap || won) return; var col = { left: 0, down: 1, up: 2, right: 3 }[k]; if (col !== undefined) hitRow(col); },
      boom: function () { snap = { t: 0 }; A.shake(0.4); },
      win: function () { won = 0.001; A.burst(W / 2, H * 0.6, 20, ['#FDE68A', '#6366F1', '#0F172A'], 180, 0.6, 3); },
      dbg: function () { var r = rowsK.filter(function (q) { return !q.hit; })[0]; return { next: r ? { c: r.c, y: rowY(r) } : null, rh: rh, ox: ox, cw: cw, dead: dead, sp: sp, start: startT }; }
    };
  }, 'aim', 0.42);
})(window.D6 = window.D6 || {});
