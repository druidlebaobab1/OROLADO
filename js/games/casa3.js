/* casa3 (owner request, round 6) — 6 instant-win games: Lucky 21, Balloon Darts, Egg Hunt, Crab Shells, Color Wheel,
   Lucky Numbers. The server draws the line (view.i) or the winning option (view.w) — casino_ext/casa.php — and the
   scene always shows exactly that result. Visitors see the games play by themselves (no money, no sound). */
(function (D6) {
  'use strict';
  /* ---- small kit shared by the casa instant games (copied in casa2.js and casa3.js: one file is loaded per game) ---- */
  var K = D6.CasinoKit, $ = K.$;
  var GONE = { gone: 1 };
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function xm(v) { return '×' + String(v).replace('.', K.dec()); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ease(k) { return 1 - Math.pow(1 - k, 3); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function pmult(p) { return Math.floor(0.94 / p * 100) / 100; } // = casino_ext_pick_mult()
  function tw(box, ms, fn) {
    ms = lite() ? Math.round(ms * 0.6) : ms;
    return new Promise(function (res, rej) {
      var t0 = performance.now();
      var st = function (now) { if (!box.isConnected) { rej(GONE); return; } var k = Math.max(0, Math.min(1, (now - t0) / ms)); fn(k); if (k < 1) K.S.raf = requestAnimationFrame(st); else res(); };
      K.S.raf = requestAnimationFrame(st);
    });
  }
  function wait(box, ms) { return K.sleep(lite() ? Math.round(ms * 0.6) : ms).then(function () { if (!box.isConnected) throw GONE; }); }
  function tr(el, x, y, s, r) { if (el) el.setAttribute('transform', 'translate(' + (+x).toFixed(1) + ' ' + (+y).toFixed(1) + ')' + (s != null && s !== 1 ? ' scale(' + (+s).toFixed(3) + ')' : '') + (r ? ' rotate(' + (+r).toFixed(1) + ')' : '')); }
  function amb(k, on) { try { if (D6.Sfx && D6.Sfx.amb) D6.Sfx.amb(k, on, 0.5); } catch (e) { /* ignore */ } }
  function snd(ev, a, k) { try { if (D6.Sfx && D6.Sfx.play) D6.Sfx.play(ev, a, k); } catch (e) { /* ignore */ } }
  function rules(R) { ['fr', 'es', 'pt', 'tr', 'vi', 'id', 'ru', 'de'].forEach(function (k) { if (R[k]) R[k] = R[k].replace(/(\d)\.(\d)/g, '$1,$2'); }); return R; }
  function Lw(T) { return T[K.lang()] || T.en; }
  /* o = { key, verb: {lang: word}, vb, scene, chips: [[svg, mult]], chipOf(i, r), opts(), init(c), params(c), reset(c), play(c, r), rows: [mult…] | pick: n, rules } */
  function game(o) {
    K.register(o.key, function (box) {
      var busy = false;
      box.classList.add('cg-game', 'cy', 'cy-' + o.key);
      box.innerHTML = '<div class="cg-stage cy-stage">' + (o.chips ? '<div class="cy-pay">' + o.chips.map(function (c, i) { return '<span data-c="' + i + '">' + (c[0] ? '<svg viewBox="-12 -12 24 24" aria-hidden="true">' + c[0] + '</svg>' : '') + '<b class="fit" dir="ltr">' + (c[2] || xm(c[1])) + '</b></span>'; }).join('') + '</div>' : '') +
        '<div class="cy-scene"><svg class="cy-svg" viewBox="' + (o.vb || '0 0 300 250') + '" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + o.scene + '</svg></div></div>' + K.stakePanel(Lw(o.verb), o.opts ? o.opts() : '');
      K.bindStake(box);
      var c = { box: box, key: o.key, demo: false, svg: box.querySelector('.cy-svg'), q: function (s) { return box.querySelector(s); }, qa: function (s) { return [].slice.call(box.querySelectorAll(s)); },
        mark: function (i) { box.querySelectorAll('.cy-pay span').forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-c') === i); }); },
        sfx: function (ev, a) { if (!c.demo) K.sfx(ev, a); }, snd: function (ev, a) { if (!c.demo) snd(ev, a, o.key); } };
      c.id = function (s) { return box.querySelector('#' + s); };
      // choices (options and scene) — o.sel(c, j) is called when the player picks
      c.sel = 0;
      c.pickOpt = function (j) { c.sel = j; c.qa('.cy-opts button').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-o') === j); }); if (o.onSel) o.onSel(c, j); };
      c.qa('.cy-opts button').forEach(function (b) { b.addEventListener('click', function () { if (busy && !c.demo) return; c.pickOpt(+b.getAttribute('data-o')); }); });
      if (o.init) o.init(c);
      if (o.opts) c.pickOpt(o.sel0 || 0);
      requestAnimationFrame(function () { K.fitAll(box); });
      var go = $('csGo');
      go.addEventListener('click', async function () {
        if (busy) return;
        if (K.guest()) { K.play(o.key, {}); return; }
        var p = o.params ? o.params(c) : {};
        if (p === null) return;
        busy = true;
        if (demoP) { stopDemo = true; go.disabled = true; await demoP; demoP = null; } // the visitor just signed in: the demo ends first
        c.demo = false; go.disabled = true; box.classList.add('cy-busy'); c.mark(-1);
        var r = null, shown = false;
        try {
          if (o.reset) o.reset(c);
          r = await K.play(o.key, p);
          if (!r || !box.isConnected) return;
          amb(o.key, true);
          await o.play(c, r);
          amb(o.key, false);
          if (!box.isConnected) return;
          var i = r.view && r.view.i != null ? +r.view.i : -1;
          c.mark(o.chipOf ? o.chipOf(i, r) : -1);
          shown = true; K.resultLine(box, r);
        } catch (e) {
          amb(o.key, false);
          if (e !== GONE) { try { console.warn(e); } catch (e2) { /* ignore */ } if (r && !shown && box.isConnected) K.resultLine(box, r); }
        }
        finally { busy = false; if (box.isConnected) { go.disabled = false; box.classList.remove('cy-busy'); } }
      });
      // visitor: the game plays by itself (made-up results, no money, no sound)
      var stopDemo = false, demoP = null;
      if (K.guest()) {
        c.demo = true;
        demoP = (async function attract() {
          try {
            await wait(box, 1000);
            while (!stopDemo && K.guest()) {
              var fake;
              if (o.pick) { if (o.opts && Math.random() < 0.5) c.pickOpt(rnd(o.pick)); var w = o.pickW ? o.pickW() : rnd(o.pick); fake = { view: { w: w, pick: c.sel }, mult: w === c.sel ? 2 : 0 }; }
              else { var i2 = Math.random() < 0.4 ? 0 : 1 + rnd(Math.min(o.rows.length - 1, 4)); fake = { view: { i: i2 }, mult: o.rows[i2] }; }
              if (o.reset) o.reset(c);
              c.mark(-1);
              await o.play(c, fake);
              c.mark(o.chipOf ? o.chipOf(fake.view.i != null ? fake.view.i : -1, fake) : -1);
              if (!stopDemo) await wait(box, 2400);
            }
          } catch (e) { /* left the game */ }
          if (box.isConnected) { if (o.reset) o.reset(c); c.mark(-1); }
        })();
      }
    }, { rules: rules(o.rules) });
  }
  var V = {
    deal: { en: 'Deal', fr: 'Distribuer', es: 'Repartir', pt: 'Distribuir', ar: 'وزّع', tr: 'Dağıt', vi: 'Chia bài', id: 'Bagikan', ru: 'Раздать', de: 'Geben', hi: 'बांटें', zh: '发牌' },
    throwit: { en: 'Throw', fr: 'Lancer', es: 'Lanzar', pt: 'Lançar', ar: 'ارمِ', tr: 'At', vi: 'Ném', id: 'Lempar', ru: 'Бросить', de: 'Werfen', hi: 'फेंकें', zh: '投掷' },
    search: { en: 'Search', fr: 'Chercher', es: 'Buscar', pt: 'Procurar', ar: 'ابحث', tr: 'Ara', vi: 'Tìm', id: 'Cari', ru: 'Искать', de: 'Suchen', hi: 'खोजें', zh: '寻找' },
    shuffle: { en: 'Shuffle', fr: 'Mélanger', es: 'Mezclar', pt: 'Embaralhar', ar: 'اخلط', tr: 'Karıştır', vi: 'Xáo', id: 'Kocok', ru: 'Мешать', de: 'Mischen', hi: 'फेंटें', zh: '洗' },
    spin: { en: 'Spin', fr: 'Tourner', es: 'Girar', pt: 'Girar', ar: 'دوّر', tr: 'Çevir', vi: 'Quay', id: 'Putar', ru: 'Крутить', de: 'Drehen', hi: 'घुमाएं', zh: '旋转' },
    draw: { en: 'Draw', fr: 'Tirer', es: 'Sortear', pt: 'Sortear', ar: 'اسحب', tr: 'Çek', vi: 'Rút', id: 'Undi', ru: 'Тянуть', de: 'Ziehen', hi: 'निकालें', zh: '抽奖' }
  };
  var STAR = function (r, f) { var d = ''; for (var j = 0; j < 10; j++) { var a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? r * 0.45 : r; d += (j ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1); } return '<path d="' + d + 'z" fill="' + f + '"/>'; };
  var GOLDG = '<linearGradient id="cyGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".5" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient>';
  function burst(c, x, y, col) {
    if (c.demo && Math.random() < 0.5) return Promise.resolve();
    var g = c.id('cyFx'); if (!g) return Promise.resolve();
    g.innerHTML = Array.apply(null, Array(10)).map(function (_, j) { return '<g transform="translate(' + x + ' ' + y + ')">' + STAR(4, j % 2 ? '#FDE68A' : (col || '#fff')) + '</g>'; }).join('');
    var e = [].slice.call(g.children), A = e.map(function (_, j) { return j / e.length * Math.PI * 2 + Math.random() * 0.4; });
    return tw(c.box, 650, function (k) { e.forEach(function (el, j) { tr(el, x + Math.cos(A[j]) * 46 * ease(k), y + Math.sin(A[j]) * 40 * ease(k) + k * k * 12, 1.2 - k * 0.8, k * 200); el.setAttribute('opacity', (1 - k).toFixed(2)); }); }).then(function () { g.innerHTML = ''; });
  }
  var RK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var SUIT = ['M0-9C-5-15-14-10-12-3-10 3 0 9 0 9S10 3 12-3C14-10 5-15 0-9z', 'M0-11L9 0 0 11-9 0z', 'M0-12C-4-6-12-4-12 2s8 6 10 2l-2 8h8l-2-8c2 4 10 4 10-2S4-6 0-12z', 'M0-12C3-7 11-3 11 2c0 5-7 6-9 2l1 8H-3l1-8c-2 4-9 3-9-2C-11-3-3-7 0-12z'];
  function card(rank, s, w) {
    var red = s < 2, col = red ? '#DC2626' : '#111827', h = w * 1.4;
    return '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (w * 0.12) + '" fill="#fff" stroke="#CBD5E1" stroke-width="1.4"/>' +
      '<text x="' + (-w / 2 + w * 0.1) + '" y="' + (-h / 2 + w * 0.36) + '" font-size="' + (w * 0.3) + '" font-weight="900" fill="' + col + '" font-family="var(--cg-font),Arial">' + RK[rank] + '</text>' +
      '<path d="' + SUIT[s] + '" fill="' + col + '" transform="translate(0 ' + (h * 0.08) + ') scale(' + (w / 34) + ')"/>';
  }
  function back(w) { var h = w * 1.4; return '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (w * 0.12) + '" fill="#B91C1C" stroke="#FDE68A" stroke-width="2"/><rect x="' + (-w / 2 + 4) + '" y="' + (-h / 2 + 4) + '" width="' + (w - 8) + '" height="' + (h - 8) + '" rx="' + (w * 0.08) + '" fill="none" stroke="#FECACA" stroke-width="1.2" stroke-dasharray="3 3"/><g transform="scale(' + (w / 40) + ')">' + STAR(8, '#FDE68A') + '</g>'; }

  /* =============================== LUCKY 21 =============================== */
  // 3 cards (13 ranks, A = 11 or 1, J Q K = 10): total 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4 · 7-7-7 ×100 · else ×0 (exact counts: casino_ext/casa.php)
  var F21 = [0, 0.6, 2, 3, 5.4, 100];
  function f21Total(t) { var s = 0, a = 0; t.forEach(function (r) { if (r === 0) { s += 11; a++; } else s += Math.min(10, r + 1); }); while (s > 21 && a) { s -= 10; a--; } return s; }
  function f21Class(t) { if (t[0] === 6 && t[1] === 6 && t[2] === 6) return 5; var s = f21Total(t); return s >= 18 && s <= 21 ? s - 17 : 0; }
  function f21Deal(i) { for (;;) { var t = [rnd(13), rnd(13), rnd(13)]; if (f21Class(t) === i) return t; } }
  var FX = [70, 150, 230];
  game({
    key: 'flip21', verb: V.deal, rows: F21,
    chips: [['', 0.6, '18'], ['', 2, '19'], ['', 3, '20'], ['', 5.4, '21'], ['', 100, '777']].map(function (q) { return [q[0], q[1], q[2] + ' ' + xm(q[1])]; }),
    chipOf: function (i) { return i > 0 ? i - 1 : -1; },
    scene: '<defs>' + GOLDG + '<radialGradient id="f2Felt" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#1D4ED8"/><stop offset="1" stop-color="#0B1440"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#f2Felt)"/><path d="M-20 40Q150 -10 320 40" stroke="#FDE68A" stroke-opacity=".3" stroke-width="2" fill="none"/>' +
      '<text x="150" y="34" text-anchor="middle" font-size="22" font-weight="900" fill="#FDE68A" opacity=".35" font-family="var(--cg-font),Arial" letter-spacing="6">21</text>' +
      FX.map(function (x, j) { return '<g class="f2-c" id="f2C' + j + '" transform="translate(' + x + ' 118)"></g>'; }).join('') +
      '<g transform="translate(150 212)"><rect x="-46" y="-22" width="92" height="44" rx="22" fill="#0B1440" stroke="url(#cyGold)" stroke-width="3"/><text id="f2T" y="10" text-anchor="middle" font-size="28" font-weight="900" fill="#fff" font-family="var(--cg-font),Arial">0</text></g><g id="cyFx"></g>',
    init: function (c) { c.backs = function () { FX.forEach(function (x, j) { var g = c.id('f2C' + j); g.innerHTML = back(70); tr(g, x, 118); }); c.id('f2T').textContent = '0'; c.id('f2T').setAttribute('fill', '#fff'); }; c.backs(); },
    reset: function (c) { c.backs(); },
    play: async function (c, r) {
      var i = +r.view.i, t = f21Deal(i), su = t.map(function () { return rnd(4); });
      for (var j = 0; j < 3; j++) {
        var g = c.id('f2C' + j), x = FX[j], rk = t[j], st = su[j], flipped = false;
        await tw(c.box, 380, function (k) { var sx = Math.abs(Math.cos(k * Math.PI)); if (k >= 0.5 && !flipped) { flipped = true; g.innerHTML = card(rk, st, 70); } g.setAttribute('transform', 'translate(' + x + ' ' + (118 - Math.sin(k * Math.PI) * 14).toFixed(1) + ') scale(' + Math.max(0.02, sx).toFixed(3) + ' 1)'); });
        tr(g, x, 118); c.sfx('card');
        var tot = f21Total(t.slice(0, j + 1)); c.id('f2T').textContent = tot;
        await wait(c.box, 160);
      }
      var tot2 = f21Total(t); c.id('f2T').setAttribute('fill', i > 0 ? '#4ADE80' : tot2 > 21 ? '#F87171' : '#fff');
      if (i > 0) await burst(c, 150, 118);
    },
    rules: {
      en: '1. Set your stake and tap “Deal”: 3 cards turn over (A counts 11 or 1, J Q K count 10).\n2. The total of the 3 cards decides: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. Three 7s pay ×100. Under 18 or over 21: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Distribuer » : 3 cartes se retournent (l’As vaut 11 ou 1, V D R valent 10).\n2. Le total des 3 cartes décide : 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. Trois 7 paient ×100. Moins de 18 ou plus de 21 : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Repartir»: se voltean 3 cartas (el As vale 11 o 1, J Q K valen 10).\n2. El total de las 3 cartas decide: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. Tres 7 pagan ×100. Menos de 18 o más de 21: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Distribuir»: 3 cartas viram (o Ás vale 11 ou 1, J Q K valem 10).\n2. O total das 3 cartas decide: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. Três 7 pagam ×100. Menos de 18 ou mais de 21: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «وزّع»: تنقلب 3 أوراق (الآس 11 أو 1، والشاب والملكة والملك 10).\n2. مجموع الأوراق الثلاث يقرر: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. ثلاث سبعات تربح ×100. أقل من 18 أو أكثر من 21: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Dağıt”a dokun: 3 kart açılır (As 11 veya 1, Vale Kız Papaz 10 sayılır).\n2. 3 kartın toplamı belirler: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. Üç 7 ×100 öder. 18’in altı veya 21’in üstü: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Chia bài»: 3 lá lật lên (A tính 11 hoặc 1, J Q K tính 10).\n2. Tổng 3 lá quyết định: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. Ba lá 7 trả ×100. Dưới 18 hoặc trên 21: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Bagikan»: 3 kartu terbuka (As bernilai 11 atau 1, J Q K bernilai 10).\n2. Total 3 kartu menentukan: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. Tiga kartu 7 membayar ×100. Di bawah 18 atau di atas 21: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Раздать»: открываются 3 карты (туз — 11 или 1, валет, дама, король — 10).\n2. Решает сумма 3 карт: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. Три семёрки платят ×100. Меньше 18 или больше 21 — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Geben“: 3 Karten werden aufgedeckt (Ass zählt 11 oder 1, Bube Dame König zählen 10).\n2. Die Summe der 3 Karten entscheidet: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4.\n3. Drei 7er zahlen ×100. Unter 18 oder über 21: Einsatz verloren.',
      hi: '1. राशि चुनें और «बांटें» छुएं: 3 पत्ते खुलते हैं (इक्का 11 या 1, गुलाम बेगम बादशाह 10)।\n2. 3 पत्तों का जोड़ तय करता है: 18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4।\n3. तीन 7 पर ×100। 18 से कम या 21 से ज़्यादा: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“发牌”：翻开 3 张牌（A 算 11 或 1，J Q K 算 10）。\n2. 3 张牌的点数总和决定结果：18 ×0.6 · 19 ×2 · 20 ×3 · 21 ×5.4。\n3. 三张 7 赔 ×100。低于 18 或超过 21：输掉下注。'
    }
  });

  /* =============================== BALLOON DARTS =============================== */
  // 3 darts: balloons popped 0 ×0 · 1 ×0.4 · 2 ×1.5 · 3 ×4 · 3 with the golden balloon ×25
  var PD = [0, 0.4, 1.5, 4, 25], PDC = ['#F43F5E', '#3B82F6', '#22C55E', '#A855F7', '#F97316', '#06B6D4'];
  var PDX = [60, 120, 180, 240], PDY = [58, 116, 174];
  function balloon(col, gold) { return '<path d="M0 22q-2 8 3 14" stroke="#E5E7EB" stroke-width="1.2" fill="none"/><path d="M0-24c14 0 22 10 22 22S10 22 0 22-22 10-22-2 -14-24 0-24z" fill="' + (gold ? 'url(#cyGold)' : col) + '" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/><path d="M-3 22h6l-3 4z" fill="' + (gold ? '#B45309' : col) + '"/><ellipse cx="-8" cy="-10" rx="5" ry="8" fill="#fff" opacity=".45" transform="rotate(-25 -8 -10)"/>' + (gold ? '<g transform="translate(0 -1)">' + STAR(7, '#fff') + '</g>' : ''); }
  game({
    key: 'popdarts', verb: V.throwit, rows: PD,
    chips: [1, 2, 3].map(function (n) { return ['<g fill="#F43F5E">' + [0, 1, 2].slice(0, n).map(function (q) { return '<circle cx="' + ((q - (n - 1) / 2) * 7) + '" cy="0" r="4.4"/>'; }).join('') + '</g>', PD[n]]; }).concat([['<circle r="7" fill="#FBBF24" stroke="#B45309"/>', 25]]),
    chipOf: function (i) { return i > 0 ? i - 1 : -1; },
    scene: '<defs>' + GOLDG + '<linearGradient id="pdWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#92400E"/><stop offset="1" stop-color="#451A03"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#1C1917"/><path d="M-400 0H700" stroke="#DC2626" stroke-width="28"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (j) { return '<path d="M' + (j * 44 - 20) + ' -14l22 28h22l-22-28z" fill="#FDE68A"/>'; }).join('') +
      '<rect x="18" y="24" width="264" height="190" rx="10" fill="url(#pdWall)" stroke="#FBBF24" stroke-width="3"/><g opacity=".2" stroke="#000">' + [60, 100, 140, 180].map(function (y) { return '<path d="M18 ' + y + 'H282"/>'; }).join('') + '</g>' +
      '<g id="pdB"></g><g id="pdD"></g><g id="cyFx"></g>',
    init: function (c) {
      c.board = function () {
        c.gold = rnd(12);
        c.id('pdB').innerHTML = PDY.map(function (y, r) { return PDX.map(function (x, q) { var j = r * 4 + q; return '<g class="pd-b" id="pdB' + j + '" transform="translate(' + x + ' ' + y + ')">' + balloon(PDC[(j * 5 + r) % 6], j === c.gold) + '</g>'; }).join(''); }).join('');
        c.id('pdD').innerHTML = '';
      };
      c.board();
    },
    reset: function (c) { c.board(); },
    play: async function (c, r) {
      var i = +r.view.i, pops = i === 4 ? 3 : i, others = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(function (j) { return j !== c.gold; }));
      var hits = others.slice(0, pops); if (i === 4) hits[rnd(3)] = c.gold;
      var plan = shuffle(hits.map(function (h) { return { h: h }; }).concat([0, 1, 2].slice(pops).map(function () { return { h: -1 }; })));
      var D = c.id('pdD');
      for (var j = 0; j < 3; j++) {
        var p = plan[j], tx, ty;
        if (p.h >= 0) { tx = PDX[p.h % 4]; ty = PDY[Math.floor(p.h / 4)]; }
        else { tx = 90 + rnd(3) * 60; ty = 87 + rnd(2) * 58; } // between balloons
        D.insertAdjacentHTML('beforeend', '<g class="pd-d"><path d="M0 0l-4-26h8z" fill="#E5E7EB"/><path d="M-6-26l6-10 6 10z" fill="#DC2626"/><path d="M0 0v3" stroke="#111" stroke-width="2"/></g>');
        var dart = D.lastChild;
        c.sfx('act');
        await tw(c.box, 380, function (k) { var e = ease(k); tr(dart, lerp(150, tx, e), lerp(260, ty + 6, e) - Math.sin(k * Math.PI) * 30, 1.6 - k * 0.8, 0); });
        if (p.h >= 0) {
          var b = c.id('pdB' + p.h); c.snd('pop'); c.sfx('hit');
          await tw(c.box, 200, function (k) { b.setAttribute('transform', 'translate(' + tx + ' ' + ty + ') scale(' + (1 + k * 0.5).toFixed(2) + ')'); b.setAttribute('opacity', (1 - k).toFixed(2)); });
          dart.setAttribute('opacity', '0');
        } else { c.sfx('tick'); await wait(c.box, 140); }
      }
      if (pops >= 2) await burst(c, 150, 116, i === 4 ? '#FDE68A' : '#F9A8D4');
    },
    rules: {
      en: '1. Set your stake and tap “Throw”: 3 darts fly at the wall of balloons.\n2. Each dart pops a balloon or misses. The more balloons you pop, the more you win.\n3. 1 balloon ×0.4 · 2 ×1.5 · 3 ×4 · 3 including the golden balloon ×25. No balloon: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : 3 fléchettes volent vers le mur de ballons.\n2. Chaque fléchette éclate un ballon ou le rate. Plus tu en éclates, plus tu gagnes.\n3. 1 ballon ×0.4 · 2 ×1.5 · 3 ×4 · 3 dont le ballon doré ×25. Aucun ballon : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Lanzar»: 3 dardos vuelan hacia el muro de globos.\n2. Cada dardo revienta un globo o falla. Cuantos más revientes, más ganas.\n3. 1 globo ×0.4 · 2 ×1.5 · 3 ×4 · 3 con el globo dorado ×25. Ningún globo: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Lançar»: 3 dardos voam para o muro de balões.\n2. Cada dardo estoura um balão ou erra. Quanto mais estourar, mais ganha.\n3. 1 balão ×0.4 · 2 ×1.5 · 3 ×4 · 3 com o balão dourado ×25. Nenhum balão: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «ارمِ»: تطير 3 سهام نحو جدار البالونات.\n2. كل سهم يفجّر بالونًا أو يخطئ. كلما فجّرت أكثر ربحت أكثر.\n3. بالون واحد ×0.4 · 2 ×1.5 · 3 ×4 · 3 منها البالون الذهبي ×25. لا بالون: تخسر الرهان.',
      tr: '1. Bahsini seç ve “At”a dokun: 3 dart balon duvarına uçar.\n2. Her dart bir balonu patlatır ya da ıskalar. Ne kadar çok patlatırsan o kadar kazanırsın.\n3. 1 balon ×0.4 · 2 ×1.5 · 3 ×4 · altın balon dahil 3 ×25. Hiç balon yok: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Ném»: 3 phi tiêu bay vào bức tường bóng bay.\n2. Mỗi phi tiêu làm nổ một quả bóng hoặc trượt. Nổ càng nhiều, thắng càng lớn.\n3. 1 bóng ×0.4 · 2 ×1.5 · 3 ×4 · 3 gồm bóng vàng ×25. Không quả nào: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lempar»: 3 anak panah melesat ke dinding balon.\n2. Setiap anak panah memecahkan balon atau meleset. Makin banyak pecah, makin besar menang.\n3. 1 balon ×0.4 · 2 ×1.5 · 3 ×4 · 3 termasuk balon emas ×25. Tak ada balon: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бросить»: 3 дротика летят в стену шариков.\n2. Каждый дротик лопает шарик или промахивается. Чем больше лопнет, тем больше выигрыш.\n3. 1 шарик ×0.4 · 2 ×1.5 · 3 ×4 · 3 вместе с золотым ×25. Ни одного — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Werfen“: 3 Pfeile fliegen auf die Ballonwand.\n2. Jeder Pfeil lässt einen Ballon platzen oder verfehlt. Je mehr platzen, desto mehr gewinnst du.\n3. 1 Ballon ×0.4 · 2 ×1.5 · 3 ×4 · 3 mit dem goldenen Ballon ×25. Kein Ballon: Einsatz verloren.',
      hi: '1. राशि चुनें और «फेंकें» छुएं: 3 डार्ट गुब्बारों की दीवार पर उड़ते हैं।\n2. हर डार्ट एक गुब्बारा फोड़ता है या चूकता है। जितने ज़्यादा फूटें, उतनी बड़ी जीत।\n3. 1 गुब्बारा ×0.4 · 2 ×1.5 · 3 ×4 · सुनहरे समेत 3 ×25। एक भी नहीं: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“投掷”：3 支飞镖飞向气球墙。\n2. 每支飞镖扎破一个气球或落空。扎破越多，赢得越多。\n3. 1 个 ×0.4 · 2 个 ×1.5 · 3 个 ×4 · 含金色气球的 3 个 ×25。一个都没有：输掉下注。'
    }
  });

  /* =============================== EGG HUNT =============================== */
  // 3 bushes searched: (silver, gold) eggs found — same order as casino_ext/casa.php
  var EG = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [0, 3]], EGM = [0, 0.5, 1.5, 5, 2, 3, 6, 12, 20, 100];
  var EGX = [60, 150, 240], EGY = [64, 136, 208];
  function egg(t) { var f = t === 'g' ? 'url(#cyGold)' : t === 's' ? 'url(#egSil)' : '#FFF7ED'; return '<path d="M0-18C10-18 15-2 15 6c0 9-7 14-15 14S-15 15-15 6C-15-2-10-18 0-18z" fill="' + f + '" stroke="' + (t === 'w' ? '#D6D3D1' : '#78350F') + '" stroke-width="1.4"/>' + (t === 'w' ? '<path d="M-12 4l6-4 6 4 6-4 6 4" stroke="#FDA4AF" stroke-width="2" fill="none"/>' : '<ellipse cx="-5" cy="-6" rx="3" ry="6" fill="#fff" opacity=".6" transform="rotate(-20 -5 -6)"/>'); }
  function bush() { return '<g class="eg-bush"><circle cx="-18" cy="6" r="16" fill="#15803D"/><circle cx="18" cy="6" r="16" fill="#15803D"/><circle cy="-6" r="20" fill="#22C55E"/><circle cx="-8" cy="-12" r="6" fill="#4ADE80" opacity=".6"/><circle cx="12" cy="0" r="3" fill="#F472B6"/><circle cx="-14" cy="10" r="3" fill="#FDE047"/></g>'; }
  game({
    key: 'egghunt', verb: V.search, rows: EGM,
    chips: [['<g transform="scale(.5)">' + egg('s') + '</g>', 0.5], ['<g transform="translate(-4 0) scale(.42)">' + egg('s') + '</g><g transform="translate(4 0) scale(.42)">' + egg('s') + '</g>', 1.5], ['<g transform="scale(.5)">' + egg('g') + '</g>', 2],
      ['<g transform="translate(-4 0) scale(.42)">' + egg('g') + '</g><g transform="translate(4 0) scale(.42)">' + egg('g') + '</g>', 12], ['<g transform="translate(-6 1) scale(.36)">' + egg('g') + '</g><g transform="translate(0 -2) scale(.36)">' + egg('g') + '</g><g transform="translate(6 1) scale(.36)">' + egg('g') + '</g>', 100]],
    chipOf: function (i) { return [1, 2, 4, 7, 9].indexOf(i); },
    scene: '<defs>' + GOLDG + '<linearGradient id="egSil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#CBD5E1"/><stop offset="1" stop-color="#64748B"/></linearGradient>' +
      '<linearGradient id="egSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BAE6FD"/><stop offset="1" stop-color="#86EFAC"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#4ADE80"/><rect x="-400" y="-400" width="1100" height="420" fill="url(#egSky)"/><circle cx="262" cy="14" r="14" fill="#FDE047" opacity=".8"/>' +
      '<g fill="#16A34A" opacity=".5">' + [[30, 240], [100, 246], [190, 242], [270, 246], [120, 30], [210, 34]].map(function (p) { return '<path d="M' + p[0] + ' ' + p[1] + 'l3-10 3 10 3-8 3 8z"/>'; }).join('') + '</g>' +
      EGY.map(function (y, r) { return EGX.map(function (x, q) { var j = r * 3 + q; return '<g class="eg-b" id="egB' + j + '" data-o="' + j + '" transform="translate(' + x + ' ' + y + ')"><ellipse cy="22" rx="38" ry="7" fill="#000" opacity=".15"/><g class="eg-e" opacity="0" transform="translate(0 -4)"></g>' + bush() + '<ellipse class="eg-sel" cy="20" rx="40" ry="9" fill="none" stroke="#FDE047" stroke-width="3" opacity="0"/></g>'; }).join(''); }).join('') +
      '<g id="cyFx"></g>',
    init: function (c) {
      c.chosen = [0, 4, 8];
      c.paintSel = function () { c.qa('.eg-b').forEach(function (e) { e.querySelector('.eg-sel').setAttribute('opacity', c.chosen.indexOf(+e.getAttribute('data-o')) >= 0 ? '1' : '0'); }); };
      c.qa('.eg-b').forEach(function (e) { e.addEventListener('click', function () { if (c.box.classList.contains('cy-busy') || c.demo) return; var j = +e.getAttribute('data-o'), q = c.chosen.indexOf(j); if (q >= 0) c.chosen.splice(q, 1); else { c.chosen.push(j); if (c.chosen.length > 3) c.chosen.shift(); } c.paintSel(); }); });
      c.hide = function () { c.qa('.eg-b').forEach(function (e) { var ee = e.querySelector('.eg-e'); ee.setAttribute('opacity', '0'); ee.innerHTML = ''; e.querySelector('.eg-bush').removeAttribute('transform'); e.classList.remove('dim'); }); };
      c.paintSel();
    },
    reset: function (c) { c.hide(); },
    play: async function (c, r) {
      var i = +r.view.i, n = EG[i], kinds = shuffle(['s', 's', 's'].slice(0, n[0]).concat(['g', 'g', 'g'].slice(0, n[1])).concat(['w', 'w', 'w']).slice(0, 3));
      var pick = c.chosen.slice();
      if (c.demo || pick.length < 3) { var rest = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8].filter(function (j) { return pick.indexOf(j) < 0; })); pick = (c.demo ? [] : pick).concat(rest).slice(0, 3); c.chosen = pick; c.paintSel(); }
      c.qa('.eg-b').forEach(function (e) { if (pick.indexOf(+e.getAttribute('data-o')) < 0) e.classList.add('dim'); });
      for (var j = 0; j < 3; j++) {
        var b = c.id('egB' + pick[j]), bu = b.querySelector('.eg-bush'), ee = b.querySelector('.eg-e'), t = kinds[j];
        await tw(c.box, 420, function (k) { bu.setAttribute('transform', 'rotate(' + (Math.sin(k * 26) * 7 * (1 - k)).toFixed(1) + ')'); });
        ee.innerHTML = egg(t);
        await tw(c.box, 300, function (k) { ee.setAttribute('opacity', k.toFixed(2)); tr(ee, 0, -4 - ease(k) * 26, 0.6 + k * 0.5); });
        if (t !== 'w') c.sfx('reveal', { k: t === 'g' ? 3 : 1 }); else c.sfx('tick');
        await wait(c.box, 120);
      }
      if (EGM[i] >= 1) await burst(c, 150, 120, '#FDE68A');
    },
    rules: {
      en: '1. Tap 3 bushes (or let luck choose), set your stake and tap “Search”.\n2. An egg hides under each bush you picked: plain, silver or gold.\n3. 1 silver ×0.5 · 2 silver ×1.5 · 3 silver ×5 · 1 gold ×2 · gold + silver ×3 · gold + 2 silver ×6 · 2 gold ×12 · 2 gold + silver ×20 · 3 gold ×100.',
      fr: '1. Touche 3 buissons (ou laisse le hasard choisir), choisis ta mise et touche « Chercher ».\n2. Un œuf se cache sous chaque buisson choisi : simple, argent ou or.\n3. 1 argent ×0.5 · 2 argent ×1.5 · 3 argent ×5 · 1 or ×2 · or + argent ×3 · or + 2 argent ×6 · 2 or ×12 · 2 or + argent ×20 · 3 or ×100.',
      es: '1. Toca 3 arbustos (o deja que la suerte elija), elige tu apuesta y toca «Buscar».\n2. Bajo cada arbusto elegido hay un huevo: normal, de plata o de oro.\n3. 1 plata ×0.5 · 2 plata ×1.5 · 3 plata ×5 · 1 oro ×2 · oro + plata ×3 · oro + 2 plata ×6 · 2 oro ×12 · 2 oro + plata ×20 · 3 oro ×100.',
      pt: '1. Toque em 3 arbustos (ou deixe a sorte escolher), escolha o valor e toque em «Procurar».\n2. Sob cada arbusto escolhido há um ovo: comum, de prata ou de ouro.\n3. 1 prata ×0.5 · 2 prata ×1.5 · 3 prata ×5 · 1 ouro ×2 · ouro + prata ×3 · ouro + 2 prata ×6 · 2 ouro ×12 · 2 ouro + prata ×20 · 3 ouro ×100.',
      ar: '1. المس 3 شجيرات (أو دع الحظ يختار)، اختر رهانك والمس «ابحث».\n2. تحت كل شجيرة اخترتها بيضة: عادية أو فضية أو ذهبية.\n3. فضية واحدة ×0.5 · فضيتان ×1.5 · 3 فضية ×5 · ذهبية ×2 · ذهبية + فضية ×3 · ذهبية + فضيتان ×6 · ذهبيتان ×12 · ذهبيتان + فضية ×20 · 3 ذهبية ×100.',
      tr: '1. 3 çalıya dokun (ya da şansa bırak), bahsini seç ve “Ara”ya dokun.\n2. Seçtiğin her çalının altında bir yumurta var: sade, gümüş ya da altın.\n3. 1 gümüş ×0.5 · 2 gümüş ×1.5 · 3 gümüş ×5 · 1 altın ×2 · altın + gümüş ×3 · altın + 2 gümüş ×6 · 2 altın ×12 · 2 altın + gümüş ×20 · 3 altın ×100.',
      vi: '1. Chạm 3 bụi cây (hoặc để may mắn chọn), chọn mức cược rồi chạm «Tìm».\n2. Dưới mỗi bụi đã chọn có một quả trứng: thường, bạc hoặc vàng.\n3. 1 bạc ×0.5 · 2 bạc ×1.5 · 3 bạc ×5 · 1 vàng ×2 · vàng + bạc ×3 · vàng + 2 bạc ×6 · 2 vàng ×12 · 2 vàng + bạc ×20 · 3 vàng ×100.',
      id: '1. Sentuh 3 semak (atau biarkan keberuntungan memilih), atur taruhan lalu sentuh «Cari».\n2. Di bawah setiap semak pilihanmu ada telur: biasa, perak, atau emas.\n3. 1 perak ×0.5 · 2 perak ×1.5 · 3 perak ×5 · 1 emas ×2 · emas + perak ×3 · emas + 2 perak ×6 · 2 emas ×12 · 2 emas + perak ×20 · 3 emas ×100.',
      ru: '1. Нажмите на 3 куста (или доверьтесь удаче), выберите ставку и нажмите «Искать».\n2. Под каждым выбранным кустом яйцо: простое, серебряное или золотое.\n3. 1 серебряное ×0.5 · 2 серебряных ×1.5 · 3 серебряных ×5 · 1 золотое ×2 · золотое + серебряное ×3 · золотое + 2 серебряных ×6 · 2 золотых ×12 · 2 золотых + серебряное ×20 · 3 золотых ×100.',
      de: '1. Tippe auf 3 Büsche (oder lass das Glück wählen), wähle deinen Einsatz und tippe auf „Suchen“.\n2. Unter jedem gewählten Busch liegt ein Ei: normal, Silber oder Gold.\n3. 1 Silber ×0.5 · 2 Silber ×1.5 · 3 Silber ×5 · 1 Gold ×2 · Gold + Silber ×3 · Gold + 2 Silber ×6 · 2 Gold ×12 · 2 Gold + Silber ×20 · 3 Gold ×100.',
      hi: '1. 3 झाड़ियां छुएं (या किस्मत पर छोड़ें), राशि चुनें और «खोजें» छुएं।\n2. चुनी हर झाड़ी के नीचे एक अंडा है: सादा, चांदी या सोना।\n3. 1 चांदी ×0.5 · 2 चांदी ×1.5 · 3 चांदी ×5 · 1 सोना ×2 · सोना + चांदी ×3 · सोना + 2 चांदी ×6 · 2 सोना ×12 · 2 सोना + चांदी ×20 · 3 सोना ×100।',
      zh: '1. 点选 3 丛灌木（或交给运气），设定金额并点击“寻找”。\n2. 每丛选中的灌木下都藏着一枚蛋：普通、银蛋或金蛋。\n3. 1 银 ×0.5 · 2 银 ×1.5 · 3 银 ×5 · 1 金 ×2 · 金 + 银 ×3 · 金 + 2 银 ×6 · 2 金 ×12 · 2 金 + 银 ×20 · 3 金 ×100。'
    }
  });

  /* =============================== CRAB SHELLS =============================== */
  // 4 shells, the pearl is under one (server: view.w) → ×3.76
  var SHX = [54, 118, 182, 246], SHY = 162;
  function shellSvg() { return '<path d="M-26 10C-28-12-14-26 0-26S28-12 26 10z" fill="url(#shG)" stroke="#9A3412" stroke-width="1.6"/>' + [-16, -8, 0, 8, 16].map(function (x) { return '<path d="M0 10L' + x + '-24" stroke="#9A3412" stroke-width="1.4" opacity=".6"/>'; }).join('') + '<path d="M-30 10h60" stroke="#9A3412" stroke-width="3" stroke-linecap="round"/>'; }
  game({
    key: 'shells', verb: V.shuffle, pick: 4,
    opts: function () { return '<div class="cg-opts cy-opts">' + [0, 1, 2, 3].map(function (j) { return '<button type="button" data-o="' + j + '"><b class="fit">' + (j + 1) + '</b><small class="fit">' + xm(pmult(0.25)) + '</small></button>'; }).join('') + '</div>'; },
    scene: '<defs>' + GOLDG + '<linearGradient id="shG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEDD5"/><stop offset=".6" stop-color="#FDBA74"/><stop offset="1" stop-color="#C2410C"/></linearGradient>' +
      '<radialGradient id="shPearl" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F5F3FF"/><stop offset="1" stop-color="#A5B4FC"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#FDE68A"/><rect x="-400" y="-400" width="1100" height="490" fill="#0EA5E9"/><path d="M-400 90q60-12 120 0t120 0 120 0 120 0 120 0 120 0V120H-400z" fill="#FEF3C7" opacity=".9"/>' +
      '<g fill="#F59E0B" opacity=".35">' + [[30, 230], [90, 214], [200, 236], [272, 220], [150, 120]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2"/>'; }).join('') + '</g>' +
      // crab
      '<g id="shCrab" transform="translate(150 76)"><ellipse rx="22" ry="13" fill="#DC2626" stroke="#7F1D1D" stroke-width="1.4"/><path d="M-20 4l-12 8M-18 8l-10 10M20 4l12 8M18 8l10 10" stroke="#B91C1C" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M-20-6q-14-14-4-22 4 8 10 4zM20-6q14-14 4-22-4 8-10 4z" fill="#EF4444" stroke="#7F1D1D"/><path d="M-6-12v-8M6-12v-8" stroke="#7F1D1D" stroke-width="2"/><circle cx="-6" cy="-21" r="3.4" fill="#fff"/><circle cx="6" cy="-21" r="3.4" fill="#fff"/><circle cx="-6" cy="-21" r="1.6" fill="#111"/><circle cx="6" cy="-21" r="1.6" fill="#111"/></g>' +
      '<g id="shPe" opacity="0"><circle r="9" fill="url(#shPearl)" stroke="#C7D2FE"/></g>' +
      SHX.map(function (x, j) { return '<g class="sh-s" id="shS' + j + '" data-o="' + j + '" transform="translate(' + x + ' ' + SHY + ')"><ellipse cy="12" rx="30" ry="6" fill="#000" opacity=".15"/><ellipse class="sh-ring" cy="13" rx="32" ry="8" fill="none" stroke="#B91C1C" stroke-width="3" opacity="0"/><g class="sh-top">' + shellSvg() + '</g></g>'; }).join('') +
      '<g id="cyFx"></g>',
    onSel: function (c, j) { c.qa('.sh-s').forEach(function (e, q) { e.querySelector('.sh-ring').setAttribute('opacity', q === j ? '1' : '0'); }); },
    init: function (c) {
      c.qa('.sh-s').forEach(function (e) { e.addEventListener('click', function () { if (c.box.classList.contains('cy-busy') || c.demo) return; c.pickOpt(+e.getAttribute('data-o')); }); });
      c.rest = function () { SHX.forEach(function (x, j) { var g = c.id('shS' + j); tr(g, x, SHY); g.querySelector('.sh-top').removeAttribute('transform'); }); c.id('shPe').setAttribute('opacity', '0'); };
    },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.rest(); },
    play: async function (c, r) {
      var w = +r.view.w, pk = +r.view.pick, pe = c.id('shPe'), crab = c.id('shCrab');
      // shells are elements 0…3; pos[s] = slot of shell s. Random swaps, then the pearl starts under the shell that ends on slot w.
      var pos = [0, 1, 2, 3], swaps = [], n = 6 + rnd(3), sim = pos.slice();
      for (var q = 0; q < n; q++) { var a = rnd(4), b = (a + 1 + rnd(3)) % 4; swaps.push([a, b]); var sa = sim.indexOf(a), sb = sim.indexOf(b); sim[sa] = b; sim[sb] = a; }
      var pearlShell = sim.indexOf(w); // sim[s] = final slot of shell s
      // show the pearl under its shell, then hide it
      var tops = [0, 1, 2, 3].map(function (s) { return c.id('shS' + s).querySelector('.sh-top'); });
      tr(pe, SHX[pearlShell], SHY + 2); pe.setAttribute('opacity', '1');
      await tw(c.box, 360, function (k) { tops[pearlShell].setAttribute('transform', 'translate(0 ' + (-Math.sin(k * Math.PI) * 30).toFixed(1) + ')'); });
      pe.setAttribute('opacity', '0');
      for (q = 0; q < swaps.length; q++) {
        var A = pos.indexOf(swaps[q][0]), B = pos.indexOf(swaps[q][1]), xa = SHX[swaps[q][0]], xb = SHX[swaps[q][1]], ga = c.id('shS' + A), gb = c.id('shS' + B);
        c.sfx('tick');
        await tw(c.box, 260, function (k) { var e = ease(k); tr(ga, lerp(xa, xb, e), SHY - Math.sin(k * Math.PI) * 16); tr(gb, lerp(xb, xa, e), SHY + Math.sin(k * Math.PI) * 10); tr(crab, 150 + Math.sin(k * Math.PI * 2) * 6, 76); });
        pos[A] = swaps[q][1]; pos[B] = swaps[q][0];
      }
      // lift the player's shell, then the pearl's shell
      var slotOf = function (slot) { return pos.indexOf(slot); }, liftSlot = function (slot) { var s = slotOf(slot); return tw(c.box, 320, function (k) { tops[s].setAttribute('transform', 'translate(0 ' + (-ease(k) * 34).toFixed(1) + ')'); }); };
      tr(pe, SHX[w], SHY + 2);
      await liftSlot(pk);
      if (pk === w) { pe.setAttribute('opacity', '1'); c.sfx('reveal'); await burst(c, SHX[w], SHY - 20); }
      else { await wait(c.box, 180); pe.setAttribute('opacity', '1'); await liftSlot(w); }
    },
    rules: {
      en: '1. Pick the shell you think hides the pearl (1 to 4), set your stake and tap “Shuffle”.\n2. The crab shows the pearl, then shuffles the 4 shells.\n3. The pearl under your shell pays ×3.76. Another shell: the stake is lost.',
      fr: '1. Choisis le coquillage qui cache la perle (1 à 4), ta mise, puis touche « Mélanger ».\n2. Le crabe montre la perle, puis mélange les 4 coquillages.\n3. La perle sous ton coquillage paie ×3.76. Sous un autre : la mise est perdue.',
      es: '1. Elige la concha que crees que esconde la perla (1 a 4), tu apuesta, y toca «Mezclar».\n2. El cangrejo muestra la perla y luego mezcla las 4 conchas.\n3. La perla bajo tu concha paga ×3.76. Bajo otra: pierdes la apuesta.',
      pt: '1. Escolha a concha que esconde a pérola (1 a 4), o valor, e toque em «Embaralhar».\n2. O caranguejo mostra a pérola e depois embaralha as 4 conchas.\n3. A pérola sob sua concha paga ×3.76. Sob outra: a aposta é perdida.',
      ar: '1. اختر الصدفة التي تخفي اللؤلؤة (1 إلى 4)، ثم رهانك والمس «اخلط».\n2. يُظهر السلطعون اللؤلؤة ثم يخلط الصدفات الأربع.\n3. اللؤلؤة تحت صدفتك تربح ×3.76. تحت أخرى: تخسر الرهان.',
      tr: '1. İncinin saklandığı deniz kabuğunu seç (1-4), bahsini belirle ve “Karıştır”a dokun.\n2. Yengeç inciyi gösterir, sonra 4 kabuğu karıştırır.\n3. İnci senin kabuğunun altındaysa ×3.76. Başka kabuk: bahis kaybedilir.',
      vi: '1. Chọn vỏ sò bạn nghĩ giấu viên ngọc (1 đến 4), chọn mức cược rồi chạm «Xáo».\n2. Chú cua cho xem viên ngọc rồi xáo 4 vỏ sò.\n3. Ngọc dưới vỏ của bạn trả ×3.76. Dưới vỏ khác: mất tiền cược.',
      id: '1. Pilih kerang yang menurutmu menyembunyikan mutiara (1 sampai 4), atur taruhan, lalu sentuh «Kocok».\n2. Kepiting menunjukkan mutiara, lalu mengocok 4 kerang.\n3. Mutiara di bawah kerangmu membayar ×3.76. Di bawah kerang lain: taruhan hilang.',
      ru: '1. Выберите ракушку, под которой, по-вашему, жемчужина (от 1 до 4), ставку и нажмите «Мешать».\n2. Краб показывает жемчужину и перемешивает 4 ракушки.\n3. Жемчужина под вашей ракушкой — ×3.76. Под другой — ставка проиграна.',
      de: '1. Wähle die Muschel, unter der du die Perle vermutest (1 bis 4), deinen Einsatz und tippe auf „Mischen“.\n2. Die Krabbe zeigt die Perle und mischt dann die 4 Muscheln.\n3. Die Perle unter deiner Muschel zahlt ×3.76. Unter einer anderen: Einsatz verloren.',
      hi: '1. वह सीप चुनें जिसके नीचे मोती है (1 से 4), राशि चुनें और «फेंटें» छुएं।\n2. केकड़ा मोती दिखाता है, फिर 4 सीपों को फेंटता है।\n3. आपकी सीप के नीचे मोती हो तो ×3.76। किसी और के नीचे: दांव हार जाते हैं।',
      zh: '1. 选择你认为藏着珍珠的贝壳（1 到 4），设定金额并点击“洗”。\n2. 螃蟹先展示珍珠，然后打乱 4 个贝壳。\n3. 珍珠在你的贝壳下赔 ×3.76。在别的贝壳下：输掉下注。'
    }
  });

  /* =============================== COLOR WHEEL =============================== */
  // 20 segments: red 9 · blue 6 · green 4 · gold 1 → ×2.08 · ×3.13 · ×4.69 · ×18.79 (server: view.w = colour)
  var CW = [0.45, 0.3, 0.2, 0.05], CWC = ['#EF4444', '#3B82F6', '#22C55E', 'url(#cyGold)'], CWB = ['#EF4444', '#3B82F6', '#22C55E', '#FBBF24'];
  var CWS = [3, 0, 1, 0, 2, 0, 1, 0, 2, 1, 0, 2, 0, 1, 0, 2, 1, 0, 1, 0];
  function wheelSvg() {
    var s = '', R = 92;
    CWS.forEach(function (col, j) { var a0 = (j * 18 - 9 - 90) * Math.PI / 180, a1 = ((j + 1) * 18 - 9 - 90) * Math.PI / 180; s += '<path d="M0 0L' + (Math.cos(a0) * R).toFixed(1) + ' ' + (Math.sin(a0) * R).toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + (Math.cos(a1) * R).toFixed(1) + ' ' + (Math.sin(a1) * R).toFixed(1) + 'z" fill="' + CWC[col] + '" stroke="#fff" stroke-width="1.4"/>'; });
    return s + '<circle r="' + R + '" fill="none" stroke="#FDE68A" stroke-width="5"/>' + CWS.map(function (_, j) { var a = (j * 18 + 9 - 90) * Math.PI / 180; return '<circle cx="' + (Math.cos(a) * (R + 1)).toFixed(1) + '" cy="' + (Math.sin(a) * (R + 1)).toFixed(1) + '" r="2.4" fill="#fff"/>'; }).join('') +
      '<circle r="20" fill="#1E1B4B" stroke="#FDE68A" stroke-width="3"/>' + STAR(10, '#FDE68A');
  }
  game({
    key: 'colorwheel', verb: V.spin, pick: 4, pickW: function () { var x = Math.random(), a = 0; for (var j = 0; j < 4; j++) { a += CW[j]; if (x < a) return j; } return 3; },
    opts: function () { return '<div class="cg-opts cy-opts">' + CW.map(function (p, j) { return '<button type="button" data-o="' + j + '"><b class="fit"><i style="background:' + CWB[j] + '"></i> ' + Math.round(p * 100) + '%</b><small class="fit">' + xm(pmult(p)) + '</small></button>'; }).join('') + '</div>'; },
    scene: '<defs>' + GOLDG + '<radialGradient id="cwBg" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#6D28D9"/><stop offset="1" stop-color="#1E1B4B"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#cwBg)"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (j) { var a = j * 30 * Math.PI / 180; return '<circle cx="' + (150 + Math.cos(a) * 112).toFixed(1) + '" cy="' + (128 + Math.sin(a) * 112).toFixed(1) + '" r="3" class="cw-bulb" style="animation-delay:' + (j * 0.1) + 's"/>'; }).join('') +
      '<g transform="translate(150 128)"><circle r="100" fill="#000" opacity=".3" transform="translate(0 6)"/><g id="cwW">' + wheelSvg() + '</g></g>' +
      '<path d="M150 46l-11-22h22z" fill="#FDE68A" stroke="#78350F" stroke-width="2"/><g id="cyFx"></g>',
    init: function (c) { c.rot = 0; },
    params: function (c) { return { pick: c.sel }; },
    play: async function (c, r) {
      var w = +r.view.w, segs = CWS.map(function (col, j) { return col === w ? j : -1; }).filter(function (j) { return j >= 0; }), seg = segs[rnd(segs.length)];
      var from = c.rot, target = -(seg * 18) + (Math.random() - 0.5) * 12, base = from - ((from % 360) + 360) % 360;
      var to = base + 360 * (4 + rnd(2)) + ((target % 360) + 360) % 360, W = c.id('cwW'), last = -1;
      await tw(c.box, 3200, function (k) {
        var e = 1 - Math.pow(1 - k, 3.4), a = from + (to - from) * e; W.setAttribute('transform', 'rotate(' + a.toFixed(2) + ')');
        var s = Math.floor((((-a + 9) % 360) + 360) % 360 / 18); if (s !== last) { last = s; c.sfx('tick'); }
      });
      c.rot = to % 360; W.setAttribute('transform', 'rotate(' + c.rot.toFixed(2) + ')');
      c.sfx('stop');
      if (w === +r.view.pick) await burst(c, 150, 60, CWB[w]); else await wait(c.box, 200);
    },
    rules: {
      en: '1. Pick a colour (its chance and payout are on its button), set your stake and tap “Spin”.\n2. The wheel has 20 segments: 9 red, 6 blue, 4 green and 1 gold.\n3. If the arrow stops on your colour: red ×2.08 · blue ×3.13 · green ×4.69 · gold ×18.79. Another colour: the stake is lost.',
      fr: '1. Choisis une couleur (sa chance et son gain sont sur son bouton), ta mise, puis touche « Tourner ».\n2. La roue a 20 cases : 9 rouges, 6 bleues, 4 vertes et 1 dorée.\n3. Si la flèche s’arrête sur ta couleur : rouge ×2.08 · bleu ×3.13 · vert ×4.69 · or ×18.79. Une autre couleur : la mise est perdue.',
      es: '1. Elige un color (su probabilidad y su pago están en su botón), tu apuesta, y toca «Girar».\n2. La rueda tiene 20 casillas: 9 rojas, 6 azules, 4 verdes y 1 dorada.\n3. Si la flecha para en tu color: rojo ×2.08 · azul ×3.13 · verde ×4.69 · oro ×18.79. Otro color: pierdes la apuesta.',
      pt: '1. Escolha uma cor (a chance e o pagamento estão no botão), o valor, e toque em «Girar».\n2. A roda tem 20 casas: 9 vermelhas, 6 azuis, 4 verdes e 1 dourada.\n3. Se a seta parar na sua cor: vermelho ×2.08 · azul ×3.13 · verde ×4.69 · ouro ×18.79. Outra cor: a aposta é perdida.',
      ar: '1. اختر لونًا (فرصته وربحه على زره)، ثم رهانك والمس «دوّر».\n2. في العجلة 20 خانة: 9 حمراء و6 زرقاء و4 خضراء و1 ذهبية.\n3. إذا توقف السهم على لونك: أحمر ×2.08 · أزرق ×3.13 · أخضر ×4.69 · ذهبي ×18.79. لون آخر: تخسر الرهان.',
      tr: '1. Bir renk seç (şansı ve ödemesi düğmesinde), bahsini belirle ve “Çevir”e dokun.\n2. Çarkta 20 dilim var: 9 kırmızı, 6 mavi, 4 yeşil ve 1 altın.\n3. Ok senin renginde durursa: kırmızı ×2.08 · mavi ×3.13 · yeşil ×4.69 · altın ×18.79. Başka renk: bahis kaybedilir.',
      vi: '1. Chọn một màu (cơ hội và tiền thưởng ghi trên nút), chọn mức cược rồi chạm «Quay».\n2. Vòng quay có 20 ô: 9 đỏ, 6 xanh dương, 4 xanh lá và 1 vàng.\n3. Nếu mũi tên dừng ở màu của bạn: đỏ ×2.08 · xanh dương ×3.13 · xanh lá ×4.69 · vàng ×18.79. Màu khác: mất tiền cược.',
      id: '1. Pilih warna (peluang dan bayarannya ada di tombolnya), atur taruhan, lalu sentuh «Putar».\n2. Roda punya 20 bagian: 9 merah, 6 biru, 4 hijau, dan 1 emas.\n3. Jika panah berhenti di warnamu: merah ×2.08 · biru ×3.13 · hijau ×4.69 · emas ×18.79. Warna lain: taruhan hilang.',
      ru: '1. Выберите цвет (шанс и выплата на его кнопке), ставку и нажмите «Крутить».\n2. На колесе 20 секторов: 9 красных, 6 синих, 4 зелёных и 1 золотой.\n3. Стрелка остановилась на вашем цвете: красный ×2.08 · синий ×3.13 · зелёный ×4.69 · золотой ×18.79. Другой цвет — ставка проиграна.',
      de: '1. Wähle eine Farbe (Chance und Gewinn stehen auf ihrem Knopf), deinen Einsatz und tippe auf „Drehen“.\n2. Das Rad hat 20 Felder: 9 rote, 6 blaue, 4 grüne und 1 goldenes.\n3. Hält der Pfeil auf deiner Farbe: Rot ×2.08 · Blau ×3.13 · Grün ×4.69 · Gold ×18.79. Andere Farbe: Einsatz verloren.',
      hi: '1. एक रंग चुनें (उसका मौका और भुगतान बटन पर है), राशि चुनें और «घुमाएं» छुएं।\n2. पहिये में 20 खाने हैं: 9 लाल, 6 नीले, 4 हरे और 1 सुनहरा।\n3. तीर आपके रंग पर रुके तो: लाल ×2.08 · नीला ×3.13 · हरा ×4.69 · सुनहरा ×18.79। दूसरा रंग: दांव हार जाते हैं।',
      zh: '1. 选择一种颜色（概率和赔率写在按钮上），设定金额并点击“旋转”。\n2. 转盘有 20 格：9 红、6 蓝、4 绿、1 金。\n3. 指针停在你的颜色：红 ×2.08 · 蓝 ×3.13 · 绿 ×4.69 · 金 ×18.79。其他颜色：输掉下注。'
    }
  });

  /* =============================== LUCKY NUMBERS =============================== */
  // ball machine with numbers 1–10; the drawn ball (server: view.w) pays the chosen number ×9.39
  var LNC = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#F43F5E'];
  function lball(n) { return '<circle r="13" fill="' + LNC[n] + '" stroke="rgba(0,0,0,.25)"/><circle r="7.4" fill="#fff"/><text y="3.6" text-anchor="middle" font-size="9.5" font-weight="900" fill="#111827" font-family="var(--cg-font),Arial">' + (n + 1) + '</text><ellipse cx="-5" cy="-6" rx="3.6" ry="2.2" fill="#fff" opacity=".6" transform="rotate(-30 -5 -6)"/>'; }
  game({
    key: 'luckyten', verb: V.draw, pick: 10,
    opts: function () { return '<div class="cg-opts cy-opts ln-opts">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (j) { return '<button type="button" data-o="' + j + '"><b class="fit" style="color:' + LNC[j] + '">' + (j + 1) + '</b></button>'; }).join('') + '</div>'; },
    scene: '<defs>' + GOLDG + '<radialGradient id="lnGlass" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".7" stop-color="#BAE6FD" stop-opacity=".08"/><stop offset="1" stop-color="#7DD3FC" stop-opacity=".3"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0F172A"/><g opacity=".3">' + [[30, 30], [270, 40], [40, 200], [262, 214], [150, 14]].map(function (p) { return '<g transform="translate(' + p[0] + ' ' + p[1] + ')">' + STAR(4, '#FDE68A') + '</g>'; }).join('') + '</g>' +
      '<path d="M110 170h80l-8 46h-64z" fill="url(#cyGold)" stroke="#78350F" stroke-width="2"/><path d="M190 196h44v14h-44z" fill="#B45309"/><circle cx="252" cy="203" r="20" fill="#1E293B" stroke="url(#cyGold)" stroke-width="3"/>' +
      '<circle cx="150" cy="100" r="76" fill="#0B1222"/><g id="lnBalls"></g><circle cx="150" cy="100" r="76" fill="url(#lnGlass)" stroke="#E0F2FE" stroke-opacity=".7" stroke-width="3"/><path d="M104 54a62 62 0 0 1 40-20" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".5"/>' +
      '<g id="lnOut"></g><g id="cyFx"></g>',
    init: function (c) {
      c.P = []; for (var j = 0; j < 10; j++) { var a = j * 0.63, rr = 20 + (j % 3) * 18; c.P.push([150 + Math.cos(a) * rr, 120 + Math.sin(a) * rr * 0.6, 0, 0]); }
      c.id('lnBalls').innerHTML = c.P.map(function (p, j) { return '<g class="ln-b" id="lnB' + j + '" transform="translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')">' + lball(j) + '</g>'; }).join('');
      c.draw = function () { c.P.forEach(function (p, j) { tr(c.id('lnB' + j), p[0], p[1]); }); };
    },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.id('lnOut').innerHTML = ''; c.qa('.ln-b').forEach(function (e) { e.removeAttribute('opacity'); }); },
    play: async function (c, r) {
      var w = +r.view.w, P = c.P;
      P.forEach(function (p) { p[2] = (Math.random() - 0.5) * 9; p[3] = -4 - Math.random() * 5; });
      await tw(c.box, 1700, function (k) {
        P.forEach(function (p) {
          p[3] += 0.5; p[0] += p[2]; p[1] += p[3];
          var dx = p[0] - 150, dy = p[1] - 100, d = Math.sqrt(dx * dx + dy * dy);
          if (d > 62) { var nx = dx / d, ny = dy / d, dot = p[2] * nx + p[3] * ny; p[2] -= 2 * dot * nx; p[3] -= 2 * dot * ny; p[0] = 150 + nx * 62; p[1] = 100 + ny * 62; if (k < 0.85) { p[3] -= 3 + Math.random() * 3; } }
        });
        c.draw(); if (Math.random() < 0.25) c.sfx('ball', { k: rnd(5) });
      });
      // the drawn ball drops through the chute
      var b = c.id('lnB' + w), x0 = P[w][0], y0 = P[w][1];
      await tw(c.box, 500, function (k) { tr(b, lerp(x0, 150, ease(k)), lerp(y0, 176, ease(k))); });
      b.setAttribute('opacity', '0');
      var out = c.id('lnOut'); out.innerHTML = '<g transform="translate(150 186)">' + lball(w) + '</g>'; var g = out.firstChild;
      await tw(c.box, 520, function (k) { tr(g, lerp(150, 252, ease(k)), lerp(186, 203, ease(k)), 1 + ease(k) * 0.35); });
      c.sfx('stop');
      if (w === +r.view.pick) await burst(c, 252, 203, LNC[w]); else await wait(c.box, 200);
      // the balls settle back
      P.forEach(function (p, j) { var a = j * 0.63, rr = 20 + (j % 3) * 18; p[0] = 150 + Math.cos(a) * rr; p[1] = 120 + Math.sin(a) * rr * 0.6; });
    },
    rules: {
      en: '1. Pick a number from 1 to 10, set your stake and tap “Draw”.\n2. The balls fly in the glass machine, then one ball drops out.\n3. If it is your number you win ×9.39. Another number: the stake is lost.',
      fr: '1. Choisis un numéro de 1 à 10, ta mise, puis touche « Tirer ».\n2. Les boules volent dans la machine en verre, puis une boule sort.\n3. Si c’est ton numéro, tu gagnes ×9.39. Un autre numéro : la mise est perdue.',
      es: '1. Elige un número del 1 al 10, tu apuesta, y toca «Sortear».\n2. Las bolas vuelan en la máquina de cristal y luego sale una bola.\n3. Si es tu número ganas ×9.39. Otro número: pierdes la apuesta.',
      pt: '1. Escolha um número de 1 a 10, o valor, e toque em «Sortear».\n2. As bolas voam na máquina de vidro e depois uma bola sai.\n3. Se for o seu número, você ganha ×9.39. Outro número: a aposta é perdida.',
      ar: '1. اختر رقمًا من 1 إلى 10، ثم رهانك والمس «اسحب».\n2. تتطاير الكرات في الآلة الزجاجية ثم تخرج كرة واحدة.\n3. إذا كانت رقمك تربح ×9.39. رقم آخر: تخسر الرهان.',
      tr: '1. 1’den 10’a bir sayı seç, bahsini belirle ve “Çek”e dokun.\n2. Toplar cam makinede uçuşur, sonra bir top dışarı düşer.\n3. Senin sayınsa ×9.39 kazanırsın. Başka sayı: bahis kaybedilir.',
      vi: '1. Chọn một số từ 1 đến 10, chọn mức cược rồi chạm «Rút».\n2. Các quả bóng bay trong lồng kính, rồi một quả rơi ra.\n3. Nếu đúng số của bạn, bạn thắng ×9.39. Số khác: mất tiền cược.',
      id: '1. Pilih angka 1 sampai 10, atur taruhan, lalu sentuh «Undi».\n2. Bola-bola beterbangan di mesin kaca, lalu satu bola keluar.\n3. Jika itu angkamu, kamu menang ×9.39. Angka lain: taruhan hilang.',
      ru: '1. Выберите число от 1 до 10, ставку и нажмите «Тянуть».\n2. Шары летают в стеклянном барабане, затем выпадает один шар.\n3. Если это ваше число — выигрыш ×9.39. Другое число — ставка проиграна.',
      de: '1. Wähle eine Zahl von 1 bis 10, deinen Einsatz und tippe auf „Ziehen“.\n2. Die Kugeln fliegen in der Glasmaschine, dann fällt eine Kugel heraus.\n3. Ist es deine Zahl, gewinnst du ×9.39. Andere Zahl: Einsatz verloren.',
      hi: '1. 1 से 10 में से एक नंबर चुनें, राशि चुनें और «निकालें» छुएं।\n2. कांच की मशीन में गेंदें उड़ती हैं, फिर एक गेंद बाहर गिरती है।\n3. आपका नंबर हो तो ×9.39 जीत। दूसरा नंबर: दांव हार जाते हैं।',
      zh: '1. 选择 1 到 10 中的一个号码，设定金额并点击“抽奖”。\n2. 小球在玻璃摇奖机里飞舞，然后掉出一个球。\n3. 是你的号码即赢 ×9.39。其他号码：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
