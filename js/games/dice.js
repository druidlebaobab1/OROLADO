/* v2795 — Dice rebuilt (owner request): Spribe-style Dice — 0–100 slider (red / green zones), Roll Under / Roll Over,
   win chance and multiplier, the result marker slides to the rolled number. Server: K.play('dice', {chance, over}). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', under: 'Roll Under', over: 'Roll Over', mult: 'Multiplier', chance: 'Chance' },
    fr: { bet: 'Miser', under: 'Moins de', over: 'Plus de', mult: 'Multiplicateur', chance: 'Chance' },
    es: { bet: 'Apostar', under: 'Menor que', over: 'Mayor que', mult: 'Multiplicador', chance: 'Prob.' },
    pt: { bet: 'Apostar', under: 'Abaixo de', over: 'Acima de', mult: 'Multiplicador', chance: 'Chance' },
    ar: { bet: 'راهن', under: 'أقل من', over: 'أكثر من', mult: 'المضاعف', chance: 'الفرصة' },
    tr: { bet: 'Bahis', under: 'Altında', over: 'Üstünde', mult: 'Çarpan', chance: 'Şans' },
    vi: { bet: 'Cược', under: 'Dưới', over: 'Trên', mult: 'Hệ số', chance: 'Cơ hội' },
    id: { bet: 'Pasang', under: 'Di bawah', over: 'Di atas', mult: 'Pengganda', chance: 'Peluang' },
    ru: { bet: 'Ставка', under: 'Меньше', over: 'Больше', mult: 'Множитель', chance: 'Шанс' },
    de: { bet: 'Setzen', under: 'Unter', over: 'Über', mult: 'Multiplikator', chance: 'Chance' },
    hi: { bet: 'दांव', under: 'से कम', over: 'से ज़्यादा', mult: 'गुणक', chance: 'मौका' },
    zh: { bet: '下注', under: '小于', over: '大于', mult: '倍数', chance: '胜率' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var HIST = [];                 // derniers lancers de cette visite : [roll, gagné]
  var SET = { c: 50, over: 0 };  // réglage gardé quand on revient au jeu
  function nf(v, d) { return Number(v).toFixed(d).replace('.', K.dec()); }
  // même calcul que le serveur : floor(EDGE × 100 / chance × 10000) / 10000
  function multOf(c) { return Math.floor(0.94 * 100 / c * 10000) / 10000; }

  K.register('dice', function (box, x) {
    var l = L(), busy = false, lastRoll = null;
    box.classList.add('cg-game', 'cg-dice');
    var scale = [0, 25, 50, 75, 100].map(function (n) { return '<span style="left:' + n + '%">' + n + '</span>'; }).join('');
    box.innerHTML = '<div class="cg-stage dc-stage">' +
        '<div class="cg-hist dc-hist" id="dcHist"></div>' +
        '<div class="dc-big"><b class="dc-num fit" id="dcNum">' + nf(50, 2) + '</b></div>' +
        '<div class="dc-bar" dir="ltr">' +
          '<div class="dc-scale">' + scale + '</div>' +
          '<div class="dc-track" id="dcTrack"><i class="dc-red"></i><i class="dc-green" id="dcGreen"></i>' +
            '<div class="dc-run" id="dcRun"><span class="dc-mark" id="dcMark"><b id="dcMarkN"></b></span></div>' +
            '<div class="dc-hrun" id="dcHrun"><span class="dc-handle" role="slider" tabindex="0" aria-label="' + K.esc(l.chance) + '"><i></i><i></i><i></i></span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      K.stakePanel(l.bet,
        '<div class="dc-info">' +
          '<div class="dc-cell"><small class="fit">' + K.esc(l.mult) + '</small><b class="fit" id="dcMul"></b></div>' +
          '<button type="button" class="dc-cell dc-sw" id="dcSw"><small class="fit" id="dcSwL"></small><b class="fit"><span id="dcTgt"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg></b></button>' +
          '<div class="dc-cell dc-ch"><button type="button" class="dc-st" data-d="-1" aria-label="−"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>' +
            '<span><small class="fit">' + K.esc(l.chance) + '</small><b class="fit" id="dcCh"></b></span>' +
            '<button type="button" class="dc-st" data-d="1" aria-label="+"><svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12"/></svg></button></div>' +
        '</div>');
    K.bindStake(box);

    var track = $('dcTrack'), green = $('dcGreen'), hrun = $('dcHrun'), run = $('dcRun'), mark = $('dcMark'), num = $('dcNum');
    // valeur de la poignée (0–100) : « moins de » → chance ; « plus de » → 100 − chance
    function target() { return SET.over ? 100 - SET.c : SET.c; }
    function paint() {
      var t = target();
      hrun.style.transform = 'translateX(' + t + '%)';
      green.style.transformOrigin = SET.over ? '100% 50%' : '0 50%';
      green.style.transform = 'scaleX(' + (SET.over ? (100 - t) : t) / 100 + ')';
      K.setText($('dcMul'), '×' + nf(multOf(SET.c), 4));
      K.setText($('dcSwL'), SET.over ? l.over : l.under);
      K.setText($('dcTgt'), nf(t, 2));
      K.fitEl($('dcTgt').parentNode);
      K.setText($('dcCh'), nf(SET.c, 0) + ' %');
      box.classList.toggle('is-over', !!SET.over);
    }
    function setC(c) { if (busy) return; SET.c = Math.max(2, Math.min(95, Math.round(c))); paint(); }
    function paintHist() {
      $('dcHist').innerHTML = HIST.slice(0, 14).map(function (h) { return '<i class="' + (h[1] ? 'w' : 'l') + '">' + nf(h[0], 2) + '</i>'; }).join('');
    }

    // glisser la poignée (ou toucher la barre)
    var drag = false;
    function fromX(ev) {
      var r = track.getBoundingClientRect(), v = (ev.clientX - r.left) / r.width * 100;
      setC(SET.over ? 100 - v : v);
    }
    track.addEventListener('pointerdown', function (ev) { if (busy) return; drag = true; try { track.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ } fromX(ev); ev.preventDefault(); });
    track.addEventListener('pointermove', function (ev) { if (drag) fromX(ev); });
    track.addEventListener('pointerup', function () { drag = false; });
    track.addEventListener('pointercancel', function () { drag = false; });
    hrun.querySelector('.dc-handle').addEventListener('keydown', function (ev) {
      var d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
      if (d) { setC(SET.c + (SET.over ? -d : d)); ev.preventDefault(); }
    });
    box.querySelectorAll('.dc-st').forEach(function (b) { b.addEventListener('click', function () { setC(SET.c + Number(b.getAttribute('data-d'))); }); });
    $('dcSw').addEventListener('click', function () { if (busy) return; SET.over = SET.over ? 0 : 1; paint(); });

    $('csGo').addEventListener('click', async function () {
      if (busy) return;
      busy = true; box.classList.add('rolling');
      var go = $('csGo'); go.disabled = true;
      var r = await K.play('dice', { chance: SET.c, over: SET.over });
      if (!r || !box.isConnected) { busy = false; box.classList.remove('rolling'); go.disabled = false; return; }
      var roll = Number(r.view.roll), win = r.win > 0;
      num.className = 'dc-num fit'; mark.className = 'dc-mark';
      // le repère glisse jusqu'au nombre tiré, le grand nombre défile
      run.classList.add('on');
      run.style.transform = 'translateX(' + roll + '%)'; mark.style.setProperty('--p', (50 + (roll - 50) * 0.8).toFixed(1));
      var t0 = performance.now(), from = lastRoll == null ? 50 : lastRoll, dur = document.documentElement.classList.contains('oro-lite') ? 200 : 520;
      await new Promise(function (res) {
        (function step(now) {
          if (!box.isConnected) return res();
          var k = Math.min(1, (now - t0) / dur), v = from + (roll - from) * K.easeOut(k);
          K.setText(num, nf(v, 2)); K.setText($('dcMarkN'), nf(v, 2));
          if (k < 1) K.S.raf = requestAnimationFrame(step); else res();
        })(t0);
      });
      if (!box.isConnected) return;
      lastRoll = roll;
      K.setText(num, nf(roll, 2)); K.setText($('dcMarkN'), nf(roll, 2));
      num.className = 'dc-num fit ' + (win ? 'w' : 'l'); mark.className = 'dc-mark ' + (win ? 'w' : 'l');
      HIST.unshift([roll, win]); if (HIST.length > 30) HIST.length = 30; paintHist();
      K.resultLine(box, r);
      busy = false; box.classList.remove('rolling'); go.disabled = false;
    });

    paint(); paintHist();
    if (lastRoll == null && HIST.length) lastRoll = HIST[0][0];
    if (HIST.length) {
      var h = HIST[0]; run.classList.add('on'); run.style.transform = 'translateX(' + h[0] + '%)'; mark.style.setProperty('--p', (50 + (h[0] - 50) * 0.8).toFixed(1));
      K.setText(num, nf(h[0], 2)); K.setText($('dcMarkN'), nf(h[0], 2)); num.className = 'dc-num fit ' + (h[1] ? 'w' : 'l'); mark.className = 'dc-mark ' + (h[1] ? 'w' : 'l');
    }
  }, { rules: {
    en: '1. Drag the slider to set your target: the green zone is your win chance (2 to 95 %). Tap “Roll Under / Roll Over” to switch side.\n2. Tap “Bet”: a number from 0.00 to 99.99 is rolled.\n3. If it lands in the green zone you win stake × multiplier (94 ÷ chance). Smaller chance = bigger win.',
    fr: '1. Fais glisser le curseur : la zone verte est ta chance de gain (2 à 95 %). Touche « Moins de / Plus de » pour changer de côté.\n2. Touche « Miser » : un nombre de 0,00 à 99,99 est tiré.\n3. S’il tombe dans la zone verte, tu gagnes mise × multiplicateur (94 ÷ chance). Petite chance = gros gain.',
    es: '1. Desliza el control: la zona verde es tu probabilidad de ganar (2 a 95 %). Toca «Menor que / Mayor que» para cambiar de lado.\n2. Toca «Apostar»: sale un número de 0,00 a 99,99.\n3. Si cae en la zona verde ganas apuesta × multiplicador (94 ÷ probabilidad). Menos probabilidad = más ganancia.',
    pt: '1. Arraste o controle: a zona verde é a sua chance de ganhar (2 a 95 %). Toque em «Abaixo de / Acima de» para trocar de lado.\n2. Toque em «Apostar»: sai um número de 0,00 a 99,99.\n3. Se cair na zona verde, você ganha aposta × multiplicador (94 ÷ chance). Chance menor = ganho maior.',
    ar: '1. حرّك المؤشر: المنطقة الخضراء هي فرصة فوزك (من 2 إلى 95 %). اضغط «أقل من / أكثر من» لتغيير الجهة.\n2. اضغط «راهن»: يُسحب رقم من 0.00 إلى 99.99.\n3. إذا وقع في المنطقة الخضراء تربح الرهان × المضاعف (94 ÷ الفرصة). فرصة أصغر = ربح أكبر.',
    tr: '1. Kaydırıcıyı sürükle: yeşil alan kazanma şansındır (%2 ile %95 arası). Taraf değiştirmek için «Altında / Üstünde»ye dokun.\n2. «Bahis»e dokun: 0,00 ile 99,99 arasında bir sayı çekilir.\n3. Sayı yeşil alana düşerse bahis × çarpan kazanırsın (94 ÷ şans). Şans küçükse kazanç büyür.',
    vi: '1. Kéo thanh trượt: vùng xanh là cơ hội thắng của bạn (2 đến 95 %). Chạm «Dưới / Trên» để đổi phía.\n2. Chạm «Cược»: một số từ 0,00 đến 99,99 được quay.\n3. Nếu số rơi vào vùng xanh, bạn thắng tiền cược × hệ số (94 ÷ cơ hội). Cơ hội nhỏ = thắng lớn.',
    id: '1. Geser slider: zona hijau adalah peluang menangmu (2 sampai 95 %). Ketuk «Di bawah / Di atas» untuk ganti sisi.\n2. Ketuk «Pasang»: angka 0,00 sampai 99,99 diundi.\n3. Jika jatuh di zona hijau, kamu menang taruhan × pengganda (94 ÷ peluang). Peluang kecil = menang besar.',
    ru: '1. Двигайте ползунок: зелёная зона — ваш шанс выигрыша (от 2 до 95 %). Нажмите «Меньше / Больше», чтобы сменить сторону.\n2. Нажмите «Ставка»: выпадает число от 0,00 до 99,99.\n3. Если оно в зелёной зоне, вы выигрываете ставку × множитель (94 ÷ шанс). Меньше шанс — больше выигрыш.',
    de: '1. Schieb den Regler: Die grüne Zone ist deine Gewinnchance (2 bis 95 %). Tippe auf „Unter / Über“, um die Seite zu wechseln.\n2. Tippe auf „Setzen“: Eine Zahl von 0,00 bis 99,99 wird gewürfelt.\n3. Landet sie in der grünen Zone, gewinnst du Einsatz × Multiplikator (94 ÷ Chance). Kleinere Chance = größerer Gewinn.',
    hi: '1. स्लाइडर खिसकाएँ: हरा हिस्सा आपकी जीत का मौका है (2 से 95 %)। तरफ़ बदलने के लिए «से कम / से ज़्यादा» दबाएँ।\n2. «दांव» दबाएँ: 0.00 से 99.99 तक एक संख्या निकलती है।\n3. संख्या हरे हिस्से में आए तो आप दांव × गुणक जीतते हैं (94 ÷ मौका)। कम मौका = बड़ी जीत।',
    zh: '1. 拖动滑块：绿色区域就是你的胜率（2% 到 95%）。点「小于 / 大于」切换方向。\n2. 点「下注」：随机掷出 0.00 到 99.99 之间的数字。\n3. 落在绿色区域即赢得 下注 × 倍数（94 ÷ 胜率）。胜率越小，奖金越高。'
  } });
})(window.D6 = window.D6 || {});
