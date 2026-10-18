/* v2795 — Target (limbo) rebuilt (owner request): Spribe / Stake Limbo-style — choose a target multiplier (input, − / +,
   quick ×1.5 ×2 ×5 ×10 ×100), win chance shown, a big number races up to the server result, green when it reaches the target.
   Server: K.play('limbo', {target}) → view {res, t}. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', target: 'Target', chance: 'Win chance', win: 'Win' },
    fr: { bet: 'Miser', target: 'Cible', chance: 'Chance', win: 'Gain' },
    es: { bet: 'Apostar', target: 'Objetivo', chance: 'Probabilidad', win: 'Ganancia' },
    pt: { bet: 'Apostar', target: 'Alvo', chance: 'Chance', win: 'Ganho' },
    ar: { bet: 'راهن', target: 'الهدف', chance: 'فرصة الفوز', win: 'الربح' },
    tr: { bet: 'Bahis', target: 'Hedef', chance: 'Şans', win: 'Kazanç' },
    vi: { bet: 'Cược', target: 'Mục tiêu', chance: 'Cơ hội', win: 'Thắng' },
    id: { bet: 'Pasang', target: 'Target', chance: 'Peluang', win: 'Menang' },
    ru: { bet: 'Ставка', target: 'Цель', chance: 'Шанс', win: 'Выигрыш' },
    de: { bet: 'Setzen', target: 'Ziel', chance: 'Chance', win: 'Gewinn' },
    hi: { bet: 'दांव', target: 'लक्ष्य', chance: 'मौका', win: 'जीत' },
    zh: { bet: '下注', target: '目标', chance: '胜率', win: '赢取' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var HIST = [];
  var SET = { t: 2 };
  var QUICK = [1.5, 2, 5, 10, 100];
  function nf(v, d) { return Number(v).toFixed(d).replace('.', K.dec()); }
  function big(v) { // ×1.00 … ×1 000 000 (2 décimales sous 10 000)
    if (v >= 10000) return Math.floor(v).toLocaleString('en-US').replace(/,/g, ' ');
    return nf(Math.floor(v * 100 + 1e-6) / 100, 2);
  }
  function stepT(t, up) { var s = t < 2 ? 0.1 : t < 10 ? 0.5 : t < 100 ? 5 : 50; return Math.round((up ? t + s : t - s) * 100) / 100; }

  K.register('limbo', function (box, x) {
    var l = L(), busy = false;
    box.classList.add('cg-game', 'cg-limbo');
    box.innerHTML = '<div class="cg-stage lb-stage">' +
        '<div class="cg-hist lb-hist" id="lbHist"></div>' +
        '<div class="lb-core"><i class="lb-ring r1"></i><i class="lb-ring r2"></i><i class="lb-planet"></i>' +
          '<div class="lb-num"><b class="fit" id="lbNum"><span>1' + K.dec() + '00</span><em>×</em></b></div>' +
        '</div>' +
      '</div>' +
      K.stakePanel(l.bet,
        '<div class="lb-row">' +
          '<div class="lb-cell lb-tg"><small class="fit">' + K.esc(l.target) + '</small><div class="lb-in">' +
            '<button type="button" class="lb-st" data-d="-1" aria-label="−"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>' +
            '<label><em>×</em><input id="lbT" inputmode="decimal" autocomplete="off" aria-label="' + K.esc(l.target) + '"></label>' +
            '<button type="button" class="lb-st" data-d="1" aria-label="+"><svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12"/></svg></button></div></div>' +
          '<div class="lb-cell"><small class="fit">' + K.esc(l.chance) + '</small><b class="fit" id="lbCh"></b></div>' +
          '<div class="lb-cell"><small class="fit">' + K.esc(l.win) + '</small><b class="fit lb-pay" id="lbPay"></b></div>' +
        '</div>' +
        '<div class="lb-quick">' + QUICK.map(function (q) { return '<button type="button" data-q="' + q + '">×' + nf(q, q % 1 ? 1 : 0) + '</button>'; }).join('') + '</div>');
    K.bindStake(box);
    var inp = $('lbT'), num = $('lbNum'), core = box.querySelector('.lb-core');

    function paint() {
      inp.value = nf(SET.t, 2);
      K.setText($('lbCh'), nf(Math.floor(94 / SET.t * 100) / 100, 2) + ' %');
      K.setText($('lbPay'), '$ ' + K.m2(K.S.stake * SET.t));
      box.querySelectorAll('.lb-quick [data-q]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-q') === SET.t); });
    }
    function setT(v) { if (busy) return; v = Math.round((Number(String(v).replace(',', '.')) || 2) * 100) / 100; SET.t = Math.max(1.01, Math.min(1000, v)); paint(); }
    inp.addEventListener('change', function () { setT(inp.value); });
    inp.addEventListener('focus', function () { try { inp.select(); } catch (e) { /* ignore */ } });
    box.querySelectorAll('.lb-st').forEach(function (b) { b.addEventListener('click', function () { setT(stepT(SET.t, b.getAttribute('data-d') === '1')); }); });
    box.querySelectorAll('.lb-quick [data-q]').forEach(function (b) { b.addEventListener('click', function () { setT(+b.getAttribute('data-q')); }); });
    box.addEventListener('stake', paint);
    function show(v, cls) { num.className = 'fit ' + (cls || ''); num.firstChild.textContent = big(v); K.fitEl(num); }
    function paintHist() {
      $('lbHist').innerHTML = HIST.slice(0, 14).map(function (h) { return '<i class="' + (h[1] ? 'w' : 'l') + '">' + big(h[0]) + '×</i>'; }).join('');
    }

    $('csGo').addEventListener('click', async function () {
      if (busy) return;
      if (document.activeElement === inp) setT(inp.value);
      busy = true; var go = $('csGo'); go.disabled = true; box.classList.add('running'); core.classList.remove('w', 'l');
      var r = await K.play('limbo', { target: SET.t });
      if (!r || !box.isConnected) { busy = false; go.disabled = false; box.classList.remove('running'); return; }
      var res = Number(r.view.res), win = r.win > 0;
      var lite = document.documentElement.classList.contains('oro-lite');
      var dur = lite ? 250 : Math.min(1100, 380 + Math.log(res) * 160), lnR = Math.log(res), t0 = performance.now();
      await new Promise(function (done) {
        (function step(now) {
          if (!box.isConnected) return done();
          var k = Math.min(1, (now - t0) / dur), v = Math.exp(lnR * K.easeOut(k));
          show(v, v >= SET.t ? 'w' : '');
          if (k < 1) K.S.raf = requestAnimationFrame(step); else done();
        })(t0);
      });
      if (!box.isConnected) return;
      show(res, win ? 'w' : 'l'); core.classList.add(win ? 'w' : 'l');
      HIST.unshift([res, win]); if (HIST.length > 30) HIST.length = 30; paintHist();
      K.resultLine(box, r);
      busy = false; go.disabled = false; box.classList.remove('running');
    });
    paint(); paintHist();
    if (HIST.length) { show(HIST[0][0], HIST[0][1] ? 'w' : 'l'); core.classList.add(HIST[0][1] ? 'w' : 'l'); }
  }, { rules: {
    en: '1. Choose your target multiplier (×1.01 to ×1000): type it, use − / + or tap ×1.5, ×2, ×5, ×10, ×100. The win chance updates (94 ÷ target).\n2. Tap “Bet”: a number races up and stops on the drawn multiplier.\n3. If it reaches your target you win stake × target. Higher target = rarer but bigger.',
    fr: '1. Choisis ta cible (×1,01 à ×1000) : tape-la, utilise − / + ou touche ×1,5, ×2, ×5, ×10, ×100. La chance de gain s’affiche (94 ÷ cible).\n2. Touche « Miser » : un nombre monte et s’arrête sur le multiplicateur tiré.\n3. S’il atteint ta cible, tu gagnes mise × cible. Cible haute = plus rare mais plus gros.',
    es: '1. Elige tu objetivo (×1,01 a ×1000): escríbelo, usa − / + o toca ×1,5, ×2, ×5, ×10, ×100. Se muestra la probabilidad (94 ÷ objetivo).\n2. Toca «Apostar»: un número sube y se detiene en el multiplicador sorteado.\n3. Si alcanza tu objetivo ganas apuesta × objetivo. Objetivo alto = más raro pero mayor.',
    pt: '1. Escolha o alvo (×1,01 a ×1000): digite, use − / + ou toque em ×1,5, ×2, ×5, ×10, ×100. A chance aparece (94 ÷ alvo).\n2. Toque em «Apostar»: um número sobe e para no multiplicador sorteado.\n3. Se atingir o alvo, você ganha aposta × alvo. Alvo alto = mais raro, porém maior.',
    ar: '1. اختر الهدف (من ×1.01 إلى ×1000): اكتبه أو استخدم − / + أو اضغط ×1.5، ×2، ×5، ×10، ×100. تظهر فرصة الفوز (94 ÷ الهدف).\n2. اضغط «راهن»: يرتفع رقم ويتوقف عند المضاعف المسحوب.\n3. إذا بلغ هدفك تربح الرهان × الهدف. هدف أعلى = أندر لكن أكبر.',
    tr: '1. Hedef çarpanı seç (×1,01 – ×1000): yaz, − / + kullan ya da ×1,5, ×2, ×5, ×10, ×100’e dokun. Kazanma şansı görünür (94 ÷ hedef).\n2. «Bahis»e dokun: bir sayı yükselir ve çekilen çarpanda durur.\n3. Hedefine ulaşırsa bahis × hedef kazanırsın. Yüksek hedef = daha nadir ama daha büyük.',
    vi: '1. Chọn mục tiêu (×1,01 đến ×1000): gõ số, dùng − / + hoặc chạm ×1,5, ×2, ×5, ×10, ×100. Cơ hội thắng hiện ra (94 ÷ mục tiêu).\n2. Chạm «Cược»: một con số tăng nhanh và dừng ở hệ số được quay.\n3. Nếu đạt mục tiêu, bạn thắng tiền cược × mục tiêu. Mục tiêu cao = hiếm hơn nhưng lớn hơn.',
    id: '1. Pilih target (×1,01 sampai ×1000): ketik, pakai − / + atau ketuk ×1,5, ×2, ×5, ×10, ×100. Peluang menang tampil (94 ÷ target).\n2. Ketuk «Pasang»: angka naik cepat lalu berhenti di pengganda yang diundi.\n3. Jika mencapai target, kamu menang taruhan × target. Target tinggi = lebih jarang tapi lebih besar.',
    ru: '1. Выберите цель (от ×1,01 до ×1000): введите, нажмите − / + или ×1,5, ×2, ×5, ×10, ×100. Показан шанс выигрыша (94 ÷ цель).\n2. Нажмите «Ставка»: число растёт и останавливается на выпавшем множителе.\n3. Если оно достигло цели, вы выигрываете ставку × цель. Выше цель — реже, но крупнее.',
    de: '1. Wähle dein Ziel (×1,01 bis ×1000): eintippen, − / + nutzen oder ×1,5, ×2, ×5, ×10, ×100 antippen. Die Gewinnchance wird angezeigt (94 ÷ Ziel).\n2. Tippe auf „Setzen“: Eine Zahl steigt und stoppt beim gezogenen Multiplikator.\n3. Erreicht sie dein Ziel, gewinnst du Einsatz × Ziel. Höheres Ziel = seltener, aber größer.',
    hi: '1. अपना लक्ष्य चुनें (×1.01 से ×1000): लिखें, − / + दबाएँ या ×1.5, ×2, ×5, ×10, ×100 दबाएँ। जीत का मौका दिखता है (94 ÷ लक्ष्य)।\n2. «दांव» दबाएँ: एक संख्या तेज़ी से बढ़ती है और निकले गुणक पर रुकती है।\n3. लक्ष्य तक पहुँचे तो आप दांव × लक्ष्य जीतते हैं। ऊँचा लक्ष्य = दुर्लभ पर बड़ा।',
    zh: '1. 选择目标倍数（×1.01 到 ×1000）：输入、用 − / + 或点 ×1.5、×2、×5、×10、×100。显示胜率（94 ÷ 目标）。\n2. 点「下注」：数字快速上升，停在开出的倍数。\n3. 达到目标即赢得 下注 × 目标。目标越高越难中，奖金越大。'
  } });
})(window.D6 = window.D6 || {});
