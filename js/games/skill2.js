/* v2805/v2807 — "You're in control" group 2 (owner request; v2807: obvious on phones — hand hint until the first move,
   ripple on every touch, idle touch points to BET, Star Archer = tap the target, taps never lost): Star Archer, Fruit Slicer, Chicken Road, Hamster Run, Asteroid Dodge,
   Darts Pro — MIXED MODE like Aviator, but the player plays. One gesture each (drag / swipe / tap), canvas 2D at 60 fps.
   The multiplier follows the SERVER clock (×e^(rate·s), casino_ext.php 'skill'); the player cashes out with the gold button,
   or loses on a mistake (K.multi 'fail'); the server's secret end shows an unavoidable event (meteor, comet, supernova…).
   This file only draws: the server decides and pays.
   v2812 (owner, round 4): no touch ripple (the white rings confused players), the hand hint sits in a free zone of each
   scene and leaves as soon as the round starts, the multiplier grows slowly (rate 0.03: ×2 after ~23 s) and the
   difficulty keeps rising for ~2 minutes; Fruit Slicer cuts EVERY fruit the blade crosses (swept test, generous radius). */
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
  // per game: hint (gesture), fail (mistake), late (timer / misses), end (the secret end's event), rule (step 2 of the rules)
  var G = {
    archer: {
      en: ['Tap the target', 'Missed!', 'Time’s up!', 'Meteor!', 'Tap the moving target to shoot an arrow at it. A miss, or the timer running out, ends the round.'],
      fr: ['Touche la cible', 'Raté !', 'Temps écoulé !', 'Météore !', 'Touche la cible qui bouge pour y tirer une flèche. Un tir raté, ou le chrono à zéro, termine la partie.'],
      es: ['Toca el blanco', '¡Fallaste!', '¡Se acabó el tiempo!', '¡Meteoro!', 'Toca el blanco que se mueve para dispararle una flecha. Fallar, o que se acabe el tiempo, termina la ronda.'],
      pt: ['Toque no alvo', 'Errou!', 'Tempo esgotado!', 'Meteoro!', 'Toque no alvo em movimento para atirar uma flecha nele. Errar, ou o tempo acabar, encerra a rodada.'],
      ar: ['المس الهدف', 'أخطأت!', 'انتهى الوقت!', 'نيزك!', 'المس الهدف المتحرك لترمي سهمًا عليه. الخطأ أو انتهاء الوقت ينهي الجولة.'],
      tr: ['Hedefe dokun', 'Iskaladın!', 'Süre doldu!', 'Meteor!', 'Ok atmak için hareketli hedefe dokun. Iska ya da sürenin bitmesi turu bitirir.'],
      vi: ['Chạm vào bia', 'Trượt rồi!', 'Hết giờ!', 'Thiên thạch!', 'Chạm vào bia đang di chuyển để bắn tên vào đó. Bắn trượt hoặc hết giờ sẽ kết thúc ván.'],
      id: ['Ketuk sasaran', 'Meleset!', 'Waktu habis!', 'Meteor!', 'Ketuk target yang bergerak untuk memanahnya. Meleset atau waktu habis mengakhiri ronde.'],
      ru: ['Жми на мишень', 'Мимо!', 'Время вышло!', 'Метеор!', 'Нажми на движущуюся мишень, чтобы выстрелить в неё. Промах или конец таймера завершает раунд.'],
      de: ['Ziel antippen', 'Daneben!', 'Zeit abgelaufen!', 'Meteor!', 'Tippe auf das bewegte Ziel, um einen Pfeil darauf zu schießen. Ein Fehlschuss oder abgelaufene Zeit beendet die Runde.'],
      hi: ['निशाने पर टैप करें', 'चूक गए!', 'समय खत्म!', 'उल्का!', 'चलते निशाने पर तीर चलाने के लिए उस पर टैप करें। चूकना या समय खत्म होना राउंड खत्म करता है।'],
      zh: ['点击靶子', '射偏了！', '时间到！', '流星！', '点击移动的靶子向它射箭。射偏或计时结束，本回合结束。']
    },
    slicer: {
      en: ['Swipe to slice', 'Bomb!', 'Too many missed!', 'Supernova!', 'Swipe to slice the flying fruits. Slicing a bomb, or dropping 3 fruits, ends the round.'],
      fr: ['Glisse pour trancher', 'Bombe !', 'Trop de fruits ratés !', 'Supernova !', 'Glisse pour trancher les fruits. Trancher une bombe, ou laisser tomber 3 fruits, termine la partie.'],
      es: ['Desliza para cortar', '¡Bomba!', '¡Demasiadas frutas perdidas!', '¡Supernova!', 'Desliza para cortar las frutas. Cortar una bomba, o dejar caer 3 frutas, termina la ronda.'],
      pt: ['Deslize para cortar', 'Bomba!', 'Frutas demais perdidas!', 'Supernova!', 'Deslize para cortar as frutas. Cortar uma bomba, ou deixar cair 3 frutas, encerra a rodada.'],
      ar: ['اسحب للتقطيع', 'قنبلة!', 'فاتتك فواكه كثيرة!', 'مستعر أعظم!', 'اسحب لتقطع الفواكه الطائرة. قطع قنبلة أو سقوط 3 فواكه ينهي الجولة.'],
      tr: ['Kesmek için kaydır', 'Bomba!', 'Çok meyve kaçtı!', 'Süpernova!', 'Uçan meyveleri kesmek için kaydır. Bomba kesmek ya da 3 meyve düşürmek turu bitirir.'],
      vi: ['Vuốt để chém', 'Bom!', 'Bỏ lỡ quá nhiều!', 'Siêu tân tinh!', 'Vuốt để chém trái cây đang bay. Chém trúng bom hoặc để rơi 3 trái sẽ kết thúc ván.'],
      id: ['Usap untuk potong', 'Bom!', 'Terlalu banyak terlewat!', 'Supernova!', 'Usap untuk memotong buah yang terbang. Memotong bom atau menjatuhkan 3 buah mengakhiri ronde.'],
      ru: ['Проведи — режь', 'Бомба!', 'Слишком много пропущено!', 'Сверхновая!', 'Проводи пальцем, чтобы резать фрукты. Бомба или 3 упавших фрукта завершают раунд.'],
      de: ['Wischen zum Schneiden', 'Bombe!', 'Zu viele verpasst!', 'Supernova!', 'Wische, um die Früchte zu schneiden. Eine Bombe oder 3 verpasste Früchte beenden die Runde.'],
      hi: ['काटने को स्वाइप करें', 'बम!', 'बहुत फल छूट गए!', 'सुपरनोवा!', 'उड़ते फल काटने के लिए स्वाइप करें। बम काटना या 3 फल गिरना राउंड खत्म करता है।'],
      zh: ['滑动切水果', '炸弹！', '漏掉太多了！', '超新星！', '滑动切开飞行的水果。切到炸弹或漏掉 3 个水果，本回合结束。']
    },
    chicken: {
      en: ['Tap to hop', 'Hit!', 'Too slow!', 'Comet!', 'Tap to hop over the next lane. Being hit by a ship, or waiting until your platform crumbles, ends the round.'],
      fr: ['Touche pour sauter', 'Touché !', 'Trop lent !', 'Comète !', 'Touche pour sauter la voie suivante. Un vaisseau qui te touche, ou ta plateforme qui s’effrite, termine la partie.'],
      es: ['Toca para saltar', '¡Golpe!', '¡Muy lento!', '¡Cometa!', 'Toca para saltar el siguiente carril. Que te golpee una nave, o esperar hasta que tu plataforma se rompa, termina la ronda.'],
      pt: ['Toque para pular', 'Atingido!', 'Lento demais!', 'Cometa!', 'Toque para pular a próxima pista. Ser atingido por uma nave, ou esperar até a plataforma desmoronar, encerra a rodada.'],
      ar: ['المس للقفز', 'اصطدام!', 'بطيء جدًا!', 'مذنّب!', 'المس لتقفز فوق المسار التالي. اصطدام مركبة بك أو تفتت منصتك ينهي الجولة.'],
      tr: ['Zıplamak için dokun', 'Çarpıldın!', 'Çok yavaş!', 'Kuyruklu yıldız!', 'Sonraki şeridi atlamak için dokun. Bir gemiye çarpmak ya da platformun ufalanmasını beklemek turu bitirir.'],
      vi: ['Chạm để nhảy', 'Bị đâm!', 'Chậm quá!', 'Sao chổi!', 'Chạm để nhảy qua làn kế tiếp. Bị tàu đâm hoặc chờ đến khi bệ vỡ sẽ kết thúc ván.'],
      id: ['Ketuk untuk lompat', 'Tertabrak!', 'Terlalu lambat!', 'Komet!', 'Ketuk untuk melompati jalur berikut. Tertabrak kapal atau menunggu sampai pijakan runtuh mengakhiri ronde.'],
      ru: ['Тап — прыжок', 'Сбит!', 'Слишком медленно!', 'Комета!', 'Нажимай, чтобы перепрыгнуть полосу. Удар корабля или рассыпавшаяся платформа завершают раунд.'],
      de: ['Tippen zum Hüpfen', 'Getroffen!', 'Zu langsam!', 'Komet!', 'Tippe, um über die nächste Spur zu hüpfen. Ein Treffer durch ein Schiff oder eine zerbröckelte Plattform beendet die Runde.'],
      hi: ['कूदने को टैप करें', 'टक्कर!', 'बहुत धीमे!', 'धूमकेतु!', 'अगली लेन पार करने के लिए टैप करें। यान से टकराना या प्लेटफ़ॉर्म टूटने तक रुकना राउंड खत्म करता है।'],
      zh: ['点击跳跃', '被撞了！', '太慢了！', '彗星！', '点击跳过下一条航道。被飞船撞到，或等到平台碎裂，本回合结束。']
    },
    hamster: {
      en: ['Tap left or right', 'Crash!', '', 'Dead end!', 'Tap the left or right side to switch lanes. Hitting an obstacle ends the round.'],
      fr: ['Touche à gauche ou à droite', 'Boum !', '', 'Cul-de-sac !', 'Touche à gauche ou à droite pour changer de voie. Heurter un obstacle termine la partie.'],
      es: ['Toca izquierda o derecha', '¡Choque!', '', '¡Sin salida!', 'Toca a la izquierda o a la derecha para cambiar de carril. Chocar con un obstáculo termina la ronda.'],
      pt: ['Toque à esquerda ou direita', 'Batida!', '', 'Sem saída!', 'Toque à esquerda ou à direita para mudar de pista. Bater num obstáculo encerra a rodada.'],
      ar: ['المس يسارًا أو يمينًا', 'اصطدام!', '', 'طريق مسدود!', 'المس اليسار أو اليمين لتغيير المسار. الاصطدام بعائق ينهي الجولة.'],
      tr: ['Sola ya da sağa dokun', 'Çarptın!', '', 'Çıkmaz!', 'Şerit değiştirmek için sola ya da sağa dokun. Engele çarpmak turu bitirir.'],
      vi: ['Chạm trái hoặc phải', 'Đâm rồi!', '', 'Ngõ cụt!', 'Chạm bên trái hoặc phải để đổi làn. Đâm vào chướng ngại sẽ kết thúc ván.'],
      id: ['Ketuk kiri atau kanan', 'Tabrakan!', '', 'Jalan buntu!', 'Ketuk kiri atau kanan untuk pindah jalur. Menabrak rintangan mengakhiri ronde.'],
      ru: ['Жми слева или справа', 'Авария!', '', 'Тупик!', 'Нажимай слева или справа, чтобы менять полосу. Столкновение с препятствием завершает раунд.'],
      de: ['Links oder rechts tippen', 'Crash!', '', 'Sackgasse!', 'Tippe links oder rechts, um die Spur zu wechseln. Ein Hindernis beendet die Runde.'],
      hi: ['बाएँ या दाएँ टैप करें', 'टक्कर!', '', 'रास्ता बंद!', 'लेन बदलने के लिए बाएँ या दाएँ टैप करें। बाधा से टकराना राउंड खत्म करता है।'],
      zh: ['点击左边或右边', '撞上了！', '', '死路！', '点击左侧或右侧切换跑道。撞上障碍，本回合结束。']
    },
    dodge: {
      en: ['Slide to steer', 'Hit!', '', 'Giant meteor!', 'Drag to steer your ship between the asteroids. A hit ends the round.'],
      fr: ['Glisse pour piloter', 'Touché !', '', 'Météore géant !', 'Fais glisser pour piloter ton vaisseau entre les astéroïdes. Être touché termine la partie.'],
      es: ['Desliza para pilotar', '¡Impacto!', '', '¡Meteoro gigante!', 'Arrastra para pilotar tu nave entre los asteroides. Un impacto termina la ronda.'],
      pt: ['Deslize para pilotar', 'Atingido!', '', 'Meteoro gigante!', 'Arraste para pilotar a nave entre os asteroides. Ser atingido encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'إصابة!', '', 'نيزك عملاق!', 'اسحب لتوجيه مركبتك بين الكويكبات. الإصابة تنهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Vuruldun!', '', 'Dev meteor!', 'Gemiyi asteroitlerin arasından geçirmek için sürükle. Vurulmak turu bitirir.'],
      vi: ['Kéo để lái', 'Trúng rồi!', '', 'Thiên thạch khổng lồ!', 'Kéo để lái tàu né các tiểu hành tinh. Bị trúng sẽ kết thúc ván.'],
      id: ['Geser untuk setir', 'Kena!', '', 'Meteor raksasa!', 'Seret untuk mengemudikan kapal di antara asteroid. Terkena mengakhiri ronde.'],
      ru: ['Веди пальцем', 'Попадание!', '', 'Гигантский метеор!', 'Веди пальцем, чтобы проводить корабль между астероидами. Попадание завершает раунд.'],
      de: ['Wischen zum Steuern', 'Treffer!', '', 'Riesenmeteor!', 'Ziehe, um dein Schiff zwischen den Asteroiden zu steuern. Ein Treffer beendet die Runde.'],
      hi: ['चलाने को खिसकाएँ', 'टक्कर!', '', 'विशाल उल्का!', 'क्षुद्रग्रहों के बीच यान चलाने के लिए खींचें। टकराना राउंड खत्म करता है।'],
      zh: ['滑动操控', '被击中！', '', '巨型流星！', '拖动驾驶飞船穿过小行星。被击中，本回合结束。']
    },
    dartspro: {
      en: ['Tap when green', 'Off the board!', 'Time’s up!', 'Meteor!', 'Tap to throw when the moving aim is on the board (green). Off the board, or the timer running out, ends the round.'],
      fr: ['Touche quand c’est vert', 'Hors cible !', 'Temps écoulé !', 'Météore !', 'Touche pour lancer quand la mire est sur la cible (verte). Hors cible, ou le chrono à zéro, termine la partie.'],
      es: ['Toca cuando esté verde', '¡Fuera de la diana!', '¡Se acabó el tiempo!', '¡Meteoro!', 'Toca para lanzar cuando la mira esté en la diana (verde). Fuera de la diana, o que se acabe el tiempo, termina la ronda.'],
      pt: ['Toque quando ficar verde', 'Fora do alvo!', 'Tempo esgotado!', 'Meteoro!', 'Toque para lançar quando a mira estiver no alvo (verde). Fora do alvo, ou o tempo acabar, encerra a rodada.'],
      ar: ['المس عندما يخضرّ', 'خارج اللوحة!', 'انتهى الوقت!', 'نيزك!', 'المس للرمي عندما يكون المؤشر على اللوحة (أخضر). خارج اللوحة أو انتهاء الوقت ينهي الجولة.'],
      tr: ['Yeşilken dokun', 'Tahta dışı!', 'Süre doldu!', 'Meteor!', 'Nişangâh tahtadayken (yeşil) atmak için dokun. Tahta dışı ya da sürenin bitmesi turu bitirir.'],
      vi: ['Chạm khi màu xanh', 'Ra ngoài bảng!', 'Hết giờ!', 'Thiên thạch!', 'Chạm để ném khi tâm ngắm nằm trên bảng (xanh). Ra ngoài bảng hoặc hết giờ sẽ kết thúc ván.'],
      id: ['Ketuk saat hijau', 'Di luar papan!', 'Waktu habis!', 'Meteor!', 'Ketuk untuk melempar saat bidikan di papan (hijau). Di luar papan atau waktu habis mengakhiri ronde.'],
      ru: ['Жми, когда зелёный', 'Мимо мишени!', 'Время вышло!', 'Метеор!', 'Нажми, чтобы бросить, когда прицел на мишени (зелёный). Мимо мишени или конец таймера завершает раунд.'],
      de: ['Tippen bei Grün', 'Neben der Scheibe!', 'Zeit abgelaufen!', 'Meteor!', 'Tippe zum Werfen, wenn das Visier auf der Scheibe ist (grün). Daneben oder abgelaufene Zeit beendet die Runde.'],
      hi: ['हरा हो तब टैप करें', 'बोर्ड से बाहर!', 'समय खत्म!', 'उल्का!', 'निशाना बोर्ड पर (हरा) हो तब फेंकने के लिए टैप करें। बोर्ड से बाहर या समय खत्म होना राउंड खत्म करता है।'],
      zh: ['变绿时点击', '脱靶了！', '时间到！', '流星！', '准星在靶上（绿色）时点击投掷。脱靶或计时结束，本回合结束。']
    }
  };
  function L(key) {
    var lg = K.lang(), c = Object.assign({}, C.en, C[lg] || {}), g = (G[key][lg] || G[key].en);
    c.hint = g[0]; c.fail = g[1]; c.late = g[2]; c.end = g[3];
    return c;
  }
  function rules(key) {
    var o = {};
    Object.keys(C).forEach(function (lg) { var g = G[key][lg] || G[key].en; o[lg] = '1. ' + C[lg].r1 + '\n2. ' + g[4] + '\n3. ' + C[lg].r3; });
    return o;
  }

  /* ------------------------------------------------------------------ small drawing helpers */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ease(k) { return 1 - Math.pow(1 - clamp(k, 0, 1), 3); }
  function num(v) { return Number(v).toFixed(2).replace('.', K.dec()); }
  function xm(v) { return '⁦×' + num(v) + '⁩'; }
  function money(v) { return '⁦$ ' + K.m2(v).replace('.', K.dec()) + '⁩'; }
  // pre-rendered sprite (drawn once, then drawImage: cheap on old phones)
  function mkc(w, h, dpr, fn) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * dpr)); c.height = Math.max(1, Math.ceil(h * dpr));
    var x = c.getContext('2d'); x.scale(dpr, dpr); fn(x, w, h);
    return c;
  }
  // glossy ball gradient lit from the top-left
  function gl(c, x, y, r, cols) {
    var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.06, x, y, r);
    for (var i = 0; i < cols.length; i++) g.addColorStop(i / (cols.length - 1), cols[i]);
    return g;
  }
  function circ(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function stars(c, W, H, n) {
    for (var i = 0; i < n; i++) {
      var r = Math.random(); c.globalAlpha = 0.25 + Math.random() * 0.75;
      c.fillStyle = r > 0.92 ? '#FDE68A' : r > 0.82 ? '#C4B5FD' : '#fff';
      var s = r > 0.96 ? 2 : r > 0.7 ? 1.3 : 0.9; c.fillRect(Math.random() * W, Math.random() * H, s, s);
    }
    c.globalAlpha = 1;
  }
  function bgSprite(W, H, dpr, neb, n) {
    return mkc(W, H, dpr, function (c) {
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1E1548'); g.addColorStop(1, '#0B0820');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      neb.forEach(function (b) {
        var r = b[2] * Math.max(W, H), q = c.createRadialGradient(b[0] * W, b[1] * H, 0, b[0] * W, b[1] * H, r);
        q.addColorStop(0, b[3]); q.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = q; c.fillRect(0, 0, W, H);
      });
      c.save(); c.translate(W / 2, H * 0.45); c.rotate(-0.55); var mw = c.createLinearGradient(0, -H * 0.1, 0, H * 0.1); mw.addColorStop(0, 'rgba(196,181,253,0)'); mw.addColorStop(0.5, 'rgba(196,181,253,.1)'); mw.addColorStop(1, 'rgba(196,181,253,0)'); c.fillStyle = mw; c.fillRect(-W * 1.5, -H * 0.1, W * 3, H * 0.2); c.restore(); // v2860: milky way
      stars(c, W, H, n);
      for (var i = 0; i < Math.round(n / 10); i++) { var sx = Math.random() * W, sy = Math.random() * H, q = c.createRadialGradient(sx, sy, 0, sx, sy, 4); q.addColorStop(0, 'rgba(255,255,255,.9)'); q.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = q; c.fillRect(sx - 4, sy - 4, 8, 8); }
    });
  }
  // fireball with tail (moving along angle a)
  function meteor(c, x, y, r, a) {
    var tx = -Math.cos(a), ty = -Math.sin(a), Lt = r * 4.5, nx = -ty, ny = tx;
    var g = c.createLinearGradient(x, y, x + tx * Lt, y + ty * Lt);
    g.addColorStop(0, 'rgba(253,186,116,.95)'); g.addColorStop(0.45, 'rgba(244,63,94,.45)'); g.addColorStop(1, 'rgba(139,92,246,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x + nx * r, y + ny * r); c.lineTo(x + tx * Lt, y + ty * Lt); c.lineTo(x - nx * r, y - ny * r); c.closePath(); c.fill();
    var h = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r * 1.2);
    h.addColorStop(0, '#FFF7ED'); h.addColorStop(0.35, '#FDBA74'); h.addColorStop(0.75, '#EA580C'); h.addColorStop(1, 'rgba(124,45,18,0)');
    c.fillStyle = h; c.beginPath(); c.arc(x, y, r * 1.2, 0, TAU); c.fill();
  }
  function rockSprite(R, dpr) { // v2860: a real asteroid — lumpy outline, craters with lit rims, terminator shadow, rim light
    var seed = (Math.random() * 1000) | 0;
    return mkc(R * 2 + 2, R * 2 + 2, dpr, function (c) {
      var cx = R + 1, cy = R + 1, n = 14, S = seed; function Rn() { S = (S * 9301 + 49297) % 233280; return S / 233280; }
      var pts = []; for (var i = 0; i < n; i++) { var a = i / n * TAU, rr = R * (0.78 + Rn() * 0.22); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      c.beginPath(); c.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
      for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
      c.closePath(); c.fillStyle = gl(c, cx, cy, R * 1.1, ['#D9CFEA', '#9A8DB8', '#5A4C7A', '#241B3A']); c.fill();
      c.save(); c.clip();
      for (var k = 0; k < 7; k++) { var b = Rn() * TAU, d = Rn() * R * 0.6, cr = R * (0.08 + Rn() * 0.16), x = cx + Math.cos(b) * d, y = cy + Math.sin(b) * d;
        circ(c, x, y, cr, 'rgba(30,20,50,.45)'); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = Math.max(0.6, cr * 0.2); c.beginPath(); c.arc(x, y, cr, Math.PI * 0.1, Math.PI * 0.9); c.stroke(); }
      for (k = 0; k < 40; k++) { c.fillStyle = Rn() < 0.5 ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.18)'; c.fillRect(cx - R + Rn() * R * 2, cy - R + Rn() * R * 2, 1, 1); }
      var sh = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.55, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(8,4,20,.65)'); c.fillStyle = sh; c.fillRect(0, 0, R * 2 + 2, R * 2 + 2);
      c.restore();
      c.strokeStyle = 'rgba(196,181,253,.35)'; c.lineWidth = Math.max(1, R * 0.06); c.beginPath(); c.arc(cx, cy, R * 0.85, Math.PI * 1.05, Math.PI * 1.55); c.stroke();
    });
  }

  /* hand hints (one per gesture): tap = ripple; swipe = finger sweeping; lr = arrows left / right; drag = finger sliding */
  var FINGER = '<path d="M11 21V9.5a2 2 0 0 1 4 0V16m0-2a2 2 0 0 1 4 0v2m0-1a2 2 0 0 1 4 0v5c0 4.5-3 8-7.5 8H14c-2.4 0-4-1-5.3-2.9L6 23a2 2 0 0 1 3.2-2.4L11 23"/>';
  var HAND = {
    tap: '<svg viewBox="0 0 32 32" aria-hidden="true">' + FINGER + '</svg>',
    swipe: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-trail" d="M3 6c5 3 12 4 20 1"/>' + FINGER + '</svg>',
    lr: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 9l5-4v8zM31 9l-5-4v8z"/>' + FINGER + '</svg>',
    drag: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 9l5-4v8zM31 9l-5-4v8z"/>' + FINGER + '</svg>'
  };

  /* ------------------------------------------------------------------ shared engine (round flow + canvas loop) */
  function boot(key, mk, gest, hy) {
    K.register(key, function (box) {
      var l = L(key), lite = document.documentElement.classList.contains('oro-lite'), hist = [];
      try { hist = JSON.parse(localStorage.getItem('cg_' + key + '_h') || '[]').slice(0, 12); } catch (e) { hist = []; }
      box.classList.add('cg-game', 'cg-s2', 'cg-' + key); box.style.setProperty('--hy', (hy || 0.46) * 100 + '%'); // v2812: hint in a free zone of this scene
      box.innerHTML = '<div class="cg-stage s2-st" id="s2St"><canvas class="s2-bg" id="s2Bg"></canvas><canvas class="s2-cv" id="s2Cv"></canvas><div class="cg-hist s2-hist" id="s2Hist"></div>' +
        '<div class="s2-hud" id="s2Hud"><b class="fit s2-m idle" id="s2M">' + xm(1) + '</b><small class="fit s2-msg" id="s2Msg"></small></div>' +
        '<div class="sk-hint g-' + gest + '" id="s2Hint"><i class="sk-hand">' + HAND[gest] + '</i><small class="fit">' + K.esc(l.hint) + '</small></div></div>' + K.stakePanel(l.bet);
      K.bindStake(box);
      var st = $('s2St'), cv = $('s2Cv'), ctx = cv.getContext('2d'), btn = $('csGo'), mEl = $('s2M'), msgEl = $('s2Msg'), hud = $('s2Hud'), hintEl = $('s2Hint'), gN = 0, nudgeT = 0;
      var hintOn = function (on) { hintEl.classList.toggle('off', !on); st.classList.toggle('idle', phase === 'idle'); };
      var W = 0, H = 0, dpr = 1, rect = null, sized = false, fadeS = null, fadeH = 0, phase = 'idle', R = null, off = 0, busy = false, playT = 0, overT = 0, last = 0, drawn = false, hintT = 0;
      var P = [], RG = [], shake = 0, flash = 0, mShown = '';
      var bgCv = $('s2Bg'), bgOn = null;
      var A = {
        l: l, lite: lite,
        // the static background lives in its own canvas behind the scene: painted once, never redrawn each frame
        bg: function (img) { if (bgOn === img) return; bgOn = img; bgCv.width = img.width; bgCv.height = img.height; bgCv.getContext('2d').drawImage(img, 0, 0); },
        lv: function () { return Math.min(1, playT / 110); },              // v2812: difficulty rises over ~2 min (fair start, really hard later)
        live: function () { return phase === 'play'; },
        idle: function () { return phase === 'idle' || phase === 'demo'; }, // the visitor's demo round = the attract autopilot
        fail: function (why) {                                              // the player's own mistake
          if (phase !== 'play') return false;
          phase = 'failing'; say(why, 'lost'); setBtn(l.bet, '', 'wait'); btn.disabled = true;
          sendFail(); return true;
        },
        burst: function (x, y, n, cols, sp, life, sz) {
          if ((phase === 'play' || phase === 'demo') && !A._xb) K.sfx('hit'); // v2832 : un bon coup (fruit coupé, brique, pièce…) sonne ; jamais l'explosion d'une erreur
          if (lite) n = Math.ceil(n / 3);
          for (var i = 0; i < n; i++) {
            if (P.length > 160) P.shift();
            var a = Math.random() * TAU, s = sp * rnd(0.25, 1);
            P.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, m: (life || 0.7) * rnd(0.5, 1.2), c: cols[i % cols.length], r: (sz || 3) * rnd(0.6, 1.3) });
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
      box._s2 = g; // read-only hook for the touch tests (scripts in /tmp); nothing reads it in the app

      function say(t, cls) { K.setText(msgEl, t || ''); mEl.classList.remove('won', 'lost', 'idle'); if (cls) mEl.classList.add(cls); }
      function tx(el, s) { if (el.textContent === s) return; if (el.textContent.length !== s.length) K.setText(el, s); else el.textContent = s; }
      function setBtn(main, sub, cls) {
        btn.classList.remove('cash', 'wait');
        if (cls) btn.classList.add(cls);
        if (sub) { btn.innerHTML = '<span class="fit s2-b1"></span><span class="fit s2-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
        else { btn.innerHTML = '<span class="fit cg-gol"></span>'; K.setText(btn.firstChild, main); }
      }
      function paintHist() {
        $('s2Hist').innerHTML = hist.map(function (h) { var v = Math.abs(h); return '<i class="' + (h < 0 ? 'x' : v >= 10 ? 'hi' : v >= 2 ? 'mid' : 'lo') + '">' + xm(v) + '</i>'; }).join('');
      }
      function nowS() { return Date.now() / 1000 + off; }
      function mult() { return R ? Math.max(1, Math.floor(Math.exp(R.rate * Math.max(0, nowS() - R.t0)) * 100 + 1e-9) / 100) : 1; }

      function resize() {
        if (!box.isConnected) return;
        var r = st.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
        rect = r;
        if (!w || !h || (w === W && h === H)) return;
        W = w; H = h; dpr = lite ? 1 : Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        var top = hud.offsetTop + mEl.offsetHeight + Math.max(22, msgEl.offsetHeight) + 10; // below the multiplier AND the status pill
        g.size(W, H, Math.min(W, H * 0.8) / 100, dpr, top);
        fadeH = top + 26; // dark band behind the multiplier: always readable over the scene
        fadeS = mkc(W, fadeH, dpr, function (c) { var q = c.createLinearGradient(0, 0, 0, fadeH); q.addColorStop(0, 'rgba(11,8,32,.82)'); q.addColorStop(0.6, 'rgba(11,8,32,.5)'); q.addColorStop(1, 'rgba(11,8,32,0)'); c.fillStyle = q; c.fillRect(0, 0, W, fadeH); });
        if (!sized) { sized = true; if (phase === 'idle') g.reset(false); }
        drawn = false;
      }
      var ro = null;
      if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(st); } else window.addEventListener('resize', resize);

      function loop(ts) {
        if (!box.isConnected) { if (ro) ro.disconnect(); return; }
        K.S.raf = requestAnimationFrame(loop);
        if (document.hidden) { last = 0; return; }                      // paused while the tab is hidden
        var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
        if (!W) { resize(); if (!W) return; }
        if (D) demoTick(dt);                                            // visitor: a demo round plays by itself
        if (lite && phase === 'idle' && drawn && !P.length) return;      // old phones: still idle scene
        var moving = phase !== 'idle' || !lite;
        if (phase === 'play') playT += dt;
        if (phase === 'over') { overT -= dt; if (overT <= 0) toIdle(); }
        if (moving) g.step(dt, phase === 'play' || phase === 'cashing');
        for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; p.t += dt; if (p.t >= p.m) { P.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.vy = p.vy * 0.985 + 40 * dt; }
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
        // multiplier + cash-out amount follow the server clock
        if (phase === 'play' || phase === 'cashing') {
          var m = mult(), s = xm(m);
          if (s !== mShown) { mShown = s; tx(mEl, s); if (phase === 'play' && btn.lastChild && btn.lastChild.className === 'fit s2-b2') tx(btn.lastChild, money(R.stake * m)); }
          if (hintT > 0) { hintT -= dt; if (hintT <= 0 || gN > 0) { hintT = 0; hintOn(false); } } // the hand hint stays until the first move
        }
      }

      async function start() {
        if (K.guest()) { K.signup(); return; }
        if (busy) return;
        busy = true; btn.disabled = true;
        var r = await K.multi(key, 'start');
        busy = false; btn.disabled = false;
        if (!r || !box.isConnected) return;
        begin(r);
      }
      function begin(r) {
        if (!W) resize();
        R = r; off = (Number(r.now) || Date.now() / 1000) - Date.now() / 1000; playT = r.resume ? Math.max(0, r.now - r.t0) : 0;
        if (r.done) { result(r); return; }
        g.reset(true); P.length = 0; RG.length = 0;
        phase = 'play'; mShown = ''; hintT = 0; gN = 0; box.setAttribute('data-gn', '0'); say('', ''); hintOn(false); // v2812: the hint leaves when the round starts
        btn.classList.remove('sk-nudge'); st.querySelectorAll('.cs-toast').forEach(function (t) { t.remove(); }); st.querySelectorAll('.s2-hud *, .sk-hint, .sk-hint *').forEach(function (e) { e.style.visibility = ''; });
        setBtn(l.cash, money(r.stake * mult()), 'cash');
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
        phase = 'over'; overT = 99; btn.disabled = true; hintOn(false);
        g.boom(); say(l.end, 'lost'); setBtn(l.bet, '', 'wait');
        setTimeout(function () { if (box.isConnected) result(r); }, 1300);
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
        if ((Number(r.win) || 0) > 0) { if (g.win) g.win(); say(l.won + ' ' + xm(r.out), 'won'); tx(mEl, xm(r.out)); result(r); }
        else ended(r);
      }
      function result(r) {
        phase = 'over'; overT = 3.2; clearTimeout(K.S.timer); hintOn(false);
        btn.disabled = true; setTimeout(function () { if (box.isConnected) btn.disabled = false; }, 900); // a late "cash out" tap never places a new bet
        var won = (Number(r.win) || 0) > 0, v = won ? Number(r.out) || mult() : (r.why === 'end' && r.c ? Number(r.c) : mult());
        if (!won) tx(mEl, xm(Math.max(1, v)));
        hist.unshift(won ? v : -Math.max(1, v)); hist = hist.slice(0, 12);
        try { localStorage.setItem('cg_' + key + '_h', JSON.stringify(hist)); } catch (e) { /* ignore */ }
        paintHist(); setBtn(l.bet); R = null;
        K.resultLine(box, r);
      }
      function toIdle() { phase = 'idle'; g.reset(false); say('', 'idle'); tx(mEl, xm(1)); mShown = ''; drawn = false; hintOn(true); }
      // 2026-10-21 (owner) — VISITOR (not logged in): the scene looks like a real round playing by itself, calm like a video
      // (the attract autopilot dodges everything, the multiplier climbs, the game's sounds; a soft cash-out sparkle, a fade, again).
      // Never a hit or a loss. K.demo: no server, nothing saved.
      var D = null;
      function demoTick(dt) {
        var ev = D.tick(dt);
        if (ev === 'start') { phase = 'demo'; g.reset(false); P.length = 0; RG.length = 0; say('', ''); hintOn(false); mShown = ''; }
        else if (ev === 'win') { if (g.win) g.win(); say(l.won + ' ' + xm(D.m()), 'won'); }
        if (ev === 'win') { hist.unshift(D.m()); hist = hist.slice(0, 12); paintHist(); } // shown, never saved
        if (phase === 'demo' && D.state === 'run') { var s = xm(D.m()); if (s !== mShown) { mShown = s; tx(mEl, s); } }
      }

      // ONE gesture on the WHOLE scene (pointer events, no 300 ms delay); v2812: no ripple — the game itself answers
      function pt(e) { var r = rect || st.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      var practice = function () { return phase === 'idle' && g.practice; };   // Fruit Slicer: slice the idle fruits for fun
      function nudge() { // touching the scene before betting points to the BET button
        if (K.guest()) return;
        say(l.go, 'idle'); btn.classList.remove('sk-nudge'); void btn.offsetWidth; btn.classList.add('sk-nudge');
        clearTimeout(nudgeT); nudgeT = setTimeout(function () { if (!box.isConnected) return; btn.classList.remove('sk-nudge'); if (phase === 'idle') say('', 'idle'); }, 1800);
      }
      cv.addEventListener('pointerdown', function (e) {
        e.preventDefault(); rect = st.getBoundingClientRect();
        if (e.pointerType === 'mouse' && e.button) return;
        try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        var p = pt(e);
        if (phase === 'play') { gN++; box.setAttribute('data-gn', String(gN)); K.sfx('act'); g.down(p[0], p[1]); }
        else { if (practice()) g.down(p[0], p[1]); if (phase === 'idle') nudge(); }
      });
      cv.addEventListener('pointermove', function (e) {
        if (!((phase === 'play' || practice()) && g.move)) return;
        var ev = e.getCoalescedEvents ? e.getCoalescedEvents() : null; // every point of a fast swipe (iOS / Android batch them)
        if (!ev || !ev.length) ev = [e];
        for (var i = 0; i < ev.length; i++) { var p = pt(ev[i]); g.move(p[0], p[1]); }
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function (e) { if (g.up) { var p = pt(e); g.up(p[0], p[1], phase === 'play'); } }); });
      cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      // iOS Safari: no page scroll, no double-tap zoom, no long-press magnifier / callout on the scene
      var stopT = function (e) { if (e.cancelable) e.preventDefault(); };
      ['touchstart', 'touchmove', 'touchend'].forEach(function (ev) { st.addEventListener(ev, stopT, { passive: false }); });
      btn.addEventListener('click', function () {
        if (phase === 'play') cash();
        else if (phase === 'idle' || phase === 'over') { if (phase === 'over') toIdle(); start(); }
      });

      paintHist(); setBtn(l.bet); say('', 'idle'); hintOn(true);
      D = K.demo ? K.demo(st) : null; // visitors only (null for a logged-in player)
      requestAnimationFrame(function () { resize(); cancelAnimationFrame(K.S.raf || 0); K.S.raf = requestAnimationFrame(loop); });
      // a round still running (page reloaded, game reopened): pick it up
      if (!K.guest()) K.multi(key, 'state', null, true).then(function (r) { if (r && !r.done && r.t0 && box.isConnected && phase === 'idle') { r.resume = 1; requestAnimationFrame(function () { begin(r); }); } });
    }, { rules: rules(key) });
  }

  /* ================================================================== 1. STAR ARCHER — drag back, release, hit the moving target */
  boot('archer', function (A) {
    // v2807 (owner: "pull back and release" was confusing) — ONE simple gesture: TAP THE TARGET. The bow turns to it by
    // itself and the arrow flies there; a tap beside the target is a miss. No wind (it confused players).
    var W, H, u, dpr, T, bg, tgS, man, deckS = null, tg = {}, arrow = null, stuck = null, clock = 0, lim = 6, met = null, dead = false, won = 0, t = 0, streaks = [], aimA = -Math.PI / 2;
    function newTarget(first) {
      var lv = A.lv();
      tg.r = Math.max(18, (10 - 3 * lv) * u);   // big at the start, smaller very slowly
      tg.y = Math.max(T + tg.r + 8, H * 0.36);
      tg.x = first ? W / 2 : (Math.random() < 0.5 ? tg.r + 6 : W - tg.r - 6); // always fully on screen (it fades in)
      tg.v = W * (0.1 + 0.18 * lv) * (Math.random() < 0.5 ? -1 : 1);
      if (!first) tg.v = Math.abs(tg.v) * (tg.x < W / 2 ? 1 : -1);
      tg.in = first ? 1 : 0;
      lim = 6.5 - 2 * lv; clock = lim;
    }
    function bow() { return [W / 2, H - Math.max(40, 16 * u) * 0.75 - 6]; }
    function apos() { // flying arrow: position + angle
      var p = ease(arrow.p), ex = arrow.hit ? tg.x + arrow.dx : arrow.ex, ey = arrow.hit ? tg.yy + arrow.dy : arrow.ey;
      return [arrow.sx + (ex - arrow.sx) * p, arrow.sy + (ey - arrow.sy) * p, Math.atan2(ey - arrow.sy, ex - arrow.sx)];
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        bg = bgSprite(W, H, dpr, [[0.2, 0.25, 0.5, 'rgba(139,92,246,.30)'], [0.85, 0.7, 0.45, 'rgba(236,72,153,.16)']], A.lite ? 40 : 90);
        var r = Math.max(18, 10 * u);
        // v2860 (owner: "amateur") — drawing only: a hovering target drone (shaded rings, metal rim, side thrusters), a real
        // astronaut archer seen over the shoulder (D6.Rig), a launch deck under him, glowing energy arrows.
        tgS = mkc(r * 2.9, r * 2 + 6, dpr, function (c, w2) {
          var cx = w2 / 2, cy = r + 3, cols = [['#FEF9C3', '#FDE68A', '#CA8A04'], ['#FDA4AF', '#F43F5E', '#881337'], ['#FFFFFF', '#FFF7ED', '#CBD5E1'], ['#FDA4AF', '#F43F5E', '#881337'], ['#FEF3C7', '#FBBF24', '#B45309']];
          [-1, 1].forEach(function (sd) { c.fillStyle = gl(c, cx + sd * r * 1.18, cy, r * 0.3, ['#E2E8F0', '#64748B', '#1E293B']); c.beginPath(); c.ellipse(cx + sd * r * 1.18, cy, r * 0.22, r * 0.42, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(56,189,248,.55)'; c.beginPath(); c.ellipse(cx + sd * r * 1.18, cy + r * 0.48, r * 0.12, r * 0.2, 0, 0, TAU); c.fill(); c.fillStyle = '#475569'; c.fillRect(cx + sd * r * 0.95 - (sd > 0 ? 0 : r * 0.1), cy - r * 0.06, r * 0.12, r * 0.12); });
          circ(c, cx, cy + 2, r * 1.02, 'rgba(0,0,0,.35)');
          circ(c, cx, cy, r * 1.02, gl(c, cx, cy, r * 1.02, ['#F1F5F9', '#94A3B8', '#334155']));
          for (var i = 0; i < 5; i++) { var rr2 = r * 0.92 * (1 - i * 0.19); circ(c, cx, cy, rr2, gl(c, cx, cy, rr2, cols[i])); }
          c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; for (i = 0; i < 5; i++) { c.beginPath(); c.arc(cx, cy, r * 0.92 * (1 - i * 0.19), 0, TAU); c.stroke(); }
          c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(cx - r * 0.35, cy - r * 0.45, r * 0.32, r * 0.15, -0.6, 0, TAU); c.fill();
        });
        tgS.k = 2.9;
        var mw = Math.max(40, 16 * u);
        man = D6.Rig ? D6.Rig.one(mw * 1.45, mw * 2.4, dpr, { view: 'back', pose: 'archer', pal: { suit: 1, skin: '#F3CDAA' } }) : mkc(mw, mw, dpr, function () {});
        deckS = mkc(W, mw * 1.2, dpr, function (c, w2, h2) { // the launch deck at the bottom: metal plates, rim light, hazard edge
          var g = c.createLinearGradient(0, 0, 0, h2); g.addColorStop(0, '#6B7194'); g.addColorStop(0.2, '#3E4266'); g.addColorStop(1, '#14152A'); c.fillStyle = g;
          c.beginPath(); c.moveTo(0, h2 * 0.3); c.quadraticCurveTo(w2 / 2, -h2 * 0.05, w2, h2 * 0.3); c.lineTo(w2, h2); c.lineTo(0, h2); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(56,189,248,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, h2 * 0.3); c.quadraticCurveTo(w2 / 2, -h2 * 0.05, w2, h2 * 0.3); c.stroke();
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; for (var x = 0; x < w2; x += 46) { c.beginPath(); c.moveTo(x, h2 * 0.25); c.lineTo(x - 20, h2); c.stroke(); }
          for (x = 20; x < w2; x += 46) circ(c, x, h2 * 0.32 - Math.sin(x / w2 * Math.PI) * h2 * 0.18, 2, '#7DD3FC');
        });
        streaks = []; for (var i = 0; i < (A.lite ? 6 : 14); i++) streaks.push({ x: Math.random() * W, y: rnd(T, H * 0.75), l: rnd(10, 26) });
        if (tg.r == null) newTarget(true);
      },
      reset: function () { arrow = null; stuck = null; met = null; dead = false; won = 0; tg = {}; newTarget(true); },
      step: function (dt, live) {
        t += dt;
        var lv = A.lv();
        if (tg.in < 1) tg.in = Math.min(1, tg.in + dt * 2.5);
        tg.x += tg.v * dt;
        if (tg.x < tg.r && tg.v < 0 && tg.in >= 1) tg.v = -tg.v;
        if (tg.x > W - tg.r && tg.v > 0 && tg.in >= 1) tg.v = -tg.v;
        tg.yy = tg.y + Math.sin(t * 1.7) * 3 * u * lv;
        for (var i = 0; i < streaks.length; i++) { var s = streaks[i]; s.x += 10 * dt; if (s.x > W + 30) s.x = -30; }
        var b = bow(), want = arrow ? apos()[2] : Math.atan2(tg.yy - b[1], tg.x - b[0]); // the bow follows the target
        aimA += (clamp(want, -Math.PI * 0.94, -Math.PI * 0.06) - aimA) * Math.min(1, dt * 10);
        if (arrow) {
          arrow.p += dt / arrow.T;
          if (arrow.p >= 1) {
            if (arrow.hit) {
              var hx = tg.x + arrow.dx, hy = tg.yy + arrow.dy;
              stuck = { dx: arrow.dx, dy: arrow.dy, a: apos()[2], t: 0.45 };
              A.burst(hx, hy, 16, ['#FDE68A', '#FFF7ED', '#F43F5E'], 160, 0.5, 3); A.ring(tg.x, tg.yy, tg.r * 1.6, '#FDE68A');
            }
            arrow = null;
          }
        }
        if (stuck) { stuck.t -= dt; if (stuck.t <= 0) { stuck = null; if (live) newTarget(false); } }
        if (live && !arrow && !stuck && !dead && !met && tg.in >= 1) { clock -= dt; if (clock <= 0 && A.fail(A.l.late)) dead = 2; }
        if (met) {
          met.x += met.vx * dt; met.y += met.vy * dt;
          if (!met.hit && met.y >= b[1] - 4 * u) { met.hit = 1; dead = 1; A.explode(b[0], b[1] - 4 * u, 1.6); }
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        c.strokeStyle = 'rgba(196,181,253,.25)'; c.lineWidth = 1.2; c.beginPath();
        for (var i = 0; i < streaks.length; i++) { var s = streaks[i]; c.moveTo(s.x, s.y); c.lineTo(s.x - s.l, s.y); }
        c.stroke();
        var ty = tg.yy == null ? tg.y : tg.yy;
        c.globalAlpha = tg.in; c.drawImage(tgS, tg.x - tg.r * 1.45, ty - tg.r - 3, tg.r * 2.9, tg.r * 2 + 6); c.globalAlpha = 1;
        if (A.live() && !stuck && !dead) { // shot clock around the target
          var k = clamp(clock / lim, 0, 1);
          c.strokeStyle = k < 0.3 ? '#F43F5E' : '#FBBF24'; c.lineWidth = 3.5; c.lineCap = 'round';
          c.beginPath(); c.arc(tg.x, ty, tg.r + 7, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
        }
        if (stuck) { c.save(); c.translate(tg.x + stuck.dx, ty + stuck.dy); c.rotate(stuck.a); arrowPath(c, -22, 0); c.restore(); }
        if (arrow) { var q = apos(); c.save(); c.translate(q[0], q[1]); c.rotate(q[2]); arrowPath(c, 0, 0); c.restore(); }
        var b = bow();
        if (dead !== 1) {
          var mw = Math.max(40, 16 * u), jy = won ? -Math.abs(Math.sin(won * 9)) * 5 * u : 0;
          if (deckS) c.drawImage(deckS, 0, H - mw * 0.85, W, mw * 1.2);
          c.save(); c.translate(b[0], b[1] + jy); c.rotate((aimA + Math.PI / 2) * 0.25); c.drawImage(man, -mw * 0.725, -mw * 0.62, mw * 1.45, mw * 2.4); c.restore();
          c.save(); c.translate(b[0], b[1] - 2 * u + jy); c.rotate(aimA + Math.PI / 2);
          var br = Math.max(24, 9 * u);
          c.strokeStyle = '#FBBF24'; c.lineWidth = Math.max(2.5, 1.1 * u); c.lineCap = 'round';
          c.beginPath(); c.arc(0, br * 0.55, br, -Math.PI * 0.82, -Math.PI * 0.18); c.stroke();
          var ex = Math.cos(-Math.PI * 0.82) * br, ey = br * 0.55 + Math.sin(-Math.PI * 0.82) * br;
          c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ex, ey); c.lineTo(0, ey); c.lineTo(-ex, ey); c.stroke();
          if (!arrow && !stuck && !dead) { c.rotate(-Math.PI / 2); arrowPath(c, -ey + 26, 0); }
          c.restore();
        }
        if (met) meteor(c, met.x, met.y, met.r, Math.atan2(met.vy, met.vx));
      },
      down: function (x, y) {
        if (arrow || stuck || dead || met || tg.in < 1) return;
        var b = bow(), sx = b[0], sy = b[1] - 2 * u, d = Math.hypot(x - tg.x, y - tg.yy);
        if (d <= tg.r * 1.3 + 10) { // generous: a finger is wide
          arrow = { sx: sx, sy: sy, hit: 1, dx: clamp((x - tg.x) * 0.5, -tg.r * 0.5, tg.r * 0.5), dy: clamp((y - tg.yy) * 0.5, -tg.r * 0.5, tg.r * 0.5), p: 0, T: 0.2 };
        } else { // beside the target: the arrow flies past, off the screen — decided now
          var a = Math.atan2(y - sy, x - sx), far = Math.max(W, H) * 1.3;
          arrow = { sx: sx, sy: sy, hit: 0, ex: sx + Math.cos(a) * far, ey: sy + Math.sin(a) * far, p: 0, T: 0.45 };
          if (A.fail(A.l.fail)) dead = 2;
        }
      },
      boom: function () { var b = bow(); arrow = null; met = { x: W * 1.1, y: T - 20, r: Math.max(16, 9 * u), vx: 0, vy: 0 }; met.vx = (b[0] - met.x) / 0.7; met.vy = (b[1] - met.y) / 0.7; },
      dbg: function () { return { x: tg.x, y: tg.yy, ready: !arrow && !stuck && tg.in >= 1 }; },
      win: function () { won = 0.001; }
    };
    function arrowPath(c, x0, y0) { // carbon shaft, glowing energy tip, red fletching
      c.strokeStyle = 'rgba(56,189,248,.35)'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0 - 20, y0); c.lineTo(x0 + 4, y0); c.stroke();
      c.strokeStyle = '#E2E8F0'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x0 - 26, y0); c.lineTo(x0 + 2, y0); c.stroke();
      c.strokeStyle = '#475569'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 - 26, y0 + 0.7); c.lineTo(x0 + 2, y0 + 0.7); c.stroke();
      c.fillStyle = '#E0F2FE'; c.beginPath(); c.moveTo(x0 + 8, y0); c.lineTo(x0, y0 - 4); c.lineTo(x0 + 1.5, y0); c.lineTo(x0, y0 + 4); c.closePath(); c.fill();
      c.fillStyle = 'rgba(125,211,252,.5)'; c.beginPath(); c.arc(x0 + 4, y0, 4.5, 0, TAU); c.fill();
      c.fillStyle = '#F43F5E'; c.beginPath(); c.moveTo(x0 - 20, y0); c.lineTo(x0 - 31, y0 - 5); c.lineTo(x0 - 27, y0); c.lineTo(x0 - 31, y0 + 5); c.closePath(); c.fill();
    }
  }, 'tap', 0.6);

  /* ================================================================== 2. FRUIT SLICER — swipe the space fruits, never a bomb */
  boot('slicer', function (A) {
    var W, H, u, dpr, T, bg, fs = [], bombS, ob = [], halves = [], trail = [], down = false, spT = 0, miss = 0, nova = null, t = 0, gv = 0, FR = 0;
    var JUICE = ['#4ADE80', '#F472B6', '#FBBF24', '#67E8F9'];
    function fruitSprite(k, r) {
      return mkc(r * 2 + 4, r * 2 + 4, dpr, function (c) {
        var x = r + 2;
        if (k === 0) { // star-melon: green planet with stripes
          circ(c, x, x, r, gl(c, x, x, r, ['#D9F99D', '#4ADE80', '#15803D', '#052E16']));
          c.strokeStyle = 'rgba(5,46,22,.45)'; c.lineWidth = r * 0.12;
          for (var i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(x + i * r * 0.45, x, r * 0.18, r * 0.92, 0, 0, TAU); c.stroke(); }
        } else if (k === 1) { // plasma berry
          circ(c, x, x, r, gl(c, x, x, r, ['#FCE7F3', '#F472B6', '#BE185D', '#500724']));
          c.fillStyle = 'rgba(255,255,255,.55)'; for (var j = 0; j < 9; j++) { var a = j * 2.4, d = r * (0.25 + (j % 3) * 0.2); c.beginPath(); c.ellipse(x + Math.cos(a) * d, x + Math.sin(a) * d, r * 0.05, r * 0.09, a, 0, TAU); c.fill(); }
          c.fillStyle = '#22C55E'; c.beginPath(); c.ellipse(x, x - r * 0.95, r * 0.28, r * 0.12, 0, 0, TAU); c.fill();
        } else if (k === 2) { // golden orb with a ring
          circ(c, x, x, r * 0.86, gl(c, x, x, r * 0.86, ['#FFF7D6', '#FBBF24', '#B45309', '#451A03']));
          c.strokeStyle = 'rgba(253,230,138,.9)'; c.lineWidth = r * 0.1; c.beginPath(); c.ellipse(x, x, r * 1.0, r * 0.3, -0.35, 0.15, Math.PI - 0.15); c.stroke();
        } else { // ice crystal (hexagon gem)
          c.beginPath(); for (var h = 0; h < 6; h++) { var b = h / 6 * TAU + Math.PI / 6; c.lineTo(x + Math.cos(b) * r, x + Math.sin(b) * r); } c.closePath();
          c.fillStyle = gl(c, x, x, r, ['#ECFEFF', '#67E8F9', '#0891B2', '#164E63']); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, x - r); c.lineTo(x, x + r); c.moveTo(x - r * 0.86, x - r * 0.5); c.lineTo(x + r * 0.86, x + r * 0.5); c.stroke();
        }
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x - r * 0.38, x - r * 0.42, r * 0.28, r * 0.13, -0.7, 0, TAU); c.fill();
      });
    }
    function spawn(live, bombOk) {
      var lv = A.lv(), r = FR * rnd(0.9, 1.1), bomb = bombOk && Math.random() < 0.12 + 0.12 * lv;
      var g = live ? gv * (0.85 + 0.6 * lv) : gv * 0.8; // v2812: the fruits fly faster as the round goes on
      var x0 = rnd(0.12, 0.88) * W, top = Math.max(T + r, H * 0.12), peak = rnd(top, Math.max(top + 1, H * 0.45));
      var vy = -Math.sqrt(2 * g * (H + r - peak)), tp = -vy / g, xt = rnd(0.25, 0.75) * W;
      ob.push({ x: x0, y: H + r, px: x0, py: H + r, vx: (xt - x0) / tp * 0.7, vy: vy, g: g, r: r, k: bomb ? -1 : (Math.random() * 4) | 0, rot: rnd(0, TAU), vr: rnd(-3, 3), live: live });
      return bomb;
    }
    // v2812 (owner: "some fruits can't be cut") — a fruit is cut when the blade segment passes within its DRAWN radius
    // plus a generous margin, tested at its position now AND one frame ago (fast fruits never slip between two moves).
    // Bombs keep a tighter radius: a near miss never kills.
    function d2(cx, cy, x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy, k = L2 ? clamp(((cx - x1) * dx + (cy - y1) * dy) / L2, 0, 1) : 0;
      var px = x1 + dx * k - cx, py = y1 + dy * k - cy;
      return px * px + py * py;
    }
    function segHit(o, x1, y1, x2, y2) {
      var R = o.k < 0 ? o.r * 0.8 : o.r * 1.1 + Math.max(10, o.r * 0.35), R2 = R * R;
      if (d2(o.x, o.y, x1, y1, x2, y2) < R2 || d2(o.px, o.py, x1, y1, x2, y2) < R2) return true;
      return o.k >= 0 && d2((o.x + o.px) / 2, (o.y + o.py) / 2, x1, y1, x2, y2) < R2;
    }
    // test every live fruit against the blade segments drawn during the last ~90 ms
    function sweep(fromI) {
      var now = performance.now(), live = A.live() || (A.idle && A.idle());
      for (var j = Math.max(1, fromI || 1); j < trail.length; j++) {
        var p = trail[j - 1], q = trail[j];
        if (now - q[2] > 90 || q[3]) continue; // q[3]: start of a new stroke (no segment across two strokes)
        var a = Math.atan2(q[1] - p[1], q[0] - p[0]);
        for (var i = ob.length - 1; i >= 0; i--) {
          var o = ob[i];
          if (!segHit(o, p[0], p[1], q[0], q[1])) continue;
          if (o.k < 0) { if (A.live() && A.fail(A.l.fail)) { A.explode(o.x, o.y, 1.4); ob.splice(i, 1); } return; }
          if (!live && o.live) continue;
          ob.splice(i, 1); cut(o, a);
        }
      }
    }
    var cuts = 0;
    function cut(o, a) {
      if (o.k < 0) return;
      cuts++;
      var cut0 = a - o.rot;
      for (var s = 0; s < 2; s++) {
        var n = s ? 1 : -1, sp = 90 + Math.random() * 40;
        halves.push({ x: o.x, y: o.y, vx: o.vx * 0.6 + Math.cos(a + Math.PI / 2) * sp * n, vy: o.vy * 0.4 + Math.sin(a + Math.PI / 2) * sp * n, rot: o.rot, ca: cut0, side: s, vr: o.vr + n * 2.5, k: o.k, r: o.r, t: 0 });
      }
      A.burst(o.x, o.y, 14, [JUICE[o.k], '#FFFFFF', JUICE[o.k]], 220, 0.55, 3.2);
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top; gv = H * 1.15; FR = Math.max(15, 7.2 * u);
        bg = bgSprite(W, H, dpr, [[0.5, 0.15, 0.55, 'rgba(139,92,246,.32)'], [0.1, 0.9, 0.45, 'rgba(34,197,94,.12)'], [0.95, 0.8, 0.4, 'rgba(236,72,153,.16)']], A.lite ? 40 : 100);
        fs = [0, 1, 2, 3].map(function (k) { return fruitSprite(k, FR * 1.1); });
        var r = FR * 1.1;
        bombS = mkc(r * 2 + 8, r * 2 + 8, dpr, function (c) {
          var x = r + 4;
          c.fillStyle = '#4C1D95'; for (var i = 0; i < 8; i++) { var a = i / 8 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a - 0.2) * r * 0.8, x + Math.sin(a - 0.2) * r * 0.8); c.lineTo(x + Math.cos(a) * (r + 3), x + Math.sin(a) * (r + 3)); c.lineTo(x + Math.cos(a + 0.2) * r * 0.8, x + Math.sin(a + 0.2) * r * 0.8); c.fill(); }
          circ(c, x, x, r * 0.86, gl(c, x, x, r * 0.86, ['#6B7280', '#27203F', '#0B0614']));
          circ(c, x, x, r * 0.34, gl(c, x, x, r * 0.34, ['#FFE4E6', '#F43F5E', '#7F1D1D']));
          c.strokeStyle = '#F43F5E'; c.lineWidth = 2; c.beginPath(); c.arc(x, x, r * 0.56, 0, TAU); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x - r * 0.35, x - r * 0.42, r * 0.22, r * 0.1, -0.7, 0, TAU); c.fill();
        });
      },
      reset: function (live) { ob = []; halves = []; trail = []; miss = 0; nova = null; spT = live ? 0.6 : 0.4; },
      step: function (dt, live) {
        t += dt;
        var lv = A.lv(), playing = A.live();
        if (!nova) {
          spT -= dt;
          if (spT <= 0) {
            if (live) {
              spT = rnd(1.0, 1.35) - 0.45 * lv;
              var n = 1 + (Math.random() < 0.3 + 0.4 * lv ? 1 : 0) + (Math.random() < 0.12 + 0.3 * lv ? 1 : 0), bombs = 0;
              for (var i = 0; i < n; i++) if (spawn(true, t > 0 && bombs < 1 && i < n - 1 + (n === 1 ? 0 : 1) && A.lv() > 0.04)) bombs++;
            } else { spT = 1.4; spawn(false, false); }
          }
        }
        for (i = ob.length - 1; i >= 0; i--) {
          var o = ob[i]; o.px = o.x; o.py = o.y; o.vy += (o.g || gv) * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
          if (o.y > H + o.r * 1.5 && o.vy > 0) {
            ob.splice(i, 1);
            if (o.k >= 0 && o.live && playing) { miss++; A.ring(clamp(o.x, 20, W - 20), H - 6, 40, '#F43F5E'); if (miss >= 3) A.fail(A.l.late); }
          }
        }
        for (i = halves.length - 1; i >= 0; i--) { var hh = halves[i]; hh.t += dt; hh.vy += gv * dt; hh.x += hh.vx * dt; hh.y += hh.vy * dt; hh.rot += hh.vr * dt; if (hh.y > H + hh.r * 2) halves.splice(i, 1); }
        var now = performance.now();
        while (trail.length && now - trail[0][2] > 140) trail.shift();
        if (trail.length > 1 && !nova) sweep(1); // fruits that fly into the fresh blade line are cut too
        if (nova) {
          nova.vy += gv * dt; nova.y += nova.vy * dt;
          if (!nova.hit && nova.vy >= 0) {
            nova.hit = 1; A.explode(nova.x, nova.y, 2.6); A.flash(1);
            for (i = 0; i < ob.length; i++) A.burst(ob[i].x, ob[i].y, 6, ['#FFF7ED', '#FB923C'], 160, 0.5, 3);
            ob = [];
          }
          if (nova.hit) nova = null;
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, o, s;
        for (i = 0; i < halves.length; i++) {
          var h = halves[i], img = fs[h.k], r = h.r * 1.1;
          c.save(); c.globalAlpha = Math.max(0, 1 - h.t * 0.8); c.translate(h.x, h.y); c.rotate(h.rot + h.ca);
          c.beginPath(); c.rect(-r - 4, h.side ? 0 : -r - 4, r * 2 + 8, r + 4); c.clip();
          c.rotate(-h.ca); c.drawImage(img, -r - 2, -r - 2, r * 2 + 4, r * 2 + 4);
          c.restore();
        }
        c.globalAlpha = 1;
        for (i = 0; i < ob.length; i++) {
          o = ob[i]; s = o.r * 1.1; c.save(); c.translate(o.x, o.y); c.rotate(o.rot);
          if (o.k < 0) { c.drawImage(bombS, -s - 4, -s - 4, s * 2 + 8, s * 2 + 8); c.restore(); var fl = 0.6 + 0.4 * Math.sin(t * 20 + i); circ(c, o.x + Math.cos(o.rot - 1.2) * s * 0.95, o.y + Math.sin(o.rot - 1.2) * s * 0.95, 3 + 2 * fl, 'rgba(253,186,116,' + fl.toFixed(2) + ')'); }
          else { c.drawImage(fs[o.k], -s - 2, -s - 2, s * 2 + 4, s * 2 + 4); c.restore(); }
        }
        if (nova) { var nr = nova.r; c.save(); c.translate(nova.x, nova.y); c.rotate(t * 2); c.drawImage(bombS, -nr - 4, -nr - 4, nr * 2 + 8, nr * 2 + 8); c.restore(); }
        // blade trail
        if (trail.length > 1) {
          c.lineCap = 'round'; c.lineJoin = 'round';
          c.strokeStyle = 'rgba(167,139,250,.45)'; c.lineWidth = 9; c.beginPath(); c.moveTo(trail[0][0], trail[0][1]); for (i = 1; i < trail.length; i++) { if (trail[i][3]) c.moveTo(trail[i][0], trail[i][1]); else c.lineTo(trail[i][0], trail[i][1]); } c.stroke();
          c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.stroke();
        }
        // misses: 3 little crosses (top-right)
        if (A.live() || miss) {
          for (i = 0; i < 3; i++) {
            var mx = W - 18 - i * 20, my = T + 4; c.strokeStyle = i < miss ? '#F43F5E' : 'rgba(255,255,255,.25)'; c.lineWidth = 3.4; c.lineCap = 'round';
            c.beginPath(); c.moveTo(mx - 6, my - 6); c.lineTo(mx + 6, my + 6); c.moveTo(mx + 6, my - 6); c.lineTo(mx - 6, my + 6); c.stroke();
          }
        }
      },
      down: function (x, y) { down = true; trail.push([x, y, performance.now(), 1]); if (trail.length > 24) trail.shift(); },
      move: function (x, y) {
        if (!down || nova) return;
        var p = trail[trail.length - 1], now = performance.now();
        if (!p) { trail.push([x, y, now, 1]); return; }
        if (Math.abs(x - p[0]) + Math.abs(y - p[1]) < 2) return;
        trail.push([x, y, now]); if (trail.length > 24) trail.shift();
        sweep(trail.length - 1); // the new segment, at once
      },
      practice: true,
      dbg: function () { return { cuts: cuts, miss: miss, ob: ob.map(function (o) { return { x: o.x, y: o.y, vx: o.vx, vy: o.vy, g: o.g || gv, r: o.r, k: o.k }; }) }; }, // read-only, for the touch tests
      up: function () { down = false; },
      boom: function () { down = false; var r = FR * 2.2; nova = { x: W / 2, y: H + r, r: r, vy: -Math.sqrt(2 * gv * (H * 0.55)) }; },
      win: function () { for (var i = 0; i < ob.length; i++) if (ob[i].k >= 0) A.burst(ob[i].x, ob[i].y, 6, ['#FDE68A', '#FFFFFF'], 120, 0.5, 2.6); ob = ob.filter(function (o) { return o.k < 0; }); }
    };
  }, 'swipe', 0.5);

  /* ================================================================== 3. CHICKEN ROAD — tap to hop lane by lane between the ships */
  boot('chicken', function (A) {
    var W, H, u, dpr, T, bg, rowH, sh, cw, ch, ckS, stripS, laneS, shipS = [], lanes = {}, j = 0, hop = null, queued = false, cam = 0, tmr = 0, lim = 4, dead = 0, fall = 0, comet = null, won = 0, t = 0;
    var SH = [[0.9, 0.5], [1.25, 0.4], [1.7, 0.48]]; // ship kinds: length × rowH, height × rowH
    function Y(wy) { return H * 0.76 - (wy - cam); }
    function mkLane(i) {
      var lv = A.lv(), dir = Math.random() < 0.5 ? 1 : -1, v = W * rnd(0.2, 0.32) * (1 + 0.75 * lv) * (i === 0 ? 0.8 : 1);
      var L = { dir: dir, v: v, ships: [], gap: 0 };
      var x = dir > 0 ? W * 1.2 : -W * 0.2;
      while (dir > 0 ? x > -W * 0.25 : x < W * 1.25) { var s = newShip(L); s.x = x - dir * s.l / 2; L.ships.push(s); x -= dir * (s.l + gap(L)); }
      L.gap = gap(L);
      return L;
    }
    function gap(L) { return Math.max(cw * 2.4 + L.v * 0.45, W * 0.2) * rnd(1, 2.4); }
    function newShip() { var k = Math.random() < 0.45 ? 0 : Math.random() < 0.6 ? 1 : 2; return { k: k, l: SH[k][0] * rowH, x: 0 }; }
    function lane(i) { return lanes[i] || (lanes[i] = mkLane(i)); }
    // v2860 (owner: "amateur") — ONLY the drawing changed (same lanes, speeds, hit test): detailed ships with lit windows and
    // engine glows, a feathered hen in a glass helmet with stand / crouch / jump poses, metal walkways with hazard stripes and lights.
    function shipSprite(k) {
      var w = SH[k][0] * rowH, h = SH[k][1] * rowH;
      return mkc(w, h, dpr, function (c) { // all face right
        var i;
        if (k === 0) { // flying saucer: metal disc, light ring, glass dome with a little pilot
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(w / 2, h * 0.86, w * 0.4, h * 0.08, 0, 0, TAU); c.fill();
          c.fillStyle = gl(c, w * 0.5, h * 0.3, w * 0.2, ['#F0FDFF', '#67E8F9', '#0E7490']); c.beginPath(); c.ellipse(w / 2, h * 0.44, w * 0.2, h * 0.32, 0, Math.PI, 0); c.fill();
          c.fillStyle = '#4ADE80'; c.beginPath(); c.arc(w / 2, h * 0.36, h * 0.09, 0, TAU); c.fill(); c.fillStyle = '#052E16'; c.fillRect(w / 2 - h * 0.05, h * 0.33, h * 0.03, h * 0.04); c.fillRect(w / 2 + h * 0.02, h * 0.33, h * 0.03, h * 0.04);
          c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(1, h * 0.03); c.beginPath(); c.ellipse(w / 2, h * 0.44, w * 0.16, h * 0.26, 0, Math.PI * 1.15, Math.PI * 1.4); c.stroke();
          var dg = c.createLinearGradient(0, h * 0.42, 0, h * 0.78); dg.addColorStop(0, '#F1F5F9'); dg.addColorStop(0.45, '#94A3B8'); dg.addColorStop(1, '#334155');
          c.fillStyle = dg; c.beginPath(); c.ellipse(w / 2, h * 0.58, w * 0.49, h * 0.19, 0, 0, TAU); c.fill();
          c.fillStyle = '#1E293B'; c.beginPath(); c.ellipse(w / 2, h * 0.66, w * 0.3, h * 0.07, 0, 0, TAU); c.fill();
          for (i = 0; i < 7; i++) { var lx = w * (0.14 + i * 0.12), on = i % 2; circ(c, lx, h * 0.6, h * 0.07, on ? 'rgba(250,204,21,.35)' : 'rgba(244,114,182,.35)'); circ(c, lx, h * 0.6, h * 0.035, on ? '#FDE68A' : '#F9A8D4'); }
        } else if (k === 1) { // shuttle: white hull, red fins, cockpit windows, nozzle
          var g = c.createLinearGradient(0, h * 0.22, 0, h * 0.8); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, '#E2E8F0'); g.addColorStop(1, '#475569');
          c.fillStyle = '#B91C1C'; c.beginPath(); c.moveTo(w * 0.14, h * 0.26); c.lineTo(w * 0.36, h * 0.26); c.lineTo(w * 0.2, 0); c.lineTo(w * 0.08, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(w * 0.14, h * 0.74); c.lineTo(w * 0.36, h * 0.74); c.lineTo(w * 0.2, h); c.lineTo(w * 0.08, h); c.closePath(); c.fill();
          c.fillStyle = '#334155'; c.fillRect(0, h * 0.34, w * 0.1, h * 0.32);
          c.fillStyle = g; c.beginPath(); c.moveTo(w * 0.08, h * 0.24); c.lineTo(w * 0.66, h * 0.24); c.bezierCurveTo(w * 0.9, h * 0.26, w, h * 0.42, w, h * 0.5); c.bezierCurveTo(w, h * 0.58, w * 0.9, h * 0.74, w * 0.66, h * 0.76); c.lineTo(w * 0.08, h * 0.76); c.closePath(); c.fill();
          c.fillStyle = '#DC2626'; c.fillRect(w * 0.12, h * 0.46, w * 0.52, h * 0.06);
          c.fillStyle = '#0F172A'; c.beginPath(); c.moveTo(w * 0.74, h * 0.33); c.quadraticCurveTo(w * 0.9, h * 0.36, w * 0.94, h * 0.46); c.lineTo(w * 0.74, h * 0.46); c.closePath(); c.fill();
          c.fillStyle = 'rgba(125,211,252,.8)'; c.beginPath(); c.moveTo(w * 0.76, h * 0.35); c.quadraticCurveTo(w * 0.88, h * 0.37, w * 0.91, h * 0.44); c.lineTo(w * 0.76, h * 0.44); c.closePath(); c.fill();
          for (i = 0; i < 5; i++) circ(c, w * (0.2 + i * 0.1), h * 0.36, h * 0.035, '#38BDF8');
          c.strokeStyle = 'rgba(15,23,42,.25)'; c.lineWidth = 1; [0.3, 0.5].forEach(function (x) { c.beginPath(); c.moveTo(w * x, h * 0.25); c.lineTo(w * x, h * 0.75); c.stroke(); });
        } else { // cargo hauler: cockpit, 3 container modules, side engines
          c.fillStyle = '#334155'; c.fillRect(w * 0.02, h * 0.12, w * 0.1, h * 0.22); c.fillRect(w * 0.02, h * 0.66, w * 0.1, h * 0.22);
          c.fillStyle = gl(c, w * 0.3, h * 0.3, w * 0.5, ['#E2E8F0', '#64748B', '#1E293B']); c.fillRect(w * 0.08, h * 0.3, w * 0.74, h * 0.4);
          ['#F97316', '#0EA5E9', '#A855F7'].forEach(function (col, q) { var x0 = w * (0.1 + q * 0.21); c.fillStyle = col; c.fillRect(x0, h * 0.18, w * 0.19, h * 0.64); c.fillStyle = 'rgba(0,0,0,.25)'; for (var r2 = 1; r2 < 5; r2++) c.fillRect(x0 + w * 0.19 * r2 / 5, h * 0.2, 1.2, h * 0.6); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x0, h * 0.18, w * 0.19, h * 0.05); });
          c.fillStyle = gl(c, w * 0.85, h * 0.45, h * 0.35, ['#F1F5F9', '#94A3B8', '#334155']); c.beginPath(); c.moveTo(w * 0.74, h * 0.24); c.lineTo(w * 0.86, h * 0.24); c.quadraticCurveTo(w, h * 0.5, w * 0.86, h * 0.76); c.lineTo(w * 0.74, h * 0.76); c.closePath(); c.fill();
          c.fillStyle = 'rgba(125,211,252,.9)'; c.beginPath(); c.moveTo(w * 0.86, h * 0.36); c.quadraticCurveTo(w * 0.95, h * 0.5, w * 0.86, h * 0.64); c.lineTo(w * 0.82, h * 0.64); c.lineTo(w * 0.82, h * 0.36); c.closePath(); c.fill();
          circ(c, w * 0.08, h * 0.23, h * 0.04, '#F43F5E'); circ(c, w * 0.08, h * 0.77, h * 0.04, '#22C55E');
        }
      });
    }
    // the hen: front view, layered feathers, wings, comb and wattle, scaly legs, in a glass helmet. f: 0 stand, 1 crouch, 2 jump
    function henSprite(f) {
      return mkc(cw, ch, dpr, function (c) {
        var x = cw / 2, by = ch * (f === 1 ? 0.67 : f === 2 ? 0.6 : 0.64), sq = f === 1 ? 1.08 : f === 2 ? 0.94 : 1, i;
        // legs + feet
        c.strokeStyle = '#F59E0B'; c.lineWidth = Math.max(1.5, cw * 0.06); c.lineCap = 'round';
        [-1, 1].forEach(function (s) {
          var hx = x + s * cw * 0.12, fy = f === 2 ? ch * 0.9 : ch * 0.97, ky = f === 1 ? ch * 0.88 : f === 2 ? ch * 0.86 : ch * 0.9, kx = hx + s * (f === 1 ? cw * 0.08 : f === 2 ? -cw * 0.03 : 0);
          c.beginPath(); c.moveTo(hx, by + ch * 0.18); c.lineTo(kx, ky); c.lineTo(hx, fy); c.stroke();
          c.lineWidth = Math.max(1, cw * 0.035); for (var t2 = -1; t2 <= 1; t2++) { c.beginPath(); c.moveTo(hx, fy); c.lineTo(hx + t2 * cw * 0.07 + s * cw * 0.02, fy + ch * 0.02); c.stroke(); } c.lineWidth = Math.max(1.5, cw * 0.06);
        });
        // tail feathers behind
        c.fillStyle = '#E2E8F0'; for (i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(x + i * cw * 0.09, by - ch * 0.16, cw * 0.07, ch * 0.14, i * 0.35, 0, TAU); c.fill(); }
        // body
        c.fillStyle = gl(c, x, by, cw * 0.42, ['#FFFFFF', '#FBF7EF', '#E2D7C3', '#B8A88E']); c.beginPath(); c.ellipse(x, by, cw * 0.38 * sq, ch * 0.27 / sq, 0, 0, TAU); c.fill();
        c.save(); c.beginPath(); c.ellipse(x, by, cw * 0.38 * sq, ch * 0.27 / sq, 0, 0, TAU); c.clip();
        c.strokeStyle = 'rgba(150,130,100,.35)'; c.lineWidth = Math.max(0.7, cw * 0.015);
        for (var r = 0; r < 5; r++) for (i = 0; i < 6; i++) { var fx = x - cw * 0.3 + i * cw * 0.12 + (r % 2) * cw * 0.06, fy2 = by - ch * 0.1 + r * ch * 0.07; c.beginPath(); c.arc(fx, fy2, cw * 0.055, 0.2, Math.PI - 0.2); c.stroke(); }
        c.restore();
        // wings (raised when jumping)
        [-1, 1].forEach(function (s) {
          c.save(); c.translate(x + s * cw * 0.32 * sq, by - ch * 0.02); c.rotate(s * (f === 2 ? -0.9 : f === 1 ? 0.25 : 0.1));
          c.fillStyle = gl(c, 0, 0, cw * 0.2, ['#FFFFFF', '#F1EBDD', '#C9B99C']); c.beginPath(); c.ellipse(s * cw * 0.04, ch * 0.04, cw * 0.12, ch * 0.17, s * 0.2, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(150,130,100,.45)'; c.lineWidth = Math.max(0.7, cw * 0.015); for (var q = 0; q < 3; q++) { c.beginPath(); c.moveTo(s * cw * 0.0, ch * (0.0 + q * 0.06)); c.lineTo(s * cw * 0.12, ch * (0.1 + q * 0.06)); c.stroke(); }
          c.restore();
        });
        // head: comb, beak, wattle, eyes
        var hy = by - ch * 0.3, hr = cw * 0.2;
        c.fillStyle = gl(c, x, hy - hr * 1.0, hr, ['#FCA5A5', '#EF4444', '#991B1B']); [[-0.45, 1.0, 0.36], [0, 1.25, 0.42], [0.45, 1.05, 0.34]].forEach(function (q) { c.beginPath(); c.arc(x + q[0] * hr, hy - q[1] * hr, q[2] * hr, 0, TAU); c.fill(); });
        circ(c, x, hy, hr, gl(c, x, hy, hr, ['#FFFFFF', '#F8FAFC', '#D6CFC0']));
        c.fillStyle = '#DC2626'; c.beginPath(); c.ellipse(x, hy + hr * 0.75, hr * 0.18, hr * 0.32, 0, 0, TAU); c.fill();
        c.fillStyle = '#F59E0B'; c.beginPath(); c.moveTo(x - hr * 0.26, hy + hr * 0.18); c.lineTo(x + hr * 0.26, hy + hr * 0.18); c.lineTo(x, hy + hr * 0.62); c.closePath(); c.fill();
        c.fillStyle = '#B45309'; c.beginPath(); c.moveTo(x - hr * 0.22, hy + hr * 0.3); c.lineTo(x + hr * 0.22, hy + hr * 0.3); c.lineTo(x, hy + hr * 0.62); c.closePath(); c.fill();
        [-1, 1].forEach(function (s) { circ(c, x + s * hr * 0.42, hy - hr * 0.08, hr * 0.17, '#FDE68A'); circ(c, x + s * hr * 0.42, hy - hr * 0.08, hr * 0.11, '#1C1917'); circ(c, x + s * hr * 0.38, hy - hr * 0.13, hr * 0.045, '#fff'); });
        // glass helmet with a metal collar and reflections
        var hc = hy - hr * 0.15, R = cw * 0.36;
        c.fillStyle = 'rgba(186,230,253,.12)'; c.beginPath(); c.arc(x, hc, R, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(186,230,253,.85)'; c.lineWidth = Math.max(1.5, cw * 0.03); c.beginPath(); c.arc(x, hc, R, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1.5, cw * 0.035); c.beginPath(); c.arc(x, hc, R * 0.82, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x, hc, R * 0.82, Math.PI * 1.55, Math.PI * 1.62); c.stroke();
        c.fillStyle = lg2c(c, x - R, 0, x + R, 0, ['#CBD5E1', '#64748B', '#334155']); c.beginPath(); c.ellipse(x, hc + R * 0.92, R * 0.66, R * 0.14, 0, 0, TAU); c.fill();
      });
    }
    function lg2c(c, x0, y0, x1, y1, st) { var g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(function (s2, i) { g.addColorStop(i / (st.length - 1), s2); }); return g; }
    function cy() { return hop ? lerpY() : j * rowH; }
    function lerpY() { return (j + ease(hop.p)) * rowH; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        rowH = Math.max(52, Math.min(H / 4.4, W * 0.34)); sh = rowH * 0.46; cw = Math.min(rowH * 0.42, W * 0.15); ch = cw * 1.15; // the chicken fits on its platform
        bg = bgSprite(W, H, dpr, [[0.8, 0.2, 0.5, 'rgba(139,92,246,.28)'], [0.15, 0.7, 0.45, 'rgba(251,191,36,.10)']], A.lite ? 40 : 90);
        stripS = mkc(W, sh, dpr, function (c) { // a metal walkway: panels, rivets, hazard stripes, running lights
          var g = c.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, '#9CA3C4'); g.addColorStop(0.18, '#6B7194'); g.addColorStop(0.7, '#3E4266'); g.addColorStop(1, '#23253F');
          c.fillStyle = g; c.fillRect(0, 0, W, sh);
          for (var x = 0; x < W; x += 64) { c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x, sh * 0.14, 1.5, sh * 0.72); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + 1.5, sh * 0.14, 1, sh * 0.72); circ(c, x + 6, sh * 0.25, 1.4, 'rgba(255,255,255,.45)'); circ(c, x + 6, sh * 0.75, 1.4, 'rgba(255,255,255,.45)'); }
          c.save(); c.beginPath(); c.rect(0, 0, W, sh * 0.12); c.clip(); for (x = -20; x < W + 20; x += 16) { c.fillStyle = '#FBBF24'; c.beginPath(); c.moveTo(x, sh * 0.12); c.lineTo(x + 8, sh * 0.12); c.lineTo(x + 14, 0); c.lineTo(x + 6, 0); c.closePath(); c.fill(); } c.restore();
          c.fillStyle = '#111827'; c.fillRect(0, sh * 0.12, W, 1.5);
          for (x = 18; x < W; x += 48) { circ(c, x, sh * 0.88, 3, 'rgba(56,189,248,.35)'); circ(c, x, sh * 0.88, 1.5, '#BAE6FD'); }
          c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, sh - 2, W, 2);
        });
        ckS = [henSprite(0), henSprite(1), henSprite(2)];
        shipS = [0, 1, 2].map(shipSprite);
        var lt = rowH - sh;
        laneS = mkc(W + 28, lt, dpr, function (c) {
          c.fillStyle = 'rgba(8,5,26,.55)'; c.fillRect(0, 0, W + 28, lt);
          c.fillStyle = 'rgba(167,139,250,.35)'; for (var x = 0; x < W + 28; x += 28) c.fillRect(x, lt / 2 - 1, 14, 2);
        });
        lanes = {};
      },
      reset: function () { lanes = {}; j = 0; hop = null; queued = false; cam = 0; dead = 0; fall = 0; comet = null; won = 0; lim = 5; tmr = lim; },
      step: function (dt, live) {
        t += dt;
        var lo = Math.floor((cam - H * 0.3) / rowH) - 1, hi = Math.ceil((cam + H) / rowH) + 1, i, k, L, s;
        for (k in lanes) if (+k < lo - 2) delete lanes[k];
        for (i = Math.max(0, lo); i <= hi; i++) {
          L = lane(i);
          for (k = L.ships.length - 1; k >= 0; k--) { s = L.ships[k]; s.x += L.dir * L.v * dt; if (L.dir > 0 ? s.x - s.l / 2 > W + 10 : s.x + s.l / 2 < -10) L.ships.splice(k, 1); }
          var lst = L.ships[L.ships.length - 1], edge = L.dir > 0 ? -10 : W + 10;
          if (!lst || (L.dir > 0 ? (lst.x - lst.l / 2) - edge : edge - (lst.x + lst.l / 2)) >= L.gap) { s = newShip(); s.x = edge - L.dir * s.l / 2; L.ships.push(s); L.gap = gap(L); }
        }
        if (hop) {
          hop.p += dt / 0.3;
          var wy = lerpY(), L0 = lane(j);
          if (live && !dead && wy > j * rowH + sh * 0.5 && wy < (j + 1) * rowH - sh * 0.5) {
            for (k = 0; k < L0.ships.length; k++) { s = L0.ships[k]; if (Math.abs(s.x - W / 2) < s.l * 0.45 + cw * 0.28) { if (A.fail(A.l.fail)) { dead = 1; A.explode(W / 2, Y(wy) - ch * 0.4, 1.2); } break; } }
          }
          if (hop.p >= 1 && !dead) {
            hop = null; j++; tmr = lim = Math.max(2.6, 5 - 2 * A.lv());
            A.burst(W / 2, Y(j * rowH), 6, ['#C4B5FD', '#FDE68A'], 60, 0.4, 2.4);
            if (queued) { queued = false; hop = { p: 0 }; }
          }
        } else if (live && !dead && !comet && A.live()) {
          tmr -= dt;
          if (tmr <= 0 && A.fail(A.l.late)) { dead = 2; fall = 0.001; A.burst(W / 2, Y(j * rowH), 18, ['#6D5BA8', '#2C2156', '#C4B5FD'], 120, 0.8, 4); }
        }
        if (fall) fall += dt;
        var target = (hop ? lerpY() : j * rowH);
        cam += (target - cam) * Math.min(1, dt * 5);
        if (comet) {
          comet.x += comet.v * dt;
          if (!comet.hit && comet.x >= W / 2 - cw * 0.3) { comet.hit = 1; dead = 1; A.explode(W / 2, comet.y, 1.8); }
          if (comet.x > W * 1.6) comet = null;
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var lo = Math.floor((cam - H * 0.3) / rowH) - 1, hi = Math.ceil((cam + H) / rowH) + 1, i, k, s, L, y;
        for (i = lo; i <= hi; i++) {
          // lane i lies between strip i and strip i+1
          var y0 = Y(i * rowH + sh / 2), y1 = Y((i + 1) * rowH - sh / 2), ym = (y0 + y1) / 2;
          if (y0 < -rowH || y1 > H + rowH) continue;
          if (i < 0) { c.fillStyle = '#1C1440'; c.fillRect(0, y1, W, y0 - y1); continue; } // start base below the first lane
          var o = (t * 20) % 28; // pre-drawn lane (dark band + dashes): one copy per lane, dashes drift
          c.drawImage(laneS, i % 2 ? o - 28 : -o, y1, W + 28, y0 - y1);
          L = lanes[i];
          if (L) for (k = 0; k < L.ships.length; k++) {
            s = L.ships[k]; var img = shipS[s.k], sw = s.l, shh = SH[s.k][1] * rowH;
            var ex = s.x - L.dir * sw / 2, fl = 0.8 + 0.2 * Math.sin(t * 30 + k); // engine glow behind each ship
            c.globalCompositeOperation = 'lighter';
            c.fillStyle = 'rgba(56,189,248,.35)'; c.beginPath(); c.ellipse(ex - L.dir * shh * 0.32 * fl, ym, shh * 0.42 * fl, shh * 0.14, 0, 0, TAU); c.fill();
            c.fillStyle = 'rgba(224,242,254,.8)'; c.beginPath(); c.ellipse(ex - L.dir * shh * 0.1, ym, shh * 0.16 * fl, shh * 0.06, 0, 0, TAU); c.fill();
            c.globalCompositeOperation = 'source-over';
            if (L.dir > 0) c.drawImage(img, s.x - sw / 2, ym - shh / 2, sw, shh);
            else { c.save(); c.translate(s.x, ym); c.scale(-1, 1); c.drawImage(img, -sw / 2, -shh / 2, sw, shh); c.restore(); }
          }
        }
        for (i = lo; i <= hi + 1; i++) {
          y = Y(i * rowH);
          if (y < -sh || y > H + sh) continue;
          if (i === j && fall) { c.globalAlpha = Math.max(0, 1 - fall * 2); c.drawImage(stripS, 0, y - sh / 2 + fall * 60, W, sh); c.globalAlpha = 1; }
          else c.drawImage(stripS, 0, y - sh / 2, W, sh);
        }
        if (dead !== 1) {
          var wy = hop ? lerpY() : j * rowH, arc = hop ? Math.sin(Math.PI * clamp(hop.p, 0, 1)) * rowH * 0.22 : 0;
          var jy = won ? Math.abs(Math.sin(won * 8)) * rowH * 0.18 : (!hop ? Math.abs(Math.sin(t * 3)) * 1.5 : 0);
          var cy0 = Y(wy) - ch * 0.58 - arc - jy + (fall ? fall * fall * 900 : 0);
          c.globalAlpha = fall ? Math.max(0, 1 - fall * 1.6) : 1;
          c.drawImage(ckS[hop ? (hop.p < 0.15 ? 1 : 2) : (Math.sin(t * 3) > 0.92 ? 1 : 0)], W / 2 - cw / 2, cy0, cw, ch);
          c.globalAlpha = 1;
          if (A.live() && !hop && !fall) { // platform timer above the chicken
            var kk = clamp(tmr / lim, 0, 1), rr = Math.max(7, cw * 0.17), tx = W / 2 + cw * 0.55, ty = cy0 + rr;
            circ(c, tx, ty, rr + 2, 'rgba(10,6,30,.7)');
            c.strokeStyle = kk < 0.3 ? '#F43F5E' : '#FBBF24'; c.lineWidth = 3; c.lineCap = 'round';
            c.beginPath(); c.arc(tx, ty, rr - 1, -Math.PI / 2, -Math.PI / 2 + TAU * kk); c.stroke();
          }
        }
        if (comet) meteor(c, comet.x, comet.y, comet.r, 0);
      },
      down: function () { if (dead || comet) return; if (hop) { queued = true; return; } hop = { p: 0 }; }, // a tap during a hop is kept (no lost touch)
      boom: function () { comet = { x: -W * 0.5, y: Y(cy()) - ch * 0.45, r: Math.max(18, rowH * 0.42), v: W * 2.4 }; hop = null; queued = false; },
      win: function () { won = 0.001; queued = false; }
    };
  }, 'tap', 0.42);

  /* ================================================================== 4. HAMSTER RUN — 3 lanes in a space tube, tap left / right
     v2860 (owner: "amateur") — ONLY the drawing changed (same lanes, same rows, same timing, same hit test): a real furry hamster
     seen from behind with a 6-frame gallop, inside a glossy rainbow play-tube whose rings, floor bands, sawdust and speed
     streaks rush past (faster as the multiplier climbs); toy-block walls and mousetraps; a toy-brick wall for the end.
     Every sprite is pre-drawn once per size.
     v3103 (owner: advertising video, "the hamster looks silly, a blob sliding") — DRAWING ONLY again (same lanes, rows,
     speeds, spawn rules, hit test, fail / boom / win calls): the hamster is now a RIG of pre-drawn fur parts (body, head,
     ears, hind feet with pink soles, front paws) put together each frame: an alternating scurry (feet kick back showing
     their soles, front paws reach out), body bob + squash-and-stretch, side sway, ears and cheeks bouncing behind the
     body; the cycle speeds up with the run speed. Wooden planks + side beams scroll with perspective, dust puffs from
     every kick, a soft moving shadow, a slight camera zoom / tremble at high speed, an eased hop + lean on a lane change,
     a stumble-and-fall (dizzy stars) instead of the pop, and a happy hop + confetti on a cash-out. Lite mode: fewer particles. */
  boot('hamster', function (A) {
    var W, H, u, dpr, T, bg, obS = [], hy, ny, lw, F = 5, lane = 0, hx = 0, obs = [], rowT = 0, ringP = 0, dead = false, wall = null, t = 0, won = 0, spd = 0.5, lastFree = 0;
    var ringN = 0, SD = [], wallS = null, floorG = null, fogG = null, shadeG = null, sfx = 0; // drawing only
    var HR = null, cyc = 0, lx0 = 0, vX = 0, lean = 0, vPrev = 0, PF = [], CF = [], crash = null, scrollK = 1, cfOn = 0; // drawing only (v3103)
    var TUBE = ['#F472B6', '#FB923C', '#FACC15', '#4ADE80', '#22D3EE', '#818CF8', '#C084FC'];
    var WOOD = ['#C98A4B', '#D69A5C', '#BD7E41', '#DDA567', '#C68647'];
    function P(z) { return 1 / (1 + F * z); }
    function SY(z) { return hy + (ny - hy) * P(z); }
    function SX(lx, z) { return W / 2 + lx * lw * P(z); }
    function sh(hex, k) { return D6.Rig ? D6.Rig.shade(hex, k) : hex; }
    function hsh(n) { n = (n * 2654435761) >>> 0; n ^= n >>> 13; n = (n * 1274126177) >>> 0; return (n >>> 8) / 16777216; } // stable 0..1 per plank

    /* ---- the hamster rig: fur parts drawn ONCE per size (gradients + hundreds of strands), then only drawImage each frame */
    // a furry blob: shape from fn(a) → [x, y], filled with layers, clipped strands, then soft fluff crossing the silhouette
    function fur(c, cx, cy, s, fn, o) {
      var N = 72, pts = [], i, a;
      for (i = 0; i < N; i++) pts.push(fn(i / N * TAU));
      function path() { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var j = 1; j < N; j++) c.lineTo(pts[j][0], pts[j][1]); c.closePath(); }
      var top = Infinity, bot = -Infinity; pts.forEach(function (p) { top = Math.min(top, p[1]); bot = Math.max(bot, p[1]); });
      // fluff under the silhouette (drawn first so the body edge looks soft, not cut out)
      c.lineCap = 'round';
      for (i = 0; i < N * 2; i++) {
        a = i / (N * 2) * TAU; var p = fn(a), q = fn(a + 0.02), nx = q[1] - p[1], ny2 = p[0] - q[0], nl = Math.hypot(nx, ny2) || 1; nx /= -nl; ny2 /= -nl;
        var k = (p[1] - top) / (bot - top), L = s * (0.022 + 0.022 * ((i * 7) % 5) / 4);
        if (k > o.cream) L *= 0.55; // short soft fluff on the cream underside (no comb-like fringe)
        c.strokeStyle = k > o.cream ? 'rgba(226,204,176,.6)' : (p[0] < cx && k < 0.5 ? 'rgba(214,150,84,.95)' : 'rgba(150,84,34,.95)');
        c.lineWidth = Math.max(0.8, s * (k > o.cream ? 0.022 : 0.016));
        c.beginPath(); c.moveTo(p[0] - nx * L * 0.6, p[1] - ny2 * L * 0.6); c.lineTo(p[0] + nx * L + o.flow * L * 0.3 * (p[0] < cx ? -1 : 1), p[1] + ny2 * L + L * 0.35); c.stroke();
      }
      c.save(); path(); c.clip();
      var g = c.createRadialGradient(cx - s * 0.16, top + (bot - top) * 0.28, s * 0.02, cx, cy, s * o.r);
      g.addColorStop(0, '#F6CB8A'); g.addColorStop(0.35, '#E19A4E'); g.addColorStop(0.72, '#B9692C'); g.addColorStop(1, '#7A3C14');
      c.fillStyle = g; c.fillRect(cx - s, top - s, s * 2, s * 3);
      o.layers(c, top, bot);
      // strands: flow outward + downward from the spine, dark and light hairs mixed
      var R = o.seed, n = A.lite ? o.n / 2 : o.n;
      for (i = 0; i < n; i++) {
        R = (R * 9301 + 49297) % 233280; var px = cx - s + R / 233280 * s * 2; R = (R * 9301 + 49297) % 233280; var py = top + R / 233280 * (bot - top);
        var k2 = (py - top) / (bot - top), dir = Math.atan2(py - (top - s * 0.25), (px - cx) * 1.3), L2 = s * (0.026 + 0.03 * ((i % 7) / 6));
        R = (R * 9301 + 49297) % 233280; var r3 = R / 233280;
        c.strokeStyle = k2 > o.cream ? (r3 < 0.5 ? 'rgba(255,252,245,.55)' : 'rgba(190,160,130,.35)') : (r3 < 0.55 ? 'rgba(110,52,16,.32)' : r3 < 0.85 ? 'rgba(255,224,170,.42)' : 'rgba(60,26,6,.3)');
        c.lineWidth = Math.max(0.6, s * (0.005 + 0.004 * r3));
        c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + Math.cos(dir + 0.3) * L2 * 0.6, py + Math.sin(dir + 0.3) * L2 * 0.6, px + Math.cos(dir) * L2, py + Math.sin(dir) * L2); c.stroke();
      }
      // contact shade at the bottom + soft key light top-left
      var ao = c.createLinearGradient(0, bot - (bot - top) * 0.25, 0, bot); ao.addColorStop(0, 'rgba(60,30,10,0)'); ao.addColorStop(1, 'rgba(60,30,10,.35)'); c.fillStyle = ao; c.fillRect(cx - s, top, s * 2, bot - top + 2);
      var kl = c.createRadialGradient(cx - s * 0.18, top + (bot - top) * 0.22, 0, cx - s * 0.18, top + (bot - top) * 0.22, s * 0.35); kl.addColorStop(0, 'rgba(255,246,225,.38)'); kl.addColorStop(1, 'rgba(255,246,225,0)'); c.fillStyle = kl; c.fillRect(cx - s, top, s * 2, bot - top);
      c.restore();
      // rim light on the upper-left edge
      c.strokeStyle = 'rgba(255,238,205,.5)'; c.lineWidth = Math.max(1, s * 0.012); c.beginPath();
      for (i = 0; i <= 14; i++) { var pp = fn(Math.PI * (1.05 + i / 14 * 0.42)); if (i) c.lineTo(pp[0], pp[1]); else c.moveTo(pp[0], pp[1]); } c.stroke();
    }
    function rig(s) {
      var R = {};
      // body: a pear seen from behind (wide rump at the bottom, narrower shoulders), golden back, cream flanks / underside
      R.bw = s * 1.2; R.bh = s * 1.0;
      R.body = mkc(R.bw, R.bh, dpr, function (c, w, h) {
        var cx = w / 2, cy = h * 0.53;
        fur(c, cx, cy, s, function (a) { var sa = Math.sin(a), ca = Math.cos(a); return [cx + ca * s * 0.52 * (1 - 0.16 * Math.max(0, -sa)) * (1 + 0.03 * sa), cy + sa * s * 0.42 * (sa > 0 ? 0.9 : 1)]; }, {
          r: 0.62, cream: 0.72, flow: 1, seed: 17, n: 1100,
          layers: function (c, top, bot) {
            var cr = c.createRadialGradient(cx, bot + s * 0.08, s * 0.1, cx, bot, s * 0.5); cr.addColorStop(0, 'rgba(252,244,232,1)'); cr.addColorStop(0.45, 'rgba(246,230,208,.9)'); cr.addColorStop(1, 'rgba(246,230,208,0)');
            c.fillStyle = cr; c.fillRect(cx - s, top, s * 2, bot - top + 4);
            [-1, 1].forEach(function (sd) { var q = c.createRadialGradient(cx + sd * s * 0.42, bot - s * 0.12, 0, cx + sd * s * 0.42, bot - s * 0.12, s * 0.22); q.addColorStop(0, 'rgba(250,238,220,.85)'); q.addColorStop(1, 'rgba(250,238,220,0)'); c.fillStyle = q; c.fillRect(cx - s, top, s * 2, bot - top); });
            var ds = c.createRadialGradient(cx, top + s * 0.12, 0, cx, top + s * 0.2, s * 0.32); ds.addColorStop(0, 'rgba(120,58,18,.32)'); ds.addColorStop(1, 'rgba(120,58,18,0)'); c.fillStyle = ds; c.fillRect(cx - s, top, s * 2, bot - top);
            // haunches: two rounded thighs, lit on top
            [-1, 1].forEach(function (sd) { var q = c.createRadialGradient(cx + sd * s * 0.24, bot - s * 0.3, s * 0.02, cx + sd * s * 0.24, bot - s * 0.24, s * 0.24); q.addColorStop(0, 'rgba(255,214,150,.28)'); q.addColorStop(0.7, 'rgba(255,214,150,0)'); q.addColorStop(1, 'rgba(90,40,10,.1)'); c.fillStyle = q; c.fillRect(cx - s, top, s * 2, bot - top); });
          }
        });
      });
      R.boy = R.bh * 0.53 + s * 0.42 * 0.9; // body sprite: y of its bottom
      // head (back of it, seen a little from above): cheek pouches bulge at the sides, a few whiskers poke out
      R.hw = s * 0.95; R.hh = s * 0.68;
      R.head = mkc(R.hw, R.hh, dpr, function (c, w, h) {
        var cx = w / 2, cy = h * 0.5;
        c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(0.6, s * 0.006); c.lineCap = 'round';
        [-1, 1].forEach(function (sd) { for (var i = 0; i < 4; i++) { c.beginPath(); c.moveTo(cx + sd * s * 0.3, cy + s * 0.1 + i * s * 0.015); c.quadraticCurveTo(cx + sd * s * 0.4, cy + s * 0.05 + i * s * 0.03, cx + sd * s * (0.46 - i * 0.012), cy + s * (0.02 + i * 0.05)); c.stroke(); } });
        fur(c, cx, cy, s * 0.75, function (a) { var sa = Math.sin(a), ca = Math.cos(a); return [cx + ca * s * 0.31 * (1 + 0.14 * Math.max(0, sa)), cy + sa * s * 0.25]; }, {
          r: 0.55, cream: 0.78, flow: 0.6, seed: 91, n: 420,
          layers: function (c, top, bot) {
            [-1, 1].forEach(function (sd) { var q = c.createRadialGradient(cx + sd * s * 0.28, bot - s * 0.05, 0, cx + sd * s * 0.28, bot - s * 0.05, s * 0.17); q.addColorStop(0, 'rgba(250,236,214,.95)'); q.addColorStop(1, 'rgba(250,236,214,0)'); c.fillStyle = q; c.fillRect(cx - s, top, s * 2, bot - top); });
            var cw = c.createRadialGradient(cx, top + s * 0.06, 0, cx, top + s * 0.08, s * 0.2); cw.addColorStop(0, 'rgba(110,52,16,.3)'); cw.addColorStop(1, 'rgba(110,52,16,0)'); c.fillStyle = cw; c.fillRect(cx - s, top, s * 2, bot - top);
          }
        });
      });
      // ear (back side: thin dark-grey skin with fine fur, a pink edge on the outer rim); the right ear is the mirror
      R.ew = s * 0.29; R.eh = s * 0.3; // v3195 : oreilles plus grandes (fiche du propriétaire)
      R.ear = mkc(R.ew, R.eh, dpr, function (c, w, h) {
        var cx = w / 2, cy = h * 0.48, rx = w * 0.42, ry = h * 0.44;
        // v3193 (fiche du propriétaire) : oreille ronde, bord de fourrure dorée, intérieur rose bien visible
        var g0 = c.createRadialGradient(cx - w * 0.08, cy - h * 0.1, w * 0.02, cx, cy, rx * 1.05); g0.addColorStop(0, '#F0C48E'); g0.addColorStop(1, '#B9723A');
        c.fillStyle = g0; c.beginPath(); c.ellipse(cx, cy, rx, ry, -0.15, 0, TAU); c.fill();
        var g = c.createRadialGradient(cx - w * 0.04, cy - h * 0.06, w * 0.02, cx, cy + h * 0.02, rx * 0.8); g.addColorStop(0, '#FFD3DA'); g.addColorStop(0.55, '#F2A2B0'); g.addColorStop(1, '#D9798C');
        c.fillStyle = g; c.beginPath(); c.ellipse(cx + w * 0.02, cy + h * 0.03, rx * 0.7, ry * 0.72, -0.15, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,240,235,.6)'; c.lineWidth = Math.max(0.8, w * 0.035); c.beginPath(); c.ellipse(cx + w * 0.02, cy + h * 0.03, rx * 0.62, ry * 0.64, -0.15, Math.PI * 1.1, Math.PI * 1.55); c.stroke();
        c.fillStyle = 'rgba(214,150,84,.9)'; c.beginPath(); c.ellipse(cx + w * 0.04, h * 0.9, rx * 0.8, h * 0.14, 0, 0, TAU); c.fill(); // fur at the base
      });
      // v3107 (owner: "the feet are pink blobs stuck on the fur") — real hind legs: a short furry leg (darker golden-brown,
      // fading into the rump at the top) ending in a foot that is either PLANTED (seen from behind: light fur on top, a pink
      // heel edge, flat on the ground) or KICKED BACK (sole to the camera: long pink sole, heel pad, 3 toe pads, fur edges)
      R.lw2 = s * 0.25; R.lh2 = s * 0.3;
      R.leg = mkc(R.lw2, R.lh2, dpr, function (c, w, h) {
        var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(214,150,84,0)'); g.addColorStop(0.3, '#CF904F'); g.addColorStop(1, '#A4612C');
        c.fillStyle = g; c.beginPath(); c.moveTo(w * 0.04, 0); c.lineTo(w * 0.96, 0); c.quadraticCurveTo(w * 0.92, h * 0.6, w * 0.72, h); c.lineTo(w * 0.28, h); c.quadraticCurveTo(w * 0.08, h * 0.6, w * 0.04, 0); c.fill();
        var hl = c.createLinearGradient(0, 0, w, 0); hl.addColorStop(0, 'rgba(255,220,160,.35)'); hl.addColorStop(0.45, 'rgba(255,220,160,0)'); hl.addColorStop(1, 'rgba(60,25,5,.25)'); c.fillStyle = hl; c.fill();
        c.lineCap = 'round'; c.lineWidth = Math.max(0.6, s * 0.006);
        for (var i = 0; i < 46; i++) { var px = w * (0.15 + ((i * 37) % 70) / 100), py = h * (0.2 + ((i * 53) % 78) / 100); c.strokeStyle = i % 3 ? 'rgba(90,42,12,.35)' : 'rgba(255,214,150,.35)'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + (px < w / 2 ? -1 : 1) * w * 0.05, py + h * 0.06); c.stroke(); }
      });
      R.ftw = s * 0.2; R.fth = s * 0.12;
      R.ftop = mkc(R.ftw, R.fth, dpr, function (c, w, h) { // planted foot from behind
        c.fillStyle = '#E39AA3'; c.beginPath(); c.ellipse(w / 2, h * 0.7, w * 0.4, h * 0.28, 0, 0, TAU); c.fill();
        var g = c.createLinearGradient(0, 0, 0, h * 0.8); g.addColorStop(0, '#F6E6D0'); g.addColorStop(1, '#D9BC98');
        c.fillStyle = g; c.beginPath(); c.ellipse(w / 2, h * 0.45, w * 0.44, h * 0.38, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(150,110,80,.35)'; c.lineWidth = Math.max(0.6, s * 0.005); for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(w / 2 + i * w * 0.14, h * 0.3); c.lineTo(w / 2 + i * w * 0.17, h * 0.7); c.stroke(); }
      });
      R.sw2 = s * 0.15; R.sh2 = s * 0.25;
      R.sole = mkc(R.sw2, R.sh2, dpr, function (c, w, h) { // kicked-back foot: sole to the camera, heel at the top, toes at the bottom
        c.fillStyle = '#EBD7BC'; c.beginPath(); c.ellipse(w / 2, h * 0.5, w * 0.48, h * 0.48, 0, 0, TAU); c.fill();
        var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#F3B8BC'); g.addColorStop(1, '#E48E9A');
        c.fillStyle = g; c.beginPath(); c.ellipse(w / 2, h * 0.52, w * 0.34, h * 0.42, 0, 0, TAU); c.fill();
        c.fillStyle = '#CB6E7C'; c.beginPath(); c.ellipse(w / 2, h * 0.24, w * 0.16, h * 0.08, 0, 0, TAU); c.fill(); // heel pad
        c.beginPath(); c.ellipse(w / 2, h * 0.6, w * 0.2, h * 0.07, 0, 0, TAU); c.fill();
        [[-0.2, 0.82], [0, 0.88], [0.2, 0.82]].forEach(function (q) { c.beginPath(); c.ellipse(w / 2 + q[0] * w, q[1] * h, w * 0.09, h * 0.065, 0, 0, TAU); c.fill(); }); // 3 toe pads
        c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(w * 0.4, h * 0.4, w * 0.07, h * 0.12, 0, 0, TAU); c.fill();
      });
      // front paw (little pink hand, cream cuff)
      R.pw = s * 0.15; R.ph = s * 0.16;
      R.paw = mkc(R.pw, R.ph, dpr, function (c, w, h) {
        c.fillStyle = '#EFA7AF'; c.beginPath(); c.ellipse(w / 2, h * 0.62, w * 0.34, h * 0.28, 0, 0, TAU); c.fill();
        c.fillStyle = '#D87F8C'; for (var i = 0; i < 4; i++) { c.beginPath(); c.ellipse(w * (0.24 + i * 0.17), h * 0.88, w * 0.07, h * 0.08, 0, 0, TAU); c.fill(); }
        c.fillStyle = '#F1E0C8'; c.beginPath(); c.ellipse(w / 2, h * 0.32, w * 0.36, h * 0.26, 0, 0, TAU); c.fill();
      });
      // soft shadow + dust puff
      R.shd = mkc(s * 1.3, s * 0.34, dpr, function (c, w, h) { c.save(); c.scale(1, h / w); var q = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); q.addColorStop(0, 'rgba(60,24,4,.55)'); q.addColorStop(0.55, 'rgba(60,24,4,.25)'); q.addColorStop(1, 'rgba(60,24,4,0)'); c.fillStyle = q; c.fillRect(0, 0, w, w); c.restore(); });
      R.puff = mkc(48, 48, 1, function (c) { var q = c.createRadialGradient(24, 24, 0, 24, 24, 24); q.addColorStop(0, 'rgba(250,232,196,.75)'); q.addColorStop(0.5, 'rgba(236,206,160,.4)'); q.addColorStop(1, 'rgba(236,206,160,0)'); c.fillStyle = q; c.fillRect(0, 0, 48, 48); });
      return R;
    }
    function hamW() { return lw * 0.82; }
    function star5(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
    // one frame of the hamster at ground point (x, gy): run cycle / cash-out hops / stumble and fall
    function drawHam(c, x, gy) {
      var s = hamW(), R = HR, ph = cyc % 1, a2 = 4 * Math.PI * ph, amp = 0.75 + 0.6 * clamp((spd - 0.3) / 0.6, 0, 1);
      var b = 0.5 - 0.5 * Math.cos(a2), bob = b * 0.085 * s * amp, sq = (0.5 - b) * 0.1 * amp, sx = 1 + sq, sy = 1 - sq;
      var sway = Math.sin(TAU * ph) * 0.03 * s * amp, roll = Math.sin(TAU * ph) * 0.06 * amp + lean, hop = 0, mv = lane - lx0, lk = mv ? clamp((hx - lx0) / mv, 0, 1) : 1;
      hop += Math.sin(Math.PI * lk) * 0.07 * s * (mv ? 1 : 0);
      var arms = 0, pivot = 0, earK = 0;
      if (won && !crash) { var wk = won < 1.7 ? Math.abs(Math.sin(won * Math.PI * 2.1)) : 0; hop += wk * 0.34 * s; arms = won < 1.9 ? 1 : 0; sq = wk < 0.15 && won < 1.7 ? 0.08 : -0.03 * wk; sx = 1 + sq; sy = 1 - sq; earK = 0.25; }
      var cr = 0;
      if (crash) {
        var ct = crash.t, sd = crash.s, k;
        if (ct < 0.12) { k = ct / 0.12; sx = 1 + 0.2 * k; sy = 1 - 0.22 * k; roll = 0; sway = 0; earK = -0.5 * k; }
        else if (ct < 0.62) { k = (ct - 0.12) / 0.5; var e = ease(k); cr = sd * 1.3 * e; hop = Math.sin(Math.PI * Math.min(1, k * 1.15)) * 0.32 * s; sx = 1 + 0.2 * (1 - e); sy = 1 - 0.22 * (1 - e); roll = 0; sway = 0; earK = -0.4; }
        else { var k3 = ct - 0.62; cr = sd * (1.3 + Math.sin(k3 * 15) * Math.exp(-k3 * 5) * 0.14); hop = Math.abs(Math.sin(k3 * 12)) * Math.exp(-k3 * 6) * 0.08 * s; roll = 0; sway = 0; earK = 0.1 * Math.sin(k3 * 3); }
        pivot = sd * 0.44 * s; bob *= 0.4;
      }
      // soft shadow: smaller and lighter when the body is in the air
      var lift = (hop + bob) / s, shW = s * (crash && cr ? 1.15 : 1) * (1 - lift * 0.5);
      c.globalAlpha = clamp(1 - lift * 1.2, 0.35, 1); c.drawImage(R.shd, x + pivot * Math.min(1, Math.abs(cr)) * 0.6 - shW * 0.6, gy - shW * 0.12, shW * 1.2, shW * 0.3); c.globalAlpha = 1;
      c.save(); c.translate(x + sway + pivot, gy - hop); c.rotate(roll + cr); c.translate(-pivot, 0);
      var i, fp, fk, fx, fy;
      // front paws (under the chest, behind the body): reach out at the sides, alternating
      for (i = -1; i <= 1; i += 2) {
        fp = (ph + (i > 0 ? 0.5 : 0) + 0.25) % 1; var reach = Math.sin(TAU * fp);
        if (arms) { fx = i * s * 0.5; fy = -s * (0.92 + 0.06 * Math.sin(won * 18 + i)); c.save(); c.translate(fx, fy); c.rotate(i * 0.3); c.drawImage(R.paw, -R.pw / 2, -R.ph / 2, R.pw, R.ph); c.restore(); continue; }
        continue; // v3192 : pendant la course, les pattes avant restent cachées sous la poitrine (elles flottaient sur les côtés)
        fx = i * s * (0.43 + 0.06 * reach); fy = -s * (0.1 + 0.06 * reach) - bob * 0.5;
        c.globalAlpha = Math.min(1, (reach - 0.15) * 3); c.save(); c.translate(fx, fy); c.rotate(i * (0.6 + 0.3 * reach)); c.drawImage(R.paw, -R.pw / 2, -R.ph / 2, R.pw * 0.9, R.ph * 0.9); c.restore(); c.globalAlpha = 1;
      }
      // head, lagging the body's bob a little; ears spring behind it
      var bh = 0.5 - 0.5 * Math.cos(a2 - 0.9), hyH = -s * 0.79 - bob - bh * 0.035 * s * amp * (crash ? 0 : 1), hxH = -sway * 0.5 - lean * 0.12 * s;
      for (i = -1; i <= 1; i += 2) {
        var er = i * (0.32 + 0.1 * Math.sin(a2 - 1.7) * amp + earK) ;
        c.save(); c.translate(hxH + i * s * 0.21, hyH - s * 0.11); c.rotate(er); if (i > 0) c.scale(-1, 1); c.drawImage(R.ear, -R.ew / 2, -R.eh * 0.95, R.ew, R.eh); c.restore();
      }
      c.save(); c.translate(hxH, hyH); c.scale(1 + sq * 0.5, 1 - sq * 0.5); c.drawImage(R.head, -R.hw / 2, -R.hh / 2, R.hw, R.hh);
      // v3193 : les yeux se devinent sur les côtés de la tête (ronds, noirs, un éclat blanc), comme sur la fiche du propriétaire
      for (i = -1; i <= 1; i += 2) {
        var ex = i * s * 0.29, ey = s * 0.01, er2 = s * 0.055; // v3195 : yeux plus grands, plus « mignons »
        c.fillStyle = '#1B0F0A'; c.beginPath(); c.ellipse(ex, ey, er2 * 0.8, er2, i * 0.25, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(ex - i * er2 * 0.15, ey - er2 * 0.4, er2 * 0.3, 0, TAU); c.fill();
      }
      c.restore();
      // v3193 : pattes avant (plus petites), ATTACHÉES au corps : un petit bras de fourrure qui part sous l'épaule et une main
      // rose posée près du sol ; elles alternent (l'une monte quand l'autre appuie) pour équilibrer la foulée
      if (!arms && !(crash && crash.t > 0.12)) {
        for (i = -1; i <= 1; i += 2) {
          var fq = (ph + (i > 0 ? 0 : 0.5) + 0.25) % 1, fl = Math.max(0, Math.sin(TAU * fq)) * 0.07 * s * amp;
          var shX = i * s * 0.36, shY = -s * 0.36 - bob, pX = i * s * (0.42 + 0.02 * Math.sin(TAU * fq)), pY = -s * 0.03 - fl;
          var dxA = pX - shX, dyA = pY - shY, La = Math.hypot(dxA, dyA);
          c.save(); c.translate(shX, shY); c.rotate(Math.atan2(dyA, dxA) - Math.PI / 2); c.drawImage(R.leg, -R.lw2 * 0.32, 0, R.lw2 * 0.64, La); c.restore();
          c.save(); c.translate(pX, pY); c.rotate(i * 0.35); c.drawImage(R.paw, -R.pw * 0.45, -R.ph * 0.55, R.pw * 0.9, R.ph * 0.9); c.restore();
        }
      }
      // body (squash / stretch from the ground up)
      c.save(); c.translate(0, -bob); c.scale(sx, sy); c.drawImage(R.body, -R.bw / 2, -R.boy - s * 0.085, R.bw, R.bh); c.restore();
      // v3195 : petite queue duveteuse (comme sur la fiche) qui frétille, + reflet de lumière sur le dos
      var tx0 = Math.sin(a2) * 0.018 * s, ty0 = -s * 0.2 - bob * sy, tg2 = c.createRadialGradient(tx0 - s * 0.015, ty0 - s * 0.02, s * 0.005, tx0, ty0, s * 0.07);
      tg2.addColorStop(0, '#F7E3C6'); tg2.addColorStop(0.6, '#DDB083'); tg2.addColorStop(1, 'rgba(190,130,70,0)');
      c.fillStyle = tg2; c.beginPath(); c.ellipse(tx0, ty0, s * 0.07, s * 0.06, 0, 0, TAU); c.fill();
      var hl2 = c.createRadialGradient(-s * 0.12, -s * 0.66 - bob, 0, -s * 0.12, -s * 0.66 - bob, s * 0.26);
      hl2.addColorStop(0, 'rgba(255,240,210,.32)'); hl2.addColorStop(1, 'rgba(255,240,210,0)');
      c.fillStyle = hl2; c.beginPath(); c.ellipse(-s * 0.12, -s * 0.66 - bob, s * 0.26, s * 0.18, -0.3, 0, TAU); c.fill();
      // hind legs (v3107): alternate — one foot planted under the body (moving back toward the camera as the body goes
      // forward), the other pushing off: heel rises, the sole turns to the camera, the foot lifts, then swings forward to land
      var fsp = crash ? Math.max(0.15, Math.exp(-crash.t * 1.5)) : 1;
      for (i = -1; i <= 1; i += 2) {
        fp = (ph + (i > 0 ? 0.5 : 0)) % 1;
        var up, sole, back;
        if (fp < 0.55) { fk = fp / 0.55; up = 0; back = fk; sole = fk > 0.7 ? (fk - 0.7) / 0.3 * 0.7 : 0; }
        else { fk = (fp - 0.55) / 0.45; up = Math.sin(Math.PI * Math.min(1, fk * 1.1)) * 0.13 * s * amp; back = 1 - fk; sole = fk < 0.6 ? 0.7 + 0.3 * Math.sin(fk / 0.6 * Math.PI) : (1 - fk) / 0.4 * 0.7; }
        if (crash && crash.t > 0.12) { up = (0.1 + 0.06 * Math.sin(cyc * TAU * 2 + i)) * s * fsp; sole = 1; back = 0.5; }
        if (won && arms) { up *= 0.5; }
        var sc = 1.15 + 0.3 * back, footX = i * s * (0.21 + 0.03 * back), footY = -up + s * 0.05 * back, hipX = i * s * 0.17, hipY = -s * 0.17 - bob;
        if (!crash && up < s * 0.02) { c.globalAlpha = 0.45; c.drawImage(R.shd, footX - s * 0.11, footY - s * 0.025, s * 0.22, s * 0.06); c.globalAlpha = 1; } // contact shadow
        var heelY = footY - (sole > 0.3 ? R.sh2 * 0.85 * sc : R.fth * 0.5 * sc), dxL = footX - hipX, dyL = heelY - hipY, Ll = Math.max(s * 0.05, Math.hypot(dxL, dyL));
        c.save(); c.translate(hipX, hipY); c.rotate(Math.atan2(dyL, dxL) - Math.PI / 2); c.drawImage(R.leg, -R.lw2 / 2 * sc, 0, R.lw2 * sc, Ll + s * 0.02); c.restore();
        // v3193 : cuisse ronde et musclée qui bombe sur le côté du derrière quand la patte pousse
        var th = 0.85 + 0.35 * (1 - back); c.save(); c.translate(hipX + i * s * 0.05, hipY + s * 0.02); c.scale(th, th);
        var tg = c.createRadialGradient(-i * s * 0.03, -s * 0.05, s * 0.01, 0, 0, s * 0.16); tg.addColorStop(0, 'rgba(236,186,126,.7)'); tg.addColorStop(0.6, 'rgba(206,140,76,.45)'); tg.addColorStop(1, 'rgba(176,104,46,0)');
        c.fillStyle = tg; c.beginPath(); c.ellipse(0, 0, s * 0.15, s * 0.13, 0, 0, TAU); c.fill(); c.restore();
        c.save(); c.translate(footX, footY); c.rotate(i * 0.08);
        if (sole < 1) { c.globalAlpha = 1 - sole; c.drawImage(R.ftop, -R.ftw * sc / 2, -R.fth * sc, R.ftw * sc, R.fth * sc); }
        if (sole > 0) { c.globalAlpha = Math.min(1, sole * 1.6); var shh = R.sh2 * sc * (0.55 + 0.45 * sole); c.drawImage(R.sole, -R.sw2 * sc / 2, -shh, R.sw2 * sc, shh); }
        c.globalAlpha = 1; c.restore();
      }
      c.restore();
      // dizzy stars above the fallen hamster's head
      if (crash && crash.t > 0.5) {
        var ang = cr, hx2 = x + pivot + Math.cos(ang) * (-pivot) - Math.sin(ang) * (-1.1 * s), hy2 = gy - hop + Math.sin(ang) * (-pivot) + Math.cos(ang) * (-1.1 * s);
        c.globalAlpha = Math.min(1, (crash.t - 0.5) * 3);
        for (i = 0; i < 3; i++) { var sa2 = crash.t * 4 + i * TAU / 3, zz = Math.sin(sa2); star5(c, hx2 + Math.cos(sa2) * s * 0.3, hy2 - s * 0.12 + zz * s * 0.07, s * (0.055 + 0.015 * zz), i % 2 ? '#FDE68A' : '#FFFFFF'); }
        c.globalAlpha = 1;
      }
    }
    // drawing only: what happens on screen when the run ends (k 0 = an obstacle, 1 = the end wall)
    function hitFx(k) {
      crash = { t: 0, s: hx > 0 ? -1 : hx < 0 ? 1 : (Math.random() < 0.5 ? -1 : 1) };
      A.shake(k ? 0.5 : 0.32); A.flash(k ? 0.25 : 0.1);
      var x = SX(hx, 0), n = A.lite ? 4 : 10;
      for (var i = 0; i < n; i++) PF.push({ x: x + rnd(-0.4, 0.4) * lw, y: ny - rnd(0, 0.25) * lw, vx: rnd(-1, 1) * lw * 0.8, vy: -rnd(0.2, 0.7) * lw, r: lw * rnd(0.12, 0.22), gr: lw * 0.5, t: 0, m: rnd(0.5, 0.9) });
      A._xb = 1; A.burst(x, ny - lw * 0.2, k ? 18 : 12, ['#FDE68A', '#F5D0A9', '#E0A85A', '#FFF7ED'], 170 * (k ? 1.4 : 1), 0.6, 2.6); A._xb = 0;
    }
    function obSprite(k) {
      var w = lw * 0.84, h = k ? w * 0.62 : w * 0.95;
      return mkc(w, h, dpr, function (c) {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(w / 2, h * 0.97, w * 0.5, h * 0.05, 0, 0, TAU); c.fill();
        if (k === 0) { // a wall of 3 toy blocks with bevels and studs
          var cols = [['#F43F5E', '#9F1239'], ['#FACC15', '#A16207'], ['#3B82F6', '#1E3A8A'], ['#22C55E', '#14532D']], bw = w / 2, bh = h * 0.42;
          [[0, h - bh, 0], [bw, h - bh, 2], [bw * 0.5, h - bh * 2, 1]].forEach(function (b, i) {
            var cl = cols[(b[2] + i) % 4], x0 = b[0] + 1, y0 = b[1] + 1, ww = bw - 2, hh = bh - 2;
            c.fillStyle = cl[1]; c.fillRect(x0, y0, ww, hh);
            c.fillStyle = cl[0]; c.fillRect(x0 + ww * 0.08, y0 + hh * 0.08, ww * 0.84, hh * 0.8);
            c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + ww, y0); c.lineTo(x0 + ww * 0.92, y0 + hh * 0.08); c.lineTo(x0 + ww * 0.08, y0 + hh * 0.08); c.lineTo(x0 + ww * 0.08, y0 + hh * 0.88); c.lineTo(x0, y0 + hh); c.closePath(); c.fill();
            c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(x0 + ww, y0); c.lineTo(x0 + ww, y0 + hh); c.lineTo(x0, y0 + hh); c.lineTo(x0 + ww * 0.08, y0 + hh * 0.88); c.lineTo(x0 + ww * 0.92, y0 + hh * 0.88); c.lineTo(x0 + ww * 0.92, y0 + hh * 0.08); c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x0 + ww / 2, y0 + hh * 0.48, hh * 0.22, 0, TAU); c.fill(); c.fillStyle = cl[0]; c.beginPath(); c.arc(x0 + ww / 2 + 1, y0 + hh * 0.48 + 1, hh * 0.18, 0, TAU); c.fill();
          });
        } else { // a mousetrap: wooden base, steel bar and spring, cheese bait
          var by = h * 0.55;
          c.fillStyle = '#7C4A1E'; c.beginPath(); c.moveTo(w * 0.04, h * 0.95); c.lineTo(w * 0.96, h * 0.95); c.lineTo(w * 0.88, by); c.lineTo(w * 0.12, by); c.closePath(); c.fill();
          c.fillStyle = lg2(c, 0, by, 0, h * 0.9, ['#E0A85A', '#B97A35']); c.beginPath(); c.moveTo(w * 0.06, h * 0.88); c.lineTo(w * 0.94, h * 0.88); c.lineTo(w * 0.87, by); c.lineTo(w * 0.13, by); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(90,50,15,.35)'; c.lineWidth = 1; for (var i = 1; i < 6; i++) { c.beginPath(); c.moveTo(w * (0.12 + i * 0.13), by + 2); c.lineTo(w * (0.08 + i * 0.15), h * 0.87); c.stroke(); }
          c.strokeStyle = '#CBD5E1'; c.lineWidth = Math.max(2, w * 0.03); c.beginPath(); c.moveTo(w * 0.18, h * 0.82); c.lineTo(w * 0.18, h * 0.12); c.lineTo(w * 0.82, h * 0.12); c.lineTo(w * 0.82, h * 0.82); c.stroke();
          c.strokeStyle = '#64748B'; c.lineWidth = Math.max(1, w * 0.012); c.beginPath(); c.moveTo(w * 0.18, h * 0.12); c.lineTo(w * 0.82, h * 0.12); c.stroke();
          c.strokeStyle = '#94A3B8'; c.lineWidth = Math.max(1.5, w * 0.02); for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(w * (0.38 + i * 0.08), h * 0.78, w * 0.03, h * 0.08, 0, 0, TAU); c.stroke(); }
          c.fillStyle = '#FBBF24'; c.beginPath(); c.moveTo(w * 0.42, h * 0.7); c.lineTo(w * 0.62, h * 0.7); c.lineTo(w * 0.6, h * 0.56); c.closePath(); c.fill();
          c.fillStyle = '#D97706'; [[0.5, 0.66], [0.56, 0.63]].forEach(function (q) { c.beginPath(); c.arc(w * q[0], h * q[1], w * 0.015, 0, TAU); c.fill(); });
        }
      });
    }
    function lg2(c, x0, y0, x1, y1, st) { var g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(function (s, i) { g.addColorStop(i / (st.length - 1), s); }); return g; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        hy = Math.max(T + 4, H * 0.22); ny = H * 0.95; lw = Math.max(4, Math.min(W * 0.3, (ny - hy) * 0.5)); // 2026-10-20 (QA) : scène pas encore mesurée (très basse) → jamais de rayon négatif (createRadialGradient plantait l'image)
        var tr = lw * 1.95, cyN = ny - tr * 0.45;
        bg = mkc(W, H, dpr, function (c) {
          // the world outside the tube: a bright toy room, out of focus (soft colour blobs), glowing exit at the end
          var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3B1D6E'); g.addColorStop(0.5, '#5B2A86'); g.addColorStop(1, '#2A1250'); c.fillStyle = g; c.fillRect(0, 0, W, H);
          var R = 31;
          for (var i = 0; i < (A.lite ? 14 : 30); i++) {
            R = (R * 9301 + 49297) % 233280; var bx = R / 233280 * W; R = (R * 9301 + 49297) % 233280; var by = R / 233280 * H; R = (R * 9301 + 49297) % 233280;
            var br = Math.min(W, H) * (0.05 + R / 233280 * 0.12), col = TUBE[i % TUBE.length], q = c.createRadialGradient(bx, by, 0, bx, by, br);
            q.addColorStop(0, col + '88'); q.addColorStop(1, col + '00'); c.fillStyle = q; c.fillRect(bx - br, by - br, br * 2, br * 2);
          }
          var q2 = c.createRadialGradient(W / 2, hy, 0, W / 2, hy, lw * 1.4); q2.addColorStop(0, 'rgba(255,251,235,1)'); q2.addColorStop(0.2, 'rgba(253,230,138,.85)'); q2.addColorStop(0.6, 'rgba(244,114,182,.25)'); q2.addColorStop(1, 'rgba(244,114,182,0)');
          c.fillStyle = q2; c.fillRect(0, 0, W, H);
        });
        floorG = null; fogG = null; shadeG = null;
        HR = rig(hamW());
        obS = [obSprite(0), obSprite(1)];
        wallS = mkc(lw * 3.4, lw * 1.6, dpr, function (c, w, h) { // toy-brick wall (end of the round)
          var cols = ['#F43F5E', '#FACC15', '#3B82F6', '#22C55E', '#F97316', '#A855F7'], bw = w / 6, bh = h / 4;
          for (var r = 0; r < 4; r++) for (var k = -1; k < 7; k++) { var x0 = k * bw + (r % 2) * bw / 2, y0 = r * bh, cl = cols[(k + r * 2 + 12) % 6];
            c.fillStyle = sh(cl, -0.35); c.fillRect(x0 + 1, y0 + 1, bw - 2, bh - 2); c.fillStyle = cl; c.fillRect(x0 + 1, y0 + 1, bw - 4, bh - 4); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x0 + 1, y0 + 1, bw - 4, bh * 0.12);
            c.fillStyle = sh(cl, 0.3); c.beginPath(); c.arc(x0 + bw * 0.3, y0 + bh * 0.5, bh * 0.16, 0, TAU); c.arc(x0 + bw * 0.7, y0 + bh * 0.5, bh * 0.16, 0, TAU); c.fill(); }
        });
      },
      reset: function (live) { obs = []; lane = 0; hx = 0; dead = false; wall = null; won = 0; rowT = live ? 1.2 : 0.8; lastFree = 0; lx0 = 0; vX = 0; lean = 0; vPrev = 0; crash = null; scrollK = 1; CF.length = 0; cfOn = 0; },
      step: function (dt, live) {
        t += dt;
        var lv = A.lv(), playing = A.live();
        spd = (live ? 0.48 + 0.4 * lv : 0.32) * (won ? 1.6 : 1);
        var rp0 = ringP;
        scrollK += ((crash ? 0.12 : 1) - scrollK) * Math.min(1, dt * (crash ? 3 : 2)); // drawing only: the floor slows down after a fall
        ringP = (ringP + dt * spd / 0.14 * scrollK) % 1;
        if (ringP < rp0) ringN++; sfx += ((live ? 0.3 + lv * 0.7 : 0.15) - sfx) * Math.min(1, dt * 2); // drawing only
        var tgt = lane, dx = tgt - hx, st = dt * 8.5;
        hx = Math.abs(dx) <= st ? tgt : hx + Math.sign(dx) * st;
        if (live && !wall) {
          rowT -= dt;
          if (rowT <= 0) {
            rowT = Math.max(0.6, rnd(0.95, 1.25) - 0.4 * lv);
            var n = Math.random() < 0.3 + 0.35 * lv ? 2 : 1, ls = [-1, 0, 1].sort(function () { return Math.random() - 0.5; }).slice(0, n);
            ls.forEach(function (l) { obs.push({ ln: l, z: 1.15, k: Math.random() < 0.5 ? 0 : 1 }); });
          }
        } else if (!live && !wall && !won) {
          rowT -= dt; if (rowT <= 0) { rowT = 1.4; var l2 = [-1, 1][(Math.random() * 2) | 0]; if (l2 !== lane) obs.push({ ln: l2, z: 1.15, k: (Math.random() * 2) | 0 }); }
        }
        for (var i = obs.length - 1; i >= 0; i--) {
          var o = obs[i], z0 = o.z; o.z -= spd * dt;
          if (z0 > 0.02 && o.z <= 0.02 && playing && !dead && Math.abs(o.ln - hx) < 0.5) { if (A.fail(A.l.fail)) { dead = true; hitFx(0); } }
          if (o.z < -0.07) obs.splice(i, 1);
        }
        if (wall) { var w0 = wall.z; wall.z -= wall.v * dt; if (w0 > 0.02 && wall.z <= 0.02) { dead = true; hitFx(1); } if (wall.z < -0.07) wall = null; }
        if (won) won += dt;
        // ---- drawing only from here (v3103): eased lane slide + lean, gait cycle, dust, confetti
        var mv = lane - lx0, lk = mv ? clamp((hx - lx0) / mv, 0, 1) : 1;
        vX = lx0 + mv * lk * lk * (3 - 2 * lk);
        var vel = dt > 0 ? (vX - vPrev) / dt : 0; vPrev = vX;
        lean += (clamp(vel * 0.045, -0.32, 0.32) - lean) * Math.min(1, dt * 16);
        if (crash) crash.t += dt;
        var c0 = cyc;
        cyc += dt * (crash ? 7 * Math.exp(-crash.t * 1.2) + 0.5 : 1.6 + 6.5 * spd);
        // a puff of dust each time a hind foot pushes off (twice per cycle)
        if (!crash && Math.floor(c0 * 2 + 0.5) !== Math.floor(cyc * 2 + 0.5) && PF.length < (A.lite ? 5 : 16)) {
          var s = hamW(), fs = (Math.floor(cyc * 2 + 0.5) % 2) ? 1 : -1, px = SX(vX, 0) + fs * s * 0.22;
          PF.push({ x: px, y: ny - s * 0.02, vx: fs * lw * rnd(0.05, 0.25), vy: lw * rnd(0.05, 0.25) * (0.5 + spd), r: s * rnd(0.08, 0.13), gr: s * (0.25 + spd * 0.4), t: 0, m: rnd(0.35, 0.55) * (A.lite ? 0.8 : 1) });
        }
        for (i = PF.length - 1; i >= 0; i--) { var f = PF[i]; f.t += dt; if (f.t > f.m) { PF.splice(i, 1); continue; } f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.96; f.r += f.gr * dt; }
        if (won && !cfOn) { cfOn = 1; // cash-out: a little confetti pop above the hamster
          var cx0 = SX(vX, 0), cy0 = ny - hamW() * 1.1, cc = ['#FACC15', '#F472B6', '#4ADE80', '#22D3EE', '#FB923C', '#FFFFFF', '#A78BFA'];
          for (i = 0; i < (A.lite ? 16 : 46); i++) { var an = -Math.PI / 2 + rnd(-1.1, 1.1), sp = lw * rnd(1.6, 3.4); CF.push({ x: cx0, y: cy0, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, r: rnd(3, 6), a: rnd(0, TAU), va: rnd(-12, 12), c: cc[i % cc.length], t: 0, m: rnd(1.2, 1.9) }); }
        }
        for (i = CF.length - 1; i >= 0; i--) { var q2 = CF[i]; q2.t += dt; if (q2.t > q2.m) { CF.splice(i, 1); continue; } q2.x += q2.vx * dt; q2.y += q2.vy * dt; q2.vx *= 0.97; q2.vy = q2.vy * 0.97 + lw * 4 * dt; q2.a += q2.va * dt; }
        // sawdust kicked up behind the hamster (drawing only)
        if (!dead && !A.lite || (!dead && SD.length < 6)) { if (Math.random() < dt * (8 + 20 * spd)) SD.push({ x: SX(vX, 0) + rnd(-1, 1) * lw * 0.15, y: ny - lw * 0.02, vx: rnd(-1, 1) * lw * 0.6, vy: -rnd(0.3, 0.9) * lw, t: 0, m: rnd(0.3, 0.6), c: Math.random() < 0.5 ? '#FDE68A' : '#F5D0A9' }); }
        for (i = SD.length - 1; i >= 0; i--) { var q = SD[i]; q.t += dt; if (q.t > q.m) { SD.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vy += lw * 3 * dt; }
      },
      draw: function (c) {
        A.bg(bg);
        var i, z, p, n = A.lite ? 7 : 12, tr = (ny - hy) * 1.0, cyN = ny - tr * 0.55, cx = W / 2;
        function cy(pp) { return hy + (cyN - hy) * pp; }
        // camera: a touch of zoom (wider "FOV" feel) and a light tremble as the run gets fast; a soft step bob
        var hs = clamp((sfx - 0.2) / 0.8, 0, 1), zm = 1 + 0.05 * hs, jx = 0, jy = 0; // v3192 (propriétaire : « pas stable ») : caméra fixe, plus de tremblement ni de rebond du décor
        c.save(); c.translate(cx, hy); c.scale(zm, zm); c.translate(-cx + jx, -hy + jy);
        // tube segments, far → near: translucent coloured plastic, a bright connector ring, a glossy highlight
        for (i = 0; i < n + 2; i++) {
          var z1 = (n - 1 - i + 1 - ringP) * 0.14, z0 = z1 + 0.14; if (z0 < -0.12) continue;
          var p0 = P(z0), p1 = P(Math.max(z1, -0.12)), cut = z1 < -0.12, col = TUBE[((ringN + n - i) % TUBE.length + TUBE.length) % TUBE.length];
          c.globalAlpha = Math.min(0.75, 0.42 + 0.3 * p1); c.fillStyle = col; c.beginPath(); c.arc(cx, cy(p1), tr * p1, 0, TAU); c.arc(cx, cy(p0), tr * p0, 0, TAU, true); c.fill('evenodd');
          if (cut) continue;
          c.globalAlpha = Math.min(1, 0.25 + 0.5 * p1); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1, 3.2 * p1); c.beginPath(); c.arc(cx - tr * p1 * 0.05, cy(p1) - tr * p1 * 0.05, tr * p1 * 0.93, Math.PI * 1.12, Math.PI * 1.42); c.stroke();
          c.lineWidth = Math.max(1.5, 9 * p1); c.strokeStyle = sh(col, -0.15); c.beginPath(); c.arc(cx, cy(p1), tr * p1, Math.PI * 0.75, Math.PI * 2.25); c.stroke();
          c.lineWidth = Math.max(0.8, 3 * p1); c.strokeStyle = sh(col, 0.45); c.beginPath(); c.arc(cx, cy(p1), tr * p1 - 2.5 * p1, Math.PI * 0.8, Math.PI * 2.2); c.stroke();
        }
        c.globalAlpha = 1;
        // the tube's long seams converging to the end of the tube + an inner shadow (reads as a real tube around us)
        var pf = P(1.5), pn = P(-0.12);
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.2;
        for (i = 0; i < 12; i++) { var aa = Math.PI * (0.78 + i * 0.12); c.beginPath(); c.moveTo(cx + Math.cos(aa) * tr * pf, cy(pf) + Math.sin(aa) * tr * pf); c.lineTo(cx + Math.cos(aa) * tr * pn, cy(pn) + Math.sin(aa) * tr * pn); c.stroke(); }
        if (!shadeG) { shadeG = c.createRadialGradient(cx, cy(1), tr * 0.35, cx, cy(1), tr * 1.25); shadeG.addColorStop(0, 'rgba(20,6,40,0)'); shadeG.addColorStop(1, 'rgba(20,6,40,.45)'); }
        c.fillStyle = shadeG; c.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2);
        // speed streaks on the tube wall (longer / brighter as the multiplier climbs)
        if (sfx > 0.08) {
          c.strokeStyle = 'rgba(255,255,255,' + (0.22 * sfx).toFixed(3) + ')'; c.lineWidth = 1.5; c.lineCap = 'round';
          for (i = 0; i < (A.lite ? 6 : 14); i++) { var a = Math.PI * (0.85 + (i * 0.618 % 1) * 1.3), k = (t * (1.5 + spd * 2) + i * 0.37) % 1, r0 = tr * (0.15 + k * 0.9), r1 = r0 + tr * 0.25 * sfx * k; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy(1) + (hy - cy(1)) * (1 - k) * 0.6 + Math.sin(a) * r0 * 0.9); c.lineTo(cx + Math.cos(a) * r1, cy(1) + (hy - cy(1)) * (1 - k) * 0.6 + Math.sin(a) * r1 * 0.9); c.stroke(); }
        }
        // floor (v3103): a wooden runway — planks across the track, dark joints, staggered board ends, grain, warm haze far away
        if (!floorG) { floorG = c.createLinearGradient(0, hy, 0, H); floorG.addColorStop(0, '#F3C88A'); floorG.addColorStop(0.2, '#D69A5C'); floorG.addColorStop(1, '#A8682F'); }
        if (!fogG) { fogG = c.createLinearGradient(0, hy, 0, hy + (ny - hy) * 0.45); fogG.addColorStop(0, 'rgba(255,240,200,.75)'); fogG.addColorStop(1, 'rgba(255,240,200,0)'); }
        var XL = -1.55, XR = 1.55;
        c.fillStyle = floorG; c.beginPath(); c.moveTo(SX(XL, 8), SY(8)); c.lineTo(SX(XR, 8), SY(8)); c.lineTo(SX(XR, -0.08), SY(-0.08)); c.lineTo(SX(XL, -0.08), SY(-0.08)); c.closePath(); c.fill();
        for (i = 0; i < n; i++) {
          z = (n - 1 - i + 1 - ringP) * 0.14;
          for (var hb = 0; hb < 2; hb++) {
            var za = z + hb * 0.07, zb = za + 0.07; if (zb < -0.08) continue; za = Math.max(-0.08, za);
            var id = (ringN + n - i) * 2 + hb, hv = hsh(id + 7), pa = P(za), pb = P(zb), ya = SY(za), yb = SY(zb);
            c.globalAlpha = 0.55; c.fillStyle = WOOD[(hv * WOOD.length) | 0];
            c.beginPath(); c.moveTo(SX(XL, za), ya); c.lineTo(SX(XR, za), ya); c.lineTo(SX(XR, zb), yb); c.lineTo(SX(XL, zb), yb); c.closePath(); c.fill();
            c.globalAlpha = 1;
            if (pa > 0.3) { // grain lines along the plank + a board end
              c.strokeStyle = 'rgba(255,228,180,.13)'; c.lineWidth = Math.max(0.5, 1.4 * pa); // soft light grain across the whole board
              for (var gi = 1; gi <= 2; gi++) { var zg = za + (zb - za) * (gi / 3 + (hsh(id * 3 + gi) - 0.5) * 0.15); c.beginPath(); c.moveTo(SX(XL, zg), SY(zg)); c.lineTo(SX(XR, zg), SY(zg)); c.stroke(); }
              if (hv > 0.55) { var kx = XL + 0.3 + hsh(id + 41) * 2.5, kz = (za + zb) / 2, kr = lw * 0.09 * pa; c.fillStyle = 'rgba(255,226,175,.2)'; c.beginPath(); c.ellipse(SX(kx, kz), SY(kz), kr, kr * 0.32, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(140,80,30,.18)'; c.lineWidth = Math.max(0.5, pa); c.beginPath(); c.ellipse(SX(kx, kz), SY(kz), kr * 0.55, kr * 0.17, 0, 0, TAU); c.stroke(); } // a pale wood knot
              var xe = XL + 0.4 + hsh(id + 99) * 2.3; c.strokeStyle = 'rgba(70,32,8,.45)'; c.lineWidth = Math.max(0.6, 1.6 * pa); c.beginPath(); c.moveTo(SX(xe, za), ya); c.lineTo(SX(xe, zb), yb); c.stroke();
            }
            // the joint at the near edge of the plank (dark gap + a lit lip)
            if (za > -0.08) { c.strokeStyle = 'rgba(70,32,8,.6)'; c.lineWidth = Math.max(0.6, 2.4 * pa); c.beginPath(); c.moveTo(SX(XL, za), ya); c.lineTo(SX(XR, za), ya); c.stroke();
              if (pa > 0.25) { c.strokeStyle = 'rgba(255,226,170,.35)'; c.lineWidth = Math.max(0.5, 1.2 * pa); c.beginPath(); c.moveTo(SX(XL, za + 0.004), ya - 1.6 * pa); c.lineTo(SX(XR, za + 0.004), ya - 1.6 * pa); c.stroke(); } }
          }
        }
        c.fillStyle = fogG; c.beginPath(); c.moveTo(SX(XL, 8), SY(8)); c.lineTo(SX(XR, 8), SY(8)); c.lineTo(SX(XR, -0.08), SY(-0.08)); c.lineTo(SX(XL, -0.08), SY(-0.08)); c.closePath(); c.fill(); // warm haze far away
        // side beams: a raised wooden edge with posts that rush past
        [-1, 1].forEach(function (sd) {
          var xi = sd * 1.5, xo = sd * 1.66, zf = 8, zn = -0.08, bhh = lw * 0.12;
          c.fillStyle = '#7A3F16'; c.beginPath(); c.moveTo(SX(xi, zf), SY(zf)); c.lineTo(SX(xi, zn), SY(zn)); c.lineTo(SX(xo, zn), SY(zn) + 2); c.lineTo(SX(xo, zf), SY(zf)); c.closePath(); c.fill();
          c.fillStyle = '#B4733A'; c.beginPath(); c.moveTo(SX(xi, zf), SY(zf)); c.lineTo(SX(xi, zn), SY(zn)); c.lineTo(SX(xi, zn), SY(zn) - bhh * P(zn)); c.lineTo(SX(xi, zf), SY(zf) - bhh * P(zf)); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(255,220,160,.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(SX(xi, zf), SY(zf) - bhh * P(zf)); c.lineTo(SX(xi, zn), SY(zn) - bhh * P(zn)); c.stroke();
          for (var j = 0; j < n; j++) { var zp = (n - 1 - j + 1 - ringP) * 0.14 + 0.03; if (zp < -0.08) continue; var pp = P(zp), px = SX(xi, zp), py = SY(zp); c.fillStyle = '#6B3612'; c.fillRect(px - (sd > 0 ? 0 : 3.5 * pp), py - bhh * pp * 1.25, 3.5 * pp + 0.6, bhh * pp * 1.25); c.fillStyle = 'rgba(255,214,150,.5)'; c.fillRect(px - (sd > 0 ? 0 : 3.5 * pp), py - bhh * pp * 1.25, 3.5 * pp + 0.6, 1.2 * pp + 0.4); }
        });
        [-0.5, 0.5].forEach(function (lx) { c.strokeStyle = 'rgba(90,40,10,.28)'; c.lineWidth = 2; c.beginPath(); c.moveTo(SX(lx, 8), SY(8)); c.lineTo(SX(lx, -0.08), SY(-0.08)); c.stroke(); });
        var sorted = obs.slice().sort(function (a, b) { return b.z - a.z; });
        function drawOb(o) { var pp = P(o.z), img = obS[o.k], w = lw * 0.84 * pp, hh = w * img.height / img.width; c.drawImage(img, SX(o.ln, o.z) - w / 2, SY(o.z) - hh, w, hh); }
        function drawWall() { var pp = P(wall.z), x0 = SX(-1.7, wall.z), x1 = SX(1.7, wall.z), y1 = SY(wall.z), hh = lw * 1.6 * pp; c.drawImage(wallS, x0, y1 - hh, x1 - x0, hh); }
        for (i = 0; i < sorted.length; i++) if (sorted[i].z > 0.02) drawOb(sorted[i]);
        if (wall && wall.z > 0.02) drawWall();
        for (i = 0; i < SD.length; i++) { var q = SD[i]; c.globalAlpha = 1 - q.t / q.m; c.fillStyle = q.c; c.fillRect(q.x - 1.5, q.y - 1, 3, 2); }
        for (i = 0; i < PF.length; i++) { var f = PF[i], fk = f.t / f.m; c.globalAlpha = (1 - fk) * Math.min(1, fk * 6) * 0.9; c.drawImage(HR.puff, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); }
        c.globalAlpha = 1;
        drawHam(c, SX(vX, 0), ny);
        for (i = 0; i < sorted.length; i++) if (sorted[i].z <= 0.02) drawOb(sorted[i]);
        if (wall && wall.z <= 0.02) drawWall();
        for (i = 0; i < CF.length; i++) { var cf = CF[i]; c.globalAlpha = Math.min(1, (cf.m - cf.t) * 3); c.save(); c.translate(cf.x, cf.y); c.rotate(cf.a); c.fillStyle = cf.c; c.fillRect(-cf.r / 2, -cf.r / 4, cf.r, cf.r / 2); c.restore(); }
        c.globalAlpha = 1;
        c.restore();
      },
      down: function (x) { if (dead || wall) return; lx0 = hx; lane = clamp(lane + (x < W / 2 ? -1 : 1), -1, 1); },
      boom: function () { wall = { z: 0.75, v: 2.6 }; obs = obs.filter(function (o) { return o.z > 0.75; }); },
      win: function () { won = 0.001; obs = []; }
    };
  }, 'lr', 0.52);

  /* ================================================================== 5. ASTEROID DODGE — drag the ship left / right */
  boot('dodge', function (A) {
    var W, H, u, dpr, T, bg, stL, shipS, rockS = [], s = { x: 0, tx: 0, y: 0 }, rocks = [], spT = 0, drag = null, big = null, scroll = 0, dead = false, won = 0, t = 0, sw = 0, shh = 0;
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top; sw = Math.max(28, 10.5 * u); shh = sw * 1.25;
        bg = bgSprite(W, H, dpr, [[0.3, 0.3, 0.5, 'rgba(139,92,246,.3)'], [0.8, 0.75, 0.5, 'rgba(14,165,233,.14)']], A.lite ? 30 : 50);
        stL = []; for (var i = 0; i < (A.lite ? 16 : 40); i++) stL.push([Math.random() * W, Math.random() * H, Math.random() < 0.8 ? 1.2 : 2, rnd(0.6, 1.4)]);
        shipS = mkc(sw, shh, dpr, function (c, w, h) { // v2860: a starfighter from above: swept wings, panel lines, twin engines, canopy
          c.translate(w / 2, 0);
          var wg = c.createLinearGradient(-w / 2, 0, w / 2, 0); wg.addColorStop(0, '#4C1D95'); wg.addColorStop(0.5, '#A78BFA'); wg.addColorStop(1, '#3B0764');
          c.fillStyle = wg; c.beginPath(); c.moveTo(0, h * 0.34); c.lineTo(w * 0.5, h * 0.78); c.lineTo(w * 0.46, h * 0.88); c.lineTo(w * 0.16, h * 0.8); c.lineTo(-w * 0.16, h * 0.8); c.lineTo(-w * 0.46, h * 0.88); c.lineTo(-w * 0.5, h * 0.78); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(0.8, w * 0.02); c.beginPath(); c.moveTo(0, h * 0.36); c.lineTo(w * 0.48, h * 0.79); c.moveTo(0, h * 0.36); c.lineTo(-w * 0.48, h * 0.79); c.stroke();
          c.fillStyle = '#F59E0B'; c.fillRect(w * 0.38, h * 0.76, w * 0.1, h * 0.04); c.fillRect(-w * 0.48, h * 0.76, w * 0.1, h * 0.04);
          [-1, 1].forEach(function (sd) { c.fillStyle = gl(c, sd * w * 0.22, h * 0.78, w * 0.1, ['#E2E8F0', '#64748B', '#1E293B']); c.fillRect(sd * w * 0.22 - w * 0.07, h * 0.58, w * 0.14, h * 0.34); c.fillStyle = '#0F172A'; c.fillRect(sd * w * 0.22 - w * 0.05, h * 0.9, w * 0.1, h * 0.04); });
          var g = c.createLinearGradient(-w * 0.18, 0, w * 0.18, 0); g.addColorStop(0, '#94A3B8'); g.addColorStop(0.4, '#F8FAFC'); g.addColorStop(0.7, '#CBD5E1'); g.addColorStop(1, '#475569');
          c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(w * 0.17, h * 0.2, w * 0.17, h * 0.6, w * 0.13, h * 0.9); c.lineTo(-w * 0.13, h * 0.9); c.bezierCurveTo(-w * 0.17, h * 0.6, -w * 0.17, h * 0.2, 0, 0); c.fill();
          c.strokeStyle = 'rgba(15,23,42,.3)'; c.lineWidth = Math.max(0.6, w * 0.012); [0.5, 0.66].forEach(function (y) { c.beginPath(); c.moveTo(-w * 0.15, h * y); c.lineTo(w * 0.15, h * y); c.stroke(); });
          c.fillStyle = '#DC2626'; c.beginPath(); c.moveTo(0, h * 0.02); c.lineTo(w * 0.05, h * 0.14); c.lineTo(-w * 0.05, h * 0.14); c.closePath(); c.fill();
          c.fillStyle = gl(c, 0, h * 0.34, w * 0.12, ['#E0F2FE', '#38BDF8', '#0C4A6E']); c.beginPath(); c.ellipse(0, h * 0.34, w * 0.075, h * 0.12, 0, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(-w * 0.025, h * 0.3, w * 0.02, h * 0.05, 0, 0, TAU); c.fill();
        });
        var RM = Math.max(18, 9 * u); rockS = [0, 1, 2].map(function () { return rockSprite(RM, dpr); }); rockS.R = RM;
        s.y = H - shh * 0.75 - 8; s.x = clamp(s.x || W / 2, sw, W - sw); s.tx = s.x;
      },
      reset: function (live) { rocks = []; dead = false; big = null; won = 0; s.x = s.tx = W / 2; s.y = H - shh * 0.75 - 8; spT = live ? 0.9 : 0.3; drag = null; },
      step: function (dt, live) {
        t += dt;
        var lv = A.lv(), i, r;
        scroll += dt * H * (live ? 0.3 + 0.3 * lv : 0.12);
        s.x += (s.tx - s.x) * Math.min(1, dt * 18);
        if (won) s.y -= dt * H * (0.2 + won * 1.2);
        if (!dead && !big && !won) {
          spT -= dt;
          if (spT <= 0) {
            if (live) {
              spT = rnd(0.5, 0.72) - 0.28 * lv;
              var n = Math.random() < 0.22 + 0.35 * lv ? 2 : 1, used = [];
              for (i = 0; i < n; i++) {
                var rr = Math.max(11, (rnd(3.6, 6.6) + 1.6 * lv) * u), x = 0, tries = 0;
                do { x = i === 0 && Math.random() < 0.3 + 0.2 * lv ? clamp(s.x + rnd(-1, 1) * sw, rr, W - rr) : rnd(rr, W - rr); tries++; } while (tries < 8 && used.some(function (q) { return Math.abs(q - x) < rr * 2 + sw * 2.2; }));
                used.push(x);
                rocks.push({ x: x, y: -rr, r: rr, vy: H * (rnd(0.36, 0.48) + 0.32 * lv), vx: rnd(-1, 1) * u * 3, rot: rnd(0, TAU), vr: rnd(-1.5, 1.5), k: (Math.random() * 3) | 0 });
              }
            } else {
              spT = 1.2; var r2 = Math.max(11, rnd(3.5, 6) * u), x2 = rnd(r2, W - r2);
              if (Math.abs(x2 - s.x) > sw * 2) rocks.push({ x: x2, y: -r2, r: r2, vy: H * 0.22, vx: 0, rot: 0, vr: rnd(-1, 1), k: (Math.random() * 3) | 0 });
            }
          }
        }
        for (i = rocks.length - 1; i >= 0; i--) {
          r = rocks[i]; r.y += r.vy * dt; r.x += r.vx * dt; r.rot += r.vr * dt;
          if (r.y - r.r > H) { rocks.splice(i, 1); continue; }
          if (A.live() && !dead) {
            var dx = r.x - s.x, dy = r.y - (s.y + shh * 0.05), rad = r.r * 0.8 + sw * 0.3;
            if (dx * dx + dy * dy < rad * rad && A.fail(A.l.fail)) { dead = true; A.explode(s.x, s.y, 1.3); }
          }
        }
        if (big) {
          big.y += big.v * dt; big.x += (s.x - big.x) * Math.min(1, dt * 6);
          if (!big.hit && big.y + big.r * 0.6 >= s.y) { big.hit = 1; dead = true; A.explode(s.x, s.y, 2.2); }
          if (big.y - big.r * 2 > H) big = null;
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        c.fillStyle = 'rgba(255,255,255,.8)'; // parallax star streaks (cheap dots, no full-screen copy)
        for (var q = 0; q < stL.length; q++) { var st = stL[q], yy = (st[1] + scroll * st[3]) % H; c.fillRect(st[0], yy, st[2], st[2] * (1 + st[3] * 2)); }
        var i, r;
        for (i = 0; i < rocks.length; i++) {
          r = rocks[i]; c.save(); c.translate(r.x, r.y); c.rotate(r.rot); c.drawImage(rockS[r.k], -r.r - 1, -r.r - 1, r.r * 2 + 2, r.r * 2 + 2); c.restore();
        }
        if (!dead) {
          var fl = 0.75 + Math.random() * 0.35, fy = s.y + shh * 0.42, tilt = clamp((s.tx - s.x) * 0.01, -0.35, 0.35);
          c.save(); c.translate(s.x, s.y); c.rotate(tilt);
          [-1, 1].forEach(function (sd) { var ex = sd * sw * 0.22; c.fillStyle = 'rgba(56,189,248,.55)'; c.beginPath(); c.ellipse(ex, fy - s.y + shh * 0.14 * fl, sw * 0.08, shh * 0.2 * fl * (won ? 1.8 : 1), 0, 0, TAU); c.fill(); c.fillStyle = '#E0F2FE'; c.beginPath(); c.ellipse(ex, fy - s.y + shh * 0.08, sw * 0.04, shh * 0.1 * fl, 0, 0, TAU); c.fill(); });
          c.drawImage(shipS, -sw / 2, -shh / 2, sw, shh);
          c.restore();
        }
        if (big) meteor(c, big.x, big.y, big.r, Math.PI / 2);
      },
      down: function (x) { drag = { o: 0 }; if (!dead && !won) s.tx = clamp(x, sw * 0.6, W - sw * 0.6); }, // the ship follows the finger (a simple tap moves it too)
      move: function (x) { if (drag && !dead && !won) s.tx = clamp(x + drag.o, sw * 0.6, W - sw * 0.6); },
      up: function () { drag = null; },
      boom: function () { drag = null; big = { x: s.x, y: -W * 0.3, r: Math.max(W * 0.2, 40), v: H * 1.9 }; },
      win: function () { won = 0.001; drag = null; }
    };
  }, 'drag', 0.45);

  /* ================================================================== 6. DARTS PRO — tap to throw when the moving aim is on the board */
  boot('dartspro', function (A) {
    var W, H, u, dpr, T, bg, boardS, cx, cy, R, aimT = 0, ax = 0, ay = 0, darts = [], fly = null, clock = 0, lim = 4.5, met = null, dead = false, won = 0, t = 0, ph = 0;
    function boardSprite() {
      var s = R * 2 + 16;
      return mkc(s, s, dpr, function (c) {
        var x = s / 2, i, a0, a1;
        circ(c, x, x + 3, R + 7, 'rgba(0,0,0,.45)');
        circ(c, x, x, R + 7, gl(c, x, x, R + 7, ['#FDE68A', '#B45309', '#451A03']));
        circ(c, x, x, R, '#120B26');
        var rings = [[1, '#F5F3FF', '#1E1B4B'], [0.95, '#F43F5E', '#22C55E'], [0.88, '#F5F3FF', '#1E1B4B'], [0.6, '#F43F5E', '#22C55E'], [0.53, '#F5F3FF', '#1E1B4B']];
        for (var rr = 0; rr < rings.length; rr++) {
          for (i = 0; i < 20; i++) {
            a0 = (i * 18 - 9 - 90) * Math.PI / 180; a1 = a0 + Math.PI / 10;
            c.fillStyle = i % 2 ? rings[rr][1] : rings[rr][2];
            c.beginPath(); c.moveTo(x, x); c.arc(x, x, R * 0.86 * rings[rr][0], a0, a1); c.closePath(); c.fill();
          }
        }
        circ(c, x, x, R * 0.1, '#22C55E'); circ(c, x, x, R * 0.045, '#F43F5E');
        c.strokeStyle = 'rgba(253,230,138,.6)'; c.lineWidth = 1;
        for (i = 0; i < 20; i++) { a0 = (i * 18 - 9 - 90) * Math.PI / 180; c.beginPath(); c.moveTo(x + Math.cos(a0) * R * 0.1, x + Math.sin(a0) * R * 0.1); c.lineTo(x + Math.cos(a0) * R * 0.86, x + Math.sin(a0) * R * 0.86); c.stroke(); }
        c.fillStyle = '#FDE68A'; c.font = '800 ' + Math.max(8, R * 0.09).toFixed(0) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        var NB = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
        for (i = 0; i < 20; i++) { a0 = (i * 18 - 90) * Math.PI / 180; c.fillText(String(NB[i]), x + Math.cos(a0) * R * 0.93, x + Math.sin(a0) * R * 0.93); }
        c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(x - R * 0.35, x - R * 0.45, R * 0.45, R * 0.2, -0.6, 0, TAU); c.fill();
      });
    }
    function dartPath(c, x, y, s, a) {
      c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
      c.strokeStyle = '#CBD5E1'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.stroke();
      c.fillStyle = '#FBBF24'; c.beginPath(); c.moveTo(0, 18); c.lineTo(-7, 30); c.lineTo(0, 27); c.lineTo(7, 30); c.closePath(); c.fill();
      c.fillStyle = '#F43F5E'; c.fillRect(-1.6, 8, 3.2, 7);
      c.restore();
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        R = Math.max(40, Math.min(W * 0.3, (H - T - 24) * 0.36)); cx = W / 2; cy = T + (H - T) * 0.47;
        bg = bgSprite(W, H, dpr, [[0.5, 0.5, 0.5, 'rgba(139,92,246,.32)'], [0.1, 0.1, 0.4, 'rgba(251,191,36,.10)']], A.lite ? 40 : 90);
        boardS = boardSprite();
      },
      reset: function (live) { darts = []; fly = null; met = null; dead = false; won = 0; lim = 5.5; clock = lim; aimT = 0; ph = rnd(0, TAU); },
      step: function (dt, live) {
        t += dt;
        var lv = A.lv(), sp = (live ? 1 + 0.9 * lv : 0.6);
        if (!fly && !dead && !won && !met) aimT += dt * sp;
        var Aa = R * 1.32;
        ax = cx + Aa * Math.sin(aimT * 1.55 + ph); ay = cy + Aa * 0.82 * Math.sin(aimT * 2.15);
        if (fly) {
          fly.p += dt / 0.22;
          if (fly.p >= 1) {
            var d = Math.hypot(fly.x - cx, fly.y - cy);
            if (d <= R * 0.86) {
              darts.push({ x: fly.x, y: fly.y }); if (darts.length > 3) darts.shift();
              A.burst(fly.x, fly.y, 10, ['#FDE68A', '#FFFFFF'], 120, 0.4, 2.4);
              if (d < R * 0.1) A.ring(fly.x, fly.y, R * 0.5, '#4ADE80');
              clock = lim = Math.max(3, 5.5 - 2 * A.lv());
            } else if (A.fail(A.l.fail)) { dead = true; A.burst(fly.x, fly.y, 12, ['#94A3B8', '#F43F5E'], 140, 0.5, 2.6); }
            fly = null;
          }
        } else if (A.live() && !dead && !met) { clock -= dt; if (clock <= 0 && A.fail(A.l.late)) dead = true; }
        if (met) {
          met.x += met.vx * dt; met.y += met.vy * dt;
          if (!met.hit && met.y >= cy) { met.hit = 1; dead = true; darts = []; A.explode(cx, cy, 2.2); }
          if (met.hit) met = null;
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var bs = R * 2 + 16, sc = dead && !fly ? 1 : 1;
        if (!(dead && !darts.length && !fly)) c.drawImage(boardS, cx - bs / 2, cy - bs / 2, bs * sc, bs * sc);
        else { c.globalAlpha = 0.35; c.drawImage(boardS, cx - bs / 2, cy - bs / 2, bs, bs); c.globalAlpha = 1; }
        // throw clock: gold arc around the board
        if (A.live() && !dead) {
          var k = clamp(clock / lim, 0, 1);
          c.strokeStyle = k < 0.3 ? '#F43F5E' : '#FBBF24'; c.lineWidth = 4; c.lineCap = 'round';
          c.beginPath(); c.arc(cx, cy, R + 12, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
        }
        for (var i = 0; i < darts.length; i++) dartPath(c, darts[i].x, darts[i].y, Math.max(0.8, R / 110), 0.35);
        if (fly) { var p = ease(fly.p), fx = fly.sx + (fly.x - fly.sx) * p, fy = fly.sy + (fly.y - fly.sy) * p; dartPath(c, fx, fy, Math.max(0.8, R / 110) * (2.2 - 1.2 * p), 0.35); }
        // moving aim: green on the board, red outside (always readable)
        if (!dead && !won && !met) {
          var on = Math.hypot(ax - cx, ay - cy) <= R * 0.86, col = on ? '#4ADE80' : '#F43F5E', rr = Math.max(10, R * 0.12);
          c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(ax, ay, rr, 0, TAU); c.stroke();
          c.beginPath(); c.moveTo(ax - rr * 1.6, ay); c.lineTo(ax - rr * 0.5, ay); c.moveTo(ax + rr * 0.5, ay); c.lineTo(ax + rr * 1.6, ay); c.moveTo(ax, ay - rr * 1.6); c.lineTo(ax, ay - rr * 0.5); c.moveTo(ax, ay + rr * 0.5); c.lineTo(ax, ay + rr * 1.6); c.stroke();
          circ(c, ax, ay, 2.5, col);
        }
        if (met) meteor(c, met.x, met.y, met.r, Math.atan2(met.vy, met.vx));
      },
      down: function () { if (fly || dead || met || won) return; fly = { sx: W / 2, sy: H + 30, x: ax, y: ay, p: 0 }; },
      dbg: function () { return { on: Math.hypot(ax - cx, ay - cy) <= R * 0.86, ready: !fly }; },
      boom: function () { fly = null; met = { x: -W * 0.2, y: T - 30, r: Math.max(18, R * 0.3), vx: 0, vy: 0 }; met.vx = (cx - met.x) / 0.65; met.vy = (cy - met.y) / 0.65; },
      win: function () { won = 0.001; }
    };
  }, 'tap', 0.29);
})(window.D6 = window.D6 || {});
