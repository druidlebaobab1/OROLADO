/* casc2 (owner request, round 7) — 6 instant games: Potion Lab, Bomb Squad, Stone Skip, Tarot, Bottle Flip, Gem Fusion.
   The server draws the line (view.i) or the winning option (view.w) — casino_ext/casc.php — and the scene always shows exactly
   that result. Visitors see the games play by themselves (no money, no sound). */
(function (D6) {
  'use strict';
  /* ---- pure logic (no page needed): pay lines as on the server + the scene each line draws; checked by scripts/test-cg-casc-inst.js ---- */
  var L = D6.CascLogic = D6.CascLogic || {};
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  L.rows = L.rows || {};
  L.rows.potion = [0, 0.5, 1.2, 2, 5, 20, 100];
  L.rows.stoneskip = [0, 0, 0.5, 1, 1.6, 2.6, 4, 7, 12, 20, 50];
  L.rows.tarot = [0, 1.6, 3.55, 20];
  L.rows.bottleflip = [0, 0, 0.6, 1.5, 4, 15, 100];
  L.rows.gemfusion = [0, 0.5, 1.2, 2.5, 6, 20, 150];
  L.picks = L.picks || {};
  L.picks.defuse = [0.3, 0.25, 0.2, 0.15, 0.1];
  // Stone Skip: line i = i skips (line 10 = 10 or more: 10…13 are shown)
  L.skips = function (i) { return i < 10 ? i : 10 + rnd(4); };
  // Tarot: 22 major arcana (0…21); lucky = XIX Sun, XVIII Moon, XVII Star, XXI World. Line i = i lucky cards among the 3
  L.TAROT_LUCKY = [19, 18, 17, 21];
  L.tarot = function (i) {
    var luck = shuffle(L.TAROT_LUCKY.slice()).slice(0, i), other = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20]).slice(0, 3 - i);
    return shuffle(luck.concat(other));
  };
  L.tarotCount = function (h) { return h.filter(function (x) { return L.TAROT_LUCKY.indexOf(x) >= 0; }).length; };
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
    brew: { en: 'Brew', fr: 'Préparer', es: 'Preparar', pt: 'Preparar', ar: 'حضّر', tr: 'Pişir', vi: 'Pha chế', id: 'Racik', ru: 'Сварить', de: 'Brauen', hi: 'बनाएं', zh: '调制' },
    cut: { en: 'Cut', fr: 'Couper', es: 'Cortar', pt: 'Cortar', ar: 'اقطع', tr: 'Kes', vi: 'Cắt', id: 'Potong', ru: 'Резать', de: 'Schneiden', hi: 'काटें', zh: '剪断' },
    throwit: { en: 'Throw', fr: 'Lancer', es: 'Lanzar', pt: 'Lançar', ar: 'ارمِ', tr: 'At', vi: 'Ném', id: 'Lempar', ru: 'Бросить', de: 'Werfen', hi: 'फेंकें', zh: '投掷' },
    draw: { en: 'Draw', fr: 'Tirer', es: 'Sacar', pt: 'Tirar', ar: 'اسحب', tr: 'Çek', vi: 'Rút', id: 'Tarik', ru: 'Тянуть', de: 'Ziehen', hi: 'निकालें', zh: '抽牌' },
    flip: { en: 'Flip', fr: 'Lancer', es: 'Voltear', pt: 'Virar', ar: 'اقلب', tr: 'Çevir', vi: 'Lật', id: 'Balik', ru: 'Подбросить', de: 'Werfen', hi: 'उछालें', zh: '翻转' },
    fuse: { en: 'Fuse', fr: 'Fusionner', es: 'Fusionar', pt: 'Fundir', ar: 'ادمج', tr: 'Birleştir', vi: 'Hợp nhất', id: 'Gabung', ru: 'Слить', de: 'Verschmelzen', hi: 'मिलाएं', zh: '融合' }
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

  /* =============================== POTION LAB =============================== */
  // lines: smoke (lose) · red ×0.5 · blue ×1.2 · green ×2 · purple ×5 · rainbow ×20 · golden elixir ×100
  var PT = L.rows.potion;
  var PTC = ['#57534E', '#EF4444', '#3B82F6', '#22C55E', '#A855F7', 'url(#ptRain)', 'url(#cyGold)'];
  var PTB = ['#A8A29E', '#FCA5A5', '#93C5FD', '#86EFAC', '#E9D5FF', '#FBCFE8', '#FEF3C7'];
  function flask(f, s) {
    return '<g transform="scale(' + (s || 1) + ')"><path d="M-3.5-9h7v5.5l6.5 10.5a3.6 3.6 0 0 1-3.1 5.5H-6.9a3.6 3.6 0 0 1-3.1-5.5L-3.5-3.5z" fill="' + f + '" stroke="#F8FAFC" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M-6.5 4h13" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/><rect x="-4.5" y="-11.5" width="9" height="3.4" rx="1.2" fill="#B45309"/><ellipse cx="-3.4" cy="5.5" rx="1.2" ry="2.6" fill="#fff" opacity=".55"/></g>';
  }
  var ING = [
    '<path d="M-13 1a13 11 0 0 1 26 0z" fill="#EF4444" stroke="#7F1D1D" stroke-width="1.2"/><circle cx="-5" cy="-4" r="2.2" fill="#fff"/><circle cx="5" cy="-6" r="2.6" fill="#fff"/><circle cx="7" cy="-1" r="1.4" fill="#fff"/><rect x="-4.5" y="0" width="9" height="11" rx="3.5" fill="#FEF3C7" stroke="#A16207" stroke-width="1"/>',
    '<path d="M0-14l8 9-8 19-8-19z" fill="#67E8F9" stroke="#0E7490" stroke-width="1.3"/><path d="M-8-5h16M0-14v33" stroke="#fff" stroke-opacity=".6" stroke-width="1"/>',
    '<path d="M-9 13C-11 0 0-12 11-14 9-2 3 8-9 13z" fill="#FDE68A" stroke="#B45309" stroke-width="1.2"/><path d="M-9 13L7-9" stroke="#B45309" stroke-width="1.2"/>',
    '<path d="M0 13C-13 4-11-9 0-14 11-9 13 4 0 13z" fill="#22C55E" stroke="#166534" stroke-width="1.2"/><path d="M0 13V-10M0 2l-6-5M0-3l5-4" stroke="#166534" stroke-width="1.3" fill="none"/>',
    '<circle cx="-5" cy="3" r="6" fill="#7C3AED"/><circle cx="6" cy="4" r="6" fill="#6D28D9"/><circle cx="0" cy="-5" r="6" fill="#8B5CF6"/><path d="M0-11q3-6 8-5" stroke="#15803D" stroke-width="2" fill="none"/><circle cx="-2" cy="-7" r="1.6" fill="#fff" opacity=".6"/>',
    '<g transform="scale(1.4)">' + STAR(10, '#FDE047') + '</g><circle r="3" fill="#fff" opacity=".7"/>'
  ];
  game({
    key: 'potion', verb: V.brew, rows: PT,
    chips: [1, 2, 3, 4, 5, 6].map(function (j) { return [flask(PTC[j], 0.95), PT[j]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs>' + GOLDG +
      '<linearGradient id="ptRain" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F43F5E"/><stop offset=".25" stop-color="#F59E0B"/><stop offset=".5" stop-color="#22C55E"/><stop offset=".75" stop-color="#3B82F6"/><stop offset="1" stop-color="#A855F7"/></linearGradient>' +
      '<linearGradient id="ptWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2F6B"/><stop offset="1" stop-color="#1C1638"/></linearGradient>' +
      '<radialGradient id="ptPot" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#57534E"/><stop offset=".55" stop-color="#1C1917"/><stop offset="1" stop-color="#000"/></radialGradient>' +
      '<radialGradient id="ptGlow"><stop offset="0" stop-color="#FFF7D6" stop-opacity=".95"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#ptWall)"/>' +
      '<g stroke="#fff" stroke-opacity=".06" stroke-width="1.5" fill="none">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (r) { var y = 8 + r * 23, o = ''; for (var x = (r % 2 ? -20 : -44); x < 330; x += 48) o += '<rect x="' + x + '" y="' + y + '" width="46" height="21" rx="3"/>'; return o; }).join('') + '</g>' +
      '<circle cx="150" cy="46" r="31" fill="#0B1030" stroke="#7C2D12" stroke-width="6"/>' + [[134, 30], [170, 58], [140, 62], [128, 48]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.2" fill="#fff"/>'; }).join('') +
      '<circle cx="160" cy="38" r="10" fill="#FEF9C3"/><circle cx="165" cy="34" r="9" fill="#0B1030"/><path d="M150 15v62M119 46h62" stroke="#7C2D12" stroke-width="3"/>' +
      '<rect x="6" y="84" width="84" height="7" rx="2" fill="#92400E"/><rect x="210" y="84" width="84" height="7" rx="2" fill="#92400E"/>' +
      [[22, '#F472B6'], [44, '#34D399'], [70, '#60A5FA'], [230, '#FBBF24'], [254, '#A78BFA'], [278, '#F87171']].map(function (b, j) { return '<g transform="translate(' + b[0] + ' ' + (j % 3 === 1 ? 69 : 71) + ')">' + flask(b[1], j % 3 === 1 ? 1.25 : 1.05) + '</g>'; }).join('') +
      '<rect x="-400" y="222" width="1100" height="400" fill="#1C1917"/><path d="M-400 222H700" stroke="#44403C" stroke-width="3"/>' +
      '<g transform="translate(150 230)"><g class="pt-fire"><path d="M-36 0q4-24 14-28-2 13 6 17 2-17 14-28 0 19 10 21 2-11 10-13-2 17 12 31z" fill="#F97316"/><path d="M-22 0q4-15 10-17 0 11 6 11 2-11 8-17 2 13 8 15 2-7 6-9 0 11 4 17z" fill="#FDE047"/></g></g>' +
      '<g transform="translate(150 0)"><path d="M-42 210l-9 16M42 210l9 16" stroke="#0C0A09" stroke-width="8" stroke-linecap="round"/><ellipse cy="172" rx="74" ry="50" fill="url(#ptPot)"/>' +
      '<ellipse cy="132" rx="68" ry="14" fill="#0C0A09" stroke="#57534E" stroke-width="6"/><ellipse id="ptLiq" cy="133" rx="59" ry="9.5" fill="#0D9488"/>' +
      '<g id="ptBub">' + [[-36, 0], [-14, 0.5], [8, 1], [30, 0.25], [-24, 1.25], [20, 0.75]].map(function (b) { return '<circle class="pt-b" cx="' + b[0] + '" cy="133" r="' + (3 + Math.abs(b[0]) % 3) + '" fill="#5EEAD4" style="animation-delay:' + b[1] + 's"/>'; }).join('') + '</g>' +
      '<ellipse cx="-34" cy="160" rx="18" ry="9" fill="#fff" opacity=".07"/></g>' +
      // the shop cat in a witch hat
      '<g transform="translate(254 222)"><path d="M14-6q20-6 13-28" stroke="#F59E0B" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cy="-15" rx="16" ry="15" fill="#F59E0B"/><ellipse cy="-10" rx="8" ry="9" fill="#FEF3C7"/>' +
      '<circle cy="-37" r="12.5" fill="#F59E0B"/><ellipse cx="-4.6" cy="-37.5" rx="2.2" ry="3" fill="#14532D"/><ellipse cx="4.6" cy="-37.5" rx="2.2" ry="3" fill="#14532D"/><circle cx="-4" cy="-38.6" r=".8" fill="#fff"/><circle cx="5.2" cy="-38.6" r=".8" fill="#fff"/>' +
      '<path d="M-1.6-32.5h3.2l-1.6 1.7z" fill="#BE185D"/><path d="M-9-33h-7M-9-31l-6 2M9-33h7M9-31l6 2" stroke="#78350F" stroke-width=".8"/><path d="M-15-45h30l-12-26z" fill="#6D28D9"/><path d="M-14-46h28" stroke="#FBBF24" stroke-width="3"/>' + '<g transform="translate(4 -60) scale(.4)">' + STAR(8, '#FDE047') + '</g></g>' +
      '<circle id="ptHalo" cx="150" cy="74" r="44" fill="url(#ptGlow)" opacity="0"/><g id="ptSmoke" opacity="0">' + [[-18, 0], [0, -8], [18, 0], [-6, -20], [10, -26]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="#A8A29E"/>'; }).join('') + '</g>' +
      '<g id="ptDrop"></g><g id="ptIn" opacity="0"></g><g id="ptFl" opacity="0"></g><g id="cyFx"></g>',
    init: function (c) {
      c.col = function (i) { c.id('ptLiq').setAttribute('fill', i < 0 ? '#0D9488' : PTC[i]); c.qa('.pt-b').forEach(function (b) { b.setAttribute('fill', i < 0 ? '#5EEAD4' : PTB[i]); }); };
      c.home = function () { c.col(-1); ['ptHalo', 'ptSmoke', 'ptFl', 'ptIn'].forEach(function (s) { c.id(s).setAttribute('opacity', '0'); }); c.id('ptDrop').innerHTML = ''; };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, ins = c.id('ptIn'), A = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 2), drop = c.id('ptDrop');
      for (var j = 0; j < 2; j++) {
        var sx = j ? 252 : 48, sy = 70, dir = j ? -1 : 1;
        ins.innerHTML = ING[A[j]]; ins.setAttribute('opacity', '1'); c.sfx('launch');
        await tw(c.box, 640, function (k) { tr(ins, lerp(sx, 150, k), lerp(sy, 134, k * k) - 44 * Math.sin(k * Math.PI), 1.3 - k * 0.5, dir * k * 300); });
        ins.setAttribute('opacity', '0'); c.sfx('step');
        drop.innerHTML = [0, 1, 2, 3, 4, 5].map(function () { return '<circle r="3" fill="' + PTB[0] + '"/>'; }).join('');
        var D = [].slice.call(drop.children), dv = D.map(function (_, q) { return [(q - 2.5) * 9, 26 + rnd(16)]; });
        await tw(c.box, 360, function (k) { D.forEach(function (e, q) { tr(e, 150 + dv[q][0] * k, 132 - dv[q][1] * Math.sin(k * Math.PI)); e.setAttribute('opacity', (1 - k * 0.8).toFixed(2)); }); });
        drop.innerHTML = '';
      }
      // the brew changes colour while it boils, then settles on the drawn potion
      var last = -1;
      await tw(c.box, 1200, function (k) { var q = Math.floor(k * 10); if (q !== last && k < 0.92) { last = q; c.col(1 + rnd(6)); c.sfx('tick'); } });
      c.col(i);
      var fl = c.id('ptFl');
      if (i === 0) {
        var sm = c.id('ptSmoke'); c.sfx('stop');
        await tw(c.box, 1000, function (k) { tr(sm, 150, 120 - k * 50, 0.6 + k * 1.2); sm.setAttribute('opacity', (k < 0.3 ? k / 0.3 * 0.85 : 0.85 * (1 - (k - 0.3) / 0.7)).toFixed(2)); });
        return;
      }
      fl.innerHTML = flask(PTC[i]); fl.setAttribute('opacity', '1'); c.sfx('reveal');
      var halo = c.id('ptHalo');
      await tw(c.box, 800, function (k) { var e = ease(k); tr(fl, 150, lerp(132, 80, e), 0.4 + e * 2.3, Math.sin(k * 9) * 8 * (1 - k)); halo.setAttribute('opacity', (e * 0.9).toFixed(2)); });
      if (i >= 3) await burst(c, 150, 80);
    },
    rules: rules({
      en: '1. Set your stake and tap “Brew”: two ingredients fall into the cauldron.\n2. The brew bubbles and changes colour, then becomes a potion.\n3. Red ×0.5 · blue ×1.2 · green ×2 · purple ×5 · rainbow ×20 · golden elixir ×100. Grey smoke: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Préparer » : deux ingrédients tombent dans le chaudron.\n2. La potion bouillonne et change de couleur, puis elle est prête.\n3. Rouge ×0.5 · bleue ×1.2 · verte ×2 · violette ×5 · arc-en-ciel ×20 · élixir d’or ×100. Fumée grise : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Preparar»: dos ingredientes caen en el caldero.\n2. La mezcla burbujea y cambia de color, luego se vuelve una poción.\n3. Roja ×0.5 · azul ×1.2 · verde ×2 · morada ×5 · arcoíris ×20 · elixir dorado ×100. Humo gris: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Preparar»: dois ingredientes caem no caldeirão.\n2. A mistura borbulha e muda de cor, depois vira uma poção.\n3. Vermelha ×0.5 · azul ×1.2 · verde ×2 · roxa ×5 · arco-íris ×20 · elixir dourado ×100. Fumaça cinza: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «حضّر»: يسقط مكوّنان في القدر.\n2. يغلي الخليط ويتغيّر لونه ثم يصبح جرعة.\n3. حمراء ×0.5 · زرقاء ×1.2 · خضراء ×2 · بنفسجية ×5 · قوس قزح ×20 · إكسير ذهبي ×100. دخان رمادي: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Pişir”e dokun: kazana iki malzeme düşer.\n2. Karışım fokurdar, renk değiştirir ve iksire dönüşür.\n3. Kırmızı ×0.5 · mavi ×1.2 · yeşil ×2 · mor ×5 · gökkuşağı ×20 · altın iksir ×100. Gri duman: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Pha chế»: hai nguyên liệu rơi vào vạc.\n2. Nồi thuốc sủi bọt, đổi màu rồi thành bình thuốc.\n3. Đỏ ×0.5 · xanh dương ×1.2 · xanh lá ×2 · tím ×5 · cầu vồng ×20 · thuốc vàng ×100. Khói xám: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Racik»: dua bahan jatuh ke kuali.\n2. Ramuan mendidih dan berganti warna, lalu menjadi ramuan jadi.\n3. Merah ×0.5 · biru ×1.2 · hijau ×2 · ungu ×5 · pelangi ×20 · eliksir emas ×100. Asap abu-abu: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Сварить»: в котёл падают два ингредиента.\n2. Варево кипит, меняет цвет и превращается в зелье.\n3. Красное ×0.5 · синее ×1.2 · зелёное ×2 · фиолетовое ×5 · радужное ×20 · золотой эликсир ×100. Серый дым — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Brauen“: zwei Zutaten fallen in den Kessel.\n2. Der Trank blubbert, wechselt die Farbe und ist dann fertig.\n3. Rot ×0.5 · Blau ×1.2 · Grün ×2 · Lila ×5 · Regenbogen ×20 · goldenes Elixier ×100. Grauer Rauch: Einsatz verloren.',
      hi: '1. राशि चुनें और «बनाएं» छुएं: दो सामग्री कड़ाह में गिरती हैं।\n2. मिश्रण उबलता है, रंग बदलता है और दवा बन जाता है।\n3. लाल ×0.5 · नीली ×1.2 · हरी ×2 · बैंगनी ×5 · इंद्रधनुष ×20 · सुनहरा अमृत ×100. धूसर धुआं: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“调制”：两种材料落入大锅。\n2. 药水翻滚变色，最后变成一瓶药水。\n3. 红色 ×0.5 · 蓝色 ×1.2 · 绿色 ×2 · 紫色 ×5 · 彩虹 ×20 · 金色灵药 ×100。灰烟：输掉下注。'
    })
  });

  /* =============================== BOMB SQUAD =============================== */
  // 5 wires, the one that stops the timer is wire 0…4 (30 · 25 · 20 · 15 · 10 %) → ×3.13 · ×3.76 · ×4.69 · ×6.26 · ×9.39 (server)
  var DF = L.picks.defuse, DFC = ['#EF4444', '#3B82F6', '#22C55E', '#FACC15', '#A855F7'];
  var DFX0 = [118, 134, 150, 166, 182], DFX1 = [34, 92, 150, 208, 266];
  function dfQ(j) { return [DFX0[j], 154, (DFX0[j] + DFX1[j]) / 2 + (j - 2) * 8, 196 + Math.abs(j - 2) * 5, DFX1[j], 210]; }
  function dfMid(j) { var q = dfQ(j); return [0.25 * q[0] + 0.5 * q[2] + 0.25 * q[4], 0.25 * q[1] + 0.5 * q[3] + 0.25 * q[5]]; }
  game({
    key: 'defuse', verb: V.cut, pick: 5, sel0: 0,
    pickW: function () { var x = Math.random(), a = 0; for (var j = 0; j < 5; j++) { a += DF[j]; if (x < a) return j; } return 4; },
    opts: function () { return '<div class="cg-opts cy-opts">' + DF.map(function (p, j) { return '<button type="button" data-o="' + j + '"><b class="fit"><i style="background:' + DFC[j] + '"></i> ' + Math.round(p * 100) + '%</b><small class="fit">' + xm(pmult(p)) + '</small></button>'; }).join('') + '</div>'; },
    scene: '<defs>' + GOLDG + '<radialGradient id="dfBomb" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#64748B"/><stop offset=".5" stop-color="#1E293B"/><stop offset="1" stop-color="#020617"/></radialGradient>' +
      '<linearGradient id="dfMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#94A3B8"/><stop offset="1" stop-color="#475569"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0F2742"/><g stroke="#38BDF8" stroke-opacity=".09" stroke-width="1">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (j) { return '<path d="M' + (j * 25) + ' -50V300M-50 ' + (j * 25) + 'H350"/>'; }).join('') + '</g>' +
      '<rect x="-400" y="214" width="1100" height="400" fill="#1E3A5F"/>' +
      '<g id="dfBody"><path d="M168 34q14-22 34-14" stroke="#A16207" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="160" y="26" width="18" height="12" rx="3" fill="url(#dfMetal)" transform="rotate(30 169 32)"/>' +
      '<g class="df-spark" transform="translate(203 19)">' + STAR(7, '#FDE047') + '<circle r="2.6" fill="#fff"/></g>' +
      '<circle id="dfBall" cx="150" cy="84" r="58" fill="url(#dfBomb)"/><ellipse cx="128" cy="56" rx="16" ry="9" fill="#fff" opacity=".18" transform="rotate(-30 128 56)"/>' +
      '<g id="dfEyes"><ellipse cx="132" cy="70" rx="7" ry="9" fill="#fff"/><ellipse cx="168" cy="70" rx="7" ry="9" fill="#fff"/><circle class="df-pu" cx="134" cy="72" r="3.6" fill="#0F172A"/><circle class="df-pu" cx="170" cy="72" r="3.6" fill="#0F172A"/></g>' +
      '<path id="dfMouth" d="M140 88q10 4 20 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<rect x="102" y="102" width="96" height="54" rx="8" fill="url(#dfMetal)" stroke="#1E293B" stroke-width="2"/><rect x="111" y="108" width="78" height="28" rx="4" fill="#0B0F19"/>' +
      '<text id="dfT" x="150" y="130" text-anchor="middle" font-size="23" font-weight="900" fill="#EF4444" font-family="ui-monospace,Menlo,Consolas,monospace" dir="ltr">0:05</text>' +
      DFX0.map(function (x) { return '<circle cx="' + x + '" cy="149" r="3.6" fill="#1E293B" stroke="#CBD5E1"/>'; }).join('') + '</g>' +
      '<rect x="12" y="206" width="276" height="32" rx="8" fill="url(#dfMetal)" stroke="#1E293B" stroke-width="2"/>' +
      [0, 1, 2, 3, 4].map(function (j) { var q = dfQ(j); return '<g class="df-w" data-o="' + j + '"><path d="M' + q[0] + ' ' + q[1] + 'Q' + q[2] + ' ' + q[3] + ' ' + q[4] + ' ' + q[5] + '" stroke="transparent" stroke-width="18" fill="none"/>' +
        '<path class="df-wl" pathLength="100" d="M' + q[0] + ' ' + q[1] + 'Q' + q[2] + ' ' + q[3] + ' ' + q[4] + ' ' + q[5] + '" stroke="' + DFC[j] + '" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<circle cx="' + q[4] + '" cy="214" r="6" fill="' + DFC[j] + '" stroke="#0F172A" stroke-width="2"/><text x="' + q[4] + '" y="233" text-anchor="middle" font-size="11" font-weight="900" fill="#0F172A" font-family="var(--cg-font),Arial">' + Math.round(DF[j] * 100) + '%</text></g>'; }).join('') +
      '<g id="dfConf"></g><g id="dfPl" transform="translate(262 150)"><g id="dfJa"><path d="M0-12L-5 2 0 4z" fill="#E2E8F0" stroke="#475569"/><path d="M-1-14L-12-52" stroke="#DC2626" stroke-width="8" stroke-linecap="round"/></g>' +
      '<g id="dfJb"><path d="M0-12L5 2 0 4z" fill="#CBD5E1" stroke="#475569"/><path d="M1-14L12-52" stroke="#B91C1C" stroke-width="8" stroke-linecap="round"/></g><circle cy="-14" r="3.6" fill="#94A3B8" stroke="#334155"/></g><g id="cyFx"></g>',
    onSel: function (c, j) { c.qa('.df-w').forEach(function (e, q) { e.classList.toggle('on', q === j); }); },
    init: function (c) {
      c.qa('.df-w').forEach(function (e) { e.addEventListener('click', function () { if (c.box.classList.contains('cy-busy') || c.demo) return; c.pickOpt(+e.getAttribute('data-o')); }); });
      c.jaw = function (a) { c.id('dfJa').setAttribute('transform', 'rotate(' + (-a) + ' 0 -14)'); c.id('dfJb').setAttribute('transform', 'rotate(' + a + ' 0 -14)'); };
      c.home = function () {
        tr(c.id('dfPl'), 262, 150); c.jaw(14); c.id('dfT').textContent = '0:05'; c.id('dfT').setAttribute('fill', '#EF4444'); c.id('dfConf').innerHTML = '';
        c.id('dfBall').setAttribute('fill', 'url(#dfBomb)'); c.id('dfBody').removeAttribute('transform'); c.id('dfBody').classList.remove('df-soot');
        c.id('dfMouth').setAttribute('d', 'M140 88q10 4 20 0'); c.id('dfEyes').setAttribute('opacity', '1');
        c.qa('.df-wl').forEach(function (e) { e.removeAttribute('stroke-dasharray'); }); c.qa('.df-w').forEach(function (e) { e.classList.remove('ok'); });
      };
      c.home();
    },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var w = +r.view.w, p = +r.view.pick, T = c.id('dfT'), pl = c.id('dfPl'), m = dfMid(p), sec = 5;
      var tick = function () { sec--; T.textContent = '0:0' + Math.max(0, sec); c.sfx('tick'); };
      await wait(c.box, 350); tick();
      await tw(c.box, 900, function (k) { var e = ease(k); tr(pl, lerp(262, m[0], e), lerp(150, m[1] + 14, e)); c.jaw(14 + Math.sin(k * 12) * 6); });
      tick(); await wait(c.box, 380);
      await tw(c.box, 220, function (k) { c.jaw(14 - k * 14); });
      c.sfx('act'); c.qa('.df-wl')[p].setAttribute('stroke-dasharray', '47 6 47');
      await tw(c.box, 200, function (k) { c.jaw(k * 14); tr(pl, m[0] + k * 26, m[1] + 14 + k * 10); });
      if (w === p) {
        T.textContent = 'OK'; T.setAttribute('fill', '#22C55E'); c.id('dfMouth').setAttribute('d', 'M138 86q12 12 24 0'); c.sfx('reveal');
        c.qa('.df-w')[w].classList.add('ok');
        await burst(c, 150, 70, '#86EFAC');
        return;
      }
      while (sec > 0) { await wait(c.box, 420); tick(); }
      // confetti bomb: POOF
      var body = c.id('dfBody'), conf = c.id('dfConf');
      c.sfx('stop');
      conf.innerHTML = Array.apply(null, Array(26)).map(function (_, j) { return '<rect x="-3" y="-1.6" width="6" height="3.2" rx="1" fill="' + DFC[j % 5] + '"/>'; }).join('');
      var E = [].slice.call(conf.children), A = E.map(function () { return [Math.random() * Math.PI * 2, 50 + rnd(70), rnd(360)]; });
      await tw(c.box, 900, function (k) {
        var e = ease(k); sxf(body, 150 - 150 * (1 + Math.sin(k * Math.PI) * 0.12), 84 - 84 * (1 + Math.sin(k * Math.PI) * 0.12), 1 + Math.sin(k * Math.PI) * 0.12);
        E.forEach(function (el, j) { tr(el, 150 + Math.cos(A[j][0]) * A[j][1] * e, 84 + Math.sin(A[j][0]) * A[j][1] * e + k * k * 60, 1, A[j][2] + k * 500); el.setAttribute('opacity', (1 - k * 0.7).toFixed(2)); });
      });
      body.removeAttribute('transform'); body.classList.add('df-soot'); c.id('dfMouth').setAttribute('d', 'M140 92q10-6 20 0'); c.id('dfEyes').setAttribute('opacity', '.35');
      c.qa('.df-w')[w].classList.add('ok');
      await wait(c.box, 500);
    },
    rules: rules({
      en: '1. Pick the wire you think stops the timer (its chance and payout are on its button), set your stake and tap “Cut”.\n2. The pliers cut your wire while the timer runs.\n3. Right wire: 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. Wrong wire: the confetti bomb pops and the stake is lost.',
      fr: '1. Choisis le fil qui arrête le minuteur (sa chance et son gain sont sur son bouton), ta mise, puis touche « Couper ».\n2. La pince coupe ton fil pendant que le minuteur tourne.\n3. Bon fil : 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. Mauvais fil : la bombe à confettis éclate, la mise est perdue.',
      es: '1. Elige el cable que crees que detiene el temporizador (su probabilidad y pago están en su botón), tu apuesta, y toca «Cortar».\n2. La pinza corta tu cable mientras corre el tiempo.\n3. Cable correcto: 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. Cable incorrecto: la bomba de confeti estalla y pierdes la apuesta.',
      pt: '1. Escolha o fio que acha que para o cronômetro (a chance e o pagamento estão no botão), o valor, e toque em «Cortar».\n2. O alicate corta o seu fio enquanto o tempo corre.\n3. Fio certo: 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. Fio errado: a bomba de confete estoura e a aposta é perdida.',
      ar: '1. اختر السلك الذي تظن أنه يوقف المؤقت (فرصته وربحه على زره)، ثم رهانك والمس «اقطع».\n2. تقطع الكمّاشة سلكك بينما يعدّ المؤقت.\n3. السلك الصحيح: 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. سلك خاطئ: تنفجر قنبلة القصاصات الملونة وتخسر الرهان.',
      tr: '1. Zamanlayıcıyı durduracağını düşündüğün kabloyu seç (şansı ve ödemesi düğmesinde), bahsini belirle ve “Kes”e dokun.\n2. Zamanlayıcı işlerken pense kablonu keser.\n3. Doğru kablo: %30 ×3.13 · %25 ×3.76 · %20 ×4.69 · %15 ×6.26 · %10 ×9.39. Yanlış kablo: konfeti bombası patlar, bahis kaybedilir.',
      vi: '1. Chọn sợi dây bạn nghĩ sẽ dừng đồng hồ (cơ hội và tiền thưởng ghi trên nút), chọn mức cược rồi chạm «Cắt».\n2. Chiếc kìm cắt dây của bạn khi đồng hồ đang đếm.\n3. Đúng dây: 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. Sai dây: quả bom pháo giấy nổ tung, mất tiền cược.',
      id: '1. Pilih kabel yang menurutmu menghentikan pengatur waktu (peluang dan bayarannya ada di tombolnya), atur taruhan, lalu sentuh «Potong».\n2. Tang memotong kabelmu saat waktu berjalan.\n3. Kabel benar: 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. Kabel salah: bom konfeti meletus dan taruhan hilang.',
      ru: '1. Выберите провод, который, по-вашему, остановит таймер (шанс и выплата на его кнопке), ставку и нажмите «Резать».\n2. Кусачки режут ваш провод, пока идёт таймер.\n3. Верный провод: 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. Неверный: бомба с конфетти лопается, ставка проиграна.',
      de: '1. Wähle das Kabel, das den Timer stoppt (Chance und Gewinn stehen auf seinem Knopf), deinen Einsatz und tippe auf „Schneiden“.\n2. Die Zange schneidet dein Kabel, während der Timer läuft.\n3. Richtiges Kabel: 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. Falsches Kabel: die Konfettibombe platzt, Einsatz verloren.',
      hi: '1. वह तार चुनें जो टाइमर रोकेगा (उसका मौका और भुगतान बटन पर है), राशि चुनें और «काटें» छुएं।\n2. टाइमर चलते हुए प्लायर आपका तार काटता है।\n3. सही तार: 30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39. गलत तार: कॉन्फ़ेटी बम फूटता है और राशि हार जाते हैं।',
      zh: '1. 选择你认为能停止计时器的电线（概率和赔率写在按钮上），设定金额并点击“剪断”。\n2. 计时器走动时，钳子剪断你的电线。\n3. 选对电线：30 % ×3.13 · 25 % ×3.76 · 20 % ×4.69 · 15 % ×6.26 · 10 % ×9.39。选错：彩纸炸弹爆开，输掉下注。'
    })
  });

  /* =============================== STONE SKIP =============================== */
  // line i = i skips (0…9), line 10 = 10 skips or more: 0–1 lose · 2 ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10+ ×50
  var SS = L.rows.stoneskip;
  function ssPt(k) { var u = 1 - Math.pow(0.84, k + 1); return [72 + 214 * u, 208 - 84 * u, 1 - 0.68 * u]; }
  game({
    key: 'stoneskip', verb: V.throwit, rows: SS,
    chips: [2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (j) { return [num(j < 10 ? j : '10+', j < 10 ? 15 : 10), SS[j]]; }),
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs><linearGradient id="ssSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C1D95"/><stop offset=".45" stop-color="#DB2777"/><stop offset="1" stop-color="#FDBA74"/></linearGradient>' +
      '<linearGradient id="ssLake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9A8D4"/><stop offset=".25" stop-color="#7C3AED"/><stop offset="1" stop-color="#1E1B4B"/></linearGradient>' +
      '<radialGradient id="ssSun"><stop offset="0" stop-color="#FFFBEB"/><stop offset=".5" stop-color="#FDE68A"/><stop offset="1" stop-color="#FB923C" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ssStone" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#E7E5E4"/><stop offset=".6" stop-color="#78716C"/><stop offset="1" stop-color="#44403C"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="530" fill="url(#ssSky)"/><circle cx="214" cy="118" r="46" fill="url(#ssSun)"/><circle cx="214" cy="120" r="20" fill="#FFF7ED"/>' +
      '<path d="M-400 124L-20 124 30 96 76 112 120 90 168 116 196 122 236 100 286 114 330 104 700 124z" fill="#581C87" opacity=".75"/><path d="M-400 124L-10 124 54 108 104 120 150 110 210 124 260 112 320 124 700 124z" fill="#3B0764"/>' +
      '<rect x="-400" y="124" width="1100" height="500" fill="url(#ssLake)"/>' +
      '<g stroke="#FFF7ED" stroke-linecap="round" opacity=".55">' + [[200, 132, 28], [208, 140, 20], [196, 150, 34], [214, 162, 14], [190, 176, 40]].map(function (s) { return '<path d="M' + s[0] + ' ' + s[1] + 'h' + s[2] + '" stroke-width="2"/>'; }).join('') + '</g>' +
      '<g stroke="#fff" stroke-opacity=".18" stroke-width="1.4" fill="none">' + [150, 172, 198, 226].map(function (y, j) { return '<path d="M' + (20 + j * 30) + ' ' + y + 'q12-4 24 0t24 0M' + (150 + j * 22) + ' ' + (y + 8) + 'q12-4 24 0t24 0"/>'; }).join('') + '</g>' +
      // pier and the kid (seen from behind)
      '<path d="M-60 196H58l6 6H-60z" fill="#92400E"/><path d="M-60 202h124v6H-60z" fill="#78350F"/>' + [8, 34, 56].map(function (x) { return '<rect x="' + x + '" y="206" width="6" height="40" fill="#451A03"/>'; }).join('') +
      '<g transform="translate(34 196)"><path d="M-7-2l-2-24h18l-2 24z" fill="#1D4ED8"/><path d="M-3-2v-4M3-2v-4" stroke="#1E3A8A"/><rect x="-10" y="-52" width="20" height="28" rx="7" fill="#EF4444"/>' +
      '<g id="ssArm"><path d="M8-46l12 6" stroke="#FCD9B6" stroke-width="5.5" stroke-linecap="round"/><path d="M8-46l5 3" stroke="#EF4444" stroke-width="7" stroke-linecap="round"/></g>' +
      '<circle cy="-62" r="10.5" fill="#FCD9B6"/><path d="M-10.5-63a10.5 10.5 0 0 1 21 0c0 3-2 5-3 5H-7.5c-1 0-3-2-3-5z" fill="#92400E"/><path d="M-11-65q11-10 22 0l-2-5q-9-6-18 0z" fill="#16A34A"/><path d="M-1-69h18l-3 3H-1z" fill="#15803D"/></g>' +
      '<g id="ssRip"></g><g id="ssSt" opacity="0"><ellipse rx="7" ry="4.2" fill="url(#ssStone)" stroke="#292524" stroke-width=".8"/></g><g id="ssDrop"></g>' +
      '<text id="ssN" x="150" y="64" text-anchor="middle" font-size="46" font-weight="900" fill="#fff" stroke="#4C1D95" stroke-width="6" paint-order="stroke" font-family="var(--cg-font),Arial" opacity="0">0</text><g id="cyFx"></g>',
    init: function (c) {
      c.home = function () { c.id('ssRip').innerHTML = ''; c.id('ssSt').setAttribute('opacity', '0'); c.id('ssN').setAttribute('opacity', '0'); c.id('ssN').textContent = '0'; c.id('ssArm').removeAttribute('transform'); };
      c.rip = function (p, big) { var e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse'); e.setAttribute('class', 'ss-rip' + (big ? ' big' : '')); e.setAttribute('cx', p[0].toFixed(1)); e.setAttribute('cy', p[1].toFixed(1)); e.setAttribute('rx', (12 * p[2]).toFixed(1)); e.setAttribute('ry', (3.6 * p[2]).toFixed(1)); c.id('ssRip').appendChild(e); };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, n = L.skips(i), st = c.id('ssSt'), arm = c.id('ssArm'), N = c.id('ssN');
      await tw(c.box, 380, function (k) { arm.setAttribute('transform', 'rotate(' + (-70 * Math.sin(k * Math.PI)) + ' 8 -46)'); });
      c.sfx('act'); st.setAttribute('opacity', '1'); N.setAttribute('opacity', '1');
      var a = [54, 152, 1.1], b = ssPt(0);
      await tw(c.box, 520, function (k) { tr(st, lerp(a[0], b[0], k), lerp(a[1], b[1], k) - 30 * Math.sin(k * Math.PI), lerp(a[2], b[2], k), k * 720); });
      for (var s = 0; s <= n; s++) {
        var P = ssPt(s);
        if (s === n) { // the last touch: the stone sinks
          c.rip(P, 1); c.sfx('stop');
          await tw(c.box, 420, function (k) { tr(st, P[0], P[1] + k * 4 * P[2], P[2] * (1 - k * 0.5)); st.setAttribute('opacity', (1 - k).toFixed(2)); });
          break;
        }
        c.rip(P); N.textContent = s + 1; c.sfx(s >= 2 ? 'step' : 'tick');
        var Q = ssPt(s + 1), h = 36 * P[2] * P[2], d = 300 + 260 * P[2];
        await tw(c.box, d, function (k) { tr(st, lerp(P[0], Q[0], k), lerp(P[1], Q[1], k) - h * Math.sin(k * Math.PI), lerp(P[2], Q[2], k), k * 540); });
      }
      if (SS[i] >= 4) await burst(c, 150, 52);
      else await wait(c.box, 250);
    },
    rules: rules({
      en: '1. Set your stake and tap “Throw”: the stone skips across the lake.\n2. Count the skips before it sinks.\n3. 2 skips ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 or more ×50. 0 or 1 skip: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : le galet ricoche sur le lac.\n2. Compte les ricochets avant qu’il coule.\n3. 2 ricochets ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 ou plus ×50. 0 ou 1 ricochet : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Lanzar»: la piedra rebota sobre el lago.\n2. Cuenta los rebotes antes de que se hunda.\n3. 2 rebotes ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 o más ×50. 0 o 1 rebote: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Lançar»: a pedra quica sobre o lago.\n2. Conte os quiques antes de ela afundar.\n3. 2 quiques ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 ou mais ×50. 0 ou 1 quique: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «ارمِ»: يقفز الحجر فوق البحيرة.\n2. عُدّ القفزات قبل أن يغرق.\n3. قفزتان ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 أو أكثر ×50. صفر أو قفزة واحدة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “At”a dokun: taş gölün üzerinde seker.\n2. Batmadan önceki sekmeleri say.\n3. 2 sekme ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 veya fazlası ×50. 0 ya da 1 sekme: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Ném»: hòn đá nảy trên mặt hồ.\n2. Đếm số lần nảy trước khi đá chìm.\n3. 2 lần ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 lần trở lên ×50. 0 hoặc 1 lần: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lempar»: batu memantul di atas danau.\n2. Hitung pantulannya sebelum tenggelam.\n3. 2 pantulan ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 atau lebih ×50. 0 atau 1 pantulan: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бросить»: камень прыгает по озеру.\n2. Считайте отскоки, пока он не утонет.\n3. 2 отскока ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 и больше ×50. 0 или 1 отскок — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Werfen“: der Stein hüpft über den See.\n2. Zähle die Sprünge, bevor er versinkt.\n3. 2 Sprünge ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 oder mehr ×50. 0 oder 1 Sprung: Einsatz verloren.',
      hi: '1. राशि चुनें और «फेंकें» छुएं: पत्थर झील पर उछलता है।\n2. डूबने से पहले उछाल गिनें।\n3. 2 उछाल ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10 या अधिक ×50. 0 या 1 उछाल: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“投掷”：石子在湖面上弹跳。\n2. 数一数石子沉下去之前弹跳了几次。\n3. 2 次 ×0.5 · 3 次 ×1 · 4 次 ×1.6 · 5 次 ×2.6 · 6 次 ×4 · 7 次 ×7 · 8 次 ×12 · 9 次 ×20 · 10 次以上 ×50。0 或 1 次：输掉下注。'
    })
  });

  /* =============================== TAROT =============================== */
  // 3 cards of the 22 major arcana; line i = i lucky cards (Sun, Moon, Star, World): 0 lose · 1 ×1.6 · 2 ×3.55 · 3 ×20
  var TA = L.rows.tarot, TAX = [62, 150, 238];
  var RN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  function taSym(n) {
    if (n === 19) return '<g>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (j) { return '<path d="M0-21l3 7h-6z" fill="#F59E0B" transform="rotate(' + j * 30 + ')"/>'; }).join('') + '<circle r="13" fill="url(#cyGold)" stroke="#B45309"/><circle cx="-4.5" cy="-3" r="1.6" fill="#78350F"/><circle cx="4.5" cy="-3" r="1.6" fill="#78350F"/><path d="M-5 4q5 4 10 0" stroke="#78350F" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>';
    if (n === 18) return '<path d="M4-18a18 18 0 1 0 0 36 14 14 0 1 1 0-36z" fill="#E0E7FF" stroke="#6366F1" stroke-width="1.4" transform="translate(-4 0)"/><g transform="translate(12 -12) scale(.45)">' + STAR(8, '#FDE68A') + '</g><g transform="translate(14 10) scale(.3)">' + STAR(8, '#FDE68A') + '</g>';
    if (n === 17) return '<g transform="scale(2)">' + STAR(10, 'url(#cyGold)') + '</g>' + [[-16, -14], [16, -14], [-16, 16], [16, 16]].map(function (p) { return '<g transform="translate(' + p[0] + ' ' + p[1] + ') scale(.35)">' + STAR(8, '#FDE68A') + '</g>'; }).join('');
    if (n === 21) return '<ellipse rx="19" ry="23" fill="none" stroke="#16A34A" stroke-width="4" stroke-dasharray="5 3"/><circle r="12" fill="#3B82F6"/><path d="M-8-6q4-3 7 1t5 6q-3 4-1 7M2-11q4 2 6 7" stroke="#22C55E" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
    var S = [
      '<path d="M-13 6l-2-14 8 6 7-11 7 11 8-6-2 14z" fill="#A78BFA" stroke="#5B21B6" stroke-width="1.4"/><rect x="-13" y="6" width="26" height="5" fill="#7C3AED"/>', // crown
      '<circle cy="-9" r="7" fill="none" stroke="#7C3AED" stroke-width="3.4"/><path d="M0-2v20M0 12h6M0 17h5" stroke="#7C3AED" stroke-width="3.4"/>', // key
      '<path d="M0 14C-18 2-14-12-6-12-2-12 0-8 0-6 0-8 2-12 6-12 14-12 18 2 0 14z" fill="#F472B6" stroke="#9D174D" stroke-width="1.4"/>', // heart
      '<circle r="14" fill="none" stroke="#7C3AED" stroke-width="3"/><path d="M0-14V14M-14 0H14M-10-10l20 20M10-10l-20 20" stroke="#7C3AED" stroke-width="1.8"/><circle r="3.4" fill="#7C3AED"/>', // wheel
      '<path d="M0-16v28M-14-8h28M-14-8l-6 12h12zM14-8l-6 12h12zM-8 12h16" stroke="#7C3AED" stroke-width="2" fill="#DDD6FE" stroke-linejoin="round"/>', // scales
      '<path d="M-7 8h14l-2-12H-5z" fill="#FDE68A" stroke="#92400E" stroke-width="1.4"/><path d="M0-4q-6-8 0-14 6 6 0 14z" fill="#F97316"/><path d="M-9 8h18v4H-9z" fill="#7C3AED"/>', // lamp
      '<path d="M-10 16V-4l10-12 10 12v20z" fill="#C4B5FD" stroke="#5B21B6" stroke-width="1.4"/><rect x="-4" y="4" width="8" height="12" fill="#5B21B6"/><path d="M-12-4h24" stroke="#5B21B6" stroke-width="2"/>' // tower
    ];
    return S[n % S.length];
  }
  function taFace(n) {
    var lucky = L.TAROT_LUCKY.indexOf(n) >= 0;
    return '<rect x="-32" y="-50" width="64" height="100" rx="7" fill="' + (lucky ? 'url(#taLuck)' : '#FEF7E6') + '" stroke="' + (lucky ? 'url(#cyGold)' : '#C4B5FD') + '" stroke-width="3"/><rect x="-26" y="-44" width="52" height="88" rx="4" fill="none" stroke="' + (lucky ? '#B45309' : '#DDD6FE') + '" stroke-width="1"/>' +
      '<text y="-31" text-anchor="middle" font-size="11" font-weight="900" fill="' + (lucky ? '#92400E' : '#6D28D9') + '" font-family="Georgia,serif">' + RN[n] + '</text><g transform="translate(0 8)">' + taSym(n) + '</g>';
  }
  var TABACK = '<rect x="-32" y="-50" width="64" height="100" rx="7" fill="url(#taBack)" stroke="url(#cyGold)" stroke-width="3"/><rect x="-25" y="-43" width="50" height="86" rx="4" fill="none" stroke="#FBBF24" stroke-opacity=".6"/>' +
    '<circle r="13" fill="none" stroke="#FBBF24" stroke-width="1.6"/><path d="M-9 0q9-9 18 0-9 9-18 0z" fill="#FBBF24"/><circle r="3.2" fill="#1E1B4B"/>' + [[-16, -30], [16, -30], [-16, 30], [16, 30]].map(function (p) { return '<g transform="translate(' + p[0] + ' ' + p[1] + ') scale(.35)">' + STAR(8, '#FDE68A') + '</g>'; }).join('');
  game({
    key: 'tarot', verb: V.draw, rows: TA,
    chips: [1, 2, 3].map(function (j) { var s = ''; for (var q = 0; q < j; q++) s += '<g transform="translate(' + ((q - (j - 1) / 2) * 7.5) + ' 0) scale(.62)">' + STAR(9, '#FDE68A') + '</g>'; return [s, TA[j]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs>' + GOLDG + '<radialGradient id="taCloth" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#6D28D9"/><stop offset=".7" stop-color="#3B0764"/><stop offset="1" stop-color="#1E0538"/></radialGradient>' +
      '<linearGradient id="taBack" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#312E81"/><stop offset="1" stop-color="#1E1B4B"/></linearGradient>' +
      '<radialGradient id="taLuck" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#FFFBEB"/><stop offset="1" stop-color="#FDE68A"/></radialGradient>' +
      '<radialGradient id="taBall" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#F5F3FF"/><stop offset=".45" stop-color="#C4B5FD"/><stop offset="1" stop-color="#6D28D9"/></radialGradient>' +
      '<radialGradient id="taHalo"><stop offset="0" stop-color="#E9D5FF" stop-opacity=".7"/><stop offset="1" stop-color="#E9D5FF" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#taCloth)"/>' +
      [[20, 20], [60, 96], [280, 30], [250, 92], [110, 18], [196, 24], [30, 230], [272, 228]].map(function (p, j) { return '<g transform="translate(' + p[0] + ' ' + p[1] + ') scale(' + (j % 2 ? 0.3 : 0.45) + ')" opacity=".5">' + STAR(8, '#FDE68A') + '</g>'; }).join('') +
      '<circle cx="150" cy="46" r="40" fill="url(#taHalo)" class="ta-halo"/><path d="M132 72h36l-6 10h-24z" fill="url(#cyGold)"/><circle cx="150" cy="48" r="25" fill="url(#taBall)" stroke="#EDE9FE" stroke-width="1.4"/><ellipse cx="142" cy="38" rx="7" ry="4" fill="#fff" opacity=".7" transform="rotate(-30 142 38)"/>' +
      [[30, 1], [270, -1]].map(function (p) { return '<g transform="translate(' + p[0] + ' 64)"><rect x="-6" y="0" width="12" height="34" rx="2" fill="#FEF3C7"/><path d="M-6 0q6 4 12 0" fill="#FDE68A"/><path d="M0 0v-4" stroke="#292524" stroke-width="1.4"/>' +
        '<path class="ta-fl" d="M0-20q7 9 0 15-7-6 0-15z" fill="#FB923C"/><path d="M0-14q3 4 0 8-3-4 0-8z" fill="#FEF08A"/><ellipse cy="36" rx="11" ry="3.6" fill="url(#cyGold)"/></g>'; }).join('') +
      '<path d="M-400 214Q150 196 700 214V700H-400z" fill="#2E0A52"/><path d="M-20 214Q150 198 320 214" stroke="url(#cyGold)" stroke-width="2.4" fill="none"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (j) { var x = 6 + j * 24, y = 214 - Math.sin(j / 12 * Math.PI) * 16 + 5; return '<path d="M' + x + ' ' + y + 'l-3 9h6z" fill="#FBBF24"/>'; }).join('') +
      TAX.map(function (x, j) { return '<g class="ta-c" id="taC' + j + '" transform="translate(' + x + ' 150)"><g class="ta-in">' + TABACK + '</g></g>'; }).join('') + '<g id="cyFx"></g>',
    init: function (c) {
      c.home = function () { c.qa('.ta-c').forEach(function (e, j) { tr(e, TAX[j], 150); e.classList.remove('luck', 'dim'); e.querySelector('.ta-in').innerHTML = TABACK; }); };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, H = L.tarot(i);
      // shuffle: the three cards slide together and back
      c.sfx('card');
      await tw(c.box, 520, function (k) { var s = Math.sin(k * Math.PI); c.qa('.ta-c').forEach(function (e, j) { tr(e, lerp(TAX[j], 150, s * 0.85), 150 - s * 10, 1, (j - 1) * 8 * s); }); });
      for (var j = 0; j < 3; j++) {
        var el = c.id('taC' + j), inn = el.querySelector('.ta-in'), x = TAX[j], swapped = false, lucky = L.TAROT_LUCKY.indexOf(H[j]) >= 0;
        c.sfx('card');
        await tw(c.box, 560, function (k) {
          var sx = Math.abs(Math.cos(k * Math.PI)); if (k >= 0.5 && !swapped) { swapped = true; inn.innerHTML = taFace(H[j]); }
          sxf(el, x, 150 - Math.sin(k * Math.PI) * 16, Math.max(0.02, sx), 1 + Math.sin(k * Math.PI) * 0.08);
        });
        tr(el, x, 150);
        if (lucky) { el.classList.add('luck'); c.sfx('step'); } else { el.classList.add('dim'); c.sfx('stop'); }
        await wait(c.box, 260);
      }
      if (i >= 2) await burst(c, 150, 120);
    },
    rules: rules({
      en: '1. Set your stake and tap “Draw”: 3 cards of the 22 major arcana are turned over.\n2. Lucky cards: the Sun, the Moon, the Star and the World (gold cards).\n3. 1 lucky card ×1.6 · 2 lucky cards ×3.55 · 3 lucky cards ×20. No lucky card: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Tirer » : 3 cartes des 22 arcanes majeurs sont retournées.\n2. Cartes chance : le Soleil, la Lune, l’Étoile et le Monde (cartes dorées).\n3. 1 carte chance ×1.6 · 2 cartes chance ×3.55 · 3 cartes chance ×20. Aucune carte chance : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Sacar»: se giran 3 cartas de los 22 arcanos mayores.\n2. Cartas de la suerte: el Sol, la Luna, la Estrella y el Mundo (cartas doradas).\n3. 1 carta de la suerte ×1.6 · 2 cartas ×3.55 · 3 cartas ×20. Ninguna: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Tirar»: 3 cartas dos 22 arcanos maiores são viradas.\n2. Cartas da sorte: o Sol, a Lua, a Estrela e o Mundo (cartas douradas).\n3. 1 carta da sorte ×1.6 · 2 cartas ×3.55 · 3 cartas ×20. Nenhuma: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «اسحب»: تُقلب 3 بطاقات من الأركانا الكبرى الـ22.\n2. بطاقات الحظ: الشمس والقمر والنجمة والعالم (البطاقات الذهبية).\n3. بطاقة حظ واحدة ×1.6 · بطاقتان ×3.55 · 3 بطاقات ×20. لا بطاقة حظ: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Çek”e dokun: 22 büyük arkanadan 3 kart açılır.\n2. Şanslı kartlar: Güneş, Ay, Yıldız ve Dünya (altın kartlar).\n3. 1 şanslı kart ×1.6 · 2 şanslı kart ×3.55 · 3 şanslı kart ×20. Şanslı kart yok: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Rút»: lật 3 lá trong 22 lá ẩn chính.\n2. Lá may mắn: Mặt Trời, Mặt Trăng, Ngôi Sao và Thế Giới (lá vàng).\n3. 1 lá may mắn ×1.6 · 2 lá ×3.55 · 3 lá ×20. Không có lá nào: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Tarik»: 3 kartu dari 22 arkana mayor dibuka.\n2. Kartu keberuntungan: Matahari, Bulan, Bintang, dan Dunia (kartu emas).\n3. 1 kartu keberuntungan ×1.6 · 2 kartu ×3.55 · 3 kartu ×20. Tidak ada: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Тянуть»: открываются 3 карты из 22 старших арканов.\n2. Счастливые карты: Солнце, Луна, Звезда и Мир (золотые карты).\n3. 1 счастливая карта ×1.6 · 2 карты ×3.55 · 3 карты ×20. Ни одной — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Ziehen“: 3 Karten der 22 großen Arkana werden aufgedeckt.\n2. Glückskarten: Sonne, Mond, Stern und Welt (goldene Karten).\n3. 1 Glückskarte ×1.6 · 2 Glückskarten ×3.55 · 3 Glückskarten ×20. Keine Glückskarte: Einsatz verloren.',
      hi: '1. राशि चुनें और «निकालें» छुएं: 22 मुख्य टैरो कार्डों में से 3 पलटे जाते हैं।\n2. भाग्यशाली कार्ड: सूर्य, चंद्रमा, तारा और विश्व (सुनहरे कार्ड)।\n3. 1 भाग्यशाली कार्ड ×1.6 · 2 कार्ड ×3.55 · 3 कार्ड ×20. कोई नहीं: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“抽牌”：从 22 张大阿尔卡那中翻开 3 张。\n2. 幸运牌：太阳、月亮、星星和世界（金色牌）。\n3. 1 张幸运牌 ×1.6 · 2 张 ×3.55 · 3 张 ×20。没有幸运牌：输掉下注。'
    })
  });

  /* =============================== BOTTLE FLIP =============================== */
  // lines: flat (lose) · rolls off the table (lose) · upright ×0.6 · upright after a double flip ×1.5 · on its cap ×4 · cap after a triple flip ×15 · on top of the other bottle ×100
  var BF = L.rows.bottleflip, BFY = 190;
  function bottle(body, label, cap) {
    return '<rect x="-11" y="-21" width="22" height="50" rx="7" fill="' + body + '" stroke="#0369A1" stroke-width="1.4"/><path d="M-11-14q0-8 6-10h10q6 2 6 10" fill="' + body + '" stroke="#0369A1" stroke-width="1.4"/>' +
      '<rect x="-5" y="-27" width="10" height="5" fill="' + body + '" stroke="#0369A1" stroke-width="1.2"/><rect x="-6.5" y="-31" width="13" height="5" rx="1.6" fill="' + cap + '"/>' +
      '<rect x="-10" y="8" width="20" height="20" rx="6" fill="#38BDF8" opacity=".75"/><rect x="-11" y="-6" width="22" height="11" fill="' + label + '"/><path d="M-9 0q3-3 6 0t6 0 6 0" stroke="#fff" stroke-width="1.4" fill="none"/>' +
      '<rect x="-8" y="-18" width="3" height="40" rx="1.5" fill="#fff" opacity=".45"/>';
  }
  function bfIcon(kind) {
    var b = '<g transform="scale(.36)">' + bottle('#BAE6FD', '#F43F5E', '#1D4ED8') + '</g>';
    if (kind === 1) return '<g transform="translate(-4 0)">' + b + '</g>' + num('2', 9, '#FDE68A').replace('<text', '<text x="7"');
    if (kind === 2) return '<g transform="rotate(180)">' + b + '</g>';
    if (kind === 3) return '<g transform="translate(-4 0) rotate(180)">' + b + '</g>' + num('3', 9, '#FDE68A').replace('<text', '<text x="7"');
    if (kind === 4) return '<g transform="translate(0 5) scale(.75)">' + b + '</g><g transform="translate(0 -6) scale(.75)">' + b + '</g>';
    return b;
  }
  game({
    key: 'bottleflip', verb: V.flip, rows: BF,
    chips: [0, 1, 2, 3, 4].map(function (j) { return [bfIcon(j), BF[j + 2]]; }),
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs>' + GOLDG + '<linearGradient id="bfWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFEDD5"/><stop offset="1" stop-color="#FDBA74"/></linearGradient>' +
      '<linearGradient id="bfWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D97706"/><stop offset="1" stop-color="#92400E"/></linearGradient>' +
      '<linearGradient id="bfSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38BDF8"/><stop offset="1" stop-color="#BAE6FD"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#bfWall)"/><g stroke="#FB923C" stroke-opacity=".25" stroke-width="10">' + [-60, 0, 60, 120, 180, 240, 300].map(function (x) { return '<path d="M' + x + ' -20V200"/>'; }).join('') + '</g>' +
      '<rect x="22" y="26" width="86" height="76" rx="4" fill="url(#bfSky)" stroke="#FFF7ED" stroke-width="7"/><path d="M65 26v76M22 64h86" stroke="#FFF7ED" stroke-width="4"/><g fill="#fff"><ellipse cx="44" cy="46" rx="12" ry="6"/><ellipse cx="54" cy="42" rx="9" ry="7"/></g><circle cx="92" cy="84" r="7" fill="#FDE047"/>' +
      '<rect x="196" y="36" width="64" height="50" rx="3" fill="#FEF3C7" stroke="#92400E" stroke-width="5"/><path d="M204 78l14-20 10 12 8-8 16 16z" fill="#16A34A"/><circle cx="244" cy="52" r="5" fill="#F97316"/>' +
      '<rect x="-400" y="236" width="1100" height="400" fill="#9A3412"/><path d="M-400 236H700" stroke="#7C2D12" stroke-width="3"/>' +
      '<rect x="20" y="' + (BFY + 20) + '" width="10" height="' + (250 - BFY) + '" fill="#451A03"/><rect x="270" y="' + (BFY + 20) + '" width="10" height="' + (250 - BFY) + '" fill="#451A03"/>' +
      '<rect x="10" y="' + (BFY + 10) + '" width="280" height="14" fill="#92400E"/><rect x="6" y="' + BFY + '" width="288" height="12" rx="3" fill="url(#bfWood)"/>' +
      '<g id="bfB2" transform="translate(232 ' + (BFY - 29) + ')">' + bottle('#D9F99D', '#F59E0B', '#15803D').replace(/#0369A1/g, '#3F6212') + '</g>' +
      '<g id="bfB" transform="translate(60 ' + (BFY - 29) + ')">' + bottle('#E0F2FE', '#F43F5E', '#1D4ED8') + '</g>' +
      '<ellipse id="bfSh" cx="60" cy="' + (BFY + 1) + '" rx="13" ry="3" fill="#000" opacity=".2"/><g id="cyFx"></g>',
    init: function (c) {
      c.home = function () { tr(c.id('bfB'), 60, BFY - 29); var s = c.id('bfSh'); s.setAttribute('cx', '60'); s.setAttribute('opacity', '.2'); c.id('bfB').setAttribute('opacity', '1'); };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, B = c.id('bfB'), sh = c.id('bfSh');
      // [flips, final angle, target x, target y]
      var tx = 138 + rnd(26), side = Math.random() < 0.5 ? -1 : 1;
      var P = [[1 + rnd(2), 90 * side, tx, BFY - 11], [1, -90, 112, BFY - 11], [1, 0, tx, BFY - 29], [2, 0, tx, BFY - 29], [1, 180, tx, BFY - 29], [3, 180, tx, BFY - 29], [2, 0, 232, BFY - 87]][i];
      var ang = P[0] * 360 + P[1], D = 900 + P[0] * 230;
      await tw(c.box, 220, function (k) { tr(B, 60, BFY - 29 + k * 4, 1, -k * 10); });
      c.sfx('launch');
      await tw(c.box, D, function (k) {
        var x = lerp(60, P[2], k), y = lerp(BFY - 29, P[3], k) - 130 * 4 * k * (1 - k);
        tr(B, x, y, 1, -10 + (ang + 10) * (1 - Math.pow(1 - k, 1.4)));
        sh.setAttribute('cx', x.toFixed(1)); sh.setAttribute('opacity', (0.2 * (1 - Math.sin(k * Math.PI) * 0.8)).toFixed(2));
      });
      c.sfx('act');
      var a0 = P[1];
      if (Math.abs(P[1]) === 90) { // lands on its side: bounce (and maybe rolls off)
        await tw(c.box, 300, function (k) { tr(B, P[2], P[3] - 10 * Math.sin(k * Math.PI), 1, a0 + 8 * Math.sin(k * Math.PI)); });
        if (i === 1) {
          await tw(c.box, 900, function (k) { var x = lerp(P[2], 16, k); tr(B, x, P[3], 1, a0 - k * 720); sh.setAttribute('cx', x.toFixed(1)); });
          sh.setAttribute('opacity', '0'); c.sfx('stop');
          await tw(c.box, 420, function (k) { tr(B, 16 - k * 30, P[3] + k * k * 120, 1, a0 - 720 - k * 120); });
          B.setAttribute('opacity', '0');
        } else c.sfx('stop');
        return;
      }
      // lands standing (upright or on its cap): wobble then still
      await tw(c.box, 650, function (k) { tr(B, P[2], P[3], 1, a0 + 14 * Math.sin(k * Math.PI * 3) * (1 - k)); });
      tr(B, P[2], P[3], 1, a0);
      c.sfx('reveal');
      if (i >= 4) await burst(c, P[2], P[3] - 20);
      else await wait(c.box, 200);
    },
    rules: rules({
      en: '1. Set your stake and tap “Flip”: the bottle spins through the air and lands on the table.\n2. Upright ×0.6 · upright after a double flip ×1.5 · on its cap ×4 · on its cap after a triple flip ×15 · on top of the green bottle ×100.\n3. Falls on its side or rolls off the table: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : la bouteille tourne en l’air et retombe sur la table.\n2. Debout ×0.6 · debout après un double salto ×1.5 · sur le bouchon ×4 · sur le bouchon après un triple salto ×15 · sur la bouteille verte ×100.\n3. Couchée ou tombée de la table : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Voltear»: la botella gira en el aire y cae sobre la mesa.\n2. De pie ×0.6 · de pie tras doble vuelta ×1.5 · sobre la tapa ×4 · sobre la tapa tras triple vuelta ×15 · encima de la botella verde ×100.\n3. Cae de lado o rueda fuera de la mesa: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Virar»: a garrafa gira no ar e cai na mesa.\n2. Em pé ×0.6 · em pé após giro duplo ×1.5 · sobre a tampa ×4 · sobre a tampa após giro triplo ×15 · em cima da garrafa verde ×100.\n3. Cai deitada ou rola para fora da mesa: a aposta é perdida.',
      ar: '1. اختر رهانك والمس «اقلب»: تدور الزجاجة في الهواء وتسقط على الطاولة.\n2. واقفة ×0.6 · واقفة بعد دورتين ×1.5 · على غطائها ×4 · على غطائها بعد 3 دورات ×15 · فوق الزجاجة الخضراء ×100.\n3. تسقط على جانبها أو تتدحرج خارج الطاولة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Çevir”e dokun: şişe havada döner ve masaya düşer.\n2. Dik ×0.6 · çift takla sonrası dik ×1.5 · kapağının üstünde ×4 · üçlü takla sonrası kapağının üstünde ×15 · yeşil şişenin üstünde ×100.\n3. Yan yatarsa ya da masadan yuvarlanırsa: bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Lật»: chai xoay trên không rồi rơi xuống bàn.\n2. Đứng thẳng ×0.6 · đứng sau 2 vòng ×1.5 · đứng trên nắp ×4 · trên nắp sau 3 vòng ×15 · đứng trên chai xanh ×100.\n3. Nằm ngang hoặc lăn khỏi bàn: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Balik»: botol berputar di udara dan mendarat di meja.\n2. Berdiri ×0.6 · berdiri setelah 2 putaran ×1.5 · di atas tutup ×4 · di atas tutup setelah 3 putaran ×15 · di atas botol hijau ×100.\n3. Jatuh menyamping atau menggelinding dari meja: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Подбросить»: бутылка крутится в воздухе и падает на стол.\n2. Стоя ×0.6 · стоя после двойного сальто ×1.5 · на крышке ×4 · на крышке после тройного сальто ×15 · на зелёной бутылке ×100.\n3. Упала на бок или скатилась со стола — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Werfen“: die Flasche dreht sich in der Luft und landet auf dem Tisch.\n2. Stehend ×0.6 · stehend nach Doppelsalto ×1.5 · auf dem Deckel ×4 · auf dem Deckel nach Dreifachsalto ×15 · auf der grünen Flasche ×100.\n3. Liegt auf der Seite oder rollt vom Tisch: Einsatz verloren.',
      hi: '1. राशि चुनें और «उछालें» छुएं: बोतल हवा में घूमकर मेज़ पर गिरती है।\n2. सीधी खड़ी ×0.6 · दो चक्कर के बाद खड़ी ×1.5 · ढक्कन पर ×4 · तीन चक्कर के बाद ढक्कन पर ×15 · हरी बोतल के ऊपर ×100.\n3. करवट गिरे या मेज़ से लुढ़क जाए: राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“翻转”：瓶子在空中翻转后落在桌上。\n2. 立住 ×0.6 · 两周翻后立住 ×1.5 · 瓶盖朝下立住 ×4 · 三周翻后瓶盖立住 ×15 · 立在绿瓶子上 ×100。\n3. 倒下或滚落桌面：输掉下注。'
    })
  });

  /* =============================== GEM FUSION =============================== */
  // the final gem: dust (lose) · amethyst ×0.5 · sapphire ×1.2 · emerald ×2.5 · ruby ×6 · diamond ×20 · rainbow gem ×150
  var GF = L.rows.gemfusion;
  var GFC = [['#A8A29E', '#57534E'], ['#C084FC', '#6B21A8'], ['#60A5FA', '#1E3A8A'], ['#34D399', '#065F46'], ['#FB7185', '#9F1239'], ['#F0F9FF', '#0E7490'], ['url(#gfRain)', '#7C2D12']];
  function gem(t, s) {
    var C = GFC[t];
    return '<g transform="scale(' + (s || 1) + ')"><path d="M-9-11h18l9 10L0 16-18-1z" fill="' + C[0] + '" stroke="' + C[1] + '" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M-18-1h36M-9-11l-3 10L0 16l12-17-3-10M-12-1l12-10 12 10" stroke="#fff" stroke-opacity=".55" stroke-width="1" fill="none"/><path d="M-7-9h6l-4 7z" fill="#fff" opacity=".7"/></g>';
  }
  var GFP = [[56, 70], [244, 70], [56, 196], [244, 196]];
  game({
    key: 'gemfusion', verb: V.fuse, rows: GF,
    chips: [1, 2, 3, 4, 5, 6].map(function (j) { return [gem(j, 0.6), GF[j]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs>' + GOLDG + '<radialGradient id="gfBg" cx="50%" cy="55%" r="70%"><stop offset="0" stop-color="#3B0764"/><stop offset=".7" stop-color="#1E1B4B"/><stop offset="1" stop-color="#0B0820"/></radialGradient>' +
      '<linearGradient id="gfRain" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F43F5E"/><stop offset=".25" stop-color="#FBBF24"/><stop offset=".5" stop-color="#34D399"/><stop offset=".75" stop-color="#60A5FA"/><stop offset="1" stop-color="#C084FC"/></linearGradient>' +
      '<radialGradient id="gfFlash"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#F5D0FE" stop-opacity=".8"/><stop offset="1" stop-color="#C084FC" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gfPed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A78BFA"/><stop offset="1" stop-color="#4C1D95"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#gfBg)"/>' +
      [[-6, 250, 1.3, '#7C3AED'], [306, 250, 1.4, '#2563EB'], [-10, -6, 1, '#DB2777'], [310, -4, 1.1, '#0891B2']].map(function (q) { return '<g transform="translate(' + q[0] + ' ' + q[1] + ') scale(' + q[2] + ')" opacity=".55"><path d="M-14 0l6-34 8 34zM-2 0l10-46 10 46zM14 0l8-26 6 26z" fill="' + q[3] + '"/></g>'; }).join('') +
      '<g transform="translate(150 133)"><g class="gf-ring"><circle r="64" fill="none" stroke="#C4B5FD" stroke-opacity=".5" stroke-width="2"/><circle r="54" fill="none" stroke="#C4B5FD" stroke-opacity=".35" stroke-width="1.4" stroke-dasharray="4 6"/>' +
      [0, 1, 2, 3, 4, 5].map(function (j) { var a = j * Math.PI / 3; return '<circle cx="' + (Math.cos(a) * 64).toFixed(1) + '" cy="' + (Math.sin(a) * 64).toFixed(1) + '" r="4" fill="#E9D5FF"/>'; }).join('') + '</g></g>' +
      GFP.map(function (p) { return '<g transform="translate(' + p[0] + ' ' + (p[1] + 22) + ')"><path d="M-20 0h40l-6 18h-28z" fill="url(#gfPed)"/><ellipse rx="20" ry="5" fill="#C4B5FD"/></g>'; }).join('') +
      '<circle id="gfFl" cx="150" cy="133" r="70" fill="url(#gfFlash)" opacity="0"/>' +
      [0, 1, 2, 3].map(function (j) { return '<g class="gf-g" id="gfG' + j + '"></g>'; }).join('') + '<g id="gfM0"></g><g id="gfM1"></g><g id="gfF"></g><g id="gfDust"></g><g id="cyFx"></g>',
    init: function (c) {
      c.home = function () {
        c.start = [1 + rnd(3), 1 + rnd(3), 1 + rnd(3), 1 + rnd(3)];
        GFP.forEach(function (p, j) { var g = c.id('gfG' + j); g.innerHTML = gem(c.start[j], 1); tr(g, p[0], p[1]); g.setAttribute('opacity', '1'); });
        ['gfM0', 'gfM1', 'gfF', 'gfDust'].forEach(function (s) { c.id(s).innerHTML = ''; });
        c.id('gfFl').setAttribute('opacity', '0');
      };
      c.home();
    },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var i = +r.view.i, fl = c.id('gfFl');
      var mid = i ? [Math.max(1, i - 1 - rnd(2)), Math.max(1, i - rnd(2))] : [1 + rnd(3), 1 + rnd(3)];
      var flash = function (x, y, k, s) { fl.setAttribute('cx', x); fl.setAttribute('cy', y); fl.setAttribute('r', (20 + s * k).toFixed(1)); fl.setAttribute('opacity', (1 - k).toFixed(2)); };
      // two by two
      for (var h = 0; h < 2; h++) {
        var a = c.id('gfG' + (h * 2)), b = c.id('gfG' + (h * 2 + 1)), y = h ? 196 : 70, M = c.id('gfM' + h);
        c.sfx('launch');
        await tw(c.box, 650, function (k) { var e = ease(k); tr(a, lerp(56, 150, e), y - Math.sin(k * Math.PI) * 18, 1, k * 360); tr(b, lerp(244, 150, e), y - Math.sin(k * Math.PI) * 18, 1, -k * 360); });
        a.setAttribute('opacity', '0'); b.setAttribute('opacity', '0'); M.innerHTML = gem(mid[h], 1); c.sfx('step');
        await tw(c.box, 380, function (k) { tr(M, 150, y, 0.6 + ease(k) * 0.7); flash(150, y, k, 40); });
      }
      // the final fusion in the magic circle
      var M0 = c.id('gfM0'), M1 = c.id('gfM1'), F = c.id('gfF');
      c.sfx('launch');
      await tw(c.box, 800, function (k) { var e = k * k; tr(M0, 150 + Math.sin(k * 8) * 22 * (1 - k), lerp(70, 133, e), 1.3, k * 540); tr(M1, 150 - Math.sin(k * 8) * 22 * (1 - k), lerp(196, 133, e), 1.3, -k * 540); });
      M0.innerHTML = ''; M1.innerHTML = '';
      if (i === 0) { // the fusion fails: grey dust
        F.innerHTML = gem(0, 1.6); c.sfx('stop');
        await tw(c.box, 300, function (k) { flash(150, 133, k, 50); tr(F, 150 + Math.sin(k * 40) * 3, 133); });
        var D = c.id('gfDust'); F.innerHTML = '';
        D.innerHTML = Array.apply(null, Array(14)).map(function () { return '<circle r="' + (1.5 + Math.random() * 2.5) + '" fill="#A8A29E"/>'; }).join('');
        var E = [].slice.call(D.children), A = E.map(function () { return [(Math.random() - 0.5) * 70, -10 - Math.random() * 20]; });
        await tw(c.box, 800, function (k) { E.forEach(function (el, j) { tr(el, 150 + A[j][0] * k, 133 + A[j][1] * k + k * k * 70); el.setAttribute('opacity', (1 - k).toFixed(2)); }); });
        return;
      }
      F.innerHTML = gem(i, 1); c.sfx('reveal');
      await tw(c.box, 700, function (k) { var e = ease(k); tr(F, 150, 133, 0.3 + e * 2.4, (1 - e) * 180); flash(150, 133, k, 90); });
      if (i >= 3) await burst(c, 150, 133);
    },
    rules: rules({
      en: '1. Set your stake and tap “Fuse”: the 4 gems merge two by two, then into one final gem.\n2. The final gem pays: amethyst ×0.5 · sapphire ×1.2 · emerald ×2.5 · ruby ×6 · diamond ×20 · rainbow gem ×150.\n3. If the fusion fails, the gem turns to dust and the stake is lost.',
      fr: '1. Choisis ta mise et touche « Fusionner » : les 4 gemmes fusionnent deux par deux, puis en une gemme finale.\n2. La gemme finale paie : améthyste ×0.5 · saphir ×1.2 · émeraude ×2.5 · rubis ×6 · diamant ×20 · gemme arc-en-ciel ×150.\n3. Si la fusion rate, la gemme tombe en poussière et la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Fusionar»: las 4 gemas se fusionan de dos en dos y luego en una gema final.\n2. La gema final paga: amatista ×0.5 · zafiro ×1.2 · esmeralda ×2.5 · rubí ×6 · diamante ×20 · gema arcoíris ×150.\n3. Si la fusión falla, la gema se vuelve polvo y pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Fundir»: as 4 gemas se fundem de duas em duas e depois numa gema final.\n2. A gema final paga: ametista ×0.5 · safira ×1.2 · esmeralda ×2.5 · rubi ×6 · diamante ×20 · gema arco-íris ×150.\n3. Se a fusão falhar, a gema vira pó e a aposta é perdida.',
      ar: '1. اختر رهانك والمس «ادمج»: تندمج الجواهر الأربع كل اثنتين معًا ثم في جوهرة نهائية.\n2. الجوهرة النهائية تدفع: جمشت ×0.5 · ياقوت أزرق ×1.2 · زمرد ×2.5 · ياقوت أحمر ×6 · ألماس ×20 · جوهرة قوس قزح ×150.\n3. إذا فشل الدمج تتحول الجوهرة إلى غبار وتخسر الرهان.',
      tr: '1. Bahsini seç ve “Birleştir”e dokun: 4 mücevher ikişer ikişer, sonra tek bir son mücevherde birleşir.\n2. Son mücevher öder: ametist ×0.5 · safir ×1.2 · zümrüt ×2.5 · yakut ×6 · elmas ×20 · gökkuşağı mücevheri ×150.\n3. Birleşme başarısız olursa mücevher toza döner, bahis kaybedilir.',
      vi: '1. Chọn mức cược rồi chạm «Hợp nhất»: 4 viên đá hợp lại từng đôi, rồi thành một viên cuối.\n2. Viên cuối trả thưởng: thạch anh tím ×0.5 · lam ngọc ×1.2 · ngọc lục bảo ×2.5 · hồng ngọc ×6 · kim cương ×20 · đá cầu vồng ×150.\n3. Nếu hợp nhất thất bại, viên đá hóa bụi và mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Gabung»: 4 permata bergabung berpasangan, lalu menjadi satu permata akhir.\n2. Permata akhir membayar: ametis ×0.5 · safir ×1.2 · zamrud ×2.5 · rubi ×6 · berlian ×20 · permata pelangi ×150.\n3. Jika penggabungan gagal, permata menjadi debu dan taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Слить»: 4 камня сливаются попарно, а затем в один итоговый камень.\n2. Итоговый камень платит: аметист ×0.5 · сапфир ×1.2 · изумруд ×2.5 · рубин ×6 · бриллиант ×20 · радужный камень ×150.\n3. Если слияние не удалось, камень рассыпается в пыль — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Verschmelzen“: die 4 Edelsteine verschmelzen paarweise, dann zu einem letzten Stein.\n2. Der letzte Stein zahlt: Amethyst ×0.5 · Saphir ×1.2 · Smaragd ×2.5 · Rubin ×6 · Diamant ×20 · Regenbogenstein ×150.\n3. Misslingt die Verschmelzung, zerfällt der Stein zu Staub: Einsatz verloren.',
      hi: '1. राशि चुनें और «मिलाएं» छुएं: 4 रत्न दो-दो करके मिलते हैं, फिर एक अंतिम रत्न बनता है।\n2. अंतिम रत्न देता है: जमुनिया ×0.5 · नीलम ×1.2 · पन्ना ×2.5 · माणिक ×6 · हीरा ×20 · इंद्रधनुषी रत्न ×150.\n3. मिलन विफल हो तो रत्न धूल बन जाता है और राशि हार जाते हैं।',
      zh: '1. 设定金额并点击“融合”：4 颗宝石两两融合，再合成一颗最终宝石。\n2. 最终宝石赔付：紫水晶 ×0.5 · 蓝宝石 ×1.2 · 祖母绿 ×2.5 · 红宝石 ×6 · 钻石 ×20 · 彩虹宝石 ×150。\n3. 融合失败时宝石化为尘土，输掉下注。'
    })
  });
})(window.D6 = window.D6 || {});
