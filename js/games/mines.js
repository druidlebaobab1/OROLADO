/* v2795 — Mines rebuilt (owner request): Spribe-style 5×5 minefield — 1 to 24 mines, "Next tile ×x.xx", tiles flip to
   star gems with a sparkle, a mine explodes and the whole board is revealed, "Random tile" helper, gold CASH OUT with the win.
   The server (casino_multi 'mines' start / open / cash) hides the mines and pays; this file only draws. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cash: 'Cash out', pick: 'Pick a tile', next: 'Next tile', mines: 'Mines', rnd: 'Random tile' },
    fr: { bet: 'Miser', cash: 'Encaisser', pick: 'Choisis une case', next: 'Case suivante', mines: 'Mines', rnd: 'Case au hasard' },
    es: { bet: 'Apostar', cash: 'Retirar', pick: 'Elige una casilla', next: 'Siguiente casilla', mines: 'Minas', rnd: 'Casilla al azar' },
    pt: { bet: 'Apostar', cash: 'Sacar', pick: 'Escolha uma casa', next: 'Próxima casa', mines: 'Minas', rnd: 'Casa aleatória' },
    ar: { bet: 'راهن', cash: 'اسحب', pick: 'اختر مربعًا', next: 'المربع التالي', mines: 'ألغام', rnd: 'مربع عشوائي' },
    tr: { bet: 'Bahis', cash: 'Çek', pick: 'Bir kare seç', next: 'Sonraki kare', mines: 'Mayın', rnd: 'Rastgele kare' },
    vi: { bet: 'Cược', cash: 'Rút tiền', pick: 'Chọn một ô', next: 'Ô tiếp theo', mines: 'Mìn', rnd: 'Ô ngẫu nhiên' },
    id: { bet: 'Pasang', cash: 'Tarik', pick: 'Pilih kotak', next: 'Kotak berikut', mines: 'Ranjau', rnd: 'Kotak acak' },
    ru: { bet: 'Ставка', cash: 'Забрать', pick: 'Выбери клетку', next: 'След. клетка', mines: 'Мины', rnd: 'Случайная' },
    de: { bet: 'Setzen', cash: 'Auszahlen', pick: 'Wähle ein Feld', next: 'Nächstes Feld', mines: 'Minen', rnd: 'Zufallsfeld' },
    hi: { bet: 'दांव', cash: 'कैश आउट', pick: 'एक टाइल चुनें', next: 'अगली टाइल', mines: 'माइंस', rnd: 'रैंडम टाइल' },
    zh: { bet: '下注', cash: '兑现', pick: '选择一个格子', next: '下一格', mines: '地雷', rnd: '随机格子' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function num(v) { return Number(v).toFixed(2).replace('.', K.dec()); }
  function money(v) { return '\u2066$\u00a0' + K.m2(v).replace('.', K.dec()) + '\u2069'; }
  function xm(v) { return '\u2066×' + num(v) + '\u2069'; } // ×1.25 reste dans le bon sens en arabe
  // même calcul que casino_mines_mult (serveur) : aperçu avant la mise seulement
  function mm(m, k) { if (k > 25 - m) return 0; var v = 0.94; for (var j = 0; j < k; j++) v *= (25 - j) / (25 - m - j); return Math.floor(v * 100 + 1e-6) / 100; }
  var DEFS = '<svg class="mn-defs" width="0" height="0" aria-hidden="true"><defs>' +
    '<linearGradient id="mnGg" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#CFFAFE"/><stop offset=".45" stop-color="#67E8F9"/><stop offset="1" stop-color="#7C3AED"/></linearGradient>' +
    '<radialGradient id="mnMg" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#5B5490"/><stop offset=".6" stop-color="#231C48"/><stop offset="1" stop-color="#0C0820"/></radialGradient></defs></svg>';
  var GEM = '<svg class="mn-gem" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 9h20l9 11-19 21L5 20z" fill="url(#mnGg)"/><path d="M14 9h20l-5 11H19z" fill="#fff" opacity=".4"/>' +
    '<path d="M5 20h38M14 9l5 11 5-11 5 11 5-11M19 20l5 21 5-21" stroke="#fff" stroke-opacity=".6" stroke-width="1.1" fill="none" stroke-linejoin="round"/><path d="M9 19l5-6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/></svg>';
  var MINE = '<svg class="mn-mine" viewBox="0 0 48 48" aria-hidden="true"><g stroke="#4B4470" stroke-width="4" stroke-linecap="round"><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4.3 4.3M33.2 33.2l4.3 4.3M37.5 10.5l-4.3 4.3M14.8 33.2l-4.3 4.3"/></g>' +
    '<circle cx="24" cy="24" r="13.5" fill="url(#mnMg)"/><circle cx="24" cy="24" r="5" fill="#F43F5E"/><circle cx="24" cy="24" r="2.2" fill="#FFE4E6"/><circle cx="18.5" cy="18.5" r="3" fill="#fff" opacity=".3"/></svg>';
  var MINI_MINE = '<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke="#C4B5FD" stroke-width="5" stroke-linecap="round"><path d="M24 4v8M24 36v8M4 24h8M36 24h8M10 10l5 5M33 33l5 5M38 10l-5 5M15 33l-5 5"/></g><circle cx="24" cy="24" r="13" fill="#C4B5FD"/><circle cx="24" cy="24" r="5" fill="#F43F5E"/></svg>';
  var MINI_GEM = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 9h20l9 11-19 21L5 20z" fill="#67E8F9"/><path d="M14 9h20l-5 11H19z" fill="#fff" opacity=".5"/></svg>';

  K.register('mines', function (box) {
    var l = L(), g = null, busy = false, mines = 3;
    try { var sm = +localStorage.getItem('cg_mines_n'); if (sm >= 1 && sm <= 24) mines = sm; } catch (e) { /* ignore */ }
    box.classList.add('cg-game', 'cg-mines');
    var tiles = ''; for (var i = 0; i < 25; i++) tiles += '<button type="button" class="mn-t" data-c="' + i + '" aria-label="' + (i + 1) + '"><i class="mn-f"></i></button>';
    var pk = ''; for (var n = 1; n <= 24; n++) pk += '<button type="button" data-n="' + n + '">' + n + '</button>';
    box.innerHTML = '<div class="cg-stage mn-st">' + DEFS +
      '<div class="mn-bar"><span class="mn-pill m">' + MINI_MINE + '<b id="mnM">3</b></span><span class="mn-next"><b class="fit" id="mnNext"></b></span><span class="mn-pill g">' + MINI_GEM + '<b id="mnGc">22</b></span></div>' +
      '<div class="mn-wrap"><div class="mn-grid" id="mnGrid">' + tiles + '</div></div>' +
      '<div class="mn-pick" id="mnPick" hidden><div class="mn-pick-in"><b class="fit">' + K.esc(l.mines) + '</b><div class="mn-pick-g">' + pk + '</div></div></div></div>' +
      K.stakePanel(l.bet, '<div class="mn-opts"><button type="button" class="mn-st-b" data-d="-1" aria-label="−"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>' +
        '<button type="button" class="mn-cnt" id="mnCnt">' + MINI_MINE + '<span class="fit" id="mnCntT"></span><svg class="mn-car" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg></button>' +
        '<button type="button" class="mn-st-b" data-d="1" aria-label="+"><svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12"/></svg></button>' +
        '<button type="button" class="mn-rnd" id="mnRnd" disabled><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.4"/><circle cx="15" cy="15" r="1.4"/><circle cx="15" cy="9" r="1.4"/><circle cx="9" cy="15" r="1.4"/></svg><span class="fit">' + K.esc(l.rnd) + '</span></button></div>');
    K.bindStake(box);
    var btn = $('csGo'), grid = $('mnGrid'), tl = grid.querySelectorAll('.mn-t'), live = function () { return g && !g.done; };

    function setBtn(main, sub, cls) {
      if (!btn) return;
      btn.classList.remove('cash', 'wait');
      if (cls) btn.classList.add(cls);
      if (sub) { btn.innerHTML = '<span class="fit mn-b1"></span><span class="fit mn-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
      else { btn.innerHTML = '<span class="fit cg-gol"></span>'; K.setText(btn.firstChild, main); }
    }
    function info() {
      var m = live() ? g.m : mines, open = live() ? g.open.length : 0;
      K.setText($('mnM'), String(m)); K.setText($('mnGc'), String(25 - m - open));
      var nx = live() ? g.next : mm(mines, 1);
      K.setText($('mnNext'), nx ? l.next + ' ' + xm(nx) : '');
      K.setText($('mnCntT'), l.mines + ': ' + m);
      box.querySelectorAll('.mn-st-b, #mnCnt').forEach(function (b) { b.disabled = !!live(); });
      $('mnRnd').disabled = !live() || busy;
      grid.classList.toggle('on', !!live());
    }
    function reset() { tl.forEach(function (b) { b.className = 'mn-t'; b.firstChild.innerHTML = ''; }); grid.classList.remove('boom'); }
    function tile(b, kind, extra) { b.className = 'mn-t ' + kind + (extra ? ' ' + extra : ''); b.firstChild.innerHTML = (kind === 'gem' ? GEM + '<i class="mn-sp"></i>' : MINE + (extra && extra.indexOf('boom') >= 0 ? '<i class="mn-bl"></i>' : '')); }
    function paint(r) {
      g = r;
      var open = r.open || [];
      tl.forEach(function (b, c) {
        var isOpen = open.indexOf(c) >= 0;
        if (isOpen && b.className.indexOf('gem') < 0) tile(b, 'gem', 'new');
        else if (!isOpen && !r.done) { if (b.className !== 'mn-t') { b.className = 'mn-t'; b.firstChild.innerHTML = ''; } }
      });
      if (r.done) {
        var ms = r.mines || [];
        tl.forEach(function (b, c) {
          if (c === r.boom) tile(b, 'mine', 'boom');
          else if (ms.indexOf(c) >= 0) tile(b, 'mine', 'dim');
          else if (open.indexOf(c) < 0) tile(b, 'gem', 'dim');
        });
        if (r.boom != null && r.boom !== undefined) { grid.classList.remove('boom'); void grid.offsetWidth; grid.classList.add('boom'); }
        setBtn(l.bet);
        K.resultLine(box, r);
      } else if (open.length) setBtn(l.cash, money(r.stake * r.mult), 'cash');
      else setBtn(l.pick, '', 'wait');
      info();
    }
    function setMines(n) { if (live()) return; mines = Math.max(1, Math.min(24, n)); try { localStorage.setItem('cg_mines_n', String(mines)); } catch (e) { /* ignore */ } if (g && g.done) { g = null; reset(); } info(); }
    async function open(c) {
      if (busy) return;
      if (!live()) { if (K.guest()) { K.signup(); return; } if (btn) { btn.classList.remove('nudge'); void btn.offsetWidth; btn.classList.add('nudge'); } return; }
      if (g.open.indexOf(c) >= 0) return;
      busy = true; tl[c].classList.add('busy'); info();
      var r = await K.multi('mines', 'open', { cell: c });
      busy = false; if (!box.isConnected) return;
      tl[c].classList.remove('busy');
      if (r) paint(r); else info();
    }
    tl.forEach(function (b, c) { b.addEventListener('click', function () { open(c); }); });
    $('mnRnd').addEventListener('click', function () {
      if (!live()) return;
      var free = []; for (var c = 0; c < 25; c++) if (g.open.indexOf(c) < 0) free.push(c);
      if (free.length) open(free[Math.floor(Math.random() * free.length)]);
    });
    box.querySelectorAll('.mn-st-b').forEach(function (b) { b.addEventListener('click', function () { setMines(mines + +b.getAttribute('data-d')); }); });
    var pick = $('mnPick');
    $('mnCnt').addEventListener('click', function () {
      if (live()) return;
      pick.querySelectorAll('[data-n]').forEach(function (z) { z.classList.toggle('on', +z.getAttribute('data-n') === mines); });
      pick.hidden = false; K.fitAll(pick);
    });
    pick.addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (b) setMines(+b.getAttribute('data-n')); pick.hidden = true; });
    if (btn) btn.addEventListener('click', async function () {
      if (busy) return;
      if (live()) {
        if (!g.open.length) return;
        busy = true; var c = await K.multi('mines', 'cash'); busy = false;
        if (c && box.isConnected) paint(c); return;
      }
      busy = true; btn.disabled = true;
      var r = await K.multi('mines', 'start', { mines: mines });
      busy = false; btn.disabled = false;
      if (!r || !box.isConnected) return;
      reset(); if (r.m) mines = r.m;
      paint(r);
    });
    info(); setBtn(l.bet);
    K.multi('mines', 'state', null, true).then(function (r) { if (r && !r.done && box.isConnected) { mines = r.m || mines; paint(r); } });
  }, { rules: {
    en: '1. Choose how many mines hide in the 25 tiles (1 to 24) and your bet, then press Bet.\n2. Open tiles one by one: every gem raises the multiplier ("Next tile" shows the next one). A mine ends the round.\n3. Press Cash out at any time to collect bet × multiplier. More mines = bigger multipliers.',
    fr: '1. Choisis combien de mines se cachent dans les 25 cases (1 à 24) et ta mise, puis touche Miser.\n2. Ouvre les cases une à une : chaque gemme augmente le multiplicateur (« Case suivante » montre le prochain). Une mine termine la partie.\n3. Touche Encaisser quand tu veux pour gagner mise × multiplicateur. Plus de mines = plus gros multiplicateurs.',
    es: '1. Elige cuántas minas se esconden en las 25 casillas (1 a 24) y tu apuesta, luego pulsa Apostar.\n2. Abre casillas una a una: cada gema sube el multiplicador («Siguiente casilla» muestra el próximo). Una mina termina la ronda.\n3. Pulsa Retirar cuando quieras para cobrar apuesta × multiplicador. Más minas = multiplicadores más altos.',
    pt: '1. Escolha quantas minas se escondem nas 25 casas (1 a 24) e sua aposta, depois toque Apostar.\n2. Abra as casas uma a uma: cada gema aumenta o multiplicador («Próxima casa» mostra o próximo). Uma mina termina a rodada.\n3. Toque Sacar quando quiser para receber aposta × multiplicador. Mais minas = multiplicadores maiores.',
    ar: '1. اختر عدد الألغام المخفية في 25 مربعًا (من 1 إلى 24) ومبلغ رهانك، ثم اضغط راهن.\n2. افتح المربعات واحدًا تلو الآخر: كل جوهرة ترفع المضاعف («المربع التالي» يُظهر القادم). اللغم ينهي الجولة.\n3. اضغط اسحب في أي وقت لتربح الرهان × المضاعف. ألغام أكثر = مضاعفات أكبر.',
    tr: '1. 25 karede kaç mayın saklanacağını (1–24) ve bahsini seç, sonra Bahis\'e bas.\n2. Kareleri tek tek aç: her mücevher çarpanı artırır («Sonraki kare» bir sonrakini gösterir). Mayın turu bitirir.\n3. İstediğin an Çek\'e basarak bahis × çarpanı al. Daha çok mayın = daha büyük çarpan.',
    vi: '1. Chọn số mìn ẩn trong 25 ô (1 đến 24) và tiền cược, rồi bấm Cược.\n2. Mở từng ô: mỗi viên ngọc tăng hệ số («Ô tiếp theo» cho biết hệ số kế tiếp). Gặp mìn là thua ván.\n3. Bấm Rút tiền bất cứ lúc nào để nhận cược × hệ số. Nhiều mìn hơn = hệ số lớn hơn.',
    id: '1. Pilih berapa ranjau tersembunyi di 25 kotak (1 sampai 24) dan taruhanmu, lalu tekan Pasang.\n2. Buka kotak satu per satu: setiap permata menaikkan pengali («Kotak berikut» menunjukkan berikutnya). Ranjau mengakhiri ronde.\n3. Tekan Tarik kapan saja untuk menerima taruhan × pengali. Lebih banyak ranjau = pengali lebih besar.',
    ru: '1. Выбери, сколько мин спрятано в 25 клетках (от 1 до 24), и ставку, затем нажми «Ставка».\n2. Открывай клетки по одной: каждый кристалл повышает множитель («След. клетка» показывает следующий). Мина завершает раунд.\n3. Нажми «Забрать» в любой момент и получи ставку × множитель. Больше мин — больше множители.',
    de: '1. Wähle, wie viele Minen in den 25 Feldern liegen (1 bis 24), und deinen Einsatz, dann tippe auf Setzen.\n2. Öffne die Felder einzeln: jedes Juwel erhöht den Multiplikator („Nächstes Feld“ zeigt den nächsten). Eine Mine beendet die Runde.\n3. Tippe jederzeit auf Auszahlen und erhalte Einsatz × Multiplikator. Mehr Minen = höhere Multiplikatoren.',
    hi: '1. चुनें कि 25 टाइलों में कितनी माइंस छिपी हैं (1 से 24) और अपना दांव, फिर दांव दबाएँ।\n2. टाइलें एक-एक करके खोलें: हर रत्न मल्टीप्लायर बढ़ाता है («अगली टाइल» अगला दिखाती है)। माइन मिलते ही राउंड खत्म।\n3. कभी भी कैश आउट दबाएँ और दांव × मल्टीप्लायर पाएँ। ज़्यादा माइंस = बड़े मल्टीप्लायर।',
    zh: '1. 选择25个格子里藏多少颗地雷（1到24）和下注金额，然后点“下注”。\n2. 逐个翻开格子：每颗宝石都会提高倍数（“下一格”显示下一个倍数）。踩到地雷本局结束。\n3. 随时点“兑现”即可获得 下注 × 倍数。地雷越多，倍数越高。'
  } });
})(window.D6 = window.D6 || {});
