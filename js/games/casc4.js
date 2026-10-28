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
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#c4sky)"/>' + stars(26) +
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
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#140E06"/><rect x="-400" y="150" width="1100" height="400" fill="url(#dgGround)"/>' +
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
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#gfRoom)"/>' + stars(18) + '<rect x="-400" y="188" width="1100" height="400" fill="#140d33"/>' +
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
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#c4sky)"/>' + stars(22) + '<rect x="-400" y="206" width="1100" height="400" fill="#140d33"/>' +
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
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0D1326"/><rect x="104" y="6" width="92" height="222" rx="6" fill="#141C34" stroke="#334155" stroke-width="1.6"/>' +
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
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#140A2E"/>' + stars(16) +
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
  rgame({
    key: 'chestgold', verb: V.open, rows: RA, sfx: 'chests', cy: 112,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg() + stars(18) + r5glow() +
      '<ellipse cx="150" cy="178" rx="96" ry="16" fill="#000" opacity=".35"/>' +
      '<g id="cyObj" transform="translate(150 112)">' +
      '<rect x="-62" y="-6" width="124" height="52" rx="8" fill="url(#r5wood)" stroke="#3E1F08" stroke-width="2"/>' +
      '<path d="M-62 2a62 30 0 0 1 124 0v-4a62 34 0 0 0-124 0z" fill="#92400E"/>' +
      '<path d="M-62 -4a62 34 0 0 1 124 0l0 6a62 30 0 0 0-124 0z" fill="url(#cyGold)" stroke="#78350F" stroke-width="2"/>' +
      '<rect x="-66" y="12" width="132" height="10" rx="3" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/>' +
      '<rect x="-8" y="8" width="16" height="22" rx="3" fill="url(#cyGold)" stroke="#5C2E0E" stroke-width="2"/><circle cx="0" cy="19" r="3.5" fill="#3E1F08"/>' +
      '<circle cx="-40" cy="-18" r="2.4" fill="#FEF3C7"/><circle cx="24" cy="-24" r="2" fill="#FEF3C7"/>' +
      '</g>'
  });

  /* ---- Fortune Wheel (RB, spin) ---- */
  rgame({
    key: 'fortunewheel', verb: { en: 'Spin', fr: 'Tourner', es: 'Girar', pt: 'Girar', ar: 'أدر', tr: 'Çevir', vi: 'Quay', id: 'Putar', ru: 'Крутить', de: 'Drehen', hi: 'घुमाएँ', zh: '旋转' },
    rows: RB, spin: true, sfx: 'show', cy: 106,
    scene: '<defs>' + GDEFS + '<linearGradient id="r5felt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14532D"/><stop offset="1" stop-color="#052e16"/></linearGradient></defs>' + r5bg('url(#r5felt)') + r5glow() +
      '<g id="cyObj" transform="translate(150 106)">' +
      (function () { var seg = ''; var cols = ['#DC2626', '#1E293B', '#B45309', '#065F46', '#6D28D9', '#B91C1C', '#1E3A8A', '#92400E']; for (var i = 0; i < 8; i++) { var a0 = i / 8 * Math.PI * 2 - Math.PI / 2, a1 = (i + 1) / 8 * Math.PI * 2 - Math.PI / 2, R = 62; seg += '<path d="M0 0L' + (Math.cos(a0) * R).toFixed(1) + ' ' + (Math.sin(a0) * R).toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + (Math.cos(a1) * R).toFixed(1) + ' ' + (Math.sin(a1) * R).toFixed(1) + 'Z" fill="' + cols[i] + '"/>'; } return seg; })() +
      '<circle r="62" fill="none" stroke="url(#cyGold)" stroke-width="5"/><circle r="62" fill="none" stroke="#78350F" stroke-width="1.5"/>' +
      '<circle r="12" fill="url(#cyGold)" stroke="#78350F" stroke-width="2"/>' +
      (function () { var p = ''; for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2; p += '<circle cx="' + (Math.cos(a) * 62).toFixed(1) + '" cy="' + (Math.sin(a) * 62).toFixed(1) + '" r="2.5" fill="#FEF3C7"/>'; } return p; })() +
      '</g>' +
      '<path d="M150 36l-8-14h16z" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/>'
  });

  /* ---- Golden Egg (RB) ---- */
  rgame({
    key: 'goldenegg', verb: V.tap, rows: RB, sfx: 'chests', cy: 110,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg() + stars(16) + r5glow() +
      '<ellipse cx="150" cy="176" rx="60" ry="12" fill="#000" opacity=".35"/>' +
      '<path d="M120 150h60l-6 14h-48z" fill="#5C2E0E"/><rect x="112" y="162" width="76" height="8" rx="3" fill="#78350F"/>' +
      '<g id="cyObj" transform="translate(150 110)">' +
      '<ellipse cx="0" cy="0" rx="38" ry="50" fill="url(#cyGold)" stroke="#78350F" stroke-width="2.5"/>' +
      '<path d="M-38 -6q38 16 76 0" fill="none" stroke="#78350F" stroke-width="2" opacity=".5"/>' +
      '<path d="M-34 18q34 14 68 0" fill="none" stroke="#78350F" stroke-width="2" opacity=".5"/>' +
      '<path d="M0 -50v100M-30 -20q30 10 60 0M-34 10q34 10 68 0" fill="none" stroke="#B45309" stroke-width="1" opacity=".4"/>' +
      '<ellipse cx="-12" cy="-22" rx="8" ry="14" fill="#FFF7D6" opacity=".55"/>' +
      '</g>'
  });

  /* ---- Mystery Box (RA) ---- */
  rgame({
    key: 'mysterybox', verb: V.open, rows: RA, sfx: 'chests', cy: 112,
    scene: '<defs>' + GDEFS + '<linearGradient id="r5box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#4C1D95"/></linearGradient></defs>' + r5bg() + stars(16) + r5glow() +
      '<ellipse cx="150" cy="176" rx="74" ry="13" fill="#000" opacity=".35"/>' +
      '<g id="cyObj" transform="translate(150 112)">' +
      '<rect x="-48" y="-8" width="96" height="56" rx="6" fill="url(#r5box)" stroke="#2E1065" stroke-width="2"/>' +
      '<rect x="-52" y="-22" width="104" height="18" rx="5" fill="#6D28D9" stroke="#2E1065" stroke-width="2"/>' +
      '<rect x="-8" y="-22" width="16" height="70" fill="url(#cyGold)" opacity=".92"/>' +
      '<rect x="-52" y="-10" width="104" height="10" fill="url(#cyGold)" opacity=".92"/>' +
      '<path d="M0 -22q-18 -20-4 -6q-14 -14 4 -2q18 -12 4 2q14 -14-4 6z" fill="url(#cyGold)"/>' +
      '<circle r="5" cx="0" cy="-22" fill="#FEF3C7"/>' +
      '</g>'
  });

  /* ---- Crystal Orb (RA) ---- */
  rgame({
    key: 'crystalorb', verb: V.tap, rows: RA, sfx: 'show', cy: 104,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg() + stars(20) + r5glow() +
      '<ellipse cx="150" cy="182" rx="56" ry="12" fill="#000" opacity=".35"/>' +
      '<path d="M120 150q30 22 60 0l8 20h-76z" fill="url(#cyGold)" stroke="#78350F" stroke-width="2"/>' +
      '<g id="cyObj" transform="translate(150 104)">' +
      '<circle r="46" fill="url(#r5orb)" stroke="#155E75" stroke-width="2"/>' +
      '<ellipse cx="-14" cy="-16" rx="14" ry="20" fill="#fff" opacity=".45"/>' +
      '<circle cx="12" cy="14" r="8" fill="#fff" opacity=".2"/>' +
      '<circle r="46" fill="none" stroke="#A5F3FC" stroke-width="1" opacity=".5"/>' +
      '</g>'
  });

  /* ---- Diamond Vault (RB) ---- */
  rgame({
    key: 'diamondvault', verb: V.open, rows: RB, sfx: 'show', cy: 108,
    scene: '<defs>' + GDEFS + '<radialGradient id="r5dia" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#E0F2FE"/><stop offset=".5" stop-color="#67E8F9"/><stop offset="1" stop-color="#0891B2"/></radialGradient></defs>' + r5bg('#0F172A') +
      '<rect x="40" y="18" width="220" height="184" rx="10" fill="#1E293B"/>' + r5glow() +
      '<g id="cyObj" transform="translate(150 108)">' +
      '<rect x="-64" y="-64" width="128" height="128" rx="12" fill="url(#r5steel)" stroke="#0F172A" stroke-width="3"/>' +
      '<circle r="52" fill="#334155" stroke="#0F172A" stroke-width="2"/><circle r="52" fill="none" stroke="#64748B" stroke-width="1"/>' +
      '<circle r="18" fill="url(#r5steel)" stroke="#0F172A" stroke-width="2"/>' +
      (function () { var p = ''; for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; p += '<rect x="-3" y="-34" width="6" height="16" rx="2" fill="#475569" transform="rotate(' + (i * 60) + ')"/>'; } return p; })() +
      '<path d="M0 -8l10 4-4 12h-12l-4-12z" fill="url(#r5dia)" stroke="#0891B2" stroke-width="1"/>' +
      '</g>'
  });

  /* ---- casc5 vague 2 ---- */
  function pip(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#1C1917"/>'; }
  /* Dice Roll (RA) */
  rgame({
    key: 'diceroll', verb: V.tap, rows: RA, sfx: 'show', cy: 110,
    scene: '<defs>' + GDEFS + '<linearGradient id="r5f2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14532D"/><stop offset="1" stop-color="#052e16"/></linearGradient></defs>' + r5bg('url(#r5f2)') + r5glow() +
      '<ellipse cx="150" cy="168" rx="80" ry="14" fill="#000" opacity=".3"/>' +
      '<g id="cyObj" transform="translate(150 110)">' +
      '<g transform="translate(-34 0) rotate(-10)"><rect x="-26" y="-26" width="52" height="52" rx="10" fill="#FEFCE8" stroke="#CA8A04" stroke-width="2"/>' + pip(-12, -12) + pip(12, -12) + pip(-12, 12) + pip(12, 12) + pip(0, 0) + '</g>' +
      '<g transform="translate(36 2) rotate(14)"><rect x="-24" y="-24" width="48" height="48" rx="9" fill="#FEFCE8" stroke="#CA8A04" stroke-width="2"/>' + pip(-11, -11) + pip(11, 11) + pip(0, 0) + '</g>' +
      '</g>'
  });
  /* Royal Card (RB) */
  rgame({
    key: 'royalcard', verb: V.tap, rows: RB, sfx: 'show', cy: 108,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg() + stars(16) + r5glow() +
      '<g id="cyObj" transform="translate(150 108)">' +
      '<rect x="-40" y="-56" width="80" height="112" rx="9" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>' +
      '<rect x="-33" y="-49" width="66" height="98" rx="6" fill="url(#r5vel)"/>' +
      '<rect x="-33" y="-49" width="66" height="98" rx="6" fill="none" stroke="url(#cyGold)" stroke-width="2"/>' +
      STAR(18, 'url(#cyGold)').replace('<path', '<path transform="translate(0 -14)"') +
      '<text y="40" text-anchor="middle" font-size="22" font-weight="900" fill="url(#cyGold)" font-family="var(--cg-font),Arial">A</text>' +
      '<text x="-27" y="-32" text-anchor="middle" font-size="12" font-weight="900" fill="#FDE68A" font-family="var(--cg-font),Arial">A</text>' +
      '</g>'
  });
  /* Genie Lamp (RA) */
  rgame({
    key: 'genielamp', verb: V.tap, rows: RA, sfx: 'show', cy: 112,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg('url(#r5vel)') + stars(16) + r5glow() +
      '<ellipse cx="150" cy="170" rx="70" ry="12" fill="#000" opacity=".35"/>' +
      '<g id="cyObj" transform="translate(150 112)">' +
      '<path d="M-52 18q-6-30 30-30 40 0 54 8 8 4 0 8-18 6-54 6h-30z" fill="url(#cyGold)" stroke="#78350F" stroke-width="2"/>' +
      '<ellipse cx="-6" cy="-6" rx="34" ry="18" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/>' +
      '<path d="M-10 -22q6-10 2-16" fill="none" stroke="url(#cyGold)" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="-6" cy="-24" r="4" fill="#FDE68A"/>' +
      '<path d="M44 2q22-4 26 8-14 2-26-2z" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/>' +
      '<ellipse cx="-14" cy="-10" rx="10" ry="5" fill="#FFF7D6" opacity=".5"/>' +
      '</g>'
  });
  /* Jackpot Bell (RB) */
  rgame({
    key: 'jackpotbell', verb: V.tap, rows: RB, sfx: 'show', cy: 104,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg('url(#r5vel)') + stars(16) + r5glow() +
      '<g id="cyObj" transform="translate(150 104)">' +
      '<circle cx="0" cy="-48" r="6" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/>' +
      '<path d="M-44 36q0-78 44-78 44 0 44 78z" fill="url(#cyGold)" stroke="#78350F" stroke-width="2.5"/>' +
      '<rect x="-52" y="34" width="104" height="12" rx="6" fill="#B45309" stroke="#78350F" stroke-width="1.5"/>' +
      '<circle cx="0" cy="52" r="8" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/>' +
      '<ellipse cx="-16" cy="-8" rx="9" ry="26" fill="#FFF7D6" opacity=".45"/>' +
      '<text y="12" text-anchor="middle" font-size="20" font-weight="900" fill="#78350F" font-family="var(--cg-font),Arial">7</text>' +
      '</g>'
  });
  /* Oyster Pearl (RA) */
  rgame({
    key: 'oysterpearl', verb: V.open, rows: RA, sfx: 'chests', cy: 110,
    scene: '<defs>' + GDEFS + '<radialGradient id="r5pl" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#E0F2FE"/><stop offset="1" stop-color="#A5B4FC"/></radialGradient><linearGradient id="r5sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E7490"/><stop offset="1" stop-color="#083344"/></linearGradient></defs>' + r5bg('url(#r5sea)') + r5glow() +
      '<g id="cyObj" transform="translate(150 110)">' +
      '<path d="M-56 10a56 44 0 0 1 112 0z" fill="#CBD5E1" stroke="#64748B" stroke-width="2"/>' +
      '<path d="M-56 10q56 24 112 0a56 40 0 0 0-112 0z" fill="#E2E8F0"/>' +
      '<path d="M-48 10q48 20 96 0" fill="none" stroke="#94A3B8" stroke-width="1.5"/>' +
      (function () { var p = ''; for (var i = 0; i < 7; i++) { var x = -44 + i * 14.6; p += '<path d="M' + x.toFixed(0) + ' 10q4 -18 7 0z" fill="#F1F5F9" stroke="#94A3B8" stroke-width="0.6"/>'; } return p; })() +
      '<circle cx="0" cy="4" r="16" fill="url(#r5pl)"/><circle cx="-5" cy="-1" r="5" fill="#fff" opacity=".6"/>' +
      '</g>'
  });
  /* Crown Jewel (RB) */
  rgame({
    key: 'crownjewel', verb: V.tap, rows: RB, sfx: 'show', cy: 112,
    scene: '<defs>' + GDEFS + '<radialGradient id="r5ru" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#FDA4AF"/><stop offset=".6" stop-color="#E11D48"/><stop offset="1" stop-color="#881337"/></radialGradient></defs>' + r5bg() + stars(16) + r5glow() +
      '<ellipse cx="150" cy="168" rx="64" ry="12" fill="#000" opacity=".35"/>' +
      '<g id="cyObj" transform="translate(150 112)">' +
      '<path d="M-52 24L-52 -10 -26 10 0 -24 26 10 52 -10 52 24z" fill="url(#cyGold)" stroke="#78350F" stroke-width="2.5"/>' +
      '<rect x="-54" y="24" width="108" height="14" rx="4" fill="#B45309" stroke="#78350F" stroke-width="1.5"/>' +
      '<circle cx="-52" cy="-10" r="5" fill="#FDE68A"/><circle cx="0" cy="-24" r="6" fill="url(#r5ru)"/><circle cx="52" cy="-10" r="5" fill="#FDE68A"/>' +
      '<circle cx="-26" cy="14" r="5" fill="#67E8F9"/><circle cx="26" cy="14" r="5" fill="#67E8F9"/><circle cx="0" cy="18" r="6" fill="url(#r5ru)"/>' +
      '<rect x="-54" y="30" width="108" height="3" fill="#FEF3C7" opacity=".5"/>' +
      '</g>'
  });

  /* ---- casc5 vague 3 ---- */
  /* Geode Gem (RB) */
  rgame({
    key: 'geodegem', verb: V.open, rows: RB, sfx: 'chests', cy: 110,
    scene: '<defs>' + GDEFS + '<radialGradient id="r5ge" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#F0ABFC"/><stop offset=".5" stop-color="#A855F7"/><stop offset="1" stop-color="#6D28D9"/></radialGradient></defs>' + r5bg() + stars(14) + r5glow() +
      '<ellipse cx="150" cy="170" rx="66" ry="12" fill="#000" opacity=".35"/>' +
      '<g id="cyObj" transform="translate(150 110)">' +
      '<path d="M-48 10q-8-44 46-46 52 2 50 44-6 30-48 32-42-2-48-30z" fill="#57534E" stroke="#292524" stroke-width="2"/>' +
      '<path d="M-34 6q-4-30 34-32 36 2 36 30-6 22-36 22-30 0-34-20z" fill="url(#r5ge)"/>' +
      (function () { var p = ''; for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2, R = 18 + (i % 2) * 6; p += '<path d="M0 0L' + (Math.cos(a) * R).toFixed(0) + ' ' + (Math.sin(a - 0.3) * R * 0.7).toFixed(0) + 'l4 4z" fill="rgba(255,255,255,.3)"/>'; } return p; })() +
      '<path d="M0 -8l7 3-3 10h-8l-3-10z" fill="#E0F2FE" stroke="#A5F3FC" stroke-width="1"/>' +
      '</g>'
  });
  /* Money Tree (RA) */
  rgame({
    key: 'moneytree', verb: V.tap, rows: RA, sfx: 'chests', cy: 100,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg('url(#r5vel)') + stars(14) + r5glow() +
      '<g id="cyObj" transform="translate(150 100)">' +
      '<path d="M-6 60V6q-16-6-14-24M6 60V-4q18-4 18-26" fill="none" stroke="#78350F" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="-7" y="56" width="14" height="22" fill="#5C2E0E"/>' +
      '<path d="M-30 64h60l-6 16h-48z" fill="#92400E" stroke="#5C2E0E" stroke-width="1.5"/>' +
      (function () { var p = '<circle cx="0" cy="-24" r="40" fill="#14532D"/><circle cx="-26" cy="-10" r="26" fill="#166534"/><circle cx="26" cy="-10" r="26" fill="#166534"/>'; var pos = [[-22, -34], [0, -42], [22, -34], [-30, -14], [-8, -22], [14, -20], [30, -12], [-14, 2], [10, 4]]; pos.forEach(function (q) { p += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="7" fill="url(#cyGold)" stroke="#78350F" stroke-width="1"/><text x="' + q[0] + '" y="' + (q[1] + 3.5) + '" text-anchor="middle" font-size="8" font-weight="900" fill="#78350F" font-family="var(--cg-font),Arial">$</text>'; }); return p; })() +
      '</g>'
  });
  /* Lottery Ball (RA) */
  rgame({
    key: 'lotteryball', verb: V.tap, rows: RA, sfx: 'show', cy: 106,
    scene: '<defs>' + GDEFS + '<radialGradient id="r5gl2" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".3" stop-color="#FDE68A"/><stop offset="1" stop-color="#B45309"/></radialGradient></defs>' + r5bg() + stars(14) + r5glow() +
      '<g id="cyObj" transform="translate(150 106)">' +
      '<circle r="52" fill="rgba(165,243,252,.12)" stroke="#94A3B8" stroke-width="2"/>' +
      '<circle r="52" fill="none" stroke="#E2E8F0" stroke-width="1" opacity=".4"/>' +
      '<circle cx="-14" cy="-16" r="10" fill="#fff" opacity=".2"/>' +
      '<circle cx="4" cy="6" r="24" fill="url(#r5gl2)" stroke="#78350F" stroke-width="1.5"/>' +
      '<circle cx="4" cy="6" r="14" fill="#FFF7ED" opacity=".85"/>' +
      '<text x="4" y="11" text-anchor="middle" font-size="16" font-weight="900" fill="#B45309" font-family="var(--cg-font),Arial">7</text>' +
      '<circle cx="-24" cy="26" r="9" fill="#F87171" opacity=".6"/><circle cx="26" cy="-22" r="7" fill="#60A5FA" opacity=".6"/>' +
      '</g>'
  });
  /* Dragon Coin (RB) */
  rgame({
    key: 'dragoncoin', verb: V.tap, rows: RB, sfx: 'chests', cy: 106,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg('url(#r5vel)') + stars(14) + r5glow() +
      '<g id="cyObj" transform="translate(150 106)">' +
      '<circle r="52" fill="url(#cyGold)" stroke="#78350F" stroke-width="3"/>' +
      '<circle r="44" fill="none" stroke="#92400E" stroke-width="2" opacity=".6"/>' +
      '<circle r="52" fill="none" stroke="#FEF3C7" stroke-width="1" opacity=".5"/>' +
      '<path d="M-18 20q-14-14-6-30 6-12 20-8-10 4-10 14 0 12 14 10-8 12-18 14z M14 -22q16 4 14 22-2 14-16 14 8-6 6-16-2-12-16-10 6-10 12-10z" fill="#92400E"/>' +
      '<circle cx="-8" cy="-6" r="3" fill="#B91C1C"/>' +
      '<ellipse cx="-18" cy="-20" rx="12" ry="7" fill="#FFF7D6" opacity=".4"/>' +
      '</g>'
  });
  /* Firework (RA) */
  rgame({
    key: 'fireworkgold', verb: V.launch, rows: RA, sfx: 'crash', cy: 150,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg('url(#c4sky)') + stars(26) + r5glow() +
      '<rect x="138" y="150" width="24" height="54" rx="4" fill="#78350F"/><rect x="138" y="150" width="24" height="10" rx="3" fill="#92400E"/>' +
      '<g id="cyObj" transform="translate(150 150)">' +
      '<ellipse cx="0" cy="0" rx="18" ry="30" fill="url(#cyGold)" stroke="#78350F" stroke-width="2"/>' +
      '<path d="M0 -30q6-8 0-16" fill="none" stroke="#F87171" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="0" cy="-46" r="4" fill="#FB923C"/><circle cx="0" cy="-46" r="2" fill="#FEF08A"/>' +
      '<path d="M-18 -4h36M-14 10h28" fill="none" stroke="#92400E" stroke-width="1.5" opacity=".5"/>' +
      '<text y="6" text-anchor="middle" font-size="16" font-weight="900" fill="#78350F" font-family="var(--cg-font),Arial">★</text>' +
      '</g>'
  });
  /* Treasure Map (RB) */
  rgame({
    key: 'treasuremap', verb: V.open, rows: RB, sfx: 'show', cy: 108,
    scene: '<defs>' + GDEFS + '<linearGradient id="r5pr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#D6B98C"/></linearGradient></defs>' + r5bg() + stars(12) + r5glow() +
      '<g id="cyObj" transform="translate(150 108)">' +
      '<path d="M-66 -46q10 6 0 12 14 8 0 14 12 6 0 12 14 8 0 14 10 6 0 12 0 6 8 6h108q8 0 8-6 0-6 0-12 0-6-8-14 0-6 0-14 0-6-8-12 0-6 0-14 0-6-8-12H-58q-8 0-8 6z" fill="url(#r5pr)" stroke="#92400E" stroke-width="2"/>' +
      '<path d="M-54 -20q30 10 60-4t44 10" fill="none" stroke="#92400E" stroke-width="1.5" stroke-dasharray="4 4" opacity=".6"/>' +
      '<path d="M34 10l16 16M50 10l-16 16" stroke="#B91C1C" stroke-width="4" stroke-linecap="round"/>' +
      '<g transform="translate(-40 -30)"><circle r="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/><path d="M0 -9l3 9-3 9-3-9z" fill="#B91C1C"/><path d="M-9 0l9 3 9-3-9-3z" fill="#334155"/></g>' +
      '</g>'
  });

  /* ---- casc5 vague 4 (finale → 232) ---- */
  function goldbar(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') skewX(-18)"><rect x="' + (-18 * s) + '" y="' + (-7 * s) + '" width="' + (36 * s) + '" height="' + (14 * s) + '" rx="2" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/><rect x="' + (-18 * s) + '" y="' + (-7 * s) + '" width="' + (36 * s) + '" height="' + (4 * s) + '" fill="#FFF7D6" opacity=".4"/></g>'; }
  /* Gold Bars (RA) */
  rgame({
    key: 'goldbars', verb: V.tap, rows: RA, sfx: 'chests', cy: 112,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg() + stars(14) + r5glow() +
      '<ellipse cx="150" cy="168" rx="70" ry="12" fill="#000" opacity=".35"/>' +
      '<g id="cyObj" transform="translate(150 112)">' + goldbar(-20, 18, 1) + goldbar(22, 18, 1) + goldbar(0, 0, 1.1) + '</g>'
  });
  /* Poker Chip (RB) */
  rgame({
    key: 'pokerchip', verb: V.tap, rows: RB, sfx: 'show', cy: 106,
    scene: '<defs>' + GDEFS + '<linearGradient id="r5f3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14532D"/><stop offset="1" stop-color="#052e16"/></linearGradient></defs>' + r5bg('url(#r5f3)') + r5glow() +
      '<g id="cyObj" transform="translate(150 106)">' +
      '<circle r="50" fill="#B91C1C" stroke="#7F1D1D" stroke-width="2"/>' +
      (function () { var p = ''; for (var i = 0; i < 8; i++) { p += '<rect x="-7" y="-50" width="14" height="14" fill="#F8FAFC" transform="rotate(' + (i * 45) + ')"/>'; } return p; })() +
      '<circle r="34" fill="#DC2626" stroke="url(#cyGold)" stroke-width="3"/>' +
      '<circle r="22" fill="#B91C1C" stroke="url(#cyGold)" stroke-width="1.5"/>' +
      '<text y="7" text-anchor="middle" font-size="18" font-weight="900" fill="url(#cyGold)" font-family="var(--cg-font),Arial">$</text>' +
      '</g>'
  });
  /* Lucky Clover (RA) */
  rgame({
    key: 'luckyclover', verb: V.tap, rows: RA, sfx: 'show', cy: 108,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg('url(#r5vel)') + stars(14) + r5glow() +
      '<g id="cyObj" transform="translate(150 108)">' +
      (function () { var p = ''; for (var i = 0; i < 4; i++) { var a = i * 90; p += '<path d="M0 0C-16 -14-16 -36 0 -36 16 -36 16 -14 0 0z" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5" transform="rotate(' + (a + 45) + ')"/>'; } return p; })() +
      '<path d="M0 0q4 20-10 36" fill="none" stroke="#B45309" stroke-width="4" stroke-linecap="round"/>' +
      '<circle r="5" fill="#FEF3C7"/>' +
      '</g>'
  });
  /* Ruby Heart (RB) */
  rgame({
    key: 'rubyheart', verb: V.tap, rows: RB, sfx: 'show', cy: 104,
    scene: '<defs>' + GDEFS + '<radialGradient id="r5rb2" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#FDA4AF"/><stop offset=".5" stop-color="#E11D48"/><stop offset="1" stop-color="#881337"/></radialGradient></defs>' + r5bg() + stars(14) + r5glow() +
      '<g id="cyObj" transform="translate(150 104)">' +
      '<path d="M0 36C-44 4-40-40 0-20 40-40 44 4 0 36z" fill="url(#r5rb2)" stroke="#881337" stroke-width="2"/>' +
      '<path d="M0 -20L-28-6 0 36 28-6z" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.2"/>' +
      '<path d="M-28-6H28M0-20V36" stroke="rgba(255,255,255,.25)" stroke-width="1"/>' +
      '<path d="M-16-10l8 8" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>' +
      '</g>'
  });
  /* Money Bag (RA) */
  rgame({
    key: 'moneybag', verb: V.open, rows: RA, sfx: 'chests', cy: 108,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg('url(#r5vel)') + stars(12) + r5glow() +
      '<ellipse cx="150" cy="170" rx="60" ry="12" fill="#000" opacity=".35"/>' +
      '<g id="cyObj" transform="translate(150 108)">' +
      '<path d="M-38 48q-14-46 10-62-10-6-4-14h64q6 8-4 14 24 16 10 62z" fill="#92400E" stroke="#5C2E0E" stroke-width="2"/>' +
      '<path d="M-32-28h64" stroke="#5C2E0E" stroke-width="3"/>' +
      '<ellipse cx="-14" cy="6" rx="10" ry="18" fill="#A16207" opacity=".5"/>' +
      '<circle cx="0" cy="14" r="16" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/>' +
      '<text y="20" text-anchor="middle" font-size="18" font-weight="900" fill="#78350F" font-family="var(--cg-font),Arial">$</text>' +
      '</g>'
  });
  /* Horseshoe (RA) */
  rgame({
    key: 'luckyshoe', verb: V.tap, rows: RA, sfx: 'show', cy: 108,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg('url(#r5vel)') + stars(14) + r5glow() +
      '<g id="cyObj" transform="translate(150 108)">' +
      '<path d="M-30 40V6a30 36 0 0 1 60 0v34h-14V8a16 22 0 0 0-32 0v32z" fill="url(#cyGold)" stroke="#78350F" stroke-width="2.5"/>' +
      (function () { var p = ''; var pts = [[-22, 34], [-26, 14], [-18, -8], [18, -8], [26, 14], [22, 34]]; pts.forEach(function (q) { p += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="2.4" fill="#5C2E0E"/>'; }); return p; })() +
      '<path d="M-26 2a26 30 0 0 1 52 0" fill="none" stroke="#FFF7D6" stroke-width="1.5" opacity=".5"/>' +
      '</g>'
  });
  /* Diamond Ring (RB) */
  rgame({
    key: 'diamondring', verb: V.tap, rows: RB, sfx: 'show', cy: 112,
    scene: '<defs>' + GDEFS + '<radialGradient id="r5dr2" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#A5F3FC"/><stop offset="1" stop-color="#0891B2"/></radialGradient></defs>' + r5bg('url(#r5vel)') + stars(16) + r5glow() +
      '<g id="cyObj" transform="translate(150 112)">' +
      '<circle cx="0" cy="18" r="30" fill="none" stroke="url(#cyGold)" stroke-width="9"/>' +
      '<circle cx="0" cy="18" r="30" fill="none" stroke="#78350F" stroke-width="1" opacity=".5"/>' +
      '<path d="M-14-20L0-36 14-20 0 2z" fill="url(#r5dr2)" stroke="#0891B2" stroke-width="1"/>' +
      '<path d="M-14-20H14M0-36 0 2M-7-20L0-36 7-20" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="0.8"/>' +
      '<circle cx="-6" cy="-24" r="3" fill="#fff" opacity=".8"/>' +
      '</g>'
  });
  /* Gold Trophy (RB) */
  rgame({
    key: 'goldtrophy', verb: V.tap, rows: RB, sfx: 'show', cy: 104,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg() + stars(14) + r5glow() +
      '<g id="cyObj" transform="translate(150 104)">' +
      '<path d="M-28-40h56v14a28 30 0 0 1-56 0z" fill="url(#cyGold)" stroke="#78350F" stroke-width="2"/>' +
      '<path d="M-28-34c-18 0-20 20 2 22M28-34c18 0 20 20-2 22" fill="none" stroke="url(#cyGold)" stroke-width="4"/>' +
      '<rect x="-6" y="-2" width="12" height="20" fill="url(#cyGold)"/>' +
      '<path d="M-20 18h40l-4 14h-32z" fill="#B45309" stroke="#78350F" stroke-width="1.5"/>' +
      '<rect x="-26" y="30" width="52" height="10" rx="2" fill="url(#cyGold)" stroke="#78350F" stroke-width="1.5"/>' +
      '<ellipse cx="-10" cy="-26" rx="6" ry="14" fill="#FFF7D6" opacity=".45"/>' +
      '<text y="-18" text-anchor="middle" font-size="12" font-weight="900" fill="#78350F" font-family="var(--cg-font),Arial">1</text>' +
      '</g>'
  });
  /* Sun Medallion (RA) */
  rgame({
    key: 'sunburst', verb: V.tap, rows: RA, sfx: 'show', cy: 106,
    scene: '<defs>' + GDEFS + '</defs>' + r5bg('url(#r5vel)') + stars(14) + r5glow() +
      '<g id="cyObj" transform="translate(150 106)">' +
      (function () { var p = ''; for (var i = 0; i < 16; i++) { p += '<path d="M0 -42l5 10h-10z" fill="url(#cyGold)" transform="rotate(' + (i * 22.5) + ')"/>'; } return p; })() +
      '<circle r="34" fill="url(#cyGold)" stroke="#78350F" stroke-width="2.5"/>' +
      '<circle r="26" fill="none" stroke="#92400E" stroke-width="1.5" opacity=".5"/>' +
      '<circle cx="-10" cy="-6" r="3.5" fill="#5C2E0E"/><circle cx="10" cy="-6" r="3.5" fill="#5C2E0E"/>' +
      '<path d="M-10 8q10 10 20 0" fill="none" stroke="#5C2E0E" stroke-width="2.5" stroke-linecap="round"/>' +
      '</g>'
  });
  /* Gem Trio (RB) */
  rgame({
    key: 'gemtrio', verb: V.open, rows: RB, sfx: 'chests', cy: 108,
    scene: '<defs>' + GDEFS + '<radialGradient id="r5a" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#FDA4AF"/><stop offset="1" stop-color="#BE123C"/></radialGradient><radialGradient id="r5b" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#86EFAC"/><stop offset="1" stop-color="#15803D"/></radialGradient><radialGradient id="r5c" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#A5F3FC"/><stop offset="1" stop-color="#0891B2"/></radialGradient></defs>' + r5bg() + stars(14) + r5glow() +
      '<g id="cyObj" transform="translate(150 108)">' +
      (function () { function g(x, y, f, s) { return '<g transform="translate(' + x + ' ' + y + ')"><path d="M0 ' + (-18 * s) + 'l' + (16 * s) + ' ' + (6 * s) + 'l' + (-6 * s) + ' ' + (22 * s) + 'h' + (-20 * s) + 'l' + (-6 * s) + ' ' + (-22 * s) + 'z" fill="' + f + '" stroke="rgba(0,0,0,.3)" stroke-width="1"/><path d="M0 ' + (-18 * s) + 'v' + (40 * s) + 'M' + (-16 * s) + ' ' + (-12 * s) + 'H' + (16 * s) + '" stroke="rgba(255,255,255,.4)" stroke-width="0.8"/></g>'; } return g(-34, 6, 'url(#r5a)', 0.82) + g(32, 8, 'url(#r5c)', 0.78) + g(0, -4, 'url(#r5b)', 1); })() +
      '</g>'
  });
})(window.D6 = window.D6 || {});
