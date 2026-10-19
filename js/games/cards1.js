/* v2805 — cards1: 6 new instant card games (owner request), provider-style deals in the OROLADO space look.
   - Higher Card: a 7 is shown, bet Lower (A–6) or Higher (8–K); the next card is dealt (a 7 loses both).
   - Red Dog: two cards, the spread sets the pay, a third card must fall strictly between (pair → trips ×12).
   - Casino War: Player vs Dealer, one card each, bet Player / Tie / Dealer.
   - Andar Bahar: a joker card, then cards are dealt to Andar and Bahar until one matches the joker's rank.
   - Teen Patti: a 3-card hand paid by its category.   - Video Poker: a 5-card Jacks-or-Better hand paid by its category.
   Server (casino_ext/more1.php): K.play(key, …) → view.w (winning option) or view.i (table line). The cards dealt on
   screen are always built to match exactly what the server drew (never a fake win). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', lower: 'Lower', higher: 'Higher', player: 'Player', dealer: 'Dealer', tie: 'Tie', andar: 'Andar', bahar: 'Bahar', spread: 'Spread', pair: 'Pair', consec: 'Consecutive',
      tp: ['Trail', 'Pure Sequence', 'Sequence', 'Color', 'Pair'], vp: ['Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House', 'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'Jacks or Better'] },
    fr: { bet: 'Miser', lower: 'Plus bas', higher: 'Plus haut', player: 'Joueur', dealer: 'Croupier', tie: 'Égalité', spread: 'Écart', pair: 'Paire', consec: 'Consécutives',
      tp: ['Brelan', 'Suite couleur', 'Suite', 'Couleur', 'Paire'], vp: ['Quinte flush royale', 'Quinte flush', 'Carré', 'Full', 'Couleur', 'Quinte', 'Brelan', 'Deux paires', 'Valets ou mieux'] },
    es: { bet: 'Apostar', lower: 'Menor', higher: 'Mayor', player: 'Jugador', dealer: 'Crupier', tie: 'Empate', spread: 'Diferencia', pair: 'Pareja', consec: 'Consecutivas',
      tp: ['Trío', 'Escalera de color', 'Escalera', 'Color', 'Pareja'], vp: ['Escalera real', 'Escalera de color', 'Póker', 'Full', 'Color', 'Escalera', 'Trío', 'Doble pareja', 'Jotas o más'] },
    pt: { bet: 'Apostar', lower: 'Menor', higher: 'Maior', player: 'Jogador', dealer: 'Banca', tie: 'Empate', spread: 'Diferença', pair: 'Par', consec: 'Seguidas',
      tp: ['Trinca', 'Sequência de naipe', 'Sequência', 'Cor', 'Par'], vp: ['Royal Flush', 'Straight Flush', 'Quadra', 'Full House', 'Flush', 'Sequência', 'Trinca', 'Dois pares', 'Valetes ou mais'] },
    ar: { bet: 'راهن', lower: 'أقل', higher: 'أعلى', player: 'اللاعب', dealer: 'الموزّع', tie: 'تعادل', andar: 'أندر', bahar: 'باهر', spread: 'الفارق', pair: 'زوج', consec: 'متتاليتان',
      tp: ['ثلاثية', 'تسلسل نقي', 'تسلسل', 'لون', 'زوج'], vp: ['رويال فلاش', 'ستريت فلاش', 'أربعة متشابهة', 'فول هاوس', 'فلاش', 'ستريت', 'ثلاثة متشابهة', 'زوجان', 'شباب أو أعلى'] },
    tr: { bet: 'Bahis', lower: 'Düşük', higher: 'Yüksek', player: 'Oyuncu', dealer: 'Krupiye', tie: 'Beraberlik', spread: 'Fark', pair: 'Çift', consec: 'Ardışık',
      tp: ['Üçlü', 'Renk Sırası', 'Sıra', 'Renk', 'Çift'], vp: ['Royal Flush', 'Straight Flush', 'Kare', 'Full House', 'Flush', 'Kent', 'Üçlü', 'İki Çift', 'Vale veya Üstü'] },
    vi: { bet: 'Cược', lower: 'Thấp hơn', higher: 'Cao hơn', player: 'Người chơi', dealer: 'Nhà cái', tie: 'Hòa', spread: 'Khoảng', pair: 'Đôi', consec: 'Liên tiếp',
      tp: ['Sám', 'Thùng phá sảnh', 'Sảnh', 'Thùng', 'Đôi'], vp: ['Thùng phá sảnh lớn', 'Thùng phá sảnh', 'Tứ quý', 'Cù lũ', 'Thùng', 'Sảnh', 'Sám cô', 'Thú', 'Đôi J trở lên'] },
    id: { bet: 'Pasang', lower: 'Lebih rendah', higher: 'Lebih tinggi', player: 'Pemain', dealer: 'Bandar', tie: 'Seri', spread: 'Selisih', pair: 'Pasangan', consec: 'Berurutan',
      tp: ['Trail', 'Urutan Murni', 'Urutan', 'Warna', 'Pasangan'], vp: ['Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House', 'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'Jack ke atas'] },
    ru: { bet: 'Ставка', lower: 'Ниже', higher: 'Выше', player: 'Игрок', dealer: 'Дилер', tie: 'Ничья', andar: 'Андар', bahar: 'Бахар', spread: 'Разрыв', pair: 'Пара', consec: 'Подряд',
      tp: ['Тройка', 'Чистый стрит', 'Стрит', 'Масть', 'Пара'], vp: ['Роял-флеш', 'Стрит-флеш', 'Каре', 'Фулл-хаус', 'Флеш', 'Стрит', 'Сет', 'Две пары', 'Валеты и выше'] },
    de: { bet: 'Setzen', lower: 'Tiefer', higher: 'Höher', player: 'Spieler', dealer: 'Dealer', tie: 'Gleichstand', spread: 'Abstand', pair: 'Paar', consec: 'Folgekarten',
      tp: ['Drilling', 'Farbstraße', 'Straße', 'Farbe', 'Paar'], vp: ['Royal Flush', 'Straight Flush', 'Vierling', 'Full House', 'Flush', 'Straße', 'Drilling', 'Zwei Paare', 'Buben oder besser'] },
    hi: { bet: 'दांव', lower: 'कम', higher: 'ज़्यादा', player: 'खिलाड़ी', dealer: 'डीलर', tie: 'टाई', andar: 'अंदर', bahar: 'बाहर', spread: 'अंतर', pair: 'पेयर', consec: 'लगातार',
      tp: ['ट्रेल', 'प्योर सीक्वेंस', 'सीक्वेंस', 'कलर', 'पेयर'], vp: ['रॉयल फ्लश', 'स्ट्रेट फ्लश', 'फोर ऑफ़ अ काइंड', 'फुल हाउस', 'फ्लश', 'स्ट्रेट', 'थ्री ऑफ़ अ काइंड', 'टू पेयर', 'जैक्स या बेहतर'] },
    zh: { bet: '下注', lower: '小', higher: '大', player: '玩家', dealer: '庄家', tie: '和局', andar: '安达', bahar: '巴哈', spread: '间隔', pair: '对子', consec: '连号',
      tp: ['豹子', '同花顺', '顺子', '同花', '对子'], vp: ['皇家同花顺', '同花顺', '四条', '葫芦', '同花', '顺子', '三条', '两对', 'J 或更好'] }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function pm(p) { return Math.floor(0.94 / p * 100) / 100; }
  function num(v) { return String(v).replace('.', K.dec()); }
  function xm(v) { return '×' + (Math.round(v * 100) / 100).toFixed(2).replace('.', K.dec()); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var esc = K.esc;
  var HIST = {};
  function hist(key, el, item) {
    var h = HIST[key] = HIST[key] || [];
    if (item) { h.unshift(item); if (h.length > 24) h.length = 24; }
    if (el) el.innerHTML = h.map(function (q) { return '<i class="' + q[0] + '">' + q[1] + '</i>'; }).join('');
  }
  function alive(box) { return box.isConnected; }
  function wait(box, ms) { return K.sleep(lite() ? Math.round(ms * 0.5) : ms).then(function () { if (!alive(box)) throw new Error('gone'); }); }
  function anim(el, kf, ms, ease) {
    if (!el || !el.animate) return Promise.resolve();
    var a = el.animate(kf, { duration: lite() ? Math.round(ms * 0.5) : ms, easing: ease || 'ease-in-out', fill: 'forwards' });
    return a.finished.then(function () { try { a.commitStyles(); } catch (e) { /* ignore */ } a.cancel(); }).catch(function () {});
  }

  /* ---------- cartes (dessins maison) : rang 2…14 (14 = As), couleur 0 ♠ 1 ♥ 2 ♦ 3 ♣ ---------- */
  var SU = ['M0-5C-2-2.5-5-1-5 1.3-5 2.8-3.8 3.7-2.6 3.7-1.7 3.7-1 3.2-.6 2.6L-1.4 5H1.4L.6 2.6C1 3.2 1.7 3.7 2.6 3.7 3.8 3.7 5 2.8 5 1.3 5-1 2-2.5 0-5z',
    'M0 4.6C-3 1.8-5 .2-5-2-5-3.7-3.8-5-2.4-5-1.4-5-.5-4.4 0-3.5.5-4.4 1.4-5 2.4-5 3.8-5 5-3.7 5-2 5 .2 3 1.8 0 4.6z',
    'M0-5.2L3.8 0 0 5.2-3.8 0z',
    'M0-5.2A2.3 2.3 0 0 1 2 -1.7 2.3 2.3 0 1 1 .8 2.5L1.5 5.2H-1.5L-.8 2.5A2.3 2.3 0 1 1-2-1.7 2.3 2.3 0 0 1 0-5.2z'];
  var RK = { 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  var FONT = 'font-family="Plus Jakarta Sans,system-ui,sans-serif" font-weight="900"';
  function face(c) {
    var r = c[0], s = c[1], col = s === 1 || s === 2 ? '#D61F45' : '#17132F', t = RK[r];
    var corner = '<text x="9" y="17" text-anchor="middle" font-size="' + (t === '10' ? 12 : 15) + '" letter-spacing="' + (t === '10' ? -1.2 : 0) + '" ' + FONT + '>' + t + '</text><path d="' + SU[s] + '" transform="translate(9 26) scale(.8)"/>';
    var o = '<rect x=".5" y=".5" width="59" height="83" rx="6" fill="url(#c1Fc)" stroke="#D9D2EE"/><g fill="' + col + '">' + corner + '<g transform="rotate(180 30 42)">' + corner + '</g>';
    if (r >= 11 && r <= 13) o += '<rect x="17" y="15" width="26" height="54" rx="4" fill="#F7EED3" stroke="#C9A227" stroke-width="1.2"/><path d="M22.5 30l2-6.5 3.2 3.6L30 21l2.3 6.1 3.2-3.6 2 6.5z" fill="#E0A82E" stroke="#9A6B12" stroke-width=".6"/>' +
      '<text x="30" y="54" text-anchor="middle" font-size="22" ' + FONT + '>' + t + '</text><path d="' + SU[s] + '" transform="translate(30 62) scale(.6)"/>';
    else if (r === 14) o += '<circle cx="30" cy="42" r="15" fill="none" stroke="' + col + '" stroke-opacity=".25" stroke-width="1.4"/><path d="' + SU[s] + '" transform="translate(30 42) scale(2.3)"/>';
    else o += '<path d="' + SU[s] + '" transform="translate(30 43) scale(2.4)"/>';
    return o + '</g>';
  }
  var BACK = (function () {
    var ln = ''; for (var i = -84; i < 60; i += 7) ln += 'M' + i + ' 84L' + (i + 84) + ' 0';
    return '<rect x=".5" y=".5" width="59" height="83" rx="6" fill="url(#c1Bk)" stroke="#FBBF24" stroke-opacity=".85"/><path d="' + ln + '" stroke="#C4B5FD" stroke-opacity=".18" stroke-width="1.1" clip-path="url(#c1Cl)"/>' +
      '<rect x="5" y="5" width="50" height="74" rx="4" fill="none" stroke="#FBBF24" stroke-opacity=".55"/><circle cx="30" cy="42" r="9.5" fill="url(#c1Pl)"/>' +
      '<ellipse cx="30" cy="42" rx="17" ry="4.6" fill="none" stroke="#FDE68A" stroke-width="1.5" transform="rotate(-18 30 42)"/><path d="M14 17l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1zM46 63l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z" fill="#FDE68A"/>';
  })();
  var DEFS = '<defs><linearGradient id="c1Bk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6D28D9"/><stop offset="1" stop-color="#1E1150"/></linearGradient>' +
    '<linearGradient id="c1Fc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F1ECFA"/></linearGradient>' +
    '<radialGradient id="c1Pl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#B45309"/></radialGradient>' +
    '<radialGradient id="c1Ft" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="#2D1B69"/><stop offset="1" stop-color="#2D1B69" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="c1Cl"><rect x="5" y="5" width="50" height="74" rx="4"/></clipPath></defs>';
  function slot(x, y, sc) { return '<rect class="c1-slot" x="' + x + '" y="' + y + '" width="' + 60 * sc + '" height="' + 84 * sc + '" rx="' + 6 * sc + '"/>'; }
  function deckSvg(x, y, sc) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><g transform="translate(3 3)">' + BACK + '</g><g transform="translate(1.5 1.5)">' + BACK + '</g>' + BACK + '</g>'; }
  var NS = 'http://www.w3.org/2000/svg';
  // une carte : part du sabot (from) vers (x, y), puis se retourne si on donne sa valeur
  function deal(box, layer, from, x, y, sc, c, ms) {
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'c1-c');
    g.innerHTML = '<g class="c1-f"><g class="c1-b">' + BACK + '</g></g>';
    g.style.transform = 'translate(' + from[0] + 'px,' + from[1] + 'px) scale(' + from[2] + ')';
    layer.appendChild(g);
    return anim(g, [{ transform: 'translate(' + from[0] + 'px,' + from[1] + 'px) scale(' + from[2] + ')' }, { transform: 'translate(' + x + 'px,' + y + 'px) scale(' + sc + ')' }], ms || 340, 'cubic-bezier(.2,.75,.25,1)')
      .then(function () { if (!alive(box)) throw new Error('gone'); return c ? flip(g, c) : null; }).then(function () { return g; });
  }
  function flip(g, c) {
    var f = g.querySelector('.c1-f');
    return anim(f, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], 130, 'ease-in').then(function () {
      f.innerHTML = face(c);
      return anim(f, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 150, 'ease-out');
    });
  }
  function clearCards(box, layer) {
    var old = [].slice.call(layer.querySelectorAll('.c1-c'));
    if (!old.length) return Promise.resolve();
    old.forEach(function (e) { e.classList.add('out'); });
    return wait(box, 240).then(function () { old.forEach(function (e) { e.remove(); }); });
  }
  // paquet de 52 cartes : tirage sans remise
  function Deck() { this.c = []; for (var r = 2; r <= 14; r++) for (var s = 0; s < 4; s++) this.c.push([r, s]); shuffle(this.c); }
  Deck.prototype.take = function (ok) { for (var i = 0; i < this.c.length; i++) if (!ok || ok(this.c[i])) return this.c.splice(i, 1)[0]; return null; };
  Deck.prototype.rank = function (r) { return this.take(function (c) { return c[0] === r; }); };

  // cadre commun : scène SVG (+ html en option) et terminal
  function shell(box, key, svg, above, below, opts, l) {
    box.classList.add('cg-game', 'cg-' + key, 'c1-game');
    box.innerHTML = '<div class="cg-stage c1-stage"><div class="cg-hist c1-hist"></div>' + (above || '') + '<div class="c1-scene">' + svg + '</div>' + (below || '') + '</div>' + K.stakePanel(l.bet, opts);
    K.bindStake(box);
    var u = { hist: box.querySelector('.c1-hist'), go: $('csGo'), svg: box.querySelector('.c1-svg') };
    u.layer = u.svg.querySelector('.c1-layer');
    requestAnimationFrame(function () { K.fitAll(box); });
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(function () { if (box.isConnected) K.fitAll(box); }, 30); }); } catch (e) { /* ignore */ }
    return u;
  }
  function lock(box, on) { box.classList.toggle('c1-busy', on); var g = $('csGo'); if (g) g.disabled = on; }
  function bindPick(box, st, cls) {
    var paint = function () { box.querySelectorAll('.' + cls).forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-o') === st.v); }); };
    box.querySelectorAll('.' + cls).forEach(function (b) { b.addEventListener('click', function () { if (!box.classList.contains('c1-busy')) { st.v = +b.getAttribute('data-o'); paint(); } }); });
    paint();
  }
  function opt(o, label, m, cls, icon, pre) { return '<button type="button" data-o="' + o + '" class="' + cls + (icon ? ' ic' : '') + '">' + (icon || '') + '<b class="fit">' + esc(label) + '</b><small class="fit" dir="ltr">' + (pre ? '<em>' + pre + '</em>' : '') + xm(m) + '</small></button>'; }
  function svgOpen(w, h, extra) { return '<svg class="c1-svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + DEFS + '<ellipse cx="' + w / 2 + '" cy="' + h / 2 + '" rx="' + w / 2 + '" ry="' + h / 2 + '" fill="url(#c1Ft)"/>' + (extra || ''); }
  function setSt(box, txt, cls) { var e = box.querySelector('.c1-st span'); if (!e) return; K.setText(e, txt || ''); e.parentNode.className = 'c1-st' + (txt ? ' on' : '') + (cls ? ' ' + cls : ''); }
  function rkName(r) { return RK[r]; }

  /* ================= Higher Card ================= */
  var HC = { v: 2 }, HC_P = [6 / 13, 1 / 13, 6 / 13], REF = [7, 2];
  var AR_UP = '<svg viewBox="0 0 24 24" class="c1-ar" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>', AR_DN = '<svg viewBox="0 0 24 24" class="c1-ar" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
  K.register('highcard', function (box) {
    var l = L(), sc = 1.25;
    var svg = svgOpen(300, 170) + slot(54, 22, sc) + slot(171, 22, sc) + '<g transform="translate(54 22) scale(' + sc + ')">' + face(REF) + '</g>' +
      '<g class="hc-vs"><circle cx="150" cy="74" r="15"/><path d="M144 70l6-6 6 6M144 78l6 6 6-6"/></g>' + deckSvg(262, 6, 0.45) + '<g class="c1-layer"></g></svg>';
    var ops = '<div class="cg-opts c1-opts">' + opt(0, l.lower, pm(HC_P[0]), 'hc-o', AR_DN, 'A–6') + opt(2, l.higher, pm(HC_P[2]), 'hc-o', AR_UP, '8–K') + '</div>';
    var u = shell(box, 'highcard', svg, '', '', ops, l);
    bindPick(box, HC, 'hc-o'); hist('highcard', u.hist);
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('c1-busy')) return;
      lock(box, true);
      var r = await K.play('highcard', { pick: HC.v });
      if (!r || !alive(box)) { lock(box, false); return; }
      try {
        await clearCards(box, u.layer);
        var w = r.view.w, d = new Deck(); d.take(function (c) { return c[0] === 7 && c[1] === 2; });
        // As bas (= 1) dans ce jeu : 14 dessiné comme As, compté sous le 7
        var c = d.take(function (q) { var v = q[0] === 14 ? 1 : q[0]; return w === 0 ? v < 7 : w === 1 ? v === 7 : v > 7; });
        await deal(box, u.layer, [262, 6, 0.45], 171, 22, sc, c, 380);
        var v = c[0] === 14 ? 1 : c[0];
        box.querySelector('.hc-vs').setAttribute('class', 'hc-vs ' + (v < 7 ? 'dn' : v > 7 ? 'up' : 'eq'));
        hist('highcard', u.hist, [r.win > 0 ? 'hi' : 'lo', rkName(c[0])]);
        K.resultLine(box, r);
        await wait(box, 300);
      } catch (e) { if (!alive(box)) return; }
      lock(box, false);
    });
  }, { rules: {
    en: '1. A 7 is on the table. Bet Lower (A–6) or Higher (8–K) — the Ace is low.\n2. Tap “Bet”: the next card is dealt.\n3. Right guess = ×2.03 your stake; another 7 = lost.',
    fr: '1. Un 7 est sur la table. Parie Plus bas (A–6) ou Plus haut (8–K) — l’As est bas.\n2. Touche « Miser » : la carte suivante est donnée.\n3. Bonne réponse = ×2,03 ta mise ; un autre 7 = perdu.',
    es: '1. Hay un 7 en la mesa. Apuesta Menor (A–6) o Mayor (8–K): el As es bajo.\n2. Toca «Apostar»: se reparte la siguiente carta.\n3. Acierto = ×2,03 tu apuesta; otro 7 = pierdes.',
    pt: '1. Há um 7 na mesa. Aposte Menor (A–6) ou Maior (8–K) — o Ás é baixo.\n2. Toque em «Apostar»: a próxima carta é dada.\n3. Acerto = ×2,03 a aposta; outro 7 = perdeu.',
    ar: '1. على الطاولة ورقة 7. راهن أقل (A–6) أو أعلى (8–K) — الآس هو الأصغر.\n2. اضغط «راهن»: تُوزَّع الورقة التالية.\n3. التخمين الصحيح = ×2.03 من رهانك؛ 7 أخرى = خسارة.',
    tr: '1. Masada bir 7 var. Düşük (A–6) ya da Yüksek (8–K) bahsi yap — As en küçüktür.\n2. «Bahis»e dokun: sonraki kart açılır.\n3. Doğru tahmin = bahsinin ×2,03 katı; başka bir 7 = kayıp.',
    vi: '1. Trên bàn có lá 7. Cược Thấp hơn (A–6) hoặc Cao hơn (8–K) — Át là nhỏ nhất.\n2. Chạm «Cược»: lá bài tiếp theo được chia.\n3. Đoán đúng = ×2,03 tiền cược; ra 7 nữa = thua.',
    id: '1. Ada kartu 7 di meja. Pasang Lebih rendah (A–6) atau Lebih tinggi (8–K) — As bernilai rendah.\n2. Ketuk «Pasang»: kartu berikutnya dibagikan.\n3. Tebakan benar = ×2,03 taruhan; 7 lagi = kalah.',
    ru: '1. На столе семёрка. Ставьте Ниже (A–6) или Выше (8–K) — туз младший.\n2. Нажмите «Ставка»: сдаётся следующая карта.\n3. Угадали — ×2,03 ставки; ещё одна семёрка — проигрыш.',
    de: '1. Eine 7 liegt auf dem Tisch. Setze auf Tiefer (A–6) oder Höher (8–K) — das Ass ist niedrig.\n2. Tippe auf „Setzen“: Die nächste Karte wird gegeben.\n3. Richtig = ×2,03 deines Einsatzes; noch eine 7 = verloren.',
    hi: '1. टेबल पर 7 है। कम (A–6) या ज़्यादा (8–K) पर दांव लगाएँ — इक्का सबसे छोटा है।\n2. «दांव» दबाएँ: अगला पत्ता बाँटा जाता है।\n3. सही अनुमान = दांव का ×2.03; फिर से 7 = हार।',
    zh: '1. 桌上有一张 7。押小（A–6）或大（8–K），A 为最小。\n2. 点「下注」：发下一张牌。\n3. 猜对赢下注的 ×2.03；再出 7 则输。'
  } });

  /* ================= Casino War ================= */
  var WR = { v: 0 }, WR_P = [8 / 17, 8 / 17, 1 / 17];
  K.register('war', function (box) {
    var l = L(), sc = 1.25;
    var svg = svgOpen(300, 160) + slot(40, 26, sc) + slot(185, 26, sc) + '<g class="wr-vs"><circle cx="150" cy="78" r="17"/><text x="150" y="83.5" text-anchor="middle">VS</text></g>' + deckSvg(136, 128, 0.32) + '<g class="c1-layer"></g></svg>';
    var lbl = '<div class="c1-lbls"><b class="fit" id="wrP">' + esc(l.player) + '</b><b class="fit" id="wrD">' + esc(l.dealer) + '</b></div>';
    var ops = '<div class="cg-opts c1-opts">' + opt(0, l.player, pm(WR_P[0]), 'wr-o') + opt(2, l.tie, pm(WR_P[2]), 'wr-o tie') + opt(1, l.dealer, pm(WR_P[1]), 'wr-o') + '</div>';
    var u = shell(box, 'war', svg, '', lbl, ops, l);
    bindPick(box, WR, 'wr-o'); hist('war', u.hist);
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('c1-busy')) return;
      lock(box, true); $('wrP').classList.remove('w'); $('wrD').classList.remove('w');
      var r = await K.play('war', { pick: WR.v });
      if (!r || !alive(box)) { lock(box, false); return; }
      try {
        await clearCards(box, u.layer);
        var w = r.view.w, d = new Deck(), pc = d.take(), dc;
        if (w === 2) dc = d.rank(pc[0]);
        else { if (pc[0] === (w === 0 ? 2 : 14)) { d.c.push(pc); shuffle(d.c); pc = d.take(function (q) { return q[0] !== (w === 0 ? 2 : 14); }); } dc = d.take(function (q) { return w === 0 ? q[0] < pc[0] : q[0] > pc[0]; }); }
        var from = [136, 128, 0.32];
        await deal(box, u.layer, from, 40, 26, sc, pc);
        await deal(box, u.layer, from, 185, 26, sc, dc);
        if (w !== 2) $(w === 0 ? 'wrP' : 'wrD').classList.add('w');
        hist('war', u.hist, [w === 2 ? 'hi' : w === 0 ? 'mid' : 'lo', w === 2 ? '=' : w === 0 ? 'P' : 'D']);
        K.resultLine(box, r);
        await wait(box, 300);
      } catch (e) { if (!alive(box)) return; }
      lock(box, false);
    });
  }, { rules: {
    en: '1. Bet Player ×1.99, Dealer ×1.99 or Tie ×15.97.\n2. Tap “Bet”: one card each (Ace high).\n3. The higher card wins; Tie pays when both cards have the same rank.',
    fr: '1. Parie Joueur ×1,99, Croupier ×1,99 ou Égalité ×15,97.\n2. Touche « Miser » : une carte chacun (l’As est le plus fort).\n3. La plus forte carte gagne ; Égalité paie si les deux cartes ont la même valeur.',
    es: '1. Apuesta Jugador ×1,99, Crupier ×1,99 o Empate ×15,97.\n2. Toca «Apostar»: una carta cada uno (el As es alto).\n3. Gana la carta más alta; Empate paga si ambas tienen el mismo valor.',
    pt: '1. Aposte Jogador ×1,99, Banca ×1,99 ou Empate ×15,97.\n2. Toque em «Apostar»: uma carta para cada (o Ás é alto).\n3. A carta mais alta vence; Empate paga se as duas tiverem o mesmo valor.',
    ar: '1. راهن على اللاعب ×1.99 أو الموزّع ×1.99 أو التعادل ×15.97.\n2. اضغط «راهن»: ورقة لكل طرف (الآس هو الأعلى).\n3. الورقة الأعلى تفوز؛ التعادل يدفع إذا تساوت القيمتان.',
    tr: '1. Oyuncu ×1,99, Krupiye ×1,99 ya da Beraberlik ×15,97 bahsi yap.\n2. «Bahis»e dokun: herkese bir kart (As en büyük).\n3. Büyük kart kazanır; iki kart aynı değerdeyse Beraberlik öder.',
    vi: '1. Cược Người chơi ×1,99, Nhà cái ×1,99 hoặc Hòa ×15,97.\n2. Chạm «Cược»: mỗi bên một lá (Át lớn nhất).\n3. Lá cao hơn thắng; Hòa trả thưởng khi hai lá cùng giá trị.',
    id: '1. Pasang Pemain ×1,99, Bandar ×1,99, atau Seri ×15,97.\n2. Ketuk «Pasang»: masing-masing satu kartu (As tertinggi).\n3. Kartu lebih tinggi menang; Seri dibayar jika nilainya sama.',
    ru: '1. Ставьте на Игрока ×1,99, Дилера ×1,99 или Ничью ×15,97.\n2. Нажмите «Ставка»: по одной карте (туз старший).\n3. Старшая карта побеждает; Ничья платит при равных картах.',
    de: '1. Setze auf Spieler ×1,99, Dealer ×1,99 oder Gleichstand ×15,97.\n2. Tippe auf „Setzen“: je eine Karte (Ass hoch).\n3. Die höhere Karte gewinnt; Gleichstand zahlt bei gleichem Wert.',
    hi: '1. खिलाड़ी ×1.99, डीलर ×1.99 या टाई ×15.97 पर दांव लगाएँ।\n2. «दांव» दबाएँ: दोनों को एक-एक पत्ता (इक्का सबसे बड़ा)।\n3. बड़ा पत्ता जीतता है; दोनों बराबर हों तो टाई जीतता है।',
    zh: '1. 押玩家 ×1.99、庄家 ×1.99 或和局 ×15.97。\n2. 点「下注」：双方各发一张牌（A 最大）。\n3. 点大者胜；两张牌点数相同则和局赢。'
  } });

  /* ================= Andar Bahar ================= */
  var AB = { v: 0 };
  K.register('andar', function (box) {
    var l = L(), sc = 0.9;
    var svg = svgOpen(320, 196) + slot(8, 58, 1) +
      '<g class="ab-row a"><rect x="76" y="8" width="240" height="84" rx="12"/><circle cx="90" cy="22" r="10"/><text x="90" y="26.5" text-anchor="middle">A</text></g>' +
      '<g class="ab-row b"><rect x="76" y="104" width="240" height="84" rx="12"/><circle cx="90" cy="118" r="10"/><text x="90" y="122.5" text-anchor="middle">B</text></g>' +
      '<text class="ab-jk" x="38" y="160" text-anchor="middle">★</text>' + deckSvg(20, 6, 0.32) + '<g class="c1-layer"></g></svg>';
    var ops = '<div class="cg-opts c1-opts">' + opt(0, l.andar, pm(0.5), 'ab-o a', '<i class="ab-i">A</i>') + opt(1, l.bahar, pm(0.5), 'ab-o b', '<i class="ab-i">B</i>') + '</div>';
    var u = shell(box, 'andar', svg, '', '', ops, l);
    bindPick(box, AB, 'ab-o'); hist('andar', u.hist);
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('c1-busy')) return;
      lock(box, true); box.querySelectorAll('.ab-row').forEach(function (e) { e.classList.remove('w'); });
      var r = await K.play('andar', { pick: AB.v });
      if (!r || !alive(box)) { lock(box, false); return; }
      try {
        await clearCards(box, u.layer);
        var w = r.view.w, jk, seq;
        // donne au hasard (Andar d'abord, en alternance) jusqu'à la carte du même rang que le joker, côté w
        for (var tries = 0; tries < 500; tries++) {
          var d = new Deck(); jk = d.take(); var k = -1;
          for (var i = 0; i < 16; i++) if (d.c[i][0] === jk[0]) { k = i; break; }
          if (k >= 0 && k % 2 === w) { seq = d.c.slice(0, k + 1); break; }
        }
        if (!seq) { seq = [[jk[0], (jk[1] + 1) % 4]]; if (w === 1) seq.unshift(new Deck().take(function (c) { return c[0] !== jk[0]; })); }
        var from = [20, 6, 0.32];
        await deal(box, u.layer, from, 8, 58, 1, jk);
        var na = 0, nb = 0, step = lite() ? 120 : 230, gap = Math.min(36, (312 - 106 - 54) / Math.max(1, Math.ceil(seq.length / 2) - 1));
        // v2812 (round 4, propriétaire : « trop long ») : les cartes partent l'une derrière l'autre sans attendre que la
        // précédente soit retournée (16 cartes ≈ 3 s au lieu de 12 s)
        var ps = [], gapMs = lite() ? 90 : (seq.length > 8 ? 170 : 280);
        for (var j = 0; j < seq.length; j++) {
          var side = j % 2, n = side ? nb++ : na++;
          ps.push(deal(box, u.layer, from, 106 + n * gap, side ? 110 : 14, sc, seq[j], step));
          if (j < seq.length - 1) await wait(box, gapMs);
        }
        await Promise.all(ps);
        box.querySelector('.ab-row.' + (w ? 'b' : 'a')).classList.add('w');
        hist('andar', u.hist, [w ? 'lo' : 'hi', w ? 'B' : 'A']);
        K.resultLine(box, r);
        await wait(box, 300);
      } catch (e) { if (!alive(box)) return; }
      lock(box, false);
    });
  }, { rules: {
    en: '1. Bet Andar (A) or Bahar (B), ×1.88.\n2. Tap “Bet”: a joker card is shown, then cards are dealt to Andar and Bahar in turn.\n3. The side that gets the first card of the joker’s rank wins.',
    fr: '1. Parie Andar (A) ou Bahar (B), ×1,88.\n2. Touche « Miser » : une carte joker est montrée, puis les cartes sont données à Andar et Bahar à tour de rôle.\n3. Le côté qui reçoit la 1re carte de la même valeur que le joker gagne.',
    es: '1. Apuesta Andar (A) o Bahar (B), ×1,88.\n2. Toca «Apostar»: se muestra un comodín y se reparten cartas a Andar y Bahar por turnos.\n3. Gana el lado que recibe la 1.ª carta del mismo valor que el comodín.',
    pt: '1. Aposte Andar (A) ou Bahar (B), ×1,88.\n2. Toque em «Apostar»: um coringa é mostrado e as cartas vão para Andar e Bahar alternadamente.\n3. Vence o lado que recebe a 1.ª carta do mesmo valor do coringa.',
    ar: '1. راهن على أندر (A) أو باهر (B)، ×1.88.\n2. اضغط «راهن»: تظهر ورقة الجوكر، ثم تُوزَّع الأوراق على أندر وباهر بالتناوب.\n3. يفوز الجانب الذي يتلقى أول ورقة بنفس قيمة الجوكر.',
    tr: '1. Andar (A) ya da Bahar (B) bahsi yap, ×1,88.\n2. «Bahis»e dokun: joker kart açılır, sonra kartlar sırayla Andar ve Bahar’a dağıtılır.\n3. Jokerle aynı değerdeki ilk kartı alan taraf kazanır.',
    vi: '1. Cược Andar (A) hoặc Bahar (B), ×1,88.\n2. Chạm «Cược»: lật lá joker, rồi chia lần lượt cho Andar và Bahar.\n3. Bên nhận lá đầu tiên cùng giá trị với joker sẽ thắng.',
    id: '1. Pasang Andar (A) atau Bahar (B), ×1,88.\n2. Ketuk «Pasang»: kartu joker dibuka, lalu kartu dibagikan bergantian ke Andar dan Bahar.\n3. Sisi yang pertama mendapat kartu senilai joker menang.',
    ru: '1. Ставьте на Андар (A) или Бахар (B), ×1,88.\n2. Нажмите «Ставка»: открывается джокер, затем карты сдаются по очереди на Андар и Бахар.\n3. Побеждает сторона, получившая первую карту того же достоинства, что и джокер.',
    de: '1. Setze auf Andar (A) oder Bahar (B), ×1,88.\n2. Tippe auf „Setzen“: Eine Joker-Karte wird gezeigt, dann gehen die Karten abwechselnd an Andar und Bahar.\n3. Die Seite, die zuerst eine Karte mit dem Wert des Jokers bekommt, gewinnt.',
    hi: '1. अंदर (A) या बाहर (B) पर दांव लगाएँ, ×1.88।\n2. «दांव» दबाएँ: जोकर पत्ता खुलता है, फिर पत्ते बारी-बारी अंदर और बाहर में बाँटे जाते हैं।\n3. जिस तरफ़ जोकर के बराबर का पहला पत्ता आए, वह जीतती है।',
    zh: '1. 押安达（A）或巴哈（B），×1.88。\n2. 点「下注」：翻开一张王牌，然后轮流向安达和巴哈发牌。\n3. 先发到与王牌点数相同的一方获胜。'
  } });

  /* ================= Red Dog ================= */
  var RD_PAY = [[1, 8], [2, 5.5], [3, 3], ['4–11', 2]], RD_TRIPS = 12;
  K.register('reddog', function (box) {
    var l = L(), sc = 1.15;
    var svg = svgOpen(300, 150) + slot(18, 22, sc) + slot(115.5, 22, sc) + slot(213, 22, sc) +
      '<g class="rd-gap"><path d="M90 72H112M188 72H210" /></g>' + deckSvg(276, 4, 0.3) + '<g class="c1-layer"></g></svg>';
    var pay = '<div class="rd-pay">' + RD_PAY.map(function (p, i) { return '<span data-s="' + i + '"><i dir="ltr">' + p[0] + '</i><b class="fit">×' + num(p[1]) + '</b></span>'; }).join('') +
      '<span data-s="t"><i class="t">≡</i><b class="fit">×' + RD_TRIPS + '</b></span></div>';
    var u = shell(box, 'reddog', svg, pay, '<div class="c1-st"><span class="fit"></span></div>', '', l);
    hist('reddog', u.hist);
    var mark = function (k) { box.querySelectorAll('.rd-pay span').forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-s') === String(k)); }); };
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('c1-busy')) return;
      lock(box, true); setSt(box, ''); mark(null);
      var r = await K.play('reddog', {});
      if (!r || !alive(box)) { lock(box, false); return; }
      try {
        await clearCards(box, u.layer);
        var i = r.view.i, d = new Deck(), a, b, c = null, kind, s = 0;
        if (i <= 1) { kind = 'pair'; a = d.take(); b = d.rank(a[0]); c = i === 0 ? d.rank(a[0]) : d.take(function (q) { return q[0] !== a[0]; }); }
        else if (i === 2) { kind = 'cons'; a = d.take(function (q) { return q[0] < 14; }); b = d.rank(a[0] + 1); }
        else {
          kind = 'spread'; s = Math.floor((i - 3) / 2) + 1; var win = (i - 3) % 2 === 0;
          var lo = 2 + rnd(14 - s - 2); a = d.rank(lo); b = d.rank(lo + s + 1);
          c = d.take(function (q) { return win ? q[0] > lo && q[0] < lo + s + 1 : q[0] <= lo || q[0] >= lo + s + 1; });
        }
        if (Math.random() < 0.5 && kind !== 'spread') { var t = a; a = b; b = t; }
        if (kind === 'spread' && Math.random() < 0.5) { var t2 = a; a = b; b = t2; }
        var from = [276, 4, 0.3], lx = a[0] <= b[0] ? 18 : 213, rx = lx === 18 ? 213 : 18;
        await deal(box, u.layer, from, lx, 22, sc, a);
        await deal(box, u.layer, from, rx, 22, sc, b);
        if (kind === 'pair') { setSt(box, l.pair); mark('t'); }
        else if (kind === 'cons') setSt(box, l.consec);
        else { setSt(box, l.spread + ' ' + s); mark(Math.min(s, 4) - 1); }
        if (c) { await wait(box, 420); await deal(box, u.layer, from, 115.5, 22, sc, c, 420); }
        hist('reddog', u.hist, [r.mult > 1 ? 'hi' : r.mult === 1 ? 'mid' : 'lo', kind === 'pair' ? (i === 0 ? '≡' : '=') : kind === 'cons' ? '±1' : String(s)]);
        K.resultLine(box, r);
        await wait(box, 300);
      } catch (e) { if (!alive(box)) return; }
      lock(box, false);
    });
  }, { rules: {
    en: '1. Tap “Bet”: two cards are dealt; the spread is the number of ranks between them (Ace high).\n2. A third card is dealt: if it falls between them you win — spread 1 ×8, 2 ×5.5, 3 ×3, 4+ ×2.\n3. Consecutive cards or a pair = stake back; a pair + same third card = ×12.',
    fr: '1. Touche « Miser » : deux cartes sont données ; l’écart = nombre de valeurs entre elles (As fort).\n2. Une 3e carte est donnée : si elle tombe entre les deux, tu gagnes — écart 1 ×8, 2 ×5,5, 3 ×3, 4+ ×2.\n3. Cartes qui se suivent ou paire = mise rendue ; paire + même 3e carte = ×12.',
    es: '1. Toca «Apostar»: se reparten dos cartas; la diferencia es el número de valores entre ellas (As alto).\n2. Sale una 3.ª carta: si cae entre ambas ganas — diferencia 1 ×8, 2 ×5,5, 3 ×3, 4+ ×2.\n3. Cartas seguidas o pareja = recuperas la apuesta; pareja + 3.ª igual = ×12.',
    pt: '1. Toque em «Apostar»: duas cartas são dadas; a diferença é o número de valores entre elas (Ás alto).\n2. Sai uma 3.ª carta: se cair entre as duas você ganha — diferença 1 ×8, 2 ×5,5, 3 ×3, 4+ ×2.\n3. Cartas seguidas ou par = aposta devolvida; par + 3.ª igual = ×12.',
    ar: '1. اضغط «راهن»: تُوزَّع ورقتان؛ الفارق هو عدد القيم بينهما (الآس أعلى).\n2. تُوزَّع ورقة ثالثة: إذا وقعت بينهما تربح — فارق 1 ×8، 2 ×5.5، 3 ×3، 4+ ×2.\n3. ورقتان متتاليتان أو زوج = يُعاد رهانك؛ زوج + ثالثة مماثلة = ×12.',
    tr: '1. «Bahis»e dokun: iki kart açılır; fark, aralarındaki değer sayısıdır (As büyük).\n2. Üçüncü kart açılır: ikisinin arasına düşerse kazanırsın — fark 1 ×8, 2 ×5,5, 3 ×3, 4+ ×2.\n3. Ardışık kartlar ya da çift = bahis iade; çift + aynı üçüncü kart = ×12.',
    vi: '1. Chạm «Cược»: chia hai lá; khoảng = số giá trị nằm giữa chúng (Át lớn).\n2. Chia lá thứ ba: nằm giữa hai lá là thắng — khoảng 1 ×8, 2 ×5,5, 3 ×3, 4+ ×2.\n3. Hai lá liên tiếp hoặc đôi = hoàn cược; đôi + lá thứ ba giống = ×12.',
    id: '1. Ketuk «Pasang»: dua kartu dibagikan; selisih = jumlah nilai di antara keduanya (As tinggi).\n2. Kartu ketiga dibagikan: jika berada di antara keduanya kamu menang — selisih 1 ×8, 2 ×5,5, 3 ×3, 4+ ×2.\n3. Kartu berurutan atau pasangan = taruhan kembali; pasangan + kartu ketiga sama = ×12.',
    ru: '1. Нажмите «Ставка»: сдаются две карты; разрыв — число достоинств между ними (туз старший).\n2. Третья карта: если она между ними — выигрыш: разрыв 1 ×8, 2 ×5,5, 3 ×3, 4+ ×2.\n3. Карты подряд или пара — ставка возвращается; пара + такая же третья — ×12.',
    de: '1. Tippe auf „Setzen“: Zwei Karten werden gegeben; der Abstand ist die Zahl der Werte dazwischen (Ass hoch).\n2. Eine 3. Karte kommt: liegt sie dazwischen, gewinnst du — Abstand 1 ×8, 2 ×5,5, 3 ×3, 4+ ×2.\n3. Folgekarten oder Paar = Einsatz zurück; Paar + gleiche 3. Karte = ×12.',
    hi: '1. «दांव» दबाएँ: दो पत्ते बाँटे जाते हैं; अंतर = उनके बीच के मानों की संख्या (इक्का बड़ा)।\n2. तीसरा पत्ता आता है: दोनों के बीच हो तो आप जीतते हैं — अंतर 1 ×8, 2 ×5.5, 3 ×3, 4+ ×2।\n3. लगातार पत्ते या पेयर = दांव वापस; पेयर + वही तीसरा पत्ता = ×12।',
    zh: '1. 点「下注」：发两张牌；间隔 = 两张牌之间的点数个数（A 最大）。\n2. 发第三张牌：落在两张之间即赢——间隔 1 ×8、2 ×5.5、3 ×3、4 以上 ×2。\n3. 连号或对子 = 退还下注；对子 + 第三张相同 = ×12。'
  } });

  /* ================= Teen Patti ================= */
  var TP_M = [40, 36, 7, 4, 2];
  function tpCat(h) {
    var rs = h.map(function (c) { return c[0]; }).sort(function (a, b) { return a - b; }), fl = h[0][1] === h[1][1] && h[1][1] === h[2][1];
    var seq = (rs[1] === rs[0] + 1 && rs[2] === rs[1] + 1) || (rs[0] === 2 && rs[1] === 3 && rs[2] === 14);
    if (rs[0] === rs[2]) return 0; if (seq && fl) return 1; if (seq) return 2; if (fl) return 3; if (rs[0] === rs[1] || rs[1] === rs[2]) return 4; return 5;
  }
  K.register('teenpatti', function (box) {
    var l = L(), sc = 1.2;
    var svg = svgOpen(220, 160) + deckSvg(198, 0, 0.3) + '<g class="c1-layer"></g></svg>';
    var pay = '<div class="tp-pay">' + l.tp.map(function (n, i) { return '<span data-i="' + i + '"><b class="fit">' + esc(n) + '</b><i dir="ltr">' + '×' + TP_M[i] + '</i></span>'; }).join('') + '</div>';
    var u = shell(box, 'teenpatti', '<div class="tp-wrap">' + svg + pay + '</div>', '', '', '', l);
    hist('teenpatti', u.hist);
    var POS = [[6, 38, -14], [72, 24, 0], [138, 38, 14]];
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('c1-busy')) return;
      lock(box, true); box.querySelectorAll('.tp-pay span').forEach(function (s) { s.classList.remove('on'); });
      var r = await K.play('teenpatti', {});
      if (!r || !alive(box)) { lock(box, false); return; }
      try {
        await clearCards(box, u.layer);
        var i = r.view.i, h = null;
        for (var t = 0; t < 400000 && !h; t++) { var d = new Deck(), q = [d.c[0], d.c[1], d.c[2]]; if (tpCat(q) === i) h = q; }
        for (var k = 0; k < 3; k++) {
          var g = await deal(box, u.layer, [198, 0, 0.3], POS[k][0], POS[k][1], sc, h[k], 300);
          g.style.transform = 'translate(' + POS[k][0] + 'px,' + POS[k][1] + 'px) scale(' + sc + ') translate(30px,42px) rotate(' + POS[k][2] + 'deg) translate(-30px,-42px)';
        }
        var sp = box.querySelector('.tp-pay span[data-i="' + i + '"]'); if (sp) sp.classList.add('on');
        hist('teenpatti', u.hist, [i <= 2 ? 'hi' : i <= 4 ? 'mid' : 'lo', i < 5 ? '×' + TP_M[i] : '×0']);
        K.resultLine(box, r);
        await wait(box, 300);
      } catch (e) { if (!alive(box)) return; }
      lock(box, false);
    });
  }, { rules: {
    en: '1. Tap “Bet”: you get 3 cards.\n2. Your hand pays by its rank: Trail ×40, Pure Sequence ×36, Sequence ×7, Color ×4, Pair ×2.\n3. High card only = lost. A-2-3 and Q-K-A are sequences.',
    fr: '1. Touche « Miser » : tu reçois 3 cartes.\n2. Ta main paie selon sa force : Brelan ×40, Suite couleur ×36, Suite ×7, Couleur ×4, Paire ×2.\n3. Carte haute seule = perdu. A-2-3 et D-R-A sont des suites.',
    es: '1. Toca «Apostar»: recibes 3 cartas.\n2. Tu mano paga según su rango: Trío ×40, Escalera de color ×36, Escalera ×7, Color ×4, Pareja ×2.\n3. Solo carta alta = pierdes. A-2-3 y Q-K-A son escaleras.',
    pt: '1. Toque em «Apostar»: você recebe 3 cartas.\n2. A mão paga pela força: Trinca ×40, Sequência de naipe ×36, Sequência ×7, Cor ×4, Par ×2.\n3. Só carta alta = perdeu. A-2-3 e Q-K-A são sequências.',
    ar: '1. اضغط «راهن»: تحصل على 3 أوراق.\n2. تُدفع يدك حسب قوتها: ثلاثية ×40، تسلسل نقي ×36، تسلسل ×7، لون ×4، زوج ×2.\n3. ورقة عالية فقط = خسارة. A-2-3 وQ-K-A تسلسلات.',
    tr: '1. «Bahis»e dokun: 3 kart alırsın.\n2. Elin gücüne göre öder: Üçlü ×40, Renk Sırası ×36, Sıra ×7, Renk ×4, Çift ×2.\n3. Yalnız yüksek kart = kayıp. A-2-3 ve Q-K-A sıradır.',
    vi: '1. Chạm «Cược»: bạn nhận 3 lá.\n2. Trả thưởng theo hạng bài: Sám ×40, Thùng phá sảnh ×36, Sảnh ×7, Thùng ×4, Đôi ×2.\n3. Chỉ có mậu thầu = thua. A-2-3 và Q-K-A là sảnh.',
    id: '1. Ketuk «Pasang»: kamu mendapat 3 kartu.\n2. Kartumu dibayar menurut peringkat: Trail ×40, Urutan Murni ×36, Urutan ×7, Warna ×4, Pasangan ×2.\n3. Hanya kartu tinggi = kalah. A-2-3 dan Q-K-A adalah urutan.',
    ru: '1. Нажмите «Ставка»: вы получаете 3 карты.\n2. Рука оплачивается по силе: Тройка ×40, Чистый стрит ×36, Стрит ×7, Масть ×4, Пара ×2.\n3. Только старшая карта — проигрыш. A-2-3 и Q-K-A — стриты.',
    de: '1. Tippe auf „Setzen“: Du bekommst 3 Karten.\n2. Deine Hand zahlt nach Rang: Drilling ×40, Farbstraße ×36, Straße ×7, Farbe ×4, Paar ×2.\n3. Nur hohe Karte = verloren. A-2-3 und Q-K-A sind Straßen.',
    hi: '1. «दांव» दबाएँ: आपको 3 पत्ते मिलते हैं।\n2. हाथ अपनी रैंक से जीतता है: ट्रेल ×40, प्योर सीक्वेंस ×36, सीक्वेंस ×7, कलर ×4, पेयर ×2।\n3. सिर्फ़ हाई कार्ड = हार। A-2-3 और Q-K-A सीक्वेंस हैं।',
    zh: '1. 点「下注」：你得到 3 张牌。\n2. 按牌型赔付：豹子 ×40、同花顺 ×36、顺子 ×7、同花 ×4、对子 ×2。\n3. 只有单张 = 输。A-2-3 和 Q-K-A 都算顺子。'
  } });

  /* ================= Video Poker ================= */
  var VP_M = [1000, 200, 80, 30, 16, 12, 8, 5.5, 2.8];
  function vpCat(h) {
    var cnt = {}, fl = h.every(function (c) { return c[1] === h[0][1]; }), rs = h.map(function (c) { return c[0]; }).sort(function (a, b) { return a - b; });
    h.forEach(function (c) { cnt[c[0]] = (cnt[c[0]] || 0) + 1; });
    var v = Object.keys(cnt).map(function (k) { return cnt[k]; }).sort(function (a, b) { return b - a; });
    var uniq = v.length === 5, st = uniq && (rs[4] - rs[0] === 4 || (rs[4] === 14 && rs[3] === 5));
    if (st && fl) return rs[0] === 10 ? 0 : 1;
    if (v[0] === 4) return 2; if (v[0] === 3 && v[1] === 2) return 3; if (fl) return 4; if (st) return 5; if (v[0] === 3) return 6;
    if (v[0] === 2 && v[1] === 2) return 7;
    if (v[0] === 2) { for (var k in cnt) if (cnt[k] === 2) return +k >= 11 ? 8 : 9; }
    return 10;
  }
  function vpHand(i) {
    var d = new Deck(), s = rnd(4), h;
    if (i === 0) h = [10, 11, 12, 13, 14].map(function (r) { return [r, s]; });
    else if (i === 1) { var lo = 1 + rnd(9); h = [0, 1, 2, 3, 4].map(function (k) { var r = lo + k; return [r === 1 ? 14 : r, s]; }); }
    else if (i === 2) { var q = 2 + rnd(13); h = [0, 1, 2, 3].map(function (k) { return [q, k]; }); d.c = d.c.filter(function (c) { return c[0] !== q; }); h.push(d.take()); }
    else if (i === 3) { var a = 2 + rnd(13), b = d.take(function (c) { return c[0] !== a; })[0]; h = shuffle([0, 1, 2, 3]).slice(0, 3).map(function (k) { return [a, k]; }).concat(shuffle([0, 1, 2, 3]).slice(0, 2).map(function (k) { return [b, k]; })); }
    else { for (var t = 0; t < 300000; t++) { var e = new Deck(), c5 = e.c.slice(0, 5); if (vpCat(c5) === i) { h = c5; break; } } }
    return shuffle(h);
  }
  K.register('vpoker', function (box) {
    var l = L(), sc = 0.9;
    var svg = svgOpen(320, 100) + [0, 1, 2, 3, 4].map(function (k) { return slot(8 + k * 62, 12, sc); }).join('') + '<g class="c1-layer"></g></svg>';
    var pay = '<div class="vp-pay">' + l.vp.map(function (n, i) { return '<span data-i="' + i + '"><b class="fit">' + esc(n) + '</b><i dir="ltr">×' + num(VP_M[i]) + '</i></span>'; }).join('') + '</div>';
    var u = shell(box, 'vpoker', svg, pay, '', '', l);
    hist('vpoker', u.hist);
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('c1-busy')) return;
      lock(box, true); box.querySelectorAll('.vp-pay span').forEach(function (s) { s.classList.remove('on'); });
      var r = await K.play('vpoker', {});
      if (!r || !alive(box)) { lock(box, false); return; }
      try {
        await clearCards(box, u.layer);
        var i = r.view.i, h = vpHand(i);
        for (var k = 0; k < 5; k++) await deal(box, u.layer, [160 - 27, -90, sc], 8 + k * 62, 12, sc, h[k], 240);
        var sp = box.querySelector('.vp-pay span[data-i="' + i + '"]'); if (sp) sp.classList.add('on');
        hist('vpoker', u.hist, [i <= 5 ? 'hi' : i <= 8 ? 'mid' : 'lo', i <= 8 ? '×' + num(VP_M[i]) : '×0']);
        K.resultLine(box, r);
        await wait(box, 300);
      } catch (e) { if (!alive(box)) return; }
      lock(box, false);
    });
  }, { rules: {
    en: '1. Tap “Bet”: 5 cards are dealt from a 52-card deck.\n2. Your hand pays by the table: from Jacks or Better ×2.8 up to Royal Flush ×1000.\n3. A pair of 10s or lower, or nothing = lost.',
    fr: '1. Touche « Miser » : 5 cartes sont données (jeu de 52).\n2. Ta main paie selon le tableau : de Valets ou mieux ×2,8 à la Quinte flush royale ×1000.\n3. Une paire de 10 ou moins, ou rien = perdu.',
    es: '1. Toca «Apostar»: se reparten 5 cartas de una baraja de 52.\n2. Tu mano paga según la tabla: de Jotas o más ×2,8 a Escalera real ×1000.\n3. Pareja de 10 o menos, o nada = pierdes.',
    pt: '1. Toque em «Apostar»: 5 cartas são dadas de um baralho de 52.\n2. A mão paga pela tabela: de Valetes ou mais ×2,8 até Royal Flush ×1000.\n3. Par de 10 ou menor, ou nada = perdeu.',
    ar: '1. اضغط «راهن»: تُوزَّع 5 أوراق من 52 ورقة.\n2. تُدفع يدك حسب الجدول: من شباب أو أعلى ×2.8 حتى رويال فلاش ×1000.\n3. زوج 10 أو أقل، أو لا شيء = خسارة.',
    tr: '1. «Bahis»e dokun: 52’lik desteden 5 kart dağıtılır.\n2. Elin tabloya göre öder: Vale veya Üstü ×2,8’den Royal Flush ×1000’e.\n3. 10’lu veya daha küçük çift ya da hiçbir şey = kayıp.',
    vi: '1. Chạm «Cược»: chia 5 lá từ bộ 52 lá.\n2. Trả thưởng theo bảng: từ Đôi J trở lên ×2,8 đến Thùng phá sảnh lớn ×1000.\n3. Đôi 10 trở xuống hoặc không có gì = thua.',
    id: '1. Ketuk «Pasang»: 5 kartu dibagikan dari dek 52 kartu.\n2. Kartumu dibayar sesuai tabel: dari Jack ke atas ×2,8 hingga Royal Flush ×1000.\n3. Pasangan 10 atau lebih rendah, atau tidak ada = kalah.',
    ru: '1. Нажмите «Ставка»: сдаются 5 карт из колоды в 52.\n2. Рука оплачивается по таблице: от «Валеты и выше» ×2,8 до роял-флеша ×1000.\n3. Пара десяток и ниже или ничего — проигрыш.',
    de: '1. Tippe auf „Setzen“: 5 Karten aus 52 werden gegeben.\n2. Deine Hand zahlt laut Tabelle: von Buben oder besser ×2,8 bis Royal Flush ×1000.\n3. Ein Paar 10er oder kleiner bzw. nichts = verloren.',
    hi: '1. «दांव» दबाएँ: 52 पत्तों से 5 पत्ते बाँटे जाते हैं।\n2. तालिका के अनुसार भुगतान: जैक्स या बेहतर ×2.8 से रॉयल फ्लश ×1000 तक।\n3. 10 या छोटा पेयर, या कुछ नहीं = हार।',
    zh: '1. 点「下注」：从 52 张牌中发 5 张。\n2. 按赔率表赔付：从 J 或更好 ×2.8 到皇家同花顺 ×1000。\n3. 10 及以下的对子或无牌型 = 输。'
  } });
})(window.D6 = window.D6 || {});
