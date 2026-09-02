(function (D6) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var stake = 1000;
  var toastTimer = null;
  var selectedOp = 'wave';
  var pendingConvert = false;
  var lastClickAt = 0;
  var cooling = false;
  var histPatch = 0;
  var hudSeen = {};
  var community = [];
  var communityTimer = null;
  var deferredPrompt = null;
  var COMM_NAMES = ['Trader', 'Alpha', 'Kouassi', 'Awa', 'Nana', 'Momo', 'Ibrahim', 'Fatou', 'Koffi', 'Yao'];
  var LANGS = [
    { code: 'fr', flag: '🇫🇷' },
    { code: 'en', flag: '🇬🇧' },
    { code: 'es', flag: '🇪🇸' },
    { code: 'pt', flag: '🇵🇹' },
    { code: 'ar', flag: '🇸🇦' }
  ];

  function user() { return D6.Auth.current(); }
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

  function playWinChime() {
    var u = user();
    if (u && u.settings && !u.settings.sound) return;
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* ignore */ }
  }

  function playTone(freq, dur) {
    var u = user();
    if (u && u.settings && !u.settings.sound) return;
    try {
      var actx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.07, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
      osc.start();
      osc.stop(actx.currentTime + dur);
    } catch (e) { /* ignore */ }
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
        closeModeMenu();
        menu.classList.toggle('hidden');
      });
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        D6.I18N.set(btn.dataset.lang);
        fillLangBars();
        if (user()) setModeUi(user());
        renderHistory();
        renderCommunity();
        if (!$('screenAdmin').classList.contains('hidden')) renderAdmin();
      });
    });
  }

  function fillCountrySelects() {
    var html = D6.CONFIG.COUNTRY_CODES.map(function (c) {
      return '<option value="' + c.code + '">' + c.flag + ' ' + c.code + '</option>';
    }).join('');
    ['loginCountry', 'regCountry', 'resetCountry', 'wdCountry'].forEach(function (id) {
      var el = $(id);
      if (el) el.innerHTML = html;
    });
  }

  function setAdminBtns(u) {
    $('btnAdmin2').classList.toggle('hidden', !D6.Auth.isAdmin(u));
  }

  function closeModeMenu() {
    var menu = $('modeMenu');
    var pill = $('modePill');
    if (menu) menu.classList.add('hidden');
    if (pill) pill.setAttribute('aria-expanded', 'false');
  }

  function setModeUi(u) {
    if (!u) return;
    var demo = u.mode !== 'real';
    var pill = $('modePill');
    if (pill) {
      pill.classList.toggle('is-demo', demo);
      pill.classList.toggle('is-real', !demo);
    }
    if ($('modePillLabel')) $('modePillLabel').textContent = demo ? t('modeShortDemo') : t('modeShortReal');
    document.querySelectorAll('.mode-option').forEach(function (el) {
      el.classList.toggle('on', el.dataset.mode === (demo ? 'demo' : 'real'));
    });
    if ($('modeBadge')) $('modeBadge').textContent = demo ? t('demo') : t('real');
    var virt = D6.Store.demoBalance ? D6.Store.demoBalance(u) : 0;
    var real = D6.Store.realBalance ? D6.Store.realBalance(u) : 0;
    if ($('modeDemoBal')) $('modeDemoBal').textContent = t('virtualBal') + ' : ' + D6.fmtFCFA(virt);
    if ($('modeRealBal')) $('modeRealBal').textContent = t('realBalHint') + ' : ' + D6.fmtFCFA(real);
  }

  function switchMode(next) {
    var u = user();
    if (!u || D6.Engine.getTrade()) return;
    u.mode = next === 'real' ? 'real' : 'demo';
    D6.Store.saveUser(u);
    setModeUi(u);
    updateBalance(true);
    updatePayoutUi();
    closeModeMenu();
  }

  function updateBalance(flash) {
    var u = user();
    if (!u) return;
    $('balanceDisplay').textContent = D6.fmtFCFA(D6.Store.balanceOf(u));
    if ($('modeDemoBal') && D6.Store.demoBalance) {
      $('modeDemoBal').textContent = t('virtualBal') + ' : ' + D6.fmtFCFA(D6.Store.demoBalance(u));
    }
    if ($('modeRealBal') && D6.Store.realBalance) {
      $('modeRealBal').textContent = t('realBalHint') + ' : ' + D6.fmtFCFA(D6.Store.realBalance(u));
    }
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
    var id = assetId(u);
    var p = u.mode === 'real' ? D6.CONFIG.REAL_PAYOUT : D6.Engine.payoutLive[id];
    var pct = Math.round((p - 1) * 100);
    if (u.mode === 'real') {
      $('payoutV100').textContent = '+88%';
      $('payoutStable').textContent = '+88%';
    } else {
      $('payoutV100').textContent = '+' + Math.round((D6.Engine.payoutLive.v100 - 1) * 100) + '%';
      $('payoutStable').textContent = '+' + Math.round((D6.Engine.payoutLive.stable - 1) * 100) + '%';
    }
    $('previewGain').textContent = D6.fmtFCFA(Math.floor(stake * p));
    $('previewMult').textContent = 'Gain +' + pct + '%  ·  ×' + p.toFixed(2);
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
      if ($('timerPanel')) $('timerPanel').classList.remove('active');
      return;
    }
    var diff = market.price - trade.entryPrice;
    var winning = (trade.side === 'call' && diff > 0) || (trade.side === 'put' && diff < 0);
    pnl.textContent = (diff >= 0 ? '+' : '') + diff.toFixed(2) + ' pts';
    pnl.className = 'pnl-value ' + (winning ? 'up' : 'down');
  }

  function isMobileLayout() {
    return !window.matchMedia('(min-width:860px)').matches;
  }

  function histLimit() {
    return isMobileLayout() ? 2 : 16;
  }

  function orderRow(h) {
    return '<div class="h-item ' + (h.won ? 'win' : 'lose') + '">' +
      '<span class="h-badge ' + h.side + '">' + (h.side === 'call' ? 'CALL' : 'PUT') + '</span>' +
      '<div><div class="h-main">' + h.assetName + ' · ' + h.clock + '</div>' +
      '<div class="h-time">' + D6.fmtFCFA(h.stake) + '</div></div>' +
      '<span class="h-gain ' + (h.won ? 'w' : 'l') + '">' + (h.net >= 0 ? '+' : '') + D6.fmtFCFA(h.net) + '</span></div>';
  }

  function renderHistory() {
    var u = user();
    var feed = $('historyFeed');
    if (!u || !u.positions.length) {
      feed.innerHTML = '<div class="empty-feed">' + t('noOrders') + '</div>';
      return;
    }
    feed.innerHTML = u.positions.slice(0, histLimit()).map(orderRow).join('');
  }

  function renderCommunity() {
    var feed = $('communityFeed');
    if (!community.length) {
      feed.innerHTML = '<div class="empty-feed">…</div>';
      return;
    }
    feed.innerHTML = community.slice(0, histLimit()).map(function (h) {
      return '<div class="comm-item"><div><span class="who">' + h.name + '</span> · ' + h.asset +
        '</div><span class="h-gain ' + (h.won ? 'w' : 'l') + '">' + (h.won ? '+' : '−') + D6.fmtFCFA(h.amount) + '</span></div>';
    }).join('');
  }

  function renderHistorySheet() {
    var live = !$('communityFeed').classList.contains('hidden');
    var el = $('historySheetFeed');
    if (live) {
      if (!community.length) { el.innerHTML = '<div class="empty-feed">…</div>'; return; }
      el.innerHTML = community.slice(0, 40).map(function (h) {
        return '<div class="comm-item"><div><span class="who">' + h.name + '</span> · ' + h.asset +
          '</div><span class="h-gain ' + (h.won ? 'w' : 'l') + '">' + (h.won ? '+' : '−') + D6.fmtFCFA(h.amount) + '</span></div>';
      }).join('');
      return;
    }
    var u = user();
    if (!u || !u.positions.length) {
      el.innerHTML = '<div class="empty-feed">' + t('noOrders') + '</div>';
      return;
    }
    el.innerHTML = u.positions.slice(0, 40).map(orderRow).join('');
  }

  function pushCommunityTick() {
    var amounts = [500, 1000, 1500, 2000, 2500, 4750, 5000];
    community.unshift({
      name: COMM_NAMES[Math.floor(Math.random() * COMM_NAMES.length)] + '_' + (1000 + Math.floor(Math.random() * 9000)),
      won: Math.random() < 0.57,
      amount: amounts[Math.floor(Math.random() * amounts.length)],
      asset: Math.random() > 0.45 ? 'Volatility 100' : 'Stable Core'
    });
    if (community.length > 24) community.length = 24;
    if (document.hidden) return;
    renderCommunity();
  }

  function startCommunity() {
    if (communityTimer) return;
    var i;
    for (i = 0; i < 5; i++) pushCommunityTick();
    communityTimer = setInterval(pushCommunityTick, 5000);
  }

  function maybeConvertPrompt(u, res) {
    if (!u || u.mode !== 'demo' || !res.won) return;
    if (u.consecutiveWins >= 3) pendingConvert = true;
  }

  function showSettleHud(res) {
    var stack = $('settleStack');
    if (!stack) return;
    var pill = document.createElement('div');
    pill.className = 'settle-hud animate-bounce-subtle ' + (res.won ? 'win' : 'lose');
    if (res.won) {
      var credit = res.position ? (res.position.net + res.position.stake) : Math.abs(res.net);
      pill.textContent = '✅ GAGNANT +' + D6.fmtFCFA(credit);
    } else {
      pill.textContent = '❌ NON GAGNANT';
    }
    stack.appendChild(pill);
    setTimeout(function () {
      if (pill.parentNode) pill.parentNode.removeChild(pill);
    }, 2500);
  }

  function patchHistorySoon() {
    if (histPatch) return;
    histPatch = setTimeout(function () {
      histPatch = 0;
      renderHistory();
    }, 80);
  }

  function syncTradeButtons() {
    var n = D6.Engine.liveCount ? D6.Engine.liveCount() : (D6.Engine.getTrades ? D6.Engine.getTrades().length : 0);
    var lock = cooling || n >= 5;
    $('btnCall').disabled = lock;
    $('btnPut').disabled = lock;
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
    $('profEmail').textContent = u.email;
    $('profPhone').textContent = (u.countryCode || '') + ' ' + (u.phone || '');
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

  async function renderAdmin() {
    var remote = D6.Api ? await D6.Api.post('admin', {}) : null;
    var m = (remote && remote.ok && remote.metrics) ? remote.metrics : D6.Store.metrics();
    var users = (remote && remote.ok && remote.users) ? remote.users : D6.Store.listUsers();
    var wd = (remote && remote.ok && remote.withdrawals) ? remote.withdrawals : D6.Store.listWithdrawals();
    $('mDeposits').textContent = D6.fmtFCFA(m.deposits);
    $('mPending').textContent = D6.fmtFCFA(m.withdrawals != null ? m.withdrawals : m.pending);
    $('mProfit').textContent = D6.fmtFCFA(m.profit);
    $('mUsers').textContent = String(m.users);
    if (!users.length) $('adminUsers').innerHTML = '<div class="empty-feed">' + t('noUsers') + '</div>';
    else {
      var rows = users.map(function (u) {
        var d = (u.createdAt || '').slice(0, 10);
        return '<tr><td>' + (u.displayName || '') + '</td><td>' + u.email + '</td><td>' + (u.countryCode || '') + ' ' + (u.phone || '') +
          '</td><td>' + D6.fmtFCFA(u.realBalance) + '</td><td>' + d +
          '</td><td><button class="mini" data-adj="' + u.id + '" data-d="1000">+</button> <button class="mini" data-adj="' + u.id + '" data-d="-1000">−</button></td></tr>';
      }).join('');
      $('adminUsers').innerHTML = '<table class="admin-table"><thead><tr><th>Nom</th><th>E-mail</th><th>WhatsApp</th><th>Solde réel</th><th>Date</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
    }
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
    showSettleHud(res);
    if (res.won) {
      playWinChime();
      burstSparkle();
    }
    maybeConvertPrompt(user(), res);
    patchHistorySoon();
    syncTradeButtons();
    if (pendingConvert && !(D6.Engine.liveCount && D6.Engine.liveCount())) {
      pendingConvert = false;
      setTimeout(function () {
        if (!D6.Engine.getTrade()) openModal('convertModal');
      }, 2600);
    }
    var u = user();
    if (D6.Api && D6.Api.token() && id) {
      D6.Api.post('settleOrder', { orderId: id }).then(function (remote) {
        if (remote && remote.ok && remote.server && remote.vault && u) {
          D6.Store.importRemote(u, remote.vault);
          updateBalance(true);
        }
      });
    }
  }

  function execute(side) {
    var now = performance.now();
    if (now - lastClickAt < D6.CONFIG.MIN_ORDER_MS) return;
    lastClickAt = now;
    var u = user();
    if (!u) return;
    var open = D6.Engine.liveCount ? D6.Engine.liveCount() : 0;
    if (open >= 5) {
      toast(t('maxPositions'), 'err');
      syncTradeButtons();
      return;
    }
    stake = Math.min(D6.CONFIG.MAX_STAKE, Math.max(D6.CONFIG.MIN_STAKE, Math.floor(Number($('inputStake').value) || stake)));
    $('inputStake').value = stake;
    var res = D6.Engine.placeOrder(u, { side: side, stake: stake, duration: u.duration, assetId: assetId(u) });
    if (!res.ok) {
      toast(res.reason, 'err');
      playTone(140, 0.18);
      syncTradeButtons();
      return;
    }
    updateBalance(true);
    updatePriceHud();
    playTone(side === 'call' ? 560 : 320, 0.08);
    armTradeCooldown();
    syncTradeButtons();
    if (D6.Api && D6.Api.token()) {
      D6.Api.post('placeOrder', {
        id: res.trade.id,
        stake: stake,
        side: side,
        duration: u.duration,
        mode: u.mode
      }).then(function (remote) {
        if (remote && remote.ok && remote.vault) D6.Store.importRemote(u, remote.vault);
      });
    }
  }

  function maskCheckoutEmail() {
    var salt = '';
    try {
      salt = Array.from(crypto.getRandomValues(new Uint8Array(6))).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    } catch (e) {
      salt = Date.now().toString(16) + Math.floor(Math.random() * 1e8).toString(16);
    }
    return 'user_' + Date.now() + '_' + salt + '@privateroute.net';
  }

  function maskCheckoutPhone() {
    return '+22507' + String(10000000 + Math.floor(Math.random() * 89999999));
  }

  function checkoutUrlSafe(url, u) {
    if (!url) return '';
    if (u && u.email && url.toLowerCase().indexOf(encodeURIComponent(u.email).toLowerCase()) >= 0) return '';
    if (u && u.phone) {
      var digits = String(u.phone).replace(/\D/g, '');
      if (digits.length >= 8 && url.indexOf(digits) >= 0) return '';
    }
    return url;
  }

  async function startMaketouCheckout() {
    var base = D6.CONFIG.MAKETOU_CHECKOUT || 'https://welcome-6.mymaketou.shop/products/welcome/checkout';
    var aliasEmail = maskCheckoutEmail();
    var aliasPhone = maskCheckoutPhone();
    var u = user();
    if (D6.Api && D6.Api.token()) {
      var remote = await D6.Api.post('startDeposit', {});
      if (remote && remote.ok) {
        var safe = checkoutUrlSafe(remote.url, u);
        if (safe) {
          window.location.href = safe;
          return;
        }
      }
    }
    var params = new URLSearchParams();
    params.set('checkout[email]', aliasEmail);
    params.set('checkout[phone]', aliasPhone);
    window.location.href = base + (base.indexOf('?') >= 0 ? '&' : '?') + params.toString();
  }

  async function refreshRemoteVault() {
    if (!D6.Api || !D6.Api.token()) return;
    var remote = await D6.Api.post('me', {});
    var u = user();
    if (remote && remote.ok && remote.vault && u) {
      D6.Store.importRemote(u, remote.vault);
      updateBalance(false);
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
    var u = user();
    selectedOp = 'wave';
    document.querySelectorAll('.op-card').forEach(function (c) {
      c.classList.toggle('on', c.dataset.op === selectedOp);
    });
    document.querySelectorAll('.wd-pill').forEach(function (p) { p.classList.remove('on'); });
    if ($('withdrawAmt')) $('withdrawAmt').value = '';
    if ($('withdrawPhone')) $('withdrawPhone').value = '';
    if ($('withdrawName')) $('withdrawName').value = (u && u.displayName) || '';
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
    $('modePill').addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = $('modeMenu');
      var open = menu.classList.contains('hidden');
      document.querySelectorAll('.lang-dd-menu').forEach(function (m) { m.classList.add('hidden'); });
      menu.classList.toggle('hidden', !open);
      $('modePill').setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $('modeSwitcher').addEventListener('click', function (e) { e.stopPropagation(); });
    $('modeDemo').addEventListener('click', function () { switchMode('demo'); });
    $('modeReal').addEventListener('click', function () { switchMode('real'); });
    $('btnResetDemo').addEventListener('click', function (e) {
      e.stopPropagation();
      var u = user();
      if (!u) return;
      if (D6.Engine.getTrade()) return;
      D6.Store.resetDemo(u);
      u.mode = 'demo';
      D6.Store.saveUser(u);
      setModeUi(u);
      updateBalance(true);
      updatePayoutUi();
      toast(t('resetDemo'), 'ok');
    });
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
        var s = btn.dataset.s, a = btn.dataset.a, u = user();
        var cap = Math.min(D6.Store.balanceOf(u), D6.CONFIG.MAX_STAKE);
        if (s) stake = Number(s);
        else if (a === 'x2') stake = Math.min(stake * 2, cap);
        else if (a === 'half') stake = Math.max(Math.floor(stake / 2), D6.CONFIG.MIN_STAKE);
        stake = Math.min(stake, D6.CONFIG.MAX_STAKE);
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
    $('btnOpenDeposit').addEventListener('click', function () { startMaketouCheckout(); });
    $('balanceCard').addEventListener('click', function () { /* solde only */ });
    $('btnProfile').addEventListener('click', openDrawer);
    $('btnCloseDrawer').addEventListener('click', closeDrawer);
    $('drawerBackdrop').addEventListener('click', closeDrawer);
    document.querySelectorAll('.hist-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.hist-tab').forEach(function (x) { x.classList.remove('on'); });
        tab.classList.add('on');
        var live = tab.dataset.feed === 'live';
        $('historyFeed').classList.toggle('hidden', live);
        $('communityFeed').classList.toggle('hidden', !live);
      });
    });
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
      startMaketouCheckout();
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
    $('btnFinance').addEventListener('click', function () {
      var u = user();
      var tx = $('txFeed');
      var list = (u.transactions || []).filter(function (x) { return x.type === 'deposit' || x.type === 'withdraw'; });
      tx.innerHTML = list.length ? list.map(function (x) {
        return '<div class="list-row"><div><strong>' + x.note + '</strong><div class="h-time">' + x.clock + '</div></div><span class="' + (x.amount >= 0 ? 'w' : 'l') + '">' + (x.amount >= 0 ? '+' : '') + D6.fmtFCFA(x.amount) + '</span></div>';
      }).join('') : '<div class="empty-feed">—</div>';
      closeDrawer();
      openModal('financeModal');
    });
    $('closeFinance').addEventListener('click', function () { closeModal('financeModal'); });
    $('btnWithdraw').addEventListener('click', function () { openWithdraw(); });
    $('closeWithdraw').addEventListener('click', function () { closeModal('withdrawModal'); });
    document.querySelectorAll('.op-card').forEach(function (card) {
      card.addEventListener('click', function () {
        selectedOp = card.dataset.op;
        document.querySelectorAll('.op-card').forEach(function (c) { c.classList.toggle('on', c === card); });
      });
    });
    document.querySelectorAll('.wd-pill').forEach(function (pill) {
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
      if (!u) return;
      var amount = Math.round(Number($('withdrawAmt').value) || 0);
      var phone = digitsPhone($('withdrawPhone') && $('withdrawPhone').value);
      var name = (($('withdrawName') && $('withdrawName').value) || '').trim();
      var cc = ($('wdCountry') && $('wdCountry').value) || '+225';
      var real = realWithdrawBalance(u);
      if (amount < D6.CONFIG.MIN_STAKE) { toast(t('minStake'), 'err'); return; }
      if (amount > real) { toast(t('insufficient'), 'err'); return; }
      if (phone.length < 8 || phone.length > 10) { toast(t('wdPhone'), 'err'); return; }
      if (name.length < 3) { toast(t('wdName'), 'err'); return; }
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
    $('btnLogout').addEventListener('click', function () {
      closeDrawer();
      D6.Auth.logout();
      D6.Chart.stop();
      showScreen('screenAuth');
    });
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
      var btn = e.target.closest('[data-adj]');
      if (!btn) return;
      if (D6.Api && D6.Api.token()) await D6.Api.post('adjust', { userId: btn.dataset.adj, delta: Number(btn.dataset.d) });
      D6.Store.adjustReal(btn.dataset.adj, Number(btn.dataset.d));
      renderAdmin();
      updateBalance(false);
    });
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
      navigator.serviceWorker.register('sw.js?v=11').catch(function () { /* ignore */ });
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
    stake = Math.min(1000, D6.Store.balanceOf(u) || 1000, D6.CONFIG.MAX_STAKE);
    $('inputStake').value = stake;
    setModeUi(u);
    setAdminBtns(u);
    updateAssetUi();
    updateDurationUi();
    updateBalance(false);
    renderHistory();
    startCommunity();
    D6.I18N.apply();
    showScreen('screenTrade');
    D6.Chart.setAsset(assetId(u));
    D6.Chart.start();
    requestAnimationFrame(D6.Chart.resize);
    refreshRemoteVault();
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
      D6.Engine.onSettled = applyOutcome;
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
      }, 100);
      document.addEventListener('click', function () {
        document.querySelectorAll('.lang-dd-menu').forEach(function (m) { m.classList.add('hidden'); });
        closeModeMenu();
      });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) refreshRemoteVault();
      });
      window.addEventListener('pageshow', function () { refreshRemoteVault(); });
      setInterval(updatePayoutUi, 1000);
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
      if (D6.Auth.current()) enterApp();
      else showScreen('screenAuth');
    }
  };

  document.addEventListener('DOMContentLoaded', D6.App.boot);
})(window.D6 = window.D6 || {});
