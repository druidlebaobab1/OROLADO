/* v2807 — Star Bowling (NEW instant game, owner request): one roll at 10 pins on a cosmic lane. The server draws the line of
   casino_ext/more3.php 'bowling' (view.i = pins knocked down 0…10, 11 = golden strike); this file rolls the ball and knocks
   down EXACTLY that many pins. Payouts: 6 ×0.3 · 7 ×0.8 · 8 ×1.2 · 9 ×1.8 · strike ×3.25 · golden strike ×15 (RTP 93.58 %). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Roll', strike: 'Strike!' }, fr: { bet: 'Lancer', strike: 'Strike !' }, es: { bet: 'Lanzar', strike: '¡Strike!' },
    pt: { bet: 'Lançar', strike: 'Strike!' }, ar: { bet: 'ارمِ', strike: 'سترايك!' }, tr: { bet: 'At', strike: 'Strike!' },
    vi: { bet: 'Lăn bóng', strike: 'Strike!' }, id: { bet: 'Gulirkan', strike: 'Strike!' }, ru: { bet: 'Бросок', strike: 'Страйк!' },
    de: { bet: 'Werfen', strike: 'Strike!' }, hi: { bet: 'फेंकें', strike: 'स्ट्राइक!' }, zh: { bet: '投球', strike: '全中！' }
  };
  var RULES = {
    en: '1. Set your stake and tap “Roll”: the ball rolls down the lane at the 10 pins.\n2. The more pins fall, the more you win: 6 pins ×0.3 · 7 ×0.8 · 8 ×1.2 · 9 ×1.8 · Strike (all 10) ×3.25.\n3. Golden strike (the head pin turns gold): ×15. 5 pins or fewer: the stake is lost.',
    fr: '1. Choisis ta mise et touche « Lancer » : la boule roule vers les 10 quilles.\n2. Plus il tombe de quilles, plus tu gagnes : 6 quilles ×0,3 · 7 ×0,8 · 8 ×1,2 · 9 ×1,8 · Strike (les 10) ×3,25.\n3. Strike doré (la quille de tête devient dorée) : ×15. 5 quilles ou moins : la mise est perdue.',
    es: '1. Elige tu apuesta y toca «Lanzar»: la bola rueda hacia los 10 bolos.\n2. Cuantos más bolos caen, más ganas: 6 bolos ×0,3 · 7 ×0,8 · 8 ×1,2 · 9 ×1,8 · Strike (los 10) ×3,25.\n3. Strike dorado (el bolo delantero se vuelve dorado): ×15. 5 bolos o menos: pierdes la apuesta.',
    pt: '1. Escolha o valor e toque em «Lançar»: a bola rola até os 10 pinos.\n2. Quanto mais pinos caem, mais você ganha: 6 pinos ×0,3 · 7 ×0,8 · 8 ×1,2 · 9 ×1,8 · Strike (os 10) ×3,25.\n3. Strike dourado (o pino da frente fica dourado): ×15. 5 pinos ou menos: a aposta é perdida.',
    ar: '1. اختر مبلغ الرهان والمس «ارمِ»: تتدحرج الكرة نحو القوارير العشر.\n2. كلما سقط عدد أكبر ربحت أكثر: 6 قوارير ×0.3 · 7 ×0.8 · 8 ×1.2 · 9 ×1.8 · سترايك (العشر كلها) ×3.25.\n3. سترايك ذهبي (تصبح القارورة الأمامية ذهبية): ×15. 5 قوارير أو أقل: تخسر الرهان.',
    tr: '1. Tutarını seç ve “At”a dokun: top 10 lobuta doğru yuvarlanır.\n2. Ne kadar çok lobut düşerse o kadar kazanırsın: 6 lobut ×0,3 · 7 ×0,8 · 8 ×1,2 · 9 ×1,8 · Strike (10’u da) ×3,25.\n3. Altın strike (öndeki lobut altın olur): ×15. 5 lobut veya daha az: bahis kaybedilir.',
    vi: '1. Chọn mức cược và chạm «Lăn bóng»: bóng lăn về phía 10 ky.\n2. Càng nhiều ky đổ, bạn càng thắng nhiều: 6 ky ×0,3 · 7 ×0,8 · 8 ×1,2 · 9 ×1,8 · Strike (đổ cả 10) ×3,25.\n3. Strike vàng (ky đầu hóa vàng): ×15. 5 ky trở xuống: mất tiền cược.',
    id: '1. Atur taruhan lalu sentuh «Gulirkan»: bola meluncur ke 10 pin.\n2. Makin banyak pin jatuh, makin besar menangmu: 6 pin ×0,3 · 7 ×0,8 · 8 ×1,2 · 9 ×1,8 · Strike (semua 10) ×3,25.\n3. Strike emas (pin depan menjadi emas): ×15. 5 pin atau kurang: taruhan hilang.',
    ru: '1. Выберите ставку и нажмите «Бросок»: шар катится к 10 кеглям.\n2. Чем больше кеглей упало, тем больше выигрыш: 6 кеглей ×0,3 · 7 ×0,8 · 8 ×1,2 · 9 ×1,8 · Страйк (все 10) ×3,25.\n3. Золотой страйк (передняя кегля становится золотой): ×15. 5 кеглей или меньше: ставка проиграна.',
    de: '1. Wähle deinen Einsatz und tippe auf „Werfen“: Die Kugel rollt auf die 10 Pins zu.\n2. Je mehr Pins fallen, desto mehr gewinnst du: 6 Pins ×0,3 · 7 ×0,8 · 8 ×1,2 · 9 ×1,8 · Strike (alle 10) ×3,25.\n3. Goldener Strike (der vordere Pin wird golden): ×15. 5 Pins oder weniger: Einsatz verloren.',
    hi: '1. राशि चुनें और «फेंकें» छुएं: गेंद 10 पिनों की ओर लुढ़कती है।\n2. जितनी ज़्यादा पिनें गिरें, उतना ज़्यादा जीत: 6 पिन ×0.3 · 7 ×0.8 · 8 ×1.2 · 9 ×1.8 · स्ट्राइक (सभी 10) ×3.25।\n3. गोल्डन स्ट्राइक (सामने की पिन सुनहरी हो जाती है): ×15। 5 या कम पिनें: दांव हार जाते हैं।',
    zh: '1. 设定金额并点击“投球”：球滚向 10 个球瓶。\n2. 击倒越多赢得越多：6 瓶 ×0.3 · 7 ×0.8 · 8 ×1.2 · 9 ×1.8 · 全中（10 瓶）×3.25。\n3. 黄金全中（头瓶变成金色）：×15。5 瓶或更少：输掉下注。'
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var PAY = [[6, 0.3], [7, 0.8], [8, 1.2], [9, 1.8], [10, 3.25], [11, 15]]; // = casino_ext/more3.php
  // quilles : 0 tête · 1-2 · 3-5 · 6-9 (gauche → droite) ; [x, y, taille]
  var PINS = [[150, 104, 1], [139, 94, .93], [161, 94, .93], [128, 84, .87], [150, 84, .87], [172, 84, .87], [117, 74, .81], [139, 74, .81], [161, 74, .81], [183, 74, .81]];
  // v2807b : jeu de quilles agrandi (×1,4 autour de la tête) pour qu'on voie bien les quilles sur téléphone
  PINS = PINS.map(function (p) { return [150 + (p[0] - 150) * 1.4, 106 - (104 - p[1]) * 1.4, p[2] * 1.4]; });
  var FALL = { 0: [], 1: [9], 2: [5, 9], 3: [2, 5, 9], 4: [2, 5, 8, 9], 5: [2, 4, 5, 8, 9], 6: [0, 2, 4, 5, 8, 9], 7: [0, 1, 2, 4, 5, 8, 9], 8: [0, 1, 2, 3, 4, 5, 7, 8], 9: [0, 1, 2, 3, 4, 5, 7, 8, 9], 10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] };
  // point visé par la boule (x en haut de piste) selon le nombre de quilles
  var AIM = { 0: -1, 1: 199, 2: 191, 3: 183, 4: 175, 5: 170, 6: 163, 7: 159, 8: 156, 9: 155, 10: 154 };
  function pinSvg(i, p) {
    return '<g class="bw-pin" data-i="' + i + '" transform="translate(' + p[0] + ' ' + p[1] + ') scale(' + p[2] + ')"><g class="bw-pk">' +
      '<ellipse cy="1" rx="5" ry="1.6" fill="#000" opacity=".35"/>' +
      '<path d="M0-24c-2.2 0-3 2-3 4 0 2.4 1.3 3.6 1.3 5.6 0 2-3.6 4.6-3.6 9.6 0 3.3 1.3 5.6 2 6.6h6.6c.7-1 2-3.3 2-6.6 0-5-3.6-7.6-3.6-9.6 0-2 1.3-3.2 1.3-5.6 0-2-.8-4-3-4z" class="bw-body"/>' +
      '<path d="M-2.2-14.2h4.4M-2-12.4h4" stroke="#E11D48" stroke-width="1.2"/><path d="M-1.4-21.5c-.4 1.4 0 3 .4 4" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/></g></g>';
  }
  function ease(k) { return 1 - Math.pow(1 - k, 3); }
  function anim(box, ms, fn) {
    return new Promise(function (res) {
      var t0 = performance.now();
      var step = function (now) { if (!box.isConnected) { res(); return; } var k = Math.min(1, (now - t0) / ms); fn(k); if (k < 1) K.S.raf = requestAnimationFrame(step); else res(); };
      K.S.raf = requestAnimationFrame(step);
    });
  }

  K.register('bowling', function (box) {
    var l = L(), dc = K.dec(), busy = false;
    var mx = function (v) { return '×' + String(v).replace('.', dc); };
    box.classList.add('cg-game', 'cg-bowling');
    var stars = ''; for (var s = 0; s < 36; s++) stars += '<circle cx="' + (K.seeded(s, 7) * 300).toFixed(0) + '" cy="' + (K.seeded(s, 8) * 120 - 60).toFixed(0) + '" r="' + (0.4 + K.seeded(s, 9) * .9).toFixed(1) + '"/>';
    var boards = ''; for (var b = 1; b < 12; b++) { var t = b / 12; boards += '<path d="M' + (98 + 104 * t).toFixed(1) + ' 50L' + (66 + 168 * t).toFixed(1) + ' 400"/>'; }
    var arrows = [0.25, 0.375, 0.5, 0.625, 0.75].map(function (t) { var x = 98 + 104 * t; return '<path d="M' + x.toFixed(1) + ' 250l-3 7h6z"/>'; }).join('');
    box.innerHTML = '<div class="cg-stage bw-stage"><div class="bw-pay" id="bwPay">' + PAY.map(function (p) {
        return '<span data-n="' + p[0] + '"><i>' + (p[0] === 11 ? '★' : p[0] === 10 ? 'X' : p[0]) + '</i><b class="fit">' + mx(p[1]) + '</b></span>'; }).join('') + '</div>' +
      '<div class="bw-field"><svg class="bw-svg" id="bwSvg" viewBox="0 0 300 340" preserveAspectRatio="xMidYMax meet" dir="ltr" aria-hidden="true"><defs>' +
        '<linearGradient id="bwWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C4A1E"/><stop offset=".35" stop-color="#C98A4B"/><stop offset="1" stop-color="#E7B57A"/></linearGradient>' +
        '<linearGradient id="bwPinG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CBD5E1"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#A8B3C4"/></linearGradient>' +
        '<linearGradient id="bwGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B45309"/><stop offset=".45" stop-color="#FDE68A"/><stop offset="1" stop-color="#D97706"/></linearGradient>' +
        '<radialGradient id="bwBall" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F5D0FE"/><stop offset=".5" stop-color="#A855F7"/><stop offset="1" stop-color="#3B0764"/></radialGradient>' +
        '<radialGradient id="bwGlow" r=".5"><stop offset="0" stop-color="#C4B5FD" stop-opacity=".55"/><stop offset="1" stop-color="#C4B5FD" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="bwFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0720"/><stop offset="1" stop-color="#0B0720" stop-opacity="0"/></linearGradient></defs>' +
        '<rect x="-400" y="-200" width="1100" height="700" fill="#0B0720"/><g fill="#fff" opacity=".7">' + stars + '</g>' +
        '<g class="bw-planet"><circle cx="252" cy="-18" r="16" fill="#F59E0B"/><ellipse cx="252" cy="-18" rx="27" ry="6" fill="none" stroke="#FDE68A" stroke-opacity=".55" stroke-width="1.6" transform="rotate(-16 252 -18)"/></g>' +
        '<ellipse cx="150" cy="62" rx="110" ry="44" fill="url(#bwGlow)"/>' +
        // masquage du fond de piste + gouttières + piste en perspective
        '<rect x="80" y="10" width="140" height="42" rx="4" fill="#120B2E"/><path d="M80 38H220" stroke="#7C3AED" stroke-width="2" opacity=".6"/>' +
        '<path d="M88 50L40 400H260L212 50z" fill="#1E1B4B"/><path d="M93 50L54 400H66L98 50zM207 50L246 400H234L202 50z" fill="#0B0720" opacity=".7"/>' +
        '<path d="M98 50L66 400H234L202 50z" fill="url(#bwWood)"/><g stroke="#5B3412" stroke-opacity=".28" stroke-width=".6">' + boards + '</g>' +
        '<path d="M98 50L66 400H234L202 50z" fill="url(#bwFade)" opacity=".35"/><g fill="#5B21B6" opacity=".55">' + arrows + '</g>' +
        '<path d="M96 300H204" stroke="#7C3AED" stroke-opacity=".35" stroke-width="1.4"/>' +
        '<g id="bwPins">' + PINS.slice().reverse().map(function (p, j) { var i = PINS.length - 1 - j; return pinSvg(i, p); }).join('') + '</g>' +
        '<g id="bwBallG" transform="translate(150 316)"><ellipse cy="20" rx="17" ry="4" fill="#000" opacity=".35"/><g id="bwBallR"><circle r="20" fill="url(#bwBall)"/>' +
          '<circle cx="-5" cy="-7" r="2.6" fill="#1E0B3B"/><circle cx="3" cy="-8" r="2.6" fill="#1E0B3B"/><circle cx="-1" cy="0" r="3.2" fill="#1E0B3B"/></g><ellipse cx="-7" cy="-9" rx="6" ry="3.5" fill="#fff" opacity=".4" transform="rotate(-30 -7 -9)"/></g>' +
        '<text id="bwFlash" class="bw-flash" x="150" y="170" text-anchor="middle"></text>' +
      '</svg></div></div>' + K.stakePanel(l.bet);
    K.bindStake(box);
    var go = $('csGo'), ballG = $('bwBallG'), ballR = $('bwBallR'), pins = {}, flashEl = $('bwFlash'), svg = $('bwSvg');
    box.querySelectorAll('.bw-pin').forEach(function (e) { pins[e.getAttribute('data-i')] = e; });
    var lite = function () { return document.documentElement.classList.contains('oro-lite'); };
    // la piste remplit la hauteur : on garde toujours les quilles et la boule, le décor s'étend autour
    function fitView() {
      if (!svg.isConnected) return;
      var w = svg.clientWidth, h = svg.clientHeight; if (!w || !h) return;
      var cw = 210, ch = 316, cx = 45, cy = 14, ar = w / h, vx, vy, vw, vh;
      if (ar > cw / ch) { vh = ch; vw = ch * ar; vx = 150 - vw / 2; vy = cy; } else { vw = cw; vh = cw / ar; vx = cx; vy = cy + ch - vh; }
      svg.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));
    }
    if (window.ResizeObserver) new ResizeObserver(fitView).observe(svg); else window.addEventListener('resize', fitView);
    requestAnimationFrame(function () { fitView(); K.fitAll(box); });
    function setBall(x, y, s, r, o) { ballG.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')'); ballR.setAttribute('transform', 'rotate(' + r.toFixed(0) + ')'); ballG.style.opacity = o == null ? '' : o; }
    function resetPins() {
      Object.keys(pins).forEach(function (k) { var p = PINS[+k], e = pins[k]; e.setAttribute('transform', 'translate(' + p[0] + ' ' + p[1] + ') scale(' + p[2] + ')'); e.style.opacity = ''; e.classList.remove('gold', 'down'); });
    }
    function markPay(n) { box.querySelectorAll('#bwPay span').forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-n') === n); }); }
    function flash(txt) {
      flashEl.setAttribute('class', 'bw-flash'); flashEl.textContent = txt; flashEl.style.fontSize = "34px";
      try { var w = flashEl.getComputedTextLength(); if (w > 170) flashEl.style.fontSize = (34 * 170 / w).toFixed(1) + 'px'; } catch (e) { /* ignore */ }
      void flashEl.getBoundingClientRect(); flashEl.setAttribute('class', 'bw-flash on');
    }
    go.addEventListener('click', async function () {
      if (busy) return;
      busy = true; go.disabled = true;
      var r = await K.play('bowling', {});
      if (!r || !box.isConnected) { busy = false; go.disabled = false; return; }
      var i = +((r.view || {}).i || 0), gold = i === 11, n = Math.min(10, i), fast = lite();
      resetPins(); markPay(-1); flashEl.setAttribute('class', 'bw-flash');
      // 1) la boule roule (un peu d'effet) ; 0 = elle tombe dans la gouttière
      var aim = AIM[n], gutter = aim < 0, side = K.seeded(Date.now() % 1000, 3) < 0.5 ? -1 : 1;
      var x0 = 150 + (gutter ? 6 * side : (aim > 160 ? -10 : 8)), y0 = 316, x1 = gutter ? 150 + side * 56 : aim, y1 = gutter ? 118 : 108;
      var hook = gutter ? side * 10 : (x1 - 150) * 0.2 + 16;
      await anim(box, fast ? 500 : 1150, function (k) {
        var e = k < 0.15 ? k * k / 0.3 : k - 0.075, kk = Math.min(1, e / 0.925);
        var gx = gutter && kk > 0.45 ? 150 + side * (6 + 50 * Math.min(1, (kk - 0.45) / 0.2)) : x0 + (x1 - x0) * kk + hook * Math.sin(Math.PI * kk) * (gutter ? 0 : 1);
        var y = y0 + (y1 - y0) * kk, s = 1 - 0.6 * kk;
        setBall(gx, y, s, kk * 900 * (side), null);
      });
      if (!box.isConnected) return;
      // 2) les quilles tombent (exactement n), la tête devient dorée pour le strike doré
      var down = FALL[n] || [];
      if (down.length) K.sfx('stop'); // v2832 : les quilles tombent
      if (gold && pins[0]) pins[0].classList.add('gold');
      var dirs = down.map(function (pi) { var p = PINS[pi], dx = p[0] - (gutter ? 150 : x1), dir = dx === 0 ? (K.seeded(pi, 5) < .5 ? -1 : 1) : Math.sign(dx); return [pi, dir, (p[1] < 85 ? 1 : 0) + Math.abs(p[0] - x1) / 40]; });
      var bx = gutter ? x1 : x1, ballGone = anim(box, fast ? 250 : 500, function (k) { setBall(bx + (gutter ? 0 : (x1 - 150) * 0.1 * k), y1 - 60 * k, 0.4 - 0.1 * k, 900 + 200 * k, String(1 - k)); });
      await anim(box, fast ? 400 : 900, function (k) {
        dirs.forEach(function (d) {
          var p = PINS[d[0]], kk = Math.max(0, Math.min(1, (k - d[2] * 0.08) / 0.55)), e = ease(kk);
          pins[d[0]].setAttribute('transform', 'translate(' + (p[0] + d[1] * (11 + 8 * K.seeded(d[0], 2)) * e).toFixed(1) + ' ' + (p[1] - 7 * e + 3 * kk * kk).toFixed(1) + ') scale(' + p[2] + ') rotate(' + (d[1] * 95 * e).toFixed(0) + ')');
          pins[d[0]].style.opacity = String(1 - Math.max(0, kk - 0.45) / 0.55);
        });
      });
      await ballGone;
      if (!box.isConnected) return;
      markPay(gold ? 11 : n);
      if (n === 10) flash(l.strike);
      K.resultLine(box, r);
      if (K.afterPlay) K.afterPlay(r);
      await K.sleep(fast ? 300 : 900);
      if (!box.isConnected) return;
      // nouvelle partie : la boule revient, les quilles se relèvent
      resetPins(); setBall(150, 316, 1, 0, '');
      if (ballG.animate) ballG.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      busy = false; go.disabled = false;
    });
  }, { rules: RULES });
})(window.D6 = window.D6 || {});
