/* v2805 — pick1: 5 new instant "pick" games (owner request), provider-style one-tap rounds in the OROLADO space look.
   - Thimbles (3 gold thimbles) and Cups & Balls (5 ruby cups): the ball is shown, the cups are shuffled, the cups lift.
   - Goal: one shot on a 3-zone goal against the keeper (Spribe-Goal-like single shot).
   - Color Prediction: a ring of 20 beads (9 green, 2 violet, 9 red), the light runs and stops on the drawn colour.
   - Lucky Dice: 2 dice, bet Under 7 / 7 / Over 7.
   Server (casino_ext/more1.php): K.play(key, {pick}) → view.w (winning option) — or view.i (Goal table line). The scene
   always shows exactly what the server drew. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', green: 'Green', violet: 'Violet', red: 'Red' },
    fr: { bet: 'Miser', green: 'Vert', violet: 'Violet', red: 'Rouge' },
    es: { bet: 'Apostar', green: 'Verde', violet: 'Violeta', red: 'Rojo' },
    pt: { bet: 'Apostar', green: 'Verde', violet: 'Violeta', red: 'Vermelho' },
    ar: { bet: 'راهن', green: 'أخضر', violet: 'بنفسجي', red: 'أحمر' },
    tr: { bet: 'Bahis', green: 'Yeşil', violet: 'Mor', red: 'Kırmızı' },
    vi: { bet: 'Cược', green: 'Xanh lá', violet: 'Tím', red: 'Đỏ' },
    id: { bet: 'Pasang', green: 'Hijau', violet: 'Ungu', red: 'Merah' },
    ru: { bet: 'Ставка', green: 'Зелёный', violet: 'Фиолет.', red: 'Красный' },
    de: { bet: 'Setzen', green: 'Grün', violet: 'Violett', red: 'Rot' },
    hi: { bet: 'दांव', green: 'हरा', violet: 'बैंगनी', red: 'लाल' },
    zh: { bet: '下注', green: '绿', violet: '紫', red: '红' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  // gain d'une option : exactement le calcul du serveur (casino_ext_pick_mult)
  function pm(p) { return Math.floor(0.94 / p * 100) / 100; }
  function x2(v) { return '×' + K.m2(v).replace(/\.00$/, '').replace('.', K.dec()); }
  function xm(v) { return '×' + (Math.round(v * 100) / 100).toFixed(2).replace('.', K.dec()); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  var HIST = {};
  function hist(key, el, item) {
    var h = HIST[key] = HIST[key] || [];
    if (item) { h.unshift(item); if (h.length > 24) h.length = 24; }
    if (el) el.innerHTML = h.map(function (q) { return '<i class="' + q[0] + '">' + q[1] + '</i>'; }).join('');
  }
  function alive(box) { return box.isConnected; }
  function wait(box, ms) { return K.sleep(lite() ? Math.round(ms * 0.5) : ms).then(function () { if (!alive(box)) throw new Error('gone'); }); }
  function anim(el, kf, ms, ease) {
    if (!el || !el.animate) return Promise.resolve();
    var a = el.animate(kf, { duration: lite() ? Math.round(ms * 0.5) : ms, easing: ease || 'ease-in-out', fill: 'forwards' });
    return a.finished.then(function () { try { a.commitStyles(); } catch (e) { /* ignore */ } a.cancel(); }).catch(function () {});
  }
  // panneau commun : choix + terminal ; verrou pendant le tour
  function shell(box, cls, scene, opts, l) {
    box.classList.add('cg-game', 'cg-' + cls, 'p1-game');
    box.innerHTML = '<div class="cg-stage p1-stage"><div class="cg-hist p1-hist"></div><div class="p1-scene">' + scene + '</div></div>' + K.stakePanel(l.bet, opts);
    K.bindStake(box);
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(function () { if (box.isConnected) K.fitAll(box); }, 30); }); } catch (e) { /* ignore */ }
    return { hist: box.querySelector('.p1-hist'), go: $('csGo') };
  }
  function lock(box, on) { box.classList.toggle('p1-busy', on); var g = $('csGo'); if (g) g.disabled = on; }
  function bindOpts(box, sel, cb) {
    box.querySelectorAll(sel).forEach(function (b) {
      b.addEventListener('click', function () { if (box.classList.contains('p1-busy')) return; cb(+b.getAttribute('data-o')); });
    });
  }
  function paintOpts(box, sel, v) { box.querySelectorAll(sel).forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-o') === v); }); }

  /* ================= Thimbles / Cups & Balls ================= */
  function cupSvg(kind, id) {
    if (kind === 'th') { // dé à coudre doré (vu de côté), petits creux
      var d = ''; for (var r = 0; r < 4; r++) for (var c = 0; c < 5 - (r % 2); c++) d += '<circle cx="' + (-16 + c * 8 + (r % 2) * 4) + '" cy="' + (-60 + r * 9) + '" r="1.7" fill="#7A4A00" opacity=".35"/>';
      return '<path d="M-30 0C-29-30-25-58-18-70Q0-80 18-70C25-58 29-30 30 0z" fill="url(#' + id + 'a)" stroke="#7A4A00" stroke-width="1.2"/>' + d +
        '<path d="M-33 0Q0 8 33 0V-7Q0 1-33-7z" fill="url(#' + id + 'b)" stroke="#7A4A00" stroke-width="1"/>' +
        '<path d="M-20-62C-24-44-25-24-24-10" stroke="#FFF7D6" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".7"/>';
    }
    return '<path d="M-32 0L-23-66Q0-74 23-66L32 0z" fill="url(#' + id + 'a)" stroke="#4C0519" stroke-width="1.2"/>' +
      '<ellipse cx="0" cy="-67" rx="23" ry="5" fill="url(#' + id + 'b)" stroke="#4C0519" stroke-width="1"/>' +
      '<path d="M-29-18H29M-27-34H27" stroke="#FDE68A" stroke-width="2" opacity=".8"/>' +
      '<path d="M-34 0Q0 7 34 0V-6Q0 1-34-6z" fill="url(#' + id + 'b)" stroke="#4C0519" stroke-width="1"/>' +
      '<path d="M-18-60L-24-10" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".45"/>';
  }
  function cupsGame(key, n, kind) {
    var opts = []; for (var i = 0; i < n; i++) opts.push(1 / n);
    if (n === 5) opts = [0.2, 0.2, 0.2, 0.2, 0.2];
    var mult = pm(opts[0]), W = n === 3 ? 300 : 380, gap = n === 3 ? 92 : 72, x0 = W / 2 - gap * (n - 1) / 2, Y = 150;
    var SEL = { v: Math.floor(n / 2) };
    return function (box) {
      var l = L(), id = 'p1' + key;
      var defs = '<defs>' + (kind === 'th'
        ? '<linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8A5600"/><stop offset=".3" stop-color="#FFE08A"/><stop offset=".6" stop-color="#F5B700"/><stop offset="1" stop-color="#7A4A00"/></linearGradient>' +
          '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9A6A00"/><stop offset=".4" stop-color="#FFF3BF"/><stop offset="1" stop-color="#8A5600"/></linearGradient>'
        : '<linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7F1D1D"/><stop offset=".32" stop-color="#FB7185"/><stop offset=".62" stop-color="#E11D48"/><stop offset="1" stop-color="#5F0B1E"/></linearGradient>' +
          '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9A6A00"/><stop offset=".45" stop-color="#FFF3BF"/><stop offset="1" stop-color="#8A5600"/></linearGradient>') +
        '<radialGradient id="' + id + 'c" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#A5F3FC"/><stop offset="1" stop-color="#0E7490"/></radialGradient>' +
        '<radialGradient id="' + id + 'f" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#8B5CF6" stop-opacity=".45"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/></radialGradient></defs>';
      var cups = '', marks = '';
      for (var j = 0; j < n; j++) {
        marks += '<g class="p1-mark" data-o="' + j + '" transform="translate(' + (x0 + j * gap) + ' ' + Y + ')"><ellipse rx="' + (gap * 0.42) + '" ry="10" cy="2"/><path d="M-6 22l6-7 6 7" /></g>';
        cups += '<g class="p1-cup" data-c="' + j + '" style="transform:translate(' + (x0 + j * gap) + 'px,' + Y + 'px)"><g class="p1-cupin">' + cupSvg(kind, id) + '</g></g>';
      }
      var scene = '<svg class="p1-svg" viewBox="0 0 ' + W + ' 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + defs +
        '<ellipse cx="' + W / 2 + '" cy="' + (Y + 4) + '" rx="' + (W * 0.48) + '" ry="34" fill="url(#' + id + 'f)"/>' +
        '<path d="M' + (W * 0.06) + ' ' + (Y + 4) + 'H' + (W * 0.94) + '" stroke="rgba(251,191,36,.35)" stroke-width="1.2"/>' + marks +
        '<circle class="p1-ball" r="11" cx="0" cy="' + (Y - 11) + '" fill="url(#' + id + 'c)" style="opacity:0"/>' + cups + '</svg>';
      var ob = ''; for (var k = 0; k < n; k++) ob += '<button type="button" data-o="' + k + '" class="p1-o"><b class="fit">' + (k + 1) + '</b><small class="fit">' + xm(mult) + '</small></button>';
      var u = shell(box, key, scene, '<div class="cg-opts p1-opts">' + ob + '</div>', l);
      var svg = box.querySelector('.p1-svg'), ball = svg.querySelector('.p1-ball');
      var cupEl = [].slice.call(svg.querySelectorAll('.p1-cup')); // cupEl[c] = gobelet n° c ; slot[c] = sa place
      var slot = []; for (var s = 0; s < n; s++) slot.push(s);
      var X = function (sl) { return x0 + sl * gap; };
      var place = function (c) { cupEl[c].style.transform = 'translate(' + X(slot[c]) + 'px,' + Y + 'px)'; };
      var sel = function (v) { SEL.v = v; paintOpts(box, '.p1-o', v); svg.querySelectorAll('.p1-mark').forEach(function (m) { m.classList.toggle('on', +m.getAttribute('data-o') === v); }); };
      bindOpts(box, '.p1-o', sel);
      svg.querySelectorAll('.p1-mark').forEach(function (m) { m.addEventListener('click', function () { if (!box.classList.contains('p1-busy')) sel(+m.getAttribute('data-o')); }); });
      cupEl.forEach(function (ce) { ce.addEventListener('click', function () { if (!box.classList.contains('p1-busy')) sel(slot[+ce.getAttribute('data-c')]); }); });
      sel(SEL.v); hist(key, u.hist);
      var lift = function (c, up) {
        var x = X(slot[c]);
        return anim(cupEl[c], [{ transform: 'translate(' + x + 'px,' + (up ? Y : Y - 58) + 'px)' }, { transform: 'translate(' + x + 'px,' + (up ? Y - 58 : Y) + 'px)' }], 320, 'cubic-bezier(.3,.7,.3,1)');
      };
      var showBall = function (sl, on) { ball.setAttribute('cx', X(sl)); ball.style.opacity = on ? '1' : '0'; };
      u.go.addEventListener('click', async function () {
        if (box.classList.contains('p1-busy')) return;
        lock(box, true); box.classList.remove('p1-won');
        var r = await K.play(key, { pick: SEL.v });
        if (!r || !alive(box)) { lock(box, false); return; }
        try {
          var w = r.view.w, pick = r.view.pick;
          // mélange : suite d'échanges au hasard ; la balle part sous le gobelet qui finira à la place gagnante w
          var sw = [], nsw = n === 3 ? 6 : 8;
          for (var q = 0; q < nsw; q++) { var a = rnd(n), b = (a + 1 + rnd(n - 1)) % n; sw.push([a, b]); }
          var sim = slot.slice(); // place de chaque gobelet
          sw.forEach(function (p) { var ca = sim.indexOf(p[0]), cb = sim.indexOf(p[1]); sim[ca] = p[1]; sim[cb] = p[0]; });
          var cBall = sim.indexOf(w), s0 = slot[cBall];
          // 1) on montre la balle
          showBall(s0, true); await lift(cBall, true); await wait(box, 380); await lift(cBall, false); showBall(s0, false);
          await wait(box, 120);
          // 2) échanges (arcs avant / arrière)
          for (var e = 0; e < sw.length; e++) {
            var ca = slot.indexOf(sw[e][0]), cb = slot.indexOf(sw[e][1]), xa = X(slot[ca]), xb = X(slot[cb]), dur = 300 - e * 8;
            slot[ca] = sw[e][1]; slot[cb] = sw[e][0];
            await Promise.all([
              anim(cupEl[ca], [{ transform: 'translate(' + xa + 'px,' + Y + 'px)' }, { transform: 'translate(' + (xa + xb) / 2 + 'px,' + (Y + 10) + 'px) scale(1.06)' }, { transform: 'translate(' + xb + 'px,' + Y + 'px)' }], dur),
              anim(cupEl[cb], [{ transform: 'translate(' + xb + 'px,' + Y + 'px)' }, { transform: 'translate(' + (xa + xb) / 2 + 'px,' + (Y - 10) + 'px) scale(.94)' }, { transform: 'translate(' + xa + 'px,' + Y + 'px)' }], dur)
            ]);
            if (!alive(box)) return;
            place(ca); place(cb);
          }
          await wait(box, 160);
          // 3) on soulève le gobelet choisi, puis celui de la balle
          var cPick = slot.indexOf(pick), cWin = slot.indexOf(w);
          showBall(w, true);
          await lift(cPick, true);
          if (cPick !== cWin) { await wait(box, 260); await lift(cWin, true); }
          if (r.win > 0) box.classList.add('p1-won');
          hist(key, u.hist, [r.win > 0 ? 'hi' : 'lo', String(w + 1)]);
          K.resultLine(box, r);
          await wait(box, 900);
          await Promise.all([lift(cPick, false), cPick !== cWin ? lift(cWin, false) : null]);
          showBall(w, false);
        } catch (e2) { if (!alive(box)) return; }
        lock(box, false);
      });
    };
  }
  var RULES_CUP = function (n, m) {
    var M = m.replace('.', ','), N = String(n);
    return {
      en: '1. Choose a cup (1 to ' + N + ').\n2. Tap “Bet”: the ball is shown, then the cups are shuffled.\n3. If the ball is under your cup you win ×' + m + '.',
      fr: '1. Choisis un gobelet (1 à ' + N + ').\n2. Touche « Miser » : la balle est montrée, puis les gobelets sont mélangés.\n3. Si la balle est sous ton gobelet, tu gagnes ×' + M + '.',
      es: '1. Elige un vaso (1 a ' + N + ').\n2. Toca «Apostar»: se muestra la bola y se mezclan los vasos.\n3. Si la bola está bajo tu vaso ganas ×' + M + '.',
      pt: '1. Escolha um copo (1 a ' + N + ').\n2. Toque em «Apostar»: a bola é mostrada e os copos são embaralhados.\n3. Se a bola estiver sob o seu copo, você ganha ×' + M + '.',
      ar: '1. اختر كوبًا (1 إلى ' + N + ').\n2. اضغط «راهن»: تظهر الكرة ثم تُخلط الأكواب.\n3. إذا كانت الكرة تحت كوبك تربح ×' + m + '.',
      tr: '1. Bir bardak seç (1–' + N + ').\n2. «Bahis»e dokun: top gösterilir, bardaklar karıştırılır.\n3. Top senin bardağının altındaysa ×' + M + ' kazanırsın.',
      vi: '1. Chọn một chiếc cốc (1 đến ' + N + ').\n2. Chạm «Cược»: bóng được cho xem, rồi các cốc được tráo.\n3. Nếu bóng nằm dưới cốc của bạn, bạn thắng ×' + M + '.',
      id: '1. Pilih gelas (1 sampai ' + N + ').\n2. Ketuk «Pasang»: bola ditunjukkan, lalu gelas diacak.\n3. Jika bola ada di bawah gelasmu, kamu menang ×' + M + '.',
      ru: '1. Выберите стаканчик (от 1 до ' + N + ').\n2. Нажмите «Ставка»: шарик покажут, затем стаканчики перемешают.\n3. Если шарик под вашим стаканчиком — выигрыш ×' + M + '.',
      de: '1. Wähle einen Becher (1 bis ' + N + ').\n2. Tippe auf „Setzen“: Die Kugel wird gezeigt, dann werden die Becher gemischt.\n3. Liegt die Kugel unter deinem Becher, gewinnst du ×' + M + '.',
      hi: '1. एक कप चुनें (1 से ' + N + ')।\n2. «दांव» दबाएँ: गेंद दिखाई जाती है, फिर कप मिलाए जाते हैं।\n3. गेंद आपके कप के नीचे हो तो आप ×' + m + ' जीतते हैं।',
      zh: '1. 选择一个杯子（1 到 ' + N + '）。\n2. 点「下注」：先展示小球，然后打乱杯子。\n3. 小球在你的杯子下即赢 ×' + m + '。'
    };
  };
  K.register('thimbles', cupsGame('thimbles', 3, 'th'), { rules: RULES_CUP(3, '2.82') });
  K.register('cups', cupsGame('cups', 5, 'cu'), { rules: RULES_CUP(5, '4.69') });

  /* ================= Goal ================= */
  var GOAL = { z: 1 }, GOAL_M = 1.41;
  var ZX = [86, 150, 214], ZY = [88, 74, 88];
  function arrow(z) {
    var rot = [-45, 0, 45][z];
    return '<svg viewBox="0 0 24 24" class="gl-ar" aria-hidden="true"><g transform="rotate(' + rot + ' 12 12)"><path d="M12 4v16M6 10l6-6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
  }
  K.register('goal', function (box) {
    var l = L();
    var net = ''; for (var i = 0; i <= 18; i++) net += 'M' + (46 + i * 12) + ' 40V150'; for (var j = 0; j <= 9; j++) net += 'M46 ' + (40 + j * 12) + 'H262';
    var zones = ZX.map(function (x, z) { return '<g class="gl-z" data-o="' + z + '"><rect x="' + (46 + z * 72) + '" y="42" width="72" height="106" rx="6"/><circle cx="' + x + '" cy="' + ZY[z] + '" r="15"/><circle cx="' + x + '" cy="' + ZY[z] + '" r="6"/></g>'; }).join('');
    var scene = '<svg class="p1-svg gl-svg" viewBox="0 0 308 214" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>' +
      '<linearGradient id="glPost" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CBD5E1"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#94A3B8"/></linearGradient>' +
      '<radialGradient id="glPl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FDE68A"/><stop offset=".6" stop-color="#F59E0B"/><stop offset="1" stop-color="#7C2D12"/></radialGradient>' +
      '<linearGradient id="glGr" gradientUnits="userSpaceOnUse" x1="0" y1="140" x2="0" y2="330"><stop offset="0" stop-color="#166534"/><stop offset="1" stop-color="#052E16"/></linearGradient>' +
      '<radialGradient id="glBall" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#E2E8F0"/><stop offset="1" stop-color="#64748B"/></radialGradient>' +
      '<linearGradient id="glJ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A78BFA"/><stop offset="1" stop-color="#5B21B6"/></linearGradient></defs>' +
      '<circle cx="268" cy="22" r="11" fill="url(#glPl)" opacity=".9"/><ellipse cx="268" cy="22" rx="18" ry="4.5" fill="none" stroke="#FDE68A" stroke-width="1.3" opacity=".7" transform="rotate(-16 268 22)"/>' +
      '<path d="M-300 152Q154 136 608 152V600H-300z" fill="url(#glGr)"/><path d="M0 150Q154 138 308 150" stroke="#4ADE80" stroke-opacity=".4" fill="none"/>' +
      '<ellipse cx="154" cy="196" rx="26" ry="5" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.4"/>' +
      '<g class="gl-net"><path d="' + net + '" stroke="rgba(226,232,240,.22)" stroke-width=".8"/></g>' + zones +
      '<path d="M44 151V38H264V151" fill="none" stroke="url(#glPost)" stroke-width="6" stroke-linejoin="round"/>' +
      '<g class="gl-keep" style="transform:translate(154px,150px)"><g class="gl-kin">' +
        '<rect x="-12" y="-46" width="24" height="30" rx="9" fill="url(#glJ)" stroke="#2E1065"/><path d="M0-40l2 4.4 4.8.5-3.6 3.2 1 4.7L0-29.6l-4.2 2.4 1-4.7-3.6-3.2 4.8-.5z" fill="#FDE047"/>' +
        '<rect x="-11" y="-18" width="9" height="18" rx="4" fill="#1E1B4B"/><rect x="2" y="-18" width="9" height="18" rx="4" fill="#1E1B4B"/>' +
        '<path d="M-11-42L-27-58M11-42L27-58" stroke="url(#glJ)" stroke-width="8" stroke-linecap="round"/>' +
        '<circle cx="-29" cy="-60" r="7" fill="#FBBF24" stroke="#92400E"/><circle cx="29" cy="-60" r="7" fill="#FBBF24" stroke="#92400E"/>' +
        '<circle cx="0" cy="-56" r="10" fill="#E2E8F0" stroke="#475569"/><rect x="-7" y="-60" width="14" height="8" rx="4" fill="#0EA5E9"/><path d="M-4-58h4" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>' +
      '</g></g>' +
      '<g class="gl-ball" style="transform:translate(154px,192px)"><circle r="9" fill="url(#glBall)" stroke="#334155" stroke-width=".8"/><path d="M0-4l3.8 2.8-1.4 4.4h-4.8l-1.4-4.4z" fill="#1E293B"/><path d="M-6-3.5a7 7 0 0 1 4-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/></g>' +
      '</svg>';
    var ob = [0, 1, 2].map(function (z) { return '<button type="button" data-o="' + z + '" class="gl-o">' + arrow(z) + '<small class="fit">' + xm(GOAL_M) + '</small></button>'; }).join('');
    var u = shell(box, 'goal', scene, '<div class="cg-opts p1-opts">' + ob + '</div>', l);
    var svg = box.querySelector('.gl-svg'), keep = svg.querySelector('.gl-keep'), kin = svg.querySelector('.gl-kin'), ball = svg.querySelector('.gl-ball');
    var sel = function (z) { GOAL.z = z; paintOpts(box, '.gl-o', z); svg.querySelectorAll('.gl-z').forEach(function (g) { g.classList.toggle('on', +g.getAttribute('data-o') === z); }); };
    bindOpts(box, '.gl-o', sel);
    svg.querySelectorAll('.gl-z').forEach(function (g) { g.addEventListener('click', function () { if (!box.classList.contains('p1-busy')) sel(+g.getAttribute('data-o')); }); });
    sel(GOAL.z); hist('goal', u.hist);
    var KD = [['-62px', '-34px', '-62deg'], ['0px', '-46px', '0deg'], ['62px', '-34px', '62deg']];
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('p1-busy')) return;
      lock(box, true); box.classList.remove('p1-won');
      var z = GOAL.z;
      var r = await K.play('goal', {});
      if (!r || !alive(box)) { lock(box, false); return; }
      try {
        var goal = r.view.i === 1, kz = goal ? [0, 1, 2].filter(function (q) { return q !== z; })[rnd(2)] : z;
        var bx = ZX[z], by = ZY[z] + (goal ? 0 : 0);
        var kd = KD[kz];
        await Promise.all([
          anim(ball, [{ transform: 'translate(154px,192px) scale(1)' }, { transform: 'translate(' + bx + 'px,' + by + 'px) scale(.62)' }], 520, 'cubic-bezier(.2,.7,.3,1)'),
          K.sleep(lite() ? 60 : 120).then(function () { return anim(kin, [{ transform: 'translate(0,0) rotate(0deg)' }, { transform: 'translate(' + kd[0] + ',' + kd[1] + ') rotate(' + kd[2] + ')' }], 380, 'cubic-bezier(.2,.8,.3,1)'); })
        ]);
        if (!alive(box)) return;
        if (goal) { svg.classList.remove('gl-shake'); void svg.getBoundingClientRect(); svg.classList.add('gl-shake'); box.classList.add('p1-won'); }
        else await anim(ball, [{ transform: 'translate(' + bx + 'px,' + by + 'px) scale(.62)' }, { transform: 'translate(' + (bx + (154 - bx) * 0.5) + 'px,170px) scale(.8)' }], 420, 'ease-out');
        hist('goal', u.hist, [goal ? 'hi' : 'lo', goal ? xm(GOAL_M) : '×0']);
        K.resultLine(box, r);
        await wait(box, 1100);
        ball.style.transform = 'translate(154px,192px)'; kin.style.transform = '';
        svg.classList.remove('gl-shake');
      } catch (e) { if (!alive(box)) return; }
      lock(box, false);
    });
  }, { rules: {
    en: '1. Choose where to shoot: left, centre or right.\n2. Tap “Bet”: you shoot, the keeper dives.\n3. Goal = you win ×1.41 your stake; saved = lost.',
    fr: '1. Choisis où tirer : gauche, centre ou droite.\n2. Touche « Miser » : tu tires, le gardien plonge.\n3. But = tu gagnes ×1,41 ta mise ; arrêt = perdu.',
    es: '1. Elige dónde tirar: izquierda, centro o derecha.\n2. Toca «Apostar»: disparas y el portero se lanza.\n3. Gol = ganas ×1,41 tu apuesta; parada = pierdes.',
    pt: '1. Escolha onde chutar: esquerda, centro ou direita.\n2. Toque em «Apostar»: você chuta e o goleiro pula.\n3. Gol = você ganha ×1,41 a aposta; defesa = perdeu.',
    ar: '1. اختر مكان التسديد: يسار أو وسط أو يمين.\n2. اضغط «راهن»: تسدد ويقفز الحارس.\n3. هدف = تربح ×1.41 من رهانك؛ تصدٍّ = خسارة.',
    tr: '1. Nereye vuracağını seç: sol, orta ya da sağ.\n2. «Bahis»e dokun: şut çekersin, kaleci uçar.\n3. Gol = bahsinin ×1,41 katını kazanırsın; kurtarış = kayıp.',
    vi: '1. Chọn hướng sút: trái, giữa hoặc phải.\n2. Chạm «Cược»: bạn sút, thủ môn bay người.\n3. Vào = bạn thắng ×1,41 tiền cược; bị cản = thua.',
    id: '1. Pilih arah tendangan: kiri, tengah, atau kanan.\n2. Ketuk «Pasang»: kamu menendang, kiper melompat.\n3. Gol = kamu menang ×1,41 taruhan; ditepis = kalah.',
    ru: '1. Выберите, куда бить: влево, в центр или вправо.\n2. Нажмите «Ставка»: удар, вратарь прыгает.\n3. Гол — выигрыш ×1,41 ставки; сейв — проигрыш.',
    de: '1. Wähle, wohin du schießt: links, Mitte oder rechts.\n2. Tippe auf „Setzen“: Du schießt, der Torwart springt.\n3. Tor = du gewinnst ×1,41 deines Einsatzes; gehalten = verloren.',
    hi: '1. शॉट की दिशा चुनें: बाएँ, बीच या दाएँ।\n2. «दांव» दबाएँ: आप शॉट मारते हैं, गोलकीपर कूदता है।\n3. गोल = आप दांव का ×1.41 जीतते हैं; बचाव = हार।',
    zh: '1. 选择射门方向：左、中或右。\n2. 点「下注」：你射门，门将扑救。\n3. 进球即赢下注的 ×1.41；被扑出则输。'
  } });

  /* ================= Color Prediction ================= */
  var CP = { v: 0 }, CP_P = [0.45, 0.1, 0.45], CP_C = ['g', 'v', 'r'];
  // 20 perles : violet en 0 et 10, vert / rouge en alternance (9 + 9)
  var BEADS = []; (function () { for (var i = 0; i < 20; i++) BEADS.push(i === 0 || i === 10 ? 1 : (i < 10 ? (i % 2 ? 0 : 2) : (i % 2 ? 2 : 0))); })();
  K.register('colorpred', function (box) {
    var l = L(), R = 92;
    var beads = BEADS.map(function (c, i) {
      var a = i * 18 * Math.PI / 180, x = (120 + R * Math.sin(a)).toFixed(1), y = (120 - R * Math.cos(a)).toFixed(1);
      return '<g class="cp-b c' + CP_C[c] + '" data-i="' + i + '"><circle cx="' + x + '" cy="' + y + '" r="12.5" fill="url(#cpG' + CP_C[c] + ')"/><circle cx="' + (x - 3.6) + '" cy="' + (y - 4) + '" r="3.4" fill="#fff" opacity=".55"/></g>';
    }).join('');
    var grad = function (k, a, b, c) { return '<radialGradient id="cpG' + k + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; };
    var scene = '<svg class="p1-svg cp-svg" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>' +
      grad('g', '#BBF7D0', '#22C55E', '#14532D') + grad('v', '#E9D5FF', '#A855F7', '#4C1D95') + grad('r', '#FECDD3', '#F43F5E', '#881337') +
      '<radialGradient id="cpCore" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#3B2A7A"/><stop offset="1" stop-color="#0E0A26"/></radialGradient>' +
      '<linearGradient id="cpRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset=".5" stop-color="#B45309"/><stop offset="1" stop-color="#FDE68A"/></linearGradient></defs>' +
      '<circle cx="120" cy="120" r="112" fill="none" stroke="url(#cpRing)" stroke-width="3"/><circle cx="120" cy="120" r="72" fill="url(#cpCore)" stroke="url(#cpRing)" stroke-width="2.5"/>' +
      beads + '<circle class="cp-run" cx="120" cy="28" r="17" fill="none" stroke="#FDE68A" stroke-width="3.5"/>' +
      '<g class="cp-orb"><circle class="cp-oc" cx="120" cy="120" r="46" fill="url(#cpGv)"/><circle cx="106" cy="104" r="12" fill="#fff" opacity=".35"/></g></svg>';
    var names = [l.green, l.violet, l.red];
    var ob = [0, 1, 2].map(function (o) { return '<button type="button" data-o="' + o + '" class="cp-o c' + CP_C[o] + '"><b class="fit"><i></i>' + K.esc(names[o]) + '</b><small class="fit">' + xm(pm(CP_P[o])) + '</small></button>'; }).join('');
    var u = shell(box, 'colorpred', scene, '<div class="cg-opts p1-opts">' + ob + '</div>', l);
    var svg = box.querySelector('.cp-svg'), run = svg.querySelector('.cp-run'), oc = svg.querySelector('.cp-oc'), orb = svg.querySelector('.cp-orb');
    var cur = 0;
    var put = function (i) { var a = i * 18 * Math.PI / 180; run.setAttribute('cx', (120 + R * Math.sin(a)).toFixed(1)); run.setAttribute('cy', (120 - R * Math.cos(a)).toFixed(1)); };
    var sel = function (v) { CP.v = v; paintOpts(box, '.cp-o', v); };
    bindOpts(box, '.cp-o', sel); sel(CP.v); hist('colorpred', u.hist); put(cur);
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('p1-busy')) return;
      lock(box, true); box.classList.remove('p1-won');
      svg.querySelectorAll('.cp-b.hit').forEach(function (b) { b.classList.remove('hit'); });
      var r = await K.play('colorpred', { pick: CP.v });
      if (!r || !alive(box)) { lock(box, false); return; }
      try {
        var w = r.view.w, cand = []; BEADS.forEach(function (c, i) { if (c === w) cand.push(i); });
        var tgt = cand[rnd(cand.length)], steps = 40 + ((tgt - cur + 20) % 20), t0 = performance.now(), D = lite() ? 1400 : 3000, from = cur;
        await new Promise(function (res) {
          var f = function (t) {
            if (!alive(box)) return res();
            var p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3), k = Math.floor(e * steps + 1e-9);
            put((from + k) % 20);
            if (p < 1) K.S.raf = requestAnimationFrame(f); else res();
          };
          K.S.raf = requestAnimationFrame(f);
        });
        if (!alive(box)) return;
        cur = tgt; put(cur);
        svg.querySelector('.cp-b[data-i="' + tgt + '"]').classList.add('hit');
        oc.setAttribute('fill', 'url(#cpG' + CP_C[w] + ')');
        anim(orb, [{ transform: 'scale(.6)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], 420);
        if (r.win > 0) box.classList.add('p1-won');
        hist('colorpred', u.hist, ['c' + CP_C[w], '']);
        K.resultLine(box, r);
        await wait(box, 500);
      } catch (e) { if (!alive(box)) return; }
      lock(box, false);
    });
  }, { rules: {
    en: '1. Choose a colour: Green ×2.08, Violet ×9.39 or Red ×2.08.\n2. Tap “Bet”: the light runs around the 20 beads (9 green, 2 violet, 9 red).\n3. If it stops on your colour you win.',
    fr: '1. Choisis une couleur : Vert ×2,08, Violet ×9,39 ou Rouge ×2,08.\n2. Touche « Miser » : la lumière tourne sur les 20 perles (9 vertes, 2 violettes, 9 rouges).\n3. Si elle s’arrête sur ta couleur, tu gagnes.',
    es: '1. Elige un color: Verde ×2,08, Violeta ×9,39 o Rojo ×2,08.\n2. Toca «Apostar»: la luz gira por las 20 perlas (9 verdes, 2 violetas, 9 rojas).\n3. Si se detiene en tu color, ganas.',
    pt: '1. Escolha uma cor: Verde ×2,08, Violeta ×9,39 ou Vermelho ×2,08.\n2. Toque em «Apostar»: a luz gira pelas 20 contas (9 verdes, 2 violetas, 9 vermelhas).\n3. Se parar na sua cor, você ganha.',
    ar: '1. اختر لونًا: أخضر ×2.08، بنفسجي ×9.39 أو أحمر ×2.08.\n2. اضغط «راهن»: يدور الضوء على 20 خرزة (9 خضراء، 2 بنفسجية، 9 حمراء).\n3. إذا توقف على لونك تربح.',
    tr: '1. Bir renk seç: Yeşil ×2,08, Mor ×9,39 ya da Kırmızı ×2,08.\n2. «Bahis»e dokun: ışık 20 boncukta döner (9 yeşil, 2 mor, 9 kırmızı).\n3. Senin renginde durursa kazanırsın.',
    vi: '1. Chọn màu: Xanh lá ×2,08, Tím ×9,39 hoặc Đỏ ×2,08.\n2. Chạm «Cược»: ánh sáng chạy quanh 20 hạt (9 xanh, 2 tím, 9 đỏ).\n3. Dừng đúng màu bạn chọn là bạn thắng.',
    id: '1. Pilih warna: Hijau ×2,08, Ungu ×9,39, atau Merah ×2,08.\n2. Ketuk «Pasang»: cahaya berputar di 20 manik (9 hijau, 2 ungu, 9 merah).\n3. Jika berhenti di warnamu, kamu menang.',
    ru: '1. Выберите цвет: Зелёный ×2,08, Фиолетовый ×9,39 или Красный ×2,08.\n2. Нажмите «Ставка»: огонёк бежит по 20 бусинам (9 зелёных, 2 фиолетовые, 9 красных).\n3. Остановился на вашем цвете — вы выиграли.',
    de: '1. Wähle eine Farbe: Grün ×2,08, Violett ×9,39 oder Rot ×2,08.\n2. Tippe auf „Setzen“: Das Licht läuft über die 20 Perlen (9 grün, 2 violett, 9 rot).\n3. Hält es auf deiner Farbe, gewinnst du.',
    hi: '1. रंग चुनें: हरा ×2.08, बैंगनी ×9.39 या लाल ×2.08।\n2. «दांव» दबाएँ: रोशनी 20 मोतियों पर घूमती है (9 हरे, 2 बैंगनी, 9 लाल)।\n3. आपके रंग पर रुके तो आप जीतते हैं।',
    zh: '1. 选择颜色：绿 ×2.08、紫 ×9.39 或红 ×2.08。\n2. 点「下注」：光点在 20 颗珠子上转动（9 绿、2 紫、9 红）。\n3. 停在你的颜色上即赢。'
  } });

  /* ================= Lucky Dice ================= */
  var LD = { v: 0 }, LD_P = [15 / 36, 6 / 36, 15 / 36];
  var PIP = { 1: [[20, 20]], 2: [[12, 12], [28, 28]], 3: [[11, 11], [20, 20], [29, 29]], 4: [[12, 12], [28, 12], [12, 28], [28, 28]],
    5: [[11, 11], [29, 11], [20, 20], [11, 29], [29, 29]], 6: [[12, 10.5], [28, 10.5], [12, 20], [28, 20], [12, 29.5], [28, 29.5]] };
  function dieFace(n, red) {
    return '<rect x="1.5" y="1.5" width="37" height="37" rx="9" fill="url(#' + (red ? 'ldR' : 'ldW') + ')" stroke="' + (red ? '#881337' : '#BDB4DD') + '" stroke-width="1.2"/>' +
      '<path d="M7 6.5h20" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>' +
      PIP[n].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (n === 1 ? 5.2 : 3.6) + '" fill="' + (red ? '#fff' : (n === 1 ? '#E11D48' : '#1E1B3A')) + '"/>'; }).join('');
  }
  K.register('luckydice', function (box) {
    var l = L();
    var scene = '<svg class="p1-svg ld-svg" viewBox="0 0 260 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>' +
      '<linearGradient id="ldW" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#DCD5F2"/></linearGradient>' +
      '<linearGradient id="ldR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FB7185"/><stop offset="1" stop-color="#9F1239"/></linearGradient>' +
      '<radialGradient id="ldF" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#3B1D8F"/><stop offset="1" stop-color="#140B38"/></radialGradient>' +
      '<linearGradient id="ldRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset=".5" stop-color="#B45309"/><stop offset="1" stop-color="#FDE68A"/></linearGradient></defs>' +
      '<ellipse cx="130" cy="104" rx="120" ry="74" fill="url(#ldF)" stroke="url(#ldRim)" stroke-width="3"/>' +
      '<ellipse cx="130" cy="104" rx="104" ry="60" fill="none" stroke="rgba(253,230,138,.22)" stroke-dasharray="3 5"/>' +
      '<g class="ld-d d0" style="transform:translate(70px,72px)"><g class="ld-di"><g transform="scale(1.3)">' + dieFace(3, false) + '</g></g></g>' +
      '<g class="ld-d d1" style="transform:translate(138px,80px)"><g class="ld-di"><g transform="scale(1.3)">' + dieFace(4, true) + '</g></g></g>' +
      '<g class="ld-sum"><circle cx="130" cy="30" r="20" fill="#0E0A26" stroke="url(#ldRim)" stroke-width="2.5"/><text x="130" y="37.5" text-anchor="middle" class="ld-st">7</text></g></svg>';
    var lab = ['2–6', '7', '8–12'];
    var ob = [0, 1, 2].map(function (o) { return '<button type="button" data-o="' + o + '" class="ld-o"><b class="fit" dir="ltr">' + (o === 0 ? '<i>&lt;7</i>' : o === 2 ? '<i>&gt;7</i>' : '') + lab[o] + '</b><small class="fit">' + xm(pm(LD_P[o])) + '</small></button>'; }).join('');
    var u = shell(box, 'luckydice', scene, '<div class="cg-opts p1-opts">' + ob + '</div>', l);
    var svg = box.querySelector('.ld-svg'), dd = [svg.querySelector('.d0 .ld-di'), svg.querySelector('.d1 .ld-di')], st = svg.querySelector('.ld-st'), sum = svg.querySelector('.ld-sum');
    var face = function (i, n) { dd[i].firstChild.innerHTML = dieFace(n, i === 1); };
    var sel = function (v) { LD.v = v; paintOpts(box, '.ld-o', v); };
    bindOpts(box, '.ld-o', sel); sel(LD.v); hist('luckydice', u.hist);
    u.go.addEventListener('click', async function () {
      if (box.classList.contains('p1-busy')) return;
      lock(box, true); box.classList.remove('p1-won'); sum.classList.remove('on', 'w');
      var r = await K.play('luckydice', { pick: LD.v });
      if (!r || !alive(box)) { lock(box, false); return; }
      try {
        var w = r.view.w, pairs = [];
        for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) { var s = a + b; if ((w === 0 && s < 7) || (w === 1 && s === 7) || (w === 2 && s > 7)) pairs.push([a, b]); }
        var pr = pairs[rnd(pairs.length)], D = lite() ? 500 : 1100, t0 = performance.now();
        var rolls = [anim(dd[0], [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-22px,-26px) rotate(-200deg)', offset: .35 }, { transform: 'translate(10px,8px) rotate(-330deg)', offset: .7 }, { transform: 'translate(0,0) rotate(-360deg)' }], D, 'cubic-bezier(.3,.6,.4,1)'),
          anim(dd[1], [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(24px,-20px) rotate(220deg)', offset: .35 }, { transform: 'translate(-8px,10px) rotate(320deg)', offset: .7 }, { transform: 'translate(0,0) rotate(360deg)' }], D, 'cubic-bezier(.3,.6,.4,1)')];
        await new Promise(function (res) {
          var lastF = 0, f = function (t) {
            if (!alive(box)) return res();
            if (t - lastF > 85) { lastF = t; face(0, 1 + rnd(6)); face(1, 1 + rnd(6)); }
            if (t - t0 < D - 120) K.S.raf = requestAnimationFrame(f); else res();
          };
          K.S.raf = requestAnimationFrame(f);
        });
        face(0, pr[0]); face(1, pr[1]);
        await Promise.all(rolls);
        if (!alive(box)) return;
        st.textContent = String(pr[0] + pr[1]); sum.classList.add('on'); if (r.win > 0) { sum.classList.add('w'); box.classList.add('p1-won'); }
        hist('luckydice', u.hist, [w === 1 ? 'hi' : w === 0 ? 'lo' : 'mid', String(pr[0] + pr[1])]);
        K.resultLine(box, r);
        await wait(box, 400);
      } catch (e) { if (!alive(box)) return; }
      lock(box, false);
    });
  }, { rules: {
    en: '1. Bet on the sum of 2 dice: Under 7 (2–6) ×2.25, exactly 7 ×5.64, Over 7 (8–12) ×2.25.\n2. Tap “Bet”: the dice roll.\n3. If the sum is in your range you win.',
    fr: '1. Parie sur la somme de 2 dés : moins de 7 (2–6) ×2,25, 7 pile ×5,64, plus de 7 (8–12) ×2,25.\n2. Touche « Miser » : les dés roulent.\n3. Si la somme est dans ta zone, tu gagnes.',
    es: '1. Apuesta a la suma de 2 dados: menos de 7 (2–6) ×2,25, 7 exacto ×5,64, más de 7 (8–12) ×2,25.\n2. Toca «Apostar»: ruedan los dados.\n3. Si la suma está en tu rango, ganas.',
    pt: '1. Aposte na soma de 2 dados: menos de 7 (2–6) ×2,25, 7 exato ×5,64, mais de 7 (8–12) ×2,25.\n2. Toque em «Apostar»: os dados rolam.\n3. Se a soma estiver na sua faixa, você ganha.',
    ar: '1. راهن على مجموع نردين: أقل من 7 (2–6) ×2.25، 7 تمامًا ×5.64، أكثر من 7 (8–12) ×2.25.\n2. اضغط «راهن»: يُرمى النرد.\n3. إذا كان المجموع ضمن اختيارك تربح.',
    tr: '1. 2 zarın toplamına bahis yap: 7 altı (2–6) ×2,25, tam 7 ×5,64, 7 üstü (8–12) ×2,25.\n2. «Bahis»e dokun: zarlar atılır.\n3. Toplam senin aralığındaysa kazanırsın.',
    vi: '1. Cược tổng 2 xúc xắc: dưới 7 (2–6) ×2,25, đúng 7 ×5,64, trên 7 (8–12) ×2,25.\n2. Chạm «Cược»: xúc xắc lăn.\n3. Tổng nằm trong lựa chọn của bạn là thắng.',
    id: '1. Tebak jumlah 2 dadu: di bawah 7 (2–6) ×2,25, tepat 7 ×5,64, di atas 7 (8–12) ×2,25.\n2. Ketuk «Pasang»: dadu dilempar.\n3. Jika jumlahnya sesuai pilihanmu, kamu menang.',
    ru: '1. Ставка на сумму 2 кубиков: меньше 7 (2–6) ×2,25, ровно 7 ×5,64, больше 7 (8–12) ×2,25.\n2. Нажмите «Ставка»: кубики брошены.\n3. Сумма в вашем диапазоне — вы выиграли.',
    de: '1. Setze auf die Summe von 2 Würfeln: unter 7 (2–6) ×2,25, genau 7 ×5,64, über 7 (8–12) ×2,25.\n2. Tippe auf „Setzen“: Die Würfel rollen.\n3. Liegt die Summe in deinem Bereich, gewinnst du.',
    hi: '1. 2 पासों के योग पर दांव लगाएँ: 7 से कम (2–6) ×2.25, ठीक 7 ×5.64, 7 से ज़्यादा (8–12) ×2.25।\n2. «दांव» दबाएँ: पासे लुढ़कते हैं।\n3. योग आपकी सीमा में हो तो आप जीतते हैं।',
    zh: '1. 押 2 颗骰子的点数和：小于 7（2–6）×2.25、正好 7 ×5.64、大于 7（8–12）×2.25。\n2. 点「下注」：掷骰。\n3. 点数和在你的范围内即赢。'
  } });
})(window.D6 = window.D6 || {});
