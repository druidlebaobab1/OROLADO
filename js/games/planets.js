/* v2811 — rounds of 160 s (2 min of bets, 30 s comet), status line « Bets open 1:54 », calm polling, plain LIVE badge.
   v2807 — Lucky Planets (NEW live game, owner request): a shared draw every 40 s for everyone, game-show style — 6 planets
   on an orbit, bets during the countdown, then a comet races around the orbit and stops on the drawn planet.
   Fixed chances, odds = 0.94 ÷ chance (6 % margin): Moon ×2.93 · Mars ×3.91 · Earth ×5.22 · Neptune ×7.23 · Saturn ×10.44 ·
   Sun ×23.50. Server: casino_lib.php casino_draw_* ('planets'), public state casino-tour.php?g=planets. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bo: 'Place your bets', lastc: 'Bets closing', bclosed: 'Bets closed', dp: 'Draw in progress', rs: 'Results', nx: 'Next round in', mc: 'Market closed', placed: 'Bet placed', bet: 'Place bet', pick: 'Select a planet first' },
    fr: { bo: 'Pariez maintenant', lastc: 'Clôture des paris', bclosed: 'Paris fermés', dp: 'Tirage en cours', rs: 'Résultats', nx: 'Prochain tour dans', mc: 'Marché fermé', placed: 'Pari enregistré', bet: 'Parier', pick: 'Choisissez d’abord une planète' },
    es: { bo: 'Apueste ahora', lastc: 'Cierre de apuestas', bclosed: 'Apuestas cerradas', dp: 'Sorteo en curso', rs: 'Resultados', nx: 'Próxima ronda en', mc: 'Mercado cerrado', placed: 'Apuesta registrada', bet: 'Apostar', pick: 'Elija primero un planeta' },
    pt: { bo: 'Aposte agora', lastc: 'Encerramento das apostas', bclosed: 'Apostas encerradas', dp: 'Sorteio em andamento', rs: 'Resultados', nx: 'Próxima rodada em', mc: 'Mercado fechado', placed: 'Aposta registrada', bet: 'Apostar', pick: 'Escolha primeiro um planeta' },
    ar: { bo: 'ضع رهانك الآن', lastc: 'الرهانات تُغلق قريبًا', bclosed: 'الرهانات مغلقة', dp: 'السحب جارٍ', rs: 'النتائج', nx: 'الجولة التالية خلال', mc: 'السوق مغلق', placed: 'تم تسجيل الرهان', bet: 'راهن', pick: 'اختر كوكبًا أولاً' },
    tr: { bo: 'Bahislerinizi yapın', lastc: 'Bahisler kapanıyor', bclosed: 'Bahisler kapandı', dp: 'Çekiliş sürüyor', rs: 'Sonuçlar', nx: 'Sonraki tur', mc: 'Piyasa kapalı', placed: 'Bahis alındı', bet: 'Bahis yap', pick: 'Önce bir gezegen seçin' },
    vi: { bo: 'Mời đặt cược', lastc: 'Sắp đóng cược', bclosed: 'Đã đóng cược', dp: 'Đang quay thưởng', rs: 'Kết quả', nx: 'Vòng tiếp theo sau', mc: 'Thị trường đóng cửa', placed: 'Đã đặt cược', bet: 'Đặt cược', pick: 'Hãy chọn một hành tinh trước' },
    id: { bo: 'Pasang taruhan Anda', lastc: 'Taruhan segera ditutup', bclosed: 'Taruhan ditutup', dp: 'Undian berlangsung', rs: 'Hasil', nx: 'Ronde berikutnya dalam', mc: 'Pasar tutup', placed: 'Taruhan tercatat', bet: 'Pasang', pick: 'Pilih planet dulu' },
    ru: { bo: 'Делайте ставки', lastc: 'Приём ставок завершается', bclosed: 'Ставки закрыты', dp: 'Идёт розыгрыш', rs: 'Результаты', nx: 'Следующий раунд через', mc: 'Рынок закрыт', placed: 'Ставка принята', bet: 'Поставить', pick: 'Сначала выберите планету' },
    de: { bo: 'Jetzt setzen', lastc: 'Einsätze schließen gleich', bclosed: 'Einsätze geschlossen', dp: 'Ziehung läuft', rs: 'Ergebnisse', nx: 'Nächste Runde in', mc: 'Markt geschlossen', placed: 'Einsatz platziert', bet: 'Setzen', pick: 'Wählen Sie zuerst einen Planeten' },
    hi: { bo: 'अभी दांव लगाएं', lastc: 'दांव बंद होने वाले हैं', bclosed: 'दांव बंद', dp: 'ड्रॉ जारी है', rs: 'नतीजे', nx: 'अगला राउंड', mc: 'बाज़ार बंद', placed: 'दांव दर्ज हुआ', bet: 'दांव लगाएं', pick: 'पहले एक ग्रह चुनें' },
    zh: { bo: '请下注', lastc: '即将停止下注', bclosed: '停止下注', dp: '开奖中', rs: '开奖结果', nx: '下一局', mc: '暂停交易', placed: '已下注', bet: '下注', pick: '请先选择一颗星球' }
  };
  var RULES = {
    en: '🔴 LIVE: one draw every 160 s, the same for everyone.\n1. Pick one of the 6 planets: each shows its payout (Moon ×2.93 … Sun ×23.50 — the rarer the planet, the bigger the payout).\n2. Set your stake and tap “Place bet” before “No more bets”. One bet per round.\n3. The comet flies around the orbit and stops on one planet: if it is yours, you win stake × its payout.',
    fr: '🔴 EN DIRECT : un tirage toutes les 160 s, le même pour tout le monde.\n1. Choisis une des 6 planètes : chacune affiche son gain (Lune ×2,93 … Soleil ×23,50 — plus la planète est rare, plus elle paie).\n2. Choisis ta mise et touche « Parier » avant « Rien ne va plus ». Un pari par tour.\n3. La comète fait le tour de l’orbite et s’arrête sur une planète : si c’est la tienne, tu gagnes mise × son gain.',
    es: '🔴 EN VIVO: un sorteo cada 160 s, el mismo para todos.\n1. Elige uno de los 6 planetas: cada uno muestra su pago (Luna ×2,93 … Sol ×23,50 — cuanto más raro, más paga).\n2. Elige tu apuesta y toca «Apostar» antes de «No va más». Una apuesta por ronda.\n3. El cometa recorre la órbita y se detiene en un planeta: si es el tuyo, ganas apuesta × su pago.',
    pt: '🔴 AO VIVO: um sorteio a cada 160 s, o mesmo para todos.\n1. Escolha um dos 6 planetas: cada um mostra seu pagamento (Lua ×2,93 … Sol ×23,50 — quanto mais raro, mais paga).\n2. Escolha o valor e toque em «Apostar» antes de «Apostas encerradas». Uma aposta por rodada.\n3. O cometa percorre a órbita e para num planeta: se for o seu, você ganha aposta × o pagamento.',
    ar: '🔴 مباشر: سحب كل 160 ثانية، نفسه للجميع.\n1. اختر أحد الكواكب الستة: يظهر على كل كوكب عائده (القمر ×2.93 … الشمس ×23.50 — كلما ندر الكوكب زاد عائده).\n2. اختر مبلغ الرهان والمس «راهن» قبل «لا مزيد من الرهانات». رهان واحد لكل جولة.\n3. يدور المذنب حول المدار ويتوقف على كوكب: إذا كان كوكبك تربح الرهان × عائده.',
    tr: '🔴 CANLI: her 160 sn’de bir çekiliş, herkes için aynı.\n1. 6 gezegenden birini seç: her biri ödemesini gösterir (Ay ×2,93 … Güneş ×23,50 — gezegen ne kadar nadirse o kadar çok öder).\n2. Tutarını seç ve “Bahisler kapandı” demeden “Bahis yap”a dokun. Her turda bir bahis.\n3. Kuyruklu yıldız yörüngeyi dolaşır ve bir gezegende durur: seninkiyse bahis × ödemesini kazanırsın.',
    vi: '🔴 TRỰC TIẾP: mỗi 160 giây một lần quay, giống nhau cho mọi người.\n1. Chọn một trong 6 hành tinh: mỗi hành tinh hiện tỷ lệ trả (Mặt Trăng ×2,93 … Mặt Trời ×23,50 — càng hiếm càng trả cao).\n2. Chọn mức cược và chạm «Đặt cược» trước khi «Hết giờ cược». Mỗi vòng một cược.\n3. Sao chổi bay quanh quỹ đạo và dừng ở một hành tinh: nếu là của bạn, bạn thắng cược × tỷ lệ trả.',
    id: '🔴 LANGSUNG: satu undian tiap 160 dtk, sama untuk semua.\n1. Pilih satu dari 6 planet: masing-masing menampilkan bayarannya (Bulan ×2,93 … Matahari ×23,50 — makin langka, makin besar bayarannya).\n2. Atur taruhan lalu sentuh «Pasang» sebelum «Taruhan ditutup». Satu taruhan per ronde.\n3. Komet mengitari orbit dan berhenti di satu planet: jika itu planetmu, kamu menang taruhan × bayarannya.',
    ru: '🔴 В ПРЯМОМ ЭФИРЕ: один розыгрыш каждые 160 с, общий для всех.\n1. Выберите одну из 6 планет: у каждой своя выплата (Луна ×2,93 … Солнце ×23,50 — чем реже планета, тем больше выплата).\n2. Выберите сумму и нажмите «Поставить» до «Ставки сделаны». Одна ставка за раунд.\n3. Комета облетает орбиту и останавливается на планете: если она ваша, вы выигрываете ставку × выплату.',
    de: '🔴 LIVE: alle 160 s eine Ziehung, für alle gleich.\n1. Wähle einen der 6 Planeten: jeder zeigt seine Auszahlung (Mond ×2,93 … Sonne ×23,50 — je seltener, desto höher).\n2. Wähle deinen Einsatz und tippe auf „Setzen“, bevor „Nichts geht mehr“ kommt. Ein Einsatz pro Runde.\n3. Der Komet fliegt um die Umlaufbahn und stoppt auf einem Planeten: Ist es deiner, gewinnst du Einsatz × Auszahlung.',
    hi: '🔴 लाइव: हर 160 सेकंड में एक ड्रॉ, सबके लिए एक जैसा।\n1. 6 ग्रहों में से एक चुनें: हर ग्रह पर उसका भुगतान लिखा है (चंद्रमा ×2.93 … सूर्य ×23.50 — ग्रह जितना दुर्लभ, भुगतान उतना बड़ा)।\n2. राशि चुनें और «दांव बंद» से पहले «दांव लगाएं» छुएं। हर राउंड में एक दांव।\n3. धूमकेतु कक्षा में घूमकर एक ग्रह पर रुकता है: वह आपका हो तो आप दांव × उसका भुगतान जीतते हैं।',
    zh: '🔴 直播：每 160 秒开奖一次，所有人同一结果。\n1. 从 6 颗星球中选一颗：每颗都标有赔率（月球 ×2.93 … 太阳 ×23.50 — 越稀有赔率越高）。\n2. 设定金额，在“停止下注”前点击“下注”。每局一注。\n3. 彗星绕轨道飞行并停在一颗星球上：如果是你选的，即赢 投注 × 赔率。'
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var ODDS = [2.93, 3.91, 5.22, 7.23, 10.44, 23.5]; // = server casino_planets_odds() (the server's value is shown when it arrives)
  var REVEAL = 30, N = 6; // v2811 : 30 s de comète (elle ralentit planète après planète)
  function mmss(v) { v = Math.max(0, Math.ceil(v)); return Math.floor(v / 60) + ':' + (v % 60 < 10 ? '0' : '') + (v % 60); }
  // v2811 : appels au serveur espacés (≈ 8 s) quand rien ne change, précis à la fermeture, au résultat et au nouveau tour
  function pollDelay(R, t, hasRes) {
    if (t < R.close) { var a = R.close - t; return a > 14 ? Math.min(8000, (a - 10) * 1000) : a > 1.3 ? Math.min(2500, (a - 1.1) * 1000) : Math.max(100, (a + 0.1) * 1000); }
    if (!hasRes) return 400;
    var b = R.end - t; return b > 14 ? Math.min(8000, (b - 10) * 1000) : b > 1.3 ? Math.min(2500, (b - 1.1) * 1000) : Math.max(150, (b + 0.25) * 1000);
  }
  var GID = 0;
  /* our own planet drawings (r = radius, centred on 0,0) */
  function planet(i, r, uid) {
    var id = 'pl' + uid + '_' + i, g = function (a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="78%"><stop offset="0" stop-color="' + a + '"/><stop offset=".6" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; };
    var hl = '<ellipse cx="' + (-r * .36) + '" cy="' + (-r * .42) + '" rx="' + (r * .3) + '" ry="' + (r * .18) + '" fill="#fff" opacity=".55" transform="rotate(-32 ' + (-r * .36) + ' ' + (-r * .42) + ')"/>';
    var c = '<circle r="' + r + '" fill="url(#' + id + ')"/>';
    if (i === 0) return '<defs>' + g('#F8FAFC', '#A8B0C2', '#4B5563') + '</defs>' + c + '<circle cx="' + (r * .3) + '" cy="' + (r * .1) + '" r="' + (r * .22) + '" fill="#6B7280" opacity=".55"/><circle cx="' + (-r * .25) + '" cy="' + (r * .42) + '" r="' + (r * .14) + '" fill="#6B7280" opacity=".5"/><circle cx="' + (r * .05) + '" cy="' + (-r * .45) + '" r="' + (r * .1) + '" fill="#6B7280" opacity=".45"/>' + hl;
    if (i === 1) return '<defs>' + g('#FECACA', '#EF4444', '#7F1D1D') + '</defs>' + c + '<path d="M' + (-r * .8) + ' ' + (r * .1) + 'Q0 ' + (-r * .15) + ' ' + (r * .85) + ' ' + (r * .2) + '" stroke="#991B1B" stroke-width="' + (r * .14) + '" fill="none" opacity=".5"/><circle cx="' + (r * .32) + '" cy="' + (r * .42) + '" r="' + (r * .13) + '" fill="#7F1D1D" opacity=".5"/>' + hl;
    if (i === 2) return '<defs>' + g('#BAE6FD', '#2563EB', '#1E3A8A') + '</defs>' + c + '<path d="M' + (-r * .55) + ' ' + (-r * .45) + 'q' + (r * .4) + ' ' + (-r * .15) + ' ' + (r * .55) + ' ' + (r * .2) + 'q' + (-r * .05) + ' ' + (r * .35) + ' ' + (-r * .4) + ' ' + (r * .45) + 'q' + (-r * .35) + ' ' + (-r * .2) + ' ' + (-r * .15) + ' ' + (-r * .65) + 'zM' + (r * .2) + ' ' + (r * .25) + 'q' + (r * .4) + ' ' + (-r * .1) + ' ' + (r * .5) + ' ' + (r * .25) + 'q' + (-r * .2) + ' ' + (r * .35) + ' ' + (-r * .5) + ' ' + (r * .2) + 'z" fill="#22C55E" opacity=".9"/>' + hl;
    if (i === 3) return '<defs>' + g('#C7D2FE', '#4F46E5', '#1E1B4B') + '</defs>' + c + '<path d="M' + (-r) + ' ' + (-r * .15) + 'H' + r + 'M' + (-r * .95) + ' ' + (r * .3) + 'H' + (r * .95) + '" stroke="#A5B4FC" stroke-width="' + (r * .1) + '" opacity=".45"/>' + hl;
    if (i === 4) return '<defs>' + g('#FEF3C7', '#F59E0B', '#78350F') + '</defs><ellipse rx="' + (r * 1.75) + '" ry="' + (r * .5) + '" fill="none" stroke="#FDE68A" stroke-opacity=".5" stroke-width="' + (r * .2) + '" transform="rotate(-16)"/>' + c +
      '<path d="M' + (-r * .97) + ' ' + (-r * .12) + 'H' + (r * .97) + '" stroke="#B45309" stroke-width="' + (r * .14) + '" opacity=".45"/>' + hl +
      '<path d="M' + (-r * 1.68) + ' ' + (r * .33) + 'A' + (r * 1.75) + ' ' + (r * .5) + ' -16 0 0 ' + (r * 1.68) + ' ' + (-r * .33) + '" fill="none" stroke="#FDE68A" stroke-width="' + (r * .2) + '" transform="rotate(0)" opacity=".95"/>';
    return '<defs><radialGradient id="' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFBEB"/><stop offset=".45" stop-color="#FDE047"/><stop offset=".8" stop-color="#F97316"/><stop offset="1" stop-color="#F97316" stop-opacity="0"/></radialGradient></defs>' +
      '<circle r="' + (r * 1.45) + '" fill="url(#' + id + ')" opacity=".55"/><circle r="' + r + '" fill="url(#' + id + ')"/>' +
      '<g stroke="#FDE047" stroke-width="' + (r * .12) + '" stroke-linecap="round" opacity=".8">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { var s = Math.sin(a * Math.PI / 180), co = Math.cos(a * Math.PI / 180); return '<path d="M' + (co * r * 1.2).toFixed(1) + ' ' + (s * r * 1.2).toFixed(1) + 'L' + (co * r * 1.5).toFixed(1) + ' ' + (s * r * 1.5).toFixed(1) + '"/>'; }).join('') + '</g>';
  }
  function mini(i) { var u = 'm' + (++GID); return '<svg viewBox="-24 -24 48 48" aria-hidden="true">' + planet(i, i === 4 ? 12 : 15, u) + '</svg>'; }
  var CX = 180, CY = 112, RX = 138, RY = 64, VH = 230; // l'orbite s'adapte à la forme de l'écran (layout)
  function ang(i) { return -90 + i * 60; }
  function pos(a) { var r = a * Math.PI / 180; return [CX + RX * Math.cos(r), CY + RY * Math.sin(r), 0.82 + 0.3 * (Math.sin(r) + 1) / 2]; }
  function norm(a) { a %= 360; return a < 0 ? a + 360 : a; }
  function eo(k) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 4); }

  K.register('planets', function (box) {
    var l = L(), uid = ++GID, dc = K.dec();
    var oddTxt = function (v) { return '×' + Number(v).toFixed(2).replace('.', dc); };
    box.classList.add('cg-game', 'cg-planets');
    var stars = ''; for (var s = 0; s < 60; s++) stars += '<circle cx="' + (K.seeded(s, 4) * 360).toFixed(0) + '" cy="' + (K.seeded(s, 5) * 420).toFixed(0) + '" r="' + (0.4 + K.seeded(s, 6) * 1).toFixed(1) + '"/>';
    var tail = ''; for (var t = 7; t >= 1; t--) tail += '<circle class="lp-tl" r="' + (5.5 - t * 0.55).toFixed(1) + '" fill="#E0F2FE" opacity="' + (0.5 - t * 0.06).toFixed(2) + '"/>';
    var pl = []; for (var i = 0; i < N; i++) pl.push(i);
    // le plus proche (bas de l'orbite) se dessine en dernier
    var order = pl.slice().sort(function (a, b) { return pos(ang(a))[1] - pos(ang(b))[1]; });
    box.innerHTML = '<div class="cg-stage lp-stage"><div class="lp-head"><span class="lp-live"><i></i><b>LIVE</b></span><b class="lp-ph fit" id="lpPh"></b><em class="lp-tm fit" id="lpTm"></em></div>' +
      '<i class="lp-bar" id="lpBarB"><b id="lpBar"></b></i>' +
      '<div class="lp-scene"><svg class="lp-svg" id="lpSvg" viewBox="0 0 360 230" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true"><defs>' +
        '<radialGradient id="lpN' + uid + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#A78BFA" stop-opacity=".55"/><stop offset=".5" stop-color="#7C3AED" stop-opacity=".18"/><stop offset="1" stop-color="#7C3AED" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="lpC' + uid + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#BAE6FD"/><stop offset="1" stop-color="#38BDF8" stop-opacity="0"/></radialGradient></defs>' +
        '<g class="lp-stars" fill="#fff" opacity=".7">' + stars + '</g>' +
        '<ellipse id="lpE0" cx="' + CX + '" cy="' + CY + '" rx="150" ry="92" fill="url(#lpN' + uid + ')"/>' +
        '<ellipse id="lpE1" cx="' + CX + '" cy="' + CY + '" rx="' + RX + '" ry="' + RY + '" fill="none" stroke="#C4B5FD" stroke-opacity=".35" stroke-width="1.4" stroke-dasharray="2 5"/>' +
        '<ellipse id="lpE2" cx="' + CX + '" cy="' + CY + '" rx="' + (RX - 14) + '" ry="' + (RY - 7) + '" fill="none" stroke="#7C3AED" stroke-opacity=".25" stroke-width="8"/>' +
        '<g class="lp-core" id="lpCore"><circle cx="' + CX + '" cy="' + CY + '" r="30" fill="#0B0720" stroke="#FBBF24" stroke-opacity=".6" stroke-width="1.5"/><circle class="lp-ring" cx="' + CX + '" cy="' + CY + '" r="36" fill="none" stroke="#A78BFA" stroke-opacity=".45" stroke-width="1" stroke-dasharray="3 4"/>' +
          '<text id="lpBig" x="' + CX + '" y="' + (CY + 7) + '" text-anchor="middle"></text></g>' +
        order.map(function (k) { var p = pos(ang(k)); return '<g class="lp-p" data-p="' + k + '" transform="translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') scale(' + p[2].toFixed(3) + ')"><g class="lp-pi"><circle class="lp-halo" r="27"/>' + planet(k, k === 4 ? 13 : 17, uid) + '</g>' +
          '<g class="lp-tag" transform="translate(0 ' + (k === 4 ? 24 : 28) + ')"><rect x="-21" y="-8" width="42" height="16" rx="8"/><text y="4" text-anchor="middle" data-o="' + k + '">' + oddTxt(ODDS[k]) + '</text></g></g>'; }).join('') +
        '<g id="lpCom" class="lp-com">' + tail + '<circle r="11" fill="url(#lpC' + uid + ')"/><circle r="3.6" fill="#fff"/></g>' +
      '</svg></div><div class="lp-last" id="lpLast"></div></div>' +
      K.stakePanel(l.bet, '<div class="lp-board" id="lpBoard">' + pl.map(function (k) { return '<button type="button" data-p="' + k + '">' + mini(k) + '<b class="fit" data-o="' + k + '">' + oddTxt(ODDS[k]) + '</b></button>'; }).join('') + '</div>');
    K.bindStake(box);
    var st = { R: null, me: null, sel: null, off: 0, first: true, shown: null, busy: false, lastKey: '', mk: '', odds: ODDS.slice() };
    var nowS = function () { return Date.now() / 1000 + st.off; };
    var locked = function () { return !!(st.me && st.R && st.me.rid === st.R.i); };
    var ph = $('lpPh'), tm = $('lpTm'), bar = $('lpBar'), barB = $('lpBarB'), go = $('csGo'), big = $('lpBig'), com = $('lpCom'), tails = com.querySelectorAll('.lp-tl'), stage = box.querySelector('.lp-stage');
    var pEls = {}; box.querySelectorAll('.lp-p').forEach(function (e) { pEls[e.getAttribute('data-p')] = e; });
    box.querySelectorAll('#lpBoard [data-p]').forEach(function (b) {
      b.addEventListener('click', function () { if (locked()) return; st.sel = +b.getAttribute('data-p'); st.mk = ''; });
    });
    box.querySelectorAll('.lp-p').forEach(function (e) { e.addEventListener('click', function () { if (locked()) return; st.sel = +e.getAttribute('data-p'); st.mk = ''; }); });
    box.addEventListener('stake', function () { st.mk = ''; });
    var goText = function (t) { K.setText(go, t); };
    go.addEventListener('click', async function () {
      var R = st.R; if (st.busy || !R || locked() || nowS() >= R.close) return;
      if (st.sel == null) { K.toast(l.pick); return; }
      st.busy = true; go.disabled = true;
      var r = await K.multi('planets', 'bet', { sel: String(st.sel) });
      st.busy = false;
      if (r) { st.me = r; if (r.round) st.R = r.round; st.mk = ''; }
    });
    var alive = function () { return box.isConnected && K.S.game === 'planets'; };
    var sync = async function () {
      if (!alive()) return;
      var r = null;
      try { var rq = await fetch('casino-tour.php?g=planets', { cache: 'no-store' }); r = await rq.json(); } catch (e) { r = null; }
      if ((!r || !r.ok) && !K.guest()) { r = await K.multi('planets', 'dround', null, true); if (r) r.mine = 1; }
      if (!alive()) return;
      var delay = 4000;
      if (r && r.round) {
        st.off = r.now - Date.now() / 1000; st.R = r.round; st.fails = 0;
        if (r.round.odds && r.round.odds.length === N) st.odds = r.round.odds;
        delay = pollDelay(st.R, nowS(), !!st.R.res);
      } else { st.fails = (st.fails || 0) + 1; delay = Math.min(10000, 1500 * st.fails); }
      clearTimeout(K.S.timer); K.S.timer = setTimeout(sync, delay);
      if (!r || !r.round) return;
      var mine = r.mine ? r : null, open0 = st.me && !st.me.done;
      if (!K.guest() && !mine && (st.first || (open0 && st.R.res && st.R.i >= (st.me.rid || 0)))) {
        mine = await K.multi('planets', 'dround', null, true);
        if (!alive()) return;
      }
      if (mine && mine.round) { st.me = mine.has ? mine : null; if (st.first) { st.first = false; if (st.me && st.me.done) st.shown = st.me.ref; } st.mk = ''; }
    };
    var showMine = function (t) {
      var me = st.me, R = st.R;
      if (!me || !me.done || !me.ref || st.shown === me.ref || !R) return;
      if (me.rid === R.i && t < R.close + REVEAL) return; // the amount only once the comet has stopped
      st.shown = me.ref;
      K.resultLine(box, me);
    };
    var setCom = function (a, spd) {
      var p = pos(a);
      com.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') scale(' + p[2].toFixed(3) + ')');
      // la queue suit l'orbite derrière la tête
      for (var j = 0; j < tails.length; j++) {
        var q = pos(a - (tails.length - j) * Math.max(1.2, Math.min(9, spd / 55))), dx = q[0] - p[0], dy = q[1] - p[1];
        tails[j].setAttribute('cx', (dx / p[2]).toFixed(1)); tails[j].setAttribute('cy', (dy / p[2]).toFixed(1));
      }
    };
    var wasWin = -1;
    var tick = function () {
      if (!alive()) return;
      var R = st.R;
      if (R) {
        var t = nowS();
        if (t >= R.end + 0.6) { // tour fini, le serveur répondra au prochain appel : on montre déjà le suivant (mises ouvertes)
          var lst = (R.last || []).slice(); if (R.res) lst.unshift(+R.res.n);
          st.R = R = { i: R.i + 1, t0: R.end, close: R.end + R.B, end: R.end + R.P, P: R.P, B: R.B, phase: 'bet', last: lst.slice(0, 6) };
        }
        var bet = t < R.close, e = t - R.close, res = R.res ? +R.res.n : -1, rev = res >= 0 && e >= REVEAL;
        // v2811 : statut sur une ligne — « Paris ouverts 1:54 » · « Derniers paris 0:08 » · « Tirage en cours » · « Prochain tour dans 0:41 »
        if (bet) {
          var left = R.close - t;
          K.setText(ph, left <= 10 ? l.lastc : l.bo); K.setText(tm, mmss(left));
          bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, left / R.B)).toFixed(4) + ')';
          big.textContent = mmss(left); big.setAttribute('class', 'cnt' + (left <= 10 ? ' warn' : ''));
        } else {
          var rs = rev && e < REVEAL + 5; // « Résultats » quelques secondes, puis « Prochain tour dans 0:41 »
          K.setText(ph, rs ? l.rs : rev ? l.nx : l.dp); K.setText(tm, rev && !rs ? mmss(R.end - t) : '');
          bar.style.transform = 'scaleX(0)';
          if (rev) { big.textContent = oddTxt(st.odds[res]); big.setAttribute('class', 'odd'); } else { big.textContent = ''; }
        }
        var cls = bet ? (R.close - t <= 10 ? 'warn' : 'open') : 'shut';
        if (st.cls !== cls) { st.cls = cls; barB.className = 'lp-bar ' + cls; stage.setAttribute('data-ph', cls); }
        // la comète : lente pendant les mises, puis elle file et s'arrête sur la planète tirée (la même pour tous)
        var a0 = norm(R.close * 36), a, spd = 36;
        if (bet || res < 0) a = norm(t * 36);
        else {
          var tgt = ang(res), tot = 9 * 360 + norm(tgt - a0), k = Math.min(1, e / REVEAL);
          a = a0 + tot * eo(k); spd = tot * 4 * Math.pow(1 - k, 3) / REVEAL;
        }
        setCom(a, spd);
        var win = rev ? res : -1;
        if (win !== wasWin) {
          wasWin = win; stage.classList.toggle('lp-done', win >= 0);
          Object.keys(pEls).forEach(function (k) { pEls[k].classList.toggle('win', +k === win); });
          box.querySelectorAll('#lpBoard [data-p]').forEach(function (b) { b.classList.toggle('win', +b.getAttribute('data-p') === win); });
        }
        var list = (R.last || []).slice(); if (rev) list.unshift(res);
        var lk = R.i + ':' + list.join(',');
        if (lk !== st.lastKey) { st.lastKey = lk; $('lpLast').innerHTML = list.slice(0, 12).map(function (v, j) { return '<i class="lp-li' + (j === 0 && rev ? ' new' : '') + '">' + mini(+v) + '</i>'; }).join(''); }
        var mineNow = !!(st.me && st.me.rid === R.i);
        if (mineNow) { goText(l.placed + ' · ' + oddTxt(st.odds[+st.me.sel])); go.disabled = true; go.classList.add('placed'); go.classList.remove('wait'); }
        else if (!bet) { goText(l.bclosed); go.disabled = true; go.classList.remove('placed'); go.classList.add('wait'); }
        else { goText(st.sel == null ? l.bet : l.bet + ' · ' + oddTxt(st.odds[st.sel])); go.disabled = st.busy; go.classList.remove('placed', 'wait'); }
        var sel = mineNow ? +st.me.sel : st.sel;
        var mk = [sel, mineNow ? 1 : 0, st.odds.join(',')].join('|');
        if (mk !== st.mk) {
          st.mk = mk;
          box.querySelectorAll('#lpBoard [data-p]').forEach(function (b) { var p = +b.getAttribute('data-p'); b.classList.toggle('on', p === sel); b.classList.toggle('mine', mineNow && p === sel); });
          Object.keys(pEls).forEach(function (k) { pEls[k].classList.toggle('on', +k === sel); });
          box.querySelectorAll('[data-o]').forEach(function (x) { var v = oddTxt(st.odds[+x.getAttribute('data-o')]); if (x.textContent !== v) { x.textContent = v; if (x.classList.contains('fit')) K.fitEl(x); } });
        }
        showMine(t);
      } else if ((st.fails || 0) >= 2) { K.setText(ph, l.mc); K.setText(tm, ''); } // serveur injoignable
      K.S.raf = requestAnimationFrame(tick);
    };
    // portrait : l'orbite devient plus ronde et remplit la hauteur ; paysage : ellipse large
    var svg = $('lpSvg');
    var layout = function () {
      if (!svg.isConnected) return;
      var w = svg.clientWidth, h = svg.clientHeight; if (!w || !h) return;
      VH = Math.max(200, 360 * h / w); var vw = 360, vx = 0;
      if (VH < 230) { VH = 230; vw = 230 * w / h; vx = 180 - vw / 2; }
      CY = VH / 2; RY = Math.max(56, Math.min(RX * 0.95, VH / 2 - 44));
      svg.setAttribute('viewBox', vx.toFixed(1) + ' 0 ' + vw.toFixed(1) + ' ' + VH.toFixed(1));
      [['lpE0', 150, RY + 28], ['lpE1', RX, RY], ['lpE2', RX - 14, RY - 7]].forEach(function (q) { var e = $(q[0]); e.setAttribute('cy', CY.toFixed(1)); e.setAttribute('rx', q[1]); e.setAttribute('ry', Math.max(1, q[2]).toFixed(1)); });
      $('lpCore').setAttribute('transform', 'translate(0 ' + (CY - 112).toFixed(1) + ') scale(1)');
      Object.keys(pEls).forEach(function (k) { var p = pos(ang(+k)); pEls[k].setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') scale(' + p[2].toFixed(3) + ')'); });
    };
    if (window.ResizeObserver) new ResizeObserver(layout).observe(svg); else window.addEventListener('resize', layout);
    layout();
    requestAnimationFrame(function () { layout(); K.fitAll(box); });
    sync(); tick();
  }, { rules: RULES });
})(window.D6 = window.D6 || {});
