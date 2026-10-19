/* v2805 — board1: 4 new instant board games (owner request), provider-style, in the OROLADO space look.
   - Plinko (Spribe-like): 12 rows of pegs, 13 bins; several balls can fall at once; the ball path is built to land in
     the bin the server drew (view.i = number of right bounces, exact binomial weights).
   - Mini Roulette: 13 pockets 0–12, bet on one number ×12.22; wheel + ball land on the drawn number (view.w).
   - Keno 80: choose 5 numbers on 80, 20 balls are drawn; the drawn set has exactly the server's number of hits (view.i).
   - Money Wheel (Dream-Catcher-like): 54 segments 1 · 2 · 5 · 10 · 20 · 40, bet on one symbol; the wheel stops on a
     segment of the drawn symbol (view.w). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = { en: { bet: 'Bet' }, fr: { bet: 'Miser' }, es: { bet: 'Apostar' }, pt: { bet: 'Apostar' }, ar: { bet: 'راهن' }, tr: { bet: 'Bahis' },
    vi: { bet: 'Cược' }, id: { bet: 'Pasang' }, ru: { bet: 'Ставка' }, de: { bet: 'Setzen' }, hi: { bet: 'दांव' }, zh: { bet: '下注' } };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function pm(p) { return Math.floor(0.94 / p * 100) / 100; }
  function num(v) { return String(v).replace('.', K.dec()); }
  function xm(v) { return '×' + (Math.round(v * 100) / 100).toFixed(2).replace('.', K.dec()); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var HIST = {};
  function hist(key, el, item) {
    var h = HIST[key] = HIST[key] || [];
    if (item) { h.unshift(item); if (h.length > 24) h.length = 24; }
    if (el) el.innerHTML = h.map(function (q) { return '<i class="' + q[0] + '">' + q[1] + '</i>'; }).join('');
  }
  function shell(box, key, scene, opts, l) {
    box.classList.add('cg-game', 'cg-' + key, 'b1-game');
    box.innerHTML = '<div class="cg-stage b1-stage"><div class="cg-hist b1-hist"></div><div class="b1-scene">' + scene + '</div></div>' + K.stakePanel(l.bet, opts);
    K.bindStake(box);
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(function () { if (box.isConnected) K.fitAll(box); }, 30); }); } catch (e) { /* ignore */ }
    return { hist: box.querySelector('.b1-hist'), go: $('csGo') };
  }
  function lock(box, on) { box.classList.toggle('b1-busy', on); var g = $('csGo'); if (g) g.disabled = on; }
  // une boucle d'animation par jeu ; stoppée par le cadre (K.S.raf) et quand on quitte le jeu
  function loop(box, step) {
    var run = true;
    var f = function (t) { if (!run || !box.isConnected) { run = false; return; } if (step(t) === false) { run = false; return; } K.S.raf = requestAnimationFrame(f); };
    K.S.raf = requestAnimationFrame(f);
    return function () { run = false; };
  }
  function ease(p) { return 1 - Math.pow(1 - p, 3); }

  /* ================= Plinko ================= */
  var PM = [29, 9, 4, 2, 1.1, 0.5, 0.3, 0.5, 1.1, 2, 4, 9, 29];
  var PCOL = ['#22C55E', '#84CC16', '#FACC15', '#F59E0B', '#F97316', '#F43F5E', '#E11D48'];
  K.register('plinko2', function (box) {
    var l = L(), DX = 21, Y0 = 22, DY = 17.4, CX = 150;
    var pegs = '';
    for (var r = 0; r < 12; r++) for (var j = 0; j < r + 3; j++) pegs += '<circle cx="' + (CX + (j - (r + 2) / 2) * DX).toFixed(1) + '" cy="' + (Y0 + r * DY).toFixed(1) + '" r="2.7"/>';
    var BY = Y0 + 11 * DY + 14;
    var bins = PM.map(function (m, k) {
      var x = CX + (k - 6) * DX, c = PCOL[Math.abs(k - 6)];
      return '<g class="pk-bin" data-k="' + k + '"><rect x="' + (x - DX / 2 + 1.2).toFixed(1) + '" y="' + BY + '" width="' + (DX - 2.4) + '" height="19" rx="4" fill="' + c + '"/>' +
        '<rect x="' + (x - DX / 2 + 1.2).toFixed(1) + '" y="' + (BY + 15) + '" width="' + (DX - 2.4) + '" height="4" rx="2" fill="#000" opacity=".25"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (BY + 12.6) + '" text-anchor="middle">' + num(m) + '</text></g>';
    }).join('');
    var scene = '<svg class="b1-svg pk-svg" viewBox="0 0 300 ' + (BY + 22) + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>' +
      '<radialGradient id="pkB" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#FF7AB6"/><stop offset="1" stop-color="#BE185D"/></radialGradient>' +
      '<linearGradient id="pkT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8B5CF6" stop-opacity=".25"/><stop offset="1" stop-color="#8B5CF6" stop-opacity=".05"/></linearGradient></defs>' +
      '<path d="M' + (CX - 1.5 * DX) + ' ' + (Y0 - 12) + 'H' + (CX + 1.5 * DX) + 'L' + (CX + 7.5 * DX) + ' ' + (BY - 4) + 'H' + (CX - 7.5 * DX) + 'z" fill="url(#pkT)"/>' +
      '<g class="pk-pegs">' + pegs + '</g>' + bins + '<g class="pk-balls"></g></svg>';
    var u = shell(box, 'plinko2', scene, '', l);
    var svg = box.querySelector('.pk-svg'), layer = svg.querySelector('.pk-balls'), balls = [], stop = null;
    hist('plinko2', u.hist);
    var land = function (b) {
      var bin = svg.querySelector('.pk-bin[data-k="' + b.k + '"]');
      bin.classList.remove('hit'); void bin.getBoundingClientRect(); bin.classList.add('hit');
      var m = PM[b.k];
      hist('plinko2', u.hist, [m >= 4 ? 'hi' : m >= 1 ? 'mid' : 'lo', num(m)]);
      K.resultLine(box, b.r);
    };
    var tick = function (t) {
      for (var i = balls.length - 1; i >= 0; i--) {
        var b = balls[i], seg = (t - b.t0) / b.sd;
        if (seg < 0) continue;
        var n = Math.floor(seg), f = seg - n, P = b.pts;
        if (n !== b.n) { b.n = n; if (n > 0 && n < P.length - 1) K.sfx('tick', { p: n / 12 }); } // v2832 : la bille touche un clou
        if (n >= P.length - 1) { b.el.remove(); balls.splice(i, 1); land(b); continue; }
        var a = P[n], c = P[n + 1], hop = n === P.length - 2 ? 4 : 9;
        b.el.setAttribute('cx', (a[0] + (c[0] - a[0]) * f).toFixed(2));
        b.el.setAttribute('cy', (a[1] + (c[1] - a[1]) * f * f - hop * f * (1 - f) * (n ? 1 : 0)).toFixed(2));
      }
      if (!balls.length) { stop = null; return false; }
    };
    u.go.addEventListener('click', async function () {
      if (balls.length >= 6) return;
      var r = await K.play('plinko2', {});
      if (!r || !box.isConnected) return;
      var k = r.view.i, moves = [];
      for (var q = 0; q < 12; q++) moves.push(q < k ? 1 : 0);
      shuffle(moves);
      var pts = [[CX + (Math.random() - 0.5) * 4, Y0 - 16]], R = 0;
      for (var row = 0; row < 12; row++) { pts.push([CX + (R - row / 2) * DX, Y0 + row * DY - 7.5]); R += moves[row]; }
      pts.push([CX + (k - 6) * DX, BY + 6]);
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      el.setAttribute('r', '5.6'); el.setAttribute('fill', 'url(#pkB)'); el.setAttribute('cx', pts[0][0]); el.setAttribute('cy', pts[0][1]);
      layer.appendChild(el);
      balls.push({ el: el, pts: pts, k: k, r: r, t0: performance.now(), sd: lite() ? 70 : 120 });
      if (!stop) stop = loop(box, tick);
    });
  }, { rules: {
    en: '1. Tap “Bet”: a ball drops through 12 rows of pegs (you can drop several).\n2. It lands in one of 13 boxes: ×0.3 in the middle up to ×29 on the edges.\n3. You win your stake × the box where it lands.',
    fr: '1. Touche « Miser » : une bille tombe à travers 12 rangées de clous (tu peux en lancer plusieurs).\n2. Elle finit dans une des 13 cases : ×0,3 au milieu jusqu’à ×29 sur les bords.\n3. Tu gagnes ta mise × la case où elle tombe.',
    es: '1. Toca «Apostar»: una bola cae por 12 filas de clavos (puedes lanzar varias).\n2. Cae en una de 13 casillas: ×0,3 en el centro hasta ×29 en los bordes.\n3. Ganas tu apuesta × la casilla donde cae.',
    pt: '1. Toque em «Apostar»: uma bola cai por 12 fileiras de pinos (pode lançar várias).\n2. Ela cai numa das 13 casas: ×0,3 no meio até ×29 nas bordas.\n3. Você ganha a aposta × a casa onde ela cai.',
    ar: '1. اضغط «راهن»: تسقط كرة عبر 12 صفًا من المسامير (يمكنك رمي عدة كرات).\n2. تقع في إحدى 13 خانة: ×0.3 في الوسط حتى ×29 على الأطراف.\n3. تربح رهانك × الخانة التي تقع فيها.',
    tr: '1. «Bahis»e dokun: top 12 sıra çividen düşer (birkaç top atabilirsin).\n2. 13 kutudan birine düşer: ortada ×0,3, kenarlarda ×29’a kadar.\n3. Bahsin × düştüğü kutu kadar kazanırsın.',
    vi: '1. Chạm «Cược»: một quả bóng rơi qua 12 hàng đinh (có thể thả nhiều quả).\n2. Bóng rơi vào 1 trong 13 ô: ×0,3 ở giữa đến ×29 ở hai rìa.\n3. Bạn thắng tiền cược × ô bóng rơi vào.',
    id: '1. Ketuk «Pasang»: bola jatuh melewati 12 baris pasak (bisa beberapa bola).\n2. Bola masuk ke salah satu dari 13 kotak: ×0,3 di tengah hingga ×29 di tepi.\n3. Kamu menang taruhan × kotak tempat bola jatuh.',
    ru: '1. Нажмите «Ставка»: шарик падает через 12 рядов штырьков (можно бросить несколько).\n2. Он попадает в одну из 13 ячеек: ×0,3 в центре и до ×29 по краям.\n3. Вы получаете ставку × ячейку, куда он упал.',
    de: '1. Tippe auf „Setzen“: Eine Kugel fällt durch 12 Reihen Stifte (mehrere möglich).\n2. Sie landet in einem von 13 Fächern: ×0,3 in der Mitte bis ×29 am Rand.\n3. Du gewinnst deinen Einsatz × das Fach, in dem sie landet.',
    hi: '1. «दांव» दबाएँ: गेंद कीलों की 12 पंक्तियों से गिरती है (कई गेंदें डाल सकते हैं)।\n2. यह 13 खानों में से एक में गिरती है: बीच में ×0.3 से किनारों पर ×29 तक।\n3. आप दांव × उस खाने जितना जीतते हैं।',
    zh: '1. 点「下注」：小球穿过 12 排钉子落下（可连续投多个）。\n2. 落入 13 个格子之一：中间 ×0.3，两边最高 ×29。\n3. 你赢得下注 × 所落格子的倍数。'
  } });

  /* ================= Mini Roulette ================= */
  var MR = { v: 7 }, MR_ORDER = [0, 5, 10, 3, 8, 1, 12, 7, 2, 9, 4, 11, 6], MR_M = pm(1 / 13);
  function mrCol(n) { return n === 0 ? 'g' : n % 2 ? 'r' : 'b'; }
  K.register('miniroul', function (box) {
    var l = L(), A = 360 / 13, C = 120;
    var pol = function (r, deg) { var a = deg * Math.PI / 180; return [(C + r * Math.sin(a)).toFixed(2), (C - r * Math.cos(a)).toFixed(2)]; };
    var pockets = MR_ORDER.map(function (n, i) {
      var a0 = i * A - A / 2, a1 = a0 + A, p0 = pol(98, a0), p1 = pol(98, a1), q0 = pol(66, a1), q1 = pol(66, a0), t = pol(87, i * A);
      var col = n === 0 ? '#16A34A' : n % 2 ? '#DC2626' : '#1E1B3A';
      return '<path d="M' + p0 + 'A98 98 0 0 1 ' + p1 + 'L' + q0 + 'A66 66 0 0 0 ' + q1 + 'z" fill="' + col + '" stroke="#FDE68A" stroke-width=".8"/>' +
        '<text x="' + t[0] + '" y="' + t[1] + '" transform="rotate(' + (i * A).toFixed(2) + ' ' + t[0] + ' ' + t[1] + ')" text-anchor="middle" dominant-baseline="central">' + n + '</text>';
    }).join('');
    var spokes = ''; for (var s = 0; s < 4; s++) { var e = pol(40, s * 90 + 45); spokes += '<path d="M' + C + ' ' + C + 'L' + e[0] + ' ' + e[1] + '" stroke="url(#mrG)" stroke-width="5" stroke-linecap="round"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="5" fill="url(#mrG)"/>'; }
    var scene = '<svg class="b1-svg mr-svg" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>' +
      '<radialGradient id="mrG" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".5" stop-color="#F5B700"/><stop offset="1" stop-color="#9A6A00"/></radialGradient>' +
      '<radialGradient id="mrW" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#D97706"/><stop offset=".6" stop-color="#92400E"/><stop offset="1" stop-color="#451A03"/></radialGradient>' +
      '<radialGradient id="mrB" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#E2E8F0"/><stop offset="1" stop-color="#94A3B8"/></radialGradient></defs>' +
      '<circle cx="120" cy="123" r="117" fill="#000" opacity=".35"/><circle cx="120" cy="120" r="117" fill="url(#mrW)"/><circle cx="120" cy="120" r="112" fill="#2A1206" stroke="url(#mrG)" stroke-width="3"/>' +
      '<g class="mr-wheel">' + pockets + '<circle cx="120" cy="120" r="66" fill="url(#mrW)" stroke="url(#mrG)" stroke-width="2"/>' + spokes + '<circle cx="120" cy="120" r="12" fill="url(#mrG)" stroke="#7A4A00"/></g>' +
      '<path d="M120 4l-7 10h14z" fill="url(#mrG)" stroke="#7A4A00" stroke-width=".8"/>' +
      '<circle class="mr-ball" r="6" cx="120" cy="47" fill="url(#mrB)" stroke="#475569" stroke-width=".6"/></svg>' +
      '<div class="mr-pill"><i class="mr-chip">7</i><b class="fit">' + xm(MR_M) + '</b></div>';
    var nb = function (n) { return '<button type="button" data-o="' + n + '" class="mr-n c' + mrCol(n) + '"><b class="fit">' + n + '</b></button>'; };
    var grid = '<div class="mr-grid">' + nb(0) + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(nb).join('') + '</div>';
    var u = shell(box, 'miniroul', scene, grid, l);
    var svg = box.querySelector('.mr-svg'), wh = svg.querySelector('.mr-wheel'), ball = svg.querySelector('.mr-ball'), chip = box.querySelector('.mr-chip');
    var rot = 0, bAng = 0, bR = 73;
    var paint = function () { wh.setAttribute('transform', 'rotate(' + rot.toFixed(2) + ' 120 120)'); var p = pol(bR, bAng); ball.setAttribute('cx', p[0]); ball.setAttribute('cy', p[1]); };
    var sel = function (v) { MR.v = v; box.querySelectorAll('.mr-n').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-o') === v); }); chip.textContent = String(v); chip.className = 'mr-chip c' + mrCol(v); };
    box.querySelectorAll('.mr-n').forEach(function (b) { b.addEventListener('click', function () { if (!box.classList.contains('b1-busy')) sel(+b.getAttribute('data-o')); }); });
    sel(MR.v); hist('miniroul', u.hist); paint();
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('b1-busy')) return;
      lock(box, true);
      var r = await K.play('miniroul', { pick: MR.v });
      if (!r || !box.isConnected) { lock(box, false); return; }
      var w = r.view.w, idx = MR_ORDER.indexOf(w), r0 = rot, b0 = bAng;
      // la case gagnante finit en haut, sous la bille
      var r1 = r0 + 720 + (((-idx * A - r0) % 360) + 360) % 360, b1 = Math.ceil(b0 / 360) * 360 - 1440;
      var D = lite() ? 1800 : 4200, t0 = performance.now();
      loop(box, function (t) {
        var p = Math.min(1, (t - t0) / D), e = ease(p);
        rot = r0 + (r1 - r0) * e; bAng = b0 + (b1 - b0) * (1 - Math.pow(1 - p, 2.2));
        bR = p < 0.6 ? 106 : 106 - (106 - 73) * Math.min(1, (p - 0.6) / 0.3) + (p > 0.75 && p < 0.92 ? Math.sin((p - 0.75) / 0.17 * Math.PI) * 4 : 0);
        if (p >= 1) { rot = r1 % 360; bAng = 0; bR = 73; }
        else K.sfxBeat(MR, 'pk', Math.floor((bAng - rot) / A), 'tick', p < 0.6 ? { v: 0.45 } : null); // v2832 : la bille passe les cases
        paint();
        if (p >= 1) {
          hist('miniroul', u.hist, ['n' + mrCol(w), String(w)]);
          K.resultLine(box, r);
          lock(box, false);
          return false;
        }
      });
    });
  }, { rules: {
    en: '1. Choose a number from 0 to 12.\n2. Tap “Bet”: the wheel spins and the ball drops into a pocket.\n3. If it lands on your number you win ×12.22 your stake.',
    fr: '1. Choisis un numéro de 0 à 12.\n2. Touche « Miser » : la roue tourne, la bille tombe dans une case.\n3. Si elle s’arrête sur ton numéro, tu gagnes ×12,22 ta mise.',
    es: '1. Elige un número del 0 al 12.\n2. Toca «Apostar»: la rueda gira y la bola cae en una casilla.\n3. Si cae en tu número ganas ×12,22 tu apuesta.',
    pt: '1. Escolha um número de 0 a 12.\n2. Toque em «Apostar»: a roda gira e a bola cai numa casa.\n3. Se cair no seu número, você ganha ×12,22 a aposta.',
    ar: '1. اختر رقمًا من 0 إلى 12.\n2. اضغط «راهن»: تدور العجلة وتسقط الكرة في خانة.\n3. إذا وقعت على رقمك تربح ×12.22 من رهانك.',
    tr: '1. 0 ile 12 arasında bir sayı seç.\n2. «Bahis»e dokun: çark döner, top bir cebe düşer.\n3. Senin sayına düşerse bahsinin ×12,22 katını kazanırsın.',
    vi: '1. Chọn một số từ 0 đến 12.\n2. Chạm «Cược»: bánh xe quay, bi rơi vào một ô.\n3. Rơi đúng số của bạn là thắng ×12,22 tiền cược.',
    id: '1. Pilih angka dari 0 sampai 12.\n2. Ketuk «Pasang»: roda berputar, bola jatuh ke satu kantong.\n3. Jika jatuh di angkamu, kamu menang ×12,22 taruhan.',
    ru: '1. Выберите число от 0 до 12.\n2. Нажмите «Ставка»: колесо крутится, шарик падает в ячейку.\n3. Выпало ваше число — выигрыш ×12,22 ставки.',
    de: '1. Wähle eine Zahl von 0 bis 12.\n2. Tippe auf „Setzen“: Das Rad dreht sich, die Kugel fällt in ein Fach.\n3. Landet sie auf deiner Zahl, gewinnst du ×12,22 deines Einsatzes.',
    hi: '1. 0 से 12 में से एक संख्या चुनें।\n2. «दांव» दबाएँ: पहिया घूमता है और गेंद एक खाने में गिरती है।\n3. आपकी संख्या पर गिरे तो आप दांव का ×12.22 जीतते हैं।',
    zh: '1. 选择 0 到 12 中的一个数字。\n2. 点「下注」：轮盘转动，小球落入一格。\n3. 落在你的数字上即赢下注的 ×12.22。'
  } });

  /* ================= Keno 80 ================= */
  var KN = { picks: [3, 17, 28, 44, 61] }, KN_PAY = [[2, 1], [3, 3], [4, 17], [5, 325]];
  K.register('keno80', function (box) {
    var l = L(), cells = '';
    for (var n = 1; n <= 80; n++) cells += '<button type="button" class="kn-c" data-n="' + n + '"><span>' + n + '</span></button>';
    var pay = KN_PAY.map(function (p) { return '<span class="kn-p" data-h="' + p[0] + '"><i>' + p[0] + '</i><b class="fit">×' + num(p[1]) + '</b></span>'; }).join('');
    var scene = '<div class="kn-pay">' + pay + '</div><div class="kn-grid">' + cells + '</div>';
    var tools = '<div class="kn-tools"><button type="button" class="kn-t" id="knRand" aria-label="Random"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="15" r="1.5"/><circle cx="15" cy="9" r="1.5"/><circle cx="9" cy="15" r="1.5"/><circle cx="12" cy="12" r="1.5"/></svg></button>' +
      '<span class="kn-cnt" id="knCnt" dir="ltr">0/5</span><button type="button" class="kn-t" id="knClr" aria-label="Clear"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></div>';
    var u = shell(box, 'keno80', scene, tools, l);
    var cellOf = function (n) { return box.querySelector('.kn-c[data-n="' + n + '"]'); };
    var paint = function () {
      box.querySelectorAll('.kn-c').forEach(function (c) { c.classList.toggle('on', KN.picks.indexOf(+c.getAttribute('data-n')) >= 0); });
      K.setText($('knCnt'), KN.picks.length + '/5');
    };
    var clearDraw = function () { box.querySelectorAll('.kn-c.d,.kn-c.h').forEach(function (c) { c.classList.remove('d', 'h'); }); box.querySelectorAll('.kn-p.on').forEach(function (p) { p.classList.remove('on'); }); };
    var fill = function () { while (KN.picks.length < 5) { var q = 1 + rnd(80); if (KN.picks.indexOf(q) < 0) KN.picks.push(q); } };
    box.querySelector('.kn-grid').addEventListener('click', function (e) {
      var c = e.target.closest('.kn-c'); if (!c || box.classList.contains('b1-busy')) return;
      clearDraw();
      var n = +c.getAttribute('data-n'), i = KN.picks.indexOf(n);
      if (i >= 0) KN.picks.splice(i, 1); else if (KN.picks.length < 5) KN.picks.push(n); else { KN.picks.shift(); KN.picks.push(n); }
      paint();
    });
    $('knRand').addEventListener('click', function () { if (box.classList.contains('b1-busy')) return; clearDraw(); KN.picks = []; fill(); paint(); });
    $('knClr').addEventListener('click', function () { if (box.classList.contains('b1-busy')) return; clearDraw(); KN.picks = []; paint(); });
    paint(); hist('keno80', u.hist);
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('b1-busy')) return;
      if (KN.picks.length < 5) { fill(); paint(); }
      lock(box, true); clearDraw();
      var r = await K.play('keno80', { picks: KN.picks.slice() });
      if (!r || !box.isConnected) { lock(box, false); return; }
      // 20 boules : exactement view.i de tes 5 numéros, le reste parmi les 75 autres
      var h = r.view.i, mine = shuffle(KN.picks.slice()), rest = [];
      for (var q = 1; q <= 80; q++) if (KN.picks.indexOf(q) < 0) rest.push(q);
      var draw = shuffle(mine.slice(0, h).concat(shuffle(rest).slice(0, 20 - h)));
      var hits = 0;
      try {
        for (var i = 0; i < draw.length; i++) {
          await K.sleep(lite() ? 35 : 95);
          if (!box.isConnected) return;
          var c = cellOf(draw[i]), hit = KN.picks.indexOf(draw[i]) >= 0;
          c.classList.add(hit ? 'h' : 'd');
          K.sfx(hit ? 'step' : 'ball', { k: hit ? hits + 1 : i }); // v2832 : chaque boule tirée
          if (hit) { hits++; box.querySelectorAll('.kn-p').forEach(function (p) { p.classList.toggle('on', +p.getAttribute('data-h') === hits); }); }
        }
      } catch (e) { return; }
      hist('keno80', u.hist, [h >= 4 ? 'hi' : h >= 2 ? 'mid' : 'lo', h + '/5']);
      K.resultLine(box, r);
      lock(box, false);
    });
  }, { rules: {
    en: '1. Choose 5 numbers out of 80 (or tap the dice for a random pick).\n2. Tap “Bet”: 20 balls are drawn.\n3. 2 hits ×1 · 3 hits ×3 · 4 hits ×17 · 5 hits ×325.',
    fr: '1. Choisis 5 numéros sur 80 (ou touche le dé pour un choix au hasard).\n2. Touche « Miser » : 20 boules sont tirées.\n3. 2 bons ×1 · 3 bons ×3 · 4 bons ×17 · 5 bons ×325.',
    es: '1. Elige 5 números de 80 (o toca el dado para elegir al azar).\n2. Toca «Apostar»: se sortean 20 bolas.\n3. 2 aciertos ×1 · 3 ×3 · 4 ×17 · 5 ×325.',
    pt: '1. Escolha 5 números de 80 (ou toque no dado para sortear).\n2. Toque em «Apostar»: 20 bolas são sorteadas.\n3. 2 acertos ×1 · 3 ×3 · 4 ×17 · 5 ×325.',
    ar: '1. اختر 5 أرقام من 80 (أو اضغط النرد لاختيار عشوائي).\n2. اضغط «راهن»: تُسحب 20 كرة.\n3. إصابتان ×1 · 3 إصابات ×3 · 4 إصابات ×17 · 5 إصابات ×325.',
    tr: '1. 80 sayıdan 5 tane seç (ya da rastgele seçim için zara dokun).\n2. «Bahis»e dokun: 20 top çekilir.\n3. 2 isabet ×1 · 3 ×3 · 4 ×17 · 5 ×325.',
    vi: '1. Chọn 5 số trong 80 (hoặc chạm xúc xắc để chọn ngẫu nhiên).\n2. Chạm «Cược»: 20 quả bóng được quay.\n3. Trúng 2 ×1 · trúng 3 ×3 · trúng 4 ×17 · trúng 5 ×325.',
    id: '1. Pilih 5 angka dari 80 (atau ketuk dadu untuk acak).\n2. Ketuk «Pasang»: 20 bola diundi.\n3. 2 cocok ×1 · 3 ×3 · 4 ×17 · 5 ×325.',
    ru: '1. Выберите 5 чисел из 80 (или нажмите кубик для случайного выбора).\n2. Нажмите «Ставка»: вытягивают 20 шаров.\n3. 2 совпадения ×1 · 3 ×3 · 4 ×17 · 5 ×325.',
    de: '1. Wähle 5 von 80 Zahlen (oder tippe auf den Würfel für eine Zufallswahl).\n2. Tippe auf „Setzen“: 20 Kugeln werden gezogen.\n3. 2 Treffer ×1 · 3 ×3 · 4 ×17 · 5 ×325.',
    hi: '1. 80 में से 5 संख्याएँ चुनें (या रैंडम के लिए पासा दबाएँ)।\n2. «दांव» दबाएँ: 20 गेंदें निकाली जाती हैं।\n3. 2 मिलान ×1 · 3 ×3 · 4 ×17 · 5 ×325।',
    zh: '1. 从 80 个号码中选 5 个（或点骰子随机选）。\n2. 点「下注」：开出 20 个球。\n3. 中 2 个 ×1 · 中 3 个 ×3 · 中 4 个 ×17 · 中 5 个 ×325。'
  } });

  /* ================= Money Wheel ================= */
  var MW_SYM = [1, 2, 5, 10, 20, 40], MW_CNT = [24, 16, 7, 4, 2, 1], MW_COL = ['#FACC15', '#3B82F6', '#EC4899', '#22C55E', '#F97316', '#A855F7'];
  var MW_SEG = (function () { // 54 cases bien réparties : chaque symbole à intervalles réguliers
    var it = []; MW_CNT.forEach(function (c, s) { for (var j = 0; j < c; j++) it.push([((j + 0.5) / c + s * 0.161) % 1, s]); });
    return it.sort(function (a, b) { return a[0] - b[0]; }).map(function (q) { return q[1]; });
  })();
  var MW = { v: 0 };
  K.register('wheel2', function (box) {
    var l = L(), C = 130, R = 118, N = MW_SEG.length, A = 360 / N;
    var pol = function (r, deg) { var a = deg * Math.PI / 180; return [(C + r * Math.sin(a)).toFixed(2), (C - r * Math.cos(a)).toFixed(2)]; };
    var segs = MW_SEG.map(function (s, i) {
      var a0 = i * A - A / 2, a1 = a0 + A, p0 = pol(R, a0), p1 = pol(R, a1), q0 = pol(38, a1), q1 = pol(38, a0), t = pol(R - 15, i * A);
      return '<path d="M' + p0 + 'A' + R + ' ' + R + ' 0 0 1 ' + p1 + 'L' + q0 + 'A38 38 0 0 0 ' + q1 + 'z" fill="' + MW_COL[s] + '" stroke="#1E1B4B" stroke-width=".7"/>' +
        '<text x="' + t[0] + '" y="' + t[1] + '" transform="rotate(' + (i * A + 90).toFixed(2) + ' ' + t[0] + ' ' + t[1] + ')" text-anchor="middle" dominant-baseline="central">' + MW_SYM[s] + '</text>';
    }).join('');
    var bulbs = ''; for (var b = 0; b < 27; b++) { var p = pol(R + 6, b * 360 / 27); bulbs += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.8"/>'; }
    var scene = '<svg class="b1-svg mw-svg" viewBox="0 0 260 260" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>' +
      '<radialGradient id="mwG" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".5" stop-color="#F5B700"/><stop offset="1" stop-color="#9A6A00"/></radialGradient>' +
      '<radialGradient id="mwS" cx="50%" cy="50%" r="50%"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>' +
      '<linearGradient id="mwP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A9B"/><stop offset="1" stop-color="#B91C1C"/></linearGradient></defs>' +
      '<circle cx="130" cy="133" r="128" fill="#000" opacity=".35"/><circle cx="130" cy="130" r="128" fill="url(#mwG)"/><circle cx="130" cy="130" r="' + (R + 2) + '" fill="#1E1B4B"/>' +
      '<g class="mw-bulbs">' + bulbs + '</g><g class="mw-wheel">' + segs + '<circle cx="130" cy="130" r="' + R + '" fill="url(#mwS)"/></g>' +
      '<circle cx="130" cy="130" r="38" fill="#140B38" stroke="url(#mwG)" stroke-width="4"/><text class="mw-hub" x="130" y="131" text-anchor="middle" dominant-baseline="central">$</text>' +
      '<g class="mw-pin"><path d="M130 22L120 2Q130-3 140 2z" fill="url(#mwP)" stroke="#FDE68A" stroke-width="1.4" stroke-linejoin="round"/></g></svg>';
    var ob = MW_SYM.map(function (s, i) { return '<button type="button" data-o="' + i + '" class="mw-o" style="--mc:' + MW_COL[i] + '"><b class="fit">' + s + '</b><small class="fit">' + xm(pm(MW_CNT[i] / 54)) + '</small></button>'; }).join('');
    var u = shell(box, 'wheel2', scene, '<div class="cg-opts mw-opts">' + ob + '</div>', l);
    var svg = box.querySelector('.mw-svg'), wh = svg.querySelector('.mw-wheel'), pin = svg.querySelector('.mw-pin'), hub = svg.querySelector('.mw-hub');
    var rot = 0;
    var paint = function () { wh.setAttribute('transform', 'rotate(' + rot.toFixed(2) + ' 130 130)'); };
    var sel = function (v) { MW.v = v; box.querySelectorAll('.mw-o').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-o') === v); }); };
    box.querySelectorAll('.mw-o').forEach(function (b) { b.addEventListener('click', function () { if (!box.classList.contains('b1-busy')) sel(+b.getAttribute('data-o')); }); });
    sel(MW.v); hist('wheel2', u.hist); paint();
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('b1-busy')) return;
      lock(box, true); hub.textContent = '$'; hub.removeAttribute('fill');
      var r = await K.play('wheel2', { pick: MW.v });
      if (!r || !box.isConnected) { lock(box, false); return; }
      var w = r.view.w, cand = []; MW_SEG.forEach(function (s, i) { if (s === w) cand.push(i); });
      var idx = cand[rnd(cand.length)], jit = (Math.random() - 0.5) * A * 0.6;
      var r0 = rot, r1 = r0 + 1080 + (((-idx * A + jit - r0) % 360) + 360) % 360, D = lite() ? 1800 : 4800, t0 = performance.now();
      loop(box, function (t) {
        var p = Math.min(1, (t - t0) / D);
        rot = r0 + (r1 - r0) * ease(p);
        paint();
        if (p < 1) K.sfxBeat(MW, 'sg', Math.floor((rot + A / 2) / A), 'tick'); // v2832 : tic à chaque case sous le clapet
        var fr = (((rot + A / 2) % A) + A) % A / A; // passage d'une case : le clapet bascule
        pin.setAttribute('transform', 'rotate(' + (-16 * Math.max(0, 1 - fr * 5)).toFixed(1) + ' 130 6)');
        if (p >= 1) {
          rot = r1 % 360; paint(); pin.removeAttribute('transform');
          hub.textContent = String(MW_SYM[w]); hub.setAttribute('fill', MW_COL[w]);
          hist('wheel2', u.hist, ['w' + w, String(MW_SYM[w])]);
          K.resultLine(box, r);
          lock(box, false);
          return false;
        }
      });
    });
  }, { rules: {
    en: '1. Bet on a symbol: 1 ×2.11 · 2 ×3.17 · 5 ×7.25 · 10 ×12.69 · 20 ×25.38 · 40 ×50.76.\n2. Tap “Bet”: the 54-segment wheel spins.\n3. If it stops on your symbol you win.',
    fr: '1. Mise sur un symbole : 1 ×2,11 · 2 ×3,17 · 5 ×7,25 · 10 ×12,69 · 20 ×25,38 · 40 ×50,76.\n2. Touche « Miser » : la roue de 54 cases tourne.\n3. Si elle s’arrête sur ton symbole, tu gagnes.',
    es: '1. Apuesta a un símbolo: 1 ×2,11 · 2 ×3,17 · 5 ×7,25 · 10 ×12,69 · 20 ×25,38 · 40 ×50,76.\n2. Toca «Apostar»: gira la rueda de 54 casillas.\n3. Si para en tu símbolo, ganas.',
    pt: '1. Aposte num símbolo: 1 ×2,11 · 2 ×3,17 · 5 ×7,25 · 10 ×12,69 · 20 ×25,38 · 40 ×50,76.\n2. Toque em «Apostar»: a roda de 54 casas gira.\n3. Se parar no seu símbolo, você ganha.',
    ar: '1. راهن على رمز: 1 ×2.11 · 2 ×3.17 · 5 ×7.25 · 10 ×12.69 · 20 ×25.38 · 40 ×50.76.\n2. اضغط «راهن»: تدور العجلة ذات 54 خانة.\n3. إذا توقفت على رمزك تربح.',
    tr: '1. Bir sembole bahis yap: 1 ×2,11 · 2 ×3,17 · 5 ×7,25 · 10 ×12,69 · 20 ×25,38 · 40 ×50,76.\n2. «Bahis»e dokun: 54 dilimli çark döner.\n3. Senin sembolünde durursa kazanırsın.',
    vi: '1. Cược vào một ký hiệu: 1 ×2,11 · 2 ×3,17 · 5 ×7,25 · 10 ×12,69 · 20 ×25,38 · 40 ×50,76.\n2. Chạm «Cược»: bánh xe 54 ô quay.\n3. Dừng đúng ký hiệu của bạn là thắng.',
    id: '1. Pasang pada simbol: 1 ×2,11 · 2 ×3,17 · 5 ×7,25 · 10 ×12,69 · 20 ×25,38 · 40 ×50,76.\n2. Ketuk «Pasang»: roda 54 segmen berputar.\n3. Jika berhenti di simbolmu, kamu menang.',
    ru: '1. Ставка на символ: 1 ×2,11 · 2 ×3,17 · 5 ×7,25 · 10 ×12,69 · 20 ×25,38 · 40 ×50,76.\n2. Нажмите «Ставка»: колесо из 54 секторов крутится.\n3. Остановилось на вашем символе — вы выиграли.',
    de: '1. Setze auf ein Symbol: 1 ×2,11 · 2 ×3,17 · 5 ×7,25 · 10 ×12,69 · 20 ×25,38 · 40 ×50,76.\n2. Tippe auf „Setzen“: Das Rad mit 54 Feldern dreht sich.\n3. Hält es auf deinem Symbol, gewinnst du.',
    hi: '1. किसी चिह्न पर दांव लगाएँ: 1 ×2.11 · 2 ×3.17 · 5 ×7.25 · 10 ×12.69 · 20 ×25.38 · 40 ×50.76।\n2. «दांव» दबाएँ: 54 खानों वाला पहिया घूमता है।\n3. आपके चिह्न पर रुके तो आप जीतते हैं।',
    zh: '1. 押一个符号：1 ×2.11 · 2 ×3.17 · 5 ×7.25 · 10 ×12.69 · 20 ×25.38 · 40 ×50.76。\n2. 点「下注」：54 格的转轮转动。\n3. 停在你的符号上即赢。'
  } });
})(window.D6 = window.D6 || {});
