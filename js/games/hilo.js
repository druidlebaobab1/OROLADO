/* v2795 — Hi-Lo rebuilt (owner request): Spribe Hi-Lo-style — deck + current card, “Higher or same” / “Lower or same” with live
   multipliers and chances, Skip, card history row, cash out any time after a right guess.
   Server: K.multi('hilo', 'start' | 'guess' {hi} | 'skip' | 'cash' | 'state'). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cash: 'Cash out', hi: 'Higher or same', lo: 'Lower or same', higher: 'Higher', lower: 'Lower', same: 'Same', skip: 'Skip' },
    fr: { bet: 'Miser', cash: 'Encaisser', hi: 'Plus haut ou égal', lo: 'Plus bas ou égal', higher: 'Plus haut', lower: 'Plus bas', same: 'Égal', skip: 'Passer' },
    es: { bet: 'Apostar', cash: 'Retirar', hi: 'Mayor o igual', lo: 'Menor o igual', higher: 'Mayor', lower: 'Menor', same: 'Igual', skip: 'Saltar' },
    pt: { bet: 'Apostar', cash: 'Sacar', hi: 'Maior ou igual', lo: 'Menor ou igual', higher: 'Maior', lower: 'Menor', same: 'Igual', skip: 'Pular' },
    ar: { bet: 'راهن', cash: 'اسحب', hi: 'أعلى أو يساوي', lo: 'أقل أو يساوي', higher: 'أعلى', lower: 'أقل', same: 'مساوٍ', skip: 'تخطَّ' },
    tr: { bet: 'Bahis', cash: 'Bozdur', hi: 'Yüksek veya eşit', lo: 'Düşük veya eşit', higher: 'Yüksek', lower: 'Düşük', same: 'Eşit', skip: 'Geç' },
    vi: { bet: 'Cược', cash: 'Rút tiền', hi: 'Cao hơn hoặc bằng', lo: 'Thấp hơn hoặc bằng', higher: 'Cao hơn', lower: 'Thấp hơn', same: 'Bằng', skip: 'Bỏ qua' },
    id: { bet: 'Pasang', cash: 'Tarik', hi: 'Lebih tinggi/sama', lo: 'Lebih rendah/sama', higher: 'Lebih tinggi', lower: 'Lebih rendah', same: 'Sama', skip: 'Lewati' },
    ru: { bet: 'Ставка', cash: 'Забрать', hi: 'Выше или равно', lo: 'Ниже или равно', higher: 'Выше', lower: 'Ниже', same: 'Равно', skip: 'Пропустить' },
    de: { bet: 'Setzen', cash: 'Auszahlen', hi: 'Höher oder gleich', lo: 'Niedriger oder gleich', higher: 'Höher', lower: 'Niedriger', same: 'Gleich', skip: 'Überspringen' },
    hi: { bet: 'दांव', cash: 'कैश आउट', hi: 'ऊँचा या बराबर', lo: 'नीचा या बराबर', higher: 'ऊँचा', lower: 'नीचा', same: 'बराबर', skip: 'छोड़ें' },
    zh: { bet: '下注', cash: '兑现', hi: '更高或相同', lo: '更低或相同', higher: '更高', lower: '更低', same: '相同', skip: '跳过' }
  };
  // tailles relatives à la scène (comme des unités de conteneur, mais fiables partout) : --cqw / --cqh = 1 % de la largeur / hauteur
  function cq(el) {
    if (!el) return;
    var f = function () { if (!el.isConnected) return; el.style.setProperty('--cqw', (el.clientWidth / 100).toFixed(2) + 'px'); el.style.setProperty('--cqh', (el.clientHeight / 100).toFixed(2) + 'px'); };
    f(); requestAnimationFrame(f);
    if (window.ResizeObserver) new ResizeObserver(f).observe(el); else window.addEventListener('resize', f);
  }
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var SUIT = ['♠', '♥', '♦', '♣'];
  var LAST = { card: 0, cards: [], dirs: {} }; // dernière partie (dessin quand on revient)
  function nf(v, d) { return Number(v).toFixed(d).replace('.', K.dec()); }
  function suitOf(i, c) { return Math.floor(K.seeded(i + 1, c * 7 + 3) * 4) % 4; }
  function face(c, i) {
    var s = suitOf(i, c), red = s === 1 || s === 2;
    return '<span class="hl-f ' + (red ? 'red' : 'blk') + '"><b class="hl-tl">' + RANK[c] + '<i>' + SUIT[s] + '</i></b><em>' + SUIT[s] + '</em><b class="hl-br">' + RANK[c] + '<i>' + SUIT[s] + '</i></b></span>';
  }
  function mini(c, i) { var s = suitOf(i, c); return '<span class="hl-f ' + (s === 1 || s === 2 ? 'red' : 'blk') + '"><b>' + RANK[c] + '</b><em>' + SUIT[s] + '</em></span>'; }
  // le grand bouton a une taille de police « !important » (cg.css) : on le rétrécit nous-mêmes, en « important » aussi
  function fitGo(el) {
    if (!el || !el.isConnected) return;
    el.style.removeProperty('font-size');
    var fs = parseFloat(getComputedStyle(el).fontSize) || 20, min = fs * 0.5, n = 0;
    while (el.scrollWidth > el.clientWidth + 1 && fs > min && n++ < 30) { fs *= 0.93; el.style.setProperty('font-size', fs.toFixed(1) + 'px', 'important'); }
  }
  window.addEventListener('resize', function () { setTimeout(function () { if (document.querySelector('.cg-hilo')) fitGo($('csGo')); }, 200); });
  function back() { return '<span class="hl-bk"><i></i></span>'; }

  K.register('hilo', function (box, x) {
    var l = L(), g = null, busy = false, dirs = {};
    box.classList.add('cg-game', 'cg-hilo');
    box.innerHTML = '<div class="cg-stage hl-stage">' +
        '<div class="hl-row" id="hlRow"></div>' +
        '<div class="hl-table">' +
          '<div class="hl-deck">' + back() + back() + back() + '</div>' +
          '<div class="hl-cur"><div class="hl-card" id="hlCard">' + back() + '</div></div>' +
          '<button type="button" class="hl-skip" id="hlSkip" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6l7 6-7 6zM13 6l7 6-7 6z"/></svg><small class="fit">' + K.esc(l.skip) + '</small></button>' +
        '</div>' +
        '<div class="hl-tot"><b class="fit" id="hlTot">×1' + K.dec() + '00</b></div>' +
      '</div>' +
      K.stakePanel(l.bet, '<div class="hl-btns">' +
        '<button type="button" class="hl-b hi" id="hlHi" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5l7 9H5z"/></svg><span><b class="fit" id="hlHiL"></b><small class="fit" id="hlHiM"></small></span></button>' +
        '<button type="button" class="hl-b lo" id="hlLo" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19l7-9H5z"/></svg><span><b class="fit" id="hlLoL"></b><small class="fit" id="hlLoM"></small></span></button>' +
      '</div>');
    K.bindStake(box); cq(box.querySelector('.hl-stage')); cq(box.querySelector('.hl-table'));
    var go = $('csGo'), card = $('hlCard');

    function live() { return g && !g.done; }
    function paintRow(r) {
      var cs = r.cards || [], sk = r.sk || [], n = cs.length, html = '';
      for (var i = Math.max(0, n - 1 - 12); i < n - 1; i++) {
        var tag = i === 0 ? '' : sk.indexOf(i) >= 0 ? '<i class="sk">»</i>' : '<i class="ok">' + (dirs[i] === 'lo' ? '▼' : dirs[i] === 'hi' ? '▲' : '✓') + '</i>';
        html = '<span class="hl-mini">' + mini(cs[i], i) + tag + '</span>' + html;
      }
      $('hlRow').innerHTML = html;
    }
    function paintButtons() {
      var on = live() && !busy, c = on ? g.card : 0;
      var hiOk = on && g.hiMult >= 1.01, loOk = on && g.loMult >= 1.01;
      K.setText($('hlHiL'), c === 13 ? l.same : c === 1 ? l.higher : l.hi);
      K.setText($('hlLoL'), c === 1 ? l.same : c === 13 ? l.lower : l.lo);
      K.setText($('hlHiM'), hiOk ? '×' + nf(g.hiMult, 2) + ' · ' + nf((14 - c) / 13 * 100, 1) + ' %' : '—');
      K.setText($('hlLoM'), loOk ? '×' + nf(g.loMult, 2) + ' · ' + nf(c / 13 * 100, 1) + ' %' : '—');
      $('hlHi').disabled = !hiOk; $('hlLo').disabled = !loOk;
      $('hlSkip').disabled = !on || (g.sk || []).length >= 30;
      if (live()) {
        go.classList.add('cash'); go.disabled = busy || !(g.k > 0);
        K.setText(go, g.k > 0 ? l.cash + ' $ ' + K.m2(g.stake * g.mult) : l.cash);
      } else { go.classList.remove('cash'); go.disabled = busy; K.setText(go, l.bet); }
      fitGo(go);
      box.classList.toggle('in-play', !!live());
    }
    function paintTot() { var m = g ? g.mult : 1; K.setText($('hlTot'), '×' + nf(m, 2)); $('hlTot').parentNode.classList.toggle('up', !!(g && g.k > 0 && !(g.done && !(g.win > 0)))); }
    function paint(r) {
      g = r; LAST.card = r.card; LAST.cards = r.cards; LAST.dirs = dirs; LAST.sk = r.sk; LAST.lost = r.done && !(r.win > 0);
      card.innerHTML = face(r.card, (r.cards || []).length - 1);
      card.classList.toggle('lost', !!(r.done && !(r.win > 0)));
      paintRow(r); paintTot(); paintButtons();
    }
    // la carte se retourne (dos → face) : rotation sur Y, transform seulement
    async function flipTo(r) {
      var lite = document.documentElement.classList.contains('oro-lite');
      if (card.animate && !lite) {
        var a = card.animate([{ transform: 'rotateY(0)' }, { transform: 'rotateY(90deg)' }], { duration: 160, easing: 'ease-in' });
        await a.finished.catch(function () {});
        if (!box.isConnected) return;
        paint(r);
        card.animate([{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0)' }], { duration: 200, easing: 'ease-out' });
        await K.sleep(200);
      } else paint(r);
    }
    async function act(a, p) {
      if (busy) return;
      busy = true; paintButtons();
      var r = await K.multi('hilo', a, p);
      if (!box.isConnected) return;
      if (!r) { busy = false; paintButtons(); return; }
      if (a === 'guess') dirs[(r.cards || []).length - 1] = p.hi ? 'hi' : 'lo';
      if (a === 'start') dirs = {};
      if (a === 'cash') { g = r; paintTot(); }
      else await flipTo(r);
      if (!box.isConnected) return;
      g = r; busy = false;
      if (r.done) { paintRow(r); K.resultLine(box, r); }
      paintButtons();
    }
    $('hlHi').addEventListener('click', function () { if (live()) act('guess', { hi: 1 }); });
    $('hlLo').addEventListener('click', function () { if (live()) act('guess', { hi: 0 }); });
    $('hlSkip').addEventListener('click', function () { if (live()) act('skip'); });
    go.addEventListener('click', function () { if (live()) { if (g.k > 0) act('cash'); } else act('start'); });

    // dessin de départ : dernière carte vue, puis reprise d'une partie ouverte
    if (LAST.card) {
      dirs = LAST.dirs || {};
      card.innerHTML = face(LAST.card, LAST.cards.length - 1); card.classList.toggle('lost', !!LAST.lost);
      paintRow({ cards: LAST.cards, sk: LAST.sk || [] });
    }
    paintButtons();
    K.multi('hilo', 'state', null, true).then(function (r) { if (r && !r.done && box.isConnected && !g) { dirs = LAST.dirs || {}; paint(r); } });
  }, { rules: {
    en: '1. Tap “Bet”: a card is dealt (A is the lowest, K the highest).\n2. Guess if the next card is “Higher or same” or “Lower or same”: each button shows its multiplier and chance. Every right guess multiplies your win. “Skip” changes the card for free.\n3. Cash out whenever you want after a right guess. A wrong guess loses the stake.',
    fr: '1. Touche « Miser » : une carte est donnée (l’As est la plus basse, le Roi la plus haute).\n2. Devine si la suivante sera « Plus haut ou égal » ou « Plus bas ou égal » : chaque bouton montre son multiplicateur et sa chance. Chaque bonne réponse multiplie ton gain. « Passer » change la carte gratuitement.\n3. Encaisse quand tu veux après une bonne réponse. Une erreur = mise perdue.',
    es: '1. Toca «Apostar»: se reparte una carta (el As es la más baja, la K la más alta).\n2. Adivina si la siguiente será «Mayor o igual» o «Menor o igual»: cada botón muestra su multiplicador y su probabilidad. Cada acierto multiplica tu ganancia. «Saltar» cambia la carta gratis.\n3. Retira cuando quieras tras un acierto. Un fallo pierde la apuesta.',
    pt: '1. Toque em «Apostar»: uma carta é dada (o Ás é a mais baixa, o Rei a mais alta).\n2. Adivinhe se a próxima será «Maior ou igual» ou «Menor ou igual»: cada botão mostra o multiplicador e a chance. Cada acerto multiplica o ganho. «Pular» troca a carta de graça.\n3. Saque quando quiser após um acerto. Um erro perde a aposta.',
    ar: '1. اضغط «راهن»: تُوزَّع ورقة (الآس الأدنى والملك الأعلى).\n2. خمّن هل الورقة التالية «أعلى أو يساوي» أو «أقل أو يساوي»: كل زر يعرض مضاعفه وفرصته. كل تخمين صحيح يضاعف ربحك. «تخطَّ» تغيّر الورقة مجانًا.\n3. اسحب متى شئت بعد تخمين صحيح. التخمين الخاطئ يخسر الرهان.',
    tr: '1. «Bahis»e dokun: bir kart açılır (As en düşük, Papaz en yüksek).\n2. Sonraki kartın «Yüksek veya eşit» mi «Düşük veya eşit» mi olacağını tahmin et: her düğme çarpanını ve şansını gösterir. Her doğru tahmin kazancını katlar. «Geç» kartı ücretsiz değiştirir.\n3. Doğru tahminden sonra istediğin an bozdur. Yanlış tahmin bahsi kaybettirir.',
    vi: '1. Chạm «Cược»: một lá bài được chia (A thấp nhất, K cao nhất).\n2. Đoán lá tiếp theo «Cao hơn hoặc bằng» hay «Thấp hơn hoặc bằng»: mỗi nút hiện hệ số và cơ hội. Mỗi lần đoán đúng nhân tiền thắng. «Bỏ qua» đổi lá miễn phí.\n3. Rút tiền bất cứ lúc nào sau một lần đoán đúng. Đoán sai mất tiền cược.',
    id: '1. Ketuk «Pasang»: satu kartu dibagikan (As terendah, K tertinggi).\n2. Tebak kartu berikutnya «Lebih tinggi/sama» atau «Lebih rendah/sama»: tiap tombol menampilkan pengganda dan peluangnya. Tiap tebakan benar melipatgandakan kemenangan. «Lewati» mengganti kartu gratis.\n3. Tarik kapan saja setelah tebakan benar. Tebakan salah kehilangan taruhan.',
    ru: '1. Нажмите «Ставка»: сдаётся карта (туз — самая младшая, король — самая старшая).\n2. Угадайте, будет ли следующая «Выше или равно» или «Ниже или равно»: на каждой кнопке её множитель и шанс. Каждая верная догадка умножает выигрыш. «Пропустить» бесплатно меняет карту.\n3. Забирайте выигрыш когда хотите после верной догадки. Ошибка — ставка проиграна.',
    de: '1. Tippe auf „Setzen“: Eine Karte wird ausgeteilt (Ass ist die niedrigste, König die höchste).\n2. Rate, ob die nächste „Höher oder gleich“ oder „Niedriger oder gleich“ ist: Jeder Knopf zeigt Multiplikator und Chance. Jeder Treffer multipliziert deinen Gewinn. „Überspringen“ tauscht die Karte gratis.\n3. Zahl dir nach einem Treffer jederzeit aus. Ein Fehler kostet den Einsatz.',
    hi: '1. «दांव» दबाएँ: एक पत्ता बँटता है (इक्का सबसे छोटा, बादशाह सबसे बड़ा)।\n2. अनुमान लगाएँ कि अगला पत्ता «ऊँचा या बराबर» होगा या «नीचा या बराबर»: हर बटन पर गुणक और मौका दिखता है। हर सही अनुमान जीत को गुणा करता है। «छोड़ें» पत्ता मुफ़्त में बदलता है।\n3. सही अनुमान के बाद जब चाहें कैश आउट करें। गलत अनुमान पर दांव हारते हैं।',
    zh: '1. 点「下注」：发一张牌（A 最小，K 最大）。\n2. 猜下一张是「更高或相同」还是「更低或相同」：每个按钮显示倍数和胜率。每猜对一次，奖金就翻倍增长。「跳过」可免费换牌。\n3. 猜对后随时可以兑现。猜错则输掉下注。'
  } });
})(window.D6 = window.D6 || {});
