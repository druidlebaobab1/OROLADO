/* v2795 — Lucky 777 rebuilt (owner request): classic 3-reel fruit slot like the Pragmatic / Playson classics — real spinning
   reels with motion blur, staggered stops with a little bounce, 3×3 view where ONLY the middle line pays (the other rows are
   decoration and never show a fake win), win-line highlight, paytable strip, coin shower on big wins, tap again = quick stop.
   The server still draws the 3 middle symbols (view.reels) and the payout (CASINO_SLOTS, RTP 94 %). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { spin: 'Spin' }, fr: { spin: 'Lancer' }, es: { spin: 'Girar' }, pt: { spin: 'Girar' }, ar: { spin: 'دوران' }, tr: { spin: 'Çevir' },
    vi: { spin: 'Quay' }, id: { spin: 'Putar' }, ru: { spin: 'Крутить' }, de: { spin: 'Drehen' }, hi: { spin: 'स्पिन' }, zh: { spin: '旋转' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }

  var SYMS = ['gem', 'seven', 'bell', 'lemon', 'cherry', 'star'];
  // même table que le serveur (casino_lib.php CASINO_SLOTS) : [symbole, combien sur la ligne, gain ×]
  var PAY = [['gem', 3, 50], ['seven', 3, 20], ['bell', 3, 10], ['lemon', 3, 5], ['cherry', 3, 3], ['cherry', 2, 1.5]];
  var LEN = 22; // cases par rouleau (boucle)

  /* ---------- symboles dessinés (dégradés partagés dans un seul <defs>) ---------- */
  var DEFS = '<svg class="sl-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="slRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6B6B"/><stop offset=".5" stop-color="#E11D2E"/><stop offset="1" stop-color="#8B0A16"/></linearGradient>' +
    '<linearGradient id="slGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".45" stop-color="#FBBF24"/><stop offset="1" stop-color="#B7791F"/></linearGradient>' +
    '<radialGradient id="slCh" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FF9AA2"/><stop offset=".35" stop-color="#E5122A"/><stop offset="1" stop-color="#7A0716"/></radialGradient>' +
    '<radialGradient id="slLem" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFFBD1"/><stop offset=".45" stop-color="#FDE047"/><stop offset="1" stop-color="#CA8A04"/></radialGradient>' +
    '<linearGradient id="slGemA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CFFAFE"/><stop offset=".5" stop-color="#22D3EE"/><stop offset="1" stop-color="#0E7490"/></linearGradient>' +
    '<linearGradient id="slGemB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38BDF8"/><stop offset="1" stop-color="#1E3A8A"/></linearGradient>' +
    '<radialGradient id="slStar" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#F5D0FE"/><stop offset=".5" stop-color="#A855F7"/><stop offset="1" stop-color="#4C1D95"/></radialGradient>' +
    '<filter id="slMb" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="0 6"/></filter>' +
    '</defs></svg>';
  var ART = {
    seven: '<path d="M20 14h62v15L50 88H29l30-56H20z" fill="url(#slRed)" stroke="url(#slGold)" stroke-width="5" stroke-linejoin="round"/><path d="M27 20h44" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>',
    cherry: '<path d="M33 60C38 40 50 22 66 12M70 62C68 42 66 26 66 12" fill="none" stroke="#3F6212" stroke-width="5" stroke-linecap="round"/><path d="M66 12c8-6 20-5 26 2-9 6-19 6-26-2z" fill="#4ADE80" stroke="#166534" stroke-width="2"/>' +
      '<circle cx="31" cy="68" r="19" fill="url(#slCh)"/><circle cx="70" cy="70" r="19" fill="url(#slCh)"/><ellipse cx="25" cy="61" rx="5" ry="3.5" fill="#fff" opacity=".7"/><ellipse cx="64" cy="63" rx="5" ry="3.5" fill="#fff" opacity=".7"/>',
    lemon: '<path d="M12 52C12 30 30 18 50 18s38 12 38 34-18 32-38 32-38-10-38-32z" fill="url(#slLem)" stroke="#A16207" stroke-width="2.5"/><path d="M10 52l-6 2 6 3M90 52l6-2-6-3" fill="#CA8A04"/>' +
      '<path d="M50 18c4-8 12-11 18-9-3 7-10 10-18 9z" fill="#4ADE80" stroke="#166534" stroke-width="2"/><ellipse cx="36" cy="38" rx="10" ry="5" fill="#fff" opacity=".55" transform="rotate(-20 36 38)"/>',
    bell: '<path d="M50 12c-18 0-27 14-27 32v14l-9 12h72l-9-12V44c0-18-9-32-27-32z" fill="url(#slGold)" stroke="#92400E" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="80" r="9" fill="#B45309"/><circle cx="50" cy="10" r="5" fill="#B45309"/>' +
      '<path d="M34 30c3-7 8-10 14-11" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="18" y="62" width="64" height="8" rx="3" fill="#B45309" opacity=".55"/>',
    gem: '<path d="M10 36l18-20h44l18 20-40 50z" fill="url(#slGemB)" stroke="#E0F2FE" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 36h80L50 86z" fill="url(#slGemA)"/><path d="M28 16l8 20 14-20 14 20 8-20M36 36l14 50 14-50" fill="none" stroke="#E0F2FE" stroke-width="2" stroke-linejoin="round" opacity=".8"/>' +
      '<path d="M30 30l6-10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    star: '<path d="M50 8l11 27 29 2-22 19 7 29-25-16-25 16 7-29-22-19 29-2z" fill="url(#slStar)" stroke="#F5D0FE" stroke-width="2.5" stroke-linejoin="round"/><circle cx="42" cy="34" r="5" fill="#fff" opacity=".6"/>'
  };
  function sym(k) { return '<svg class="sy" viewBox="0 0 100 100" aria-hidden="true"><g>' + (ART[k] || ART.star) + '</g></svg>'; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function mx(v) { return '×' + String(v).replace('.', K.dec()); }

  // rangées décoratives (haut / bas) : jamais 3 pareils, jamais 2 cerises, ni en ligne ni en diagonale → aucun faux gain
  function okLine(a) { var ch = 0; for (var i = 0; i < 3; i++) if (a[i] === 'cherry') ch++; return !(a[0] === a[1] && a[1] === a[2]) && ch < 2; }
  function deco(mid) {
    for (var n = 0; n < 400; n++) {
      var top = [SYMS[rnd(6)], SYMS[rnd(6)], SYMS[rnd(6)]], bot = [SYMS[rnd(6)], SYMS[rnd(6)], SYMS[rnd(6)]];
      if (okLine(top) && okLine(bot) && okLine([top[0], mid[1], bot[2]]) && okLine([bot[0], mid[1], top[2]]) &&
        top[0] !== mid[0] && top[1] !== mid[1] && top[2] !== mid[2] && bot[0] !== mid[0] && bot[1] !== mid[1] && bot[2] !== mid[2]) return [top, bot];
    }
    return [['star', 'bell', 'lemon'], ['lemon', 'star', 'bell']];
  }

  K.register('slots', function (box) {
    var l = L(), lite = document.documentElement.classList.contains('oro-lite');
    box.classList.add('cg-game', 'cg-slots');
    var reelsHtml = '';
    for (var r = 0; r < 3; r++) {
      var cells = '';
      for (var c = 0; c < LEN + 3; c++) cells += '<i class="sl-c"></i>';
      reelsHtml += '<div class="sl-reel"><div class="sl-strip" style="height:' + ((LEN + 3) / 3 * 100) + '%">' + cells + '</div></div>';
    }
    var bulbs = ''; for (var b = 0; b < 14; b++) bulbs += '<i style="--k:' + b + '"></i>';
    var pay = PAY.map(function (p, i) {
      var ic = ''; for (var j = 0; j < p[1]; j++) ic += sym(p[0]);
      return '<span class="sl-p" data-p="' + i + '"><i>' + ic + '</i><b class="fit">' + mx(p[2]) + '</b></span>';
    }).join('');
    box.innerHTML = '<div class="cg-stage">' + DEFS + '<div class="sl-host"><div class="sl-mach" dir="ltr">' +
      '<div class="sl-top"><div class="sl-bulbs">' + bulbs + '</div><b>LUCKY&nbsp;<em>777</em></b></div>' +
      '<div class="sl-win"><div class="sl-reels">' + reelsHtml + '</div><i class="sl-shade"></i><i class="sl-line"></i><i class="sl-arr a1"></i><i class="sl-arr a2"></i></div>' +
      '<div class="sl-foot"><i></i><i></i><i></i></div></div><div class="sl-coins"></div></div>' +
      '<div class="sl-pay" dir="ltr">' + pay + '</div></div>' + K.stakePanel(l.spin);
    K.bindStake(box);

    var host = box.querySelector('.sl-host'), mach = box.querySelector('.sl-mach'), stage = box.querySelector('.cg-stage');
    var go = $('csGo');
    /* la machine garde ses proportions et remplit la place libre */
    function fit() {
      if (!mach.isConnected) { if (ro) ro.disconnect(); return; }
      var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      var W = Math.min(w, h * 1.02, 560);
      mach.style.width = W + 'px'; mach.style.height = (W / 1.02) + 'px'; mach.style.setProperty('--u', (W / 100) + 'px');
    }
    var ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(host); else window.addEventListener('resize', fit);
    fit();

    /* ---------- rouleaux ---------- */
    var reels = Array.prototype.map.call(box.querySelectorAll('.sl-reel'), function (el) {
      var strip = el.firstChild, cells = strip.children, ks = [];
      for (var i = 0; i < LEN; i++) ks.push(SYMS[rnd(6)]);
      var R = { el: el, strip: strip, cells: cells, ks: ks, pos: 0, v: 0, mode: 'idle', stopAt: 0 };
      for (var j = 0; j < LEN; j++) put(R, j, ks[j]);
      return R;
    });
    function put(R, j, k) {
      j = ((j % LEN) + LEN) % LEN; R.ks[j] = k;
      R.cells[j].innerHTML = sym(k); R.cells[j].setAttribute('data-k', k);
      if (j < 3) { R.cells[j + LEN].innerHTML = sym(k); R.cells[j + LEN].setAttribute('data-k', k); }
    }
    function draw(R) { var p = ((R.pos % LEN) + LEN) % LEN; R.strip.style.transform = 'translate3d(0,' + (-p / (LEN + 3) * 100) + '%,0)'; }
    function land(R, top, mid, bot) { // place le résultat juste après la position actuelle (hors de vue)
      var t = Math.floor(R.pos) + 4 + (R.mode === 'spin' ? 1 : 0);
      put(R, t, top); put(R, t + 1, mid); put(R, t + 2, bot);
      return t;
    }
    // départ : une ligne perdante, propre (pas de faux gain)
    (function () {
      var mid; do { mid = [SYMS[rnd(6)], SYMS[rnd(6)], SYMS[rnd(6)]]; } while (!okLine(mid));
      var d = deco(mid);
      reels.forEach(function (R, i) { R.pos = 0; put(R, 0, d[0][i]); put(R, 1, mid[i]); put(R, 2, d[1][i]); draw(R); });
    })();

    var busy = false, res = null, slam = false, last = 0, SPEED = 24;
    function easeBack(k) { var c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }
    function loop(now) {
      if (!box.isConnected) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var moving = false;
      reels.forEach(function (R, i) {
        if (R.mode === 'spin') {
          R.v = Math.min(SPEED, R.v + SPEED * dt * 5);
          R.pos += R.v * dt; if (R.pos >= LEN) R.pos -= LEN;
          moving = true;
          if (res && now >= R.stopAt) {
            R.p0 = R.pos; R.P = land(R, res.top[i], res.mid[i], res.bot[i]);
            R.t0 = now; R.d = Math.max(240, 3.8 * (R.P - R.p0) / SPEED * 1000 * (slam ? 0.6 : 1));
            R.mode = 'stop';
          }
        } else if (R.mode === 'stop') {
          moving = true;
          var k = Math.min(1, (now - R.t0) / R.d);
          R.pos = R.p0 + (R.P - R.p0) * easeBack(k);
          if (k > 0.55) R.strip.classList.remove('blur');
          if (k >= 1) { R.pos = R.P % LEN; R.mode = 'idle'; K.sfx('stop'); R.el.classList.add('thud'); setTimeout(function () { R.el.classList.remove('thud'); }, 260); }
        }
        draw(R);
        var fp = Math.floor(R.pos); if (R.mode !== 'idle' && fp !== R.fp) K.sfx('tick'); R.fp = fp; // v2832 : tic des symboles qui défilent
      });
      if (moving) K.S.raf = requestAnimationFrame(loop); else done();
    }
    function clearWin() {
      box.querySelectorAll('.sl-c.win').forEach(function (c) { c.classList.remove('win'); });
      box.querySelectorAll('.sl-p.on').forEach(function (c) { c.classList.remove('on'); });
      mach.classList.remove('won', 'big');
    }
    function midCell(R) { return R.cells[Math.round(R.pos) % LEN + 1]; }

    go.addEventListener('click', async function () {
      if (busy) { // 2e appui = arrêt rapide des rouleaux (comme les grands jeux)
        if (res && !slam) { slam = true; var t = performance.now(); reels.forEach(function (R, i) { if (R.mode === 'spin') R.stopAt = Math.min(R.stopAt, t + i * 90); }); }
        return;
      }
      if (K.guest()) { K.play('slots', {}); return; }
      busy = true; res = null; slam = false; clearWin();
      go.classList.add('stop'); go.innerHTML = '<svg class="sl-sq" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>';
      var t0 = performance.now();
      reels.forEach(function (R) { R.mode = 'spin'; R.v = 0; R.stopAt = Infinity; if (!lite) R.strip.classList.add('blur'); });
      last = t0; cancelAnimationFrame(K.S.raf || 0); K.S.raf = requestAnimationFrame(loop);
      var r = await K.play('slots', {});
      if (!r || !box.isConnected) { // erreur : on arrête les rouleaux sur une ligne perdante sans rien payer
        var m0; do { m0 = [SYMS[rnd(6)], SYMS[rnd(6)], SYMS[rnd(6)]]; } while (!okLine(m0));
        var d0 = deco(m0); res = { top: d0[0], mid: m0, bot: d0[1], r: null };
      } else {
        var mid = r.view.reels.slice(0, 3), dd = deco(mid);
        res = { top: dd[0], mid: mid, bot: dd[1], r: r };
      }
      var base = Math.max(performance.now(), t0 + (slam ? 250 : 650));
      reels.forEach(function (R, i) { R.stopAt = base + i * (slam ? 90 : 380); });
    });
    function done() {
      reels.forEach(function (R) { R.strip.classList.remove('blur'); });
      var r = res && res.r;
      busy = false; go.classList.remove('stop'); go.innerHTML = ''; K.setText(go, l.spin);
      if (!r) return;
      if (r.win > 0) {
        var mids = reels.map(midCell), ks = res.mid;
        var three = ks[0] === ks[1] && ks[1] === ks[2];
        mids.forEach(function (c, i) { if (three || ks[i] === 'cherry') c.classList.add('win'); });
        var pi = three ? PAY.findIndex(function (p) { return p[0] === ks[0] && p[1] === 3; }) : 5;
        var pe = box.querySelector('.sl-p[data-p="' + pi + '"]'); if (pe) pe.classList.add('on');
        mach.classList.add('won');
        if (r.mult >= 10) { mach.classList.add('big'); if (!lite) coins(r.mult >= 20 ? 36 : 24); }
      }
      K.resultLine(box, r);
    }
    function coins(n) {
      var wrap = box.querySelector('.sl-coins'), h = '';
      for (var i = 0; i < n; i++) h += '<i style="left:' + (4 + Math.random() * 92).toFixed(1) + '%;--d:' + (0.9 + Math.random() * 0.9).toFixed(2) + 's;--w:' + (Math.random() * 0.6).toFixed(2) + 's;--r:' + rnd(720) + 'deg"></i>';
      wrap.innerHTML = h;
      setTimeout(function () { if (wrap.isConnected) wrap.innerHTML = ''; }, 2600);
    }
  }, {
    rules: {
      en: '1. Choose your stake and tap “Spin”. Tap again to stop the reels faster.\n2. The 3 reels stop one by one. Only the MIDDLE line pays.\n3. 3 same symbols on the line: diamonds ×50 · sevens ×20 · bells ×10 · lemons ×5 · cherries ×3. 2 cherries on the line ×1.5.',
      fr: '1. Choisis ta mise et touche « Lancer ». Touche encore pour arrêter les rouleaux plus vite.\n2. Les 3 rouleaux s’arrêtent l’un après l’autre. Seule la ligne du MILIEU paie.\n3. 3 symboles pareils sur la ligne : diamants ×50 · sept ×20 · cloches ×10 · citrons ×5 · cerises ×3. 2 cerises sur la ligne ×1,5.',
      es: '1. Elige tu apuesta y toca «Girar». Toca otra vez para parar los rodillos más rápido.\n2. Los 3 rodillos se paran uno tras otro. Solo paga la línea del MEDIO.\n3. 3 símbolos iguales en la línea: diamantes ×50 · sietes ×20 · campanas ×10 · limones ×5 · cerezas ×3. 2 cerezas en la línea ×1,5.',
      pt: '1. Escolha a aposta e toque em «Girar». Toque de novo para parar os rolos mais rápido.\n2. Os 3 rolos param um após o outro. Só a linha do MEIO paga.\n3. 3 símbolos iguais na linha: diamantes ×50 · setes ×20 · sinos ×10 · limões ×5 · cerejas ×3. 2 cerejas na linha ×1,5.',
      ar: '1. اختر رهانك واضغط «دوران». اضغط مرة أخرى لإيقاف البكرات بسرعة.\n2. تتوقف البكرات الثلاث واحدة تلو الأخرى. الخط الأوسط فقط يربح.\n3. ثلاثة رموز متشابهة على الخط: الماس ×50 · السبعات ×20 · الأجراس ×10 · الليمون ×5 · الكرز ×3. كرزتان على الخط ×1.5.',
      tr: '1. Bahsini seç ve «Çevir»e dokun. Makaraları hızlı durdurmak için tekrar dokun.\n2. 3 makara sırayla durur. Sadece ORTA çizgi kazandırır.\n3. Çizgide 3 aynı sembol: elmas ×50 · yedi ×20 · çan ×10 · limon ×5 · kiraz ×3. Çizgide 2 kiraz ×1,5.',
      vi: '1. Chọn mức cược rồi chạm «Quay». Chạm lần nữa để dừng cuộn nhanh hơn.\n2. 3 cuộn dừng lần lượt. Chỉ hàng GIỮA được trả thưởng.\n3. 3 biểu tượng giống nhau trên hàng: kim cương ×50 · số 7 ×20 · chuông ×10 · chanh ×5 · anh đào ×3. 2 anh đào trên hàng ×1,5.',
      id: '1. Pilih taruhan lalu ketuk «Putar». Ketuk lagi untuk menghentikan gulungan lebih cepat.\n2. 3 gulungan berhenti satu per satu. Hanya garis TENGAH yang membayar.\n3. 3 simbol sama di garis: berlian ×50 · tujuh ×20 · lonceng ×10 · lemon ×5 · ceri ×3. 2 ceri di garis ×1,5.',
      ru: '1. Выбери ставку и нажми «Крутить». Нажми ещё раз, чтобы быстро остановить барабаны.\n2. 3 барабана останавливаются по очереди. Платит только СРЕДНЯЯ линия.\n3. 3 одинаковых символа на линии: бриллианты ×50 · семёрки ×20 · колокольчики ×10 · лимоны ×5 · вишни ×3. 2 вишни на линии ×1,5.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“. Nochmal tippen stoppt die Walzen schneller.\n2. Die 3 Walzen stoppen nacheinander. Nur die MITTLERE Linie zahlt.\n3. 3 gleiche Symbole auf der Linie: Diamanten ×50 · Siebenen ×20 · Glocken ×10 · Zitronen ×5 · Kirschen ×3. 2 Kirschen auf der Linie ×1,5.',
      hi: '1. अपना दांव चुनें और «स्पिन» दबाएँ। रील जल्दी रोकने के लिए फिर से दबाएँ।\n2. 3 रील एक-एक करके रुकती हैं। सिर्फ़ बीच की लाइन जीतती है।\n3. लाइन पर 3 एक जैसे चिह्न: हीरे ×50 · सात ×20 · घंटियाँ ×10 · नींबू ×5 · चेरी ×3। लाइन पर 2 चेरी ×1.5।',
      zh: '1. 选择投注额，点击“旋转”。再点一次可快速停止转轴。\n2. 3 个转轴依次停下。只有中间一行派彩。\n3. 中间一行 3 个相同图案：钻石 ×50 · 7 ×20 · 铃铛 ×10 · 柠檬 ×5 · 樱桃 ×3。中间一行 2 个樱桃 ×1.5。'
    }
  });
})(window.D6 = window.D6 || {});
