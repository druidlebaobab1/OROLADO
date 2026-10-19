/* v2812 — "You're in control" group 3 (owner request, round 4): THREE ENDLESS RUNNERS — Highway Rush (car, 3 lanes of
   traffic), Jungle Dash (explorer on a stone path: dodge, jump, slide), Metro Dash (rail tracks: trains, barriers) — and
   Orbit Switch (tap to change orbit around a planet). With Hamster Run (js/games/skill2.js) the 3 runners make the first
   row of the list. MIXED MODE like Aviator, but the player plays: the multiplier follows the SERVER clock (×e^(rate·s),
   casino_ext.php 'skill', rate 0.03 → ×2 after ~23 s), the gold button cashes out, a mistake loses (K.multi 'fail'),
   and the server's secret end arrives as an unavoidable event (meteor, boulder, express trains, solar flare).
   One gesture set: swipe left / right / up / down (or tap the left / right half) — arrows / WASD / Space on a keyboard.
   Canvas 2D at 60 fps, own drawings (no image file), sprites pre-drawn once per size, pauses when the tab is hidden.
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
    highway: {
      en: ['Swipe to change lanes', 'Crash!', 'Meteor strike!', 'Swipe left or right (or tap the left / right side) to change lanes and avoid the traffic. Hitting a vehicle ends the round.'],
      fr: ['Glisse pour changer de voie', 'Accident !', 'Météorite !', 'Glisse à gauche ou à droite (ou touche le côté gauche / droit) pour changer de voie et éviter la circulation. Heurter un véhicule termine la partie.'],
      es: ['Desliza para cambiar de carril', '¡Choque!', '¡Meteorito!', 'Desliza a la izquierda o a la derecha (o toca el lado izquierdo / derecho) para cambiar de carril y esquivar el tráfico. Chocar con un vehículo termina la ronda.'],
      pt: ['Deslize para mudar de faixa', 'Batida!', 'Meteoro!', 'Deslize para a esquerda ou direita (ou toque no lado esquerdo / direito) para mudar de faixa e desviar do trânsito. Bater num veículo encerra a rodada.'],
      ar: ['اسحب لتغيير المسار', 'حادث!', 'نيزك!', 'اسحب يسارًا أو يمينًا (أو المس الجهة اليسرى / اليمنى) لتغيير المسار وتفادي السيارات. الاصطدام بمركبة ينهي الجولة.'],
      tr: ['Şerit değiştirmek için kaydır', 'Kaza!', 'Meteor çarptı!', 'Şerit değiştirip trafikten kaçmak için sola ya da sağa kaydır (veya sol / sağ tarafa dokun). Bir araca çarpmak turu bitirir.'],
      vi: ['Vuốt để đổi làn', 'Tai nạn!', 'Thiên thạch!', 'Vuốt sang trái hoặc phải (hoặc chạm nửa trái / phải) để đổi làn và tránh xe. Đâm vào xe sẽ kết thúc ván.'],
      id: ['Usap untuk pindah jalur', 'Tabrakan!', 'Meteor!', 'Usap ke kiri atau kanan (atau ketuk sisi kiri / kanan) untuk pindah jalur dan menghindari lalu lintas. Menabrak kendaraan mengakhiri ronde.'],
      ru: ['Свайп — смена полосы', 'Авария!', 'Метеорит!', 'Проведи влево или вправо (или нажми слева / справа), чтобы сменить полосу и объехать машины. Столкновение завершает раунд.'],
      de: ['Wischen zum Spurwechsel', 'Unfall!', 'Meteorit!', 'Wische nach links oder rechts (oder tippe links / rechts), um die Spur zu wechseln und dem Verkehr auszuweichen. Ein Zusammenstoß beendet die Runde.'],
      hi: ['लेन बदलने को स्वाइप करें', 'टक्कर!', 'उल्कापिंड!', 'लेन बदलकर ट्रैफ़िक से बचने के लिए बाएँ या दाएँ स्वाइप करें (या बायाँ / दायाँ हिस्सा टैप करें)। किसी वाहन से टकराना राउंड खत्म करता है।'],
      zh: ['滑动切换车道', '撞车了！', '陨石撞击！', '向左或向右滑动（或点击左 / 右半边）切换车道，避开车流。撞上车辆，本回合结束。']
    },
    jungledash: {
      en: ['Swipe to dodge, jump, slide', 'Ouch!', 'Boulder!', 'Swipe left / right to change path, up to jump over logs, down to slide under branches. Hitting an obstacle ends the round.'],
      fr: ['Glisse : esquive, saute, glisse', 'Aïe !', 'Rocher !', 'Glisse à gauche / droite pour changer de voie, vers le haut pour sauter les troncs, vers le bas pour passer sous les branches. Heurter un obstacle termine la partie.'],
      es: ['Desliza: esquiva, salta, agáchate', '¡Ay!', '¡Roca gigante!', 'Desliza a izquierda / derecha para cambiar de camino, arriba para saltar troncos, abajo para deslizarte bajo las ramas. Chocar con un obstáculo termina la ronda.'],
      pt: ['Deslize: desvie, pule, abaixe', 'Ai!', 'Pedra gigante!', 'Deslize para a esquerda / direita para mudar de caminho, para cima para pular troncos, para baixo para deslizar sob galhos. Bater num obstáculo encerra a rodada.'],
      ar: ['اسحب: تفادَ، اقفز، انزلق', 'آخ!', 'صخرة!', 'اسحب يسارًا / يمينًا لتغيير المسار، وللأعلى للقفز فوق الجذوع، وللأسفل للانزلاق تحت الأغصان. الاصطدام بعائق ينهي الجولة.'],
      tr: ['Kaydır: kaç, zıpla, kay', 'Ah!', 'Dev kaya!', 'Yol değiştirmek için sola / sağa, kütüklerin üstünden zıplamak için yukarı, dalların altından kaymak için aşağı kaydır. Engele çarpmak turu bitirir.'],
      vi: ['Vuốt: né, nhảy, trượt', 'Ối!', 'Tảng đá!', 'Vuốt trái / phải để đổi đường, lên để nhảy qua khúc gỗ, xuống để trượt dưới cành cây. Va vào chướng ngại sẽ kết thúc ván.'],
      id: ['Usap: hindari, lompat, seluncur', 'Aduh!', 'Batu besar!', 'Usap kiri / kanan untuk pindah jalur, ke atas untuk melompati batang kayu, ke bawah untuk meluncur di bawah dahan. Menabrak rintangan mengakhiri ronde.'],
      ru: ['Свайп: уклон, прыжок, подкат', 'Ой!', 'Валун!', 'Проведи влево / вправо, чтобы сменить дорожку, вверх — перепрыгнуть бревно, вниз — проскользнуть под веткой. Столкновение завершает раунд.'],
      de: ['Wischen: ausweichen, springen, rutschen', 'Autsch!', 'Felsbrocken!', 'Wische links / rechts, um den Weg zu wechseln, nach oben, um über Stämme zu springen, nach unten, um unter Ästen durchzurutschen. Ein Hindernis beendet die Runde.'],
      hi: ['स्वाइप: बचें, कूदें, फिसलें', 'आह!', 'चट्टान!', 'रास्ता बदलने को बाएँ / दाएँ, लट्ठे के ऊपर कूदने को ऊपर, डाल के नीचे फिसलने को नीचे स्वाइप करें। बाधा से टकराना राउंड खत्म करता है।'],
      zh: ['滑动：闪避、跳跃、滑铲', '哎哟！', '巨石！', '左右滑动换道，上滑跳过树干，下滑从树枝下滑过。撞上障碍，本回合结束。']
    },
    metrodash: {
      en: ['Swipe to dodge, jump, slide', 'Bump!', 'Express trains!', 'Swipe left / right to change track, up to jump over barriers, down to slide under signs. Hitting a train or an obstacle ends the round.'],
      fr: ['Glisse : esquive, saute, glisse', 'Bam !', 'Trains express !', 'Glisse à gauche / droite pour changer de voie, vers le haut pour sauter les barrières, vers le bas pour passer sous les panneaux. Heurter un train ou un obstacle termine la partie.'],
      es: ['Desliza: esquiva, salta, agáchate', '¡Golpe!', '¡Trenes exprés!', 'Desliza a izquierda / derecha para cambiar de vía, arriba para saltar barreras, abajo para deslizarte bajo las señales. Chocar con un tren o un obstáculo termina la ronda.'],
      pt: ['Deslize: desvie, pule, abaixe', 'Pancada!', 'Trens expressos!', 'Deslize para a esquerda / direita para mudar de trilho, para cima para pular barreiras, para baixo para deslizar sob placas. Bater num trem ou obstáculo encerra a rodada.'],
      ar: ['اسحب: تفادَ، اقفز، انزلق', 'ارتطام!', 'قطارات سريعة!', 'اسحب يسارًا / يمينًا لتغيير السكة، وللأعلى للقفز فوق الحواجز، وللأسفل للانزلاق تحت اللافتات. الاصطدام بقطار أو عائق ينهي الجولة.'],
      tr: ['Kaydır: kaç, zıpla, kay', 'Çarptın!', 'Ekspres trenler!', 'Ray değiştirmek için sola / sağa, bariyerlerin üstünden zıplamak için yukarı, tabelaların altından kaymak için aşağı kaydır. Trene ya da engele çarpmak turu bitirir.'],
      vi: ['Vuốt: né, nhảy, trượt', 'Đụng rồi!', 'Tàu tốc hành!', 'Vuốt trái / phải để đổi đường ray, lên để nhảy qua rào chắn, xuống để trượt dưới biển báo. Đụng tàu hoặc chướng ngại sẽ kết thúc ván.'],
      id: ['Usap: hindari, lompat, seluncur', 'Benturan!', 'Kereta ekspres!', 'Usap kiri / kanan untuk pindah rel, ke atas untuk melompati palang, ke bawah untuk meluncur di bawah papan. Menabrak kereta atau rintangan mengakhiri ronde.'],
      ru: ['Свайп: уклон, прыжок, подкат', 'Удар!', 'Экспрессы!', 'Проведи влево / вправо, чтобы сменить путь, вверх — перепрыгнуть барьер, вниз — проскользнуть под табличкой. Столкновение с поездом или препятствием завершает раунд.'],
      de: ['Wischen: ausweichen, springen, rutschen', 'Bums!', 'Schnellzüge!', 'Wische links / rechts, um das Gleis zu wechseln, nach oben, um über Schranken zu springen, nach unten, um unter Schildern durchzurutschen. Ein Zug oder Hindernis beendet die Runde.'],
      hi: ['स्वाइप: बचें, कूदें, फिसलें', 'टक्कर!', 'एक्सप्रेस ट्रेनें!', 'पटरी बदलने को बाएँ / दाएँ, बैरियर के ऊपर कूदने को ऊपर, बोर्ड के नीचे फिसलने को नीचे स्वाइप करें। ट्रेन या बाधा से टकराना राउंड खत्म करता है।'],
      zh: ['滑动：闪避、跳跃、滑铲', '撞上了！', '特快列车！', '左右滑动换轨道，上滑跳过栏杆，下滑从指示牌下滑过。撞上列车或障碍，本回合结束。']
    },
    orbit: {
      en: ['Tap to switch orbit', 'Impact!', 'Solar flare!', 'Tap to jump between the inner and outer orbit and avoid the space rocks. Hitting one ends the round.'],
      fr: ['Touche pour changer d’orbite', 'Impact !', 'Éruption solaire !', 'Touche pour passer de l’orbite intérieure à l’extérieure et éviter les rochers. En toucher un termine la partie.'],
      es: ['Toca para cambiar de órbita', '¡Impacto!', '¡Llamarada solar!', 'Toca para saltar entre la órbita interior y la exterior y esquivar las rocas espaciales. Chocar con una termina la ronda.'],
      pt: ['Toque para trocar de órbita', 'Impacto!', 'Erupção solar!', 'Toque para pular entre a órbita interna e a externa e desviar das rochas espaciais. Bater numa encerra a rodada.'],
      ar: ['المس لتغيير المدار', 'اصطدام!', 'توهج شمسي!', 'المس للانتقال بين المدار الداخلي والخارجي وتفادي الصخور الفضائية. الاصطدام بإحداها ينهي الجولة.'],
      tr: ['Yörünge için dokun', 'Çarpışma!', 'Güneş patlaması!', 'İç ve dış yörünge arasında geçip uzay kayalarından kaçmak için dokun. Birine çarpmak turu bitirir.'],
      vi: ['Chạm để đổi quỹ đạo', 'Va chạm!', 'Bão mặt trời!', 'Chạm để chuyển giữa quỹ đạo trong và ngoài, né các tảng đá không gian. Va vào là kết thúc ván.'],
      id: ['Ketuk untuk ganti orbit', 'Benturan!', 'Badai matahari!', 'Ketuk untuk pindah antara orbit dalam dan luar dan menghindari batu angkasa. Menabraknya mengakhiri ronde.'],
      ru: ['Тап — смена орбиты', 'Удар!', 'Солнечная вспышка!', 'Нажимай, чтобы переходить между внутренней и внешней орбитой и облетать камни. Столкновение завершает раунд.'],
      de: ['Tippen zum Orbitwechsel', 'Einschlag!', 'Sonneneruption!', 'Tippe, um zwischen innerer und äußerer Umlaufbahn zu wechseln und den Felsen auszuweichen. Ein Treffer beendet die Runde.'],
      hi: ['कक्षा बदलने को टैप करें', 'टक्कर!', 'सौर ज्वाला!', 'अंदर और बाहर की कक्षा के बीच जाने और अंतरिक्ष चट्टानों से बचने के लिए टैप करें। टकराना राउंड खत्म करता है।'],
      zh: ['点击切换轨道', '撞击！', '太阳耀斑！', '点击在内外两条轨道之间切换，避开太空岩石。撞上就结束本回合。']
    }
  };
  function L(key) {
    var lg = K.lang(), c = Object.assign({}, C.en, C[lg] || {}), g = (G[key][lg] || G[key].en);
    c.hint = g[0]; c.fail = g[1]; c.end = g[2];
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
  function circ(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function stars(c, W, H, n) {
    for (var i = 0; i < n; i++) {
      var r = Math.random(); c.globalAlpha = 0.25 + Math.random() * 0.75;
      c.fillStyle = r > 0.92 ? '#FDE68A' : r > 0.82 ? '#C4B5FD' : '#fff';
      var s = r > 0.96 ? 2 : r > 0.7 ? 1.3 : 0.9; c.fillRect(Math.random() * W, Math.random() * H, s, s);
    }
    c.globalAlpha = 1;
  }
  function poly(c, pts, fill) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } }
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

  /* hand hint: tap = finger; swipe4 = finger + 4 arrows */
  var FINGER = '<path d="M11 21V9.5a2 2 0 0 1 4 0V16m0-2a2 2 0 0 1 4 0v2m0-1a2 2 0 0 1 4 0v5c0 4.5-3 8-7.5 8H14c-2.4 0-4-1-5.3-2.9L6 23a2 2 0 0 1 3.2-2.4L11 23"/>';
  var HAND = {
    tap: '<svg viewBox="0 0 32 32" aria-hidden="true">' + FINGER + '</svg>',
    lr: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 9l5-4v8zM31 9l-5-4v8z"/>' + FINGER + '</svg>',
    swipe4: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 11l4.5-3.5v7zM31 11l-4.5-3.5v7zM13 0l3.5 4h-7z"/>' + FINGER + '</svg>'
  };

  /* ------------------------------------------------------------------ shared engine (round flow + canvas loop + gestures) */
  function boot(key, mk, gest, hy) {
    K.register(key, function (box) {
      var l = L(key), lite = document.documentElement.classList.contains('oro-lite'), hist = [];
      try { hist = JSON.parse(localStorage.getItem('cg_' + key + '_h') || '[]').slice(0, 12); } catch (e) { hist = []; }
      box.classList.add('cg-game', 'cg-s3', 'cg-' + key);
      box.style.setProperty('--hy', (hy || 0.45) * 100 + '%');
      box.innerHTML = '<div class="cg-stage s3-st idle" id="s3St"><canvas class="s3-bg" id="s3Bg"></canvas><canvas class="s3-cv" id="s3Cv"></canvas><div class="cg-hist s3-hist" id="s3Hist"></div>' +
        '<div class="s3-hud" id="s3Hud"><b class="fit s3-m idle" id="s3M">' + xm(1) + '</b><small class="fit s3-msg" id="s3Msg"></small></div>' +
        '<div class="sk-hint g-' + gest + '" id="s3Hint"><i class="sk-hand">' + HAND[gest] + '</i><small class="fit">' + K.esc(l.hint) + '</small></div></div>' + K.stakePanel(l.bet);
      K.bindStake(box);
      var st = $('s3St'), cv = $('s3Cv'), ctx = cv.getContext('2d'), btn = $('csGo'), mEl = $('s3M'), msgEl = $('s3Msg'), hud = $('s3Hud'), hintEl = $('s3Hint'), gN = 0, nudgeT = 0;
      var W = 0, H = 0, dpr = 1, rect = null, sized = false, fadeS = null, fadeH = 0, phase = 'idle', R = null, off = 0, busy = false, playT = 0, overT = 0, last = 0, drawn = false;
      var P = [], RG = [], shake = 0, flash = 0, mShown = '';
      var bgCv = $('s3Bg'), bgOn = null;
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
      box._s3 = g; // read-only hook for the touch tests (scripts in /tmp); nothing reads it in the app

      function say(t, cls) { K.setText(msgEl, t || ''); mEl.classList.remove('won', 'lost', 'idle'); if (cls) mEl.classList.add(cls); }
      function tx(el, s) { if (el.textContent === s) return; if (el.textContent.length !== s.length) K.setText(el, s); else el.textContent = s; }
      function setBtn(main, sub, cls) {
        btn.classList.remove('cash', 'wait');
        if (cls) btn.classList.add(cls);
        if (sub) { btn.innerHTML = '<span class="fit s3-b1"></span><span class="fit s3-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
        else { btn.innerHTML = '<span class="fit cg-gol"></span>'; K.setText(btn.firstChild, main); }
      }
      function paintHist() {
        $('s3Hist').innerHTML = hist.map(function (h) { var v = Math.abs(h); return '<i class="' + (h < 0 ? 'x' : v >= 10 ? 'hi' : v >= 2 ? 'mid' : 'lo') + '">' + xm(v) + '</i>'; }).join('');
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
        fadeS = mkc(W, fadeH, dpr, function (c) { var q = c.createLinearGradient(0, 0, 0, fadeH); q.addColorStop(0, 'rgba(8,6,26,.6)'); q.addColorStop(1, 'rgba(8,6,26,0)'); c.fillStyle = q; c.fillRect(0, 0, W, fadeH); });
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
          if (s !== mShown) { mShown = s; tx(mEl, s); if (phase === 'play' && btn.lastChild && btn.lastChild.className === 'fit s3-b2') tx(btn.lastChild, money(R.stake * m)); }
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
        g.reset(true); P.length = 0; RG.length = 0;
        phase = 'play'; mShown = ''; gN = 0; box.setAttribute('data-gn', '0'); say('', ''); hintOn(false); // the hint leaves as soon as the round starts
        btn.classList.remove('sk-nudge'); st.querySelectorAll('.cs-toast').forEach(function (t) { t.remove(); }); st.querySelectorAll('.s3-hud *').forEach(function (e) { e.style.visibility = ''; });
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
        setTimeout(function () { if (box.isConnected) result(r); }, 1400);
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

      /* ---- gestures on the WHOLE scene: a swipe acts as soon as the finger has moved ~16 px (no wait for the release);
         a short touch without movement = tap (left / right half for the runners). No ripple: the game itself answers. ---- */
      function pt(e) { var r = rect || st.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      function nudge() { // touching the scene before betting: the BET button pulses + one clear line
        if (K.guest()) return;
        say(l.go, 'idle'); btn.classList.remove('sk-nudge'); void btn.offsetWidth; btn.classList.add('sk-nudge');
        clearTimeout(nudgeT); nudgeT = setTimeout(function () { if (!box.isConnected) return; btn.classList.remove('sk-nudge'); if (phase === 'idle') say('', 'idle'); }, 1800);
      }
      function did(what, x, y) { if (phase !== 'play') return; gN++; box.setAttribute('data-gn', String(gN)); g.act(what, x, y); }
      var gs = null;
      cv.addEventListener('pointerdown', function (e) {
        e.preventDefault(); rect = st.getBoundingClientRect();
        if (e.pointerType === 'mouse' && e.button) return;
        if (phase !== 'play') { if (phase === 'idle') nudge(); return; }
        try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        var p = pt(e);
        if (gest === 'tap') { did('tap', p[0], p[1]); gs = null; return; } // one-tap games act on the touch itself
        gs = { x: p[0], y: p[1], id: e.pointerId, done: false };
      });
      cv.addEventListener('pointermove', function (e) {
        if (!gs || gs.done || e.pointerId !== gs.id) return;
        var p = pt(e), dx = p[0] - gs.x, dy = p[1] - gs.y, th = Math.max(14, Math.min(W, H) * 0.04);
        if (Math.abs(dx) < th && Math.abs(dy) < th) return;
        gs.done = true;
        did(Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'), p[0], p[1]);
      });
      var up = function (e) {
        if (!gs || e.pointerId !== gs.id) return;
        var s = gs; gs = null;
        if (!s.done) did(s.x < W / 2 ? 'left' : 'right', s.x, s.y); // a tap on the left / right half
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', function () { gs = null; });
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
        if (!k || e.repeat) return;
        e.preventDefault();
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

  /* ================================================================== RUNNER CORE — 3 lanes in perspective, seen from behind.
     World: lane x ∈ {−1, 0, 1}, depth z (0 = the runner, ZM = horizon side). Obstacles: 'B' block (change lane),
     'J' low (swipe up = jump), 'S' high (swipe down = slide); 'wide' ones cover the 3 lanes. Every generated row keeps,
     next to EACH lane that was passable in the previous row, a passable lane (one swipe away at most): wherever the
     player stands, the next row is always beaten with one gesture. */
  function runner(A, TH) {
    var W, H, u, dpr, T, hy, ny, lw, F = 4.2, ZM = 2.0;
    var bg = null, SP = {}, obs = [], px = 0, lane = 0, jt = -1, sl = -1, buf = null, bufT = 0, dead = 0, endE = null, won = 0, t = 0, dist = 0, v = 0, spD = 0, prevOk = [-1, 0, 1], rows = 0, lean = 0;
    var JD = 0.66, SD = 0.66;
    function Pz(z) { return 1 / (1 + F * Math.max(-0.18, z)); }
    function SY(z) { return hy + (ny - hy) * Pz(z); }
    function SX(lx, z) { return W / 2 + lx * lw * Pz(z); }
    var V = { SX: SX, SY: SY, P: Pz, ZM: ZM, ZF: 40 }; // ZF: 'infinity' for the static road drawing
    function jh() { return jt >= 0 ? Math.sin(Math.PI * jt / JD) : 0; }
    function act(k) {
      if (dead || endE) return;
      if (TH.lanes && (k === 'up' || k === 'down')) return; // the car only changes lanes
      if (k === 'left' || k === 'right') { lane = clamp(lane + (k === 'left' ? -1 : 1), -1, 1); return; }
      if (k === 'up') { if (jt < 0) { jt = 0; sl = -1; } else { buf = 'up'; bufT = 0.22; } return; } // a swipe just before landing is kept
      if (k === 'down') { if (jt >= 0) { jt = -1; } sl = 0; } // in the air: drop at once into a slide
    }
    function occAt(z0) { var o = {}; for (var i = 0; i < obs.length; i++) { var b = obs[i]; if (b.t === 'B' && b.z + b.len > z0 - 0.04) { if (b.wide) { o[-1] = o[0] = o[1] = 1; } else o[b.ln] = 1; } } return o; }
    function spawnRow(live) {
      var lv = live ? A.lv() : 0, z0 = ZM + 0.04, occ = occAt(z0), row = null, ok = [], tries = 0;
      while (tries++ < 10) {
        row = TH.row(lv, live, rows, occ);
        ok = [-1, 0, 1].filter(function (l) { return !occ[l] && !row.some(function (o) { return o.t === 'B' && (o.wide || o.ln === l); }); });
        if (ok.length && prevOk.every(function (q) { return ok.some(function (l) { return Math.abs(l - q) <= 1; }); })) break;
        row = null;
      }
      if (!row) return; // no fair row this time: leave a gap
      prevOk = ok;
      row.forEach(function (o) { o.z = z0 + (o.dz || 0); o.len = o.len || 0.05; obs.push(o); });
      rows++;
    }
    // attract scene (before the bet): the runner plays by itself
    function autopilot() {
      var near = null;
      for (var i = 0; i < obs.length; i++) { var o = obs[i]; if (o.z > 0.02 && o.z < 0.55 && (o.wide || Math.abs(o.ln - lane) < 0.5) && (!near || o.z < near.z)) near = o; }
      if (!near) return;
      if (near.t === 'B') { var c = [-1, 0, 1].filter(function (l) { return !obs.some(function (o) { return o.t === 'B' && o.z > -0.1 && o.z < 0.7 && (o.wide || o.ln === l); }); }); if (c.length) { c.sort(function (a, b) { return Math.abs(a - lane) - Math.abs(b - lane); }); lane = c[0]; } }
      else if (near.t === 'J' && near.z < 0.2 && jt < 0) jt = 0;
      else if (near.t === 'S' && near.z < 0.2 && sl < 0) sl = 0;
    }
    function crash() {
      if (dead) return;
      if (!A.fail(A.l.fail)) return;
      dead = 1; jt = -1; sl = -1;
      A.explode(SX(px, 0), ny - lw * 0.45, 1.1); A.shake(0.5);
    }
    var self = {
      size: function (w, h, uu, d, top) {
        W = w; H = h; u = uu; dpr = d; T = top;
        hy = Math.max(top - 8, H * 0.24); ny = H * 0.99;
        lw = Math.min(W * 0.29, (ny - hy) * 0.56);
        V.W = W; V.H = H; V.hy = hy; V.ny = ny; V.lw = lw; V.T = T; V.lite = A.lite;
        bg = mkc(W, H, dpr, function (c) { TH.bg(c, V); });
        SP = TH.art(V, dpr);
      },
      reset: function (live) {
        obs = []; px = lane = 0; jt = sl = -1; buf = null; dead = 0; endE = null; won = 0; v = TH.v0 * (live ? 1 : 0.7); spD = live ? 0.75 : 0.5; prevOk = [-1, 0, 1]; rows = live ? 0 : 99; lean = 0;
      },
      step: function (dt, live) {
        t += dt;
        var lv = A.lv(), playing = A.live();
        var tv = dead ? 0 : (live ? TH.v0 + TH.dv * lv : TH.v0 * 0.7) * (won ? 1.2 : 1);
        v += (tv - v) * Math.min(1, dt * (dead ? 2.4 : 1.6));
        var dz = v * dt; dist += dz;
        var stp = dt * 9, dl = lane - px; px = Math.abs(dl) <= stp ? lane : px + Math.sign(dl) * stp;
        lean += (clamp(dl * 0.9, -0.3, 0.3) - lean) * Math.min(1, dt * 12);
        if (jt >= 0) { jt += dt; if (jt >= JD) jt = -1; }
        if (sl >= 0) { sl += dt; if (sl >= SD) sl = -1; }
        if (buf) { bufT -= dt; if (bufT <= 0) buf = null; else if (jt < 0) { act(buf); buf = null; } }
        if (!dead && !endE && !won) {
          spD -= dz;
          if (spD <= 0) { spawnRow(live); spD = live ? TH.gap(lv) * rnd(0.9, 1.15) : 0.8; }
        }
        if (!live && !dead && !endE) autopilot();
        for (var i = obs.length - 1; i >= 0; i--) {
          var o = obs[i]; o.z -= dz;
          if (o.z + o.len < -0.16) { obs.splice(i, 1); continue; }
          if (!playing || dead || o.hitDone) continue;
          if (o.z <= 0.03 && o.z + o.len >= -0.03 && (o.wide || Math.abs(o.ln - px) < 0.5)) {
            var hit = o.t === 'B' || (o.t === 'J' && jh() < 0.38) || (o.t === 'S' && sl < 0);
            if (hit) { o.hitDone = 1; crash(); }
          }
        }
        if (endE) {
          endE.t += dt; endE.z -= dz + endE.v * dt;
          if (!endE.hit && endE.z <= 0.03) { endE.hit = 1; dead = 1; A.explode(SX(px, 0), ny - lw * 0.5, 1.8); A.flash(0.7); }
          if (TH.endStep) TH.endStep(endE, dt, V);
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        TH.ground(c, V, dist, SP, t);
        if (TH.side) TH.side(c, V, dist, SP, t);
        var list = obs.slice().sort(function (a, b) { return b.z - a.z; }), i;
        for (i = 0; i < list.length; i++) if (list[i].z > 0) TH.ob(c, V, list[i], SP, t);
        if (endE && endE.z > 0.02 && TH.endBack) TH.endDraw(c, V, endE, SP, t);
        // the runner (shadow, then the sprite)
        var j = jh(), x = SX(px, 0), y = ny - lw * 0.03 - j * lw * 0.95;
        if (!(dead && TH.vanish)) {
          c.fillStyle = 'rgba(0,0,0,' + (0.35 - j * 0.2).toFixed(2) + ')'; c.beginPath(); c.ellipse(x, ny - lw * 0.03, lw * (0.3 - j * 0.08), lw * 0.07, 0, 0, TAU); c.fill();
          TH.hero(c, V, x, y, { j: j, jt: jt, sl: sl >= 0 ? sl / SD : -1, dead: dead, t: t, lean: lean, won: won, run: dist }, SP);
        }
        for (i = 0; i < list.length; i++) if (list[i].z <= 0) TH.ob(c, V, list[i], SP, t);
        if (endE && (endE.z <= 0.02 || !TH.endBack)) TH.endDraw(c, V, endE, SP, t);
      },
      act: function (k) { if (k !== 'tap') act(k); },
      boom: function () { // the secret end: an unavoidable event over the 3 lanes
        jt = -1; sl = -1; buf = null;
        obs = obs.filter(function (o) { return o.z > 0.95 || o.z + o.len < -0.02; });
        endE = TH.boom(V) || { z: 0.95, v: 0.8 }; endE.t = 0;
      },
      win: function () { won = 0.001; obs.forEach(function (o) { if (o.z > 0) A.burst(SX(o.wide ? 0 : o.ln, o.z), SY(o.z) - lw * 0.3 * Pz(o.z), 6, ['#FDE68A', '#FFFFFF'], 120, 0.5, 2.6); }); obs = []; },
      dbg: function () { return { px: px, lane: lane, jt: jt, sl: sl, dead: dead, v: v, obs: obs.map(function (o) { return { ln: o.ln, z: +o.z.toFixed(3), len: o.len, t: o.t, wide: !!o.wide }; }) }; }
    };
    return self;
  }
  // perspective box (trucks, trains): side face toward the centre, roof, then the front face (sprite) at the near end
  function box(c, V, ln, zn, zf, hw, hg, img, side, roof) {
    var P = V.P, lw = V.lw;
    var face = zn > -0.02; zn = Math.max(zn, -0.02);
    var xl0 = V.SX(ln - hw, zn), xr0 = V.SX(ln + hw, zn), y0 = V.SY(zn), t0 = y0 - hg * lw * P(zn);
    var xl1 = V.SX(ln - hw, zf), xr1 = V.SX(ln + hw, zf), y1 = V.SY(zf), t1 = y1 - hg * lw * P(zf);
    if (ln < -0.1) poly(c, [xr0, t0, xr1, t1, xr1, y1, xr0, y0], side);
    else if (ln > 0.1) poly(c, [xl0, t0, xl1, t1, xl1, y1, xl0, y0], side);
    poly(c, [xl0, t0, xr0, t0, xr1, t1, xl1, t1], roof);
    if (face) c.drawImage(img, xl0, t0, xr0 - xl0, y0 - t0);
  }
  // a sprite standing on the road at (lane, z): bottom-centre anchored, scaled by the perspective
  function stand(c, V, img, lx, z, wl, hl, lift) {
    if (z < -0.05) return; // already under the camera
    var p = V.P(z), w = wl * V.lw * p, h = hl * V.lw * p, x = V.SX(lx, z), y = V.SY(z) - (lift || 0) * V.lw * p;
    c.drawImage(img, x - w / 2, y - h, w, h);
  }
  // a quad on the ground between two depths (lane marks, sleepers, tiles)
  function gquad(c, V, lx0, lx1, z0, z1, fill) {
    poly(c, [V.SX(lx0, z0), V.SY(z0), V.SX(lx1, z0), V.SY(z0), V.SX(lx1, z1), V.SY(z1), V.SX(lx0, z1), V.SY(z1)], fill);
  }
  // little character seen from behind (explorer / city kid): 4 run frames + jump + slide, drawn once
  function human(w, h, dpr, pal, pose, f) {
    return mkc(w, h, dpr, function (c) {
      var cx = w / 2, sk = pal.skin;
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (pose === 'slide') { // crouched low, legs forward, arms back
        c.strokeStyle = pal.pants; c.lineWidth = w * 0.15;
        c.beginPath(); c.moveTo(cx - w * 0.1, h * 0.84); c.lineTo(cx - w * 0.3, h * 0.94); c.moveTo(cx + w * 0.1, h * 0.84); c.lineTo(cx + w * 0.3, h * 0.94); c.stroke();
        circ(c, cx - w * 0.33, h * 0.95, w * 0.08, pal.shoe); circ(c, cx + w * 0.33, h * 0.95, w * 0.08, pal.shoe);
        rr(c, cx - w * 0.21, h * 0.64, w * 0.42, h * 0.24, w * 0.12); c.fillStyle = lg(c, 0, h * 0.64, 0, h * 0.88, pal.top); c.fill();
        if (pal.bag) { rr(c, cx - w * 0.14, h * 0.65, w * 0.28, h * 0.17, w * 0.06); c.fillStyle = lg(c, 0, h * 0.65, 0, h * 0.82, pal.bag); c.fill(); }
        c.strokeStyle = pal.sleeve; c.lineWidth = w * 0.1; c.beginPath(); c.moveTo(cx - w * 0.2, h * 0.68); c.lineTo(cx - w * 0.4, h * 0.82); c.moveTo(cx + w * 0.2, h * 0.68); c.lineTo(cx + w * 0.4, h * 0.82); c.stroke();
        pal.head(c, cx, h * 0.6, w * 0.15);
        return;
      }
      var a = f / 4 * TAU, ll = pose === 'jump' ? 0.1 : Math.max(0, Math.sin(a)) * 0.15, rl = pose === 'jump' ? 0.1 : Math.max(0, -Math.sin(a)) * 0.15;
      var sw = pose === 'jump' ? 0 : Math.sin(a);
      // legs (hip → foot), the lifted foot shows its sole
      c.strokeStyle = pal.pants; c.lineWidth = w * 0.15;
      c.beginPath(); c.moveTo(cx - w * 0.1, h * 0.6); c.lineTo(cx - w * 0.12 - (pose === 'jump' ? w * 0.06 : 0), h * (0.92 - ll)); c.stroke();
      c.beginPath(); c.moveTo(cx + w * 0.1, h * 0.6); c.lineTo(cx + w * 0.12 + (pose === 'jump' ? w * 0.06 : 0), h * (0.92 - rl)); c.stroke();
      c.fillStyle = ll > 0.05 ? pal.sole : pal.shoe; c.beginPath(); c.ellipse(cx - w * 0.13 - (pose === 'jump' ? w * 0.06 : 0), h * (0.95 - ll), w * 0.1, h * 0.04, 0, 0, TAU); c.fill();
      c.fillStyle = rl > 0.05 ? pal.sole : pal.shoe; c.beginPath(); c.ellipse(cx + w * 0.13 + (pose === 'jump' ? w * 0.06 : 0), h * (0.95 - rl), w * 0.1, h * 0.04, 0, 0, TAU); c.fill();
      // arms swing against the legs
      c.strokeStyle = pal.sleeve; c.lineWidth = w * 0.11;
      var hl = pose === 'jump' ? 0.16 : 0.52 - sw * 0.07, hr = pose === 'jump' ? 0.16 : 0.52 + sw * 0.07;
      c.beginPath(); c.moveTo(cx - w * 0.19, h * 0.33); c.lineTo(cx - w * 0.3, h * hl); c.stroke();
      c.beginPath(); c.moveTo(cx + w * 0.19, h * 0.33); c.lineTo(cx + w * 0.3, h * hr); c.stroke();
      circ(c, cx - w * 0.3, h * hl, w * 0.06, sk); circ(c, cx + w * 0.3, h * hr, w * 0.06, sk);
      // body (+ backpack), head
      rr(c, cx - w * 0.21, h * 0.27, w * 0.42, h * 0.37, w * 0.13); c.fillStyle = lg(c, 0, h * 0.27, 0, h * 0.64, pal.top); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; rr(c, cx - w * 0.17, h * 0.29, w * 0.08, h * 0.26, w * 0.04); c.fill();
      if (pal.bag) { rr(c, cx - w * 0.15, h * 0.3, w * 0.3, h * 0.25, w * 0.07); c.fillStyle = lg(c, 0, h * 0.3, 0, h * 0.55, pal.bag); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(cx - w * 0.15, h * 0.4, w * 0.3, h * 0.025); }
      if (pal.stripe) { c.fillStyle = pal.stripe; c.fillRect(cx - w * 0.21, h * 0.5, w * 0.42, h * 0.035); }
      pal.head(c, cx, h * 0.17, w * 0.15);
    });
  }

  /* ================================================================== 1. HIGHWAY RUSH — a car in the night traffic (3 lanes) */
  function carRear(w, h, dpr, col, player) {
    return mkc(w, h, dpr, function (c) {
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(w / 2, h * 0.95, w * 0.5, h * 0.06, 0, 0, TAU); c.fill();
      c.fillStyle = '#0B0816'; rr(c, w * 0.05, h * 0.7, w * 0.17, h * 0.28, w * 0.04); c.fill(); rr(c, w * 0.78, h * 0.7, w * 0.17, h * 0.28, w * 0.04); c.fill();
      // cabin + rear window
      poly(c, [w * 0.14, h * 0.46, w * 0.86, h * 0.46, w * 0.75, h * 0.1, w * 0.25, h * 0.1], lg(c, 0, h * 0.1, 0, h * 0.46, [col[1], col[2]]));
      poly(c, [w * 0.2, h * 0.43, w * 0.8, h * 0.43, w * 0.71, h * 0.15, w * 0.29, h * 0.15], lg(c, 0, h * 0.15, 0, h * 0.43, ['#334155', '#0F172A']));
      poly(c, [w * 0.3, h * 0.42, w * 0.42, h * 0.42, w * 0.52, h * 0.16, w * 0.44, h * 0.16], 'rgba(255,255,255,.13)');
      // body
      rr(c, w * 0.02, h * 0.42, w * 0.96, h * 0.42, h * 0.12); c.fillStyle = lg(c, 0, h * 0.42, 0, h * 0.84, [col[0], col[1], col[2]]); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(w * 0.08, h * 0.445, w * 0.84, h * 0.025);
      if (player) { c.fillStyle = '#1E1B4B'; c.fillRect(w * 0.44, h * 0.42, w * 0.05, h * 0.42); c.fillRect(w * 0.51, h * 0.42, w * 0.05, h * 0.42); poly(c, [w * 0.1, h * 0.4, w * 0.9, h * 0.4, w * 0.92, h * 0.33, w * 0.08, h * 0.33], col[2]); }
      // tail lights (glow), bumper, plate
      c.shadowColor = '#F43F5E'; c.shadowBlur = h * 0.12;
      rr(c, w * 0.05, h * 0.52, w * 0.24, h * 0.09, h * 0.04); c.fillStyle = '#FB7185'; c.fill();
      rr(c, w * 0.71, h * 0.52, w * 0.24, h * 0.09, h * 0.04); c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#FFE4E6'; c.fillRect(w * 0.08, h * 0.545, w * 0.1, h * 0.025); c.fillRect(w * 0.82, h * 0.545, w * 0.1, h * 0.025);
      rr(c, w * 0.06, h * 0.74, w * 0.88, h * 0.1, h * 0.04); c.fillStyle = '#1E1B2E'; c.fill();
      rr(c, w * 0.39, h * 0.62, w * 0.22, h * 0.09, h * 0.02); c.fillStyle = player ? '#FDE68A' : '#E2E8F0'; c.fill();
    });
  }
  var HIGHWAY = {
    v0: 0.95, dv: 0.62, lanes: 1,
    gap: function (lv) { return Math.max(0.46, 0.82 - 0.26 * lv); },
    row: function (lv, live, n, occ) {
      var r = [], cnt = !live || n < 3 ? 1 : Math.random() < 0.15 + 0.5 * lv ? 2 : 1, ls = [-1, 0, 1].filter(function (l) { return !occ[l]; }).sort(function () { return Math.random() - 0.5; }).slice(0, cnt);
      ls.forEach(function (l) { var truck = live && n > 2 && Math.random() < 0.22 + 0.1 * lv; r.push({ ln: l, t: 'B', k: truck ? 9 : (Math.random() * 4) | 0, len: truck ? 0.16 : 0.07, dz: rnd(0, 0.08) }); });
      return r;
    },
    bg: function (c, V) {
      var W = V.W, H = V.H, hy = V.hy, ny = V.ny;
      c.fillStyle = lg(c, 0, 0, 0, hy, ['#0B0726', '#2A0F57', '#7E2A73']); c.fillRect(0, 0, W, hy + 2);
      stars(c, W, hy * 0.8, V.lite ? 25 : 60);
      // ringed planet over the city
      var pr = Math.min(W, H) * 0.13, pxx = W * 0.76, pyy = hy - pr * 0.55;
      circ(c, pxx, pyy, pr * 1.9, rg(c, pxx, pyy, pr * 1.9, ['rgba(244,114,182,.35)', 'rgba(244,114,182,0)']));
      circ(c, pxx, pyy, pr, rg(c, pxx, pyy, pr, ['#FDE68A', '#F472B6', '#7E22CE'], -pr * 0.35, -pr * 0.4));
      c.strokeStyle = 'rgba(253,230,138,.7)'; c.lineWidth = Math.max(1.5, pr * 0.08); c.beginPath(); c.ellipse(pxx, pyy, pr * 1.6, pr * 0.32, -0.25, 0, TAU); c.stroke();
      // skyline with lit windows
      var x = 0;
      while (x < W) {
        var bw = rnd(0.05, 0.11) * W, bh = rnd(0.04, 0.14) * H;
        c.fillStyle = Math.random() < 0.5 ? '#160A35' : '#1D0E42'; c.fillRect(x, hy - bh, bw + 1, bh + 2);
        c.fillStyle = 'rgba(253,230,138,.75)';
        for (var wy = hy - bh + 4; wy < hy - 3; wy += 6) for (var wx = x + 3; wx < x + bw - 3; wx += 5) if (Math.random() < 0.28) c.fillRect(wx, wy, 1.6, 2.2);
        x += bw;
      }
      c.fillStyle = lg(c, 0, hy, 0, ny, ['#170F33', '#0C0820']); c.fillRect(0, hy, W, H - hy);
      // road + neon edges
      poly(c, [V.SX(-1.62, V.ZF), hy, V.SX(1.62, V.ZF), hy, V.SX(1.62, -0.1), V.SY(-0.1), V.SX(-1.62, -0.1), V.SY(-0.1)], lg(c, 0, hy, 0, ny, ['#2A2150', '#1C1638', '#151029']));
      [-1.55, 1.55].forEach(function (lx) {
        c.strokeStyle = 'rgba(34,211,238,.25)'; c.lineWidth = 6; c.beginPath(); c.moveTo(V.SX(lx, V.ZF), V.SY(V.ZF)); c.lineTo(V.SX(lx, -0.1), V.SY(-0.1)); c.stroke();
        c.strokeStyle = '#67E8F9'; c.lineWidth = 2; c.stroke();
      });
      var hz = c.createLinearGradient(0, hy - 18, 0, hy + 20); hz.addColorStop(0, 'rgba(244,114,182,0)'); hz.addColorStop(0.5, 'rgba(244,114,182,.3)'); hz.addColorStop(1, 'rgba(244,114,182,0)');
      c.fillStyle = hz; c.fillRect(0, hy - 18, W, 38);
    },
    art: function (V, dpr) {
      var lw = V.lw, cw = lw * 0.8, ch = lw * 0.58;
      var cols = [['#93C5FD', '#2563EB', '#1E3A8A'], ['#86EFAC', '#16A34A', '#14532D'], ['#F1F5F9', '#94A3B8', '#334155'], ['#C4B5FD', '#7C3AED', '#3B0764']];
      return {
        cars: cols.map(function (cl) { return carRear(cw, ch, dpr, cl, false); }),
        me: carRear(lw * 0.84, lw * 0.6, dpr, ['#FDE68A', '#F59E0B', '#9A3412'], true),
        truck: mkc(lw * 0.86, lw * 1.0, dpr, function (c, w, h) {
          rr(c, 0, 0, w, h * 0.86, w * 0.05); c.fillStyle = lg(c, 0, 0, 0, h, ['#F8FAFC', '#CBD5E1', '#64748B']); c.fill();
          c.strokeStyle = 'rgba(30,27,75,.45)'; c.lineWidth = Math.max(1, w * 0.015); c.beginPath(); c.moveTo(w / 2, h * 0.05); c.lineTo(w / 2, h * 0.82); c.stroke();
          c.fillStyle = '#475569'; c.fillRect(w * 0.42, h * 0.38, w * 0.04, h * 0.14); c.fillRect(w * 0.54, h * 0.38, w * 0.04, h * 0.14);
          c.fillStyle = '#F59E0B'; c.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.05);
          c.fillStyle = '#0B0816'; c.fillRect(w * 0.06, h * 0.86, w * 0.18, h * 0.14); c.fillRect(w * 0.76, h * 0.86, w * 0.18, h * 0.14);
          c.shadowColor = '#F43F5E'; c.shadowBlur = h * 0.06; c.fillStyle = '#FB7185'; c.fillRect(w * 0.04, h * 0.72, w * 0.12, h * 0.06); c.fillRect(w * 0.84, h * 0.72, w * 0.12, h * 0.06); c.shadowBlur = 0;
          c.fillStyle = '#1E1B2E'; c.fillRect(w * 0.04, h * 0.8, w * 0.92, h * 0.06);
        }),
        pole: [1, -1].map(function (sd) { // left pole: lamp towards the road (right); right pole: mirrored
          return mkc(lw * 0.5, lw * 1.9, dpr, function (c, w, h) {
            if (sd < 0) { c.translate(w, 0); c.scale(-1, 1); }
            c.fillStyle = '#64748B'; c.fillRect(w * 0.06, h * 0.08, w * 0.08, h * 0.92);
            c.fillRect(w * 0.08, h * 0.07, w * 0.62, h * 0.03);
            circ(c, w * 0.74, h * 0.1, w * 0.24, rg(c, w * 0.74, h * 0.1, w * 0.24, ['rgba(254,240,138,.9)', 'rgba(254,240,138,0)']));
            circ(c, w * 0.74, h * 0.1, w * 0.07, '#FEF9C3');
          });
        })
      };
    },
    ground: function (c, V, dist) {
      var S = 0.18, o = dist % S;
      for (var z = V.ZM - o; z > -0.12; z -= S) { var a = Math.max(-0.12, z), b = z + 0.08; gquad(c, V, -0.52, -0.48, a, b, 'rgba(255,255,255,.55)'); gquad(c, V, 0.48, 0.52, a, b, 'rgba(255,255,255,.55)'); }
    },
    side: function (c, V, dist, SP) {
      var S = 0.42, o = dist % S;
      for (var z = V.ZM - o; z > -0.12; z -= S) { stand(c, V, SP.pole[0], -1.75, z, 0.5, 1.9); stand(c, V, SP.pole[1], 1.75, z, 0.5, 1.9); }
    },
    ob: function (c, V, o, SP) {
      if (o.k === 9) { box(c, V, o.ln, o.z, o.z + o.len, 0.43, 1.0, SP.truck, '#64748B', '#CBD5E1'); return; }
      stand(c, V, SP.cars[o.k], o.ln, o.z, 0.8, 0.58);
    },
    hero: function (c, V, x, y, s, SP) {
      var w = V.lw * 0.84, h = V.lw * 0.6;
      c.save(); c.translate(x, y); c.rotate(s.dead ? Math.sin(s.t * 20) * 0.1 : s.lean * 0.5);
      c.drawImage(SP.me, -w / 2, -h, w, h);
      if (!s.dead) { var fl = 0.6 + 0.4 * Math.sin(s.t * 40); circ(c, -w * 0.22, -h * 0.12, w * 0.05 * fl, 'rgba(147,197,253,.85)'); circ(c, w * 0.22, -h * 0.12, w * 0.05 * fl, 'rgba(147,197,253,.85)'); }
      c.restore();
    },
    vanish: false,
    boom: function () { return { z: 0.62, v: 0.25, fall: 0 }; }, // a meteor lands on the road, the crater fills the 3 lanes
    endStep: function (e, dt) { e.fall = Math.min(1, e.fall + dt / 0.35); },
    endDraw: function (c, V, e, SP, t) {
      var z = Math.max(e.z, -0.1), p = V.P(z);
      if (e.fall < 1) { var k = e.fall, mx = V.W * (0.9 - 0.4 * k), my = V.SY(z) - (1 - k) * V.H * 0.8; meteor(c, mx, my, V.lw * 0.25 * (0.6 + k), Math.atan2(V.H * 0.8, V.W * 0.4)); return; }
      // crater on fire across the road
      var x0 = V.SX(-1.6, z), x1 = V.SX(1.6, z), y = V.SY(z), hh = V.lw * 0.9 * p;
      c.fillStyle = '#0B0520'; c.beginPath(); c.ellipse((x0 + x1) / 2, y, (x1 - x0) / 2, hh * 0.22, 0, 0, TAU); c.fill();
      for (var i = 0; i < 9; i++) { var fx = x0 + (x1 - x0) * (i + 0.5) / 9, fh = hh * (0.55 + 0.45 * Math.sin(t * 14 + i * 1.7)); var fg = c.createLinearGradient(0, y - fh, 0, y); fg.addColorStop(0, 'rgba(253,230,138,0)'); fg.addColorStop(0.4, 'rgba(251,146,60,.9)'); fg.addColorStop(1, 'rgba(244,63,94,.95)'); c.fillStyle = fg; c.beginPath(); c.moveTo(fx - (x1 - x0) / 14, y); c.quadraticCurveTo(fx, y - fh * 1.2, fx + (x1 - x0) / 14, y); c.fill(); }
    }
  };

  /* ================================================================== 2. JUNGLE DASH — explorer on an old stone path */
  var JUNGLE = {
    v0: 0.88, dv: 0.6,
    gap: function (lv) { return Math.max(0.5, 0.88 - 0.26 * lv); },
    row: function (lv, live, n, occ) {
      if (!live) return [pick([{ ln: pick([-1, 0, 1]), t: 'B', k: 0, len: 0.06 }, { ln: 0, wide: 1, t: 'J', k: 1, len: 0.04 }, { ln: 0, wide: 1, t: 'S', k: 2, len: 0.04 }])];
      if (n < 2) return [{ ln: pick([-1, 1]), t: 'B', k: 0, len: 0.06 }];
      var x = Math.random();
      if (n >= 3 && x < 0.16 + 0.08 * lv) return [{ ln: 0, wide: 1, t: 'J', k: 1, len: 0.04 }];
      if (n >= 4 && x < 0.3 + 0.14 * lv) return [{ ln: 0, wide: 1, t: 'S', k: 2, len: 0.04 }];
      var r = [], ls = [-1, 0, 1].sort(function () { return Math.random() - 0.5; }), nb = Math.random() < 0.2 + 0.45 * lv ? 2 : 1;
      for (var i = 0; i < nb; i++) r.push({ ln: ls[i], t: 'B', k: Math.random() < 0.5 ? 0 : 3, len: 0.06 });
      if (nb === 1 && Math.random() < 0.35 + 0.3 * lv) r.push(Math.random() < 0.5 ? { ln: ls[1], t: 'J', k: 4, len: 0.04 } : { ln: ls[1], t: 'S', k: 5, len: 0.04 });
      return r;
    },
    bg: function (c, V) {
      var W = V.W, H = V.H, hy = V.hy, ny = V.ny;
      c.fillStyle = lg(c, 0, 0, 0, hy, ['#06121F', '#0E2A3A', '#1F5A48']); c.fillRect(0, 0, W, hy + 2);
      stars(c, W, hy * 0.7, V.lite ? 20 : 45);
      var mr = Math.min(W, H) * 0.09, mx = W * 0.24, my = hy - mr * 1.6;
      circ(c, mx, my, mr * 2.2, rg(c, mx, my, mr * 2.2, ['rgba(254,249,195,.28)', 'rgba(254,249,195,0)']));
      circ(c, mx, my, mr, rg(c, mx, my, mr, ['#FFFBEB', '#FDE68A', '#CA8A04'], -mr * 0.3, -mr * 0.3));
      c.fillStyle = 'rgba(161,98,7,.35)'; circ(c, mx + mr * 0.3, my + mr * 0.15, mr * 0.2, 'rgba(161,98,7,.35)'); circ(c, mx - mr * 0.25, my - mr * 0.3, mr * 0.13, 'rgba(161,98,7,.3)');
      // stepped temple on the horizon
      var tw = Math.min(W * 0.34, V.lw * 2.4), th = tw * 0.42, tx = W / 2;
      for (var s = 0; s < 5; s++) { var sw = tw * (1 - s * 0.17), sh = th / 5; c.fillStyle = s % 2 ? '#123A2E' : '#16463A'; c.fillRect(tx - sw / 2, hy - sh * (s + 1), sw, sh + 1); }
      c.fillStyle = '#0B2A20'; c.fillRect(tx - tw * 0.06, hy - th - th * 0.18, tw * 0.12, th * 0.2);
      c.fillStyle = 'rgba(253,230,138,.55)'; c.fillRect(tx - tw * 0.025, hy - th * 0.45, tw * 0.05, th * 0.25);
      // jungle walls (left / right)
      c.fillStyle = lg(c, 0, hy, 0, ny, ['#0E3B2B', '#072019']); c.fillRect(0, hy, W, H - hy);
      [-1, 1].forEach(function (sd) {
        for (var i = 0; i < 14; i++) {
          var k = i / 13, x = W / 2 + sd * (V.lw * (1.75 + k * 0.4) * (0.2 + k * 0.95) + rnd(10, 30)), y = hy + (ny - hy) * k * 0.95 - rnd(0, 20), r = (14 + k * 60) * rnd(0.7, 1.2);
          circ(c, x, y, r, rg(c, x, y, r, ['#22C55E', '#15803D', '#052E16'], -r * 0.3, -r * 0.35));
        }
      });
      poly(c, [V.SX(-1.6, V.ZF), hy, V.SX(1.6, V.ZF), hy, V.SX(1.6, -0.1), V.SY(-0.1), V.SX(-1.6, -0.1), V.SY(-0.1)], lg(c, 0, hy, 0, ny, ['#6B6147', '#8C7D58', '#6E6043']));
      [-1.6, 1.6].forEach(function (lx) { c.strokeStyle = '#3F6212'; c.lineWidth = 5; c.beginPath(); c.moveTo(V.SX(lx, V.ZF), hy); c.lineTo(V.SX(lx, -0.1), V.SY(-0.1)); c.stroke(); });
      [-0.5, 0.5].forEach(function (lx) { c.strokeStyle = 'rgba(40,30,15,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(V.SX(lx, V.ZF), hy); c.lineTo(V.SX(lx, -0.1), V.SY(-0.1)); c.stroke(); });
    },
    art: function (V, dpr) {
      var lw = V.lw, hw = lw * 0.62, hh = lw * 1.08;
      var pal = {
        skin: '#E8B48A', pants: '#7C5A3A', shoe: '#3F2A1A', sole: '#C8A27A', sleeve: '#D9B77E', top: ['#F1D9A5', '#C99A57'], bag: ['#A16207', '#713F12'],
        head: function (c, x, y, r) { circ(c, x, y, r, '#5B3A1E'); c.fillStyle = '#E8B48A'; c.beginPath(); c.arc(x - r * 0.95, y + r * 0.1, r * 0.25, 0, TAU); c.arc(x + r * 0.95, y + r * 0.1, r * 0.25, 0, TAU); c.fill(); c.fillStyle = '#A16207'; c.beginPath(); c.ellipse(x, y - r * 0.35, r * 1.65, r * 0.42, 0, 0, TAU); c.fill(); rr(c, x - r * 0.85, y - r * 1.25, r * 1.7, r * 0.95, r * 0.4); c.fillStyle = '#B45309'; c.fill(); c.fillStyle = '#451A03'; c.fillRect(x - r * 0.85, y - r * 0.52, r * 1.7, r * 0.18); }
      };
      return {
        run: [0, 1, 2, 3].map(function (f) { return human(hw, hh, dpr, pal, 'run', f); }), jump: human(hw, hh, dpr, pal, 'jump', 0), slide: human(hw, hh, dpr, pal, 'slide', 0),
        rock: mkc(lw * 0.9, lw * 0.78, dpr, function (c, w, h) {
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(w / 2, h * 0.94, w * 0.48, h * 0.07, 0, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(w * 0.04, h * 0.94); c.quadraticCurveTo(w * 0.02, h * 0.3, w * 0.4, h * 0.08); c.quadraticCurveTo(w * 0.85, h * 0.02, w * 0.96, h * 0.55); c.lineTo(w * 0.94, h * 0.94); c.closePath();
          c.fillStyle = rg(c, w * 0.45, h * 0.5, w * 0.6, ['#D6D3D1', '#78716C', '#292524'], -w * 0.15, -h * 0.25); c.fill();
          c.fillStyle = 'rgba(74,222,128,.7)'; c.beginPath(); c.ellipse(w * 0.45, h * 0.14, w * 0.3, h * 0.08, -0.1, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(41,37,36,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(w * 0.5, h * 0.3); c.lineTo(w * 0.58, h * 0.55); c.lineTo(w * 0.52, h * 0.8); c.stroke();
        }),
        idol: mkc(lw * 0.8, lw * 1.25, dpr, function (c, w, h) { // carved stone pillar
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(w / 2, h * 0.96, w * 0.48, h * 0.04, 0, 0, TAU); c.fill();
          rr(c, w * 0.12, h * 0.06, w * 0.76, h * 0.9, w * 0.1); c.fillStyle = lg(c, 0, 0, w, 0, ['#A8A29E', '#78716C', '#44403C']); c.fill();
          c.fillStyle = '#292524'; rr(c, w * 0.24, h * 0.22, w * 0.18, h * 0.08, 2); c.fill(); rr(c, w * 0.58, h * 0.22, w * 0.18, h * 0.08, 2); c.fill(); rr(c, w * 0.3, h * 0.42, w * 0.4, h * 0.07, 2); c.fill();
          c.fillStyle = '#FBBF24'; c.fillRect(w * 0.28, h * 0.245, w * 0.08, h * 0.03); c.fillRect(w * 0.62, h * 0.245, w * 0.08, h * 0.03);
          c.fillStyle = 'rgba(74,222,128,.75)'; c.fillRect(w * 0.12, h * 0.6, w * 0.76, h * 0.05); c.fillRect(w * 0.2, h * 0.06, w * 0.5, h * 0.04);
        }),
        log: [1, 3.15].map(function (wl) {
          return mkc(lw * wl, lw * 0.34, dpr, function (c, w, h) {
            c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(w / 2, h * 0.92, w * 0.5, h * 0.12, 0, 0, TAU); c.fill();
            rr(c, h * 0.3, h * 0.08, w - h * 0.6, h * 0.8, h * 0.4); c.fillStyle = lg(c, 0, 0, 0, h, ['#B45309', '#78350F', '#451A03']); c.fill();
            c.strokeStyle = 'rgba(69,26,3,.6)'; c.lineWidth = 1.2; for (var i = 1; i < wl * 3; i++) { c.beginPath(); c.moveTo(i * w / (wl * 3), h * 0.2); c.lineTo(i * w / (wl * 3) + 6, h * 0.75); c.stroke(); }
            c.fillStyle = 'rgba(253,230,138,.35)'; c.fillRect(h * 0.5, h * 0.18, w - h, h * 0.1);
            [h * 0.42, w - h * 0.42].forEach(function (x) { c.fillStyle = '#D6A35C'; c.beginPath(); c.ellipse(x, h * 0.48, h * 0.24, h * 0.4, 0, 0, TAU); c.fill(); c.strokeStyle = '#92400E'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, h * 0.48, h * 0.12, h * 0.22, 0, 0, TAU); c.stroke(); });
            c.fillStyle = 'rgba(74,222,128,.8)'; c.beginPath(); c.ellipse(w * 0.3, h * 0.12, w * 0.06, h * 0.08, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(w * 0.7, h * 0.1, w * 0.05, h * 0.07, 0, 0, TAU); c.fill();
          });
        }),
        branch: [1.05, 3.3].map(function (wl) { // a thick branch at head height on two trunks, vines hanging: slide under
          return mkc(lw * wl, lw * 1.3, dpr, function (c, w, h) {
            var bt = h * 0.18, bb = h * 0.42;
            c.fillStyle = lg(c, 0, 0, w, 0, ['#3F2A1A', '#5B3A1E', '#3F2A1A']); c.fillRect(0, bt, w * 0.07, h - bt); c.fillRect(w * 0.93, bt, w * 0.07, h - bt);
            rr(c, 0, bt, w, bb - bt, (bb - bt) / 2); c.fillStyle = lg(c, 0, bt, 0, bb, ['#A16207', '#713F12', '#3F2A1A']); c.fill();
            c.strokeStyle = '#16A34A'; c.lineWidth = Math.max(1.5, h * 0.02); c.lineCap = 'round';
            for (var i = 0; i < wl * 4; i++) { var x = w * (0.08 + 0.84 * (i + 0.5) / (wl * 4)), L = h * (0.06 + 0.1 * ((i * 7) % 3) / 2); c.beginPath(); c.moveTo(x, bb - 2); c.quadraticCurveTo(x + 3, bb + L / 2, x, bb + L); c.stroke(); circ(c, x, bb + L, h * 0.022, '#4ADE80'); }
            for (i = 0; i < wl * 5; i++) { var lx = w * (i + 0.5) / (wl * 5); c.fillStyle = i % 2 ? '#22C55E' : '#15803D'; c.beginPath(); c.ellipse(lx, bt + 1, h * 0.05, h * 0.022, i % 2 ? 0.4 : -0.4, 0, TAU); c.fill(); }
          });
        }),
        fern: mkc(lw * 0.9, lw * 0.9, dpr, function (c, w, h) {
          for (var i = 0; i < 7; i++) { var a = -Math.PI / 2 + (i - 3) * 0.32; c.strokeStyle = i % 2 ? '#16A34A' : '#22C55E'; c.lineWidth = w * 0.07; c.lineCap = 'round'; c.beginPath(); c.moveTo(w / 2, h); c.quadraticCurveTo(w / 2 + Math.cos(a) * w * 0.25, h + Math.sin(a) * h * 0.55, w / 2 + Math.cos(a) * w * 0.48, h + Math.sin(a) * h * 0.85); c.stroke(); }
        }),
        trunk: mkc(lw * 0.5, lw * 2.6, dpr, function (c, w, h) {
          c.fillStyle = lg(c, 0, 0, w, 0, ['#2B1B10', '#5B3A1E', '#2B1B10']); c.fillRect(w * 0.3, h * 0.12, w * 0.4, h * 0.88);
          circ(c, w / 2, h * 0.14, w * 0.5, rg(c, w / 2, h * 0.14, w * 0.5, ['#4ADE80', '#15803D', '#052E16'], -w * 0.15, -w * 0.15));
        })
      };
    },
    ground: function (c, V, dist) {
      var S = 0.13, o = dist % S;
      c.fillStyle = 'rgba(40,30,15,.4)';
      for (var z = V.ZM - o; z > -0.12; z -= S) gquad(c, V, -1.6, 1.6, z, z + 0.012, 'rgba(40,30,15,.38)');
    },
    side: function (c, V, dist, SP) {
      var S = 0.3, o = dist % S, k = Math.floor(dist / S);
      for (var z = V.ZM - o, i = 0; z > -0.14; z -= S, i++) {
        var alt = (k + i) % 2;
        stand(c, V, alt ? SP.trunk : SP.fern, -2.05 - (alt ? 0.35 : 0), z, alt ? 0.5 : 0.9, alt ? 2.6 : 0.9);
        stand(c, V, alt ? SP.fern : SP.trunk, 2.05 + (alt ? 0 : 0.35), z, alt ? 0.9 : 0.5, alt ? 0.9 : 2.6);
      }
    },
    ob: function (c, V, o, SP) {
      if (o.k === 0) stand(c, V, SP.rock, o.ln, o.z, 0.9, 0.78);
      else if (o.k === 3) stand(c, V, SP.idol, o.ln, o.z, 0.8, 1.25);
      else if (o.k === 1 || o.k === 4) stand(c, V, SP.log[o.wide ? 1 : 0], o.ln, o.z, o.wide ? 3.15 : 1, 0.34);
      else stand(c, V, SP.branch[o.wide ? 1 : 0], o.ln, o.z, o.wide ? 3.3 : 1.05, 1.3);
    },
    hero: function (c, V, x, y, s, SP) {
      var w = V.lw * 0.62, h = V.lw * 1.08, img = s.sl >= 0 ? SP.slide : s.j > 0.02 ? SP.jump : SP.run[((s.run * 15) | 0) % 4];
      c.save(); c.translate(x, y); if (s.dead) c.rotate(0.5); c.drawImage(img, -w / 2, -h, w, h); c.restore();
    },
    endBack: true,
    boom: function () { return { z: 1.1, v: 1.1, rot: 0 }; }, // a giant boulder rolls down the path
    endStep: function (e, dt) { e.rot += dt * 6; },
    endDraw: function (c, V, e) {
      var z = Math.max(e.z, -0.12), p = V.P(z), r = V.lw * 1.45 * p, x = V.W / 2, y = V.SY(z) - r;
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x, V.SY(z), r, r * 0.2, 0, 0, TAU); c.fill();
      circ(c, x, y, r, rg(c, x, y, r, ['#E7E5E4', '#78716C', '#1C1917'], -r * 0.35, -r * 0.4));
      c.strokeStyle = 'rgba(28,25,23,.6)'; c.lineWidth = Math.max(1.5, r * 0.05);
      for (var i = 0; i < 3; i++) { var a = e.rot + i * 2.1; c.beginPath(); c.arc(x, y, r * 0.65, a, a + 0.9); c.stroke(); }
    }
  };

  /* ================================================================== 3. METRO DASH — rail tracks in the neon city */
  var METRO = {
    v0: 0.92, dv: 0.62,
    gap: function (lv) { return Math.max(0.5, 0.9 - 0.26 * lv); },
    row: function (lv, live, n, occ) {
      if (!live) return [pick([{ ln: pick([-1, 0, 1]), t: 'B', k: 0, len: 0.5 }, { ln: pick([-1, 0, 1]), t: 'J', k: 1, len: 0.04 }, { ln: pick([-1, 0, 1]), t: 'S', k: 2, len: 0.04 }])];
      if (n < 2) return [{ ln: pick([-1, 1]), t: 'B', k: 0, len: 0.45 }];
      var r = [], ls = [-1, 0, 1].filter(function (l) { return !occ[l]; }).sort(function () { return Math.random() - 0.5; });
      if (!ls.length) return r;
      var x = Math.random();
      if (n >= 3 && x < 0.1 + 0.08 * lv && ls.length === 3) return [{ ln: 0, wide: 1, t: 'J', k: 3, len: 0.04 }];
      if (x < 0.5) { r.push({ ln: ls[0], t: 'B', k: 0, len: rnd(0.35, 0.55 + 0.3 * lv) }); if (ls.length > 2 && Math.random() < 0.15 + 0.35 * lv) r.push({ ln: ls[1], t: 'B', k: 0, len: rnd(0.3, 0.5) }); }
      else r.push(Math.random() < 0.5 ? { ln: ls[0], t: 'J', k: 1, len: 0.04 } : { ln: ls[0], t: 'S', k: 2, len: 0.04 });
      if (ls.length > 1 && r.length === 1 && Math.random() < 0.25 + 0.35 * lv) r.push(Math.random() < 0.5 ? { ln: ls[1], t: 'J', k: 1, len: 0.04 } : { ln: ls[1], t: 'S', k: 2, len: 0.04 });
      return r;
    },
    bg: function (c, V) {
      var W = V.W, H = V.H, hy = V.hy, ny = V.ny;
      c.fillStyle = lg(c, 0, 0, 0, hy, ['#050720', '#0C1A45', '#1E3A8A']); c.fillRect(0, 0, W, hy + 2);
      stars(c, W, hy * 0.6, V.lite ? 18 : 40);
      var mr = Math.min(W, H) * 0.06; circ(c, W * 0.8, hy * 0.42, mr, rg(c, W * 0.8, hy * 0.42, mr, ['#F0F9FF', '#93C5FD', '#1E40AF'], -mr * 0.3, -mr * 0.3));
      // towers: cyan / magenta windows
      var x = -10;
      while (x < W) {
        var bw = rnd(0.06, 0.12) * W, bh = rnd(0.08, 0.26) * H * (Math.abs(x + bw / 2 - W / 2) < W * 0.18 ? 0.55 : 1);
        c.fillStyle = Math.random() < 0.5 ? '#0A1030' : '#0E1640'; c.fillRect(x, hy - bh, bw + 1, bh + 2);
        var wc = Math.random() < 0.6 ? 'rgba(103,232,249,.8)' : 'rgba(240,171,252,.8)'; c.fillStyle = wc;
        for (var wy = hy - bh + 5; wy < hy - 4; wy += 7) for (var wx = x + 3; wx < x + bw - 3; wx += 5) if (Math.random() < 0.3) c.fillRect(wx, wy, 1.8, 2.6);
        x += bw + rnd(0, 4);
      }
      var hz = c.createLinearGradient(0, hy - 16, 0, hy + 16); hz.addColorStop(0, 'rgba(34,211,238,0)'); hz.addColorStop(0.5, 'rgba(34,211,238,.25)'); hz.addColorStop(1, 'rgba(34,211,238,0)'); c.fillStyle = hz; c.fillRect(0, hy - 16, W, 32);
      c.fillStyle = lg(c, 0, hy, 0, ny, ['#1A1834', '#121027']); c.fillRect(0, hy, W, H - hy);
      // ballast under each track
      [-1, 0, 1].forEach(function (l) { poly(c, [V.SX(l - 0.46, V.ZF), hy, V.SX(l + 0.46, V.ZF), hy, V.SX(l + 0.46, -0.1), V.SY(-0.1), V.SX(l - 0.46, -0.1), V.SY(-0.1)], lg(c, 0, hy, 0, ny, ['#2E2B4A', '#3A3658'])); });
      // side walls
      [-1, 1].forEach(function (sd) { poly(c, [V.SX(sd * 1.62, V.ZF), hy, V.SX(sd * 1.75, V.ZF), hy - V.lw * 0.25 * V.P(V.ZF), V.SX(sd * 1.75, -0.1), V.SY(-0.1) - V.lw * 0.25 * V.P(-0.1), V.SX(sd * 1.62, -0.1), V.SY(-0.1)], sd < 0 ? '#3B2F6B' : '#2E2558'); });
    },
    art: function (V, dpr) {
      var lw = V.lw, hw = lw * 0.62, hh = lw * 1.08;
      var pal = {
        skin: '#C68B59', pants: '#1E3A8A', shoe: '#F8FAFC', sole: '#F43F5E', sleeve: '#0891B2', top: ['#22D3EE', '#0E7490'], stripe: '#FDE68A',
        head: function (c, x, y, r) { circ(c, x, y + r * 0.1, r * 1.25, lg(c, 0, y - r, 0, y + r, ['#22D3EE', '#0E7490'])); circ(c, x, y + r * 0.2, r * 0.8, '#1E293B'); c.strokeStyle = '#FDE68A'; c.lineWidth = r * 0.2; c.beginPath(); c.arc(x, y + r * 0.1, r * 1.25, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
      };
      return {
        run: [0, 1, 2, 3].map(function (f) { return human(hw, hh, dpr, pal, 'run', f); }), jump: human(hw, hh, dpr, pal, 'jump', 0), slide: human(hw, hh, dpr, pal, 'slide', 0),
        train: mkc(lw * 0.84, lw * 1.25, dpr, function (c, w, h) { // the front of a metro car
          rr(c, 0, h * 0.04, w, h * 0.92, w * 0.16); c.fillStyle = lg(c, 0, 0, 0, h, ['#E0F2FE', '#94A3B8', '#475569']); c.fill();
          rr(c, w * 0.1, h * 0.14, w * 0.8, h * 0.32, w * 0.08); c.fillStyle = lg(c, 0, h * 0.14, 0, h * 0.46, ['#1E3A8A', '#0B1229']); c.fill();
          poly(c, [w * 0.18, h * 0.42, w * 0.32, h * 0.42, w * 0.5, h * 0.17, w * 0.38, h * 0.17], 'rgba(255,255,255,.16)');
          rr(c, w * 0.3, h * 0.06, w * 0.4, h * 0.06, 3); c.fillStyle = '#0F172A'; c.fill(); c.fillStyle = '#FBBF24'; c.fillRect(w * 0.34, h * 0.075, w * 0.32, h * 0.03);
          c.fillStyle = '#2563EB'; c.fillRect(0, h * 0.56, w, h * 0.07);
          c.shadowColor = '#FEF9C3'; c.shadowBlur = h * 0.06; circ(c, w * 0.2, h * 0.72, w * 0.07, '#FEF9C3'); circ(c, w * 0.8, h * 0.72, w * 0.07, '#FEF9C3'); c.shadowBlur = 0;
          c.fillStyle = '#1E1B2E'; c.fillRect(w * 0.06, h * 0.86, w * 0.88, h * 0.08);
        }),
        barrier: [1, 3.1].map(function (wl) {
          return mkc(lw * 0.92 * wl, lw * 0.42, dpr, function (c, w, h) {
            c.fillStyle = '#94A3B8'; c.fillRect(w * 0.06, h * 0.3, Math.max(2, w * 0.04 / wl), h * 0.7); c.fillRect(w * 0.9, h * 0.3, Math.max(2, w * 0.04 / wl), h * 0.7);
            rr(c, 0, h * 0.08, w, h * 0.4, h * 0.08); c.fillStyle = '#F8FAFC'; c.fill();
            c.save(); c.clip(); c.fillStyle = '#E11D48'; for (var x = -h; x < w + h; x += h * 0.7) { c.beginPath(); c.moveTo(x, h * 0.48); c.lineTo(x + h * 0.35, h * 0.48); c.lineTo(x + h * 0.7, h * 0.08); c.lineTo(x + h * 0.35, h * 0.08); c.fill(); } c.restore();
            circ(c, w * 0.06, h * 0.08, h * 0.07, '#FBBF24'); circ(c, w * 0.94, h * 0.08, h * 0.07, '#FBBF24');
          });
        }),
        sign: mkc(lw * 0.98, lw * 1.35, dpr, function (c, w, h) { // overhead sign on a gantry: slide under
          c.fillStyle = '#64748B'; c.fillRect(w * 0.02, 0, w * 0.06, h); c.fillRect(w * 0.92, 0, w * 0.06, h);
          rr(c, 0, h * 0.12, w, h * 0.3, h * 0.04); c.fillStyle = lg(c, 0, h * 0.12, 0, h * 0.42, ['#FDE68A', '#F59E0B']); c.fill();
          c.save(); c.clip(); c.fillStyle = '#1E1B2E'; for (var x = -h; x < w + h; x += h * 0.16) { c.beginPath(); c.moveTo(x, h * 0.42); c.lineTo(x + h * 0.08, h * 0.42); c.lineTo(x + h * 0.38, h * 0.12); c.lineTo(x + h * 0.3, h * 0.12); c.fill(); } c.restore();
          rr(c, w * 0.3, h * 0.17, w * 0.4, h * 0.2, h * 0.03); c.fillStyle = '#1E1B2E'; c.fill();
          c.fillStyle = '#FDE68A'; c.beginPath(); c.moveTo(w * 0.5, h * 0.35); c.lineTo(w * 0.42, h * 0.25); c.lineTo(w * 0.47, h * 0.25); c.lineTo(w * 0.47, h * 0.19); c.lineTo(w * 0.53, h * 0.19); c.lineTo(w * 0.53, h * 0.25); c.lineTo(w * 0.58, h * 0.25); c.fill();
        }),
        post: mkc(lw * 0.4, lw * 2.1, dpr, function (c, w, h) { c.fillStyle = '#475569'; c.fillRect(w * 0.42, 0, w * 0.16, h); c.fillStyle = '#64748B'; c.fillRect(0, h * 0.04, w, h * 0.04); circ(c, w * 0.5, h * 0.03, w * 0.12, '#F0ABFC'); })
      };
    },
    ground: function (c, V, dist) {
      var S = 0.1, o = dist % S, z;
      for (z = V.ZM - o; z > -0.12; z -= S) for (var l = -1; l <= 1; l++) gquad(c, V, l - 0.4, l + 0.4, z, z + 0.028, '#4B3B2E');
      c.strokeStyle = '#CBD5E1'; c.lineWidth = 1.6;
      for (l = -1; l <= 1; l++) for (var s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(V.SX(l + s * 0.26, V.ZF), V.SY(V.ZF)); c.lineTo(V.SX(l + s * 0.26, -0.1), V.SY(-0.1)); c.stroke(); }
    },
    side: function (c, V, dist, SP) {
      var S = 0.5, o = dist % S;
      for (var z = V.ZM - o; z > -0.12; z -= S) { stand(c, V, SP.post, -1.85, z, 0.4, 2.1); stand(c, V, SP.post, 1.85, z, 0.4, 2.1); }
    },
    ob: function (c, V, o, SP) {
      if (o.k === 0) { box(c, V, o.ln, o.z, o.z + o.len, 0.42, 1.25, SP.train, o.ln < 0 ? '#1D4ED8' : '#1E40AF', '#94A3B8'); return; }
      if (o.k === 1 || o.k === 3) { stand(c, V, SP.barrier[o.k === 3 ? 1 : 0], o.ln, o.z, o.k === 3 ? 2.85 : 0.92, 0.42); return; }
      stand(c, V, SP.sign, o.ln, o.z, 0.98, 1.35);
    },
    hero: JUNGLE.hero,
    endBack: true,
    boom: function () { return { z: 1.2, v: 1.4 }; }, // express trains on the 3 tracks
    endDraw: function (c, V, e, SP, t) {
      for (var l = -1; l <= 1; l++) box(c, V, l, Math.max(e.z, -0.12), e.z + 0.9, 0.42, 1.25, SP.train, '#1E3A8A', '#334155');
      var z = Math.max(e.z, -0.1), p = V.P(z);
      for (l = -1; l <= 1; l++) circ(c, V.SX(l, z), V.SY(z) - V.lw * 0.35 * p, V.lw * 0.45 * p, rg(c, V.SX(l, z), V.SY(z) - V.lw * 0.35 * p, V.lw * 0.45 * p, ['rgba(254,249,195,.55)', 'rgba(254,249,195,0)']));
    }
  };

  boot('highway', function (A) { return runner(A, HIGHWAY); }, 'lr', 0.5);
  boot('jungledash', function (A) { return runner(A, JUNGLE); }, 'swipe4', 0.5);
  boot('metrodash', function (A) { return runner(A, METRO); }, 'swipe4', 0.5);

  /* ================================================================== 4. ORBIT SWITCH — tap to jump between two orbits */
  boot('orbit', function (A) {
    var W, H, u, dpr, T, bg, cx, cy, R1, R2, rkS = [], shipS, th = 0, ring = 1, rr0 = 0, rocks = [], nextA = 0, w = 1, dead = 0, flare = null, won = 0, t = 0, trail = [];
    function rockSp(R) {
      return mkc(R * 2 + 2, R * 2 + 2, dpr, function (c) {
        var x = R + 1, n = 10; c.beginPath();
        for (var i = 0; i < n; i++) { var a = i / n * TAU, r = R * rnd(0.78, 1); if (i) c.lineTo(x + Math.cos(a) * r, x + Math.sin(a) * r); else c.moveTo(x + Math.cos(a) * r, x + Math.sin(a) * r); }
        c.closePath(); c.fillStyle = rg(c, x, x, R, ['#FBCFE8', '#A855F7', '#4C1D95', '#1E1047'], -R * 0.35, -R * 0.4); c.fill();
        c.strokeStyle = 'rgba(253,230,138,.5)'; c.lineWidth = Math.max(1, R * 0.08); c.stroke();
        circ(c, x + R * 0.25, x + R * 0.1, R * 0.2, 'rgba(30,16,71,.45)'); circ(c, x - R * 0.3, x - R * 0.25, R * 0.13, 'rgba(30,16,71,.4)');
      });
    }
    function newRocks(live) {
      var lv = live ? A.lv() : 0;
      while (nextA < th + 4.0) {
        var gapT = live ? Math.max(0.45, rnd(0.85, 1.2) - 0.45 * lv) : 1.4;
        var rg0 = Math.random() < 0.5 ? 0 : 1;
        rocks.push({ ring: rg0, a: nextA, r: (live ? rnd(0.85, 1.1) + 0.15 * lv : 0.9), spin: rnd(-2, 2), born: t });
        if (live && Math.random() < 0.12 + 0.25 * lv) rocks.push({ ring: rg0, a: nextA + rnd(0.18, 0.3), r: 0.85, spin: rnd(-2, 2), born: t }); // a pair on the same orbit
        nextA += gapT * w;
      }
    }
    return {
      size: function (ww, hh, uu, d, top) {
        W = ww; H = hh; u = uu; dpr = d; T = top;
        cx = W / 2; cy = T + (H - T) * 0.5; R2 = Math.min(W * 0.42, (H - T) * 0.45); R1 = R2 * 0.6;
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#160F3D', '#0A0720']); c.fillRect(0, 0, W, H);
          circ(c, W * 0.15, H * 0.2, Math.max(W, H) * 0.4, rg(c, W * 0.15, H * 0.2, Math.max(W, H) * 0.4, ['rgba(139,92,246,.25)', 'rgba(139,92,246,0)']));
          circ(c, W * 0.9, H * 0.85, Math.max(W, H) * 0.35, rg(c, W * 0.9, H * 0.85, Math.max(W, H) * 0.35, ['rgba(236,72,153,.18)', 'rgba(236,72,153,0)']));
          stars(c, W, H, A.lite ? 40 : 90);
          var pr = R1 * 0.52;
          circ(c, cx, cy, pr * 1.6, rg(c, cx, cy, pr * 1.6, ['rgba(56,189,248,.35)', 'rgba(56,189,248,0)']));
          circ(c, cx, cy, pr, rg(c, cx, cy, pr, ['#E0F2FE', '#38BDF8', '#1D4ED8', '#0B1A4A'], -pr * 0.35, -pr * 0.4));
          c.save(); c.beginPath(); c.arc(cx, cy, pr, 0, TAU); c.clip();
          c.fillStyle = 'rgba(255,255,255,.14)'; for (var i = -2; i <= 2; i++) c.fillRect(cx - pr, cy + i * pr * 0.32 - pr * 0.05, pr * 2, pr * 0.1);
          c.restore();
          c.setLineDash([3, 7]); c.lineWidth = 1.5; c.strokeStyle = 'rgba(196,181,253,.35)';
          c.beginPath(); c.arc(cx, cy, R1, 0, TAU); c.stroke(); c.beginPath(); c.arc(cx, cy, R2, 0, TAU); c.stroke(); c.setLineDash([]);
        });
        var RM = Math.max(9, R2 * 0.1); rkS = [0, 1, 2].map(function () { return rockSp(RM); }); rkS.R = RM;
        var s = Math.max(16, R2 * 0.13);
        shipS = mkc(s * 2, s * 2, dpr, function (c) { // satellite pod pointing up (rotated along the orbit when drawn)
          c.translate(s, s);
          c.fillStyle = '#38BDF8'; c.fillRect(-s * 0.95, -s * 0.18, s * 0.5, s * 0.36); c.fillRect(s * 0.45, -s * 0.18, s * 0.5, s * 0.36);
          c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.strokeRect(-s * 0.95, -s * 0.18, s * 0.5, s * 0.36); c.strokeRect(s * 0.45, -s * 0.18, s * 0.5, s * 0.36);
          circ(c, 0, 0, s * 0.45, rg(c, 0, 0, s * 0.45, ['#FFFFFF', '#FDE68A', '#D97706'], -s * 0.15, -s * 0.18));
          circ(c, 0, -s * 0.05, s * 0.18, '#0E7490'); circ(c, -s * 0.05, -s * 0.1, s * 0.06, '#E0F2FE');
        });
        shipS.s = s;
        rr0 = ring ? R2 : R1;
      },
      reset: function (live) { rocks = []; th = -Math.PI / 2; nextA = th + (live ? 2.2 : 1.6); ring = 1; rr0 = R2 || 0; dead = 0; flare = null; won = 0; w = live ? 1.05 : 0.8; trail = []; },
      step: function (dt, live) {
        t += dt;
        var lv = A.lv(), playing = A.live();
        var tw = dead ? 0 : live ? 1.05 + 1.0 * lv : 0.8;
        w += (tw - w) * Math.min(1, dt * 2);
        th += w * dt;
        var tr = ring ? R2 : R1; rr0 += (tr - rr0) * Math.min(1, dt * 16);
        if (!dead && !flare && !won) newRocks(live);
        if (!live && !dead) { // attract scene: switches by itself
          var nr = rocks.filter(function (o) { return o.ring === ring && o.a > th && o.a - th < 0.5; });
          if (nr.length && !rocks.some(function (o) { return o.ring !== ring && Math.abs(o.a - th) < 0.5; })) ring = 1 - ring;
        }
        var sx = cx + Math.cos(th) * rr0, sy = cy + Math.sin(th) * rr0;
        if (!A.lite) { trail.push([sx, sy]); if (trail.length > 14) trail.shift(); }
        for (var i = rocks.length - 1; i >= 0; i--) {
          var o = rocks[i];
          if (o.a < th - 0.8) { rocks.splice(i, 1); continue; }
          if (!playing || dead) continue;
          var R = o.ring ? R2 : R1, ox = cx + Math.cos(o.a) * R, oy = cy + Math.sin(o.a) * R, dd = Math.hypot(ox - sx, oy - sy);
          if (dd < rkS.R * o.r * 0.85 + shipS.s * 0.4) { if (A.fail(A.l.fail)) { dead = 1; A.explode(sx, sy, 1.1); } }
        }
        if (flare) {
          flare.r += dt * R2 * 2.1;
          if (!flare.hit && flare.r >= rr0) { flare.hit = 1; dead = 1; A.explode(sx, sy, 1.6); A.flash(0.6); }
        }
        if (won) won += dt;
      },
      draw: function (c) {
        A.bg(bg);
        var i;
        // the current orbit glows
        c.lineWidth = 2.5; c.strokeStyle = 'rgba(253,230,138,.55)'; c.beginPath(); c.arc(cx, cy, ring ? R2 : R1, 0, TAU); c.stroke();
        for (i = 0; i < rocks.length; i++) {
          var o = rocks[i], R = o.ring ? R2 : R1, ox = cx + Math.cos(o.a) * R, oy = cy + Math.sin(o.a) * R, s = rkS.R * o.r, al = clamp((t - o.born) / 0.4, 0, 1);
          c.globalAlpha = al; c.save(); c.translate(ox, oy); c.rotate(t * o.spin); c.drawImage(rkS[i % 3], -s - 1, -s - 1, s * 2 + 2, s * 2 + 2); c.restore();
        }
        c.globalAlpha = 1;
        if (trail.length > 1) { c.strokeStyle = 'rgba(253,230,138,.35)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(trail[0][0], trail[0][1]); for (i = 1; i < trail.length; i++) c.lineTo(trail[i][0], trail[i][1]); c.stroke(); }
        if (!dead) {
          var sx = cx + Math.cos(th) * rr0, sy = cy + Math.sin(th) * rr0, ss = shipS.s;
          c.save(); c.translate(sx, sy); c.rotate(th + Math.PI); if (won) c.scale(1 + 0.15 * Math.sin(won * 10), 1 + 0.15 * Math.sin(won * 10)); c.drawImage(shipS, -ss, -ss, ss * 2, ss * 2); c.restore();
        }
        if (flare) {
          var fr = flare.r, g2 = c.createRadialGradient(cx, cy, Math.max(0, fr - R2 * 0.25), cx, cy, fr);
          g2.addColorStop(0, 'rgba(253,186,116,0)'); g2.addColorStop(0.7, 'rgba(251,146,60,.55)'); g2.addColorStop(1, 'rgba(255,247,237,.9)');
          c.fillStyle = g2; c.beginPath(); c.arc(cx, cy, fr, 0, TAU); c.fill();
        }
      },
      act: function () { if (!dead && !flare) ring = 1 - ring; },
      boom: function () { flare = { r: R1 * 0.5 }; },
      win: function () { won = 0.001; rocks.forEach(function (o) { var R = o.ring ? R2 : R1; A.burst(cx + Math.cos(o.a) * R, cy + Math.sin(o.a) * R, 6, ['#FDE68A', '#FFFFFF'], 120, 0.5, 2.6); }); rocks = []; },
      dbg: function () { return { th: th, ring: ring, w: w, dead: dead, rocks: rocks.map(function (o) { return { ring: o.ring, da: +(o.a - th).toFixed(3) }; }) }; }
    };
  }, 'tap', 0.5);
})(window.D6 = window.D6 || {});
