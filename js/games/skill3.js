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
  var $ = K.$, TAU = Math.PI * 2, PI = Math.PI;

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

  /* people (runners, …) are drawn by the shared rig in js/art-rig.js (pre-drawn sprite frames) */
  var RIG = D6.Rig;

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
        idle: function () { return phase === 'idle' || phase === 'demo'; }, // the visitor's demo round = the attract autopilot
        fail: function (why) {                                              // the player's own mistake
          if (phase !== 'play') return false;
          phase = 'failing'; say(why || l.fail, 'lost'); setBtn(l.bet, '', 'wait'); btn.disabled = true;
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
        if (D) demoTick(dt);                                            // visitor: a demo round plays by itself
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

      /* ---- gestures on the WHOLE scene: a swipe acts as soon as the finger has moved ~16 px (no wait for the release);
         a short touch without movement = tap (left / right half for the runners). No ripple: the game itself answers. ---- */
      function pt(e) { var r = rect || st.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      function nudge() { // touching the scene before betting: the BET button pulses + one clear line
        if (K.guest()) return;
        say(l.go, 'idle'); btn.classList.remove('sk-nudge'); void btn.offsetWidth; btn.classList.add('sk-nudge');
        clearTimeout(nudgeT); nudgeT = setTimeout(function () { if (!box.isConnected) return; btn.classList.remove('sk-nudge'); if (phase === 'idle') say('', 'idle'); }, 1800);
      }
      function did(what, x, y) { if (phase !== 'play') return; gN++; box.setAttribute('data-gn', String(gN)); K.sfx('act'); g.act(what, x, y); }
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
      D = K.demo ? K.demo(st) : null; // visitors only (null for a logged-in player)
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
    var rph = 0, land = 0, deadT = 0, SL = [], DU = [], stepN = 0, sfx = 0; // v2843: run phase, landing squash, speed streaks, dust (drawing only)
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
    // v2843 — speed streaks (stronger as the multiplier climbs) + dust kicked at every step
    function fx(dt, live) {
      var sf = !live ? 0.25 : clamp(0.4 + A.lv() * 0.7, 0, 1); sfx += (sf - sfx) * Math.min(1, dt * 2);
      var n = A.lite ? 10 : 22;
      while (SL.length < n) SL.push({ r: Math.random(), a: 0, w: 0 });
      for (var i = 0; i < SL.length; i++) {
        var q = SL[i]; q.r += dt * (0.25 + v * 0.9) * (0.35 + q.r) * (0.6 + sfx);
        if (q.r > 1 || !q.a) { q.r = q.a ? rnd(0, 0.08) : Math.random(); q.a = Math.random() < 0.5 ? rnd(-0.5, 0.42) : Math.PI - rnd(-0.5, 0.42); q.w = rnd(0.6, 1.4); }
      }
      var st = Math.floor(rph * 2);
      if (st !== stepN) { stepN = st; if (!dead && jt < 0 && v > 0.1) puff(2 + (sl >= 0 ? 2 : 0)); }
      for (i = DU.length - 1; i >= 0; i--) { var d = DU[i]; d.t += dt; if (d.t > d.m) { DU.splice(i, 1); continue; } d.x += d.vx * dt; d.y += d.vy * dt; }
    }
    function puff(n) {
      if (!W || A.lite && DU.length > 6) return;
      var x = SX(px, 0), y = ny - lw * 0.03, F2 = TH.feet ? TH.feet(V, x, y) : [[x - lw * 0.1, y], [x + lw * 0.1, y]];
      for (var i = 0; i < n; i++) { var f = F2[i % F2.length]; if (DU.length > 30) DU.shift(); DU.push({ x: f[0] + rnd(-4, 4), y: f[1], vx: rnd(-0.5, 0.5) * lw, vy: rnd(0.15, 0.45) * lw * (0.6 + v), r: lw * rnd(0.05, 0.09), t: 0, m: rnd(0.35, 0.55) }); }
    }
    function fxDraw(c) {
      var i, R0 = Math.hypot(W, H), col = TH.dust || 'rgba(255,255,255,';
      for (i = 0; i < DU.length; i++) { var d = DU[i], k = d.t / d.m; c.fillStyle = col + (0.42 * (1 - k)).toFixed(3) + ')'; c.beginPath(); c.arc(d.x, d.y, d.r * (1 + k * 1.6), 0, TAU); c.fill(); }
      if (sfx < 0.05) return;
      c.lineCap = 'round'; c.strokeStyle = (TH.streak || 'rgba(255,255,255,') + '1)';
      for (i = 0; i < SL.length; i++) {
        var q = SL[i], d0 = R0 * (0.12 + q.r * 0.75), d1 = d0 + R0 * (0.03 + 0.13 * sfx) * (0.3 + q.r) * q.w, ca = Math.cos(q.a), sa = Math.sin(q.a);
        c.globalAlpha = Math.min(1, q.r * 4) * (1 - q.r) * 0.6 * sfx; c.lineWidth = 0.8 + q.r * 2.4 * q.w;
        c.beginPath(); c.moveTo(W / 2 + ca * d0, hy + sa * d0); c.lineTo(W / 2 + ca * d1, hy + sa * d1); c.stroke();
      }
      c.globalAlpha = 1;
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
        deadT = 0; land = 0; DU.length = 0;
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
        if (jt >= 0) { jt += dt; if (jt >= JD) { jt = -1; land = 0.14; } }
        land = Math.max(0, land - dt); if (dead) deadT += dt;
        rph = (rph + dz * (TH.cad || 2.5)) % 1;
        fx(dt, live);
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
        if (TH.over) TH.over(c, V, SP, t, dist);
        // the runner (shadow, then the sprite)
        var j = jh(), x = SX(px, 0), y = ny - lw * 0.03 - j * lw * 0.95;
        if (!(dead && TH.vanish)) {
          c.fillStyle = 'rgba(0,0,0,' + (0.35 - j * 0.2).toFixed(2) + ')'; c.beginPath(); c.ellipse(x, ny - lw * 0.03, lw * (0.3 - j * 0.08), lw * 0.07, 0, 0, TAU); c.fill();
          TH.hero(c, V, x, y, { j: j, jt: jt, sl: sl >= 0 ? sl / SD : -1, dead: dead, t: t, lean: lean, won: won, run: dist, ph: rph, land: land, dt: deadT }, SP);
        }
        fxDraw(c);
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
  /* ------------------------------------------------------------------ v2843 (owner: "pas sérieux", "on ne sent pas que le gars avance")
     New art for the 3 runners — ONLY the drawing changed: same lanes, same obstacle rows and depths, same hit tests.
     People are drawn with the RIG skeleton (8-frame run cycle, jump, slide), scenery scrolls on 2–3 depths (ground bands,
     walls / trees close to the track, far props), speed streaks and dust grow with the speed. Every sprite is pre-drawn once. */
  // a vertical wall along the track (lateral position lx, between depths z0 → z1, from height h0 to h1 in lane units),
  // textured with a sprite cut into a few vertical strips (cheap perspective, no per-pixel work)
  function wallImg(c, V, img, lx, z0, z1, h0, h1, n) {
    var iw = img.width, ih = img.height, F = 4.2;
    z0 = Math.max(z0, -0.14);
    if (z1 <= z0) return;
    // strips evenly spaced on screen (in perspective P), each one an exact sheared slice of the texture: no stepping
    var P0 = V.P(z0), P1 = V.P(z1), lw = V.lw;
    for (var i = 0; i < n; i++) {
      var pa = P1 + (P0 - P1) * i / n, pb = P1 + (P0 - P1) * (i + 1) / n;          // far → near
      var za = (1 / pa - 1) / F, zb = (1 / pb - 1) / F;
      var ua = (za - z0) / (z1 - z0) * iw, ub = (zb - z0) / (z1 - z0) * iw, sw = ua - ub;
      if (sw < 0.5) continue;
      var xa = V.W / 2 + lx * lw * pa, xb = V.W / 2 + lx * lw * pb, ya = V.hy + (V.ny - V.hy) * pa, yb = V.hy + (V.ny - V.hy) * pb;
      var ta = ya - h1 * lw * pa, tb = yb - h1 * lw * pb, hgt = (h1 - h0) * lw * (pa + pb) / 2;
      // texture column ub → ua maps to screen xb → xa (mirrored when needed)
      c.save(); c.transform((xa - xb) / sw, (ta - tb) / sw, 0, hgt / ih, xb, tb);
      c.drawImage(img, ub, 0, sw, ih, 0, 0, sw + 0.8, ih); c.restore();
    }
  }
  function wallQuad(c, V, lx, z0, z1, h0, h1, fill) {
    z0 = Math.max(z0, -0.14);
    var p0 = V.P(z0), p1 = V.P(z1);
    poly(c, [V.SX(lx, z0), V.SY(z0) - h0 * V.lw * p0, V.SX(lx, z1), V.SY(z1) - h0 * V.lw * p1, V.SX(lx, z1), V.SY(z1) - h1 * V.lw * p1, V.SX(lx, z0), V.SY(z0) - h1 * V.lw * p0], fill);
  }
  // scrolling ground bands (alternating shades) between two lateral limits: the strongest cue of speed
  function bands(c, V, dist, S, lx0, lx1, colA, colB, k0) {
    var o = dist % S, n = Math.floor(dist / S) + (k0 || 0), z = V.ZM + S - o, i = 0;
    for (; z > -0.14; z -= S, i++) { var a = Math.max(-0.14, z - S); if ((n + i) % 2) gquad(c, V, lx0, lx1, a, z, colA); else if (colB) gquad(c, V, lx0, lx1, a, z, colB); }
  }
  // the hero (person): run frames follow the distance (faster = faster legs), squash on take-off / landing, stretch in the air
  function heroRig(c, V, x, y, s, SP) {
    var h = V.lw * 1.34, w = h * 0.8, img, sx = 1, sy = 1;
    if (s.sl >= 0) { img = SP.slide; var k = s.sl; sy = k < 0.1 ? 1 - k * 1.2 : 0.9; sx = 2 - sy; }
    else if (s.jt >= 0 || s.j > 0.02) { img = SP.jump; var q = s.jt / 0.66; if (q < 0.1) { sy = 0.86 + q * 1.4; sx = 1.1 - q; } else { sy = 1.07 - q * 0.08; sx = 0.95 + q * 0.04; } }
    else img = SP.run[((s.ph * SP.run.length) | 0) % SP.run.length];
    if (s.land > 0) { var l = s.land / 0.14; sy *= 1 - 0.13 * l; sx *= 1 + 0.1 * l; }
    c.save(); c.translate(x, y);
    if (s.dead) { c.rotate(Math.min(1.2, s.dt * 4)); c.globalAlpha = Math.max(0.2, 1 - s.dt * 0.6); }
    else c.rotate(s.lean * 0.18);
    c.scale(sx, sy); c.drawImage(img, -w / 2, -h, w, h); c.restore(); c.globalAlpha = 1;
  }
  function rigSet(V, dpr, pal) {
    var h = V.lw * 1.34, w = h * 0.8;
    return { run: RIG.sheet(w, h, dpr, { view: 'back', pose: 'run', pal: pal }, V.lite ? 6 : 8), jump: RIG.one(w, h, dpr, { view: 'back', pose: 'jump', pal: pal }), slide: RIG.one(w, h, dpr, { view: 'back', pose: 'slide', pal: pal }) };
  }
  /* ------------------------------------------------------------------ foliage kit (v2860): real leaves instead of green balls */
  function srand(seed) { var S = seed || 1; return function () { S = (S * 9301 + 49297) % 233280; return S / 233280; }; }
  // one pointed leaf with a light side, a dark side and a midrib
  function leaf(c, x, y, L, Wd, a, col, dk) {
    var ca = Math.cos(a), sa = Math.sin(a), ex = x + ca * L, ey = y + sa * L, nx = -sa * Wd, ny = ca * Wd, mx = x + ca * L * 0.45, my = y + sa * L * 0.45;
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx + nx, my + ny, ex, ey); c.quadraticCurveTo(mx, my, x, y); c.fill();
    c.fillStyle = dk; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx - nx, my - ny, ex, ey); c.quadraticCurveTo(mx, my, x, y); c.fill();
  }
  // a cluster of leaves around (cx, cy): back leaves dark, front leaves light, a few sun-lit tips
  function leafBall(c, cx, cy, R, n, pal, R0) {
    var r = R0 || Math.random;
    for (var i = 0; i < n; i++) {
      var k = i / n, a = r() * TAU, d = R * Math.sqrt(r()) * 0.75, lx = cx + Math.cos(a) * d, ly = cy + Math.sin(a) * d * 0.8;
      var L = R * (0.38 + r() * 0.3), la = a + (r() - 0.5) * 1.2 + (Math.sin(a) < 0 ? 0 : 0.3), p = pal[Math.min(pal.length - 1, (k * pal.length) | 0)];
      leaf(c, lx - Math.cos(la) * L * 0.4, ly - Math.sin(la) * L * 0.4, L, L * 0.26, la, p[0], p[1]);
    }
  }
  var JPAL = [['#0E3B1E', '#06240F'], ['#14532D', '#0B3A1C'], ['#166534', '#0F4424'], ['#15803D', '#0E5A2A'], ['#22A04B', '#126B31'], ['#4ADE80', '#1F9D4B']];
  function palmFrond(c, x, y, L, a, droop, col, dk) {
    var pts = [], i, n = 14;
    for (i = 0; i <= n; i++) { var t = i / n, aa = a + droop * t * t; pts.push([x + Math.cos(a) * L * t + Math.cos(aa) * 0, y + Math.sin(a) * L * t + droop * L * 0.5 * t * t]); }
    c.strokeStyle = dk; c.lineWidth = Math.max(1, L * 0.025); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (i = 1; i <= n; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke();
    for (i = 2; i <= n; i++) { var q = pts[i], pq = pts[i - 1], ang = Math.atan2(q[1] - pq[1], q[0] - pq[0]), ll = L * 0.32 * (1 - i / n * 0.6);
      leaf(c, q[0], q[1], ll, ll * 0.12, ang + 1.0 + droop * 0.3, col, dk); leaf(c, q[0], q[1], ll, ll * 0.12, ang - 1.0 + droop * 0.3, dk, col); }
  }
  function vine(c, x, y, L, sway, col, lc) { // hanging liana: a thin stem with small pointed leaves along it
    c.strokeStyle = col; c.lineWidth = Math.max(1, L * 0.012); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sway, y + L * 0.5, x + sway * 0.3, y + L); c.stroke();
    var n = Math.max(4, Math.min(16, (L / 9) | 0)), ls = Math.max(3, Math.min(14, L * 0.07));
    for (var i = 1; i <= n; i++) { var t = i / (n + 0.5), lx = x + sway * (2 * t * (1 - t)) + sway * 0.3 * t * t, ly = y + L * t, sd = i % 2 ? 1 : -1;
      leaf(c, lx, ly, ls * (0.7 + 0.3 * (i % 3) / 2), ls * 0.32, PI / 2 + sd * 0.9, sd > 0 ? lc : col, col); }
  }

  /* ================================================================== 1. HIGHWAY RUSH — a sports car in the night traffic (3 lanes) */
  // rear view of a car: body, glass, tail-light bar, wheels, exhaust (player: spoiler + gold stripes)
  function carRear(w, h, dpr, col, kind) {
    return mkc(w, h, dpr, function (c) {
      var suv = kind === 'suv', taxi = kind === 'taxi', me = kind === 'me', roofT = suv ? 0.04 : me ? 0.2 : 0.12;
      c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(w / 2, h * 0.95, w * 0.52, h * 0.07, 0, 0, TAU); c.fill();
      // tyres
      [0.04, 0.78].forEach(function (x) { rr(c, w * x, h * 0.68, w * 0.18, h * 0.3, w * 0.05); c.fillStyle = lg(c, 0, h * 0.68, 0, h * 0.98, ['#1F2937', '#030712']); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(w * (x + 0.02), h * 0.72, w * 0.14, h * 0.02); });
      // cabin + rear glass with reflection
      poly(c, [w * 0.12, h * 0.48, w * 0.88, h * 0.48, w * (me ? 0.74 : 0.78), h * roofT, w * (me ? 0.26 : 0.22), h * roofT], lg(c, 0, h * roofT, 0, h * 0.48, [RIG.shade(col[0], 0.1), col[1], col[2]]));
      poly(c, [w * 0.18, h * 0.45, w * 0.82, h * 0.45, w * (me ? 0.71 : 0.74), h * (roofT + 0.05), w * (me ? 0.29 : 0.26), h * (roofT + 0.05)], lg(c, 0, h * roofT, 0, h * 0.45, ['#475569', '#0F172A', '#020617']));
      poly(c, [w * 0.3, h * 0.44, w * 0.4, h * 0.44, w * 0.52, h * (roofT + 0.06), w * 0.44, h * (roofT + 0.06)], 'rgba(255,255,255,.16)');
      poly(c, [w * 0.45, h * 0.44, w * 0.49, h * 0.44, w * 0.58, h * (roofT + 0.06), w * 0.55, h * (roofT + 0.06)], 'rgba(255,255,255,.1)');
      if (taxi) { rr(c, w * 0.38, h * (roofT - 0.07), w * 0.24, h * 0.08, h * 0.02); c.fillStyle = '#FEF08A'; c.fill(); c.fillStyle = '#1E293B'; c.fillRect(w * 0.42, h * (roofT - 0.045), w * 0.16, h * 0.03); }
      // body
      rr(c, w * 0.01, h * 0.43, w * 0.98, h * 0.4, h * 0.12); c.fillStyle = lg(c, 0, h * 0.43, 0, h * 0.83, [RIG.shade(col[0], 0.15), col[0], col[1], col[2]]); c.fill();
      c.fillStyle = lg(c, 0, 0, w, 0, ['rgba(0,0,0,.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.3)']); rr(c, w * 0.01, h * 0.43, w * 0.98, h * 0.4, h * 0.12); c.fill();
      c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(w * 0.08, h * 0.455, w * 0.84, h * 0.018);
      if (me) { c.fillStyle = '#FFF7ED'; c.fillRect(w * 0.43, h * 0.43, w * 0.05, h * 0.4); c.fillRect(w * 0.52, h * 0.43, w * 0.05, h * 0.4); // spoiler
        rr(c, w * 0.02, h * 0.3, w * 0.96, h * 0.07, h * 0.03); c.fillStyle = lg(c, 0, h * 0.3, 0, h * 0.37, ['#334155', '#0F172A']); c.fill(); c.fillStyle = '#0F172A'; c.fillRect(w * 0.16, h * 0.36, w * 0.04, h * 0.08); c.fillRect(w * 0.8, h * 0.36, w * 0.04, h * 0.08); }
      if (taxi) { c.fillStyle = '#111827'; for (var i = 0; i < 8; i++) c.fillRect(w * (0.1 + i * 0.1), h * (0.66 + (i % 2) * 0.03), w * 0.05, h * 0.03); }
      // tail-light bar (no blur: a soft halo drawn as gradients)
      var tl = lg(c, 0, h * 0.52, 0, h * 0.62, ['#FFE4E6', '#F43F5E', '#9F1239']);
      c.fillStyle = 'rgba(244,63,94,.28)'; rr(c, w * 0.02, h * 0.49, w * 0.3, h * 0.16, h * 0.06); c.fill(); rr(c, w * 0.68, h * 0.49, w * 0.3, h * 0.16, h * 0.06); c.fill();
      c.fillStyle = tl; rr(c, w * 0.05, h * 0.52, w * 0.24, h * 0.09, h * 0.04); c.fill(); rr(c, w * 0.71, h * 0.52, w * 0.24, h * 0.09, h * 0.04); c.fill();
      if (me || suv) { c.fillStyle = 'rgba(251,113,133,.85)'; c.fillRect(w * 0.29, h * 0.555, w * 0.42, h * 0.02); }
      c.fillStyle = '#FFF1F2'; c.fillRect(w * 0.08, h * 0.545, w * 0.08, h * 0.022); c.fillRect(w * 0.84, h * 0.545, w * 0.08, h * 0.022);
      // bumper, plate, exhausts
      rr(c, w * 0.05, h * 0.74, w * 0.9, h * 0.1, h * 0.04); c.fillStyle = lg(c, 0, h * 0.74, 0, h * 0.84, ['#334155', '#0F172A']); c.fill();
      rr(c, w * 0.38, h * 0.63, w * 0.24, h * 0.09, h * 0.02); c.fillStyle = me ? '#FDE68A' : '#F1F5F9'; c.fill(); c.fillStyle = '#334155'; c.fillRect(w * 0.42, h * 0.665, w * 0.16, h * 0.02);
      if (me) [0.24, 0.7].forEach(function (x) { circ(c, w * x + w * 0.03, h * 0.8, w * 0.035, '#94A3B8'); circ(c, w * x + w * 0.03, h * 0.8, w * 0.022, '#0B0816'); });
    });
  }
  var HIGHWAY = {
    v0: 0.95, dv: 0.62, lanes: 1, streak: 'rgba(186,230,253,', dust: 'rgba(148,163,184,',
    gap: function (lv) { return Math.max(0.46, 0.82 - 0.26 * lv); },
    row: function (lv, live, n, occ) {
      var r = [], cnt = !live || n < 3 ? 1 : Math.random() < 0.15 + 0.5 * lv ? 2 : 1, ls = [-1, 0, 1].filter(function (l) { return !occ[l]; }).sort(function () { return Math.random() - 0.5; }).slice(0, cnt);
      ls.forEach(function (l) { var truck = live && n > 2 && Math.random() < 0.22 + 0.1 * lv; r.push({ ln: l, t: 'B', k: truck ? 9 : (Math.random() * 4) | 0, len: truck ? 0.16 : 0.07, dz: rnd(0, 0.08) }); });
      return r;
    },
    bg: function (c, V) {
      var W = V.W, H = V.H, hy = V.hy, ny = V.ny;
      c.fillStyle = lg(c, 0, 0, 0, hy, ['#070523', '#1C0B45', '#4C1D6B', '#9D2E6B']); c.fillRect(0, 0, W, hy + 2);
      stars(c, W, hy * 0.7, V.lite ? 25 : 70);
      var mr = Math.min(W, H) * 0.07, mx = W * 0.8, my = hy * 0.45;
      circ(c, mx, my, mr * 2.6, rg(c, mx, my, mr * 2.6, ['rgba(253,224,230,.25)', 'rgba(253,224,230,0)']));
      circ(c, mx, my, mr, rg(c, mx, my, mr, ['#FFF7ED', '#FBCFE8', '#DB2777'], -mr * 0.3, -mr * 0.3));
      // 2 skylines: far (pale) and near (dark, lit windows, neon tops, a billboard)
      [[0.07, 0.2, '#3A1660', 0.15, 0.35], [0.05, 0.13, '#130A2E', 0.32, 0.8]].forEach(function (L, li) {
        var x = -5;
        while (x < W) {
          var bw = rnd(0.05, 0.1) * W, bh = rnd(L[0], L[1]) * H * (li ? 1 : 1.25);
          c.fillStyle = L[2]; c.fillRect(x, hy - bh, bw + 1, bh + 2);
          if (li && Math.random() < 0.35) { c.fillStyle = Math.random() < 0.5 ? '#F472B6' : '#22D3EE'; c.fillRect(x + 2, hy - bh - 2, bw - 4, 2); }
          c.fillStyle = li ? 'rgba(253,230,138,.8)' : 'rgba(244,114,182,.35)';
          for (var wy = hy - bh + 4; wy < hy - 3; wy += li ? 5 : 7) for (var wx = x + 2; wx < x + bw - 2; wx += li ? 4 : 6) if (Math.random() < L[3]) c.fillRect(wx, wy, 1.6, 2);
          x += bw + (li ? 0 : 3);
        }
      });
      var bbw = W * 0.16, bbx = W * 0.12, bby = hy - H * 0.11; // billboard
      c.fillStyle = '#0B0820'; c.fillRect(bbx + bbw * 0.45, bby, bbw * 0.1, H * 0.11);
      rr(c, bbx, bby - bbw * 0.36, bbw, bbw * 0.4, 3); c.fillStyle = lg(c, bbx, 0, bbx + bbw, 0, ['#F472B6', '#A855F7', '#22D3EE']); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(bbx + bbw * 0.12, bby - bbw * 0.24, bbw * 0.5, bbw * 0.06); c.fillRect(bbx + bbw * 0.12, bby - bbw * 0.14, bbw * 0.3, bbw * 0.05);
      var hz = c.createLinearGradient(0, hy - 30, 0, hy + 10); hz.addColorStop(0, 'rgba(244,114,182,0)'); hz.addColorStop(0.7, 'rgba(244,114,182,.35)'); hz.addColorStop(1, 'rgba(244,114,182,0)');
      c.fillStyle = hz; c.fillRect(0, hy - 30, W, 40);
      c.fillStyle = lg(c, 0, hy, 0, ny, ['#141029', '#0B0818']); c.fillRect(0, hy, W, H - hy);
      // asphalt with a warm glow of the street lights down the road
      poly(c, [V.SX(-1.62, V.ZF), hy, V.SX(1.62, V.ZF), hy, V.SX(1.62, -0.14), V.SY(-0.14), V.SX(-1.62, -0.14), V.SY(-0.14)], lg(c, 0, hy, 0, ny, ['#3A3060', '#26203F', '#1A1530']));
      c.fillStyle = 'rgba(255,255,255,.035)'; for (var i = 0; i < (V.lite ? 200 : 600); i++) { var gz = Math.random() * 2.2, gx = rnd(-1.6, 1.6); c.fillRect(V.SX(gx, gz), V.SY(gz), 1.2, 1.2); }
      // shoulders + edge lines
      [-1, 1].forEach(function (sd) {
        poly(c, [V.SX(sd * 1.62, V.ZF), hy, V.SX(sd * 2.6, V.ZF), hy, V.SX(sd * 2.6, -0.14), V.SY(-0.14), V.SX(sd * 1.62, -0.14), V.SY(-0.14)], '#120D24');
        c.strokeStyle = '#F8FAFC'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(V.SX(sd * 1.52, V.ZF), hy); c.lineTo(V.SX(sd * 1.52, -0.14), V.SY(-0.14)); c.stroke();
      });
    },
    art: function (V, dpr) {
      var lw = V.lw, cw = lw * 0.8, ch = lw * 0.58;
      var cols = [['#93C5FD', '#2563EB', '#1E3A8A'], ['#86EFAC', '#16A34A', '#14532D'], ['#FEF08A', '#EAB308', '#854D0E'], ['#F1F5F9', '#94A3B8', '#334155']];
      return {
        cars: [carRear(cw, ch, dpr, cols[0], 'car'), carRear(cw, ch * 1.12, dpr, cols[1], 'suv'), carRear(cw, ch, dpr, cols[2], 'taxi'), carRear(cw, ch, dpr, cols[3], 'car')],
        me: carRear(lw * 0.86, lw * 0.6, dpr, ['#FDBA74', '#EA580C', '#7C2D12'], 'me'),
        truck: mkc(lw * 0.86, lw * 1.0, dpr, function (c, w, h) {
          rr(c, 0, 0, w, h * 0.86, w * 0.04); c.fillStyle = lg(c, 0, 0, 0, h, ['#F8FAFC', '#CBD5E1', '#64748B']); c.fill();
          c.strokeStyle = 'rgba(30,27,75,.35)'; c.lineWidth = Math.max(1, w * 0.012); for (var i = 1; i < 6; i++) { c.beginPath(); c.moveTo(w * i / 6, h * 0.05); c.lineTo(w * i / 6, h * 0.8); c.stroke(); }
          c.fillStyle = '#334155'; c.fillRect(w * 0.47, h * 0.05, w * 0.06, h * 0.78);
          c.fillStyle = '#94A3B8'; c.fillRect(w * 0.4, h * 0.36, w * 0.05, h * 0.16); c.fillRect(w * 0.55, h * 0.36, w * 0.05, h * 0.16);
          c.fillStyle = lg(c, 0, 0, w, 0, ['#F59E0B', '#EF4444', '#F59E0B']); c.fillRect(w * 0.04, h * 0.06, w * 0.92, h * 0.05);
          c.fillStyle = '#0B0816'; c.fillRect(w * 0.06, h * 0.86, w * 0.18, h * 0.14); c.fillRect(w * 0.76, h * 0.86, w * 0.18, h * 0.14);
          for (i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#DC2626' : '#F8FAFC'; c.fillRect(w * (0.04 + i * 0.153), h * 0.8, w * 0.153, h * 0.04); }
          c.fillStyle = 'rgba(244,63,94,.3)'; c.fillRect(w * 0.02, h * 0.69, w * 0.16, h * 0.12); c.fillRect(w * 0.82, h * 0.69, w * 0.16, h * 0.12);
          c.fillStyle = '#FB7185'; c.fillRect(w * 0.04, h * 0.72, w * 0.12, h * 0.06); c.fillRect(w * 0.84, h * 0.72, w * 0.12, h * 0.06);
        }),
        tside: mkc(256, 64, 1, function (c, w, h) { c.fillStyle = lg(c, 0, 0, 0, h, ['#E2E8F0', '#94A3B8', '#475569']); c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(30,41,59,.25)'; for (var i = 0; i < w; i += 16) c.fillRect(i, 0, 2, h); c.fillStyle = '#F59E0B'; c.fillRect(0, h * 0.06, w, h * 0.06); c.fillStyle = '#1E293B'; c.fillRect(0, h * 0.9, w, h * 0.1); }),
        pole: [1, -1].map(function (sd) { // left pole: lamp towards the road (right); right pole: mirrored
          return mkc(lw * 0.6, lw * 2.1, dpr, function (c, w, h) {
            if (sd < 0) { c.translate(w, 0); c.scale(-1, 1); }
            c.fillStyle = lg(c, w * 0.05, 0, w * 0.16, 0, ['#94A3B8', '#475569']); c.fillRect(w * 0.05, h * 0.08, w * 0.09, h * 0.92);
            c.fillStyle = '#64748B'; c.beginPath(); c.moveTo(w * 0.06, h * 0.1); c.quadraticCurveTo(w * 0.1, h * 0.05, w * 0.4, h * 0.06); c.lineTo(w * 0.72, h * 0.06); c.lineTo(w * 0.72, h * 0.08); c.lineTo(w * 0.14, h * 0.11); c.closePath(); c.fill();
            circ(c, w * 0.66, h * 0.09, w * 0.3, rg(c, w * 0.66, h * 0.09, w * 0.3, ['rgba(254,240,138,.85)', 'rgba(254,240,138,0)']));
            rr(c, w * 0.52, h * 0.065, w * 0.26, h * 0.025, 2); c.fillStyle = '#FEF9C3'; c.fill();
          });
        }),
        onc: mkc(lw * 0.8, lw * 0.5, dpr, function (c, w, h) { // oncoming car on the other carriageway: headlights + dark body
          rr(c, w * 0.05, h * 0.35, w * 0.9, h * 0.5, h * 0.12); c.fillStyle = lg(c, 0, h * 0.35, 0, h * 0.85, ['#334155', '#0F172A']); c.fill();
          poly(c, [w * 0.18, h * 0.38, w * 0.82, h * 0.38, w * 0.72, h * 0.08, w * 0.28, h * 0.08], '#1E293B'); poly(c, [w * 0.22, h * 0.36, w * 0.78, h * 0.36, w * 0.7, h * 0.12, w * 0.3, h * 0.12], 'rgba(148,163,184,.35)');
          [0.2, 0.8].forEach(function (x) { circ(c, w * x, h * 0.55, w * 0.2, rg(c, w * x, h * 0.55, w * 0.2, ['rgba(255,255,240,.95)', 'rgba(254,249,195,.35)', 'rgba(254,249,195,0)'])); circ(c, w * x, h * 0.55, w * 0.05, '#FFFFFF'); });
        }),
        hsign: mkc(lw * 3.6, lw * 2.5, dpr, function (c, w, h) { // overhead motorway sign gantry (arrows only: no text to translate)
          [0.03, 0.94].forEach(function (x) { c.fillStyle = lg(c, w * x, 0, w * (x + 0.03), 0, ['#94A3B8', '#334155']); c.fillRect(w * x, h * 0.1, w * 0.03, h * 0.9); });
          c.fillStyle = '#475569'; c.fillRect(0, h * 0.12, w, h * 0.04);
          [[0.12, 0.36], [0.52, 0.36]].forEach(function (q, i) { rr(c, w * q[0], h * 0.02, w * q[1], h * 0.26, h * 0.02); c.fillStyle = lg(c, 0, h * 0.02, 0, h * 0.28, ['#16A34A', '#15803D', '#14532D']); c.fill(); c.strokeStyle = '#F8FAFC'; c.lineWidth = Math.max(1, h * 0.01); rr(c, w * q[0] + 3, h * 0.02 + 3, w * q[1] - 6, h * 0.26 - 6, h * 0.015); c.stroke();
            c.fillStyle = '#F8FAFC'; var ax = w * (q[0] + q[1] / 2), ay = h * 0.15, s2 = h * 0.07; c.beginPath(); c.moveTo(ax, ay - s2); c.lineTo(ax + s2, ay); c.lineTo(ax + s2 * 0.4, ay); c.lineTo(ax + s2 * 0.4, ay + s2); c.lineTo(ax - s2 * 0.4, ay + s2); c.lineTo(ax - s2 * 0.4, ay); c.lineTo(ax - s2, ay); c.closePath(); if (i) { c.save(); c.translate(ax, ay); c.rotate(0.6); c.translate(-ax, -ay); c.fill(); c.restore(); } else c.fill();
            c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(w * q[0] + w * 0.04, h * 0.23, w * q[1] * 0.5, h * 0.02); });
        }),
        glow: mkc(128, 48, 1, function (c, w, h) { c.fillStyle = rg(c, w / 2, h / 2, w / 2, ['rgba(254,240,138,.32)', 'rgba(254,240,138,0)']); c.save(); c.scale(1, h / w); c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, TAU); c.fill(); c.restore(); }),
        facade: [0, 1, 2].map(function (k) { return mkc(512, 256, 1, function (c, w, h) { // lit office facades rushing past
          var cols = [['#2E1F5E', '#1A1238'], ['#1F2F5E', '#111A38'], ['#3B1F4E', '#1E1030']][k];
          c.fillStyle = lg(c, 0, 0, 0, h, cols); c.fillRect(0, 0, w, h);
          for (var b = 0; b < 4; b++) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(b * 128, 0, 3, h); }
          for (var y = 14; y < h - 30; y += 18) for (var x = 6; x < w; x += 16) { var on = Math.random() < 0.45; c.fillStyle = on ? (Math.random() < 0.8 ? 'rgba(253,230,138,.85)' : 'rgba(165,243,252,.8)') : 'rgba(15,10,35,.8)'; c.fillRect(x, y, 9, 11); }
          c.fillStyle = k === 1 ? '#22D3EE' : '#F472B6'; c.fillRect(0, h - 28, w, 4); c.fillStyle = 'rgba(253,230,138,.25)'; c.fillRect(0, h - 24, w, 24);
        }); }),
        rail: mkc(256, 40, 1, function (c, w, h) { c.fillStyle = lg(c, 0, 0, 0, h, ['#CBD5E1', '#64748B', '#334155']); c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(15,23,42,.5)'; c.fillRect(0, h * 0.45, w, h * 0.1); for (var i = 8; i < w; i += 32) { c.fillStyle = '#FBBF24'; c.fillRect(i, h * 0.2, 6, h * 0.18); c.fillStyle = '#475569'; c.fillRect(i + 12, 0, 4, h); } })
      };
    },
    ground: function (c, V, dist, SP) {
      bands(c, V, dist, 0.09, -1.5, 1.5, 'rgba(255,255,255,.025)', null);                  // asphalt texture passing by
      bands(c, V, dist, 0.11, 1.62, 2.6, 'rgba(255,255,255,.05)', null); bands(c, V, dist, 0.11, -2.6, -1.62, 'rgba(255,255,255,.05)', null);
      var S = 0.18, o = dist % S;
      for (var z = V.ZM - o; z > -0.14; z -= S) { var a = Math.max(-0.14, z), b = z + 0.08; gquad(c, V, -0.53, -0.47, a, b, 'rgba(255,255,255,.75)'); gquad(c, V, 0.47, 0.53, a, b, 'rgba(255,255,255,.75)'); }
      // pools of light under the street lamps
      var S2 = 0.42, o2 = dist % S2;
      for (z = V.ZM - o2; z > -0.14; z -= S2) [-1.25, 1.25].forEach(function (lx) { var p = V.P(z), w = V.lw * 1.4 * p; c.drawImage(SP.glow, V.SX(lx, z) - w / 2, V.SY(z) - w * 0.19, w, w * 0.38); });
    },
    side: function (c, V, dist, SP, t) {
      // concrete barriers with reflectors (one long wall each side), then the lamp posts
      wallImg(c, V, SP.rail, -1.66, -0.14 - (dist % 0.5), V.ZM + 0.5, 0, 0.16, 10); wallImg(c, V, SP.rail, 1.66, -0.14 - (dist % 0.5), V.ZM + 0.5, 0, 0.16, 10);
      var S0 = 0.8, o0 = dist % S0, k0 = Math.floor(dist / S0), z, i;
      for (z = V.ZM + S0 - o0, i = 0; z > -0.94; z -= S0, i++) { wallImg(c, V, SP.facade[(k0 + i) % 3], -3.0, z - S0 + 0.06, z, 0, 3.4, 10); wallImg(c, V, SP.facade[(k0 + i + 1) % 3], 3.0, z - S0 + 0.06, z, 0, 3.4, 10); }
      // the other carriageway: oncoming headlights rushing past on the left
      for (i = 0; i < 4; i++) { var zz = V.ZM - ((dist + t * 1.5 + i * 0.57) % (V.ZM + 0.3)); if (zz > -0.12) stand(c, V, SP.onc, -2.3 - (i % 2) * 0.45, zz, 0.8, 0.5); }
      var S = 0.42, o = dist % S;
      for (z = V.ZM - o; z > -0.14; z -= S) { stand(c, V, SP.pole[0], -1.85, z, 0.6, 2.1); stand(c, V, SP.pole[1], 1.85, z, 0.6, 2.1); }
      var S5 = 2.6, o5 = (dist + 1.0) % S5;
      for (z = V.ZM + 0.6 - o5; z > -0.14; z -= S5) if (z < V.ZM) stand(c, V, SP.hsign, 0, z, 3.6, 2.5);
    },
    ob: function (c, V, o, SP) {
      if (o.k === 9) {
        var zn = Math.max(o.z, -0.02), zf = o.z + o.len;
        if (o.ln < -0.1) wallImg(c, V, SP.tside, o.ln + 0.43, zn, zf, 0.14, 1.0, 4); else if (o.ln > 0.1) wallImg(c, V, SP.tside, o.ln - 0.43, zn, zf, 0.14, 1.0, 4);
        box(c, V, o.ln, o.z, o.z + o.len, 0.43, 1.0, SP.truck, 'rgba(0,0,0,0)', '#CBD5E1'); return;
      }
      stand(c, V, SP.cars[o.k], o.ln, o.z, 0.8, o.k === 1 ? 0.65 : 0.58);
    },
    hero: function (c, V, x, y, s, SP) {
      var w = V.lw * 0.86, h = V.lw * 0.6, bump = s.dead ? 0 : Math.sin(s.ph * TAU * 2) * V.lw * 0.006;
      c.save(); c.translate(x, y + bump); c.rotate(s.dead ? Math.sin(s.t * 20) * 0.1 : s.lean * 0.45);
      c.drawImage(SP.me, -w / 2, -h, w, h);
      if (!s.dead) { // exhaust flames + a short light trail on the road
        var fl = 0.6 + 0.4 * Math.sin(s.t * 47), fl2 = 0.6 + 0.4 * Math.sin(s.t * 39 + 1);
        [[-0.24, fl], [0.22, fl2]].forEach(function (q) { var fx = w * q[0] + w * 0.03, fy = -h * 0.2; c.fillStyle = 'rgba(96,165,250,.55)'; c.beginPath(); c.ellipse(fx, fy + w * 0.06 * q[1], w * 0.03, w * 0.07 * q[1], 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(224,242,254,.9)'; c.beginPath(); c.ellipse(fx, fy + w * 0.03, w * 0.015, w * 0.03 * q[1], 0, 0, TAU); c.fill(); });
        c.fillStyle = 'rgba(244,63,94,.18)'; c.fillRect(-w * 0.42, -h * 0.02, w * 0.2, h * 0.08); c.fillRect(w * 0.22, -h * 0.02, w * 0.2, h * 0.08);
      }
      c.restore();
    },
    feet: function (V, x, y) { return [[x - V.lw * 0.3, y], [x + V.lw * 0.3, y]]; },
    vanish: false,
    boom: function () { return { z: 0.62, v: 0.25, fall: 0 }; }, // a meteor lands on the road, the crater fills the 3 lanes
    endStep: function (e, dt) { e.fall = Math.min(1, e.fall + dt / 0.35); },
    endDraw: function (c, V, e, SP, t) {
      var z = Math.max(e.z, -0.1), p = V.P(z);
      if (e.fall < 1) { var k = e.fall, mx = V.W * (0.9 - 0.4 * k), my = V.SY(z) - (1 - k) * V.H * 0.8; meteor(c, mx, my, V.lw * 0.25 * (0.6 + k), Math.atan2(V.H * 0.8, V.W * 0.4)); return; }
      var x0 = V.SX(-1.6, z), x1 = V.SX(1.6, z), y = V.SY(z), hh = V.lw * 0.9 * p;
      c.fillStyle = '#0B0520'; c.beginPath(); c.ellipse((x0 + x1) / 2, y, (x1 - x0) / 2, hh * 0.22, 0, 0, TAU); c.fill();
      for (var i = 0; i < 9; i++) { var fx = x0 + (x1 - x0) * (i + 0.5) / 9, fh = hh * (0.55 + 0.45 * Math.sin(t * 14 + i * 1.7)); var fg = c.createLinearGradient(0, y - fh, 0, y); fg.addColorStop(0, 'rgba(253,230,138,0)'); fg.addColorStop(0.4, 'rgba(251,146,60,.9)'); fg.addColorStop(1, 'rgba(244,63,94,.95)'); c.fillStyle = fg; c.beginPath(); c.moveTo(fx - (x1 - x0) / 14, y); c.quadraticCurveTo(fx, y - fh * 1.2, fx + (x1 - x0) / 14, y); c.fill(); }
    }
  };

  /* ================================================================== 2. JUNGLE DASH — explorer on the stone path of a lost temple */
  var EXPLORER = {
    skin: '#D9A066', hair: '#5B3A1E', style: 'short', top: ['#EAD7A4', '#B58F52'], sleeve: 'short', bottom: ['#7A5C3A', '#4F3A22'], legs: 'pants', shoe: '#4A2E1A', sole: '#C49A6C', bag: ['#B45309', '#7C2D12'],
    hat: function (c, x, y, r, v) { // fedora
      c.fillStyle = '#7C4A1E'; c.beginPath(); c.ellipse(x, y - r * 0.42, r * 1.7, r * 0.42, 0, 0, TAU); c.fill();
      c.fillStyle = lg(c, x - r, 0, x + r, 0, ['#B07A3E', '#8A5A28']); rr(c, x - r * 0.9, y - r * 1.35, r * 1.8, r * 1.0, r * 0.45); c.fill();
      c.fillStyle = '#3B2210'; c.fillRect(x - r * 0.9, y - r * 0.62, r * 1.8, r * 0.2);
    }
  };
  var JUNGLE = {
    v0: 0.88, dv: 0.6, streak: 'rgba(254,249,195,', dust: 'rgba(214,190,140,',
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
      var W = V.W, H = V.H, hy = V.hy, ny = V.ny, i;
      // golden-hour sky, sun behind the temple, god rays
      c.fillStyle = lg(c, 0, 0, 0, hy, ['#0E2A3A', '#1F5A5A', '#C27C3A', '#F6C27A']); c.fillRect(0, 0, W, hy + 2);
      var sx = W / 2, sy = hy - Math.min(W, H) * 0.12, sr = Math.min(W, H) * 0.1;
      circ(c, sx, sy, sr * 3.5, rg(c, sx, sy, sr * 3.5, ['rgba(255,237,180,.55)', 'rgba(255,237,180,0)']));
      if (!V.lite) for (i = 0; i < 9; i++) { var a = -Math.PI / 2 + (i - 4) * 0.2; c.fillStyle = 'rgba(255,240,200,' + (0.05 + (i % 2) * 0.03) + ')'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a - 0.05) * H, sy + Math.sin(a - 0.05) * H); c.lineTo(sx + Math.cos(a + 0.05) * H, sy + Math.sin(a + 0.05) * H); c.closePath(); c.fill(); }
      circ(c, sx, sy, sr, rg(c, sx, sy, sr, ['#FFFBEB', '#FDE68A', '#F59E0B']));
      // far jungle canopy: 3 layers of tree crowns, mist between them (aerial perspective)
      [['#3E7A6A', 0.16, 0.05, 11], ['#24584A', 0.11, 0.04, 17], ['#123A2C', 0.065, 0.03, 23]].forEach(function (L, li) {
        var R0 = srand(li * 7 + 3), x = -10;
        c.fillStyle = L[0]; c.beginPath(); c.moveTo(0, hy + 2);
        while (x < W + 20) { var cr = H * L[2] * (0.6 + R0() * 0.9), cy = hy - H * L[1] * (0.5 + R0() * 0.6); c.lineTo(x, cy + cr); c.arc(x + cr, cy + cr * 0.2, cr, PI, 0); x += cr * (1.2 + R0() * 0.6); }
        c.lineTo(W + 20, hy + 2); c.closePath(); c.fill();
        if (li === 0) { c.fillStyle = 'rgba(255,214,150,.18)'; c.fillRect(0, hy - H * 0.2, W, H * 0.2); }
        var mg = c.createLinearGradient(0, hy - H * L[1] * 0.4, 0, hy + 2); mg.addColorStop(0, 'rgba(220,200,160,0)'); mg.addColorStop(1, 'rgba(220,200,160,' + (0.32 - li * 0.08) + ')'); c.fillStyle = mg; c.fillRect(0, hy - H * L[1] * 0.4, W, H * L[1] * 0.4 + 2);
      });
      // two giant emergent trees far away (silhouettes)
      [[0.14, 0.3], [0.86, 0.26]].forEach(function (q) { var tx2 = W * q[0], tt = hy - H * q[1]; c.fillStyle = '#1C4A3A'; c.fillRect(tx2 - 2, tt, 4, hy - tt); var R1 = srand(q[0] * 100); for (var k = 0; k < 7; k++) circ(c, tx2 + (R1() - 0.5) * H * 0.09, tt + (R1() - 0.3) * H * 0.03, H * (0.022 + R1() * 0.02), k % 2 ? '#1C4A3A' : '#22574A'); });
      // the temple: stepped pyramid with stairs, a glowing doorway, vines
      var tw = Math.min(W * 0.42, V.lw * 2.9), th = tw * 0.5, tx = W / 2;
      for (var s = 0; s < 6; s++) {
        var sw = tw * (1 - s * 0.14), sh = th / 6, y0 = hy - sh * (s + 1);
        c.fillStyle = lg(c, tx - sw / 2, 0, tx + sw / 2, 0, ['#5E6B4E', '#46523A', '#2C3626']); c.fillRect(tx - sw / 2, y0, sw, sh + 1);
        c.fillStyle = 'rgba(255,230,170,.18)'; c.fillRect(tx - sw / 2, y0, sw, Math.max(1, sh * 0.15));
        c.fillStyle = 'rgba(0,0,0,.2)'; for (var b = 1; b < 8; b++) c.fillRect(tx - sw / 2 + sw * b / 8, y0 + sh * 0.2, 1, sh * 0.8);
      }
      poly(c, [tx - tw * 0.07, hy, tx + tw * 0.07, hy, tx + tw * 0.04, hy - th, tx - tw * 0.04, hy - th], '#6B775A');
      for (s = 0; s < 12; s++) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(tx - tw * (0.07 - s * 0.0025), hy - th * s / 12, tw * (0.14 - s * 0.005), 1); }
      c.fillStyle = '#1F2A1A'; c.fillRect(tx - tw * 0.09, hy - th - th * 0.24, tw * 0.18, th * 0.26);
      circ(c, tx, hy - th - th * 0.1, tw * 0.06, rg(c, tx, hy - th - th * 0.1, tw * 0.06, ['rgba(253,230,138,.95)', 'rgba(251,191,36,0)']));
      for (i = 0; i < 6; i++) { c.strokeStyle = 'rgba(34,120,60,.8)'; c.lineWidth = 1.4; var vx = tx + tw * rnd(-0.4, 0.4), vy = hy - th * rnd(0.3, 0.9); c.beginPath(); c.moveTo(vx, vy); c.quadraticCurveTo(vx + 3, vy + th * 0.15, vx - 1, vy + th * 0.3); c.stroke(); }
      // forest floor + path base
      c.fillStyle = lg(c, 0, hy, 0, ny, ['#1E4A2E', '#0E2A18']); c.fillRect(0, hy, W, H - hy);
      poly(c, [V.SX(-1.6, V.ZF), hy, V.SX(1.6, V.ZF), hy, V.SX(1.6, -0.14), V.SY(-0.14), V.SX(-1.6, -0.14), V.SY(-0.14)], lg(c, 0, hy, 0, ny, ['#A8936A', '#8C7A55', '#6E5E40']));
      var sun = c.createRadialGradient(W / 2, hy, 0, W / 2, hy, (ny - hy) * 1.1); sun.addColorStop(0, 'rgba(255,220,150,.35)'); sun.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = sun; c.fillRect(0, hy, W, ny - hy);
      [-1.6, 1.6].forEach(function (lx) { c.strokeStyle = '#4D7C0F'; c.lineWidth = 4; c.beginPath(); c.moveTo(V.SX(lx, V.ZF), hy); c.lineTo(V.SX(lx, -0.14), V.SY(-0.14)); c.stroke(); });
      [-0.5, 0.5].forEach(function (lx) { c.strokeStyle = 'rgba(60,45,25,.45)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(V.SX(lx, V.ZF), hy); c.lineTo(V.SX(lx, -0.14), V.SY(-0.14)); c.stroke(); });
    },
    art: function (V, dpr) {
      var lw = V.lw, sp = rigSet(V, dpr, EXPLORER);
      sp.rock = mkc(lw * 0.9, lw * 0.8, dpr, function (c, w, h) {
        c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(w / 2, h * 0.94, w * 0.5, h * 0.08, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(w * 0.04, h * 0.94); c.quadraticCurveTo(w * 0.0, h * 0.4, w * 0.3, h * 0.14); c.quadraticCurveTo(w * 0.55, h * 0.0, w * 0.8, h * 0.2); c.quadraticCurveTo(w * 1.0, h * 0.5, w * 0.96, h * 0.94); c.closePath();
        c.fillStyle = rg(c, w * 0.42, h * 0.45, w * 0.65, ['#E7E5E4', '#A8A29E', '#57534E', '#1C1917'], -w * 0.15, -h * 0.25); c.fill();
        c.save(); c.clip();
        c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(w * 0.75, h * 0.6, w * 0.3, h * 0.45, 0, 0, TAU); c.fill();
        c.fillStyle = lg(c, 0, 0, 0, h * 0.4, ['#4ADE80', '#15803D']); c.beginPath(); c.moveTo(0, h * 0.35); c.quadraticCurveTo(w * 0.3, h * 0.05, w * 0.6, h * 0.08); c.quadraticCurveTo(w * 0.85, h * 0.12, w, h * 0.35); c.quadraticCurveTo(w * 0.7, h * 0.24, w * 0.5, h * 0.3); c.quadraticCurveTo(w * 0.25, h * 0.36, 0, h * 0.45); c.fill();
        c.restore();
        c.strokeStyle = 'rgba(28,25,23,.55)'; c.lineWidth = Math.max(1, w * 0.015); c.beginPath(); c.moveTo(w * 0.5, h * 0.35); c.lineTo(w * 0.58, h * 0.55); c.lineTo(w * 0.5, h * 0.8); c.moveTo(w * 0.58, h * 0.55); c.lineTo(w * 0.72, h * 0.62); c.stroke();
      });
      sp.idol = mkc(lw * 0.8, lw * 1.3, dpr, function (c, w, h) { // carved stone totem with glowing eyes
        c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(w / 2, h * 0.96, w * 0.5, h * 0.04, 0, 0, TAU); c.fill();
        rr(c, w * 0.08, h * 0.86, w * 0.84, h * 0.1, 3); c.fillStyle = '#57534E'; c.fill();
        rr(c, w * 0.14, h * 0.08, w * 0.72, h * 0.8, w * 0.12); c.fillStyle = lg(c, 0, 0, w, 0, ['#C8BFA8', '#8F8672', '#4A4438']); c.fill();
        c.fillStyle = lg(c, 0, 0, w, 0, ['#B5AA92', '#6F6656']); rr(c, w * 0.04, h * 0.04, w * 0.92, h * 0.12, w * 0.05); c.fill();
        c.fillStyle = '#2B2620'; rr(c, w * 0.24, h * 0.24, w * 0.2, h * 0.09, 3); c.fill(); rr(c, w * 0.56, h * 0.24, w * 0.2, h * 0.09, 3); c.fill();
        circ(c, w * 0.34, h * 0.285, w * 0.16, rg(c, w * 0.34, h * 0.285, w * 0.16, ['rgba(110,231,183,.6)', 'rgba(110,231,183,0)'])); circ(c, w * 0.66, h * 0.285, w * 0.16, rg(c, w * 0.66, h * 0.285, w * 0.16, ['rgba(110,231,183,.6)', 'rgba(110,231,183,0)']));
        circ(c, w * 0.34, h * 0.285, w * 0.045, '#6EE7B7'); circ(c, w * 0.66, h * 0.285, w * 0.045, '#6EE7B7');
        c.fillStyle = '#2B2620'; rr(c, w * 0.3, h * 0.44, w * 0.4, h * 0.08, 3); c.fill(); c.fillStyle = '#E7E5E4'; for (var i = 0; i < 5; i++) c.fillRect(w * (0.32 + i * 0.075), h * 0.445, w * 0.04, h * 0.03);
        c.strokeStyle = 'rgba(43,38,32,.5)'; c.lineWidth = 2; c.strokeRect(w * 0.22, h * 0.6, w * 0.56, h * 0.2); c.beginPath(); c.moveTo(w * 0.5, h * 0.6); c.lineTo(w * 0.5, h * 0.8); c.stroke();
        c.fillStyle = 'rgba(74,222,128,.8)'; c.beginPath(); c.ellipse(w * 0.3, h * 0.08, w * 0.25, h * 0.03, 0, 0, TAU); c.fill(); vine(c, w * 0.8, h * 0.1, h * 0.45, -w * 0.08, '#15803D', '#4ADE80');
      });
      sp.log = [1, 3.15].map(function (wl) {
        return mkc(lw * wl, lw * 0.38, dpr, function (c, w, h) {
          c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(w / 2, h * 0.92, w * 0.5, h * 0.12, 0, 0, TAU); c.fill();
          rr(c, h * 0.3, h * 0.08, w - h * 0.6, h * 0.8, h * 0.4); c.fillStyle = lg(c, 0, h * 0.08, 0, h * 0.88, ['#C2843E', '#8A5524', '#4A2A10']); c.fill();
          c.save(); c.clip(); c.strokeStyle = 'rgba(50,25,8,.45)'; c.lineWidth = Math.max(1, h * 0.04);
          for (var i = 0; i < wl * 7; i++) { var x = (i + 0.3) * w / (wl * 7); c.beginPath(); c.moveTo(x, h * 0.1); c.quadraticCurveTo(x + h * 0.1, h * 0.5, x - h * 0.05, h * 0.9); c.stroke(); }
          c.fillStyle = 'rgba(253,230,138,.3)'; c.fillRect(0, h * 0.2, w, h * 0.08); c.restore();
          [h * 0.42, w - h * 0.42].forEach(function (x) { c.fillStyle = '#E3B574'; c.beginPath(); c.ellipse(x, h * 0.48, h * 0.24, h * 0.4, 0, 0, TAU); c.fill(); c.strokeStyle = '#9A6430'; c.lineWidth = 1; for (var k = 1; k <= 3; k++) { c.beginPath(); c.ellipse(x, h * 0.48, h * 0.06 * k, h * 0.1 * k, 0, 0, TAU); c.stroke(); } });
          for (i = 0; i < wl * 3; i++) { var mx = w * (0.15 + 0.7 * (i + 0.5) / (wl * 3)); c.fillStyle = i % 2 ? '#4ADE80' : '#22C55E'; c.beginPath(); c.ellipse(mx, h * 0.12, h * 0.16, h * 0.07, (i % 3 - 1) * 0.4, 0, TAU); c.fill(); }
        });
      });
      sp.branch = [1.05, 3.3].map(function (wl) { // a thick branch at head height between two trunks, vines hanging: slide under
        return mkc(lw * wl, lw * 1.3, dpr, function (c, w, h) {
          var bt = h * 0.16, bb = h * 0.4;
          [0, w * 0.92].forEach(function (x) { c.fillStyle = lg(c, x, 0, x + w * 0.08, 0, ['#5B3A1E', '#3F2A1A', '#24160C']); c.fillRect(x, bt, w * 0.08, h - bt); });
          rr(c, 0, bt, w, bb - bt, (bb - bt) / 2); c.fillStyle = lg(c, 0, bt, 0, bb, ['#B07A3E', '#7A4A1E', '#3F2A1A']); c.fill();
          c.strokeStyle = 'rgba(40,20,8,.4)'; c.lineWidth = 1.2; for (var i = 0; i < wl * 6; i++) { var x = w * (i + 0.5) / (wl * 6); c.beginPath(); c.moveTo(x, bt + 3); c.lineTo(x + 6, bb - 3); c.stroke(); }
          for (i = 0; i < wl * 4; i++) vine(c, w * (0.08 + 0.84 * (i + 0.5) / (wl * 4)), bb - 2, h * (0.1 + 0.1 * ((i * 7) % 3) / 2), (i % 2 ? 3 : -3), '#166534', '#4ADE80');
          for (i = 0; i < wl * 6; i++) { var lx = w * (i + 0.5) / (wl * 6); c.fillStyle = i % 2 ? '#22C55E' : '#15803D'; c.beginPath(); c.ellipse(lx, bt + 1, h * 0.06, h * 0.026, i % 2 ? 0.4 : -0.4, 0, TAU); c.fill(); }
        });
      });
      sp.tree = [11, 23].map(function (seed) { // big jungle tree: buttress roots, bark, a liana, a canopy of real leaves, hanging vines
        return mkc(lw * 1.6, lw * 3.4, dpr, function (c, w, h) {
          var r = srand(seed);
          c.beginPath(); c.moveTo(w * 0.44, h * 0.22); c.quadraticCurveTo(w * 0.42, h * 0.6, w * 0.38, h * 0.86); c.quadraticCurveTo(w * 0.22, h * 0.95, w * 0.1, h); c.lineTo(w * 0.9, h); c.quadraticCurveTo(w * 0.76, h * 0.95, w * 0.62, h * 0.86); c.quadraticCurveTo(w * 0.58, h * 0.6, w * 0.56, h * 0.22); c.closePath();
          c.fillStyle = lg(c, w * 0.36, 0, w * 0.64, 0, ['#8A6A48', '#5E432B', '#3A2716', '#21160C']); c.fill();
          c.save(); c.clip(); c.strokeStyle = 'rgba(20,12,4,.45)'; c.lineWidth = Math.max(1, w * 0.008);
          for (var i = 0; i < 9; i++) { var bx = w * (0.36 + i * 0.03); c.beginPath(); c.moveTo(bx, h * 0.2); c.bezierCurveTo(bx + w * 0.02, h * 0.45, bx - w * 0.02, h * 0.7, bx + (i - 4) * w * 0.03, h); c.stroke(); }
          c.fillStyle = 'rgba(74,140,60,.45)'; for (i = 0; i < 6; i++) { c.beginPath(); c.ellipse(w * (0.4 + r() * 0.12), h * (0.3 + r() * 0.6), w * 0.04, h * 0.03, 0, 0, TAU); c.fill(); }
          c.restore();
          c.strokeStyle = '#3F5E1E'; c.lineWidth = Math.max(1.5, w * 0.018); c.beginPath(); for (i = 0; i <= 20; i++) { var ty = h * (0.25 + i * 0.035), tx = w * 0.5 + Math.sin(i * 0.9) * w * 0.07; if (i) c.lineTo(tx, ty); else c.moveTo(tx, ty); } c.stroke();
          // canopy: clusters from the back (dark) to the front (sun lit, upper left)
          var C = [[0.5, 0.17, 0.36], [0.2, 0.22, 0.26], [0.8, 0.2, 0.28], [0.34, 0.08, 0.27], [0.68, 0.09, 0.26], [0.5, 0.25, 0.25]];
          C.forEach(function (q, qi) { leafBall(c, w * q[0], h * q[1] + w * 0.12, w * q[2], 34, qi < 3 ? JPAL.slice(0, 4) : JPAL.slice(1), r); });
          C.slice(3).forEach(function (q) { leafBall(c, w * (q[0] - 0.06), h * q[1] + w * 0.06, w * q[2] * 0.6, 12, JPAL.slice(4), r); });
          for (i = 0; i < 5; i++) vine(c, w * (0.18 + i * 0.16), h * (0.24 + r() * 0.06), h * (0.18 + r() * 0.25), (r() - 0.5) * 14, '#1E5C2A', '#3FAE5A');
        });
      });
      sp.tree.push(mkc(lw * 1.6, lw * 3.4, dpr, function (c, w, h) { // a palm: ringed curved trunk, fronds, coconuts
        var x0 = w * 0.5, y0 = h, x1 = w * 0.42, y1 = h * 0.2, i;
        for (i = 0; i < 26; i++) { var t = i / 26, x = x0 + (x1 - x0) * t + Math.sin(t * 3) * w * 0.05, y = y0 + (y1 - y0) * t, r0 = w * (0.075 - t * 0.03);
          c.fillStyle = lg(c, x - r0, 0, x + r0, 0, i % 2 ? ['#A08060', '#6E5236', '#3E2C1A'] : ['#927254', '#634A30', '#352614']); rr(c, x - r0, y - h * 0.034, r0 * 2, h * 0.036, r0 * 0.5); c.fill(); }
        circ(c, x1 - w * 0.03, y1 + h * 0.02, w * 0.045, rg(c, x1 - w * 0.03, y1 + h * 0.02, w * 0.045, ['#A16207', '#422006'])); circ(c, x1 + w * 0.04, y1 + h * 0.03, w * 0.042, rg(c, x1 + w * 0.04, y1 + h * 0.03, w * 0.042, ['#854D0E', '#3B1D06']));
        [[-2.7, 0.5], [-2.2, 0.7], [-1.6, 0.5], [-1.1, 0.4], [-0.5, 0.7], [-0.1, 0.9], [-3.0, 1.0], [-1.9, 0.2], [-1.3, -0.2]].forEach(function (q, k) { palmFrond(c, x1, y1, w * (0.5 + (k % 3) * 0.06), q[0], q[1], k % 2 ? '#22A04B' : '#15803D', k % 2 ? '#126B31' : '#0B4A22'); });
      }));
      sp.tuft = mkc(lw * 0.5, lw * 0.3, dpr, function (c, w, h) { var r = srand(4); for (var i = 0; i < 14; i++) leaf(c, w * (0.15 + r() * 0.7), h, h * (0.5 + r() * 0.5), h * 0.06, -PI / 2 + (r() - 0.5) * 1.3, i % 2 ? '#3FAE5A' : '#1F7A3A', '#145A28'); });
      sp.fern = mkc(lw * 1.1, lw * 0.9, dpr, function (c, w, h) {
        [[-2.6, 0.5, '#15803D', '#0B4A22'], [-0.55, 0.5, '#15803D', '#0B4A22'], [-2.2, 0.35, '#22A04B', '#126B31'], [-0.95, 0.35, '#22A04B', '#126B31'], [-1.6, 0.25, '#4ADE80', '#1F9D4B']].forEach(function (q) { palmFrond(c, w / 2, h * 0.98, w * 0.48, q[0], q[1], q[2], q[3]); });
      });
      sp.torch = mkc(lw * 0.36, lw * 1.5, dpr, function (c, w, h) { // stone pillar + brazier (flame drawn live)
        rr(c, w * 0.25, h * 0.22, w * 0.5, h * 0.78, 3); c.fillStyle = lg(c, w * 0.25, 0, w * 0.75, 0, ['#A8A08A', '#6F6754', '#3F3A2E']); c.fill();
        c.fillStyle = 'rgba(0,0,0,.25)'; for (var i = 1; i < 5; i++) c.fillRect(w * 0.25, h * (0.22 + i * 0.15), w * 0.5, 1.5);
        rr(c, w * 0.1, h * 0.17, w * 0.8, h * 0.07, 3); c.fillStyle = '#57534E'; c.fill();
        c.fillStyle = 'rgba(74,222,128,.7)'; c.fillRect(w * 0.25, h * 0.6, w * 0.5, h * 0.03);
      });
      sp.ruin = mkc(256, 96, 1, function (c, w, h) { // ruined temple wall with carvings and moss (strip-mapped along the track)
        c.fillStyle = lg(c, 0, 0, 0, h, ['#8F8770', '#6B644F', '#45402F']); c.fillRect(0, 0, w, h);
        for (var y = 0; y < h; y += 16) for (var x = ((y / 16) % 2) * 16; x < w; x += 32) { c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, y, 32, 1.5); c.fillRect(x, y, 1.5, 16); c.fillStyle = 'rgba(255,240,200,.08)'; c.fillRect(x + 2, y + 2, 28, 3); }
        for (var i = 0; i < 4; i++) { var cx = 32 + i * 64; c.strokeStyle = 'rgba(30,25,15,.55)'; c.lineWidth = 2.5; c.strokeRect(cx - 14, 30, 28, 34); c.beginPath(); c.arc(cx, 47, 7, 0, TAU); c.stroke(); c.fillStyle = 'rgba(253,230,138,.5)'; c.fillRect(cx - 2, 45, 4, 4); }
        c.fillStyle = 'rgba(34,140,70,.85)'; for (i = 0; i < 26; i++) { c.beginPath(); c.ellipse(i * 10 + 4, 4 + (i % 3) * 3, 9, 6, 0, 0, TAU); c.fill(); }
        c.strokeStyle = '#166534'; c.lineWidth = 2; for (i = 0; i < 9; i++) { var vx = i * 29 + 10; c.beginPath(); c.moveTo(vx, 4); c.quadraticCurveTo(vx + 6, 30, vx, 40 + (i % 3) * 18); c.stroke(); }
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, h - 8, w, 8);
      });
      sp.leafy = mkc(512, 192, 1, function (c, w, h) { // dense jungle wall (strip-mapped): trunks, layered leaves, light dapples
        var r = srand(5), i;
        c.fillStyle = lg(c, 0, 0, 0, h, ['#0B3D20', '#062812', '#04180A']); c.fillRect(0, h * 0.12, w, h * 0.88);
        for (i = 0; i < 7; i++) { var tx = i * 76 + 20; c.fillStyle = lg(c, tx, 0, tx + 12, 0, ['#3A2A1A', '#1A1008']); c.fillRect(tx, h * 0.2, 12, h * 0.8); }
        for (var L = 0; L < 4; L++) for (i = 0; i < 12; i++) leafBall(c, (i + L * 0.27 + r() * 0.3) * w / 11, h * (0.22 + L * 0.2) + (r() - 0.5) * h * 0.1, h * (0.2 - L * 0.02), 26, JPAL.slice(L === 3 ? 2 : L, (L === 3 ? 2 : L) + 3), r);
        for (i = 0; i < 46; i++) { var gx = r() * w, gl2 = h * (0.1 + r() * 0.12); leaf(c, gx, h, gl2, gl2 * 0.08, -PI / 2 + (r() - 0.5) * 0.9, i % 2 ? '#22A04B' : '#15803D', '#0B4A22'); }
        for (i = 0; i < 26; i++) { c.fillStyle = 'rgba(253,240,170,' + (0.08 + r() * 0.1).toFixed(2) + ')'; c.beginPath(); c.ellipse(r() * w, h * (0.15 + r() * 0.6), 4 + r() * 8, 2 + r() * 4, 0, 0, TAU); c.fill(); }
        c.fillStyle = lg(c, 0, h * 0.85, 0, h, ['rgba(0,0,0,0)', 'rgba(0,0,0,.4)']); c.fillRect(0, h * 0.85, w, h * 0.15);
      });
      // overlay: sun rays + canopy leaves and vines hanging in the top corners (pre-drawn; drawn once per frame)
      sp.corner = [1, -1].map(function (sd) {
        var cw = V.W * 0.34, ch = V.H * 0.4;
        return mkc(cw, ch, dpr, function (c, w, h) {
          if (sd < 0) { c.translate(w, 0); c.scale(-1, 1); }
          var r = srand(sd > 0 ? 3 : 9), i;
          for (i = 0; i < 5; i++) vine(c, w * (0.06 + i * 0.12), h * 0.1, h * (0.3 + r() * 0.55), (r() - 0.5) * 18, '#0E3B1E', '#2F8F48');
          leafBall(c, w * 0.12, h * 0.02, w * 0.5, 46, JPAL.slice(0, 4), r); leafBall(c, w * 0.45, -h * 0.02, w * 0.32, 28, JPAL.slice(1, 5), r);
          leafBall(c, w * 0.02, h * 0.18, w * 0.3, 22, JPAL.slice(0, 3), r);
        });
      });
      if (!V.lite) sp.rays = mkc(V.W, V.H, 1, function (c, w, h) {
        var sx = w * 0.5, sy = V.hy - Math.min(w, h) * 0.12;
        for (var i = 0; i < 6; i++) { var a = 0.55 + i * 0.32 + (i % 2) * 0.08, wd = 0.035 + (i % 3) * 0.02, g = c.createLinearGradient(sx, sy, sx + Math.cos(a) * h, sy + Math.sin(a) * h); g.addColorStop(0, 'rgba(255,236,170,.16)'); g.addColorStop(1, 'rgba(255,236,170,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a - wd) * h * 1.2, sy + Math.sin(a - wd) * h * 1.2); c.lineTo(sx + Math.cos(a + wd) * h * 1.2, sy + Math.sin(a + wd) * h * 1.2); c.closePath(); c.fill(); }
      });
      return sp;
    },
    ground: function (c, V, dist, SP) {
      // flagstones: alternating tiles per lane (staggered), worn seams, grass on both sides
      var S = 0.13, o = dist % S, n = Math.floor(dist / S), i = 0;
      for (var z = V.ZM + S - o; z > -0.14; z -= S, i++) {
        var a = Math.max(-0.14, z - S), k = (n + i) % 2;
        for (var l = -1; l <= 1; l++) { var q = (k + l + 3) % 3; if (q === 0) gquad(c, V, l - 0.5, l + 0.5, a, z, 'rgba(255,240,200,.08)'); else if (q === 1) gquad(c, V, l - 0.5, l + 0.5, a, z, 'rgba(40,28,10,.1)'); }
        gquad(c, V, -1.6, 1.6, a, a + 0.008, 'rgba(50,35,15,.35)');
        gquad(c, V, 1.6, 3.6, a, z, k ? '#174A28' : '#1D5A31'); gquad(c, V, -3.6, -1.6, a, z, k ? '#1D5A31' : '#174A28');
        if (z < 1.3) for (l = -1; l <= 1; l++) { // worn stones: cracks and moss, the same on the same tile (scrolls with it)
          var hsh = ((n + i) * 7919 + (l + 2) * 104729) % 97, zm = (a + z) / 2;
          if (hsh % 5 === 0) { c.strokeStyle = 'rgba(40,28,12,.45)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(V.SX(l - 0.3 + hsh % 3 * 0.1, a + 0.01), V.SY(a + 0.01)); c.lineTo(V.SX(l - 0.05, zm), V.SY(zm)); c.lineTo(V.SX(l + 0.2, z - 0.01), V.SY(z - 0.01)); c.stroke(); }
          if (hsh % 7 === 1) { var mp = V.P(zm); c.fillStyle = 'rgba(52,120,48,.45)'; c.beginPath(); c.ellipse(V.SX(l + (hsh % 2 ? 0.38 : -0.38), zm), V.SY(zm), V.lw * 0.16 * mp, V.lw * 0.035 * mp, 0, 0, TAU); c.fill(); }
        }
      }
      var S4 = 0.11, o4 = dist % S4;
      for (z = V.ZM * 0.6 - o4; z > -0.12; z -= S4) { stand(c, V, SP.tuft, -1.62, z, 0.5, 0.3); stand(c, V, SP.tuft, 1.62, z + 0.05, 0.5, 0.3); }
    },
    side: function (c, V, dist, SP, t) {
      // far row: big trees; near row: ruin walls (strip-mapped), torches, ferns — they pass at different speeds = depth
      var S0 = 1.2, o0 = dist % S0, z, i;
      for (z = V.ZM + S0 - o0; z > -1.3; z -= S0) { wallImg(c, V, SP.leafy, -3.2, z - S0, z, 0, 2.3, 10); wallImg(c, V, SP.leafy, 3.2, z - S0, z, 0, 2.3, 10); }
      var S = 0.4, o = dist % S, kk = Math.floor(dist / S);
      for (z = V.ZM + 0.3 - o, i = 0; z > -0.14; z -= S, i++) { var al = (kk + i) % 3, a2 = (kk + i + 1) % 3; stand(c, V, SP.tree[al], -2.5 - (al % 2) * 0.25, z, 1.6, 3.4); stand(c, V, SP.tree[a2], 2.5 + (a2 % 2) * 0.25, z + 0.2, 1.6, 3.4); }
      var S2 = 0.9, o2 = dist % S2;
      for (z = V.ZM - o2; z > -0.6; z -= S2) { wallImg(c, V, SP.ruin, -1.85, z, z + 0.42, 0, 0.75, 8); wallImg(c, V, SP.ruin, 1.85, z + 0.45, z + 0.87, 0, 0.75, 8); }
      var S3 = 0.45, o3 = (dist + 0.2) % S3;
      for (z = V.ZM - o3, i = 0; z > -0.14; z -= S3, i++) {
        var sd = (Math.floor((dist + 0.2) / S3) + i) % 2 ? 1 : -1;
        stand(c, V, SP.torch, sd * 1.75, z, 0.36, 1.5);
        if (z > -0.05) { var p = V.P(z), fx = V.SX(sd * 1.75, z), fy = V.SY(z) - 1.32 * V.lw * p, fr = V.lw * 0.12 * p, fl = 1 + 0.18 * Math.sin(t * 19 + i * 2);
          circ(c, fx, fy, fr * 3.2, 'rgba(251,146,60,.13)'); c.fillStyle = '#F97316'; c.beginPath(); c.moveTo(fx - fr, fy + fr * 0.5); c.quadraticCurveTo(fx - fr * 0.8, fy - fr * 1.5 * fl, fx, fy - fr * 2.4 * fl); c.quadraticCurveTo(fx + fr * 0.8, fy - fr * 1.5 * fl, fx + fr, fy + fr * 0.5); c.fill();
          c.fillStyle = '#FDE68A'; c.beginPath(); c.ellipse(fx, fy - fr * 0.3, fr * 0.45, fr * 0.9 * fl, 0, 0, TAU); c.fill(); }
        stand(c, V, SP.fern, -sd * 1.95, z + 0.15, 1.1, 0.9);
      }
    },
    ob: function (c, V, o, SP) {
      if (o.k === 0) stand(c, V, SP.rock, o.ln, o.z, 0.9, 0.8);
      else if (o.k === 3) stand(c, V, SP.idol, o.ln, o.z, 0.8, 1.3);
      else if (o.k === 1 || o.k === 4) stand(c, V, SP.log[o.wide ? 1 : 0], o.ln, o.z, o.wide ? 3.15 : 1, 0.38);
      else stand(c, V, SP.branch[o.wide ? 1 : 0], o.ln, o.z, o.wide ? 3.3 : 1.05, 1.3);
    },
    over: function (c, V, SP, t) {
      if (SP.rays) { c.globalAlpha = 0.75 + 0.25 * Math.sin(t * 0.7); c.drawImage(SP.rays, 0, 0, V.W, V.H); c.globalAlpha = 1; }
      var cw = V.W * 0.34, ch = V.H * 0.4, sw = Math.sin(t * 1.3) * 2;
      c.drawImage(SP.corner[0], -4 + sw, V.T - ch * 0.12, cw, ch); c.drawImage(SP.corner[1], V.W - cw + 4 - sw, V.T - ch * 0.12, cw, ch);
    },
    hero: heroRig,
    endBack: true,
    boom: function () { return { z: 1.1, v: 1.1, rot: 0 }; }, // a giant boulder rolls down the path
    endStep: function (e, dt) { e.rot += dt * 6; },
    endDraw: function (c, V, e) {
      var z = Math.max(e.z, -0.12), p = V.P(z), r = V.lw * 1.45 * p, x = V.W / 2, y = V.SY(z) - r;
      c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(x, V.SY(z), r * 1.1, r * 0.2, 0, 0, TAU); c.fill();
      circ(c, x, y, r, rg(c, x, y, r, ['#E7E5E4', '#A8A29E', '#57534E', '#1C1917'], -r * 0.35, -r * 0.4));
      c.strokeStyle = 'rgba(28,25,23,.55)'; c.lineWidth = Math.max(1.5, r * 0.05);
      for (var i = 0; i < 4; i++) { var a = e.rot + i * 1.6; c.beginPath(); c.arc(x, y, r * (0.45 + (i % 2) * 0.25), a, a + 0.9); c.stroke(); }
      c.fillStyle = 'rgba(74,222,128,.55)'; c.beginPath(); c.arc(x, y, r * 0.98, e.rot, e.rot + 0.8); c.lineTo(x, y); c.fill();
    }
  };

  /* ================================================================== 3. METRO DASH — rail tracks in the neon city */
  var KID = {
    skin: '#F2CDB0', hair: '#5B3A1E', style: 'short', top: ['#22D3EE', '#0E7490'], sleeve: 'long', bottom: ['#1E3A8A', '#172554'], legs: 'pants', shoe: '#F8FAFC', sole: '#F43F5E', stripe: '#FDE68A',
    hat: function (c, x, y, r, v) { // cap worn backwards + headphones
      c.fillStyle = lg(c, x - r, 0, x + r, 0, ['#F43F5E', '#9F1239']); c.beginPath(); c.ellipse(x, y - r * 0.3, r * 1.02, r * 0.85, 0, Math.PI, TAU); c.fill();
      if (v === 'back') { rr(c, x - r * 0.55, y - r * 0.4, r * 1.1, r * 0.4, r * 0.12); c.fillStyle = '#BE123C'; c.fill(); c.fillStyle = '#FDE68A'; c.fillRect(x - r * 0.3, y - r * 0.3, r * 0.6, r * 0.12); }
      c.strokeStyle = '#E2E8F0'; c.lineWidth = r * 0.16; c.beginPath(); c.arc(x, y, r * 1.05, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      [-1, 1].forEach(function (s) { rr(c, x + s * r * 1.02 - r * 0.2, y - r * 0.1, r * 0.4, r * 0.5, r * 0.15); c.fillStyle = '#0F172A'; c.fill(); });
    }
  };
  function graffiti(w, h, seed) { // a wall panel with original abstract graffiti (bubble shapes, tags, drips)
    return mkc(w, h, 1, function (c) {
      var S = seed; function R() { S = (S * 9301 + 49297) % 233280; return S / 233280; }
      c.fillStyle = lg(c, 0, 0, 0, h, ['#3B3F5C', '#2A2D45', '#1C1E30']); c.fillRect(0, 0, w, h);
      for (var y = 0; y < h; y += 12) for (var x = ((y / 12) % 2) * 12; x < w; x += 24) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, y, 24, 1); c.fillRect(x, y, 1, 12); }
      var cols = [['#F472B6', '#BE185D'], ['#22D3EE', '#0E7490'], ['#FDE047', '#CA8A04'], ['#A3E635', '#4D7C0F'], ['#C084FC', '#7E22CE'], ['#FB923C', '#C2410C']];
      for (var k = 0; k < 3; k++) {
        var cx = w * (0.18 + k * 0.32) + R() * 10, cy = h * (0.45 + R() * 0.15), col = cols[(seed + k * 2) % cols.length], s = h * (0.2 + R() * 0.08);
        c.fillStyle = '#0B0B14'; for (var b = 0; b < 4; b++) { c.beginPath(); c.ellipse(cx - s * 1.1 + b * s * 0.72, cy + (b % 2) * s * 0.18, s * 0.52, s * 0.72, (b - 1.5) * 0.2, 0, TAU); c.fill(); }
        c.fillStyle = lg(c, 0, cy - s, 0, cy + s, col); for (b = 0; b < 4; b++) { c.beginPath(); c.ellipse(cx - s * 1.1 + b * s * 0.72, cy + (b % 2) * s * 0.18, s * 0.42, s * 0.6, (b - 1.5) * 0.2, 0, TAU); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.55)'; for (b = 0; b < 4; b++) { c.beginPath(); c.ellipse(cx - s * 1.2 + b * s * 0.72, cy - s * 0.3, s * 0.12, s * 0.2, 0, 0, TAU); c.fill(); }
        c.fillStyle = col[1]; for (b = 0; b < 3; b++) c.fillRect(cx - s + b * s * 0.8, cy + s * 0.5, 2, s * (0.3 + R() * 0.5));
      }
      c.strokeStyle = '#F8FAFC'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * 0.06, h * 0.22); for (var i = 0; i < 8; i++) c.quadraticCurveTo(w * (0.08 + i * 0.03), h * (0.1 + (i % 2) * 0.2), w * (0.1 + i * 0.03), h * 0.2); c.stroke();
      c.fillStyle = '#0F172A'; c.fillRect(0, h * 0.86, w, h * 0.14); c.fillStyle = '#FDE047'; for (i = 0; i < w; i += 20) c.fillRect(i, h * 0.86, 10, 3);
    });
  }
  var METRO = {
    v0: 0.92, dv: 0.62, streak: 'rgba(165,243,252,', dust: 'rgba(203,213,225,',
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
      c.fillStyle = lg(c, 0, 0, 0, hy, ['#050720', '#0C1A45', '#2B2A7A', '#6D2E8A']); c.fillRect(0, 0, W, hy + 2);
      stars(c, W, hy * 0.5, V.lite ? 18 : 40);
      var mr = Math.min(W, H) * 0.06; circ(c, W * 0.82, hy * 0.35, mr * 2.2, rg(c, W * 0.82, hy * 0.35, mr * 2.2, ['rgba(191,219,254,.25)', 'rgba(191,219,254,0)'])); circ(c, W * 0.82, hy * 0.35, mr, rg(c, W * 0.82, hy * 0.35, mr, ['#F0F9FF', '#93C5FD', '#1E40AF'], -mr * 0.3, -mr * 0.3));
      [[0.1, 0.3, '#16134A', 0.2], [0.07, 0.2, '#0A0B2A', 0.32]].forEach(function (L, li) {
        var x = -10;
        while (x < W) {
          var bw = rnd(0.06, 0.12) * W, bh = rnd(L[0], L[1]) * H;
          c.fillStyle = L[2]; c.fillRect(x, hy - bh, bw + 1, bh + 2);
          if (li && Math.random() < 0.3) { rr(c, x + bw * 0.15, hy - bh + 6, bw * 0.7, Math.max(6, bh * 0.08), 2); c.fillStyle = Math.random() < 0.5 ? '#F472B6' : '#22D3EE'; c.fill(); }
          c.fillStyle = Math.random() < 0.6 ? 'rgba(103,232,249,.8)' : 'rgba(240,171,252,.8)';
          for (var wy = hy - bh + 5; wy < hy - 4; wy += 6) for (var wx = x + 3; wx < x + bw - 3; wx += 5) if (Math.random() < L[3]) c.fillRect(wx, wy, 1.8, 2.4);
          x += bw + rnd(0, 4);
        }
      });
      var hz = c.createLinearGradient(0, hy - 24, 0, hy + 8); hz.addColorStop(0, 'rgba(34,211,238,0)'); hz.addColorStop(0.7, 'rgba(34,211,238,.3)'); hz.addColorStop(1, 'rgba(34,211,238,0)'); c.fillStyle = hz; c.fillRect(0, hy - 24, W, 32);
      c.fillStyle = lg(c, 0, hy, 0, ny, ['#1A1834', '#121027']); c.fillRect(0, hy, W, H - hy);
      // the city on both sides of the line: blocks in perspective with lit windows and neon roofs (far → near)
      var blk = [], R2 = srand(77);
      for (var b = 0; b < (V.lite ? 40 : 90); b++) blk.push({ z: 1.1 + Math.pow(R2(), 0.8) * 8, x: (R2() < 0.5 ? -1 : 1) * (2.6 + R2() * 8), w: 0.9 + R2() * 1.6, h: 1.5 + R2() * 5, n: R2() });
      blk.sort(function (p1, p2) { return p2.z - p1.z; });
      blk.forEach(function (q) {
        var p = V.P(q.z), x0 = V.SX(q.x - q.w / 2, q.z), x1 = V.SX(q.x + q.w / 2, q.z), y1 = V.SY(q.z), y0 = y1 - q.h * V.lw * p, bw = x1 - x0;
        c.fillStyle = q.n < 0.5 ? '#151338' : '#1D1A48'; c.fillRect(x0, y0, bw, y1 - y0);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(q.x < 0 ? x1 - bw * 0.25 : x0, y0, bw * 0.25, y1 - y0);
        var ws = Math.max(1.2, 5 * p), wc = q.n < 0.33 ? 'rgba(103,232,249,.75)' : q.n < 0.66 ? 'rgba(240,171,252,.7)' : 'rgba(253,230,138,.75)';
        c.fillStyle = wc; for (var wy = y0 + ws; wy < y1 - ws; wy += ws * 2) for (var wx = x0 + ws * 0.6; wx < x1 - ws; wx += ws * 1.7) if (R2() < 0.4) c.fillRect(wx, wy, ws * 0.8, ws);
        if (q.n > 0.8) { c.fillStyle = q.n > 0.9 ? '#F472B6' : '#22D3EE'; c.fillRect(x0, y0, bw, Math.max(1, 2.5 * p)); }
      });
      // gravel bed under each track (speckled once)
      [-1, 0, 1].forEach(function (l) { poly(c, [V.SX(l - 0.48, V.ZF), hy, V.SX(l + 0.48, V.ZF), hy, V.SX(l + 0.48, -0.14), V.SY(-0.14), V.SX(l - 0.48, -0.14), V.SY(-0.14)], lg(c, 0, hy, 0, ny, ['#3A3658', '#4A4466', '#3A3456'])); });
      for (var i = 0; i < (V.lite ? 300 : 900); i++) { var gz = Math.pow(Math.random(), 1.6) * 2, gx = rnd(-1.5, 1.5), p = V.P(gz); c.fillStyle = i % 3 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.12)'; c.fillRect(V.SX(gx, gz), V.SY(gz), 1.6 * p + 0.6, 1.2 * p + 0.5); }
    },
    art: function (V, dpr) {
      var lw = V.lw, sp = rigSet(V, dpr, KID);
      sp.train = mkc(lw * 0.84, lw * 1.25, dpr, function (c, w, h) { // the front of a metro car
        rr(c, 0, h * 0.03, w, h * 0.93, w * 0.18); c.fillStyle = lg(c, 0, 0, w, 0, ['#CBD5E1', '#F8FAFC', '#94A3B8']); c.fill();
        c.fillStyle = lg(c, 0, h * 0.5, 0, h, ['rgba(0,0,0,0)', 'rgba(0,0,0,.25)']); rr(c, 0, h * 0.03, w, h * 0.93, w * 0.18); c.fill();
        rr(c, w * 0.08, h * 0.12, w * 0.84, h * 0.34, w * 0.1); c.fillStyle = lg(c, 0, h * 0.12, 0, h * 0.46, ['#1E40AF', '#0B1229', '#020617']); c.fill();
        poly(c, [w * 0.14, h * 0.42, w * 0.3, h * 0.42, w * 0.5, h * 0.15, w * 0.36, h * 0.15], 'rgba(255,255,255,.18)');
        rr(c, w * 0.26, h * 0.05, w * 0.48, h * 0.06, 3); c.fillStyle = '#020617'; c.fill(); c.fillStyle = '#FB923C'; for (var i = 0; i < 9; i++) c.fillRect(w * (0.29 + i * 0.048), h * 0.07, w * 0.03, h * 0.025);
        c.fillStyle = lg(c, 0, h * 0.54, 0, h * 0.62, ['#2563EB', '#1E3A8A']); c.fillRect(0, h * 0.54, w, h * 0.08); c.fillStyle = '#FDE047'; c.fillRect(0, h * 0.62, w, h * 0.015);
        [0.2, 0.8].forEach(function (x) { circ(c, w * x, h * 0.73, w * 0.13, 'rgba(254,249,195,.28)'); circ(c, w * x, h * 0.73, w * 0.065, '#FEF9C3'); circ(c, w * x, h * 0.73, w * 0.035, '#fff'); });
        rr(c, w * 0.38, h * 0.68, w * 0.24, h * 0.12, 3); c.fillStyle = '#334155'; c.fill(); c.strokeStyle = '#64748B'; c.lineWidth = 1; for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(w * 0.4, h * (0.7 + i * 0.025)); c.lineTo(w * 0.6, h * (0.7 + i * 0.025)); c.stroke(); }
        c.fillStyle = '#0F172A'; c.fillRect(w * 0.05, h * 0.86, w * 0.9, h * 0.08); c.fillStyle = '#F59E0B'; for (i = 0; i < 6; i++) c.fillRect(w * (0.08 + i * 0.15), h * 0.875, w * 0.07, h * 0.05);
      });
      sp.tside = mkc(512, 96, 1, function (c, w, h) { // side of a metro car: windows, doors, blue band
        c.fillStyle = lg(c, 0, 0, 0, h, ['#E2E8F0', '#CBD5E1', '#64748B']); c.fillRect(0, 0, w, h);
        for (var x = 8; x < w; x += 64) { rr(c, x, h * 0.14, 40, h * 0.32, 5); c.fillStyle = lg(c, 0, h * 0.14, 0, h * 0.46, ['#1E3A8A', '#0B1229']); c.fill(); c.fillStyle = 'rgba(253,230,138,.35)'; c.fillRect(x + 4, h * 0.36, 32, 3); c.fillStyle = 'rgba(15,23,42,.35)'; c.fillRect(x + 48, h * 0.1, 2, h * 0.75); }
        c.fillStyle = '#2563EB'; c.fillRect(0, h * 0.55, w, h * 0.09); c.fillStyle = '#FDE047'; c.fillRect(0, h * 0.64, w, 2);
        c.fillStyle = '#0F172A'; c.fillRect(0, h * 0.9, w, h * 0.1);
      });
      sp.barrier = [1, 3.1].map(function (wl) {
        return mkc(lw * 0.92 * wl, lw * 0.46, dpr, function (c, w, h) {
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(w / 2, h * 0.95, w * 0.5, h * 0.06, 0, 0, TAU); c.fill();
          [0.06, 0.9].forEach(function (x) { c.fillStyle = lg(c, w * x, 0, w * x + 6, 0, ['#CBD5E1', '#64748B']); c.fillRect(w * x, h * 0.3, Math.max(3, w * 0.04 / wl), h * 0.68); c.fillStyle = '#334155'; c.fillRect(w * x - 3, h * 0.92, Math.max(3, w * 0.04 / wl) + 6, h * 0.06); });
          rr(c, 0, h * 0.08, w, h * 0.38, h * 0.08); c.fillStyle = '#F8FAFC'; c.fill();
          c.save(); c.clip(); c.fillStyle = '#E11D48'; for (var x = -h; x < w + h; x += h * 0.7) { c.beginPath(); c.moveTo(x, h * 0.46); c.lineTo(x + h * 0.35, h * 0.46); c.lineTo(x + h * 0.7, h * 0.08); c.lineTo(x + h * 0.35, h * 0.08); c.fill(); }
          c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, h * 0.1, w, h * 0.06); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, h * 0.38, w, h * 0.08); c.restore();
          [0.06, 0.94].forEach(function (x) { circ(c, w * x, h * 0.07, h * 0.12, 'rgba(251,191,36,.3)'); circ(c, w * x, h * 0.07, h * 0.065, '#FBBF24'); });
        });
      });
      sp.sign = mkc(lw * 0.98, lw * 1.35, dpr, function (c, w, h) { // overhead sign on a gantry: slide under
        [0.02, 0.92].forEach(function (x) { c.fillStyle = lg(c, w * x, 0, w * (x + 0.06), 0, ['#94A3B8', '#475569']); c.fillRect(w * x, 0, w * 0.06, h); });
        rr(c, 0, h * 0.1, w, h * 0.32, h * 0.04); c.fillStyle = lg(c, 0, h * 0.1, 0, h * 0.42, ['#FDE68A', '#F59E0B', '#B45309']); c.fill();
        c.save(); c.clip(); c.fillStyle = '#1E1B2E'; for (var x = -h; x < w + h; x += h * 0.16) { c.beginPath(); c.moveTo(x, h * 0.42); c.lineTo(x + h * 0.08, h * 0.42); c.lineTo(x + h * 0.38, h * 0.1); c.lineTo(x + h * 0.3, h * 0.1); c.fill(); } c.restore();
        rr(c, w * 0.28, h * 0.15, w * 0.44, h * 0.22, h * 0.03); c.fillStyle = '#1E1B2E'; c.fill();
        c.fillStyle = '#FDE68A'; c.beginPath(); c.moveTo(w * 0.5, h * 0.35); c.lineTo(w * 0.4, h * 0.25); c.lineTo(w * 0.46, h * 0.25); c.lineTo(w * 0.46, h * 0.18); c.lineTo(w * 0.54, h * 0.18); c.lineTo(w * 0.54, h * 0.25); c.lineTo(w * 0.6, h * 0.25); c.fill();
        [0.12, 0.88].forEach(function (x) { circ(c, w * x, h * 0.26, h * 0.035, '#EF4444'); });
      });
      sp.walls = [graffiti(512, 128, 3), graffiti(512, 128, 11), graffiti(512, 128, 29)];
      sp.gantry = mkc(lw * 3.5, lw * 2.3, dpr, function (c, w, h) { // overhead line gantry: two lattice masts, a beam, insulators (passes overhead = speed)
        [0.02, 0.95].forEach(function (x) { c.fillStyle = lg(c, w * x, 0, w * (x + 0.03), 0, ['#94A3B8', '#334155']); c.fillRect(w * x, h * 0.05, w * 0.03, h * 0.95); c.strokeStyle = 'rgba(15,23,42,.6)'; c.lineWidth = 1; for (var y = 0.1; y < 1; y += 0.07) { c.beginPath(); c.moveTo(w * x, h * y); c.lineTo(w * (x + 0.03), h * (y + 0.035)); c.stroke(); } });
        c.fillStyle = lg(c, 0, h * 0.05, 0, h * 0.11, ['#CBD5E1', '#475569']); c.fillRect(0, h * 0.05, w, h * 0.06);
        c.strokeStyle = 'rgba(15,23,42,.5)'; c.lineWidth = 1; for (var x = 0.03; x < 0.97; x += 0.03) { c.beginPath(); c.moveTo(w * x, h * 0.05); c.lineTo(w * (x + 0.015), h * 0.11); c.stroke(); }
        [1 / 6, 0.5, 5 / 6].forEach(function (x) { c.fillStyle = '#64748B'; c.fillRect(w * x - 1, h * 0.11, 2, h * 0.07); c.fillStyle = '#A16207'; for (var k = 0; k < 3; k++) { c.beginPath(); c.ellipse(w * x, h * (0.125 + k * 0.02), w * 0.012, h * 0.006, 0, 0, TAU); c.fill(); } });
      });
      sp.lamp = mkc(lw * 0.5, lw * 0.5, dpr, function (c, w, h) { circ(c, w / 2, h / 2, w / 2, rg(c, w / 2, h / 2, w / 2, ['rgba(254,249,195,.9)', 'rgba(250,204,21,.25)', 'rgba(250,204,21,0)'])); circ(c, w / 2, h / 2, w * 0.1, '#FFFBEB'); });
      sp.signal = mkc(lw * 0.3, lw * 1.9, dpr, function (c, w, h) { c.fillStyle = '#334155'; c.fillRect(w * 0.42, h * 0.2, w * 0.16, h * 0.8); rr(c, w * 0.15, h * 0.02, w * 0.7, h * 0.22, w * 0.15); c.fillStyle = '#0F172A'; c.fill(); circ(c, w / 2, h * 0.07, w * 0.18, '#22C55E'); circ(c, w / 2, h * 0.07, w * 0.32, 'rgba(34,197,94,.3)'); circ(c, w / 2, h * 0.17, w * 0.16, '#450A0A'); });
      return sp;
    },
    ground: function (c, V, dist) {
      var S = 0.1, o = dist % S, z, l;
      for (z = V.ZM - o; z > -0.14; z -= S) for (l = -1; l <= 1; l++) { gquad(c, V, l - 0.42, l + 0.42, z, z + 0.03, '#5B4636'); gquad(c, V, l - 0.42, l + 0.42, z + 0.022, z + 0.03, '#3A2B20'); }
      for (l = -1; l <= 1; l++) for (var s = -1; s <= 1; s += 2) {
        var x0 = V.SX(l + s * 0.26, V.ZF), x1 = V.SX(l + s * 0.26, -0.14);
        c.strokeStyle = '#475569'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x0, V.SY(V.ZF)); c.lineTo(x1, V.SY(-0.14)); c.stroke();
        c.strokeStyle = '#E2E8F0'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0, V.SY(V.ZF) - 1); c.lineTo(x1, V.SY(-0.14) - 1.5); c.stroke();
      }
    },
    side: function (c, V, dist, SP) {
      // graffiti walls on both sides (3 panels that loop), a row of lamps on top, signals between the tracks and walls
      var S = 0.6, o = dist % S, k = Math.floor(dist / S), z, i;
      for (z = V.ZM + S - o, i = 0; z > -0.8; z -= S, i++) { var img = SP.walls[(k + i) % 3], img2 = SP.walls[(k + i + 1) % 3]; wallImg(c, V, img, -1.8, z - S, z, 0, 1.45, 10); wallImg(c, V, img2, 1.8, z - S, z, 0, 1.45, 10); }
      var S2 = 0.3, o2 = dist % S2;
      for (z = V.ZM - o2; z > -0.14; z -= S2) { var p = V.P(z), lw2 = V.lw * 0.5 * p; [-1.8, 1.8].forEach(function (lx) { c.drawImage(SP.lamp, V.SX(lx, z) - lw2 / 2, V.SY(z) - 1.5 * V.lw * p - lw2 / 2, lw2, lw2); }); }
      var S3 = 0.75, o3 = (dist + 0.3) % S3;
      for (z = V.ZM - o3; z > -0.14; z -= S3) { stand(c, V, SP.signal, -1.6, z, 0.3, 1.9); stand(c, V, SP.signal, 1.6, z + 0.3, 0.3, 1.9); }
      // overhead wires over each track (static lines) + gantries rushing overhead
      c.strokeStyle = 'rgba(203,213,225,.55)'; c.lineWidth = 1;
      for (var l = -1; l <= 1; l++) { c.beginPath(); c.moveTo(V.SX(l, V.ZF), V.SY(V.ZF) - 1.88 * V.lw * V.P(V.ZF)); c.lineTo(V.SX(l, -0.14), V.SY(-0.14) - 1.88 * V.lw * V.P(-0.14)); c.stroke(); }
      var S4 = 0.55, o4 = (dist + 0.1) % S4;
      for (z = V.ZM - o4; z > -0.14; z -= S4) stand(c, V, SP.gantry, 0, z, 3.5, 2.3);
    },
    ob: function (c, V, o, SP) {
      if (o.k === 0) {
        var zn = Math.max(o.z, -0.02), zf = o.z + o.len;
        if (o.ln < -0.1) wallImg(c, V, SP.tside, o.ln + 0.42, zn, zf, 0.04, 1.25, 8); else if (o.ln > 0.1) wallImg(c, V, SP.tside, o.ln - 0.42, zn, zf, 0.04, 1.25, 8);
        box(c, V, o.ln, o.z, o.z + o.len, 0.42, 1.25, SP.train, 'rgba(0,0,0,0)', lg(c, 0, V.SY(zf), 0, V.SY(zn), ['#64748B', '#94A3B8']));
        return;
      }
      if (o.k === 1 || o.k === 3) { stand(c, V, SP.barrier[o.k === 3 ? 1 : 0], o.ln, o.z, o.k === 3 ? 2.85 : 0.92, 0.46); return; }
      stand(c, V, SP.sign, o.ln, o.z, 0.98, 1.35);
    },
    hero: heroRig,
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
