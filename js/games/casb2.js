/* casb2 — Ace Race, 30 & 40 (Trente et Quarante), Clock Patience (owner request, round 6) — instant games; the scene always shows exactly the line (or option) the server drew (casino_ext/casb.php). */
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
  function deck() { var d = []; for (var s = 0; s < 4; s++) for (var r = 1; r <= 13; r++) d.push([r, s]); return shuffle(d); }
  function find(gen, ok, n) { for (var t = 0; t < (n || 30000); t++) { var x = gen(); if (ok(x)) return x; } return null; }
  function suitIco(s) { return '<svg viewBox="-9 -9 18 18" aria-hidden="true">' + suit(s, 0, 0, 1.15) + '</svg>'; }

  /* =============================== ACE RACE (choix) =============================== */
  // les 4 as sur la ligne de départ ; on retourne le paquet (48 cartes), chaque carte fait avancer l'as de sa couleur ; le premier à 6 gagne
  var AR_LEN = 6, AR_Y = [64, 106, 148, 190], AR_X = function (p) { return 40 + p * 36; };
  function aceRace() { var d = deck().filter(function (cc) { return cc[0] !== 1; }), pos = [0, 0, 0, 0], flips = []; for (var j = 0; j < d.length; j++) { flips.push(d[j]); if (++pos[d[j][1]] >= AR_LEN) return { w: d[j][1], flips: flips }; } return null; }
  game({
    key: 'acerace', l: verb('race'), vb: '0 0 300 250', n: 4,
    scene: felt('arF', '#14532D', '#052E16') + AR_Y.map(function (y) { return '<rect x="16" y="' + (y - 19) + '" width="268" height="38" rx="8" fill="#000" opacity=".18"/>'; }).join('') +
      [1, 2, 3, 4, 5].map(function (p) { return '<path d="M' + (AR_X(p) - 18) + ' 44V210" stroke="#FDE68A" stroke-opacity=".18" stroke-dasharray="3 5"/>'; }).join('') +
      '<g transform="translate(' + (AR_X(AR_LEN) - 18) + ' 0)"><path d="M0 42V212" stroke="#fff" stroke-width="5" stroke-dasharray="5 5"/><path d="M0 42V212" stroke="#111" stroke-width="5" stroke-dasharray="5 5" stroke-dashoffset="5"/></g>' +
      '<g id="arAces">' + [0, 1, 2, 3].map(function (s) { return '<g id="arA' + s + '" transform="translate(' + AR_X(0) + ' ' + AR_Y[s] + ') scale(.78)">' + card([1, s]) + '</g>'; }).join('') + '</g>' +
      '<g transform="translate(150 22)"><g id="arDeck" transform="translate(-24 0) scale(.72)">' + card(null) + '</g><g id="arFlip" transform="translate(24 0) scale(.72)" opacity="0"></g></g>',
    opts: function () { return '<div class="cg-opts ar-opts">' + [0, 1, 2, 3].map(function (s) { return optBtn(s, suitIco(s), pm(0.25)); }).join('') + '</div>'; },
    onPick: function (c, j) { [0, 1, 2, 3].forEach(function (s) { c.id('arA' + s).classList.toggle('cb-glow', s === j); }); },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { [0, 1, 2, 3].forEach(function (s) { tr(c.id('arA' + s), AR_X(0), AR_Y[s], 0.78); }); c.id('arFlip').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var w = +r.view.w, race = find(aceRace, function (x) { return x && x.w === w; }) || aceRace(), pos = [0, 0, 0, 0], fl = c.id('arFlip');
      for (var j = 0; j < race.flips.length; j++) {
        var cc = race.flips[j], s = cc[1], a = c.id('arA' + s), from = pos[s]; pos[s]++;
        fl.innerHTML = card(cc); fl.setAttribute('opacity', '1'); c.sfx('card');
        await tw(c.box, 110, function (k) { fl.setAttribute('transform', 'translate(24 0) scale(' + (0.72 * Math.abs(1 - 2 * (1 - k) * 0.5)).toFixed(3) + ' .72)'); });
        await tw(c.box, 190, function (k) { var e = ease(k); tr(a, lerp(AR_X(from), AR_X(pos[s]), e), AR_Y[s] - Math.sin(k * Math.PI) * 6, 0.78); });
      }
      c.sfx('stop');
      var win = c.id('arA' + w);
      await tw(c.box, 420, function (k) { tr(win, AR_X(AR_LEN), AR_Y[w], 0.78 + Math.sin(k * Math.PI) * 0.18); });
    },
    rules: {
      en: '1. Pick the suit of your ace (♠ ♥ ♦ ♣), set your stake and tap “Race”.\n2. The deck is turned card by card: each card moves the ace of its suit one step.\n3. Your ace crosses the line (6 steps) first: ×3.76. Another ace first: the stake is lost.',
      fr: '1. Choisis la couleur de ton as (♠ ♥ ♦ ♣), ta mise, puis touche « Course ».\n2. Le paquet est retourné carte par carte : chaque carte fait avancer d’une case l’as de sa couleur.\n3. Ton as passe la ligne (6 cases) le premier : ×3.76. Un autre as d’abord : la mise est perdue.',
      es: '1. Elige el palo de tu as (♠ ♥ ♦ ♣), tu apuesta y toca «Correr».\n2. Se da la vuelta al mazo carta a carta: cada carta adelanta una casilla al as de su palo.\n3. Tu as cruza la meta (6 casillas) primero: ×3.76. Otro as antes: pierdes la apuesta.',
      pt: '1. Escolha o naipe do seu ás (♠ ♥ ♦ ♣), o valor e toque em «Correr».\n2. O baralho é virado carta a carta: cada carta avança uma casa o ás do seu naipe.\n3. Seu ás cruza a linha (6 casas) primeiro: ×3.76. Outro ás antes: a aposta é perdida.',
      ar: '1. اختر نوع الآس الخاص بك (♠ ♥ ♦ ♣) والرهان ثم المس «سباق».\n2. تُقلب الأوراق واحدة تلو الأخرى: كل ورقة تُقدّم آس نوعها خطوة.\n3. إذا عبر آسك خط النهاية (6 خطوات) أولًا: ×3.76. إذا سبقه آس آخر: تخسر الرهان.',
      tr: '1. Asının türünü seç (♠ ♥ ♦ ♣), bahsini belirle ve “Koş”a dokun.\n2. Deste tek tek açılır: her kart kendi türündeki ası bir adım ilerletir.\n3. Asın çizgiyi (6 adım) ilk geçerse: ×3.76. Başka bir as önce geçerse bahis kaybedilir.',
      vi: '1. Chọn chất của quân Át (♠ ♥ ♦ ♣), mức cược rồi chạm «Đua».\n2. Bộ bài được lật từng lá: mỗi lá đẩy quân Át cùng chất tiến một bước.\n3. Át của bạn về đích (6 bước) trước: ×3.76. Át khác về trước: mất tiền cược.',
      id: '1. Pilih jenis As-mu (♠ ♥ ♦ ♣), atur taruhan lalu sentuh «Balap».\n2. Dek dibuka satu per satu: tiap kartu memajukan As sejenisnya satu langkah.\n3. As-mu melewati garis (6 langkah) lebih dulu: ×3.76. As lain lebih dulu: taruhan hilang.',
      ru: '1. Выберите масть своего туза (♠ ♥ ♦ ♣), ставку и нажмите «Старт».\n2. Колоду открывают по одной карте: каждая карта двигает туза своей масти на шаг.\n3. Ваш туз первым пересёк финиш (6 шагов): ×3.76. Другой туз первым — ставка проиграна.',
      de: '1. Wähle die Farbe deines Asses (♠ ♥ ♦ ♣), deinen Einsatz und tippe auf „Start“.\n2. Das Deck wird Karte für Karte aufgedeckt: jede Karte bringt das Ass ihrer Farbe ein Feld weiter.\n3. Dein Ass ist zuerst im Ziel (6 Felder): ×3.76. Ein anderes Ass zuerst: Einsatz verloren.',
      hi: '1. अपने इक्के का रंग चुनें (♠ ♥ ♦ ♣), राशि चुनें और «दौड़» छुएं।\n2. गड्डी एक-एक पत्ता खोली जाती है: हर पत्ता अपने रंग के इक्के को एक कदम आगे बढ़ाता है।\n3. आपका इक्का पहले रेखा पार करे (6 कदम): ×3.76। कोई और इक्का पहले: दांव हार जाते हैं।',
      zh: '1. 选择你的 A 的花色（♠ ♥ ♦ ♣），设定金额并点击“开跑”。\n2. 牌堆一张张翻开：每张牌让同花色的 A 前进一步。\n3. 你的 A 先冲过终点（6 步）：×3.76。其他 A 先到：输掉下注。'
    }
  });

  /* =============================== TRENTE ET QUARANTE (choix) =============================== */
  // rangée Noir puis rangée Rouge, chacune jusqu'à dépasser 30 (As = 1, figures = 10) ; le total le plus bas gagne ; égalité = la banque gagne (option 2, non proposée)
  var TQ = {
    en: { noir: 'Black', rouge: 'Red' }, fr: { noir: 'Noir', rouge: 'Rouge' }, es: { noir: 'Negro', rouge: 'Rojo' }, pt: { noir: 'Preto', rouge: 'Vermelho' }, ar: { noir: 'أسود', rouge: 'أحمر' },
    tr: { noir: 'Siyah', rouge: 'Kırmızı' }, vi: { noir: 'Đen', rouge: 'Đỏ' }, id: { noir: 'Hitam', rouge: 'Merah' }, ru: { noir: 'Чёрное', rouge: 'Красное' }, de: { noir: 'Schwarz', rouge: 'Rot' }, hi: { noir: 'काला', rouge: 'लाल' }, zh: { noir: '黑', rouge: '红' }
  };
  function tqRow() { var r = [], t = 0; while (t < 31) { var cc = [1 + rnd(13), rnd(4)]; r.push(cc); t += cc[0] > 10 ? 10 : cc[0]; } return [r, t]; }
  function trente() { var n = tqRow(), ro = tqRow(); return { n: n, ro: ro, w: n[1] < ro[1] ? 0 : ro[1] < n[1] ? 1 : 2 }; }
  function tqPill(id, y, col) { return '<g id="' + id + '" transform="translate(270 ' + y + ')" opacity="0"><circle r="17" fill="' + col + '" stroke="#FDE68A" stroke-width="1.5"/><text y="5.5" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" font-family="Arial,sans-serif"></text></g>'; }
  game({
    key: 'trente', l: verb('deal', TQ), vb: '0 0 300 250', n: 3, W: [44.5, 44.5, 11],
    scene: felt('tqF', '#166534', '#022C22') + '<rect x="8" y="34" width="284" height="80" rx="14" fill="#0F172A" opacity=".55"/><rect x="8" y="136" width="284" height="80" rx="14" fill="#7F1D1D" opacity=".55"/>' +
      '<g id="tqN"></g><g id="tqR"></g>' + tqPill('tqNt', 74, '#1E293B') + tqPill('tqRt', 176, '#B91C1C') + txt(150, 128, '31 … 40', 9, '#FDE68A', ' opacity=".6" letter-spacing="3"'),
    opts: function (l) { return '<div class="cg-opts tq-opts">' + optBtn(0, '<b class="fit">' + K.esc(l.noir) + '</b>', pm(0.445)) + optBtn(1, '<b class="fit">' + K.esc(l.rouge) + '</b>', pm(0.445), 'tq-red') + '</div>'; },
    init: function (c) { c.sel = 0; },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.id('tqN').innerHTML = ''; c.id('tqR').innerHTML = ''; c.id('tqNt').setAttribute('opacity', '0'); c.id('tqRt').setAttribute('opacity', '0'); c.qa('#tqNt,#tqRt').forEach(function (g) { g.classList.remove('cb-win'); }); },
    play: async function (c, r) {
      var w = +r.view.w, g = find(trente, function (x) { return x.w === w; }) || trente();
      var rows = [[g.n, 'tqN', 'tqNt', 74], [g.ro, 'tqR', 'tqRt', 176]];
      for (var q = 0; q < 2; q++) {
        var row = rows[q][0][0], L = c.id(rows[q][1]), n = row.length, gap = Math.min(30, 200 / Math.max(1, n - 1)), t = 0, pl = c.id(rows[q][2]);
        for (var j = 0; j < n; j++) {
          await dealTo(c, L, row[j], 30 + j * gap, rows[q][3], 0.85, [150, -30]);
          t += row[j][0] > 10 ? 10 : row[j][0]; pl.setAttribute('opacity', '1'); pl.querySelector('text').textContent = String(t);
        }
        await wait(c.box, 200);
      }
      if (w < 2) c.id(w ? 'tqRt' : 'tqNt').classList.add('cb-win');
      c.sfx('stop');
    },
    rules: {
      en: '1. Pick Black or Red, set your stake and tap “Deal”.\n2. Cards are dealt to the Black row until it passes 30, then to the Red row the same way (Ace = 1, J Q K = 10).\n3. The row with the LOWER total (closest to 31) wins: ×2.11. Equal totals: the bank wins.',
      fr: '1. Choisis Noir ou Rouge, ta mise, puis touche « Distribuer ».\n2. Les cartes vont sur la rangée Noir jusqu’à dépasser 30, puis sur la rangée Rouge de la même façon (As = 1, V D R = 10).\n3. La rangée au total le PLUS BAS (le plus près de 31) gagne : ×2.11. Totaux égaux : la banque gagne.',
      es: '1. Elige Negro o Rojo, tu apuesta y toca «Repartir».\n2. Se reparten cartas a la fila Negra hasta pasar de 30, y luego a la Roja igual (As = 1, J Q K = 10).\n3. Gana la fila con el total MÁS BAJO (más cerca de 31): ×2.11. Totales iguales: gana la banca.',
      pt: '1. Escolha Preto ou Vermelho, o valor e toque em «Distribuir».\n2. As cartas vão para a fileira Preta até passar de 30, depois para a Vermelha do mesmo jeito (Ás = 1, J Q K = 10).\n3. Vence a fileira com o total MAIS BAIXO (mais perto de 31): ×2.11. Totais iguais: a banca vence.',
      ar: '1. اختر الأسود أو الأحمر والرهان ثم المس «وزّع».\n2. توزَّع الأوراق على صف الأسود حتى يتجاوز 30، ثم على صف الأحمر بالطريقة نفسها (الآس = 1، الصور = 10).\n3. يفوز الصف ذو المجموع الأقل (الأقرب إلى 31): ×2.11. تساوي المجموعين: يفوز البنك.',
      tr: '1. Siyah veya Kırmızı seç, bahsini belirle ve “Dağıt”a dokun.\n2. Kartlar 30’u geçene kadar Siyah sıraya, sonra aynı şekilde Kırmızı sıraya dağıtılır (As = 1, J Q K = 10).\n3. Toplamı DAHA DÜŞÜK (31’e en yakın) sıra kazanır: ×2.11. Toplamlar eşitse banka kazanır.',
      vi: '1. Chọn Đen hoặc Đỏ, mức cược rồi chạm «Chia bài».\n2. Bài được chia vào hàng Đen đến khi vượt 30, rồi hàng Đỏ cũng vậy (Át = 1, J Q K = 10).\n3. Hàng có tổng THẤP HƠN (gần 31 nhất) thắng: ×2.11. Tổng bằng nhau: nhà cái thắng.',
      id: '1. Pilih Hitam atau Merah, atur taruhan lalu sentuh «Bagikan».\n2. Kartu dibagikan ke baris Hitam sampai lewat 30, lalu ke baris Merah dengan cara yang sama (As = 1, J Q K = 10).\n3. Baris dengan total LEBIH RENDAH (paling dekat 31) menang: ×2.11. Total sama: bandar menang.',
      ru: '1. Выберите «Чёрное» или «Красное», ставку и нажмите «Раздать».\n2. Карты кладут в чёрный ряд, пока сумма не превысит 30, затем так же в красный (туз = 1, В Д К = 10).\n3. Побеждает ряд с МЕНЬШЕЙ суммой (ближе к 31): ×2.11. Суммы равны — выигрывает банк.',
      de: '1. Wähle Schwarz oder Rot, deinen Einsatz und tippe auf „Geben“.\n2. Karten gehen in die schwarze Reihe, bis sie über 30 liegt, dann genauso in die rote (Ass = 1, B D K = 10).\n3. Die Reihe mit der NIEDRIGEREN Summe (am nächsten an 31) gewinnt: ×2.11. Gleiche Summen: die Bank gewinnt.',
      hi: '1. काला या लाल चुनें, राशि चुनें और «बांटें» छुएं।\n2. पत्ते काली पंक्ति में 30 पार होने तक, फिर उसी तरह लाल पंक्ति में बांटे जाते हैं (इक्का = 1, तस्वीर = 10)।\n3. कम जोड़ वाली (31 के सबसे पास) पंक्ति जीतती है: ×2.11। जोड़ बराबर: बैंक जीतता है।',
      zh: '1. 选择黑或红，设定金额并点击“发牌”。\n2. 黑行发牌直到总点数超过 30，红行同样（A = 1，J Q K = 10）。\n3. 总点数较低（最接近 31）的一行获胜：×2.11。点数相同：庄家赢。'
    }
  });

  /* =============================== CLOCK PATIENCE =============================== */
  // 13 tas de 4 cartes (As…Dame autour du cadran, Rois au centre). On retourne la carte du dessus du tas central, on la range sous le tas
  // de sa valeur, et on continue avec ce tas… Fin au 4e Roi. Lignes (cartes retournées) : 1–29 · 30–39 · 40–47 ×0.6 · 48–51 ×1.6 · 52 ×3.9
  var CK_XY = function (p) { if (p === 12) return [150, 128]; var a = (p + 1) * Math.PI / 6; return [150 + Math.sin(a) * 92, 128 - Math.cos(a) * 92]; };
  function clockDeal() {
    var d = deck(), piles = []; for (var i = 0; i < 13; i++) piles.push(d.slice(i * 4, i * 4 + 4));
    var moves = [], cur = 12, kings = 0, n = 0;
    for (;;) { var cc = piles[cur].pop(); n++; moves.push([cur, cc]); if (cc[0] === 13 && ++kings === 4) break; cur = cc[0] - 1; }
    return { n: n, moves: moves };
  }
  var CK_BAND = [[1, 29], [30, 39], [40, 47], [48, 51], [52, 52]];
  game({
    key: 'clocksol', l: verb('play'), vb: '0 0 300 250', W: [88, 216, 354, 265, 77],
    chips: [['<text y="4" text-anchor="middle" font-size="9.5" font-weight="900" fill="#E9D5FF" font-family="Arial">40+</text>', 0.6], ['<text y="4" text-anchor="middle" font-size="9.5" font-weight="900" fill="#E9D5FF" font-family="Arial">48+</text>', 1.6], ['<text y="4" text-anchor="middle" font-size="10" font-weight="900" fill="#FDE68A" font-family="Arial">52</text>', 3.9]],
    chipOf: function (i) { return i - 2; },
    scene: felt('ckF', '#4C1D95', '#1E1B4B') + '<circle cx="150" cy="128" r="112" fill="none" stroke="#C4B5FD" stroke-opacity=".25" stroke-width="2"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (p) { var q = CK_XY(p); return '<g id="ckP' + p + '" transform="translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ') scale(.62)">' + card(null) + '</g>'; }).join('') +
      '<g id="ckFly" opacity="0"></g><g transform="translate(150 182)"><rect x="-26" y="-11" width="52" height="22" rx="11" fill="#0B0820" stroke="#C4B5FD" stroke-opacity=".6"/><text id="ckN" y="5" text-anchor="middle" font-size="12" font-weight="900" fill="#FDE68A" font-family="Arial,sans-serif">0/52</text></g>',
    reset: function (c) { for (var p = 0; p < 13; p++) { var g = c.id('ckP' + p); g.innerHTML = card(null); g.removeAttribute('class'); } c.id('ckN').textContent = '0/52'; c.id('ckFly').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var b = CK_BAND[+r.view.i] || CK_BAND[0], g = find(clockDeal, function (x) { return x.n >= b[0] && x.n <= b[1]; }) || clockDeal();
      var fly = c.id('ckFly'), per = g.n > 40 ? 95 : 120, kings = 0;
      for (var j = 0; j < g.moves.length; j++) {
        var mv = g.moves[j], from = CK_XY(mv[0]), cc = mv[1], to = CK_XY(cc[0] - 1);
        fly.innerHTML = card(cc); fly.setAttribute('opacity', '1'); if (j % 2 === 0) c.sfx('card');
        await tw(c.box, per, function (k) { var e = ease(k); tr(fly, lerp(from[0], to[0], e), lerp(from[1], to[1], e) - Math.sin(k * Math.PI) * 14, 0.62 + Math.sin(k * Math.PI) * 0.15); });
        var dest = c.id('ckP' + (cc[0] - 1)); dest.innerHTML = card(cc); if (cc[0] === 13) { kings++; dest.setAttribute('class', 'ck-k' + kings); }
        c.id('ckN').textContent = (j + 1) + '/52';
      }
      fly.setAttribute('opacity', '0'); c.sfx('stop');
    },
    rules: {
      en: '1. Set your stake and tap “Play”: the 52 cards are dealt in 13 piles like a clock (Kings in the middle).\n2. The game plays itself: turn the top card of a pile, put it on the pile of its hour (Ace = 1 … Queen = 12), go on from there. It ends at the 4th King.\n3. Cards turned: 40+ ×0.6 · 48+ ×1.6 · all 52 (solitaire solved) ×3.9. Fewer than 40: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Jouer » : les 52 cartes sont posées en 13 tas comme une horloge (les Rois au centre).\n2. La partie se joue seule : on retourne la carte du dessus d’un tas, on la pose sur le tas de son heure (As = 1 … Dame = 12) et on continue de là. Fin au 4e Roi.\n3. Cartes retournées : 40+ ×0.6 · 48+ ×1.6 · les 52 (réussite) ×3.9. Moins de 40 : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Jugar»: las 52 cartas se reparten en 13 montones como un reloj (los Reyes en el centro).\n2. La partida se juega sola: se gira la carta de arriba de un montón, se pone en el montón de su hora (As = 1 … Reina = 12) y se sigue desde ahí. Termina con el 4.º Rey.\n3. Cartas giradas: 40+ ×0.6 · 48+ ×1.6 · las 52 (solitario resuelto) ×3.9. Menos de 40: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Jogar»: as 52 cartas formam 13 montes como um relógio (os Reis no centro).\n2. A partida joga sozinha: vira-se a carta de cima de um monte, coloca-se no monte da sua hora (Ás = 1 … Dama = 12) e continua-se dali. Termina no 4.º Rei.\n3. Cartas viradas: 40+ ×0.6 · 48+ ×1.6 · todas as 52 (paciência resolvida) ×3.9. Menos de 40: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «العب»: توزَّع 52 ورقة في 13 كومة مثل الساعة (الملوك في الوسط).\n2. تُلعب الجولة تلقائيًا: تُقلب الورقة العليا من كومة وتوضع على كومة ساعتها (الآس = 1 … الملكة = 12) ونكمل من هناك. تنتهي عند الملك الرابع.\n3. الأوراق المقلوبة: 40+ ×0.6 · 48+ ×1.6 · كل الـ52 (نجاح السوليتير) ×3.9. أقل من 40: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Oyna”ya dokun: 52 kart saat gibi 13 desteye dağıtılır (Papazlar ortada).\n2. Oyun kendiliğinden oynanır: bir destenin üst kartı açılır, kendi saatinin destesine konur (As = 1 … Kız = 12) ve oradan devam edilir. 4. Papazda biter.\n3. Açılan kart: 40+ ×0.6 · 48+ ×1.6 · 52’si de (pasiyans çözüldü) ×3.9. 40’tan az: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Chơi»: 52 lá được chia thành 13 chồng như mặt đồng hồ (các lá K ở giữa).\n2. Ván bài tự chơi: lật lá trên cùng của một chồng, đặt vào chồng đúng giờ của nó (Át = 1 … Q = 12) rồi tiếp tục từ đó. Kết thúc khi lật lá K thứ 4.\n3. Số lá đã lật: 40+ ×0.6 · 48+ ×1.6 · đủ 52 (giải xong) ×3.9. Dưới 40: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Main»: 52 kartu dibagi jadi 13 tumpukan seperti jam (King di tengah).\n2. Permainan berjalan sendiri: kartu teratas sebuah tumpukan dibuka, ditaruh di tumpukan jamnya (As = 1 … Queen = 12), lalu lanjut dari sana. Selesai pada King ke-4.\n3. Kartu terbuka: 40+ ×0.6 · 48+ ×1.6 · semua 52 (solitaire selesai) ×3.9. Kurang dari 40: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Играть»: 52 карты раскладываются в 13 стопок как циферблат (короли в центре).\n2. Пасьянс раскладывается сам: открывается верхняя карта стопки, кладётся на стопку своего часа (туз = 1 … дама = 12), дальше — оттуда. Конец на 4-м короле.\n3. Открыто карт: 40+ ×0.6 · 48+ ×1.6 · все 52 (пасьянс сошёлся) ×3.9. Меньше 40 — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Spielen“: Die 52 Karten liegen in 13 Stapeln wie eine Uhr (Könige in der Mitte).\n2. Die Patience spielt sich selbst: oberste Karte eines Stapels aufdecken, auf den Stapel ihrer Stunde legen (Ass = 1 … Dame = 12), von dort weiter. Ende beim 4. König.\n3. Aufgedeckte Karten: 40+ ×0.6 · 48+ ×1.6 · alle 52 (Patience gelöst) ×3.9. Weniger als 40: Einsatz verloren.',
      hi: '1. राशि चुनें और «खेलें» छुएं: 52 पत्ते घड़ी की तरह 13 ढेरों में रखे जाते हैं (बादशाह बीच में)।\n2. खेल अपने आप चलता है: किसी ढेर का ऊपर वाला पत्ता खोलकर उसके घंटे वाले ढेर पर रखा जाता है (इक्का = 1 … बेगम = 12), फिर वहीं से आगे। चौथे बादशाह पर खेल खत्म।\n3. खुले पत्ते: 40+ ×0.6 · 48+ ×1.6 · सभी 52 (सॉलिटेयर पूरा) ×3.9। 40 से कम: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“开始”：52 张牌像时钟一样分成 13 堆（K 在中间）。\n2. 牌局自动进行：翻开一堆最上面的牌，放到对应钟点的牌堆（A = 1 … Q = 12），再从那里继续。翻出第 4 张 K 时结束。\n3. 翻开的牌数：40+ ×0.6 · 48+ ×1.6 · 全部 52 张（接龙成功）×3.9。少于 40：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
