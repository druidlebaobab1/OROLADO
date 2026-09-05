(function (D6) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var stake = 100;
  var toastTimer = null;
  var outcomeToastTimer = null;
  var outcomeToastSeen = {};
  var selectedOp = 'wave';
  var depositOp = 'wave';
  var pendingConvert = false;
  var lastClickAt = 0;
  var cooling = false;
  var histPatch = 0;
  var hudSeen = {};
  var deferredPrompt = null;
  var LANGS = [
    { code: 'fr', flag: '🇫🇷' },
    { code: 'en', flag: '🇬🇧' },
    { code: 'es', flag: '🇪🇸' },
    { code: 'pt', flag: '🇵🇹' },
    { code: 'ar', flag: '🇸🇦' }
  ];

  function user() { return D6.Auth.current(); }

  function isGuest(u) {
    u = u || user();
    return !!(u && (u.guest || String(u.email || '').indexOf('@orolado.local') >= 0));
  }

  function ensureGuest() {
    var existing = D6.Store.findByEmail('guest@orolado.local');
    if (!existing) {
      existing = D6.Store.createUser({
        id: 'guest_local',
        displayName: 'Invité',
        email: 'guest@orolado.local',
        phone: '0700000000',
        countryCode: '+225',
        passwordHash: 'guest',
        guest: true
      });
      existing.guest = true;
      D6.Store.saveUser(existing);
    } else {
      existing.guest = true;
      existing.mode = 'demo';
      D6.Store.saveUser(existing);
    }
    D6.Store.setSession({ userId: existing.id, at: D6.nowIso() });
    return D6.Store.current();
  }

  function requireAccount(msg) {
    if (!isGuest()) return true;
    toast(msg || t('needAccount') || 'Connecte-toi ou crée un compte pour continuer', 'err');
    showAuthScreen('login');
    return false;
  }

  function showAuthScreen(tab) {
    showScreen('screenAuth');
    document.querySelectorAll('.auth-tab').forEach(function (el) {
      el.classList.toggle('on', el.dataset.tab === tab);
    });
    if ($('formLogin')) $('formLogin').classList.toggle('hidden', tab !== 'login');
    if ($('formRegister')) $('formRegister').classList.toggle('hidden', tab !== 'register');
  }

  function syncAuthQuick() {
    var q = $('authQuick');
    var trade = $('screenTrade');
    var guest = isGuest();
    if (q) q.classList.toggle('hidden', !guest);
    if (trade) trade.classList.toggle('is-guest', guest);
    if ($('btnProfile')) $('btnProfile').classList.toggle('hidden', guest);
  }

  function setModeChrome(u) {
    var trade = $('screenTrade');
    if (!trade || !u) return;
    trade.classList.toggle('mode-demo', u.mode !== 'real');
    trade.classList.toggle('mode-real', u.mode === 'real');
    var plus = $('btnDemoTopup');
    if (plus) {
      var show = u.mode !== 'real';
      plus.classList.toggle('hidden', !show);
    }
  }

  function fmtTimerLeft(sec) {
    sec = Math.max(0, Number(sec) || 0);
    if (sec >= 60) {
      var m = Math.floor(sec / 60);
      var s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }
    return sec.toFixed(1) + 's';
  }
  function t(k) { return D6.I18N.t(k); }
  function assetId(u) { return (u && u.assetId) || 'v100'; }

  function showScreen(name) {
    ['screenAuth', 'screenTrade', 'screenAdmin'].forEach(function (id) {
      var el = $(id);
      if (el) el.classList.toggle('hidden', id !== name);
    });
    if (name !== 'screenTrade') closeDrawer();
  }

  function toast(msg, kind) {
    var el = $('toast');
    el.textContent = msg;
    el.className = 'toast show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 2400);
  }

  function showOutcomeToast(isWin, payout, tradeId) {
    if (tradeId) {
      if (outcomeToastSeen[tradeId]) return;
      outcomeToastSeen[tradeId] = true;
    }
    var el = document.getElementById('outcomeToast');
    var stage = document.querySelector('.chart-stage');
    if (!el) {
      el = document.createElement('div');
      el.id = 'outcomeToast';
      el.className = 'chart-outcome';
      el.setAttribute('aria-live', 'assertive');
      el.setAttribute('role', 'status');
      if (stage) stage.appendChild(el);
      else document.body.appendChild(el);
    } else if (stage && el.parentElement !== stage) {
      stage.appendChild(el);
    }
    var amount = Math.abs(Number(payout) || 0);
    el.className = 'chart-outcome show ' + (isWin ? 'win' : 'lose');
    el.textContent = isWin ? ('+' + D6.fmtFCFA(amount)) : '+0 FCFA';
    clearTimeout(outcomeToastTimer);
    outcomeToastTimer = setTimeout(function () {
      el.className = 'chart-outcome';
      el.textContent = '';
    }, isWin ? 2800 : 1800);
  }

  document.addEventListener('orolado-trade-settled', function (ev) {
    var d = (ev && ev.detail) || {};
    if (d.voided) {
      updateBalance(true);
      patchHistorySoon();
      syncTradeButtons();
      return;
    }
    var amount = d.isWin ? (d.net != null ? Math.abs(Number(d.net)) : (d.payout != null ? d.payout : 0)) : 0;
    showOutcomeToast(!!d.isWin, amount, d.tradeId);
    updateBalance(true);
    patchHistorySoon();
    syncTradeButtons();
  });

  function clearErrors() {
    document.querySelectorAll('.err-msg').forEach(function (el) {
      el.textContent = '';
      el.classList.remove('on');
    });
  }

  function showFieldError(field, msg) {
    var el = $('err-' + field);
    if (el) { el.textContent = msg; el.classList.add('on'); }
    else toast(msg, 'err');
  }

  var audioCtx = null;

  function soundOn() {
    var u = user();
    return !(u && u.settings && u.settings.sound === false);
  }

  function getAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function unlockAudio() {
    var ctx = getAudio();
    if (!ctx) return;
    if (ctx.state !== 'suspended') return;
    ctx.resume();
    try {
      var buf = ctx.createBuffer(1, 1, 22050);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) { /* ignore */ }
  }

  function playTap() {
    if (!soundOn()) return;
    var ctx = getAudio();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) { /* ignore */ }
  }

  function playWinChime() {
    if (!soundOn()) return;
    var ctx = getAudio();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      function tone(freq0, freq1, start, dur, vol, type) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq0, now + start);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq1), now + start + dur * 0.55);
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.02);
      }
      tone(523, 784, 0, 0.28, 0.16, 'sine');
      tone(659, 988, 0.08, 0.3, 0.12, 'triangle');
      tone(784, 1175, 0.16, 0.34, 0.1, 'sine');
    } catch (e) { /* ignore */ }
  }

  function playLossThud() {
    if (!soundOn()) return;
    var ctx = getAudio();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) { /* ignore */ }
  }

  function playNeutralTick() {
    playLossThud();
  }

  function burstSparkle() {
    var layer = $('sparkle');
    layer.hidden = false;
    layer.innerHTML = '';
    var i;
    for (i = 0; i < 18; i++) {
      var bit = document.createElement('i');
      bit.style.left = (42 + Math.random() * 16) + '%';
      bit.style.top = (38 + Math.random() * 18) + '%';
      bit.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      bit.style.setProperty('--dy', (Math.random() * -120 - 20) + 'px');
      bit.style.background = Math.random() > 0.4 ? '#FFD700' : '#00E676';
      layer.appendChild(bit);
    }
    setTimeout(function () { layer.hidden = true; layer.innerHTML = ''; }, 800);
  }

  function fillLangBars() {
    function render(boxId) {
      var box = $(boxId);
      if (!box) return;
      var cur = LANGS.filter(function (l) { return l.code === D6.I18N.lang; })[0] || LANGS[0];
      box.innerHTML = '<button type="button" class="lang-dd-btn" data-lang-toggle="1"><span class="lang-flag">' + cur.flag + '</span><span class="lang-chev">▾</span></button>' +
        '<div class="lang-dd-menu hidden">' + LANGS.map(function (l) {
          return '<button type="button" class="lang-btn' + (l.code === D6.I18N.lang ? ' on' : '') + '" data-lang="' + l.code + '">' + l.flag + '</button>';
        }).join('') + '</div>';
    }
    render('langBarAuth');
    render('langBarTrade');
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var menu = btn.parentElement.querySelector('.lang-dd-menu');
        document.querySelectorAll('.lang-dd-menu').forEach(function (m) {
          if (m !== menu) m.classList.add('hidden');
        });
        menu.classList.toggle('hidden');
      });
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        D6.I18N.set(btn.dataset.lang);
        fillLangBars();
        if (user()) setModeUi(user());
        renderHistory();
        if (!$('screenAdmin').classList.contains('hidden')) renderAdmin();
      });
    });
  }

  function fillCountrySelects() {
    var html = D6.CONFIG.COUNTRY_CODES.map(function (c) {
      return '<option value="' + c.code + '">' + c.flag + ' ' + c.code + '</option>';
    }).join('');
    ['loginCountry', 'regCountry', 'resetCountry', 'wdCountry', 'depCountry'].forEach(function (id) {
      var el = $(id);
      if (el) el.innerHTML = html;
    });
  }

  function setAdminBtns(u) {
    $('btnAdmin2').classList.toggle('hidden', !D6.Auth.isAdmin(u));
  }

  function setModeUi(u) {
    if (!u) return;
    var demo = u.mode !== 'real';
    document.querySelectorAll('.mode-btn').forEach(function (el) {
      el.classList.toggle('on', el.dataset.mode === (demo ? 'demo' : 'real'));
    });
    setModeChrome(u);
  }

  function switchMode(next) {
    var u = user();
    if (!u) return;
    if (next === 'real' && !requireAccount()) {
      setModeUi(u);
      return;
    }
    var mode = u.mode === 'real' ? 'real' : 'demo';
    if (D6.Engine.liveCount && D6.Engine.liveCount(mode)) return;
    u.mode = next === 'real' ? 'real' : 'demo';
    D6.Store.saveUser(u);
    stake = D6.CONFIG.MIN_STAKE || 100;
    if ($('inputStake')) $('inputStake').value = stake;
    setModeUi(u);
    updateBalance(true);
    updatePayoutUi();
    renderHistory();
    syncTradeButtons();
  }

  function updateBalance(flash) {
    var u = user();
    if (!u) return;
    var demo = D6.Store.demoBalance(u);
    var real = D6.Store.realBalance ? D6.Store.realBalance(u) : 0;
    var active = u.mode === 'real' ? real : demo;
    $('balanceDisplay').textContent = D6.fmtFCFA(active);
    if ($('balanceAlt')) {
      $('balanceAlt').textContent = '';
      $('balanceAlt').hidden = true;
    }
    setModeChrome(u);
    if (flash) {
      var card = $('balanceCard');
      card.classList.remove('flash');
      void card.offsetWidth;
      card.classList.add('flash');
    }
  }

  function updatePayoutUi() {
    var u = user();
    if (!u || !$('payoutV100')) return;
    var ids = ['v100', 'stable', 'v75', 'crash300', 'boom300'];
    var map = { v100: 'payoutV100', stable: 'payoutStable', v75: 'payoutV75', crash300: 'payoutCrash300', boom300: 'payoutBoom300' };
    ids.forEach(function (id) {
      var el = $(map[id]);
      if (!el) return;
      var live = D6.Engine.payoutLive && D6.Engine.payoutLive[id];
      el.textContent = live ? ('+' + Math.round((live - 1) * 100) + '%') : '+88%';
    });
    var stake = Math.max(D6.CONFIG.MIN_STAKE, Math.floor(Number($('inputStake').value) || 100));
    var mult = (D6.Engine.payoutLive && D6.Engine.payoutLive[assetId(u)]) || D6.CONFIG.REAL_PAYOUT || 1.88;
    if ($('previewGain')) $('previewGain').textContent = D6.fmtFCFA(Math.floor(stake * mult));
    if ($('previewMult')) $('previewMult').textContent = '×' + Number(mult).toFixed(2);
  }

  function updateAssetUi() {
    var u = user();
    if (!u) return;
    var id = assetId(u);
    document.querySelectorAll('.asset-chip').forEach(function (el) {
      el.classList.toggle('on', el.dataset.asset === id);
    });
    var asset = D6.CONFIG.ASSETS[id];
    $('assetLiveName').textContent = asset.name;
    $('assetLiveTag').textContent = asset.tag;
    D6.Chart.setAsset(id);
    updatePayoutUi();
  }

  function updateDurationUi() {
    var u = user();
    if (!u) return;
    document.querySelectorAll('.dur-chip').forEach(function (el) {
      el.classList.toggle('on', Number(el.dataset.dur) === u.duration);
    });
  }

  function updatePriceHud() {
    var u = user();
    if (!u) return;
    var market = D6.Engine.getMarket(assetId(u));
    var trade = D6.Engine.getTrade();
    $('currentPrice').textContent = D6.fmtPrice(market.price);
    var pnl = $('livePnl');
    if (!trade) {
      pnl.textContent = '—';
      pnl.className = 'pnl-value idle';
      return;
    }
    var left = trade.timeLeft || 0;
    var panel = $('timerPanel');
    if (panel) {
      panel.hidden = false;
      panel.classList.add('active');
      panel.classList.remove('win', 'lose');
      if ($('timerSeconds')) $('timerSeconds').textContent = fmtTimerLeft(left);
      if ($('timerResult')) $('timerResult').textContent = '';
      if ($('timerProgress') && trade.duration) {
        var pct = Math.max(0, Math.min(100, (left / trade.duration) * 100));
        $('timerProgress').style.width = pct + '%';
      }
    }
    if (left <= 0.05 && D6.Engine.flushSettlements) D6.Engine.flushSettlements(u);
    var diff = market.price - trade.entryPrice;
    var winning = (trade.side === 'call' && diff > 0) || (trade.side === 'put' && diff < 0);
    pnl.textContent = (diff >= 0 ? '+' : '') + diff.toFixed(2) + ' pts';
    pnl.className = 'pnl-value ' + (winning ? 'up' : 'down');
  }

  function isMobileLayout() {
    return !window.matchMedia('(min-width:860px)').matches;
  }

  function histLimit() {
    return 2;
  }

  function orderRow(h) {
    var stake = Number(h.stake || 0);
    var net = h.net != null ? Number(h.net) : (h.won ? Math.floor(stake * Number(h.payout || 1.88)) - stake : -stake);
    var label;
    var cls;
    if (h.voided || h.status === 'void') {
      label = 'Égalité 0';
      cls = 'void';
      net = 0;
    } else if (h.won) {
      label = 'Gagné +' + D6.fmtFCFA(Math.abs(net));
      cls = 'win';
    } else {
      label = '+0 FCFA';
      cls = 'lose';
      net = -stake;
    }
    return '<div class="h-item ' + cls + '">' +
      '<span class="h-badge ' + h.side + '">' + (h.side === 'call' ? 'CALL' : 'PUT') + '</span>' +
      '<div><div class="h-main">' + (h.clock || '') + ' · ' + h.assetName + ' · ' + (h.duration || '') + 's</div>' +
      '<div class="h-time">' + D6.fmtFCFA(stake) + ' · ' + label + '</div></div>' +
      '<span class="h-gain ' + (h.won ? 'w' : (h.voided ? '' : 'l')) + '">' +
      (h.won ? ('+' + D6.fmtFCFA(Math.abs(net))) : (h.voided ? '0' : '+0')) + '</span></div>';
  }

  function liveOrderRow(t) {
    var asset = D6.CONFIG.ASSETS[t.assetId];
    var name = (asset && (asset.short || asset.name)) || t.assetId;
    var left = Math.max(0, Number(t.timeLeft) || 0);
    return '<div class="h-item live">' +
      '<span class="h-badge ' + t.side + '">' + (t.side === 'call' ? 'CALL' : 'PUT') + '</span>' +
      '<div><div class="h-main">' + name + ' · EN COURS · ' + fmtTimerLeft(left) + '</div>' +
      '<div class="h-time">' + D6.fmtFCFA(t.stake) + ' · ' + (t.duration || '') + 's</div></div>' +
      '<span class="h-gain">' + fmtTimerLeft(left) + '</span></div>';
  }

  function ordersForMode(u) {
    var mode = u && u.mode === 'real' ? 'real' : 'demo';
    var live = (D6.Engine.getTrades ? D6.Engine.getTrades(mode) : []).filter(function (t) {
      return !t.mode || t.mode === mode;
    });
    live.sort(function (a, b) { return (b.startTime || 0) - (a.startTime || 0); });
    var settled = ((u && u.positions) || []).filter(function (p) {
      return !p.mode || p.mode === mode;
    });
    return { live: live, settled: settled };
  }

  function renderHistory() {
    var u = user();
    var feed = $('historyFeed');
    if (!feed) return;
    var orders = ordersForMode(u);
    var html = [];
    var remain = histLimit();
    var i;
    for (i = 0; i < orders.live.length && remain > 0; i++, remain--) html.push(liveOrderRow(orders.live[i]));
    for (i = 0; i < orders.settled.length && remain > 0; i++, remain--) html.push(orderRow(orders.settled[i]));
    feed.innerHTML = html.length ? html.join('') : '<div class="empty-feed">' + t('noTradesHint') + '</div>';
  }

  function renderHistorySheet() {
    var el = $('historySheetFeed');
    if (!el) return;
    if ($('histSheetTitle')) $('histSheetTitle').textContent = 'Historique des trades (Compte Réel)';
    var u = user();
    var settled = ((u && u.positions) || []).filter(function (p) {
      return p.mode === 'real';
    });
    var rows = [];
    function durLabel(d) {
      d = Number(d) || 0;
      if (d >= 60) return (d / 60) + ' min';
      return d + 's';
    }
    settled.slice(0, 50).forEach(function (h) {
      var stake = Number(h.stake || 0);
      var payoutAmt = Math.floor(stake * Number(h.payout || 1.88));
      var net = h.voided || h.status === 'void' ? 0 : (h.won ? (payoutAmt - stake) : -stake);
      var res = (h.voided || h.status === 'void') ? 'Égalité' : (h.won ? 'Gagné' : 'Perdu');
      var pnlCls = net > 0 ? 'w' : (net < 0 ? 'l' : '');
      var pnlTxt = (net > 0 ? '+' : (net < 0 ? '−' : '')) + D6.fmtFCFA(Math.abs(net));
      rows.push('<tr><td>' + (h.clock || fmtWhen(h.at)) + '</td><td>' + (h.assetName || h.assetId || '—') +
        '</td><td>' + (h.side === 'call' ? 'CALL' : 'PUT') + '</td><td>' + D6.fmtFCFA(stake) +
        '</td><td>' + res + ' · ' + durLabel(h.duration) + '</td><td class="' + pnlCls + '">' + pnlTxt + '</td></tr>');
    });
    el.innerHTML = rows.length
      ? '<table class="hist-table"><thead><tr><th>Heure</th><th>Actif</th><th>Sens</th><th>Montant</th><th>Résultat</th><th>P&amp;L</th></tr></thead><tbody>' +
        rows.join('') + '</tbody></table>'
      : '<div class="empty-feed">Aucun trade réel pour l’instant</div>';
  }

  function maybeLossStreakTip(u) {
    if (!u || (u.consecutiveLosses || 0) < 5) return;
    if (u.lossTipShownAt && (Date.now() - Number(u.lossTipShownAt)) < 600000) return;
    u.lossTipShownAt = Date.now();
    D6.Store.saveUser(u);
    openModal('tipModal');
  }

  function maybeConvertPrompt(u, res) {
    if (!u) return;
    var mode = (res && res.position && res.position.mode) || (res && res.trade && res.trade.mode) || u.mode;
    if (mode !== 'demo') return;
    if ((u.demoTrades || 0) < 5) return;
    if (u.convertPrompted) return;
    u.convertPrompted = true;
    D6.Store.saveUser(u);
    pendingConvert = true;
  }

  function profitFromResult(res) {
    if (!res) return 0;
    if (res.won) {
      if (res.net != null) return Math.abs(Number(res.net));
      if (res.position && res.position.stake) {
        return Math.floor(Number(res.position.stake) * Number(res.position.payout || 1.88)) - Number(res.position.stake);
      }
    }
    return 0;
  }

  function patchHistorySoon() {
    if (histPatch) return;
    histPatch = setTimeout(function () {
      histPatch = 0;
      renderHistory();
    }, 80);
  }

  function syncTradeButtons() {
    var u = user();
    var mode = u && u.mode === 'real' ? 'real' : 'demo';
    var n = D6.Engine.liveCount ? D6.Engine.liveCount(mode) : (D6.Engine.getTrades ? D6.Engine.getTrades(mode).length : 0);
    var max = (D6.CONFIG && D6.CONFIG.MAX_OPEN) || 2;
    var busy = n >= max;
    var lock = cooling || busy;
    $('btnCall').disabled = lock;
    $('btnPut').disabled = lock;
    $('btnCall').classList.toggle('locked', busy);
    $('btnPut').classList.toggle('locked', busy);
    var hint = $('tradeLockHint');
    if (hint) hint.classList.toggle('on', busy);
  }

  function armTradeCooldown() {
    cooling = true;
    var row = document.querySelector('.trade-row');
    if (row) row.classList.add('cooldown');
    $('btnCall').classList.add('cooldown');
    $('btnPut').classList.add('cooldown');
    setTradingLocked(true);
    setTimeout(function () {
      cooling = false;
      if (row) row.classList.remove('cooldown');
      $('btnCall').classList.remove('cooldown');
      $('btnPut').classList.remove('cooldown');
      syncTradeButtons();
    }, D6.CONFIG.MIN_ORDER_MS);
  }

  function fillProfile() {
    var u = user();
    if (!u) return;
    $('profName').textContent = u.displayName || 'Trader';
    $('profAvatar').textContent = (u.displayName || 'OR').slice(0, 2).toUpperCase();
    if ($('profPublicId')) $('profPublicId').textContent = u.publicId || '—';
    $('profEmail').textContent = u.email;
    var phone = String(u.phone || '').replace(/\D/g, '');
    $('profPhone').textContent = phone && phone !== '0000000000'
      ? ((u.countryCode || '') + ' ' + u.phone)
      : '—';
    setAdminBtns(u);
  }

  function openDrawer() {
    fillProfile();
    $('drawerBackdrop').classList.add('on');
    $('drawerProfile').classList.add('on');
  }
  function closeDrawer() {
    $('drawerBackdrop').classList.remove('on');
    $('drawerProfile').classList.remove('on');
  }

  var adminCache = { users: [], messages: [] };

  async function renderAdmin() {
    var remote = D6.Api ? await D6.Api.post('admin', {}) : null;
    var m = (remote && remote.ok && remote.metrics) ? remote.metrics : D6.Store.metrics();
    var users = (remote && remote.ok && remote.users) ? remote.users : D6.Store.listUsers();
    var wd = (remote && remote.ok && remote.withdrawals) ? remote.withdrawals : D6.Store.listWithdrawals();
    var msgs = (remote && remote.ok && remote.messages) ? remote.messages : [];
    adminCache.users = users;
    adminCache.messages = msgs;
    $('mDeposits').textContent = D6.fmtFCFA(m.deposits || 0);
    $('mPending').textContent = D6.fmtFCFA(m.withdrawals != null ? m.withdrawals : m.pending || 0);
    if ($('mExposure')) $('mExposure').textContent = D6.fmtFCFA(m.exposure || 0);
    $('mProfit').textContent = D6.fmtFCFA(m.profit != null ? m.profit : 0);
    $('mUsers').textContent = String(m.users || 0);
    renderAdminUsers(($('adminSearch') && $('adminSearch').value) || '');
    if (!wd.length) $('adminWithdrawals').innerHTML = '<div class="empty-feed">' + t('noWithdraw') + '</div>';
    else {
      var wrows = wd.map(function (w) {
        var badge = w.suspect ? ' <span class="badge-suspect">' + t('suspect') + '</span>' : '';
        var acts = w.status === 'pending'
          ? '<button class="mini ok" data-wd="' + w.id + '" data-ok="1">' + t('approve') + '</button> <button class="mini bad" data-wd="' + w.id + '" data-ok="0">' + t('reject') + '</button>'
          : w.status;
        var dest = (w.operator || '') + ' ' + (w.countryCode || '') + ' ' + (w.phone || '') + (w.beneficiary ? ' · ' + w.beneficiary : '');
        return '<tr><td>' + w.name + '</td><td>' + D6.fmtFCFA(w.amount) + '</td><td>' + dest + '<div class="h-time">' + (w.clock || '') + badge + '</div></td><td>' + acts + '</td></tr>';
      }).join('');
      $('adminWithdrawals').innerHTML = '<table class="admin-table"><thead><tr><th>Joueur</th><th>Montant</th><th>Mobile Money</th><th></th></tr></thead><tbody>' + wrows + '</tbody></table>';
    }
    var deps = (remote && remote.ok && remote.deposits) ? remote.deposits : [];
    if ($('adminDeposits')) {
      if (!deps.length) $('adminDeposits').innerHTML = '<div class="empty-feed">' + t('noDeposit') + '</div>';
      else {
        var drows = deps.map(function (d) {
          var acts = '<button class="mini ok" data-dep="' + d.ref + '" data-amt="' + d.amount + '" data-ok="1">' + t('approve') + '</button>' +
            ' <button class="mini bad" data-dep="' + d.ref + '" data-ok="0">' + t('reject') + '</button>';
          return '<tr><td>' + (d.publicId || d.name || '') + '<div class="h-time">' + (d.email || '') + '</div></td><td>' + D6.fmtFCFA(d.amount) +
            '</td><td>' + (d.operator || '') + '<div class="h-time">' + d.ref + '</div></td><td>' + acts + '</td></tr>';
        }).join('');
        $('adminDeposits').innerHTML = '<table class="admin-table"><thead><tr><th>Joueur</th><th>Montant</th><th>Référence</th><th></th></tr></thead><tbody>' + drows + '</tbody></table>';
      }
    }
    if ($('adminMessages')) {
      if (!msgs.length) $('adminMessages').innerHTML = '<div class="empty-feed">Aucun message</div>';
      else {
        var mrows = msgs.map(function (msg) {
          var acts = msg.status === 'ouvert'
            ? '<button class="mini ok" data-msg="' + msg.id + '">Résoudre</button>'
            : (msg.status || 'resolu');
          return '<tr><td>' + (msg.publicId || '') + '<div class="h-time">' + (msg.email || '') + '</div></td><td>' + (msg.subject || '') +
            '<div class="h-time">' + (msg.message || '') + '</div></td><td>' + acts + '</td></tr>';
        }).join('');
        $('adminMessages').innerHTML = '<table class="admin-table"><thead><tr><th>User</th><th>Message</th><th></th></tr></thead><tbody>' + mrows + '</tbody></table>';
      }
    }
  }

  function renderAdminUsers(q) {
    q = String(q || '').trim().toLowerCase();
    var users = adminCache.users || [];
    var filtered = !q ? users : users.filter(function (u) {
      var blob = [(u.publicId || ''), u.email || '', u.displayName || '', u.phone || '', (u.countryCode || '') + (u.phone || '')].join(' ').toLowerCase();
      return blob.indexOf(q) >= 0;
    });
    if (!filtered.length) $('adminUsers').innerHTML = '<div class="empty-feed">' + t('noUsers') + '</div>';
    else {
      var rows = filtered.map(function (u) {
        var d = (u.createdAt || '').slice(0, 10);
        return '<tr data-user="' + u.id + '"><td>' + (u.publicId || '') + '</td><td>' + (u.displayName || '') + '</td><td>' + u.email + '</td><td>' + (u.countryCode || '') + ' ' + (u.phone || '') +
          '</td><td>' + D6.fmtFCFA(u.realBalance) + '</td><td>' + d + '</td></tr>';
      }).join('');
      $('adminUsers').innerHTML = '<table class="admin-table"><thead><tr><th>ID</th><th>Nom</th><th>E-mail</th><th>Téléphone</th><th>Solde réel</th><th>Date</th></tr></thead><tbody>' + rows + '</tbody></table>';
    }
  }

  function openAdminUser(uid) {
    var u = (adminCache.users || []).find(function (x) { return x.id === uid; });
    var box = $('adminUserDetail');
    if (!u || !box) return;
    box.classList.remove('hidden');
    box.innerHTML = '<div class="convert-title">' + (u.publicId || '') + ' · ' + (u.displayName || '') + '</div>' +
      '<div class="h-time">' + u.email + ' · ' + (u.countryCode || '') + ' ' + (u.phone || '') + ' · inscrit ' + (u.createdAt || '').slice(0, 10) + '</div>' +
      '<div class="list-row"><span>Réel</span><strong>' + D6.fmtFCFA(u.realBalance) + '</strong></div>' +
      '<div class="list-row"><span>Démo</span><strong>' + D6.fmtFCFA(u.demoBalance) + '</strong></div>' +
      '<div class="field"><label>' + t('adjustReason') + '</label><input id="adjMotif" maxlength="120" placeholder="bonus, correction…"></div>' +
      '<div class="field"><label>Montant (FCFA)</label><input id="adjAmount" type="number" inputmode="numeric" min="1" step="100" value="50000"></div>' +
      '<div class="admin-adj-row">' +
      '<select id="adjMode"><option value="real">Compte réel</option><option value="demo">Compte démo</option></select>' +
      '<button class="mini ok" type="button" data-adj-act="credit" data-adj="' + u.id + '">+ Créditer</button>' +
      '<button class="mini bad" type="button" data-adj-act="debit" data-adj="' + u.id + '">− Débiter</button>' +
      '<button class="mini" type="button" data-adj="' + u.id + '" data-mode="demo" data-reset="1">Reset démo 1M</button>' +
      '</div>';
  }

  function setTradingLocked(on) {
    if (on) {
      $('btnCall').disabled = true;
      $('btnPut').disabled = true;
      return;
    }
    syncTradeButtons();
  }

  function applyOutcome(res) {
    if (!res) return;
    var id = res.trade && res.trade.id;
    if (id) {
      if (hudSeen[id]) return;
      hudSeen[id] = true;
    }
    updateBalance(true);
    if (res.voided) {
      toast('Égalité — mise rendue', '');
      playNeutralTick();
    } else {
      showOutcomeToast(!!res.won, profitFromResult(res), id);
      if (res.won) {
        playWinChime();
        burstSparkle();
      } else {
        playNeutralTick();
      }
    }
    maybeConvertPrompt(user(), res);
    maybeLossStreakTip(user());
    patchHistorySoon();
    syncTradeButtons();
    if (pendingConvert && !(D6.Engine.liveCount && D6.Engine.liveCount())) {
      pendingConvert = false;
      setTimeout(function () {
        if (!D6.Engine.getTrade()) openModal('convertModal');
      }, 900);
    }
    if (D6.Api && D6.Api.token() && id) {
      D6.Api.post('settleOrder', {
        orderId: id,
        won: !!res.won,
        voided: !!res.voided,
        net: res.net,
        exitPrice: res.exitPrice || res.closePrice
      }).then(refreshRemoteVault, refreshRemoteVault);
    }
    if (D6.Supabase && D6.Supabase.syncNow) D6.Supabase.syncNow();
  }

  function execute(side) {
    var now = performance.now();
    if (now - lastClickAt < D6.CONFIG.MIN_ORDER_MS) return;
    lastClickAt = now;
    var u = user();
    if (!u) return;
    var mode = u.mode === 'real' ? 'real' : 'demo';
    var open = D6.Engine.liveCount ? D6.Engine.liveCount(mode) : 0;
    var maxOpen = (D6.CONFIG && D6.CONFIG.MAX_OPEN) || 2;
    if (open >= maxOpen) {
      toast(t('maxPositions'), 'err');
      syncTradeButtons();
      return;
    }
    stake = Math.max(D6.CONFIG.MIN_STAKE, Math.floor(Number($('inputStake').value) || stake));
    $('inputStake').value = stake;
    if (D6.Store.balanceOf(u) < stake) {
      if (mode === 'real') {
        openDeposit('Solde insuffisant pour miser. Rechargez votre compte');
      } else {
        toast(t('insufficient'), 'err');
      }
      return;
    }
    playTap();
    var res = D6.Engine.placeOrder(u, { side: side, stake: stake, duration: u.duration, assetId: assetId(u) });
    if (!res.ok) {
      if (mode === 'real' && /insuffisant/i.test(String(res.reason || ''))) {
        openDeposit('Solde insuffisant pour miser. Rechargez votre compte');
      } else {
        toast(res.reason, 'err');
      }
      syncTradeButtons();
      return;
    }
    updateBalance(true);
    updatePriceHud();
    patchHistorySoon();
    armTradeCooldown();
    syncTradeButtons();
    if (D6.Api && D6.Api.token()) {
      D6.Api.post('placeOrder', {
        id: res.trade.id,
        stake: stake,
        side: side,
        duration: u.duration,
        mode: mode,
        assetId: res.trade.assetId,
        entryPrice: res.trade.entryPrice
      }).then(function (remote) {
        var cur = user();
        if (remote && remote.ok && remote.vault && cur && mode !== 'real') {
          // Ne pas écraser le vault local tant que des trades sont ouverts (multi-place).
          if (!(D6.Engine.liveCount && D6.Engine.liveCount(mode) > 0)) {
            D6.Store.importRemote(cur, remote.vault);
            updateBalance(true);
          }
        }
      });
    }
  }

  function checkoutUrlSafe(url, u) {
    if (!url || !/^https?:\/\//i.test(url)) return '';
    if (u && u.email) {
      var em = String(u.email).toLowerCase();
      if (url.toLowerCase().indexOf(em) >= 0) return '';
      if (url.toLowerCase().indexOf(encodeURIComponent(u.email).toLowerCase()) >= 0) return '';
    }
    return url;
  }

  // L'admin peut tester avec 100 FCFA, les joueurs restent au minimum public.
  function minDeposit() {
    return D6.Auth.isAdmin(user()) ? 100 : (D6.CONFIG.MIN_DEPOSIT || 1000);
  }

  function setDepositAmt(n) {
    var min = minDeposit();
    var amt = Math.max(min, Math.floor(Number(n) || 0));
    if ($('depositAmt')) $('depositAmt').value = amt || '';
    return amt;
  }

  function openDeposit(preMsg) {
    if (!requireAccount()) return;
    var u = user();
    depositOp = depositOp || 'wave';
    document.querySelectorAll('#depOpGrid .op-card').forEach(function (c) {
      c.classList.toggle('on', c.dataset.op === depositOp);
    });
    var min = minDeposit();
    if ($('depositAmt')) {
      $('depositAmt').value = '';
      $('depositAmt').min = String(min);
      $('depositAmt').placeholder = String(min);
    }
    if (preMsg) toast(preMsg, 'err');
    var hint = $('depositModal') ? $('depositModal').querySelector('.hint-min') : null;
    if (hint) hint.textContent = 'Minimum ' + D6.fmtFCFA(min);
    closeDrawer();
    closeModal('convertModal');
    openModal('depositModal');
  }

  var depositing = false;
  var depositWatch = 0;
  var payWindow = null;
  var depositApplied = false;
  var depositChecking = false;
  var depositRef = '';
  var depositReturn = null;

  async function ensureApiToken() {
    if (D6.Api && D6.Api.token && D6.Api.token()) return D6.Api.token();
    try {
      if (D6.Supabase && D6.Supabase.client) {
        var sb = D6.Supabase.client();
        if (sb && sb.auth && sb.auth.getSession) {
          var sess = await sb.auth.getSession();
          var tok = sess && sess.data && sess.data.session && sess.data.session.access_token;
          if (tok && D6.Api && D6.Api.setToken) {
            D6.Api.setToken(tok);
            return tok;
          }
        }
      }
    } catch (e) {
      console.warn('OROLADO session', e);
    }
    return '';
  }

  async function postDepositInitiate(payload) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 28000);
    try {
      var r = await fetch('api/deposit/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: ctrl.signal
      });
      clearTimeout(timer);
      if (r.ok) {
        var json = await r.json();
        if (json) return json;
      } else {
        console.error('OROLADO deposit initiate HTTP', r.status);
      }
    } catch (e) {
      console.error('OROLADO deposit initiate', e);
    }
    clearTimeout(timer);
    return D6.Api.post('initiateDeposit', payload, 28000);
  }

  async function postDepositConfirm(payload) {
    // Délai borné : la vérification rend toujours la main à l'interface.
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    try {
      var r = await fetch('api/deposit/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: ctrl ? ctrl.signal : undefined
      });
      if (r.ok) return await r.json();
    } catch (e) {
      console.error('OROLADO deposit confirm', e);
    } finally {
      clearTimeout(timer);
    }
    return D6.Api.post('confirmDeposit', payload, 20000);
  }

  function stopDepositWatch() {
    if (depositWatch) {
      clearInterval(depositWatch);
      depositWatch = 0;
    }
  }

  var OP_LABELS = { wave: 'Wave', orange: 'Orange Money', mtn: 'MTN MoMo', moov: 'Moov Money' };

  function opLabel() {
    return OP_LABELS[depositOp] || 'Wave';
  }

  function setWaitNote(msg, kind) {
    var el = $('depositWaitNote');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'wait-note' + (kind ? ' ' + kind : '');
  }

  function setWaitBusy(on) {
    var sp = $('depositWaitSpin');
    if (sp) sp.hidden = !on;
  }

  function openDepositWait(ref) {
    depositRef = ref || '';
    if ($('depositWaitTitle')) $('depositWaitTitle').textContent = t('depositWaitTitle').replace('{op}', opLabel());
    if ($('depositWaitRef')) $('depositWaitRef').textContent = ref ? ('Réf. ' + ref) : '';
    var btn = $('btnDepositCheck');
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('depositCheckBtn').replace('{op}', opLabel());
    }
    setWaitNote('', '');
    setWaitBusy(false);
    openModal('depositWaitModal');
  }

  // Retour de paiement détecté dans l'URL : on ouvre tout de suite la modale
  // « Validation de votre dépôt en cours… » avant d'interroger le serveur.
  function openDepositVerify(ref) {
    depositRef = ref || depositRef;
    if ($('depositWaitTitle')) $('depositWaitTitle').textContent = t('depositVerifyTitle');
    if ($('depositWaitRef')) $('depositWaitRef').textContent = depositRef ? ('Réf. ' + depositRef) : '';
    var btn = $('btnDepositCheck');
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('depositChecking').replace('{op}', opLabel());
    }
    setWaitNote('', '');
    setWaitBusy(true);
    openModal('depositWaitModal');
  }

  // Clic sur « J'ai validé mon paiement » : une seule interrogation du serveur,
  // qui vérifie auprès de Maketou. Jamais de chargement infini.
  async function checkDepositNow(manual) {
    if (depositChecking) return;
    var btn = $('btnDepositCheck');
    depositChecking = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('depositChecking').replace('{op}', opLabel());
    }
    setWaitNote('', '');
    setWaitBusy(true);
    try {
      var ref = depositRef;
      try { if (!ref) ref = sessionStorage.getItem('oro_dep_ref') || localStorage.getItem('oro_dep_ref') || ''; } catch (e0) { ref = ''; }
      var tok = await ensureApiToken();
      var remote = await postDepositConfirm({
        token: tok || (D6.Api && D6.Api.token ? D6.Api.token() : ''),
        ref: ref,
        manual: !!manual,
        returnStatus: (depositReturn && depositReturn.state) || '',
        returnParams: (depositReturn && depositReturn.params) || null
      });
      applyDepositPaid(remote);
      if (!depositApplied) setWaitNote(t('depositPending'), 'warn');
    } catch (e) {
      setWaitNote(t('depositPending'), 'warn');
    } finally {
      depositChecking = false;
      setWaitBusy(false);
      if (btn && !depositApplied) {
        btn.disabled = false;
        btn.textContent = t('depositCheckBtn').replace('{op}', opLabel());
      }
      if (!depositApplied && $('depositWaitTitle')) {
        $('depositWaitTitle').textContent = t('depositWaitTitle').replace('{op}', opLabel());
      }
    }
  }

  function applyDepositPaid(remote) {
    if (depositApplied) return;
    // Seul le serveur peut déclarer un dépôt payé : aucun crédit sur simple
    // retour de page, clic ou fermeture de l'onglet Maketou.
    if (!remote || !remote.ok) return;
    if (!(remote.paid || remote.success) || !(remote.amount > 0)) return;
    depositApplied = true;
    depositChecking = false;
    stopDepositWatch();
    setWaitBusy(false);
    closeModal('depositWaitModal');
    try {
      if (payWindow && !payWindow.closed) {
        var blank = ((location && location.origin) || 'https://orolado.com') + '/pay-blank.html';
        try { payWindow.location.replace(blank); } catch (e0) { /* cross-origin */ }
        try { payWindow.close(); } catch (eClose) { /* ignore */ }
        setTimeout(function () {
          try { if (payWindow && !payWindow.closed) payWindow.close(); } catch (e1) {}
          payWindow = null;
        }, 80);
      }
    } catch (e) { /* ignore */ }
    var u = user();
    var vault = remote.vault;
    if (!vault && remote.new_balance > 0) vault = { real: remote.new_balance };
    if (vault && u) D6.Store.importRemote(u, vault);
    D6.holdDepositReal = true;
    setTimeout(function () { D6.holdDepositReal = false; }, 25000);
    if (D6.Supabase && D6.Supabase.queueSync) D6.Supabase.queueSync();
    if (D6.Supabase && D6.Supabase.pullVault) {
      setTimeout(function () { D6.Supabase.pullVault(); }, 1800);
    }
    updateBalance(true);
    toast(t('depositCredited').replace('{amt}', D6.fmtFCFA(remote.amount)), 'ok');
    playWinChime();
    if ($('depositSuccessAmt')) $('depositSuccessAmt').textContent = D6.fmtFCFA(remote.amount);
    closeModal('depositModal');
    openModal('depositSuccessModal');
    depositRef = '';
    try { sessionStorage.removeItem('oro_dep_ref'); } catch (e2) { /* ignore */ }
    try { localStorage.removeItem('oro_dep_ref'); } catch (e3) { /* ignore */ }
    if (history.replaceState) history.replaceState({}, '', location.pathname + location.hash);
  }

  // Surveillance silencieuse en arrière-plan : elle crédite si le webhook
  // Maketou arrive, sans jamais bloquer l'écran.
  function startDepositWatch(ref) {
    if (depositApplied) return;
    stopDepositWatch();
    depositRef = ref || depositRef;
    var ticks = 0;
    async function tick() {
      ticks += 1;
      if (payWindow && payWindow.closed) payWindow = null;
      var tok = await ensureApiToken();
      var remote = await D6.Api.post('depositStatus', {
        token: tok || (D6.Api && D6.Api.token ? D6.Api.token() : ''),
        ref: ref || ''
      });
      applyDepositPaid(remote);
      if (depositApplied || ticks >= 60) stopDepositWatch();
    }
    depositWatch = setInterval(tick, 5000);
    tick();
  }

  function localMaketouCheckoutUrl(amt, op, ref) {
    var base = (D6.CONFIG && D6.CONFIG.MAKETOU_CHECKOUT) || 'https://welcome-6.mymaketou.shop/products/welcome/checkout';
    var first = 'Trader';
    var last = 'Orolado';
    var email = 'trader_' + Math.random().toString(16).slice(2, 10) + '@orolado-pay.com';
    var phone = '07' + String(Math.floor(10000000 + Math.random() * 89999999));
    var origin = (location && location.origin) || 'https://orolado.com';
    var dash = origin + '/?deposit=success' + (ref ? ('&ref=' + encodeURIComponent(ref)) : '');
    var returnUrl = origin + '/pay-blank.html' + (ref ? ('?ref=' + encodeURIComponent(ref)) : '');
    var q = new URLSearchParams();
    q.set('customPrice', String(amt));
    q.set('price', String(amt));
    q.set('amount', String(amt));
    q.set('firstName', first);
    q.set('lastName', last);
    q.set('firstname', first);
    q.set('lastname', last);
    q.set('email', email);
    q.set('phone', phone);
    q.set('phoneNumber', phone);
    q.set('country', 'CI');
    q.set('countryCode', 'CI');
    q.set('currency', 'XOF');
    q.set('operator', op || 'wave');
    q.set('payment_method', op || 'wave');
    q.set('step', 'payment');
    q.set('success_url', dash);
    q.set('return_url', returnUrl);
    q.set('redirect_url', dash);
    q.set('cancel_url', origin + '/?payment=cancel' + (ref ? '&ref=' + encodeURIComponent(ref) : ''));
    if (ref) q.set('ref', ref);
    return base + '?' + q.toString();
  }

  async function confirmDeposit() {
    if (depositing) return;
    var u = user();
    if (!u) {
      toast(t('sessionInvalid'), 'err');
      return;
    }
    var min = minDeposit();
    var amt = Math.floor(Number($('depositAmt') && $('depositAmt').value) || 0);
    if (amt < min) {
      showFieldError('depositAmt', t('depositMin'));
      toast(t('depositMin'), 'err');
      return;
    }
    var btn = $('btnConfirmDeposit');
    depositing = true;
    if (btn) {
      btn.disabled = true;
      btn.classList.add('busy');
      btn.textContent = t('depositBusy');
    }
    try {
      var tok = await ensureApiToken();
      if (!tok) {
        toast(t('sessionInvalid'), 'err');
        return;
      }
      var remote = await postDepositInitiate({
        token: tok,
        amount: amt,
        operator: depositOp
      });
      if (remote && !remote.ok) {
        console.error('OROLADO deposit fail', remote);
        var reason = String((remote && remote.reason) || '');
        if (/session/i.test(reason)) {
          toast(t('sessionInvalid'), 'err');
          return;
        }
      }
      var url = (remote && (remote.checkout_url || remote.url)) || '';
      var low = String(url).toLowerCase();
      if (low.indexOf('/products/welcome/checkout') >= 0 && low.indexOf('customprice=') < 0 && low.indexOf('paystral') < 0) {
        url = '';
      }
      if (!url || !/^https?:\/\//i.test(url)) {
        url = localMaketouCheckoutUrl(amt, depositOp, (remote && remote.ref) || '');
      }
      if (!url || !/^https?:\/\//i.test(url)) {
        console.error('OROLADO deposit: aucune URL checkout', remote);
        toast((remote && remote.reason) || t('sessionInvalid'), 'err');
        return;
      }
      try { sessionStorage.setItem('oro_dep_ref', (remote && remote.ref) || ''); } catch (e) { /* ignore */ }
      try { localStorage.setItem('oro_dep_ref', (remote && remote.ref) || ''); } catch (e2) { /* ignore */ }
      var ref = (remote && remote.ref) || '';
      depositApplied = false;
      closeModal('depositModal');
      payWindow = window.open(url, '_blank');
      if (!payWindow) {
        window.location.href = url;
        return;
      }
      openDepositWait(ref);
      startDepositWatch(ref);
    } catch (err) {
      console.error('OROLADO deposit', err);
      toast((err && err.message) || t('sessionInvalid'), 'err');
    } finally {
      depositing = false;
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('busy');
        btn.textContent = t('depositConfirm');
      }
    }
  }

  // Paramètres qu'un opérateur peut renvoyer au retour du paiement.
  var TX_REF_KEYS = ['ref', 'reference', 'tx_id', 'txid', 'tx_ref', 'transaction_id', 'transactionId',
    'trx_id', 'order_id', 'orderId', 'sell_id', 'sellId', 'checkout_id', 'payment_id', 'invoice_id'];
  var TX_STATE_KEYS = ['status', 'payment', 'deposit', 'payment_status', 'state', 'result'];
  var lastSilentConfirm = 0;

  function readDepositReturn() {
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { return { ref: '', fromUrl: false, canceled: false }; }
    var ref = '';
    for (var i = 0; i < TX_REF_KEYS.length && !ref; i++) {
      var raw = q.get(TX_REF_KEYS[i]) || '';
      ref = String(raw).replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
    }
    var state = '';
    for (var j = 0; j < TX_STATE_KEYS.length && !state; j++) state = String(q.get(TX_STATE_KEYS[j]) || '').toLowerCase();
    // Le backend reçoit les paramètres bruts : ils servent de preuve de retour
    // et sont tracés dans le journal Maketou.
    var params = {};
    q.forEach(function (v, k) { params[String(k).slice(0, 40)] = String(v).slice(0, 200); });
    var canceled = /cancel|abort|refus|declin/.test(state);
    var success = /success|paid|complete|approved|ok|^1$/.test(state);
    return { ref: ref, state: state, params: params, fromUrl: !!ref || success || canceled, canceled: canceled };
  }

  // Nettoie l'URL immédiatement : un rechargement ne rejoue pas la même requête.
  function scrubDepositUrl() {
    if (!history.replaceState) return;
    try {
      var q = new URLSearchParams(location.search);
      TX_REF_KEYS.concat(TX_STATE_KEYS).forEach(function (k) { q.delete(k); });
      var qs = q.toString();
      history.replaceState({}, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    } catch (e) { /* ignore */ }
  }

  async function checkDepositReturn(force) {
    var info = readDepositReturn();
    var hadUrlParams = info.fromUrl;
    if (force) info.fromUrl = true;
    var ref = info.ref;
    try { if (!ref) ref = sessionStorage.getItem('oro_dep_ref') || localStorage.getItem('oro_dep_ref') || ''; } catch (e) { /* ignore */ }
    if (hadUrlParams) scrubDepositUrl();
    if (info.canceled) {
      try { sessionStorage.removeItem('oro_dep_ref'); } catch (e0) { /* ignore */ }
      try { localStorage.removeItem('oro_dep_ref'); } catch (e1) { /* ignore */ }
      stopDepositWatch();
      return;
    }
    if (depositApplied) return;
    if (!info.fromUrl && !ref) return;
    if (hadUrlParams) depositReturn = { state: info.state, params: info.params };
    if (ref) {
      depositRef = ref;
      try { sessionStorage.setItem('oro_dep_ref', ref); } catch (e2) { /* ignore */ }
      try { localStorage.setItem('oro_dep_ref', ref); } catch (e3) { /* ignore */ }
    }
    if (info.fromUrl) {
      // Retour de paiement : validation automatique, visible et bornée.
      openDepositVerify(ref);
      await checkDepositNow();
      if (!depositApplied && ref) startDepositWatch(ref);
      return;
    }
    var now = Date.now();
    if (now - lastSilentConfirm < 30000) return;
    lastSilentConfirm = now;
    var tok = await ensureApiToken();
    var remote = await postDepositConfirm({
      token: tok || (D6.Api && D6.Api.token ? D6.Api.token() : ''),
      ref: ref,
      returnStatus: (depositReturn && depositReturn.state) || '',
      returnParams: (depositReturn && depositReturn.params) || null
    });
    applyDepositPaid(remote);
  }

  async function refreshRemoteVault() {
    var u = user();
    if (!u) return;
    if (D6.Supabase && D6.Supabase.pullVault) {
      await D6.Supabase.pullVault();
    }
    if (D6.Engine && D6.Engine.liveCount && D6.Engine.liveCount()) return;
    if (D6.Api && D6.Api.token && D6.Api.token()) {
      var remote = await D6.Api.post('me', {});
      if (remote && remote.ok && remote.vault && u) {
        var localReal = D6.Store.realBalance ? D6.Store.realBalance(u) : 0;
        var phpReal = Number(remote.vault.real || 0);
        var phpDemo = Number(remote.vault.demo || 0);
        var merged = {
          demo: Math.max(D6.Store.demoBalance(u), phpDemo),
          real: Math.max(localReal, phpReal)
        };
        D6.holdPull = true;
        D6.Store.importRemote(u, merged);
        D6.holdPull = false;
        updateBalance(false);
      }
    }
  }

  function realWithdrawBalance(u) {
    if (!u) return 0;
    return D6.Store.realBalance ? D6.Store.realBalance(u) : 0;
  }

  function refreshWithdrawUi() {
    var u = user();
    var real = realWithdrawBalance(u);
    if ($('wdBalanceLabel')) $('wdBalanceLabel').textContent = 'Solde retirable : ' + D6.fmtFCFA(real);
  }

  function openWithdraw() {
    if (!requireAccount()) return;
    var u = user();
    selectedOp = 'wave';
    document.querySelectorAll('.op-card').forEach(function (c) {
      c.classList.toggle('on', c.dataset.op === selectedOp);
    });
    document.querySelectorAll('.wd-pill').forEach(function (p) { p.classList.remove('on'); });
    if ($('withdrawAmt')) $('withdrawAmt').value = '';
    if ($('withdrawPhone')) $('withdrawPhone').value = '';
    if ($('wdCountry')) $('wdCountry').value = (u && u.countryCode) || '+225';
    refreshWithdrawUi();
    closeDrawer();
    openModal('withdrawModal');
  }

  function digitsPhone(raw) {
    return String(raw || '').replace(/\D/g, '');
  }

  function openModal(id) { $(id).classList.add('active'); }
  function closeModal(id) { $(id).classList.remove('active'); }

  function fmtWhen(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function normFinanceStatus(raw, label) {
    var s = String(raw || '').toUpperCase();
    if (s === 'PAID' || s === 'APPROVED' || s === 'SUCCESS' || s === 'COMPLETED' || s === 'OK') return 'COMPLETED';
    if (s === 'REJECT' || s === 'REJECTED' || s === 'DENIED' || s === 'FAILED') return 'REJECTED';
    if (label === 'Retrait' && (s === 'WITHDRAW' || s === '')) return 'PENDING';
    return s || 'PENDING';
  }

  async function fillFinanceHistory() {
    var tx = $('txFeed');
    if (!tx) return;
    tx.innerHTML = '<div class="empty-feed">…</div>';
    var rows = [];
    var u = user();
    if (u && u.transactions) {
      (u.transactions || []).forEach(function (x) {
        if (x.type !== 'deposit' && x.type !== 'withdraw') return;
        rows.push({
          at: x.at || '',
          ref: x.id || '—',
          amount: Number(x.amount) || 0,
          status: normFinanceStatus(x.type === 'deposit' ? 'COMPLETED' : (x.note || 'PENDING'), x.type === 'deposit' ? 'Recharge' : 'Retrait'),
          label: x.type === 'deposit' ? 'Recharge' : 'Retrait'
        });
      });
    }
    (D6.Store.listWithdrawals ? D6.Store.listWithdrawals() : []).forEach(function (w) {
      if (!u || w.userId !== u.id) return;
      rows.push({
        at: w.at || '',
        ref: w.id || '—',
        amount: -Math.abs(Number(w.amount) || 0),
        status: normFinanceStatus(w.status, 'Retrait'),
        label: 'Retrait'
      });
    });
    if (D6.Supabase && D6.Supabase.listFinance) {
      try {
        var cloud = await D6.Supabase.listFinance();
        (cloud.deposits || []).forEach(function (d) {
          rows.push({
            at: d.created_at || d.completed_at || '',
            ref: d.reference || d.id || '—',
            amount: Number(d.amount) || 0,
            status: normFinanceStatus(d.status, 'Recharge'),
            label: 'Recharge'
          });
        });
        (cloud.withdrawals || []).forEach(function (w) {
          rows.push({
            at: w.created_at || w.at || '',
            ref: w.id || w.reference || '—',
            amount: -Math.abs(Number(w.amount) || 0),
            status: normFinanceStatus(w.status, 'Retrait'),
            label: 'Retrait'
          });
        });
        (cloud.txs || []).forEach(function (trow) {
          var typ = String(trow.type || '');
          if (typ !== 'deposit' && typ !== 'withdraw') return;
          rows.push({
            at: trow.created_at || '',
            ref: trow.id || '—',
            amount: Number(trow.amount) || 0,
            status: normFinanceStatus(typ === 'deposit' ? 'COMPLETED' : (trow.note || 'PENDING'), typ === 'deposit' ? 'Recharge' : 'Retrait'),
            label: typ === 'deposit' ? 'Recharge' : 'Retrait'
          });
        });
      } catch (e) { /* ignore */ }
    }
    var remote = await D6.Api.post('financeHistory', {});
    if (remote && remote.ok && remote.rows) {
      (remote.rows || []).forEach(function (r) {
        rows.push({
          at: r.at || '',
          ref: r.ref || '—',
          amount: Number(r.amount) || 0,
          status: normFinanceStatus(r.status, r.label),
          label: r.label || '—'
        });
      });
    }
    var seen = {};
    rows = rows.filter(function (r) {
      var k = (r.ref || '') + '|' + r.amount + '|' + (r.at || '') + '|' + r.label;
      if (seen[k]) return false;
      seen[k] = 1;
      return true;
    });
    rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    tx.innerHTML = rows.length ? rows.map(function (r) {
      var st = r.status || 'PENDING';
      return '<div class="list-row"><div><strong>' + r.label + '</strong><div class="h-time">' + fmtWhen(r.at) +
        ' · ' + (r.ref || '—') + '</div></div><span><span class="' + (r.amount >= 0 ? 'w' : 'l') + '">' +
        (r.amount >= 0 ? '+' : '') + D6.fmtFCFA(r.amount) + '</span> · <span class="st-' + st + '">' + st + '</span></span></div>';
    }).join('') : '<div class="empty-feed">Aucune opération pour l’instant</div>';
  }

  function bindAuth() {
    document.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.auth-tab').forEach(function (tEl) { tEl.classList.remove('on'); });
        tab.classList.add('on');
        $('formLogin').classList.toggle('hidden', tab.dataset.tab !== 'login');
        $('formRegister').classList.toggle('hidden', tab.dataset.tab !== 'register');
        clearErrors();
      });
    });
    $('formLogin').addEventListener('submit', async function (e) {
      e.preventDefault();
      clearErrors();
      var res = await D6.Auth.login({ identifier: $('loginId').value, password: $('loginPass').value });
      if (!res.ok) { showFieldError(res.field || 'loginId', res.reason); return; }
      enterApp();
    });
    $('regPass2').addEventListener('input', function () {
      if ($('regPass').value && this.value && $('regPass').value !== this.value) showFieldError('regPass2', 'Les mots de passe ne correspondent pas');
      else { $('err-regPass2').textContent = ''; $('err-regPass2').classList.remove('on'); }
    });
    $('formRegister').addEventListener('submit', async function (e) {
      e.preventDefault();
      clearErrors();
      if ($('regPass').value !== $('regPass2').value) { showFieldError('regPass2', 'Les mots de passe ne correspondent pas'); return; }
      var res = await D6.Auth.register({
        displayName: $('regName').value, email: $('regEmail').value,
        phone: $('regPhone') ? $('regPhone').value : '',
        countryCode: $('regDial') ? $('regDial').value : '+225',
        password: $('regPass').value, passwordConfirm: $('regPass2').value,
        acceptTerms: $('regAge').checked
      });
      if (!res.ok) { showFieldError(res.field || 'regName', res.reason); return; }
      toast(t('accountCreated'), 'ok');
      enterApp();
    });
    $('btnForgot').addEventListener('click', function () {
      clearErrors();
      $('resetId').value = $('loginId').value;
      openModal('forgotModal');
    });
    $('formReset').addEventListener('submit', async function (e) {
      e.preventDefault();
      clearErrors();
      var res = await D6.Auth.resetPassword({
        identifier: $('resetId').value,
        password: $('resetPass').value, passwordConfirm: $('resetPass2').value
      });
      if (!res.ok) { showFieldError(res.field || 'resetId', res.reason); return; }
      closeModal('forgotModal');
      toast(t('passUpdated'), 'ok');
    });
    $('closeForgot').addEventListener('click', function () { closeModal('forgotModal'); });
  }

  function bindTrade() {
    $('modeDemo').addEventListener('click', function () { switchMode('demo'); });
    $('modeReal').addEventListener('click', function () { switchMode('real'); });
    document.querySelectorAll('.asset-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var u = user();
        if (!u) return;
        u.assetId = chip.dataset.asset; D6.Store.saveUser(u); updateAssetUi();
      });
    });
    document.querySelectorAll('.dur-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var u = user();
        if (!u) return;
        u.duration = Number(chip.dataset.dur); D6.Store.saveUser(u); updateDurationUi();
      });
    });
    document.querySelectorAll('.qbtn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var add = Number(btn.dataset.add || 0);
        var a = btn.dataset.a;
        var u = user();
        var cap = D6.Store.balanceOf(u);
        var min = D6.CONFIG.MIN_STAKE || 100;
        stake = Math.max(min, Math.floor(Number($('inputStake').value) || stake || min));
        if (add) stake = stake + add;
        else if (a === 'x2') stake = stake * 2;
        else if (a === 'half') stake = Math.max(Math.floor(stake / 2), min);
        if (cap > 0 && stake > cap) stake = cap;
        if (stake < min) stake = min;
        $('inputStake').value = stake;
        btn.classList.add('hit');
        setTimeout(function () { btn.classList.remove('hit'); }, 160);
        updatePayoutUi();
      });
    });
    $('inputStake').addEventListener('input', function () {
      stake = Math.max(0, Math.floor(Number(this.value) || 0));
      updatePayoutUi();
    });
    function tap(el, fn) {
      el.addEventListener('pointerup', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        fn();
      });
    }
    tap($('btnCall'), function () { execute('call'); });
    tap($('btnPut'), function () { execute('put'); });
    $('btnOpenDeposit').addEventListener('click', function () { openDeposit(); });
    $('balanceCard').addEventListener('click', function () { /* solde only */ });
    $('btnProfile').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openDrawer();
    });
    $('btnCloseDrawer').addEventListener('click', closeDrawer);
    $('drawerBackdrop').addEventListener('click', closeDrawer);
    $('btnHistMore').addEventListener('click', function () {
      renderHistorySheet();
      openModal('historySheet');
    });
  }

  function bindModals() {
    $('closeHistorySheet').addEventListener('click', function () { closeModal('historySheet'); });
    $('closeConvert').addEventListener('click', function () { closeModal('convertModal'); });
    $('btnConvertRecharge').addEventListener('click', function () {
      closeModal('convertModal');
      var u = user();
      if (u && !D6.Engine.getTrade()) {
        u.mode = 'real'; D6.Store.saveUser(u); setModeUi(u); updateBalance(true); updatePayoutUi();
      }
      openDeposit();
    });
    $('btnOpenPass').addEventListener('click', function () { closeDrawer(); openModal('passModal'); });
    $('closePass').addEventListener('click', function () { closeModal('passModal'); });
    $('formPassword').addEventListener('submit', async function (e) {
      e.preventDefault();
      var res = await D6.Auth.changePassword(user(), $('curPass').value, $('newPass').value);
      if (!res.ok) { toast(res.reason, 'err'); return; }
      $('curPass').value = ''; $('newPass').value = '';
      closeModal('passModal');
      toast(t('passUpdated'), 'ok');
    });
    $('btnFinance').addEventListener('click', openFinance, true);
    $('btnFinance').addEventListener('pointerup', openFinance);
    function openFinance(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (openFinance._lock && Date.now() - openFinance._lock < 400) return;
      openFinance._lock = Date.now();
      closeDrawer();
      openModal('financeModal');
      fillFinanceHistory();
    }
    $('closeFinance').addEventListener('click', function () { closeModal('financeModal'); });
    $('btnWithdraw').addEventListener('click', function () { openWithdraw(); });
    $('closeWithdraw').addEventListener('click', function () { closeModal('withdrawModal'); });
    $('closeDeposit').addEventListener('click', function () { closeModal('depositModal'); });
    if ($('btnDepositCheck')) $('btnDepositCheck').addEventListener('click', function () { checkDepositNow(true); });
    if ($('btnDepositWaitClose')) {
      // On masque l'attente sans arrêter la surveillance : si l'opérateur
      // confirme plus tard, le solde sera crédité par le serveur.
      $('btnDepositWaitClose').addEventListener('click', function () { closeModal('depositWaitModal'); });
    }
    if ($('btnHelp')) $('btnHelp').addEventListener('click', function () { openModal('helpModal'); });
    if ($('closeHelp')) $('closeHelp').addEventListener('click', function () { closeModal('helpModal'); });
    if ($('formHelp')) {
      $('formHelp').addEventListener('submit', async function (e) {
        e.preventDefault();
        var subject = ($('helpSubject') && $('helpSubject').value) || '';
        var message = ($('helpMessage') && $('helpMessage').value) || '';
        if (!subject || !message) return;
        var res = D6.Api && D6.Api.token()
          ? await D6.Api.post('supportMessage', { subject: subject, message: message })
          : { ok: false };
        if (!res || !res.ok) { toast((res && res.reason) || t('sessionInvalid'), 'err'); return; }
        closeModal('helpModal');
        $('helpSubject').value = '';
        $('helpMessage').value = '';
        toast(t('helpSent'), 'ok');
      });
    }
    if ($('closeDepositSuccess')) $('closeDepositSuccess').addEventListener('click', function () { closeModal('depositSuccessModal'); });
    if ($('btnDepositSuccessOk')) $('btnDepositSuccessOk').addEventListener('click', function () { closeModal('depositSuccessModal'); });
    document.querySelectorAll('#depOpGrid .op-card').forEach(function (card) {
      card.addEventListener('click', function () {
        depositOp = card.dataset.op;
        document.querySelectorAll('#depOpGrid .op-card').forEach(function (c) { c.classList.toggle('on', c === card); });
      });
    });
    if ($('depositAmt')) {
      $('depositAmt').addEventListener('input', function () {
        this.value = String(this.value || '').replace(/[^\d]/g, '');
      });
    }
    $('btnConfirmDeposit').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      confirmDeposit();
    });
    document.querySelectorAll('#opGrid .op-card').forEach(function (card) {
      card.addEventListener('click', function () {
        selectedOp = card.dataset.op;
        document.querySelectorAll('#opGrid .op-card').forEach(function (c) { c.classList.toggle('on', c === card); });
      });
    });
    document.querySelectorAll('#withdrawModal .wd-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        document.querySelectorAll('.wd-pill').forEach(function (p) { p.classList.remove('on'); });
        pill.classList.add('on');
        var u = user();
        var real = realWithdrawBalance(u);
        if (pill.dataset.amt === 'all') $('withdrawAmt').value = real;
        else $('withdrawAmt').value = pill.dataset.amt;
      });
    });
    if ($('withdrawPhone')) {
      $('withdrawPhone').addEventListener('input', function () {
        this.value = this.value.replace(/[^\d\s]/g, '').slice(0, 12);
      });
    }
    $('btnSendWithdraw').addEventListener('click', async function () {
      var u = user();
      if (!u || !requireAccount()) return;
      var amount = Math.round(Number($('withdrawAmt').value) || 0);
      var phone = digitsPhone($('withdrawPhone') && $('withdrawPhone').value);
      var name = (u.displayName || 'Client').trim();
      var cc = ($('wdCountry') && $('wdCountry').value) || '+225';
      var real = realWithdrawBalance(u);
      if (amount < D6.CONFIG.MIN_STAKE) { toast(t('minStake'), 'err'); return; }
      if (amount > real) { toast(t('insufficient'), 'err'); return; }
      if (phone.length < 8 || phone.length > 10) { toast(t('wdPhone'), 'err'); return; }
      var payload = {
        amount: amount,
        operator: selectedOp,
        phone: phone,
        beneficiary: name,
        countryCode: cc
      };
      if (D6.Api && D6.Api.token()) {
        var remote = await D6.Api.post('withdraw', payload);
        if (remote && remote.server && !remote.ok) { toast(remote.reason, 'err'); return; }
        if (remote && remote.ok && remote.vault) D6.Store.importRemote(u, remote.vault);
        else {
          var local = D6.Store.requestWithdraw(u, amount, payload);
          if (!local.ok) { toast(local.reason, 'err'); return; }
        }
      } else {
        var res = D6.Store.requestWithdraw(u, amount, payload);
        if (!res.ok) { toast(res.reason, 'err'); return; }
      }
      closeModal('withdrawModal');
      updateBalance(true);
      toast(t('withdrawBtn'), 'ok');
    });
    async function doLogout(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
      closeDrawer();
      D6.Chart.stop();
      if (D6.Auth.logout) await D6.Auth.logout();
      else if (D6.Auth.signOut) await D6.Auth.signOut();
      ensureGuest();
      enterApp();
    }
    var logoutBtn = $('btnLogout');
    logoutBtn.addEventListener('click', doLogout, true);
    logoutBtn.addEventListener('pointerup', doLogout);
    document.querySelectorAll('.modal-backdrop').forEach(function (b) {
      b.addEventListener('click', function (e) { if (e.target === b) b.classList.remove('active'); });
    });
  }

  function bindAdmin() {
    function openAdmin() {
      if (!D6.Auth.isAdmin(user())) return;
      closeDrawer();
      renderAdmin();
      showScreen('screenAdmin');
    }
    $('btnAdmin2').addEventListener('click', openAdmin);
    $('btnCloseAdmin').addEventListener('click', function () {
      showScreen('screenTrade');
      requestAnimationFrame(D6.Chart.resize);
    });
    $('adminUsers').addEventListener('click', async function (e) {
      var row = e.target.closest('[data-user]');
      if (row) openAdminUser(row.dataset.user);
    });
    if ($('adminSearch')) {
      $('adminSearch').addEventListener('input', function () { renderAdminUsers(this.value); });
      $('adminSearch').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); renderAdminUsers(this.value); }
      });
    }
    async function runAdminAdjust(btn) {
      if (!btn) return;
      var motif = ($('adjMotif') && $('adjMotif').value) || '';
      if (!motif.trim()) { toast(t('adjustReason'), 'err'); return; }
      var uid = btn.dataset.adj;
      var mode = ($('adjMode') && $('adjMode').value) || btn.dataset.mode || 'real';
      var delta = 0;
      if (btn.dataset.reset === '1') {
        var u0 = (adminCache.users || []).find(function (x) { return x.id === uid; });
        delta = (D6.CONFIG.DEMO_START || 1000000) - Number((u0 && u0.demoBalance) || 0);
        mode = 'demo';
      } else {
        var amt = Math.abs(Math.round(Number(($('adjAmount') && $('adjAmount').value) || 0)));
        if (!amt) { toast('Montant invalide', 'err'); return; }
        delta = btn.dataset.adjAct === 'debit' ? -amt : amt;
      }
      if (D6.Api && D6.Api.token()) {
        var remote = await D6.Api.post('adjust', { userId: uid, delta: delta, mode: mode, motif: motif });
        if (remote && remote.server && !remote.ok) { toast(remote.reason || 'Erreur', 'err'); return; }
      }
      if (D6.Store.adjustMode) D6.Store.adjustMode(uid, mode, delta);
      else if (mode === 'real') D6.Store.adjustReal(uid, delta);
      toast((delta >= 0 ? '+' : '−') + D6.fmtFCFA(Math.abs(delta)), 'ok');
      await renderAdmin();
      openAdminUser(uid);
      updateBalance(false);
    }
    if ($('adminUserDetail')) {
      $('adminUserDetail').addEventListener('click', async function (e) {
        var btn = e.target.closest('[data-adj-act], [data-reset="1"]');
        if (!btn || !btn.dataset.adj) return;
        await runAdminAdjust(btn);
      });
    }
    if ($('adminMessages')) {
      $('adminMessages').addEventListener('click', async function (e) {
        var btn = e.target.closest('[data-msg]');
        if (!btn) return;
        var reply = window.prompt('Réponse (optionnel)') || '';
        if (D6.Api && D6.Api.token()) await D6.Api.post('resolveMessage', { id: btn.dataset.msg, reply: reply });
        renderAdmin();
      });
    }
    if ($('btnMaketouLog')) {
      $('btnMaketouLog').addEventListener('click', function () {
        var tok = (D6.Api && D6.Api.token && D6.Api.token()) || '';
        if (!tok) { toast(t('sessionInvalid'), 'err'); return; }
        window.open('debug-maketou.php?lines=300&token=' + encodeURIComponent(tok), '_blank');
      });
    }
    if ($('adminDeposits')) {
      $('adminDeposits').addEventListener('click', async function (e) {
        var btn = e.target.closest('[data-dep]');
        if (!btn || btn.disabled) return;
        btn.disabled = true;
        var res = D6.Api && D6.Api.token()
          ? await D6.Api.post('resolveDeposit', {
            ref: btn.dataset.dep,
            amount: Number(btn.dataset.amt || 0),
            approve: btn.dataset.ok === '1'
          })
          : null;
        if (res && res.ok) toast(btn.dataset.ok === '1' ? (t('depositOk') + ' : +' + D6.fmtFCFA(res.amount || 0)) : t('reject'), 'ok');
        else toast((res && res.reason) || t('sessionInvalid'), 'err');
        renderAdmin();
      });
    }
    $('adminWithdrawals').addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-wd]');
      if (!btn) return;
      if (D6.Api && D6.Api.token()) await D6.Api.post('resolveWithdraw', { id: btn.dataset.wd, approve: btn.dataset.ok === '1' });
      D6.Store.resolveWithdraw(btn.dataset.wd, btn.dataset.ok === '1');
      renderAdmin();
    });
  }

  function bindInstall() {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      if (!sessionStorage.getItem('oro_hide_install')) $('installBanner').classList.remove('hidden');
    });
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    if (ios && !sessionStorage.getItem('oro_hide_install')) $('installBanner').classList.remove('hidden');
    $('btnInstall').addEventListener('click', async function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      } else toast(t('installIos'));
      $('installBanner').classList.add('hidden');
    });
    $('btnInstallClose').addEventListener('click', function () {
      sessionStorage.setItem('oro_hide_install', '1');
      $('installBanner').classList.add('hidden');
    });
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) { r.update(); });
      });
      navigator.serviceWorker.register('sw.js?v=35').catch(function () { /* ignore */ });
    }
  }

  function lockGestures() {
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });
    document.addEventListener('touchmove', function (e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
  }

  function enterApp() {
    var u = user();
    stake = D6.CONFIG.MIN_STAKE || 100;
    $('inputStake').value = stake;
    setModeUi(u);
    setAdminBtns(u);
    syncAuthQuick();
    setModeChrome(u);
    updateAssetUi();
    updateDurationUi();
    if (u && D6.Engine.restoreOpen) D6.Engine.restoreOpen(u);
    if (u && D6.Engine.flushSettlements) D6.Engine.flushSettlements(u);
    updateBalance(false);
    renderHistory();
    D6.I18N.apply();
    showScreen('screenTrade');
    if ($('installBanner')) $('installBanner').classList.add('hidden');
    D6.Chart.setAsset(assetId(u));
    D6.Chart.start();
    requestAnimationFrame(D6.Chart.resize);
    refreshRemoteVault();
    checkDepositReturn();
    syncTradeButtons();
    if (u && !isGuest(u) && D6.Supabase && D6.Supabase.startRealtime) D6.Supabase.startRealtime(u.id);
  }

  function loopParticles() {
    if (window.matchMedia('(max-width: 859px)').matches) return;
    var pCanvas = $('particlesCanvas');
    var pCtx = pCanvas.getContext('2d');
    var particles = [];
    function resizeP() { pCanvas.width = window.innerWidth; pCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeP);
    resizeP();
    var i;
    for (i = 0; i < 8; i++) {
      particles.push({ x: Math.random() * pCanvas.width, y: Math.random() * pCanvas.height, s: Math.random() * 1.6 + 0.4, vy: Math.random() * 0.7 + 0.2, vx: (Math.random() - 0.5) * 0.25, a: Math.random() * 0.22 + 0.06, col: Math.random() > 0.45 ? '#FFA000' : '#FFD700' });
    }
    function loop() {
      if (document.hidden) { requestAnimationFrame(loop); return; }
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      particles.forEach(function (p) {
        p.y += p.vy; p.x += p.vx;
        if (p.y > pCanvas.height) { p.y = -6; p.x = Math.random() * pCanvas.width; }
        pCtx.globalAlpha = p.a; pCtx.fillStyle = p.col;
        pCtx.beginPath(); pCtx.arc(p.x, p.y, p.s, 0, Math.PI * 2); pCtx.fill();
      });
      pCtx.globalAlpha = 1;
      requestAnimationFrame(loop);
    }
    loop();
  }

  D6.App = {
    onRemoteAccount: function () {
      updateBalance(true);
      fillProfile();
    },
    updateBalance: updateBalance,
    boot: function () {
      lockGestures();
      fillLangBars();
      fillCountrySelects();
      D6.I18N.apply();
      bindAuth();
      bindTrade();
      bindModals();
      bindAdmin();
      bindInstall();
      loopParticles();
      window.addEventListener('message', function (ev) {
        var d = ev && ev.data;
        if (!d || d.orolado !== 'deposit-done') return;
        var ref = d.ref || '';
        if (ref) {
          try { localStorage.setItem('oro_dep_ref', ref); } catch (e) {}
          depositRef = ref;
        }
        // pay-blank.html n'est atteinte qu'au bout du parcours Maketou :
        // c'est une preuve de retour, transmise au serveur pour le journal.
        depositReturn = { state: 'success', params: Object.assign({ source: 'pay-blank' }, d.params || {}) };
        checkDepositReturn(true);
      });
      document.addEventListener('orolado-deposit-completed', function (ev) {
        var ref = (ev && ev.detail && ev.detail.ref) || '';
        try { if (!ref) ref = sessionStorage.getItem('oro_dep_ref') || localStorage.getItem('oro_dep_ref') || ''; } catch (e) { ref = ref || ''; }
        if (ref && !depositApplied) startDepositWatch(ref);
        else checkDepositReturn();
      });
      D6.Engine.onSettled = applyOutcome;
      var tapEv = window.PointerEvent ? 'pointerdown' : 'touchstart';
      document.addEventListener(tapEv, function (e) {
        unlockAudio();
        if ($('screenTrade') && $('screenTrade').classList.contains('hidden')) return;
        if (e.target && e.target.closest && e.target.closest('button, .qbtn, .dur-chip, .mode-btn, .asset-chip')) {
          playTap();
        }
      }, { capture: true, passive: true });
      document.addEventListener('touchstart', unlockAudio, { capture: true, passive: true });
      document.addEventListener('click', unlockAudio, { capture: true, passive: true });
      var lastHud = 0;
      D6.Chart.attach($('chartCanvas'), function (ts) {
        if ($('screenTrade').classList.contains('hidden') || document.hidden) return;
        if (ts - lastHud < 80) return;
        lastHud = ts;
        updatePriceHud();
      });
      setInterval(function () {
        var u = user();
        if (u && D6.Engine.flushSettlements) D6.Engine.flushSettlements(u);
        patchHistorySoon();
        syncTradeButtons();
      }, 1000);
      document.addEventListener('click', function () {
        document.querySelectorAll('.lang-dd-menu').forEach(function (m) { m.classList.add('hidden'); });
      });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
          unlockAudio();
          var u = user();
          if (u && D6.Engine.restoreOpen) D6.Engine.restoreOpen(u);
          if (u && D6.Engine.flushSettlements) D6.Engine.flushSettlements(u);
          refreshRemoteVault();
          checkDepositReturn();
          try {
            var sb = D6.Supabase && D6.Supabase.client && D6.Supabase.client();
            if (sb && sb.auth && sb.auth.refreshSession) sb.auth.refreshSession();
          } catch (e) { /* ignore */ }
        }
      });
      window.addEventListener('pageshow', function () {
        refreshRemoteVault();
        checkDepositReturn();
      });
      setInterval(updatePayoutUi, 2500);
      D6.Auth.ensureAdmin();
      if (location.hash.indexOf('#preview') === 0) {
        (async function () {
          var existing = D6.Store.findByEmail('preview@orolado.local');
          if (existing) D6.Store.setSession({ userId: existing.id, at: D6.nowIso() });
          else await D6.Auth.register({ displayName: 'Preview', email: 'preview@orolado.local', phone: '0700000001', countryCode: '+225', password: 'preview1', passwordConfirm: 'preview1', acceptTerms: true });
          enterApp();
        })();
        return;
      }
      function finishBoot() {
        if (D6.Auth.current() && !isGuest(D6.Auth.current())) enterApp();
        else {
          ensureGuest();
          enterApp();
        }
      }
      if ($('btnGoLogin')) $('btnGoLogin').addEventListener('click', function () { showAuthScreen('login'); });
      if ($('btnGoRegister')) $('btnGoRegister').addEventListener('click', function () { showAuthScreen('register'); });
      if ($('btnAuthBack')) $('btnAuthBack').addEventListener('click', function () {
        ensureGuest();
        enterApp();
      });
      if ($('btnDemoTopup')) $('btnDemoTopup').addEventListener('click', function () {
        var u = user();
        if (!u || u.mode === 'real' || isGuest(u)) return;
        var target = D6.CONFIG.DEMO_START || 1000000;
        var cur = D6.Store.demoBalance(u);
        if (cur >= target) { toast('Solde démo déjà au maximum', 'ok'); return; }
        D6.Store.setBalanceMode(u, 'demo', target);
        updateBalance(true);
        toast('Démo rechargée : ' + D6.fmtFCFA(target), 'ok');
      });
      if ($('closeTip')) $('closeTip').addEventListener('click', function () { closeModal('tipModal'); });
      if ($('btnTipOk')) $('btnTipOk').addEventListener('click', function () { closeModal('tipModal'); });
      finishBoot();
      if (D6.Supabase && D6.Supabase.restore) {
        D6.Supabase.restore().then(function (cloud) {
          if (cloud && cloud.ok && D6.Auth.current() && !isGuest()) {
            enterApp();
          }
        }).catch(function () { /* hydratation locale déjà affichée */ });
      }
    }
  };

  document.addEventListener('DOMContentLoaded', D6.App.boot);
})(window.D6 = window.D6 || {});
