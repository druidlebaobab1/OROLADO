/* v2795 — Scratch Card rebuilt (owner request): Hacksaw-style scratch ticket — buy a card, scratch the gold foil with the
   finger / mouse on a canvas over a 3×3 grid (each cell opens by itself once mostly scratched), "Reveal all" button,
   the 3 matching symbols light up. The server draws the grid and the payout (CASINO_SCRATCH, RTP 94 %). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { buy: 'Buy card', reveal: 'Reveal all', scratch: 'Scratch the card!', idle: 'Match 3 symbols' },
    fr: { buy: 'Acheter', reveal: 'Tout découvrir', scratch: 'Gratte le ticket !', idle: '3 symboles pareils' },
    es: { buy: 'Comprar', reveal: 'Revelar todo', scratch: '¡Rasca el boleto!', idle: '3 símbolos iguales' },
    pt: { buy: 'Comprar', reveal: 'Revelar tudo', scratch: 'Raspe o bilhete!', idle: '3 símbolos iguais' },
    ar: { buy: 'اشترِ بطاقة', reveal: 'اكشف الكل', scratch: 'اكشط البطاقة!', idle: '3 رموز متشابهة' },
    tr: { buy: 'Kart al', reveal: 'Hepsini aç', scratch: 'Kartı kazı!', idle: '3 aynı sembol' },
    vi: { buy: 'Mua vé', reveal: 'Mở tất cả', scratch: 'Cào vé đi!', idle: '3 biểu tượng giống nhau' },
    id: { buy: 'Beli kartu', reveal: 'Buka semua', scratch: 'Gosok kartunya!', idle: '3 simbol sama' },
    ru: { buy: 'Купить', reveal: 'Открыть всё', scratch: 'Стирай билет!', idle: '3 одинаковых символа' },
    de: { buy: 'Kaufen', reveal: 'Alles aufdecken', scratch: 'Rubbel das Los!', idle: '3 gleiche Symbole' },
    hi: { buy: 'कार्ड खरीदें', reveal: 'सब खोलें', scratch: 'कार्ड खुरचें!', idle: '3 एक जैसे चिह्न' },
    zh: { buy: '购买', reveal: '全部刮开', scratch: '刮开彩票！', idle: '3 个相同图案' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  // gains (3 pareils) : même table que le serveur (casino_scratch_grid / CASINO_SCRATCH)
  var PAY = [['crown', 20], ['diamond', 5], ['star', 2], ['clover', 1]];
  function mx(v) { return '×' + String(v).replace('.', K.dec()); }

  var DEFS = '<svg class="sc-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="scGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".5" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></linearGradient>' +
    '<linearGradient id="scDia" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E0F2FE"/><stop offset=".5" stop-color="#38BDF8"/><stop offset="1" stop-color="#1D4ED8"/></linearGradient>' +
    '<radialGradient id="scStar" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#F5D0FE"/><stop offset=".5" stop-color="#C084FC"/><stop offset="1" stop-color="#6D28D9"/></radialGradient>' +
    '<radialGradient id="scClo" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#BBF7D0"/><stop offset=".5" stop-color="#22C55E"/><stop offset="1" stop-color="#14532D"/></radialGradient>' +
    '<radialGradient id="scHeart" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FECDD3"/><stop offset=".5" stop-color="#F43F5E"/><stop offset="1" stop-color="#881337"/></radialGradient>' +
    '<radialGradient id="scCoin" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FEF3C7"/><stop offset=".55" stop-color="#F59E0B"/><stop offset="1" stop-color="#92400E"/></radialGradient>' +
    '</defs></svg>';
  var ART = {
    crown: '<path d="M14 72L8 30l22 18 20-30 20 30 22-18-6 42z" fill="url(#scGold)" stroke="#92400E" stroke-width="3" stroke-linejoin="round"/><rect x="14" y="72" width="72" height="12" rx="4" fill="url(#scGold)" stroke="#92400E" stroke-width="3"/>' +
      '<circle cx="50" cy="60" r="7" fill="#E11D48" stroke="#fff" stroke-width="2"/><circle cx="8" cy="30" r="5" fill="#FDE68A"/><circle cx="50" cy="16" r="5" fill="#FDE68A"/><circle cx="92" cy="30" r="5" fill="#FDE68A"/>',
    diamond: '<path d="M10 38l18-22h44l18 22-40 50z" fill="url(#scDia)" stroke="#E0F2FE" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 38h80M28 16l8 22 14-22 14 22 8-22M36 38l14 50 14-50" fill="none" stroke="#E0F2FE" stroke-width="2" opacity=".8"/><path d="M30 31l6-9" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    star: '<path d="M50 8l11 27 29 2-22 19 7 29-25-16-25 16 7-29-22-19 29-2z" fill="url(#scStar)" stroke="#F5D0FE" stroke-width="2.5" stroke-linejoin="round"/><circle cx="42" cy="34" r="5" fill="#fff" opacity=".6"/>',
    clover: '<g fill="url(#scClo)" stroke="#14532D" stroke-width="2.5"><circle cx="35" cy="35" r="17"/><circle cx="65" cy="35" r="17"/><circle cx="35" cy="62" r="17"/><circle cx="65" cy="62" r="17"/></g><path d="M50 50q4 26 16 40" stroke="#14532D" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="30" cy="30" r="4" fill="#fff" opacity=".6"/>',
    coin: '<circle cx="50" cy="50" r="40" fill="url(#scCoin)" stroke="#92400E" stroke-width="3"/><circle cx="50" cy="50" r="29" fill="none" stroke="#92400E" stroke-width="3" opacity=".6"/><circle cx="50" cy="50" r="15" fill="none" stroke="#92400E" stroke-width="7"/>',
    heart: '<path d="M50 86C20 64 8 48 8 32 8 20 18 12 29 12c9 0 16 5 21 13 5-8 12-13 21-13 11 0 21 8 21 20 0 16-12 32-42 54z" fill="url(#scHeart)" stroke="#881337" stroke-width="3" stroke-linejoin="round"/><ellipse cx="28" cy="30" rx="7" ry="5" fill="#fff" opacity=".55"/>'
  };
  function sym(k) { return '<svg class="sy" viewBox="0 0 100 100" aria-hidden="true">' + (ART[k] || '') + '</svg>'; }
  var SP = 5; // points de contrôle par côté et par case (5×5)

  K.register('scratch', function (box) {
    var l = L(), lite = document.documentElement.classList.contains('oro-lite');
    box.classList.add('cg-game', 'cg-scratch');
    var cells = ''; for (var i = 0; i < 9; i++) cells += '<span class="sc-cell" data-i="' + i + '"></span>';
    var pay = PAY.map(function (p) { return '<span class="sc-p" data-k="' + p[0] + '"><i>' + sym(p[0]) + sym(p[0]) + sym(p[0]) + '</i><b class="fit">' + mx(p[1]) + '</b></span>'; }).join('');
    box.innerHTML = '<div class="cg-stage">' + DEFS + '<div class="sc-status"><b class="fit" id="scSt"></b></div><div class="sc-host"><div class="sc-card">' +
      '<div class="sc-head"><i></i><b>SCRATCH&nbsp;<em>·</em>&nbsp;OROLADO</b><i></i></div>' +
      '<div class="sc-gw" dir="ltr"><div class="sc-grid" id="scGrid">' + cells + '</div><canvas class="sc-cv" id="scCv"></canvas></div></div></div>' +
      '<div class="sc-pay" dir="ltr">' + pay + '</div></div>' + K.stakePanel(l.buy);
    K.bindStake(box);
    var host = box.querySelector('.sc-host'), card = box.querySelector('.sc-card'), gw = box.querySelector('.sc-gw'), cv = $('scCv'), ctx = cv.getContext('2d'),
      grid = $('scGrid'), cellEls = grid.children, go = $('csGo'), st = $('scSt');
    K.setText(st, l.idle);

    var cur = null, live = false, opened = [], marks = [], W = 0, H = 0, dpr = 1, busy = false;
    function fit() {
      if (!card.isConnected) { if (ro) ro.disconnect(); return; }
      var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      var cw = Math.min(w, h * 0.86, 520); // carte : largeur / hauteur ≈ 0,86
      card.style.width = cw + 'px'; card.style.height = (cw / 0.86) + 'px'; card.style.setProperty('--u', (cw / 100) + 'px');
      var nw = gw.clientWidth, nh = gw.clientHeight;
      if (nw && nh && (nw !== W || nh !== H)) { W = nw; H = nh; dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); foil(); }
    }
    var ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(host); else window.addEventListener('resize', fit);

    /* ---------- la feuille à gratter (or brossé, étoiles, « ? » sur chaque case) ---------- */
    function cellRect(i) { var c = cellEls[i]; return { x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight }; }
    function foil() {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      var g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#B8892B'); g.addColorStop(0.25, '#F7DC8B'); g.addColorStop(0.5, '#C9963A'); g.addColorStop(0.75, '#FBE7A6'); g.addColorStop(1, '#A87420');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff';
      for (var s = 0; s < 70; s++) { var x = (s * 97.13) % W, y = (s * 53.71 + (s % 7) * 17) % H; ctx.beginPath(); ctx.arc(x, y, 1 + (s % 3), 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
      for (var i = 0; i < 9; i++) {
        var r = cellRect(i), cx = r.x + r.w / 2, cy = r.y + r.h / 2, rad = Math.min(r.w, r.h) * 0.3;
        ctx.fillStyle = 'rgba(120,70,0,.22)'; roundRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6, Math.min(r.w, r.h) * 0.16); ctx.fill();
        ctx.fillStyle = 'rgba(255,248,220,.5)'; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#9A6A00'; ctx.font = '900 ' + Math.round(rad * 1.25) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', cx, cy + rad * 0.06);
        if (opened[i]) clearCell(i);
      }
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function clearCell(i) { var r = cellRect(i); ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; roundRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, 6); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }

    /* ---------- grattage ---------- */
    var down = false, lx = 0, ly = 0;
    function pos(e) { var rc = cv.getBoundingClientRect(); return [e.clientX - rc.left, e.clientY - rc.top]; }
    function stroke(x0, y0, x1, y1) {
      var bw = Math.max(18, Math.min(W, H) * 0.13);
      ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = '#000'; ctx.lineWidth = bw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + 0.01, y1); ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
      var rr = bw / 2, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy;
      for (var i = 0; i < 9; i++) {
        if (opened[i]) continue;
        var r = cellRect(i), hit = 0;
        for (var a = 0; a < SP; a++) for (var b = 0; b < SP; b++) {
          var k = a * SP + b; if (marks[i][k]) { hit++; continue; }
          var px = r.x + r.w * (0.14 + 0.72 * (b + 0.5) / SP), py = r.y + r.h * (0.14 + 0.72 * (a + 0.5) / SP);
          var t = L2 ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / L2)) : 0, qx = x0 + t * dx - px, qy = y0 + t * dy - py;
          if (qx * qx + qy * qy <= rr * rr) { marks[i][k] = 1; hit++; }
        }
        if (hit >= SP * SP * 0.55) openCell(i);
      }
    }
    function openCell(i) {
      if (opened[i] || !live) return;
      opened[i] = 1; clearCell(i); cellEls[i].classList.add('op');
      if (opened.filter(Boolean).length === 9) finish();
    }
    cv.addEventListener('pointerdown', function (e) {
      if (!live) { if (!busy) { card.classList.remove('nudge'); void card.offsetWidth; card.classList.add('nudge'); } return; }
      down = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
      var p = pos(e); lx = p[0]; ly = p[1]; stroke(lx, ly, lx, ly); e.preventDefault();
    });
    cv.addEventListener('pointermove', function (e) { if (!down || !live) return; var p = pos(e); stroke(lx, ly, p[0], p[1]); lx = p[0]; ly = p[1]; e.preventDefault(); });
    function up() { down = false; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('lostpointercapture', up);

    function finish() {
      if (!live) return;
      live = false; cv.classList.add('gone');
      var r = cur, win = r.mult > 0 ? (PAY.filter(function (p) { return p[1] === r.mult; })[0] || [])[0] : null;
      for (var i = 0; i < 9; i++) cellEls[i].classList.add(win && r.view.grid[i] === win ? 'win' : 'dim');
      if (win) { box.querySelector('.sc-p[data-k="' + win + '"]').classList.add('on'); card.classList.add('won'); }
      K.setText(st, l.idle);
      go.classList.remove('cash'); K.setText(go, l.buy);
      K.resultLine(box, r);
    }
    async function revealAll() {
      if (!live) return;
      go.disabled = true;
      for (var i = 0; i < 9 && live; i++) { if (!opened[i]) { openCell(i); if (live && !lite) await K.sleep(90); } }
      go.disabled = false;
    }

    go.addEventListener('click', async function () {
      if (live) { revealAll(); return; }
      if (busy) return;
      busy = true; go.disabled = true;
      var r = await K.play('scratch', {});
      busy = false; go.disabled = false;
      if (!r || !box.isConnected) return;
      // nouvelle carte : la feuille est remise AVANT de poser les symboles
      opened = []; marks = []; for (var i = 0; i < 9; i++) { opened.push(0); marks.push([]); }
      cv.classList.remove('gone'); foil();
      box.querySelectorAll('.sc-p.on').forEach(function (e) { e.classList.remove('on'); });
      card.classList.remove('won');
      for (var j = 0; j < 9; j++) { cellEls[j].className = 'sc-cell'; cellEls[j].innerHTML = sym(r.view.grid[j]); }
      cur = r; live = true;
      card.classList.remove('fresh'); void card.offsetWidth; card.classList.add('fresh');
      K.setText(st, l.scratch);
      go.classList.add('cash'); K.setText(go, l.reveal);
    });
    // carte de départ (fermée, « ? » partout)
    for (var j = 0; j < 9; j++) { opened.push(0); marks.push([]); }
    fit();
    requestAnimationFrame(fit);
  }, {
    rules: {
      en: '1. Choose your stake and tap “Buy card”.\n2. Scratch the gold foil with your finger (or the mouse), or tap “Reveal all”.\n3. 3 same symbols on the card win: crowns ×20 · diamonds ×5 · stars ×2 · clovers ×1.',
      fr: '1. Choisis ta mise et touche « Acheter ».\n2. Gratte la feuille dorée avec ton doigt (ou la souris), ou touche « Tout découvrir ».\n3. 3 symboles pareils sur le ticket gagnent : couronnes ×20 · diamants ×5 · étoiles ×2 · trèfles ×1.',
      es: '1. Elige tu apuesta y toca «Comprar».\n2. Rasca la capa dorada con el dedo (o el ratón), o toca «Revelar todo».\n3. 3 símbolos iguales en el boleto ganan: coronas ×20 · diamantes ×5 · estrellas ×2 · tréboles ×1.',
      pt: '1. Escolha a aposta e toque em «Comprar».\n2. Raspe a camada dourada com o dedo (ou o mouse), ou toque em «Revelar tudo».\n3. 3 símbolos iguais no bilhete ganham: coroas ×20 · diamantes ×5 · estrelas ×2 · trevos ×1.',
      ar: '1. اختر رهانك واضغط «اشترِ بطاقة».\n2. اكشط الطبقة الذهبية بإصبعك (أو بالفأرة)، أو اضغط «اكشف الكل».\n3. ثلاثة رموز متشابهة على البطاقة تربح: التيجان ×20 · الماس ×5 · النجوم ×2 · البرسيم ×1.',
      tr: '1. Bahsini seç ve «Kart al»a dokun.\n2. Altın kaplamayı parmağınla (veya fareyle) kazı ya da «Hepsini aç»a dokun.\n3. Kartta 3 aynı sembol kazanır: taç ×20 · elmas ×5 · yıldız ×2 · yonca ×1.',
      vi: '1. Chọn mức cược rồi chạm «Mua vé».\n2. Cào lớp vàng bằng ngón tay (hoặc chuột), hoặc chạm «Mở tất cả».\n3. 3 biểu tượng giống nhau trên vé thắng: vương miện ×20 · kim cương ×5 · ngôi sao ×2 · cỏ bốn lá ×1.',
      id: '1. Pilih taruhan lalu ketuk «Beli kartu».\n2. Gosok lapisan emas dengan jari (atau mouse), atau ketuk «Buka semua».\n3. 3 simbol sama di kartu menang: mahkota ×20 · berlian ×5 · bintang ×2 · semanggi ×1.',
      ru: '1. Выбери ставку и нажми «Купить».\n2. Сотри золотой слой пальцем (или мышью) или нажми «Открыть всё».\n3. 3 одинаковых символа на билете выигрывают: короны ×20 · бриллианты ×5 · звёзды ×2 · клевер ×1.',
      de: '1. Wähle deinen Einsatz und tippe auf „Kaufen“.\n2. Rubbel die Goldschicht mit dem Finger (oder der Maus) frei oder tippe auf „Alles aufdecken“.\n3. 3 gleiche Symbole auf dem Los gewinnen: Kronen ×20 · Diamanten ×5 · Sterne ×2 · Kleeblätter ×1.',
      hi: '1. अपना दांव चुनें और «कार्ड खरीदें» दबाएँ।\n2. सुनहरी परत को उंगली (या माउस) से खुरचें, या «सब खोलें» दबाएँ।\n3. कार्ड पर 3 एक जैसे चिह्न जीतते हैं: मुकुट ×20 · हीरे ×5 · तारे ×2 · तिपतिया ×1।',
      zh: '1. 选择投注额，点击“购买”。\n2. 用手指（或鼠标）刮开金色涂层，或点击“全部刮开”。\n3. 彩票上 3 个相同图案即中奖：皇冠 ×20 · 钻石 ×5 · 星星 ×2 · 四叶草 ×1。'
    }
  });
})(window.D6 = window.D6 || {});
