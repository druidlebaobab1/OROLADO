/* v2795 — Golden Orchard rebuilt (owner request): 1xGames / Evoplay "Apple of Fortune"-style — 10 rows of 5 apples climbed
   from the bottom, the multiplier ladder on the side, golden apple = up one row, rotten apple = round lost, difficulty =
   rotten apples per row (1 to 4), gold CASH OUT with the win. The server (casino_multi 'apple' start / pick / cash) draws the
   rotten apples and pays; this file only draws. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cash: 'Cash out', pick: 'Pick an apple', next: 'Next row' },
    fr: { bet: 'Miser', cash: 'Encaisser', pick: 'Choisis une pomme', next: 'Rangée suivante' },
    es: { bet: 'Apostar', cash: 'Retirar', pick: 'Elige una manzana', next: 'Siguiente fila' },
    pt: { bet: 'Apostar', cash: 'Sacar', pick: 'Escolha uma maçã', next: 'Próxima fila' },
    ar: { bet: 'راهن', cash: 'اسحب', pick: 'اختر تفاحة', next: 'الصف التالي' },
    tr: { bet: 'Bahis', cash: 'Çek', pick: 'Bir elma seç', next: 'Sonraki sıra' },
    vi: { bet: 'Cược', cash: 'Rút tiền', pick: 'Chọn một quả táo', next: 'Hàng tiếp theo' },
    id: { bet: 'Pasang', cash: 'Tarik', pick: 'Pilih apel', next: 'Baris berikut' },
    ru: { bet: 'Ставка', cash: 'Забрать', pick: 'Выбери яблоко', next: 'След. ряд' },
    de: { bet: 'Setzen', cash: 'Auszahlen', pick: 'Wähle einen Apfel', next: 'Nächste Reihe' },
    hi: { bet: 'दांव', cash: 'कैश आउट', pick: 'एक सेब चुनें', next: 'अगली पंक्ति' },
    zh: { bet: '下注', cash: '兑现', pick: '选择一个苹果', next: '下一排' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var ROWS = 10;
  function num(v) { v = Number(v); if (v >= 1e6) return (Math.floor(v / 1e4) / 100).toFixed(2).replace('.', K.dec()) + 'M'; if (v >= 1e4) return Math.floor(v / 1e3) + 'K'; return v >= 1000 ? String(Math.floor(v)) : v.toFixed(2).replace('.', K.dec()); }
  function money(v) { return '\u2066$\u00a0' + K.m2(v).replace('.', K.dec()) + '\u2069'; }
  function xm(v) { return '\u2066×' + num(v) + '\u2069'; } // ×1.25 reste dans le bon sens en arabe
  function mult(k, lv) { return k < 1 ? 0 : Math.floor(0.94 / Math.pow((5 - lv) / 5, k) * 100 + 1e-6) / 100; } // = casino_apple_mult
  var DEFS = '<svg class="ap-defs" width="0" height="0" aria-hidden="true"><defs>' +
    '<radialGradient id="apGold" cx="35%" cy="32%" r="75%"><stop offset="0" stop-color="#FEF9C3"/><stop offset=".35" stop-color="#FDE047"/><stop offset=".75" stop-color="#F59E0B"/><stop offset="1" stop-color="#B45309"/></radialGradient>' +
    '<radialGradient id="apRot" cx="38%" cy="34%" r="75%"><stop offset="0" stop-color="#A16207"/><stop offset=".55" stop-color="#6B3A1F"/><stop offset="1" stop-color="#3B1D12"/></radialGradient></defs></svg>';
  var BODY = 'M24 14c-4-3.4-13-3.8-15 5-1.8 8 3 18 9 20 2.4.8 4.4-.4 6-.4s3.6 1.2 6 .4c6-2 10.8-12 9-20-2-8.8-11-8.4-15-5z';
  var GOLD = '<svg class="ap-ico" viewBox="0 0 48 48" aria-hidden="true"><path d="' + BODY + '" fill="url(#apGold)" stroke="#92400E" stroke-width="1.2"/><path d="M24 14c0-4 1-7 3-9" stroke="#78350F" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
    '<path d="M26 9c3-3.5 8-3.5 10-2-2.5 3.5-6.5 4-10 2z" fill="#4ADE80" stroke="#15803D" stroke-width=".8"/><path d="M14 20c1-3 3.5-4.6 6-4.8" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".85"/><circle cx="33" cy="30" r="1.3" fill="#fff" opacity=".7"/></svg>';
  var ROT = '<svg class="ap-ico" viewBox="0 0 48 48" aria-hidden="true"><path d="' + BODY + '" fill="url(#apRot)" stroke="#2A140B" stroke-width="1.2"/><path d="M24 14c0-4-.6-6.6-2.4-8.6" stroke="#2A140B" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
    '<circle cx="18" cy="24" r="3.2" fill="#1C0E08"/><circle cx="29" cy="31" r="2.2" fill="#1C0E08"/><path d="M15.5 24.5c-3 1-4.5 4-3 6.5 1.4 2.4 4.6 1.5 4.2-1" stroke="#F0ABFC" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="16.6" cy="29.6" r=".9" fill="#3B0764"/>' +
    '<path d="M31 18c2 1 3 3 2.6 5" stroke="#84CC16" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".7"/></svg>';
  var MINI_ROT = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="' + BODY + '" fill="#8B5A2B"/><circle cx="18" cy="24" r="3.4" fill="#2A140B"/><path d="M15.5 24.5c-3 1-4.5 4-3 6.5" stroke="#F0ABFC" stroke-width="3" stroke-linecap="round" fill="none"/></svg>';

  K.register('apple', function (box) {
    var l = L(), g = null, busy = false, lv = 1;
    try { var sl = +localStorage.getItem('cg_apple_lv'); if (sl >= 1 && sl <= 4) lv = sl; } catch (e) { /* ignore */ }
    box.classList.add('cg-game', 'cg-apple');
    var rows = '';
    for (var r = ROWS - 1; r >= 0; r--) {
      rows += '<div class="ap-row" data-row="' + r + '"><span class="ap-m"><b class="fit"></b></span><div class="ap-cells">' +
        [0, 1, 2, 3, 4].map(function (c) { return '<button type="button" class="ap-c" data-c="' + c + '" aria-label="' + (c + 1) + '"><i class="ap-f"></i></button>'; }).join('') + '</div></div>';
    }
    var opts = [1, 2, 3, 4].map(function (n) { return '<button type="button" data-lv="' + n + '"><span class="ap-ol">' + MINI_ROT + '<b>' + n + '</b></span><small class="fit"></small></button>'; }).join('');
    box.innerHTML = '<div class="cg-stage ap-st">' + DEFS + '<div class="ap-bar"><b class="fit" id="apNext"></b></div>' +
      '<div class="ap-body"><div class="ap" id="apT">' + rows + '</div></div></div>' +
      K.stakePanel(l.bet, '<div class="cg-opts ap-opts" id="apLv">' + opts + '</div>');
    K.bindStake(box);
    var btn = $('csGo'), ap = $('apT'), rowEls = ap.querySelectorAll('.ap-row'), live = function () { return g && !g.done; };
    function rowOf(k) { return ap.querySelector('.ap-row[data-row="' + k + '"]'); }
    function setBtn(main, sub, cls) {
      if (!btn) return;
      btn.classList.remove('cash', 'wait');
      if (cls) btn.classList.add(cls);
      if (sub) { btn.innerHTML = '<span class="fit ap-b1"></span><span class="fit ap-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
      else { btn.innerHTML = ''; K.setText(btn, main); }
    }
    function ladder() {
      rowEls.forEach(function (row) { K.setText(row.querySelector('.ap-m b'), xm(mult(+row.getAttribute('data-row') + 1, lv))); });
      box.querySelectorAll('[data-lv]').forEach(function (b) {
        var n = +b.getAttribute('data-lv');
        b.classList.toggle('on', n === lv); b.disabled = !!live();
        K.setText(b.querySelector('small'), xm(mult(1, n)));
      });
    }
    function cell(b, kind, extra) { b.className = 'ap-c ' + kind + (extra ? ' ' + extra : ''); b.firstChild.innerHTML = kind === 'good' ? GOLD + '<i class="ap-sp"></i>' : ROT; }
    function reset() { rowEls.forEach(function (row) { row.className = 'ap-row'; row.querySelectorAll('.ap-c').forEach(function (b) { b.className = 'ap-c'; b.firstChild.innerHTML = ''; }); }); ap.classList.remove('boom'); }
    function paint(r) {
      var prevK = g && !g.done ? g.k : -1;
      g = r; if (r.lv && r.lv !== lv) { lv = r.lv; }
      ladder();
      var picks = r.picks || [];
      rowEls.forEach(function (row) {
        var k = +row.getAttribute('data-row');
        row.classList.toggle('cur', !r.done && k === r.k);
        row.classList.toggle('past', k < r.k);
        row.classList.toggle('up', !r.done && k > r.k);
        row.querySelectorAll('.ap-c').forEach(function (b, c) {
          if (k < r.k && picks[k] === c) { if (b.className.indexOf('good') < 0) cell(b, 'good', k >= prevK ? 'new' : ''); }
          else if (!r.done && b.className !== 'ap-c') { b.className = 'ap-c'; b.firstChild.innerHTML = ''; }
        });
      });
      if (r.done) {
        var bad = r.bad || [];
        rowEls.forEach(function (row) {
          var k = +row.getAttribute('data-row'), bk = [].concat(bad[k] || []);
          row.querySelectorAll('.ap-c').forEach(function (b, c) {
            var isBad = bk.indexOf(c) >= 0;
            if (k === r.boom && isBad && picks[k] === c) cell(b, 'rot', 'boom');
            else if (isBad) { if (b.className.indexOf('rot') < 0) cell(b, 'rot', 'dim'); }
            else if (b.className.indexOf('good') < 0) cell(b, 'good', 'dim');
          });
        });
        if (r.boom != null) { var br = rowOf(r.boom); if (br) br.classList.add('lost'); ap.classList.remove('boom'); void ap.offsetWidth; ap.classList.add('boom'); }
        else if (r.k > 0) { var wr = rowOf(r.k - 1); if (wr) wr.classList.add('won'); }
        setBtn(l.bet);
        K.resultLine(box, r);
      } else if (r.k) setBtn(l.cash, money(r.stake * r.mult), 'cash');
      else setBtn(l.pick, '', 'wait');
      info();
    }
    function info() {
      K.setText($('apNext'), live() ? (g.next ? l.next + ' ' + xm(g.next) : '') : l.next + ' ' + xm(mult(1, lv)));
      ap.classList.toggle('on', !!live());
    }
    async function pick(row, c) {
      if (busy) return;
      if (!live()) { if (K.guest()) { K.signup(); return; } if (btn) { btn.classList.remove('nudge'); void btn.offsetWidth; btn.classList.add('nudge'); } return; }
      if (row !== g.k) return;
      busy = true;
      var b = rowOf(row).querySelectorAll('.ap-c')[c]; b.classList.add('busy');
      var r = await K.multi('apple', 'pick', { cell: c });
      busy = false; if (!box.isConnected) return;
      b.classList.remove('busy');
      if (r) paint(r);
    }
    rowEls.forEach(function (row) {
      var k = +row.getAttribute('data-row');
      row.querySelectorAll('.ap-c').forEach(function (b, c) { b.addEventListener('click', function () { pick(k, c); }); });
    });
    box.querySelectorAll('[data-lv]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (live()) return;
        lv = +b.getAttribute('data-lv');
        try { localStorage.setItem('cg_apple_lv', String(lv)); } catch (e) { /* ignore */ }
        if (g && g.done) { g = null; reset(); }
        ladder(); info();
      });
    });
    if (btn) btn.addEventListener('click', async function () {
      if (busy) return;
      if (live()) {
        if (!g.k) return;
        busy = true; var c = await K.multi('apple', 'cash'); busy = false;
        if (c && box.isConnected) paint(c); return;
      }
      busy = true; btn.disabled = true;
      var r = await K.multi('apple', 'start', { level: lv });
      busy = false; btn.disabled = false;
      if (!r || !box.isConnected) return;
      reset(); g = null; paint(r);
    });
    ladder(); info(); setBtn(l.bet);
    K.multi('apple', 'state', null, true).then(function (r) { if (r && !r.done && box.isConnected) paint(r); });
  }, { rules: {
    en: '1. Choose the difficulty (1 to 4 rotten apples in each row of 5) and your bet, then press Bet.\n2. Climb the orchard from the bottom: pick one apple per row. A golden apple lifts you to the next row and a higher multiplier (ladder on the side); a rotten apple ends the round.\n3. Press Cash out at any time to collect bet × the multiplier of your last row.',
    fr: '1. Choisis la difficulté (1 à 4 pommes pourries sur chaque rangée de 5) et ta mise, puis touche Miser.\n2. Monte dans le verger depuis le bas : une pomme par rangée. Une pomme d’or te fait monter d’une rangée vers un plus gros multiplicateur (échelle sur le côté) ; une pomme pourrie termine la partie.\n3. Touche Encaisser quand tu veux pour gagner mise × multiplicateur de ta dernière rangée.',
    es: '1. Elige la dificultad (1 a 4 manzanas podridas en cada fila de 5) y tu apuesta, luego pulsa Apostar.\n2. Sube por el huerto desde abajo: una manzana por fila. Una manzana dorada te sube a la siguiente fila y a un multiplicador mayor (escala al lado); una podrida termina la ronda.\n3. Pulsa Retirar cuando quieras para cobrar apuesta × multiplicador de tu última fila.',
    pt: '1. Escolha a dificuldade (1 a 4 maçãs podres em cada fila de 5) e sua aposta, depois toque Apostar.\n2. Suba o pomar a partir de baixo: uma maçã por fila. Uma maçã dourada sobe você para a próxima fila e um multiplicador maior (escada ao lado); uma podre termina a rodada.\n3. Toque Sacar quando quiser para receber aposta × multiplicador da sua última fila.',
    ar: '1. اختر الصعوبة (من 1 إلى 4 تفاحات فاسدة في كل صف من 5) ومبلغ رهانك، ثم اضغط راهن.\n2. اصعد البستان من الأسفل: تفاحة واحدة في كل صف. التفاحة الذهبية ترفعك إلى الصف التالي ومضاعف أكبر (السلّم على الجانب)؛ والتفاحة الفاسدة تنهي الجولة.\n3. اضغط اسحب في أي وقت لتربح الرهان × مضاعف آخر صف وصلته.',
    tr: '1. Zorluğu (5\'lik her sırada 1 ila 4 çürük elma) ve bahsini seç, sonra Bahis\'e bas.\n2. Bahçeye alttan tırman: her sıradan bir elma seç. Altın elma seni bir üst sıraya ve daha büyük çarpana taşır (yanda merdiven); çürük elma turu bitirir.\n3. İstediğin an Çek\'e basarak bahis × son sıranın çarpanını al.',
    vi: '1. Chọn độ khó (1 đến 4 quả táo thối trong mỗi hàng 5 quả) và tiền cược, rồi bấm Cược.\n2. Leo vườn táo từ dưới lên: mỗi hàng chọn một quả. Táo vàng đưa bạn lên hàng tiếp theo với hệ số cao hơn (thang bên cạnh); táo thối kết thúc ván.\n3. Bấm Rút tiền bất cứ lúc nào để nhận cược × hệ số của hàng cuối cùng.',
    id: '1. Pilih tingkat kesulitan (1 sampai 4 apel busuk di setiap baris berisi 5) dan taruhanmu, lalu tekan Pasang.\n2. Naiki kebun dari bawah: pilih satu apel per baris. Apel emas menaikkanmu ke baris berikut dan pengali lebih besar (tangga di samping); apel busuk mengakhiri ronde.\n3. Tekan Tarik kapan saja untuk menerima taruhan × pengali baris terakhirmu.',
    ru: '1. Выбери сложность (от 1 до 4 гнилых яблок в каждом ряду из 5) и ставку, затем нажми «Ставка».\n2. Поднимайся по саду снизу: одно яблоко в ряду. Золотое яблоко поднимает на следующий ряд и к большему множителю (лестница сбоку); гнилое завершает раунд.\n3. Нажми «Забрать» в любой момент и получи ставку × множитель последнего ряда.',
    de: '1. Wähle die Schwierigkeit (1 bis 4 faule Äpfel in jeder 5er-Reihe) und deinen Einsatz, dann tippe auf Setzen.\n2. Klettere von unten durch den Obstgarten: ein Apfel pro Reihe. Ein goldener Apfel bringt dich eine Reihe höher zu einem größeren Multiplikator (Leiter an der Seite); ein fauler beendet die Runde.\n3. Tippe jederzeit auf Auszahlen und erhalte Einsatz × Multiplikator deiner letzten Reihe.',
    hi: '1. कठिनाई चुनें (5 की हर पंक्ति में 1 से 4 सड़े सेब) और अपना दांव, फिर दांव दबाएँ।\n2. बगीचे में नीचे से ऊपर चढ़ें: हर पंक्ति में एक सेब चुनें। सुनहरा सेब आपको अगली पंक्ति और बड़े मल्टीप्लायर पर ले जाता है (किनारे पर सीढ़ी); सड़ा सेब राउंड खत्म करता है।\n3. कभी भी कैश आउट दबाएँ और दांव × आखिरी पंक्ति का मल्टीप्लायर पाएँ।',
    zh: '1. 选择难度（每排5个苹果中有1到4个烂苹果）和下注金额，然后点“下注”。\n2. 从底部往上爬：每排选一个苹果。金苹果让你升到下一排、获得更高倍数（倍数梯在旁边）；烂苹果则本局结束。\n3. 随时点“兑现”即可获得 下注 × 最后一排的倍数。'
  } });
})(window.D6 = window.D6 || {});
