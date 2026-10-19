/* casb5 — Pachinko, Ladder Lottery, Skee-Ball, Lucky Ducks (owner request, round 6) — instant games; the scene always shows exactly the line (or option) the server drew (casino_ext/casb.php). */
(function (D6) {
  'use strict';
  /* ---- petit kit commun des jeux casb (copié dans chaque fichier : un seul fichier chargé par jeu) ---- */
  var K = D6.CasinoKit, $ = K.$;
  var GONE = { gone: 1 };
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function Lx(T) { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function xm(v) { return '×' + String(v).replace('.', K.dec()); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pickW(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; var r = Math.random() * s; for (i = 0; i < a.length; i++) { r -= a[i]; if (r < 0) return i; } return a.length - 1; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ease(k) { return 1 - Math.pow(1 - k, 3); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function pm(p) { return Math.floor(0.94 / p * 100) / 100; } // gain d'une option « choix » (même calcul que le serveur)
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
  function rules(R) { ['fr', 'es', 'pt', 'tr', 'vi', 'id', 'ru', 'de'].forEach(function (k) { if (R[k]) R[k] = R[k].replace(/(\d)\.(\d)/g, '$1,$2'); }); return R; }
  // cartes et dés dessinés (aucune police spéciale : les couleurs ♠♥♦♣ sont des tracés)
  var SUIT = ['M0-6C-3-2-7 0-6 3.4-5 6.4-1.6 6-0.8 4.2L-2 7.6H2L0.8 4.2C1.6 6 5 6.4 6 3.4 7 0 3-2 0-6z', 'M0 6.4C-8 0-7.6-6.4-3.4-6.4-1.4-6.4 0-4.6 0-3.6 0-4.6 1.4-6.4 3.4-6.4 7.6-6.4 8 0 0 6.4z',
    'M0-7L5.4 0 0 7-5.4 0z', 'M0-6.6A2.9 2.9 0 0 1 2.4-2.2 2.9 2.9 0 1 1 1 2.6L2 6.6H-2L-1 2.6A2.9 2.9 0 1 1-2.4-2.2 2.9 2.9 0 0 1 0-6.6z'];
  var RK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  function suit(s, x, y, k) { return '<path d="' + SUIT[s] + '" transform="translate(' + x + ' ' + y + ') scale(' + k + ')" fill="' + (s === 1 || s === 2 ? '#DC2626' : '#111827') + '"/>'; }
  function card(c) { // carte 32 × 44 centrée sur 0,0
    if (!c) return '<rect x="-16" y="-22" width="32" height="44" rx="4" fill="#4C1D95" stroke="#E9D5FF" stroke-width="1.2"/><rect x="-12" y="-18" width="24" height="36" rx="2.5" fill="none" stroke="#C4B5FD" stroke-opacity=".6"/><path d="M0-9L6 0 0 9-6 0z" fill="#A78BFA" opacity=".8"/>';
    var red = c[1] === 1 || c[1] === 2;
    return '<rect x="-16" y="-22" width="32" height="44" rx="4" fill="#FFFDF7" stroke="#CBD5E1"/><text x="-12.5" y="-11" font-size="10.5" font-weight="900" fill="' + (red ? '#DC2626' : '#111827') + '" font-family="Arial,sans-serif"' + (c[0] === 10 ? ' letter-spacing="-1"' : '') + '>' + RK[c[0]] + '</text>' +
      suit(c[1], -8.5, -4, 0.5) + (c[0] > 10 ? '<rect x="-7" y="-1" width="17" height="19" rx="2" fill="' + (red ? '#FEE2E2' : '#E0E7FF') + '"/>' + suit(c[1], 1.5, 8.5, 1.05) : suit(c[1], 2.5, 7, 1.25));
  }
  function die(v, s, col) { var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v]; s = s || 1; return '<rect x="' + (-10 * s) + '" y="' + (-10 * s) + '" width="' + (20 * s) + '" height="' + (20 * s) + '" rx="' + (5 * s) + '" fill="' + (col || '#fff') + '" stroke="#CBD5E1"/>' + P.map(function (p) { return '<circle cx="' + (p[0] * 5.5 * s).toFixed(1) + '" cy="' + (p[1] * 5.5 * s).toFixed(1) + '" r="' + (2 * s).toFixed(1) + '" fill="' + (v === 1 ? '#DC2626' : '#111827') + '"/>'; }).join(''); }
  function bg(a, b) { return '<defs><linearGradient id="bg_' + a.slice(1) + b.slice(1) + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs><rect x="-400" y="-400" width="1100" height="1100" fill="url(#bg_' + a.slice(1) + b.slice(1) + ')"/>'; }
  function felt(id, a, b) { return '<defs><radialGradient id="' + id + '" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient></defs><rect x="-400" y="-400" width="1100" height="1100" fill="url(#' + id + ')"/>'; }
  function txt(x, y, s, size, fill, extra) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + size + '" font-weight="900" fill="' + fill + '" font-family="Arial,sans-serif"' + (extra || '') + '>' + s + '</text>'; }
  /* jeu instantané : scène SVG + bandeau des gains + terminal.
     o = { key, l(), vb, scene, chips: [[icône, mult, texte?]], chipOf(i, r), opts(l), init(c), params(c), reset(c), play(c, r), W: poids (démo), n: nombre d'options (démo) }
     Visiteur (pas connecté) : la scène joue toute seule des parties de démonstration (aucune mise, aucun son). */
  function game(o) {
    K.register(o.key, function (box) {
      var l = o.l(), busy = false;
      box.classList.add('cg-game', 'm4', 'cb', 'm4-' + o.key);
      box.innerHTML = '<div class="cg-stage m4-stage">' + (o.chips ? '<div class="m4-pay">' + o.chips.map(function (c, i) { return '<span data-c="' + i + '">' + (c[0] ? '<svg viewBox="-12 -12 24 24" aria-hidden="true">' + c[0] + '</svg>' : '') + '<b class="fit">' + (c[2] || xm(c[1])) + '</b></span>'; }).join('') + '</div>' : '') +
        '<div class="m4-scene"><svg class="m4-svg" viewBox="' + o.vb + '" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + o.scene + '</svg></div></div>' + K.stakePanel(l.verb, o.opts ? o.opts(l) : '');
      K.bindStake(box);
      var c = { box: box, l: l, svg: box.querySelector('.m4-svg'), q: function (s) { return box.querySelector(s); }, qa: function (s) { return [].slice.call(box.querySelectorAll(s)); },
        mark: function (i) { box.querySelectorAll('.m4-pay span').forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-c') === i); }); } };
      c.id = function (s) { return box.querySelector('#' + s); };
      c.sfx = function (ev, a) { if (!c.demo) K.sfx(ev, a); };
      // boutons de choix (.cg-opts > button[data-o]) : un seul choisi
      c.sel = 0;
      c.choose = function (j) { c.sel = j; c.qa('.cg-opts > button').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-o') === j); }); if (o.onPick) o.onPick(c, j); };
      c.qa('.cg-opts > button').forEach(function (b) { b.addEventListener('click', function () { if (busy || c.demo) return; c.choose(+b.getAttribute('data-o')); }); });
      if (o.init) o.init(c);
      if (c.qa('.cg-opts > button').length) c.choose(c.sel);
      requestAnimationFrame(function () { K.fitAll(box); });
      try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (box.isConnected) K.fitAll(box); }); } catch (e) { /* ignore */ }
      var go = $('csGo');
      if (go) go.addEventListener('click', async function () {
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
        } catch (e) {
          if (e !== GONE) { try { console.warn(e); } catch (e2) { /* ignore */ } if (r && !shown && box.isConnected) K.resultLine(box, r); }
        }
        finally { busy = false; if (box.isConnected) { go.disabled = false; box.classList.remove('m4-busy'); } }
      });
      // visiteur : parties de démonstration en boucle (le résultat est tiré ici, pour le spectacle seulement)
      if (K.guest()) {
        c.demo = true;
        (async function () {
          try {
            await wait(box, 900);
            while (box.isConnected && K.guest()) {
              var nOpt = c.qa('.cg-opts > button').length, fake;
              if (o.n) { var pk = rnd(nOpt || o.n); if (nOpt) c.choose(pk); var w = o.W ? pickW(o.W) : rnd(o.n); fake = { view: { w: w, pick: pk } }; }
              else { if (nOpt) c.choose(rnd(nOpt)); fake = { view: { i: pickW(o.W) } }; }
              c.mark(-1);
              if (o.reset) o.reset(c);
              await o.play(c, fake);
              c.mark(o.chipOf ? o.chipOf(fake.view.i != null ? fake.view.i : -1, fake) : -1);
              await wait(box, 2600);
            }
          } catch (e) { /* le joueur a quitté le jeu */ }
        })();
      }
    }, { rules: rules(o.rules) });
  }
  var V = {
    en: { deal: 'Deal', roll: 'Roll', spin: 'Spin', drop: 'Drop', play: 'Play', toss: 'Toss', hook: 'Fish', shake: 'Shake', race: 'Race' },
    fr: { deal: 'Distribuer', roll: 'Lancer', spin: 'Tourner', drop: 'Lâcher', play: 'Jouer', toss: 'Lancer', hook: 'Pêcher', shake: 'Secouer', race: 'Course' },
    es: { deal: 'Repartir', roll: 'Tirar', spin: 'Girar', drop: 'Soltar', play: 'Jugar', toss: 'Lanzar', hook: 'Pescar', shake: 'Agitar', race: 'Correr' },
    pt: { deal: 'Distribuir', roll: 'Rolar', spin: 'Girar', drop: 'Soltar', play: 'Jogar', toss: 'Lançar', hook: 'Pescar', shake: 'Agitar', race: 'Correr' },
    ar: { deal: 'وزّع', roll: 'ارمِ', spin: 'أدر', drop: 'أسقط', play: 'العب', toss: 'اقذف', hook: 'اصطد', shake: 'هزّ', race: 'سباق' },
    tr: { deal: 'Dağıt', roll: 'At', spin: 'Çevir', drop: 'Bırak', play: 'Oyna', toss: 'Fırlat', hook: 'Avla', shake: 'Salla', race: 'Koş' },
    vi: { deal: 'Chia bài', roll: 'Gieo', spin: 'Quay', drop: 'Thả', play: 'Chơi', toss: 'Tung', hook: 'Câu', shake: 'Lắc', race: 'Đua' },
    id: { deal: 'Bagikan', roll: 'Lempar', spin: 'Putar', drop: 'Jatuhkan', play: 'Main', toss: 'Lempar', hook: 'Pancing', shake: 'Kocok', race: 'Balap' },
    ru: { deal: 'Раздать', roll: 'Бросить', spin: 'Крутить', drop: 'Бросить', play: 'Играть', toss: 'Подбросить', hook: 'Ловить', shake: 'Трясти', race: 'Старт' },
    de: { deal: 'Geben', roll: 'Würfeln', spin: 'Drehen', drop: 'Fallen', play: 'Spielen', toss: 'Werfen', hook: 'Angeln', shake: 'Schütteln', race: 'Start' },
    hi: { deal: 'बांटें', roll: 'फेंकें', spin: 'घुमाएं', drop: 'गिराएं', play: 'खेलें', toss: 'उछालें', hook: 'पकड़ें', shake: 'हिलाएं', race: 'दौड़' },
    zh: { deal: '发牌', roll: '掷骰', spin: '旋转', drop: '投球', play: '开始', toss: '抛掷', hook: '钓鸭', shake: '摇一摇', race: '开跑' }
  };
  function verb(k, T) { return function () { var v = Lx(V), o = { verb: v[k] }; if (T) Object.assign(o, Lx(T)); return o; }; }
  // bouton d'option : texte (ou icône) + gain
  function optBtn(j, main, mult, cls) { return '<button type="button" data-o="' + j + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + main + '<small class="fit">' + xm(mult) + '</small></button>'; }
  function cardsAt(list, x0, y, gap, sc) { return list.map(function (cc, j) { return '<g transform="translate(' + (x0 + j * gap) + ' ' + y + ') scale(' + (sc || 1) + ')">' + card(cc) + '</g>'; }).join(''); }
  // une carte vole du sabot à sa place (retournée à l'arrivée)
  async function dealTo(c, layer, cc, x, y, sc, from) {
    from = from || [262, -30]; sc = sc || 1;
    layer.insertAdjacentHTML('beforeend', '<g>' + card(null) + '</g>'); var g = layer.lastChild;
    c.sfx('card');
    await tw(c.box, 260, function (k) { var e = ease(k); tr(g, lerp(from[0], x, e), lerp(from[1], y, e), sc * (0.7 + 0.3 * e), (1 - e) * -25); });
    await tw(c.box, 140, function (k) { g.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + (sc * Math.abs(1 - 2 * k)).toFixed(3) + ' ' + sc + ')'); if (k >= 0.5 && !g._f) { g._f = 1; g.innerHTML = card(cc); } });
    tr(g, x, y, sc);
    return g;
  }
  var WHO = {
    en: { dealer: 'Dealer', you: 'You' }, fr: { dealer: 'Croupier', you: 'Vous' }, es: { dealer: 'Crupier', you: 'Tú' }, pt: { dealer: 'Banca', you: 'Você' },
    ar: { dealer: 'الموزّع', you: 'أنت' }, tr: { dealer: 'Krupiye', you: 'Sen' }, vi: { dealer: 'Nhà cái', you: 'Bạn' }, id: { dealer: 'Bandar', you: 'Kamu' },
    ru: { dealer: 'Дилер', you: 'Вы' }, de: { dealer: 'Croupier', you: 'Du' }, hi: { dealer: 'डीलर', you: 'आप' }, zh: { dealer: '庄家', you: '你' }
  };
  // libellés « Croupier » / « Vous » : texte HTML posé sur la scène (rapetisse tout seul, sens de lecture de la langue)
  function whoTags(c, yd, yp) {
    var w = Lx(WHO), sc = c.q('.m4-scene');
    sc.insertAdjacentHTML('beforeend', '<i class="cb-who fit" style="top:' + yd + '%">' + K.esc(w.dealer) + '</i><i class="cb-who you fit" style="top:' + yp + '%">' + K.esc(w.you) + '</i>');
  }
  function find(gen, ok, n) { for (var t = 0; t < (n || 30000); t++) { var x = gen(); if (ok(x)) return x; } return null; }
  function pillG(id, x, y, w, col) { return '<g id="' + id + '" transform="translate(' + x + ' ' + y + ')" opacity="0"><rect x="' + (-w / 2) + '" y="-12" width="' + w + '" height="24" rx="12" fill="#0B1220" stroke="' + (col || '#FDE68A') + '" stroke-width="1.5"/><text y="5.5" text-anchor="middle" font-size="15" font-weight="900" fill="' + (col || '#FDE68A') + '" font-family="Arial,sans-serif"></text></g>'; }
  function setP(c, id, t) { var g = c.id(id); g.querySelector('text').textContent = t; g.setAttribute('opacity', t === '' ? '0' : '1'); }
  function chipT(t, col) { return '<text y="3.5" text-anchor="middle" font-size="' + (t.length > 3 ? 8 : 9.5) + '" font-weight="900" fill="' + (col || '#FDE68A') + '" font-family="Arial">' + t + '</text>'; }
  function ball(r) { return '<circle r="' + r + '" fill="url(#cbBall)"/><circle cx="' + (-r * .35) + '" cy="' + (-r * .35) + '" r="' + (r * .32) + '" fill="#fff" opacity=".8"/>'; }
  var BALLDEF = '<defs><radialGradient id="cbBall" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#CBD5E1"/><stop offset="1" stop-color="#475569"/></radialGradient></defs>';

  /* =============================== PACHINKO =============================== */
  // lignes : 0 la bille sort par le bas · 1 « start » mais les rouleaux ratent · 2 tulipe ×0.5 · 3 poche de côté ×2 · 4 trois chiffres pareils ×10 · 5 7-7-7 ×100
  var PK_T = { 0: [150, 236], 1: [150, 172], 2: [96, 186], 3: [44, 204], 4: [150, 172], 5: [150, 172] };
  game({
    key: 'pachinko', l: verb('drop'), vb: '0 0 300 250', W: [1991, 1000, 2000, 1200, 200, 6],
    chips: [['<path d="M-6 4Q-8-6 0-8Q8-6 6 4z" fill="#F472B6"/>', 0.5], ['<rect x="-7" y="-5" width="14" height="10" rx="3" fill="#22D3EE"/>', 2], [chipT('333', '#E9D5FF'), 10], [chipT('777'), 100]],
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: BALLDEF + '<defs><linearGradient id="pkB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7E22CE"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>' + bg('#1E1B4B', '#0B0820') +
      '<rect x="14" y="8" width="272" height="240" rx="26" fill="url(#pkB)" stroke="#FBBF24" stroke-width="3"/><path d="M276 236V40Q276 16 250 16H60" stroke="#E9D5FF" stroke-opacity=".5" stroke-width="3" fill="none"/>' +
      (function () { var s = ''; for (var r = 0; r < 7; r++) for (var q = 0; q < 11; q++) { var x = 36 + q * 22 + (r % 2) * 11, y = 92 + r * 14; if (x > 266 || (y > 150 && x > 120 && x < 180)) continue; s += '<circle cx="' + x + '" cy="' + y + '" r="1.8" fill="#FDE68A"/>'; } return s; })() +
      '<rect x="105" y="30" width="90" height="40" rx="8" fill="#0F172A" stroke="#FBBF24" stroke-width="2"/>' + [0, 1, 2].map(function (j) { return '<text id="pkR' + j + '" x="' + (124 + j * 26) + '" y="60" text-anchor="middle" font-size="24" font-weight="900" fill="#FDE68A" font-family="Arial,sans-serif">–</text>'; }).join('') +
      '<g transform="translate(150 172)"><path d="M-14-8h28l-6 14h-16z" fill="#FBBF24" stroke="#fff" stroke-width="1.2"/>' + txt(0, -12, 'START', 7, '#FEF3C7') + '</g>' +
      [96, 204].map(function (x) { return '<path d="M' + (x - 11) + ' 180Q' + (x - 13) + ' 196 ' + x + ' 198Q' + (x + 13) + ' 196 ' + (x + 11) + ' 180" fill="#F472B6" stroke="#fff" stroke-width="1"/>'; }).join('') +
      [44, 256].map(function (x) { return '<rect x="' + (x - 14) + '" y="196" width="28" height="16" rx="5" fill="#22D3EE" stroke="#fff" stroke-width="1"/>'; }).join('') +
      '<rect x="134" y="228" width="32" height="12" rx="6" fill="#020617"/><g id="pkBall" transform="translate(268 228)">' + ball(5) + '</g>',
    reset: function (c) { tr(c.id('pkBall'), 268, 228); c.id('pkBall').style.opacity = ''; },
    play: async function (c, r) {
      var i = +r.view.i, b = c.id('pkBall'), tg = PK_T[i].slice();
      if (i === 2 && rnd(2)) tg[0] = 204; if (i === 3 && rnd(2)) tg[0] = 256;
      c.sfx('launch');
      // lancée par le rail de droite, puis au sommet
      await tw(c.box, 650, function (k) { var e = ease(k), a = e * Math.PI / 2; tr(b, 250 + Math.cos(a) * 18 - e * 120, 228 - Math.sin(a) * 0 - e * 200 + Math.sin(e * Math.PI) * 0); });
      var x = 130, y = 28, pts = [];
      for (var row = 0; row < 8; row++) { var ny = 86 + row * 14, nx = lerp(x, tg[0], (row + 1) / 9) + (row < 7 ? (rnd(2) ? 9 : -9) * (1 - row / 8) : 0); pts.push([nx, ny]); }
      pts.push([tg[0], tg[1] - 6]);
      var px = 130, py = 28;
      for (var j = 0; j < pts.length; j++) { var p = pts[j], fx = px, fy = py; await tw(c.box, j ? 110 : 260, function (k) { tr(b, lerp(fx, p[0], k), lerp(fy, p[1], k * k) - (j ? Math.sin(k * Math.PI) * 5 : 0)); }); if (j && j < 8) c.sfx('tick'); px = p[0]; py = p[1]; }
      await tw(c.box, 160, function (k) { tr(b, tg[0], lerp(tg[1] - 6, tg[1] + 4, k)); b.style.opacity = String(1 - k * 0.7); });
      if (i === 1 || i >= 4) {
        var fin = i === 5 ? [7, 7, 7] : i === 4 ? (function () { var d = 1 + rnd(6); return [d, d, d]; })() : (function () { var a; do { a = [1 + rnd(7), 1 + rnd(7), 1 + rnd(7)]; } while (a[0] === a[1] && a[1] === a[2]); if (rnd(2)) a[1] = a[0]; if (a[0] === a[1] && a[1] === a[2]) a[2] = a[2] % 7 + 1; return a; })();
        c.sfx('reveal');
        for (var q = 0; q < 3; q++) { var el = c.id('pkR' + q); await tw(c.box, 500 + q * 250, function (k) { el.textContent = String(k < 0.9 ? 1 + rnd(7) : fin[q]); }); el.textContent = String(fin[q]); c.sfx('stop'); }
      } else c.sfx('stop');
    },
    rules: {
      en: '1. Set your stake and tap “Drop”: the ball is shot up the rail and falls through the pins.\n2. Pink tulip ×0.5 · blue side pocket ×2. The golden START pocket spins the 3 numbers.\n3. Three alike ×10 · 7-7-7 ×100. Other numbers, or the ball out at the bottom: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lâcher » : la bille monte par le rail et retombe entre les clous.\n2. Tulipe rose ×0.5 · poche bleue sur le côté ×2. La poche dorée START fait tourner les 3 chiffres.\n3. Trois pareils ×10 · 7-7-7 ×100. Autres chiffres, ou la bille sort en bas : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Soltar»: la bola sube por el carril y cae entre los clavos.\n2. Tulipán rosa ×0.5 · bolsillo azul lateral ×2. El bolsillo dorado START hace girar los 3 números.\n3. Tres iguales ×10 · 7-7-7 ×100. Otros números, o la bola sale por abajo: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Soltar»: a bola sobe pelo trilho e cai entre os pinos.\n2. Tulipa rosa ×0.5 · bolso azul lateral ×2. O bolso dourado START gira os 3 números.\n3. Três iguais ×10 · 7-7-7 ×100. Outros números, ou a bola sai por baixo: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «أسقط»: تُطلق الكرة على السكة ثم تسقط بين المسامير.\n2. الزهرة الوردية ×0.5 · الجيب الأزرق الجانبي ×2. الجيب الذهبي START يدير الأرقام الثلاثة.\n3. ثلاثة متشابهة ×10 · 7-7-7 ×100. أرقام أخرى أو خروج الكرة من الأسفل: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Bırak”a dokun: top raydan yukarı fırlar ve çivilerin arasından düşer.\n2. Pembe lale ×0.5 · mavi yan cep ×2. Altın START cebi 3 rakamı çevirir.\n3. Üç aynı ×10 · 7-7-7 ×100. Başka rakamlar veya top alttan çıkarsa bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Thả»: bi được bắn lên theo ray rồi rơi qua các đinh.\n2. Hoa tulip hồng ×0.5 · túi xanh bên cạnh ×2. Túi vàng START quay 3 con số.\n3. Ba số giống ×10 · 7-7-7 ×100. Số khác, hoặc bi rơi ra dưới đáy: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Jatuhkan»: bola melesat lewat rel lalu jatuh di antara paku.\n2. Tulip merah muda ×0.5 · kantong biru di samping ×2. Kantong emas START memutar 3 angka.\n3. Tiga sama ×10 · 7-7-7 ×100. Angka lain, atau bola keluar di bawah: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бросить»: шарик взлетает по жёлобу и падает между гвоздиками.\n2. Розовый тюльпан ×0.5 · синий боковой карман ×2. Золотой карман START запускает 3 цифры.\n3. Три одинаковые ×10 · 7-7-7 ×100. Другие цифры или шарик ушёл вниз — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Fallen“: die Kugel schießt die Schiene hoch und fällt durch die Nägel.\n2. Rosa Tulpe ×0.5 · blaue Seitentasche ×2. Die goldene START-Tasche dreht die 3 Ziffern.\n3. Drei gleiche ×10 · 7-7-7 ×100. Andere Ziffern oder Kugel unten raus: Einsatz verloren.',
      hi: '1. राशि चुनें और «गिराएं» छुएं: गेंद रेल से ऊपर जाती है और कीलों के बीच से गिरती है।\n2. गुलाबी ट्यूलिप ×0.5 · नीली साइड जेब ×2। सुनहरी START जेब 3 अंक घुमाती है।\n3. तीन एक जैसे ×10 · 7-7-7 ×100। दूसरे अंक, या गेंद नीचे से निकल जाए: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“投球”：钢珠沿轨道射上，再从钉阵中落下。\n2. 粉色郁金香 ×0.5 · 蓝色侧袋 ×2。金色 START 口会转动 3 个数字。\n3. 三个相同 ×10 · 7-7-7 ×100。其他数字或钢珠从底部漏出：输掉下注。'
    }
  });

  /* =============================== LUCKY LADDER =============================== */
  // 5 montants, des barreaux tirés au hasard (loterie à échelle) ; 5 pots en bas, chacun aussi probable : ×0 · ×0.3 · ×0.8 · ×1.6 · ×2.
  // ligne = le pot gagné ; le montant choisi ne change rien aux chances (on trace des barreaux qui y mènent)
  var LD_V = [0, 0.3, 0.8, 1.6, 2], LD_POS = [2, 0, 4, 1, 3], LD_X = function (q) { return 46 + q * 52; }, LD_Y0 = 42, LD_Y1 = 196, LD_N = 9;
  function ldMake() { var rungs = []; for (var lv = 0; lv < LD_N; lv++) { var used = -2; for (var q = 0; q < 4; q++) if (q > used + 1 && Math.random() < 0.42) { rungs.push([lv, q]); used = q; } } return rungs; }
  function ldPath(rungs, start) { var col = start, pts = [[LD_X(col), LD_Y0]]; for (var lv = 0; lv < LD_N; lv++) { var y = LD_Y0 + (lv + 1) * (LD_Y1 - LD_Y0) / (LD_N + 1); for (var k = 0; k < rungs.length; k++) { var rg = rungs[k]; if (rg[0] !== lv) continue; if (rg[1] === col) { pts.push([LD_X(col), y]); col++; pts.push([LD_X(col), y]); break; } if (rg[1] === col - 1) { pts.push([LD_X(col), y]); col--; pts.push([LD_X(col), y]); break; } } } pts.push([LD_X(col), LD_Y1]); return { col: col, pts: pts }; }
  game({
    key: 'amida', l: verb('play'), vb: '0 0 300 250', W: [1, 1, 1, 1, 1],
    chips: [0.3, 0.8, 1.6, 2].map(function (v) { return ['', v]; }),
    chipOf: function (i) { return i - 1; },
    scene: bg('#1E1B4B', '#312E81') + '<g id="ldR"></g><g stroke="#E0E7FF" stroke-width="4" stroke-linecap="round">' + [0, 1, 2, 3, 4].map(function (q) { return '<path d="M' + LD_X(q) + ' ' + LD_Y0 + 'V' + LD_Y1 + '"/>'; }).join('') + '</g>' +
      '<path id="ldTrail" d="" fill="none" stroke="#F43F5E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      [0, 1, 2, 3, 4].map(function (q) { return '<g class="ld-top" id="ldT' + q + '"><circle cx="' + LD_X(q) + '" cy="22" r="13" fill="#4338CA" stroke="#C7D2FE" stroke-width="2"/>' + txt(LD_X(q), 27, q + 1, 13, '#fff') + '</g>'; }).join('') +
      LD_V.map(function (v, i) { var x = LD_X(LD_POS[i]); return '<g class="ld-pot" id="ldP' + i + '"><rect x="' + (x - 23) + '" y="206" width="46" height="34" rx="9" fill="' + (v ? (v >= 1.6 ? '#B45309' : '#334155') : '#1F2937') + '" stroke="#FDE68A" stroke-opacity=".6" stroke-width="1.5"/>' + txt(x, 228, v ? xm(v) : '×0', 13, v >= 1 ? '#FDE68A' : '#E2E8F0') + '</g>'; }).join('') +
      '<g id="ldBall" opacity="0">' + '<circle r="7" fill="#F43F5E" stroke="#fff" stroke-width="2"/></g>',
    opts: function () { return '<div class="cg-opts ld-opts">' + [0, 1, 2, 3, 4].map(function (q) { return '<button type="button" data-o="' + q + '"><b class="fit">' + (q + 1) + '</b></button>'; }).join('') + '</div>'; },
    onPick: function (c, j) { c.qa('.ld-top').forEach(function (g, q) { g.classList.toggle('on', q === j); }); },
    init: function (c) { c.id('ldR').innerHTML = ''; },
    params: function (c) { return { lane: c.sel }; },
    reset: function (c) { c.id('ldR').innerHTML = ''; c.id('ldTrail').setAttribute('d', ''); c.id('ldBall').setAttribute('opacity', '0'); c.qa('.ld-pot').forEach(function (g) { g.classList.remove('win'); }); },
    play: async function (c, r) {
      var i = +r.view.i, want = LD_POS[i], start = c.sel, rungs = find(ldMake, function (rg) { return ldPath(rg, start).col === want; }, 5000) || ldMake();
      var R = c.id('ldR');
      for (var k = 0; k < rungs.length; k++) { var rg = rungs[k], y = LD_Y0 + (rg[0] + 1) * (LD_Y1 - LD_Y0) / (LD_N + 1); R.insertAdjacentHTML('beforeend', '<path d="M' + LD_X(rg[1]) + ' ' + y + 'H' + LD_X(rg[1] + 1) + '" stroke="#FBBF24" stroke-width="4" stroke-linecap="round"/>'); c.sfx('tick'); await wait(c.box, 55); }
      var P = ldPath(rungs, start).pts, b = c.id('ldBall'), d = 'M' + P[0][0] + ' ' + P[0][1], trail = c.id('ldTrail');
      b.setAttribute('opacity', '1');
      for (k = 1; k < P.length; k++) { var a = P[k - 1], z = P[k], dd = d; await tw(c.box, Math.max(70, Math.hypot(z[0] - a[0], z[1] - a[1]) * 4), function (q) { var x = lerp(a[0], z[0], q), y2 = lerp(a[1], z[1], q); tr(b, x, y2); trail.setAttribute('d', dd + 'L' + x.toFixed(1) + ' ' + y2.toFixed(1)); }); d += 'L' + z[0] + ' ' + z[1]; if (a[1] === z[1]) c.sfx('step', { k: k }); }
      c.id('ldP' + i).classList.add('win'); c.sfx('stop');
    },
    rules: {
      en: '1. Pick a starting post (1 to 5), set your stake and tap “Play”.\n2. Golden rungs appear at random; the ball goes down your post and crosses every rung it meets.\n3. It ends in one of the 5 pots: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (each pot is equally likely, whatever post you pick).',
      fr: '1. Choisis un montant de départ (1 à 5), ta mise, puis touche « Jouer ».\n2. Des barreaux dorés apparaissent au hasard ; la bille descend ton montant et traverse chaque barreau qu’elle rencontre.\n3. Elle finit dans un des 5 pots : ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (chaque pot a la même chance, quel que soit le montant choisi).',
      es: '1. Elige un poste de salida (1 a 5), tu apuesta y toca «Jugar».\n2. Aparecen peldaños dorados al azar; la bola baja por tu poste y cruza cada peldaño que encuentra.\n3. Termina en uno de los 5 botes: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (todos igual de probables, elijas el poste que elijas).',
      pt: '1. Escolha um poste de partida (1 a 5), o valor e toque em «Jogar».\n2. Degraus dourados aparecem ao acaso; a bola desce pelo seu poste e cruza cada degrau que encontra.\n3. Ela termina num dos 5 potes: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (todos com a mesma chance, seja qual for o poste).',
      ar: '1. اختر عمود البداية (1 إلى 5) والرهان ثم المس «العب».\n2. تظهر درجات ذهبية عشوائيًا؛ تنزل الكرة في عمودك وتعبر كل درجة تصادفها.\n3. تنتهي في أحد الأوعية الخمسة: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (لكل وعاء الفرصة نفسها أيًّا كان العمود).',
      tr: '1. Bir başlangıç direği seç (1–5), bahsini belirle ve “Oyna”ya dokun.\n2. Rastgele altın basamaklar belirir; top direğinden iner ve rastladığı her basamaktan geçer.\n3. 5 kaptan birine düşer: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (hangi direği seçersen seç, her kap eşit olasılıklı).',
      vi: '1. Chọn cột xuất phát (1 đến 5), mức cược rồi chạm «Chơi».\n2. Các bậc vàng hiện ra ngẫu nhiên; bi đi xuống cột của bạn và rẽ qua mỗi bậc gặp phải.\n3. Bi rơi vào một trong 5 hũ: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (mỗi hũ có cơ hội như nhau, dù chọn cột nào).',
      id: '1. Pilih tiang awal (1 sampai 5), atur taruhan lalu sentuh «Main».\n2. Anak tangga emas muncul acak; bola turun di tiangmu dan menyeberangi setiap anak tangga yang ditemui.\n3. Bola berakhir di salah satu dari 5 pot: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (peluang tiap pot sama, tiang mana pun yang dipilih).',
      ru: '1. Выберите стартовую стойку (1–5), ставку и нажмите «Играть».\n2. Случайно появляются золотые перекладины; шарик спускается по вашей стойке и переходит по каждой встреченной перекладине.\n3. Он попадает в один из 5 горшков: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (шанс у каждого одинаковый при любой стойке).',
      de: '1. Wähle einen Startpfosten (1 bis 5), deinen Einsatz und tippe auf „Spielen“.\n2. Goldene Sprossen erscheinen zufällig; die Kugel läuft deinen Pfosten hinab und nimmt jede Sprosse, die sie trifft.\n3. Sie endet in einem der 5 Töpfe: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (jeder Topf gleich wahrscheinlich, egal welcher Pfosten).',
      hi: '1. शुरुआती खंभा चुनें (1 से 5), राशि चुनें और «खेलें» छुएं।\n2. सुनहरे डंडे बेतरतीब दिखते हैं; गेंद आपके खंभे से नीचे आती है और हर मिलने वाले डंडे से मुड़ती है।\n3. वह 5 मटकों में से एक में गिरती है: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2 (कोई भी खंभा चुनें, हर मटके का मौका बराबर)।',
      zh: '1. 选择起点（1 到 5），设定金额并点击“开始”。\n2. 随机出现金色横档；小球沿你的竖线下落，遇到横档就拐过去。\n3. 最终落入 5 个奖池之一：×0 · ×0.3 · ×0.8 · ×1.6 · ×2（无论选哪个起点，每个奖池机会相同）。'
    }
  });

  /* =============================== SKEE-BALL =============================== */
  // 5 boules ; trous 10/20/30/40/50 et 100 dans les coins (30/25/18/12/10/5 %). Lignes (total) : <150 · 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100
  var SK_P = [10, 20, 30, 40, 50, 100], SK_W = [30, 25, 18, 12, 10, 5], SK_B = [[0, 149], [150, 199], [200, 249], [250, 299], [300, 349], [350, 500]];
  var SK_H = { 10: [150, 112, 46], 20: [150, 96, 34], 30: [150, 84, 23], 40: [150, 76, 14], 50: [150, 66, 9], 100: [82, 40, 9] };
  function skRoll() { var s = [], t = 0; for (var j = 0; j < 5; j++) { var v = SK_P[pickW(SK_W)]; s.push(v); t += v; } return { s: s, t: t }; }
  game({
    key: 'skeeball', l: verb('roll'), vb: '0 0 300 250', W: [6058, 2583, 1065, 244, 43, 7],
    chips: [['150', 1.45], ['200', 2.6], ['250', 5.5], ['300', 20], ['350', 100]].map(function (x) { return [chipT(x[0] + '+', '#BFDBFE'), x[1]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs><radialGradient id="cbBall" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFFBEB"/><stop offset=".6" stop-color="#FBBF24"/><stop offset="1" stop-color="#92400E"/></radialGradient><linearGradient id="skL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E3A8A"/><stop offset="1" stop-color="#60A5FA"/></linearGradient></defs>' + bg('#0B1437', '#020617') +
      '<path d="M70 20H230L280 250H20z" fill="url(#skL)"/><path d="M70 20H230L280 250H20z" fill="none" stroke="#FDE68A" stroke-width="2.5"/>' +
      [10, 20, 30, 40, 50].map(function (p) { var h = SK_H[p]; return '<ellipse cx="' + h[0] + '" cy="' + h[1] + '" rx="' + h[2] + '" ry="' + (h[2] * 0.62) + '" fill="' + (p === 10 ? '#1E40AF' : '#020617') + '" stroke="#FDE68A" stroke-width="1.5"/>'; }).join('') +
      [10, 20, 30, 40, 50].map(function (p) { var h = SK_H[p]; return txt(h[0], p === 50 ? h[1] + 3.5 : h[1] + h[2] * 0.62 - 3, p, p === 50 ? 8 : 9, '#FDE68A'); }).join('') +
      [82, 218].map(function (x) { return '<ellipse cx="' + x + '" cy="40" rx="9" ry="6" fill="#020617" stroke="#F472B6" stroke-width="1.5"/>' + txt(x, 30, '100', 8, '#F9A8D4'); }).join('') +
      '<path d="M120 182Q150 168 180 182" stroke="#93C5FD" stroke-width="5" fill="none" opacity=".7"/><g id="skBalls"></g>' + pillG('skT', 150, 226, 70) +
      '<g id="skLeft" transform="translate(262 236)">' + [0, 1, 2, 3, 4].map(function (j) { return '<circle cx="' + (-j * 9) + '" r="3.6" fill="#FBBF24"/>'; }).join('') + '</g>',
    reset: function (c) { c.id('skBalls').innerHTML = ''; setP(c, 'skT', ''); c.qa('#skLeft circle').forEach(function (e) { e.setAttribute('opacity', '1'); }); },
    play: async function (c, r) {
      var b = SK_B[+r.view.i], g = find(skRoll, function (x) { return x.t >= b[0] && x.t <= b[1]; }, 80000) || skRoll(), L = c.id('skBalls'), tot = 0, lefts = c.qa('#skLeft circle');
      setP(c, 'skT', '0');
      for (var j = 0; j < 5; j++) {
        var v = g.s[j], h = v === 100 ? (rnd(2) ? [82, 40, 6] : [218, 40, 6]) : SK_H[v], a = Math.random() * Math.PI * 2, rr = v === 100 ? 0 : Math.random() * h[2] * 0.3, tx = h[0] + Math.cos(a) * rr, ty = h[1] + Math.sin(a) * rr * 0.6;
        L.insertAdjacentHTML('beforeend', '<g>' + ball(9) + '</g>'); var e = L.lastChild; lefts[4 - j].setAttribute('opacity', '.2');
        c.sfx('roll');
        await tw(c.box, 700, function (k) { var y = lerp(250, 186, Math.min(1, k * 2.2)), jump = k > 0.45 ? (k - 0.45) / 0.55 : 0; var x = lerp(150 + (rnd(3) - 1) * 0, tx, jump), yy = k <= 0.45 ? y : lerp(186, ty, jump) - Math.sin(jump * Math.PI) * 40; tr(e, x, yy, lerp(1, v === 100 ? 0.45 : 0.6, jump)); });
        await tw(c.box, 140, function (k) { e.setAttribute('opacity', String(1 - k * 0.6)); });
        tot += v; setP(c, 'skT', String(tot)); c.sfx('ding', { k: j });
      }
      c.sfx('stop');
    },
    rules: {
      en: '1. Set your stake and tap “Roll”: 5 balls roll up the lane and jump into the rings.\n2. Rings are worth 10, 20, 30, 40, 50 and the two corner holes 100.\n3. Total 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. Under 150: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : 5 boules montent la piste et sautent dans les anneaux.\n2. Les anneaux valent 10, 20, 30, 40, 50 et les deux trous des coins 100.\n3. Total 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. Moins de 150 : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Tirar»: 5 bolas suben la pista y saltan a los aros.\n2. Los aros valen 10, 20, 30, 40, 50 y los dos agujeros de las esquinas 100.\n3. Total 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. Menos de 150: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Rolar»: 5 bolas sobem a pista e saltam nos anéis.\n2. Os anéis valem 10, 20, 30, 40, 50 e os dois buracos dos cantos 100.\n3. Total 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. Menos de 150: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «ارمِ»: تصعد 5 كرات المسار وتقفز في الحلقات.\n2. الحلقات تساوي 10 و20 و30 و40 و50 وفتحتا الزاويتين 100.\n3. المجموع 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. أقل من 150: تخسر الرهان.',
      tr: '1. Bahsini seç ve “At”a dokun: 5 top pistten yukarı yuvarlanıp halkalara sıçrar.\n2. Halkalar 10, 20, 30, 40, 50; köşedeki iki delik 100 puan.\n3. Toplam 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. 150’den az: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Gieo»: 5 quả bóng lăn lên đường băng và nhảy vào các vòng.\n2. Các vòng được 10, 20, 30, 40, 50 và hai lỗ ở góc được 100.\n3. Tổng 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. Dưới 150: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lempar»: 5 bola menggelinding naik lintasan dan melompat ke cincin.\n2. Cincin bernilai 10, 20, 30, 40, 50 dan dua lubang sudut 100.\n3. Total 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. Di bawah 150: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бросить»: 5 шаров катятся по дорожке и прыгают в кольца.\n2. Кольца дают 10, 20, 30, 40, 50 очков, две угловые лунки — 100.\n3. Сумма 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. Меньше 150 — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Würfeln“: 5 Kugeln rollen die Bahn hoch und springen in die Ringe.\n2. Die Ringe zählen 10, 20, 30, 40, 50, die zwei Ecklöcher 100.\n3. Summe 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. Unter 150: Einsatz verloren.',
      hi: '1. राशि चुनें और «फेंकें» छुएं: 5 गेंदें ढलान पर लुढ़ककर छल्लों में कूदती हैं।\n2. छल्ले 10, 20, 30, 40, 50 के हैं और कोनों के दो छेद 100 के।\n3. कुल 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100। 150 से कम: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“掷骰”：5 个球沿球道滚上并跳进圆环。\n2. 圆环分值 10、20、30、40、50，两个角落洞各 100 分。\n3. 总分 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100。低于 150：输掉下注。'
    }
  });

  /* =============================== LUCKY DUCKS =============================== */
  // les canards tournent dans le bassin, la canne en attrape un, on lit le dessous : rien · ×0.5 · ×1 · ×2 · ×5 · ×20 · canard d'or ×100
  var DK_V = [0, 0.5, 1, 2, 5, 20, 100];
  function duck(gold) { return '<g><path d="M-14 4q0 10 14 10t16-10q-2-6-10-6h-4q2-4 2-8a8 8 0 0 0-16 0q0 4 4 6q-6 2-6 8z" fill="' + (gold ? 'url(#dkG)' : 'url(#dkY)') + '" stroke="' + (gold ? '#92400E' : '#A16207') + '" stroke-width="1"/><path d="M-16-6l-8 2 8 3z" fill="#F97316"/><circle cx="-10" cy="-10" r="1.6" fill="#111"/><path d="M0 2q6 4 12-1" stroke="#CA8A04" stroke-width="1.4" fill="none"/></g>'; }
  var DKX = function (j, t) { return ((j * 50 + t) % 300 + 300) % 300; };
  game({
    key: 'ducks', l: verb('hook'), vb: '0 0 300 250', W: [2759, 2600, 1800, 900, 300, 60, 3],
    chips: DK_V.slice(1).map(function (v) { return ['', v]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs><radialGradient id="dkY" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FEF9C3"/><stop offset=".6" stop-color="#FACC15"/><stop offset="1" stop-color="#A16207"/></radialGradient><radialGradient id="dkG" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".4" stop-color="#FDE68A"/><stop offset="1" stop-color="#B45309"/></radialGradient>' +
      '<linearGradient id="dkW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38BDF8"/><stop offset="1" stop-color="#1E3A8A"/></linearGradient></defs>' + bg('#FCE7F3', '#F9A8D4') +
      '<path d="M0 0H300V30Q285 46 270 30Q255 46 240 30Q225 46 210 30Q195 46 180 30Q165 46 150 30Q135 46 120 30Q105 46 90 30Q75 46 60 30Q45 46 30 30Q15 46 0 30z" fill="#DB2777"/>' +
      '<rect x="-20" y="140" width="340" height="80" rx="20" fill="url(#dkW)" stroke="#fff" stroke-width="4"/><path d="M0 160q15-6 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0 30 0 30 0" stroke="#BAE6FD" stroke-width="2" fill="none" opacity=".6"/>' +
      '<g id="dkRow">' + [0, 1, 2, 3, 4, 5].map(function (j) { return '<g id="dkD' + j + '" transform="translate(' + DKX(j, 0) + ' 168)">' + duck(j === 3) + '</g>'; }).join('') + '</g>' +
      '<g id="dkRod"><path id="dkLine" d="M150 0V40" stroke="#E2E8F0" stroke-width="1.5"/><path id="dkHook" d="M150 40q0 8 6 6" stroke="#64748B" stroke-width="2.4" fill="none"/></g>' +
      '<g id="dkShow" opacity="0" transform="translate(150 90)"><circle r="36" fill="#fff" stroke="#DB2777" stroke-width="3"/><text id="dkVal" y="9" text-anchor="middle" font-size="24" font-weight="900" fill="#DB2777" font-family="Arial,sans-serif"></text></g>',
    init: function (c) { c.t = 0; },
    reset: function (c) { c.id('dkShow').setAttribute('opacity', '0'); for (var j = 0; j < 6; j++) { var d = c.id('dkD' + j); d.style.opacity = ''; d.innerHTML = duck(j === 3); } c.id('dkLine').setAttribute('d', 'M150 0V40'); c.id('dkHook').setAttribute('d', 'M150 40q0 8 6 6'); },
    play: async function (c, r) {
      var i = +r.view.i, t0 = c.t, ds = [0, 1, 2, 3, 4, 5].map(function (j) { return c.id('dkD' + j); });
      var pick = i === 6 ? 3 : [0, 1, 2, 4, 5][rnd(5)], dist = 600 + ((150 - DKX(pick, t0)) % 300 + 300) % 300;
      c.sfx('launch');
      await tw(c.box, 2200, function (k) { var t = t0 + ease(k) * dist; c.t = t; ds.forEach(function (d, j) { tr(d, DKX(j, t), 168 + Math.sin((t + j * 40) / 20) * 2); }); });
      c.t = t0 + dist;
      var hook = function (y) { c.id('dkLine').setAttribute('d', 'M150 0V' + y); c.id('dkHook').setAttribute('d', 'M150 ' + y + 'q0 8 6 6'); };
      await tw(c.box, 450, function (k) { hook(lerp(40, 150, ease(k))); });
      var dk = ds[pick];
      c.sfx('step', { k: 3 });
      await tw(c.box, 650, function (k) { var e = ease(k); hook(lerp(150, 60, e)); dk.setAttribute('transform', 'translate(150 ' + lerp(168, 78, e).toFixed(1) + ') rotate(' + (e * 180).toFixed(0) + ')'); });
      var v = DK_V[i], sh = c.id('dkShow');
      c.id('dkVal').textContent = v ? xm(v) : '—'; c.id('dkVal').setAttribute('fill', i === 6 ? '#B45309' : v ? '#DB2777' : '#64748B');
      dk.style.opacity = '0'; c.sfx('reveal');
      await tw(c.box, 300, function (k) { sh.setAttribute('opacity', String(k)); sh.setAttribute('transform', 'translate(150 90) scale(' + (0.4 + 0.6 * ease(k)).toFixed(3) + ')'); });
    },
    rules: {
      en: '1. Set your stake and tap “Fish”: the ducks swim round the pond and the line hooks one.\n2. The duck is turned over: the prize is written underneath.\n3. Nothing · ×0.5 · ×1 · ×2 · ×5 · ×20 · the golden duck ×100.',
      fr: '1. Choisis ta mise et touche « Pêcher » : les canards tournent dans le bassin et la canne en attrape un.\n2. Le canard est retourné : le lot est écrit dessous.\n3. Rien · ×0.5 · ×1 · ×2 · ×5 · ×20 · le canard d’or ×100.',
      es: '1. Elige tu apuesta y toca «Pescar»: los patos nadan en el estanque y la caña engancha uno.\n2. Se da la vuelta al pato: el premio está escrito debajo.\n3. Nada · ×0.5 · ×1 · ×2 · ×5 · ×20 · el pato dorado ×100.',
      pt: '1. Escolha o valor e toque em «Pescar»: os patos nadam no lago e a vara fisga um.\n2. O pato é virado: o prêmio está escrito embaixo.\n3. Nada · ×0.5 · ×1 · ×2 · ×5 · ×20 · o pato dourado ×100.',
      ar: '1. اختر الرهان والمس «اصطد»: تسبح البطات في الحوض وتعلق إحداها بالصنارة.\n2. تُقلب البطة: الجائزة مكتوبة تحتها.\n3. لا شيء · ×0.5 · ×1 · ×2 · ×5 · ×20 · البطة الذهبية ×100.',
      tr: '1. Bahsini seç ve “Avla”ya dokun: ördekler havuzda döner, olta birini yakalar.\n2. Ördek ters çevrilir: ödül altında yazılıdır.\n3. Hiçbir şey · ×0.5 · ×1 · ×2 · ×5 · ×20 · altın ördek ×100.',
      vi: '1. Chọn mức cược và chạm «Câu»: đàn vịt bơi vòng quanh hồ và cần câu móc một con.\n2. Con vịt được lật lên: giải thưởng ghi ở dưới.\n3. Không có gì · ×0.5 · ×1 · ×2 · ×5 · ×20 · vịt vàng ×100.',
      id: '1. Atur taruhan lalu sentuh «Pancing»: bebek berenang di kolam dan kail menangkap satu.\n2. Bebek dibalik: hadiahnya tertulis di bawah.\n3. Tidak ada · ×0.5 · ×1 · ×2 · ×5 · ×20 · bebek emas ×100.',
      ru: '1. Выберите ставку и нажмите «Ловить»: уточки плавают по пруду, удочка цепляет одну.\n2. Уточку переворачивают: приз написан снизу.\n3. Ничего · ×0.5 · ×1 · ×2 · ×5 · ×20 · золотая уточка ×100.',
      de: '1. Wähle deinen Einsatz und tippe auf „Angeln“: die Enten schwimmen im Becken, die Angel fängt eine.\n2. Die Ente wird umgedreht: der Preis steht unten drauf.\n3. Nichts · ×0.5 · ×1 · ×2 · ×5 · ×20 · die goldene Ente ×100.',
      hi: '1. राशि चुनें और «पकड़ें» छुएं: बत्तखें तालाब में घूमती हैं और कांटा एक को पकड़ता है।\n2. बत्तख पलटी जाती है: इनाम नीचे लिखा होता है।\n3. कुछ नहीं · ×0.5 · ×1 · ×2 · ×5 · ×20 · सुनहरी बत्तख ×100।',
      zh: '1. 设定金额并点击“钓鸭”：小鸭在池里绕圈游，钓钩钓起一只。\n2. 把小鸭翻过来：奖品写在底部。\n3. 无 · ×0.5 · ×1 · ×2 · ×5 · ×20 · 金鸭 ×100。'
    }
  });
})(window.D6 = window.D6 || {});
