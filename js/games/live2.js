/* v2830 — LIVE 2 (owner request, round 5): 4 NEW live games, one shared round for everyone (like Lucky Planets):
   ~2 min of bets, then a show with real suspense, results, history. Server: casino_lib.php CASINO_LIVE2 + casino_draw_*,
   public state casino-tour.php?g=<key> (polled ~8 s, precise at close / result / next round). Odds = 0.94 ÷ chance (6 %).
   - catwalk  Miss Catwalk : 6 models walk the runway, 3 judges score, the best total is crowned (favourite changes each round).
   - fleets   Star Fleets     : Gold vs Violet, 5 volleys (each destroys one ship) — winner ×1.88 or exact score.
   - gemcount Gem Count       : fan-tan — a pile of gems under a dome is removed 4 by 4; 1, 2, 3 or 4 left (×3.76), odd / even.
   - claw     Lucky Claw      : the claw grabs one of 6 prizes (a first try slips) and drops it in the chute.
   Everything is drawn from (round n°, drawn result, time since bets closed): every viewer sees the same show, joining late too. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bo: 'Place your bets', lastc: 'Bets closing', bclosed: 'Bets closed', rs: 'Results', nx: 'Next round in', mc: 'Market closed', placed: 'Bet placed', bet: 'Place bet', pick: 'Make your choice first', cw: 'Show in progress', fl: 'Battle in progress', gc: 'Counting in progress', cl: 'Claw in action', odd: 'Odd', even: 'Even' },
    fr: { bo: 'Pariez maintenant', lastc: 'Clôture des paris', bclosed: 'Paris fermés', rs: 'Résultats', nx: 'Prochain tour dans', mc: 'Marché fermé', placed: 'Pari enregistré', bet: 'Parier', pick: 'Faites d’abord votre choix', cw: 'Défilé en cours', fl: 'Bataille en cours', gc: 'Comptage en cours', cl: 'Pince en action', odd: 'Impair', even: 'Pair' },
    es: { bo: 'Apueste ahora', lastc: 'Cierre de apuestas', bclosed: 'Apuestas cerradas', rs: 'Resultados', nx: 'Próxima ronda en', mc: 'Mercado cerrado', placed: 'Apuesta registrada', bet: 'Apostar', pick: 'Elija primero', cw: 'Desfile en curso', fl: 'Batalla en curso', gc: 'Conteo en curso', cl: 'Garra en acción', odd: 'Impar', even: 'Par' },
    pt: { bo: 'Aposte agora', lastc: 'Encerramento das apostas', bclosed: 'Apostas encerradas', rs: 'Resultados', nx: 'Próxima rodada em', mc: 'Mercado fechado', placed: 'Aposta registrada', bet: 'Apostar', pick: 'Escolha primeiro', cw: 'Desfile em andamento', fl: 'Batalha em andamento', gc: 'Contagem em andamento', cl: 'Garra em ação', odd: 'Ímpar', even: 'Par' },
    ar: { bo: 'ضع رهانك الآن', lastc: 'الرهانات تُغلق قريبًا', bclosed: 'الرهانات مغلقة', rs: 'النتائج', nx: 'الجولة التالية خلال', mc: 'السوق مغلق', placed: 'تم تسجيل الرهان', bet: 'راهن', pick: 'اختر أولاً', cw: 'العرض جارٍ', fl: 'المعركة جارية', gc: 'العدّ جارٍ', cl: 'المخلب يعمل', odd: 'فردي', even: 'زوجي' },
    tr: { bo: 'Bahislerinizi yapın', lastc: 'Bahisler kapanıyor', bclosed: 'Bahisler kapandı', rs: 'Sonuçlar', nx: 'Sonraki tur', mc: 'Piyasa kapalı', placed: 'Bahis alındı', bet: 'Bahis yap', pick: 'Önce seçiminizi yapın', cw: 'Defile sürüyor', fl: 'Savaş sürüyor', gc: 'Sayım sürüyor', cl: 'Pençe iş başında', odd: 'Tek', even: 'Çift' },
    vi: { bo: 'Mời đặt cược', lastc: 'Sắp đóng cược', bclosed: 'Đã đóng cược', rs: 'Kết quả', nx: 'Vòng tiếp theo sau', mc: 'Thị trường đóng cửa', placed: 'Đã đặt cược', bet: 'Đặt cược', pick: 'Hãy chọn trước', cw: 'Đang trình diễn', fl: 'Đang giao chiến', gc: 'Đang đếm', cl: 'Đang gắp', odd: 'Lẻ', even: 'Chẵn' },
    id: { bo: 'Pasang taruhan Anda', lastc: 'Taruhan segera ditutup', bclosed: 'Taruhan ditutup', rs: 'Hasil', nx: 'Ronde berikutnya dalam', mc: 'Pasar tutup', placed: 'Taruhan tercatat', bet: 'Pasang', pick: 'Pilih dulu', cw: 'Peragaan berlangsung', fl: 'Pertempuran berlangsung', gc: 'Penghitungan berlangsung', cl: 'Capit beraksi', odd: 'Ganjil', even: 'Genap' },
    ru: { bo: 'Делайте ставки', lastc: 'Приём ставок завершается', bclosed: 'Ставки закрыты', rs: 'Результаты', nx: 'Следующий раунд через', mc: 'Рынок закрыт', placed: 'Ставка принята', bet: 'Поставить', pick: 'Сначала сделайте выбор', cw: 'Идёт показ', fl: 'Идёт битва', gc: 'Идёт подсчёт', cl: 'Клешня в деле', odd: 'Нечёт', even: 'Чёт' },
    de: { bo: 'Jetzt setzen', lastc: 'Einsätze schließen gleich', bclosed: 'Einsätze geschlossen', rs: 'Ergebnisse', nx: 'Nächste Runde in', mc: 'Markt geschlossen', placed: 'Einsatz platziert', bet: 'Setzen', pick: 'Bitte zuerst wählen', cw: 'Show läuft', fl: 'Schlacht läuft', gc: 'Zählung läuft', cl: 'Greifer in Aktion', odd: 'Ungerade', even: 'Gerade' },
    hi: { bo: 'अभी दांव लगाएं', lastc: 'दांव बंद होने वाले हैं', bclosed: 'दांव बंद', rs: 'नतीजे', nx: 'अगला राउंड', mc: 'बाज़ार बंद', placed: 'दांव दर्ज हुआ', bet: 'दांव लगाएं', pick: 'पहले चुनें', cw: 'शो जारी है', fl: 'लड़ाई जारी है', gc: 'गिनती जारी है', cl: 'क्लॉ चल रहा है', odd: 'विषम', even: 'सम' },
    zh: { bo: '请下注', lastc: '即将停止下注', bclosed: '停止下注', rs: '开奖结果', nx: '下一局', mc: '暂停交易', placed: '已下注', bet: '下注', pick: '请先选择', cw: '走秀进行中', fl: '战斗进行中', gc: '计数中', cl: '抓取中', odd: '单', even: '双' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function mmss(v) { v = Math.max(0, Math.ceil(v)); return Math.floor(v / 60) + ':' + (v % 60 < 10 ? '0' : '') + (v % 60); }
  function cl01(k) { return Math.max(0, Math.min(1, k)); }
  function seg(e, a, b) { return cl01((e - a) / (b - a)); }
  function eio(k) { k = cl01(k); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function eo(k) { k = cl01(k); return 1 - Math.pow(1 - k, 3); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  // stable pseudo-random from (round n°, k): the same on every phone
  function hr(a, b) { var h = ((a | 0) ^ Math.imul(b | 0, 0x9E3779B1)) >>> 0; h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B) >>> 0; h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  // set an attribute only if it changed (cheap frames)
  function sa(el, n, v) { if (!el) return; var c = el._c || (el._c = {}); if (c[n] !== v) { c[n] = v; el.setAttribute(n, v); } }
  function tr(x, y, s, r) { return 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' + (s != null && s !== 1 ? ' scale(' + s.toFixed(3) + ')' : '') + (r ? ' rotate(' + r.toFixed(1) + ')' : ''); }
  function txt(el, v) { if (el && el.textContent !== v) el.textContent = v; }
  // server polls: ~8 s when nothing changes, precise around close, result and next round (same as Lucky Planets)
  function pollDelay(R, t, hasRes) {
    if (t < R.close) { var a = R.close - t; return a > 14 ? Math.min(8000, (a - 10) * 1000) : a > 1.3 ? Math.min(2500, (a - 1.1) * 1000) : Math.max(100, (a + 0.1) * 1000); }
    if (!hasRes) return 400;
    var b = R.end - t; return b > 14 ? Math.min(8000, (b - 10) * 1000) : b > 1.3 ? Math.min(2500, (b - 1.1) * 1000) : Math.max(150, (b + 0.25) * 1000);
  }
  function normOdds(o) { var r = {}; if (!o) return r; if (Array.isArray(o)) o.forEach(function (v, i) { r[String(i)] = +v; }); else Object.keys(o).forEach(function (k) { r[k] = +o[k]; }); return r; }
  var GID = 0;
  var STARS = function (n, w, h, seed) { var s = ''; for (var i = 0; i < n; i++) s += '<circle cx="' + (hr(seed, i) * w - 40).toFixed(0) + '" cy="' + (hr(seed, i + 99) * h - 30).toFixed(0) + '" r="' + (0.35 + hr(seed, i + 7) * 0.9).toFixed(2) + '"/>'; return s; };

  /* ======================================================= shared live engine ===================================================== */
  function live(key, G) {
    K.register(key, function (box) {
      var l = L(), uid = ++GID, dc = K.dec();
      var oddTxt = function (v) { return v == null || !isFinite(v) ? '×–' : '×' + Number(v).toFixed(2).replace('.', dc); };
      box.classList.add('cg-game', 'cg-live2', 'cg-' + key);
      box.innerHTML = '<div class="cg-stage l2-stage" data-ph="open"><div class="l2-head"><span class="l2-live"><i></i><b>LIVE</b></span><b class="l2-ph fit"></b><em class="l2-tm fit"></em></div>' +
        '<i class="l2-bar"><b></b></i>' +
        '<div class="l2-scene"><svg class="l2-svg" viewBox="0 0 360 230" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + G.scene(uid, l) + '</svg></div>' +
        '<div class="l2-last"></div></div>' +
        K.stakePanel(l.bet, '<div class="l2-board l2-b-' + key + '" dir="ltr">' + G.board(uid, l, oddTxt, G.odds0) + '</div>');
      K.bindStake(box);
      var q = function (s) { return box.querySelector(s); };
      var ph = q('.l2-ph'), tm = q('.l2-tm'), bar = q('.l2-bar b'), barB = q('.l2-bar'), go = $('csGo'), stage = q('.l2-stage'), lastEl = q('.l2-last'), svg = q('.l2-svg');
      var st = { R: null, me: null, sel: null, off: 0, first: true, shown: null, busy: false, lastKey: '', mk: '', odds: Object.assign({}, G.odds0 || {}), cls: '' };
      var ctx = { box: box, svg: svg, uid: uid, l: l, oddTxt: oddTxt, dc: dc, q: q, st: st };
      G.init(ctx);
      var nowS = function () { return Date.now() / 1000 + st.off; };
      var locked = function () { return !!(st.me && st.R && st.me.rid === st.R.i); };
      var choose = function (s) { if (locked() || s == null) return; st.sel = String(s); st.mk = ''; };
      box.querySelectorAll('[data-s]').forEach(function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-s')); }); });
      box.addEventListener('stake', function () { st.mk = ''; });
      go.addEventListener('click', async function () {
        var R = st.R; if (st.busy || !R || locked() || nowS() >= R.close) return;
        if (st.sel == null) { K.toast(l.pick); return; }
        if (st.odds[st.sel] == null) return; // catwalk : odds of the new round not arrived yet
        st.busy = true; go.disabled = true;
        var r = await K.multi(key, 'bet', { sel: st.sel });
        st.busy = false;
        if (r) { st.me = r; if (r.round) st.R = r.round; st.mk = ''; }
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
        if (me.rid === R.i && t < R.close + G.SHOW) return; // the amount only once the show is over
        st.shown = me.ref;
        K.resultLine(box, me);
      };
      var wasWin = '';
      var tick = function () {
        if (!alive()) return;
        var R = st.R;
        if (R) {
          var t = nowS();
          if (t >= R.end + 0.6) { // round over: the next one is already open (the server confirms at the next poll)
            var lst = (R.last || []).slice(); if (R.res) lst.unshift(+R.res.n);
            st.R = R = { i: R.i + 1, t0: R.end, close: R.end + R.B, end: R.end + R.P, P: R.P, B: R.B, phase: 'bet', last: lst.slice(0, 6) };
            if (G.varOdds) { st.odds = {}; st.mk = ''; }
          }
          var bet = t < R.close, e = t - R.close, res = R.res || null, rev = !!res && e >= G.SHOW;
          if (bet) {
            var left = R.close - t;
            K.setText(ph, left <= 10 ? l.lastc : l.bo); K.setText(tm, mmss(left));
            bar.style.transform = 'scaleX(' + cl01(left / R.B).toFixed(4) + ')';
          } else {
            var rs = rev && e < G.SHOW + 5; // « Results » a few seconds, then « Next round in 0:41 »
            K.setText(ph, rs ? l.rs : rev ? l.nx : (res ? l[G.lab] : l.bclosed)); K.setText(tm, rev && !rs ? mmss(R.end - t) : '');
            bar.style.transform = 'scaleX(0)';
          }
          var cls = bet ? (R.close - t <= 10 ? 'warn' : 'open') : 'shut';
          if (st.cls !== cls) { st.cls = cls; barB.className = 'l2-bar ' + cls; stage.setAttribute('data-ph', cls); }
          G.frame(ctx, R, t, e, bet ? null : res, st.odds);
          // v2832 : sons du spectacle — départ (si on a vu les mises), puis un petit son à chaque temps fort
          if (bet) st.goArm = R.i; else if (st.goArm === R.i && e < 1.5) { st.goArm = -1; K.sfx('go'); }
          if (K.amb) K.amb(key, !bet && !!res && e >= 0 && e < G.SHOW, e / G.SHOW); // v2851 : ambiance pendant le spectacle
          if (!bet && res && e >= 0 && e < G.SHOW && G.beat) K.sfxBeat(st, 'bt', G.beat(e, res, R), 'tick');
          var wins = rev ? G.wins(res).join(',') : '';
          if (wins !== wasWin) {
            wasWin = wins; var ws = wins ? wins.split(',') : [];
            stage.classList.toggle('l2-done', !!wins);
            box.querySelectorAll('[data-s]').forEach(function (b) { b.classList.toggle('win', ws.indexOf(b.getAttribute('data-s')) >= 0); });
          }
          var list = (R.last || []).slice(); if (rev) list.unshift(+res.n);
          var lk = R.i + ':' + list.join(',');
          if (lk !== st.lastKey) { st.lastKey = lk; lastEl.innerHTML = list.slice(0, 12).map(function (v, j) { return '<i class="l2-li' + (j === 0 && rev ? ' new' : '') + '">' + G.hist(+v, ctx) + '</i>'; }).join(''); }
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

  /* ================================================= 1. MISS CATWALK (women theme) ============================================ */
  var CW = {
    names: ['Ruby', 'Jade', 'Sky', 'Amber', 'Iris', 'Rose'],
    dress: ['#FB3B6A', '#14C08A', '#3B8BF6', '#F7B32B', '#9B6BFA', '#F25FB0'],
    dark: ['#881337', '#065F46', '#1E3A8A', '#92400E', '#4C1D95', '#9D174D'],
    skin: ['#FDE7DA', '#FBE2D2', '#FCE5D6', '#FADFCD', '#FDE9DD', '#FBE1D0'], // propriétaire : toutes les mannequins à la peau claire
    hair: ['#24140A', '#F5D06F', '#6B3F1E', '#B4471F', '#141014', '#E9E4F0']
  };
  /* v2860 (owner: "amateur") — the models are now real figures (D6.Rig): runway walk (crossing steps, hip sway, arm swing)
     seen from the front when they come, from the back when they leave, a pose at the end of the runway; varied skin tones,
     hair and outfits. One sprite sheet per model (built once, in the background), shown through an SVG viewBox. */
  var CWF = { fw: 52, fh: 88, n: 18 }; // frames: 0-7 walk (front), 8-15 walk (back), 16-17 pose
  var CWP = [
    { style: 'long', legs: 'dress', skirt: ['#FB3B6A', '#881337'], skirtLen: 0.22, top: ['#FB3B6A', '#881337'], sleeve: 'none', lips: '#9F1239', shoe: '#111827' },
    { style: 'bun', legs: 'pants', top: ['#14C08A', '#065F46'], bottom: ['#0E9F73', '#064E3B'], sleeve: 'none', lips: '#BE185D', shoe: '#F5F5F4' },
    { style: 'wavy', legs: 'dress', skirt: ['#3B8BF6', '#1E3A8A'], skirtLen: 0.44, top: ['#3B8BF6', '#1E3A8A'], sleeve: 'short', lips: '#BE123C', shoe: '#E5E7EB' },
    { style: 'pony', legs: 'pants', top: ['#F7B32B', '#92400E'], bottom: ['#1F2937', '#0B1220'], sleeve: 'long', lips: '#B91C1C', shoe: '#F7B32B' },
    { style: 'wavy', legs: 'dress', skirt: ['#9B6BFA', '#4C1D95'], skirtLen: 0.3, top: ['#9B6BFA', '#4C1D95'], sleeve: 'none', lips: '#7E1D3F', shoe: '#FDE68A' },
    { style: 'bob', legs: 'skirt', skirt: ['#1F2937', '#0B1220'], skirtLen: 0.2, top: ['#F25FB0', '#9D174D'], sleeve: 'long', lips: '#DB2777', shoe: '#111827' }
  ];
  var CWS = {}; // model index → blob URL of its sheet (kept across rounds)
  function cwSheet(i, cb) {
    if (CWS[i]) { cb(CWS[i]); return; }
    var R = D6.Rig; if (!R) return;
    var k = 3, fw = CWF.fw * k, fh = CWF.fh * k, cv = document.createElement('canvas'); cv.width = fw * CWF.n; cv.height = fh;
    var x = cv.getContext('2d'), P = CWP[i], pal = Object.assign({ build: 'f', skin: CW.skin[i], hair: CW.hair[i], heels: 1, lash: 1 }, P);
    for (var f = 0; f < CWF.n; f++) {
      var view = f < 8 ? 'front' : f < 16 ? 'back' : 'front', pose = f < 16 ? 'catwalk' : 'stand', ph = f < 16 ? (f % 8) / 8 : (f - 16) * 0.25;
      x.save(); x.translate(f * fw + fw / 2, fh * 0.99); R.draw(x, fh * 0.94, { view: view, pose: pose, ph: ph, pal: pal }); x.restore();
    }
    var done = function (u) { CWS[i] = u; cb(u); };
    if (cv.toBlob) cv.toBlob(function (b) { done(b ? URL.createObjectURL(b) : cv.toDataURL()); }); else done(cv.toDataURL());
  }
  function cwModel(i, uid) {
    if (D6.Rig) return '<ellipse cy="0" rx="13" ry="2.6" fill="#000" opacity=".35"/><svg class="cw-fr" x="' + (-CWF.fw / 2) + '" y="' + (-CWF.fh + 1) + '" width="' + CWF.fw + '" height="' + CWF.fh + '" viewBox="' + (16 * CWF.fw) + ' 0 ' + CWF.fw + ' ' + CWF.fh + '"><image width="' + (CWF.fw * CWF.n) + '" height="' + CWF.fh + '" preserveAspectRatio="none"/></svg>';
    return cwModelSvg(i, uid);
  }
  function cwModelSvg(i, uid) {
    var g = 'cwd' + uid + '_' + i, sk = CW.skin[i], hc = CW.hair[i];
    var back = ['<path d="M-7-73q-2 15 1 23h12q3-8 1-23z" fill="' + hc + '"/>', '<circle cy="-81" r="4.2" fill="' + hc + '"/>',
      '<path d="M-7.4-70q-.5 9 1.6 11h11.6q2.1-2 1.6-11z" fill="' + hc + '"/>', '<path d="M4-72q9 3 7 17q-1.5 3-3 0q1-9-5-13z" fill="' + hc + '"/>',
      '<circle cy="-71" r="10.5" fill="' + hc + '"/>', ''][i];
    return '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + CW.dress[i] + '"/><stop offset="1" stop-color="' + CW.dark[i] + '"/></linearGradient></defs>' +
      '<ellipse cy="0" rx="13" ry="2.6" fill="#000" opacity=".35"/>' + back +
      '<path d="M-3-26L-4.5-1M3-26L5-1" stroke="' + sk + '" stroke-width="2.8" stroke-linecap="round"/>' +
      '<path d="M-7.5-.5h4.5M3.2-.5h4.8" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M-6.5-56q-5 11-4.5 23M6.5-56q5 11 4.5 23" stroke="' + sk + '" stroke-width="2.3" fill="none" stroke-linecap="round"/>' +
      '<path d="M-6.3-58h12.6l1.6 13.5l9.6 21.5q-17 5.5-34.4 0l9.6-21.5z" fill="url(#' + g + ')"/>' +
      '<path d="M-1-58l1 14M-12-25q12 3 24 0" stroke="#fff" stroke-opacity=".28" stroke-width="1" fill="none"/>' +
      '<path d="M-5.2-44.5h10.4" stroke="#FDE68A" stroke-width="1.5"/>' +
      '<path d="M0-63v5" stroke="' + sk + '" stroke-width="3.2"/><circle cy="-68.5" r="5.8" fill="' + sk + '"/>' +
      '<path d="M-6.1-69q.6-7.6 6.1-7.6t6.1 7.6q-2.6-4.4-6.1-4.4t-6.1 4.4z" fill="' + hc + '"/>' +
      '<circle cx="-1.8" cy="-68" r=".7" fill="#1F1308"/><circle cx="1.8" cy="-68" r=".7" fill="#1F1308"/><path d="M-1.4-65.3q1.4 1 2.8 0" stroke="#BE123C" stroke-width=".9" fill="none"/>' +
      '<circle cy="-57" r="1.1" fill="#FDE68A"/>';
  }
  function cwHead(i) {
    return '<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="11.5" fill="' + CW.dress[i] + '"/><circle r="11.5" fill="none" stroke="#fff" stroke-opacity=".35"/>' +
      '<circle cy="1.5" r="5.6" fill="' + CW.skin[i] + '"/><path d="M-6 1q.6-7.4 6-7.4t6 7.4q-2.6-4.3-6-4.3t-6 4.3z" fill="' + CW.hair[i] + '"/></svg>';
  }
  function crown(s, fill) { return '<path d="M' + (-9 * s) + ' ' + (3 * s) + 'l' + (-2 * s) + ' ' + (-10 * s) + 'l' + (6 * s) + ' ' + (5 * s) + 'l' + (5 * s) + ' ' + (-8 * s) + 'l' + (5 * s) + ' ' + (8 * s) + 'l' + (6 * s) + ' ' + (-5 * s) + 'l' + (-2 * s) + ' ' + (10 * s) + 'z" fill="' + (fill || '#FBBF24') + '" stroke="#FDE68A" stroke-width="' + (0.8 * s) + '"/>'; }
  var CW_SLOT = 10.4, CW_W0 = 2;
  function cwFrame(c, m, fi) { var sv = c.fr && c.fr[m]; if (sv) sa(sv, 'viewBox', (fi * CWF.fw) + ' 0 ' + CWF.fw + ' ' + CWF.fh); }
  function rowCls(el, lead, now, win) { var k = (lead ? 1 : 0) + (now ? 2 : 0) + (win ? 4 : 0); if (el._rk === k) return; el._rk = k; el.classList.toggle('lead', lead); el.classList.toggle('now', now); el.classList.toggle('cwin', win); }
  live('catwalk', {
    SHOW: 70, lab: 'cw', varOdds: true, odds0: {},
    beat: function (e) { var sl = Math.floor((e - CW_W0) / CW_SLOT), u = e - CW_W0 - sl * CW_SLOT; return sl < 0 || sl > 5 ? -1 : sl * 4 + (u >= 4.9) + (u >= 5.5) + (u >= 6.1); }, // v2832 : chaque mannequin, chaque note de juge
    rules: {
      en: '🔴 LIVE: a new show every 200 s, the same for everyone.\n1. Pick one of the 6 models. The favourite changes every round: each model shows her payout (×3.13 for the favourite … ×11.75 for the outsider).\n2. Set your stake and tap “Place bet” before bets close. One bet per round.\n3. Each model walks the runway and 3 judges score her: the best total is crowned. If she is yours, you win stake × her payout.',
      fr: '🔴 EN DIRECT : un défilé toutes les 200 s, le même pour tout le monde.\n1. Choisis une des 6 mannequins. La favorite change à chaque tour : chacune affiche son gain (×3,13 pour la favorite … ×11,75 pour l’outsider).\n2. Choisis ta mise et touche « Parier » avant la fermeture des paris. Un pari par tour.\n3. Chaque mannequin défile et 3 juges la notent : la meilleure note totale est couronnée. Si c’est la tienne, tu gagnes mise × son gain.',
      es: '🔴 EN VIVO: un desfile cada 200 s, el mismo para todos.\n1. Elige una de las 6 modelos. La favorita cambia cada ronda: cada una muestra su pago (×3,13 la favorita … ×11,75 la menos probable).\n2. Elige tu apuesta y toca «Apostar» antes del cierre. Una apuesta por ronda.\n3. Cada modelo desfila y 3 jueces la puntúan: la mejor nota total recibe la corona. Si es la tuya, ganas apuesta × su pago.',
      pt: '🔴 AO VIVO: um desfile a cada 200 s, o mesmo para todos.\n1. Escolha uma das 6 modelos. A favorita muda a cada rodada: cada uma mostra seu pagamento (×3,13 a favorita … ×11,75 a azarona).\n2. Escolha o valor e toque em «Apostar» antes do fechamento. Uma aposta por rodada.\n3. Cada modelo desfila e 3 jurados dão notas: a maior nota total é coroada. Se for a sua, você ganha aposta × o pagamento dela.',
      ar: '🔴 مباشر: عرض أزياء كل 200 ثانية، نفسه للجميع.\n1. اختر واحدة من العارضات الست. المفضّلة تتغيّر كل جولة: تُظهر كل عارضة عائدها (×3.13 للمفضّلة … ×11.75 للأقل حظًا).\n2. اختر مبلغ الرهان والمس «راهن» قبل إغلاق الرهانات. رهان واحد لكل جولة.\n3. تسير كل عارضة على المنصة ويقيّمها 3 حكّام: أعلى مجموع يُتوَّج. إذا كانت عارضتك تربح الرهان × عائدها.',
      tr: '🔴 CANLI: her 200 sn’de bir defile, herkes için aynı.\n1. 6 mankenden birini seç. Favori her turda değişir: her manken ödemesini gösterir (favori ×3,13 … sürpriz ×11,75).\n2. Tutarını seç ve bahisler kapanmadan “Bahis yap”a dokun. Her turda bir bahis.\n3. Her manken podyumda yürür ve 3 jüri puan verir: en yüksek toplam taç giyer. Seninkiyse bahis × ödemesini kazanırsın.',
      vi: '🔴 TRỰC TIẾP: mỗi 200 giây một buổi trình diễn, giống nhau cho mọi người.\n1. Chọn một trong 6 người mẫu. Người được yêu thích đổi mỗi vòng: mỗi người hiện tỷ lệ trả (×3,13 cho người được yêu thích … ×11,75 cho người ít khả năng nhất).\n2. Chọn mức cược và chạm «Đặt cược» trước khi đóng cược. Mỗi vòng một cược.\n3. Mỗi người mẫu catwalk và 3 giám khảo chấm điểm: tổng điểm cao nhất được trao vương miện. Nếu là người bạn chọn, bạn thắng cược × tỷ lệ trả.',
      id: '🔴 LANGSUNG: satu peragaan tiap 200 dtk, sama untuk semua.\n1. Pilih satu dari 6 model. Favorit berganti tiap ronde: setiap model menampilkan bayarannya (×3,13 favorit … ×11,75 kuda hitam).\n2. Atur taruhan lalu sentuh «Pasang» sebelum taruhan ditutup. Satu taruhan per ronde.\n3. Setiap model berjalan di catwalk dan 3 juri memberi nilai: total tertinggi dinobatkan. Jika itu pilihanmu, kamu menang taruhan × bayarannya.',
      ru: '🔴 В ПРЯМОМ ЭФИРЕ: показ каждые 200 с, общий для всех.\n1. Выберите одну из 6 моделей. Фаворитка меняется каждый раунд: у каждой своя выплата (×3,13 у фаворитки … ×11,75 у аутсайдера).\n2. Выберите сумму и нажмите «Поставить» до закрытия ставок. Одна ставка за раунд.\n3. Каждая модель выходит на подиум, 3 судьи ставят оценки: лучшая сумма получает корону. Если это ваша модель, вы выигрываете ставку × её выплату.',
      de: '🔴 LIVE: alle 200 s eine Show, für alle gleich.\n1. Wähle eines der 6 Models. Die Favoritin wechselt jede Runde: jedes Model zeigt seine Auszahlung (×3,13 für die Favoritin … ×11,75 für die Außenseiterin).\n2. Wähle deinen Einsatz und tippe auf „Setzen“, bevor die Einsätze schließen. Ein Einsatz pro Runde.\n3. Jedes Model läuft über den Laufsteg, 3 Juroren bewerten: die beste Gesamtnote wird gekrönt. Ist es deines, gewinnst du Einsatz × Auszahlung.',
      hi: '🔴 लाइव: हर 200 सेकंड में एक शो, सबके लिए एक जैसा।\n1. 6 मॉडलों में से एक चुनें। हर राउंड में फेवरिट बदलती है: हर मॉडल पर उसका भुगतान लिखा है (फेवरिट ×3.13 … सबसे कम संभावना ×11.75)।\n2. राशि चुनें और दांव बंद होने से पहले «दांव लगाएं» छुएं। हर राउंड में एक दांव।\n3. हर मॉडल रैंप पर चलती है और 3 जज अंक देते हैं: सबसे ज़्यादा कुल अंक वाली को ताज मिलता है। अगर वह आपकी है, तो आप दांव × उसका भुगतान जीतते हैं।',
      zh: '🔴 直播：每 200 秒一场走秀，所有人同一结果。\n1. 从 6 位模特中选一位。每局热门都会变化：每位模特都标有赔率（热门 ×3.13 … 冷门 ×11.75）。\n2. 设定金额，在停止下注前点击“下注”。每局一注。\n3. 每位模特走上T台，3 位评委打分：总分最高者加冕。如果是你选的，即赢 投注 × 她的赔率。'
    },
    scene: function (uid) {
      var lights = ''; for (var k = 0; k <= 8; k++) { var f = k / 8; lights += '<circle class="cw-bulb" cx="' + lerp(150, 64, f).toFixed(1) + '" cy="' + lerp(64, 230, f).toFixed(1) + '" r="' + (1 + f * 1.3).toFixed(1) + '"/><circle class="cw-bulb" cx="' + lerp(210, 296, f).toFixed(1) + '" cy="' + lerp(64, 230, f).toFixed(1) + '" r="' + (1 + f * 1.3).toFixed(1) + '"/>'; }
      var folds = ''; for (var c = -12; c < 27; c++) folds += '<path d="M' + (c * 24 + 12) + ' -300v362" stroke="#000" stroke-opacity=".22" stroke-width="7"/>';
      var cards = [0, 1, 2].map(function (j) { var y = 72 + j * 46; return '<g class="cw-card" transform="translate(33 ' + y + ')"><rect x="-26" y="-16" width="52" height="38" rx="7" class="cw-cardbg"/>' +
        '<g transform="translate(-14 -3)"><circle r="5" fill="#E9D5FF"/><path d="M-8 12q8-10 16 0z" fill="#E9D5FF"/></g>' +
        '<g class="cw-flip"><text x="9" y="8" text-anchor="middle" class="cw-sc">–</text></g></g>'; }).join('');
      var rows = [0, 1, 2, 3, 4, 5].map(function (m) { var y = 64 + m * 25; return '<g class="cw-row" data-s="' + m + '" transform="translate(327 ' + y + ')"><rect x="-29" y="-11" width="58" height="23" rx="7" class="cw-rowbg"/>' +
        '<circle cx="-20" cy="0" r="6.5" fill="' + CW.dress[m] + '"/><circle cx="-20" cy="1" r="3" fill="' + CW.skin[m] + '"/><g class="cw-lead" transform="translate(-20 -8.5)" opacity="0">' + crown(.55) + '</g>' +
        '<text x="-10" y="-2" class="cw-nm">' + CW.names[m] + '</text><text x="-10" y="8.5" class="cw-val" data-v="' + m + '">–</text></g>'; }).join('');
      var models = [0, 1, 2, 3, 4, 5].map(function (m) { return '<g class="cw-m" data-s="' + m + '"><circle class="cw-halo" cy="-40" r="34"/>' + cwModel(m, uid) + '<g class="cw-crown" transform="translate(0 -79)" opacity="0">' + crown(.8) + '</g></g>'; }).join('');
      var conf = ''; for (var j = 0; j < 22; j++) conf += '<rect class="cw-cf" width="3.2" height="5.6" rx="1" fill="' + ['#F472B6', '#FBBF24', '#FDE68A', '#C084FC', '#FB7185'][j % 5] + '" opacity="0"/>';
      return '<defs><linearGradient id="cwR' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B0A2E"/><stop offset="1" stop-color="#9D2463"/></linearGradient>' +
        '<linearGradient id="cwW' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A0E3A"/><stop offset="1" stop-color="#22061E"/></linearGradient>' +
        '<radialGradient id="cwS' + uid + '" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#FFE4F1" stop-opacity=".5"/><stop offset="1" stop-color="#FFE4F1" stop-opacity="0"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#16051A"/>' +
        '<rect x="-300" y="-300" width="960" height="364" fill="#2A0824"/><rect x="-300" y="0" width="960" height="64" fill="url(#cwW' + uid + ')"/>' + folds +
        '<path d="M-300 62H660" stroke="#F9A8D4" stroke-opacity=".35" stroke-width="1.5"/>' +
        '<g transform="translate(180 22)">' + crown(1.15) + '</g>' +
        '<polygon points="150,64 210,64 296,230 64,230" fill="url(#cwR' + uid + ')"/>' +
        '<polygon points="166,64 194,64 236,230 124,230" fill="#fff" opacity=".05"/>' + lights +
        '<polygon class="cw-spot" points="40,-10 70,-10 205,226 125,226" fill="url(#cwS' + uid + ')"/><polygon class="cw-spot s2" points="290,-10 320,-10 235,226 155,226" fill="url(#cwS' + uid + ')"/>' +
        '<g class="cw-flash"><path d="M74 196l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff"/><path d="M283 178l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#fff"/></g>' +
        '<g class="cw-models">' + models + '</g>' +
        '<text class="cw-big" x="180" y="56" text-anchor="middle"></text>' +
        '<g class="cw-cards">' + cards + '</g><g class="cw-board">' + rows + '</g>' + conf;
    },
    board: function (uid, l, oddTxt) {
      return [0, 1, 2, 3, 4, 5].map(function (m) { return '<button type="button" data-s="' + m + '">' + cwHead(m) + '<b class="fit" data-o="' + m + '">×–</b></button>'; }).join('');
    },
    hist: function (n) { return cwHead(n); },
    wins: function (res) { return [String(res.n)]; },
    init: function (c) {
      c.models = [].slice.call(c.box.querySelectorAll('.cw-m')); c.crowns = c.models.map(function (m) { return m.querySelector('.cw-crown'); });
      c.cards = [].slice.call(c.box.querySelectorAll('.cw-flip')); c.cardT = c.cards.map(function (x) { return x.querySelector('text'); });
      c.vals = [].slice.call(c.box.querySelectorAll('.cw-val')); c.leads = [].slice.call(c.box.querySelectorAll('.cw-lead')); c.rows = [].slice.call(c.box.querySelectorAll('.cw-row'));
      c.big = c.box.querySelector('.cw-big'); c.cf = [].slice.call(c.box.querySelectorAll('.cw-cf'));
      c.fr = c.models.map(function (m) { return m.querySelector('.cw-fr'); });
      c.fr.forEach(function (sv, m) { if (!sv) return; setTimeout(function () { cwSheet(m, function (u) { var im = sv.querySelector('image'); if (im) { im.setAttribute('href', u); im.setAttributeNS('http://www.w3.org/1999/xlink', 'href', u); } }); }, 30 + m * 40); });
    },
    frame: function (c, R, t, e, res, odds) {
      var sc1 = function (v) { return (v / 10).toFixed(1).replace('.', c.dc); };
      var i = R ? R.i : 0, pos = [], k, m;
      var backX = function (m) { return 133 + m * 18.8; };
      if (!res) { // betting: the 6 models pose in a line, gently swaying; the leaderboard shows the odds
        for (m = 0; m < 6; m++) {
          var sw = Math.sin(t * 1.3 + m * 1.1);
          var x0 = 107 + m * 29.2, y0 = 162 + (m % 2) * 8;
          if (e >= 0 && R) { var k0 = eio(seg(e, 0, 1.6)); x0 = lerp(x0, backX(m), k0); y0 = lerp(y0, 70, k0); }
          pos[m] = [x0, y0, (e >= 0 ? lerp(.74, .44, eio(seg(e, 0, 1.6))) : .74), sw * 2];
        }
        for (m = 0; m < 6; m++) { sa(c.vals[m], 'class', 'cw-val'); txt(c.vals[m], c.oddTxt(odds[String(m)])); sa(c.leads[m], 'opacity', '0'); rowCls(c.rows[m], false, false, false); }
        c.cardT.forEach(function (x) { txt(x, '–'); }); c.cards.forEach(function (x) { sa(x, 'transform', ''); });
        c.crowns.forEach(function (x) { sa(x, 'opacity', '0'); });
        txt(c.big, R && e < 0 ? mmss(R.close - t) : ''); sa(c.big, 'class', 'cw-big' + (R && R.close - t <= 10 ? ' warn' : ''));
        c.cf.forEach(function (x) { sa(x, 'opacity', '0'); });
        // draw order: lower on screen = in front
        for (m = 0; m < 6; m++) { sa(c.models[m], 'transform', tr(pos[m][0], pos[m][1], pos[m][2], pos[m][3])); sa(c.models[m], 'opacity', '1'); cwFrame(c, m, 16 + (Math.sin(t * 0.7 + m * 2) > 0.6 ? 1 : 0)); }
        return;
      }
      var q = res.q || [0, 1, 2, 3, 4, 5], s = res.s || [], n = +res.n;
      var tot = function (mm) { var a = s[mm] || [0, 0, 0]; return a[0] + a[1] + a[2]; };
      // who walks now
      var slot = Math.floor((e - CW_W0) / CW_SLOT), u = e - CW_W0 - slot * CW_SLOT, walker = slot >= 0 && slot < 6 ? q[slot] : -1;
      for (m = 0; m < 6; m++) pos[m] = [backX(m), 70, .44, Math.sin(t * 1.3 + m) * 1.5];
      if (walker >= 0) {
        var lx = backX(walker), x, y, sc, rot = 0, step = Math.sin(u * Math.PI * 3.2);
        if (u < 1.1) { var a = eio(u / 1.1); x = lerp(lx, 180, a); y = lerp(70, 78, a); sc = .44; }
        else if (u < 4.5) { var b = eio((u - 1.1) / 3.4); x = 180 + step * 2.2; y = lerp(78, 200, b); sc = lerp(.46, 1.12, b); rot = step * 3; }
        else if (u < 7.3) { x = 180; y = 200; sc = 1.12; rot = Math.sin((u - 4.5) * 2) * 4; }
        else if (u < 9.8) { var d = eio((u - 7.3) / 2.5); x = 180 + step * 2; y = lerp(200, 78, d); sc = lerp(1.12, .46, d); rot = step * 3; }
        else { var f = eio((u - 9.8) / 0.6); x = lerp(180, lx, f); y = lerp(78, 70, f); sc = .44; }
        pos[walker] = [x, y, sc, rot];
      }
      // crowning: the winner comes back to the front, the crown drops
      var crownK = 0, cw = 1;
      if (e >= CW_W0 + 6 * CW_SLOT) {
        var ce = e - (CW_W0 + 6 * CW_SLOT); cw = eio(ce / 2.6);
        pos[n] = [lerp(backX(n), 180, cw), lerp(70, 196, cw), lerp(.44, 1.2, cw), Math.sin(t * 2) * 2];
        crownK = seg(ce, 2.6, 3.8);
      }
      // judges' cards for the walker (or the winner at the crowning)
      var cardM = walker, cu = u;
      if (walker >= 0 && u >= 4.9) {
        for (k = 0; k < 3; k++) { var fk = seg(u, 4.9 + k * .6, 5.25 + k * .6); sa(c.cards[k], 'transform', 'translate(9 3) scale(1 ' + Math.max(.02, fk).toFixed(2) + ') translate(-9 -3)'); txt(c.cardT[k], fk > 0 ? sc1((s[walker] || [0, 0, 0])[k]) : '–'); }
      } else if (walker < 0 && e >= CW_W0 + 6 * CW_SLOT) {
        for (k = 0; k < 3; k++) { sa(c.cards[k], 'transform', ''); txt(c.cardT[k], sc1((s[n] || [0, 0, 0])[k])); }
      } else { c.cards.forEach(function (x) { sa(x, 'transform', ''); }); c.cardT.forEach(function (x) { txt(x, '–'); }); }
      // leaderboard: totals appear after the judges; the leader wears a small crown
      var best = -1, bestV = -1, done = 0;
      for (k = 0; k < 6; k++) {
        var mm2 = q[k], shown = e >= CW_W0 + k * CW_SLOT + 6.6;
        if (shown) { done++; txt(c.vals[mm2], sc1(tot(mm2))); sa(c.vals[mm2], 'class', 'cw-val sc'); if (tot(mm2) > bestV) { bestV = tot(mm2); best = mm2; } }
        else { txt(c.vals[mm2], c.oddTxt(odds[String(mm2)])); sa(c.vals[mm2], 'class', 'cw-val'); }
      }
      var revd = e >= 70;
      for (m = 0; m < 6; m++) { sa(c.leads[m], 'opacity', m === best ? '1' : '0'); rowCls(c.rows[m], m === best, m === walker, revd && m === n); }
      for (m = 0; m < 6; m++) {
        sa(c.models[m], 'transform', tr(pos[m][0], pos[m][1], pos[m][2], pos[m][3])); sa(c.models[m], 'opacity', (crownK > 0 || revd) && m !== n ? '.45' : '1');
        var fi = 16, wph = Math.floor(((u * 1.6) % 1 + 1) % 1 * 8);
        if (m === walker) fi = u < 1.1 || (u >= 1.1 && u < 4.5) ? wph : u < 7.3 ? 16 + (u > 5.6 && u < 6.6 ? 1 : 0) : u < 9.8 ? 8 + wph : wph;
        else if (e >= CW_W0 + 6 * CW_SLOT && m === n && cw < 1) fi = Math.floor(((e * 1.6) % 1) * 8);
        cwFrame(c, m, fi);
      }
      c.crowns.forEach(function (x, j) { sa(x, 'opacity', j === n && crownK > 0 ? '1' : '0'); sa(x, 'transform', 'translate(0 ' + (j === n ? lerp(-130, -79, eo(crownK)) : -79).toFixed(1) + ')'); });
      txt(c.big, revd ? c.oddTxt(odds[String(n)]) : ''); sa(c.big, 'class', 'cw-big odd');
      // confetti at the crowning
      var ct = e - (CW_W0 + 6 * CW_SLOT + 3.4);
      c.cf.forEach(function (x, j) {
        if (ct < 0 || ct > 7) { sa(x, 'opacity', '0'); return; }
        var vx = (hr(i, j) - .5) * 160, vy = -60 - hr(i, j + 40) * 70, cx = 180 + vx * ct * .6, cy = 110 + vy * ct + 55 * ct * ct;
        sa(x, 'opacity', (cy > 240 ? 0 : 1).toString()); sa(x, 'transform', 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') rotate(' + ((ct * 300 + j * 40) % 360).toFixed(0) + ')');
      });
    }
  });

  /* ======================================================= 2. STAR FLEETS ======================================================= */
  var FL_V = 8.6, FL_0 = 2; // a volley every 8.6 s
  function flShip(gold, uid, big) {
    var a = gold ? ['#FFF3C4', '#F59E0B', '#92400E'] : ['#EDE9FE', '#8B5CF6', '#3B0764'], id = 'fls' + (gold ? 'g' : 'v') + uid + (big ? 'b' : '');
    return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a[0] + '"/><stop offset=".5" stop-color="' + a[1] + '"/><stop offset="1" stop-color="' + a[2] + '"/></linearGradient></defs>' +
      '<path class="fl-fire" d="M-11-3.5L-21 0L-11 3.5z" fill="' + (gold ? '#FDBA74' : '#C4B5FD') + '"/>' +
      '<path d="M15 0L-6-11L-11-11L-7-3.5L-11 0L-7 3.5L-11 11L-6 11z" fill="url(#' + id + ')" stroke="' + a[0] + '" stroke-opacity=".6" stroke-width=".6"/>' +
      '<ellipse cx="3" cy="0" rx="4.2" ry="2.2" fill="#E0F2FE"/><ellipse cx="2" cy="-.8" rx="1.8" ry=".8" fill="#fff"/>';
  }
  function flIcon(gold) { return '<svg viewBox="-24 -14 48 28" aria-hidden="true"><g' + (gold ? '' : ' transform="scale(-1 1)"') + '>' + flShip(gold, 'i' + (++GID)) + '</g></svg>'; }
  function flPlan(res, i) { // which ship dies at each volley (the same on every phone)
    var alive = [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]], plan = [];
    (res.h || []).forEach(function (hit, v) { var side = hit ? 1 : 0, al = alive[side], j = Math.floor(hr(i, v + 11) * al.length); plan.push({ side: side, ship: al[j], from: Math.floor(hr(i, v + 31) * 5) }); al.splice(j, 1); });
    return plan;
  }
  live('fleets', {
    beat: function (e) { return e < FL_0 ? -1 : Math.floor((e - FL_0) / FL_V); }, // v2832 : chaque volée
    SHOW: 46, lab: 'fl', odds0: { g: 1.88, v: 1.88, s5: 30.08, s4: 6.01, s3: 3, s2: 3, s1: 6.01, s0: 30.08 },
    rules: {
      en: '🔴 LIVE: a new battle every 180 s, the same for everyone.\n1. Bet on the winning fleet, Gold or Violet (×1.88), or on the exact score: 3–2 ×3.00 · 4–1 ×6.01 · 5–0 ×30.08.\n2. Set your stake and tap “Place bet” before bets close. One bet per round.\n3. 5 volleys: each volley destroys one ship. The fleet that wins the most volleys wins the battle.',
      fr: '🔴 EN DIRECT : une bataille toutes les 180 s, la même pour tout le monde.\n1. Parie sur la flotte gagnante, Or ou Violette (×1,88), ou sur le score exact : 3–2 ×3,00 · 4–1 ×6,01 · 5–0 ×30,08.\n2. Choisis ta mise et touche « Parier » avant la fermeture des paris. Un pari par tour.\n3. 5 salves : chaque salve détruit un vaisseau. La flotte qui gagne le plus de salves gagne la bataille.',
      es: '🔴 EN VIVO: una batalla cada 180 s, la misma para todos.\n1. Apuesta a la flota ganadora, Oro o Violeta (×1,88), o al marcador exacto: 3–2 ×3,00 · 4–1 ×6,01 · 5–0 ×30,08.\n2. Elige tu apuesta y toca «Apostar» antes del cierre. Una apuesta por ronda.\n3. 5 andanadas: cada una destruye una nave. La flota que gana más andanadas gana la batalla.',
      pt: '🔴 AO VIVO: uma batalha a cada 180 s, a mesma para todos.\n1. Aposte na frota vencedora, Ouro ou Violeta (×1,88), ou no placar exato: 3–2 ×3,00 · 4–1 ×6,01 · 5–0 ×30,08.\n2. Escolha o valor e toque em «Apostar» antes do fechamento. Uma aposta por rodada.\n3. 5 salvas: cada salva destrói uma nave. A frota que vence mais salvas vence a batalha.',
      ar: '🔴 مباشر: معركة كل 180 ثانية، نفسها للجميع.\n1. راهن على الأسطول الفائز، الذهبي أو البنفسجي (×1.88)، أو على النتيجة الدقيقة: 3–2 ×3.00 · 4–1 ×6.01 · 5–0 ×30.08.\n2. اختر مبلغ الرهان والمس «راهن» قبل إغلاق الرهانات. رهان واحد لكل جولة.\n3. 5 رشقات: كل رشقة تدمّر سفينة واحدة. الأسطول الذي يفوز بأكثر الرشقات يفوز بالمعركة.',
      tr: '🔴 CANLI: her 180 sn’de bir savaş, herkes için aynı.\n1. Kazanan filoya bahis yap, Altın ya da Mor (×1,88), veya kesin skora: 3–2 ×3,00 · 4–1 ×6,01 · 5–0 ×30,08.\n2. Tutarını seç ve bahisler kapanmadan “Bahis yap”a dokun. Her turda bir bahis.\n3. 5 atış: her atış bir gemiyi yok eder. En çok atışı kazanan filo savaşı kazanır.',
      vi: '🔴 TRỰC TIẾP: mỗi 180 giây một trận chiến, giống nhau cho mọi người.\n1. Cược hạm đội thắng, Vàng hoặc Tím (×1,88), hoặc tỷ số chính xác: 3–2 ×3,00 · 4–1 ×6,01 · 5–0 ×30,08.\n2. Chọn mức cược và chạm «Đặt cược» trước khi đóng cược. Mỗi vòng một cược.\n3. 5 loạt bắn: mỗi loạt phá hủy một tàu. Hạm đội thắng nhiều loạt hơn sẽ thắng trận.',
      id: '🔴 LANGSUNG: satu pertempuran tiap 180 dtk, sama untuk semua.\n1. Pasang pada armada pemenang, Emas atau Ungu (×1,88), atau skor tepat: 3–2 ×3,00 · 4–1 ×6,01 · 5–0 ×30,08.\n2. Atur taruhan lalu sentuh «Pasang» sebelum taruhan ditutup. Satu taruhan per ronde.\n3. 5 tembakan: setiap tembakan menghancurkan satu kapal. Armada yang memenangkan tembakan terbanyak memenangkan pertempuran.',
      ru: '🔴 В ПРЯМОМ ЭФИРЕ: битва каждые 180 с, общая для всех.\n1. Ставьте на флот-победитель, Золотой или Фиолетовый (×1,88), или на точный счёт: 3–2 ×3,00 · 4–1 ×6,01 · 5–0 ×30,08.\n2. Выберите сумму и нажмите «Поставить» до закрытия ставок. Одна ставка за раунд.\n3. 5 залпов: каждый залп уничтожает один корабль. Флот, выигравший больше залпов, выигрывает битву.',
      de: '🔴 LIVE: alle 180 s eine Schlacht, für alle gleich.\n1. Setze auf die siegreiche Flotte, Gold oder Violett (×1,88), oder auf das genaue Ergebnis: 3–2 ×3,00 · 4–1 ×6,01 · 5–0 ×30,08.\n2. Wähle deinen Einsatz und tippe auf „Setzen“, bevor die Einsätze schließen. Ein Einsatz pro Runde.\n3. 5 Salven: jede Salve zerstört ein Schiff. Die Flotte, die mehr Salven gewinnt, gewinnt die Schlacht.',
      hi: '🔴 लाइव: हर 180 सेकंड में एक लड़ाई, सबके लिए एक जैसी।\n1. जीतने वाले बेड़े पर दांव लगाएं, गोल्ड या वायलेट (×1.88), या सटीक स्कोर पर: 3–2 ×3.00 · 4–1 ×6.01 · 5–0 ×30.08।\n2. राशि चुनें और दांव बंद होने से पहले «दांव लगाएं» छुएं। हर राउंड में एक दांव।\n3. 5 वॉली: हर वॉली एक जहाज़ नष्ट करती है। ज़्यादा वॉली जीतने वाला बेड़ा लड़ाई जीतता है।',
      zh: '🔴 直播：每 180 秒一场战斗，所有人同一结果。\n1. 押注获胜舰队，金色或紫色（×1.88），或押确切比分：3–2 ×3.00 · 4–1 ×6.01 · 5–0 ×30.08。\n2. 设定金额，在停止下注前点击“下注”。每局一注。\n3. 共 5 轮齐射：每轮摧毁一艘战舰。赢得更多齐射的舰队赢得战斗。'
    },
    scene: function (uid) {
      var ships = '';
      for (var j = 0; j < 5; j++) ships += '<g class="fl-s g" transform="translate(46 ' + (44 + j * 38) + ')"><circle class="fl-sh" r="17"/>' + flShip(true, uid) + '</g>';
      for (j = 0; j < 5; j++) ships += '<g class="fl-s v" transform="translate(314 ' + (44 + j * 38) + ')"><circle class="fl-sh" r="17"/><g transform="scale(-1 1)">' + flShip(false, uid) + '</g></g>';
      var bolts = ''; for (j = 0; j < 9; j++) bolts += '<line class="fl-b" x1="0" y1="0" x2="0" y2="0" opacity="0"/><circle class="fl-hit" r="16" opacity="0"/>';
      var dots = ''; for (j = 0; j < 5; j++) dots += '<circle class="fl-d" cx="' + (156 + j * 12) + '" cy="58" r="3.6"/>';
      return '<defs><radialGradient id="flA' + uid + '" cx="20%" cy="50%" r="60%"><stop offset="0" stop-color="#F59E0B" stop-opacity=".28"/><stop offset="1" stop-color="#F59E0B" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="flB' + uid + '" cx="80%" cy="50%" r="60%"><stop offset="0" stop-color="#8B5CF6" stop-opacity=".34"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="flX' + uid + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#FDE68A"/><stop offset=".7" stop-color="#F97316" stop-opacity=".7"/><stop offset="1" stop-color="#F97316" stop-opacity="0"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#060818"/><rect x="-300" y="-300" width="960" height="830" fill="url(#flA' + uid + ')"/><rect x="-300" y="-300" width="960" height="830" fill="url(#flB' + uid + ')"/>' +
        '<g class="fl-stars" fill="#fff" opacity=".65">' + STARS(70, 440, 300, 5) + '</g>' +
        '<path d="M180 70V226" stroke="#fff" stroke-opacity=".08" stroke-dasharray="3 6"/>' +
        '<g class="fl-hud"><rect x="128" y="10" width="104" height="58" rx="14" fill="#0B0E26" fill-opacity=".8" stroke="#fff" stroke-opacity=".12"/>' +
        '<text class="fl-sg" x="158" y="43" text-anchor="middle">0</text><text class="fl-sc" x="180" y="41" text-anchor="middle">:</text><text class="fl-sv" x="202" y="43" text-anchor="middle">0</text>' +
        '<text class="fl-cd" x="180" y="44" text-anchor="middle"></text>' + dots + '</g>' +
        ships + bolts + '<circle class="fl-x" r="20" fill="url(#flX' + uid + ')" opacity="0"/><text class="fl-big" x="180" y="146" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) {
      var sc = ['s5', 's4', 's3', 's2', 's1', 's0'].map(function (s) { var g = +s.slice(1); return '<button type="button" class="fl-ex" data-s="' + s + '"><span class="fl-scl"><i class="cg">' + g + '</i>–<i class="cv">' + (5 - g) + '</i></span><b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; }).join('');
      return '<div class="fl-row1"><button type="button" class="fl-w g" data-s="g">' + flIcon(true) + '<b class="fit" data-o="g">' + oddTxt(o.g) + '</b></button><button type="button" class="fl-w v" data-s="v"><b class="fit" data-o="v">' + oddTxt(o.v) + '</b>' + flIcon(false) + '</button></div><div class="fl-row2">' + sc + '</div>';
    },
    hist: function (n) { return '<span class="fl-h ' + (n >= 3 ? 'g' : 'v') + '"><i class="cg">' + n + '</i>–<i class="cv">' + (5 - n) + '</i></span>'; },
    wins: function (res) { return [res.n >= 3 ? 'g' : 'v', 's' + res.n]; },
    init: function (c) {
      c.ships = [[].slice.call(c.box.querySelectorAll('.fl-s.g')), [].slice.call(c.box.querySelectorAll('.fl-s.v'))];
      c.bolts = [].slice.call(c.box.querySelectorAll('.fl-b')); c.hits = [].slice.call(c.box.querySelectorAll('.fl-hit'));
      c.x = c.box.querySelector('.fl-x'); c.sg = c.box.querySelector('.fl-sg'); c.sv = c.box.querySelector('.fl-sv'); c.sc = c.box.querySelector('.fl-sc');
      c.cd = c.box.querySelector('.fl-cd'); c.dots = [].slice.call(c.box.querySelectorAll('.fl-d')); c.big = c.box.querySelector('.fl-big');
      c.home = function (side, j) { return [side ? 314 : 46, 44 + j * 38]; };
    },
    frame: function (c, R, t, e, res, odds) {
      var i = R ? R.i : 0, side, j;
      var bob = function (side, j) { var h = c.home(side, j); return [h[0] + Math.sin(t * 1.1 + j + side * 2) * 2.5, h[1] + Math.sin(t * 1.7 + j * 1.3 + side) * 2.2]; };
      if (!res) {
        for (side = 0; side < 2; side++) for (j = 0; j < 5; j++) { var p = bob(side, j); sa(c.ships[side][j], 'transform', tr(p[0], p[1])); sa(c.ships[side][j], 'opacity', '1'); sa(c.ships[side][j], 'class', 'fl-s ' + (side ? 'v' : 'g')); }
        c.bolts.forEach(function (b) { sa(b, 'opacity', '0'); }); c.hits.forEach(function (b) { sa(b, 'opacity', '0'); }); sa(c.x, 'opacity', '0');
        var cdOn = !!R && e < 0;
        txt(c.cd, cdOn ? mmss(R.close - t) : ''); sa(c.cd, 'class', 'fl-cd' + (cdOn && R.close - t <= 10 ? ' warn' : ''));
        [c.sg, c.sv, c.sc].forEach(function (x) { sa(x, 'opacity', cdOn ? '0' : '1'); }); txt(c.sg, '0'); txt(c.sv, '0');
        c.dots.forEach(function (d) { sa(d, 'class', 'fl-d'); }); txt(c.big, '');
        return;
      }
      txt(c.cd, ''); [c.sg, c.sv, c.sc].forEach(function (x) { sa(x, 'opacity', '1'); });
      var plan = flPlan(res, i), v = Math.floor((e - FL_0) / FL_V), u = e - FL_0 - v * FL_V, gs = 0, vs = 0, dead = [[], []];
      for (var k = 0; k < 5; k++) {
        var tk = FL_0 + k * FL_V + 6.55;
        if (e >= tk) { if (plan[k].side) gs++; else vs++; }
        if (e >= tk + .7) dead[plan[k].side].push(plan[k].ship);
        sa(c.dots[k], 'class', 'fl-d' + (e >= tk ? (plan[k].side ? ' g' : ' v') : (k === v && v < 5 ? ' now' : '')));
      }
      txt(c.sg, String(gs)); txt(c.sv, String(vs));
      for (side = 0; side < 2; side++) for (j = 0; j < 5; j++) {
        var pp = bob(side, j), isDead = dead[side].indexOf(j) >= 0, el = c.ships[side][j];
        sa(el, 'transform', tr(pp[0], pp[1])); sa(el, 'opacity', isDead ? '.12' : '1');
        var winSide = e >= 46 ? (res.n >= 3 ? 0 : 1) : -1;
        sa(el, 'class', 'fl-s ' + (side ? 'v' : 'g') + (winSide === side && !isDead ? ' won' : ''));
      }
      // bolts of the current volley: both fleets fire, shields flash, then the decisive shot
      var cur = v >= 0 && v < 5 ? plan[v] : null;
      for (var b = 0; b < 9; b++) {
        var bl = c.bolts[b], hit = c.hits[b];
        if (!cur) { sa(bl, 'opacity', '0'); sa(hit, 'opacity', '0'); continue; }
        var dec = b === 8, s0 = dec ? 1 - cur.side : (b % 2), tb = dec ? 5.95 : 1.3 + b * .55, dur = dec ? .6 : .5, pr = (u - tb) / dur;
        var aliveF = function (sd) { var r = []; for (var q = 0; q < 5; q++) if (dead[sd].indexOf(q) < 0) r.push(q); return r; };
        var fromL = aliveF(s0), toL = aliveF(1 - s0);
        if (!fromL.length || !toL.length) { sa(bl, 'opacity', '0'); sa(hit, 'opacity', '0'); continue; }
        var fj = fromL[Math.floor(hr(i, v * 20 + b) * fromL.length)], tj = dec ? cur.ship : toL[Math.floor(hr(i, v * 20 + b + 9) * toL.length)];
        var A = bob(s0, fj), B = bob(1 - s0, tj);
        if (pr >= 0 && pr <= 1) {
          var h0 = Math.max(0, pr - (dec ? .35 : .22)), x1 = lerp(A[0], B[0], h0), y1 = lerp(A[1], B[1], h0), x2 = lerp(A[0], B[0], pr), y2 = lerp(A[1], B[1], pr);
          sa(bl, 'x1', x1.toFixed(1)); sa(bl, 'y1', y1.toFixed(1)); sa(bl, 'x2', x2.toFixed(1)); sa(bl, 'y2', y2.toFixed(1));
          sa(bl, 'class', 'fl-b ' + (s0 ? 'v' : 'g') + (dec ? ' dec' : '')); sa(bl, 'opacity', '1');
        } else sa(bl, 'opacity', '0');
        if (!dec && pr > 1 && pr < 2.2) { sa(hit, 'transform', tr(B[0], B[1])); sa(hit, 'class', 'fl-hit ' + (s0 ? 'g' : 'v')); sa(hit, 'opacity', (1 - (pr - 1) / 1.2).toFixed(2)); }
        else sa(hit, 'opacity', '0');
      }
      if (cur && u >= 6.55 && u < 7.9) { var X = bob(cur.side, cur.ship), xk = (u - 6.55) / 1.35; sa(c.x, 'transform', tr(X[0], X[1], .4 + xk * 1.4)); sa(c.x, 'opacity', (1 - xk).toFixed(2)); }
      else sa(c.x, 'opacity', '0');
      txt(c.big, e >= 46 ? c.oddTxt(odds['s' + res.n]) : '');
      sa(c.big, 'class', 'fl-big ' + (res.n >= 3 ? 'g' : 'v'));
    }
  });

  /* ======================================================= 3. GEM COUNT (fan-tan) =============================================== */
  var GC_COL = [['#FFE4E6', '#F43F5E', '#881337'], ['#D1FAE5', '#10B981', '#065F46'], ['#DBEAFE', '#3B82F6', '#1E3A8A'], ['#F3E8FF', '#A855F7', '#581C87'], ['#FEF3C7', '#F59E0B', '#92400E']];
  var GC_GEM = 'M0-6.2L5.4-2.4L3.4 5H-3.4L-5.4-2.4Z';
  function gcGem(ci, uid, r) {
    return '<path d="' + GC_GEM + '" fill="url(#gcg' + uid + '_' + ci + ')" stroke="' + GC_COL[ci][0] + '" stroke-opacity=".7" stroke-width=".5"' + (r ? ' transform="scale(' + r + ')"' : '') + '/>' +
      '<path d="M-5.4-2.4H5.4M-2-2.4L0 5L2-2.4M0-6.2L-2-2.4M0-6.2L2-2.4" stroke="#fff" stroke-opacity=".35" stroke-width=".45" fill="none"' + (r ? ' transform="scale(' + r + ')"' : '') + '/>';
  }
  function gcDefs(uid) { return GC_COL.map(function (c, k) { return '<linearGradient id="gcg' + uid + '_' + k + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".5" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient>'; }).join(''); }
  function gcPips(n) { var s = '<svg viewBox="-13 -9 26 18" aria-hidden="true">', u = 'p' + (++GID), P = [[0, 0], [-5, 0, 5, 0], [-6, 3, 0, -4, 6, 3], [-5, -4, 5, -4, -5, 4, 5, 4]][n - 1]; s += '<defs>' + gcDefs(u) + '</defs>'; for (var k = 0; k < P.length; k += 2) s += '<g transform="translate(' + P[k] + ' ' + P[k + 1] + ') scale(.62)">' + gcGem((n + k) % 5, u) + '</g>'; return s + '</svg>'; }
  var GC_X = 160, GC_Y = 136, GC_T0 = 3, GC_T1 = 33;
  function gcLayout(i, k) { // gem positions in the pile + removal order (rake comes from the right)
    var P = [];
    for (var j = 0; j < k; j++) { var a = hr(i, j * 3 + 1) * Math.PI * 2, r = Math.sqrt(hr(i, j * 3 + 2)); P.push([GC_X + Math.cos(a) * r * 64, GC_Y + Math.sin(a) * r * 34, Math.floor(hr(i, j * 3 + 3) * 5)]); }
    var ord = P.map(function (p, j) { return j; }).sort(function (a, b) { return P[b][0] - P[a][0]; });
    return { P: P, ord: ord };
  }
  function gcTimes(G) { // groups slow down towards the end (suspense)
    var w = [], sum = 0, g; for (g = 0; g < G; g++) { w.push(1 + 1.6 * Math.pow(g / Math.max(1, G - 1), 2.2)); sum += w[g]; }
    var st = [], acc = GC_T0; for (g = 0; g < G; g++) { var d = (GC_T1 - GC_T0) * w[g] / sum; st.push([acc, d]); acc += d; }
    return st;
  }
  function gcSlot(g) { return [302 + (g % 3) * 20, 40 + Math.floor(g / 3) * 34]; }
  live('gemcount', {
    beat: function (e, res) { var T = gcTimes((+res.k - +res.n) / 4), n = 0; for (var j = 0; j < T.length; j++) if (T[j][0] <= e) n++; return n || -1; }, // v2832 : chaque poignée de gemmes retirée
    SHOW: 36, lab: 'gc', odds0: { '1': 3.76, '2': 3.76, '3': 3.76, '4': 3.76, odd: 1.88, even: 1.88 },
    rules: {
      en: '🔴 LIVE: a new count every 170 s, the same for everyone.\n1. A pile of gems is hidden under the dome. Guess how many will be left at the end: 1, 2, 3 or 4 (×3.76), or Odd / Even (×1.88).\n2. Set your stake and tap “Place bet” before bets close. One bet per round.\n3. The dome lifts and the gems are removed 4 by 4: the last 1 to 4 gems decide.',
      fr: '🔴 EN DIRECT : un comptage toutes les 170 s, le même pour tout le monde.\n1. Un tas de gemmes est caché sous la cloche. Devine combien il en restera à la fin : 1, 2, 3 ou 4 (×3,76), ou Impair / Pair (×1,88).\n2. Choisis ta mise et touche « Parier » avant la fermeture des paris. Un pari par tour.\n3. La cloche se lève et les gemmes sont retirées 4 par 4 : les 1 à 4 dernières décident.',
      es: '🔴 EN VIVO: un conteo cada 170 s, el mismo para todos.\n1. Un montón de gemas está oculto bajo la campana. Adivina cuántas quedarán al final: 1, 2, 3 o 4 (×3,76), o Impar / Par (×1,88).\n2. Elige tu apuesta y toca «Apostar» antes del cierre. Una apuesta por ronda.\n3. La campana se levanta y las gemas se retiran de 4 en 4: las últimas 1 a 4 deciden.',
      pt: '🔴 AO VIVO: uma contagem a cada 170 s, a mesma para todos.\n1. Um monte de gemas está escondido sob a cúpula. Adivinhe quantas sobrarão no fim: 1, 2, 3 ou 4 (×3,76), ou Ímpar / Par (×1,88).\n2. Escolha o valor e toque em «Apostar» antes do fechamento. Uma aposta por rodada.\n3. A cúpula sobe e as gemas são retiradas de 4 em 4: as últimas 1 a 4 decidem.',
      ar: '🔴 مباشر: عدّ جديد كل 170 ثانية، نفسه للجميع.\n1. كومة من الجواهر مخفية تحت القبة. خمّن كم سيتبقى في النهاية: 1 أو 2 أو 3 أو 4 (×3.76)، أو فردي / زوجي (×1.88).\n2. اختر مبلغ الرهان والمس «راهن» قبل إغلاق الرهانات. رهان واحد لكل جولة.\n3. ترتفع القبة وتُزال الجواهر 4 بـ 4: آخر 1 إلى 4 جواهر تحسم النتيجة.',
      tr: '🔴 CANLI: her 170 sn’de bir sayım, herkes için aynı.\n1. Kubbenin altında bir yığın mücevher saklı. Sonunda kaç tane kalacağını tahmin et: 1, 2, 3 veya 4 (×3,76), ya da Tek / Çift (×1,88).\n2. Tutarını seç ve bahisler kapanmadan “Bahis yap”a dokun. Her turda bir bahis.\n3. Kubbe kalkar ve mücevherler 4’er 4’er alınır: son 1 ila 4 mücevher sonucu belirler.',
      vi: '🔴 TRỰC TIẾP: mỗi 170 giây một lần đếm, giống nhau cho mọi người.\n1. Một đống đá quý được giấu dưới chuông. Đoán còn lại bao nhiêu viên cuối cùng: 1, 2, 3 hay 4 (×3,76), hoặc Lẻ / Chẵn (×1,88).\n2. Chọn mức cược và chạm «Đặt cược» trước khi đóng cược. Mỗi vòng một cược.\n3. Chuông nhấc lên và đá quý được lấy ra từng 4 viên: 1 đến 4 viên cuối cùng quyết định.',
      id: '🔴 LANGSUNG: satu hitungan tiap 170 dtk, sama untuk semua.\n1. Setumpuk permata disembunyikan di bawah kubah. Tebak berapa yang tersisa di akhir: 1, 2, 3 atau 4 (×3,76), atau Ganjil / Genap (×1,88).\n2. Atur taruhan lalu sentuh «Pasang» sebelum taruhan ditutup. Satu taruhan per ronde.\n3. Kubah terangkat dan permata diambil 4 demi 4: 1 sampai 4 permata terakhir menentukan.',
      ru: '🔴 В ПРЯМОМ ЭФИРЕ: подсчёт каждые 170 с, общий для всех.\n1. Под колпаком спрятана горка камней. Угадайте, сколько останется в конце: 1, 2, 3 или 4 (×3,76), или Нечёт / Чёт (×1,88).\n2. Выберите сумму и нажмите «Поставить» до закрытия ставок. Одна ставка за раунд.\n3. Колпак поднимается, камни убирают по 4: решают последние 1–4 камня.',
      de: '🔴 LIVE: alle 170 s eine Zählung, für alle gleich.\n1. Unter der Glocke liegt ein Haufen Edelsteine. Rate, wie viele am Ende übrig bleiben: 1, 2, 3 oder 4 (×3,76), oder Ungerade / Gerade (×1,88).\n2. Wähle deinen Einsatz und tippe auf „Setzen“, bevor die Einsätze schließen. Ein Einsatz pro Runde.\n3. Die Glocke hebt sich und die Steine werden in Vierergruppen entfernt: die letzten 1 bis 4 entscheiden.',
      hi: '🔴 लाइव: हर 170 सेकंड में एक गिनती, सबके लिए एक जैसी।\n1. गुंबद के नीचे रत्नों का ढेर छिपा है। अंदाज़ा लगाएं अंत में कितने बचेंगे: 1, 2, 3 या 4 (×3.76), या विषम / सम (×1.88)।\n2. राशि चुनें और दांव बंद होने से पहले «दांव लगाएं» छुएं। हर राउंड में एक दांव।\n3. गुंबद उठता है और रत्न 4-4 करके हटाए जाते हैं: आख़िरी 1 से 4 रत्न फ़ैसला करते हैं।',
      zh: '🔴 直播：每 170 秒数一次，所有人同一结果。\n1. 一堆宝石藏在罩子下。猜最后剩几颗：1、2、3 或 4（×3.76），或 单 / 双（×1.88）。\n2. 设定金额，在停止下注前点击“下注”。每局一注。\n3. 罩子揭开，宝石每次移走 4 颗：最后剩下的 1 到 4 颗决定结果。'
    },
    scene: function (uid) {
      var gems = ''; for (var j = 0; j < 63; j++) gems += '<g class="gc-g" opacity="0">' + gcGem(j % 5, uid) + '</g>';
      var slots = ''; for (var g = 0; g < 15; g++) { var s = gcSlot(g); slots += '<rect x="' + (s[0] - 9) + '" y="' + (s[1] - 14) + '" width="18" height="28" rx="5" class="gc-slot"/>'; }
      return '<defs>' + gcDefs(uid) + '<radialGradient id="gcV' + uid + '" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#1E5A8C"/><stop offset=".65" stop-color="#0E2D57"/><stop offset="1" stop-color="#081A36"/></radialGradient>' +
        '<linearGradient id="gcD' + uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF7D6"/><stop offset=".35" stop-color="#FBBF24"/><stop offset=".75" stop-color="#B45309"/><stop offset="1" stop-color="#78350F"/></linearGradient>' +
        '<radialGradient id="gcL' + uid + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FDE68A" stop-opacity=".55"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#071127"/>' +
        '<ellipse cx="' + GC_X + '" cy="' + (GC_Y + 4) + '" rx="128" ry="80" fill="#000" opacity=".35"/>' +
        '<ellipse cx="' + GC_X + '" cy="' + GC_Y + '" rx="124" ry="76" fill="url(#gcV' + uid + ')" stroke="#FBBF24" stroke-opacity=".75" stroke-width="2.4"/>' +
        '<ellipse cx="' + GC_X + '" cy="' + GC_Y + '" rx="114" ry="68" fill="none" stroke="#FDE68A" stroke-opacity=".25" stroke-dasharray="2 4"/>' +
        '<rect x="288" y="22" width="68" height="190" rx="12" fill="#0B1E3F" stroke="#FBBF24" stroke-opacity=".5"/>' + slots +
        '<ellipse class="gc-glow" cx="' + GC_X + '" cy="' + GC_Y + '" rx="70" ry="40" fill="url(#gcL' + uid + ')" opacity="0"/>' +
        '<g class="gc-gems">' + gems + '</g>' +
        '<g class="gc-rake" opacity="0"><path d="M0 0H70" stroke="#B45309" stroke-width="3.2" stroke-linecap="round"/><path d="M0 0H70" stroke="#FDE68A" stroke-width="1.2" stroke-linecap="round"/><path d="M0-11V11" stroke="url(#gcD' + uid + ')" stroke-width="4.5" stroke-linecap="round"/></g>' +
        '<g class="gc-dome"><ellipse cx="' + GC_X + '" cy="' + (GC_Y + 22) + '" rx="84" ry="14" fill="#000" opacity=".3"/>' +
        '<path d="M' + (GC_X - 82) + ' ' + (GC_Y + 20) + 'Q' + (GC_X - 82) + ' ' + (GC_Y - 64) + ' ' + GC_X + ' ' + (GC_Y - 64) + 'Q' + (GC_X + 82) + ' ' + (GC_Y - 64) + ' ' + (GC_X + 82) + ' ' + (GC_Y + 20) + 'z" fill="url(#gcD' + uid + ')"/>' +
        '<path d="M' + (GC_X - 60) + ' ' + (GC_Y - 6) + 'Q' + (GC_X - 54) + ' ' + (GC_Y - 50) + ' ' + (GC_X - 10) + ' ' + (GC_Y - 56) + '" stroke="#fff" stroke-opacity=".55" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<rect x="' + (GC_X - 88) + '" y="' + (GC_Y + 16) + '" width="176" height="9" rx="4.5" fill="#92400E"/><circle cx="' + GC_X + '" cy="' + (GC_Y - 70) + '" r="8" fill="url(#gcD' + uid + ')"/>' +
        '<text class="gc-q" x="' + GC_X + '" y="' + (GC_Y - 2) + '" text-anchor="middle"></text></g>' +
        '<text class="gc-big" x="' + GC_X + '" y="' + (GC_Y - 44) + '" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) {
      return ['1', '2', '3', '4'].map(function (s) { return '<button type="button" data-s="' + s + '"><span class="gc-n">' + s + '</span>' + gcPips(+s) + '<b class="fit" data-o="' + s + '">' + oddTxt(o[s]) + '</b></button>'; }).join('') +
        '<button type="button" class="gc-oe" data-s="odd"><span class="fit">' + K.esc(l.odd) + '</span><b class="fit" data-o="odd">' + oddTxt(o.odd) + '</b></button>' +
        '<button type="button" class="gc-oe" data-s="even"><span class="fit">' + K.esc(l.even) + '</span><b class="fit" data-o="even">' + oddTxt(o.even) + '</b></button>';
    },
    hist: function (n) { return '<span class="gc-h ' + (n % 2 ? 'o' : 'e') + '">' + n + '</span>'; },
    wins: function (res) { return [String(res.n), res.n % 2 ? 'odd' : 'even']; },
    init: function (c) { c.gems = [].slice.call(c.box.querySelectorAll('.gc-g')); c.dome = c.box.querySelector('.gc-dome'); c.rake = c.box.querySelector('.gc-rake'); c.big = c.box.querySelector('.gc-big'); c.qm = c.box.querySelector('.gc-q'); c.glow = c.box.querySelector('.gc-glow'); c.lay = null; },
    frame: function (c, R, t, e, res) {
      var j;
      if (!res) {
        sa(c.dome, 'transform', 'translate(0 ' + (Math.sin(t * 1.4) * 1.2).toFixed(1) + ')'); sa(c.dome, 'opacity', '1');
        c.gems.forEach(function (g) { sa(g, 'opacity', '0'); }); sa(c.rake, 'opacity', '0'); sa(c.glow, 'opacity', '0');
        var cdOn = !!R && e < 0;
        txt(c.qm, cdOn ? mmss(R.close - t) : '?'); sa(c.qm, 'class', 'gc-q' + (cdOn && R.close - t <= 10 ? ' warn' : '')); txt(c.big, '');
        return;
      }
      var k = +res.k, n = +res.n, i = R.i, G = (k - n) / 4;
      if (!c.lay || c.lay.key !== i + ':' + k) { c.lay = gcLayout(i, k); c.lay.key = i + ':' + k; c.lay.T = gcTimes(G); }
      var P = c.lay.P, ord = c.lay.ord, TT = c.lay.T;
      var up = eio(seg(e, 0, 2.4));
      sa(c.dome, 'transform', 'translate(0 ' + (-up * 150).toFixed(1) + ')'); sa(c.dome, 'opacity', (1 - seg(e, 1.4, 2.4)).toFixed(2));
      txt(c.qm, '?'); sa(c.qm, 'class', 'gc-q');
      var where = {}; // gem index → [x, y, scale]
      var rake = null;
      for (var g = 0; g < G; g++) {
        var t0 = TT[g][0], d = TT[g][1], p = (e - t0) / d, grp = ord.slice(g * 4, g * 4 + 4), sl = gcSlot(g);
        var cx = 0, cy = 0; grp.forEach(function (q) { cx += P[q][0]; cy += P[q][1]; }); cx /= 4; cy /= 4;
        var minx = Math.min.apply(null, grp.map(function (q) { return P[q][0]; }));
        if (p >= 0 && p < 1) {
          if (p < .4) { var a = eio(p / .4); rake = [lerp(292, minx - 10, a), lerp(GC_Y, cy, a)]; }
          else { var b = eio((p - .4) / .6); rake = [lerp(minx - 10, sl[0] - 14, b), lerp(cy, sl[1], b)]; grp.forEach(function (q, z) { var ox = (z % 2 ? 4.5 : -4.5), oy = (z < 2 ? -6 : 6); where[q] = [lerp(P[q][0], sl[0] + ox, b), lerp(P[q][1], sl[1] + oy, b), lerp(1, .62, b)]; }); }
        } else if (p >= 1) grp.forEach(function (q, z) { where[q] = [sl[0] + (z % 2 ? 4.5 : -4.5), sl[1] + (z < 2 ? -6 : 6), .62]; });
      }
      // the last 1 to 4 gems line up and shine
      var fin = seg(e, GC_T1 + .4, GC_T1 + 1.8), rem = ord.slice(G * 4);
      rem.forEach(function (q, z) { var tx = GC_X + (z - (rem.length - 1) / 2) * 26; where[q] = [lerp(P[q][0], tx, eio(fin)), lerp(P[q][1], GC_Y, eio(fin)), lerp(1, 1.9, eio(fin))]; });
      for (j = 0; j < 63; j++) {
        var el = c.gems[j];
        if (j >= k) { sa(el, 'opacity', '0'); continue; }
        var w = where[j] || [P[j][0], P[j][1], 1];
        sa(el, 'opacity', '1'); sa(el, 'transform', tr(w[0], w[1], w[2]));
      }
      if (rake) { sa(c.rake, 'opacity', '1'); sa(c.rake, 'transform', tr(rake[0], rake[1])); } else if (e > 2.6 && e < GC_T1 + .3) { sa(c.rake, 'opacity', '1'); sa(c.rake, 'transform', tr(292, GC_Y)); } else sa(c.rake, 'opacity', '0');
      sa(c.glow, 'opacity', fin.toFixed(2));
      txt(c.big, e >= 36 ? String(n) : ''); sa(c.big, 'class', 'gc-big ' + (n % 2 ? 'o' : 'e'));
    }
  });

  /* ======================================================= 4. LUCKY CLAW ======================================================== */
  var CL_X = [96, 141, 186, 231, 276, 321], CL_HOME = 46, CL_FLOOR = 178, CL_TOP = 46;
  function clPrize(i, uid) {
    var id = 'clp' + uid + '_' + i, rg = function (a, b, c) { return '<defs><radialGradient id="' + id + '" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="' + a + '"/><stop offset=".6" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient></defs>'; }, f = 'url(#' + id + ')';
    if (i === 0) return rg('#F5D0A9', '#B7793F', '#6B3F1E') + '<ellipse cy="8" rx="12" ry="9" fill="' + f + '"/><circle cx="-9" cy="-12" r="5" fill="' + f + '"/><circle cx="9" cy="-12" r="5" fill="' + f + '"/><circle cx="-9" cy="-12" r="2.4" fill="#F5D0A9"/><circle cx="9" cy="-12" r="2.4" fill="#F5D0A9"/><circle cy="-4" r="11" fill="' + f + '"/><ellipse cy="0" rx="5" ry="3.6" fill="#F5D0A9"/><circle cx="-4" cy="-6" r="1.3" fill="#1F1308"/><circle cx="4" cy="-6" r="1.3" fill="#1F1308"/><ellipse cy="-1.4" rx="1.8" ry="1.2" fill="#1F1308"/><path d="M-5 9q5 3 10 0" stroke="#E11D48" stroke-width="2.2" fill="none"/>';
    if (i === 1) return rg('#FEF9C3', '#FACC15', '#A16207') + '<ellipse cy="7" rx="14" ry="10" fill="' + f + '"/><circle cx="-3" cy="-7" r="8.5" fill="' + f + '"/><path d="M4-7l9 1.5-9 3z" fill="#F97316"/><circle cx="-1" cy="-9" r="1.5" fill="#1F1308"/><path d="M-11 6q6 6 13 1" stroke="#CA8A04" stroke-width="1.4" fill="none"/>';
    if (i === 2) return rg('#F1F5F9', '#94A3B8', '#334155') + '<path d="M0-21v5" stroke="#94A3B8" stroke-width="1.6"/><circle cy="-21" r="2.2" fill="#F43F5E"/><rect x="-12" y="-16" width="24" height="17" rx="5" fill="' + f + '"/><rect x="-8.5" y="-12" width="17" height="7" rx="3.5" fill="#0F172A"/><circle cx="-4" cy="-8.5" r="2" fill="#22D3EE"/><circle cx="4" cy="-8.5" r="2" fill="#22D3EE"/><rect x="-10" y="3" width="20" height="15" rx="4" fill="' + f + '"/><path d="M-5 9h10M-5 13h10" stroke="#475569" stroke-width="1.4"/>';
    if (i === 3) return rg('#FFFFFF', '#E2E8F0', '#94A3B8') + '<path d="M-6 10l-6 8h6zM6 10l6 8h-6z" fill="#E11D48"/><path d="M0-21q9 9 7 31h-14q-2-22 7-31z" fill="' + f + '"/><path d="M0-21q4 4 5.6 9h-11.2q1.6-5 5.6-9z" fill="#E11D48"/><circle cy="-2" r="3.6" fill="#38BDF8" stroke="#0369A1" stroke-width="1.2"/><path d="M-3 10h6l-3 8z" fill="#FB923C"/>';
    if (i === 4) return rg('#FFF7D6', '#FBBF24', '#92400E') + '<path d="M-14 10l-3-18 9 8 8-13 8 13 9-8-3 18z" fill="' + f + '" stroke="#FDE68A" stroke-width=".8"/><rect x="-14" y="10" width="28" height="5" rx="2" fill="#B45309"/><circle cx="0" cy="3" r="2.6" fill="#E11D48"/><circle cx="-8" cy="5" r="1.8" fill="#22D3EE"/><circle cx="8" cy="5" r="1.8" fill="#22D3EE"/>';
    return rg('#ECFEFF', '#67E8F9', '#0E7490') + '<path d="M-15-6l7-9h16l7 9L0 17z" fill="' + f + '" stroke="#CFFAFE" stroke-width=".8"/><path d="M-15-6h30M-8-15L-4-6L0-15L4-6L8-15M-4-6L0 17L4-6" stroke="#fff" stroke-opacity=".55" stroke-width=".7" fill="none"/>';
  }
  function clMini(i) { return '<svg viewBox="-20 -23 40 44" aria-hidden="true">' + clPrize(i, 'm' + (++GID)) + '</svg>'; }
  // claw choreography: [time, x, y, open(0..1), holds: 'd' decoy / 'n' winner / '']
  var CL_K = [[0, CL_HOME, CL_TOP, 1, ''], [3.6, 'd', CL_TOP, 1, ''], [6.2, 'd', 150, 1, ''], [7.0, 'd', 150, 0, 'd'], [9.8, 'd', 64, 0, 'd'], [10.4, 'd', 64, 0, 'd'], [10.6, 'd', 64, .7, ''],
    [11.4, 'd', 64, 1, ''], [15.4, 'n', 64, 1, ''], [16.6, 'n', 64, 1, ''], [19.4, 'n', 150, 1, ''], [20.2, 'n', 150, 0, 'n'], [23.0, 'n', 60, 0, 'n'], [27.6, CL_HOME, 60, 0, 'n'], [28.4, CL_HOME, 60, 1, '']];
  live('claw', {
    beat: function (e) { var n = 0; for (var j = 1; j < CL_K.length; j++) if (CL_K[j][0] <= e) n++; return n || -1; }, // v2832 : chaque mouvement de la pince
    SHOW: 32, lab: 'cl', odds0: { '0': 3.13, '1': 3.91, '2': 5.22, '3': 7.23, '4': 10.44, '5': 15.66 },
    rules: {
      en: '🔴 LIVE: the claw plays every 165 s, the same for everyone.\n1. Pick one of the 6 prizes: each shows its payout (Teddy ×3.13 … Diamond ×15.66 — the rarer, the bigger).\n2. Set your stake and tap “Place bet” before bets close. One bet per round.\n3. The claw grabs one prize and drops it in the chute: if it is yours, you win stake × its payout.',
      fr: '🔴 EN DIRECT : la pince joue toutes les 165 s, la même pour tout le monde.\n1. Choisis un des 6 lots : chacun affiche son gain (Ourson ×3,13 … Diamant ×15,66 — plus il est rare, plus il paie).\n2. Choisis ta mise et touche « Parier » avant la fermeture des paris. Un pari par tour.\n3. La pince attrape un lot et le lâche dans la trappe : si c’est le tien, tu gagnes mise × son gain.',
      es: '🔴 EN VIVO: la garra juega cada 165 s, la misma para todos.\n1. Elige uno de los 6 premios: cada uno muestra su pago (Osito ×3,13 … Diamante ×15,66 — cuanto más raro, más paga).\n2. Elige tu apuesta y toca «Apostar» antes del cierre. Una apuesta por ronda.\n3. La garra atrapa un premio y lo suelta en la rampa: si es el tuyo, ganas apuesta × su pago.',
      pt: '🔴 AO VIVO: a garra joga a cada 165 s, a mesma para todos.\n1. Escolha um dos 6 prêmios: cada um mostra seu pagamento (Ursinho ×3,13 … Diamante ×15,66 — quanto mais raro, mais paga).\n2. Escolha o valor e toque em «Apostar» antes do fechamento. Uma aposta por rodada.\n3. A garra pega um prêmio e o solta na saída: se for o seu, você ganha aposta × o pagamento.',
      ar: '🔴 مباشر: المخلب يلعب كل 165 ثانية، نفسه للجميع.\n1. اختر إحدى الجوائز الست: تُظهر كل جائزة عائدها (الدبدوب ×3.13 … الماسة ×15.66 — كلما ندرت زاد عائدها).\n2. اختر مبلغ الرهان والمس «راهن» قبل إغلاق الرهانات. رهان واحد لكل جولة.\n3. يلتقط المخلب جائزة ويسقطها في الفتحة: إذا كانت جائزتك تربح الرهان × عائدها.',
      tr: '🔴 CANLI: pençe her 165 sn’de oynar, herkes için aynı.\n1. 6 ödülden birini seç: her biri ödemesini gösterir (Ayıcık ×3,13 … Elmas ×15,66 — ne kadar nadirse o kadar çok öder).\n2. Tutarını seç ve bahisler kapanmadan “Bahis yap”a dokun. Her turda bir bahis.\n3. Pençe bir ödülü kapar ve deliğe bırakır: seninkiyse bahis × ödemesini kazanırsın.',
      vi: '🔴 TRỰC TIẾP: máy gắp chơi mỗi 165 giây, giống nhau cho mọi người.\n1. Chọn một trong 6 món quà: mỗi món hiện tỷ lệ trả (Gấu bông ×3,13 … Kim cương ×15,66 — càng hiếm càng trả cao).\n2. Chọn mức cược và chạm «Đặt cược» trước khi đóng cược. Mỗi vòng một cược.\n3. Càng gắp một món và thả vào cửa: nếu là món của bạn, bạn thắng cược × tỷ lệ trả.',
      id: '🔴 LANGSUNG: capit bermain tiap 165 dtk, sama untuk semua.\n1. Pilih satu dari 6 hadiah: masing-masing menampilkan bayarannya (Boneka ×3,13 … Berlian ×15,66 — makin langka, makin besar).\n2. Atur taruhan lalu sentuh «Pasang» sebelum taruhan ditutup. Satu taruhan per ronde.\n3. Capit mengambil satu hadiah dan menjatuhkannya ke lubang: jika itu pilihanmu, kamu menang taruhan × bayarannya.',
      ru: '🔴 В ПРЯМОМ ЭФИРЕ: клешня играет каждые 165 с, общая для всех.\n1. Выберите один из 6 призов: у каждого своя выплата (Мишка ×3,13 … Бриллиант ×15,66 — чем реже, тем больше).\n2. Выберите сумму и нажмите «Поставить» до закрытия ставок. Одна ставка за раунд.\n3. Клешня хватает приз и бросает его в лоток: если он ваш, вы выигрываете ставку × его выплату.',
      de: '🔴 LIVE: der Greifer spielt alle 165 s, für alle gleich.\n1. Wähle einen der 6 Preise: jeder zeigt seine Auszahlung (Teddy ×3,13 … Diamant ×15,66 — je seltener, desto höher).\n2. Wähle deinen Einsatz und tippe auf „Setzen“, bevor die Einsätze schließen. Ein Einsatz pro Runde.\n3. Der Greifer schnappt einen Preis und lässt ihn in den Schacht fallen: Ist es deiner, gewinnst du Einsatz × Auszahlung.',
      hi: '🔴 लाइव: क्लॉ हर 165 सेकंड में खेलता है, सबके लिए एक जैसा।\n1. 6 इनामों में से एक चुनें: हर इनाम पर उसका भुगतान लिखा है (टेडी ×3.13 … हीरा ×15.66 — जितना दुर्लभ, उतना बड़ा)।\n2. राशि चुनें और दांव बंद होने से पहले «दांव लगाएं» छुएं। हर राउंड में एक दांव।\n3. क्लॉ एक इनाम उठाकर खांचे में गिराता है: अगर वह आपका है, तो आप दांव × उसका भुगतान जीतते हैं।',
      zh: '🔴 直播：抓娃娃机每 165 秒开抓一次，所有人同一结果。\n1. 从 6 个奖品中选一个：每个都标有赔率（小熊 ×3.13 … 钻石 ×15.66 — 越稀有赔率越高）。\n2. 设定金额，在停止下注前点击“下注”。每局一注。\n3. 爪子抓起一个奖品丢进出口：如果是你选的，即赢 投注 × 赔率。'
    },
    scene: function (uid) {
      var prizes = CL_X.map(function (x, k) { return '<g class="cl-p" data-s="' + k + '"><g class="cl-pi"><circle class="cl-halo" r="22"/>' + clPrize(k, uid) + '</g></g>'; }).join('');
      var tags = CL_X.map(function (x, k) { return '<g class="cl-tag" data-s="' + k + '" transform="translate(' + x + ' 209)"><rect x="-21" y="-8" width="42" height="16" rx="8"/><text y="4" text-anchor="middle" data-o="' + k + '">×–</text></g>'; }).join('');
      var bulbs = ''; for (var b = 0; b < 16; b++) bulbs += '<circle class="cl-bulb" cx="' + (30 + b * 20) + '" cy="9" r="2.1"/>';
      return '<defs><linearGradient id="clG' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B0B33"/><stop offset="1" stop-color="#3A0F45"/></linearGradient>' +
        '<linearGradient id="clM' + uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8FAFC"/><stop offset=".5" stop-color="#94A3B8"/><stop offset="1" stop-color="#334155"/></linearGradient>' +
        '<radialGradient id="clR' + uid + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FDE68A" stop-opacity=".8"/><stop offset="1" stop-color="#F472B6" stop-opacity="0"/></radialGradient></defs>' +
        '<rect x="-300" y="-300" width="960" height="830" fill="#12041F"/>' +
        '<rect x="14" y="2" width="332" height="226" rx="16" fill="url(#clG' + uid + ')" stroke="#F472B6" stroke-width="3" class="cl-neon"/>' + bulbs +
        '<path d="M24 22H336" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/><path d="M24 22H336" stroke="#FFF7D6" stroke-width="1" stroke-linecap="round" opacity=".7"/>' +
        '<rect x="70" y="' + (CL_FLOOR + 18) + '" width="270" height="30" rx="6" fill="#2A0B3D"/><path d="M70 ' + (CL_FLOOR + 18) + 'H340" stroke="#F9A8D4" stroke-opacity=".4"/>' +
        '<rect x="22" y="152" width="46" height="74" rx="6" fill="#07020D" stroke="#FBBF24" stroke-opacity=".6"/><path d="M45 164v14m-6-6l6 6 6-6" stroke="#FBBF24" stroke-width="2.2" fill="none" stroke-linecap="round" class="cl-arrow"/>' +
        '<g class="cl-pop" opacity="0"><circle r="46" fill="url(#clR' + uid + ')"/><g class="cl-popi"></g></g>' +
        prizes +
        '<g class="cl-claw"><line class="cl-cable" x1="0" y1="0" x2="0" y2="0" stroke="#CBD5E1" stroke-width="1.4"/><rect class="cl-cart" x="-12" y="-6" width="24" height="12" rx="4" fill="url(#clM' + uid + ')"/>' +
          '<g class="cl-head"><circle r="6.5" fill="url(#clM' + uid + ')"/><g class="cl-fl"><path d="M-2 4q-9 6-9 15q0 3 3 5" stroke="#CBD5E1" stroke-width="3" fill="none" stroke-linecap="round"/></g><g class="cl-fr"><path d="M2 4q9 6 9 15q0 3-3 5" stroke="#CBD5E1" stroke-width="3" fill="none" stroke-linecap="round"/></g><path d="M0 5v11" stroke="#94A3B8" stroke-width="2.6" stroke-linecap="round"/></g></g>' +
        '<rect x="22" y="196" width="46" height="30" rx="5" fill="#07020D"/>' + tags +
        '<text class="cl-big" x="190" y="58" text-anchor="middle"></text>';
    },
    board: function (uid, l, oddTxt, o) { return [0, 1, 2, 3, 4, 5].map(function (k) { return '<button type="button" data-s="' + k + '">' + clMini(k) + '<b class="fit" data-o="' + k + '">' + oddTxt(o[String(k)]) + '</b></button>'; }).join(''); },
    hist: function (n) { return clMini(n); },
    wins: function (res) { return [String(res.n)]; },
    init: function (c) {
      c.ps = [].slice.call(c.box.querySelectorAll('.cl-p')); c.cart = c.box.querySelector('.cl-cart'); c.cable = c.box.querySelector('.cl-cable'); c.head = c.box.querySelector('.cl-head');
      c.fl = c.box.querySelector('.cl-fl'); c.fr = c.box.querySelector('.cl-fr'); c.pop = c.box.querySelector('.cl-pop'); c.popi = c.box.querySelector('.cl-popi'); c.big = c.box.querySelector('.cl-big'); c.popN = -1;
    },
    frame: function (c, R, t, e, res, odds) {
      var x = CL_HOME, y = CL_TOP, op = 1, hold = '', k, d = -1, n = -1;
      var pp = CL_X.map(function (px, j) { return [px, CL_FLOOR, 1, Math.sin(t * 1.2 + j) * 2]; });
      if (!res) {
        var ampl = R && e < 0 ? cl01((R.close - t - 3) / 12) : 0; // the claw roams above the prizes, then waits at home before the close
        x = CL_HOME + (1 - Math.cos(t * .45)) / 2 * 260 * ampl; y = CL_TOP + Math.sin(t * 1.3) * 3;
        sa(c.pop, 'opacity', '0'); txt(c.big, R && e < 0 ? mmss(R.close - t) : ''); sa(c.big, 'class', 'cl-big' + (R && e < 0 && R.close - t <= 10 ? ' warn' : ''));
      } else {
        d = +res.d; n = +res.n;
        var X = function (v) { return v === 'd' ? CL_X[d] : v === 'n' ? CL_X[n] : v; };
        for (k = 1; k < CL_K.length && CL_K[k][0] <= e; k++);
        if (k >= CL_K.length) { var L0 = CL_K[CL_K.length - 1]; x = X(L0[1]); y = L0[2]; op = L0[3]; }
        else {
          var A = CL_K[k - 1], B = CL_K[k], f = eio((e - A[0]) / (B[0] - A[0]));
          x = lerp(X(A[1]), X(B[1]), f); y = lerp(A[2], B[2], f); op = lerp(A[3], B[3], f); hold = A[4] && B[4] ? A[4] : (A[4] && f < .5 ? A[4] : '');
        }
        if (e >= 15.4 && e < 16.6) x += Math.sin((e - 15.4) * 18) * 3 * (1 - (e - 15.4) / 1.2); // suspense jiggle above the winner
        // decoy slips at 10.4 and falls back
        if (e >= 10.5 && e < 11.7) { var fk = (e - 10.5) / 1.2, by = fk < .7 ? lerp(84, CL_FLOOR, Math.pow(fk / .7, 2)) : CL_FLOOR - Math.sin((fk - .7) / .3 * Math.PI) * 10; pp[d] = [CL_X[d], by, 1, (1 - fk) * 30]; }
        if (hold === 'd') pp[d] = [x, y + 24, 1, Math.sin(t * 6) * 4];
        if (hold === 'n') pp[n] = [x, y + 24, 1, Math.sin(t * 3) * 6];
        if (e >= 28.0) { var dk = seg(e, 28.0, 29.0); pp[n] = [CL_HOME, lerp(84, 240, dk * dk), 1, 0]; }
        var popK = eo(seg(e, 29.6, 31.2));
        if (popK > 0) {
          if (c.popN !== n) { c.popN = n; c.popi.innerHTML = clPrize(n, 'pop' + (++GID)); }
          sa(c.pop, 'opacity', '1'); sa(c.pop, 'transform', tr(186, 104, .2 + popK * 1.6, Math.sin(t * 2) * 4));
        } else sa(c.pop, 'opacity', '0');
        txt(c.big, e >= 32 ? c.oddTxt(odds[String(n)]) : ''); sa(c.big, 'class', 'cl-big odd');
      }
      sa(c.cart, 'transform', tr(x, 22)); sa(c.cable, 'x1', x.toFixed(1)); sa(c.cable, 'y1', '22'); sa(c.cable, 'x2', x.toFixed(1)); sa(c.cable, 'y2', y.toFixed(1));
      sa(c.head, 'transform', tr(x, y)); var ang = lerp(-4, 22, op);
      sa(c.fl, 'transform', 'rotate(' + ang.toFixed(1) + ' -2 4)'); sa(c.fr, 'transform', 'rotate(' + (-ang).toFixed(1) + ' 2 4)');
      for (k = 0; k < 6; k++) { var p = pp[k]; sa(c.ps[k], 'transform', tr(p[0], p[1], p[2], p[3])); sa(c.ps[k], 'opacity', p[1] > 214 ? '0' : (res && e >= 32 && k !== n ? '.45' : '1')); }
    }
  });
})(window.D6 = window.D6 || {});
