/* v2795 — Sky Rush / Jet Man / Rocket rebuilt (owner request): shared live round like Spribe Aviator / SmartSoft JetX /
   Pragmatic Spaceman — bet during the countdown (or for the next round during the flight), live gold CASH OUT button,
   auto cash-out at a target, glowing curve + parallax stars, fly-away / explosion, coloured history of the last rounds.
   The server (casino_lib.php casino_round_*) draws every round; this file only shows it. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cancel: 'Cancel', cash: 'Cash out', wait: 'Waiting for next round', flew: 'Flew away!', lost: 'Lost in space!', auto: 'Auto cash-out' },
    fr: { bet: 'Miser', cancel: 'Annuler', cash: 'Encaisser', wait: 'En attente du prochain tour', flew: 'Envolé !', lost: 'Perdu dans l’espace !', auto: 'Encaissement auto' },
    es: { bet: 'Apostar', cancel: 'Cancelar', cash: 'Retirar', wait: 'Esperando la próxima ronda', flew: '¡Voló!', lost: '¡Perdido en el espacio!', auto: 'Retiro automático' },
    pt: { bet: 'Apostar', cancel: 'Cancelar', cash: 'Sacar', wait: 'Aguardando a próxima rodada', flew: 'Voou!', lost: 'Perdido no espaço!', auto: 'Saque automático' },
    ar: { bet: 'راهن', cancel: 'إلغاء', cash: 'اسحب', wait: 'بانتظار الجولة التالية', flew: 'طار بعيدًا!', lost: 'ضاع في الفضاء!', auto: 'سحب تلقائي' },
    tr: { bet: 'Bahis', cancel: 'İptal', cash: 'Çek', wait: 'Sonraki tur bekleniyor', flew: 'Uçup gitti!', lost: 'Uzayda kayboldu!', auto: 'Otomatik çekim' },
    vi: { bet: 'Cược', cancel: 'Hủy', cash: 'Rút', wait: 'Đang chờ vòng tiếp theo', flew: 'Bay mất rồi!', lost: 'Lạc vào không gian!', auto: 'Tự động rút' },
    id: { bet: 'Pasang', cancel: 'Batal', cash: 'Tarik', wait: 'Menunggu ronde berikutnya', flew: 'Terbang pergi!', lost: 'Hilang di angkasa!', auto: 'Tarik otomatis' },
    ru: { bet: 'Ставка', cancel: 'Отмена', cash: 'Забрать', wait: 'Ожидание следующего раунда', flew: 'Улетел!', lost: 'Потерян в космосе!', auto: 'Автовывод' },
    de: { bet: 'Setzen', cancel: 'Abbrechen', cash: 'Auszahlen', wait: 'Warten auf die nächste Runde', flew: 'Weggeflogen!', lost: 'Im All verloren!', auto: 'Auto-Auszahlung' },
    hi: { bet: 'दांव', cancel: 'रद्द करें', cash: 'कैश आउट', wait: 'अगले राउंड का इंतज़ार', flew: 'उड़ गया!', lost: 'अंतरिक्ष में खो गया!', auto: 'ऑटो कैश आउट' },
    zh: { bet: '下注', cancel: '取消', cash: '兑现', wait: '等待下一轮', flew: '飞走了！', lost: '迷失太空！', auto: '自动兑现' }
  };
  var RULES = {
    en: '1. Bet during the countdown (a bet placed during a flight plays the next round).\n2. The multiplier climbs from ×1.00: tap Cash out to win your bet × the multiplier.\n3. If it flies away before you cash out, the bet is lost. Auto cash-out cashes out at your target by itself.',
    fr: '1. Mise pendant le compte à rebours (une mise posée pendant le vol joue le tour suivant).\n2. Le multiplicateur monte depuis ×1,00 : touche Encaisser pour gagner ta mise × le multiplicateur.\n3. S’il s’envole avant que tu encaisses, la mise est perdue. L’encaissement auto encaisse seul à ta cible.',
    es: '1. Apuesta durante la cuenta atrás (una apuesta hecha durante el vuelo juega la ronda siguiente).\n2. El multiplicador sube desde ×1,00: toca Retirar para ganar tu apuesta × el multiplicador.\n3. Si se va antes de que retires, pierdes la apuesta. El retiro automático retira solo en tu objetivo.',
    pt: '1. Aposte durante a contagem (uma aposta feita durante o voo joga a rodada seguinte).\n2. O multiplicador sobe desde ×1,00: toque em Sacar para ganhar sua aposta × o multiplicador.\n3. Se ele voar antes de você sacar, a aposta é perdida. O saque automático saca sozinho no seu alvo.',
    ar: '1. راهن أثناء العد التنازلي (الرهان أثناء الطيران يلعب الجولة التالية).\n2. يرتفع المضاعف من ×1.00: اضغط اسحب لتربح رهانك × المضاعف.\n3. إذا طار قبل أن تسحب تخسر الرهان. السحب التلقائي يسحب وحده عند هدفك.',
    tr: '1. Geri sayım sırasında bahis yap (uçuş sırasında yapılan bahis sonraki turda oynar).\n2. Çarpan ×1,00’dan yükselir: bahis × çarpanı kazanmak için Çek’e dokun.\n3. Sen çekmeden uçup giderse bahis kaybedilir. Otomatik çekim hedefinde kendiliğinden çeker.',
    vi: '1. Đặt cược trong lúc đếm ngược (cược đặt khi đang bay sẽ chơi vòng sau).\n2. Hệ số tăng từ ×1,00: chạm Rút để nhận tiền cược × hệ số.\n3. Nếu nó bay mất trước khi bạn rút, bạn mất cược. Tự động rút sẽ rút giúp bạn tại mục tiêu.',
    id: '1. Pasang taruhan saat hitung mundur (taruhan saat terbang dimainkan di ronde berikutnya).\n2. Pengali naik dari ×1,00: ketuk Tarik untuk menang taruhan × pengali.\n3. Jika terbang pergi sebelum kamu tarik, taruhan hilang. Tarik otomatis menarik sendiri di targetmu.',
    ru: '1. Ставь во время отсчёта (ставка во время полёта играет в следующем раунде).\n2. Множитель растёт от ×1,00: нажми «Забрать», чтобы выиграть ставку × множитель.\n3. Если он улетит раньше, ставка проиграна. Автовывод сам заберёт выигрыш на твоей цели.',
    de: '1. Setze während des Countdowns (ein Einsatz während des Flugs spielt die nächste Runde).\n2. Der Multiplikator steigt ab ×1,00: tippe Auszahlen, um Einsatz × Multiplikator zu gewinnen.\n3. Fliegt er vorher weg, ist der Einsatz verloren. Die Auto-Auszahlung zahlt bei deinem Ziel selbst aus.',
    hi: '1. उलटी गिनती के दौरान दांव लगाएँ (उड़ान के दौरान लगाया दांव अगले राउंड में खेलता है)।\n2. गुणक ×1.00 से बढ़ता है: दांव × गुणक जीतने के लिए कैश आउट दबाएँ।\n3. कैश आउट से पहले उड़ गया तो दांव हार जाते हैं। ऑटो कैश आउट आपके लक्ष्य पर खुद कैश आउट करता है।',
    zh: '1. 在倒计时期间下注（飞行中下注将参与下一轮）。\n2. 倍数从 ×1.00 开始上升：点击兑现即可赢得 下注 × 倍数。\n3. 若在兑现前飞走，则输掉下注。自动兑现会在你的目标倍数自动兑现。'
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }

  var NS = 'http://www.w3.org/2000/svg';
  var GRAD = 0;
  /* our own drawings (SVG 120×60, facing right) */
  function craftSvg(game) {
    var id = 'cr' + (++GRAD);
    var flame = '<g class="cr-flame"><path d="M30 23C16 21 8 28 0 30c8 2 16 9 30 7z" fill="url(#' + id + 'f)"/><path d="M30 26c-8-1-13 2-17 4 4 2 9 5 17 4z" fill="#FFF7D6"/></g>';
    var fdef = '<linearGradient id="' + id + 'f" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#FDE68A"/><stop offset=".45" stop-color="#FB923C"/><stop offset="1" stop-color="#F43F5E" stop-opacity="0"/></linearGradient>';
    if (game === 'jet') {
      return '<svg viewBox="0 0 120 60" aria-hidden="true"><defs>' + fdef +
        '<linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4B5FD"/><stop offset=".5" stop-color="#8B5CF6"/><stop offset="1" stop-color="#5B21B6"/></linearGradient>' +
        '<linearGradient id="' + id + 'v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs>' +
        '<g transform="translate(-6 4)">' + flame + '</g>' +
        '<rect x="10" y="31" width="30" height="9" rx="4.5" fill="#6D28D9"/><rect x="8" y="31" width="8" height="9" rx="3" fill="#FBBF24"/>' +
        '<rect x="22" y="14" width="18" height="24" rx="6" fill="#475569"/><rect x="24" y="16" width="5" height="20" rx="2.5" fill="#94A3B8"/>' +
        '<rect x="30" y="20" width="56" height="21" rx="10.5" fill="url(#' + id + 's)"/><path d="M40 32h40" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>' +
        '<rect x="78" y="22" width="26" height="8" rx="4" fill="#7C3AED"/><circle cx="106" cy="26" r="5.5" fill="#FBBF24"/>' +
        '<circle cx="84" cy="20" r="13" fill="#EDE9FE"/><path d="M84 12a9 8 0 0 1 9.5 8.5c0 3-2 4.5-5 4.5h-6c-2.5 0-3.5-2-3-4.5 1-5 2-8.5 4.5-8.5z" fill="url(#' + id + 'v)"/>' +
        '<path d="M86 14.5c2.5 .5 4.5 2.5 5 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/></svg>';
    }
    if (game === 'rocket') {
      return '<svg viewBox="0 0 120 60" aria-hidden="true"><defs>' + fdef +
        '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#E2E8F0"/><stop offset="1" stop-color="#94A3B8"/></linearGradient>' +
        '<linearGradient id="' + id + 'n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#67E8F9"/><stop offset="1" stop-color="#0E7490"/></linearGradient></defs>' +
        flame +
        '<path d="M34 20L20 5h12l16 15zM34 40L20 55h12l16-15z" fill="url(#' + id + 'n)"/>' +
        '<path d="M26 20h58c14 0 26 5 34 10-8 5-20 10-34 10H26c-2 0-3-1-3-3V23c0-2 1-3 3-3z" fill="url(#' + id + 'b)"/>' +
        '<path d="M92 20.6c11 1.4 20 5 26 9.4-6 4.4-15 8-26 9.4 2-6 2-12.8 0-18.8z" fill="url(#' + id + 'n)"/>' +
        '<path d="M44 20v20" stroke="#0891B2" stroke-width="3"/><circle cx="68" cy="30" r="7.5" fill="#0E7490"/><circle cx="68" cy="30" r="5" fill="#164E63"/>' +
        '<path d="M65 27.5a4 4 0 0 1 4-2" stroke="#A5F3FC" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M30 24h50" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/></svg>';
    }
    return '<svg viewBox="0 0 120 60" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6B81"/><stop offset=".5" stop-color="#E5334B"/><stop offset="1" stop-color="#9F1239"/></linearGradient></defs>' +
      '<path d="M16 29L7 9h11l14 19z" fill="#9F1239"/><path d="M14 29l-8 2 2 4 12-1z" fill="#BE123C"/>' +
      '<path d="M12 30c0-5 14-8 46-8l34 2c10 1 14 4 14 6s-4 6-14 7l-34 2c-30 0-46-4-46-9z" fill="url(#' + id + 'b)"/>' +
      '<path d="M22 30.5h74" stroke="#fff" stroke-width="2.2" opacity=".85" stroke-linecap="round"/>' +
      '<path d="M66 23c3-6 14-7 20-1z" fill="#BAE6FD"/><path d="M70 22c2-3 7-4 10-2" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>' +
      '<path d="M46 33h26l-14 22H44z" fill="#BE123C"/><path d="M48 34h20" stroke="#FDA4AF" stroke-width="1.5"/>' +
      '<circle cx="106" cy="30" r="4.5" fill="#CBD5E1"/><ellipse class="cr-prop" cx="110" cy="30" rx="2.6" ry="17" fill="rgba(255,255,255,.55)"/></svg>';
  }
  var COL = { crash: '#FF3B5C', jet: '#A855F7', rocket: '#22D3EE' };
  var MULT = function (s) { return Math.max(1, Math.floor(Math.exp(0.08 * Math.max(0, s)) * 100) / 100); }; // same as the server
  /* v2807 (propriétaire, iPhone) : l'encaissement auto « restait sur 2 » — sur iPhone, select() au toucher ne sélectionne
     pas : le chiffre tapé s'ajoutait derrière « 2,00 » (« 2,003,5 » → illisible → retour à 2). Maintenant : toucher la case
     la VIDE (l'ancienne valeur reste en gris), on tape « 3,5 » ou « 3.5 », la valeur est gardée (par jeu, sur ce téléphone),
     l'auto s'allume, et 4 raccourcis ×1,5 ×2 ×5 ×10. Pendant une mise ouverte la cible est verrouillée (comme Aviator). */
  var AUTO_KEY = 'oro_cr_auto';
  var autoMem = (function () { try { return JSON.parse(localStorage.getItem(AUTO_KEY) || '{}') || {}; } catch (e) { return {}; } })();
  var autoSave = function (game, on, v) { autoMem[game] = { on: on ? 1 : 0, v: v }; try { localStorage.setItem(AUTO_KEY, JSON.stringify(autoMem)); } catch (e) { /* navigation privée */ } };
  var CHIPS = [1.5, 2, 5, 10];
  /* « 3,5 » « 3.5 » « x3.5 » « 3,50× » → 3.5 ; rien de lisible → null (la valeur d'avant est gardée) */
  var parseAuto = function (t) {
    t = String(t == null ? '' : t).replace(/[\s×xX]/g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    var i = t.indexOf('.'); if (i >= 0) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '');
    var v = parseFloat(t);
    return isFinite(v) && v > 0 ? v : null;
  };

  function make(game) {
    return function (box, x) {
      var l = L(), dc = K.dec(), col = COL[game];
      var fx = function (v) { return Number(v).toFixed(2).replace('.', dc); };
      box.classList.add('cg-game', 'cg-crash', 'cr-' + game);
      box.style.setProperty('--cr', col);
      var mem = autoMem[game] || {}, autoOn = !!mem.on, autoVal = Math.max(1.01, Math.min(1000, Number(mem.v) || 2));
      var opts = '<div class="cr-opts"><button type="button" class="cr-auto' + (autoOn ? ' on' : '') + '" id="crAuto"><i class="cr-sw"><b></b></i><span class="fit">' + K.esc(l.auto) + '</span></button>' +
        '<label class="cr-tg' + (autoOn ? ' on' : '') + '" id="crTgW"><input id="crTg" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="7" value="' + fx(autoVal) + '" aria-label="' + K.esc(l.auto) + '"><em>×</em></label>' +
        '<div class="cr-chips" id="crChips">' + CHIPS.map(function (v) { return '<button type="button" data-av="' + v + '">×' + String(v).replace('.', dc) + '</button>'; }).join('') + '</div></div>';
      box.innerHTML = '<div class="cg-hist cr-hist" id="crHist"></div>' +
        '<div class="cg-stage cr-stage" id="crSt"><i class="cr-glow"></i><i class="cr-rays"></i><i class="cr-sky s1"></i><i class="cr-sky s2"></i><i class="cr-planet"></i>' +
        '<svg class="cr-plot" id="crSvg" aria-hidden="true"><defs><linearGradient id="crA' + game + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".5"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
        '<path id="crArea" fill="url(#crA' + game + ')"/><path id="crLine" class="cr-line" fill="none" stroke="' + col + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<i class="cr-axis x"></i><i class="cr-axis y"></i>' +
        '<span class="cr-craft" id="crCraft"><span class="cr-bob">' + craftSvg(game) + '</span></span><i class="cr-boom" id="crBoom"></i>' +
        '<div class="cr-mid"><small class="cr-flew fit" id="crFlew"></small><b class="cr-m fit" id="crM">' + fx(1) + '×</b>' +
        '<b class="cr-out" id="crOut"></b>' +
        '<div class="cr-wait" id="crWait" hidden><i class="cr-spin"></i><small class="fit">' + K.esc(l.wait) + '</small><i class="cr-bar"><b id="crBar"></b></i></div></div></div>' +
        K.stakePanel(l.bet, opts);
      var watch = K.guest();
      if (!watch) K.bindStake(box);
      var st = $('crSt'), craft = $('crCraft'), svg = $('crSvg'), line = $('crLine'), area = $('crArea'), mEl = $('crM'), flew = $('crFlew'), wait = $('crWait'), bar = $('crBar');
      var btn = $('csGo'), R = null, me = null, off = 0, shown = null, first = true, busy = false, view = '', W = 0, H = 0, cw = 80, histKey = '', cancelRef = null, autoAsk = 0;
      var alive = function () { return box.isConnected && K.S.game === game; };
      var nowS = function () { return Date.now() / 1000 + off; };

      /* ---- auto cash-out (compact, inside the options area) ---- */
      var tg = $('crTg'), tgW = $('crTgW'), aBtn = $('crAuto'), chips = $('crChips'), editing = false;
      var locked = function () { return !!(me && !me.done); }; // une mise ouverte garde la cible donnée au serveur
      var paintAuto = function () {
        aBtn.classList.toggle('on', autoOn); tgW.classList.toggle('on', autoOn);
        if (!editing) tg.value = fx(autoVal);
        chips.querySelectorAll('[data-av]').forEach(function (b) { b.classList.toggle('on', autoOn && Number(b.getAttribute('data-av')) === autoVal); });
      };
      var setAuto = function (v) {
        var n = parseAuto(v);
        if (n != null) autoVal = Math.max(1.01, Math.min(1000, Math.round(n * 100) / 100));
        autoSave(game, autoOn, autoVal); paintAuto();
      };
      var setOn = function (on) { autoOn = !!on; autoSave(game, autoOn, autoVal); paintAuto(); };
      aBtn.addEventListener('click', function () { if (!locked()) setOn(!autoOn); });
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('[data-av]'); if (!b || locked()) return;
        editing = false; if (document.activeElement === tg) tg.blur();
        autoOn = true; setAuto(b.getAttribute('data-av'));
      });
      // toucher la case : elle se vide (l'ancienne valeur reste en gris derrière), le clavier chiffres s'ouvre, l'auto s'allume
      tg.addEventListener('focus', function () {
        if (locked()) { tg.blur(); return; }
        editing = true; tg.placeholder = fx(autoVal); tg.value = '';
        if (!autoOn) setOn(true);
      });
      tg.addEventListener('input', function () {
        var clean = String(tg.value).replace(/[^0-9.,]/g, '');
        if (clean !== tg.value) tg.value = clean;
        var n = parseAuto(clean); if (n != null && n >= 1.01 && n <= 1000) { autoVal = Math.round(n * 100) / 100; autoSave(game, autoOn, autoVal); }
        paintAuto();
      });
      var commit = function () { if (!editing) return; editing = false; var t = tg.value; tg.placeholder = ''; if (String(t).trim() === '') paintAuto(); else setAuto(t); };
      tg.addEventListener('blur', commit);
      tg.addEventListener('change', commit);
      tg.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); tg.blur(); } });
      var wasLocked = null;
      var paintLock = function () {
        var lk = locked();
        if (lk === wasLocked) return;
        wasLocked = lk; box.querySelector('.cr-opts').classList.toggle('lock', lk); tg.readOnly = lk;
        if (lk) { editing = false; if (document.activeElement === tg) tg.blur(); autoOn = me.auto > 1; if (autoOn) autoVal = Number(me.auto); } // ce que le serveur garde pour CETTE mise
        else { var m0 = autoMem[game] || {}; autoOn = !!m0.on; autoVal = Math.max(1.01, Math.min(1000, Number(m0.v) || autoVal)); } // le réglage gardé pour les mises suivantes
        paintAuto();
      };
      paintAuto();

      /* ---- scene geometry ---- */
      var measure = function () {
        W = st.clientWidth; H = st.clientHeight;
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
        cw = Math.max(64, Math.min(150, Math.min(W * 0.22, H * 0.42)));
        craft.style.width = cw + 'px'; craft.style.height = (cw / 2) + 'px';
      };
      var geo = function (s, m) {
        var x0 = W * 0.05, y0 = H * 0.9, wp = W * 0.86, hp = H * 0.68;
        var ts = Math.max(9, s * 1.12), ms = Math.max(2.2, 1 + (Math.exp(0.08 * s) - 1) * 1.16);
        var px = function (t) { return x0 + wp * t / ts; }, py = function (t) { return y0 - hp * (Math.exp(0.08 * t) - 1) / (ms - 1); };
        return { x0: x0, y0: y0, px: px, py: py };
      };
      var drawFlight = function (s) {
        // the plane rides the true multiplier; the trail is a smooth bent curve to it (like the big crash games)
        var g = geo(s), X = g.px(s), Y = g.py(s), cx = g.x0 + (X - g.x0) * 0.58, cy = g.y0;
        var d = 'M' + g.x0.toFixed(1) + ' ' + g.y0.toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + X.toFixed(1) + ' ' + Y.toFixed(1);
        line.setAttribute('d', d); area.setAttribute('d', d + 'L' + X.toFixed(1) + ' ' + g.y0.toFixed(1) + 'Z');
        var a = Math.atan2(Y - cy, Math.max(0.01, X - cx)) * 180 / Math.PI; a = Math.max(-34, Math.min(0, a));
        craft.style.transform = 'translate(' + Math.max(cw * 0.12, X - cw * 0.62).toFixed(1) + 'px,' + (Y - cw * 0.3).toFixed(1) + 'px) rotate(' + a.toFixed(1) + 'deg)';
        return [X, Y];
      };
      var park = function () {
        line.setAttribute('d', ''); area.setAttribute('d', '');
        craft.style.transform = 'translate(' + (W * 0.05 - cw * 0.08).toFixed(1) + 'px,' + (H * 0.9 - cw * 0.4).toFixed(1) + 'px)';
      };
      var lastXY = [0, 0];
      measure();
      if (window.ResizeObserver) new ResizeObserver(function () { if (alive()) measure(); }).observe(st);

      /* ---- history chips (last crash points of the shared round, newest first) ---- */
      var paintHist = function () {
        if (!R) return;
        var h = (R.h || []).slice(); if (R.c != null) h.unshift(Number(R.c));
        var key = R.i + ':' + h.length + ':' + (R.c != null);
        if (key === histKey) return;
        var fresh = histKey !== '' && R.c != null;
        histKey = key;
        $('crHist').innerHTML = h.slice(0, 24).map(function (v, i) { return '<i class="' + (v < 2 ? 'lo' : v < 10 ? 'mid' : 'hi') + (fresh && i === 0 ? ' new' : '') + '">' + fx(v) + '×</i>'; }).join('');
      };

      var showMine = function (r) {
        if (!r || !r.done || !r.ref || shown === r.ref) return;
        shown = r.ref;
        if (cancelRef === r.ref) { K.afterPlay(r); return; } // bet cancelled before take-off: stake back, no result pill
        if (r.out > 0) { var o = $('crOut'); o.textContent = fx(r.out) + '×'; o.classList.remove('in'); void o.offsetWidth; o.classList.add('in'); } // my cash-out multiplier, under the big one
        K.resultLine(box, r);
      };
      var askMine = async function () {
        var mine = null;
        try { mine = await K.multi(game, 'round', null, true); } catch (e) { mine = null; }
        if (!alive() || !mine) return;
        if (mine.round && mine.round.i) { R = mine.round; off = mine.now - Date.now() / 1000; }
        me = mine.has ? mine : null;
        if (first) { first = false; if (me && me.done) shown = me.ref; } // an old finished bet: not shown again
        showMine(me);
      };
      var sync = async function () {
        if (!alive()) return;
        var r = null;
        try { var rq = await fetch('casino-tour.php?g=' + game, { cache: 'no-store' }); r = await rq.json(); } catch (e) { r = null; }
        if ((!r || !r.ok) && !watch) { try { r = await K.multi(game, 'round', null, true); if (r) r.mine = 1; } catch (e) { r = null; } }
        if (!alive()) return;
        clearTimeout(K.S.timer); K.S.timer = setTimeout(sync, 1000);
        if (r && r.round && r.round.i) {
          var open = me && !me.done;
          off = r.now - Date.now() / 1000; R = r.round;
          if (r.mine) { me = r.has ? r : null; first = false; showMine(me); }
          else if (!watch && (first || (open && (R.i > (me.rid || 0) || (R.c != null && R.i >= (me.rid || 0)))))) await askMine();
          if (!alive()) return;
        }
        if (R && nowS() >= R.t0 && R.c == null) { clearTimeout(K.S.timer); K.S.timer = setTimeout(sync, 450); } // in flight: more often
      };

      // big-game button: one line ("Bet", "Cancel"), or two stacked one-line texts while flying ("CASH OUT" / "+$ 1.23")
      var b1 = null, b2 = null;
      if (btn) { btn.innerHTML = '<b class="cr-b1 fit"></b><small class="cr-b2 fit"></small>'; b1 = btn.firstChild; b2 = btn.lastChild; K.setText(b1, l.bet); }
      var setBtn = function (cls, txt, dis, sub) {
        if (!btn) return;
        ['cash', 'stop', 'wait'].forEach(function (c) { btn.classList.toggle(c, c === cls); });
        var two = !!sub;
        if (btn.classList.contains('two') !== two) { btn.classList.toggle('two', two); b2.textContent = ''; K.fitEl(b1); }
        K.setText(b1, txt); if (two) K.setText(b2, sub);
        btn.disabled = !!dis;
      };
      var tick = function () {
        if (!alive()) return;
        if (R && W) {
          var t = nowS(), s = t - R.t0, phase = t < R.t0 ? 'bet' : R.c != null ? 'end' : 'fly';
          if (phase !== view) {
            view = phase;
            st.classList.toggle('flying', phase === 'fly'); st.classList.toggle('ended', phase === 'end'); st.classList.toggle('betting', phase === 'bet');
            wait.hidden = phase !== 'bet'; mEl.hidden = phase === 'bet';
            K.setText(flew, phase === 'end' ? (game === 'rocket' ? l.lost : l.flew) : '');
            K.fitEl(mEl); K.fitEl(wait.querySelector('small'));
            if (phase === 'end') {
              craft.style.transition = game === 'rocket' ? 'opacity .25s, visibility 0s .3s' : 'transform 1s cubic-bezier(.55,0,.9,.45), opacity 1s, visibility 0s 1s'; craft.style.visibility = 'hidden';
              if (game === 'rocket') { var bm = $('crBoom'); bm.style.transform = 'translate(' + lastXY[0].toFixed(0) + 'px,' + lastXY[1].toFixed(0) + 'px)'; bm.classList.remove('go'); void bm.offsetWidth; bm.classList.add('go'); craft.style.opacity = '0'; }
              else { craft.style.transform = 'translate(' + (W + cw).toFixed(0) + 'px,' + (-cw).toFixed(0) + 'px) rotate(-30deg)'; craft.style.opacity = '0'; }
            } else { craft.style.transition = 'none'; craft.style.opacity = '1'; craft.style.visibility = ''; }
          }
          if (phase === 'bet') {
            park(); bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, (R.t0 - t) / (R.bet || 5))).toFixed(3) + ')';
          } else if (phase === 'fly') {
            lastXY = drawFlight(s); K.setText(mEl, fx(MULT(s)) + '×');
          } else {
            K.setText(mEl, fx(R.c) + '×');
          }
          paintHist(); paintLock();
          var open = me && !me.done, inFlight = phase === 'fly';
          if (!btn || watch) { /* visitor: watches only */ }
          else if (open && me.rid === R.i && inFlight) {
            setBtn('cash', l.cash, busy, '+$ ' + K.m2(me.stake * Math.min(MULT(s), me.auto > 1 ? me.auto : 1e9)));
            if (me.auto > 1 && MULT(s) >= me.auto && Date.now() - autoAsk > 900) { autoAsk = Date.now(); askMine(); } // auto cash-out reached: the server has settled it
          }
          else if (open) setBtn('stop', l.cancel, busy);
          else setBtn('', l.bet, busy);
        }
        K.S.raf = requestAnimationFrame(tick);
      };
      if (btn) btn.addEventListener('click', async function () {
        if (busy || watch) return;
        busy = true; btn.disabled = true;
        if (me && !me.done) {
          var pre = !(R && me.rid === R.i && nowS() >= R.t0);
          var c = await K.multi(game, 'cash');
          if (c) { if (pre && c.done && Number(c.out) === 1) cancelRef = c.ref; me = c; showMine(c); }
        } else {
          if (editing) commit(); // la valeur écrite, même sans avoir quitté la case
          var r = await K.multi(game, 'start', autoOn ? { auto: autoVal } : {});
          if (r) { me = r; if (r.done) showMine(r); else K.afterPlay(r); }
        }
        busy = false; btn.disabled = false;
      });
      park(); sync(); tick();
    };
  }
  ['crash', 'jet', 'rocket'].forEach(function (k) { K.register(k, make(k), { rules: RULES }); });
})(window.D6 = window.D6 || {});
