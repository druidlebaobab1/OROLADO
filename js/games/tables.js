/* v2795 — Dragon Tiger / Baccarat / Sic Bo rebuilt (owner request): Evolution-style RNG tables — felt seen from above,
   bet spots on the table (tap = chip of the current stake), cards dealt from a shoe and flipped, totals bubbles,
   winner spot glows, bead road of the last results; Sic Bo: 3 dice shaken in a glass dome, total + small/big band.
   Server payouts unchanged (casino_instant: dragon / baccarat / sicbo, param « bet »). */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { dragon: 'Dragon', tiger: 'Tiger', tie: 'Tie', player: 'Player', banker: 'Banker', small: 'Small', big: 'Big', triple: 'Triple', deal: 'Deal', roll: 'Roll', place: 'Place your bets', closed: 'Bets closed', rd: 'D', rt: 'T', rx: 'T', rp: 'P', rb: 'B' },
    fr: { dragon: 'Dragon', tiger: 'Tigre', tie: 'Égalité', player: 'Joueur', banker: 'Banque', small: 'Petit', big: 'Grand', triple: 'Triple', deal: 'Distribuer', roll: 'Lancer', place: 'Faites vos jeux', closed: 'Rien ne va plus', rd: 'D', rt: 'T', rx: 'É', rp: 'J', rb: 'B' },
    es: { dragon: 'Dragón', tiger: 'Tigre', tie: 'Empate', player: 'Jugador', banker: 'Banca', small: 'Pequeño', big: 'Grande', triple: 'Trío', deal: 'Repartir', roll: 'Lanzar', place: 'Hagan sus apuestas', closed: 'Apuestas cerradas', rd: 'D', rt: 'T', rx: 'E', rp: 'J', rb: 'B' },
    pt: { dragon: 'Dragão', tiger: 'Tigre', tie: 'Empate', player: 'Jogador', banker: 'Banca', small: 'Pequeno', big: 'Grande', triple: 'Trinca', deal: 'Distribuir', roll: 'Lançar', place: 'Façam suas apostas', closed: 'Apostas encerradas', rd: 'D', rt: 'T', rx: 'E', rp: 'J', rb: 'B' },
    ar: { dragon: 'التنين', tiger: 'النمر', tie: 'تعادل', player: 'اللاعب', banker: 'المصرف', small: 'صغير', big: 'كبير', triple: 'ثلاثية', deal: 'وزّع', roll: 'ارمِ', place: 'ضع رهاناتك', closed: 'أُغلقت الرهانات', rd: 'ت', rt: 'ن', rx: 'ع', rp: 'ل', rb: 'م' },
    tr: { dragon: 'Ejderha', tiger: 'Kaplan', tie: 'Beraberlik', player: 'Oyuncu', banker: 'Banka', small: 'Küçük', big: 'Büyük', triple: 'Üçlü', deal: 'Dağıt', roll: 'At', place: 'Bahislerinizi yapın', closed: 'Bahisler kapandı', rd: 'E', rt: 'K', rx: 'B', rp: 'O', rb: 'B' },
    vi: { dragon: 'Rồng', tiger: 'Hổ', tie: 'Hòa', player: 'Con', banker: 'Cái', small: 'Xỉu', big: 'Tài', triple: 'Bộ ba', deal: 'Chia bài', roll: 'Lắc', place: 'Mời đặt cược', closed: 'Ngừng cược', rd: 'R', rt: 'H', rx: 'H', rp: 'C', rb: 'C' },
    id: { dragon: 'Naga', tiger: 'Harimau', tie: 'Seri', player: 'Pemain', banker: 'Bankir', small: 'Kecil', big: 'Besar', triple: 'Triple', deal: 'Bagikan', roll: 'Kocok', place: 'Pasang taruhan', closed: 'Taruhan ditutup', rd: 'N', rt: 'H', rx: 'S', rp: 'P', rb: 'B' },
    ru: { dragon: 'Дракон', tiger: 'Тигр', tie: 'Ничья', player: 'Игрок', banker: 'Банкир', small: 'Малое', big: 'Большое', triple: 'Тройка', deal: 'Раздать', roll: 'Бросить', place: 'Делайте ставки', closed: 'Ставки сделаны', rd: 'Д', rt: 'Т', rx: 'Н', rp: 'И', rb: 'Б' },
    de: { dragon: 'Drache', tiger: 'Tiger', tie: 'Unentschieden', player: 'Spieler', banker: 'Bank', small: 'Klein', big: 'Groß', triple: 'Drilling', deal: 'Geben', roll: 'Würfeln', place: 'Bitte Einsätze', closed: 'Nichts geht mehr', rd: 'D', rt: 'T', rx: 'U', rp: 'S', rb: 'B' },
    hi: { dragon: 'ड्रैगन', tiger: 'टाइगर', tie: 'टाई', player: 'प्लेयर', banker: 'बैंकर', small: 'छोटा', big: 'बड़ा', triple: 'ट्रिपल', deal: 'बाँटें', roll: 'फेंकें', place: 'दांव लगाएँ', closed: 'दांव बंद', rd: 'D', rt: 'T', rx: 'T', rp: 'P', rb: 'B' },
    zh: { dragon: '龙', tiger: '虎', tie: '和', player: '闲', banker: '庄', small: '小', big: '大', triple: '围骰', deal: '发牌', roll: '摇骰', place: '请下注', closed: '停止下注', rd: '龙', rt: '虎', rx: '和', rp: '闲', rb: '庄' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function x2(v) { return '×' + String(v).replace('.', K.dec()); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } return null; }

  /* ---------- drawings (own SVG) ---------- */
  var SUIT = [
    'M0-5C-1.2-3.4-5-1-5 1.4-5 3.3-3.5 4.2-2.4 4.2-1.5 4.2-.7 3.7-.3 3L-1.4 5H1.4L.3 3C.7 3.7 1.5 4.2 2.4 4.2 3.5 4.2 5 3.3 5 1.4 5-1 1.2-3.4 0-5Z',
    'M0 4.6C-1.2 3.2-5 .6-5-1.8-5-3.9-3.4-5-2.4-5-1.3-5-.4-4.3 0-3.3.4-4.3 1.3-5 2.4-5 3.4-5 5-3.9 5-1.8 5 .6 1.2 3.2 0 4.6Z',
    'M0-5.2L4 0 0 5.2-4 0Z',
    'M0-5.2A2.35 2.35 0 0 1 2 -1.6 2.35 2.35 0 1 1 .7 2.6L1.5 5.2H-1.5L-.7 2.6A2.35 2.35 0 1 1-2-1.6 2.35 2.35 0 0 1 0-5.2Z'
  ];
  var RK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var PIPS = { 2: [[30, 17], [30, 67]], 3: [[30, 17], [30, 42], [30, 67]], 4: [[20, 17], [40, 17], [20, 67], [40, 67]],
    5: [[20, 17], [40, 17], [30, 42], [20, 67], [40, 67]], 6: [[20, 17], [40, 17], [20, 42], [40, 42], [20, 67], [40, 67]],
    7: [[20, 17], [40, 17], [30, 29.5], [20, 42], [40, 42], [20, 67], [40, 67]], 8: [[20, 17], [40, 17], [30, 29.5], [20, 42], [40, 42], [30, 54.5], [20, 67], [40, 67]],
    9: [[20, 17], [40, 17], [20, 33.7], [40, 33.7], [30, 42], [20, 50.3], [40, 50.3], [20, 67], [40, 67]],
    10: [[20, 17], [40, 17], [30, 25.3], [20, 33.7], [40, 33.7], [20, 50.3], [40, 50.3], [30, 58.7], [20, 67], [40, 67]] };
  var FONT = 'font-family="Plus Jakarta Sans,system-ui,sans-serif" font-weight="800"';
  function defs() {
    return '<svg class="tb-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
      SUIT.map(function (d, i) { return '<path id="tbS' + i + '" d="' + d + '"/>'; }).join('') +
      '<linearGradient id="tbGb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B21B6"/><stop offset="1" stop-color="#1E1150"/></linearGradient>' +
      '<radialGradient id="tbGp" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#B45309"/></radialGradient>' +
      '<linearGradient id="tbGd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4DEF5"/></linearGradient>' +
      '<clipPath id="tbCc"><rect x="5" y="5" width="50" height="74" rx="4"/></clipPath></defs></svg>';
  }
  var BACK = (function () {
    var ln = ''; for (var i = -84; i < 60; i += 7) ln += 'M' + i + ' 84L' + (i + 84) + ' 0';
    return '<svg viewBox="0 0 60 84" aria-hidden="true"><rect x=".5" y=".5" width="59" height="83" rx="6" fill="url(#tbGb)" stroke="#FBBF24" stroke-opacity=".8"/>' +
      '<path d="' + ln + '" stroke="#A78BFA" stroke-opacity=".22" stroke-width="1.2" clip-path="url(#tbCc)"/>' +
      '<rect x="5" y="5" width="50" height="74" rx="4" fill="none" stroke="#FBBF24" stroke-opacity=".55"/>' +
      '<circle cx="30" cy="42" r="10" fill="url(#tbGp)"/><ellipse cx="30" cy="42" rx="17" ry="5" fill="none" stroke="#FDE68A" stroke-width="1.6" transform="rotate(-18 30 42)"/>' +
      '<path d="M14 18l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1zM46 62l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z" fill="#FDE68A"/></svg>';
  })();
  function face(v, s) {
    var red = s === 1 || s === 2, col = red ? '#D61F45' : '#17132F', r = RK[v] || '?';
    var corner = '<text x="8" y="15.5" text-anchor="middle" font-size="' + (r === '10' ? 11 : 13) + '" letter-spacing="' + (r === '10' ? -1 : 0) + '" ' + FONT + '>' + r + '</text><use href="#tbS' + s + '" transform="translate(8 23.5) scale(.62)"/>';
    var o = '<svg viewBox="0 0 60 84" aria-hidden="true"><rect x=".5" y=".5" width="59" height="83" rx="6" fill="#FFFDF7" stroke="#D9D2EE"/><g fill="' + col + '">' + corner + '<g transform="rotate(180 30 42)">' + corner + '</g>';
    if (v === 1) o += '<use href="#tbS' + s + '" transform="translate(30 42) scale(2.5)"/>';
    else if (v <= 10) o += PIPS[v].map(function (p) { return '<use href="#tbS' + s + '" transform="translate(' + p[0] + ' ' + p[1] + ')' + (p[1] > 44 ? ' rotate(180)' : '') + ' scale(.95)"/>'; }).join('');
    else {
      o += '<rect x="15" y="12" width="30" height="60" rx="3" fill="#F7EED3" stroke="#C9A227" stroke-width="1.2"/>' +
        '<path d="M22 27l2-7 3.5 4 2.5-6 2.5 6 3.5-4 2 7z" fill="#E0A82E" stroke="#9A6B12" stroke-width=".6"/>' +
        '<text x="30" y="55" text-anchor="middle" font-size="24" ' + FONT + '>' + r + '</text><use href="#tbS' + s + '" transform="translate(30 63.5) scale(.7)"/>';
    }
    return o + '</g></svg>';
  }
  var DP = { 1: [[20, 20]], 2: [[12, 12], [28, 28]], 3: [[11, 11], [20, 20], [29, 29]], 4: [[12, 12], [28, 12], [12, 28], [28, 28]],
    5: [[11, 11], [29, 11], [20, 20], [11, 29], [29, 29]], 6: [[12, 10.5], [28, 10.5], [12, 20], [28, 20], [12, 29.5], [28, 29.5]] };
  function die(n) {
    return '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="1.5" y="1.5" width="37" height="37" rx="9" fill="url(#tbGd)" stroke="#BDB4DD" stroke-width="1.2"/>' +
      (DP[n] || []).map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (n === 1 ? 5.4 : 3.7) + '" fill="' + (n === 1 || n === 4 ? '#E11D48' : '#1E1B3A') + '"/>'; }).join('') + '</svg>';
  }
  var SHOE = '<svg viewBox="0 0 44 30" aria-hidden="true"><path d="M8 4h28l6 24H2z" fill="#140C33" stroke="#FBBF24" stroke-opacity=".7"/><rect x="11" y="1" width="22" height="10" rx="2" fill="url(#tbGb)" stroke="#FBBF24" stroke-opacity=".6"/><path d="M6 22h32" stroke="#FBBF24" stroke-opacity=".45"/></svg>';

  /* ---------- per-game config ---------- */
  var CFG = {
    dragon: { spots: [['dragon', 2, 'a'], ['tie', 12, 'x'], ['tiger', 2, 'b']], hands: ['dragon', 'tiger'], n: 1 },
    baccarat: { spots: [['player', 2, 'a'], ['tie', 9, 'x'], ['banker', 1.95, 'b']], hands: ['player', 'banker'], n: 3 },
    sicbo: { spots: [['small', 2, 'a', '4–10'], ['big', 2, 'b', '11–17']] }
  };

  function table(g) {
    return function (box) {
      var l = L(), c = CFG[g], sb = g === 'sicbo', busy = false, alive = function () { return box.isConnected; };
      var bet = store('cg_tb_spot_' + g); if (!c.spots.some(function (s) { return s[0] === bet; })) bet = c.spots[0][0];
      var road = store('cg_tb_road_' + g); if (!Array.isArray(road)) road = [];
      var deal = '';
      if (sb) {
        deal = '<div class="tb-sb"><div class="tb-dome" id="tbDome"><i class="tb-plate"></i><div class="tb-dice">' +
          [2, 4, 6].map(function (n, i) { return '<span class="tb-die d' + i + '">' + die(n) + '</span>'; }).join('') +
          '</div><i class="tb-glass"></i></div><em class="tb-bub tb-sum" id="tbSum"></em></div>';
      } else {
        var hand = function (k, side) {
          var slots = '';
          for (var i = 0; i < c.n; i++) slots += '<span class="tb-slot' + (i === 2 ? ' sd' : '') + '" data-i="' + i + '"></span>';
          return '<div class="tb-hand h-' + side + '" id="tbH' + side + '"><div class="tb-hh"><b class="fit">' + K.esc(l[k]) + '</b><em class="tb-bub" id="tbV' + side + '"></em></div><div class="tb-slots">' + slots + '</div></div>';
        };
        deal = '<div class="tb-deal">' + hand(c.hands[0], 'a') + '<div class="tb-mid"><span class="tb-shoe" id="tbShoe">' + SHOE + '</span>' +
          (g === 'dragon' ? '<b class="tb-vs">VS</b>' : '<i class="tb-div"></i>') + '<i></i></div>' + hand(c.hands[1], 'b') + '</div>';
      }
      var band = '';
      if (sb) { for (var n = 3; n <= 18; n++) band += '<i class="' + (n === 3 || n === 18 ? 't' : n <= 10 ? 's' : 'b') + '" data-n="' + n + '">' + n + '</i>'; band = '<div class="tb-band" id="tbBand">' + band + '</div>'; }
      var spots = c.spots.map(function (s) {
        return '<button type="button" class="tb-spot k-' + s[2] + '" data-b="' + s[0] + '"><b class="fit">' + K.esc(l[s[0]]) + '</b><small class="fit">' + (s[3] ? s[3] + ' · ' : '') + x2(s[1]) + '</small></button>';
      }).join('');
      box.innerHTML = '<div class="cg-stage tb-stage tb-' + g + '">' + defs() +
        '<div class="tb-road"><div class="tb-cnt" id="tbCnt"></div><div class="tb-beads" id="tbBeads"></div></div>' +
        '<div class="tb-felt">' + deal + band + '<div class="tb-st"><span class="fit" id="tbSt"></span></div><div class="tb-spots">' + spots + '</div></div></div>' +
        K.stakePanel(sb ? l.roll : l.deal);
      K.bindStake(box);
      var go = $('csGo'), st = $('tbSt');
      K.setText(st, l.place);
      /* re-fit once the web font and container sizes are final */
      var refit = function () { if (alive()) K.fitAll(box); };
      setTimeout(refit, 350);
      try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(refit, 30); }); } catch (e) { /* ignore */ }

      /* chip on the chosen spot */
      var chip = document.createElement('span'); chip.className = 'tb-chip'; chip.innerHTML = '<b class="fit"></b>';
      var chipTxt = function () {
        var v = K.S.stake, t = v >= 1000 ? '1K' : String(Math.round(v * 100) / 100).replace('.', K.dec());
        K.setText(chip.firstChild, t);
      };
      var putChip = function (anim) {
        var sp = box.querySelector('.tb-spot[data-b="' + bet + '"]');
        box.querySelectorAll('.tb-spot').forEach(function (b) { b.classList.toggle('on', b === sp); });
        sp.appendChild(chip); chipTxt();
        if (anim && !lite()) { chip.classList.remove('drop'); void chip.offsetWidth; chip.classList.add('drop'); }
      };
      putChip(false);
      box.addEventListener('stake', chipTxt);
      box.querySelectorAll('.tb-spot').forEach(function (b) {
        b.addEventListener('click', function () {
          if (busy) return;
          bet = b.getAttribute('data-b'); store('cg_tb_spot_' + g, bet); clearWin(); putChip(true);
        });
      });

      /* bead road */
      var paintRoad = function () {
        var cnt = {}, codes = sb ? [['s', 'k-a'], ['b', 'k-b'], ['t', 'k-x']] : [['a', 'k-a'], ['b', 'k-b'], ['x', 'k-x']];
        road.forEach(function (r) { var k = sb ? (r.t ? 't' : r.s <= 10 ? 's' : 'b') : r; cnt[k] = (cnt[k] || 0) + 1; });
        $('tbCnt').innerHTML = codes.map(function (q) { return '<span class="' + q[1] + '"><i></i>' + (cnt[q[0]] || 0) + '</span>'; }).join('');
        var lt = g === 'dragon' ? { a: l.rd, b: l.rt, x: l.rx } : { a: l.rp, b: l.rb, x: l.rx };
        $('tbBeads').innerHTML = road.map(function (r) {
          if (sb) return '<i class="' + (r.t ? 'k-x' : r.s <= 10 ? 'k-a' : 'k-b') + '">' + r.s + '</i>';
          return '<i class="k-' + r + '">' + K.esc(lt[r]) + '</i>';
        }).join('');
      };
      var addRoad = function (r) { road.push(r); if (road.length > 96) road = road.slice(-96); store('cg_tb_road_' + g, road); paintRoad(); };
      paintRoad();

      var clearWin = function () {
        box.querySelectorAll('.win,.lost').forEach(function (e) { e.classList.remove('win', 'lost'); });
        box.querySelectorAll('.tb-pay').forEach(function (e) { e.remove(); });
        chip.classList.remove('gone');
      };
      var wait = function (ms) { return K.sleep(lite() ? Math.round(ms * 0.45) : ms).then(function () { if (!alive()) throw new Error('gone'); }); };
      var lock = function (on) { busy = on; go.disabled = on; go.classList.toggle('wait', on); box.querySelector('.tb-felt').classList.toggle('busy', on); };

      /* cards: fly from the shoe, then flip */
      var dealCard = async function (side, i, v) {
        var slot = box.querySelector('#tbH' + side + ' .tb-slot[data-i="' + i + '"]');
        var cd = document.createElement('span'); cd.className = 'tb-card';
        cd.innerHTML = '<span class="tb-ci"><span class="tb-cb">' + BACK + '</span><span class="tb-cf">' + face(v, Math.floor(Math.random() * 4)) + '</span></span>';
        slot.appendChild(cd);
        var sh = $('tbShoe').getBoundingClientRect(), r = cd.getBoundingClientRect(), z = (r.width / (cd.offsetWidth || r.width)) || 1;
        var dx = ((sh.left + sh.width / 2) - (r.left + r.width / 2)) / z, dy = ((sh.top + sh.height / 2) - (r.top + r.height / 2)) / z;
        var fin = i === 2 ? 'rotate(90deg)' : 'none';
        cd.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) rotate(' + (side === 'a' ? 30 : -30) + 'deg) scale(.45)';
        cd.style.opacity = '0';
        void cd.offsetWidth;
        cd.classList.add('fly'); cd.style.transform = fin; cd.style.opacity = '1';
        await wait(430);
        cd.classList.add('up');
        await wait(380);
      };
      var bub = function (side, v) { var e = $('tbV' + side); K.setText(e, String(v)); e.classList.add('on'); };
      var clearCards = async function () {
        var old = box.querySelectorAll('.tb-card');
        if (old.length) { old.forEach(function (e) { e.classList.add('out'); }); await wait(260); old.forEach(function (e) { e.remove(); }); }
        box.querySelectorAll('.tb-bub').forEach(function (e) { e.classList.remove('on'); e.textContent = ''; });
      };

      /* dice: shaken in the glass dome */
      var shake = async function (dice) {
        var dome = $('tbDome'), ds = box.querySelectorAll('.tb-die');
        dome.classList.remove('open'); dome.classList.add('shake');
        K.S.timer = setInterval(function () { if (!alive()) return; ds.forEach(function (e) { e.innerHTML = die(1 + Math.floor(Math.random() * 6)); }); }, 110);
        await wait(1300);
        clearInterval(K.S.timer); K.S.timer = 0;
        ds.forEach(function (e, i) { e.innerHTML = die(dice[i]); });
        dome.classList.remove('shake');
        await wait(220);
        dome.classList.add('open');
        await wait(420);
      };

      go.addEventListener('click', async function () {
        if (busy) return;
        lock(true); clearWin();
        box.querySelectorAll('.tb-band i').forEach(function (e) { e.classList.remove('on'); });
        K.setText(st, l.closed);
        try {
          if (!sb) await clearCards(); else { $('tbSum').classList.remove('on'); }
          var r = await K.play(g, { bet: bet });
          if (!r) { lock(false); K.setText(st, l.place); return; }
          if (!alive()) return;
          var v = r.view, win = '', code = '';
          if (g === 'dragon') {
            await dealCard('a', 0, v.d); bub('a', v.d);
            await dealCard('b', 0, v.t); bub('b', v.t);
            code = v.d === v.t ? 'x' : v.d > v.t ? 'a' : 'b';
          } else if (g === 'baccarat') {
            var bv = function (cv) { return cv >= 10 ? 0 : cv; }, sp = 0, sbk = 0;
            var seq = [['a', 0, v.p[0]], ['b', 0, v.b[0]], ['a', 1, v.p[1]], ['b', 1, v.b[1]]];
            if (v.p[2]) seq.push(['a', 2, v.p[2]]);
            if (v.b[2]) seq.push(['b', 2, v.b[2]]);
            for (var i = 0; i < seq.length; i++) {
              await dealCard(seq[i][0], seq[i][1], seq[i][2]);
              if (seq[i][0] === 'a') { sp = (sp + bv(seq[i][2])) % 10; bub('a', sp); } else { sbk = (sbk + bv(seq[i][2])) % 10; bub('b', sbk); }
              if (i === 3 && seq.length > 4) await wait(350);
            }
            bub('a', v.tp); bub('b', v.tb);
            code = v.tp === v.tb ? 'x' : v.tp > v.tb ? 'a' : 'b';
          } else {
            await shake(v.dice);
            var sm = $('tbSum'); K.setText(sm, String(v.sum)); sm.classList.add('on');
            var cell = box.querySelector('.tb-band i[data-n="' + v.sum + '"]'); if (cell) cell.classList.add('on');
            code = v.triple ? 'x' : v.sum <= 10 ? 'a' : 'b';
          }
          /* winner spot glows, chip paid or collected */
          var wk = { a: c.spots[0][0], b: c.spots[c.spots.length - 1][0], x: sb ? '' : 'tie' }[code];
          var ws = wk && box.querySelector('.tb-spot[data-b="' + wk + '"]');
          if (ws) ws.classList.add('win');
          if (!sb && code !== 'x') { var hw = $('tbH' + code); if (hw) hw.classList.add('win'); }
          if (sb && v.triple) $('tbBand').classList.add('win');
          await wait(250);
          if (r.win > r.stake) {
            var pay = document.createElement('span'); pay.className = 'tb-chip tb-pay'; pay.innerHTML = '<b></b>';
            chip.parentNode.appendChild(pay);
          } else if (!(r.win > 0)) chip.classList.add('gone');
          addRoad(sb ? { s: v.sum, t: v.triple ? 1 : 0 } : code);
          K.resultLine(box, r);
          win = code;
          await wait(lite() ? 300 : 700);
          chip.classList.remove('gone');
          K.setText(st, l.place);
          lock(false);
          return win;
        } catch (e) { /* left the game mid-round */ if (alive()) { lock(false); K.setText(st, l.place); } }
      });
    };
  }

  var RULES = {
    dragon: {
      en: '1. Tap Dragon, Tiger (×2) or Tie (×12) to place your chip, then tap “Deal”.\n2. One card is dealt to Dragon, one to Tiger (A = 1 … K = 13).\n3. The higher card wins. Tie: half of a Dragon / Tiger bet is returned.',
      fr: '1. Touche Dragon, Tigre (×2) ou Égalité (×12) pour poser ton jeton, puis « Distribuer ».\n2. Une carte pour le Dragon, une pour le Tigre (A = 1 … R = 13).\n3. La plus forte gagne. Égalité : la moitié d’une mise Dragon / Tigre est rendue.',
      es: '1. Toca Dragón, Tigre (×2) o Empate (×12) para poner tu ficha y luego “Repartir”.\n2. Una carta para el Dragón y otra para el Tigre (A = 1 … K = 13).\n3. Gana la carta más alta. Empate: se devuelve la mitad de una apuesta Dragón / Tigre.',
      pt: '1. Toque em Dragão, Tigre (×2) ou Empate (×12) para colocar sua ficha e depois “Distribuir”.\n2. Uma carta para o Dragão e outra para o Tigre (A = 1 … K = 13).\n3. A carta mais alta vence. Empate: metade da aposta Dragão / Tigre é devolvida.',
      ar: '1. المس التنين أو النمر (×2) أو تعادل (×12) لوضع رقاقتك، ثم «وزّع».\n2. ورقة للتنين وورقة للنمر (A = 1 … K = 13).\n3. الورقة الأعلى تربح. عند التعادل يُعاد نصف رهان التنين / النمر.',
      tr: '1. Fişini koymak için Ejderha, Kaplan (×2) veya Beraberlik (×12) seç, sonra “Dağıt”.\n2. Ejderhaya bir kart, Kaplana bir kart (A = 1 … K = 13).\n3. Yüksek kart kazanır. Beraberlikte Ejderha / Kaplan bahsinin yarısı iade edilir.',
      vi: '1. Chạm Rồng, Hổ (×2) hoặc Hòa (×12) để đặt chip, rồi chạm “Chia bài”.\n2. Rồng một lá, Hổ một lá (A = 1 … K = 13).\n3. Lá cao hơn thắng. Hòa: hoàn một nửa cược Rồng / Hổ.',
      id: '1. Ketuk Naga, Harimau (×2) atau Seri (×12) untuk menaruh chip, lalu “Bagikan”.\n2. Satu kartu untuk Naga, satu untuk Harimau (A = 1 … K = 13).\n3. Kartu tertinggi menang. Seri: setengah taruhan Naga / Harimau dikembalikan.',
      ru: '1. Нажмите Дракон, Тигр (×2) или Ничья (×12), чтобы поставить фишку, затем «Раздать».\n2. Одна карта Дракону, одна Тигру (A = 1 … K = 13).\n3. Старшая карта выигрывает. Ничья: половина ставки на Дракона / Тигра возвращается.',
      de: '1. Tippe auf Drache, Tiger (×2) oder Unentschieden (×12), um deinen Chip zu setzen, dann „Geben“.\n2. Eine Karte für den Drachen, eine für den Tiger (A = 1 … K = 13).\n3. Die höhere Karte gewinnt. Unentschieden: die Hälfte eines Drache- / Tiger-Einsatzes kommt zurück.',
      hi: '1. चिप रखने के लिए ड्रैगन, टाइगर (×2) या टाई (×12) दबाएँ, फिर “बाँटें”।\n2. ड्रैगन को एक पत्ता, टाइगर को एक पत्ता (A = 1 … K = 13)।\n3. बड़ा पत्ता जीतता है। टाई पर ड्रैगन / टाइगर दांव का आधा वापस।',
      zh: '1. 点击 龙、虎（×2）或 和（×12）放下筹码，然后点“发牌”。\n2. 龙、虎各发一张牌（A = 1 … K = 13）。\n3. 点数大者赢。和局：龙 / 虎注退还一半。'
    },
    baccarat: {
      en: '1. Tap Player (×2), Banker (×1.95) or Tie (×9) to place your chip, then tap “Deal”.\n2. Two or three cards per hand (10, J, Q, K = 0; only the last digit counts).\n3. The hand closest to 9 wins. Tie: Player / Banker bets are returned.',
      fr: '1. Touche Joueur (×2), Banque (×1,95) ou Égalité (×9) pour poser ton jeton, puis « Distribuer ».\n2. Deux ou trois cartes par main (10, V, D, R = 0 ; seul le dernier chiffre compte).\n3. La main la plus proche de 9 gagne. Égalité : mises Joueur / Banque rendues.',
      es: '1. Toca Jugador (×2), Banca (×1,95) o Empate (×9) para poner tu ficha y luego “Repartir”.\n2. Dos o tres cartas por mano (10, J, Q, K = 0; solo cuenta la última cifra).\n3. Gana la mano más cercana a 9. Empate: se devuelven las apuestas Jugador / Banca.',
      pt: '1. Toque em Jogador (×2), Banca (×1,95) ou Empate (×9) para colocar sua ficha e depois “Distribuir”.\n2. Duas ou três cartas por mão (10, J, Q, K = 0; só conta o último dígito).\n3. A mão mais próxima de 9 vence. Empate: apostas Jogador / Banca devolvidas.',
      ar: '1. المس اللاعب (×2) أو المصرف (×1.95) أو تعادل (×9) لوضع رقاقتك، ثم «وزّع».\n2. ورقتان أو ثلاث لكل يد (10 وJ وQ وK = 0، يُحسب الرقم الأخير فقط).\n3. اليد الأقرب إلى 9 تربح. عند التعادل تُعاد رهانات اللاعب / المصرف.',
      tr: '1. Fişini koymak için Oyuncu (×2), Banka (×1,95) veya Beraberlik (×9) seç, sonra “Dağıt”.\n2. Her ele iki veya üç kart (10, J, Q, K = 0; yalnızca son rakam sayılır).\n3. 9’a en yakın el kazanır. Beraberlikte Oyuncu / Banka bahisleri iade edilir.',
      vi: '1. Chạm Con (×2), Cái (×1,95) hoặc Hòa (×9) để đặt chip, rồi chạm “Chia bài”.\n2. Mỗi bên hai hoặc ba lá (10, J, Q, K = 0; chỉ tính chữ số cuối).\n3. Bên gần 9 nhất thắng. Hòa: hoàn cược Con / Cái.',
      id: '1. Ketuk Pemain (×2), Bankir (×1,95) atau Seri (×9) untuk menaruh chip, lalu “Bagikan”.\n2. Dua atau tiga kartu per tangan (10, J, Q, K = 0; hanya digit terakhir yang dihitung).\n3. Tangan paling dekat ke 9 menang. Seri: taruhan Pemain / Bankir dikembalikan.',
      ru: '1. Нажмите Игрок (×2), Банкир (×1,95) или Ничья (×9), чтобы поставить фишку, затем «Раздать».\n2. Две или три карты на руку (10, J, Q, K = 0; считается только последняя цифра).\n3. Выигрывает рука ближе к 9. Ничья: ставки на Игрока / Банкира возвращаются.',
      de: '1. Tippe auf Spieler (×2), Bank (×1,95) oder Unentschieden (×9), um deinen Chip zu setzen, dann „Geben“.\n2. Zwei oder drei Karten pro Hand (10, B, D, K = 0; nur die letzte Ziffer zählt).\n3. Die Hand näher an 9 gewinnt. Unentschieden: Spieler- / Bank-Einsätze kommen zurück.',
      hi: '1. चिप रखने के लिए प्लेयर (×2), बैंकर (×1.95) या टाई (×9) दबाएँ, फिर “बाँटें”।\n2. हर हाथ में दो या तीन पत्ते (10, J, Q, K = 0; सिर्फ़ आख़िरी अंक गिना जाता है)।\n3. 9 के सबसे पास वाला हाथ जीतता है। टाई पर प्लेयर / बैंकर दांव वापस।',
      zh: '1. 点击 闲（×2）、庄（×1.95）或 和（×9）放下筹码，然后点“发牌”。\n2. 每边两张或三张牌（10、J、Q、K 计 0，只算个位数）。\n3. 最接近 9 点者赢。和局：闲 / 庄注全数退还。'
    },
    sicbo: {
      en: '1. Tap Small (total 4–10) or Big (total 11–17) to place your chip, then tap “Roll”.\n2. The 3 dice are shaken in the glass dome, then the total lights up on the band.\n3. Total on your side: ×2. A triple (3 same dice) loses both.',
      fr: '1. Touche Petit (total 4–10) ou Grand (total 11–17) pour poser ton jeton, puis « Lancer ».\n2. Les 3 dés sont secoués sous le dôme de verre, puis le total s’allume sur la bande.\n3. Total de ton côté : ×2. Un triple (3 dés pareils) fait perdre les deux.',
      es: '1. Toca Pequeño (total 4–10) o Grande (total 11–17) para poner tu ficha y luego “Lanzar”.\n2. Los 3 dados se agitan en la cúpula de cristal y el total se ilumina en la banda.\n3. Total de tu lado: ×2. Un trío (3 dados iguales) pierde ambos.',
      pt: '1. Toque em Pequeno (total 4–10) ou Grande (total 11–17) para colocar sua ficha e depois “Lançar”.\n2. Os 3 dados são agitados na cúpula de vidro e o total acende na faixa.\n3. Total do seu lado: ×2. Uma trinca (3 dados iguais) perde os dois.',
      ar: '1. المس صغير (المجموع 4–10) أو كبير (11–17) لوضع رقاقتك، ثم «ارمِ».\n2. تُهزّ النرود الثلاثة داخل القبة الزجاجية، ثم يضيء المجموع على الشريط.\n3. المجموع في جهتك: ×2. الثلاثية (3 نرود متماثلة) تخسر الجهتين.',
      tr: '1. Fişini koymak için Küçük (toplam 4–10) veya Büyük (11–17) seç, sonra “At”.\n2. 3 zar cam kubbede sallanır, toplam şeritte yanar.\n3. Toplam senin tarafında: ×2. Üçlü (3 aynı zar) iki tarafı da kaybettirir.',
      vi: '1. Chạm Xỉu (tổng 4–10) hoặc Tài (tổng 11–17) để đặt chip, rồi chạm “Lắc”.\n2. 3 xúc xắc được lắc trong vòm kính, tổng sáng lên trên dải số.\n3. Tổng đúng bên bạn: ×2. Bộ ba (3 mặt giống nhau) thua cả hai.',
      id: '1. Ketuk Kecil (total 4–10) atau Besar (total 11–17) untuk menaruh chip, lalu “Kocok”.\n2. 3 dadu dikocok di kubah kaca, lalu total menyala di pita angka.\n3. Total di sisimu: ×2. Triple (3 dadu sama) membuat keduanya kalah.',
      ru: '1. Нажмите Малое (сумма 4–10) или Большое (11–17), чтобы поставить фишку, затем «Бросить».\n2. 3 кубика трясутся под стеклянным куполом, затем сумма загорается на полосе.\n3. Сумма на вашей стороне: ×2. Тройка (3 одинаковых кубика) проигрывает обе.',
      de: '1. Tippe auf Klein (Summe 4–10) oder Groß (11–17), um deinen Chip zu setzen, dann „Würfeln“.\n2. Die 3 Würfel werden in der Glaskuppel geschüttelt, dann leuchtet die Summe auf dem Band.\n3. Summe auf deiner Seite: ×2. Ein Drilling (3 gleiche Würfel) verliert beide.',
      hi: '1. चिप रखने के लिए छोटा (कुल 4–10) या बड़ा (11–17) दबाएँ, फिर “फेंकें”।\n2. 3 पासे काँच के गुंबद में हिलाए जाते हैं, फिर कुल पट्टी पर चमकता है।\n3. कुल आपकी तरफ़: ×2। ट्रिपल (3 एक जैसे पासे) पर दोनों हारते हैं।',
      zh: '1. 点击 小（总点 4–10）或 大（11–17）放下筹码，然后点“摇骰”。\n2. 3 颗骰子在玻璃罩中摇动，总点数在号码条上亮起。\n3. 总点数在你一边：×2。围骰（3 颗相同）大小皆输。'
    }
  };
  ['dragon', 'baccarat', 'sicbo'].forEach(function (g) { K.register(g, table(g), { rules: RULES[g] }); });
})(window.D6 = window.D6 || {});
