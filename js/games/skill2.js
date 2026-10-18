/* v2805 — "You're in control" group 2 (owner request): Star Archer, Fruit Slicer, Chicken Road, Hamster Run, Asteroid Dodge,
   Darts Pro — MIXED MODE like Aviator, but the player plays. One gesture each (drag / swipe / tap), canvas 2D at 60 fps.
   The multiplier follows the SERVER clock (×e^(rate·s), casino_ext.php 'skill'); the player cashes out with the gold button,
   or loses on a mistake (K.multi 'fail'); the server's secret end shows an unavoidable event (meteor, comet, supernova…).
   This file only draws: the server decides and pays. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit;
  if (!K) return;
  var $ = K.$, TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ texts (12 languages) */
  var C = {
    en: { go: 'Bet to start', bet: 'Bet', cash: 'Cash out', won: 'Cashed out', r1: 'Bet and play: the multiplier grows while you play.', r3: 'The round can also end at any random moment (like Aviator): cash out before!' },
    fr: { go: 'Mise pour jouer', bet: 'Miser', cash: 'Encaisser', won: 'Encaissé', r1: 'Mise et joue : le multiplicateur monte pendant que tu joues.', r3: 'La partie peut aussi s’arrêter à tout moment, au hasard (comme Aviator) : encaisse avant !' },
    es: { go: 'Apuesta para jugar', bet: 'Apostar', cash: 'Retirar', won: 'Retirado', r1: 'Apuesta y juega: el multiplicador sube mientras juegas.', r3: 'La ronda también puede terminar en cualquier momento al azar (como Aviator): ¡retira antes!' },
    pt: { go: 'Aposte para jogar', bet: 'Apostar', cash: 'Sacar', won: 'Sacado', r1: 'Aposte e jogue: o multiplicador sobe enquanto você joga.', r3: 'A rodada também pode terminar a qualquer momento, ao acaso (como no Aviator): saque antes!' },
    ar: { go: 'راهن لتبدأ', bet: 'راهن', cash: 'اسحب', won: 'تم السحب', r1: 'راهن والعب: يرتفع المضاعف أثناء لعبك.', r3: 'قد تنتهي الجولة أيضًا في أي لحظة عشوائية (مثل Aviator): اسحب قبلها!' },
    tr: { go: 'Başlamak için bahis', bet: 'Bahis', cash: 'Çek', won: 'Çekildi', r1: 'Bahis yap ve oyna: sen oynarken çarpan yükselir.', r3: 'Tur her an rastgele de bitebilir (Aviator gibi): önce çek!' },
    vi: { go: 'Đặt cược để chơi', bet: 'Cược', cash: 'Rút tiền', won: 'Đã rút', r1: 'Đặt cược và chơi: hệ số nhân tăng khi bạn chơi.', r3: 'Ván cũng có thể kết thúc ngẫu nhiên bất cứ lúc nào (như Aviator): hãy rút trước!' },
    id: { go: 'Pasang untuk main', bet: 'Pasang', cash: 'Tarik', won: 'Ditarik', r1: 'Pasang dan main: pengali naik selama kamu bermain.', r3: 'Ronde juga bisa berakhir kapan saja secara acak (seperti Aviator): tarik sebelumnya!' },
    ru: { go: 'Сделай ставку', bet: 'Ставка', cash: 'Забрать', won: 'Забрано', r1: 'Сделай ставку и играй: множитель растёт, пока ты играешь.', r3: 'Раунд может закончиться и в любой случайный момент (как в Aviator): забери раньше!' },
    de: { go: 'Setze zum Starten', bet: 'Setzen', cash: 'Auszahlen', won: 'Ausgezahlt', r1: 'Setze und spiele: Der Multiplikator steigt, während du spielst.', r3: 'Die Runde kann auch jederzeit zufällig enden (wie bei Aviator): zahle vorher aus!' },
    hi: { go: 'खेलने को दांव लगाएँ', bet: 'दांव', cash: 'कैश आउट', won: 'कैश आउट हुआ', r1: 'दांव लगाएँ और खेलें: खेलते समय गुणक बढ़ता है।', r3: 'राउंड किसी भी समय अचानक खत्म हो सकता है (Aviator की तरह): पहले कैश आउट करें!' },
    zh: { go: '下注开始', bet: '下注', cash: '兑现', won: '已兑现', r1: '下注并开始：游戏进行中倍数不断上升。', r3: '回合也可能在任意随机时刻结束（如 Aviator）：请提前兑现！' }
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
      stars(c, W, H, n);
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
  function rockSprite(R, dpr) {
    return mkc(R * 2 + 2, R * 2 + 2, dpr, function (c) {
      var cx = R + 1, cy = R + 1, n = 11;
      c.beginPath();
      for (var i = 0; i < n; i++) { var a = i / n * TAU, rr = R * rnd(0.8, 1); if (i) c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else c.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      c.closePath(); c.fillStyle = gl(c, cx, cy, R, ['#E4DCF2', '#9A8DB8', '#4A3D68', '#2A2142']); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = Math.max(1, R * 0.05); c.stroke();
      for (var k = 0; k < 4; k++) {
        var b = Math.random() * TAU, d = Math.random() * R * 0.5, cr = R * rnd(0.1, 0.22), x = cx + Math.cos(b) * d, y = cy + Math.sin(b) * d;
        circ(c, x, y, cr, 'rgba(36,26,64,.5)'); circ(c, x - cr * 0.2, y - cr * 0.2, cr * 0.6, 'rgba(255,255,255,.1)');
      }
    });
  }

  /* hand hints (one per gesture): tap = ripple; swipe = finger sweeping; lr = arrows left / right; drag = finger sliding */
  var FINGER = '<path d="M11 21V9.5a2 2 0 0 1 4 0V16m0-2a2 2 0 0 1 4 0v2m0-1a2 2 0 0 1 4 0v5c0 4.5-3 8-7.5 8H14c-2.4 0-4-1-5.3-2.9L6 23a2 2 0 0 1 3.2-2.4L11 23"/>';
  var HAND = {
    tap: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="sk-rip" cx="13" cy="9" r="6"/>' + FINGER + '</svg>',
    swipe: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-trail" d="M3 6c5 3 12 4 20 1"/>' + FINGER + '</svg>',
    lr: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 9l5-4v8zM31 9l-5-4v8z"/>' + FINGER + '</svg>',
    drag: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 9l5-4v8zM31 9l-5-4v8z"/>' + FINGER + '</svg>'
  };

  /* ------------------------------------------------------------------ shared engine (round flow + canvas loop) */
  function boot(key, mk, gest) {
    K.register(key, function (box) {
      var l = L(key), lite = document.documentElement.classList.contains('oro-lite'), hist = [];
      try { hist = JSON.parse(localStorage.getItem('cg_' + key + '_h') || '[]').slice(0, 12); } catch (e) { hist = []; }
      box.classList.add('cg-game', 'cg-s2', 'cg-' + key);
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
        lv: function () { return Math.min(1, playT / 55); },               // difficulty rises slowly over ~1 min
        live: function () { return phase === 'play'; },
        fail: function (why) {                                              // the player's own mistake
          if (phase !== 'play') return false;
          phase = 'failing'; say(why, 'lost'); setBtn(l.bet, '', 'wait'); btn.disabled = true;
          sendFail(); return true;
        },
        burst: function (x, y, n, cols, sp, life, sz) {
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
          A.burst(x, y, 34, ['#FFF7ED', '#FDE68A', '#FB923C', '#F43F5E', '#C4B5FD'], 260 * s, 0.9, 3.4 * Math.sqrt(s));
          A.ring(x, y, 70 * s, '#FDBA74'); shake = Math.max(shake, 0.45); flash = Math.max(flash, 0.55);
        },
        shake: function (a) { shake = Math.max(shake, a); },
        flash: function (a) { flash = Math.max(flash, a); }
      };
      var g = mk(A);

      function say(t, cls) { K.setText(msgEl, t || ''); mEl.classList.remove('won', 'lost', 'idle'); if (cls) mEl.classList.add(cls); }
      function tx(el, s) { if (el.textContent === s) return; if (el.textContent.length !== s.length) K.setText(el, s); else el.textContent = s; }
      function setBtn(main, sub, cls) {
        btn.classList.remove('cash', 'wait');
        if (cls) btn.classList.add(cls);
        if (sub) { btn.innerHTML = '<span class="fit s2-b1"></span><span class="fit s2-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
        else { btn.innerHTML = ''; K.setText(btn, main); }
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
        phase = 'play'; mShown = ''; hintT = 9; gN = 0; box.setAttribute('data-gn', '0'); say('', ''); hintOn(true);
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

      // ONE gesture on the WHOLE scene (pointer events, no 300 ms delay); every touch shows a ripple
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
        RG.push({ x: p[0], y: p[1], r: 24, t: 0.25, c: 'rgba(255,255,255,.85)' });
        if (phase === 'play') { gN++; box.setAttribute('data-gn', String(gN)); g.down(p[0], p[1]); }
        else { if (practice()) g.down(p[0], p[1]); if (phase === 'idle') nudge(); }
      });
      cv.addEventListener('pointermove', function (e) { if ((phase === 'play' || practice()) && g.move) { var p = pt(e); g.move(p[0], p[1]); } });
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
      requestAnimationFrame(function () { resize(); cancelAnimationFrame(K.S.raf || 0); K.S.raf = requestAnimationFrame(loop); });
      // a round still running (page reloaded, game reopened): pick it up
      if (!K.guest()) K.multi(key, 'state', null, true).then(function (r) { if (r && !r.done && r.t0 && box.isConnected && phase === 'idle') { r.resume = 1; requestAnimationFrame(function () { begin(r); }); } });
    }, { rules: rules(key) });
  }

  /* ================================================================== 1. STAR ARCHER — drag back, release, hit the moving target */
  boot('archer', function (A) {
    var W, H, u, dpr, T, bg, tgS, man, tg = {}, wind = 0, aim = null, arrow = null, stuck = null, clock = 0, lim = 6, met = null, dead = false, won = 0, t = 0, streaks = [];
    function newTarget(first) {
      var lv = A.lv();
      tg.r = Math.max(14, (8.6 - 2.6 * lv) * u);
      tg.y = Math.max(T + tg.r + 6, H * 0.34);
      tg.x = first ? W / 2 : (Math.random() < 0.5 ? -tg.r : W + tg.r);
      tg.v = W * (0.12 + 0.2 * lv) * (Math.random() < 0.5 ? -1 : 1);
      if (!first) tg.v = Math.abs(tg.v) * (tg.x < 0 ? 1 : -1);
      tg.in = first ? 1 : 0;
      wind = (Math.random() * 2 - 1) * (0.25 + 0.75 * lv);
      lim = 6.2 - 1.8 * lv; clock = lim;
    }
    function bow() { return [W / 2, H - Math.max(40, 16 * u) * 0.75 - 6]; }
    function aimAng() { if (!aim || !aim.ok) return -Math.PI / 2; return aim.a; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        bg = bgSprite(W, H, dpr, [[0.2, 0.25, 0.5, 'rgba(139,92,246,.30)'], [0.85, 0.7, 0.45, 'rgba(236,72,153,.16)']], A.lite ? 40 : 90);
        var r = Math.max(14, 8.6 * u);
        tgS = mkc(r * 2 + 4, r * 2 + 4, dpr, function (c) {
          var cx = r + 2, cols = ['#FDE68A', '#F43F5E', '#FFF7ED', '#F43F5E', '#FBBF24'];
          circ(c, cx, cx + 1.5, r, 'rgba(0,0,0,.35)');
          for (var i = 0; i < 5; i++) circ(c, cx, cx, r * (1 - i * 0.19), cols[i]);
          c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(cx - r * 0.35, cx - r * 0.45, r * 0.35, r * 0.18, -0.6, 0, TAU); c.fill();
        });
        var mw = Math.max(40, 16 * u), mh = mw * 1.17;
        man = mkc(mw, mh, dpr, function (c) { // little astronaut archer (body; the bow is drawn live)
          circ(c, mw / 2, mh * 0.78, mw * 0.32, gl(c, mw / 2, mh * 0.78, mw * 0.32, ['#FFFFFF', '#C4B5FD', '#5B21B6']));
          circ(c, mw / 2, mh * 0.36, mw * 0.3, gl(c, mw / 2, mh * 0.36, mw * 0.3, ['#FFFFFF', '#E2E8F0', '#64748B']));
          c.fillStyle = gl(c, mw / 2, mh * 0.38, mw * 0.2, ['#FEF3C7', '#F59E0B', '#78350F']); c.beginPath(); c.ellipse(mw / 2, mh * 0.38, mw * 0.2, mh * 0.12, 0, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(mw * 0.43, mh * 0.34, mw * 0.06, mh * 0.03, -0.5, 0, TAU); c.fill();
        });
        streaks = []; for (var i = 0; i < (A.lite ? 6 : 14); i++) streaks.push({ x: Math.random() * W, y: rnd(T, H * 0.75), l: rnd(10, 26) });
        if (tg.r == null) newTarget(true);
      },
      reset: function (live) { aim = null; arrow = null; stuck = null; met = null; dead = false; won = 0; tg = {}; newTarget(true); if (!live) { wind = 0.4; clock = lim; } },
      step: function (dt, live) {
        t += dt;
        var lv = A.lv();
        if (tg.in < 1) tg.in = Math.min(1, tg.in + dt * 2.5);
        tg.x += tg.v * dt;
        if (tg.x < tg.r && tg.v < 0 && tg.in >= 1) tg.v = -tg.v;
        if (tg.x > W - tg.r && tg.v > 0 && tg.in >= 1) tg.v = -tg.v;
        tg.yy = tg.y + Math.sin(t * 1.7) * 3 * u * lv;
        for (var i = 0; i < streaks.length; i++) { var s = streaks[i]; s.x += wind * W * 0.35 * dt + (wind >= 0 ? 8 : -8) * dt; if (s.x > W + 30) s.x = -30; if (s.x < -30) s.x = W + 30; }
        if (arrow) {
          arrow.vx += wind * W * 0.9 * dt; arrow.x += arrow.vx * dt; arrow.y += arrow.vy * dt;
          if (arrow.y <= tg.yy) {
            var dx = arrow.x - tg.x;
            if (Math.abs(dx) <= tg.r * 1.02 && !dead) {
              stuck = { dx: dx, a: Math.atan2(arrow.vy, arrow.vx), t: 0.45 };
              A.burst(arrow.x, tg.yy, 16, ['#FDE68A', '#FFF7ED', '#F43F5E'], 160, 0.5, 3); A.ring(tg.x, tg.yy, tg.r * 1.6, '#FDE68A');
              arrow = null;
            } else if (arrow.y < -20 || arrow.x < -20 || arrow.x > W + 20 || arrow.y < tg.yy - tg.r * 2) {
              if (live && A.fail(A.l.fail)) { dead = 2; } arrow = null;
            }
          } else if (arrow.x < -20 || arrow.x > W + 20) { if (live && A.fail(A.l.fail)) dead = 2; arrow = null; }
        }
        if (stuck) { stuck.t -= dt; if (stuck.t <= 0) { stuck = null; if (live) newTarget(false); } }
        if (live && !arrow && !stuck && !dead && !met && tg.in >= 1) { clock -= dt; if (clock <= 0 && A.fail(A.l.late)) dead = 2; }
        if (met) {
          met.x += met.vx * dt; met.y += met.vy * dt;
          var b = bow();
          if (!met.hit && met.y >= b[1] - 4 * u) { met.hit = 1; dead = 1; A.explode(b[0], b[1] - 4 * u, 1.6); }
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        // wind streaks + wind gauge (arrow + strength, numbers only)
        c.strokeStyle = 'rgba(196,181,253,.35)'; c.lineWidth = 1.2; c.beginPath();
        var wl = Math.abs(wind) * 1.6 + 0.4;
        for (var i = 0; i < streaks.length; i++) { var s = streaks[i]; c.moveTo(s.x, s.y); c.lineTo(s.x - Math.sign(wind || 1) * s.l * wl, s.y); }
        c.stroke();
        var gx = 50, gy = H - 22; // wind gauge: bottom-left corner, clear of every text
        c.fillStyle = 'rgba(10,6,30,.6)'; c.beginPath(); c.roundRect ? c.roundRect(gx - 34, gy - 13, 76, 26, 13) : c.rect(gx - 34, gy - 13, 76, 26); c.fill();
        c.save(); c.translate(gx - 14, gy); if (wind < 0) c.scale(-1, 1);
        c.strokeStyle = '#7DD3FC'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-12, 0); c.lineTo(10, 0); c.moveTo(4, -6); c.lineTo(11, 0); c.lineTo(4, 6); c.stroke(); c.restore();
        c.fillStyle = '#E0F2FE'; c.font = '900 13px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText((Math.abs(wind) * 5).toFixed(1), gx + 22, gy + 1);
        // target + shot clock ring
        var ty = tg.yy == null ? tg.y : tg.yy;
        c.globalAlpha = tg.in; c.drawImage(tgS, tg.x - tg.r - 2, ty - tg.r - 2, tg.r * 2 + 4, tg.r * 2 + 4); c.globalAlpha = 1;
        if (A.live() && !stuck && !dead) {
          var k = clamp(clock / lim, 0, 1);
          c.strokeStyle = k < 0.3 ? '#F43F5E' : '#FBBF24'; c.lineWidth = 3.5; c.lineCap = 'round';
          c.beginPath(); c.arc(tg.x, ty, tg.r + 7, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
        }
        if (stuck) { var ax = tg.x + stuck.dx; c.save(); c.translate(ax, ty); c.rotate(stuck.a); arrowPath(c, -22, 0); c.restore(); }
        // aim preview (straight line, wind not included)
        var b = bow(), a = aimAng();
        if (aim && aim.ok && !arrow && !dead) {
          c.strokeStyle = 'rgba(253,230,138,.85)'; c.lineWidth = 2.4; c.setLineDash([6, 8]); c.beginPath();
          var len = Math.min((b[1] - ty) * 0.75 / Math.max(0.3, -Math.sin(a)), H);
          c.moveTo(b[0], b[1]); c.lineTo(b[0] + Math.cos(a) * len, b[1] + Math.sin(a) * len); c.stroke(); c.setLineDash([]);
        }
        if (arrow) { c.save(); c.translate(arrow.x, arrow.y); c.rotate(Math.atan2(arrow.vy, arrow.vx)); arrowPath(c, 0, 0); c.restore(); }
        if (dead !== 1) {
          var mw = Math.max(40, 16 * u), mh = mw * 1.17, jy = won ? -Math.abs(Math.sin(won * 9)) * 5 * u : 0;
          c.drawImage(man, b[0] - mw / 2, b[1] - mh * 0.55 + jy, mw, mh);
          // bow (rotates with the aim), string pulled while aiming
          c.save(); c.translate(b[0], b[1] - 2 * u + jy); c.rotate(a + Math.PI / 2);
          var br = Math.max(24, 9 * u), pull = aim && aim.ok ? Math.min(aim.d, 60) / 60 * 3.5 * u : 0;
          c.strokeStyle = '#FBBF24'; c.lineWidth = Math.max(2.5, 1.1 * u); c.lineCap = 'round';
          c.beginPath(); c.arc(0, br * 0.55, br, -Math.PI * 0.82, -Math.PI * 0.18); c.stroke();
          var ex = Math.cos(-Math.PI * 0.82) * br, ey = br * 0.55 + Math.sin(-Math.PI * 0.82) * br;
          c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ex, ey); c.lineTo(0, ey + pull); c.lineTo(-ex, ey); c.stroke();
          if (!arrow && !stuck && !dead) { c.rotate(-Math.PI / 2); arrowPath(c, -(ey + pull) + 26, 0); }
          c.restore();
        }
        if (met) meteor(c, met.x, met.y, met.r, Math.atan2(met.vy, met.vx));
      },
      down: function (x, y) { if (arrow || stuck || dead) return; aim = { sx: x, sy: y, ok: false, a: -Math.PI / 2, d: 0 }; },
      move: function (x, y) {
        if (!aim) return;
        var vx = aim.sx - x, vy = aim.sy - y, d = Math.hypot(vx, vy);
        aim.d = d; aim.ok = d > 10 && vy < -2;
        if (aim.ok) aim.a = clamp(Math.atan2(vy, vx), -Math.PI * 0.94, -Math.PI * 0.06);
      },
      up: function (x, y, live) {
        if (!aim) return;
        var ok = aim.ok && aim.d > 14 && live && !arrow && !stuck && !dead, a = aim.a; aim = null;
        if (!ok) return;
        var b = bow(), V = Math.max(260, (b[1] - tg.y) / 0.42);
        arrow = { x: b[0] + Math.cos(a) * 20, y: b[1] - 2 * u + Math.sin(a) * 20, vx: Math.cos(a) * V, vy: Math.sin(a) * V };
      },
      boom: function () { var b = bow(); aim = null; met = { x: W * 1.1, y: T - 20, r: Math.max(16, 9 * u), vx: 0, vy: 0 }; met.vx = (b[0] - met.x) / 0.7; met.vy = (b[1] - met.y) / 0.7; },
      win: function () { won = 0.001; aim = null; }
    };
    function arrowPath(c, x0, y0) {
      c.strokeStyle = '#E2E8F0'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0 - 26, y0); c.lineTo(x0 + 2, y0); c.stroke();
      c.fillStyle = '#FBBF24'; c.beginPath(); c.moveTo(x0 + 7, y0); c.lineTo(x0, y0 - 4); c.lineTo(x0, y0 + 4); c.closePath(); c.fill();
      c.fillStyle = '#F43F5E'; c.beginPath(); c.moveTo(x0 - 26, y0); c.lineTo(x0 - 31, y0 - 4.5); c.lineTo(x0 - 22, y0); c.lineTo(x0 - 31, y0 + 4.5); c.closePath(); c.fill();
    }
  }, 'tap');

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
      var x0 = rnd(0.12, 0.88) * W, top = Math.max(T + r, H * 0.12), peak = rnd(top, Math.max(top + 1, H * 0.45));
      var vy = -Math.sqrt(2 * gv * (H + r - peak)), tp = -vy / gv, xt = rnd(0.25, 0.75) * W;
      ob.push({ x: x0, y: H + r, vx: (xt - x0) / tp * 0.7, vy: vy, r: r, k: bomb ? -1 : (Math.random() * 4) | 0, rot: rnd(0, TAU), vr: rnd(-3, 3), live: live });
      return bomb;
    }
    function segHit(o, x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy, k = L2 ? clamp(((o.x - x1) * dx + (o.y - y1) * dy) / L2, 0, 1) : 0;
      var px = x1 + dx * k - o.x, py = y1 + dy * k - o.y;
      return px * px + py * py < o.r * o.r * 0.85;
    }
    function cut(o, a) {
      if (o.k < 0) return;
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
          var o = ob[i]; o.vy += gv * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
          if (o.y > H + o.r * 1.5 && o.vy > 0) {
            ob.splice(i, 1);
            if (o.k >= 0 && o.live && playing) { miss++; A.ring(clamp(o.x, 20, W - 20), H - 6, 40, '#F43F5E'); if (miss >= 3) A.fail(A.l.late); }
          }
        }
        for (i = halves.length - 1; i >= 0; i--) { var hh = halves[i]; hh.t += dt; hh.vy += gv * dt; hh.x += hh.vx * dt; hh.y += hh.vy * dt; hh.rot += hh.vr * dt; if (hh.y > H + hh.r * 2) halves.splice(i, 1); }
        var now = performance.now();
        while (trail.length && now - trail[0][2] > 140) trail.shift();
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
          c.strokeStyle = 'rgba(167,139,250,.45)'; c.lineWidth = 9; c.beginPath(); c.moveTo(trail[0][0], trail[0][1]); for (i = 1; i < trail.length; i++) c.lineTo(trail[i][0], trail[i][1]); c.stroke();
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
      down: function (x, y) { down = true; trail = [[x, y, performance.now()]]; },
      move: function (x, y) {
        if (!down || nova) return;
        var p = trail[trail.length - 1], now = performance.now();
        if (!p) { trail.push([x, y, now]); return; }
        if (Math.abs(x - p[0]) + Math.abs(y - p[1]) < 2) return;
        trail.push([x, y, now]); if (trail.length > 12) trail.shift();
        var a = Math.atan2(y - p[1], x - p[0]);
        for (var i = ob.length - 1; i >= 0; i--) {
          var o = ob[i];
          if (!segHit(o, p[0], p[1], x, y)) continue;
          if (o.k < 0) { if (A.fail(A.l.fail)) { A.explode(o.x, o.y, 1.4); ob.splice(i, 1); } return; }
          ob.splice(i, 1); cut(o, a);
        }
      },
      up: function () { down = false; },
      boom: function () { down = false; var r = FR * 2.2; nova = { x: W / 2, y: H + r, r: r, vy: -Math.sqrt(2 * gv * (H * 0.55)) }; },
      win: function () { for (var i = 0; i < ob.length; i++) if (ob[i].k >= 0) A.burst(ob[i].x, ob[i].y, 6, ['#FDE68A', '#FFFFFF'], 120, 0.5, 2.6); ob = ob.filter(function (o) { return o.k < 0; }); }
    };
  }, 'swipe');

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
    function shipSprite(k) {
      var w = SH[k][0] * rowH, h = SH[k][1] * rowH;
      return mkc(w, h, dpr, function (c) { // all face right
        if (k === 0) { // saucer
          c.fillStyle = gl(c, w * 0.5, h * 0.35, w * 0.22, ['#ECFEFF', '#67E8F9', '#0E7490']); c.beginPath(); c.ellipse(w / 2, h * 0.42, w * 0.2, h * 0.3, 0, Math.PI, 0); c.fill();
          c.fillStyle = gl(c, w / 2, h * 0.55, w * 0.5, ['#F5F3FF', '#A78BFA', '#4C1D95']); c.beginPath(); c.ellipse(w / 2, h * 0.58, w * 0.48, h * 0.2, 0, 0, TAU); c.fill();
          c.fillStyle = '#FDE68A'; for (var i = 0; i < 4; i++) { c.beginPath(); c.arc(w * (0.24 + i * 0.17), h * 0.6, h * 0.05, 0, TAU); c.fill(); }
        } else if (k === 1) { // rocket
          c.fillStyle = '#FB923C'; c.beginPath(); c.moveTo(w * 0.18, h * 0.5); c.lineTo(0, h * 0.28); c.lineTo(0, h * 0.72); c.closePath(); c.fill();
          var g = c.createLinearGradient(0, h * 0.2, 0, h * 0.8); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#E2E8F0'); g.addColorStop(1, '#64748B');
          c.fillStyle = g; c.beginPath(); c.moveTo(w * 0.15, h * 0.24); c.lineTo(w * 0.7, h * 0.24); c.quadraticCurveTo(w, h * 0.5, w * 0.7, h * 0.76); c.lineTo(w * 0.15, h * 0.76); c.closePath(); c.fill();
          c.fillStyle = '#E11D48'; c.beginPath(); c.moveTo(w * 0.15, h * 0.24); c.lineTo(w * 0.32, h * 0.24); c.lineTo(w * 0.2, h * 0.02); c.closePath(); c.fill(); c.beginPath(); c.moveTo(w * 0.15, h * 0.76); c.lineTo(w * 0.32, h * 0.76); c.lineTo(w * 0.2, h * 0.98); c.closePath(); c.fill();
          circ(c, w * 0.62, h * 0.5, h * 0.12, gl(c, w * 0.62, h * 0.5, h * 0.12, ['#E0F2FE', '#38BDF8', '#0C4A6E']));
        } else { // cargo hauler
          var q = c.createLinearGradient(0, h * 0.15, 0, h * 0.85); q.addColorStop(0, '#C4B5FD'); q.addColorStop(0.5, '#7C3AED'); q.addColorStop(1, '#3B0764');
          c.fillStyle = q; c.beginPath(); c.moveTo(w * 0.04, h * 0.2); c.lineTo(w * 0.8, h * 0.2); c.lineTo(w * 0.98, h * 0.5); c.lineTo(w * 0.8, h * 0.8); c.lineTo(w * 0.04, h * 0.8); c.closePath(); c.fill();
          c.fillStyle = '#FBBF24'; c.fillRect(w * 0.1, h * 0.32, w * 0.5, h * 0.12); c.fillRect(w * 0.1, h * 0.56, w * 0.5, h * 0.12);
          circ(c, w * 0.82, h * 0.5, h * 0.11, '#7DD3FC');
        }
      });
    }
    function cy() { return hop ? lerpY() : j * rowH; }
    function lerpY() { return (j + ease(hop.p)) * rowH; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        rowH = Math.max(52, Math.min(H / 4.4, W * 0.34)); sh = rowH * 0.46; cw = Math.min(rowH * 0.42, W * 0.15); ch = cw * 1.15; // the chicken fits on its platform
        bg = bgSprite(W, H, dpr, [[0.8, 0.2, 0.5, 'rgba(139,92,246,.28)'], [0.15, 0.7, 0.45, 'rgba(251,191,36,.10)']], A.lite ? 40 : 90);
        stripS = mkc(W, sh, dpr, function (c) {
          var g = c.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, '#6D5BA8'); g.addColorStop(0.5, '#4A3B7E'); g.addColorStop(1, '#2C2156');
          c.fillStyle = g; c.fillRect(0, 0, W, sh);
          for (var i = 0; i < W / 14; i++) circ(c, Math.random() * W, rnd(sh * 0.2, sh * 0.8), rnd(1, sh * 0.16), 'rgba(20,12,48,.35)');
          c.fillStyle = 'rgba(253,230,138,.55)'; c.fillRect(0, 0, W, 1.5); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, sh - 2, W, 2);
        });
        ckS = mkc(cw, ch, dpr, function (c) { // cosmic chicken in a glass helmet
          var x = cw / 2;
          c.fillStyle = '#F59E0B'; c.fillRect(x - cw * 0.17, ch * 0.86, cw * 0.08, ch * 0.13); c.fillRect(x + cw * 0.09, ch * 0.86, cw * 0.08, ch * 0.13);
          c.fillStyle = gl(c, x, ch * 0.64, cw * 0.4, ['#FFFFFF', '#F5F3FF', '#C4B5FD']); c.beginPath(); c.ellipse(x, ch * 0.64, cw * 0.38, ch * 0.27, 0, 0, TAU); c.fill();
          c.fillStyle = '#E9E5FF'; c.beginPath(); c.ellipse(x - cw * 0.36, ch * 0.64, cw * 0.1, ch * 0.14, 0.4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + cw * 0.36, ch * 0.64, cw * 0.1, ch * 0.14, -0.4, 0, TAU); c.fill();
          circ(c, x, ch * 0.33, cw * 0.24, gl(c, x, ch * 0.33, cw * 0.24, ['#FFFFFF', '#F8FAFC', '#CBD5E1']));
          c.fillStyle = '#EF4444'; circ(c, x - cw * 0.07, ch * 0.1, cw * 0.07, '#EF4444'); circ(c, x + cw * 0.04, ch * 0.08, cw * 0.08, '#EF4444'); circ(c, x + cw * 0.13, ch * 0.12, cw * 0.06, '#EF4444');
          c.fillStyle = '#F59E0B'; c.beginPath(); c.moveTo(x - cw * 0.06, ch * 0.37); c.lineTo(x + cw * 0.06, ch * 0.37); c.lineTo(x, ch * 0.46); c.closePath(); c.fill();
          circ(c, x - cw * 0.09, ch * 0.3, cw * 0.035, '#1E1B4B'); circ(c, x + cw * 0.09, ch * 0.3, cw * 0.035, '#1E1B4B');
          c.strokeStyle = 'rgba(186,230,253,.8)'; c.lineWidth = Math.max(1.5, cw * 0.035); c.beginPath(); c.arc(x, ch * 0.3, cw * 0.33, 0, TAU); c.stroke();
          c.strokeStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(x, ch * 0.3, cw * 0.27, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
        });
        shipS = [0, 1, 2].map(shipSprite);
        var lt = rowH - sh;
        laneS = mkc(W + 28, lt, dpr, function (c) {
          c.fillStyle = 'rgba(8,5,26,.55)'; c.fillRect(0, 0, W + 28, lt);
          c.fillStyle = 'rgba(167,139,250,.35)'; for (var x = 0; x < W + 28; x += 28) c.fillRect(x, lt / 2 - 1, 14, 2);
        });
        lanes = {};
      },
      reset: function () { lanes = {}; j = 0; hop = null; queued = false; cam = 0; dead = 0; fall = 0; comet = null; won = 0; lim = 4.2; tmr = lim; },
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
            hop = null; j++; tmr = lim = Math.max(2.4, 4.2 - 1.6 * A.lv());
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
          c.drawImage(ckS, W / 2 - cw / 2, cy0, cw, ch);
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
      down: function () { if (dead || comet) return; if (hop) { if (hop.p > 0.5) queued = true; return; } hop = { p: 0 }; },
      boom: function () { comet = { x: -W * 0.5, y: Y(cy()) - ch * 0.45, r: Math.max(18, rowH * 0.42), v: W * 2.4 }; hop = null; queued = false; },
      win: function () { won = 0.001; queued = false; }
    };
  }, 'tap');

  /* ================================================================== 4. HAMSTER RUN — 3 lanes in a space tube, tap left / right */
  boot('hamster', function (A) {
    var W, H, u, dpr, T, bg, hamS = [], obS = [], hy, ny, lw, F = 5, lane = 0, hx = 0, obs = [], rowT = 0, ringP = 0, dead = false, wall = null, t = 0, won = 0, spd = 0.5, lastFree = 0;
    function P(z) { return 1 / (1 + F * z); }
    function SY(z) { return hy + (ny - hy) * P(z); }
    function SX(lx, z) { return W / 2 + lx * lw * P(z); }
    function hamSprite(f) {
      var w = lw * 0.62, h = w * 1.05;
      return mkc(w, h, dpr, function (c) { // seen from behind, running
        var x = w / 2;
        c.fillStyle = '#FDA4AF'; c.beginPath(); c.ellipse(x - w * 0.2, h * (f ? 0.9 : 0.94), w * 0.1, h * 0.06, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + w * 0.2, h * (f ? 0.94 : 0.9), w * 0.1, h * 0.06, 0, 0, TAU); c.fill();
        c.fillStyle = gl(c, x, h * 0.58, w * 0.46, ['#FFE7C2', '#F5A65B', '#B45309', '#7C2D12']); c.beginPath(); c.ellipse(x, h * 0.6, w * 0.44, h * 0.34, 0, 0, TAU); c.fill();
        circ(c, x - w * 0.25, h * 0.25, w * 0.1, '#C2410C'); circ(c, x + w * 0.25, h * 0.25, w * 0.1, '#C2410C');
        circ(c, x - w * 0.25, h * 0.25, w * 0.05, '#FDA4AF'); circ(c, x + w * 0.25, h * 0.25, w * 0.05, '#FDA4AF');
        circ(c, x, h * 0.38, w * 0.3, gl(c, x, h * 0.38, w * 0.3, ['#FFE7C2', '#F5A65B', '#9A3412']));
        c.fillStyle = '#FFF7ED'; c.beginPath(); c.ellipse(x, h * 0.66, w * 0.2, h * 0.16, 0, 0, TAU); c.fill();
        circ(c, x, h * 0.82, w * 0.06, '#FFF7ED');
        c.strokeStyle = 'rgba(186,230,253,.85)'; c.lineWidth = Math.max(1.5, w * 0.04); c.beginPath(); c.arc(x, h * 0.4, w * 0.4, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x, h * 0.4, w * 0.33, Math.PI * 1.15, Math.PI * 1.4); c.stroke();
      });
    }
    function obSprite(k) {
      var w = lw * 0.84, h = k ? w : w * 0.7;
      return mkc(w, h, dpr, function (c) {
        if (k === 0) { // energy barrier
          var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#F0ABFC'); g.addColorStop(0.5, '#C026D3'); g.addColorStop(1, '#581C87');
          c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(0, h * 0.1, w, h * 0.9, w * 0.08) : c.rect(0, h * 0.1, w, h * 0.9); c.fill();
          c.fillStyle = '#FDE68A'; for (var i = 0; i < 4; i++) { c.beginPath(); c.moveTo(w * (i * 0.25), h * 0.3); c.lineTo(w * (i * 0.25 + 0.13), h * 0.3); c.lineTo(w * (i * 0.25 + 0.25), h * 0.75); c.lineTo(w * (i * 0.25 + 0.12), h * 0.75); c.closePath(); c.fill(); }
          c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(w * 0.05, h * 0.14, w * 0.9, h * 0.06);
        } else { // spiky space mine
          var x = w / 2, r = w * 0.36;
          c.fillStyle = '#94A3B8'; for (var s = 0; s < 10; s++) { var a = s / 10 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a - 0.22) * r, x + Math.sin(a - 0.22) * r); c.lineTo(x + Math.cos(a) * w * 0.49, x + Math.sin(a) * w * 0.49); c.lineTo(x + Math.cos(a + 0.22) * r, x + Math.sin(a + 0.22) * r); c.fill(); }
          circ(c, x, x, r, gl(c, x, x, r, ['#E2E8F0', '#64748B', '#1E293B']));
          circ(c, x, x, r * 0.35, gl(c, x, x, r * 0.35, ['#FFE4E6', '#F43F5E', '#7F1D1D']));
        }
      });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        hy = Math.max(T + 4, H * 0.22); ny = H * 0.95; lw = Math.min(W * 0.3, (ny - hy) * 0.5);
        bg = mkc(W, H, dpr, function (c) {
          var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120C32'); g.addColorStop(1, '#0A0720'); c.fillStyle = g; c.fillRect(0, 0, W, H);
          stars(c, W, hy + 30, A.lite ? 20 : 50);
          var q = c.createRadialGradient(W / 2, hy, 0, W / 2, hy, lw * 1.6); q.addColorStop(0, 'rgba(253,230,138,.9)'); q.addColorStop(0.25, 'rgba(167,139,250,.55)'); q.addColorStop(1, 'rgba(76,29,149,0)');
          c.fillStyle = q; c.fillRect(0, 0, W, H);
          // floor of the tube (3 lanes)
          c.beginPath(); c.moveTo(SX(-1.55, 1.2), SY(1.2)); c.lineTo(SX(1.55, 1.2), SY(1.2)); c.lineTo(SX(1.55, -0.08), SY(-0.08)); c.lineTo(SX(-1.55, -0.08), SY(-0.08)); c.closePath();
          var f = c.createLinearGradient(0, hy, 0, H); f.addColorStop(0, 'rgba(76,29,149,.35)'); f.addColorStop(1, 'rgba(91,33,182,.75)'); c.fillStyle = f; c.fill();
          c.lineWidth = 2;
          [-1.5, 1.5].forEach(function (lx) { c.strokeStyle = 'rgba(251,191,36,.75)'; c.beginPath(); c.moveTo(SX(lx, 1.2), SY(1.2)); c.lineTo(SX(lx, -0.08), SY(-0.08)); c.stroke(); });
          [-0.5, 0.5].forEach(function (lx) { c.strokeStyle = 'rgba(196,181,253,.28)'; c.beginPath(); c.moveTo(SX(lx, 1.2), SY(1.2)); c.lineTo(SX(lx, -0.08), SY(-0.08)); c.stroke(); });
        });
        hamS = [hamSprite(0), hamSprite(1)]; obS = [obSprite(0), obSprite(1)];
      },
      reset: function (live) { obs = []; lane = 0; hx = 0; dead = false; wall = null; won = 0; rowT = live ? 1.2 : 0.8; lastFree = 0; },
      step: function (dt, live) {
        t += dt;
        var lv = A.lv(), playing = A.live();
        spd = (live ? 0.48 + 0.4 * lv : 0.32) * (won ? 1.6 : 1);
        ringP = (ringP + dt * spd / 0.14) % 1;
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
          if (z0 > 0.02 && o.z <= 0.02 && playing && !dead && Math.abs(o.ln - hx) < 0.5) { if (A.fail(A.l.fail)) { dead = true; A.explode(SX(hx, 0), ny - lw * 0.35, 1.2); } }
          if (o.z < -0.07) obs.splice(i, 1);
        }
        if (wall) { var w0 = wall.z; wall.z -= wall.v * dt; if (w0 > 0.02 && wall.z <= 0.02) { dead = true; A.explode(SX(hx, 0), ny - lw * 0.35, 1.8); } if (wall.z < -0.07) wall = null; }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var i, z, p;
        // moving tube rings + lane dashes give the speed
        var n = A.lite ? 6 : 11, tr = lw * 1.95, cyN = ny - tr * 0.45;
        c.lineWidth = 2;
        for (i = 0; i < n; i++) {
          z = (n - 1 - i + 1 - ringP) * 0.14; if (z < -0.06) continue;
          p = P(z); c.strokeStyle = 'rgba(167,139,250,' + (0.12 + 0.5 * p).toFixed(2) + ')';
          c.beginPath(); c.arc(W / 2, hy + (cyN - hy) * p, tr * p, Math.PI * 0.82, Math.PI * 2.18); c.stroke();
        }
        c.strokeStyle = 'rgba(253,230,138,.55)'; c.lineCap = 'round';
        for (i = 0; i < n; i++) {
          var z1 = (n - 1 - i + 1 - ringP) * 0.14, z2 = z1 + 0.05; if (z1 < -0.06) continue;
          c.lineWidth = 3 * P(z1);
          c.beginPath(); c.moveTo(SX(-0.5, z1), SY(z1)); c.lineTo(SX(-0.5, z2), SY(z2)); c.moveTo(SX(0.5, z1), SY(z1)); c.lineTo(SX(0.5, z2), SY(z2)); c.stroke();
        }
        var sorted = obs.slice().sort(function (a, b) { return b.z - a.z; });
        function drawOb(o) { var pp = P(o.z), img = obS[o.k], w = img.width / dpr * pp, hh = img.height / dpr * pp; c.drawImage(img, SX(o.ln, o.z) - w / 2, SY(o.z) - hh, w, hh); }
        function drawWall() {
          var pp = P(wall.z), x0 = SX(-1.55, wall.z), x1 = SX(1.55, wall.z), y1 = SY(wall.z), hh = lw * 1.5 * pp;
          var g = c.createLinearGradient(0, y1 - hh, 0, y1); g.addColorStop(0, '#FDA4AF'); g.addColorStop(1, '#BE123C');
          c.fillStyle = g; c.fillRect(x0, y1 - hh, x1 - x0, hh);
          c.fillStyle = '#1F1235'; for (var s = 0; s < 6; s++) c.fillRect(x0 + (x1 - x0) * (s / 6 + 0.04), y1 - hh * 0.7, (x1 - x0) * 0.08, hh * 0.4);
        }
        for (i = 0; i < sorted.length; i++) if (sorted[i].z > 0.02) drawOb(sorted[i]);
        if (wall && wall.z > 0.02) drawWall();
        if (!dead) {
          var img = hamS[((t * (A.live() ? 10 : 6)) | 0) % 2], hw = img.width / dpr, hh = img.height / dpr, bob = Math.abs(Math.sin(t * 12)) * 3;
          c.drawImage(img, SX(hx, 0) - hw / 2, ny - hh - bob - (won ? Math.abs(Math.sin(won * 8)) * 10 : 0), hw, hh);
        }
        for (i = 0; i < sorted.length; i++) if (sorted[i].z <= 0.02) drawOb(sorted[i]);
        if (wall && wall.z <= 0.02) drawWall();
      },
      down: function (x) { if (dead || wall) return; lane = clamp(lane + (x < W / 2 ? -1 : 1), -1, 1); },
      boom: function () { wall = { z: 0.75, v: 2.6 }; obs = obs.filter(function (o) { return o.z > 0.75; }); },
      win: function () { won = 0.001; obs = []; }
    };
  }, 'lr');

  /* ================================================================== 5. ASTEROID DODGE — drag the ship left / right */
  boot('dodge', function (A) {
    var W, H, u, dpr, T, bg, stL, shipS, rockS = [], s = { x: 0, tx: 0, y: 0 }, rocks = [], spT = 0, drag = null, big = null, scroll = 0, dead = false, won = 0, t = 0, sw = 0, shh = 0;
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top; sw = Math.max(28, 10.5 * u); shh = sw * 1.25;
        bg = bgSprite(W, H, dpr, [[0.3, 0.3, 0.5, 'rgba(139,92,246,.3)'], [0.8, 0.75, 0.5, 'rgba(14,165,233,.14)']], A.lite ? 30 : 50);
        stL = []; for (var i = 0; i < (A.lite ? 16 : 40); i++) stL.push([Math.random() * W, Math.random() * H, Math.random() < 0.8 ? 1.2 : 2, rnd(0.6, 1.4)]);
        shipS = mkc(sw, shh, dpr, function (c, w, h) {
          c.translate(w / 2, 0);
          c.fillStyle = '#F59E0B'; c.beginPath(); c.moveTo(0, h * 0.4); c.lineTo(w * 0.5, h * 0.84); c.lineTo(w * 0.34, h * 0.94); c.lineTo(0, h * 0.8); c.lineTo(-w * 0.34, h * 0.94); c.lineTo(-w * 0.5, h * 0.84); c.closePath(); c.fill();
          var g = c.createLinearGradient(-w * 0.2, 0, w * 0.2, 0); g.addColorStop(0, '#5B21B6'); g.addColorStop(0.4, '#F5F3FF'); g.addColorStop(0.65, '#C4B5FD'); g.addColorStop(1, '#4C1D95');
          c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(w * 0.22, h * 0.2, w * 0.22, h * 0.6, w * 0.17, h * 0.92); c.lineTo(-w * 0.17, h * 0.92); c.bezierCurveTo(-w * 0.22, h * 0.6, -w * 0.22, h * 0.2, 0, 0); c.fill();
          c.fillStyle = gl(c, 0, h * 0.38, w * 0.12, ['#E0F2FE', '#38BDF8', '#0C4A6E']); c.beginPath(); c.ellipse(0, h * 0.38, w * 0.09, h * 0.12, 0, 0, TAU); c.fill();
          c.fillStyle = '#FBBF24'; c.fillRect(-w * 0.13, h * 0.9, w * 0.26, h * 0.07);
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
          c.fillStyle = 'rgba(251,146,60,.9)'; c.beginPath(); c.ellipse(0, fy - s.y + shh * 0.12 * fl, sw * 0.13, shh * 0.2 * fl * (won ? 1.8 : 1), 0, 0, TAU); c.fill();
          c.fillStyle = '#FFF7ED'; c.beginPath(); c.ellipse(0, fy - s.y + shh * 0.06, sw * 0.06, shh * 0.1 * fl, 0, 0, TAU); c.fill();
          c.drawImage(shipS, -sw / 2, -shh / 2, sw, shh);
          c.restore();
        }
        if (big) meteor(c, big.x, big.y, big.r, Math.PI / 2);
      },
      down: function (x) { drag = { o: s.tx - x }; },
      move: function (x) { if (drag && !dead && !won) s.tx = clamp(x + drag.o, sw * 0.6, W - sw * 0.6); },
      up: function () { drag = null; },
      boom: function () { drag = null; big = { x: s.x, y: -W * 0.3, r: Math.max(W * 0.2, 40), v: H * 1.9 }; },
      win: function () { won = 0.001; drag = null; }
    };
  }, 'drag');

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
      reset: function (live) { darts = []; fly = null; met = null; dead = false; won = 0; lim = 4.5; clock = lim; aimT = 0; ph = rnd(0, TAU); },
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
              clock = lim = Math.max(2.8, 4.5 - 1.5 * A.lv());
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
      boom: function () { fly = null; met = { x: -W * 0.2, y: T - 30, r: Math.max(18, R * 0.3), vx: 0, vy: 0 }; met.vx = (cx - met.x) / 0.65; met.vy = (cy - met.y) / 0.65; },
      win: function () { won = 0.001; }
    };
  }, 'tap');
})(window.D6 = window.D6 || {});
