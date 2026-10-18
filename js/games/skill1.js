/* v2805 — "You're in control" group 1 (owner request): Space Runner, Flappy Rocket, Tower Stack, Star Blades, Basket Shot,
   Penalty Kicker. MIXED MODE like Aviator, but the player plays: bet → the multiplier grows with time while you play
   (one gesture: tap or swipe) → gold CASH OUT at any moment. A mistake ends the round; the server's secret end arrives
   as an unavoidable meteor. Canvas 2D, 60 fps, devicePixelRatio ≤ 2, sprites pre-drawn once per size, pauses when the
   tab is hidden. The server (casino_ext.php, type 'skill') draws everything and pays; this file only shows it. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cash: 'Cash out', end: 'Meteor strike!', crash: 'Crashed!', miss: 'Missed!', clash: 'Blade clash!', save: 'Saved!', late: 'Too late!',
      h_jump: 'Tap to jump', h_boost: 'Tap to boost', h_drop: 'Tap to drop', h_throw: 'Tap to throw', h_shoot: 'Swipe up to shoot', h_kick: 'Swipe to shoot' },
    fr: { bet: 'Miser', cash: 'Encaisser', end: 'Météorite !', crash: 'Crash !', miss: 'Raté !', clash: 'Lames croisées !', save: 'Arrêté !', late: 'Trop tard !',
      h_jump: 'Touche pour sauter', h_boost: 'Touche pour propulser', h_drop: 'Touche pour poser', h_throw: 'Touche pour lancer', h_shoot: 'Glisse vers le haut pour tirer', h_kick: 'Glisse pour tirer' },
    es: { bet: 'Apostar', cash: 'Retirar', end: '¡Meteorito!', crash: '¡Choque!', miss: '¡Fallo!', clash: '¡Choque de cuchillas!', save: '¡Atajada!', late: '¡Muy tarde!',
      h_jump: 'Toca para saltar', h_boost: 'Toca para impulsar', h_drop: 'Toca para soltar', h_throw: 'Toca para lanzar', h_shoot: 'Desliza hacia arriba para tirar', h_kick: 'Desliza para chutar' },
    pt: { bet: 'Apostar', cash: 'Sacar', end: 'Meteoro!', crash: 'Bateu!', miss: 'Errou!', clash: 'Lâminas batem!', save: 'Defendeu!', late: 'Tarde demais!',
      h_jump: 'Toque para pular', h_boost: 'Toque para impulsionar', h_drop: 'Toque para soltar', h_throw: 'Toque para lançar', h_shoot: 'Deslize para cima para arremessar', h_kick: 'Deslize para chutar' },
    ar: { bet: 'راهن', cash: 'اسحب', end: 'نيزك!', crash: 'اصطدام!', miss: 'أخطأت!', clash: 'تصادم الشفرات!', save: 'تصدّى!', late: 'متأخر جدًا!',
      h_jump: 'المس للقفز', h_boost: 'المس للدفع', h_drop: 'المس للإسقاط', h_throw: 'المس للرمي', h_shoot: 'اسحب للأعلى للتسديد', h_kick: 'اسحب للتسديد' },
    tr: { bet: 'Bahis', cash: 'Çek', end: 'Meteor çarptı!', crash: 'Çarptı!', miss: 'Kaçtı!', clash: 'Bıçaklar çarpıştı!', save: 'Kurtardı!', late: 'Çok geç!',
      h_jump: 'Zıplamak için dokun', h_boost: 'İtmek için dokun', h_drop: 'Bırakmak için dokun', h_throw: 'Fırlatmak için dokun', h_shoot: 'Atmak için yukarı kaydır', h_kick: 'Şut için kaydır' },
    vi: { bet: 'Cược', cash: 'Rút', end: 'Thiên thạch!', crash: 'Va chạm!', miss: 'Trượt!', clash: 'Va lưỡi dao!', save: 'Bị cản!', late: 'Quá muộn!',
      h_jump: 'Chạm để nhảy', h_boost: 'Chạm để tăng tốc', h_drop: 'Chạm để thả', h_throw: 'Chạm để phóng', h_shoot: 'Vuốt lên để ném', h_kick: 'Vuốt để sút' },
    id: { bet: 'Pasang', cash: 'Tarik', end: 'Meteor!', crash: 'Tabrakan!', miss: 'Meleset!', clash: 'Pisau beradu!', save: 'Ditepis!', late: 'Terlambat!',
      h_jump: 'Ketuk untuk lompat', h_boost: 'Ketuk untuk dorong', h_drop: 'Ketuk untuk jatuhkan', h_throw: 'Ketuk untuk lempar', h_shoot: 'Geser ke atas untuk menembak', h_kick: 'Geser untuk menendang' },
    ru: { bet: 'Ставка', cash: 'Забрать', end: 'Метеорит!', crash: 'Авария!', miss: 'Мимо!', clash: 'Клинки столкнулись!', save: 'Сейв!', late: 'Поздно!',
      h_jump: 'Нажми — прыжок', h_boost: 'Нажми — ускорение', h_drop: 'Нажми — сбросить', h_throw: 'Нажми — бросок', h_shoot: 'Смахни вверх — бросок', h_kick: 'Смахни — удар' },
    de: { bet: 'Setzen', cash: 'Auszahlen', end: 'Meteorit!', crash: 'Crash!', miss: 'Daneben!', clash: 'Klingen-Crash!', save: 'Gehalten!', late: 'Zu spät!',
      h_jump: 'Tippen zum Springen', h_boost: 'Tippen für Schub', h_drop: 'Tippen zum Absetzen', h_throw: 'Tippen zum Werfen', h_shoot: 'Nach oben wischen zum Werfen', h_kick: 'Wischen zum Schießen' },
    hi: { bet: 'दांव', cash: 'कैश आउट', end: 'उल्कापिंड!', crash: 'टक्कर!', miss: 'चूक गए!', clash: 'ब्लेड टकराए!', save: 'बचा लिया!', late: 'बहुत देर!',
      h_jump: 'कूदने के लिए टैप करें', h_boost: 'बूस्ट के लिए टैप करें', h_drop: 'गिराने के लिए टैप करें', h_throw: 'फेंकने के लिए टैप करें', h_shoot: 'शूट के लिए ऊपर स्वाइप करें', h_kick: 'शॉट के लिए स्वाइप करें' },
    zh: { bet: '下注', cash: '兑现', end: '陨石撞击！', crash: '撞上了！', miss: '没中！', clash: '飞刀相撞！', save: '被扑出！', late: '太慢了！',
      h_jump: '点击跳跃', h_boost: '点击推进', h_drop: '点击放下', h_throw: '点击投掷', h_shoot: '向上滑动投篮', h_kick: '滑动射门' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }

  /* ---------- rules (3 short honest steps, 12 languages) ---------- */
  var R1 = {
    en: '1. Bet to start: the multiplier grows while you play.',
    fr: '1. Mise pour commencer : le multiplicateur monte pendant que tu joues.',
    es: '1. Apuesta para empezar: el multiplicador sube mientras juegas.',
    pt: '1. Aposte para começar: o multiplicador sobe enquanto você joga.',
    ar: '1. راهن لتبدأ: يرتفع المضاعف أثناء لعبك.',
    tr: '1. Başlamak için bahis yap: sen oynarken çarpan yükselir.',
    vi: '1. Đặt cược để bắt đầu: hệ số tăng dần khi bạn chơi.',
    id: '1. Pasang taruhan untuk mulai: pengali naik selama kamu bermain.',
    ru: '1. Сделай ставку: пока ты играешь, множитель растёт.',
    de: '1. Setze, um zu starten: Der Multiplikator steigt, während du spielst.',
    hi: '1. शुरू करने के लिए दांव लगाएँ: आपके खेलते समय गुणक बढ़ता है।',
    zh: '1. 下注开始：你游戏时倍数不断上升。'
  };
  var R3 = {
    en: '3. The round can also end at any random moment (a meteor, like the plane in Aviator): cash out before it hits to win your bet × the multiplier!',
    fr: '3. La partie peut aussi s’arrêter à tout moment au hasard (une météorite, comme l’avion d’Aviator) : encaisse avant pour gagner ta mise × le multiplicateur !',
    es: '3. La ronda también puede terminar en cualquier momento al azar (un meteorito, como el avión de Aviator): ¡retira antes para ganar tu apuesta × el multiplicador!',
    pt: '3. A rodada também pode acabar a qualquer momento aleatório (um meteoro, como o avião do Aviator): saque antes para ganhar sua aposta × o multiplicador!',
    ar: '3. قد تنتهي الجولة أيضًا في أي لحظة عشوائية (نيزك، مثل الطائرة في Aviator): اسحب قبلها لتربح رهانك × المضاعف!',
    tr: '3. Tur rastgele herhangi bir anda da bitebilir (Aviator’daki uçak gibi bir meteor): bahis × çarpanı kazanmak için önce çek!',
    vi: '3. Ván cũng có thể kết thúc vào bất kỳ lúc nào ngẫu nhiên (một thiên thạch, như máy bay trong Aviator): hãy rút trước để nhận tiền cược × hệ số!',
    id: '3. Ronde juga bisa berakhir kapan saja secara acak (meteor, seperti pesawat di Aviator): tarik sebelumnya untuk menang taruhan × pengali!',
    ru: '3. Раунд может закончиться и в любой случайный момент (метеорит, как самолёт в Aviator): забери раньше и выиграй ставку × множитель!',
    de: '3. Die Runde kann auch jederzeit zufällig enden (ein Meteorit, wie das Flugzeug bei Aviator): Zahle vorher aus und gewinne Einsatz × Multiplikator!',
    hi: '3. राउंड किसी भी अचानक पल पर भी खत्म हो सकता है (उल्कापिंड, जैसे Aviator का विमान): दांव × गुणक जीतने के लिए उससे पहले कैश आउट करें!',
    zh: '3. 本轮也可能在任意随机时刻结束（陨石，就像 Aviator 的飞机）：在它击中前兑现，赢得 下注 × 倍数！'
  };
  var R2 = {
    spacerun: {
      en: '2. Tap to jump over craters and rocks — hitting one ends the round.',
      fr: '2. Touche pour sauter par-dessus les cratères et les rochers — en toucher un termine la partie.',
      es: '2. Toca para saltar cráteres y rocas: chocar con uno termina la ronda.',
      pt: '2. Toque para pular crateras e rochas — bater em uma encerra a rodada.',
      ar: '2. المس للقفز فوق الحفر والصخور — الاصطدام بأحدها ينهي الجولة.',
      tr: '2. Kraterlerin ve kayaların üstünden zıplamak için dokun — birine çarpmak turu bitirir.',
      vi: '2. Chạm để nhảy qua hố và đá — va vào là hết ván.',
      id: '2. Ketuk untuk melompati kawah dan batu — menabraknya mengakhiri ronde.',
      ru: '2. Нажимай, чтобы перепрыгивать кратеры и камни — столкновение завершает раунд.',
      de: '2. Tippe, um über Krater und Felsen zu springen — ein Treffer beendet die Runde.',
      hi: '2. गड्ढों और चट्टानों के ऊपर कूदने के लिए टैप करें — टकराने पर राउंड खत्म।',
      zh: '2. 点击跳过陨坑和岩石——撞上就结束本轮。'
    },
    flappyrock: {
      en: '2. Tap to boost the rocket through the gaps between asteroids — touching one ends the round.',
      fr: '2. Touche pour propulser la fusée entre les astéroïdes — en toucher un termine la partie.',
      es: '2. Toca para impulsar el cohete entre los asteroides: tocar uno termina la ronda.',
      pt: '2. Toque para impulsionar o foguete entre os asteroides — tocar um encerra a rodada.',
      ar: '2. المس لدفع الصاروخ عبر الفجوات بين الكويكبات — لمس أحدها ينهي الجولة.',
      tr: '2. Roketi asteroitlerin arasından geçirmek için dokun — birine değmek turu bitirir.',
      vi: '2. Chạm để đẩy tên lửa qua khe giữa các tiểu hành tinh — chạm vào là hết ván.',
      id: '2. Ketuk untuk mendorong roket melewati celah asteroid — menyentuhnya mengakhiri ronde.',
      ru: '2. Нажимай, чтобы провести ракету между астероидами — касание завершает раунд.',
      de: '2. Tippe, um die Rakete durch die Lücken zwischen den Asteroiden zu schieben — eine Berührung beendet die Runde.',
      hi: '2. रॉकेट को क्षुद्रग्रहों के बीच से निकालने के लिए टैप करें — छूने पर राउंड खत्म।',
      zh: '2. 点击推进火箭穿过小行星之间的缝隙——碰到就结束本轮。'
    },
    stack: {
      en: '2. Tap to drop each block on the tower: the overhang is cut off; missing the tower ends the round.',
      fr: '2. Touche pour poser chaque bloc sur la tour : ce qui dépasse est coupé ; rater la tour termine la partie.',
      es: '2. Toca para soltar cada bloque sobre la torre: lo que sobresale se corta; fallar la torre termina la ronda.',
      pt: '2. Toque para soltar cada bloco na torre: o que sobra é cortado; errar a torre encerra a rodada.',
      ar: '2. المس لإسقاط كل كتلة على البرج: يُقطع الجزء الزائد؛ إخطاء البرج ينهي الجولة.',
      tr: '2. Her bloğu kuleye bırakmak için dokun: taşan kısım kesilir; kuleyi kaçırmak turu bitirir.',
      vi: '2. Chạm để thả từng khối lên tháp: phần thừa bị cắt; trượt khỏi tháp là hết ván.',
      id: '2. Ketuk untuk menjatuhkan tiap balok ke menara: bagian yang menjorok dipotong; meleset dari menara mengakhiri ronde.',
      ru: '2. Нажимай, чтобы класть блоки на башню: выступ обрезается; промах мимо башни завершает раунд.',
      de: '2. Tippe, um jeden Block auf den Turm zu setzen: Der Überstand wird abgeschnitten; den Turm zu verfehlen beendet die Runde.',
      hi: '2. हर ब्लॉक को टावर पर गिराने के लिए टैप करें: बाहर निकला हिस्सा कट जाता है; टावर चूकने पर राउंड खत्म।',
      zh: '2. 点击把方块放到塔上：伸出的部分会被切掉；没放到塔上就结束本轮。'
    },
    knifehit: {
      en: '2. Tap to throw blades into the spinning planet before the ring empties — hitting a blade already stuck ends the round.',
      fr: '2. Touche pour lancer les lames dans la planète qui tourne avant que l’anneau se vide — toucher une lame déjà plantée termine la partie.',
      es: '2. Toca para lanzar cuchillas al planeta que gira antes de que se vacíe el anillo: golpear una ya clavada termina la ronda.',
      pt: '2. Toque para lançar lâminas no planeta que gira antes de o anel esvaziar — acertar uma lâmina já cravada encerra a rodada.',
      ar: '2. المس لرمي الشفرات في الكوكب الدوّار قبل أن تفرغ الحلقة — إصابة شفرة مغروسة تنهي الجولة.',
      tr: '2. Halka boşalmadan dönen gezegene bıçak fırlatmak için dokun — saplanmış bir bıçağa çarpmak turu bitirir.',
      vi: '2. Chạm để phóng lưỡi dao vào hành tinh đang quay trước khi vòng cạn — trúng lưỡi dao đã cắm là hết ván.',
      id: '2. Ketuk untuk melempar pisau ke planet yang berputar sebelum cincin habis — mengenai pisau yang sudah menancap mengakhiri ronde.',
      ru: '2. Нажимай, чтобы бросать клинки во вращающуюся планету, пока кольцо не опустело — попадание в воткнутый клинок завершает раунд.',
      de: '2. Tippe, um Klingen in den drehenden Planeten zu werfen, bevor der Ring leer ist — eine steckende Klinge zu treffen beendet die Runde.',
      hi: '2. घेरा खाली होने से पहले घूमते ग्रह में ब्लेड फेंकने के लिए टैप करें — पहले से धँसे ब्लेड से टकराने पर राउंड खत्म।',
      zh: '2. 在圆环耗尽前点击把飞刀掷向旋转的星球——击中已插上的飞刀就结束本轮。'
    },
    basket: {
      en: '2. Swipe up to throw the ball into the moving hoop before the ring empties — a miss ends the round.',
      fr: '2. Glisse vers le haut pour lancer le ballon dans le panier qui bouge avant que l’anneau se vide — un raté termine la partie.',
      es: '2. Desliza hacia arriba para lanzar el balón al aro que se mueve antes de que se vacíe el anillo: un fallo termina la ronda.',
      pt: '2. Deslize para cima para arremessar a bola na cesta que se move antes de o anel esvaziar — um erro encerra a rodada.',
      ar: '2. اسحب للأعلى لرمي الكرة في السلة المتحركة قبل أن تفرغ الحلقة — الإخفاق ينهي الجولة.',
      tr: '2. Halka boşalmadan topu hareket eden potaya atmak için yukarı kaydır — kaçırmak turu bitirir.',
      vi: '2. Vuốt lên để ném bóng vào rổ đang di chuyển trước khi vòng cạn — ném trượt là hết ván.',
      id: '2. Geser ke atas untuk melempar bola ke ring yang bergerak sebelum cincin habis — meleset mengakhiri ronde.',
      ru: '2. Смахни вверх, чтобы бросить мяч в движущееся кольцо, пока таймер не опустел — промах завершает раунд.',
      de: '2. Wische nach oben, um den Ball in den beweglichen Korb zu werfen, bevor der Ring leer ist — ein Fehlwurf beendet die Runde.',
      hi: '2. घेरा खाली होने से पहले चलती बास्केट में गेंद डालने के लिए ऊपर स्वाइप करें — चूकने पर राउंड खत्म।',
      zh: '2. 在圆环耗尽前向上滑动，把球投进移动的篮筐——投失就结束本轮。'
    },
    kicker: {
      en: '2. Swipe to shoot past the moving keeper into the goal before the ring empties — a save or a miss ends the round.',
      fr: '2. Glisse pour tirer dans le but en évitant le gardien qui bouge, avant que l’anneau se vide — un arrêt ou un tir raté termine la partie.',
      es: '2. Desliza para chutar al arco esquivando al portero que se mueve antes de que se vacíe el anillo: una atajada o un fallo termina la ronda.',
      pt: '2. Deslize para chutar no gol, longe do goleiro que se move, antes de o anel esvaziar — uma defesa ou um erro encerra a rodada.',
      ar: '2. اسحب للتسديد في المرمى بعيدًا عن الحارس المتحرك قبل أن تفرغ الحلقة — التصدي أو الإخفاق ينهي الجولة.',
      tr: '2. Halka boşalmadan hareket eden kaleciyi geçip kaleye şut çekmek için kaydır — kurtarış ya da ıska turu bitirir.',
      vi: '2. Vuốt để sút qua thủ môn đang di chuyển vào khung thành trước khi vòng cạn — bị cản hoặc sút trượt là hết ván.',
      id: '2. Geser untuk menendang melewati kiper yang bergerak ke gawang sebelum cincin habis — ditepis atau meleset mengakhiri ronde.',
      ru: '2. Смахни, чтобы пробить мимо движущегося вратаря в ворота, пока таймер не опустел — сейв или промах завершает раунд.',
      de: '2. Wische, um am beweglichen Torwart vorbei ins Tor zu schießen, bevor der Ring leer ist — eine Parade oder ein Fehlschuss beendet die Runde.',
      hi: '2. घेरा खाली होने से पहले चलते गोलकीपर से बचाकर गोल में शॉट के लिए स्वाइप करें — बचाव या चूक पर राउंड खत्म।',
      zh: '2. 在圆环耗尽前滑动射门，避开移动的守门员——被扑出或射偏就结束本轮。'
    }
  };
  function rules(k) { var o = {}; Object.keys(R1).forEach(function (lg) { o[lg] = R1[lg] + '\n' + R2[k][lg] + '\n' + R3[lg]; }); return o; }

  /* ---------- small drawing helpers (canvas, world units) ---------- */
  var PI2 = Math.PI * 2;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  // offscreen sprite drawn once (in world units, at the current pixel scale k)
  function sprite(wu, hu, k, fn) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(wu * k)); c.height = Math.max(1, Math.ceil(hu * k));
    var x = c.getContext('2d'); x.scale(c.width / wu, c.height / hu); fn(x);
    return c;
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function grad(c, x0, y0, x1, y1, st) { var g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(function (s, i) { g.addColorStop(i / (st.length - 1), s); }); return g; }
  function rgrad(c, x, y, r, st, fx, fy) { var g = c.createRadialGradient(x + (fx || 0), y + (fy || 0), 0, x, y, r); st.forEach(function (s, i) { g.addColorStop(i / (st.length - 1), s); }); return g; }
  function rock(c, cx, cy, r, seed, cols) {
    c.beginPath();
    for (var i = 0; i < 9; i++) { var a = i / 9 * PI2, q = r * (0.82 + 0.18 * Math.sin(seed * 7.1 + i * 2.3)); c[i ? 'lineTo' : 'moveTo'](cx + q * Math.cos(a), cy + q * Math.sin(a)); }
    c.closePath(); c.fillStyle = rgrad(c, cx, cy, r * 1.1, cols, -r * 0.35, -r * 0.4); c.fill();
    c.fillStyle = 'rgba(0,0,0,.22)';
    [[0.3, 0.2, 0.22], [-0.35, 0.3, 0.16], [0.1, -0.4, 0.12]].forEach(function (p) { c.beginPath(); c.arc(cx + p[0] * r, cy + p[1] * r, p[2] * r, 0, PI2); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(cx - r * 0.35, cy - r * 0.4, r * 0.18, 0, PI2); c.fill();
  }
  // shared background: deep violet sky + stars + a distant planet (drawn once per size, in pixels)
  function sky(W, H, dpr, hue) {
    var c = document.createElement('canvas'); c.width = Math.ceil(W * dpr); c.height = Math.ceil(H * dpr);
    var x = c.getContext('2d'); x.scale(dpr, dpr);
    x.fillStyle = grad(x, 0, 0, 0, H, ['#1B1442', '#120C33', '#0B0722']); x.fillRect(0, 0, W, H);
    x.fillStyle = rgrad(x, W * 0.5, -H * 0.1, Math.max(W, H) * 0.8, ['rgba(139,92,246,.30)', 'rgba(139,92,246,0)']); x.fillRect(0, 0, W, H);
    var n = Math.round(W * H / 2600), s = 7;
    for (var i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; var px = s / 233280 * W; s = (s * 9301 + 49297) % 233280; var py = s / 233280 * H; x.globalAlpha = 0.25 + (i % 5) * 0.14; x.fillStyle = i % 9 ? '#fff' : '#FDE68A'; x.fillRect(px, py, i % 7 ? 1 : 1.6, i % 7 ? 1 : 1.6); }
    x.globalAlpha = 1;
    var pr = Math.min(W, H) * 0.1, pxl = W * 0.9, pyl = H * 0.12;
    x.fillStyle = rgrad(x, pxl, pyl, pr * 1.9, [hue + '55', hue + '00']); x.fillRect(pxl - pr * 2, pyl - pr * 2, pr * 4, pr * 4);
    x.fillStyle = rgrad(x, pxl, pyl, pr, ['#FDE68A', hue, '#1C0A2E'], -pr * 0.4, -pr * 0.4); x.globalAlpha = 0.4; x.beginPath(); x.arc(pxl, pyl, pr, 0, PI2); x.fill(); x.globalAlpha = 1;
    return c;
  }

  /* ---------- the six games: state in world units (1 u = w.s px) ---------- */
  var DEF = {};

  /* 1. SPACE RUNNER — tap to jump over rocks and craters */
  DEF.spacerun = {
    hint: 'h_jump', gest: 'tap', hue: '#22C55E',
    scale: function (W, H) { return H / 100; },
    art: function (w, k) {
      w.sp = {
        body: sprite(12, 16, k, function (c) {
          rr(c, 1.2, 6.5, 5, 7, 1.5); c.fillStyle = '#94A3B8'; c.fill(); // backpack
          rr(c, 3, 6, 6.6, 7.6, 2.6); c.fillStyle = grad(c, 3, 6, 9.6, 13.6, ['#FFFFFF', '#E2E8F0', '#94A3B8']); c.fill();
          c.fillStyle = '#16A34A'; c.fillRect(4, 9.4, 5.2, 1.2);
          c.beginPath(); c.arc(6.8, 4.2, 4, 0, PI2); c.fillStyle = grad(c, 3, 0, 10, 8, ['#FFFFFF', '#CBD5E1']); c.fill();
          rr(c, 6.4, 2.4, 4.4, 3.4, 1.6); c.fillStyle = grad(c, 6, 2, 11, 6, ['#FDE68A', '#F59E0B', '#92400E']); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.55; c.beginPath(); c.arc(8.2, 3.6, 1.2, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
        }),
        rock: [0, 1].map(function (v) { return sprite(10, 9, k, function (c) { rock(c, 5, 5, 4.4, v + 1, ['#C4B5FD', '#7C3AED', '#2E1065']); }); }),
        ground: sprite(120, 24, k, function (c) {
          c.fillStyle = grad(c, 0, 0, 0, 24, ['#7C3AED', '#4C1D95', '#1E1047']); c.fillRect(0, 0, 120, 24);
          c.fillStyle = '#A78BFA'; c.fillRect(0, 0, 120, 0.9);
          for (var i = 0; i < 9; i++) { c.fillStyle = 'rgba(15,6,40,.35)'; c.beginPath(); c.ellipse(i * 13.3 + 4, 6 + (i % 3) * 5, 2.4 + (i % 2), 0.9, 0, 0, PI2); c.fill(); }
          c.fillStyle = 'rgba(255,255,255,.12)'; for (var j = 0; j < 14; j++) c.fillRect(j * 8.6 + 2, 3 + (j % 4) * 4.5, 0.6, 0.6);
        }),
        hills: sprite(200, 30, k, function (c) {
          c.beginPath(); c.moveTo(0, 30);
          for (var x = 0; x <= 200; x += 5) c.lineTo(x, 30 - 10 - 7 * Math.sin(x / 200 * PI2 * 2) - 4 * Math.sin(x / 200 * PI2 * 5 + 1));
          c.lineTo(200, 30); c.closePath(); c.fillStyle = 'rgba(91,33,182,.55)'; c.fill();
        })
      };
    },
    reset: function (w) {
      w.dist = 0; w.v = 0; w.y = 0; w.vy = 0; w.air = 0; w.obs = []; w.next = 70; w.buf = 0; w.dead = 0; w.leg = 0; w.rot = 0; w.fall = 0;
    },
    gy: 80,
    rx: function (w) { return Math.max(14, w.VW * 0.22); },
    tap: function (w) { if (w.dead) return; if (!w.air) { w.vy = -160; w.air = 1; } else w.buf = 0.16; },
    step: function (w, dt, mode) {
      var play = mode === 'play' || mode === 'hold';
      var tv = mode === 'idle' ? 22 : mode === 'post' ? 0 : Math.min(70, 42 + w.t * 1.1);
      w.v += (tv - w.v) * Math.min(1, dt * (mode === 'post' ? 2.5 : 3));
      w.dist += w.v * dt; w.leg += w.v * dt * 0.42;
      if (w.air || w.dead === 1) {
        w.vy += 533 * dt; w.y += w.vy * dt;
        if (w.y >= 0 && !w.fall) { w.y = 0; w.vy = 0; w.air = 0; if (w.buf > 0 && play && !w.dead) { w.vy = -160; w.air = 1; } }
      }
      if (w.fall) { w.vy += 300 * dt; w.y += w.vy * dt; }
      if (w.dead === 1) w.rot = w.air ? w.rot + dt * 7 : Math.PI / 2;
      w.buf = Math.max(0, w.buf - dt);
      var rx = this.rx(w);
      if (mode === 'idle' && !w.air && Math.random() < dt * 0.35) this.tap(w); // little hops in the attract scene
      if (play) { // spawn: always jumpable (gap ≥ a jump + reaction), difficulty grows slowly
        var ahead = w.dist + w.VW;
        while (w.next < ahead + 20) {
          var crater = w.t > 4 && Math.random() < 0.4, wd = crater ? rnd(8, 12 + Math.min(3, w.t * 0.08)) : 7;
          w.obs.push({ x: w.next, w: wd, c: crater, v: Math.random() < 0.5 ? 0 : 1 });
          var jd = Math.max(42, w.v) * 0.6;
          w.next += wd + jd + 20 + rnd(0, Math.max(14, 46 - w.t * 0.9));
        }
      }
      while (w.obs.length && w.obs[0].x + w.obs[0].w < w.dist - rx - 10) w.obs.shift();
      if (mode !== 'play' || w.dead) return null;
      for (var i = 0; i < w.obs.length; i++) {
        var o = w.obs[i], ox = rx + o.x - w.dist;
        if (o.c) { if (!w.air && rx > ox + 1.8 && rx < ox + o.w - 1.8) { w.fall = 1; w.dead = 2; w.vy = 10; return 'crash'; } }
        else if (rx + 2.4 > ox + 1.2 && rx - 2.4 < ox + o.w - 1.2 && -w.y < 6.2) { w.dead = 1; w.vy = -70; w.air = 1; return 'crash'; }
      }
      return null;
    },
    focus: function (w) { return { x: this.rx(w), y: this.gy + w.y - 8 }; },
    hit: function (w) { w.gone = 1; },
    draw: function (w, c) {
      var sp = w.sp, gy = this.gy, rx = this.rx(w), i;
      var hx = -((w.dist * 0.3) % 200);
      for (i = 0; hx + i * 200 < w.VW; i++) c.drawImage(sp.hills, hx + i * 200, gy - 28, 200, 30);
      var gx = -(w.dist % 120);
      for (i = 0; gx + i * 120 < w.VW; i++) c.drawImage(sp.ground, gx + i * 120, gy, 120.5, 24);
      for (i = 0; i < w.obs.length; i++) {
        var o = w.obs[i], ox = rx + o.x - w.dist;
        if (ox > w.VW + 2 || ox + o.w < -2) continue;
        if (o.c) {
          c.fillStyle = '#0B0520'; c.beginPath(); c.ellipse(ox + o.w / 2, gy + 2.2, o.w / 2, 3.2, 0, 0, PI2); c.fill();
          c.fillStyle = '#C4B5FD'; c.fillRect(ox - 0.6, gy - 0.4, 1.4, 1.4); c.fillRect(ox + o.w - 0.8, gy - 0.4, 1.4, 1.4);
          c.strokeStyle = 'rgba(196,181,253,.55)'; c.lineWidth = 0.5; c.beginPath(); c.ellipse(ox + o.w / 2, gy + 2.2, o.w / 2, 3.2, 0, Math.PI, PI2); c.stroke();
        } else c.drawImage(sp.rock[o.v], ox - 1.5, gy - 8.6, 10, 9);
      }
      if (w.gone) return;
      // astronaut: pre-drawn body + animated legs / arms
      var y = gy + w.y, sw = w.air ? 0.6 : Math.sin(w.leg);
      c.save();
      if (w.fall) { c.beginPath(); c.rect(rx - 20, 0, 40, gy + 1.5); c.clip(); }
      c.translate(rx, y);
      if (w.rot) c.rotate(-w.rot);
      c.lineCap = 'round'; c.lineWidth = 2.1;
      c.strokeStyle = '#CBD5E1'; c.beginPath(); c.moveTo(-0.6, -5); c.lineTo(-0.6 - 2.6 * sw, -0.6); c.stroke();
      c.strokeStyle = '#F8FAFC'; c.beginPath(); c.moveTo(0.8, -5); c.lineTo(0.8 + 2.6 * sw, -0.6); c.stroke();
      c.drawImage(sp.body, -6.6, -16.5, 12, 16);
      c.lineWidth = 1.5; c.strokeStyle = '#E2E8F0'; c.beginPath(); c.moveTo(0.5, -8.6); c.lineTo(0.5 + 2.4 * -sw + (w.air ? 1.5 : 0), -6 - (w.air ? 3 : 0)); c.stroke();
      c.restore();
    }
  };

  /* 2. FLAPPY ROCKET — tap to boost through the asteroid gaps */
  DEF.flappyrock = {
    hint: 'h_boost', gest: 'tap', hue: '#F43F5E',
    scale: function (W, H) { return H / 100; },
    floor: 93,
    art: function (w, k) {
      w.sp = {
        rocket: sprite(16, 8, k, function (c) {
          c.fillStyle = '#BE123C'; c.beginPath(); c.moveTo(3.5, 1); c.lineTo(7, 2.6); c.lineTo(4, 2.6); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(3.5, 7); c.lineTo(7, 5.4); c.lineTo(4, 5.4); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(2.4, 2.4); c.lineTo(11.5, 2.4); c.quadraticCurveTo(15.8, 3.2, 15.8, 4); c.quadraticCurveTo(15.8, 4.8, 11.5, 5.6); c.lineTo(2.4, 5.6); c.closePath();
          c.fillStyle = grad(c, 0, 2.4, 0, 5.6, ['#FFFFFF', '#E2E8F0', '#94A3B8']); c.fill();
          c.beginPath(); c.moveTo(11.5, 2.45); c.quadraticCurveTo(15.8, 3.2, 15.8, 4); c.quadraticCurveTo(15.8, 4.8, 11.5, 5.55); c.closePath(); c.fillStyle = '#E11D48'; c.fill();
          c.beginPath(); c.arc(8.6, 4, 1.15, 0, PI2); c.fillStyle = '#0E7490'; c.fill(); c.strokeStyle = '#FBBF24'; c.lineWidth = 0.45; c.stroke();
          c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(3, 2.8, 7.5, 0.45);
          c.fillStyle = '#475569'; c.fillRect(1.6, 2.9, 1, 2.2);
        }),
        rock: [0, 1, 2].map(function (v) { return sprite(16, 16, k, function (c) { rock(c, 8, 8, 7.6, v * 3 + 2, ['#FDA4AF', '#9F1239', '#3B0718']); }); }),
        floor: sprite(120, 10, k, function (c) {
          c.fillStyle = grad(c, 0, 0, 0, 10, ['#9F1239', '#4C0519', '#1E0A1E']); c.fillRect(0, 0, 120, 10); c.fillStyle = '#FDA4AF'; c.fillRect(0, 0, 120, 0.7);
          for (var i = 0; i < 10; i++) { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(i * 12 + 5, 4 + (i % 2) * 2.5, 2, 0.8, 0, 0, PI2); c.fill(); }
        })
      };
    },
    reset: function (w) { w.dist = 0; w.v = 0; w.y = 45; w.vy = 0; w.go = 0; w.cols = []; w.next = 0; w.dead = 0; w.ang = 0; w.flame = 0; w.hov = 0; w.lastC = 45; },
    rx: function (w) { return Math.max(16, w.VW * 0.28); },
    tap: function (w) { if (w.dead) return; w.go = 1; w.vy = -78; w.flame = 0.22; },
    step: function (w, dt, mode) {
      var play = mode === 'play' || mode === 'hold', rx = this.rx(w), fl = this.floor;
      var tv = mode === 'idle' ? 18 : mode === 'post' ? 0 : Math.min(46, 34 + w.t * 0.5);
      w.v += (tv - w.v) * Math.min(1, dt * 3); w.dist += w.v * dt; w.flame = Math.max(0, w.flame - dt);
      if (play && !w.go && w.t > 1.2) w.go = 1; // gravity starts by itself after a short hover
      if (!w.go || mode === 'idle') { w.hov += dt; var ty = 45 + Math.sin(w.hov * 2.2) * 3; w.vy = (ty - w.y) * 4; w.y += w.vy * dt; }
      else { w.vy = Math.min(120, w.vy + 230 * dt); w.y += w.vy * dt; if (w.y < 4) { w.y = 4; w.vy = Math.max(0, w.vy); } }
      if (w.dead && w.y > fl - 2) { w.y = fl - 2; w.vy = 0; }
      w.ang += (clamp(w.vy / 140, -0.45, 0.9) - w.ang) * Math.min(1, dt * 10);
      if (play) {
        if (!w.next) w.next = w.dist + w.VW - rx + 8;
        while (w.next < w.dist + w.VW + 20) {
          var gap = Math.max(31, 40 - w.t * 0.22), lo = gap / 2 + 6, hi = fl - gap / 2 - 5;
          var gc = clamp(w.lastC + rnd(-27, 27), lo, hi); w.lastC = gc;
          w.cols.push({ x: w.next, top: gc - gap / 2, bot: gc + gap / 2, s: Math.floor(Math.random() * 3) });
          w.next += 58 - Math.min(6, w.t * 0.1);
        }
      }
      while (w.cols.length && w.cols[0].x + 16 < w.dist - rx - 10) w.cols.shift();
      if (mode !== 'play' || w.dead) return null;
      if (w.y > fl - 3) { w.dead = 1; return 'crash'; }
      var ca = Math.cos(w.ang), sa = Math.sin(w.ang), pts = [[3.5, 0], [-3, 0]];
      for (var i = 0; i < w.cols.length; i++) {
        var o = w.cols[i], ox = rx + o.x - w.dist;
        if (ox > rx + 10 || ox + 13 < rx - 10) continue;
        for (var j = 0; j < 2; j++) {
          var px = rx + pts[j][0] * ca, py = w.y + pts[j][0] * sa, r = 2.3;
          var nx = clamp(px, ox + 1, ox + 12);
          if ((py - r < o.top - 1 || py + r > o.bot + 1) && Math.abs(nx - px) < r) { w.dead = 1; w.vy = Math.max(w.vy, 20); return 'crash'; }
        }
      }
      return null;
    },
    focus: function (w) { return { x: this.rx(w), y: w.y }; },
    hit: function (w) { w.gone = 1; },
    draw: function (w, c) {
      var sp = w.sp, rx = this.rx(w), fl = this.floor, i, j;
      for (i = 0; i < w.cols.length; i++) {
        var o = w.cols[i], ox = rx + o.x - w.dist;
        if (ox > w.VW + 4 || ox < -18) continue;
        for (j = o.top - 7; j > -12; j -= 10) c.drawImage(sp.rock[(((o.s + Math.round(j / 10)) % 3) + 3) % 3], ox - 1.5, j - 8, 16, 16);
        for (j = o.bot + 7; j < fl + 6; j += 10) c.drawImage(sp.rock[(((o.s + 1 + Math.round(j / 10)) % 3) + 3) % 3], ox - 1.5, j - 8, 16, 16);
      }
      var gx = -(w.dist % 120);
      for (i = 0; gx + i * 120 < w.VW; i++) c.drawImage(sp.floor, gx + i * 120, fl, 120.5, 10);
      if (w.gone) return;
      c.save(); c.translate(rx, w.y); c.rotate(w.ang);
      if (!w.dead) { // flame
        var f = 3 + (w.flame > 0 ? 4 : 1.5) + Math.random() * 1.2;
        c.fillStyle = '#FB923C'; c.beginPath(); c.moveTo(-6.4, -1.3); c.lineTo(-6.4 - f, 0); c.lineTo(-6.4, 1.3); c.closePath(); c.fill();
        c.fillStyle = '#FEF3C7'; c.beginPath(); c.moveTo(-6.4, -0.6); c.lineTo(-6.4 - f * 0.5, 0); c.lineTo(-6.4, 0.6); c.closePath(); c.fill();
      }
      c.drawImage(sp.rocket, -8, -4, 16, 8);
      c.restore();
    }
  };

  /* 3. TOWER STACK — tap to drop the sliding block; the overhang is cut */
  DEF.stack = {
    hint: 'h_drop', gest: 'tap', hue: '#F59E0B',
    scale: function (W, H) { return Math.min(H / 100, W / 72); },
    BH: 6,
    art: function (w, k) {
      w.sp = { pad: sprite(60, 12, k, function (c) {
        c.fillStyle = rgrad(c, 30, 2, 30, ['rgba(251,191,36,.45)', 'rgba(251,191,36,0)']); c.fillRect(0, 0, 60, 12);
        rr(c, 6, 2, 48, 5, 2.5); c.fillStyle = grad(c, 0, 2, 0, 7, ['#FDE68A', '#D97706', '#78350F']); c.fill();
        c.fillStyle = '#FEF3C7'; for (var i = 0; i < 6; i++) c.fillRect(10 + i * 8, 4, 2, 1);
      }) };
    },
    col: function (i) { return 'hsl(' + ((262 + i * 11) % 360) + ',78%,'; },
    reset: function (w) {
      var pw = Math.min(w.VW * 0.92, 70), bw = pw * 0.5;
      w.pw = pw; w.blocks = [{ x: w.VW / 2 - bw / 2, w: bw }]; w.deb = []; w.cam = 0; w.mv = null; w.wait = 0.25; w.dead = 0; w.perf = 0; w.dir = 1; w.spd = pw / 1.75; w.drop = null; w.idleN = 0;
      for (var i = 0; i < 3; i++) w.blocks.push({ x: w.VW / 2 - bw / 2, w: bw });
    },
    base: function (w) { return w.VH - 12; },
    topY: function (w) { return this.base(w) - w.blocks.length * this.BH; },
    spawn: function (w, mode) {
      var top = w.blocks[w.blocks.length - 1], pw = w.pw, cx = w.VW / 2;
      w.dir = -w.dir;
      w.mv = { w: top.w, x: w.dir > 0 ? cx - pw / 2 - top.w : cx + pw / 2, v: w.dir * w.spd, idle: mode === 'idle' };
    },
    tap: function (w) {
      if (w.dead || !w.mv || w.drop) return;
      var m = w.mv, top = w.blocks[w.blocks.length - 1];
      w.drop = { x: m.x, w: m.w, y: 0 }; w.mv = null;
      var d = m.x - top.x;
      if (Math.abs(d) < Math.max(0.9, top.w * 0.045)) { w.drop.x = top.x; w.drop.w = Math.min(w.pw * 0.5, top.w + (w.perf >= 2 ? 1.2 : 0)); w.drop.x = top.x - (w.drop.w - top.w) / 2; w.perf++; w.drop.perfect = 1; return; }
      w.perf = 0;
      var l = Math.max(m.x, top.x), r = Math.min(m.x + m.w, top.x + top.w);
      if (r - l <= 0.35) { w.drop.miss = 1; return; }
      w.drop.x = l; w.drop.w = r - l;
      var ox = d > 0 ? r : m.x, ow = m.w - (r - l);
      w.deb.push({ x: ox, y: this.topY(w) - this.BH, w: ow, vx: d > 0 ? 6 : -6, vy: 0, a: 0, va: d > 0 ? 1.6 : -1.6, i: w.blocks.length });
    },
    step: function (w, dt, mode) {
      var BH = this.BH, cx = w.VW / 2;
      // camera: the tower top stays at ~58 % of the height
      var tgt = Math.max(0, w.blocks.length * BH - (this.base(w) - w.VH * 0.58));
      w.cam += (tgt - w.cam) * Math.min(1, dt * 6);
      for (var i = w.deb.length - 1; i >= 0; i--) { var d = w.deb[i]; d.vy += 140 * dt; d.y += d.vy * dt; d.x += d.vx * dt; d.a += d.va * dt; if (d.y - w.cam > w.VH + 30) w.deb.splice(i, 1); }
      if (w.drop) { // short fall onto the tower
        w.drop.y += dt * 90;
        if (w.drop.y >= BH * 0.5) {
          var dr = w.drop; w.drop = null;
          if (dr.miss) { w.dead = 1; w.deb.push({ x: dr.x, y: this.topY(w) - BH, w: dr.w, vx: w.dir * 10, vy: 10, a: 0, va: w.dir * 2, i: w.blocks.length }); return mode === 'play' ? 'miss' : null; }
          w.blocks.push({ x: dr.x, w: dr.w, p: dr.perfect ? 0.5 : 0 });
          if (mode === 'idle' && w.blocks.length > 7) { w.blocks.splice(4); w.cam = 0; }
          w.spd = Math.min(w.pw / 0.95, w.spd * (mode === 'idle' ? 1 : 1.03)); w.wait = 0.12;
        }
        return null;
      }
      for (var b = 0; b < w.blocks.length; b++) if (w.blocks[b].p) w.blocks[b].p = Math.max(0, w.blocks[b].p - dt);
      if (w.dead || mode === 'post') return null;
      if (!w.mv) { w.wait -= dt; if (w.wait <= 0) this.spawn(w, mode); return null; }
      var m = w.mv; m.x += m.v * dt;
      if (mode === 'idle') { // attract scene: bounce, auto-drop now and then
        if (m.x > cx + w.pw / 2 - m.w * 0.2 || m.x < cx - w.pw / 2 - m.w * 0.8) m.v = -m.v;
        var tp = w.blocks[w.blocks.length - 1]; w.idleN += dt;
        if (w.idleN > 1.4 && Math.abs(m.x - tp.x) < 1.2) { w.idleN = 0; this.tap(w); }
        return null;
      }
      if (mode === 'hold' && (m.x > cx + w.pw / 2 - m.w * 0.2 || m.x < cx - w.pw / 2 - m.w * 0.8)) m.v = -m.v; // cash-out pending: no fault
      if ((m.v > 0 && m.x > cx + w.pw / 2) || (m.v < 0 && m.x + m.w < cx - w.pw / 2)) { // passed the tower: it flies off
        w.dead = 1; w.deb.push({ x: m.x, y: this.topY(w) - BH, w: m.w, vx: m.v * 0.5, vy: 0, a: 0, va: m.v > 0 ? 2 : -2, i: w.blocks.length }); w.mv = null;
        return mode === 'play' ? 'miss' : null;
      }
      return null;
    },
    focus: function (w) { var t = w.blocks[w.blocks.length - 1]; return { x: t.x + t.w / 2, y: this.topY(w) + w.cam }; },
    hit: function (w) { // the meteor knocks the top of the tower off
      for (var i = 0; i < 3 && w.blocks.length > 1; i++) { var b = w.blocks.pop(); w.deb.push({ x: b.x, y: this.topY(w), w: b.w, vx: rnd(-25, 25), vy: rnd(-40, -10), a: 0, va: rnd(-5, 5), i: w.blocks.length }); }
      w.mv = null; w.drop = null; w.dead = 1;
    },
    block: function (c, x, y, wd, i, glow) {
      var h = this.BH, cl = this.col(i);
      c.fillStyle = cl + '58%)'; c.fillRect(x, y, wd, h);
      c.fillStyle = cl + '74%)'; c.fillRect(x, y, wd, 1.3);
      c.fillStyle = cl + '38%)'; c.fillRect(x, y + h - 1.2, wd, 1.2);
      c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x + 0.6, y + 0.35, Math.min(wd - 1.2, 6), 0.5);
      if (glow) { c.globalAlpha = Math.min(1, glow * 2); c.strokeStyle = '#FDE68A'; c.lineWidth = 0.8; c.strokeRect(x - 0.6, y - 0.6, wd + 1.2, h + 1.2); c.globalAlpha = 1; }
    },
    draw: function (w, c) {
      var BH = this.BH, base = this.base(w), i;
      c.save(); c.translate(0, w.cam);
      c.drawImage(w.sp.pad, w.VW / 2 - 30, base - 3, 60, 12);
      var from = Math.max(0, Math.floor((w.cam - 10) / BH) - 1);
      for (i = from; i < w.blocks.length; i++) { var b = w.blocks[i]; this.block(c, b.x, base - (i + 1) * BH, b.w, i, b.p); }
      var ty = this.topY(w) - BH;
      if (w.mv) this.block(c, w.mv.x, ty, w.mv.w, w.blocks.length, 0);
      if (w.drop) this.block(c, w.drop.x, ty - BH * 0.5 + w.drop.y, w.drop.w, w.blocks.length, 0);
      for (i = 0; i < w.deb.length; i++) { var d = w.deb[i]; c.save(); c.translate(d.x + d.w / 2, d.y + BH / 2); c.rotate(d.a); this.block(c, -d.w / 2, -BH / 2, d.w, d.i, 0); c.restore(); }
      c.restore();
    }
  };

  /* 4. STAR BLADES (knife-hit style) — tap to throw blades into the spinning planet */
  DEF.knifehit = {
    hint: 'h_throw', gest: 'tap', hue: '#0EA5E9',
    scale: function (W, H) { return Math.min(H / 100, W / 70); },
    R: 14, BL: 15,
    art: function (w, k) {
      var R = this.R, BL = this.BL;
      w.sp = {
        planet: sprite(R * 2 + 2, R * 2 + 2, k, function (c) {
          var m = R + 1;
          c.beginPath(); c.arc(m, m, R, 0, PI2); c.fillStyle = rgrad(c, m, m, R * 1.05, ['#E0F2FE', '#38BDF8', '#0369A1', '#0C2D57'], -R * 0.35, -R * 0.4); c.fill();
          c.save(); c.clip();
          c.fillStyle = 'rgba(12,45,87,.35)'; [[0.35, -0.2, 0.25], [-0.4, 0.3, 0.2], [0.1, 0.55, 0.14], [-0.2, -0.5, 0.12], [0.6, 0.35, 0.1]].forEach(function (p) { c.beginPath(); c.arc(m + p[0] * R, m + p[1] * R, p[2] * R, 0, PI2); c.fill(); });
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(m - R, m + 3); c.quadraticCurveTo(m, m - 2, m + R, m + 5); c.stroke();
          c.restore();
          c.strokeStyle = 'rgba(253,230,138,.9)'; c.lineWidth = 0.7; c.beginPath(); c.arc(m, m, R - 0.4, 0, PI2); c.stroke();
          c.fillStyle = '#FDE68A'; for (var i = 0; i < 12; i++) { var a = i / 12 * PI2; c.beginPath(); c.arc(m + Math.cos(a) * (R - 1.8), m + Math.sin(a) * (R - 1.8), 0.45, 0, PI2); c.fill(); }
        }),
        blade: sprite(4, BL, k, function (c) { // pointing up: tip at y=0
          c.beginPath(); c.moveTo(2, 0); c.lineTo(3.5, 3); c.lineTo(3.4, 9); c.lineTo(0.6, 9); c.lineTo(0.5, 3); c.closePath();
          c.fillStyle = grad(c, 0.5, 0, 3.5, 0, ['#F0F9FF', '#BAE6FD', '#7DD3FC', '#0EA5E9']); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 0.35; c.beginPath(); c.moveTo(1.6, 1.5); c.lineTo(1.4, 8.4); c.stroke();
          rr(c, 0, 9, 4, 1.2, 0.5); c.fillStyle = '#FBBF24'; c.fill();
          rr(c, 0.9, 10.2, 2.2, 4.6, 0.9); c.fillStyle = grad(c, 0, 10, 0, 15, ['#7C3AED', '#4C1D95']); c.fill();
        })
      };
    },
    reset: function (w) { w.rot = 0; w.stuck = []; w.lvl = 1; w.left = 6; w.fly = null; w.ready = 0.2; w.fuse = 0; w.dead = 0; w.bounce = null; w.lt = 0; w.pop = 1; w.shards = []; w.stuck.push({ a: 1.2 }, { a: 3.6 }, { a: 5.1 }); },
    cx: function (w) { return w.VW / 2; }, cy: function (w) { return Math.max(w.VH * 0.37, w.top + this.R + 6); },
    by: function (w) { return w.VH * 0.9; },
    newLevel: function (w) {
      var self = this;
      w.stuck.forEach(function (s) { var a = s.a + w.rot; w.shards.push({ x: self.cx(w) + Math.cos(a) * self.R, y: self.cy(w) + Math.sin(a) * self.R, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20, a: a + Math.PI / 2, va: rnd(-8, 8) }); });
      w.lvl++; w.stuck = []; w.left = Math.min(8, 5 + w.lvl); w.lt = 0; w.pop = 0;
      var n = Math.min(2, w.lvl - 1), a0 = Math.random() * PI2;
      for (var i = 0; i < n; i++) w.stuck.push({ a: a0 + i * PI2 / n + rnd(-0.3, 0.3) });
      w.ready = 0.5;
    },
    omega: function (w) {
      var b = Math.min(3.0, 1.6 + w.t * 0.04);
      if (w.lvl <= 1) return b;
      if (w.lvl === 2) return b * (0.75 + 0.45 * Math.sin(w.lt * 1.3));
      return b * 1.1 * Math.sin(w.lt * 0.85 + 0.6); // stops and turns back (visible, fair)
    },
    tap: function (w) { if (w.dead || w.fly || w.ready > 0 || w.pop < 1) return; w.fly = { y: this.by(w) - this.BL }; w.fuse = 0; },
    step: function (w, dt, mode) {
      var R = this.R, BL = this.BL;
      w.lt += dt; w.rot += (mode === 'idle' ? 1.1 : mode === 'post' && w.dead ? 0.3 : this.omega(w)) * dt;
      w.pop = Math.min(1, w.pop + dt * 3);
      for (var i = w.shards.length - 1; i >= 0; i--) { var s = w.shards[i]; s.vy += 120 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.a += s.va * dt; if (s.y > w.VH + 20) w.shards.splice(i, 1); }
      if (w.bounce) { var bo = w.bounce; bo.vy += 150 * dt; bo.x += bo.vx * dt; bo.y += bo.vy * dt; bo.a += bo.va * dt; }
      if (mode === 'post' || w.dead) return null;
      if (mode === 'idle') return null;
      if (w.ready > 0) { w.ready -= dt; return null; }
      if (!w.fly) {
        w.fuse += dt;
        if (mode === 'play' && w.fuse > Math.max(2.1, 3 - w.t * 0.02)) { w.dead = 1; w.bounce = { x: this.cx(w), y: this.by(w) - BL, vx: 0, vy: 30, a: 0, va: 3 }; return 'late'; }
        return null;
      }
      w.fly.y -= 280 * dt;
      if (w.fly.y <= this.cy(w) + R - 3) {
        w.fly = null;
        var a = Math.PI / 2 - w.rot, hitA = null;
        for (var j = 0; j < w.stuck.length; j++) { var d = Math.abs(((w.stuck[j].a - a) % PI2 + PI2 * 1.5) % PI2 - Math.PI); if (d < 0.155) { hitA = 1; break; } }
        if (hitA && mode === 'play') { w.dead = 1; w.bounce = { x: this.cx(w), y: this.cy(w) + R + 2, vx: rnd(-25, 25), vy: 40, a: Math.PI, va: rnd(-12, 12) }; return 'clash'; }
        if (hitA) { w.ready = 0.2; return null; } // (cash pending: no fail)
        w.stuck.push({ a: a, n: 0.15 }); w.left--; w.ready = 0.12;
        if (w.left <= 0) this.newLevel(w);
      }
      return null;
    },
    focus: function (w) { return { x: this.cx(w), y: this.cy(w) }; },
    hit: function (w) { this.newLevel(w); w.stuck = []; w.pop = -9; w.dead = 1; w.fly = null; },
    draw: function (w, c) {
      var R = this.R, BL = this.BL, cx = this.cx(w), cy = this.cy(w), sp = w.sp, i;
      var ps = clamp(w.pop, 0, 1);
      if (ps > 0) {
        c.save(); c.translate(cx, cy); c.rotate(w.rot); if (ps < 1) c.scale(ps, ps);
        for (i = 0; i < w.stuck.length; i++) { var s = w.stuck[i]; c.save(); c.rotate(s.a - Math.PI / 2); c.drawImage(sp.blade, -2, R - 3, 4, BL); c.restore(); } // tip inside the planet, handle outside
        c.drawImage(sp.planet, -R - 1, -R - 1, R * 2 + 2, R * 2 + 2);
        c.restore();
      }
      for (i = 0; i < w.shards.length; i++) { var h = w.shards[i]; c.save(); c.translate(h.x, h.y); c.rotate(h.a); c.drawImage(sp.blade, -2, -BL / 2, 4, BL); c.restore(); }
      var by = this.by(w);
      if (w.fly) c.drawImage(sp.blade, cx - 2, w.fly.y, 4, BL);
      else if (!w.dead && w.ready <= 0) {
        c.drawImage(sp.blade, cx - 2, by - BL, 4, BL);
        if (w.mode === 'play' || w.mode === 'hold') { // fuse ring around the handle
          var lim = Math.max(2.1, 3 - w.t * 0.02), f = 1 - clamp(w.fuse / lim, 0, 1);
          c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(cx, by - 3, 4.6, 0, PI2); c.stroke();
          c.strokeStyle = f > 0.35 ? '#FBBF24' : '#F43F5E'; c.beginPath(); c.arc(cx, by - 3, 4.6, -Math.PI / 2, -Math.PI / 2 + PI2 * f); c.stroke();
        }
      }
      if (w.bounce) { var b = w.bounce; c.save(); c.translate(b.x, b.y); c.rotate(b.a); c.drawImage(sp.blade, -2, -BL / 2, 4, BL); c.restore(); }
      // blades left on this planet (little marks on the left)
      c.globalAlpha = 0.9;
      for (i = 0; i < w.left; i++) { c.fillStyle = i === 0 && !w.dead ? '#FBBF24' : 'rgba(186,230,253,.55)'; rr(c, 4, by - 4 - i * 4.2, 1.6, 3.2, 0.6); c.fill(); }
      c.globalAlpha = 1;
    }
  };

  /* shared shot logic for the two swipe games (ball flies to where the swipe points; the target moves slowly) */
  function swipeTarget(w, dx, dy, x0, y0, yT) { return clamp(x0 + dx / Math.max(1, -dy) * (y0 - yT), -10, w.VW + 10); }

  /* 5. BASKET SHOT — swipe up into a floating hoop that drifts slowly */
  DEF.basket = {
    hint: 'h_shoot', gest: 'swipe', hue: '#F97316',
    scale: function (W, H) { return Math.min(H / 100, W / 72); },
    RIM: 9, BR: 6,
    art: function (w, k) {
      var BR = this.BR;
      w.sp = {
        ball: sprite(BR * 2, BR * 2, k, function (c) {
          c.beginPath(); c.arc(BR, BR, BR - 0.1, 0, PI2); c.fillStyle = rgrad(c, BR, BR, BR, ['#FED7AA', '#F97316', '#9A3412'], -BR * 0.35, -BR * 0.4); c.fill();
          c.strokeStyle = '#431407'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(0.2, BR); c.lineTo(BR * 2 - 0.2, BR); c.moveTo(BR, 0.2); c.lineTo(BR, BR * 2 - 0.2); c.stroke();
          c.beginPath(); c.arc(BR - BR * 1.3, BR, BR * 1.05, -0.8, 0.8); c.stroke(); c.beginPath(); c.arc(BR + BR * 1.3, BR, BR * 1.05, Math.PI - 0.8, Math.PI + 0.8); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(BR * 0.65, BR * 0.55, BR * 0.28, BR * 0.16, -0.6, 0, PI2); c.fill();
        }),
        board: sprite(30, 20, k, function (c) {
          rr(c, 0.5, 0.5, 29, 17, 2); c.fillStyle = 'rgba(186,230,253,.16)'; c.fill(); c.strokeStyle = '#E0F2FE'; c.lineWidth = 0.8; c.stroke();
          c.strokeStyle = '#FB923C'; c.lineWidth = 0.7; c.strokeRect(10, 7, 10, 7.5);
          c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(3, 2); c.lineTo(9, 2); c.lineTo(4, 10); c.lineTo(2.5, 10); c.closePath(); c.fill();
          c.fillStyle = '#64748B'; c.fillRect(1, 17.5, 3, 2); c.fillRect(26, 17.5, 3, 2);
        })
      };
    },
    reset: function (w) { w.ph = 0; w.ball = null; w.next = 0.3; w.shot = null; w.dead = 0; w.clock = 0; w.swish = 0; w.score = 0; w.fall = null; },
    hy: function (w) { return Math.max(w.VH * 0.27, w.top + 19); },
    hx: function (w) { var A = Math.min(w.VW / 2 - 14, 24); return w.VW / 2 + A * Math.sin(w.ph); },
    b0: function (w) { return { x: w.VW / 2, y: w.VH * 0.84 }; },
    swipe: function (w, dx, dy) {
      if (w.dead || w.shot || !w.ball) return;
      var b = this.b0(w), hy = this.hy(w);
      w.shot = { t: 0, x0: b.x, y0: b.y, tx: swipeTarget(w, dx, dy, b.x, b.y, hy), T: 0.62 }; w.ball = null;
    },
    step: function (w, dt, mode) {
      var om = mode === 'idle' ? 0.5 : Math.min(1.15, 0.5 + w.t * 0.014);
      if (!(mode === 'post' && w.dead)) w.ph += om * dt;
      w.swish = Math.max(0, w.swish - dt);
      if (!w.ball && !w.shot && !w.dead && mode !== 'post') { w.next -= dt; if (w.next <= 0) { w.ball = 1; w.clock = 0; } }
      if (w.ball && (mode === 'play' || mode === 'hold')) {
        w.clock += dt;
        if (mode === 'play' && w.clock > Math.max(2.4, 3.3 - w.t * 0.02)) { w.dead = 1; w.ball = null; w.fall = { x: this.b0(w).x, y: this.b0(w).y, vx: 0, vy: 0, s: 1, r: 0 }; return 'late'; }
      }
      if (w.fall) { var f = w.fall; f.vy += 160 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.r += dt * 4; if (f.y > w.VH + 20) w.fall = null; }
      if (!w.shot) return null;
      var s = w.shot; s.t += dt / s.T;
      if (s.t < 1) return null;
      if (s.res) { // scored: the ball drops through the net, then the next one comes
        if (s.t > 1.5) { w.shot = null; w.next = 0.15; }
        return null;
      }
      var hx = this.hx(w), d = Math.abs(s.tx - hx), tol = this.RIM - this.BR * 0.62 + 0.4;
      if (d <= tol || mode === 'hold' || mode === 'idle') { s.res = 1; s.hx = hx; w.swish = 0.45; w.score++; return null; }
      w.shot = null; w.dead = 1;
      w.fall = { x: s.tx, y: this.hy(w), vx: (s.tx > hx ? 1 : -1) * (d < this.RIM + 4 ? 26 : 8), vy: d < this.RIM + 4 ? -40 : 10, s: 0.62, r: 0 };
      return mode === 'play' ? 'miss' : null;
    },
    focus: function (w) { return { x: this.hx(w), y: this.hy(w) }; },
    hit: function (w) { w.gone = 1; w.ball = null; w.shot = null; w.dead = 1; },
    draw: function (w, c) {
      var sp = w.sp, hx = this.hx(w), hy = this.hy(w), RIM = this.RIM, BR = this.BR, b0 = this.b0(w), i;
      if (!w.gone) {
        c.drawImage(sp.board, hx - 15, hy - 18.5, 30, 20);
        // little thrusters under the floating hoop
        c.fillStyle = 'rgba(251,146,60,' + (0.5 + Math.random() * 0.4).toFixed(2) + ')'; c.fillRect(hx - 13.6, hy + 1.2, 1.2, 1.6 + Math.random()); c.fillRect(hx + 12.4, hy + 1.2, 1.2, 1.6 + Math.random());
        c.strokeStyle = '#EA580C'; c.lineWidth = 1; c.beginPath(); c.ellipse(hx, hy, RIM, 2.2, 0, Math.PI, PI2); c.stroke();
      }
      var bx = null, by, bs = 1;
      if (w.shot) {
        var s = w.shot, u = Math.min(1, s.t);
        bx = s.x0 + (s.tx - s.x0) * u;
        var yc = hy - 34; by = (1 - u) * (1 - u) * s.y0 + 2 * u * (1 - u) * yc + u * u * hy;
        bs = 1 - 0.38 * u;
        if (s.t > 1) { bx = s.hx + (hx - s.hx) * 0.5; by = hy + (s.t - 1) * 26; }
      } else if (w.ball && !w.dead) { bx = b0.x; by = b0.y + Math.sin(Date.now() / 180) * 0.6; }
      if (bx != null) { c.globalAlpha = w.shot && w.shot.t > 1.3 ? clamp((1.5 - w.shot.t) * 5, 0, 1) : 1; c.drawImage(sp.ball, bx - BR * bs, by - BR * bs, BR * 2 * bs, BR * 2 * bs); c.globalAlpha = 1; }
      if (w.fall) { var f = w.fall; c.save(); c.translate(f.x, f.y); c.rotate(f.r); c.drawImage(sp.ball, -BR * f.s, -BR * f.s, BR * 2 * f.s, BR * 2 * f.s); c.restore(); }
      if (!w.gone) {
        var sw = w.swish > 0 ? Math.sin(w.swish * 20) * 0.8 : 0;
        c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 0.45; c.beginPath();
        for (i = 0; i <= 6; i++) { var t = i / 6, x1 = hx - RIM + t * RIM * 2, x2 = hx - RIM * 0.6 + t * RIM * 1.2 + sw; c.moveTo(x1, hy); c.lineTo(x2, hy + 8); }
        c.moveTo(hx - RIM * 0.85, hy + 3); c.lineTo(hx + RIM * 0.85, hy + 3); c.moveTo(hx - RIM * 0.7, hy + 6); c.lineTo(hx + RIM * 0.7, hy + 6); c.stroke();
        c.strokeStyle = '#F97316'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(hx, hy, RIM, 2.2, 0, 0, Math.PI); c.stroke();
      }
      if (w.ball && !w.dead && !w.shot && (w.mode === 'play' || w.mode === 'hold')) { // shot clock ring
        var lim = Math.max(2.4, 3.3 - w.t * 0.02), q = 1 - clamp(w.clock / lim, 0, 1);
        c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(b0.x, b0.y, BR + 2.2, 0, PI2); c.stroke();
        c.strokeStyle = q > 0.35 ? '#FBBF24' : '#F43F5E'; c.beginPath(); c.arc(b0.x, b0.y, BR + 2.2, -Math.PI / 2, -Math.PI / 2 + PI2 * q); c.stroke();
      }
    }
  };

  /* 6. PENALTY KICKER — swipe past the moving keeper into the goal */
  DEF.kicker = {
    hint: 'h_kick', gest: 'swipe', hue: '#6366F1',
    scale: function (W, H) { return Math.min(H / 100, W / 72); },
    BR: 5, KW: 15,
    art: function (w, k) {
      var BR = this.BR, KW = this.KW, GW = this.gw(w);
      w.sp = {
        ball: sprite(BR * 2, BR * 2, k, function (c) {
          c.beginPath(); c.arc(BR, BR, BR - 0.1, 0, PI2); c.fillStyle = rgrad(c, BR, BR, BR, ['#FFFFFF', '#E2E8F0', '#64748B'], -BR * 0.35, -BR * 0.4); c.fill();
          c.fillStyle = '#1E1B4B';
          var pent = function (x, y, r) { c.beginPath(); for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * PI2 / 5; c[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a)); } c.closePath(); c.fill(); };
          pent(BR, BR, BR * 0.34); pent(BR * 0.25, BR * 0.75, BR * 0.22); pent(BR * 1.75, BR * 0.75, BR * 0.22); pent(BR * 0.55, BR * 1.75, BR * 0.22); pent(BR * 1.45, BR * 1.75, BR * 0.22);
        }),
        keeper: sprite(KW, 17, k, function (c) {
          var m = KW / 2;
          c.strokeStyle = '#7C3AED'; c.lineWidth = 2.4; c.lineCap = 'round';
          c.beginPath(); c.moveTo(m - 3, 8); c.lineTo(2.2, 3); c.moveTo(m + 3, 8); c.lineTo(KW - 2.2, 3); c.moveTo(m - 1.6, 13); c.lineTo(m - 2.6, 16.4); c.moveTo(m + 1.6, 13); c.lineTo(m + 2.6, 16.4); c.stroke();
          rr(c, m - 3.6, 6.5, 7.2, 7.5, 2.4); c.fillStyle = grad(c, 0, 6.5, 0, 14, ['#A78BFA', '#6D28D9', '#3B0764']); c.fill();
          c.fillStyle = '#FBBF24'; c.font = 'bold 3.6px sans-serif'; c.textAlign = 'center'; c.fillText('1', m, 12.2);
          c.beginPath(); c.arc(m, 4, 3.1, 0, PI2); c.fillStyle = '#F1F5F9'; c.fill();
          rr(c, m - 2.2, 2.8, 4.4, 2.4, 1.1); c.fillStyle = grad(c, 0, 2.8, 0, 5.2, ['#67E8F9', '#0E7490']); c.fill();
          c.fillStyle = '#FDE68A'; c.beginPath(); c.arc(2.2, 2.6, 1.9, 0, PI2); c.arc(KW - 2.2, 2.6, 1.9, 0, PI2); c.fill();
        }),
        goal: sprite(GW + 4, 26, k, function (c) {
          var x0 = 2, x1 = GW + 2;
          c.fillStyle = 'rgba(15,10,40,.45)'; c.fillRect(x0, 2, GW, 22);
          c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 0.35; c.beginPath();
          for (var x = x0 + 3; x < x1; x += 3) { c.moveTo(x, 2); c.lineTo(x, 24); }
          for (var y = 5; y < 24; y += 3) { c.moveTo(x0, y); c.lineTo(x1, y); }
          c.stroke();
          c.strokeStyle = '#F8FAFC'; c.lineWidth = 1.6; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x0, 24.5); c.lineTo(x0, 1.5); c.lineTo(x1, 1.5); c.lineTo(x1, 24.5); c.stroke();
        })
      };
    },
    gw: function (w) { return Math.min(w.VW * 0.86, 62); },
    gy: function (w) { return Math.max(w.VH * 0.36, w.top + 25); },
    reset: function (w) { w.ph = 0; w.ball = null; w.next = 0.3; w.shot = null; w.dead = 0; w.clock = 0; w.bulge = 0; w.save = 0; },
    kx: function (w) { var GW = this.gw(w); return w.VW / 2 + (GW / 2 - this.KW / 2) * Math.sin(w.ph); },
    b0: function (w) { return { x: w.VW / 2, y: w.VH * 0.86 }; },
    swipe: function (w, dx, dy) {
      if (w.dead || w.shot || !w.ball) return;
      var b = this.b0(w), gy = this.gy(w) - 4;
      w.shot = { t: 0, x0: b.x, y0: b.y, tx: swipeTarget(w, dx, dy, b.x, b.y, gy), ty: gy, T: 0.42 }; w.ball = null;
    },
    step: function (w, dt, mode) {
      var om = mode === 'idle' ? 0.9 : Math.min(2.0, 0.95 + w.t * 0.025);
      if (!(w.save && w.dead)) w.ph += om * dt;
      w.bulge = Math.max(0, w.bulge - dt);
      if (!w.ball && !w.shot && !w.dead && mode !== 'post') { w.next -= dt; if (w.next <= 0) { w.ball = 1; w.clock = 0; } }
      if (w.ball && (mode === 'play' || mode === 'hold')) {
        w.clock += dt;
        if (mode === 'play' && w.clock > Math.max(2.4, 3.3 - w.t * 0.02)) { w.dead = 1; return 'late'; }
      }
      if (mode === 'idle' && w.ball && w.clock > 0) { /* attract: no shots */ }
      if (!w.shot) return null;
      var s = w.shot; s.t += dt / s.T;
      if (s.t < 1) return null;
      if (s.res) { if (s.t > 1.8) { w.shot = null; w.next = 0.15; } return null; }
      var GW = this.gw(w), kx = this.kx(w), cx = w.VW / 2;
      if (Math.abs(s.tx - cx) > GW / 2 - 1.5 && mode === 'play') { s.res = 2; s.out = 1; w.dead = 1; return 'miss'; }
      if (Math.abs(s.tx - kx) < this.KW / 2 + 1.6 && mode === 'play') { s.res = 3; w.dead = 1; w.save = 1; return 'save'; }
      s.res = 1; w.bulge = 0.5; return null;
    },
    focus: function (w) { return { x: this.kx(w), y: this.gy(w) - 8 }; },
    hit: function (w) { w.gone = 1; w.dead = 1; },
    draw: function (w, c) {
      var sp = w.sp, GW = this.gw(w), gy = this.gy(w), cx = w.VW / 2, BR = this.BR, KW = this.KW, b0 = this.b0(w);
      // pitch lines (penalty box) on the planet turf
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(cx - GW * 0.75, gy); c.lineTo(cx + GW * 0.75, gy); c.moveTo(cx - GW * 0.4, gy); c.lineTo(cx - GW * 0.5, gy + 14); c.lineTo(cx + GW * 0.5, gy + 14); c.lineTo(cx + GW * 0.4, gy); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(b0.x, b0.y + BR * 0.8, 2, 0.8, 0, 0, PI2); c.fill();
      c.save(); if (w.bulge > 0 && w.shot) { c.translate(0, -Math.sin(w.bulge * 6) * 0.8); }
      c.drawImage(sp.goal, cx - GW / 2 - 2, gy - 24.5, GW + 4, 26); c.restore();
      var s = w.shot, bx = null, by, bsc = 1;
      if (s) {
        var u = Math.min(1, s.t), yc = (s.y0 + s.ty) / 2 - 10;
        bx = s.x0 + (s.tx - s.x0) * u; by = (1 - u) * (1 - u) * s.y0 + 2 * u * (1 - u) * yc + u * u * s.ty; bsc = 1 - 0.45 * u;
        if (s.t > 1) {
          if (s.res === 1) { by = s.ty + Math.min(1, (s.t - 1) * 3) * 5; }
          if (s.res === 2) { bx += (s.tx > cx ? 1 : -1) * (s.t - 1) * 30; by -= (s.t - 1) * 8; }
          if (s.res === 3) { bx = this.kx(w); by = gy - 13; }
        }
      }
      var behind = s && s.t >= 1 && s.res === 1;
      if (behind && bx != null) c.drawImage(sp.ball, bx - BR * bsc, by - BR * bsc, BR * 2 * bsc, BR * 2 * bsc);
      if (!w.gone) { var kx = this.kx(w), dv = Math.cos(w.ph) * 0.12; c.save(); c.translate(kx, gy - 9); c.rotate(dv); c.drawImage(sp.keeper, -KW / 2, -8.5, KW, 17); c.restore(); }
      if (!behind && bx != null) c.drawImage(sp.ball, bx - BR * bsc, by - BR * bsc, BR * 2 * bsc, BR * 2 * bsc);
      if (w.ball && !w.dead) {
        c.drawImage(sp.ball, b0.x - BR, b0.y - BR, BR * 2, BR * 2);
        if (w.mode === 'play' || w.mode === 'hold') {
          var lim = Math.max(2.4, 3.3 - w.t * 0.02), q = 1 - clamp(w.clock / lim, 0, 1);
          c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(b0.x, b0.y, BR + 2.2, 0, PI2); c.stroke();
          c.strokeStyle = q > 0.35 ? '#FBBF24' : '#F43F5E'; c.beginPath(); c.arc(b0.x, b0.y, BR + 2.2, -Math.PI / 2, -Math.PI / 2 + PI2 * q); c.stroke();
        }
      }
    }
  };

  /* ---------- shared engine: HUD, terminal, server clock, polling, meteor, particles ---------- */
  var HIST = {};
  var MULT = function (rate, s) { return Math.max(1, Math.floor(Math.exp(rate * Math.max(0, s)) * 100) / 100); };

  function make(key) {
    var G = DEF[key];
    return function (box) {
      var l = L(), dc = K.dec();
      var fx = function (v) { return Number(v).toFixed(2).replace('.', dc); };
      box.classList.add('cg-game', 'cg-skill', 'sk-' + key);
      box.style.setProperty('--sk', G.hue);
      var hand = G.gest === 'tap'
        ? '<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="sk-rip" cx="13" cy="9" r="6"/><path d="M11 21V9.5a2 2 0 0 1 4 0V16m0-2a2 2 0 0 1 4 0v2m0-1a2 2 0 0 1 4 0v5c0 4.5-3 8-7.5 8H14c-2.4 0-4-1-5.3-2.9L6 23a2 2 0 0 1 3.2-2.4L11 23"/></svg>'
        : '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M16 3l-4 5h8z"/><path d="M11 23V11.5a2 2 0 0 1 4 0V18m0-2a2 2 0 0 1 4 0v2m0-1a2 2 0 0 1 4 0v5c0 4.5-3 8-7.5 8H14c-2.4 0-4-1-5.3-2.9L6 25a2 2 0 0 1 3.2-2.4L11 25"/></svg>';
      box.innerHTML = '<div class="cg-hist sk-hist" id="skHist"></div>' +
        '<div class="cg-stage sk-stage" id="skStage"><canvas class="sk-cv" id="skCv"></canvas>' +
        '<div class="sk-hud"><b class="sk-m fit" id="skM" dir="ltr">' + fx(1) + '×</b><small class="sk-st fit" id="skSt"></small></div>' +
        '<div class="sk-hint g-' + G.gest + '" id="skHint"><i class="sk-hand">' + hand + '</i><small class="fit">' + K.esc(l[G.hint]) + '</small></div></div>' +
        K.stakePanel(l.bet);
      var watch = K.guest();
      if (!watch) K.bindStake(box);
      var st = $('skStage'), cv = $('skCv'), ctx = cv.getContext('2d', { alpha: false }), mEl = $('skM'), sEl = $('skSt'), hint = $('skHint'), btn = $('csGo');
      var w = { W: 0, H: 0, s: 1, VW: 100, VH: 100, t: 0, mode: 'idle' };
      var dpr = 1, bg = null, phase = 'idle', R = null, off = 0, busy = false, failing = false, parts = [], met = null, shake = 0, last = 0, hidden = false, mTxt = '', lockT = 0, flash = 0;
      var alive = function () { return box.isConnected && K.S.game === key; };
      var nowS = function () { return Date.now() / 1000 + off; };

      /* ---- terminal button: "BET" or "CASH OUT / +$ x.xx" on two one-line rows ---- */
      var b1 = null, b2 = null;
      if (btn) { btn.innerHTML = '<b class="sk-b1 fit"></b><small class="sk-b2 fit" dir="ltr"></small>'; b1 = btn.firstChild; b2 = btn.lastChild; K.setText(b1, l.bet); }
      var setBtn = function (cls, txt, dis, sub) {
        if (!btn) return;
        ['cash', 'wait'].forEach(function (c) { btn.classList.toggle(c, c === cls); });
        var two = !!sub;
        if (btn.classList.contains('two') !== two) { btn.classList.toggle('two', two); b2.textContent = ''; K.fitEl(b1); }
        K.setText(b1, txt);
        if (two && b2.textContent !== sub) { var rf = b2.textContent.length !== sub.length; b2.textContent = sub; if (rf) K.fitEl(b2); } // re-fit only when the length changes (cheap at 60 fps)
        btn.disabled = !!dis;
      };
      var status = function (t, cls) { sEl.className = 'sk-st fit' + (cls ? ' ' + cls : ''); K.setText(sEl, t || ''); };
      var paintHist = function () {
        var h = HIST[key] || [];
        $('skHist').innerHTML = h.slice(0, 24).map(function (v, i) { return '<i class="' + (v < 2 ? 'lo' : v < 10 ? 'mid' : 'hi') + (i === 0 && h.fresh ? ' new' : '') + '">' + fx(v) + '×</i>'; }).join('');
        h.fresh = 0;
      };

      /* ---- canvas size (dpr ≤ 2, and at most ~2.4 M pixels) ---- */
      var measure = function () {
        var W = Math.max(1, st.clientWidth), H = Math.max(1, st.clientHeight);
        if (W === w.W && H === w.H) return;
        dpr = Math.min(2, (window.devicePixelRatio || 1) * (document.documentElement.classList.contains('is-tv') ? 1.6 : 1)); // TV: the casino is zoomed ×1.6
        if (W * H * dpr * dpr > 2.4e6) dpr = Math.max(1, Math.sqrt(2.4e6 / (W * H)));
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        var first = !w.W;
        w.W = W; w.H = H; w.s = G.scale(W, H); w.VW = W / w.s; w.VH = H / w.s;
        var hud = st.querySelector('.sk-hud'); w.top = ((hud ? hud.offsetTop + hud.offsetHeight : 70) + 4) / w.s; // keep targets below the multiplier
        bg = sky(W, H, dpr, G.hue);
        G.art(w, w.s * dpr);
        if (first || phase === 'idle') { G.reset(w); }
        draw();
      };

      /* ---- particles + meteor (the secret end) ---- */
      var burst = function (x, y, n, cols, sp) {
        if (lite()) n = Math.ceil(n / 2);
        for (var i = 0; i < n; i++) { var a = Math.random() * PI2, v = rnd(0.3, 1) * (sp || 40); parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, t: 0, life: rnd(0.5, 1), c: cols[i % cols.length], r: rnd(0.6, 1.6) }); }
      };
      var meteor = function (cb) {
        var f = G.focus(w);
        met = { x0: f.x + w.VW * 0.55, y0: f.y - w.VH * 0.9, x1: f.x, y1: f.y, t: 0, cb: cb };
      };
      var boom = function (x, y) {
        burst(x, y, 34, ['#FDE68A', '#FB923C', '#F43F5E', '#fff'], 70); shake = 0.45; flash = 0.35;
        parts.push({ ring: 1, x: x, y: y, t: 0, life: 0.6 });
      };

      /* ---- one frame ---- */
      var draw = function () {
        if (!w.W) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(bg, 0, 0);
        var k = w.s * dpr, sx = 0, sy = 0;
        if (shake > 0) { sx = (Math.random() - 0.5) * shake * 6 * dpr; sy = (Math.random() - 0.5) * shake * 6 * dpr; }
        ctx.setTransform(k, 0, 0, k, sx, sy);
        G.draw(w, ctx);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i], a = 1 - p.t / p.life;
          if (p.ring) { ctx.globalAlpha = Math.max(0, a); ctx.strokeStyle = '#FDE68A'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, 4 + p.t * 60, 0, PI2); ctx.stroke(); continue; }
          ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
        }
        ctx.globalAlpha = 1;
        if (met) {
          var u = Math.min(1, met.t / 0.55), mx = met.x0 + (met.x1 - met.x0) * u, my = met.y0 + (met.y1 - met.y0) * u;
          var tx = mx + (met.x0 - met.x1) * 0.18, ty = my + (met.y0 - met.y1) * 0.18;
          var g = ctx.createLinearGradient(tx, ty, mx, my); g.addColorStop(0, 'rgba(251,146,60,0)'); g.addColorStop(1, 'rgba(253,230,138,.95)');
          ctx.strokeStyle = g; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(mx, my); ctx.stroke();
          ctx.fillStyle = '#FFF7ED'; ctx.beginPath(); ctx.arc(mx, my, 3.4, 0, PI2); ctx.fill();
          ctx.fillStyle = '#FB923C'; ctx.beginPath(); ctx.arc(mx + 0.8, my - 0.6, 2.2, 0, PI2); ctx.fill();
        }
        if (flash > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(255,237,213,' + (flash * 1.4).toFixed(2) + ')'; ctx.fillRect(0, 0, cv.width, cv.height); }
      };
      var frame = function (ts) {
        K.S.raf = 0;
        if (!alive() || hidden) return;
        var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
        w.mode = phase === 'play' ? (busy ? 'hold' : 'play') : phase === 'idle' ? 'idle' : 'post';
        if (phase === 'play') w.t = Math.max(0, nowS() - R.t0);
        var why = G.step(w, dt, w.mode);
        if (why && phase === 'play' && !busy) fail(why);
        for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.t += dt; if (!p.ring) { p.vy += 60 * dt; p.x += p.vx * dt; p.y += p.vy * dt; } if (p.t > p.life) parts.splice(i, 1); }
        if (met) { met.t += dt; if (met.t >= 0.55 && !met.done) { met.done = 1; G.hit(w); boom(met.x1, met.y1); if (met.cb) met.cb(); } if (met.t > 0.6) met = null; }
        shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
        if (phase === 'play') {
          var m = MULT(R.rate, w.t), txt = fx(m) + '×';
          if (txt !== mTxt) { var rel = txt.length !== mTxt.length; mTxt = txt; mEl.textContent = txt; if (rel) K.fitEl(mEl); }
          if (!busy && !failing) setBtn('cash', l.cash, false, '+$ ' + K.m2(R.stake * m));
          if (w.t > 3 && !hint.classList.contains('off')) hint.classList.add('off');
        }
        draw();
        // idle scene in lite mode: one still frame only (old phones)
        if (phase === 'idle' && lite()) return;
        K.S.raf = requestAnimationFrame(frame);
      };
      var run = function () { if (!K.S.raf && alive() && !hidden) { last = 0; K.S.raf = requestAnimationFrame(frame); } };

      /* ---- round flow ---- */
      var setPhase = function (p) { phase = p; st.classList.toggle('playing', p === 'play'); st.classList.toggle('idle', p === 'idle'); };
      var begin = function (r) {
        R = r; off = r.now - Date.now() / 1000;
        if (r.tSend) off = r.now - (r.tSend + Date.now()) / 2000; // half the round trip
        parts = []; met = null; w.gone = 0; w.t = Math.max(0, nowS() - r.t0);
        G.reset(w); mTxt = ''; mEl.className = 'sk-m fit'; status('');
        hint.classList.remove('off');
        setPhase('play'); busy = false; failing = false;
        clearTimeout(K.S.timer); K.S.timer = setTimeout(poll, 700);
        run();
      };
      var settle = function (r, delay) {
        if (r && r.c != null) { var h = HIST[key] = HIST[key] || []; h.unshift(Number(r.c)); h.length = Math.min(h.length, 30); h.fresh = 1; paintHist(); }
        setTimeout(function () { if (alive() && r) K.resultLine(box, r); }, delay || 0);
        lockT = Date.now() + 900; setBtn('wait', l.bet, true);
        setTimeout(function () { if (alive() && phase !== 'play') setBtn('', l.bet, false); }, 900);
      };
      var finish = function (r) { // the server says the round is over (secret end, or another tab)
        if (phase !== 'play') return;
        clearTimeout(K.S.timer);
        if (r.why === 'cash' && r.win > 0) return won(r);
        setPhase('end'); busy = true;
        mEl.textContent = fx(r.c != null ? r.c : MULT(R.rate, w.t)) + '×'; mEl.className = 'sk-m fit l';
        meteor(function () { status(l.end, 'l'); });
        settle(r, 900);
      };
      var won = function (r) {
        clearTimeout(K.S.timer);
        setPhase('won'); w.dead = w.dead || 0;
        mEl.textContent = fx(r.out) + '×'; mEl.className = 'sk-m fit w'; K.fitEl(mEl);
        burst(G.focus(w).x, G.focus(w).y, 18, ['#FDE68A', '#FBBF24', '#fff'], 40);
        settle(r, 0);
      };
      var fail = async function (why) {
        failing = true; clearTimeout(K.S.timer);
        setPhase('fail'); shake = 0.3;
        var f = G.focus(w); if (key === 'flappyrock') { boom(f.x, f.y); w.gone = 1; }
        mEl.className = 'sk-m fit l'; status(l[why] || l.crash, 'l');
        setBtn('wait', l.cash, true);
        var r = null;
        for (var i = 0; i < 4 && !r; i++) { r = await K.multi(key, 'fail', null, true); if (!r) await K.sleep(800); if (!alive()) return; }
        if (!r) { setBtn('', l.bet, false); setPhase('end'); return; }
        setPhase('end');
        settle(r, 350);
      };
      var poll = async function () {
        if (!alive() || phase !== 'play') return;
        var r = await K.multi(key, 'state', null, true);
        if (!alive() || phase !== 'play') return;
        if (r && r.now) { var o2 = r.now - Date.now() / 1000; if (Math.abs(o2 - off) > 0.6) off = o2; }
        if (r && r.done && !busy && !failing) return finish(r);
        clearTimeout(K.S.timer); K.S.timer = setTimeout(poll, 700);
      };
      var cash = async function () {
        if (busy || failing || phase !== 'play') return;
        busy = true; setBtn('wait', l.cash, true, '+$ ' + K.m2(R.stake * MULT(R.rate, w.t)));
        var r = await K.multi(key, 'cash');
        if (!alive()) return;
        busy = false;
        if (!r) { if (phase === 'play') return; return; }
        if (!r.done) return;
        if (r.why === 'cash' && r.win > 0) won(r); else finish(r);
      };
      if (btn) btn.addEventListener('click', async function () {
        try { btn.blur(); } catch (e) { /* ignore */ } // Space = jump, never a second click on this button
        if (watch || Date.now() < lockT) return;
        if (phase === 'play') return cash();
        if (busy) return;
        busy = true; setBtn('wait', l.bet, true);
        var t1 = Date.now();
        var r = await K.multi(key, 'start');
        busy = false;
        if (!alive()) return;
        if (!r) { setBtn('', l.bet, false); return; }
        K.afterPlay(r);
        if (r.done) { setBtn('', l.bet, false); return; }
        r.tSend = t1; begin(r);
      });

      /* ---- the one gesture: tap (pointerdown) or swipe (up) on the scene ---- */
      var sw = null;
      var act = function () { return phase === 'play' && !busy && !failing; };
      cv.addEventListener('pointerdown', function (e) {
        if (G.gest === 'tap') { if (act()) { e.preventDefault(); G.tap(w); } return; }
        e.preventDefault(); // no text selection / drag-scroll of the page with a mouse
        sw = { x: e.clientX, y: e.clientY, id: e.pointerId, done: false };
        try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
      });
      var shoot = function (e) {
        if (!sw || sw.done) return;
        var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
        if (dy < -14 && Math.abs(dx) < -dy * 1.8 && Math.hypot(dx, dy) > 22) { sw.done = true; if (act()) G.swipe(w, dx, dy); }
      };
      cv.addEventListener('pointermove', function (e) { if (sw && Math.hypot(e.clientX - sw.x, e.clientY - sw.y) > Math.min(w.W, w.H) * 0.16) shoot(e); });
      cv.addEventListener('pointerup', function (e) { shoot(e); sw = null; });
      cv.addEventListener('pointercancel', function () { sw = null; });
      var onKey = function (e) {
        if (!alive()) { document.removeEventListener('keydown', onKey); return; }
        if (!act() || (e.target && e.target.tagName === 'INPUT')) return;
        if (G.gest !== 'tap') { // PC / TV remote: ← ↑ → shoot left, straight, right
          var kd = { ArrowLeft: -38, ArrowUp: 0, ArrowRight: 38 }[e.key];
          if (kd != null) { e.preventDefault(); if (!e.repeat) G.swipe(w, kd, -100); }
          return;
        }
        if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); if (!e.repeat) G.tap(w); }
      };
      document.addEventListener('keydown', onKey);
      var onVis = function () {
        if (!alive()) { document.removeEventListener('visibilitychange', onVis); return; }
        hidden = document.hidden;
        if (hidden) { cancelAnimationFrame(K.S.raf || 0); K.S.raf = 0; } else run();
      };
      document.addEventListener('visibilitychange', onVis);
      if (window.ResizeObserver) { var ro = new ResizeObserver(function () { if (!alive()) { ro.disconnect(); return; } measure(); if (phase === 'idle' && lite()) draw(); }); ro.observe(st); }

      setPhase('idle'); paintHist(); measure(); run();
      // a round still running (page reloaded / came back): the player takes it back
      if (!watch) K.multi(key, 'state', null, true).then(function (r) { if (alive() && r && !r.done && r.t0 && phase === 'idle') { r.now = r.now || Date.now() / 1000; begin(r); } });
    };
  }
  ['spacerun', 'flappyrock', 'stack', 'knifehit', 'basket', 'kicker'].forEach(function (k) { K.register(k, make(k), { rules: rules(k) }); });
})(window.D6 = window.D6 || {});
