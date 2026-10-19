/* casb4 — Double Roulette, Twin Wheel, Two-Up, Fan-Tan (owner request, round 6) — instant games; the scene always shows exactly the line (or option) the server drew (casino_ext/casb.php). */
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
  function pillG(id, x, y, w, col) { return '<g id="' + id + '" transform="translate(' + x + ' ' + y + ')" opacity="0"><rect x="' + (-w / 2) + '" y="-13" width="' + w + '" height="26" rx="13" fill="#0B1220" stroke="' + (col || '#FDE68A') + '" stroke-width="1.5"/><text y="6" text-anchor="middle" font-size="16" font-weight="900" fill="' + (col || '#FDE68A') + '" font-family="Arial,sans-serif"></text></g>'; }
  function setP(c, id, t) { var g = c.id(id); g.querySelector('text').textContent = t; g.setAttribute('opacity', t === '' ? '0' : '1'); }
  function arc(cx, cy, r0, r1, a0, a1) { var p = function (r, a) { return (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1); }; return 'M' + p(r0, a0) + 'L' + p(r1, a0) + 'A' + r1 + ' ' + r1 + ' 0 0 1 ' + p(r1, a1) + 'L' + p(r0, a1) + 'A' + r0 + ' ' + r0 + ' 0 0 0 ' + p(r0, a0) + 'z'; }

  /* =============================== DOUBLE BALL ROULETTE (choix) =============================== */
  // roue européenne (37 cases), 2 billes. Options : 0 rouge-rouge · 1 un de chaque · 2 noir-noir · 3 au moins un zéro (exact /1369)
  var EU = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  function rcol(n) { return n === 0 ? 'g' : REDS.indexOf(n) >= 0 ? 'r' : 'b'; }
  var DR_P = [324 / 1369, 648 / 1369, 324 / 1369, 73 / 1369], DR_CX = 150, DR_CY = 118, SEG = Math.PI * 2 / 37;
  function drPair(w) { for (var t = 0; t < 5000; t++) { var a = rnd(37), b = rnd(37), ca = rcol(a), cb = rcol(b), k = ca === 'g' || cb === 'g' ? 3 : ca === 'r' && cb === 'r' ? 0 : ca === 'b' && cb === 'b' ? 2 : 1; if (k === w) return [a, b]; } return [0, 0]; }
  function drIco(a, b) { var f = { r: '#DC2626', b: '#111827', g: '#16A34A' }; return '<svg viewBox="-12 -8 24 16" aria-hidden="true"><circle cx="-5" r="6" fill="' + f[a] + '" stroke="#fff" stroke-width="1.2"/><circle cx="5" r="6" fill="' + f[b] + '" stroke="#fff" stroke-width="1.2"/>' + (a === 'g' ? '<text x="-5" y="3" text-anchor="middle" font-size="8" font-weight="900" fill="#fff" font-family="Arial">0</text>' : '') + '</svg>'; }
  game({
    key: 'dblroul', l: verb('spin'), vb: '0 0 300 250', n: 4, W: DR_P,
    scene: felt('drF', '#14532D', '#022C22') + '<circle cx="' + DR_CX + '" cy="' + DR_CY + '" r="112" fill="#78350F" stroke="#FBBF24" stroke-width="3"/><circle cx="' + DR_CX + '" cy="' + DR_CY + '" r="102" fill="#3F1D0B"/>' +
      '<g id="drW">' + EU.map(function (n, j) { var a0 = -Math.PI / 2 + j * SEG - SEG / 2, a1 = a0 + SEG, am = a0 + SEG / 2, c = rcol(n); return '<path d="' + arc(DR_CX, DR_CY, 62, 96, a0, a1) + '" fill="' + (c === 'g' ? '#16A34A' : c === 'r' ? '#DC2626' : '#111827') + '" stroke="#FDE68A" stroke-width=".5"/>' +
        '<text x="' + (DR_CX + Math.cos(am) * 87).toFixed(1) + '" y="' + (DR_CY + Math.sin(am) * 87).toFixed(1) + '" transform="rotate(' + (am * 180 / Math.PI + 90).toFixed(1) + ' ' + (DR_CX + Math.cos(am) * 87).toFixed(1) + ' ' + (DR_CY + Math.sin(am) * 87).toFixed(1) + ')" text-anchor="middle" dominant-baseline="central" font-size="7.5" font-weight="800" fill="#fff" font-family="Arial,sans-serif">' + n + '</text>'; }).join('') +
        '<circle cx="' + DR_CX + '" cy="' + DR_CY + '" r="62" fill="#92400E" stroke="#FBBF24" stroke-width="2"/>' + [0, 1, 2, 3].map(function (j) { return '<path d="M' + DR_CX + ' ' + DR_CY + 'l0-46" transform="rotate(' + (j * 90) + ' ' + DR_CX + ' ' + DR_CY + ')" stroke="#FDE68A" stroke-width="4" stroke-linecap="round"/>'; }).join('') + '<circle cx="' + DR_CX + '" cy="' + DR_CY + '" r="12" fill="#FDE68A"/></g>' +
      '<g id="drB0"><circle r="5" fill="#fff" stroke="#94A3B8"/></g><g id="drB1"><circle r="5" fill="#fff" stroke="#94A3B8"/></g>' + pillG('drN0', 110, 238, 44) + pillG('drN1', 190, 238, 44),
    opts: function () { return '<div class="cg-opts dr-opts">' + [['r', 'r'], ['r', 'b'], ['b', 'b'], ['g', 'r']].map(function (q, j) { return optBtn(j, drIco(q[0], q[1]), pm(DR_P[j])); }).join('') + '</div>'; },
    init: function (c) { c.rot = 0; c.place = function (b, ang, rad) { tr(c.id('drB' + b), DR_CX + Math.cos(ang) * rad, DR_CY + Math.sin(ang) * rad); }; c.place(0, -1.2, 100); c.place(1, 1.9, 100); },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { setP(c, 'drN0', ''); setP(c, 'drN1', ''); },
    play: async function (c, r) {
      var pr = drPair(+r.view.w), R0 = c.rot, R1 = R0 + 540 + rnd(360), wEl = c.id('drW');
      var fin = pr.map(function (n) { return (R1 * Math.PI / 180) - Math.PI / 2 + EU.indexOf(n) * SEG; }), st = [fin[0] + Math.PI * 2 * 4 + 1.3, fin[1] + Math.PI * 2 * 5 + 2.6], last = -1;
      await tw(c.box, 3600, function (k) {
        var e = ease(k), rot = lerp(R0, R1, e); wEl.setAttribute('transform', 'rotate(' + rot.toFixed(1) + ' ' + DR_CX + ' ' + DR_CY + ')');
        for (var b = 0; b < 2; b++) { var kb = Math.min(1, k * (b ? 1 : 1.08)), eb = 1 - Math.pow(1 - kb, 2.4); c.place(b, lerp(st[b], fin[b], eb), kb < 0.75 ? 100 : lerp(100, 79, (kb - 0.75) / 0.25) + Math.sin(kb * 40) * (1 - kb) * 3); }
        var tick = Math.floor(rot / 9.73); if (tick !== last) { last = tick; if (k < 0.92) c.sfx('tick'); }
      });
      c.rot = R1 % 360; wEl.setAttribute('transform', 'rotate(' + c.rot.toFixed(1) + ' ' + DR_CX + ' ' + DR_CY + ')');
      c.sfx('stop');
      pr.forEach(function (n, b) { var g = c.id('drN' + b), col = rcol(n); setP(c, 'drN' + b, String(n)); g.querySelector('rect').setAttribute('fill', col === 'g' ? '#16A34A' : col === 'r' ? '#B91C1C' : '#111827'); });
    },
    rules: {
      en: '1. Pick a bet: both red, one of each, both black, or a zero; set your stake and tap “Spin”.\n2. Two balls are launched on a European wheel (0 to 36).\n3. Both red ×3.97 · one red + one black ×1.98 · both black ×3.97 · at least one zero ×17.62. Otherwise the stake is lost.',
      fr: '1. Choisis : deux rouges, un de chaque, deux noirs ou un zéro ; ta mise, puis touche « Tourner ».\n2. Deux billes sont lancées sur une roue européenne (0 à 36).\n3. Deux rouges ×3.97 · un rouge + un noir ×1.98 · deux noirs ×3.97 · au moins un zéro ×17.62. Sinon, la mise est perdue.',
      es: '1. Elige: dos rojos, uno de cada, dos negros o un cero; tu apuesta y toca «Girar».\n2. Se lanzan dos bolas en una ruleta europea (0 a 36).\n3. Dos rojos ×3.97 · un rojo + un negro ×1.98 · dos negros ×3.97 · al menos un cero ×17.62. Si no, pierdes la apuesta.',
      pt: '1. Escolha: dois vermelhos, um de cada, dois pretos ou um zero; o valor e toque em «Girar».\n2. Duas bolas são lançadas numa roleta europeia (0 a 36).\n3. Dois vermelhos ×3.97 · um vermelho + um preto ×1.98 · dois pretos ×3.97 · pelo menos um zero ×17.62. Senão, a aposta é perdida.',
      ar: '1. اختر: أحمران، واحد من كل لون، أسودان، أو صفر؛ والرهان ثم المس «أدر».\n2. تُطلق كرتان على عجلة روليت أوروبية (0 إلى 36).\n3. أحمران ×3.97 · أحمر + أسود ×1.98 · أسودان ×3.97 · صفر واحد على الأقل ×17.62. غير ذلك: تخسر الرهان.',
      tr: '1. Seç: iki kırmızı, birer tane, iki siyah veya sıfır; bahsini belirle ve “Çevir”e dokun.\n2. Avrupa ruletine (0–36) iki top atılır.\n3. İki kırmızı ×3.97 · bir kırmızı + bir siyah ×1.98 · iki siyah ×3.97 · en az bir sıfır ×17.62. Aksi halde bahis kaybedilir.',
      vi: '1. Chọn: hai đỏ, mỗi màu một, hai đen hoặc số 0; mức cược rồi chạm «Quay».\n2. Hai viên bi được thả trên vòng quay châu Âu (0 đến 36).\n3. Hai đỏ ×3.97 · một đỏ + một đen ×1.98 · hai đen ×3.97 · ít nhất một số 0 ×17.62. Nếu không, mất tiền cược.',
      id: '1. Pilih: dua merah, satu-satu, dua hitam, atau nol; atur taruhan lalu sentuh «Putar».\n2. Dua bola dilempar di roda roulette Eropa (0 sampai 36).\n3. Dua merah ×3.97 · satu merah + satu hitam ×1.98 · dua hitam ×3.97 · minimal satu nol ×17.62. Selain itu taruhan hilang.',
      ru: '1. Выберите: оба красные, по одному, оба чёрные или зеро; ставку и нажмите «Крутить».\n2. На европейское колесо (0–36) запускают два шарика.\n3. Оба красные ×3.97 · красный + чёрный ×1.98 · оба чёрные ×3.97 · хотя бы одно зеро ×17.62. Иначе ставка проиграна.',
      de: '1. Wähle: zweimal Rot, je eins, zweimal Schwarz oder eine Null; deinen Einsatz und tippe auf „Drehen“.\n2. Zwei Kugeln laufen auf einem europäischen Kessel (0 bis 36).\n3. Zweimal Rot ×3.97 · Rot + Schwarz ×1.98 · zweimal Schwarz ×3.97 · mindestens eine Null ×17.62. Sonst ist der Einsatz verloren.',
      hi: '1. चुनें: दोनों लाल, एक-एक, दोनों काले या शून्य; राशि चुनें और «घुमाएं» छुएं।\n2. यूरोपीय रूलेट (0 से 36) पर दो गेंदें छोड़ी जाती हैं।\n3. दोनों लाल ×3.97 · एक लाल + एक काला ×1.98 · दोनों काले ×3.97 · कम से कम एक शून्य ×17.62। नहीं तो दांव हार जाते हैं।',
      zh: '1. 选择：双红、一红一黑、双黑或零；设定金额并点击“旋转”。\n2. 两颗球在欧式轮盘（0 至 36）上滚动。\n3. 双红 ×3.97 · 一红一黑 ×1.98 · 双黑 ×3.97 · 至少一个零 ×17.62。否则输掉下注。'
    }
  });

  /* =============================== TWIN WHEEL =============================== */
  // roue extérieure 12 cases × roue intérieure 8 cases, toutes les paires également probables ; ligne = extérieure·8 + intérieure ; gain = produit
  var TW_O = [0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 6], TW_I = [0.4, 1, 0.6, 1.5, 0.4, 1, 0.6, 2], TW_CY = 122;
  var TW_OC = { 0: '#334155', 1: '#7C3AED', 2: '#DB2777', 6: '#D97706' }, TW_IC = ['#0EA5E9', '#22C55E', '#06B6D4', '#F59E0B', '#0EA5E9', '#22C55E', '#06B6D4', '#EF4444'];
  game({
    key: 'twinwheel', l: verb('spin'), vb: '0 0 300 250', W: (function () { var a = []; for (var q = 0; q < 96; q++) a.push(1); return a; })(),
    scene: bg('#2E1065', '#0F0B2E') + '<circle cx="150" cy="' + TW_CY + '" r="108" fill="#1E1B4B" stroke="#FBBF24" stroke-width="3"/>' +
      '<g id="twO">' + TW_O.map(function (v, j) { var a0 = -Math.PI / 2 + (j - 0.5) * Math.PI / 6, a1 = a0 + Math.PI / 6, am = a0 + Math.PI / 12, x = 150 + Math.cos(am) * 84, y = TW_CY + Math.sin(am) * 84; return '<path d="' + arc(150, TW_CY, 64, 104, a0, a1) + '" fill="' + TW_OC[v] + '" stroke="#FDE68A" stroke-width="1"/>' + '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="' + (v ? 15 : 13) + '" font-weight="900" fill="#fff" font-family="Arial,sans-serif" transform="rotate(' + (am * 180 / Math.PI + 90).toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' + (v ? '×' + v : '0') + '</text>'; }).join('') + '</g>' +
      '<g id="twI">' + TW_I.map(function (v, j) { var a0 = -Math.PI / 2 + (j - 0.5) * Math.PI / 4, a1 = a0 + Math.PI / 4, am = a0 + Math.PI / 8, x = 150 + Math.cos(am) * 42, y = TW_CY + Math.sin(am) * 42; return '<path d="' + arc(150, TW_CY, 18, 60, a0, a1) + '" fill="' + TW_IC[j] + '" stroke="#fff" stroke-width="1"/>' + '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="900" fill="#fff" font-family="Arial,sans-serif" transform="rotate(' + (am * 180 / Math.PI + 90).toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">×' + String(v).replace('.', K.dec()) + '</text>'; }).join('') + '</g>' +
      '<circle cx="150" cy="' + TW_CY + '" r="18" fill="#FBBF24" stroke="#92400E" stroke-width="2"/><path d="M150 4l-11 16h22z" fill="#F43F5E" stroke="#fff" stroke-width="1.5"/>' + pillG('twR', 150, 238, 120),
    init: function (c) { c.ro = 0; c.ri = 0; },
    reset: function (c) { setP(c, 'twR', ''); },
    play: async function (c, r) {
      var i = +r.view.i, o = Math.floor(i / 8), n = i % 8, O0 = c.ro, I0 = c.ri;
      var md = function (x) { return ((x % 360) + 360) % 360; }, O1 = O0 + md(-o * 30 - O0) + 720, I1 = I0 - md(I0 + n * 45) - 1080, wO = c.id('twO'), wI = c.id('twI'), last = -1;
      await tw(c.box, 3400, function (k) { var e = ease(k), a = lerp(O0, O1, e), b = lerp(I0, I1, Math.min(1, ease(Math.min(1, k * 1.15)))); wO.setAttribute('transform', 'rotate(' + a.toFixed(1) + ' 150 ' + TW_CY + ')'); wI.setAttribute('transform', 'rotate(' + b.toFixed(1) + ' 150 ' + TW_CY + ')'); var t = Math.floor(a / 30); if (t !== last) { last = t; if (k < 0.95) c.sfx('tick'); } });
      c.ro = O1 % 360; c.ri = I1 % 360; c.sfx('stop');
      var ov = TW_O[o], iv = TW_I[n];
      setP(c, 'twR', (ov ? '×' + ov : '0') + ' × ' + xm(iv) + ' = ' + xm(Math.round(ov * iv * 100) / 100));
    },
    rules: {
      en: '1. Set your stake and tap “Spin”: the outer wheel and the inner wheel spin in opposite directions.\n2. Under the arrow you read one number on each wheel.\n3. Your win = stake × outer × inner (for example ×2 × ×1.5 = ×3; ×6 × ×2 = ×12). A 0 on the outer wheel: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Tourner » : la grande roue et la petite roue tournent en sens contraire.\n2. Sous la flèche, on lit un nombre sur chaque roue.\n3. Ton gain = mise × grande roue × petite roue (par exemple ×2 × ×1.5 = ×3 ; ×6 × ×2 = ×12). Un 0 sur la grande roue : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Girar»: la rueda exterior y la interior giran en sentidos opuestos.\n2. Bajo la flecha se lee un número en cada rueda.\n3. Tu premio = apuesta × exterior × interior (por ejemplo ×2 × ×1.5 = ×3; ×6 × ×2 = ×12). Un 0 en la rueda exterior: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Girar»: a roda externa e a interna giram em sentidos opostos.\n2. Sob a seta lê-se um número em cada roda.\n3. Seu ganho = aposta × externa × interna (por exemplo ×2 × ×1.5 = ×3; ×6 × ×2 = ×12). Um 0 na roda externa: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «أدر»: تدور العجلة الخارجية والداخلية في اتجاهين متعاكسين.\n2. تحت السهم تقرأ رقمًا على كل عجلة.\n3. ربحك = الرهان × الخارجية × الداخلية (مثلًا ×2 × ×1.5 = ×3؛ ×6 × ×2 = ×12). صفر على العجلة الخارجية: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Çevir”e dokun: dış çark ve iç çark ters yönde döner.\n2. Okun altında her çarkta bir sayı okunur.\n3. Kazancın = bahis × dış × iç (örneğin ×2 × ×1.5 = ×3; ×6 × ×2 = ×12). Dış çarkta 0: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Quay»: vòng ngoài và vòng trong quay ngược chiều nhau.\n2. Dưới mũi tên có một số trên mỗi vòng.\n3. Tiền thắng = cược × vòng ngoài × vòng trong (ví dụ ×2 × ×1.5 = ×3; ×6 × ×2 = ×12). Số 0 ở vòng ngoài: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Putar»: roda luar dan roda dalam berputar berlawanan arah.\n2. Di bawah panah terbaca satu angka di tiap roda.\n3. Kemenanganmu = taruhan × luar × dalam (misalnya ×2 × ×1.5 = ×3; ×6 × ×2 = ×12). Angka 0 di roda luar: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Крутить»: внешнее и внутреннее колёса вращаются в разные стороны.\n2. Под стрелкой — по одному числу на каждом колесе.\n3. Выигрыш = ставка × внешнее × внутреннее (например ×2 × ×1.5 = ×3; ×6 × ×2 = ×12). 0 на внешнем колесе — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: Außenrad und Innenrad drehen sich gegeneinander.\n2. Unter dem Pfeil steht auf jedem Rad eine Zahl.\n3. Dein Gewinn = Einsatz × außen × innen (zum Beispiel ×2 × ×1.5 = ×3; ×6 × ×2 = ×12). Eine 0 auf dem Außenrad: Einsatz verloren.',
      hi: '1. राशि चुनें और «घुमाएं» छुएं: बाहरी और भीतरी पहिया उल्टी दिशाओं में घूमते हैं।\n2. तीर के नीचे हर पहिये पर एक संख्या दिखती है।\n3. आपकी जीत = दांव × बाहरी × भीतरी (जैसे ×2 × ×1.5 = ×3; ×6 × ×2 = ×12)। बाहरी पहिये पर 0: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“旋转”：外轮和内轮反向旋转。\n2. 箭头下方每个轮盘各显示一个数字。\n3. 奖金 = 下注 × 外轮 × 内轮（例如 ×2 × ×1.5 = ×3；×6 × ×2 = ×12）。外轮为 0：输掉下注。'
    }
  });

  /* =============================== TWO-UP (choix) =============================== */
  // deux pièces lancées d'une palette : 0 deux faces ×3.76 · 1 une de chaque ×1.88 · 2 deux piles ×3.76
  var TU = {
    en: { heads: 'Heads', odds: 'Odds', tails: 'Tails' }, fr: { heads: 'Faces', odds: 'Mixte', tails: 'Piles' }, es: { heads: 'Caras', odds: 'Mixto', tails: 'Cruces' }, pt: { heads: 'Caras', odds: 'Misto', tails: 'Coroas' },
    ar: { heads: 'وجهان', odds: 'مختلط', tails: 'ظهران' }, tr: { heads: 'Yazı', odds: 'Karışık', tails: 'Tura' }, vi: { heads: 'Hai ngửa', odds: 'Lẫn', tails: 'Hai sấp' }, id: { heads: 'Kepala', odds: 'Campur', tails: 'Ekor' },
    ru: { heads: 'Орлы', odds: 'Разные', tails: 'Решки' }, de: { heads: 'Köpfe', odds: 'Gemischt', tails: 'Zahlen' }, hi: { heads: 'चित', odds: 'मिश्रित', tails: 'पट' }, zh: { heads: '双正', odds: '一正一反', tails: '双反' }
  };
  function tuCoin(h, sx) { sx = sx == null ? 1 : sx; if (Math.abs(sx) < 0.18) return '<rect x="-3" y="-20" width="6" height="40" rx="3" fill="' + (h ? '#B45309' : '#475569') + '"/>'; return '<g transform="scale(' + Math.abs(sx).toFixed(3) + ' 1)"><circle r="20" cx="' + (sx > 0 ? -1.5 : 1.5) + '" fill="' + (h ? '#92400E' : '#334155') + '"/><circle r="20" fill="' + (h ? 'url(#tuG)' : 'url(#tuS)') + '" stroke="' + (h ? '#92400E' : '#475569') + '" stroke-width="1.5"/><circle r="15" fill="none" stroke="' + (h ? '#FEF3C7' : '#E2E8F0') + '" stroke-opacity=".7"/>' +
    (h ? '<path d="M-9 4h18l2-10-6 4-5-7-5 7-6-4z" fill="#FEF3C7" stroke="#92400E" stroke-width=".8"/><path d="M-12 9h24" stroke="#FEF3C7" stroke-width="1.4" opacity=".7"/>' : '<path d="M0-10l2.9 6 6.6 1-4.8 4.6 1.2 6.5L0 5l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-1z" fill="#F8FAFC" stroke="#475569" stroke-width=".8"/>') + '</g>'; }
  function tuIco(a, b) { return '<svg viewBox="-24 -12 48 24" aria-hidden="true"><defs><radialGradient id="tuGi" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#D97706"/></radialGradient><radialGradient id="tuSi" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F8FAFC"/><stop offset="1" stop-color="#64748B"/></radialGradient></defs>' +
    [a, b].map(function (h, j) { return '<g transform="translate(' + (j ? 11 : -11) + ' 0) scale(.5)">' + tuCoin(h).replace(/tuG\)/g, 'tuGi)').replace(/tuS\)/g, 'tuSi)') + '</g>'; }).join('') + '</svg>'; }
  game({
    key: 'twoup', l: verb('toss', TU), vb: '0 0 300 250', n: 3, W: [1, 2, 1],
    scene: '<defs><radialGradient id="tuG" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".55" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></radialGradient><radialGradient id="tuS" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F8FAFC"/><stop offset=".55" stop-color="#94A3B8"/><stop offset="1" stop-color="#334155"/></radialGradient>' +
      '<linearGradient id="tuSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B0764"/><stop offset=".55" stop-color="#C2410C"/><stop offset="1" stop-color="#FDBA74"/></linearGradient><radialGradient id="tuSand" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#FCD34D"/><stop offset="1" stop-color="#B45309"/></radialGradient>' +
      '<radialGradient id="tuSun" r=".5"><stop offset="0" stop-color="#FFF7ED"/><stop offset=".4" stop-color="#FDBA74"/><stop offset="1" stop-color="#FDBA74" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="700" fill="url(#tuSky)"/><rect x="-400" y="150" width="1100" height="600" fill="#78350F"/><circle cx="230" cy="112" r="46" fill="url(#tuSun)"/>' +
      '<path d="M-400 140Q-40 104 40 122T150 116T250 126T700 120V160H-400z" fill="#7C2D12"/><path d="M-400 148Q60 132 150 140T700 142V170H-400z" fill="#451A03"/>' +
      // la foule en cercle
      (function () { var s = '', q; for (q = 0; q < 26; q++) { var a = Math.PI * (1.05 + q / 25 * 0.9), x = 150 + Math.cos(a) * 150, y = 176 + Math.sin(a) * 38; s += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="' + ['#1C1917', '#292524', '#3F1D0B'][q % 3] + '"><circle cy="-15" r="5.5"/><path d="M-8 4Q-8-9 0-9T8 4z"/>' + (q % 4 ? '' : '<path d="M-8-17h16l-3-5h-10z"/>') + '</g>'; } return s; })() +
      '<ellipse cx="150" cy="206" rx="128" ry="34" fill="url(#tuSand)" stroke="#FDE68A" stroke-opacity=".45" stroke-width="2"/><ellipse cx="150" cy="206" rx="70" ry="18" fill="none" stroke="#FEF3C7" stroke-opacity=".35" stroke-dasharray="4 5"/>' +
      '<g id="tuDust"></g><ellipse id="tuSh0" cx="126" cy="214" rx="18" ry="4" fill="#000" opacity=".3"/><ellipse id="tuSh1" cx="174" cy="214" rx="18" ry="4" fill="#000" opacity=".3"/>' +
      '<g id="tuKip" transform="translate(150 222)"><rect x="-50" y="-5" width="100" height="10" rx="5" fill="#D6A36A" stroke="#78350F"/><path d="M-40-2h80" stroke="#FEF3C7" stroke-opacity=".5"/><rect x="44" y="-3.5" width="28" height="7" rx="3.5" fill="#92400E"/></g>' +
      '<g id="tuC0" transform="translate(126 208)">' + tuCoin(true) + '</g><g id="tuC1" transform="translate(174 208)">' + tuCoin(false) + '</g>',
    opts: function (l) { return '<div class="cg-opts tu-opts">' + [[true, true, l.heads, 0.25], [true, false, l.odds, 0.5], [false, false, l.tails, 0.25]].map(function (q, j) { return '<button type="button" data-o="' + j + '">' + tuIco(q[0], q[1]) + '<b class="fit">' + K.esc(q[2]) + '</b><small class="fit">' + xm(pm(q[3])) + '</small></button>'; }).join('') + '</div>'; },
    params: function (c) { return { pick: c.sel }; },
    play: async function (c, r) {
      var w = +r.view.w, faces = w === 0 ? [true, true] : w === 2 ? [false, false] : shuffle([true, false]), cs = [c.id('tuC0'), c.id('tuC1')], sh = [c.id('tuSh0'), c.id('tuSh1')], kip = c.id('tuKip');
      var land = [[104 + rnd(24), 200 + rnd(10)], [172 + rnd(24), 204 + rnd(10)]], from = [[126, 208], [174, 208]];
      await tw(c.box, 260, function (k) { tr(kip, 150, 222 - Math.sin(k * Math.PI) * 20, 1, -Math.sin(k * Math.PI) * 12); });
      c.sfx('flip', { d: 1500 });
      await tw(c.box, 1750, function (k) {
        cs.forEach(function (g, j) { var spin = k * (14 + j * 3) * Math.PI, sx = Math.cos(spin), up = Math.sin(k * Math.PI) * 168, x = lerp(from[j][0], land[j][0], k), y = lerp(from[j][1], land[j][1], k);
          g.innerHTML = tuCoin(k > 0.86 ? faces[j] : sx > 0 ? !(j % 2) : !!(j % 2), k > 0.86 ? 1 : sx);
          tr(g, x, y - up, 1 + Math.sin(k * Math.PI) * 0.25);
          sh[j].setAttribute('cx', x.toFixed(1)); sh[j].setAttribute('cy', (y + 6).toFixed(1)); sh[j].setAttribute('rx', (18 - Math.sin(k * Math.PI) * 12).toFixed(1)); sh[j].setAttribute('opacity', (0.3 - Math.sin(k * Math.PI) * 0.2).toFixed(2)); });
      });
      cs.forEach(function (g, j) { g.innerHTML = tuCoin(faces[j]); tr(g, land[j][0], land[j][1]); });
      // petit nuage de poussière à l'atterrissage
      var D = c.id('tuDust'); D.innerHTML = land.map(function (p) { return [0, 1, 2, 3, 4].map(function (q) { return '<circle cx="' + (p[0] + (q - 2) * 9) + '" cy="' + (p[1] + 8) + '" r="5" fill="#FDE68A" opacity=".5"/>'; }).join(''); }).join('');
      c.sfx('stop');
      await tw(c.box, 450, function (k) { D.setAttribute('opacity', String(1 - k)); D.setAttribute('transform', 'translate(0 ' + (-k * 8).toFixed(1) + ')'); });
      D.innerHTML = ''; D.removeAttribute('opacity');
      cs.forEach(function (g, j) { g.classList.add('tu-won'); });
    },
    reset: function (c) { tr(c.id('tuC0'), 126, 208); tr(c.id('tuC1'), 174, 208); [0, 1].forEach(function (j) { c.id('tuC' + j).classList.remove('tu-won'); var s = c.id('tuSh' + j); s.setAttribute('cx', j ? 174 : 126); s.setAttribute('cy', 214); s.setAttribute('rx', 18); s.setAttribute('opacity', '.3'); }); },
    rules: {
      en: '1. Pick Heads (two crowns), Odds (one of each) or Tails (two stars); set your stake and tap “Toss”.\n2. Two coins are thrown high from the wooden paddle and spin.\n3. Heads ×3.76 · Odds ×1.88 · Tails ×3.76. Another result: the stake is lost.',
      fr: '1. Choisis Faces (deux couronnes), Mixte (une de chaque) ou Piles (deux étoiles) ; ta mise, puis touche « Lancer ».\n2. Deux pièces sont lancées haut depuis la palette en bois et tournoient.\n3. Faces ×3.76 · Mixte ×1.88 · Piles ×3.76. Autre résultat : la mise est perdue.',
      es: '1. Elige Caras (dos coronas), Mixto (una de cada) o Cruces (dos estrellas); tu apuesta y toca «Lanzar».\n2. Dos monedas salen altas de la paleta de madera y giran.\n3. Caras ×3.76 · Mixto ×1.88 · Cruces ×3.76. Otro resultado: pierdes la apuesta.',
      pt: '1. Escolha Caras (duas coroas), Misto (uma de cada) ou Coroas (duas estrelas); o valor e toque em «Lançar».\n2. Duas moedas são lançadas alto da palheta de madeira e giram.\n3. Caras ×3.76 · Misto ×1.88 · Coroas ×3.76. Outro resultado: a aposta é perdida.',
      ar: '1. اختر وجهين (تاجان) أو مختلط (واحد من كل) أو ظهرين (نجمتان)؛ والرهان ثم المس «اقذف».\n2. تُقذف قطعتان نقديتان عاليًا من المجداف الخشبي وتدوران.\n3. وجهان ×3.76 · مختلط ×1.88 · ظهران ×3.76. نتيجة أخرى: تخسر الرهان.',
      tr: '1. Yazı (iki taç), Karışık (birer) veya Tura (iki yıldız) seç; bahsini belirle ve “Fırlat”a dokun.\n2. İki para tahta küreğe konup havaya atılır ve döner.\n3. Yazı ×3.76 · Karışık ×1.88 · Tura ×3.76. Başka sonuç: bahis kaybedilir.',
      vi: '1. Chọn Hai ngửa (hai vương miện), Lẫn (mỗi mặt một) hoặc Hai sấp (hai ngôi sao); mức cược rồi chạm «Tung».\n2. Hai đồng xu được tung cao từ thanh gỗ và xoay tròn.\n3. Hai ngửa ×3.76 · Lẫn ×1.88 · Hai sấp ×3.76. Kết quả khác: mất tiền cược.',
      id: '1. Pilih Kepala (dua mahkota), Campur (satu-satu) atau Ekor (dua bintang); atur taruhan lalu sentuh «Lempar».\n2. Dua koin dilempar tinggi dari papan kayu dan berputar.\n3. Kepala ×3.76 · Campur ×1.88 · Ekor ×3.76. Hasil lain: taruhan hilang.',
      ru: '1. Выберите «Орлы» (две короны), «Разные» (по одной) или «Решки» (две звезды); ставку и нажмите «Подбросить».\n2. Две монеты взлетают с деревянной лопатки и крутятся.\n3. Орлы ×3.76 · Разные ×1.88 · Решки ×3.76. Другой исход — ставка проиграна.',
      de: '1. Wähle Köpfe (zwei Kronen), Gemischt (je eine) oder Zahlen (zwei Sterne); deinen Einsatz und tippe auf „Werfen“.\n2. Zwei Münzen fliegen vom Holzbrett hoch und drehen sich.\n3. Köpfe ×3.76 · Gemischt ×1.88 · Zahlen ×3.76. Anderes Ergebnis: Einsatz verloren.',
      hi: '1. चित (दो ताज), मिश्रित (एक-एक) या पट (दो तारे) चुनें; राशि चुनें और «उछालें» छुएं।\n2. लकड़ी की पट्टी से दो सिक्के ऊंचे उछलते और घूमते हैं।\n3. चित ×3.76 · मिश्रित ×1.88 · पट ×3.76। दूसरा नतीजा: दांव हार जाते हैं।',
      zh: '1. 选择双正（两个皇冠）、一正一反或双反（两颗星）；设定金额并点击“抛掷”。\n2. 两枚硬币从木板上高高抛起并旋转。\n3. 双正 ×3.76 · 一正一反 ×1.88 · 双反 ×3.76。其他结果：输掉下注。'
    }
  });

  /* =============================== FAN-TAN (choix) =============================== */
  // un tas de haricots sous un bol ; le croupier les retire 4 par 4 ; reste 1, 2, 3 ou 4 : ×3.76 chacun
  var FT_XY = [[150, 30], [270, 125], [150, 220], [30, 125]];
  function ftPlaque(j) { var p = FT_XY[j]; return '<g class="ft-n" id="ftN' + j + '"><rect x="' + (p[0] - 17) + '" y="' + (p[1] - 15) + '" width="34" height="30" rx="6" fill="url(#ftBr)" stroke="#78350F" stroke-width="1.5"/><rect x="' + (p[0] - 13) + '" y="' + (p[1] - 11) + '" width="26" height="22" rx="4" fill="#7F1D1D"/>' + txt(p[0], p[1] + 6, j + 1, 16, '#FDE68A') + '</g>'; }
  game({
    key: 'fantan', l: verb('play'), vb: '0 0 300 250', n: 4,
    scene: '<defs><linearGradient id="ftBr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".5" stop-color="#D97706"/><stop offset="1" stop-color="#78350F"/></linearGradient>' +
      '<radialGradient id="ftBean" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E7E5E4"/><stop offset="1" stop-color="#A8A29E"/></radialGradient>' +
      '<radialGradient id="ftBowlG" cx="35%" cy="25%" r="85%"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".45" stop-color="#D97706"/><stop offset="1" stop-color="#451A03"/></radialGradient>' +
      '<radialGradient id="ftTab" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#991B1B"/><stop offset="1" stop-color="#3F0A0A"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#1C0A05"/><rect x="8" y="8" width="284" height="234" rx="22" fill="url(#ftTab)" stroke="url(#ftBr)" stroke-width="5"/>' +
      '<rect x="22" y="22" width="256" height="206" rx="14" fill="none" stroke="#FBBF24" stroke-opacity=".35" stroke-dasharray="2 6"/>' +
      [[22, 22], [278, 22], [22, 228], [278, 228]].map(function (p) { return '<path d="M' + p[0] + ' ' + (p[1] - 8) + 'l8 8-8 8-8-8z" fill="#FBBF24" opacity=".6"/>'; }).join('') +
      '<rect x="56" y="52" width="188" height="146" rx="12" fill="#14532D" stroke="#FDE68A" stroke-opacity=".35"/>' + [0, 1, 2, 3].map(ftPlaque).join('') +
      '<g id="ftTray" transform="translate(70 188)"><rect x="-14" y="-8" width="40" height="14" rx="5" fill="#451A03" stroke="#D97706"/></g><g id="ftOut"></g>' +
      '<g id="ftBeans"></g><g id="ftBowl" transform="translate(150 125)"><ellipse cy="34" rx="62" ry="10" fill="#000" opacity=".35"/><path d="M-60 26Q-60-42 0-42T60 26z" fill="url(#ftBowlG)" stroke="#78350F" stroke-width="2"/>' +
        '<path d="M-48 0Q0-18 48 0" stroke="#FEF3C7" stroke-width="2" fill="none" opacity=".55"/><path d="M-52 14Q0-4 52 14" stroke="#7F1D1D" stroke-width="4" fill="none"/><circle cy="-44" r="8" fill="url(#ftBr)" stroke="#78350F"/></g>' +
      '<g id="ftStick" opacity="0"><path d="M0 0L96-64" stroke="#D6A36A" stroke-width="5" stroke-linecap="round"/><path d="M24-16l3 4M48-32l3 4M72-48l3 4" stroke="#92400E" stroke-width="1.5"/><path d="M0 0l-6 4" stroke="#78350F" stroke-width="5" stroke-linecap="round"/></g>' + pillG('ftLeft', 236, 188, 46),
    opts: function () { return '<div class="cg-opts ft-opts">' + [0, 1, 2, 3].map(function (j) { return optBtn(j, '<b class="fit">' + (j + 1) + '</b>', pm(0.25)); }).join('') + '</div>'; },
    onPick: function (c, j) { c.qa('.ft-n').forEach(function (g, q) { g.classList.toggle('on', q === j); }); },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.id('ftBeans').innerHTML = ''; c.id('ftOut').innerHTML = ''; tr(c.id('ftBowl'), 150, 125); c.id('ftBowl').style.opacity = ''; setP(c, 'ftLeft', ''); c.qa('.ft-n').forEach(function (g) { g.classList.remove('win'); }); },
    play: async function (c, r) {
      var w = +r.view.w, n = 4 * (5 + rnd(3)) + w + 1, B = c.id('ftBeans'), beans = [];
      for (var j = 0; j < n; j++) { var a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 44; beans.push([150 + Math.cos(a) * d * 1.3, 122 + Math.sin(a) * d * 0.72, rnd(180)]); }
      B.innerHTML = beans.map(function (p, q) { return '<g id="ftB' + q + '" transform="translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') rotate(' + p[2] + ')"><ellipse rx="6" ry="4.3" fill="url(#ftBean)" stroke="#78716C" stroke-width=".5"/><path d="M-3-1q3-2 6 0" stroke="#A8A29E" stroke-width=".6" fill="none"/></g>'; }).join('');
      var bowl = c.id('ftBowl'); c.sfx('open');
      await tw(c.box, 650, function (k) { var e = ease(k); tr(bowl, 150 + e * 100, 125 - e * 96, 1 - e * 0.3, e * 20); bowl.style.opacity = String(1 - e); });
      var order = beans.map(function (p, q) { return q; }).sort(function (a, b) { return beans[a][0] - beans[b][0]; }), left = n, stick = c.id('ftStick'), out = 0, O = c.id('ftOut');
      stick.setAttribute('opacity', '1'); setP(c, 'ftLeft', String(left));
      while (left > 4) {
        var grp = order.splice(0, 4), cx = grp.reduce(function (s, q) { return s + beans[q][0]; }, 0) / 4, cy = grp.reduce(function (s, q) { return s + beans[q][1]; }, 0) / 4;
        c.sfx('tick');
        await tw(c.box, lite() ? 120 : 170, function (k) { tr(stick, lerp(cx + 30, cx, ease(k)), lerp(cy - 10, cy, ease(k))); });
        var tx0 = 62 + (out % 6) * 3, ty0 = 186 - Math.floor(out / 6) * 3;
        await tw(c.box, lite() ? 160 : 240, function (k) { var e = ease(k); tr(stick, lerp(cx, 80, e), lerp(cy, 184, e)); grp.forEach(function (q, z) { var el = c.id('ftB' + q); tr(el, lerp(beans[q][0], tx0 + z * 4, e), lerp(beans[q][1], ty0, e), 1 - e * 0.4, beans[q][2]); }); });
        grp.forEach(function (q) { var el = c.id('ftB' + q); if (el) { O.appendChild(el); } });
        out++; left -= 4; setP(c, 'ftLeft', String(left));
      }
      stick.setAttribute('opacity', '0'); c.sfx('stop');
      // le reste se range en ligne et brille
      var rest = order.slice();
      await tw(c.box, 420, function (k) { var e = ease(k); rest.forEach(function (q, z) { tr(c.id('ftB' + q), lerp(beans[q][0], 150 + (z - (rest.length - 1) / 2) * 18, e), lerp(beans[q][1], 125, e), 1 + e * 0.5, beans[q][2] * (1 - e)); }); });
      rest.forEach(function (q) { var el = c.id('ftB' + q); if (el) el.setAttribute('class', 'ft-glow'); });
      c.qa('.ft-n').forEach(function (g, q) { g.classList.toggle('win', q === w); });
    },
    rules: {
      en: '1. Pick 1, 2, 3 or 4, set your stake and tap “Play”.\n2. The bowl is lifted from a pile of beans and the croupier takes them away 4 at a time.\n3. When 1, 2, 3 or 4 beans are left, that is the number: yours ×3.76. Another number: the stake is lost.',
      fr: '1. Choisis 1, 2, 3 ou 4, ta mise, puis touche « Jouer ».\n2. Le bol est soulevé d’un tas de haricots et le croupier les retire 4 par 4.\n3. Quand il en reste 1, 2, 3 ou 4, c’est le numéro gagnant : le tien ×3.76. Un autre : la mise est perdue.',
      es: '1. Elige 1, 2, 3 o 4, tu apuesta y toca «Jugar».\n2. Se levanta el cuenco de un montón de judías y el crupier las retira de 4 en 4.\n3. Cuando quedan 1, 2, 3 o 4 judías, ese es el número: el tuyo ×3.76. Otro número: pierdes la apuesta.',
      pt: '1. Escolha 1, 2, 3 ou 4, o valor e toque em «Jogar».\n2. A tigela é erguida de um monte de feijões e o crupiê os retira de 4 em 4.\n3. Quando restam 1, 2, 3 ou 4 feijões, esse é o número: o seu ×3.76. Outro número: a aposta é perdida.',
      ar: '1. اختر 1 أو 2 أو 3 أو 4 والرهان ثم المس «العب».\n2. يُرفع الوعاء عن كومة من الحبوب ويزيلها الموزّع 4 في كل مرة.\n3. عندما يبقى 1 أو 2 أو 3 أو 4 حبات يكون ذلك هو الرقم: رقمك ×3.76. رقم آخر: تخسر الرهان.',
      tr: '1. 1, 2, 3 veya 4 seç, bahsini belirle ve “Oyna”ya dokun.\n2. Fasulye yığınının üstündeki kase kaldırılır, krupiye fasulyeleri 4’er 4’er alır.\n3. 1, 2, 3 veya 4 fasulye kaldığında sayı budur: seninki ×3.76. Başka sayı: bahis kaybedilir.',
      vi: '1. Chọn 1, 2, 3 hoặc 4, mức cược rồi chạm «Chơi».\n2. Bát được nhấc khỏi đống hạt đậu và nhà cái gạt bớt mỗi lần 4 hạt.\n3. Khi còn 1, 2, 3 hoặc 4 hạt, đó là số thắng: số của bạn ×3.76. Số khác: mất tiền cược.',
      id: '1. Pilih 1, 2, 3 atau 4, atur taruhan lalu sentuh «Main».\n2. Mangkuk diangkat dari tumpukan kacang dan bandar mengambilnya 4 demi 4.\n3. Saat tersisa 1, 2, 3 atau 4 kacang, itulah angkanya: punyamu ×3.76. Angka lain: taruhan hilang.',
      ru: '1. Выберите 1, 2, 3 или 4, ставку и нажмите «Играть».\n2. Чашу поднимают над кучкой бобов, крупье убирает их по 4.\n3. Когда остаётся 1, 2, 3 или 4 боба — это выигрышное число: ваше ×3.76. Другое — ставка проиграна.',
      de: '1. Wähle 1, 2, 3 oder 4, deinen Einsatz und tippe auf „Spielen“.\n2. Die Schale wird von einem Bohnenhaufen gehoben, der Croupier nimmt immer 4 Bohnen weg.\n3. Bleiben 1, 2, 3 oder 4 übrig, ist das die Zahl: deine ×3.76. Eine andere: Einsatz verloren.',
      hi: '1. 1, 2, 3 या 4 चुनें, राशि चुनें और «खेलें» छुएं।\n2. दानों के ढेर से कटोरा उठाया जाता है और क्रुपियर 4-4 दाने हटाता है।\n3. जब 1, 2, 3 या 4 दाने बचें, वही संख्या है: आपकी हो तो ×3.76। दूसरी: दांव हार जाते हैं।',
      zh: '1. 选择 1、2、3 或 4，设定金额并点击“开始”。\n2. 揭开盖在豆堆上的碗，荷官每次拨走 4 颗。\n3. 最后剩下 1、2、3 或 4 颗即为开奖数字：押中 ×3.76。其他数字：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
