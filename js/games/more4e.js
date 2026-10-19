/* v2830 — more4e (owner request, round 5): 3 video slots with their own mechanic — Crystal Clusters (cluster pays), Mega Reels (megaways), Coin Link (hold & win). Each screen is built from the line the server drew (casino_ext/more5.php). */
(function (D6) {
  'use strict';
  /* ---- petit kit commun des jeux more4 (copié dans chaque fichier : un seul fichier chargé par jeu) ---- */
  var K = D6.CasinoKit, $ = K.$;
  var GONE = { gone: 1 };
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function Lx(T) { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function xm(v) { return '×' + String(v).replace('.', K.dec()); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pickW(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; var r = Math.random() * s; for (i = 0; i < a.length; i++) { r -= a[i]; if (r < 0) return i; } return a.length - 1; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ease(k) { return 1 - Math.pow(1 - k, 3); }
  function easeIn(k) { return k * k; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  // animation image par image ; le joueur quitte le jeu → tout s'arrête (rejet GONE)
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
  // règles : les décimales suivent la langue (×0.5 → ×0,5)
  function rules(R) { ['fr', 'es', 'pt', 'tr', 'vi', 'id', 'ru', 'de'].forEach(function (k) { if (R[k]) R[k] = R[k].replace(/(\d)\.(\d)/g, '$1,$2'); }); return R; }
  /* jeu instantané : scène SVG + bandeau des gains (icône + ×) + terminal. o = { key, cls, verb, chips: [[icône, mult]], chipOf(i), vb, scene, opts, init(c), play(c, r), params(c) } */
  function game(o) {
    K.register(o.key, function (box) {
      var l = o.l(), busy = false;
      box.classList.add('cg-game', 'm4', 'm4-' + o.key);
      box.innerHTML = '<div class="cg-stage m4-stage">' + (o.chips ? '<div class="m4-pay">' + o.chips.map(function (c, i) { return '<span data-c="' + i + '">' + (c[0] ? '<svg viewBox="-12 -12 24 24" aria-hidden="true">' + c[0] + '</svg>' : '') + '<b class="fit">' + (c[2] || xm(c[1])) + '</b></span>'; }).join('') + '</div>' : '') +
        '<div class="m4-scene"><svg class="m4-svg" viewBox="' + o.vb + '" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + o.scene + '</svg></div></div>' + K.stakePanel(l.verb, o.opts ? o.opts(l) : '');
      K.bindStake(box);
      var c = { box: box, l: l, svg: box.querySelector('.m4-svg'), q: function (s) { return box.querySelector(s); }, qa: function (s) { return [].slice.call(box.querySelectorAll(s)); },
        mark: function (i) { box.querySelectorAll('.m4-pay span').forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-c') === i); }); } };
      c.id = function (s) { return box.querySelector('#' + s); };
      if (o.init) o.init(c);
      requestAnimationFrame(function () { K.fitAll(box); });
      try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (box.isConnected) K.fitAll(box); }); } catch (e) { /* ignore */ }
      var go = $('csGo');
      go.addEventListener('click', async function () {
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
          if (o.after) await o.after(c, r);
        } catch (e) {
          if (e !== GONE) { try { console.warn(e); } catch (e2) { /* ignore */ } if (r && !shown && box.isConnected) K.resultLine(box, r); }
        }
        finally { busy = false; if (box.isConnected) { go.disabled = false; box.classList.remove('m4-busy'); } }
      });
    }, { rules: rules(o.rules) });
  }
  var V = {
    en: { spin: 'Spin' }, fr: { spin: 'Lancer' }, es: { spin: 'Girar' }, pt: { spin: 'Girar' }, ar: { spin: 'دوّر' }, tr: { spin: 'Çevir' },
    vi: { spin: 'Quay' }, id: { spin: 'Putar' }, ru: { spin: 'Крутить' }, de: { spin: 'Drehen' }, hi: { spin: 'स्पिन' }, zh: { spin: '旋转' }
  };
  function verb() { var v = Lx(V); return { verb: v.spin }; }
  function setChip(c, j, txt) { var b = c.q('.m4-pay span[data-c="' + j + '"] b'); if (b) { if (b._o == null) b._o = b.textContent; K.setText(b, txt); } }
  function resetChips(c) { c.qa('.m4-pay span b').forEach(function (b) { if (b._o != null) { K.setText(b, b._o); b._o = null; } }); }
  function spark(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')" class="sl-sp"><path d="M0-7l1.8 5.2 5.2 1.8-5.2 1.8L0 7l-1.8-5.2L-7 0l5.2-1.8z" fill="#fff"/></g>'; }

  /* =============================== CRYSTAL CLUSTERS (grappes) =============================== */
  // grille 6×6, 5 cristaux ; une grappe = 5 cristaux pareils ou plus qui se touchent (haut/bas/gauche/droite).
  // ligne 0 = aucune grappe ; ligne 1 + couleur×8 + n° de taille (5,6,7,8,9,10,12,15) = UNE grappe de cette taille exacte.
  var CL_S = [5, 6, 7, 8, 9, 10, 12, 15], CL_P = [[1, 1.5, 2, 2.5, 4, 5, 10, 25], [1.2, 2, 2.5, 4, 5, 8, 15, 40], [2, 2.5, 4, 5, 8, 12, 25, 60], [2.5, 4, 5, 8, 12, 20, 40, 125], [5, 8, 12, 20, 30, 50, 125, 500]];
  var CL_C = [['#86EFAC', '#15803D'], ['#93C5FD', '#1D4ED8'], ['#D8B4FE', '#7E22CE'], ['#FDA4AF', '#BE123C'], ['#FDE68A', '#B45309']];
  function crystal(t, gid) { var sh = ['M0-11L9-4 6 9H-6L-9-4z', 'M0-12L10 0 0 12-10 0z', 'M-9-7L0-12 9-7V7L0 12-9 7z', 'M0-12L4-4 12-3 6 3 8 12 0 7-8 12-6 3-12-3-4-4z', 'M-10-4L-5-10H5L10-4 0 12z'][t]; return '<path d="' + sh + '" fill="url(#' + gid + t + ')" stroke="' + CL_C[t][1] + '" stroke-width="1"/><path d="M-3-7L0-9 2-6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>'; }
  function clDefs(gid) { return CL_C.map(function (c2, j) { return '<linearGradient id="' + gid + j + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="' + c2[0] + '"/><stop offset="1" stop-color="' + c2[1] + '"/></linearGradient>'; }).join(''); }
  function clGrid(line) {
    var N = 6, g = [], inC = {}, col = -1, size = 0;
    if (line > 0) { col = Math.floor((line - 1) / 8); size = CL_S[(line - 1) % 8]; }
    for (var t = 0; t < 200; t++) {
      g = []; inC = {};
      for (var q = 0; q < 36; q++) g.push(-1);
      if (col >= 0) { // grappe : croissance au hasard depuis une case
        var start = rnd(36), cl = [start], fr = []; inC[start] = 1;
        var nb = function (q2) { var r = Math.floor(q2 / N), cc = q2 % N, o = []; if (r > 0) o.push(q2 - N); if (r < N - 1) o.push(q2 + N); if (cc > 0) o.push(q2 - 1); if (cc < N - 1) o.push(q2 + 1); return o; };
        while (cl.length < size) { fr = []; cl.forEach(function (q3) { nb(q3).forEach(function (x) { if (!inC[x] && fr.indexOf(x) < 0) fr.push(x); }); }); if (!fr.length) break; var nq = fr[rnd(fr.length)]; inC[nq] = 1; cl.push(nq); }
        if (cl.length < size) continue;
        cl.forEach(function (q4) { g[q4] = col; });
        cl.forEach(function (q5) { nb(q5).forEach(function (x) { if (g[x] < 0) { var o = [0, 1, 2, 3, 4].filter(function (k) { return k !== col; }); g[x] = o[rnd(4)]; } }); });
      }
      for (q = 0; q < 36; q++) if (g[q] < 0) g[q] = rnd(5);
      // réparation : toute autre grappe de 5+ perd une case (recoloriée différemment de tous ses voisins)
      for (var it = 0; it < 200; it++) {
        var seen = {}, bad = null;
        for (q = 0; q < 36 && !bad; q++) { if (seen[q] || inC[q]) continue; var comp = [q], st = [q]; seen[q] = 1; while (st.length) { var z = st.pop(); [z - N, z + N, z % N ? z - 1 : -1, z % N < N - 1 ? z + 1 : -1].forEach(function (x) { if (x >= 0 && x < 36 && !seen[x] && !inC[x] && g[x] === g[z]) { seen[x] = 1; comp.push(x); st.push(x); } }); } if (comp.length >= 5) bad = comp; }
        if (!bad) break;
        var p = bad[rnd(bad.length)], nbc = [p - N, p + N, p % N ? p - 1 : -1, p % N < N - 1 ? p + 1 : -1].filter(function (x) { return x >= 0 && x < 36; }).map(function (x) { return g[x]; });
        var free = [0, 1, 2, 3, 4].filter(function (k) { return nbc.indexOf(k) < 0; }); g[p] = free[rnd(free.length)];
      }
      return { g: g, inC: inC, col: col, size: size };
    }
    return null;
  }
  game({
    key: 'cluster', l: verb, vb: '0 0 300 286',
    chips: [0, 1, 2, 3, 4].map(function (t) { return [(t ? '' : '<defs>' + clDefs('clI') + '</defs>') + '<g transform="scale(.75)">' + crystal(t, 'clI') + '</g>', CL_P[t][0], '5+']; }),
    chipOf: function (i) { return i > 0 ? Math.floor((i - 1) / 8) : -1; },
    scene: '<defs>' + clDefs('clG') + '<radialGradient id="clBg" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#312E81"/><stop offset="1" stop-color="#0F0A2A"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0F0A2A"/><rect x="24" y="30" width="252" height="252" rx="18" fill="url(#clBg)" stroke="#818CF8" stroke-opacity=".45" stroke-width="2"/>' +
      '<g id="clCells"></g><g id="clFx"></g>' +
      '<g transform="translate(150 15)"><rect x="-46" y="-12" width="92" height="22" rx="8" fill="#0B0820" stroke="#A78BFA" stroke-opacity=".6"/><text id="clInfo" y="4" text-anchor="middle" font-size="12" font-weight="900" fill="#E9D5FF"></text></g>',
    init: function (c) {
      c.draw = function (G, inC) { var s = ''; for (var q = 0; q < 36; q++) { var x = 45 + (q % 6) * 42, y = 51 + Math.floor(q / 6) * 42; s += '<g class="cl-c' + (inC && inC[q] ? ' win' : '') + '" data-q="' + q + '" transform="translate(' + x + ' ' + y + ')"><rect x="-19" y="-19" width="38" height="38" rx="9" fill="rgba(255,255,255,.05)"/><g class="cl-s" transform="scale(1.3)">' + crystal(G[q], 'clG') + '</g></g>'; } c.id('clCells').innerHTML = s; };
      var G0 = []; for (var q = 0; q < 36; q++) G0.push((q * 7 + Math.floor(q / 6) * 3) % 5); c.draw(G0);
    },
    reset: function (c) { resetChips(c); c.id('clInfo').textContent = ''; c.id('clFx').innerHTML = ''; c.box.classList.remove('cl-won'); },
    play: async function (c, r) {
      var i = +r.view.i, G = clGrid(i); if (!G) return;
      // les cristaux tombent colonne par colonne
      var old = c.qa('.cl-c');
      await tw(c.box, 300, function (k) { old.forEach(function (e) { e.style.opacity = String(1 - k); }); });
      c.draw(G.g, G.inC);
      var cells = c.qa('.cl-c'), pos = cells.map(function (e) { var q = +e.getAttribute('data-q'); return [45 + (q % 6) * 42, 51 + Math.floor(q / 6) * 42, q % 6, Math.floor(q / 6)]; });
      await tw(c.box, 900, function (k) { cells.forEach(function (e, j) { var p = pos[j], kk = Math.max(0, Math.min(1, (k - p[2] * 0.08 - (5 - p[3]) * 0.02) / 0.5)), y = lerp(p[1] - 300, p[1], kk * kk); e.setAttribute('transform', 'translate(' + p[0] + ' ' + y.toFixed(1) + ')'); }); });
      if (i > 0) {
        c.box.classList.add('cl-won');
        c.id('clInfo').textContent = G.size + ' · ' + xm(r.mult);
        setChip(c, G.col, xm(r.mult));
        c.id('clFx').innerHTML = Object.keys(G.inC).map(function (q) { q = +q; return spark(45 + (q % 6) * 42 + 12, 51 + Math.floor(q / 6) * 42 - 12, 0.9); }).join('');
        await wait(c.box, 450);
      }
    },
    rules: {
      en: '1. Set your stake and tap “Spin”: 36 crystals drop into the 6×6 grid.\n2. 5 or more crystals of the same colour touching each other (up, down, left, right) form a cluster and pay. The bigger the cluster, the bigger the win.\n3. 5 crystals: green ×1 · blue ×1.2 · purple ×2 · red ×2.5 · gold ×5 — up to 15+: green ×25 · blue ×40 · purple ×60 · red ×125 · gold ×500. No cluster: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : 36 cristaux tombent dans la grille 6×6.\n2. 5 cristaux ou plus de la même couleur qui se touchent (haut, bas, gauche, droite) forment une grappe et paient. Plus la grappe est grande, plus tu gagnes.\n3. 5 cristaux : vert ×1 · bleu ×1.2 · violet ×2 · rouge ×2.5 · or ×5 — jusqu’à 15 et plus : vert ×25 · bleu ×40 · violet ×60 · rouge ×125 · or ×500. Pas de grappe : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Girar»: 36 cristales caen en la cuadrícula 6×6.\n2. 5 o más cristales del mismo color que se tocan (arriba, abajo, izquierda, derecha) forman un grupo y pagan. Cuanto mayor el grupo, mayor el premio.\n3. 5 cristales: verde ×1 · azul ×1.2 · morado ×2 · rojo ×2.5 · oro ×5 — hasta 15 o más: verde ×25 · azul ×40 · morado ×60 · rojo ×125 · oro ×500. Sin grupo: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Girar»: 36 cristais caem na grade 6×6.\n2. 5 ou mais cristais da mesma cor que se tocam (cima, baixo, esquerda, direita) formam um grupo e pagam. Quanto maior o grupo, maior o prêmio.\n3. 5 cristais: verde ×1 · azul ×1.2 · roxo ×2 · vermelho ×2.5 · ouro ×5 — até 15 ou mais: verde ×25 · azul ×40 · roxo ×60 · vermelho ×125 · ouro ×500. Sem grupo: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «دوّر»: تسقط 36 بلورة في الشبكة 6×6.\n2. 5 بلورات أو أكثر من اللون نفسه متلاصقة (أعلى، أسفل، يمين، يسار) تكوّن عنقودًا وتربح. كلما كبر العنقود كبر الربح.\n3. 5 بلورات: أخضر ×1 · أزرق ×1.2 · بنفسجي ×2 · أحمر ×2.5 · ذهبي ×5 — حتى 15 أو أكثر: أخضر ×25 · أزرق ×40 · بنفسجي ×60 · أحمر ×125 · ذهبي ×500. لا عنقود: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Çevir”e dokun: 36 kristal 6×6 ızgaraya düşer.\n2. Birbirine değen (yukarı, aşağı, sol, sağ) aynı renkte 5 veya daha fazla kristal bir küme oluşturur ve öder. Küme büyüdükçe kazanç artar.\n3. 5 kristal: yeşil ×1 · mavi ×1.2 · mor ×2 · kırmızı ×2.5 · altın ×5 — 15 ve üstüne kadar: yeşil ×25 · mavi ×40 · mor ×60 · kırmızı ×125 · altın ×500. Küme yoksa: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Quay»: 36 viên pha lê rơi vào lưới 6×6.\n2. Từ 5 viên cùng màu chạm nhau (trên, dưới, trái, phải) tạo thành cụm và được trả thưởng. Cụm càng lớn thắng càng nhiều.\n3. 5 viên: xanh lá ×1 · xanh dương ×1.2 · tím ×2 · đỏ ×2.5 · vàng ×5 — đến 15+: xanh lá ×25 · xanh dương ×40 · tím ×60 · đỏ ×125 · vàng ×500. Không có cụm: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Putar»: 36 kristal jatuh ke grid 6×6.\n2. 5 kristal atau lebih berwarna sama yang bersentuhan (atas, bawah, kiri, kanan) membentuk kelompok dan membayar. Makin besar kelompoknya, makin besar menangnya.\n3. 5 kristal: hijau ×1 · biru ×1.2 · ungu ×2 · merah ×2.5 · emas ×5 — hingga 15+: hijau ×25 · biru ×40 · ungu ×60 · merah ×125 · emas ×500. Tidak ada kelompok: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Крутить»: 36 кристаллов падают в сетку 6×6.\n2. 5 и более кристаллов одного цвета, касающихся друг друга (вверх, вниз, влево, вправо), образуют кластер и платят. Чем больше кластер, тем больше выигрыш.\n3. 5 кристаллов: зелёный ×1 · синий ×1.2 · фиолетовый ×2 · красный ×2.5 · золотой ×5 — до 15+: зелёный ×25 · синий ×40 · фиолетовый ×60 · красный ×125 · золотой ×500. Нет кластера — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: 36 Kristalle fallen ins 6×6-Raster.\n2. 5 oder mehr gleichfarbige Kristalle, die sich berühren (oben, unten, links, rechts), bilden einen Cluster und zahlen. Je größer der Cluster, desto höher der Gewinn.\n3. 5 Kristalle: Grün ×1 · Blau ×1.2 · Lila ×2 · Rot ×2.5 · Gold ×5 — bis 15+: Grün ×25 · Blau ×40 · Lila ×60 · Rot ×125 · Gold ×500. Kein Cluster: Einsatz verloren.',
      hi: '1. राशि चुनें और «स्पिन» छुएं: 36 क्रिस्टल 6×6 ग्रिड में गिरते हैं।\n2. एक ही रंग के 5 या ज़्यादा क्रिस्टल जो आपस में छूते हैं (ऊपर, नीचे, बाएं, दाएं) क्लस्टर बनाते हैं और भुगतान करते हैं। क्लस्टर जितना बड़ा, जीत उतनी बड़ी।\n3. 5 क्रिस्टल: हरा ×1 · नीला ×1.2 · बैंगनी ×2 · लाल ×2.5 · सुनहरा ×5 — 15+ तक: हरा ×25 · नीला ×40 · बैंगनी ×60 · लाल ×125 · सुनहरा ×500। कोई क्लस्टर नहीं: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“旋转”：36 颗水晶落入 6×6 网格。\n2. 5 颗或以上同色且相连（上下左右）的水晶组成一组并获得赔付。组越大，奖金越高。\n3. 5 颗：绿 ×1 · 蓝 ×1.2 · 紫 ×2 · 红 ×2.5 · 金 ×5——最高 15 颗以上：绿 ×25 · 蓝 ×40 · 紫 ×60 · 红 ×125 · 金 ×500。没有成组：输掉下注。'
    }
  });

  /* =============================== MEGA REELS (megaways) =============================== */
  // 6 rouleaux de 2 à 7 symboles. Gain = valeur du symbole (3/4/5/6 rouleaux) × nombre de façons (produit des symboles gagnants par rouleau).
  // ligne 0 = perdu ; ligne 1 + symbole×16 + (rouleaux−3)×4 + n° des façons (1,2,4,8)
  var MW_P = [[0.5, 1, 2, 4], [0.5, 1, 2, 4], [0.8, 1.5, 3, 6], [0.8, 1.5, 3, 6], [1, 2, 5, 12], [1.5, 3, 8, 20], [2, 5, 12, 30], [4, 10, 25, 100]], MW_W = [1, 2, 4, 8];
  function mwSym(t) {
    return [
      '<circle r="9" fill="#CBD5E1" stroke="#64748B"/><circle cx="-3" cy="-2" r="2.2" fill="#94A3B8"/><circle cx="3" cy="3" r="1.6" fill="#94A3B8"/>',
      '<path d="M-10 8L4-6" stroke="#67E8F9" stroke-width="4" stroke-linecap="round" opacity=".6"/><circle cx="5" cy="-5" r="5" fill="#ECFEFF" stroke="#06B6D4"/>',
      '<circle r="7" fill="#FB923C" stroke="#C2410C"/><ellipse rx="12" ry="3.5" fill="none" stroke="#FED7AA" stroke-width="1.6" transform="rotate(-18)"/>',
      '<path d="M0-10l2.9 6 6.6.9-4.8 4.6 1.2 6.5L0 4.9-5.9 8l1.2-6.5-4.8-4.6 6.6-.9z" fill="#FDE047" stroke="#CA8A04"/>',
      '<ellipse cy="2" rx="8" ry="7.5" fill="#4ADE80" stroke="#15803D"/><circle cx="-3" cy="0" r="2.4" fill="#052E16"/><circle cx="3" cy="0" r="2.4" fill="#052E16"/><path d="M-4-6l-3-5M4-6l3-5" stroke="#15803D" stroke-width="1.6"/>',
      '<path d="M0-12C5-7 5 2 3 7H-3C-5 2-5-7 0-12z" fill="#F87171" stroke="#991B1B"/><circle cy="-3" r="2.2" fill="#E0F2FE"/><path d="M-3 7l-3 5h4zM3 7l3 5h-4z" fill="#FBBF24"/>',
      '<circle r="9.5" fill="#F8FAFC" stroke="#94A3B8"/><rect x="-6.5" y="-4.5" width="13" height="8" rx="4" fill="#1E3A8A"/><path d="M-4-2.5h3" stroke="#93C5FD" stroke-width="1.4" stroke-linecap="round"/>',
      '<path d="M-10 6h20l2-13-6 5-6-9-6 9-6-5z" fill="#FBBF24" stroke="#92400E"/><circle cy="-1" r="2" fill="#E11D48"/>'][t];
  }
  function mwCombo(line) {
    if (line === 0) return { s: -1, k: 0, cnt: [] };
    var x = line - 1, s = Math.floor(x / 16), k = 3 + Math.floor((x % 16) / 4), w = MW_W[x % 4], cnt = [];
    for (var j = 0; j < k; j++) cnt.push(1);
    if (w === 2) cnt[rnd(k)] = 2; else if (w === 4) { if (rnd(2)) cnt[rnd(k)] = 4; else { var a = shuffle(cnt.map(function (v, j2) { return j2; })); cnt[a[0]] = 2; cnt[a[1]] = 2; } }
    else if (w === 8) { var b = shuffle(cnt.map(function (v, j2) { return j2; })); if (rnd(2)) { cnt[b[0]] = 2; cnt[b[1]] = 2; cnt[b[2]] = 2; } else { cnt[b[0]] = 4; cnt[b[1]] = 2; } }
    return { s: s, k: k, cnt: cnt, ways: w };
  }
  function mwReels(line) {
    var cb = mwCombo(line), others = shuffle([0, 1, 2, 3, 4, 5, 6, 7].filter(function (t) { return t !== cb.s; })), A = others.slice(0, 3), B = others.slice(3), reels = [];
    for (var j = 0; j < 6; j++) {
      var need = j < cb.k ? cb.cnt[j] : 0, h = Math.max(need + (need ? rnd(2) : 0), 2 + rnd(6)); h = Math.min(7, Math.max(2, h));
      var pool = j === 0 ? A : j === 1 ? B : others, col = [];
      for (var q = 0; q < h - need; q++) col.push(pool[rnd(pool.length)]);
      for (q = 0; q < need; q++) col.splice(rnd(col.length + 1), 0, cb.s);
      if (j > cb.k - 1 && j > 1 && cb.s >= 0 && j !== cb.k && rnd(3) === 0) col[rnd(col.length)] = cb.s; // décor : le symbole peut réapparaître après la chaîne
      reels.push(col);
    }
    return { reels: reels, cb: cb };
  }
  var MX0 = 30, MW = 40, MY0 = 46, MH = 196;
  game({
    key: 'megaways', l: verb, vb: '0 0 300 268',
    chips: [0, 1, 2, 3, 4, 5, 6, 7].map(function (t) { return [mwSym(t), MW_P[t][3]]; }),
    chipOf: function (i) { return i > 0 ? Math.floor((i - 1) / 16) : -1; },
    scene: '<defs><linearGradient id="mwBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E1B4B"/><stop offset="1" stop-color="#0B0820"/></linearGradient>' +
      '<clipPath id="mwClip"><rect x="' + MX0 + '" y="' + MY0 + '" width="' + (MW * 6) + '" height="' + MH + '"/></clipPath></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0B0820"/><rect x="' + (MX0 - 10) + '" y="' + (MY0 - 10) + '" width="' + (MW * 6 + 20) + '" height="' + (MH + 20) + '" rx="16" fill="url(#mwBg)" stroke="#F472B6" stroke-opacity=".5" stroke-width="2"/>' +
      [1, 2, 3, 4, 5].map(function (j) { return '<path d="M' + (MX0 + j * MW) + ' ' + MY0 + 'V' + (MY0 + MH) + '" stroke="#fff" stroke-opacity=".08"/>'; }).join('') +
      '<g clip-path="url(#mwClip)"><g id="mwReels"></g></g><g id="mwFx"></g>' +
      '<g transform="translate(150 16)"><rect x="-60" y="-12" width="120" height="22" rx="8" fill="#0B0820" stroke="#F472B6" stroke-opacity=".6"/><text id="mwWays" y="4" text-anchor="middle" font-size="12" font-weight="900" fill="#FBCFE8" font-family="monospace"></text></g>' +
      '<g transform="translate(150 ' + (MY0 + MH + 18) + ')"><text id="mwInfo" text-anchor="middle" font-size="11" font-weight="900" fill="#FDE68A"></text></g>',
    init: function (c) {
      c.draw = function (reels, cb, spin) {
        var s = '';
        reels.forEach(function (col, j) {
          var h = MH / col.length, sc = Math.min(1.35, h / 24);
          s += '<g class="mw-r" data-j="' + j + '">' + col.map(function (t, q) { var win = cb && j < cb.k && t === cb.s; return '<g class="mw-c' + (win ? ' win' : '') + '" transform="translate(' + (MX0 + MW * j + MW / 2) + ' ' + (MY0 + h * q + h / 2).toFixed(1) + ') scale(' + sc.toFixed(2) + ')">' + mwSym(t) + '</g>'; }).join('') + '</g>';
        });
        c.id('mwReels').innerHTML = s;
        var ways = reels.reduce(function (a, col) { return a * col.length; }, 1);
        c.id('mwWays').textContent = ways.toLocaleString('en-US').replace(/,/g, ' ');
      };
      var demo = []; for (var j = 0; j < 6; j++) { var col = []; for (var q = 0; q < 3 + (j % 3); q++) col.push((j * 3 + q) % 8); demo.push(col); } c.draw(demo);
    },
    reset: function (c) { resetChips(c); c.id('mwInfo').textContent = ''; c.id('mwFx').innerHTML = ''; c.box.classList.remove('mw-won'); },
    play: async function (c, r) {
      var i = +r.view.i, R = mwReels(i), cb = R.cb, reels = c.qa('.mw-r');
      // les rouleaux tournent puis s'arrêtent de gauche à droite
      var t0 = performance.now();
      await tw(c.box, 500, function (k) { reels.forEach(function (e) { e.setAttribute('transform', 'translate(0 ' + (k * MH).toFixed(1) + ')'); e.style.opacity = String(1 - k); }); });
      c.draw(R.reels, cb);
      var nr = c.qa('.mw-r');
      nr.forEach(function (e) { e.setAttribute('transform', 'translate(0 ' + (-MH) + ')'); });
      await tw(c.box, 1100, function (k) { nr.forEach(function (e, j) { var kk = Math.max(0, Math.min(1, (k - j * 0.1) / 0.5)), y = -MH * (1 - kk); y += Math.sin(Math.min(1, kk) * Math.PI) * 6 * (kk > 0.8 ? 1 : 0); e.setAttribute('transform', 'translate(0 ' + y.toFixed(1) + ')'); }); });
      if (i > 0) {
        c.box.classList.add('mw-won');
        c.id('mwInfo').textContent = cb.k + ' × ' + cb.ways + ' → ' + xm(r.mult);
        setChip(c, cb.s, xm(r.mult));
        await wait(c.box, 450);
      }
    },
    rules: {
      en: '1. Set your stake and tap “Spin”: 6 reels stop, each showing 2 to 7 symbols — up to 117 649 ways to win.\n2. A symbol pays when it appears on adjacent reels from the left (at least 3 reels). Win = its value × the number of ways (how many of it on each reel, multiplied).\n3. Value for 3 / 4 / 5 / 6 reels: moon & comet ×0.5 / ×1 / ×2 / ×4 · ring planet & star ×0.8 / ×1.5 / ×3 / ×6 · alien ×1 / ×2 / ×5 / ×12 · rocket ×1.5 / ×3 / ×8 / ×20 · astronaut ×2 / ×5 / ×12 / ×30 · crown ×4 / ×10 / ×25 / ×100.',
      fr: '1. Choisis ta mise et touche « Lancer » : 6 rouleaux s’arrêtent, chacun avec 2 à 7 symboles — jusqu’à 117 649 façons de gagner.\n2. Un symbole paie s’il est sur des rouleaux voisins depuis la gauche (au moins 3). Gain = sa valeur × le nombre de façons (combien il y en a sur chaque rouleau, multipliés).\n3. Valeur pour 3 / 4 / 5 / 6 rouleaux : lune et comète ×0.5 / ×1 / ×2 / ×4 · planète à anneau et étoile ×0.8 / ×1.5 / ×3 / ×6 · alien ×1 / ×2 / ×5 / ×12 · fusée ×1.5 / ×3 / ×8 / ×20 · astronaute ×2 / ×5 / ×12 / ×30 · couronne ×4 / ×10 / ×25 / ×100.',
      es: '1. Elige tu apuesta y toca «Girar»: se detienen 6 rodillos, cada uno con 2 a 7 símbolos: hasta 117 649 formas de ganar.\n2. Un símbolo paga si aparece en rodillos contiguos desde la izquierda (al menos 3). Premio = su valor × el número de formas (cuántos hay en cada rodillo, multiplicados).\n3. Valor para 3 / 4 / 5 / 6 rodillos: luna y cometa ×0.5 / ×1 / ×2 / ×4 · planeta con anillo y estrella ×0.8 / ×1.5 / ×3 / ×6 · alien ×1 / ×2 / ×5 / ×12 · cohete ×1.5 / ×3 / ×8 / ×20 · astronauta ×2 / ×5 / ×12 / ×30 · corona ×4 / ×10 / ×25 / ×100.',
      pt: '1. Escolha o valor e toque em «Girar»: 6 rolos param, cada um com 2 a 7 símbolos — até 117 649 formas de ganhar.\n2. Um símbolo paga se aparecer em rolos vizinhos a partir da esquerda (pelo menos 3). Prêmio = seu valor × o número de formas (quantos há em cada rolo, multiplicados).\n3. Valor para 3 / 4 / 5 / 6 rolos: lua e cometa ×0.5 / ×1 / ×2 / ×4 · planeta com anel e estrela ×0.8 / ×1.5 / ×3 / ×6 · alien ×1 / ×2 / ×5 / ×12 · foguete ×1.5 / ×3 / ×8 / ×20 · astronauta ×2 / ×5 / ×12 / ×30 · coroa ×4 / ×10 / ×25 / ×100.',
      ar: '1. اختر الرهان والمس «دوّر»: تتوقف 6 بكرات، في كل منها من 2 إلى 7 رموز — حتى 117 649 طريقة للفوز.\n2. يربح الرمز إذا ظهر على بكرات متجاورة من اليسار (3 على الأقل). الربح = قيمته × عدد الطرق (عدد ظهوره في كل بكرة مضروبة معًا).\n3. القيمة لـ 3 / 4 / 5 / 6 بكرات: القمر والمذنب ×0.5 / ×1 / ×2 / ×4 · الكوكب ذو الحلقة والنجمة ×0.8 / ×1.5 / ×3 / ×6 · الكائن الفضائي ×1 / ×2 / ×5 / ×12 · الصاروخ ×1.5 / ×3 / ×8 / ×20 · رائد الفضاء ×2 / ×5 / ×12 / ×30 · التاج ×4 / ×10 / ×25 / ×100.',
      tr: '1. Bahsini seç ve “Çevir”e dokun: 6 makara durur, her birinde 2 ila 7 sembol — 117 649’a kadar kazanma yolu.\n2. Bir sembol soldan itibaren yan yana makaralarda (en az 3) çıkarsa öder. Kazanç = değeri × yol sayısı (her makaradaki adetlerin çarpımı).\n3. 3 / 4 / 5 / 6 makara için değer: ay ve kuyruklu yıldız ×0.5 / ×1 / ×2 / ×4 · halkalı gezegen ve yıldız ×0.8 / ×1.5 / ×3 / ×6 · uzaylı ×1 / ×2 / ×5 / ×12 · roket ×1.5 / ×3 / ×8 / ×20 · astronot ×2 / ×5 / ×12 / ×30 · taç ×4 / ×10 / ×25 / ×100.',
      vi: '1. Chọn mức cược và chạm «Quay»: 6 cuộn dừng lại, mỗi cuộn có 2 đến 7 biểu tượng — tới 117 649 cách thắng.\n2. Một biểu tượng được trả khi xuất hiện trên các cuộn liền nhau từ trái (ít nhất 3 cuộn). Tiền thắng = giá trị × số cách (số lượng trên mỗi cuộn nhân với nhau).\n3. Giá trị cho 3 / 4 / 5 / 6 cuộn: mặt trăng và sao chổi ×0.5 / ×1 / ×2 / ×4 · hành tinh vành đai và ngôi sao ×0.8 / ×1.5 / ×3 / ×6 · người ngoài hành tinh ×1 / ×2 / ×5 / ×12 · tên lửa ×1.5 / ×3 / ×8 / ×20 · phi hành gia ×2 / ×5 / ×12 / ×30 · vương miện ×4 / ×10 / ×25 / ×100.',
      id: '1. Atur taruhan lalu sentuh «Putar»: 6 gulungan berhenti, masing-masing 2 sampai 7 simbol — hingga 117 649 cara menang.\n2. Simbol membayar jika muncul di gulungan berdampingan dari kiri (minimal 3). Kemenangan = nilainya × jumlah cara (jumlah di tiap gulungan, dikalikan).\n3. Nilai untuk 3 / 4 / 5 / 6 gulungan: bulan & komet ×0.5 / ×1 / ×2 / ×4 · planet bercincin & bintang ×0.8 / ×1.5 / ×3 / ×6 · alien ×1 / ×2 / ×5 / ×12 · roket ×1.5 / ×3 / ×8 / ×20 · astronaut ×2 / ×5 / ×12 / ×30 · mahkota ×4 / ×10 / ×25 / ×100.',
      ru: '1. Выберите ставку и нажмите «Крутить»: останавливаются 6 барабанов, на каждом от 2 до 7 символов — до 117 649 способов выиграть.\n2. Символ платит, если он есть на соседних барабанах слева (минимум 3). Выигрыш = его стоимость × число способов (сколько его на каждом барабане, перемноженное).\n3. Стоимость за 3 / 4 / 5 / 6 барабанов: луна и комета ×0.5 / ×1 / ×2 / ×4 · планета с кольцом и звезда ×0.8 / ×1.5 / ×3 / ×6 · пришелец ×1 / ×2 / ×5 / ×12 · ракета ×1.5 / ×3 / ×8 / ×20 · космонавт ×2 / ×5 / ×12 / ×30 · корона ×4 / ×10 / ×25 / ×100.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: 6 Walzen stoppen, jede mit 2 bis 7 Symbolen — bis zu 117 649 Gewinnwege.\n2. Ein Symbol zahlt, wenn es auf benachbarten Walzen ab links liegt (mindestens 3). Gewinn = sein Wert × Zahl der Wege (Anzahl auf jeder Walze, multipliziert).\n3. Wert für 3 / 4 / 5 / 6 Walzen: Mond & Komet ×0.5 / ×1 / ×2 / ×4 · Ringplanet & Stern ×0.8 / ×1.5 / ×3 / ×6 · Alien ×1 / ×2 / ×5 / ×12 · Rakete ×1.5 / ×3 / ×8 / ×20 · Astronaut ×2 / ×5 / ×12 / ×30 · Krone ×4 / ×10 / ×25 / ×100.',
      hi: '1. राशि चुनें और «स्पिन» छुएं: 6 रील रुकती हैं, हर रील पर 2 से 7 सिंबल — जीतने के 117 649 तक तरीके।\n2. कोई सिंबल बाईं ओर से लगातार रीलों (कम से कम 3) पर हो तो भुगतान करता है। जीत = उसका मान × तरीकों की संख्या (हर रील पर उसकी गिनती का गुणनफल)।\n3. 3 / 4 / 5 / 6 रील का मान: चांद और धूमकेतु ×0.5 / ×1 / ×2 / ×4 · छल्ले वाला ग्रह और तारा ×0.8 / ×1.5 / ×3 / ×6 · एलियन ×1 / ×2 / ×5 / ×12 · रॉकेट ×1.5 / ×3 / ×8 / ×20 · अंतरिक्ष यात्री ×2 / ×5 / ×12 / ×30 · ताज ×4 / ×10 / ×25 / ×100।',
      zh: '1. 设定金额并点击“旋转”：6 个卷轴停下，每个显示 2 到 7 个符号——最多 117 649 种中奖方式。\n2. 符号从左起出现在相邻卷轴上（至少 3 个）即可赔付。奖金 = 符号价值 × 方式数（每个卷轴上该符号数量相乘）。\n3. 3 / 4 / 5 / 6 个卷轴的价值：月亮与彗星 ×0.5 / ×1 / ×2 / ×4 · 光环行星与星星 ×0.8 / ×1.5 / ×3 / ×6 · 外星人 ×1 / ×2 / ×5 / ×12 · 火箭 ×1.5 / ×3 / ×8 / ×20 · 宇航员 ×2 / ×5 / ×12 / ×30 · 皇冠 ×4 / ×10 / ×25 / ×100。'
    }
  });

  /* =============================== COIN LINK (hold & win) =============================== */
  // grille 5×3. 6 pièces ou plus → les pièces restent, 3 relances (remises à 3 à chaque nouvelle pièce). Gain = somme des pièces ;
  // les 15 cases remplies = GRAND ×500 (payé à la place). ligne 0 = moins de 6 pièces ; lignes 1…17 = total 3…250 ; ligne 18 = GRAND.
  var CLT = [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100, 150, 250, 500], CV = [0.5, 1, 2, 3, 5, 10, 25, 100];
  function coinParts(T) {
    for (var t = 0; t < 4000; t++) {
      var maxN = Math.min(14, Math.floor(T * 2)), n = 6 + rnd(Math.max(1, maxN - 5)), rem = T, vals = [];
      for (var j = 0; j < n - 1; j++) { var left = n - 1 - j, ok = CV.filter(function (v) { return v <= rem - 0.5 * left + 1e-9 && (v < 25 || Math.random() < 0.5); }); if (!ok.length) break; var v = ok[rnd(Math.min(ok.length, 4 + rnd(4)))]; vals.push(v); rem = Math.round((rem - v) * 10) / 10; }
      if (vals.length === n - 1 && CV.indexOf(rem) >= 0) { vals.push(rem); return shuffle(vals); }
    }
    // secours sûr : décomposition gloutonne puis on coupe les pièces jusqu'à en avoir 6
    var g = [], r2 = T; CV.slice().reverse().forEach(function (v) { while (r2 >= v - 1e-9) { g.push(v); r2 = Math.round((r2 - v) * 10) / 10; } });
    var SPLIT = { 100: [25, 25, 25, 25], 25: [10, 10, 5], 10: [5, 5], 5: [3, 2], 3: [2, 1], 2: [1, 1], 1: [0.5, 0.5] };
    while (g.length < 6) { g.sort(function (a, b) { return b - a; }); var big = g.shift(); g = g.concat(SPLIT[big] || [big]); }
    return shuffle(g);
  }
  function coinSvg(v) { var lbl = v === 25 ? 'MINI' : v === 100 ? 'MAJOR' : v === 'G' ? 'GRAND' : xm(v); return '<circle r="17" fill="url(#lkC)" stroke="#92400E" stroke-width="1.4"/><circle r="13" fill="none" stroke="#FEF3C7" stroke-opacity=".7"/><text y="4" text-anchor="middle" font-size="' + (lbl.length > 4 ? 7.5 : 10) + '" font-weight="900" fill="#78350F">' + lbl + '</text>'; }
  var LKX = function (q) { return 50 + (q % 5) * 50; }, LKY = function (q) { return 74 + Math.floor(q / 5) * 52; };
  game({
    key: 'coinlink', l: verb, vb: '0 0 300 250',
    chips: [['<circle r="9" fill="#FBBF24" stroke="#92400E"/><text y="3.5" font-size="8" font-weight="900" text-anchor="middle" fill="#78350F">6+</text>', 0, '6+'], ['<circle r="9" fill="#FBBF24" stroke="#92400E"/><text y="3" font-size="5.5" font-weight="900" text-anchor="middle" fill="#78350F">MINI</text>', 25], ['<circle r="9" fill="#FBBF24" stroke="#92400E"/><text y="3" font-size="4.6" font-weight="900" text-anchor="middle" fill="#78350F">MAJOR</text>', 100], ['<circle r="9" fill="#F59E0B" stroke="#fff"/><text y="3" font-size="4.6" font-weight="900" text-anchor="middle" fill="#fff">GRAND</text>', 500]],
    chipOf: function (i) { return i === 18 ? 3 : i > 0 ? 0 : -1; },
    scene: '<defs><radialGradient id="lkC" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".55" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></radialGradient>' +
      '<linearGradient id="lkBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B0764"/><stop offset="1" stop-color="#1E1B4B"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#12082A"/><rect x="18" y="42" width="264" height="168" rx="16" fill="url(#lkBg)" stroke="#FBBF24" stroke-opacity=".5" stroke-width="2"/>' +
      (function () { var s = ''; for (var q = 0; q < 15; q++) s += '<rect x="' + (LKX(q) - 22) + '" y="' + (LKY(q) - 22) + '" width="44" height="44" rx="10" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.08)" class="lk-cell" id="lkQ' + q + '"/>'; return s; })() +
      '<g id="lkCoins"></g>' +
      '<g transform="translate(70 22)"><rect x="-52" y="-13" width="104" height="24" rx="8" fill="#0B0820" stroke="#FBBF24" stroke-opacity=".5"/><g id="lkSpins"></g></g>' +
      '<g transform="translate(222 22)"><rect x="-56" y="-13" width="112" height="24" rx="8" fill="#0B0820" stroke="#FBBF24" stroke-opacity=".5"/><text id="lkTot" y="4" text-anchor="middle" font-size="12" font-weight="900" fill="#FDE68A"></text></g>' +
      '<g id="lkGrand" opacity="0" transform="translate(150 142)"><rect x="-80" y="-24" width="160" height="44" rx="14" fill="#B45309" stroke="#FEF3C7" stroke-width="2"/><text y="8" text-anchor="middle" font-size="22" font-weight="900" fill="#FEF3C7">GRAND ×500</text></g>' +
      '<g transform="translate(150 230)"><g id="lkPips"></g></g>',
    init: function (c) {
      c.pips = function (n) { c.id('lkSpins').innerHTML = [0, 1, 2].map(function (j) { return '<circle cx="' + ((j - 1) * 22) + '" r="7" fill="' + (j < n ? '#22C55E' : '#334155') + '" stroke="#fff" stroke-opacity=".3"/>'; }).join(''); };
      c.pips(3);
      var demo = [1, 7, 11, 13]; c.id('lkCoins').innerHTML = demo.map(function (q, j) { return '<g transform="translate(' + LKX(q) + ' ' + LKY(q) + ')">' + coinSvg([1, 2, 5, 0.5][j]) + '</g>'; }).join('');
    },
    reset: function (c) { c.id('lkTot').textContent = ''; c.pips(3); c.id('lkGrand').setAttribute('opacity', '0'); c.qa('.lk-cell').forEach(function (e) { e.classList.remove('held'); }); },
    play: async function (c, r) {
      var i = +r.view.i, coins = c.id('lkCoins'), tot = c.id('lkTot'), cells = shuffle(Array.apply(null, Array(15)).map(function (x, j) { return j; }));
      var spinIn = async function (list) { // list : [[case, valeur]]
        coins.insertAdjacentHTML('beforeend', list.map(function (p) { return '<g class="lk-n" data-q="' + p[0] + '" transform="translate(' + LKX(p[0]) + ' ' + LKY(p[0]) + ') scale(0)">' + coinSvg(p[1]) + '</g>'; }).join(''));
        var els = c.qa('.lk-n'); els.forEach(function (e) { e.classList.remove('lk-n'); });
        await tw(c.box, 380, function (k) { els.forEach(function (e, j) { var q = +e.getAttribute('data-q'), kk = Math.max(0, Math.min(1, k * 1.6 - j * 0.08)), s = kk < 1 ? kk * 1.15 : 1; e.setAttribute('transform', 'translate(' + LKX(q) + ' ' + LKY(q) + ') scale(' + s.toFixed(2) + ' ' + (s * (0.6 + 0.4 * Math.abs(Math.cos(kk * Math.PI * 2)))).toFixed(2) + ')'); }); });
      };
      var sumNow = 0, show = function () { tot.textContent = xm(Math.round(sumNow * 10) / 10); };
      // 1er tirage
      coins.innerHTML = '';
      await tw(c.box, 300, function (k) { c.qa('.lk-cell').forEach(function (e) { e.style.opacity = String(0.4 + 0.6 * Math.abs(Math.cos(k * Math.PI * 2))); }); });
      if (i === 0) { var n0 = rnd(6); await spinIn(cells.slice(0, n0).map(function (q) { return [q, CV[rnd(5)]]; })); return; }
      var grand = i === 18, vals = grand ? Array.apply(null, Array(15)).map(function () { return CV[rnd(6)]; }) : coinParts(CLT[i - 1]);
      var n = vals.length, first = Math.min(n, 6 + rnd(Math.min(3, n - 5))), placed = 0, lives = 3;
      await spinIn(cells.slice(0, first).map(function (q, j) { return [q, vals[j]]; }));
      for (var j = 0; j < first; j++) { sumNow += vals[j]; c.id('lkQ' + cells[j]).classList.add('held'); }
      placed = first; show(); await wait(c.box, 350);
      // relances : chaque nouvelle pièce remet le compteur à 3
      while (lives > 0 && placed < 15) {
        var add = placed < n && (lives === 1 || rnd(3) > 0) ? Math.min(n - placed, 1 + (rnd(4) === 0 ? 1 : 0)) : 0;
        await tw(c.box, 260, function (k) { c.qa('.lk-cell:not(.held)').forEach(function (e) { e.style.opacity = String(0.35 + 0.65 * Math.abs(Math.cos(k * Math.PI))); }); });
        if (add) {
          var lst = []; for (var a = 0; a < add; a++) { lst.push([cells[placed], vals[placed]]); sumNow += vals[placed]; c.id('lkQ' + cells[placed]).classList.add('held'); placed++; }
          await spinIn(lst); show(); lives = 3;
        } else lives--;
        c.pips(lives); await wait(c.box, 160);
      }
      if (grand) { c.id('lkGrand').setAttribute('opacity', '1'); tot.textContent = xm(500); }
      else { tot.textContent = xm(r.mult); }
      setChip(c, grand ? 3 : 0, xm(r.mult));
    },
    rules: {
      en: '1. Set your stake and tap “Spin”: gold coins with values land on the 15 spots.\n2. 6 coins or more start the feature: they stay, you get 3 respins, and every new coin resets the respins to 3.\n3. Win = the sum of all coins (MINI ×25 · MAJOR ×100). Fill all 15 spots: GRAND ×500 instead. Fewer than 6 coins: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : des pièces d’or avec leur valeur tombent sur les 15 cases.\n2. 6 pièces ou plus lancent le bonus : elles restent, tu as 3 relances, et chaque nouvelle pièce remet les relances à 3.\n3. Gain = la somme de toutes les pièces (MINI ×25 · MAJOR ×100). Les 15 cases remplies : GRAND ×500 à la place. Moins de 6 pièces : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Girar»: monedas de oro con su valor caen en las 15 casillas.\n2. 6 monedas o más activan el bono: se quedan, tienes 3 re-giros y cada moneda nueva los vuelve a poner en 3.\n3. Premio = la suma de todas las monedas (MINI ×25 · MAJOR ×100). Las 15 casillas llenas: GRAND ×500 en su lugar. Menos de 6 monedas: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Girar»: moedas de ouro com valores caem nas 15 casas.\n2. 6 moedas ou mais ativam o bônus: elas ficam, você ganha 3 re-giros e cada moeda nova volta os re-giros a 3.\n3. Prêmio = a soma de todas as moedas (MINI ×25 · MAJOR ×100). As 15 casas cheias: GRAND ×500 no lugar. Menos de 6 moedas: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «دوّر»: تسقط عملات ذهبية بقيمها على الخانات الخمس عشرة.\n2. 6 عملات أو أكثر تبدأ الميزة: تبقى العملات، وتحصل على 3 إعادات، وكل عملة جديدة تعيد العدّاد إلى 3.\n3. الربح = مجموع كل العملات (MINI ×25 · MAJOR ×100). ملء الخانات الـ15: GRAND ×500 بدلًا من ذلك. أقل من 6 عملات: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Çevir”e dokun: değerli altın paralar 15 kareye düşer.\n2. 6 veya daha fazla para özelliği başlatır: paralar kalır, 3 tekrar çevirme alırsın ve her yeni para sayacı 3’e döndürür.\n3. Kazanç = tüm paraların toplamı (MINI ×25 · MAJOR ×100). 15 kare dolarsa: onun yerine GRAND ×500. 6’dan az para: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Quay»: các đồng xu vàng có giá trị rơi vào 15 ô.\n2. Từ 6 xu trở lên kích hoạt tính năng: xu được giữ lại, bạn có 3 lượt quay lại và mỗi xu mới đặt lại về 3.\n3. Tiền thắng = tổng giá trị các xu (MINI ×25 · MAJOR ×100). Lấp đầy 15 ô: thay bằng GRAND ×500. Dưới 6 xu: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Putar»: koin emas bernilai jatuh ke 15 kotak.\n2. 6 koin atau lebih memulai fitur: koin tetap, kamu dapat 3 putaran ulang, dan setiap koin baru mengembalikannya ke 3.\n3. Kemenangan = jumlah semua koin (MINI ×25 · MAJOR ×100). Semua 15 kotak terisi: GRAND ×500 sebagai gantinya. Kurang dari 6 koin: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Крутить»: золотые монеты с номиналами падают на 15 ячеек.\n2. 6 монет и больше запускают бонус: монеты остаются, вы получаете 3 повторных вращения, каждая новая монета снова даёт 3.\n3. Выигрыш = сумма всех монет (MINI ×25 · MAJOR ×100). Все 15 ячеек заполнены — вместо этого GRAND ×500. Меньше 6 монет — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: Goldmünzen mit Werten landen auf den 15 Feldern.\n2. 6 oder mehr Münzen starten das Feature: Sie bleiben liegen, du bekommst 3 Respins, jede neue Münze setzt sie wieder auf 3.\n3. Gewinn = Summe aller Münzen (MINI ×25 · MAJOR ×100). Alle 15 Felder voll: stattdessen GRAND ×500. Weniger als 6 Münzen: Einsatz verloren.',
      hi: '1. राशि चुनें और «स्पिन» छुएं: मूल्य वाले सोने के सिक्के 15 खानों पर गिरते हैं।\n2. 6 या ज़्यादा सिक्के फ़ीचर शुरू करते हैं: सिक्के रुके रहते हैं, 3 री-स्पिन मिलते हैं और हर नया सिक्का गिनती फिर 3 कर देता है।\n3. जीत = सभी सिक्कों का जोड़ (MINI ×25 · MAJOR ×100)। सभी 15 खाने भरें: इसके बजाय GRAND ×500। 6 से कम सिक्के: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“旋转”：带数值的金币落在 15 个格子上。\n2. 6 枚或以上金币触发特色玩法：金币保留，获得 3 次重转，每出现一枚新金币重转次数恢复为 3。\n3. 奖金 = 所有金币数值之和（MINI ×25 · MAJOR ×100）。填满 15 格：改为 GRAND ×500。少于 6 枚金币：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
