(function (D6) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function unlockPointerLayers() {
    try {
      var dr = $('drawerProfile');
      var bd = $('drawerBackdrop');
      var drawerOn = !!(dr && dr.classList.contains('on')) || !!(bd && bd.classList.contains('on'));
      if (!drawerOn) {
        document.documentElement.classList.remove('oro-profile-open');
        if (bd) {
          bd.classList.remove('on');
          bd.style.setProperty('display', 'none', 'important');
          bd.style.setProperty('pointer-events', 'none', 'important');
        }
      }
      document.querySelectorAll('.modal-backdrop').forEach(function (el) {
        if (!el.classList.contains('active')) {
          el.style.setProperty('pointer-events', 'none', 'important');
          el.style.setProperty('display', 'none', 'important');
        }
      });
      var toast = $('toast');
      if (toast) toast.style.setProperty('pointer-events', 'none', 'important');
      var spark = $('sparkle');
      if (spark) spark.style.setProperty('pointer-events', 'none', 'important');
      var parts = $('particlesCanvas');
      if (parts) parts.style.setProperty('pointer-events', 'none', 'important');
      var fs = $('fsTradeOverlay');
      if (fs && !fs.classList.contains('on')) {
        fs.style.setProperty('pointer-events', 'none', 'important');
        fs.style.setProperty('display', 'none', 'important');
        fs.setAttribute('hidden', '');
      }
      document.body.style.pointerEvents = 'auto';
      forceClickableTree();
    } catch (eUnlock) { /* ignore */ }
  }

  function forceClickableTree() {
    try {
      var chain = [
        document.documentElement,
        document.body,
        $('screenTrade'),
        document.querySelector('.trade-shell'),
        $('tradeWrap'),
        document.querySelector('.topbar'),
        $('assetBar'),
        document.querySelector('.pad'),
        $('chartToolbar')
      ];
      chain.forEach(function (el) {
        if (!el || !el.style) return;
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('user-select', 'none', 'important');
      });
      document.querySelectorAll(
        '.topbar,.asset-bar,.pad,.chart-toolbar,.dur-row,.odds-row,.trade-row,' +
        '.asset-chip,.dur-chip,.odds-chip,.btn-trade,.btn-deposit,.qbtn,.mode-btn,.icon-btn,.help-badge,.ind-btn,.chart-fs-btn'
      ).forEach(function (el) {
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('user-select', 'none', 'important');
      });
      ['chartStage', 'chartCanvas', 'chartOverlay'].forEach(function (id) {
        var n = $(id);
        if (!n) return;
        n.style.setProperty('pointer-events', 'none', 'important');
        n.style.setProperty('z-index', '1', 'important');
      });
      var chart = $('chart');
      if (chart) chart.style.setProperty('z-index', '1', 'important');
    } catch (eForce) { /* ignore */ }
  }

  function setHidden(el, hide) {
    if (!el) return;
    el.classList.toggle('hidden', !!hide);
    if (hide) return;
    el.style.removeProperty('display');
    el.style.removeProperty('visibility');
    el.style.removeProperty('pointer-events');
  }

  function paintDepositLabel() {
    try {
      var el = $('btnDepositLabel');
      if (!el) return;
      var label = 'Deposit';
      try {
        if (D6.I18N && typeof D6.I18N.depositLabel === 'function') {
          label = D6.I18N.depositLabel() || 'Deposit';
        } else if (D6.I18N && typeof D6.I18N.t === 'function') {
          label = D6.I18N.t('deposit') || D6.I18N.t('recharge') || 'Deposit';
          if (label === 'deposit' || label === 'recharge') label = 'Deposit';
        }
      } catch (eLbl) {
        label = 'Deposit';
      }
      el.textContent = label;
      fitDepositLabel();
    } catch (ePaint) { /* ignore */ }
  }

  // « Recharger » toujours écrit en entier : s'il manque de place (Android étroit, langue longue),
  // le texte rétrécit un peu (jusqu'à 10 px) au lieu d'être coupé en « Rech… ».
  function fitDepositLabel() {
    try {
      var btn = $('btnOpenDeposit');
      var el = $('btnDepositLabel');
      if (!btn || !el) return;
      el.style.removeProperty('font-size');
      if (!btn.clientWidth) return;
      var fs = parseFloat(window.getComputedStyle(el).fontSize) || 15;
      var guard = 0;
      while (btn.scrollWidth > btn.clientWidth + 1 && fs > 10 && guard < 20) {
        fs -= 0.5;
        el.style.setProperty('font-size', fs + 'px', 'important');
        guard++;
      }
    } catch (eFitD) { /* ignore */ }
  }
  // Le bouton change de largeur (connexion, rotation, langue) → on réajuste le texte.
  function watchDepositLabel() {
    try {
      var btn = $('btnOpenDeposit');
      if (!btn) { document.addEventListener('DOMContentLoaded', watchDepositLabel); return; }
      if (window.ResizeObserver) {
        var lastW = 0;
        new ResizeObserver(function (ents) {
          var w = Math.round((ents[0] && ents[0].contentRect.width) || 0);
          if (w === lastW) return;
          lastW = w;
          fitDepositLabel();
        }).observe(btn);
      }
    } catch (eWd) { /* ignore */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchDepositLabel); else watchDepositLabel();

  // Cases « 1 min / 5 min / 10 min » : le chiffre en taille normale et « min » un peu plus petit, collés
  // (avant : « 10 min » débordait sur TV et paraissait plus gros que les autres). Les secondes ne changent pas.
  function splitDurLabels() {
    try {
      document.querySelectorAll('.dur-chip').forEach(function (el) {
        if (el.querySelector('.dc-n')) return;
        var m = String(el.textContent || '').trim().match(/^(\d+)\s*(min)$/i);
        if (!m) return;
        el.innerHTML = '<span class="dc-t"><span class="dc-n">' + m[1] + '</span><span class="dc-u">' + m[2] + '</span></span>';
      });
    } catch (eDur) { /* ignore */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', splitDurLabels); else splitDurLabels();

  var stake = 100;
  var toastTimer = null;
  var outcomeToastTimer = null;
  var outcomeToastSeen = {};
  var outcomeSlot = 0;
  var selectedOp = 'wave';
  var selectedAsset = 'v100';
  var depositOp = 'wave';
  var lastOfficialReal = null;
  var lastOfficialDemo = null;
  var lastSettleAt = 0;
  var lastSettleMode = null;
  var lastExecGuard = 0;
  var lastExecSide = '';
  var selectedOddsLive = 1.9;
  var tradeQ = [];
  var tradeQBusy = false;
  var lastPlaceOkAt = 0;
  var TRADE_Q_MAX = 9999;
  var cooling = false;
  var histPatch = 0;
  var hudSeen = {};
  var deferredPrompt = null;
  var balanceLockUntil = 0;
  var balanceLockDemo = null;
  var balanceLockReal = null;
  var lastPaintedBalance = null;
  var lastPaintedMode = null;
  var lastServerWager = null;
  var metaPvAt = 0;
  var metaPvScreen = '';
  var IS_ANDROID = /Android/i.test(navigator.userAgent || '');
  var IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var IS_TV = (function () {
    try {
      if (document.documentElement.classList.contains('is-tv')) return true;
      var ua = navigator.userAgent || '';
      var tvHint = /Android\s*TV|\bSMART-TV\b|SmartTV|BRAVIA|AFT[A-Za-z0-9]|GoogleTV|Nexus Player|SHIELD Android TV|MiBOX|MIBOX|Web0S|Tizen|VIDAA|HbbTV|CrKey|NetCast|POV_TV|AOSP TV|sdk_google_tv|Android TV/i.test(ua);
      var android = /Android/i.test(ua);
      var noMobile = android && !/Mobile/i.test(ua);
      var w = Math.max(screen.width || 0, window.innerWidth || 0);
      var h = Math.max(screen.height || 0, window.innerHeight || 0);
      var longSide = Math.max(w, h);
      var shortSide = Math.min(w, h);
      var tvShape = longSide >= 1100 && shortSide >= 600 && (longSide / shortSide) >= 1.5;
      // Écran large et peu haut piloté sans doigt (télé avec navigateur « PC », pointeur de télécommande).
      var coarse = false;
      try { coarse = window.matchMedia('(pointer:coarse)').matches && !window.matchMedia('(pointer:fine)').matches; } catch (eMq) { coarse = false; }
      var iw = window.innerWidth || 0;
      var ih = window.innerHeight || 0;
      var wideShort = !coarse && iw >= 700 && ih > 0 && ih <= 620 && iw / ih >= 1.5;
      var androidBigLandscape = noMobile && iw >= 800 && ih > 0 && iw / ih >= 1.4;
      return !!(tvHint || (android && tvShape) || (noMobile && tvShape) || wideShort || androidBigLandscape);
    } catch (eTv) { return false; }
  })();
  if (IS_TV) {
    try { document.documentElement.classList.add('is-tv'); } catch (eTv2) { /* ignore */ }
    // Télé : « Se déconnecter » reste à sa place normale, en bas du profil (le profil tient maintenant en
    // entier dans l'écran de la télé, plus besoin de le remonter en haut).
  }
  if (IS_ANDROID) {
    try { document.documentElement.classList.add('is-android'); } catch (eAnd) { /* ignore */ }
  }
  if (IS_IOS) {
    try { document.documentElement.classList.add('is-ios'); } catch (eIos) { /* ignore */ }
  }
  var DEMO_TRADES_KEY = 'orolado_demo_trades_v1';

  // Navigateur intégré d'une appli (Facebook, Instagram, TikTok…) : Google y refuse la connexion.
  function googleInApp() {
    return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|musical_ly|TikTok|BytedanceWebview|Line\/|Snapchat/i.test(navigator.userAgent || '');
  }

  // v2399 — bouton OFFICIEL de Google (dessiné par Google) : petite fenêtre « Se connecter à
  // orolado.com » au lieu de la page qui affichait l'adresse technique de Supabase.
  // Visible si CONFIG.GOOGLE_PUBLIC, ou pour l'essai du propriétaire (orolado.com/?gtest=1).
  // Navigateur d'une appli (Facebook…) : Google y refuse ; on garde l'ancien bouton (Chrome / message).
  function setupGoogleOfficial() {
    var cfg = D6.CONFIG || {};
    var on = !!cfg.GOOGLE_PUBLIC;
    try {
      if (/[?&]gtest=1(&|$)/.test(location.search)) sessionStorage.setItem('oro_gtest', '1');
      if (sessionStorage.getItem('oro_gtest') === '1') on = true;
    } catch (eT) { /* ignore */ }
    if (!on || !cfg.GOOGLE_CLIENT_ID) return;
    var root = document.documentElement;
    root.classList.add('g-on');
    if (googleInApp()) { root.classList.add('g-inapp'); return; }
    var rawNonce = '';
    function regAgeSync() {
      var ok = !!($('regAge') && $('regAge').checked);
      document.querySelectorAll('[data-g-register]').forEach(function (el) { el.classList.toggle('g-age-ok', ok); });
      if (ok && $('err-regAge')) { $('err-regAge').textContent = ''; $('err-regAge').classList.remove('on'); }
    }
    if ($('regAge')) $('regAge').addEventListener('change', regAgeSync);
    document.querySelectorAll('.g-age-block').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        clearErrors();
        showFieldError('regAge', 'Vous devez confirmer avoir plus de 18 ans');
      });
    });
    regAgeSync();
    async function onCredential(resp) {
      if (!resp || !resp.credential) return;
      var res = null;
      try { res = await D6.Auth.googleWithIdToken(resp.credential, rawNonce); } catch (eC) { res = null; }
      if (res && res.ok && D6.Auth.current() && !isGuest()) {
        if (res.isNew) metaTrack('CompleteRegistration');
        enterApp({ openFullscreen: true });
        return;
      }
      toast((res && res.reason) || t('googleFail'), 'err', 4000);
    }
    // v2404 : Google initialisé UNE fois ; chaque bouton dessiné une seule fois pour une largeur donnée
    // (avant : redessiné à chaque clic Connexion / Inscription → le bouton « clignotait »).
    var gReady = null;
    function initOnce() {
      if (gReady) return gReady;
      var bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      rawNonce = Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      gReady = crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce)).then(function (buf) {
        var hashed = Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        google.accounts.id.initialize({
          client_id: cfg.GOOGLE_CLIENT_ID,
          callback: onCredential,
          nonce: hashed,
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true
        });
      });
      return gReady;
    }
    function render() {
      if (!window.google || !google.accounts || !google.accounts.id) return;
      // Largeur prise sur la carte (toujours visible quand l'écran de connexion est ouvert), pas sur le
      // formulaire (caché = largeur 0) : les deux boutons sont dessinés ensemble, une seule fois.
      var card = document.querySelector('#screenAuth .auth-card');
      var cw = card ? card.clientWidth : 0;
      if (cw < 200) return;
      var cs = window.getComputedStyle(card);
      var inner = cw - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      // Dessiné à 1/1,15 de la largeur puis agrandi ×1,15 en CSS (.g-holder) : hauteur du bouton orange.
      var w = Math.max(200, Math.min(400, Math.round(inner / 1.15)));
      initOnce().then(function () {
        document.querySelectorAll('[data-g-official]').forEach(function (box) {
          if (box.getAttribute('data-gw') === String(w)) return;
          box.setAttribute('data-gw', String(w));
          var holder = box.querySelector('.g-holder');
          if (!holder) { holder = document.createElement('div'); holder.className = 'g-holder'; box.insertBefore(holder, box.firstChild); }
          holder.innerHTML = '';
          google.accounts.id.renderButton(holder, {
            type: 'standard', theme: 'outline', size: 'large', text: 'continue_with',
            shape: 'rectangular', logo_alignment: 'center', width: w,
            locale: (D6.I18N && D6.I18N.lang) || 'fr'
          });
        });
      });
    }
    if (window.google && window.google.accounts && window.google.accounts.id) { render(); }
    else {
      var s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    }
    // Ouverture de l'écran de connexion / rotation : dessiné si pas encore fait à cette largeur (sinon rien).
    window.addEventListener('resize', function () { setTimeout(render, 120); });
    if ($('btnGoLogin')) $('btnGoLogin').addEventListener('click', function () { setTimeout(render, 60); });
    if ($('btnGoRegister')) $('btnGoRegister').addEventListener('click', function () { setTimeout(render, 60); });
    // Écran de connexion ouvert par un autre chemin (bouton RÉEL d'un visiteur…) : petite vérification
    // chaque seconde (ne fait rien si le bouton est déjà dessiné à la bonne largeur).
    setInterval(render, 1000);
  }

  function bindAndroidTap(el, fn) {
    if (!el || typeof fn !== 'function') return;
    var last = 0;
    function run(e) {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('is-waiting')) return;
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

  function bindImmediateClose(el, fn) {
    if (!el || typeof fn !== 'function') return;
    el.style.pointerEvents = 'auto';
    el.style.touchAction = 'manipulation';
    var last = 0;
    function run(e) {
      var now = Date.now();
      if (now - last < 250) return;
      last = now;
      if (e) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
      fn(e);
    }
    el.addEventListener('pointerdown', run);
    el.addEventListener('touchstart', run, { passive: false });
    el.addEventListener('click', run);
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

  function metaTrack(eventName, params, opts) {
    try {
      if (typeof window.fbq !== 'function') return;
      var extra = (opts && opts.eventID) ? { eventID: String(opts.eventID) } : null;
      if (params && extra) window.fbq('track', eventName, params, extra);
      else if (params) window.fbq('track', eventName, params);
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
    { code: 'id', flag: '🇮🇩', name: 'Indonesia' },
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
    if (cur === 50000 || cur === 5000 || cur === 50000.0 || (u.guest && (cur <= 0 || cur === 50000))) {
      D6.Store.setBalanceMode(u, 'demo', start);
    }
  }

  function ensureGuest() {
    var existing = D6.Store.findByEmail('guest@orolado.local');
    if (!existing) {
      existing = D6.Store.createUser({
        id: 'guest_local',
        displayName: t('m_guest'),
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
    showAuthScreen('register', { fromReal: true });
    return false;
  }

  function showAuthScreen(tab, opts) {
    opts = opts || {};
    try { sessionStorage.setItem('oro_auth_tab', tab === 'login' ? 'login' : 'register'); } catch (eTab) { /* ignore */ }
    showScreen('screenAuth');
    markBootReady();
    var auth = $('screenAuth');
    if (auth) {
      auth.classList.remove('hidden');
      auth.style.setProperty('display', 'flex', 'important');
      auth.style.setProperty('pointer-events', 'auto', 'important');
      auth.style.removeProperty('visibility');
    }
    document.querySelectorAll('.auth-tab').forEach(function (el) {
      el.classList.toggle('on', el.dataset.tab === tab);
    });
    if ($('formLogin')) setHidden($('formLogin'), tab !== 'login');
    if ($('formRegister')) setHidden($('formRegister'), tab !== 'register');
    var pitch = $('authRealPitch');
    if (pitch) {
      pitch.classList.add('hidden');
      pitch.setAttribute('hidden', '');
      pitch.textContent = '';
    }
    if (tab === 'register') metaTrack('Lead');
  }

  function markBootReady() {
    try { document.documentElement.classList.add('oro-booted'); } catch (eBoot) { /* ignore */ }
  }

  function clearAuthTabIntent() {
    try { sessionStorage.removeItem('oro_auth_tab'); } catch (eClr) { /* ignore */ }
  }

  function syncAuthQuick() {
    var q = $('authQuick');
    var trade = $('screenTrade');
    var guest = isGuest();
    if (q) q.classList.toggle('hidden', !guest);
    if (trade) trade.classList.toggle('is-guest', guest);
    if ($('btnProfile')) $('btnProfile').classList.toggle('hidden', guest);
    if ($('topbarCta')) $('topbarCta').classList.toggle('hidden', guest);
    if ($('btnOpenDeposit')) $('btnOpenDeposit').classList.toggle('hidden', guest);
    setTimeout(syncTopBtnHeight, 50);
  }

  function lockBalanceOptimistic(demo, real, ms) {
    balanceLockUntil = Date.now() + (ms || 8000);
    if (demo != null && isFinite(Number(demo)) && Number(demo) >= 0) balanceLockDemo = Number(demo);
    if (real != null && isFinite(Number(real)) && Number(real) >= 0) balanceLockReal = Number(real);
  }

  function armStakeReserve(once, stake, ms) {
    D6.stakeReserve = {
      once: D6.roundMoney(once),
      stake: D6.roundMoney(stake),
      until: Date.now() + (ms || 20000)
    };
  }

  function clearStakeReserve() {
    D6.stakeReserve = null;
  }

  D6.correctStakeReserve = function (real) {
    var r = D6.stakeReserve;
    if (!r || Date.now() > r.until) return real;
    var n = Number(real);
    if (!isFinite(n)) return real;
    // Uniquement annuler une double soustraction (n trop bas). Ne JAMAIS remonter
    // un débit serveur légitime (sinon 9$ → 10$ à l’écran).
    if (n < r.once - 0.05 && (r.once - n) <= (Number(r.stake) || 0) + 0.09) return r.once;
    return n;
  };

  function openStakeSum(mode) {
    if (D6.Engine && D6.Engine.openStakeSum) {
      return D6.Engine.openStakeSum(mode === 'real' ? 'real' : 'demo');
    }
    var sum = 0;
    try {
      var list = (D6.Engine && D6.Engine.getTrades) ? D6.Engine.getTrades(mode) : [];
      var i;
      for (i = 0; i < list.length; i++) sum += Number(list[i] && list[i].stake) || 0;
    } catch (eS) { sum = 0; }
    return D6.roundMoney ? D6.roundMoney(sum) : sum;
  }

  /** Mises encore en cours (même déjà confirmées serveur) — évite le yo-yo d’affichage. */
  function openLiveStakeSum(mode) {
    if (D6.Engine && D6.Engine.openLiveStakeSum) {
      return D6.Engine.openLiveStakeSum(mode === 'real' ? 'real' : 'demo');
    }
    if (D6.Engine && D6.Engine.liveCount) {
      var n = D6.Engine.liveCount(mode === 'real' ? 'real' : 'demo');
      if (n > 0) return n;
    }
    return openStakeSum(mode);
  }

  function openRealStake() {
    // Compter TOUTES les mises ouvertes (confirmées incluses).
    // Sinon après placeOrder OK, open=0 et un me() périmé (souvent au réveil mobile)
    // est pris pour un « dépôt » → la mise remonte à l’écran.
    return openLiveStakeSum('real');
  }

  function openLiveRealStake() {
    return openLiveStakeSum('real');
  }

  function availableStakeBalance(u, mode) {
    u = u || user();
    if (!u) return 0;
    mode = mode === 'real' ? 'real' : 'demo';
    var have = mode === 'real'
      ? (D6.Store.realBalance ? Number(D6.Store.realBalance(u)) || 0 : Number(D6.Store.balanceOf(u)) || 0)
      : Number(D6.Store.demoBalance ? D6.Store.demoBalance(u) : D6.Store.balanceOf(u)) || 0;
    // Réel : setBal ne débite pas le store → réserver les mises ouvertes (1 seule fois).
    // Démo : setBal a déjà débité → ne pas re-soustraire.
    if (mode === 'real') have = Math.max(0, have - openStakeSum('real'));
    return D6.roundMoney ? D6.roundMoney(have) : have;
  }

  /** Pendant un trade réel : seul placeOrder/settleOrder peut bouger le solde affiché.
   *  Important : un dépôt récent (holdDepositReal) ne doit PAS désactiver ce gel,
   *  sinon me()/poll remettent le solde au dépôt pendant/après le trade.
   *  Gel tant qu’un trade réel est ENCORE OUVERT (pas seulement « non confirmé »),
   *  sinon me()/poll font hésiter le solde une fois placeOrder OK.
   *  Fenêtre post-settle élargie : les téléphones rappellent me() au réveil avec un
   *  solde périmé plus haut → sans ça la mise « revient ». */
  function tradeBalanceFrozen() {
    if (openLiveRealStake() > 0.009) return true;
    if (D6.stakeReserve && Date.now() < D6.stakeReserve.until) return true;
    // Fix solde réel : 8s suffisent pour que settleOrder réponde (au lieu de 45s).
    if (lastSettleAt && lastSettleMode === 'real' && Date.now() - lastSettleAt < 45000) return true;
    var locks = getBalanceLocks();
    if (locks && Date.now() < locks.until && locks.real != null) return true;
    return false;
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
    try {
      localStorage.setItem('oro_last_bal_txt', text);
    } catch (eBal) { /* ignore */ }
    ['fsTopBalance'].forEach(function (id) {
      var b = $(id);
      if (b) {
        b.textContent = text;
        b.hidden = false;
      }
    });
    if (flash) {
      var card = $('balanceCard');
      if (card) {
        card.classList.remove('flash');
        void card.offsetWidth;
        card.classList.add('flash');
      }
    }
    paintModeAmounts();
  }

  // Boutons DÉMO / COMPTE RÉEL : chacun affiche son solde, tout le temps. Le mode actif reprend
  // exactement le solde affiché (mêmes règles de gel pendant un trade) ; l'autre lit le solde
  // enregistré. Affichage seulement : aucun calcul d'argent ne change.
  var modeAmtLast = {};
  function paintModeAmounts() {
    try {
      var u = user();
      var guest = !u || isGuest(u);
      var real = !!(u && u.mode === 'real');
      var cur = lastPaintedBalance || ($('balanceDisplay') ? $('balanceDisplay').textContent : '');
      var demoTxt;
      var realTxt;
      if (real) {
        realTxt = cur;
        demoTxt = D6.fmtFCFA(Number(D6.Store.demoBalance ? D6.Store.demoBalance(u) : 0) || 0);
      } else {
        demoTxt = cur;
        realTxt = D6.fmtFCFA(guest ? 0 : Math.max(0, availableStakeBalance(u, 'real')));
      }
      [['modeDemoAmt', demoTxt], ['fsDemoAmt', demoTxt], ['modeRealAmt', realTxt], ['fsRealAmt', realTxt]].forEach(function (p) {
        if (!p[1] || modeAmtLast[p[0]] === p[1]) return;
        var el = $(p[0]);
        if (!el) return;
        el.textContent = p[1];
        modeAmtLast[p[0]] = p[1];
      });
    } catch (eMa) { /* ignore */ }
  }
  setInterval(paintModeAmounts, 1000);

  function setModeChrome(u) {
    var trade = $('screenTrade');
    if (!trade) return;
    u = u || user();
    var guest = !u || isGuest(u);
    if (u) {
      trade.classList.toggle('mode-demo', u.mode !== 'real');
      trade.classList.toggle('mode-real', u.mode === 'real');
    }
    var plus = $('btnDemoTopup');
    var real = !!(u && u.mode === 'real');
    var plusTitle = real ? (t('recharge') || 'Recharger') : (t('demoTopup') || 'Recharger la démo');
    if (plus) {
      plus.classList.toggle('hidden', guest);
      plus.title = plusTitle;
      plus.setAttribute('aria-label', plusTitle);
    }
    var fsPlus = $('btnFsTopup');
    if (fsPlus) {
      fsPlus.classList.toggle('hidden', guest);
      fsPlus.title = plusTitle;
      fsPlus.setAttribute('aria-label', plusTitle);
    }
    document.querySelectorAll('.fs-mode-btn').forEach(function (el) {
      el.classList.toggle('on', el.dataset.mode === (real ? 'real' : 'demo'));
    });
    // Plein écran identique connecté / non inscrit : DÉMO, « + » et RÉEL toujours affichés.
    // Non inscrit : « + » et RÉEL ouvrent l'inscription (requireAccount dans openDeposit / switchMode).
    try { document.documentElement.classList.toggle('oro-guest', !!guest); } catch (eG) { /* ignore */ }
    if ($('btnFsMidPlus')) $('btnFsMidPlus').classList.remove('hidden');
    if ($('fsBtnReal')) $('fsBtnReal').classList.remove('hidden');
    modeAmtLast = {};
    paintModeAmounts();
    syncTopBtnHeight();
  }

  // Safari iPhone : sa barre flottante en bas laisse à la page plus de hauteur que Chrome, et la courbe
  // (hauteur fixe sur téléphone) laissait un vide sous ACHETER / VENDRE. On agrandit la courbe de
  // exactement ce vide, en s'arrêtant au-dessus de la barre de Safari. Chrome, Android, autres : rien.
  var UA_SAFARI_IOS = (function () {
    try {
      var ua = navigator.userAgent || '';
      var ios = /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\//.test(ua);
    } catch (eUa) { return false; }
  })();
  // Marque « Safari iPhone » : la bande du bas (sous la barre flottante) n'existe que sur Safari.
  if (UA_SAFARI_IOS) { try { document.documentElement.classList.add('is-ios-safari'); } catch (eSc) { /* ignore */ } }
  var safariGapW = 0;
  var safariGapH = 0;
  function safeBottomPx() {
    try {
      var p = document.createElement('div');
      p.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none';
      document.body.appendChild(p);
      var v = p.offsetHeight || 0;
      p.remove();
      return v;
    } catch (eSb) { return 0; }
  }
  // PC : la courbe va jusqu'au bord gauche et jusqu'en bas de l'écran (demande du propriétaire). On
  // mesure la marge qui reste et on la donne au CSS (--oro-bleed-l / --oro-bleed-b, css/galaxy.css).
  function bleedChartPc() {
    try {
      var root = document.documentElement;
      var card = document.querySelector('#tradeWrap .chart-card');
      var off = (window.innerWidth || 0) < 860 || root.classList.contains('fs-trade') || root.classList.contains('is-tv');
      if (!card || off) {
        root.style.removeProperty('--oro-bleed-l');
        root.style.removeProperty('--oro-bleed-b');
        return;
      }
      var cs = window.getComputedStyle(root);
      var curL = parseFloat(cs.getPropertyValue('--oro-bleed-l')) || 0;
      var curB = parseFloat(cs.getPropertyValue('--oro-bleed-b')) || 0;
      var r = card.getBoundingClientRect();
      if (!(r.width > 0)) return;
      var l = Math.max(0, Math.round(r.left + curL));
      var b = Math.max(0, Math.round((window.innerHeight || 0) - (r.bottom - curB)));
      if (l > 120 || b > 120) return; // mise en page inattendue : on ne touche à rien
      if (Math.abs(l - curL) >= 1) root.style.setProperty('--oro-bleed-l', l + 'px');
      if (Math.abs(b - curB) >= 1) root.style.setProperty('--oro-bleed-b', b + 'px');
    } catch (eBl) { /* ignore */ }
  }
  window.addEventListener('resize', function () { setTimeout(bleedChartPc, 60); });
  window.addEventListener('load', function () { setTimeout(bleedChartPc, 300); });
  setTimeout(bleedChartPc, 900);
  setInterval(bleedChartPc, 2000);
  // iPhone / iPad (Safari, Chrome et les autres navigateurs) : le terminal n'est pas fixé en bas comme
  // sur Android. La COURBE prend toute la place libre jusqu'au terminal, posé en bas de l'écran ;
  // ACHETER / VENDRE gardent leur taille normale. (?iosfit=1 : même calcul pour tester sur PC.)
  var IOS_ANY = (function () {
    try {
      var ua = navigator.userAgent || '';
      return /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
        /[?&]iosfit=1\b/.test(location.search);
    } catch (eIa) { return false; }
  })();
  function fillSafariGap(force) {
    if (!IOS_ANY) return;
    try {
      var html = document.documentElement;
      if (html.classList.contains('fs-trade') || html.classList.contains('is-fullscreen')) return;
      var scr = $('screenTrade');
      var pad = document.querySelector('#screenTrade #tradeWrap > .pad');
      var card = $('chart');
      var stage = $('chartStage');
      // v2362 : téléphone couché → sa propre mise en page (css/app.css, fin) ; ce calcul du portrait ne s'applique pas.
      if (scr && window.innerWidth > window.innerHeight && window.innerHeight <= 500) {
        scr.classList.remove('saf-fill');
        safariGapW = 0;
        return;
      }
      if (!scr || !pad || !card || !stage || !pad.offsetHeight || window.innerWidth >= 860) return;
      // Pas de recalcul pendant la saisie (clavier ouvert) : la page ne saute pas en tapant.
      // v2351 : MAIS si la hauteur change vraiment (barre de Safari qui grandit / rétrécit au chargement ou au
      // défilement), on recalcule : avant, le calcul fait au mauvais moment laissait une bande vide en bas.
      var typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName || '');
      var sameW = safariGapW === window.innerWidth;
      var sameH = Math.abs((safariGapH || 0) - window.innerHeight) < 30;
      if (!force && sameW && (sameH || typing)) return;
      safariGapW = window.innerWidth;
      safariGapH = window.innerHeight;
      scr.classList.remove('saf-fill');
      // Safari : la page peut passer SOUS sa barre flottante (hauteur = tout l'écran) → on garde la
      // place de la barre ; sinon petite marge. Autres navigateurs iPhone : la zone de la barre d'accueil.
      var bottomRes;
      if (UA_SAFARI_IOS) {
        var fullScreenH = window.screen && window.screen.height ? window.screen.height : 0;
        var underBar = fullScreenH > 0 && window.innerHeight >= fullScreenH - 4;
        bottomRes = underBar ? (safeBottomPx() + 35) : 8;
      } else {
        bottomRes = safeBottomPx() + 4;
      }
      var cardTop = card.getBoundingClientRect().top;
      var toolsH = Math.max(0, stage.getBoundingClientRect().top - cardTop);
      var padH = pad.getBoundingClientRect().height;
      // Application installée sur l'écran d'accueil (iPhone) : la page est plus courte que la fenêtre
      // (≈ hauteur de la barre d'état en moins). Avant, le calcul prenait toute la fenêtre : ACHETER /
      // VENDRE passaient sous la bande bleue du bas. On prend le vrai bas de la page s'il est plus haut.
      var viewBottom = window.innerHeight;
      var scrBottom = scr.getBoundingClientRect().bottom;
      if (scrBottom > 300 && scrBottom < viewBottom - 2) viewBottom = scrBottom;
      var h = Math.floor(viewBottom - bottomRes - padH - cardTop);
      if (h < 200) h = 200;
      html.style.setProperty('--ios-chart-h', h + 'px');
      html.style.setProperty('--ios-stage-h', Math.max(150, h - toolsH) + 'px');
      html.classList.add('ios-fit');
      bumpChartLayout();
    } catch (eFg) { /* ignore */ }
  }

  // v2400 — Connexion / Inscription sur iPhone : Safari annonce TOUTE la hauteur de l'écran mais sa
  // barre flottante cache le bas. On garde la place de cette barre (saf-under) et on serre un peu les
  // cases si la vraie zone visible est petite (auth-tight). Même idée sur les autres téléphones.
  function authFit() {
    try {
      var html = document.documentElement;
      var ih = window.innerHeight || 0;
      var fullScreenH = window.screen && window.screen.height ? window.screen.height : 0;
      var under = !!(UA_SAFARI_IOS && fullScreenH > 0 && ih >= fullScreenH - 4 && window.innerWidth < window.innerHeight);
      html.classList.toggle('saf-under', under);
      var visible = under ? ih - safeBottomPx() - 70 : ih;
      html.classList.toggle('auth-tight', window.innerWidth < 860 && window.innerWidth < ih && (visible < 860));
    } catch (eAf) { /* ignore */ }
  }
  authFit();
  window.addEventListener('resize', function () { setTimeout(authFit, 60); });
  window.addEventListener('orientationchange', function () { setTimeout(authFit, 300); });

  // Outil de mesure : orolado.com/?diag=1 affiche les vraies mesures de l'écran (pour régler Safari).
  // Dans l'application installée (pas de barre d'adresse) : toucher 5 fois vite « Aide » l'affiche aussi.
  var diagOn = false;
  function startDiag() {
    try {
      if (diagOn) return;
      if (!document.body) { document.addEventListener('DOMContentLoaded', startDiag); return; }
      diagOn = true;
      var box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:6px;top:60px;z-index:2176483647;background:rgba(0,0,0,.85);color:#0f0;font:11px/1.35 monospace;padding:6px 8px;border-radius:8px;pointer-events:none;white-space:pre';
      var probe = function (unit) {
        var p = document.createElement('div');
        p.style.cssText = 'position:fixed;left:-9px;top:0;width:1px;visibility:hidden;pointer-events:none;height:100' + unit;
        document.body.appendChild(p);
        var h = Math.round(p.getBoundingClientRect().height);
        p.remove();
        return h;
      };
      document.body.appendChild(box);
      // v2355 : mesures du dernier trade (lecture seule, visibles seulement dans cette case) : version chargée,
      // retard de la courbe, réponse du serveur, apparition du rond et nombre de fois où il bouge.
      var tr = { id: '', click: 0, conf: 0, first: 0, moves: 0, pmoves: 0, lastY: NaN, lastP: NaN, lo: NaN, hi: NaN, ride: null, dmin: 0, dmax: 0 };
      var verM = /[?&]v=(\d+)/.exec(((document.querySelector('script[src*="app.js"]') || {}).src) || '');
      try {
        var E = D6.Engine;
        var origPlace = E.placeOrder;
        E.placeOrder = function () {
          var r = origPlace.apply(E, arguments);
          if (r && r.ok && r.trade) {
            tr = { id: r.trade.id, click: performance.now(), conf: 0, first: 0, moves: 0, pmoves: 0, lastY: NaN, lastP: NaN, lo: NaN, hi: NaN, ride: D6.Chart.markDebug().ride, dmin: 1e9, dmax: 0 };
            var loopT = function () {
              if (!tr.click || performance.now() - tr.click > 6000) return;
              var m = D6.Chart.markDebug();
              var dd = E.displayDelay();
              if (dd < tr.dmin) tr.dmin = dd;
              if (dd > tr.dmax) tr.dmax = dd;
              if (m.ride && m.ride !== tr.ride) {
                if (!tr.first) tr.first = performance.now();
                var p = m.ride.entry;
                if (isFinite(tr.lastP) && Math.abs(p - tr.lastP) > 1e-9) tr.pmoves++;
                if (isFinite(tr.lastY) && Math.abs(m.markY - tr.lastY) > 1 && m.lo === tr.lo && m.hi === tr.hi) tr.moves++;
                tr.lastP = p; tr.lastY = m.markY; tr.lo = m.lo; tr.hi = m.hi;
              }
              tr.ride = m.ride;
              requestAnimationFrame(loopT);
            };
            requestAnimationFrame(loopT);
          }
          return r;
        };
        var origConf = E.confirmTrade;
        E.confirmTrade = function (id) {
          if (id === tr.id && !tr.conf) tr.conf = performance.now();
          return origConf.apply(E, arguments);
        };
      } catch (eTr) { /* ignore */ }
      setInterval(function () {
        var pad = document.querySelector('#tradeWrap > .pad');
        var scr = $('screenTrade');
        var vv = window.visualViewport;
        var appli = !!(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
        box.textContent = 'safari=' + UA_SAFARI_IOS + ' appli=' + appli +
          '\ninner=' + window.innerWidth + 'x' + window.innerHeight +
          '\nscreen=' + (screen.width || 0) + 'x' + (screen.height || 0) +
          '\nvisual=' + (vv ? Math.round(vv.height) : '-') +
          '\nvh=' + probe('vh') + ' dvh=' + probe('dvh') + ' svh=' + probe('svh') + ' lvh=' + probe('lvh') +
          '\nhtml=' + Math.round(document.documentElement.getBoundingClientRect().height) + ' body=' + Math.round(document.body.getBoundingClientRect().height) +
          '\nscrBas=' + (scr ? Math.round(scr.getBoundingClientRect().bottom) : '-') +
          '\nsafeBas=' + safeBottomPx() +
          '\npadBas=' + (pad ? Math.round(pad.getBoundingClientRect().bottom) : '-') +
          '\nfill=' + ((scr || {}).className || '').indexOf('saf-fill') +
          '\nversion=' + (verM ? verM[1] : '?') + ' retard=' + (D6.Engine.displayDelay ? D6.Engine.displayDelay() : '?') +
          '\ntrade: serveur=' + (tr.conf ? Math.round(tr.conf - tr.click) : '-') + ' rond=' + (tr.first ? Math.round(tr.first - tr.click) : '-') +
          '\nbouge=' + tr.moves + ' prix=' + tr.pmoves + ' retard ' + (tr.click ? tr.dmin + '-' + tr.dmax : '-');
      }, 500);
    } catch (eDg) { /* ignore */ }
  }
  if (/[?&]diag=1\b/.test(location.search)) startDiag();

  // Plein écran : « QUITTER » au MILIEU, entre Démo et Compte réel (demande du propriétaire : tout bien droit,
  // sur mesure). Le bouton est seulement déplacé (ses actions restent les mêmes).
  (function placeFsExit() {
    try {
      var ex = document.getElementById('btnChartFsExit');
      var demo = document.getElementById('fsBtnDemo');
      if (!ex || !demo) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', placeFsExit); return; }
      if (demo.nextElementSibling !== ex) demo.parentNode.insertBefore(ex, demo.nextElementSibling);
      document.documentElement.classList.add('fs-exit-mid');
    } catch (eFe) { /* ignore */ }
  })();

  // Écran de jeu : un double toucher rapide (ACHETER plusieurs fois, ×2, + / −…) ne zoome jamais la page.
  // Le pincement de la courbe (zoom des bougies) n'est pas touché : il est géré par le graphique.
  (function noDoubleTapZoom() {
    try {
      var lastTouch = 0;
      document.addEventListener('touchend', function (e) {
        var now = Date.now();
        if (now - lastTouch < 320 && e.target && e.target.closest &&
            e.target.closest('#screenTrade, #fsTradeOverlay') && !e.target.closest('input, textarea, select')) {
          e.preventDefault();
          // Le 2e toucher compte quand même (×2, ÷2, + / −…), sauf ACHETER / VENDRE : un double toucher
          // très rapide n'ouvre jamais deux trades par accident.
          try {
            var hit = e.target.closest('button, .qbtn, .dur-chip, .odds-chip, .asset-chip, .ind-btn, .help-badge, .lang-dd-btn, #btnProfile');
            if (hit && !hit.closest('#btnCall, #btnPut, .btn-trade, .trade-row')) hit.click();
          } catch (eC) { /* ignore */ }
        }
        lastTouch = now;
      }, { passive: false });
      document.addEventListener('dblclick', function (e) {
        if (e.target && e.target.closest && e.target.closest('#screenTrade, #fsTradeOverlay')) e.preventDefault();
      }, { passive: false });
    } catch (eDz) { /* ignore */ }
  })();

  // Application iPhone installée (écran d'accueil) : la page se prolonge jusqu'au vrai bas de l'écran et
  // tout le fond est le bleu du terminal (avant : bande sombre / noire sous ACHETER / VENDRE).
  (function iosAppFloor() {
    try {
      var ua = navigator.userAgent || '';
      var ios = /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      var app = !!(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
      if (!ios || !app) return;
      var root = document.documentElement;
      root.classList.add('ios-app');
      root.style.setProperty('background', '#1A2A68', 'important');
      var paint = function () {
        try {
          // Hauteur réelle de l'écran (l'appli iPhone a une fenêtre plus courte que l'écran) : utilisée par le profil.
          root.style.setProperty('--ios-full-h', Math.max(window.innerHeight || 0, (screen && screen.height) || 0) + 'px');
          if (document.body) {
            document.body.style.setProperty('background-color', '#1A2A68', 'important');
            document.body.style.setProperty('min-height', Math.max(window.innerHeight || 0, (screen && screen.height) || 0) + 'px', 'important');
          }
        } catch (eP) { /* ignore */ }
      };
      if (document.body) paint(); else document.addEventListener('DOMContentLoaded', paint);
      window.addEventListener('resize', paint);
    } catch (eIa) { /* ignore */ }
  })();
  (function diagByTaps() {
    var taps = [];
    document.addEventListener('click', function (e) {
      try {
        if (!e.target || !e.target.closest || !e.target.closest('#btnHelp')) return;
        var now = Date.now();
        taps = taps.filter(function (t) { return now - t < 2500; });
        taps.push(now);
        if (taps.length >= 5) startDiag();
      } catch (eTp) { /* ignore */ }
    }, true);
  })();
  if (IOS_ANY) {
    window.addEventListener('resize', function () { setTimeout(function () { fillSafariGap(false); }, 150); });
    window.addEventListener('orientationchange', function () { setTimeout(function () { fillSafariGap(true); }, 400); });
    window.addEventListener('load', function () { setTimeout(function () { fillSafariGap(true); }, 300); });
    // v2429 — ACHETER / VENDRE parfois cachés sous la barre de Safari (il fallait fermer la page) : la hauteur
    // de la courbe était calculée une seule fois ; si la barre du haut grandit APRÈS (tuiles « Cadeaux » qui
    // apparaissent, police chargée…), tout descendait. Toutes les 1,5 s (presque rien) : si le haut de la courbe
    // a bougé ou si ACHETER / VENDRE dépassent du bas visible, on refait le calcul.
    var lastChartTop = -1, lastSafFix = 0;
    setTimeout(function () { try { lastChartTop = Math.round($('chart').getBoundingClientRect().top); } catch (eLt) { /* ignore */ } }, 1200);
    setInterval(function () {
      try {
        if (document.hidden) return;
        var html = document.documentElement;
        // Safari ne prévient pas toujours quand sa barre du bas apparaît / disparaît (après une fenêtre fermée,
        // un défilement…) : on revérifie ici « page sous la barre » ; si ça change, on refait la mise en page.
        var wasUnder = html.classList.contains('saf-under');
        authFit();
        if (wasUnder !== html.classList.contains('saf-under')) { lastSafFix = Date.now(); fillSafariGap(true); }
        if (html.classList.contains('fs-trade') || html.classList.contains('is-fullscreen')) return;
        var card = $('chart'), pad = document.querySelector('#screenTrade #tradeWrap > .pad');
        if (!card || !pad || !pad.offsetHeight || window.innerWidth >= 860) return;
        var top = Math.round(card.getBoundingClientRect().top);
        var padBottom = pad.getBoundingClientRect().bottom;
        var vis = window.visualViewport ? window.visualViewport.height + window.visualViewport.offsetTop : window.innerHeight;
        var typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName || '');
        if (typing) return;
        var moved = lastChartTop >= 0 && Math.abs(top - lastChartTop) > 2;
        // Boutons qui dépassent : au plus un recalcul toutes les 8 s (jamais de boucle qui ferait trembler la courbe).
        var hidden = padBottom > vis + 2 && Date.now() - lastSafFix > 8000;
        if (moved || hidden) { lastSafFix = Date.now(); fillSafariGap(true); }
        lastChartTop = Math.round(card.getBoundingClientRect().top);
      } catch (eWt) { /* ignore */ }
    }, 1500);
  }

  // « Aide », le drapeau (et le profil si connecté) prennent exactement la hauteur de « Connexion »
  // (non inscrit) ou de « Recharger » (connecté), selon l'écran.
  function syncTopBtnHeight() {
    try {
      var ref = isGuest() ? $('btnGoLogin') : $('btnOpenDeposit');
      var scr = $('screenTrade');
      if (!ref || !scr) return;
      var h = ref.offsetHeight;
      if (h > 0) scr.style.setProperty('--oro-top-h', h + 'px');
      // Connecté : le bord droit du profil s'aligne sur le bord droit de la case du solde.
      // Le profil rétrécit de ce qui dépasse, la marge droite reprend la même place
      // (« Recharger » garde sa taille).
      scr.style.removeProperty('--oro-prof-w');
      scr.style.removeProperty('--oro-act-mr');
      scr.classList.remove('prof-fit');
      var prof = $('btnProfile');
      var card = $('balanceCard');
      if (!isGuest() && prof && card && prof.offsetWidth > 0 && card.offsetWidth > 0) {
        var over = prof.getBoundingClientRect().right - card.getBoundingClientRect().right;
        if (over > 0.5) {
          var acts = prof.parentNode;
          var mr = acts ? (parseFloat(getComputedStyle(acts).marginRight) || 0) : 0;
          scr.style.setProperty('--oro-prof-w', Math.max(36, prof.offsetWidth - over).toFixed(1) + 'px');
          scr.style.setProperty('--oro-act-mr', (mr + over).toFixed(1) + 'px');
          scr.classList.add('prof-fit');
        }
      }
    } catch (eH) { /* ignore */ }
  }

  function wagerLockFifo(deposits, done) {
    var pool = D6.roundMoney(Number(done) || 0);
    var lock = 0;
    var i;
    for (i = 0; i < deposits.length; i++) {
      var amt = D6.roundMoney(Number(deposits[i]) || 0);
      if (amt <= 0.009) continue;
      var need = D6.roundMoney(amt * 2);
      if (pool + 0.001 >= need) pool = D6.roundMoney(pool - need);
      else { lock = D6.roundMoney(lock + amt); pool = 0; }
    }
    return lock;
  }

  function wagerStatus(u) {
    u = u || user();
    var deposits = Number(u && u.realDepositTotal) || 0;
    var mult = (D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2;
    var required = D6.roundMoney(Math.max(0, deposits) * mult);
    var done = Number(u && (u.totalWageredSinceDeposit != null ? u.totalWageredSinceDeposit : u.realStakeVolume)) || 0;
    if (lastServerWager && Number(lastServerWager.done) > done) done = Number(lastServerWager.done);
    if (u) {
      u.requiredWagering = required;
      u.totalWageredSinceDeposit = done;
    }
    var left = Math.max(0, D6.roundMoney(required - done));
    var pct = required > 0 ? Math.min(100, Math.round((done / required) * 100)) : 100;
    var bal = 0;
    try { bal = realWithdrawBalance(u); } catch (eBal) { bal = Number(u && D6.Store && D6.Store.realBalance ? D6.Store.realBalance(u) : 0) || 0; }
    if (!isFinite(bal) || bal < 0) bal = 0;
    var last = Number(u && u.lastDepositAmount) || 0;
    if (!(last > 0.009) && lastServerWager && Number(lastServerWager.last) > 0.009) {
      last = Number(lastServerWager.last);
    }
    var old = Math.max(0, deposits - last);
    var uncovered = Math.max(0, deposits - (done / 2));
    var slices = (lastServerWager && Array.isArray(lastServerWager.slices) && lastServerWager.slices.length)
      ? lastServerWager.slices
      : null;
    var locked;
    if (required <= 0.009 || done + 0.001 >= required) {
      locked = 0;
    } else if (slices) {
      locked = Math.min(bal, wagerLockFifo(slices, done));
    } else if (last > 0.009 && old > 0.009 && done + 0.001 >= old) {
      var extra = Math.max(0, done - old);
      locked = extra + 0.001 >= last * 2 ? 0 : Math.min(bal, last);
    } else {
      locked = Math.min(bal, uncovered);
    }
    locked = D6.roundMoney(Math.max(0, locked));
    var free = D6.roundMoney(Math.max(0, bal - locked));
    var msg = depositWagerText();
    return {
      ok: left <= 0,
      canWithdraw: free > 0.009,
      required: required,
      done: done,
      left: left,
      pct: pct,
      locked: locked,
      free: free,
      msg: msg
    };
  }

  function depositWagerText() {
    var s = t('wagerBlocked');
    if (!s || s === 'wagerBlocked') {
      s = 'Vous devez miser x2 de votre dépôt avant de pouvoir effectuer un retrait.';
    }
    return s;
  }

  function ensureDepositWagerNote(parent, id) {
    var el = $(id);
    if (el) return el;
    if (!parent) return null;
    el = document.createElement('p');
    el.id = id;
    el.className = 'hint-min deposit-wager-note';
    parent.appendChild(el);
    return el;
  }

  function paintDepositWagerNotes() {
    ['depositWagerNote', 'depositWagerNoteOk', 'depositWagerNoteSuccess'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.textContent = '';
      el.hidden = true;
      el.style.display = 'none';
    });
  }

  function announceDepositWager(forceToast) {
    paintDepositWagerNotes();
    if (forceToast) toast(depositWagerText(), '', 5200);
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
  // Message affiché au joueur : les textes français connus passent dans sa langue.
  function L(m) { return (D6.I18N && D6.I18N.msg) ? D6.I18N.msg(m) : m; }
  function mapAssetId(id) {
    if (id === 'boom300' || id === 'pulseai') return 'titanpulse';
    if (D6.CONFIG && D6.CONFIG.ASSETS && D6.CONFIG.ASSETS[id]) return id;
    return 'v100';
  }
  function assetId(u) { return mapAssetId((u && u.assetId) || 'v100'); }

  function showScreen(name) {
    ['screenAuth', 'screenTrade', 'screenAdmin'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var hide = id !== name;
      el.classList.toggle('hidden', hide);
      if (hide) {
        el.style.setProperty('display', 'none', 'important');
      } else {
        el.style.removeProperty('visibility');
        el.style.removeProperty('pointer-events');
        el.style.setProperty('display', 'flex', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');
      }
    });
    if (name !== 'screenTrade') closeDrawer();
    else {
      setTimeout(syncTopBtnHeight, 50);
      setTimeout(function () { fillSafariGap(true); }, 300);
    }
    metaPageView(name);
  }

  // Sous la barre de solde (~75px), jamais collé en haut du header.
  function placeToast(el) {
    var top = 75;
    var trade = document.getElementById('screenTrade');
    if (trade && !trade.classList.contains('hidden')) {
      var mark = document.getElementById('balanceCard') || document.querySelector('.topbar');
      if (mark) {
        var r = mark.getBoundingClientRect();
        if (r.bottom > 40) top = Math.round(r.bottom) + 10;
      }
    }
    el.style.setProperty('top', Math.max(70, Math.min(top, 220)) + 'px', 'important');
  }

  function isSilentTradeMsg(msg) {
    var s = String(msg || '');
    return /anti-bot|slow down|ralentissez|limite atteinte|trades max/i.test(s);
  }

  var bannedKickLock = false;
  function isBannedPayload(r) {
    return !!(r && (r.banned || r.kind === 'suspended' || r.kind === 'deleted'));
  }
  function hardLogout(msg) {
    if (bannedKickLock) return;
    bannedKickLock = true;
    if (msg) toast(msg, 'err', 10000);
    try { if (D6.Chart && D6.Chart.stop) D6.Chart.stop(); } catch (eStop) { /* ignore */ }
    Promise.resolve()
      .then(function () {
        if (D6.Auth && D6.Auth.logout) return D6.Auth.logout();
        if (D6.Supabase && D6.Supabase.signOut) return D6.Supabase.signOut();
      })
      .catch(function () { /* ignore */ })
      .then(function () {
        try { ensureGuest(); enterApp(); } catch (eEnt) { /* ignore */ }
        bannedKickLock = false;
      });
  }
  function watchBan(r) {
    if (!isBannedPayload(r)) return false;
    hardLogout(r.reason || 'Votre compte a été suspendu pour non-respect des règles d’utilisation. Si vous pensez qu’il s’agit d’une erreur, contactez le support Orolado.');
    return true;
  }
  // Session vraiment expirée : on revérifie une fois, puis écran de connexion
  // avec un message doux (au plus une fois par minute, jamais pour un invité).
  var sessionCheckBusy = false;
  var sessionPromptAt = 0;
  document.addEventListener('orolado-session-expired', function () {
    var u = user();
    if (!u || isGuest(u) || sessionCheckBusy || bannedKickLock) return;
    if (Date.now() - sessionPromptAt < 60000) return;
    var tokAtFail = D6.Api && D6.Api.token ? D6.Api.token() : '';
    if (!tokAtFail) return;
    sessionCheckBusy = true;
    setTimeout(function () {
      D6.Api.post('me', {}).then(function (r) {
        if (watchBan(r)) return;
        if (r && r.ok) return;
        if (!r || !r.sessionExpired) return;
        if (D6.Api.token() !== tokAtFail) return;
        sessionPromptAt = Date.now();
        Promise.resolve(D6.Auth && D6.Auth.logout ? D6.Auth.logout() : null)
          .catch(function () { /* ignore */ })
          .then(function () {
            try { ensureGuest(); enterApp(); } catch (eEnt) { /* ignore */ }
            showAuthScreen('login');
            toast(t('sessionExpiredMsg'), 'info', 6000);
          });
      }).catch(function () { /* ignore */ }).then(function () { sessionCheckBusy = false; });
    }, 1500);
  });
  var banWatchTimer = 0;
  var screenWakeLock = null;
  function adoptWagerBook(remote) {
    var u = user();
    if (!u || !remote) return;
    var ru = remote.user || {};
    var w = remote.wager;
    if (w && typeof w === 'object') {
      lastServerWager = {
        free: Number(w.free),
        locked: Number(w.locked),
        done: Number(w.done),
        required: Number(w.required),
        last: Number(w.last),
        slices: Array.isArray(w.slices) ? w.slices.map(function (n) { return Number(n) || 0; }).filter(function (n) { return n > 0.009; }) : [],
        at: Date.now()
      };
    }
    var changed = false;
    var remLast = Number(ru.lastDepositAmount || (w && w.last) || 0);
    if (remLast > 0.009 && remLast >= (Number(u.lastDepositAmount) || 0)) {
      u.lastDepositAmount = remLast;
      changed = true;
    }
    var remDep = Number(ru.realDepositTotal) || 0;
    if (remDep > (Number(u.realDepositTotal) || 0) + 0.009) {
      u.realDepositTotal = remDep;
      changed = true;
    }
    var remStake = Number(ru.realStakeVolume) || 0;
    if (remStake > (Number(u.realStakeVolume) || 0) + 0.009) {
      u.realStakeVolume = remStake;
      u.totalWageredSinceDeposit = Number(ru.totalWageredSinceDeposit != null ? ru.totalWageredSinceDeposit : remStake);
      changed = true;
    }
    if (changed) D6.Store.saveUser(u);
  }
  function applyQuietVault(remote) {
    if (!remote || !remote.ok || !remote.vault || !user()) return;
    var incoming = Number(remote.vault.real);
    if (D6.correctStakeReserve) incoming = D6.correctStakeReserve(incoming);
    var local = D6.Store.realBalance ? Number(D6.Store.realBalance(user())) : 0;
    var incomingDep = Number(remote.user && remote.user.realDepositTotal) || 0;
    var localDep = Number(user().realDepositTotal) || 0;
    var remoteHigher = isFinite(incoming) && incoming > local + 0.009;
    if (incomingDep > localDep + 0.009) {
      D6.holdDepositReal = true;
      setTimeout(function () { D6.holdDepositReal = false; }, 25000);
    }
    var open = openRealStake();
    if (remoteHigher && open > 0 && incoming > local + open + 0.009) {
      D6.holdDepositReal = true;
      setTimeout(function () { D6.holdDepositReal = false; }, 25000);
    }
    // Trade ouvert (confirmé ou non) : jamais écraser avec me/poll.
    if (open > 0.009 || openLiveRealStake() > 0.009) return;
    if (tradeBalanceFrozen() && !D6.holdDepositReal) return;
    // Hausse sans dépôt réel (holdDepositReal) = me() périmé, surtout mobile — ignorer.
    if (remoteHigher && !D6.holdDepositReal) return;
    var locks = getBalanceLocks();
    var fixingDouble = D6.stakeReserve && Date.now() < D6.stakeReserve.until && Math.abs(incoming - D6.stakeReserve.once) <= 0.05;
    if (locks && Date.now() < locks.until && !remoteHigher && !fixingDouble && !D6.holdDepositReal) return;
    if (!isFinite(incoming) || incoming < 0) return;
    if (incoming <= 0.009 && local > 0.009 && !D6.holdDepositReal) return;
    if (Math.abs(incoming - local) <= 0.009) return;
    if (adoptOfficialVault(remote.vault, { fromMe: true, allowRaise: !!D6.holdDepositReal, force: !!D6.holdDepositReal })) updateBalance(false);
  }
  function holdScreenAwake() {
    if (!navigator.wakeLock || !navigator.wakeLock.request) return;
    if (document.hidden) return;
    navigator.wakeLock.request('screen').then(function (lock) {
      screenWakeLock = lock;
      lock.addEventListener('release', function () { screenWakeLock = null; });
    }).catch(function () { /* ignore */ });
  }
  function resumeAfterSleep() {
    try { if (window.oroPurgeDeadOverlays) window.oroPurgeDeadOverlays(); } catch (e0) { /* ignore */ }
    try { unlockPointerLayers(); } catch (e1) { /* ignore */ }
    holdScreenAwake();
    var u = user();
    if (u && D6.Engine.flushSettlements) {
      try { D6.Engine.flushSettlements(u); } catch (eF) { /* ignore */ }
    }
    // Mobile : visibilitychange tire me() au réveil — ne pas le faire pendant un trade
    // (sinon solde périmé plus haut = faux « retour » de mise).
    if (!tradeBalanceFrozen()) refreshRemoteVault();
    checkDepositReturn();
    try { if (D6.Chart && D6.Chart.resize) D6.Chart.resize(); } catch (e2) { /* ignore */ }
  }
  var oxaRecheckAt = 0;
  function startBanWatch() {
    if (banWatchTimer) return;
    function pollMe() {
      if (document.hidden) return;
      var u = user();
      if (!u || (typeof isGuest === 'function' && isGuest(u))) return;
      if (!(D6.Api && D6.Api.token && D6.Api.token())) return;
      // Dépôts crypto : le serveur redemande à OxaPay (au plus toutes les 2 min) ; un dépôt
      // rattrapé arrive ensuite par me() comme d'habitude.
      if (Date.now() - oxaRecheckAt > 120000) {
        oxaRecheckAt = Date.now();
        D6.Api.post('oxapayRecheck', {}, 30000).catch(function () { /* ignore */ });
      }
      D6.Api.post('me', {}).then(function (r) {
        if (watchBan(r)) return;
        adoptWagerBook(r);
        applyQuietVault(r);
        mirrorOtherDeviceTrades(r);
        // v2343 : démo rechargée par le serveur (solde sous 1 000 $, une fois par 24 h).
        if (r && r.ok && r.demoRefilled && r.vault && r.vault.demo != null && D6.Store.setBalanceMode) {
          D6.Store.setBalanceMode(u, 'demo', Number(r.vault.demo));
          updateBalance(false);
          toast(t('demoRefilled'), 'ok', 3500);
        }
        if (r && r.ok && r.vault && r.vault.real != null) {
          var incomingDep = Number(r.user && r.user.realDepositTotal) || 0;
          var localDep = Number(u.realDepositTotal) || 0;
          if (incomingDep > localDep + 0.009) {
            recvFresh = {};
            applyOfficialReal(Number(r.vault.real), { fromMe: true, allowRaise: true, force: true });
            updateBalance(false);
          }
        }
      }).catch(function () { /* ignore */ });
    }
    banWatchTimer = setInterval(pollMe, 8000);
    // Trades réels lancés depuis un autre appareil : vérification légère toutes les 3 s,
    // seulement en compte réel et page à l'écran (le serveur reste tranquille).
    var openBusy = false;
    setInterval(function () {
      if (document.hidden || openBusy) return;
      var u = user();
      if (!u || isGuest(u) || u.mode !== 'real') return;
      if (!(D6.Api && D6.Api.token && D6.Api.token())) return;
      openBusy = true;
      D6.Api.post('openTrades', {}, 6000).then(function (r) {
        openBusy = false;
        mirrorOtherDeviceTrades(r);
      }, function () { openBusy = false; });
    }, 3000);
    holdScreenAwake();
  }

  function toast(msg, kind, ms) {
    if (isSilentTradeMsg(msg)) return;
    // v2326 : texte court sur une ligne quand il existe (notifications par-dessus l'écran)
    var shortTxt = null;
    try { shortTxt = D6.I18N && D6.I18N.short ? D6.I18N.short(msg) : null; } catch (eSh) { shortTxt = null; }
    msg = shortTxt || L(msg);
    var el = $('toast');
    if (!el) return;
    var micro = kind === 'micro';
    var tone = micro ? 'micro' : (kind === 'err' || kind === 'ok' || kind === 'tie' ? kind : 'info');
    var isBal = false;
    try {
      isBal = String(msg || '') === String(t('insufficient') || '') || /solde insuffisant|insufficient balance/i.test(String(msg || ''));
    } catch (eBal) { isBal = /solde insuffisant|insufficient balance/i.test(String(msg || '')); }
    // Démo : jamais de « Solde insuffisant » (argent illimité, le joueur rejoue simplement).
    if (isBal) {
      var uBal = null;
      try { uBal = user(); } catch (eU) { uBal = null; }
      if (!uBal || uBal.mode !== 'real') return;
    }
    if (isBal) {
      el.style.setProperty('top', 'calc(14px + env(safe-area-inset-top, 0px))', 'important');
    } else if (micro) el.style.removeProperty('top');
    else {
      placeToast(el);
      requestAnimationFrame(function () { placeToast(el); });
    }
    clearTimeout(toastTimer);
    if (micro) {
      el.className = 'toast lux-msg micro show';
      el.textContent = msg;
      toastTimer = setTimeout(function () { el.className = 'toast lux-msg micro'; }, ms || 1800);
      return;
    }
    el.className = 'toast lux-msg show ' + tone + (isBal ? ' toast-bal' : '');
    el.innerHTML = '<span class="lux-msg-ico" aria-hidden="true"></span><span class="lux-msg-txt"></span>';
    var txt = el.querySelector('.lux-msg-txt');
    if (txt) txt.textContent = msg;
    toastTimer = setTimeout(function () { el.className = 'toast lux-msg ' + tone + (isBal ? ' toast-bal' : ''); }, isBal ? Math.max(ms || 0, 4200) : (ms || 3000));
  }

  function guardLiveTradeView() {
    return true;
  }

  function fmtOutcomeUsd(n) {
    var signed = D6.roundMoney(Number(n) || 0);
    if (!isFinite(signed)) signed = 0;
    var v = Math.abs(signed);
    var cents = Math.round((v - Math.floor(v)) * 100);
    var grouped = Math.floor(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    var body = cents ? (grouped + '.' + (cents < 10 ? '0' : '') + cents) : grouped;
    return (signed < 0 ? '-' : '+') + '$\u00a0\u00a0' + body;
  }

  function resultKind(h) {
    if (!h) return 'lose';
    if (h.voided === true || h.status === 'void') return 'void';
    var st = String(h.status || '').toLowerCase();
    if (st === 'won' || st === 'win') return 'win';
    if (st === 'lost' || st === 'lose' || st === 'loss') return 'lose';
    var flag = h.won;
    if (flag == null && h.isWin != null) flag = h.isWin;
    if (flag === true || flag === 1 || flag === '1' || flag === 'true' || flag === 'won' || flag === 'win') return 'win';
    if (flag === false || flag === 0 || flag === '0' || flag === 'false' || flag === 'lost' || flag === 'lose' || flag === 'loss') return 'lose';
    if (h.net != null && Number(h.net) > 0.009) return 'win';
    return 'lose';
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
    if (!isFinite(amount)) amount = 0;
    el.className = 'chart-outcome show ' + (isWin ? 'win' : 'lose');
    var slot = outcomeSlot % 8;
    outcomeSlot += 1;
    var dy = IS_ANDROID ? 0 : (slot % 4) * 14;
    var dx = IS_ANDROID ? 0 : (slot % 2 === 0 ? -10 : 10);
    el.style.setProperty('--ox', dx + 'px');
    el.style.setProperty('--oy', dy + 'px');
    if (isWin) {
      el.innerHTML = '<svg class="outcome-wallet" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M3 10h18"/><circle cx="16.2" cy="14.2" r="1.2" fill="currentColor"/></svg><span>' + fmtOutcomeUsd(amount) + '</span>';
    } else {
      el.textContent = '+$\u00a0\u00a00';
    }
    clearTimeout(outcomeToastTimer);
    outcomeToastTimer = setTimeout(function () {
      el.className = 'chart-outcome';
      el.textContent = '';
      el.style.removeProperty('--ox');
      el.style.removeProperty('--oy');
    }, IS_ANDROID ? 700 : 900);
  }

  document.addEventListener('orolado-trade-settled', function (ev) {
    var d = (ev && ev.detail) || {};
    var kind = resultKind(d);
    if (kind === 'void') {
      updateBalance(true);
      patchHistorySoon();
      syncTradeButtons();
      return;
    }
    var amount = kind === 'win'
      ? Math.abs(Number(d.payout != null ? d.payout : d.net) || 0)
      : 0;
    showOutcomeToast(kind === 'win', amount, d.tradeId);
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
    if (el) { el.textContent = L(msg); el.classList.add('on'); }
    else toast(msg, 'err');
  }

  function otpFailText() {
    return t('codeExpired');
  }

  function cooldownSeconds(res) {
    if (!res) return 0;
    var n = parseInt(res.retryIn, 10);
    if (n > 0) return n;
    var m = String(res.reason || '').match(/(\d+)\s*s/i);
    return m ? parseInt(m[1], 10) : 0;
  }

  function isWaitReason(msg) {
    return /^\s*(Wait|Patientez)\b/i.test(String(msg || '')) || /avant de renvoyer/i.test(String(msg || ''));
  }

  function setResendWait(btn, waiting) {
    if (!btn) return;
    btn.classList.toggle('is-waiting', !!waiting);
    btn.disabled = !!waiting;
    btn.setAttribute('aria-disabled', waiting ? 'true' : 'false');
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

  // —— Sons et vibrations « pro » : doux, courts, jamais agressifs. ——
  // Tout passe par un compresseur léger pour un volume régulier sur tous les téléphones.
  var sfxBus = null;
  function sfxOut(ctx) {
    if (sfxBus && sfxBus.context === ctx) return sfxBus;
    try {
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-18, ctx.currentTime);
      comp.ratio.setValueAtTime(4, ctx.currentTime);
      var master = ctx.createGain();
      master.gain.setValueAtTime(0.9, ctx.currentTime);
      master.connect(comp);
      comp.connect(ctx.destination);
      sfxBus = master;
    } catch (eBus) { sfxBus = ctx.destination; }
    return sfxBus;
  }
  // Une note douce : attaque rapide, extinction naturelle.
  function sfxTone(ctx, freq, start, dur, vol, type, endFreq) {
    var now = ctx.currentTime + start;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + Math.min(0.012, dur / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(sfxOut(ctx));
    osc.start(now);
    osc.stop(now + dur + 0.03);
  }
  // Vibration discrète (Android ; l'iPhone ne permet pas la vibration depuis un site web).
  function haptic(pattern) {
    if (!soundOn()) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (eVib) { /* ignore */ }
  }

  // Feu du bas : sa hauteur suit la ligne « PAYOUT » (les flammes montent jusqu'à elle),
  // quelle que soit la taille du téléphone.
  function fitFire() {
    try {
      var fb = $('fireBed');
      var lbl = document.querySelector('#screenTrade .odds-label');
      if (!fb || !lbl || window.innerWidth >= 860) return;
      var r = lbl.getBoundingClientRect();
      if (!(r.height > 0)) return;
      // Les flammes montent un peu au-dessus du titre PAYOUT (elles « inondent » les choix de gain).
      var h = Math.round(window.innerHeight - (r.top - 10));
      if (h > 60 && h < 420) fb.style.height = h + 'px';
    } catch (eFire) { /* ignore */ }
  }
  window.addEventListener('resize', fitFire);
  window.addEventListener('orientationchange', function () { setTimeout(fitFire, 300); });
  setTimeout(fitFire, 400);
  setInterval(fitFire, 3000);

  var lastTapAt = 0;
  // Petit « clic » feutré pour les boutons.
  function playTap() {
    if (!soundOn()) return;
    var tnow = Date.now();
    if (tnow - lastTapAt < 120) return;
    lastTapAt = tnow;
    haptic(8);
    var ctx = getAudio();
    if (!ctx) return;
    try {
      sfxTone(ctx, 1320, 0, 0.035, 0.05, 'sine', 980);
    } catch (e) { /* ignore */ }
  }

  // Trade lancé : double note montante, courte et nette (confirmation).
  function playTradeOpen() {
    if (!soundOn()) return;
    haptic(18);
    var ctx = getAudio();
    if (!ctx) return;
    try {
      sfxTone(ctx, 740, 0, 0.09, 0.07, 'sine');
      sfxTone(ctx, 988, 0.06, 0.12, 0.06, 'sine');
    } catch (e) { /* ignore */ }
  }

  // Trade gagné : petit carillon chaleureux (accord majeur arpégé).
  function playWinChime() {
    if (!soundOn()) return;
    haptic([22, 50, 22]);
    var ctx = getAudio();
    if (!ctx) return;
    try {
      sfxTone(ctx, 1046.5, 0, 0.5, 0.075, 'sine');
      sfxTone(ctx, 1318.5, 0.07, 0.5, 0.06, 'sine');
      sfxTone(ctx, 1568, 0.14, 0.65, 0.055, 'sine');
      sfxTone(ctx, 2093, 0.14, 0.4, 0.012, 'triangle');
    } catch (e) { /* ignore */ }
  }

  // Trade perdu : note grave et douce, qui descend un peu (pas de son agressif).
  function playLossThud() {
    if (!soundOn()) return;
    haptic(30);
    var ctx = getAudio();
    if (!ctx) return;
    try {
      sfxTone(ctx, 294, 0, 0.26, 0.07, 'sine', 220);
      sfxTone(ctx, 147, 0, 0.3, 0.05, 'sine', 120);
    } catch (e) { /* ignore */ }
  }

  // Égalité : une seule note neutre.
  function playNeutralTick() {
    if (!soundOn()) return;
    haptic(12);
    var ctx = getAudio();
    if (!ctx) return;
    try { sfxTone(ctx, 660, 0, 0.22, 0.05, 'sine'); } catch (e) { /* ignore */ }
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
    var w = Math.min(280, Math.max(240, window.innerWidth - 16));
    var left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
    var top = r.bottom + 6;
    var mh = Math.min(320, window.innerHeight - 16);
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    menu.style.position = 'fixed';
    menu.style.top = top + 'px';
    // Accroché par son bord DROIT sous le drapeau (quelle que soit sa largeur réelle) : avant, il
    // apparaissait décalé sous « Connexion » / « Recharger ».
    void left;
    if (r.left + r.width / 2 < window.innerWidth / 2) {
      // Drapeau à GAUCHE de l'écran (arabe, de droite à gauche) : menu accroché par son bord gauche.
      menu.style.right = 'auto';
      menu.style.left = Math.max(8, Math.round(r.left)) + 'px';
    } else {
      menu.style.left = 'auto';
      menu.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
    }
    menu.style.width = w + 'px';
    menu.style.maxHeight = 'none';
    menu.style.overflow = 'hidden';
    menu.style.zIndex = '9999';
  }

  function closeLangMenus() {
    document.querySelectorAll('.lang-dd-menu').forEach(function (m) { m.classList.add('hidden'); });
    document.querySelectorAll('[data-lang-toggle]').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
    });
  }

  // Drapeaux dessinés (Windows n'affiche pas les drapeaux « emoji » : il écrivait « FR » à la place).
  // Même dessin partout : PC, TV, iPhone, Android.
  var FLAG_SVG = (function () {
    var h = function (inner) { return '<svg class="flag-svg" viewBox="0 0 30 20" aria-hidden="true">' + inner + '</svg>'; };
    var bands = function (dir, cols) {
      var n = cols.length, out = '', i;
      for (i = 0; i < n; i++) {
        out += dir === 'v'
          ? '<rect x="' + (30 / n * i) + '" y="0" width="' + (30 / n + 0.2) + '" height="20" fill="' + cols[i] + '"/>'
          : '<rect x="0" y="' + (20 / n * i) + '" width="30" height="' + (20 / n + 0.2) + '" fill="' + cols[i] + '"/>';
      }
      return out;
    };
    var star = function (cx, cy, r, col) {
      var p = [], k;
      for (k = 0; k < 10; k++) {
        var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.42 : r;
        p.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2));
      }
      return '<polygon points="' + p.join(' ') + '" fill="' + col + '"/>';
    };
    return {
      en: h('<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" stroke-width="1.6"/><path d="M15 0V20M0 10H30" stroke="#fff" stroke-width="6"/><path d="M15 0V20M0 10H30" stroke="#C8102E" stroke-width="3.4"/>'),
      fr: h(bands('v', ['#002395', '#fff', '#ED2939'])),
      es: h('<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>'),
      pt: h('<rect width="30" height="20" fill="#009C3B"/><polygon points="15,2.5 27,10 15,17.5 3,10" fill="#FFDF00"/><circle cx="15" cy="10" r="4.3" fill="#002776"/><path d="M10.9 9.2q4.1-1.3 8.2.9" stroke="#fff" stroke-width=".8" fill="none"/>'),
      ar: h('<rect width="30" height="20" fill="#006C35"/><path d="M8 8.2h14" stroke="#fff" stroke-width="1.4" stroke-dasharray="2 .8"/><path d="M8.5 13h12.5l1.5-1" stroke="#fff" stroke-width="1" fill="none"/>'),
      tr: h('<rect width="30" height="20" fill="#E30A17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.3" cy="10" r="4" fill="#E30A17"/>' + star(18.2, 10, 2.6, '#fff')),
      vi: h('<rect width="30" height="20" fill="#DA251D"/>' + star(15, 10.4, 6, '#FFFF00')),
      id: h(bands('h', ['#CE1126', '#fff'])),
      ru: h(bands('h', ['#fff', '#0039A6', '#D52B1E'])),
      de: h(bands('h', ['#000', '#DD0000', '#FFCE00'])),
      hi: h(bands('h', ['#FF9933', '#fff', '#138808']) + '<circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width=".7"/><circle cx="15" cy="10" r=".6" fill="#000080"/>')
    };
  })();
  function flagOf(l) { return (l && FLAG_SVG[l.code]) || (l && l.flag) || ''; }

  function fillLangBars() {
    document.querySelectorAll('body > .lang-dd-menu').forEach(function (m) { m.remove(); });
    function render(boxId) {
      var box = $(boxId);
      if (!box) return;
      var curCode = 'en';
      try { curCode = (D6.I18N && D6.I18N.lang) || 'en'; } catch (eLangCur) { curCode = 'en'; }
      var cur = LANGS.filter(function (l) { return l.code === curCode; })[0] || LANGS[0];
      box.innerHTML = '<button type="button" class="lang-dd-btn" data-lang-toggle="1" aria-haspopup="listbox" aria-expanded="false"><span class="lang-flag">' + flagOf(cur) + '</span><span class="lang-chev">▾</span><span class="lang-code">' + String(cur.code || '').toUpperCase() + '</span></button>' +
        '<div class="lang-dd-menu hidden" role="listbox" data-owner="' + boxId + '">' + LANGS.map(function (l) {
          return '<button type="button" class="lang-btn' + (l.code === D6.I18N.lang ? ' on' : '') + '" data-lang="' + l.code + '" role="option">' +
            '<span class="lang-flag">' + flagOf(l) + '</span><span class="lang-name">' + (l.name || l.code) + '</span></button>';
        }).join('') + '</div>';
    }
    render('langBarAuth');
    render('langBarTrade');
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeDrawer();
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
        try { D6.I18N.apply(); } catch (eApply) { /* ignore */ }
        var u = user();
        if (u) {
          setModeUi(u);
          updateBalance(false);
          updatePayoutUi();
          renderHistory();
          fillProfile();
        }
        if ($('screenAdmin') && !$('screenAdmin').classList.contains('hidden')) renderAdmin();
      });
    });
  }

  document.addEventListener('orolado-i18n', function () {
    try { fillLangBars(); } catch (eLang) { /* ignore */ }
    try { paintDepositLabel(); } catch (eDep) { /* ignore */ }
    var u = user();
    if (u) {
      try { setModeUi(u); } catch (eMode) { /* ignore */ }
      try { updatePayoutUi(); } catch (e0) { /* ignore */ }
      try { fillProfile(); } catch (eProf) { /* ignore */ }
    }
    try { applyAndroidTradeHint(); } catch (eHint) { /* ignore */ }
    try { refreshCryptoI18n(); } catch (eCrypto) { /* ignore */ }
    try { updateWithdrawMinHint(); } catch (eWd) { /* ignore */ }
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
    u.mode = next === 'real' ? 'real' : 'demo';
    D6.Store.saveUser(u);
    try { localStorage.setItem('oro_last_mode', u.mode); } catch (eMode) { /* ignore */ }
    stake = D6.CONFIG.MIN_STAKE || 1;
    if ($('inputStake')) $('inputStake').value = stake;
    lastPaintedBalance = null;
    lastPaintedMode = null;
    setModeUi(u);
    updateBalance(true);
    updatePayoutUi();
    renderHistory();
    syncTradeButtons();
    if (D6.Chart && D6.Chart.syncAccountMode) {
      try { D6.Chart.syncAccountMode(); } catch (eChartMode) { /* ignore */ }
    }
    if (next === 'real') refreshRemoteVault();
  }

  function updateBalance(flash) {
    var u = user();
    if (!u) return;
    var isReal = u.mode === 'real';
    var demo = Number(D6.Store.demoBalance(u));
    var real = Number(D6.Store.realBalance ? D6.Store.realBalance(u) : 0);
    if (!isFinite(demo)) demo = 0;
    // Démo vide (ex. juste après l'inscription) : rechargée toute seule à 1 000 000 $, sans attendre
    // que le joueur appuie sur « + ». Jamais pendant un trade démo ouvert.
    if (!isGuest(u) && demo < (D6.CONFIG.MIN_STAKE || 1) && !(D6.Engine && D6.Engine.liveCount && D6.Engine.liveCount())) {
      var demoTarget = D6.CONFIG.DEMO_START || 1000000;
      try { D6.Store.setBalanceMode(u, 'demo', demoTarget); demo = demoTarget; } catch (eDemo) { /* ignore */ }
    }
    if (!isFinite(real)) real = 0;
    try { localStorage.setItem('oro_last_mode', isReal ? 'real' : 'demo'); } catch (eMode) { /* ignore */ }
    if (isReal) lastOfficialReal = real;
    else lastOfficialDemo = demo;
    // Réel : store = vérité serveur ; soustraire SEULEMENT les mises pas encore confirmées.
    // applyOfficialReal puis markTradeFunded puis 1 seul paint → pas de yo-yo.
    var active = isReal ? Math.max(0, real - openStakeSum('real')) : demo;
    // Réserve de mise : ne JAMAIS réafficher plus haut (évite 9 → 10 fantôme sur compte réel).
    if (isReal && D6.stakeReserve && Date.now() < D6.stakeReserve.until) {
      var onceShow = Number(D6.stakeReserve.once);
      if (isFinite(onceShow) && onceShow >= 0) active = Math.min(active, onceShow);
    }
    var modeKey = isReal ? 'real' : 'demo';
    if (lastPaintedMode && lastPaintedMode !== modeKey) lastPaintedBalance = null;
    lastPaintedMode = modeKey;
    paintBalanceNow(active, !!flash);
    if ($('profWalletBal')) {
      $('profWalletBal').textContent = D6.fmtMoney(isReal ? active : real);
    }
    if ($('balanceAlt')) {
      $('balanceAlt').textContent = '';
      $('balanceAlt').hidden = true;
    }
    setModeChrome(u);
  }

  function payoutPctOf(odds) {
    var n = Number(odds);
    var map = (D6.CONFIG && D6.CONFIG.PAYOUT_PCT) || { '1.9': 90, '5': 500, '10': 1000, '50': 5000 };
    if (n === 90) return 90;
    if (n === 88) return 88;
    if (n === 500) return 500;
    if (n === 1000) return 1000;
    if (n === 5000) return 5000;
    if (Math.abs(n - 1.9) < 0.005) return Number(map['1.9']) || 90;
    if (Math.abs(n - 1.88) < 0.005) return Number(map['1.88']) || 88;
    if (Math.abs(n - 5) < 0.02) return Number(map['5']) || 500;
    if (Math.abs(n - 10) < 0.02) return Number(map['10']) || 1000;
    if (n >= 40) return Number(map['50']) || 5000;
    if (map[String(n)] != null) return Number(map[String(n)]);
    return 90;
  }

  // Jeu équitable : le gain affiché est le gain payé (88 % partout), jamais un chiffre au hasard.
  function assetPayoutPct(assetId, basePct) {
    return basePct;
  }

  // Plein écran : l'estimation est posée en bas, DANS le cadre de la mise (jamais sur sa bordure),
  // et le « $ » au même niveau que le montant, quelle que soit la hauteur de la case sur le téléphone.
  function placeFsStakeWin() {
    var w = $('fsStakeWin');
    var inp = $('inputStake');
    if (!w || !inp || !fsTradeActive) return;
    var h = inp.offsetHeight;
    if (!h) return;
    var wh = w.offsetHeight || 12;
    var field = inp.parentNode;
    if (!field || !field.style) return;
    field.style.setProperty('--fs-win-top', Math.max(0, inp.offsetTop + h - wh - 4) + 'px');
    var pb = parseFloat(getComputedStyle(inp).paddingBottom) || 0;
    field.style.setProperty('--fs-dollar-top', Math.round(inp.offsetTop + (h - pb) / 2) + 'px');
  }

  function updatePayoutUi() {
    if (!document.querySelector('.asset-chip .payout-live')) return;
    var odds = currentOdds(user());
    var pct = payoutPctOf(odds);
    document.querySelectorAll('.asset-chip').forEach(function (chip) {
      var el = chip.querySelector('.payout-live');
      if (!el) return;
      el.textContent = '+' + assetPayoutPct(chip.getAttribute('data-asset'), pct) + '%';
    });
    var stakeEl = $('inputStake');
    // Mise à 0 (ou vide) : gain affiché 0 $ (avant : il montrait le gain d'une mise de 1 $).
    var stakeRaw = D6.roundMoney(Number(stakeEl && stakeEl.value) || 0);
    var stake = stakeRaw > 0 ? Math.max(D6.CONFIG.MIN_STAKE, stakeRaw) : 0;
    // Comme les grandes plateformes : le carré montre le TOTAL reçu si on gagne,
    // exactement ce que le serveur crédite (mise × cote, cf. orolado_fair_credit).
    var totalWin = D6.roundMoney(stake * (Number(odds) || 1.9));
    if ($('previewGain')) {
      $('previewGain').textContent = D6.fmtFCFA(totalWin);
      fitGainText($('previewGain'));
    }
    fitStakeText(stakeEl);
    // Plein écran : estimation du total reçu, en petit sous la mise.
    if ($('fsStakeWin')) {
      var fsWinTxt = '≈ ' + D6.fmtFCFA(totalWin);
      $('fsStakeWin').textContent = fsWinTxt;
      // Très gros montants : texte un peu plus petit pour rester dans la case.
      placeFsStakeWin();
      fitGainText($('fsStakeWin'));
    }
    if ($('previewMult')) $('previewMult').textContent = t('payoutPreview').replace('{pct}', String(pct));
    document.querySelectorAll('.odds-chip').forEach(function (btn) {
      btn.classList.toggle('on', Math.abs(Number(btn.dataset.odds) - odds) < 0.001);
    });
  }

  function normalizePayoutMult(raw) {
    var list = (D6.CONFIG && D6.CONFIG.ODDS_MULT) || [1.9, 5, 10, 50];
    var n = Number(raw);
    // Ancien choix enregistré (88 % / ×1,88) : devient le payout de base actuel (90 %).
    if (n === 88 || n === 90 || Math.abs(n - 1.88) < 0.001) n = 1.9;
    else if (n === 500) n = 5;
    else if (n === 1000) n = 10;
    else if (n === 5000) n = 50;
    var i;
    for (i = 0; i < list.length; i++) {
      if (Math.abs(list[i] - n) < 0.001) return list[i];
    }
    return list[0];
  }

  function currentOdds(u) {
    u = u || user();
    if (selectedOddsLive) return normalizePayoutMult(selectedOddsLive);
    if (u && u.odds != null) return normalizePayoutMult(u.odds);
    var on = document.querySelector('.odds-chip.on');
    if (on && on.dataset.odds != null) return normalizePayoutMult(on.dataset.odds);
    return normalizePayoutMult((D6.CONFIG && D6.CONFIG.DEFAULT_ODDS) || 1.9);
  }

  function setOdds(mult) {
    var u = user();
    var ok = normalizePayoutMult(mult);
    selectedOddsLive = ok;
    if (u) {
      u.odds = ok;
      D6.Store.saveUser(u);
    }
    updatePayoutUi();
  }

  function scrollAssetChipIntoView(id) {
    var chip = document.querySelector('.asset-chip[data-asset="' + id + '"]');
    var bar = $('assetBar');
    if (!chip || !bar) return;
    try {
      var mid = chip.offsetLeft - (bar.clientWidth / 2) + (chip.offsetWidth / 2);
      if (typeof bar.scrollTo === 'function') bar.scrollTo({ left: Math.max(0, mid), behavior: 'smooth' });
      else bar.scrollLeft = Math.max(0, mid);
    } catch (e) {
      try { chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e2) { /* ignore */ }
    }
  }

  // v2368 (demande du propriétaire) : on retient sur ce téléphone le marché regardé et l'heure.
  // À la connexion / inscription / déconnexion / réouverture, on revient sur ce marché s'il date
  // de moins de 30 min ; sinon (ou si rien n'est retenu) : VOLATILITY.
  var VIEW_KEY = 'oro_view_asset', VIEW_TTL = 30 * 60 * 1000;
  function rememberView(id) {
    try { localStorage.setItem(VIEW_KEY, JSON.stringify({ id: id, at: Date.now() })); } catch (e) { /* ignore */ }
  }
  function recentView() {
    try {
      var o = JSON.parse(localStorage.getItem(VIEW_KEY) || 'null');
      if (o && o.id && Date.now() - Number(o.at) < VIEW_TTL) {
        var id = mapAssetId(o.id);
        if (D6.CONFIG.ASSETS[id]) return id;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function selectAsset(rawId) {
    var id = mapAssetId(rawId);
    selectedAsset = id;
    rememberView(id);
    var u = user();
    if (u) {
      u.assetId = id;
      D6.Store.saveUser(u);
    }
    document.querySelectorAll('.asset-chip').forEach(function (el) {
      el.classList.toggle('on', el.dataset.asset === id);
    });
    var asset = D6.CONFIG.ASSETS[id];
    if (asset) {
      if ($('assetLiveName')) $('assetLiveName').textContent = asset.name;
      if ($('assetLiveTag')) $('assetLiveTag').textContent = asset.tag;
    }
    if (D6.Engine && D6.Engine.getMarket) D6.Engine.getMarket(id);
    D6.Chart.setAsset(id);
    updatePayoutUi();
    scrollAssetChipIntoView(id);
    return id;
  }

  function updateAssetUi() {
    var u = user();
    if (!u) return;
    selectAsset(recentView() || 'v100');
  }

  // Durée : à chaque ouverture / actualisation du site (et à chaque nouvelle connexion), on repart sur 5 s.
  // Le joueur peut choisir une autre durée, mais elle n'est plus gardée après une actualisation
  // (un « 10 min » oublié surprenait les joueurs).
  var durResetFor = null;
  // Gain prévu : le montant rétrécit tout seul pour toujours tenir dans son carré (même 40 millions).
  function fitGainText(el) {
    try {
      if (!el) return;
      el.style.removeProperty('font-size');
      if (!el.clientWidth) return;
      var fs = parseFloat(window.getComputedStyle(el).fontSize) || 17;
      var guard = 0;
      while (el.scrollWidth > el.clientWidth + 1 && fs > 8 && guard < 30) {
        fs -= 0.5;
        el.style.setProperty('font-size', fs + 'px', 'important');
        guard++;
      }
    } catch (eFit) { /* ignore */ }
  }

  // Mise : le chiffre rétrécit tout seul quand on tape un grand montant (10 000 000…), pour toujours le voir
  // en entier dans sa case (écran normal et plein écran). Mesure au canevas : un champ de saisie ne « déborde » pas.
  var fitStakeCtx = null;
  function fitStakeText(el) {
    try {
      if (!el) return;
      el.style.removeProperty('font-size');
      if (!el.clientWidth) return;
      var cs = window.getComputedStyle(el);
      var fs = parseFloat(cs.fontSize) || 18;
      var avail = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) - 6;
      if (avail <= 0) return;
      var txt = String(el.value || '');
      if (!fitStakeCtx) fitStakeCtx = document.createElement('canvas').getContext('2d');
      fitStakeCtx.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      var w = fitStakeCtx.measureText(txt).width + (parseFloat(cs.letterSpacing) || 0) * txt.length;
      // Place réservée au « $ » posé devant le chiffre (écran normal) : le chiffre rétrécit un peu plus tôt.
      var curRoom = document.documentElement.classList.contains('fs-trade') ? 0 : fs * 0.95;
      if (w + curRoom > avail) {
        var nfs = Math.max(9, Math.floor(fs * avail / (w + curRoom) * 10) / 10);
        el.style.setProperty('font-size', nfs + 'px', 'important');
        w = w * nfs / fs;
        fs = nfs;
      }
      placeStakeCur(el, w, fs, cs);
    } catch (eFitS) { /* ignore */ }
  }

  // « $ » juste devant le chiffre de la mise (écran normal, tous appareils) : même couleur, même taille que le
  // chiffre (il rétrécit avec lui), petit espace entre les deux, bien droit. Le plein écran garde son « $ ».
  function placeStakeCur(el, textW, fs, cs) {
    try {
      var field = el.parentElement;
      if (!field) return;
      var cur = document.getElementById('stakeCur');
      if (!cur) {
        cur = document.createElement('span');
        cur.id = 'stakeCur';
        cur.setAttribute('aria-hidden', 'true');
        cur.textContent = '$';
        field.appendChild(cur);
      }
      if (document.documentElement.classList.contains('fs-trade') || !el.clientWidth) { cur.style.display = 'none'; return; }
      var fr = field.getBoundingClientRect();
      var ir = el.getBoundingClientRect();
      var curFs = Math.max(9, fs * 0.92);
      var curW = curFs * 0.62;
      var gap = Math.max(4, fs * 0.32);
      var center = ir.left + ir.width / 2 - fr.left;
      var left = center - textW / 2 - gap - curW;
      if (left < ir.left - fr.left + 2) left = ir.left - fr.left + 2;
      cur.style.cssText = 'display:block;position:absolute;pointer-events:none;z-index:2;line-height:1;' +
        'left:' + left.toFixed(1) + 'px;top:' + (ir.top - fr.top + ir.height / 2).toFixed(1) + 'px;transform:translateY(-52%);' +
        'font-size:' + curFs.toFixed(1) + 'px;font-weight:' + cs.fontWeight + ';font-family:' + cs.fontFamily + ';' +
        'color:' + cs.color + ';-webkit-text-fill-color:' + cs.color + ';text-shadow:' + cs.textShadow + ';font-style:normal';
    } catch (eCur) { /* ignore */ }
  }

  function updateDurationUi() {
    var u = user();
    if (!u) return;
    var durKey = String(u.id || u.email || u.username || 'guest');
    if (durResetFor !== durKey) {
      durResetFor = durKey;
      if (Number(u.duration) !== 5) {
        u.duration = 5;
        D6.Store.saveUser(u);
      }
    }
    if (Number(u.duration) === 3) {
      u.duration = 5;
      D6.Store.saveUser(u);
    }
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
    // Gagnant = du bon côté de la ligne objectif (= prix d'entrée en 88 %).
    var line = trade.barrier != null ? Number(trade.barrier) : trade.entryPrice;
    var diff = market.price - line;
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
    var kind = resultKind(h);
    var net = h.net != null ? Number(h.net) : (kind === 'win' ? D6.roundMoney(stake * Number(h.payout || 1.88)) - stake : -stake);
    var label;
    var cls;
    if (kind === 'void') {
      label = '0';
      cls = 'void';
      net = 0;
    } else if (kind === 'win') {
      label = t('won') + ' ' + fmtOutcomeUsd(Math.abs(net));
      cls = 'win';
    } else {
      label = t('expired');
      cls = 'lose';
      net = -stake;
    }
    return '<div class="h-item ' + cls + '">' +
      '<span class="h-badge ' + h.side + '">' + (h.side === 'call' ? 'CALL' : 'PUT') + '</span>' +
      '<div><div class="h-main">' + (h.clock || '') + ' · ' + h.assetName + ' · ' + (h.duration || '') + 's</div>' +
      '<div class="h-time">' + D6.fmtFCFA(stake) + ' · ' + label + '</div></div>' +
      '<span class="h-gain ' + (kind === 'win' ? 'w' : (kind === 'void' ? '' : 'l')) + '">' +
      (kind === 'void' ? '0' : fmtOutcomeUsd(net)) + '</span></div>';
  }

  function liveOrderRow(tr) {
    var asset = D6.CONFIG.ASSETS[tr.assetId];
    var name = (asset && (asset.short || asset.name)) || tr.assetId;
    var left = Math.max(0, Number(tr.timeLeft) || 0);
    return '<div class="h-item live">' +
      '<span class="h-badge ' + tr.side + '">' + (tr.side === 'call' ? 'CALL' : 'PUT') + '</span>' +
      '<div><div class="h-main">' + name + ' · ' + (t('histOpen') || 'EN COURS') + ' · ' + fmtTimerLeft(left) + '</div>' +
      '<div class="h-time">' + D6.fmtFCFA(tr.stake) + ' · ' + (tr.duration || '') + 's</div></div>' +
      '<span class="h-gain">' + fmtTimerLeft(left) + '</span></div>';
  }

  function ordersForMode(u) {
    var mode = u && u.mode === 'real' ? 'real' : 'demo';
    var live = (D6.Engine.getTrades ? D6.Engine.getTrades(mode) : []).filter(function (t) {
      return !t.mode || t.mode === mode;
    });
    live.sort(function (a, b) { return (b.startTime || 0) - (a.startTime || 0); });
    var settled = ((u && u.positions) || []).filter(function (p) {
      return (p.mode || 'demo') === mode;
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

  var histSheetMode = 'real';

  function renderHistorySheet(forceMode) {
    var el = $('historySheetFeed');
    if (!el) return;
    var u = user();
    var mode = (forceMode === 'real' || forceMode === 'demo')
      ? forceMode
      : histSheetMode;
    histSheetMode = mode;
    document.querySelectorAll('.hist-tab').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-hist-mode') === mode);
    });
    if ($('histSheetTitle')) {
      $('histSheetTitle').textContent = t('tradeHist') || 'Historique des trades';
    }
    var live = (D6.Engine.getTrades ? D6.Engine.getTrades(mode) : []).filter(function (tr) {
      return !tr.mode || tr.mode === mode;
    });
    live.sort(function (a, b) { return (b.startTime || 0) - (a.startTime || 0); });
    var settled = ((u && u.positions) || []).filter(function (p) {
      return (p.mode || 'demo') === mode;
    });
    // Compte réel : l'historique complet vient du serveur (durable, jusqu'à 2 000 trades).
    if (mode === 'real' && D6.Api && D6.Api.token && D6.Api.token()) {
      if (!tradePage.at || Date.now() - tradePage.at > 20000) loadTradePage(true);
      if (tradePage.rows.length) {
        var seenT = {};
        tradePage.rows.forEach(function (p) { seenT[p.id] = 1; });
        settled = settled.filter(function (p) { return p && p.id && !seenT[p.id]; }).concat(tradePage.rows);
        settled.sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
      }
    }
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
    function fmtHistMoney(n) {
      return String(D6.fmtFCFA(n) || '');
    }
    // Format en cartes (lisible sur tous les écrans, sans défilement de côté) :
    // logo + simulation + sens à gauche, gain / perte à droite, bouton reçu au bout.
    function hcIcon(assetId) {
      try {
        // v2394 : le nouveau logo (globe du marché, comme sur les cases du site) ; l'ancien pictogramme en secours.
        var chip = document.querySelector('.asset-chip[data-asset="' + assetId + '"]');
        var art = chip && chip.querySelector('.mk-art');
        if (art && art.querySelector('svg')) {
          var cs = getComputedStyle(chip);
          var p1 = (cs.getPropertyValue('--p1') || '').trim() || '#C9B8FF';
          var p2 = (cs.getPropertyValue('--p2') || '').trim() || '#3B1D8F';
          var pg = (cs.getPropertyValue('--pg') || '').trim() || 'rgba(167,139,250,.45)';
          // v2422 : dégradés renommés (sinon le logo peut apparaître gris).
          var uid = 'h' + Math.random().toString(36).slice(2, 7);
          var ih = art.innerHTML.replace(/id="([^"]+)"/g, 'id="$1_' + uid + '"').replace(/url\(#([^)]+)\)/g, 'url(#$1_' + uid + ')');
          return '<span class="hc-globe" style="--p1:' + p1 + ';--p2:' + p2 + ';--pg:' + pg + '">' + ih + '</span>';
        }
        var ico = document.querySelector('.asset-chip[data-asset="' + assetId + '"] .asset-ico');
        return ico ? ico.innerHTML : '';
      } catch (eI) { return ''; }
    }
    function hcSide(side) {
      return side === 'call' ? '<span class="hc-side call">CALL ↗</span>' : '<span class="hc-side put">PUT ↘</span>';
    }
    live.forEach(function (tr) {
      var stake = Number(tr.stake || 0);
      var left = Math.max(0, Number(tr.timeLeft) || 0);
      var asset = D6.CONFIG.ASSETS[tr.assetId];
      var name = (asset && (asset.short || asset.name)) || tr.assetId || '-';
      rows.push('<div class="hc hc-live"><div class="hc-ico">' + hcIcon(tr.assetId) + '</div>' +
        '<div class="hc-main"><div class="hc-name">' + name + ' ' + hcSide(tr.side) + '</div>' +
        '<div class="hc-meta">' + (t('histOpen') || 'En cours') + ' · ' + fmtTimerLeft(left) + ' · ' + fmtHistMoney(stake) + '</div></div>' +
        '<div class="hc-res"><div class="hc-pnl">—</div><div class="hc-st">' + durLabel(tr.duration) + '</div></div><span></span></div>');
    });
    var shown = mode === 'real' ? Math.max(50, tradePage.rows.length) : 100;
    var rcList = settled.slice(0, shown);
    rcList.forEach(function (h, rcIdx) {
      var stake = Number(h.stake || 0);
      var payoutAmt = D6.roundMoney(stake * Number(h.payout || 1.88));
      var kind = resultKind(h);
      var net = kind === 'void' ? 0 : (kind === 'win' ? (payoutAmt - stake) : -stake);
      var res = kind === 'void' ? '0' : (kind === 'win' ? t('won') : t('expired'));
      var pnlCls = net > 0 ? 'hc-pnl w' : (net < 0 ? 'hc-pnl l' : 'hc-pnl');
      var pnlTxt = (net > 0 ? '+' : (net < 0 ? '-' : '')) + fmtHistMoney(Math.abs(net));
      rows.push('<div class="hc rc-open" data-rc="' + rcIdx + '"><div class="hc-ico">' + hcIcon(h.assetId) + '</div>' +
        '<div class="hc-main"><div class="hc-name">' + (h.assetName || h.assetId || '-') + ' ' + hcSide(h.side) + '</div>' +
        '<div class="hc-meta">' + (h.clock || fmtWhen(h.at)) + ' · ' + durLabel(h.duration) + ' · ' + fmtHistMoney(stake) + '</div></div>' +
        '<div class="hc-res"><div class="' + pnlCls + '">' + pnlTxt + '</div><div class="hc-st">' + res + '</div></div>' +
        '<button type="button" class="rc-dlbtn" aria-label="receipt">' + (D6.ReceiptIcon || '') + '</button></div>');
    });
    el.innerHTML = rows.length
      ? '<div class="hc-list">' + rows.join('') + '</div>' +
        (mode === 'real' && tradePage.more ? '<button type="button" class="btn-ghost tx-more" id="histMore">' + (t('seeMore') !== 'seeMore' ? t('seeMore') : t('m_seeMore')) + '</button>' : '')
      : '<div class="empty-feed">' + (t('noTradesHint') || 'Aucun trade pour l\'instant') + '</div>';
    var histMore = $('histMore');
    if (histMore) histMore.onclick = function () { loadTradePage(false); };
    // Reçu : un clic sur la ligne (ou sur le bouton) ouvre le reçu du trade.
    el.onclick = function (ev) {
      var trR = ev.target && ev.target.closest ? ev.target.closest('[data-rc]') : null;
      if (!trR || !D6.Receipt) return;
      var hR = rcList[Number(trR.getAttribute('data-rc'))];
      if (hR) D6.Receipt.trade(hR, mode);
    };
  }

  // Trades réels terminés, lus sur le serveur 50 par 50.
  var tradePage = { rows: [], more: false, busy: false, at: 0 };

  function loadTradePage(reset) {
    if (tradePage.busy || !(D6.Api && D6.Api.token && D6.Api.token())) return;
    tradePage.busy = true;
    tradePage.at = Date.now();
    var offset = reset ? 0 : tradePage.rows.length;
    D6.Api.post('tradeHistory', { offset: offset, limit: 50 }).then(function (remote) {
      tradePage.busy = false;
      if (!(remote && remote.ok && Array.isArray(remote.rows))) return;
      var list = remote.rows.map(function (o) {
        var asset = D6.CONFIG.ASSETS[o.assetId];
        return {
          id: o.id,
          at: o.at,
          assetId: o.assetId,
          assetName: (asset && (asset.short || asset.name)) || o.assetId,
          side: o.side,
          stake: Number(o.stake) || 0,
          duration: o.duration,
          payout: Number(o.payout) || 1.88,
          net: Number(o.net) || 0,
          status: o.status,
          entryPrice: o.entryPrice,
          exitPrice: o.exitPrice,
          mode: 'real'
        };
      });
      tradePage.rows = reset ? list : tradePage.rows.concat(list);
      tradePage.more = !!remote.more;
      var sheet = $('historySheet');
      if (sheet && sheet.classList.contains('active') && histSheetMode === 'real') renderHistorySheet('real');
    }, function () { tradePage.busy = false; });
  }

  /*
   * « Astuce trading » (activer MA / BB / EMA), après 5 pertes de suite, jamais pendant un trade.
   *  - DÉMO : une seule fois ; fermée → plus jamais en démo sur cet appareil.
   *  - RÉEL : revient seulement après 60 nouveaux trades réels depuis la dernière fois, et jamais
   *    deux fois le même jour (un joueur régulier la revoit de temps en temps, sans être agacé).
   */
  var TIP_STATE_LS = 'oro_tip_state';
  var TIP_REAL_GAP = 60;
  function tipState() {
    try { return JSON.parse(localStorage.getItem(TIP_STATE_LS) || '{}') || {}; } catch (eT) { return {}; }
  }
  function saveTipState(s) {
    try { localStorage.setItem(TIP_STATE_LS, JSON.stringify(s)); } catch (eT2) { /* ignore */ }
  }
  function noteSettledForTip(mode) {
    if (mode !== 'real') return;
    var s = tipState();
    s.realCount = (s.realCount || 0) + 1;
    saveTipState(s);
  }

  function markTipClosed() {
    var s = tipState();
    if (s.lastMode !== 'real') s.demoDone = true;
    saveTipState(s);
  }

  function maybeLossStreakTip(u, mode) {
    if (!u || (u.consecutiveLosses || 0) < 5) return;
    if (D6.Engine && D6.Engine.liveCount && D6.Engine.liveCount()) return;
    mode = mode === 'real' ? 'real' : 'demo';
    var s = tipState();
    var today = new Date().toISOString().slice(0, 10);
    if (mode === 'real') {
      if (s.realShownAt != null && (s.realCount || 0) - s.realShownAt < TIP_REAL_GAP) return;
      if (s.realShownDay === today) return;
      s.realShownAt = s.realCount || 0;
      s.realShownDay = today;
    } else {
      if (s.demoDone || s.demoShownDay === today) return;
      s.demoShownDay = today;
    }
    s.lastMode = mode;
    saveTipState(s);
    openModal('tipModal');
  }

  function maybeConvertPrompt() {}

  function profitFromResult(res) {
    if (!res) return 0;
    var stake = Number((res.trade && res.trade.stake) || (res.position && res.position.stake) || 0);
    if (res.won) {
      // Montant total crédité (mise × multiplicateur), pas le net.
      if (res.position && res.position.stake) {
        return D6.roundMoney(Number(res.position.stake) * Number(res.position.payout || 1.88));
      }
      if (res.trade && res.trade.stake) {
        return D6.roundMoney(Number(res.trade.stake) * Number(res.trade.payout || 1.88));
      }
      if (res.net != null && res.position && res.position.stake) {
        return Math.abs(Number(res.net)) + Number(res.position.stake);
      }
    }
    if (stake > 0) return -D6.roundMoney(stake);
    if (res.net != null && Number(res.net) < 0) return D6.roundMoney(Number(res.net));
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
    var call = $('btnCall');
    var put = $('btnPut');
    if (call) {
      call.disabled = false;
      call.removeAttribute('disabled');
      call.classList.remove('locked', 'soft-pause');
    }
    if (put) {
      put.disabled = false;
      put.removeAttribute('disabled');
      put.classList.remove('locked', 'soft-pause');
    }
    var hint = $('tradeLockHint');
    if (hint) hint.classList.remove('on');
  }

  function applyOfficialReal(value, opts) {
    var u = user();
    if (!u || !D6.Store.setBalanceMode) return false;
    var real = Number(value);
    if (!isFinite(real) || real < 0) return false;
    // Fix solde réel : ne PAS corriger quand le serveur fait autorité (force / fromTrade).
    if (D6.correctStakeReserve && !(opts && (opts.force || opts.fromTrade))) {
      real = D6.correctStakeReserve(real);
    }
    var local = D6.Store.realBalance ? Number(D6.Store.realBalance(u)) || 0 : 0;
    var force = !!(opts && opts.force);
    var fromMe = !!(opts && opts.fromMe);
    var fromTrade = !!(opts && opts.fromTrade);
    var allowRaise = !!(opts && opts.allowRaise) || !!D6.holdDepositReal;
    var reserve = D6.stakeReserve;
    var undoingDouble = !!(reserve && Date.now() < reserve.until && Math.abs(real - reserve.once) <= 0.05 && real > local + 0.009);
    var locks = getBalanceLocks();
    var locked = locks && Date.now() < locks.until;
    var recentSettle = lastSettleAt && Date.now() - lastSettleAt < 30000;
    // Gel trade : me/poll bloqués ; place/settle (fromTrade) OK ; dépôt (holdDepositReal) OK.
    if (tradeBalanceFrozen() && !fromTrade && !D6.holdDepositReal) return false;
    // UNE CAISSE : réponse serveur (me / dépôt / trade) = vérité.
    // Seul un zéro explicite (allowZero) peut écraser un solde local positif.
    if (fromMe || fromTrade) {
      if (real <= 0.009 && local > 0.009 && !(opts && opts.allowZero)) return false;
      lastOfficialReal = real;
      D6.holdPull = true;
      D6.Store.setBalanceMode(u, 'real', real);
      D6.holdPull = false;
      return true;
    }
    if (real <= 0.009 && local > 0.009 && !(opts && opts.allowZero)) return false;
    var stalePreStake = reserve && Date.now() < reserve.until && real > local + 0.009
      && Math.abs(real - (local + Number(reserve.stake) || 0)) <= 0.09;
    if (stalePreStake && !D6.holdDepositReal && !force) return false;
    if (!force && !undoingDouble && !D6.holdDepositReal) {
      if (locked && real + 0.02 < local) return false;
      if (recentSettle && Math.abs(real - local) > 0.02) return false;
    }
    if (real > local + 0.009 && !allowRaise && !force && !undoingDouble && !D6.holdDepositReal) return false;
    lastOfficialReal = real;
    D6.holdPull = true;
    D6.Store.setBalanceMode(u, 'real', real);
    D6.holdPull = false;
    return true;
  }

  function adoptServerBook(remote) {
    var u = user();
    if (!u || !remote) return;
    var changed = false;
    if (Array.isArray(remote.positions) && remote.positions.length && D6.Store.addPosition) {
      var seen = {};
      (u.positions || []).forEach(function (p) { if (p && p.id) seen[p.id] = 1; });
      remote.positions.forEach(function (p) {
        if (!p || !p.id || seen[p.id]) return;
        u.positions = u.positions || [];
        u.positions.push(p);
        seen[p.id] = 1;
        changed = true;
      });
    }
    if (Array.isArray(remote.openOrders) && remote.openOrders.length) {
      u.openTrades = u.openTrades || [];
      var have = {};
      u.openTrades.forEach(function (t) { if (t && t.id) have[t.id] = 1; });
      remote.openOrders.forEach(function (t) {
        if (!t || !t.id || have[t.id]) return;
        u.openTrades.push(t);
        have[t.id] = 1;
        changed = true;
      });
      if (D6.Engine && D6.Engine.restoreOpen) D6.Engine.restoreOpen(u);
    }
    if (changed) D6.Store.saveUser(u);
  }

  /**
   * Même compte ouvert sur plusieurs appareils : un trade RÉEL lancé sur le téléphone apparaît
   * aussi sur le PC (et inversement) au prochain « me » (toutes les 8 s environ).
   * Garde-fous : seulement le compte réel (le serveur tient le solde et paie une seule fois),
   * jamais un trade déjà fini ici, ni un trade qui expire dans moins de 2 s.
   */
  function mirrorOtherDeviceTrades(r) {
    try {
      var u = user();
      if (!u || !r || !r.ok || !Array.isArray(r.openOrders) || !r.openOrders.length) return;
      if (isGuest(u)) return;
      var done = {};
      (u.positions || []).forEach(function (p) { if (p && p.id) done[p.id] = 1; });
      var known = {};
      (u.openTrades || []).forEach(function (t) { if (t && t.id) known[t.id] = 1; });
      var now = Date.now();
      var fresh = r.openOrders.filter(function (t) {
        if (!t || !t.id || t.mode !== 'real' || t.settled) return false;
        if (done[t.id] || known[t.id]) return false;
        var exp = Number(t.expiryTime) || 0;
        return !(exp > 0 && exp - now < 2000);
      });
      if (!fresh.length) return;
      adoptServerBook({ openOrders: fresh });
    } catch (eMirror) { /* ignore */ }
  }

  function adoptOfficialVault(vault, opts) {
    if (!vault || !user()) return false;
    if (!Object.prototype.hasOwnProperty.call(vault, 'real')) return false;
    return applyOfficialReal(vault.real, opts);
  }

  function adoptSettledVault(vault, settledMode) {
    if (!vault || !user()) return false;
    if (settledMode !== 'real') return false;
    return adoptOfficialVault(vault);
  }

  function fillProfile() {
    var u = user();
    if (!u) return;
    loadRecvCache(u);
    $('profName').textContent = isGuest(u) ? t('m_guest') : (u.displayName || 'Trader');
    $('profAvatar').textContent = (u.displayName || 'OR').slice(0, 2).toUpperCase();
    if ($('profPublicId')) $('profPublicId').textContent = u.publicId || '—';
    $('profEmail').textContent = u.email;
    if ($('profSince')) $('profSince').textContent = fmtMemberSince(u.createdAt || u.created_at);
    var real = D6.Store.realBalance ? D6.Store.realBalance(u) : 0;
    if ($('profWalletBal')) $('profWalletBal').textContent = D6.fmtMoney(real);
    profRecvCoin = 'usdt';
    paintProfRecv();
    prefetchRecv('usdt');
    ['btc', 'eth', 'trx'].forEach(function (id, i) {
      setTimeout(function () { prefetchRecv(id); }, 280 + i * 320);
    });
    setAdminBtns(u);
  }

  var profRecvCoin = 'usdt';
  var recvCache = {};
  var recvBusy = {};
  var recvFailed = {};
  var recvTimers = {};
  // Une adresse OxaPay ne sert qu'une fois (payée ou expirée = OxaPay ne la surveille plus) :
  // on ne montre une adresse que si le serveur l'a donnée il y a moins de 10 min, et jamais
  // après un dépôt crédité (le serveur en donne alors une nouvelle).
  var recvFresh = {};
  function recvIsFresh(key) { return !!recvFresh[key] && Date.now() - recvFresh[key] < 600000; }

  function recvCacheKey(u) {
    return 'oro_recv_cache_' + String((u && u.id) || 'guest');
  }

  function loadRecvCache(u) {
    try {
      var raw = sessionStorage.getItem(recvCacheKey(u));
      recvCache = raw ? (JSON.parse(raw) || {}) : {};
    } catch (e0) { recvCache = {}; }
    if (u && u.recvAddrs) {
      ['usdt', 'btc', 'eth', 'trx'].forEach(function (k) {
        if (u.recvAddrs[k] && !recvCache[k]) recvCache[k] = u.recvAddrs[k];
      });
    }
  }

  function saveRecvCache(u) {
    try { sessionStorage.setItem(recvCacheKey(u || user()), JSON.stringify(recvCache)); } catch (e1) { /* ignore */ }
  }

  function profRecvMeta(id) {
    if (id === 'btc') return { coin: 'btc', min: 15, cache: 'btc' };
    if (id === 'eth') return { coin: 'eth', min: 15, cache: 'eth' };
    if (id === 'trx') return { coin: 'trx', min: 5, cache: 'trx' };
    return { coin: 'usdt_trc20', min: 5, cache: 'usdt' };
  }

  function persistRecv(id, addr) {
    if (!addr || isStaticPlatAddr(addr)) return;
    var key = profRecvMeta(id).cache;
    recvCache[key] = addr;
    recvFresh[key] = Date.now();
    var u = user();
    if (!u || isGuest(u)) return;
    u.recvAddrs = u.recvAddrs || {};
    if (u.recvAddrs[key] === addr) {
      saveRecvCache(u);
      return;
    }
    u.recvAddrs[key] = addr;
    saveRecvCache(u);
    D6.Store.saveUser(u);
    if (D6.Api && D6.Api.token()) {
      D6.Api.post('upsert', { user: u }).catch(function () { /* ignore */ });
    }
  }

  function isStaticPlatAddr(addr) {
    var a = String(addr || '').trim();
    if (!a) return false;
    var plat = String((D6.CONFIG && D6.CONFIG.USDT_TRC20_ADDRESS) || 'TD32ZDYDvhej6MGk7ZsYC5jLKDdCoJquP1').trim();
    return plat !== '' && a.toLowerCase() === plat.toLowerCase();
  }

  function assignedRecv(id) {
    var key = profRecvMeta(id).cache;
    if (!recvIsFresh(key)) return '';
    var u = user();
    var addr = '';
    if (u && u.recvAddrs && u.recvAddrs[key]) addr = String(u.recvAddrs[key] || '');
    if (!addr && recvCache[key]) addr = String(recvCache[key] || '');
    if (addr && !isStaticPlatAddr(addr)) return rawCryptoAddr(addr) || addr;
    return '';
  }

  function paintProfRecv() {
    var el = $('profWalletAddr');
    var copyBtn = $('btnCopyWallet');
    var meta = profRecvMeta(profRecvCoin);
    document.querySelectorAll('.wallet-tab').forEach(function (btn) {
      var on = btn.getAttribute('data-recv') === profRecvCoin;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var addr = assignedRecv(profRecvCoin);
    var busy = !!recvBusy[meta.cache];
    if (el) {
      el.textContent = addr || t('m_addrGen');
      el.title = addr;
    }
    if (copyBtn) copyBtn.disabled = !addr;
  }

  function prefetchRecv(id, force) {
    var meta = profRecvMeta(id || 'usdt');
    var existing = assignedRecv(id || 'usdt');
    if (existing && !force) {
      recvFailed[meta.cache] = false;
      paintProfRecv();
      return;
    }
    var u = user();
    if (!u || isGuest(u) || typeof postOxaInvoice !== 'function') {
      recvFailed[meta.cache] = true;
      paintProfRecv();
      return;
    }
    if (recvBusy[meta.cache]) return;
    recvBusy[meta.cache] = true;
    recvFailed[meta.cache] = false;
    paintProfRecv();
    if (recvTimers[meta.cache]) clearTimeout(recvTimers[meta.cache]);
    recvTimers[meta.cache] = setTimeout(function () {
      if (!recvIsFresh(meta.cache)) {
        recvBusy[meta.cache] = false;
        recvFailed[meta.cache] = true;
        paintProfRecv();
      }
    }, 8000);
    ensureApiToken().then(function (tok) {
      return postOxaInvoice({
        token: tok || (D6.Api && D6.Api.token ? D6.Api.token() : ''),
        amount: meta.min,
        coin: meta.coin,
        confirmed: true
      });
    }).then(function (remote) {
      recvBusy[meta.cache] = false;
      if (recvTimers[meta.cache]) clearTimeout(recvTimers[meta.cache]);
      if (remote && remote.ok && remote.address) {
        persistRecv(id || 'usdt', String(remote.address));
        recvFailed[meta.cache] = false;
        if (meta.cache === 'usdt') liveDepositAddr = recvCache.usdt;
        if (remote.orderId && meta.cache === 'usdt') oxaInvoice = remote;
      } else if (!recvCache[meta.cache]) {
        recvFailed[meta.cache] = true;
        if (!force) {
          setTimeout(function () { prefetchRecv(id || 'usdt', true); }, 1400);
        }
      }
      paintProfRecv();
    }).catch(function () {
      recvBusy[meta.cache] = false;
      if (recvTimers[meta.cache]) clearTimeout(recvTimers[meta.cache]);
      if (!recvCache[meta.cache]) {
        recvFailed[meta.cache] = true;
        if (!force) {
          setTimeout(function () { prefetchRecv(id || 'usdt', true); }, 1400);
        }
      }
      paintProfRecv();
    });
  }

  function copyTextSilent(addr, onOk) {
    if (!addr) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(onOk).catch(function () {
        try {
          var ta = document.createElement('textarea');
          ta.value = addr;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          onOk();
        } catch (e) { toast(addr, ''); }
      });
      return;
    }
    toast(addr, '');
  }

  function bindWalletCard() {
    document.querySelectorAll('.wallet-tab').forEach(function (btn) {
      if (btn._oroBound) return;
      btn._oroBound = true;
      bindAndroidTap(btn, function () {
        var id = btn.getAttribute('data-recv') || 'usdt';
        profRecvCoin = id;
        paintProfRecv();
        prefetchRecv(id);
      });
    });
    if ($('btnCopyWallet') && !$('btnCopyWallet')._oroBound) {
      $('btnCopyWallet')._oroBound = true;
      bindAndroidTap($('btnCopyWallet'), function () {
        var addr = assignedRecv(profRecvCoin);
        if (!addr) {
          prefetchRecv(profRecvCoin, true);
          toast('Adresse en cours de génération…', '');
          return;
        }
        var copyBtn = $('btnCopyWallet');
        copyTextSilent(addr, function () {
          copyBtn.textContent = t('copied') || 'Copié';
          copyBtn.classList.add('is-copied');
          setTimeout(function () {
            copyBtn.textContent = t('copyId') || 'Copier';
            copyBtn.classList.remove('is-copied');
          }, 1200);
        });
      });
    }
  }

  function fmtMemberSince(iso) {
    var d = iso ? new Date(iso) : null;
    if (!d || isNaN(d.getTime())) return '—';
    var lang = (D6.I18N && D6.I18N.lang) || 'fr';
    try {
      return d.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (eDt) {
      return d.toISOString().slice(0, 10);
    }
  }

  function copyText(txt, btn) {
    if (!txt || txt === '—') return;
    function ok() {
      if (!btn) return;
      btn.textContent = t('copied') || 'Copié';
      setTimeout(function () { btn.textContent = t('copyId') || 'Copier'; }, 1200);
    }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta); ok();
      } catch (e) { /* ignore */ }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok).catch(fallback);
    else fallback();
  }

  function bindCopyEmail() {
    var btn = $('btnCopyEmail');
    if (!btn || btn._oroBound) return;
    btn._oroBound = true;
    btn.addEventListener('click', function () {
      copyText(($('profEmail') && $('profEmail').textContent) || '', btn);
    });
  }

  /** Changer d'adresse : code à l'adresse actuelle, puis à la nouvelle ; « autres appareils ». */
  function bindEmailChange() {
    if (!$('btnOpenEmail') || $('btnOpenEmail')._oroBound) return;
    $('btnOpenEmail')._oroBound = true;
    var step = 'new';
    var busy = false;
    var left = 0;
    var timer = null;
    var target = '';
    var sentAt = 0;
    function err(id, msg) {
      var el = $(id);
      if (!el) return;
      el.textContent = L(msg) || '';
      el.classList.toggle('on', !!msg);
    }
    function lead(msg) { if ($('emailLead')) $('emailLead').textContent = msg || ''; }
    function paintResend() {
      var link = $('btnEmailResend');
      if (!link) return;
      link.textContent = left > 0 ? t('otpResendIn').replace('{s}', String(left)) : t('otpResend');
      setResendWait(link, left > 0);
    }
    function countdown(sec) {
      left = Math.max(0, parseInt(sec, 10) || 60);
      if (timer) clearInterval(timer);
      paintResend();
      timer = setInterval(function () {
        left -= 1;
        if (left <= 0) { left = 0; clearInterval(timer); timer = null; }
        paintResend();
      }, 1000);
    }
    function setStep(s) {
      step = s;
      if ($('formEmail')) $('formEmail').setAttribute('data-step', s);
      if ($('emailStepNew')) $('emailStepNew').classList.toggle('hidden', s !== 'new');
      if ($('emailStepCode')) $('emailStepCode').classList.toggle('hidden', s === 'new');
      var btn = $('btnEmailPrimary');
      if (btn) btn.textContent = s === 'new' ? t('sendCode') : t('continueBtn');
      if (s === 'new') lead('');
      else lead(t(s === 'old' ? 'emailStepOld' : 'emailStepNew').replace('{e}', target));
      if (s !== 'new' && $('emailOtp')) {
        $('emailOtp').value = '';
        setTimeout(function () { $('emailOtp').focus(); }, 60);
      }
    }
    function reset() {
      busy = false;
      left = 0;
      if (timer) { clearInterval(timer); timer = null; }
      if ($('newEmail')) $('newEmail').value = '';
      err('err-newEmail', '');
      err('err-emailOtp', '');
      setStep('new');
    }
    function failText(res) {
      if (res && res.code === 'taken') return t('emailTaken');
      if (res && res.code === 'email') return t('emailInvalid');
      if (res && res.code === 'bad') return otpFailText();
      return (res && res.reason) || t('sessionInvalid');
    }
    async function start() {
      var mail = String(($('newEmail') && $('newEmail').value) || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { err('err-newEmail', t('emailInvalid')); return; }
      err('err-newEmail', '');
      busy = true;
      var res;
      try { res = await D6.Api.post('emailChangeStart', { newEmail: mail }, 25000); } finally { busy = false; }
      if (!res || !res.ok) { err('err-newEmail', failText(res)); return; }
      target = res.sentTo || (user() && user().email) || '';
      sentAt = Date.now();
      setStep('old');
      countdown(res.resendIn || 60);
      toast(t('codeSent'), 'ok');
    }
    async function verify() {
      var code = String(($('emailOtp') && $('emailOtp').value) || '').replace(/\D/g, '').slice(0, 6);
      if (code.length !== 6) { err('err-emailOtp', otpFailText()); return; }
      err('err-emailOtp', '');
      busy = true;
      var res;
      try { res = await D6.Api.post('emailChangeVerify', { code: code }, 25000); } finally { busy = false; }
      if (!res || !res.ok) {
        err('err-emailOtp', failText(res));
        if (res && res.code === 'none') setStep('new');
        return;
      }
      if (res.step === 'new') {
        target = res.sentTo || target;
        sentAt = Date.now();
        setStep('newcode');
        countdown(res.resendIn || 60);
        toast(t('codeSent'), 'ok');
        return;
      }
      var u = user();
      if (u && res.email) {
        u.email = res.email;
        u.originalEmail = res.email;
        D6.Store.saveUser(u);
      }
      fillProfile();
      closeModal('emailModal');
      toast(t('emailChanged'), 'ok', 4200);
    }
    async function resend() {
      if (busy || left > 0 || step === 'new') return;
      busy = true;
      var res;
      try { res = await D6.Api.post('emailChangeResend', {}, 25000); } finally { busy = false; }
      if (res && res.ok) { countdown(res.resendIn || 60); toast(t('codeSent'), 'ok'); return; }
      if (res && res.retryIn) { countdown(res.retryIn); return; }
      err('err-emailOtp', failText(res));
    }
    $('btnOpenEmail').addEventListener('click', function () {
      if (isGuest()) { requireAccount(); return; }
      // Reprise à l'étape du code si la fenêtre a été fermée par erreur (moins de 9 min).
      if (!(step !== 'new' && Date.now() - sentAt < 9 * 60 * 1000)) reset();
      openFromProfile('emailModal');
    });
    bindAndroidTap($('closeEmail'), function () { closeModal('emailModal'); });
    bindAndroidTap($('btnEmailPrimary'), function () {
      if (busy) return;
      if (step === 'new') start(); else verify();
    });
    bindAndroidTap($('btnEmailResend'), resend);
    if ($('formEmail')) {
      $('formEmail').addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;
        if (step === 'new') start(); else verify();
      });
    }
    if ($('emailOtp')) {
      $('emailOtp').addEventListener('input', function () {
        var v = String($('emailOtp').value || '').replace(/\D/g, '').slice(0, 6);
        $('emailOtp').value = v;
        if (v.length === 6 && !busy) verify();
      });
    }

    // « Déconnecter mes autres appareils »
    if ($('btnLogoutOthers')) {
      $('btnLogoutOthers').addEventListener('click', function () {
        if (isGuest()) { requireAccount(); return; }
        openFromProfile('logoutOthersModal');
      });
    }
    bindAndroidTap($('btnLogoutOthersNo'), function () { closeModal('logoutOthersModal'); });
    bindAndroidTap($('btnLogoutOthersYes'), async function () {
      if (busy) return;
      busy = true;
      var res;
      try { res = await D6.Api.post('logoutOthers', {}, 20000); } finally { busy = false; }
      closeModal('logoutOthersModal');
      if (res && res.ok) toast(t('logoutOthersDone'), 'ok', 4200);
      else toast((res && res.reason) || t('sessionInvalid'), 'err');
    });
    if ($('logoutOthersModal')) {
      $('logoutOthersModal').addEventListener('click', function (e) {
        if (e.target === $('logoutOthersModal')) closeModal('logoutOthersModal');
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
        setTimeout(function () { btn.textContent = t('copyId') || 'Copier'; }, 1200);
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
    closeLangMenus();
    fillProfile();
    var bd = $('drawerBackdrop');
    var dr = $('drawerProfile');
    if (bd) {
      bd.classList.add('on');
      bd.style.removeProperty('display');
      bd.style.removeProperty('pointer-events');
      bd.style.removeProperty('visibility');
    }
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
    if (D6.Chart) {
      try {
        if (D6.Chart.syncAccountMode) D6.Chart.syncAccountMode();
        else if (D6.Chart.resize) D6.Chart.resize();
      } catch (eDr) { /* ignore */ }
    }
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
  var presenceVisBound = false;

  function classifyTrafficHost(host) {
    host = String(host || '').toLowerCase();
    if (!host) return '';
    if (/facebook|fb\.com|fbclid/.test(host)) return 'facebook';
    if (/instagram|ig\.me/.test(host)) return 'instagram';
    if (/tiktok|vm\.tiktok/.test(host)) return 'tiktok';
    if (/whatsapp|wa\.me/.test(host)) return 'whatsapp';
    if (/t\.me|telegram/.test(host)) return 'telegram';
    if (/youtube|youtu\.be/.test(host)) return 'youtube';
    if (/(^|\.)x\.com|twitter|t\.co/.test(host)) return 'twitter';
    if (/snapchat/.test(host)) return 'snapchat';
    if (/linkedin/.test(host)) return 'linkedin';
    if (/google|gclid/.test(host)) return 'google';
    if (/bing/.test(host)) return 'bing';
    return '';
  }
  function captureUtmSource() {
    try {
      var p = new URLSearchParams(window.location.search || '');
      var ref = '';
      try { ref = String(document.referrer || ''); } catch (eR) { ref = ''; }
      var host = '';
      try { host = ref ? new URL(ref).hostname : ''; } catch (eH) { host = ''; }
      var src = String(p.get('utm_source') || p.get('source') || '').toLowerCase().trim();
      var medium = String(p.get('utm_medium') || '').toLowerCase().trim();
      var campaign = String(p.get('utm_campaign') || '').toLowerCase().trim();
      if (p.get('fbclid')) { src = src || 'facebook'; medium = medium || 'social'; }
      if (p.get('gclid') || p.get('wbraid') || p.get('gbraid')) { src = src || 'google'; medium = medium || 'cpc'; }
      if (p.get('ttclid')) { src = src || 'tiktok'; medium = medium || 'social'; }
      if (!src) src = classifyTrafficHost(host);
      if (!src) src = 'direct';
      src = src.replace(/[^a-z0-9_\-.]/g, '').slice(0, 40) || 'direct';
      localStorage.setItem('orolado_utm_source', src);
      localStorage.setItem('orolado_utm_meta', JSON.stringify({
        source: src,
        medium: (medium || (src === 'direct' ? 'none' : 'referral')).slice(0, 40),
        campaign: campaign.slice(0, 60),
        referrer: host.slice(0, 80)
      }));
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
    adminPresenceTimer = setInterval(pingAdminPresence, 20000);
    if (!presenceVisBound) {
      presenceVisBound = true;
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) pingAdminPresence();
      });
    }
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
    // v2340 : personnes connectées en direct (VPS). Orange dès 1 500, rouge dès 2 000 → agrandir le VPS.
    if ($('mDirect')) {
      var nDir = m.direct;
      $('mDirect').textContent = nDir == null ? '—' : String(nDir);
      $('mDirect').style.color = nDir >= 2000 ? '#F43F5E' : (nDir >= 1500 ? '#F59E0B' : '');
    }
    if ($('mDepPending')) $('mDepPending').textContent = String(adminCache.deposits.length);
    if ($('mWdPending')) {
      var wp = adminCache.withdrawals.filter(function (w) { return !w.adminHidden && (w.status === 'pending' || w.status === 'review'); }).length;
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
        if (w.adminHidden) return false;
        if (adminView === 'withdrawalsPending' && w.status !== 'pending' && w.status !== 'review') return false;
        return adminMatchQ([w.name, w.email, w.phone, w.operator, w.id, w.userId, w.status, String(w.amount || '')].join(' '), q);
      });
      if (!wdList.length) html = '<div class="empty-feed">' + t('noWithdraw') + '</div>';
      else {
        var wrows = wdList.map(function (w) {
          var badge = w.suspect ? ' <span class="badge-suspect">' + t('suspect') + '</span>' : '';
          var dest = (w.countryCode ? w.countryCode + ' ' : '') + (w.destination || w.phone || '') + (w.beneficiary ? ' · ' + w.beneficiary : '');
          var acts = (w.status === 'pending' || w.status === 'review')
            ? ('<div class="admin-wd-acts">' +
              '<button class="mini wd-ok" data-wd="' + adminEsc(w.id) + '" data-wd-act="approve">VALIDER / PAYÉ</button>' +
              '<button class="mini wd-refund" data-wd="' + adminEsc(w.id) + '" data-wd-act="reject">REJETER</button>' +
              '<button class="mini wd-hold" data-wd="' + adminEsc(w.id) + '" data-wd-act="suspend">SUSPENDRE</button>' +
              '<button class="mini wd-silent" data-wd="' + adminEsc(w.id) + '" data-wd-act="silent">SUPPRESSION SILENCIEUSE</button>' +
              '</div>')
            : adminEsc(adminTxStatusLabel(w.status));
          return '<tr><td>' + adminEsc((w.at || w.clock || '').toString().replace('T', ' ').slice(0, 16)) +
            '</td><td>' + adminEsc(w.userId || '') + '</td><td>' + adminEmailCell(w.email) +
            '</td><td>' + adminEsc(gatewayLabel(w.operator)) + '</td><td>' + adminEsc(dest) + badge +
            '</td><td>' + D6.fmtFCFA(w.amount) + '</td><td>' + adminEsc(adminTxStatusLabel(w.status)) +
            '</td><td>' + acts + '</td></tr>';
        }).join('');
        html = '<div class="table-wrap"><table class="admin-table"><thead><tr><th>Date</th><th>ID Joueur</th><th>Email</th><th>Méthode</th><th>Coordonnées</th><th>Montant $</th><th>Statut</th><th></th></tr></thead><tbody>' + wrows + '</tbody></table></div>';
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
    if (s === 'REVIEW' || s === 'SUSPENDED') return 'Vérification de sécurité';
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
      var ref = String(row.ref || '');
      var key = (ref && ref !== '—' && ref !== 'ledger')
        ? [row.type, ref, row.amount].join('|')
        : [row.at, row.type, row.amount, ref].join('|');
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

  function closeAdminUser() {
    closeModal('adminUserModal');
    var box = $('adminUserDetail');
    if (box) box.innerHTML = '';
  }

  function openAdminUser(uid) {
    var u = (adminCache.users || []).find(function (x) { return x.id === uid; });
    var box = $('adminUserDetail');
    if (!u || !box) return;
    box.innerHTML = '<div class="convert-title">' + adminEsc(u.publicId || '') + ' · ' + adminEsc(u.displayName || '') + '</div>' +
      '<div class="h-time">' + adminEsc(u.email) + ' · ' + adminEsc((u.countryCode || '') + ' ' + (u.phone || '')) + ' · inscrit ' + adminEsc((u.createdAt || '').slice(0, 10)) + '</div>' +
      '<div class="list-row"><span>Réel</span><strong>' + D6.fmtFCFA(u.realBalance) + '</strong></div>' +
      '<div class="list-row"><span>Démo</span><strong>' + D6.fmtFCFA(u.demoBalance) + '</strong></div>' +
      '<div class="field"><label>' + t('adjustReason') + '</label><input id="adjMotif" maxlength="120" placeholder="bonus, correction…"></div>' +
      '<div class="field"><label>Montant libre ($)</label><input id="adjAmount" type="number" inputmode="decimal" min="0.01" step="0.01" value="100" placeholder="ex. 5, 50, 1000…"></div>' +
      '<div class="admin-adj-row">' +
      '<button class="mini ok" type="button" data-adj-act="credit" data-adj="' + u.id + '" data-mode="real">+ Créditer Réel</button>' +
      '<button class="mini bad" type="button" data-adj-act="debit" data-adj="' + u.id + '" data-mode="real">− Débiter Réel</button>' +
      '<button class="mini bad" type="button" data-suspend="' + u.id + '">Suspendre</button>' +
      '<button class="mini" type="button" data-adj="' + u.id + '" data-mode="demo" data-reset="1">Reset démo 1M</button>' +
      '</div>' +
      '<p class="hint-min">Le montant saisi crédite ou débite instantanément le solde RÉEL en base.</p>' +
      renderPlayerFinanceBlock(u);
    openModal('adminUserModal');
  }

  function setTradingLocked() {
    syncTradeButtons();
  }

  function applyOutcome(res) {
    if (!res) return;
    var id = res.trade && res.trade.id;
    if (id) {
      if (hudSeen[id]) return;
      hudSeen[id] = true;
    }
    var outcomeMode = (res.trade && res.trade.mode) === 'real' ? 'real' : 'demo';
    // Réel : le solde bouge seulement après settleOrder (vault). Pas de paint intermédiaire.
    if (outcomeMode !== 'real') updateBalance(true);
    if (res.voided) {
      toast(t('tieRefund'), 'tie');
      playNeutralTick();
    } else {
      showOutcomeToast(resultKind(res) === 'win', profitFromResult(res), id);
      if (res.won) {
        playWinChime();
        burstSparkle();
      } else {
        playLossThud();
      }
    }
    var uSettled = user();
    if (uSettled) {
      lastSettleAt = Date.now();
      lastSettleMode = (res.trade && res.trade.mode) || (uSettled.mode === 'real' ? 'real' : 'demo');
      try {
        sessionStorage.setItem('oro_ledger', JSON.stringify({
          uid: uSettled.id,
          email: uSettled.email || '',
          real: D6.Store.realBalance ? D6.Store.realBalance(uSettled) : 0,
          demo: D6.Store.demoBalance(uSettled),
          mode: lastSettleMode,
          at: lastSettleAt
        }));
      } catch (eLed) { /* ignore */ }
      // Fix solde réel : ne PAS verrouiller le réel ici — le serveur (settleOrder) décide.
      lockBalanceOptimistic(
        D6.Store.demoBalance(uSettled),
        null,
        12000
      );
    }
    maybeConvertPrompt();
    noteSettledForTip(lastSettleMode);
    maybeLossStreakTip(user(), lastSettleMode);
    patchHistorySoon();
    syncTradeButtons();
    // Le résultat vient déjà du serveur (engine.js → settleOrder). Ici on applique
    // seulement le solde officiel qu'il a renvoyé : plus aucun « j'ai gagné » envoyé.
    if (D6.Api && D6.Api.token() && id) {
      var trade = res.trade || {};
      var settleMode = trade.mode || lastSettleMode;
      function applySettledVault(remote) {
        if (watchBan(remote)) {
          D6.holdRemote = false;
          return true;
        }
        if (remote && remote.ok && remote.vault && settleMode === 'real') {
          clearStakeReserve();
          var srvReal = Number(remote.vault.real);
          if (isFinite(srvReal) && srvReal >= 0) {
            applyOfficialReal(srvReal, {
              fromMe: true,
              force: true,
              fromTrade: true,
              allowRaise: true,
              allowZero: srvReal <= 0.009
            });
            updateBalance(true);
          }
          D6.holdRemote = false;
          return true;
        }
        return false;
      }
      function forceMeReal() {
        return D6.Api.post('me', {}, 20000).then(function (meRemote) {
          if (meRemote && meRemote.ok && meRemote.vault && meRemote.vault.real != null) {
            var meReal = Number(meRemote.vault.real);
            applyOfficialReal(meReal, {
              fromMe: true,
              force: true,
              fromTrade: true,
              allowRaise: true,
              allowZero: isFinite(meReal) && meReal <= 0.009
            });
            updateBalance(true);
          }
          D6.holdRemote = false;
        }, function () { D6.holdRemote = false; });
      }
      if (settleMode === 'real' && !applySettledVault(res.remote)) forceMeReal();
      else if (settleMode !== 'real') D6.holdRemote = false;
    }
  }

  function execute(side) {
    var now = Date.now();
    var next = side === 'put' || side === 'sell' ? 'put' : 'call';
    lastExecGuard = now;
    lastExecSide = next;
    if (tradeQ.length >= (TRADE_Q_MAX || 9999)) return;
    // Chaque clic garde SA simulation, sa durée, son payout et son mode (démo / réel) au moment du
    // tap : des clics rapides encore en file ne partent plus sur une autre simulation choisie entre-temps.
    var uq = user();
    tradeQ.push({
      side: next,
      asset: uq ? assetId(uq) : '',
      dur: uq ? Number(uq.duration) : 0,
      pay: uq ? currentOdds(uq) : 0,
      mode: uq && uq.mode === 'real' ? 'real' : 'demo'
    });
    if (!IS_ANDROID || tradeQ.length === 1) playTradeOpen();
    pumpTradeQ();
  }

  function pumpTradeQ() {
    if (tradeQBusy) return;
    tradeQBusy = true;
    function tick() {
      if (!tradeQ.length) {
        tradeQBusy = false;
        return;
      }
      var u = user();
      if (!u) {
        tradeQ.length = 0;
        tradeQBusy = false;
        return;
      }
      var mode = u.mode === 'real' ? 'real' : 'demo';
      var open = D6.Engine.liveCount ? D6.Engine.liveCount(mode) : 0;
      var maxOpen = (D6.CONFIG && D6.CONFIG.MAX_OPEN) || 9999;
      if (maxOpen < 9000 && open >= maxOpen) {
        tradeQ.length = 0;
        tradeQBusy = false;
        syncTradeButtons();
        return;
      }
      var gap = Number((D6.CONFIG && D6.CONFIG.MIN_ORDER_MS) || 350);
      var wait = lastPlaceOkAt ? (gap - (Date.now() - lastPlaceOkAt)) : 0;
      if (wait > 16) {
        setTimeout(tick, Math.min(wait, 40));
        return;
      }
      var item = tradeQ.shift();
      // Mode changé (démo ↔ réel) depuis le clic : ce clic est annulé, jamais débité sur l'autre compte.
      if (item && typeof item === 'object' && item.mode !== mode) { setTimeout(tick, 0); return; }
      if (placeTradeNow(item)) lastPlaceOkAt = Date.now();
      setTimeout(tick, 0);
    }
    tick();
  }

  function placeTradeNow(item) {
    var side = item && typeof item === 'object' ? item.side : item;
    var sealed = item && typeof item === 'object' ? item : null;
    var u = user();
    if (!u) return false;
    var mode = u.mode === 'real' ? 'real' : 'demo';
    var open = D6.Engine.liveCount ? D6.Engine.liveCount(mode) : 0;
    var maxOpen = (D6.CONFIG && D6.CONFIG.MAX_OPEN) || 9999;
    if (maxOpen < 9000 && open >= maxOpen) {
      syncTradeButtons();
      return false;
    }
    var typed = D6.roundMoney(Number($('inputStake') && $('inputStake').value));
    if (!(typed >= (D6.CONFIG.MIN_STAKE || 1))) typed = D6.CONFIG.MIN_STAKE || 1;
    stake = typed;
    if ($('inputStake')) $('inputStake').value = String(stake);
    var have = availableStakeBalance(u, mode);
    if (have < stake) {
      toast(t('insufficient'), 'err', 2000);
      tradeQ.length = 0;
      return false;
    }
    var sealedDur = sealed && sealed.dur ? sealed.dur : Number(u.duration);
    var sealedPay = sealed && sealed.pay ? sealed.pay : currentOdds(u);
    var sealedAsset = sealed && sealed.asset ? sealed.asset : assetId(u);
    var realBefore = (mode === 'real' && D6.Store.realBalance) ? Number(D6.Store.realBalance(u)) : null;
    var demoBefore = (mode === 'demo' && D6.Store.demoBalance) ? Number(D6.Store.demoBalance(u)) : null;
    var res = D6.Engine.placeOrder(u, {
      side: side,
      stake: stake,
      duration: sealedDur,
      assetId: sealedAsset,
      payout: sealedPay
    });
    if (!res.ok) {
      if (isSilentTradeMsg(res.reason)) return false;
      if (/insuffisant|insufficient/i.test(String(res.reason || ''))) {
        toast(t('insufficient'), 'err', 2000);
        tradeQ.length = 0;
      }
      syncTradeButtons();
      return false;
    }
    if (D6.Chart && D6.Chart.applyOpenTradeVisual && res.trade) {
      D6.Chart.applyOpenTradeVisual(res.trade);
    }
    if (!IS_ANDROID && D6.Chart && D6.Chart.drawNow) D6.Chart.drawNow();
    updateBalance(true);
    updatePriceHud();
    patchHistorySoon();
    syncTradeButtons();
    if (mode === 'real' && realBefore != null && isFinite(realBefore) && D6.Api && D6.Api.token && D6.Api.token()) {
      // Affichage attendu après UNE mise (pas openSum ambigu) — évite le yo-yo 10→9→10.
      var reservedShow = D6.roundMoney(Math.max(0, realBefore - stake));
      armStakeReserve(reservedShow, stake, Math.max(20000, (Number(sealedDur) || 10) * 1000 + 12000));
      lockBalanceOptimistic(null, reservedShow, Math.max(15000, (Number(sealedDur) || 10) * 1000 + 8000));
    } else {
      lockBalanceOptimistic(
        mode === 'demo' ? D6.Store.demoBalance(u) : null,
        mode === 'real' ? (D6.Store.realBalance ? D6.Store.realBalance(u) : null) : null,
        Math.max(12000, (Number(sealedDur) || 10) * 1000 + 4000)
      );
    }
    if (D6.Api && D6.Api.token()) {
      // Le serveur fixe lui-même le prix d'entrée et la ligne objectif.
      var placeBody = {
        id: res.trade.id,
        stake: stake,
        side: side,
        duration: sealedDur,
        mode: mode,
        assetId: res.trade.assetId,
        payout: res.trade.payout || currentOdds(u),
        // v2359 : prix vu au clic (le serveur le prend s'il date de moins de 1,5 s) → ligne = rond, comme en démo.
        seenTick: res.seenTick
      };
      var placedTradeId = res.trade.id;
      function killUnfundedTrade(reason) {
        tradeQ.length = 0;
        if (D6.Engine && D6.Engine.abortOpenTrade) {
          D6.Engine.abortOpenTrade(user(), placedTradeId);
        }
        clearStakeReserve();
        if (mode === 'real' && realBefore != null && isFinite(realBefore)) {
          applyOfficialReal(realBefore, { fromTrade: true, force: true, allowZero: true });
        } else if (mode === 'demo' && demoBefore != null && isFinite(demoBefore) && D6.Store.setBalanceMode) {
          D6.holdPull = true;
          D6.Store.setBalanceMode(user(), 'demo', demoBefore);
          D6.holdPull = false;
        }
        updateBalance(true);
        syncTradeButtons();
        patchHistorySoon();
        var msg = String(reason || '');
        if (/insuffisant|insufficient/i.test(msg)) {
          toast(t('insufficient'), 'err', 2500);
        } else if (msg) {
          toast(msg, 'err', 2500);
        } else {
          toast(t('tradeFailed') || 'Mise non enregistrée', 'err', 2500);
        }
      }
      function applyPlacedVault(remote) {
        if (watchBan(remote)) return true;
        if (remote && remote.ok === false) {
          killUnfundedTrade(remote.reason || remote.error || '');
          return true;
        }
        if (!(remote && remote.ok && remote.order)) return false;
        // Ordre accepté : on s'aligne sur le vrai prix d'entrée / la ligne / l'expiration serveur.
        if (D6.Engine && D6.Engine.confirmTrade) D6.Engine.confirmTrade(placedTradeId, remote.order);
        if (mode === 'real') {
          clearStakeReserve();
          if (remote.vault && remote.vault.real != null && isFinite(Number(remote.vault.real))) {
            var srvReal = Number(remote.vault.real);
            applyOfficialReal(srvReal, { fromMe: true, force: true, allowZero: srvReal <= 0.009, fromTrade: true });
            updateBalance(true);
          } else {
            // Réponse « déjà enregistré » (retry) : relire le solde officiel.
            restoreRealFromServer();
          }
        }
        return true;
      }
      function restoreRealFromServer() {
        clearStakeReserve();
        return D6.Api.post('me', {}, 20000).then(function (meRemote) {
          if (meRemote && meRemote.ok && meRemote.vault && meRemote.vault.real != null) {
            var meReal = Number(meRemote.vault.real);
            applyOfficialReal(meReal, {
              fromMe: true,
              force: true,
              allowZero: isFinite(meReal) && meReal <= 0.009
            });
            updateBalance(true);
          } else if (realBefore != null && isFinite(realBefore)) {
            applyOfficialReal(realBefore, { fromTrade: true, force: true });
            updateBalance(true);
          }
        }, function () {
          if (realBefore != null && isFinite(realBefore)) {
            applyOfficialReal(realBefore, { fromTrade: true, force: true });
            updateBalance(true);
          }
        });
      }
      function postPlace(triesLeft) {
        var tPost = Date.now();
        return D6.Api.post('placeOrder', placeBody, 25000).then(function (remote) {
          if (remote && remote.ok === false) {
            killUnfundedTrade(remote.reason || 'Mise non enregistrée');
            return;
          }
          if (applyPlacedVault(remote)) return;
          if (triesLeft > 1) return postPlace(triesLeft - 1);
          // Succès ambigu (pas de vault) : ne pas crier « insuffisant » ni laisser un fantôme.
          killUnfundedTrade(remote && remote.reason ? remote.reason : 'Mise non enregistrée');
          if (mode === 'real') return restoreRealFromServer();
        }, function () {
          if (triesLeft > 1) return postPlace(triesLeft - 1);
          killUnfundedTrade('Mise non enregistrée');
          if (mode === 'real') return restoreRealFromServer();
        });
      }
      postPlace(3);
    }
    return true;
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

  // Minimum dépôt joueur = $5.00 (crypto). Carte & paiement instantané = $3.
  function minDeposit() {
    return D6.CONFIG.MIN_DEPOSIT || 5;
  }
  function minCardDeposit() {
    return 3;
  }

  function withdrawMinFor(method) {
    var map = (D6.CONFIG && D6.CONFIG.WITHDRAW_MINS) || {};
    var n = Number(map[method]);
    if (isFinite(n) && n > 0) return n;
    return 5;
  }

  function minWithdraw() {
    var method = ($('wdMethod') && $('wdMethod').value) || selectedOp || '';
    return withdrawMinFor(method);
  }

  function formatWdMin(min) {
    var s = t('withdrawMinDyn');
    if (!s || s === 'withdrawMinDyn') s = 'Minimum withdrawal: ${min}';
    return s.replace('${min}', D6.fmtMoney(min));
  }

  function formatWdMinErr(min) {
    var s = t('withdrawMinErrDyn');
    if (!s || s === 'withdrawMinErrDyn') s = t('withdrawMinErr') || 'The minimum withdrawal is ${min}.';
    return s.replace('${min}', D6.fmtMoney(min)).replace('$\u00a0\u00a03', D6.fmtMoney(min)).replace('$3', D6.fmtMoney(min));
  }

  function setDepositAmt(n) {
    var min = minDeposit();
    var amt = Math.max(min, D6.roundMoney(Number(n) || min));
    if ($('depositAmt')) $('depositAmt').value = String(amt);
    return amt;
  }

  function openDeposit(preMsg, method) {
    if (!requireAccount()) return;
    depositSendConfirmed = false;
    closeLangMenus();
    depositOp = 'wave';
    var min = minCardDeposit();
    if ($('depositAmt')) {
      $('depositAmt').value = String(min);
      $('depositAmt').min = String(min);
      $('depositAmt').placeholder = String(min);
    }
    document.querySelectorAll('.dep-amt-chip').forEach(function (chip) {
      chip.classList.toggle('on', Number(chip.getAttribute('data-amt')) === Number(min));
    });
    if (preMsg) toast(preMsg, 'err');
    var hint = $('depositModal') ? $('depositModal').querySelector('.hint-min') : null;
    if (hint) hint.textContent = 'Minimum $\u00a0\u00a03';
    setDepositPayMethod('card');
    resetOxaWallet();
    showDepositStep('select');
    paintDepositWagerNotes();
    closeDrawer();
    openModal('depositModal');
    // « Dépôt Express Crypto » : on arrive directement sur le choix de la crypto et le QR code.
    if (method === 'crypto') setDepositPayMethod('usdt');
  }

  var depositing = false;
  var depositWatch = 0;
  var payWindow = null;
  var depositApplied = false;
  var depositChecking = false;
  var depositRef = '';
  var depositReturn = null;
  var depositSendConfirmed = false;

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

  function payLangCountry() {
    var raw = String(navigator.language || navigator.userLanguage || '').toLowerCase().replace('_', '-');
    var map = {
      'pt-br': 'BR', 'en-ng': 'NG', 'en-gh': 'GH', 'en-ke': 'KE', 'en-za': 'ZA',
      'fr-ci': 'CI', 'fr-sn': 'SN', 'fr-bf': 'BF', 'fr-ml': 'ML', 'fr-tg': 'TG', 'fr-bj': 'BJ',
      'fr-cm': 'CM', 'fr-ga': 'GA', 'fr-cg': 'CG'
    };
    if (map[raw]) return map[raw];
    var m = raw.match(/^[a-z]{2}-([a-z]{2})$/);
    if (!m) return '';
    var cc = m[1].toUpperCase();
    if (cc === 'FR' || cc === 'US' || cc === 'GB') return '';
    return cc;
  }

  function cachePayCountry(cc) {
    cc = String(cc || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (cc.length !== 2 || cc === 'XX' || cc === 'T1') return '';
    try { sessionStorage.setItem('oro_pay_cc', cc); } catch (e) { /* ignore */ }
    return cc;
  }

  async function fetchPayCountryIp() {
    try {
      var hit = cachePayCountry(sessionStorage.getItem('oro_pay_cc') || '');
      if (hit) return hit;
    } catch (e0) { /* ignore */ }
    var sources = ['https://api.country.is/', 'https://ipapi.co/json/'];
    var i;
    for (i = 0; i < sources.length; i++) {
      try {
        var r = await fetch(sources[i], { cache: 'no-store', credentials: 'omit' });
        if (!r.ok) continue;
        var j = await r.json();
        var cc = String((j && (j.country_code || j.country)) || '');
        if (cc && String(cc).length <= 3) {
          var ok = cachePayCountry(cc);
          if (ok) return ok;
        }
      } catch (e1) { /* next */ }
    }
    return '';
  }

  async function detectPayCountry() {
    var ip = await fetchPayCountryIp();
    if (ip) return ip;
    var u = user() || {};
    var prof = String(u.country || u.countryIso || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (prof.length === 2) return prof;
    return payLangCountry();
  }

  fetchPayCountryIp();

  async function postFlwVerify(payload) {
    try {
      var r = await fetch('api/flutterwave/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });
      if (r.ok) return await r.json();
    } catch (e) { /* fallback */ }
    return D6.Api.post('flutterwaveVerify', payload, 20000);
  }

  function flwXofCountries() {
    return { CI: 1, SN: 1, BF: 1, ML: 1, TG: 1, BJ: 1 };
  }
  function flwXafCountries() {
    return { CM: 1, GA: 1, CG: 1, GQ: 1, CF: 1, TD: 1 };
  }
  function flwCfaCurrency(cc) {
    if (flwXofCountries()[cc]) return 'XOF';
    if (flwXafCountries()[cc]) return 'XAF';
    return '';
  }
  function usdToCfaInt(usd) {
    var rate = Number((D6.CONFIG && D6.CONFIG.USD_FCFA_RATE) || 600) || 600;
    return Math.max(100, Math.round(Number(usd || 0) * rate));
  }

  function normalizeFlwSession(session) {
    var s = session || {};
    var cur = String(s.currency || 'USD').toUpperCase();
    var amt = Number(s.amount) || 0;
    var usd = Number(s.amountUsd) || 0;
    if (!usd) usd = D6.roundMoney(Number($('depositAmt') && $('depositAmt').value) || minDeposit());
    if (cur === 'CFA' || cur === 'FCFA') cur = 'XOF';
    if (cur === 'XOF' || cur === 'XAF') {
      if (amt < 100) amt = usdToCfaInt(usd);
      amt = Math.round(amt);
    }
    s.currency = cur;
    s.amount = amt;
    return s;
  }

  function flwModalVisible() {
    return !!(document.querySelector('iframe[src*="flutterwave"], iframe[name*="checkout"], .flwp-container, #flwp-container, [class*="flw-checkout"]'));
  }

  function openFlwInline(session) {
    if (!window.FlutterwaveCheckout) {
      toast('Paiement carte indisponible pour le moment.', 'err');
      return;
    }
    session = normalizeFlwSession(session);
    var pub = String((session && session.public_key) || '');
    if (!pub || pub.indexOf('FLWPUBK') !== 0) {
      toast('Paiement carte indisponible pour le moment.', 'err');
      return;
    }
    if (!session.amount || session.amount <= 0) {
      toast('Montant de paiement invalide.', 'err');
      return;
    }
    depositApplied = false;
    closeModal('depositModal');
    var opened = false;
    var watchdog = setTimeout(function () {
      if (opened || flwModalVisible()) return;
      toast('Le paiement n\'a pas pu s\'ouvrir. Réessayez.', 'err', 6000);
      try { openModal('depositModal'); } catch (eR) { /* ignore */ }
    }, 6000);
    function markOpen() {
      opened = true;
      clearTimeout(watchdog);
    }
    try {
      var cfg = {
        public_key: pub,
        tx_ref: session.tx_ref || session.ref,
        amount: session.amount,
        currency: session.currency,
        customer: session.customer || {},
        customizations: session.customizations || { title: 'OROLADO' },
        redirect_url: session.redirect_url || ((location && location.origin) || 'https://orolado.com') + '/api/flutterwave/callback',
        callback: function (data) {
          markOpen();
          var txId = (data && (data.transaction_id || data.id)) || '';
          ensureApiToken().then(function (tok) {
            return postFlwVerify({
              token: tok || (D6.Api && D6.Api.token ? D6.Api.token() : ''),
              transaction_id: txId,
              tx_ref: session.tx_ref || session.ref || ''
            });
          }).then(function (remote) {
            applyDepositPaid(remote);
            if (!depositApplied) toast(t('depositPending') || 'Paiement en cours…', 'warn');
          }).catch(function () {
            toast(t('sessionInvalid'), 'err');
          });
        },
        onclose: function () { markOpen(); }
      };
      var payOpts = String(session.payment_options || '').trim();
      if (!payOpts && (session.currency === 'XOF' || session.currency === 'XAF')) {
        payOpts = 'card,mobilemoneyfranco';
      }
      if (payOpts) cfg.payment_options = payOpts;
      FlutterwaveCheckout(cfg);
      setTimeout(function () { if (flwModalVisible()) markOpen(); }, 700);
    } catch (e) {
      clearTimeout(watchdog);
      toast('Paiement carte indisponible pour le moment.', 'err');
    }
  }

  async function postFlutterwaveCheckout(payload) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 28000);
    try {
      var r = await fetch('api/flutterwave/checkout', {
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
      }
    } catch (e) {
      console.error('OROLADO flutterwave checkout', e);
    }
    clearTimeout(timer);
    return D6.Api.post('flutterwaveCheckout', payload, 28000);
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
    recvFresh = {};
    var u = user();
    var vault = remote.vault;
    if (!vault && remote.new_balance > 0) vault = { real: remote.new_balance };
    D6.holdDepositReal = true;
    if (vault && u) D6.Store.importRemote(u, vault);
    if (vault && vault.real != null) applyOfficialReal(vault.real, { allowRaise: true, force: true });
    u = user();
    if (u && vault) {
      var addAmt = Number(remote.amount || 0);
      u.realDepositTotal = (Number(u.realDepositTotal) || 0) + addAmt;
      var mult = (D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2;
      u.requiredWagering = Math.floor((Number(u.realDepositTotal) || 0) * mult);
      u.lastDepositAmount = addAmt;
      u.wagerLock = D6.roundMoney((Number(u.wagerLock) || 0) + addAmt);
      u.wagerNeed = D6.roundMoney((Number(u.wagerNeed) || 0) + addAmt * mult);
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
    metaTrack('Purchase', { value: Number(remote.amount) || 0, currency: 'USD' }, { eventID: String(remote.ref || remote.orderId || remote.trackId || '') });
    if (typeof playWinChime === 'function') playWinChime();
    announceDepositWager(false);
    return true;
  }

  function cryptoVerifyMsg(remote) {
    var code = remote && remote.code;
    if (code === 'invalid') return t('cryptoErrInvalid');
    if (code === 'reused') return t('cryptoErrReused');
    if (code === 'min') return t('depositMinErr');
    if (code === 'txid') return t('cryptoErrTx');
    if (code === 'session') return t('sessionExpiredMsg');
    return t('cryptoErrPending');
  }

  function fmtCryptoAmt(n) {
    return D6.fmtMoney(n);
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
    var copyOxa = $('btnUsdtCopy');
    if (copyOxa && !copyOxa.classList.contains('is-copied') && !copyOxa.querySelector('.copy-state')) {
      copyOxa.textContent = t('cryptoCopy');
    }
    if (lastUsdtCredit > 0) setCryptoOkCopy(lastUsdtCredit);
    paintDepositWagerNotes();
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
    el.textContent = L(msg) || '';
    el.className = 'wait-note' + (kind ? ' ' + kind : '');
  }

  function setWaitBusy(on) {
    var sp = $('depositWaitSpin');
    if (sp) sp.hidden = !on;
  }

  function openDepositWait(ref) {
    depositRef = ref || '';
    if ($('depositWaitTitle')) $('depositWaitTitle').textContent = t('depositWaitTitle').replace('{op}', opLabel());
    if ($('depositWaitRef')) $('depositWaitRef').textContent = ref ? (t('m_ref') + ' ' + ref) : '';
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
    if ($('depositWaitRef')) $('depositWaitRef').textContent = depositRef ? (t('m_ref') + ' ' + depositRef) : '';
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
    D6.holdDepositReal = true;
    if (vault && u) D6.Store.importRemote(u, vault);
    if (vault && vault.real != null) applyOfficialReal(vault.real, { allowRaise: true, force: true });
    u = user();
    if (u) {
      var addPaid = Number(remote.amount || 0);
      u.realDepositTotal = (Number(u.realDepositTotal) || 0) + addPaid;
      var mult = (D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2;
      u.requiredWagering = Math.floor((Number(u.realDepositTotal) || 0) * mult);
      u.lastDepositAmount = addPaid;
      u.wagerLock = D6.roundMoney((Number(u.wagerLock) || 0) + addPaid);
      u.wagerNeed = D6.roundMoney((Number(u.wagerNeed) || 0) + addPaid * mult);
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
    metaTrack('Purchase', { value: Number(remote.amount) || 0, currency: 'USD' }, { eventID: String(remote.ref || remote.tx_ref || '') });
    playWinChime();
    if ($('depositSuccessAmt')) $('depositSuccessAmt').textContent = D6.fmtMoney(remote.amount);
    closeModal('depositModal');
    announceDepositWager(false);
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
    { id: 'usdt', symbol: 'USDT', name: 'Tether', color: '#26A17B', mark: '₮', minUsd: 5, nets: ['TRC20', 'ERC20', 'BEP20'] },
    { id: 'usdc', symbol: 'USDC', name: 'USD Coin', color: '#2775CA', mark: '$', minUsd: 5, networkName: 'Ethereum Network' },
    { id: 'btc', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', mark: '₿', minUsd: 15, networkName: 'Bitcoin Network' },
    { id: 'eth', symbol: 'ETH', name: 'Ethereum', color: '#627EEA', mark: 'Ξ', minUsd: 15, networkName: 'Ethereum Network' },
    { id: 'trx', symbol: 'TRX', name: 'TRON', color: '#FF0013', mark: 'T', minUsd: 5, networkName: 'Tron Network' },
    { id: 'bnb', symbol: 'BNB', name: 'BNB', color: '#F3BA2F', mark: 'B', minUsd: 10, networkName: 'BNB Smart Chain' },
    { id: 'sol', symbol: 'SOL', name: 'Solana', color: '#14F195', mark: 'S', minUsd: 10, networkName: 'Solana Network' },
    { id: 'ltc', symbol: 'LTC', name: 'Litecoin', color: '#345D9D', mark: 'Ł', minUsd: 10, networkName: 'Litecoin Network' },
    { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633', mark: 'Ð', minUsd: 5, networkName: 'Dogecoin Network' },
    { id: 'xrp', symbol: 'XRP', name: 'XRP', color: '#346AA9', mark: 'X', minUsd: 10, networkName: 'XRP Ledger' },
    { id: 'pol', symbol: 'POL', name: 'Polygon', color: '#8247E5', mark: 'P', minUsd: 5, networkName: 'Polygon Network' },
    { id: 'shib', symbol: 'SHIB', name: 'Shiba Inu', color: '#FFA409', mark: 'S', minUsd: 5, networkName: 'BNB Smart Chain' },
    { id: 'gram', symbol: 'GRAM', name: 'Gram (TON)', color: '#0098EA', mark: 'G', minUsd: 5, networkName: 'TON Network' },
    { id: 'xmr', symbol: 'XMR', name: 'Monero', color: '#FF6600', mark: 'M', minUsd: 10, networkName: 'Monero Network' },
    { id: 'dai', symbol: 'DAI', name: 'DAI', color: '#F5AC37', mark: 'D', minUsd: 5, networkName: 'Ethereum Network' },
    { id: 'bch', symbol: 'BCH', name: 'Bitcoin Cash', color: '#8DC351', mark: 'C', minUsd: 10, networkName: 'Bitcoin Cash Network' },
    { id: 'not', symbol: 'NOT', name: 'Notcoin', color: '#FFD21E', mark: 'N', minUsd: 5, networkName: 'TON Network' },
    { id: 'dogs', symbol: 'DOGS', name: 'Dogs', color: '#E8A317', mark: 'd', minUsd: 5, networkName: 'TON Network' }
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
    return Number(oxaMeta(oxaAsset).minUsd) || 5;
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
    usdtAmt = oxaMinUsd();
    return usdtAmt;
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
    if ($('oxaMinHint')) {
      var m = oxaMeta(oxaAsset);
      var need = oxaMinUsd();
      var net = oxaAsset === 'usdt' ? (' ' + (oxaNet || 'TRC20')) : '';
      var label = m.symbol + net;
      // Crypto : aucun minimum affiché — tout montant reçu est crédité au cours du moment.
      void need; void label;
      $('oxaMinHint').textContent = '';
      if ($('oxaMaxHint')) $('oxaMaxHint').textContent = '';
    }
    if ($('oxaNetLabel')) {
      $('oxaNetLabel').textContent = t('cryptoPending');
    }
  }

  function cachedOxaAddr() {
    var a = recvIsFresh(oxaCoin) ? (recvCache[oxaCoin] || '') : '';
    if (!a && oxaAsset === 'usdt' && recvIsFresh('usdt')) a = recvCache.usdt || '';
    return isStaticPlatAddr(a) ? '' : a;
  }

  function clearCryptoPreview() {
    liveDepositAddr = '';
    if ($('usdtAddr')) $('usdtAddr').textContent = '';
    var qr = $('usdtQr');
    if (qr) {
      qr.removeAttribute('src');
      qr.alt = '';
    }
  }

  function resetOxaWallet() {
    stopOxaPoll();
    if (oxaTimer) { clearTimeout(oxaTimer); oxaTimer = 0; }
    oxaInvoice = null;
    clearCryptoPreview();
    if ($('oxaWalletBox')) setHidden($('oxaWalletBox'), false);
    if ($('usdtBusy')) $('usdtBusy').hidden = true;
    closeOxaMenus();
  }

  function showDepositStep(step) {
    var select = $('depositStepSelect');
    var crypto = $('depositStepCrypto');
    var ok = $('depositStepCryptoOk');
    var box = $('depositBox');
    setHidden(select, step !== 'select');
    setHidden(crypto, step !== 'crypto');
    setHidden(ok, step !== 'ok');
    if (box) box.classList.toggle('is-crypto', step === 'crypto' || step === 'ok');
    setHidden($('closeDeposit'), step === 'crypto');
    paintDepositWagerNotes();
  }

  function setDepositPayMethod(method) {
    var card = $('payMethodCard');
    var usdt = $('payMethodUsdt');
    if (method === 'usdt') {
      depositPayMethod = 'usdt';
      oxaAsset = 'usdt';
      oxaNet = 'TRC20';
      oxaCoin = 'usdt_trc20';
      if (card) { card.classList.remove('on'); card.setAttribute('aria-checked', 'false'); }
      if (usdt) { usdt.classList.add('on'); usdt.setAttribute('aria-checked', 'true'); }
      paintOxaCoinBtn();
      syncOxaNetUi();
      enforceOxaMin();
      syncOxaLabels();
      showDepositStep('crypto');
      showCryptoInvoice(false);
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

  function rawCryptoAddr(s) {
    var a = String(s || '').trim();
    if (!a) return '';
    if (/^https?:\/\//i.test(a)) return '';
    a = a.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:/, '');
    var q = a.indexOf('?');
    if (q >= 0) a = a.slice(0, q);
    a = a.replace(/^\/+/, '').trim();
    if (!a || /[:/?#]/.test(a)) return '';
    return a;
  }

  function setCryptoQr(addr) {
    var raw = rawCryptoAddr(addr);
    var qr = $('usdtQr');
    if (!qr || !raw) return;
    var enc = encodeURIComponent(raw);
    var sources = [
      'api/qr.php?d=' + enc,
      'https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=' + enc,
      'https://quickchart.io/qr?size=160&margin=1&text=' + enc,
      'https://image-charts.com/chart?chs=160x160&cht=qr&chld=M|1&chl=' + enc
    ];
    var i = 0;
    qr.style.background = '#fff';
    qr.style.objectFit = 'contain';
    qr.style.display = 'block';
    qr.referrerPolicy = 'no-referrer';
    qr.alt = raw;
    function load() {
      if (i >= sources.length) return;
      qr.onerror = function () { i += 1; load(); };
      qr.onload = function () {
        if (!qr.naturalWidth) { i += 1; load(); return; }
        qr.onerror = null;
      };
      qr.src = sources[i];
    }
    load();
  }

  function paintOxaInvoice(inv) {
    oxaInvoice = inv;
    liveDepositAddr = rawCryptoAddr((inv && inv.address) || '');
    var cacheKey = String((inv && inv.coin) || oxaCoin || 'usdt_trc20');
    if (liveDepositAddr) {
      recvCache[cacheKey] = liveDepositAddr;
      recvFresh[cacheKey] = Date.now();
      if (oxaAsset === 'usdt' && (cacheKey === 'usdt_trc20' || cacheKey.indexOf('usdt_') === 0)) { recvCache.usdt = liveDepositAddr; recvFresh.usdt = Date.now(); }
    }
    var payCur = (inv && inv.payCurrency) || oxaMeta(oxaAsset).symbol;
    if ($('usdtPayAmt')) $('usdtPayAmt').textContent = '';
    if ($('usdtAddr') && liveDepositAddr) $('usdtAddr').innerHTML = styleOxaAddr(liveDepositAddr);
    if ($('oxaWalletBox')) setHidden($('oxaWalletBox'), false);
    if ($('oxaNetLabel')) {
      $('oxaNetLabel').textContent = t('cryptoPending');
    }
    if ($('oxaAddrLabel')) {
      var memo = String((inv && inv.memo) || '');
      var netLab = (inv && inv.network) || (oxaAsset === 'usdt' ? oxaNet : oxaNetworkName());
      $('oxaAddrLabel').textContent = t('m_addrOf').replace('{c}', payCur + (netLab ? ' ' + netLab : '')) + (memo ? ' · MEMO ' + memo : '');
    }
    syncOxaLabels();
    var wrap = $('oxaQrWrap');
    if (wrap) wrap.classList.remove('hidden');
    setCryptoQr(liveDepositAddr);
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
        }
      } catch (e) { /* keep waiting */ }
    }, 6000);
  }

  function paintPreviewAddr(addr) {
    var a = rawCryptoAddr(addr);
    if (!a) return;
    if ($('usdtAddr')) $('usdtAddr').innerHTML = styleOxaAddr(a);
    if ($('oxaWalletBox')) setHidden($('oxaWalletBox'), false);
    setCryptoQr(a);
  }

  function abandonUnconfirmedDeposit() {
    if (depositSendConfirmed) return;
    var oid = oxaInvoice && (oxaInvoice.orderId || oxaInvoice.ref);
    if (!oid || !(D6.Api && D6.Api.post)) return;
    D6.Api.post('abandonDeposit', { orderId: oid }).catch(function () { /* ignore */ });
  }

  async function showCryptoInvoice(confirmed) {
    if (depositPayMethod !== 'usdt') return;
    var min = oxaMinUsd();
    var typed = D6.roundMoney(Number($('depositAmt') && $('depositAmt').value) || 0);
    var amt = typed >= min ? typed : min;
    usdtAmt = amt;
    lastUsdtCredit = 0;
    oxaCoin = oxaCoinKey();
    var preview = cachedOxaAddr();
    if (preview) paintPreviewAddr(preview);
    else {
      clearCryptoPreview();
    }
    stopOxaPoll();
    if ($('oxaWalletBox')) setHidden($('oxaWalletBox'), false);
    if ($('oxaQrWrap')) setHidden($('oxaQrWrap'), false);
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
        coin: oxaCoin,
        confirmed: !!confirmed
      });
      if ((!remote || !remote.ok || !remote.address) && confirmed) {
        remote = await postOxaInvoice({
          token: tok || (D6.Api && D6.Api.token ? D6.Api.token() : ''),
          amount: amt,
          coin: oxaCoin,
          confirmed: true
        });
      }
      if (!remote || !remote.ok || !remote.address) {
        var rawReason = String((remote && remote.reason) || '');
        var safeReason = /underPaidCover|under_paid|must be|validation/i.test(rawReason)
          ? t('cryptoErrPending')
          : (rawReason || t('sessionInvalid'));
        if (note) {
          note.hidden = false;
          note.classList.add('is-err');
          note.textContent = safeReason;
        }
        toast(safeReason, 'err', 5200);
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
    var addr = rawCryptoAddr(liveDepositAddr);
    if (!addr || isStaticPlatAddr(addr)) {
      toast('Adresse en cours de génération…', '');
      showCryptoInvoice(true);
      return;
    }
    function ok() {
      toast('Adresse copiée !', 'ok');
      var btn = $('btnUsdtCopy');
      if (!btn) return;
      btn.classList.add('is-copied');
      if (!btn.querySelector('.copy-state')) {
        btn.textContent = t('cryptoCopied') || t('copied') || 'Copié';
      }
      setTimeout(function () {
        btn.classList.remove('is-copied');
        if (!btn.querySelector('.copy-state')) {
          btn.textContent = t('cryptoCopy') || t('copyId') || 'Copier';
        }
      }, 1800);
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
      depositSendConfirmed = true;
      metaTrack('InitiateCheckout', { value: oxaMinUsd(), currency: 'USD' });
      showCryptoInvoice(true);
      return;
    }
    depositSendConfirmed = true;
    confirmDeposit();
  }

  async function confirmDeposit() {
    if (depositing) return;
    var u = user();
    if (!u) {
      toast(t('sessionExpiredMsg'), 'info');
      return;
    }
    var min = minCardDeposit();
    var amt = D6.roundMoney(Number($('depositAmt') && $('depositAmt').value) || 0);
    if (amt < min) {
      showFieldError('depositAmt', t('m_minDeposit').replace('{n}', '3'));
      toast('Le dépôt minimum est de $\u00a0\u00a03.', 'err');
      return;
    }
    metaTrack('InitiateCheckout', { value: amt, currency: 'USD' });
    var btn = $('btnConfirmDeposit');
    depositing = true;
    if (btn) {
      btn.disabled = true;
      btn.classList.add('busy');
      btn.textContent = t('m_openingPay');
    }
    try {
      var tok = await ensureApiToken();
      if (!tok) {
        toast(t('sessionExpiredMsg'), 'info');
        return;
      }
      var cc = '';
      try { cc = await detectPayCountry(); } catch (eCc) { cc = ''; }
      var cfa = flwCfaCurrency(cc);
      var remote = await postFlutterwaveCheckout({
        token: tok,
        amount: amt,
        country: cc || '',
        lang: String(navigator.language || navigator.userLanguage || ''),
        currency: cfa || ''
      });
      if (remote && remote.ok === false) {
        console.error('OROLADO flutterwave fail', remote);
        toast(String((remote && remote.reason) || t('sessionInvalid')), 'err');
        return;
      }
      if (!remote || !remote.inline || !remote.public_key || !remote.tx_ref) {
        toast(String((remote && remote.reason) || 'Paiement carte indisponible pour le moment.'), 'err');
        return;
      }
      try { sessionStorage.setItem('oro_dep_ref', remote.tx_ref || remote.ref || ''); } catch (e) { /* ignore */ }
      try { localStorage.setItem('oro_dep_ref', remote.tx_ref || remote.ref || ''); } catch (e2) { /* ignore */ }
      openFlwInline(remote);
    } catch (err) {
      console.error('OROLADO deposit', err);
      toast(t('sessionInvalid'), 'err');
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

  function restoreSettleLedger() {
    var u = user();
    if (!u) return;
    try {
      var raw = sessionStorage.getItem('oro_ledger');
      if (!raw) return;
      var row = JSON.parse(raw);
      if (!row || row.uid !== u.id) return;
      var at = Number(row.at) || 0;
      if (!at || Date.now() - at > 86400000) return;
      lastSettleAt = at;
      lastSettleMode = row.mode || lastSettleMode;
    } catch (eRest) { /* ignore */ }
  }

  async function refreshRemoteVault() {
    var u = user();
    if (!u) return;
    if (D6.Api && D6.Api.token && D6.Api.token()) {
      var remote = await D6.Api.post('me', {});
      if (watchBan(remote)) return;
      if (!remote || !remote.ok || !user() || !remote.vault) return;
      var localDepBefore = Number(u.realDepositTotal) || 0;
      var incomingDep = Number(remote.user && remote.user.realDepositTotal) || 0;
      var newDeposit = incomingDep > localDepBefore + 0.009;
      if (newDeposit) {
        D6.holdDepositReal = true;
        setTimeout(function () { D6.holdDepositReal = false; }, 25000);
      }
      adoptWagerBook(remote);
      try { refreshWithdrawUi(); } catch (eWd) { /* ignore */ }
      var open = openRealStake();
      var localNow = D6.Store.realBalance ? Number(D6.Store.realBalance(user())) || 0 : 0;
      var remNow = Number(remote.vault.real);
      var depositRaise = newDeposit || (isFinite(remNow) && remNow > localNow + open + 0.009);
      // Pendant un trade : seul un vrai dépôt (hausse nette) peut passer.
      if (open > 0.009 && !depositRaise) return;
      if (tradeBalanceFrozen() && !depositRaise) return;
      if ((!open || depositRaise) && remote.vault.real != null) {
        D6.holdRemote = true;
        if (applyOfficialReal(remote.vault.real, { fromMe: true, allowRaise: true, force: !open || depositRaise })) updateBalance(false);
        setTimeout(function () { D6.holdRemote = false; }, 25000);
      } else {
        applyQuietVault(remote);
      }
      if (user() && user().mode === 'demo' && remote.vault.demo != null && D6.Store.setBalanceMode) {
        var demo = Number(remote.vault.demo);
        var demoOpen = 0;
        try {
          var dlist = (D6.Engine && D6.Engine.getTrades) ? D6.Engine.getTrades('demo') : [];
          var di;
          for (di = 0; di < dlist.length; di++) demoOpen += Number(dlist[di] && dlist[di].stake) || 0;
        } catch (eD) { demoOpen = 0; }
        var uDemo = user();
        var localDemo = Number(D6.Store.demoBalance(uDemo)) || 0;
        var demoFresh = !(Number(uDemo && uDemo.demoTrades) > 0) && localDemo <= 0.009;
        var demoBusy = demoOpen > 0 || !!D6.holdRemote || !!D6.holdPull
          || (lastSettleMode === 'demo' && lastSettleAt && Date.now() - lastSettleAt < 30000);
        if (!demoBusy && demoFresh && isFinite(demo) && demo > 0.009) {
          D6.holdPull = true;
          D6.Store.setBalanceMode(uDemo, 'demo', demo);
          D6.holdPull = false;
          updateBalance(false);
        }
      }
      return;
    }
    if (D6.Supabase && D6.Supabase.pullVault) {
      await D6.Supabase.pullVault();
      updateBalance(false);
    }
  }

  function realWithdrawBalance(u) {
    if (!u) return 0;
    var local = D6.Store.realBalance ? Number(D6.Store.realBalance(u)) : 0;
    if (!isFinite(local) || local < 0) local = 0;
    return local;
  }

  function refreshWithdrawUi() {
    var u = user();
    var gate = wagerStatus(u);
    if (lastServerWager && isFinite(Number(lastServerWager.required))) {
      if (Number(lastServerWager.done) > gate.done) gate.done = Number(lastServerWager.done);
      if (Number(lastServerWager.required) > 0) {
        gate.required = Number(lastServerWager.required);
        gate.left = Math.max(0, D6.roundMoney(gate.required - gate.done));
        gate.pct = gate.required > 0 ? Math.min(100, Math.round((gate.done / gate.required) * 100)) : 100;
      }
      var hasSlices = Array.isArray(lastServerWager.slices) && lastServerWager.slices.length;
      if (!hasSlices && isFinite(lastServerWager.free) && isFinite(lastServerWager.locked)) {
        gate.locked = Number(lastServerWager.locked);
        gate.free = Number(lastServerWager.free);
        gate.canWithdraw = gate.free > 0.009;
      }
    }
    var shown = gate.free != null ? gate.free : realWithdrawBalance(u);
    if ($('wdBalanceAmt')) $('wdBalanceAmt').textContent = D6.fmtFCFA(shown);
    else if ($('wdBalanceLabel')) $('wdBalanceLabel').textContent = 'Solde retirable\n' + D6.fmtFCFA(shown);
    var box = $('wdWagerBox');
    var fill = $('wdWagerFill');
    var txt = $('wdWagerText');
    var btn = $('btnSendWithdraw');
    if (box) {
      if (!(gate.locked > 0.009)) {
        box.classList.add('hidden');
        if (btn) btn.disabled = false;
      } else {
        box.classList.remove('hidden');
        if (fill) fill.style.width = String(gate.pct) + '%';
        if (txt) txt.textContent = L(gate.msg);
        if (btn) btn.disabled = !(gate.canWithdraw);
      }
    }
  }

  var wdOtpPending = false;
  var wdOtpTimer = null;
  var wdOtpLeft = 0;
  var WD_CRYPTO = { usdt: 1, btc: 1, eth: 1, trx: 1, sol: 1, ltc: 1, doge: 1 };
  var WD_MOBILE = {
    opay: 1, palmpay: 1, wave: 1, orange: 1, mtn: 1, mpesa: 1, moov: 1, airtel: 1,
    nequi: 1, gcash: 1, stcpay: 1, papara: 1, mercadopago: 1
  };
  var WD_EMAIL = { paypal: 1, skrill: 1, neteller: 1 };
  var WD_NAMES = {
    usdt: 'USDT TRC-20', trx: 'TRX', sol: 'SOL', bnb: 'Binance Pay', btc: 'BTC', eth: 'ETH',
    opay: 'OPay', palmpay: 'PalmPay', wave: 'Wave', orange: 'Orange', mtn: 'MTN',
    mpesa: 'M-Pesa', moov: 'Moov', airtel: 'Airtel', pix: 'PIX', mercadopago: 'Mercado Pago',
    nequi: 'Nequi', gcash: 'GCash', upi: 'UPI', stcpay: 'STC Pay', picpay: 'PicPay', papara: 'Papara',
    paypal: 'PayPal', skrill: 'Skrill', neteller: 'Neteller', payeer: 'Payeer', perfectmoney: 'Perfect Money',
    card: 'Carte bancaire', bank: 'Virement bancaire', revolut: 'Revolut'
  };
  var WD_DIAL_LOCK = {
    stcpay: '+966', nequi: '+57', opay: '+234', palmpay: '+234',
    picpay: '+55', papara: '+90', gcash: '+63'
  };
  var WD_DIAL_AFRICA = {
    wave: ['+225', '+221', '+223', '+226', '+227'],
    orange: ['+225', '+221', '+223', '+226', '+227', '+237'],
    mtn: ['+234', '+233', '+225', '+256', '+250', '+27', '+241', '+242', '+243', '+227', '+229', '+237'],
    moov: ['+225', '+221', '+223', '+226', '+227', '+228'],
    airtel: ['+254', '+256', '+255', '+250', '+243', '+227'],
    mpesa: ['+254', '+255', '+243', '+27', '+233', '+20', '+227']
  };
  /* Mercado Pago : uniquement les pays où le service existe vraiment. */
  var WD_MPAGO_COUNTRIES = [
    { code: '+54', flag: '\uD83C\uDDE6\uD83C\uDDF7', name: 'Argentine' },
    { code: '+55', flag: '\uD83C\uDDE7\uD83C\uDDF7', name: 'Br\u00e9sil' },
    { code: '+52', flag: '\uD83C\uDDF2\uD83C\uDDFD', name: 'Mexique' },
    { code: '+56', flag: '\uD83C\uDDE8\uD83C\uDDF1', name: 'Chili' },
    { code: '+57', flag: '\uD83C\uDDE8\uD83C\uDDF4', name: 'Colombie' },
    { code: '+598', flag: '\uD83C\uDDFA\uD83C\uDDFE', name: 'Uruguay' }
  ];
  var WD_DIAL_DEFAULT = {
    wave: '+221',
    orange: '+237',
    mtn: '+229',
    moov: '+228',
    mercadopago: '+54'
  };

  function showWithdrawStep(step) {
    setHidden($('wdStepGrid'), step !== 'grid');
    setHidden($('wdStepForm'), step !== 'form');
    setHidden($('btnWdBack'), step !== 'form');
    var wdBox = document.querySelector('#withdrawModal .withdraw-box');
    if (wdBox) wdBox.classList.toggle('is-wd-form', step === 'form');
    setHidden($('closeWithdraw'), step === 'form');
  }

  function updateWithdrawMinHint() {
    var min = minWithdraw();
    if ($('wdMinHint')) $('wdMinHint').textContent = formatWdMin(min);
    if ($('withdrawAmt')) {
      $('withdrawAmt').min = String(min);
      $('withdrawAmt').placeholder = String(min);
    }
    if ($('wdSelectedLabel')) $('wdSelectedLabel').textContent = WD_NAMES[selectedOp] || selectedOp || '';
  }

  function fillWdDial(method) {
    var sel = $('wdDial');
    var fixed = $('wdDialFixed');
    if (!sel) return;
    var lock = WD_DIAL_LOCK[method];
    var africa = WD_DIAL_AFRICA[method];
    var allowed = null;
    var list;
    if (method === 'mercadopago') {
      list = WD_MPAGO_COUNTRIES;
    } else {
      if (lock) allowed = [lock];
      else if (africa) allowed = africa;
      var codes = (D6.CONFIG && D6.CONFIG.COUNTRY_CODES) || [];
      list = allowed ? codes.filter(function (c) { return allowed.indexOf(c.code) >= 0; }) : codes;
      if (!list.length) list = codes;
    }
    sel.innerHTML = list.map(function (c) {
      return '<option value="' + c.code + '">' + c.flag + ' ' + c.code + ' · ' + c.name + '</option>';
    }).join('');
    if (lock) sel.value = lock;
    else if (WD_DIAL_DEFAULT[method]) sel.value = WD_DIAL_DEFAULT[method];
    else if (!africa && method !== 'mercadopago') sel.value = '+1';
    sel.disabled = !!lock;
    if (method === 'opay') {
      sel.classList.add('hidden');
      sel.disabled = true;
      sel.value = '+234';
      if (fixed) {
        fixed.classList.remove('hidden');
        fixed.textContent = '🇳🇬 +234';
      }
    } else {
      sel.classList.remove('hidden');
      if (fixed) fixed.classList.add('hidden');
    }
  }

  function fillWdBankCountry() {
    var sel = $('wdBankCountry');
    if (!sel) return;
    var list = (D6.CONFIG && D6.CONFIG.WD_BANK_COUNTRIES) || [];
    if (!list.length) {
      list = [{ flag: '\uD83C\uDDFA\uD83C\uDDF8', name: '\u00c9tats-Unis (USA)' }];
    }
    var current = sel.value;
    sel.innerHTML = list.map(function (c) {
      return '<option value="' + c.name + '">' + c.flag + ' ' + c.name + '</option>';
    }).join('');
    var usa = list[0] && list[0].name;
    if (current && list.some(function (c) { return c.name === current; })) sel.value = current;
    else sel.value = usa;
  }

  function setWithdrawMethod(op) {
    selectedOp = op || 'usdt';
    if ($('wdMethod')) $('wdMethod').value = selectedOp;
    document.querySelectorAll('.wd-card').forEach(function (el) {
      el.classList.toggle('on', el.getAttribute('data-wd') === selectedOp);
    });
    syncWithdrawDestUi();
    updateWithdrawMinHint();
    showWithdrawStep('form');
  }

  function syncWithdrawDestUi() {
    var method = ($('wdMethod') && $('wdMethod').value) || selectedOp || 'usdt';
    var label = $('wdDestLabel');
    var input = $('wdDestination');
    var destField = $('wdDestField');
    var mobileFields = $('wdMobileFields');
    var cardFields = $('wdCardFields');
    var bankFields = $('wdBankFields');
    var help = $('wdDestHelp');
    var isCrypto = !!WD_CRYPTO[method];
    var isMobile = !!WD_MOBILE[method];
    var isCard = method === 'card';
    var isBank = method === 'bank';
    var u = user();
    if (mobileFields) mobileFields.classList.toggle('hidden', !isMobile);
    if (cardFields) cardFields.classList.toggle('hidden', !isCard);
    if (bankFields) bankFields.classList.toggle('hidden', !isBank);
    if (destField) destField.classList.toggle('hidden', isMobile || isCard || isBank);
    if (method === 'revolut' || method === 'upi') {
      if (mobileFields) mobileFields.classList.add('hidden');
      if (destField) destField.classList.remove('hidden');
    }
    if (isMobile) {
      fillWdDial(method);
      var phoneLab = $('wdPhoneLabel');
      var phone = $('wdPhone');
      if (help) { help.textContent = ''; help.classList.add('hidden'); }
      if (phoneLab) { phoneLab.setAttribute('data-i18n', 'wdPhone'); phoneLab.textContent = t('wdPhone'); }
      if (phone) {
        phone.placeholder = 'Ex: 0700000000';
        phone.setAttribute('maxlength', '20');
        phone.setAttribute('inputmode', 'tel');
      }
      if ($('wdFullName') && u && !$('wdFullName').value) $('wdFullName').value = u.displayName || '';
      return;
    }
    if (isCard) {
      if (help) { help.textContent = ''; help.classList.add('hidden'); }
      if ($('wdCardName') && u && !$('wdCardName').value) $('wdCardName').value = u.displayName || '';
      return;
    }
    if (isBank) {
      if (help) { help.textContent = ''; help.classList.add('hidden'); }
      fillWdBankCountry();
      if ($('wdBankHolder') && u && !$('wdBankHolder').value) $('wdBankHolder').value = u.displayName || '';
      return;
    }
    if (!label || !input) return;
    if (help) { help.textContent = ''; help.classList.add('hidden'); }
    if (method === 'btc') {
      label.setAttribute('data-i18n', 'wdBtcAddr');
      label.textContent = t('wdBtcAddr');
      input.placeholder = 'Ex: bc1q...';
      input.type = 'text';
    } else if (isCrypto) {
      label.setAttribute('data-i18n', 'wdWallet');
      label.textContent = t('wdWallet');
      input.placeholder = t('m_addrPh');
      input.type = 'text';
    } else if (method === 'bnb') {
      label.setAttribute('data-i18n', 'wdBinanceId');
      label.textContent = t('wdBinanceId');
      input.placeholder = 'Ex: 284719302';
      input.type = 'text';
    } else if (method === 'perfectmoney') {
      label.setAttribute('data-i18n', 'wdPmAccount');
      label.textContent = t('wdPmAccount');
      input.placeholder = 'Ex: U12345678';
      input.type = 'text';
    } else if (method === 'payeer') {
      label.setAttribute('data-i18n', 'wdPayeerAccount');
      label.textContent = t('wdPayeerAccount');
      input.placeholder = 'Ex: P10000000';
      input.type = 'text';
    } else if (method === 'revolut') {
      label.setAttribute('data-i18n', 'wdRevolutId');
      label.textContent = t('wdRevolutId');
      input.placeholder = 'Ex: @user';
      input.type = 'text';
    } else if (WD_EMAIL[method]) {
      label.setAttribute('data-i18n', 'wdEmailAccount');
      label.textContent = t('wdEmailAccount');
      input.placeholder = t('idPh');
      input.type = 'email';
    } else if (method === 'pix' || method === 'picpay') {
      label.setAttribute('data-i18n', 'wdPix');
      label.textContent = t('wdPix');
      input.placeholder = 'Ex: 000.000.000-00';
      input.type = 'text';
    } else if (method === 'upi') {
      label.setAttribute('data-i18n', 'wdUpiId');
      label.textContent = t('wdUpiId');
      input.placeholder = 'Ex: utilisateur@upi';
      input.type = 'text';
    }
  }

  function openWithdraw() {
    if (!requireAccount()) return;
    selectedOp = '';
    if ($('wdMethod')) $('wdMethod').value = '';
    document.querySelectorAll('.wd-card').forEach(function (el) { el.classList.remove('on'); });
    if ($('withdrawAmt')) $('withdrawAmt').value = '';
    if ($('wdDestination')) $('wdDestination').value = '';
    if ($('wdOtpCode')) $('wdOtpCode').value = '';
    if ($('wdOtpField')) $('wdOtpField').classList.add('hidden');
    wdOtpPending = false;
    wdOtpLeft = 0;
    if (wdOtpTimer) { clearInterval(wdOtpTimer); wdOtpTimer = null; }
    showWithdrawStep('grid');
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

  /**
   * Fenêtres où l'on saisit un code ou un formulaire : elles ne se ferment QUE par la croix.
   * (Avant : un doigt à côté, ou la fenêtre « mots de passe » du téléphone, fermait tout.)
   */
  var STICKY_MODALS = { otpModal: 1, forgotModal: 1, passModal: 1, emailModal: 1, withdrawModal: 1, wdConfirmModal: 1, depositModal: 1, helpModal: 1 };
  function isStickyModal(el) {
    return !!(el && (STICKY_MODALS[el.id] || (el.getAttribute && el.getAttribute('data-sticky') === '1')));
  }

  // v2367 — Téléphone COUCHÉ (demande du propriétaire) : les fenêtres (connexion / inscription, recharger,
  // dépôt crypto, retrait, historiques, mot de passe, aide…) sont RÉDUITES pour tenir entières à l'écran,
  // au lieu de dépasser en bas. Élargies d'abord à tout l'écran, puis réduites (jamais sous 42 %) ;
  // au-delà, le reste défile. Profil : rangé en 2 colonnes (css/app.css), puis réduit de même.
  // Téléphone debout, tablette, PC : rien ne change (aucune réduction).
  var LS_FIT_SEL = '.modal-backdrop.active > .modal-box, #screenAuth:not(.hidden) .auth-card, #drawerProfile.drawer.on';
  var lsFitted = [];
  function lsPhoneLandscape() {
    var iw = window.innerWidth || 0;
    var ih = window.innerHeight || 0;
    return iw > ih && ih > 0 && ih <= 500 && !document.documentElement.classList.contains('is-tv');
  }
  function lsUnfit(el) {
    el.style.removeProperty('zoom');
    el.style.removeProperty('max-height');
    el.style.removeProperty('width');
    el.style.removeProperty('max-width');
    el.style.removeProperty('height');
  }
  function fitLandscapeBoxes() {
    var els = [];
    try { els = Array.prototype.slice.call(document.querySelectorAll(LS_FIT_SEL)); } catch (eSel) { els = []; }
    lsFitted.forEach(function (el) { if (els.indexOf(el) < 0 || !lsPhoneLandscape()) lsUnfit(el); });
    lsFitted = [];
    if (!lsPhoneLandscape()) return;
    var avail = (window.innerHeight || 0) - 12;
    els.forEach(function (el) {
      if (!el.offsetWidth) return;
      lsUnfit(el);
      el.style.setProperty('max-height', 'none', 'important');
      var nat = el.scrollHeight;
      if (nat > avail && avail > 100) {
        // Fenêtres : d'abord élargies à tout l'écran couché (le contenu s'étale, la fenêtre est moins
        // haute), puis réduites juste ce qu'il faut. (Connexion : la carte garde sa colonne.)
        var isDrawer = el.classList.contains('drawer');
        var widen = isDrawer || el.classList.contains('modal-box');
        // Profil : il occupe tout l'écran ; réduit, il garde toute la largeur (largeur / réduction).
        var fullW = isDrawer ? (window.innerWidth || 0) : Math.min((window.innerWidth || 0) - 24, 1100);
        var z = 1;
        var k;
        for (k = 0; k < 3; k++) {
          z = Math.max(0.42, Math.floor((avail / nat) * 1000) / 1000);
          if (!widen) break;
          el.style.setProperty('width', Math.floor(fullW / z) + 'px', 'important');
          el.style.setProperty('max-width', 'none', 'important');
          el.style.setProperty('zoom', String(z));
          nat = el.scrollHeight;
          if (nat * z <= avail + 1) break;
        }
        el.style.setProperty('zoom', String(z));
        el.style.setProperty('max-height', Math.floor(avail / z) + 'px', 'important');
        // Profil (panneau fixé sur tout l'écran) : une fois réduit, il doit garder toute la hauteur.
        if (isDrawer) {
          el.style.setProperty('height', Math.floor((window.innerHeight || 0) / z) + 'px', 'important');
          el.style.setProperty('max-height', Math.floor((window.innerHeight || 0) / z) + 'px', 'important');
        }
      } else {
        el.style.removeProperty('max-height');
      }
      lsFitted.push(el);
    });
  }
  var lsFitRaf = 0;
  function scheduleLandscapeFit() {
    if (lsFitRaf) return;
    lsFitRaf = requestAnimationFrame(function () {
      lsFitRaf = 0;
      try { fitLandscapeBoxes(); } catch (eFit) { /* ignore */ }
    });
  }
  try {
    new MutationObserver(scheduleLandscapeFit).observe(document.documentElement, { attributes: true, attributeFilter: ['class'], subtree: true });
    window.addEventListener('resize', function () { setTimeout(scheduleLandscapeFit, 120); });
    window.addEventListener('orientationchange', function () { setTimeout(scheduleLandscapeFit, 350); });
  } catch (eObs) { /* ignore */ }

  function openModal(id) {
    var el = $(id);
    if (!el) return;
    el.classList.add('active');
    el.style.removeProperty('visibility');
    el.style.setProperty('display', 'block', 'important');
    el.style.setProperty('pointer-events', 'auto', 'important');
  }
  function closeModal(id) {
    var el = $(id);
    if (el) {
      el.classList.remove('active');
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
    }
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
    var loc = (D6.I18N && D6.I18N.lang) || 'en';
    return d.toLocaleString(loc, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function financeKindLabel(kind) {
    return kind === 'deposit' ? t('txDeposit') : t('txWithdraw');
  }

  function isHiddenFinanceWithdraw(w) {
    if (!w) return true;
    var st = String(w.status || w.note || '').toLowerCase();
    if (w.adminHidden || w.playerHidden) return true;
    return st === 'silenced' || st === 'silent' || st === 'hidden' || st === 'deleted';
  }

  function normFinanceStatus(raw, kind) {
    var s = String(raw || '').toUpperCase();
    if (s === 'SILENCED' || s === 'SILENT' || s === 'HIDDEN' || s === 'DELETED') {
      return { code: 'HIDDEN', label: '', cls: 'pending' };
    }
    if (s === 'PAID' || s === 'APPROVED' || s === 'SUCCESS' || s === 'COMPLETED' || s === 'OK' || s === 'VALIDÉ' || s === 'VALIDE') {
      return { code: 'COMPLETED', label: t('txValidated'), cls: 'ok' };
    }
    if (s === 'REJECT' || s === 'REJECTED' || s === 'DENIED' || s === 'FAILED' || s === 'CANCELED' || s === 'CANCELLED') {
      // v2392 (propriétaire) : un retrait refusé l'est presque toujours à cause de coordonnées fausses →
      // on le dit clairement au joueur, avec quoi faire (affichage seulement).
      if (/withdraw/i.test(String(kind || '')) && t('txWdRejected') !== 'txWdRejected') {
        return { code: 'REJECTED', label: t('txWdRejected'), cls: 'bad', hint: t('txWdRejectedHint') };
      }
      return { code: 'REJECTED', label: t('txRejected'), cls: 'bad' };
    }
    if (s === 'UNFINISHED' || s === 'DRAFT' || s === 'ABANDONED' || s === 'INCOMPLETE') {
      return { code: 'UNFINISHED', label: t('txUnfinished') || 'Unfinished', cls: 'warn' };
    }
    if (s === 'REVIEW' || s === 'PENDING' || s === 'PROCESSING' || s === 'WAIT') {
      return { code: 'REVIEW', label: t('txPending'), cls: 'pending' };
    }
    return { code: s || 'PENDING', label: t('txPending'), cls: 'pending' };
  }

  function isPaidDepositStatus(raw) {
    var s = String(raw || '').toUpperCase();
    return s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS' || s === 'APPROVED' || s === 'OK' || s === 'VALIDÉ' || s === 'VALIDE';
  }

  function isRealWithdrawRow(w) {
    if (isHiddenFinanceWithdraw(w)) return false;
    var raw = (w && w.status && w.status.code) ? w.status.code : (w && (w.status || w.note));
    var s = String(raw || '').toUpperCase();
    if (!s || s === '[OBJECT OBJECT]') return true;
    return s !== 'DRAFT' && s !== 'UNFINISHED' && s !== 'ABANDONED' && s !== 'INCOMPLETE';
  }

  function gatewayLabel(raw) {
    var k = String(raw || '').toLowerCase().trim();
    if (!k || k === '—' || k === '-') return '—';
    if (k === 'instant pay' || k.indexOf('flutterwave') >= 0 || k === 'flw') return 'Instant Pay';
    if (k.indexOf('wave') >= 0) return 'Wave';
    if (k.indexOf('orange') >= 0 || k === 'om') return 'Orange Money';
    if (k.indexOf('mtn') >= 0 || k.indexOf('momo') >= 0) return 'MTN MoMo';
    if (k.indexOf('moov') >= 0) return 'Moov Money';
    if (k.indexOf('mpesa') >= 0) return 'M-Pesa';
    if (k.indexOf('airtel') >= 0) return 'Airtel';
    if (k.indexOf('paypal') >= 0) return 'PayPal';
    if (k === 'bank' || k.indexOf('virement') >= 0) return 'Virement bancaire';
    if (k.indexOf('crypto') >= 0 || k.indexOf('btc') >= 0 || k.indexOf('eth') >= 0 || k.indexOf('sol') >= 0 || k.indexOf('trx') >= 0 || k.indexOf('bnb') >= 0 || k.indexOf('ltc') >= 0 || k.indexOf('doge') >= 0 || k.indexOf('oxapay') >= 0 || k.indexOf('usdt') >= 0) return 'Crypto';
    if (k.indexOf('card') >= 0 || k.indexOf('visa') >= 0) return 'Carte bancaire';
    return String(raw);
  }

  var financeCache = { at: 0, html: '', userId: '' };

  function renderFinanceRows(tx, rows) {
    var seen = {};
    rows = rows.filter(function (r) {
      if (!r) return false;
      if (isHiddenFinanceWithdraw(r) || (r.status && r.status.code === 'HIDDEN')) return false;
      var kind = String(r.label || r.kind || '').toLowerCase();
      var isDep = kind.indexOf('d\u00e9p') >= 0 || kind.indexOf('dep') >= 0 || r.kind === 'deposit';
      var code = String((r.status && r.status.code) || r.status || '').toUpperCase();
      if (isDep && !isPaidDepositStatus(code)) return false;
      if (!isDep && !isRealWithdrawRow(r)) return false;
      if (!(Math.abs(Number(r.amount) || 0) > 0)) return false;
      var ref = String(r.ref || '');
      var k = (ref && ref !== '—' && ref !== 'ledger')
        ? (String(r.kind || r.label || '') + '|' + ref + '|' + r.amount)
        : (ref + '|' + r.amount + '|' + (r.at || '') + '|' + r.label);
      if (seen[k]) return false;
      seen[k] = 1;
      return true;
    });
    rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    rows = rows.slice(0, 20);
    var html = rows.length ? rows.map(function (r, rcfIdx) {
      var st = r.status || { label: t('txPending'), cls: 'pending' };
      return '<div class="tx-feed-row rc-open" data-rcf="' + rcfIdx + '"><div><div class="tx-type">' + r.label + '</div><div class="tx-meta">' +
        fmtWhen(r.at) + ' · ' + (r.gateway || '—') + ' · ' + (r.ref || '—') +
        '</div>' + (st.hint && st.hint !== 'txWdRejectedHint' ? '<div class="tx-hint">' + st.hint + '</div>' : '') +
        '</div><div style="display:flex;align-items:center;gap:8px"><div><div class="tx-amt ' + (r.amount >= 0 ? 'w' : 'l') + '">' +
        (r.amount >= 0 ? '+' : '') + D6.fmtFCFA(r.amount) + '</div><span class="tx-st ' + st.cls + '">' +
        st.label + '</span></div><button type="button" class="rc-dlbtn" aria-label="receipt">' + (D6.ReceiptIcon || '') + '</button></div></div>';
    }).join('') : '<div class="empty-feed">' + t('txEmpty') + '</div>';
    tx.innerHTML = html;
    bindFinanceReceipts(tx, rows);
    return html;
  }

  // Reçu d'une opération (dépôt, retrait, bonus) : moyen résumé (Crypto / Instant), jamais le détail.
  function bindFinanceReceipts(tx, rows) {
    tx.onclick = function (ev) {
      var rowEl = ev.target && ev.target.closest ? ev.target.closest('[data-rcf]') : null;
      if (!rowEl || !D6.Receipt) return;
      var r = rows[Number(rowEl.getAttribute('data-rcf'))];
      if (!r) return;
      var gw = String(r.gateway || '');
      var method = /instant/i.test(gw) ? 'Instant' : (/usdt|btc|eth|trx|sol|bnb|ton|ltc|xrp|doge|matic|link|avax|ada|crypto|oxa|binance/i.test(gw + ' ' + (r.ref || '')) ? 'Crypto' : '');
      D6.Receipt.money({ kind: r.kind, amount: r.amount, at: r.at, ref: r.ref, method: r.kind === 'bonus' ? '' : method, statusLabel: r.kind === 'withdraw' && r.status ? r.status.label : '' });
    };
  }

  function collectLocalFinanceRows() {
    var rows = [];
    var u = user();
    if (u && u.transactions) {
      (u.transactions || []).forEach(function (x) {
        if (x.type !== 'deposit' && x.type !== 'withdraw') return;
        var rawSt = x.status || x.note || '';
        if (x.type === 'deposit' && !isPaidDepositStatus(rawSt)) return;
        if (x.type === 'withdraw' && !isRealWithdrawRow(x)) return;
        rows.push({
          at: x.at || '',
          ref: x.id || '—',
          amount: Number(x.amount) || 0,
          status: normFinanceStatus(rawSt, x.type),
          label: financeKindLabel(x.type),
          kind: x.type,
          gateway: /^flw_/i.test(String(x.id || '')) ? 'Instant Pay' : gatewayLabel(x.operator || '')
        });
      });
    }
    (D6.Store.listWithdrawals ? D6.Store.listWithdrawals() : []).forEach(function (w) {
      if (!u || w.userId !== u.id) return;
      if (isHiddenFinanceWithdraw(w)) return;
      rows.push({
        at: w.at || '',
        ref: w.id || '—',
        amount: -Math.abs(Number(w.amount) || 0),
        status: normFinanceStatus(w.status, 'withdraw'),
        label: t('txWithdraw'),
        kind: 'withdraw',
        gateway: gatewayLabel(w.operator || '')
      });
    });
    return rows;
  }

  // Historique financier DURABLE : lu par le serveur dans la base (dépôts, bonus, retraits),
  // 50 lignes à la fois, « Voir plus » jusqu'à 2 000. Le téléphone ne sert plus que de secours.
  var financePage = { rows: [], total: 0, busy: false };

  function financeRowFromServer(r) {
    var kind = r.kind === 'withdraw' ? 'withdraw' : (r.kind === 'bonus' ? 'bonus' : 'deposit');
    var ref = String(r.ref || '—');
    // Bonus : référence affichée « BONUS-XXXXXXXX » (l'identifiant interne adm_… reste en base).
    if (kind === 'bonus') ref = 'BONUS-' + ref.replace(/^adm_/i, '').slice(0, 8).toUpperCase();
    // Dépôt crédité par l'équipe (identifiant interne adm_…) : affiché « OROLADO · DEP-XXXXXXXX » (affichage seulement).
    var byTeam = kind === 'deposit' && /^adm_/i.test(String(r.ref || ''));
    if (byTeam) ref = 'DEP-' + ref.replace(/^adm_/i, '').slice(0, 8).toUpperCase();
    return {
      at: r.at || '',
      ref: ref,
      amount: Number(r.amount) || 0,
      status: normFinanceStatus(r.status, kind),
      label: kind === 'bonus' ? (t('txBonus') !== 'txBonus' ? t('txBonus') : 'Bonus') : financeKindLabel(kind),
      kind: kind,
      gateway: (kind === 'bonus' || byTeam) ? 'OROLADO' : (/^flw_/i.test(String(r.ref || '')) ? 'Instant Pay' : gatewayLabel(r.gateway || ''))
    };
  }

  function paintFinancePage(tx) {
    var rows = financePage.rows;
    var html = rows.length ? rows.map(function (r, rcfIdx) {
      var st = r.status || { label: t('txPending'), cls: 'pending' };
      return '<div class="tx-feed-row rc-open" data-rcf="' + rcfIdx + '"><div><div class="tx-type">' + r.label + '</div><div class="tx-meta">' +
        fmtWhen(r.at) + ' · ' + (r.gateway || '—') + ' · ' + (r.ref || '—') +
        '</div>' + (st.hint && st.hint !== 'txWdRejectedHint' ? '<div class="tx-hint">' + st.hint + '</div>' : '') +
        '</div><div style="display:flex;align-items:center;gap:8px"><div><div class="tx-amt ' + (r.amount >= 0 ? 'w' : 'l') + '">' +
        (r.amount >= 0 ? '+' : '') + D6.fmtFCFA(r.amount) + '</div><span class="tx-st ' + st.cls + '">' +
        st.label + '</span></div><button type="button" class="rc-dlbtn" aria-label="receipt">' + (D6.ReceiptIcon || '') + '</button></div></div>';
    }).join('') : '<div class="empty-feed">' + t('txEmpty') + '</div>';
    if (rows.length < financePage.total) {
      html += '<button type="button" class="btn-ghost tx-more" id="txMore">' + (t('seeMore') !== 'seeMore' ? t('seeMore') : t('m_seeMore')) + '</button>';
    }
    tx.innerHTML = html;
    bindFinanceReceipts(tx, rows);
    var more = $('txMore');
    if (more) more.onclick = function () { loadFinancePage(tx, false); };
    financeCache.html = html;
    financeCache.at = Date.now();
  }

  function loadFinancePage(tx, reset) {
    if (financePage.busy || !(D6.Api && D6.Api.token && D6.Api.token())) return Promise.resolve(false);
    financePage.busy = true;
    var offset = reset ? 0 : financePage.rows.length;
    return D6.Api.post('financeHistory', { offset: offset, limit: 50 }).then(function (remote) {
      financePage.busy = false;
      if (!(remote && remote.ok && Array.isArray(remote.rows))) return false;
      var list = remote.rows.map(financeRowFromServer).filter(function (r) {
        return r.status.code !== 'HIDDEN' && Math.abs(r.amount) > 0;
      });
      financePage.rows = reset ? list : financePage.rows.concat(list);
      financePage.total = Number(remote.total) || financePage.rows.length;
      if ($('txFeed') === tx) paintFinancePage(tx);
      return true;
    }, function () {
      financePage.busy = false;
      return false;
    });
  }

  async function fillFinanceHistory() {
    var tx = $('txFeed');
    if (!tx) return;
    var u = user();
    var uid = u ? u.id : '';
    if (financeCache.html && financeCache.userId === uid && (Date.now() - financeCache.at) < 60000) {
      tx.innerHTML = financeCache.html;
      var moreC = $('txMore');
      if (moreC) moreC.onclick = function () { loadFinancePage(tx, false); };
      return;
    }
    financeCache.userId = uid;
    // Affichage immédiat avec ce que le téléphone connaît, puis la version serveur (la vraie).
    financeCache.html = renderFinanceRows(tx, collectLocalFinanceRows());
    financeCache.at = 0;
    var ok = await loadFinancePage(tx, true);
    if (!ok) financeCache.at = Date.now();
  }
  function bindAuth() {
    var authScreen = $('screenAuth');
    if (authScreen && !authScreen._oroNoScroll) {
      authScreen._oroNoScroll = true;
      authScreen.addEventListener('touchmove', function (e) {
        if (e.target && e.target.closest && e.target.closest('input,textarea,select,.terms-body')) return;
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
      authScreen.addEventListener('wheel', function (e) {
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
    }
    var eyeSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
    var eyeOffSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.1 3.9"/><path d="M6.1 6.1A17.5 17.5 0 0 0 2 12s3.5 7 10 7a10.3 10.3 0 0 0 4.2-.9"/></svg>';
    document.querySelectorAll('.pass-toggle').forEach(function (btn) {
      if (btn._oroEye) return;
      btn._oroEye = true;
      // Réagit dès que le doigt touche (pointerdown), SANS retirer le clavier : avant, le 1er
      // toucher fermait le clavier, la page bougeait et il fallait taper 2 à 4 fois.
      var lastEye = 0;
      function toggleEye(e) {
        if (e && e.cancelable) e.preventDefault();
        var now = Date.now();
        if (now - lastEye < 350) return;
        lastEye = now;
        var id = btn.getAttribute('data-pass');
        var input = id && $(id);
        if (!input) return;
        var focused = document.activeElement === input;
        var pos = focused && typeof input.selectionStart === 'number' ? input.selectionStart : null;
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = show ? eyeOffSvg : eyeSvg;
        btn.setAttribute('aria-label', show ? t('hidePass') : t('showPass'));
        if (focused) {
          try { input.focus({ preventScroll: true }); if (pos != null) input.setSelectionRange(pos, pos); } catch (eFocus) { /* ignore */ }
        }
      }
      btn.addEventListener('pointerdown', toggleEye);
      btn.addEventListener('click', toggleEye);
    });
    bindCopyPublicId();
    bindWalletCard();
    document.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.auth-tab').forEach(function (tEl) { tEl.classList.remove('on'); });
        tab.classList.add('on');
        setHidden($('formLogin'), tab.dataset.tab !== 'login');
        setHidden($('formRegister'), tab.dataset.tab !== 'register');
        clearErrors();
        if (tab.dataset.tab === 'register') metaTrack('Lead');
      });
    });
    $('formLogin').addEventListener('submit', async function (e) {
      e.preventDefault();
      clearErrors();
      // Retour immédiat au clic : le bouton passe en « Connexion… » et ne peut pas être recliqué.
      var loginBtn = $('formLogin') && $('formLogin').querySelector('button[type="submit"]');
      if (loginBtn && loginBtn.disabled) return;
      var loginLabel = loginBtn ? loginBtn.textContent : '';
      if (loginBtn) { loginBtn.disabled = true; loginBtn.classList.add('busy'); loginBtn.textContent = t('loginBusy'); }
      var res;
      try {
        res = await D6.Auth.login({ identifier: String($('loginId').value || '').trim().toLowerCase(), password: $('loginPass').value });
      } finally {
        if (loginBtn) { loginBtn.disabled = false; loginBtn.classList.remove('busy'); loginBtn.textContent = loginLabel; }
      }
      if (!res.ok) { showFieldError(res.field || 'loginId', res.reason); return; }
      setTimeout(function () { enterApp({ openFullscreen: true }); }, 80);
    });
    // v2395 — « Continuer avec Google » (Connexion et Inscription).
    document.querySelectorAll('[data-google-login]').forEach(function (gBtn) {
      bindAndroidTap(gBtn, async function () {
        clearErrors();
        // Inscription : même case « J'ai plus de 18 ans » que le bouton orange.
        if (gBtn.closest('#formRegister') && $('regAge') && !$('regAge').checked) {
          showFieldError('regAge', 'Vous devez confirmer avoir plus de 18 ans');
          return;
        }
        if (googleInApp()) {
          // Android : on rouvre le site dans Chrome, qui lance Google tout seul (?google=1).
          if (IS_ANDROID) {
            var gt = '';
            try { if (sessionStorage.getItem('oro_gtest') === '1') gt = '&gtest=1'; } catch (eGt) { /* ignore */ }
            location.href = 'intent://' + location.host + '/?google=1' + gt + '#Intent;scheme=https;package=com.android.chrome;end';
            return;
          }
          toast(t('googleInApp'), 'err', 6000);
          return;
        }
        document.querySelectorAll('[data-google-login]').forEach(function (b) { b.disabled = true; b.classList.add('busy'); });
        var res = await D6.Auth.googleStart();
        if (!res || !res.ok) {
          document.querySelectorAll('[data-google-login]').forEach(function (b) { b.disabled = false; b.classList.remove('busy'); });
          toast(t('googleFail'), 'err', 4000);
        }
      });
    });
    setupGoogleOfficial();
    // Retour arrière depuis la page Google : boutons de nouveau cliquables.
    window.addEventListener('pageshow', function () {
      document.querySelectorAll('[data-google-login]').forEach(function (b) { b.disabled = false; b.classList.remove('busy'); });
    });
    $('regPass2').addEventListener('input', function () {
      if ($('regPass').value && this.value && $('regPass').value !== this.value) showFieldError('regPass2', t('passMismatch'));
      else { $('err-regPass2').textContent = ''; $('err-regPass2').classList.remove('on'); }
    });
    $('formRegister').addEventListener('submit', async function (e) {
      e.preventDefault();
      clearErrors();
      if ($('regPass').value !== $('regPass2').value) { showFieldError('regPass2', t('passMismatch')); return; }
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
      if (!res.ok) {
        if (res.cooldown && (res.pendingOtp || res.email)) {
          openOtpModal({
            email: res.email || String(($('regEmail') && $('regEmail').value) || '').trim().toLowerCase(),
            displayName: String(($('regName') && $('regName').value) || '').trim(),
            resendIn: res.resendIn || res.retryIn || 60
          });
          setOtpError('Patientez une minute avant de relancer.', {
            wait: res.retryIn || res.resendIn || 60
          });
          return;
        }
        showFieldError(res.field || 'regName', res.reason);
        return;
      }
      if (res.pendingOtp) {
        openOtpModal(res);
        return;
      }
      metaTrack('CompleteRegistration');
      toast(t('accountCreated'), 'ok', 3000);
      enterApp({ openFullscreen: true });
      setTimeout(function () { if ($('toast')) placeToast($('toast')); }, 80);
    });
    var forgotOtpToken = '';
    var forgotTimer = null;
    var forgotLeft = 0;
    var forgotBusy = false;
    var forgotStep = 'email';

    function setForgotStep(step) {
      forgotStep = step;
      var form = $('formReset');
      if (form) form.setAttribute('data-step', step);
      if ($('forgotStepEmail')) $('forgotStepEmail').classList.remove('hidden');
      if ($('forgotStepOtp')) $('forgotStepOtp').classList.toggle('hidden', step === 'email');
      if ($('forgotStepNew')) $('forgotStepNew').classList.toggle('hidden', step !== 'password');
      if ($('forgotStepConfirm')) $('forgotStepConfirm').classList.toggle('hidden', step !== 'password');
      var btn = $('btnForgotPrimary');
      if (btn) {
        var key = step === 'otp' ? 'otpResend' : (step === 'password' ? 'save' : 'sendCode');
        btn.setAttribute('data-i18n', key);
        btn.textContent = t(key);
        btn.type = 'button';
      }
      tickForgotTimer();
    }
    function resetForgotModal() {
      forgotOtpToken = '';
      forgotBusy = false;
      if (forgotTimer) { clearInterval(forgotTimer); forgotTimer = null; }
      forgotLeft = 0;
      setForgotStep('email');
      if ($('resetId')) $('resetId').readOnly = false;
      if ($('resetOtp')) $('resetOtp').value = '';
      if ($('resetPass')) $('resetPass').value = '';
      if ($('resetPass2')) $('resetPass2').value = '';
      tickForgotTimer();
    }
    function tickForgotTimer() {
      var waiting = forgotLeft > 0;
      var link = $('btnForgotResend');
      if (link) {
        link.textContent = waiting
          ? t('otpResendIn').replace('{s}', String(forgotLeft))
          : t('otpResend');
        link.setAttribute('data-i18n', waiting ? 'otpResendIn' : 'otpResend');
        setResendWait(link, waiting);
      }
      var primary = $('btnForgotPrimary');
      if (primary && forgotStep === 'otp') {
        primary.textContent = waiting
          ? t('otpResendIn').replace('{s}', String(forgotLeft))
          : t('otpResend');
        primary.setAttribute('data-i18n', waiting ? 'otpResendIn' : 'otpResend');
        setResendWait(primary, waiting);
      } else if (primary) {
        setResendWait(primary, false);
      }
      var wait = $('forgotOtpTimer');
      if (wait) wait.textContent = '';
    }
    function startForgotCountdown(seconds) {
      forgotLeft = Math.max(0, parseInt(seconds, 10) || 60);
      if (forgotTimer) clearInterval(forgotTimer);
      tickForgotTimer();
      if (forgotLeft <= 0) return;
      forgotTimer = setInterval(function () {
        forgotLeft -= 1;
        if (forgotLeft <= 0) { clearInterval(forgotTimer); forgotTimer = null; forgotLeft = 0; }
        tickForgotTimer();
      }, 1000);
    }
    async function sendForgotCode() {
      if (forgotBusy) return;
      if (forgotLeft > 0 && forgotStep === 'otp') return;
      clearErrors();
      var email = String(($('resetId') && $('resetId').value) || '').trim().toLowerCase();
      if (!email) { showFieldError('resetId', t('enterEmail')); return; }
      forgotBusy = true;
      var res;
      try {
        res = await D6.Auth.forgotOtpStart(email);
      } finally {
        forgotBusy = false;
      }
      var wait = cooldownSeconds(res);
      if (res && !res.ok && wait > 0) {
        setForgotStep('otp');
        startForgotCountdown(wait);
        if ($('resetOtp')) $('resetOtp').focus();
        return;
      }
      if (!res || !res.ok) {
        if (isWaitReason(res && res.reason)) {
          setForgotStep('otp');
          startForgotCountdown(wait || 60);
          return;
        }
        // Adresse inconnue ou remplacée : le serveur le dit clairement (plus de faux « code envoyé »).
        showFieldError('resetId', (res && res.reason && !/^(unable|invalid)/i.test(res.reason)) ? res.reason : otpFailText());
        return;
      }
      setForgotStep('otp');
      startForgotCountdown(res.resendIn || 60);
      if ($('resetOtp')) { $('resetOtp').value = ''; $('resetOtp').focus(); }
      toast(t('codeSent'), 'ok');
    }
    async function verifyForgotCode() {
      if (forgotBusy) return;
      var code = String(($('resetOtp') && $('resetOtp').value) || '').replace(/\D/g, '').slice(0, 6);
      if (code.length !== 6) return;
      var email = String(($('resetId') && $('resetId').value) || '').trim().toLowerCase();
      forgotBusy = true;
      var res;
      try {
        res = await D6.Auth.forgotOtpVerify(email, code);
      } finally {
        forgotBusy = false;
      }
      if (!res || !res.ok) { showFieldError('resetOtp', otpFailText()); return; }
      clearErrors();
      forgotOtpToken = res.otpToken || 'ok';
      if (forgotTimer) { clearInterval(forgotTimer); forgotTimer = null; }
      forgotLeft = 0;
      tickForgotTimer();
      if ($('resetId')) $('resetId').readOnly = true;
      setForgotStep('password');
      if ($('resetPass')) $('resetPass').focus();
    }
    $('btnForgot').addEventListener('click', function () {
      clearErrors();
      resetForgotModal();
      $('resetId').value = $('loginId').value;
      openModal('forgotModal');
    });
    bindAndroidTap($('btnForgotPrimary'), function () {
      if (forgotStep === 'email') sendForgotCode();
      else if (forgotStep === 'otp') sendForgotCode();
      else if (forgotStep === 'password' && $('formReset')) {
        $('formReset').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
    bindAndroidTap($('btnForgotResend'), function () { sendForgotCode(); });
    if ($('resetOtp')) {
      $('resetOtp').addEventListener('input', function () {
        var code = String(this.value || '').replace(/\D/g, '').slice(0, 6);
        this.value = code;
        var err = $('err-resetOtp');
        if (err) { err.textContent = ''; err.classList.remove('on'); }
        if (code.length === 6) verifyForgotCode();
      });
    }
    $('formReset').addEventListener('submit', async function (e) {
      e.preventDefault();
      if (forgotStep !== 'password') {
        if (forgotStep === 'email') sendForgotCode();
        else if (forgotStep === 'otp') sendForgotCode();
        return;
      }
      clearErrors();
      if ($('resetPass').value !== $('resetPass2').value) {
        showFieldError('resetPass2', t('passMismatch'));
        return;
      }
      var res = await D6.Auth.forgotPasswordSet(
        String(($('resetId') && $('resetId').value) || '').trim().toLowerCase(),
        $('resetPass').value,
        $('resetPass2').value,
        forgotOtpToken
      );
      if (!res.ok) { showFieldError(res.field || 'resetPass', res.reason); return; }
      resetForgotModal();
      closeModal('forgotModal');
      toast(t('passUpdated'), 'ok');
    });
    $('closeForgot').addEventListener('click', function () {
      resetForgotModal();
      closeModal('forgotModal');
    });
    bindOtpModal();
  }

  var otpPending = null;
  var otpResendTimer = null;
  var otpResendLeft = 0;
  var otpWaitTimer = null;
  var otpWaitLeft = 0;

  function setOtpError(msg, opts) {
    opts = opts || {};
    var el = $('err-otpCode');
    if (!el) return;
    if (otpWaitTimer) {
      clearInterval(otpWaitTimer);
      otpWaitTimer = null;
    }
    otpWaitLeft = 0;
    var wait = parseInt(opts.wait, 10);
    if (!(wait > 0) && msg) {
      var m = String(msg).match(/(\d+)\s*seconde/i);
      if (m) wait = parseInt(m[1], 10);
    }
    if (wait > 0) {
      otpWaitLeft = wait;
      el.classList.add('on', 'otp-wait-live');
      function paintWait() {
        var s = Math.max(0, otpWaitLeft);
        el.textContent = s > 0 ? t('m_waitSec').replace('{n}', s) : '';
        el.classList.toggle('on', s > 0);
        if (s <= 0) {
          el.classList.remove('otp-wait-live');
          if (otpWaitTimer) { clearInterval(otpWaitTimer); otpWaitTimer = null; }
        }
      }
      paintWait();
      otpWaitTimer = setInterval(function () {
        otpWaitLeft -= 1;
        paintWait();
      }, 1000);
      // Aligner le bouton renvoi en bas sur le même compteur.
      try { startOtpResendCountdown(wait); } catch (eCd) { /* ignore */ }
      return;
    }
    el.classList.remove('otp-wait-live');
    el.textContent = L(msg) || '';
    el.classList.toggle('on', !!msg);
  }

  function updateOtpResendUi() {
    var btn = $('btnOtpResend');
    if (!btn) return;
    var waiting = otpResendLeft > 0;
    btn.textContent = waiting
      ? t('otpResendIn').replace('{s}', String(otpResendLeft))
      : t('otpResend');
    btn.setAttribute('data-i18n', waiting ? 'otpResendIn' : 'otpResend');
    setResendWait(btn, waiting);
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
          setOtpError(otpFailText());
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
          setOtpError(otpFailText());
          return;
        }
        closeOtpModal();
        metaTrack('CompleteRegistration');
        toast(t('accountCreated'), 'ok', 3000);
        enterApp({ openFullscreen: true });
        setTimeout(function () { if ($('toast')) placeToast($('toast')); }, 80);
      });
    }
    if ($('btnOtpResend')) {
      bindAndroidTap($('btnOtpResend'), async function () {
        if (!otpPending || !otpPending.email || otpResendLeft > 0) return;
        var btn = $('btnOtpResend');
        setResendWait(btn, true);
        var res;
        try {
          res = await D6.Auth.resendRegisterOtp(otpPending.email, otpPending);
        } catch (eResend) {
          res = null;
        }
        var wait = cooldownSeconds(res);
        if (res && res.ok) {
          setOtpError('');
          toast(t('codeSent'), 'ok');
          startOtpResendCountdown(res.resendIn || 60);
          if ($('otpCode')) {
            $('otpCode').value = '';
            $('otpCode').focus();
          }
          return;
        }
        if (wait > 0) {
          startOtpResendCountdown(wait);
          return;
        }
        setOtpError(otpFailText());
        setResendWait(btn, false);
      });
    }
  }

  function bindGlobalTradeClicks() {
    function hook(el, fn) {
      if (!el || typeof fn !== 'function') return;
      el.onclick = function () {
        try { fn(); } catch (err) { try { console.warn(err); } catch (e0) { /* ignore */ } }
      };
    }
    hook($('btnOpenDeposit'), function () { openDeposit(); });
    // (v2364 : clic ignoré s'il suit un doigt déjà compté sur ce bouton, voir plus bas.)
    hook($('btnCall'), function () { if (Date.now() - ($('btnCall').__oroTouchAt || 0) < 700) return; execute('call'); });
    // Retour visuel immédiat sur ACHETER / VENDRE (n'empêche aucun clic, même répété).
    ['btnCall', 'btnPut'].forEach(function (bid) {
      var b = $(bid);
      if (!b || b.__oroSent) return;
      b.__oroSent = true;
      b.addEventListener('pointerdown', function () {
        b.classList.remove('btn-sent');
        void b.offsetWidth;
        b.classList.add('btn-sent');
        clearTimeout(b.__oroSentT);
        b.__oroSentT = setTimeout(function () { b.classList.remove('btn-sent'); }, 500);
      }, { passive: true });
    });
    hook($('btnPut'), function () { if (Date.now() - ($('btnPut').__oroTouchAt || 0) < 700) return; execute('put'); });
    // v2364 : ACHETER / VENDRE au doigt qui se lève. Deux pouces sur l'écran en même temps (ACHETER puis
    // VENDRE très vite) : le navigateur n'envoie pas de « clic » (geste à deux doigts) → le trade était perdu.
    // Le « clic » qui suit un doigt déjà compté est ignoré (jamais deux trades pour une touche).
    [['btnCall', 'call'], ['btnPut', 'put']].forEach(function (pair) {
      var b = $(pair[0]);
      if (!b || b.__oroTouch) return;
      b.__oroTouch = true;
      b.addEventListener('touchend', function (e) {
        var tch = e.changedTouches && e.changedTouches[0];
        if (!tch) return;
        var r = b.getBoundingClientRect();
        if (tch.clientX < r.left || tch.clientX > r.right || tch.clientY < r.top || tch.clientY > r.bottom) return;
        b.__oroTouchAt = Date.now();
        try { if (e.cancelable) e.preventDefault(); } catch (eP) { /* ignore */ }
        try { execute(pair[1]); } catch (eX) { try { console.warn(eX); } catch (e0) { /* ignore */ } }
      }, { passive: false });
    });
    document.querySelectorAll('.asset-chip').forEach(function (chip) {
      hook(chip, function () {
        var u = user();
        if (u) selectAsset(chip.dataset.asset);
      });
    });
    document.querySelectorAll('.dur-chip').forEach(function (chip) {
      hook(chip, function () {
        var u2 = user();
        if (!u2) return;
        u2.duration = Number(chip.dataset.dur);
        D6.Store.saveUser(u2);
        updateDurationUi();
      });
    });
    document.querySelectorAll('.odds-chip').forEach(function (chip) {
      hook(chip, function () { setOdds(chip.dataset.odds); });
    });
    window.oroUi = {
      deposit: function () { try { openDeposit(); } catch (e) { /* ignore */ } },
      // v2414 — bouton « Jouer en démo » du Top 25 (Portail).
      mode: function (m) { try { switchMode(m === 'real' ? 'real' : 'demo'); } catch (e) { /* ignore */ } },
      call: function () { try { execute('call'); } catch (e) { /* ignore */ } },
      put: function () { try { execute('put'); } catch (e) { /* ignore */ } },
      asset: function (el) {
        try {
          var n = el && el.closest ? el.closest('[data-asset]') : el;
          var id = n && n.getAttribute && n.getAttribute('data-asset');
          if (id && user()) selectAsset(id);
        } catch (e) { /* ignore */ }
      },
      dur: function (el) {
        try {
          var n = el && el.closest ? el.closest('[data-dur]') : el;
          var u2 = user();
          if (!u2 || !n) return;
          u2.duration = Number(n.getAttribute('data-dur'));
          D6.Store.saveUser(u2);
          updateDurationUi();
        } catch (e) { /* ignore */ }
      },
      odds: function (el) {
        try {
          var n = el && el.closest ? el.closest('[data-odds]') : el;
          if (n) setOdds(n.getAttribute('data-odds'));
        } catch (e) { /* ignore */ }
      }
    };
  }

  function bindTrade() {
    function onClick(el, fn) {
      if (!el || typeof fn !== 'function') return;
      el.addEventListener('click', function (e) {
        try { fn(e); } catch (err) { try { console.warn(err); } catch (e0) { /* ignore */ } }
      });
    }
    onClick($('modeDemo'), function () { switchMode('demo'); });
    onClick($('modeReal'), function () { switchMode('real'); });
    onClick($('fsBtnDemo'), function () { switchMode('demo'); });
    onClick($('fsBtnReal'), function () {
      // Non inscrit : on quitte d'abord le plein écran (sinon il reste par-dessus l'inscription sur téléphone).
      if (isGuest()) { leaveTradeFullscreen(); requireAccount(); return; }
      switchMode('real');
    });
    document.querySelectorAll('.asset-chip').forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        var u = user();
        if (!u) return;
        selectAsset(chip.dataset.asset);
      });
    });
    document.querySelectorAll('.dur-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var u = user();
        if (!u) return;
        u.duration = Number(chip.dataset.dur); D6.Store.saveUser(u); updateDurationUi();
      });
    });
    document.querySelectorAll('.odds-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
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
            if ($('inputStake')) $('inputStake').value = stake;
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
        var stakeEl = $('inputStake');
        stake = Math.max(0, D6.roundMoney(Number(stakeEl ? stakeEl.value : stake) || stake || 0));
        if (a === 'back') {
          var digits = String(Math.floor(stake || 0));
          digits = digits.length <= 1 ? '0' : digits.slice(0, -1);
          stake = D6.roundMoney(Number(digits) || 0);
        } else if (add) {
          // Strict +N depuis la valeur affichée (0 ou vide → 1, pas 2).
          stake = D6.roundMoney((stake || 0) + add);
        } else if (a === 'x2') {
          stake = D6.roundMoney(Math.max(min, stake || min) * 2);
        } else if (a === 'half') {
          stake = Math.max(D6.roundMoney(Math.max(stake, min) / 2), min);
        }
        if (a !== 'back') {
          if (cap > 0 && stake > cap) stake = cap;
          // « − » descend jusqu'à 0 comme la touche effacer ; les autres boutons gardent la mise minimum.
          if (add < 0) { if (stake < 0) stake = 0; }
          else if (stake < min) stake = min;
        }
        if (stakeEl) stakeEl.value = stake;
        btn.classList.add('hit');
        setTimeout(function () { btn.classList.remove('hit'); }, 180);
        updatePayoutUi();
      });
    });
    if ($('inputStake')) {
      $('inputStake').addEventListener('input', function () {
        stake = Math.max(0, D6.roundMoney(Number(this.value) || 0));
        updatePayoutUi();
      });
      // Passage plein écran / rotation : la case change de largeur → on réajuste la taille du chiffre.
      try {
        if (window.ResizeObserver) {
          var stakeRoW = 0;
          new ResizeObserver(function (ents) {
            var w = Math.round((ents[0] && ents[0].contentRect.width) || 0);
            if (w === stakeRoW) return;
            stakeRoW = w;
            fitStakeText($('inputStake'));
          }).observe($('inputStake'));
        }
      } catch (eRoS) { /* ignore */ }
    }
    function tap(el, fn) {
      if (!el) return;
      var last = 0;
      el.addEventListener('click', function () {
        var now = Date.now();
        if (now - last < 280) return;
        last = now;
        try { fn(); } catch (eTap) { try { console.warn(eTap); } catch (e1) { /* ignore */ } }
      });
    }
    /* BUY/SELL : un seul branchement (hook dans bindGlobalTradeClicks). */
    try { paintDepositLabel(); } catch (eDepBtn) { /* ignore */ }
    onClick($('btnOpenDeposit'), function () { openDeposit(); });
    onClick($('balanceCard'), function (e) {
      if (e && e.target && e.target.closest && e.target.closest('#btnDemoTopup, .bal-plus')) return;
      refreshRemoteVault();
    });
    onClick($('fsTopBalance'), function () { refreshRemoteVault(); });
    onClick($('btnProfile'), function (e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      returnToProfile = false;
      openDrawer();
    });
    onClick($('btnCloseDrawer'), closeDrawer);
    onClick($('drawerBackdrop'), function () {
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
    bindHistDrawer($('btnHistTrade'), 'real');
    document.querySelectorAll('.hist-tab').forEach(function (btn) {
      if (btn._oroBound) return;
      btn._oroBound = true;
      bindAndroidTap(btn, function () {
        renderHistorySheet(btn.getAttribute('data-hist-mode') || 'real');
      });
    });
  }

  function bindModals() {
    function openTerms(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      openModal('termsModal');
    }
    if ($('btnOpenTerms')) {
      $('btnOpenTerms').addEventListener('click', openTerms);
      $('btnOpenTerms').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    }
    if ($('btnHelpTerms')) bindAndroidTap($('btnHelpTerms'), openTerms);
    if ($('closeTerms')) bindAndroidTap($('closeTerms'), function () { closeModal('termsModal'); });
    bindAndroidTap($('closeHistorySheet'), function () { closeModal('historySheet'); });
    $('btnOpenPass').addEventListener('click', function () {
      // Fermée par erreur alors qu'un code est en cours (moins de 9 min) : on reprend à la même
      // étape, sans renvoyer de code ni effacer ce qui était saisi.
      if (!(passStep !== 'email' && Date.now() - passSentAt < 9 * 60 * 1000)) resetPassModal();
      openFromProfile('passModal');
    });
    bindAndroidTap($('closePass'), function () { closeModal('passModal'); });
    bindCopyEmail();
    bindEmailChange();
    var passOtpToken = '';
    var passTimer = null;
    var passLeft = 0;
    var passBusy = false;
    var passStep = 'email';
    var passSentAt = 0;

    function setPassStep(step) {
      passStep = step;
      var form = $('formPassword');
      if (form) form.setAttribute('data-step', step);
      if ($('passStepOtp')) $('passStepOtp').classList.toggle('hidden', step === 'email');
      if ($('passStepNew')) $('passStepNew').classList.toggle('hidden', step !== 'password');
      if ($('passStepConfirm')) $('passStepConfirm').classList.toggle('hidden', step !== 'password');
      var btn = $('btnPassPrimary');
      if (btn) {
        var key = step === 'otp' ? 'otpResend' : (step === 'password' ? 'save' : 'sendCode');
        btn.setAttribute('data-i18n', key);
        btn.textContent = t(key);
        btn.type = 'button';
      }
      tickPassTimer();
    }
    function setPassOtpError(msg) {
      var el = $('err-passOtp');
      if (!el) return;
      el.textContent = L(msg) || '';
      el.classList.toggle('on', !!msg);
    }
    function tickPassTimer() {
      var waiting = passLeft > 0;
      var link = $('btnPassResend');
      if (link) {
        link.textContent = waiting
          ? t('otpResendIn').replace('{s}', String(passLeft))
          : t('otpResend');
        link.setAttribute('data-i18n', waiting ? 'otpResendIn' : 'otpResend');
        setResendWait(link, waiting);
      }
      var primary = $('btnPassPrimary');
      if (primary && passStep === 'otp') {
        primary.textContent = waiting
          ? t('otpResendIn').replace('{s}', String(passLeft))
          : t('otpResend');
        primary.setAttribute('data-i18n', waiting ? 'otpResendIn' : 'otpResend');
        setResendWait(primary, waiting);
      } else if (primary) {
        setResendWait(primary, false);
      }
      var wait = $('passOtpTimer');
      if (wait) wait.textContent = '';
    }
    function startPassCountdown(seconds) {
      passLeft = Math.max(0, parseInt(seconds, 10) || 60);
      if (passTimer) clearInterval(passTimer);
      tickPassTimer();
      if (passLeft <= 0) return;
      passTimer = setInterval(function () {
        passLeft -= 1;
        if (passLeft <= 0) { clearInterval(passTimer); passTimer = null; passLeft = 0; }
        tickPassTimer();
      }, 1000);
    }
    function resetPassModal() {
      passOtpToken = '';
      passBusy = false;
      if (passTimer) { clearInterval(passTimer); passTimer = null; }
      passLeft = 0;
      var u = user();
      if ($('passEmail')) $('passEmail').value = (u && u.email) || '';
      if ($('curPass')) $('curPass').value = '';
      if ($('passOtp')) $('passOtp').value = '';
      if ($('newPass')) $('newPass').value = '';
      if ($('newPass2')) $('newPass2').value = '';
      setPassStep('email');
      setPassOtpError('');
      tickPassTimer();
    }
    async function sendPassCode() {
      if (passBusy) return;
      if (passLeft > 0 && passStep === 'otp') return;
      var u = user();
      if (!u) return;
      passBusy = true;
      var res;
      try {
        res = await D6.Auth.requestPasswordOtp(u);
      } finally {
        passBusy = false;
      }
      var wait = cooldownSeconds(res);
      if (res && !res.ok && wait > 0) {
        setPassStep('otp');
        startPassCountdown(wait);
        if ($('passOtp')) $('passOtp').focus();
        return;
      }
      if (!res || !res.ok) {
        if (isWaitReason(res && res.reason)) {
          setPassStep('otp');
          startPassCountdown(wait || 60);
          return;
        }
        setPassOtpError(otpFailText());
        return;
      }
      setPassStep('otp');
      passSentAt = Date.now();
      startPassCountdown(res.resendIn || 60);
      setPassOtpError('');
      if ($('passOtp')) { $('passOtp').value = ''; $('passOtp').focus(); }
      toast(t('codeSent'), 'ok');
    }
    async function verifyPassCode() {
      if (passBusy) return;
      var code = String(($('passOtp') && $('passOtp').value) || '').replace(/\D/g, '').slice(0, 6);
      if (code.length !== 6) return;
      passBusy = true;
      var res;
      try {
        res = await D6.Auth.verifyPasswordOtp(user(), code);
      } finally {
        passBusy = false;
      }
      if (!res || !res.ok) { setPassOtpError(otpFailText()); return; }
      setPassOtpError('');
      passOtpToken = res.otpToken || 'ok';
      if (passTimer) { clearInterval(passTimer); passTimer = null; }
      passLeft = 0;
      tickPassTimer();
      setPassStep('password');
      if ($('newPass')) $('newPass').focus();
    }
    bindAndroidTap($('btnPassPrimary'), function () {
      if (passStep === 'email') sendPassCode();
      else if (passStep === 'otp') sendPassCode();
      else if (passStep === 'password' && $('formPassword')) {
        $('formPassword').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
    bindAndroidTap($('btnPassResend'), function () { sendPassCode(); });
    if ($('passOtp')) {
      $('passOtp').addEventListener('input', function () {
        var code = String(this.value || '').replace(/\D/g, '').slice(0, 6);
        this.value = code;
        setPassOtpError('');
        if (code.length === 6) verifyPassCode();
      });
    }
    $('formPassword').addEventListener('submit', async function (e) {
      e.preventDefault();
      if (passStep !== 'password') {
        if (passStep === 'email') sendPassCode();
        else if (passStep === 'otp') sendPassCode();
        return;
      }
      if (!passOtpToken) { toast(t('passOtpNeed') || 'Validate the email code', 'err'); return; }
      if ($('newPass2') && $('newPass').value !== $('newPass2').value) {
        toast(t('passMismatch'), 'err');
        return;
      }
      var res = await D6.Auth.changePassword(user(), '', $('newPass').value, passOtpToken);
      if (!res.ok) { toast(res.reason, 'err'); return; }
      resetPassModal();
      closeModal('passModal');
      toast(t('passUpdated') || 'Password updated successfully', 'ok');
    });
    $('btnFinance').addEventListener('click', openFinance);
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
      abandonUnconfirmedDeposit();
      resetOxaWallet();
      depositSendConfirmed = false;
      closeModal('depositModal');
    });
    if ($('payMethodCard')) $('payMethodCard').addEventListener('click', function () { setDepositPayMethod('card'); });
    if ($('payMethodUsdt')) $('payMethodUsdt').addEventListener('click', function () { setDepositPayMethod('usdt'); });
    if ($('btnExpressCrypto')) bindAndroidTap($('btnExpressCrypto'), function () { openDeposit(null, 'crypto'); });
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
        clearCryptoPreview();
        var preview = cachedOxaAddr();
        if (preview) paintPreviewAddr(preview);
        else showCryptoInvoice(false);
      });
    }
    document.querySelectorAll('#oxaNets .oxa-net').forEach(function (btn) {
      bindAndroidTap(btn, function () {
        oxaNet = btn.getAttribute('data-net') || 'TRC20';
        oxaCoin = oxaCoinKey();
        syncOxaNetUi();
        clearCryptoPreview();
        var preview = cachedOxaAddr();
        if (preview) paintPreviewAddr(preview);
        else showCryptoInvoice(false);
      });
    });
    document.addEventListener('click', function (e) {
      if (!$('oxaPickWrap') || $('oxaPickWrap').classList.contains('hidden')) return;
      if (e.target && e.target.closest && e.target.closest('#oxaPickWrap')) return;
      closeOxaMenus();
    });
    if ($('btnUsdtCopy')) bindAndroidTap($('btnUsdtCopy'), function () { copyUsdtAddr(); });
    if ($('btnUsdtBack')) bindAndroidTap($('btnUsdtBack'), function () {
      abandonUnconfirmedDeposit();
      resetOxaWallet();
      depositSendConfirmed = false;
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
        var email = ($('helpEmail') && $('helpEmail').value) || '';
        var subject = ($('helpSubject') && $('helpSubject').value) || '';
        var message = ($('helpMessage') && $('helpMessage').value) || '';
        if (!email || !subject || !message) return;
        // Avec ou sans compte : le message part toujours (le serveur limite les abus).
        var res = D6.Api ? await D6.Api.post('supportMessage', { email: email, subject: subject, message: message }) : null;
        if (!res || !res.ok) { toast((res && res.reason) || (t('helpRetry') !== 'helpRetry' ? t('helpRetry') : 'Envoi impossible pour le moment, réessayez dans un instant.'), 'err'); return; }
        closeModal('helpModal');
        if ($('helpEmail')) $('helpEmail').value = '';
        $('helpSubject').value = '';
        $('helpMessage').value = '';
        toast(t('helpSent'), 'ok');
      });
    }
    if ($('closeDepositSuccess')) bindAndroidTap($('closeDepositSuccess'), function () { closeModal('depositSuccessModal'); });
    if ($('btnDepositSuccessOk')) bindAndroidTap($('btnDepositSuccessOk'), function () { closeModal('depositSuccessModal'); });
    bindImmediateClose($('closeTip'), function () { markTipClosed(); closeModal('tipModal'); });
    bindImmediateClose($('btnTipOk'), function () { markTipClosed(); closeModal('tipModal'); });
    if ($('closeForgot')) bindAndroidTap($('closeForgot'), function () { closeModal('forgotModal'); });
    if ($('closeIosInstall')) bindAndroidTap($('closeIosInstall'), function () { closeModal('iosInstallModal'); });
    if ($('btnIosInstallOk')) bindAndroidTap($('btnIosInstallOk'), function () { closeModal('iosInstallModal'); });

    // Android : tap sur l'overlay ferme la modale (sans toucher au contenu).
    if (IS_ANDROID) {
      document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
        function closeIfOverlay(e) {
          if (!e || e.target !== bd) return;
          if (isStickyModal(bd)) return;
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
        var n = Number(this.value);
        document.querySelectorAll('.dep-amt-chip').forEach(function (chip) {
          chip.classList.toggle('on', Number(chip.getAttribute('data-amt')) === n);
        });
      });
    }
    document.querySelectorAll('.dep-amt-chip').forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDepositAmt(chip.getAttribute('data-amt'));
        document.querySelectorAll('.dep-amt-chip').forEach(function (c) {
          c.classList.toggle('on', c === chip);
        });
      });
    });
    if ($('btnWdBack')) {
      $('btnWdBack').addEventListener('click', function (e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        }
        selectedOp = '';
        if ($('wdMethod')) $('wdMethod').value = '';
        document.querySelectorAll('.wd-card').forEach(function (el) { el.classList.remove('on'); });
        showWithdrawStep('grid');
      });
      $('btnWdBack').addEventListener('touchstart', function (e) {
        if (e && e.cancelable) e.preventDefault();
        if (e) e.stopPropagation();
        selectedOp = '';
        if ($('wdMethod')) $('wdMethod').value = '';
        document.querySelectorAll('.wd-card').forEach(function (el) { el.classList.remove('on'); });
        showWithdrawStep('grid');
      }, { passive: false });
    }
    $('btnConfirmDeposit').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      onConfirmDepositClick();
    });
    document.querySelectorAll('.wd-card').forEach(function (card) {
      card.addEventListener('click', function () {
        setWithdrawMethod(card.getAttribute('data-wd') || 'usdt');
      });
    });
    if ($('wdCardNumber')) {
      $('wdCardNumber').addEventListener('input', function () {
        this.value = String(this.value || '').replace(/\D/g, '').slice(0, 16);
      });
    }
    if ($('wdOtpCode')) {
      $('wdOtpCode').addEventListener('input', function () {
        this.value = String(this.value || '').replace(/\D/g, '').slice(0, 6);
      });
    }
    if ($('btnWdOtpResend')) {
      bindAndroidTap($('btnWdOtpResend'), function () { resendWithdrawOtp(); });
    }
    if ($('closeWdConfirm')) $('closeWdConfirm').addEventListener('click', function () { closeModal('wdConfirmModal'); });
    if ($('btnWdConfirmOk')) $('btnWdConfirmOk').addEventListener('click', function () { closeModal('wdConfirmModal'); });
    function wdOtpUiSeconds(sent) {
      var n = Number(sent && (sent.resendIn != null ? sent.resendIn : sent.retryIn));
      if (!isFinite(n) || n <= 0) n = 60;
      if (n > 60) n = 60;
      return n;
    }
    function updateWdOtpResendUi() {
      var btn = $('btnWdOtpResend');
      if (!btn) return;
      var waiting = wdOtpPending && wdOtpLeft > 0;
      btn.textContent = waiting
        ? t('otpResendIn').replace('{s}', String(wdOtpLeft))
        : t('otpResend');
      btn.setAttribute('data-i18n', waiting ? 'otpResendIn' : 'otpResend');
      btn.disabled = !!waiting;
      if (typeof setResendWait === 'function') setResendWait(btn, waiting);
    }
    function refreshWdOtpHint() {
      var hint = $('wdOtpHint');
      if (hint) hint.textContent = t('wdOtpHint');
      updateWdOtpResendUi();
    }
    function showWdOtpField() {
      if ($('wdOtpField')) $('wdOtpField').classList.remove('hidden');
      refreshWdOtpHint();
    }
    function tickWdOtp() {
      if (wdOtpLeft <= 0) {
        if (wdOtpTimer) { clearInterval(wdOtpTimer); wdOtpTimer = null; }
        refreshWdOtpHint();
        return;
      }
      wdOtpLeft -= 1;
      refreshWdOtpHint();
    }
    async function resendWithdrawOtp() {
      if (wdOtpLeft > 0) return;
      var btn = $('btnWdOtpResend');
      if (btn && typeof setResendWait === 'function') setResendWait(btn, true);
      var sent = await D6.Api.post('withdrawOtp', {});
      if (watchBan(sent)) return;
      if (!sent || !sent.ok) {
        if (sent && sent.cooldown) {
          wdOtpPending = true;
          wdOtpLeft = wdOtpUiSeconds(sent);
          showWdOtpField();
          if (wdOtpTimer) clearInterval(wdOtpTimer);
          wdOtpTimer = setInterval(tickWdOtp, 1000);
          return;
        }
        toast((sent && sent.reason) || t('wdOtpErr'), 'err');
        updateWdOtpResendUi();
        return;
      }
      wdOtpPending = true;
      wdOtpLeft = wdOtpUiSeconds(sent);
      showWdOtpField();
      if (wdOtpTimer) clearInterval(wdOtpTimer);
      wdOtpTimer = setInterval(tickWdOtp, 1000);
      toast(t('wdOtpSent'), 'ok');
      if ($('wdOtpCode')) $('wdOtpCode').focus();
    }
    function showWithdrawConfirm(id, amount) {
      if ($('wdConfirmId')) $('wdConfirmId').textContent = id || '—';
      if ($('wdConfirmAmt')) $('wdConfirmAmt').textContent = D6.fmtFCFA(amount || 0);
      if ($('wdConfirmStatus')) $('wdConfirmStatus').textContent = t('wdConfirmStatus');
      openModal('wdConfirmModal');
    }
    $('btnSendWithdraw').addEventListener('click', async function () {
      var u = user();
      if (!u || !requireAccount()) return;
      var amount = D6.roundMoney(Number($('withdrawAmt').value) || 0);
      var method = ($('wdMethod') && $('wdMethod').value) || selectedOp || 'usdt';
      selectedOp = method;
      var isMobile = !!WD_MOBILE[method];
      var destination = '';
      var name = (u.displayName || 'Client').trim();
      var dial = WD_DIAL_LOCK[method] || '+1';
      if (isMobile) {
        destination = String(($('wdPhone') && $('wdPhone').value) || '').trim();
        name = String(($('wdFullName') && $('wdFullName').value) || '').trim();
        dial = String(($('wdDial') && $('wdDial').value) || WD_DIAL_LOCK[method] || '+1');
      } else if (method === 'upi') {
        dial = '+91';
        destination = String(($('wdDestination') && $('wdDestination').value) || '').trim();
      } else if (method === 'card') {
        destination = String(($('wdCardNumber') && $('wdCardNumber').value) || '').replace(/\D/g, '');
        name = String(($('wdCardName') && $('wdCardName').value) || '').trim();
      } else if (method === 'bank') {
        var bankCountry = String(($('wdBankCountry') && $('wdBankCountry').value) || '').trim();
        var bankName = String(($('wdBankName') && $('wdBankName').value) || '').trim();
        var iban = String(($('wdIban') && $('wdIban').value) || '').trim();
        name = String(($('wdBankHolder') && $('wdBankHolder').value) || '').trim();
        destination = [bankCountry, bankName, iban].filter(Boolean).join(' · ');
        dial = bankCountry || dial;
      } else {
        destination = String(($('wdDestination') && $('wdDestination').value) || '').trim();
      }
      var real = realWithdrawBalance(u);
      if (D6.Api && D6.Api.token && D6.Api.token()) {
        try {
          var liveMe = await D6.Api.post('me', {});
          if (watchBan(liveMe)) return;
          if (liveMe && liveMe.ok && liveMe.vault && liveMe.vault.real != null) {
            var liveReal = Number(liveMe.vault.real);
            if (isFinite(liveReal) && liveReal >= 0) {
              applyOfficialReal(liveReal, { fromMe: true, force: true });
              u = user() || u;
              refreshWithdrawUi();
              real = liveReal;
            }
          }
        } catch (eLive) { /* garde le solde local, le serveur revérifie */ }
      }
      var minWd = minWithdraw();
      var gate = wagerStatus(u);
      var free = Number(gate.free != null ? gate.free : real) || 0;
      if (amount > free + 0.009) { toast(gate.msg, 'err', 5000); return; }
      if (!method) { toast(t('wdMethod'), 'err'); return; }
      if (amount < minWd) { toast(formatWdMinErr(minWd), 'err'); return; }
      if (amount > real) { toast(t('insufficient'), 'err'); return; }
      if (method === 'card') {
        if (destination.length !== 16) { toast(t('wdCardErr'), 'err'); return; }
        if (name.length < 2) { toast(t('wdCardHolder'), 'err'); return; }
      } else if (method === 'bank') {
        if (!String(($('wdBankCountry') && $('wdBankCountry').value) || '').trim()
          || String(($('wdBankName') && $('wdBankName').value) || '').trim().length < 2
          || String(($('wdIban') && $('wdIban').value) || '').trim().length < 8
          || name.length < 2) {
          toast(t('wdDestErr'), 'err');
          return;
        }
      } else if (destination.length < 4) {
        toast(t('wdDestErr'), 'err');
        return;
      }
      if (isMobile && name.length < 2) { toast(t('wdFullName'), 'err'); return; }
      if (WD_EMAIL[method] && destination.indexOf('@') < 0) {
        toast(t('wdPaypalErr'), 'err');
        return;
      }
      var payload = {
        amount: amount,
        operator: method,
        method: method,
        methodName: WD_NAMES[method] || method,
        phone: destination,
        destination: destination,
        beneficiary: name,
        countryCode: dial,
        realDepositTotal: Number(u.realDepositTotal) || 0,
        realStakeVolume: Number(u.realStakeVolume) || 0,
        totalWageredSinceDeposit: Number(u.totalWageredSinceDeposit != null ? u.totalWageredSinceDeposit : u.realStakeVolume) || 0,
        requiredWagering: Number(u.requiredWagering) || Math.floor((Number(u.realDepositTotal) || 0) * ((D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2))
      };
      var otp = String(($('wdOtpCode') && $('wdOtpCode').value) || '').replace(/\D/g, '').slice(0, 6);
      var createdId = '';
      if (D6.Api && D6.Api.token()) {
        if (otp.length !== 6) {
          if (wdOtpPending) {
            showWdOtpField();
            toast(t('wdOtpNeed'), 'err');
            if ($('wdOtpCode')) $('wdOtpCode').focus();
            return;
          }
          var sent = await D6.Api.post('withdrawOtp', {});
          if (watchBan(sent)) return;
          if (!sent || !sent.ok) {
            if (sent && sent.cooldown) {
              wdOtpPending = true;
              wdOtpLeft = wdOtpUiSeconds(sent);
              showWdOtpField();
              if (wdOtpTimer) clearInterval(wdOtpTimer);
              wdOtpTimer = setInterval(tickWdOtp, 1000);
              toast(t('wdOtpNeed'), 'err');
              return;
            }
            toast((sent && sent.reason) || t('wdOtpErr'), 'err');
            return;
          }
          wdOtpPending = true;
          wdOtpLeft = wdOtpUiSeconds(sent);
          showWdOtpField();
          if (wdOtpTimer) clearInterval(wdOtpTimer);
          wdOtpTimer = setInterval(tickWdOtp, 1000);
          toast(t('wdOtpSent'), 'ok');
          if ($('wdOtpCode')) $('wdOtpCode').focus();
          return;
        }
        payload.otp = otp;
        var remote = await D6.Api.post('withdraw', payload);
        if (watchBan(remote)) return;
        if (remote && remote.server && !remote.ok) {
          if (remote.needOtp) {
            showWdOtpField();
            if (remote.expired) {
              wdOtpPending = false;
              wdOtpLeft = 0;
              if (wdOtpTimer) { clearInterval(wdOtpTimer); wdOtpTimer = null; }
              if ($('wdOtpCode')) $('wdOtpCode').value = '';
              refreshWdOtpHint();
            }
          }
          toast(remote.reason || t('wdOtpErr'), 'err');
          return;
        }
        wdOtpPending = false;
        wdOtpLeft = 0;
        if (wdOtpTimer) { clearInterval(wdOtpTimer); wdOtpTimer = null; }
        if (remote && remote.ok && remote.vault) D6.Store.importRemote(u, remote.vault, { official: true, allowZero: true });
        else {
          var local = D6.Store.requestWithdraw(u, amount, payload);
          if (!local.ok) { toast(local.reason, 'err'); return; }
          createdId = local.id || '';
        }
        createdId = createdId || (remote && remote.id) || '';
      } else {
        var res = D6.Store.requestWithdraw(u, amount, payload);
        if (!res.ok) { toast(res.reason, 'err'); return; }
        createdId = res.id || '';
      }
      closeModal('withdrawModal');
      updateBalance(true);
      showWithdrawConfirm(createdId, amount);
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
      b.addEventListener('click', function (e) { if (e.target === b && !isStickyModal(b)) b.classList.remove('active'); });
    });
  }

  function bindAdmin() {
    async function openAdmin() {
      if (!D6.Auth.isAdmin(user())) return;
      window.location.href = '/admin.php';
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
          var wdAct = wdBtn.getAttribute('data-wd-act') || (wdBtn.dataset.ok === '1' ? 'approve' : 'reject');
          if (D6.Api && D6.Api.token()) await D6.Api.post('resolveWithdraw', { id: wdBtn.dataset.wd, approve: wdAct === 'approve', act: wdAct });
          D6.Store.resolveWithdraw(wdBtn.dataset.wd, wdAct === 'approve', wdAct);
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
        var amt = Math.abs(D6.roundMoney(Number(rawAmt) || 0));
        if (!(amt >= 0.01)) { toast('Montant invalide', 'err'); return; }
        mode = 'real';
        delta = btn.dataset.adjAct === 'debit' ? -amt : amt;
      }
      if (D6.Api && D6.Api.token()) {
        var remote = await D6.Api.post('adjust', { userId: uid, delta: delta, mode: mode, motif: motif });
        if (!remote || !remote.ok) { toast((remote && remote.reason) || 'Erreur', 'err'); return; }
        if (mode === 'real' && delta > 0) {
          D6.holdDepositReal = true;
          setTimeout(function () { D6.holdDepositReal = false; }, 25000);
        }
        if (mode === 'real' && remote.vault && remote.vault.real != null) {
          var tgt = D6.Store.getUser(uid);
          if (tgt && D6.Store.setBalanceMode) D6.Store.setBalanceMode(tgt, 'real', remote.vault.real);
          if (tgt && delta > 0) {
            tgt.realDepositTotal = D6.roundMoney((Number(tgt.realDepositTotal) || 0) + delta);
            tgt.lastDepositAmount = D6.roundMoney(delta);
            tgt.requiredWagering = D6.roundMoney((Number(tgt.realDepositTotal) || 0) * 2);
            if (D6.Store.saveUser) D6.Store.saveUser(tgt);
          }
        }
      } else {
        toast(t('sessionInvalid'), 'err');
        return;
      }
      toast((delta >= 0 ? '+' : '−') + D6.fmtFCFA(Math.abs(delta)), 'ok');
      await renderAdmin();
      openAdminUser(uid);
      var meNow = user();
      if (meNow && meNow.id === uid) {
        try { await refreshRemoteVault(); } catch (eMe) { /* ignore */ }
      }
      updateBalance(false);
    }
    if ($('closeAdminUser')) $('closeAdminUser').addEventListener('click', closeAdminUser);
    if ($('adminUserModal')) {
      $('adminUserModal').addEventListener('click', function (e) {
        if (e.target === $('adminUserModal')) closeAdminUser();
      });
    }
    if ($('adminUserDetail')) {
      $('adminUserDetail').addEventListener('click', async function (e) {
        var sus = e.target.closest('[data-suspend]');
        if (sus && sus.dataset.suspend) {
          if (!window.confirm('Suspendre ce compte et couper sa session immédiatement ?')) return;
          var susRemote = await D6.Api.post('suspendUser', { userId: sus.dataset.suspend });
          if (!susRemote || !susRemote.ok) { toast((susRemote && susRemote.reason) || 'Erreur', 'err'); return; }
          toast('Compte suspendu', 'ok');
          closeAdminUser();
          await renderAdmin();
          return;
        }
        var btn = e.target.closest('[data-adj-act], [data-reset="1"]');
        if (!btn || !btn.dataset.adj) return;
        // Un seul envoi à la fois : un double toucher ne crédite plus deux fois.
        if (runAdminAdjust.busy) return;
        runAdminAdjust.busy = true;
        btn.disabled = true;
        try { await runAdminAdjust(btn); } finally { runAdminAdjust.busy = false; btn.disabled = false; }
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
        if (!tok) { toast(t('sessionExpiredMsg'), 'err'); return; }
        window.open('debug-maketou.php?lines=300&token=' + encodeURIComponent(tok), '_blank');
      });
    }
  }

  function bindInstall() {
    var installHideTimer = 0;
    function isIos() {
      return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    // Appli installée : iPhone (navigator.standalone), Android en mode « autonome » OU « plein écran »
    // (le manifeste demande d'abord le plein écran). Avant : le plein écran Android n'était pas reconnu
    // → « Installer Orolado » s'affichait DANS l'appli.
    function isStandalone() {
      try {
        if (window.navigator.standalone) return true;
        var mq = function (m) { return window.matchMedia('(display-mode: ' + m + ')').matches; };
        if (mq('standalone') || mq('fullscreen') || mq('minimal-ui')) return true;
        return localStorage.getItem('oro_app_installed') === '1' && /android/i.test(navigator.userAgent || '') && document.referrer.indexOf('android-app://') === 0;
      } catch (eSa) { return false; }
    }
    // Installation faite (Android) : plus jamais le message « Installer Orolado » sur ce téléphone.
    window.addEventListener('appinstalled', function () {
      try { localStorage.setItem('oro_install_dismissed', '1'); localStorage.setItem('oro_app_installed', '1'); } catch (eAi) { /* ignore */ }
      try { hideInstallBanner(); } catch (eAh) { /* ignore */ }
    });
    function isMobileUi() {
      return window.matchMedia('(max-width: 859px)').matches || /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
    }
    function installDismissedForever() {
      try {
        if (localStorage.getItem('oro_install_dismissed') === '1') return true;
        return (parseInt(localStorage.getItem('orolado_install_dismissed_count') || '0', 10) || 0) >= 2;
      } catch (e) { return false; }
    }
    function closeCount() {
      try { return Math.max(0, parseInt(localStorage.getItem('orolado_install_dismissed_count') || localStorage.getItem('oro_install_close_n') || '0', 10) || 0); } catch (e) { return 0; }
    }
    function bumpClose() {
      var n = closeCount() + 1;
      try {
        localStorage.setItem('orolado_install_dismissed_count', String(n));
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
          try {
            var choice = await deferredPrompt.userChoice;
            if (choice && choice.outcome === 'accepted') localStorage.setItem('oro_install_dismissed', '1');
          } catch (e) { /* ignore */ }
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
      // Force une nouvelle URL SW pour que les téléphones quittent v107 / vieux caches.
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      }).then(function () {
        return navigator.serviceWorker.register('sw.js?v=2000');
      }).catch(function () { /* ignore */ });
    }
    watchNewVersion();
  }

  /**
   * v2338 — Mise à jour automatique (comme les grandes plateformes) : un joueur qui laisse le site ouvert
   * des heures gardait l'ancienne version. Toutes les 5 min on lit le numéro de version en ligne (sw.js) ;
   * s'il est plus récent, la page se recharge discrètement quand le joueur revient sur l'onglet / l'appli,
   * jamais pendant un trade ouvert.
   */
  function watchNewVersion() {
    var mine = 0;
    try {
      var sc = document.querySelector('script[src*="js/app.js"]');
      var m = sc && /[?&]v=(\d+)/.exec(sc.getAttribute('src') || '');
      mine = m ? Number(m[1]) : 0;
    } catch (eV) { mine = 0; }
    if (!(mine > 0)) return;
    var newer = false;
    var reloading = false;
    function check() {
      if (newer || typeof fetch !== 'function') return;
      fetch('sw.js?nc=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r && r.ok ? r.text() : ''; })
        .then(function (txt) {
          var m2 = /orolado-v(\d+)/.exec(String(txt || ''));
          if (m2 && Number(m2[1]) > mine) newer = true;
        }).catch(function () { /* hors ligne : on réessaiera */ });
    }
    function openTrades() {
      try { return D6.Engine && D6.Engine.liveCount ? Number(D6.Engine.liveCount()) || 0 : 0; } catch (eL) { return 0; }
    }
    function maybeReload() {
      if (!newer || reloading || document.hidden || openTrades() > 0) return;
      reloading = true;
      try { location.reload(); } catch (eR) { reloading = false; }
    }
    setInterval(check, 5 * 60 * 1000);
    setTimeout(check, 60 * 1000);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) check();
      else maybeReload();
    });
    window.addEventListener('focus', maybeReload);
  }

  function lockGestures() { /* no global capture / stopPropagation */ }

  function enterApp(opts) {
    opts = opts || {};
    clearAuthTabIntent();
    markBootReady();
    try {
      var u = user();
      if (u && !isGuest(u)) {
        try { sessionStorage.removeItem('oro_demo_preview'); } catch (eClr) { /* ignore */ }
      }
      if (u) migrateLegacyDemo(u);
      if (u && !isGuest(u)) {
        if (D6.Auth && D6.Auth.seedFreshDemo) D6.Auth.seedFreshDemo(u);
        else {
          var demoNow = Number(D6.Store.demoBalance(u) || 0);
          if (demoNow <= 0 && !(Number(u.demoTrades) > 0)) {
            D6.Store.setBalanceMode(u, 'demo', D6.CONFIG.DEMO_START || 1000000);
          }
        }
      }
      restoreSettleLedger();
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
        var bootMode = u && u.mode === 'real' ? 'real' : 'demo';
        D6.Engine.getTrades(bootMode).forEach(function (t) { D6.Chart.applyOpenTradeVisual(t); });
      }
      if (u && u.mode === 'real') {
        var bootReal = Number(D6.Store.realBalance ? D6.Store.realBalance(u) : 0);
        if (bootReal > 0) updateBalance(false);
      } else {
        updateBalance(false);
      }
      renderHistory();
      D6.I18N.apply();
      showScreen('screenTrade');
      try {
        if (D6.Chart && D6.Chart.setAsset) D6.Chart.setAsset(assetId(u));
      } catch (eAsset) { try { console.warn(eAsset); } catch (eA) { /* ignore */ } }
      try {
        if (D6.Chart && D6.Chart.start) D6.Chart.start();
      } catch (eStart) { try { console.warn(eStart); } catch (eS) { /* ignore */ } }
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
          if (opts.openFullscreen) {
            setTimeout(function () {
              try {
                enterTradeFullscreen();
                bumpChartLayout();
              } catch (eFs) { try { console.warn('Mobile display fallback:', eFs); } catch (e4) { /* ignore */ } }
            }, 400);
          }
        } catch (eBootFs) {
          try { console.warn('Mobile display fallback:', eBootFs); } catch (e5) { /* ignore */ }
        }
      });
      refreshRemoteVault();
      startBanWatch();
      checkDepositReturn();
      syncTradeButtons();
      startAdminPresence();
      setTimeout(function () {
        try {
          var standalone = !!(window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: minimal-ui)').matches);
          var mobile = window.matchMedia('(max-width: 859px)').matches || /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
          var forever = false;
          try {
            forever = localStorage.getItem('oro_install_dismissed') === '1'
              || (parseInt(localStorage.getItem('orolado_install_dismissed_count') || '0', 10) || 0) >= 2;
          } catch (e0) { forever = false; }
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
    // Réaffecter width/height réalloue et efface le canvas plein écran. Sous
    // une rafale de redimensionnement, le faire à chaque événement coûtait
    // plus cher que l'animation elle-même.
    function resizeP() {
      var wP = window.innerWidth;
      var hP = window.innerHeight;
      if (pCanvas.width === wP && pCanvas.height === hP) return;
      pCanvas.width = wP;
      pCanvas.height = hP;
    }
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

  var chartBumpTimers = [];
  var chartBumpRaf = 0;
  var CHART_BUMP_DELAYS = [50, 120, 280, 500];

  function bumpChartLayout() {
    if (!(D6.Chart && D6.Chart.resize)) return;
    // Chaque événement de redimensionnement programmait cinq recalculs du
    // graphique. Sous rafale, des centaines de timers orphelins s'empilaient et
    // redessinaient le canvas bien après coup : on purge la salve précédente et
    // on ne garde qu'une passe par frame.
    while (chartBumpTimers.length) clearTimeout(chartBumpTimers.pop());
    if (chartBumpRaf) return;
    function once() {
      try {
        D6.Chart.resize();
        if (D6.Chart.drawNow) D6.Chart.drawNow();
      } catch (e) { /* ignore */ }
    }
    chartBumpRaf = requestAnimationFrame(function () {
      chartBumpRaf = 0;
      once();
      CHART_BUMP_DELAYS.forEach(function (ms) { chartBumpTimers.push(setTimeout(once, ms)); });
    });
  }

  var fsTradeHome = null;
  var fsTradeActive = false;

  function preferCssFullscreenOnly() {
    return true;
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

  function isFsDesktop() {
    try { return window.matchMedia('(min-width: 860px)').matches; } catch (e) { return false; }
  }
  function syncFsCapsule() {
    var mid = $('fsTopMid');
    var home = $('fsTopMidHome');
    var pad = $('fsPadCapsule');
    if (!mid || !home || !pad) return;
    // Design Galaxy : DÉMO / COMPTE RÉEL restent en haut du plein écran, sur PC comme sur téléphone
    // (dans la colonne de droite ils étaient écrasés entre ACHETER et VENDRE).
    var desktop = false;
    if (desktop) {
      if (mid.parentNode !== pad) pad.appendChild(mid);
    } else if (mid.parentNode !== home) {
      home.appendChild(mid);
    }
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
      overlay.style.removeProperty('display');
      overlay.style.removeProperty('pointer-events');
      overlay.style.removeProperty('visibility');
      overlay.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('fs-trade');
      document.documentElement.classList.add('is-fullscreen');
      document.body.classList.add('is-fullscreen');
      document.body.style.overflow = 'hidden';
      fsTradeActive = true;
      syncFsCapsule();
      try { setTimeout(placeFsStakeWin, 60); setTimeout(placeFsStakeWin, 400); } catch (ePl) { /* ignore */ }
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
      syncFsCapsule();
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
      setTimeout(function () { fillSafariGap(true); }, 350);
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

  function bindAssetColumnArrows() {
    // Plein écran couché : la colonne des indices a deux flèches (haut / bas) quand tout ne tient pas.
    // Utile sur télé (pointeur de télécommande) et partout ailleurs ; le défilement au doigt reste possible.
    var bar = document.querySelector('#fsTradeOverlay .asset-bar') || $('assetBar');
    var ov = $('fsTradeOverlay');
    if (!ov || ov.__oroArrows) return;
    ov.__oroArrows = true;
    function mk(dir) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fs-col-arrow fs-col-' + dir;
      b.setAttribute('aria-label', dir === 'up' ? 'Up' : 'Down');
      b.innerHTML = dir === 'up' ? '&#9650;' : '&#9660;';
      b.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var col = document.querySelector('#fsTradeOverlay .asset-bar');
        if (!col) return;
        try { col.scrollBy({ top: (dir === 'up' ? -1 : 1) * Math.max(80, col.clientHeight * 0.6), behavior: 'smooth' }); }
        catch (eS) { col.scrollTop += (dir === 'up' ? -1 : 1) * 120; }
      });
      ov.appendChild(b);
      return b;
    }
    var up = mk('up');
    var down = mk('down');
    function sync() {
      var col = document.querySelector('#fsTradeOverlay .asset-bar');
      var on = !!(col && ov.classList.contains('on') && col.scrollHeight > col.clientHeight + 4 && col.clientWidth < col.clientHeight);
      if (on) {
        var r = col.getBoundingClientRect();
        up.style.left = down.style.left = (r.left + r.width / 2 - 18) + 'px';
        up.style.top = (r.top + 2) + 'px';
        down.style.top = (r.bottom - 30) + 'px';
        up.classList.toggle('dim', col.scrollTop <= 2);
        down.classList.toggle('dim', col.scrollTop + col.clientHeight >= col.scrollHeight - 2);
      }
      up.style.display = down.style.display = on ? 'flex' : 'none';
    }
    setInterval(sync, 400);
    document.addEventListener('scroll', sync, true);
  }

  function bindFullscreenTrade() {
    var enter = $('btnChartFs');
    var exit = $('btnChartFsExit');
    try { bindAssetColumnArrows(); } catch (eArr) { /* ignore */ }
    if (IS_TV) {
      // Télé : la vue plein écran (actifs à gauche, graphique, gros boutons à droite) est la plus adaptée ;
      // elle s'ouvre toute seule une fois. « QUITTER » ramène à la vue normale (profil, inscription…).
      var tvTries = 0;
      var tvTimer = setInterval(function () {
        tvTries++;
        var tr = $('screenTrade');
        if (tr && !tr.classList.contains('hidden') && !fsTradeActive) {
          clearInterval(tvTimer);
          try { enterTradeFullscreen(); } catch (eTvFs) { /* ignore */ }
        } else if (fsTradeActive || tvTries > 40) {
          clearInterval(tvTimer);
        }
      }, 500);
    }
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
        if (fsTradeActive) bumpChartLayout();
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
      try { syncFsCapsule(); } catch (eC) { /* ignore */ }
      try { setTimeout(placeFsStakeWin, 120); } catch (ePw) { /* ignore */ }
      try { setTimeout(syncTopBtnHeight, 120); } catch (eTh) { /* ignore */ }
      try { bumpChartLayout(); } catch (eR) { try { console.warn(eR); } catch (e) { /* ignore */ } }
    });
  }

  D6.App = {
    onRemoteAccount: function () {
      updateBalance(false);
      fillProfile();
      patchHistorySoon();
    },
    updateBalance: updateBalance,
    getBalanceLocks: getBalanceLocks,
    tradeBalanceFrozen: tradeBalanceFrozen,
    boot: function () {
      if (D6.App._booted) return;
      D6.App._booted = true;
      try {
        try { unlockPointerLayers(); } catch (eUnlock) { /* ignore */ }
        try { if (window.oroPurgeDeadOverlays) window.oroPurgeDeadOverlays(); } catch (ePurge) { /* ignore */ }
        try { forceClickableTree(); } catch (eForce0) { /* ignore */ }
        try { captureUtmSource(); } catch (e0) { try { console.warn(e0); } catch (e) { /* ignore */ } }
        try { lockGestures(); } catch (e1) { try { console.warn('Mobile display fallback:', e1); } catch (e) { /* ignore */ } }
        try { fillLangBars(); } catch (e2) { /* ignore */ }
        try { paintDepositLabel(); } catch (eDep0) { /* ignore */ }
        try { fillCountrySelects(); } catch (e3) { /* ignore */ }
        try { D6.I18N.apply(); } catch (e4) { /* ignore */ }
        try { if (D6.I18N.refineFromGeo) D6.I18N.refineFromGeo(); } catch (e4b) { /* ignore */ }
        try { applyAndroidTradeHint(); } catch (e5) { /* ignore */ }
        try { bindAuth(); } catch (e6) { try { console.warn(e6); } catch (e) { /* ignore */ } }
        try { bindTrade(); } catch (e7) { try { console.warn(e7); } catch (e) { /* ignore */ } }
        try { bindGlobalTradeClicks(); } catch (e7b) { /* ignore */ }
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
          if (e.target.closest('#btnCall, #btnPut')) return;
          playTap();
        }
      }, { passive: true });
      document.addEventListener('touchstart', unlockAudio, { passive: true });
      document.addEventListener('click', unlockAudio, { passive: true });
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
        if (ev.key === 'Escape') {
          closeLangMenus();
          closeDrawer();
        }
      });
      function persistLiveTrades() {
        var uLive = user();
        if (uLive && D6.Engine.flushSettlements) {
          try { D6.Engine.flushSettlements(uLive); } catch (eF) { /* ignore */ }
        }
      }
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          persistLiveTrades();
          return;
        }
        unlockAudio();
        resumeAfterSleep();
      });
      window.addEventListener('pagehide', persistLiveTrades);
      window.addEventListener('freeze', persistLiveTrades);
      window.addEventListener('pageshow', function () {
        if (document.hidden) return;
        resumeAfterSleep();
      });
      document.addEventListener('resume', function () {
        if (!document.hidden) resumeAfterSleep();
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
          if (D6.Auth.current() && !isGuest(D6.Auth.current())) {
            enterApp();
            return;
          }
          var wantAuth = '';
          try { wantAuth = sessionStorage.getItem('oro_auth_tab') || ''; } catch (eWant) { wantAuth = ''; }
          if (wantAuth === 'register' || wantAuth === 'login') {
            showAuthScreen(wantAuth);
            return;
          }
          try { sessionStorage.setItem('oro_demo_preview', '1'); } catch (ePrev) { /* ignore */ }
          ensureGuest();
          enterApp();
        } catch (eFin) {
          try { console.warn('Mobile display fallback:', eFin); } catch (e) { /* ignore */ }
          try { ensureGuest(); enterApp(); } catch (e2) { /* ignore */ }
        }
      }
      if ($('btnGoLogin')) $('btnGoLogin').addEventListener('click', function () { showAuthScreen('login'); });
      if ($('btnGoRegister')) $('btnGoRegister').addEventListener('click', function () { showAuthScreen('register'); });
      if ($('brandLockup')) $('brandLockup').addEventListener('click', function () {
        try { sessionStorage.setItem('oro_demo_preview', '1'); } catch (eB) { /* ignore */ }
        if (D6.Auth.current() && !isGuest(D6.Auth.current())) { enterApp(); return; }
        ensureGuest();
        enterApp();
      });
      if ($('btnAuthBack')) $('btnAuthBack').addEventListener('click', function () {
        var pitch = $('authRealPitch');
        if (pitch) pitch.classList.add('hidden');
        try { sessionStorage.setItem('oro_demo_preview', '1'); } catch (ePrev) { /* ignore */ }
        ensureGuest();
        enterApp();
      });
      function onBalancePlusClick() {
        var u = user();
        if (!u || isGuest(u)) { requireAccount(); return; }
        if (u.mode === 'real') {
          openDeposit();
          return;
        }
        var target = D6.CONFIG.DEMO_START || 1000000;
        var cur = D6.Store.demoBalance(u);
        // Démo déjà pleine : rien ne se passe (plus de message « Démo déjà rechargé », à la demande du propriétaire).
        if (cur >= target) return;
        D6.Store.setBalanceMode(u, 'demo', target);
        updateBalance(true);
        // Plus de message « Démo rechargée : 1 000 000 $ » (le solde qui remonte suffit, à la demande du propriétaire).
      }
      if ($('btnDemoTopup')) $('btnDemoTopup').addEventListener('click', onBalancePlusClick);
      if ($('btnFsTopup')) $('btnFsTopup').addEventListener('click', onBalancePlusClick);
      if ($('btnFsMidPlus')) $('btnFsMidPlus').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        // Non inscrit : on quitte le plein écran puis page d'inscription (comme RÉEL).
        if (isGuest()) { leaveTradeFullscreen(); requireAccount(); return; }
        openDeposit();
      });
      if ($('closeTip')) { /* bound in bindModals */ }
      if ($('btnTipOk')) { /* bound in bindModals */ }
      (async function bootSession() {
        try {
          // v2395 — retour de Google (?code=…) : on finit la connexion avant tout le reste.
          if (D6.Auth.googleReturning && D6.Auth.googleReturning()) {
            var g = null;
            try { g = await D6.Auth.googleFinish(); } catch (eG) { g = null; }
            if (g && g.ok && D6.Auth.current() && !isGuest()) {
              if (g.isNew) metaTrack('CompleteRegistration');
              enterApp();
              return;
            }
            finishBoot();
            if (g && g.reason) toast(g.reason, 'err', 4000);
            else if (g) toast(t('googleFail'), 'err', 4000);
            return;
          }
          if (/[?&]google=1(&|$)/.test(location.search) && !googleInApp()) {
            try {
              var gu = new URL(location.href);
              gu.searchParams.delete('google');
              history.replaceState(null, '', gu.pathname + gu.search + gu.hash);
            } catch (eGu) { /* ignore */ }
            // v2399 : plus de départ automatique vers l'ancienne page Google ; on ouvre la connexion,
            // le joueur touche le bouton officiel Google.
            if (!D6.Auth.current() || isGuest()) {
              setTimeout(function () { if ($('btnGoLogin')) $('btnGoLogin').click(); }, 900);
            }
          }
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

  try { bindGlobalTradeClicks(); } catch (eWire) { /* ignore */ }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', D6.App.boot);
  } else {
    D6.App.boot();
  }
})(window.D6 = window.D6 || {});
