/* casc4 (owner request) — 6 NEW instant games (not slots): Rocket Cash, Gold Digger, Gift Rush,
   Treasure Cannon, Lucky Lift, Magic Hat. The server draws the prize tier (view.i) in casino_ext/casc.php
   (cascFill, return ≈ 93.8 %, marge 6 %); the browser animates the action and reveals exactly that tier.
   Visitors see the games play by themselves (no money, no sound). Kit copied from casc2.js/casc3.js. */
(function (D6) {
  'use strict';
  if (!D6.CasinoKit) return;
  var K = D6.CasinoKit, $ = K.$;
  var GONE = { gone: 1 };
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function xm(v) { return '×' + String(v).replace('.', K.dec()); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function ease(k) { return 1 - Math.pow(1 - k, 3); }
  function easeIn(k) { return k * k * k; }
  function lerp(a, b, k) { return a + (b - a) * k; }
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
  var STAR = function (r, f) { var d = ''; for (var j = 0; j < 10; j++) { var a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? r * 0.45 : r; d += (j ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1); } return '<path d="' + d + 'z" fill="' + f + '"/>'; };
  var GOLDG = '<linearGradient id="cyGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".5" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient>';
  function num(t, s, col) { return '<text y="' + (s * 0.36).toFixed(1) + '" text-anchor="middle" font-size="' + s + '" font-weight="900" fill="' + (col || '#fff') + '" font-family="var(--cg-font),Arial">' + t + '</text>'; }
  function burst(c, x, y, col) {
    if (c.demo && Math.random() < 0.5) return Promise.resolve();
    var g = c.id('cyFx'); if (!g) return Promise.resolve();
    g.innerHTML = Array.apply(null, Array(10)).map(function (_, j) { return '<g transform="translate(' + x + ' ' + y + ')">' + STAR(4, j % 2 ? '#FDE68A' : (col || '#fff')) + '</g>'; }).join('');
    var e = [].slice.call(g.children), A = e.map(function (_, j) { return j / e.length * Math.PI * 2 + Math.random() * 0.4; });
    return tw(c.box, 650, function (k) { e.forEach(function (el, j) { tr(el, x + Math.cos(A[j]) * 46 * ease(k), y + Math.sin(A[j]) * 40 * ease(k) + k * k * 12, 1.2 - k * 0.8, k * 200); el.setAttribute('opacity', (1 - k).toFixed(2)); }); }).then(function () { g.innerHTML = ''; });
  }
  // shared prize badge: a round medallion with the multiplier that pops in (loss tier 0 → nothing)
  function badge() { return '<g id="cyPrize" opacity="0"><circle r="30" fill="url(#cyGold)" stroke="#78350F" stroke-width="2.4"/><circle r="30" fill="none" stroke="#FFF7D6" stroke-width="1.2" opacity=".6"/><text id="cyPrizeT" text-anchor="middle" font-weight="900" font-family="var(--cg-font),Arial" fill="#5C2E0E"></text></g>'; }
  function showPrize(c, x, y, mult) {
    var g = c.id('cyPrize'); if (!g) return Promise.resolve();
    var t = c.id('cyPrizeT'), s = mult >= 100 ? 15 : mult >= 10 ? 18 : 20;
    if (t) { t.textContent = xm(mult); t.setAttribute('font-size', s); t.setAttribute('y', (s * 0.35).toFixed(1)); }
    g.setAttribute('opacity', '1');
    return tw(c.box, 520, function (k) { var e = k < 0.6 ? 1.25 * ease(k / 0.6) : 1.25 - 0.25 * ((k - 0.6) / 0.4); tr(g, x, y, e); }).then(function () { return burst(c, x, y, '#FDE68A'); });
  }
  function hidePrize(c) { var g = c.id('cyPrize'); if (g) { g.setAttribute('opacity', '0'); tr(g, 150, 110, 0.01); } }

  /* o = { key, verb, vb, scene, chips, chipOf, rows, prizeAt:[x,y], init(c), reset(c), act(c, win) → Promise, rules } */
  function game(o) {
    K.register(o.key, function (box) {
      var busy = false;
      box.classList.add('cg-game', 'cy', 'cy-' + o.key);
      box.innerHTML = '<div class="cg-stage cy-stage">' + (o.chips ? '<div class="cy-pay">' + o.chips.map(function (c, i) { return '<span data-c="' + i + '">' + (c[0] ? '<svg viewBox="-12 -12 24 24" aria-hidden="true">' + c[0] + '</svg>' : '') + '<b class="fit" dir="ltr">' + (c[2] || xm(c[1])) + '</b></span>'; }).join('') + '</div>' : '') +
        '<div class="cy-scene"><svg class="cy-svg" viewBox="' + (o.vb || '0 0 300 250') + '" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + o.scene + badge() + '<g id="cyFx"></g></svg></div></div>' + K.stakePanel(Lw(o.verb), '');
      K.bindStake(box);
      var c = { box: box, key: o.key, demo: false, svg: box.querySelector('.cy-svg'), q: function (s) { return box.querySelector(s); }, qa: function (s) { return [].slice.call(box.querySelectorAll(s)); },
        mark: function (i) { box.querySelectorAll('.cy-pay span').forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-c') === i); }); },
        sfx: function (ev, a) { if (!c.demo) K.sfx(ev, a); }, snd: function (ev, a) { if (!c.demo) snd(ev, a, o.key); } };
      c.id = function (s) { return box.querySelector('#' + s); };
      c.reveal = function (tier) { var m = o.rows[tier] || 0; if (m <= 0) return Promise.resolve(); return showPrize(c, o.prizeAt[0], o.prizeAt[1], m); };
      if (o.init) o.init(c);
      requestAnimationFrame(function () { K.fitAll(box); });
      var go = $('csGo');
      go.addEventListener('click', async function () {
        if (busy) return;
        if (K.guest()) { K.play(o.key, {}); return; }
        busy = true;
        if (demoP) { stopDemo = true; go.disabled = true; await demoP; demoP = null; }
        c.demo = false; go.disabled = true; box.classList.add('cy-busy'); c.mark(-1); hidePrize(c);
        var r = null, shown = false;
        try {
          if (o.reset) o.reset(c);
          r = await K.play(o.key, {});
          if (!r || !box.isConnected) return;
          amb(o.key, true);
          var i = r.view && r.view.i != null ? +r.view.i : 0;
          await o.act(c, i);
          await c.reveal(i);
          amb(o.key, false);
          if (!box.isConnected) return;
          c.mark(o.chipOf ? o.chipOf(i, r) : -1);
          shown = true; K.resultLine(box, r);
        } catch (e) {
          amb(o.key, false);
          if (e !== GONE) { try { console.warn(e); } catch (e2) { /* ignore */ } if (r && !shown && box.isConnected) K.resultLine(box, r); }
        }
        finally { busy = false; if (box.isConnected) { go.disabled = false; box.classList.remove('cy-busy'); } }
      });
      var stopDemo = false, demoP = null;
      if (K.guest()) {
        c.demo = true;
        demoP = (async function attract() {
          try {
            await wait(box, 1000);
            while (!stopDemo && K.guest()) {
              var i2 = Math.random() < 0.4 ? 0 : 1 + rnd(Math.min(o.rows.length - 1, 5));
              if (o.reset) o.reset(c); c.mark(-1); hidePrize(c);
              await o.act(c, i2);
              await c.reveal(i2);
              c.mark(o.chipOf ? o.chipOf(i2, { view: { i: i2 } }) : -1);
              if (!stopDemo) await wait(box, 2400);
            }
          } catch (e) { /* left the game */ }
          if (box.isConnected) { if (o.reset) o.reset(c); c.mark(-1); hidePrize(c); }
        })();
      }
    }, { rules: rules(o.rules) });
  }

  var V = {
    launch: { en: 'Launch', fr: 'Lancer', es: 'Lanzar', pt: 'Lançar', ar: 'أطلق', tr: 'Fırlat', vi: 'Phóng', id: 'Luncurkan', ru: 'Запуск', de: 'Starten', hi: 'छोड़ें', zh: '发射' },
    dig: { en: 'Dig', fr: 'Creuser', es: 'Cavar', pt: 'Cavar', ar: 'احفر', tr: 'Kaz', vi: 'Đào', id: 'Gali', ru: 'Копать', de: 'Graben', hi: 'खोदें', zh: '挖掘' },
    open: { en: 'Open', fr: 'Ouvrir', es: 'Abrir', pt: 'Abrir', ar: 'افتح', tr: 'Aç', vi: 'Mở', id: 'Buka', ru: 'Открыть', de: 'Öffnen', hi: 'खोलें', zh: '打开' },
    fire: { en: 'Fire', fr: 'Tirer', es: 'Disparar', pt: 'Disparar', ar: 'أطلق', tr: 'Ateş', vi: 'Bắn', id: 'Tembak', ru: 'Выстрел', de: 'Feuern', hi: 'दागें', zh: '开炮' },
    ride: { en: 'Ride', fr: 'Monter', es: 'Subir', pt: 'Subir', ar: 'اصعد', tr: 'Çık', vi: 'Lên', id: 'Naik', ru: 'Поехали', de: 'Hoch', hi: 'चढ़ें', zh: '上升' },
    tap: { en: 'Tap', fr: 'Toucher', es: 'Tocar', pt: 'Tocar', ar: 'المس', tr: 'Dokun', vi: 'Chạm', id: 'Ketuk', ru: 'Взмах', de: 'Tippen', hi: 'स्पर्श', zh: '施法' }
  };
  function chip(col, m) { return [STAR(9, col), m]; }
  var SKY = '<linearGradient id="c4sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1026"/><stop offset=".6" stop-color="#1E1B4B"/><stop offset="1" stop-color="#312E81"/></linearGradient>';
  function stars(n) { var o = ''; for (var q = 0; q < n; q++) o += '<circle cx="' + ((q * 53) % 300) + '" cy="' + ((q * 37) % 150) + '" r="' + (q % 4 ? 0.9 : 1.5) + '" fill="#fff" opacity=".7"/>'; return o; }
  // tiers used by most games: 0 (lose) · 0.5 · 1.2 · 2 · 5 · 20 · 100  (matches casc.php cascFill order)
  var RA = [0, 0.5, 1.2, 2, 5, 20, 100];
  var RB = [0, 0.5, 1.2, 2.5, 6, 20, 150];
  var RC = [0, 0, 0.5, 1.2, 2.5, 6, 25, 100];
  var RD = [0, 0, 0.6, 1.5, 4, 15, 100];
  var CH6 = ['#A8A29E', '#86EFAC', '#7DD3FC', '#C4B5FD', '#FBBF24', '#F472B6'];
  function chips6(rows) { var out = [], first = rows[0] === 0 && rows[1] === 0 ? 2 : 1; for (var i = first; i < rows.length; i++) out.push(chip(CH6[(i - first) % 6], rows[i])); return out; }
  function chipOf6(rows) { var first = rows[0] === 0 && rows[1] === 0 ? 2 : 1; return function (i) { return i < first ? -1 : i - first; }; }

  /* =============================== ROCKET CASH =============================== */
  // the rocket climbs a multiplier gauge and stops at the drawn tier (higher = rarer)
  var RKY = [206, 176, 146, 116, 86, 56, 26]; // y of each tier on the gauge (index = tier)
  game({
    key: 'rocketcash', verb: V.launch, rows: RA, prizeAt: [96, 120],
    chips: chips6(RA), chipOf: chipOf6(RA),
    scene: '<defs>' + SKY + GOLDG + '<linearGradient id="rkBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F8FAFC"/><stop offset="1" stop-color="#94A3B8"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#c4sky)"/>' + artBg('rocketcash') + stars(26) +
      '<g transform="translate(232 0)"><rect x="-6" y="18" width="12" height="214" rx="6" fill="#0B1026" stroke="#4338CA" stroke-width="1.4"/>' +
      RKY.map(function (y, j) { return '<g transform="translate(0 ' + y + ')"><rect x="-26" y="-10" width="52" height="20" rx="6" fill="rgba(79,70,229,.25)" stroke="#6366F1" stroke-width="1"/><text x="0" y="5" text-anchor="middle" font-size="12" font-weight="900" fill="#C7D2FE" font-family="var(--cg-font),Arial">' + (RA[j] ? xm(RA[j]) : '✗') + '</text></g>'; }).join('') + '</g>' +
      '<g id="rk"><g transform="translate(0 2)"><ellipse cx="0" cy="26" rx="10" ry="4" fill="#000" opacity=".3"/></g>' +
      '<path d="M0-24c7 6 10 16 10 28H-10c0-12 3-22 10-28z" fill="url(#rkBody)" stroke="#475569" stroke-width="1.4"/><circle cx="0" cy="-4" r="5" fill="#7DD3FC" stroke="#1E3A8A"/><path d="M-10 4l-8 10 8-2M10 4l8 10-8-2z" fill="#DC2626"/><g id="rkFlame"><path d="M-6 6q6 20 6 24 0-4 6-24z" fill="url(#cyGold)" opacity="0"/></g></g>',
    init: function (c) { c.rk = c.id('rk'); tr(c.rk, 96, 214, 1); },
    reset: function (c) { tr(c.rk, 96, 214, 1); c.id('rkFlame').firstChild.setAttribute('opacity', '0'); },
    act: async function (c, tier) {
      var toY = RKY[tier] - 8, fl = c.id('rkFlame').firstChild;
      c.sfx('launch'); fl.setAttribute('opacity', '1');
      await tw(c.box, 1500, function (k) { var e = easeIn(Math.min(1, k * 1.15)); tr(c.rk, 96 + Math.sin(k * 40) * 1.5, lerp(214, toY, e), 1); fl.setAttribute('opacity', (0.5 + 0.5 * Math.abs(Math.sin(k * 30))).toFixed(2)); });
      fl.setAttribute('opacity', '0');
      await wait(c.box, 180);
    },
    rules: rules({
      en: '1. Set your stake and tap “Launch”.\n2. The rocket climbs the gauge and stops on a tier.\n3. Win: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Lowest tier: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer ».\n2. La fusée grimpe la jauge et s’arrête sur un palier.\n3. Gain : ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Palier le plus bas : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Lanzar».\n2. El cohete sube el medidor y se detiene en un nivel.\n3. Premio: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Nivel más bajo: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Lançar».\n2. O foguete sobe o medidor e para num nível.\n3. Prémio: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Nível mais baixo: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «أطلق».\n2. يصعد الصاروخ المقياس ويتوقف عند مستوى.\n3. الربح: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. أدنى مستوى: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Fırlat”a dokun.\n2. Roket göstergeyi tırmanır ve bir kademede durur.\n3. Kazanç: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. En düşük kademe: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Phóng».\n2. Tên lửa leo thang đo và dừng ở một mức.\n3. Thắng: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Mức thấp nhất: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Luncurkan».\n2. Roket menaiki pengukur dan berhenti di satu tingkat.\n3. Menang: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Tingkat terendah: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Запуск».\n2. Ракета поднимается по шкале и останавливается на уровне.\n3. Выигрыш: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Самый низкий уровень — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Starten“.\n2. Die Rakete steigt die Anzeige hoch und hält auf einer Stufe.\n3. Gewinn: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Unterste Stufe: Einsatz verloren.',
      hi: '1. राशि चुनें और «छोड़ें» छुएं।\n2. रॉकेट गेज पर चढ़ता है और एक स्तर पर रुकता है।\n3. जीत: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. सबसे निचला स्तर: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“发射”。\n2. 火箭沿刻度上升并停在某一档。\n3. 奖励：×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100。最低档：输掉下注。'
    })
  });

  /* =============================== GOLD DIGGER =============================== */
  // a pickaxe strikes the rock; it cracks open and the prize tier is revealed
  game({
    key: 'golddig', verb: V.dig, rows: RB, prizeAt: [150, 118],
    chips: chips6(RB), chipOf: chipOf6(RB),
    scene: '<defs>' + GOLDG + '<linearGradient id="dgRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78716C"/><stop offset="1" stop-color="#44403C"/></linearGradient><linearGradient id="dgGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2A14"/><stop offset="1" stop-color="#1C1206"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#140E06"/>' + artBg('golddig') + '<rect x="-400" y="150" opacity=".55" width="1100" height="400" fill="url(#dgGround)"/>' +
      '<g id="dgRockG"><path d="M150 72c40 0 58 26 58 52s-26 38-58 38-58-12-58-38 18-52 58-52z" fill="url(#dgRock)" stroke="#292524" stroke-width="2"/><path d="M120 110l16 8-12 10M186 108l-14 10 12 8" stroke="#1C1917" stroke-width="2" fill="none" opacity=".6"/>' +
      '<circle cx="128" cy="100" r="3" fill="#FCD34D" opacity=".8"/><circle cx="176" cy="118" r="2.6" fill="#7DD3FC" opacity=".7"/></g>' +
      '<g id="dgCrack" opacity="0"><path d="M150 74v76M120 110h60M134 90l32 44M166 90l-32 44" stroke="#FDE047" stroke-width="2.4"/></g>' +
      '<g id="dgPick" transform="translate(214 40)"><rect x="-3" y="0" width="6" height="56" rx="3" fill="#8B5A2B"/><path d="M-24-6q24-14 48 0-24 6-48 0z" fill="#9CA3AF" stroke="#374151" stroke-width="1.6"/></g>',
    init: function (c) { c.pick = c.id('dgPick'); tr(c.pick, 214, 40, 1, -30); },
    reset: function (c) { tr(c.pick, 214, 40, 1, -30); c.id('dgCrack').setAttribute('opacity', '0'); tr(c.id('dgRockG'), 0, 0, 1); },
    act: async function (c, tier) {
      for (var s = 0; s < 3; s++) {
        await tw(c.box, 300, function (k) { tr(c.pick, 214, 40, 1, lerp(-30, 42, ease(k))); });
        c.sfx('hit'); tr(c.id('dgRockG'), (Math.random() - 0.5) * 6, 0, 1);
        await tw(c.box, 220, function (k) { tr(c.pick, 214, 40, 1, lerp(42, -30, ease(k))); tr(c.id('dgRockG'), 0, 0, 1); });
      }
      if (tier > 0) { c.id('dgCrack').setAttribute('opacity', '1'); await burst(c, 150, 112, '#FCD34D'); }
      else await wait(c.box, 200);
    },
    rules: rules({
      en: '1. Set your stake and tap “Dig”.\n2. The pickaxe strikes the rock until it cracks open.\n3. Win: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Empty rock: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Creuser ».\n2. La pioche frappe le rocher jusqu’à le fendre.\n3. Gain : ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Rocher vide : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Cavar».\n2. El pico golpea la roca hasta partirla.\n3. Premio: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Roca vacía: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Cavar».\n2. A picareta bate na rocha até rachá-la.\n3. Prémio: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Rocha vazia: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «احفر».\n2. يضرب المعول الصخرة حتى تنشق.\n3. الربح: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. صخرة فارغة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Kaz”a dokun.\n2. Kazma kaya çatlayana kadar vurur.\n3. Kazanç: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Boş kaya: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Đào».\n2. Cuốc bổ vào đá cho đến khi nứt ra.\n3. Thắng: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Đá rỗng: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Gali».\n2. Beliung memukul batu sampai retak.\n3. Menang: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Batu kosong: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Копать».\n2. Кирка бьёт по скале, пока она не расколется.\n3. Выигрыш: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Пустая скала — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Graben“.\n2. Die Spitzhacke schlägt den Fels, bis er aufbricht.\n3. Gewinn: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Leerer Fels: Einsatz verloren.',
      hi: '1. राशि चुनें और «खोदें» छुएं।\n2. कुदाल चट्टान पर तब तक मारती है जब तक वह फट न जाए।\n3. जीत: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. खाली चट्टान: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“挖掘”。\n2. 镐头敲击岩石直到裂开。\n3. 奖励：×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150。空石：输掉下注。'
    })
  });

  /* =============================== GIFT RUSH =============================== */
  // a gift box drops, the lid pops and the prize rises out
  game({
    key: 'giftrush', verb: V.open, rows: RA, prizeAt: [150, 108],
    chips: chips6(RA), chipOf: chipOf6(RA),
    scene: '<defs>' + GOLDG + '<linearGradient id="gfBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F87171"/><stop offset="1" stop-color="#B91C1C"/></linearGradient><linearGradient id="gfRoom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E1B4B"/><stop offset="1" stop-color="#0B1026"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#gfRoom)"/>' + artBg('giftrush') + stars(18) + '<rect x="-400" y="188" width="1100" height="400" fill="#140d33" opacity=".55"/>' +
      '<g id="gfLid" transform="translate(150 150)"><rect x="-44" y="-14" width="88" height="20" rx="5" fill="url(#gfBox)" stroke="#7F1D1D" stroke-width="1.6"/><rect x="-8" y="-14" width="16" height="20" fill="#FBBF24"/><path d="M0-14q-16-18-24-8t24 8q16-18 24-8t-24 8z" fill="#FBBF24" stroke="#B45309"/></g>' +
      '<g id="gfBox"><rect x="110" y="150" width="80" height="48" rx="5" fill="url(#gfBox)" stroke="#7F1D1D" stroke-width="1.6"/><rect x="142" y="150" width="16" height="48" fill="#FBBF24"/></g>',
    init: function (c) { c.lid = c.id('gfLid'); tr(c.lid, 150, 150, 1); },
    reset: function (c) { tr(c.lid, 150, 150, 1); tr(c.id('gfBox'), 0, 0, 1); },
    act: async function (c, tier) {
      await tw(c.box, 500, function (k) { var e = ease(k); tr(c.id('gfBox'), 0, lerp(-70, 0, e), 1); tr(c.lid, 150, lerp(80, 150, e), 1); });
      c.sfx('open'); tr(c.id('gfBox'), 0, 0, 1);
      if (tier > 0) { await tw(c.box, 360, function (k) { tr(c.lid, 150 + Math.sin(k * 20) * 4, 150 - 46 * ease(k), 1, -18 * k); }); await burst(c, 150, 120, '#FDE68A'); }
      else { await tw(c.box, 300, function (k) { tr(c.lid, 150, 150 - 14 * Math.sin(k * 3.14), 1); }); }
    },
    rules: rules({
      en: '1. Set your stake and tap “Open”.\n2. The gift drops, the lid pops and the prize rises out.\n3. Win: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Empty gift: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Ouvrir ».\n2. Le cadeau tombe, le couvercle saute et le lot sort.\n3. Gain : ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Cadeau vide : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Abrir».\n2. El regalo cae, la tapa salta y el premio sale.\n3. Premio: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Regalo vacío: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Abrir».\n2. O presente cai, a tampa salta e o prémio sobe.\n3. Prémio: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Presente vazio: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «افتح».\n2. تسقط الهدية، يقفز الغطاء وتخرج الجائزة.\n3. الربح: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. هدية فارغة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Aç”a dokun.\n2. Hediye düşer, kapak fırlar ve ödül çıkar.\n3. Kazanç: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Boş hediye: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Mở».\n2. Hộp quà rơi xuống, nắp bật ra và phần thưởng hiện lên.\n3. Thắng: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Quà rỗng: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Buka».\n2. Kado jatuh, tutup terbuka dan hadiah muncul.\n3. Menang: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Kado kosong: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Открыть».\n2. Подарок падает, крышка подлетает и приз появляется.\n3. Выигрыш: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Пустой подарок — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Öffnen“.\n2. Das Geschenk fällt, der Deckel springt auf und der Preis steigt heraus.\n3. Gewinn: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Leeres Geschenk: Einsatz verloren.',
      hi: '1. राशि चुनें और «खोलें» छुएं।\n2. उपहार गिरता है, ढक्कन उछलता है और इनाम बाहर आता है।\n3. जीत: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. खाली उपहार: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“打开”。\n2. 礼盒落下，盖子弹开，奖品升起。\n3. 奖励：×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100。空礼盒：输掉下注。'
    })
  });

  /* =============================== TREASURE CANNON =============================== */
  // the cannon fires a ball up; it bursts and reveals the prize tier
  game({
    key: 'cannonx', verb: V.fire, rows: RC, prizeAt: [160, 86],
    chips: chips6(RC), chipOf: chipOf6(RC),
    scene: '<defs>' + SKY + GOLDG + '<radialGradient id="cnBall"><stop offset="0" stop-color="#6B7280"/><stop offset="1" stop-color="#111827"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#c4sky)"/>' + artBg('cannonx') + stars(22) + '<rect x="-400" y="206" width="1100" height="400" fill="#140d33" opacity=".55"/>' +
      '<g transform="translate(60 198) rotate(-42)"><rect x="-14" y="-16" width="60" height="32" rx="14" fill="#334155" stroke="#0B1020" stroke-width="2"/><rect x="40" y="-14" width="10" height="28" rx="4" fill="#1F2937"/></g>' +
      '<circle cx="60" cy="210" r="18" fill="#1E293B" stroke="#0B1020" stroke-width="2"/>' +
      '<circle id="cnBall" r="9" fill="url(#cnBall)" stroke="#0B1020" opacity="0"/>',
    init: function (c) { c.ball = c.id('cnBall'); tr(c.ball, 78, 176, 0.01); c.ball.setAttribute('opacity', '0'); },
    reset: function (c) { tr(c.ball, 78, 176, 0.01); c.ball.setAttribute('opacity', '0'); },
    act: async function (c, tier) {
      c.sfx('launch'); c.ball.setAttribute('opacity', '1');
      await tw(c.box, 1100, function (k) { var e = ease(k); tr(c.ball, lerp(78, 160, e), lerp(176, 86, e) + Math.sin(k * 3.14) * -26, 1); });
      c.ball.setAttribute('opacity', '0');
      if (tier > 0) await burst(c, 160, 86, '#FDE68A'); else await wait(c.box, 200);
    },
    rules: rules({
      en: '1. Set your stake and tap “Fire”.\n2. The cannon fires a ball that bursts in the sky.\n3. Win: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. A dud: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Tirer ».\n2. Le canon envoie une boule qui éclate dans le ciel.\n3. Gain : ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. Un raté : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Disparar».\n2. El cañón lanza una bola que estalla en el cielo.\n3. Premio: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. Un fallo: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Disparar».\n2. O canhão lança uma bola que explode no céu.\n3. Prémio: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. Uma falha: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «أطلق».\n2. يطلق المدفع كرة تنفجر في السماء.\n3. الربح: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. طلقة فاشلة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Ateş”e dokun.\n2. Top gökyüzünde patlayan bir gülle atar.\n3. Kazanç: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. Boşa giderse: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Bắn».\n2. Khẩu thần công bắn quả cầu nổ trên trời.\n3. Thắng: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. Trượt: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Tembak».\n2. Meriam menembakkan bola yang meledak di langit.\n3. Menang: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. Gagal: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Выстрел».\n2. Пушка стреляет ядром, которое взрывается в небе.\n3. Выигрыш: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. Осечка — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Feuern“.\n2. Die Kanone schießt eine Kugel, die am Himmel zerplatzt.\n3. Gewinn: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. Ein Blindgänger: Einsatz verloren.',
      hi: '1. राशि चुनें और «दागें» छुएं।\n2. तोप एक गोला दागती है जो आसमान में फटता है।\n3. जीत: ×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100. चूक: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“开炮”。\n2. 大炮发射一枚在空中炸开的炮弹。\n3. 奖励：×0.5 · ×1.2 · ×2.5 · ×6 · ×25 · ×100。哑弹：输掉下注。'
    })
  });

  /* =============================== LUCKY LIFT =============================== */
  // an elevator rises floor by floor and stops; the door opens on the prize tier
  var LFY = [196, 166, 136, 106, 76, 46, 16];
  game({
    key: 'luckylift', verb: V.ride, rows: RA, prizeAt: [150, 112],
    chips: chips6(RA), chipOf: chipOf6(RA),
    scene: '<defs>' + GOLDG + '<linearGradient id="lfCab" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0D1326"/>' + artBg('luckylift') + '<rect x="104" y="6" width="92" height="222" rx="6" fill="#141C34" stroke="#334155" stroke-width="1.6"/>' +
      LFY.map(function (y, j) { return '<g><line x1="108" y1="' + (y + 20) + '" x2="192" y2="' + (y + 20) + '" stroke="#293550" stroke-width="1"/><text x="198" y="' + (y + 16) + '" font-size="11" font-weight="800" fill="#64748B" font-family="var(--cg-font),Arial">' + (RA[j] ? xm(RA[j]) : '✗') + '</text></g>'; }).join('') +
      '<g id="lfCab"><rect x="112" y="186" width="76" height="40" rx="4" fill="url(#lfCab)" stroke="#78350F" stroke-width="1.6"/><rect id="lfDoorL" x="130" y="188" width="18" height="36" fill="#1C1206"/><rect id="lfDoorR" x="152" y="188" width="18" height="36" fill="#1C1206"/><path d="M130 206h40" stroke="#78350F" stroke-width="1"/></g>',
    init: function (c) { c.cab = c.id('lfCab'); tr(c.cab, 0, 0, 1); },
    reset: function (c) { tr(c.cab, 0, 0, 1); tr(c.id('lfDoorL'), 0, 0, 1); tr(c.id('lfDoorR'), 0, 0, 1); },
    act: async function (c, tier) {
      var dy = LFY[tier] - 186;
      c.sfx('tick');
      await tw(c.box, 1400, function (k) { tr(c.cab, 0, dy * ease(k), 1); });
      await wait(c.box, 150);
      c.sfx('open');
      await tw(c.box, 360, function (k) { tr(c.id('lfDoorL'), -16 * ease(k), 0, 1); tr(c.id('lfDoorR'), 16 * ease(k), 0, 1); });
      if (tier > 0) await burst(c, 150, LFY[tier] + 20, '#FDE68A'); else await wait(c.box, 150);
    },
    rules: rules({
      en: '1. Set your stake and tap “Ride”.\n2. The lift rises and the doors open on a floor.\n3. Win: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Ground floor: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Monter ».\n2. L’ascenseur monte et les portes s’ouvrent à un étage.\n3. Gain : ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Rez-de-chaussée : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Subir».\n2. El ascensor sube y las puertas se abren en un piso.\n3. Premio: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Planta baja: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Subir».\n2. O elevador sobe e as portas abrem num andar.\n3. Prémio: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Rés-do-chão: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «اصعد».\n2. يصعد المصعد وتُفتح الأبواب عند طابق.\n3. الربح: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. الطابق الأرضي: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Çık”a dokun.\n2. Asansör yükselir ve kapılar bir katta açılır.\n3. Kazanç: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Zemin kat: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Lên».\n2. Thang máy đi lên và cửa mở ở một tầng.\n3. Thắng: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Tầng trệt: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Naik».\n2. Lift naik dan pintu terbuka di sebuah lantai.\n3. Menang: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Lantai dasar: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Поехали».\n2. Лифт поднимается, и двери открываются на этаже.\n3. Выигрыш: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Первый этаж — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Hoch“.\n2. Der Aufzug steigt und die Türen öffnen sich in einem Stockwerk.\n3. Gewinn: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Erdgeschoss: Einsatz verloren.',
      hi: '1. राशि चुनें और «चढ़ें» छुएं।\n2. लिफ्ट ऊपर जाती है और दरवाज़े एक मंज़िल पर खुलते हैं।\n3. जीत: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. भूतल: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“上升”。\n2. 电梯上升，门在某一层打开。\n3. 奖励：×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100。底层：输掉下注。'
    })
  });

  /* =============================== MAGIC HAT =============================== */
  // a wand taps the hat three times; a prize floats out
  game({
    key: 'magichat', verb: V.tap, rows: RB, prizeAt: [150, 96],
    chips: chips6(RB), chipOf: chipOf6(RB),
    scene: '<defs>' + GOLDG + '<linearGradient id="mhHat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C1D95"/><stop offset="1" stop-color="#2E1065"/></linearGradient><radialGradient id="mhGlow"><stop offset="0" stop-color="#C4B5FD" stop-opacity=".9"/><stop offset="1" stop-color="#C4B5FD" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#140A2E"/>' + artBg('magichat') + stars(16) +
      '<ellipse cx="150" cy="196" rx="70" ry="12" fill="#2E1065"/><circle cx="150" cy="150" r="46" fill="url(#mhGlow)" opacity=".4"/>' +
      '<g id="mhHat"><path d="M112 190q38 10 76 0l-10-72q-28-8-56 0z" fill="url(#mhHat)" stroke="#1A0A3E" stroke-width="1.8"/><ellipse cx="150" cy="190" rx="52" ry="12" fill="#3B1A6E" stroke="#1A0A3E"/><rect x="112" y="150" width="76" height="12" fill="#7C3AED"/><rect x="138" y="150" width="24" height="12" fill="#FBBF24"/></g>' +
      '<g id="mhWand" transform="translate(220 40)"><rect x="-2" y="0" width="4" height="40" rx="2" fill="#1C1206"/><rect x="-2" y="0" width="4" height="8" fill="#F8FAFC"/>' + '<g transform="translate(0 -2)">' + STAR(7, '#FDE047') + '</g></g>',
    init: function (c) { c.wand = c.id('mhWand'); tr(c.wand, 220, 40, 1, 10); },
    reset: function (c) { tr(c.wand, 220, 40, 1, 10); tr(c.id('mhHat'), 0, 0, 1); },
    act: async function (c, tier) {
      for (var s = 0; s < 3; s++) {
        await tw(c.box, 240, function (k) { tr(c.wand, lerp(220, 170, ease(k)), lerp(40, 118, ease(k)), 1, lerp(10, -10, k)); });
        c.sfx('step'); tr(c.id('mhHat'), 0, 3, 1);
        await tw(c.box, 200, function (k) { tr(c.wand, lerp(170, 220, ease(k)), lerp(118, 40, ease(k)), 1, lerp(-10, 10, k)); tr(c.id('mhHat'), 0, 3 - 3 * k, 1); });
      }
      if (tier > 0) await burst(c, 150, 120, '#C4B5FD'); else await wait(c.box, 200);
    },
    rules: rules({
      en: '1. Set your stake and tap “Tap”.\n2. The wand taps the hat and a prize floats out.\n3. Win: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Empty hat: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Toucher ».\n2. La baguette touche le chapeau et un lot en sort.\n3. Gain : ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Chapeau vide : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Tocar».\n2. La varita toca el sombrero y sale un premio.\n3. Premio: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Sombrero vacío: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Tocar».\n2. A varinha toca a cartola e um prémio sai.\n3. Prémio: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Cartola vazia: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «المس».\n2. تلمس العصا القبعة فتخرج جائزة.\n3. الربح: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. قبعة فارغة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Dokun”a dokun.\n2. Asa şapkaya dokunur ve bir ödül çıkar.\n3. Kazanç: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Boş şapka: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Chạm».\n2. Cây đũa chạm vào mũ và phần thưởng bay ra.\n3. Thắng: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Mũ rỗng: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Ketuk».\n2. Tongkat menyentuh topi dan hadiah muncul.\n3. Menang: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Topi kosong: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Взмах».\n2. Палочка касается шляпы, и приз вылетает.\n3. Выигрыш: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Пустая шляпа — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Tippen“.\n2. Der Zauberstab tippt den Hut an und ein Preis schwebt heraus.\n3. Gewinn: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Leerer Hut: Einsatz verloren.',
      hi: '1. राशि चुनें और «स्पर्श» छुएं।\n2. छड़ी टोपी को छूती है और इनाम बाहर आता है।\n3. जीत: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. खाली टोपी: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“施法”。\n2. 魔杖轻点帽子，奖品飘出。\n3. 奖励：×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150。空帽：输掉下注。'
    })
  });

  /* ===================================================================== MOTEUR GÉNÉRIQUE « révèle le gain » (premium) ======
     Chaque jeu : un décor soigné + un objet central (id cyObj) que le serveur fait « ouvrir / tourner » pour révéler le palier
     tiré (view.i). Marge 6 %, mêmes tables que casc.php (cascFill). Style adulte (or, gemmes, velours) — pas enfantin. */
  var REVEAL_RA = rules({
    en: '1. Set your stake and tap the button.\n2. The round plays and lands on a prize tier.\n3. Win: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Lowest tier: the stake is lost.',
    fr: '1. Choisis ta mise et touche le bouton.\n2. La partie se joue et s’arrête sur un palier.\n3. Gain : ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Palier le plus bas : la mise est perdue.',
    es: '1. Elige tu apuesta y toca el botón.\n2. La ronda se juega y se detiene en un nivel.\n3. Premio: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Nivel más bajo: pierdes la apuesta.',
    pt: '1. Escolha o valor e toque no botão.\n2. A rodada joga e para num nível.\n3. Prémio: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Nível mais baixo: a aposta é perdida.',
    ar: '1. اختر رهانك والمس الزر.\n2. تُلعب الجولة وتتوقف عند مستوى.\n3. الربح: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. أدنى مستوى: تخسر الرهان.',
    tr: '1. Bahsini seç ve düğmeye dokun.\n2. Tur oynanır ve bir kademede durur.\n3. Kazanç: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. En düşük kademe: bahis kaybedilir.',
    vi: '1. Chọn mức cược rồi chạm nút.\n2. Ván chơi và dừng ở một mức.\n3. Thắng: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Mức thấp nhất: mất tiền cược.',
    id: '1. Atur taruhan lalu sentuh tombol.\n2. Ronde berjalan dan berhenti di satu tingkat.\n3. Menang: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Tingkat terendah: taruhan hilang.',
    ru: '1. Выберите ставку и нажмите кнопку.\n2. Раунд играется и останавливается на уровне.\n3. Выигрыш: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Самый низкий уровень — ставка проиграна.',
    de: '1. Wähle deinen Einsatz und tippe auf den Knopf.\n2. Die Runde läuft und hält auf einer Stufe.\n3. Gewinn: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. Unterste Stufe: Einsatz verloren.',
    hi: '1. राशि चुनें और बटन छुएं।\n2. राउंड चलता है और एक स्तर पर रुकता है।\n3. जीत: ×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100. सबसे निचला स्तर: राशि हार जाते हैं।',
    zh: '1. 设定金额并点击按钮。\n2. 本回合进行并停在某一档。\n3. 奖励：×0.5 · ×1.2 · ×2 · ×5 · ×20 · ×100。最低档：输掉下注。'
  });
  var REVEAL_RB = rules({
    en: '1. Set your stake and tap the button.\n2. The round plays and lands on a prize tier.\n3. Win: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Lowest tier: the stake is lost.',
    fr: '1. Choisis ta mise et touche le bouton.\n2. La partie se joue et s’arrête sur un palier.\n3. Gain : ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Palier le plus bas : la mise est perdue.',
    es: '1. Elige tu apuesta y toca el botón.\n2. La ronda se juega y se detiene en un nivel.\n3. Premio: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Nivel más bajo: pierdes la apuesta.',
    pt: '1. Escolha o valor e toque no botão.\n2. A rodada joga e para num nível.\n3. Prémio: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Nível mais baixo: a aposta é perdida.',
    ar: '1. اختر رهانك والمس الزر.\n2. تُلعب الجولة وتتوقف عند مستوى.\n3. الربح: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. أدنى مستوى: تخسر الرهان.',
    tr: '1. Bahsini seç ve düğmeye dokun.\n2. Tur oynanır ve bir kademede durur.\n3. Kazanç: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. En düşük kademe: bahis kaybedilir.',
    vi: '1. Chọn mức cược rồi chạm nút.\n2. Ván chơi và dừng ở một mức.\n3. Thắng: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Mức thấp nhất: mất tiền cược.',
    id: '1. Atur taruhan lalu sentuh tombol.\n2. Ronde berjalan dan berhenti di satu tingkat.\n3. Menang: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Tingkat terendah: taruhan hilang.',
    ru: '1. Выберите ставку и нажмите кнопку.\n2. Раунд играется и останавливается на уровне.\n3. Выигрыш: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Самый низкий уровень — ставка проиграна.',
    de: '1. Wähle deinen Einsatz und tippe auf den Knopf.\n2. Die Runde läuft und hält auf einer Stufe.\n3. Gewinn: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. Unterste Stufe: Einsatz verloren.',
    hi: '1. राशि चुनें और बटन छुएं।\n2. राउंड चलता है और एक स्तर पर रुकता है।\n3. जीत: ×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150. सबसे निचला स्तर: राशि हार जाते हैं।',
    zh: '1. 设定金额并点击按钮。\n2. 本回合进行并停在某一档。\n3. 奖励：×0.5 · ×1.2 · ×2.5 · ×6 · ×20 · ×150。最低档：输掉下注。'
  });
  var GDEFS = GOLDG +
    '<linearGradient id="r5vel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312E81"/><stop offset=".5" stop-color="#1E1B4B"/><stop offset="1" stop-color="#0B1026"/></linearGradient>' +
    '<linearGradient id="r5steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E2E8F0"/><stop offset=".5" stop-color="#94A3B8"/><stop offset="1" stop-color="#334155"/></linearGradient>' +
    '<linearGradient id="r5wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B45309"/><stop offset="1" stop-color="#5C2E0E"/></linearGradient>' +
    '<radialGradient id="r5glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="rgba(253,230,138,0)"/></radialGradient>' +
    '<radialGradient id="r5orb" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#A5F3FC"/><stop offset=".5" stop-color="#22D3EE"/><stop offset="1" stop-color="#0E7490"/></radialGradient>';
  function r5bg(fill) { return '<rect x="-400" y="-400" width="1100" height="1100" fill="' + (fill || 'url(#r5vel)') + '"/>'; }
  function r5glow() { return '<circle id="cyGlow" cx="150" cy="108" r="70" fill="url(#r5glow)" opacity="0"/>'; }
  // v3697 : décor flouté aux couleurs du jeu (son logo), posé derrière l'animation d'origine
  function artBg(k) { var lite = document.documentElement.classList.contains('oro-lite'); return '<defs><filter id="abf' + k + '" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="10"/></filter><radialGradient id="abv' + k + '" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#05030C" stop-opacity=".35"/><stop offset="1" stop-color="#05030C" stop-opacity=".85"/></radialGradient></defs><image href="img/games/' + k + '.webp?v=3682" x="-60" y="-80" width="420" height="400" preserveAspectRatio="xMidYMid slice"' + (lite ? ' opacity=".4"' : ' filter="url(#abf' + k + ')" opacity=".8"') + '/><rect x="-400" y="-400" width="1100" height="1100" fill="url(#abv' + k + ')"/>'; }
  function rgame(o) {
    game({
      key: o.key, verb: o.verb, rows: o.rows, prizeAt: o.prizeAt || [150, 108],
      chips: chips6(o.rows), chipOf: chipOf6(o.rows), vb: '0 0 300 220',
      scene: o.scene, init: o.init,
      reset: function (c) { var g = c.id('cyObj'); if (g) tr(g, o.cx || 150, o.cy || 108, 1, 0); var gl = c.id('cyGlow'); if (gl) gl.setAttribute('opacity', '0'); if (o.reset) o.reset(c); },
      act: function (c, tier) {
        var g = c.id('cyObj'), gl = c.id('cyGlow'), cx = o.cx || 150, cy = o.cy || 108;
        c.snd(o.sfx || 'show', {});
        return tw(c.box, 1300, function (k) {
          if (gl) gl.setAttribute('opacity', (Math.sin(k * Math.PI) * 0.85).toFixed(2));
          if (!g) return;
          if (o.spin) { tr(g, cx, cy, 1, (1 - Math.pow(1 - k, 3)) * (1080 + tier * 16)); }
          else { var amp = 7 * Math.sin(k * Math.PI), sh = Math.sin(k * 42) * amp; tr(g, cx + sh, cy, 1 + Math.sin(k * Math.PI) * 0.07, 0); }
        }).then(function () { return burst(c, (o.prizeAt || [150, 108])[0], (o.prizeAt || [150, 108])[1], o.burst || '#FBBF24'); });
      },
      rules: o.rows === RB ? REVEAL_RB : REVEAL_RA
    });
  }

  /* ---- Treasure Chest (RA) ---- */
  pgame('chestgold', RA, 0, V.open); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)

  /* ---- Fortune Wheel (RB, spin) ---- */
  pgame('fortunewheel', RB, 1, { en: 'Spin', fr: 'Tourner', es: 'Girar', pt: 'Girar', ar: 'أدر', tr: 'Çevir', vi: 'Quay', id: 'Putar', ru: 'Крутить', de: 'Drehen', hi: 'घुमाएँ', zh: '旋转' }); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)

  /* ---- Golden Egg (RB) ---- */
  pgame('goldenegg', RB, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)

  /* ---- Mystery Box (RA) ---- */
  pgame('mysterybox', RA, 0, V.open); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)

  /* ---- Crystal Orb (RA) ---- */
  pgame('crystalorb', RA, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)

  /* ---- Diamond Vault (RB) ---- */
  pgame('diamondvault', RB, 0, V.open); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)

  /* ---- casc5 vague 2 ---- */
  function pip(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#1C1917"/>'; }
  /* Dice Roll (RA) */
  pgame('diceroll', RA, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Royal Card (RB) */
  pgame('royalcard', RB, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Genie Lamp (RA) */
  pgame('genielamp', RA, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Jackpot Bell (RB) */
  pgame('jackpotbell', RB, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Oyster Pearl (RA) */
  pgame('oysterpearl', RA, 0, V.open); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Crown Jewel (RB) */
  pgame('crownjewel', RB, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)

  /* ---- casc5 vague 3 ---- */
  /* Geode Gem (RB) */
  pgame('geodegem', RB, 0, V.open); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Money Tree (RA) */
  pgame('moneytree', RA, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Lottery Ball (RA) */
  pgame('lotteryball', RA, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Dragon Coin (RB) */
  pgame('dragoncoin', RB, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Firework (RA) */
  pgame('fireworkgold', RA, 0, V.launch); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Treasure Map (RB) */
  pgame('treasuremap', RB, 0, V.open); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)

  /* ---- casc5 vague 4 (finale → 232) ---- */
  function goldbar(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') skewX(-18)"><rect x="' + (-18 * s) + '" y="' + (-7 * s) + '" width="' + (36 * s) + '" height="' + (14 * s) + '" rx="2" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/><rect x="' + (-18 * s) + '" y="' + (-7 * s) + '" width="' + (36 * s) + '" height="' + (4 * s) + '" fill="#FFF7D6" opacity=".4"/></g>'; }
  /* Gold Bars (RA) */
  pgame('goldbars', RA, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Poker Chip (RB) */
  pgame('pokerchip', RB, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Lucky Clover (RA) */
  pgame('luckyclover', RA, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Ruby Heart (RB) */
  pgame('rubyheart', RB, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Money Bag (RA) */
  pgame('moneybag', RA, 0, V.open); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Horseshoe (RA) */
  pgame('luckyshoe', RA, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Diamond Ring (RB) */
  pgame('diamondring', RB, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Gold Trophy (RB) */
  pgame('goldtrophy', RB, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Sun Medallion (RA) */
  pgame('sunburst', RA, 0, V.tap); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)
  /* Gem Trio (RB) */
  pgame('gemtrio', RB, 0, V.open); // v3697 : ancienne scène dessinée remplacée par le médaillon (logo du jeu)

  /* 2026-11-12 : lot 1 vers 1000 jeux — même moteur « révèle le gain », l'objet du jeu est son logo-photo (img/games/<clé>.webp) */
  var PGV = PGV || {};
  function pgame(k, rows, spin, verb) {
    // v3696 (revue propriétaire : « petit logo perdu dans un grand vide ») : fond = l'image du jeu floutée (chaque jeu a ses
    // couleurs), rayons de lumière, grand médaillon serti d'or. Même zone de gain, même moteur.
    var src = 'img/games/' + k + '.webp?v=' + ((PGV && PGV[k]) || '3682'), R = 78, rays = '', studs = '';
    for (var q = 0; q < 16; q++) rays += '<path d="M0 0L' + (Math.cos((q * 22.5 - 4) * Math.PI / 180) * 190).toFixed(1) + ' ' + (Math.sin((q * 22.5 - 4) * Math.PI / 180) * 190).toFixed(1) + 'L' + (Math.cos((q * 22.5 + 4) * Math.PI / 180) * 190).toFixed(1) + ' ' + (Math.sin((q * 22.5 + 4) * Math.PI / 180) * 190).toFixed(1) + 'Z"/>';
    for (q = 0; q < 12; q++) studs += '<circle cx="' + (Math.cos(q * Math.PI / 6) * (R + 5)).toFixed(1) + '" cy="' + (Math.sin(q * Math.PI / 6) * (R + 5)).toFixed(1) + '" r="2.3" fill="#FEF3C7" stroke="#92400E" stroke-width=".6"/>';
    rgame({ key: k, verb: verb || V.tap, rows: rows, sfx: spin ? 'show' : 'chests', cy: 108, spin: !!spin,
      scene: '<defs>' + GDEFS + '<clipPath id="pg' + k + '"><circle r="' + R + '"/></clipPath><filter id="pgb' + k + '" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>' +
        '<radialGradient id="pgv' + k + '" cx="50%" cy="48%" r="70%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05030C" stop-opacity=".82"/></radialGradient></defs>' + r5bg() +
        '<image href="' + src + '" x="-60" y="-80" width="420" height="380" preserveAspectRatio="xMidYMid slice"' + (document.documentElement.classList.contains('oro-lite') ? ' opacity=".45"' : ' filter="url(#pgb' + k + ')" opacity=".75"') + '/>' +
        '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#pgv' + k + ')"/>' + stars(16) +
        '<g transform="translate(150 108)" fill="#FDE68A" opacity=".10">' + rays + '</g>' + r5glow() +
        '<ellipse cx="150" cy="200" rx="70" ry="9" fill="#000" opacity=".35"/>' +
        '<g id="cyObj" transform="translate(150 108)"><circle r="' + (R + 10) + '" fill="url(#cyGold)" stroke="#78350F" stroke-width="2.5"/><circle r="' + (R + 3) + '" fill="#3B2408"/>' + studs +
        '<image href="' + src + '" x="-' + R + '" y="-' + R + '" width="' + 2 * R + '" height="' + 2 * R + '" clip-path="url(#pg' + k + ')" preserveAspectRatio="xMidYMid slice"/>' +
        '<circle r="' + R + '" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.5"/><path d="M-' + (R - 14) + ' -' + (R - 34) + 'a' + R + ' ' + R + ' 0 0 1 ' + (R - 6) + ' -30" stroke="rgba(255,255,255,.35)" stroke-width="5" fill="none" stroke-linecap="round"/></g>' });
  }
  pgame('goldcompass', RA); pgame('icecrystal', RB); pgame('phoenixegg', RA); pgame('luckybamboo', RB); pgame('silverchalice', RA); pgame('amulet', RB); pgame('owlidol', RA); pgame('magicmirror', RB); pgame('piratebarrel', RA); pgame('jadeturtle', RB); pgame('scepter', RA); pgame('windchime', RB); pgame('goldnugget', RA); pgame('fortunecookie', RB); pgame('crystalskull', RA); pgame('goldpineapple', RB); pgame('dicecup', RA); pgame('spacecapsule', RB); pgame('snowglobe', RA); pgame('cuckooclock', RB); pgame('hourglass', RA); pgame('goldenkey', RB); pgame('brooch', RA); pgame('pearlnecklace', RB); pgame('vikinghelmet', RA); pgame('onimask', RB); pgame('aztecidol', RA); pgame('goldenharp', RB); pgame('totem', RA); pgame('koipond', RB);
  PGV.sapphirestar = '3684'; PGV.goldenlion = '3684'; PGV.cosmicdice = '3684'; PGV.luckypanda = '3684'; PGV.treasureisle = '3684'; PGV.moonstone = '3684'; PGV.dragonpearl = '3684'; PGV.goldenhorse = '3684'; PGV.lavagem = '3684'; PGV.starcrown = '3684'; PGV.mermaidshell = '3684'; PGV.thunderhammer = '3684'; PGV.icephoenix = '3684'; PGV.goldenbull = '3684'; PGV.cherryblossom = '3684'; PGV.desertrose = '3684'; PGV.fortuneteller = '3684'; PGV.goldenanchor = '3684'; PGV.neonarcade = '3684'; PGV.mysticowl = '3684'; PGV.spacegold = '3684'; PGV.jungleidol = '3684'; PGV.lightningorb = '3684'; PGV.rubydragon = '3684'; PGV.sunflowergold = '3684'; PGV.frostcrown = '3684'; PGV.lotusgold = '3684'; PGV.eagleemblem = '3684'; PGV.tikitreasure = '3684'; PGV.crystalwolf = '3684';
  pgame('sapphirestar', RA); pgame('goldenlion', RB); pgame('cosmicdice', RA, 1); pgame('luckypanda', RB); pgame('treasureisle', RA); pgame('moonstone', RB, 1); pgame('dragonpearl', RA); pgame('goldenhorse', RB); pgame('lavagem', RA, 1); pgame('starcrown', RB); pgame('mermaidshell', RA); pgame('thunderhammer', RB, 1); pgame('icephoenix', RA); pgame('goldenbull', RB); pgame('cherryblossom', RA, 1); pgame('desertrose', RB); pgame('fortuneteller', RA); pgame('goldenanchor', RB, 1); pgame('neonarcade', RA); pgame('mysticowl', RB); pgame('spacegold', RA, 1); pgame('jungleidol', RB); pgame('lightningorb', RA); pgame('rubydragon', RB, 1); pgame('sunflowergold', RA); pgame('frostcrown', RB); pgame('lotusgold', RA, 1); pgame('eagleemblem', RB); pgame('tikitreasure', RA); pgame('crystalwolf', RB, 1);
  PGV.goldenscarab = '3686'; PGV.emeraldcity = '3686'; PGV.pirateparrot = '3686'; PGV.rainbowpot = '3686'; PGV.samuraisword = '3686'; PGV.royalpeacock = '3686'; PGV.winterwolf = '3686'; PGV.cosmicowl = '3686'; PGV.goldenfrog = '3686'; PGV.dragonegg = '3686'; PGV.moneyvault = '3686'; PGV.vipcard = '3686'; PGV.crystalrose = '3686'; PGV.ancientcoin = '3686'; PGV.honeybee = '3686'; PGV.glacier = '3686'; PGV.volcanoruby = '3686'; PGV.tigereye = '3686'; PGV.magiccarpet = '3686'; PGV.sunstone = '3686'; PGV.fortunefox = '3686'; PGV.starship = '3686'; PGV.royaltiger = '3686'; PGV.magicbook = '3686'; PGV.jadetemple = '3686'; PGV.pharaohmask = '3686'; PGV.sapphireowl = '3686'; PGV.goldenbell = '3686'; PGV.frozenheart = '3686'; PGV.cosmicrocket = '3686';
  pgame('goldenscarab', RA); pgame('emeraldcity', RB); pgame('pirateparrot', RA, 1); pgame('rainbowpot', RB); pgame('samuraisword', RA); pgame('royalpeacock', RB, 1); pgame('winterwolf', RA); pgame('cosmicowl', RB); pgame('goldenfrog', RA, 1); pgame('dragonegg', RB); pgame('moneyvault', RA); pgame('vipcard', RB, 1); pgame('crystalrose', RA); pgame('ancientcoin', RB); pgame('honeybee', RA, 1); pgame('glacier', RB); pgame('volcanoruby', RA); pgame('tigereye', RB, 1); pgame('magiccarpet', RA); pgame('sunstone', RB); pgame('fortunefox', RA, 1); pgame('starship', RB); pgame('royaltiger', RA); pgame('magicbook', RB, 1); pgame('jadetemple', RA); pgame('pharaohmask', RB); pgame('sapphireowl', RA, 1); pgame('goldenbell', RB); pgame('frozenheart', RA); pgame('cosmicrocket', RB, 1);
  PGV.luckystar = '3686'; PGV.oceanking = '3686'; PGV.diamondmine = '3686'; PGV.goldenkoi = '3686'; PGV.royaldice = '3686'; PGV.mysticmoon = '3686'; PGV.redlantern = '3686'; PGV.emeraldowl = '3686'; PGV.goldenmask = '3686'; PGV.thunderbird = '3686'; PGV.sakura = '3686'; PGV.spiceroute = '3686'; PGV.northstar = '3686'; PGV.goldenlotus2 = '3686'; PGV.crystalmoon = '3686'; PGV.cobragold = '3686'; PGV.rubytiger = '3686'; PGV.jadeluck = '3686'; PGV.winterpalace = '3686'; PGV.summerbeach = '3686'; PGV.goldengoose = '3686'; PGV.ninjastar = '3686'; PGV.cosmicgate = '3686'; PGV.treasurecrab = '3686'; PGV.sunpyramid = '3686'; PGV.moonrabbit = '3686'; PGV.goldvault2 = '3686'; PGV.starfishgold = '3686'; PGV.mysticfox = '3686'; PGV.pinkdiamond = '3686';
  pgame('luckystar', RA); pgame('oceanking', RB); pgame('diamondmine', RA, 1); pgame('goldenkoi', RB); pgame('royaldice', RA); pgame('mysticmoon', RB, 1); pgame('redlantern', RA); pgame('emeraldowl', RB); pgame('goldenmask', RA, 1); pgame('thunderbird', RB); pgame('sakura', RA); pgame('spiceroute', RB, 1); pgame('northstar', RA); pgame('goldenlotus2', RB); pgame('crystalmoon', RA, 1); pgame('cobragold', RB); pgame('rubytiger', RA); pgame('jadeluck', RB, 1); pgame('winterpalace', RA); pgame('summerbeach', RB); pgame('goldengoose', RA, 1); pgame('ninjastar', RB); pgame('cosmicgate', RA); pgame('treasurecrab', RB, 1); pgame('sunpyramid', RA); pgame('moonrabbit', RB); pgame('goldvault2', RA, 1); pgame('starfishgold', RB); pgame('mysticfox', RA); pgame('pinkdiamond', RB, 1);
  PGV.royalswan = '3686'; PGV.goldenhelmet = '3686'; PGV.neonpanther = '3686'; PGV.bambooforest = '3686'; PGV.oasisgold = '3686'; PGV.glowcactus = '3686'; PGV.snowowl = '3686'; PGV.cosmicwhale = '3686'; PGV.goldenspider = '3686'; PGV.fireopal = '3686'; PGV.dragonboat = '3686'; PGV.icecastle = '3686'; PGV.skulltreasure = '3686'; PGV.royalcrown2 = '3686'; PGV.sunwolf = '3686'; PGV.mysticlamp = '3686'; PGV.diamondskull = '3686'; PGV.goldenrooster = '3686'; PGV.cosmiccat = '3686'; PGV.lavadragon = '3686'; PGV.emeraldsnake = '3686'; PGV.goldentrain = '3686'; PGV.pixieforest = '3686'; PGV.silvermoon = '3686'; PGV.sunflowerfield = '3686'; PGV.royalelephant = '3686'; PGV.cosmicjelly = '3686'; PGV.pirateflag = '3686'; PGV.ancientscroll = '3686'; PGV.goldenmonkey = '3686';
  pgame('royalswan', RA); pgame('goldenhelmet', RB); pgame('neonpanther', RA, 1); pgame('bambooforest', RB); pgame('oasisgold', RA); pgame('glowcactus', RB, 1); pgame('snowowl', RA); pgame('cosmicwhale', RB); pgame('goldenspider', RA, 1); pgame('fireopal', RB); pgame('dragonboat', RA); pgame('icecastle', RB, 1); pgame('skulltreasure', RA); pgame('royalcrown2', RB); pgame('sunwolf', RA, 1); pgame('mysticlamp', RB); pgame('diamondskull', RA); pgame('goldenrooster', RB, 1); pgame('cosmiccat', RA); pgame('lavadragon', RB); pgame('emeraldsnake', RA, 1); pgame('goldentrain', RB); pgame('pixieforest', RA); pgame('silvermoon', RB, 1); pgame('sunflowerfield', RA); pgame('royalelephant', RB); pgame('cosmicjelly', RA, 1); pgame('pirateflag', RB); pgame('ancientscroll', RA); pgame('goldenmonkey', RB, 1);
  PGV.neonskull = '3686'; PGV.rubyrose = '3686'; PGV.mysticforest = '3686'; PGV.cosmicring = '3686'; PGV.deepseapearl = '3686'; PGV.goldenwings = '3686'; PGV.frozenlake = '3686'; PGV.desertking = '3686'; PGV.cherrytree = '3686'; PGV.goldenmaskaztec = '3686'; PGV.dragonscale = '3686'; PGV.mooncastle = '3686'; PGV.crystalbutterfly = '3686'; PGV.rubyvault = '3686'; PGV.cosmicdragon = '3686'; PGV.goldenhammer = '3686'; PGV.tropicalbird = '3686'; PGV.neoncrown = '3686'; PGV.winterfox = '3686'; PGV.templelion = '3686'; PGV.sunsetsail = '3686'; PGV.moonowl = '3686'; PGV.glitterbox = '3686'; PGV.rainbowfish = '3686'; PGV.goldenkeyhole = '3686'; PGV.emeraldtiger = '3686'; PGV.spaceship2 = '3686'; PGV.fireflower = '3686'; PGV.goldenwhale = '3686'; PGV.mysticstone = '3686';
  pgame('neonskull', RA); pgame('rubyrose', RB); pgame('mysticforest', RA, 1); pgame('cosmicring', RB); pgame('deepseapearl', RA); pgame('goldenwings', RB, 1); pgame('frozenlake', RA); pgame('desertking', RB); pgame('cherrytree', RA, 1); pgame('goldenmaskaztec', RB); pgame('dragonscale', RA); pgame('mooncastle', RB, 1); pgame('crystalbutterfly', RA); pgame('rubyvault', RB); pgame('cosmicdragon', RA, 1); pgame('goldenhammer', RB); pgame('tropicalbird', RA); pgame('neoncrown', RB, 1); pgame('winterfox', RA); pgame('templelion', RB); pgame('sunsetsail', RA, 1); pgame('moonowl', RB); pgame('glitterbox', RA); pgame('rainbowfish', RB, 1); pgame('goldenkeyhole', RA); pgame('emeraldtiger', RB); pgame('spaceship2', RA, 1); pgame('fireflower', RB); pgame('goldenwhale', RA); pgame('mysticstone', RB, 1);
  PGV.royalfalcon = '3686'; PGV.candycastle = '3686'; PGV.neoncity = '3686'; PGV.goldensnail = '3686'; PGV.icedragon = '3686'; PGV.treasurecave = '3686'; PGV.emeraldring = '3686'; PGV.starfall = '3686'; PGV.mysticmask = '3686'; PGV.goldenbear = '3686'; PGV.cosmicflower = '3686'; PGV.sultanpalace = '3686'; PGV.rubyfox = '3686'; PGV.crystaltree = '3686'; PGV.goldenpiano = '3686'; PGV.deepsea = '3686'; PGV.silverdragon = '3686'; PGV.glowmushroom = '3686'; PGV.pharaohcat = '3686'; PGV.winterbell = '3686'; PGV.sunbird = '3686'; PGV.ninjacat = '3686'; PGV.goldenyacht = '3686'; PGV.moonpearl = '3686'; PGV.cosmiclion = '3686'; PGV.amberstone = '3686'; PGV.royaldragon = '3686'; PGV.tropicalisland = '3686'; PGV.lunarfestival = '3686'; PGV.crystalcrown = '3686';
  pgame('royalfalcon', RA); pgame('candycastle', RB); pgame('neoncity', RA, 1); pgame('goldensnail', RB); pgame('icedragon', RA); pgame('treasurecave', RB, 1); pgame('emeraldring', RA); pgame('starfall', RB); pgame('mysticmask', RA, 1); pgame('goldenbear', RB); pgame('cosmicflower', RA); pgame('sultanpalace', RB, 1); pgame('rubyfox', RA); pgame('crystaltree', RB); pgame('goldenpiano', RA, 1); pgame('deepsea', RB); pgame('silverdragon', RA); pgame('glowmushroom', RB, 1); pgame('pharaohcat', RA); pgame('winterbell', RB); pgame('sunbird', RA, 1); pgame('ninjacat', RB); pgame('goldenyacht', RA); pgame('moonpearl', RB, 1); pgame('cosmiclion', RA); pgame('amberstone', RB); pgame('royaldragon', RA, 1); pgame('tropicalisland', RB); pgame('lunarfestival', RA); pgame('crystalcrown', RB, 1);
  PGV.goldengorilla = '3686'; PGV.mermaidtail = '3686'; PGV.neonwolf = '3686'; PGV.samuraihelmet = '3686'; PGV.starcompass = '3686'; PGV.goldenpig = '3686'; PGV.fairylantern = '3686'; PGV.icetiger = '3686'; PGV.mayancalendar = '3686'; PGV.cosmicbutterfly = '3686'; PGV.royalsword = '3686'; PGV.sapphiredragon = '3686'; PGV.goldenlamp2 = '3686'; PGV.crystalbridge = '3686'; PGV.pandaking = '3686'; PGV.voodoo = '3686'; PGV.northernlights = '3686'; PGV.seadragon = '3686'; PGV.goldensaxophone = '3686'; PGV.lotusbuddha = '3686'; PGV.rocketgold = '3686'; PGV.mysticcrystal = '3686'; PGV.roulettewheel2 = '3686'; PGV.ravenmoon = '3686'; PGV.emeraldsea = '3686'; PGV.goldentotem = '3686'; PGV.cupcakeking = '3686'; PGV.spacegem = '3686'; PGV.dragonfire = '3686'; PGV.sunlotus = '3686';
  pgame('goldengorilla', RA); pgame('mermaidtail', RB); pgame('neonwolf', RA, 1); pgame('samuraihelmet', RB); pgame('starcompass', RA); pgame('goldenpig', RB, 1); pgame('fairylantern', RA); pgame('icetiger', RB); pgame('mayancalendar', RA, 1); pgame('cosmicbutterfly', RB); pgame('royalsword', RA); pgame('sapphiredragon', RB, 1); pgame('goldenlamp2', RA); pgame('crystalbridge', RB); pgame('pandaking', RA, 1); pgame('voodoo', RB); pgame('northernlights', RA); pgame('seadragon', RB, 1); pgame('goldensaxophone', RA); pgame('lotusbuddha', RB); pgame('rocketgold', RA, 1); pgame('mysticcrystal', RB); pgame('roulettewheel2', RA); pgame('ravenmoon', RB, 1); pgame('emeraldsea', RA); pgame('goldentotem', RB); pgame('cupcakeking', RA, 1); pgame('spacegem', RB); pgame('dragonfire', RA); pgame('sunlotus', RB, 1);
})(window.D6 = window.D6 || {});
