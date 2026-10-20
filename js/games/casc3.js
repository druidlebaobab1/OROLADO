/* casc3 (owner request, round 7) — 6 instant games: Cargo Drop, Mahjong Draw, Robo Boxing, Lantern Festival, Meteor Shower, Curling.
   The server draws the line (view.i) or the winning option (view.w) — casino_ext/casc.php — and the scene always shows exactly
   that result. Visitors see the games play by themselves (no money, no sound). */
(function (D6) {
  'use strict';
  /* ---- pure logic (no page needed): pay lines as on the server + the scene each line draws; checked by scripts/test-cg-casc-inst.js ---- */
  var L = D6.CascLogic = D6.CascLogic || {};
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  L.rows = L.rows || {}; L.picks = L.picks || {};
  L.picks.cargodrop = [0.5, 0.3, 0.2];
  // Mahjong Draw: 48 tiles = kinds 0…8 (bamboo 1–9) and 9…11 (red, green, white dragon), 4 of each; 3 tiles drawn.
  // class: 0 nothing · 1 pair · 2 chow (3 bamboo in a row) · 3 pung (3 same bamboo) · 4 dragon pung
  L.rows.mahjong = [0, 2.7, 10.4, 50, 100];
  L.mjClass = function (h) {
    var s = h.slice().sort(function (a, b) { return a - b; });
    if (s[0] === s[2]) return s[0] >= 9 ? 4 : 3;
    if (s[0] === s[1] || s[1] === s[2]) return 1;
    if (s[2] < 9 && s[1] === s[0] + 1 && s[2] === s[1] + 1) return 2;
    return 0;
  };
  L.mahjong = function (i) {
    if (i === 4) { var d = 9 + rnd(3); return [d, d, d]; }
    if (i === 3) { var b = rnd(9); return [b, b, b]; }
    if (i === 2) { var s = rnd(7); return shuffle([s, s + 1, s + 2]); }
    if (i === 1) { var a = rnd(12), o; do { o = rnd(12); } while (o === a); return shuffle([a, a, o]); }
    for (;;) { var t = shuffle([].concat.apply([], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (k) { return [k, k, k, k]; }))).slice(0, 3); if (L.mjClass(t) === 0) return t; }
  };
  // Robo Boxing: line = rounds (won, lost, even); every round shows both powers 1–10
  L.ROBO = [[0, 3, 0], [0, 2, 1], [1, 2, 0], [0, 1, 2], [1, 1, 1], [0, 0, 3], [1, 0, 2], [2, 1, 0], [2, 0, 1], [3, 0, 0]];
  L.rows.robobox = [0, 0, 0, 0, 1, 1, 1.72, 1.72, 1.72, 2.4];
  L.robobox = function (i) {
    var c = L.ROBO[i], seq = [];
    for (var q = 0; q < c[0]; q++) seq.push('w'); for (q = 0; q < c[1]; q++) seq.push('l'); for (q = 0; q < c[2]; q++) seq.push('t');
    return shuffle(seq).map(function (x) { var hi = 2 + rnd(9), lo = 1 + rnd(hi - 1), e = 1 + rnd(10); return x === 'w' ? [hi, lo] : x === 'l' ? [lo, hi] : [e, e]; });
  };
  L.roboPay = function (R) { var w = 0, l = 0; R.forEach(function (p) { if (p[0] > p[1]) w++; else if (p[0] < p[1]) l++; }); return w === 3 ? 2.4 : w > l ? 1.72 : w === l ? 1 : 0; };
  // Lantern Festival: line i = i golden lanterns among 5
  L.rows.lantern = [0, 0.4, 1.6, 5, 20, 200];
  L.lantern = function (i) { var g = shuffle([0, 1, 2, 3, 4]).slice(0, i); return [0, 1, 2, 3, 4].map(function (j) { return g.indexOf(j) >= 0 ? 1 : 0; }); };
  // Meteor Shower: line = the 3 meteors sorted (a ≤ b ≤ c), 0 burns up · 1 blue ×0.2 · 2 purple ×0.8 · 3 gold ×3.5; 3 gold = ×200
  L.METV = [0, 0.2, 0.8, 3.5];
  L.MET = []; L.rows.meteor = [];
  for (var a = 0; a < 4; a++) for (var b = a; b < 4; b++) for (var c = b; c < 4; c++) { L.MET.push([a, b, c]); L.rows.meteor.push(a === 3 ? 200 : Math.round((L.METV[a] + L.METV[b] + L.METV[c]) * 100) / 100); }
  L.meteor = function (i) { return shuffle(L.MET[i].slice()); };
  // Curling: past the house · hits the guard (lose) · 12-foot ×0.5 · 8-foot ×1.2 · 4-foot ×2.5 · button ×6 · button + takeout ×25 · dead centre ×100
  L.rows.curling = [0, 0, 0.5, 1.2, 2.5, 6, 25, 100];
  L.CURR = [44, 30, 16, 6]; // ring radii: 12-foot, 8-foot, 4-foot, button
  // distance from the centre (ring units) for a line that stops in the house
  L.curlD = function (i) { return i === 2 ? 32 + Math.random() * 9 : i === 3 ? 18 + Math.random() * 9 : i === 4 ? 8 + Math.random() * 5 : i === 5 || i === 6 ? 1.5 + Math.random() * 3 : 0; };
  L.curlRing = function (d) { return d > 44 ? -1 : d > 30 ? 2 : d > 16 ? 3 : d > 6 ? 4 : d > 0.6 ? 5 : 7; };
})(window.D6 = window.D6 || {});
(function (D6) {
  'use strict';
  /* ---- small kit shared by the instant games (same as js/games/casa2.js; copied in casc2.js and casc3.js: one file is loaded per game) ---- */
  if (!D6.CasinoKit) return; // (node tests load only the logic above)
  var K = D6.CasinoKit, $ = K.$, L = D6.CascLogic;
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
    drop: { en: 'Drop', fr: 'Larguer', es: 'Soltar', pt: 'Soltar', ar: 'أسقِط', tr: 'Bırak', vi: 'Thả', id: 'Jatuhkan', ru: 'Сбросить', de: 'Abwerfen', hi: 'गिराएं', zh: '投放' },
    draw: { en: 'Draw', fr: 'Piocher', es: 'Robar', pt: 'Comprar', ar: 'اسحب', tr: 'Çek', vi: 'Bốc', id: 'Ambil', ru: 'Взять', de: 'Ziehen', hi: 'निकालें', zh: '摸牌' },
    fight: { en: 'Fight', fr: 'Combattre', es: 'Pelear', pt: 'Lutar', ar: 'قاتل', tr: 'Dövüş', vi: 'Đấu', id: 'Bertarung', ru: 'В бой', de: 'Kämpfen', hi: 'लड़ें', zh: '开打' },
    release: { en: 'Release', fr: 'Lâcher', es: 'Soltar', pt: 'Soltar', ar: 'أطلق', tr: 'Bırak', vi: 'Thả', id: 'Lepas', ru: 'Запустить', de: 'Loslassen', hi: 'छोड़ें', zh: '放飞' },
    start: { en: 'Start', fr: 'Lancer', es: 'Empezar', pt: 'Começar', ar: 'ابدأ', tr: 'Başla', vi: 'Bắt đầu', id: 'Mulai', ru: 'Старт', de: 'Start', hi: 'शुरू', zh: '开始' },
    slide: { en: 'Slide', fr: 'Glisser', es: 'Deslizar', pt: 'Deslizar', ar: 'أزلق', tr: 'Kaydır', vi: 'Trượt', id: 'Luncurkan', ru: 'Пустить', de: 'Schieben', hi: 'सरकाएं', zh: '推壶' }
  };
  var STAR = function (r, f) { var d = ''; for (var j = 0; j < 10; j++) { var a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? r * 0.45 : r; d += (j ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1); } return '<path d="' + d + 'z" fill="' + f + '"/>'; };
  var GOLDG = '<linearGradient id="cyGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".5" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient>';
  function burst(c, x, y, col) { // a few sparks (wins)
    if (c.demo && Math.random() < 0.5) return Promise.resolve();
    var g = c.id('cyFx'); if (!g) return Promise.resolve();
    g.innerHTML = Array.apply(null, Array(10)).map(function (_, j) { return '<g transform="translate(' + x + ' ' + y + ')">' + STAR(4, j % 2 ? '#FDE68A' : (col || '#fff')) + '</g>'; }).join('');
    var e = [].slice.call(g.children), A = e.map(function (_, j) { return j / e.length * Math.PI * 2 + Math.random() * 0.4; });
    return tw(c.box, 650, function (k) { e.forEach(function (el, j) { tr(el, x + Math.cos(A[j]) * 46 * ease(k), y + Math.sin(A[j]) * 40 * ease(k) + k * k * 12, 1.2 - k * 0.8, k * 200); el.setAttribute('opacity', (1 - k).toFixed(2)); }); }).then(function () { g.innerHTML = ''; });
  }

  function sxf(el, x, y, sx, sy, r) { if (el) el.setAttribute('transform', 'translate(' + (+x).toFixed(1) + ' ' + (+y).toFixed(1) + ')' + (r ? ' rotate(' + (+r).toFixed(1) + ')' : '') + ' scale(' + (+sx).toFixed(3) + ' ' + (+(sy == null ? sx : sy)).toFixed(3) + ')'); }
  function num(t, s, col) { return '<text y="' + (s * 0.36).toFixed(1) + '" text-anchor="middle" font-size="' + s + '" font-weight="900" fill="' + (col || '#fff') + '" font-family="var(--cg-font),Arial">' + t + '</text>'; }
  function el(tag, at) { var e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (var k in at) e.setAttribute(k, at[k]); return e; }

  /* =============================== CARGO DROP =============================== */
  // 3 landing pads: big 50 % · medium 30 % · small 20 % → ×1.88 · ×3.13 · ×4.69 (server)
  var CD = L.picks.cargodrop, CDC = ['#22C55E', '#38BDF8', '#F472B6'], PAD = [[70, 214, 46], [180, 206, 32], [258, 220, 21]];
  function pad(j) {
    var p = PAD[j], rx = p[2], ry = rx * 0.32;
    return '<g class="cd-p" id="cdP' + j + '" data-o="' + j + '" transform="translate(' + p[0] + ' ' + p[1] + ')"><ellipse rx="' + (rx + 4) + '" ry="' + (ry + 3) + '" fill="#000" opacity=".25" cy="3"/>' +
      '<ellipse rx="' + rx + '" ry="' + ry + '" fill="#94A3B8" stroke="#334155" stroke-width="2"/><ellipse rx="' + (rx * 0.82) + '" ry="' + (ry * 0.82) + '" fill="#CBD5E1"/>' +
      '<ellipse class="cd-ring" rx="' + (rx * 0.82) + '" ry="' + (ry * 0.82) + '" fill="none" stroke="' + CDC[j] + '" stroke-width="3" stroke-dasharray="6 5"/>' +
      '<text y="' + (ry * 0.45).toFixed(1) + '" text-anchor="middle" font-size="' + Math.round(ry * 1.3) + '" font-weight="900" fill="' + CDC[j] + '" font-family="var(--cg-font),Arial">' + (j + 1) + '</text>' +
      [-1, 1].map(function (s) { return '<circle class="cd-l" cx="' + (s * rx * 0.96).toFixed(1) + '" cy="0" r="3" fill="' + CDC[j] + '"/>'; }).join('') +
      '<ellipse class="cd-sel" rx="' + (rx + 9) + '" ry="' + (ry + 6) + '" fill="none" stroke="#FDE68A" stroke-width="2.4" opacity="0"/></g>';
  }
  game({
    key: 'cargodrop', verb: V.drop, pick: 3,
    pickW: function () { var x = Math.random(); return x < 0.5 ? 0 : x < 0.8 ? 1 : 2; },
    opts: function () { return '<div class="cg-opts cy-opts">' + CD.map(function (p, j) { return '<button type="button" data-o="' + j + '"><b class="fit"><i style="background:' + CDC[j] + '">' + (j + 1) + '</i> ' + Math.round(p * 100) + '%</b><small class="fit">' + xm(pmult(p)) + '</small></button>'; }).join('') + '</div>'; },
    scene: '<defs>' + GOLDG + '<linearGradient id="cdSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E1B4B"/><stop offset=".55" stop-color="#6D28D9"/><stop offset="1" stop-color="#F472B6"/></linearGradient>' +
      '<linearGradient id="cdGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C2410C"/><stop offset="1" stop-color="#7C2D12"/></linearGradient>' +
      '<radialGradient id="cdPlanet" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#FDE68A"/><stop offset=".6" stop-color="#F59E0B"/><stop offset="1" stop-color="#9A3412"/></radialGradient>' +
      '<linearGradient id="cdChute" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EF4444"/><stop offset=".5" stop-color="#FCA5A5"/><stop offset="1" stop-color="#EF4444"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#cdSky)"/>' + [[22, 20], [60, 64], [110, 14], [196, 70], [282, 96], [12, 120], [240, 24], [140, 100]].map(function (p, j) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (j % 3 ? 1 : 1.6) + '" fill="#fff" opacity=".8"/>'; }).join('') +
      '<g transform="translate(246 70)"><circle r="26" fill="url(#cdPlanet)"/><ellipse rx="44" ry="9" fill="none" stroke="#FDE68A" stroke-width="3" opacity=".8" transform="rotate(-18)"/></g>' +
      '<path d="M-400 190Q-10 168 60 182T180 176T320 186L700 190V700H-400z" fill="#9A3412" opacity=".8"/><path d="M-400 200Q20 186 110 196T250 192T700 200V700H-400z" fill="url(#cdGround)"/>' +
      '<g fill="#7C2D12">' + [[24, 236, 9], [122, 238, 6], [214, 240, 7], [290, 232, 5]].map(function (q) { return '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="' + q[2] + '" ry="' + (q[2] * 0.35) + '"/>'; }).join('') + '</g>' +
      // the astronaut (white suit, gold visor) waving next to pad 1
      '<g transform="translate(130 196) scale(.8)"><rect x="-7" y="-12" width="5" height="12" rx="2" fill="#E2E8F0"/><rect x="2" y="-12" width="5" height="12" rx="2" fill="#E2E8F0"/><rect x="-10" y="-34" width="20" height="24" rx="7" fill="#F8FAFC" stroke="#94A3B8"/>' +
      '<rect x="-15" y="-32" width="6" height="16" rx="3" fill="#CBD5E1"/><g class="cd-wave"><rect x="9" y="-50" width="6" height="18" rx="3" fill="#F8FAFC" stroke="#94A3B8"/></g><circle cy="-42" r="11" fill="#F8FAFC" stroke="#94A3B8"/><rect x="-7.5" y="-47" width="15" height="10" rx="5" fill="url(#cyGold)"/><circle cx="-5" cy="-29" r="2" fill="#EF4444"/></g>' +
      [0, 1, 2].map(pad).join('') +
      '<g transform="translate(150 22)"><ellipse rx="44" ry="11" fill="#CBD5E1" stroke="#475569" stroke-width="1.6"/><path d="M-22-4a22 15 0 0 1 44 0z" fill="#67E8F9" opacity=".85"/>' + [-30, -15, 0, 15, 30].map(function (x) { return '<circle class="cd-l" cx="' + x + '" cy="4" r="2.6" fill="#FDE047"/>'; }).join('') + '</g>' +
      '<g id="cdCap"><g id="cdCh" opacity="0"><path d="M-24-34a24 18 0 0 1 48 0q-6-4-12 0-6-4-12 0-6-4-12 0-6-4-12 0z" fill="url(#cdChute)" stroke="#991B1B" stroke-width="1.2"/><path d="M-24-34L-8-6M24-34L8-6M-6-36L-3-6M6-36L3-6" stroke="#E2E8F0" stroke-width=".9"/></g>' +
      '<path d="M-10-6h20l4 16h-28z" fill="#F1F5F9" stroke="#475569" stroke-width="1.4"/><circle cy="2" r="4" fill="#38BDF8" stroke="#1E3A8A"/><path d="M-14 10h28l-3 5h-22z" fill="#F97316"/><rect x="-4" y="-10" width="8" height="4" rx="1" fill="#475569"/></g>' +
      '<g id="cdDust"></g><g id="cyFx"></g>',
    onSel: function (c, j) { c.qa('.cd-p').forEach(function (e, q) { e.querySelector('.cd-sel').setAttribute('opacity', q === j ? '1' : '0'); }); },
    init: function (c) {
      c.qa('.cd-p').forEach(function (e) { e.addEventListener('click', function () { if (c.box.classList.contains('cy-busy') || c.demo) return; c.pickOpt(+e.getAttribute('data-o')); }); });
      c.home = function () { tr(c.id('cdCap'), 150, 34, 0.7); c.id('cdCh').setAttribute('opacity', '0'); c.id('cdDust').innerHTML = ''; c.qa('.cd-p').forEach(function (e) { e.classList.remove('got'); }); };
      c.home();
    },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var w = +r.view.w, P = PAD[w], cap = c.id('cdCap'), ch = c.id('cdCh'), ty = P[1] - 14, tx = P[0];
      c.sfx('launch');
      await tw(c.box, 500, function (k) { tr(cap, 150, 34 + k * 30, 0.7 + k * 0.3); });
      ch.setAttribute('opacity', '1'); c.sfx('go');
      var sw = (Math.random() < 0.5 ? -1 : 1) * (40 + rnd(30)), last = -1;
      await tw(c.box, 2600, function (k) {
        var e = 1 - Math.pow(1 - k, 1.6), x = lerp(150, tx, e) + sw * Math.sin(k * Math.PI * 2.4) * (1 - k), y = lerp(64, ty, k);
        tr(cap, x, y, 1, Math.cos(k * Math.PI * 2.4) * 12 * (1 - k)); ch.setAttribute('transform', 'scale(' + Math.min(1, 0.4 + k * 4).toFixed(2) + ')');
        var q = Math.floor(k * 6); if (q !== last) { last = q; c.sfx('tick'); }
      });
      c.sfx('stop');
      var D = c.id('cdDust'); D.innerHTML = [0, 1, 2, 3, 4, 5].map(function () { return '<circle r="5" fill="#FDBA74"/>'; }).join('');
      var E = [].slice.call(D.children);
      await tw(c.box, 500, function (k) { ch.setAttribute('opacity', (1 - k).toFixed(2)); E.forEach(function (e, j) { tr(e, tx + (j - 2.5) * 10 * (0.4 + k), ty + 12 - k * 8, 0.6 + k); e.setAttribute('opacity', (0.8 * (1 - k)).toFixed(2)); }); });
      D.innerHTML = '';
      c.id('cdP' + w).classList.add('got');
      if (w === +r.view.pick) { c.sfx('reveal'); await burst(c, tx, ty - 10); } else await wait(c.box, 300);
    },
    rules: rules({
      en: '1. Pick the landing pad where you think the cargo capsule lands (its chance and payout are on its button), set your stake and tap “Drop”.\n2. The capsule falls under its parachute and the wind pushes it around.\n3. Right pad: big 50 % ×1.88 · medium 30 % ×3.13 · small 20 % ×4.69. Another pad: the stake is lost.',
      fr: '1. Choisis la piste où la capsule va se poser (sa chance et son gain sont sur son bouton), ta mise, puis touche « Larguer ».\n2. La capsule descend sous son parachute et le vent la pousse.\n3. Bonne piste : grande 50 % ×1.88 · moyenne 30 % ×3.13 · petite 20 % ×4.69. Une autre piste : la mise est perdue.',
      es: '1. Elige la plataforma donde crees que aterriza la cápsula (su probabilidad y pago están en su botón), tu apuesta, y toca «Soltar».\n2. La cápsula baja con su paracaídas y el viento la empuja.\n3. Plataforma correcta: grande 50 % ×1.88 · mediana 30 % ×3.13 · pequeña 20 % ×4.69. Otra: pierdes la apuesta.',
      pt: '1. Escolha a plataforma onde acha que a cápsula pousa (a chance e o pagamento estão no botão), o valor, e toque em «Soltar».\n2. A cápsula desce de paraquedas e o vento a empurra.\n3. Plataforma certa: grande 50 % ×1.88 · média 30 % ×3.13 · pequena 20 % ×4.69. Outra: a aposta é perdida.',
      ar: '1. اختر منصة الهبوط التي تظن أن الكبسولة ستهبط عليها (فرصتها وربحها على زرها)، ثم رهانك والمس «أسقِط».\n2. تهبط الكبسولة بمظلتها والرياح تدفعها.\n3. المنصة الصحيحة: كبيرة 50 % ×1.88 · متوسطة 30 % ×3.13 · صغيرة 20 % ×4.69. منصة أخرى: تخسر الرهان.',
      tr: '1. Kargo kapsülünün ineceğini düşündüğün pisti seç (şansı ve ödemesi düğmesinde), bahsini belirle ve “Bırak”a dokun.\n2. Kapsül paraşütüyle iner, rüzgâr onu savurur.\n3. Doğru pist: büyük %50 ×1.88 · orta %30 ×3.13 · küçük %20 ×4.69. Başka pist: bahis kaybedilir.',
      vi: '1. Chọn bãi đáp bạn nghĩ khoang hàng sẽ đáp xuống (cơ hội và tiền thưởng ghi trên nút), chọn mức cược rồi chạm «Thả».\n2. Khoang hàng rơi bằng dù và bị gió đẩy qua lại.\n3. Đúng bãi: lớn 50 % ×1.88 · vừa 30 % ×3.13 · nhỏ 20 % ×4.69. Bãi khác: mất tiền cược.',
      id: '1. Pilih landasan tempat kapsul kargo mendarat menurutmu (peluang dan bayarannya ada di tombolnya), atur taruhan, lalu sentuh «Jatuhkan».\n2. Kapsul turun dengan parasut dan didorong angin.\n3. Landasan benar: besar 50 % ×1.88 · sedang 30 % ×3.13 · kecil 20 % ×4.69. Landasan lain: taruhan hilang.',
      ru: '1. Выберите площадку, на которую, по-вашему, сядет капсула (шанс и выплата на её кнопке), ставку и нажмите «Сбросить».\n2. Капсула спускается на парашюте, её сносит ветром.\n3. Верная площадка: большая 50 % ×1.88 · средняя 30 % ×3.13 · малая 20 % ×4.69. Другая — ставка проиграна.',
      de: '1. Wähle die Landeplattform, auf der die Frachtkapsel landet (Chance und Gewinn stehen auf ihrem Knopf), deinen Einsatz und tippe auf „Abwerfen“.\n2. Die Kapsel sinkt am Fallschirm, der Wind treibt sie hin und her.\n3. Richtige Plattform: groß 50 % ×1.88 · mittel 30 % ×3.13 · klein 20 % ×4.69. Andere Plattform: Einsatz verloren.',
      hi: '1. वह लैंडिंग पैड चुनें जहां कार्गो कैप्सूल उतरेगा (उसका मौका और भुगतान बटन पर है), राशि चुनें और «गिराएं» छुएं।\n2. कैप्सूल पैराशूट से उतरता है और हवा उसे इधर-उधर धकेलती है।\n3. सही पैड: बड़ा 50 % ×1.88 · मध्यम 30 % ×3.13 · छोटा 20 % ×4.69. दूसरा पैड: राशि हार जाते हैं।',
      zh: '1. 选择你认为货运舱会降落的平台（概率和赔率写在按钮上），设定金额并点击“投放”。\n2. 货运舱挂着降落伞下降，被风吹来吹去。\n3. 选对平台：大 50 % ×1.88 · 中 30 % ×3.13 · 小 20 % ×4.69。其他平台：输掉下注。'
    })
  });

  /* =============================== MAHJONG DRAW =============================== */
  // 3 tiles: nothing · pair ×2.7 · chow (3 bamboo in a row) ×10.4 · pung ×50 · dragon pung ×100
  var MJ = L.rows.mahjong, MJX = [82, 150, 218], MJY = 150;
  function stick(x, y, red) { return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><rect x="-2.6" y="-7.5" width="5.2" height="15" rx="2.4" fill="' + (red ? '#DC2626' : '#16A34A') + '"/><path d="M-2.6 0h5.2" stroke="#fff" stroke-opacity=".7" stroke-width="1"/></g>'; }
  function mjFace(k) {
    var o = '<rect x="-26" y="-34" width="52" height="68" rx="7" fill="#FFFBF0" stroke="#D6D3D1" stroke-width="1.4"/>';
    if (k === 9) return o + '<text y="13" text-anchor="middle" font-size="36" font-weight="900" fill="#DC2626" font-family="serif">中</text>';
    if (k === 10) return o + '<text y="13" text-anchor="middle" font-size="34" font-weight="900" fill="#15803D" font-family="serif">發</text>';
    if (k === 11) return o + '<rect x="-15" y="-21" width="30" height="42" rx="3" fill="none" stroke="#2563EB" stroke-width="4"/><rect x="-9" y="-15" width="18" height="30" rx="2" fill="none" stroke="#2563EB" stroke-width="1.6"/>';
    var n = k + 1, cols = n === 4 ? 2 : Math.min(3, n), rows = Math.ceil(n / cols), s = '';
    for (var q = 0; q < n; q++) { var cc = q % cols, rr = Math.floor(q / cols), inRow = Math.min(cols, n - rr * cols); s += stick((cc - (inRow - 1) / 2) * 12, 4 + (rr - (rows - 1) / 2) * 18, n >= 5 && q === Math.floor(n / 2)); }
    if (n === 1) s = '<g transform="translate(0 4) scale(1.8)">' + stick(0, 0, 0) + '</g>';
    return o + s + '<text x="-20" y="-22" font-size="10" font-weight="900" fill="#166534" font-family="var(--cg-font),Arial">' + n + '</text>';
  }
  var MJBACK = '<rect x="-26" y="-34" width="52" height="68" rx="7" fill="#15803D" stroke="#14532D" stroke-width="1.4"/><rect x="-21" y="-29" width="42" height="58" rx="5" fill="none" stroke="#86EFAC" stroke-opacity=".5"/><circle r="9" fill="none" stroke="#BBF7D0" stroke-opacity=".6" stroke-width="2"/>';
  function mjIcon(kinds) { return kinds.map(function (k, j) { return '<g transform="translate(' + ((j - (kinds.length - 1) / 2) * 7.6) + ' 0) scale(.15)">' + mjFace(k) + '</g>'; }).join(''); }
  game({
    key: 'mahjong', verb: V.draw, rows: MJ,
    chips: [[mjIcon([4, 4]), MJ[1]], [mjIcon([2, 3, 4]), MJ[2]], [mjIcon([6, 6, 6]), MJ[3]], [mjIcon([9, 9, 9]), MJ[4]]],
    chipOf: function (i) { return i - 1; },
    scene: '<defs>' + GOLDG + '<radialGradient id="mjFelt" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#15803D"/><stop offset=".75" stop-color="#14532D"/><stop offset="1" stop-color="#052E16"/></radialGradient>' +
      '<linearGradient id="mjWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B45309"/><stop offset="1" stop-color="#78350F"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#052E16"/><rect x="-60" y="-60" width="420" height="370" fill="url(#mjFelt)"/><rect x="10" y="8" width="280" height="234" rx="18" fill="none" stroke="#FBBF24" stroke-opacity=".35" stroke-width="2"/>' +
      '<g opacity=".18" fill="none" stroke="#BBF7D0" stroke-width="1.4"><circle cx="150" cy="150" r="70"/><circle cx="150" cy="150" r="56"/></g>' +
      '<g id="mjWall">' + [0, 1].map(function (row) { var o = ''; for (var q = 0; q < 12; q++) o += '<g transform="translate(' + (40 + q * 20 + row * 0) + ' ' + (44 - row * 6) + ') scale(.34)"><rect x="-26" y="-34" width="52" height="68" rx="7" fill="#FFFBF0" stroke="#D6D3D1"/><rect x="-26" y="-34" width="52" height="58" rx="7" fill="#15803D" stroke="#14532D"/></g>'; return o; }).join('') + '</g>' +
      MJX.map(function (x, j) { return '<rect x="' + (x - 29) + '" y="' + (MJY - 37) + '" width="58" height="74" rx="9" fill="#052E16" opacity=".5"/><g class="mj-t" id="mjT' + j + '" opacity="0"><g class="mj-in"></g></g>'; }).join('') +
      '<g id="cyFx"></g>',
    init: function (c) {
      c.home = function () { c.qa('.mj-t').forEach(function (e) { e.setAttribute('opacity', '0'); e.classList.remove('hit', 'dim'); }); };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, H = L.mahjong(i), T = c.qa('.mj-t');
      for (var j = 0; j < 3; j++) {
        var t = T[j], inn = t.querySelector('.mj-in'), sx = 50 + rnd(200), x = MJX[j];
        inn.innerHTML = MJBACK; t.setAttribute('opacity', '1'); c.sfx('card');
        await tw(c.box, 380, function (k) { var e = ease(k); tr(t, lerp(sx, x, e), lerp(42, MJY, e), 0.34 + e * 0.66, (1 - e) * 30); });
      }
      for (j = 0; j < 3; j++) {
        var t2 = T[j], in2 = t2.querySelector('.mj-in'), sw = false, x2 = MJX[j];
        c.sfx('stop');
        await tw(c.box, 380, function (k) { if (k >= 0.5 && !sw) { sw = true; in2.innerHTML = mjFace(H[j]); } sxf(t2, x2, MJY - Math.sin(k * Math.PI) * 10, Math.max(0.02, Math.abs(Math.cos(k * Math.PI))), 1); });
        tr(t2, x2, MJY);
      }
      if (i > 0) {
        var cnt = {}; H.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
        T.forEach(function (t3, q) { var hit = i === 1 ? cnt[H[q]] === 2 : true; t3.classList.add(hit ? 'hit' : 'dim'); });
        c.sfx('reveal');
        if (i >= 2) await burst(c, 150, MJY); else await wait(c.box, 300);
      } else { T.forEach(function (t3) { t3.classList.add('dim'); }); await wait(c.box, 200); }
    },
    rules: rules({
      en: '1. Set your stake and tap “Draw”: 3 tiles are drawn from 48 (bamboo 1 to 9 and the 3 dragons, 4 of each).\n2. Pair (2 identical tiles) ×2.7 · chow (3 bamboo in a row, like 4-5-6) ×10.4 · pung (3 identical bamboo) ×50 · dragon pung (3 identical dragons) ×100.\n3. Nothing: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Piocher » : 3 tuiles sont tirées parmi 48 (bambous 1 à 9 et les 3 dragons, 4 de chaque).\n2. Paire (2 tuiles identiques) ×2.7 · chow (3 bambous qui se suivent, comme 4-5-6) ×10.4 · pung (3 bambous identiques) ×50 · pung de dragons ×100.\n3. Rien : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Robar»: se sacan 3 fichas de 48 (bambú 1 a 9 y los 3 dragones, 4 de cada).\n2. Pareja (2 fichas iguales) ×2.7 · chow (3 bambús seguidos, como 4-5-6) ×10.4 · pung (3 bambús iguales) ×50 · pung de dragones ×100.\n3. Nada: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Comprar»: 3 peças são tiradas de 48 (bambu 1 a 9 e os 3 dragões, 4 de cada).\n2. Par (2 peças iguais) ×2.7 · chow (3 bambus em sequência, como 4-5-6) ×10.4 · pung (3 bambus iguais) ×50 · pung de dragões ×100.\n3. Nada: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «اسحب»: تُسحب 3 قطع من 48 (خيزران من 1 إلى 9 والتنانين الثلاثة، 4 من كل منها).\n2. زوج (قطعتان متطابقتان) ×2.7 · تشاو (3 خيزران متتالية مثل 4-5-6) ×10.4 · بونغ (3 خيزران متطابقة) ×50 · بونغ التنانين ×100.\n3. لا شيء: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Çek”e dokun: 48 taştan 3 taş çekilir (bambu 1–9 ve 3 ejderha, her birinden 4).\n2. Çift (2 aynı taş) ×2.7 · chow (art arda 3 bambu, örn. 4-5-6) ×10.4 · pung (3 aynı bambu) ×50 · ejderha pung ×100.\n3. Hiçbiri: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Bốc»: bốc 3 quân trong 48 quân (Điều 1 đến 9 và 3 quân Rồng, mỗi loại 4 quân).\n2. Đôi (2 quân giống nhau) ×2.7 · sảnh (3 quân Điều liên tiếp, như 4-5-6) ×10.4 · bộ ba Điều ×50 · bộ ba Rồng ×100.\n3. Không có gì: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Ambil»: 3 ubin diambil dari 48 (bambu 1–9 dan 3 naga, masing-masing 4).\n2. Pasangan (2 ubin sama) ×2.7 · chow (3 bambu berurutan, seperti 4-5-6) ×10.4 · pung (3 bambu sama) ×50 · pung naga ×100.\n3. Tidak ada: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Взять»: из 48 костей (бамбук 1–9 и 3 дракона, по 4 каждой) берутся 3.\n2. Пара (2 одинаковые кости) ×2.7 · чоу (3 бамбука подряд, например 4-5-6) ×10.4 · панг (3 одинаковых бамбука) ×50 · панг драконов ×100.\n3. Ничего — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Ziehen“: 3 Steine werden aus 48 gezogen (Bambus 1–9 und die 3 Drachen, je 4).\n2. Paar (2 gleiche Steine) ×2.7 · Chow (3 Bambus in Folge, z. B. 4-5-6) ×10.4 · Pung (3 gleiche Bambus) ×50 · Drachen-Pung ×100.\n3. Nichts: Einsatz verloren.',
      hi: '1. राशि चुनें और «निकालें» छुएं: 48 टाइलों (बांस 1–9 और 3 ड्रैगन, हर एक की 4) में से 3 निकाली जाती हैं।\n2. जोड़ी (2 एक जैसी टाइलें) ×2.7 · चाउ (क्रम से 3 बांस, जैसे 4-5-6) ×10.4 · पुंग (3 एक जैसे बांस) ×50 · ड्रैगन पुंग ×100.\n3. कुछ नहीं: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“摸牌”：从 48 张牌（条子 1–9 和三种箭牌，各 4 张）中摸 3 张。\n2. 对子（2 张相同）×2.7 · 顺子（3 张连续条子，如 4-5-6）×10.4 · 刻子（3 张相同条子）×50 · 箭刻 ×100。\n3. 什么都没有：输掉下注。'
    })
  });

  /* =============================== ROBO BOXING =============================== */
  // 3 rounds, each robot hits with power 1–10; more rounds won than the rival ×1.72 · 3 rounds won (KO) ×2.4 · as many ×1 · fewer: lost
  var RB = L.rows.robobox, RBX = [96, 204];
  function robot(j) {
    var col = j ? ['#F87171', '#B91C1C', '#7F1D1D'] : ['#60A5FA', '#1D4ED8', '#1E3A8A'];
    return '<g id="rbR' + j + '" transform="translate(' + RBX[j] + ' 192)"><g transform="scale(' + (j ? -1 : 1) + ' 1)"><g class="rb-body">' +
      '<rect x="-13" y="-22" width="9" height="22" rx="3" fill="#64748B"/><rect x="4" y="-22" width="9" height="22" rx="3" fill="#475569"/><rect x="-16" y="-4" width="14" height="6" rx="2" fill="' + col[2] + '"/><rect x="2" y="-4" width="14" height="6" rx="2" fill="' + col[2] + '"/>' +
      '<g class="rb-back"><path d="M-8-56l-14 10" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/><circle cx="-23" cy="-45" r="8.5" fill="' + col[1] + '"/></g>' +
      '<rect x="-18" y="-64" width="36" height="44" rx="10" fill="' + col[0] + '" stroke="' + col[2] + '" stroke-width="2"/><rect x="-11" y="-52" width="22" height="16" rx="5" fill="#0F172A"/><circle class="rb-core" cy="-44" r="5" fill="#FDE047"/>' +
      '<rect x="-3" y="-72" width="6" height="9" fill="#64748B"/><rect x="-15" y="-96" width="30" height="25" rx="8" fill="' + col[0] + '" stroke="' + col[2] + '" stroke-width="2"/><rect x="-11" y="-90" width="22" height="11" rx="5" fill="#0F172A"/>' +
      '<circle class="rb-eye" cx="-4" cy="-84.5" r="2.6" fill="#22D3EE"/><circle class="rb-eye" cx="5" cy="-84.5" r="2.6" fill="#22D3EE"/><path d="M0-96v-8" stroke="#94A3B8" stroke-width="2"/><circle cy="-106" r="3.4" fill="#FDE047"/>' +
      '<g class="rb-arm"><path d="M10-56l14 6" stroke="#CBD5E1" stroke-width="6.5" stroke-linecap="round"/><circle cx="28" cy="-48" r="10" fill="' + col[1] + '" stroke="' + col[2] + '" stroke-width="1.6"/><path d="M22-52q6-3 11 1" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/></g>' +
      '</g></g></g>';
  }
  function meter(j) {
    var x0 = j ? 176 : 34;
    return '<g transform="translate(' + x0 + ' 14)"><rect width="90" height="12" rx="6" fill="#0F172A" stroke="#334155"/><rect id="rbM' + j + '" x="1.5" y="1.5" width="0" height="9" rx="4.5" fill="' + (j ? '#EF4444' : '#3B82F6') + '"/>' +
      '<text id="rbN' + j + '" x="45" y="36" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" stroke="#0F172A" stroke-width="4" paint-order="stroke" font-family="var(--cg-font),Arial"></text>' +
      [0, 1, 2].map(function (q) { return '<circle class="rb-d" id="rbD' + j + q + '" cx="' + (j ? 48 + q * 14 : q * 14 + 7) + '" cy="50" r="5" fill="#1E293B" stroke="#475569"/>'; }).join('') + '</g>';
  }
  game({
    key: 'robobox', verb: V.fight, rows: RB,
    chips: [[num('=', 16), 1], ['<g transform="scale(.9)"><circle cx="-4" cy="2" r="6" fill="#3B82F6"/><path d="M-1-2l6-6" stroke="#FDE047" stroke-width="2.4"/></g>', 1.72], [num('KO', 11, '#FDE68A'), 2.4]],
    chipOf: function (i) { return i >= 9 ? 2 : i >= 6 ? 1 : i >= 4 ? 0 : -1; },
    scene: '<defs>' + GOLDG + '<linearGradient id="rbBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020617"/><stop offset="1" stop-color="#1E1B4B"/></linearGradient>' +
      '<linearGradient id="rbSpot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="rbMat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#1E3A8A"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#rbBg)"/>' +
      '<g>' + (function () { var o = ''; for (var q = 0; q < 46; q++) { var x = (q * 37) % 330 - 15, y = 98 + (q % 4) * 9; o += '<circle cx="' + x + '" cy="' + y + '" r="' + (q % 5 ? 1.3 : 2) + '" fill="' + ['#FDE047', '#F472B6', '#60A5FA', '#fff'][q % 4] + '" opacity=".55"/>'; } return o; })() + '</g>' +
      '<path d="M40-10L70-10 130 196H-30z" fill="url(#rbSpot)"/><path d="M230-10L260-10 330 196H170z" fill="url(#rbSpot)"/>' +
      '<path d="M-400 186H700V700H-400z" fill="#0B1222"/><path d="M14 186H286L300 214H0z" fill="url(#rbMat)"/><path d="M0 214H300V232H0z" fill="#172554"/><text x="150" y="228" text-anchor="middle" font-size="10" font-weight="900" fill="#93C5FD" font-family="var(--cg-font),Arial" letter-spacing="3">ROBO</text>' +
      [26, 274].map(function (x, j) { return '<rect x="' + (x - 4) + '" y="104" width="8" height="86" rx="3" fill="' + (j ? '#DC2626' : '#2563EB') + '"/><rect x="' + (x - 6) + '" y="100" width="12" height="8" rx="2" fill="#E2E8F0"/>'; }).join('') +
      [122, 138, 154].map(function (y, j) { return '<path d="M26 ' + y + 'H274" stroke="' + ['#F87171', '#F8FAFC', '#60A5FA'][j] + '" stroke-width="3"/>'; }).join('') +
      robot(0) + robot(1) + meter(0) + meter(1) +
      '<text id="rbRd" x="150" y="30" text-anchor="middle" font-size="16" font-weight="900" fill="#FDE68A" font-family="var(--cg-font),Arial" dir="ltr">1/3</text>' +
      '<g id="rbClash" opacity="0" transform="translate(150 140)">' + STAR(16, '#FDE047') + '<circle r="5" fill="#fff"/></g><g id="cyFx"></g>',
    init: function (c) {
      c.home = function () {
        [0, 1].forEach(function (j) { var R = c.id('rbR' + j); tr(R, RBX[j], 192); R.querySelector('.rb-arm').removeAttribute('transform'); c.id('rbM' + j).setAttribute('width', '0'); c.id('rbN' + j).textContent = ''; for (var q = 0; q < 3; q++) c.id('rbD' + j + q).setAttribute('fill', '#1E293B'); });
        c.id('rbRd').textContent = '1/3'; c.id('rbClash').setAttribute('opacity', '0');
      };
      c.punch = function (j, k) { c.id('rbR' + j).querySelector('.rb-arm').setAttribute('transform', 'translate(' + (Math.sin(k * Math.PI) * 26).toFixed(1) + ' 0)'); };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, R = L.robobox(i), R0 = c.id('rbR0'), R1 = c.id('rbR1'), score = [0, 0];
      for (var q = 0; q < 3; q++) {
        var p = R[q], last = -1;
        c.id('rbRd').textContent = (q + 1) + '/3'; c.sfx('launch');
        await tw(c.box, 650, function (k) {
          var e = ease(k);
          [0, 1].forEach(function (j) { var v = Math.max(1, Math.round(p[j] * e)); c.id('rbM' + j).setAttribute('width', (v * 8.7).toFixed(1)); c.id('rbN' + j).textContent = v; });
          var t = Math.floor(k * 5); if (t !== last) { last = t; c.sfx('tick'); }
        });
        var win = p[0] > p[1] ? 0 : p[0] < p[1] ? 1 : -1;
        c.sfx('act');
        if (win >= 0) {
          var hit = win ? R0 : R1, hx = RBX[1 - win], dir = win ? -1 : 1;
          await tw(c.box, 420, function (k) { c.punch(win, k); var s = Math.sin(Math.min(1, k * 1.4) * Math.PI); tr(hit, hx + dir * 10 * s, 192, 1, dir * 8 * s); });
          score[win]++;
          c.id('rbD' + win + q).setAttribute('fill', '#22C55E'); c.id('rbD' + (1 - win) + q).setAttribute('fill', '#EF4444');
          c.sfx(win ? 'stop' : 'step');
        } else {
          var cl = c.id('rbClash');
          await tw(c.box, 420, function (k) { c.punch(0, k); c.punch(1, k); cl.setAttribute('opacity', Math.sin(k * Math.PI).toFixed(2)); tr(cl, 150, 140, 0.6 + k * 0.6, k * 90); });
          c.id('rbD0' + q).setAttribute('fill', '#FACC15'); c.id('rbD1' + q).setAttribute('fill', '#FACC15');
        }
        await wait(c.box, 260);
      }
      var pay = L.roboPay(R);
      if (pay === 2.4) { // KO: the red robot falls
        c.sfx('reveal');
        await tw(c.box, 700, function (k) { var e = ease(k); R1.setAttribute('transform', 'translate(' + (RBX[1] + e * 26) + ' 192) rotate(' + (e * 84) + ')'); });
        await burst(c, RBX[1] + 20, 150);
      } else if (pay > 0 || score[1] > score[0]) {
        var Wn = pay > 0 ? R0 : R1, wx = pay > 0 ? RBX[0] : RBX[1];
        if (pay > 1) c.sfx('reveal');
        await tw(c.box, 700, function (k) { tr(Wn, wx, 192 - Math.abs(Math.sin(k * Math.PI * 2)) * 16); });
      } else await tw(c.box, 500, function (k) { tr(R0, RBX[0], 192 - Math.abs(Math.sin(k * Math.PI * 2)) * 6); tr(R1, RBX[1], 192 - Math.abs(Math.sin(k * Math.PI * 2)) * 6); });
    },
    rules: rules({
      en: '1. Set your stake and tap “Fight”: your blue robot boxes the red robot over 3 rounds.\n2. Each round, both robots get a power from 1 to 10: the higher one wins the round (equal = even round).\n3. More rounds won than the red robot ×1.72 · all 3 rounds won (KO) ×2.4 · as many rounds won ×1 (stake back). Fewer rounds won: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Combattre » : ton robot bleu boxe le robot rouge en 3 rounds.\n2. À chaque round, chaque robot reçoit une puissance de 1 à 10 : le plus fort gagne le round (égalité = round nul).\n3. Plus de rounds gagnés que le robot rouge ×1.72 · les 3 rounds gagnés (KO) ×2.4 · autant de rounds ×1 (mise rendue). Moins de rounds : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Pelear»: tu robot azul boxea contra el robot rojo en 3 asaltos.\n2. En cada asalto, cada robot recibe una potencia de 1 a 10: el más fuerte gana el asalto (igual = asalto nulo).\n3. Más asaltos ganados que el robot rojo ×1.72 · los 3 asaltos (KO) ×2.4 · los mismos asaltos ×1 (recuperas la apuesta). Menos: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Lutar»: seu robô azul luta boxe com o robô vermelho em 3 rounds.\n2. Em cada round, cada robô recebe uma força de 1 a 10: o mais forte vence o round (igual = round empatado).\n3. Mais rounds vencidos que o robô vermelho ×1.72 · os 3 rounds (nocaute) ×2.4 · mesmo número de rounds ×1 (aposta devolvida). Menos: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «قاتل»: يلاكم روبوتك الأزرق الروبوت الأحمر في 3 جولات.\n2. في كل جولة يحصل كل روبوت على قوة من 1 إلى 10: الأقوى يفوز بالجولة (التساوي = جولة متعادلة).\n3. جولات فائزة أكثر من الروبوت الأحمر ×1.72 · الفوز بالجولات الثلاث (ضربة قاضية) ×2.4 · عدد متساوٍ ×1 (يُعاد الرهان). أقل: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Dövüş”e dokun: mavi robotun kırmızı robotla 3 raunt boks yapar.\n2. Her rauntta iki robot da 1–10 arası güç alır: güçlü olan raundu kazanır (eşitlik = berabere raunt).\n3. Kırmızı robottan fazla raunt ×1.72 · 3 rauntun hepsi (nakavt) ×2.4 · eşit raunt ×1 (bahis iade). Daha az: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Đấu»: robot xanh của bạn đấu quyền anh với robot đỏ trong 3 hiệp.\n2. Mỗi hiệp, mỗi robot nhận sức mạnh từ 1 đến 10: robot mạnh hơn thắng hiệp (bằng nhau = hòa hiệp).\n3. Thắng nhiều hiệp hơn robot đỏ ×1.72 · thắng cả 3 hiệp (KO) ×2.4 · số hiệp bằng nhau ×1 (hoàn cược). Ít hơn: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Bertarung»: robot birumu bertinju melawan robot merah selama 3 ronde.\n2. Tiap ronde, kedua robot mendapat kekuatan 1–10: yang lebih kuat memenangkan ronde (sama = ronde seri).\n3. Menang lebih banyak ronde dari robot merah ×1.72 · menang 3 ronde (KO) ×2.4 · jumlah ronde sama ×1 (taruhan kembali). Lebih sedikit: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «В бой»: ваш синий робот боксирует с красным 3 раунда.\n2. В каждом раунде оба робота получают силу от 1 до 10: сильнейший выигрывает раунд (поровну — ничья в раунде).\n3. Больше выигранных раундов, чем у красного, ×1.72 · все 3 раунда (нокаут) ×2.4 · поровну ×1 (ставка возвращается). Меньше — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Kämpfen“: dein blauer Roboter boxt 3 Runden gegen den roten.\n2. In jeder Runde erhält jeder Roboter eine Kraft von 1 bis 10: der stärkere gewinnt die Runde (gleich = Runde unentschieden).\n3. Mehr Runden gewonnen als der rote Roboter ×1.72 · alle 3 Runden (K.o.) ×2.4 · gleich viele ×1 (Einsatz zurück). Weniger: Einsatz verloren.',
      hi: '1. राशि चुनें और «लड़ें» छुएं: आपका नीला रोबोट लाल रोबोट से 3 राउंड मुक्केबाज़ी करता है।\n2. हर राउंड में दोनों रोबोट को 1 से 10 तक की ताकत मिलती है: ज़्यादा ताकत वाला राउंड जीतता है (बराबर = राउंड ड्रॉ)।\n3. लाल रोबोट से ज़्यादा राउंड ×1.72 · तीनों राउंड (KO) ×2.4 · बराबर राउंड ×1 (राशि वापस). कम: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“开打”：你的蓝色机器人与红色机器人进行 3 回合拳击。\n2. 每回合两台机器人各获得 1–10 的力量值：力量高的赢下该回合（相同则平局）。\n3. 赢的回合比红色机器人多 ×1.72 · 3 回合全胜（KO）×2.4 · 回合数相同 ×1（退还下注）。较少：输掉下注。'
    })
  });

  /* =============================== LANTERN FESTIVAL =============================== */
  // 5 lanterns, line i = i golden ones: 0 lose · 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200
  var LN = L.rows.lantern, LNX = [50, 100, 150, 200, 250];
  function lantern(j) {
    return '<g class="ln-l" id="lnL' + j + '"><circle class="ln-halo" r="24" fill="url(#lnHalo)" opacity="0"/><path d="M-15-14q15-6 30 0l-4 25h-22z" fill="url(#lnRed)" stroke="#9A3412" stroke-width="1"/>' +
      '<path class="ln-gold" d="M-15-14q15-6 30 0l-4 25h-22z" fill="url(#cyGold)" stroke="#B45309" stroke-width="1" opacity="0"/><path d="M-5-16l1 27M5-16l-1 27" stroke="#7C2D12" stroke-opacity=".35"/><rect x="-11" y="10" width="22" height="2.6" rx="1.3" fill="#7C2D12"/>' +
      '<ellipse cy="12" rx="8" ry="2.4" fill="#FEF08A"/><ellipse cy="8" rx="4" ry="5.5" fill="#FFF7D6" opacity=".9"/></g>';
  }
  game({
    key: 'lantern', verb: V.release, rows: LN,
    chips: [1, 2, 3, 4, 5].map(function (j) { return ['<g transform="translate(-3 1) scale(.5)"><path d="M-15-14q15-6 30 0l-4 25h-22z" fill="url(#cyGold)" stroke="#B45309"/></g>' + num(j, 11, '#FDE68A').replace('<text', '<text x="7"'), LN[j]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs>' + GOLDG + '<linearGradient id="lnSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1026"/><stop offset=".6" stop-color="#312E81"/><stop offset="1" stop-color="#7C3AED"/></linearGradient>' +
      '<linearGradient id="lnRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FB923C"/><stop offset="1" stop-color="#DC2626"/></linearGradient>' +
      '<radialGradient id="lnHalo"><stop offset="0" stop-color="#FDE68A" stop-opacity=".9"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lnMoon"><stop offset="0" stop-color="#FEF9C3" stop-opacity=".6"/><stop offset="1" stop-color="#FEF9C3" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#lnSky)"/>' + (function () { var o = ''; for (var q = 0; q < 26; q++) o += '<circle cx="' + ((q * 53) % 300) + '" cy="' + ((q * 29) % 130) + '" r="' + (q % 4 ? 0.9 : 1.5) + '" fill="#fff" opacity=".75"/>'; return o; })() +
      '<circle cx="238" cy="46" r="48" fill="url(#lnMoon)"/><circle cx="238" cy="46" r="22" fill="#FEF9C3"/><circle cx="231" cy="40" r="4" fill="#FDE68A" opacity=".6"/><circle cx="244" cy="54" r="3" fill="#FDE68A" opacity=".6"/>' +
      '<path d="M-400 170L-20 170 30 140 70 158 110 132 160 160 200 146 250 164 300 150 700 170V700H-400z" fill="#1E1B4B"/>' +
      // pagoda on the left
      '<g fill="#0F0A2E" transform="translate(40 172)"><rect x="-10" y="-40" width="20" height="40"/><path d="M-26-40h52l-10-8h-32zM-20-62h40l-8-7h-24zM-14-80h28l-6-6h-16z"/><rect x="-7" y="-62" width="14" height="22"/><rect x="-4" y="-80" width="8" height="18"/><path d="M0-86v-8"/></g>' +
      '<rect x="-400" y="172" width="1100" height="400" fill="#1E1B4B"/><g stroke="#FDE68A" stroke-opacity=".3" stroke-width="1.4">' + [184, 200, 216, 232].map(function (y, q) { return '<path d="M' + (200 + q * 6) + ' ' + y + 'h' + (40 - q * 6) + 'M' + (30 + q * 40) + ' ' + (y + 6) + 'h18"/>'; }).join('') + '</g>' +
      // bridge
      '<path d="M-400 206H700V214H-400z" fill="#7C2D12"/><path d="M-400 192H700" stroke="#9A3412" stroke-width="3"/>' + [10, 50, 90, 130, 170, 210, 250, 290].map(function (x) { return '<rect x="' + (x - 2) + '" y="190" width="4" height="18" fill="#9A3412"/>'; }).join('') +
      LNX.map(function (x, j) { return lantern(j); }).join('') + '<g id="cyFx"></g>',
    init: function (c) {
      c.home = function () { c.qa('.ln-l').forEach(function (e, j) { tr(e, LNX[j], 178); e.querySelector('.ln-gold').setAttribute('opacity', '0'); e.querySelector('.ln-halo').setAttribute('opacity', '0'); e.setAttribute('opacity', '1'); }); };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, G = L.lantern(i), E = c.qa('.ln-l'), done = [0, 0, 0, 0, 0];
      var TY = E.map(function () { return 36 + rnd(70); }), DX = E.map(function () { return (Math.random() - 0.5) * 40; }), ORD = shuffle([0, 1, 2, 3, 4]);
      c.sfx('launch');
      await tw(c.box, 4200, function (k) {
        ORD.forEach(function (j, n) {
          var s = n * 0.13, kk = Math.max(0, Math.min(1, (k - s) / 0.46)), e = ease(kk);
          tr(E[j], LNX[j] + DX[j] * e + Math.sin(k * 14 + j) * 3 * kk, lerp(178, TY[j], e), 1 - e * 0.35);
          if (kk >= 0.55 && !done[j]) {
            done[j] = 1;
            if (G[j]) { E[j].querySelector('.ln-gold').setAttribute('opacity', '1'); E[j].querySelector('.ln-halo').setAttribute('opacity', '1'); c.sfx('step'); } else c.sfx('tick');
          }
        });
      });
      if (i >= 3) await burst(c, 150, 70); else await wait(c.box, 300);
    },
    rules: rules({
      en: '1. Set your stake and tap “Release”: 5 sky lanterns rise into the night.\n2. While rising, each lantern stays red or turns golden.\n3. Golden lanterns: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. None: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lâcher » : 5 lanternes s’envolent dans la nuit.\n2. En montant, chaque lanterne reste rouge ou devient dorée.\n3. Lanternes dorées : 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. Aucune : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Soltar»: 5 farolillos suben en la noche.\n2. Al subir, cada farolillo sigue rojo o se vuelve dorado.\n3. Farolillos dorados: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. Ninguno: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Soltar»: 5 lanternas sobem na noite.\n2. Ao subir, cada lanterna fica vermelha ou vira dourada.\n3. Lanternas douradas: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. Nenhuma: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «أطلق»: ترتفع 5 فوانيس في سماء الليل.\n2. أثناء صعودها يبقى كل فانوس أحمر أو يصبح ذهبيًا.\n3. الفوانيس الذهبية: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. لا شيء: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Bırak”a dokun: 5 dilek feneri geceye yükselir.\n2. Yükselirken her fener kırmızı kalır ya da altına döner.\n3. Altın fenerler: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. Hiç yoksa: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Thả»: 5 chiếc đèn trời bay lên trong đêm.\n2. Khi bay lên, mỗi chiếc đèn giữ màu đỏ hoặc hóa vàng.\n3. Đèn vàng: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. Không có: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lepas»: 5 lampion terbang naik di malam hari.\n2. Saat naik, setiap lampion tetap merah atau berubah emas.\n3. Lampion emas: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. Tidak ada: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Запустить»: 5 небесных фонариков поднимаются в ночное небо.\n2. Поднимаясь, каждый фонарик остаётся красным или становится золотым.\n3. Золотые фонарики: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. Ни одного — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Loslassen“: 5 Himmelslaternen steigen in die Nacht.\n2. Beim Aufsteigen bleibt jede Laterne rot oder wird golden.\n3. Goldene Laternen: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. Keine: Einsatz verloren.',
      hi: '1. राशि चुनें और «छोड़ें» छुएं: 5 आकाश लालटेन रात में ऊपर उठती हैं।\n2. उठते हुए हर लालटेन लाल रहती है या सुनहरी हो जाती है।\n3. सुनहरी लालटेन: 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. कोई नहीं: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“放飞”：5 盏孔明灯升上夜空。\n2. 升空时，每盏灯保持红色或变成金色。\n3. 金灯：1 盏 ×0.4 · 2 盏 ×1.6 · 3 盏 ×5 · 4 盏 ×20 · 5 盏 ×200。没有金灯：输掉下注。'
    })
  });

  /* =============================== METEOR SHOWER =============================== */
  // 3 meteors, each burns up or leaves a crystal: blue ×0.2 · purple ×0.8 · gold ×3.5 — the win is the total; 3 gold = ×200
  var MTX = [92, 166, 236], MTY = [206, 214, 204], MTC = [null, ['#7DD3FC', '#0369A1'], ['#D8B4FE', '#6B21A8'], ['url(#cyGold)', '#92400E']];
  function crystal(t, s) { var C = MTC[t]; return '<g transform="scale(' + (s || 1) + ')"><path d="M-9 0l-3-12 6-6 3 18zM-3 0l1-22 7 8-2 14zM5 0l4-14 5 6-3 8z" fill="' + C[0] + '" stroke="' + C[1] + '" stroke-width="1.2" stroke-linejoin="round"/><path d="M-1-18l1 14" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/></g>'; }
  game({
    key: 'meteor', verb: V.start, rows: L.rows.meteor,
    chips: [[crystal(1, 0.55), 0.2], [crystal(2, 0.55), 0.8], [crystal(3, 0.55), 3.5], ['<g transform="translate(-5 2)">' + crystal(3, 0.35) + '</g><g transform="translate(5 2)">' + crystal(3, 0.35) + '</g><g transform="translate(0 -3)">' + crystal(3, 0.4) + '</g>', 200]],
    chipOf: function (i) { var T = L.MET[i]; return T[0] === 3 ? 3 : T[2] - 1; },
    scene: '<defs>' + GOLDG + '<linearGradient id="mtSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020617"/><stop offset=".6" stop-color="#1E1B4B"/><stop offset="1" stop-color="#4C1D95"/></linearGradient>' +
      '<radialGradient id="mtNeb"><stop offset="0" stop-color="#F472B6" stop-opacity=".35"/><stop offset="1" stop-color="#F472B6" stop-opacity="0"/></radialGradient><radialGradient id="mtNeb2"><stop offset="0" stop-color="#22D3EE" stop-opacity=".25"/><stop offset="1" stop-color="#22D3EE" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mtTail" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#FDE68A"/><stop offset=".3" stop-color="#FB923C" stop-opacity=".8"/><stop offset="1" stop-color="#F43F5E" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="mtHead"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#FDE68A"/><stop offset="1" stop-color="#F97316"/></radialGradient>' +
      '<radialGradient id="mtBoom"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#FDBA74" stop-opacity=".8"/><stop offset="1" stop-color="#F97316" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#mtSky)"/><ellipse cx="80" cy="70" rx="110" ry="50" fill="url(#mtNeb)"/><ellipse cx="230" cy="110" rx="100" ry="40" fill="url(#mtNeb2)"/>' +
      (function () { var o = ''; for (var q = 0; q < 34; q++) o += '<circle class="' + (q % 6 ? '' : 'mt-tw') + '" cx="' + ((q * 71) % 310 - 5) + '" cy="' + ((q * 37) % 170) + '" r="' + (q % 5 ? 0.9 : 1.6) + '" fill="#fff" opacity=".8"/>'; return o; })() +
      '<path d="M-400 192Q-10 172 60 186T190 180T320 190L700 196V700H-400z" fill="#312E81"/><path d="M-400 202Q30 190 120 200T260 196T700 204V700H-400z" fill="#1E1B4B"/>' +
      '<g fill="#0F0A2E">' + [[20, 230, 10], [130, 236, 7], [206, 238, 8], [286, 228, 9]].map(function (q) { return '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="' + q[2] + '" ry="' + (q[2] * 0.4) + '"/>'; }).join('') + '</g>' +
      // little observatory
      '<g transform="translate(30 196)"><rect x="-16" y="-14" width="32" height="16" fill="#E2E8F0" stroke="#64748B"/><path d="M-18-14a18 16 0 0 1 36 0z" fill="#F8FAFC" stroke="#64748B"/><path d="M-2-29l6 14" stroke="#334155" stroke-width="4"/><path d="M2-26l14-12" stroke="#475569" stroke-width="5" stroke-linecap="round"/><rect x="-4" y="-8" width="8" height="10" fill="#1E3A8A"/></g>' +
      '<g id="mtCr"></g><g id="mtM" opacity="0"><path d="M0-4L-64-1-64 1 0 4z" fill="url(#mtTail)"/><circle r="6" fill="url(#mtHead)"/></g><circle id="mtB" r="30" fill="url(#mtBoom)" opacity="0"/><g id="mtSp"></g>' +
      '<text id="mtT" x="150" y="44" text-anchor="middle" font-size="30" font-weight="900" fill="#FDE68A" stroke="#1E1B4B" stroke-width="5" paint-order="stroke" font-family="var(--cg-font),Arial" dir="ltr" opacity="0"></text><g id="cyFx"></g>',
    init: function (c) {
      c.home = function () { c.id('mtCr').innerHTML = ''; c.id('mtSp').innerHTML = ''; c.id('mtM').setAttribute('opacity', '0'); c.id('mtB').setAttribute('opacity', '0'); c.id('mtT').setAttribute('opacity', '0'); };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, M = L.meteor(i), m = c.id('mtM'), B = c.id('mtB'), T = c.id('mtT'), tot = 0, cr = c.id('mtCr'), sp = c.id('mtSp');
      var order = shuffle([0, 1, 2]);
      T.textContent = xm(0); T.setAttribute('opacity', '1');
      for (var q = 0; q < 3; q++) {
        var t = M[q], slot = order[q], tx = MTX[slot], ty = MTY[slot], sx = tx + 150 + rnd(40), sy = -30, ang = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;
        var stop = t ? 1 : 0.5 + Math.random() * 0.15;
        m.setAttribute('opacity', '1'); c.sfx('launch');
        await tw(c.box, 750 * stop, function (k) { var kk = k * stop; tr(m, lerp(sx, tx, kk), lerp(sy, ty, kk), 1 + kk * 0.3, ang); });
        m.setAttribute('opacity', '0');
        var px = lerp(sx, tx, stop), py = lerp(sy, ty, stop);
        if (!t) { // burns up in the sky
          sp.innerHTML = [0, 1, 2, 3, 4, 5].map(function () { return '<circle r="1.8" fill="#FDBA74"/>'; }).join('');
          var E = [].slice.call(sp.children), A = E.map(function () { return Math.random() * Math.PI * 2; });
          c.sfx('tick');
          await tw(c.box, 450, function (k) { E.forEach(function (e, j) { tr(e, px + Math.cos(A[j]) * 18 * k, py + Math.sin(A[j]) * 18 * k + k * 10); e.setAttribute('opacity', (1 - k).toFixed(2)); }); });
          sp.innerHTML = '';
          continue;
        }
        c.sfx('stop');
        cr.appendChild(el('ellipse', { cx: tx, cy: ty + 4, rx: 15, ry: 4.4, fill: '#0F0A2E' }));
        var g = el('g', {}); g.innerHTML = crystal(t, 1); cr.appendChild(g);
        await tw(c.box, 420, function (k) { B.setAttribute('cx', tx); B.setAttribute('cy', ty); B.setAttribute('r', (8 + k * 34).toFixed(1)); B.setAttribute('opacity', (1 - k).toFixed(2)); tr(g, tx, ty + 3, ease(k)); });
        tot = Math.round((tot + L.METV[t]) * 100) / 100; T.textContent = xm(tot); c.sfx(t === 3 ? 'reveal' : 'step');
        await wait(c.box, 200);
      }
      if (L.MET[i][0] === 3) { T.textContent = xm(200); c.sfx('reveal'); }
      if (L.rows.meteor[i] >= 2) await burst(c, 150, 120);
    },
    rules: rules({
      en: '1. Set your stake and tap “Start”: 3 meteors fall from the sky.\n2. A meteor burns up, or it lands and leaves a crystal: blue ×0.2 · purple ×0.8 · gold ×3.5.\n3. You win the total of your crystals. 3 gold crystals ×200. No crystal: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : 3 météores tombent du ciel.\n2. Un météore brûle dans le ciel, ou il tombe et laisse un cristal : bleu ×0.2 · violet ×0.8 · or ×3.5.\n3. Tu gagnes le total de tes cristaux. 3 cristaux d’or ×200. Aucun cristal : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Empezar»: caen 3 meteoritos del cielo.\n2. Un meteorito se quema en el aire, o cae y deja un cristal: azul ×0.2 · morado ×0.8 · dorado ×3.5.\n3. Ganas el total de tus cristales. 3 cristales dorados ×200. Ningún cristal: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Começar»: 3 meteoros caem do céu.\n2. Um meteoro queima no ar, ou cai e deixa um cristal: azul ×0.2 · roxo ×0.8 · dourado ×3.5.\n3. Você ganha o total dos seus cristais. 3 cristais dourados ×200. Nenhum cristal: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «ابدأ»: تسقط 3 نيازك من السماء.\n2. يحترق النيزك في الجو، أو يسقط ويترك بلورة: زرقاء ×0.2 · بنفسجية ×0.8 · ذهبية ×3.5.\n3. تربح مجموع بلوراتك. 3 بلورات ذهبية ×200. لا بلورة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Başla”ya dokun: gökyüzünden 3 göktaşı düşer.\n2. Göktaşı havada yanar ya da yere düşüp bir kristal bırakır: mavi ×0.2 · mor ×0.8 · altın ×3.5.\n3. Kristallerinin toplamını kazanırsın. 3 altın kristal ×200. Kristal yoksa: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Bắt đầu»: 3 thiên thạch rơi từ trên trời.\n2. Thiên thạch cháy trên không, hoặc rơi xuống để lại một viên pha lê: xanh ×0.2 · tím ×0.8 · vàng ×3.5.\n3. Bạn nhận tổng giá trị pha lê. 3 viên vàng ×200. Không có pha lê: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Mulai»: 3 meteor jatuh dari langit.\n2. Meteor terbakar di udara, atau jatuh dan meninggalkan kristal: biru ×0.2 · ungu ×0.8 · emas ×3.5.\n3. Kamu menang total kristalmu. 3 kristal emas ×200. Tanpa kristal: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Старт»: с неба падают 3 метеорита.\n2. Метеорит сгорает в воздухе или падает и оставляет кристалл: синий ×0.2 · фиолетовый ×0.8 · золотой ×3.5.\n3. Выигрыш — сумма ваших кристаллов. 3 золотых кристалла ×200. Ни одного — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Start“: 3 Meteore fallen vom Himmel.\n2. Ein Meteor verglüht oder schlägt ein und hinterlässt einen Kristall: blau ×0.2 · lila ×0.8 · gold ×3.5.\n3. Du gewinnst die Summe deiner Kristalle. 3 goldene Kristalle ×200. Kein Kristall: Einsatz verloren.',
      hi: '1. राशि चुनें और «शुरू» छुएं: आसमान से 3 उल्का गिरते हैं।\n2. उल्का हवा में जल जाता है, या गिरकर एक क्रिस्टल छोड़ता है: नीला ×0.2 · बैंगनी ×0.8 · सुनहरा ×3.5.\n3. आप अपने क्रिस्टलों का कुल जीतते हैं। 3 सुनहरे क्रिस्टल ×200. कोई क्रिस्टल नहीं: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“开始”：3 颗流星从天而降。\n2. 流星在空中燃尽，或落地留下一颗水晶：蓝色 ×0.2 · 紫色 ×0.8 · 金色 ×3.5。\n3. 赢得所有水晶的总和。3 颗金水晶 ×200。没有水晶：输掉下注。'
    })
  });

  /* =============================== CURLING =============================== */
  // past the house · hits the guard (lose) · 12-foot ×0.5 · 8-foot ×1.2 · 4-foot ×2.5 · button ×6 · button + rival stone out ×25 · dead centre ×100
  var CU = L.rows.curling, HX = 150, HY = 64, HRY = 0.55;
  function cuS(y) { return 0.55 + 0.45 * Math.max(0, Math.min(1, y / 240)); }
  function stone(col) { return '<ellipse cy="3" rx="12" ry="6" fill="#000" opacity=".2"/><ellipse rx="12" ry="7.5" fill="#9CA3AF" stroke="#4B5563" stroke-width="1.2"/><ellipse cy="-2" rx="9" ry="5" fill="#D1D5DB"/><rect x="-6" y="-7" width="12" height="4" rx="2" fill="' + col + '"/><path d="M4-5v-4h4" stroke="' + col + '" stroke-width="2.4" fill="none"/>'; }
  function cuPos(d, a) { return [HX + d * Math.cos(a), HY + d * HRY * Math.sin(a)]; }
  game({
    key: 'curling', verb: V.slide, rows: CU,
    chips: ['<circle r="9" fill="#2563EB"/><circle r="6" fill="#fff"/>', '<circle r="9" fill="#fff" stroke="#2563EB" stroke-width="2"/><circle r="5.5" fill="#fff" stroke="#93C5FD"/>', '<circle r="9" fill="#DC2626"/><circle r="4" fill="#fff"/>',
      '<circle r="9" fill="#fff" stroke="#DC2626" stroke-width="2"/><circle r="4.5" fill="#DC2626"/>', '<circle cx="-3" r="5.6" fill="#9CA3AF" stroke="#4B5563"/><circle cx="6" cy="-4" r="4" fill="#FACC15" opacity=".7"/><path d="M8-8l4-3" stroke="#FDE68A" stroke-width="2"/>',
      '<circle r="9" fill="none" stroke="#FDE68A" stroke-width="2"/><circle r="4" fill="url(#cyGold)"/>'].map(function (s, j) { return [s, CU[j + 2]]; }),
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs>' + GOLDG + '<linearGradient id="cuIce" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E0F2FE"/><stop offset="1" stop-color="#F8FAFC"/></linearGradient>' +
      '<linearGradient id="cuBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0C4A6E"/><stop offset="1" stop-color="#082F49"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#cuBg)"/>' + (function () { var o = ''; for (var q = 0; q < 40; q++) o += '<circle cx="' + ((q * 41) % 320 - 10) + '" cy="' + (12 + (q % 5) * 10) + '" r="1.4" fill="' + ['#FDE047', '#F472B6', '#fff', '#7DD3FC'][q % 4] + '" opacity=".4"/>'; return o; })() +
      '<path d="M68-80H232L304 420H-4z" fill="#BAE6FD"/><path d="M75-80H225L294 420H6z" fill="url(#cuIce)"/><path d="M150 -80V420" stroke="#94A3B8" stroke-width=".8" stroke-dasharray="4 5"/><path d="M68 156H232" stroke="#DC2626" stroke-width="2.4" opacity=".7"/><path d="M100 22H200" stroke="#2563EB" stroke-width="1.2" opacity=".5"/>' +
      '<g transform="translate(' + HX + ' ' + HY + ')"><ellipse rx="44" ry="' + (44 * HRY) + '" fill="#2563EB"/><ellipse rx="30" ry="' + (30 * HRY) + '" fill="#fff"/><ellipse rx="16" ry="' + (16 * HRY) + '" fill="#DC2626"/><ellipse rx="6" ry="' + (6 * HRY) + '" fill="#fff"/><path d="M-46 0H46" stroke="#1E293B" stroke-width=".8" opacity=".5"/></g>' +
      '<g id="cuG" opacity="0">' + stone('#FACC15') + '</g><g id="cuR" opacity="0">' + stone('#FACC15') + '</g>' +
      '<g id="cuBr" opacity="0"><g class="cu-b1"><path d="M-14-12l-12 18" stroke="#78350F" stroke-width="2.4"/><rect x="-22" y="-16" width="16" height="6" rx="3" fill="#EF4444"/></g><g class="cu-b2"><path d="M14-12l12 18" stroke="#78350F" stroke-width="2.4"/><rect x="6" y="-16" width="16" height="6" rx="3" fill="#EF4444"/></g></g>' +
      '<g id="cuS">' + stone('#2563EB') + '</g><g id="cyFx"></g>',
    init: function (c) {
      c.home = function () { var s = c.id('cuS'); tr(s, 150, 232, cuS(232)); s.setAttribute('opacity', '1'); c.id('cuBr').setAttribute('opacity', '0'); c.id('cuG').setAttribute('opacity', '0'); c.id('cuR').setAttribute('opacity', '0'); };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, S = c.id('cuS'), G = c.id('cuG'), R = c.id('cuR'), Br = c.id('cuBr'), b1 = Br.querySelector('.cu-b1'), b2 = Br.querySelector('.cu-b2');
      var curl = (Math.random() < 0.5 ? -1 : 1) * (10 + rnd(10)), fx, fy, d = L.curlD(i), a = Math.random() * Math.PI * 2;
      // guard stone (line 1: right on the path) and rival stone in the house (line 6: on the button)
      var gx = i === 1 ? 150 + curl * 0.6 : (Math.random() < 0.5 ? 96 : 204), gy = 150, showG = i === 1 || Math.random() < 0.4;
      if (showG) { tr(G, gx, gy, cuS(gy)); G.setAttribute('opacity', '1'); }
      if (i >= 2) { var p = cuPos(d, a); fx = p[0]; fy = p[1]; }
      else if (i === 1) { fx = gx; fy = gy + 12; }
      else { fx = 150 + (Math.random() - 0.5) * 30; fy = -40; }
      var rv = null;
      if (i === 6) rv = cuPos(1 + Math.random() * 3, a + Math.PI);
      else if (Math.random() < 0.5) { var ra = Math.random() < 0.5 ? 0 : Math.PI, rp = cuPos(36 + rnd(6), ra + (Math.random() - 0.5) * 0.5); if (Math.hypot(rp[0] - (fx || 0), rp[1] - (fy || 0)) > 22 && i !== 0) rv = rp; }
      if (rv) { tr(R, rv[0], rv[1], cuS(rv[1])); R.setAttribute('opacity', '1'); }
      c.sfx('launch'); Br.setAttribute('opacity', '1');
      var cv = i === 1 ? curl * 0.6 : curl, last = -1, hitR = false;
      await tw(c.box, i === 0 ? 2300 : 2700, function (k) {
        var e = 1 - Math.pow(1 - k, 2), y = lerp(232, fy, e), x = lerp(150, fx, e) + cv * Math.sin(Math.PI * e) * (i === 1 ? 0 : 1), s = cuS(y);
        tr(S, x, y, s, Math.sin(e * Math.PI) * curl * 0.4);
        if (i === 0 && y < 0) S.setAttribute('opacity', Math.max(0, 1 + y / 40).toFixed(2));
        tr(Br, x, y - 18 * s, s); b1.setAttribute('transform', 'translate(' + (Math.sin(k * 40) * 4).toFixed(1) + ' 0)'); b2.setAttribute('transform', 'translate(' + (-Math.sin(k * 40) * 4).toFixed(1) + ' 0)');
        Br.setAttribute('opacity', k < 0.7 ? '1' : Math.max(0, 1 - (k - 0.7) / 0.15).toFixed(2));
        var t = Math.floor(k * 8); if (t !== last && k < 0.7) { last = t; c.sfx('tick'); }
        if (i === 6 && !hitR && k > 0.86) { hitR = true; c.sfx('act'); }
      });
      Br.setAttribute('opacity', '0');
      if (i === 1) { // knocks the guard a little and stops
        c.sfx('act');
        await tw(c.box, 400, function (k) { var e = ease(k); tr(G, gx, gy - 14 * e, cuS(gy - 14 * e)); });
        c.sfx('stop'); return;
      }
      if (i === 6) { // the rival stone flies out of the house
        var ox = rv[0] < 150 ? -40 : 340;
        await tw(c.box, 600, function (k) { var e = ease(k); tr(R, lerp(rv[0], ox, e), lerp(rv[1], 6, e), cuS(rv[1]), e * 300); R.setAttribute('opacity', (1 - k * 0.6).toFixed(2)); });
        R.setAttribute('opacity', '0');
      }
      c.sfx(i >= 2 ? 'reveal' : 'stop');
      if (i >= 4) await burst(c, fx, fy); else await wait(c.box, 250);
    },
    rules: rules({
      en: '1. Set your stake and tap “Slide”: your blue stone slides and curls down the ice towards the house (the target).\n2. Where it stops: 12-foot ring (blue) ×0.5 · 8-foot (white) ×1.2 · 4-foot (red) ×2.5 · button ×6 · button and the yellow stone knocked out ×25 · dead centre ×100.\n3. Past the house or stopped by the guard stone: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Glisser » : ta pierre bleue glisse en courbe sur la glace vers la maison (la cible).\n2. Là où elle s’arrête : cercle bleu ×0.5 · cercle blanc ×1.2 · cercle rouge ×2.5 · centre ×6 · centre en sortant la pierre jaune ×25 · plein centre ×100.\n3. Trop loin, ou arrêtée par la pierre de garde : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Deslizar»: tu piedra azul se desliza en curva por el hielo hacia la casa (el blanco).\n2. Donde se detiene: anillo azul ×0.5 · anillo blanco ×1.2 · anillo rojo ×2.5 · botón ×6 · botón sacando la piedra amarilla ×25 · centro exacto ×100.\n3. Pasa de largo o la frena la piedra guardia: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Deslizar»: sua pedra azul desliza em curva pelo gelo até a casa (o alvo).\n2. Onde ela para: anel azul ×0.5 · anel branco ×1.2 · anel vermelho ×2.5 · botão ×6 · botão tirando a pedra amarela ×25 · centro exato ×100.\n3. Passa da casa ou é parada pela pedra de guarda: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «أزلق»: ينزلق حجرك الأزرق بانحناء على الجليد نحو البيت (الهدف).\n2. حيث يتوقف: الحلقة الزرقاء ×0.5 · البيضاء ×1.2 · الحمراء ×2.5 · المركز ×6 · المركز مع إخراج الحجر الأصفر ×25 · منتصف المركز تمامًا ×100.\n3. يتجاوز البيت أو يوقفه حجر الحراسة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Kaydır”a dokun: mavi taşın buzda kavis çizerek eve (hedefe) kayar.\n2. Durduğu yer: mavi halka ×0.5 · beyaz halka ×1.2 · kırmızı halka ×2.5 · merkez ×6 · merkez + sarı taşı dışarı atma ×25 · tam merkez ×100.\n3. Evi geçerse ya da koruma taşına takılırsa: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Trượt»: viên đá xanh trượt cong trên băng về phía nhà (mục tiêu).\n2. Nơi đá dừng: vòng xanh ×0.5 · vòng trắng ×1.2 · vòng đỏ ×2.5 · tâm ×6 · tâm và đẩy văng đá vàng ×25 · chính giữa tâm ×100.\n3. Trượt quá nhà hoặc bị đá chắn chặn lại: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Luncurkan»: batu birumu meluncur melengkung di atas es menuju rumah (sasaran).\n2. Tempat berhenti: cincin biru ×0.5 · cincin putih ×1.2 · cincin merah ×2.5 · pusat ×6 · pusat sambil mengeluarkan batu kuning ×25 · tepat di tengah ×100.\n3. Melewati rumah atau tertahan batu penjaga: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Пустить»: ваш синий камень скользит по льду с закруткой к дому (мишени).\n2. Где он остановится: синий круг ×0.5 · белый ×1.2 · красный ×2.5 · центр ×6 · центр с выбиванием жёлтого камня ×25 · точно в центре ×100.\n3. Проехал дом или упёрся в камень-защитник — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Schieben“: dein blauer Stein gleitet mit Drall übers Eis zum Haus (dem Ziel).\n2. Wo er stoppt: blauer Ring ×0.5 · weißer Ring ×1.2 · roter Ring ×2.5 · Mitte ×6 · Mitte und gelben Stein hinausgeschossen ×25 · genau im Zentrum ×100.\n3. Am Haus vorbei oder am Wächterstein hängen geblieben: Einsatz verloren.',
      hi: '1. राशि चुनें और «सरकाएं» छुएं: आपका नीला पत्थर बर्फ पर मुड़ते हुए हाउस (लक्ष्य) की ओर फिसलता है।\n2. जहां रुके: नीला घेरा ×0.5 · सफ़ेद घेरा ×1.2 · लाल घेरा ×2.5 · केंद्र ×6 · केंद्र और पीला पत्थर बाहर ×25 · ठीक बीच में ×100.\n3. हाउस से आगे निकल जाए या गार्ड पत्थर पर रुक जाए: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“推壶”：你的蓝色冰壶在冰面上弧线滑向大本营（靶心）。\n2. 停下的位置：蓝圈 ×0.5 · 白圈 ×1.2 · 红圈 ×2.5 · 圆心 ×6 · 圆心并撞出黄壶 ×25 · 正中心 ×100。\n3. 滑出大本营或被护壶挡住：输掉下注。'
    })
  });
})(window.D6 = window.D6 || {});
