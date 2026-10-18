/* v2795 — Oro Lotto rebuilt (owner request): Spribe Keno-style — 40 numbers, pick 1 to 10 (dice = random, bin = clear),
   the payout table for the current pick count lights up live while 10 balls leave the lottery globe one by one and roll
   into the tube. Tap the button again during the draw to finish it at once. Server table CASINO_LOTTO unchanged (RTP 94 %). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', pick: 'Pick 1 to 10 numbers' }, fr: { bet: 'Miser', pick: 'Choisis 1 à 10 numéros' }, es: { bet: 'Apostar', pick: 'Elige de 1 a 10 números' },
    pt: { bet: 'Apostar', pick: 'Escolha de 1 a 10 números' }, ar: { bet: 'راهن', pick: 'اختر من 1 إلى 10 أرقام' }, tr: { bet: 'Bahis', pick: '1 ile 10 arası sayı seç' },
    vi: { bet: 'Đặt cược', pick: 'Chọn từ 1 đến 10 số' }, id: { bet: 'Pasang', pick: 'Pilih 1 sampai 10 angka' }, ru: { bet: 'Ставка', pick: 'Выбери от 1 до 10 чисел' },
    de: { bet: 'Setzen', pick: 'Wähle 1 bis 10 Zahlen' }, hi: { bet: 'दांव', pick: '1 से 10 नंबर चुनें' }, zh: { bet: '投注', pick: '选择 1 到 10 个号码' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  // EXACTEMENT la table du serveur (casino_lib.php CASINO_LOTTO) : [k][bons numéros] = gain ÷ mise
  var LOTTO = { 1: [0, 3.76], 2: [0, 1.45, 6.61], 3: [0, 0, 4.25, 29.5], 4: [0, 0, 2.07, 8.03, 78],
    5: [0, 0, 0, 5.92, 32.1, 422], 6: [0, 0, 0, 3.24, 12.3, 90.8, 1000], 7: [0, 0, 0, 2.07, 6.09, 31.4, 309, 1000],
    8: [0, 0, 0, 0, 5.56, 22.1, 153, 1000, 1000], 9: [0, 0, 0, 0, 3.39, 10.9, 58.4, 546, 1000, 1000],
    10: [0, 0, 0, 0, 2.35, 6.36, 27.5, 198, 1000, 1000, 1000] };
  var N = 40, MAXK = 10, DRAW = 10;
  function mx(v) { return '×' + String(v).replace('.', K.dec()); }
  var DICE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="8.5" cy="8.5" r="1.6"/><circle cx="15.5" cy="15.5" r="1.6"/><circle cx="15.5" cy="8.5" r="1.6"/><circle cx="8.5" cy="15.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/></svg>';
  var BIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>';

  K.register('lotto', function (box) {
    var l = L(), lite = document.documentElement.classList.contains('oro-lite');
    box.classList.add('cg-game', 'cg-lotto');
    var cells = ''; for (var i = 1; i <= N; i++) cells += '<button type="button" class="lo-n" data-n="' + i + '"><span>' + i + '</span></button>';
    var slots = ''; for (var s = 0; s < DRAW; s++) slots += '<i class="lo-slot"></i>';
    var mini = ''; for (var b = 0; b < 9; b++) mini += '<i style="--k:' + b + '"></i>';
    box.innerHTML = '<div class="cg-stage"><div class="lo-top"><div class="lo-mach" dir="ltr"><div class="lo-globe" id="loGlobe">' + mini + '</div><div class="lo-tube" id="loTube">' + slots + '</div></div>' +
      '<div class="lo-pay" id="loPay" dir="ltr"></div></div><div class="lo-grid" id="loGrid" dir="ltr">' + cells + '</div></div>' +
      K.stakePanel(l.bet, '<div class="lo-tools"><button type="button" class="lo-ib" id="loRand" aria-label="random">' + DICE + '</button><b class="lo-k" id="loK"></b><button type="button" class="lo-ib" id="loClr" aria-label="clear">' + BIN + '</button></div>');
    K.bindStake(box);
    var grid = $('loGrid'), tube = $('loTube'), pay = $('loPay'), go = $('csGo'), globe = $('loGlobe');
    var picks = [], busy = false, skip = false, drawn = false;
    function cellOf(n) { return grid.querySelector('[data-n="' + n + '"]'); }
    function paintPay(hits, done) {
      var k = picks.length;
      if (!k) { pay.innerHTML = '<b class="lo-hint fit">' + K.esc(l.pick) + '</b>'; K.fitAll(pay); return; }
      var row = LOTTO[k], h = '';
      for (var j = 0; j < row.length; j++) {
        if (!(row[j] > 0)) continue;
        var cls = hits === j ? (done ? 'on win' : 'on') : (hits > j ? 'past' : '');
        h += '<span class="lo-pc ' + cls + '"><em class="fit">' + j + '</em><b class="fit">' + mx(row[j]) + '</b></span>';
      }
      pay.innerHTML = h; K.fitAll(pay);
    }
    function clearDraw() {
      drawn = false;
      tube.querySelectorAll('.lo-slot').forEach(function (t) { t.innerHTML = ''; });
      grid.querySelectorAll('.lo-n').forEach(function (c) { c.classList.remove('hit', 'dr'); });
    }
    function paint() {
      grid.querySelectorAll('.lo-n').forEach(function (c) { c.classList.toggle('pk', picks.indexOf(+c.getAttribute('data-n')) >= 0); });
      K.setText($('loK'), picks.length + '/' + MAXK);
      grid.classList.toggle('full', picks.length >= MAXK);
      paintPay(-1);
    }
    grid.addEventListener('click', function (e) {
      var c = e.target.closest('.lo-n'); if (!c || busy) return;
      if (drawn) clearDraw();
      var n = +c.getAttribute('data-n'), i = picks.indexOf(n);
      if (i >= 0) picks.splice(i, 1); else if (picks.length < MAXK) picks.push(n); else { nudge($('loK')); return; }
      paint();
    });
    function nudge(el) { el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); }
    $('loClr').addEventListener('click', function () { if (busy) return; picks = []; clearDraw(); paint(); });
    $('loRand').addEventListener('click', function () {
      if (busy) return;
      var k = picks.length || 5, all = []; for (var i = 1; i <= N; i++) all.push(i);
      for (var j = N - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), t = all[j]; all[j] = all[r]; all[r] = t; }
      picks = all.slice(0, k).sort(function (a, b) { return a - b; }); clearDraw(); paint();
      if (!lite) grid.querySelectorAll('.lo-n.pk').forEach(function (c, i) { c.style.animationDelay = (i * 40) + 'ms'; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); });
    });
    paint();

    go.addEventListener('click', async function () {
      if (busy) { skip = true; return; }
      if (!picks.length) { nudge(pay); return; }
      busy = true; skip = false; clearDraw(); paint();
      go.classList.add('wait');
      var r = await K.play('lotto', { picks: picks.slice() });
      if (!r || !box.isConnected) { busy = false; go.classList.remove('wait'); return; }
      globe.classList.add('mix');
      var sl = tube.querySelectorAll('.lo-slot'), hits = 0, gr = globe.getBoundingClientRect();
      for (var i = 0; i < r.view.draw.length; i++) {
        if (!box.isConnected) return;
        var n = r.view.draw[i], hit = picks.indexOf(n) >= 0, c = cellOf(n);
        var sr = sl[i].getBoundingClientRect();
        var ball = document.createElement('b');
        ball.className = 'lo-ball ' + (hit ? 'h' : 'm') + (skip || lite ? '' : ' fly');
        ball.textContent = n;
        ball.style.setProperty('--dx', (gr.left + gr.width / 2 - (sr.left + sr.width / 2)).toFixed(0) + 'px');
        ball.style.setProperty('--dy', (gr.top + gr.height / 2 - (sr.top + sr.height / 2)).toFixed(0) + 'px');
        sl[i].appendChild(ball);
        if (!skip && !lite) await K.sleep(330);
        if (hit) hits++;
        if (c) c.classList.add(hit ? 'hit' : 'dr');
        paintPay(hits, false);
        if (!skip) await K.sleep(lite ? 90 : 170);
      }
      globe.classList.remove('mix');
      drawn = true;
      paintPay(r.view.hits, true);
      K.resultLine(box, r);
      busy = false; go.classList.remove('wait');
    });
  }, {
    rules: {
      en: '1. Tap 1 to 10 numbers on the grid (dice = random pick, bin = clear).\n2. Choose your stake and tap “Bet”: 10 balls are drawn out of 40, one by one.\n3. The table above the grid shows what you win for each number of hits with your pick count (up to ×1000). It lights up live during the draw.',
      fr: '1. Touche 1 à 10 numéros sur la grille (dé = choix au hasard, poubelle = tout effacer).\n2. Choisis ta mise et touche « Miser » : 10 boules sont tirées sur 40, une par une.\n3. Le tableau au-dessus de la grille montre le gain pour chaque nombre de bons numéros (jusqu’à ×1000). Il s’allume en direct pendant le tirage.',
      es: '1. Toca de 1 a 10 números en la cuadrícula (dado = al azar, papelera = borrar).\n2. Elige tu apuesta y toca «Apostar»: se sacan 10 bolas de 40, una por una.\n3. La tabla sobre la cuadrícula muestra lo que ganas según tus aciertos (hasta ×1000). Se ilumina en directo durante el sorteo.',
      pt: '1. Toque de 1 a 10 números na grade (dado = aleatório, lixeira = limpar).\n2. Escolha a aposta e toque em «Apostar»: 10 bolas são sorteadas de 40, uma a uma.\n3. A tabela acima da grade mostra o ganho para cada número de acertos (até ×1000). Ela acende ao vivo durante o sorteio.',
      ar: '1. اضغط من 1 إلى 10 أرقام في الشبكة (النرد = اختيار عشوائي، السلة = مسح).\n2. اختر رهانك واضغط «راهن»: تُسحب 10 كرات من 40 واحدة تلو الأخرى.\n3. الجدول فوق الشبكة يبيّن ربحك حسب عدد الأرقام الصحيحة (حتى ×1000)، ويضيء مباشرة أثناء السحب.',
      tr: '1. Tablodan 1 ile 10 arası sayıya dokun (zar = rastgele, çöp kutusu = temizle).\n2. Bahsini seç ve «Bahis»e dokun: 40 toptan 10 tanesi tek tek çekilir.\n3. Tablonun üstündeki çizelge, isabet sayısına göre kazancını gösterir (×1000’e kadar). Çekiliş sırasında canlı yanar.',
      vi: '1. Chạm 1 đến 10 số trên bảng (xúc xắc = chọn ngẫu nhiên, thùng rác = xóa).\n2. Chọn mức cược rồi chạm «Đặt cược»: 10 quả bóng được rút từ 40, từng quả một.\n3. Bảng phía trên cho biết tiền thắng theo số lần trúng (tới ×1000). Bảng sáng lên trực tiếp khi quay.',
      id: '1. Ketuk 1 sampai 10 angka di papan (dadu = acak, tempat sampah = hapus).\n2. Pilih taruhan lalu ketuk «Pasang»: 10 bola ditarik dari 40, satu per satu.\n3. Tabel di atas papan menunjukkan kemenangan untuk tiap jumlah angka yang kena (hingga ×1000). Tabel menyala langsung saat undian.',
      ru: '1. Нажми от 1 до 10 чисел на поле (кубик = случайный выбор, корзина = очистить).\n2. Выбери ставку и нажми «Ставка»: из 40 по одному выпадают 10 шаров.\n3. Таблица над полем показывает выигрыш за каждое число совпадений (до ×1000). Она подсвечивается прямо во время тиража.',
      de: '1. Tippe 1 bis 10 Zahlen im Feld an (Würfel = Zufallswahl, Papierkorb = löschen).\n2. Wähle deinen Einsatz und tippe auf „Setzen“: 10 von 40 Kugeln werden nacheinander gezogen.\n3. Die Tabelle über dem Feld zeigt den Gewinn je Trefferzahl (bis ×1000). Sie leuchtet live während der Ziehung.',
      hi: '1. ग्रिड पर 1 से 10 नंबर छुएँ (पासा = रैंडम, डिब्बा = साफ़ करें)।\n2. अपना दांव चुनें और «दांव» दबाएँ: 40 में से 10 गेंदें एक-एक करके निकलती हैं।\n3. ग्रिड के ऊपर की तालिका हर सही नंबर की गिनती पर जीत दिखाती है (×1000 तक)। ड्रॉ के दौरान यह लाइव चमकती है।',
      zh: '1. 在号码盘上选 1 到 10 个号码（骰子 = 随机选号，垃圾桶 = 清除）。\n2. 选择投注额，点击“投注”：从 40 个球中逐个摇出 10 个。\n3. 号码盘上方的表格显示每种命中数量的奖金（最高 ×1000），开奖时实时点亮。'
    }
  });
})(window.D6 = window.D6 || {});
