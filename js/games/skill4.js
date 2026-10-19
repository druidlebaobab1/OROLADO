/* v2819 — "You're in control" group 4 (owner request, round 5): AIR STRIKE (war shooter seen from above: drag to steer, the
   fighter fires by itself), ZOMBIE SIEGE (tap the zombies before they reach the barricade), BRICK BREAKER (drag the paddle)
   and NEON SNAKE (swipe to turn). MIXED MODE like Aviator, but the player plays: the multiplier follows the SERVER clock
   (×e^(rate·s), casino_ext.php 'skill', rate 0.03 → ×2 after ~23 s), the gold button cashes out, a mistake loses
   (K.multi 'fail'), and the server's secret end arrives as an unavoidable event (missile barrage, the horde, the wall
   collapses, the walls close in). Canvas 2D at 60 fps, own drawings (no image file), sprites pre-drawn once per size,
   pauses when the tab is hidden. Same engine as js/games/skill5.js (copied: each module file stands alone).
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
  // per game: hint (gesture), fail (mistake), end (the secret end's event), rule (step 2 of the rules)
  var G = {
    airstrike: {
      en: ['Drag to steer your fighter', 'Shot down!', 'Missile barrage!', 'Drag left or right to steer your fighter — it fires on its own. Dodge enemy planes and their bullets: one hit ends the round.'],
      fr: ['Glisse pour piloter ton avion', 'Abattu !', 'Pluie de missiles !', 'Glisse à gauche ou à droite pour piloter ton chasseur — il tire tout seul. Évite les avions ennemis et leurs balles : un seul impact termine la partie.'],
      es: ['Desliza para pilotar tu caza', '¡Derribado!', '¡Lluvia de misiles!', 'Desliza a la izquierda o a la derecha para pilotar tu caza: dispara solo. Esquiva los aviones enemigos y sus balas: un impacto termina la ronda.'],
      pt: ['Deslize para pilotar seu caça', 'Abatido!', 'Chuva de mísseis!', 'Deslize para a esquerda ou direita para pilotar seu caça — ele atira sozinho. Desvie dos aviões inimigos e das balas: um impacto encerra a rodada.'],
      ar: ['اسحب لتوجيه طائرتك', 'أُسقطت!', 'وابل صواريخ!', 'اسحب يسارًا أو يمينًا لتوجيه طائرتك المقاتلة — تطلق النار وحدها. تفادَ طائرات العدو ورصاصها: إصابة واحدة تنهي الجولة.'],
      tr: ['Uçağını kaydırarak yönlendir', 'Vuruldun!', 'Füze yağmuru!', 'Savaş uçağını yönlendirmek için sola ya da sağa kaydır — kendi kendine ateş eder. Düşman uçaklarından ve mermilerinden kaç: tek isabet turu bitirir.'],
      vi: ['Kéo để lái máy bay', 'Bị bắn hạ!', 'Mưa tên lửa!', 'Kéo sang trái hoặc phải để lái tiêm kích — máy bay tự bắn. Né máy bay địch và đạn của chúng: trúng một phát là kết thúc ván.'],
      id: ['Geser untuk mengemudikan jet', 'Tertembak!', 'Hujan rudal!', 'Geser ke kiri atau kanan untuk mengemudikan jet tempurmu — ia menembak sendiri. Hindari pesawat musuh dan pelurunya: satu tembakan mengakhiri ronde.'],
      ru: ['Веди пальцем — управляй самолётом', 'Сбит!', 'Ракетный залп!', 'Веди пальцем влево или вправо, чтобы управлять истребителем — он стреляет сам. Уклоняйся от вражеских самолётов и пуль: одно попадание завершает раунд.'],
      de: ['Ziehen, um den Jet zu steuern', 'Abgeschossen!', 'Raketenhagel!', 'Ziehe nach links oder rechts, um deinen Jäger zu steuern — er feuert von selbst. Weiche feindlichen Flugzeugen und ihren Kugeln aus: Ein Treffer beendet die Runde.'],
      hi: ['विमान चलाने को खींचें', 'मार गिराया!', 'मिसाइलों की बौछार!', 'अपने लड़ाकू विमान को चलाने के लिए बाएँ या दाएँ खींचें — वह खुद गोली चलाता है। दुश्मन विमानों और उनकी गोलियों से बचें: एक टक्कर राउंड खत्म करती है।'],
      zh: ['拖动驾驶战机', '被击落！', '导弹齐射！', '左右拖动驾驶你的战机——它会自动开火。躲开敌机和子弹：被击中一次，本回合结束。']
    },
    zombiesiege: {
      en: ['Tap the zombies to shoot', 'Overrun!', 'The horde!', 'Tap a zombie to shoot it — the big ones take several shots. If a zombie reaches your barricade, the round ends.'],
      fr: ['Touche les zombies pour tirer', 'Submergé !', 'La horde !', 'Touche un zombie pour lui tirer dessus — les gros demandent plusieurs tirs. Si un zombie atteint ta barricade, la partie se termine.'],
      es: ['Toca a los zombis para disparar', '¡Invadido!', '¡La horda!', 'Toca un zombi para dispararle: los grandes necesitan varios disparos. Si un zombi llega a tu barricada, la ronda termina.'],
      pt: ['Toque nos zumbis para atirar', 'Invadido!', 'A horda!', 'Toque num zumbi para atirar nele — os grandes precisam de vários tiros. Se um zumbi chegar à sua barricada, a rodada termina.'],
      ar: ['المس الزومبي لإطلاق النار', 'اجتياح!', 'الحشد!', 'المس زومبي لإطلاق النار عليه — الكبار يحتاجون عدة طلقات. إذا وصل زومبي إلى حاجزك تنتهي الجولة.'],
      tr: ['Ateş için zombilere dokun', 'İstila edildin!', 'Sürü geliyor!', 'Ateş etmek için bir zombiye dokun — büyükler birkaç atış ister. Bir zombi barikatına ulaşırsa tur biter.'],
      vi: ['Chạm vào zombie để bắn', 'Bị tràn vào!', 'Bầy zombie!', 'Chạm vào zombie để bắn — con lớn cần nhiều phát. Nếu một zombie chạm tới chiến lũy của bạn, ván kết thúc.'],
      id: ['Ketuk zombi untuk menembak', 'Kewalahan!', 'Gerombolan!', 'Ketuk zombi untuk menembaknya — yang besar butuh beberapa tembakan. Jika zombi mencapai barikademu, ronde berakhir.'],
      ru: ['Нажимай на зомби, чтобы стрелять', 'Прорыв!', 'Орда!', 'Нажми на зомби, чтобы выстрелить — крупным нужно несколько попаданий. Если зомби дойдёт до баррикады, раунд завершится.'],
      de: ['Tippe auf Zombies zum Schießen', 'Überrannt!', 'Die Horde!', 'Tippe auf einen Zombie, um zu schießen — große brauchen mehrere Treffer. Erreicht ein Zombie deine Barrikade, endet die Runde.'],
      hi: ['गोली चलाने को ज़ॉम्बी पर टैप करें', 'घुस आए!', 'ज़ॉम्बी का झुंड!', 'ज़ॉम्बी पर गोली चलाने के लिए उस पर टैप करें — बड़ों को कई गोलियाँ चाहिए। कोई ज़ॉम्बी आपके मोर्चे तक पहुँचा तो राउंड खत्म।'],
      zh: ['点击僵尸射击', '防线失守！', '尸潮来袭！', '点击僵尸开枪——大个子要打好几枪。只要有僵尸冲到你的路障，本回合结束。']
    },
    brickbreak: {
      en: ['Drag to move the paddle', 'Ball lost!', 'Wall collapse!', 'Drag left or right to move the paddle and bounce the ball into the bricks. If the ball falls past the paddle, the round ends.'],
      fr: ['Glisse pour bouger la raquette', 'Balle perdue !', 'Le mur s’effondre !', 'Glisse à gauche ou à droite pour déplacer la raquette et renvoyer la balle vers les briques. Si la balle passe sous la raquette, la partie se termine.'],
      es: ['Desliza para mover la paleta', '¡Bola perdida!', '¡Se derrumba el muro!', 'Desliza a la izquierda o a la derecha para mover la paleta y devolver la bola contra los ladrillos. Si la bola cae por debajo de la paleta, la ronda termina.'],
      pt: ['Deslize para mover a raquete', 'Bola perdida!', 'O muro desabou!', 'Deslize para a esquerda ou direita para mover a raquete e rebater a bola nos tijolos. Se a bola passar pela raquete, a rodada termina.'],
      ar: ['اسحب لتحريك المضرب', 'ضاعت الكرة!', 'انهيار الجدار!', 'اسحب يسارًا أو يمينًا لتحريك المضرب وردّ الكرة نحو الطوب. إذا سقطت الكرة خلف المضرب تنتهي الجولة.'],
      tr: ['Raketi kaydırarak oynat', 'Top kaçtı!', 'Duvar çöktü!', 'Raketi oynatıp topu tuğlalara sektirmek için sola ya da sağa kaydır. Top raketin altından kaçarsa tur biter.'],
      vi: ['Kéo để di chuyển thanh đỡ', 'Mất bóng!', 'Tường sụp đổ!', 'Kéo sang trái hoặc phải để di chuyển thanh đỡ và đánh bóng vào gạch. Nếu bóng rơi qua thanh đỡ, ván kết thúc.'],
      id: ['Geser untuk menggerakkan papan', 'Bola lepas!', 'Tembok runtuh!', 'Geser ke kiri atau kanan untuk menggerakkan papan dan memantulkan bola ke batu bata. Jika bola jatuh melewati papan, ronde berakhir.'],
      ru: ['Веди, чтобы двигать платформу', 'Мяч упущен!', 'Стена рушится!', 'Веди пальцем влево или вправо, чтобы двигать платформу и отбивать мяч в кирпичи. Если мяч пролетит мимо платформы, раунд завершится.'],
      de: ['Ziehen, um den Schläger zu bewegen', 'Ball verloren!', 'Die Mauer stürzt ein!', 'Ziehe nach links oder rechts, um den Schläger zu bewegen und den Ball gegen die Steine zu schlagen. Fällt der Ball am Schläger vorbei, endet die Runde.'],
      hi: ['पैडल हिलाने को खींचें', 'गेंद छूटी!', 'दीवार गिर गई!', 'पैडल को हिलाने और गेंद को ईंटों पर मारने के लिए बाएँ या दाएँ खींचें। गेंद पैडल से नीचे गिरी तो राउंड खत्म।'],
      zh: ['拖动移动挡板', '球丢了！', '砖墙倒塌！', '左右拖动挡板，把球弹向砖块。球从挡板下方漏掉，本回合结束。']
    },
    neonsnake: {
      en: ['Swipe to turn the snake', 'Crash!', 'Walls closing in!', 'Swipe up, down, left or right to steer the snake and eat the gems — it grows longer. Hitting a wall or your own tail ends the round.'],
      fr: ['Glisse pour tourner', 'Collision !', 'Les murs se resserrent !', 'Glisse vers le haut, le bas, la gauche ou la droite pour diriger le serpent et manger les gemmes — il grandit. Toucher un mur ou ta propre queue termine la partie.'],
      es: ['Desliza para girar', '¡Choque!', '¡Los muros se cierran!', 'Desliza arriba, abajo, a la izquierda o a la derecha para guiar a la serpiente y comer las gemas: se hace más larga. Chocar con un muro o con tu cola termina la ronda.'],
      pt: ['Deslize para virar', 'Batida!', 'As paredes se fecham!', 'Deslize para cima, baixo, esquerda ou direita para guiar a cobra e comer as gemas — ela cresce. Bater numa parede ou no próprio rabo encerra a rodada.'],
      ar: ['اسحب لتوجيه الثعبان', 'اصطدام!', 'الجدران تنغلق!', 'اسحب للأعلى أو للأسفل أو يسارًا أو يمينًا لتوجيه الثعبان وأكل الجواهر — يزداد طولًا. الاصطدام بجدار أو بذيلك ينهي الجولة.'],
      tr: ['Dönmek için kaydır', 'Çarptın!', 'Duvarlar daralıyor!', 'Yılanı yönlendirip mücevherleri yemek için yukarı, aşağı, sola ya da sağa kaydır — uzar. Duvara ya da kendi kuyruğuna çarpmak turu bitirir.'],
      vi: ['Vuốt để rẽ', 'Đâm rồi!', 'Tường đang khép lại!', 'Vuốt lên, xuống, trái hoặc phải để điều khiển rắn ăn đá quý — rắn sẽ dài ra. Đâm vào tường hoặc đuôi mình là kết thúc ván.'],
      id: ['Usap untuk berbelok', 'Tabrakan!', 'Dinding menyempit!', 'Usap ke atas, bawah, kiri, atau kanan untuk mengarahkan ular dan memakan permata — ia makin panjang. Menabrak dinding atau ekor sendiri mengakhiri ronde.'],
      ru: ['Свайп — поворот змейки', 'Столкновение!', 'Стены сжимаются!', 'Проводи вверх, вниз, влево или вправо, чтобы вести змейку к кристаллам — она растёт. Удар о стену или свой хвост завершает раунд.'],
      de: ['Wischen zum Abbiegen', 'Zusammenstoß!', 'Die Wände rücken näher!', 'Wische nach oben, unten, links oder rechts, um die Schlange zu den Edelsteinen zu lenken — sie wird länger. Eine Wand oder der eigene Schwanz beendet die Runde.'],
      hi: ['मुड़ने के लिए स्वाइप करें', 'टक्कर!', 'दीवारें सिकुड़ रही हैं!', 'साँप को चलाने और रत्न खाने के लिए ऊपर, नीचे, बाएँ या दाएँ स्वाइप करें — वह लंबा होता है। दीवार या अपनी पूँछ से टकराना राउंड खत्म करता है।'],
      zh: ['滑动转向', '撞上了！', '围墙收拢！', '上下左右滑动，引导蛇去吃宝石——它会越来越长。撞墙或撞到自己的尾巴，本回合结束。']
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
      var hintOn = function (on) { hintEl.classList.toggle('off', !on); st.classList.toggle('idle', phase === 'idle'); };
      var A = {
        l: l, lite: lite,
        // the static background lives in its own canvas behind the scene: painted once, never redrawn each frame
        bg: function (img) { if (bgOn === img) return; bgOn = img; bgCv.width = img.width; bgCv.height = img.height; bgCv.getContext('2d').drawImage(img, 0, 0); },
        lv: function () { return Math.min(1.25, playT / 110); },            // difficulty: fair at the start, really hard after ~2 min
        live: function () { return phase === 'play'; },
        idle: function () { return phase === 'idle'; },
        fail: function (why) {                                              // the player's own mistake
          if (phase !== 'play') return false;
          phase = 'failing'; say(why || l.fail, 'lost'); setBtn(l.bet, '', 'wait'); btn.disabled = true;
          sendFail(); return true;
        },
        burst: function (x, y, n, cols, sp, life, sz, grav) {
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
          A.burst(x, y, 34, ['#FFF7ED', '#FDE68A', '#FB923C', '#F43F5E', '#C4B5FD'], 260 * s, 0.9, 3.4 * Math.sqrt(s));
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
        if (!box.isConnected) { if (ro) ro.disconnect(); return; }
        K.S.raf = requestAnimationFrame(loop);
        if (document.hidden) { last = 0; return; }                      // paused while the tab is hidden
        var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
        if (!W) { resize(); if (!W) return; }
        if (lite && phase === 'idle' && drawn && !P.length) return;      // old phones: still idle scene
        if (phase === 'play') playT += dt;
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
        phase = 'over'; overT = 99; btn.disabled = true; hintOn(false); gs = null;
        g.boom(); say(l.end, 'lost'); setBtn(l.bet, '', 'wait');
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
        if ((Number(r.win) || 0) > 0) { if (g.win) g.win(); say(l.won + ' ' + xm(r.out), 'won'); tx(mEl, xm(r.out)); result(r); }
        else ended(r);
      }
      function result(r) {
        phase = 'over'; overT = 3.2; clearTimeout(K.S.timer); hintOn(false); gs = null;
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
      function did(what, x, y) { if (phase !== 'play') return; count(); g.act(what, x, y); }
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

  /* ================================================================== 1. AIR STRIKE — war shooter seen from above (1945 style):
     drag to steer the fighter, it fires by itself; enemy planes come down and shoot slow, bright bullets.
     Fair: no enemy fire during the first seconds, bullets aimed where the plane IS (never homing), a small hit box. */
  function plane(s, dpr, P, down, wide) {
    return mkc(s * 2, s * 2, dpr, function (c) {
      c.translate(s, s); if (down) c.scale(1, -1);
      var k = wide || 1;
      c.fillStyle = 'rgba(0,0,0,.18)'; poly(c, [-0.95 * s * k, 0.2 * s, 0, -0.1 * s, 0.95 * s * k, 0.2 * s, 0.9 * s * k, 0.38 * s, -0.9 * s * k, 0.38 * s]); c.fill();
      poly(c, [-0.95 * s * k, 0.14 * s, -0.22 * s, -0.16 * s, 0.22 * s, -0.16 * s, 0.95 * s * k, 0.14 * s, 0.9 * s * k, 0.3 * s, 0.2 * s, 0.22 * s, -0.2 * s, 0.22 * s, -0.9 * s * k, 0.3 * s], lg(c, 0, -0.16 * s, 0, 0.3 * s, P.wing));
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1, s * 0.04); c.beginPath(); c.moveTo(-0.9 * s * k, 0.15 * s); c.lineTo(-0.22 * s, -0.12 * s); c.moveTo(0.9 * s * k, 0.15 * s); c.lineTo(0.22 * s, -0.12 * s); c.stroke();
      if (wide) { circ(c, -0.5 * s * k, 0.02 * s, 0.13 * s, P.dark); circ(c, 0.5 * s * k, 0.02 * s, 0.13 * s, P.dark); }
      poly(c, [-0.44 * s, 0.8 * s, -0.08 * s, 0.6 * s, 0.08 * s, 0.6 * s, 0.44 * s, 0.8 * s, 0.4 * s, 0.92 * s, -0.4 * s, 0.92 * s], lg(c, 0, 0.6 * s, 0, 0.92 * s, P.wing));
      c.fillStyle = lg(c, -0.18 * s, 0, 0.18 * s, 0, P.body); c.beginPath(); c.ellipse(0, 0.05 * s, 0.17 * s, 0.9 * s, 0, 0, TAU); c.fill();
      c.fillStyle = P.nose; c.beginPath(); c.ellipse(0, -0.78 * s, 0.1 * s, 0.13 * s, 0, 0, TAU); c.fill();
      c.fillStyle = lg(c, 0, -0.5 * s, 0, -0.1 * s, ['#E0F2FE', '#38BDF8', '#0C4A6E']); c.beginPath(); c.ellipse(0, -0.3 * s, 0.085 * s, 0.2 * s, 0, 0, TAU); c.fill();
      circ(c, -0.025 * s, -0.38 * s, 0.03 * s, 'rgba(255,255,255,.85)');
      circ(c, -0.6 * s * k, 0.12 * s, 0.1 * s, P.mark); circ(c, 0.6 * s * k, 0.12 * s, 0.1 * s, P.mark);
      circ(c, -0.6 * s * k, 0.12 * s, 0.045 * s, '#fff'); circ(c, 0.6 * s * k, 0.12 * s, 0.045 * s, '#fff');
    });
  }
  boot('airstrike', function (A) {
    var W, H, u, dpr, T, bg, pS, pSh, eS, bS, ebS, islS = [], clS, ps, eb;
    var p = { x: 0, tx: 0, y: 0, b: 0 }, drag = null, shots = [], foes = [], es = [], isl = [], clouds = [], fireT = 0, spT = 0, dead = 0, won = 0, t = 0, mis = null;
    var PL = { wing: ['#E2E8F0', '#94A3B8'], body: ['#64748B', '#F8FAFC', '#64748B'], nose: '#FBBF24', mark: '#2563EB', dark: '#334155' };
    var EN = { wing: ['#FCA5A5', '#B91C1C'], body: ['#7F1D1D', '#F87171', '#7F1D1D'], nose: '#1F2937', mark: '#FDE68A', dark: '#450A0A' };
    var BO = { wing: ['#A8A29E', '#44403C'], body: ['#292524', '#78716C', '#292524'], nose: '#DC2626', mark: '#DC2626', dark: '#1C1917' };
    function spawn(live) {
      var lv = live ? A.lv() : 0, r = Math.random(), vy = H * (0.15 + 0.11 * lv);
      if (live && lv > 0.25 && r < 0.12 + 0.12 * lv) { foes.push({ k: 'b', x: rnd(W * 0.25, W * 0.75), sx: 0, y: -ps * 2, vy: H * 0.085, amp: 0, ph: 0, hp: 5, r: ps * 1.25, cool: 1.0, hit: 0 }); var b = foes[foes.length - 1]; b.sx = b.x; return; }
      if (r < 0.45) { // a V of three
        var cx = rnd(W * 0.25, W * 0.75), dx = Math.min(W * 0.16, ps * 2.2);
        [-1, 0, 1].forEach(function (i) { foes.push({ k: 'f', sx: cx + i * dx, x: cx + i * dx, y: -ps - Math.abs(i) * ps * 1.2, vy: vy, amp: 0, ph: 0, hp: 1, r: ps * 0.8, cool: rnd(0.9, 2.2), hit: 0 }); });
        return;
      }
      var x = rnd(ps * 1.5, W - ps * 1.5);
      foes.push({ k: 'f', sx: x, x: x, y: -ps, vy: vy * rnd(0.95, 1.15), amp: Math.min(W * 0.18, rnd(0, W * 0.14)), ph: rnd(0, TAU), hp: 1, r: ps * 0.8, cool: rnd(0.8, 1.8), hit: 0 });
    }
    function fire(f, live) {
      var lv = live ? A.lv() : 0;
      if (es.length > 4 + 9 * lv) return;
      var sp = H * (0.3 + 0.17 * lv), ys = f.y + f.r * 0.6;
      if (f.k === 'b') { [-0.32, 0, 0.32].forEach(function (a) { es.push({ x: f.x, y: ys, vx: Math.sin(a) * sp, vy: Math.cos(a) * sp }); }); f.cool = Math.max(1.0, 1.9 - 0.7 * lv); return; }
      var dx = p.x - f.x, dy = p.y - ys, d = Math.hypot(dx, dy) || 1;
      if (dy < H * 0.2) return;
      es.push({ x: f.x, y: ys, vx: dx / d * sp, vy: dy / d * sp });
      f.cool = Math.max(0.9, rnd(1.7, 2.7) - 0.8 * lv);
    }
    function crash() {
      if (dead) return;
      if (!A.fail(A.l.fail)) return;
      dead = 1; drag = null; A.explode(p.x, p.y, 1.1); A.shake(0.5);
    }
    function kill(f, i) {
      foes.splice(i, 1);
      A.burst(f.x, f.y, f.k === 'b' ? 26 : 14, ['#FFF7ED', '#FDE68A', '#FB923C', '#F43F5E'], f.k === 'b' ? 220 : 150, 0.6, 3, 0);
      A.ring(f.x, f.y, f.r * 1.5, '#FDBA74'); if (f.k === 'b') A.shake(0.2);
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        ps = clamp(u * 7.2, 21, 44); eb = Math.max(4.2, ps * 0.21);
        p.y = H - ps * 1.4;
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#071733', '#0B3B66', '#0E5A7A']); c.fillRect(0, 0, W, H);
          circ(c, W * 0.8, H * 0.25, Math.max(W, H) * 0.45, rg(c, W * 0.8, H * 0.25, Math.max(W, H) * 0.45, ['rgba(56,189,248,.18)', 'rgba(56,189,248,0)']));
          c.strokeStyle = 'rgba(186,230,253,.28)'; c.lineWidth = 1.5; c.lineCap = 'round'; // waves (static: the islands and clouds give the motion)
          for (var i = 0; i < Math.round(W * H / 5000); i++) { var x = Math.random() * W, y = Math.random() * H, l = rnd(6, 16); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 3, x + l, y); c.stroke(); }
        });
        pS = plane(ps, dpr, PL); eS = plane(ps * 0.8, dpr, EN, true); bS = plane(ps * 1.25, dpr, BO, true, 1.35);
        pSh = mkc(ps * 2, ps * 2, dpr, function (c) { c.drawImage(pS, 0, 0, ps * 2, ps * 2); c.globalCompositeOperation = 'source-in'; c.fillStyle = 'rgba(2,6,23,.32)'; c.fillRect(0, 0, ps * 2, ps * 2); });
        ebS = mkc(eb * 4, eb * 4, dpr, function (c) { circ(c, eb * 2, eb * 2, eb * 2, rg(c, eb * 2, eb * 2, eb * 2, ['rgba(254,240,138,.9)', 'rgba(251,113,133,.55)', 'rgba(244,63,94,0)'])); circ(c, eb * 2, eb * 2, eb * 0.9, '#FFF7ED'); });
        islS = [0, 1].map(function (j) {
          var R = Math.max(W, H) * (j ? 0.12 : 0.09);
          return mkc(R * 2.4, R * 2.4, 1, function (c) {
            var x = R * 1.2;
            c.fillStyle = 'rgba(125,211,252,.35)'; c.beginPath(); c.ellipse(x, x, R * 1.12, R * 0.92, 0.3, 0, TAU); c.fill();
            c.fillStyle = '#E7D3A1'; c.beginPath(); c.ellipse(x, x, R, R * 0.8, 0.3, 0, TAU); c.fill();
            c.fillStyle = lg(c, 0, x - R, 0, x + R, ['#4ADE80', '#15803D']); c.beginPath(); c.ellipse(x - R * 0.05, x - R * 0.04, R * 0.8, R * 0.6, 0.3, 0, TAU); c.fill();
            for (var k = 0; k < 7; k++) circ(c, x + rnd(-R * 0.5, R * 0.5), x + rnd(-R * 0.35, R * 0.35), R * rnd(0.08, 0.15), k % 2 ? '#166534' : '#22C55E');
          });
        });
        clS = mkc(W * 0.5, W * 0.22, 1, function (c) {
          for (var k = 0; k < 6; k++) circ(c, W * rnd(0.12, 0.38), W * rnd(0.08, 0.14), W * rnd(0.05, 0.08), 'rgba(255,255,255,.16)');
        });
        p.x = p.tx = clamp(p.x || W / 2, ps, W - ps);
        if (!isl.length) for (var i = 0; i < 2; i++) isl.push({ x: rnd(0.1, 0.9) * W, y: rnd(0, H), s: i });
        if (!clouds.length) for (i = 0; i < 2; i++) clouds.push({ x: rnd(-0.1, 0.6) * W, y: rnd(0, H) });
      },
      reset: function (live) { foes = []; shots = []; es = []; mis = null; dead = 0; won = 0; drag = null; p.x = p.tx = W / 2; p.b = 0; spT = live ? 1.3 : 0.4; fireT = 0; },
      step: function (dt, live) {
        t += dt;
        var lv = live ? A.lv() : 0, playing = A.live(), i, j;
        if (!live && !dead && !mis) p.tx = W / 2 + Math.sin(t * 0.8) * W * 0.28;
        var d = p.tx - p.x, mx = Math.max(W, 500) * 2.2 * dt;
        if (!dead) p.x += clamp(d, -mx, mx);
        p.b += (clamp(d / (W * 0.08), -1, 1) - p.b) * Math.min(1, dt * 10);
        if (!dead && !mis && !won) { fireT -= dt; if (fireT <= 0) { fireT = 0.13; shots.push({ x: p.x - ps * 0.24, y: p.y - ps * 0.7 }, { x: p.x + ps * 0.24, y: p.y - ps * 0.7 }); } }
        for (i = shots.length - 1; i >= 0; i--) { shots[i].y -= H * 1.5 * dt; if (shots[i].y < -10) shots.splice(i, 1); }
        if (!dead && !mis && !won) { spT -= dt; if (spT <= 0) { spawn(live); spT = live ? Math.max(0.6, rnd(1.05, 1.45) - 0.6 * lv) : 1.5; } }
        for (i = foes.length - 1; i >= 0; i--) {
          var f = foes[i]; f.y += f.vy * dt; f.x = f.sx + Math.sin(t * 1.5 + f.ph) * f.amp; f.hit = Math.max(0, f.hit - dt);
          if (f.y > H + f.r * 2) { foes.splice(i, 1); continue; }
          if (!dead && !mis && f.y > T * 0.8 && f.y < H * 0.62) { f.cool -= dt; if (f.cool <= 0) { if (!live || A.lv() > 0.055 || f.k === 'b') fire(f, live); else f.cool = 0.5; } }
          var gone = false;
          for (j = shots.length - 1; j >= 0; j--) {
            var s = shots[j];
            if (Math.abs(s.x - f.x) < f.r * 0.85 && Math.abs(s.y - f.y) < f.r * 0.8) { shots.splice(j, 1); f.hp--; f.hit = 0.08; if (f.hp <= 0) { kill(f, i); gone = true; break; } }
          }
          if (gone) continue;
          if (playing && !dead && Math.hypot(f.x - p.x, f.y - p.y) < f.r * 0.55 + ps * 0.38) crash();
        }
        for (i = es.length - 1; i >= 0; i--) {
          var e = es[i]; e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.y > H + 20 || e.x < -20 || e.x > W + 20) { es.splice(i, 1); continue; }
          if (playing && !dead && Math.hypot(e.x - p.x, e.y - (p.y - ps * 0.05)) < eb * 0.9 + ps * 0.3) { es.splice(i, 1); crash(); }
        }
        for (i = 0; i < isl.length; i++) { isl[i].y += H * 0.11 * dt; if (isl[i].y > H + islS[isl[i].s].height) { isl[i].y = -islS[isl[i].s].height - rnd(0, H * 0.4); isl[i].x = rnd(0.05, 0.95) * W; } }
        for (i = 0; i < clouds.length; i++) { clouds[i].y += H * 0.19 * dt; if (clouds[i].y > H + W * 0.2) { clouds[i].y = -W * 0.25 - rnd(0, H * 0.3); clouds[i].x = rnd(-0.1, 0.6) * W; } }
        if (mis) {
          mis.y += H * 1.35 * dt;
          if (!mis.hit && mis.y >= p.y - ps * 0.6) { mis.hit = 1; dead = 1; A.explode(p.x, p.y, 1.7); A.flash(0.7); mis.xs.forEach(function (x) { A.burst(x, p.y, 4, ['#FDBA74', '#F43F5E'], 120, 0.5, 3, 0); }); }
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var i;
        for (i = 0; i < isl.length; i++) { var im = islS[isl[i].s]; c.drawImage(im, isl[i].x - im.width / 2, isl[i].y - im.height / 2); }
        for (i = 0; i < clouds.length; i++) c.drawImage(clS, clouds[i].x, clouds[i].y);
        if (!dead) c.drawImage(pSh, p.x - ps * 0.6, p.y + ps * 0.35, ps * 1.6, ps * 1.6);
        for (i = 0; i < foes.length; i++) {
          var f = foes[i], im2 = f.k === 'b' ? bS : eS, s = im2.w / 2 * (f.hit ? 1.08 : 1);
          c.drawImage(im2, f.x - s, f.y - s, s * 2, s * 2);
          if (f.hit) { c.globalAlpha = 0.5; circ(c, f.x, f.y, f.r * 0.5, '#FFF7ED'); c.globalAlpha = 1; }
        }
        c.fillStyle = '#FDE68A';
        for (i = 0; i < shots.length; i++) c.fillRect(shots[i].x - 1.5, shots[i].y - ps * 0.18, 3, ps * 0.36);
        var es2 = eb * 2;
        for (i = 0; i < es.length; i++) c.drawImage(ebS, es[i].x - es2, es[i].y - es2, es2 * 2, es2 * 2);
        if (!dead) {
          var fl = ps * (0.28 + Math.random() * 0.12);
          c.fillStyle = 'rgba(251,146,60,.85)'; poly(c, [p.x - ps * 0.08, p.y + ps * 0.88, p.x + ps * 0.08, p.y + ps * 0.88, p.x, p.y + ps * 0.88 + fl]); c.fill();
          c.save(); c.translate(p.x, p.y); c.scale(1 - 0.16 * Math.abs(p.b), 1); if (won) { var k = 1 + 0.12 * Math.sin(won * 12); c.scale(k, k); }
          c.drawImage(pS, -ps, -ps, ps * 2, ps * 2); c.restore();
        }
        if (mis) {
          for (i = 0; i < mis.xs.length; i++) {
            var x = mis.xs[i], y = mis.y - (i % 2) * ps * 0.5, mw = ps * 0.18;
            c.fillStyle = 'rgba(251,146,60,.5)'; poly(c, [x - mw, y - ps * 0.9, x + mw, y - ps * 0.9, x, y - ps * 2.2]); c.fill();
            rr(c, x - mw, y - ps * 0.9, mw * 2, ps * 0.9, mw); c.fillStyle = '#E5E7EB'; c.fill();
            c.fillStyle = '#DC2626'; poly(c, [x - mw, y - ps * 0.12, x + mw, y - ps * 0.12, x, y + ps * 0.12]); c.fill();
            c.fillRect(x - mw * 1.8, y - ps * 0.9, mw * 3.6, ps * 0.12);
          }
        }
      },
      down: function (x) { if (!dead) drag = { o: p.x - x }; },
      move: function (x) { if (drag && !dead && !won) p.tx = clamp(x + drag.o, ps * 0.8, W - ps * 0.8); },
      up: function () { drag = null; },
      key: function (k) { if (dead) return; if (k === 'left') p.tx = clamp(p.tx - W * 0.16, ps * 0.8, W - ps * 0.8); if (k === 'right') p.tx = clamp(p.tx + W * 0.16, ps * 0.8, W - ps * 0.8); },
      boom: function () { drag = null; var xs = [], n = Math.ceil(W / (ps * 0.95)) + 1; for (var i = 0; i < n; i++) xs.push(i * W / (n - 1)); mis = { y: -ps, xs: xs }; es = []; },
      win: function () { won = 0.001; drag = null; foes.forEach(function (f) { A.burst(f.x, f.y, 6, ['#FDE68A', '#FFFFFF'], 120, 0.5, 2.6, 0); }); foes = []; es = []; },
      dbg: function () { return { x: p.x, tx: p.tx, y: p.y, ps: ps, W: W, H: H, eb: eb, dead: dead, foes: foes.map(function (f) { return { x: f.x, y: f.y, r: f.r, vy: f.vy }; }), es: es.map(function (e) { return { x: e.x, y: e.y, vx: e.vx, vy: e.vy }; }) }; }
    };
  }, 'drag', 0.5);

  /* ================================================================== 2. ZOMBIE SIEGE — tap the zombies before they reach your barricade.
     Seen from behind the gun, the street goes up to the horizon; walkers (1 shot), runners (fast, 1 shot), brutes (3 shots). */
  function zombie(w, h, dpr, k, f) {
    return mkc(w, h, dpr, function (c) {
      var cx = w / 2, sk = k === 'b' ? ['#A3B18A', '#4D5B3A'] : k === 'r' ? ['#BEF264', '#4D7C0F'] : ['#A7F3D0', '#3F7D5A'];
      var shirt = k === 'b' ? ['#6B7280', '#374151'] : k === 'r' ? ['#F87171', '#991B1B'] : ['#60A5FA', '#1E3A8A'];
      var bw = k === 'b' ? 0.36 : k === 'r' ? 0.24 : 0.28; // half body width (× w)
      c.lineCap = 'round'; c.lineJoin = 'round';
      // legs (one lifted)
      c.strokeStyle = '#3F3F46'; c.lineWidth = w * (k === 'b' ? 0.17 : 0.13);
      var l1 = f ? 0.9 : 0.97, l2 = f ? 0.97 : 0.9;
      c.beginPath(); c.moveTo(cx - w * 0.1, h * 0.62); c.lineTo(cx - w * 0.13, h * l1); c.moveTo(cx + w * 0.1, h * 0.62); c.lineTo(cx + w * 0.13, h * l2); c.stroke();
      c.fillStyle = '#18181B'; c.beginPath(); c.ellipse(cx - w * 0.14, h * l1, w * 0.09, h * 0.025, 0, 0, TAU); c.ellipse(cx + w * 0.14, h * l2, w * 0.09, h * 0.025, 0, 0, TAU); c.fill();
      // torso (torn shirt)
      rr(c, cx - w * bw, h * 0.3, w * bw * 2, h * 0.36, w * 0.1); c.fillStyle = lg(c, 0, h * 0.3, 0, h * 0.66, shirt); c.fill();
      c.fillStyle = sk[1]; poly(c, [cx - w * bw * 0.6, h * 0.66, cx - w * bw * 0.3, h * 0.56, cx, h * 0.66]); c.fill(); poly(c, [cx + w * bw * 0.2, h * 0.36, cx + w * bw * 0.6, h * 0.44, cx + w * bw * 0.25, h * 0.5]); c.fill();
      // arms reaching forward
      c.strokeStyle = sk[1]; c.lineWidth = w * (k === 'b' ? 0.15 : 0.11);
      var ay = f ? 0.44 : 0.48, by = f ? 0.48 : 0.44;
      c.beginPath(); c.moveTo(cx - w * bw, h * 0.36); c.lineTo(cx - w * (bw + 0.12), h * ay); c.moveTo(cx + w * bw, h * 0.36); c.lineTo(cx + w * (bw + 0.12), h * by); c.stroke();
      circ(c, cx - w * (bw + 0.12), h * ay, w * 0.075, sk[0]); circ(c, cx + w * (bw + 0.12), h * by, w * 0.075, sk[0]);
      // head
      var hr = w * (k === 'b' ? 0.2 : 0.18), hy = h * 0.19;
      circ(c, cx, hy, hr, rg(c, cx, hy, hr, sk, -hr * 0.3, -hr * 0.4));
      if (k === 'b') { c.fillStyle = lg(c, 0, hy - hr, 0, hy, ['#9CA3AF', '#374151']); c.beginPath(); c.arc(cx, hy - hr * 0.1, hr * 1.05, Math.PI, 0); c.fill(); c.fillRect(cx - hr * 1.15, hy - hr * 0.15, hr * 2.3, hr * 0.2); }
      else { c.fillStyle = '#3F2A1A'; c.beginPath(); c.arc(cx, hy - hr * 0.2, hr * 0.9, Math.PI * 1.1, Math.PI * 1.9); c.fill(); }
      circ(c, cx - hr * 0.38, hy + hr * 0.05, hr * 0.2, '#FEF08A'); circ(c, cx + hr * 0.38, hy + hr * 0.05, hr * 0.2, '#FEF08A');
      circ(c, cx - hr * 0.38, hy + hr * 0.05, hr * 0.09, '#DC2626'); circ(c, cx + hr * 0.38, hy + hr * 0.05, hr * 0.09, '#DC2626');
      c.fillStyle = '#1F1F1F'; rr(c, cx - hr * 0.35, hy + hr * 0.42, hr * 0.7, hr * 0.26, hr * 0.1); c.fill();
      c.fillStyle = '#F5F5F4'; c.fillRect(cx - hr * 0.22, hy + hr * 0.42, hr * 0.12, hr * 0.1); c.fillRect(cx + hr * 0.08, hy + hr * 0.42, hr * 0.12, hr * 0.1);
    });
  }
  boot('zombiesiege', function (A) {
    var W, H, u, dpr, T, bg, barS, gunS, zS = {}, zh, yTop, yB, gy, zs = [], spT = 0, dead = 0, won = 0, t = 0, horde = false, ang = -Math.PI / 2, fx = [], cool = 0, autoT = 0;
    function kk(y) { return clamp((y - yTop) / (yB - yTop), 0, 1); }
    function sc(y) { return 0.55 + 0.45 * kk(y); }
    function sx(z) { return W / 2 + z.x * W * (0.18 + 0.27 * kk(z.y)); }
    function dims(z) { var s = sc(z.y) * (z.k === 'b' ? 1.18 : z.k === 'r' ? 0.95 : 1); return [zh * 0.62 * s, zh * s]; }
    function spawn(live) {
      var lv = live ? A.lv() : 0, r = Math.random(), k = 'w';
      if (live && lv > 0.3 && r < 0.12 + 0.12 * lv) k = 'b'; else if (live && lv > 0.12 && r < 0.4) k = 'r';
      var D = (live ? 7.6 - 3.4 * lv : 8) * (k === 'r' ? 0.62 : k === 'b' ? 1.35 : 1);
      var x = rnd(-0.85, 0.85), tries = 0;
      while (tries++ < 6 && zs.some(function (z) { return z.y < yTop + (yB - yTop) * 0.2 && Math.abs(z.x - x) < 0.35; })) x = rnd(-0.85, 0.85);
      zs.push({ k: k, x: x, y: yTop - rnd(0, 6), v: (yB - yTop) / D, hp: k === 'b' ? 3 : 1, max: k === 'b' ? 3 : 1, ph: rnd(0, 2), hit: 0, die: 0 });
    }
    function shoot(x, y) {
      var gx = W / 2, best = null, i;
      ang = Math.atan2(y - gy, x - gx);
      var mx = gx + Math.cos(ang) * zh * 0.55, my = gy + Math.sin(ang) * zh * 0.55;
      fx.push({ x0: mx, y0: my, x1: x, y1: y, t: 0.09 });
      for (i = 0; i < zs.length; i++) {
        var z = zs[i]; if (z.die || z.hord) continue;
        var d = dims(z), zx = sx(z), pad = Math.max(10, d[0] * 0.18);
        if (x > zx - d[0] * 0.5 - pad && x < zx + d[0] * 0.5 + pad && y > z.y - d[1] - pad && y < z.y + pad && (!best || z.y > best.y)) best = z;
      }
      if (!best) { A.burst(x, y, 4, ['#A8A29E', '#D6D3D1'], 70, 0.35, 2.2); return; }
      var bx = sx(best), bd = dims(best);
      best.hp--; best.hit = 0.12; best.y = Math.max(yTop, best.y - bd[1] * 0.05);
      A.burst(bx, best.y - bd[1] * 0.6, 8, ['#84CC16', '#4D7C0F', '#D9F99D'], 120, 0.5, 3);
      if (best.hp <= 0) { best.die = 0.001; A.burst(bx, best.y - bd[1] * 0.5, 12, ['#84CC16', '#A3E635', '#365314'], 160, 0.6, 3.4); }
    }
    function crash(z) {
      if (dead) return;
      if (!A.fail(A.l.fail)) return;
      dead = 1; A.burst(sx(z), yB, 18, ['#A16207', '#FDE68A', '#78716C'], 200, 0.7, 3.4); A.shake(0.55); A.flash(0.3);
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        zh = clamp(u * 25, 62, 150);
        yTop = T + (H - T) * 0.08 + zh * 0.4; yB = H * 0.85; gy = H - Math.max(10, zh * 0.2);
        if (yB - yTop < zh * 0.9) yTop = yB - zh * 0.9;
        bg = mkc(W, H, dpr, function (c) {
          var hz = yTop - zh * 0.3;
          c.fillStyle = lg(c, 0, 0, 0, hz, ['#0B0820', '#1E1B4B', '#3B2F5C']); c.fillRect(0, 0, W, hz + 2);
          stars(c, W, H, A.lite ? 30 : 60, 0, hz * 0.8);
          var mr = Math.min(W, H) * 0.07; circ(c, W * 0.78, Math.max(mr + 4, hz * 0.4), mr * 2.4, rg(c, W * 0.78, Math.max(mr + 4, hz * 0.4), mr * 2.4, ['rgba(254,240,138,.25)', 'rgba(254,240,138,0)']));
          circ(c, W * 0.78, Math.max(mr + 4, hz * 0.4), mr, rg(c, W * 0.78, Math.max(mr + 4, hz * 0.4), mr, ['#FEFCE8', '#FDE68A', '#CA8A04'], -mr * 0.3, -mr * 0.3));
          // ruined city silhouettes
          c.fillStyle = '#120E2B';
          for (var x = -10; x < W; x += rnd(18, 34)) { var bh = rnd(0.25, 0.75) * (hz - T * 0.2); c.fillRect(x, hz - bh, rnd(16, 30), bh + 2); if (Math.random() < 0.4) poly(c, [x, hz - bh, x + 10, hz - bh - 8, x + 16, hz - bh], '#120E2B'); }
          c.fillStyle = 'rgba(253,224,71,.5)'; for (var i = 0; i < 10; i++) c.fillRect(rnd(0, W), rnd(hz * 0.55, hz - 4), 2, 3);
          // ground + road
          c.fillStyle = lg(c, 0, hz, 0, H, ['#1F2937', '#263E2A', '#1B2E1F']); c.fillRect(0, hz, W, H - hz);
          var rl = function (y) { return W / 2 - W * (0.18 + 0.27 * kk(y)) - zh * 0.35 * sc(y); };
          var top2 = hz, bot = H;
          poly(c, [rl(top2), top2, W - rl(top2), top2, W - rl(bot) + W * 0.05, bot, rl(bot) - W * 0.05, bot], lg(c, 0, top2, 0, bot, ['#3F3F46', '#52525B']));
          c.strokeStyle = 'rgba(253,224,71,.55)'; c.lineWidth = 2; c.setLineDash([10, 12]); c.beginPath(); c.moveTo(W / 2, top2); c.lineTo(W / 2, bot); c.stroke(); c.setLineDash([]);
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.2; for (i = 0; i < 6; i++) { var cx2 = rnd(W * 0.25, W * 0.75), cy2 = rnd(top2 + 10, bot - 10); c.beginPath(); c.moveTo(cx2, cy2); c.lineTo(cx2 + rnd(-14, 14), cy2 + rnd(4, 12)); c.lineTo(cx2 + rnd(-14, 14), cy2 + rnd(10, 20)); c.stroke(); }
          // fog at the horizon
          c.fillStyle = lg(c, 0, hz - zh * 0.3, 0, hz + zh * 0.6, ['rgba(167,139,250,0)', 'rgba(167,139,250,.22)', 'rgba(167,139,250,0)']); c.fillRect(0, hz - zh * 0.3, W, zh * 0.9);
          // dead trees on the sides
          c.strokeStyle = '#0F0A1F'; c.lineCap = 'round';
          [[W * 0.05, hz + zh * 0.4], [W * 0.95, hz + zh * 0.7]].forEach(function (q) { c.lineWidth = 4; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0], q[1] - zh * 0.9); c.stroke(); c.lineWidth = 2.2; c.beginPath(); c.moveTo(q[0], q[1] - zh * 0.5); c.lineTo(q[0] - zh * 0.25, q[1] - zh * 0.8); c.moveTo(q[0], q[1] - zh * 0.65); c.lineTo(q[0] + zh * 0.22, q[1] - zh * 0.95); c.stroke(); });
        });
        // the barricade (sandbags + planks), drawn over the zombies' feet
        var bh2 = H - yB;
        barS = mkc(W, bh2 + 10, dpr, function (c) {
          c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, 6);
          var sw = clamp(zh * 0.36, 22, 46), sh = sw * 0.5;
          for (var row = 0; row < 2; row++) for (var x = -(row % 2) * sw / 2; x < W; x += sw * 0.92) {
            var y = 4 + row * sh * 0.78; if (y > bh2 * 0.75) continue;
            rr(c, x, y, sw, sh, sh * 0.45); c.fillStyle = lg(c, 0, y, 0, y + sh, ['#D6C29A', '#8B7350']); c.fill();
            c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 1; c.stroke();
          }
          c.fillStyle = '#7C4A1E'; c.fillRect(W * 0.08, 2, 8, bh2 * 0.6); c.fillRect(W * 0.92 - 8, 2, 8, bh2 * 0.6);
          c.save(); c.translate(W * 0.08, 6); c.rotate(-0.12); c.fillStyle = '#92400E'; c.fillRect(-6, 0, W * 0.3, 7); c.restore();
          c.save(); c.translate(W * 0.92, 6); c.rotate(0.12); c.fillStyle = '#92400E'; c.fillRect(-W * 0.3 + 6, 0, W * 0.3, 7); c.restore();
        });
        var gl = zh * 0.75;
        gunS = mkc(gl * 1.2, gl * 0.5, dpr, function (c) { // pointing right (rotated toward the shot)
          var y = gl * 0.25;
          rr(c, 0, y - gl * 0.1, gl * 0.55, gl * 0.2, gl * 0.06); c.fillStyle = lg(c, 0, y - gl * 0.1, 0, y + gl * 0.1, ['#6B7280', '#1F2937']); c.fill();
          rr(c, gl * 0.5, y - gl * 0.045, gl * 0.6, gl * 0.09, gl * 0.03); c.fillStyle = '#111827'; c.fill();
          c.fillStyle = '#374151'; for (var i = 0; i < 4; i++) c.fillRect(gl * (0.55 + i * 0.1), y - gl * 0.065, gl * 0.03, gl * 0.13);
          rr(c, gl * 0.12, y - gl * 0.17, gl * 0.2, gl * 0.08, gl * 0.03); c.fillStyle = '#FBBF24'; c.fill();
        });
        gunS.l = gl;
        var zw = zh * 0.62;
        ['w', 'r', 'b'].forEach(function (k) { zS[k] = [0, 1].map(function (f) { return zombie(zw, zh, dpr, k, f); }); });
      },
      reset: function (live) { zs = []; dead = 0; won = 0; horde = false; fx = []; spT = live ? 0.8 : 0.3; ang = -Math.PI / 2; autoT = 0.8; },
      step: function (dt, live) {
        t += dt; cool -= dt;
        var lv = live ? A.lv() : 0, playing = A.live(), i;
        if (!dead && !horde && !won) {
          spT -= dt;
          var alive = zs.filter(function (z) { return !z.die; }).length;
          if (spT <= 0 && alive < (live ? 3 + Math.floor(5 * lv) : 3)) { spawn(live); spT = live ? Math.max(0.5, rnd(1.35, 1.85) - 0.95 * lv) : 1.9; }
        }
        if (!live && !dead && !horde) { // attract scene: the gun shoots by itself
          autoT -= dt;
          if (autoT <= 0) { autoT = 0.6; var tg = zs.filter(function (z) { return !z.die && z.y > yTop + (yB - yTop) * 0.4; }).sort(function (a, b) { return b.y - a.y; })[0]; if (tg) { var d0 = dims(tg); shoot(sx(tg), tg.y - d0[1] * 0.55); } }
        }
        for (i = zs.length - 1; i >= 0; i--) {
          var z = zs[i]; z.hit = Math.max(0, z.hit - dt);
          if (z.die) { z.die += dt; if (z.die > 0.55) zs.splice(i, 1); continue; }
          if (!dead) z.y += z.v * dt * (0.55 + 0.45 * kk(z.y)) * (z.hit ? 0.2 : 1);
          if (z.y >= yB) {
            z.y = yB;
            if (z.hord) { if (!dead) { dead = 1; A.explode(W / 2, yB, 1.6); A.flash(0.6); } continue; }
            if (playing) crash(z); else if (!live) { z.die = 0.001; }
          }
        }
        for (i = fx.length - 1; i >= 0; i--) { fx[i].t -= dt; if (fx[i].t <= 0) fx.splice(i, 1); }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var list = zs.slice().sort(function (a, b) { return a.y - b.y; }), i;
        for (i = 0; i < list.length; i++) {
          var z = list[i], d = dims(z), x = sx(z), fr = zS[z.k][((t * (z.k === 'r' ? 5 : 3) + z.ph) | 0) % 2];
          c.globalAlpha = z.die ? Math.max(0, 1 - z.die / 0.55) : 1;
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, z.y, d[0] * 0.4, d[0] * 0.1, 0, 0, TAU); c.fill();
          c.save(); c.translate(x, z.y);
          if (z.die) c.rotate(Math.min(1.2, z.die * 3) * (z.x < 0 ? -1 : 1)); else c.rotate(Math.sin(t * 3 + z.ph) * 0.05);
          c.drawImage(fr, -d[0] / 2, -d[1], d[0], d[1]);
          if (z.hit) { c.globalAlpha = 0.45; c.fillStyle = '#FEF2F2'; c.fillRect(-d[0] * 0.3, -d[1] * 0.95, d[0] * 0.6, d[1] * 0.6); }
          c.restore();
          c.globalAlpha = 1;
          if (z.max > 1 && !z.die) { var bw = d[0] * 0.6, by = z.y - d[1] - 7; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x - bw / 2, by, bw, 4); c.fillStyle = '#F43F5E'; c.fillRect(x - bw / 2, by, bw * z.hp / z.max, 4); }
        }
        c.drawImage(barS, 0, yB - 6, W, barS.h);
        for (i = 0; i < fx.length; i++) {
          var f = fx[i]; c.globalAlpha = f.t / 0.09; c.strokeStyle = '#FDE68A'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(f.x0, f.y0); c.lineTo(f.x1, f.y1); c.stroke();
          circ(c, f.x0, f.y0, zh * 0.12, 'rgba(253,186,116,.9)'); c.globalAlpha = 1;
        }
        // the gun on its tripod
        var gl = gunS.l, gx = W / 2;
        c.fillStyle = '#1F2937'; poly(c, [gx - gl * 0.28, H, gx - gl * 0.05, gy - gl * 0.05, gx + gl * 0.05, gy - gl * 0.05, gx + gl * 0.28, H]); c.fill();
        c.save(); c.translate(gx, gy); c.rotate(ang); c.drawImage(gunS, -gl * 0.25, -gl * 0.25, gl * 1.2, gl * 0.5); c.restore();
        circ(c, gx, gy, gl * 0.11, '#4B5563');
      },
      act: function (k, x, y) { if (dead || horde || cool > 0) return; cool = 0.06; shoot(x, y); },
      key: function () { // keyboard: shoot the closest zombie
        if (dead || horde) return;
        var tg = zs.filter(function (z) { return !z.die; }).sort(function (a, b) { return b.y - a.y; })[0];
        if (tg) { var d = dims(tg); shoot(sx(tg), tg.y - d[1] * 0.55); }
      },
      boom: function () {
        horde = true;
        for (var i = 0; i < 18; i++) zs.push({ k: i % 5 === 0 ? 'b' : i % 2 ? 'r' : 'w', x: -0.95 + (i % 9) * 0.24 + rnd(-0.05, 0.05), y: yTop - (i < 9 ? 0 : zh * 0.25) - rnd(0, 8), v: (yB - yTop) / 1.15, hp: 99, max: 1, ph: rnd(0, 2), hit: 0, die: 0, hord: 1 });
        A.flash(0.25);
      },
      win: function () { won = 0.001; zs.forEach(function (z) { if (!z.die) { z.die = 0.001; var d = dims(z); A.burst(sx(z), z.y - d[1] * 0.5, 6, ['#FDE68A', '#FFFFFF'], 120, 0.5, 2.6); } }); },
      dbg: function () { return { dead: dead, zs: zs.filter(function (z) { return !z.die; }).map(function (z) { var d = dims(z); return { x: sx(z), y: z.y, w: d[0], h: d[1], hp: z.hp, k: z.k }; }), yB: yB }; }
    };
  }, 'aim', 0.55);

  /* ================================================================== 3. BRICK BREAKER — drag the paddle, break the neon bricks.
     The wall slides down a row now and then; the ball speeds up and the paddle gets a little shorter as time goes on. */
  boot('brickbreak', function (A) {
    var W, H, u, dpr, T, bg, cols, bw, bh, fx0, fx1, fy0, py, pw, ph, br, bS = {}, ballS, padS;
    var bricks = [], wy = 0, addT = 0, ball = null, px = 0, ptx = 0, drag = null, dead = 0, won = 0, t = 0, fall = false, trail = [], sp = 0;
    var HUES = [['#F9A8D4', '#DB2777'], ['#FDBA74', '#EA580C'], ['#FDE68A', '#CA8A04'], ['#86EFAC', '#16A34A'], ['#67E8F9', '#0891B2'], ['#C4B5FD', '#7C3AED']];
    var rowN = 0;
    function brickS(ci, hp) {
      var key = ci + '_' + hp; if (bS[key]) return bS[key];
      var h = HUES[ci];
      bS[key] = mkc(bw, bh, dpr, function (c) {
        rr(c, 1, 1, bw - 2, bh - 2, Math.min(5, bh * 0.25)); c.fillStyle = lg(c, 0, 0, 0, bh, hp > 1 ? [h[1], '#1E1B4B'] : [h[0], h[1]]); c.fill();
        c.strokeStyle = hp > 1 ? h[0] : 'rgba(255,255,255,.45)'; c.lineWidth = hp > 1 ? 2 : 1; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, 4, 3, bw - 8, Math.max(2, bh * 0.2), 2); c.fill();
        if (hp > 1) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bw * 0.3, bh * 0.3); c.lineTo(bw * 0.45, bh * 0.55); c.lineTo(bw * 0.4, bh * 0.8); c.moveTo(bw * 0.45, bh * 0.55); c.lineTo(bw * 0.62, bh * 0.5); c.stroke(); }
      });
      return bS[key];
    }
    function addRow(live, full) {
      var lv = live ? A.lv() : 0, ci = rowN++ % HUES.length;
      bricks.forEach(function (b) { b.r++; });
      for (var i = 0; i < cols; i++) if (full || Math.random() < 0.82) { var hp = Math.random() < (live ? 0.08 + 0.3 * lv : 0.1) ? 2 : 1; bricks.push({ c: i, r: 0, hp: hp, ci: ci }); }
      wy -= bh;
    }
    function by(b) { return fy0 + b.r * bh + wy; }
    function bx(b) { return fx0 + b.c * bw; }
    function launch() { var a = rnd(-0.45, 0.45); ball = { x: px, y: py - br - 1, vx: Math.sin(a), vy: -Math.cos(a), stuck: 0.6 }; trail = []; }
    function lost() {
      if (A.live()) { if (!dead && A.fail(A.l.fail)) { dead = 1; A.shake(0.4); A.burst(ball.x, H - 4, 12, ['#F43F5E', '#FDE68A'], 160, 0.6, 3); } ball = null; return; }
      if (!fall) launch();
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        cols = W < 480 ? 7 : W < 900 ? 9 : 11;
        fx0 = 6; fx1 = W - 6; fy0 = T + 2; bw = (fx1 - fx0) / cols; bh = clamp(bw * 0.4, 12, 26);
        py = H - Math.max(16, u * 5.5); ph = Math.max(9, u * 2.4); br = clamp(u * 1.7, 5, 10);
        bS = {};
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0B0820', '#1A1145', '#120B33']); c.fillRect(0, 0, W, H);
          c.strokeStyle = 'rgba(139,92,246,.12)'; c.lineWidth = 1;
          for (var x = 0; x < W; x += 24) { c.beginPath(); c.moveTo(x + 0.5, T * 0.6); c.lineTo(x + 0.5, H); c.stroke(); }
          for (var y = T * 0.6; y < H; y += 24) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); c.stroke(); }
          circ(c, W / 2, H, Math.max(W, H) * 0.5, rg(c, W / 2, H, Math.max(W, H) * 0.5, ['rgba(236,72,153,.18)', 'rgba(236,72,153,0)']));
          c.fillStyle = lg(c, 0, 0, 0, H, ['#A78BFA', '#EC4899']); c.fillRect(0, T * 0.6, 3, H); c.fillRect(W - 3, T * 0.6, 3, H);
        });
        ballS = mkc(br * 2 + 2, br * 2 + 2, dpr, function (c) { circ(c, br + 1, br + 1, br, rg(c, br + 1, br + 1, br, ['#FFFFFF', '#FDE68A', '#F59E0B'], -br * 0.35, -br * 0.35)); });
        pw = clamp(W * 0.26, u * 16, 200);
        padS = mkc(pw * 1.3, ph + 8, dpr, function (c) {
          var w2 = pw * 1.3;
          c.fillStyle = 'rgba(236,72,153,.25)'; rr(c, 0, 0, w2, ph + 8, (ph + 8) / 2); c.fill();
          rr(c, w2 * 0.05, 4, w2 * 0.9, ph, ph / 2); c.fillStyle = lg(c, 0, 4, 0, 4 + ph, ['#FBCFE8', '#EC4899', '#9D174D']); c.fill();
          c.fillStyle = 'rgba(255,255,255,.6)'; rr(c, w2 * 0.12, 5.5, w2 * 0.76, ph * 0.25, ph * 0.12); c.fill();
          circ(c, w2 * 0.1, 4 + ph / 2, ph * 0.3, '#FDE68A'); circ(c, w2 * 0.9, 4 + ph / 2, ph * 0.3, '#FDE68A');
        });
        px = ptx = clamp(px || W / 2, pw / 2, W - pw / 2);
      },
      reset: function (live) {
        bricks = []; wy = 0; rowN = 0; for (var i = 0; i < 4; i++) addRow(false, i < 1); wy = 0;
        dead = 0; won = 0; fall = false; drag = null; px = ptx = W / 2; addT = 9; launch(); if (!live) ball.stuck = 0.2;
      },
      step: function (dt, live) {
        t += dt;
        var lv = live ? A.lv() : 0, i;
        var pwNow = clamp(W * (0.26 - 0.06 * lv), u * 15, 200); pw += (pwNow - pw) * Math.min(1, dt * 2);
        sp = Math.max(200, (H - T) * 0.8) * (1 + 0.6 * lv) * (live ? 1 : 0.9);
        if (!live && ball && !dead) ptx = ball.x + Math.sin(t * 1.3) * pw * 0.25;
        var dd = ptx - px; if (!dead) px += clamp(dd, -W * 3 * dt, W * 3 * dt);
        px = clamp(px, pw / 2, W - pw / 2);
        wy += (0 - wy) * Math.min(1, dt * 6);
        if (!fall && !dead && !won) {
          addT -= dt;
          var low = bricks.reduce(function (m, b) { return Math.max(m, b.r); }, -1);
          if (!bricks.length) { addRow(live, false); addRow(live, false); addRow(live, true); addT = 6; }
          else if (addT <= 0) { if (fy0 + (low + 2) * bh < H * 0.58) addRow(live, false); addT = Math.max(5, 10 - 4 * lv); }
        }
        if (ball && !fall) {
          if (ball.stuck > 0) { ball.stuck -= dt; ball.x = px; ball.y = py - br - 1; }
          else {
            var n = Math.max(1, Math.ceil(sp * dt / (br * 0.6))), h = dt / n;
            for (var s = 0; s < n && ball; s++) {
              ball.x += ball.vx * sp * h; ball.y += ball.vy * sp * h;
              if (ball.x < fx0 + br) { ball.x = fx0 + br; ball.vx = Math.abs(ball.vx); }
              if (ball.x > fx1 - br) { ball.x = fx1 - br; ball.vx = -Math.abs(ball.vx); }
              if (ball.y < fy0 + br) { ball.y = fy0 + br; ball.vy = Math.abs(ball.vy); }
              if (ball.vy > 0 && ball.y + br >= py && ball.y - br <= py + ph && ball.x > px - pw / 2 - br * 0.6 && ball.x < px + pw / 2 + br * 0.6 && !dead) {
                var rel = clamp((ball.x - px) / (pw / 2), -1, 1), a = rel * 1.0;
                ball.vx = Math.sin(a); ball.vy = -Math.cos(a); ball.y = py - br; A.ring(ball.x, py, br * 2.5, '#F9A8D4');
              }
              for (i = bricks.length - 1; i >= 0; i--) {
                var b = bricks[i], x0 = bx(b), y0 = by(b), cx = clamp(ball.x, x0, x0 + bw), cy = clamp(ball.y, y0, y0 + bh), ex = ball.x - cx, ey = ball.y - cy;
                if (ex * ex + ey * ey >= br * br) continue;
                var ox = Math.min(Math.abs(ball.x - x0), Math.abs(ball.x - x0 - bw)), oy = Math.min(Math.abs(ball.y - y0), Math.abs(ball.y - y0 - bh));
                if (ball.x > x0 && ball.x < x0 + bw) ball.vy = ball.y < y0 + bh / 2 ? -Math.abs(ball.vy) : Math.abs(ball.vy);
                else if (ball.y > y0 && ball.y < y0 + bh) ball.vx = ball.x < x0 + bw / 2 ? -Math.abs(ball.vx) : Math.abs(ball.vx);
                else if (ox < oy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
                b.hp--;
                if (b.hp <= 0) { bricks.splice(i, 1); A.burst(x0 + bw / 2, y0 + bh / 2, 9, [HUES[b.ci][0], HUES[b.ci][1], '#fff'], 140, 0.5, 3); }
                else A.burst(x0 + bw / 2, y0 + bh / 2, 4, ['#fff', HUES[b.ci][0]], 90, 0.35, 2.4);
                break;
              }
              // never too flat: keep a minimum vertical speed
              if (Math.abs(ball.vy) < 0.34) { ball.vy = ball.vy < 0 ? -0.34 : 0.34; }
              var m = Math.hypot(ball.vx, ball.vy); ball.vx /= m; ball.vy /= m;
              if (ball.y - br > H) { lost(); break; }
            }
            if (ball && !A.lite) { trail.push(ball.x, ball.y); if (trail.length > 14) trail.splice(0, 2); }
          }
        }
        if (fall) {
          for (i = 0; i < bricks.length; i++) { var q = bricks[i]; q.vy += H * 2.6 * dt; q.fy += q.vy * dt; q.rot += q.vr * dt; if (!dead && q.fy + bh >= py) { dead = 1; A.explode(px, py, 1.5); A.flash(0.6); } }
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var i;
        for (i = 0; i < bricks.length; i++) {
          var b = bricks[i], im = brickS(b.ci, b.hp);
          if (fall) { c.save(); c.translate(bx(b) + bw / 2, b.fy + bh / 2); c.rotate(b.rot); c.drawImage(im, -bw / 2, -bh / 2, bw, bh); c.restore(); }
          else c.drawImage(im, bx(b), by(b), bw, bh);
        }
        if (trail.length > 3) { c.strokeStyle = 'rgba(253,230,138,.3)'; c.lineWidth = br * 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(trail[0], trail[1]); for (i = 2; i < trail.length; i += 2) c.lineTo(trail[i], trail[i + 1]); c.stroke(); }
        if (ball && !fall) c.drawImage(ballS, ball.x - br - 1, ball.y - br - 1, br * 2 + 2, br * 2 + 2);
        if (!dead) { var w2 = pw * 1.3, k = won ? 1 + 0.1 * Math.sin(won * 12) : 1; c.drawImage(padS, px - w2 * k / 2, py - 4, w2 * k, ph + 8); }
      },
      down: function (x) { if (!dead) drag = { o: px - x }; },
      move: function (x) { if (drag && !dead && !won) ptx = clamp(x + drag.o, pw / 2, W - pw / 2); },
      up: function () { drag = null; },
      key: function (k) { if (dead) return; if (k === 'left') ptx = clamp(ptx - W * 0.14, pw / 2, W - pw / 2); if (k === 'right') ptx = clamp(ptx + W * 0.14, pw / 2, W - pw / 2); },
      boom: function () {
        drag = null; fall = true; ball = null; trail = [];
        if (bricks.length < cols) { addRow(false, true); wy = 0; }
        bricks.forEach(function (b) { b.fy = by(b); b.vy = rnd(0, 80); b.vr = rnd(-3, 3); b.rot = 0; });
        A.shake(0.3);
      },
      win: function () { won = 0.001; drag = null; bricks.forEach(function (b) { A.burst(bx(b) + bw / 2, by(b) + bh / 2, 2, ['#FDE68A', '#FFFFFF'], 110, 0.5, 2.6); }); bricks = []; ball = null; trail = []; },
      dbg: function () { return { px: px, ptx: ptx, pw: pw, py: py, W: W, dead: dead, ball: ball ? { x: ball.x, y: ball.y, vx: ball.vx * sp, vy: ball.vy * sp, stuck: ball.stuck } : null, n: bricks.length }; }
    };
  }, 'drag', 0.62);

  /* ================================================================== 4. NEON SNAKE — the classic snake on a neon grid: swipe to turn.
     Smooth movement between the cells; up to 2 turns are kept in advance; the speed rises slowly. */
  boot('neonsnake', function (A) {
    var W, H, u, dpr, T, bg, cell, cols, rows, gx0, gy0, gemS, body = [], prev = [], dir = [0, -1], q = [], food = null, stepT = 0, dead = 0, won = 0, t = 0, close = null, grow = 0, sps = 4;
    function free(x, y) { return !body.some(function (b) { return b[0] === x && b[1] === y; }); }
    function placeFood() {
      var tries = 0, x, y;
      do { x = (Math.random() * cols) | 0; y = (Math.random() * rows) | 0; } while (tries++ < 200 && (!free(x, y) || (Math.abs(x - body[0][0]) + Math.abs(y - body[0][1]) < 3)));
      food = { x: x, y: y, t: 0 };
    }
    function cx(x) { return gx0 + (x + 0.5) * cell; }
    function cy(y) { return gy0 + (y + 0.5) * cell; }
    function blocked(x, y, tailFree) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) return true;
      for (var i = 0; i < body.length - (tailFree ? 1 : 0); i++) if (body[i][0] === x && body[i][1] === y) return true;
      return false;
    }
    function auto() {
      var opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (d) { return !(d[0] === -dir[0] && d[1] === -dir[1]) && !blocked(body[0][0] + d[0], body[0][1] + d[1], true); });
      if (!opts.length) return;
      opts.sort(function (a, b) { var da = Math.abs(body[0][0] + a[0] - food.x) + Math.abs(body[0][1] + a[1] - food.y), db = Math.abs(body[0][0] + b[0] - food.x) + Math.abs(body[0][1] + b[1] - food.y); return da - db; });
      dir = opts[0];
    }
    function step(live) {
      prev = body.map(function (b) { return b.slice(); });
      if (!live) auto();
      if (q.length) { var nd = q.shift(); if (!(nd[0] === -dir[0] && nd[1] === -dir[1])) dir = nd; }
      var nx = body[0][0] + dir[0], ny = body[0][1] + dir[1];
      if (blocked(nx, ny, !grow)) {
        if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.explode(cx(body[0][0]) + dir[0] * cell * 0.5, cy(body[0][1]) + dir[1] * cell * 0.5, 0.9); } }
        else if (!live) start0();
        return;
      }
      body.unshift([nx, ny]);
      if (food && nx === food.x && ny === food.y) { grow += 1; A.burst(cx(nx), cy(ny), 12, ['#F0ABFC', '#FDE68A', '#fff'], 130, 0.5, 3, 0); A.ring(cx(nx), cy(ny), cell * 1.2, '#F0ABFC'); placeFood(); }
      if (grow > 0) grow--; else body.pop();
      if (!live && body.length > 14) start0();
    }
    function start0() {
      var x = (cols / 2) | 0, y = Math.min(rows - 1, ((rows / 2) | 0) + 2);
      body = []; for (var i = 0; i < 4; i++) body.push([x, Math.min(rows - 1, y + i)]);
      prev = body.map(function (b) { return b.slice(); }); dir = [0, -1]; q = []; grow = 0; stepT = 0; placeFood();
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        var aw = W - 12, ah = H - T - 8;
        cell = clamp(Math.floor(Math.min(aw / 13, ah / 11)), 12, 44);
        cols = Math.max(8, Math.floor(aw / cell)); rows = Math.max(6, Math.floor(ah / cell));
        gx0 = Math.round((W - cols * cell) / 2); gy0 = Math.round(T + 2 + (ah - rows * cell) / 2);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#05140F', '#0B1F2A', '#0A0A24']); c.fillRect(0, 0, W, H);
          stars(c, W, H, A.lite ? 20 : 40, 0, gy0);
          c.fillStyle = 'rgba(6,20,30,.85)'; c.fillRect(gx0, gy0, cols * cell, rows * cell);
          c.fillStyle = 'rgba(52,211,153,.16)';
          for (var x = 0; x < cols; x++) for (var y = 0; y < rows; y++) { if ((x + y) % 2) c.fillRect(gx0 + x * cell, gy0 + y * cell, cell, cell); }
          c.fillStyle = 'rgba(52,211,153,.06)'; c.fillRect(gx0, gy0, cols * cell, rows * cell);
          c.strokeStyle = 'rgba(236,72,153,.35)'; c.lineWidth = 6; c.strokeRect(gx0 - 3, gy0 - 3, cols * cell + 6, rows * cell + 6);
          c.strokeStyle = '#F472B6'; c.lineWidth = 2; c.strokeRect(gx0 - 2, gy0 - 2, cols * cell + 4, rows * cell + 4);
        });
        gemS = mkc(cell, cell, dpr, function (c) {
          var m = cell / 2, r = cell * 0.36;
          circ(c, m, m, cell * 0.5, rg(c, m, m, cell * 0.5, ['rgba(240,171,252,.5)', 'rgba(240,171,252,0)']));
          poly(c, [m, m - r, m + r * 0.85, m - r * 0.2, m, m + r, m - r * 0.85, m - r * 0.2], lg(c, 0, m - r, 0, m + r, ['#FCE7F3', '#E879F9', '#86198F']));
          poly(c, [m, m - r, m + r * 0.85, m - r * 0.2, m - r * 0.85, m - r * 0.2], 'rgba(255,255,255,.35)');
        });
        if (!body.length || body.some(function (b) { return b[0] >= cols || b[1] >= rows; })) start0();
      },
      reset: function (live) { dead = 0; won = 0; close = null; start0(); },
      step: function (dt, live) {
        t += dt; if (food) food.t += dt;
        var lv = live ? A.lv() : 0;
        sps = live ? 4.4 + 3.4 * lv : 5;
        if (!dead && !close && !won) { stepT += dt * sps; while (stepT >= 1 && !dead) { stepT -= 1; step(live); } }
        if (close) {
          close.t += dt;
          var k = Math.floor(close.t / 0.075);
          if (k > close.k) {
            close.k = k;
            var hx = body[0][0], hy = body[0][1];
            if (!dead && Math.min(hx, hy, cols - 1 - hx, rows - 1 - hy) < k) { dead = 1; A.explode(cx(hx), cy(hy), 1.3); A.flash(0.6); }
          }
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var f = (dead || close || won) ? 1 : clamp(stepT, 0, 1), i, pts = [];
        for (i = 0; i < body.length; i++) {
          var a = prev[i] || body[i], b = body[i];
          if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) > 1) a = b;
          pts.push(cx(a[0] + (b[0] - a[0]) * f), cy(a[1] + (b[1] - a[1]) * f));
        }
        if (food) { var s = 1 + 0.1 * Math.sin(food.t * 5); c.drawImage(gemS, cx(food.x) - cell * s / 2, cy(food.y) - cell * s / 2, cell * s, cell * s); }
        if (pts.length >= 4 && !(dead && close)) {
          c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath(); c.moveTo(pts[0], pts[1]); for (i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
          c.strokeStyle = 'rgba(74,222,128,.25)'; c.lineWidth = cell * 1.0; c.stroke();
          c.strokeStyle = dead ? '#F87171' : '#4ADE80'; c.lineWidth = cell * 0.66; c.stroke();
          c.strokeStyle = dead ? '#FECACA' : '#BBF7D0'; c.lineWidth = cell * 0.16; c.stroke();
          var hx = pts[0], hy = pts[1], d0 = dir[0], d1 = dir[1], er = cell * 0.13;
          circ(c, hx, hy, cell * 0.42, dead ? '#EF4444' : '#22C55E');
          var ex = -d1 * cell * 0.18, ey = d0 * cell * 0.18, fx = d0 * cell * 0.12, fy = d1 * cell * 0.12;
          circ(c, hx + ex + fx, hy + ey + fy, er, '#fff'); circ(c, hx - ex + fx, hy - ey + fy, er, '#fff');
          circ(c, hx + ex + fx * 1.5, hy + ey + fy * 1.5, er * 0.5, '#052E16'); circ(c, hx - ex + fx * 1.5, hy - ey + fy * 1.5, er * 0.5, '#052E16');
        }
        if (close && close.k > 0) {
          var k = Math.min(close.k, Math.ceil(Math.max(cols, rows) / 2));
          c.fillStyle = 'rgba(244,63,94,.85)';
          c.fillRect(gx0, gy0, cols * cell, k * cell); c.fillRect(gx0, gy0 + (rows - k) * cell, cols * cell, k * cell);
          c.fillRect(gx0, gy0, k * cell, rows * cell); c.fillRect(gx0 + (cols - k) * cell, gy0, k * cell, rows * cell);
          c.strokeStyle = '#FDE68A'; c.lineWidth = 2; c.strokeRect(gx0 + k * cell, gy0 + k * cell, Math.max(0, (cols - 2 * k) * cell), Math.max(0, (rows - 2 * k) * cell));
        }
      },
      act: function (k) {
        if (dead || close) return;
        var d = k === 'left' ? [-1, 0] : k === 'right' ? [1, 0] : k === 'up' ? [0, -1] : k === 'down' ? [0, 1] : null;
        if (!d || q.length >= 2) return;
        var last = q.length ? q[q.length - 1] : dir;
        if ((d[0] === last[0] && d[1] === last[1]) || (d[0] === -last[0] && d[1] === -last[1])) return;
        q.push(d);
      },
      boom: function () { close = { t: 0, k: 0 }; q = []; },
      win: function () { won = 0.001; if (food) A.burst(cx(food.x), cy(food.y), 8, ['#FDE68A', '#FFFFFF'], 120, 0.5, 2.6, 0); food = null; },
      dbg: function () { return { body: body, dir: dir, q: q, food: food, cols: cols, rows: rows, dead: dead, stepT: stepT, sps: sps }; }
    };
  }, 'swipe4', 0.3);
})(window.D6 = window.D6 || {});
