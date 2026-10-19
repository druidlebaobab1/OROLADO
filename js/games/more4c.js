/* v2830 — more4c (owner request, round 5): Hole in One, Ski Jump, Cricket Six, Pool Break, Ace Serve — new instant sport games; the scene always shows exactly the line the server drew (casino_ext/more4.php). */
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
    en: { swing: 'Swing', jump: 'Jump', bat: 'Bat', brk: 'Break', serve: 'Serve' },
    fr: { swing: 'Frapper', jump: 'Sauter', bat: 'Frapper', brk: 'Casser', serve: 'Servir' },
    es: { swing: 'Golpear', jump: 'Saltar', bat: 'Batear', brk: 'Romper', serve: 'Sacar' },
    pt: { swing: 'Tacar', jump: 'Saltar', bat: 'Rebater', brk: 'Quebrar', serve: 'Sacar' },
    ar: { swing: 'اضرب', jump: 'اقفز', bat: 'اضرب', brk: 'اكسر', serve: 'أرسل' },
    tr: { swing: 'Vur', jump: 'Atla', bat: 'Vur', brk: 'Kır', serve: 'Servis' },
    vi: { swing: 'Đánh', jump: 'Nhảy', bat: 'Đánh', brk: 'Phá bi', serve: 'Giao bóng' },
    id: { swing: 'Pukul', jump: 'Lompat', bat: 'Pukul', brk: 'Pecah', serve: 'Servis' },
    ru: { swing: 'Удар', jump: 'Прыжок', bat: 'Удар', brk: 'Разбить', serve: 'Подача' },
    de: { swing: 'Abschlag', jump: 'Springen', bat: 'Schlagen', brk: 'Anstoß', serve: 'Aufschlag' },
    hi: { swing: 'शॉट', jump: 'कूदें', bat: 'बल्लेबाज़ी', brk: 'ब्रेक', serve: 'सर्व' },
    zh: { swing: '挥杆', jump: '起跳', bat: '击球', brk: '开球', serve: '发球' }
  };
  function verb(k) { return function () { var v = Lx(V); return { verb: v[k] }; }; }
  function puff(col) { return '<g class="m4-puff">' + [[-8, 0, 6], [0, -5, 7], [8, 0, 6], [-3, 3, 5], [5, 4, 5]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + col + '"/>'; }).join('') + '</g>'; }
  function burst(col) { return '<g>' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<path d="M0-10V-20" transform="rotate(' + a + ')" stroke="' + col + '" stroke-width="2.5" stroke-linecap="round"/>'; }).join('') + '</g>'; }
  async function pop(c, sel, x, y, s) { var e = c.id(sel); e.setAttribute('opacity', '1'); await tw(c.box, 450, function (k) { tr(e, x, y, (s || 1) * (0.5 + k)); e.setAttribute('opacity', (1 - k).toFixed(2)); }); }

  /* =============================== HOLE IN ONE (golf) =============================== */
  // 0 eau · 1 bunker · 2 avant-green ×0.4 · 3 green ×1.2 · 4 près du drapeau ×3 · 5 donné ×8 · 6 trou en un ×100
  var GC = [150, 92];
  function ring(rx, ry, f, s) { return '<ellipse rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (s ? ' stroke="' + s + '"' : '') + '/>'; }
  game({
    key: 'golf', l: verb('swing'), vb: '0 0 300 250',
    chips: [[ring(10, 7, '#84CC16') + ring(6, 4, '#166534'), 0.4], [ring(10, 7, '#166534') + ring(6, 4, '#22C55E'), 1.2], [ring(10, 7, '#166534') + ring(6, 4, '#22C55E') + ring(3.4, 2.4, '#BBF7D0'), 3],
      [ring(10, 7, '#166534') + ring(4, 2.8, '#FDE68A'), 8], ['<path d="M0 5V-10" stroke="#fff" stroke-width="1.4"/><path d="M0-10l8 3-8 3z" fill="#EF4444"/>' + ring(5, 2, '#0F172A'), 100]],
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs><linearGradient id="goSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312E81"/><stop offset="1" stop-color="#F472B6"/></linearGradient>' +
      '<linearGradient id="goFw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3F6212"/><stop offset="1" stop-color="#65A30D"/></linearGradient>' +
      '<radialGradient id="goGr" r=".5"><stop offset="0" stop-color="#4ADE80"/><stop offset="1" stop-color="#15803D"/></radialGradient>' +
      '<radialGradient id="goBall" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#CBD5E1"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="460" fill="url(#goSky)"/><circle cx="236" cy="34" r="14" fill="#FDE68A" opacity=".9"/>' +
      '<path d="M-400 62Q60 40 140 58T380 52L700 60V700H-400z" fill="#14532D"/>' +
      '<path d="M120 62H180L290 260H10z" fill="url(#goFw)"/><path d="M-400 62H120L10 260H-400zM180 62H700V260H290z" fill="#166534" opacity=".55"/>' +
      '<g transform="translate(64 150)"><ellipse rx="52" ry="18" fill="#1D4ED8"/><ellipse rx="44" ry="13" fill="#3B82F6"/><path d="M-30-2h20M6 4h18" stroke="#BFDBFE" stroke-width="1.5" stroke-linecap="round"/></g>' +
      '<g transform="translate(236 128)"><ellipse rx="34" ry="12" fill="#FDE68A" stroke="#D97706" stroke-width="1.2"/><path d="M-20 0q8-4 16 0t16 0" stroke="#F59E0B" fill="none"/></g>' +
      '<g transform="translate(' + GC[0] + ' ' + GC[1] + ')">' + ring(96, 30, '#65A30D') + ring(70, 21, 'url(#goGr)') + ring(34, 10.5, '#22C55E', '#BBF7D0') + ring(14, 4.6, '#4ADE80', '#FDE68A') + ring(3.6, 1.6, '#0F172A') + '</g>' +
      '<g id="goFlag" transform="translate(' + GC[0] + ' ' + GC[1] + ')"><path d="M0 0V-34" stroke="#F8FAFC" stroke-width="1.6"/><path d="M0-34l16 5-16 5z" fill="#EF4444"/></g>' +
      '<g id="goShadow" opacity="0"><ellipse rx="4" ry="1.6" fill="#000" opacity=".35"/></g><g id="goBallG" transform="translate(150 230)"><circle r="5" fill="url(#goBall)"/></g>' +
      '<g id="goSplash" opacity="0">' + puff('#BFDBFE') + '</g><g id="goSand" opacity="0">' + puff('#FDE68A') + '</g><g id="goStar" opacity="0">' + burst('#FDE68A') + '</g>' +
      '<g id="goClub" transform="translate(168 236) rotate(40)"><path d="M0 0V-46" stroke="#94A3B8" stroke-width="2.4"/><path d="M-2 0h12l-2 6h-10z" fill="#64748B"/></g>',
    reset: function (c) { tr(c.id('goBallG'), 150, 230); c.id('goBallG').style.opacity = ''; c.id('goShadow').setAttribute('opacity', '0'); },
    play: async function (c, r) {
      var i = +r.view.i, a = Math.random() * Math.PI * 2, end, roll = null;
      if (i === 0) end = [50 + rnd(30), 148 + rnd(6)];
      else if (i === 1) end = [228 + rnd(16), 126 + rnd(4)];
      else if (i === 6) end = [GC[0] - 10, GC[1] + 2];
      else { var R = [0, 0, [72, 92], [38, 66], [16, 32], [5, 12]][i], d = R[0] + Math.random() * (R[1] - R[0]); end = [GC[0] + Math.cos(a) * d, GC[1] + Math.sin(a) * d * 0.3]; if (end[1] < GC[1] - 2 && i === 2) end[1] = GC[1] + Math.abs(Math.sin(a)) * d * 0.3; }
      var club = c.id('goClub'), ball = c.id('goBallG'), sh = c.id('goShadow');
      await tw(c.box, 360, function (k) { club.setAttribute('transform', 'translate(168 236) rotate(' + lerp(40, 120, ease(k)).toFixed(0) + ')'); });
      await tw(c.box, 160, function (k) { club.setAttribute('transform', 'translate(168 236) rotate(' + lerp(120, -30, easeIn(k)).toFixed(0) + ')'); });
      sh.setAttribute('opacity', '1');
      var land = i === 6 ? [GC[0] - 14, GC[1] + 3] : end;
      await tw(c.box, 1500, function (k) {
        var gx = lerp(150, land[0], k), gy = lerp(230, land[1], Math.pow(k, 0.8)), s = lerp(1, 0.45, Math.pow(k, 0.7)), h = Math.sin(k * Math.PI) * 120 * (1 - 0.3 * k);
        tr(ball, gx, gy - h * s, s); tr(sh, gx, gy, s);
        club.setAttribute('transform', 'translate(168 236) rotate(' + lerp(-30, 40, Math.min(1, k * 3)).toFixed(0) + ')');
      });
      if (i === 0) { ball.style.opacity = '0'; sh.setAttribute('opacity', '0'); await pop(c, 'goSplash', end[0], end[1], 1.2); return; }
      if (i === 1) { sh.setAttribute('opacity', '0'); await pop(c, 'goSand', end[0], end[1]); return; }
      // petit rebond puis la balle roule jusqu'à sa place (trou en un : elle tombe dans le trou)
      var stop = i === 6 ? [GC[0], GC[1]] : end;
      await tw(c.box, 700, function (k) { var x = lerp(land[0], stop[0], ease(k)), y = lerp(land[1], stop[1], ease(k)); tr(ball, x, y - Math.sin(Math.min(1, k * 2.5) * Math.PI) * 5 * 0.45, 0.45); tr(sh, x, y, 0.45); });
      if (i === 6) { ball.style.opacity = '0'; sh.setAttribute('opacity', '0'); var f = c.id('goFlag'); if (f.animate) f.animate([{ transform: 'translate(150px,92px) rotate(0)' }, { transform: 'translate(150px,92px) rotate(-8deg)' }, { transform: 'translate(150px,92px) rotate(6deg)' }, { transform: 'translate(150px,92px) rotate(0)' }], { duration: 700 }); await pop(c, 'goStar', GC[0], GC[1] - 8, 1.6); }
    },
    rules: {
      en: '1. Set your stake and tap “Swing”: the ball flies from the tee towards the flag.\n2. Where it stops decides your win — the closer to the hole, the bigger.\n3. Fringe ×0.4 · green ×1.2 · close to the pin ×3 · tap-in ×8 · hole in one ×100. Water or bunker: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Frapper » : la balle part du départ vers le drapeau.\n2. L’endroit où elle s’arrête décide du gain : plus elle est près du trou, plus tu gagnes.\n3. Avant-green ×0.4 · green ×1.2 · près du drapeau ×3 · putt donné ×8 · trou en un ×100. Eau ou bunker : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Golpear»: la bola vuela del tee hacia la bandera.\n2. Donde se para decide tu premio: cuanto más cerca del hoyo, más ganas.\n3. Antegreen ×0.4 · green ×1.2 · cerca de la bandera ×3 · putt dado ×8 · hoyo en uno ×100. Agua o búnker: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Tacar»: a bola voa do tee até a bandeira.\n2. Onde ela para decide o prêmio: quanto mais perto do buraco, mais você ganha.\n3. Franja ×0.4 · green ×1.2 · perto da bandeira ×3 · tap-in ×8 · hole in one ×100. Água ou bunker: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «اضرب»: تطير الكرة من نقطة البداية نحو العلم.\n2. مكان توقفها يحدد ربحك: كلما اقتربت من الحفرة ربحت أكثر.\n3. حافة الغرين ×0.4 · الغرين ×1.2 · قرب العلم ×3 · على حافة الحفرة ×8 · حفرة من ضربة واحدة ×100. الماء أو الرمل: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Vur”a dokun: top tee’den bayrağa doğru uçar.\n2. Durduğu yer kazancını belirler: deliğe ne kadar yakınsa o kadar çok.\n3. Green kenarı ×0.4 · green ×1.2 · bayrağa yakın ×3 · tek vuruşluk mesafe ×8 · hole in one ×100. Su veya bunker: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Đánh»: bóng bay từ điểm phát về phía lá cờ.\n2. Nơi bóng dừng quyết định tiền thắng: càng gần lỗ càng thắng lớn.\n3. Rìa green ×0.4 · green ×1.2 · gần cờ ×3 · sát lỗ ×8 · hole in one ×100. Xuống nước hoặc hố cát: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Pukul»: bola melayang dari tee menuju bendera.\n2. Tempat bola berhenti menentukan kemenangan: makin dekat lubang, makin besar.\n3. Tepi green ×0.4 · green ×1.2 · dekat bendera ×3 · tap-in ×8 · hole in one ×100. Air atau bunker: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Удар»: мяч летит с ти к флажку.\n2. Место, где он остановится, определяет выигрыш: чем ближе к лунке, тем больше.\n3. Край грина ×0.4 · грин ×1.2 · у флажка ×3 · у самой лунки ×8 · с одного удара ×100. Вода или бункер — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Abschlag“: Der Ball fliegt vom Tee zur Fahne.\n2. Wo er liegen bleibt, bestimmt den Gewinn: je näher am Loch, desto mehr.\n3. Vorgrün ×0.4 · Grün ×1.2 · nah an der Fahne ×3 · direkt am Loch ×8 · Hole-in-One ×100. Wasser oder Bunker: Einsatz verloren.',
      hi: '1. राशि चुनें और «शॉट» छुएं: गेंद टी से झंडे की ओर उड़ती है।\n2. वह जहां रुके, वही जीत तय करता है: छेद के जितना पास, उतनी बड़ी जीत।\n3. ग्रीन का किनारा ×0.4 · ग्रीन ×1.2 · झंडे के पास ×3 · छेद के बिल्कुल पास ×8 · होल-इन-वन ×100। पानी या बंकर: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“挥杆”：球从发球台飞向旗杆。\n2. 球停下的位置决定奖金：离洞越近奖金越高。\n3. 果岭边缘 ×0.4 · 果岭 ×1.2 · 靠近旗杆 ×3 · 洞边 ×8 · 一杆进洞 ×100。落水或沙坑：输掉下注。'
    }
  });

  /* =============================== SKI JUMP =============================== */
  // 0 chute · 1 court (<95 m) · 2 95 m+ ×0.5 · 3 105 m+ ×1.2 · 4 115 m+ ×2.5 · 5 125 m+ ×6 · 6 135 m+ ×20 · 7 145 m+ record ×150
  var SJ_X = function (d) { return 104 + (d - 70) * 2.25; };            // distance → x sur la piste d'atterrissage
  var SJ_Y = function (x) { return 120 + Math.pow(Math.max(0, x - 96) / 190, 1.4) * 112; }; // profil de la piste
  function skier() { return '<g><path d="M-14 6L16 2" stroke="#F43F5E" stroke-width="2.4" stroke-linecap="round"/><path d="M-12 9L18 5" stroke="#F43F5E" stroke-width="2.4" stroke-linecap="round"/><path d="M-4 5L4-10" stroke="#1D4ED8" stroke-width="6" stroke-linecap="round"/><circle cx="6" cy="-14" r="4.5" fill="#FDE68A"/><path d="M2-16a5 5 0 0 1 9 0" fill="#EF4444"/></g>'; }
  game({
    key: 'skijump', l: verb('jump'), vb: '0 0 300 250',
    chips: [95, 105, 115, 125, 135, 145].map(function (d, j) { return ['<text y="3.5" font-size="10" font-weight="900" fill="' + (j === 5 ? '#FDE68A' : '#BAE6FD') + '" text-anchor="middle">' + d + '</text>', [0.5, 1.2, 2.5, 6, 20, 150][j]]; }),
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs><linearGradient id="sjSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0C1445"/><stop offset="1" stop-color="#4338CA"/></linearGradient>' +
      '<linearGradient id="sjSnow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8FAFC"/><stop offset="1" stop-color="#BAE6FD"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="url(#sjSky)"/><g fill="#fff" opacity=".7">' + [[30, 20], [80, 50], [200, 18], [260, 60], [150, 40], [240, 100]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1"/>'; }).join('') + '</g>' +
      '<path d="M-400 200L40 140 120 170 200 120 300 160 700 130V700H-400z" fill="#1E3A8A" opacity=".7"/>' +
      // tremplin (élan) + piste d'atterrissage
      '<path d="M-20 20Q40 30 70 92L96 112" fill="none" stroke="#64748B" stroke-width="8" stroke-linecap="round"/><path d="M-20 20Q40 30 70 92L96 112" fill="none" stroke="url(#sjSnow)" stroke-width="5" stroke-linecap="round"/>' +
      '<path id="sjHill" fill="url(#sjSnow)"/>' +
      '<g id="sjMarks"></g>' +
      '<g transform="translate(212 34)"><rect x="-44" y="-14" width="88" height="26" rx="8" fill="#0B0820" stroke="#7DD3FC" stroke-opacity=".6"/><text id="sjDist" y="5" text-anchor="middle" font-size="14" font-weight="900" fill="#FDE68A" font-family="monospace">0.0 m</text></g>' +
      '<g id="sjSnowP" opacity="0">' + puff('#fff') + '</g><g id="sjMan" transform="translate(-10 20)">' + skier() + '</g>',
    init: function (c) {
      var d = 'M96 112'; for (var x = 96; x <= 400; x += 8) d += 'L' + x + ' ' + SJ_Y(x).toFixed(1); c.id('sjHill').setAttribute('d', d + 'L400 400H96z');
      c.id('sjMarks').innerHTML = [95, 105, 115, 125, 135, 145].map(function (m, j) { var x = SJ_X(m), y = SJ_Y(x); return '<path d="M' + x.toFixed(1) + ' ' + (y - 4).toFixed(1) + 'l-3 10" stroke="' + (j === 5 ? '#F59E0B' : '#3B82F6') + '" stroke-width="2"/><text x="' + (x - 6).toFixed(1) + '" y="' + (y + 16).toFixed(1) + '" font-size="7.5" font-weight="800" fill="' + (j === 5 ? '#B45309' : '#1E3A8A') + '">' + m + '</text>'; }).join('');
    },
    reset: function (c) { tr(c.id('sjMan'), -10, 20); c.id('sjDist').textContent = '0.0 m'; },
    play: async function (c, r) {
      var i = +r.view.i, B = [[75, 140], [80, 94.5], [95, 104.5], [105, 114.5], [115, 124.5], [125, 134.5], [135, 144.5], [145, 150]][i];
      var dist = Math.round((B[0] + Math.random() * (B[1] - B[0])) * 2) / 2, man = c.id('sjMan'), dx = c.id('sjDist');
      // élan
      await tw(c.box, 1000, function (k) { var e = easeIn(k), t = e, x = lerp(-10, 96, t), y = t < 0.8 ? lerp(20, 92, Math.pow(t / 0.8, 1.6)) : lerp(92, 110, (t - 0.8) / 0.2); tr(man, x, y, 1, lerp(10, 36, t)); });
      // vol
      var lx = SJ_X(dist), ly = SJ_Y(lx);
      await tw(c.box, 1300 + (dist - 80) * 8, function (k) {
        var x = lerp(96, lx, k), base = lerp(110, ly, k * k), y = base - Math.sin(k * Math.PI) * 18;
        tr(man, x, y - 6, 1, lerp(10, 26, k)); dx.textContent = (dist * k).toFixed(1).replace('.', K.dec()) + ' m';
      });
      dx.textContent = dist.toFixed(1).replace('.', K.dec()) + ' m';
      if (i === 0) { // chute : il roule dans la neige
        var sp = pop(c, 'sjSnowP', lx, ly - 4, 1.3);
        await tw(c.box, 700, function (k) { var x = lerp(lx, lx + 30, k); tr(man, x, SJ_Y(x) - 6, 1, k * 540); });
        await sp; return;
      }
      await tw(c.box, 700, function (k) { var x = lerp(lx, lx + 40, ease(k)); tr(man, x, SJ_Y(x) - 6, 1, 26 + 8 * k); });
    },
    rules: {
      en: '1. Set your stake and tap “Jump”: the jumper races down the ramp and takes off.\n2. The distance of the landing decides your win.\n3. 95 m ×0.5 · 105 m ×1.2 · 115 m ×2.5 · 125 m ×6 · 135 m ×20 · hill record 145 m ×150. Under 95 m or a fall: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Sauter » : le sauteur dévale le tremplin et s’envole.\n2. La distance à l’atterrissage décide du gain.\n3. 95 m ×0.5 · 105 m ×1.2 · 115 m ×2.5 · 125 m ×6 · 135 m ×20 · record du tremplin 145 m ×150. Moins de 95 m ou chute : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Saltar»: el saltador baja por la rampa y despega.\n2. La distancia del aterrizaje decide tu premio.\n3. 95 m ×0.5 · 105 m ×1.2 · 115 m ×2.5 · 125 m ×6 · 135 m ×20 · récord del trampolín 145 m ×150. Menos de 95 m o caída: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Saltar»: o saltador desce a rampa e decola.\n2. A distância do pouso decide o prêmio.\n3. 95 m ×0.5 · 105 m ×1.2 · 115 m ×2.5 · 125 m ×6 · 135 m ×20 · recorde da rampa 145 m ×150. Menos de 95 m ou queda: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «اقفز»: ينزلق القافز على المنحدر ثم يطير.\n2. مسافة الهبوط تحدد ربحك.\n3. 95 م ×0.5 · 105 م ×1.2 · 115 م ×2.5 · 125 م ×6 · 135 م ×20 · رقم المنصة القياسي 145 م ×150. أقل من 95 م أو سقوط: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Atla”ya dokun: atlayıcı rampadan iner ve havalanır.\n2. İniş mesafesi kazancını belirler.\n3. 95 m ×0.5 · 105 m ×1.2 · 115 m ×2.5 · 125 m ×6 · 135 m ×20 · tepe rekoru 145 m ×150. 95 m altı veya düşüş: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Nhảy»: vận động viên lao xuống cầu trượt và cất cánh.\n2. Khoảng cách tiếp đất quyết định tiền thắng.\n3. 95 m ×0.5 · 105 m ×1.2 · 115 m ×2.5 · 125 m ×6 · 135 m ×20 · kỷ lục đồi 145 m ×150. Dưới 95 m hoặc ngã: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Lompat»: pelompat meluncur di landasan lalu terbang.\n2. Jarak pendaratan menentukan kemenangan.\n3. 95 m ×0.5 · 105 m ×1.2 · 115 m ×2.5 · 125 m ×6 · 135 m ×20 · rekor bukit 145 m ×150. Di bawah 95 m atau jatuh: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Прыжок»: прыгун разгоняется по трамплину и взлетает.\n2. Дальность приземления определяет выигрыш.\n3. 95 м ×0.5 · 105 м ×1.2 · 115 м ×2.5 · 125 м ×6 · 135 м ×20 · рекорд трамплина 145 м ×150. Меньше 95 м или падение — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Springen“: Der Springer rast die Schanze hinab und hebt ab.\n2. Die Weite der Landung bestimmt den Gewinn.\n3. 95 m ×0.5 · 105 m ×1.2 · 115 m ×2.5 · 125 m ×6 · 135 m ×20 · Schanzenrekord 145 m ×150. Unter 95 m oder Sturz: Einsatz verloren.',
      hi: '1. राशि चुनें और «कूदें» छुएं: जंपर रैंप से नीचे फिसलकर उड़ान भरता है।\n2. उतरने की दूरी आपकी जीत तय करती है।\n3. 95 मी ×0.5 · 105 मी ×1.2 · 115 मी ×2.5 · 125 मी ×6 · 135 मी ×20 · पहाड़ी रिकॉर्ड 145 मी ×150। 95 मी से कम या गिरना: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“起跳”：运动员冲下跳台腾空而起。\n2. 落地距离决定奖金。\n3. 95 米 ×0.5 · 105 米 ×1.2 · 115 米 ×2.5 · 125 米 ×6 · 135 米 ×20 · 跳台纪录 145 米 ×150。不足 95 米或摔倒：输掉下注。'
    }
  });

  /* =============================== CRICKET SIX =============================== */
  // 0 guichet (bowled) · 1 balle morte · 2 1 run ×0.5 · 3 2 runs ×1 · 4 quatre ×2.5 · 5 six ×6 · 6 six d'or ×50
  function runChip(t, gold) { return '<circle r="9.5" fill="' + (gold ? '#F59E0B' : '#BE123C') + '" stroke="#fff" stroke-width="1.4"/><text y="4" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">' + t + '</text>'; }
  game({
    key: 'cricket', l: verb('bat'), vb: '0 0 300 250',
    chips: [[runChip(1), 0.5], [runChip(2), 1], [runChip(4), 2.5], [runChip(6), 6], [runChip(6, 1), 50]],
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs><radialGradient id="crF" cx="50%" cy="60%" r="70%"><stop offset="0" stop-color="#4ADE80"/><stop offset="1" stop-color="#14532D"/></radialGradient>' +
      '<radialGradient id="crBall" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FCA5A5"/><stop offset="1" stop-color="#991B1B"/></radialGradient>' +
      '<radialGradient id="crGold" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#D97706"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0C0A2A"/>' +
      // tribunes + projecteurs
      '<path d="M-400 30H700V96H-400z" fill="#312E81"/><g class="cr-crowd">' + (function () { var s = ''; for (var y = 40; y < 92; y += 9) for (var x = -60 + (y % 2) * 5; x < 360; x += 10) s += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + ['#F472B6', '#FBBF24', '#60A5FA', '#A78BFA', '#F87171'][(x * 7 + y) % 5 < 0 ? 0 : (x * 7 + y) % 5] + '" opacity=".75"/>'; return s; })() + '</g>' +
      '<g fill="#FEF9C3">' + [20, 280].map(function (x) { return '<path d="M' + (x - 2) + ' 30V-10h4V30z" fill="#475569"/><rect x="' + (x - 10) + '" y="-18" width="20" height="10" rx="2"/>'; }).join('') + '</g>' +
      '<ellipse cx="150" cy="190" rx="250" ry="100" fill="url(#crF)"/><path d="M-100 104Q150 84 400 104" stroke="#fff" stroke-width="2" fill="none" stroke-dasharray="6 5" opacity=".8" id="crRope"/>' +
      '<path d="M50 168H250L262 196H38z" fill="#D6B98C"/><path d="M78 168l-4 28M222 168l4 28" stroke="#fff" stroke-width="1.5"/>' +
      '<g id="crStumpsB" transform="translate(226 170)"><path d="M-4 0V-20M0 0V-20M4 0V-20" stroke="#FDE68A" stroke-width="2"/></g>' +
      '<g id="crStumps" transform="translate(66 176)"><path d="M-5 0V-26M0 0V-26M5 0V-26" stroke="#FDE68A" stroke-width="2.4"/><g id="crBails"><path d="M-6-27H6" stroke="#F59E0B" stroke-width="2.2"/></g></g>' +
      // batteur
      '<g id="crBat" transform="translate(82 178)"><path d="M-4 0L-2-18M4 0L2-18" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round"/><rect x="-6" y="-38" width="12" height="22" rx="4" fill="#F8FAFC"/>' +
        '<circle cy="-44" r="6.5" fill="#1D4ED8"/><path d="M-6-44h12" stroke="#94A3B8" stroke-width="1.5"/>' +
        '<g id="crBlade" transform="translate(4 -28) rotate(150)"><rect x="-2" y="0" width="4" height="10" fill="#78350F"/><rect x="-4" y="10" width="8" height="20" rx="2" fill="#FDE68A" stroke="#B45309"/></g></g>' +
      // lanceur
      '<g id="crBowl" transform="translate(250 176)"><path d="M-4 0L-2-18M4 0L2-18" stroke="#FCA5A5" stroke-width="4" stroke-linecap="round"/><rect x="-6" y="-38" width="12" height="22" rx="4" fill="#DC2626"/><circle cy="-44" r="6" fill="#FDBA74"/></g>' +
      '<g id="crBallG" opacity="0"><circle r="4" fill="url(#crBall)"/></g>' +
      '<g transform="translate(150 16)"><rect x="-34" y="-12" width="68" height="22" rx="7" fill="#0B0820" stroke="#FDE68A" stroke-opacity=".6"/><text id="crRuns" y="4" text-anchor="middle" font-size="13" font-weight="900" fill="#FDE68A">0</text></g>' +
      '<g id="crFx" opacity="0">' + burst('#FDE68A') + '</g>',
    reset: function (c) { c.id('crRuns').textContent = '0'; c.id('crBails').removeAttribute('transform'); c.id('crBallG').setAttribute('opacity', '0'); c.id('crBallG').querySelector('circle').setAttribute('fill', 'url(#crBall)'); tr(c.id('crBat'), 82, 178); },
    play: async function (c, r) {
      var i = +r.view.i, ball = c.id('crBallG'), blade = c.id('crBlade'), bowl = c.id('crBowl'), bat = c.id('crBat'), runs = c.id('crRuns');
      await tw(c.box, 500, function (k) { tr(bowl, lerp(270, 250, k), 176 - Math.abs(Math.sin(k * Math.PI * 2)) * 4); });
      ball.setAttribute('opacity', '1');
      // la balle rebondit sur le terrain vers le batteur
      await tw(c.box, 520, function (k) { var x = lerp(244, 80, k), y = k < 0.6 ? lerp(140, 182, k / 0.6) : lerp(182, 160, (k - 0.6) / 0.4); tr(ball, x, y); });
      if (i === 0) { // il manque : la balle touche les piquets
        var bl = blade; await tw(c.box, 160, function (k) { bl.setAttribute('transform', 'translate(4 -28) rotate(' + lerp(150, 90, k).toFixed(0) + ')'); });
        await tw(c.box, 160, function (k) { tr(ball, lerp(80, 66, k), lerp(160, 160, k)); });
        c.id('crBails').setAttribute('transform', 'translate(0 -10) rotate(-30)');
        await tw(c.box, 500, function (k) { c.id('crBails').setAttribute('transform', 'translate(' + (-14 * k).toFixed(1) + ' ' + (-14 * k + 24 * k * k).toFixed(1) + ') rotate(' + (-200 * k).toFixed(0) + ')'); bl.setAttribute('transform', 'translate(4 -28) rotate(' + lerp(90, 150, k).toFixed(0) + ')'); });
        return;
      }
      await tw(c.box, 150, function (k) { blade.setAttribute('transform', 'translate(4 -28) rotate(' + lerp(150, 40, ease(k)).toFixed(0) + ')'); });
      if (i === 6) ball.querySelector('circle').setAttribute('fill', 'url(#crGold)');
      var R = [0, 0, 1, 2, 4, 6, 6][i];
      if (i === 1) await tw(c.box, 500, function (k) { tr(ball, lerp(80, 100, ease(k)), 182 - Math.sin(k * Math.PI) * 6); });
      else if (i <= 3) {
        var tx = 160 + rnd(60);
        var fly = tw(c.box, 900, function (k) { tr(ball, lerp(80, tx, ease(k)), lerp(160, 120 + rnd(2), ease(k))); });
        for (var n = 0; n < R; n++) { var nn = n; await tw(c.box, 420, function (k) { tr(bat, nn % 2 ? lerp(220, 82, k) : lerp(82, 220, k), 178 - Math.abs(Math.sin(k * Math.PI * 4)) * 3); }); runs.textContent = String(n + 1); }
        await fly;
        if (R === 1) await tw(c.box, 300, function (k) { tr(bat, 220, 178); });
      } else if (i === 4) { // quatre : le long du sol jusqu'à la corde
        await tw(c.box, 900, function (k) { tr(ball, lerp(80, 250, ease(k)), lerp(160, 106, ease(k))); });
        runs.textContent = '4';
      } else { // six : par-dessus la corde, dans les tribunes (six d'or : hors du stade)
        var gx = i === 6 ? 330 : 200 + rnd(60), gy = i === 6 ? -40 : 60 + rnd(20);
        await tw(c.box, 1100, function (k) { tr(ball, lerp(80, gx, k), lerp(160, gy, k) - Math.sin(k * Math.PI) * 80, 1 + Math.sin(k * Math.PI) * 0.6); });
        runs.textContent = '6';
        if (i === 5) await pop(c, 'crFx', gx, gy, 1); else await pop(c, 'crFx', 150, 50, 3);
      }
      if (i >= 2) { var rr = runs; if (rr.animate) rr.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 400 }); }
    },
    rules: {
      en: '1. Set your stake and tap “Bat”: the bowler delivers and your batter plays the shot.\n2. The result of the ball decides your win.\n3. 1 run ×0.5 · 2 runs ×1 · four ×2.5 · six ×6 · golden six (out of the stadium) ×50. Bowled or dot ball: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Frapper » : le lanceur envoie la balle et ton batteur joue le coup.\n2. Le résultat de la balle décide du gain.\n3. 1 run ×0.5 · 2 runs ×1 · quatre ×2.5 · six ×6 · six d’or (hors du stade) ×50. Guichet tombé ou balle morte : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Batear»: el lanzador envía la bola y tu bateador golpea.\n2. El resultado de la bola decide tu premio.\n3. 1 carrera ×0.5 · 2 carreras ×1 · cuatro ×2.5 · seis ×6 · seis de oro (fuera del estadio) ×50. Eliminado o bola muerta: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Rebater»: o arremessador lança e seu rebatedor joga.\n2. O resultado da bola decide o prêmio.\n3. 1 corrida ×0.5 · 2 corridas ×1 · quatro ×2.5 · seis ×6 · seis dourado (fora do estádio) ×50. Eliminado ou bola morta: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «اضرب»: يرمي الرامي الكرة ويضربها ضاربك.\n2. نتيجة الكرة تحدد ربحك.\n3. شوط واحد ×0.5 · شوطان ×1 · أربعة ×2.5 · ستة ×6 · ستة ذهبية (خارج الملعب) ×50. سقوط الويكيت أو كرة بلا نقاط: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Vur”a dokun: atıcı topu atar ve vurucun vuruşunu yapar.\n2. Topun sonucu kazancını belirler.\n3. 1 koşu ×0.5 · 2 koşu ×1 · dörtlük ×2.5 · altılık ×6 · altın altılık (stadyum dışı) ×50. Kale yıkılırsa veya sayı yoksa: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Đánh»: người ném bóng giao bóng và cầu thủ của bạn đánh.\n2. Kết quả cú bóng quyết định tiền thắng.\n3. 1 run ×0.5 · 2 run ×1 · bốn ×2.5 · sáu ×6 · sáu vàng (ra khỏi sân) ×50. Bị bowled hoặc bóng chết: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Pukul»: bowler melempar dan batter-mu memukul.\n2. Hasil bola menentukan kemenangan.\n3. 1 run ×0.5 · 2 run ×1 · four ×2.5 · six ×6 · six emas (keluar stadion) ×50. Bowled atau dot ball: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Удар»: боулер подаёт, ваш бэтсмен бьёт.\n2. Результат подачи определяет выигрыш.\n3. 1 ран ×0.5 · 2 рана ×1 · четыре ×2.5 · шесть ×6 · золотая шестёрка (за стадион) ×50. Калитка сбита или пустой мяч — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Schlagen“: Der Bowler wirft, dein Schlagmann spielt den Ball.\n2. Das Ergebnis des Balls bestimmt den Gewinn.\n3. 1 Run ×0.5 · 2 Runs ×1 · Four ×2.5 · Six ×6 · goldener Six (aus dem Stadion) ×50. Bowled oder Dot Ball: Einsatz verloren.',
      hi: '1. राशि चुनें और «बल्लेबाज़ी» छुएं: गेंदबाज़ गेंद डालता है और आपका बल्लेबाज़ शॉट खेलता है।\n2. गेंद का नतीजा आपकी जीत तय करता है।\n3. 1 रन ×0.5 · 2 रन ×1 · चौका ×2.5 · छक्का ×6 · सुनहरा छक्का (स्टेडियम के बाहर) ×50। बोल्ड या डॉट बॉल: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“击球”：投球手投球，你的击球手挥板。\n2. 这一球的结果决定奖金。\n3. 1 分 ×0.5 · 2 分 ×1 · 四分 ×2.5 · 六分 ×6 · 金色六分（飞出球场）×50。被击中三柱门或无得分：输掉下注。'
    }
  });

  /* =============================== POOL BREAK =============================== */
  // ligne i = billes empochées à la casse 0…5 · 6 = la noire (8) empochée
  var PC = ['#FACC15', '#2563EB', '#DC2626', '#7C3AED', '#F97316', '#16A34A', '#7F1D1D', '#111827'];
  var POCK = [[22, 40], [150, 34], [278, 40], [22, 216], [150, 222], [278, 216]];
  function pball(n) { var col = PC[(n - 1) % 8], st = n > 8; return '<circle r="7" fill="' + (st ? '#F8FAFC' : col) + '"/>' + (st ? '<path d="M-6.5-3.2h13v6.4h-13z" fill="' + col + '"/>' : '') + '<circle r="3" fill="#fff"/><text y="2" font-size="4" font-weight="900" text-anchor="middle" fill="#111">' + n + '</text><ellipse cx="-2.4" cy="-3" rx="2" ry="1.2" fill="#fff" opacity=".6"/>'; }
  game({
    key: 'pool', l: verb('brk'), vb: '0 0 300 256',
    chips: [1, 2, 3, 4, 5].map(function (n, j) { return ['<g transform="scale(1.15)">' + pball(n) + '</g>', [0.5, 1.2, 2.5, 6, 15][j]]; }).concat([['<g transform="scale(1.15)">' + pball(8) + '</g>', 100]]),
    chipOf: function (i) { return i - 1; },
    scene: '<defs><radialGradient id="plF" r=".7"><stop offset="0" stop-color="#15803D"/><stop offset="1" stop-color="#064E3B"/></radialGradient>' +
      '<linearGradient id="plW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#92400E"/><stop offset="1" stop-color="#451A03"/></linearGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#120B2A"/><rect x="2" y="16" width="296" height="224" rx="18" fill="url(#plW)"/>' +
      '<rect x="20" y="34" width="260" height="188" rx="6" fill="url(#plF)"/><path d="M84 34V222" stroke="#fff" stroke-opacity=".12"/>' +
      POCK.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" fill="#020617" stroke="#78350F" stroke-width="2"/>'; }).join('') +
      '<g fill="#FDE68A">' + [60, 110, 190, 240].map(function (x) { return '<circle cx="' + x + '" cy="25" r="1.6"/><circle cx="' + x + '" cy="231" r="1.6"/>'; }).join('') + '</g>' +
      '<g id="plBalls"></g><g id="plCue" transform="translate(84 128)"><circle r="7" fill="#F8FAFC"/><ellipse cx="-2.4" cy="-3" rx="2" ry="1.2" fill="#fff"/></g>' +
      '<g id="plStick" transform="translate(70 128)"><rect x="-150" y="-2.5" width="146" height="5" rx="2.5" fill="#D6B98C"/><rect x="-10" y="-2.5" width="6" height="5" fill="#1E3A8A"/><rect x="-150" y="-3.2" width="40" height="6.4" rx="3" fill="#78350F"/></g>',
    init: function (c) {
      c.rack = function () {
        var order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15], s = '', n = 0;
        c.pos = {};
        for (var col = 0; col < 5; col++) for (var row = 0; row <= col; row++) { var b = order[n++], x = 200 + col * 12.2, y = 128 + (row - col / 2) * 14.2; c.pos[b] = [x, y]; s += '<g class="pl-b" data-b="' + b + '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' + pball(b) + '</g>'; }
        c.id('plBalls').innerHTML = s;
      };
      c.rack();
    },
    reset: function (c) { c.rack(); tr(c.id('plCue'), 84, 128); c.id('plCue').style.opacity = ''; tr(c.id('plStick'), 70, 128); },
    play: async function (c, r) {
      var i = +r.view.i, n = i === 6 ? 1 : i, st = c.id('plStick'), cue = c.id('plCue');
      var cand = shuffle([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]), potted = i === 6 ? [8] : cand.slice(0, n);
      await tw(c.box, 500, function (k) { tr(st, lerp(70, 50, ease(k)), 128); });
      await tw(c.box, 110, function (k) { tr(st, lerp(50, 76, easeIn(k)), 128); });
      await tw(c.box, 300, function (k) { tr(cue, lerp(84, 186, k), 128); tr(st, lerp(76, 60, k), 128); });
      // la casse : chaque bille part vers sa place finale (ou dans une poche)
      var els = c.qa('.pl-b'), used = [], moves = els.map(function (e) {
        var b = +e.getAttribute('data-b'), p0 = c.pos[b];
        if (potted.indexOf(b) >= 0) { var pk = POCK[[1, 2, 4, 5, 0, 3][potted.indexOf(b) % 6]]; return [e, p0, pk, 1]; }
        var p; for (var t = 0; t < 40; t++) { p = [40 + Math.random() * 220, 52 + Math.random() * 152]; var ok = POCK.every(function (q) { return Math.hypot(q[0] - p[0], q[1] - p[1]) > 26; }) && used.every(function (q) { return Math.hypot(q[0] - p[0], q[1] - p[1]) > 16; }); if (ok) break; }
        used.push(p); return [e, p0, p, 0];
      });
      var cueEnd = [120 + rnd(60), 70 + rnd(110)];
      await tw(c.box, 1400, function (k) {
        moves.forEach(function (m) { var kk = m[3] ? Math.min(1, k * 1.25) : k, e = m[3] ? kk * kk * (3 - 2 * kk) : ease(kk); tr(m[0], lerp(m[1][0], m[2][0], e), lerp(m[1][1], m[2][1], e), m[3] ? 1 - 0.5 * Math.max(0, (kk - 0.8) / 0.2) : 1, (m[3] ? 0 : 1) * e * 200); if (m[3] && kk >= 1) m[0].style.opacity = '0'; });
        tr(cue, lerp(186, cueEnd[0], ease(k)), lerp(128, cueEnd[1], ease(k)));
      });
    },
    rules: {
      en: '1. Set your stake and tap “Break”: the cue ball smashes into the rack of 15 balls.\n2. The number of balls potted on the break decides your win.\n3. 1 ball ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · the black 8-ball potted ×100. No ball potted: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Casser » : la blanche frappe le triangle de 15 billes.\n2. Le nombre de billes empochées à la casse décide du gain.\n3. 1 bille ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · la noire (8) empochée ×100. Aucune bille empochée : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Romper»: la bola blanca golpea el triángulo de 15 bolas.\n2. El número de bolas metidas en la salida decide tu premio.\n3. 1 bola ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · la bola 8 negra metida ×100. Ninguna bola: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Quebrar»: a bola branca atinge o triângulo de 15 bolas.\n2. O número de bolas encaçapadas na saída decide o prêmio.\n3. 1 bola ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · a bola 8 preta encaçapada ×100. Nenhuma bola: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «اكسر»: تضرب الكرة البيضاء مثلث الكرات الخمس عشرة.\n2. عدد الكرات التي تدخل الجيوب في الضربة الأولى يحدد ربحك.\n3. كرة واحدة ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · دخول الكرة السوداء 8 ×100. لا كرة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Kır”a dokun: beyaz top 15 topluk üçgene çarpar.\n2. Açılışta cebe giren top sayısı kazancını belirler.\n3. 1 top ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · siyah 8 numara cebe girerse ×100. Hiç top girmezse: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Phá bi»: bi cái lao vào cụm 15 bi.\n2. Số bi vào lỗ khi phá quyết định tiền thắng.\n3. 1 bi ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · bi đen số 8 vào lỗ ×100. Không bi nào vào: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Pecah»: bola putih menghantam susunan 15 bola.\n2. Jumlah bola yang masuk saat break menentukan kemenangan.\n3. 1 bola ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · bola hitam 8 masuk ×100. Tidak ada bola masuk: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Разбить»: биток врезается в пирамиду из 15 шаров.\n2. Число шаров, забитых при разбое, определяет выигрыш.\n3. 1 шар ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · чёрная восьмёрка в лузе ×100. Ни одного шара — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Anstoß“: Die weiße Kugel kracht ins Dreieck aus 15 Kugeln.\n2. Die Zahl der beim Break versenkten Kugeln bestimmt den Gewinn.\n3. 1 Kugel ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · schwarze 8 versenkt ×100. Keine Kugel versenkt: Einsatz verloren.',
      hi: '1. राशि चुनें और «ब्रेक» छुएं: सफ़ेद गेंद 15 गेंदों के रैक से टकराती है।\n2. ब्रेक पर पॉकेट में गई गेंदों की संख्या जीत तय करती है।\n3. 1 गेंद ×0.5 · 2 ×1.2 · 3 ×2.5 · 4 ×6 · 5 ×15 · काली 8 नंबर पॉकेट में ×100। कोई गेंद नहीं: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“开球”：母球撞向 15 颗球的球堆。\n2. 开球时进袋的球数决定奖金。\n3. 1 颗 ×0.5 · 2 颗 ×1.2 · 3 颗 ×2.5 · 4 颗 ×6 · 5 颗 ×15 · 黑 8 进袋 ×100。没有进球：输掉下注。'
    }
  });

  /* =============================== ACE SERVE (tennis) =============================== */
  // 0 double faute · 1 point perdu · 2 point gagné à l'échange ×0.6 · 3 service gagnant ×1.5 · 4 ace ×3 · 5 ace à 220 km/h+ ×12 · 6 ace d'or ×100
  var CT = function (u, v) { var y = lerp(236, 46, v), hw = lerp(128, 62, v); return [150 + u * hw, y]; }; // u −1…1 (largeur), v 0 (fond près) … 1 (fond loin)
  game({
    key: 'tennis', l: verb('serve'), vb: '0 0 300 256',
    chips: [['<path d="M-8 6L4-6M-4 8l12-12" stroke="#A3E635" stroke-width="2.4" stroke-linecap="round"/>', 0.6], ['<circle r="5" fill="#D9F99D" stroke="#65A30D"/><path d="M5 0h6M8-3l3 3-3 3" stroke="#fff" stroke-width="1.6" fill="none"/>', 1.5],
      ['<circle r="7" fill="#D9F99D" stroke="#65A30D"/><text y="3.5" font-size="9" font-weight="900" text-anchor="middle" fill="#14532D">A</text>', 3], ['<path d="M2-10L-6 2h5l-3 9 9-12H0z" fill="#FDE68A" stroke="#B45309" stroke-width=".8"/>', 12], ['<circle r="7" fill="#FBBF24" stroke="#fff"/><path d="M-6-2Q0 3 6-2" stroke="#fff" fill="none"/>', 100]],
    chipOf: function (i) { return i >= 2 ? i - 2 : -1; },
    scene: '<defs><linearGradient id="tnC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1D4ED8"/><stop offset="1" stop-color="#2563EB"/></linearGradient>' +
      '<radialGradient id="tnB" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#F7FEE7"/><stop offset="1" stop-color="#84CC16"/></radialGradient>' +
      '<radialGradient id="tnG" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FEF3C7"/><stop offset="1" stop-color="#D97706"/></radialGradient></defs>' +
      '<rect x="-400" y="-400" width="1100" height="1100" fill="#0C0A2A"/><rect x="-400" y="20" width="1100" height="700" fill="#065F46"/>' +
      '<path d="M' + CT(-1.25, 0).join(' ') + 'L' + CT(-1.25, 1).join(' ') + 'L' + CT(1.25, 1).join(' ') + 'L' + CT(1.25, 0).join(' ') + 'z" fill="url(#tnC)"/>' +
      '<g stroke="#fff" stroke-width="1.6" fill="none">' +
        '<path d="M' + CT(-1, 0).join(' ') + 'L' + CT(-1, 1).join(' ') + 'L' + CT(1, 1).join(' ') + 'L' + CT(1, 0).join(' ') + 'z"/>' +
        '<path d="M' + CT(-1, 0.77).join(' ') + 'L' + CT(1, 0.77).join(' ') + 'M' + CT(-1, 0.23).join(' ') + 'L' + CT(1, 0.23).join(' ') + 'M' + CT(0, 0.23).join(' ') + 'L' + CT(0, 0.77).join(' ') + '"/></g>' +
      '<g id="tnBox" opacity="0"><path d="M' + CT(-1, 0.5).join(' ') + 'L' + CT(-1, 0.77).join(' ') + 'L' + CT(0, 0.77).join(' ') + 'L' + CT(0, 0.5).join(' ') + 'z" fill="#FDE68A" opacity=".25"/></g>' +
      '<g id="tnRec" transform="translate(' + CT(-0.5, 1.02).join(' ') + ')"><path d="M-3 0l-1-12M3 0l1-12" stroke="#F8FAFC" stroke-width="3"/><rect x="-5" y="-24" width="10" height="13" rx="3" fill="#DC2626"/><circle cy="-28" r="4" fill="#FDBA74"/><path d="M5-18l7-6" stroke="#475569" stroke-width="2"/><ellipse cx="14" cy="-26" rx="3.5" ry="4.5" fill="none" stroke="#475569" stroke-width="1.4"/></g>' +
      // filet
      '<path d="M' + CT(-1.3, 0.5).join(' ') + 'L' + CT(1.3, 0.5).join(' ') + '" stroke="#fff" stroke-width="2"/><path d="M' + CT(-1.3, 0.5)[0] + ' ' + (CT(0, 0.5)[1] + 12) + 'H' + CT(1.3, 0.5)[0] + '" stroke="#CBD5E1" stroke-width="10" opacity=".35"/>' +
      '<rect x="' + (CT(-1.3, 0.5)[0] - 2) + '" y="' + (CT(0, 0.5)[1]) + '" width="3" height="13" fill="#E2E8F0"/><rect x="' + (CT(1.3, 0.5)[0] - 1) + '" y="' + (CT(0, 0.5)[1]) + '" width="3" height="13" fill="#E2E8F0"/>' +
      '<g id="tnSh" opacity="0"><ellipse rx="3" ry="1.2" fill="#000" opacity=".4"/></g><g id="tnBall" opacity="0"><circle r="4" fill="url(#tnB)"/></g>' +
      '<g id="tnSrv" transform="translate(' + CT(0.25, -0.02).join(' ') + ')"><path d="M-4 0l-2-18M4 0l2-18" stroke="#F8FAFC" stroke-width="5" stroke-linecap="round"/><rect x="-8" y="-40" width="16" height="22" rx="5" fill="#7C3AED"/><circle cy="-46" r="6.5" fill="#FDBA74"/>' +
        '<g id="tnRk" transform="translate(8 -34) rotate(30)"><path d="M0 0V-14" stroke="#334155" stroke-width="2.5"/><ellipse cy="-22" rx="7" ry="9" fill="none" stroke="#F472B6" stroke-width="2.4"/></g></g>' +
      '<g transform="translate(244 30)"><rect x="-44" y="-13" width="88" height="24" rx="8" fill="#0B0820" stroke="#A3E635" stroke-opacity=".6"/><text id="tnSpd" y="4" text-anchor="middle" font-size="12" font-weight="900" fill="#D9F99D" font-family="monospace">— km/h</text></g>' +
      '<g id="tnFx" opacity="0">' + burst('#FDE68A') + '</g>',
    reset: function (c) { c.id('tnBall').setAttribute('opacity', '0'); c.id('tnSh').setAttribute('opacity', '0'); c.id('tnSpd').textContent = '— km/h'; c.id('tnBox').setAttribute('opacity', '0'); c.id('tnBall').querySelector('circle').setAttribute('fill', 'url(#tnB)'); tr(c.id('tnRec'), CT(-0.5, 1.02)[0], CT(-0.5, 1.02)[1]); },
    play: async function (c, r) {
      var i = +r.view.i, ball = c.id('tnBall'), sh = c.id('tnSh'), rk = c.id('tnRk'), rec = c.id('tnRec'), spd = c.id('tnSpd');
      var S = CT(0.25, -0.02), srv = [S[0] + 8, S[1] - 60];
      if (i === 6) ball.querySelector('circle').setAttribute('fill', 'url(#tnG)');
      var serve = async function (target, net) {
        ball.setAttribute('opacity', '1'); sh.setAttribute('opacity', '1');
        await tw(c.box, 520, function (k) { tr(ball, S[0] + 6, S[1] - 50 - Math.sin(k * Math.PI) * 26); tr(sh, S[0] + 6, S[1]); rk.setAttribute('transform', 'translate(8 -34) rotate(' + lerp(30, -60, k).toFixed(0) + ')'); });
        await tw(c.box, 120, function (k) { rk.setAttribute('transform', 'translate(8 -34) rotate(' + lerp(-60, 120, k).toFixed(0) + ')'); });
        var kmh = i === 6 ? 251 : i === 5 ? 220 + rnd(16) : 150 + rnd(60); spd.textContent = kmh + ' km/h';
        var T = net ? CT(-0.4 + Math.random() * 0.3, 0.49) : CT(target[0], target[1]), ms = 9000 / kmh * 60;
        await tw(c.box, ms, function (k) { var x = lerp(srv[0], T[0], k), gy = lerp(S[1], T[1], k), y = lerp(srv[1], T[1] - (net ? 10 : 0), k); tr(ball, x, Math.min(gy, y), lerp(1, 0.6, k)); tr(sh, x, gy, lerp(1, 0.6, k)); });
        if (net) { await tw(c.box, 300, function (k) { tr(ball, T[0], T[1] - 10 + 12 * k, 0.6); }); ball.setAttribute('opacity', '0'); sh.setAttribute('opacity', '0'); return T; }
        return T;
      };
      if (i === 0) { await serve(null, true); await wait(c.box, 250); await serve(null, true); return; }
      c.id('tnBox').setAttribute('opacity', '1');
      var land = await serve([-0.1 - Math.random() * 0.75, 0.55 + Math.random() * 0.18]);
      var R0 = CT(-0.5, 1.02), after = [land[0] + (i >= 4 ? 30 : 0), land[1] - 30];
      var recMove = tw(c.box, 420, function (k) { tr(rec, lerp(R0[0], i >= 4 ? R0[0] + 30 : land[0] - 6, k), R0[1]); });
      await tw(c.box, 420, function (k) { tr(ball, lerp(land[0], after[0], k), lerp(land[1], after[1], k) - Math.sin(k * Math.PI) * 10, 0.55); tr(sh, lerp(land[0], after[0], k), lerp(land[1], after[1], k), 0.55); });
      await recMove;
      if (i >= 4) { // ace : il ne la touche pas
        await tw(c.box, 300, function (k) { tr(ball, after[0] + 10 * k, after[1] - 16 * k, 0.5); tr(sh, after[0] + 10 * k, after[1] - 16 * k, 0.5); });
        ball.setAttribute('opacity', '0'); sh.setAttribute('opacity', '0');
        if (i >= 5) await pop(c, 'tnFx', 150, 120, i === 6 ? 3 : 2);
        return;
      }
      // il la touche : dehors (service gagnant), retour gagnant adverse (perdu), ou échange gagné
      var out = i === 3 ? CT(1.5, 0.95) : i === 1 ? CT(0.9, -0.05) : CT(0.6, 0.4);
      await tw(c.box, 650, function (k) { var x = lerp(after[0], out[0], k), y = lerp(after[1], out[1], k); tr(ball, x, y - Math.sin(k * Math.PI) * 30, lerp(0.55, out[1] > 150 ? 1 : 0.6, k)); tr(sh, x, y, 0.6); });
      if (i === 2) { // le serveur monte à la volée et gagne le point
        var vol = CT(-0.8, 0.9);
        await tw(c.box, 500, function (k) { var x = lerp(out[0], vol[0], k), y = lerp(out[1], vol[1], k); tr(ball, x, y - Math.sin(k * Math.PI) * 12, 0.6); tr(sh, x, y, 0.6); });
      }
      ball.setAttribute('opacity', '0'); sh.setAttribute('opacity', '0');
    },
    rules: {
      en: '1. Set your stake and tap “Serve”: your player tosses the ball and serves.\n2. How the point ends decides your win.\n3. Rally won ×0.6 · service winner ×1.5 · ace ×3 · ace at 220 km/h or more ×12 · golden ace ×100. Double fault or point lost: the stake is lost.',
      fr: '1. Choisis ta mise et touche « Servir » : ton joueur lance la balle et sert.\n2. La fin du point décide du gain.\n3. Échange gagné ×0.6 · service gagnant ×1.5 · ace ×3 · ace à 220 km/h ou plus ×12 · ace d’or ×100. Double faute ou point perdu : la mise est perdue.',
      es: '1. Elige tu apuesta y toca «Sacar»: tu jugador lanza la bola y saca.\n2. Cómo termina el punto decide tu premio.\n3. Peloteo ganado ×0.6 · saque ganador ×1.5 · ace ×3 · ace a 220 km/h o más ×12 · ace de oro ×100. Doble falta o punto perdido: pierdes la apuesta.',
      pt: '1. Escolha o valor e toque em «Sacar»: seu jogador lança a bola e saca.\n2. Como o ponto termina decide o prêmio.\n3. Troca de bolas vencida ×0.6 · saque vencedor ×1.5 · ace ×3 · ace a 220 km/h ou mais ×12 · ace dourado ×100. Dupla falta ou ponto perdido: a aposta é perdida.',
      ar: '1. اختر الرهان والمس «أرسل»: يرمي لاعبك الكرة ويرسلها.\n2. طريقة انتهاء النقطة تحدد ربحك.\n3. الفوز بالتبادل ×0.6 · إرسال رابح ×1.5 · إرسال ساحق ×3 · إرسال ساحق بسرعة 220 كم/س أو أكثر ×12 · إرسال ذهبي ×100. خطأ مزدوج أو خسارة النقطة: تخسر الرهان.',
      tr: '1. Bahsini seç ve “Servis”e dokun: oyuncun topu atar ve servis kullanır.\n2. Sayının bitişi kazancını belirler.\n3. Ralli kazanıldı ×0.6 · kazandıran servis ×1.5 · as ×3 · 220 km/s ve üstü as ×12 · altın as ×100. Çift hata veya kaybedilen sayı: bahis kaybedilir.',
      vi: '1. Chọn mức cược và chạm «Giao bóng»: tay vợt tung bóng và giao.\n2. Cách điểm số kết thúc quyết định tiền thắng.\n3. Thắng sau loạt đánh ×0.6 · giao bóng ăn điểm ×1.5 · ace ×3 · ace từ 220 km/h ×12 · ace vàng ×100. Lỗi kép hoặc mất điểm: mất tiền cược.',
      id: '1. Atur taruhan lalu sentuh «Servis»: pemainmu melambungkan bola dan melakukan servis.\n2. Cara poin berakhir menentukan kemenangan.\n3. Reli dimenangkan ×0.6 · servis winner ×1.5 · ace ×3 · ace 220 km/jam atau lebih ×12 · ace emas ×100. Double fault atau poin hilang: taruhan hilang.',
      ru: '1. Выберите ставку и нажмите «Подача»: ваш игрок подбрасывает мяч и подаёт.\n2. Исход розыгрыша определяет выигрыш.\n3. Выигранный розыгрыш ×0.6 · выигрышная подача ×1.5 · эйс ×3 · эйс 220 км/ч и быстрее ×12 · золотой эйс ×100. Двойная ошибка или проигранное очко — ставка проиграна.',
      de: '1. Wähle deinen Einsatz und tippe auf „Aufschlag“: Dein Spieler wirft den Ball hoch und schlägt auf.\n2. Wie der Punkt endet, bestimmt den Gewinn.\n3. Ballwechsel gewonnen ×0.6 · Aufschlagwinner ×1.5 · Ass ×3 · Ass mit 220 km/h oder mehr ×12 · goldenes Ass ×100. Doppelfehler oder Punkt verloren: Einsatz verloren.',
      hi: '1. राशि चुनें और «सर्व» छुएं: आपका खिलाड़ी गेंद उछालकर सर्व करता है।\n2. पॉइंट कैसे खत्म होता है, यही जीत तय करता है।\n3. रैली जीती ×0.6 · सर्विस विनर ×1.5 · ऐस ×3 · 220 किमी/घं या ज़्यादा का ऐस ×12 · सुनहरा ऐस ×100। डबल फ़ॉल्ट या पॉइंट हारा: दांव हार जाते हैं।',
      zh: '1. 设定金额并点击“发球”：你的球员抛球并发球。\n2. 这一分如何结束决定奖金。\n3. 相持得分 ×0.6 · 发球制胜 ×1.5 · ACE 球 ×3 · 220 公里/时以上的 ACE ×12 · 金色 ACE ×100。双误或丢分：输掉下注。'
    }
  });
})(window.D6 = window.D6 || {});
