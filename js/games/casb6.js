/* casb6 — Dreidel, Oracle Ball, RPS Duel (owner request, round 6) — instant games; the scene always shows exactly the line (or option) the server drew (casino_ext/casb.php). */
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
  function chipT(t, col, fs) { return '<text y="4" text-anchor="middle" font-size="' + (fs || 11) + '" font-weight="900" fill="' + (col || '#FDE68A') + '" font-family="Arial,sans-serif">' + t + '</text>'; }

  /* =============================== DREIDEL =============================== */
  // 4 faces également probables : 0 Shin ×0 · 1 Hei ×0.7 · 2 Nun ×1 · 3 Gimel ×2.06
  var DR_L = ['ש', 'ה', 'נ', 'ג'], DR_V = [0, 0.7, 1, 2.06], DR_C = ['#94A3B8', '#38BDF8', '#A78BFA', '#FBBF24'];
  // toupie en pseudo-3D : face avant (largeur cos) + face de droite (largeur sin) selon l'angle ph ∈ [0, π/2)
  function dreidel(face, ph) {
    var c1 = Math.cos(ph), s1 = Math.sin(ph), wF = 66 * c1, wS = 66 * s1, x0 = -(wF + wS) / 2, xm = x0 + wF, x1 = xm + wS, tip = x0 + (wF + wS) / 2, out = '';
    var fc = function (xa, xb, f, light) {
      if (xb - xa < 1) return '';
      var w = xb - xa, cx = (xa + xb) / 2, sc = Math.max(0.05, w / 66), L = DR_L[f];
      return '<path d="M' + xa.toFixed(1) + ' -56H' + xb.toFixed(1) + 'V6L' + tip.toFixed(1) + ' 50L' + xa.toFixed(1) + ' 6z" fill="url(#' + (light ? 'dlF1' : 'dlF2') + ')" stroke="#DBEAFE" stroke-opacity=".6" stroke-width="1.2"/>' +
        '<path d="M' + xa.toFixed(1) + ' 6H' + xb.toFixed(1) + '" stroke="#1E3A8A" stroke-opacity=".5"/>' +
        '<g transform="translate(' + cx.toFixed(1) + ' -16) scale(' + sc.toFixed(3) + ' 1)"><text y="12" text-anchor="middle" font-size="36" font-weight="900" fill="' + DR_C[f] + '" stroke="#0B1437" stroke-width="1" font-family="Arial,sans-serif" opacity="' + (light ? 1 : 0.75) + '">' + L + '</text></g>';
    };
    out += fc(x0, xm, face, true) + fc(xm, x1, (face + 1) % 4, false);
    out = '<rect x="-7" y="-80" width="14" height="26" rx="5" fill="url(#dlG)" stroke="#92400E" stroke-width=".8"/><ellipse cy="-56" rx="' + ((wF + wS) / 2).toFixed(1) + '" ry="5" fill="#93C5FD"/>' + out +
      '<path d="M-4-78q4-2 8 0" stroke="#FFF" stroke-opacity=".6" fill="none"/>';
    return out;
  }
  function gelt(x, y, r) { return '<g transform="translate(' + x + ' ' + y + ')"><ellipse rx="' + r + '" ry="' + (r * 0.45) + '" fill="#B45309"/><ellipse cy="-1.5" rx="' + r + '" ry="' + (r * 0.45) + '" fill="url(#dlG)"/><path d="M' + (-r * 0.4) + ' -1.5h' + (r * 0.8) + '" stroke="#92400E" stroke-width="1"/></g>'; }
  game({
    key: 'dreidel', l: verb('spin'), vb: '0 0 300 250', W: [1, 1, 1, 1],
    chips: [1, 2, 3].map(function (j) { return [chipT(DR_L[j], DR_C[j], 13), DR_V[j]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs><linearGradient id="dlF1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#93C5FD"/><stop offset=".5" stop-color="#3B82F6"/><stop offset="1" stop-color="#1E40AF"/></linearGradient>' +
      '<linearGradient id="dlF2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#172554"/></linearGradient><linearGradient id="dlG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#D97706"/></linearGradient>' +
      '<radialGradient id="dlT" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#4338CA"/><stop offset="1" stop-color="#1E1B4B"/></radialGradient><radialGradient id="dlL" r=".5"><stop offset="0" stop-color="#FDE68A" stop-opacity=".5"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient></defs>' +
      felt('dlF', '#312E81', '#0B0820') + [[40, 70], [262, 64], [30, 140], [270, 150]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="22" fill="url(#dlL)"/><rect x="' + (p[0] - 2) + '" y="' + (p[1] - 6) + '" width="4" height="14" rx="1" fill="#E0E7FF"/><path d="M' + p[0] + ' ' + (p[1] - 6) + 'q-3-5 0-9q3 4 0 9" fill="#FBBF24"/>'; }).join('') +
      '<ellipse cx="150" cy="204" rx="132" ry="30" fill="url(#dlT)" stroke="#FDE68A" stroke-opacity=".35" stroke-width="2"/>' + gelt(58, 214, 9) + gelt(76, 222, 8) + gelt(232, 218, 9) + gelt(248, 208, 7) + gelt(220, 228, 7) +
      [0, 1, 2, 3].map(function (j) { var x = 48 + j * 68; return '<g class="dl-s" id="dlS' + j + '"><rect x="' + (x - 26) + '" y="10" width="52" height="34" rx="10" fill="#1E1B4B" stroke="' + DR_C[j] + '" stroke-opacity=".7"/>' + txt(x - 9, 34, DR_L[j], 17, DR_C[j]) + txt(x + 11, 32, j ? xm(DR_V[j]) : '×0', 9, '#E0E7FF') + '</g>'; }).join('') +
      '<ellipse id="dlBlur" cx="150" cy="200" rx="40" ry="8" fill="none" stroke="#93C5FD" stroke-width="2" opacity="0"/><ellipse id="dlSh" cx="150" cy="204" rx="26" ry="6" fill="#000" opacity=".4"/><g id="dlD" transform="translate(150 150)">' + dreidel(3, 0.35) + '</g>',
    reset: function (c) { c.qa('.dl-s').forEach(function (g) { g.classList.remove('on'); }); c.id('dlD').classList.remove('dl-win'); },
    play: async function (c, r) {
      var i = +r.view.i, d = c.id('dlD'), sh = c.id('dlSh'), bl = c.id('dlBlur'), spins = 20 + rnd(5), lastF = -1;
      // fin : la face gagnante bien de face (angle = multiple de π/2 + 0,35 rad pour garder le relief)
      var endA = (spins * 4 + ((i - 3 + 4) % 4)) * Math.PI / 2;
      c.sfx('launch');
      await tw(c.box, 2800, function (k) {
        var e = 1 - Math.pow(1 - k, 2.2), a = e * endA, q = Math.floor(a / (Math.PI / 2)), face = ((3 + q) % 4 + 4) % 4, ph = a - q * Math.PI / 2;
        if (face !== lastF) { lastF = face; if (k < 0.92) c.sfx('tick'); }
        var x = 150 + Math.sin(k * 8) * 34 * (1 - e), wob = (1 - e) * 3 + (k > 0.7 ? Math.sin(k * 36) * (k - 0.7) * 30 : 0);
        d.innerHTML = dreidel(face, k > 0.985 ? 0.35 : ph);
        d.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + (150 - (1 - e) * 8).toFixed(1) + ') rotate(' + wob.toFixed(1) + ')');
        sh.setAttribute('cx', x.toFixed(1)); bl.setAttribute('cx', x.toFixed(1)); bl.setAttribute('opacity', ((1 - k) * 0.8).toFixed(2));
      });
      d.innerHTML = dreidel(i, 0.35);
      // un dernier petit balancement, puis il reste droit : la lettre de face est le résultat
      await tw(c.box, 500, function (k) { d.setAttribute('transform', 'translate(150 150) rotate(' + (Math.sin(k * Math.PI * 3) * 6 * (1 - k)).toFixed(1) + ')'); });
      c.sfx('stop'); c.id('dlS' + i).classList.add('on'); d.classList.add('dl-win');
    },
    rules: {
      en: '1. Set your stake and tap “Spin”: the dreidel spins, wobbles and stops.\n2. The letter facing you is the result; each of the 4 sides is equally likely.\n3. Gimel (ג) ×2.06 · Nun (נ) ×1 · Hei (ה) ×0.7 · Shin (ש): the stake is lost.',
      fr: '1. Choisis ta mise et touche « Tourner » : la toupie tourne, vacille et s’arrête.\n2. La lettre tournée vers toi donne le résultat ; les 4 faces ont la même chance.\n3. Guimel (ג) ×2.06 · Noun (נ) ×1 · Hé (ה) ×0.7 · Shin (ש) : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Girar»: la perinola gira, se tambalea y se detiene.\n2. La letra que queda de frente es el resultado; las 4 caras tienen la misma probabilidad.\n3. Guímel (ג) ×2.06 · Nun (נ) ×1 · He (ה) ×0.7 · Shin (ש): pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Girar»: o pião gira, balança e para.\n2. A letra virada para você é o resultado; as 4 faces têm a mesma chance.\n3. Guímel (ג) ×2.06 · Nun (נ) ×1 · Hê (ה) ×0.7 · Shin (ש): a aposta é perdida.',
      ar: '1. اختر الرهان والمس «أدر»: تدور الدوّامة وتتمايل ثم تتوقف.\n2. الحرف المواجه لك هو النتيجة؛ للأوجه الأربعة الفرصة نفسها.\n3. جيمل (ג) ×2.06 · نون (נ) ×1 · هي (ה) ×0.7 · شين (ש): تخسر الرهان.',
      tr: '1. Bahsini seç ve “Çevir”e dokun: topaç döner, sallanır ve durur.\n2. Sana dönük harf sonuçtur; 4 yüzün şansı eşittir.\n3. Gimel (ג) ×2.06 · Nun (נ) ×1 · He (ה) ×0.7 · Şin (ש): bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Quay»: con quay xoay, chao đảo rồi dừng lại.\n2. Chữ cái quay về phía bạn là kết quả; 4 mặt có cơ hội như nhau.\n3. Gimel (ג) ×2.06 · Nun (נ) ×1 · Hei (ה) ×0.7 · Shin (ש): mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Putar»: gasing berputar, oleng, lalu berhenti.\n2. Huruf yang menghadap kamu adalah hasilnya; keempat sisi sama peluangnya.\n3. Gimel (ג) ×2.06 · Nun (נ) ×1 · Hei (ה) ×0.7 · Shin (ש): taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Крутить»: волчок крутится, качается и останавливается.\n2. Буква, повёрнутая к вам, — результат; у всех 4 граней равные шансы.\n3. Гимел (ג) ×2.06 · Нун (נ) ×1 · Хэй (ה) ×0.7 · Шин (ש) — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: der Dreidel dreht sich, wackelt und bleibt stehen.\n2. Der Buchstabe, der zu dir zeigt, ist das Ergebnis; alle 4 Seiten sind gleich wahrscheinlich.\n3. Gimel (ג) ×2.06 · Nun (נ) ×1 · He (ה) ×0.7 · Schin (ש): Einsatz verloren.',
      hi: '1. राशि चुनें और «घुमाएं» छुएं: लट्टू घूमता है, डगमगाता है और रुक जाता है।\n2. आपकी ओर वाला अक्षर नतीजा है; चारों तरफ़ का मौका बराबर है।\n3. गिमेल (ג) ×2.06 · नून (נ) ×1 · हे (ה) ×0.7 · शिन (ש): दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“旋转”：陀螺旋转、摇晃后停下。\n2. 正对你的字母就是结果；4 个面的机会相同。\n3. Gimel（ג）×2.06 · Nun（נ）×1 · Hei（ה）×0.7 · Shin（ש）：输掉下注。'
    }
  });

  /* =============================== ORACLE BALL (choix) =============================== */
  // dé à 20 faces dans la boule : 10 « oui », 5 « peut-être », 5 « non » → Oui ×1.88 · Peut-être ×3.76 · Non ×3.76
  var OR = {
    en: { yes: 'Yes', maybe: 'Maybe', no: 'No' }, fr: { yes: 'Oui', maybe: 'Peut-être', no: 'Non' }, es: { yes: 'Sí', maybe: 'Quizás', no: 'No' }, pt: { yes: 'Sim', maybe: 'Talvez', no: 'Não' },
    ar: { yes: 'نعم', maybe: 'ربما', no: 'لا' }, tr: { yes: 'Evet', maybe: 'Belki', no: 'Hayır' }, vi: { yes: 'Có', maybe: 'Có thể', no: 'Không' }, id: { yes: 'Ya', maybe: 'Mungkin', no: 'Tidak' },
    ru: { yes: 'Да', maybe: 'Может быть', no: 'Нет' }, de: { yes: 'Ja', maybe: 'Vielleicht', no: 'Nein' }, hi: { yes: 'हाँ', maybe: 'शायद', no: 'नहीं' }, zh: { yes: '是', maybe: '也许', no: '不' }
  };
  var OR_C = ['#4ADE80', '#FBBF24', '#F87171'];
  game({
    key: 'oracle', l: verb('shake', OR), vb: '0 0 300 250', n: 3, W: [2, 1, 1],
    scene: '<defs><radialGradient id="orB" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#6B7280"/><stop offset=".45" stop-color="#1F2937"/><stop offset="1" stop-color="#000"/></radialGradient><radialGradient id="orW" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#1E3A8A"/><stop offset="1" stop-color="#020617"/></radialGradient></defs>' +
      felt('orF', '#4C1D95', '#0B0820') + (function () { var s = ''; for (var q = 0; q < 26; q++) s += '<circle cx="' + rnd(300) + '" cy="' + rnd(250) + '" r="' + (0.6 + Math.random() * 1.2).toFixed(1) + '" fill="#E9D5FF" opacity="' + (0.3 + Math.random() * 0.5).toFixed(2) + '"/>'; return s; })() +
      '<ellipse cx="150" cy="226" rx="70" ry="10" fill="#000" opacity=".4"/><g id="orBall" transform="translate(150 122)"><circle r="96" fill="url(#orB)"/><ellipse cx="-34" cy="-46" rx="30" ry="16" fill="#fff" opacity=".18" transform="rotate(-30 -34 -46)"/>' +
      '<circle r="46" fill="url(#orW)" stroke="#334155" stroke-width="3"/><g id="orTri" opacity="0"><path d="M-36-20H36L0 38z" fill="#2563EB" stroke="#93C5FD" stroke-width="1.5"/><text id="orTx" y="-2" text-anchor="middle" font-weight="900" fill="#fff" font-family="Arial,sans-serif"></text></g></g>',
    opts: function (l) { return '<div class="cg-opts or-opts">' + [l.yes, l.maybe, l.no].map(function (t, j) { return optBtn(j, '<b class="fit" style="color:' + OR_C[j] + '">' + K.esc(t) + '</b>', pm([0.5, 0.25, 0.25][j])); }).join('') + '</div>'; },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.id('orTri').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var w = +r.view.w, b = c.id('orBall'), tri = c.id('orTri'), t = c.id('orTx'), word = [c.l.yes, c.l.maybe, c.l.no][w];
      c.sfx('launch');
      await tw(c.box, 1300, function (k) { var a = Math.sin(k * Math.PI * 9) * 14 * (1 - k); b.setAttribute('transform', 'translate(' + (150 + a).toFixed(1) + ' ' + (122 + Math.abs(a) * 0.4).toFixed(1) + ') rotate(' + (a * 0.6).toFixed(1) + ')'); if (k < 0.85 && Math.floor(k * 9) % 2) c.sfx('tick'); });
      t.textContent = word; var fs = Math.min(15, Math.floor(110 / Math.max(2, word.length) * 1.1)); t.setAttribute('font-size', String(fs)); t.setAttribute('y', String(-2 + fs * 0.1)); tri.querySelector('path').setAttribute('fill', ['#16A34A', '#B45309', '#B91C1C'][w]);
      c.sfx('reveal');
      await tw(c.box, 900, function (k) { tri.setAttribute('opacity', String(ease(k))); tri.setAttribute('transform', 'rotate(' + ((1 - ease(k)) * 120).toFixed(1) + ') scale(' + (0.5 + 0.5 * ease(k)).toFixed(3) + ')'); });
    },
    rules: {
      en: '1. Pick the answer you expect — Yes, Maybe or No — set your stake and tap “Shake”.\n2. The ball is shaken and the 20-sided die inside floats up: 10 sides say Yes, 5 Maybe, 5 No.\n3. Right answer: Yes ×1.88 · Maybe ×3.76 · No ×3.76. Wrong answer: the stake is lost.',
      fr: '1. Choisis la réponse que tu attends — Oui, Peut-être ou Non — ta mise, puis touche « Secouer ».\n2. La boule est secouée et le dé à 20 faces remonte : 10 faces disent Oui, 5 Peut-être, 5 Non.\n3. Bonne réponse : Oui ×1.88 · Peut-être ×3.76 · Non ×3.76. Mauvaise réponse : la mise est perdue.',
      es: '1. Elige la respuesta que esperas — Sí, Quizás o No —, tu apuesta y toca «Agitar».\n2. Se agita la bola y sube el dado de 20 caras: 10 caras dicen Sí, 5 Quizás, 5 No.\n3. Respuesta correcta: Sí ×1.88 · Quizás ×3.76 · No ×3.76. Incorrecta: pierdes la apuesta.',
      pt: '1. Escolha a resposta que espera — Sim, Talvez ou Não —, o valor e toque em «Agitar».\n2. A bola é agitada e o dado de 20 faces sobe: 10 faces dizem Sim, 5 Talvez, 5 Não.\n3. Resposta certa: Sim ×1.88 · Talvez ×3.76 · Não ×3.76. Errada: a aposta é perdida.',
      ar: '1. اختر الإجابة التي تتوقعها — نعم أو ربما أو لا — والرهان ثم المس «هزّ».\n2. تُهزّ الكرة ويطفو النرد ذو العشرين وجهًا: 10 أوجه تقول نعم و5 ربما و5 لا.\n3. إجابة صحيحة: نعم ×1.88 · ربما ×3.76 · لا ×3.76. إجابة خاطئة: تخسر الرهان.',
      tr: '1. Beklediğin cevabı seç — Evet, Belki ya da Hayır — bahsini belirle ve “Salla”ya dokun.\n2. Top sallanır ve içindeki 20 yüzlü zar yükselir: 10 yüz Evet, 5 Belki, 5 Hayır der.\n3. Doğru cevap: Evet ×1.88 · Belki ×3.76 · Hayır ×3.76. Yanlış cevap: bahis kaybedilir.',
      vi: '1. Chọn câu trả lời bạn đoán — Có, Có thể hoặc Không — mức cược rồi chạm «Lắc».\n2. Quả cầu được lắc và xúc xắc 20 mặt bên trong nổi lên: 10 mặt Có, 5 Có thể, 5 Không.\n3. Đoán đúng: Có ×1.88 · Có thể ×3.76 · Không ×3.76. Đoán sai: mất tiền cược.',
      id: '1. Pilih jawaban yang kamu tebak — Ya, Mungkin atau Tidak — atur taruhan lalu sentuh «Kocok».\n2. Bola dikocok dan dadu 20 sisi di dalamnya naik: 10 sisi Ya, 5 Mungkin, 5 Tidak.\n3. Jawaban benar: Ya ×1.88 · Mungkin ×3.76 · Tidak ×3.76. Salah: taruhan hilang.',
      ru: '1. Выберите ожидаемый ответ — «Да», «Может быть» или «Нет» — ставку и нажмите «Трясти».\n2. Шар встряхивают, и всплывает 20-гранный кубик: 10 граней «Да», 5 «Может быть», 5 «Нет».\n3. Угадали: Да ×1.88 · Может быть ×3.76 · Нет ×3.76. Не угадали — ставка проиграна.',
      de: '1. Wähle die erwartete Antwort — Ja, Vielleicht oder Nein —, deinen Einsatz und tippe auf „Schütteln“.\n2. Die Kugel wird geschüttelt, der 20-seitige Würfel steigt auf: 10 Seiten sagen Ja, 5 Vielleicht, 5 Nein.\n3. Richtige Antwort: Ja ×1.88 · Vielleicht ×3.76 · Nein ×3.76. Falsche Antwort: Einsatz verloren.',
      hi: '1. जिस जवाब की उम्मीद है — हाँ, शायद या नहीं — चुनें, राशि चुनें और «हिलाएं» छुएं।\n2. गोला हिलाया जाता है और अंदर का 20 फलक वाला पासा ऊपर आता है: 10 फलक हाँ, 5 शायद, 5 नहीं।\n3. सही जवाब: हाँ ×1.88 · शायद ×3.76 · नहीं ×3.76। गलत: दांव हार जाते हैं।',
      zh: '1. 选择你预测的答案——是、也许或不——设定金额并点击“摇一摇”。\n2. 摇动水晶球，里面的二十面骰浮上来：10 面写“是”，5 面“也许”，5 面“不”。\n3. 猜对：是 ×1.88 · 也许 ×3.76 · 不 ×3.76。猜错：输掉下注。'
    }
  });

  /* =============================== RPS DUEL =============================== */
  // tu choisis pierre, feuille ou ciseaux (dessin) ; le robot joue en même temps. Lignes : 0 perdu · 1 égalité ×1 · 2 gagné ×1.82
  function hand(t, col) {
    var skin = col || '#F5C7A1', d = col ? '#4C1D95' : '#B45309';
    if (t === 0) return '<g><rect x="-22" y="-18" width="44" height="36" rx="14" fill="' + skin + '" stroke="' + d + '" stroke-width="2"/><path d="M-12-18v10M0-18v10M12-18v10" stroke="' + d + '" stroke-width="1.6"/><rect x="-30" y="-6" width="12" height="16" rx="6" fill="' + skin + '" stroke="' + d + '" stroke-width="2"/></g>';
    if (t === 1) return '<g><rect x="-22" y="-10" width="44" height="30" rx="10" fill="' + skin + '" stroke="' + d + '" stroke-width="2"/>' + [-15, -5, 5, 15].map(function (x) { return '<rect x="' + (x - 4.5) + '" y="-40" width="9" height="34" rx="4.5" fill="' + skin + '" stroke="' + d + '" stroke-width="2"/>'; }).join('') + '<rect x="-34" y="-4" width="14" height="10" rx="5" fill="' + skin + '" stroke="' + d + '" stroke-width="2" transform="rotate(-30 -27 1)"/></g>';
    return '<g><rect x="-22" y="-10" width="44" height="30" rx="12" fill="' + skin + '" stroke="' + d + '" stroke-width="2"/><rect x="-14" y="-44" width="10" height="38" rx="5" fill="' + skin + '" stroke="' + d + '" stroke-width="2" transform="rotate(-14 -9 -6)"/><rect x="2" y="-44" width="10" height="38" rx="5" fill="' + skin + '" stroke="' + d + '" stroke-width="2" transform="rotate(14 7 -6)"/></g>';
  }
  game({
    key: 'rpsduel', l: verb('play'), vb: '0 0 300 250', W: [1, 1, 1],
    chips: [[chipT('=', '#E2E8F0'), 1], ['<path d="M-7 0l5 5 9-10" stroke="#4ADE80" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', 1.82]],
    chipOf: function (i) { return i - 1; },
    scene: bg('#0F172A', '#312E81') + '<path d="M150 10V240" stroke="#FDE68A" stroke-opacity=".25" stroke-width="2" stroke-dasharray="6 6"/>' + txt(150, 130, 'VS', 22, '#FDE68A', ' opacity=".7"') +
      '<g transform="translate(228 70)"><rect x="-30" y="-34" width="60" height="50" rx="14" fill="#4C1D95" stroke="#C4B5FD" stroke-width="2"/><circle cx="-12" cy="-12" r="6" fill="#22D3EE"/><circle cx="12" cy="-12" r="6" fill="#22D3EE"/><path d="M-12 4h24" stroke="#C4B5FD" stroke-width="3" stroke-linecap="round"/><path d="M0-34v-10" stroke="#C4B5FD" stroke-width="2"/><circle cy="-46" r="4" fill="#F472B6"/></g>' +
      '<g id="rpR" transform="translate(228 160) rotate(180)">' + hand(0, '#A78BFA') + '</g><g id="rpP" transform="translate(72 150)">' + hand(0) + '</g>',
    opts: function () { return '<div class="cg-opts rp-opts">' + [0, 1, 2].map(function (t) { return '<button type="button" data-o="' + t + '"><svg viewBox="-36 -48 72 72" aria-hidden="true">' + hand(t) + '</svg></button>'; }).join('') + '</div>'; },
    onPick: function (c, j) { if (!c.busyP) c.id('rpP').innerHTML = hand(j); },
    params: function (c) { return { hand: c.sel }; },
    play: async function (c, r) {
      var i = +r.view.i, me = c.sel, bot = i === 1 ? me : i === 2 ? (me + 2) % 3 : (me + 1) % 3, P = c.id('rpP'), Rb = c.id('rpR');
      c.busyP = 1; P.innerHTML = hand(0); Rb.innerHTML = hand(0, '#A78BFA');
      for (var q = 0; q < 3; q++) { c.sfx('tick'); await tw(c.box, 300, function (k) { var y = -Math.sin(k * Math.PI) * 22; P.setAttribute('transform', 'translate(72 ' + (150 + y).toFixed(1) + ')'); Rb.setAttribute('transform', 'translate(228 ' + (160 + y).toFixed(1) + ') rotate(180)'); }); }
      P.innerHTML = hand(me); Rb.innerHTML = hand(bot, '#A78BFA'); c.busyP = 0; c.sfx('stop');
      await tw(c.box, 300, function (k) { var s = 1 + Math.sin(k * Math.PI) * 0.15; P.setAttribute('transform', 'translate(72 150) scale(' + (i === 2 ? s : 1).toFixed(3) + ')'); Rb.setAttribute('transform', 'translate(228 160) rotate(180) scale(' + (i === 0 ? s : 1).toFixed(3) + ')'); });
    },
    rules: {
      en: '1. Pick rock, paper or scissors, set your stake and tap “Play”.\n2. You and the robot shake 3 times, then both hands show at once. Rock beats scissors, scissors beat paper, paper beats rock.\n3. You win ×1.82 · same hand: stake back · the robot wins: the stake is lost.',
      fr: '1. Choisis pierre, feuille ou ciseaux, ta mise, puis touche « Jouer ».\n2. Toi et le robot secouez 3 fois, puis les deux mains s’ouvrent ensemble. La pierre bat les ciseaux, les ciseaux battent la feuille, la feuille bat la pierre.\n3. Tu gagnes ×1.82 · même main : mise rendue · le robot gagne : la mise est perdue.',
      es: '1. Elige piedra, papel o tijera, tu apuesta y toca «Jugar».\n2. Tú y el robot agitáis 3 veces y luego mostráis la mano a la vez. Piedra gana a tijera, tijera a papel, papel a piedra.\n3. Ganas ×1.82 · misma mano: se devuelve la apuesta · gana el robot: pierdes la apuesta.',
      pt: '1. Escolha pedra, papel ou tesoura, o valor e toque em «Jogar».\n2. Você e o robô balançam 3 vezes e mostram a mão ao mesmo tempo. Pedra vence tesoura, tesoura vence papel, papel vence pedra.\n3. Você ganha ×1.82 · mesma mão: aposta devolvida · o robô ganha: a aposta é perdida.',
      ar: '1. اختر حجرًا أو ورقة أو مقصًا والرهان ثم المس «العب».\n2. تهز أنت والروبوت يديكما 3 مرات ثم تظهر اليدان معًا. الحجر يغلب المقص، والمقص يغلب الورقة، والورقة تغلب الحجر.\n3. تفوز ×1.82 · اليد نفسها: يُعاد الرهان · يفوز الروبوت: تخسر الرهان.',
      tr: '1. Taş, kâğıt veya makas seç, bahsini belirle ve “Oyna”ya dokun.\n2. Sen ve robot 3 kez sallarsınız, sonra eller aynı anda açılır. Taş makası, makas kâğıdı, kâğıt taşı yener.\n3. Kazanırsan ×1.82 · aynı el: bahis iade · robot kazanırsa bahis kaybedilir.',
      vi: '1. Chọn búa, bao hoặc kéo, mức cược rồi chạm «Chơi».\n2. Bạn và robot lắc tay 3 lần rồi cùng ra tay. Búa thắng kéo, kéo thắng bao, bao thắng búa.\n3. Bạn thắng ×1.82 · hòa: hoàn cược · robot thắng: mất tiền cược.',
      id: '1. Pilih batu, kertas atau gunting, atur taruhan lalu sentuh «Main».\n2. Kamu dan robot mengayun 3 kali lalu menunjukkan tangan bersamaan. Batu mengalahkan gunting, gunting mengalahkan kertas, kertas mengalahkan batu.\n3. Kamu menang ×1.82 · tangan sama: taruhan kembali · robot menang: taruhan hilang.',
      ru: '1. Выберите камень, бумагу или ножницы, ставку и нажмите «Играть».\n2. Вы и робот трясёте руками 3 раза и показываете одновременно. Камень бьёт ножницы, ножницы — бумагу, бумага — камень.\n3. Победа ×1.82 · одинаково: ставка возвращается · победил робот — ставка проиграна.',
      de: '1. Wähle Stein, Papier oder Schere, deinen Einsatz und tippe auf „Spielen“.\n2. Du und der Roboter schüttelt 3-mal, dann zeigen beide gleichzeitig. Stein schlägt Schere, Schere schlägt Papier, Papier schlägt Stein.\n3. Du gewinnst ×1.82 · gleiche Hand: Einsatz zurück · der Roboter gewinnt: Einsatz verloren.',
      hi: '1. पत्थर, कागज़ या कैंची चुनें, राशि चुनें और «खेलें» छुएं।\n2. आप और रोबोट 3 बार हाथ हिलाते हैं, फिर दोनों एक साथ हाथ दिखाते हैं। पत्थर कैंची को, कैंची कागज़ को, कागज़ पत्थर को हराता है।\n3. आप जीतें ×1.82 · एक जैसा हाथ: दांव वापस · रोबोट जीते: दांव हार जाते हैं।',
      zh: '1. 选择石头、布或剪刀，设定金额并点击“开始”。\n2. 你和机器人摇 3 下后同时出手。石头赢剪刀，剪刀赢布，布赢石头。\n3. 你赢 ×1.82 · 相同：退还下注 · 机器人赢：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
