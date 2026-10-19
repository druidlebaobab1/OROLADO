/* casb3 — Yatzy, Crown & Anchor, Dice Derby, Cee-Lo, Ship & Crew (owner request, round 6) — instant games; the scene always shows exactly the line (or option) the server drew (casino_ext/casb.php). */
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
  function d6() { return 1 + rnd(6); }
  // un dé qui roule puis s'arrête sur v (g = groupe SVG déjà placé en x, y)
  async function rollDie(c, g, x, y, v, s, ms, col) {
    var rot = (rnd(2) ? 1 : -1) * (300 + rnd(200));
    await tw(c.box, ms || 520, function (k) { if (k < 0.8) g.innerHTML = die(d6(), s, col); else g.innerHTML = die(v, s, col); var e = ease(k); g.setAttribute('transform', 'translate(' + x + ' ' + (y - Math.abs(Math.sin(k * Math.PI * 2)) * 14 * (1 - k)).toFixed(1) + ') rotate(' + (rot * (1 - e)).toFixed(0) + ')'); });
    g.innerHTML = die(v, s, col); tr(g, x, y);
  }
  function miniDice(vs) { return vs.map(function (v, j) { var x = (j - (vs.length - 1) / 2) * 7; return '<g transform="translate(' + x + ' 0) scale(.3)">' + die(v, 1) + '</g>'; }).join(''); }

  /* =============================== YATZY =============================== */
  // 5 dés, 3 lancers ; on garde la face la plus fréquente (la plus haute à égalité), un full est gardé tel quel.
  // Lignes : 0 rien / paires · 1 brelan ×0.5 · 2 full ×1.2 · 3 carré ×1.6 · 4 yatzy ×5.3
  function yzCat(d) { var c = [0, 0, 0, 0, 0, 0, 0]; d.forEach(function (x) { c[x]++; }); var s = c.slice(1).sort(function (a, b) { return b - a; }); return s[0] === 5 ? 4 : s[0] === 4 ? 3 : s[0] === 3 && s[1] === 2 ? 2 : s[0] === 3 ? 1 : 0; }
  function yzKeep(d) { var c = [0, 0, 0, 0, 0, 0, 0]; d.forEach(function (x) { c[x]++; }); var bf = 6; for (var f = 6; f >= 1; f--) if (c[f] > c[bf]) bf = f; return bf; }
  function yatzy() {
    var d = [d6(), d6(), d6(), d6(), d6()], rolls = [d.slice()], holds = [];
    for (var k = 1; k < 3; k++) { var ct = yzCat(d); if (ct === 4 || ct === 2) break; var f = yzKeep(d), h = d.map(function (x) { return x === f; }); holds.push(h); d = d.map(function (x, i) { return h[i] ? x : d6(); }); rolls.push(d.slice()); }
    return { rolls: rolls, holds: holds, cat: yzCat(d) };
  }
  var YX = function (j) { return 54 + j * 48; };
  game({
    key: 'yatzy', l: verb('roll'), vb: '0 0 300 250', W: [256, 289, 211, 204, 40],
    chips: [[miniDice([3, 3, 3]), 0.5], [miniDice([5, 5, 5, 2, 2]), 1.2], [miniDice([4, 4, 4, 4]), 1.6], [miniDice([6, 6, 6, 6, 6]), 5.3]],
    chipOf: function (i) { return i - 1; },
    scene: felt('yzF', '#334155', '#0F172A') + '<rect x="18" y="70" width="264" height="110" rx="20" fill="#14532D" stroke="#FDE68A" stroke-opacity=".35" stroke-width="2"/>' +
      [0, 1, 2, 3, 4].map(function (j) { return '<g id="yzD' + j + '" transform="translate(' + YX(j) + ' 125)">' + die(j + 1, 1.6) + '</g>'; }).join('') +
      '<g id="yzRolls" transform="translate(150 212)">' + [0, 1, 2].map(function (j) { return '<circle id="yzR' + j + '" cx="' + ((j - 1) * 22) + '" r="7" fill="#1E293B" stroke="#94A3B8"/>'; }).join('') + '</g>',
    reset: function (c) { for (var j = 0; j < 5; j++) c.id('yzD' + j).removeAttribute('class'); for (j = 0; j < 3; j++) c.id('yzR' + j).setAttribute('fill', '#1E293B'); },
    play: async function (c, r) {
      var i = +r.view.i, g = find(yatzy, function (x) { return x.cat === i; }) || yatzy();
      for (var k = 0; k < g.rolls.length; k++) {
        var hold = k ? g.holds[k - 1] : [false, false, false, false, false], ps = [];
        c.id('yzR' + k).setAttribute('fill', '#FBBF24'); c.sfx('roll');
        for (var j = 0; j < 5; j++) { var el = c.id('yzD' + j); el.classList.toggle('cb-held', !!hold[j]); if (!hold[j]) ps.push(rollDie(c, el, YX(j), 125, g.rolls[k][j], 1.6, 520 + j * 60)); }
        await Promise.all(ps);
        c.sfx('stop');
        await wait(c.box, 380);
      }
      var fin = g.rolls[g.rolls.length - 1], f = yzKeep(fin);
      for (j = 0; j < 5; j++) c.id('yzD' + j).classList.toggle('cb-held', i > 0 && (i === 2 || fin[j] === f));
    },
    rules: {
      en: '1. Set your stake and tap “Roll”: 5 dice, up to 3 rolls.\n2. After each roll the most common face is kept (raised) and the others are rolled again; a full house is kept.\n3. Three alike ×0.5 · full house (3 + 2) ×1.2 · four alike ×1.6 · Yatzy (5 alike) ×5.3. Less: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : 5 dés, jusqu’à 3 lancers.\n2. Après chaque lancer, la face la plus fréquente est gardée (dés levés), les autres sont relancés ; un full est gardé.\n3. Brelan ×0.5 · full (3 + 2) ×1.2 · carré ×1.6 · Yatzy (5 pareils) ×5.3. Moins : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Tirar»: 5 dados, hasta 3 tiradas.\n2. Tras cada tirada se guarda la cara más repetida (dados levantados) y se relanzan los demás; un full se guarda.\n3. Trío ×0.5 · full (3 + 2) ×1.2 · póker ×1.6 · Yatzy (5 iguales) ×5.3. Menos: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Rolar»: 5 dados, até 3 lançamentos.\n2. Após cada lançamento a face mais comum é guardada (dados erguidos) e os outros são relançados; um full é guardado.\n3. Trinca ×0.5 · full (3 + 2) ×1.2 · quadra ×1.6 · Yatzy (5 iguais) ×5.3. Menos: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «ارمِ»: 5 أحجار نرد، حتى 3 رميات.\n2. بعد كل رمية يُحتفظ بالوجه الأكثر تكرارًا (النرد المرفوع) ويُعاد رمي الباقي؛ ويُحتفظ بالفل هاوس.\n3. ثلاثة متشابهة ×0.5 · فل هاوس (3 + 2) ×1.2 · أربعة متشابهة ×1.6 · ياتزي (5 متشابهة) ×5.3. أقل من ذلك: تخسر الرهان.',
      tr: '1. Bahsini seç ve “At”a dokun: 5 zar, en fazla 3 atış.\n2. Her atıştan sonra en çok gelen yüz tutulur (kalkık zarlar), diğerleri yeniden atılır; full tutulur.\n3. Üçlü ×0.5 · full (3 + 2) ×1.2 · dörtlü ×1.6 · Yatzy (5 aynı) ×5.3. Daha azı: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Gieo»: 5 xúc xắc, tối đa 3 lần gieo.\n2. Sau mỗi lần gieo, mặt xuất hiện nhiều nhất được giữ lại (xúc xắc nâng lên), các viên khác gieo lại; cù lũ được giữ.\n3. Ba giống ×0.5 · cù lũ (3 + 2) ×1.2 · bốn giống ×1.6 · Yatzy (5 giống) ×5.3. Ít hơn: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lempar»: 5 dadu, sampai 3 lemparan.\n2. Setelah tiap lemparan, sisi yang paling sering disimpan (dadu terangkat), sisanya dilempar lagi; full house disimpan.\n3. Tiga sama ×0.5 · full house (3 + 2) ×1.2 · empat sama ×1.6 · Yatzy (5 sama) ×5.3. Kurang: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бросить»: 5 кубиков, до 3 бросков.\n2. После каждого броска самая частая грань остаётся (кубики приподняты), остальные перебрасываются; фулл-хаус сохраняется.\n3. Три одинаковых ×0.5 · фулл-хаус (3 + 2) ×1.2 · четыре ×1.6 · Ятзи (5 одинаковых) ×5.3. Меньше — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Würfeln“: 5 Würfel, bis zu 3 Würfe.\n2. Nach jedem Wurf bleibt die häufigste Augenzahl liegen (angehobene Würfel), die anderen werden neu geworfen; ein Full House bleibt liegen.\n3. Drei gleiche ×0.5 · Full House (3 + 2) ×1.2 · vier gleiche ×1.6 · Yatzy (5 gleiche) ×5.3. Weniger: Einsatz verloren.',
      hi: '1. राशि चुनें और «फेंकें» छुएं: 5 पासे, 3 बार तक।\n2. हर बार सबसे ज़्यादा आया अंक रखा जाता है (ऊपर उठे पासे), बाकी फिर फेंके जाते हैं; फुल हाउस रखा जाता है।\n3. तीन एक जैसे ×0.5 · फुल हाउस (3 + 2) ×1.2 · चार एक जैसे ×1.6 · यात्ज़ी (5 एक जैसे) ×5.3। इससे कम: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“掷骰”：5 颗骰子，最多掷 3 次。\n2. 每次掷完保留出现最多的点数（抬起的骰子），其余重掷；葫芦直接保留。\n3. 三条 ×0.5 · 葫芦（3 + 2）×1.2 · 四条 ×1.6 · 快艇（5 个相同）×5.3。更少：输掉下注。'
    }
  });

  /* =============================== CROWN & ANCHOR =============================== */
  // 3 dés à symboles ; on choisit un symbole (dessin seulement). Ligne = combien de fois il sort : 0 · 1 ×1.9 · 2 ×3.3 · 3 ×11 (exact /216)
  var CA_SYM = [
    '<path d="M-9 5h18l2-12-6 5-5-8-5 8-6-5z" fill="#FBBF24" stroke="#92400E" stroke-width="1"/><rect x="-9" y="5" width="18" height="3.5" rx="1" fill="#D97706"/>',
    '<path d="M0-7v15M-6-3h12M-8 3q8 10 16 0" stroke="#1D4ED8" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cy="-8.5" r="2.4" fill="none" stroke="#1D4ED8" stroke-width="1.8"/>',
    '<path d="' + SUIT[1] + '" transform="scale(1.3)" fill="#DC2626"/>', '<path d="' + SUIT[2] + '" transform="scale(1.3)" fill="#DC2626"/>',
    '<path d="' + SUIT[3] + '" transform="scale(1.3)" fill="#111827"/>', '<path d="' + SUIT[0] + '" transform="scale(1.3)" fill="#111827"/>'];
  function caDie(s, k) { return '<rect x="-17" y="-17" width="34" height="34" rx="8" fill="#FFFDF7" stroke="#CBD5E1"/><g transform="scale(' + (k || 1.25) + ')">' + CA_SYM[s] + '</g>'; }
  game({
    key: 'crownanchor', l: verb('roll'), vb: '0 0 300 250', W: [125, 75, 15, 1],
    chips: [['<g transform="scale(.55)">' + CA_SYM[0] + '</g>', 1.9], ['<g transform="scale(.42) translate(-9 0)">' + CA_SYM[0] + '</g><g transform="scale(.42) translate(9 0)">' + CA_SYM[0] + '</g>', 3.3],
      ['<g transform="scale(.34) translate(-18 0)">' + CA_SYM[0] + '</g><g transform="scale(.34)">' + CA_SYM[0] + '</g><g transform="scale(.34) translate(18 0)">' + CA_SYM[0] + '</g>', 11]],
    chipOf: function (i) { return i - 1; },
    scene: felt('caF', '#1E3A8A', '#0B1437') + '<g opacity=".95">' + [0, 1, 2, 3, 4, 5].map(function (s) { var x = 50 + (s % 3) * 100, y = s < 3 ? 52 : 108; return '<g id="caB' + s + '" class="ca-b"><rect x="' + (x - 44) + '" y="' + (y - 24) + '" width="88" height="48" rx="10" fill="#FEF3C7" fill-opacity=".1" stroke="#FDE68A" stroke-opacity=".5"/><g transform="translate(' + x + ' ' + y + ') scale(1.5)">' + CA_SYM[s] + '</g></g>'; }).join('') + '</g>' +
      '<rect x="40" y="150" width="220" height="82" rx="18" fill="#000" opacity=".25"/>' + [0, 1, 2].map(function (j) { return '<g id="caD' + j + '" transform="translate(' + (90 + j * 60) + ' 192)">' + caDie(j * 2) + '</g>'; }).join(''),
    opts: function () { return '<div class="cg-opts ca-opts">' + [0, 1, 2, 3, 4, 5].map(function (s) { return '<button type="button" data-o="' + s + '"><svg viewBox="-12 -12 24 24" aria-hidden="true">' + CA_SYM[s] + '</svg></button>'; }).join('') + '</div>'; },
    onPick: function (c, j) { c.qa('.ca-b').forEach(function (b, q) { b.classList.toggle('on', q === j); }); },
    params: function (c) { return { sym: c.sel }; },
    reset: function (c) { for (var j = 0; j < 3; j++) c.id('caD' + j).removeAttribute('class'); },
    play: async function (c, r) {
      var m = +r.view.i, me = c.sel, faces = [];
      for (var j = 0; j < 3; j++) { if (j < m) faces.push(me); else { var o; do { o = rnd(6); } while (o === me); faces.push(o); } }
      shuffle(faces); c.sfx('roll');
      await Promise.all([0, 1, 2].map(function (q) {
        var g = c.id('caD' + q), x = 90 + q * 60, rot = 360 + rnd(240);
        return tw(c.box, 700 + q * 120, function (k) { g.innerHTML = caDie(k < 0.8 ? rnd(6) : faces[q]); var e = ease(k); g.setAttribute('transform', 'translate(' + x + ' ' + (192 - Math.abs(Math.sin(k * Math.PI * 2.5)) * 22 * (1 - k)).toFixed(1) + ') rotate(' + (rot * (1 - e)).toFixed(0) + ')'); });
      }));
      for (j = 0; j < 3; j++) { c.id('caD' + j).innerHTML = caDie(faces[j]); tr(c.id('caD' + j), 90 + j * 60, 192); if (faces[j] === me) c.id('caD' + j).setAttribute('class', 'cb-glow'); }
      c.sfx('stop');
    },
    rules: {
      en: '1. Pick a symbol (crown, anchor, heart, diamond, club or spade), set your stake and tap “Roll”.\n2. Three symbol dice are rolled.\n3. Your symbol on 1 die ×1.9 · on 2 dice ×3.3 · on all 3 ×11. Not there: the stake is lost.',
      fr: '1. Choisis un symbole (couronne, ancre, cœur, carreau, trèfle ou pique), ta mise, puis touche « Lancer ».\n2. Trois dés à symboles sont lancés.\n3. Ton symbole sur 1 dé ×1.9 · sur 2 dés ×3.3 · sur les 3 ×11. Absent : la mise est perdue.',
      es: '1. Elige un símbolo (corona, ancla, corazón, diamante, trébol o pica), tu apuesta y toca «Tirar».\n2. Se lanzan tres dados de símbolos.\n3. Tu símbolo en 1 dado ×1.9 · en 2 dados ×3.3 · en los 3 ×11. Si no sale: pierdes la apuesta.',
      pt: '1. Escolha um símbolo (coroa, âncora, copas, ouros, paus ou espadas), o valor e toque em «Rolar».\n2. Três dados de símbolos são lançados.\n3. Seu símbolo em 1 dado ×1.9 · em 2 dados ×3.3 · nos 3 ×11. Se não sair: a aposta é perdida.',
      ar: '1. اختر رمزًا (تاج، مرساة، قلب، ديناري، سباتي أو بستوني) والرهان ثم المس «ارمِ».\n2. تُرمى ثلاثة أحجار نرد بالرموز.\n3. رمزك على حجر واحد ×1.9 · على حجرين ×3.3 · على الثلاثة ×11. إن لم يظهر: تخسر الرهان.',
      tr: '1. Bir sembol seç (taç, çapa, kupa, karo, sinek veya maça), bahsini belirle ve “At”a dokun.\n2. Üç sembollü zar atılır.\n3. Sembolün 1 zarda ×1.9 · 2 zarda ×3.3 · 3’ünde ×11. Gelmezse bahis kaybedilir.',
      vi: '1. Chọn một biểu tượng (vương miện, mỏ neo, cơ, rô, chuồn hoặc bích), mức cược rồi chạm «Gieo».\n2. Ba viên xúc xắc biểu tượng được gieo.\n3. Biểu tượng của bạn trên 1 viên ×1.9 · 2 viên ×3.3 · cả 3 viên ×11. Không có: mất tiền cược.',
      id: '1. Pilih simbol (mahkota, jangkar, hati, wajik, keriting atau sekop), atur taruhan lalu sentuh «Lempar».\n2. Tiga dadu simbol dilempar.\n3. Simbolmu di 1 dadu ×1.9 · di 2 dadu ×3.3 · di ketiganya ×11. Tidak muncul: taruhan hilang.',
      ru: '1. Выберите символ (корона, якорь, черви, бубны, трефы или пики), ставку и нажмите «Бросить».\n2. Бросают три кубика с символами.\n3. Ваш символ на 1 кубике ×1.9 · на 2 ×3.3 · на всех 3 ×11. Нет символа — ставка проиграна.',
      de: '1. Wähle ein Symbol (Krone, Anker, Herz, Karo, Kreuz oder Pik), deinen Einsatz und tippe auf „Würfeln“.\n2. Drei Symbolwürfel werden geworfen.\n3. Dein Symbol auf 1 Würfel ×1.9 · auf 2 ×3.3 · auf allen 3 ×11. Nicht dabei: Einsatz verloren.',
      hi: '1. एक चिह्न चुनें (ताज, लंगर, पान, ईंट, चिड़ी या हुकुम), राशि चुनें और «फेंकें» छुएं।\n2. तीन चिह्न वाले पासे फेंके जाते हैं।\n3. आपका चिह्न 1 पासे पर ×1.9 · 2 पर ×3.3 · तीनों पर ×11। न आए: दांव हार जाते हैं।',
      zh: '1. 选择一个图案（皇冠、船锚、红心、方块、梅花或黑桃），设定金额并点击“掷骰”。\n2. 掷出三颗图案骰子。\n3. 你的图案出现在 1 颗骰子上 ×1.9 · 2 颗 ×3.3 · 3 颗 ×11。没有出现：输掉下注。'
    }
  });

  /* =============================== DICE DERBY (choix) =============================== */
  // 6 chevaux ; chaque lancer de dé fait avancer le cheval du même numéro d'un pas. Le cheval n doit faire n + 3 pas (4…9). Chances exactes.
  var DB_P = [0.494294, 0.26175, 0.133586, 0.065531, 0.030871, 0.013968], DB_N = [4, 5, 6, 7, 8, 9], DB_COL = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7', '#EC4899'];
  var DBY = function (h) { return 50 + h * 32; }, DBX = function (h, s) { return 34 + (s / DB_N[h]) * 222; };
  function derbyRace() { var pos = [0, 0, 0, 0, 0, 0], rolls = []; for (;;) { var v = rnd(6); rolls.push(v); if (++pos[v] >= DB_N[v]) return { w: v, rolls: rolls }; } }
  function horse(col) { return '<path d="M-14 4q2-10 12-10h8l5-7 3 3-2 6q3 3 1 8l-3 1-2-4-3 5h-3l1-5h-9l-3 8h-3l1-8q-4-1-3-2z" fill="#7C2D12"/><circle cx="10" cy="-9" r=".9" fill="#000"/><path d="M-6-6q0-5 6-5" stroke="' + col + '" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="-3" cy="-11" r="3" fill="' + col + '"/>'; }
  game({
    key: 'derby', l: verb('race'), vb: '0 0 300 250', n: 6, W: DB_P,
    scene: felt('dbF', '#15803D', '#14532D') + [0, 1, 2, 3, 4, 5].map(function (h) { var y = DBY(h); return '<rect x="20" y="' + (y - 15) + '" width="250" height="30" rx="6" fill="' + (h % 2 ? '#166534' : '#14532D') + '" stroke="#86EFAC" stroke-opacity=".2"/>' +
      Array.apply(null, Array(DB_N[h] - 1)).map(function (_, s) { return '<circle cx="' + DBX(h, s + 1).toFixed(1) + '" cy="' + (y + 10) + '" r="1.4" fill="#BBF7D0" opacity=".45"/>'; }).join('') +
      '<circle cx="12" cy="' + y + '" r="8" fill="' + DB_COL[h] + '"/>' + txt(12, y + 4, h + 1, 10, '#fff') + '<g id="dbH' + h + '" transform="translate(' + DBX(h, 0) + ' ' + y + ')">' + horse(DB_COL[h]) + '</g>'; }).join('') +
      '<path d="M258 32V250" stroke="#fff" stroke-width="4" stroke-dasharray="4 4"/><g id="dbDie" transform="translate(150 18)">' + die(1, 0.8) + '</g>',
    opts: function () { return '<div class="cg-opts db-opts">' + DB_P.map(function (p, h) { return optBtn(h, '<b class="fit" style="color:' + DB_COL[h] + '">' + (h + 1) + '</b>', pm(p)); }).join('') + '</div>'; },
    onPick: function (c, j) { for (var h = 0; h < 6; h++) c.id('dbH' + h).classList.toggle('db-me', h === j); },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { for (var h = 0; h < 6; h++) tr(c.id('dbH' + h), DBX(h, 0), DBY(h)); },
    play: async function (c, r) {
      var w = +r.view.w, g = find(derbyRace, function (x) { return x.w === w; }) || derbyRace(), pos = [0, 0, 0, 0, 0, 0], dEl = c.id('dbDie');
      var per = g.rolls.length > 30 ? 110 : 150;
      for (var j = 0; j < g.rolls.length; j++) {
        var v = g.rolls[j], el = c.id('dbH' + v), from = pos[v]; pos[v]++;
        dEl.innerHTML = die(v + 1, 0.8); if (j % 3 === 0) c.sfx('roll');
        await tw(c.box, per, function (k) { tr(el, lerp(DBX(v, from), DBX(v, pos[v]), ease(k)), DBY(v) - Math.sin(k * Math.PI) * 4); });
      }
      c.sfx('stop');
    },
    rules: {
      en: '1. Pick a horse (1 to 6), set your stake and tap “Race”.\n2. A die is rolled again and again: each roll moves the horse with that number one step. Horse 1 needs 4 steps, horse 2 needs 5 … horse 6 needs 9.\n3. Your horse finishes first: you win the multiplier on its button (×1.9 for horse 1 up to ×67.29 for horse 6). Otherwise the stake is lost.',
      fr: '1. Choisis un cheval (1 à 6), ta mise, puis touche « Course ».\n2. Un dé est lancé encore et encore : chaque lancer fait avancer d’un pas le cheval de ce numéro. Le cheval 1 doit faire 4 pas, le 2 en fait 5 … le 6 en fait 9.\n3. Ton cheval arrive le premier : tu gagnes le multiplicateur écrit sur son bouton (×1.9 pour le 1 jusqu’à ×67.29 pour le 6). Sinon, la mise est perdue.',
      es: '1. Elige un caballo (1 a 6), tu apuesta y toca «Correr».\n2. Se lanza un dado una y otra vez: cada tirada adelanta un paso al caballo de ese número. El caballo 1 necesita 4 pasos, el 2 necesita 5 … el 6 necesita 9.\n3. Tu caballo llega primero: ganas el multiplicador de su botón (×1.9 para el 1 hasta ×67.29 para el 6). Si no, pierdes la apuesta.',
      pt: '1. Escolha um cavalo (1 a 6), o valor e toque em «Correr».\n2. Um dado é lançado sem parar: cada lançamento avança um passo o cavalo desse número. O cavalo 1 precisa de 4 passos, o 2 de 5 … o 6 de 9.\n3. Seu cavalo chega primeiro: você ganha o multiplicador do botão dele (×1.9 para o 1 até ×67.29 para o 6). Senão, a aposta é perdida.',
      ar: '1. اختر حصانًا (من 1 إلى 6) والرهان ثم المس «سباق».\n2. يُرمى النرد مرة بعد مرة: كل رمية تُقدّم الحصان الذي يحمل الرقم خطوة. الحصان 1 يحتاج 4 خطوات، والحصان 2 يحتاج 5 … والحصان 6 يحتاج 9.\n3. إذا وصل حصانك أولًا: تربح المضاعف المكتوب على زرّه (×1.9 للحصان 1 حتى ×67.29 للحصان 6). وإلا تخسر الرهان.',
      tr: '1. Bir at seç (1–6), bahsini belirle ve “Koş”a dokun.\n2. Zar tekrar tekrar atılır: her atış o numaralı atı bir adım ilerletir. 1 numara 4 adım, 2 numara 5 adım … 6 numara 9 adım koşmalı.\n3. Atın önce gelirse düğmesindeki katsayıyı kazanırsın (1 için ×1.9’dan 6 için ×67.29’a). Yoksa bahis kaybedilir.',
      vi: '1. Chọn một con ngựa (1 đến 6), mức cược rồi chạm «Đua».\n2. Xúc xắc được gieo liên tục: mỗi lần gieo, ngựa mang số đó tiến một bước. Ngựa 1 cần 4 bước, ngựa 2 cần 5 … ngựa 6 cần 9.\n3. Ngựa của bạn về nhất: thắng hệ số ghi trên nút (×1.9 cho ngựa 1 đến ×67.29 cho ngựa 6). Nếu không, mất tiền cược.',
      id: '1. Pilih kuda (1 sampai 6), atur taruhan lalu sentuh «Balap».\n2. Dadu dilempar terus: tiap lemparan memajukan kuda bernomor itu satu langkah. Kuda 1 butuh 4 langkah, kuda 2 butuh 5 … kuda 6 butuh 9.\n3. Kudamu finis pertama: kamu menang pengali di tombolnya (×1.9 untuk kuda 1 sampai ×67.29 untuk kuda 6). Jika tidak, taruhan hilang.',
      ru: '1. Выберите лошадь (1–6), ставку и нажмите «Старт».\n2. Кубик бросают снова и снова: каждый бросок двигает лошадь с этим номером на шаг. Лошади 1 нужно 4 шага, лошади 2 — 5 … лошади 6 — 9.\n3. Ваша лошадь пришла первой: выигрыш по множителю на её кнопке (от ×1.9 для 1 до ×67.29 для 6). Иначе ставка проиграна.',
      de: '1. Wähle ein Pferd (1 bis 6), deinen Einsatz und tippe auf „Start“.\n2. Es wird immer wieder gewürfelt: jeder Wurf bringt das Pferd mit dieser Zahl einen Schritt weiter. Pferd 1 braucht 4 Schritte, Pferd 2 braucht 5 … Pferd 6 braucht 9.\n3. Dein Pferd ist zuerst im Ziel: du gewinnst den Faktor auf seinem Knopf (×1.9 für Pferd 1 bis ×67.29 für Pferd 6). Sonst ist der Einsatz verloren.',
      hi: '1. एक घोड़ा चुनें (1 से 6), राशि चुनें और «दौड़» छुएं।\n2. पासा बार-बार फेंका जाता है: हर बार उस नंबर का घोड़ा एक कदम आगे बढ़ता है। घोड़े 1 को 4 कदम, घोड़े 2 को 5 … घोड़े 6 को 9 कदम चाहिए।\n3. आपका घोड़ा पहले पहुंचे: उसके बटन पर लिखा गुणक जीतें (घोड़ा 1 के लिए ×1.9 से घोड़ा 6 के लिए ×67.29 तक)। नहीं तो दांव हार जाते हैं।',
      zh: '1. 选一匹马（1 到 6），设定金额并点击“开跑”。\n2. 骰子不断掷出：每掷一次，对应号码的马前进一步。1 号马需 4 步，2 号马需 5 步 … 6 号马需 9 步。\n3. 你的马第一个冲线：赢取按钮上的倍数（1 号 ×1.9 至 6 号 ×67.29）。否则输掉下注。'
    }
  });

  /* =============================== CEE-LO =============================== */
  // toi puis la banque lancez 3 dés jusqu'à obtenir un résultat : 4-5-6 (le meilleur), brelan, point (paire + le 3e dé), 1-2-3 (le pire).
  // Lignes : 0 perdu · 1 égalité · 2 gagné au point ×1.82 · 3 gagné avec un brelan ×2 · 4 gagné avec 4-5-6 ×2
  function ceeRank(d) { var s = d.slice().sort(), k = s.join(''); if (k === '456') return 20; if (k === '123') return 0; if (s[0] === s[2]) return 10 + s[0]; if (s[0] === s[1]) return s[2]; if (s[1] === s[2]) return s[0]; return -1; }
  function ceeRoll() { var tries = []; for (;;) { var d = [d6(), d6(), d6()]; tries.push(d); var rk = ceeRank(d); if (rk >= 0) return { tries: tries, rk: rk }; } }
  function ceeGame() { var p = ceeRoll(), b = ceeRoll(), cat = p.rk < b.rk ? 0 : p.rk === b.rk ? 1 : p.rk === 20 ? 4 : p.rk > 10 ? 3 : 2; return { p: p, b: b, cat: cat }; }
  function ceeName(rk, d) { var s = d.slice().sort(); return rk === 20 ? '4-5-6' : rk === 0 ? '1-2-3' : rk > 10 ? s[0] + '-' + s[0] + '-' + s[0] : '• ' + rk; }
  game({
    key: 'ceelo', l: verb('roll'), vb: '0 0 300 250', W: [5118, 1428, 3915, 591, 612],
    chips: [['<text y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#E2E8F0" font-family="Arial">=</text>', 1], [miniDice([2, 2, 5]), 1.82], [miniDice([3, 3, 3]), 2], [miniDice([4, 5, 6]), 2]],
    chipOf: function (i) { return i === 0 ? -1 : i - 1; },
    scene: felt('clF', '#334155', '#020617') + '<ellipse cx="150" cy="70" rx="130" ry="44" fill="#7F1D1D" opacity=".55"/><ellipse cx="150" cy="182" rx="130" ry="44" fill="#14532D" opacity=".7"/>' +
      [0, 1, 2].map(function (j) { return '<g id="clB' + j + '" transform="translate(' + (100 + j * 50) + ' 70)">' + die(j + 4, 1.3) + '</g><g id="clP' + j + '" transform="translate(' + (100 + j * 50) + ' 182)">' + die(j + 1, 1.3) + '</g>'; }).join('') +
      '<g id="clBt" transform="translate(150 118)" opacity="0"><rect x="-30" y="-10" width="60" height="20" rx="10" fill="#0B1220" stroke="#FCA5A5" stroke-opacity=".7"/><text y="5" text-anchor="middle" font-size="12" font-weight="900" fill="#FCA5A5" font-family="Arial,sans-serif"></text></g>' +
      '<g id="clPt" transform="translate(150 232)" opacity="0"><rect x="-30" y="-10" width="60" height="20" rx="10" fill="#0B1220" stroke="#FDE68A" stroke-opacity=".7"/><text y="5" text-anchor="middle" font-size="12" font-weight="900" fill="#FDE68A" font-family="Arial,sans-serif"></text></g>',
    init: function (c) { whoTags(c, 6, 60); },
    reset: function (c) { c.id('clBt').setAttribute('opacity', '0'); c.id('clPt').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var i = +r.view.i, g = find(ceeGame, function (x) { return x.cat === i; }) || ceeGame();
      var side = async function (seq, pre, y, pill) {
        for (var t = 0; t < seq.tries.length; t++) {
          var d = seq.tries[t]; c.sfx('roll');
          await Promise.all([0, 1, 2].map(function (j) { return rollDie(c, c.id(pre + j), 100 + j * 50, y, d[j], 1.3, 480 + j * 70); }));
          if (t < seq.tries.length - 1) await wait(c.box, 260);
        }
        var p = c.id(pill); p.querySelector('text').textContent = ceeName(seq.rk, seq.tries[seq.tries.length - 1]); p.setAttribute('opacity', '1');
        await wait(c.box, 350);
      };
      await side(g.p, 'clP', 182, 'clPt');
      await side(g.b, 'clB', 70, 'clBt');
      c.sfx('stop');
    },
    rules: {
      en: '1. Set your stake and tap “Roll”: you, then the dealer, roll 3 dice until a result comes.\n2. Best to worst: 4-5-6, three alike (6-6-6 high), a point (a pair + the 3rd die is the point), 1-2-3. No result = roll again.\n3. Higher than the dealer: ×1.82 · with three alike or 4-5-6: ×2 · same result: stake back.',
      fr: '1. Choisis ta mise et touche « Lancer » : toi, puis le croupier, lancez 3 dés jusqu’à obtenir un résultat.\n2. Du meilleur au pire : 4-5-6, brelan (6-6-6 le plus fort), un point (une paire + le 3e dé donne le point), 1-2-3. Aucun résultat = on relance.\n3. Plus fort que le croupier : ×1.82 · avec un brelan ou 4-5-6 : ×2 · même résultat : mise rendue.',
      es: '1. Elige tu apuesta y toca «Tirar»: tú y luego el crupier tiráis 3 dados hasta obtener un resultado.\n2. De mejor a peor: 4-5-6, trío (6-6-6 el más alto), un punto (una pareja + el 3.er dado es el punto), 1-2-3. Sin resultado = se vuelve a tirar.\n3. Más alto que el crupier: ×1.82 · con trío o 4-5-6: ×2 · mismo resultado: se devuelve la apuesta.',
      pt: '1. Escolha o valor e toque em «Rolar»: você e depois a banca lançam 3 dados até sair um resultado.\n2. Do melhor ao pior: 4-5-6, trinca (6-6-6 a mais alta), um ponto (um par + o 3.º dado é o ponto), 1-2-3. Sem resultado = lança de novo.\n3. Maior que a banca: ×1.82 · com trinca ou 4-5-6: ×2 · mesmo resultado: aposta devolvida.',
      ar: '1. اختر الرهان والمس «ارمِ»: ترمي أنت ثم الموزّع 3 أحجار نرد حتى ظهور نتيجة.\n2. من الأفضل إلى الأسوأ: 4-5-6، ثلاثة متشابهة (6-6-6 الأعلى)، نقطة (زوج + الحجر الثالث هو النقطة)، 1-2-3. بلا نتيجة = إعادة الرمي.\n3. أعلى من الموزّع: ×1.82 · بثلاثة متشابهة أو 4-5-6: ×2 · النتيجة نفسها: يُعاد الرهان.',
      tr: '1. Bahsini seç ve “At”a dokun: önce sen, sonra krupiye bir sonuç gelene kadar 3 zar atar.\n2. İyiden kötüye: 4-5-6, üçlü (6-6-6 en yüksek), puan (bir çift + 3. zar puandır), 1-2-3. Sonuç yoksa yeniden atılır.\n3. Krupiyeden yüksek: ×1.82 · üçlü veya 4-5-6 ile: ×2 · aynı sonuç: bahis iade.',
      vi: '1. Chọn mức cược và chạm «Gieo»: bạn rồi đến nhà cái gieo 3 xúc xắc cho đến khi có kết quả.\n2. Từ cao đến thấp: 4-5-6, bộ ba (6-6-6 cao nhất), điểm (một đôi + viên thứ 3 là điểm), 1-2-3. Chưa có kết quả = gieo lại.\n3. Cao hơn nhà cái: ×1.82 · bằng bộ ba hoặc 4-5-6: ×2 · cùng kết quả: hoàn cược.',
      id: '1. Atur taruhan lalu sentuh «Lempar»: kamu lalu bandar melempar 3 dadu sampai ada hasil.\n2. Dari terbaik ke terburuk: 4-5-6, tiga sama (6-6-6 tertinggi), poin (sepasang + dadu ke-3 adalah poin), 1-2-3. Tanpa hasil = lempar lagi.\n3. Lebih tinggi dari bandar: ×1.82 · dengan tiga sama atau 4-5-6: ×2 · hasil sama: taruhan kembali.',
      ru: '1. Выберите ставку и нажмите «Бросить»: вы, а затем дилер бросаете 3 кубика, пока не выпадет результат.\n2. От лучшего к худшему: 4-5-6, три одинаковых (6-6-6 старше), очко (пара + третий кубик — это очко), 1-2-3. Нет результата — перебросить.\n3. Выше дилера: ×1.82 · с тремя одинаковыми или 4-5-6: ×2 · одинаково: ставка возвращается.',
      de: '1. Wähle deinen Einsatz und tippe auf „Würfeln“: du, dann der Croupier, würfelt mit 3 Würfeln, bis ein Ergebnis kommt.\n2. Vom besten zum schlechtesten: 4-5-6, Drilling (6-6-6 am höchsten), ein Punkt (ein Paar + der 3. Würfel ist der Punkt), 1-2-3. Kein Ergebnis = nochmal.\n3. Höher als der Croupier: ×1.82 · mit Drilling oder 4-5-6: ×2 · gleiches Ergebnis: Einsatz zurück.',
      hi: '1. राशि चुनें और «फेंकें» छुएं: पहले आप, फिर डीलर, नतीजा आने तक 3 पासे फेंकते हैं।\n2. सबसे अच्छे से खराब: 4-5-6, तीन एक जैसे (6-6-6 सबसे ऊंचा), पॉइंट (एक जोड़ी + तीसरा पासा पॉइंट है), 1-2-3। नतीजा नहीं = फिर से फेंकें।\n3. डीलर से ऊंचा: ×1.82 · तीन एक जैसे या 4-5-6 से: ×2 · एक जैसा नतीजा: दांव वापस।',
      zh: '1. 设定金额并点击“掷骰”：你先、庄家后，各掷 3 颗骰子直到出现结果。\n2. 由大到小：4-5-6、豹子（6-6-6 最大）、点数（一对 + 第三颗即点数）、1-2-3。没有结果 = 重掷。\n3. 比庄家大：×1.82 · 以豹子或 4-5-6 获胜：×2 · 结果相同：退还下注。'
    }
  });

  /* =============================== SHIP, CAPTAIN & CREW =============================== */
  // 5 dés, 3 lancers : il faut le 6 (bateau), puis le 5 (capitaine), puis le 4 (équipage) ; les 2 autres dés = la cargaison (relancée si < 8).
  // Lignes : 0 pas d'équipage · 1…11 cargaison 2…12 (2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5)
  function shipCrew() {
    var have = [false, false, false], free = 5, rolls = [], cargo = null;
    for (var k = 0; k < 3; k++) {
      var d;
      if (have[2]) { d = [d6(), d6()]; rolls.push({ d: d, cargo: true }); cargo = d; if (d[0] + d[1] >= 8 || k === 2) break; continue; }
      d = []; for (var i = 0; i < free; i++) d.push(d6());
      var take = [];
      [6, 5, 4].forEach(function (f, j) { if (!have[j] && (j === 0 || have[j - 1])) { var ix = -1; for (var q = 0; q < d.length; q++) if (d[q] === f && take.indexOf(q) < 0) { ix = q; break; } if (ix >= 0) { take.push(ix); have[j] = true; } } });
      rolls.push({ d: d, take: take });
      free = 5 - have.filter(Boolean).length;
      if (have[2]) { cargo = d.filter(function (_, q) { return take.indexOf(q) < 0; }); if (cargo[0] + cargo[1] >= 8) break; }
    }
    return { rolls: rolls, s: have[2] ? cargo[0] + cargo[1] : 0 };
  }
  var SC_SLOT = [[66, 74], [126, 74], [186, 74]], SC_X = function (j) { return 50 + j * 50; };
  var SC_ICO = ['<path d="M-12 2h24l-5 8H-7z" fill="#92400E"/><path d="M0-12v14" stroke="#78350F" stroke-width="2"/><path d="M1-11l9 9H1z" fill="#F8FAFC"/>', '<path d="M-9-2h18l-2-6H-7z" fill="#1E3A8A"/><rect x="-11" y="-3" width="22" height="3" rx="1.5" fill="#111827"/><circle cy="4" r="5" fill="#FCD9C0"/><path d="M-2-7h4" stroke="#FDE68A" stroke-width="2"/>', '<circle cx="-5" cy="-2" r="4" fill="#FCD9C0"/><circle cx="5" cy="-2" r="4" fill="#FCD9C0"/><path d="M-10 9q5-8 10 0M0 9q5-8 10 0" fill="#2563EB"/><path d="M-9-5h8M1-5h8" stroke="#EF4444" stroke-width="2"/>'];
  game({
    key: 'shipcrew', l: verb('roll'), vb: '0 0 300 250', W: [459, 12, 25, 37, 42, 51, 62, 113, 82, 54, 40, 23],
    chips: [['<text y="4" text-anchor="middle" font-size="9" font-weight="900" fill="#BAE6FD" font-family="Arial">2–7</text>', 0.6], ['<text y="4" text-anchor="middle" font-size="9" font-weight="900" fill="#BAE6FD" font-family="Arial">8–9</text>', 1.9], ['<text y="4" text-anchor="middle" font-size="8.5" font-weight="900" fill="#BAE6FD" font-family="Arial">10–11</text>', 3], ['<text y="4" text-anchor="middle" font-size="10" font-weight="900" fill="#FDE68A" font-family="Arial">12</text>', 6.5]],
    chipOf: function (i) { var s = i + 1; return i <= 0 ? -1 : s <= 7 ? 0 : s <= 9 ? 1 : s <= 11 ? 2 : 3; },
    scene: bg('#0C4A6E', '#082F49') + '<path d="M-400 128Q150 112 700 128V700H-400z" fill="#0369A1" opacity=".55"/>' +
      SC_SLOT.map(function (p, j) { return '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><rect x="-24" y="-24" width="48" height="48" rx="10" fill="#0B1220" opacity=".55" stroke="#7DD3FC" stroke-opacity=".4" stroke-dasharray="4 3"/><g transform="translate(0 -38) scale(.9)">' + SC_ICO[j] + '</g>' + txt(0, 34, 6 - j, 10, '#7DD3FC', ' opacity=".7"') + '</g>'; }).join('') +
      '<g transform="translate(246 74)"><rect x="-34" y="-24" width="68" height="48" rx="10" fill="#78350F" opacity=".6" stroke="#FDE68A" stroke-opacity=".5"/><g id="scCargo" opacity="0"><rect x="-18" y="28" width="36" height="20" rx="10" fill="#0B1220" stroke="#FDE68A"/><text id="scSum" y="43" text-anchor="middle" font-size="13" font-weight="900" fill="#FDE68A" font-family="Arial,sans-serif"></text></g></g>' +
      [0, 1, 2, 3, 4].map(function (j) { return '<g id="scD' + j + '" transform="translate(' + SC_X(j) + ' 190)">' + die(j + 1, 1.25) + '</g>'; }).join(''),
    reset: function (c) { for (var j = 0; j < 5; j++) { var g = c.id('scD' + j); tr(g, SC_X(j), 190); g.style.opacity = ''; g.removeAttribute('class'); } c.id('scCargo').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var i = +r.view.i, want = i ? i + 1 : 0, g = find(shipCrew, function (x) { return x.s === want; }) || shipCrew();
      var free = [0, 1, 2, 3, 4], kept = 0, cargoEls = [];
      for (var k = 0; k < g.rolls.length; k++) {
        var rl = g.rolls[k]; c.sfx('roll');
        if (rl.cargo) {
          await Promise.all(cargoEls.map(function (el, q) { return rollDie(c, el, 228 + q * 36, 74, rl.d[q], 0.9); }));
        } else {
          var els = free.map(function (j) { return c.id('scD' + j); });
          await Promise.all(els.map(function (el, q) { return rollDie(c, el, SC_X(free[q]), 190, rl.d[q], 1.25, 480 + q * 60); }));
          await wait(c.box, 250);
          var order = rl.take.slice().sort(function (a, b) { return rl.d[b] - rl.d[a]; });
          for (var t = 0; t < order.length; t++) {
            var el = els[order[t]], from = SC_X(free[order[t]]), to = SC_SLOT[kept]; kept++;
            await tw(c.box, 300, function (q) { var e = ease(q); tr(el, lerp(from, to[0], e), lerp(190, to[1], e), 1.25 + 0.15 * e); });
            el.setAttribute('class', 'cb-glow'); c.sfx('step', { k: kept });
          }
          free = free.filter(function (_, q) { return rl.take.indexOf(q) < 0; });
          if (kept === 3) {
            cargoEls = free.map(function (j) { return c.id('scD' + j); });
            await Promise.all(cargoEls.map(function (el, q) { var fx = SC_X(free[q]); return tw(c.box, 320, function (z) { var e = ease(z); tr(el, lerp(fx, 228 + q * 36, e), lerp(190, 74, e), lerp(1.25, 0.9, e)); }); }));
            var cg = rl.d.filter(function (_, q) { return rl.take.indexOf(q) < 0; });
            c.id('scSum').textContent = String(cg[0] + cg[1]); c.id('scCargo').setAttribute('opacity', '1');
          }
        }
        if (rl.cargo) { c.id('scSum').textContent = String(rl.d[0] + rl.d[1]); }
        await wait(c.box, 300);
      }
      if (kept < 3) free.forEach(function (j) { c.id('scD' + j).style.opacity = '.45'; });
      c.sfx('stop');
    },
    rules: {
      en: '1. Set your stake and tap “Roll”: 5 dice, up to 3 rolls.\n2. You need the 6 (ship), then the 5 (captain), then the 4 (crew), in that order. The 2 dice left are your cargo; if it is under 8 and a roll is left, it is rolled again.\n3. Cargo 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. No full crew after 3 rolls: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : 5 dés, jusqu’à 3 lancers.\n2. Il faut le 6 (bateau), puis le 5 (capitaine), puis le 4 (équipage), dans cet ordre. Les 2 dés restants sont ta cargaison ; si elle fait moins de 8 et qu’il reste un lancer, elle est relancée.\n3. Cargaison 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. Pas d’équipage complet après 3 lancers : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Tirar»: 5 dados, hasta 3 tiradas.\n2. Necesitas el 6 (barco), luego el 5 (capitán) y luego el 4 (tripulación), en ese orden. Los 2 dados restantes son tu carga; si suma menos de 8 y queda una tirada, se relanza.\n3. Carga 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. Sin tripulación completa tras 3 tiradas: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Rolar»: 5 dados, até 3 lançamentos.\n2. É preciso o 6 (navio), depois o 5 (capitão), depois o 4 (tripulação), nessa ordem. Os 2 dados restantes são a carga; se for menor que 8 e sobrar um lançamento, é relançada.\n3. Carga 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. Sem tripulação completa após 3 lançamentos: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «ارمِ»: 5 أحجار نرد، حتى 3 رميات.\n2. تحتاج إلى 6 (السفينة) ثم 5 (القبطان) ثم 4 (الطاقم) بهذا الترتيب. الحجران الباقيان هما الحمولة؛ إن كانت أقل من 8 وبقيت رمية يُعاد رميهما.\n3. الحمولة 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. بلا طاقم كامل بعد 3 رميات: تخسر الرهان.',
      tr: '1. Bahsini seç ve “At”a dokun: 5 zar, en fazla 3 atış.\n2. Sırasıyla 6 (gemi), 5 (kaptan) ve 4 (tayfa) gerekir. Kalan 2 zar yüktür; 8’den azsa ve atış kaldıysa yeniden atılır.\n3. Yük 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. 3 atışta tayfa tamamlanmazsa bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Gieo»: 5 xúc xắc, tối đa 3 lần gieo.\n2. Cần có 6 (tàu), rồi 5 (thuyền trưởng), rồi 4 (thủy thủ), đúng thứ tự. 2 viên còn lại là hàng hóa; nếu dưới 8 và còn lượt, sẽ gieo lại.\n3. Hàng 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. Sau 3 lần chưa đủ thủy thủ: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lempar»: 5 dadu, sampai 3 lemparan.\n2. Kamu butuh 6 (kapal), lalu 5 (kapten), lalu 4 (awak), berurutan. 2 dadu sisanya adalah muatan; jika kurang dari 8 dan masih ada lemparan, dilempar lagi.\n3. Muatan 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. Awak belum lengkap setelah 3 lemparan: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бросить»: 5 кубиков, до 3 бросков.\n2. Нужны 6 (корабль), затем 5 (капитан), затем 4 (команда) — именно в этом порядке. 2 оставшихся кубика — груз; если меньше 8 и бросок остался, он перебрасывается.\n3. Груз 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. Нет полной команды после 3 бросков — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Würfeln“: 5 Würfel, bis zu 3 Würfe.\n2. Du brauchst die 6 (Schiff), dann die 5 (Kapitän), dann die 4 (Mannschaft), in dieser Reihenfolge. Die 2 übrigen Würfel sind die Ladung; unter 8 wird sie neu geworfen, wenn noch ein Wurf übrig ist.\n3. Ladung 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. Keine volle Mannschaft nach 3 Würfen: Einsatz verloren.',
      hi: '1. राशि चुनें और «फेंकें» छुएं: 5 पासे, 3 बार तक।\n2. क्रम से 6 (जहाज़), फिर 5 (कप्तान), फिर 4 (दल) चाहिए। बचे 2 पासे आपका माल हैं; 8 से कम हो और बारी बची हो तो फिर फेंके जाते हैं।\n3. माल 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5। 3 बार में पूरा दल नहीं: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“掷骰”：5 颗骰子，最多掷 3 次。\n2. 依次需要 6（船）、5（船长）、4（船员）。剩下的 2 颗骰子是货物；若小于 8 且还有掷骰机会，则重掷。\n3. 货物 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5。3 次内未凑齐船员：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
