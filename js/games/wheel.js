/* v2795 — Lucky Wheel rebuilt (owner request): Spribe / SmartSoft "Wheel" style — one big segmented wheel where every
   segment is drawn at the size of its real chance (server table CASINO_WHEEL), gold pegs and a pointer that kicks on each
   peg, long eased spin that lands on the server segment, result shown in the hub, colour legend + history strip. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { spin: 'Spin' }, fr: { spin: 'Lancer' }, es: { spin: 'Girar' }, pt: { spin: 'Girar' }, ar: { spin: 'دوران' }, tr: { spin: 'Çevir' },
    vi: { spin: 'Quay' }, id: { spin: 'Putar' }, ru: { spin: 'Крутить' }, de: { spin: 'Drehen' }, hi: { spin: 'स्पिन' }, zh: { spin: '旋转' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  // [multiplicateur, chances sur 10 000] — EXACTEMENT la table du serveur (casino_lib.php CASINO_WHEEL), dans le même ordre
  var WHEEL = [[0.5, 600], [1.2, 500], [0, 680], [1.5, 550], [0.5, 600], [2, 325], [0, 680], [1.2, 500], [0.5, 600], [3, 350], [0, 681], [1.2, 500], [0.5, 600], [5, 120], [1.5, 550], [0, 681], [0.5, 600], [1.2, 500], [2, 325], [10, 50], [50, 8]];
  var COL = { 0: ['#3A3166', '#251E47'], 0.5: ['#A78BFA', '#6D28D9'], 1.2: ['#60A5FA', '#1D4ED8'], 1.5: ['#22D3EE', '#0E7490'], 2: ['#4ADE80', '#15803D'],
    3: ['#FCD34D', '#D97706'], 5: ['#FB923C', '#C2410C'], 10: ['#FB7185', '#BE123C'], 50: ['#FFF3B0', '#EAB308'] };
  var LEG = [50, 10, 5, 3, 2, 1.5, 1.2, 0.5, 0];
  function mx(v) { return '×' + String(v).replace('.', K.dec()); }
  function pt(r, a) { a = a * Math.PI / 180; return (r * Math.sin(a)).toFixed(2) + ' ' + (-r * Math.cos(a)).toFixed(2); }

  // géométrie : angle de départ / largeur de chaque case (sens horaire depuis le haut)
  var SEG = [], acc = 0;
  WHEEL.forEach(function (s) { var w = s[1] / 10000 * 360; SEG.push({ m: s[0], a0: acc, w: w }); acc += w; });

  function wheelSvg() {
    var g = '', lab = '', pegs = '', defs = '';
    Object.keys(COL).forEach(function (k, i) {
      defs += '<radialGradient id="whC' + i + '" cx="0" cy="0" r="118" gradientUnits="userSpaceOnUse"><stop offset=".25" stop-color="' + COL[k][1] + '"/><stop offset="1" stop-color="' + COL[k][0] + '"/></radialGradient>';
      COL[k].id = 'whC' + i;
    });
    SEG.forEach(function (s) {
      var a1 = s.a0 + s.w, big = s.w > 180 ? 1 : 0;
      g += '<path d="M0 0L' + pt(116, s.a0) + 'A116 116 0 ' + big + ' 1 ' + pt(116, a1) + 'Z" fill="url(#' + COL[s.m].id + ')"/>';
      g += '<path d="M0 0L' + pt(116, s.a0) + '" stroke="#FDE68A" stroke-opacity=".55" stroke-width="1"/>';
      var mid = s.a0 + s.w / 2;
      if (s.w >= 9) lab += '<text transform="rotate(' + mid.toFixed(2) + ') translate(0 -86) rotate(-90)" text-anchor="middle" dominant-baseline="central" font-size="' + (s.w > 15 ? 12 : 10) + '" class="wh-t' + (s.m === 0 ? ' z' : '') + '">' + mx(s.m) + '</text>';
      else lab += '<g transform="rotate(' + mid.toFixed(2) + ')"><circle cy="-100" r="' + (s.m === 50 ? 5.2 : 4.4) + '" fill="' + COL[s.m][0] + '" stroke="#fff" stroke-width="1.4"/></g>';
      pegs += '<circle cx="' + (122 * Math.sin(s.a0 * Math.PI / 180)).toFixed(2) + '" cy="' + (-122 * Math.cos(s.a0 * Math.PI / 180)).toFixed(2) + '" r="2.6" fill="url(#whPeg)"/>';
    });
    return '<svg viewBox="-132 -132 264 264" aria-hidden="true"><defs>' + defs +
      '<radialGradient id="whRim" cx="50%" cy="50%" r="50%"><stop offset=".86" stop-color="#7A4A06"/><stop offset=".92" stop-color="#FBBF24"/><stop offset=".97" stop-color="#FFF3C4"/><stop offset="1" stop-color="#9A6A00"/></radialGradient>' +
      '<radialGradient id="whPeg" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#D4A017"/></radialGradient></defs>' +
      '<circle r="130" fill="url(#whRim)"/><circle r="117" fill="#120A2E"/>' + g + lab +
      '<circle r="116" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.5"/><circle r="60" fill="rgba(10,5,30,.25)"/>' + pegs + '</svg>';
  }
  var POINTER = '<svg viewBox="0 0 40 52" aria-hidden="true"><defs><linearGradient id="whPt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".5" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient></defs>' +
    '<path d="M20 50L4 16A16 16 0 1 1 36 16z" fill="url(#whPt)" stroke="#7A4A06" stroke-width="2.4" stroke-linejoin="round"/><circle cx="20" cy="16" r="6" fill="#7C2D12"/><circle cx="18" cy="14" r="2" fill="#fff" opacity=".7"/></svg>';

  K.register('wheel', function (box) {
    var l = L(), lite = document.documentElement.classList.contains('oro-lite');
    box.classList.add('cg-game', 'cg-wheel');
    var leg = LEG.map(function (v) { return '<span data-m="' + v + '" style="--c1:' + COL[v][0] + ';--c2:' + COL[v][1] + '"><i></i><b class="fit">' + mx(v) + '</b></span>'; }).join('');
    box.innerHTML = '<div class="cg-stage"><div class="cg-hist wh-hist" id="whHist"></div><div class="wh-host"><div class="wh-wrap"><div class="wh-glow"></div><div class="wh-rot" id="whRot">' + wheelSvg() + '</div>' +
      '<div class="wh-hub"><b class="fit" id="whHub"></b></div><div class="wh-pin" id="whPin">' + POINTER + '</div></div></div>' +
      '<div class="wh-leg" dir="ltr">' + leg + '</div></div>' + K.stakePanel(l.spin);
    K.bindStake(box);
    var host = box.querySelector('.wh-host'), wrap = box.querySelector('.wh-wrap'), rot = $('whRot'), pin = $('whPin'), hub = $('whHub'), go = $('csGo');
    function fit() {
      if (!wrap.isConnected) { if (ro) ro.disconnect(); return; }
      var s = Math.min(host.clientWidth, host.clientHeight - 6, 620); if (s <= 0) return;
      wrap.style.width = wrap.style.height = s + 'px'; wrap.style.setProperty('--u', (s / 100) + 'px');
    }
    var ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(host); else window.addEventListener('resize', fit);
    fit();

    var R = -(SEG[13].a0 + SEG[13].w / 2), busy = false, hist = [];
    rot.style.transform = 'rotate(' + R + 'deg)';
    function under(r) { var a = ((-r) % 360 + 360) % 360; for (var i = SEG.length - 1; i >= 0; i--) if (a >= SEG[i].a0) return i; return 0; }
    function paintHist() {
      $('whHist').innerHTML = hist.map(function (v) { return '<i class="' + (v >= 5 ? 'hi' : v >= 1.2 ? 'mid' : 'lo') + '">' + mx(v) + '</i>'; }).join('');
    }
    go.addEventListener('click', async function () {
      if (busy) return;
      busy = true; go.disabled = true;
      box.querySelectorAll('.wh-leg span.on').forEach(function (e) { e.classList.remove('on'); });
      wrap.classList.remove('won', 'lost'); K.setText(hub, '');
      var r = await K.play('wheel', {});
      if (!r || !box.isConnected) { busy = false; go.disabled = false; return; }
      var s = SEG[r.view.i], u = s.w > 3 ? s.a0 + s.w * (0.2 + 0.6 * Math.random()) : s.a0 + s.w / 2;
      var R0 = R, target = R0 + 360 * (lite ? 3 : 6) + ((((-u - R0) % 360) + 360) % 360), D = target - R0;
      var dur = lite ? 2600 : 5200, t0 = performance.now(), seg = under(R0), kick = 0, lastKick = 0;
      await new Promise(function (done) {
        (function f(now) {
          if (!box.isConnected) return done();
          var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
          R = R0 + D * e;
          rot.style.transform = 'rotate(' + R.toFixed(2) + 'deg)';
          var si = under(R); if (si !== seg) { seg = si; kick = 1; lastKick = now; }
          var p = kick ? -24 * Math.exp(-(now - lastKick) / 70) : 0;
          pin.style.transform = 'rotate(' + p.toFixed(1) + 'deg)';
          if (k < 1) K.S.raf = requestAnimationFrame(f); else { pin.style.transform = ''; done(); }
        })(t0);
      });
      if (!box.isConnected) return;
      R = ((R % 360) + 360) % 360; rot.style.transform = 'rotate(' + R + 'deg)';
      K.setText(hub, mx(r.mult)); hub.style.color = r.mult === 0 ? '#A9A3CF' : COL[r.mult] ? COL[r.mult][0] : '#fff';
      var le = box.querySelector('.wh-leg span[data-m="' + r.mult + '"]'); if (le) le.classList.add('on');
      wrap.classList.add(r.win > 0 ? 'won' : 'lost');
      hist.unshift(r.mult); hist = hist.slice(0, 16); paintHist();
      K.resultLine(box, r);
      busy = false; go.disabled = false;
    });
  }, {
    rules: {
      en: '1. Choose your stake and tap “Spin”.\n2. The wheel spins and stops under the arrow. Each segment is drawn at the size of its real chance.\n3. You win stake × the segment: ×0 · ×0.5 · ×1.2 · ×1.5 · ×2 · ×3 · ×5 · ×10 · ×50 (the thin gold one is very rare).',
      fr: '1. Choisis ta mise et touche « Lancer ».\n2. La roue tourne et s’arrête sous la flèche. Chaque case est dessinée à la taille de sa vraie chance.\n3. Tu gagnes mise × la case : ×0 · ×0,5 · ×1,2 · ×1,5 · ×2 · ×3 · ×5 · ×10 · ×50 (la fine case dorée est très rare).',
      es: '1. Elige tu apuesta y toca «Girar».\n2. La rueda gira y se para bajo la flecha. Cada casilla tiene el tamaño de su probabilidad real.\n3. Ganas apuesta × la casilla: ×0 · ×0,5 · ×1,2 · ×1,5 · ×2 · ×3 · ×5 · ×10 · ×50 (la fina dorada es muy rara).',
      pt: '1. Escolha a aposta e toque em «Girar».\n2. A roda gira e para sob a seta. Cada casa é desenhada do tamanho da sua chance real.\n3. Você ganha aposta × a casa: ×0 · ×0,5 · ×1,2 · ×1,5 · ×2 · ×3 · ×5 · ×10 · ×50 (a fina dourada é muito rara).',
      ar: '1. اختر رهانك واضغط «دوران».\n2. تدور العجلة وتتوقف تحت السهم. كل خانة مرسومة بحجم فرصتها الحقيقية.\n3. تربح الرهان × الخانة: ×0 · ×0.5 · ×1.2 · ×1.5 · ×2 · ×3 · ×5 · ×10 · ×50 (الخانة الذهبية الرفيعة نادرة جدًا).',
      tr: '1. Bahsini seç ve «Çevir»e dokun.\n2. Çark döner ve okun altında durur. Her dilim gerçek şansı büyüklüğünde çizilmiştir.\n3. Bahis × dilim kazanırsın: ×0 · ×0,5 · ×1,2 · ×1,5 · ×2 · ×3 · ×5 · ×10 · ×50 (ince altın dilim çok nadirdir).',
      vi: '1. Chọn mức cược rồi chạm «Quay».\n2. Vòng quay dừng dưới mũi tên. Mỗi ô được vẽ đúng bằng cơ hội thật của nó.\n3. Bạn thắng cược × ô: ×0 · ×0,5 · ×1,2 · ×1,5 · ×2 · ×3 · ×5 · ×10 · ×50 (ô vàng mảnh rất hiếm).',
      id: '1. Pilih taruhan lalu ketuk «Putar».\n2. Roda berputar dan berhenti di bawah panah. Setiap bagian digambar seukuran peluang aslinya.\n3. Kamu menang taruhan × bagian: ×0 · ×0,5 · ×1,2 · ×1,5 · ×2 · ×3 · ×5 · ×10 · ×50 (bagian emas tipis sangat langka).',
      ru: '1. Выбери ставку и нажми «Крутить».\n2. Колесо вращается и останавливается под стрелкой. Каждый сектор нарисован размером со свой реальный шанс.\n3. Выигрыш = ставка × сектор: ×0 · ×0,5 · ×1,2 · ×1,5 · ×2 · ×3 · ×5 · ×10 · ×50 (тонкий золотой сектор очень редкий).',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“.\n2. Das Rad dreht sich und stoppt unter dem Pfeil. Jedes Feld ist so groß wie seine echte Chance.\n3. Du gewinnst Einsatz × Feld: ×0 · ×0,5 · ×1,2 · ×1,5 · ×2 · ×3 · ×5 · ×10 · ×50 (das schmale goldene Feld ist sehr selten).',
      hi: '1. अपना दांव चुनें और «स्पिन» दबाएँ।\n2. पहिया घूमकर तीर के नीचे रुकता है। हर खाना अपनी असली संभावना जितना बड़ा है।\n3. जीत = दांव × खाना: ×0 · ×0.5 · ×1.2 · ×1.5 · ×2 · ×3 · ×5 · ×10 · ×50 (पतला सुनहरा खाना बहुत दुर्लभ है)।',
      zh: '1. 选择投注额，点击“旋转”。\n2. 转盘转动后停在箭头下方。每个格子的大小就是它真实的概率。\n3. 赢得 投注 × 格子倍数：×0 · ×0.5 · ×1.2 · ×1.5 · ×2 · ×3 · ×5 · ×10 · ×50（细细的金色格子非常稀有）。'
    }
  });
})(window.D6 = window.D6 || {});
