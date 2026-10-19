/* v2819 — "You're in control" group 5 (owner request, round 5): HELIX DROP (drag to turn the tower, the ball drops through
   the gaps), COLOR JUMP (tap to jump through your color), CUPCAKE PARTY (tap to frost each cupcake on the belt) and
   PRINCESS RUSH (tap left / right: the flower gate of her dress color). MIXED MODE like Aviator, but the player plays: the
   multiplier follows the SERVER clock (×e^(rate·s), casino_ext.php 'skill', rate 0.03 → ×2 after ~23 s), the gold button
   cashes out, a mistake loses (K.multi 'fail'), and the server's secret end arrives as an unavoidable event (lightning,
   black hole, the piping bag bursts, midnight strikes). Canvas 2D at 60 fps, own drawings (no image file), sprites pre-drawn
   once per size, pauses when the tab is hidden. Same engine as js/games/skill4.js (copied: each module file stands alone).
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
    helixdrop: {
      en: ['Drag to turn the tower', 'Red zone!', 'Lightning strike!', 'Drag left or right to turn the tower and let the ball drop through the gaps. A floor breaks after a few bounces. Landing on red ends the round.'],
      fr: ['Glisse pour tourner la tour', 'Zone rouge !', 'La foudre !', 'Glisse à gauche ou à droite pour tourner la tour et faire tomber la balle dans les trous. Un étage casse après quelques rebonds. Tomber sur du rouge termine la partie.'],
      es: ['Desliza para girar la torre', '¡Zona roja!', '¡Un rayo!', 'Desliza a la izquierda o a la derecha para girar la torre y dejar caer la bola por los huecos. Un piso se rompe tras unos rebotes. Caer en el rojo termina la ronda.'],
      pt: ['Deslize para girar a torre', 'Zona vermelha!', 'Um raio!', 'Deslize para a esquerda ou direita para girar a torre e deixar a bola cair pelos buracos. Um andar quebra após alguns quiques. Cair no vermelho encerra a rodada.'],
      ar: ['اسحب لتدوير البرج', 'منطقة حمراء!', 'صاعقة!', 'اسحب يسارًا أو يمينًا لتدوير البرج وإسقاط الكرة عبر الفتحات. ينكسر الطابق بعد بضع ارتدادات. السقوط على الأحمر ينهي الجولة.'],
      tr: ['Kuleyi çevirmek için kaydır', 'Kırmızı bölge!', 'Yıldırım!', 'Kuleyi çevirip topu boşluklardan düşürmek için sola ya da sağa kaydır. Bir kat birkaç sekmeden sonra kırılır. Kırmızıya düşmek turu bitirir.'],
      vi: ['Kéo để xoay tháp', 'Vùng đỏ!', 'Sét đánh!', 'Kéo sang trái hoặc phải để xoay tháp, cho bóng rơi qua các khe. Mỗi tầng vỡ sau vài lần nảy. Rơi vào vùng đỏ là kết thúc ván.'],
      id: ['Geser untuk memutar menara', 'Zona merah!', 'Sambaran petir!', 'Geser ke kiri atau kanan untuk memutar menara dan menjatuhkan bola lewat celah. Lantai pecah setelah beberapa pantulan. Mendarat di merah mengakhiri ronde.'],
      ru: ['Веди, чтобы вращать башню', 'Красная зона!', 'Удар молнии!', 'Веди пальцем влево или вправо, чтобы вращать башню и ронять мяч в проёмы. Этаж ломается после нескольких отскоков. Попадание на красное завершает раунд.'],
      de: ['Ziehen, um den Turm zu drehen', 'Rote Zone!', 'Blitzeinschlag!', 'Ziehe nach links oder rechts, um den Turm zu drehen und den Ball durch die Lücken fallen zu lassen. Eine Etage bricht nach ein paar Sprüngen. Landen auf Rot beendet die Runde.'],
      hi: ['टावर घुमाने को खींचें', 'लाल ज़ोन!', 'बिजली गिरी!', 'टावर घुमाकर गेंद को खाली जगहों से नीचे गिराने के लिए बाएँ या दाएँ खींचें। कुछ उछालों के बाद मंज़िल टूट जाती है। लाल पर गिरना राउंड खत्म करता है।'],
      zh: ['拖动旋转高塔', '红色区域！', '雷电击中！', '左右拖动旋转高塔，让球从缺口落下。每层弹跳几次就会碎裂。落在红色区域，本回合结束。']
    },
    colorjump: {
      en: ['Tap to jump', 'Wrong color!', 'Black hole!', 'Tap to make the ball jump. Pass only through your ball’s color — a star changes it. Touching another color or falling ends the round.', 'Fell!'],
      fr: ['Touche pour sauter', 'Mauvaise couleur !', 'Trou noir !', 'Touche pour faire sauter la balle. Passe seulement par la couleur de ta balle — une étoile la change. Toucher une autre couleur ou tomber termine la partie.', 'Chute !'],
      es: ['Toca para saltar', '¡Color equivocado!', '¡Agujero negro!', 'Toca para que la bola salte. Pasa solo por el color de tu bola: una estrella lo cambia. Tocar otro color o caer termina la ronda.', '¡Caída!'],
      pt: ['Toque para pular', 'Cor errada!', 'Buraco negro!', 'Toque para a bola pular. Passe só pela cor da sua bola — uma estrela a muda. Tocar outra cor ou cair encerra a rodada.', 'Caiu!'],
      ar: ['المس للقفز', 'لون خاطئ!', 'ثقب أسود!', 'المس لتقفز الكرة. مرّ فقط عبر لون كرتك — النجمة تغيّره. لمس لون آخر أو السقوط ينهي الجولة.', 'سقطت!'],
      tr: ['Zıplamak için dokun', 'Yanlış renk!', 'Kara delik!', 'Topu zıplatmak için dokun. Yalnızca topunun renginden geç — yıldız rengini değiştirir. Başka renge değmek ya da düşmek turu bitirir.', 'Düştün!'],
      vi: ['Chạm để nhảy', 'Sai màu!', 'Hố đen!', 'Chạm để bóng nhảy lên. Chỉ đi qua phần cùng màu với bóng — ngôi sao sẽ đổi màu bóng. Chạm màu khác hoặc rơi xuống là kết thúc ván.', 'Rơi rồi!'],
      id: ['Ketuk untuk melompat', 'Warna salah!', 'Lubang hitam!', 'Ketuk agar bola melompat. Lewati hanya warna bolamu — bintang akan mengubahnya. Menyentuh warna lain atau jatuh mengakhiri ronde.', 'Jatuh!'],
      ru: ['Тап — прыжок', 'Не тот цвет!', 'Чёрная дыра!', 'Нажимай, чтобы мяч прыгал. Проходи только через цвет своего мяча — звезда меняет его. Касание другого цвета или падение завершает раунд.', 'Падение!'],
      de: ['Tippen zum Springen', 'Falsche Farbe!', 'Schwarzes Loch!', 'Tippe, damit der Ball springt. Passiere nur die Farbe deines Balls — ein Stern ändert sie. Eine andere Farbe oder ein Absturz beendet die Runde.', 'Abgestürzt!'],
      hi: ['कूदने के लिए टैप करें', 'गलत रंग!', 'ब्लैक होल!', 'गेंद को कुदाने के लिए टैप करें। सिर्फ़ अपनी गेंद के रंग से गुज़रें — तारा रंग बदलता है। दूसरे रंग को छूना या नीचे गिरना राउंड खत्म करता है।', 'गिर गई!'],
      zh: ['点击跳跃', '颜色不对！', '黑洞！', '点击让球跳起。只能穿过与球同色的部分——星星会改变球的颜色。碰到其他颜色或掉落，本回合结束。', '掉下去了！']
    },
    cupcake: {
      en: ['Tap to pipe the frosting', 'Missed!', 'Frosting burst!', 'Tap to pipe frosting onto each cupcake as it passes under the piping bag. Frosting on the belt, or a plain cupcake leaving, ends the round.', 'Forgot one!'],
      fr: ['Touche pour mettre la crème', 'Raté !', 'La poche explose !', 'Touche pour déposer la crème sur chaque cupcake qui passe sous la poche. De la crème sur le tapis, ou un cupcake qui part sans crème, termine la partie.', 'Un oubli !'],
      es: ['Toca para poner la crema', '¡Fallaste!', '¡Explota la manga!', 'Toca para poner crema en cada cupcake cuando pase bajo la manga pastelera. Crema en la cinta, o un cupcake que se va sin crema, termina la ronda.', '¡Se te olvidó uno!'],
      pt: ['Toque para pôr a cobertura', 'Errou!', 'O saco estourou!', 'Toque para pôr cobertura em cada cupcake que passa sob o saco de confeitar. Cobertura na esteira, ou um cupcake que sai sem cobertura, encerra a rodada.', 'Esqueceu um!'],
      ar: ['المس لوضع الكريمة', 'أخطأت!', 'انفجار الكريمة!', 'المس لوضع الكريمة على كل كب كيك يمرّ تحت كيس التزيين. الكريمة على الحزام أو خروج كب كيك بلا كريمة ينهي الجولة.', 'نسيت واحدة!'],
      tr: ['Krema sıkmak için dokun', 'Kaçırdın!', 'Krema patladı!', 'Sıkma torbasının altından geçen her kekin üstüne krema sıkmak için dokun. Bandın üstüne krema ya da kremasız giden bir kek turu bitirir.', 'Birini unuttun!'],
      vi: ['Chạm để bắt kem', 'Trượt rồi!', 'Túi kem nổ tung!', 'Chạm để bắt kem lên mỗi chiếc cupcake khi nó đi qua dưới túi kem. Kem rơi xuống băng chuyền, hoặc một chiếc cupcake chưa có kem đi qua, là kết thúc ván.', 'Bỏ sót một chiếc!'],
      id: ['Ketuk untuk menghias krim', 'Meleset!', 'Krim meledak!', 'Ketuk untuk menaruh krim di setiap cupcake yang lewat di bawah kantong krim. Krim jatuh di ban berjalan, atau cupcake polos yang lewat, mengakhiri ronde.', 'Ada yang terlewat!'],
      ru: ['Тап — выдавить крем', 'Мимо!', 'Мешок лопнул!', 'Нажимай, чтобы выдавить крем на каждый капкейк, проезжающий под кондитерским мешком. Крем на ленте или капкейк, уехавший без крема, завершает раунд.', 'Один пропущен!'],
      de: ['Tippen zum Verzieren', 'Daneben!', 'Spritzbeutel geplatzt!', 'Tippe, um Creme auf jeden Cupcake zu spritzen, der unter dem Spritzbeutel vorbeifährt. Creme auf dem Band oder ein Cupcake ohne Creme beendet die Runde.', 'Einen vergessen!'],
      hi: ['क्रीम डालने को टैप करें', 'चूक गए!', 'क्रीम की थैली फटी!', 'पाइपिंग बैग के नीचे से गुज़रते हर कपकेक पर क्रीम डालने के लिए टैप करें। बेल्ट पर क्रीम गिरी या कोई कपकेक बिना क्रीम निकल गया तो राउंड खत्म।', 'एक छूट गया!'],
      zh: ['点击挤奶油', '挤歪了！', '裱花袋爆了！', '纸杯蛋糕经过裱花袋下方时，点击把奶油挤上去。奶油掉在传送带上，或有蛋糕没挤奶油就离开，本回合结束。', '漏了一个！']
    },
    princess: {
      en: ['Tap left or right to pick a gate', 'Wrong gate!', 'Midnight!', 'Tap the left or right side (or swipe) to walk through the gate of your dress color. A magic arch gives you a new dress. The wrong gate ends the round.'],
      fr: ['Touche à gauche ou à droite', 'Mauvaise porte !', 'Minuit !', 'Touche le côté gauche ou droit (ou glisse) pour passer la porte de la couleur de ta robe. Une arche magique te donne une nouvelle robe. La mauvaise porte termine la partie.'],
      es: ['Toca a la izquierda o a la derecha', '¡Puerta equivocada!', '¡Medianoche!', 'Toca el lado izquierdo o derecho (o desliza) para pasar por la puerta del color de tu vestido. Un arco mágico te da un vestido nuevo. La puerta equivocada termina la ronda.'],
      pt: ['Toque à esquerda ou à direita', 'Portal errado!', 'Meia-noite!', 'Toque no lado esquerdo ou direito (ou deslize) para passar pelo portal da cor do seu vestido. Um arco mágico te dá um vestido novo. O portal errado encerra a rodada.'],
      ar: ['المس يسارًا أو يمينًا للاختيار', 'بوابة خاطئة!', 'منتصف الليل!', 'المس الجهة اليسرى أو اليمنى (أو اسحب) للعبور من البوابة التي بلون الفستان. القوس السحري يمنح فستانًا جديدًا. البوابة الخاطئة تنهي الجولة.'],
      tr: ['Seçmek için sola ya da sağa dokun', 'Yanlış kapı!', 'Gece yarısı!', 'Elbisenin rengindeki kapıdan geçmek için sol ya da sağ tarafa dokun (veya kaydır). Sihirli kemer yeni bir elbise verir. Yanlış kapı turu bitirir.'],
      vi: ['Chạm trái hoặc phải để chọn', 'Sai cổng!', 'Nửa đêm!', 'Chạm bên trái hoặc phải (hoặc vuốt) để đi qua cổng cùng màu váy. Cổng phép thuật mang lại chiếc váy mới. Đi sai cổng là kết thúc ván.'],
      id: ['Ketuk kiri atau kanan', 'Gerbang salah!', 'Tengah malam!', 'Ketuk sisi kiri atau kanan (atau usap) untuk melewati gerbang sewarna gaunmu. Gerbang ajaib memberi gaun baru. Gerbang yang salah mengakhiri ronde.'],
      ru: ['Тап слева или справа — выбор', 'Не та арка!', 'Полночь!', 'Нажимай слева или справа (или проводи), чтобы пройти через арку цвета платья. Волшебная арка дарит новое платье. Неверная арка завершает раунд.'],
      de: ['Links oder rechts tippen', 'Falsches Tor!', 'Mitternacht!', 'Tippe links oder rechts (oder wische), um durch das Tor in der Farbe deines Kleides zu gehen. Ein Zaubertor schenkt dir ein neues Kleid. Das falsche Tor beendet die Runde.'],
      hi: ['चुनने को बाएँ या दाएँ टैप करें', 'गलत गेट!', 'आधी रात!', 'ड्रेस के रंग वाले गेट से गुज़रने के लिए बायाँ या दायाँ हिस्सा टैप करें (या स्वाइप करें)। जादुई गेट नई ड्रेस देता है। गलत गेट राउंड खत्म करता है।'],
      zh: ['点击左边或右边选择', '走错门了！', '午夜钟声！', '点击左侧或右侧（或滑动），走进与裙子同色的拱门。魔法拱门会换上新裙子。走错拱门，本回合结束。']
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

  /* ================================================================== 1. HELIX DROP — a ball bounces on a spiral tower: drag to turn the
     tower so the ball drops through the gaps. Red parts = mistake. A floor breaks after 3 bounces (no waiting forever).
     Fair: the part just under the gap you fell through is never red; the next floor is always visible. */
  boot('helixdrop', function (A) {
    var W, H, u, dpr, T, bg, poleS, ballS, cx, R, e = 0.34, th, rp, sp, br, rb, N = 12, STEP = TAU / 12;
    var plats = [], rot = 0, by = 0, vy = 0, cur = 0, cam = 0, drag = null, dead = 0, won = 0, t = 0, bolt = null, squash = 0, lastGap = 0, gen = 0, autoW = 0;
    var COLS = [['#C4B5FD', '#7C3AED', '#5B21B6'], ['#F9A8D4', '#DB2777', '#9D174D'], ['#67E8F9', '#0891B2', '#155E75'], ['#FDE68A', '#D97706', '#92400E'], ['#86EFAC', '#16A34A', '#166534']];
    function md(a) { return ((a % TAU) + TAU) % TAU; }
    function under() { return Math.floor(md(Math.PI / 2 - rot) / STEP) % N; }
    function mkPlat(live) {
      var i = gen++, lv = live ? A.lv() : 0, s = [], k;
      for (k = 0; k < N; k++) s.push(0);
      var gw = i === 0 ? 2 : (lv < 0.5 ? 3 : 2), g0 = (Math.random() * N) | 0;
      if (i === 0) g0 = (under() + 5) % N; // the first floor: the gap at the back
      for (k = 0; k < gw; k++) s[(g0 + k) % N] = 1;
      var safe = {}; for (k = -1; k <= 1; k++) safe[(lastGap + k + N) % N] = 1;
      var nr = i < 2 ? 0 : live ? Math.min(5, Math.floor(1 + 3.4 * lv + Math.random())) : 2, tries = 0;
      while (nr > 0 && tries++ < 60) { var r = (Math.random() * N) | 0; if (s[r] === 0 && !safe[r]) { s[r] = 2; nr--; } }
      lastGap = (g0 + ((gw - 1) / 2 | 0)) % N;
      plats.push({ i: i, y: i * sp, s: s, hits: 0, gone: 0, c: COLS[i % COLS.length] });
    }
    function surf(p) { return p.y + rb * e; }
    function crash() {
      if (dead) return;
      if (!A.fail(A.l.fail)) return;
      dead = 1; A.burst(cx, by - cam, 18, ['#F43F5E', '#FDE68A', '#fff'], 180, 0.6, 3.4); A.shake(0.45);
    }
    function seg(c, y, a0, a1, ro, ri) { c.beginPath(); c.ellipse(cx, y, ro, ro * e, 0, a0, a1); c.ellipse(cx, y, ri, ri * e, 0, a1, a0, true); c.closePath(); }
    function band(c, y, a0, a1) { c.beginPath(); c.ellipse(cx, y, R, R * e, 0, a0, a1); c.ellipse(cx, y + th, R, R * e, 0, a1, a0, true); c.closePath(); }
    // each run of same-type sectors, split into back (far, upper) and front (near, lower) halves
    function runs(p, fn) {
      var k = 0;
      while (k < N) {
        var ty = p.s[k], n = 1; while (k + n < N && p.s[k + n] === ty) n++;
        if (ty !== 1) {
          var a0 = k * STEP + rot, a1 = (k + n) * STEP + rot, q = Math.floor(a0 / Math.PI);
          for (; q * Math.PI < a1; q++) { var b0 = Math.max(a0, q * Math.PI), b1 = Math.min(a1, (q + 1) * Math.PI); if (b1 - b0 > 1e-4) fn(ty, b0, b1, ((q % 2) + 2) % 2 === 0); }
        }
        k += n;
      }
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        cx = W / 2; R = Math.min(W * 0.38, (H - T) * 0.36, 190); th = R * 0.13; rp = R * 0.22; sp = 2 * R * e + th + R * 0.42; br = Math.max(6, R * 0.12); rb = R * 0.7;
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#120B33', '#2A1460', '#3B1D6E']); c.fillRect(0, 0, W, H);
          circ(c, cx, H * 0.55, Math.max(W, H) * 0.5, rg(c, cx, H * 0.55, Math.max(W, H) * 0.5, ['rgba(236,72,153,.22)', 'rgba(236,72,153,0)']));
          stars(c, W, H, A.lite ? 40 : 90);
        });
        poleS = mkc(rp * 2, 8, dpr, function (c) { c.fillStyle = lg(c, 0, 0, rp * 2, 0, ['#A78BFA', '#F5F3FF', '#C4B5FD', '#6D28D9']); c.fillRect(0, 0, rp * 2, 8); });
        ballS = mkc(br * 2 + 2, br * 2 + 2, dpr, function (c) { circ(c, br + 1, br + 1, br, rg(c, br + 1, br + 1, br, ['#FFFFFF', '#FDBA74', '#EA580C', '#7C2D12'], -br * 0.35, -br * 0.4)); });
        if (plats.length) { plats.forEach(function (p) { p.y = p.i * sp; }); }
      },
      reset: function (live) {
        plats = []; gen = 0; lastGap = 0; rot = 0; dead = 0; won = 0; bolt = null; drag = null; squash = 0;
        mkPlat(live); mkPlat(live); mkPlat(live);
        cur = 0; by = surf(plats[0]) - br - sp * 0.3; vy = 0; cam = by - (T + (H - T) * 0.36); autoW = 0;
      },
      step: function (dt, live) {
        t += dt; squash = Math.max(0, squash - dt * 5);
        var playing = A.live(), i;
        while (plats.length < 2 || plats[plats.length - 1].y < cam + H + sp) mkPlat(live);
        for (i = plats.length - 1; i >= 0; i--) { var p = plats[i]; if (p.gone) p.gone += dt; if (p.y < cam - sp * 2 && p.gone > 0.5) plats.splice(i, 1); }
        if (!live && !dead && !bolt) { // attract scene: turns the gap toward the ball
          var cp = plats.filter(function (q) { return q.i === cur; })[0];
          if (cp) { var gi = cp.s.indexOf(1), want = Math.PI / 2 - (gi + 0.5) * STEP, dd = md(want - rot + Math.PI) - Math.PI; autoW += (clamp(dd * 3, -2.4, 2.4) - autoW) * Math.min(1, dt * 4); rot += autoW * dt; }
        }
        if (!dead && !bolt && !won) {
          var g = sp * 11;
          vy = Math.min(vy + g * dt, sp * 4.2);
          var ny = by + vy * dt;
          var pl = plats.filter(function (q) { return q.i === cur; })[0];
          if (pl && vy > 0 && ny + br >= surf(pl) && by + br <= surf(pl) + 1) {
            var ty = pl.gone ? 1 : pl.s[under()];
            if (ty === 1) { if (!pl.gone) { pl.gone = 0.001; A.burst(cx, surf(pl) - cam, 8, [pl.c[0], pl.c[1]], 120, 0.5, 3); } cur++; by = ny; }
            else if (ty === 2) { by = surf(pl) - br; if (playing) crash(); else { vy = -Math.sqrt(2 * g * sp * 0.42); } }
            else {
              by = surf(pl) - br; vy = -Math.sqrt(2 * g * sp * 0.42); squash = 1;
              A.burst(cx, by + br - cam, 5, [pl.c[0], '#fff'], 70, 0.35, 2.4);
              if (live) { pl.hits++; if (pl.hits >= 4) { pl.gone = 0.001; A.burst(cx, surf(pl) - cam, 16, [pl.c[0], pl.c[1], pl.c[2]], 160, 0.6, 3.4); A.shake(0.15); cur++; vy = 0; } }
            }
          } else by = ny;
        }
        var tc = by - (T + (H - T) * 0.36);
        cam += (tc - cam) * Math.min(1, dt * 6);
        if (bolt) { bolt.t += dt; if (!bolt.hit && bolt.t > 0.3) { bolt.hit = 1; dead = 1; A.explode(cx, by - cam, 1.4); A.flash(0.8); } }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var vis = plats.filter(function (p) { var y = p.y - cam; return y > -R && y < H + R; }), i;
        var front = [];
        for (i = 0; i < vis.length; i++) {
          var p = vis[i], y = p.y - cam, k = p.gone ? Math.min(1, p.gone / 0.4) : 0;
          if (k >= 1) continue;
          c.globalAlpha = 1 - k;
          var ro = R * (1 + k * 0.5), ri = rp;
          runs(p, function (ty, a0, a1, fr) {
            if (fr) { front.push([p, y, ty, a0, a1, ro, ri, k]); return; }
            seg(c, y, a0, a1, ro, ri); c.fillStyle = ty === 2 ? '#B91C1C' : p.c[1]; c.fill();
          });
        }
        c.globalAlpha = 1;
        c.drawImage(poleS, cx - rp, 0, rp * 2, H);
        for (i = 0; i < front.length; i++) {
          var f = front[i]; c.globalAlpha = 1 - f[7];
          band(c, f[1], f[3], f[4]); c.fillStyle = f[2] === 2 ? '#7F1D1D' : f[0].c[2]; c.fill();
          seg(c, f[1], f[3], f[4], f[5], f[6]); c.fillStyle = f[2] === 2 ? '#EF4444' : f[0].c[0]; c.fill();
          if (f[2] === 2) { c.strokeStyle = 'rgba(254,202,202,.8)'; c.lineWidth = 1.2; c.stroke(); }
          if (f[0].hits >= 2 && f[2] === 0) { // cracks: this floor will break
            c.strokeStyle = 'rgba(30,10,60,.6)'; c.lineWidth = 1.4; c.beginPath();
            for (var q = 0; q < f[0].hits; q++) { var am = (f[3] + f[4]) / 2 + (q - 1) * 0.12, rx = (R + rp) / 2; c.moveTo(cx + Math.cos(am) * rp * 1.1, f[1] + Math.sin(am) * rp * 1.1 * e); c.lineTo(cx + Math.cos(am + 0.08) * rx, f[1] + Math.sin(am + 0.08) * rx * e + 2); c.lineTo(cx + Math.cos(am - 0.05) * R * 0.95, f[1] + Math.sin(am - 0.05) * R * 0.95 * e); }
            c.stroke();
          }
        }
        c.globalAlpha = 1;
        if (!dead) {
          var bx = cx, byS = by - cam, sq = squash * 0.25;
          c.fillStyle = 'rgba(0,0,0,.25)';
          c.drawImage(ballS, bx - br * (1 + sq) - 1, byS - br * (1 - sq) - 1 + br * sq, (br * 2 + 2) * (1 + sq), (br * 2 + 2) * (1 - sq));
        }
        if (bolt) {
          c.strokeStyle = bolt.t % 0.1 < 0.05 ? '#FEF9C3' : '#A5F3FC'; c.lineWidth = 4; c.lineJoin = 'round';
          c.beginPath(); c.moveTo(bolt.p[0][0], bolt.p[0][1]); for (i = 1; i < bolt.p.length; i++) c.lineTo(bolt.p[i][0], bolt.p[i][1] * Math.min(1, bolt.t / 0.18)); c.stroke();
        }
      },
      down: function (x) { if (!dead) drag = { x: x }; },
      move: function (x) { if (!drag || dead || won) return; rot -= (x - drag.x) / (R * 1.25); drag.x = x; },
      up: function () { drag = null; },
      key: function (k) { if (dead) return; if (k === 'left') rot += STEP; if (k === 'right') rot -= STEP; },
      boom: function () {
        drag = null; var y1 = by - cam, pts = [[cx + rnd(-W * 0.2, W * 0.2), 0]], n = 7;
        for (var i = 1; i < n; i++) pts.push([cx + rnd(-R * 0.4, R * 0.4), y1 * i / n]);
        pts.push([cx, y1]); bolt = { t: 0, p: pts }; A.flash(0.3);
      },
      win: function () { won = 0.001; drag = null; A.burst(cx, by - cam, 14, ['#FDE68A', '#FFFFFF'], 140, 0.6, 2.8); },
      dbg: function () { var p = plats.filter(function (q) { return q.i === cur; })[0], n = plats.filter(function (q) { return q.i === cur + 1; })[0]; return { rot: rot, under: under(), cur: cur, vy: vy, dead: dead, s: p ? p.s : null, hits: p ? p.hits : 0, next: n ? n.s : null, R: R }; }
    };
  }, 'drag', 0.8);

  /* ================================================================== 2. COLOR JUMP — tap to jump through the turning color wheels:
     pass only through your own color; a star gives you a new color. Waiting is not an option: the ball falls. */
  boot('colorjump', function (A) {
    var W, H, u, dpr, T, bg, br, ballS = [], starS, cx, by = 0, vy = 0, cam = 0, col = 0, obs = [], stars2 = [], topY = 0, hover = 0, dead = 0, won = 0, t = 0, hole = null, trail = [], idleT = 0;
    var CL = ['#F43F5E', '#FACC15', '#22D3EE', '#A855F7'];
    function ringR() { return Math.min(W * 0.34, (H - T) * 0.24, 160); }
    function add(live) {
      var lv = live ? A.lv() : 0, gap = (H - T) * (obs.length ? 0.66 - 0.12 * Math.min(1, lv) : 0.5), y = topY - gap, R = ringR(), tk = Math.max(9, R * 0.16), r = Math.random();
      var ty = live && lv > 0.4 && r < 0.3 ? 'double' : live && lv > 0.15 && r < 0.55 ? 'bar' : 'ring';
      var w = (0.85 + 1.0 * lv) * (Math.random() < 0.5 ? -1 : 1);
      obs.push({ ty: ty, y: y, R: R, tk: tk, rot: Math.random() * TAU, w: w, off: Math.random() * W * 2, v: W * (0.3 + 0.28 * lv) * (Math.random() < 0.5 ? -1 : 1) });
      stars2.push({ y: y + gap / 2, on: 1 });
      topY = y;
    }
    function ringCol(o, ang, R) { var a = md(ang - o.rot); return Math.floor(a / (Math.PI / 2)) % 4; }
    function md(a) { return ((a % TAU) + TAU) % TAU; }
    function crash(why) {
      if (dead) return;
      if (!A.fail(why)) return;
      dead = 1; A.burst(cx, by - cam, 20, CL, 200, 0.7, 3.4); A.shake(0.4);
    }
    function hitTest() {
      for (var i = 0; i < obs.length; i++) {
        var o = obs[i], dy = by - o.y, list = o.ty === 'double' ? [o.R, o.R * 0.7] : [o.R];
        if (o.ty === 'bar') {
          if (Math.abs(dy) < o.tk / 2 + br * 0.75) {
            for (var q = -1; q <= 1; q++) { var x = cx + q * br * 0.6, s = Math.floor(md2(x + o.off, W * 2) / (W / 2)) % 4; if (s !== col) return true; }
          }
          continue;
        }
        for (var j = 0; j < list.length; j++) {
          var R = list[j], d = Math.abs(dy);
          if (Math.abs(d - R) < o.tk / 2 + br * 0.75) {
            var base = dy < 0 ? -Math.PI / 2 : Math.PI / 2, dl = Math.asin(Math.min(1, br * 0.6 / R)), rr0 = j ? -o.rot * 1.0 : o.rot;
            for (q = -1; q <= 1; q++) { var a = md(base + q * dl - rr0); if (Math.floor(a / (Math.PI / 2)) % 4 !== col) return true; }
          }
        }
      }
      return false;
    }
    function md2(a, m) { return ((a % m) + m) % m; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top; cx = W / 2;
        br = clamp(u * 2.3, 8, 15);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0B0820', '#17123A', '#0E0A26']); c.fillRect(0, 0, W, H);
          circ(c, W * 0.2, H * 0.3, Math.max(W, H) * 0.4, rg(c, W * 0.2, H * 0.3, Math.max(W, H) * 0.4, ['rgba(168,85,247,.16)', 'rgba(168,85,247,0)']));
          circ(c, W * 0.85, H * 0.8, Math.max(W, H) * 0.35, rg(c, W * 0.85, H * 0.8, Math.max(W, H) * 0.35, ['rgba(34,211,238,.12)', 'rgba(34,211,238,0)']));
          stars(c, W, H, A.lite ? 40 : 100);
        });
        ballS = CL.map(function (cl) { return mkc(br * 2 + 2, br * 2 + 2, dpr, function (c) { circ(c, br + 1, br + 1, br, rg(c, br + 1, br + 1, br, ['#FFFFFF', cl, cl], -br * 0.4, -br * 0.4)); }); });
        var sr = br * 1.3;
        starS = mkc(sr * 2 + 2, sr * 2 + 2, dpr, function (c) {
          c.translate(sr + 1, sr + 1);
          for (var k = 0; k < 4; k++) { c.fillStyle = CL[k]; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, sr, k * Math.PI / 2, (k + 1) * Math.PI / 2); c.closePath(); c.fill(); }
          c.globalCompositeOperation = 'destination-in'; c.beginPath();
          for (k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? sr * 0.45 : sr; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
          c.closePath(); c.fill();
        });
        starS.r = sr;
        obs.forEach(function (o) { o.R = ringR(); o.tk = Math.max(9, o.R * 0.16); });
      },
      reset: function (live) {
        obs = []; stars2 = []; dead = 0; won = 0; hole = null; trail = []; col = (Math.random() * 4) | 0;
        by = H * 0.82; vy = 0; cam = 0; topY = by; hover = live ? 1.3 : 0; idleT = 0;
        add(live); add(live); add(live);
      },
      step: function (dt, live) {
        t += dt;
        var playing = A.live(), i;
        for (i = 0; i < obs.length; i++) { obs[i].rot += obs[i].w * dt; obs[i].off += obs[i].v * dt; }
        while (topY > cam - H) add(live);
        for (i = obs.length - 1; i >= 0; i--) if (obs[i].y - cam > H + obs[i].R * 2) obs.splice(i, 1);
        for (i = stars2.length - 1; i >= 0; i--) if (stars2[i].y - cam > H + 40) stars2.splice(i, 1);
        if (!dead && !hole && !won) {
          if (hover > 0) { hover -= dt; by += Math.sin(t * 6) * 0.3; }
          else {
            vy = Math.min(vy + (H - T) * 2.7 * dt, (H - T) * 1.6);
            by += vy * dt;
            if (!live) { if (by - cam > H * 0.8 && vy > 0) vy = -(H - T) * 0.95; }
          }
          if (playing && hitTest()) crash(A.l.fail);
          for (i = 0; i < stars2.length; i++) { var s = stars2[i]; if (s.on && Math.abs(by - s.y) < br + starS.r * 0.8) { s.on = 0; if (live) { var nc = (col + 1 + ((Math.random() * 3) | 0)) % 4; col = nc; } A.burst(cx, s.y - cam, 12, CL, 150, 0.5, 3, 0); } }
          if (playing && by - cam > H + br) crash(A.l.fail2);
          var lim = T + (H - T) * 0.42;
          if (by - cam < lim) cam = by - lim;
          if (!A.lite) { trail.push(by); if (trail.length > 8) trail.shift(); }
        }
        if (hole) {
          hole.t += dt; hole.r = Math.min(hole.R, hole.r + dt * hole.R * 3);
          var k = Math.min(1, hole.t / 0.7); hole.a += dt * 9;
          hole.bx = cx + Math.cos(hole.a) * hole.R * 0.8 * (1 - k); hole.by = hole.y + Math.sin(hole.a) * hole.R * 0.8 * (1 - k);
          if (!hole.hit && k >= 1) { hole.hit = 1; dead = 1; A.burst(cx, hole.y - cam, 24, ['#A855F7', '#F0ABFC', '#fff'], 220, 0.7, 3); A.flash(0.5); }
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var i, q;
        c.lineCap = 'butt';
        for (i = 0; i < obs.length; i++) {
          var o = obs[i], y = o.y - cam;
          if (y < -o.R * 1.5 || y > H + o.R * 1.5) continue;
          if (o.ty === 'bar') {
            var sw = W / 2, x0 = -md2(o.off, W * 2);
            for (q = 0; q < 6; q++) { c.fillStyle = CL[q % 4]; c.fillRect(x0 + q * sw, y - o.tk / 2, sw + 0.5, o.tk); }
            continue;
          }
          var list = o.ty === 'double' ? [[o.R, o.rot], [o.R * 0.7, -o.rot]] : [[o.R, o.rot]];
          c.lineWidth = o.tk;
          for (var j = 0; j < list.length; j++) for (q = 0; q < 4; q++) { c.strokeStyle = CL[q]; c.beginPath(); c.arc(cx, y, list[j][0], list[j][1] + q * Math.PI / 2 + 0.015, list[j][1] + (q + 1) * Math.PI / 2 - 0.015); c.stroke(); }
        }
        for (i = 0; i < stars2.length; i++) if (stars2[i].on) { var sy = stars2[i].y - cam, sr = starS.r * (1 + 0.08 * Math.sin(t * 5)); c.save(); c.translate(cx, sy); c.rotate(t * 1.5); c.drawImage(starS, -sr - 1, -sr - 1, sr * 2 + 2, sr * 2 + 2); c.restore(); }
        if (hole) {
          var hy = hole.y - cam;
          circ(c, cx, hy, hole.r * 1.6, rg(c, cx, hy, hole.r * 1.6, ['rgba(0,0,0,1)', 'rgba(88,28,135,.8)', 'rgba(168,85,247,0)']));
          c.strokeStyle = 'rgba(240,171,252,.6)'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, hy, hole.r * 1.25, hole.r * 0.45, hole.a * 0.3, 0, TAU); c.stroke();
        }
        if (!dead) {
          var bx = hole ? hole.bx : cx, byy = (hole ? hole.by : by) - cam, s = hole ? 1 - Math.min(0.8, hole.t) : 1;
          if (!hole) for (i = 0; i < trail.length - 1; i++) { c.globalAlpha = (i + 1) / trail.length * 0.3; circ(c, cx, trail[i] - cam, br * (0.4 + 0.5 * i / trail.length), CL[col]); }
          c.globalAlpha = 1;
          if (won) s *= 1 + 0.15 * Math.sin(won * 12);
          c.drawImage(ballS[col], bx - (br + 1) * s, byy - (br + 1) * s, (br * 2 + 2) * s, (br * 2 + 2) * s);
        }
      },
      act: function () { if (dead || hole || won) return; hover = 0; vy = -(H - T) * 0.95; },
      boom: function () { hole = { y: by - (H - T) * 0.12, t: 0, r: 0, R: Math.max(30, br * 4), a: 0, bx: cx, by: by }; },
      win: function () { won = 0.001; A.burst(cx, by - cam, 14, CL, 140, 0.6, 2.8); },
      dbg: function () { return { by: by, cam: cam, vy: vy, col: col, H: H, T: T, br: br, hover: hover, dead: dead, obs: obs.map(function (o) { return { ty: o.ty, y: o.y, R: o.R, tk: o.tk, rot: o.rot, w: o.w, off: o.off, v: o.v }; }), W: W }; }
    };
  }, 'tap', 0.47);

  /* ================================================================== 3. CUPCAKE PARTY — cupcakes ride a conveyor belt under the piping bag:
     tap to drop a swirl of frosting on each one. A dotted guide shows where the frosting falls. */
  boot('cupcake', function (A) {
    var W, H, u, dpr, T, bg, bagS, beltY, bh, cw, chh, tipY, topY, cakeS = [], frS = [], cakes = [], drops = [], splats = [], spD = 0, roll = 0, v = 0, dead = 0, won = 0, t = 0, burst = null, FT = 0.28, autoCool = 0;
    var FR = [['#FFF1F2', '#F9A8D4', '#DB2777'], ['#FFFBEB', '#FDE68A', '#F59E0B'], ['#F0FDFA', '#99F6E4', '#14B8A6'], ['#FAF5FF', '#D8B4FE', '#9333EA'], ['#FDF2F8', '#7C2D12', '#451A03']];
    var WR = [['#F472B6', '#BE185D'], ['#67E8F9', '#0E7490'], ['#C4B5FD', '#6D28D9'], ['#FDE68A', '#B45309']];
    function cake(i) {
      var w = cw, h = chh, wr = WR[i];
      return mkc(w, h, dpr, function (c) {
        // dome of cake
        c.fillStyle = lg(c, 0, h * 0.25, 0, h * 0.55, ['#FCD9A8', '#C98A4B']); c.beginPath(); c.ellipse(w / 2, h * 0.5, w * 0.44, h * 0.24, 0, Math.PI, 0); c.fill();
        // wrapper (trapezoid with pleats)
        poly(c, [w * 0.08, h * 0.48, w * 0.92, h * 0.48, w * 0.8, h * 0.98, w * 0.2, h * 0.98], lg(c, 0, h * 0.48, 0, h, wr));
        c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = Math.max(1, w * 0.025);
        for (var k = 1; k < 7; k++) { var x0 = w * 0.08 + k * w * 0.84 / 7, x1 = w * 0.2 + k * w * 0.6 / 7; c.beginPath(); c.moveTo(x0, h * 0.5); c.lineTo(x1, h * 0.97); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(w * 0.08, h * 0.47, w * 0.84, h * 0.04);
      });
    }
    function frost(i) {
      var w = cw, h = cw * 0.8, f = FR[i];
      return mkc(w, h, dpr, function (c) {
        var cxx = w / 2;
        [[0.86, 0.17, 0.82], [0.68, 0.15, 0.62], [0.48, 0.13, 0.44], [0.28, 0.1, 0.29]].forEach(function (q) {
          c.fillStyle = lg(c, 0, h * (q[2] - q[1]), 0, h * (q[2] + q[1]), [f[0], f[1], f[2]]);
          c.beginPath(); c.ellipse(cxx, h * q[2], w * q[0] / 2, h * q[1], 0, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(cxx - w * q[0] * 0.15, h * (q[2] - q[1] * 0.4), w * q[0] * 0.18, h * q[1] * 0.3, 0, 0, TAU); c.fill();
        });
        poly(c, [cxx - w * 0.07, h * 0.2, cxx + w * 0.07, h * 0.2, cxx + w * 0.01, h * 0.06], f[1]);
        var sc = ['#F43F5E', '#FACC15', '#22D3EE', '#A855F7', '#fff'];
        for (var k = 0; k < 9; k++) { c.fillStyle = sc[k % 5]; c.save(); c.translate(cxx + rnd(-w * 0.32, w * 0.32), h * rnd(0.45, 0.85)); c.rotate(rnd(0, 3)); c.fillRect(-w * 0.03, -w * 0.008, w * 0.06, w * 0.016 + 1); c.restore(); }
        circ(c, cxx + w * 0.02, h * 0.1, w * 0.075, rg(c, cxx + w * 0.02, h * 0.1, w * 0.075, ['#FECACA', '#DC2626', '#7F1D1D'], -w * 0.02, -w * 0.02));
        c.strokeStyle = '#166534'; c.lineWidth = Math.max(1, w * 0.02); c.beginPath(); c.moveTo(cxx + w * 0.02, h * 0.04); c.quadraticCurveTo(cxx + w * 0.06, -h * 0.02, cxx + w * 0.1, h * 0.0); c.stroke();
      });
    }
    function spawnGap(live) { var lv = live ? A.lv() : 0; return cw * rnd(1.75 - 0.4 * Math.min(1, lv), 3.0 - 0.8 * Math.min(1, lv)); }
    function crash(why, x, y) {
      if (dead) return;
      if (!A.fail(why)) return;
      dead = 1; A.shake(0.35); if (x !== undefined) A.burst(x, y, 14, ['#F9A8D4', '#FFF1F2', '#DB2777'], 160, 0.6, 3.4);
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        cw = clamp(u * 15, 44, 110); chh = cw * 0.9; bh = Math.max(14, u * 4);
        beltY = T + (H - T) * 0.74; if (beltY + bh > H - 4) beltY = H - 4 - bh;
        topY = beltY - chh * 0.5; tipY = Math.max(T + cw * 0.7, topY - Math.max(cw * 1.4, (H - T) * 0.32));
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#3B0A30', '#831843', '#F9A8D4']); c.fillRect(0, 0, W, H);
          // wall stripes
          c.fillStyle = 'rgba(255,255,255,.06)'; for (var x = 0; x < W; x += 28) c.fillRect(x, 0, 14, beltY);
          // bunting
          var by0 = Math.max(T * 0.85, 8), cols = ['#FDE68A', '#F0ABFC', '#99F6E4', '#FDA4AF'];
          c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, by0); c.quadraticCurveTo(W / 2, by0 + 16, W, by0); c.stroke();
          for (var i = 0; i < 14; i++) { var fx = (i + 0.5) * W / 14, fy = by0 + 16 * (1 - Math.pow((fx - W / 2) / (W / 2), 2)) * 0.5; poly(c, [fx - 8, fy, fx + 8, fy, fx, fy + 14], cols[i % 4]); }
          // shelf with jars
          var sy = tipY + (topY - tipY) * 0.35;
          c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, sy, W * 0.3, 5); c.fillRect(W * 0.7, sy, W * 0.3, 5);
          [[W * 0.06, '#FDE68A'], [W * 0.16, '#F0ABFC'], [W * 0.78, '#99F6E4'], [W * 0.9, '#FDA4AF']].forEach(function (j) { rr(c, j[0], sy - 22, 16, 22, 4); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); rr(c, j[0] + 2, sy - 14, 12, 12, 3); c.fillStyle = j[1]; c.fill(); c.fillStyle = '#F472B6'; c.fillRect(j[0] - 1, sy - 25, 18, 4); });
          // counter under the belt
          c.fillStyle = lg(c, 0, beltY + bh, 0, H, ['#FDF2F8', '#F9A8D4']); c.fillRect(0, beltY + bh, W, H - beltY - bh);
          c.fillStyle = 'rgba(157,23,77,.25)'; c.fillRect(0, beltY + bh, W, 3);
          // belt body + rollers
          rr(c, -10, beltY, W + 20, bh, bh / 2); c.fillStyle = '#3F3F46'; c.fill();
          c.fillStyle = '#71717A'; c.fillRect(0, beltY, W, 2);
          // target mark under the bag
          c.strokeStyle = 'rgba(255,255,255,.55)'; c.setLineDash([3, 5]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(W / 2, tipY + 10); c.lineTo(W / 2, topY - 4); c.stroke(); c.setLineDash([]);
        });
        var bw = cw * 0.9, bhh = tipY - T + 8;
        bagS = mkc(bw, Math.max(20, bhh), dpr, function (c, w2, h2) {
          poly(c, [0, 0, w2, 0, w2 * 0.6, h2 * 0.86, w2 * 0.4, h2 * 0.86], lg(c, 0, 0, w2, 0, ['#F9A8D4', '#FCE7F3', '#EC4899']));
          c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(w2 * 0.25, h2 * 0.1); c.lineTo(w2 * 0.45, h2 * 0.75); c.stroke();
          rr(c, -2, -4, w2 + 4, 10, 5); c.fillStyle = '#DB2777'; c.fill();
          poly(c, [w2 * 0.38, h2 * 0.84, w2 * 0.62, h2 * 0.84, w2 * 0.56, h2, w2 * 0.44, h2], lg(c, 0, 0, w2, 0, ['#9CA3AF', '#F3F4F6', '#6B7280']));
        });
        cakeS = WR.map(function (q, i) { return cake(i); }); frS = FR.map(function (q, i) { return frost(i); });
      },
      reset: function (live) { cakes = []; drops = []; splats = []; dead = 0; won = 0; burst = null; spD = live ? cw * 1.2 : 0; v = 0; autoCool = 0; },
      step: function (dt, live) {
        t += dt;
        var lv = live ? A.lv() : 0, playing = A.live(), i, j;
        var tv = dead || burst ? 0 : Math.max(W * (live ? 0.2 + 0.17 * lv : 0.2), 70);
        v += (tv - v) * Math.min(1, dt * 3);
        var dx = v * dt; roll += dx;
        if (!dead && !burst && !won) { spD -= dx; if (spD <= 0) { cakes.push({ x: -cw * 0.6, k: (Math.random() * WR.length) | 0, f: -1 }); spD = spawnGap(live); } }
        for (i = cakes.length - 1; i >= 0; i--) {
          var ck = cakes[i]; ck.x += dx;
          if (ck.x > W + cw) { cakes.splice(i, 1); continue; }
          if (playing && ck.f < 0 && !ck.miss && ck.x > W / 2 + cw * 0.42 + v * FT + 4) { ck.miss = 1; crash(A.l.fail2, ck.x, topY); }
        }
        if (!live && !dead && !burst) { // attract scene: the bag frosts by itself
          autoCool -= dt;
          if (autoCool <= 0) for (i = 0; i < cakes.length; i++) if (cakes[i].f < 0 && !cakes[i].aim && Math.abs(cakes[i].x + v * FT - W / 2) < cw * 0.12) { cakes[i].aim = 1; drops.push({ t: 0, k: (Math.random() * FR.length) | 0 }); autoCool = 0.15; break; }
        }
        for (i = drops.length - 1; i >= 0; i--) {
          var d = drops[i]; d.t += dt;
          if (!d.land && d.t >= FT) {
            d.land = 1; var hit = null;
            for (j = 0; j < cakes.length; j++) if (Math.abs(cakes[j].x - W / 2) < cw * 0.42) hit = cakes[j];
            if (hit) { if (hit.f < 0) hit.f = d.k; drops.splice(i, 1); A.burst(hit.x, topY - cw * 0.2, 10, ['#FDE68A', '#fff', FR[d.k][1]], 120, 0.45, 2.6, 0); A.ring(hit.x, topY - cw * 0.3, cw * 0.6, '#fff'); continue; }
          }
          if (d.land && d.t >= FT * 1.25) { drops.splice(i, 1); splats.push({ x: W / 2 - roll, k: d.k }); if (playing) crash(A.l.fail, W / 2, beltY); }
        }
        if (burst) { burst.t += dt; if (!burst.hit && burst.t > 0.45) { burst.hit = 1; dead = 1; A.burst(W / 2, tipY - cw * 0.4, 40, ['#F9A8D4', '#FFF1F2', '#DB2777', '#FDE68A'], 320, 0.9, 4.5); A.flash(0.5); A.shake(0.5); } }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var i, sh = 14;
        // moving belt stripes
        c.fillStyle = 'rgba(255,255,255,.12)'; var o = roll % sh;
        for (var x = -sh + o; x < W; x += sh) c.fillRect(x, beltY + 3, 3, bh - 6);
        for (i = 0; i < splats.length; i++) { var sx = splats[i].x + roll; if (sx > -cw && sx < W + cw) { c.fillStyle = FR[splats[i].k][1]; c.beginPath(); c.ellipse(sx, beltY + 1, cw * 0.35, bh * 0.3, 0, 0, TAU); c.fill(); } }
        for (i = 0; i < cakes.length; i++) {
          var ck = cakes[i], cy0 = beltY - chh + chh * 0.02;
          c.drawImage(cakeS[ck.k], ck.x - cw / 2, cy0, cw, chh);
          if (ck.f >= 0) c.drawImage(frS[ck.f], ck.x - cw / 2, cy0 + chh * 0.32 - cw * 0.62, cw, cw * 0.8);
          if (burst && burst.hit) { c.fillStyle = 'rgba(249,168,212,.9)'; c.beginPath(); c.ellipse(ck.x, cy0 + chh * 0.3, cw * 0.4, cw * 0.18, 0, 0, TAU); c.fill(); }
        }
        for (i = 0; i < drops.length; i++) {
          var d = drops[i], k = d.t / FT, y = tipY + (topY - tipY) * k * k, s = 0.55 + 0.45 * Math.min(1, k);
          c.drawImage(frS[d.k], W / 2 - cw * s / 2, y - cw * 0.5 * s, cw * s, cw * 0.8 * s);
        }
        // the piping bag (shakes and swells for the secret end)
        var bw = bagS.w, bhh = bagS.h, sc = burst ? 1 + Math.min(0.45, burst.t) * 0.9 : 1;
        if (!(burst && burst.hit)) { c.save(); c.translate(W / 2 + (burst ? (Math.random() - 0.5) * 6 : 0), tipY); c.scale(sc, sc); c.drawImage(bagS, -bw / 2, -bhh, bw, bhh); c.restore(); }
        if (burst && burst.hit) {
          c.fillStyle = 'rgba(249,168,212,.85)';
          for (i = 0; i < burst.blobs.length; i++) { var b = burst.blobs[i]; c.beginPath(); c.ellipse(b[0], b[1], b[2], b[2] * 0.7, b[3], 0, TAU); c.fill(); }
        }
      },
      act: function () {
        if (dead || burst || won) return;
        if (drops.filter(function (d) { return !d.land; }).length >= 2) return;
        drops.push({ t: 0, k: (Math.random() * FR.length) | 0 });
      },
      boom: function () { burst = { t: 0, blobs: [] }; for (var i = 0; i < 16; i++) burst.blobs.push([rnd(0, W), rnd(T, H), rnd(cw * 0.25, cw * 0.7), rnd(0, 3)]); },
      win: function () { won = 0.001; cakes.forEach(function (ck) { if (ck.f < 0) ck.f = (Math.random() * FR.length) | 0; A.burst(ck.x, topY - cw * 0.2, 5, ['#FDE68A', '#FFFFFF'], 110, 0.5, 2.6); }); },
      dbg: function () { return { W: W, cw: cw, v: v, FT: FT, dead: dead, cakes: cakes.map(function (c) { return { x: c.x, f: c.f }; }), drops: drops.length }; }
    };
  }, 'tap', 0.88);

  /* ================================================================== 4. PRINCESS RUSH — a princess walks the garden path to the castle:
     tap left / right to go through the flower gate of HER DRESS color (each color has its own icon too: heart, crown, star,
     diamond — readable without colors). A magic arch gives her a new dress. Secret end: midnight strikes, the magic ends. */
  boot('princess', function (A) {
    var W, H, u, dpr, T, bg, hy, ny, lw, F = 3.2, ZM = 2.2, mh, SPR = {}, icons = {}, gates = [], lane = -1, px = -0.5, look = 0, genLook = 0, sinceArch = 0, spD = 0, v = 0, dist = 0, dead = 0, won = 0, t = 0, twirl = 0, fall = null, mid = null, flies = [];
    var LK = [['#FBCFE8', '#EC4899', '#9D174D'], ['#DDD6FE', '#8B5CF6', '#4C1D95'], ['#FEF3C7', '#F59E0B', '#92400E'], ['#CCFBF1', '#14B8A6', '#115E59']];
    function Pz(z) { return 1 / (1 + F * Math.max(-0.15, z)); }
    function SY(z) { return hy + (ny - hy) * Pz(z); }
    function SX(lx, z) { return W / 2 + lx * lw * Pz(z); }
    function icon(c, k, x, y, r, fill) {
      c.fillStyle = fill || '#fff'; c.beginPath();
      if (k === 0) { c.moveTo(x, y + r * 0.85); c.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.6, y - r * 1.05, x, y - r * 0.35); c.bezierCurveTo(x + r * 0.6, y - r * 1.05, x + r * 1.3, y - r * 0.1, x, y + r * 0.85); }
      else if (k === 1) { c.moveTo(x - r, y + r * 0.6); c.lineTo(x - r, y - r * 0.5); c.lineTo(x - r * 0.45, y); c.lineTo(x, y - r * 0.8); c.lineTo(x + r * 0.45, y); c.lineTo(x + r, y - r * 0.5); c.lineTo(x + r, y + r * 0.6); }
      else if (k === 2) { for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } }
      else { c.moveTo(x, y + r); c.lineTo(x - r, y - r * 0.2); c.lineTo(x - r * 0.55, y - r * 0.75); c.lineTo(x + r * 0.55, y - r * 0.75); c.lineTo(x + r, y - r * 0.2); }
      c.closePath(); c.fill();
    }
    function iconS(k) {
      if (icons[k]) return icons[k];
      icons[k] = mkc(64, 64, 1, function (c) { circ(c, 32, 32, 30, '#fff'); circ(c, 32, 32, 26, lg(c, 0, 6, 0, 58, [LK[k][0], LK[k][1]])); icon(c, k, 32, 33, 15, '#fff'); });
      return icons[k];
    }
    // the princess seen from behind (ball gown, long hair, tiara): v2860 — a real figure (D6.Rig) with a 6-frame walk, drawn once per dress colour
    var NF = 6, PROP = null;
    function tiara(c, x, y, r) {
      c.fillStyle = lg(c, x - r, 0, x + r, 0, ['#FEF3C7', '#FACC15', '#B45309']); c.beginPath(); c.moveTo(x - r * 0.75, y - r * 0.55);
      [[-0.55, -1.0], [-0.35, -0.7], [0, -1.25], [0.35, -0.7], [0.55, -1.0], [0.75, -0.55]].forEach(function (q) { c.lineTo(x + q[0] * r, y + q[1] * r); });
      c.quadraticCurveTo(x, y - r * 0.75, x - r * 0.75, y - r * 0.55); c.fill();
      circ(c, x, y - r * 1.05, r * 0.12, '#F0ABFC'); circ(c, x - r * 0.03, y - r * 1.08, r * 0.04, '#fff');
    }
    function model(k, f) {
      var key = k + '_' + f; if (SPR[key]) return SPR[key];
      var w = mh * 0.72, h = mh, L = LK[k];
      var pal = { build: 'f', skin: '#F2C9A8', hair: '#E3AE3C', style: 'long', top: [L[1], L[2]], sleeve: 'short', legs: 'dress', gown: 1, flare: 0.19, skirt: [L[0], L[1]], trim: '#FDE68A', sparkle: 1, shoe: '#E0F2FE', gloves: '#FFFFFF',
        hat: function (c, x, y, r, vw) { tiara(c, x, y - r * 0.55, r * 0.6); } };
      SPR[key] = D6.Rig ? D6.Rig.one(w, h, dpr, { view: 'back', pose: 'walk', ph: f / NF, pal: pal, scale: 0.97 }) : mkc(w, h, dpr, function () {});
      return SPR[key];
    }
    function quad(c, lx0, lx1, z0, z1) { c.beginPath(); c.moveTo(SX(lx0, z0), SY(z0)); c.lineTo(SX(lx1, z0), SY(z0)); c.lineTo(SX(lx1, z1), SY(z1)); c.lineTo(SX(lx0, z1), SY(z1)); c.closePath(); c.fill(); }
    function addRow(live) {
      var lv = live ? A.lv() : 0;
      if (sinceArch >= 4 && Math.random() < 0.45) {
        var nl = (genLook + 1 + ((Math.random() * 3) | 0)) % 4;
        gates.push({ z: ZM, arch: 1, nl: nl }); genLook = nl; sinceArch = 0; return 1.0;
      }
      var other = (genLook + 1 + ((Math.random() * 3) | 0)) % 4, side = Math.random() < 0.5 ? -1 : 1;
      gates.push({ z: ZM, l: side < 0 ? genLook : other, r: side < 0 ? other : genLook });
      sinceArch++;
      return live ? Math.max(0.72, 1.1 - 0.32 * lv) * rnd(0.95, 1.12) : 1.1;
    }
    // a flower gate: two green pillars with roses, an arch on top, a light veil of the color, the icon in the middle
    function gate(c, g) {
      var z = g.z, p = Pz(z), y = SY(z), gh = lw * 1.3 * p, i;
      if (g.arch) {
        var x0 = SX(-0.98, z), x1 = SX(0.98, z), r = (x1 - x0) / 2, cxx = (x0 + x1) / 2, top = y - gh * 0.55, bw = Math.max(2, r * 0.06);
        c.fillStyle = '#E0E7FF'; c.fillRect(x0, top, bw, y - top); c.fillRect(x1 - bw, top, bw, y - top);
        c.lineWidth = Math.max(2, r * 0.09); c.strokeStyle = 'rgba(196,181,253,.9)'; c.beginPath(); c.arc(cxx, top, r - bw / 2, Math.PI, 0); c.stroke();
        c.lineWidth = Math.max(1, r * 0.03); c.strokeStyle = '#FDE68A'; c.beginPath(); c.arc(cxx, top, r * 0.86, Math.PI, 0); c.stroke();
        for (i = 0; i < 7; i++) { var a = Math.PI + (i + 0.5) / 7 * Math.PI; spark(c, cxx + Math.cos(a) * (r - bw / 2), top + Math.sin(a) * (r - bw / 2), r * (0.06 + 0.03 * Math.sin(t * 6 + i)), i % 2 ? '#fff' : '#FDE68A'); }
        var is = r * 0.42; c.drawImage(iconS(g.nl), cxx - is / 2, top - r * 0.62 - is / 2 + r * 0.25, is, is);
        return;
      }
      [[-1, g.l], [1, g.r]].forEach(function (q) {
        var xa = SX(q[0] === -1 ? -0.96 : 0.06, z), xb = SX(q[0] === -1 ? -0.06 : 0.96, z), L = LK[q[1]], pw2 = Math.max(2, (xb - xa) * 0.09), cxx = (xa + xb) / 2, rr2 = (xb - xa) / 2;
        var top = y - gh + rr2 * 0.4;
        c.globalAlpha = 0.34; c.fillStyle = L[1]; c.beginPath(); c.moveTo(xa, y); c.lineTo(xa, top); c.arc(cxx, top, rr2, Math.PI, 0); c.lineTo(xb, y); c.closePath(); c.fill(); c.globalAlpha = 1;
        c.fillStyle = '#15803D'; c.fillRect(xa, top, pw2, y - top); c.fillRect(xb - pw2, top, pw2, y - top);
        c.lineWidth = pw2; c.strokeStyle = '#16A34A'; c.beginPath(); c.arc(cxx, top, rr2 - pw2 / 2, Math.PI, 0); c.stroke();
        for (i = 0; i < 5; i++) { var a2 = Math.PI + (i + 0.5) / 5 * Math.PI; circ(c, cxx + Math.cos(a2) * (rr2 - pw2 / 2), top + Math.sin(a2) * (rr2 - pw2 / 2), pw2 * 0.8, L[1]); circ(c, cxx + Math.cos(a2) * (rr2 - pw2 / 2), top + Math.sin(a2) * (rr2 - pw2 / 2), pw2 * 0.35, L[0]); }
        circ(c, xa + pw2 / 2, y - gh * 0.35, pw2 * 0.8, L[1]); circ(c, xb - pw2 / 2, y - gh * 0.55, pw2 * 0.8, L[1]);
        var is = Math.min(xb - xa, gh) * 0.48;
        c.drawImage(iconS(q[1]), cxx - is / 2, y - gh * 0.5 - is / 2, is, is);
      });
    }
    function crash() {
      if (dead) return;
      if (!A.fail(A.l.fail)) return;
      dead = 1; fall = { t: 0, dir: px < 0 ? -1 : 1 }; A.shake(0.4); A.burst(SX(px, 0), ny - mh * 0.5, 12, [LK[look][1], '#fff'], 140, 0.5, 3);
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        hy = Math.max(top - 6, H * 0.26); ny = H * 0.99; lw = Math.min(W * 0.4, (ny - hy) * 0.62);
        mh = Math.min(lw * 1.25, (ny - hy) * 0.6);
        SPR = {};
        bg = mkc(W, H, dpr, function (c) {
          var S = 9; function R() { S = (S * 9301 + 49297) % 233280; return S / 233280; }
          c.fillStyle = lg(c, 0, 0, 0, hy + 4, ['#0B0726', '#24104F', '#5B21B6', '#C0569A']); c.fillRect(0, 0, W, hy + 4);
          stars(c, W, H, A.lite ? 30 : 80, 0, hy * 0.8);
          var mr = Math.min(W, H) * 0.05, mx = W * 0.85, my = Math.max(mr + 6, hy * 0.32);
          circ(c, mx, my, mr * 3, rg(c, mx, my, mr * 3, ['rgba(254,249,195,.3)', 'rgba(254,249,195,0)'])); circ(c, mx, my, mr, rg(c, mx, my, mr, ['#FFFFFF', '#FEF3C7', '#FBBF24'], -mr * 0.3, -mr * 0.3));
          for (var k = 0; k < 4; k++) { var cy = hy * (0.35 + k * 0.12), cx = W * ((k * 0.37) % 1); for (var j = 0; j < 5; j++) circ(c, cx + j * W * 0.04, cy + Math.sin(j) * 4, W * (0.03 + (j % 2) * 0.015), 'rgba(196,181,253,.12)'); }
          // distant hills with tiny lights of the kingdom
          c.fillStyle = '#2A1458'; c.beginPath(); c.moveTo(0, hy + 3); for (var x = 0; x <= W; x += 10) c.lineTo(x, hy - H * 0.035 * (1 + Math.sin(x / W * 7))); c.lineTo(W, hy + 3); c.closePath(); c.fill();
          for (k = 0; k < 30; k++) { c.fillStyle = 'rgba(253,230,138,.7)'; c.fillRect(R() * W, hy - R() * H * 0.04, 1.5, 1.5); }
          // the castle: curtain wall with crenels, 5 towers with slate cones, lit windows, banners, a glowing gate and a bridge
          var cw2 = Math.min(W * 0.62, lw * 2.5), cb = hy + 2, cx2 = W / 2, th = Math.min(cw2 * 0.6, (hy - T * 0.4) / 1.2);
          var stone = function (x0, w0, y0, h0) { c.fillStyle = lg(c, x0, 0, x0 + w0, 0, ['#B9A8E0', '#8C78C4', '#5B4A92']); c.fillRect(x0, y0, w0, h0); c.strokeStyle = 'rgba(40,20,80,.25)'; c.lineWidth = 0.8; for (var yy = y0 + 5; yy < y0 + h0; yy += 6) { c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + w0, yy); c.stroke(); } };
          stone(cx2 - cw2 * 0.36, cw2 * 0.72, cb - th * 0.42, th * 0.42);
          for (x = cx2 - cw2 * 0.36; x < cx2 + cw2 * 0.36; x += cw2 * 0.04) { c.fillStyle = '#8C78C4'; c.fillRect(x, cb - th * 0.42 - cw2 * 0.02, cw2 * 0.022, cw2 * 0.022); }
          [[-0.42, 0.78, 0.12], [0.42, 0.78, 0.12], [-0.2, 0.95, 0.13], [0.2, 0.95, 0.13], [0, 1.18, 0.16]].forEach(function (q, qi) {
            var tx = cx2 + q[0] * cw2, tw = cw2 * q[2], tH = th * q[1];
            stone(tx - tw / 2, tw, cb - tH, tH);
            c.fillStyle = lg(c, tx - tw * 0.7, 0, tx + tw * 0.7, 0, ['#F472B6', '#BE185D', '#701A75']); poly(c, [tx - tw * 0.68, cb - tH, tx + tw * 0.68, cb - tH, tx, cb - tH - tw * 1.6]); c.fill();
            c.strokeStyle = '#4A044E'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx, cb - tH - tw * 1.6); c.lineTo(tx, cb - tH - tw * 2.05); c.stroke();
            c.fillStyle = qi % 2 ? '#FDE68A' : '#F9A8D4'; poly(c, [tx, cb - tH - tw * 2.05, tx + tw * 0.5, cb - tH - tw * 1.95, tx, cb - tH - tw * 1.85]); c.fill();
            for (var wy = 0; wy < 2; wy++) { var wy0 = cb - tH * (0.75 - wy * 0.3); circ(c, tx, wy0, tw * 0.22, 'rgba(253,230,138,.25)'); c.fillStyle = '#FDE68A'; c.beginPath(); c.arc(tx, wy0 - tw * 0.06, tw * 0.1, Math.PI, 0); c.fillRect(tx - tw * 0.1, wy0 - tw * 0.06, tw * 0.2, tw * 0.22); c.fill(); }
          });
          circ(c, cx2, cb - th * 0.12, cw2 * 0.16, 'rgba(253,230,138,.22)');
          c.fillStyle = '#FEF3C7'; c.beginPath(); c.arc(cx2, cb - th * 0.14, cw2 * 0.065, Math.PI, 0); c.fillRect(cx2 - cw2 * 0.065, cb - th * 0.14, cw2 * 0.13, th * 0.14); c.fill();
          // lawn (stripes are drawn live so they scroll), flower beds far away
          c.fillStyle = lg(c, 0, hy, 0, H, ['#1B5E35', '#1E7A40', '#14532D']); c.fillRect(0, hy, W, H - hy);
          c.fillStyle = lg(c, 0, hy, 0, hy + H * 0.08, ['rgba(192,86,154,.25)', 'rgba(192,86,154,0)']); c.fillRect(0, hy, W, H * 0.08);
          // the path: pale marble, edged with gold kerbs
          poly(c, [SX(-1.05, 30), SY(30), SX(1.05, 30), SY(30), SX(1.05, -0.15), H, SX(-1.05, -0.15), H], lg(c, 0, hy, 0, H, ['#E9D5FF', '#FBE3F0', '#FFF5FA']));
          [-1.05, 1.05].forEach(function (lx) { poly(c, [SX(lx - 0.04, 30), SY(30), SX(lx + 0.04, 30), SY(30), SX(lx + 0.04, -0.15), H, SX(lx - 0.04, -0.15), H], '#E8C06A'); });
        });
        // garden props that scroll past on both sides (pre-drawn once)
        PROP = {
          cone: mkc(lw * 0.5, lw * 1.0, dpr, function (c, w, h) { // topiary cone with roses
            c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(w / 2, h * 0.97, w * 0.4, h * 0.03, 0, 0, TAU); c.fill();
            c.fillStyle = '#7C2D12'; c.fillRect(w * 0.45, h * 0.85, w * 0.1, h * 0.12);
            var S2 = 4; function R2() { S2 = (S2 * 9301 + 49297) % 233280; return S2 / 233280; }
            c.fillStyle = lg(c, 0, 0, w, 0, ['#4ADE80', '#16A34A', '#0B4A22']); c.beginPath(); c.moveTo(w / 2, 0); c.quadraticCurveTo(w * 0.95, h * 0.6, w * 0.82, h * 0.86); c.quadraticCurveTo(w / 2, h * 0.92, w * 0.18, h * 0.86); c.quadraticCurveTo(w * 0.05, h * 0.6, w / 2, 0); c.fill();
            for (var i = 0; i < 40; i++) { var yy = h * (0.08 + R2() * 0.76), half = w * 0.4 * (yy / h), xx = w / 2 + (R2() - 0.5) * 2 * half; c.fillStyle = R2() < 0.5 ? 'rgba(134,239,172,.5)' : 'rgba(5,46,22,.35)'; c.beginPath(); c.ellipse(xx, yy, w * 0.04, w * 0.025, R2() * 3, 0, TAU); c.fill(); }
            for (i = 0; i < 6; i++) { var ry = h * (0.25 + i * 0.1), rx = w / 2 + Math.sin(i * 2.4) * w * 0.3 * (ry / h); circ(c, rx, ry, w * 0.05, '#F472B6'); circ(c, rx, ry, w * 0.022, '#FBCFE8'); }
          }),
          lamp: mkc(lw * 0.3, lw * 1.5, dpr, function (c, w, h) { // garden lantern on a curly post
            c.fillStyle = lg(c, w * 0.42, 0, w * 0.58, 0, ['#4B5563', '#111827']); c.fillRect(w * 0.44, h * 0.18, w * 0.12, h * 0.8); c.fillRect(w * 0.3, h * 0.95, w * 0.4, h * 0.05);
            circ(c, w / 2, h * 0.12, w * 0.5, rg(c, w / 2, h * 0.12, w * 0.5, ['rgba(254,240,138,.7)', 'rgba(254,240,138,0)']));
            c.fillStyle = '#111827'; poly(c, [w * 0.28, h * 0.06, w * 0.72, h * 0.06, w / 2, h * 0.02]); c.fill();
            c.fillStyle = lg(c, 0, h * 0.06, 0, h * 0.18, ['#FFFBEB', '#FDE68A', '#F59E0B']); c.fillRect(w * 0.32, h * 0.06, w * 0.36, h * 0.12);
            c.strokeStyle = '#111827'; c.lineWidth = 1; c.strokeRect(w * 0.32, h * 0.06, w * 0.36, h * 0.12); c.beginPath(); c.moveTo(w / 2, h * 0.06); c.lineTo(w / 2, h * 0.18); c.stroke();
          }),
          bush: mkc(lw * 0.7, lw * 0.5, dpr, function (c, w, h) { // round rose bush
            var S3 = 8; function R3() { S3 = (S3 * 9301 + 49297) % 233280; return S3 / 233280; }
            c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(w / 2, h * 0.95, w * 0.45, h * 0.06, 0, 0, TAU); c.fill();
            [[0.3, 0.6, 0.3], [0.7, 0.6, 0.3], [0.5, 0.45, 0.36]].forEach(function (q) { circ(c, w * q[0], h * q[1], w * q[2] * 0.85, rg(c, w * q[0], h * q[1], w * q[2] * 0.85, ['#4ADE80', '#15803D', '#0B3D20'], -w * 0.06, -h * 0.1)); });
            for (var i = 0; i < 9; i++) { var rx = w * (0.2 + R3() * 0.6), ry = h * (0.25 + R3() * 0.5), cl = ['#F43F5E', '#FB7185', '#FDE68A', '#F0ABFC'][i % 4]; circ(c, rx, ry, w * 0.045, cl); circ(c, rx - w * 0.01, ry - w * 0.01, w * 0.018, '#fff'); }
          })
        };
        for (var i = 0; i < (A.lite ? 6 : 14); i++) flies.push({ x: rnd(0, W), y: rnd(hy * 0.6, H), p: rnd(0, TAU) });
        flies = flies.slice(-14);
      },
      reset: function (live) { gates = []; lane = -1; px = -0.5; look = genLook = (Math.random() * 4) | 0; sinceArch = 0; spD = live ? 0.6 : 0.2; dead = 0; won = 0; twirl = 0; fall = null; mid = null; v = 0; },
      step: function (dt, live) {
        t += dt; twirl = Math.max(0, twirl - dt);
        var lv = live ? A.lv() : 0, playing = A.live(), i;
        var tv = dead || mid ? 0 : live ? 0.62 + 0.45 * lv : 0.6;
        v += (tv - v) * Math.min(1, dt * 2.5);
        var dz = v * dt; dist += dz;
        px += (lane * 0.5 - px) * Math.min(1, dt * 11);
        if (!dead && !mid && !won) { spD -= dz; if (spD <= 0) spD = addRow(live); }
        if (!live && !dead && !mid) { // attract scene: she picks the right gate by herself
          var nx = gates.filter(function (g) { return !g.arch && !g.done && g.z > 0.05; }).sort(function (a, b) { return a.z - b.z; })[0];
          if (nx && nx.z < 0.7) lane = nx.l === look ? -1 : 1;
        }
        for (i = gates.length - 1; i >= 0; i--) {
          var g = gates[i]; g.z -= dz;
          if (g.z < -0.25) { gates.splice(i, 1); continue; }
          if (!g.done && g.z <= 0.02) {
            g.done = 1;
            if (g.arch) { look = g.nl; twirl = 0.5; A.burst(SX(px, 0), ny - mh * 0.6, 18, ['#F43F5E', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#fff'], 170, 0.7, 3); continue; }
            var mine = px < 0 ? g.l : g.r;
            if (mine === look) A.burst(SX(px, 0), ny - mh * 0.75, 10, [LK[look][0], '#FDE68A', '#fff'], 130, 0.55, 2.6, 0);
            else if (playing) crash();
            else if (!live) look = mine; // idle: never stuck
          }
        }
        if (fall) fall.t += dt;
        if (mid) { mid.t += dt; if (!mid.hit && mid.t > 0.7) { mid.hit = 1; dead = 1; A.burst(SX(px, 0), ny - mh * 0.5, 30, ['#FDE68A', '#fff', '#C4B5FD', LK[look][1]], 200, 0.9, 3.4, -20); A.flash(0.5); } }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var i, list = gates.slice().sort(function (a, b) { return b.z - a.z; });
        // scrolling ground: mowed lawn stripes and marble tiles (the strongest cue of her walking)
        var S0 = 0.16, o0 = dist % S0, n0 = Math.floor(dist / S0), z, k;
        for (z = ZM + S0 - o0, k = 0; z > -0.15; z -= S0, k++) {
          var za = Math.max(-0.15, z - S0);
          if ((n0 + k) % 2) { c.fillStyle = 'rgba(255,255,255,.05)'; quad(c, 1.1, 6, za, z); quad(c, -6, -1.1, za, z); c.fillStyle = 'rgba(120,60,150,.06)'; quad(c, -1.0, 0, za, z); quad(c, 0, 1.0, Math.max(-0.15, za - 0.0), z); }
          c.fillStyle = 'rgba(160,120,170,.35)'; quad(c, -1.0, 1.0, za, za + 0.006);
        }
        if (PROP) {
          var S1 = 0.45, o1 = dist % S1, n1 = Math.floor(dist / S1);
          var sideList = [];
          for (z = ZM + S1 - o1, k = 0; z > -0.15; z -= S1, k++) { var q = (n1 + k) % 3; sideList.push([z, q === 0 ? 'lamp' : q === 1 ? 'cone' : 'bush', -1.35]); sideList.push([z + S1 / 2, q === 0 ? 'cone' : q === 1 ? 'bush' : 'lamp', 1.35]); }
          sideList.sort(function (a, b) { return b[0] - a[0]; });
          sideList.forEach(function (e) { if (e[0] < -0.12 || e[0] > ZM) return; var im = PROP[e[1]], wl = e[1] === 'lamp' ? 0.3 : e[1] === 'cone' ? 0.5 : 0.7, hl = e[1] === 'lamp' ? 1.5 : e[1] === 'cone' ? 1.0 : 0.5, p = Pz(e[0]), ww = wl * lw * p, hh = hl * lw * p; c.drawImage(im, SX(e[2] + (e[2] < 0 ? -wl / 2 : wl / 2), e[0]) - ww / 2, SY(e[0]) - hh, ww, hh); });
        }
        if (!A.lite) for (i = 0; i < flies.length; i++) { var f = flies[i]; c.globalAlpha = 0.35 + 0.35 * Math.sin(t * 3 + f.p); circ(c, f.x + Math.sin(t * 0.7 + f.p) * 8, f.y + Math.cos(t * 0.5 + f.p) * 6, 1.8, '#FEF08A'); }
        c.globalAlpha = 1;
        for (i = 0; i < list.length; i++) if (list[i].z > 0.02) gate(c, list[i]);
        // the princess
        var x = SX(px, 0), y = ny - lw * 0.02, w = mh * 0.72;
        if (!(mid && mid.hit)) {
          var fr = model(look, ((dist * 13) | 0) % NF);
          c.fillStyle = 'rgba(20,0,30,.25)'; c.beginPath(); c.ellipse(x, y, w * 0.42, w * 0.08, 0, 0, TAU); c.fill();
          c.save(); c.translate(x, y);
          if (fall) c.rotate(Math.min(1.3, fall.t * 3.2) * fall.dir);
          if (twirl) c.scale(Math.cos((0.5 - twirl) / 0.5 * TAU), 1);
          if (mid) { c.globalAlpha = Math.max(0, 1 - mid.t / 0.7); c.scale(1 + Math.sin(mid.t * 30) * 0.03 * mid.t, 1); }
          if (won) { var k = 1 + 0.06 * Math.sin(won * 12); c.scale(k, k); }
          c.drawImage(fr, -w / 2, -mh, w, mh);
          c.restore(); c.globalAlpha = 1;
        }
        for (i = 0; i < list.length; i++) if (list[i].z <= 0.02) gate(c, list[i]);
        if (mid) { // the clock strikes midnight
          var R = Math.min(W, H) * 0.13 * Math.min(1, mid.t * 3), cx2 = W / 2, cy2 = T + R + 4;
          circ(c, cx2, cy2, R * 1.5, rg(c, cx2, cy2, R * 1.5, ['rgba(253,230,138,.45)', 'rgba(253,230,138,0)']));
          circ(c, cx2, cy2, R, '#FEF3C7'); c.strokeStyle = '#B45309'; c.lineWidth = Math.max(2, R * 0.08); c.beginPath(); c.arc(cx2, cy2, R, 0, TAU); c.stroke();
          for (i = 0; i < 12; i++) { var a = i / 12 * TAU; circ(c, cx2 + Math.cos(a) * R * 0.8, cy2 + Math.sin(a) * R * 0.8, Math.max(1, R * 0.05), '#92400E'); }
          c.lineCap = 'round'; c.strokeStyle = '#451A03'; c.lineWidth = Math.max(2, R * 0.08); c.beginPath(); c.moveTo(cx2, cy2); c.lineTo(cx2, cy2 - R * 0.62); c.moveTo(cx2, cy2); c.lineTo(cx2 + Math.sin(-0.3 + Math.min(1, mid.t * 2) * 0.3) * R * 0.8, cy2 - Math.cos(-0.3 + Math.min(1, mid.t * 2) * 0.3) * R * 0.8); c.stroke();
        }
      },
      act: function (k) { if (dead || mid || won) return; if (k === 'left') lane = -1; else if (k === 'right') lane = 1; },
      boom: function () { mid = { t: 0 }; gates = gates.filter(function (g) { return g.z > 0.9; }); },
      win: function () { won = 0.001; A.burst(SX(px, 0), ny - mh * 0.7, 16, ['#FDE68A', '#FFFFFF', LK[look][1]], 150, 0.6, 2.8); gates = []; },
      dbg: function () { return { lane: lane, px: px, look: look, dead: dead, gates: gates.map(function (g) { return { z: g.z, l: g.l, r: g.r, arch: g.arch || 0, nl: g.nl, done: g.done || 0 }; }) }; }
    };
  }, 'lr', 0.5);
})(window.D6 = window.D6 || {});
