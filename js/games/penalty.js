/* v2795 — Penalty rebuilt (owner request): Evoplay Penalty Shoot-Out-style — goal with keeper, 5 aim targets, a series of up to
   8 shots on the multiplier ladder (×1.44 → ×24.60), ball flight + keeper dive, cash out between shots.
   Server: K.multi('penalty', 'start' | 'shoot' {aim: 0..2, h: 0..2} | 'cash' | 'state'). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cash: 'Cash out', pick: 'Choose a target' },
    fr: { bet: 'Miser', cash: 'Encaisser', pick: 'Choisis une cible' },
    es: { bet: 'Apostar', cash: 'Retirar', pick: 'Elige un objetivo' },
    pt: { bet: 'Apostar', cash: 'Sacar', pick: 'Escolha um alvo' },
    ar: { bet: 'راهن', cash: 'اسحب', pick: 'اختر هدفًا' },
    tr: { bet: 'Bahis', cash: 'Bozdur', pick: 'Bir hedef seç' },
    vi: { bet: 'Cược', cash: 'Rút tiền', pick: 'Chọn vị trí sút' },
    id: { bet: 'Pasang', cash: 'Tarik', pick: 'Pilih sasaran' },
    ru: { bet: 'Ставка', cash: 'Забрать', pick: 'Выберите цель' },
    de: { bet: 'Setzen', cash: 'Auszahlen', pick: 'Wähle ein Ziel' },
    hi: { bet: 'दांव', cash: 'कैश आउट', pick: 'निशाना चुनें' },
    zh: { bet: '下注', cash: '兑现', pick: '选择射门位置' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var ROWS = 8;
  // même échelle que le serveur : floor(0,96 × 1,5^k × 100) / 100
  var LADDER = []; for (var i = 1; i <= ROWS; i++) LADDER.push(Math.floor(0.96 * Math.pow(1.5, i) * 100 + 1e-6) / 100);
  // 5 cibles : [colonne (0 gauche, 1 centre, 2 droite), hauteur (0 haut, 1 milieu, 2 bas), x, y]
  var ZONES = [[0, 0, 96, 70], [0, 2, 96, 118], [1, 0, 160, 64], [2, 0, 224, 70], [2, 2, 224, 118]];
  var SPOT = [160, 202];
  function nf(v, d) { return Number(v).toFixed(d).replace('.', K.dec()); }
  function fitGo(el) {
    if (!el || !el.isConnected) return;
    el.style.removeProperty('font-size');
    var fs = parseFloat(getComputedStyle(el).fontSize) || 20, min = fs * 0.5, n = 0;
    while (el.scrollWidth > el.clientWidth + 1 && fs > min && n++ < 30) { fs *= 0.93; el.style.setProperty('font-size', fs.toFixed(1) + 'px', 'important'); }
  }
  window.addEventListener('resize', function () { setTimeout(function () { if (document.querySelector('.cg-penalty')) fitGo($('csGo')); }, 200); });

  function scene() {
    var net = '';
    for (var x = 68; x < 260; x += 12) net += 'M' + x + ' 50V140';
    for (var y = 58; y < 140; y += 10) net += 'M62 ' + y + 'H258';
    var crowd = '';
    for (var k = -40; k < 80; k++) crowd += '<circle cx="' + (6 + k * 8) + '" cy="' + (104 + (k % 3) * 6) + '" r="' + (1 + K.seeded(k + 50, 3) * 1.3).toFixed(1) + '"/>';
    var targets = ZONES.map(function (z, j) {
      return '<g class="pn-t" data-z="' + j + '" transform="translate(' + z[2] + ' ' + z[3] + ')"><circle r="17" class="pn-hit"/><circle r="12" class="pn-r1"/><circle r="6" class="pn-r2"/><circle r="2" class="pn-r3"/></g>';
    }).join('');
    return '<svg class="pn-svg" viewBox="0 0 320 230" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="false">' +
      '<defs><linearGradient id="pnG" gradientUnits="userSpaceOnUse" x1="0" y1="138" x2="0" y2="300"><stop offset="0" stop-color="#1E7A43"/><stop offset="1" stop-color="#0E3B24"/></linearGradient>' +
        '<radialGradient id="pnL" cx="50%" cy="0%" r="80%"><stop offset="0" stop-color="#C4B5FD" stop-opacity=".45"/><stop offset="1" stop-color="#C4B5FD" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="pnP" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FDE68A"/><stop offset=".6" stop-color="#F59E0B"/><stop offset="1" stop-color="#92400E"/></radialGradient>' +
        '<radialGradient id="pnB" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#E5E7EB"/><stop offset="1" stop-color="#9CA3AF"/></radialGradient></defs>' +
      // planète et projecteurs
      '<g class="pn-planet"><circle cx="262" cy="26" r="13" fill="url(#pnP)"/><ellipse cx="262" cy="26" rx="22" ry="5" fill="none" stroke="#FDE68A" stroke-opacity=".6" stroke-width="1.6" transform="rotate(-16 262 26)"/></g>' +
      '<path d="M44 14l-26 88h62z" fill="url(#pnL)" opacity=".5"/><circle cx="44" cy="14" r="3.5" fill="#fff"/>' +
      // tribunes
      '<path d="M-600 98Q-200 92 0 96Q160 84 320 96Q520 92 920 98V142H-600z" fill="#22184D"/><g fill="#7C6FD1" opacity=".55">' + crowd + '</g>' +
      // pelouse
      '<rect x="-600" y="138" width="1520" height="400" fill="url(#pnG)"/><g fill="#fff" opacity=".05"><rect x="-600" y="152" width="1520" height="12"/><rect x="-600" y="176" width="1520" height="16"/><rect x="-600" y="206" width="1520" height="24"/><rect x="-600" y="244" width="1520" height="30"/></g>' +
      '<path d="M-20 330L54 140H266L340 330M100 140L92 162H228L220 140" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/>' +
      '<ellipse cx="' + SPOT[0] + '" cy="' + (SPOT[1] + 9) + '" rx="4" ry="1.6" fill="#fff" opacity=".7"/>' +
      // but
      '<g class="pn-net"><rect x="62" y="50" width="196" height="90" fill="rgba(255,255,255,.07)"/><path d="' + net + '" stroke="#fff" stroke-opacity=".28" stroke-width=".8"/></g>' +
      '<path d="M62 141V48H258V141" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M62 141V48H258V141" fill="none" stroke="#C4B5FD" stroke-opacity=".5" stroke-width="1.4"/>' +
      // gardien (astronaute OROLADO)
      '<g transform="translate(160 140)"><g class="pn-kp" id="pnKp">' +
        '<ellipse cx="0" cy="1" rx="18" ry="3" fill="#000" opacity=".3"/>' +
        '<path d="M-9 -2l3-20h12l3 20z" fill="#3B2A8C"/><path d="M-7 0h5M2 0h5" stroke="#FBBF24" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M-13 -38h26l-3 18h-20z" fill="#6D4AFF"/><path d="M-13 -38h26l-1 5h-24z" fill="#FBBF24"/>' +
        '<text x="0" y="-24" text-anchor="middle" font-size="9" font-weight="900" font-family="system-ui,sans-serif" fill="#FDE68A">1</text>' +
        '<path d="M-13 -36L-27 -54M13 -36L27 -54" stroke="#6D4AFF" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="-28" cy="-56" r="5" fill="#FBBF24"/><circle cx="28" cy="-56" r="5" fill="#FBBF24"/>' +
        '<circle cx="0" cy="-48" r="10" fill="#EDE9FE"/><path d="M-7 -50a7 5 0 0 1 14 0v3a7 4 0 0 1-14 0z" fill="#F59E0B"/><path d="M-5 -51a5 3 0 0 1 6-1" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8"/>' +
      '</g></g>' +
      '<g class="pn-targets">' + targets + '</g>' +
      // ballon
      '<g transform="translate(' + SPOT[0] + ' ' + SPOT[1] + ')"><g class="pn-ball" id="pnBall"><circle r="10" fill="url(#pnB)"/>' +
        '<path d="M0 -4l3.8 2.8-1.5 4.5h-4.6l-1.5-4.5z" fill="#1F2937"/><path d="M0 -4V-10M3.8 -1.2l5.6-2M2.3 3.3l3.4 5M-2.3 3.3l-3.4 5M-3.8 -1.2l-5.6-2" stroke="#1F2937" stroke-width="1.2"/></g></g>' +
      '</svg>';
  }

  K.register('penalty', function (box, x) {
    var l = L(), g = null, busy = false;
    box.classList.add('cg-game', 'cg-penalty');
    box.innerHTML = '<div class="cg-stage pn-stage">' +
        '<div class="pn-lad" id="pnLad">' + LADDER.map(function (m, k) { return '<span data-k="' + k + '"><b class="fit">×' + nf(m, 2) + '</b></span>'; }).join('') + '</div>' +
        '<div class="pn-field">' + scene() + '<div class="pn-tip"><b class="fit" id="pnTip"></b></div></div>' +
      '</div>' + K.stakePanel(l.bet);
    K.bindStake(box);
    var go = $('csGo'), kp = $('pnKp'), ball = $('pnBall'), net = box.querySelector('.pn-net');
    function live() { return g && !g.done; }
    // la scène remplit toute la place : la zone utile (but, gardien, point de penalty) reste toujours visible, le décor s'étend autour
    var svg = box.querySelector('.pn-svg');
    function fitView() {
      if (!svg.isConnected) return;
      var w = svg.clientWidth, h = svg.clientHeight; if (!w || !h) return;
      var cx = 28, cy = 8, cw = 264, ch = 210, ar = w / h, vx, vy, vw, vh;
      if (ar > cw / ch) { vh = ch; vw = ch * ar; vx = 160 - vw / 2; vy = cy; }
      else { vw = cw; vh = cw / ar; vx = cx; vy = cy + ch - vh + (vh - ch) * 0.3; }
      svg.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));
    }
    if (window.ResizeObserver) new ResizeObserver(fitView).observe(svg); else window.addEventListener('resize', fitView);
    requestAnimationFrame(fitView);
    function paintLadder() {
      var k = g ? g.k || 0 : 0;
      box.querySelectorAll('#pnLad span').forEach(function (s, i) {
        var c = '';
        if (g && i < k) c = 'ok';
        if (live() && i === k) c = 'cur';
        if (g && g.done && !(g.win > 0) && g.boom === i) c = 'miss';
        s.className = c;
      });
    }
    function paint() {
      paintLadder();
      var on = live() && !busy;
      box.classList.toggle('aim', !!on);
      K.setText($('pnTip'), on ? l.pick : '');
      if (live()) {
        go.classList.add('cash'); go.disabled = busy || !(g.k > 0);
        K.setText(go, g.k > 0 ? l.cash + ' $ ' + K.m2(g.stake * g.mult) : l.cash);
      } else { go.classList.remove('cash'); go.disabled = busy; K.setText(go, l.bet); }
      fitGo(go);
    }
    function resetPieces() {
      [kp, ball].forEach(function (e) { if (e.getAnimations) e.getAnimations().forEach(function (a) { a.cancel(); }); });
    }
    async function shoot(zi) {
      if (!live() || busy) return;
      busy = true; paint();
      var z = ZONES[zi];
      box.querySelectorAll('.pn-t').forEach(function (t) { t.classList.toggle('sel', +t.getAttribute('data-z') === zi); });
      var r = await K.multi('penalty', 'shoot', { aim: z[0], h: z[1] });
      if (!box.isConnected) return;
      if (!r) { busy = false; paint(); return; }
      var shot = (r.shots || [])[(r.shots || []).length - 1] || [z[0], z[1], 1, 1];
      var keeper = shot[2], goal = !!shot[3];
      var lite = document.documentElement.classList.contains('oro-lite'), dur = lite ? 260 : 620;
      var dx = z[2] - SPOT[0], dy = z[3] - SPOT[1];
      resetPieces();
      if (kp.animate && ball.animate) {
        // le gardien plonge vers la colonne tirée par le serveur
        var hh = keeper === z[0] ? z[1] : 1, up = hh === 0 ? 34 : hh === 1 ? 20 : 6;
        var kd = keeper === 0 ? 'translate(-46px,-' + up + 'px) rotate(-64deg)' : keeper === 2 ? 'translate(46px,-' + up + 'px) rotate(64deg)' : 'translate(0,-' + (hh === 0 ? 22 : 10) + 'px)';
        kp.animate([{ transform: 'none' }, { transform: kd, offset: 0.55 }, { transform: kd }], { duration: dur + 500, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
        var end = 'translate(' + dx + 'px,' + dy + 'px) scale(.55)';
        var kf = goal ? [{ transform: 'none' }, { transform: end, offset: 0.62 }, { transform: 'translate(' + dx * 1.02 + 'px,' + (dy + 4) + 'px) scale(.5)' }]
          : [{ transform: 'none' }, { transform: 'translate(' + dx * 0.92 + 'px,' + (dy * 0.92 + 4) + 'px) scale(.6)', offset: 0.55 }, { transform: 'translate(' + dx * 0.4 + 'px,' + (dy * 0.45) + 'px) scale(.75)', opacity: 0.2 }];
        var a = ball.animate(kf, { duration: dur + 300, easing: 'ease-out', fill: 'forwards' });
        if (goal && net.animate) setTimeout(function () { if (box.isConnected) net.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.025,1.04)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' }); }, dur * 0.62);
        await a.finished.catch(function () {});
      } else await K.sleep(dur);
      if (!box.isConnected) return;
      g = r;
      paintLadder();
      if (r.done) K.resultLine(box, r);
      await K.sleep(lite ? 150 : 450);
      if (!box.isConnected) return;
      if (ball.animate) ball.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      resetPieces();
      box.querySelectorAll('.pn-t.sel').forEach(function (t) { t.classList.remove('sel'); });
      busy = false; paint();
    }
    box.querySelectorAll('.pn-t').forEach(function (t) { t.addEventListener('click', function () { shoot(+t.getAttribute('data-z')); }); });
    go.addEventListener('click', async function () {
      if (busy) return;
      busy = true; paint();
      var r = await K.multi('penalty', live() ? 'cash' : 'start');
      if (!box.isConnected) return;
      busy = false;
      if (r) { g = r; if (r.done) K.resultLine(box, r); }
      paint();
    });
    paint();
    K.multi('penalty', 'state', null, true).then(function (r) { if (r && !r.done && box.isConnected && !g) { g = r; paint(); } });
  }, { rules: {
    en: '1. Tap “Bet”, then tap one of the 5 targets in the goal to shoot.\n2. The keeper dives to one side (left, centre or right). Each goal climbs the ladder: ×1.44, ×2.16, ×3.24 … up to ×24.60 after 8 goals.\n3. Cash out between shots whenever you want. If the keeper saves, the stake is lost.',
    fr: '1. Touche « Miser », puis touche une des 5 cibles dans le but pour tirer.\n2. Le gardien plonge d’un côté (gauche, centre ou droite). Chaque but fait monter l’échelle : ×1,44, ×2,16, ×3,24 … jusqu’à ×24,60 après 8 buts.\n3. Encaisse entre deux tirs quand tu veux. Si le gardien arrête, la mise est perdue.',
    es: '1. Toca «Apostar» y luego uno de los 5 objetivos de la portería para chutar.\n2. El portero se lanza a un lado (izquierda, centro o derecha). Cada gol sube la escalera: ×1,44, ×2,16, ×3,24 … hasta ×24,60 tras 8 goles.\n3. Retira entre tiros cuando quieras. Si el portero para, pierdes la apuesta.',
    pt: '1. Toque em «Apostar» e depois num dos 5 alvos do gol para chutar.\n2. O goleiro pula para um lado (esquerda, centro ou direita). Cada gol sobe a escada: ×1,44, ×2,16, ×3,24 … até ×24,60 após 8 gols.\n3. Saque entre os chutes quando quiser. Se o goleiro defender, a aposta é perdida.',
    ar: '1. اضغط «راهن» ثم اضغط أحد الأهداف الخمسة في المرمى للتسديد.\n2. يقفز الحارس إلى جهة (يسار أو وسط أو يمين). كل هدف يرفعك في السلّم: ×1.44، ×2.16، ×3.24 … حتى ×24.60 بعد 8 أهداف.\n3. اسحب بين التسديدات متى شئت. إذا صدّ الحارس تخسر الرهان.',
    tr: '1. «Bahis»e dokun, sonra şut için kaledeki 5 hedeften birine dokun.\n2. Kaleci bir tarafa atlar (sol, orta ya da sağ). Her gol seni merdivende yükseltir: ×1,44, ×2,16, ×3,24 … 8 golde ×24,60’a kadar.\n3. Şutlar arasında istediğin an bozdur. Kaleci kurtarırsa bahis kaybedilir.',
    vi: '1. Chạm «Cược», rồi chạm một trong 5 mục tiêu trong khung thành để sút.\n2. Thủ môn đổ người về một phía (trái, giữa hoặc phải). Mỗi bàn thắng leo thang: ×1,44, ×2,16, ×3,24 … đến ×24,60 sau 8 bàn.\n3. Rút tiền giữa các cú sút bất cứ lúc nào. Thủ môn cản được thì mất tiền cược.',
    id: '1. Ketuk «Pasang», lalu ketuk salah satu dari 5 sasaran di gawang untuk menendang.\n2. Kiper melompat ke satu sisi (kiri, tengah, atau kanan). Tiap gol menaikkan tangga: ×1,44, ×2,16, ×3,24 … sampai ×24,60 setelah 8 gol.\n3. Tarik di antara tendangan kapan saja. Jika kiper menahan, taruhan hilang.',
    ru: '1. Нажмите «Ставка», затем одну из 5 целей в воротах, чтобы ударить.\n2. Вратарь прыгает в сторону (влево, в центр или вправо). Каждый гол поднимает по лестнице: ×1,44, ×2,16, ×3,24 … до ×24,60 после 8 голов.\n3. Забирайте выигрыш между ударами когда хотите. Если вратарь отбил — ставка проиграна.',
    de: '1. Tippe auf „Setzen“, dann auf eines der 5 Ziele im Tor, um zu schießen.\n2. Der Torwart springt in eine Ecke (links, Mitte oder rechts). Jedes Tor bringt dich die Leiter hoch: ×1,44, ×2,16, ×3,24 … bis ×24,60 nach 8 Toren.\n3. Zahl dir zwischen den Schüssen jederzeit aus. Hält der Torwart, ist der Einsatz verloren.',
    hi: '1. «दांव» दबाएँ, फिर शॉट के लिए गोल के 5 निशानों में से एक दबाएँ।\n2. गोलकीपर एक तरफ़ कूदता है (बाएँ, बीच या दाएँ)। हर गोल सीढ़ी चढ़ाता है: ×1.44, ×2.16, ×3.24 … 8 गोल के बाद ×24.60 तक।\n3. शॉट्स के बीच जब चाहें कैश आउट करें। गोलकीपर रोक ले तो दांव हारते हैं।',
    zh: '1. 点「下注」，然后点球门里 5 个目标之一射门。\n2. 守门员扑向一侧（左、中或右）。每进一球倍数上升：×1.44、×2.16、×3.24 … 进 8 球最高 ×24.60。\n3. 两次射门之间随时可以兑现。被守门员扑出则输掉下注。'
  } });
})(window.D6 = window.D6 || {});
