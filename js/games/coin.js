/* v2795 — Coin Flip rebuilt (owner request): BGaming / Evoplay-style coin flip — a 3D coin (gold heads / silver tails)
   is tossed and spins, heads or tails ×1.94, history of the last flips. Server: K.play('coin', {side: 0|1}) → view {r}. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', heads: 'Heads', tails: 'Tails' },
    fr: { bet: 'Miser', heads: 'Face', tails: 'Pile' },
    es: { bet: 'Apostar', heads: 'Cara', tails: 'Cruz' },
    pt: { bet: 'Apostar', heads: 'Cara', tails: 'Coroa' },
    ar: { bet: 'راهن', heads: 'وجه', tails: 'كتابة' },
    tr: { bet: 'Bahis', heads: 'Tura', tails: 'Yazı' },
    vi: { bet: 'Cược', heads: 'Ngửa', tails: 'Sấp' },
    id: { bet: 'Pasang', heads: 'Gambar', tails: 'Angka' },
    ru: { bet: 'Ставка', heads: 'Орёл', tails: 'Решка' },
    de: { bet: 'Setzen', heads: 'Kopf', tails: 'Zahl' },
    hi: { bet: 'दांव', heads: 'चित', tails: 'पट' },
    zh: { bet: '下注', heads: '正面', tails: '反面' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var HIST = [];          // derniers lancers : 0 = face (or), 1 = pile (argent)
  var SET = { side: 0, rot: 0 };
  var MULT = '×1.94';

  // faces dessinées (SVG maison) : FACE = or, couronne + planète OROLADO ; PILE = argent, planète à anneau + étoiles
  function faceSvg(gold, id) {
    var a = gold ? ['#FFF4C2', '#FBBF24', '#B45309', '#7C2D12'] : ['#FFFFFF', '#CBD5E1', '#64748B', '#1E293B'];
    var g = '<defs><radialGradient id="' + id + 'b" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="' + a[0] + '"/><stop offset=".55" stop-color="' + a[1] + '"/><stop offset="1" stop-color="' + a[2] + '"/></radialGradient>' +
      '<linearGradient id="' + id + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a[0] + '"/><stop offset=".5" stop-color="' + a[2] + '"/><stop offset="1" stop-color="' + a[1] + '"/></linearGradient></defs>' +
      '<circle cx="50" cy="50" r="49" fill="url(#' + id + 'r)"/><circle cx="50" cy="50" r="42" fill="url(#' + id + 'b)"/>' +
      '<circle cx="50" cy="50" r="42" fill="none" stroke="' + a[3] + '" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="1.5 3"/>' +
      '<circle cx="50" cy="50" r="36" fill="none" stroke="' + a[0] + '" stroke-opacity=".7" stroke-width="1"/>';
    if (gold) g += '<path d="M31 46l5-14 8 9 6-12 6 12 8-9 5 14z" fill="' + a[3] + '" fill-opacity=".85"/><rect x="31" y="47" width="38" height="5" rx="2" fill="' + a[3] + '" fill-opacity=".85"/>' +
      '<circle cx="50" cy="66" r="9" fill="none" stroke="' + a[3] + '" stroke-opacity=".85" stroke-width="3"/><circle cx="50" cy="29" r="2.4" fill="' + a[0] + '"/>';
    else g += '<circle cx="50" cy="52" r="13" fill="' + a[2] + '"/><circle cx="46" cy="48" r="5" fill="' + a[0] + '" fill-opacity=".45"/>' +
      '<ellipse cx="50" cy="53" rx="25" ry="7" fill="none" stroke="' + a[3] + '" stroke-width="3" transform="rotate(-18 50 53)"/>' +
      '<path d="M29 30l1.4 3.2 3.4.3-2.6 2.2.8 3.3-3-1.8-3 1.8.8-3.3-2.6-2.2 3.4-.3zM71 66l1 2.2 2.4.2-1.8 1.6.6 2.3-2.2-1.3-2.1 1.3.5-2.3-1.8-1.6 2.4-.2z" fill="' + a[3] + '"/>';
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + g + '</svg>';
  }
  function chip(side) { return '<i class="' + (side ? 't' : 'h') + '"></i>'; }

  K.register('coin', function (box, x) {
    var l = L(), busy = false;
    box.classList.add('cg-game', 'cg-coin');
    box.innerHTML = '<div class="cg-stage cn-stage">' +
        '<div class="cg-hist cn-hist" id="cnHist"></div>' +
        '<div class="cn-scene"><div class="cn-toss" id="cnToss"><div class="cn-coin" id="cnCoin">' +
          '<span class="cn-face cn-h">' + faceSvg(true, 'cnh') + '</span><span class="cn-face cn-t">' + faceSvg(false, 'cnt') + '</span>' +
        '</div></div><i class="cn-shadow" id="cnShadow"></i></div>' +
      '</div>' +
      K.stakePanel(l.bet, '<div class="cg-opts cn-pick">' +
        '<button type="button" data-s="0" class="cn-b h"><span class="cn-mini">' + faceSvg(true, 'cnm0') + '</span><span class="cn-lbl"><b class="fit">' + K.esc(l.heads) + '</b><small class="fit">' + MULT + '</small></span></button>' +
        '<button type="button" data-s="1" class="cn-b t"><span class="cn-mini">' + faceSvg(false, 'cnm1') + '</span><span class="cn-lbl"><b class="fit">' + K.esc(l.tails) + '</b><small class="fit">' + MULT + '</small></span></button>' +
      '</div>');
    K.bindStake(box);
    var coin = $('cnCoin'), toss = $('cnToss'), sh = $('cnShadow');
    function paintPick() { box.querySelectorAll('.cn-b').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-s') === SET.side); }); }
    function paintHist() { $('cnHist').innerHTML = HIST.slice(0, 18).map(chip).join(''); }
    box.querySelectorAll('.cn-b').forEach(function (b) { b.addEventListener('click', function () { if (busy) return; SET.side = +b.getAttribute('data-s'); paintPick(); }); });
    coin.style.transform = 'rotateX(' + SET.rot + 'deg)';

    $('csGo').addEventListener('click', async function () {
      if (busy) return;
      busy = true; var go = $('csGo'); go.disabled = true; box.classList.add('flipping');
      var r = await K.play('coin', { side: SET.side });
      if (!r || !box.isConnected) { busy = false; go.disabled = false; box.classList.remove('flipping'); return; }
      var res = r.view.r ? 1 : 0, lite = document.documentElement.classList.contains('oro-lite');
      var from = SET.rot, base = Math.ceil((from + 1) / 360) * 360, to = base + (lite ? 720 : 1800) + (res ? 180 : 0);
      var dur = lite ? 500 : 1500;
      SET.rot = to % 360;
      if (coin.animate) {
        var a1 = coin.animate([{ transform: 'rotateX(' + from + 'deg)' }, { transform: 'rotateX(' + to + 'deg)' }], { duration: dur, easing: 'cubic-bezier(.25,.6,.3,1)', fill: 'forwards' });
        toss.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-34%) scale(1.18)', offset: .45 }, { transform: 'translateY(0) scale(1)' }], { duration: dur, easing: 'ease-in-out' });
        sh.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.55)', opacity: .4, offset: .45 }, { transform: 'scale(1)', opacity: 1 }], { duration: dur, easing: 'ease-in-out' });
        await a1.finished.catch(function () {});
        a1.cancel();
      } else await K.sleep(dur);
      if (!box.isConnected) return;
      coin.style.transform = 'rotateX(' + SET.rot + 'deg)';
      box.classList.remove('flipping');
      coin.classList.remove('w', 'l'); void coin.offsetWidth; coin.classList.add(r.win > 0 ? 'w' : 'l');
      HIST.unshift(res); if (HIST.length > 30) HIST.length = 30; paintHist();
      K.resultLine(box, r);
      busy = false; go.disabled = false;
    });
    paintPick(); paintHist();
  }, { rules: {
    en: '1. Choose Heads (gold) or Tails (silver).\n2. Tap “Bet”: the coin is tossed.\n3. If it lands on your side you win ×1.94 your stake.',
    fr: '1. Choisis Face (or) ou Pile (argent).\n2. Touche « Miser » : la pièce est lancée.\n3. Si elle tombe sur ton côté, tu gagnes ×1,94 ta mise.',
    es: '1. Elige Cara (oro) o Cruz (plata).\n2. Toca «Apostar»: se lanza la moneda.\n3. Si cae de tu lado ganas ×1,94 tu apuesta.',
    pt: '1. Escolha Cara (ouro) ou Coroa (prata).\n2. Toque em «Apostar»: a moeda é lançada.\n3. Se cair no seu lado, você ganha ×1,94 a aposta.',
    ar: '1. اختر وجه (ذهبي) أو كتابة (فضي).\n2. اضغط «راهن»: تُرمى العملة.\n3. إذا وقعت على جهتك تربح ×1.94 من رهانك.',
    tr: '1. Tura (altın) ya da Yazı (gümüş) seç.\n2. «Bahis»e dokun: para atılır.\n3. Senin tarafın gelirse bahsinin ×1,94 katını kazanırsın.',
    vi: '1. Chọn Ngửa (vàng) hoặc Sấp (bạc).\n2. Chạm «Cược»: đồng xu được tung.\n3. Nếu rơi đúng mặt bạn chọn, bạn thắng ×1,94 tiền cược.',
    id: '1. Pilih Gambar (emas) atau Angka (perak).\n2. Ketuk «Pasang»: koin dilempar.\n3. Jika jatuh di sisimu, kamu menang ×1,94 taruhan.',
    ru: '1. Выберите Орёл (золото) или Решку (серебро).\n2. Нажмите «Ставка»: монета подброшена.\n3. Если выпала ваша сторона, вы выигрываете ×1,94 ставки.',
    de: '1. Wähle Kopf (Gold) oder Zahl (Silber).\n2. Tippe auf „Setzen“: Die Münze wird geworfen.\n3. Landet sie auf deiner Seite, gewinnst du ×1,94 deines Einsatzes.',
    hi: '1. चित (सोना) या पट (चाँदी) चुनें।\n2. «दांव» दबाएँ: सिक्का उछाला जाता है।\n3. आपकी तरफ़ गिरे तो आप दांव का ×1.94 जीतते हैं।',
    zh: '1. 选择正面（金）或反面（银）。\n2. 点「下注」：抛出硬币。\n3. 落在你选的一面即赢得下注的 ×1.94。'
  } });
})(window.D6 = window.D6 || {});
