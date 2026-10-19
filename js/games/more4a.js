/* v2830 — more4a (owner request, round 5): Coin Pusher, Big Catch, Gumball Machine, Jewel Boutique, Piñata — new instant games; the scene always shows exactly the line the server drew (casino_ext/more4.php). */
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
    en: { drop: 'Drop', cast: 'Cast', turn: 'Turn', open: 'Open', hit: 'Hit' },
    fr: { drop: 'Lâcher', cast: 'Lancer', turn: 'Tourner', open: 'Ouvrir', hit: 'Frapper' },
    es: { drop: 'Soltar', cast: 'Lanzar', turn: 'Girar', open: 'Abrir', hit: 'Golpear' },
    pt: { drop: 'Soltar', cast: 'Lançar', turn: 'Girar', open: 'Abrir', hit: 'Bater' },
    ar: { drop: 'أسقِط', cast: 'ارمِ', turn: 'أدِر', open: 'افتح', hit: 'اضرب' },
    tr: { drop: 'Bırak', cast: 'At', turn: 'Çevir', open: 'Aç', hit: 'Vur' },
    vi: { drop: 'Thả', cast: 'Quăng câu', turn: 'Quay', open: 'Mở', hit: 'Đập' },
    id: { drop: 'Jatuhkan', cast: 'Lempar', turn: 'Putar', open: 'Buka', hit: 'Pukul' },
    ru: { drop: 'Бросить', cast: 'Забросить', turn: 'Крутить', open: 'Открыть', hit: 'Бить' },
    de: { drop: 'Einwerfen', cast: 'Auswerfen', turn: 'Drehen', open: 'Öffnen', hit: 'Schlagen' },
    hi: { drop: 'डालें', cast: 'फेंकें', turn: 'घुमाएं', open: 'खोलें', hit: 'मारें' },
    zh: { drop: '投币', cast: '抛竿', turn: '转动', open: '打开', hit: '敲打' }
  };
  function verb(k) { return function () { var v = Lx(V); return { verb: v[k] }; }; }

  /* =============================== COIN PUSHER =============================== */
  var GOLD = '<linearGradient id="cpG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".45" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient>';
  function coin(cls, x, y, s) {
    return '<g class="' + cls + '" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><ellipse cy="3" rx="13" ry="5.4" fill="#92400E"/><ellipse rx="13" ry="5.4" fill="url(#cpG)"/>' +
      '<ellipse rx="8.6" ry="3.2" fill="none" stroke="#B45309" stroke-width="1.1" opacity=".7"/><path d="M-6-2.6Q-1-4.4 4-3.6" stroke="#fff" stroke-width="1.3" fill="none" opacity=".75" stroke-linecap="round"/></g>';
  }
  function barSvg() {
    return '<path d="M-17 4L-12-6H12L17 4z" fill="#B45309"/><path d="M-12-6L-9-12H9L12-6z" fill="#FDE68A"/><path d="M-17 4L-12-6H12L17 4L14 8H-14z" fill="url(#cpG)" stroke="#92400E" stroke-width=".8"/>' +
      '<path d="M-9-10H5" stroke="#fff" stroke-width="1.4" opacity=".8" stroke-linecap="round"/>';
  }
  var cpIco = function (n) { // n pièces empilées
    var s = ''; for (var i = 0; i < Math.min(n, 3); i++) s += '<ellipse cy="' + (5 - i * 4) + '" rx="8" ry="3.2" fill="url(#m4ico)" stroke="#92400E" stroke-width=".8"/>';
    return s + (n > 3 ? '<text x="9" y="9" font-size="9" font-weight="900" fill="#FDE68A" text-anchor="middle">' + n + '</text>' : '');
  };
  var ICODEF = '<defs><linearGradient id="m4ico" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".5" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient></defs>';
  var FRONT = [52, 84, 117, 150, 183, 216, 248];
  game({
    key: 'coinpush', l: verb('drop'), vb: '0 0 300 250',
    chips: [[ICODEF + cpIco(1), 0.4], [cpIco(2), 1], [cpIco(3), 2], [cpIco(4), 4], [cpIco(5), 10], ['<g transform="scale(.62)">' + barSvg().replace(/url\(#cpG\)/g, 'url(#m4ico)') + '</g>', 50]],
    chipOf: function (i) { return i > 0 ? i - 1 : -1; },
    scene: '<defs>' + GOLD + '<linearGradient id="cpShelf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B1F7A"/><stop offset="1" stop-color="#6D28D9"/></linearGradient>' +
      '<linearGradient id="cpPushG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4B5FD"/><stop offset="1" stop-color="#5B21B6"/></linearGradient>' +
      '<radialGradient id="cpGlowG" r=".5"><stop offset="0" stop-color="#FBBF24" stop-opacity=".55"/><stop offset="1" stop-color="#FBBF24" stop-opacity="0"/></radialGradient></defs>' +
      // cabinet
      '<rect x="8" y="6" width="284" height="238" rx="22" fill="#1A0F3D" stroke="#FBBF24" stroke-opacity=".55" stroke-width="2"/>' +
      '<rect x="20" y="16" width="260" height="40" rx="12" fill="#0E0826"/><g class="cp-bulbs">' + [40, 70, 100, 130, 160, 190, 220, 250].map(function (x, i) { return '<circle cx="' + x + '" cy="36" r="4" class="cp-bulb" style="animation-delay:' + (i * 0.15) + 's"/>'; }).join('') + '</g>' +
      '<rect x="138" y="56" width="24" height="8" rx="3" fill="#0B0620" stroke="#FBBF24" stroke-width="1"/>' +
      // plateau en perspective
      '<path d="M62 92H238L272 182H28z" fill="url(#cpShelf)"/><path d="M28 182H272L268 190H32z" fill="#FBBF24" opacity=".8"/>' +
      '<g id="cpPush"><rect x="62" y="66" width="176" height="28" rx="4" fill="url(#cpPushG)"/><path d="M66 70H234" stroke="#fff" stroke-opacity=".5" stroke-width="2"/></g>' +
      '<g id="cpBack"></g><g id="cpFront"></g><g id="cpBar"></g><g id="cpDrop"></g>' +
      // bac des gains
      '<ellipse cx="150" cy="226" rx="110" ry="16" fill="url(#cpGlowG)" id="cpGlow" opacity="0"/>' +
      '<path d="M40 204H260L250 238H50z" fill="#0E0826" stroke="#FBBF24" stroke-opacity=".5"/><g id="cpWon"></g>' +
      '<path d="M40 204H260" stroke="#FBBF24" stroke-width="2"/>',
    init: function (c) {
      var back = ''; for (var r = 0; r < 3; r++) for (var j = 0; j < 7 - (r === 0 ? 1 : 0); j++) {
        var y = 104 + r * 19, x = 78 + j * 25 + (r % 2) * 12 - r * 4 + (r === 0 ? 12 : 0), s = 0.7 + r * 0.1;
        back += coin('cp-c', (x + (K.seeded(r, j) - 0.5) * 6).toFixed(0), y, s.toFixed(2));
      }
      c.id('cpBack').innerHTML = back;
      c.front = function () {
        c.id('cpFront').innerHTML = FRONT.map(function (x, i) { return coin('cp-f', x + (K.seeded(i, 3) - 0.5) * 6, 168 + (i % 2) * 4, 1); }).join('');
        c.id('cpBar').innerHTML = '<g class="cp-bar" transform="translate(150 158)">' + barSvg() + '</g>';
      };
      c.front();
    },
    play: async function (c, r) {
      var i = +r.view.i, n = i === 6 ? 0 : i, bar = i === 6;
      var drop = c.id('cpDrop'), x = 110 + rnd(80);
      drop.innerHTML = coin('cp-d', x, -20, 0.85);
      var d = drop.firstChild;
      await tw(c.box, 520, function (k) { tr(d, x, lerp(40, 98, easeIn(k)), 0.85); });
      await tw(c.box, 160, function (k) { tr(d, x, 98 - Math.sin(k * Math.PI) * 6, 0.85); });
      // le poussoir avance : tout glisse vers le bord, n pièces (ou le lingot) tombent
      var push = c.id('cpPush'), back = c.id('cpBack'), fr = c.qa('.cp-f'), falls = shuffle(fr.slice()).slice(0, n), barEl = c.q('.cp-bar');
      var base = fr.map(function (e) { var m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(e.getAttribute('transform')); return [+m[1], +m[2]]; });
      await tw(c.box, 700, function (k) {
        var e = Math.sin(k * Math.PI / 2);
        push.setAttribute('transform', 'translate(0 ' + (e * 16).toFixed(1) + ')');
        back.setAttribute('transform', 'translate(0 ' + (e * 7).toFixed(1) + ')');
        tr(d, x, 98 + e * 9, 0.85);
        fr.forEach(function (f, j) { tr(f, base[j][0], base[j][1] + e * (falls.indexOf(f) >= 0 ? 10 : 4), 1); });
        if (barEl) tr(barEl, 150, 158 + e * (bar ? 12 : 5), 1);
      });
      var glow = c.id('cpGlow');
      var fallers = falls.map(function (f) { return [f, base[fr.indexOf(f)][0]]; });
      if (bar) fallers.push([barEl, 150]);
      await tw(c.box, 760, function (k) {
        fallers.forEach(function (f, j) {
          var kk = Math.max(0, Math.min(1, k * 1.3 - j * 0.06)), y = 178 + 44 * easeIn(kk);
          tr(f[0], f[1] + (150 - f[1]) * 0.15 * kk, y, 1 - 0.2 * kk, (j % 2 ? 1 : -1) * 70 * kk);
        });
        glow.setAttribute('opacity', fallers.length ? (0.9 * k).toFixed(2) : '0');
      });
      // les gains restent dans le bac
      c.id('cpWon').innerHTML = fallers.map(function (f, j) { return bar && j === fallers.length - 1 ? '<g transform="translate(150 220) scale(.9)">' + barSvg() + '</g>' : coin('', 70 + j * 32 + (5 - n) * 16, 222, 0.8); }).join('');
      fallers.forEach(function (f) { f[0].style.opacity = '0'; });
      c.box.classList.toggle('m4-big', bar || n >= 4);
    },
    reset: function (c) { c.id('cpWon').innerHTML = ''; c.box.classList.remove('m4-big'); },
    after: async function (c) {
      await wait(c.box, 500);
      var push = c.id('cpPush'), back = c.id('cpBack'), d = c.q('.cp-d');
      await tw(c.box, 380, function (k) { var e = 1 - k; push.setAttribute('transform', 'translate(0 ' + (e * 16).toFixed(1) + ')'); back.setAttribute('transform', 'translate(0 ' + (e * 7).toFixed(1) + ')'); });
      // la pièce lâchée rejoint le tas ; le premier rang est reconstruit
      if (d) d.remove();
      c.front(); c.id('cpGlow').setAttribute('opacity', '0');
      c.qa('.cp-f,.cp-bar').forEach(function (e) { if (e.animate) e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); });
    },
    rules: {
      en: '1. Set your stake and tap “Drop”: your coin falls onto the moving shelf.\n2. The pusher shoves the coins forward: whatever falls over the edge is your win.\n3. 1 coin ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · gold bar ×50. Nothing falls: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lâcher » : ta pièce tombe sur le plateau mobile.\n2. Le poussoir avance : tout ce qui tombe du bord est pour toi.\n3. 1 pièce ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · lingot d’or ×50. Rien ne tombe : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Soltar»: tu moneda cae sobre la bandeja móvil.\n2. El empujador mueve las monedas: lo que cae por el borde es tu premio.\n3. 1 moneda ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · lingote de oro ×50. Si no cae nada, pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Soltar»: sua moeda cai na bandeja móvel.\n2. O empurrador avança: o que cair pela borda é o seu prêmio.\n3. 1 moeda ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · barra de ouro ×50. Se nada cair, a aposta é perdida.',
      ar: '1. اختر الرهان والمس «أسقِط»: تسقط عملتك على الرف المتحرك.\n2. يدفع الدافع العملات إلى الأمام: كل ما يسقط من الحافة لك.\n3. عملة واحدة ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · سبيكة ذهب ×50. إن لم يسقط شيء تخسر الرهان.',
      tr: '1. Bahsini seç ve “Bırak”a dokun: paran hareketli rafa düşer.\n2. İtici paraları öne iter: kenardan düşen her şey senin.\n3. 1 para ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · altın külçe ×50. Hiçbir şey düşmezse bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Thả»: đồng xu rơi xuống kệ đang chuyển động.\n2. Thanh đẩy dồn xu về phía trước: xu rơi khỏi mép là tiền thắng của bạn.\n3. 1 xu ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · thỏi vàng ×50. Không rơi gì: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Jatuhkan»: koinmu jatuh ke rak yang bergerak.\n2. Pendorong menggeser koin ke depan: yang jatuh dari tepi adalah kemenanganmu.\n3. 1 koin ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · batangan emas ×50. Tidak ada yang jatuh: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бросить»: монета падает на движущуюся полку.\n2. Толкатель сдвигает монеты вперёд: всё, что упало с края, — ваш выигрыш.\n3. 1 монета ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · золотой слиток ×50. Ничего не упало — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Einwerfen“: Deine Münze fällt auf die bewegte Ablage.\n2. Der Schieber drückt die Münzen nach vorn: Was über die Kante fällt, gewinnst du.\n3. 1 Münze ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · Goldbarren ×50. Fällt nichts, ist der Einsatz verloren.',
      hi: '1. राशि चुनें और «डालें» छुएं: आपका सिक्का चलती शेल्फ़ पर गिरता है।\n2. पुशर सिक्कों को आगे धकेलता है: किनारे से जो गिरे, वह आपकी जीत है।\n3. 1 सिक्का ×0.4 · 2 ×1 · 3 ×2 · 4 ×4 · 5 ×10 · सोने की ईंट ×50। कुछ न गिरे तो दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“投币”：硬币落到移动的平台上。\n2. 推板把硬币向前推：从边缘掉下的都归你。\n3. 1 枚 ×0.4 · 2 枚 ×1 · 3 枚 ×2 · 4 枚 ×4 · 5 枚 ×10 · 金条 ×50。什么都没掉：输掉下注。'
    }
  });

  /* =============================== BIG CATCH (pêche) =============================== */
  // 0 hameçon vide · 1 vieille botte · 2 sardine · 3 perche · 4 bar · 5 saumon · 6 espadon · 7 poisson d'or
  var FISH = [null, null, ['#E2E8F0', '#64748B', 0.55], ['#BEF264', '#3F6212', 0.7], ['#6EE7B7', '#065F46', 0.85], ['#FDBA74', '#C2410C', 0.95], ['#93C5FD', '#1E3A8A', 1.15], ['#FDE68A', '#B45309', 1.05]];
  function fishSvg(t, gid) {
    if (t === 1) return '<path d="M-8-14H4V2L14 4Q18 6 16 10H-8z" fill="#7C2D12" stroke="#431407" stroke-width="1.2"/><path d="M-8 10H16" stroke="#431407" stroke-width="2.5"/><path d="M-5-10H1" stroke="#FDBA74" stroke-width="1" opacity=".6"/>';
    var f = FISH[t], s = f[2];
    var body = '<g transform="scale(' + s + ')"><path d="M-22 0C-14-13 8-14 18-3L28-12V12L18 3C8 14-14 13-22 0z" fill="url(#' + gid + t + ')" stroke="' + f[1] + '" stroke-width="1.4"/>' +
      '<path d="M-4-9Q2-17 8-9" fill="' + f[1] + '" opacity=".75"/><circle cx="-13" cy="-2" r="2.4" fill="#0F172A"/><circle cx="-13.8" cy="-2.8" r=".8" fill="#fff"/>' +
      (t === 3 ? '<path d="M-6-8V8M0-9V9M6-8V8" stroke="#3F6212" stroke-width="2" opacity=".55"/>' : '') +
      (t === 6 ? '<path d="M-22-1L-42-3L-22 2z" fill="#1E3A8A"/>' : '') +
      '<path d="M-14 4Q0 9 12 3" stroke="#fff" stroke-width="1.4" fill="none" opacity=".45"/></g>';
    return body;
  }
  function fishDefs(gid) {
    return FISH.map(function (f, i) { return f ? '<linearGradient id="' + gid + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="' + f[0] + '"/><stop offset="1" stop-color="' + f[1] + '"/></linearGradient>' : ''; }).join('');
  }
  game({
    key: 'fishing', l: verb('cast'), vb: '0 0 300 250',
    chips: [2, 3, 4, 5, 6, 7].map(function (t, j) { return [(j ? '' : '<defs>' + fishDefs('fiI') + '</defs>') + '<g transform="scale(.42)">' + fishSvg(t, 'fiI') + '</g>', [0.5, 1.2, 2.5, 6, 20, 200][j]]; }),
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs>' + fishDefs('fiG') + '<linearGradient id="fiSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E1B4B"/><stop offset="1" stop-color="#6D28D9"/></linearGradient>' +
      '<linearGradient id="fiSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4338CA"/><stop offset="1" stop-color="#0B0A2A"/></linearGradient>' +
      '<radialGradient id="fiMoon" r=".5"><stop offset="0" stop-color="#FEF9C3"/><stop offset=".6" stop-color="#FDE68A" stop-opacity=".5"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="520" fill="url(#fiSky)"/><circle cx="226" cy="44" r="30" fill="url(#fiMoon)"/><circle cx="226" cy="44" r="13" fill="#FEF9C3"/>' +
      '<path d="M-400 100L-60 104L20 82 70 98 120 84 170 100 230 86 300 98 360 90L700 96V120H-400z" fill="#2E1065"/>' +
      '<rect x="-400" y="112" width="1100" height="600" fill="url(#fiSea)"/><path d="M196 118h60M206 128h40M214 138h26" stroke="#FEF9C3" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>' +
      '<g class="fi-waves" stroke="#A5B4FC" stroke-opacity=".35" fill="none" stroke-width="1.4"><path d="M10 150q10-4 20 0t20 0M100 170q10-4 20 0t20 0M40 200q10-4 20 0t20 0M150 214q10-4 20 0t20 0"/></g>' +
      // barque + canne
      '<path d="M-10 216H90L78 236H2z" fill="#7C2D12" stroke="#431407" stroke-width="1.5"/><path d="M-10 216H90" stroke="#FDBA74" stroke-width="2"/>' +
      '<path d="M48 214L118 128" stroke="#D6B98C" stroke-width="3" stroke-linecap="round"/><circle cx="58" cy="203" r="5" fill="#475569" stroke="#CBD5E1"/>' +
      '<path id="fiLine" d="M118 128L118 128" stroke="#E2E8F0" stroke-width=".9" fill="none" opacity=".85"/>' +
      '<g id="fiRip" opacity="0"><ellipse rx="10" ry="3" fill="none" stroke="#C7D2FE" stroke-width="1.2"/><ellipse rx="18" ry="5" fill="none" stroke="#C7D2FE" stroke-width="1" opacity=".6"/></g>' +
      '<g id="fiBob" transform="translate(118 128)"><circle r="4.5" fill="#EF4444"/><path d="M-4.5 0A4.5 4.5 0 0 0 4.5 0z" fill="#fff"/><path d="M0-4.5V-10" stroke="#fff" stroke-width="1.2"/></g>' +
      '<g id="fiCatch" opacity="0"></g><g id="fiSpark" opacity="0">' + [0, 60, 120, 180, 240, 300].map(function (a) { return '<path d="M0-26V-36" transform="rotate(' + a + ')" stroke="#FDE68A" stroke-width="2.5" stroke-linecap="round"/>'; }).join('') + '</g>',
    init: function (c) { c.line = function (x, y, sag) { c.id('fiLine').setAttribute('d', 'M118 128Q' + ((118 + x) / 2).toFixed(1) + ' ' + (Math.max(128, y) + (sag || 0)).toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1)); }; },
    reset: function (c) { c.id('fiCatch').setAttribute('opacity', '0'); c.id('fiSpark').setAttribute('opacity', '0'); tr(c.id('fiBob'), 118, 128); c.line(118, 128, 0); },
    play: async function (c, r) {
      var i = +r.view.i, bob = c.id('fiBob'), rip = c.id('fiRip'), tx = 170 + rnd(70), ty = 150 + rnd(40);
      // lancer : le bouchon décrit un arc jusqu'à l'eau
      await tw(c.box, 750, function (k) { var x = lerp(118, tx, k), y = lerp(128, ty, k) - Math.sin(k * Math.PI) * 70; tr(bob, x, y); c.line(x, y, -10 * (1 - k)); });
      rip.setAttribute('opacity', '1');
      await tw(c.box, 500, function (k) { tr(rip, tx, ty + 2, 0.4 + k); rip.setAttribute('opacity', (1 - k).toFixed(2)); });
      // attente : petites touches puis la vraie touche (ou rien)
      var nib = 2 + rnd(2);
      for (var n = 0; n < nib; n++) {
        await tw(c.box, 420, function (k) { var y = ty + Math.sin(k * Math.PI) * 3; tr(bob, tx, y); c.line(tx, y, 6); });
        await wait(c.box, 120 + rnd(200));
      }
      if (i > 0) {
        await tw(c.box, 260, function (k) { var y = ty + Math.sin(Math.min(1, k * 1.2) * Math.PI / 2) * 9; tr(bob, tx, y); c.line(tx, y, 0); });
        rip.setAttribute('opacity', '1'); tr(rip, tx, ty + 6, 1.4);
      }
      // on ferre et on remonte la prise jusqu'à la barque
      var cat = c.id('fiCatch');
      cat.innerHTML = i > 0 ? '<g class="fi-fish">' + fishSvg(i, 'fiG') + '</g>' : '<path d="M0-6V4Q0 9-5 9Q-9 9-9 5" stroke="#CBD5E1" stroke-width="2" fill="none"/>';
      cat.setAttribute('opacity', '1');
      await tw(c.box, 900, function (k) {
        var e = ease(k), x = lerp(tx, 150, e), y = lerp(ty + 8, 92, e) - Math.sin(k * Math.PI) * 20;
        tr(bob, x, y - 14, 1); c.line(x, y - 14, 0);
        tr(cat, x, y + 6, 0.6 + 0.6 * e, i > 0 ? -60 * (1 - e) + Math.sin(k * 18) * 10 * (1 - k) : 0);
        rip.setAttribute('opacity', (1 - k).toFixed(2));
      });
      if (i >= 2) { var sp = c.id('fiSpark'); sp.setAttribute('opacity', '1'); tr(sp, 150, 98); if (sp.animate) sp.animate([{ transform: 'translate(150px,98px) scale(.6)', opacity: 1 }, { transform: 'translate(150px,98px) scale(1.3)', opacity: 0 }], { duration: 700, fill: 'forwards' }); }
    },
    rules: {
      en: '1. Set your stake and tap “Cast”: the line flies out and the float lands on the lake.\n2. Wait for the bite: the fish you reel in decides your win.\n3. Sardine ×0.5 · perch ×1.2 · bass ×2.5 · salmon ×6 · swordfish ×20 · golden fish ×200. Empty hook or old boot: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : la ligne part et le bouchon se pose sur le lac.\n2. Attends la touche : le poisson que tu remontes décide du gain.\n3. Sardine ×0.5 · perche ×1.2 · bar ×2.5 · saumon ×6 · espadon ×20 · poisson d’or ×200. Hameçon vide ou vieille botte : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Lanzar»: el sedal vuela y el corcho cae en el lago.\n2. Espera la picada: el pez que sacas decide tu premio.\n3. Sardina ×0.5 · perca ×1.2 · lubina ×2.5 · salmón ×6 · pez espada ×20 · pez dorado ×200. Anzuelo vacío o bota vieja: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Lançar»: a linha voa e a boia cai no lago.\n2. Espere a fisgada: o peixe que você puxa decide o prêmio.\n3. Sardinha ×0.5 · perca ×1.2 · robalo ×2.5 · salmão ×6 · peixe-espada ×20 · peixe dourado ×200. Anzol vazio ou bota velha: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «ارمِ»: ينطلق الخيط وتستقر العوامة على البحيرة.\n2. انتظر العضّة: السمكة التي تسحبها تحدد ربحك.\n3. سردين ×0.5 · فرخ ×1.2 · قاروص ×2.5 · سلمون ×6 · سمك أبو سيف ×20 · سمكة ذهبية ×200. صنارة فارغة أو حذاء قديم: تخسر الرهان.',
      tr: '1. Bahsini seç ve “At”a dokun: misina uçar, şamandıra göle düşer.\n2. Vuruşu bekle: çektiğin balık kazancını belirler.\n3. Sardalya ×0.5 · tatlı su levreği ×1.2 · levrek ×2.5 · somon ×6 · kılıç balığı ×20 · altın balık ×200. Boş iğne veya eski çizme: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Quăng câu»: dây câu bay ra, phao rơi xuống hồ.\n2. Chờ cá cắn: con cá bạn kéo lên quyết định tiền thắng.\n3. Cá mòi ×0.5 · cá rô ×1.2 · cá vược ×2.5 · cá hồi ×6 · cá kiếm ×20 · cá vàng ×200. Lưỡi câu trống hoặc chiếc ủng cũ: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lempar»: senar melayang dan pelampung jatuh ke danau.\n2. Tunggu sambaran: ikan yang kamu tarik menentukan kemenangan.\n3. Sarden ×0.5 · perch ×1.2 · kakap ×2.5 · salmon ×6 · ikan todak ×20 · ikan emas ×200. Kail kosong atau sepatu bot tua: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Забросить»: леска летит, поплавок ложится на воду.\n2. Ждите поклёвку: пойманная рыба определяет выигрыш.\n3. Сардина ×0.5 · окунь ×1.2 · сибас ×2.5 · лосось ×6 · меч-рыба ×20 · золотая рыбка ×200. Пустой крючок или старый сапог — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Auswerfen“: Die Schnur fliegt, der Schwimmer landet auf dem See.\n2. Warte auf den Biss: Der Fisch, den du einholst, bestimmt den Gewinn.\n3. Sardine ×0.5 · Barsch ×1.2 · Wolfsbarsch ×2.5 · Lachs ×6 · Schwertfisch ×20 · Goldfisch ×200. Leerer Haken oder alter Stiefel: Einsatz verloren.',
      hi: '1. राशि चुनें और «फेंकें» छुएं: डोर उड़ती है और बॉबर झील पर गिरता है।\n2. मछली के काटने का इंतज़ार करें: जो मछली खींचें, वही जीत तय करती है।\n3. सार्डीन ×0.5 · पर्च ×1.2 · बास ×2.5 · सैल्मन ×6 · स्वोर्डफ़िश ×20 · सुनहरी मछली ×200। खाली कांटा या पुराना जूता: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“抛竿”：鱼线飞出，浮漂落在湖面上。\n2. 等待咬钩：钓上来的鱼决定你的奖金。\n3. 沙丁鱼 ×0.5 · 河鲈 ×1.2 · 鲈鱼 ×2.5 · 三文鱼 ×6 · 剑鱼 ×20 · 金鱼 ×200。空钩或旧靴子：输掉下注。'
    }
  });

  /* =============================== GUMBALL MACHINE =============================== */
  // 0 blanc · 1 bleu · 2 vert · 3 rouge · 4 violet · 5 arc-en-ciel · 6 or
  var GB = [['#FFFFFF', '#CBD5E1'], ['#93C5FD', '#1D4ED8'], ['#86EFAC', '#15803D'], ['#FCA5A5', '#DC2626'], ['#D8B4FE', '#7E22CE'], ['rb', 'rb'], ['#FEF3C7', '#D97706']];
  function gbDefs(p) {
    return GB.map(function (g, i) {
      if (g[0] === 'rb') return '<linearGradient id="' + p + i + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F472B6"/><stop offset=".25" stop-color="#FBBF24"/><stop offset=".5" stop-color="#4ADE80"/><stop offset=".75" stop-color="#60A5FA"/><stop offset="1" stop-color="#A855F7"/></linearGradient>';
      return '<radialGradient id="' + p + i + '" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="' + g[0] + '"/><stop offset="1" stop-color="' + g[1] + '"/></radialGradient>';
    }).join('');
  }
  function ball(p, t, r) { return '<circle r="' + r + '" fill="url(#' + p + t + ')"/><ellipse cx="' + (-r * .35) + '" cy="' + (-r * .4) + '" rx="' + (r * .28) + '" ry="' + (r * .18) + '" fill="#fff" opacity=".8"/>'; }
  game({
    key: 'gumball', l: verb('turn'), vb: '0 0 300 250',
    chips: [1, 2, 3, 4, 5, 6].map(function (t, j) { return [(j ? '' : '<defs>' + gbDefs('gbI') + '</defs>') + ball('gbI', t, 8), [0.5, 1.2, 2.5, 6, 20, 150][j]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs>' + gbDefs('gbG') + '<radialGradient id="gbGlass" cx="38%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#C4B5FD" stop-opacity=".08"/><stop offset="1" stop-color="#C4B5FD" stop-opacity=".25"/></radialGradient>' +
      '<linearGradient id="gbBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9F1239"/><stop offset=".35" stop-color="#FB7185"/><stop offset=".6" stop-color="#E11D48"/><stop offset="1" stop-color="#881337"/></linearGradient>' +
      '<linearGradient id="gbMet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#94A3B8"/><stop offset=".45" stop-color="#F8FAFC"/><stop offset="1" stop-color="#64748B"/></linearGradient>' +
      '<clipPath id="gbClip"><circle cx="150" cy="86" r="66"/></clipPath><radialGradient id="gbHaloG" r=".5"><stop offset="0" stop-color="#FBBF24" stop-opacity=".6"/><stop offset="1" stop-color="#FBBF24" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="150" cy="240" rx="110" ry="10" fill="#000" opacity=".35"/>' +
      '<path d="M134 16h32v8h-32z" fill="url(#gbBody)"/><ellipse cx="150" cy="16" rx="18" ry="5" fill="#FB7185"/>' +
      '<g clip-path="url(#gbClip)"><g id="gbBalls"></g></g><circle cx="150" cy="86" r="66" fill="url(#gbGlass)" stroke="#E9D5FF" stroke-opacity=".6" stroke-width="2"/>' +
      '<path d="M104 50Q112 36 128 30" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55" fill="none"/>' +
      '<path d="M100 146h100l14 84H86z" fill="url(#gbBody)" stroke="#4C0519" stroke-width="1.4"/><rect x="92" y="142" width="116" height="10" rx="4" fill="url(#gbMet)"/>' +
      '<rect x="86" y="226" width="128" height="10" rx="4" fill="url(#gbMet)"/>' +
      '<g id="gbCrank" transform="translate(150 178)"><circle r="17" fill="url(#gbMet)" stroke="#475569"/><rect x="-4" y="-15" width="8" height="30" rx="3" fill="#475569"/><circle r="4" fill="#E2E8F0"/></g>' +
      '<path d="M128 204h44v18h-44z" fill="#4C0519"/><path d="M128 204h44" stroke="url(#gbMet)" stroke-width="3"/>' +
      '<ellipse cx="150" cy="216" rx="40" ry="20" fill="url(#gbHaloG)" id="gbHalo" opacity="0"/><g id="gbOut" opacity="0"></g>',
    init: function (c) {
      var s = '', n = 0;
      for (var y = 140; y > 34; y -= 15) for (var x = 82 + (n % 2) * 8; x < 222; x += 16) { n++; var t = [0, 1, 2, 3, 4, 0, 1, 2, 3, 5][rnd(10)]; s += '<g class="gb-b" transform="translate(' + (x + rnd(4)) + ' ' + (y + rnd(4)) + ')">' + ball('gbG', t, 8) + '</g>'; }
      c.id('gbBalls').innerHTML = s;
    },
    reset: function (c) { c.id('gbOut').setAttribute('opacity', '0'); c.id('gbHalo').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var i = +r.view.i, crank = c.id('gbCrank'), balls = c.id('gbBalls'), out = c.id('gbOut');
      await tw(c.box, 1100, function (k) {
        var e = ease(k); crank.setAttribute('transform', 'translate(150 178) rotate(' + (e * 360).toFixed(0) + ')');
        balls.setAttribute('transform', 'translate(' + (Math.sin(k * 30) * 2 * (1 - k)).toFixed(1) + ' ' + (Math.abs(Math.sin(k * 20)) * -3 * (1 - k)).toFixed(1) + ')');
      });
      out.innerHTML = '<g>' + ball('gbG', i, 11) + '</g>'; out.setAttribute('opacity', '1');
      await tw(c.box, 520, function (k) { tr(out, 150 + Math.sin(k * 6) * 3, lerp(196, 214, easeIn(k)), 0.7 + 0.3 * k); });
      await tw(c.box, 560, function (k) { var e = ease(k); tr(out, 150, lerp(214, 196, e) + Math.sin(k * Math.PI) * -28, lerp(1, 2.3, e)); });
      if (i > 0) c.id('gbHalo').setAttribute('opacity', '1');
    },
    rules: {
      en: '1. Set your stake and tap “Turn”: the crank turns and one gumball rolls out.\n2. Its colour decides your win.\n3. Blue ×0.5 · green ×1.2 · red ×2.5 · purple ×6 · rainbow ×20 · gold ×150. White: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Tourner » : la manivelle tourne et une boule sort.\n2. Sa couleur décide du gain.\n3. Bleue ×0.5 · verte ×1.2 · rouge ×2.5 · violette ×6 · arc-en-ciel ×20 · or ×150. Blanche : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Girar»: la manivela gira y sale un chicle.\n2. Su color decide tu premio.\n3. Azul ×0.5 · verde ×1.2 · rojo ×2.5 · morado ×6 · arcoíris ×20 · oro ×150. Blanco: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Girar»: a manivela gira e sai uma bola de chiclete.\n2. A cor decide o prêmio.\n3. Azul ×0.5 · verde ×1.2 · vermelha ×2.5 · roxa ×6 · arco-íris ×20 · ouro ×150. Branca: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «أدِر»: يدور المقبض وتخرج كرة علكة.\n2. لونها يحدد ربحك.\n3. أزرق ×0.5 · أخضر ×1.2 · أحمر ×2.5 · بنفسجي ×6 · قوس قزح ×20 · ذهبي ×150. أبيض: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Çevir”e dokun: kol döner ve bir sakız topu çıkar.\n2. Rengi kazancını belirler.\n3. Mavi ×0.5 · yeşil ×1.2 · kırmızı ×2.5 · mor ×6 · gökkuşağı ×20 · altın ×150. Beyaz: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Quay»: tay quay xoay và một viên kẹo lăn ra.\n2. Màu của viên kẹo quyết định tiền thắng.\n3. Xanh dương ×0.5 · xanh lá ×1.2 · đỏ ×2.5 · tím ×6 · cầu vồng ×20 · vàng ×150. Trắng: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Putar»: engkol berputar dan satu permen karet keluar.\n2. Warnanya menentukan kemenangan.\n3. Biru ×0.5 · hijau ×1.2 · merah ×2.5 · ungu ×6 · pelangi ×20 · emas ×150. Putih: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Крутить»: ручка поворачивается, выкатывается жвачка.\n2. Её цвет определяет выигрыш.\n3. Синяя ×0.5 · зелёная ×1.2 · красная ×2.5 · фиолетовая ×6 · радужная ×20 · золотая ×150. Белая — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: Die Kurbel dreht sich, eine Kaugummikugel rollt heraus.\n2. Ihre Farbe bestimmt den Gewinn.\n3. Blau ×0.5 · Grün ×1.2 · Rot ×2.5 · Lila ×6 · Regenbogen ×20 · Gold ×150. Weiß: Einsatz verloren.',
      hi: '1. राशि चुनें और «घुमाएं» छुएं: हैंडल घूमता है और एक गमबॉल बाहर आती है।\n2. उसका रंग आपकी जीत तय करता है।\n3. नीली ×0.5 · हरी ×1.2 · लाल ×2.5 · बैंगनी ×6 · इंद्रधनुषी ×20 · सुनहरी ×150। सफ़ेद: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“转动”：摇柄转动，滚出一颗泡泡糖。\n2. 它的颜色决定奖金。\n3. 蓝色 ×0.5 · 绿色 ×1.2 · 红色 ×2.5 · 紫色 ×6 · 彩虹 ×20 · 金色 ×150。白色：输掉下注。'
    }
  });

  /* =============================== JEWEL BOUTIQUE =============================== */
  // 0 boîte vide · 1 boucles d'oreilles · 2 bracelet · 3 collier · 4 bague · 5 diadème · 6 couronne royale
  function jewel(t) {
    var g = 'url(#jbGold)', p = 'url(#jbPearl)', d = 'url(#jbGem)';
    if (t === 1) return '<path d="M-10-14v8M10-14v8" stroke="' + g + '" stroke-width="2"/><circle cx="-10" cy="-16" r="2.5" fill="' + g + '"/><circle cx="10" cy="-16" r="2.5" fill="' + g + '"/><path d="M-10-6l-5 8 5 8 5-8z" fill="' + d + '"/><path d="M10-6l-5 8 5 8 5-8z" fill="' + d + '"/>';
    if (t === 2) return '<ellipse rx="18" ry="9" fill="none" stroke="' + g + '" stroke-width="4"/>' + [0, 1, 2, 3, 4].map(function (j) { var a = Math.PI * (0.1 + j * 0.2); return '<circle cx="' + (Math.cos(a) * 18).toFixed(1) + '" cy="' + (Math.sin(a) * 9).toFixed(1) + '" r="3" fill="' + d + '"/>'; }).join('');
    if (t === 3) return '<path d="M-20-16Q0 18 20-16" fill="none" stroke="' + g + '" stroke-width="1.4"/>' + [-16, -10, -4, 4, 10, 16].map(function (x) { var y = -16 + (1 - Math.pow(x / 20, 2)) * 17; return '<circle cx="' + x + '" cy="' + y.toFixed(1) + '" r="3.2" fill="' + p + '"/>'; }).join('') + '<path d="M0 2l-6 7 6 9 6-9z" fill="' + d + '" stroke="#fff" stroke-width=".6"/>';
    if (t === 4) return '<circle cy="6" r="11" fill="none" stroke="' + g + '" stroke-width="4"/><path d="M0-20l-9 7 9 9 9-9z" fill="' + d + '" stroke="#fff" stroke-width=".8"/><path d="M-9-13h18" stroke="#fff" stroke-width=".8"/>';
    if (t === 5) return '<path d="M-22 8Q0-2 22 8L18-6 10 2 0-16-10 2-18-6z" fill="' + g + '" stroke="#92400E" stroke-width="1"/><circle cy="-9" r="3.5" fill="' + d + '"/><circle cx="-10" cy="0" r="2.4" fill="' + p + '"/><circle cx="10" cy="0" r="2.4" fill="' + p + '"/>';
    if (t === 6) return '<path d="M-22 12h44l4-26-14 10L0-22-12-4-26-14z" fill="' + g + '" stroke="#92400E" stroke-width="1.2"/><rect x="-22" y="8" width="44" height="7" rx="2" fill="#B45309"/><circle cy="-6" r="4" fill="url(#jbRuby)"/><circle cx="-13" cy="1" r="3" fill="' + d + '"/><circle cx="13" cy="1" r="3" fill="' + d + '"/><circle cx="-26" cy="-14" r="2.4" fill="' + p + '"/><circle cx="26" cy="-14" r="2.4" fill="' + p + '"/><circle cy="-22" r="2.4" fill="' + p + '"/>';
    return '';
  }
  var JBDEF = '<linearGradient id="jbGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".5" stop-color="#F59E0B"/><stop offset="1" stop-color="#92400E"/></linearGradient>' +
    '<radialGradient id="jbPearl" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#F9A8D4"/></radialGradient>' +
    '<linearGradient id="jbGem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#A5F3FC"/><stop offset="1" stop-color="#0891B2"/></linearGradient>' +
    '<radialGradient id="jbRuby" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FECDD3"/><stop offset="1" stop-color="#BE123C"/></radialGradient>';
  game({
    key: 'jewelbox', l: verb('open'), vb: '0 0 300 250',
    chips: [1, 2, 3, 4, 5, 6].map(function (t, j) { return [(j ? '' : '<defs>' + JBDEF.replace(/jb(Gold|Pearl|Gem|Ruby)/g, 'jbi$1') + '</defs>') + '<g transform="scale(.42)">' + jewel(t).replace(/jb(Gold|Pearl|Gem|Ruby)/g, 'jbi$1') + '</g>', [0.5, 1.2, 2.5, 6, 20, 150][j]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs>' + JBDEF + '<linearGradient id="jbBox" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9D174D"/><stop offset=".4" stop-color="#F472B6"/><stop offset="1" stop-color="#831843"/></linearGradient>' +
      '<linearGradient id="jbLid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBCFE8"/><stop offset="1" stop-color="#DB2777"/></linearGradient>' +
      '<radialGradient id="jbSpot" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#FDF2F8" stop-opacity=".5"/><stop offset="1" stop-color="#FDF2F8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="jbBurst" r=".5"><stop offset="0" stop-color="#FFF7ED" stop-opacity=".95"/><stop offset=".4" stop-color="#FBCFE8" stop-opacity=".5"/><stop offset="1" stop-color="#FBCFE8" stop-opacity="0"/></radialGradient></defs>' +
      '<path d="M-400-400H700V700H-400z" fill="#2A0B2E"/><path d="M-400 160H700V700H-400z" fill="#4A0E3A"/>' +
      '<g opacity=".5" stroke="#F9A8D4" stroke-opacity=".25">' + [20, 60, 240, 280].map(function (x) { return '<path d="M' + x + ' 0V150"/>'; }).join('') + '</g>' +
      '<path d="M110 0L60 230H240L190 0z" fill="url(#jbSpot)"/>' +
      '<ellipse cx="150" cy="214" rx="78" ry="14" fill="#831843"/><path d="M84 200h132v14H84z" fill="#9D174D"/><ellipse cx="150" cy="200" rx="66" ry="12" fill="#BE185D"/>' +
      '<g id="jbBurstG" opacity="0"><circle r="70" fill="url(#jbBurst)"/>' + [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(function (a) { return '<path d="M0-40L3-86L-3-86z" fill="#FDE68A" opacity=".6" transform="rotate(' + a + ')"/>'; }).join('') + '</g>' +
      '<g id="jbItem" opacity="0"></g>' +
      '<g id="jbBoxG"><path d="M108 140h84v58h-84z" fill="url(#jbBox)" stroke="#500724" stroke-width="1.2"/><path d="M144 140h12v58h-12z" fill="#FDE68A"/></g>' +
      '<g id="jbLidG"><path d="M102 126h96v16h-96z" fill="url(#jbLid)" stroke="#500724" stroke-width="1.2"/><path d="M144 126h12v16h-12z" fill="#FDE68A"/>' +
      '<g id="jbBow"><path d="M150 126C134 104 116 112 128 124zM150 126C166 104 184 112 172 124z" fill="#FDE68A" stroke="#B45309" stroke-width="1"/><circle cx="150" cy="125" r="5" fill="#F59E0B"/></g></g>' +
      '<g class="jb-tw" fill="#fff">' + [[60, 70], [236, 54], [214, 150], [80, 160]].map(function (p, j) { return '<path d="M' + p[0] + ' ' + (p[1] - 6) + 'l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" style="animation-delay:' + (j * 0.4) + 's"/>'; }).join('') + '</g>',
    reset: function (c) {
      c.id('jbItem').setAttribute('opacity', '0'); c.id('jbBurstG').setAttribute('opacity', '0');
      c.id('jbLidG').removeAttribute('transform'); c.id('jbBow').removeAttribute('transform'); c.id('jbBow').style.opacity = ''; c.id('jbLidG').style.opacity = '';
    },
    play: async function (c, r) {
      var i = +r.view.i, bx = c.id('jbBoxG'), lid = c.id('jbLidG'), bow = c.id('jbBow'), it = c.id('jbItem'), bu = c.id('jbBurstG');
      await tw(c.box, 700, function (k) { var a = Math.sin(k * Math.PI * 6) * 4 * (1 - k * 0.5); bx.setAttribute('transform', 'rotate(' + a.toFixed(1) + ' 150 198)'); lid.setAttribute('transform', 'rotate(' + a.toFixed(1) + ' 150 198)'); });
      bx.removeAttribute('transform');
      await tw(c.box, 380, function (k) { bow.setAttribute('transform', 'translate(150 125) scale(' + (1 + k * 0.6).toFixed(2) + ') translate(-150 -125)'); bow.style.opacity = String(1 - k); });
      await tw(c.box, 560, function (k) { var e = ease(k); lid.setAttribute('transform', 'translate(' + (e * 70).toFixed(1) + ' ' + (-e * 50 + easeIn(k) * 80).toFixed(1) + ') rotate(' + (e * 40).toFixed(1) + ' 150 134)'); lid.style.opacity = String(1 - Math.max(0, k - 0.6) / 0.4); });
      it.innerHTML = i > 0 ? jewel(i) : '<path d="M-16 4Q-8-10 0 2Q8-12 16 4" fill="#FDF2F8" opacity=".8"/>';
      it.setAttribute('opacity', '1');
      if (i > 0) { bu.setAttribute('opacity', '1'); if (bu.animate && !lite()) bu.animate([{ transform: 'translate(150px,96px) scale(.3) rotate(0deg)', opacity: 0 }, { transform: 'translate(150px,96px) scale(1) rotate(30deg)', opacity: 1 }], { duration: 700, fill: 'forwards' }); else tr(bu, 150, 96); }
      await tw(c.box, 800, function (k) { var e = ease(k); tr(it, 150, lerp(160, i > 0 ? 96 : 140, e), lerp(0.6, i > 0 ? 1.9 : 1.4, e)); });
    },
    rules: {
      en: '1. Set your stake and tap “Open”: the ribbon unties and the gift box opens.\n2. The jewel inside decides your win.\n3. Earrings ×0.5 · bracelet ×1.2 · necklace ×2.5 · ring ×6 · tiara ×20 · royal crown ×150. Empty box: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Ouvrir » : le ruban se dénoue et l’écrin s’ouvre.\n2. Le bijou à l’intérieur décide du gain.\n3. Boucles d’oreilles ×0.5 · bracelet ×1.2 · collier ×2.5 · bague ×6 · diadème ×20 · couronne royale ×150. Écrin vide : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Abrir»: el lazo se deshace y la caja se abre.\n2. La joya de dentro decide tu premio.\n3. Pendientes ×0.5 · pulsera ×1.2 · collar ×2.5 · anillo ×6 · tiara ×20 · corona real ×150. Caja vacía: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Abrir»: a fita se desfaz e a caixa se abre.\n2. A joia lá dentro decide o prêmio.\n3. Brincos ×0.5 · pulseira ×1.2 · colar ×2.5 · anel ×6 · tiara ×20 · coroa real ×150. Caixa vazia: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «افتح»: ينحل الشريط وتنفتح علبة الهدية.\n2. الجوهرة التي بداخلها تحدد ربحك.\n3. أقراط ×0.5 · سوار ×1.2 · قلادة ×2.5 · خاتم ×6 · تاج صغير ×20 · تاج ملكي ×150. علبة فارغة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Aç”a dokun: kurdele çözülür, hediye kutusu açılır.\n2. İçindeki mücevher kazancını belirler.\n3. Küpe ×0.5 · bilezik ×1.2 · kolye ×2.5 · yüzük ×6 · taç ×20 · kraliyet tacı ×150. Boş kutu: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Mở»: nơ được tháo và hộp quà mở ra.\n2. Món trang sức bên trong quyết định tiền thắng.\n3. Bông tai ×0.5 · vòng tay ×1.2 · dây chuyền ×2.5 · nhẫn ×6 · vương miện nhỏ ×20 · vương miện hoàng gia ×150. Hộp rỗng: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Buka»: pita terlepas dan kotak hadiah terbuka.\n2. Perhiasan di dalamnya menentukan kemenangan.\n3. Anting ×0.5 · gelang ×1.2 · kalung ×2.5 · cincin ×6 · tiara ×20 · mahkota kerajaan ×150. Kotak kosong: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Открыть»: лента развязывается, шкатулка открывается.\n2. Украшение внутри определяет выигрыш.\n3. Серьги ×0.5 · браслет ×1.2 · колье ×2.5 · кольцо ×6 · диадема ×20 · королевская корона ×150. Пустая шкатулка — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Öffnen“: Die Schleife löst sich, das Schmuckkästchen öffnet sich.\n2. Das Schmuckstück darin bestimmt den Gewinn.\n3. Ohrringe ×0.5 · Armband ×1.2 · Halskette ×2.5 · Ring ×6 · Diadem ×20 · Königskrone ×150. Leeres Kästchen: Einsatz verloren.',
      hi: '1. राशि चुनें और «खोलें» छुएं: रिबन खुलता है और गिफ़्ट बॉक्स खुल जाता है।\n2. अंदर का गहना आपकी जीत तय करता है।\n3. झुमके ×0.5 · कंगन ×1.2 · हार ×2.5 · अंगूठी ×6 · टियारा ×20 · शाही ताज ×150। खाली डिब्बा: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“打开”：丝带解开，礼盒打开。\n2. 盒中的珠宝决定奖金。\n3. 耳环 ×0.5 · 手镯 ×1.2 · 项链 ×2.5 · 戒指 ×6 · 发冠 ×20 · 皇冠 ×150。空盒：输掉下注。'
    }
  });

  /* =============================== PIÑATA =============================== */
  // 0 ne casse pas (3 coups) · 1…6 casse : bonbons, + sucettes, + pièces, + pierres, + lingots, étoile d'or
  function treat(t) {
    if (t === 0) return '<path d="M-6-3h12v6h-12z" fill="#F472B6"/><path d="M-6-3l-5-3v12l5-3zM6-3l5-3v12l-5-3z" fill="#FBCFE8"/>';
    if (t === 1) return '<path d="M0 0v14" stroke="#F8FAFC" stroke-width="2"/><circle r="7" fill="#22D3EE"/><path d="M-4-3a5 5 0 0 1 8 2" stroke="#fff" stroke-width="2" fill="none"/>';
    if (t === 2) return '<ellipse cy="2" rx="7" ry="3" fill="#92400E"/><ellipse rx="7" ry="3" fill="#FBBF24"/>';
    if (t === 3) return '<path d="M0-7l6 5-6 9-6-9z" fill="#A855F7" stroke="#F3E8FF" stroke-width=".8"/>';
    if (t === 4) return '<path d="M-9 4l3-7h12l3 7z" fill="#F59E0B" stroke="#92400E" stroke-width=".8"/>';
    return '<path d="M0-12l3.5 7.5 8 1-6 5.5 1.6 8-7.1-4-7.1 4 1.6-8-6-5.5 8-1z" fill="#FDE68A" stroke="#B45309"/>';
  }
  var PT = [[], [0, 0, 0, 0], [0, 0, 0, 1, 1, 0], [0, 1, 0, 2, 2, 0, 1, 2], [0, 1, 2, 3, 2, 0, 3, 1, 2, 0], [0, 2, 3, 4, 2, 1, 3, 4, 2, 0, 2], [5, 4, 3, 2, 4, 3, 2, 1, 4, 0, 2, 3]];
  game({
    key: 'pinata', l: verb('hit'), vb: '0 0 300 250',
    chips: [[treat(0), 0.4], [treat(1), 1], [treat(2), 2], [treat(3), 5], [treat(4), 15], [treat(5), 100]],
    chipOf: function (i) { return i - 1; },
    scene: '<defs><linearGradient id="ptSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C1D95"/><stop offset="1" stop-color="#BE185D"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="640" fill="#4C1D95"/><rect x="-400" y="-20" width="1100" height="250" fill="url(#ptSky)"/>' +
      '<g class="pt-flags">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (j) { var x = 10 + j * 35, y = 10 + Math.sin(j / 8 * Math.PI) * 14; return '<path d="M' + x + ' ' + y + 'l9 0-4.5 12z" fill="' + ['#F472B6', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA'][j % 5] + '"/>'; }).join('') + '<path d="M5 10Q150 40 295 10" stroke="#FDE68A" fill="none" stroke-width="1"/></g>' +
      '<path d="M-400 222H700V700H-400z" fill="#3B0764"/><path d="M-400 222H700" stroke="#F0ABFC" stroke-opacity=".4"/>' +
      '<path d="M150 0V56" stroke="#E9D5FF" stroke-width="2" id="ptRope"/>' +
      '<g id="ptPin" transform="translate(150 56)"><g id="ptBody">' +
        '<path d="M0 6l12 24 26 4-19 18 5 27-24-13-24 13 5-27-19-18 26-4z" fill="#F472B6" stroke="#831843" stroke-width="1.5"/>' +
        '<path d="M0 14l8 18 18 3-13 12 3 18-16-9-16 9 3-18-13-12 18-3z" fill="#FBBF24" opacity=".85"/>' +
        '<path d="M0 22l5 11 11 2-8 7 2 11-10-5-10 5 2-11-8-7 11-2z" fill="#34D399"/>' +
        '<path d="M-38 34l-8 18M38 34l8 18M-19 79l-6 16M19 79l6 16" stroke="#60A5FA" stroke-width="3" stroke-linecap="round"/></g>' +
        '<g id="ptHalves" opacity="0"><path d="M0 6l12 24 26 4-19 18-19-6z" fill="#F472B6" stroke="#831843" stroke-width="1.5"/><path d="M0 6l-12 24-26 4 19 18 19-6z" fill="#EC4899" stroke="#831843" stroke-width="1.5"/></g></g>' +
      '<g id="ptStick" transform="translate(260 200) rotate(30)"><rect x="-4" y="-110" width="8" height="120" rx="4" fill="#D97706" stroke="#78350F"/><path d="M-4-100h8M-4-80h8M-4-60h8" stroke="#FDE68A" stroke-width="3"/></g>' +
      '<g id="ptPop" opacity="0">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<path d="M0-14V-26" transform="rotate(' + a + ')" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'; }).join('') + '</g><g id="ptTreats"></g>',
    reset: function (c) {
      c.id('ptTreats').innerHTML = ''; c.id('ptBody').style.opacity = ''; c.id('ptHalves').setAttribute('opacity', '0');
      c.id('ptHalves').removeAttribute('transform'); c.id('ptPin').setAttribute('transform', 'translate(150 56)'); c.id('ptRope').setAttribute('d', 'M150 0V56');
    },
    play: async function (c, r) {
      var i = +r.view.i, pin = c.id('ptPin'), st = c.id('ptStick'), pop = c.id('ptPop'), rope = c.id('ptRope');
      var hits = i === 0 ? 3 : (i >= 5 ? 1 + rnd(2) : 1 + rnd(3)), side = 1;
      for (var h = 0; h < hits; h++) {
        await tw(c.box, 260, function (k) { st.setAttribute('transform', 'translate(260 200) rotate(' + lerp(30, -55, easeIn(k)).toFixed(1) + ')'); });
        pop.setAttribute('opacity', '1'); tr(pop, 170, 110, 0.8);
        var last = h === hits - 1 && i > 0;
        await tw(c.box, last ? 160 : 620, function (k) {
          var a = Math.sin(k * Math.PI * 3) * 28 * (1 - k) * side;
          pin.setAttribute('transform', 'rotate(' + a.toFixed(1) + ' 150 0) translate(150 56)');
          pop.setAttribute('opacity', String(Math.max(0, 1 - k * 3)));
          st.setAttribute('transform', 'translate(260 200) rotate(' + lerp(-55, 30, ease(k)).toFixed(1) + ')');
        });
        side = -side;
      }
      if (i === 0) { await wait(c.box, 200); return; }
      // la piñata s'ouvre : les friandises tombent
      c.id('ptBody').style.opacity = '0'; c.id('ptHalves').setAttribute('opacity', '1');
      var list = PT[i], tg = c.id('ptTreats');
      tg.innerHTML = list.map(function (t) { return '<g>' + treat(t) + '</g>'; }).join('');
      var els = [].slice.call(tg.children), start = els.map(function () { return [150 + rnd(30) - 15, 100 + rnd(20)]; }),
        end = els.map(function (e, j) { return [40 + ((j * 53 + rnd(20)) % 220), 208 + rnd(10)]; });
      var hv = c.id('ptHalves');
      await tw(c.box, 1100, function (k) {
        els.forEach(function (e, j) { var kk = Math.max(0, Math.min(1, k * 1.25 - j * 0.02)), y = lerp(start[j][1], end[j][1], easeIn(kk)) - Math.sin(kk * Math.PI) * 30; tr(e, lerp(start[j][0], end[j][0], kk), y, list[j] === 5 ? 2.2 : 1.6, kk * 200 * (j % 2 ? 1 : -1)); });
        hv.setAttribute('transform', 'translate(0 ' + (k * 12).toFixed(1) + ')'); hv.style.opacity = String(1 - k * 0.6);
      });
    },
    rules: {
      en: '1. Set your stake and tap “Hit”: the stick swings at the piñata (up to 3 hits).\n2. If it breaks, the treats that rain down decide your win.\n3. Candies ×0.4 · lollipops ×1 · coins ×2 · gems ×5 · gold bars ×15 · golden star ×100. It does not break: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Frapper » : le bâton frappe la piñata (jusqu’à 3 coups).\n2. Si elle casse, les friandises qui tombent décident du gain.\n3. Bonbons ×0.4 · sucettes ×1 · pièces ×2 · pierres ×5 · lingots ×15 · étoile d’or ×100. Elle ne casse pas : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Golpear»: el palo golpea la piñata (hasta 3 golpes).\n2. Si se rompe, los premios que caen deciden tu ganancia.\n3. Caramelos ×0.4 · piruletas ×1 · monedas ×2 · gemas ×5 · lingotes ×15 · estrella de oro ×100. Si no se rompe, pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Bater»: o bastão acerta a piñata (até 3 golpes).\n2. Se ela quebrar, as guloseimas que caem decidem o prêmio.\n3. Balas ×0.4 · pirulitos ×1 · moedas ×2 · gemas ×5 · barras de ouro ×15 · estrela dourada ×100. Se não quebrar, a aposta é perdida.',
      ar: '1. اختر الرهان والمس «اضرب»: تضرب العصا البينياتا (حتى 3 ضربات).\n2. إذا انكسرت، فالحلوى التي تتساقط تحدد ربحك.\n3. حلوى ×0.4 · مصاصات ×1 · عملات ×2 · أحجار كريمة ×5 · سبائك ×15 · نجمة ذهبية ×100. لم تنكسر: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Vur”a dokun: sopa piñataya vurur (en fazla 3 vuruş).\n2. Kırılırsa yağan ikramlar kazancını belirler.\n3. Şekerler ×0.4 · lolipoplar ×1 · paralar ×2 · taşlar ×5 · külçeler ×15 · altın yıldız ×100. Kırılmazsa bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Đập»: cây gậy đập vào piñata (tối đa 3 lần).\n2. Nếu vỡ, phần quà rơi xuống quyết định tiền thắng.\n3. Kẹo ×0.4 · kẹo mút ×1 · xu ×2 · đá quý ×5 · thỏi vàng ×15 · ngôi sao vàng ×100. Không vỡ: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Pukul»: tongkat memukul piñata (hingga 3 pukulan).\n2. Jika pecah, hadiah yang berjatuhan menentukan kemenangan.\n3. Permen ×0.4 · lolipop ×1 · koin ×2 · permata ×5 · batangan emas ×15 · bintang emas ×100. Tidak pecah: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бить»: палка бьёт по пиньяте (до 3 ударов).\n2. Если она разбилась, высыпавшиеся сладости определяют выигрыш.\n3. Конфеты ×0.4 · леденцы ×1 · монеты ×2 · камни ×5 · слитки ×15 · золотая звезда ×100. Не разбилась — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Schlagen“: Der Stock trifft die Piñata (bis zu 3 Schläge).\n2. Zerbricht sie, bestimmen die herausfallenden Leckereien den Gewinn.\n3. Bonbons ×0.4 · Lutscher ×1 · Münzen ×2 · Edelsteine ×5 · Goldbarren ×15 · Goldstern ×100. Bleibt sie ganz: Einsatz verloren.',
      hi: '1. राशि चुनें और «मारें» छुएं: छड़ी पिनाटा पर वार करती है (3 बार तक)।\n2. अगर वह टूटे, तो गिरने वाली चीज़ें जीत तय करती हैं।\n3. टॉफ़ियां ×0.4 · लॉलीपॉप ×1 · सिक्के ×2 · रत्न ×5 · सोने की ईंटें ×15 · सुनहरा तारा ×100। न टूटे तो दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“敲打”：木棒敲打皮纳塔（最多 3 下）。\n2. 如果被打破，掉落的礼物决定奖金。\n3. 糖果 ×0.4 · 棒棒糖 ×1 · 金币 ×2 · 宝石 ×5 · 金条 ×15 · 金星 ×100。没打破：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
