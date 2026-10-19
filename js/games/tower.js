/* v2795 — Tower rebuilt (owner request): BGaming / Evoplay-style climb — 8 floors from the bottom to the top, the multiplier
   of every floor on the side, pick one of 3 hatches per floor (1 hides a black hole), trap reveal, gold CASH OUT with the win.
   The server (casino_multi 'tower' start / pick / cash) draws the traps and pays; this file only draws. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cash: 'Cash out', pick: 'Pick a door', next: 'Next floor' },
    fr: { bet: 'Miser', cash: 'Encaisser', pick: 'Choisis une porte', next: 'Étage suivant' },
    es: { bet: 'Apostar', cash: 'Retirar', pick: 'Elige una puerta', next: 'Siguiente piso' },
    pt: { bet: 'Apostar', cash: 'Sacar', pick: 'Escolha uma porta', next: 'Próximo andar' },
    ar: { bet: 'راهن', cash: 'اسحب', pick: 'اختر بابًا', next: 'الطابق التالي' },
    tr: { bet: 'Bahis', cash: 'Çek', pick: 'Bir kapı seç', next: 'Sonraki kat' },
    vi: { bet: 'Cược', cash: 'Rút tiền', pick: 'Chọn một cửa', next: 'Tầng tiếp theo' },
    id: { bet: 'Pasang', cash: 'Tarik', pick: 'Pilih pintu', next: 'Lantai berikut' },
    ru: { bet: 'Ставка', cash: 'Забрать', pick: 'Выбери дверь', next: 'След. этаж' },
    de: { bet: 'Setzen', cash: 'Auszahlen', pick: 'Wähle eine Tür', next: 'Nächste Etage' },
    hi: { bet: 'दांव', cash: 'कैश आउट', pick: 'एक दरवाज़ा चुनें', next: 'अगली मंज़िल' },
    zh: { bet: '下注', cash: '兑现', pick: '选择一扇门', next: '下一层' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var ROWS = 8;
  function num(v) { return Number(v).toFixed(2).replace('.', K.dec()); }
  function money(v) { return '\u2066$\u00a0' + K.m2(v).replace('.', K.dec()) + '\u2069'; }
  function xm(v) { return '\u2066×' + num(v) + '\u2069'; } // ×1.25 reste dans le bon sens en arabe
  function mult(k) { return k < 1 ? 0 : Math.floor(0.94 / Math.pow(2 / 3, k) * 100 + 1e-6) / 100; } // = casino_tower_mult
  var STAR = '<svg class="tw-ico" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17" fill="#FBBF24" opacity=".22"/><path d="M24 7l4.9 10.4 11.4 1.4-8.4 7.8 2.2 11.3L24 32.3l-10.1 5.6 2.2-11.3-8.4-7.8 11.4-1.4z" fill="#FDE047" stroke="#B45309" stroke-width="1.6" stroke-linejoin="round"/><path d="M19 17.5l3-5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".85"/></svg>';
  var HOLE = '<svg class="tw-ico" viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="24" rx="20" ry="8" fill="none" stroke="#FB7185" stroke-width="2.4" opacity=".8" transform="rotate(-18 24 24)"/><circle cx="24" cy="24" r="10.5" fill="#05020F" stroke="#F43F5E" stroke-width="2"/><path d="M6.5 30A20 8 -18 0 0 41.5 18" fill="none" stroke="#FDA4AF" stroke-width="2.4" transform="rotate(0)"/><circle cx="20" cy="22" r="1.8" fill="#F43F5E"/><circle cx="28" cy="22" r="1.8" fill="#F43F5E"/></svg>';

  K.register('tower', function (box) {
    var l = L(), g = null, busy = false;
    box.classList.add('cg-game', 'cg-tower');
    var rows = '';
    for (var r = ROWS - 1; r >= 0; r--) {
      rows += '<div class="tw-row" data-row="' + r + '"><span class="tw-m"><b class="fit">' + xm(mult(r + 1)) + '</b></span><div class="tw-doors">' +
        [0, 1, 2].map(function (c) { return '<button type="button" class="tw-d" data-c="' + c + '" aria-label="' + (c + 1) + '"><i class="tw-f"></i></button>'; }).join('') + '</div></div>';
    }
    box.innerHTML = '<div class="cg-stage tw-st"><div class="tw-bar"><b class="fit" id="twNext"></b></div>' +
      '<div class="tw-body"><i class="tw-top" aria-hidden="true"></i><div class="tw" id="twT">' + rows + '</div><i class="tw-base" aria-hidden="true"></i></div></div>' +
      K.stakePanel(l.bet);
    K.bindStake(box);
    var btn = $('csGo'), tw = $('twT'), rowEls = tw.querySelectorAll('.tw-row'), live = function () { return g && !g.done; };
    function rowOf(k) { return tw.querySelector('.tw-row[data-row="' + k + '"]'); }
    function setBtn(main, sub, cls) {
      if (!btn) return;
      btn.classList.remove('cash', 'wait');
      if (cls) btn.classList.add(cls);
      if (sub) { btn.innerHTML = '<span class="fit tw-b1"></span><span class="fit tw-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
      else { btn.innerHTML = '<span class="fit cg-gol"></span>'; K.setText(btn.firstChild, main); }
    }
    function door(b, kind, extra) { b.className = 'tw-d ' + kind + (extra ? ' ' + extra : ''); b.firstChild.innerHTML = kind === 'good' ? STAR : HOLE; }
    function reset() { rowEls.forEach(function (row) { row.className = 'tw-row'; row.querySelectorAll('.tw-d').forEach(function (b) { b.className = 'tw-d'; b.firstChild.innerHTML = ''; }); }); tw.classList.remove('boom'); }
    function paint(r) {
      var prevK = g && !g.done ? g.k : -1;
      g = r;
      var picks = r.picks || [];
      rowEls.forEach(function (row) {
        var k = +row.getAttribute('data-row');
        row.classList.toggle('cur', !r.done && k === r.k);
        row.classList.toggle('past', k < r.k);
        row.classList.toggle('up', !r.done && k > r.k);
        row.querySelectorAll('.tw-d').forEach(function (b, c) {
          if (k < r.k && picks[k] === c) { if (b.className.indexOf('good') < 0) door(b, 'good', k >= prevK ? 'new' : ''); }
          else if (!r.done && b.className !== 'tw-d') { b.className = 'tw-d'; b.firstChild.innerHTML = ''; }
        });
      });
      if (r.done) {
        var traps = r.traps || [];
        rowEls.forEach(function (row) {
          var k = +row.getAttribute('data-row');
          row.querySelectorAll('.tw-d').forEach(function (b, c) {
            if (k === r.boom && c === traps[k]) door(b, 'trap', 'boom');
            else if (traps[k] === c && b.className.indexOf('trap') < 0) door(b, 'trap', 'dim');
          });
        });
        if (r.boom != null) { var br = rowOf(r.boom); if (br) br.classList.add('lost'); tw.classList.remove('boom'); void tw.offsetWidth; tw.classList.add('boom'); }
        else if (r.k > 0) { var wr = rowOf(r.k - 1); if (wr) wr.classList.add('won'); }
        setBtn(l.bet);
        K.resultLine(box, r);
      } else if (r.k) setBtn(l.cash, money(r.stake * r.mult), 'cash');
      else setBtn(l.pick, '', 'wait');
      info();
    }
    function info() {
      K.setText($('twNext'), live() ? (g.next ? l.next + ' ' + xm(g.next) : '') : l.next + ' ' + xm(mult(1)));
      tw.classList.toggle('on', !!live());
    }
    async function pick(row, c) {
      if (busy) return;
      if (!live()) { if (K.guest()) { K.signup(); return; } if (btn) { btn.classList.remove('nudge'); void btn.offsetWidth; btn.classList.add('nudge'); } return; }
      if (row !== g.k) return;
      busy = true;
      var b = rowOf(row).querySelectorAll('.tw-d')[c]; b.classList.add('busy');
      var r = await K.multi('tower', 'pick', { door: c });
      busy = false; if (!box.isConnected) return;
      b.classList.remove('busy');
      if (r) paint(r);
    }
    rowEls.forEach(function (row) {
      var k = +row.getAttribute('data-row');
      row.querySelectorAll('.tw-d').forEach(function (b, c) { b.addEventListener('click', function () { pick(k, c); }); });
    });
    if (btn) btn.addEventListener('click', async function () {
      if (busy) return;
      if (live()) {
        if (!g.k) return;
        busy = true; var c = await K.multi('tower', 'cash'); busy = false;
        if (c && box.isConnected) paint(c); return;
      }
      busy = true; btn.disabled = true;
      var r = await K.multi('tower', 'start');
      busy = false; btn.disabled = false;
      if (!r || !box.isConnected) return;
      reset(); g = null; paint(r);
    });
    info(); setBtn(l.bet);
    K.multi('tower', 'state', null, true).then(function (r) { if (r && !r.done && box.isConnected) paint(r); });
  }, { rules: {
    en: '1. Choose your bet and press Bet: you start at the bottom of the tower.\n2. On each floor pick 1 of the 3 doors. 2 hide a star and lift you one floor up (the multiplier of every floor is shown on the side); 1 hides a black hole that ends the round.\n3. Press Cash out at any time to collect bet × the multiplier of the floor reached. Reach the 8th floor for ×24.09.',
    fr: '1. Choisis ta mise et touche Miser : tu pars du bas de la tour.\n2. À chaque étage, choisis 1 des 3 portes. 2 cachent une étoile et te font monter d’un étage (le multiplicateur de chaque étage est affiché sur le côté) ; 1 cache un trou noir qui termine la partie.\n3. Touche Encaisser quand tu veux pour gagner mise × multiplicateur de l’étage atteint. Le 8e étage paie ×24,09.',
    es: '1. Elige tu apuesta y pulsa Apostar: empiezas abajo de la torre.\n2. En cada piso elige 1 de las 3 puertas. 2 esconden una estrella y te suben un piso (el multiplicador de cada piso se ve al lado); 1 esconde un agujero negro que termina la ronda.\n3. Pulsa Retirar cuando quieras para cobrar apuesta × multiplicador del piso alcanzado. El piso 8 paga ×24,09.',
    pt: '1. Escolha sua aposta e toque Apostar: você começa na base da torre.\n2. Em cada andar escolha 1 das 3 portas. 2 escondem uma estrela e sobem você um andar (o multiplicador de cada andar aparece ao lado); 1 esconde um buraco negro que termina a rodada.\n3. Toque Sacar quando quiser para receber aposta × multiplicador do andar alcançado. O 8º andar paga ×24,09.',
    ar: '1. اختر رهانك واضغط راهن: تبدأ من أسفل البرج.\n2. في كل طابق اختر بابًا من 3. خلف بابين نجمة ترفعك طابقًا (مضاعف كل طابق ظاهر على الجانب)؛ وخلف باب واحد ثقب أسود ينهي الجولة.\n3. اضغط اسحب في أي وقت لتربح الرهان × مضاعف الطابق الذي وصلته. الطابق الثامن يدفع ×24.09.',
    tr: '1. Bahsini seç ve Bahis\'e bas: kulenin en altından başlarsın.\n2. Her katta 3 kapıdan birini seç. 2 kapıda yıldız var, seni bir kat çıkarır (her katın çarpanı yanda yazar); 1 kapıda turu bitiren kara delik var.\n3. İstediğin an Çek\'e basarak bahis × ulaştığın katın çarpanını al. 8. kat ×24,09 öder.',
    vi: '1. Chọn tiền cược và bấm Cược: bạn bắt đầu ở chân tháp.\n2. Mỗi tầng chọn 1 trong 3 cửa. 2 cửa có ngôi sao đưa bạn lên một tầng (hệ số mỗi tầng hiện ở bên cạnh); 1 cửa có hố đen kết thúc ván.\n3. Bấm Rút tiền bất cứ lúc nào để nhận cược × hệ số tầng đã lên. Tầng 8 trả ×24,09.',
    id: '1. Pilih taruhanmu dan tekan Pasang: kamu mulai dari dasar menara.\n2. Di setiap lantai pilih 1 dari 3 pintu. 2 pintu berisi bintang yang menaikkanmu satu lantai (pengali tiap lantai tertulis di samping); 1 berisi lubang hitam yang mengakhiri ronde.\n3. Tekan Tarik kapan saja untuk menerima taruhan × pengali lantai yang dicapai. Lantai 8 membayar ×24,09.',
    ru: '1. Выбери ставку и нажми «Ставка»: ты начинаешь внизу башни.\n2. На каждом этаже выбери 1 из 3 дверей. За 2 — звезда, она поднимает на этаж выше (множитель каждого этажа указан сбоку); за 1 — чёрная дыра, раунд окончен.\n3. Нажми «Забрать» в любой момент и получи ставку × множитель достигнутого этажа. 8-й этаж платит ×24,09.',
    de: '1. Wähle deinen Einsatz und tippe auf Setzen: du startest unten im Turm.\n2. Wähle auf jeder Etage 1 von 3 Türen. Hinter 2 liegt ein Stern, der dich eine Etage höher bringt (der Multiplikator jeder Etage steht daneben); hinter 1 ein Schwarzes Loch, das die Runde beendet.\n3. Tippe jederzeit auf Auszahlen und erhalte Einsatz × Multiplikator der erreichten Etage. Die 8. Etage zahlt ×24,09.',
    hi: '1. अपना दांव चुनें और दांव दबाएँ: आप टावर के नीचे से शुरू करते हैं।\n2. हर मंज़िल पर 3 में से 1 दरवाज़ा चुनें। 2 के पीछे तारा है जो आपको एक मंज़िल ऊपर ले जाता है (हर मंज़िल का मल्टीप्लायर किनारे पर दिखता है); 1 के पीछे ब्लैक होल है जो राउंड खत्म करता है।\n3. कभी भी कैश आउट दबाएँ और दांव × पहुँची मंज़िल का मल्टीप्लायर पाएँ। 8वीं मंज़िल ×24.09 देती है।',
    zh: '1. 选择下注金额并点“下注”：你从塔底开始。\n2. 每层在3扇门中选1扇。2扇门后是星星，让你上升一层（每层的倍数显示在旁边）；1扇门后是黑洞，本局结束。\n3. 随时点“兑现”即可获得 下注 × 所到楼层的倍数。第8层赔付×24.09。'
  } });
})(window.D6 = window.D6 || {});
