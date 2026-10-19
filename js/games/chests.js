/* v2795 — Treasure rebuilt (owner request): Evoplay / 1x-style "pick one of three" — 3 treasure chests on a floating space
   island, tap a chest, bet, it shakes and opens (gold bursts out or it is empty), then the two others open to show where the
   gold was. Pays ×2.85 (server: casino_instant 'chests', unchanged). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', pick: 'Pick a chest' }, fr: { bet: 'Miser', pick: 'Choisis un coffre' }, es: { bet: 'Apostar', pick: 'Elige un cofre' },
    pt: { bet: 'Apostar', pick: 'Escolha um baú' }, ar: { bet: 'راهن', pick: 'اختر صندوقًا' }, tr: { bet: 'Bahis', pick: 'Bir sandık seç' },
    vi: { bet: 'Đặt cược', pick: 'Chọn một rương' }, id: { bet: 'Pasang', pick: 'Pilih satu peti' }, ru: { bet: 'Ставка', pick: 'Выбери сундук' },
    de: { bet: 'Setzen', pick: 'Wähle eine Truhe' }, hi: { bet: 'दांव', pick: 'एक संदूक चुनें' }, zh: { bet: '投注', pick: '选一个宝箱' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var MULT = 2.85;
  function mx(v) { return '×' + String(v).replace('.', K.dec()); }
  var XS = [70, 180, 290];

  function chest(i) {
    return '<g class="ch-c" data-c="' + i + '" transform="translate(' + XS[i] + ' 176)" role="button" tabindex="0" aria-label="' + (i + 1) + '"><g class="ch-in">' +
      '<ellipse class="ch-ring" cx="0" cy="2" rx="52" ry="10"/><ellipse cx="0" cy="2" rx="44" ry="7" fill="rgba(0,0,0,.45)"/>' +
      '<g class="ch-rays"><path d="M0 -50L-40 -150H40z" fill="url(#chRay)"/><path d="M0 -50L-90 -130L-60 -150z" fill="url(#chRay)" opacity=".6"/><path d="M0 -50L90 -130L60 -150z" fill="url(#chRay)" opacity=".6"/></g>' +
      '<g class="ch-olid"><path d="M-46 -52L-40 -96Q0 -104 40 -96L46 -52z" fill="#4A1F05" stroke="#3B1B06" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-40 -96Q0 -104 40 -96" stroke="url(#chMet)" stroke-width="6" fill="none"/><path d="M-44 -60L-38 -94M44 -60L38 -94" stroke="url(#chMet)" stroke-width="5"/>' +
      '<path d="M-36 -62Q0 -68 36 -62" stroke="#2A0F02" stroke-width="3" fill="none"/></g>' +
      '<rect x="-40" y="-56" width="80" height="14" rx="4" fill="#1A0B02"/>' +
      '<g class="ch-gold"><ellipse cx="0" cy="-50" rx="36" ry="9" fill="#F59E0B"/><circle cx="-18" cy="-55" r="8" fill="url(#chCoin)"/><circle cx="0" cy="-60" r="9" fill="url(#chCoin)"/><circle cx="17" cy="-55" r="8" fill="url(#chCoin)"/><circle cx="-6" cy="-52" r="7" fill="url(#chCoin)"/><path d="M8 -70l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z" fill="#fff"/></g>' +
      '<g class="ch-dust"><circle cx="-14" cy="-62" r="7" fill="#A8A3C4" opacity=".5"/><circle cx="6" cy="-68" r="9" fill="#A8A3C4" opacity=".4"/><circle cx="20" cy="-60" r="6" fill="#A8A3C4" opacity=".45"/></g>' +
      '<rect x="-44" y="-46" width="88" height="46" rx="7" fill="url(#chWood)" stroke="#3B1B06" stroke-width="2.5"/>' +
      '<path d="M-44 -30H44" stroke="#3B1B06" stroke-opacity=".5" stroke-width="1.5"/><path d="M-44 -16H44" stroke="#3B1B06" stroke-opacity=".5" stroke-width="1.5"/>' +
      '<rect x="-34" y="-46" width="9" height="46" fill="url(#chMet)"/><rect x="25" y="-46" width="9" height="46" fill="url(#chMet)"/>' +
      '<rect x="-10" y="-40" width="20" height="22" rx="4" fill="url(#chMet)" stroke="#7A4A06" stroke-width="1.5"/><circle cx="0" cy="-32" r="3.4" fill="#3B1B06"/><path d="M0 -31v6" stroke="#3B1B06" stroke-width="2.6" stroke-linecap="round"/>' +
      '<g class="ch-lid"><path d="M-46 -44V-60C-46 -80 -24 -88 0 -88S46 -80 46 -60V-44z" fill="url(#chWood2)" stroke="#3B1B06" stroke-width="2.5"/>' +
      '<path d="M-34 -44V-82M25 -44V-82" stroke="url(#chMet)" stroke-width="9"/><path d="M-46 -48H46" stroke="url(#chMet)" stroke-width="6"/>' +
      '<path d="M-30 -76C-20 -82 -8 -84 4 -84" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round" fill="none"/></g>' +
      '</g></g>';
  }
  function scene() {
    var stars = ''; for (var i = 0; i < 40; i++) stars += '<circle cx="' + (K.seeded(i, 3) * 360).toFixed(1) + '" cy="' + (K.seeded(i, 7) * 150).toFixed(1) + '" r="' + (0.5 + (i % 3) * 0.45) + '" fill="#fff" opacity="' + (0.35 + (i % 4) * 0.15) + '"/>';
    return '<svg class="ch-svg" viewBox="10 20 340 240" preserveAspectRatio="xMidYMid meet" aria-hidden="false"><defs>' +
      '<linearGradient id="chWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B45309"/><stop offset="1" stop-color="#6B2E07"/></linearGradient>' +
      '<linearGradient id="chWood2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D97706"/><stop offset="1" stop-color="#8A3A0A"/></linearGradient>' +
      '<linearGradient id="chMet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B7791F"/><stop offset=".5" stop-color="#FDE68A"/><stop offset="1" stop-color="#B7791F"/></linearGradient>' +
      '<radialGradient id="chCoin" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".55" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></radialGradient>' +
      '<linearGradient id="chRay" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FDE68A" stop-opacity=".9"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="chRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B3FA0"/><stop offset=".4" stop-color="#352266"/><stop offset="1" stop-color="#140B30"/></linearGradient>' +
      '<linearGradient id="chTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8B5CF6"/><stop offset="1" stop-color="#4C1D95"/></linearGradient>' +
      '<radialGradient id="chPl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F9A8D4"/><stop offset=".6" stop-color="#BE185D"/><stop offset="1" stop-color="#500724"/></radialGradient>' +
      '<radialGradient id="chPl2" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#A5F3FC"/><stop offset=".6" stop-color="#0891B2"/><stop offset="1" stop-color="#083344"/></radialGradient>' +
      '</defs>' + stars +
      '<g class="ch-bg"><circle cx="318" cy="40" r="26" fill="url(#chPl)"/><ellipse cx="318" cy="40" rx="42" ry="8" fill="none" stroke="#FBCFE8" stroke-opacity=".55" stroke-width="2.5" transform="rotate(-16 318 40)"/>' +
      '<circle cx="36" cy="58" r="11" fill="url(#chPl2)"/></g>' +
      '<g class="ch-isl"><path d="M14 180C10 170 30 162 60 160H300C332 162 352 170 346 182C340 200 300 214 270 226C240 238 214 258 182 258C150 258 124 240 96 228C60 214 18 198 14 180Z" fill="url(#chRock)"/>' +
      '<path d="M14 180C10 170 30 162 60 160H300C332 162 352 170 346 182C330 190 300 194 180 194S30 190 14 180Z" fill="url(#chTop)"/>' +
      '<path d="M40 176C100 186 260 186 320 176" stroke="#C4B5FD" stroke-opacity=".5" stroke-width="2" fill="none"/>' +
      '<g fill="#67E8F9" opacity=".85"><path d="M24 178l5-16 5 16z"/><path d="M33 180l3-10 4 10z"/><path d="M330 178l4-14 5 14z"/></g>' +
      '<g fill="#3B2577"><path d="M120 222l8 22 6-18z"/><path d="M220 226l-6 20 12-16z"/><path d="M176 250l6 10 4-10z"/></g></g>' +
      chest(0) + chest(1) + chest(2) + '</svg>';
  }

  K.register('chests', function (box) {
    var l = L(), lite = document.documentElement.classList.contains('oro-lite');
    box.classList.add('cg-game', 'cg-chests');
    box.innerHTML = '<div class="cg-stage"><div class="ch-top"><div class="cg-hist ch-hist" id="chHist"></div><b class="ch-x">' + mx(MULT) + '</b></div>' +
      '<div class="ch-scene" dir="ltr">' + scene() + '<div class="ch-fx" id="chFx"></div></div><div class="ch-st"><b class="fit" id="chSt"></b></div></div>' + K.stakePanel(l.bet);
    K.bindStake(box);
    var cs = box.querySelectorAll('.ch-c'), go = $('csGo'), st = $('chSt'), pick = 1, busy = false, hist = [];
    K.setText(st, l.pick);
    function paintPick() { cs.forEach(function (c, i) { c.classList.toggle('sel', i === pick); }); }
    function closeAll() { cs.forEach(function (c) { c.classList.remove('open', 'gold', 'empty', 'dim', 'shake', 'mine'); }); }
    cs.forEach(function (c, i) {
      function sel() { if (busy) return; closeAll(); pick = i; paintPick(); c.classList.remove('hop'); void c.getBoundingClientRect(); c.classList.add('hop'); }
      c.addEventListener('click', sel);
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); } });
    });
    paintPick();
    function burst(i) {
      if (lite) return;
      var fx = $('chFx'), sc = box.querySelector('.ch-scene').getBoundingClientRect(), r = cs[i].querySelector('.ch-lid').getBoundingClientRect();
      var x = r.left - sc.left + r.width / 2, y = r.top - sc.top + r.height * 0.8, h = '';
      for (var k = 0; k < 18; k++) {
        var a = (-90 + (Math.random() - 0.5) * 120) * Math.PI / 180, d = 50 + Math.random() * 70;
        h += '<i style="left:' + x.toFixed(0) + 'px;top:' + y.toFixed(0) + 'px;--x:' + (Math.cos(a) * d).toFixed(0) + 'px;--y:' + (Math.sin(a) * d).toFixed(0) + 'px;--t:' + (0.6 + Math.random() * 0.4).toFixed(2) + 's"></i>';
      }
      fx.innerHTML = h;
      setTimeout(function () { if (fx.isConnected) fx.innerHTML = ''; }, 1300);
    }
    go.addEventListener('click', async function () {
      if (busy) return;
      busy = true; go.disabled = true; closeAll();
      var r = await K.play('chests', { pick: pick });
      if (!r || !box.isConnected) { busy = false; go.disabled = false; return; }
      var me = cs[r.view.pick], won = r.view.gold === r.view.pick;
      me.classList.add('shake', 'mine'); K.setText(st, '');
      K.sfx('roll', { as: 'rattle' }); // v2832 : le coffre tremble
      await K.sleep(lite ? 200 : 700); if (!box.isConnected) return;
      me.classList.remove('shake'); me.classList.add('open', won ? 'gold' : 'empty');
      if (won) { burst(r.view.pick); K.sfx('reveal'); } // v2832 : coffre d'or (le coffre vide reste muet)
      await K.sleep(lite ? 250 : 650); if (!box.isConnected) return;
      cs.forEach(function (c, i) { if (i !== r.view.pick) c.classList.add('open', 'dim', i === r.view.gold ? 'gold' : 'empty'); });
      hist.unshift(r.mult); hist = hist.slice(0, 12);
      $('chHist').innerHTML = hist.map(function (v) { return '<i class="' + (v > 0 ? 'hi' : 'lo') + '">' + mx(v) + '</i>'; }).join('');
      K.resultLine(box, r);
      K.setText(st, l.pick);
      busy = false; go.disabled = false;
    });
  }, {
    rules: {
      en: '1. Tap one of the 3 chests on the island.\n2. Choose your stake and tap “Bet”: your chest opens.\n3. If it holds the gold you win ×2.85. The other chests then open to show where the gold was.',
      fr: '1. Touche un des 3 coffres de l’île.\n2. Choisis ta mise et touche « Miser » : ton coffre s’ouvre.\n3. S’il contient l’or, tu gagnes ×2,85. Les autres coffres s’ouvrent ensuite pour montrer où était l’or.',
      es: '1. Toca uno de los 3 cofres de la isla.\n2. Elige tu apuesta y toca «Apostar»: tu cofre se abre.\n3. Si tiene el oro ganas ×2,85. Luego se abren los otros para mostrar dónde estaba el oro.',
      pt: '1. Toque em um dos 3 baús da ilha.\n2. Escolha a aposta e toque em «Apostar»: seu baú se abre.\n3. Se tiver o ouro, você ganha ×2,85. Depois os outros abrem para mostrar onde estava o ouro.',
      ar: '1. اضغط على أحد الصناديق الثلاثة في الجزيرة.\n2. اختر رهانك واضغط «راهن»: يُفتح صندوقك.\n3. إذا كان فيه الذهب تربح ×2.85. ثم تُفتح الصناديق الأخرى لترى أين كان الذهب.',
      tr: '1. Adadaki 3 sandıktan birine dokun.\n2. Bahsini seç ve «Bahis»e dokun: sandığın açılır.\n3. İçinde altın varsa ×2,85 kazanırsın. Sonra diğer sandıklar açılır ve altının yerini gösterir.',
      vi: '1. Chạm vào một trong 3 rương trên đảo.\n2. Chọn mức cược rồi chạm «Đặt cược»: rương của bạn mở ra.\n3. Nếu có vàng, bạn thắng ×2,85. Sau đó các rương khác mở ra để cho thấy vàng ở đâu.',
      id: '1. Ketuk salah satu dari 3 peti di pulau.\n2. Pilih taruhan lalu ketuk «Pasang»: petimu terbuka.\n3. Jika berisi emas kamu menang ×2,85. Lalu peti lain terbuka untuk menunjukkan letak emasnya.',
      ru: '1. Нажми на один из 3 сундуков на острове.\n2. Выбери ставку и нажми «Ставка»: твой сундук откроется.\n3. Если в нём золото — выигрыш ×2,85. Потом откроются остальные и покажут, где было золото.',
      de: '1. Tippe auf eine der 3 Truhen auf der Insel.\n2. Wähle deinen Einsatz und tippe auf „Setzen“: deine Truhe öffnet sich.\n3. Ist das Gold darin, gewinnst du ×2,85. Danach öffnen sich die anderen und zeigen, wo das Gold war.',
      hi: '1. द्वीप पर 3 संदूकों में से एक को छुएँ।\n2. अपना दांव चुनें और «दांव» दबाएँ: आपका संदूक खुलता है।\n3. अगर उसमें सोना है तो आप ×2.85 जीतते हैं। फिर बाकी संदूक खुलकर दिखाते हैं कि सोना कहाँ था।',
      zh: '1. 点击岛上 3 个宝箱中的一个。\n2. 选择投注额，点击“投注”：你的宝箱打开。\n3. 如果里面有金子，赢 ×2.85。随后其他宝箱打开，显示金子在哪里。'
    }
  });
})(window.D6 = window.D6 || {});
