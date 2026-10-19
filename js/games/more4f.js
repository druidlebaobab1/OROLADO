/* v2830 — more4f (owner request, round 5): Safe Cracker, Snakes & Ladders, Bingo 75, Craps, Checkers Jump, Four in a Row — new instant games; the scene always shows exactly the line (or option) the server drew (casino_ext/more4.php). */
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
    en: { crack: 'Crack', roll: 'Roll', play: 'Play', pass: 'Pass', dpass: 'Don’t Pass' },
    fr: { crack: 'Forcer', roll: 'Lancer', play: 'Jouer', pass: 'Passe', dpass: 'Ne passe pas' },
    es: { crack: 'Abrir', roll: 'Tirar', play: 'Jugar', pass: 'Pase', dpass: 'No pase' },
    pt: { crack: 'Arrombar', roll: 'Rolar', play: 'Jogar', pass: 'Passe', dpass: 'Não passe' },
    ar: { crack: 'افتح', roll: 'ارمِ', play: 'العب', pass: 'تمرير', dpass: 'عدم التمرير' },
    tr: { crack: 'Kır', roll: 'At', play: 'Oyna', pass: 'Pas', dpass: 'Pas değil' },
    vi: { crack: 'Phá khóa', roll: 'Gieo', play: 'Chơi', pass: 'Qua', dpass: 'Không qua' },
    id: { crack: 'Bobol', roll: 'Lempar', play: 'Main', pass: 'Lolos', dpass: 'Tidak lolos' },
    ru: { crack: 'Взломать', roll: 'Бросить', play: 'Играть', pass: 'Пас', dpass: 'Не пас' },
    de: { crack: 'Knacken', roll: 'Würfeln', play: 'Spielen', pass: 'Pass', dpass: 'Kein Pass' },
    hi: { crack: 'तोड़ें', roll: 'फेंकें', play: 'खेलें', pass: 'पास', dpass: 'नो पास' },
    zh: { crack: '开锁', roll: '掷骰', play: '开始', pass: '过关', dpass: '不过关' }
  };
  function verb(k) { return function () { var v = Lx(V); return { verb: v[k], pass: v.pass, dpass: v.dpass }; }; }
  function die(v, s) { var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v]; s = s || 1; return '<rect x="' + (-10 * s) + '" y="' + (-10 * s) + '" width="' + (20 * s) + '" height="' + (20 * s) + '" rx="' + (5 * s) + '" fill="#fff" stroke="#CBD5E1"/>' + P.map(function (p) { return '<circle cx="' + (p[0] * 5.5 * s).toFixed(1) + '" cy="' + (p[1] * 5.5 * s).toFixed(1) + '" r="' + (2 * s).toFixed(1) + '" fill="#DC2626"/>'; }).join(''); }

  /* =============================== SAFE CRACKER =============================== */
  // 0 / 1 / 2 rouleaux justes (2 ×0.5) ; 3 justes = le coffre s'ouvre : 3 billets ×1.5 · 4 lingots ×4 · 5 bijoux ×12 · 6 diamant ×100
  function loot(t) {
    if (t === 3) return '<g><rect x="-16" y="-8" width="32" height="16" rx="2" fill="#16A34A" stroke="#14532D"/><circle r="5" fill="none" stroke="#BBF7D0" stroke-width="1.5"/><rect x="-16" y="-14" width="32" height="16" rx="2" fill="#22C55E" stroke="#14532D" opacity=".9"/><circle cy="-6" r="5" fill="none" stroke="#DCFCE7" stroke-width="1.5"/></g>';
    if (t === 4) return '<g>' + [[-12, 4], [12, 4], [0, -8]].map(function (p) { return '<path d="M' + (p[0] - 11) + ' ' + (p[1] + 6) + 'l4-12h14l4 12z" fill="url(#sfGold)" stroke="#92400E" stroke-width=".8"/>'; }).join('') + '</g>';
    if (t === 5) return '<g><path d="M-16-6Q0 16 16-6" fill="none" stroke="#FDE68A" stroke-width="1.6"/>' + [-12, -6, 0, 6, 12].map(function (x) { return '<circle cx="' + x + '" cy="' + (-6 + (1 - Math.pow(x / 16, 2)) * 10).toFixed(1) + '" r="3" fill="#F472B6"/>'; }).join('') + '<path d="M0 6l-5 5 5 7 5-7z" fill="#E11D48"/></g>';
    return '<g><path d="M-14-6h28l-14 22z" fill="url(#sfDia)" stroke="#E0F2FE"/><path d="M-14-6l6-8h16l6 8z" fill="#BAE6FD" stroke="#E0F2FE"/><path d="M-8-14l2 8 6-8 6 8 2-8M-14-6L0 16 14-6" stroke="#fff" stroke-width=".7" fill="none" opacity=".8"/></g>';
  }
  game({
    key: 'safe', l: verb('crack'), vb: '0 0 300 250',
    chips: [['<circle cx="-6" r="3.2" fill="#22C55E"/><circle r="3.2" fill="#22C55E"/><circle cx="6" r="3.2" fill="#EF4444"/>', 0.5]].concat([3, 4, 5, 6].map(function (t, j) { return [(j ? '' : '<defs><linearGradient id="sfGoldI" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#D97706"/></linearGradient><linearGradient id="sfDiaI" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#38BDF8"/></linearGradient></defs>') + '<g transform="scale(.48)">' + loot(t).replace(/sf(Gold|Dia)/g, 'sf$1I') + '</g>', [1.5, 4, 12, 100][j]]; })),
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs><radialGradient id="sfDoor" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#94A3B8"/><stop offset=".7" stop-color="#475569"/><stop offset="1" stop-color="#1E293B"/></radialGradient>' +
      '<linearGradient id="sfGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".5" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient>' +
      '<linearGradient id="sfDia" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#7DD3FC"/><stop offset="1" stop-color="#0284C7"/></linearGradient>' +
      '<radialGradient id="sfIn" r=".6"><stop offset="0" stop-color="#FDE68A" stop-opacity=".55"/><stop offset="1" stop-color="#1C1917"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#111827"/><g stroke="#1F2937" stroke-width="2">' + [0, 1, 2, 3, 4, 5, 6].map(function (j) { return '<path d="M-400 ' + (j * 40) + 'H700"/>'; }).join('') + '</g>' +
      '<rect x="40" y="16" width="220" height="220" rx="24" fill="#1F2937" stroke="#4B5563" stroke-width="3"/>' +
      '<circle cx="150" cy="126" r="92" fill="url(#sfIn)"/><g id="sfLoot" opacity="0"></g>' +
      '<g id="sfDoorG"><circle cx="150" cy="126" r="94" fill="url(#sfDoor)" stroke="#CBD5E1" stroke-width="3"/><circle cx="150" cy="126" r="80" fill="none" stroke="#1E293B" stroke-width="2" opacity=".5"/>' +
        [0, 60, 120, 180, 240, 300].map(function (a) { var x = 150 + Math.cos(a * Math.PI / 180) * 86, y = 126 + Math.sin(a * Math.PI / 180) * 86; return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4" fill="#CBD5E1"/>'; }).join('') +
        '<rect x="88" y="66" width="124" height="44" rx="10" fill="#0B1220" stroke="#64748B"/>' +
        [0, 1, 2].map(function (j) { return '<g transform="translate(' + (110 + j * 40) + ' 88)"><rect x="-15" y="-18" width="30" height="36" rx="6" fill="#111827" stroke="#334155"/><text id="sfD' + j + '" y="9" text-anchor="middle" font-size="24" font-weight="900" fill="#E2E8F0" font-family="monospace">0</text><circle id="sfL' + j + '" cy="26" r="3.5" class="sf-l"/></g>'; }).join('') +
        '<g id="sfWheel" transform="translate(150 160)"><circle r="26" fill="none" stroke="#E2E8F0" stroke-width="4"/>' + [0, 45, 90, 135].map(function (a) { return '<path d="M-26 0H26" transform="rotate(' + a + ')" stroke="#E2E8F0" stroke-width="3"/>'; }).join('') + '<circle r="8" fill="#CBD5E1"/></g></g>' +
      '<g transform="translate(150 6)"><rect x="-38" y="-2" width="76" height="20" rx="6" fill="#0B1220" stroke="#FBBF24" stroke-opacity=".6"/><text id="sfCode" y="13" text-anchor="middle" font-size="13" font-weight="900" fill="#FDE68A" font-family="monospace" letter-spacing="4">· · ·</text></g>',
    reset: function (c) { for (var j = 0; j < 3; j++) c.id('sfL' + j).setAttribute('class', 'sf-l'); c.id('sfDoorG').removeAttribute('transform'); c.id('sfDoorG').style.opacity = ''; c.id('sfLoot').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var i = +r.view.i, ok = i >= 3 ? 3 : i, code = [rnd(10), rnd(10), rnd(10)], good = shuffle([0, 1, 2]).slice(0, ok);
      c.id('sfCode').textContent = code.join('');
      var wheel = c.id('sfWheel');
      for (var j = 0; j < 3; j++) {
        var d = c.id('sfD' + j), fin = good.indexOf(j) >= 0 ? code[j] : (code[j] + 1 + rnd(9)) % 10, spins = 14 + rnd(6);
        await tw(c.box, 650, function (k) { d.textContent = String((fin + Math.floor((1 - ease(k)) * spins)) % 10); wheel.setAttribute('transform', 'translate(150 160) rotate(' + ((j + ease(k)) * 120).toFixed(0) + ')'); });
        d.textContent = String(fin);
        c.id('sfL' + j).setAttribute('class', 'sf-l ' + (good.indexOf(j) >= 0 ? 'ok' : 'ko'));
        await wait(c.box, 140);
      }
      if (i < 3) return;
      // le coffre s'ouvre
      var door = c.id('sfDoorG'), lt = c.id('sfLoot');
      lt.innerHTML = loot(i); lt.setAttribute('opacity', '1'); tr(lt, 150, 126, 1.6);
      await tw(c.box, 300, function (k) { wheel.setAttribute('transform', 'translate(150 160) rotate(' + (360 + k * 180).toFixed(0) + ')'); });
      await tw(c.box, 800, function (k) { var e = ease(k); door.setAttribute('transform', 'translate(56 0) scale(' + (1 - e * 0.82).toFixed(3) + ' 1) translate(-56 0)'); tr(lt, 150, 126, 1.6 + 0.6 * e); });
    },
    rules: {
      en: '1. Set your stake and tap “Crack”: the secret code appears and the 3 tumblers spin one by one.\n2. Each tumbler that stops on its digit lights green. All 3 green opens the safe.\n3. 2 green ×0.5 · open safe: cash ×1.5 · gold bars ×4 · jewels ×12 · diamond ×100. 0 or 1 green: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Forcer » : le code secret s’affiche et les 3 rouleaux tournent un par un.\n2. Chaque rouleau qui s’arrête sur son chiffre s’allume en vert. Les 3 verts ouvrent le coffre.\n3. 2 verts ×0.5 · coffre ouvert : billets ×1.5 · lingots ×4 · bijoux ×12 · diamant ×100. 0 ou 1 vert : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Abrir»: aparece el código secreto y los 3 rodillos giran uno a uno.\n2. Cada rodillo que se detiene en su cifra se enciende en verde. Los 3 en verde abren la caja fuerte.\n3. 2 verdes ×0.5 · caja abierta: billetes ×1.5 · lingotes ×4 · joyas ×12 · diamante ×100. 0 o 1 verde: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Arrombar»: o código secreto aparece e os 3 cilindros giram um a um.\n2. Cada cilindro que para no seu dígito acende em verde. Os 3 verdes abrem o cofre.\n3. 2 verdes ×0.5 · cofre aberto: notas ×1.5 · barras de ouro ×4 · joias ×12 · diamante ×100. 0 ou 1 verde: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «افتح»: يظهر الرمز السري وتدور البكرات الثلاث واحدة تلو الأخرى.\n2. كل بكرة تتوقف على رقمها تضيء بالأخضر. ثلاث خضراء تفتح الخزنة.\n3. اثنتان خضراوان ×0.5 · الخزنة مفتوحة: أوراق نقدية ×1.5 · سبائك ×4 · مجوهرات ×12 · ماسة ×100. 0 أو واحدة خضراء: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Kır”a dokun: gizli kod görünür ve 3 silindir tek tek döner.\n2. Kendi rakamında duran her silindir yeşil yanar. 3’ü de yeşilse kasa açılır.\n3. 2 yeşil ×0.5 · açık kasa: banknot ×1.5 · külçe ×4 · mücevher ×12 · elmas ×100. 0 veya 1 yeşil: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Phá khóa»: mã bí mật hiện ra và 3 vòng số quay lần lượt.\n2. Vòng nào dừng đúng số sẽ sáng xanh. Cả 3 xanh thì két mở.\n3. 2 xanh ×0.5 · két mở: tiền mặt ×1.5 · vàng thỏi ×4 · trang sức ×12 · kim cương ×100. 0 hoặc 1 xanh: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Bobol»: kode rahasia muncul dan 3 silinder berputar satu per satu.\n2. Silinder yang berhenti di angkanya menyala hijau. Ketiganya hijau membuka brankas.\n3. 2 hijau ×0.5 · brankas terbuka: uang tunai ×1.5 · emas batangan ×4 · perhiasan ×12 · berlian ×100. 0 atau 1 hijau: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Взломать»: появляется секретный код, 3 барабана крутятся по очереди.\n2. Барабан, остановившийся на своей цифре, загорается зелёным. Три зелёных открывают сейф.\n3. 2 зелёных ×0.5 · сейф открыт: деньги ×1.5 · слитки ×4 · драгоценности ×12 · бриллиант ×100. 0 или 1 зелёный — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Knacken“: Der Geheimcode erscheint, die 3 Zahlenrollen drehen sich nacheinander.\n2. Jede Rolle, die auf ihrer Ziffer stoppt, leuchtet grün. Alle 3 grün öffnen den Tresor.\n3. 2 grün ×0.5 · offener Tresor: Scheine ×1.5 · Goldbarren ×4 · Juwelen ×12 · Diamant ×100. 0 oder 1 grün: Einsatz verloren.',
      hi: '1. राशि चुनें और «तोड़ें» छुएं: गुप्त कोड दिखता है और 3 टम्बलर एक-एक कर घूमते हैं।\n2. जो टम्बलर अपने अंक पर रुके, वह हरा जलता है। तीनों हरे हों तो तिजोरी खुलती है।\n3. 2 हरे ×0.5 · खुली तिजोरी: नकद ×1.5 · सोने की ईंटें ×4 · गहने ×12 · हीरा ×100। 0 या 1 हरा: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“开锁”：显示密码，3 个密码轮依次转动。\n2. 停在正确数字上的密码轮亮绿灯。3 个全绿则保险箱打开。\n3. 2 个绿灯 ×0.5 · 保险箱打开：现金 ×1.5 · 金条 ×4 · 珠宝 ×12 · 钻石 ×100。0 或 1 个绿灯：输掉下注。'
    }
  });

  /* =============================== SNAKES & LADDERS =============================== */
  // plateau 1–25 (5×5), départ 0, 3 lancers de dé ; échelles 3→11 · 7→17 · 12→22 ; serpents 15→5 · 20→9 · 24→13
  var SQ = [4, 5, 6, 8, 9, 10, 11, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25], JUMP = { 3: 11, 7: 17, 12: 22, 15: 5, 20: 9, 24: 13 };
  var SXY = function (s) { if (s <= 0) return [16, 214]; var r = Math.floor((s - 1) / 5), k = (s - 1) % 5, col = r % 2 ? 4 - k : k; return [62 + col * 44, 206 - r * 44]; };
  var SROW = [0, 0.2, 0.4, 0.8, 1.2];
  function snWalk(seq) { var p = 0, steps = []; seq.forEach(function (d) { var st = []; if (p + d <= 25) { for (var t = 1; t <= d; t++) st.push(p + t); p += d; } var j = JUMP[p] ? (p = JUMP[p]) : 0; steps.push([d, st, j]); }); return [p, steps]; }
  game({
    key: 'snakes', l: verb('roll'), vb: '0 0 300 250',
    chips: [['6+', 0.2], ['11+', 0.4], ['16+', 0.8], ['21+', 1.2]].map(function (x) { return ['<rect x="-11" y="-8" width="22" height="16" rx="4" fill="#4C1D95"/><text y="3.5" font-size="8.5" font-weight="900" text-anchor="middle" fill="#E9D5FF">' + x[0] + '</text>', x[1]]; }).concat([['<path d="M-9 5h18l2-12-6 5-5-8-5 8-6-5z" fill="#FBBF24" stroke="#92400E" stroke-width=".8"/>', 40]]),
    chipOf: function (i) { var s = SQ[i]; return s === 25 ? 4 : s >= 21 ? 3 : s >= 16 ? 2 : s >= 11 ? 1 : s >= 6 ? 0 : -1; },
    scene: '<defs><linearGradient id="snBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E1B4B"/><stop offset="1" stop-color="#312E81"/></linearGradient>' +
      '<radialGradient id="snTokG" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#D97706"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#snBg)"/>' +
      (function () { var s = ''; for (var q = 1; q <= 25; q++) { var p = SXY(q), r = Math.floor((q - 1) / 5); s += '<g class="sn-q" id="snQ' + q + '"><rect x="' + (p[0] - 21) + '" y="' + (p[1] - 21) + '" width="42" height="42" rx="6" fill="' + (q === 25 ? '#B45309' : ['#3B0764', '#4C1D95', '#5B21B6', '#6D28D9', '#7C3AED'][r]) + '" opacity="' + (q % 2 ? 1 : 0.82) + '"/><text x="' + (p[0] - 17) + '" y="' + (p[1] - 10) + '" font-size="8" font-weight="800" fill="#E9D5FF" opacity=".8">' + q + '</text></g>'; } return s; })() +
      [0, 1, 2, 3, 4].map(function (r) { return '<text x="284" y="' + (210 - r * 44) + '" text-anchor="middle" font-size="9" font-weight="900" fill="' + (r ? '#FDE68A' : '#94A3B8') + '">' + (r ? xm(SROW[r]) : '×0') + '</text>'; }).join('') +
      '<g transform="translate(' + SXY(25)[0] + ' ' + (SXY(25)[1] + 4) + ')"><path d="M-12 6h24l3-16-8 7-7-11-7 11-8-7z" fill="#FDE68A" stroke="#92400E"/><text y="16" font-size="8" font-weight="900" text-anchor="middle" fill="#FEF3C7">×40</text></g>' +
      // échelles
      [[3, 11], [7, 17], [12, 22]].map(function (l) { var a = SXY(l[0]), b = SXY(l[1]), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * 6, ny = dx / L * 6, rungs = ''; for (var t = 0.15; t < 1; t += 0.17) rungs += '<path d="M' + (a[0] + dx * t + nx).toFixed(1) + ' ' + (a[1] + dy * t + ny).toFixed(1) + 'L' + (a[0] + dx * t - nx).toFixed(1) + ' ' + (a[1] + dy * t - ny).toFixed(1) + '"/>'; return '<g stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round" opacity=".95"><path d="M' + (a[0] + nx) + ' ' + (a[1] + ny) + 'L' + (b[0] + nx) + ' ' + (b[1] + ny) + 'M' + (a[0] - nx) + ' ' + (a[1] - ny) + 'L' + (b[0] - nx) + ' ' + (b[1] - ny) + '"/>' + rungs + '</g>'; }).join('') +
      // serpents
      [[15, 5, '#22C55E'], [20, 9, '#F43F5E'], [24, 13, '#06B6D4']].map(function (s) { var a = SXY(s[0]), b = SXY(s[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; return '<path d="M' + a[0] + ' ' + a[1] + 'C' + (mx + 34) + ' ' + (my - 20) + ' ' + (mx - 34) + ' ' + (my + 20) + ' ' + b[0] + ' ' + b[1] + '" stroke="' + s[2] + '" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/><circle cx="' + a[0] + '" cy="' + a[1] + '" r="6" fill="' + s[2] + '"/><circle cx="' + (a[0] - 2) + '" cy="' + (a[1] - 2) + '" r="1.4" fill="#000"/><circle cx="' + (a[0] + 2) + '" cy="' + (a[1] - 2) + '" r="1.4" fill="#000"/>'; }).join('') +
      '<g id="snDie" transform="translate(16 120)">' + die(1, 1.1) + '</g>' +
      '<g id="snTok" transform="translate(16 214)"><ellipse cy="9" rx="8" ry="3" fill="#000" opacity=".35"/><path d="M-7 8L-4-4A5 5 0 1 1 4-4L7 8z" fill="url(#snTokG)" stroke="#78350F"/></g>',
    reset: function (c) { tr(c.id('snTok'), 16, 214); c.qa('.sn-q').forEach(function (q) { q.classList.remove('on'); }); },
    play: async function (c, r) {
      var target = SQ[+r.view.i], all = [];
      for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) for (var d = 1; d <= 6; d++) if (snWalk([a, b, d])[0] === target) all.push([a, b, d]);
      var seq = all[rnd(all.length)], walk = snWalk(seq)[1], tok = c.id('snTok'), dEl = c.id('snDie'), cur = SXY(0);
      for (var s = 0; s < 3; s++) {
        var w = walk[s];
        await tw(c.box, 420, function (k) { var v = k < 1 ? 1 + Math.floor(Math.random() * 6) : w[0]; dEl.innerHTML = die(v, 1.1); dEl.setAttribute('transform', 'translate(16 120) rotate(' + (k * 360).toFixed(0) + ')'); });
        dEl.innerHTML = die(w[0], 1.1); dEl.setAttribute('transform', 'translate(16 120)');
        for (var t = 0; t < w[1].length; t++) { var to = SXY(w[1][t]), from = cur; await tw(c.box, 150, function (k) { tr(tok, lerp(from[0], to[0], k), lerp(from[1], to[1], k) - Math.sin(k * Math.PI) * 12); }); cur = to; }
        if (w[2]) { var to2 = SXY(w[2]), f2 = cur; await tw(c.box, 650, function (k) { var e = ease(k); tr(tok, lerp(f2[0], to2[0], e), lerp(f2[1], to2[1], e)); }); cur = to2; }
        await wait(c.box, 150);
      }
      var q = c.id('snQ' + target); if (q) q.classList.add('on');
    },
    rules: {
      en: '1. Set your stake and tap “Roll”: the die is rolled 3 times and your token moves on the 25-square board.\n2. Ladders take it up, snakes bring it down. The row where it stops decides your win.\n3. Row 2 ×0.2 · row 3 ×0.4 · row 4 ×0.8 · row 5 ×1.2 · square 25 (crown) ×40. Row 1: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Lancer » : le dé est lancé 3 fois et ton pion avance sur le plateau de 25 cases.\n2. Les échelles le font monter, les serpents descendre. La rangée où il s’arrête décide du gain.\n3. Rangée 2 ×0.2 · rangée 3 ×0.4 · rangée 4 ×0.8 · rangée 5 ×1.2 · case 25 (couronne) ×40. Rangée 1 : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Tirar»: el dado se lanza 3 veces y tu ficha avanza por el tablero de 25 casillas.\n2. Las escaleras la suben, las serpientes la bajan. La fila donde se para decide tu premio.\n3. Fila 2 ×0.2 · fila 3 ×0.4 · fila 4 ×0.8 · fila 5 ×1.2 · casilla 25 (corona) ×40. Fila 1: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Rolar»: o dado é lançado 3 vezes e sua peça anda no tabuleiro de 25 casas.\n2. Escadas sobem, cobras descem. A fileira onde ela para decide o prêmio.\n3. Fileira 2 ×0.2 · fileira 3 ×0.4 · fileira 4 ×0.8 · fileira 5 ×1.2 · casa 25 (coroa) ×40. Fileira 1: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «ارمِ»: يُرمى النرد 3 مرات ويتقدم بيدقك على لوحة من 25 خانة.\n2. السلالم ترفعه والثعابين تنزله. الصف الذي يتوقف فيه يحدد ربحك.\n3. الصف 2 ×0.2 · الصف 3 ×0.4 · الصف 4 ×0.8 · الصف 5 ×1.2 · الخانة 25 (التاج) ×40. الصف 1: تخسر الرهان.',
      tr: '1. Bahsini seç ve “At”a dokun: zar 3 kez atılır ve piyonun 25 kareli tahtada ilerler.\n2. Merdivenler yukarı çıkarır, yılanlar aşağı indirir. Durduğu sıra kazancını belirler.\n3. 2. sıra ×0.2 · 3. sıra ×0.4 · 4. sıra ×0.8 · 5. sıra ×1.2 · 25. kare (taç) ×40. 1. sıra: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Gieo»: xúc xắc được gieo 3 lần và quân của bạn đi trên bàn 25 ô.\n2. Thang đưa lên, rắn kéo xuống. Hàng nơi quân dừng quyết định tiền thắng.\n3. Hàng 2 ×0.2 · hàng 3 ×0.4 · hàng 4 ×0.8 · hàng 5 ×1.2 · ô 25 (vương miện) ×40. Hàng 1: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lempar»: dadu dilempar 3 kali dan bidakmu maju di papan 25 kotak.\n2. Tangga membawa naik, ular membawa turun. Baris tempat berhenti menentukan kemenangan.\n3. Baris 2 ×0.2 · baris 3 ×0.4 · baris 4 ×0.8 · baris 5 ×1.2 · kotak 25 (mahkota) ×40. Baris 1: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Бросить»: кубик бросают 3 раза, фишка идёт по полю из 25 клеток.\n2. Лестницы поднимают, змеи опускают. Ряд, где она остановилась, определяет выигрыш.\n3. Ряд 2 ×0.2 · ряд 3 ×0.4 · ряд 4 ×0.8 · ряд 5 ×1.2 · клетка 25 (корона) ×40. Ряд 1 — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Würfeln“: Es wird 3-mal gewürfelt, deine Figur zieht über das Brett mit 25 Feldern.\n2. Leitern bringen sie hoch, Schlangen runter. Die Reihe, in der sie stehen bleibt, bestimmt den Gewinn.\n3. Reihe 2 ×0.2 · Reihe 3 ×0.4 · Reihe 4 ×0.8 · Reihe 5 ×1.2 · Feld 25 (Krone) ×40. Reihe 1: Einsatz verloren.',
      hi: '1. राशि चुनें और «फेंकें» छुएं: पासा 3 बार फेंका जाता है और आपकी गोटी 25 खानों वाले बोर्ड पर चलती है।\n2. सीढ़ियां ऊपर ले जाती हैं, सांप नीचे लाते हैं। जिस पंक्ति में रुके, वही जीत तय करती है।\n3. पंक्ति 2 ×0.2 · पंक्ति 3 ×0.4 · पंक्ति 4 ×0.8 · पंक्ति 5 ×1.2 · खाना 25 (ताज) ×40। पंक्ति 1: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“掷骰”：骰子掷 3 次，你的棋子在 25 格棋盘上前进。\n2. 梯子带你上升，蛇让你下滑。棋子停下的那一行决定奖金。\n3. 第 2 行 ×0.2 · 第 3 行 ×0.4 · 第 4 行 ×0.8 · 第 5 行 ×1.2 · 第 25 格（皇冠）×40。第 1 行：输掉下注。'
    }
  });

  /* =============================== BINGO 75 =============================== */
  // carte 5×5 (case du centre libre), 40 boules sur 75 ; ligne = lignes complètes 0 / 1 / 2 / 3 / 4 et plus (lignes, colonnes, diagonales)
  var BL = []; (function () { for (var a = 0; a < 5; a++) { BL.push([0, 1, 2, 3, 4].map(function (j) { return a * 5 + j; })); BL.push([0, 1, 2, 3, 4].map(function (j) { return j * 5 + a; })); } BL.push([0, 6, 12, 18, 24]); BL.push([4, 8, 12, 16, 20]); })();
  var BCOL = ['#3B82F6', '#EF4444', '#E5E7EB', '#22C55E', '#F59E0B'];
  function bingoDeal(want) {
    for (var t = 0; t < 20000; t++) {
      var card = [], cols = [];
      for (var cl = 0; cl < 5; cl++) { var s = shuffle(Array.apply(null, Array(15)).map(function (x, j) { return cl * 15 + 1 + j; })).slice(0, 5); cols.push(s); }
      for (var rr = 0; rr < 5; rr++) for (var cc = 0; cc < 5; cc++) card.push(rr === 2 && cc === 2 ? 0 : cols[cc][rr]);
      var draw = shuffle(Array.apply(null, Array(75)).map(function (x, j) { return j + 1; })).slice(0, 40), set = {};
      draw.forEach(function (n) { set[n] = 1; });
      var hit = card.map(function (n) { return n === 0 || !!set[n]; }), lines = BL.filter(function (L) { return L.every(function (q) { return hit[q]; }); });
      if (Math.min(4, lines.length) === want) return { card: card, draw: draw, lines: lines };
    }
    return null;
  }
  game({
    key: 'bingo', l: verb('play'), vb: '0 0 300 250',
    chips: [1, 2, 3, 4].map(function (n, j) { return ['<rect x="-9" y="-9" width="18" height="18" rx="4" fill="#1E3A8A"/>' + [0, 1, 2].map(function (q) { return '<circle cx="' + (-5 + q * 5) + '" cy="' + (n >= 2 ? -3 : 0) + '" r="1.8" fill="#F472B6"/>' + (n >= 2 ? '<circle cx="' + (-5 + q * 5) + '" cy="3" r="1.8" fill="#F472B6"/>' : ''); }).join('') + '<text x="8" y="9" font-size="8" font-weight="900" fill="#FDE68A" text-anchor="middle">' + (n === 4 ? '4+' : n) + '</text>', [1.2, 3, 8, 15][j]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs><radialGradient id="bgBall" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#CBD5E1"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0F0B2E"/>' +
      '<rect x="12" y="12" width="196" height="228" rx="16" fill="#F8FAFC"/><g id="bgHead">' + 'BINGO'.split('').map(function (L, j) { return '<rect x="' + (18 + j * 37) + '" y="18" width="34" height="28" rx="7" fill="' + BCOL[j] + '"/><text x="' + (35 + j * 37) + '" y="39" text-anchor="middle" font-size="19" font-weight="900" fill="' + (j === 2 ? '#1F2937' : '#fff') + '">' + L + '</text>'; }).join('') + '</g>' +
      '<g id="bgCard"></g><g id="bgLines"></g>' +
      '<g transform="translate(256 70)"><circle r="34" fill="#1E1B4B" stroke="#7C3AED" stroke-width="2"/><g id="bgBig"><circle r="27" fill="url(#bgBall)"/><circle r="17" fill="none" stroke="#7C3AED" stroke-width="5" id="bgRing"/><text id="bgNum" y="7" text-anchor="middle" font-size="19" font-weight="900" fill="#1F2937">–</text></g></g>' +
      '<g transform="translate(256 132)"><rect x="-34" y="-14" width="68" height="26" rx="8" fill="#1E1B4B" stroke="#7C3AED" stroke-opacity=".6"/><text id="bgCnt" y="5" text-anchor="middle" font-size="13" font-weight="900" fill="#E9D5FF" font-family="monospace">0/40</text></g>' +
      '<g id="bgPrev" transform="translate(256 172)"></g>',
    init: function (c) {
      c.paint = function (card) {
        c.id('bgCard').innerHTML = card.map(function (n, q) { var x = 35 + (q % 5) * 37, y = 68 + Math.floor(q / 5) * 34; return '<g id="bgC' + q + '"><rect x="' + (x - 16) + '" y="' + (y - 14) + '" width="32" height="30" rx="6" fill="#EEF2FF"/><circle cx="' + x + '" cy="' + (y + 1) + '" r="12" class="bg-dab" fill="#F472B6" opacity="' + (n === 0 ? 0.9 : 0) + '"/><text x="' + x + '" y="' + (y + 6) + '" text-anchor="middle" font-size="' + (n === 0 ? 13 : 15) + '" font-weight="900" fill="#1F2937">' + (n === 0 ? '★' : n) + '</text></g>'; }).join('');
      };
      var demo = []; for (var q = 0; q < 25; q++) demo.push(q === 12 ? 0 : Math.floor(q % 5) * 15 + 1 + ((q * 7) % 15)); c.paint(demo);
    },
    reset: function (c) { c.id('bgLines').innerHTML = ''; c.id('bgPrev').innerHTML = ''; c.id('bgCnt').textContent = '0/40'; },
    play: async function (c, r) {
      var want = +r.view.i, deal = bingoDeal(want);
      if (!deal) return;
      c.paint(deal.card);
      var idx = {}; deal.card.forEach(function (n, q) { if (n) idx[n] = q; });
      var num = c.id('bgNum'), ring = c.id('bgRing'), cnt = c.id('bgCnt'), prev = c.id('bgPrev'), big = c.id('bgBig'), last = [];
      var per = lite() ? 45 : 85;
      for (var j = 0; j < 40; j++) {
        var n = deal.draw[j], col = BCOL[Math.floor((n - 1) / 15)];
        num.textContent = String(n); ring.setAttribute('stroke', col); cnt.textContent = (j + 1) + '/40';
        if (big.animate && !lite()) big.animate([{ transform: 'scale(.6)' }, { transform: 'scale(1)' }], { duration: per });
        last.unshift(n); if (last.length > 4) last.length = 4;
        prev.innerHTML = last.slice(1).map(function (m, k) { return '<g transform="translate(' + (-22 + k * 22) + ' 0)"><circle r="9" fill="' + BCOL[Math.floor((m - 1) / 15)] + '"/><text y="3.5" text-anchor="middle" font-size="9" font-weight="900" fill="' + (Math.floor((m - 1) / 15) === 2 ? '#1F2937' : '#fff') + '">' + m + '</text></g>'; }).join('');
        if (idx[n] != null) { var d = c.id('bgC' + idx[n]).querySelector('.bg-dab'); d.setAttribute('opacity', '.85'); if (d.animate && !lite()) d.animate([{ transform: 'scale(1.6)', opacity: 0 }, { transform: 'scale(1)', opacity: .85 }], { duration: 220, transformOrigin: 'center' }); }
        await wait(c.box, per);
      }
      c.id('bgLines').innerHTML = deal.lines.map(function (L) { var a = L[0], b = L[4], ax = 35 + (a % 5) * 37, ay = 69 + Math.floor(a / 5) * 34, bx = 35 + (b % 5) * 37, by = 69 + Math.floor(b / 5) * 34; return '<path d="M' + ax + ' ' + ay + 'L' + bx + ' ' + by + '" stroke="#7C3AED" stroke-width="6" stroke-linecap="round" opacity=".75"/>'; }).join('');
    },
    rules: {
      en: '1. Set your stake and tap “Play”: you get a fresh 75-ball bingo card (the star in the middle is free) and 40 balls are drawn.\n2. Every complete line — row, column or diagonal — counts.\n3. 1 line ×1.2 · 2 lines ×3 · 3 lines ×8 · 4 lines or more ×15. No line: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Jouer » : tu reçois une nouvelle carte de bingo 75 boules (l’étoile du centre est offerte) et 40 boules sont tirées.\n2. Chaque ligne complète — rangée, colonne ou diagonale — compte.\n3. 1 ligne ×1.2 · 2 lignes ×3 · 3 lignes ×8 · 4 lignes ou plus ×15. Aucune ligne : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Jugar»: recibes un cartón nuevo de bingo de 75 bolas (la estrella central es gratis) y se sacan 40 bolas.\n2. Cuenta cada línea completa: fila, columna o diagonal.\n3. 1 línea ×1.2 · 2 líneas ×3 · 3 líneas ×8 · 4 líneas o más ×15. Ninguna línea: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Jogar»: você recebe uma cartela nova de bingo de 75 bolas (a estrela do meio é grátis) e 40 bolas são sorteadas.\n2. Cada linha completa — fileira, coluna ou diagonal — conta.\n3. 1 linha ×1.2 · 2 linhas ×3 · 3 linhas ×8 · 4 linhas ou mais ×15. Nenhuma linha: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «العب»: تحصل على بطاقة بينغو جديدة من 75 كرة (النجمة في الوسط مجانية) وتُسحب 40 كرة.\n2. كل خط مكتمل — صف أو عمود أو قطر — يُحسب.\n3. خط واحد ×1.2 · خطان ×3 · 3 خطوط ×8 · 4 خطوط أو أكثر ×15. لا خط: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Oyna”ya dokun: yeni bir 75 toplu bingo kartı alırsın (ortadaki yıldız bedava) ve 40 top çekilir.\n2. Tamamlanan her çizgi — satır, sütun veya çapraz — sayılır.\n3. 1 çizgi ×1.2 · 2 çizgi ×3 · 3 çizgi ×8 · 4 veya daha fazla ×15. Çizgi yoksa: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Chơi»: bạn nhận một thẻ bingo 75 bóng mới (ngôi sao ở giữa được miễn) và 40 bóng được quay.\n2. Mỗi đường hoàn chỉnh — hàng, cột hoặc chéo — đều được tính.\n3. 1 đường ×1.2 · 2 đường ×3 · 3 đường ×8 · từ 4 đường ×15. Không có đường nào: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Main»: kamu mendapat kartu bingo 75 bola baru (bintang di tengah gratis) dan 40 bola diundi.\n2. Setiap garis lengkap — baris, kolom, atau diagonal — dihitung.\n3. 1 garis ×1.2 · 2 garis ×3 · 3 garis ×8 · 4 garis atau lebih ×15. Tidak ada garis: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Играть»: вы получаете новую карточку бинго на 75 шаров (звезда в центре бесплатна), выпадает 40 шаров.\n2. Засчитывается каждая полная линия — строка, столбец или диагональ.\n3. 1 линия ×1.2 · 2 линии ×3 · 3 линии ×8 · 4 линии и больше ×15. Ни одной линии — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Spielen“: Du bekommst eine neue 75-Kugel-Bingokarte (der Stern in der Mitte ist frei), 40 Kugeln werden gezogen.\n2. Jede volle Linie — Reihe, Spalte oder Diagonale — zählt.\n3. 1 Linie ×1.2 · 2 Linien ×3 · 3 Linien ×8 · 4 Linien oder mehr ×15. Keine Linie: Einsatz verloren.',
      hi: '1. राशि चुनें और «खेलें» छुएं: आपको 75 गेंदों वाला नया बिंगो कार्ड मिलता है (बीच का तारा मुफ़्त है) और 40 गेंदें निकलती हैं।\n2. हर पूरी लाइन — पंक्ति, कॉलम या तिरछी — गिनी जाती है।\n3. 1 लाइन ×1.2 · 2 लाइन ×3 · 3 लाइन ×8 · 4 या ज़्यादा लाइन ×15। कोई लाइन नहीं: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“开始”：你获得一张新的 75 球宾果卡（中间的星星免费），随后抽出 40 个球。\n2. 每一条完整的线——行、列或对角线——都计入。\n3. 1 条线 ×1.2 · 2 条线 ×3 · 3 条线 ×8 · 4 条线及以上 ×15。没有线：输掉下注。'
    }
  });

  /* =============================== CRAPS (choix) =============================== */
  // option 0 « Pass » gagne 244/495 (×1.90), option 1 « Don't Pass » gagne l'autre cas 251/495 (×1.85) — gain = 0,94 ÷ chance (serveur)
  var CR = [244 / 495, 251 / 495];
  function crapsSeq(w) {
    for (var t = 0; t < 5000; t++) {
      var rolls = [], pass = null, point = 0;
      while (pass === null && rolls.length < 8) {
        var a = 1 + rnd(6), b = 1 + rnd(6), s = a + b; rolls.push([a, b]);
        if (!point) { if (s === 7 || s === 11) pass = true; else if (s === 2 || s === 3 || s === 12) pass = false; else point = s; }
        else if (s === point) pass = true; else if (s === 7) pass = false;
      }
      if (pass !== null && (pass ? 0 : 1) === w) return { rolls: rolls, point: point };
    }
    return { rolls: [[w ? 1 : 3, w ? 1 : 4]], point: 0 };
  }
  game({
    key: 'craps', l: verb('roll'), vb: '0 0 300 240',
    scene: '<defs><radialGradient id="cpF" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#15803D"/><stop offset="1" stop-color="#052E16"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#1C0F07"/><rect x="6" y="10" width="288" height="222" rx="26" fill="#78350F"/><rect x="18" y="22" width="264" height="198" rx="18" fill="url(#cpF)"/>' +
      '<g id="crpBoxes">' + [4, 5, 6, 8, 9, 10].map(function (n, j) { return '<g id="crpN' + n + '"><rect x="' + (30 + j * 41) + '" y="32" width="36" height="34" rx="6" fill="none" stroke="#FEF3C7" stroke-opacity=".7" stroke-width="1.5"/><text x="' + (48 + j * 41) + '" y="57" text-anchor="middle" font-size="18" font-weight="900" fill="#FEF3C7">' + n + '</text></g>'; }).join('') + '</g>' +
      '<path d="M30 196Q150 230 270 196" fill="none" stroke="#FEF3C7" stroke-opacity=".5" stroke-width="12"/><path d="M30 196Q150 230 270 196" fill="none" stroke="#15803D" stroke-width="9"/>' +
      '<g id="crpPuck" transform="translate(40 92)"><circle r="13" fill="#111827" stroke="#fff" stroke-width="2"/><text id="crpPk" y="4" text-anchor="middle" font-size="9" font-weight="900" fill="#fff">OFF</text></g>' +
      '<g id="crpHist" transform="translate(150 182)"></g>' +
      '<g id="crpSum" transform="translate(150 98)" opacity="0"><circle r="20" fill="#0B0820" opacity=".7"/><text id="crpS" y="8" text-anchor="middle" font-size="22" font-weight="900" fill="#FDE68A"></text></g>' +
      '<g id="crpD1" transform="translate(250 130)">' + die(5, 1.3) + '</g><g id="crpD2" transform="translate(270 150)">' + die(2, 1.3) + '</g>',
    opts: function (l) { return '<div class="cg-opts cr-opts">' + [l.pass, l.dpass].map(function (t, j) { return '<button type="button" data-o="' + j + '"' + (j === 0 ? ' class="on"' : '') + '><b class="fit">' + K.esc(t) + '</b><small class="fit">' + xm(Math.floor(0.94 / CR[j] * 100) / 100) + '</small></button>'; }).join('') + '</div>'; },
    init: function (c) { c.sel = 0; c.qa('.cr-opts button').forEach(function (b) { b.addEventListener('click', function () { if (c.box.classList.contains('m4-busy')) return; c.sel = +b.getAttribute('data-o'); c.qa('.cr-opts button').forEach(function (x) { x.classList.toggle('on', x === b); }); }); }); },
    params: function (c) { return { pick: c.sel }; },
    reset: function (c) { c.id('crpHist').innerHTML = ''; c.id('crpPk').textContent = 'OFF'; tr(c.id('crpPuck'), 40, 92); c.qa('#crpBoxes > g').forEach(function (g) { g.removeAttribute('class'); }); c.id('crpSum').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var sq = crapsSeq(+r.view.w), d1 = c.id('crpD1'), d2 = c.id('crpD2'), sum = c.id('crpSum'), hist = c.id('crpHist'), sums = [];
      for (var j = 0; j < sq.rolls.length; j++) {
        var rl = sq.rolls[j], ex = 130 + rnd(30), ey = 110 + rnd(30);
        sum.setAttribute('opacity', '0');
        await tw(c.box, lite() ? 350 : 650, function (k) {
          var e = ease(k), b = Math.abs(Math.sin(k * Math.PI * 3)) * 24 * (1 - k);
          if (k < 0.85) { d1.innerHTML = die(1 + rnd(6), 1.3); d2.innerHTML = die(1 + rnd(6), 1.3); }
          d1.setAttribute('transform', 'translate(' + lerp(280, ex, e).toFixed(1) + ' ' + (lerp(200, ey, e) - b).toFixed(1) + ') rotate(' + ((1 - e) * 540).toFixed(0) + ')');
          d2.setAttribute('transform', 'translate(' + lerp(290, ex + 34, e).toFixed(1) + ' ' + (lerp(214, ey + 12, e) - b * 0.8).toFixed(1) + ') rotate(' + ((1 - e) * -480).toFixed(0) + ')');
        });
        d1.innerHTML = die(rl[0], 1.3); d2.innerHTML = die(rl[1], 1.3);
        var s = rl[0] + rl[1]; c.id('crpS').textContent = String(s); sum.setAttribute('opacity', '1'); tr(sum, ex + 17, ey - 34);
        sums.push(s); hist.innerHTML = sums.map(function (v, k) { return '<g transform="translate(' + ((k - (sums.length - 1) / 2) * 24) + ' 0)"><circle r="10" fill="' + (v === 7 ? '#DC2626' : v === sq.point ? '#F59E0B' : '#1E293B') + '" stroke="#FEF3C7" stroke-opacity=".5"/><text y="4" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">' + v + '</text></g>'; }).join('');
        if (j === 0 && sq.point) { // le point est posé : palet sur « ON »
          var bx = 48 + [4, 5, 6, 8, 9, 10].indexOf(sq.point) * 41, pk = c.id('crpPuck');
          c.id('crpPk').textContent = 'ON'; c.id('crpN' + sq.point).setAttribute('class', 'on');
          await tw(c.box, 350, function (k) { tr(pk, lerp(40, bx, ease(k)), lerp(92, 49, ease(k)), 0.85); });
        }
        await wait(c.box, 380);
      }
    },
    rules: {
      en: '1. Choose “Pass” or “Don’t Pass”, set your stake and tap “Roll”. The two dice are rolled until the round is decided.\n2. First roll: 7 or 11 → Pass wins · 2, 3 or 12 → Don’t Pass wins · any other sum becomes the point. Then: the point again → Pass wins · a 7 first → Don’t Pass wins.\n3. Pass ×1.9 · Don’t Pass ×1.85. Your side loses: the stake is lost.',
      fr: '1. Choisis « Passe » ou « Ne passe pas », ta mise, puis touche « Lancer ». Les deux dés roulent jusqu’à ce que le tour soit décidé.\n2. 1er lancer : 7 ou 11 → Passe gagne · 2, 3 ou 12 → Ne passe pas gagne · toute autre somme devient le point. Ensuite : le point revient → Passe gagne · un 7 d’abord → Ne passe pas gagne.\n3. Passe ×1.9 · Ne passe pas ×1.85. Ton côté perd : la mise est perdue.',
      es: '1. Elige «Pase» o «No pase», tu apuesta y toca «Tirar». Los dos dados ruedan hasta decidir la ronda.\n2. 1.ª tirada: 7 u 11 → gana Pase · 2, 3 o 12 → gana No pase · cualquier otra suma es el punto. Después: sale el punto → gana Pase · sale antes un 7 → gana No pase.\n3. Pase ×1.9 · No pase ×1.85. Si tu lado pierde, pierdes la apuesta.',
      pt: '1. Escolha «Passe» ou «Não passe», o valor e toque em «Rolar». Os dois dados rolam até a rodada ser decidida.\n2. 1.º lance: 7 ou 11 → Passe ganha · 2, 3 ou 12 → Não passe ganha · qualquer outra soma vira o ponto. Depois: o ponto sai de novo → Passe ganha · sai antes um 7 → Não passe ganha.\n3. Passe ×1.9 · Não passe ×1.85. Seu lado perde: a aposta é perdida.',
      ar: '1. اختر «تمرير» أو «عدم التمرير» والرهان، ثم المس «ارمِ». يُرمى النردان حتى تُحسم الجولة.\n2. الرمية الأولى: 7 أو 11 ← يربح التمرير · 2 أو 3 أو 12 ← يربح عدم التمرير · أي مجموع آخر يصبح «النقطة». بعدها: تعود النقطة ← يربح التمرير · يظهر 7 أولًا ← يربح عدم التمرير.\n3. التمرير ×1.9 · عدم التمرير ×1.85. إن خسر جانبك تخسر الرهان.',
      tr: '1. “Pas” ya da “Pas değil”i seç, bahsini belirle ve “At”a dokun. İki zar tur sonuçlanana kadar atılır.\n2. İlk atış: 7 veya 11 → Pas kazanır · 2, 3 veya 12 → Pas değil kazanır · diğer toplamlar “nokta” olur. Sonra: nokta tekrar gelirse → Pas kazanır · önce 7 gelirse → Pas değil kazanır.\n3. Pas ×1.9 · Pas değil ×1.85. Senin tarafın kaybederse: bahis kaybedilir.',
      vi: '1. Chọn «Qua» hoặc «Không qua», mức cược rồi chạm «Gieo». Hai xúc xắc được gieo cho đến khi có kết quả.\n2. Lần đầu: 7 hoặc 11 → Qua thắng · 2, 3 hoặc 12 → Không qua thắng · tổng khác thành «điểm». Sau đó: ra lại điểm → Qua thắng · ra 7 trước → Không qua thắng.\n3. Qua ×1.9 · Không qua ×1.85. Bên bạn thua: mất tiền cược.',
      id: '1. Pilih «Lolos» atau «Tidak lolos», atur taruhan lalu sentuh «Lempar». Dua dadu dilempar sampai ronde ditentukan.\n2. Lemparan pertama: 7 atau 11 → Lolos menang · 2, 3 atau 12 → Tidak lolos menang · jumlah lain menjadi «poin». Lalu: poin keluar lagi → Lolos menang · 7 keluar dulu → Tidak lolos menang.\n3. Lolos ×1.9 · Tidak lolos ×1.85. Pihakmu kalah: taruhan hilang.',
      ru: '1. Выберите «Пас» или «Не пас», ставку и нажмите «Бросить». Кости бросают, пока раунд не решится.\n2. Первый бросок: 7 или 11 → выигрывает Пас · 2, 3 или 12 → выигрывает Не пас · любая другая сумма становится «пойнтом». Дальше: снова пойнт → Пас · раньше выпала 7 → Не пас.\n3. Пас ×1.9 · Не пас ×1.85. Ваша сторона проиграла — ставка проиграна.',
      de: '1. Wähle „Pass“ oder „Kein Pass“, deinen Einsatz und tippe auf „Würfeln“. Die zwei Würfel rollen, bis die Runde entschieden ist.\n2. 1. Wurf: 7 oder 11 → Pass gewinnt · 2, 3 oder 12 → Kein Pass gewinnt · jede andere Summe wird zum Punkt. Danach: der Punkt kommt wieder → Pass gewinnt · zuerst eine 7 → Kein Pass gewinnt.\n3. Pass ×1.9 · Kein Pass ×1.85. Verliert deine Seite: Einsatz verloren.',
      hi: '1. «पास» या «नो पास» चुनें, राशि चुनें और «फेंकें» छुएं। दोनों पासे तब तक फेंके जाते हैं जब तक राउंड तय न हो।\n2. पहला थ्रो: 7 या 11 → पास जीतता है · 2, 3 या 12 → नो पास जीतता है · कोई और जोड़ «पॉइंट» बनता है। फिर: पॉइंट दोबारा → पास जीतता है · पहले 7 → नो पास जीतता है।\n3. पास ×1.9 · नो पास ×1.85। आपका पक्ष हारे तो दांव हार जाते हैं।',
      zh: '1. 选择“过关”或“不过关”，设定金额并点击“掷骰”。两颗骰子会一直掷到本局分出胜负。\n2. 第一掷：7 或 11 → 过关赢 · 2、3 或 12 → 不过关赢 · 其他点数成为“点数”。之后：再次掷出点数 → 过关赢 · 先掷出 7 → 不过关赢。\n3. 过关 ×1.9 · 不过关 ×1.85。你押的一方输：输掉下注。'
    }
  });

  /* =============================== CHECKERS JUMP =============================== */
  // la dame d'or enchaîne k prises (0…5) : 1 ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60
  var CK_P = [[2, 7], [4, 5], [6, 3], [4, 1], [2, 3], [0, 1]], CK_M = [[3, 6], [5, 4], [5, 2], [3, 2], [1, 2]];
  var CKX = function (cc) { return 38 + cc * 28; }, CKY = function (rr) { return 18 + rr * 28; };
  function piece(gold) { return gold ? '<ellipse cy="3" rx="11" ry="4" fill="#78350F"/><circle r="11" fill="url(#ckG)" stroke="#92400E" stroke-width="1.2"/><path d="M-6 2h12l1.5-7-4 3-3.5-5-3.5 5-4-3z" fill="#FEF3C7" stroke="#B45309" stroke-width=".7"/>' : '<ellipse cy="3" rx="11" ry="4" fill="#2E1065"/><circle r="11" fill="url(#ckV)" stroke="#2E1065" stroke-width="1.2"/><circle r="6" fill="none" stroke="#C4B5FD" stroke-width="1.2" opacity=".7"/>'; }
  game({
    key: 'checkers', l: verb('play'), vb: '0 0 300 250',
    chips: [1, 2, 3, 4, 5].map(function (n, j) { return [(j ? '' : '<defs><radialGradient id="ckVI" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#DDD6FE"/><stop offset="1" stop-color="#5B21B6"/></radialGradient></defs>') + '<circle r="8" fill="url(#ckVI)" stroke="#2E1065"/><text y="3.5" font-size="9" font-weight="900" text-anchor="middle" fill="#fff">' + n + '</text>', [0.5, 1.5, 4, 12, 60][j]]; }),
    chipOf: function (i) { return i - 1; },
    scene: '<defs><radialGradient id="ckG" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".6" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></radialGradient>' +
      '<radialGradient id="ckV" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#DDD6FE"/><stop offset=".6" stop-color="#7C3AED"/><stop offset="1" stop-color="#3B0764"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#1C1917"/><rect x="18" y="-2" width="264" height="252" rx="14" fill="#78350F"/>' +
      (function () { var s = ''; for (var rr = 0; rr < 8; rr++) for (var cc = 0; cc < 8; cc++) s += '<rect x="' + (CKX(cc) - 14) + '" y="' + (CKY(rr) - 14) + '" width="28" height="28" fill="' + ((rr + cc) % 2 ? '#3F2A1E' : '#E7D3B0') + '"/>'; return s; })() +
      '<g id="ckTrail"></g><g id="ckEn"></g><g id="ckKing">' + piece(1) + '</g>' +
      '<g transform="translate(150 246)"><g id="ckCnt"></g></g>',
    init: function (c) {
      c.setup = function (k, flip) {
        var F = function (p) { return [flip ? 7 - p[0] : p[0], p[1]]; }, en = CK_M.slice(0, k).map(F), path = CK_P.slice(0, k + 1).map(F), fin = path[path.length - 1];
        var busy = {}; path.forEach(function (p) { busy[p] = 1; }); CK_M.map(F).forEach(function (p) { busy[p] = 1; });
        var dec = [], tries = 0;
        while (dec.length < 5 && tries++ < 200) { var p = [rnd(8), rnd(8)]; if ((p[0] + p[1]) % 2 === 0 || busy[p] || Math.abs(p[0] - fin[0]) <= 1 && Math.abs(p[1] - fin[1]) <= 1) continue; if (k === 0 && Math.abs(p[0] - path[0][0]) <= 1 && Math.abs(p[1] - path[0][1]) <= 1) continue; busy[p] = 1; dec.push(p); }
        c.id('ckEn').innerHTML = en.concat(dec).map(function (p, j) { return '<g class="ck-e" data-j="' + j + '" transform="translate(' + CKX(p[0]) + ' ' + CKY(p[1]) + ')">' + piece(0) + '</g>'; }).join('');
        tr(c.id('ckKing'), CKX(path[0][0]), CKY(path[0][1]));
        return path;
      };
      c.setup(0, false);
    },
    reset: function (c) { c.id('ckTrail').innerHTML = ''; c.id('ckCnt').innerHTML = ''; },
    play: async function (c, r) {
      var k = +r.view.i, flip = rnd(2) === 1, path = c.setup(k, flip), king = c.id('ckKing'), ens = c.qa('.ck-e');
      await wait(c.box, 450);
      if (k === 0) { // aucune prise possible : un simple pas
        var a = path[0], b = [a[0] + (flip ? -1 : 1), a[1] - 1];
        await tw(c.box, 400, function (t) { tr(king, lerp(CKX(a[0]), CKX(b[0]), ease(t)), lerp(CKY(a[1]), CKY(b[1]), ease(t))); });
        return;
      }
      for (var j = 0; j < k; j++) {
        var p0 = path[j], p1 = path[j + 1], en = ens[j];
        c.id('ckTrail').insertAdjacentHTML('beforeend', '<path d="M' + CKX(p0[0]) + ' ' + CKY(p0[1]) + 'L' + CKX(p1[0]) + ' ' + CKY(p1[1]) + '" stroke="#FDE68A" stroke-width="3" stroke-dasharray="4 4" opacity=".7"/>');
        await tw(c.box, 420, function (t) { var e = ease(t); tr(king, lerp(CKX(p0[0]), CKX(p1[0]), e), lerp(CKY(p0[1]), CKY(p1[1]), e) - Math.sin(t * Math.PI) * 18, 1 + Math.sin(t * Math.PI) * 0.25); });
        var m = CK_M[j];
        await tw(c.box, 200, function (t) { en.setAttribute('transform', 'translate(' + CKX(flip ? 7 - m[0] : m[0]) + ' ' + CKY(m[1]) + ') scale(' + (1 - t) + ')'); });
        c.id('ckCnt').innerHTML = Array.apply(null, Array(j + 1)).map(function (x, q) { return '<g transform="translate(' + ((q - j / 2) * 16) + ' -2) scale(.55)">' + piece(0) + '</g>'; }).join('');
      }
    },
    rules: {
      en: '1. Set your stake and tap “Play”: your golden king makes its move on a fresh board.\n2. It captures as many violet pieces as it can in one chain of jumps — the number of captures decides your win.\n3. 1 capture ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. No capture: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Jouer » : ta dame dorée joue son coup sur un nouveau damier.\n2. Elle prend en une seule rafle autant de pions violets que possible : le nombre de prises décide du gain.\n3. 1 prise ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. Aucune prise : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Jugar»: tu dama dorada juega en un tablero nuevo.\n2. Captura tantas fichas violetas como pueda en una sola cadena de saltos: el número de capturas decide tu premio.\n3. 1 captura ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. Ninguna captura: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Jogar»: sua dama dourada joga num tabuleiro novo.\n2. Ela captura o máximo de peças roxas numa só sequência de saltos: o número de capturas decide o prêmio.\n3. 1 captura ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. Nenhuma captura: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «العب»: يلعب ملكك الذهبي حركته على رقعة جديدة.\n2. يأسر أكبر عدد من القطع البنفسجية في سلسلة قفزات واحدة: عدد الأسرات يحدد ربحك.\n3. أسرة واحدة ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. لا أسر: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Oyna”ya dokun: altın dama yeni bir tahtada hamlesini yapar.\n2. Tek bir atlama zincirinde alabildiği kadar mor taş alır: alınan taş sayısı kazancını belirler.\n3. 1 taş ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. Hiç taş yoksa: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Chơi»: quân vua vàng đi nước của mình trên bàn cờ mới.\n2. Nó ăn càng nhiều quân tím càng tốt trong một chuỗi nhảy: số quân ăn được quyết định tiền thắng.\n3. Ăn 1 ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. Không ăn quân nào: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Main»: raja emasmu melangkah di papan baru.\n2. Ia memakan bidak ungu sebanyak mungkin dalam satu rangkaian lompatan: jumlah makan menentukan kemenangan.\n3. 1 makan ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. Tidak memakan: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Играть»: ваша золотая дамка делает ход на новой доске.\n2. Она бьёт за один ход столько фиолетовых шашек, сколько сможет: число взятых определяет выигрыш.\n3. 1 шашка ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. Ничего не взято — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Spielen“: Deine goldene Dame zieht auf einem neuen Brett.\n2. Sie schlägt in einer Sprungkette so viele violette Steine wie möglich: die Zahl der geschlagenen Steine bestimmt den Gewinn.\n3. 1 Stein ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60. Kein Schlag: Einsatz verloren.',
      hi: '1. राशि चुनें और «खेलें» छुएं: आपका सुनहरा राजा नए बोर्ड पर चाल चलता है।\n2. वह एक ही छलांग-श्रृंखला में जितनी हो सकें बैंगनी गोटियां मारता है: मारी गई गोटियों की संख्या जीत तय करती है।\n3. 1 गोटी ×0.5 · 2 ×1.5 · 3 ×4 · 4 ×12 · 5 ×60। कोई नहीं मारी: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“开始”：你的金色王棋在新棋盘上走一步。\n2. 它在一次连跳中吃掉尽可能多的紫色棋子：吃子数量决定奖金。\n3. 吃 1 子 ×0.5 · 2 子 ×1.5 · 3 子 ×4 · 4 子 ×12 · 5 子 ×60。没有吃子：输掉下注。'
    }
  });

  /* =============================== FOUR IN A ROW =============================== */
  // partie auto (or commence) : 0 violet gagne · 1 or gagne en ligne droite ×1.25 · 2 or gagne en diagonale ×1.8 · 3 deux lignes ou 5 alignés ×5 · 4 nul ×0.5
  var C4C = 7, C4R = 6;
  function c4runs(b, p, r0, c0) { return [[0, 1], [1, 0], [1, 1], [1, -1]].map(function (d) { var n = 1, cells = [[r0, c0]]; [1, -1].forEach(function (s) { var rr = r0 + d[0] * s, cc = c0 + d[1] * s; while (rr >= 0 && rr < C4R && cc >= 0 && cc < C4C && b[rr][cc] === p) { n++; cells.push([rr, cc]); rr += d[0] * s; cc += d[1] * s; } }); return [n, cells]; }); }
  function c4drop(b, cc) { for (var rr = 0; rr < C4R; rr++) if (!b[rr][cc]) return rr; return -1; }
  function c4game() {
    var b = [], moves = []; for (var rr = 0; rr < C4R; rr++) b.push([0, 0, 0, 0, 0, 0, 0]);
    var p = 1;
    for (var m = 0; m < 42; m++) {
      var cols = [0, 1, 2, 3, 4, 5, 6].filter(function (cc) { return c4drop(b, cc) >= 0; }), pick = null, q;
      for (q = 0; q < cols.length && pick === null; q++) { var r1 = c4drop(b, cols[q]); b[r1][cols[q]] = p; if (c4runs(b, p, r1, cols[q]).some(function (x) { return x[0] >= 4; })) pick = cols[q]; b[r1][cols[q]] = 0; }
      if (pick === null && Math.random() < 0.75) for (q = 0; q < cols.length && pick === null; q++) { var r2 = c4drop(b, cols[q]); b[r2][cols[q]] = 3 - p; if (c4runs(b, 3 - p, r2, cols[q]).some(function (x) { return x[0] >= 4; })) pick = cols[q]; b[r2][cols[q]] = 0; }
      if (pick === null) pick = cols[rnd(cols.length)];
      var r = c4drop(b, pick); b[r][pick] = p; moves.push([r, pick, p]);
      var L = c4runs(b, p, r, pick), wins = L.filter(function (x) { return x[0] >= 4; });
      if (wins.length) {
        var cat = p === 2 ? 0 : (wins.length >= 2 || wins.some(function (x) { return x[0] >= 5; })) ? 3 : (L[2][0] >= 4 || L[3][0] >= 4) ? 2 : 1;
        return { cat: cat, moves: moves, cells: [].concat.apply([], wins.map(function (x) { return x[1]; })) };
      }
      p = 3 - p;
    }
    return { cat: 4, moves: moves, cells: [] };
  }
  var C4X = function (cc) { return 60 + cc * 30; }, C4Y = function (rr) { return 214 - rr * 30; };
  function disc(p) { return '<circle r="12" fill="url(#' + (p === 1 ? 'c4G' : 'c4V') + ')"/><circle r="7.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>'; }
  game({
    key: 'connect4', l: verb('play'), vb: '0 0 300 250',
    chips: [['<defs><radialGradient id="c4GI" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#D97706"/></radialGradient><radialGradient id="c4VI" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#DDD6FE"/><stop offset="1" stop-color="#6D28D9"/></radialGradient></defs><circle cx="-4" r="6" fill="url(#c4GI)"/><circle cx="4" r="6" fill="url(#c4VI)"/>', 0.5],
      [[0, 1, 2, 3].map(function (j) { return '<circle cx="' + (-9 + j * 6) + '" r="3" fill="url(#c4GI)"/>'; }).join(''), 1.25],
      [[0, 1, 2, 3].map(function (j) { return '<circle cx="' + (-9 + j * 6) + '" cy="' + (9 - j * 6) + '" r="3" fill="url(#c4GI)"/>'; }).join(''), 1.8],
      [[0, 1, 2, 3].map(function (j) { return '<circle cx="' + (-9 + j * 6) + '" cy="-4" r="2.6" fill="url(#c4GI)"/><circle cx="' + (-9 + j * 6) + '" cy="4" r="2.6" fill="url(#c4GI)"/>'; }).join(''), 5]],
    chipOf: function (i) { return [-1, 1, 2, 3, 0][i]; },
    scene: '<defs><radialGradient id="c4G" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".55" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></radialGradient>' +
      '<radialGradient id="c4V" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#DDD6FE"/><stop offset=".55" stop-color="#7C3AED"/><stop offset="1" stop-color="#3B0764"/></radialGradient>' +
      '<mask id="c4Mask"><rect x="38" y="44" width="224" height="192" rx="14" fill="#fff"/>' + (function () { var s = ''; for (var rr = 0; rr < C4R; rr++) for (var cc = 0; cc < C4C; cc++) s += '<circle cx="' + C4X(cc) + '" cy="' + C4Y(rr) + '" r="12.5" fill="#000"/>'; return s; })() + '</mask></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0F0B2E"/>' +
      '<g id="c4Discs"></g><rect x="38" y="44" width="224" height="192" rx="14" fill="#1D4ED8" mask="url(#c4Mask)"/><rect x="38" y="44" width="224" height="192" rx="14" fill="none" stroke="#93C5FD" stroke-opacity=".5" stroke-width="2"/>' +
      '<path d="M30 236h240v8H30z" fill="#1E3A8A"/><g id="c4Win"></g>' +
      '<g transform="translate(70 20)"><circle r="9" fill="url(#c4G)"/></g><g transform="translate(230 20)"><circle r="9" fill="url(#c4V)"/></g><g id="c4Turn" transform="translate(70 20)"><circle r="13" fill="none" stroke="#fff" stroke-width="2"/></g>',
    reset: function (c) { c.id('c4Discs').innerHTML = ''; c.id('c4Win').innerHTML = ''; },
    play: async function (c, r) {
      var want = +r.view.i, g = null;
      for (var t = 0; t < 4000 && !g; t++) { var x = c4game(); if (x.cat === want && (x.moves.length <= 30 || want === 4)) g = x; }
      if (!g) return;
      var D = c.id('c4Discs'), turn = c.id('c4Turn'), per = g.moves.length > 30 ? 80 : (lite() ? 100 : 170);
      for (var m = 0; m < g.moves.length; m++) {
        var mv = g.moves[m]; tr(turn, mv[2] === 1 ? 70 : 230, 20);
        D.insertAdjacentHTML('beforeend', '<g>' + disc(mv[2]) + '</g>'); var e = D.lastChild, ty = C4Y(mv[0]), tx = C4X(mv[1]);
        await tw(c.box, per, function (k) { var y = lerp(30, ty, k * k); tr(e, tx, k >= 1 ? ty : y); });
        await wait(c.box, 30);
      }
      c.id('c4Win').innerHTML = g.cells.map(function (q) { return '<circle cx="' + C4X(q[1]) + '" cy="' + C4Y(q[0]) + '" r="13" fill="none" stroke="' + (want === 0 ? '#C4B5FD' : '#fff') + '" stroke-width="3"/>'; }).join('');
    },
    rules: {
      en: '1. Set your stake and tap “Play”: your gold discs (playing first) and the violet discs drop in turn until someone lines up 4.\n2. Gold lines up 4 first: you win. Violet first: you lose.\n3. Gold wins in a straight line ×1.25 · on a diagonal ×1.8 · two lines at once or 5 in a row ×5 · full board, no winner ×0.5.',
      fr: '1. Choisis ta mise et touche « Jouer » : tes jetons dorés (qui commencent) et les jetons violets tombent à tour de rôle jusqu’à ce qu’un camp en aligne 4.\n2. L’or aligne 4 le premier : tu gagnes. Le violet d’abord : tu perds.\n3. L’or gagne en ligne droite ×1.25 · en diagonale ×1.8 · deux lignes d’un coup ou 5 alignés ×5 · grille pleine sans gagnant ×0.5.',
      es: '1. Elige tu apuesta y toca «Jugar»: tus fichas doradas (que empiezan) y las violetas caen por turnos hasta que alguien alinee 4.\n2. El oro alinea 4 primero: ganas. El violeta primero: pierdes.\n3. El oro gana en línea recta ×1.25 · en diagonal ×1.8 · dos líneas a la vez o 5 seguidas ×5 · tablero lleno sin ganador ×0.5.',
      pt: '1. Escolha o valor e toque em «Jogar»: suas fichas douradas (que começam) e as roxas caem em turnos até alguém alinhar 4.\n2. O dourado alinha 4 primeiro: você ganha. O roxo primeiro: você perde.\n3. Dourado vence em linha reta ×1.25 · na diagonal ×1.8 · duas linhas de uma vez ou 5 seguidas ×5 · tabuleiro cheio sem vencedor ×0.5.',
      ar: '1. اختر الرهان والمس «العب»: تسقط أقراصك الذهبية (تبدأ أولًا) والأقراص البنفسجية بالتناوب حتى يصفّ أحدهما 4.\n2. إذا صفّ الذهبي 4 أولًا تربح، وإذا سبقه البنفسجي تخسر.\n3. فوز الذهبي بخط مستقيم ×1.25 · بخط قطري ×1.8 · بخطين معًا أو 5 متتالية ×5 · امتلاء اللوحة دون فائز ×0.5.',
      tr: '1. Bahsini seç ve “Oyna”ya dokun: altın pullar (önce oynar) ve mor pullar sırayla düşer, biri 4’ü hizalayana kadar.\n2. Altın önce 4 dizerse kazanırsın, mor önce dizerse kaybedersin.\n3. Altın düz çizgiyle ×1.25 · çaprazla ×1.8 · aynı anda iki çizgi veya 5’li ×5 · kazanan olmadan dolu tahta ×0.5.',
      vi: '1. Chọn mức cược và chạm «Chơi»: quân vàng của bạn (đi trước) và quân tím lần lượt rơi xuống đến khi có bên xếp được 4.\n2. Vàng xếp 4 trước: bạn thắng. Tím trước: bạn thua.\n3. Vàng thắng theo hàng thẳng ×1.25 · theo đường chéo ×1.8 · hai hàng cùng lúc hoặc 5 liên tiếp ×5 · đầy bàn không ai thắng ×0.5.',
      id: '1. Atur taruhan lalu sentuh «Main»: koin emasmu (jalan duluan) dan koin ungu jatuh bergantian sampai ada yang menjajarkan 4.\n2. Emas menjajarkan 4 lebih dulu: kamu menang. Ungu lebih dulu: kamu kalah.\n3. Emas menang garis lurus ×1.25 · diagonal ×1.8 · dua garis sekaligus atau 5 berjajar ×5 · papan penuh tanpa pemenang ×0.5.',
      ru: '1. Выберите ставку и нажмите «Играть»: ваши золотые фишки (ходят первыми) и фиолетовые падают по очереди, пока кто-то не выстроит 4.\n2. Золото первым выстроило 4 — выигрыш. Фиолетовые первыми — проигрыш.\n3. Победа золота по прямой ×1.25 · по диагонали ×1.8 · две линии сразу или 5 в ряд ×5 · поле заполнено без победителя ×0.5.',
      de: '1. Wähle deinen Einsatz und tippe auf „Spielen“: Deine goldenen Steine (beginnen) und die violetten fallen abwechselnd, bis jemand 4 in eine Reihe bringt.\n2. Gold schafft 4 zuerst: du gewinnst. Violett zuerst: du verlierst.\n3. Gold gewinnt gerade ×1.25 · diagonal ×1.8 · zwei Reihen auf einmal oder 5 in einer Reihe ×5 · volles Brett ohne Sieger ×0.5.',
      hi: '1. राशि चुनें और «खेलें» छुएं: आपकी सुनहरी गोटियां (पहले चलती हैं) और बैंगनी गोटियां बारी-बारी गिरती हैं, जब तक कोई 4 एक लाइन में न कर ले।\n2. सुनहरी पहले 4 जोड़े तो आप जीतते हैं, बैंगनी पहले तो हारते हैं।\n3. सुनहरी सीधी लाइन से जीते ×1.25 · तिरछी लाइन से ×1.8 · एक साथ दो लाइन या 5 एक लाइन में ×5 · बोर्ड भरा, कोई विजेता नहीं ×0.5।',
      zh: '1. 设定金额并点击“开始”：你的金色棋子（先手）和紫色棋子轮流落下，直到一方连成 4 子。\n2. 金色先连成 4 子：你赢；紫色先连成：你输。\n3. 金色直线获胜 ×1.25 · 斜线获胜 ×1.8 · 同时两条线或 5 子连线 ×5 · 棋盘下满无人获胜 ×0.5。'
    }
  });
})(window.D6 = window.D6 || {});
