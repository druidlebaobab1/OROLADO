/* casa2 (owner request, round 6) — 6 instant-win games: Win Numbers (scratch card), Mystery Boxes, Lucky Ladder, Hi-Lo Run,
   Red Envelopes, Pirate Map. The server draws the line (view.i) or the winning option (view.w) — casino_ext/casa.php — and the
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
    scratch: { en: 'Scratch', fr: 'Gratter', es: 'Raspar', pt: 'Raspar', ar: 'اكشط', tr: 'Kazı', vi: 'Cào', id: 'Gosok', ru: 'Стереть', de: 'Rubbeln', hi: 'खुरचें', zh: '刮奖' },
    open: { en: 'Open', fr: 'Ouvrir', es: 'Abrir', pt: 'Abrir', ar: 'افتح', tr: 'Aç', vi: 'Mở', id: 'Buka', ru: 'Открыть', de: 'Öffnen', hi: 'खोलें', zh: '打开' },
    climb: { en: 'Climb', fr: 'Grimper', es: 'Subir', pt: 'Subir', ar: 'اصعد', tr: 'Tırman', vi: 'Leo', id: 'Panjat', ru: 'Лезть', de: 'Klettern', hi: 'चढ़ें', zh: '攀爬' },
    deal: { en: 'Deal', fr: 'Distribuer', es: 'Repartir', pt: 'Distribuir', ar: 'وزّع', tr: 'Dağıt', vi: 'Chia bài', id: 'Bagikan', ru: 'Раздать', de: 'Geben', hi: 'बांटें', zh: '发牌' },
    sail: { en: 'Sail', fr: 'Naviguer', es: 'Navegar', pt: 'Navegar', ar: 'أبحر', tr: 'Yelken aç', vi: 'Ra khơi', id: 'Berlayar', ru: 'Плыть', de: 'Segeln', hi: 'चलाएं', zh: '启航' }
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

  /* =============================== WIN NUMBERS (scratch card) =============================== */
  // lines: 0 nothing · ×0.5 · ×1 · ×2 · ×5 · ×10 · ×50 · ×200 (one of my numbers = a lucky number → its prize)
  var SW = [0, 0.5, 1, 2, 5, 10, 50, 200];
  var SWX = [62, 150, 238], SWY = [128, 192];
  game({
    key: 'scratchwin', verb: V.scratch, rows: SW,
    scene: '<defs>' + GOLDG + '<linearGradient id="swCard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDF4FF"/><stop offset="1" stop-color="#F5D0FE"/></linearGradient>' +
      '<linearGradient id="swFoil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E5E7EB"/><stop offset=".5" stop-color="#9CA3AF"/><stop offset="1" stop-color="#D1D5DB"/></linearGradient></defs>' +
      '<rect x="8" y="6" width="284" height="238" rx="18" fill="url(#swCard)" stroke="url(#cyGold)" stroke-width="4"/>' +
      '<rect x="20" y="16" width="260" height="70" rx="12" fill="#7E22CE"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (j) { return '<g transform="translate(' + (30 + j * 30) + ' 24)" opacity=".5">' + STAR(4, '#FDE68A') + '</g>'; }).join('') +
      [110, 190].map(function (x, j) { return '<g transform="translate(' + x + ' 56)"><circle r="24" fill="url(#cyGold)" stroke="#92400E" stroke-width="2"/><text id="swL' + j + '" y="9" text-anchor="middle" font-size="25" font-weight="900" fill="#78350F" font-family="var(--cg-font),Arial">?</text><rect class="sw-foil" id="swLF' + j + '" x="-26" y="-26" width="52" height="52" rx="26" fill="url(#swFoil)"/></g>'; }).join('') +
      SWY.map(function (y, r) { return SWX.map(function (x, cc) { var j = r * 3 + cc; return '<g class="sw-spot" id="swS' + j + '" transform="translate(' + x + ' ' + y + ')"><rect x="-40" y="-27" width="80" height="54" rx="10" fill="#fff" stroke="#E9D5FF" stroke-width="2"/>' +
        '<text class="sw-n" y="-1" text-anchor="middle" font-size="22" font-weight="900" fill="#581C87" font-family="var(--cg-font),Arial"></text><text class="sw-p" y="19" text-anchor="middle" font-size="13" font-weight="800" fill="#B45309" font-family="var(--cg-font),Arial"></text>' +
        '<rect class="sw-foil" x="-41" y="-28" width="82" height="56" rx="10" fill="url(#swFoil)"/><path class="sw-foil" d="M-30-10h60M-30 0h60M-30 10h60" stroke="#fff" stroke-opacity=".35" stroke-width="2"/></g>'; }).join(''); }).join('') +
      '<g id="cyFx"></g>',
    init: function (c) {
      c.fill = function (i) {
        var lucky = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]).slice(0, 2), others = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].filter(function (n) { return lucky.indexOf(n) < 0; }));
        var hit = i > 0 ? rnd(6) : -1, P = [0.5, 1, 2, 5, 10, 50, 200, 1, 2, 0.5, 5];
        c.spots = []; for (var j = 0; j < 6; j++) c.spots.push(j === hit ? [lucky[rnd(2)], SW[i]] : [others[j], P[rnd(P.length)]]);
        c.lucky = lucky; c.hit = hit;
        lucky.forEach(function (n, j) { c.id('swL' + j).textContent = n; });
        c.spots.forEach(function (s, j) { var g = c.id('swS' + j); g.querySelector('.sw-n').textContent = s[0]; g.querySelector('.sw-p').textContent = xm(s[1]); });
      };
      c.cover = function () { c.qa('.sw-foil').forEach(function (e) { e.style.opacity = ''; }); c.qa('.sw-spot').forEach(function (e) { e.classList.remove('hit', 'dim'); }); };
      c.fill(0); c.cover();
    },
    reset: function (c) { c.cover(); },
    play: async function (c, r) {
      var i = +r.view.i; c.fill(i);
      var scr = async function (els) { await tw(c.box, 420, function (k) { els.forEach(function (e) { e.style.opacity = (1 - k).toFixed(2); }); if (Math.random() < 0.3) c.sfx('tick'); }); };
      for (var j = 0; j < 2; j++) await scr([c.id('swLF' + j)]);
      for (j = 0; j < 6; j++) { await scr([].slice.call(c.id('swS' + j).querySelectorAll('.sw-foil'))); if (j === c.hit) { c.id('swS' + j).classList.add('hit'); c.snd('coin', { k: 1 }); } }
      c.qa('.sw-spot').forEach(function (e, j) { if (j !== c.hit) e.classList.add('dim'); });
      if (c.hit >= 0) await burst(c, SWX[c.hit % 3], SWY[Math.floor(c.hit / 3)]);
    },
    rules: {
      en: '1. Set your stake and tap “Scratch”: the card is scratched for you.\n2. At the top, 2 lucky numbers. Below, 6 numbers, each with its prize.\n3. If one of your numbers matches a lucky number, you win its prize: ×0.5 up to ×200.',
      fr: '1. Choisis ta mise et touche « Gratter » : le ticket se gratte tout seul.\n2. En haut, 2 numéros gagnants. En dessous, 6 numéros, chacun avec son lot.\n3. Si un de tes numéros est un numéro gagnant, tu gagnes son lot : de ×0.5 à ×200.',
      es: '1. Elige tu apuesta y toca «Raspar»: el boleto se raspa solo.\n2. Arriba, 2 números de la suerte. Abajo, 6 números, cada uno con su premio.\n3. Si uno de tus números coincide con un número de la suerte, ganas su premio: de ×0.5 a ×200.',
      pt: '1. Escolha o valor e toque em «Raspar»: o bilhete é raspado sozinho.\n2. Em cima, 2 números da sorte. Embaixo, 6 números, cada um com seu prêmio.\n3. Se um dos seus números for um número da sorte, você ganha o prêmio dele: de ×0.5 a ×200.',
      ar: '1. اختر رهانك والمس «اكشط»: تُكشط البطاقة تلقائيًا.\n2. في الأعلى رقمان محظوظان. وفي الأسفل 6 أرقام، لكل منها جائزته.\n3. إذا طابق أحد أرقامك رقمًا محظوظًا تربح جائزته: من ×0.5 إلى ×200.',
      tr: '1. Bahsini seç ve “Kazı”ya dokun: kart kendiliğinden kazınır.\n2. Üstte 2 şanslı sayı. Altta her birinin ödülü olan 6 sayı.\n3. Sayılarından biri şanslı sayıyla eşleşirse ödülünü kazanırsın: ×0.5 ile ×200 arası.',
      vi: '1. Chọn mức cược rồi chạm «Cào»: thẻ tự cào.\n2. Phía trên có 2 số may mắn. Phía dưới có 6 số, mỗi số có giải riêng.\n3. Nếu một số của bạn trùng số may mắn, bạn nhận giải của số đó: từ ×0.5 đến ×200.',
      id: '1. Atur taruhan lalu sentuh «Gosok»: kartu tergosok sendiri.\n2. Di atas ada 2 angka keberuntungan. Di bawah ada 6 angka, masing-masing dengan hadiahnya.\n3. Jika salah satu angkamu sama dengan angka keberuntungan, kamu memenangkan hadiahnya: ×0.5 hingga ×200.',
      ru: '1. Выберите ставку и нажмите «Стереть»: билет стирается сам.\n2. Вверху 2 счастливых числа. Внизу 6 чисел, у каждого свой приз.\n3. Если одно из ваших чисел совпало со счастливым, вы выигрываете его приз: от ×0.5 до ×200.',
      de: '1. Wähle deinen Einsatz und tippe auf „Rubbeln“: das Los rubbelt sich selbst frei.\n2. Oben 2 Glückszahlen. Darunter 6 Zahlen, jede mit ihrem Preis.\n3. Stimmt eine deiner Zahlen mit einer Glückszahl überein, gewinnst du ihren Preis: ×0.5 bis ×200.',
      hi: '1. राशि चुनें और «खुरचें» छुएं: टिकट अपने आप खुरचता है।\n2. ऊपर 2 भाग्यशाली नंबर। नीचे 6 नंबर, हर एक का अपना इनाम।\n3. आपका कोई नंबर भाग्यशाली नंबर से मिले तो उसका इनाम आपका: ×0.5 से ×200 तक।',
      zh: '1. 设定金额并点击“刮奖”：卡片会自动刮开。\n2. 上方有 2 个幸运号码，下方有 6 个号码，各带奖金。\n3. 你的号码与幸运号码相同即赢得该奖金：×0.5 至 ×200。'
    }
  });

  /* =============================== MYSTERY BOXES =============================== */
  // the chosen gift box holds: empty · ×0.5 · ×1.2 · ×2 · ×5 · ×15 · ×100
  var PB = [0, 0.5, 1.2, 2, 5, 15, 100], PBC = [['#F472B6', '#9D174D'], ['#60A5FA', '#1E3A8A'], ['#34D399', '#065F46'], ['#FBBF24', '#92400E'], ['#C084FC', '#581C87']], PBX = [36, 93, 150, 207, 264];
  function giftBox(j) { var c = PBC[j]; return '<g class="pb-b" id="pbB' + j + '" data-o="' + j + '"><ellipse cy="40" rx="28" ry="6" fill="#000" opacity=".3"/><rect x="-24" y="-4" width="48" height="44" rx="4" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="2"/><rect x="-5" y="-4" width="10" height="44" fill="#FEF3C7"/>' +
    '<g class="pb-lid"><rect x="-28" y="-16" width="56" height="14" rx="4" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="2"/><rect x="-5" y="-16" width="10" height="14" fill="#FEF3C7"/><path d="M0-16c-14-14-22-2-10 0M0-16c14-14 22-2 10 0" stroke="#FEF3C7" stroke-width="4" fill="none"/></g>' +
    '<g class="pb-prize" opacity="0"><text y="-30" text-anchor="middle" font-size="15" font-weight="900" fill="#FDE68A" stroke="#78350F" stroke-width="3" paint-order="stroke" font-family="var(--cg-font),Arial"></text></g><ellipse class="pb-ring" cy="44" rx="30" ry="7" fill="none" stroke="#FBBF24" stroke-width="3" opacity="0"/></g>'; }
  game({
    key: 'pickbox', verb: V.open, rows: PB, sel0: 2, vb: '0 46 300 150',
    chips: PB.slice(1).map(function (m, j) { return ['<rect x="-8" y="-5" width="16" height="12" rx="2" fill="' + PBC[j % 5][0] + '"/><rect x="-10" y="-9" width="20" height="5" rx="1.5" fill="' + PBC[j % 5][0] + '"/><rect x="-1.5" y="-9" width="3" height="16" fill="#FEF3C7"/>', m]; }),
    chipOf: function (i) { return i > 0 ? i - 1 : -1; },
    scene: '<defs>' + GOLDG + '<radialGradient id="pbBg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#7C3AED" stop-opacity=".55"/><stop offset="1" stop-color="#1E1B4B" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#1E1035"/><ellipse cx="150" cy="120" rx="200" ry="120" fill="url(#pbBg)"/>' +
      '<path d="M-400 190H700" stroke="#4C1D95" stroke-width="40"/><path d="M-400 172H700" stroke="#FBBF24" stroke-opacity=".5" stroke-width="2"/>' +
      [30, 80, 140, 200, 260].map(function (x, j) { return '<g transform="translate(' + x + ' ' + (30 + (j % 2) * 16) + ')" opacity=".55">' + STAR(5, '#FDE68A') + '</g>'; }).join('') +
      PBX.map(function (x, j) { return '<g transform="translate(' + x + ' 128)">' + giftBox(j) + '</g>'; }).join('') + '<g id="cyFx"></g>',
    init: function (c) {
      c.qa('.pb-b').forEach(function (b) { b.addEventListener('click', function () { if (c.box.classList.contains('cy-busy')) return; c.pick = +b.getAttribute('data-o'); c.ring(); }); });
      c.pick = 2;
      c.ring = function () { c.qa('.pb-b').forEach(function (b, j) { b.querySelector('.pb-ring').setAttribute('opacity', j === c.pick ? '1' : '0'); }); };
      c.close = function () { c.qa('.pb-b').forEach(function (b) { b.querySelector('.pb-lid').removeAttribute('transform'); b.querySelector('.pb-lid').removeAttribute('opacity'); b.querySelector('.pb-prize').setAttribute('opacity', '0'); b.classList.remove('dim', 'got'); }); };
      c.ring();
    },
    reset: function (c) { c.close(); },
    play: async function (c, r) {
      var i = +r.view.i, j0 = c.demo ? rnd(5) : c.pick, b = c.id('pbB' + j0);
      if (c.demo) { c.pick = j0; c.ring(); }
      await tw(c.box, 600, function (k) { b.setAttribute('transform', 'rotate(' + (Math.sin(k * 30) * 6 * (1 - k)).toFixed(1) + ')'); });
      b.removeAttribute('transform');
      var show = function (bb, m, dim) { var pr = bb.querySelector('.pb-prize'); pr.querySelector('text').textContent = m > 0 ? xm(m) : '—'; if (dim) bb.classList.add('dim'); return tw(c.box, 380, function (k) { bb.querySelector('.pb-lid').setAttribute('transform', 'translate(0 ' + (-k * 14).toFixed(1) + ')'); bb.querySelector('.pb-lid').setAttribute('opacity', (1 - k * 0.7).toFixed(2)); pr.setAttribute('opacity', k.toFixed(2)); pr.setAttribute('transform', 'translate(0 ' + (-k * 6).toFixed(1) + ')'); }); };
      c.snd('whoosh');
      await show(b, PB[i]);
      if (PB[i] > 0) { b.classList.add('got'); c.sfx('reveal'); await burst(c, PBX[j0], 96); } else await wait(c.box, 300);
      for (var j = 0; j < 5; j++) if (j !== j0) { show(c.id('pbB' + j), PB[rnd(PB.length - 1)], true).catch(function () { /* left the game */ }); await wait(c.box, 90); }
      await wait(c.box, 300);
    },
    rules: {
      en: '1. Tap the gift box you want (it shines), set your stake and tap “Open”.\n2. Your box opens: empty, ×0.5, ×1.2, ×2, ×5, ×15 or the jackpot ×100.\n3. Then the other boxes open too, just to show what they held.',
      fr: '1. Touche la boîte cadeau que tu veux (elle brille), choisis ta mise et touche « Ouvrir ».\n2. Ta boîte s’ouvre : vide, ×0.5, ×1.2, ×2, ×5, ×15 ou le gros lot ×100.\n3. Les autres boîtes s’ouvrent ensuite, juste pour montrer ce qu’elles cachaient.',
      es: '1. Toca la caja de regalo que quieras (brilla), elige tu apuesta y toca «Abrir».\n2. Tu caja se abre: vacía, ×0.5, ×1.2, ×2, ×5, ×15 o el premio mayor ×100.\n3. Luego se abren las demás, solo para mostrar lo que tenían.',
      pt: '1. Toque na caixa de presente que quiser (ela brilha), escolha o valor e toque em «Abrir».\n2. Sua caixa abre: vazia, ×0.5, ×1.2, ×2, ×5, ×15 ou o prêmio máximo ×100.\n3. Depois as outras abrem, só para mostrar o que tinham.',
      ar: '1. المس صندوق الهدايا الذي تريده (يلمع)، اختر رهانك والمس «افتح».\n2. يُفتح صندوقك: فارغ، ×0.5، ×1.2، ×2، ×5، ×15 أو الجائزة الكبرى ×100.\n3. ثم تُفتح الصناديق الأخرى لترى ما كان فيها فقط.',
      tr: '1. İstediğin hediye kutusuna dokun (parlar), bahsini seç ve “Aç”a dokun.\n2. Kutun açılır: boş, ×0.5, ×1.2, ×2, ×5, ×15 ya da büyük ikramiye ×100.\n3. Sonra diğer kutular da açılır, sadece içlerini göstermek için.',
      vi: '1. Chạm hộp quà bạn muốn (nó sáng lên), chọn mức cược rồi chạm «Mở».\n2. Hộp của bạn mở ra: trống, ×0.5, ×1.2, ×2, ×5, ×15 hoặc giải lớn ×100.\n3. Sau đó các hộp khác cũng mở, chỉ để cho xem bên trong.',
      id: '1. Sentuh kotak hadiah pilihanmu (bersinar), atur taruhan lalu sentuh «Buka».\n2. Kotakmu terbuka: kosong, ×0.5, ×1.2, ×2, ×5, ×15 atau jackpot ×100.\n3. Lalu kotak lain ikut terbuka, hanya untuk menunjukkan isinya.',
      ru: '1. Нажмите на нужную подарочную коробку (она светится), выберите ставку и нажмите «Открыть».\n2. Ваша коробка открывается: пусто, ×0.5, ×1.2, ×2, ×5, ×15 или джекпот ×100.\n3. Потом открываются остальные — просто показать, что в них было.',
      de: '1. Tippe auf die Geschenkbox, die du willst (sie leuchtet), wähle deinen Einsatz und tippe auf „Öffnen“.\n2. Deine Box öffnet sich: leer, ×0.5, ×1.2, ×2, ×5, ×15 oder der Jackpot ×100.\n3. Danach öffnen sich die anderen, nur um zu zeigen, was drin war.',
      hi: '1. जो गिफ्ट बॉक्स चाहिए उसे छुएं (वह चमकेगा), राशि चुनें और «खोलें» छुएं।\n2. आपका बॉक्स खुलता है: खाली, ×0.5, ×1.2, ×2, ×5, ×15 या जैकपॉट ×100।\n3. फिर बाकी बॉक्स भी खुलते हैं, बस यह दिखाने को कि उनमें क्या था।',
      zh: '1. 点选你想要的礼盒（会发光），设定金额并点击“打开”。\n2. 你的礼盒打开：空、×0.5、×1.2、×2、×5、×15 或大奖 ×100。\n3. 随后其他礼盒也会打开，只是展示里面有什么。'
    }
  });

  /* =============================== LUCKY LADDER =============================== */
  // line i = the climber stops on rung i+1 (of 10): rungs 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, 10 ×100
  var LD = [0, 0, 0.5, 1, 1.5, 2.5, 4, 8, 20, 100];
  function rungY(n) { return 232 - n * 21; } // n = 1…10
  game({
    key: 'ladder', verb: V.climb, rows: LD,
    scene: '<defs>' + GOLDG + '<linearGradient id="ldSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0C4A6E"/><stop offset="1" stop-color="#38BDF8"/></linearGradient>' +
      '<linearGradient id="ldWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D97706"/><stop offset="1" stop-color="#78350F"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#ldSky)"/>' +
      '<g fill="#fff" opacity=".7"><ellipse cx="40" cy="60" rx="26" ry="9"/><ellipse cx="58" cy="54" rx="16" ry="9"/><ellipse cx="250" cy="110" rx="30" ry="9"/><ellipse cx="236" cy="104" rx="16" ry="8"/></g>' +
      '<path d="M-400 236H700V700H-400z" fill="#16A34A"/>' +
      '<g transform="translate(150 0)"><path d="M-30 244V12M30 244V12" stroke="url(#ldWood)" stroke-width="8" stroke-linecap="round"/>' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { var y = rungY(n), m = LD[n - 1]; return '<g class="ld-r" id="ldR' + n + '"><rect x="-30" y="' + (y - 3) + '" width="60" height="7" rx="3" fill="url(#ldWood)"/>' +
        '<g transform="translate(' + (n % 2 ? 58 : -58) + ' ' + (y + 1) + ')"><rect x="-26" y="-10" width="52" height="20" rx="10" class="ld-tag"/><text y="5.5" text-anchor="middle" font-size="13" font-weight="900" font-family="var(--cg-font),Arial" class="ld-tx">' + (m ? xm(m) : '×0') + '</text></g></g>'; }).join('') +
      '<g transform="translate(0 0)">' + STAR(13, 'url(#cyGold)') + '</g></g>' +
      '<g id="ldMan"><ellipse cy="2" rx="9" ry="3" fill="#000" opacity=".25"/><path d="M-6 0l3-14h6l3 14" stroke="#1E3A8A" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="-7" y="-28" width="14" height="16" rx="5" fill="#EF4444"/>' +
        '<path class="ld-arm" d="M-7-24l-8-10M7-24l8-10" stroke="#FCD34D" stroke-width="3.5" stroke-linecap="round"/><circle cy="-35" r="7" fill="#FCD34D"/><path d="M-7-37a7 7 0 0 1 14 0z" fill="#1E3A8A"/></g><g id="cyFx"></g>',
    init: function (c) { c.man = c.id('ldMan'); c.place = function (n) { tr(c.man, 150, n ? rungY(n) - 2 : 238); }; c.place(0); },
    reset: function (c) { c.place(0); c.qa('.ld-r').forEach(function (e) { e.classList.remove('on', 'end', 'crack'); }); c.man.removeAttribute('opacity'); },
    play: async function (c, r) {
      var top = +r.view.i + 1;
      for (var n = 1; n <= top; n++) {
        var y0 = n === 1 ? 238 : rungY(n - 1) - 2, y1 = rungY(n) - 2;
        await tw(c.box, n > 7 ? 330 : 230, function (k) { tr(c.man, 150 + Math.sin(k * Math.PI) * 3, lerp(y0, y1, ease(k))); });
        c.id('ldR' + n).classList.add('on'); c.sfx('step', { k: n });
      }
      if (top < 10) { // the next rung breaks: the climb ends here
        var nx = c.id('ldR' + (top + 1)); nx.classList.add('crack');
        await tw(c.box, 300, function (k) { tr(c.man, 150 + Math.sin(k * 40) * 3, rungY(top) - 2); });
      }
      c.id('ldR' + top).classList.add('end');
      if (LD[top - 1] > 0) await burst(c, 150, rungY(top) - 30);
    },
    rules: {
      en: '1. Set your stake and tap “Climb”: the climber goes up the ladder rung after rung.\n2. He stops where a rung breaks. The rung he reaches pays the amount written next to it.\n3. Rungs 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, the star on top ×100.',
      fr: '1. Choisis ta mise et touche « Grimper » : le grimpeur monte l’échelle barreau après barreau.\n2. Il s’arrête là où un barreau casse. Le barreau atteint paie le gain écrit à côté.\n3. Barreaux 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, l’étoile en haut ×100.',
      es: '1. Elige tu apuesta y toca «Subir»: el escalador sube la escalera peldaño a peldaño.\n2. Se detiene donde un peldaño se rompe. El peldaño alcanzado paga lo escrito a su lado.\n3. Peldaños 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, la estrella de arriba ×100.',
      pt: '1. Escolha o valor e toque em «Subir»: o alpinista sobe a escada degrau por degrau.\n2. Ele para onde um degrau quebra. O degrau alcançado paga o valor escrito ao lado.\n3. Degraus 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, a estrela no topo ×100.',
      ar: '1. اختر رهانك والمس «اصعد»: يصعد المتسلق السلم درجة بعد درجة.\n2. يتوقف حيث تنكسر درجة. الدرجة التي يبلغها تربح المبلغ المكتوب بجانبها.\n3. الدرجتان 1–2 ×0، 3 ×0.5، 4 ×1، 5 ×1.5، 6 ×2.5، 7 ×4، 8 ×8، 9 ×20، النجمة في الأعلى ×100.',
      tr: '1. Bahsini seç ve “Tırman”a dokun: tırmanıcı merdiveni basamak basamak çıkar.\n2. Bir basamağın kırıldığı yerde durur. Ulaştığı basamak yanında yazan kazancı öder.\n3. Basamak 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, tepedeki yıldız ×100.',
      vi: '1. Chọn mức cược rồi chạm «Leo»: người leo trèo lên thang từng bậc.\n2. Anh ấy dừng ở chỗ một bậc bị gãy. Bậc đạt được trả số tiền ghi bên cạnh.\n3. Bậc 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, ngôi sao trên đỉnh ×100.',
      id: '1. Atur taruhan lalu sentuh «Panjat»: pemanjat naik tangga anak demi anak.\n2. Ia berhenti di anak tangga yang patah. Anak tangga yang dicapai membayar angka di sampingnya.\n3. Anak tangga 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, bintang di puncak ×100.',
      ru: '1. Выберите ставку и нажмите «Лезть»: верхолаз поднимается по лестнице ступенька за ступенькой.\n2. Он останавливается там, где ломается перекладина. Достигнутая ступенька платит сумму, написанную рядом.\n3. Ступеньки 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, звезда наверху ×100.',
      de: '1. Wähle deinen Einsatz und tippe auf „Klettern“: der Kletterer steigt Sprosse für Sprosse hinauf.\n2. Er hält dort, wo eine Sprosse bricht. Die erreichte Sprosse zahlt den Betrag daneben.\n3. Sprossen 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, der Stern oben ×100.',
      hi: '1. राशि चुनें और «चढ़ें» छुएं: पर्वतारोही सीढ़ी पर एक-एक डंडा चढ़ता है।\n2. जहां डंडा टूटता है वहीं रुकता है। जिस डंडे तक पहुंचा, उसके पास लिखी राशि मिलती है।\n3. डंडे 1–2 ×0, 3 ×0.5, 4 ×1, 5 ×1.5, 6 ×2.5, 7 ×4, 8 ×8, 9 ×20, ऊपर का तारा ×100।',
      zh: '1. 设定金额并点击“攀爬”：攀爬者一格一格爬上梯子。\n2. 遇到断掉的横档就停下。到达的那一格赔付旁边写的倍数。\n3. 第 1–2 格 ×0，3 ×0.5，4 ×1，5 ×1.5，6 ×2.5，7 ×4，8 ×8，9 ×20，顶上的星星 ×100。'
    }
  });

  /* =============================== HI-LO RUN =============================== */
  // 6 cards (13 ranks, A low): rises in a row from the first card 0…5 → ×0 · ×0.6 · ×2.3 · ×9.2 · ×50 · ×400
  var HL = [0, 0.6, 2.3, 9.2, 50, 400], RK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var SUIT = ['M0-9C-5-15-14-10-12-3-10 3 0 9 0 9S10 3 12-3C14-10 5-15 0-9z', 'M0-11L9 0 0 11-9 0z', 'M0-12C-4-6-12-4-12 2s8 6 10 2l-2 8h8l-2-8c2 4 10 4 10-2S4-6 0-12z', 'M0-12C3-7 11-3 11 2c0 5-7 6-9 2l1 8H-3l1-8c-2 4-9 3-9-2C-11-3-3-7 0-12z'];
  function card(rank, s, w) { // a playing card (w wide), face up
    var red = s < 2, col = red ? '#DC2626' : '#111827', h = w * 1.4;
    return '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (w * 0.12) + '" fill="#fff" stroke="#CBD5E1" stroke-width="1.4"/>' +
      '<text x="' + (-w / 2 + w * 0.1) + '" y="' + (-h / 2 + w * 0.36) + '" font-size="' + (w * 0.3) + '" font-weight="900" fill="' + col + '" font-family="var(--cg-font),Arial">' + RK[rank] + '</text>' +
      '<path d="' + SUIT[s] + '" fill="' + col + '" transform="translate(0 ' + (h * 0.08) + ') scale(' + (w / 34) + ')"/>';
  }
  function back(w) { var h = w * 1.4; return '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (w * 0.12) + '" fill="#4F46E5" stroke="#FDE68A" stroke-width="2"/><rect x="' + (-w / 2 + 4) + '" y="' + (-h / 2 + 4) + '" width="' + (w - 8) + '" height="' + (h - 8) + '" rx="' + (w * 0.08) + '" fill="none" stroke="#C7D2FE" stroke-width="1.2" stroke-dasharray="3 3"/><g transform="scale(' + (w / 40) + ')">' + STAR(8, '#FDE68A') + '</g>'; }
  // a sequence of 6 ranks whose run (strictly higher, from the first card) is exactly r
  function hlSeq(r) {
    var up = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, r + 1).sort(function (a, b) { return a - b; }), s = up.slice();
    if (r < 5) { s.push(rnd(up[r] + 1)); while (s.length < 6) s.push(rnd(13)); }
    return s;
  }
  var HLX = [30, 78, 126, 174, 222, 270];
  game({
    key: 'hilorun', verb: V.deal, rows: HL,
    chips: [1, 2, 3, 4, 5].map(function (n) { return ['<path d="M-6 4l6-8 6 8" stroke="#4ADE80" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="0" y="12" text-anchor="middle" font-size="8" font-weight="900" fill="#fff">' + n + '</text>', HL[n]]; }),
    chipOf: function (i) { return i > 0 ? i - 1 : -1; },
    scene: '<defs><radialGradient id="hlFelt" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#15803D"/><stop offset="1" stop-color="#052E16"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#hlFelt)"/><ellipse cx="150" cy="128" rx="160" ry="100" fill="none" stroke="#FDE68A" stroke-opacity=".25" stroke-width="2"/>' +
      HLX.map(function (x, j) { return '<g class="hl-c" id="hlC' + j + '" transform="translate(' + x + ' 128)"></g><g class="hl-a" id="hlA' + j + '" transform="translate(' + x + ' 76)"></g>'; }).join('') +
      '<g id="cyFx"></g>',
    init: function (c) { c.backs = function () { HLX.forEach(function (x, j) { var g = c.id('hlC' + j); g.innerHTML = back(44); g.classList.remove('dim'); c.id('hlA' + j).innerHTML = ''; tr(g, x, 128); }); }; c.backs(); },
    reset: function (c) { c.backs(); },
    play: async function (c, r) {
      var run = +r.view.i, s = hlSeq(run), su = s.map(function () { return rnd(4); });
      for (var j = 0; j < 6; j++) {
        var g = c.id('hlC' + j), x = HLX[j], rk = s[j], st = su[j], flipped = false, over = j > run + 1;
        await tw(c.box, 300, function (k) { var sx = Math.abs(Math.cos(k * Math.PI)); if (k >= 0.5 && !flipped) { flipped = true; g.innerHTML = card(rk, st, 44); } g.setAttribute('transform', 'translate(' + x + ' ' + (128 - Math.sin(k * Math.PI) * 10).toFixed(1) + ') scale(' + Math.max(0.02, sx).toFixed(3) + ' 1)'); });
        g.setAttribute('transform', 'translate(' + x + ' 128)');
        if (j === 0) { c.sfx('card'); continue; }
        if (j <= run) { c.id('hlA' + j).innerHTML = '<circle r="12" fill="#16A34A"/><path d="M-6 4l6-8 6 8" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; c.sfx('step', { k: j }); }
        else if (j === run + 1) { c.id('hlA' + j).innerHTML = '<circle r="12" fill="#DC2626"/><path d="M-5-5l10 10M5-5l-10 10" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>'; c.sfx('card'); }
        else g.classList.add('dim');
        if (over) await wait(c.box, 10);
      }
      if (run > 0) await burst(c, HLX[run], 128);
    },
    rules: {
      en: '1. Set your stake and tap “Deal”: 6 cards turn over one by one (A is the lowest, K the highest).\n2. Each card higher than the one before extends your run; a lower or equal card stops it.\n3. Run of 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (all 6 rising) ×400.',
      fr: '1. Choisis ta mise et touche « Distribuer » : 6 cartes se retournent une à une (l’As est la plus basse, le Roi la plus haute).\n2. Chaque carte plus haute que la précédente allonge ta série ; une carte plus basse ou égale l’arrête.\n3. Série de 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (les 6 montent) ×400.',
      es: '1. Elige tu apuesta y toca «Repartir»: 6 cartas se voltean una a una (el As es la más baja, el Rey la más alta).\n2. Cada carta más alta que la anterior alarga tu racha; una más baja o igual la detiene.\n3. Racha de 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (las 6 suben) ×400.',
      pt: '1. Escolha o valor e toque em «Distribuir»: 6 cartas viram uma a uma (o Ás é a mais baixa, o Rei a mais alta).\n2. Cada carta mais alta que a anterior aumenta sua sequência; uma mais baixa ou igual a interrompe.\n3. Sequência de 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (as 6 sobem) ×400.',
      ar: '1. اختر رهانك والمس «وزّع»: تنقلب 6 أوراق واحدة تلو الأخرى (الآس الأدنى والملك الأعلى).\n2. كل ورقة أعلى من السابقة تطيل سلسلتك؛ والورقة الأدنى أو المساوية توقفها.\n3. سلسلة 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (الست كلها صاعدة) ×400.',
      tr: '1. Bahsini seç ve “Dağıt”a dokun: 6 kart tek tek açılır (As en düşük, Papaz en yüksek).\n2. Öncekinden yüksek her kart serini uzatır; düşük veya eşit kart seriyi bitirir.\n3. 1’lik seri ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (6’sı da yükselir) ×400.',
      vi: '1. Chọn mức cược rồi chạm «Chia bài»: 6 lá lần lượt lật lên (A thấp nhất, K cao nhất).\n2. Mỗi lá cao hơn lá trước kéo dài chuỗi của bạn; lá thấp hơn hoặc bằng sẽ dừng chuỗi.\n3. Chuỗi 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (cả 6 lá tăng dần) ×400.',
      id: '1. Atur taruhan lalu sentuh «Bagikan»: 6 kartu terbuka satu per satu (As terendah, K tertinggi).\n2. Setiap kartu lebih tinggi dari sebelumnya memperpanjang rangkaianmu; kartu lebih rendah atau sama menghentikannya.\n3. Rangkaian 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (keenamnya naik) ×400.',
      ru: '1. Выберите ставку и нажмите «Раздать»: 6 карт открываются по одной (туз — младшая, король — старшая).\n2. Каждая карта выше предыдущей продлевает серию; карта ниже или равная её обрывает.\n3. Серия 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (все 6 по возрастанию) ×400.',
      de: '1. Wähle deinen Einsatz und tippe auf „Geben“: 6 Karten werden nacheinander aufgedeckt (Ass ist die niedrigste, König die höchste).\n2. Jede Karte, die höher als die vorige ist, verlängert deine Serie; eine niedrigere oder gleiche beendet sie.\n3. Serie 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (alle 6 steigen) ×400.',
      hi: '1. राशि चुनें और «बांटें» छुएं: 6 पत्ते एक-एक कर खुलते हैं (इक्का सबसे छोटा, बादशाह सबसे बड़ा)।\n2. पिछले से बड़ा हर पत्ता आपकी लड़ी बढ़ाता है; छोटा या बराबर पत्ता उसे रोक देता है।\n3. लड़ी 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5 (सभी 6 बढ़ते) ×400।',
      zh: '1. 设定金额并点击“发牌”：6 张牌逐一翻开（A 最小，K 最大）。\n2. 每张比前一张大的牌延长你的连升；小于或等于前一张则停止。\n3. 连升 1 ×0.6 · 2 ×2.3 · 3 ×9.2 · 4 ×50 · 5（6 张全升）×400。'
    }
  });

  /* =============================== RED ENVELOPES =============================== */
  // 3 envelopes, prize = their total; each line is one fixed trio (same order as casino_ext/casa.php)
  var ENV = [[0, 0, 0], [0, 0.2, 0.2], [0, 0.2, 0.5], [0.2, 0.5, 0.5], [0, 0.5, 1], [0.5, 1, 1], [1, 2, 2], [2, 5, 5], [8, 8, 8], [88, 8, 8]];
  var ENVM = ENV.map(function (t) { return Math.round((t[0] + t[1] + t[2]) * 100) / 100; });
  var EVX = [45, 115, 185, 255], EVY = [62, 150];
  function envSvg(j) { return '<g class="ev-e" id="evE' + j + '" data-o="' + j + '"><rect x="-26" y="-36" width="52" height="72" rx="6" fill="#DC2626" stroke="#7F1D1D" stroke-width="1.6"/><path class="ev-flap" d="M-26-36L0-12 26-36z" fill="#B91C1C" stroke="#7F1D1D" stroke-width="1.4"/>' +
    '<circle cy="-8" r="11" fill="url(#cyGold)" stroke="#92400E"/><path d="M-5-8h10M0-13v10" stroke="#92400E" stroke-width="2"/><rect class="ev-sel" x="-30" y="-40" width="60" height="80" rx="9" fill="none" stroke="#FDE68A" stroke-width="3" opacity="0"/>' +
    '<g class="ev-v" opacity="0"><rect x="-24" y="4" width="48" height="24" rx="6" fill="#FEF3C7"/><text y="22" text-anchor="middle" font-size="15" font-weight="900" fill="#92400E" font-family="var(--cg-font),Arial"></text></g></g>'; }
  game({
    key: 'envelope', verb: V.open, rows: ENVM,
    chips: [[0, 1.2], [0, 2.5], [0, 5], [0, 24], [0, 104]].map(function (q, j) { return ['<rect x="-6" y="-8" width="12" height="16" rx="2" fill="#DC2626"/><circle cy="-1" r="3" fill="#FBBF24"/>', q[1]]; }),
    chipOf: function (i) { return [3, 5, 6, 8, 9].indexOf(i); },
    scene: '<defs>' + GOLDG + '</defs><rect x="-400" y="-400" width="1100" height="1100" fill="#450A0A"/>' +
      '<g opacity=".25" fill="none" stroke="#FBBF24" stroke-width="1.4">' + [0, 1, 2, 3, 4, 5, 6].map(function (j) { return '<circle cx="' + (j * 50) + '" cy="' + (j % 2 ? 0 : 250) + '" r="40"/>'; }).join('') + '</g>' +
      EVY.map(function (y, r) { return EVX.map(function (x, cc) { return '<g transform="translate(' + x + ' ' + y + ')">' + envSvg(r * 4 + cc) + '</g>'; }).join(''); }).join('') +
      '<g transform="translate(150 224)"><rect x="-62" y="-17" width="124" height="34" rx="17" fill="#7F1D1D" stroke="url(#cyGold)" stroke-width="2.4"/><text id="evTot" y="8" text-anchor="middle" font-size="22" font-weight="900" fill="#FDE68A" font-family="var(--cg-font),Arial">×0</text></g><g id="cyFx"></g>',
    init: function (c) {
      c.chosen = [];
      c.paintSel = function () { c.qa('.ev-e').forEach(function (e) { e.querySelector('.ev-sel').setAttribute('opacity', c.chosen.indexOf(+e.getAttribute('data-o')) >= 0 ? '1' : '0'); }); };
      c.qa('.ev-e').forEach(function (e) { e.addEventListener('click', function () { if (c.box.classList.contains('cy-busy') || c.demo) return; var j = +e.getAttribute('data-o'), q = c.chosen.indexOf(j); if (q >= 0) c.chosen.splice(q, 1); else { c.chosen.push(j); if (c.chosen.length > 3) c.chosen.shift(); } c.paintSel(); }); });
      c.shut = function () { c.qa('.ev-e').forEach(function (e) { e.classList.remove('open', 'dim'); e.querySelector('.ev-v').setAttribute('opacity', '0'); e.querySelector('.ev-flap').removeAttribute('transform'); }); c.id('evTot').textContent = '×0'; };
      c.chosen = [1, 2, 5]; c.paintSel();
    },
    reset: function (c) { c.shut(); },
    play: async function (c, r) {
      var i = +r.view.i, vals = shuffle(ENV[i].slice()), pick = c.chosen.slice();
      if (c.demo || pick.length < 3) { var rest = shuffle([0, 1, 2, 3, 4, 5, 6, 7].filter(function (j) { return pick.indexOf(j) < 0; })); pick = (c.demo ? [] : pick).concat(rest).slice(0, 3); c.chosen = pick; c.paintSel(); }
      var tot = 0;
      c.qa('.ev-e').forEach(function (e) { if (pick.indexOf(+e.getAttribute('data-o')) < 0) e.classList.add('dim'); });
      for (var j = 0; j < 3; j++) {
        var e = c.id('evE' + pick[j]), v = vals[j];
        await tw(c.box, 360, function (k) { e.querySelector('.ev-flap').setAttribute('transform', 'scale(1 ' + (1 - 2 * k).toFixed(2) + ') translate(0 ' + (k * -4).toFixed(1) + ')'); });
        var vv = e.querySelector('.ev-v'); vv.querySelector('text').textContent = v > 0 ? xm(v) : '—'; vv.setAttribute('opacity', '1'); e.classList.add('open');
        tot = Math.round((tot + v) * 100) / 100; c.id('evTot').textContent = xm(tot);
        if (v > 0) c.sfx('reveal', { k: j + 1 }); else c.sfx('tick');
        await wait(c.box, 220);
      }
      if (tot >= 1) await burst(c, 150, 200, '#FCA5A5');
    },
    rules: {
      en: '1. Tap 3 red envelopes (or let luck choose), set your stake and tap “Open”.\n2. The 3 envelopes open one by one; each holds an amount (or nothing).\n3. You win the total of the 3, from ×0.4 up to ×104 (two 8s and a lucky 88).',
      fr: '1. Touche 3 enveloppes rouges (ou laisse le hasard choisir), choisis ta mise et touche « Ouvrir ».\n2. Les 3 enveloppes s’ouvrent une à une ; chacune contient un montant (ou rien).\n3. Tu gagnes le total des 3, de ×0.4 jusqu’à ×104 (deux 8 et un 88 porte-bonheur).',
      es: '1. Toca 3 sobres rojos (o deja que la suerte elija), elige tu apuesta y toca «Abrir».\n2. Los 3 sobres se abren uno a uno; cada uno guarda una cantidad (o nada).\n3. Ganas el total de los 3, de ×0.4 hasta ×104 (dos 8 y un 88 de la suerte).',
      pt: '1. Toque em 3 envelopes vermelhos (ou deixe a sorte escolher), escolha o valor e toque em «Abrir».\n2. Os 3 envelopes abrem um a um; cada um guarda um valor (ou nada).\n3. Você ganha o total dos 3, de ×0.4 até ×104 (dois 8 e um 88 da sorte).',
      ar: '1. المس 3 مغلفات حمراء (أو دع الحظ يختار)، اختر رهانك والمس «افتح».\n2. تُفتح المغلفات الثلاثة واحدًا تلو الآخر؛ في كل منها مبلغ (أو لا شيء).\n3. تربح مجموع الثلاثة، من ×0.4 حتى ×104 (رقمان 8 و88 المحظوظ).',
      tr: '1. 3 kırmızı zarfa dokun (ya da şansa bırak), bahsini seç ve “Aç”a dokun.\n2. 3 zarf tek tek açılır; her birinde bir miktar (ya da hiçbir şey) vardır.\n3. 3’ünün toplamını kazanırsın: ×0.4’ten ×104’e kadar (iki 8 ve şanslı 88).',
      vi: '1. Chạm 3 bao lì xì (hoặc để may mắn chọn), chọn mức cược rồi chạm «Mở».\n2. 3 bao lần lượt mở ra; mỗi bao có một số tiền (hoặc trống).\n3. Bạn thắng tổng của 3 bao, từ ×0.4 tới ×104 (hai số 8 và số 88 may mắn).',
      id: '1. Sentuh 3 angpao merah (atau biarkan keberuntungan memilih), atur taruhan lalu sentuh «Buka».\n2. Ketiga angpao terbuka satu per satu; masing-masing berisi jumlah (atau kosong).\n3. Kamu memenangkan total ketiganya, dari ×0.4 hingga ×104 (dua 8 dan 88 keberuntungan).',
      ru: '1. Нажмите на 3 красных конверта (или доверьтесь удаче), выберите ставку и нажмите «Открыть».\n2. Три конверта открываются по одному; в каждом сумма (или пусто).\n3. Вы выигрываете сумму трёх: от ×0.4 до ×104 (две 8 и счастливое 88).',
      de: '1. Tippe auf 3 rote Umschläge (oder lass das Glück wählen), wähle deinen Einsatz und tippe auf „Öffnen“.\n2. Die 3 Umschläge öffnen sich nacheinander; jeder enthält einen Betrag (oder nichts).\n3. Du gewinnst die Summe der 3, von ×0.4 bis ×104 (zwei 8er und eine Glücks-88).',
      hi: '1. 3 लाल लिफाफे छुएं (या किस्मत पर छोड़ें), राशि चुनें और «खोलें» छुएं।\n2. तीनों लिफाफे एक-एक कर खुलते हैं; हर एक में कोई राशि (या कुछ नहीं) है।\n3. तीनों का जोड़ आपका: ×0.4 से ×104 तक (दो 8 और भाग्यशाली 88)।',
      zh: '1. 点选 3 个红包（或交给运气），设定金额并点击“打开”。\n2. 3 个红包逐一打开，每个里面有一个金额（或空）。\n3. 你赢得 3 个的总和：×0.4 至 ×104（两个 8 和一个幸运 88）。'
    }
  });

  /* =============================== PIRATE MAP =============================== */
  // 4 islands, the treasure is on island 0 / 1 / 2 / 3 with chance 40 · 30 · 20 · 10 % → ×2.34 · ×3.13 · ×4.69 · ×9.39 (server)
  var TM = [0.4, 0.3, 0.2, 0.1], TMC = ['#22C55E', '#38BDF8', '#F472B6', '#FBBF24'], TMP = [[70, 70], [232, 64], [66, 186], [236, 182]];
  function island(j) { var s = [1.25, 1.05, 0.9, 0.72][j]; return '<g class="tm-i" id="tmI' + j + '" data-o="' + j + '" transform="translate(' + TMP[j][0] + ' ' + TMP[j][1] + ')"><g transform="scale(' + s + ')"><ellipse rx="36" ry="20" fill="#E9C98B" stroke="#A16207" stroke-width="2"/><ellipse rx="26" ry="13" fill="#4D7C0F" opacity=".75"/>' +
    '<path d="M6-4q2-16 0-28M6-32q-12-2-18 6M6-32q12-4 18 4M6-32q-4-10-14-10M6-32q6-10 16-8" stroke="#166534" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
    '<circle class="tm-dot" cx="-34" cy="-24" r="9" fill="' + TMC[j] + '" stroke="#fff" stroke-width="2"/><text x="-34" y="-20" text-anchor="middle" font-size="11" font-weight="900" fill="#fff" font-family="var(--cg-font),Arial">' + (j + 1) + '</text>' +
    '<ellipse class="tm-ring" rx="' + (44 * s) + '" ry="' + (26 * s) + '" fill="none" stroke="#B91C1C" stroke-width="3" stroke-dasharray="6 5" opacity="0"/><g class="tm-x" opacity="0"><path d="M-10-10L10 10M10-10L-10 10" stroke="#B91C1C" stroke-width="5" stroke-linecap="round"/></g>' +
    '<g class="tm-ch" opacity="0" transform="translate(0 -6)"><rect x="-13" y="-8" width="26" height="16" rx="2" fill="#92400E" stroke="#451A03"/><path d="M-13-8q13-12 26 0" fill="#B45309" stroke="#451A03"/><rect x="-3" y="-4" width="6" height="6" fill="url(#cyGold)"/><circle cx="-8" cy="-12" r="3.4" fill="url(#cyGold)"/><circle cx="6" cy="-13" r="3" fill="url(#cyGold)"/></g></g>'; }
  game({
    key: 'treasure', verb: V.sail, pick: 4, pickW: function () { var x = Math.random(), a = 0; for (var j = 0; j < 4; j++) { a += TM[j]; if (x < a) return j; } return 3; },
    opts: function () { return '<div class="cg-opts cy-opts">' + TM.map(function (p, j) { return '<button type="button" data-o="' + j + '"><b class="fit"><i style="background:' + TMC[j] + '">' + (j + 1) + '</i> ' + Math.round(p * 100) + '%</b><small class="fit">' + xm(pmult(p)) + '</small></button>'; }).join('') + '</div>'; },
    scene: '<defs>' + GOLDG + '<radialGradient id="tmPaper" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".8" stop-color="#FCD34D"/><stop offset="1" stop-color="#B45309"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#3B1D0B"/><path d="M8 14Q150 -2 292 14L288 236Q150 252 12 236z" fill="url(#tmPaper)" stroke="#78350F" stroke-width="3"/>' +
      '<path d="M8 14Q150 -2 292 14L288 236Q150 252 12 236z" fill="#38BDF8" opacity=".18"/>' +
      '<g stroke="#0369A1" stroke-width="1.4" fill="none" opacity=".35">' + [40, 100, 160, 210].map(function (y) { return '<path d="M30 ' + y + 'q10-6 20 0t20 0M190 ' + (y + 14) + 'q10-6 20 0t20 0"/>'; }).join('') + '</g>' +
      '<g transform="translate(150 125)" opacity=".5"><circle r="22" fill="none" stroke="#78350F" stroke-width="1.4"/><path d="M0-30L5 0 0 30-5 0z" fill="#78350F"/><path d="M-30 0L0 5 30 0 0-5z" fill="#78350F" opacity=".6"/></g>' +
      '<path id="tmPath" d="" stroke="#7F1D1D" stroke-width="2.4" stroke-dasharray="5 6" fill="none"/>' +
      [0, 1, 2, 3].map(island).join('') +
      '<g id="tmShip" transform="translate(150 125)"><path d="M-14 4h28l-6 9h-16z" fill="#78350F"/><path d="M0 4V-18" stroke="#451A03" stroke-width="2"/><path d="M0-17q12 6 0 16z" fill="#F8FAFC"/><path d="M0-18l-9 3 9 3z" fill="#111827"/></g><g id="cyFx"></g>',
    onSel: function (c, j) { c.qa('.tm-i').forEach(function (e, q) { e.querySelector('.tm-ring').setAttribute('opacity', q === j ? '1' : '0'); }); },
    init: function (c) {
      c.qa('.tm-i').forEach(function (e) { e.addEventListener('click', function () { if (c.box.classList.contains('cy-busy') || c.demo) return; c.pickOpt(+e.getAttribute('data-o')); }); });
      c.home = function () { tr(c.id('tmShip'), 150, 125); c.id('tmPath').setAttribute('d', ''); c.qa('.tm-i').forEach(function (e) { e.querySelector('.tm-x').setAttribute('opacity', '0'); e.querySelector('.tm-ch').setAttribute('opacity', '0'); e.classList.remove('got'); }); };
    },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.home(); },
    play: async function (c, r) {
      var w = +r.view.w, P = TMP[w], ship = c.id('tmShip'), path = c.id('tmPath');
      // the ship visits islands on its way, then stops at the treasure
      var stops = shuffle([0, 1, 2, 3].filter(function (j) { return j !== w; })).slice(0, 1 + rnd(2)).concat([w]), x0 = 150, y0 = 125, d = 'M150 125';
      for (var s = 0; s < stops.length; s++) {
        var Q = TMP[stops[s]], tx = Q[0] + (Q[0] < 150 ? 40 : -40), ty = Q[1] + (Q[1] < 125 ? 26 : -26), ax = x0, ay = y0;
        d += 'L' + tx + ' ' + ty;
        c.sfx('tick');
        await tw(c.box, 700, function (k) { var e = ease(k); tr(ship, lerp(ax, tx, e), lerp(ay, ty, e) + Math.sin(k * 12) * 1.5, 1, Math.sin(k * 10) * 4); path.setAttribute('d', d.replace(/L[\d.]+ [\d.]+$/, '') + 'L' + lerp(ax, tx, e).toFixed(1) + ' ' + lerp(ay, ty, e).toFixed(1)); });
        path.setAttribute('d', d); x0 = tx; y0 = ty;
        if (s < stops.length - 1) await wait(c.box, 160);
      }
      var I = c.id('tmI' + w); I.querySelector('.tm-x').setAttribute('opacity', '1'); c.sfx('stop');
      await wait(c.box, 300);
      I.querySelector('.tm-x').setAttribute('opacity', '0'); I.querySelector('.tm-ch').setAttribute('opacity', '1'); I.classList.add('got');
      if (w === +r.view.pick) { c.sfx('reveal'); await burst(c, P[0], P[1] - 10); } else await wait(c.box, 300);
    },
    rules: {
      en: '1. Pick the island where you think the treasure is (its chance and payout are on its button), set your stake and tap “Sail”.\n2. The ship sails around the map and stops at the treasure.\n3. Right island: 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39. Another island: the stake is lost.',
      fr: '1. Choisis l’île où se cache le trésor (sa chance et son gain sont sur son bouton), ta mise, puis touche « Naviguer ».\n2. Le bateau navigue sur la carte et s’arrête au trésor.\n3. Bonne île : 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39. Une autre île : la mise est perdue.',
      es: '1. Elige la isla donde crees que está el tesoro (su probabilidad y su pago están en su botón), tu apuesta, y toca «Navegar».\n2. El barco navega por el mapa y se detiene en el tesoro.\n3. Isla correcta: 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39. Otra isla: pierdes la apuesta.',
      pt: '1. Escolha a ilha onde acha que está o tesouro (a chance e o pagamento estão no botão), o valor, e toque em «Navegar».\n2. O navio navega pelo mapa e para no tesouro.\n3. Ilha certa: 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39. Outra ilha: a aposta é perdida.',
      ar: '1. اختر الجزيرة التي تظن أن الكنز فيها (فرصتها وربحها على زرها)، ثم رهانك والمس «أبحر».\n2. تبحر السفينة على الخريطة وتتوقف عند الكنز.\n3. الجزيرة الصحيحة: 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39. جزيرة أخرى: تخسر الرهان.',
      tr: '1. Hazinenin olduğunu düşündüğün adayı seç (şansı ve ödemesi düğmesinde), bahsini belirle ve “Yelken aç”a dokun.\n2. Gemi haritada dolaşır ve hazinede durur.\n3. Doğru ada: %40 ×2.34 · %30 ×3.13 · %20 ×4.69 · %10 ×9.39. Başka ada: bahis kaybedilir.',
      vi: '1. Chọn hòn đảo bạn nghĩ có kho báu (cơ hội và tiền thưởng ghi trên nút), chọn mức cược rồi chạm «Ra khơi».\n2. Con tàu đi quanh bản đồ và dừng ở kho báu.\n3. Đúng đảo: 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39. Đảo khác: mất tiền cược.',
      id: '1. Pilih pulau tempat harta karun menurutmu (peluang dan bayarannya ada di tombolnya), atur taruhan, lalu sentuh «Berlayar».\n2. Kapal berlayar di peta dan berhenti di harta karun.\n3. Pulau yang benar: 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39. Pulau lain: taruhan hilang.',
      ru: '1. Выберите остров, где, по-вашему, клад (шанс и выплата на его кнопке), ставку и нажмите «Плыть».\n2. Корабль плывёт по карте и останавливается у клада.\n3. Верный остров: 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39. Другой остров — ставка проиграна.',
      de: '1. Wähle die Insel, auf der du den Schatz vermutest (Chance und Gewinn stehen auf ihrem Knopf), deinen Einsatz und tippe auf „Segeln“.\n2. Das Schiff segelt über die Karte und hält beim Schatz.\n3. Richtige Insel: 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39. Andere Insel: Einsatz verloren.',
      hi: '1. वह द्वीप चुनें जहां खज़ाना लगता है (उसका मौका और भुगतान बटन पर है), राशि चुनें और «चलाएं» छुएं।\n2. जहाज़ नक्शे पर घूमता है और खज़ाने पर रुकता है।\n3. सही द्वीप: 40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39। दूसरा द्वीप: दांव हार जाते हैं।',
      zh: '1. 选择你认为藏有宝藏的岛（概率和赔率写在按钮上），设定金额并点击“启航”。\n2. 船在地图上航行，停在宝藏所在的岛。\n3. 选对岛：40 % ×2.34 · 30 % ×3.13 · 20 % ×4.69 · 10 % ×9.39。其他岛：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
