/* v2830 — more4d (owner request, round 5): Lucky Polish, Loves Me, Bouquet Toss, Fireworks, Gold Rush — new instant games; the scene always shows exactly the line (or option) the server drew (casino_ext/more4.php). */
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
    en: { paint: 'Paint', pluck: 'Pluck', toss: 'Toss', fire: 'Launch', pan: 'Pan', yes: 'Loves me', no: 'Loves me not' },
    fr: { paint: 'Vernir', pluck: 'Effeuiller', toss: 'Lancer', fire: 'Tirer', pan: 'Tamiser', yes: 'M’aime', no: 'M’aime pas' },
    es: { paint: 'Pintar', pluck: 'Deshojar', toss: 'Lanzar', fire: 'Lanzar', pan: 'Cribar', yes: 'Me quiere', no: 'No me quiere' },
    pt: { paint: 'Pintar', pluck: 'Desfolhar', toss: 'Jogar', fire: 'Lançar', pan: 'Peneirar', yes: 'Bem me quer', no: 'Mal me quer' },
    ar: { paint: 'لوّني', pluck: 'اقطفي', toss: 'ارمي', fire: 'أطلق', pan: 'اغسل', yes: 'يحبني', no: 'لا يحبني' },
    tr: { paint: 'Boya', pluck: 'Kopar', toss: 'At', fire: 'Ateşle', pan: 'Ele', yes: 'Seviyor', no: 'Sevmiyor' },
    vi: { paint: 'Sơn', pluck: 'Ngắt', toss: 'Tung', fire: 'Bắn', pan: 'Đãi vàng', yes: 'Yêu', no: 'Không yêu' },
    id: { paint: 'Cat', pluck: 'Petik', toss: 'Lempar', fire: 'Nyalakan', pan: 'Dulang', yes: 'Cinta', no: 'Tidak cinta' },
    ru: { paint: 'Красить', pluck: 'Гадать', toss: 'Бросить', fire: 'Запуск', pan: 'Мыть', yes: 'Любит', no: 'Не любит' },
    de: { paint: 'Lackieren', pluck: 'Zupfen', toss: 'Werfen', fire: 'Zünden', pan: 'Waschen', yes: 'Liebt mich', no: 'Liebt mich nicht' },
    hi: { paint: 'रंगें', pluck: 'तोड़ें', toss: 'उछालें', fire: 'छोड़ें', pan: 'छानें', yes: 'प्यार करता है', no: 'नहीं करता' },
    zh: { paint: '涂色', pluck: '摘花瓣', toss: '抛花', fire: '燃放', pan: '淘金', yes: '爱我', no: '不爱我' }
  };
  function verb(k) { return function () { var v = Lx(V); return { verb: v[k], yes: v.yes, no: v.no }; }; }
  function heart(f) { return '<path d="M0 6C-9 0-10-6-6-8.5S0-7 0-4C0-7 2-11 6-8.5S9 0 0 6z" fill="' + f + '"/>'; }

  /* =============================== LUCKY POLISH (vernis) =============================== */
  // 5 ongles × 6 couleurs : 0 cinq pareils ×100 · 1 quatre ×10 · 2 full ×5 · 3 brelan ×1.5 · 4 deux paires ×0.8 · 5 une paire 0 · 6 arc-en-ciel (toutes différentes) ×0.65
  var NC = ['#F472B6', '#E11D48', '#A855F7', '#3B82F6', '#34D399', '#FBBF24'];
  var NPAT = [[5], [4, 1], [3, 2], [3, 1, 1], [2, 2, 1], [2, 1, 1, 1], [1, 1, 1, 1, 1]];
  function patDots(pat) { var cols = [], n = 0; pat.forEach(function (k, j) { for (var t = 0; t < k; t++) cols.push(NC[j]); }); return cols.map(function (c2) { return '<circle cx="' + (-9 + 4.5 * n++) + '" r="2.3" fill="' + c2 + '"/>'; }).join(''); }
  var FING = [[-62, 30, 0.85, -14], [-30, 4, 1, -5], [2, -4, 1.05, 0], [34, 4, 1, 5], [62, 26, 0.9, 12]]; // pouce … auriculaire : x, y, échelle, angle
  game({
    key: 'nails', l: verb('paint'), vb: '0 0 300 250',
    chips: [6, 4, 3, 2, 1, 0].map(function (li, j) { return [patDots(NPAT[li]), [0.65, 0.8, 1.5, 5, 10, 100][j]]; }),
    chipOf: function (i) { return [5, 4, 3, 2, 1, -1, 0][i]; },
    scene: '<defs><linearGradient id="naSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E8B796"/><stop offset=".5" stop-color="#FAD7BD"/><stop offset="1" stop-color="#E0A985"/></linearGradient>' +
      '<radialGradient id="naBg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#FBCFE8"/><stop offset="1" stop-color="#9D174D"/></radialGradient>' +
      '<linearGradient id="naGl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#4A0E3A"/><ellipse cx="150" cy="110" rx="190" ry="140" fill="url(#naBg)" opacity=".55"/>' +
      '<g fill="#fff" opacity=".6">' + [[30, 30], [270, 40], [40, 200], [262, 190], [150, 14]].map(function (p) { return '<path d="M' + p[0] + ' ' + (p[1] - 5) + 'l1.3 3.7 3.7 1.3-3.7 1.3-1.3 3.7-1.3-3.7-3.7-1.3 3.7-1.3z"/>'; }).join('') + '</g>' +
      // main
      '<g transform="translate(150 150)"><path d="M-74 40C-80 0-70-10-46-14L46-14C72-10 80 0 74 40L60 110H-60z" fill="url(#naSkin)"/>' +
      FING.map(function (f, j) { return '<g transform="translate(' + f[0] + ' ' + f[1] + ') rotate(' + f[3] + ') scale(' + f[2] + ')"><rect x="-13" y="-92" width="26" height="100" rx="13" fill="url(#naSkin)"/>' +
        '<path d="M-9-70C-9-86 9-86 9-70V-56Q0-52-9-56z" fill="#F8E1D4" stroke="#D6A07E" stroke-width=".8" class="na-n" id="naN' + j + '"/><path d="M-5-78C-5-82 0-83 2-82" stroke="url(#naGl)" stroke-width="3" stroke-linecap="round" fill="none"/></g>'; }).join('') +
      '<rect x="-62" y="60" width="124" height="12" rx="6" fill="#FBBF24" stroke="#B45309"/><circle cy="66" r="5" fill="#E0F2FE" stroke="#0EA5E9"/></g>' +
      // flacons
      '<g transform="translate(150 236)">' + NC.map(function (c2, j) { return '<g transform="translate(' + ((j - 2.5) * 40) + ' 0)"><rect x="-9" y="-14" width="18" height="18" rx="5" fill="' + c2 + '" stroke="#fff" stroke-opacity=".6"/><rect x="-4" y="-24" width="8" height="10" rx="2" fill="#1F2937"/></g>'; }).join('') + '</g>' +
      '<g id="naBrush" transform="translate(260 40)" opacity="0"><rect x="-2.5" y="-40" width="5" height="40" rx="2" fill="#1F2937"/><path d="M-3 0h6l-1 9h-4z" id="naTip" fill="#F472B6"/></g>' +
      '<g id="naSpark"></g>',
    reset: function (c) { for (var j = 0; j < 5; j++) { c.id('naN' + j).setAttribute('fill', '#F8E1D4'); c.id('naN' + j).classList.remove('win'); } c.id('naSpark').innerHTML = ''; },
    play: async function (c, r) {
      var i = +r.view.i, pat = NPAT[i], cols = shuffle(NC.slice()), list = [];
      pat.forEach(function (k, j) { for (var t = 0; t < k; t++) list.push(j); });
      list = shuffle(list);
      var br = c.id('naBrush'), tip = c.id('naTip'); br.setAttribute('opacity', '1');
      var px = 260, py = 40;
      for (var n = 0; n < 5; n++) {
        var f = FING[n], cj = list[n], col = cols[cj];
        // la pointe du pinceau prend la couleur au flacon puis peint l'ongle
        var a = f[3] * Math.PI / 180, nx = 150 + f[0] + Math.sin(a) * 70 * f[2], ny = 150 + f[1] - Math.cos(a) * 70 * f[2];
        tip.setAttribute('fill', col);
        await tw(c.box, 300, function (k) { tr(br, lerp(px, nx, ease(k)), lerp(py, ny - 6, ease(k)), 1, 20); });
        await tw(c.box, 260, function (k) { tr(br, nx + Math.sin(k * Math.PI * 2) * 3, ny - 6 + k * 6, 1, 20); });
        c.id('naN' + n).setAttribute('fill', col);
        px = nx; py = ny;
      }
      await tw(c.box, 300, function (k) { tr(br, lerp(px, 270, k), lerp(py, 30, k), 1, 20); br.setAttribute('opacity', String(1 - k)); });
      // les ongles qui forment la combinaison brillent
      var best = pat[0] >= 2 ? list.map(function (v, j) { return pat[v] >= 2 ? j : -1; }).filter(function (j) { return j >= 0; }) : (i === 6 ? [0, 1, 2, 3, 4] : []);
      if (i === 5) best = []; // une paire ne paie pas
      best.forEach(function (j) { c.id('naN' + j).classList.add('win'); });
    },
    rules: {
      en: '1. Set your stake and tap “Paint”: each of the 5 nails gets one of 6 polish colours.\n2. Matching colours make the combination that decides your win.\n3. All different ×0.65 · two pairs ×0.8 · three alike ×1.5 · three + two ×5 · four alike ×10 · all five alike ×100. One pair: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Vernir » : chacun des 5 ongles reçoit une des 6 couleurs de vernis.\n2. Les couleurs pareilles forment la combinaison qui décide du gain.\n3. Toutes différentes ×0.65 · deux paires ×0.8 · trois pareilles ×1.5 · trois + deux ×5 · quatre pareilles ×10 · les cinq pareilles ×100. Une seule paire : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Pintar»: cada una de las 5 uñas recibe uno de 6 colores de esmalte.\n2. Los colores iguales forman la combinación que decide tu premio.\n3. Todos distintos ×0.65 · dos pares ×0.8 · tres iguales ×1.5 · tres + dos ×5 · cuatro iguales ×10 · las cinco iguales ×100. Un solo par: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Pintar»: cada uma das 5 unhas recebe uma de 6 cores de esmalte.\n2. As cores iguais formam a combinação que decide o prêmio.\n3. Todas diferentes ×0.65 · dois pares ×0.8 · três iguais ×1.5 · três + duas ×5 · quatro iguais ×10 · as cinco iguais ×100. Só um par: a aposta é perdida.',
      ar: '1. اختاري الرهان والمسي «لوّني»: يأخذ كل ظفر من الأظافر الخمسة لونًا من 6 ألوان.\n2. الألوان المتطابقة تكوّن التركيبة التي تحدد ربحك.\n3. كلها مختلفة ×0.65 · زوجان ×0.8 · ثلاثة متشابهة ×1.5 · ثلاثة + اثنان ×5 · أربعة متشابهة ×10 · الخمسة متشابهة ×100. زوج واحد فقط: تخسرين الرهان.',
      tr: '1. Bahsini seç ve “Boya”ya dokun: 5 tırnağın her biri 6 oje renginden birini alır.\n2. Aynı renkler kazancını belirleyen kombinasyonu oluşturur.\n3. Hepsi farklı ×0.65 · iki çift ×0.8 · üç aynı ×1.5 · üç + iki ×5 · dört aynı ×10 · beşi de aynı ×100. Tek çift: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Sơn»: mỗi móng trong 5 móng được sơn một trong 6 màu.\n2. Các màu trùng nhau tạo thành tổ hợp quyết định tiền thắng.\n3. Tất cả khác nhau ×0.65 · hai đôi ×0.8 · ba giống nhau ×1.5 · ba + hai ×5 · bốn giống nhau ×10 · cả năm giống nhau ×100. Chỉ một đôi: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Cat»: tiap dari 5 kuku mendapat satu dari 6 warna kutek.\n2. Warna yang sama membentuk kombinasi yang menentukan kemenangan.\n3. Semua berbeda ×0.65 · dua pasang ×0.8 · tiga sama ×1.5 · tiga + dua ×5 · empat sama ×10 · kelimanya sama ×100. Hanya satu pasang: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Красить»: каждый из 5 ногтей получает один из 6 цветов лака.\n2. Совпадающие цвета дают комбинацию, которая определяет выигрыш.\n3. Все разные ×0.65 · две пары ×0.8 · три одинаковых ×1.5 · три + два ×5 · четыре одинаковых ×10 · все пять одинаковых ×100. Одна пара — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Lackieren“: Jeder der 5 Nägel bekommt eine von 6 Lackfarben.\n2. Gleiche Farben bilden die Kombination, die den Gewinn bestimmt.\n3. Alle verschieden ×0.65 · zwei Paare ×0.8 · drei gleiche ×1.5 · drei + zwei ×5 · vier gleiche ×10 · alle fünf gleich ×100. Nur ein Paar: Einsatz verloren.',
      hi: '1. राशि चुनें और «रंगें» छुएं: 5 नाखूनों में से हर एक को 6 नेल पॉलिश रंगों में से एक मिलता है।\n2. एक जैसे रंग वह संयोजन बनाते हैं जो जीत तय करता है।\n3. सब अलग ×0.65 · दो जोड़े ×0.8 · तीन एक जैसे ×1.5 · तीन + दो ×5 · चार एक जैसे ×10 · पांचों एक जैसे ×100। सिर्फ़ एक जोड़ा: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“涂色”：5 个指甲各涂上 6 种甲油颜色中的一种。\n2. 相同的颜色组成决定奖金的组合。\n3. 全部不同 ×0.65 · 两对 ×0.8 · 三个相同 ×1.5 · 三加二 ×5 · 四个相同 ×10 · 五个全同 ×100。只有一对：输掉下注。'
    }
  });

  /* =============================== LOVES ME (marguerite) =============================== */
  // ligne → pétales : 5 6 7 8 9 10 11 12 13 21(or). Impair = « m'aime » (gagné).
  var DP = [5, 6, 7, 8, 9, 10, 11, 12, 13, 21];
  function daisyIco(n, gold) { var s = ''; for (var j = 0; j < 8; j++) s += '<ellipse cy="-6" rx="2.6" ry="5" fill="' + (gold ? '#FDE68A' : '#fff') + '" transform="rotate(' + (j * 45) + ')"/>'; return s + '<circle r="3.6" fill="#F59E0B"/>' + (n ? '<text y="2.6" font-size="6" font-weight="900" text-anchor="middle" fill="#7C2D12">' + n + '</text>' : ''); }
  game({
    key: 'daisy', l: verb('pluck'), vb: '0 0 300 260',
    chips: [[daisyIco(5), 1], [daisyIco(7), 1.8], [daisyIco(9), 3], [daisyIco(11), 8], [daisyIco(13), 25], [daisyIco(0, 1), 200]],
    chipOf: function (i) { return [0, -1, 1, -1, 2, -1, 3, -1, 4, 5][i]; },
    scene: '<defs><radialGradient id="dsBg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#FCE7F3"/><stop offset="1" stop-color="#BE185D"/></radialGradient>' +
      '<radialGradient id="dsC" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FEF08A"/><stop offset="1" stop-color="#D97706"/></radialGradient>' +
      '<linearGradient id="dsP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#FBCFE8"/></linearGradient>' +
      '<linearGradient id="dsPG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#500724"/><ellipse cx="150" cy="120" rx="200" ry="150" fill="url(#dsBg)" opacity=".5"/>' +
      '<g class="ds-hearts" opacity=".35">' + [[40, 50], [262, 70], [52, 210], [250, 220]].map(function (p) { return '<g transform="translate(' + p[0] + ' ' + p[1] + ') scale(1.4)">' + heart('#FBCFE8') + '</g>'; }).join('') + '</g>' +
      '<path d="M150 150Q140 210 152 300" stroke="#15803D" stroke-width="6" fill="none"/><path d="M148 220Q120 200 104 214Q126 230 148 222z" fill="#22C55E"/>' +
      '<g id="dsPet" transform="translate(150 118)"></g><circle cx="150" cy="118" r="22" fill="url(#dsC)" stroke="#B45309" stroke-width="1.5"/>' +
      '<g transform="translate(150 118)" fill="#B45309" opacity=".5">' + [[-8, -6], [6, -9], [9, 5], [-4, 9], [0, 0], [-10, 4]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6"/>'; }).join('') + '</g>' +
      '<g id="dsFly"></g>' +
      '<g transform="translate(150 28)"><rect id="dsTagR" x="-80" y="-15" width="160" height="28" rx="14" fill="#831843" stroke="#F9A8D4" stroke-opacity=".6"/><g id="dsH" transform="translate(-62 -1)">' + heart('#F472B6') + '</g>' +
      '<text id="dsTxt" x="8" y="5" text-anchor="middle" font-size="14" font-weight="900" fill="#FDF2F8"></text></g>',
    init: function (c) {
      c.petals = function (n, gold) {
        var s = '', rr = n > 13 ? 44 : 46, w = Math.max(5, Math.min(11, 150 / n));
        for (var j = 0; j < n; j++) s += '<g class="ds-p" transform="rotate(' + (j * 360 / n).toFixed(1) + ')"><ellipse cy="-' + (rr / 2 + 14) + '" rx="' + w.toFixed(1) + '" ry="' + (rr / 2 + 4) + '" fill="url(#' + (gold ? 'dsPG' : 'dsP') + ')" stroke="' + (gold ? '#D97706' : '#F9A8D4') + '" stroke-width=".8"/></g>';
        c.id('dsPet').innerHTML = s;
      };
      c.petals(9); c.tag = function (t, yes) { var e = c.id('dsTxt'); e.textContent = t; e.style.fontSize = '14px'; try { var w = e.getComputedTextLength(); if (w > 118) e.style.fontSize = (14 * 118 / w).toFixed(1) + 'px'; } catch (er) { /* ignore */ } c.id('dsH').innerHTML = heart(yes ? '#F472B6' : '#64748B'); };
      c.tag('', true);
    },
    reset: function (c) { c.id('dsTagR').removeAttribute('class'); },
    play: async function (c, r) {
      var i = +r.view.i, n = DP[i], gold = i === 9, ps;
      c.petals(n, gold); ps = c.qa('.ds-p');
      await wait(c.box, 350);
      var per = n > 13 ? 230 : 330;
      for (var j = 0; j < n; j++) {
        var p = ps[(j * 3) % n === j ? j : j]; // dans l'ordre, tout autour
        var ang = j * 360 / n, yes = j % 2 === 0;
        c.tag(yes ? c.l.yes : c.l.no, yes);
        (function (el, a) { el.animate ? el.animate([{ transform: 'rotate(' + a + 'deg) translateY(0)', opacity: 1 }, { transform: 'rotate(' + (a + 40) + 'deg) translateY(-70px)', opacity: 0 }], { duration: 600, fill: 'forwards', easing: 'ease-in' }) : (el.style.opacity = '0'); })(p, ang);
        await wait(c.box, per);
      }
      var win = n % 2 === 1;
      c.id('dsTagR').setAttribute('class', win ? 'ds-yes' : 'ds-no');
    },
    rules: {
      en: '1. Set your stake and tap “Pluck”: the daisy blooms and its petals are pulled one by one — “loves me”, “loves me not”…\n2. The last petal decides: “loves me” wins. More petals pay more.\n3. 5 petals ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · golden daisy ×200. Ends on “loves me not”: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Effeuiller » : la marguerite s’ouvre et ses pétales sont retirés un à un — « m’aime », « m’aime pas »…\n2. Le dernier pétale décide : « m’aime » gagne. Plus il y a de pétales, plus ça paie.\n3. 5 pétales ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · marguerite d’or ×200. Fin sur « m’aime pas » : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Deshojar»: la margarita se abre y se quitan sus pétalos uno a uno — «me quiere», «no me quiere»…\n2. El último pétalo decide: «me quiere» gana. Más pétalos pagan más.\n3. 5 pétalos ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · margarita de oro ×200. Si termina en «no me quiere», pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Desfolhar»: a margarida abre e as pétalas saem uma a uma — «bem me quer», «mal me quer»…\n2. A última pétala decide: «bem me quer» ganha. Mais pétalas pagam mais.\n3. 5 pétalas ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · margarida dourada ×200. Termina em «mal me quer»: a aposta é perdida.',
      ar: '1. اختاري الرهان والمسي «اقطفي»: تتفتح زهرة الأقحوان وتُنزع بتلاتها واحدة تلو الأخرى — «يحبني»، «لا يحبني»…\n2. البتلة الأخيرة تقرر: «يحبني» تربح. كلما زادت البتلات زاد الربح.\n3. 5 بتلات ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · الأقحوانة الذهبية ×200. تنتهي بـ«لا يحبني»: تخسرين الرهان.',
      tr: '1. Bahsini seç ve “Kopar”a dokun: papatya açar ve yaprakları tek tek koparılır — “seviyor”, “sevmiyor”…\n2. Son yaprak karar verir: “seviyor” kazanır. Daha çok yaprak daha çok öder.\n3. 5 yaprak ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · altın papatya ×200. “Sevmiyor” ile biterse: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Ngắt»: bông cúc nở và từng cánh được ngắt — «yêu», «không yêu»…\n2. Cánh cuối cùng quyết định: «yêu» là thắng. Càng nhiều cánh càng thắng lớn.\n3. 5 cánh ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · cúc vàng ×200. Kết thúc ở «không yêu»: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Petik»: bunga daisi mekar dan kelopaknya dipetik satu per satu — «cinta», «tidak cinta»…\n2. Kelopak terakhir menentukan: «cinta» menang. Makin banyak kelopak, makin besar bayarannya.\n3. 5 kelopak ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · daisi emas ×200. Berakhir di «tidak cinta»: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Гадать»: ромашка раскрывается, лепестки обрываются по одному — «любит», «не любит»…\n2. Решает последний лепесток: «любит» — выигрыш. Чем больше лепестков, тем больше выплата.\n3. 5 лепестков ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · золотая ромашка ×200. Закончилось на «не любит» — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Zupfen“: Das Gänseblümchen blüht auf, die Blätter werden einzeln gezupft — „liebt mich“, „liebt mich nicht“…\n2. Das letzte Blatt entscheidet: „liebt mich“ gewinnt. Mehr Blätter zahlen mehr.\n3. 5 Blätter ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · goldenes Gänseblümchen ×200. Endet auf „liebt mich nicht“: Einsatz verloren.',
      hi: '1. राशि चुनें और «तोड़ें» छुएं: डेज़ी खिलती है और पंखुड़ियां एक-एक कर तोड़ी जाती हैं — «प्यार करता है», «नहीं करता»…\n2. आखिरी पंखुड़ी तय करती है: «प्यार करता है» जीतता है। ज़्यादा पंखुड़ियां ज़्यादा देती हैं।\n3. 5 पंखुड़ियां ×1 · 7 ×1.8 · 9 ×3 · 11 ×8 · 13 ×25 · सुनहरी डेज़ी ×200। «नहीं करता» पर खत्म: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“摘花瓣”：雏菊绽放，花瓣被一片片摘下——“爱我”、“不爱我”……\n2. 最后一片花瓣决定结果：“爱我”即赢。花瓣越多，赔付越高。\n3. 5 瓣 ×1 · 7 瓣 ×1.8 · 9 瓣 ×3 · 11 瓣 ×8 · 13 瓣 ×25 · 金色雏菊 ×200。停在“不爱我”：输掉下注。'
    }
  });

  /* =============================== BOUQUET TOSS (choix) =============================== */
  // 5 demoiselles d'honneur : chances 35 · 25 · 20 · 12 · 8 % (la plus proche → la plus loin) ; gain = 0,94 ÷ chance (serveur)
  var BQ = [0.35, 0.25, 0.2, 0.12, 0.08], BQC = ['#F472B6', '#C084FC', '#34D399', '#60A5FA', '#FB923C'];
  var BQP = [[150, 214, 1.15], [82, 182, 0.95], [218, 182, 0.95], [44, 150, 0.78], [256, 150, 0.78]]; // place sur scène (x, y, taille)
  function bqMult(p) { return Math.floor(0.94 / p * 100) / 100; }
  function lady(col, hair) { return '<g><path d="M-14 0L-6-30H6L14 0z" fill="' + col + '"/><path d="M-6-30L-8-44H8L6-30z" fill="' + col + '"/><circle cy="-50" r="7" fill="#FAD7BD"/><path d="M-7-52a7 7 0 0 1 14 0q-2-6-7-6t-7 6z" fill="' + hair + '"/><path d="M-8-42l-8 14M8-42l8 14" stroke="#FAD7BD" stroke-width="3" stroke-linecap="round" class="bq-arms"/></g>'; }
  function bouquet() { return '<g><path d="M-2 4L0 14 2 4z" fill="#15803D"/>' + [[-5, -2, '#F472B6'], [5, -2, '#FDE68A'], [0, -6, '#fff'], [-3, 3, '#FB7185'], [4, 3, '#F9A8D4']].map(function (f) { return '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="4" fill="' + f[2] + '"/>'; }).join('') + '</g>'; }
  game({
    key: 'bouquet', l: verb('toss'), vb: '0 0 300 250',
    scene: '<defs><radialGradient id="bqBg" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#FDF2F8"/><stop offset="1" stop-color="#7E22CE"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#3B0764"/><ellipse cx="150" cy="80" rx="220" ry="150" fill="url(#bqBg)" opacity=".45"/>' +
      '<path d="M90 70Q150 -20 210 70" fill="none" stroke="#F9A8D4" stroke-width="5"/>' + [0, 1, 2, 3, 4, 5, 6].map(function (j) { var a = Math.PI * (j / 6), x = 150 - Math.cos(a) * 60, y = 70 - Math.sin(a) * 60 * 1.1; return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6" fill="' + ['#fff', '#FBCFE8', '#F472B6'][j % 3] + '"/>'; }).join('') +
      '<path d="M-400 120H700V700H-400z" fill="#581C87" opacity=".6"/>' +
      // mariée (de dos)
      '<g id="bqBride" transform="translate(150 98)"><path d="M-20 22L-8-14H8L20 22z" fill="#fff" stroke="#E9D5FF"/><path d="M-6-14L-8-26H8L6-14z" fill="#fff"/><circle cy="-32" r="7" fill="#78350F"/><path d="M-12-30Q0-50 12-30L18 10Q0 0-18 10z" fill="#fff" opacity=".55"/>' +
        '<g id="bqHeld" transform="translate(0 -40)">' + bouquet() + '</g></g>' +
      BQP.map(function (p, j) { return '<g class="bq-l" data-o="' + j + '" id="bqL' + j + '" transform="translate(' + p[0] + ' ' + p[1] + ') scale(' + p[2] + ')"><ellipse cy="2" rx="22" ry="6" class="bq-ring"/>' + lady(BQC[j], ['#78350F', '#1F2937', '#B45309', '#F59E0B', '#7C2D12'][j]) + '</g>'; }).join('') +
      '<g id="bqFly" opacity="0">' + bouquet() + '</g><g id="bqConf"></g>',
    opts: function () { return '<div class="cg-opts bq-opts">' + BQ.map(function (p, j) { return '<button type="button" data-o="' + j + '"' + (j === 0 ? ' class="on"' : '') + '><b class="fit" style="color:' + BQC[j] + '">' + Math.round(p * 100) + '%</b><small class="fit">' + xm(bqMult(p)) + '</small></button>'; }).join('') + '</div>'; },
    init: function (c) {
      c.sel = 0;
      var paint = function () { c.qa('.bq-opts button').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-o') === c.sel); }); c.qa('.bq-l').forEach(function (g) { g.classList.toggle('on', +g.getAttribute('data-o') === c.sel); }); };
      c.qa('.bq-opts button, .bq-l').forEach(function (b) { b.addEventListener('click', function () { if (c.box.classList.contains('m4-busy')) return; c.sel = +b.getAttribute('data-o'); paint(); }); });
      paint();
    },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.id('bqHeld').style.opacity = ''; c.id('bqFly').setAttribute('opacity', '0'); c.id('bqConf').innerHTML = ''; c.qa('.bq-l').forEach(function (g) { g.classList.remove('got'); }); },
    play: async function (c, r) {
      var w = +r.view.w, P = BQP[w], fly = c.id('bqFly'), br = c.id('bqBride');
      await tw(c.box, 450, function (k) { br.setAttribute('transform', 'translate(150 98) rotate(' + (Math.sin(k * Math.PI) * -8).toFixed(1) + ')'); });
      c.id('bqHeld').style.opacity = '0'; fly.setAttribute('opacity', '1');
      // le bouquet tournoie au-dessus de toutes, hésite, puis tombe sur la gagnante
      var mid = [lerp(150, P[0], 0.5) + (rnd(2) ? 40 : -40), 6];
      await tw(c.box, 1500, function (k) {
        var e = k, x = (1 - e) * (1 - e) * 150 + 2 * (1 - e) * e * mid[0] + e * e * P[0], y = (1 - e) * (1 - e) * 58 + 2 * (1 - e) * e * mid[1] + e * e * (P[1] - 58 * P[2]);
        tr(fly, x, y, 1 + Math.sin(k * Math.PI) * 0.6, k * 900);
      });
      var L = c.id('bqL' + w); L.classList.add('got');
      if (L.animate) L.animate([{ transform: 'translate(' + P[0] + 'px,' + P[1] + 'px) scale(' + P[2] + ')' }, { transform: 'translate(' + P[0] + 'px,' + (P[1] - 12) + 'px) scale(' + P[2] + ')' }, { transform: 'translate(' + P[0] + 'px,' + P[1] + 'px) scale(' + P[2] + ')' }], { duration: 450 });
      if (w === +r.view.pick) {
        c.id('bqConf').innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (j) { return '<rect x="-2" y="-3" width="4" height="6" fill="' + BQC[j % 5] + '" transform="translate(' + (P[0] + (j - 6) * 6) + ' ' + (P[1] - 70) + ')"/>'; }).join('');
        var cf = c.qa('#bqConf rect');
        await tw(c.box, 800, function (k) { cf.forEach(function (e, j) { tr(e, P[0] + (j - 6) * 8 * (0.5 + k), P[1] - 70 - Math.sin(k * Math.PI) * 30 + k * 40, 1, k * 300 * (j % 2 ? 1 : -1)); }); });
      } else await wait(c.box, 400);
      br.setAttribute('transform', 'translate(150 98)');
    },
    rules: {
      en: '1. Pick the bridesmaid you think will catch the bouquet (her chance and payout are on her button), set your stake and tap “Toss”.\n2. The bride throws the bouquet over her shoulder.\n3. If your bridesmaid catches it you win: 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.74. Anyone else: the stake is lost.',
      fr: '1. Choisis la demoiselle d’honneur qui attrapera le bouquet (sa chance et son gain sont sur son bouton), ta mise, puis touche « Lancer ».\n2. La mariée lance le bouquet par-dessus son épaule.\n3. Si ta demoiselle l’attrape, tu gagnes : 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.74. Une autre l’attrape : la mise est perdue.',
      es: '1. Elige la dama de honor que crees que atrapará el ramo (su probabilidad y su pago están en su botón), tu apuesta, y toca «Lanzar».\n2. La novia lanza el ramo por encima del hombro.\n3. Si tu dama lo atrapa, ganas: 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.74. Si lo atrapa otra: pierdes la apuesta.',
      pt: '1. Escolha a dama de honra que vai pegar o buquê (a chance e o pagamento estão no botão dela), o valor, e toque em «Jogar».\n2. A noiva joga o buquê por cima do ombro.\n3. Se a sua dama pegar, você ganha: 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.74. Se outra pegar: a aposta é perdida.',
      ar: '1. اختاري وصيفة العروس التي ستلتقط الباقة (فرصتها وربحها على زرها)، ثم الرهان والمسي «ارمي».\n2. ترمي العروس الباقة من فوق كتفها.\n3. إذا التقطتها وصيفتك تربحين: 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.74. إذا التقطتها غيرها: تخسرين الرهان.',
      tr: '1. Buketi yakalayacağını düşündüğün nedimeyi seç (şansı ve ödemesi düğmesinde), bahsini belirle ve “At”a dokun.\n2. Gelin buketi omzunun üstünden atar.\n3. Senin nedimen yakalarsa kazanırsın: %35 ×2.68 · %25 ×3.76 · %20 ×4.69 · %12 ×7.83 · %8 ×11.74. Başkası yakalarsa: bahis kaybedilir.',
      vi: '1. Chọn phù dâu bạn nghĩ sẽ bắt được bó hoa (cơ hội và tiền thưởng ghi trên nút), chọn mức cược rồi chạm «Tung».\n2. Cô dâu tung bó hoa qua vai.\n3. Nếu phù dâu của bạn bắt được, bạn thắng: 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.74. Người khác bắt được: mất tiền cược.',
      id: '1. Pilih pengiring pengantin yang menurutmu akan menangkap buket (peluang dan bayarannya ada di tombolnya), atur taruhan, lalu sentuh «Lempar».\n2. Pengantin melempar buket melewati bahunya.\n3. Jika pilihanmu menangkapnya, kamu menang: 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.74. Orang lain menangkap: taruhan hilang.',
      ru: '1. Выберите подружку невесты, которая поймает букет (шанс и выплата на её кнопке), ставку и нажмите «Бросить».\n2. Невеста бросает букет через плечо.\n3. Если поймала ваша подружка — выигрыш: 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.74. Поймала другая — ставка проиграна.',
      de: '1. Wähle die Brautjungfer, die den Strauß fängt (Chance und Gewinn stehen auf ihrem Knopf), deinen Einsatz und tippe auf „Werfen“.\n2. Die Braut wirft den Strauß über die Schulter.\n3. Fängt ihn deine Brautjungfer, gewinnst du: 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.74. Fängt ihn eine andere: Einsatz verloren.',
      hi: '1. वह ब्राइड्समेड चुनें जो गुलदस्ता पकड़ेगी (उसका मौका और भुगतान उसके बटन पर है), राशि चुनें और «उछालें» छुएं।\n2. दुल्हन गुलदस्ता कंधे के ऊपर से फेंकती है।\n3. आपकी चुनी हुई पकड़े तो जीत: 35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.75। कोई और पकड़े: दांव हार जाते हैं।',
      zh: '1. 选择你认为会接到捧花的伴娘（她的概率和赔率写在按钮上），设定金额并点击“抛花”。\n2. 新娘把捧花从肩上抛出。\n3. 你选的伴娘接到即赢：35 % ×2.68 · 25 % ×3.76 · 20 % ×4.69 · 12 % ×7.83 · 8 % ×11.75。被别人接到：输掉下注。'
    }
  });

  /* =============================== FIREWORKS =============================== */
  // 3 fusées : 0 toutes différentes · 1 deux pareilles ×0.5 · 2…6 trois vertes ×3 · bleues ×5 · roses ×10 · violettes ×20 · or ×100
  var FW = ['#4ADE80', '#60A5FA', '#F472B6', '#C084FC', '#FBBF24'];
  function shell(col, r) { var s = ''; for (var j = 0; j < 16; j++) { var a = j * Math.PI / 8; s += '<path d="M' + (Math.cos(a) * r * 0.25).toFixed(1) + ' ' + (Math.sin(a) * r * 0.25).toFixed(1) + 'L' + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1) + '" stroke="' + col + '" stroke-width="' + (r / 14).toFixed(1) + '" stroke-linecap="round"/><circle cx="' + (Math.cos(a) * r * 1.08).toFixed(1) + '" cy="' + (Math.sin(a) * r * 1.08).toFixed(1) + '" r="' + (r / 10).toFixed(1) + '" fill="#fff"/>'; } return s; }
  game({
    key: 'fireworks', l: verb('fire'), vb: '0 0 300 250',
    chips: [['<g transform="translate(-5 0)">' + shell('#F472B6', 5) + '</g><g transform="translate(5 0)">' + shell('#F472B6', 5) + '</g>', 0.5]].concat(FW.map(function (col, j) { return [shell(col, 9), [3, 5, 10, 20, 100][j]]; })),
    chipOf: function (i) { return i >= 1 ? i - 1 : -1; },
    scene: '<defs><linearGradient id="fwSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020617"/><stop offset="1" stop-color="#312E81"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#fwSky)"/>' +
      '<g fill="#fff" opacity=".6">' + [[20, 30], [70, 12], [120, 40], [200, 20], [250, 50], [280, 14], [40, 90], [230, 100]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r=".9"/>'; }).join('') + '</g>' +
      '<g id="fwB"></g>' +
      // ville au bord de l'eau
      '<path d="M-400 196H10V170h18v26h10v-40h22v40h8v-22h16v22h14v-54h20v54h10v-30h16v30h18v-46h14v46h12v-26h20v26h16v-36h22v36h12v-18h22v18H700V700H-400z" fill="#0F0A2A"/>' +
      '<g fill="#FDE68A" opacity=".6">' + [[16, 178], [44, 166], [50, 180], [110, 150], [116, 166], [176, 158], [182, 172], [232, 174], [264, 184], [140, 188]].map(function (p) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="3" height="3"/>'; }).join('') + '</g>' +
      '<rect x="-400" y="208" width="1100" height="500" fill="#1E1B4B"/><g id="fwRef" opacity=".35"></g>' +
      '<g id="fwR"></g>',
    reset: function (c) { c.id('fwB').innerHTML = ''; c.id('fwRef').innerHTML = ''; },
    play: async function (c, r) {
      var i = +r.view.i, cols;
      if (i >= 2) { var cc = FW[i - 2]; cols = [cc, cc, cc]; }
      else if (i === 1) { var two = shuffle(FW.slice()); cols = shuffle([two[0], two[0], two[1]]); }
      else cols = shuffle(FW.slice()).slice(0, 3);
      var X = [70, 150, 230], Y = [70, 52, 74], rG = c.id('fwR'), bG = c.id('fwB');
      for (var j = 0; j < 3; j++) {
        rG.innerHTML = '<g><path d="M0 0V10" stroke="#FDE68A" stroke-width="2" stroke-linecap="round"/><circle r="2.4" fill="#fff"/></g>'; var rk = rG.firstChild, x0 = X[j];
        await tw(c.box, 650, function (k) { tr(rk, x0 + Math.sin(k * 9) * 2, lerp(205, Y[j], ease(k))); });
        rG.innerHTML = '';
        var big = i === 6 ? 1.35 : 1;
        bG.insertAdjacentHTML('beforeend', '<g class="fw-s" transform="translate(' + x0 + ' ' + Y[j] + ')">' + shell(cols[j], 34 * big) + '</g>');
        c.id('fwRef').insertAdjacentHTML('beforeend', '<g transform="translate(' + x0 + ' 230) scale(1 -.4)">' + shell(cols[j], 30) + '</g>');
        var s = bG.lastChild;
        await tw(c.box, 420, function (k) { tr(s, x0, Y[j] + k * 4, 0.2 + 0.8 * ease(k)); });
      }
      // les fusées pareilles scintillent
      var cnt = {}; cols.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; });
      c.qa('.fw-s').forEach(function (s, j) { if (cnt[cols[j]] >= 2) s.classList.add('on'); else s.style.opacity = '.45'; });
      await wait(c.box, 250);
    },
    rules: {
      en: '1. Set your stake and tap “Launch”: 3 rockets fly up and burst over the city.\n2. Matching colours win.\n3. Two alike ×0.5 · three green ×3 · three blue ×5 · three pink ×10 · three purple ×20 · three gold ×100. Three different colours: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Tirer » : 3 fusées montent et éclatent au-dessus de la ville.\n2. Les couleurs pareilles gagnent.\n3. Deux pareilles ×0.5 · trois vertes ×3 · trois bleues ×5 · trois roses ×10 · trois violettes ×20 · trois dorées ×100. Trois couleurs différentes : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Lanzar»: 3 cohetes suben y estallan sobre la ciudad.\n2. Los colores iguales ganan.\n3. Dos iguales ×0.5 · tres verdes ×3 · tres azules ×5 · tres rosas ×10 · tres violetas ×20 · tres doradas ×100. Tres colores distintos: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Lançar»: 3 foguetes sobem e explodem sobre a cidade.\n2. Cores iguais ganham.\n3. Duas iguais ×0.5 · três verdes ×3 · três azuis ×5 · três rosas ×10 · três roxas ×20 · três douradas ×100. Três cores diferentes: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «أطلق»: تنطلق 3 صواريخ وتنفجر فوق المدينة.\n2. الألوان المتطابقة تربح.\n3. اثنان متشابهان ×0.5 · ثلاثة خضراء ×3 · ثلاثة زرقاء ×5 · ثلاثة وردية ×10 · ثلاثة بنفسجية ×20 · ثلاثة ذهبية ×100. ثلاثة ألوان مختلفة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Ateşle”ye dokun: 3 roket yükselir ve şehrin üstünde patlar.\n2. Aynı renkler kazanır.\n3. İki aynı ×0.5 · üç yeşil ×3 · üç mavi ×5 · üç pembe ×10 · üç mor ×20 · üç altın ×100. Üç farklı renk: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Bắn»: 3 quả pháo bay lên và nổ trên thành phố.\n2. Các màu trùng nhau sẽ thắng.\n3. Hai giống nhau ×0.5 · ba xanh lá ×3 · ba xanh dương ×5 · ba hồng ×10 · ba tím ×20 · ba vàng ×100. Ba màu khác nhau: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Nyalakan»: 3 roket meluncur dan meledak di atas kota.\n2. Warna yang sama menang.\n3. Dua sama ×0.5 · tiga hijau ×3 · tiga biru ×5 · tiga merah muda ×10 · tiga ungu ×20 · tiga emas ×100. Tiga warna berbeda: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Запуск»: 3 ракеты взлетают и взрываются над городом.\n2. Выигрывают совпавшие цвета.\n3. Два одинаковых ×0.5 · три зелёных ×3 · три синих ×5 · три розовых ×10 · три фиолетовых ×20 · три золотых ×100. Три разных цвета — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Zünden“: 3 Raketen steigen auf und explodieren über der Stadt.\n2. Gleiche Farben gewinnen.\n3. Zwei gleiche ×0.5 · drei grüne ×3 · drei blaue ×5 · drei pinke ×10 · drei lila ×20 · drei goldene ×100. Drei verschiedene Farben: Einsatz verloren.',
      hi: '1. राशि चुनें और «छोड़ें» छुएं: 3 रॉकेट उड़कर शहर के ऊपर फूटते हैं।\n2. एक जैसे रंग जीतते हैं।\n3. दो एक जैसे ×0.5 · तीन हरे ×3 · तीन नीले ×5 · तीन गुलाबी ×10 · तीन बैंगनी ×20 · तीन सुनहरे ×100। तीन अलग रंग: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“燃放”：3 枚烟花升空，在城市上空绽放。\n2. 颜色相同即赢。\n3. 两个相同 ×0.5 · 三个绿色 ×3 · 三个蓝色 ×5 · 三个粉色 ×10 · 三个紫色 ×20 · 三个金色 ×100。三种不同颜色：输掉下注。'
    }
  });

  /* =============================== GOLD RUSH (batée) =============================== */
  // ligne → grammes : 0, 3, 6, 10, 15, 20, 30, 50, 100, 250, 1000 ; gain = grammes ÷ 10
  var GG = [0, 3, 6, 10, 15, 20, 30, 50, 100, 250, 1000], NUG = [500, 250, 100, 50, 25, 10, 5, 2, 1];
  function nugget(g, seed) { var r = Math.min(24, 4 + Math.sqrt(g) * 1.9), d = ''; for (var j = 0; j < 9; j++) { var a = j / 9 * Math.PI * 2, rr = r * (0.75 + K.seeded(seed, j) * 0.4); d += (j ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr * 0.8).toFixed(1); } return '<path d="' + d + 'z" fill="url(#grG)" stroke="#92400E" stroke-width=".8" stroke-linejoin="round"/><circle cx="' + (-r * .3).toFixed(1) + '" cy="' + (-r * .3).toFixed(1) + '" r="' + (r * .22).toFixed(1) + '" fill="#FEF9C3" opacity=".8"/>'; }
  function gchip(t) { return '<text y="3.5" font-size="' + (t.length > 3 ? 8 : 9) + '" font-weight="900" fill="#FDE68A" text-anchor="middle">' + t + '</text>'; }
  game({
    key: 'goldpan', l: verb('pan'), vb: '0 0 300 250',
    chips: [['10g', 1], ['20g', 2], ['50g', 5], ['100g', 10], ['250g', 25], ['1kg', 100]].map(function (x) { return [gchip(x[0]), x[1]]; }),
    chipOf: function (i) { return { 3: 0, 5: 1, 7: 2, 8: 3, 9: 4, 10: 5 }[i] != null ? { 3: 0, 5: 1, 7: 2, 8: 3, 9: 4, 10: 5 }[i] : -1; },
    scene: '<defs><linearGradient id="grG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".45" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient>' +
      '<radialGradient id="grPan" r=".5"><stop offset="0" stop-color="#57534E"/><stop offset=".85" stop-color="#292524"/><stop offset="1" stop-color="#78716C"/></radialGradient>' +
      '<linearGradient id="grRiv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E7490"/><stop offset="1" stop-color="#164E63"/></linearGradient>' +
      '<clipPath id="grClip"><ellipse cx="150" cy="130" rx="92" ry="62"/></clipPath></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#422006"/><path d="M-400-400H700V60H-400z" fill="#1E1B4B"/><path d="M-400 60L20 30 80 50 160 20 240 46 700 30V70H-400z" fill="#57534E"/>' +
      '<rect x="-400" y="60" width="1100" height="200" fill="url(#grRiv)"/><g class="gr-w" stroke="#A5F3FC" stroke-opacity=".35" fill="none" stroke-width="1.5"><path d="M-20 80q15-5 30 0t30 0M200 90q15-5 30 0t30 0M30 220q15-5 30 0t30 0M220 210q15-5 30 0t30 0"/></g>' +
      '<g id="grPanG"><ellipse cx="150" cy="134" rx="104" ry="72" fill="#1C1917" opacity=".45"/><ellipse cx="150" cy="130" rx="100" ry="68" fill="url(#grPan)" stroke="#A8A29E" stroke-width="3"/>' +
        '<g clip-path="url(#grClip)"><g id="grSand"></g><g id="grNug"></g><ellipse id="grWater" cx="150" cy="130" rx="92" ry="62" fill="#22D3EE" opacity=".35"/></g></g>' +
      '<g transform="translate(150 226)"><rect x="-46" y="-14" width="92" height="26" rx="8" fill="#0B0820" stroke="#FBBF24" stroke-opacity=".6"/><text id="grW" y="5" text-anchor="middle" font-size="14" font-weight="900" fill="#FDE68A" font-family="monospace">0 g</text></g>',
    init: function (c) {
      c.sand = function () { var s = ''; for (var j = 0; j < 70; j++) s += '<circle cx="' + (70 + Math.random() * 160).toFixed(0) + '" cy="' + (88 + Math.random() * 84).toFixed(0) + '" r="' + (2 + Math.random() * 4).toFixed(1) + '" fill="' + ['#78716C', '#A8A29E', '#57534E', '#92400E'][rnd(4)] + '"/>'; c.id('grSand').innerHTML = s; };
      c.sand();
    },
    reset: function (c) { c.sand(); c.id('grNug').innerHTML = ''; c.id('grW').textContent = '0 g'; c.id('grSand').style.opacity = ''; c.id('grWater').setAttribute('opacity', '.35'); },
    play: async function (c, r) {
      var g = GG[+r.view.i], parts = [], left = g;
      // découpe du poids en pépites (au hasard, au plus 9 pépites)
      while (left > 0 && parts.length < 9) { var opts = NUG.filter(function (n) { return n <= left && (left - n === 0 || parts.length < 8); }); var n = opts[Math.min(opts.length - 1, rnd(2))]; parts.push(n); left -= n; }
      if (left > 0) parts[0] += left;
      var pos = parts.map(function (p, j) { return [110 + rnd(80), 100 + rnd(56)]; });
      c.id('grNug').innerHTML = parts.map(function (p, j) { return '<g transform="translate(' + pos[j][0] + ' ' + pos[j][1] + ')" opacity="0">' + nugget(p, j + p) + '</g>'; }).join('');
      var pan = c.id('grPanG'), sand = c.id('grSand'), water = c.id('grWater'), ns = c.qa('#grNug > g'), wEl = c.id('grW');
      await tw(c.box, 1900, function (k) {
        var a = Math.sin(k * Math.PI * 6) * 6 * (1 - k * 0.5);
        pan.setAttribute('transform', 'rotate(' + a.toFixed(1) + ' 150 130)');
        sand.style.opacity = String(Math.max(0, 1 - k * 1.15));
        sand.setAttribute('transform', 'rotate(' + (k * 120).toFixed(0) + ' 150 130)');
        water.setAttribute('opacity', (0.35 - 0.25 * k).toFixed(2));
        ns.forEach(function (e, j) { e.setAttribute('opacity', String(Math.min(1, Math.max(0, (k - 0.35 - j * 0.04) * 3)))); });
        wEl.textContent = Math.round(g * Math.max(0, Math.min(1, (k - 0.35) / 0.6))) + ' g';
      });
      pan.removeAttribute('transform'); wEl.textContent = (g >= 1000 ? '1 kg' : g + ' g');
    },
    rules: {
      en: '1. Set your stake and tap “Pan”: the miner swirls the pan in the river and the sand washes away.\n2. The gold left in the pan is weighed: every 10 g pays ×1.\n3. 3 g ×0.3 · 10 g ×1 · 20 g ×2 · 50 g ×5 · 100 g ×10 · 250 g ×25 · 1 kg ×100. No gold: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Tamiser » : le chercheur fait tourner la batée dans la rivière et le sable part.\n2. L’or qui reste est pesé : chaque 10 g paie ×1.\n3. 3 g ×0.3 · 10 g ×1 · 20 g ×2 · 50 g ×5 · 100 g ×10 · 250 g ×25 · 1 kg ×100. Pas d’or : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Cribar»: el buscador gira la batea en el río y la arena se va.\n2. El oro que queda se pesa: cada 10 g paga ×1.\n3. 3 g ×0.3 · 10 g ×1 · 20 g ×2 · 50 g ×5 · 100 g ×10 · 250 g ×25 · 1 kg ×100. Sin oro: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Peneirar»: o garimpeiro gira a bateia no rio e a areia sai.\n2. O ouro que sobra é pesado: cada 10 g paga ×1.\n3. 3 g ×0.3 · 10 g ×1 · 20 g ×2 · 50 g ×5 · 100 g ×10 · 250 g ×25 · 1 kg ×100. Sem ouro: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «اغسل»: يدير المنقّب الصحن في النهر فيذهب الرمل.\n2. يوزن الذهب المتبقي: كل 10 غ تدفع ×1.\n3. 3 غ ×0.3 · 10 غ ×1 · 20 غ ×2 · 50 غ ×5 · 100 غ ×10 · 250 غ ×25 · 1 كغ ×100. لا ذهب: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Ele”ye dokun: madenci tavayı nehirde döndürür, kum akıp gider.\n2. Tavada kalan altın tartılır: her 10 g ×1 öder.\n3. 3 g ×0.3 · 10 g ×1 · 20 g ×2 · 50 g ×5 · 100 g ×10 · 250 g ×25 · 1 kg ×100. Altın yoksa: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Đãi vàng»: người thợ lắc chảo dưới sông và cát trôi đi.\n2. Vàng còn lại được cân: mỗi 10 g trả ×1.\n3. 3 g ×0.3 · 10 g ×1 · 20 g ×2 · 50 g ×5 · 100 g ×10 · 250 g ×25 · 1 kg ×100. Không có vàng: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Dulang»: penambang memutar dulang di sungai dan pasir hanyut.\n2. Emas yang tersisa ditimbang: setiap 10 g membayar ×1.\n3. 3 g ×0.3 · 10 g ×1 · 20 g ×2 · 50 g ×5 · 100 g ×10 · 250 g ×25 · 1 kg ×100. Tidak ada emas: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Мыть»: старатель крутит лоток в реке, песок уходит.\n2. Оставшееся золото взвешивают: каждые 10 г — ×1.\n3. 3 г ×0.3 · 10 г ×1 · 20 г ×2 · 50 г ×5 · 100 г ×10 · 250 г ×25 · 1 кг ×100. Нет золота — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Waschen“: Der Goldsucher schwenkt die Pfanne im Fluss, der Sand wird weggespült.\n2. Das übrige Gold wird gewogen: je 10 g zahlen ×1.\n3. 3 g ×0.3 · 10 g ×1 · 20 g ×2 · 50 g ×5 · 100 g ×10 · 250 g ×25 · 1 kg ×100. Kein Gold: Einsatz verloren.',
      hi: '1. राशि चुनें और «छानें» छुएं: खोजी नदी में तसला घुमाता है और रेत बह जाती है।\n2. बचा हुआ सोना तौला जाता है: हर 10 ग्राम पर ×1।\n3. 3 ग्रा ×0.3 · 10 ग्रा ×1 · 20 ग्रा ×2 · 50 ग्रा ×5 · 100 ग्रा ×10 · 250 ग्रा ×25 · 1 किग्रा ×100। सोना नहीं: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“淘金”：淘金者在河里摇动淘金盘，沙子被冲走。\n2. 盘中剩下的黄金称重：每 10 克 ×1。\n3. 3 克 ×0.3 · 10 克 ×1 · 20 克 ×2 · 50 克 ×5 · 100 克 ×10 · 250 克 ×25 · 1 千克 ×100。没有黄金：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
