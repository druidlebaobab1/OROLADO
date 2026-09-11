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
  var balanceLockUntil = 0;
  var balanceLockDemo = null;
  var balanceLockReal = null;
  var lastPaintedBalance = null;
  var metaPvAt = 0;
  var metaPvScreen = '';
  var IS_ANDROID = /Android/i.test(navigator.userAgent || '');
  if (IS_ANDROID) {
    try { document.documentElement.classList.add('is-android'); } catch (eAnd) { /* ignore */ }
  }
  var DEMO_TRADES_KEY = 'orolado_demo_trades_v1';

  function bindAndroidTap(el, fn) {
    if (!el || typeof fn !== 'function') return;
    var last = 0;
    function run(e) {
      var now = Date.now();
      if (now - last < 380) return;
      last = now;
      if (e) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }
      fn(e);
    }
    el.addEventListener('click', run);
    if (IS_ANDROID) {
      el.style.pointerEvents = 'auto';
      el.style.touchAction = 'manipulation';
      el.addEventListener('touchend', run, { passive: false });
    }
  }

  function pushDemoTradeCache(pos) {
    if (!IS_ANDROID || !pos) return;
    if ((pos.mode || 'demo') !== 'demo') return;
    try {
      var list = JSON.parse(localStorage.getItem(DEMO_TRADES_KEY) || '[]');
      if (!Array.isArray(list)) list = [];
      list = list.filter(function (p) { return !p || !pos.id || p.id !== pos.id; });
      list.unshift(pos);
      if (list.length > 80) list.length = 80;
      localStorage.setItem(DEMO_TRADES_KEY, JSON.stringify(list));
    } catch (e0) { /* ignore */ }
  }

  function readDemoTradeCache() {
    if (!IS_ANDROID) return [];
    try {
      var list = JSON.parse(localStorage.getItem(DEMO_TRADES_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e1) { return []; }
  }

  function applyAndroidTradeHint() {
    /* Hint pédagogique retiré (UI institutionnelle). */
    var el = document.querySelector('.trade-hint');
    if (el) {
      el.textContent = '';
      el.setAttribute('hidden', '');
      el.style.display = 'none';
    }
  }

  function metaTrack(eventName, params) {
    try {
      if (typeof window.fbq !== 'function') return;
      if (params) window.fbq('track', eventName, params);
      else window.fbq('track', eventName);
    } catch (e) { /* pixel ne doit jamais bloquer le trade */ }
  }

  function metaPageView(screen) {
    var now = Date.now();
    var key = String(screen || 'page');
    if (key === metaPvScreen && (now - metaPvAt) < 1000) return;
    metaPvScreen = key;
    metaPvAt = now;
    metaTrack('PageView');
  }

  var LANGS = D6.LANGS || [
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'pt', flag: '🇧🇷', name: 'Português' },
    { code: 'ar', flag: '🇸🇦', name: 'العربية' },
    { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
    { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
    { code: 'id', flag: '🇮🇩', name: 'Bahasa Indonesia' },
    { code: 'ru', flag: '🇷🇺', name: 'Русский' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'hi', flag: '🇮🇳', name: 'हिन्दी' }
  ];

  function user() { return D6.Auth.current(); }

  function isGuest(u) {
    u = u || user();
    return !!(u && (u.guest || String(u.email || '').indexOf('@orolado.local') >= 0));
  }

  function migrateLegacyDemo(u) {
    if (!u) return;
    var start = D6.CONFIG.DEMO_START || 1000000;
    var cur = Number(D6.Store.demoBalance(u) || 0);
    // Ancienne valeur résiduelle 50 000 → 1 000 000 pour tous.
    if (cur === 50000 || cur === 5000 || (u.guest && cur > 0 && cur < start && cur % 50000 === 0 && cur <= 50000)) {
      D6.Store.setBalanceMode(u, 'demo', start);
    } else if (u.guest && (cur <= 0 || cur === 50000)) {
      D6.Store.setBalanceMode(u, 'demo', start);
    }
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
    var cur = D6.Store.current();
    migrateLegacyDemo(cur);
    return D6.Store.current();
  }

  function requireAccount(msg) {
    if (!isGuest()) return true;
    if (!guardLiveTradeView()) return false;
    // Pas de toast rouge : le pitch authRealPitch suffit.
    showAuthScreen('login', { fromReal: true });
    return false;
  }

  function showAuthScreen(tab, opts) {
    if (!(opts && opts.force) && !guardLiveTradeView()) return;
    showScreen('screenAuth');
    document.querySelectorAll('.auth-tab').forEach(function (el) {
      el.classList.toggle('on', el.dataset.tab === tab);
    });
    if ($('formLogin')) $('formLogin').classList.toggle('hidden', tab !== 'login');
    if ($('formRegister')) $('formRegister').classList.toggle('hidden', tab !== 'register');
    var pitch = $('authRealPitch');
    if (pitch) {
      var showPitch = !!(opts && opts.fromReal);
      pitch.classList.toggle('hidden', !showPitch);
      if (showPitch) pitch.textContent = t('authRealPitch') || pitch.textContent;
    }
    if (tab === 'register') metaTrack('Lead');
  }

  function syncAuthQuick() {
    var q = $('authQuick');
    var trade = $('screenTrade');
    var guest = isGuest();
    if (q) q.classList.toggle('hidden', !guest);
    if (trade) trade.classList.toggle('is-guest', guest);
    if ($('btnProfile')) $('btnProfile').classList.toggle('hidden', guest);
    if ($('btnOpenDeposit')) $('btnOpenDeposit').classList.toggle('hidden', guest);
  }

  function lockBalanceOptimistic(demo, real, ms) {
    balanceLockUntil = Date.now() + (ms || 8000);
    if (demo != null && isFinite(Number(demo))) balanceLockDemo = Number(demo);
    if (real != null && isFinite(Number(real))) balanceLockReal = Number(real);
  }

  function getBalanceLocks() {
    return {
      until: balanceLockUntil,
      demo: balanceLockDemo,
      real: balanceLockReal
    };
  }

  function paintBalanceNow(amount, flash) {
    var el = $('balanceDisplay');
    if (!el) return;
    var text = D6.fmtFCFA(amount);
    if (lastPaintedBalance !== text) {
      el.textContent = text;
      lastPaintedBalance = text;
    }
    if (flash) {
      var card = $('balanceCard');
      if (card) {
        card.classList.remove('flash');
        void card.offsetWidth;
        card.classList.add('flash');
      }
    }
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

  function wagerStatus(u) {
    u = u || user();
    var deposits = Number(u && u.realDepositTotal) || 0;
    var mult = (D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2;
    var required = Number(u && u.requiredWagering) || D6.roundMoney(deposits * mult);
    var done = Number(u && (u.totalWageredSinceDeposit != null ? u.totalWageredSinceDeposit : u.realStakeVolume)) || 0;
    if (u) {
      u.requiredWagering = required;
      u.totalWageredSinceDeposit = done;
    }
    var left = Math.max(0, D6.roundMoney(required - done));
    var pct = required > 0 ? Math.min(100, Math.round((done / required) * 100)) : 100;
    var msg = t('wagerBlocked').replace('{amt}', D6.fmtMoney(left));
    return {
      ok: left <= 0,
      required: required,
      done: done,
      left: left,
      pct: pct,
      msg: msg
    };
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
    metaPageView(name);
  }

  function toast(msg, kind, ms) {
    var el = $('toast');
    if (!el) return;
    var tone = kind === 'err' || kind === 'ok' ? kind : 'info';
    el.className = 'toast lux-msg show ' + tone;
    el.innerHTML = '<span class="lux-msg-ico" aria-hidden="true"></span><span class="lux-msg-txt"></span>';
    var txt = el.querySelector('.lux-msg-txt');
    if (txt) txt.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast lux-msg ' + tone; }, ms || 2800);
  }

  function guardLiveTradeView() {
    if (!(D6.Engine && D6.Engine.liveCount && D6.Engine.liveCount())) return true;
    toast('Trade en cours... Veuillez patienter jusqu’à la fin du compte à rebours pour changer de vue.', '', 3000);
    return false;
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
    el.textContent = isWin ? ('+' + D6.fmtFCFA(amount)) : '+$0';
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
    // Affiche le montant brut crédité (mise + gain), pas le profit net.
    var amount = d.isWin ? Math.abs(Number(d.payout != null ? d.payout : d.net) || 0) : 0;
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

  function findLangMenu(box) {
    if (!box) return null;
    return box.querySelector('.lang-dd-menu') ||
      document.querySelector('.lang-dd-menu[data-owner="' + box.id + '"]');
  }

  function placeLangMenu(btn, menu) {
    if (!btn || !menu) return;
    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }
    var r = btn.getBoundingClientRect();
    var w = Math.min(220, Math.max(200, window.innerWidth - 16));
    var left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
    var top = r.bottom + 6;
    if (top + 280 > window.innerHeight - 8) top = Math.max(8, r.top - 286);
    menu.style.position = 'fixed';
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
    menu.style.right = 'auto';
    menu.style.width = w + 'px';
    menu.style.zIndex = '9999';
  }

  function closeLangMenus() {
    document.querySelectorAll('.lang-dd-menu').forEach(function (m) { m.classList.add('hidden'); });
    document.querySelectorAll('[data-lang-toggle]').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
    });
  }

  function fillLangBars() {
    document.querySelectorAll('body > .lang-dd-menu').forEach(function (m) { m.remove(); });
    function render(boxId) {
      var box = $(boxId);
      if (!box) return;
      var cur = LANGS.filter(function (l) { return l.code === D6.I18N.lang; })[0] || LANGS[0];
      box.innerHTML = '<button type="button" class="lang-dd-btn" data-lang-toggle="1" aria-haspopup="listbox" aria-expanded="false"><span class="lang-flag">' + cur.flag + '</span><span class="lang-chev">▾</span></button>' +
        '<div class="lang-dd-menu hidden" role="listbox" data-owner="' + boxId + '">' + LANGS.map(function (l) {
          return '<button type="button" class="lang-btn' + (l.code === D6.I18N.lang ? ' on' : '') + '" data-lang="' + l.code + '" role="option">' +
            '<span class="lang-flag">' + l.flag + '</span><span class="lang-name">' + (l.name || l.code) + '</span></button>';
        }).join('') + '</div>';
    }
    render('langBarAuth');
    render('langBarTrade');
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var box = btn.parentElement;
        var menu = findLangMenu(box);
        var open = menu && !menu.classList.contains('hidden');
        closeLangMenus();
        if (menu && !open) {
          menu.setAttribute('data-owner', box.id || '');
          menu.addEventListener('click', function (ev) { ev.stopPropagation(); });
          document.body.appendChild(menu);
          menu.classList.remove('hidden');
          placeLangMenu(btn, menu);
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeLangMenus();
        D6.I18N.set(btn.dataset.lang);
        fillLangBars();
        var u = user();
        if (u) {
          setModeUi(u);
          updateBalance(false);
          updatePayoutUi();
          renderHistory();
        }
        if ($('screenAdmin') && !$('screenAdmin').classList.contains('hidden')) renderAdmin();
      });
    });
  }

  document.addEventListener('orolado-i18n', function () {
    try { fillLangBars(); } catch (eLang) { /* ignore */ }
    var u = user();
    if (u) {
      setModeUi(u);
      try { updatePayoutUi(); } catch (e0) { /* ignore */ }
    }
    applyAndroidTradeHint();
    try { refreshCryptoI18n(); } catch (eCrypto) { /* ignore */ }
  });

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
    var isAdm = !!(u && D6.Auth.isAdmin(u));
    if ($('drawerAdminBlock')) $('drawerAdminBlock').classList.toggle('hidden', !isAdm);
    if ($('btnAdmin2')) $('btnAdmin2').classList.toggle('hidden', !isAdm);
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
    if (!guardLiveTradeView()) {
      setModeUi(u);
      return;
    }
    u.mode = next === 'real' ? 'real' : 'demo';
    D6.Store.saveUser(u);
    stake = D6.CONFIG.MIN_STAKE || 1;
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
    if (Date.now() < balanceLockUntil) {
      if (balanceLockDemo != null) demo = Math.max(demo, balanceLockDemo);
      if (balanceLockReal != null) real = Math.max(real, balanceLockReal);
      // Pendant le lock, privilégie la valeur locale (optimistic) pour éviter le flash ancien→nouveau.
      if (u.mode !== 'real' && balanceLockDemo != null) demo = balanceLockDemo;
      if (u.mode === 'real' && balanceLockReal != null) real = balanceLockReal;
    }
    var active = u.mode === 'real' ? real : demo;
    paintBalanceNow(active, !!flash);
    if ($('profWalletBal')) $('profWalletBal').textContent = '$' + (Number(real) || 0).toFixed(2);
    if ($('balanceAlt')) {
      $('balanceAlt').textContent = '';
      $('balanceAlt').hidden = true;
    }
    setModeChrome(u);
  }

  function updatePayoutUi() {
    var u = user();
    if (!u || !$('payoutV100')) return;
    var ids = ['v100', 'stable', 'v75', 'crash300', 'boom300'];
    var map = { v100: 'payoutV100', stable: 'payoutStable', v75: 'payoutV75', crash300: 'payoutCrash300', boom300: 'payoutBoom300' };
    var odds = currentOdds(u);
    var pct = Math.round((odds - 1) * 100);
    ids.forEach(function (id) {
      var el = $(map[id]);
      if (!el) return;
      el.textContent = pct + '%';
    });
    var stake = Math.max(D6.CONFIG.MIN_STAKE, D6.roundMoney(Number($('inputStake').value) || 1));
    if ($('previewGain')) $('previewGain').textContent = D6.fmtFCFA(D6.roundMoney(stake * odds));
    if ($('previewMult')) $('previewMult').textContent = t('payoutPreview').replace('{pct}', String(pct));
    document.querySelectorAll('.odds-chip').forEach(function (btn) {
      btn.classList.toggle('on', Math.abs(Number(btn.dataset.odds) - odds) < 0.001);
    });
  }

  function currentOdds(u) {
    u = u || user();
    var list = (D6.CONFIG && D6.CONFIG.ODDS_MULT) || [1.88, 6, 11, 51];
    var n = Number(u && u.odds != null ? u.odds : (D6.CONFIG.DEFAULT_ODDS || 1.88));
    var i;
    for (i = 0; i < list.length; i++) {
      if (Math.abs(list[i] - n) < 0.001) return list[i];
    }
    return list[0];
  }

  function setOdds(mult) {
    var u = user();
    if (!u) return;
    var list = (D6.CONFIG && D6.CONFIG.ODDS_MULT) || [1.88, 6, 11, 51];
    var n = Number(mult);
    var i;
    var ok = list[0];
    for (i = 0; i < list.length; i++) {
      if (Math.abs(list[i] - n) < 0.001) { ok = list[i]; break; }
    }
    u.odds = ok;
    D6.Store.saveUser(u);
    updatePayoutUi();
  }

  function updateAssetUi() {
    var u = user();
    if (!u) return;
    var id = assetId(u);
    document.querySelectorAll('.asset-chip').forEach(function (el) {
      el.classList.toggle('on', el.dataset.asset === id);
    });
    var asset = D6.CONFIG.ASSETS[id];
    if ($('assetLiveName')) $('assetLiveName').textContent = asset.name;
    if ($('assetLiveTag')) $('assetLiveTag').textContent = asset.tag;
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
    var priceEl = $('currentPrice');
    if (priceEl) priceEl.textContent = D6.fmtPrice(market.price);
    var pnl = $('livePnl');
    if (!pnl) return;
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
      label = '+$0';
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

  function renderHistorySheet(forceMode) {
    var el = $('historySheetFeed');
    if (!el) return;
    var u = user();
    var mode = (forceMode === 'real' || forceMode === 'demo')
      ? forceMode
      : ((u && u.mode === 'real') ? 'real' : 'demo');
    if ($('histSheetTitle')) {
      $('histSheetTitle').textContent = mode === 'real'
        ? (t('histSheetReal') || 'Historique des trades (Compte Reel)')
        : (t('histSheetDemo') || 'Historique des trades (Compte Demo)');
    }
    var live = (D6.Engine.getTrades ? D6.Engine.getTrades(mode) : []).filter(function (tr) {
      return !tr.mode || tr.mode === mode;
    });
    live.sort(function (a, b) { return (b.startTime || 0) - (a.startTime || 0); });
    var settled = ((u && u.positions) || []).filter(function (p) {
      return (p.mode || 'demo') === mode;
    });
    // Android : miroir localStorage pour guests / reseau lent (demo only).
    if (IS_ANDROID && mode === 'demo') {
      var cached = readDemoTradeCache();
      if (cached.length) {
        var seen = {};
        settled.forEach(function (p) { if (p && p.id) seen[p.id] = 1; });
        cached.forEach(function (p) {
          if (!p || !p.id || seen[p.id]) return;
          if ((p.mode || 'demo') !== 'demo') return;
          settled.push(p);
          seen[p.id] = 1;
        });
        settled.sort(function (a, b) {
          return String(b.at || '').localeCompare(String(a.at || ''));
        });
      }
    }
    var rows = [];
    function durLabel(d) {
      d = Number(d) || 0;
      if (d >= 60) return (d / 60) + ' min';
      return d + 's';
    }
    live.forEach(function (tr) {
      var stake = Number(tr.stake || 0);
      var left = Math.max(0, Number(tr.timeLeft) || 0);
      var asset = D6.CONFIG.ASSETS[tr.assetId];
      var name = (asset && (asset.short || asset.name)) || tr.assetId || '-';
      rows.push('<tr class="hist-open"><td>' + fmtTimerLeft(left) + '</td><td>' + name +
        '</td><td>' + (tr.side === 'call' ? 'CALL' : 'PUT') + '</td><td>' + D6.fmtFCFA(stake) +
        '</td><td>' + (t('histOpen') || 'En cours') + ' · ' + durLabel(tr.duration) +
        '</td><td>—</td></tr>');
    });
    settled.slice(0, 50).forEach(function (h) {
      var stake = Number(h.stake || 0);
      var payoutAmt = Math.floor(stake * Number(h.payout || 1.88));
      var net = h.voided || h.status === 'void' ? 0 : (h.won ? (payoutAmt - stake) : -stake);
      var res = (h.voided || h.status === 'void') ? 'Egalite' : (h.won ? 'Gagne' : 'Perdu');
      var pnlCls = net > 0 ? 'w' : (net < 0 ? 'l' : '');
      var pnlTxt = (net > 0 ? '+' : (net < 0 ? '-' : '')) + D6.fmtFCFA(Math.abs(net));
      rows.push('<tr><td>' + (h.clock || fmtWhen(h.at)) + '</td><td>' + (h.assetName || h.assetId || '-') +
        '</td><td>' + (h.side === 'call' ? 'CALL' : 'PUT') + '</td><td>' + D6.fmtFCFA(stake) +
        '</td><td>' + res + ' · ' + durLabel(h.duration) + '</td><td class="' + pnlCls + '">' + pnlTxt + '</td></tr>');
    });
    el.innerHTML = rows.length
      ? '<table class="hist-table"><thead><tr><th>Heure</th><th>Actif</th><th>Sens</th><th>Montant</th><th>Resultat</th><th>P&amp;L</th></tr></thead><tbody>' +
        rows.join('') + '</tbody></table>'
      : '<div class="empty-feed">' + (t('noTradesHint') || 'Aucun trade pour l\'instant') + '</div>';
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
      // Montant total crédité (mise × multiplicateur), pas le net.
      if (res.position && res.position.stake) {
        return Math.floor(Number(res.position.stake) * Number(res.position.payout || 1.88));
      }
      if (res.trade && res.trade.stake) {
        return Math.floor(Number(res.trade.stake) * Number(res.trade.payout || 1.88));
      }
      if (res.net != null && res.position && res.position.stake) {
        return Math.abs(Number(res.net)) + Number(res.position.stake);
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
    var real = D6.Store.realBalance ? D6.Store.realBalance(u) : 0;
    if ($('profWalletBal')) $('profWalletBal').textContent = '$' + (Number(real) || 0).toFixed(2);
    if ($('profWalletAddr')) {
      var wa = (D6.CONFIG && D6.CONFIG.USDT_TRC20_ADDRESS) || 'TD32ZDYDvhej6MGk7ZsYC5jLKDdCoJquP1';
      $('profWalletAddr').textContent = wa.length > 14 ? (wa.slice(0, 8) + '…' + wa.slice(-6)) : wa;
    }
    setAdminBtns(u);
  }

  function bindWalletCard() {
    if ($('btnExpressCrypto') && !$('btnExpressCrypto')._oroBound) {
      $('btnExpressCrypto')._oroBound = true;
      bindAndroidTap($('btnExpressCrypto'), function () {
        if (!requireAccount()) return;
        openDeposit();
        setDepositPayMethod('usdt');
      });
    }
    if ($('btnCopyWallet') && !$('btnCopyWallet')._oroBound) {
      $('btnCopyWallet')._oroBound = true;
      bindAndroidTap($('btnCopyWallet'), function () {
        var addr = (D6.CONFIG && D6.CONFIG.USDT_TRC20_ADDRESS) || 'TD32ZDYDvhej6MGk7ZsYC5jLKDdCoJquP1';
        var btn = $('btnCopyWallet');
        function ok() {
          var prev = btn.textContent;
          btn.textContent = t('copied') || 'Copié';
          setTimeout(function () { btn.textContent = prev || 'Copier'; }, 1200);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr).then(ok).catch(function () {
            try {
              var ta = document.createElement('textarea');
              ta.value = addr;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              ok();
            } catch (e) { toast(addr, ''); }
          });
          return;
        }
        toast(addr, '');
      });
    }
  }

  function bindCopyPublicId() {
    var btn = $('btnCopyPublicId');
    if (!btn || btn._oroBound) return;
    btn._oroBound = true;
    btn.addEventListener('click', function () {
      var id = ($('profPublicId') && $('profPublicId').textContent) || '';
      if (!id || id === '—') return;
      function ok() {
        var prev = btn.textContent;
        btn.textContent = t('copied') || 'Copié';
        setTimeout(function () { btn.textContent = prev || (t('copyId') || 'Copier'); }, 1200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).then(ok).catch(function () {
          try {
            var ta = document.createElement('textarea');
            ta.value = id; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta); ok();
          } catch (e) { /* ignore */ }
        });
      }
    });
  }

  function openDrawer() {
    fillProfile();
    var bd = $('drawerBackdrop');
    var dr = $('drawerProfile');
    if (bd) bd.classList.add('on');
    if (dr) {
      dr.classList.add('on');
      dr.setAttribute('aria-hidden', 'false');
    }
    document.documentElement.classList.add('oro-profile-open');
    closeModal('logoutModal');
  }
  function closeDrawer() {
    var bd = $('drawerBackdrop');
    var dr = $('drawerProfile');
    if (bd) bd.classList.remove('on');
    if (dr) {
      dr.classList.remove('on');
      dr.setAttribute('aria-hidden', 'true');
    }
    document.documentElement.classList.remove('oro-profile-open');
  }

  function profileSubModalOpen() {
    return ['financeModal', 'withdrawModal', 'passModal', 'historySheet'].some(function (id) {
      var el = $(id);
      return el && el.classList.contains('active');
    });
  }

  var adminCache = {
    users: [],
    messages: [],
    withdrawals: [],
    deposits: [],
    depositsPaid: [],
    metrics: {},
    gameStats: null,
    traffic: {},
    onlineIds: {}
  };
  var adminView = 'inscrits';
  var adminSortDeposit = 'desc';
  var adminPresenceTimer = 0;

  function captureUtmSource() {
    try {
      var p = new URLSearchParams(window.location.search || '');
      var s = String(p.get('utm_source') || '').toLowerCase().trim();
      if (s) {
        localStorage.setItem('orolado_utm_source', s.replace(/[^a-z0-9_\-.]/g, '').slice(0, 40) || 'direct');
      } else if (!localStorage.getItem('orolado_utm_source')) {
        localStorage.setItem('orolado_utm_source', 'direct');
      }
    } catch (e) { /* ignore */ }
  }

  function pingAdminPresence() {
    if (!(D6.Api && D6.Api.token && D6.Api.token())) return;
    D6.Api.post('presence', {}).catch(function () { /* ignore */ });
    if (D6.Supabase && D6.Supabase.pingPresence) D6.Supabase.pingPresence();
  }

  function startAdminPresence() {
    pingAdminPresence();
    if (adminPresenceTimer) clearInterval(adminPresenceTimer);
    adminPresenceTimer = setInterval(pingAdminPresence, 30000);
  }

  function adminEsc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function adminEmailCell(email) {
    var e = adminEsc(email || '');
    return '<span class="admin-email" title="' + e + '">' + e + '</span>';
  }

  function adminMatchQ(blob, q) {
    if (!q) return true;
    return String(blob || '').toLowerCase().indexOf(q) >= 0;
  }

  function adminUserBlob(u) {
    return [(u.publicId || ''), u.email || '', u.displayName || '', u.phone || '', (u.countryCode || '') + (u.phone || ''), u.id || ''].join(' ');
  }

  function adminIsOnlineUser(u) {
    if (adminCache.onlineIds && adminCache.onlineIds[u.id]) return true;
    var ls = u.lastSeen || '';
    if (!ls) return false;
    var t = Date.parse(ls);
    return isFinite(t) && (Date.now() - t) < 90000;
  }

  function adminActives(users) {
    return (users || []).filter(function (u) { return Number(u.totalDeposited || 0) > 0; });
  }

  function setAdminViewActive(view) {
    adminView = view || 'inscrits';
    document.querySelectorAll('.metric-btn[data-admin-view]').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-admin-view') === adminView);
    });
  }

  function adminViewTitle(view) {
    var map = {
      online: 'En ligne',
      inscrits: 'Inscrits',
      actifs: 'Actifs (≥1 dépôt réel)',
      depositsTotal: 'Total dépôts (validés)',
      withdrawalsAll: 'Total retraits',
      net: 'NET / Soldes',
      depositsPending: 'Dépôts en attente',
      withdrawalsPending: 'Retraits en cours',
      top: 'TOP clients',
      games: 'Jeux',
      traffic: 'Trafic'
    };
    return map[view] || 'Admin';
  }

  async function refreshOnlineIds() {
    adminCache.onlineIds = {};
    var nPhp = 0;
    (adminCache.users || []).forEach(function (u) {
      if (adminIsOnlineUser(u)) {
        adminCache.onlineIds[u.id] = true;
        nPhp++;
      }
    });
    if (D6.Supabase && D6.Supabase.listOnline) {
      try {
        var rows = await D6.Supabase.listOnline();
        (rows || []).forEach(function (r) {
          if (r && r.id) adminCache.onlineIds[r.id] = true;
        });
      } catch (e) { /* ignore */ }
    }
    return Object.keys(adminCache.onlineIds).length || nPhp;
  }

  async function renderAdmin() {
    var remote = D6.Api ? await D6.Api.post('admin', {}) : null;
    if (!remote || !remote.ok) {
      adminCache.users = [];
      adminCache.messages = [];
      adminCache.withdrawals = [];
      adminCache.deposits = [];
      adminCache.depositsPaid = [];
      adminCache.metrics = {};
      adminCache.gameStats = null;
      adminCache.traffic = {};
      if ($('screenAdmin') && !$('screenAdmin').classList.contains('hidden')) {
        showScreen('screenTrade');
      }
      return false;
    }
    var m = remote.metrics || {};
    var users = remote.users || [];
    var wd = remote.withdrawals || [];
    var msgs = remote.messages || [];
    adminCache.users = users;
    adminCache.messages = msgs;
    adminCache.withdrawals = wd || [];
    adminCache.deposits = (remote && remote.ok && remote.deposits) ? remote.deposits : [];
    adminCache.depositsPaid = (remote && remote.ok && remote.depositsPaid) ? remote.depositsPaid : [];
    adminCache.metrics = m || {};
    adminCache.gameStats = (remote && remote.ok) ? (remote.gameStats || null) : null;
    adminCache.traffic = (remote && remote.ok && remote.traffic) ? remote.traffic : {};

    $('mDeposits').textContent = D6.fmtFCFA(m.deposits || 0);
    $('mPending').textContent = D6.fmtFCFA(m.withdrawals != null ? m.withdrawals : m.pending || 0);
    if ($('mExposure')) $('mExposure').textContent = D6.fmtFCFA(m.exposure || 0);
    $('mProfit').textContent = D6.fmtFCFA(m.profit != null ? m.profit : 0);
    $('mUsers').textContent = String(m.users || 0);
    if ($('mDepPending')) $('mDepPending').textContent = String(adminCache.deposits.length);
    if ($('mWdPending')) {
      var wp = adminCache.withdrawals.filter(function (w) { return w.status === 'pending'; }).length;
      $('mWdPending').textContent = String(wp);
    }
    if ($('mOnline')) {
      $('mOnline').textContent = '…';
      var nOnline = await refreshOnlineIds();
      if (D6.Supabase && D6.Supabase.countOnline) {
        D6.Supabase.countOnline().then(function (n) {
          if ($('mOnline')) $('mOnline').textContent = String(Math.max(Number(n) || 0, nOnline));
        }).catch(function () {
          if ($('mOnline')) $('mOnline').textContent = String(nOnline);
        });
      } else {
        $('mOnline').textContent = String(nOnline);
      }
    }
    setAdminViewActive(adminView);
    renderAdminView();
    renderAdminMessagesList();
    return true;
  }

  function renderAdminMessagesList() {
    var box = $('adminMessages');
    if (!box) return;
    var msgs = adminCache.messages || [];
    if (!msgs.length) box.innerHTML = '<div class="empty-feed">Aucun message</div>';
    else {
      var mrows = msgs.map(function (msg) {
        var acts = msg.status === 'ouvert'
          ? '<button class="mini ok" data-msg="' + adminEsc(msg.id) + '">Résoudre</button>'
          : adminEsc(msg.status || 'resolu');
        return '<tr><td>' + adminEsc(msg.publicId || '') + '<div class="h-time">' + adminEmailCell(msg.email) + '</div></td><td>' + adminEsc(msg.subject || '') +
          '<div class="h-time">' + adminEsc(msg.message || '') + '</div></td><td>' + acts + '</td></tr>';
      }).join('');
      box.innerHTML = '<table class="admin-table"><thead><tr><th>User</th><th>Message</th><th></th></tr></thead><tbody>' + mrows + '</tbody></table>';
    }
  }

  function renderAdminView() {
    var panel = $('adminViewPanel');
    var title = $('adminViewTitle');
    if (!panel) return;
    if (title) title.textContent = adminViewTitle(adminView);
    var q = String(($('adminSearch') && $('adminSearch').value) || '').trim().toLowerCase();
    var html = '';
    if (adminView === 'net') {
      var m = adminCache.metrics || {};
      html = '<div class="admin-net-panel">' +
        '<div class="list-row"><span>Total dépôts</span><strong>' + D6.fmtFCFA(m.deposits || 0) + '</strong></div>' +
        '<div class="list-row"><span>Total retraits</span><strong>' + D6.fmtFCFA(m.withdrawals != null ? m.withdrawals : m.pending || 0) + '</strong></div>' +
        '<div class="list-row"><span>Soldes réels</span><strong>' + D6.fmtFCFA(m.exposure || 0) + '</strong></div>' +
        '<div class="list-row"><span>NET plateforme</span><strong>' + D6.fmtFCFA(m.profit != null ? m.profit : 0) + '</strong></div>' +
        '<p class="hint-min">Chiffres serveur inchangés (pas de recalcul).</p></div>';
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'games') {
      var gs = adminCache.gameStats;
      if (!gs || !gs.total) {
        panel.innerHTML = '<div class="empty-feed">pas de data</div>';
        return;
      }
      function rowsFromMap(map) {
        return Object.keys(map || {}).sort().map(function (k) {
          return '<tr><td>' + adminEsc(k) + '</td><td>' + adminEsc(map[k]) + '</td></tr>';
        }).join('');
      }
      html = '<table class="admin-table"><thead><tr><th>Indice</th><th>Nb</th></tr></thead><tbody>' + rowsFromMap(gs.byAsset) + '</tbody></table>';
      html += '<table class="admin-table" style="margin-top:10px"><thead><tr><th>Durée (s)</th><th>Nb</th></tr></thead><tbody>' + rowsFromMap(gs.byDuration) + '</tbody></table>';
      if (gs.byAssetMode) {
        html += '<p class="hint-min" style="margin-top:10px">Réel / démo</p>';
        html += '<table class="admin-table"><thead><tr><th>Mode · Indice</th><th>Nb</th></tr></thead><tbody>';
        ['real', 'demo'].forEach(function (mode) {
          Object.keys(gs.byAssetMode[mode] || {}).forEach(function (aid) {
            html += '<tr><td>' + mode + ' · ' + adminEsc(aid) + '</td><td>' + gs.byAssetMode[mode][aid] + '</td></tr>';
          });
        });
        html += '</tbody></table>';
      }
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'traffic') {
      var traf = adminCache.traffic || {};
      var keys = Object.keys(traf);
      if (!keys.length) {
        panel.innerHTML = '<div class="empty-feed">pas de data</div>';
        return;
      }
      html = '<table class="admin-table"><thead><tr><th>Source</th><th>Comptes</th></tr></thead><tbody>' +
        keys.sort().map(function (k) {
          return '<tr><td>' + adminEsc(k) + '</td><td>' + traf[k] + '</td></tr>';
        }).join('') + '</tbody></table>';
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'depositsPending') {
      var deps = (adminCache.deposits || []).filter(function (d) {
        return adminMatchQ([d.publicId, d.name, d.email, d.ref, d.operator, d.txid, String(d.amount || '')].join(' '), q);
      });
      if (!deps.length) html = '<div class="empty-feed">' + t('noDeposit') + '</div>';
      else {
        var drows = deps.map(function (d) {
          var acts = '<button class="mini ok" data-dep="' + adminEsc(d.ref) + '" data-amt="' + Number(d.amount || 0) + '" data-ok="1">' + t('approve') + '</button>' +
            ' <button class="mini bad" data-dep="' + adminEsc(d.ref) + '" data-ok="0">' + t('reject') + '</button>';
          return '<tr><td>' + adminEsc(d.publicId || d.name || '') + '<div class="h-time">' + adminEmailCell(d.email) + '</div></td><td>' + D6.fmtFCFA(d.amount) +
            '</td><td>' + adminEsc(d.operator || '') + '<div class="h-time">' + adminEsc(d.txid || d.ref) + '</div></td><td>' + acts + '</td></tr>';
        }).join('');
        html = '<table class="admin-table"><thead><tr><th>Joueur</th><th>Montant</th><th>Référence</th><th></th></tr></thead><tbody>' + drows + '</tbody></table>';
      }
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'withdrawalsPending' || adminView === 'withdrawalsAll') {
      var wdList = (adminCache.withdrawals || []).filter(function (w) {
        if (adminView === 'withdrawalsPending' && w.status !== 'pending') return false;
        return adminMatchQ([w.name, w.phone, w.operator, w.id, w.status, String(w.amount || '')].join(' '), q);
      });
      if (!wdList.length) html = '<div class="empty-feed">' + t('noWithdraw') + '</div>';
      else {
        var wrows = wdList.map(function (w) {
          var badge = w.suspect ? ' <span class="badge-suspect">' + t('suspect') + '</span>' : '';
          var acts = w.status === 'pending'
            ? '<button class="mini ok" data-wd="' + adminEsc(w.id) + '" data-ok="1">' + t('approve') + '</button> <button class="mini bad" data-wd="' + adminEsc(w.id) + '" data-ok="0">' + t('reject') + '</button>'
            : adminEsc(w.status);
          var dest = (w.operator || '') + ' · ' + (w.destination || w.phone || '') + (w.beneficiary ? ' · ' + w.beneficiary : '');
          return '<tr><td>' + adminEsc(w.name) + '</td><td>' + D6.fmtFCFA(w.amount) + '</td><td>' + adminEsc(dest) + '<div class="h-time">' + adminEsc(w.clock || '') + badge + '</div></td><td>' + acts + '</td></tr>';
        }).join('');
        html = '<table class="admin-table"><thead><tr><th>Joueur</th><th>Montant</th><th>Mobile Money</th><th>Statut</th></tr></thead><tbody>' + wrows + '</tbody></table>';
      }
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'depositsTotal') {
      var paid = (adminCache.depositsPaid || []).filter(function (d) {
        return adminMatchQ([d.publicId, d.name, d.email, d.ref, d.operator, String(d.amount || ''), d.at].join(' '), q);
      });
      if (!paid.length) html = '<div class="empty-feed">Aucun dépôt validé</div>';
      else {
        html = '<table class="admin-table"><thead><tr><th>User</th><th>Montant</th><th>Opérateur</th><th>Date</th><th>Réf</th></tr></thead><tbody>' +
          paid.map(function (d) {
            return '<tr><td>' + adminEsc(d.publicId || d.name || '') + '<div class="h-time">' + adminEmailCell(d.email) + '</div></td><td>' + D6.fmtFCFA(d.amount) +
              '</td><td>' + adminEsc(d.operator || '') + '</td><td>' + adminEsc(String(d.at || '').slice(0, 19)) + '</td><td>' + adminEsc(d.ref) + '</td></tr>';
          }).join('') + '</tbody></table>';
      }
      panel.innerHTML = html;
      return;
    }

    // user-list views: online / inscrits / actifs / top
    var list = adminCache.users || [];
    if (adminView === 'online') list = list.filter(adminIsOnlineUser);
    if (adminView === 'actifs' || adminView === 'top') list = adminActives(list);
    if (adminView === 'top' || adminView === 'actifs') {
      var dir = adminSortDeposit === 'asc' ? 1 : -1;
      list = list.slice().sort(function (a, b) {
        return dir * (Number(a.totalDeposited || 0) - Number(b.totalDeposited || 0));
      });
    }
    list = list.filter(function (u) { return adminMatchQ(adminUserBlob(u), q); });
    if (!list.length) {
      panel.innerHTML = '<div class="empty-feed">' + t('noUsers') + '</div>';
      return;
    }
    if (adminView === 'online') {
      html = '<table class="admin-table"><thead><tr><th>ID</th><th>Pseudo</th><th>Tél</th><th>Solde réel</th><th>Dernière action</th></tr></thead><tbody>' +
        list.map(function (u) {
          return '<tr data-user="' + adminEsc(u.id) + '"><td>' + adminEsc(u.publicId || '') + '</td><td>' + adminEsc(u.displayName || '') +
            '</td><td>' + adminEsc((u.countryCode || '') + ' ' + (u.phone || '')) + '</td><td>' + D6.fmtFCFA(u.realBalance) +
            '</td><td>' + adminEsc(String(u.lastAction || u.lastSeen || '').slice(0, 19)) + '</td></tr>';
        }).join('') + '</tbody></table>';
    } else if (adminView === 'actifs' || adminView === 'top') {
      var sortMark = adminSortDeposit === 'asc' ? ' ↑' : ' ↓';
      html = '<table class="admin-table"><thead><tr>' +
        (adminView === 'top' ? '<th>Rang</th>' : '') +
        '<th>ID</th><th>Pseudo</th><th>Tél</th><th class="sortable" data-sort-dep="1">Total déposé' + sortMark + '</th><th>Total retiré</th><th>Solde réel</th>' +
        (adminView === 'actifs' ? '<th>Nb trades réel</th>' : '') +
        '</tr></thead><tbody>' +
        list.map(function (u, i) {
          return '<tr data-user="' + adminEsc(u.id) + '">' +
            (adminView === 'top' ? '<td>' + (i + 1) + '</td>' : '') +
            '<td>' + adminEsc(u.publicId || '') + '</td><td>' + adminEsc(u.displayName || '') +
            '</td><td>' + adminEsc((u.countryCode || '') + ' ' + (u.phone || '')) +
            '</td><td>' + D6.fmtFCFA(u.totalDeposited || 0) + '</td><td>' + D6.fmtFCFA(u.totalWithdrawn || 0) +
            '</td><td>' + D6.fmtFCFA(u.realBalance) + '</td>' +
            (adminView === 'actifs' ? '<td>' + Number(u.realTrades || 0) + '</td>' : '') +
            '</tr>';
        }).join('') + '</tbody></table>';
    } else {
      // inscrits
      html = '<table class="admin-table"><thead><tr><th>ID</th><th>Pseudo</th><th>E-mail</th><th>Tél</th><th>Date</th><th>Solde réel</th></tr></thead><tbody>' +
        list.map(function (u) {
          var d = (u.createdAt || '').slice(0, 10);
          return '<tr data-user="' + adminEsc(u.id) + '"><td>' + adminEsc(u.publicId || '') + '</td><td>' + adminEsc(u.displayName || '') +
            '</td><td>' + adminEmailCell(u.email) + '</td><td>' + adminEsc((u.countryCode || '') + ' ' + (u.phone || '')) +
            '</td><td>' + adminEsc(d) + '</td><td>' + D6.fmtFCFA(u.realBalance) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    panel.innerHTML = html;
  }

  function renderAdminUsers(q) {
    if (arguments.length && $('adminSearch') && q != null) $('adminSearch').value = q;
    renderAdminView();
  }

  function adminTxStatusLabel(st) {
    var s = String(st || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'PAID' || s === 'APPROVED' || s === 'OK' || s === 'SUCCESS') return 'Succès';
    if (s === 'PENDING' || s === 'WAITING') return 'En attente';
    if (s === 'REJECTED' || s === 'FAILED' || s === 'CANCELLED' || s === 'ERROR') return 'Échoué';
    return st ? String(st) : '—';
  }

  function adminTxTypeLabel(type) {
    var t0 = String(type || '').toLowerCase();
    if (t0 === 'deposit' || t0 === 'recharge') return 'Dépôt';
    if (t0 === 'withdraw' || t0 === 'withdrawal') return 'Retrait';
    if (t0 === 'adjust' || t0 === 'admin' || t0 === 'credit' || t0 === 'debit') return 'Ajustement Admin';
    if (t0 === 'win') return 'Gain trade';
    if (t0 === 'void') return 'Remboursement';
    return type ? String(type) : 'Transaction';
  }

  function collectPlayerFinanceRows(u) {
    var uid = String((u && u.id) || '');
    var rows = [];
    var seen = {};
    function pushRow(row) {
      if (!row) return;
      var key = [row.at, row.type, row.amount, row.ref].join('|');
      if (seen[key]) return;
      seen[key] = 1;
      rows.push(row);
    }
    (adminCache.depositsPaid || []).forEach(function (d) {
      if (String(d.userId || '') !== uid) return;
      pushRow({
        at: d.at || d.paidAt || d.createdAt || '',
        type: 'deposit',
        amount: Number(d.amount) || 0,
        status: d.status || 'COMPLETED',
        ref: d.ref || d.id || (d.operator ? ('Maketou/' + d.operator) : 'Maketou')
      });
    });
    (adminCache.deposits || []).forEach(function (d) {
      if (String(d.userId || '') !== uid) return;
      pushRow({
        at: d.at || d.createdAt || '',
        type: 'deposit',
        amount: Number(d.amount) || 0,
        status: d.status || 'PENDING',
        ref: d.ref || d.id || 'Maketou'
      });
    });
    (adminCache.withdrawals || []).forEach(function (w) {
      if (String(w.userId || '') !== uid) return;
      pushRow({
        at: w.at || w.createdAt || w.clock || '',
        type: 'withdraw',
        amount: Number(w.amount) || 0,
        status: w.status || 'pending',
        ref: w.id || w.ref || (w.method || 'retrait')
      });
    });
    ((u && u.transactions) || []).forEach(function (tx) {
      var typ = String(tx.type || '').toLowerCase();
      if (typ !== 'deposit' && typ !== 'withdraw' && typ !== 'withdrawal' && typ !== 'adjust' && typ !== 'admin' && typ !== 'credit' && typ !== 'debit') {
        if (tx.mode === 'real' && (typ === 'win' || typ === 'void')) {
          /* garder gains/void réel pour audit */
        } else if (!(tx.note && /admin|bonus|correction|ajust/i.test(String(tx.note)))) {
          return;
        }
      }
      pushRow({
        at: tx.at || tx.createdAt || '',
        type: typ === 'withdrawal' ? 'withdraw' : (typ || 'adjust'),
        amount: Number(tx.amount) || 0,
        status: tx.status || 'OK',
        ref: tx.ref || tx.id || (tx.note || 'ledger')
      });
    });
    rows.sort(function (a, b) {
      return String(b.at || '').localeCompare(String(a.at || ''));
    });
    return rows.slice(0, 10);
  }

  function renderPlayerFinanceBlock(u) {
    var totalDep = Number(u.totalDeposited || 0);
    var totalWd = Number(u.totalWithdrawn || 0);
    if (!totalDep) {
      (adminCache.depositsPaid || []).forEach(function (d) {
        if (String(d.userId || '') === String(u.id || '')) totalDep += Number(d.amount) || 0;
      });
    }
    if (!totalWd) {
      (adminCache.withdrawals || []).forEach(function (w) {
        if (String(w.userId || '') === String(u.id || '') && String(w.status || '').toLowerCase() === 'approved') {
          totalWd += Number(w.amount) || 0;
        }
      });
    }
    var net = totalDep - totalWd;
    var rows = collectPlayerFinanceRows(u);
    var table = rows.length
      ? ('<div class="table-wrap admin-finance-table"><table class="hist-table"><thead><tr>' +
        '<th>Date</th><th>Type</th><th>Montant</th><th>Statut</th><th>Réf.</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var dt = String(r.at || '').replace('T', ' ').slice(0, 16);
          return '<tr><td>' + adminEsc(dt || '—') + '</td><td>' + adminEsc(adminTxTypeLabel(r.type)) +
            '</td><td>' + D6.fmtFCFA(r.amount) + '</td><td>' + adminEsc(adminTxStatusLabel(r.status)) +
            '</td><td class="admin-finance-ref">' + adminEsc(String(r.ref || '—').slice(0, 28)) + '</td></tr>';
        }).join('') +
        '</tbody></table></div>')
      : '<p class="hint-min">Aucune transaction financière enregistrée pour ce joueur.</p>';
    return '<div class="admin-finance-block">' +
      '<div class="convert-title" style="font-size:.92rem;margin-top:14px">Historique Financier du Joueur</div>' +
      '<div class="list-row"><span>Total Déposé</span><strong>' + D6.fmtFCFA(totalDep) + '</strong></div>' +
      '<div class="list-row"><span>Total Retiré</span><strong>' + D6.fmtFCFA(totalWd) + '</strong></div>' +
      '<div class="list-row"><span>Bilan net</span><strong>' + D6.fmtFCFA(net) + '</strong></div>' +
      table +
      '</div>';
  }

  function openAdminUser(uid) {
    var u = (adminCache.users || []).find(function (x) { return x.id === uid; });
    var box = $('adminUserDetail');
    if (!u || !box) return;
    box.classList.remove('hidden');
    box.innerHTML = '<div class="convert-title">' + adminEsc(u.publicId || '') + ' · ' + adminEsc(u.displayName || '') + '</div>' +
      '<div class="h-time">' + adminEsc(u.email) + ' · ' + adminEsc((u.countryCode || '') + ' ' + (u.phone || '')) + ' · inscrit ' + adminEsc((u.createdAt || '').slice(0, 10)) + '</div>' +
      '<div class="list-row"><span>Réel</span><strong>' + D6.fmtFCFA(u.realBalance) + '</strong></div>' +
      '<div class="list-row"><span>Démo</span><strong>' + D6.fmtFCFA(u.demoBalance) + '</strong></div>' +
      '<div class="field"><label>' + t('adjustReason') + '</label><input id="adjMotif" maxlength="120" placeholder="bonus, correction…"></div>' +
      '<div class="field"><label>Montant libre ($)</label><input id="adjAmount" type="number" inputmode="decimal" min="0.01" step="0.01" value="100" placeholder="ex. 5, 50, 1000…"></div>' +
      '<div class="admin-adj-row">' +
      '<button class="mini ok" type="button" data-adj-act="credit" data-adj="' + u.id + '" data-mode="real">+ Créditer Réel</button>' +
      '<button class="mini bad" type="button" data-adj-act="debit" data-adj="' + u.id + '" data-mode="real">− Débiter Réel</button>' +
      '<button class="mini" type="button" data-adj="' + u.id + '" data-mode="demo" data-reset="1">Reset démo 1M</button>' +
      '</div>' +
      '<p class="hint-min">Le montant saisi crédite ou débite instantanément le solde RÉEL en base.</p>' +
      renderPlayerFinanceBlock(u);
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
    var uSettled = user();
    if (uSettled) {
      lockBalanceOptimistic(
        D6.Store.demoBalance(uSettled),
        D6.Store.realBalance ? D6.Store.realBalance(uSettled) : 0,
        12000
      );
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
    stake = Math.max(D6.CONFIG.MIN_STAKE, D6.roundMoney(Number($('inputStake').value) || stake));
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
    var res = D6.Engine.placeOrder(u, { side: side, stake: stake, duration: u.duration, assetId: assetId(u), payout: currentOdds(u) });
    if (!res.ok) {
      if (mode === 'real' && /insuffisant/i.test(String(res.reason || ''))) {
        openDeposit('Solde insuffisant pour miser. Rechargez votre compte');
      } else {
        toast(res.reason, 'err');
      }
      syncTradeButtons();
      return;
    }
    // P0 : ligne immédiate (file d’attente si chart pas prêt).
    if (D6.Chart && D6.Chart.applyOpenTradeVisual && res.trade) {
      D6.Chart.applyOpenTradeVisual(res.trade);
    }
    if (D6.Chart && D6.Chart.drawNow) D6.Chart.drawNow();
    requestAnimationFrame(function () {
      if (D6.Chart && D6.Chart.resize) D6.Chart.resize();
      if (D6.Chart && D6.Chart.applyOpenTradeVisual && res.trade) D6.Chart.applyOpenTradeVisual(res.trade);
      if (D6.Chart && D6.Chart.drawNow) D6.Chart.drawNow();
    });
    updateBalance(true);
    updatePriceHud();
    patchHistorySoon();
    armTradeCooldown();
    syncTradeButtons();
    lockBalanceOptimistic(
      mode === 'demo' ? D6.Store.demoBalance(u) : null,
      mode === 'real' ? (D6.Store.realBalance ? D6.Store.realBalance(u) : 0) : null,
      10000
    );
    if (D6.Api && D6.Api.token()) {
      D6.Api.post('placeOrder', {
        id: res.trade.id,
        stake: stake,
        side: side,
        duration: u.duration,
        mode: mode,
        assetId: res.trade.assetId,
        entryPrice: res.trade.entryPrice,
        payout: res.trade.payout || currentOdds(u)
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

  // Minimum dépôt joueur = $3.00 (Maketou reçoit XOF via taux fixe).
  function minDeposit() {
    return D6.CONFIG.MIN_DEPOSIT || 3;
  }

  function minWithdraw() {
    return D6.CONFIG.MIN_WITHDRAW || 3;
  }

  function setDepositAmt(n) {
    var min = minDeposit();
    var amt = Math.max(min, D6.roundMoney(Number(n) || min));
    if ($('depositAmt')) $('depositAmt').value = String(amt);
    return amt;
  }

  function openDeposit(preMsg) {
    if (!requireAccount()) return;
    depositOp = 'wave';
    var min = minDeposit();
    if ($('depositAmt')) {
      $('depositAmt').value = String(min);
      $('depositAmt').min = String(min);
      $('depositAmt').placeholder = String(min);
    }
    if (preMsg) toast(preMsg, 'err');
    var hint = $('depositModal') ? $('depositModal').querySelector('.hint-min') : null;
    if (hint) hint.textContent = 'Minimum $3';
    setDepositPayMethod('card');
    resetOxaWallet();
    showDepositStep('select');
    closeDrawer();
    closeModal('convertModal');
    openModal('depositModal');
    metaTrack('InitiateCheckout');
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

  async function postVerifyCrypto(payload) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    try {
      var r = await fetch('api/deposit/verify-crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: ctrl ? ctrl.signal : undefined
      });
      if (r.ok) return await r.json();
    } catch (e) {
      console.error('OROLADO crypto verify', e);
    } finally {
      clearTimeout(timer);
    }
    return D6.Api.post('verifyCryptoDeposit', payload, 20000);
  }

  function applyUsdtCredit(remote) {
    if (!remote || !remote.ok) return false;
    if (!(remote.paid || remote.success) || !(remote.amount > 0)) return false;
    var u = user();
    var vault = remote.vault;
    if (!vault && remote.new_balance > 0) vault = { real: remote.new_balance };
    if (vault && u) D6.Store.importRemote(u, vault);
    u = user();
    if (u && vault) {
      u.realDepositTotal = (Number(u.realDepositTotal) || 0) + Number(remote.amount || 0);
      var mult = (D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2;
      u.requiredWagering = Math.floor((Number(u.realDepositTotal) || 0) * mult);
      if (u.totalWageredSinceDeposit == null) u.totalWageredSinceDeposit = Number(u.realStakeVolume) || 0;
      D6.Store.saveUser(u);
    }
    D6.holdDepositReal = true;
    setTimeout(function () { D6.holdDepositReal = false; }, 25000);
    if (u) {
      lockBalanceOptimistic(
        D6.Store.demoBalance(u),
        D6.Store.realBalance ? D6.Store.realBalance(u) : 0,
        20000
      );
    }
    if (D6.Supabase && D6.Supabase.queueSync) D6.Supabase.queueSync();
    if (D6.Supabase && D6.Supabase.pullVault) {
      setTimeout(function () { D6.Supabase.pullVault(); }, 1800);
    }
    updateBalance(true);
    if (typeof playWinChime === 'function') playWinChime();
    return true;
  }

  function cryptoVerifyMsg(remote) {
    var code = remote && remote.code;
    if (code === 'invalid') return t('cryptoErrInvalid');
    if (code === 'reused') return t('cryptoErrReused');
    if (code === 'min') return t('depositMinErr');
    if (code === 'txid') return t('cryptoErrTx');
    if (code === 'session') return t('sessionInvalid');
    return t('cryptoErrPending');
  }

  function fmtCryptoAmt(n) {
    return (Number(n) || 0).toFixed(2) + ' $';
  }

  function setCryptoOkCopy(amount) {
    lastUsdtCredit = Number(amount) || 0;
    if ($('cryptoOkTitle')) $('cryptoOkTitle').textContent = t('cryptoOkTitle');
    if ($('cryptoOkCopy')) {
      $('cryptoOkCopy').textContent = lastUsdtCredit > 0
        ? t('cryptoOkCopy').replace('{amt}', fmtCryptoAmt(lastUsdtCredit))
        : t('cryptoOkCopy').replace('{amt}', '');
    }
  }

  function refreshCryptoI18n() {
    var main = $('btnConfirmDeposit');
    if (main) {
      main.textContent = depositPayMethod === 'usdt' ? t('depositProceed') : t('depositConfirm');
    }
    syncOxaLabels();
    var note = $('usdtPendingNote');
    if (note && !note.classList.contains('is-err') && !note.hidden) {
      note.textContent = t('cryptoWait');
    }
    if (lastUsdtCredit > 0) setCryptoOkCopy(lastUsdtCredit);
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
    u = user();
    if (u) {
      u.realDepositTotal = (Number(u.realDepositTotal) || 0) + Number(remote.amount || 0);
      var mult = (D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2;
      u.requiredWagering = Math.floor((Number(u.realDepositTotal) || 0) * mult);
      if (u.totalWageredSinceDeposit == null) u.totalWageredSinceDeposit = Number(u.realStakeVolume) || 0;
      D6.Store.saveUser(u);
    }
    D6.holdDepositReal = true;
    setTimeout(function () { D6.holdDepositReal = false; }, 25000);
    if (u) {
      lockBalanceOptimistic(
        D6.Store.demoBalance(u),
        D6.Store.realBalance ? D6.Store.realBalance(u) : 0,
        20000
      );
    }
    if (D6.Supabase && D6.Supabase.queueSync) D6.Supabase.queueSync();
    if (D6.Supabase && D6.Supabase.pullVault) {
      setTimeout(function () { D6.Supabase.pullVault(); }, 1800);
    }
    updateBalance(true);
    toast(t('depositCredited').replace('{amt}', D6.fmtFCFA(remote.amount)), 'ok');
    metaTrack('Purchase', { value: Number(remote.amount) || 0, currency: 'USD' });
    playWinChime();
    if ($('depositSuccessAmt')) $('depositSuccessAmt').textContent = D6.fmtMoney(remote.amount);
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

  function splitCustomerName(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    var first = parts[0] || 'Trader';
    var last = parts.slice(1).join(' ') || 'Orolado';
    if (last.length < 2) last = 'Orolado';
    return { first: first, last: last };
  }

  function localMaketouCheckoutUrl(fcfaAmt, op, ref, profile) {
    var base = (D6.CONFIG && D6.CONFIG.MAKETOU_CHECKOUT) || 'https://welcome-6.mymaketou.shop/products/welcome/checkout';
    var u = user() || {};
    profile = profile || {};
    var named = splitCustomerName(profile.displayName || profile.name || u.displayName || 'Trader');
    var first = String(profile.firstName || named.first).trim() || 'Trader';
    var last = String(profile.lastName || named.last).trim() || 'Orolado';
    var email = String(profile.email || u.email || '').trim().toLowerCase();
    if (!email || email.indexOf('.local') >= 0) {
      email = 'trader_' + Math.random().toString(16).slice(2, 10) + '@orolado-pay.com';
    }
    var cc = String(profile.countryCode || u.countryCode || '+225').replace(/\D/g, '') || '225';
    var phone = String(profile.phone || u.phone || '').replace(/\D/g, '');
    if (phone.indexOf(cc) === 0) phone = phone.slice(cc.length);
    if (phone.length < 8) phone = '07' + String(Math.floor(10000000 + Math.random() * 89999999));
    var origin = (location && location.origin) || 'https://orolado.com';
    var dash = origin + '/?deposit=success' + (ref ? ('&ref=' + encodeURIComponent(ref)) : '');
    var fcfa = Math.max(1, Math.round(Number(fcfaAmt) || 0));
    var fullName = (first + ' ' + last).trim();
    var q = new URLSearchParams();
    q.set('customPrice', String(fcfa));
    q.set('customerPrice', String(fcfa));
    q.set('price', String(fcfa));
    q.set('amount', String(fcfa));
    q.set('total', String(fcfa));
    q.set('totalPrice', String(fcfa));
    q.set('firstName', first);
    q.set('lastName', last);
    q.set('firstname', first);
    q.set('lastname', last);
    q.set('name', fullName);
    q.set('fullName', fullName);
    q.set('email', email);
    q.set('phone', phone);
    q.set('phoneNumber', phone);
    q.set('tel', phone);
    q.set('country', 'CI');
    q.set('countryCode', 'CI');
    q.set('currency', 'XOF');
    q.set('operator', op || 'wave');
    q.set('payment_method', op || 'wave');
    q.set('step', 'payment');
    q.set('success_url', dash);
    q.set('return_url', dash);
    q.set('redirect_url', dash);
    q.set('cancel_url', origin + '/?payment=cancel' + (ref ? '&ref=' + encodeURIComponent(ref) : ''));
    if (ref) q.set('ref', ref);
    return base + '?' + q.toString();
  }

  /**
   * Ouvre uniquement l’URL API (Moneroo / redirectUrl).
   * Jamais /products/welcome. Pas d’URL inventée.
   */
  function resolveDepositCheckoutUrl(serverUrl) {
    var url = String(serverUrl || '');
    var low = url.toLowerCase();
    if (!url || !/^https?:\/\//i.test(url)) return '';
    if (low.indexOf('/products/welcome') >= 0) return '';
    return url;
  }

  var USDT_ADDR = (D6.CONFIG && D6.CONFIG.USDT_TRC20_ADDRESS) || 'TD32ZDYDvhej6MGk7ZsYC5jLKDdCoJquP1';
  var usdtAmt = 0;
  var lastUsdtCredit = 0;
  var depositPayMethod = 'card';
  var oxaAsset = 'usdt';
  var oxaNet = 'TRC20';
  var oxaCoin = 'usdt_trc20';
  var oxaInvoice = null;
  var oxaPoll = 0;
  var oxaTimer = 0;
  var liveDepositAddr = '';
  var OXA_ASSETS = [
    { id: 'usdt', symbol: 'USDT', name: 'Tether', color: '#26A17B', mark: '₮', minUsd: 3, nets: ['TRC20', 'ERC20', 'BEP20'] },
    { id: 'usdc', symbol: 'USDC', name: 'USD Coin', color: '#2775CA', mark: '$', minUsd: 3, networkName: 'Ethereum Network' },
    { id: 'btc', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', mark: '₿', minUsd: 15, networkName: 'Bitcoin Network' },
    { id: 'eth', symbol: 'ETH', name: 'Ethereum', color: '#627EEA', mark: 'Ξ', minUsd: 15, networkName: 'Ethereum Network' },
    { id: 'trx', symbol: 'TRX', name: 'TRON', color: '#FF0013', mark: 'T', minUsd: 3, networkName: 'Tron Network' },
    { id: 'bnb', symbol: 'BNB', name: 'BNB', color: '#F3BA2F', mark: 'B', minUsd: 10, networkName: 'BNB Smart Chain' },
    { id: 'sol', symbol: 'SOL', name: 'Solana', color: '#14F195', mark: 'S', minUsd: 10, networkName: 'Solana Network' },
    { id: 'ltc', symbol: 'LTC', name: 'Litecoin', color: '#345D9D', mark: 'Ł', minUsd: 10, networkName: 'Litecoin Network' },
    { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633', mark: 'Ð', minUsd: 3, networkName: 'Dogecoin Network' },
    { id: 'xrp', symbol: 'XRP', name: 'XRP', color: '#346AA9', mark: 'X', minUsd: 10, networkName: 'XRP Ledger' }
  ];

  function oxaMeta(id) {
    var i;
    for (i = 0; i < OXA_ASSETS.length; i++) if (OXA_ASSETS[i].id === id) return OXA_ASSETS[i];
    return OXA_ASSETS[0];
  }

  function oxaCoinKey() {
    if (oxaAsset === 'usdt') return 'usdt_' + String(oxaNet || 'TRC20').toLowerCase();
    return oxaAsset;
  }

  function oxaMinUsd() {
    return Number(oxaMeta(oxaAsset).minUsd) || 3;
  }

  function oxaNetworkName() {
    var m = oxaMeta(oxaAsset);
    if (oxaAsset === 'usdt') {
      if (oxaNet === 'ERC20') return 'Ethereum (ERC20)';
      if (oxaNet === 'BEP20') return 'BNB Smart Chain (BEP20)';
      return 'Tron (TRC20)';
    }
    return m.networkName || m.symbol;
  }

  function enforceOxaMin() {
    var need = Math.max(minDeposit(), oxaMinUsd());
    var amt = D6.roundMoney(Number($('depositAmt') && $('depositAmt').value) || 0);
    if (amt + 0.0001 < need) {
      if ($('depositAmt')) $('depositAmt').value = String(need);
      amt = need;
    }
    usdtAmt = amt;
    if ($('oxaUsdAmt')) $('oxaUsdAmt').textContent = '$' + amt.toFixed(2);
    return amt;
  }

  function styleOxaAddr(addr) {
    var a = String(addr || '');
    if (!a || a === '—' || a === '…') return a;
    if (a.length < 14) return '<span class="addr-hi">' + a + '</span>';
    return '<span class="addr-hi">' + a.slice(0, 6) + '</span><span class="addr-mid">' + a.slice(6, -6) +
      '</span><span class="addr-hi">' + a.slice(-6) + '</span>';
  }

  function closeOxaMenus() {
    if ($('oxaCoinMenu')) $('oxaCoinMenu').classList.add('hidden');
    if ($('oxaCoinBtn')) $('oxaCoinBtn').setAttribute('aria-expanded', 'false');
  }

  function paintOxaCoinBtn() {
    var m = oxaMeta(oxaAsset);
    if ($('oxaCoinIco')) {
      $('oxaCoinIco').textContent = m.mark;
      $('oxaCoinIco').style.background = m.color;
    }
    if ($('oxaCoinName')) $('oxaCoinName').textContent = m.name;
    if ($('oxaCoinSym')) $('oxaCoinSym').textContent = m.symbol;
  }

  function fillOxaCoinList(q) {
    var list = $('oxaCoinList');
    if (!list) return;
    q = String(q || '').toLowerCase().trim();
    list.innerHTML = OXA_ASSETS.filter(function (c) {
      if (!q) return true;
      return (c.symbol + ' ' + c.name + ' ' + c.id).toLowerCase().indexOf(q) >= 0;
    }).map(function (c) {
      return '<button type="button" class="oxa-dd-opt' + (c.id === oxaAsset ? ' on' : '') + '" data-asset="' + c.id + '">' +
        '<span class="oxa-ico" style="background:' + c.color + '">' + c.mark + '</span>' +
        '<span class="oxa-dd-meta"><strong>' + c.name + '</strong><small>' + c.symbol + '</small></span></button>';
    }).join('') || '<div class="empty-feed">—</div>';
  }

  function syncOxaNetUi() {
    var wrap = $('oxaNetWrap');
    var m = oxaMeta(oxaAsset);
    if (wrap) wrap.classList.toggle('hidden', !(m.nets && m.nets.length));
    document.querySelectorAll('#oxaNets .oxa-net').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-net') === oxaNet);
    });
  }

  function syncOxaLabels() {
    var m = oxaMeta(oxaAsset);
    var coin = m.symbol;
    var net = oxaNetworkName();
    if ($('oxaMinHint')) {
      $('oxaMinHint').textContent = t('oxaMinAmt').replace('{amt}', String(oxaMinUsd())).replace('{net}', net).replace('{coin}', coin);
    }
    if ($('oxaWarnTxt')) {
      $('oxaWarnTxt').textContent = t('oxaWarnOnly').replace('{coin}', coin);
    }
    if ($('oxaNetLabel')) {
      $('oxaNetLabel').textContent = net + ' · ' + t('cryptoWait');
    }
    if ($('oxaUsdAmt')) {
      var shown = D6.roundMoney(Number($('depositAmt') && $('depositAmt').value) || usdtAmt || oxaMinUsd());
      $('oxaUsdAmt').textContent = '$' + shown.toFixed(2);
    }
  }

  function resetOxaWallet() {
    stopOxaPoll();
    if (oxaTimer) { clearTimeout(oxaTimer); oxaTimer = 0; }
    oxaInvoice = null;
    liveDepositAddr = '';
    if ($('oxaWalletBox')) $('oxaWalletBox').classList.add('hidden');
    if ($('usdtAddr')) $('usdtAddr').textContent = '—';
    if ($('usdtBusy')) $('usdtBusy').hidden = true;
    closeOxaMenus();
  }

  function showDepositStep(step) {
    var select = $('depositStepSelect');
    var crypto = $('depositStepCrypto');
    var ok = $('depositStepCryptoOk');
    var box = $('depositBox');
    if (select) select.classList.toggle('hidden', step !== 'select');
    if (crypto) crypto.classList.toggle('hidden', step !== 'crypto');
    if (ok) ok.classList.toggle('hidden', step !== 'ok');
    if (box) box.classList.toggle('is-crypto', step === 'crypto' || step === 'ok');
  }

  function setDepositPayMethod(method) {
    var card = $('payMethodCard');
    var usdt = $('payMethodUsdt');
    if (method === 'usdt') {
      depositPayMethod = 'usdt';
      if (card) { card.classList.remove('on'); card.setAttribute('aria-checked', 'false'); }
      if (usdt) { usdt.classList.add('on'); usdt.setAttribute('aria-checked', 'true'); }
      paintOxaCoinBtn();
      syncOxaNetUi();
      enforceOxaMin();
      syncOxaLabels();
      showDepositStep('crypto');
      scheduleOxaInvoice();
      return;
    }
    depositPayMethod = 'card';
    if (card) { card.classList.add('on'); card.setAttribute('aria-checked', 'true'); }
    if (usdt) { usdt.classList.remove('on'); usdt.setAttribute('aria-checked', 'false'); }
    var main = $('btnConfirmDeposit');
    if (main) {
      main.hidden = false;
      main.textContent = t('depositConfirm');
    }
    resetOxaWallet();
    showDepositStep('select');
  }

  function stopOxaPoll() {
    if (oxaPoll) {
      clearInterval(oxaPoll);
      oxaPoll = 0;
    }
  }

  function paintOxaInvoice(inv) {
    oxaInvoice = inv;
    liveDepositAddr = String((inv && inv.address) || '');
    var payCur = (inv && inv.payCurrency) || oxaMeta(oxaAsset).symbol;
    var payAmt = Number((inv && inv.payAmount) || usdtAmt) || usdtAmt;
    if ($('usdtPayAmt')) {
      $('usdtPayAmt').textContent = t('cryptoPayAmt').replace('{amt}', payAmt + ' ' + payCur);
    }
    if ($('usdtAddr')) $('usdtAddr').innerHTML = styleOxaAddr(liveDepositAddr || '—');
    if ($('oxaWalletBox')) $('oxaWalletBox').classList.remove('hidden');
    if ($('oxaNetLabel')) {
      $('oxaNetLabel').textContent = ((inv && inv.network) || oxaNet || payCur) + ' · ' + t('cryptoWait');
    }
    if ($('oxaAddrLabel')) {
      var memo = String((inv && inv.memo) || '');
      $('oxaAddrLabel').textContent = t('oxaWalletTitle') + (memo ? ' · MEMO ' + memo : '');
    }
    syncOxaLabels();
    var qr = $('usdtQr');
    var wrap = $('oxaQrWrap');
    if (wrap) wrap.classList.remove('hidden');
    var src = (inv && inv.qr) || (liveDepositAddr
      ? ('https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(liveDepositAddr))
      : '');
    if (qr && src) {
      qr.src = src;
      qr.alt = liveDepositAddr;
    }
    var note = $('usdtPendingNote');
    if (note) {
      note.hidden = true;
      note.classList.remove('is-err');
    }
  }

  async function postOxaInvoice(payload) {
    try {
      var r = await fetch('api/oxapay/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });
      if (r.ok) return await r.json();
    } catch (e) { /* fallback */ }
    return D6.Api.post('oxapayInvoice', payload, 20000);
  }

  async function postOxaStatus(payload) {
    try {
      var r = await fetch('api/oxapay/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });
      if (r.ok) return await r.json();
    } catch (e) { /* fallback */ }
    return D6.Api.post('oxapayStatus', payload, 12000);
  }

  function startOxaPoll() {
    stopOxaPoll();
    if (!oxaInvoice) return;
    oxaPoll = setInterval(async function () {
      if (!oxaInvoice) { stopOxaPoll(); return; }
      try {
        var tok = (D6.Api && D6.Api.token && D6.Api.token()) || '';
        var remote = await postOxaStatus({
          token: tok,
          orderId: oxaInvoice.orderId,
          trackId: oxaInvoice.trackId
        });
        if (remote && remote.ok && (remote.paid || remote.success) && remote.amount > 0) {
          stopOxaPoll();
          applyUsdtCredit(remote);
          setCryptoOkCopy(remote.amount);
          showDepositStep('ok');
          toast(t('cryptoOkTitle') + ' ' + t('cryptoOkCopy').replace('{amt}', fmtCryptoAmt(remote.amount)), 'ok', 4200);
        }
      } catch (e) { /* keep waiting */ }
    }, 6000);
  }

  function scheduleOxaInvoice() {
    if (oxaTimer) clearTimeout(oxaTimer);
    oxaTimer = setTimeout(function () { showCryptoInvoice(); }, 280);
  }

  async function showCryptoInvoice() {
    if (depositPayMethod !== 'usdt') return;
    var amt = enforceOxaMin();
    var need = oxaMinUsd();
    if (amt + 0.0001 < need) {
      showFieldError('depositAmt', t('depositMinErr'));
      toast(t('oxaMinAmt').replace('{amt}', String(need)).replace('{net}', oxaNetworkName()).replace('{coin}', oxaMeta(oxaAsset).symbol), 'err');
      return;
    }
    lastUsdtCredit = 0;
    liveDepositAddr = '';
    oxaInvoice = null;
    oxaCoin = oxaCoinKey();
    stopOxaPoll();
    if ($('oxaWalletBox')) $('oxaWalletBox').classList.remove('hidden');
    if ($('usdtAddr') && !liveDepositAddr && (!$('usdtAddr').textContent || $('usdtAddr').textContent === '…')) {
      $('usdtAddr').textContent = '';
    }
    if ($('oxaQrWrap')) $('oxaQrWrap').classList.remove('hidden');
    var note = $('usdtPendingNote');
    if (note) {
      note.hidden = true;
      note.classList.remove('is-err');
    }
    if ($('usdtBusy')) $('usdtBusy').hidden = false;
    showDepositStep('crypto');
    try {
      var tok = await ensureApiToken();
      var remote = await postOxaInvoice({
        token: tok || (D6.Api && D6.Api.token ? D6.Api.token() : ''),
        amount: amt,
        coin: oxaCoin
      });
      if (!remote || !remote.ok || !remote.address) {
        if (note) {
          note.hidden = false;
          note.classList.add('is-err');
          note.textContent = (remote && remote.reason) || t('sessionInvalid');
        }
        toast((remote && remote.reason) || t('sessionInvalid'), 'err', 5200);
        return;
      }
      paintOxaInvoice(remote);
      startOxaPoll();
    } catch (err) {
      if (note) {
        note.hidden = false;
        note.classList.add('is-err');
        note.textContent = t('cryptoErrPending');
      }
      toast(t('cryptoErrPending'), 'err');
    } finally {
      if ($('usdtBusy')) $('usdtBusy').hidden = true;
    }
  }

  function copyUsdtAddr() {
    var addr = liveDepositAddr || USDT_ADDR;
    function ok() {
      toast(t('cryptoCopied'), 'ok');
      var btn = $('btnUsdtCopy');
      if (!btn) return;
      btn.classList.add('is-copied');
      setTimeout(function () { btn.classList.remove('is-copied'); }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(ok).catch(function () {
        try {
          var ta = document.createElement('textarea');
          ta.value = addr;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          ok();
        } catch (e) { toast(addr, ''); }
      });
      return;
    }
    toast(addr, '');
  }

  function onConfirmDepositClick() {
    if (depositPayMethod === 'usdt') {
      showCryptoInvoice();
      return;
    }
    confirmDeposit();
  }

  async function confirmDeposit() {
    if (depositing) return;
    var u = user();
    if (!u) {
      toast(t('sessionInvalid'), 'err');
      return;
    }
    var min = minDeposit();
    var amt = D6.roundMoney(Number($('depositAmt') && $('depositAmt').value) || 0);
    if (amt < min) {
      showFieldError('depositAmt', t('depositMinErr'));
      toast(t('depositMinErr'), 'err');
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
      if (remote && remote.ok === false) {
        console.error('OROLADO deposit fail', remote);
        var failMsg = String((remote && remote.reason) || '');
        if (!failMsg && remote && remote.raw) failMsg = String(remote.raw);
        if (remote && remote.payload) console.error('payload', remote.payload);
        toast(failMsg || t('sessionInvalid'), 'err');
        return;
      }
      var ref = (remote && remote.ref) || '';
      var url = resolveDepositCheckoutUrl((remote && (remote.checkout_url || remote.url)) || '');
      if (!url) {
        console.error('OROLADO deposit: pas de redirectUrl', remote);
        var noUrl = (remote && (remote.reason || remote.raw)) || 'Pas de redirectUrl Moneroo';
        toast(String(noUrl), 'err');
        return;
      }
      try { sessionStorage.setItem('oro_dep_ref', ref); } catch (e) { /* ignore */ }
      try { localStorage.setItem('oro_dep_ref', ref); } catch (e2) { /* ignore */ }
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
        btn.textContent = 'CONFIRM DEPOSIT';
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
        var localDemo = D6.Store.demoBalance(u);
        var phpReal = Number(remote.vault.real || 0);
        var phpDemo = Number(remote.vault.demo || 0);
        if (Date.now() < balanceLockUntil) {
          if (balanceLockReal != null) localReal = Math.max(localReal, balanceLockReal);
          if (balanceLockDemo != null) localDemo = Math.max(localDemo, balanceLockDemo);
        }
        var merged = {
          demo: Date.now() < balanceLockUntil && balanceLockDemo != null
            ? balanceLockDemo
            : Math.max(localDemo, phpDemo),
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
    if ($('wdBalanceAmt')) $('wdBalanceAmt').textContent = D6.fmtFCFA(real);
    else if ($('wdBalanceLabel')) $('wdBalanceLabel').textContent = 'Solde retirable\n' + D6.fmtFCFA(real);
    var gate = wagerStatus(u);
    var box = $('wdWagerBox');
    var fill = $('wdWagerFill');
    var txt = $('wdWagerText');
    var btn = $('btnSendWithdraw');
    if (box) {
      if (gate.ok || gate.required <= 0) {
        box.classList.add('hidden');
        if (btn) btn.disabled = false;
      } else {
        box.classList.remove('hidden');
        if (fill) fill.style.width = String(gate.pct) + '%';
        if (txt) txt.textContent = gate.msg;
        if (btn) btn.disabled = true;
      }
    }
  }

  function syncWithdrawDestUi() {
    var method = ($('wdMethod') && $('wdMethod').value) || 'wave';
    var label = $('wdDestLabel');
    var input = $('wdDestination');
    if (!label || !input) return;
    if (method === 'usdt' || method === 'btc') {
      label.textContent = t('wdWallet');
      input.placeholder = method === 'btc' ? 'bc1… / 1… / 3…' : 'Adresse USDT TRC-20 (T…)';
      input.type = 'text';
    } else if (method === 'paypal') {
      label.textContent = t('wdPaypal');
      input.placeholder = 'vous@email.com';
      input.type = 'email';
    } else {
      label.textContent = t('wdAccount');
      input.placeholder = '07XXXXXXXX';
      input.type = 'text';
    }
  }

  function openWithdraw() {
    if (!requireAccount()) return;
    selectedOp = 'usdt';
    if ($('wdMethod')) $('wdMethod').value = 'usdt';
    if ($('withdrawAmt')) {
      $('withdrawAmt').value = '';
      $('withdrawAmt').min = String(minWithdraw());
      $('withdrawAmt').placeholder = String(minWithdraw());
    }
    if ($('wdDestination')) $('wdDestination').value = '';
    syncWithdrawDestUi();
    refreshWithdrawUi();
    openFromProfile('withdrawModal');
  }

  function digitsPhone(raw) {
    return String(raw || '').replace(/\D/g, '');
  }

  var PROFILE_SUBVIEWS = {
    financeModal: 1,
    withdrawModal: 1,
    passModal: 1,
    historySheet: 1
  };
  var returnToProfile = false;

  function openFromProfile(id) {
    returnToProfile = true;
    openModal(id);
  }

  function openModal(id) { if ($(id)) $(id).classList.add('active'); }
  function closeModal(id) {
    if ($(id)) $(id).classList.remove('active');
    if (returnToProfile && PROFILE_SUBVIEWS[id]) {
      if ($('drawerProfile') && !$('drawerProfile').classList.contains('on')) {
        setTimeout(function () { openDrawer(); }, 80);
      }
    }
  }

  function fmtWhen(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function normFinanceStatus(raw, label) {
    var s = String(raw || '').toUpperCase();
    if (s === 'PAID' || s === 'APPROVED' || s === 'SUCCESS' || s === 'COMPLETED' || s === 'OK' || s === 'VALIDÉ' || s === 'VALIDE') {
      return { code: 'COMPLETED', label: 'Validé', cls: 'ok' };
    }
    if (s === 'REJECT' || s === 'REJECTED' || s === 'DENIED' || s === 'FAILED' || s === 'CANCELED' || s === 'CANCELLED') {
      return { code: 'REJECTED', label: 'Rejeté', cls: 'bad' };
    }
    if (label === 'Retrait' && (s === 'WITHDRAW' || s === '')) {
      return { code: 'PENDING', label: 'En cours', cls: 'pending' };
    }
    return { code: s || 'PENDING', label: 'En cours', cls: 'pending' };
  }

  function gatewayLabel(raw) {
    var k = String(raw || '').toLowerCase();
    if (!k) return '—';
    if (k.indexOf('wave') >= 0) return 'Wave';
    if (k.indexOf('orange') >= 0 || k === 'om') return 'Orange Money';
    if (k.indexOf('mtn') >= 0 || k.indexOf('momo') >= 0) return 'MTN MoMo';
    if (k.indexOf('moov') >= 0) return 'Moov Money';
    if (k.indexOf('paypal') >= 0) return 'PayPal';
    if (k.indexOf('crypto') >= 0 || k.indexOf('btc') >= 0 || k.indexOf('oxapay') >= 0 || k.indexOf('usdt') >= 0) return 'Crypto';
    if (k.indexOf('card') >= 0 || k.indexOf('visa') >= 0) return 'Carte';
    return String(raw);
  }

  var financeCache = { at: 0, html: '', userId: '' };

  function renderFinanceRows(tx, rows) {
    var seen = {};
    rows = rows.filter(function (r) {
      var k = (r.ref || '') + '|' + r.amount + '|' + (r.at || '') + '|' + r.label;
      if (seen[k]) return false;
      seen[k] = 1;
      return true;
    });
    rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    rows = rows.slice(0, 20);
    var html = rows.length ? rows.map(function (r) {
      var st = r.status || { label: 'En cours', cls: 'pending' };
      return '<div class="tx-feed-row"><div><div class="tx-type">' + r.label + '</div><div class="tx-meta">' +
        fmtWhen(r.at) + ' · ' + (r.gateway || '—') + ' · ' + (r.ref || '—') +
        '</div></div><div><div class="tx-amt ' + (r.amount >= 0 ? 'w' : 'l') + '">' +
        (r.amount >= 0 ? '+' : '') + D6.fmtFCFA(r.amount) + '</div><span class="tx-st ' + st.cls + '">' +
        st.label + '</span></div></div>';
    }).join('') : '<div class="empty-feed">Aucune opération pour l’instant</div>';
    tx.innerHTML = html;
    return html;
  }

  function collectLocalFinanceRows() {
    var rows = [];
    var u = user();
    if (u && u.transactions) {
      (u.transactions || []).forEach(function (x) {
        if (x.type !== 'deposit' && x.type !== 'withdraw') return;
        rows.push({
          at: x.at || '',
          ref: x.id || '—',
          amount: Number(x.amount) || 0,
          status: normFinanceStatus(x.type === 'deposit' ? 'COMPLETED' : (x.note || 'PENDING'), x.type === 'deposit' ? 'Dépôt' : 'Retrait'),
          label: x.type === 'deposit' ? 'Dépôt' : 'Retrait',
          gateway: gatewayLabel(x.operator || x.note || '')
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
        label: 'Retrait',
        gateway: gatewayLabel(w.operator || '')
      });
    });
    return rows;
  }

  async function fillFinanceHistory() {
    var tx = $('txFeed');
    if (!tx) return;
    var u = user();
    var uid = u ? u.id : '';
    if (financeCache.html && financeCache.userId === uid && (Date.now() - financeCache.at) < 60000) {
      tx.innerHTML = financeCache.html;
      return;
    }
    var rows = collectLocalFinanceRows();
    financeCache.html = renderFinanceRows(tx, rows);
    financeCache.at = Date.now();
    financeCache.userId = uid;

    if (D6.Supabase && D6.Supabase.listFinance) {
      try {
        var cloud = await D6.Supabase.listFinance();
        (cloud.deposits || []).forEach(function (d) {
          rows.push({
            at: d.created_at || d.completed_at || '',
            ref: d.reference || d.id || '—',
            amount: Number(d.amount) || 0,
            status: normFinanceStatus(d.status, 'Dépôt'),
            label: 'Dépôt',
            gateway: gatewayLabel(d.operator || '')
          });
        });
        (cloud.withdrawals || []).forEach(function (w) {
          rows.push({
            at: w.created_at || w.at || '',
            ref: w.id || w.reference || '—',
            amount: -Math.abs(Number(w.amount) || 0),
            status: normFinanceStatus(w.status, 'Retrait'),
            label: 'Retrait',
            gateway: gatewayLabel(w.operator || '')
          });
        });
        (cloud.txs || []).forEach(function (trow) {
          var typ = String(trow.type || '');
          if (typ !== 'deposit' && typ !== 'withdraw') return;
          rows.push({
            at: trow.created_at || '',
            ref: trow.id || '—',
            amount: Number(trow.amount) || 0,
            status: normFinanceStatus(typ === 'deposit' ? 'COMPLETED' : (trow.note || 'PENDING'), typ === 'deposit' ? 'Dépôt' : 'Retrait'),
            label: typ === 'deposit' ? 'Dépôt' : 'Retrait',
            gateway: gatewayLabel(trow.note || '')
          });
        });
        financeCache.html = renderFinanceRows(tx, rows);
        financeCache.at = Date.now();
      } catch (e) { /* ignore */ }
    }
    // API PHP en arrière-plan (ne bloque plus l’ouverture).
    if (D6.Api && D6.Api.post) {
      D6.Api.post('financeHistory', {}).then(function (remote) {
        if (!(remote && remote.ok && remote.rows && remote.rows.length)) return;
        (remote.rows || []).forEach(function (r) {
          rows.push({
            at: r.at || '',
            ref: r.ref || '—',
            amount: Number(r.amount) || 0,
            status: normFinanceStatus(r.status, r.label),
            label: r.label === 'Recharge' ? 'Dépôt' : (r.label || '—'),
            gateway: gatewayLabel(r.operator || r.gateway || '')
          });
        });
        if ($('txFeed') === tx) {
          financeCache.html = renderFinanceRows(tx, rows);
          financeCache.at = Date.now();
        }
      }).catch(function () { /* ignore */ });
    }
  }

  function bindAuth() {
    var eyeSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
    var eyeOffSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.1 3.9"/><path d="M6.1 6.1A17.5 17.5 0 0 0 2 12s3.5 7 10 7a10.3 10.3 0 0 0 4.2-.9"/></svg>';
    document.querySelectorAll('.pass-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-pass');
        var input = id && $(id);
        if (!input) return;
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = show ? eyeOffSvg : eyeSvg;
        btn.setAttribute('aria-label', show ? t('hidePass') : t('showPass'));
      });
    });
    bindCopyPublicId();
    bindWalletCard();
    document.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.auth-tab').forEach(function (tEl) { tEl.classList.remove('on'); });
        tab.classList.add('on');
        $('formLogin').classList.toggle('hidden', tab.dataset.tab !== 'login');
        $('formRegister').classList.toggle('hidden', tab.dataset.tab !== 'register');
        clearErrors();
        if (tab.dataset.tab === 'register') metaTrack('Lead');
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
      var submitBtn = $('formRegister').querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      var res;
      try {
        res = await D6.Auth.register({
          displayName: $('regName').value, email: $('regEmail').value,
          phone: '',
          countryCode: '+225',
          password: $('regPass').value, passwordConfirm: $('regPass2').value,
          acceptTerms: $('regAge').checked
        });
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
      if (!res.ok) { showFieldError(res.field || 'regName', res.reason); return; }
      if (res.pendingOtp) {
        openOtpModal(res);
        return;
      }
      metaTrack('CompleteRegistration');
      toast(t('accountCreated'), 'ok');
      enterApp({});
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
    bindOtpModal();
  }

  var otpPending = null;
  var otpResendTimer = null;
  var otpResendLeft = 0;

  function setOtpError(msg) {
    var el = $('err-otpCode');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('on', !!msg);
  }

  function updateOtpResendUi() {
    var btn = $('btnOtpResend');
    var timer = $('otpTimer');
    if (!btn || !timer) return;
    if (otpResendLeft > 0) {
      btn.disabled = true;
      timer.textContent = 'Renvoyer dans ' + otpResendLeft + ' s';
    } else {
      btn.disabled = false;
      timer.textContent = '';
    }
  }

  function startOtpResendCountdown(seconds) {
    otpResendLeft = Math.max(0, parseInt(seconds, 10) || 60);
    if (otpResendTimer) clearInterval(otpResendTimer);
    updateOtpResendUi();
    if (otpResendLeft <= 0) return;
    otpResendTimer = setInterval(function () {
      otpResendLeft -= 1;
      if (otpResendLeft <= 0) {
        clearInterval(otpResendTimer);
        otpResendTimer = null;
        otpResendLeft = 0;
      }
      updateOtpResendUi();
    }, 1000);
  }

  function openOtpModal(pending) {
    otpPending = pending || null;
    if (!$('otpModal') || !otpPending) return;
    if ($('otpEmailLabel')) $('otpEmailLabel').textContent = otpPending.email || '';
    if ($('otpCode')) $('otpCode').value = '';
    setOtpError('');
    openModal('otpModal');
    startOtpResendCountdown(otpPending.resendIn || 60);
    setTimeout(function () {
      if ($('otpCode')) $('otpCode').focus();
    }, 80);
  }

  function closeOtpModal() {
    closeModal('otpModal');
    if (otpResendTimer) {
      clearInterval(otpResendTimer);
      otpResendTimer = null;
    }
    otpPending = null;
    setOtpError('');
  }

  function bindOtpModal() {
    if (!$('otpModal')) return;
    if ($('closeOtp')) {
      $('closeOtp').addEventListener('click', function () { closeOtpModal(); });
    }
    if ($('otpCode')) {
      $('otpCode').addEventListener('input', function () {
        this.value = String(this.value || '').replace(/\D/g, '').slice(0, 6);
        setOtpError('');
      });
    }
    if ($('formOtp')) {
      $('formOtp').addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!otpPending || !otpPending.email) {
          setOtpError('Session expirée. Recommencez l’inscription.');
          return;
        }
        var code = $('otpCode') ? $('otpCode').value : '';
        var btn = $('btnOtpVerify');
        if (btn) btn.disabled = true;
        var res;
        try {
          res = await D6.Auth.verifyRegisterOtp(otpPending.email, code, otpPending.password);
        } finally {
          if (btn) btn.disabled = false;
        }
        if (!res.ok) {
          setOtpError(res.reason || 'Code incorrect ou expiré');
          return;
        }
        closeOtpModal();
        metaTrack('CompleteRegistration');
        toast(t('accountCreated'), 'ok');
        enterApp({});
      });
    }
    if ($('btnOtpResend')) {
      $('btnOtpResend').addEventListener('click', async function () {
        if (!otpPending || !otpPending.email || otpResendLeft > 0) return;
        var btn = $('btnOtpResend');
        btn.disabled = true;
        var res = await D6.Auth.resendRegisterOtp(otpPending.email);
        if (!res.ok) {
          setOtpError(res.reason || 'Renvoi impossible');
          startOtpResendCountdown(res.retryIn || 60);
          return;
        }
        setOtpError('');
        toast('Nouveau code envoyé', 'ok');
        startOtpResendCountdown(res.resendIn || 60);
        if ($('otpCode')) {
          $('otpCode').value = '';
          $('otpCode').focus();
        }
      });
    }
  }

  function startWithdrawTicker() {
    var box = $('wdTicker');
    var idEl = $('wdTickerId');
    var amtEl = $('wdTickerAmt');
    if (!box || !idEl || !amtEl) return;
    function pickAmount() {
      var r = Math.random();
      if (r < 0.35) return D6.roundMoney(10 + Math.random() * 90);
      if (r < 0.65) return D6.roundMoney(100 + Math.random() * 400);
      if (r < 0.88) return D6.roundMoney(500 + Math.random() * 2000);
      return D6.roundMoney(2500 + Math.random() * 10000);
    }
    function showNext() {
      var id = 'ORO-' + String(100000 + Math.floor(Math.random() * 900000));
      var amt = '+' + D6.fmtMoney(pickAmount());
      box.classList.remove('on');
      setTimeout(function () {
        idEl.textContent = id + ' :';
        amtEl.textContent = amt;
        box.classList.add('on');
      }, 320);
    }
    showNext();
    setInterval(showNext, 4500 + Math.floor(Math.random() * 1500));
  }

  function bindTrade() {
    $('modeDemo').addEventListener('click', function () { switchMode('demo'); });
    $('modeReal').addEventListener('click', function () { switchMode('real'); });
    document.querySelectorAll('.asset-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var u = user();
        if (!u) return;
        if (!guardLiveTradeView()) return;
        u.assetId = chip.dataset.asset; D6.Store.saveUser(u); updateAssetUi();
      });
    });
    document.querySelectorAll('.dur-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var u = user();
        if (!u) return;
        if (!guardLiveTradeView()) return;
        u.duration = Number(chip.dataset.dur); D6.Store.saveUser(u); updateDurationUi();
      });
    });
    document.querySelectorAll('.odds-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (!guardLiveTradeView()) return;
        setOdds(chip.dataset.odds);
      });
    });
    document.querySelectorAll('.qbtn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('stake-preset')) {
          var preset = D6.roundMoney(Number(btn.dataset.stake) || 0);
          if (preset > 0) {
            var u0 = user();
            var cap0 = D6.Store.balanceOf(u0);
            stake = Math.min(preset, cap0 > 0 ? cap0 : preset);
            var min0 = D6.CONFIG.MIN_STAKE || 1;
            if (stake < min0) stake = min0;
            $('inputStake').value = stake;
            btn.classList.add('hit');
            setTimeout(function () { btn.classList.remove('hit'); }, 160);
            updatePayoutUi();
          }
          return;
        }
        var add = Number(btn.dataset.add || 0);
        var a = btn.dataset.a;
        var u = user();
        var cap = D6.Store.balanceOf(u);
        var min = D6.CONFIG.MIN_STAKE || 1;
        stake = Math.max(0, D6.roundMoney(Number($('inputStake').value) || stake || 0));
        if (a === 'back') {
          var digits = String(Math.floor(stake || 0));
          digits = digits.length <= 1 ? '0' : digits.slice(0, -1);
          stake = D6.roundMoney(Number(digits) || 0);
        } else if (add) {
          stake = Math.max(min, stake || min) + add;
        } else if (a === 'x2') {
          stake = D6.roundMoney(Math.max(min, stake || min) * 2);
        } else if (a === 'half') {
          stake = Math.max(D6.roundMoney(Math.max(stake, min) / 2), min);
        }
        if (a !== 'back') {
          if (cap > 0 && stake > cap) stake = cap;
          if (stake < min) stake = min;
        }
        $('inputStake').value = stake;
        btn.classList.add('hit');
        setTimeout(function () { btn.classList.remove('hit'); }, 160);
        updatePayoutUi();
      });
    });
    $('inputStake').addEventListener('input', function () {
      stake = Math.max(0, D6.roundMoney(Number(this.value) || 0));
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
      returnToProfile = false;
      openDrawer();
    });
    $('btnCloseDrawer').addEventListener('click', closeDrawer);
    $('drawerBackdrop').addEventListener('click', function () {
      if (profileSubModalOpen()) return;
      closeDrawer();
    });
    function openHistorySheet(forceMode) {
      renderHistorySheet(forceMode);
      openModal('historySheet');
    }
    function bindHistDrawer(btn, mode) {
      if (!btn) return;
      var last = 0;
      function go() {
        var now = Date.now();
        if (now - last < 400) return;
        last = now;
        returnToProfile = true;
        openHistorySheet(mode);
      }
      btn.addEventListener('click', function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        go();
      });
      if (IS_ANDROID) {
        btn.addEventListener('touchend', function (e) {
          if (e && e.cancelable) e.preventDefault();
          go();
        }, { passive: false });
      }
    }
    bindHistDrawer($('btnHistDemo'), 'demo');
    bindHistDrawer($('btnHistReal'), 'real');
  }

  function bindModals() {
    bindAndroidTap($('closeHistorySheet'), function () { closeModal('historySheet'); });
    bindAndroidTap($('closeConvert'), function () { closeModal('convertModal'); });
    bindAndroidTap($('btnConvertRecharge'), function () {
      closeModal('convertModal');
      var u = user();
      if (u && !D6.Engine.getTrade()) {
        u.mode = 'real'; D6.Store.saveUser(u); setModeUi(u); updateBalance(true); updatePayoutUi();
      }
      openDeposit();
    });
    $('btnOpenPass').addEventListener('click', function () { openFromProfile('passModal'); });
    bindAndroidTap($('closePass'), function () { closeModal('passModal'); });
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
      openFromProfile('financeModal');
      fillFinanceHistory();
    }
    bindAndroidTap($('closeFinance'), function () { closeModal('financeModal'); });
    $('btnWithdraw').addEventListener('click', function () { openWithdraw(); });
    bindAndroidTap($('closeWithdraw'), function () { closeModal('withdrawModal'); });
    bindAndroidTap($('closeDeposit'), function () {
      resetOxaWallet();
      closeModal('depositModal');
    });
    if ($('payMethodCard')) $('payMethodCard').addEventListener('click', function () { setDepositPayMethod('card'); });
    if ($('payMethodUsdt')) $('payMethodUsdt').addEventListener('click', function () { setDepositPayMethod('usdt'); });
    if ($('oxaCoinBtn')) {
      bindAndroidTap($('oxaCoinBtn'), function () {
        var menu = $('oxaCoinMenu');
        var open = menu && menu.classList.contains('hidden');
        if (open) {
          fillOxaCoinList(($('oxaCoinSearch') && $('oxaCoinSearch').value) || '');
          menu.classList.remove('hidden');
          $('oxaCoinBtn').setAttribute('aria-expanded', 'true');
          if ($('oxaCoinSearch')) $('oxaCoinSearch').focus();
        } else closeOxaMenus();
      });
    }
    if ($('oxaCoinSearch')) {
      $('oxaCoinSearch').addEventListener('input', function () { fillOxaCoinList(this.value); });
    }
    if ($('oxaCoinList')) {
      $('oxaCoinList').addEventListener('click', function (e) {
        var opt = e.target && e.target.closest ? e.target.closest('[data-asset]') : null;
        if (!opt) return;
        oxaAsset = opt.getAttribute('data-asset') || 'usdt';
        var meta = oxaMeta(oxaAsset);
        oxaNet = (meta.nets && meta.nets[0]) || '';
        oxaCoin = oxaCoinKey();
        paintOxaCoinBtn();
        syncOxaNetUi();
        enforceOxaMin();
        syncOxaLabels();
        closeOxaMenus();
        scheduleOxaInvoice();
      });
    }
    document.querySelectorAll('#oxaNets .oxa-net').forEach(function (btn) {
      bindAndroidTap(btn, function () {
        oxaNet = btn.getAttribute('data-net') || 'TRC20';
        oxaCoin = oxaCoinKey();
        syncOxaNetUi();
        scheduleOxaInvoice();
      });
    });
    document.addEventListener('click', function (e) {
      if (!$('oxaPickWrap') || $('oxaPickWrap').classList.contains('hidden')) return;
      if (e.target && e.target.closest && e.target.closest('#oxaPickWrap')) return;
      closeOxaMenus();
    });
    if ($('btnUsdtCopy')) bindAndroidTap($('btnUsdtCopy'), function () { copyUsdtAddr(); });
    if ($('btnUsdtBack')) bindAndroidTap($('btnUsdtBack'), function () {
      resetOxaWallet();
      setDepositPayMethod('card');
    });
    if ($('btnUsdtOk')) $('btnUsdtOk').addEventListener('click', function (e) {
      e.preventDefault();
      stopOxaPoll();
      closeModal('depositModal');
      showDepositStep('select');
    });
    if ($('btnDepositCheck')) $('btnDepositCheck').addEventListener('click', function () { checkDepositNow(true); });
    if ($('btnDepositWaitClose')) {
      bindAndroidTap($('btnDepositWaitClose'), function () { closeModal('depositWaitModal'); });
    }
    if ($('btnHelp')) $('btnHelp').addEventListener('click', function () { openModal('helpModal'); });
    if ($('closeHelp')) bindAndroidTap($('closeHelp'), function () { closeModal('helpModal'); });
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
    if ($('closeDepositSuccess')) bindAndroidTap($('closeDepositSuccess'), function () { closeModal('depositSuccessModal'); });
    if ($('btnDepositSuccessOk')) bindAndroidTap($('btnDepositSuccessOk'), function () { closeModal('depositSuccessModal'); });
    if ($('closeTip')) bindAndroidTap($('closeTip'), function () { closeModal('tipModal'); });
    if ($('btnTipOk')) bindAndroidTap($('btnTipOk'), function () { closeModal('tipModal'); });
    if ($('closeForgot')) bindAndroidTap($('closeForgot'), function () { closeModal('forgotModal'); });
    if ($('closeIosInstall')) bindAndroidTap($('closeIosInstall'), function () { closeModal('iosInstallModal'); });
    if ($('btnIosInstallOk')) bindAndroidTap($('btnIosInstallOk'), function () { closeModal('iosInstallModal'); });

    // Android : tap sur l'overlay ferme la modale (sans toucher au contenu).
    if (IS_ANDROID) {
      document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
        function closeIfOverlay(e) {
          if (!e || e.target !== bd) return;
          if (e.cancelable) e.preventDefault();
          if (bd.id) closeModal(bd.id);
        }
        bd.addEventListener('click', closeIfOverlay);
        bd.addEventListener('touchend', closeIfOverlay, { passive: false });
        var box = bd.querySelector('.modal-box');
        if (box) {
          box.addEventListener('click', function (e) { e.stopPropagation(); });
          box.addEventListener('touchend', function (e) { e.stopPropagation(); }, { passive: true });
        }
      });
    }

    if ($('depositAmt')) {
      $('depositAmt').addEventListener('input', function () {
        this.value = String(this.value || '').replace(/[^\d.]/g, '');
        if (depositPayMethod === 'usdt') scheduleOxaInvoice();
      });
    }
    $('btnConfirmDeposit').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      onConfirmDepositClick();
    });
    if ($('wdMethod')) {
      $('wdMethod').addEventListener('change', function () {
        selectedOp = this.value || 'wave';
        syncWithdrawDestUi();
      });
    }
    $('btnSendWithdraw').addEventListener('click', async function () {
      var u = user();
      if (!u || !requireAccount()) return;
      var amount = D6.roundMoney(Number($('withdrawAmt').value) || 0);
      var method = ($('wdMethod') && $('wdMethod').value) || selectedOp || 'wave';
      selectedOp = method;
      var destination = String(($('wdDestination') && $('wdDestination').value) || '').trim();
      var name = (u.displayName || 'Client').trim();
      var real = realWithdrawBalance(u);
      var minWd = minWithdraw();
      var gate = wagerStatus(u);
      if (!gate.ok) { toast(gate.msg, 'err', 5000); return; }
      if (amount < minWd) { toast(t('withdrawMinErr'), 'err'); return; }
      if (amount > real) { toast(t('insufficient'), 'err'); return; }
      if (destination.length < 4) { toast(t('wdDestErr'), 'err'); return; }
      if (method === 'paypal' && destination.indexOf('@') < 0) {
        toast(t('wdPaypalErr'), 'err');
        return;
      }
      var payload = {
        amount: amount,
        operator: method,
        phone: destination,
        destination: destination,
        beneficiary: name,
        countryCode: u.countryCode || '+225',
        realDepositTotal: Number(u.realDepositTotal) || 0,
        realStakeVolume: Number(u.realStakeVolume) || 0,
        totalWageredSinceDeposit: Number(u.totalWageredSinceDeposit != null ? u.totalWageredSinceDeposit : u.realStakeVolume) || 0,
        requiredWagering: Number(u.requiredWagering) || Math.floor((Number(u.realDepositTotal) || 0) * ((D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2))
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
    function hideLogoutConfirm() {
      closeModal('logoutModal');
    }
    function askLogout() {
      openModal('logoutModal');
    }
    async function doLogout() {
      hideLogoutConfirm();
      closeDrawer();
      D6.Chart.stop();
      if (D6.Auth.logout) await D6.Auth.logout();
      else if (D6.Auth.signOut) await D6.Auth.signOut();
      ensureGuest();
      enterApp();
    }
    bindAndroidTap($('btnLogout'), askLogout);
    bindAndroidTap($('btnLogoutYes'), doLogout);
    bindAndroidTap($('btnLogoutNo'), hideLogoutConfirm);
    if ($('logoutModal')) {
      $('logoutModal').addEventListener('click', function (e) {
        if (e.target === $('logoutModal')) hideLogoutConfirm();
      });
    }
    document.querySelectorAll('.modal-backdrop').forEach(function (b) {
      b.addEventListener('click', function (e) { if (e.target === b) b.classList.remove('active'); });
    });
  }

  function bindAdmin() {
    async function openAdmin() {
      if (!D6.Auth.isAdmin(user())) return;
      closeDrawer();
      adminView = 'inscrits';
      var ok = await renderAdmin();
      if (ok) showScreen('screenAdmin');
    }
    $('btnAdmin2').addEventListener('click', openAdmin);
    $('btnCloseAdmin').addEventListener('click', function () {
      showScreen('screenTrade');
      requestAnimationFrame(D6.Chart.resize);
    });
    document.querySelectorAll('.metric-btn[data-admin-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        adminView = btn.getAttribute('data-admin-view') || 'inscrits';
        if (adminView === 'top') adminSortDeposit = 'desc';
        setAdminViewActive(adminView);
        renderAdminView();
      });
    });
    if ($('adminViewPanel')) {
      $('adminViewPanel').addEventListener('click', async function (e) {
        var sortTh = e.target.closest('[data-sort-dep]');
        if (sortTh && (adminView === 'actifs' || adminView === 'top')) {
          adminSortDeposit = adminSortDeposit === 'desc' ? 'asc' : 'desc';
          renderAdminView();
          return;
        }
        var row = e.target.closest('[data-user]');
        if (row) openAdminUser(row.dataset.user);
        var depBtn = e.target.closest('[data-dep]');
        if (depBtn && !depBtn.disabled) {
          depBtn.disabled = true;
          var res = D6.Api && D6.Api.token()
            ? await D6.Api.post('resolveDeposit', {
              ref: depBtn.dataset.dep,
              amount: Number(depBtn.dataset.amt || 0),
              approve: depBtn.dataset.ok === '1'
            })
            : null;
          if (res && res.ok) toast(depBtn.dataset.ok === '1' ? (t('depositOk') + ' : +' + D6.fmtFCFA(res.amount || 0)) : t('reject'), 'ok');
          else toast((res && res.reason) || t('sessionInvalid'), 'err');
          renderAdmin();
          return;
        }
        var wdBtn = e.target.closest('[data-wd]');
        if (wdBtn) {
          if (D6.Api && D6.Api.token()) await D6.Api.post('resolveWithdraw', { id: wdBtn.dataset.wd, approve: wdBtn.dataset.ok === '1' });
          D6.Store.resolveWithdraw(wdBtn.dataset.wd, wdBtn.dataset.ok === '1');
          renderAdmin();
        }
      });
    }
    if ($('adminSearch')) {
      $('adminSearch').addEventListener('input', function () { renderAdminView(); });
      $('adminSearch').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); renderAdminView(); }
      });
    }
    async function runAdminAdjust(btn) {
      if (!btn) return;
      var motif = ($('adjMotif') && $('adjMotif').value) || '';
      if (!motif.trim()) { toast(t('adjustReason'), 'err'); return; }
      var uid = btn.dataset.adj;
      var mode = btn.dataset.mode || 'real';
      var delta = 0;
      if (btn.dataset.reset === '1') {
        var u0 = (adminCache.users || []).find(function (x) { return x.id === uid; });
        delta = (D6.CONFIG.DEMO_START || 1000000) - Number((u0 && u0.demoBalance) || 0);
        mode = 'demo';
      } else {
        var rawAmt = String(($('adjAmount') && $('adjAmount').value) || '').replace(/\s/g, '').replace(',', '.');
        var amt = Math.abs(Math.round(Number(rawAmt) || 0));
        if (!amt) { toast('Montant invalide', 'err'); return; }
        mode = 'real';
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
    if ($('btnAdminMessages')) {
      $('btnAdminMessages').addEventListener('click', function () {
        if ($('adminMessages')) $('adminMessages').classList.toggle('hidden');
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
  }

  function bindInstall() {
    var installHideTimer = 0;
    function isIos() {
      return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    function isStandalone() {
      return !!(window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches);
    }
    function isMobileUi() {
      return window.matchMedia('(max-width: 859px)').matches || /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
    }
    function installDismissedForever() {
      try { return localStorage.getItem('oro_install_dismissed') === '1'; } catch (e) { return false; }
    }
    function closeCount() {
      try { return Math.max(0, parseInt(localStorage.getItem('oro_install_close_n') || '0', 10) || 0); } catch (e) { return 0; }
    }
    function bumpClose() {
      var n = closeCount() + 1;
      try {
        localStorage.setItem('oro_install_close_n', String(n));
        if (n >= 2) localStorage.setItem('oro_install_dismissed', '1');
      } catch (e) { /* ignore */ }
      return n;
    }
    function hideInstallBanner() {
      var el = $('installBanner');
      if (installHideTimer) { clearTimeout(installHideTimer); installHideTimer = 0; }
      if (!el || el.classList.contains('hidden')) return;
      el.classList.add('fade-out');
      setTimeout(function () {
        el.classList.add('hidden');
        el.classList.remove('fade-out');
      }, 450);
    }
    function showInstallBanner() {
      if (!isMobileUi() || isStandalone() || installDismissedForever() || sessionStorage.getItem('oro_hide_install')) return;
      var el = $('installBanner');
      if (!el) return;
      el.classList.remove('hidden', 'fade-out');
      if (installHideTimer) clearTimeout(installHideTimer);
      installHideTimer = setTimeout(function () {
        hideInstallBanner();
        try { sessionStorage.setItem('oro_hide_install', '1'); } catch (e) { /* ignore */ }
      }, 5000);
    }
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      showInstallBanner();
    });
    if (isIos() && !isStandalone()) showInstallBanner();
    setTimeout(function () {
      if (!deferredPrompt && !isIos() && !isStandalone()) showInstallBanner();
    }, 2500);
    if ($('btnInstall')) {
      $('btnInstall').addEventListener('click', async function () {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          try { await deferredPrompt.userChoice; } catch (e) { /* ignore */ }
          deferredPrompt = null;
          hideInstallBanner();
          return;
        }
        if (isIos()) {
          hideInstallBanner();
          openModal('iosInstallModal');
          return;
        }
        toast(t('installIos') || 'Utilise le menu du navigateur → Installer l’application', '');
      });
    }
    if ($('btnInstallClose')) {
      $('btnInstallClose').addEventListener('click', function () {
        bumpClose();
        try { sessionStorage.setItem('oro_hide_install', '1'); } catch (e) { /* ignore */ }
        hideInstallBanner();
      });
    }
    if ($('closeIosInstall')) { /* bound in bindModals */ }
    if ($('btnIosInstallOk')) { /* bound in bindModals */ }
    if ('serviceWorker' in navigator) {
      // Purge anciens SW (cache Android noir) puis enregistre v99.
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      }).then(function () {
        return navigator.serviceWorker.register('sw.js?v=103');
      }).catch(function () { /* ignore */ });
    }
  }

  function lockGestures() {
    try {
      document.addEventListener('gesturestart', function (e) {
        try { e.preventDefault(); } catch (e0) { /* ignore */ }
      });
      document.addEventListener('dblclick', function (e) {
        try { e.preventDefault(); } catch (e1) { /* ignore */ }
      });
      document.addEventListener('touchmove', function (e) {
        try {
          if (e.touches && e.touches.length > 1) e.preventDefault();
        } catch (e2) { /* ignore */ }
      }, { passive: false });
    } catch (err) {
      try { console.warn('Mobile display fallback:', err); } catch (e3) { /* ignore */ }
    }
  }

  function enterApp(opts) {
    opts = opts || {};
    try {
      var u = user();
      if (u) migrateLegacyDemo(u);
      stake = D6.CONFIG.MIN_STAKE || 1;
      if ($('inputStake')) $('inputStake').value = stake;
      setModeUi(u);
      setAdminBtns(u);
      syncAuthQuick();
      setModeChrome(u);
      updateAssetUi();
      updateDurationUi();
      if (u && D6.Engine.restoreOpen) D6.Engine.restoreOpen(u);
      if (u && D6.Engine.flushSettlements) D6.Engine.flushSettlements(u);
      if (D6.Chart && D6.Chart.applyOpenTradeVisual && D6.Engine.getTrades) {
        D6.Engine.getTrades().forEach(function (t) { D6.Chart.applyOpenTradeVisual(t); });
      }
      updateBalance(false);
      renderHistory();
      D6.I18N.apply();
      showScreen('screenTrade');
      if (D6.Chart && D6.Chart.setAsset) D6.Chart.setAsset(assetId(u));
      if (D6.Chart && D6.Chart.start) D6.Chart.start();
      requestAnimationFrame(function () {
        try {
          if (D6.Chart && D6.Chart.resize) D6.Chart.resize();
          requestAnimationFrame(function () {
            try { if (D6.Chart && D6.Chart.resize) D6.Chart.resize(); } catch (eR) { /* ignore */ }
          });
          setTimeout(function () { try { if (D6.Chart && D6.Chart.resize) D6.Chart.resize(); } catch (e1) { /* ignore */ } }, 120);
          setTimeout(function () { try { if (D6.Chart && D6.Chart.resize) D6.Chart.resize(); } catch (e2) { /* ignore */ } }, 400);
          setTimeout(function () {
            try {
              if (D6.Chart && D6.Chart.resize) D6.Chart.resize();
              if (D6.Chart && D6.Chart.flushOpenTradeVisuals) D6.Chart.flushOpenTradeVisuals();
            } catch (e3) { /* ignore */ }
          }, 600);
          // Jamais de plein écran auto au boot / inscription sur mobile (User Gesture obligatoire).
          if (opts.openFullscreen && !preferCssFullscreenOnly()) {
            setTimeout(function () {
              try {
                enterTradeFullscreen();
                bumpChartLayout();
              } catch (eFs) { try { console.warn('Mobile display fallback:', eFs); } catch (e4) { /* ignore */ } }
            }, 500);
          }
        } catch (eBootFs) {
          try { console.warn('Mobile display fallback:', eBootFs); } catch (e5) { /* ignore */ }
        }
      });
      refreshRemoteVault();
      checkDepositReturn();
      syncTradeButtons();
      startAdminPresence();
      setTimeout(function () {
        try {
          var standalone = !!(window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches);
          var mobile = window.matchMedia('(max-width: 859px)').matches || /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
          var forever = false;
          try { forever = localStorage.getItem('oro_install_dismissed') === '1'; } catch (e0) { forever = false; }
          if (mobile && !standalone && !forever && !sessionStorage.getItem('oro_hide_install') && $('installBanner')) {
            var ban = $('installBanner');
            ban.classList.remove('hidden', 'fade-out');
            setTimeout(function () {
              if ($('installBanner')) $('installBanner').classList.add('fade-out');
              setTimeout(function () {
                if ($('installBanner')) {
                  $('installBanner').classList.add('hidden');
                  $('installBanner').classList.remove('fade-out');
                }
              }, 450);
              try { sessionStorage.setItem('oro_hide_install', '1'); } catch (e1) { /* ignore */ }
            }, 5000);
          }
        } catch (eInst) { /* ignore */ }
      }, 1800);
      if (u && !isGuest(u) && D6.Supabase && D6.Supabase.startRealtime) {
        try { D6.Supabase.startRealtime(u.id); } catch (eRt) { /* ignore */ }
      }
    } catch (err) {
      try { console.warn('Mobile display fallback:', err); } catch (eW) { /* ignore */ }
      try { showScreen('screenTrade'); } catch (eS) { /* ignore */ }
    }
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

  function bumpChartLayout() {
    if (!(D6.Chart && D6.Chart.resize)) return;
    requestAnimationFrame(function () {
      D6.Chart.resize();
      if (D6.Chart.drawNow) D6.Chart.drawNow();
      setTimeout(function () {
        if (D6.Chart && D6.Chart.resize) D6.Chart.resize();
        if (D6.Chart && D6.Chart.drawNow) D6.Chart.drawNow();
      }, 120);
      setTimeout(function () {
        if (D6.Chart && D6.Chart.resize) D6.Chart.resize();
        if (D6.Chart && D6.Chart.drawNow) D6.Chart.drawNow();
      }, 400);
    });
  }

  var fsTradeHome = null;
  var fsTradeActive = false;

  function preferCssFullscreenOnly() {
    try {
      if (typeof IS_ANDROID !== 'undefined' && IS_ANDROID) return true;
      var ua = navigator.userAgent || '';
      return /Android|iPhone|iPad|iPod/i.test(ua);
    } catch (e0) {
      return true;
    }
  }

  function isNativeFullscreen() {
    try {
      return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    } catch (e) {
      return false;
    }
  }

  function requestFsEl(el) {
    // Mobile Android/iOS : jamais d'API native (crash / écran noir).
    if (preferCssFullscreenOnly()) return Promise.resolve();
    if (!el) return Promise.resolve();
    try {
      if (el.requestFullscreen) {
        return el.requestFullscreen({ navigationUI: 'hide' }).catch(function (err) {
          try { console.warn(err); } catch (eW) { /* ignore */ }
          try {
            return el.requestFullscreen();
          } catch (e2) {
            try { console.warn(e2); } catch (e3) { /* ignore */ }
            return Promise.resolve();
          }
        }).catch(function (err2) {
          try { console.warn(err2); } catch (e4) { /* ignore */ }
          return Promise.resolve();
        });
      }
      if (el.webkitRequestFullscreen) {
        try { el.webkitRequestFullscreen(); } catch (eWfs) { try { console.warn(eWfs); } catch (e5) { /* ignore */ } }
        return Promise.resolve();
      }
      if (el.webkitRequestFullScreen) {
        try { el.webkitRequestFullScreen(); } catch (eWfs2) { try { console.warn(eWfs2); } catch (e6) { /* ignore */ } }
        return Promise.resolve();
      }
      if (el.msRequestFullscreen) {
        try { el.msRequestFullscreen(); } catch (eMs) { try { console.warn(eMs); } catch (e7) { /* ignore */ } }
        return Promise.resolve();
      }
    } catch (e) {
      try { console.warn(e); } catch (e8) { /* ignore */ }
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  function exitFsNative() {
    if (preferCssFullscreenOnly()) return Promise.resolve();
    try {
      if (document.exitFullscreen) return document.exitFullscreen().catch(function (err) {
        try { console.warn(err); } catch (e) { /* ignore */ }
      });
      if (document.webkitExitFullscreen) {
        try { document.webkitExitFullscreen(); } catch (eW) { try { console.warn(eW); } catch (e2) { /* ignore */ } }
        return Promise.resolve();
      }
      if (document.msExitFullscreen) {
        try { document.msExitFullscreen(); } catch (eM) { try { console.warn(eM); } catch (e3) { /* ignore */ } }
        return Promise.resolve();
      }
    } catch (e) {
      try { console.warn(e); } catch (e4) { /* ignore */ }
    }
    return Promise.resolve();
  }

  function mountTradeFullscreen() {
    var wrap = $('tradeWrap');
    var slot = $('fsTradeSlot');
    var overlay = $('fsTradeOverlay');
    if (!wrap || !slot || !overlay || fsTradeActive) return false;
    try {
      fsTradeHome = { parent: wrap.parentNode, next: wrap.nextSibling };
      slot.appendChild(wrap);
      overlay.classList.add('on');
      overlay.removeAttribute('hidden');
      overlay.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('fs-trade');
      document.documentElement.classList.add('is-fullscreen');
      document.body.classList.add('is-fullscreen');
      document.body.style.overflow = 'hidden';
      fsTradeActive = true;
      var enterBtn = $('btnChartFs');
      if (enterBtn) {
        enterBtn.setAttribute('aria-pressed', 'true');
        enterBtn.title = t('fsExit') || 'Quitter le plein écran';
      }
      bumpChartLayout();
      return true;
    } catch (eMount) {
      try { console.warn(eMount); } catch (eW) { /* ignore */ }
      return false;
    }
  }

  function unmountTradeFullscreen() {
    var wrap = $('tradeWrap');
    var overlay = $('fsTradeOverlay');
    if (!wrap || !fsTradeActive) return;
    try {
      if (fsTradeHome && fsTradeHome.parent) {
        if (fsTradeHome.next && fsTradeHome.next.parentNode === fsTradeHome.parent) {
          fsTradeHome.parent.insertBefore(wrap, fsTradeHome.next);
        } else {
          fsTradeHome.parent.appendChild(wrap);
        }
      }
      fsTradeHome = null;
      fsTradeActive = false;
      if (overlay) {
        overlay.classList.remove('on');
        overlay.setAttribute('hidden', '');
        overlay.setAttribute('aria-hidden', 'true');
      }
      document.documentElement.classList.remove('fs-trade');
      document.documentElement.classList.remove('is-fullscreen');
      document.body.classList.remove('is-fullscreen');
      document.body.style.overflow = '';
      var stage = document.querySelector('.chart-stage');
      if (stage) {
        stage.style.height = '';
        stage.style.minHeight = '';
      }
      var enterBtn = $('btnChartFs');
      if (enterBtn) {
        enterBtn.setAttribute('aria-pressed', 'false');
        enterBtn.title = t('fsEnter') || 'PLEIN ÉCRAN';
        enterBtn.setAttribute('aria-label', t('fsEnter') || 'PLEIN ÉCRAN');
      }
      bumpChartLayout();
    } catch (eUn) {
      try { console.warn(eUn); } catch (eW) { /* ignore */ }
      fsTradeActive = false;
    }
  }

  function enterTradeFullscreen() {
    var trade = $('screenTrade');
    if (!trade || trade.classList.contains('hidden')) return;
    try {
      closeDrawer();
      if (!mountTradeFullscreen()) return;
      // Mobile : CSS only. Desktop : native optionnel, jamais bloquant.
      if (!preferCssFullscreenOnly()) {
        var overlay = $('fsTradeOverlay');
        requestFsEl(overlay || document.documentElement)
          .then(function () { bumpChartLayout(); })
          .catch(function (err) {
            try { console.warn(err); } catch (e) { /* ignore */ }
            bumpChartLayout();
          });
      } else {
        bumpChartLayout();
      }
    } catch (eEnter) {
      try { console.warn(eEnter); } catch (eW) { /* ignore */ }
    }
  }

  function leaveTradeFullscreen() {
    try {
      unmountTradeFullscreen();
      if (isNativeFullscreen()) {
        Promise.resolve(exitFsNative()).catch(function (err) {
          try { console.warn(err); } catch (e) { /* ignore */ }
        });
      }
      bumpChartLayout();
    } catch (eLeave) {
      try { console.warn(eLeave); } catch (eW) { /* ignore */ }
    }
  }

  function bindFullscreenTrade() {
    var enter = $('btnChartFs');
    var exit = $('btnChartFsExit');
    if (enter) {
      enter.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (fsTradeActive) leaveTradeFullscreen();
        else enterTradeFullscreen();
      });
    }
    if (exit) {
      exit.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        leaveTradeFullscreen();
      });
    }
    function onFsChange() {
      try {
        if (!isNativeFullscreen() && fsTradeActive && !preferCssFullscreenOnly()) {
          unmountTradeFullscreen();
        }
      } catch (eFs) {
        try { console.warn(eFs); } catch (eW) { /* ignore */ }
      }
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('MSFullscreenChange', onFsChange);
    window.addEventListener('orientationchange', function () {
      try {
        if (!fsTradeActive) return;
        setTimeout(function () {
          try { bumpChartLayout(); } catch (eB) { try { console.warn(eB); } catch (e) { /* ignore */ } }
        }, 220);
      } catch (eO) { try { console.warn(eO); } catch (e) { /* ignore */ } }
    });
    window.addEventListener('resize', function () {
      try {
        if (!fsTradeActive) return;
        bumpChartLayout();
      } catch (eR) { try { console.warn(eR); } catch (e) { /* ignore */ } }
    });
  }

  D6.App = {
    onRemoteAccount: function () {
      updateBalance(true);
      fillProfile();
    },
    updateBalance: updateBalance,
    getBalanceLocks: getBalanceLocks,
    boot: function () {
      try {
        try { captureUtmSource(); } catch (e0) { try { console.warn(e0); } catch (e) { /* ignore */ } }
        try { lockGestures(); } catch (e1) { try { console.warn('Mobile display fallback:', e1); } catch (e) { /* ignore */ } }
        try { fillLangBars(); } catch (e2) { /* ignore */ }
        try { fillCountrySelects(); } catch (e3) { /* ignore */ }
        try { D6.I18N.apply(); } catch (e4) { /* ignore */ }
        try { if (D6.I18N.refineFromGeo) D6.I18N.refineFromGeo(); } catch (e4b) { /* ignore */ }
        try { applyAndroidTradeHint(); } catch (e5) { /* ignore */ }
        try { bindAuth(); } catch (e6) { try { console.warn(e6); } catch (e) { /* ignore */ } }
        try { bindTrade(); } catch (e7) { try { console.warn(e7); } catch (e) { /* ignore */ } }
        try { startWithdrawTicker(); } catch (e8) { /* ignore */ }
        try { bindModals(); } catch (e9) { /* ignore */ }
        try { bindFullscreenTrade(); } catch (e10) { try { console.warn('Mobile display fallback:', e10); } catch (e) { /* ignore */ } }
        try { bindAdmin(); } catch (e11) { /* ignore */ }
        try { bindInstall(); } catch (e12) { /* ignore */ }
        try { loopParticles(); } catch (e13) { /* ignore */ }
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
      try {
        if ($('chartCanvas') && D6.Chart && D6.Chart.attach) {
          D6.Chart.attach($('chartCanvas'), function (ts) {
            try {
              if (!$('screenTrade') || $('screenTrade').classList.contains('hidden') || document.hidden) return;
              if (ts - lastHud < 80) return;
              lastHud = ts;
              updatePriceHud();
            } catch (eHud) { /* ignore */ }
          });
        }
      } catch (eChart) {
        try { console.warn('Mobile display fallback:', eChart); } catch (e) { /* ignore */ }
      }
      setInterval(function () {
        try {
          var u = user();
          if (u && D6.Engine.flushSettlements) D6.Engine.flushSettlements(u);
          patchHistorySoon();
          syncTradeButtons();
        } catch (eTick) { /* ignore */ }
      }, 1000);
      document.addEventListener('click', closeLangMenus);
      window.addEventListener('resize', closeLangMenus);
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') closeLangMenus();
      });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
          unlockAudio();
          var u = user();
          if (u && D6.Engine.restoreOpen) D6.Engine.restoreOpen(u);
          if (u && D6.Engine.flushSettlements) D6.Engine.flushSettlements(u);
          refreshRemoteVault();
          checkDepositReturn();
        }
      });
      window.addEventListener('pageshow', function () {
        refreshRemoteVault();
        checkDepositReturn();
      });
      setInterval(updatePayoutUi, 2500);
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
        try {
          if (D6.Auth.current() && !isGuest(D6.Auth.current())) enterApp();
          else {
            ensureGuest();
            enterApp();
          }
        } catch (eFin) {
          try { console.warn('Mobile display fallback:', eFin); } catch (e) { /* ignore */ }
          try { enterApp(); } catch (e2) { /* ignore */ }
        }
      }
      if ($('btnGoLogin')) $('btnGoLogin').addEventListener('click', function () { showAuthScreen('login'); });
      if ($('btnGoRegister')) $('btnGoRegister').addEventListener('click', function () { showAuthScreen('register'); });
      if ($('btnAuthBack')) $('btnAuthBack').addEventListener('click', function () {
        var pitch = $('authRealPitch');
        if (pitch) pitch.classList.add('hidden');
        ensureGuest();
        enterApp();
      });
      if ($('btnDemoTopup')) $('btnDemoTopup').addEventListener('click', function () {
        var u = user();
        if (!u || u.mode === 'real') return;
        var target = D6.CONFIG.DEMO_START || 1000000;
        var cur = D6.Store.demoBalance(u);
        if (cur >= target) { toast('Solde démo déjà à ' + D6.fmtFCFA(target), 'ok'); return; }
        D6.Store.setBalanceMode(u, 'demo', target);
        updateBalance(true);
        toast('Démo rechargée : ' + D6.fmtFCFA(target), 'ok');
      });
      if ($('closeTip')) { /* bound in bindModals */ }
      if ($('btnTipOk')) { /* bound in bindModals */ }
      (async function bootSession() {
        try {
          var cloud = null;
          if (D6.Supabase && D6.Supabase.restore) {
            try { cloud = await D6.Supabase.restore(); } catch (e) { cloud = null; }
          }
          if (cloud && cloud.ok && D6.Auth.current() && !isGuest()) {
            enterApp();
            return;
          }
          finishBoot();
        } catch (eBoot) {
          try { console.warn('Mobile display fallback:', eBoot); } catch (e) { /* ignore */ }
          try { finishBoot(); } catch (e2) {
            try { enterApp(); } catch (e3) { /* ignore */ }
          }
        }
      })();
      } catch (errBoot) {
        try { console.warn('Mobile display fallback:', errBoot); } catch (e) { /* ignore */ }
        try { finishBoot(); } catch (e2) {
          try { enterApp(); } catch (e3) { /* ignore */ }
        }
      }
    }
  };

  document.addEventListener('DOMContentLoaded', D6.App.boot);
})(window.D6 = window.D6 || {});
