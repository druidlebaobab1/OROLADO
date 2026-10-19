/* v2850 — LIVE 3 (owner request, round 6): 12 NEW live games, one shared round for everyone (same server engine as Lucky Planets
   and live2: casino_lib.php CASINO_LIVE3 + casino_draw_*, public state casino-tour.php?g=<key>, polled ~8 s, precise at close /
   result / next round). Odds = 0.94 ÷ exact chance, rounded down (6 % margin on every bet). ~2 min of bets, then the show.
   dtlive Dragon Tiger Live · hilolive High-Low Live · sicbolive Big Small Live · kenolive Keno Live · lucky10 Lucky Ten ·
   moneywheel Money Wheel · coinlive Coin Toss Live · pegdrop Peg Drop Live · football Goal Rush · bullseye Bullseye Live ·
   ladder Lucky Ladder · moonshot Moon Shot.
   Everything is drawn from (round n°, drawn result, time since bets closed): every viewer sees the same show, joining late too.
   One requestAnimationFrame loop (K.S.raf), attributes written only when they change, no filters per frame. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bo: 'Place your bets', lastc: 'Bets closing', bclosed: 'Bets closed', rs: 'Results', nx: 'Next round in', mc: 'Market closed', placed: 'Bet placed', bet: 'Place bet', pick: 'Make your choice first', odd: 'Odd', even: 'Even',
      dt: 'Dealing the cards', hl: 'Drawing the card', sb: 'Dice rolling', kd: 'Draw in progress', mw: 'Wheel spinning', co: 'Coins in the air', pd: 'Ball dropping', fb: 'Match in progress', be: 'Arrow in flight', la: 'Ball on the ladder', ms: 'Rocket in flight',
      dragon: 'Dragon', tiger: 'Tiger', tie: 'Tie', hi: 'Higher', lo: 'Lower', same: 'Same', small: 'Small', big: 'Big', triple: 'Triple', heads: 'Heads', tails: 'Tails' },
    fr: { bo: 'Pariez maintenant', lastc: 'Clôture des paris', bclosed: 'Paris fermés', rs: 'Résultats', nx: 'Prochain tour dans', mc: 'Marché fermé', placed: 'Pari enregistré', bet: 'Parier', pick: 'Faites d’abord votre choix', odd: 'Impair', even: 'Pair',
      dt: 'Distribution des cartes', hl: 'Tirage de la carte', sb: 'Lancer des dés', kd: 'Tirage en cours', mw: 'La roue tourne', co: 'Pièces en l’air', pd: 'La bille tombe', fb: 'Match en cours', be: 'Flèche en vol', la: 'Bille sur l’échelle', ms: 'Fusée en vol',
      dragon: 'Dragon', tiger: 'Tigre', tie: 'Égalité', hi: 'Plus haute', lo: 'Plus basse', same: 'Égale', small: 'Petit', big: 'Grand', triple: 'Triple', heads: 'Face', tails: 'Pile' },
    es: { bo: 'Apueste ahora', lastc: 'Cierre de apuestas', bclosed: 'Apuestas cerradas', rs: 'Resultados', nx: 'Próxima ronda en', mc: 'Mercado cerrado', placed: 'Apuesta registrada', bet: 'Apostar', pick: 'Elija primero', odd: 'Impar', even: 'Par',
      dt: 'Repartiendo cartas', hl: 'Sacando la carta', sb: 'Dados rodando', kd: 'Sorteo en curso', mw: 'La rueda gira', co: 'Monedas en el aire', pd: 'La bola cae', fb: 'Partido en curso', be: 'Flecha en vuelo', la: 'Bola en la escalera', ms: 'Cohete en vuelo',
      dragon: 'Dragón', tiger: 'Tigre', tie: 'Empate', hi: 'Mayor', lo: 'Menor', same: 'Igual', small: 'Pequeño', big: 'Grande', triple: 'Triple', heads: 'Cara', tails: 'Cruz' },
    pt: { bo: 'Aposte agora', lastc: 'Encerramento das apostas', bclosed: 'Apostas encerradas', rs: 'Resultados', nx: 'Próxima rodada em', mc: 'Mercado fechado', placed: 'Aposta registrada', bet: 'Apostar', pick: 'Escolha primeiro', odd: 'Ímpar', even: 'Par',
      dt: 'Distribuindo as cartas', hl: 'Tirando a carta', sb: 'Dados rolando', kd: 'Sorteio em andamento', mw: 'A roda está girando', co: 'Moedas no ar', pd: 'A bola está caindo', fb: 'Partida em andamento', be: 'Flecha em voo', la: 'Bola na escada', ms: 'Foguete em voo',
      dragon: 'Dragão', tiger: 'Tigre', tie: 'Empate', hi: 'Maior', lo: 'Menor', same: 'Igual', small: 'Pequeno', big: 'Grande', triple: 'Trio', heads: 'Cara', tails: 'Coroa' },
    ar: { bo: 'ضع رهانك الآن', lastc: 'الرهانات تُغلق قريبًا', bclosed: 'الرهانات مغلقة', rs: 'النتائج', nx: 'الجولة التالية خلال', mc: 'السوق مغلق', placed: 'تم تسجيل الرهان', bet: 'راهن', pick: 'اختر أولاً', odd: 'فردي', even: 'زوجي',
      dt: 'توزيع الأوراق', hl: 'سحب الورقة', sb: 'رمي النرد', kd: 'السحب جارٍ', mw: 'العجلة تدور', co: 'العملات في الهواء', pd: 'الكرة تسقط', fb: 'المباراة جارية', be: 'السهم في الهواء', la: 'الكرة على السلّم', ms: 'الصاروخ يحلّق',
      dragon: 'التنين', tiger: 'النمر', tie: 'تعادل', hi: 'أعلى', lo: 'أدنى', same: 'مساوية', small: 'صغير', big: 'كبير', triple: 'ثلاثي', heads: 'صورة', tails: 'كتابة' },
    tr: { bo: 'Bahislerinizi yapın', lastc: 'Bahisler kapanıyor', bclosed: 'Bahisler kapandı', rs: 'Sonuçlar', nx: 'Sonraki tur', mc: 'Piyasa kapalı', placed: 'Bahis alındı', bet: 'Bahis yap', pick: 'Önce seçiminizi yapın', odd: 'Tek', even: 'Çift',
      dt: 'Kartlar dağıtılıyor', hl: 'Kart çekiliyor', sb: 'Zarlar atılıyor', kd: 'Çekiliş sürüyor', mw: 'Çark dönüyor', co: 'Paralar havada', pd: 'Top düşüyor', fb: 'Maç sürüyor', be: 'Ok havada', la: 'Top merdivende', ms: 'Roket uçuşta',
      dragon: 'Ejderha', tiger: 'Kaplan', tie: 'Beraberlik', hi: 'Yüksek', lo: 'Düşük', same: 'Aynı', small: 'Küçük', big: 'Büyük', triple: 'Üçlü', heads: 'Tura', tails: 'Yazı' },
    vi: { bo: 'Mời đặt cược', lastc: 'Sắp đóng cược', bclosed: 'Đã đóng cược', rs: 'Kết quả', nx: 'Vòng tiếp theo sau', mc: 'Thị trường đóng cửa', placed: 'Đã đặt cược', bet: 'Đặt cược', pick: 'Hãy chọn trước', odd: 'Lẻ', even: 'Chẵn',
      dt: 'Đang chia bài', hl: 'Đang rút bài', sb: 'Đang lắc xúc xắc', kd: 'Đang quay số', mw: 'Bánh xe đang quay', co: 'Đồng xu trên không', pd: 'Bi đang rơi', fb: 'Trận đấu đang diễn ra', be: 'Mũi tên đang bay', la: 'Bi trên thang', ms: 'Tên lửa đang bay',
      dragon: 'Rồng', tiger: 'Hổ', tie: 'Hòa', hi: 'Cao hơn', lo: 'Thấp hơn', same: 'Bằng', small: 'Xỉu', big: 'Tài', triple: 'Bộ ba', heads: 'Ngửa', tails: 'Sấp' },
    id: { bo: 'Pasang taruhan Anda', lastc: 'Taruhan segera ditutup', bclosed: 'Taruhan ditutup', rs: 'Hasil', nx: 'Ronde berikutnya dalam', mc: 'Pasar tutup', placed: 'Taruhan tercatat', bet: 'Pasang', pick: 'Pilih dulu', odd: 'Ganjil', even: 'Genap',
      dt: 'Membagikan kartu', hl: 'Menarik kartu', sb: 'Dadu bergulir', kd: 'Undian berlangsung', mw: 'Roda berputar', co: 'Koin di udara', pd: 'Bola jatuh', fb: 'Pertandingan berlangsung', be: 'Panah melesat', la: 'Bola di tangga', ms: 'Roket meluncur',
      dragon: 'Naga', tiger: 'Harimau', tie: 'Seri', hi: 'Naik', lo: 'Turun', same: 'Sama', small: 'Kecil', big: 'Besar', triple: 'Triple', heads: 'Gambar', tails: 'Angka' },
    ru: { bo: 'Делайте ставки', lastc: 'Приём ставок завершается', bclosed: 'Ставки закрыты', rs: 'Результаты', nx: 'Следующий раунд через', mc: 'Рынок закрыт', placed: 'Ставка принята', bet: 'Поставить', pick: 'Сначала сделайте выбор', odd: 'Нечёт', even: 'Чёт',
      dt: 'Раздача карт', hl: 'Открываем карту', sb: 'Кости катятся', kd: 'Идёт розыгрыш', mw: 'Колесо крутится', co: 'Монеты в воздухе', pd: 'Шарик падает', fb: 'Идёт матч', be: 'Стрела в полёте', la: 'Шарик на лесенке', ms: 'Ракета в полёте',
      dragon: 'Дракон', tiger: 'Тигр', tie: 'Ничья', hi: 'Выше', lo: 'Ниже', same: 'Равно', small: 'Малое', big: 'Большое', triple: 'Тройка', heads: 'Орёл', tails: 'Решка' },
    de: { bo: 'Jetzt setzen', lastc: 'Einsätze schließen gleich', bclosed: 'Einsätze geschlossen', rs: 'Ergebnisse', nx: 'Nächste Runde in', mc: 'Markt geschlossen', placed: 'Einsatz platziert', bet: 'Setzen', pick: 'Bitte zuerst wählen', odd: 'Ungerade', even: 'Gerade',
      dt: 'Karten werden verteilt', hl: 'Karte wird gezogen', sb: 'Würfel rollen', kd: 'Ziehung läuft', mw: 'Das Rad dreht sich', co: 'Münzen in der Luft', pd: 'Die Kugel fällt', fb: 'Spiel läuft', be: 'Pfeil im Flug', la: 'Kugel auf der Leiter', ms: 'Rakete im Flug',
      dragon: 'Drache', tiger: 'Tiger', tie: 'Gleichstand', hi: 'Höher', lo: 'Tiefer', same: 'Gleich', small: 'Klein', big: 'Groß', triple: 'Drilling', heads: 'Kopf', tails: 'Zahl' },
    hi: { bo: 'अभी दांव लगाएं', lastc: 'दांव बंद होने वाले हैं', bclosed: 'दांव बंद', rs: 'नतीजे', nx: 'अगला राउंड', mc: 'बाज़ार बंद', placed: 'दांव दर्ज हुआ', bet: 'दांव लगाएं', pick: 'पहले चुनें', odd: 'विषम', even: 'सम',
      dt: 'पत्ते बाँटे जा रहे हैं', hl: 'पत्ता खुल रहा है', sb: 'पासे लुढ़क रहे हैं', kd: 'ड्रॉ जारी है', mw: 'पहिया घूम रहा है', co: 'सिक्के हवा में', pd: 'गेंद गिर रही है', fb: 'मैच जारी है', be: 'तीर उड़ान में', la: 'गेंद सीढ़ी पर', ms: 'रॉकेट उड़ान में',
      dragon: 'ड्रैगन', tiger: 'टाइगर', tie: 'टाई', hi: 'ऊँचा', lo: 'नीचा', same: 'बराबर', small: 'छोटा', big: 'बड़ा', triple: 'ट्रिपल', heads: 'चित', tails: 'पट' },
    zh: { bo: '请下注', lastc: '即将停止下注', bclosed: '停止下注', rs: '开奖结果', nx: '下一局', mc: '暂停交易', placed: '已下注', bet: '下注', pick: '请先选择', odd: '单', even: '双',
      dt: '发牌中', hl: '开牌中', sb: '摇骰中', kd: '开奖中', mw: '转轮中', co: '硬币翻转中', pd: '小球下落中', fb: '比赛进行中', be: '箭在飞行', la: '小球下梯中', ms: '火箭飞行中',
      dragon: '龙', tiger: '虎', tie: '和', hi: '更大', lo: '更小', same: '相同', small: '小', big: '大', triple: '围骰', heads: '正面', tails: '反面' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  // rules: intro + step 2 are shared; each game gives steps 1 and 3 in 12 languages
  var R_INTRO = { en: '🔴 LIVE: a new round every {P} s, the same for everyone.', fr: '🔴 EN DIRECT : un tour toutes les {P} s, le même pour tout le monde.', es: '🔴 EN VIVO: una ronda cada {P} s, la misma para todos.',
    pt: '🔴 AO VIVO: uma rodada a cada {P} s, a mesma para todos.', ar: '🔴 مباشر: جولة جديدة كل {P} ثانية، نفسها للجميع.', tr: '🔴 CANLI: her {P} sn’de yeni bir tur, herkes için aynı.',
    vi: '🔴 TRỰC TIẾP: mỗi {P} giây một vòng, giống nhau cho mọi người.', id: '🔴 LANGSUNG: ronde baru tiap {P} dtk, sama untuk semua.', ru: '🔴 В ПРЯМОМ ЭФИРЕ: новый раунд каждые {P} с, общий для всех.',
    de: '🔴 LIVE: alle {P} s eine neue Runde, für alle gleich.', hi: '🔴 लाइव: हर {P} सेकंड में नया राउंड, सबके लिए एक जैसा।', zh: '🔴 直播：每 {P} 秒一局，所有人同一结果。' };
  var R_STEP2 = { en: '2. Set your stake and tap “Place bet” before bets close. One bet per round.', fr: '2. Choisis ta mise et touche « Parier » avant la fermeture des paris. Un pari par tour.',
    es: '2. Elige tu apuesta y toca «Apostar» antes del cierre. Una apuesta por ronda.', pt: '2. Escolha o valor e toque em «Apostar» antes do fechamento. Uma aposta por rodada.',
    ar: '2. اختر مبلغ الرهان والمس «راهن» قبل إغلاق الرهانات. رهان واحد لكل جولة.', tr: '2. Tutarını seç ve bahisler kapanmadan “Bahis yap”a dokun. Her turda bir bahis.',
    vi: '2. Chọn mức cược và chạm «Đặt cược» trước khi đóng cược. Mỗi vòng một cược.', id: '2. Atur taruhan lalu sentuh «Pasang» sebelum taruhan ditutup. Satu taruhan per ronde.',
    ru: '2. Выберите сумму и нажмите «Поставить» до закрытия ставок. Одна ставка за раунд.', de: '2. Wähle deinen Einsatz und tippe auf „Setzen“, bevor die Einsätze schließen. Ein Einsatz pro Runde.',
    hi: '2. राशि चुनें और दांव बंद होने से पहले «दांव लगाएं» छुएं। हर राउंड में एक दांव।', zh: '2. 设定金额，在停止下注前点击“下注”。每局一注。' };
  function rules(P, R) { var o = {}; Object.keys(R_INTRO).forEach(function (lg) { var r = R[lg] || R.en; o[lg] = R_INTRO[lg].replace('{P}', P) + '\n1. ' + r[0] + '\n' + R_STEP2[lg] + '\n3. ' + r[1]; }); return o; }
  function mmss(v) { v = Math.max(0, Math.ceil(v)); return Math.floor(v / 60) + ':' + (v % 60 < 10 ? '0' : '') + (v % 60); }
  function cl01(k) { return Math.max(0, Math.min(1, k)); }
  function seg(e, a, b) { return cl01((e - a) / (b - a)); }
  function eio(k) { k = cl01(k); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function eo(k) { k = cl01(k); return 1 - Math.pow(1 - k, 3); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  // stable pseudo-random from (round n°, k): the same on every phone
  function hr(a, b) { var h = ((a | 0) ^ Math.imul(b | 0, 0x9E3779B1)) >>> 0; h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B) >>> 0; h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function sa(el, n, v) { if (!el) return; var c = el._c || (el._c = {}); if (c[n] !== v) { c[n] = v; el.setAttribute(n, v); } }
  function tr(x, y, s, r) { return 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' + (s != null && s !== 1 ? ' scale(' + s.toFixed(3) + ')' : '') + (r ? ' rotate(' + r.toFixed(1) + ')' : ''); }
  function txt(el, v) { if (el && el.textContent !== v) el.textContent = v; }
  function cls(el, v) { sa(el, 'class', v); }
  function pollDelay(R, t, hasRes) {
    if (t < R.close) { var a = R.close - t; return a > 14 ? Math.min(8000, (a - 10) * 1000) : a > 1.3 ? Math.min(2500, (a - 1.1) * 1000) : Math.max(100, (a + 0.1) * 1000); }
    if (!hasRes) return 400;
    var b = R.end - t; return b > 14 ? Math.min(8000, (b - 10) * 1000) : b > 1.3 ? Math.min(2500, (b - 1.1) * 1000) : Math.max(150, (b + 0.25) * 1000);
  }
  function normOdds(o) { var r = {}; if (!o) return r; if (Array.isArray(o)) o.forEach(function (v, i) { r[String(i)] = +v; }); else Object.keys(o).forEach(function (k) { r[k] = +o[k]; }); return r; }
  var GID = 0;
  function rgd(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="' + a + '"/><stop offset=".6" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lgd(id, a, b, v) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (v ? 0 : 1) + '" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  function fmtX(x) { return (x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.floor(x).toString()); }

  /* ======================================================= shared live engine ===================================================== */
  // G: { SHOW (s) or show(res), lab, odds0, varOdds, rules, scene(uid,l), board(uid,l,oddTxt,odds), init(c), frame(c,R,t,e,res,odds),
  //      wins(res) → winning selections, hist(n,c), beat(e,res,R) → int that changes at each highlight, bev: sound event name }
  function live(key, G) {
    var showOf = function (res) { return G.show ? G.show(res) : G.SHOW; };
    K.register(key, function (box) {
      var l = L(), uid = ++GID, dc = K.dec();
      var oddTxt = function (v) { return v == null || !isFinite(v) ? '×–' : '×' + Number(v).toFixed(2).replace('.', dc); };
      box.classList.add('cg-game', 'cg-live3', 'cg-' + key);
      box.innerHTML = '<div class="cg-stage l3-stage" data-ph="open"><div class="l3-head"><span class="l3-live"><i></i><b>LIVE</b></span><b class="l3-ph fit"></b><em class="l3-tm fit"></em></div>' +
        '<i class="l3-bar"><b></b></i>' +
        '<div class="l3-scene"><svg class="l3-svg" viewBox="0 0 360 230" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + G.scene(uid, l) + '</svg></div>' +
        '<div class="l3-last"></div></div>' +
        K.stakePanel(l.bet, '<div class="l3-board l3-b-' + key + '" dir="ltr">' + G.board(uid, l, oddTxt, G.odds0 || {}) + '</div>');
      K.bindStake(box);
      var q = function (s) { return box.querySelector(s); };
      var ph = q('.l3-ph'), tm = q('.l3-tm'), bar = q('.l3-bar b'), barB = q('.l3-bar'), go = $('csGo'), stage = q('.l3-stage'), lastEl = q('.l3-last'), svg = q('.l3-svg');
      var st = { R: null, me: null, sel: null, off: 0, first: true, shown: null, busy: false, lastKey: '', mk: '', odds: Object.assign({}, G.odds0 || {}), cls: '' };
      var ctx = { box: box, svg: svg, uid: uid, l: l, oddTxt: oddTxt, dc: dc, q: q, st: st };
      G.init(ctx);
      var nowS = function () { return Date.now() / 1000 + st.off; };
      var locked = function () { return !!(st.me && st.R && st.me.rid === st.R.i); };
      var choose = function (s) { if (locked() || s == null) return; st.sel = String(s); st.mk = ''; K.sfx('click'); };
      box.querySelectorAll('[data-s]').forEach(function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-s')); }); });
      box.addEventListener('stake', function () { st.mk = ''; });
      go.addEventListener('click', async function () {
        var R = st.R; if (st.busy || !R || locked() || nowS() >= R.close) return;
        if (st.sel == null) { K.toast(l.pick); return; }
        if (st.odds[st.sel] == null) return; // High-Low: odds of the new round not arrived yet
        st.busy = true; go.disabled = true;
        var r = await K.multi(key, 'bet', { sel: st.sel });
        st.busy = false;
        if (r) { st.me = r; if (r.round) { st.R = r.round; if (r.round.odds) st.odds = normOdds(r.round.odds); } st.mk = ''; }
      });
      var alive = function () { return box.isConnected && K.S.game === key; };
      var sync = async function () {
        if (!alive()) return;
        var r = null;
        try { var rq = await fetch('casino-tour.php?g=' + key, { cache: 'no-store' }); r = await rq.json(); } catch (e) { r = null; }
        if ((!r || !r.ok) && !K.guest()) { r = await K.multi(key, 'dround', null, true); if (r) r.mine = 1; }
        if (!alive()) return;
        var delay = 4000;
        if (r && r.round) {
          st.off = r.now - Date.now() / 1000; st.R = r.round; st.fails = 0;
          if (r.round.odds) { st.odds = normOdds(r.round.odds); st.mk = ''; }
          delay = pollDelay(st.R, nowS(), !!st.R.res);
        } else { st.fails = (st.fails || 0) + 1; delay = Math.min(10000, 1500 * st.fails); }
        clearTimeout(K.S.timer); K.S.timer = setTimeout(sync, delay);
        if (!r || !r.round) return;
        var mine = r.mine ? r : null, open0 = st.me && !st.me.done;
        if (!K.guest() && !mine && (st.first || (open0 && st.R.res && st.R.i >= (st.me.rid || 0)))) {
          mine = await K.multi(key, 'dround', null, true);
          if (!alive()) return;
        }
        if (mine && mine.round) { st.me = mine.has ? mine : null; if (st.first) { st.first = false; if (st.me && st.me.done) st.shown = st.me.ref; } st.mk = ''; }
      };
      var showMine = function (t) {
        var me = st.me, R = st.R;
        if (!me || !me.done || !me.ref || st.shown === me.ref || !R) return;
        if (me.rid === R.i && (!R.res || t < R.close + showOf(R.res))) return; // the amount only once the show is over
        st.shown = me.ref;
        K.resultLine(box, me);
      };
      var wasWin = '';
      var amb = function (on, k) { try { if (D6.Sfx && D6.Sfx.amb) D6.Sfx.amb(key, on, k); } catch (eA) { /* ignore */ } };
      var ambOn = false;
      var tick = function () {
        if (!alive()) { if (ambOn) { ambOn = false; amb(false); } return; }
        var R = st.R;
        if (R) {
          var t = nowS();
          if (t >= R.end + 0.6) { // round over: the next one is already open (the server confirms at the next poll)
            var lst = (R.last || []).slice(); if (R.res) lst.unshift(+R.res.n);
            st.R = R = { i: R.i + 1, t0: R.end, close: R.end + R.B, end: R.end + R.P, P: R.P, B: R.B, phase: 'bet', last: lst.slice(0, 6) };
            if (G.varOdds) { st.odds = {}; st.mk = ''; }
          }
          var bet = t < R.close, e = t - R.close, res = R.res || null, SH = res ? showOf(res) : 99, rev = !!res && e >= SH;
          if (bet) {
            var left = R.close - t;
            K.setText(ph, left <= 10 ? l.lastc : l.bo); K.setText(tm, mmss(left));
            bar.style.transform = 'scaleX(' + cl01(left / R.B).toFixed(4) + ')';
          } else {
            var rs = rev && e < SH + 5; // « Results » a few seconds, then « Next round in 0:41 »
            K.setText(ph, rs ? l.rs : rev ? l.nx : (res ? l[G.lab] : l.bclosed)); K.setText(tm, rev && !rs ? mmss(R.end - t) : '');
            bar.style.transform = 'scaleX(0)';
          }
          var cl = bet ? (R.close - t <= 10 ? 'warn' : 'open') : 'shut';
          if (st.cls !== cl) { st.cls = cl; barB.className = 'l3-bar ' + cl; stage.setAttribute('data-ph', cl); }
          G.frame(ctx, R, t, e, bet ? null : res, st.odds);
          if (bet) st.goArm = R.i; else if (st.goArm === R.i && e < 1.5) { st.goArm = -1; K.sfx('go'); }
          if (!bet && res && e >= 0 && e < SH && G.beat) K.sfxBeat(st, 'bt', G.beat(e, res, R), G.bev || 'tick');
          // v2850 : ambiance pendant le suspense (API D6.Sfx.amb, si présente), coupée au résultat ou en quittant le jeu
          var aOn = !bet && !!res && e >= 0 && e < SH;
          if (aOn !== ambOn || (aOn && G.amb && ((st.ambT = (st.ambT || 0) + 1) % 30 === 0))) { ambOn = aOn; amb(aOn, aOn ? (G.amb ? G.amb(e, res, SH) : cl01(.4 + .6 * e / SH)) : 0); }
          if (rev && st.revI !== R.i && e < SH + 1.5) { st.revI = R.i; try { if (D6.Sfx && D6.Sfx.play) D6.Sfx.play(G.endEv || 'whoosh', null, key); } catch (eP) { /* ignore */ } }
          var wins = rev ? G.wins(res).join(',') : '';
          if (wins !== wasWin) {
            wasWin = wins; var ws = wins ? wins.split(',') : [];
            stage.classList.toggle('l3-done', !!wins);
            box.querySelectorAll('[data-s]').forEach(function (b) { b.classList.toggle('win', ws.indexOf(b.getAttribute('data-s')) >= 0); });
          }
          var list = (R.last || []).slice(); if (rev) list.unshift(+res.n);
          var lk = R.i + ':' + list.join(',');
          if (lk !== st.lastKey) { st.lastKey = lk; lastEl.innerHTML = list.slice(0, 12).map(function (v, j) { return '<i class="l3-li' + (j === 0 && rev ? ' new' : '') + '">' + G.hist(+v, ctx) + '</i>'; }).join(''); }
          var mineNow = !!(st.me && st.me.rid === R.i);
          if (mineNow) { K.setText(go, l.placed + ' · ' + oddTxt(st.odds[st.me.sel])); go.disabled = true; go.classList.add('placed'); go.classList.remove('wait'); }
          else if (!bet) { K.setText(go, l.bclosed); go.disabled = true; go.classList.remove('placed'); go.classList.add('wait'); }
          else { K.setText(go, st.sel == null || st.odds[st.sel] == null ? l.bet : l.bet + ' · ' + oddTxt(st.odds[st.sel])); go.disabled = st.busy; go.classList.remove('placed', 'wait'); }
          var sel = mineNow ? String(st.me.sel) : st.sel;
          var mk = [sel, mineNow ? 1 : 0, JSON.stringify(st.odds)].join('|');
          if (mk !== st.mk) {
            st.mk = mk;
            box.querySelectorAll('[data-s]').forEach(function (b) { var s = b.getAttribute('data-s'); b.classList.toggle('on', s === sel); b.classList.toggle('mine', mineNow && s === sel); });
            box.querySelectorAll('[data-o]').forEach(function (x) { var v = oddTxt(st.odds[x.getAttribute('data-o')]); if (x.textContent !== v) { x.textContent = v; if (x.classList.contains('fit')) K.fitEl(x); } });
            box.querySelectorAll('[data-s]').forEach(function (b) { b.classList.toggle('off', !!G.varOdds && st.odds[b.getAttribute('data-s')] == null); });
          }
          showMine(t);
        } else {
          G.frame(ctx, null, nowS(), -1, null, st.odds);
          if ((st.fails || 0) >= 2) { K.setText(ph, l.mc); K.setText(tm, ''); }
        }
        K.S.raf = requestAnimationFrame(tick);
      };
      requestAnimationFrame(function () { K.fitAll(box); });
      sync(); tick();
    }, { rules: G.rules });
  }

  /* ============================================== cards (Dragon Tiger, High-Low) =============================================== */
  var SUIT = ['M0-6.6C2.6-3.4 6.2-1 6.2 2.2C6.2 4.8 3.4 6 1.2 4.4L2.2 7.4H-2.2L-1.2 4.4C-3.4 6-6.2 4.8-6.2 2.2C-6.2-1-2.6-3.4 0-6.6Z',
    'M0 6.4C-4.4 3.2-6.4.4-6.4-2.2C-6.4-4.6-4.6-6.2-2.8-6.2C-1.4-6.2-.4-5.4 0-4.4C.4-5.4 1.4-6.2 2.8-6.2C4.6-6.2 6.4-4.6 6.4-2.2C6.4.4 4.4 3.2 0 6.4Z',
    'M0-6.8L5.2 0L0 6.8L-5.2 0Z',
    'M0-6.6A2.9 2.9 0 1 1 -.01-6.6ZM-3.2-.8A2.9 2.9 0 1 1 -3.21-.8ZM3.2-.8A2.9 2.9 0 1 1 3.19-.8ZM-1 1.4L-2.2 6.8H2.2L1 1.4Z'];
  function suitP(s, fill, tf) { return '<path d="' + SUIT[s] + '" fill="' + fill + '"' + (tf ? ' transform="' + tf + '"' : '') + '/>'; }
  function rankTxt(r) { return r === 1 || r === 14 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r); }
  function cardFace(r, s) {
    var red = s === 1 || s === 2, c = red ? '#DC2626' : '#111827';
    var cS = s === 3 ? '<g fill="' + c + '" transform="translate(0 4) scale(2.3)"><path d="' + SUIT[3] + '"/></g>' : suitP(s, c, 'translate(0 4) scale(2.3)');
    return '<rect x="-22" y="-31" width="44" height="62" rx="5" fill="#FFFDF7" stroke="#CBD5E1" stroke-width=".8"/>' +
      '<rect x="-19" y="-28" width="38" height="56" rx="3.5" fill="none" stroke="' + c + '" stroke-opacity=".18"/>' +
      '<text x="-15" y="-15" text-anchor="middle" class="cd-r" fill="' + c + '">' + rankTxt(r) + '</text>' + suitP(s, c, 'translate(-15 -6) scale(.75)') +
      '<text x="15" y="23" text-anchor="middle" class="cd-r" fill="' + c + '" transform="rotate(180 15 19)">' + rankTxt(r) + '</text>' + cS;
  }
  function cardBack(uid, tone) {
    var a = tone || ['#7F1D1D', '#B91C1C'];
    return '<rect x="-22" y="-31" width="44" height="62" rx="5" fill="' + a[0] + '" stroke="#FDE68A" stroke-width="1.2"/>' +
      '<rect x="-17" y="-26" width="34" height="52" rx="3" fill="' + a[1] + '" stroke="#FDE68A" stroke-opacity=".55" stroke-dasharray="2 2"/>' +
      '<path d="M0-12L9 0L0 12L-9 0Z" fill="#FDE68A" opacity=".9"/><path d="M0-6L4.5 0L0 6L-4.5 0Z" fill="' + a[0] + '"/>';
  }
  function cardEl(cl, uid, tone) { return '<g class="cd ' + cl + '" opacity="0"><g class="cd-in"><g class="cd-f"></g><g class="cd-b">' + cardBack(uid, tone) + '</g></g></g>'; }
  function cardSet(c, k, r, s) { var key = r + ':' + s; if (c.face === key) return; c.face = key; c.f.innerHTML = r ? cardFace(r, s) : ''; }
  function cardInit(g) { return { g: g, inn: g.querySelector('.cd-in'), f: g.querySelector('.cd-f'), b: g.querySelector('.cd-b'), face: '' }; }
  // flip k: 0 = back, 1 = face (scaleX through 0)
  function cardPose(c, x, y, s, rot, flip, op) {
    sa(c.g, 'opacity', op == null ? '1' : String(op)); sa(c.g, 'transform', tr(x, y, s, rot));
    var sx = Math.abs(Math.cos(cl01(flip) * Math.PI)); sa(c.inn, 'transform', 'scale(' + Math.max(.02, sx).toFixed(3) + ' 1)');
    var face = flip >= .5; sa(c.f, 'opacity', face ? '1' : '0'); sa(c.b, 'opacity', face ? '0' : '1');
  }
  function dtEmblem(d, uid) {
    if (d) return '<circle r="17" fill="url(#dtE1' + uid + ')" stroke="#FDE68A" stroke-width="1.4"/>' + // tiger: orange face, black stripes
      '<path d="M-12-11l-3-7 8 3zM12-11l3-7-8 3z" fill="#EA580C" stroke="#7C2D12" stroke-width=".8"/>' +
      '<path d="M-14-2l6 2M-14 4l6 0M14-2l-6 2M14 4l-6 0M-4-15l2 5M4-15l-2 5M0-16v5" stroke="#1C1917" stroke-width="2" stroke-linecap="round"/>' +
      '<ellipse cx="-6" cy="-3" rx="2.6" ry="2" fill="#FEF3C7"/><ellipse cx="6" cy="-3" rx="2.6" ry="2" fill="#FEF3C7"/><circle cx="-6" cy="-3" r="1.1" fill="#14532D"/><circle cx="6" cy="-3" r="1.1" fill="#14532D"/>' +
      '<ellipse cy="7" rx="7" ry="5" fill="#FFF7ED"/><path d="M-2 4h4l-2 2.4z" fill="#1C1917"/><path d="M0 6.4v2M-3 9q3 2 6 0" stroke="#1C1917" stroke-width="1" fill="none"/>';
    return '<circle r="17" fill="url(#dtE0' + uid + ')" stroke="#FDE68A" stroke-width="1.4"/>' + // dragon: red head, golden horns and whiskers
      '<path d="M-9-10q-4-9 2-12q-1 6 3 9zM9-10q4-9-2-12q1 6-3 9z" fill="#FBBF24" stroke="#92400E" stroke-width=".7"/>' +
      '<path d="M-11-4q11-9 22 0q2 9-4 14h-14q-6-5-4-14z" fill="#DC2626" stroke="#7F1D1D" stroke-width=".8"/>' +
      '<path d="M-7-3l5 1.5M7-3l-5 1.5" stroke="#FDE68A" stroke-width="2.2" stroke-linecap="round"/><circle cx="-5" cy="-1.2" r="1.1" fill="#111"/><circle cx="5" cy="-1.2" r="1.1" fill="#111"/>' +
      '<path d="M-4 7q4 3 8 0" stroke="#FDE68A" stroke-width="1.4" fill="none"/><path d="M-6 5q-9 2-12 9M6 5q9 2 12 9" stroke="#FBBF24" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="-2.5" cy="3.5" r=".9" fill="#7F1D1D"/><circle cx="2.5" cy="3.5" r=".9" fill="#7F1D1D"/>';
  }
  function dtMini(n) { var u = 'm' + (++GID); return '<svg viewBox="-19 -19 38 38" aria-hidden="true"><defs>' + rgd('dtE0' + u, '#FCA5A5', '#B91C1C', '#450A0A') + rgd('dtE1' + u, '#FED7AA', '#F97316', '#7C2D12') + '</defs>' + (n === 2 ? '<circle r="17" fill="#15803D" stroke="#BBF7D0" stroke-width="1.6"/><path d="M-8-3.5h16M-8 3.5h16" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>' : dtEmblem(n, u)) + '</svg>'; }
  live('dtlive', {
    SHOW: 10, lab: 'dt', bev: 'card', endEv: 'coin', odds0: { d: 2.03, t: 2.03, x: 12.22 },
    beat: function (e) { var T = [0, 1.2, 3, 5.6, 7.2], n = 0; T.forEach(function (x) { if (e >= x) n++; }); return n; },
    rules: rules(150, {
      en: ['Bet on Dragon or Tiger (×2.03), or on a Tie (×12.22).', 'One card is dealt to the Dragon, one to the Tiger: the higher card wins (A is the lowest, K the highest; suits do not count). On a tie, Dragon and Tiger bets lose; the Tie bet wins.'],
      fr: ['Parie sur le Dragon ou le Tigre (×2,03), ou sur l’Égalité (×12,22).', 'Une carte pour le Dragon, une pour le Tigre : la plus haute gagne (l’As est la plus basse, le Roi la plus haute ; les couleurs ne comptent pas). En cas d’égalité, Dragon et Tigre perdent ; l’Égalité gagne.'],
      es: ['Apuesta al Dragón o al Tigre (×2,03), o al Empate (×12,22).', 'Una carta para el Dragón y otra para el Tigre: gana la más alta (el As es la más baja, el Rey la más alta; los palos no cuentan). Si empatan, Dragón y Tigre pierden; gana el Empate.'],
      pt: ['Aposte no Dragão ou no Tigre (×2,03), ou no Empate (×12,22).', 'Uma carta para o Dragão e outra para o Tigre: vence a mais alta (o Ás é a mais baixa, o Rei a mais alta; os naipes não contam). Em caso de empate, Dragão e Tigre perdem; o Empate ganha.'],
      ar: ['راهن على التنين أو النمر (×2.03)، أو على التعادل (×12.22).', 'ورقة للتنين وورقة للنمر: الأعلى تفوز (الآس أدنى ورقة والملك أعلاها؛ الأشكال لا تُحتسب). عند التعادل يخسر رهانا التنين والنمر ويربح رهان التعادل.'],
      tr: ['Ejderha’ya veya Kaplan’a (×2,03) ya da Beraberliğe (×12,22) oyna.', 'Ejderha’ya bir kart, Kaplan’a bir kart açılır: yüksek olan kazanır (As en düşük, Papaz en yüksek; renkler sayılmaz). Beraberlikte Ejderha ve Kaplan kaybeder, Beraberlik kazanır.'],
      vi: ['Cược Rồng hoặc Hổ (×2,03), hoặc Hòa (×12,22).', 'Rồng nhận một lá, Hổ nhận một lá: lá cao hơn thắng (A thấp nhất, K cao nhất; chất không tính). Nếu hòa, cược Rồng và Hổ thua; cược Hòa thắng.'],
      id: ['Pasang Naga atau Harimau (×2,03), atau Seri (×12,22).', 'Satu kartu untuk Naga, satu untuk Harimau: kartu lebih tinggi menang (As terendah, King tertinggi; jenis kartu tidak dihitung). Jika seri, taruhan Naga dan Harimau kalah; Seri menang.'],
      ru: ['Ставьте на Дракона или Тигра (×2,03) либо на Ничью (×12,22).', 'Дракону и Тигру сдаётся по карте: побеждает старшая (туз — младшая, король — старшая; масти не важны). При ничьей ставки на Дракона и Тигра проигрывают, ставка на Ничью выигрывает.'],
      de: ['Setze auf Drache oder Tiger (×2,03) oder auf Gleichstand (×12,22).', 'Eine Karte für den Drachen, eine für den Tiger: die höhere gewinnt (Ass ist die niedrigste, König die höchste; Farben zählen nicht). Bei Gleichstand verlieren Drache und Tiger; Gleichstand gewinnt.'],
      hi: ['ड्रैगन या टाइगर (×2.03), या टाई (×12.22) पर दांव लगाएं।', 'ड्रैगन को एक पत्ता, टाइगर को एक पत्ता: बड़ा पत्ता जीतता है (इक्का सबसे छोटा, बादशाह सबसे बड़ा; रंग नहीं गिने जाते)। टाई होने पर ड्रैगन और टाइगर के दांव हारते हैं; टाई जीतता है।'],
      zh: ['押龙或虎（×2.03），或押和（×12.22）。', '龙和虎各发一张牌：点大者胜（A 最小，K 最大，不比花色）。若点数相同，押龙和押虎皆输，押和胜。']
    }),
    scene: function (uid) {
      var side = function (x, d) {
        var c = d ? ['#1E3A8A', '#F97316'] : ['#7F1D1D', '#FBBF24'];
        return '<g class="dt-side' + (d ? ' t' : ' d') + '"><rect x="' + (x - 62) + '" y="40" width="124" height="166" rx="16" fill="' + c[0] + '" fill-opacity=".55" stroke="' + c[1] + '" stroke-opacity=".7" stroke-width="1.6"/>' +
          '<rect class="dt-glow" x="' + (x - 62) + '" y="40" width="124" height="166" rx="16" fill="none" stroke="#FDE68A" stroke-width="3" opacity="0"/>' +
          '<g transform="translate(' + x + ' 70)">' + dtEmblem(d, uid) + '</g>' +
          '<rect x="' + (x - 26) + '" y="104" width="52" height="70" rx="7" fill="none" stroke="#FDE68A" stroke-opacity=".45" stroke-dasharray="3 3"/></g>';
      };
      return '<defs>' + rgd('dtE0' + uid, '#FCA5A5', '#B91C1C', '#450A0A') + rgd('dtE1' + uid, '#FED7AA', '#F97316', '#7C2D12') +
        '<radialGradient id="dtF' + uid + '" cx="50%" cy="20%" r="85%"><stop offset="0" stop-color="#14532D"/><stop offset="1" stop-color="#052E16"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#04130B"/><rect x="6" y="4" width="348" height="222" rx="20" fill="url(#dtF' + uid + ')" stroke="#B45309" stroke-width="3"/>' +
        side(92, 0) + side(268, 1) +
        '<rect x="160" y="10" width="40" height="22" rx="5" fill="#1C1917" stroke="#B45309"/><path d="M164 32h32l-6 6h-20z" fill="#292524"/>' +
        '<text class="dt-vs" x="180" y="118" text-anchor="middle">VS</text><text class="dt-cd" x="180" y="146" text-anchor="middle"></text>' +
        '<text class="dt-big" x="180" y="221" text-anchor="middle"></text>' +
        cardEl('dt-c0', uid) + cardEl('dt-c1', uid);
    },
    board: function (uid, l, oddTxt, o) {
      return '<button type="button" data-s="d" class="dt-b d">' + dtMini(0) + '<span class="fit">' + K.esc(l.dragon) + '</span><b class="fit" data-o="d">' + oddTxt(o.d) + '</b></button>' +
        '<button type="button" data-s="x" class="dt-b x">' + dtMini(2) + '<span class="fit">' + K.esc(l.tie) + '</span><b class="fit" data-o="x">' + oddTxt(o.x) + '</b></button>' +
        '<button type="button" data-s="t" class="dt-b t">' + dtMini(1) + '<span class="fit">' + K.esc(l.tiger) + '</span><b class="fit" data-o="t">' + oddTxt(o.t) + '</b></button>';
    },
    hist: function (n) { return dtMini(n); },
    wins: function (res) { return [['d', 't', 'x'][+res.n]]; },
    init: function (c) { c.c0 = cardInit(c.q('.dt-c0')); c.c1 = cardInit(c.q('.dt-c1')); c.cd = c.q('.dt-cd'); c.vs = c.q('.dt-vs'); c.big = c.q('.dt-big'); c.gl = [].slice.call(c.box.querySelectorAll('.dt-glow')); },
    frame: function (c, R, t, e, res) {
      if (!res) {
        cardPose(c.c0, 180, 21, .5, 0, 0, 0); cardPose(c.c1, 180, 21, .5, 0, 0, 0);
        var on = !!R && e < 0; txt(c.cd, on ? mmss(R.close - t) : ''); cls(c.cd, 'dt-cd' + (on && R.close - t <= 10 ? ' warn' : ''));
        sa(c.vs, 'opacity', '1'); txt(c.big, ''); c.gl.forEach(function (g) { sa(g, 'opacity', '0'); });
        return;
      }
      cardSet(c.c0, 0, +res.d, +(res.s || [0, 0])[0]); cardSet(c.c1, 0, +res.t, +(res.s || [0, 0])[1]);
      var k0 = eio(seg(e, 0, 1.1)), k1 = eio(seg(e, 1.2, 2.3));
      cardPose(c.c0, lerp(180, 92, k0), lerp(21, 139, k0), lerp(.5, 1.05, k0), lerp(-30, 0, k0), seg(e, 3, 4), e > 0 ? 1 : 0);
      cardPose(c.c1, lerp(180, 268, k1), lerp(21, 139, k1), lerp(.5, 1.05, k1), lerp(30, 0, k1), seg(e, 5.6, 6.6), e > 1.2 ? 1 : 0);
      sa(c.vs, 'opacity', e < 7.2 ? '1' : '.25'); txt(c.cd, '');
      var n = +res.n, w = e >= 7.2;
      sa(c.gl[0], 'opacity', w && n !== 1 ? (.6 + .4 * Math.sin(t * 6)).toFixed(2) : '0'); sa(c.gl[1], 'opacity', w && n !== 0 ? (.6 + .4 * Math.sin(t * 6)).toFixed(2) : '0');
      txt(c.big, w ? [c.l.dragon, c.l.tiger, c.l.tie][n] : ''); cls(c.big, 'dt-big n' + n);
    }
  });

  live('hilolive', {
    SHOW: 7, lab: 'hl', bev: 'card', endEv: 'coin', varOdds: true, odds0: {},
    beat: function (e) { return (e >= .4) + (e >= 2.6) + (e >= 4.2); },
    rules: rules(145, {
      en: ['The base card (3 to K) is shown during the bets. Guess the next card: Higher, Lower or Same. The payouts of the round depend on the base card (the riskier, the bigger).', 'The next card (2 to A, A is the highest) is drawn at random from a full deck: if your guess is right, you win stake × its payout. Suits do not count.'],
      fr: ['La carte de base (3 à Roi) est montrée pendant les paris. Devine la suivante : Plus haute, Plus basse ou Égale. Les gains du tour dépendent de la carte de base (plus c’est risqué, plus ça paie).', 'La carte suivante (2 à As, l’As est la plus haute) est tirée au hasard dans un jeu complet : si tu as vu juste, tu gagnes mise × son gain. Les couleurs ne comptent pas.'],
      es: ['La carta base (3 a K) se muestra durante las apuestas. Adivina la siguiente: Mayor, Menor o Igual. Los pagos de la ronda dependen de la carta base (cuanto más arriesgado, más paga).', 'La siguiente carta (2 a A, el As es la más alta) sale al azar de una baraja completa: si aciertas, ganas apuesta × su pago. Los palos no cuentan.'],
      pt: ['A carta base (3 a K) aparece durante as apostas. Adivinhe a próxima: Maior, Menor ou Igual. Os pagamentos da rodada dependem da carta base (quanto mais arriscado, mais paga).', 'A próxima carta (2 a A, o Ás é a mais alta) sai ao acaso de um baralho completo: se acertar, você ganha aposta × o pagamento. Os naipes não contam.'],
      ar: ['تظهر الورقة الأساسية (من 3 إلى الملك) أثناء الرهانات. خمّن الورقة التالية: أعلى أو أدنى أو مساوية. عوائد الجولة تعتمد على الورقة الأساسية (كلما زادت المخاطرة زاد العائد).', 'تُسحب الورقة التالية (من 2 إلى الآس، والآس أعلاها) عشوائيًا من مجموعة كاملة: إذا أصبت تربح الرهان × العائد. الأشكال لا تُحتسب.'],
      tr: ['Taban kart (3’ten Papaz’a) bahisler sırasında gösterilir. Sonraki kartı tahmin et: Yüksek, Düşük veya Aynı. Turun ödemeleri taban karta bağlıdır (risk arttıkça ödeme büyür).', 'Sonraki kart (2’den As’a, As en yüksek) tam desteden rastgele çekilir: bilirsen bahis × ödemesini kazanırsın. Renkler sayılmaz.'],
      vi: ['Lá gốc (3 đến K) được lật trong lúc đặt cược. Đoán lá tiếp theo: Cao hơn, Thấp hơn hay Bằng. Tỷ lệ trả của vòng tùy lá gốc (càng rủi ro càng trả cao).', 'Lá tiếp theo (2 đến A, A cao nhất) được rút ngẫu nhiên từ bộ bài đầy đủ: đoán đúng, bạn thắng cược × tỷ lệ trả. Chất không tính.'],
      id: ['Kartu dasar (3 sampai K) ditampilkan selama taruhan. Tebak kartu berikutnya: Lebih tinggi, Lebih rendah atau Sama. Bayaran ronde tergantung kartu dasar (makin berisiko, makin besar).', 'Kartu berikutnya (2 sampai As, As tertinggi) ditarik acak dari satu dek lengkap: jika tebakanmu benar, kamu menang taruhan × bayarannya. Jenis kartu tidak dihitung.'],
      ru: ['Базовая карта (от 3 до короля) открыта во время ставок. Угадайте следующую: Выше, Ниже или Равно. Выплаты раунда зависят от базовой карты (чем рискованнее, тем больше).', 'Следующая карта (от 2 до туза, туз старший) тянется случайно из полной колоды: если угадали, вы выигрываете ставку × выплату. Масти не важны.'],
      de: ['Die Basiskarte (3 bis König) ist während der Einsätze offen. Rate die nächste: Höher, Tiefer oder Gleich. Die Auszahlungen der Runde hängen von der Basiskarte ab (je riskanter, desto höher).', 'Die nächste Karte (2 bis Ass, Ass ist die höchste) wird zufällig aus einem vollen Deck gezogen: liegst du richtig, gewinnst du Einsatz × Auszahlung. Farben zählen nicht.'],
      hi: ['दांव के दौरान आधार पत्ता (3 से बादशाह) दिखता है। अगला पत्ता बताएं: ऊँचा, नीचा या बराबर। राउंड का भुगतान आधार पत्ते पर निर्भर है (जितना जोखिम, उतना बड़ा भुगतान)।', 'अगला पत्ता (2 से इक्का, इक्का सबसे बड़ा) पूरी गड्डी से बेतरतीब खींचा जाता है: सही अनुमान पर आप दांव × भुगतान जीतते हैं। रंग नहीं गिने जाते।'],
      zh: ['下注期间亮出底牌（3 到 K）。猜下一张牌：更大、更小或相同。本局赔率取决于底牌（风险越大赔率越高）。', '下一张牌（2 到 A，A 最大）从整副牌中随机抽出：猜中即赢 投注 × 赔率。不比花色。']
    }),
    scene: function (uid) {
      var deck = ''; for (var k = 0; k < 5; k++) deck += '<g transform="translate(' + (262 - k * 1.2) + ' ' + (118 - k * 1.6) + ')">' + cardBack(uid, ['#1E3A8A', '#2563EB']) + '</g>';
      return '<defs><radialGradient id="hlF' + uid + '" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#0F766E"/><stop offset="1" stop-color="#042F2E"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#021817"/><rect x="6" y="4" width="348" height="222" rx="20" fill="url(#hlF' + uid + ')" stroke="#B45309" stroke-width="3"/>' +
        '<ellipse cx="180" cy="120" rx="150" ry="84" fill="none" stroke="#FDE68A" stroke-opacity=".18" stroke-width="2"/>' +
        deck + '<g class="hl-base" transform="translate(98 118) scale(1.3)"><g class="hl-bf"></g></g>' +
        '<g class="hl-arr" transform="translate(180 118)" opacity="0"><circle r="20" class="hl-ac"/><path class="hl-ap" d=""/></g>' +
        '<text class="hl-cd" x="180" y="40" text-anchor="middle"></text>' + cardEl('hl-c', uid, ['#1E3A8A', '#2563EB']) +
        '<text class="hl-big" x="180" y="214" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt) {
      var a = function (s, d, lab) { return '<button type="button" data-s="' + s + '" class="hl-b ' + s + '"><svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="11" class="hl-bc"/><path d="' + d + '" fill="#fff"/></svg><span class="fit">' + K.esc(lab) + '</span><b class="fit" data-o="' + s + '">' + oddTxt(null) + '</b></button>'; };
      return a('h', 'M0-6L6 3H-6Z', l.hi) + a('e', 'M-6-3.5H6V-1H-6ZM-6 1H6V3.5H-6Z', l.same) + a('l', 'M0 6L6-3H-6Z', l.lo);
    },
    hist: function (n) { return '<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="11" fill="' + ['#16A34A', '#DC2626', '#CA8A04'][n] + '"/><path d="' + ['M0-6L6 3H-6Z', 'M0 6L6-3H-6Z', 'M-6-3.5H6V-1H-6ZM-6 1H6V3.5H-6Z'][n] + '" fill="#fff"/></svg>'; },
    wins: function (res) { return [['h', 'l', 'e'][+res.n]]; },
    init: function (c) { c.bf = c.q('.hl-bf'); c.c = cardInit(c.q('.hl-c')); c.arr = c.q('.hl-arr'); c.ap = c.q('.hl-ap'); c.ac = c.q('.hl-ac'); c.cd = c.q('.hl-cd'); c.big = c.q('.hl-big'); c.bk = ''; },
    frame: function (c, R, t, e, res) {
      var b = res ? [+res.b, +(res.s || [0])[0]] : (R && R.pre ? [+R.pre.b, +R.pre.s] : null), key = b ? b.join(':') : '-';
      if (c.bk !== key) { c.bk = key; c.bf.innerHTML = b ? cardFace(b[0], b[1]) : cardBack(c.uid, ['#1E3A8A', '#2563EB']); }
      if (!res) {
        cardPose(c.c, 262, 112, 1, 0, 0, 0); sa(c.arr, 'opacity', '0'); txt(c.big, '');
        var on = !!R && e < 0; txt(c.cd, on ? mmss(R.close - t) : ''); cls(c.cd, 'hl-cd' + (on && R.close - t <= 10 ? ' warn' : ''));
        return;
      }
      txt(c.cd, '');
      cardSet(c.c, 0, +res.x, +(res.s || [0, 0])[1]);
      var k = eio(seg(e, .4, 2.2)), lift = Math.sin(seg(e, .4, 2.2) * Math.PI) * 26;
      cardPose(c.c, lerp(262, 262, k), 112 - lift, lerp(1, 1.3, k), lerp(0, -6, k) + lerp(0, 6, seg(e, 2, 2.6)), seg(e, 2.6, 3.6), 1);
      var n = +res.n, ak = eo(seg(e, 4.2, 5));
      sa(c.arr, 'opacity', ak.toFixed(2)); sa(c.arr, 'transform', 'translate(180 118) scale(' + (.4 + ak * .8).toFixed(3) + ')');
      sa(c.ap, 'd', ['M0-11L11 5H-11Z', 'M0 11L11-5H-11Z', 'M-11-6H11V-1.5H-11ZM-11 1.5H11V6H-11Z'][n]); cls(c.ac, 'hl-ac n' + n);
      txt(c.big, e >= 4.6 ? [c.l.hi, c.l.lo, c.l.same][n] : ''); cls(c.big, 'hl-big n' + n);
    }
  });

  /* ================================================== Big Small Live (3 dice) ================================================== */
  var PIPS = { 1: [[0, 0]], 2: [[-7, -7], [7, 7]], 3: [[-7, -7], [0, 0], [7, 7]], 4: [[-7, -7], [7, -7], [-7, 7], [7, 7]], 5: [[-7, -7], [7, -7], [0, 0], [-7, 7], [7, 7]], 6: [[-7, -7], [7, -7], [-7, 0], [7, 0], [-7, 7], [7, 7]] };
  function pipsSvg(v, red) { return PIPS[v].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.9" fill="' + (red && v === 1 ? '#DC2626' : v === 1 || v === 4 ? '#DC2626' : '#111827') + '"/>'; }).join(''); }
  function sbMini(sum, d) {
    var tri = d && d[0] === d[1] && d[1] === d[2];
    return '<span class="sb-h ' + (tri ? 'tr' : sum >= 11 ? 'bg' : 'sm') + '">' + sum + '</span>';
  }
  var SB_X = [134, 180, 226];
  live('sicbolive', {
    SHOW: 8, lab: 'sb', bev: 'roll', endEv: 'coin', odds0: { small: 1.93, big: 1.93, odd: 1.93, even: 1.93, triple: 33.84 },
    beat: function (e) { return e < 3.2 ? Math.floor(e / .8) : 10 + (e >= 3.3); },
    rules: rules(150, {
      en: ['Three dice are shaken under the dome. Bet on Small (total 4–10), Big (11–17), Odd or Even (×1.93 each), or on any Triple (three identical dice, ×33.84).', 'The dome lifts and the total decides. A triple makes Small, Big, Odd and Even lose; the Triple bet wins.'],
      fr: ['Trois dés sont secoués sous la cloche. Parie sur Petit (total 4–10), Grand (11–17), Impair ou Pair (×1,93 chacun), ou sur un Triple (trois dés identiques, ×33,84).', 'La cloche se lève et le total décide. Un triple fait perdre Petit, Grand, Impair et Pair ; le Triple gagne.'],
      es: ['Tres dados se agitan bajo la campana. Apuesta a Pequeño (total 4–10), Grande (11–17), Impar o Par (×1,93 cada uno), o a un Triple (tres dados iguales, ×33,84).', 'La campana se levanta y decide el total. Un triple hace perder Pequeño, Grande, Impar y Par; gana el Triple.'],
      pt: ['Três dados são agitados sob a cúpula. Aposte em Pequeno (total 4–10), Grande (11–17), Ímpar ou Par (×1,93 cada), ou em Trio (três dados iguais, ×33,84).', 'A cúpula sobe e o total decide. Um trio faz perder Pequeno, Grande, Ímpar e Par; o Trio ganha.'],
      ar: ['تُهزّ ثلاثة أحجار نرد تحت القبة. راهن على صغير (المجموع 4–10) أو كبير (11–17) أو فردي أو زوجي (×1.93 لكل منها)، أو على ثلاثي (ثلاثة أحجار متطابقة، ×33.84).', 'ترتفع القبة ويحسم المجموع. الثلاثي يجعل صغير وكبير وفردي وزوجي تخسر؛ ويربح رهان الثلاثي.'],
      tr: ['Kubbenin altında üç zar sallanır. Küçük (toplam 4–10), Büyük (11–17), Tek veya Çift (her biri ×1,93) ya da Üçlü (üç aynı zar, ×33,84) oyna.', 'Kubbe kalkar ve toplam belirler. Üçlü gelirse Küçük, Büyük, Tek ve Çift kaybeder; Üçlü kazanır.'],
      vi: ['Ba viên xúc xắc được lắc dưới chuông. Cược Xỉu (tổng 4–10), Tài (11–17), Lẻ hoặc Chẵn (mỗi cửa ×1,93), hoặc Bộ ba (ba viên giống nhau, ×33,84).', 'Chuông mở và tổng điểm quyết định. Ra bộ ba thì Xỉu, Tài, Lẻ, Chẵn đều thua; cửa Bộ ba thắng.'],
      id: ['Tiga dadu dikocok di bawah kubah. Pasang Kecil (total 4–10), Besar (11–17), Ganjil atau Genap (masing-masing ×1,93), atau Triple (tiga dadu sama, ×33,84).', 'Kubah terangkat dan total menentukan. Triple membuat Kecil, Besar, Ganjil dan Genap kalah; Triple menang.'],
      ru: ['Три кости трясут под колпаком. Ставьте на Малое (сумма 4–10), Большое (11–17), Нечёт или Чёт (по ×1,93) или на Тройку (три одинаковые кости, ×33,84).', 'Колпак поднимается, решает сумма. Тройка — проигрыш для Малого, Большого, Нечёта и Чёта; ставка на Тройку выигрывает.'],
      de: ['Drei Würfel werden unter der Glocke geschüttelt. Setze auf Klein (Summe 4–10), Groß (11–17), Ungerade oder Gerade (je ×1,93) oder auf einen Drilling (drei gleiche Würfel, ×33,84).', 'Die Glocke hebt sich, die Summe entscheidet. Ein Drilling lässt Klein, Groß, Ungerade und Gerade verlieren; Drilling gewinnt.'],
      hi: ['गुंबद के नीचे तीन पासे हिलाए जाते हैं। छोटा (योग 4–10), बड़ा (11–17), विषम या सम (हर एक ×1.93), या ट्रिपल (तीन एक जैसे पासे, ×33.84) पर दांव लगाएं।', 'गुंबद उठता है और योग फ़ैसला करता है। ट्रिपल आने पर छोटा, बड़ा, विषम और सम हारते हैं; ट्रिपल जीतता है।'],
      zh: ['三颗骰子在罩子下摇动。押小（总点数 4–10）、大（11–17）、单或双（各 ×1.93），或押围骰（三颗相同，×33.84）。', '罩子揭开，以总点数定输赢。开出围骰时，大、小、单、双皆输；押围骰胜。']
    }),
    scene: function (uid) {
      var dice = SB_X.map(function (x, k) { return '<g class="sb-d" transform="translate(' + x + ' 150)"><rect x="-15" y="-15" width="30" height="30" rx="7" fill="url(#sbD' + uid + ')" stroke="#CBD5E1" stroke-width=".8"/><g class="sb-p"></g></g>'; }).join('');
      return '<defs>' + lgd('sbD' + uid, '#FFFFFF', '#E2E8F0') + rgd('sbP' + uid, '#FEF3C7', '#D97706', '#78350F') +
        '<radialGradient id="sbG' + uid + '" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#BAE6FD" stop-opacity=".14"/><stop offset="1" stop-color="#38BDF8" stop-opacity=".22"/></radialGradient>' +
        '<radialGradient id="sbB' + uid + '" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#4C1D95"/><stop offset="1" stop-color="#1E0B3A"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#12052B"/><rect x="6" y="4" width="348" height="222" rx="20" fill="url(#sbB' + uid + ')" stroke="#A78BFA" stroke-opacity=".6" stroke-width="2"/>' +
        '<g class="sb-side" transform="translate(52 112)"><rect x="-40" y="-60" width="80" height="120" rx="12" class="sb-sm"/><text y="-24" text-anchor="middle" class="sb-l">4–10</text><text y="18" text-anchor="middle" class="sb-n sm" data-k="s"></text></g>' +
        '<g class="sb-side" transform="translate(308 112)"><rect x="-40" y="-60" width="80" height="120" rx="12" class="sb-bg"/><text y="-24" text-anchor="middle" class="sb-l">11–17</text><text y="18" text-anchor="middle" class="sb-n bg" data-k="b"></text></g>' +
        '<ellipse cx="180" cy="176" rx="84" ry="20" fill="url(#sbP' + uid + ')" stroke="#FDE68A" stroke-width="1.5"/><ellipse cx="180" cy="171" rx="70" ry="13" fill="#7C2D12" opacity=".55"/>' +
        dice +
        '<g class="sb-dome"><path d="M110 170Q110 70 180 70T250 170Z" fill="url(#sbG' + uid + ')" stroke="#E0F2FE" stroke-opacity=".7" stroke-width="1.6"/><path d="M128 140Q130 98 160 86" stroke="#fff" stroke-opacity=".6" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="180" cy="66" r="7" fill="url(#sbP' + uid + ')"/></g>' +
        '<text class="sb-cd" x="180" y="46" text-anchor="middle"></text><text class="sb-big" x="180" y="48" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) {
      var b = function (s, lab, sub) { return '<button type="button" data-s="' + s + '" class="sb-b ' + s + '"><span class="fit">' + K.esc(lab) + '</span>' + (sub ? '<i>' + sub + '</i>' : '') + '<b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; };
      return b('small', l.small, '4–10') + b('big', l.big, '11–17') + b('odd', l.odd) + b('even', l.even) + b('triple', l.triple, '⚀⚀⚀'.replace(/⚀/g, '•'));
    },
    hist: function (n) { return sbMini(n); },
    wins: function (res) { var d = res.d || [], tri = d[0] === d[1] && d[1] === d[2]; return tri ? ['triple'] : [res.n >= 11 ? 'big' : 'small', res.n % 2 ? 'odd' : 'even']; },
    init: function (c) { c.d = [].slice.call(c.box.querySelectorAll('.sb-d')); c.p = c.d.map(function (g) { return g.querySelector('.sb-p'); }); c.pv = [0, 0, 0]; c.dome = c.q('.sb-dome'); c.cd = c.q('.sb-cd'); c.big = c.q('.sb-big'); c.ns = c.q('[data-k="s"]'); c.nb = c.q('[data-k="b"]'); },
    frame: function (c, R, t, e, res) {
      var face = function (k, v) { if (c.pv[k] !== v) { c.pv[k] = v; c.p[k].innerHTML = pipsSvg(v); } };
      var k;
      if (!res) {
        var lr = R && R.res ? R.res.d : null;
        for (k = 0; k < 3; k++) { face(k, lr ? +lr[k] : k + 2); sa(c.d[k], 'transform', tr(SB_X[k], 150, 1, (k - 1) * 8)); }
        sa(c.dome, 'transform', 'translate(0 ' + (Math.sin(t * 1.3) * 1.2).toFixed(1) + ')'); sa(c.dome, 'opacity', '1');
        var on = !!R && e < 0; txt(c.cd, on ? mmss(R.close - t) : ''); cls(c.cd, 'sb-cd' + (on && R.close - t <= 10 ? ' warn' : '')); txt(c.big, ''); txt(c.ns, ''); txt(c.nb, '');
        return;
      }
      txt(c.cd, '');
      var d = res.d, shake = e < 3.2, i = R.i;
      for (k = 0; k < 3; k++) {
        if (shake) {
          var step = Math.floor(e * 9), jy = Math.abs(Math.sin(e * 11 + k * 2)) * 34, jx = Math.sin(e * 7 + k * 3) * 12;
          face(k, 1 + Math.floor(hr(i * 7 + k, step) * 6)); sa(c.d[k], 'transform', tr(SB_X[k] + jx, 150 - jy, 1, hr(i + k, step) * 360));
        } else {
          var s = eo(seg(e, 3.2, 3.6)); face(k, +d[k]); sa(c.d[k], 'transform', tr(SB_X[k], 150 - (1 - s) * 10, 1 + (e >= 4.6 ? .12 * Math.sin(seg(e, 4.6, 5.2) * Math.PI) : 0), (1 - s) * 40 * (k - 1)));
        }
      }
      var dx = shake ? Math.sin(e * 23) * 5 * seg(e, 0, .4) : 0, up = eio(seg(e, 3.6, 4.6));
      sa(c.dome, 'transform', 'translate(' + dx.toFixed(1) + ' ' + (-up * 120 + (shake ? Math.abs(Math.sin(e * 17)) * -6 : 0)).toFixed(1) + ')'); sa(c.dome, 'opacity', (1 - seg(e, 4.2, 4.6)).toFixed(2));
      var tri = d[0] === d[1] && d[1] === d[2], showN = e >= 4.8;
      txt(c.big, showN ? String(res.n) + (tri ? ' · ' + c.l.triple : '') : ''); cls(c.big, 'sb-big ' + (tri ? 'tr' : res.n >= 11 ? 'bg' : 'sm'));
      txt(c.ns, showN && !tri && res.n <= 10 ? '✓' : ''); txt(c.nb, showN && !tri && res.n >= 11 ? '✓' : '');
    }
  });

  /* ======================================================== Keno Live ========================================================== */
  var KE_T0 = 1, KE_DT = 1.4;
  function keCell(v) { var j = v - 1; return [14 + (j % 10) * 23.6, 30 + Math.floor(j / 10) * 23.6]; }
  live('kenolive', {
    SHOW: 30, lab: 'kd', bev: 'ball', endEv: 'coin', odds0: { top: 2.35, bot: 2.35, tt: 4.62, odd: 2.35, even: 2.35, oe: 4.62 },
    beat: function (e) { return e < KE_T0 ? -1 : Math.min(20, Math.floor((e - KE_T0) / KE_DT) + 1); },
    rules: rules(180, {
      en: ['20 balls out of 80 are drawn. Bet on where most of them will be: more in 1–40 or more in 41–80 (×2.35), or exactly 10–10 (×4.62). Or bet on more Odd or more Even numbers (×2.35), or 10–10 (×4.62).', 'The 20 balls appear one by one on the board and the counters add up: when the 20th ball lands, the counts decide.'],
      fr: ['20 boules sur 80 sont tirées. Parie sur l’endroit où il y en aura le plus : plus dans 1–40 ou plus dans 41–80 (×2,35), ou exactement 10–10 (×4,62). Ou parie sur plus d’Impairs ou plus de Pairs (×2,35), ou 10–10 (×4,62).', 'Les 20 boules s’allument une à une sur la grille et les compteurs montent : à la 20e boule, les comptes décident.'],
      es: ['Se sortean 20 bolas de 80. Apuesta dónde habrá más: más en 1–40 o más en 41–80 (×2,35), o exactamente 10–10 (×4,62). O apuesta a más Impares o más Pares (×2,35), o 10–10 (×4,62).', 'Las 20 bolas aparecen una a una en el tablero y los contadores suben: con la bola 20, los totales deciden.'],
      pt: ['São sorteadas 20 bolas de 80. Aposte onde haverá mais: mais em 1–40 ou mais em 41–80 (×2,35), ou exatamente 10–10 (×4,62). Ou aposte em mais Ímpares ou mais Pares (×2,35), ou 10–10 (×4,62).', 'As 20 bolas acendem uma a uma no painel e os contadores sobem: na 20ª bola, as contagens decidem.'],
      ar: ['تُسحب 20 كرة من 80. راهن على المكان الذي سيضم أكثرها: أكثر في 1–40 أو أكثر في 41–80 (×2.35)، أو 10–10 بالضبط (×4.62). أو راهن على أرقام فردية أكثر أو زوجية أكثر (×2.35)، أو 10–10 (×4.62).', 'تظهر الكرات العشرون واحدة تلو الأخرى على اللوحة وترتفع العدّادات: عند الكرة العشرين تحسم الأعداد النتيجة.'],
      tr: ['80 toptan 20’si çekilir. Çoğunun nerede olacağına oyna: 1–40’ta daha çok veya 41–80’de daha çok (×2,35) ya da tam 10–10 (×4,62). Veya daha çok Tek ya da daha çok Çift sayıya (×2,35) veya 10–10’a (×4,62) oyna.', '20 top tahtada tek tek yanar ve sayaçlar artar: 20. topta sayılar sonucu belirler.'],
      vi: ['Quay 20 bi trong 80 số. Cược nơi có nhiều bi hơn: nhiều hơn ở 1–40 hay ở 41–80 (×2,35), hoặc đúng 10–10 (×4,62). Hoặc cược nhiều số Lẻ hơn hay Chẵn hơn (×2,35), hoặc 10–10 (×4,62).', '20 bi lần lượt sáng trên bảng và bộ đếm tăng dần: khi bi thứ 20 ra, số đếm quyết định.'],
      id: ['20 bola dari 80 diundi. Tebak di mana paling banyak: lebih banyak di 1–40 atau di 41–80 (×2,35), atau tepat 10–10 (×4,62). Atau pasang lebih banyak Ganjil atau Genap (×2,35), atau 10–10 (×4,62).', '20 bola muncul satu per satu di papan dan penghitung bertambah: saat bola ke-20 keluar, hitungan menentukan.'],
      ru: ['Из 80 шаров выпадает 20. Ставьте, где их будет больше: больше в 1–40 или больше в 41–80 (×2,35), либо ровно 10–10 (×4,62). Или ставьте на больше Нечётных или Чётных (×2,35) либо 10–10 (×4,62).', '20 шаров по одному загораются на табло, счётчики растут: после 20-го шара всё решают итоги.'],
      de: ['20 von 80 Kugeln werden gezogen. Setze darauf, wo die meisten liegen: mehr in 1–40 oder mehr in 41–80 (×2,35), oder genau 10–10 (×4,62). Oder setze auf mehr Ungerade oder mehr Gerade (×2,35), oder 10–10 (×4,62).', 'Die 20 Kugeln leuchten nacheinander auf dem Feld auf und die Zähler steigen: mit der 20. Kugel entscheiden die Zahlen.'],
      hi: ['80 में से 20 गेंदें निकलती हैं। दांव लगाएं कि ज़्यादातर कहाँ होंगी: 1–40 में ज़्यादा या 41–80 में ज़्यादा (×2.35), या ठीक 10–10 (×4.62)। या ज़्यादा विषम या ज़्यादा सम (×2.35), या 10–10 (×4.62) पर।', '20 गेंदें एक-एक कर बोर्ड पर जलती हैं और गिनती बढ़ती है: 20वीं गेंद पर गिनती फ़ैसला करती है।'],
      zh: ['从 80 个号码中开出 20 个。押哪边更多：1–40 更多或 41–80 更多（×2.35），或正好 10–10（×4.62）。也可押单数更多或双数更多（×2.35），或 10–10（×4.62）。', '20 个号码逐一在面板上亮起，计数随之增加：第 20 个号码开出后按计数定输赢。']
    }),
    scene: function (uid) {
      var g = ''; for (var v = 1; v <= 80; v++) { var p = keCell(v); g += '<g class="ke-c' + (v <= 40 ? ' t' : ' b') + '" transform="translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')"><rect x="-10.6" y="-10.6" width="21.2" height="21.2" rx="5"/><text y="3.6" text-anchor="middle">' + v + '</text></g>'; }
      return '<defs>' + rgd('keB' + uid, '#FFFFFF', '#FDE68A', '#D97706') + '</defs><rect x="-300" y="-300" width="960" height="830" fill="#06142B"/>' +
        '<rect x="0" y="16" width="244" height="204" rx="12" fill="#0B2245" stroke="#38BDF8" stroke-opacity=".35"/><path d="M4 124.4H240" stroke="#FDE68A" stroke-opacity=".5" stroke-dasharray="4 3"/>' + g +
        '<g transform="translate(302 64)"><circle r="34" fill="#0B2245" stroke="#FDE68A" stroke-opacity=".5" stroke-width="2"/><g class="ke-ball"><circle r="27" fill="url(#keB' + uid + ')"/><circle r="15" fill="#fff" opacity=".9"/><text class="ke-bn" y="6" text-anchor="middle"></text></g></g>' +
        '<g transform="translate(302 128)" class="ke-cnt"><rect x="-48" y="-16" width="96" height="38" rx="9" fill="#0B2245"/>' +
          '<text class="ke-k t" x="-24" y="-3" text-anchor="middle">1–40</text><text class="ke-k b" x="24" y="-3" text-anchor="middle">41–80</text><text class="ke-v t" x="-24" y="15" text-anchor="middle">0</text><text class="ke-v b" x="24" y="15" text-anchor="middle">0</text>' +
          '<rect x="-48" y="28" width="96" height="38" rx="9" fill="#0B2245"/><text class="ke-k o" x="-24" y="41" text-anchor="middle"></text><text class="ke-k e" x="24" y="41" text-anchor="middle"></text><text class="ke-v o" x="-24" y="59" text-anchor="middle">0</text><text class="ke-v e" x="24" y="59" text-anchor="middle">0</text></g>' +
        '<text class="ke-cd" x="302" y="210" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) {
      var b = function (s, lab, k) { return '<button type="button" data-s="' + s + '" class="ke-b ' + k + '"><span class="fit">' + K.esc(lab) + '</span><b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; };
      return b('top', '1–40', 't') + b('tt', '10 : 10', 'x') + b('bot', '41–80', 'b') + b('odd', l.odd, 'o') + b('oe', '10 : 10', 'x') + b('even', l.even, 'e');
    },
    hist: function (n) { return '<span class="ke-h ' + (n > 10 ? 't' : n < 10 ? 'b' : 'x') + '">' + n + '</span>'; },
    wins: function (res) { var n = +res.n, q = +res.q; return [n > 10 ? 'top' : n < 10 ? 'bot' : 'tt', q > 10 ? 'odd' : q < 10 ? 'even' : 'oe']; },
    init: function (c) {
      c.cells = [].slice.call(c.box.querySelectorAll('.ke-c')); c.ball = c.q('.ke-ball'); c.bn = c.q('.ke-bn'); c.cd = c.q('.ke-cd');
      c.v = { t: c.q('.ke-v.t'), b: c.q('.ke-v.b'), o: c.q('.ke-v.o'), e: c.q('.ke-v.e') };
      txt(c.q('.ke-k.o'), c.l.odd); txt(c.q('.ke-k.e'), c.l.even);
    },
    frame: function (c, R, t, e, res) {
      var j, on = {}, last = 0, cnt = { t: 0, b: 0, o: 0, e: 0 }, bs = 1;
      if (res && res.b) {
        var shown = e < KE_T0 ? 0 : Math.min(20, Math.floor((e - KE_T0) / KE_DT) + 1);
        for (j = 0; j < shown; j++) { var v = +res.b[j]; on[v] = 1; last = v; cnt[v <= 40 ? 't' : 'b']++; cnt[v % 2 ? 'o' : 'e']++; }
        if (shown) { var f = seg((e - KE_T0) - (shown - 1) * KE_DT, 0, .35); bs = .4 + .6 * eo(f); }
        txt(c.bn, last ? String(last) : '?'); txt(c.cd, shown ? shown + ' / 20' : '');
        cls(c.cd, 'ke-cd');
      } else {
        txt(c.bn, '?'); bs = 1 + Math.sin(t * 3) * .03;
        var cd = !!R && e < 0; txt(c.cd, cd ? mmss(R.close - t) : ''); cls(c.cd, 'ke-cd big' + (cd && R.close - t <= 10 ? ' warn' : ''));
      }
      sa(c.ball, 'transform', 'scale(' + bs.toFixed(3) + ')');
      for (j = 0; j < 80; j++) { var k = on[j + 1] ? (last === j + 1 ? 2 : 1) : 0; if (c.cells[j]._k !== k) { c.cells[j]._k = k; c.cells[j].classList.toggle('on', k > 0); c.cells[j].classList.toggle('now', k === 2); } }
      ['t', 'b', 'o', 'e'].forEach(function (x) { txt(c.v[x], String(cnt[x])); });
    }
  });

  /* ======================================================== Lucky Ten ========================================================== */
  var L10_C = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#0EA5E9', '#3B82F6', '#8B5CF6', '#D946EF', '#EC4899'];
  function l10Ball(v, u) { var c = L10_C[v - 1]; return '<circle r="12" fill="' + c + '"/><circle r="12" fill="url(#l10S' + u + ')"/><circle r="6.8" fill="#fff"/><text y="3.6" text-anchor="middle" class="l10-t">' + v + '</text>'; }
  function l10Mini(v) { var u = 'm' + (++GID); return '<svg viewBox="-13 -13 26 26" aria-hidden="true"><defs><radialGradient id="l10S' + u + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient></defs>' + l10Ball(v, u) + '</svg>'; }
  var L10_X = 140, L10_Y = 122, L10_R = 74;
  live('lucky10', {
    SHOW: 10, lab: 'kd', bev: 'ball', endEv: 'coin', odds0: { '1': 9.4, '2': 9.4, '3': 9.4, '4': 9.4, '5': 9.4, '6': 9.4, '7': 9.4, '8': 9.4, '9': 9.4, '10': 9.4, odd: 1.88, even: 1.88, lo: 1.88, hi: 1.88 },
    beat: function (e) { return e < 6 ? Math.floor(e * 2.5) : 20 + (e >= 6.2) + (e >= 8.6); },
    rules: rules(155, {
      en: ['Ten numbered balls spin in the globe. Bet on one number (×9.40), or on Odd / Even or 1–5 / 6–10 (×1.88).', 'The air blows harder, one ball rises through the tube and lands in the window: its number decides.'],
      fr: ['Dix boules numérotées tournent dans le globe. Parie sur un numéro (×9,40), ou sur Impair / Pair ou 1–5 / 6–10 (×1,88).', 'Le souffle s’accélère, une boule monte par le tube et se pose dans la fenêtre : son numéro décide.'],
      es: ['Diez bolas numeradas giran en el globo. Apuesta a un número (×9,40), o a Impar / Par o 1–5 / 6–10 (×1,88).', 'El aire sopla más fuerte, una bola sube por el tubo y se posa en la ventana: su número decide.'],
      pt: ['Dez bolas numeradas giram no globo. Aposte num número (×9,40), ou em Ímpar / Par ou 1–5 / 6–10 (×1,88).', 'O ar sopra mais forte, uma bola sobe pelo tubo e para na janela: o número dela decide.'],
      ar: ['عشر كرات مرقّمة تدور في الكرة الزجاجية. راهن على رقم (×9.40)، أو على فردي / زوجي أو 1–5 / 6–10 (×1.88).', 'يشتد الهواء وتصعد كرة عبر الأنبوب وتستقر في النافذة: رقمها يحسم النتيجة.'],
      tr: ['Kürenin içinde on numaralı top döner. Bir sayıya (×9,40) ya da Tek / Çift veya 1–5 / 6–10’a (×1,88) oyna.', 'Hava sertleşir, bir top tüpten yükselip pencereye yerleşir: numarası sonucu belirler.'],
      vi: ['Mười quả bi đánh số quay trong lồng cầu. Cược một số (×9,40), hoặc Lẻ / Chẵn hay 1–5 / 6–10 (×1,88).', 'Gió thổi mạnh hơn, một quả bi bay lên ống và dừng ở cửa sổ: số của nó quyết định.'],
      id: ['Sepuluh bola bernomor berputar di dalam bola kaca. Pasang satu angka (×9,40), atau Ganjil / Genap atau 1–5 / 6–10 (×1,88).', 'Angin bertiup lebih kencang, satu bola naik lewat tabung dan berhenti di jendela: angkanya menentukan.'],
      ru: ['В шаре крутятся десять пронумерованных шаров. Ставьте на число (×9,40) или на Нечёт / Чёт либо 1–5 / 6–10 (×1,88).', 'Поток воздуха усиливается, один шар поднимается по трубке и встаёт в окошко: решает его номер.'],
      de: ['Zehn nummerierte Kugeln wirbeln in der Kugel. Setze auf eine Zahl (×9,40) oder auf Ungerade / Gerade oder 1–5 / 6–10 (×1,88).', 'Die Luft bläst stärker, eine Kugel steigt durch das Rohr ins Fenster: ihre Zahl entscheidet.'],
      hi: ['ग्लोब में दस नंबर वाली गेंदें घूमती हैं। किसी एक नंबर (×9.40), या विषम / सम या 1–5 / 6–10 (×1.88) पर दांव लगाएं।', 'हवा तेज़ होती है, एक गेंद नली से ऊपर चढ़कर खिड़की में रुकती है: उसका नंबर फ़ैसला करता है।'],
      zh: ['十个编号小球在球形摇奖机里翻滚。押一个号码（×9.40），或押单 / 双、1–5 / 6–10（×1.88）。', '气流加强，一个小球沿管道升起落入窗口：以其号码定输赢。']
    }),
    scene: function (uid) {
      var balls = ''; for (var v = 1; v <= 10; v++) balls += '<g class="l10-b">' + l10Ball(v, uid) + '</g>';
      return '<defs><radialGradient id="l10S' + uid + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>' +
        '<radialGradient id="l10G' + uid + '" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#E0F2FE" stop-opacity=".22"/><stop offset="1" stop-color="#0EA5E9" stop-opacity=".12"/></radialGradient>' + rgd('l10P' + uid, '#FEF3C7', '#F59E0B', '#78350F') + '</defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#0A0F2C"/><circle cx="' + L10_X + '" cy="' + L10_Y + '" r="96" fill="#1E1B4B" opacity=".6"/>' +
        '<path d="M' + L10_X + ' ' + (L10_Y - L10_R) + 'V24H292V58" stroke="#E0F2FE" stroke-opacity=".35" stroke-width="22" fill="none" stroke-linejoin="round"/><path d="M' + L10_X + ' ' + (L10_Y - L10_R) + 'V24H292V58" stroke="#0A0F2C" stroke-width="18" fill="none" stroke-linejoin="round"/>' +
        '<rect x="' + (L10_X - 34) + '" y="' + (L10_Y + L10_R - 6) + '" width="68" height="28" rx="6" fill="url(#l10P' + uid + ')"/>' +
        '<circle cx="' + L10_X + '" cy="' + L10_Y + '" r="' + L10_R + '" fill="url(#l10G' + uid + ')" stroke="#BAE6FD" stroke-opacity=".7" stroke-width="2"/>' +
        '<g transform="translate(292 118)"><rect x="-46" y="-56" width="92" height="112" rx="16" fill="#111A44" stroke="#FDE68A" stroke-opacity=".6" stroke-width="1.6"/><circle r="34" fill="#0A0F2C"/></g>' +
        balls + '<g class="l10-win" opacity="0"></g>' +
        '<path d="M' + (L10_X - 52) + ' ' + (L10_Y - 50) + 'Q' + (L10_X - 66) + ' ' + (L10_Y - 20) + ' ' + (L10_X - 62) + ' ' + (L10_Y + 10) + '" stroke="#fff" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<text class="l10-cd" x="292" y="126" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) {
      var nb = function (v) { return '<button type="button" data-s="' + v + '" class="l10-n">' + l10Mini(v) + '<b class="fit" data-o="' + v + '">' + oddTxt(o[String(v)]) + '</b></button>'; };
      var tb = function (s, lab) { return '<button type="button" data-s="' + s + '" class="l10-x"><span class="fit">' + K.esc(lab) + '</span><b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; };
      return '<div class="l10-g">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(nb).join('') + '</div><div class="l10-o">' + tb('odd', l.odd) + tb('even', l.even) + tb('lo', '1–5') + tb('hi', '6–10') + '</div>';
    },
    hist: function (n) { return l10Mini(n); },
    wins: function (res) { var n = +res.n; return [String(n), n % 2 ? 'odd' : 'even', n <= 5 ? 'lo' : 'hi']; },
    init: function (c) { c.b = [].slice.call(c.box.querySelectorAll('.l10-b')); c.win = c.q('.l10-win'); c.cd = c.q('.l10-cd'); c.wn = 0; },
    frame: function (c, R, t, e, res) {
      var amp = res ? (e < 6 ? .35 + .65 * seg(e, 0, 1.5) : 1) : .3, n = res ? +res.n : 0, sp = res && e < 6.5 ? 2.6 : 1;
      for (var v = 1; v <= 10; v++) {
        var a = t * (.7 + v * .13) * sp + v * 2.1, b = t * (1.1 + v * .07) * sp + v;
        var rr = (L10_R - 14) * (.45 + .55 * amp * Math.abs(Math.sin(b))), x = L10_X + Math.cos(a) * rr, y = L10_Y + Math.sin(a) * rr * .9 + (1 - amp) * 30;
        y = Math.min(y, L10_Y + L10_R - 14);
        var hide = res && v === n && e >= 6;
        sa(c.b[v - 1], 'transform', tr(x, y)); sa(c.b[v - 1], 'opacity', hide ? '0' : '1');
      }
      if (res && e >= 6) {
        if (c.wn !== n) { c.wn = n; c.win.innerHTML = l10Ball(n, c.uid); }
        var k1 = eio(seg(e, 6, 7)), k2 = eio(seg(e, 7, 7.9)), k3 = eo(seg(e, 7.9, 8.6)), x2, y2;
        if (k2 <= 0) { x2 = L10_X; y2 = lerp(L10_Y - L10_R + 10, 24, k1); } else if (k3 <= 0) { x2 = lerp(L10_X, 292, k2); y2 = 24; } else { x2 = 292; y2 = lerp(24, 118, k3); }
        sa(c.win, 'opacity', '1'); sa(c.win, 'transform', tr(x2, y2, 1 + 1.6 * k3));
        txt(c.cd, '');
      } else {
        sa(c.win, 'opacity', '0');
        var on = !!R && !res && e < 0; txt(c.cd, on ? mmss(R.close - t) : (res ? '' : '?')); cls(c.cd, 'l10-cd' + (on && R.close - t <= 10 ? ' warn' : ''));
      }
    }
  });

  /* ======================================================= Money Wheel ========================================================== */
  var MW_SEG = [40, 1, 2, 5, 1, 2, 1, 10, 1, 2, 1, 5, 2, 20, 1, 1, 2, 1, 1, 5, 10, 2, 1, 2, 1, 1, 2, 5, 1, 1, 2, 1, 1, 2, 10, 5, 1, 1, 2, 1, 20, 2, 5, 1, 1, 2, 1, 10, 2, 1, 5, 1, 2, 1];
  var MW_C = { 1: ['#FDE68A', '#CA8A04'], 2: ['#93C5FD', '#2563EB'], 5: ['#C4B5FD', '#7C3AED'], 10: ['#86EFAC', '#16A34A'], 20: ['#FDBA74', '#EA580C'], 40: ['#FCA5A5', '#DC2626'] };
  var MW_ST = 360 / 54, MW_X = 180, MW_Y = 121, MW_R = 95, MW_SPIN = 12;
  function mwChip(v) { var c = MW_C[v]; return '<svg viewBox="-13 -13 26 26" aria-hidden="true"><circle r="12" fill="' + c[1] + '"/><circle r="12" fill="none" stroke="' + c[0] + '" stroke-width="2.4" stroke-dasharray="3.2 3"/><circle r="8" fill="' + c[0] + '"/><text y="3.4" text-anchor="middle" class="mw-ct">' + v + '</text></svg>'; }
  function mwRot(R, e, n) {
    var S = ((R.close * 7) % 360 + 360) % 360;
    if (n == null) return S;
    var T = S + 360 * 5 + ((((-n * MW_ST - S) % 360) + 360) % 360), k = seg(e, 0, MW_SPIN);
    return S + (T - S) * (1 - Math.pow(1 - k, 3.2));
  }
  live('moneywheel', {
    SHOW: 13.5, lab: 'mw', bev: 'tick', endEv: 'coin', odds0: { v1: 2.03, v2: 3.38, v5: 7.25, v10: 12.69, v20: 25.38, v40: 50.76 },
    beat: function (e, res, R) { return e < MW_SPIN ? Math.floor(mwRot(R, e, +res.n) / MW_ST) : -1; },
    rules: rules(155, {
      en: ['The big wheel has 54 segments: 25 × “1”, 15 × “2”, 7 × “5”, 4 × “10”, 2 × “20” and a single “40”. Bet on a number: the rarer, the bigger (×2.03 … ×50.76).', 'The wheel spins and slows down under the pointer: the number it stops on wins.'],
      fr: ['La grande roue a 54 cases : 25 × « 1 », 15 × « 2 », 7 × « 5 », 4 × « 10 », 2 × « 20 » et un seul « 40 ». Parie sur un nombre : plus il est rare, plus il paie (×2,03 … ×50,76).', 'La roue tourne et ralentit sous le pointeur : le nombre où elle s’arrête gagne.'],
      es: ['La gran rueda tiene 54 casillas: 25 × «1», 15 × «2», 7 × «5», 4 × «10», 2 × «20» y un solo «40». Apuesta a un número: cuanto más raro, más paga (×2,03 … ×50,76).', 'La rueda gira y frena bajo el puntero: gana el número donde se detiene.'],
      pt: ['A grande roda tem 54 casas: 25 × «1», 15 × «2», 7 × «5», 4 × «10», 2 × «20» e um único «40». Aposte num número: quanto mais raro, mais paga (×2,03 … ×50,76).', 'A roda gira e desacelera sob o ponteiro: ganha o número onde ela para.'],
      ar: ['للعجلة الكبيرة 54 خانة: 25 × «1» و15 × «2» و7 × «5» و4 × «10» و2 × «20» و«40» واحدة. راهن على رقم: كلما ندر زاد عائده (×2.03 … ×50.76).', 'تدور العجلة وتتباطأ تحت المؤشر: الرقم الذي تتوقف عنده يفوز.'],
      tr: ['Büyük çarkta 54 dilim var: 25 × “1”, 15 × “2”, 7 × “5”, 4 × “10”, 2 × “20” ve tek bir “40”. Bir sayıya oyna: ne kadar nadirse o kadar çok öder (×2,03 … ×50,76).', 'Çark döner ve göstergenin altında yavaşlar: durduğu sayı kazanır.'],
      vi: ['Bánh xe lớn có 54 ô: 25 × «1», 15 × «2», 7 × «5», 4 × «10», 2 × «20» và một ô «40». Cược một số: càng hiếm càng trả cao (×2,03 … ×50,76).', 'Bánh xe quay rồi chậm dần dưới kim chỉ: số dừng lại sẽ thắng.'],
      id: ['Roda besar punya 54 kotak: 25 × «1», 15 × «2», 7 × «5», 4 × «10», 2 × «20» dan satu «40». Pasang satu angka: makin langka, makin besar (×2,03 … ×50,76).', 'Roda berputar lalu melambat di bawah penunjuk: angka tempat ia berhenti menang.'],
      ru: ['На большом колесе 54 сектора: 25 × «1», 15 × «2», 7 × «5», 4 × «10», 2 × «20» и один «40». Ставьте на число: чем реже, тем больше (×2,03 … ×50,76).', 'Колесо вращается и замедляется под стрелкой: выигрывает число, на котором оно остановится.'],
      de: ['Das große Rad hat 54 Felder: 25 × „1“, 15 × „2“, 7 × „5“, 4 × „10“, 2 × „20“ und eine einzige „40“. Setze auf eine Zahl: je seltener, desto höher (×2,03 … ×50,76).', 'Das Rad dreht sich und bremst unter dem Zeiger: die Zahl, auf der es stehen bleibt, gewinnt.'],
      hi: ['बड़े पहिये में 54 खाने हैं: 25 × «1», 15 × «2», 7 × «5», 4 × «10», 2 × «20» और एक «40»। किसी नंबर पर दांव लगाएं: जितना दुर्लभ, उतना बड़ा भुगतान (×2.03 … ×50.76)।', 'पहिया घूमता है और सूचक के नीचे धीमा होता है: जिस नंबर पर रुके, वह जीतता है।'],
      zh: ['大转轮共 54 格：25 个「1」、15 个「2」、7 个「5」、4 个「10」、2 个「20」和 1 个「40」。押一个数字：越稀有赔率越高（×2.03 … ×50.76）。', '转轮旋转后在指针下慢慢停住：停下的数字获胜。']
    }),
    scene: function (uid) {
      var s = '', lb = '';
      MW_SEG.forEach(function (v, k) {
        var a0 = (k - .5) * MW_ST * Math.PI / 180 - Math.PI / 2, a1 = (k + .5) * MW_ST * Math.PI / 180 - Math.PI / 2, r = MW_R - 4, ri = 30;
        s += '<path d="M' + (Math.cos(a0) * ri).toFixed(1) + ' ' + (Math.sin(a0) * ri).toFixed(1) + 'L' + (Math.cos(a0) * r).toFixed(1) + ' ' + (Math.sin(a0) * r).toFixed(1) + 'A' + r + ' ' + r + ' 0 0 1 ' + (Math.cos(a1) * r).toFixed(1) + ' ' + (Math.sin(a1) * r).toFixed(1) + 'L' + (Math.cos(a1) * ri).toFixed(1) + ' ' + (Math.sin(a1) * ri).toFixed(1) + 'Z" fill="' + MW_C[v][k % 2 ? 0 : 1] + '" stroke="#1F1305" stroke-width=".6"/>';
        lb += '<text transform="rotate(' + (k * MW_ST).toFixed(2) + ') translate(0 ' + (-(MW_R - 17)) + ') rotate(90)" text-anchor="middle" y="3" class="mw-l v' + v + '">' + v + '</text>';
      });
      var bulbs = ''; for (var b = 0; b < 27; b++) { var a = b / 27 * Math.PI * 2; bulbs += '<circle class="mw-bulb" cx="' + (Math.cos(a) * (MW_R + 4)).toFixed(1) + '" cy="' + (Math.sin(a) * (MW_R + 4)).toFixed(1) + '" r="2"/>'; }
      return '<defs>' + rgd('mwH' + uid, '#FFF7D6', '#F59E0B', '#78350F') + '<radialGradient id="mwBg' + uid + '" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#3B0764"/><stop offset="1" stop-color="#0F0520"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="url(#mwBg' + uid + ')"/>' +
        '<g transform="translate(' + MW_X + ' ' + MW_Y + ')"><circle r="' + (MW_R + 9) + '" fill="#2A1203" stroke="url(#mwH' + uid + ')" stroke-width="7"/>' + bulbs +
        '<g class="mw-rot">' + s + lb + '</g><circle r="30" fill="url(#mwH' + uid + ')" stroke="#78350F" stroke-width="2"/><text class="mw-cd" y="5" text-anchor="middle"></text></g>' +
        '<g class="mw-ptr" transform="translate(' + MW_X + ' ' + (MW_Y - MW_R - 6) + ')"><path d="M-10-12H10L0 12Z" fill="#F8FAFC" stroke="#DC2626" stroke-width="2.4" stroke-linejoin="round"/></g>' +
        '<g class="mw-pop" opacity="0"></g>';
    },
    board: function (uid, l, oddTxt, o) { return [1, 2, 5, 10, 20, 40].map(function (v) { return '<button type="button" data-s="v' + v + '">' + mwChip(v) + '<b class="fit" data-o="v' + v + '">' + oddTxt(o['v' + v]) + '</b></button>'; }).join(''); },
    hist: function (n) { return mwChip(MW_SEG[n] || 1); },
    wins: function (res) { return ['v' + MW_SEG[+res.n]]; },
    init: function (c) { c.rot = c.q('.mw-rot'); c.ptr = c.q('.mw-ptr'); c.cd = c.q('.mw-cd'); c.pop = c.q('.mw-pop'); c.pn = -1; },
    frame: function (c, R, t, e, res) {
      var rot;
      if (!res) {
        rot = R ? mwRot(R, 0) + (t - R.close) * 7 : t * 7;
        var on = !!R && e < 0; txt(c.cd, on ? mmss(R.close - t) : ''); cls(c.cd, 'mw-cd' + (on && R.close - t <= 10 ? ' warn' : ''));
        sa(c.pop, 'opacity', '0');
      } else {
        rot = mwRot(R, e, +res.n); txt(c.cd, '');
        var v = MW_SEG[+res.n], pk = eo(seg(e, MW_SPIN + .2, MW_SPIN + 1));
        if (pk > 0) { if (c.pn !== v) { c.pn = v; c.pop.innerHTML = '<g transform="scale(2.4)">' + mwChip(v).replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g>'; } sa(c.pop, 'opacity', '1'); sa(c.pop, 'transform', tr(MW_X, MW_Y, pk)); }
        else sa(c.pop, 'opacity', '0');
      }
      sa(c.rot, 'transform', 'rotate(' + (rot % 360).toFixed(2) + ')');
      var ph = (rot % MW_ST) / MW_ST, sp = res && e < MW_SPIN ? 1 - seg(e, 0, MW_SPIN) : .15;
      sa(c.ptr, 'transform', 'translate(' + MW_X + ' ' + (MW_Y - MW_R - 6) + ') rotate(' + (-Math.max(0, .35 - ph) / .35 * 22 * Math.min(1, sp * 2)).toFixed(1) + ' 0 -12)');
    }
  });

  /* ===================================================== Coin Toss Live ======================================================== */
  var CO_X = [84, 180, 276], CO_T = [1, 4, 7];
  function coinFace(head, uid) {
    return head ? '<circle r="30" fill="url(#coG' + uid + ')" stroke="#92400E" stroke-width="2"/><circle r="24" fill="none" stroke="#FEF3C7" stroke-opacity=".7" stroke-width="1.4"/>' +
      '<path d="M-14 6l-3-15 9 7 8-12 8 12 9-7-3 15z" fill="#FEF3C7" stroke="#B45309" stroke-width="1.2"/><rect x="-14" y="6" width="28" height="5" rx="2" fill="#B45309"/>'
      : '<circle r="30" fill="url(#coS' + uid + ')" stroke="#334155" stroke-width="2"/><circle r="24" fill="none" stroke="#F8FAFC" stroke-opacity=".7" stroke-width="1.4"/>' +
      '<path d="M0-15l4.4 9.3 10.1 1.3-7.4 7 1.9 10L0 7.7l-9 4.9 1.9-10-7.4-7 10.1-1.3z" fill="#F8FAFC" stroke="#475569" stroke-width="1.2"/>';
  }
  function coDefs(u) { return rgd('coG' + u, '#FEF9C3', '#F59E0B', '#92400E') + rgd('coS' + u, '#FFFFFF', '#CBD5E1', '#475569'); }
  function coMini(list) { var u = 'm' + (++GID); return '<svg viewBox="-34 -13 68 26" aria-hidden="true"><defs>' + coDefs(u) + '</defs>' + list.map(function (h, k) { return '<g transform="translate(' + ((k - (list.length - 1) / 2) * 21) + ' 0) scale(.36)">' + coinFace(h, u) + '</g>'; }).join('') + '</svg>'; }
  live('coinlive', {
    SHOW: 11, lab: 'co', bev: 'coin', endEv: 'coin', odds0: { h: 1.88, t: 1.88, h3: 7.52, h2: 2.5, t2: 2.5, t3: 7.52 },
    beat: function (e) { var n = 0; CO_T.forEach(function (x) { if (e >= x + 2.2) n++; }); return n; },
    rules: rules(150, {
      en: ['Three coins are tossed one after another. Bet on Heads (gold crown) or Tails (silver star) for the majority (×1.88), on exactly two of a side (×2.50) or on all three alike (×7.52).', 'Each coin spins in the air and lands: when the third one falls, the coins on the table decide.'],
      fr: ['Trois pièces sont lancées l’une après l’autre. Parie sur Face (couronne d’or) ou Pile (étoile d’argent) en majorité (×1,88), sur exactement deux du même côté (×2,50) ou sur les trois pareilles (×7,52).', 'Chaque pièce tourne en l’air et retombe : quand la troisième est tombée, les pièces sur la table décident.'],
      es: ['Se lanzan tres monedas una tras otra. Apuesta a Cara (corona de oro) o Cruz (estrella de plata) en mayoría (×1,88), a exactamente dos de un lado (×2,50) o a las tres iguales (×7,52).', 'Cada moneda gira en el aire y cae: cuando cae la tercera, deciden las monedas sobre la mesa.'],
      pt: ['Três moedas são lançadas uma após a outra. Aposte em Cara (coroa de ouro) ou Coroa (estrela de prata) na maioria (×1,88), em exatamente duas de um lado (×2,50) ou nas três iguais (×7,52).', 'Cada moeda gira no ar e cai: quando a terceira cai, as moedas na mesa decidem.'],
      ar: ['تُرمى ثلاث عملات واحدة تلو الأخرى. راهن على الصورة (تاج ذهبي) أو الكتابة (نجمة فضية) للأغلبية (×1.88)، أو على اثنتين بالضبط من وجه واحد (×2.50)، أو على الثلاث متشابهة (×7.52).', 'تدور كل عملة في الهواء ثم تسقط: عند سقوط الثالثة تحسم العملات على الطاولة النتيجة.'],
      tr: ['Üç para art arda atılır. Çoğunluk için Tura (altın taç) veya Yazı’ya (gümüş yıldız) (×1,88), tam iki aynı yüze (×2,50) ya da üçünün aynı gelmesine (×7,52) oyna.', 'Her para havada döner ve düşer: üçüncüsü düştüğünde masadaki paralar belirler.'],
      vi: ['Ba đồng xu được tung lần lượt. Cược Ngửa (vương miện vàng) hoặc Sấp (ngôi sao bạc) chiếm đa số (×1,88), đúng hai mặt giống nhau (×2,50) hoặc cả ba giống nhau (×7,52).', 'Mỗi đồng xu xoay trên không rồi rơi xuống: khi đồng thứ ba rơi, các đồng xu trên bàn quyết định.'],
      id: ['Tiga koin dilempar satu per satu. Pasang Gambar (mahkota emas) atau Angka (bintang perak) sebagai mayoritas (×1,88), tepat dua sisi sama (×2,50) atau ketiganya sama (×7,52).', 'Setiap koin berputar di udara lalu jatuh: saat koin ketiga jatuh, koin di meja menentukan.'],
      ru: ['Три монеты бросают одну за другой. Ставьте на Орла (золотая корона) или Решку (серебряная звезда) по большинству (×1,88), ровно на две одинаковые (×2,50) или на все три одинаковые (×7,52).', 'Каждая монета крутится в воздухе и падает: когда упадёт третья, решают монеты на столе.'],
      de: ['Drei Münzen werden nacheinander geworfen. Setze auf Kopf (goldene Krone) oder Zahl (silberner Stern) in der Mehrheit (×1,88), auf genau zwei einer Seite (×2,50) oder auf alle drei gleich (×7,52).', 'Jede Münze wirbelt durch die Luft und landet: Wenn die dritte gefallen ist, entscheiden die Münzen auf dem Tisch.'],
      hi: ['तीन सिक्के एक के बाद एक उछाले जाते हैं। बहुमत के लिए चित (सोने का मुकुट) या पट (चाँदी का तारा) (×1.88), ठीक दो एक जैसे (×2.50) या तीनों एक जैसे (×7.52) पर दांव लगाएं।', 'हर सिक्का हवा में घूमकर गिरता है: तीसरा गिरते ही मेज़ पर पड़े सिक्के फ़ैसला करते हैं।'],
      zh: ['三枚硬币依次抛出。押多数为正面（金色王冠）或反面（银色星星）（×1.88），押恰好两枚同面（×2.50），或三枚全同（×7.52）。', '每枚硬币在空中翻转后落下：第三枚落定后，以桌上的硬币定输赢。']
    }),
    scene: function (uid) {
      var coins = CO_X.map(function (x, k) { return '<ellipse class="co-sh" cx="' + x + '" cy="170" rx="30" ry="6" fill="#000" opacity=".35"/><g class="co-c"><g class="co-in"><g class="co-h">' + coinFace(1, uid) + '</g><g class="co-t" opacity="0">' + coinFace(0, uid) + '</g></g></g>'; }).join('');
      return '<defs>' + coDefs(uid) + '<radialGradient id="coBg' + uid + '" cx="50%" cy="80%" r="80%"><stop offset="0" stop-color="#7C2D12"/><stop offset="1" stop-color="#1C0A04"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#1C0A04"/><rect x="6" y="4" width="348" height="222" rx="20" fill="url(#coBg' + uid + ')" stroke="#B45309" stroke-width="2"/>' +
        '<path d="M20 176Q180 150 340 176V222H20Z" fill="#14532D" stroke="#FDE68A" stroke-opacity=".5"/>' + coins +
        '<text class="co-cd" x="180" y="44" text-anchor="middle"></text><text class="co-big" x="180" y="212" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) {
      var b = function (s, ic, lab, k) { return '<button type="button" data-s="' + s + '" class="co-b ' + k + '">' + ic + (lab ? '<span class="fit">' + K.esc(lab) + '</span>' : '') + '<b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; };
      return b('h', coMini([1]), l.heads, 'w') + b('t', coMini([0]), l.tails, 'w') + b('h3', coMini([1, 1, 1])) + b('h2', coMini([1, 1, 0])) + b('t2', coMini([0, 0, 1])) + b('t3', coMini([0, 0, 0]));
    },
    hist: function (n) { var a = []; for (var k = 0; k < 3; k++) a.push(k < n ? 1 : 0); return coMini(a); },
    wins: function (res) { var n = +res.n; return [n >= 2 ? 'h' : 't', ['t3', 't2', 'h2', 'h3'][n]]; },
    init: function (c) { c.c = [].slice.call(c.box.querySelectorAll('.co-c')); c.inn = c.c.map(function (g) { return g.querySelector('.co-in'); }); c.hh = c.c.map(function (g) { return g.querySelector('.co-h'); }); c.tt = c.c.map(function (g) { return g.querySelector('.co-t'); }); c.sh = [].slice.call(c.box.querySelectorAll('.co-sh')); c.cd = c.q('.co-cd'); c.big = c.q('.co-big'); },
    frame: function (c, R, t, e, res) {
      for (var k = 0; k < 3; k++) {
        var y = 140, ang = 0, head = true;
        if (res) {
          var f = seg(e, CO_T[k], CO_T[k] + 2.2), H = 10 + (+res.h[k] ? 0 : 1);
          y = 140 - Math.sin(f * Math.PI) * 112; ang = Math.PI * H * eio(f);
          var co = Math.cos(ang); head = co >= 0;
          sa(c.inn[k], 'transform', 'scale(1 ' + Math.max(.04, Math.abs(co)).toFixed(3) + ')');
        } else { var w = Math.sin(t * 1.5 + k) * .08; sa(c.inn[k], 'transform', 'scale(1 ' + (1 - Math.abs(w)).toFixed(3) + ')'); head = !(R && R.res && R.res.h ? !+R.res.h[k] : k === 1); }
        sa(c.c[k], 'transform', tr(CO_X[k], y)); sa(c.hh[k], 'opacity', head ? '1' : '0'); sa(c.tt[k], 'opacity', head ? '0' : '1');
        sa(c.sh[k], 'opacity', (.35 * (y / 140)).toFixed(2));
      }
      var on = !!R && !res && e < 0; txt(c.cd, on ? mmss(R.close - t) : ''); cls(c.cd, 'co-cd' + (on && R.close - t <= 10 ? ' warn' : ''));
      var n = res ? +res.n : 0, done = res && e >= 9.4;
      txt(c.big, done ? (n >= 2 ? c.l.heads : c.l.tails) + ' · ' + (n >= 2 ? n : 3 - n) + '/3' : ''); cls(c.big, 'co-big ' + (n >= 2 ? 'h' : 't'));
    }
  });

  /* ===================================================== Peg Drop Live ========================================================= */
  var PD_X = 180, PD_DX = 30, PD_Y0 = 30, PD_DY = 19, PD_T0 = .6, PD_ROW = .72, PD_COL = ['#16A34A', '#65A30D', '#CA8A04', '#EA580C', '#DC2626'];
  function pdBars(sel) { var s = '<svg viewBox="0 0 54 20" aria-hidden="true">'; for (var b = 0; b < 9; b++) { var on = sel.indexOf(b) >= 0; s += '<rect x="' + (b * 6 + .5) + '" y="' + (on ? 2 : 10) + '" width="5" height="' + (on ? 16 : 8) + '" rx="1.5" fill="' + (on ? PD_COL[Math.abs(b - 4)] : 'rgba(255,255,255,.22)') + '"/>'; } return s + '</svg>'; }
  function pdPos(h, e) { // ball position along its path (same on every phone)
    var p = (e - PD_T0) / PD_ROW, r = Math.floor(p), f = p - r, rights = 0, k;
    if (p < 0) return [PD_X, PD_Y0 - 16 + Math.sin(e * 6) * 1.5];
    if (r >= 8) { for (k = 0; k < 8; k++) rights += +h[k]; var bx = PD_X + (rights - 4) * PD_DX; return [bx, Math.min(205, PD_Y0 + 7 * PD_DY + 10 + (p - 8) * 60)]; }
    for (k = 0; k < r; k++) rights += +h[k];
    var x0 = PD_X + (rights - r / 2) * PD_DX, x1 = x0 + (+h[r] ? .5 : -.5) * PD_DX, y0 = PD_Y0 + r * PD_DY - 7, y1 = y0 + PD_DY;
    return [lerp(x0, x1, f), lerp(y0, y1, f * f) - Math.sin(f * Math.PI) * 6];
  }
  live('pegdrop', {
    SHOW: 8.6, lab: 'pd', bev: 'tick', endEv: 'coin', odds0: { L: 2.58, d4: 120.32, d3: 15.04, d2: 4.29, d1: 2.14, d0: 3.43, R: 2.58 },
    beat: function (e) { return e < PD_T0 ? -1 : Math.min(9, Math.floor((e - PD_T0) / PD_ROW) + 1); },
    rules: rules(150, {
      en: ['A ball falls through 8 rows of pegs into one of 9 boxes. Bet on the centre box (×3.43), on a pair of boxes at the same distance from the centre (next to it ×2.14 … the two edges ×120.32), or on the Left (boxes 1–4) or Right (6–9) side (×2.58).', 'At each peg the ball bounces left or right (1 chance in 2): the box where it lands decides.'],
      fr: ['Une bille traverse 8 rangées de clous et tombe dans une des 9 cases. Parie sur la case du centre (×3,43), sur une paire de cases à la même distance du centre (ses voisines ×2,14 … les deux bords ×120,32), ou sur le côté Gauche (cases 1–4) ou Droit (6–9) (×2,58).', 'À chaque clou, la bille rebondit à gauche ou à droite (1 chance sur 2) : la case où elle tombe décide.'],
      es: ['Una bola cae por 8 filas de clavos hasta una de 9 casillas. Apuesta a la casilla central (×3,43), a un par de casillas a la misma distancia del centro (las vecinas ×2,14 … los dos bordes ×120,32), o al lado Izquierdo (casillas 1–4) o Derecho (6–9) (×2,58).', 'En cada clavo la bola rebota a la izquierda o a la derecha (1 de cada 2): decide la casilla donde cae.'],
      pt: ['Uma bola cai por 8 fileiras de pinos até uma de 9 casas. Aposte na casa central (×3,43), num par de casas à mesma distância do centro (as vizinhas ×2,14 … as duas bordas ×120,32), ou no lado Esquerdo (casas 1–4) ou Direito (6–9) (×2,58).', 'Em cada pino a bola quica para a esquerda ou para a direita (1 chance em 2): decide a casa onde ela cai.'],
      ar: ['تسقط كرة عبر 8 صفوف من المسامير إلى إحدى 9 خانات. راهن على الخانة الوسطى (×3.43)، أو على خانتين على البعد نفسه من الوسط (المجاورتان ×2.14 … الطرفان ×120.32)، أو على الجهة اليسرى (الخانات 1–4) أو اليمنى (6–9) (×2.58).', 'عند كل مسمار ترتد الكرة يسارًا أو يمينًا (فرصة من اثنتين): الخانة التي تسقط فيها تحسم النتيجة.'],
      tr: ['Bir top 8 sıra çividen geçip 9 kutudan birine düşer. Ortadaki kutuya (×3,43), merkeze aynı uzaklıktaki bir kutu çiftine (yanındakiler ×2,14 … iki uç ×120,32) ya da Sol (1–4) veya Sağ (6–9) tarafa (×2,58) oyna.', 'Her çivide top sola ya da sağa sekiyor (2’de 1 şans): düştüğü kutu sonucu belirler.'],
      vi: ['Một viên bi rơi qua 8 hàng đinh vào một trong 9 ô. Cược ô giữa (×3,43), một cặp ô cách đều tâm (hai ô kề ×2,14 … hai ô biên ×120,32), hoặc bên Trái (ô 1–4) hay Phải (6–9) (×2,58).', 'Mỗi lần chạm đinh, bi nảy sang trái hoặc phải (1 phần 2): ô bi rơi vào quyết định.'],
      id: ['Sebuah bola jatuh melewati 8 baris paku ke salah satu dari 9 kotak. Pasang kotak tengah (×3,43), sepasang kotak dengan jarak sama dari tengah (sebelahnya ×2,14 … kedua tepi ×120,32), atau sisi Kiri (kotak 1–4) atau Kanan (6–9) (×2,58).', 'Di setiap paku bola memantul ke kiri atau kanan (peluang 1 banding 2): kotak tempat ia jatuh menentukan.'],
      ru: ['Шарик падает через 8 рядов штырьков в одну из 9 ячеек. Ставьте на центральную ячейку (×3,43), на пару ячеек на одном расстоянии от центра (соседние ×2,14 … два края ×120,32) или на Левую (ячейки 1–4) или Правую (6–9) сторону (×2,58).', 'На каждом штырьке шарик отскакивает влево или вправо (1 шанс из 2): решает ячейка, куда он упадёт.'],
      de: ['Eine Kugel fällt durch 8 Reihen Stifte in eines von 9 Fächern. Setze auf das mittlere Fach (×3,43), auf ein Fächerpaar mit gleichem Abstand zur Mitte (die Nachbarn ×2,14 … die beiden Ränder ×120,32) oder auf die linke (Fächer 1–4) bzw. rechte (6–9) Seite (×2,58).', 'An jedem Stift springt die Kugel nach links oder rechts (1 zu 2): das Fach, in dem sie landet, entscheidet.'],
      hi: ['एक गेंद कीलों की 8 कतारों से गिरकर 9 खानों में से एक में जाती है। बीच के खाने (×3.43), बीच से बराबर दूरी वाले दो खानों (पास वाले ×2.14 … दोनों किनारे ×120.32), या बाईं (खाने 1–4) या दाईं (6–9) तरफ़ (×2.58) पर दांव लगाएं।', 'हर कील पर गेंद बाएँ या दाएँ उछलती है (2 में 1 मौका): जिस खाने में गिरे, वह फ़ैसला करता है।'],
      zh: ['小球穿过 8 排钉子落入 9 个格子之一。押正中格（×3.43）、离中心等距的一对格子（相邻 ×2.14 … 两端 ×120.32），或押左边（1–4 格）/ 右边（6–9 格）（×2.58）。', '每碰到一颗钉子，小球向左或向右弹（各一半机会）：落入的格子定输赢。']
    }),
    scene: function (uid) {
      var pegs = '', bins = '';
      for (var r = 0; r < 8; r++) for (var j = 0; j <= r; j++) pegs += '<circle cx="' + (PD_X + (j - r / 2) * PD_DX) + '" cy="' + (PD_Y0 + r * PD_DY) + '" r="3.2" class="pd-peg"/>';
      for (var b = 0; b < 9; b++) { var x = PD_X + (b - 4) * PD_DX, col = PD_COL[Math.abs(b - 4)]; bins += '<g class="pd-bin" data-b="' + b + '"><rect x="' + (x - 13) + '" y="186" width="26" height="34" rx="6" fill="' + col + '" fill-opacity=".28" stroke="' + col + '" stroke-width="1.4"/><circle class="pd-dot" cx="' + x + '" cy="210" r="3.4" fill="' + col + '"/></g>'; }
      return '<defs>' + rgd('pdB' + uid, '#FFFFFF', '#E0E7FF', '#6366F1') + '<linearGradient id="pdBg' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1A3D"/><stop offset="1" stop-color="#1E1048"/></linearGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="url(#pdBg' + uid + ')"/><path d="M180 6L40 180H320Z" fill="#fff" fill-opacity=".03"/>' + pegs + bins +
        '<g class="pd-ball"><circle r="7" fill="url(#pdB' + uid + ')"/><circle cx="-2" cy="-2.4" r="2" fill="#fff" opacity=".8"/></g>' +
        '<text class="pd-cd" x="54" y="40" text-anchor="middle"></text><text class="pd-big" x="306" y="40" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) {
      var b = function (s, bins) { return '<button type="button" data-s="' + s + '">' + pdBars(bins) + '<b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; };
      return b('L', [0, 1, 2, 3]) + b('d4', [0, 8]) + b('d3', [1, 7]) + b('d2', [2, 6]) + b('d1', [3, 5]) + b('d0', [4]) + b('R', [5, 6, 7, 8]);
    },
    hist: function (n) { return pdBars([n]); },
    wins: function (res) { var n = +res.n, w = ['d' + Math.abs(n - 4)]; if (n <= 3) w.push('L'); if (n >= 5) w.push('R'); return w; },
    init: function (c) { c.ball = c.q('.pd-ball'); c.bins = [].slice.call(c.box.querySelectorAll('.pd-bin')); c.cd = c.q('.pd-cd'); c.big = c.q('.pd-big'); },
    frame: function (c, R, t, e, res) {
      var p = res ? pdPos(res.h, e) : [PD_X + Math.sin(t * 1.4) * 10, PD_Y0 - 16 + Math.sin(t * 3) * 1.5];
      sa(c.ball, 'transform', tr(p[0], p[1]));
      var land = res && e >= PD_T0 + 8 * PD_ROW + .3 ? +res.n : -1;
      c.bins.forEach(function (g, b) { cls(g, 'pd-bin' + (b === land ? ' win' : '')); });
      var on = !!R && !res && e < 0; txt(c.cd, on ? mmss(R.close - t) : ''); cls(c.cd, 'pd-cd' + (on && R.close - t <= 10 ? ' warn' : ''));
      txt(c.big, land >= 0 ? (land === 4 ? '•' : land < 4 ? '◀ ' + (4 - land) : (land - 4) + ' ▶') : '');
    }
  });

  /* ======================================================= Goal Rush ============================================================ */
  var FB_L = 16, FB_R = 344, FB_T = 34, FB_B = 214, FB_CY = 124, FB_SPM = 1 / 3; // 3 match minutes per second
  function fbShirt(col, num) { return '<svg viewBox="-13 -12 26 24" aria-hidden="true"><path d="M-5-10L-12-6L-9 0L-7-1V10H7V-1L9 0L12-6L5-10Q0-6-5-10Z" fill="' + col + '" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>' + (num ? '<text y="5" text-anchor="middle" class="fb-sn">' + num + '</text>' : '') + '</svg>'; }
  function fbWander(e, i) { return [180 + 128 * Math.sin(.74 * e + hr(i, 1) * 6) * Math.cos(.31 * e + hr(i, 2) * 6), FB_CY + 66 * Math.sin(1.07 * e + hr(i, 3) * 6)]; }
  function fbBall(res, e, i) {
    var g = res.g || [], w = fbWander(e, i);
    for (var k = 0; k < g.length; k++) {
      var tg = g[k][0] * FB_SPM, gx = g[k][1] ? FB_L + 2 : FB_R - 2, gy = FB_CY + (hr(i, 40 + k) - .5) * 26;
      if (e >= tg - 1.6 && e < tg) { var a = fbWander(tg - 1.6, i), f = eio((e - (tg - 1.6)) / 1.6); return [lerp(a[0], gx, f), lerp(a[1], gy, f), k, 0]; }
      if (e >= tg && e < tg + 1.3) return [gx + (g[k][1] ? -6 : 6), gy, k, 1];
      if (e >= tg + 1.3 && e < tg + 2.1) { var f2 = eio((e - tg - 1.3) / .8), b = fbWander(tg + 2.1, i); return [lerp(180, b[0], f2), lerp(FB_CY, b[1], f2), k, 0]; }
    }
    return [w[0], w[1], -1, 0];
  }
  var FB_POS = [[.12, .5], [.3, .25], [.3, .75], [.46, .4], [.46, .62]];
  live('football', {
    SHOW: 31.5, lab: 'fb', bev: 'kick', endEv: 'coin', odds0: { '1': 2.13, x: 3.77, '2': 3.03, o: 1.8, u: 1.96, gg: 1.72 },
    beat: function (e, res) { var n = 0; (res.g || []).forEach(function (g) { if (e >= g[0] * FB_SPM) n++; }); return n + (e >= 30 ? 10 : 0); },
    rules: rules(180, {
      en: ['Red against Blue, a 90-minute virtual match. Bet on 1 (Red wins), X (draw) or 2 (Blue wins), on +2.5 (3 goals or more) or −2.5 (2 goals or fewer), or on GG (both teams score). Each bet shows its payout.', 'The goals are drawn by the server with fixed chances (Red is slightly stronger): the final score decides.'],
      fr: ['Rouges contre Bleus, un match virtuel de 90 minutes. Parie sur 1 (les Rouges gagnent), X (match nul) ou 2 (les Bleus gagnent), sur +2,5 (3 buts ou plus) ou −2,5 (2 buts ou moins), ou sur GG (les deux équipes marquent). Chaque pari affiche son gain.', 'Les buts sont tirés par le serveur avec des chances fixes (les Rouges sont un peu plus forts) : le score final décide.'],
      es: ['Rojos contra Azules, un partido virtual de 90 minutos. Apuesta a 1 (ganan los Rojos), X (empate) o 2 (ganan los Azules), a +2,5 (3 goles o más) o −2,5 (2 goles o menos), o a GG (marcan ambos). Cada apuesta muestra su pago.', 'Los goles los sortea el servidor con probabilidades fijas (los Rojos son un poco más fuertes): decide el marcador final.'],
      pt: ['Vermelhos contra Azuis, uma partida virtual de 90 minutos. Aposte em 1 (Vermelhos vencem), X (empate) ou 2 (Azuis vencem), em +2,5 (3 gols ou mais) ou −2,5 (2 gols ou menos), ou em GG (ambos marcam). Cada aposta mostra o pagamento.', 'Os gols são sorteados pelo servidor com chances fixas (os Vermelhos são um pouco mais fortes): o placar final decide.'],
      ar: ['الأحمر ضد الأزرق، مباراة افتراضية من 90 دقيقة. راهن على 1 (فوز الأحمر) أو X (تعادل) أو 2 (فوز الأزرق)، أو على +2.5 (3 أهداف أو أكثر) أو −2.5 (هدفان أو أقل)، أو على GG (الفريقان يسجلان). يُظهر كل رهان عائده.', 'يسحب الخادم الأهداف بفرص ثابتة (الأحمر أقوى قليلًا): النتيجة النهائية تحسم.'],
      tr: ['Kırmızı ile Mavi, 90 dakikalık sanal maç. 1 (Kırmızı kazanır), X (beraberlik) veya 2’ye (Mavi kazanır), +2,5 (3 gol ve üstü) ya da −2,5’e (2 gol ve altı) veya GG’ye (iki takım da gol atar) oyna. Her bahis ödemesini gösterir.', 'Goller sunucu tarafından sabit şanslarla çekilir (Kırmızı biraz daha güçlü): maç sonucu belirler.'],
      vi: ['Đỏ đấu Xanh, trận đấu ảo 90 phút. Cược 1 (Đỏ thắng), X (hòa) hoặc 2 (Xanh thắng), +2,5 (từ 3 bàn) hoặc −2,5 (tối đa 2 bàn), hoặc GG (cả hai đội ghi bàn). Mỗi cửa hiện tỷ lệ trả.', 'Bàn thắng do máy chủ quay với xác suất cố định (Đỏ mạnh hơn một chút): tỷ số cuối cùng quyết định.'],
      id: ['Merah melawan Biru, pertandingan virtual 90 menit. Pasang 1 (Merah menang), X (seri) atau 2 (Biru menang), +2,5 (3 gol atau lebih) atau −2,5 (2 gol atau kurang), atau GG (kedua tim mencetak gol). Setiap taruhan menampilkan bayarannya.', 'Gol diundi server dengan peluang tetap (Merah sedikit lebih kuat): skor akhir menentukan.'],
      ru: ['Красные против Синих, виртуальный матч на 90 минут. Ставьте на 1 (победа Красных), X (ничья) или 2 (победа Синих), на +2,5 (3 гола и больше) или −2,5 (2 гола и меньше) либо на GG (забьют обе команды). У каждой ставки своя выплата.', 'Голы разыгрывает сервер с постоянными шансами (Красные чуть сильнее): решает итоговый счёт.'],
      de: ['Rot gegen Blau, ein virtuelles 90-Minuten-Spiel. Setze auf 1 (Rot gewinnt), X (Unentschieden) oder 2 (Blau gewinnt), auf +2,5 (3 Tore oder mehr) oder −2,5 (2 Tore oder weniger) oder auf GG (beide treffen). Jede Wette zeigt ihre Auszahlung.', 'Die Tore lost der Server mit festen Chancen aus (Rot ist etwas stärker): das Endergebnis entscheidet.'],
      hi: ['लाल बनाम नीला, 90 मिनट का वर्चुअल मैच। 1 (लाल जीते), X (ड्रॉ) या 2 (नीला जीते), +2.5 (3 या ज़्यादा गोल) या −2.5 (2 या कम गोल), या GG (दोनों टीमें गोल करें) पर दांव लगाएं। हर दांव पर उसका भुगतान लिखा है।', 'गोल सर्वर तय संभावनाओं से निकालता है (लाल थोड़ा मज़बूत है): अंतिम स्कोर फ़ैसला करता है।'],
      zh: ['红队对蓝队，90 分钟虚拟比赛。押 1（红队胜）、X（平局）或 2（蓝队胜），押 +2.5（3 球或以上）或 −2.5（2 球或以下），或押 GG（双方都进球）。每项都标有赔率。', '进球由服务器按固定概率开出（红队稍强）：以最终比分定输赢。']
    }),
    scene: function (uid) {
      var stripes = ''; for (var k = 0; k < 8; k++) stripes += '<rect x="' + (FB_L + k * 41) + '" y="' + FB_T + '" width="20.5" height="' + (FB_B - FB_T) + '" fill="#fff" opacity=".035"/>';
      var pl = ''; for (var p = 0; p < 10; p++) pl += '<g class="fb-p ' + (p < 5 ? 'r' : 'b') + '"><circle r="5.4"/><circle r="2.2" cy="-1" fill="#fff" opacity=".55"/></g>';
      return '<defs><linearGradient id="fbG' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15803D"/><stop offset="1" stop-color="#166534"/></linearGradient>' + rgd('fbBl' + uid, '#FFFFFF', '#F1F5F9', '#64748B') + '</defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#052E16"/><rect x="' + FB_L + '" y="' + FB_T + '" width="' + (FB_R - FB_L) + '" height="' + (FB_B - FB_T) + '" fill="url(#fbG' + uid + ')"/>' + stripes +
        '<g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"><rect x="' + FB_L + '" y="' + FB_T + '" width="' + (FB_R - FB_L) + '" height="' + (FB_B - FB_T) + '"/><path d="M180 ' + FB_T + 'V' + FB_B + '"/><circle cx="180" cy="' + FB_CY + '" r="24"/>' +
          '<rect x="' + FB_L + '" y="' + (FB_CY - 40) + '" width="38" height="80"/><rect x="' + (FB_R - 38) + '" y="' + (FB_CY - 40) + '" width="38" height="80"/></g>' +
        '<g class="fb-net l"><rect x="' + (FB_L - 10) + '" y="' + (FB_CY - 20) + '" width="10" height="40" fill="#fff" fill-opacity=".25" stroke="#fff" stroke-width="1.6"/></g>' +
        '<g class="fb-net r"><rect x="' + FB_R + '" y="' + (FB_CY - 20) + '" width="10" height="40" fill="#fff" fill-opacity=".25" stroke="#fff" stroke-width="1.6"/></g>' + pl +
        '<g class="fb-ball"><circle r="4.6" fill="url(#fbBl' + uid + ')" stroke="#0F172A" stroke-width=".6"/><path d="M-1.6-1.2l1.6-1.2 1.6 1.2-.6 1.9h-2z" fill="#0F172A"/></g>' +
        '<rect x="112" y="2" width="136" height="28" rx="9" fill="#020617" fill-opacity=".85" stroke="#FDE68A" stroke-opacity=".5"/>' +
        '<rect x="118" y="8" width="14" height="16" rx="3" fill="#DC2626"/><rect x="228" y="8" width="14" height="16" rx="3" fill="#2563EB"/>' +
        '<text class="fb-sc" x="180" y="22" text-anchor="middle">0 – 0</text><text class="fb-min" x="296" y="22" text-anchor="middle"></text>' +
        '<g class="fb-goal" opacity="0"><circle r="34" fill="#FDE68A" opacity=".25"/><g class="fb-gs"></g></g>';
    },
    board: function (uid, l, oddTxt, o) {
      var b = function (s, ic, lab) { return '<button type="button" data-s="' + s + '">' + (ic || '') + (lab ? '<span class="fb-l">' + lab + '</span>' : '') + '<b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; };
      var dc = K.dec();
      return b('1', fbShirt('#DC2626', '1')) + b('x', '', 'X') + b('2', fbShirt('#2563EB', '2')) + b('o', '', '+2' + dc + '5') + b('u', '', '−2' + dc + '5') + b('gg', '', 'GG');
    },
    hist: function (n) { var h = Math.floor(n / 10), a = n % 10; return '<span class="fb-h ' + (h > a ? 'r' : h < a ? 'b' : 'x') + '">' + h + '–' + a + '</span>'; },
    wins: function (res) { var n = +res.n, h = Math.floor(n / 10), a = n % 10, w = [h > a ? '1' : h < a ? '2' : 'x', h + a >= 3 ? 'o' : 'u']; if (h && a) w.push('gg'); return w; },
    init: function (c) { c.p = [].slice.call(c.box.querySelectorAll('.fb-p')); c.ball = c.q('.fb-ball'); c.sc = c.q('.fb-sc'); c.min = c.q('.fb-min'); c.goal = c.q('.fb-goal'); c.gs = c.q('.fb-gs'); c.nets = [c.q('.fb-net.l'), c.q('.fb-net.r')]; c.ng = -1; },
    frame: function (c, R, t, e, res) {
      var i = R ? R.i : 0, bp, h = 0, a = 0, gk = -1, inNet = 0;
      if (res) {
        bp = fbBall(res, Math.min(e, 30), i); gk = bp[2]; inNet = bp[3];
        (res.g || []).forEach(function (g) { if (e >= g[0] * FB_SPM) { if (g[1]) a++; else h++; } });
        txt(c.min, Math.min(90, Math.floor(e / FB_SPM)) + '’'); cls(c.min, 'fb-min' + (e >= 30 ? ' ft' : ''));
      } else {
        bp = [180 + Math.sin(t * 2) * 3, FB_CY, -1, 0];
        var on = !!R && e < 0; txt(c.min, on ? mmss(R.close - t) : ''); cls(c.min, 'fb-min' + (on && R.close - t <= 10 ? ' warn' : ''));
      }
      sa(c.ball, 'transform', tr(bp[0], bp[1]));
      txt(c.sc, h + ' – ' + a);
      var goals = h + a; if (res && c.ng >= 0 && goals > c.ng) { try { if (D6.Sfx && D6.Sfx.play) D6.Sfx.play('crowd', null, 'football'); } catch (eS) { /* ignore */ } } c.ng = res ? goals : -1;
      for (var p = 0; p < 10; p++) {
        var red = p < 5, f = FB_POS[p % 5], bx = red ? FB_L + f[0] * (FB_R - FB_L) : FB_R - f[0] * (FB_R - FB_L), by = FB_T + f[1] * (FB_B - FB_T);
        var pull = res && p % 5 ? .35 : .12, jx = Math.sin(t * 1.7 + p) * 4, jy = Math.cos(t * 1.3 + p * 2) * 4;
        sa(c.p[p], 'transform', tr(lerp(bx, bp[0], pull) + jx, lerp(by, bp[1], pull) + jy));
      }
      var gt = gk >= 0 && inNet ? 1 : 0, side = gk >= 0 && res.g[gk] ? res.g[gk][1] : 0;
      sa(c.nets[0], 'transform', gt && side ? 'translate(' + (Math.sin(t * 40) * 1.5).toFixed(1) + ' 0)' : ''); sa(c.nets[1], 'transform', gt && !side ? 'translate(' + (Math.sin(t * 40) * 1.5).toFixed(1) + ' 0)' : '');
      if (gt) { if (c.gsk !== side) { c.gsk = side; c.gs.innerHTML = '<g transform="scale(2.2)">' + fbShirt(side ? '#2563EB' : '#DC2626').replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g>'; } sa(c.goal, 'opacity', '1'); sa(c.goal, 'transform', tr(180, FB_CY, 1 + Math.sin(t * 8) * .06)); }
      else sa(c.goal, 'opacity', '0');
    }
  });

  /* ===================================================== Bullseye Live ========================================================= */
  var BE_X = 236, BE_Y = 116, BE_R = 92, BE_COL = ['#FACC15', '#EF4444', '#3B82F6', '#1F2937', '#F8FAFC'], BE_T1 = 1.6, BE_T2 = 2.7;
  function beMini(n) { var s = '<svg viewBox="-12 -12 24 24" aria-hidden="true">'; for (var k = 4; k >= 0; k--) s += '<circle r="' + (2.2 * (k + 1)) + '" fill="' + BE_COL[k] + '" opacity="' + (n == null || n === k ? 1 : .28) + '" stroke="#0F172A" stroke-width=".4"/>'; return s + '</svg>'; }
  function beHit(res) { var n = +res.n, rf = (n + .1 + .8 * (+res.r || 50) / 100) / 5 * BE_R, a = (+res.a || 0) * Math.PI / 180; return [BE_X + Math.cos(a) * rf, BE_Y + Math.sin(a) * rf]; }
  live('bullseye', {
    SHOW: 5.2, lab: 'be', bev: 'act', endEv: 'coin', odds0: { '0': 13.42, '1': 7.23, '2': 4.7, '3': 3.76, '4': 2.68 },
    beat: function (e) { return (e >= BE_T1) + (e >= BE_T2); },
    rules: rules(150, {
      en: ['The archer shoots one arrow at the target. Bet on the ring it will hit: Gold (centre, 7 % chance, ×13.42), Red (13 %, ×7.23), Blue (20 %, ×4.70), Black (25 %, ×3.76) or White (outer ring, 35 %, ×2.68).', 'The arrow flies and sticks in the target: the colour of the ring it hits decides.'],
      fr: ['L’archer tire une flèche sur la cible. Parie sur l’anneau touché : Or (centre, 7 % de chance, ×13,42), Rouge (13 %, ×7,23), Bleu (20 %, ×4,70), Noir (25 %, ×3,76) ou Blanc (anneau extérieur, 35 %, ×2,68).', 'La flèche part et se plante dans la cible : la couleur de l’anneau touché décide.'],
      es: ['El arquero dispara una flecha a la diana. Apuesta al anillo que alcanzará: Oro (centro, 7 % de probabilidad, ×13,42), Rojo (13 %, ×7,23), Azul (20 %, ×4,70), Negro (25 %, ×3,76) o Blanco (anillo exterior, 35 %, ×2,68).', 'La flecha vuela y se clava en la diana: decide el color del anillo alcanzado.'],
      pt: ['O arqueiro atira uma flecha no alvo. Aposte no anel que ela acertará: Ouro (centro, 7 % de chance, ×13,42), Vermelho (13 %, ×7,23), Azul (20 %, ×4,70), Preto (25 %, ×3,76) ou Branco (anel externo, 35 %, ×2,68).', 'A flecha voa e crava no alvo: a cor do anel atingido decide.'],
      ar: ['يطلق الرامي سهمًا واحدًا على الهدف. راهن على الحلقة التي سيصيبها: الذهبية (المركز، فرصة 7 %، ×13.42)، الحمراء (13 %، ×7.23)، الزرقاء (20 %، ×4.70)، السوداء (25 %، ×3.76) أو البيضاء (الحلقة الخارجية، 35 %، ×2.68).', 'ينطلق السهم وينغرس في الهدف: لون الحلقة المصابة يحسم النتيجة.'],
      tr: ['Okçu hedefe bir ok atar. Okun saplanacağı halkaya oyna: Altın (merkez, %7 şans, ×13,42), Kırmızı (%13, ×7,23), Mavi (%20, ×4,70), Siyah (%25, ×3,76) veya Beyaz (dış halka, %35, ×2,68).', 'Ok uçar ve hedefe saplanır: isabet ettiği halkanın rengi belirler.'],
      vi: ['Cung thủ bắn một mũi tên vào bia. Cược vòng mà tên trúng: Vàng (tâm, 7 %, ×13,42), Đỏ (13 %, ×7,23), Xanh (20 %, ×4,70), Đen (25 %, ×3,76) hoặc Trắng (vòng ngoài, 35 %, ×2,68).', 'Mũi tên bay và cắm vào bia: màu của vòng trúng quyết định.'],
      id: ['Pemanah menembakkan satu anak panah ke sasaran. Pasang cincin yang akan kena: Emas (tengah, peluang 7 %, ×13,42), Merah (13 %, ×7,23), Biru (20 %, ×4,70), Hitam (25 %, ×3,76) atau Putih (cincin luar, 35 %, ×2,68).', 'Panah melesat dan menancap di sasaran: warna cincin yang kena menentukan.'],
      ru: ['Лучник стреляет одной стрелой в мишень. Ставьте на кольцо, в которое она попадёт: Золото (центр, шанс 7 %, ×13,42), Красное (13 %, ×7,23), Синее (20 %, ×4,70), Чёрное (25 %, ×3,76) или Белое (внешнее кольцо, 35 %, ×2,68).', 'Стрела летит и вонзается в мишень: решает цвет кольца.'],
      de: ['Der Bogenschütze schießt einen Pfeil auf die Scheibe. Setze auf den Ring, den er trifft: Gold (Mitte, 7 % Chance, ×13,42), Rot (13 %, ×7,23), Blau (20 %, ×4,70), Schwarz (25 %, ×3,76) oder Weiß (äußerer Ring, 35 %, ×2,68).', 'Der Pfeil fliegt und bleibt in der Scheibe stecken: die Farbe des getroffenen Rings entscheidet.'],
      hi: ['तीरंदाज़ निशाने पर एक तीर चलाता है। उस घेरे पर दांव लगाएं जिसमें तीर लगेगा: सुनहरा (केंद्र, 7 % मौका, ×13.42), लाल (13 %, ×7.23), नीला (20 %, ×4.70), काला (25 %, ×3.76) या सफ़ेद (बाहरी घेरा, 35 %, ×2.68)।', 'तीर उड़कर निशाने में धँसता है: जिस घेरे का रंग, वही फ़ैसला।'],
      zh: ['弓箭手向靶子射出一箭。押箭会射中的环：金（靶心，7 % 概率，×13.42）、红（13 %，×7.23）、蓝（20 %，×4.70）、黑（25 %，×3.76）或白（外环，35 %，×2.68）。', '箭飞出并插在靶上：以射中的环的颜色定输赢。']
    }),
    scene: function (uid) {
      var rings = ''; for (var k = 4; k >= 0; k--) rings += '<circle class="be-r" data-r="' + k + '" r="' + (BE_R * (k + 1) / 5) + '" fill="' + BE_COL[k] + '" stroke="' + (k === 3 ? '#94A3B8' : '#0F172A') + '" stroke-opacity=".5" stroke-width="1"/>';
      return '<defs><linearGradient id="beSky' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0C4A6E"/><stop offset=".7" stop-color="#155E75"/><stop offset="1" stop-color="#14532D"/></linearGradient>' + lgd('beW' + uid, '#A16207', '#713F12', 1) + '</defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="url(#beSky' + uid + ')"/><path d="M-300 196H660V530H-300Z" fill="#166534"/><path d="M' + (BE_X - 40) + ' 196L' + (BE_X - 18) + ' 130M' + (BE_X + 40) + ' 196L' + (BE_X + 18) + ' 130" stroke="url(#beW' + uid + ')" stroke-width="7" stroke-linecap="round"/>' +
        '<g class="be-tg" transform="translate(' + BE_X + ' ' + BE_Y + ')"><circle r="' + (BE_R + 5) + '" fill="#78350F"/>' + rings + '<path d="M-' + BE_R + ' 0H' + BE_R + 'M0-' + BE_R + 'V' + BE_R + '" stroke="#0F172A" stroke-opacity=".2"/></g>' +
        '<g class="be-arch" transform="translate(42 150)"><circle cy="-46" r="8" fill="#FDE68A"/><path d="M0-38V-6M0-6L-8 22M0-6L8 22" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round"/><path class="be-arm" d="M0-30L22-30" stroke="#F8FAFC" stroke-width="3.4" stroke-linecap="round"/>' +
          '<path d="M24-62Q46-30 24 2" stroke="#B45309" stroke-width="3.4" fill="none" stroke-linecap="round"/><path class="be-str" d="M24-62L24 2" stroke="#E2E8F0" stroke-width="1"/></g>' +
        '<g class="be-ar"><path d="M-30 0H4" stroke="#F8FAFC" stroke-width="2.2"/><path d="M4-4L12 0L4 4Z" fill="#CBD5E1"/><path d="M-30 0L-38-5M-30 0L-38 5M-26 0L-34-5M-26 0L-34 5" stroke="#EF4444" stroke-width="1.8"/></g>' +
        '<g transform="translate(128 26)"><text class="be-wl" text-anchor="middle" y="0">≋</text><path class="be-wa" d="M-12 8H12M6 3L12 8L6 13" stroke="#E0F2FE" stroke-width="2" fill="none" stroke-linecap="round"/></g>' +
        '<text class="be-cd" x="64" y="40" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) { return [0, 1, 2, 3, 4].map(function (k) { return '<button type="button" data-s="' + k + '">' + beMini(k) + '<b class="fit" data-o="' + k + '">' + oddTxt(o[String(k)]) + '</b></button>'; }).join(''); },
    hist: function (n) { return '<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="10" fill="' + BE_COL[n] + '" stroke="#0F172A" stroke-opacity=".5"/></svg>'; },
    wins: function (res) { return [String(res.n)]; },
    init: function (c) { c.ar = c.q('.be-ar'); c.str = c.q('.be-str'); c.arm = c.q('.be-arm'); c.tg = c.q('.be-tg'); c.rings = [].slice.call(c.box.querySelectorAll('.be-r')); c.cd = c.q('.be-cd'); c.wa = c.q('.be-wa'); },
    frame: function (c, R, t, e, res) {
      var draw = res ? seg(e, .2, BE_T1) : (R && e < 0 ? .15 + .1 * Math.sin(t * 2) : 0), pull = draw * 16;
      sa(c.str, 'd', 'M24-62L' + (24 - pull).toFixed(1) + ' -30L24 2'); sa(c.arm, 'd', 'M0-30L' + (22 - pull).toFixed(1) + ' -30');
      var sx = 66 - pull, sy = 120, ax, ay, ang = 0, op = 1;
      if (res && e >= BE_T1) {
        var hp = beHit(res), f = seg(e, BE_T1, BE_T2); ax = lerp(sx, hp[0] - 10, f); ay = lerp(sy, hp[1], f) - Math.sin(f * Math.PI) * 26; ang = f < 1 ? -Math.cos(f * Math.PI) * 14 : 0;
        if (f >= 1) { ax = hp[0] - 10; ay = hp[1]; }
      } else { ax = sx + 10; ay = sy; op = R ? 1 : 0; }
      sa(c.ar, 'opacity', String(op)); sa(c.ar, 'transform', tr(ax, ay, 1, ang));
      var hit = res && e >= BE_T2 ? +res.n : -1, sh = res && e >= BE_T2 && e < BE_T2 + .5 ? Math.sin((e - BE_T2) * 50) * 2 * (1 - (e - BE_T2) / .5) : 0;
      sa(c.tg, 'transform', 'translate(' + (BE_X + sh).toFixed(1) + ' ' + BE_Y + ')');
      var win = res && e >= BE_T2 + .5 ? +res.n : -1;
      c.rings.forEach(function (r) { var k = +r.getAttribute('data-r'); cls(r, 'be-r' + (win >= 0 ? (k === win ? ' win' : ' dim') : '')); });
      sa(c.wa, 'transform', 'translate(' + (Math.sin(t * 2.3) * 3).toFixed(1) + ' 0)');
      var on = !!R && !res && e < 0; txt(c.cd, on ? mmss(R.close - t) : ''); cls(c.cd, 'be-cd' + (on && R.close - t <= 10 ? ' warn' : ''));
      void hit;
    }
  });

  /* ====================================================== Lucky Ladder ========================================================= */
  var LA_X = [120, 240], LA_Y0 = 46, LA_Y1 = 186, LA_T0 = 2, LA_T1 = 10;
  function laRungs(i, r) { var y = []; for (var k = 0; k < r; k++) y.push(LA_Y0 + (k + 1) * (LA_Y1 - LA_Y0) / (r + 1) + (hr(i, 70 + k) - .5) * 14); return y; }
  function laPath(s, ys) { // points of the ball path: down a post, across each rung, down again
    var P = [[LA_X[s], LA_Y0 - 14]], side = s;
    ys.forEach(function (y) { P.push([LA_X[side], y]); side = 1 - side; P.push([LA_X[side], y]); });
    P.push([LA_X[side], LA_Y1 + 14]); return P;
  }
  function laAt(P, f) {
    var L = 0, d = [], k; for (k = 1; k < P.length; k++) { var dd = Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]); d.push(dd); L += dd; }
    var want = f * L; for (k = 1; k < P.length; k++) { if (want <= d[k - 1]) { var q = d[k - 1] ? want / d[k - 1] : 0; return [lerp(P[k - 1][0], P[k][0], q), lerp(P[k - 1][1], P[k][1], q), k]; } want -= d[k - 1]; }
    var Z = P[P.length - 1]; return [Z[0], Z[1], P.length];
  }
  function laIcon(top, rungs, bot) { // mini ladder: start dot (top), rungs, end dot (bottom)
    var s = '<svg viewBox="0 0 30 26" aria-hidden="true"><path d="M8 3V23M22 3V23" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/>';
    for (var k = 0; k < rungs; k++) { var y = 3 + (k + 1) * 20 / (rungs + 1); s += '<path d="M8 ' + y.toFixed(1) + 'H22" stroke="#FDE68A" stroke-width="1.8"/>'; }
    if (top >= 0) s += '<circle cx="' + (top ? 22 : 8) + '" cy="3.5" r="3.4" fill="#22D3EE"/>';
    if (bot >= 0) s += '<circle cx="' + (bot ? 22 : 8) + '" cy="22.5" r="3.4" fill="#F472B6"/>';
    if (top < 0 && bot < 0) s += '<text x="15" y="17" text-anchor="middle" class="la-it">' + rungs + '</text>';
    return s + '</svg>';
  }
  function laDecode(n) { var s = n >> 1, r = n % 2 ? 4 : 3; return { s: s, r: r, e: r === 3 ? 1 - s : s }; }
  live('ladder', {
    SHOW: 12, lab: 'la', bev: 'tick', endEv: 'coin', odds0: { sl: 1.88, sr: 1.88, r3: 1.88, r4: 1.88, el: 1.88, er: 1.88, c0: 3.76, c1: 3.76, c2: 3.76, c3: 3.76 },
    beat: function (e, res, R) { if (e < LA_T0) return e >= 1.2 ? 0 : -1; var d = laDecode(+res.n); return laAt(laPath(d.s, laRungs(R.i, d.r)), seg(e, LA_T0, LA_T1))[2]; },
    rules: rules(155, {
      en: ['A ball starts at the top of the ladder, on the left or on the right; the ladder has 3 or 4 rungs and the ball crosses at every rung. Bet on the start side, on 3 or 4 rungs, or on the arrival side (×1.88 each), or on start + rungs together (×3.76).', 'The curtain lifts, the rungs appear and the ball goes down: with 3 rungs it arrives on the other side, with 4 rungs on the same side.'],
      fr: ['Une bille part du haut de l’échelle, à gauche ou à droite ; l’échelle a 3 ou 4 barreaux et la bille traverse à chaque barreau. Parie sur le côté de départ, sur 3 ou 4 barreaux, ou sur le côté d’arrivée (×1,88 chacun), ou sur départ + barreaux ensemble (×3,76).', 'Le rideau se lève, les barreaux apparaissent et la bille descend : avec 3 barreaux elle arrive de l’autre côté, avec 4 du même côté.'],
      es: ['Una bola sale de lo alto de la escalera, por la izquierda o la derecha; la escalera tiene 3 o 4 peldaños y la bola cruza en cada uno. Apuesta al lado de salida, a 3 o 4 peldaños, o al lado de llegada (×1,88 cada uno), o a salida + peldaños juntos (×3,76).', 'Se levanta la cortina, aparecen los peldaños y la bola baja: con 3 peldaños llega al otro lado, con 4 al mismo lado.'],
      pt: ['Uma bola parte do alto da escada, à esquerda ou à direita; a escada tem 3 ou 4 degraus e a bola atravessa em cada degrau. Aposte no lado de partida, em 3 ou 4 degraus, ou no lado de chegada (×1,88 cada), ou em partida + degraus juntos (×3,76).', 'A cortina sobe, os degraus aparecem e a bola desce: com 3 degraus chega do outro lado, com 4 do mesmo lado.'],
      ar: ['تنطلق كرة من أعلى السلّم، من اليسار أو اليمين؛ للسلّم 3 أو 4 درجات وتعبر الكرة عند كل درجة. راهن على جهة الانطلاق، أو على 3 أو 4 درجات، أو على جهة الوصول (×1.88 لكل منها)، أو على الانطلاق + الدرجات معًا (×3.76).', 'يرتفع الستار وتظهر الدرجات وتنزل الكرة: مع 3 درجات تصل إلى الجهة الأخرى، ومع 4 إلى الجهة نفسها.'],
      tr: ['Top merdivenin tepesinden solda ya da sağda başlar; merdivende 3 veya 4 basamak vardır ve top her basamakta karşıya geçer. Başlangıç tarafına, 3 ya da 4 basamağa veya varış tarafına (her biri ×1,88) ya da başlangıç + basamak ikilisine (×3,76) oyna.', 'Perde kalkar, basamaklar görünür ve top iner: 3 basamakta öbür tarafa, 4 basamakta aynı tarafa varır.'],
      vi: ['Một viên bi xuất phát ở đỉnh thang, bên trái hoặc bên phải; thang có 3 hoặc 4 bậc và bi băng qua ở mỗi bậc. Cược bên xuất phát, 3 hay 4 bậc, hoặc bên về đích (mỗi cửa ×1,88), hoặc xuất phát + số bậc cùng lúc (×3,76).', 'Rèm kéo lên, các bậc hiện ra và bi đi xuống: 3 bậc thì về phía bên kia, 4 bậc thì về cùng phía.'],
      id: ['Sebuah bola mulai dari puncak tangga, di kiri atau kanan; tangga punya 3 atau 4 anak tangga dan bola menyeberang di setiap anak tangga. Pasang sisi awal, 3 atau 4 anak tangga, atau sisi akhir (masing-masing ×1,88), atau awal + jumlah anak tangga sekaligus (×3,76).', 'Tirai terangkat, anak tangga muncul dan bola turun: dengan 3 anak tangga ia tiba di sisi lain, dengan 4 di sisi yang sama.'],
      ru: ['Шарик стартует сверху лесенки, слева или справа; у лесенки 3 или 4 перекладины, и на каждой шарик переходит на другую сторону. Ставьте на сторону старта, на 3 или 4 перекладины или на сторону финиша (по ×1,88) либо на старт + перекладины вместе (×3,76).', 'Шторка поднимается, появляются перекладины, шарик спускается: при 3 перекладинах он финиширует на другой стороне, при 4 — на той же.'],
      de: ['Eine Kugel startet oben an der Leiter, links oder rechts; die Leiter hat 3 oder 4 Sprossen und an jeder Sprosse wechselt die Kugel die Seite. Setze auf die Startseite, auf 3 oder 4 Sprossen oder auf die Zielseite (je ×1,88) oder auf Start + Sprossen zusammen (×3,76).', 'Der Vorhang hebt sich, die Sprossen erscheinen und die Kugel läuft hinunter: bei 3 Sprossen kommt sie auf der anderen Seite an, bei 4 auf derselben.'],
      hi: ['एक गेंद सीढ़ी के ऊपर से बाएँ या दाएँ शुरू होती है; सीढ़ी में 3 या 4 डंडे होते हैं और हर डंडे पर गेंद दूसरी तरफ़ जाती है। शुरुआती तरफ़, 3 या 4 डंडे, या पहुँचने की तरफ़ (हर एक ×1.88), या शुरुआत + डंडे साथ में (×3.76) पर दांव लगाएं।', 'पर्दा उठता है, डंडे दिखते हैं और गेंद नीचे आती है: 3 डंडों पर दूसरी तरफ़, 4 पर उसी तरफ़ पहुँचती है।'],
      zh: ['小球从梯子顶端的左边或右边出发；梯子有 3 或 4 根横档，每遇横档小球就换到另一边。押出发边、3 或 4 根横档、或到达边（各 ×1.88），或押出发 + 横档组合（×3.76）。', '帘子升起，横档显现，小球向下走：3 根横档到达另一边，4 根则回到同一边。']
    }),
    scene: function (uid) {
      var rungs = ''; for (var k = 0; k < 4; k++) rungs += '<path class="la-rg" d="M' + LA_X[0] + ' 0H' + LA_X[1] + '"/>';
      return '<defs>' + rgd('laB' + uid, '#FFFFFF', '#FDE68A', '#D97706') + lgd('laC' + uid, '#7C3AED', '#4C1D95', 1) + '</defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#100726"/><rect x="40" y="16" width="280" height="200" rx="18" fill="#1B0E3A" stroke="#A78BFA" stroke-opacity=".4"/>' +
        '<path d="M' + LA_X[0] + ' ' + LA_Y0 + 'V' + LA_Y1 + 'M' + LA_X[1] + ' ' + LA_Y0 + 'V' + LA_Y1 + '" stroke="#E2E8F0" stroke-width="6" stroke-linecap="round"/>' + rungs +
        '<g class="la-st"><circle cx="' + LA_X[0] + '" cy="' + (LA_Y0 - 16) + '" r="11"/><circle cx="' + LA_X[1] + '" cy="' + (LA_Y0 - 16) + '" r="11"/></g>' +
        '<g class="la-en"><circle cx="' + LA_X[0] + '" cy="' + (LA_Y1 + 16) + '" r="11"/><circle cx="' + LA_X[1] + '" cy="' + (LA_Y1 + 16) + '" r="11"/></g>' +
        '<g class="la-cur"><rect x="' + (LA_X[0] - 22) + '" y="' + (LA_Y0 - 2) + '" width="' + (LA_X[1] - LA_X[0] + 44) + '" height="' + (LA_Y1 - LA_Y0 + 4) + '" rx="10" fill="url(#laC' + uid + ')" stroke="#C4B5FD" stroke-opacity=".6"/>' +
          '<path d="M' + (LA_X[0] - 6) + ' ' + LA_Y0 + 'V' + LA_Y1 + 'M' + (LA_X[0] + 34) + ' ' + LA_Y0 + 'V' + LA_Y1 + 'M' + (LA_X[0] + 74) + ' ' + LA_Y0 + 'V' + LA_Y1 + 'M' + (LA_X[0] + 114) + ' ' + LA_Y0 + 'V' + LA_Y1 + '" stroke="#fff" stroke-opacity=".08" stroke-width="10"/>' +
          '<text class="la-q" x="180" y="' + ((LA_Y0 + LA_Y1) / 2 + 10) + '" text-anchor="middle">?</text></g>' +
        '<g class="la-ball" opacity="0"><circle r="8" fill="url(#laB' + uid + ')"/><circle cx="-2.4" cy="-2.6" r="2.2" fill="#fff" opacity=".8"/></g>' +
        '<text class="la-n" x="300" y="122" text-anchor="middle"></text><text class="la-cd" x="180" y="226" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) {
      var b = function (s, ic) { return '<button type="button" data-s="' + s + '">' + ic + '<b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; };
      return '<div class="la-r1">' + b('sl', laIcon(0, 0, -1)) + b('sr', laIcon(1, 0, -1)) + b('r3', laIcon(-1, 3, -1)) + b('r4', laIcon(-1, 4, -1)) + b('el', laIcon(-1, 0, 0)) + b('er', laIcon(-1, 0, 1)) + '</div>' +
        '<div class="la-r2">' + b('c0', laIcon(0, 3, -1)) + b('c1', laIcon(0, 4, -1)) + b('c2', laIcon(1, 3, -1)) + b('c3', laIcon(1, 4, -1)) + '</div>';
    },
    hist: function (n) { var d = laDecode(n); return laIcon(d.s, d.r, d.e); },
    wins: function (res) { var n = +res.n, d = laDecode(n); return [d.s ? 'sr' : 'sl', 'r' + d.r, d.e ? 'er' : 'el', 'c' + n]; },
    init: function (c) { c.rg = [].slice.call(c.box.querySelectorAll('.la-rg')); c.cur = c.q('.la-cur'); c.ball = c.q('.la-ball'); c.st = [].slice.call(c.box.querySelectorAll('.la-st circle')); c.en = [].slice.call(c.box.querySelectorAll('.la-en circle')); c.nn = c.q('.la-n'); c.cd = c.q('.la-cd'); c.qm = c.q('.la-q'); },
    frame: function (c, R, t, e, res) {
      var k;
      if (!res) {
        for (k = 0; k < 4; k++) sa(c.rg[k], 'opacity', '0');
        sa(c.cur, 'transform', ''); sa(c.cur, 'opacity', '1'); sa(c.ball, 'opacity', '0'); txt(c.nn, '');
        c.st.forEach(function (x) { cls(x, ''); }); c.en.forEach(function (x) { cls(x, ''); });
        var on = !!R && e < 0; txt(c.cd, on ? mmss(R.close - t) : ''); cls(c.cd, 'la-cd' + (on && R.close - t <= 10 ? ' warn' : ''));
        sa(c.qm, 'transform', 'translate(0 ' + (Math.sin(t * 2) * 3).toFixed(1) + ')');
        return;
      }
      txt(c.cd, '');
      var d = laDecode(+res.n), ys = laRungs(R.i, d.r);
      for (k = 0; k < 4; k++) { if (k < d.r) { sa(c.rg[k], 'opacity', '1'); sa(c.rg[k], 'transform', 'translate(0 ' + ys[k].toFixed(1) + ')'); } else sa(c.rg[k], 'opacity', '0'); }
      var up = eio(seg(e, .2, 1.4)); sa(c.cur, 'transform', 'translate(0 ' + (-up * 200).toFixed(1) + ')'); sa(c.cur, 'opacity', (1 - up).toFixed(2));
      c.st.forEach(function (x, j) { cls(x, e >= 1.4 && j === d.s ? 'on' : ''); });
      var p = laAt(laPath(d.s, ys), seg(e, LA_T0, LA_T1)); sa(c.ball, 'opacity', e >= 1.4 ? '1' : '0'); sa(c.ball, 'transform', tr(p[0], p[1]));
      c.en.forEach(function (x, j) { cls(x, e >= LA_T1 + .2 && j === d.e ? 'on' : ''); });
      txt(c.nn, e >= 1.4 ? String(d.r) : '');
    }
  });

  /* ======================================================== Moon Shot ========================================================== */
  var MS_K = 8; // the multiplier ×10 every 8 s
  function msT(x) { return MS_K * Math.log(Math.max(1, x)) / Math.LN10; }
  function msGy(x) { return 204 - Math.min(3, Math.log(Math.max(1, x)) / Math.LN10) / 3 * 176; }
  function msBand(x) { return x < 1.5 ? 'a' : x < 3 ? 'b' : x < 10 ? 'c' : 'd'; }
  live('moonshot', {
    show: function (res) { return msT(+res.n / 100) + 2.6; }, lab: 'ms', bev: 'tick', endEv: 'whoosh', odds0: { a: 2.82, b: 2.82, c: 4.02, d: 9.4, u2: 1.88, o2: 1.88 },
    amb: function (e, res, SH) { return cl01(.35 + .65 * e / Math.max(1, SH - 2.6)); },
    beat: function (e, res) { var x = Math.pow(10, Math.min(e, msT(+res.n / 100)) / MS_K), n = 0; [1.5, 2, 3, 10, 100].forEach(function (b) { if (x >= b) n++; }); return n + (e >= msT(+res.n / 100) ? 10 : 0); },
    rules: rules(165, {
      en: ['The rocket takes off and its multiplier climbs (×1.00, ×2.00, ×10.00…) until it explodes. Bet on the range where it explodes: below ×1.5 (×2.82), ×1.5 to ×3 (×2.82), ×3 to ×10 (×4.02) or ×10 and more (×9.40), or simply below ×2 / ×2 and more (×1.88).', 'The explosion point is drawn by the server: the chance of reaching ×X is 1 in X (×2: 1 in 2, ×10: 1 in 10). The multiplier where the rocket explodes decides.'],
      fr: ['La fusée décolle et son multiplicateur grimpe (×1,00, ×2,00, ×10,00…) jusqu’à l’explosion. Parie sur la tranche où elle explose : sous ×1,5 (×2,82), de ×1,5 à ×3 (×2,82), de ×3 à ×10 (×4,02) ou ×10 et plus (×9,40), ou simplement sous ×2 / ×2 et plus (×1,88).', 'Le point d’explosion est tiré par le serveur : la chance d’atteindre ×X est de 1 sur X (×2 : 1 sur 2, ×10 : 1 sur 10). Le multiplicateur où la fusée explose décide.'],
      es: ['El cohete despega y su multiplicador sube (×1,00, ×2,00, ×10,00…) hasta que explota. Apuesta al tramo donde explotará: menos de ×1,5 (×2,82), de ×1,5 a ×3 (×2,82), de ×3 a ×10 (×4,02) o ×10 y más (×9,40), o simplemente menos de ×2 / ×2 y más (×1,88).', 'El punto de explosión lo sortea el servidor: la probabilidad de llegar a ×X es 1 entre X (×2: 1 de 2, ×10: 1 de 10). Decide el multiplicador donde explota el cohete.'],
      pt: ['O foguete decola e o multiplicador sobe (×1,00, ×2,00, ×10,00…) até explodir. Aposte na faixa em que ele explode: abaixo de ×1,5 (×2,82), de ×1,5 a ×3 (×2,82), de ×3 a ×10 (×4,02) ou ×10 ou mais (×9,40), ou simplesmente abaixo de ×2 / ×2 ou mais (×1,88).', 'O ponto de explosão é sorteado pelo servidor: a chance de chegar a ×X é de 1 em X (×2: 1 em 2, ×10: 1 em 10). Decide o multiplicador em que o foguete explode.'],
      ar: ['ينطلق الصاروخ ويرتفع مُضاعِفه (×1.00، ×2.00، ×10.00…) حتى ينفجر. راهن على النطاق الذي سينفجر فيه: أقل من ×1.5 (×2.82)، من ×1.5 إلى ×3 (×2.82)، من ×3 إلى ×10 (×4.02) أو ×10 فأكثر (×9.40)، أو ببساطة أقل من ×2 / ×2 فأكثر (×1.88).', 'يسحب الخادم نقطة الانفجار: فرصة بلوغ ×X هي 1 من X (×2: 1 من 2، ×10: 1 من 10). المضاعِف الذي ينفجر عنده الصاروخ يحسم النتيجة.'],
      tr: ['Roket kalkar ve çarpanı patlayana kadar yükselir (×1,00, ×2,00, ×10,00…). Patlayacağı aralığa oyna: ×1,5 altı (×2,82), ×1,5–×3 (×2,82), ×3–×10 (×4,02) ya da ×10 ve üstü (×9,40), veya kısaca ×2 altı / ×2 ve üstü (×1,88).', 'Patlama noktasını sunucu çeker: ×X’e ulaşma şansı X’te 1’dir (×2: 2’de 1, ×10: 10’da 1). Roketin patladığı çarpan sonucu belirler.'],
      vi: ['Tên lửa cất cánh và hệ số tăng dần (×1,00, ×2,00, ×10,00…) cho đến khi nổ. Cược khoảng nổ: dưới ×1,5 (×2,82), từ ×1,5 đến ×3 (×2,82), từ ×3 đến ×10 (×4,02) hoặc từ ×10 trở lên (×9,40), hoặc đơn giản dưới ×2 / từ ×2 trở lên (×1,88).', 'Điểm nổ do máy chủ quay: xác suất đạt ×X là 1 phần X (×2: 1 phần 2, ×10: 1 phần 10). Hệ số lúc tên lửa nổ quyết định.'],
      id: ['Roket meluncur dan pengalinya naik (×1,00, ×2,00, ×10,00…) sampai meledak. Pasang rentang tempat ia meledak: di bawah ×1,5 (×2,82), ×1,5 sampai ×3 (×2,82), ×3 sampai ×10 (×4,02) atau ×10 ke atas (×9,40), atau cukup di bawah ×2 / ×2 ke atas (×1,88).', 'Titik ledakan diundi server: peluang mencapai ×X adalah 1 banding X (×2: 1 banding 2, ×10: 1 banding 10). Pengali saat roket meledak menentukan.'],
      ru: ['Ракета взлетает, её множитель растёт (×1,00, ×2,00, ×10,00…), пока она не взорвётся. Ставьте на диапазон взрыва: ниже ×1,5 (×2,82), от ×1,5 до ×3 (×2,82), от ×3 до ×10 (×4,02) или ×10 и выше (×9,40), либо просто ниже ×2 / ×2 и выше (×1,88).', 'Точку взрыва разыгрывает сервер: шанс дойти до ×X — 1 из X (×2: 1 из 2, ×10: 1 из 10). Решает множитель, на котором ракета взорвётся.'],
      de: ['Die Rakete hebt ab und ihr Multiplikator steigt (×1,00, ×2,00, ×10,00…), bis sie explodiert. Setze auf den Bereich der Explosion: unter ×1,5 (×2,82), ×1,5 bis ×3 (×2,82), ×3 bis ×10 (×4,02) oder ×10 und mehr (×9,40), oder einfach unter ×2 / ×2 und mehr (×1,88).', 'Der Explosionspunkt wird vom Server gezogen: die Chance, ×X zu erreichen, ist 1 zu X (×2: 1 zu 2, ×10: 1 zu 10). Der Multiplikator bei der Explosion entscheidet.'],
      hi: ['रॉकेट उड़ता है और उसका गुणक बढ़ता है (×1.00, ×2.00, ×10.00…) जब तक वह फट न जाए। उस दायरे पर दांव लगाएं जहाँ वह फटेगा: ×1.5 से नीचे (×2.82), ×1.5 से ×3 (×2.82), ×3 से ×10 (×4.02) या ×10 और ऊपर (×9.40), या बस ×2 से नीचे / ×2 और ऊपर (×1.88)।', 'फटने का बिंदु सर्वर निकालता है: ×X तक पहुँचने का मौका X में 1 है (×2: 2 में 1, ×10: 10 में 1)। जिस गुणक पर रॉकेट फटे, वह फ़ैसला करता है।'],
      zh: ['火箭升空，倍数不断上升（×1.00、×2.00、×10.00…）直到爆炸。押爆炸所在区间：低于 ×1.5（×2.82）、×1.5 至 ×3（×2.82）、×3 至 ×10（×4.02）或 ×10 及以上（×9.40），或简单押低于 ×2 / ×2 及以上（×1.88）。', '爆炸点由服务器开出：到达 ×X 的概率为 X 分之 1（×2：2 分之 1，×10：10 分之 1）。以火箭爆炸时的倍数定输赢。']
    }),
    scene: function (uid) {
      var stars = ''; for (var k = 0; k < 46; k++) stars += '<circle cx="' + (hr(7, k) * 360).toFixed(0) + '" cy="' + (hr(9, k) * 460 - 230).toFixed(0) + '" r="' + (.4 + hr(11, k) * 1.1).toFixed(2) + '"/>';
      var ticks = [[1.5, '1.5'], [2, '2'], [3, '3'], [10, '10'], [100, '100']].map(function (q) { var y = msGy(q[0]); return '<path d="M28 ' + y.toFixed(1) + 'H46" stroke="#FDE68A" stroke-opacity=".7"/><text x="50" y="' + (y + 3.4).toFixed(1) + '" class="ms-tk">×' + q[1] + '</text>'; }).join('');
      return '<defs><linearGradient id="msSky' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020617"/><stop offset=".6" stop-color="#1E1B4B"/><stop offset="1" stop-color="#4C1D95"/></linearGradient>' +
        rgd('msM' + uid, '#FFFFFF', '#E2E8F0', '#94A3B8') + lgd('msR' + uid, '#F8FAFC', '#94A3B8') + rgd('msF' + uid, '#FFF7D6', '#FB923C', '#DC2626') + rgd('msX' + uid, '#FFFFFF', '#FDE68A', '#F97316') + '</defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="url(#msSky' + uid + ')"/><g class="ms-stars" fill="#fff" opacity=".8">' + stars + '</g>' +
        '<g class="ms-moon"><circle cx="300" cy="44" r="24" fill="url(#msM' + uid + ')"/><circle cx="292" cy="38" r="4" fill="#CBD5E1"/><circle cx="306" cy="52" r="3" fill="#CBD5E1"/></g>' +
        '<rect x="24" y="24" width="10" height="182" rx="5" fill="#fff" fill-opacity=".08"/><rect class="ms-lvl" x="24" y="24" width="10" height="182" rx="5" fill="#22C55E"/>' + ticks +
        '<g class="ms-gnd"><path d="M-300 214Q180 196 660 214V530H-300Z" fill="#312E81"/><rect x="186" y="198" width="44" height="8" rx="2" fill="#475569"/></g>' +
        '<g class="ms-rk"><g class="ms-fl"><path d="M-6 18Q0 44 6 18Z" fill="url(#msF' + uid + ')"/></g><path d="M0-26Q12-12 10 14H-10Q-12-12 0-26Z" fill="url(#msR' + uid + ')" stroke="#475569" stroke-width=".8"/>' +
          '<path d="M0-26Q6-19 8.5-12H-8.5Q-6-19 0-26Z" fill="#DC2626"/><circle cy="-3" r="4.6" fill="#38BDF8" stroke="#0C4A6E" stroke-width="1.4"/><path d="M-10 6L-17 18L-9 15ZM10 6L17 18L9 15Z" fill="#DC2626"/></g>' +
        '<g class="ms-boom" opacity="0"><circle r="30" fill="url(#msX' + uid + ')"/><path d="M0-44L8-14L38-24L16 0L40 22L10 14L0 44L-10 14L-40 22L-16 0L-38-24L-8-14Z" fill="#FDE68A" opacity=".8"/></g>' +
        '<text class="ms-x" x="226" y="122" text-anchor="middle">×1.00</text><text class="ms-cd" x="226" y="150" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) {
      var dc = K.dec(), f = function (v) { return String(v).replace('.', dc); };
      var b = function (s, lab) { return '<button type="button" data-s="' + s + '" class="ms-b ' + s + '"><span class="ms-l">' + lab + '</span><b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; };
      return '<div class="ms-r1">' + b('a', '&lt; ×' + f(1.5)) + b('b', '×' + f(1.5) + '–3') + b('c', '×3–10') + b('d', '≥ ×10') + '</div><div class="ms-r2">' + b('u2', '&lt; ×2') + b('o2', '≥ ×2') + '</div>';
    },
    hist: function (n) { var x = n / 100; return '<span class="ms-h ' + msBand(x) + '">' + fmtX(x).replace('.', K.dec()) + '</span>'; },
    wins: function (res) { var x = +res.n / 100; return [msBand(x), x < 2 ? 'u2' : 'o2']; },
    init: function (c) { c.rk = c.q('.ms-rk'); c.fl = c.q('.ms-fl'); c.boom = c.q('.ms-boom'); c.x = c.q('.ms-x'); c.cd = c.q('.ms-cd'); c.lvl = c.q('.ms-lvl'); c.stars = c.q('.ms-stars'); c.gnd = c.q('.ms-gnd'); c.moon = c.q('.ms-moon'); },
    frame: function (c, R, t, e, res) {
      var x = 1, boom = -1, ry = 178, wob = 0, cam = 0;
      if (res) {
        var X = +res.n / 100, tx = msT(X), te = Math.min(e, tx); x = Math.min(X, Math.pow(10, te / MS_K));
        var lg = Math.log(x) / Math.LN10; cam = lg * 70; ry = 178 - Math.min(110, lg * 90 + seg(e, 0, 1.2) * 14); wob = Math.sin(t * 13) * Math.min(3, lg * 2);
        if (e >= tx) boom = e - tx;
      } else { ry = 178 + Math.sin(t * 2) * .6; }
      sa(c.stars, 'transform', 'translate(0 ' + (cam % 230).toFixed(1) + ')'); sa(c.gnd, 'transform', 'translate(0 ' + Math.min(80, cam).toFixed(1) + ')');
      sa(c.moon, 'transform', 'translate(0 ' + Math.min(30, cam * .12).toFixed(1) + ')');
      sa(c.rk, 'opacity', boom >= 0 ? '0' : '1'); sa(c.rk, 'transform', tr(208 + wob, ry, 1.35, wob * .8));
      sa(c.fl, 'transform', 'scale(1 ' + (res && boom < 0 ? (1 + Math.sin(t * 30) * .25) : .25).toFixed(2) + ')');
      if (boom >= 0 && boom < 1.4) { var bk = eo(boom / .5); sa(c.boom, 'opacity', (1 - seg(boom, .6, 1.4)).toFixed(2)); sa(c.boom, 'transform', tr(208, ry, .3 + bk * 1.3, boom * 60)); } else sa(c.boom, 'opacity', '0');
      var gy = msGy(x); sa(c.lvl, 'y', gy.toFixed(1)); sa(c.lvl, 'height', (206 - gy).toFixed(1)); cls(c.lvl, 'ms-lvl ' + msBand(x));
      txt(c.x, '×' + fmtX(x).replace('.', c.dc)); cls(c.x, 'ms-x' + (boom >= 0 ? ' boom' : res ? ' fly' : ''));
      var on = !!R && !res && e < 0; txt(c.cd, on ? mmss(R.close - t) : ''); cls(c.cd, 'ms-cd' + (on && R.close - t <= 10 ? ' warn' : ''));
    }
  });
})(window.D6 = window.D6 || {});
