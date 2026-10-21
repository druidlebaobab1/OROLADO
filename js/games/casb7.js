/* casb7 — Comet Queen, Aviator-style crash game (owner request, round 6) — instant games; the scene always shows exactly the line (or option) the server drew (casino_ext/casb.php). */
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
  /* =============================== COMET QUEEN (crash) =============================== */
  // Comme Aviator : la reine file sur sa comète dorée, le multiplicateur monte (×e^(0,12·s), horloge du SERVEUR) ;
  // le serveur a tiré en secret au départ le moment où la comète s'échappe (même loi que l'avion : retour 94 %).
  // Encaisse avant ! Fiche « skill » de casino_ext/casb.php (start / state / cash). Visiteur : vols de démonstration.
  var CQ = {
    en: { bet: 'Bet', cash: 'Cash out', flew: 'The comet flew away!', won: 'Cashed out', go: 'Tap Bet to take off' },
    fr: { bet: 'Miser', cash: 'Encaisser', flew: 'La comète s’est envolée !', won: 'Encaissé', go: 'Touche Miser pour décoller' },
    es: { bet: 'Apostar', cash: 'Cobrar', flew: '¡El cometa se escapó!', won: 'Cobrado', go: 'Toca Apostar para despegar' },
    pt: { bet: 'Apostar', cash: 'Retirar', flew: 'O cometa fugiu!', won: 'Retirado', go: 'Toque Apostar para decolar' },
    ar: { bet: 'راهن', cash: 'اسحب', flew: 'انطلق المذنّب بعيدًا!', won: 'تم السحب', go: 'المس راهن للإقلاع' },
    tr: { bet: 'Bahis', cash: 'Çek', flew: 'Kuyruklu yıldız kaçtı!', won: 'Çekildi', go: 'Kalkış için Bahis’e dokun' },
    vi: { bet: 'Cược', cash: 'Rút', flew: 'Sao chổi đã bay mất!', won: 'Đã rút', go: 'Chạm Cược để cất cánh' },
    id: { bet: 'Pasang', cash: 'Cairkan', flew: 'Komet terbang menjauh!', won: 'Dicairkan', go: 'Sentuh Pasang untuk terbang' },
    ru: { bet: 'Ставка', cash: 'Забрать', flew: 'Комета улетела!', won: 'Забрано', go: 'Нажми «Ставка» для взлёта' },
    de: { bet: 'Setzen', cash: 'Auszahlen', flew: 'Der Komet ist weg!', won: 'Ausgezahlt', go: 'Tippe Setzen zum Start' },
    hi: { bet: 'दांव', cash: 'निकालें', flew: 'धूमकेतु उड़ गया!', won: 'निकाल लिया', go: 'उड़ान के लिए दांव दबाएं' },
    zh: { bet: '下注', cash: '提现', flew: '彗星飞走了！', won: '已提现', go: '点下注起飞' }
  };
  var TAU = Math.PI * 2;
  function mkc(w, h, dpr, fn) { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr)); var c = cv.getContext('2d'); c.scale(dpr, dpr); fn(c); return cv; }
  function snd(ev, a) { try { if (D6.Sfx) D6.Sfx.play(ev, a || {}, 'cometqueen'); } catch (e) { /* ignore */ } }
  function amb(on, v) { try { if (D6.Sfx && D6.Sfx.amb) D6.Sfx.amb('cometqueen', on, v); } catch (e) { /* ignore */ } }
  // la reine assise sur sa comète (sprite dessiné une fois) — repère : centre de la comète en (0, 0), unité u
  // ---- la reine (sprite dessiné UNE fois par vol, à la taille de l'écran) — repère : centre de la comète (0, 0), unité s
  var CQ_SKIN = [['#FBE3D3', '#E9B99A'], ['#F1C7A5', '#D69A72'], ['#F7D6C0', '#E2AE8A'], ['#FFE8DA', '#EDC3A6'], ['#F3CFB4', '#DCA784']];
  var CQ_HAIR = [['#2B1B12', '#5B3A26'], ['#7C2D12', '#C2410C'], ['#E8C26A', '#FEF3C7'], ['#0F0A1E', '#3B2F63'], ['#9F1239', '#F43F5E'], ['#D6D3E8', '#FFFFFF']];
  var CQ_GOWN = [['#FBCFE8', '#EC4899', '#831843'], ['#E9D5FF', '#A855F7', '#4C1D95'], ['#CCFBF1', '#14B8A6', '#134E4A'], ['#FEF3C7', '#F59E0B', '#78350F'], ['#FECDD3', '#E11D48', '#4C0519']];
  function look() { return { skin: CQ_SKIN[rnd(CQ_SKIN.length)], hair: CQ_HAIR[rnd(CQ_HAIR.length)], gown: CQ_GOWN[rnd(CQ_GOWN.length)] }; }
  var Q_BOX = [-84, -104, 132, 128]; // x, y, largeur, hauteur du sprite (unités)
  function queenSprite(lk, s, dpr) {
    return mkc(Q_BOX[2] * s, Q_BOX[3] * s, dpr, function (c) {
      c.translate(-Q_BOX[0] * s, -Q_BOX[1] * s); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
      var sk = lk.skin, hr = lk.hair, gw = lk.gown, g;
      // cheveux longs qui volent (derrière)
      g = c.createLinearGradient(-70, -90, 4, -60); g.addColorStop(0, hr[1]); g.addColorStop(0.5, hr[0]); g.addColorStop(1, hr[0]);
      c.fillStyle = g; c.beginPath(); c.moveTo(6, -78);
      c.bezierCurveTo(-8, -88, -26, -86, -40, -90); c.bezierCurveTo(-52, -94, -64, -86, -78, -92);
      c.bezierCurveTo(-68, -80, -58, -82, -48, -76); c.bezierCurveTo(-60, -72, -70, -66, -80, -68);
      c.bezierCurveTo(-64, -58, -46, -64, -34, -62); c.bezierCurveTo(-24, -58, -14, -56, -6, -56); c.closePath(); c.fill();
      c.strokeStyle = hr[1]; c.globalAlpha = 0.55; c.lineWidth = 0.9;
      [[-6, -76, -40, -84, -70, -88], [-4, -68, -36, -72, -72, -72], [-6, -62, -30, -64, -60, -66]].forEach(function (a) { c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(a[2], a[3], a[4], a[5]); c.stroke(); });
      c.globalAlpha = 1;
      // robe : longue traîne (ombrée), drapé devant la comète
      g = c.createLinearGradient(-80, -30, 16, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.18, gw[0]); g.addColorStop(0.55, gw[1]); g.addColorStop(1, gw[2]);
      c.fillStyle = g; c.beginPath(); c.moveTo(-6, -36);
      c.bezierCurveTo(-22, -34, -44, -24, -82, -10); c.bezierCurveTo(-62, -6, -48, 2, -30, 6); c.bezierCurveTo(-16, 10, 4, 10, 18, 2);
      c.bezierCurveTo(16, -10, 10, -22, 7, -36); c.closePath(); c.fill();
      c.strokeStyle = gw[2]; c.globalAlpha = 0.35; c.lineWidth = 1.2;
      [[-4, -30, -30, -18, -66, -10], [0, -22, -20, -6, -46, 0], [6, -16, 2, -2, -14, 6]].forEach(function (a) { c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(a[2], a[3], a[4], a[5]); c.stroke(); });
      c.globalAlpha = 0.8; c.strokeStyle = '#FDE68A'; c.lineWidth = 1; c.beginPath(); c.moveTo(-82, -10); c.bezierCurveTo(-62, -6, -48, 2, -30, 6); c.bezierCurveTo(-16, 10, 4, 10, 18, 2); c.stroke();
      c.globalAlpha = 1;
      for (var q = 0; q < 26; q++) { var x = -70 + Math.random() * 82, y = -28 + Math.random() * 32 - (x < -40 ? (x + 40) * -0.3 : 0), r = 0.5 + Math.random() * 1.4; c.fillStyle = 'rgba(255,255,255,' + (0.5 + Math.random() * 0.5).toFixed(2) + ')'; c.beginPath(); c.moveTo(x, y - r * 2); c.lineTo(x + r * 0.5, y - r * 0.5); c.lineTo(x + r * 2, y); c.lineTo(x + r * 0.5, y + r * 0.5); c.lineTo(x, y + r * 2); c.lineTo(x - r * 0.5, y + r * 0.5); c.lineTo(x - r * 2, y); c.lineTo(x - r * 0.5, y - r * 0.5); c.fill(); }
      // bras posé sur la comète
      c.strokeStyle = sk[1]; c.lineWidth = 3.6; c.beginPath(); c.moveTo(-4, -50); c.quadraticCurveTo(4, -38, 12, -22); c.stroke();
      c.fillStyle = sk[1]; c.beginPath(); c.arc(13, -20, 2.4, 0, TAU); c.fill();
      // buste
      g = c.createLinearGradient(-10, -58, 8, -34); g.addColorStop(0, gw[0]); g.addColorStop(0.5, gw[1]); g.addColorStop(1, gw[2]);
      c.fillStyle = g; c.beginPath(); c.moveTo(-7, -34); c.bezierCurveTo(-10, -42, -10, -48, -8, -52); c.lineTo(7, -52); c.bezierCurveTo(9, -46, 9, -40, 7, -34); c.closePath(); c.fill();
      c.strokeStyle = '#FDE68A'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-7.5, -36); c.quadraticCurveTo(0, -33, 7.5, -36); c.stroke();
      // épaules, décolleté, cou
      c.fillStyle = sk[0]; c.beginPath(); c.moveTo(-8, -52); c.quadraticCurveTo(-8, -57, -3, -57.5); c.lineTo(4, -57.5); c.quadraticCurveTo(9, -57, 8, -52); c.quadraticCurveTo(4, -48, 0, -50); c.quadraticCurveTo(-4, -48, -8, -52); c.fill();
      c.fillStyle = sk[0]; c.fillRect(-1.6, -63, 4, 7);
      c.fillStyle = '#FDE68A'; c.beginPath(); c.arc(0.4, -53.5, 1.3, 0, TAU); c.fill();
      // bras levé, bracelet, baguette étoilée
      c.strokeStyle = sk[0]; c.lineWidth = 3.4; c.beginPath(); c.moveTo(5, -55); c.quadraticCurveTo(14, -60, 17, -64); c.lineTo(25, -78); c.stroke();
      c.strokeStyle = '#FDE68A'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(21.5, -71.5); c.lineTo(23.5, -72.6); c.stroke();
      c.fillStyle = sk[0]; c.beginPath(); c.arc(25.5, -79, 2.4, 0, TAU); c.fill();
      c.strokeStyle = '#FDE68A'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(26, -80); c.lineTo(31, -94); c.stroke();
      g = c.createRadialGradient(31.5, -96, 0, 31.5, -96, 9); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(253,230,138,0)'); c.fillStyle = g; c.beginPath(); c.arc(31.5, -96, 9, 0, TAU); c.fill();
      c.fillStyle = '#FEF3C7'; c.beginPath(); for (var j = 0; j < 10; j++) { var a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? 1.8 : 4.4; c.lineTo(31.5 + Math.cos(a) * rr, -96 + Math.sin(a) * rr); } c.closePath(); c.fill();
      // tête
      g = c.createRadialGradient(4, -72, 1, 2, -69, 10); g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]);
      c.fillStyle = g; c.beginPath(); c.ellipse(2.5, -69, 7, 8.6, 0.12, 0, TAU); c.fill();
      c.fillStyle = 'rgba(244,114,182,.35)'; c.beginPath(); c.arc(6.4, -66.5, 2, 0, TAU); c.fill();
      c.strokeStyle = '#2B1B12'; c.lineWidth = 0.9; c.beginPath(); c.arc(5.6, -70.5, 1.8, 0.15, Math.PI - 0.4); c.stroke();
      c.beginPath(); c.moveTo(4.2, -73.6); c.quadraticCurveTo(6, -74.6, 7.8, -73.4); c.stroke();
      c.lineWidth = 0.6; [[4.4, -69.6, 3.6, -68.6], [5.6, -69.1, 5.2, -68], [6.8, -69.4, 6.9, -68.3]].forEach(function (a) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[2], a[3]); c.stroke(); });
      c.fillStyle = '#BE123C'; c.beginPath(); c.ellipse(7.6, -64.4, 1.6, 0.9, 0.2, 0, TAU); c.fill();
      // cheveux devant (frange, mèche)
      g = c.createLinearGradient(-6, -80, 8, -66); g.addColorStop(0, hr[1]); g.addColorStop(1, hr[0]);
      c.fillStyle = g; c.beginPath(); c.moveTo(-5, -64); c.bezierCurveTo(-7, -74, -2, -80, 4, -79); c.bezierCurveTo(10, -78.5, 11, -74, 9.4, -71.5); c.bezierCurveTo(6, -75, 2, -74.5, 0, -72); c.bezierCurveTo(-1.5, -68, -1, -63, -3, -58); c.closePath(); c.fill();
      // diadème
      c.fillStyle = '#FBBF24'; c.beginPath(); c.moveTo(-3, -78.6); c.lineTo(-1.6, -84); c.lineTo(0.8, -80); c.lineTo(3, -86.5); c.lineTo(5.2, -80); c.lineTo(7.6, -84); c.lineTo(8.6, -78); c.closePath(); c.fill();
      c.fillStyle = '#F472B6'; c.beginPath(); c.arc(3, -81.4, 1.3, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-1.6, -84, 0.7, 0, TAU); c.arc(3, -86.5, 0.7, 0, TAU); c.arc(7.6, -84, 0.7, 0, TAU); c.fill();
      c.fillStyle = '#FDE68A'; c.beginPath(); c.arc(0, -63.6, 1, 0, TAU); c.fill();
    });
  }
  // cape et rubans qui flottent selon la vitesse (dessinés chaque image, derrière le sprite) — dans le repère de la reine
  function ribbons(c, lk, t, sp) {
    var w = Math.min(1.6, 0.4 + sp), gw = lk.gown;
    c.globalAlpha = 0.55; c.fillStyle = gw[1]; c.beginPath(); c.moveTo(-7, -54);
    for (var q = 0; q <= 8; q++) { var x = -7 - q * 13 * w, y = -54 + q * 4 + Math.sin(t * 7 - q * 0.8) * q * 1.2; c.lineTo(x, y); }
    for (q = 8; q >= 0; q--) { x = -7 - q * 12 * w; y = -40 + q * 5.4 + Math.sin(t * 7 - q * 0.8 + 0.6) * q * 1.4; c.lineTo(x, y); }
    c.closePath(); c.fill(); c.globalAlpha = 1;
    [['#FDE68A', 0, 1.6], [gw[0], 1.7, 1.3]].forEach(function (rb) {
      c.strokeStyle = rb[0]; c.lineWidth = rb[2]; c.beginPath(); c.moveTo(-6, -36);
      for (var k = 1; k <= 12; k++) c.lineTo(-6 - k * 10 * w, -34 + k * 2 + Math.sin(t * 8 + rb[1] - k * 0.7) * k * 0.9);
      c.stroke();
    });
  }
  function cometGlow(c, x, y, s, t, lite) {
    var r = 19 * s, g = c.createRadialGradient(x, y, 0, x, y, r * 3.4);
    g.addColorStop(0, 'rgba(255,247,214,.9)'); g.addColorStop(0.3, 'rgba(253,230,138,.45)'); g.addColorStop(0.6, 'rgba(244,114,182,.18)'); g.addColorStop(1, 'rgba(244,114,182,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3.4, 0, TAU); c.fill();
    var h = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    h.addColorStop(0, '#FFFFFF'); h.addColorStop(0.4, '#FEF3C7'); h.addColorStop(0.8, '#FBBF24'); h.addColorStop(1, '#D97706');
    c.fillStyle = h; c.beginPath(); c.arc(x, y, r * (1 + Math.sin(t * 10) * 0.04), 0, TAU); c.fill();
    if (!lite) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2; var f = r * (2.2 + Math.sin(t * 6) * 0.3); c.beginPath(); c.moveTo(x - f, y); c.lineTo(x + f, y); c.moveTo(x, y - f * 0.7); c.lineTo(x, y + f * 0.7); c.stroke(); }
  }
  K.register('cometqueen', function (box) {
    var l = Lx(CQ), lite0 = lite(), hist = [];
    try { hist = JSON.parse(localStorage.getItem('cg_cometqueen_h') || '[]').slice(0, 12); } catch (e) { hist = []; }
    box.classList.add('cg-game', 'cb-cq');
    box.innerHTML = '<div class="cg-stage cq-st" id="cqSt"><canvas class="cq-cv" id="cqCv"></canvas><div class="cg-hist cq-hist" id="cqHist"></div>' +
      '<div class="cq-hud"><b class="fit cq-m idle" id="cqM">' + xm(1) + '</b><small class="fit cq-msg" id="cqMsg"></small></div></div>' + K.stakePanel(l.bet);
    K.bindStake(box);
    var st = $('cqSt'), cv = $('cqCv'), ctx = cv.getContext('2d'), btn = $('csGo'), mEl = $('cqM'), msgEl = $('cqMsg');
    var W = 0, H = 0, dpr = 1, u = 1, bgS = null, qS = null, stars = [], P = [];
    var phase = 'idle', R = null, off = 0, busy = false, t0 = 0, crashAt = 0, outT = 0, fly = null, mShown = '', last = 0, demo = K.guest(), dC = 0, dT = 0, ambOn = false;
    function say(t, cls) { K.setText(msgEl, t || ''); mEl.classList.remove('won', 'lost', 'idle'); if (cls) mEl.classList.add(cls); }
    function tx(s) { if (mEl.textContent !== s) { if (mEl.textContent.length !== s.length) K.setText(mEl, s); else mEl.textContent = s; } }
    function setBtn(main, sub, cls) {
      if (!btn) return;
      btn.classList.remove('cash', 'wait'); if (cls) btn.classList.add(cls);
      if (sub) { btn.innerHTML = '<span class="fit cq-b1"></span><span class="fit cq-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
      else { btn.innerHTML = '<span class="fit cg-gol"></span>'; K.setText(btn.firstChild, main); }
    }
    function paintHist() { $('cqHist').innerHTML = hist.map(function (h) { var v = Math.abs(h); return '<i class="' + (h < 0 ? 'x' : v >= 10 ? 'hi' : v >= 2 ? 'mid' : 'lo') + '">' + xm(v) + '</i>'; }).join(''); }
    function nowS() { return Date.now() / 1000 + off; }
    function secs() { return demo ? (performance.now() - dT) / 1000 : (R ? Math.max(0, nowS() - R.t0) : 0); }
    function mult() { var rate = R ? R.rate : 0.12; return Math.max(1, Math.floor(Math.exp(rate * secs()) * 100 + 1e-9) / 100); }
    function money(v) { return '$' + (Math.floor(v * 100 + 1e-6) / 100).toFixed(2); }
    var S = 1, LK = look(), clouds = [], cloudS = [], streaks = [], flash = 0, rings = [], spd = 0.1, camX = 0;
    function newLook() { LK = look(); if (W) qS = queenSprite(LK, S, dpr); }
    function resize() {
      if (!box.isConnected) return;
      var r = st.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h || (w === W && h === H)) return;
      W = w; H = h; dpr = lite0 ? 1 : Math.min(2, window.devicePixelRatio || 1); u = Math.min(W, H * 1.2) / 230; S = Math.min(H * 0.28 / 100, W * 0.5 / 132);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      // ciel profond : dégradé, nébuleuses, poussière d'étoiles, planète à anneau (peint une fois)
      bgS = mkc(W, H, dpr, function (c) {
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#12052E'); g.addColorStop(0.45, '#4C1D95'); g.addColorStop(0.8, '#A21CAF'); g.addColorStop(1, '#F472B6'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        [[0.2, 0.25, 0.45, 'rgba(236,72,153,.32)'], [0.75, 0.35, 0.5, 'rgba(139,92,246,.35)'], [0.5, 0.75, 0.55, 'rgba(244,114,182,.28)'], [0.9, 0.1, 0.3, 'rgba(56,189,248,.18)']].forEach(function (n) {
          var m = c.createRadialGradient(W * n[0], H * n[1], 1, W * n[0], H * n[1], Math.max(W, H) * n[2]); m.addColorStop(0, n[3]); m.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = m; c.fillRect(0, 0, W, H); });
        for (var q = 0; q < (lite0 ? 60 : 140); q++) { c.globalAlpha = 0.2 + Math.random() * 0.6; c.fillStyle = Math.random() < 0.2 ? '#FBCFE8' : '#FFFFFF'; var z = Math.random() < 0.08 ? 1.6 : 0.8; c.fillRect(Math.random() * W, Math.random() * H * 0.85, z, z); }
        c.globalAlpha = 1;
        var px = W * 0.86, py = H * 0.16, pr = Math.min(W, H) * 0.07, pg = c.createRadialGradient(px - pr * 0.4, py - pr * 0.4, 1, px, py, pr); pg.addColorStop(0, '#FDE68A'); pg.addColorStop(0.6, '#F472B6'); pg.addColorStop(1, '#6D28D9');
        c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(253,230,138,.7)'; c.lineWidth = Math.max(1, pr * 0.12); c.beginPath(); c.ellipse(px, py, pr * 1.8, pr * 0.45, -0.35, 0, TAU); c.stroke();
        c.fillStyle = 'rgba(46,16,101,.6)'; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 16) c.lineTo(x, H - 14 - Math.sin(x / 41) * 9 - Math.sin(x / 11) * 3); c.lineTo(W, H); c.fill();
      });
      cloudS = [0, 1, 2].map(function (k) { var cw = W * (0.4 + k * 0.12), ch = cw * 0.34; return mkc(cw, ch, dpr, function (c) { c.scale(1, 0.5); [[0.3, 1.25, 0.24], [0.52, 1.1, 0.3], [0.74, 1.3, 0.22]].forEach(function (b) { var x = cw * b[0], y = ch * b[1], r = cw * b[2], g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, ['rgba(251,207,232,.3)', 'rgba(196,181,253,.26)', 'rgba(244,114,182,.22)'][k]); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, cw, ch * 2); }); }); });
      clouds = [0, 1, 2, 3, 4].map(function (q) { return { k: q % 3, x: Math.random() * W * 1.4, y: H * (0.18 + q * 0.15), d: 0.25 + (q % 3) * 0.3 }; });
      streaks = []; for (var q = 0; q < (lite0 ? 16 : 34); q++) streaks.push({ x: Math.random() * W, y: Math.random() * H * 0.9, d: 0.3 + Math.random() * 0.9 });
      qS = queenSprite(LK, S, dpr);
    }
    // trajectoire (comme Aviator) — la reine reste entière dans l'écran
    function pos(s) { var k1 = 1 - Math.exp(-s / 7), k2 = 1 - Math.exp(-s / 9), x0 = 86 * S + 6, x1 = W - 50 * S, y0 = H - 30 * S - 8, y1 = 104 * S + 8; return [x0 + (x1 - x0) * k1, y0 - (y0 - y1) * k2 + Math.sin(s * 2.2) * 3 * S]; }
    function burst(x, y, n, cols, sp) { if (lite0) n = Math.ceil(n / 2); for (var q = 0; q < n; q++) { var a = Math.random() * TAU, s = sp * (0.3 + Math.random()); P.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, m: 0.7 + Math.random() * 0.8, c: cols[q % cols.length], r: (1.4 + Math.random() * 3) * S, g: 40 }); } }
    function queenAt(x, y, rot, sc, tt) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(S * sc, S * sc);
      ribbons(ctx, LK, tt, spd);
      ctx.restore();
      cometGlow(ctx, x, y, S * sc, tt, lite0);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.drawImage(qS, Q_BOX[0] * S, Q_BOX[1] * S, Q_BOX[2] * S, Q_BOX[3] * S); ctx.restore();
    }
    function draw(ts, dt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(bgS, 0, 0, W, H);
      var tt = ts / 1000, flying = phase === 'play' || phase === 'cashing' || phase === 'won';
      var target = flying ? 0.7 + Math.log(Math.max(1, mult())) * 0.45 : phase === 'crash' ? 2.4 : 0.12; spd += (target - spd) * Math.min(1, dt * 2);
      // nuages en parallaxe et étoiles filantes : le ciel défile avec la vitesse
      for (var q = 0; q < clouds.length; q++) { var cl = clouds[q], img = cloudS[cl.k]; cl.x -= spd * cl.d * W * 0.18 * dt; if (cl.x < -img.width / dpr) { cl.x = W + Math.random() * W * 0.4; cl.y = H * (0.15 + Math.random() * 0.65); } ctx.drawImage(img, cl.x, cl.y, img.width / dpr, img.height / dpr); }
      ctx.strokeStyle = '#FDF4FF'; ctx.lineCap = 'round';
      for (q = 0; q < streaks.length; q++) { var sr = streaks[q], v = spd * sr.d * W * 0.5; sr.x -= v * dt; sr.y += v * dt * 0.18; if (sr.x < -40 || sr.y > H) { sr.x = W + Math.random() * 60; sr.y = Math.random() * H * 0.8; } var L = Math.max(1.2, v * 0.06); ctx.globalAlpha = Math.min(0.85, 0.25 + sr.d * 0.4); ctx.lineWidth = sr.d * 1.3; ctx.beginPath(); ctx.moveTo(sr.x, sr.y); ctx.lineTo(sr.x + L, sr.y - L * 0.18); ctx.stroke(); }
      ctx.globalAlpha = 1;
      var hd, dir = -0.4, sc = 1;
      if (flying || phase === 'crash') {
        var sNow = phase === 'crash' ? crashAt : secs(), N = 36, p0 = pos(0), pe = pos(sNow);
        ctx.beginPath(); ctx.moveTo(p0[0], H); for (var j = 0; j <= N; j++) { var p = pos(sNow * j / N); ctx.lineTo(p[0], p[1]); } ctx.lineTo(pe[0], H); ctx.closePath();
        var fg = ctx.createLinearGradient(0, pe[1], 0, H); fg.addColorStop(0, 'rgba(244,114,182,.4)'); fg.addColorStop(1, 'rgba(244,114,182,0)'); ctx.fillStyle = fg; ctx.fill();
        ctx.beginPath(); for (j = 0; j <= N; j++) { p = pos(sNow * j / N); if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
        ctx.strokeStyle = 'rgba(253,230,138,.35)'; ctx.lineWidth = 7 * S; ctx.stroke(); ctx.strokeStyle = '#FDE68A'; ctx.lineWidth = 2.4 * S; ctx.stroke();
        var pb = pos(Math.max(0, sNow - 0.25)); hd = pe; dir = Math.atan2(pe[1] - pb[1], pe[0] - pb[0]);
        if (phase === 'crash') { fly.t += dt; var e = fly.t * fly.t; hd = [pe[0] + e * 1100 * S, pe[1] - e * 900 * S]; dir = -0.7; sc = Math.max(0.2, 1 - fly.t * 0.55); }
      } else { hd = pos(0); hd[1] += Math.sin(tt * 2) * 4 * S; }
      // longue queue de particules lumineuses derrière la comète
      if ((flying || phase === 'idle') && hd[0] < W + 80 * S) {
        var n = lite0 ? 1 : (flying ? 3 : 1), back = dir + Math.PI;
        for (q = 0; q < n; q++) { var sp2 = (40 + Math.random() * 90) * (0.6 + spd) * S; P.push({ x: hd[0] + (Math.random() - 0.5) * 10 * S, y: hd[1] + (Math.random() - 0.5) * 10 * S, vx: Math.cos(back) * sp2 - spd * 30 * S, vy: Math.sin(back) * sp2 + (Math.random() - 0.5) * 20 * S, t: 0, m: 0.6 + Math.random() * 0.6, c: ['#FFF7D6', '#FDE68A', '#F9A8D4', '#C4B5FD'][q % 4], r: (2 + Math.random() * 3.5) * S, g: 0 }); }
      }
      if (P.length > (lite0 ? 60 : 180)) P.splice(0, P.length - (lite0 ? 60 : 180));
      if (!lite0) ctx.globalCompositeOperation = 'lighter';
      for (q = P.length - 1; q >= 0; q--) { var pt = P[q]; pt.t += dt; if (pt.t >= pt.m) { P.splice(q, 1); continue; } pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += pt.g * dt; var k = 1 - pt.t / pt.m; ctx.globalAlpha = k * 0.9; ctx.fillStyle = pt.c; ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(0.3, pt.r * (0.4 + k * 0.6)), 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      if (hd[0] < W + 120 * S && hd[1] > -140 * S) queenAt(hd[0], hd[1], flying ? Math.max(-0.35, dir * 0.45) : -0.12 + Math.sin(tt * 1.5) * 0.03, sc, tt);
      // onde de choc + éclair quand la comète s'échappe
      for (q = rings.length - 1; q >= 0; q--) { var rg = rings[q]; rg.t += dt; if (rg.t > 0.9) { rings.splice(q, 1); continue; } if (rg.t <= 0) continue; var kk = rg.t / 0.9; ctx.globalAlpha = (1 - kk) * 0.9; ctx.strokeStyle = rg.c; ctx.lineWidth = (1 - kk) * 8 * S + 1; ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r * (1 - Math.pow(1 - kk, 3)), 0, TAU); ctx.stroke(); }
      if (flash > 0) { flash = Math.max(0, flash - dt * 2.4); ctx.globalAlpha = flash * 0.7; ctx.fillStyle = '#FFF1F2'; ctx.fillRect(0, 0, W, H); }
      ctx.globalAlpha = 1;
    }
    function loop(ts) {
      if (!box.isConnected) { amb(false); return; }
      K.S.raf = requestAnimationFrame(loop);
      if (document.hidden) { last = 0; return; }
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
      if (!W) { resize(); if (!W) return; }
      if (lite0 && phase === 'idle' && !P.length && loop.drawn && Math.floor(ts / 66) === loop.f) return; // vieux téléphones : 15 images/s au repos
      loop.f = Math.floor(ts / 66); loop.drawn = 1;
      if (demo) demoStep();
      if (phase === 'play' || phase === 'cashing') {
        var m = mult(), s = xm(m);
        if (s !== mShown) { mShown = s; tx(s); if (!demo && phase === 'play' && btn && btn.lastChild && btn.lastChild.className.indexOf('cq-b2') >= 0) K.setText(btn.lastChild, money(R.stake * m)); }
        if (!demo && ambOn) amb(true, Math.min(1, Math.log(m) / Math.log(20)));
      }
      if (phase === 'crash' || phase === 'won') { outT -= dt; if (outT <= 0) toIdle(); }
      draw(ts, dt);
    }
    // ---- visiteur : vols de démonstration (aucune mise, aucun son)
    function demoStep() {
      if (phase === 'idle') { outT -= 0.016; if (outT > 0) return; phase = 'play'; dT = performance.now(); newLook(); var q = Math.random(); dC = Math.min(30, Math.max(1, Math.floor(0.94 / Math.max(1e-6, 1 - q) * 100) / 100)); mShown = ''; say('', ''); return; }
      if (phase === 'play' && mult() >= dC) { crashAt = secs(); crash(); }
    }
    function crash() {
      phase = 'crash'; outT = 2.6; fly = { t: 0 };
      var p = pos(crashAt); burst(p[0], p[1], 46, ['#FDE68A', '#F472B6', '#C084FC', '#fff'], 260 * S); rings.push({ x: p[0], y: p[1], r: Math.max(W, H) * 0.55, t: 0, c: '#FDE68A' }, { x: p[0], y: p[1], r: Math.max(W, H) * 0.35, t: -0.12, c: '#F472B6' }); flash = 1;
      tx(xm(demo ? dC : Math.max(1, R && R.c ? R.c : mult()))); say(l.flew, 'lost');
      if (!demo) { ambOn = false; amb(false); snd('boom'); }
    }
    function toIdle() { phase = 'idle'; P.length = 0; tx(xm(1)); mShown = ''; say(demo ? '' : '', 'idle'); outT = demo ? 1.2 : 0; if (!demo) setBtn(l.bet); }
    // ---- partie réelle
    async function start() {
      if (K.guest()) { K.signup(); return; }
      if (busy) return; busy = true; btn.disabled = true;
      var r = await K.multi('cometqueen', 'start');
      busy = false; btn.disabled = false;
      if (!r || !box.isConnected) return;
      begin(r);
    }
    function begin(r) {
      if (!W) resize();
      R = r; off = (Number(r.now) || Date.now() / 1000) - Date.now() / 1000;
      if (r.done) { result(r); return; }
      phase = 'play'; mShown = ''; P.length = 0; say('', '');
      st.querySelectorAll('.cs-toast').forEach(function (t) { t.remove(); });
      setBtn(l.cash, money(r.stake * mult()), 'cash');
      if (!r.resume) { snd('takeoff'); newLook(); } ambOn = true; amb(true, 0);
      poll();
    }
    function poll() {
      clearTimeout(K.S.timer);
      K.S.timer = setTimeout(async function () {
        if (!box.isConnected || phase !== 'play') return;
        var ref = R && R.ref, r = await K.multi('cometqueen', 'state', null, true);
        if (!box.isConnected || phase !== 'play' || !R || R.ref !== ref) return;
        if (r && r.now) off = r.now - Date.now() / 1000;
        if (r && r.done) { ended(r); return; }
        poll();
      }, 600);
    }
    function ended(r) { R.c = Number(r.c) || mult(); crashAt = Math.log(Math.max(1, R.c)) / R.rate; crash(); btn.disabled = true; setTimeout(function () { if (box.isConnected) result(r); }, 900); }
    async function cash() {
      if (phase !== 'play') return;
      phase = 'cashing'; btn.disabled = true; clearTimeout(K.S.timer);
      var r = await K.multi('cometqueen', 'cash');
      btn.disabled = false;
      if (!box.isConnected) return;
      if (!r) { if (phase === 'cashing') { phase = 'play'; poll(); } return; }
      if ((Number(r.win) || 0) > 0) {
        phase = 'won'; outT = 3; ambOn = false; amb(false); snd('cashout');
        var p = pos(secs()); burst(p[0], p[1], 36, ['#FDE68A', '#FEF3C7', '#4ADE80', '#FBBF24'], 200 * S); rings.push({ x: p[0], y: p[1], r: Math.max(W, H) * 0.3, t: 0, c: '#4ADE80' });
        tx(xm(r.out)); say(l.won + ' ' + xm(r.out), 'won'); result(r);
      } else ended(r);
    }
    function result(r) {
      clearTimeout(K.S.timer);
      if (btn) { btn.disabled = true; setTimeout(function () { if (box.isConnected) btn.disabled = false; }, 900); }
      var won = (Number(r.win) || 0) > 0, v = won ? Number(r.out) : (r.c ? Number(r.c) : mult());
      hist.unshift(won ? v : -Math.max(1, v)); hist = hist.slice(0, 12);
      try { localStorage.setItem('cg_cometqueen_h', JSON.stringify(hist)); } catch (e) { /* ignore */ }
      paintHist(); setBtn(l.bet); R = null;
      if (phase !== 'crash' && phase !== 'won') { phase = 'won'; outT = 2; }
      K.resultLine(box, r);
    }
    if (btn) btn.addEventListener('click', function () {
      if (phase === 'play') cash();
      else if (phase === 'idle' || phase === 'crash' || phase === 'won') { if (phase !== 'idle') toIdle(); start(); }
    });
    paintHist(); setBtn(l.bet); say(demo ? '' : l.go, 'idle'); outT = demo ? 0.3 : 0.8;
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(st); } else window.addEventListener('resize', resize);
    requestAnimationFrame(function () { resize(); cancelAnimationFrame(K.S.raf || 0); K.S.raf = requestAnimationFrame(loop); });
    if (!demo) K.multi('cometqueen', 'state', null, true).then(function (r) { if (r && !r.done && r.t0 && box.isConnected && phase === 'idle') { r.resume = 1; begin(r); } });
  }, { rules: rules({
    en: '1. Set your stake and tap “Bet”: the queen takes off on her golden comet and the multiplier climbs (×1.5, ×2, ×10…).\n2. Tap “Cash out” whenever you like: you win stake × the multiplier at that moment.\n3. At a secret moment, drawn by the server at take-off, the comet flies away: if you have not cashed out, the stake is lost.',
    fr: '1. Choisis ta mise et touche « Miser » : la reine s’envole sur sa comète dorée et le multiplicateur monte (×1.5, ×2, ×10…).\n2. Touche « Encaisser » quand tu veux : tu gagnes mise × le multiplicateur à cet instant.\n3. À un moment secret, tiré par le serveur au décollage, la comète s’envole : si tu n’as pas encaissé, la mise est perdue.',
    es: '1. Elige tu apuesta y toca «Apostar»: la reina despega en su cometa dorado y el multiplicador sube (×1.5, ×2, ×10…).\n2. Toca «Cobrar» cuando quieras: ganas apuesta × el multiplicador de ese momento.\n3. En un momento secreto, sorteado por el servidor al despegar, el cometa se escapa: si no cobraste, pierdes la apuesta.',
    pt: '1. Escolha o valor e toque em «Apostar»: a rainha decola no seu cometa dourado e o multiplicador sobe (×1.5, ×2, ×10…).\n2. Toque em «Retirar» quando quiser: você ganha aposta × o multiplicador daquele momento.\n3. Num momento secreto, sorteado pelo servidor na decolagem, o cometa foge: se não retirou, a aposta é perdida.',
    ar: '1. اختر الرهان والمس «راهن»: تقلع الملكة على مذنّبها الذهبي ويرتفع المضاعف (×1.5، ×2، ×10…).\n2. المس «اسحب» متى شئت: تربح الرهان × المضاعف في تلك اللحظة.\n3. في لحظة سرية يسحبها الخادم عند الإقلاع ينطلق المذنّب بعيدًا: إن لم تسحب تخسر الرهان.',
    tr: '1. Bahsini seç ve “Bahis”e dokun: kraliçe altın kuyruklu yıldızıyla havalanır, çarpan yükselir (×1.5, ×2, ×10…).\n2. İstediğin an “Çek”e dokun: bahis × o anki çarpanı kazanırsın.\n3. Sunucunun kalkışta gizlice çektiği bir anda kuyruklu yıldız kaçar: çekmediysen bahis kaybedilir.',
    vi: '1. Chọn mức cược và chạm «Cược»: nữ hoàng bay lên trên sao chổi vàng và hệ số tăng dần (×1.5, ×2, ×10…).\n2. Chạm «Rút» bất cứ lúc nào: bạn nhận cược × hệ số tại thời điểm đó.\n3. Vào một thời điểm bí mật do máy chủ chọn lúc cất cánh, sao chổi bay mất: nếu chưa rút, mất tiền cược.',
    id: '1. Atur taruhan lalu sentuh «Pasang»: sang ratu terbang di atas komet emasnya dan pengali naik (×1.5, ×2, ×10…).\n2. Sentuh «Cairkan» kapan saja: kamu menang taruhan × pengali saat itu.\n3. Pada saat rahasia yang diundi server saat lepas landas, komet terbang menjauh: jika belum dicairkan, taruhan hilang.',
    ru: '1. Выберите ставку и нажмите «Ставка»: королева взлетает на золотой комете, множитель растёт (×1.5, ×2, ×10…).\n2. Нажмите «Забрать» когда угодно: выигрыш = ставка × множитель в этот момент.\n3. В тайный момент, выбранный сервером при взлёте, комета улетает: если вы не забрали — ставка проиграна.',
    de: '1. Wähle deinen Einsatz und tippe auf „Setzen“: Die Königin hebt auf ihrem goldenen Kometen ab, der Multiplikator steigt (×1.5, ×2, ×10…).\n2. Tippe jederzeit auf „Auszahlen“: du gewinnst Einsatz × den Multiplikator in diesem Moment.\n3. In einem geheimen Moment, vom Server beim Start gezogen, fliegt der Komet davon: Wer nicht ausgezahlt hat, verliert den Einsatz.',
    hi: '1. राशि चुनें और «दांव» छुएं: रानी अपने सुनहरे धूमकेतु पर उड़ती है और गुणक बढ़ता है (×1.5, ×2, ×10…)।\n2. जब चाहें «निकालें» छुएं: आप दांव × उस पल का गुणक जीतते हैं।\n3. उड़ान के समय सर्वर द्वारा चुने गुप्त पल पर धूमकेतु उड़ जाता है: अगर नहीं निकाला तो दांव हार जाते हैं।',
    zh: '1. 设定金额并点击“下注”：女王乘着金色彗星起飞，倍数不断上升（×1.5、×2、×10…）。\n2. 随时点击“提现”：赢取 下注 × 当时的倍数。\n3. 起飞时服务器秘密抽定的时刻一到，彗星就会飞走：若未提现，输掉下注。'
  }) });
})(window.D6 = window.D6 || {});
