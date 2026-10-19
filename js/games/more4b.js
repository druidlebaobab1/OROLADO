/* v2830 — more4b (owner request, round 5): Star Pinball, Horseshoe Toss, High Striker, Whack-a-Mole, Domino Rally — new instant games; the scene always shows exactly the line the server drew (casino_ext/more4.php). */
(function (D6) {
  'use strict';
  /* ---- petit kit commun des jeux more4 (copié dans chaque fichier : un seul fichier chargé par jeu) ---- */
  var K = D6.CasinoKit, $ = K.$;
  var GONE = { gone: 1 };
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function Lx(T) { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function xm(v) { return '×' + String(v).replace('.', K.dec()); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pickW(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; var r = Math.random() * s; for (i = 0; i < a.length; i++) { r -= a[i]; if (r < 0) return i; } return a.length - 1; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ease(k) { return 1 - Math.pow(1 - k, 3); }
  function easeIn(k) { return k * k; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  // animation image par image ; le joueur quitte le jeu → tout s'arrête (rejet GONE)
  function tw(box, ms, fn) {
    ms = lite() ? Math.round(ms * 0.55) : ms;
    return new Promise(function (res, rej) {
      var t0 = performance.now();
      var st = function (now) { if (!box.isConnected) { rej(GONE); return; } var k = Math.max(0, Math.min(1, (now - t0) / ms)); fn(k); if (k < 1) K.S.raf = requestAnimationFrame(st); else res(); };
      K.S.raf = requestAnimationFrame(st);
    });
  }
  function wait(box, ms) { return K.sleep(lite() ? Math.round(ms * 0.55) : ms).then(function () { if (!box.isConnected) throw GONE; }); }
  function tr(el, x, y, s, r) { if (el) el.setAttribute('transform', 'translate(' + (+x).toFixed(1) + ' ' + (+y).toFixed(1) + ')' + (s != null && s !== 1 ? ' scale(' + (+s).toFixed(3) + ')' : '') + (r ? ' rotate(' + (+r).toFixed(1) + ')' : '')); }
  // règles : les décimales suivent la langue (×0.5 → ×0,5)
  function rules(R) { ['fr', 'es', 'pt', 'tr', 'vi', 'id', 'ru', 'de'].forEach(function (k) { if (R[k]) R[k] = R[k].replace(/(\d)\.(\d)/g, '$1,$2'); }); return R; }
  /* jeu instantané : scène SVG + bandeau des gains (icône + ×) + terminal. o = { key, cls, verb, chips: [[icône, mult]], chipOf(i), vb, scene, opts, init(c), play(c, r), params(c) } */
  function game(o) {
    K.register(o.key, function (box) {
      var l = o.l(), busy = false;
      box.classList.add('cg-game', 'm4', 'm4-' + o.key);
      box.innerHTML = '<div class="cg-stage m4-stage">' + (o.chips ? '<div class="m4-pay">' + o.chips.map(function (c, i) { return '<span data-c="' + i + '">' + (c[0] ? '<svg viewBox="-12 -12 24 24" aria-hidden="true">' + c[0] + '</svg>' : '') + '<b class="fit">' + (c[2] || xm(c[1])) + '</b></span>'; }).join('') + '</div>' : '') +
        '<div class="m4-scene"><svg class="m4-svg" viewBox="' + o.vb + '" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + o.scene + '</svg></div></div>' + K.stakePanel(l.verb, o.opts ? o.opts(l) : '');
      K.bindStake(box);
      var c = { box: box, l: l, svg: box.querySelector('.m4-svg'), q: function (s) { return box.querySelector(s); }, qa: function (s) { return [].slice.call(box.querySelectorAll(s)); },
        mark: function (i) { box.querySelectorAll('.m4-pay span').forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-c') === i); }); } };
      c.id = function (s) { return box.querySelector('#' + s); };
      if (o.init) o.init(c);
      requestAnimationFrame(function () { K.fitAll(box); });
      try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (box.isConnected) K.fitAll(box); }); } catch (e) { /* ignore */ }
      var go = $('csGo');
      go.addEventListener('click', async function () {
        if (busy) return;
        var p = o.params ? o.params(c) : {};
        if (p === null) return;
        busy = true; go.disabled = true; box.classList.add('m4-busy'); c.mark(-1);
        var r = null, shown = false;
        try {
          if (o.reset) o.reset(c);
          r = await K.play(o.key, p);
          if (!r || !box.isConnected) return;
          await o.play(c, r);
          if (!box.isConnected) return;
          var i = r.view && r.view.i != null ? +r.view.i : -1;
          c.mark(o.chipOf ? o.chipOf(i, r) : -1);
          shown = true; K.resultLine(box, r);
          if (o.after) await o.after(c, r);
        } catch (e) {
          if (e !== GONE) { try { console.warn(e); } catch (e2) { /* ignore */ } if (r && !shown && box.isConnected) K.resultLine(box, r); }
        }
        finally { busy = false; if (box.isConnected) { go.disabled = false; box.classList.remove('m4-busy'); } }
      });
    }, { rules: rules(o.rules) });
  }
  var V = {
    en: { launch: 'Launch', thr: 'Throw', strike: 'Strike', play: 'Play', push: 'Push' },
    fr: { launch: 'Lancer', thr: 'Lancer', strike: 'Frapper', play: 'Jouer', push: 'Pousser' },
    es: { launch: 'Lanzar', thr: 'Lanzar', strike: 'Golpear', play: 'Jugar', push: 'Empujar' },
    pt: { launch: 'Lançar', thr: 'Arremessar', strike: 'Bater', play: 'Jogar', push: 'Empurrar' },
    ar: { launch: 'أطلِق', thr: 'ارمِ', strike: 'اضرب', play: 'العب', push: 'ادفع' },
    tr: { launch: 'Fırlat', thr: 'At', strike: 'Vur', play: 'Oyna', push: 'İt' },
    vi: { launch: 'Phóng', thr: 'Ném', strike: 'Đập', play: 'Chơi', push: 'Đẩy' },
    id: { launch: 'Luncurkan', thr: 'Lempar', strike: 'Pukul', play: 'Main', push: 'Dorong' },
    ru: { launch: 'Запуск', thr: 'Бросок', strike: 'Удар', play: 'Играть', push: 'Толкнуть' },
    de: { launch: 'Starten', thr: 'Werfen', strike: 'Schlagen', play: 'Spielen', push: 'Anstoßen' },
    hi: { launch: 'लॉन्च', thr: 'फेंकें', strike: 'मारें', play: 'खेलें', push: 'धकेलें' },
    zh: { launch: '发射', thr: '投掷', strike: '重击', play: '开始', push: '推倒' }
  };
  function verb(k) { return function () { var v = Lx(V); return { verb: v[k] }; }; }
  function star(r, f) { return '<path d="M0-' + r + 'L' + (r * .29).toFixed(1) + '-' + (r * .4).toFixed(1) + 'L' + (r * .95).toFixed(1) + '-' + (r * .31).toFixed(1) + 'L' + (r * .47).toFixed(1) + ' ' + (r * .15).toFixed(1) + 'L' + (r * .59).toFixed(1) + ' ' + (r * .81).toFixed(1) + 'L0 ' + (r * .5).toFixed(1) + 'L-' + (r * .59).toFixed(1) + ' ' + (r * .81).toFixed(1) + 'L-' + (r * .47).toFixed(1) + ' ' + (r * .15).toFixed(1) + 'L-' + (r * .95).toFixed(1) + '-' + (r * .31).toFixed(1) + 'L-' + (r * .29).toFixed(1) + '-' + (r * .4).toFixed(1) + 'z" fill="' + f + '"/>'; }
  // déplacement en ligne droite d'un point à l'autre à vitesse constante ; cb(j) à l'arrivée sur le point j
  async function path(box, el, pts, speed, cb) {
    for (var j = 1; j < pts.length; j++) {
      var a = pts[j - 1], b = pts[j], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      await tw(box, Math.max(60, d / speed * 1000), function (k) { tr(el, lerp(a[0], b[0], k), lerp(a[1], b[1], k)); });
      if (cb) cb(j, b);
    }
  }

  /* =============================== STAR PINBALL =============================== */
  // ligne i : 0 = 0–1 étoile allumée (perdu) · 1…5 = 2…6 étoiles · 6 = jackpot (la bille entre dans le trou étoile)
  var BUMP = [[96, 92], [164, 92], [130, 128]], TARG = [[46, 150], [214, 150], [70, 60], [190, 60]];
  game({
    key: 'pinball', l: verb('launch'), vb: '0 0 260 300',
    chips: [2, 3, 4, 5, 6].map(function (n, j) { return [star(9, '#FDE68A') + '<text y="4" font-size="9" font-weight="900" fill="#7C2D12" text-anchor="middle">' + n + '</text>', [0.5, 1, 2, 5, 15][j]]; }).concat([['<circle r="9" fill="#7C3AED" stroke="#FDE68A" stroke-width="2"/>' + star(6, '#FDE68A'), 100]]),
    chipOf: function (i) { return i - 1; },
    scene: '<defs><linearGradient id="pbT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312E81"/><stop offset="1" stop-color="#1E1B4B"/></linearGradient>' +
      '<radialGradient id="pbB" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FBCFE8"/><stop offset=".5" stop-color="#EC4899"/><stop offset="1" stop-color="#831843"/></radialGradient>' +
      '<radialGradient id="pbBall" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#CBD5E1"/><stop offset="1" stop-color="#475569"/></radialGradient>' +
      '<radialGradient id="pbHit" r=".5"><stop offset="0" stop-color="#FDE68A" stop-opacity=".9"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-300" y="-300" width="860" height="900" fill="#0B0820"/>' +
      '<path d="M14 290V60Q14 8 66 8H194Q246 8 246 60V290H170L130 262 90 290z" fill="url(#pbT)" stroke="#A78BFA" stroke-width="3"/>' +
      '<path d="M228 290V70Q228 26 190 22" fill="none" stroke="#A78BFA" stroke-width="2" opacity=".7"/>' +
      '<g class="pb-grid" stroke="#6366F1" stroke-opacity=".15">' + [40, 80, 120, 160, 200, 240].map(function (y) { return '<path d="M16 ' + y + 'H226"/>'; }).join('') + '</g>' +
      // étoiles-lampes (6) + trou jackpot
      '<g id="pbLamps">' + [0, 1, 2, 3, 4, 5].map(function (j) { return '<g class="pb-lamp" transform="translate(' + (45 + j * 34) + ' 196)">' + star(9, '#4C1D95') + '</g>'; }).join('') + '</g>' +
      '<g transform="translate(130 50)"><circle r="12" fill="#1E1B4B" stroke="#FDE68A" stroke-width="2"/><g id="pbJack">' + star(8, '#7C3AED') + '</g></g>' +
      BUMP.map(function (b, j) { return '<g class="pb-bump" id="pbB' + j + '" transform="translate(' + b[0] + ' ' + b[1] + ')"><circle r="22" fill="url(#pbHit)" class="pb-glow" opacity="0"/><circle r="15" fill="url(#pbB)" stroke="#FDE68A" stroke-width="2.5"/><circle r="6" fill="#FDF2F8"/></g>'; }).join('') +
      TARG.map(function (t, j) { return '<g class="pb-targ" id="pbT' + j + '" transform="translate(' + t[0] + ' ' + t[1] + ')"><circle r="16" fill="url(#pbHit)" class="pb-glow" opacity="0"/><rect x="-9" y="-4" width="18" height="8" rx="3" fill="#22D3EE" stroke="#ECFEFF"/></g>'; }).join('') +
      '<path d="M30 214L30 248 82 270" fill="none" stroke="#F472B6" stroke-width="4" stroke-linecap="round"/><path d="M212 214L212 248 178 270" fill="none" stroke="#F472B6" stroke-width="4" stroke-linecap="round"/>' +
      '<g id="pbFL" transform="translate(84 270)"><path d="M0-6L40 0 0 6z" fill="#FDE68A" stroke="#B45309" stroke-linejoin="round"/><circle r="6" fill="#F59E0B"/></g>' +
      '<g id="pbFR" transform="translate(176 270)"><path d="M0-6L-40 0 0 6z" fill="#FDE68A" stroke="#B45309" stroke-linejoin="round"/><circle r="6" fill="#F59E0B"/></g>' +
      '<rect x="230" y="250" width="12" height="36" rx="3" fill="#475569" id="pbPlunger"/>' +
      '<g id="pbScore" transform="translate(130 32)"><rect x="-38" y="-11" width="76" height="20" rx="6" fill="#0B0820" stroke="#FDE68A" stroke-opacity=".6"/><text id="pbSc" y="4" text-anchor="middle" font-size="12" font-weight="900" fill="#FDE68A" font-family="monospace">0</text></g>' +
      '<g id="pbBallG" transform="translate(236 244)"><circle r="7" fill="url(#pbBall)"/></g>',
    reset: function (c) { c.qa('.pb-lamp').forEach(function (e) { e.classList.remove('on'); }); c.id('pbJack').classList.remove('on'); c.id('pbSc').textContent = '0'; tr(c.id('pbBallG'), 236, 244); },
    play: async function (c, r) {
      var i = +r.view.i, lamps = i === 6 ? 6 : (i === 0 ? rnd(2) : i + 1), ball = c.id('pbBallG'), score = 0, lit = 0, box = c.box;
      var flash = function (id) { var g = c.id(id).querySelector('.pb-glow'); g.setAttribute('opacity', '1'); if (g.animate) g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' }); };
      var add = function (v) { score += v; c.id('pbSc').textContent = score.toLocaleString('en-US'); };
      var flip = function (side) { var f = c.id(side ? 'pbFR' : 'pbFL'); if (f.animate) f.animate([{ transform: 'translate(' + (side ? 176 : 84) + 'px,270px) rotate(0deg)' }, { transform: 'translate(' + (side ? 176 : 84) + 'px,270px) rotate(' + (side ? 28 : -28) + 'deg)' }, { transform: 'translate(' + (side ? 176 : 84) + 'px,270px) rotate(0deg)' }], { duration: 220 }); };
      // lanceur
      var pl = c.id('pbPlunger');
      await tw(box, 300, function (k) { pl.setAttribute('y', (250 + k * 10).toFixed(1)); });
      pl.setAttribute('y', '250');
      await path(box, ball, [[236, 244], [236, 60], [214, 24], [180, 18]], 520);
      // touches : un bumper ou une cible à chaque coup, la batte renvoie la bille toutes les 2 touches
      var hits = lamps + rnd(2), pos = [180, 18];
      for (var h = 0; h < hits; h++) {
        var isB = h % 3 !== 2, t = isB ? BUMP[rnd(3)] : TARG[rnd(4)], id = isB ? 'pbB' + BUMP.indexOf(t) : 'pbT' + TARG.indexOf(t);
        var dx = t[0] - pos[0], dy = t[1] - pos[1], dd = Math.hypot(dx, dy) || 1, stop = [t[0] - dx / dd * 20, t[1] - dy / dd * 20];
        await path(box, ball, [pos, stop], 380);
        flash(id); add(isB ? 1000 : 2500);
        if (lit < lamps) { var lp = c.qa('.pb-lamp')[lit++]; lp.classList.add('on'); }
        pos = stop;
        if (h % 2 === 1 && h < hits - 1) { var sd = rnd(2), fx = sd ? 160 : 100; await path(box, ball, [pos, [fx, 262]], 380); flip(sd); add(500); pos = [fx, 262]; await path(box, ball, [pos, [sd ? 120 : 140, 170]], 460); pos = [sd ? 120 : 140, 170]; }
      }
      if (i === 6) { await path(box, ball, [pos, [130, 50]], 300); c.id('pbJack').classList.add('on'); add(100000); await tw(box, 400, function (k) { tr(ball, 130, 50, 1 - k * 0.6); }); return; }
      // la bille s'échappe entre les deux battes
      await path(box, ball, [pos, [130, 240], [130, 300]], 300);
    },
    rules: {
      en: '1. Set your stake and tap “Launch”: the ball shoots up into the cosmic pinball table.\n2. Every bumper or target it hits lights a star — the stars lit decide your win.\n3. 2 stars ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · ball in the star hole: jackpot ×100. 0 or 1 star: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : la bille file dans le flipper cosmique.\n2. Chaque bumper ou cible touché allume une étoile : les étoiles allumées décident du gain.\n3. 2 étoiles ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · bille dans le trou étoile : jackpot ×100. 0 ou 1 étoile : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Lanzar»: la bola sale disparada a la mesa de pinball cósmica.\n2. Cada bumper o diana que golpea enciende una estrella: las estrellas encendidas deciden tu premio.\n3. 2 estrellas ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · bola en el agujero estrella: jackpot ×100. 0 o 1 estrella: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Lançar»: a bola dispara para a mesa de pinball cósmica.\n2. Cada bumper ou alvo atingido acende uma estrela: as estrelas acesas decidem o prêmio.\n3. 2 estrelas ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · bola no buraco estrela: jackpot ×100. 0 ou 1 estrela: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «أطلِق»: تنطلق الكرة إلى طاولة البنبول الكونية.\n2. كل مصد أو هدف تصيبه يضيء نجمة: النجوم المضاءة تحدد ربحك.\n3. نجمتان ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · الكرة في فتحة النجمة: جائزة كبرى ×100. 0 أو نجمة واحدة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Fırlat”a dokun: top kozmik langırt masasına fırlar.\n2. Çarptığı her tampon veya hedef bir yıldız yakar: yanan yıldızlar kazancını belirler.\n3. 2 yıldız ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · top yıldız deliğinde: jackpot ×100. 0 veya 1 yıldız: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Phóng»: viên bi lao vào bàn pinball vũ trụ.\n2. Mỗi lần chạm bumper hoặc mục tiêu sẽ thắp một ngôi sao: số sao sáng quyết định tiền thắng.\n3. 2 sao ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · bi vào lỗ ngôi sao: jackpot ×100. 0 hoặc 1 sao: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Luncurkan»: bola melesat ke meja pinball kosmik.\n2. Setiap bumper atau target yang terkena menyalakan bintang: bintang yang menyala menentukan kemenangan.\n3. 2 bintang ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · bola masuk lubang bintang: jackpot ×100. 0 atau 1 bintang: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Запуск»: шарик вылетает на космический стол пинбола.\n2. Каждый бампер или мишень зажигает звезду: число горящих звёзд определяет выигрыш.\n3. 2 звезды ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · шарик в звёздной лунке: джекпот ×100. 0 или 1 звезда — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Starten“: Die Kugel schießt in den kosmischen Flipper.\n2. Jeder getroffene Bumper oder jedes Ziel lässt einen Stern leuchten: Die Sterne bestimmen den Gewinn.\n3. 2 Sterne ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · Kugel im Sternloch: Jackpot ×100. 0 oder 1 Stern: Einsatz verloren.',
      hi: '1. राशि चुनें और «लॉन्च» छुएं: गेंद कॉस्मिक पिनबॉल टेबल में उछलती है।\n2. हर बंपर या टारगेट पर लगने से एक तारा जलता है: जले हुए तारे जीत तय करते हैं।\n3. 2 तारे ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · गेंद तारे वाले छेद में: जैकपॉट ×100। 0 या 1 तारा: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“发射”：弹珠射入宇宙弹珠台。\n2. 每撞到一个弹射器或靶子就点亮一颗星：点亮的星数决定奖金。\n3. 2 颗星 ×0.5 · 3 ×1 · 4 ×2 · 5 ×5 · 6 ×15 · 弹珠进入星洞：大奖 ×100。0 或 1 颗星：输掉下注。'
    }
  });

  /* =============================== HORSESHOE TOSS =============================== */
  // 3 fers : raté 0 pt (5/10) · appuyé 1 pt (3/10) · ceinture 3 pts (2/10) ; ligne = total 0,1,2,3,4,5,6,7,9
  var HS_T = [0, 1, 2, 3, 4, 5, 6, 7, 9], HS_P = [0, 1, 3], HS_W = [5, 3, 2];
  function shoe(col) { return '<path d="M-11 9C-15-2-12-13 0-13S15-2 11 9L6 9C9 0 7-7 0-7S-9 0-6 9z" fill="' + (col || 'url(#hsMet)') + '" stroke="#334155" stroke-width="1"/><circle cx="-9" cy="2" r="1" fill="#1E293B"/><circle cx="9" cy="2" r="1" fill="#1E293B"/><circle cx="-6" cy="-7" r="1" fill="#1E293B"/><circle cx="6" cy="-7" r="1" fill="#1E293B"/>'; }
  game({
    key: 'horseshoe', l: verb('thr'), vb: '0 0 300 240',
    chips: [3, 4, 5, 6, 7, 9].map(function (t, j) { return [(j ? '' : '<defs><linearGradient id="hsI" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F1F5F9"/><stop offset="1" stop-color="#64748B"/></linearGradient></defs>') + '<g transform="scale(.75)">' + shoe('url(#hsI)') + '</g><text y="4" font-size="10" font-weight="900" fill="#FDE68A" text-anchor="middle">' + t + '</text>', [0.8, 1.2, 2, 3, 5, 14][j]]; }),
    chipOf: function (i) { return i >= 3 ? i - 3 : -1; },
    scene: '<defs><linearGradient id="hsMet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8FAFC"/><stop offset=".5" stop-color="#94A3B8"/><stop offset="1" stop-color="#475569"/></linearGradient>' +
      '<linearGradient id="hsGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".5" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient>' +
      '<linearGradient id="hsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E1B4B"/><stop offset="1" stop-color="#7C2D12"/></linearGradient>' +
      '<linearGradient id="hsSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCD34D"/><stop offset="1" stop-color="#B45309"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="560" fill="url(#hsSky)"/><circle cx="60" cy="50" r="18" fill="#FDE68A" opacity=".85"/>' +
      '<path d="M-400 160L40 140 120 150 200 136 300 148 700 140V700H-400z" fill="#3F6212"/><path d="M-400 170H700V700H-400z" fill="#365314"/>' +
      '<ellipse cx="228" cy="196" rx="70" ry="20" fill="url(#hsSand)" stroke="#78350F" stroke-width="3"/>' +
      '<g id="hsLand"></g><rect x="225" y="160" width="6" height="38" rx="2" fill="#78350F"/><circle cx="228" cy="160" r="3.5" fill="#A16207"/>' +
      '<g id="hsTop"></g><g id="hsFly"></g>' +
      // tableau des points (3 fers)
      '<g transform="translate(30 200)"><rect x="-14" y="-16" width="110" height="30" rx="8" fill="#0B0820" opacity=".75" stroke="#FDE68A" stroke-opacity=".4"/>' +
      [0, 1, 2].map(function (j) { return '<g transform="translate(' + (j * 28 + 4) + ' -1)"><circle r="10" fill="#1E1B4B" class="hs-dot" id="hsD' + j + '"/><text id="hsN' + j + '" y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#FDE68A"></text></g>'; }).join('') +
      '<text id="hsTot" x="86" y="4" text-anchor="middle" font-size="13" font-weight="900" fill="#fff"></text></g>',
    reset: function (c) { c.id('hsLand').innerHTML = ''; c.id('hsTop').innerHTML = ''; [0, 1, 2].forEach(function (j) { c.id('hsN' + j).textContent = ''; c.id('hsD' + j).setAttribute('class', 'hs-dot'); }); c.id('hsTot').textContent = ''; },
    play: async function (c, r) {
      var T = HS_T[+r.view.i], combos = [], ws = [];
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) for (var d = 0; d < 3; d++) if (HS_P[a] + HS_P[b] + HS_P[d] === T) { combos.push([a, b, d]); ws.push(HS_W[a] * HS_W[b] * HS_W[d]); }
      var cb = combos[pickW(ws)], fly = c.id('hsFly'), tot = 0;
      for (var s = 0; s < 3; s++) {
        var o = cb[s], miss = o === 0, ex = miss ? [180 + rnd(20), 270 + rnd(20)][rnd(2)] : 228, ey = miss ? 192 + rnd(10) : (o === 2 ? 190 : 176);
        fly.innerHTML = '<g>' + shoe() + '</g>'; var sh = fly.firstChild;
        await tw(c.box, 820, function (k) { var x = lerp(-10, ex, k), y = lerp(200, ey, k) - Math.sin(k * Math.PI) * 120; tr(sh, x, y, 1.15 - 0.25 * k, k * 720); });
        fly.innerHTML = '';
        if (o === 2) { c.id('hsLand').insertAdjacentHTML('beforeend', '<g transform="translate(228 192) scale(1.1 .45)">' + shoe('url(#hsGold)') + '</g>'); c.id('hsTop').insertAdjacentHTML('beforeend', '<g class="hs-ring"><ellipse cx="228" cy="186" rx="20" ry="7" fill="none" stroke="#FDE68A" stroke-width="2.5"/></g>'); }
        else if (o === 1) c.id('hsTop').insertAdjacentHTML('beforeend', '<g transform="translate(' + (220 - s * 2) + ' 178) rotate(-38) scale(.9)">' + shoe() + '</g>');
        else c.id('hsLand').insertAdjacentHTML('beforeend', '<g transform="translate(' + ex + ' ' + ey + ') rotate(' + (rnd(80) - 40) + ') scale(.9 .5)" opacity=".85">' + shoe() + '</g>');
        tot += HS_P[o];
        c.id('hsN' + s).textContent = String(HS_P[o]); c.id('hsD' + s).setAttribute('class', 'hs-dot hs-' + o); c.id('hsTot').textContent = String(tot);
        await wait(c.box, 260);
      }
    },
    rules: {
      en: '1. Set your stake and tap “Throw”: 3 horseshoes fly at the stake.\n2. Each one scores: ringer (around the stake) 3 points · leaner (touching it) 1 point · miss 0.\n3. Total 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (three ringers) ×14. Total 0 to 2: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : 3 fers à cheval volent vers le piquet.\n2. Chaque fer marque : ceinture (autour du piquet) 3 points · appuyé (contre le piquet) 1 point · raté 0.\n3. Total 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (trois ceintures) ×14. Total 0 à 2 : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Lanzar»: 3 herraduras vuelan hacia la estaca.\n2. Cada una puntúa: anillo (alrededor de la estaca) 3 puntos · apoyada (tocándola) 1 punto · fallo 0.\n3. Total 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (tres anillos) ×14. Total de 0 a 2: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Arremessar»: 3 ferraduras voam até a estaca.\n2. Cada uma pontua: anel (em volta da estaca) 3 pontos · encostada 1 ponto · erro 0.\n3. Total 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (três anéis) ×14. Total de 0 a 2: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «ارمِ»: تطير 3 حدوات نحو الوتد.\n2. كل حدوة تسجل: حول الوتد 3 نقاط · مستندة إليه نقطة واحدة · خطأ 0.\n3. المجموع 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (ثلاث حول الوتد) ×14. مجموع من 0 إلى 2: تخسر الرهان.',
      tr: '1. Bahsini seç ve “At”a dokun: 3 at nalı kazığa doğru uçar.\n2. Her biri puan alır: kazığa geçen 3 puan · kazığa dayanan 1 puan · ıska 0.\n3. Toplam 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (üçü de geçti) ×14. Toplam 0–2: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Ném»: 3 móng ngựa bay về phía cọc.\n2. Mỗi chiếc ghi điểm: lọt vào cọc 3 điểm · tựa vào cọc 1 điểm · trượt 0.\n3. Tổng 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (cả ba lọt cọc) ×14. Tổng 0 đến 2: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lempar»: 3 tapal kuda melayang ke tiang.\n2. Masing-masing mencetak poin: melingkari tiang 3 poin · bersandar di tiang 1 poin · meleset 0.\n3. Total 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (tiga melingkar) ×14. Total 0 sampai 2: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бросок»: 3 подковы летят к колышку.\n2. Каждая приносит очки: надета на колышек — 3 · касается его — 1 · мимо — 0.\n3. Сумма 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (три надеты) ×14. Сумма от 0 до 2 — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Werfen“: 3 Hufeisen fliegen auf den Pflock zu.\n2. Jedes punktet: um den Pflock (Ringer) 3 Punkte · angelehnt 1 Punkt · daneben 0.\n3. Summe 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (drei Ringer) ×14. Summe 0 bis 2: Einsatz verloren.',
      hi: '1. राशि चुनें और «फेंकें» छुएं: 3 घोड़े की नाल खूंटे की ओर उड़ती हैं।\n2. हर नाल अंक देती है: खूंटे के चारों ओर 3 अंक · खूंटे से टिकी 1 अंक · चूकी 0।\n3. कुल 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9 (तीनों खूंटे पर) ×14। कुल 0 से 2: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“投掷”：3 只马蹄铁飞向木桩。\n2. 每只得分：套住木桩 3 分 · 靠在木桩上 1 分 · 未中 0 分。\n3. 总分 3 ×0.8 · 4 ×1.2 · 5 ×2 · 6 ×3 · 7 ×5 · 9（三只全套中）×14。总分 0 到 2：输掉下注。'
    }
  });

  /* =============================== HIGH STRIKER =============================== */
  // lignes 0…8 = niveaux 1…9, 9 = cloche, 10 = cloche d'or ; payés : 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · cloche ×20 · cloche d'or ×150
  var LV_Y = function (lv) { return 262 - lv * 21; }; // niveau 1…10 (10 = cloche)
  game({
    key: 'striker', l: verb('strike'), vb: '0 0 260 300',
    chips: [5, 6, 7, 8, 9].map(function (n, j) { return ['<rect x="-9" y="-9" width="18" height="18" rx="5" fill="#7C3AED"/><text y="4.5" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">' + n + '</text>', [0.4, 0.8, 1.5, 3, 6][j]]; })
      .concat([['<path d="M-7 5Q-7-9 0-9T7 5z" fill="#CBD5E1" stroke="#475569"/><circle cy="7" r="2.4" fill="#475569"/>', 20], ['<path d="M-7 5Q-7-9 0-9T7 5z" fill="#FBBF24" stroke="#92400E"/><circle cy="7" r="2.4" fill="#92400E"/>', 150]]),
    chipOf: function (i) { return i >= 4 ? i - 4 : -1; },
    scene: '<defs><linearGradient id="stTw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7F1D1D"/><stop offset=".5" stop-color="#EF4444"/><stop offset="1" stop-color="#7F1D1D"/></linearGradient>' +
      '<linearGradient id="stBellG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#64748B"/><stop offset=".45" stop-color="#F8FAFC"/><stop offset="1" stop-color="#475569"/></linearGradient>' +
      '<linearGradient id="stGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B45309"/><stop offset=".45" stop-color="#FEF3C7"/><stop offset="1" stop-color="#D97706"/></linearGradient>' +
      '<radialGradient id="stGlow" r=".5"><stop offset="0" stop-color="#FDE68A" stop-opacity=".8"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-300" y="-300" width="860" height="900" fill="#12082A"/><path d="M-300 268H560V600H-300z" fill="#2E1065"/>' +
      '<g class="st-bulbs">' + [20, 60, 200, 240].map(function (x, j) { return '<circle cx="' + x + '" cy="' + (40 + (j % 2) * 30) + '" r="3" class="st-bulb" style="animation-delay:' + (j * .3) + 's"/>'; }).join('') + '</g>' +
      // tour graduée
      '<rect x="108" y="40" width="44" height="232" rx="6" fill="url(#stTw)" stroke="#FDE68A" stroke-width="2"/>' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (lv) { var y = LV_Y(lv); return '<g class="st-lv" id="stL' + lv + '"><rect x="112" y="' + (y - 8) + '" width="36" height="16" rx="3"/><text x="130" y="' + (y + 4.5) + '" text-anchor="middle" font-size="11" font-weight="900">' + lv + '</text></g>'; }).join('') +
      '<path d="M130 50V262" stroke="#E2E8F0" stroke-width="1.5" opacity=".8"/>' +
      '<circle id="stHalo" cx="130" cy="36" r="34" fill="url(#stGlow)" opacity="0"/>' +
      '<g id="stBell" transform="translate(130 36)"><path d="M-16 10Q-16-16 0-16T16 10z" fill="url(#stBellG)" stroke="#334155" stroke-width="1.4"/><rect x="-19" y="8" width="38" height="5" rx="2" fill="#475569"/><circle cy="15" r="3" fill="#334155"/></g>' +
      '<g id="stPuck" transform="translate(130 262)"><rect x="-11" y="-6" width="22" height="12" rx="5" fill="#FDE68A" stroke="#92400E" stroke-width="1.4"/></g>' +
      '<path d="M100 272h60l6 12h-72z" fill="#475569"/><rect x="118" y="266" width="24" height="7" rx="2" fill="#EF4444" id="stPad"/>' +
      '<g id="stHam" transform="translate(196 286) rotate(30)"><rect x="-3.5" y="-96" width="7" height="100" rx="3" fill="#D97706" stroke="#78350F"/><rect x="-20" y="-112" width="40" height="22" rx="6" fill="#7C3AED" stroke="#2E1065" stroke-width="1.5"/><rect x="-20" y="-112" width="40" height="7" rx="3" fill="#A78BFA"/></g>',
    reset: function (c) { c.qa('.st-lv').forEach(function (e) { e.classList.remove('on', 'top'); }); c.id('stBell').querySelector('path').setAttribute('fill', 'url(#stBellG)'); c.id('stHalo').setAttribute('opacity', '0'); tr(c.id('stPuck'), 130, 262); },
    play: async function (c, r) {
      var i = +r.view.i, lv = i + 1, bell = lv >= 10, gold = lv === 11, ham = c.id('stHam'), puck = c.id('stPuck');
      await tw(c.box, 380, function (k) { ham.setAttribute('transform', 'translate(196 286) rotate(' + lerp(30, 80, ease(k)).toFixed(1) + ')'); });
      await tw(c.box, 200, function (k) { ham.setAttribute('transform', 'translate(196 286) rotate(' + lerp(80, -72, easeIn(k)).toFixed(1) + ')'); });
      var pad = c.id('stPad'); if (pad.animate) pad.animate([{ transform: 'scaleY(.4)' }, { transform: 'scaleY(1)' }], { duration: 200 });
      var topY = bell ? 54 : LV_Y(lv), y0 = 262, cur = 0;
      await tw(c.box, 300 + (y0 - topY) * 4.2, function (k) {
        var y = lerp(y0, topY, ease(k)); tr(puck, 130, y);
        var l2 = Math.min(9, Math.floor((262 - y) / 21 + 0.5));
        for (; cur < l2; cur++) { var e = c.id('stL' + (cur + 1)); if (e) e.classList.add('on'); }
        ham.setAttribute('transform', 'translate(196 286) rotate(' + lerp(-72, 30, k).toFixed(1) + ')');
      });
      if (bell) {
        var b = c.id('stBell'); if (gold) b.querySelector('path').setAttribute('fill', 'url(#stGold)');
        c.id('stHalo').setAttribute('opacity', '1');
        await tw(c.box, 700, function (k) { b.setAttribute('transform', 'translate(130 36) rotate(' + (Math.sin(k * Math.PI * 7) * 14 * (1 - k)).toFixed(1) + ')'); });
      } else { var t = c.id('stL' + lv); if (t) t.classList.add('top'); }
      await tw(c.box, 600, function (k) { tr(puck, 130, lerp(topY, 262, easeIn(k))); });
    },
    rules: {
      en: '1. Set your stake and tap “Strike”: the hammer slams the pad and the puck flies up the tower.\n2. The height it reaches decides your win.\n3. Level 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · bell ×20 · golden bell ×150. Level 1 to 4: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Frapper » : le marteau frappe la cible et le palet monte dans la tour.\n2. La hauteur atteinte décide du gain.\n3. Niveau 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · cloche ×20 · cloche d’or ×150. Niveau 1 à 4 : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Golpear»: el mazo golpea la base y el disco sube por la torre.\n2. La altura que alcanza decide tu premio.\n3. Nivel 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · campana ×20 · campana de oro ×150. Nivel 1 a 4: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Bater»: o martelo acerta a base e o disco sobe pela torre.\n2. A altura alcançada decide o prêmio.\n3. Nível 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · sino ×20 · sino de ouro ×150. Nível 1 a 4: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «اضرب»: تضرب المطرقة القاعدة فيصعد القرص في البرج.\n2. الارتفاع الذي يبلغه يحدد ربحك.\n3. المستوى 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · الجرس ×20 · الجرس الذهبي ×150. المستوى 1 إلى 4: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Vur”a dokun: çekiç tabana iner, pul kulede yükselir.\n2. Ulaştığı yükseklik kazancını belirler.\n3. Seviye 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · zil ×20 · altın zil ×150. Seviye 1–4: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Đập»: búa nện xuống đế và quả nặng bay lên tháp.\n2. Độ cao đạt được quyết định tiền thắng.\n3. Mức 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · chuông ×20 · chuông vàng ×150. Mức 1 đến 4: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Pukul»: palu menghantam alas dan kepingan melesat naik ke menara.\n2. Ketinggian yang dicapai menentukan kemenangan.\n3. Level 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · lonceng ×20 · lonceng emas ×150. Level 1 sampai 4: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Удар»: молот бьёт по наковальне, шайба взлетает по башне.\n2. Высота, которой она достигла, определяет выигрыш.\n3. Уровень 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · колокол ×20 · золотой колокол ×150. Уровни 1–4 — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Schlagen“: Der Hammer trifft die Platte, der Puck saust den Turm hinauf.\n2. Die erreichte Höhe bestimmt den Gewinn.\n3. Stufe 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · Glocke ×20 · goldene Glocke ×150. Stufe 1 bis 4: Einsatz verloren.',
      hi: '1. राशि चुनें और «मारें» छुएं: हथौड़ा पैड पर पड़ता है और पक टावर पर ऊपर उड़ता है।\n2. वह जितनी ऊंचाई तक पहुंचे, वही जीत तय करती है।\n3. स्तर 5 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · घंटी ×20 · सुनहरी घंटी ×150। स्तर 1 से 4: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“重击”：大锤砸下底座，滑块冲上高塔。\n2. 到达的高度决定奖金。\n3. 第 5 级 ×0.4 · 6 ×0.8 · 7 ×1.5 · 8 ×3 · 9 ×6 · 铃铛 ×20 · 金铃 ×150。第 1 到 4 级：输掉下注。'
    }
  });

  /* =============================== WHACK-A-MOLE =============================== */
  // ligne i = taupes touchées sur 5 (0…5) ; payés : 2 ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5
  var HOLES = []; for (var hr = 0; hr < 3; hr++) for (var hc = 0; hc < 3; hc++) HOLES.push([70 + hc * 80, 92 + hr * 58]);
  function mole() {
    return '<g class="mo-m"><path d="M-17 22V0Q-17-20 0-20T17 0V22z" fill="#92400E" stroke="#451A03" stroke-width="1.3"/><ellipse cy="-2" rx="11" ry="9" fill="#D6A26B"/>' +
      '<circle cx="-6" cy="-9" r="2.6" fill="#1C1917"/><circle cx="6" cy="-9" r="2.6" fill="#1C1917"/><circle cx="-6.8" cy="-9.8" r=".9" fill="#fff"/><circle cx="5.2" cy="-9.8" r=".9" fill="#fff"/>' +
      '<ellipse cy="-3" rx="4" ry="3" fill="#F472B6"/><path d="M-3 2h6v4h-6z" fill="#fff"/></g>';
  }
  game({
    key: 'moles', l: verb('play'), vb: '0 0 300 250',
    chips: [2, 3, 4, 5].map(function (n, j) { return ['<g transform="scale(.42) translate(0 2)">' + mole() + '</g><text x="8" y="10" font-size="9" font-weight="900" fill="#FDE68A" text-anchor="middle">' + n + '</text>', [0.6, 1.5, 3.5, 11.5][j]]; }),
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs><linearGradient id="moG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4ADE80"/><stop offset="1" stop-color="#166534"/></linearGradient>' +
      HOLES.map(function (h, j) { return '<clipPath id="moC' + j + '"><rect x="' + (h[0] - 30) + '" y="' + (h[1] - 60) + '" width="60" height="62"/></clipPath>'; }).join('') + '</defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#14532D"/><rect x="-400" y="-400" width="1100" height="430" fill="#1E3A8A"/>' +
      '<path d="M-400 40Q150 0 700 40V700H-400z" fill="url(#moG)"/>' +
      // compteur 5 coups
      '<g transform="translate(150 22)">' + [0, 1, 2, 3, 4].map(function (j) { return '<circle cx="' + ((j - 2) * 26) + '" r="9" class="mo-dot" id="moD' + j + '"/>'; }).join('') + '</g>' +
      HOLES.map(function (h, j) { return '<g transform="translate(' + h[0] + ' ' + h[1] + ')"><ellipse rx="30" ry="11" fill="#052E16"/><ellipse cy="-2" rx="25" ry="7" fill="#020617"/></g>'; }).join('') +
      HOLES.map(function (h, j) { return '<g clip-path="url(#moC' + j + ')"><g id="moM' + j + '" transform="translate(' + h[0] + ' ' + (h[1] + 30) + ')">' + mole() + '</g></g>'; }).join('') +
      HOLES.map(function (h) { return '<path d="M' + (h[0] - 30) + ' ' + h[1] + 'A30 11 0 0 0 ' + (h[0] + 30) + ' ' + h[1] + '" fill="none" stroke="#86EFAC" stroke-width="3"/>'; }).join('') +
      '<g id="moBam" opacity="0">' + star(16, '#FDE68A') + '</g>' +
      '<g id="moHam" transform="translate(250 230) rotate(20)"><rect x="-3.5" y="-60" width="7" height="64" rx="3" fill="#D97706" stroke="#78350F"/><rect x="-18" y="-76" width="36" height="20" rx="6" fill="#DC2626" stroke="#7F1D1D" stroke-width="1.5"/><rect x="-18" y="-76" width="36" height="6" rx="3" fill="#FCA5A5"/></g>',
    reset: function (c) { for (var j = 0; j < 5; j++) c.id('moD' + j).setAttribute('class', 'mo-dot'); },
    play: async function (c, r) {
      var hits = +r.view.i, seq = shuffle([0, 1, 2, 3, 4].map(function (j) { return j < hits; })), ham = c.id('moHam'), bam = c.id('moBam'), prev = -1;
      for (var s = 0; s < 5; s++) {
        var h; do { h = rnd(9); } while (h === prev); prev = h;
        var hole = HOLES[h], m = c.id('moM' + h), hit = seq[s];
        await tw(c.box, 200, function (k) { tr(m, hole[0], hole[1] + 30 - 30 * ease(k)); });
        // le marteau arrive au-dessus du trou puis frappe
        var hx = hole[0] + 22, hy = hole[1] + 10;
        await tw(c.box, 260, function (k) { ham.setAttribute('transform', 'translate(' + lerp(250, hx, ease(k)).toFixed(1) + ' ' + lerp(230, hy, ease(k)).toFixed(1) + ') rotate(' + lerp(20, -10, k).toFixed(1) + ')'); });
        if (!hit) await tw(c.box, 110, function (k) { tr(m, hole[0], hole[1] + 30 * ease(k)); });
        await tw(c.box, 110, function (k) { ham.setAttribute('transform', 'translate(' + hx + ' ' + hy + ') rotate(' + lerp(-10, -62, easeIn(k)).toFixed(1) + ')'); });
        if (hit) {
          bam.setAttribute('opacity', '1'); tr(bam, hole[0], hole[1] - 22, 1);
          await tw(c.box, 180, function (k) { tr(m, hole[0], hole[1] + 30 * ease(k), 1 + 0.2 * (1 - k)); bam.setAttribute('opacity', (1 - k).toFixed(2)); tr(bam, hole[0], hole[1] - 22, 1 + k * 0.6); });
        }
        c.id('moD' + s).setAttribute('class', 'mo-dot ' + (hit ? 'hit' : 'miss'));
        await tw(c.box, 200, function (k) { ham.setAttribute('transform', 'translate(' + lerp(hx, 250, k).toFixed(1) + ' ' + lerp(hy, 230, k).toFixed(1) + ') rotate(' + lerp(-62, 20, k).toFixed(1) + ')'); });
        tr(m, hole[0], hole[1] + 30);
      }
    },
    rules: {
      en: '1. Set your stake and tap “Play”: 5 moles pop up one after another and the hammer strikes each one.\n2. Every mole hit lights a dot — the number of hits decides your win.\n3. 2 hits ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 or 1 hit: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Jouer » : 5 taupes sortent l’une après l’autre et le marteau frappe chacune.\n2. Chaque taupe touchée allume un point : le nombre de touches décide du gain.\n3. 2 touches ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 ou 1 touche : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Jugar»: salen 5 topos uno tras otro y el mazo golpea a cada uno.\n2. Cada topo golpeado enciende un punto: el número de aciertos decide tu premio.\n3. 2 aciertos ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 o 1 acierto: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Jogar»: 5 toupeiras surgem uma após a outra e o martelo bate em cada uma.\n2. Cada toupeira atingida acende um ponto: o número de acertos decide o prêmio.\n3. 2 acertos ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 ou 1 acerto: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «العب»: تخرج 5 خلدان واحدًا تلو الآخر وتضرب المطرقة كل واحد.\n2. كل خلد مصاب يضيء نقطة: عدد الإصابات يحدد ربحك.\n3. إصابتان ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 أو إصابة واحدة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Oyna”ya dokun: 5 köstebek sırayla çıkar ve çekiç her birine vurur.\n2. Vurulan her köstebek bir nokta yakar: isabet sayısı kazancını belirler.\n3. 2 isabet ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 veya 1 isabet: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Chơi»: 5 chú chuột chũi lần lượt trồi lên và búa đập từng con.\n2. Mỗi con bị đập trúng thắp một chấm: số lần trúng quyết định tiền thắng.\n3. 2 lần trúng ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 hoặc 1 lần: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Main»: 5 tikus tanah muncul bergantian dan palu memukul masing-masing.\n2. Setiap tikus yang kena menyalakan titik: jumlah pukulan kena menentukan kemenangan.\n3. 2 kena ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 atau 1 kena: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Играть»: 5 кротов вылезают по очереди, молоток бьёт по каждому.\n2. Каждое попадание зажигает точку: число попаданий определяет выигрыш.\n3. 2 попадания ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 или 1 попадание — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Spielen“: 5 Maulwürfe tauchen nacheinander auf, der Hammer schlägt auf jeden.\n2. Jeder Treffer lässt einen Punkt leuchten: Die Zahl der Treffer bestimmt den Gewinn.\n3. 2 Treffer ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5. 0 oder 1 Treffer: Einsatz verloren.',
      hi: '1. राशि चुनें और «खेलें» छुएं: 5 छछूंदर एक-एक कर निकलते हैं और हथौड़ा हर एक पर पड़ता है।\n2. हर लगी चोट एक बिंदु जलाती है: लगी चोटों की संख्या जीत तय करती है।\n3. 2 चोट ×0.6 · 3 ×1.5 · 4 ×3.5 · 5 ×11.5। 0 या 1 चोट: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“开始”：5 只地鼠依次冒出，锤子逐一敲打。\n2. 每打中一只点亮一个圆点：打中的次数决定奖金。\n3. 打中 2 次 ×0.6 · 3 次 ×1.5 · 4 次 ×3.5 · 5 次 ×11.5。0 或 1 次：输掉下注。'
    }
  });

  /* =============================== DOMINO RALLY =============================== */
  // 40 dominos sur 4 rangées de 10. Ligne 0 : s'arrête avant le 10e · 1 : 10–19 · 2 : 20–29 · 3 : 30–39 · 4 : les 40 + la cloche · 5 : domino d'or
  var DOM = []; (function () { for (var row = 0; row < 4; row++) for (var k = 0; k < 10; k++) { var x = row % 2 ? 252 - k * 22 : 48 + k * 22; DOM.push([x, 66 + row * 46, row % 2 ? -1 : 1]); } })();
  game({
    key: 'domino', l: verb('push'), vb: '0 0 300 260',
    chips: [10, 20, 30].map(function (n, j) { return ['<rect x="-4" y="-9" width="8" height="18" rx="2" fill="#F8FAFC" stroke="#334155"/><text x="7" y="8" font-size="8" font-weight="900" fill="#FDE68A" text-anchor="middle">' + n + '</text>', [0.5, 1.2, 2.5][j]]; })
      .concat([['<path d="M-7 5Q-7-9 0-9T7 5z" fill="#CBD5E1" stroke="#475569"/><circle cy="7" r="2.4" fill="#475569"/>', 6], ['<rect x="-4" y="-9" width="8" height="18" rx="2" fill="#FBBF24" stroke="#92400E"/>', 30]]),
    chipOf: function (i) { return i - 1; },
    scene: '<defs><linearGradient id="doF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E3A8A"/><stop offset="1" stop-color="#312E81"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0F0B2E"/><rect x="18" y="34" width="264" height="206" rx="18" fill="url(#doF)" stroke="#818CF8" stroke-opacity=".5" stroke-width="2"/>' +
      '<path d="M40 66H262Q278 66 278 89T262 112H40Q22 112 22 135T40 158H262Q278 158 278 181T262 204H40" fill="none" stroke="#6366F1" stroke-opacity=".35" stroke-width="20" stroke-linecap="round"/>' +
      [10, 20, 30].map(function (n, j) { var p = DOM[n - 1]; return '<g transform="translate(' + (p[0] + p[2] * 18) + ' ' + (p[1] - 18) + ')"><path d="M0 0V-16" stroke="#E2E8F0" stroke-width="1.4"/><path d="M0-16L12-12 0-8z" fill="#F472B6"/><text x="3" y="10" font-size="8" font-weight="900" fill="#FDE68A">' + n + '</text></g>'; }).join('') +
      '<g id="doBell" transform="translate(30 204)"><path d="M-9 6Q-9-10 0-10T9 6z" fill="#CBD5E1" stroke="#475569"/><circle cy="8" r="2.4" fill="#475569"/></g>' +
      '<g id="doGold" transform="translate(30 232)" opacity=".9"><rect x="-6" y="-12" width="12" height="24" rx="2" fill="#FBBF24" stroke="#92400E" stroke-width="1.2"/><circle cy="-5" r="1.6" fill="#92400E"/><circle cy="5" r="1.6" fill="#92400E"/></g>' +
      '<g id="doSet"></g><g id="doFinger" transform="translate(20 66)" opacity="0"><circle r="7" fill="#FDBA74"/></g>',
    init: function (c) {
      c.set = function (gapAt) {
        c.id('doSet').innerHTML = DOM.map(function (p, j) {
          var off = j > gapAt && gapAt >= 0 && Math.floor(j / 10) === Math.floor(gapAt / 10) ? p[2] * 6 : 0; // le domino après l'arrêt est un peu trop loin
          if (gapAt >= 0 && j === gapAt + 1 && j % 10 === 0) off = 0;
          return '<g class="do-d" data-x="' + (p[0] + off) + '" data-y="' + p[1] + '" transform="translate(' + (p[0] + off) + ' ' + p[1] + ')"><rect x="-4" y="-12" width="8" height="24" rx="2" class="do-r"/><circle cy="-6" r="1.5" class="do-p"/><circle cy="6" r="1.5" class="do-p"/></g>';
        }).join('');
      };
      c.set(-1);
    },
    reset: function (c) { c.set(-1); c.id('doBell').removeAttribute('class'); c.id('doGold').removeAttribute('class'); },
    play: async function (c, r) {
      var i = +r.view.i, n = i >= 4 ? 40 : (i === 0 ? 3 + rnd(7) : i * 10 + rnd(10)); // nombre de dominos qui tombent
      if (n < 40) c.set(n - 1);
      var ds = c.qa('.do-d'), f = c.id('doFinger');
      f.setAttribute('opacity', '1');
      await tw(c.box, 300, function (k) { tr(f, lerp(14, 36, ease(k)), 66); });
      f.setAttribute('opacity', '0');
      var per = lite() ? 40 : 70;
      await tw(c.box, n * per + 200, function (k) {
        var t = k * (n * per + 200) / per;
        for (var j = 0; j < n; j++) {
          var kk = Math.max(0, Math.min(1, t - j)), d = ds[j], p = DOM[j];
          if (kk <= 0 || d._done) continue;
          var x = +d.getAttribute('data-x'), dir = p[2];
          d.setAttribute('transform', 'translate(' + (x + dir * 8 * kk).toFixed(1) + ' ' + p[1] + ') rotate(' + (90 * kk * dir).toFixed(0) + ') scale(1 ' + (1 - 0.35 * kk).toFixed(2) + ')');
          if (kk >= 1) { d._done = 1; d.classList.add('down'); }
        }
      });
      if (n === 40) {
        c.id('doBell').setAttribute('class', 'do-ring');
        if (i === 5) { c.id('doGold').setAttribute('class', 'do-win'); }
        await wait(c.box, 500);
      } else {
        var nx = ds[n]; if (nx && nx.animate) nx.animate([{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 500 });
        await wait(c.box, 300);
      }
    },
    rules: {
      en: '1. Set your stake and tap “Push”: the first of 40 dominoes tips over and the chain starts.\n2. A gap can stop the chain — the number of dominoes that fall decides your win.\n3. 10+ ×0.5 · 20+ ×1.2 · 30+ ×2.5 · all 40 ring the bell ×6 · golden domino ×30. Fewer than 10: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Pousser » : le premier des 40 dominos bascule et la chaîne démarre.\n2. Un écart peut arrêter la chaîne : le nombre de dominos tombés décide du gain.\n3. 10 et plus ×0.5 · 20+ ×1.2 · 30+ ×2.5 · les 40 font sonner la cloche ×6 · domino d’or ×30. Moins de 10 : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Empujar»: cae la primera de 40 fichas de dominó y empieza la cadena.\n2. Un hueco puede parar la cadena: el número de fichas caídas decide tu premio.\n3. 10+ ×0.5 · 20+ ×1.2 · 30+ ×2.5 · las 40 tocan la campana ×6 · dominó de oro ×30. Menos de 10: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Empurrar»: a primeira de 40 peças de dominó cai e a corrente começa.\n2. Um espaço pode parar a corrente: o número de peças derrubadas decide o prêmio.\n3. 10+ ×0.5 · 20+ ×1.2 · 30+ ×2.5 · as 40 tocam o sino ×6 · dominó dourado ×30. Menos de 10: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «ادفع»: تسقط أول قطعة من 40 قطعة دومينو وتبدأ السلسلة.\n2. قد توقف فجوةٌ السلسلة: عدد القطع التي تسقط يحدد ربحك.\n3. 10 فأكثر ×0.5 · 20+ ×1.2 · 30+ ×2.5 · الأربعون تقرع الجرس ×6 · الدومينو الذهبي ×30. أقل من 10: تخسر الرهان.',
      tr: '1. Bahsini seç ve “İt”e dokun: 40 domino taşının ilki devrilir ve zincir başlar.\n2. Bir boşluk zinciri durdurabilir: devrilen taş sayısı kazancını belirler.\n3. 10+ ×0.5 · 20+ ×1.2 · 30+ ×2.5 · 40’ı da zili çalar ×6 · altın domino ×30. 10’dan az: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Đẩy»: quân đầu tiên trong 40 quân domino đổ và chuỗi bắt đầu.\n2. Một khoảng hở có thể chặn chuỗi: số quân đổ quyết định tiền thắng.\n3. Từ 10 ×0.5 · 20+ ×1.2 · 30+ ×2.5 · đủ 40 rung chuông ×6 · domino vàng ×30. Dưới 10: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Dorong»: domino pertama dari 40 jatuh dan rantai dimulai.\n2. Celah bisa menghentikan rantai: jumlah domino yang jatuh menentukan kemenangan.\n3. 10+ ×0.5 · 20+ ×1.2 · 30+ ×2.5 · ke-40 membunyikan lonceng ×6 · domino emas ×30. Kurang dari 10: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Толкнуть»: первая из 40 костяшек падает, и цепочка запускается.\n2. Зазор может остановить цепочку: число упавших костяшек определяет выигрыш.\n3. 10+ ×0.5 · 20+ ×1.2 · 30+ ×2.5 · все 40 звонят в колокол ×6 · золотое домино ×30. Меньше 10 — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Anstoßen“: Der erste von 40 Dominosteinen kippt, die Kette läuft.\n2. Eine Lücke kann die Kette stoppen: Die Zahl der gefallenen Steine bestimmt den Gewinn.\n3. 10+ ×0.5 · 20+ ×1.2 · 30+ ×2.5 · alle 40 läuten die Glocke ×6 · goldener Dominostein ×30. Weniger als 10: Einsatz verloren.',
      hi: '1. राशि चुनें और «धकेलें» छुएं: 40 डोमिनो में से पहला गिरता है और श्रृंखला शुरू होती है।\n2. कोई खाली जगह श्रृंखला रोक सकती है: गिरे डोमिनो की संख्या जीत तय करती है।\n3. 10+ ×0.5 · 20+ ×1.2 · 30+ ×2.5 · सभी 40 घंटी बजाएं ×6 · सुनहरा डोमिनो ×30। 10 से कम: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“推倒”：40 块多米诺骨牌中的第一块倒下，连锁开始。\n2. 间隙可能让连锁中断：倒下的骨牌数量决定奖金。\n3. 10 块以上 ×0.5 · 20+ ×1.2 · 30+ ×2.5 · 全部 40 块敲响铃铛 ×6 · 金色骨牌 ×30。少于 10 块：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
