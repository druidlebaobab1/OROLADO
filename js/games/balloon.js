/* v2795 — Balloon rebuilt (owner request): SmartSoft "Balloon"-style — press or HOLD the pump, the balloon grows with a rising
   multiplier, cash out before it pops. The server (casino_multi 'balloon' start / pump / cash) decides secretly at start after
   how many pumps the balloon pops and pays; this file only draws. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cash: 'Cash out', pump: 'Pump', hold: 'Hold to pump', next: 'Next', popped: 'Popped!' },
    fr: { bet: 'Miser', cash: 'Encaisser', pump: 'Gonfler', hold: 'Maintiens pour gonfler', next: 'Suivant', popped: 'Éclaté !' },
    es: { bet: 'Apostar', cash: 'Retirar', pump: 'Inflar', hold: 'Mantén para inflar', next: 'Siguiente', popped: '¡Explotó!' },
    pt: { bet: 'Apostar', cash: 'Sacar', pump: 'Encher', hold: 'Segure para encher', next: 'Próximo', popped: 'Estourou!' },
    ar: { bet: 'راهن', cash: 'اسحب', pump: 'انفخ', hold: 'اضغط باستمرار للنفخ', next: 'التالي', popped: 'انفجر!' },
    tr: { bet: 'Bahis', cash: 'Çek', pump: 'Şişir', hold: 'Şişirmek için basılı tut', next: 'Sonraki', popped: 'Patladı!' },
    vi: { bet: 'Cược', cash: 'Rút tiền', pump: 'Bơm', hold: 'Giữ để bơm', next: 'Tiếp theo', popped: 'Nổ rồi!' },
    id: { bet: 'Pasang', cash: 'Tarik', pump: 'Pompa', hold: 'Tahan untuk memompa', next: 'Berikut', popped: 'Meletus!' },
    ru: { bet: 'Ставка', cash: 'Забрать', pump: 'Накачать', hold: 'Держи, чтобы качать', next: 'Далее', popped: 'Лопнул!' },
    de: { bet: 'Setzen', cash: 'Auszahlen', pump: 'Pumpen', hold: 'Halten zum Pumpen', next: 'Nächster', popped: 'Geplatzt!' },
    hi: { bet: 'दांव', cash: 'कैश आउट', pump: 'पंप', hold: 'पंप के लिए दबाए रखें', next: 'अगला', popped: 'फट गया!' },
    zh: { bet: '下注', cash: '兑现', pump: '充气', hold: '按住充气', next: '下一个', popped: '爆了！' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function num(v) { return Number(v).toFixed(2).replace('.', K.dec()); }
  function money(v) { return '$ ' + K.m2(v).replace('.', K.dec()); }
  function mult(k) { return k < 1 ? 0 : Math.floor(0.94 / Math.pow(0.9, k) * 100 + 1e-6) / 100; } // = casino_balloon_mult
  function size(k) { return 0.42 + 0.58 * (1 - Math.exp(-k / 9)); }
  var BALLOON = '<svg viewBox="0 0 100 132" aria-hidden="true"><defs><radialGradient id="blBody" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#FFF3C4"/><stop offset=".22" stop-color="#FCD34D"/><stop offset=".62" stop-color="#F59E0B"/><stop offset="1" stop-color="#9A3412"/></radialGradient>' +
    '<radialGradient id="blRim" cx="50%" cy="50%" r="50%"><stop offset=".8" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#FDE68A" stop-opacity=".5"/></radialGradient></defs>' +
    '<path d="M50 3C75 3 94 22 94 48c0 30-25 52-41 58h-6C31 100 6 78 6 48 6 22 25 3 50 3z" fill="url(#blBody)"/><path d="M50 3C75 3 94 22 94 48c0 30-25 52-41 58h-6C31 100 6 78 6 48 6 22 25 3 50 3z" fill="url(#blRim)"/>' +
    '<path d="M24 30c5-11 14-17 24-18" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".75"/><ellipse cx="23" cy="47" rx="4.5" ry="8" fill="#fff" opacity=".35"/>' +
    '<path d="M50 20l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" fill="#fff" opacity=".22"/>' +
    '<path d="M44 106h12l-2 6h-8z" fill="#B45309"/><path d="M47 112h6v20h-6z" fill="#7C2D12"/></svg>';
  var PUMP = '<svg class="bl-pump" viewBox="0 0 80 60" aria-hidden="true"><g class="bl-h"><rect x="22" y="2" width="36" height="7" rx="3.5" fill="#FBBF24"/><rect x="37" y="8" width="6" height="18" fill="#C4B5FD"/></g>' +
    '<rect x="28" y="22" width="24" height="30" rx="5" fill="#6D5BD0"/><rect x="28" y="22" width="9" height="30" rx="4" fill="#fff" opacity=".18"/><rect x="18" y="50" width="44" height="8" rx="4" fill="#3B2F7A"/><path d="M28 30h24M28 38h24" stroke="#4C3D9E" stroke-width="2"/></svg>';

  K.register('balloon', function (box) {
    var l = L(), g = null, busy = false, holding = false, wantCash = false, hist = [];
    try { hist = JSON.parse(localStorage.getItem('cg_balloon_h') || '[]').slice(0, 12); } catch (e) { hist = []; }
    box.classList.add('cg-game', 'cg-balloon');
    var shards = ''; for (var i = 0; i < 10; i++) shards += '<i style="--a:' + (i * 36) + 'deg"></i>';
    box.innerHTML = '<div class="cg-stage bl-st"><div class="cg-hist bl-hist" id="blHist"></div>' +
      '<div class="bl-sky" id="blSky"><i class="bl-planet" aria-hidden="true"></i>' +
        '<div class="bl-mul"><b class="fit" id="blM">×1' + K.dec() + '00</b><small class="fit" id="blNext"></small></div>' +
        '<div class="bl-anchor"><div class="bl-wob" id="blWob"><div class="bl-ball" id="blBall">' + BALLOON + '</div></div><div class="bl-burst" id="blBurst">' + shards + '</div></div>' +
        '<div class="bl-base">' + PUMP + '</div></div></div>' +
      K.stakePanel(l.bet, '<div class="bl-opts"><button type="button" class="bl-pb" id="blPump"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11M7 9l5 5 5-5"/><path d="M5 20h14"/></svg><span class="fit" id="blPumpT"></span></button></div>');
    K.bindStake(box);
    var btn = $('csGo'), pumpB = $('blPump'), ball = $('blBall'), wob = $('blWob'), sky = $('blSky'), live = function () { return g && !g.done; };
    function setBtn(main, sub, cls) {
      if (!btn) return;
      btn.classList.remove('cash', 'wait');
      if (cls) btn.classList.add(cls);
      if (sub) { btn.innerHTML = '<span class="fit bl-b1"></span><span class="fit bl-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
      else { btn.innerHTML = ''; K.setText(btn, main); }
    }
    function paintHist() {
      $('blHist').innerHTML = hist.map(function (h) { return '<i class="' + (h < 0 ? 'pop' : h >= 5 ? 'hi' : h >= 2 ? 'mid' : 'lo') + '">×' + num(Math.abs(h)) + '</i>'; }).join('');
    }
    function grow(k) { ball.style.transform = 'scale(' + size(k).toFixed(3) + ')'; }
    function paint(r, pumped) {
      g = r;
      var k = r.k || 0;
      sky.classList.remove('won', 'lost');
      if (r.done) {
        holding = false;
        var popped = !(r.win > 0);
        if (popped) {
          K.setText($('blM'), l.popped);
          sky.classList.add('lost'); ball.classList.add('pop');
          var bu = $('blBurst'); bu.classList.remove('go'); void bu.offsetWidth; bu.classList.add('go');
          hist.unshift(-mult(k + 1));
        } else {
          K.setText($('blM'), '×' + num(r.mult || mult(k)));
          sky.classList.add('won'); hist.unshift(r.mult || mult(k));
        }
        hist = hist.slice(0, 12); try { localStorage.setItem('cg_balloon_h', JSON.stringify(hist)); } catch (e) { /* ignore */ }
        paintHist();
        setBtn(l.bet);
        K.resultLine(box, r);
      } else {
        ball.classList.remove('pop');
        grow(k);
        K.setText($('blM'), '×' + num(k ? r.mult : 1));
        if (pumped) { sky.classList.remove('pumped'); void sky.offsetWidth; sky.classList.add('pumped'); }
        if (k) setBtn(l.cash, money(r.stake * r.mult), 'cash'); else setBtn(l.pump, '', 'wait');
      }
      info();
    }
    function info() {
      K.setText($('blNext'), live() ? l.next + ' ×' + num(g.next) : l.next + ' ×' + num(mult(1)));
      K.setText($('blPumpT'), holding ? l.pump : (live() ? l.hold : l.pump));
      wob.classList.toggle('on', !!live());
      sky.classList.toggle('on', !!live());
    }
    async function start() {
      if (busy) return false;
      busy = true; if (btn) btn.disabled = true;
      var r = await K.multi('balloon', 'start');
      busy = false; if (btn) btn.disabled = false;
      if (!r || !box.isConnected) return false;
      ball.classList.remove('pop'); $('blBurst').classList.remove('go'); wantCash = false;
      paint(r);
      return live();
    }
    async function pumpOnce() {
      if (busy || !live()) return false;
      busy = true; sky.classList.add('pumping');
      var r = await K.multi('balloon', 'pump');
      busy = false; if (!box.isConnected) return false;
      sky.classList.remove('pumping');
      if (!r) { holding = false; info(); return false; }
      paint(r, true);
      if (wantCash && live()) { await cash(); return false; }
      return live();
    }
    async function hold() {
      if (K.guest()) { K.signup(); return; }
      if (holding) return;
      holding = true; info();
      if (!live() && !(await start())) { holding = false; info(); return; }
      var first = true;
      while (box.isConnected && live() && (holding || first)) {
        first = false;
        if (!(await pumpOnce())) break;
        if (!holding) break;
        await K.sleep(140);
      }
      holding = false; if (box.isConnected) info();
    }
    function release() { holding = false; if (box.isConnected) info(); }
    pumpB.addEventListener('pointerdown', function (e) { e.preventDefault(); try { pumpB.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } hold(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { pumpB.addEventListener(ev, release); });
    pumpB.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hold(); } });
    pumpB.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') release(); });
    pumpB.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    async function cash() {
      wantCash = false; holding = false;
      if (!live() || !g.k) return;
      busy = true; var c = await K.multi('balloon', 'cash'); busy = false;
      if (c && box.isConnected) paint(c);
    }
    if (btn) btn.addEventListener('click', function () {
      if (live() && busy) { if (g.k || holding) { wantCash = true; holding = false; } return; } // un souffle est en route : on encaisse juste après
      if (busy) return;
      if (live()) cash(); else start();
    });
    paintHist(); grow(0); info(); setBtn(l.bet);
    K.multi('balloon', 'state', null, true).then(function (r) { if (r && !r.done && box.isConnected) paint(r); });
  }, { rules: {
    en: '1. Choose your bet and press Bet (or press the pump straight away).\n2. Press or hold Pump: every pump grows the balloon and raises the multiplier. At any pump the balloon can pop (1 chance in 10) and the bet is lost.\n3. Press Cash out before it pops to collect bet × the current multiplier.',
    fr: '1. Choisis ta mise et touche Miser (ou touche directement la pompe).\n2. Touche ou maintiens Gonfler : chaque coup de pompe agrandit le ballon et augmente le multiplicateur. À chaque coup, le ballon peut éclater (1 chance sur 10) et la mise est perdue.\n3. Touche Encaisser avant qu’il éclate pour gagner mise × multiplicateur actuel.',
    es: '1. Elige tu apuesta y pulsa Apostar (o pulsa directamente la bomba).\n2. Pulsa o mantén Inflar: cada bombeo agranda el globo y sube el multiplicador. En cada bombeo el globo puede explotar (1 de cada 10) y se pierde la apuesta.\n3. Pulsa Retirar antes de que explote para cobrar apuesta × multiplicador actual.',
    pt: '1. Escolha sua aposta e toque Apostar (ou toque direto na bomba).\n2. Toque ou segure Encher: cada bombada aumenta o balão e o multiplicador. A cada bombada o balão pode estourar (1 chance em 10) e a aposta é perdida.\n3. Toque Sacar antes que estoure para receber aposta × multiplicador atual.',
    ar: '1. اختر رهانك واضغط راهن (أو اضغط على المضخة مباشرة).\n2. اضغط أو استمر بالضغط على انفخ: كل نفخة تكبّر البالون وترفع المضاعف. مع كل نفخة قد ينفجر البالون (فرصة 1 من 10) ويضيع الرهان.\n3. اضغط اسحب قبل أن ينفجر لتربح الرهان × المضاعف الحالي.',
    tr: '1. Bahsini seç ve Bahis\'e bas (ya da doğrudan pompaya bas).\n2. Şişir\'e bas veya basılı tut: her pompa balonu büyütür ve çarpanı artırır. Her pompada balon patlayabilir (10\'da 1) ve bahis kaybedilir.\n3. Patlamadan önce Çek\'e basarak bahis × mevcut çarpanı al.',
    vi: '1. Chọn tiền cược và bấm Cược (hoặc bấm ngay vào nút bơm).\n2. Bấm hoặc giữ Bơm: mỗi lần bơm bóng to hơn và hệ số tăng. Mỗi lần bơm bóng có thể nổ (1 trên 10) và mất tiền cược.\n3. Bấm Rút tiền trước khi bóng nổ để nhận cược × hệ số hiện tại.',
    id: '1. Pilih taruhanmu dan tekan Pasang (atau langsung tekan pompa).\n2. Tekan atau tahan Pompa: setiap pompaan membesarkan balon dan menaikkan pengali. Di setiap pompaan balon bisa meletus (1 dari 10) dan taruhan hilang.\n3. Tekan Tarik sebelum meletus untuk menerima taruhan × pengali saat ini.',
    ru: '1. Выбери ставку и нажми «Ставка» (или сразу нажми на насос).\n2. Нажимай или держи «Накачать»: каждый качок увеличивает шар и множитель. При любом качке шар может лопнуть (1 шанс из 10), и ставка проиграна.\n3. Нажми «Забрать», пока шар не лопнул, и получи ставку × текущий множитель.',
    de: '1. Wähle deinen Einsatz und tippe auf Setzen (oder direkt auf die Pumpe).\n2. Tippe oder halte Pumpen: jeder Pumpstoß vergrößert den Ballon und den Multiplikator. Bei jedem Stoß kann der Ballon platzen (1 zu 10) und der Einsatz ist verloren.\n3. Tippe auf Auszahlen, bevor er platzt, und erhalte Einsatz × aktuellen Multiplikator.',
    hi: '1. अपना दांव चुनें और दांव दबाएँ (या सीधे पंप दबाएँ)।\n2. पंप दबाएँ या दबाए रखें: हर पंप से गुब्बारा बड़ा होता है और मल्टीप्लायर बढ़ता है। हर पंप पर गुब्बारा फट सकता है (10 में 1 मौका) और दांव चला जाता है।\n3. फटने से पहले कैश आउट दबाएँ और दांव × मौजूदा मल्टीप्लायर पाएँ।',
    zh: '1. 选择下注金额并点“下注”（或直接按充气）。\n2. 点按或按住“充气”：每充一次气球变大、倍数上升。每次充气气球都可能爆炸（十分之一的机会），下注即输掉。\n3. 在气球爆炸前点“兑现”，即可获得 下注 × 当前倍数。'
  } });
})(window.D6 = window.D6 || {});
