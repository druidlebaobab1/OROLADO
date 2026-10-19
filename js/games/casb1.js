/* casb1 — Blackjack, Three Card Poker, Casino Hold'em, Niu Niu (owner request, round 6) — instant games; the scene always shows exactly the line (or option) the server drew (casino_ext/casb.php). */
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
  /* ---- cartes : logique commune ---- */
  function deck() { var d = []; for (var s = 0; s < 4; s++) for (var r = 1; r <= 13; r++) d.push([r, s]); return shuffle(d); }
  function cmp(a, b) { for (var i = 0; i < Math.max(a.length, b.length); i++) { var x = a[i] || 0, y = b[i] || 0; if (x !== y) return x > y ? 1 : -1; } return 0; }
  function pill(id, x, y) { return '<g id="' + id + '" transform="translate(' + x + ' ' + y + ')" opacity="0"><rect x="-17" y="-11" width="34" height="22" rx="11" fill="#0B1220" stroke="#FDE68A" stroke-opacity=".7"/><text y="5" text-anchor="middle" font-size="13" font-weight="900" fill="#FDE68A" font-family="Arial,sans-serif"></text></g>'; }
  function setPill(c, id, v, col) { var g = c.id(id); if (!g) return; g.setAttribute('opacity', v === '' ? '0' : '1'); var t = g.querySelector('text'); t.textContent = v; if (col) t.setAttribute('fill', col); else t.setAttribute('fill', '#FDE68A'); }
  var CHIP = {
    eq: '<text y="4" text-anchor="middle" font-size="12" font-weight="900" fill="#E2E8F0" font-family="Arial">=</text>',
    win: '<path d="M-7 0l5 5 9-10" stroke="#4ADE80" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    flush: [-6, 0, 6].map(function (x) { return '<path d="' + SUIT[1] + '" transform="translate(' + x + ' 0) scale(.62)" fill="#F43F5E" stroke="#fff" stroke-width=".8"/>'; }).join(''),
    mini: function (labels, red) { return labels.map(function (t, j) { var x = (j - (labels.length - 1) / 2) * 6.4; return '<rect x="' + (x - 4) + '" y="-6" width="8" height="12" rx="1.5" fill="#fff" stroke="#94A3B8" stroke-width=".5"/><text x="' + x + '" y="2.6" text-anchor="middle" font-size="6.5" font-weight="900" fill="' + (red ? '#DC2626' : '#111827') + '" font-family="Arial">' + t + '</text>'; }).join(''); }
  };

  /* =============================== BLACKJACK =============================== */
  // sabot infini ; le joueur suit une stratégie de base simple, le croupier tire jusqu'à 17. Lignes : 0 perdu · 1 égalité · 2 gagné · 3 blackjack
  function bjVal(h) { var t = 0, a = 0; h.forEach(function (cc) { var v = cc[0] > 10 ? 10 : cc[0]; t += v; if (v === 1) a++; }); var soft = false; if (a && t + 10 <= 21) { t += 10; soft = true; } return [t, soft]; }
  function bjDeal() {
    var cd = function () { return [1 + rnd(13), rnd(4)]; }, P = [cd(), cd()], D = [cd(), cd()];
    var pn = bjVal(P)[0] === 21, dn = bjVal(D)[0] === 21;
    if (pn || dn) return { P: P, D: D, cat: pn && dn ? 1 : pn ? 3 : 0 };
    var up = D[0][0] > 10 ? 10 : D[0][0];
    for (;;) { var v = bjVal(P), t = v[0]; if (t > 21) break; var hit = v[1] ? t <= 17 : (t <= 11 || (t <= 16 && (up >= 7 || up === 1))); if (!hit) break; P.push(cd()); }
    var pt = bjVal(P)[0]; if (pt > 21) return { P: P, D: D, cat: 0 };
    while (bjVal(D)[0] < 17) D.push(cd());
    var dt = bjVal(D)[0];
    return { P: P, D: D, cat: dt > 21 || pt > dt ? 2 : pt === dt ? 1 : 0 };
  }
  function find(gen, ok, n) { for (var t = 0; t < (n || 30000); t++) { var x = gen(); if (ok(x)) return x; } return null; }
  function rowX(n, gap) { return 150 - (n - 1) * gap / 2; }
  game({
    key: 'blackjack', l: verb('deal'), vb: '0 0 300 250', W: [480, 87, 388, 45],
    chips: [[CHIP.eq, 1], [CHIP.win, 1.94], [CHIP.mini(['A', 'K'], true), 2.2]],
    chipOf: function (i) { return i - 1; },
    scene: felt('bjF', '#15803D', '#052E16') + '<path d="M20 118Q150 150 280 118" stroke="#FDE68A" stroke-opacity=".45" stroke-width="1.5" fill="none"/>' + txt(150, 136, 'BLACKJACK ×2.2', 10, '#FDE68A', ' opacity=".55" letter-spacing="2"') +
      '<g transform="translate(270 22)"><rect x="-20" y="-16" width="40" height="34" rx="5" fill="#78350F"/>' + card(null).replace('<rect', '<rect transform="scale(.7) translate(0 -2)"') + '</g>' +
      '<g id="bjD"></g><g id="bjP"></g>' + pill('bjDt', 40, 62) + pill('bjPt', 40, 190),
    init: function (c) { whoTags(c, 6, 88); },
    reset: function (c) { c.id('bjD').innerHTML = ''; c.id('bjP').innerHTML = ''; setPill(c, 'bjDt', ''); setPill(c, 'bjPt', ''); },
    play: async function (c, r) {
      var i = +r.view.i, h = find(bjDeal, function (x) { return x.cat === i; }) || bjDeal();
      var Dl = c.id('bjD'), Pl = c.id('bjP'), gap = 26, yD = 62, yP = 190;
      var lay = function (L, n, y) { [].slice.call(L.children).forEach(function (g, j) { tr(g, rowX(n, gap) + j * gap, y); }); };
      await dealTo(c, Pl, h.P[0], rowX(2, gap), yP);
      await dealTo(c, Dl, h.D[0], rowX(2, gap), yD);
      await dealTo(c, Pl, h.P[1], rowX(2, gap) + gap, yP);
      setPill(c, 'bjPt', String(bjVal(h.P.slice(0, 2))[0]));
      // carte cachée du croupier
      Dl.insertAdjacentHTML('beforeend', '<g>' + card(null) + '</g>'); var hole = Dl.lastChild; c.sfx('card');
      await tw(c.box, 260, function (k) { var e = ease(k); tr(hole, lerp(262, rowX(2, gap) + gap, e), lerp(-30, yD, e)); });
      setPill(c, 'bjDt', String(h.D[0][0] > 10 ? 10 : h.D[0][0] === 1 ? 11 : h.D[0][0]));
      await wait(c.box, 250);
      for (var j = 2; j < h.P.length; j++) { lay(Pl, j + 1, yP); await dealTo(c, Pl, h.P[j], rowX(j + 1, gap) + j * gap, yP); var pv = bjVal(h.P.slice(0, j + 1))[0]; setPill(c, 'bjPt', String(pv), pv > 21 ? '#F87171' : null); await wait(c.box, 150); }
      // le croupier retourne sa carte puis tire
      await tw(c.box, 180, function (k) { hole.setAttribute('transform', 'translate(' + (rowX(2, gap) + gap) + ' ' + yD + ') scale(' + Math.abs(1 - 2 * k).toFixed(3) + ' 1)'); if (k >= 0.5 && !hole._f) { hole._f = 1; hole.innerHTML = card(h.D[1]); } });
      tr(hole, rowX(2, gap) + gap, yD); c.sfx('card');
      setPill(c, 'bjDt', String(bjVal(h.D.slice(0, 2))[0]));
      var pBust = bjVal(h.P)[0] > 21, nat = bjVal(h.P.slice(0, 2))[0] === 21 || bjVal(h.D.slice(0, 2))[0] === 21;
      if (!pBust && !nat) for (var q = 2; q < h.D.length; q++) { await wait(c.box, 200); lay(Dl, q + 1, yD); await dealTo(c, Dl, h.D[q], rowX(q + 1, gap) + q * gap, yD); var dv = bjVal(h.D.slice(0, q + 1))[0]; setPill(c, 'bjDt', String(dv), dv > 21 ? '#F87171' : null); }
      if (i === 3) setPill(c, 'bjPt', 'BJ', '#4ADE80'); else if (i === 2) setPill(c, 'bjPt', String(bjVal(h.P)[0]), '#4ADE80');
      c.sfx('stop');
    },
    rules: {
      en: '1. Set your stake and tap “Deal”: you and the dealer get 2 cards (one of the dealer’s is face down).\n2. Your hand plays itself with the basic strategy (hit or stand), then the dealer draws to 17.\n3. Closer to 21 than the dealer without going over: ×1.94 · Blackjack (Ace + 10 in 2 cards) ×2.2 · equal totals: stake back. Over 21 or lower: lost.',
      fr: '1. Choisis ta mise et touche « Distribuer » : toi et le croupier recevez 2 cartes (une du croupier est cachée).\n2. Ta main se joue seule avec la stratégie de base (carte ou reste), puis le croupier tire jusqu’à 17.\n3. Plus près de 21 que le croupier sans dépasser : ×1.94 · Blackjack (As + 10 en 2 cartes) ×2.2 · égalité : mise rendue. Plus de 21 ou plus bas : perdu.',
      es: '1. Elige tu apuesta y toca «Repartir»: tú y el crupier recibís 2 cartas (una del crupier boca abajo).\n2. Tu mano se juega sola con la estrategia básica (pedir o plantarse) y luego el crupier pide hasta 17.\n3. Más cerca de 21 que el crupier sin pasarte: ×1.94 · Blackjack (As + 10 en 2 cartas) ×2.2 · empate: se devuelve la apuesta. Más de 21 o menos: pierdes.',
      pt: '1. Escolha o valor e toque em «Distribuir»: você e a banca recebem 2 cartas (uma da banca virada).\n2. Sua mão joga sozinha com a estratégia básica (pedir ou parar) e a banca compra até 17.\n3. Mais perto de 21 que a banca sem estourar: ×1.94 · Blackjack (Ás + 10 em 2 cartas) ×2.2 · empate: aposta devolvida. Acima de 21 ou menor: perdeu.',
      ar: '1. اختر الرهان والمس «وزّع»: تحصل أنت والموزّع على ورقتين (إحدى ورقتي الموزّع مقلوبة).\n2. تُلعب يدك تلقائيًا بالاستراتيجية الأساسية (سحب أو توقف)، ثم يسحب الموزّع حتى 17.\n3. أقرب إلى 21 من الموزّع دون تجاوزه: ×1.94 · بلاك جاك (آس + 10 بورقتين) ×2.2 · تعادل: يُعاد الرهان. أكثر من 21 أو أقل: خسارة.',
      tr: '1. Bahsini seç ve “Dağıt”a dokun: sen ve krupiye 2 kart alırsınız (krupiyenin biri kapalı).\n2. Elin temel stratejiyle kendiliğinden oynanır (kart al ya da dur), sonra krupiye 17’ye kadar çeker.\n3. 21’i geçmeden krupiyeden yakın: ×1.94 · Blackjack (As + 10, 2 kartta) ×2.2 · eşitlik: bahis iade. 21’i geçen ya da düşük: kayıp.',
      vi: '1. Chọn mức cược và chạm «Chia bài»: bạn và nhà cái mỗi bên 2 lá (một lá của nhà cái úp).\n2. Tay bài của bạn tự chơi theo chiến thuật cơ bản (rút hoặc dừng), rồi nhà cái rút đến 17.\n3. Gần 21 hơn nhà cái mà không quá: ×1.94 · Blackjack (Át + 10 trong 2 lá) ×2.2 · hòa: hoàn cược. Quá 21 hoặc thấp hơn: thua.',
      id: '1. Atur taruhan lalu sentuh «Bagikan»: kamu dan bandar dapat 2 kartu (satu kartu bandar tertutup).\n2. Tanganmu dimainkan otomatis dengan strategi dasar (ambil atau berhenti), lalu bandar mengambil sampai 17.\n3. Lebih dekat ke 21 dari bandar tanpa lewat: ×1.94 · Blackjack (As + 10 dalam 2 kartu) ×2.2 · seri: taruhan kembali. Lewat 21 atau lebih rendah: kalah.',
      ru: '1. Выберите ставку и нажмите «Раздать»: вы и дилер получаете по 2 карты (одна карта дилера закрыта).\n2. Ваша рука играется сама по базовой стратегии (ещё или хватит), затем дилер добирает до 17.\n3. Ближе к 21, чем дилер, без перебора: ×1.94 · блэкджек (туз + 10 двумя картами) ×2.2 · ничья: ставка возвращается. Перебор или меньше: проигрыш.',
      de: '1. Wähle deinen Einsatz und tippe auf „Geben“: Du und der Croupier bekommen 2 Karten (eine des Croupiers verdeckt).\n2. Deine Hand spielt sich selbst nach der Grundstrategie (ziehen oder stehen), dann zieht der Croupier bis 17.\n3. Näher an 21 als der Croupier, ohne zu überkaufen: ×1.94 · Blackjack (Ass + 10 mit 2 Karten) ×2.2 · Gleichstand: Einsatz zurück. Über 21 oder weniger: verloren.',
      hi: '1. राशि चुनें और «बांटें» छुएं: आपको और डीलर को 2-2 पत्ते मिलते हैं (डीलर का एक पत्ता उल्टा)।\n2. आपका हाथ बेसिक रणनीति से अपने आप खेलता है (पत्ता लें या रुकें), फिर डीलर 17 तक लेता है।\n3. 21 पार किए बिना डीलर से 21 के ज़्यादा पास: ×1.94 · ब्लैकजैक (इक्का + 10, 2 पत्तों में) ×2.2 · बराबरी: दांव वापस। 21 से ऊपर या कम: हार।',
      zh: '1. 设定金额并点击“发牌”：你和庄家各得 2 张牌（庄家一张暗牌）。\n2. 你的手牌按基本策略自动进行（要牌或停牌），然后庄家补牌到 17 点。\n3. 不爆牌且比庄家更接近 21：×1.94 · 黑杰克（两张牌 A + 10）×2.2 · 平局：退还下注。爆牌或点数更低：输。'
    }
  });

  /* =============================== THREE CARD POKER =============================== */
  // lignes : 0 perdu · 1 égalité · 2 gagné ×1.9 · 3 croupier non qualifié ×1.4 · 4 suite ×2.5 · 5 brelan ×6 · 6 quinte flush ×10
  function tcRank(h) {
    var r = h.map(function (cc) { return cc[0] === 1 ? 14 : cc[0]; }).sort(function (a, b) { return b - a; }), fl = h[0][1] === h[1][1] && h[1][1] === h[2][1];
    var st = r[0] - r[1] === 1 && r[1] - r[2] === 1, sr = r;
    if (r[0] === 14 && r[1] === 3 && r[2] === 2) { st = true; sr = [3, 2, 1]; }
    if (r[0] === r[2]) return [5, r[0]];
    if (st && fl) return [6, sr[0]];
    if (st) return [4, sr[0]];
    if (fl) return [3].concat(r);
    if (r[0] === r[1]) return [2, r[0], r[2]];
    if (r[1] === r[2]) return [2, r[1], r[0]];
    return [1].concat(r);
  }
  function tcDeal() {
    var d = deck(), P = d.slice(0, 3), D = d.slice(3, 6), pr = tcRank(P), dr = tcRank(D), cat;
    if (pr[0] === 6) cat = 6; else if (pr[0] === 5) cat = 5; else if (pr[0] === 4) cat = 4;
    else if (!(dr[0] > 1 || dr[1] >= 12)) cat = 3; else { var q = cmp(pr, dr); cat = q > 0 ? 2 : q === 0 ? 1 : 0; }
    return { P: P, D: D, cat: cat };
  }
  game({
    key: 'tcpoker', l: verb('deal'), vb: '0 0 300 250', W: [455, 1, 215, 293, 33, 2, 2],
    chips: [['<g transform="scale(.9)">' + CHIP.mini(['Q']) + '</g><path d="M-8 8L8-8" stroke="#F87171" stroke-width="2.4"/>', 1.4], [CHIP.win, 1.9], [CHIP.mini(['4', '5', '6']), 2.5], [CHIP.mini(['7', '7', '7']), 6], [CHIP.mini(['8', '9', '10'], true), 10]],
    chipOf: function (i) { return [-1, -1, 1, 0, 2, 3, 4][i]; },
    scene: felt('tcF', '#1E3A8A', '#0B1437') + '<path d="M30 125H270" stroke="#93C5FD" stroke-opacity=".25" stroke-width="1.5"/>' + txt(150, 129, 'DEALER QUALIFIES Q+', 8, '#BFDBFE', ' opacity=".45" letter-spacing="1.5"') +
      '<g id="tcD"></g><g id="tcP"></g><g id="tcDx" opacity="0">' + txt(150, 106, '✕', 18, '#F87171') + '</g>',
    init: function (c) { whoTags(c, 6, 88); },
    reset: function (c) { c.id('tcD').innerHTML = ''; c.id('tcP').innerHTML = ''; c.id('tcDx').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var i = +r.view.i, h = find(tcDeal, function (x) { return x.cat === i; }) || tcDeal(), gap = 40;
      for (var j = 0; j < 3; j++) await dealTo(c, c.id('tcP'), h.P[j], rowX(3, gap) + j * gap, 186, 1.15);
      for (j = 0; j < 3; j++) await dealTo(c, c.id('tcD'), h.D[j], rowX(3, gap) + j * gap, 62, 1.15);
      if (i === 3) c.id('tcDx').setAttribute('opacity', '1');
      if (i >= 2 && i !== 3) [].slice.call(c.id('tcP').children).forEach(function (g) { g.classList.add('cb-glow'); });
      c.sfx('stop');
    },
    rules: {
      en: '1. Set your stake and tap “Deal”: 3 cards for you, 3 for the dealer.\n2. Poker order (3 cards): straight flush, three of a kind, straight, flush, pair, high card. The dealer plays only with a Queen or better.\n3. You beat the dealer ×1.9 · dealer does not play ×1.4 · bonus whatever the dealer holds: straight ×2.5 · three of a kind ×6 · straight flush ×10 · tie: stake back.',
      fr: '1. Choisis ta mise et touche « Distribuer » : 3 cartes pour toi, 3 pour le croupier.\n2. Ordre du poker (3 cartes) : quinte flush, brelan, suite, couleur, paire, carte haute. Le croupier ne joue qu’avec une Dame ou mieux.\n3. Tu bats le croupier ×1.9 · le croupier ne joue pas ×1.4 · bonus quelle que soit sa main : suite ×2.5 · brelan ×6 · quinte flush ×10 · égalité : mise rendue.',
      es: '1. Elige tu apuesta y toca «Repartir»: 3 cartas para ti y 3 para el crupier.\n2. Orden del póker (3 cartas): escalera de color, trío, escalera, color, pareja, carta alta. El crupier solo juega con Reina o más.\n3. Ganas al crupier ×1.9 · el crupier no juega ×1.4 · bono sea cual sea su mano: escalera ×2.5 · trío ×6 · escalera de color ×10 · empate: se devuelve la apuesta.',
      pt: '1. Escolha o valor e toque em «Distribuir»: 3 cartas para você e 3 para a banca.\n2. Ordem do pôquer (3 cartas): straight flush, trinca, sequência, flush, par, carta alta. A banca só joga com Dama ou melhor.\n3. Você vence a banca ×1.9 · a banca não joga ×1.4 · bônus seja qual for a mão dela: sequência ×2.5 · trinca ×6 · straight flush ×10 · empate: aposta devolvida.',
      ar: '1. اختر الرهان والمس «وزّع»: 3 أوراق لك و3 للموزّع.\n2. ترتيب البوكر (3 أوراق): متتالية من نفس النوع، ثلاثية، متتالية، نفس النوع، زوج، ورقة عالية. لا يلعب الموزّع إلا بملكة أو أعلى.\n3. تتغلب على الموزّع ×1.9 · الموزّع لا يلعب ×1.4 · مكافأة مهما كانت يده: متتالية ×2.5 · ثلاثية ×6 · متتالية من نفس النوع ×10 · تعادل: يُعاد الرهان.',
      tr: '1. Bahsini seç ve “Dağıt”a dokun: sana 3 kart, krupiyeye 3 kart.\n2. Poker sırası (3 kart): floş düz, üçlü, düz, floş, çift, yüksek kart. Krupiye ancak Kız veya üstüyle oynar.\n3. Krupiyeyi yenersen ×1.9 · krupiye oynamazsa ×1.4 · krupiyenin eli ne olursa olsun bonus: düz ×2.5 · üçlü ×6 · floş düz ×10 · eşitlik: bahis iade.',
      vi: '1. Chọn mức cược và chạm «Chia bài»: 3 lá cho bạn, 3 lá cho nhà cái.\n2. Thứ tự poker (3 lá): thùng phá sảnh, sám cô, sảnh, thùng, đôi, mậu thầu. Nhà cái chỉ chơi khi có Q trở lên.\n3. Thắng nhà cái ×1.9 · nhà cái không đủ điều kiện ×1.4 · thưởng bất kể bài nhà cái: sảnh ×2.5 · sám cô ×6 · thùng phá sảnh ×10 · hòa: hoàn cược.',
      id: '1. Atur taruhan lalu sentuh «Bagikan»: 3 kartu untukmu, 3 untuk bandar.\n2. Urutan poker (3 kartu): straight flush, three of a kind, straight, flush, pair, kartu tinggi. Bandar hanya main dengan Queen atau lebih.\n3. Kalahkan bandar ×1.9 · bandar tidak main ×1.4 · bonus apa pun kartu bandar: straight ×2.5 · three of a kind ×6 · straight flush ×10 · seri: taruhan kembali.',
      ru: '1. Выберите ставку и нажмите «Раздать»: 3 карты вам, 3 дилеру.\n2. Порядок покера (3 карты): стрит-флеш, тройка, стрит, флеш, пара, старшая карта. Дилер играет только с дамой или выше.\n3. Вы бьёте дилера ×1.9 · дилер не играет ×1.4 · бонус при любой руке дилера: стрит ×2.5 · тройка ×6 · стрит-флеш ×10 · ничья: ставка возвращается.',
      de: '1. Wähle deinen Einsatz und tippe auf „Geben“: 3 Karten für dich, 3 für den Croupier.\n2. Poker-Reihenfolge (3 Karten): Straight Flush, Drilling, Straße, Flush, Paar, hohe Karte. Der Croupier spielt nur mit Dame oder besser.\n3. Du schlägst den Croupier ×1.9 · Croupier spielt nicht ×1.4 · Bonus egal was er hat: Straße ×2.5 · Drilling ×6 · Straight Flush ×10 · Gleichstand: Einsatz zurück.',
      hi: '1. राशि चुनें और «बांटें» छुएं: 3 पत्ते आपको, 3 डीलर को।\n2. पोकर क्रम (3 पत्ते): स्ट्रेट फ्लश, तीन एक जैसे, स्ट्रेट, फ्लश, जोड़ी, बड़ा पत्ता। डीलर केवल बेगम या बेहतर से खेलता है।\n3. डीलर को हराएं ×1.9 · डीलर नहीं खेलता ×1.4 · डीलर के पत्ते जो भी हों, बोनस: स्ट्रेट ×2.5 · तीन एक जैसे ×6 · स्ट्रेट फ्लश ×10 · बराबरी: दांव वापस।',
      zh: '1. 设定金额并点击“发牌”：你 3 张，庄家 3 张。\n2. 牌型大小（3 张）：同花顺、三条、顺子、同花、对子、高牌。庄家需 Q 高或以上才参与。\n3. 赢庄家 ×1.9 · 庄家不合格 ×1.4 · 无论庄家牌型的奖励：顺子 ×2.5 · 三条 ×6 · 同花顺 ×10 · 平局：退还下注。'
    }
  });

  /* =============================== CASINO HOLD'EM =============================== */
  // 2 cartes chacun + 5 au milieu, meilleure main de 5 sur 7. Lignes : 0 perdu · 1 égalité · 2 gagné · 3 couleur · 4 full · 5 carré · 6 quinte flush
  function rank5(h) {
    var r = h.map(function (cc) { return cc[0] === 1 ? 14 : cc[0]; }).sort(function (a, b) { return b - a; }), fl = h.every(function (cc) { return cc[1] === h[0][1]; });
    var cnt = {}; r.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; });
    var g = Object.keys(cnt).map(Number).sort(function (a, b) { return cnt[b] - cnt[a] || b - a; }), u = g.length;
    var st = u === 5 && r[0] - r[4] === 4, top = r[0];
    if (u === 5 && r[0] === 14 && r[1] === 5) { st = true; top = 5; }
    if (st && fl) return [9, top];
    if (cnt[g[0]] === 4) return [8].concat(g);
    if (cnt[g[0]] === 3 && cnt[g[1]] === 2) return [7].concat(g);
    if (fl) return [6].concat(r);
    if (st) return [5, top];
    if (cnt[g[0]] === 3) return [4].concat(g);
    if (cnt[g[0]] === 2 && cnt[g[1]] === 2) return [3].concat(g);
    if (cnt[g[0]] === 2) return [2].concat(g);
    return [1].concat(r);
  }
  function best7(cs) { var b = null, bi = null; for (var a = 0; a < 7; a++) for (var z = a + 1; z < 7; z++) { var idx = [0, 1, 2, 3, 4, 5, 6].filter(function (q) { return q !== a && q !== z; }), rr = rank5(idx.map(function (q) { return cs[q]; })); if (!b || cmp(rr, b) > 0) { b = rr; bi = idx; } } return [b, bi]; }
  function heDeal(want) {
    var d = deck(), P = d.slice(0, 2), D = d.slice(2, 4), B = d.slice(4, 9);
    var pb = best7(P.concat(B)), pc = pb[0][0], cat;
    if (pc === 9) cat = 6; else if (pc === 8) cat = 5; else if (pc === 7) cat = 4; else if (pc === 6) cat = 3;
    if (cat == null) { if (want >= 3) return null; var q = cmp(pb[0], best7(D.concat(B))[0]); cat = q > 0 ? 2 : q === 0 ? 1 : 0; }
    return { P: P, D: D, B: B, best: pb[1], cat: cat };
  }
  // quinte flush (rare) : construite directement, le reste au hasard
  function heSF() {
    for (var t = 0; t < 200; t++) {
      var s = rnd(4), top = 5 + rnd(10), run = []; for (var k = 0; k < 5; k++) { var rv = top - k; run.push([rv === 14 ? 1 : rv, s]); }
      var rest = deck().filter(function (cc) { return !run.some(function (x) { return x[0] === cc[0] && x[1] === cc[1]; }); });
      var seven = shuffle(run.concat(rest.slice(0, 2))), P = seven.slice(0, 2), B = seven.slice(2, 7), D = rest.slice(2, 4);
      var pb = best7(P.concat(B)); if (pb[0][0] === 9) return { P: P, D: D, B: B, best: pb[1], cat: 6 };
    }
    return null;
  }
  game({
    key: 'holdem', l: verb('deal'), vb: '0 0 300 250', W: [476, 38, 428, 31, 26, 2, 1],
    chips: [[CHIP.win, 1.75], [CHIP.flush, 2.2], [CHIP.mini(['K', 'K', '7', '7']), 2.6], [CHIP.mini(['A', 'A', 'A', 'A']), 6], [CHIP.mini(['9', '10', 'J'], true), 20]],
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: felt('heF', '#7F1D1D', '#2A0A0A') + '<rect x="40" y="96" width="220" height="56" rx="12" fill="#000" opacity=".22"/><g id="heB"></g><g id="heD"></g><g id="heP"></g>',
    init: function (c) { whoTags(c, 4, 90); },
    reset: function (c) { ['heB', 'heD', 'heP'].forEach(function (k) { c.id(k).innerHTML = ''; }); },
    play: async function (c, r) {
      var i = +r.view.i, h = i === 6 ? heSF() : find(function () { return heDeal(i); }, function (x) { return x && x.cat === i; }, 60000);
      if (!h) h = heDeal(0);
      var gap = 42, bg = 41;
      for (var j = 0; j < 2; j++) await dealTo(c, c.id('heP'), h.P[j], rowX(2, gap) + j * gap, 206, 1.05);
      for (j = 0; j < 2; j++) await dealTo(c, c.id('heD'), h.D[j], rowX(2, gap) + j * gap, 46, 1.05);
      for (j = 0; j < 5; j++) { await dealTo(c, c.id('heB'), h.B[j], rowX(5, bg) + j * bg, 124, 1.05); if (j === 2 || j === 3) await wait(c.box, 220); }
      if (i >= 2) { var all = [].slice.call(c.id('heP').children).concat([].slice.call(c.id('heB').children)); h.best.forEach(function (q) { if (all[q]) all[q].classList.add('cb-glow'); }); }
      c.sfx('stop');
    },
    rules: {
      en: '1. Set your stake and tap “Deal”: 2 cards for you, 2 for the dealer, then 5 shared cards in the middle.\n2. Each side makes its best 5-card poker hand out of 7.\n3. You beat the dealer ×1.75 · bonus whatever the dealer holds: flush ×2.2 · full house ×2.6 · four of a kind ×6 · straight flush ×20 · tie: stake back.',
      fr: '1. Choisis ta mise et touche « Distribuer » : 2 cartes pour toi, 2 pour le croupier, puis 5 cartes communes au milieu.\n2. Chacun forme sa meilleure main de poker de 5 cartes sur 7.\n3. Tu bats le croupier ×1.75 · bonus quelle que soit sa main : couleur ×2.2 · full ×2.6 · carré ×6 · quinte flush ×20 · égalité : mise rendue.',
      es: '1. Elige tu apuesta y toca «Repartir»: 2 cartas para ti, 2 para el crupier y 5 cartas comunes en el centro.\n2. Cada uno forma su mejor mano de póker de 5 cartas entre 7.\n3. Ganas al crupier ×1.75 · bono sea cual sea su mano: color ×2.2 · full ×2.6 · póker ×6 · escalera de color ×20 · empate: se devuelve la apuesta.',
      pt: '1. Escolha o valor e toque em «Distribuir»: 2 cartas para você, 2 para a banca e 5 cartas comunitárias no meio.\n2. Cada lado forma sua melhor mão de pôquer de 5 cartas entre 7.\n3. Você vence a banca ×1.75 · bônus seja qual for a mão dela: flush ×2.2 · full house ×2.6 · quadra ×6 · straight flush ×20 · empate: aposta devolvida.',
      ar: '1. اختر الرهان والمس «وزّع»: ورقتان لك وورقتان للموزّع ثم 5 أوراق مشتركة في الوسط.\n2. يكوّن كل طرف أفضل يد بوكر من 5 أوراق من بين 7.\n3. تتغلب على الموزّع ×1.75 · مكافأة مهما كانت يده: نفس النوع ×2.2 · فل هاوس ×2.6 · أربعة متشابهة ×6 · متتالية من نفس النوع ×20 · تعادل: يُعاد الرهان.',
      tr: '1. Bahsini seç ve “Dağıt”a dokun: sana 2, krupiyeye 2 kart, ortaya 5 ortak kart.\n2. Her taraf 7 karttan en iyi 5 kartlık poker elini yapar.\n3. Krupiyeyi yenersen ×1.75 · krupiyenin eli ne olursa olsun bonus: floş ×2.2 · full ×2.6 · kare ×6 · floş düz ×20 · eşitlik: bahis iade.',
      vi: '1. Chọn mức cược và chạm «Chia bài»: 2 lá cho bạn, 2 lá cho nhà cái, rồi 5 lá chung ở giữa.\n2. Mỗi bên chọn 5 lá tốt nhất trong 7 lá.\n3. Thắng nhà cái ×1.75 · thưởng bất kể bài nhà cái: thùng ×2.2 · cù lũ ×2.6 · tứ quý ×6 · thùng phá sảnh ×20 · hòa: hoàn cược.',
      id: '1. Atur taruhan lalu sentuh «Bagikan»: 2 kartu untukmu, 2 untuk bandar, lalu 5 kartu bersama di tengah.\n2. Tiap pihak membentuk tangan poker 5 kartu terbaik dari 7.\n3. Kalahkan bandar ×1.75 · bonus apa pun kartu bandar: flush ×2.2 · full house ×2.6 · four of a kind ×6 · straight flush ×20 · seri: taruhan kembali.',
      ru: '1. Выберите ставку и нажмите «Раздать»: 2 карты вам, 2 дилеру и 5 общих карт в центре.\n2. Каждый собирает лучшую покерную комбинацию из 5 карт из 7.\n3. Вы бьёте дилера ×1.75 · бонус при любой руке дилера: флеш ×2.2 · фулл-хаус ×2.6 · каре ×6 · стрит-флеш ×20 · ничья: ставка возвращается.',
      de: '1. Wähle deinen Einsatz und tippe auf „Geben“: 2 Karten für dich, 2 für den Croupier, dann 5 gemeinsame Karten in der Mitte.\n2. Jede Seite bildet ihre beste 5-Karten-Pokerhand aus 7.\n3. Du schlägst den Croupier ×1.75 · Bonus egal was er hat: Flush ×2.2 · Full House ×2.6 · Vierling ×6 · Straight Flush ×20 · Gleichstand: Einsatz zurück.',
      hi: '1. राशि चुनें और «बांटें» छुएं: 2 पत्ते आपको, 2 डीलर को, फिर बीच में 5 साझा पत्ते।\n2. हर पक्ष 7 में से 5 पत्तों का सबसे अच्छा पोकर हाथ बनाता है।\n3. डीलर को हराएं ×1.75 · डीलर के पत्ते जो भी हों, बोनस: फ्लश ×2.2 · फुल हाउस ×2.6 · चार एक जैसे ×6 · स्ट्रेट फ्लश ×20 · बराबरी: दांव वापस।',
      zh: '1. 设定金额并点击“发牌”：你 2 张，庄家 2 张，中间再发 5 张公共牌。\n2. 双方各用 7 张中最好的 5 张组成扑克牌型。\n3. 赢庄家 ×1.75 · 无论庄家牌型的奖励：同花 ×2.2 · 葫芦 ×2.6 · 四条 ×6 · 同花顺 ×20 · 平局：退还下注。'
    }
  });

  /* =============================== NIU NIU =============================== */
  // 5 cartes ; A = 1, figures = 10. Trois cartes qui font 10, 20 ou 30 → « bœuf » = total des deux autres (0 → niu niu). Lignes : 0 rien · 1…9 bœuf n · 10 niu niu · 11 cinq figures
  function nv(cc) { return cc[0] > 10 ? 10 : cc[0]; }
  function niu(h) {
    if (h.every(function (cc) { return cc[0] > 10; })) return { bull: 11, three: [0, 1, 2] };
    for (var a = 0; a < 5; a++) for (var b = a + 1; b < 5; b++) for (var e = b + 1; e < 5; e++) {
      if ((nv(h[a]) + nv(h[b]) + nv(h[e])) % 10 === 0) { var rest = [0, 1, 2, 3, 4].filter(function (q) { return q !== a && q !== b && q !== e; }), s = (nv(h[rest[0]]) + nv(h[rest[1]])) % 10; return { bull: s === 0 ? 10 : s, three: [a, b, e] }; }
    }
    return { bull: -1 };
  }
  function bullHead(n) { return '<g><path d="M-26-10Q-34-26-20-30Q-24-20-14-16M26-10Q34-26 20-30Q24-20 14-16" fill="#FEF3C7" stroke="#92400E" stroke-width="1.2"/><path d="M-16-18Q0-26 16-18L14 8Q0 22-14 8z" fill="#B45309" stroke="#78350F" stroke-width="1.2"/><ellipse cy="10" rx="11" ry="7" fill="#FDBA74"/><circle cx="-4" cy="10" r="1.6" fill="#78350F"/><circle cx="4" cy="10" r="1.6" fill="#78350F"/><circle cx="-7" cy="-6" r="2" fill="#111"/><circle cx="7" cy="-6" r="2" fill="#111"/>' + (n ? txt(0, 42, n, 18, '#FDE68A') : '') + '</g>'; }
  game({
    key: 'niuniu', l: verb('deal'), vb: '0 0 300 250', W: [336, 66, 65, 66, 65, 68, 65, 66, 65, 66, 74, 1],
    chips: [['<text y="4" text-anchor="middle" font-size="9.5" font-weight="900" fill="#FDE68A" font-family="Arial">1–6</text>', 0.6], ['<text y="4" text-anchor="middle" font-size="9.5" font-weight="900" fill="#FDE68A" font-family="Arial">7–9</text>', 2.2],
      ['<g transform="scale(.42) translate(0 -4)">' + bullHead('') + '</g>', 3.45], [CHIP.mini(['J', 'Q', 'K']), 50]],
    chipOf: function (i) { return i <= 0 ? -1 : i <= 6 ? 0 : i <= 9 ? 1 : i === 10 ? 2 : 3; },
    scene: felt('nnF', '#B91C1C', '#3F0A0A') + '<g opacity=".18">' + [0, 1, 2, 3].map(function (j) { return '<circle cx="' + (40 + j * 74) + '" cy="40" r="26" fill="none" stroke="#FDE68A" stroke-width="2"/>'; }).join('') + '</g>' +
      '<g id="nnC"></g><g id="nnBull" transform="translate(150 70)" opacity="0"></g><g id="nnSum" opacity="0"></g>',
    reset: function (c) { c.id('nnC').innerHTML = ''; c.id('nnBull').setAttribute('opacity', '0'); c.id('nnSum').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var i = +r.view.i, h;
      if (i === 11) { var faces = deck().filter(function (cc) { return cc[0] > 10; }); h = faces.slice(0, 5); }
      else h = find(function () { return deck().slice(0, 5); }, function (x) { var b = niu(x).bull; return i === 0 ? b === -1 : b === i; }, 60000) || deck().slice(0, 5);
      var L = c.id('nnC'), gap = 50, y = 180, gs = [];
      for (var j = 0; j < 5; j++) gs.push(await dealTo(c, L, h[j], rowX(5, gap) + j * gap, y, 1.3));
      await wait(c.box, 300);
      var n = niu(h), bl = c.id('nnBull');
      if (n.bull > 0 && n.bull < 11) {
        // les trois cartes qui font un compte rond montent ensemble
        var up = n.three, dn = [0, 1, 2, 3, 4].filter(function (q) { return up.indexOf(q) < 0; });
        var pos = function (q) { var u = up.indexOf(q); return u >= 0 ? [60 + u * 40, 160] : [200 + dn.indexOf(q) * 44, 196]; };
        await tw(c.box, 420, function (k) { var e = ease(k); gs.forEach(function (g, q) { var p = pos(q); tr(g, lerp(rowX(5, gap) + q * gap, p[0], e), lerp(y, p[1], e), 1.3 - 0.25 * e); }); });
        var s3 = up.reduce(function (a, q) { return a + nv(h[q]); }, 0);
        c.id('nnSum').innerHTML = txt(100, 214, String(s3), 14, '#FDE68A') + txt(222, 236, String(dn.reduce(function (a, q) { return a + nv(h[q]); }, 0)), 14, '#FDE68A');
        c.id('nnSum').setAttribute('opacity', '1');
      }
      bl.innerHTML = n.bull === -1 ? '<g opacity=".55">' + bullHead('') + '<path d="M-24-24L24 24" stroke="#F87171" stroke-width="5"/></g>' : bullHead(n.bull === 10 ? '牛牛' : n.bull === 11 ? 'J Q K' : String(n.bull));
      c.sfx('stop');
      await tw(c.box, 360, function (k) { bl.setAttribute('opacity', String(k)); bl.setAttribute('transform', 'translate(150 70) scale(' + (0.6 + 0.4 * ease(k)).toFixed(3) + ')'); });
    },
    rules: {
      en: '1. Set your stake and tap “Deal”: you get 5 cards (Ace = 1, J Q K = 10).\n2. If 3 cards add up to 10, 20 or 30 you have a bull: the last digit of the 2 other cards is your bull (0 = Niu Niu).\n3. Bull 1–6 ×0.6 · bull 7–9 ×2.2 · Niu Niu ×3.45 · five face cards ×50. No bull: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Distribuer » : tu reçois 5 cartes (As = 1, V D R = 10).\n2. Si 3 cartes font 10, 20 ou 30, tu as un bœuf : le dernier chiffre des 2 autres cartes est ton bœuf (0 = Niu Niu).\n3. Bœuf 1–6 ×0.6 · bœuf 7–9 ×2.2 · Niu Niu ×3.45 · cinq figures ×50. Pas de bœuf : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Repartir»: recibes 5 cartas (As = 1, J Q K = 10).\n2. Si 3 cartas suman 10, 20 o 30 tienes un toro: la última cifra de las otras 2 es tu toro (0 = Niu Niu).\n3. Toro 1–6 ×0.6 · toro 7–9 ×2.2 · Niu Niu ×3.45 · cinco figuras ×50. Sin toro: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Distribuir»: você recebe 5 cartas (Ás = 1, J Q K = 10).\n2. Se 3 cartas somam 10, 20 ou 30 você tem um touro: o último dígito das outras 2 é o seu touro (0 = Niu Niu).\n3. Touro 1–6 ×0.6 · touro 7–9 ×2.2 · Niu Niu ×3.45 · cinco figuras ×50. Sem touro: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «وزّع»: تحصل على 5 أوراق (الآس = 1، الشاب والملكة والملك = 10).\n2. إذا كان مجموع 3 أوراق 10 أو 20 أو 30 فلديك «ثور»: آخر رقم في مجموع الورقتين الأخريين هو ثورك (0 = نيو نيو).\n3. ثور 1–6 ×0.6 · ثور 7–9 ×2.2 · نيو نيو ×3.45 · خمس صور ×50. بلا ثور: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Dağıt”a dokun: 5 kart alırsın (As = 1, J Q K = 10).\n2. 3 kartın toplamı 10, 20 veya 30 ise boğan var: diğer 2 kartın son rakamı boğandır (0 = Niu Niu).\n3. Boğa 1–6 ×0.6 · boğa 7–9 ×2.2 · Niu Niu ×3.45 · beş resimli kart ×50. Boğa yoksa bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Chia bài»: bạn nhận 5 lá (Át = 1, J Q K = 10).\n2. Nếu 3 lá cộng lại bằng 10, 20 hoặc 30 là có «ngưu»: số cuối của tổng 2 lá còn lại là điểm ngưu (0 = Ngưu Ngưu).\n3. Ngưu 1–6 ×0.6 · ngưu 7–9 ×2.2 · Ngưu Ngưu ×3.45 · năm lá hình ×50. Không có ngưu: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Bagikan»: kamu dapat 5 kartu (As = 1, J Q K = 10).\n2. Jika 3 kartu berjumlah 10, 20 atau 30 kamu punya banteng: angka terakhir dari 2 kartu lain adalah bantengmu (0 = Niu Niu).\n3. Banteng 1–6 ×0.6 · banteng 7–9 ×2.2 · Niu Niu ×3.45 · lima kartu gambar ×50. Tanpa banteng: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Раздать»: вы получаете 5 карт (туз = 1, В Д К = 10).\n2. Если 3 карты дают 10, 20 или 30 — у вас «бык»: последняя цифра суммы двух других карт и есть бык (0 = Ниу-Ниу).\n3. Бык 1–6 ×0.6 · бык 7–9 ×2.2 · Ниу-Ниу ×3.45 · пять картинок ×50. Нет быка — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Geben“: Du bekommst 5 Karten (Ass = 1, B D K = 10).\n2. Ergeben 3 Karten 10, 20 oder 30, hast du einen Bullen: die letzte Ziffer der 2 anderen Karten ist dein Bulle (0 = Niu Niu).\n3. Bulle 1–6 ×0.6 · Bulle 7–9 ×2.2 · Niu Niu ×3.45 · fünf Bildkarten ×50. Kein Bulle: Einsatz verloren.',
      hi: '1. राशि चुनें और «बांटें» छुएं: आपको 5 पत्ते मिलते हैं (इक्का = 1, गुलाम बेगम बादशाह = 10)।\n2. अगर 3 पत्तों का जोड़ 10, 20 या 30 हो तो आपके पास «बैल» है: बाकी 2 पत्तों के जोड़ का आखिरी अंक आपका बैल है (0 = नियू नियू)।\n3. बैल 1–6 ×0.6 · बैल 7–9 ×2.2 · नियू नियू ×3.45 · पांचों तस्वीर वाले पत्ते ×50। बैल नहीं: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“发牌”：你得到 5 张牌（A = 1，J Q K = 10）。\n2. 若 3 张牌之和为 10、20 或 30 即“有牛”：另外 2 张之和的个位数就是牛几（0 = 牛牛）。\n3. 牛一至牛六 ×0.6 · 牛七至牛九 ×2.2 · 牛牛 ×3.45 · 五花牛 ×50。无牛：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
