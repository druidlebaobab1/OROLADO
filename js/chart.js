(function (D6) {
  'use strict';

  var canvas;
  var ctx;
  var overlay;
  var octx;
  var cssW = 0;
  var cssH = 0;
  var dpr = 1;
  var lastTs = 0;
  var payoutAcc = 0;
  var running = false;
  var activeAsset = 'v100';
  var lastDrawnClose = 0;
  var viewMin = 0;
  var viewMax = 0;
  var onFrame = null;
  // Secondes visibles derrière la tête. Zoom + jusqu'à 10 s (bougies de près).
  // Zoom − plafonné à 11 min : un trade de 10 min reste entièrement visible, point
  // d'entrée compris, sans écraser la courbe au milieu de l'écran.
  // 4, 6, 7 et 8 s (ajoutés le 2026-10-04) : zoom de départ des simulations « vélocité »
  // (APOCALYPSE 4 s, PYTHON 7 s, ASMODUS 8 s, AZAZEL 10 s).
  var ZOOM_STEPS = [
    4, 6, 7, 8, 10, 12, 14, 16, 18, 20, 23, 25, 28, 31, 35, 38, 41, 45, 48, 52, 56, 60,
    70, 80, 90, 100, 110, 120, 140, 160, 180, 220, 260, 300,
    360, 420, 480, 540, 600, 660
  ];
  var DEFAULT_ZOOM_IDX = 12; // 28 s (défaut d'origine)
  // Zoom de départ par simulation : BAAL (bougie calme, gros carreaux) 16 s ; VOLATILITY 23 s (bougies
  // plus larges) ; ZUL 16 s (le serpent défile plus vite, sans pics plus hauts) ; OROF 16 s (grandes
  // pyramides) ; ASMODUS 23 s (cristaux plus larges). Les autres : 28 s.
  // 2026-10-03 (propriétaire : « bougies trop maigres ») : départ un peu plus proche, bougies plus
  // larges ; AZAZEL juste un cran (un peu plus large, même hauteur).
  function defaultZoomIdx(id) {
    // BAAL (Boom) : on voit plus de temps (41 s) pour voir la descente ET les pics.
    // ORO 999 (style Boom : descente en zigzag + grands pics) : on voit 35 s pour voir la descente ET les pics.
    if (id === 'horizon50') return 14;
    // Vélocité (demande du propriétaire) : PYTHON 7 s, ASMODUS 8 s, AZAZEL 10 s à l'écran.
    if (id === 'stable') return 8;
    if (id === 'nexusprime') return 9;
    if (id === 'crash300') return 10;
    if (id === 'goldtrend') return 12;
    if (id === 'v100') return 13;
    if (id === 'v75') return 12;
    // APOCALYPSE (vélocité, demande du propriétaire) : le PLUS RAPIDE, seulement 4 s à l'écran →
    // l'historique file vite vers la gauche, comme une voiture lancée. Affichage seulement.
    if (id === 'titanpulse') return 6;
    return 14;
  }
  var zoomIdx = defaultZoomIdx('v100');
  var zoomSmooth = 28;
  // Zoom élastique (pincement) : valeur continue pendant le geste, et douceur du suivi.
  var pinchSec = null;
  var zoomEase = 0.38;
  // Doigt sur le graphique : position du réticule (null = caché) et ondes dorées en cours.
  var touchCross = null;
  // Trade touché (carte en haut) et positions des lignes de trade de la dernière image.
  var tradeCard = null;
  var tradeHits = [];
  var lastEntryMarkX = NaN;
  var lastEntryMarkY = NaN;
  var lastEntryMarkR = NaN;
  var shownMarks = {};
  // Prix du rond au moment où il apparaît : il ne bouge plus ensuite (un seul rond, posé une fois).
  var shownPrice = {};
  // v2349 : heure du CLIC (vue à l'écran) de chaque trade, pour poser le rond là où le joueur a cliqué.
  var clickAt = {};
  // v2353 : rond « collé au bout de la courbe » jusqu'au vrai point d'entrée du serveur.
  var rideState = {};
  var rideDbg = null;
  // v2354 : début de l'attente (serveur + courbe) de chaque trade connecté, pour le filet de 6 s.
  var hiddenSince = {};
  // Historique regardé (un doigt qui glisse) : recul en ms, recul maximum, élan, bougies du bout
  // coupées, cadre des prix du passé, bouton « Direct ».
  var panMs = 0;
  var panMaxMs = 0;
  var panEpoch = 0;
  var panAnim = 0;
  var panTrim = 0;
  var panRightMs = 0;
  var panView = null;
  var panAsset = null;
  var lastSeriesW = 0;
  var lastTradeN = 0;
  var panLastWall = 0;
  var panDragRef = null;
  var panLiveAnim = false;
  // Suivi doux du doigt (cible du défilement) et bref message au bout de l'historique.
  var panFollow = false;
  var HIST_VIEW_MS = 10 * 60 * 1000;
  var panDataMaxMs = 0;
  var pendingTrades = {};
  var panTarget = 0;
  var histMsgEl = null;
  var histMsgTimer = 0;

  var wantFitY = false;
  // 1 bougie = 4 ticks serveur de 250 ms (voir engine.js).
  var CANDLE_DURATION_MS = 1000;
  // Tête de lecture : 62 % sur desktop, 60 % sur mobile, pour qu'elle tombe
  // toujours au milieu d'une case de la grille et jamais sur un trait.
  var HEAD_X_RATIO = 0.62;
  var HEAD_X_RATIO_MOBILE = 0.60;
  var Y_PAD_RATIO = 0.12;
  // Plein écran : 15 % de marge en haut comme en bas, recentrés en continu.
  var Y_PAD_FS = 0.15;
  var FS_Y_LERP = 0.08;
  var fsActive = false;
  var fsWasOn = false;
  var wallSkew = 0;
  var frameDisplayPrice = NaN;
  var headPriceMotion = {};
  var pendingYAnchor = null;
  var inds = { ma: false, bb: false, ema: false };
  var steer = null;
  var tmpCloses = [];
  var lastPad = null;
  var lastPlotH = 0;
  var lastMinP = 0;
  var lastMaxP = 0;
  var lastMap = null;
  // Lignes CALL/PUT : registre + file si canvas pas prêt (évite « ligne au F5 »).
  var openTradeVisuals = {};
  var openTradeVisualQueue = [];
  var lastDraw = 0;
  var lastFlush = 0;
  var loopRaf = 0;
  var drawRaf = 0;
  var chartTickTimer = 0;
  var strikeLock = null;
  var coinImgs = {};
  var BUFFER_N = 1320;
  var xTimes = null;
  var xNow = 0;
  var xWin = 60000;
  var candleScratch = [];
  var seriesScratch = [];
  var tradeListScratch = [];
  var tradeYsScratch = [];
  // Motifs de pointillés et comparateur alloués une seule fois : recréer ces
  // tableaux et cette closure à chaque trade et à chaque frame saturait le GC
  // dès que plusieurs positions étaient ouvertes.
  var TRADE_DASH = [5, 5];
  var GUIDE_DASH = [2, 3];
  var NO_DASH = [];
  var IS_ANDROID_CHART = /Android/i.test(navigator.userAgent || '');
  var IS_IOS_CHART = /iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
    ((navigator.platform === 'MacIntel') && (navigator.maxTouchPoints > 1));
  var IS_MOBILE_CHART = IS_ANDROID_CHART || IS_IOS_CHART;
  var chartHiddenAt = 0;
  var lastClickWake = 0;

  function byExpiry(a, b) {
    return (a.expiryTime || a.expiresAt || 0) - (b.expiryTime || b.expiresAt || 0);
  }
  window.assetsState = window.assetsState || {};
  window.assetBuffers = window.assetBuffers || {};
  window.ASSET_BUFFERS = window.assetBuffers;

  function ensureAssetState(id) {
    window.assetsState = window.assetsState || {};
    if (!window.assetsState[id]) {
      window.assetsState[id] = {
        candles: [],
        min: 0,
        max: 0,
        viewMin: 0,
        viewMax: 0,
        lockMin: 0,
        lockMax: 0,
        lockUntil: 0,
        lastPrice: 0,
        at: 0,
        zoomIdx: defaultZoomIdx(id),
        inds: { ma: false, bb: false, ema: false }
      };
    }
    return window.assetsState[id];
  }

  function coinImg(id) {
    if (coinImgs[id]) return coinImgs[id];
    var sym = document.getElementById(id);
    if (!sym) return null;
    var inner = '';
    var kids = sym.childNodes;
    var i;
    for (i = 0; i < kids.length; i++) {
      if (kids[i].outerHTML) inner += kids[i].outerHTML;
    }
    if (!inner) return null;
    var img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">' + inner + '</svg>'
    );
    coinImgs[id] = img;
    return img;
  }

  function zoomSec() {
    if (pinchSec !== null) return pinchSec;
    var zs = ZOOM_STEPS[zoomIdx] || 60;
    // Plein écran : on voit un peu moins de secondes → bougies plus grandes (VALAC est déjà grand).
    if (fsActive && activeAsset !== 'boomspike') zs *= 0.75;
    // v2339 : VOLATILITY en petit écran : un peu moins de secondes → bougies ~35 % plus larges (même hauteur
    // de mouvements : le cadre suit la racine du temps affiché). Plein écran inchangé.
    else if (!fsActive && activeAsset === 'v100') zs *= 0.74;
    return zs;
  }

  function padBottomRatio() {
    return fsActive ? Y_PAD_FS : Y_PAD_RATIO;
  }

  function padTopRatio() {
    return fsActive ? Y_PAD_FS : Y_PAD_RATIO;
  }

  function isChartReady() {
    return !!(ctx && canvas && cssW >= 8 && cssH >= 8);
  }

  function persistView(id) {
    var st = ensureAssetState(id || activeAsset);
    st.zoomIdx = zoomIdx;
    st.inds = { ma: !!inds.ma, bb: !!inds.bb, ema: !!inds.ema };
  }

  function applyAssetView(id) {
    var st = ensureAssetState(id || activeAsset);
    var z = st.zoomIdx;
    if (!(z >= 0) || z >= ZOOM_STEPS.length) z = defaultZoomIdx(id || activeAsset);
    zoomIdx = z;
    zoomSmooth = zoomSec();
    var saved = st.inds || {};
    inds.ma = !!saved.ma;
    inds.bb = !!saved.bb;
    inds.ema = !!saved.ema;
    syncIndButtons();
  }

  function rightOffsetPx() {
    return cssW * 0.25;
  }

  // `cssW` vaut déjà canvas.width / devicePixelRatio.
  function headRatio() {
    var narrow = cssW < 500 || (window.innerWidth || 0) < 768;
    return narrow ? HEAD_X_RATIO_MOBILE : HEAD_X_RATIO;
  }

  function plotLayout(pad) {
    pad = pad || { t: 16, r: 45, b: 28, l: 8 };
    var plotW = Math.max(40, cssW - pad.l - pad.r);
    var axisX = pad.l + plotW;
    var headX = cssW * headRatio();
    if (headX > axisX - 14) headX = axisX - 14;
    if (headX < pad.l + 48) headX = pad.l + 48;
    return {
      plotW: plotW,
      headX: headX,
      seriesW: Math.max(32, headX - pad.l),
      axisX: axisX
    };
  }

  function liveBuffer(id) {
    var key = id || activeAsset;
    return (window.ASSET_BUFFERS && window.ASSET_BUFFERS[key]) ||
      (window.assetBuffers && window.assetBuffers[key]) || null;
  }

  // Taille des bougies / perles / cristaux… (demande du propriétaire : « trop maigres ») :
  // un peu plus grosses sur le petit écran, nettement plus en plein écran. Dessin seulement.
  function sizeK() {
    return fsActive ? 1.7 : 1.2;
  }

  function candleStepWidth(seriesW) {
    var tWin = xWin > 0 ? xWin : 60000;
    return seriesW * (CANDLE_DURATION_MS / Math.max(1, tWin));
  }

  // Horloge murale haute résolution calée sur la timeline requestAnimationFrame :
  // Date.now() est quantifié à la milliseconde et peut reculer, ce qui hache le
  // défilement. On garde le temps mur exact à 250 ms près, en sous-milliseconde.
  // v2363 : téléphone couché (paysage, hauteur ≤ 500 px), hors télé : même règle que css/app.css (fin).
  function phoneLandscape() {
    try {
      var iw = window.innerWidth || 0;
      var ih = window.innerHeight || 0;
      return iw > ih && ih > 0 && ih <= 500 && !document.documentElement.classList.contains('is-tv');
    } catch (ePl) { return false; }
  }

  function frameWallClock(perfNow) {
    var p = isFinite(perfNow) ? perfNow : performance.now();
    var wall = Date.now();
    if (!wallSkew || Math.abs((wallSkew + p) - wall) > 250) wallSkew = wall - p;
    return wallSkew + p;
  }

  function candleProgress() {
    var tNow = xNow || frameWallClock();
    var times = xTimes;
    var candleStartMs = times && times.length ? Number(times[times.length - 1]) : NaN;
    if (!isFinite(candleStartMs)) {
      candleStartMs = Math.floor(tNow / CANDLE_DURATION_MS) * CANDLE_DURATION_MS;
    }
    var elapsed = tNow - candleStartMs;
    if (elapsed < 0) elapsed = 0;
    return (elapsed % CANDLE_DURATION_MS) / CANDLE_DURATION_MS;
  }

  // Axe X purement temporel : x = tête + ((t - maintenant) / durée_bougie) * largeur_bougie.
  // Aucun palier discret — le décalage au sous-pixel vaut (temps_écoulé / durée_bougie)
  // * largeur_bougie et progresse à chaque vsync, donc le glissement est linéaire.
  function baseIndexX(index, count, pad, seriesW) {
    var x0 = pad.l;
    var span = Math.max(32, seriesW);
    var step = candleStepWidth(span);
    var tNow = xNow || frameWallClock();
    var times = xTimes;
    var timeOffset = times && times.length >= count ? times.length - count : 0;
    var timeIndex = timeOffset + index;
    var t = times && timeIndex >= 0 ? Number(times[timeIndex]) : NaN;
    if (isFinite(t)) {
      return x0 + span + ((t - tNow) / CANDLE_DURATION_MS) * step;
    }
    var subPixelShift = candleProgress() * step;
    return x0 + span - (count - 1 - index) * step - subPixelShift;
  }

  function updateHeadPrice(assetId, targetPrice, nowMs) {
    var target = Number(targetPrice);
    if (!isFinite(target) || target <= 0) return targetPrice;
    var state = headPriceMotion[assetId] || (headPriceMotion[assetId] = {
      value: target,
      lastFrame: nowMs || performance.now()
    });
    var frameNow = nowMs || performance.now();
    var dt = Math.max(1, Math.min(80, frameNow - (state.lastFrame || frameNow)));
    if (!isFinite(state.value) || state.value <= 0) state.value = target;
    if (assetId === 'crash300' && target < state.value) {
      // Vente Crash : suivi plus rapide mais fluide (plus de snap brutal).
      var lerpDown = 1 - Math.pow(0.86, dt / (1000 / 60));
      state.value += (target - state.value) * lerpDown;
      if (Math.abs(target - state.value) < target * 0.000002) state.value = target;
    } else {
      var lerp = 1 - Math.pow(0.94, dt / (1000 / 60));
      state.value += (target - state.value) * lerp;
      if (Math.abs(target - state.value) < target * 0.000002) state.value = target;
    }
    state.lastFrame = frameNow;
    return state.value;
  }

  function makeToX(n, pad, seriesW) {
    var count = n;
    if (!(count > 1)) count = Math.max(1, n || 1);
    return function (i) {
      var idx = Math.max(0, Math.min(count - 1, i));
      return baseIndexX(idx, count, pad, seriesW);
    };
  }

  function viewMode() {
    var u = D6.Store && D6.Store.current && D6.Store.current();
    return u && u.mode === 'real' ? 'real' : 'demo';
  }

  function pruneTradeVisuals(now) {
    now = now || Date.now();
    var id;
    for (id in openTradeVisuals) {
      if (!openTradeVisuals.hasOwnProperty(id)) continue;
      var v = openTradeVisuals[id];
      var exp = v && (v.expiryTime || v.expiresAt);
      if (!v || v.settled || v.status === 'won' || v.status === 'lost' || v.status === 'void' || (exp && now >= exp)) {
        delete openTradeVisuals[id];
      }
    }
  }

  function liveVisualsForAsset(assetId) {
    pruneTradeVisuals();
    var n = 0;
    var id;
    for (id in openTradeVisuals) {
      if (!openTradeVisuals.hasOwnProperty(id)) continue;
      var v = openTradeVisuals[id];
      if (v && v.assetId === assetId && (!v.mode || v.mode === viewMode())) n += 1;
    }
    if (D6.Engine && D6.Engine.getTrades) {
      var list = D6.Engine.getTrades(viewMode());
      var i;
      var seen = {};
      for (i = 0; i < list.length; i++) {
        if (list[i] && list[i].assetId === assetId && !list[i].settled) seen[list[i].id] = 1;
      }
      return Object.keys(seen).length || n;
    }
    return n;
  }

  function tradeEntryPrice(trade) {
    if (!trade) return NaN;
    var ep = Number(trade.entryPrice != null ? trade.entryPrice : trade.openPrice);
    return isFinite(ep) ? ep : NaN;
  }

  function forceIncludePrice(price) {
    void price;
  }

  var GLIDE_MS = 320;
  // Heure d'affichage d'un trade prise SUR SA BOUGIE : le rond se pose exactement sur la bougie qui contient
  // son prix d'entrée, telle qu'elle est dessinée (le décalage d'affichage peut s'ajuster pendant le trade ;
  // une heure calculée au clic pouvait faire glisser le rond devant sa bougie). Sinon : heure du clic.
  function liveTradeTime(tick, fallback) {
    var tk = Number(tick);
    if (tick != null && isFinite(tk) && camCandles && camCandles.length) {
      var i;
      for (i = camCandles.length - 1; i >= 0; i--) {
        var cd = camCandles[i];
        if (!cd || cd.tk == null) continue;
        if (tk >= cd.tk) {
          if (tk < cd.tk + 4) return Number(cd.t);
          break;
        }
      }
    }
    return Number(fallback) || 0;
  }

  function tradeGlide(t) {
    var entry = Number(t.entryPrice != null ? t.entryPrice : t.openPrice);
    var bar = Number(t.barrier);
    var start = liveTradeTime(t.entryTick, t.startTime || t.startedAt || t.openedAt || 0);
    if (t.moveAt && t.fromEntry != null) {
      var k = Math.min(1, (Date.now() - t.moveAt) / GLIDE_MS);
      k = 1 - Math.pow(1 - k, 3);
      if (k < 1) {
        entry = t.fromEntry + (entry - t.fromEntry) * k;
        if (isFinite(t.fromBarrier) && isFinite(bar)) bar = t.fromBarrier + (bar - t.fromBarrier) * k;
        if (t.fromStart > 0 && start > 0) start = t.fromStart + (start - t.fromStart) * k;
      }
    }
    return { entry: entry, barrier: bar, start: start };
  }

  function snapshotTradeVisual(trade) {
    if (!trade || !trade.id) return null;
    var entry = tradeEntryPrice(trade);
    if (!isFinite(entry)) return null;
    var exp = trade.expiryTime || trade.expiresAt || trade.expiryAt;
    return {
      id: trade.id,
      assetId: trade.assetId || activeAsset,
      side: trade.side === 'put' ? 'put' : 'call',
      entryPrice: entry,
      openPrice: entry,
      barrier: trade.barrier != null ? Number(trade.barrier) : entry,
      payout: Number(trade.payout) || 1.9,
      stake: Number(trade.stake) || 0,
      startTime: trade.startTime || trade.startedAt || trade.openedAt || 0,
      entryTick: trade.entryTick != null ? Number(trade.entryTick) : null,
      expiryTick: trade.expiryTick != null ? Number(trade.expiryTick) : null,
      expiryTime: exp,
      expiresAt: exp,
      settled: !!trade.settled,
      status: trade.status || 'open',
      mode: trade.mode === 'real' ? 'real' : 'demo',
      // En attente du serveur : pastille seule, le trait viendra au prix confirmé.
      pending: trade.confirmed === false || trade.serverConfirmed === false
    };
  }

  function clearStrikeLock() {
    strikeLock = null;
  }

  function cancelChartRafs() {
    if (loopRaf) {
      try { cancelAnimationFrame(loopRaf); } catch (e0) { /* ignore */ }
      loopRaf = 0;
    }
    if (drawRaf) {
      try { cancelAnimationFrame(drawRaf); } catch (e1) { /* ignore */ }
      drawRaf = 0;
    }
    lastTs = 0;
  }

  var collectNow = 0;

  function collectOne(ot) {
    if (!ot || ot.assetId !== activeAsset) return;
    var otMode = ot.mode === 'real' ? 'real' : 'demo';
    if (otMode !== viewMode()) return;
    // Le rond et le trait d'entrée n'apparaissent qu'au VRAI point d'entrée (fixé par le serveur),
    // au moment où la courbe l'atteint : ils tombent pile sur la courbe et ne bougent plus.
    // Avant : posés sur l'écran au clic, puis déplacés vers le vrai prix à la réponse du serveur.
    // Filet de sécurité : sans confirmation au bout de 6 s, le trade s'affiche quand même.
    // Rond du trade : il n'apparaît que lorsque la courbe affichée atteint son moment d'entrée (démo comme réel),
    // pour tomber pile sur la courbe, jamais devant. Sans réponse du serveur au bout de 6 s, il s'affiche quand même.
    // Rond immédiat au clic, et une fois affiché il ne disparaît plus jamais (avant : la confirmation du serveur,
    // qui déplace l'entrée un peu plus loin, le recachait → « parfois rapide, parfois lent »). Il reste collé au
    // Le rond reste pour de bon à l'endroit du clic : la réponse du serveur (qui fixe le vrai prix) ne le fait
    // plus glisser le long de la courbe.
    // v2346 — Compte CONNECTÉ (réel et démo) : le serveur fixe l'entrée à l'instant réel, que la courbe affichée
    // (en retard de quelques centaines de ms) n'atteint qu'après coup ; on cachait le rond jusque-là → 1 à 2 s
    // d'attente après le clic (« lent »), alors qu'un visiteur le voyait tout de suite. Désormais : jamais caché,
    // rond et trait affichés dès le clic pour tout le monde (le rond reste au bout de la courbe le temps qu'elle
    // l'atteigne).
    // v2350 : le trade confirmé apparaît quand la courbe affichée ATTEINT son vrai point d'entrée (prix et heure du
    // serveur) : le rond tombe pile sur la courbe et la ligne part exactement de lui (~0,5 s après le clic).
    // v2352 : jamais caché → le trade s'affiche à l'instant du clic, comme pour un visiteur.
    // v2354 (solution 1 choisie par le propriétaire, comme les grands sites) : compte connecté, le rond, le trait et
    // la ligne objectif attendent la réponse du serveur (~0,3 s) puis l'instant où la courbe affichée atteint le vrai
    // point d'entrée ; ils apparaissent alors UNE fois, pile sur la courbe, et ne bougent plus. En attendant, le
    // signe ACHAT / VENTE et l'anneau au bout de la courbe s'affichent dès le clic. Visiteur : inchangé (immédiat).
    // Filet : jamais caché plus de 6 s.
    // v2356 (test en compte connecté) : l'anneau et l'étiquette du clic se posaient au bout de la courbe au prix du
    // clic, puis le vrai rond apparaissait à côté au prix du serveur → « deux positions ». Compte connecté : plus
    // aucun signe au clic, seulement le vrai rond, une seule fois. Visiteur : inchangé (les deux tombent au même endroit).
    // v2358 (choix du propriétaire) : compte connecté comme un visiteur : le rond se pose tout de suite à l'endroit
    // et au prix du CLIC et n'en bouge plus. Seule la ligne qui décide (prix du serveur) attend la confirmation.
    var hideNow = false;
    if (hideNow) {
      // Signal immédiat au clic (sans rien changer au vrai point d'entrée, qui arrive ensuite).
      if (!pendingTrades[ot.id] && !pendingTrades['done:' + ot.id]) pendingTrades[ot.id] = { t: performance.now(), side: ot.side === 'put' ? 'put' : 'call' };
      if (pendingTrades[ot.id]) {
        pendingTrades[ot.id].seen = collectNow;
        pendingTrades[ot.id].hid = collectNow;
      }
      return;
    }
    // Nouveau trade (même déjà confirmé) : le signe ACHAT / VENTE reste 1,2 s après le clic.
    if (!pendingTrades[ot.id] && ot.startTime && collectNow - ot.startTime < 1000 && !pendingTrades['done:' + ot.id]) {
      pendingTrades[ot.id] = { t: performance.now(), side: ot.side === 'put' ? 'put' : 'call' };
    }
    if (pendingTrades[ot.id]) pendingTrades[ot.id].seen = collectNow;
    if (!clickAt[ot.id] && ot.startTime) clickAt[ot.id] = Number(ot.startTime);
    // v2347 (choix B) : rond et prix d'entrée fixés seulement quand le serveur a confirmé (prix officiel).
    if (!shownMarks[ot.id]) {
      // Le rond reste pour de bon à l'endroit du clic, sur les 10 simulations : la réponse du serveur
      // (qui fixe le vrai prix d'entrée) ne le déplace plus (avant : il apparaissait, puis sautait à
      // la seconde suivante). Lignes : l'instant exact du clic ; autres : le centre de sa seconde.
      var aMk = D6.CONFIG && D6.CONFIG.ASSETS ? D6.CONFIG.ASSETS[ot.assetId] : null;
      var lineMk = !!(aMk && aMk.chart !== 'candle' && aMk.id !== 'horizon50' && !STYLED_ASSETS[aMk.id]);
      // v2349 : le rond se pose à l'heure du CLIC (là où le joueur a cliqué sur la courbe), à la hauteur du prix
      // confirmé par le serveur ; avant, il se posait à l'heure d'arrivée de l'ordre, donc « devant » la courbe.
      var clickT = Number(ot.startTime || ot.startedAt) || 0;
      shownMarks[ot.id] = (lineMk ? clickT : (liveTradeTime(ot.entryTick, clickT) || clickT)) || 1;
      var p0 = Number(ot.entryPrice != null ? ot.entryPrice : ot.openPrice);
      if (isFinite(p0) && p0 > 0) shownPrice[ot.id] = p0;
    }
    var e2 = ot.expiryTime || ot.expiresAt;
    if (e2 && collectNow >= e2) return;
    var v = openTradeVisuals[ot.id];
    if (!v) {
      v = snapshotTradeVisual(ot);
      if (v) openTradeVisuals[v.id] = v;
    }
    if (v && (v.mode === 'real' ? 'real' : 'demo') === viewMode()) tradeListScratch.push(v);
  }

  function collectOpenTradeVisuals() {
    pruneTradeVisuals();
    tradeListScratch.length = 0;
    var now = Date.now();
    collectNow = now;
    if (D6.Engine && D6.Engine.forEachOpen) {
      D6.Engine.forEachOpen(collectOne);
    } else {
      var id;
      for (id in openTradeVisuals) {
        if (!openTradeVisuals.hasOwnProperty(id)) continue;
        var vis = openTradeVisuals[id];
        if (!vis || vis.settled || vis.assetId !== activeAsset) continue;
        var exp = vis.expiryTime || vis.expiresAt;
        if (exp && now >= exp) continue;
        tradeListScratch.push(vis);
      }
    }
    if (tradeListScratch.length > 1) tradeListScratch.sort(byExpiry);
    return tradeListScratch;
  }

  function drawNow() {
    if (!isChartReady()) return false;
    lastDraw = 0;
    try { drawFrame(performance.now()); } catch (eDraw) { /* keep loop alive */ }
    return true;
  }

  function flushOpenTradeVisualQueue() {
    if (!isChartReady()) return;
    if (openTradeVisualQueue.length) {
      var ids = openTradeVisualQueue.slice();
      openTradeVisualQueue.length = 0;
      var i;
      for (i = 0; i < ids.length; i++) {
        void openTradeVisuals[ids[i]];
      }
    }
    // resize() efface le canvas : toujours redessiner s’il y a des lignes OPEN.
    var hasVis = false;
    var id;
    for (id in openTradeVisuals) {
      if (openTradeVisuals.hasOwnProperty(id)) { hasVis = true; break; }
    }
    if (hasVis || (D6.Engine && D6.Engine.liveCount && D6.Engine.liveCount(viewMode()) > 0)) {
      drawNow();
    }
  }

  /** Unique entrée visuelle CALL/PUT — desktop + mobile + TV. */
  function applyOpenTradeVisual(trade) {
    var snap = snapshotTradeVisual(trade);
    if (!snap) return false;
    if (snap.mode && snap.mode !== viewMode()) return false;
    if (snap.settled || snap.status === 'won' || snap.status === 'lost' || snap.status === 'void') {
      delete openTradeVisuals[snap.id];
      return false;
    }
    var prevSnap = openTradeVisuals[snap.id];
    // Trait visible dès le clic (léger fondu), puis glissement en douceur vers le prix
    // confirmé par le serveur : aucun saut, même si le prix officiel diffère d'un cheveu.
    snap.lineAt = (prevSnap && prevSnap.lineAt) || (Date.now() - Number(snap.startTime || 0) < 4000 ? Date.now() : 0);
    if (prevSnap && (prevSnap.entryPrice !== snap.entryPrice || prevSnap.barrier !== snap.barrier || prevSnap.startTime !== snap.startTime)) {
      var cur = tradeGlide(prevSnap);
      // v2353 : à la confirmation, aucun glissement (le rond est collé au bout de la courbe, voir drawEntryOn).
      snap.fromEntry = prevSnap.pending ? snap.entryPrice : cur.entry;
      snap.fromBarrier = prevSnap.pending ? snap.barrier : cur.barrier;
      snap.fromStart = cur.start;
      snap.moveAt = Date.now();
    }
    openTradeVisuals[snap.id] = snap;
    if (snap.assetId) {
      var expL = snap.expiryTime || snap.expiresAt || 0;
      captureTradeFrame(snap.assetId, expL + 1000);
    }
    if (!isChartReady()) {
      if (openTradeVisualQueue.indexOf(snap.id) < 0) openTradeVisualQueue.push(snap.id);
      return false;
    }
    return drawNow();
  }

  function syncAccountMode() {
    var mode = viewMode();
    var id;
    for (id in openTradeVisuals) {
      if (!openTradeVisuals.hasOwnProperty(id)) continue;
      var vis = openTradeVisuals[id];
      if (vis && vis.mode && vis.mode !== mode) delete openTradeVisuals[id];
    }
    steer = null;
    if (D6.Engine && D6.Engine.getTrades) {
      D6.Engine.getTrades(mode).forEach(function (t) {
        applyOpenTradeVisual(t);
      });
    }
    if (isChartReady()) drawNow();
  }

  function removeTradeVisual(tradeId) {
    if (!tradeId) return;
    var gone = openTradeVisuals[tradeId];
    delete openTradeVisuals[tradeId];
    var qi = openTradeVisualQueue.indexOf(tradeId);
    if (qi >= 0) openTradeVisualQueue.splice(qi, 1);
    pruneTradeVisuals();
    var aid = (gone && gone.assetId) || activeAsset;
    if (!liveVisualsForAsset(aid)) {
      var st = ensureAssetState(aid);
      if (!st.lockUntil || Date.now() >= st.lockUntil) {
        st.lockMin = 0;
        st.lockMax = 0;
        st.lockUntil = 0;
        if (aid === activeAsset) {
          strikeLock = null;
          steer = null;
        }
      }
    }
    if (isChartReady()) drawNow();
  }

  function flushDue() {
    var u = D6.Store && D6.Store.current ? D6.Store.current() : null;
    if (!u || !D6.Engine.flushSettlements) return [];
    return D6.Engine.flushSettlements(u);
  }

  function captureYAxisAnchor() {
    if (!(lastMaxP > lastMinP)) return null;
    var price = Number(lastDrawnClose);
    if (D6.Engine) {
      var list = collectOpenTradeVisuals();
      var i;
      for (i = 0; i < list.length; i++) {
        if (!list[i] || list[i].assetId !== activeAsset || list[i].settled) continue;
        var entry = Number(list[i].entryPrice != null ? list[i].entryPrice : list[i].openPrice);
        if (isFinite(entry) && entry > 0) {
          price = entry;
          break;
        }
      }
    }
    if (!isFinite(price) || price <= 0) return null;
    var ratio = (lastMaxP - price) / (lastMaxP - lastMinP);
    ratio = Math.max(0.001, Math.min(0.999, ratio));
    return { price: price, ratio: ratio };
  }

  // Un seul redimensionnement en attente à la fois : sans ça, un glissement de
  // fenêtre ou un passage en plein écran empilait des dizaines de rAF et de
  // timers orphelins qui continuaient à redessiner après coup.
  var resizeRaf = 0;
  var resizeTimer = 0;
  var lastGeomKey = '';

  function scheduleResize(delayMs) {
    if (delayMs > 0) {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeTimer = 0;
        scheduleResize(0);
      }, delayMs);
      return;
    }
    // Un seul passage par frame au maximum, et surtout pas de `cancel` suivi
    // d'une reprogrammation : sous rafale continue, le travail serait sans
    // cesse repoussé et le canvas ne se remettrait jamais à jour.
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(function () {
      resizeRaf = 0;
      try { resize(); } catch (eSr) { /* ignore */ }
    });
  }

  function resize(force) {
    if (!canvas) return;
    var parent = canvas.parentElement;
    if (!parent) return;
    var yAnchor = captureYAxisAnchor();
    var fsMode = !!(document.documentElement.classList.contains('fs-trade') ||
      (document.getElementById('fsTradeOverlay') && document.getElementById('fsTradeOverlay').classList.contains('on')));
    var mobile = (window.innerWidth || 0) <= 859;
    var minH = fsMode
      ? Math.max(220, Math.round((window.innerHeight || 700) - 140))
      : Math.max(380, Math.round((window.innerHeight || 700) * 0.45));

    // Une rafale de `resize` (glissement de fenêtre, plein écran, clavier
    // mobile) réémet des dizaines d'événements pour une géométrie identique.
    // Réécrire les styles à chaque fois déclenchait un recalcul complet et
    // faisait tomber le rendu sous les 20 FPS : on sort tant que rien n'a bougé.
    var geomKey = fsMode + '|' + parent.clientWidth + 'x' + parent.clientHeight +
      '|' + (window.innerWidth || 0) + 'x' + (window.innerHeight || 0) +
      '|' + (window.devicePixelRatio || 1);
    if (IS_ANDROID_CHART && document.hidden && !force) {
      lastGeomKey = '';
      return;
    }
    if (!force && geomKey === lastGeomKey) return;
    if (!IS_ANDROID_CHART) lastGeomKey = geomKey;

    // Visibilité forcée (canvas principal sombre, overlay transparent).
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.zIndex = '10';
    canvas.style.backgroundColor = '#0B0E14';
    canvas.style.background = '#0B0E14';
    parent.style.backgroundColor = '#0B0E14';
    parent.style.position = 'relative';
    parent.style.width = '100%';
    if (fsMode) {
      canvas.style.position = 'relative';
      canvas.style.inset = 'auto';
    } else {
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
    }
    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '1';
      overlay.style.zIndex = '20';
      overlay.style.background = 'transparent';
      overlay.style.backgroundColor = 'transparent';
    }

    if (!fsMode) {
      // Quand le ticket de trade est en position fixe (Android), il sort du flux
      // et la carte du graphique ne sait plus jusqu'où elle peut descendre :
      // elle restait figée à une fraction de `vh` et laissait une bande morte
      // au-dessus du ticket. On lui donne la place réellement disponible.
      var stdH = 0;
      var stdPad = document.querySelector('#screenTrade .pad');
      var stdCard = document.getElementById('chart');
      if (stdPad) {
        try {
          if (window.getComputedStyle(stdPad).position === 'fixed') {
            var padTop = Math.round(stdPad.getBoundingClientRect().top);
            var cardTop = Math.round((stdCard || parent).getBoundingClientRect().top);
            if (padTop > 0 && cardTop >= 0) stdH = padTop - cardTop - 10;
          }
        } catch (eStd) { stdH = 0; }
      }
      // Retour du plein écran : on efface ses tailles forcées (sinon la carte gardait la hauteur du
      // plein écran → la courbe passait sous le terminal sur Android, et une bande vide à droite).
      if (parent.style.getPropertyPriority('height') === 'important') {
        ['min-height', 'height', 'width', 'min-width'].forEach(function (p) { parent.style.removeProperty(p); });
      }
      var cardBack = document.getElementById('chart');
      if (cardBack && (cardBack.style.getPropertyPriority('height') === 'important' || cardBack.style.getPropertyPriority('min-width') === 'important')) {
        ['height', 'min-height', 'min-width', 'width', 'flex'].forEach(function (p) { cardBack.style.removeProperty(p); });
      }
      parent.style.minHeight = minH + 'px';
      if (!parent.style.height || parseInt(parent.style.height, 10) < minH) {
        parent.style.height = minH + 'px';
      }
      var card = document.getElementById('chart');
      if (card) {
        card.style.minHeight = '380px';
        card.style.width = '100%';
      }
      // La mesure est publiée dans une variable CSS plutôt qu'écrite en style
      // inline : la feuille Android impose déjà des hauteurs en `!important`, et
      // une bataille de priorités laissait la carte et la scène désaccordées.
      // Seuil 150 px (avant 240) : sur un Android court (barre de Chrome + boutons Android), la place
      // libre au-dessus des boutons fait ~210 px ; la mesure était ignorée et le bas du graphique
      // passait SOUS la rangée des durées (la tête de la courbe s’y cachait quand le marché baissait).
      if (stdH >= 120) {
        document.documentElement.style.setProperty('--oro-chart-h', stdH + 'px');
      }
    } else {
      // La réserve verticale était figée à 132 px sur mobile, alors que la
      // barre supérieure, la rangée d'actifs et le panneau de trade fixe en
      // occupent bien davantage. Le graphique débordait donc sous l'écran et se
      // retrouvait tronqué sur Android. On mesure la place réellement libre.
      var vpH = Math.round(window.innerHeight || 700);
      var topOff = 0;
      try {
        topOff = Math.max(0, Math.round(parent.getBoundingClientRect().top));
      } catch (eTop) { topOff = 0; }
      var bottomRes = 0;
      var fsPad = document.querySelector('.fs-trade-overlay.on .pad');
      if (fsPad) {
        try {
          if (window.getComputedStyle(fsPad).position === 'fixed') {
            bottomRes = Math.round(fsPad.getBoundingClientRect().height);
          }
        } catch (ePad) { bottomRes = 0; }
      }
      var freeH = vpH - topOff - bottomRes - 4;
      var chrome = mobile ? 132 : 96;
      var fsH = Math.max(240, Math.min(Math.round(vpH - chrome), freeH));
      // v2363 : téléphone couché (275 à 430 px de haut) : 240 px minimum faisait sortir le bas du graphique de
      // l'écran ; on prend la place réellement libre jusqu'en bas.
      if (phoneLandscape()) fsH = Math.max(100, freeH);
      // Télé en plein écran : la page y est réduite (zoom 62 %) ; les mesures de l'écran sont converties en
      // tailles de page pour que le graphique remplisse toute la hauteur. Téléphones et PC : inchangé.
      var tvZ = 1;
      try {
        if (document.documentElement.classList.contains('is-tv') && document.documentElement.classList.contains('fs-trade')) {
          tvZ = parseFloat(window.getComputedStyle(document.documentElement).zoom) || 1;
        }
      } catch (eZ) { tvZ = 1; }
      if (tvZ > 0 && tvZ < 0.99) {
        try {
          var tvOv = document.getElementById('fsTradeOverlay');
          var ovR = tvOv.getBoundingClientRect();
          var stR = parent.getBoundingClientRect();
          var frac = (ovR.bottom - stR.top) / Math.max(1, ovR.height);
          fsH = Math.max(240, Math.round(tvOv.clientHeight * frac) - 8);
          // Mesure réelle : la carte va jusqu'en bas de l'écran (avant : ~40 px vides en bas).
          // (mesure sur la zone de dessin elle-même : la carte contient aussi la barre d'outils)
          var curStage = Math.round(parent.clientHeight || 0);
          if (curStage > 0 && stR.height > 0) fsH = Math.max(240, Math.round(curStage + (ovR.bottom - stR.bottom) / tvZ) - 2);
        } catch (eTvH) { fsH = Math.max(240, Math.round((vpH - topOff - 6) / tvZ)); }
      }
      // Tolérance : sans elle, un écart d'un pixel relancerait sans fin le
      // cycle mesure → redimensionnement → mesure.
      var curH = Math.round(parent.clientHeight || 0);
      if (curH > 0 && Math.abs(fsH - curH) <= 2) fsH = curH;
      var landscape = (window.innerWidth || 0) > (window.innerHeight || 0);
      // PC : la courbe s'approche un peu plus de la colonne ACHETER / VENDRE (avant : 240).
      var sideChrome = (!mobile && landscape) ? 226 : 0;
      var fsW = Math.max(280, Math.round((window.innerWidth || 800) - sideChrome));
      if (tvZ > 0 && tvZ < 0.99) {
        fsW = Math.max(280, Math.round((window.innerWidth || 800) / tvZ - 320));
        // Mesure réelle : la courbe va jusqu'à la colonne ACHETER / VENDRE (avant : ~90 px vides).
        try {
          var tvPad = document.querySelector('#fsTradeOverlay .pad, .fs-trade-overlay.on .pad');
          var tvCard = document.getElementById('chart');
          if (tvPad && tvCard) {
            var pR = tvPad.getBoundingClientRect();
            var cR = tvCard.getBoundingClientRect();
            if (pR.left > cR.left + 100) fsW = Math.max(280, Math.round((pR.left - cR.left) / tvZ) - 10);
          }
        } catch (eTvW) { /* ignore */ }
      }
      parent.style.setProperty('min-height', fsH + 'px', 'important');
      parent.style.setProperty('height', fsH + 'px', 'important');
      parent.style.setProperty('width', '100%', 'important');
      parent.style.setProperty('min-width', '240px', 'important');
      var cardFs = document.getElementById('chart');
      if (cardFs) {
        // Télé : la carte contient la barre d'outils AU-DESSUS de la courbe ; sans l'ajouter, le bas de
        // la courbe (les prix les plus bas) était caché sous le bord de la carte.
        // (Tous les appareils : sur téléphone aussi, la carte coupait ~24 px du bas de la courbe.)
        var cardH = fsH;
        try {
          var zTb = (tvZ > 0 && tvZ < 0.99) ? tvZ : 1;
          var tb = (parent.getBoundingClientRect().top - cardFs.getBoundingClientRect().top) / zTb;
          if (tb > 0 && tb < 120) cardH = fsH + Math.round(tb);
        } catch (eTb) { cardH = fsH; }
        cardFs.style.setProperty('height', cardH + 'px', 'important');
        cardFs.style.setProperty('min-height', cardH + 'px', 'important');
        cardFs.style.setProperty('min-width', '240px', 'important');
        if (!mobile && landscape && !phoneLandscape()) {
          cardFs.style.setProperty('width', fsW + 'px', 'important');
          cardFs.style.setProperty('flex', '1 1 0%', 'important');
        } else {
          cardFs.style.setProperty('width', '100%', 'important');
        }
      }
    }

    var rect = parent.getBoundingClientRect();
    var w = Math.max(0, Math.floor(parent.clientWidth || rect.width || canvas.offsetWidth || 0));
    var h = Math.max(0, Math.floor(parent.clientHeight || rect.height || canvas.offsetHeight || 0));
    // (v2363 : sauf téléphone couché, où un graphique de moins de 180 px de haut est normal.)
    if (IS_ANDROID_CHART && !document.hidden && cssH >= 240 && h > 0 && h < 180 && !phoneLandscape()) {
      lastGeomKey = '';
      scheduleResize(160);
      return;
    }
    // Fallback immédiat si dimensions à 0 (écran caché / flex collapse).
    if (w < 8) w = Math.max(320, Math.floor(window.innerWidth || 360));
    if (h < 8) h = fsMode ? Math.max(220, Math.floor((window.innerHeight || 700) - 140)) : 380;

    dpr = Math.max(1, window.devicePixelRatio || 1);
    var boxW = Math.max(0, Math.floor(parent.clientWidth || 0));
    var boxH = Math.max(0, Math.floor(parent.clientHeight || 0));
    if (boxW >= 8) w = boxW;
    if (boxH >= 8) h = boxH;
    // (v2363 : sauf téléphone couché, où un graphique de moins de 180 px de haut est normal.)
    if (IS_ANDROID_CHART && !document.hidden && cssH >= 240 && h > 0 && h < 180 && !phoneLandscape()) {
      lastGeomKey = '';
      scheduleResize(160);
      return;
    }
    cssW = w;
    cssH = h;
    var bw = Math.round(cssW * dpr);
    var bh = Math.round(cssH * dpr);
    canvas.width = bw;
    canvas.height = bh;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    if (overlay) {
      overlay.width = bw;
      overlay.height = bh;
      overlay.style.width = cssW + 'px';
      overlay.style.height = cssH + 'px';
      if (octx) octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    pendingYAnchor = yAnchor;
    wantFitY = true;
    if (headPriceMotion[activeAsset]) headPriceMotion[activeAsset].value = NaN;
    flushOpenTradeVisualQueue();
    if (IS_ANDROID_CHART) lastGeomKey = geomKey;
    drawNow();
    requestAnimationFrame(function () { drawNow(); });
  }

  // Jeu équitable : la courbe n'est plus jamais déplacée pour coller à un résultat.
  // steerClose reste exposé (appels anciens) mais ne fait plus rien.
  function steerClose() {
    steer = null;
  }

  var BACKDROP_COINS = ['ico-btc', 'ico-eth', 'ico-usdt', 'ico-sol', 'ico-bnb', 'ico-doge',
    'ico-ton', 'ico-ada', 'ico-trx', 'ico-avax', 'ico-ltc', 'ico-link', 'ico-usdc', 'ico-matic',
    'ico-dot', 'ico-shib', 'ico-uni', 'ico-atom', 'ico-near', 'ico-bch', 'ico-xlm',
    'ico-pepe', 'ico-arb', 'ico-op', 'ico-sui', 'ico-fil', 'ico-apt'];
  var bgCanvas = null;
  var bgKey = '';

  function backdropCoinsReady() {
    var i;
    for (i = 0; i < BACKDROP_COINS.length; i++) {
      var img = coinImg(BACKDROP_COINS[i]);
      if (img && !(img.complete && img.naturalWidth)) return false;
    }
    return true;
  }

  // « Galaxie crypto » (choisie par le propriétaire le 2026-10-05) : décor seulement.
  // v2374 : spirale bien ronde (pas penchée), centrée, immobile (pas de vertige) ; seules les petites
  // cryptos glissent très lentement le long des bras vers le centre en devenant minuscules.
  // Ne touche ni aux prix, ni à la courbe, ni aux trades.
  var galaxy = null;
  var GALAXY_TRIP_MS = 180000;
  var GALAXY_COINS = ['ico-btc', 'ico-trx', 'ico-ton', 'ico-btc', 'ico-eth', 'ico-usdt', 'ico-btc',
    'ico-bnb', 'ico-sol', 'ico-btc', 'ico-xrp', 'ico-usdc', 'ico-btc', 'ico-doge'];
  var GALAXY_TURNS = 1.6;

  function cryptoWorld(g, pad, w, h, planets, planet, rnd, small, pr) {
    function halo(x, y, r, col) {
      var rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // Deux planètes discrètes, hors de la spirale.
    planet(pad.l + w * 0.74, pad.t + h * 0.60, pr * 0.32, '#D8FFF8', 'rgba(45,212,191,1)', '#04302A', 0.13, false);
    planet(pad.l + w * 0.25, pad.t + h * 0.95, pr * 0.26, '#FFE0F4', 'rgba(217,70,239,1)', '#33093A', 0.12, false);
    // À droite, là où la courbe n'arrive jamais : 2e planète à anneau en haut, petites planètes en bas.
    planet(pad.l + w * 0.90, pad.t + h * 0.055, pr * 0.40, '#E4F4FF', 'rgba(110,140,255,1)', '#141A4A', 0.34, true);
    planet(pad.l + w * 0.78, pad.t + h * 0.95, pr * 0.30, '#FFE2EC', 'rgba(244,114,182,1)', '#3A0A22', 0.20, false);
    planet(pad.l + w * 0.95, pad.t + h * 0.72, pr * 0.14, '#FFF4D0', 'rgba(250,204,21,1)', '#3A2E05', 0.22, false);
    planet(pad.l + w * 0.67, pad.t + h * 0.80, pr * 0.10, '#E0FFF4', 'rgba(52,211,153,1)', '#06301F', 0.16, false);
    // Spirale ronde au centre ; son bord s'arrête avant la grande planète.
    // v2377 (propriétaire) : le « cœur » de la courbe, au centre exact du graphique, un peu plus petit,
    // et toujours un espace libre avant l'anneau de la grande planète.
    var cx = pad.l + w * 0.5, cy = pad.t + h * 0.5;
    var R = Math.min(w * 0.29, h * 0.38);
    var p0 = planets[0];
    var room = Math.hypot(p0.x - cx, p0.y - cy) - p0.r * 1.7;
    // bout gauche de l'anneau (incliné de -0.32) + quelques points de l'anneau côté spirale
    var ra;
    for (ra = 2.4; ra <= 3.9; ra += 0.1) {
      var ex = Math.cos(ra) * p0.r * 1.95, ey = Math.sin(ra) * p0.r * 0.42;
      var rx = p0.x + ex * Math.cos(-0.32) - ey * Math.sin(-0.32);
      var ry = p0.y + ex * Math.sin(-0.32) + ey * Math.cos(-0.32);
      room = Math.min(room, Math.hypot(rx - cx, ry - cy) - Math.max(12, R * 0.12));
    }
    if (room < R) R = Math.max(30, room);
    function spiral(arm, t) {
      var ang = arm * Math.PI + t * Math.PI * 2 * GALAXY_TURNS;
      var rad = R * (0.05 + 0.95 * t);
      return { x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad };
    }
    halo(cx, cy, R * 1.05, 'rgba(120,80,255,0.06)');
    halo(cx, cy, R * 0.45, 'rgba(180,120,255,0.06)');
    var arm, t, q;
    for (arm = 0; arm < 2; arm++) {
      g.save();
      g.lineCap = 'round';
      for (q = 0; q < 2; q++) {
        g.strokeStyle = q ? 'rgba(200,170,255,0.06)' : 'rgba(120,90,255,0.05)';
        g.lineWidth = q ? Math.max(2, R * 0.05) : Math.max(5, R * 0.13);
        g.beginPath();
        for (t = 0; t <= 1.0001; t += 0.01) {
          var pp = spiral(arm, t);
          if (t === 0) g.moveTo(pp.x, pp.y); else g.lineTo(pp.x, pp.y);
        }
        g.stroke();
      }
      g.restore();
      for (t = 0.02; t < 1; t += 0.004) {
        var sp = spiral(arm, t);
        var jx = (rnd() - 0.5) * R * 0.07, jy = (rnd() - 0.5) * R * 0.07;
        g.fillStyle = 'rgba(' + (rnd() < 0.3 ? '255,220,170' : '210,200,255') + ',' + (0.12 + t * 0.2).toFixed(2) + ')';
        g.beginPath(); g.arc(sp.x + jx, sp.y + jy, 0.4 + rnd() * 0.8, 0, Math.PI * 2); g.fill();
      }
    }
    // Cœur doré (adouci) + BTC au centre.
    halo(cx, cy, R * 0.26, 'rgba(255,200,110,0.15)');
    halo(cx, cy, R * 0.11, 'rgba(255,240,210,0.16)');
    var core = coinImg('ico-btc');
    var cs = Math.max(12, R * 0.16);
    if (core && core.complete && core.naturalWidth) {
      g.globalAlpha = 0.27;
      g.drawImage(core, cx - cs / 2, cy - cs / 2, cs, cs);
      g.globalAlpha = 1;
    }
    var coins = [], k;
    for (arm = 0; arm < 2; arm++) {
      for (k = 0; k < 7; k++) coins.push({ arm: arm, u0: k / 7 + arm * 0.07, id: GALAXY_COINS[arm * 7 + k] });
    }
    galaxy = { cx: cx, cy: cy, R: R, coins: coins };
  }

  // Les petites cryptos glissent doucement vers le centre (un trajet en 3 min), de plus en plus petites.
  function drawGalaxy() {
    if (!galaxy) return;
    var G = galaxy, now = Date.now() / GALAXY_TRIP_MS, i;
    for (i = 0; i < G.coins.length; i++) {
      var c = G.coins[i];
      var u = (c.u0 + now) % 1;
      var t = 1 - u * 0.92;
      var im = coinImg(c.id);
      if (!im || !im.complete || !im.naturalWidth) continue;
      var ang = c.arm * Math.PI + t * Math.PI * 2 * GALAXY_TURNS;
      var rad = G.R * (0.05 + 0.95 * t);
      var x = G.cx + Math.cos(ang) * rad, y = G.cy + Math.sin(ang) * rad;
      var s = 3 + 12 * t;
      var a = 0.30 * t + 0.04;
      if (u < 0.06) a *= u / 0.06;
      if (u > 0.85) a *= (1 - u) / 0.15;
      ctx.globalAlpha = a;
      ctx.drawImage(im, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function buildBackdrop(pad, w, h) {
    var s = Math.min(dpr || 1, 2);
    var c = bgCanvas || document.createElement('canvas');
    c.width = Math.max(1, Math.round(cssW * s));
    c.height = Math.max(1, Math.round(cssH * s));
    var g = c.getContext('2d');
    g.setTransform(s, 0, 0, s, 0, 0);
    // Fond « univers » : nuit bleu-violet (pas un noir plat), nébuleuses douces, étoiles,
    // quelques planètes et les cryptos. Décor seulement : rien ici ne touche aux prix.
    var base = g.createLinearGradient(0, 0, 0, cssH);
    base.addColorStop(0, '#13113A');
    base.addColorStop(1, '#0A0A20');
    g.fillStyle = base;
    g.fillRect(0, 0, cssW, cssH);
    function glow(x, y, r, col) {
      var rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, cssW, cssH);
    }
    var big = Math.max(cssW, cssH);
    var small = Math.min(w, h);
    glow(cssW * 0.06, cssH * 0.04, big * 0.6, 'rgba(124,58,237,0.20)');
    // (Ancien halo orange en bas à droite retiré : le propriétaire voyait une « lueur jaune » près des prix.)
    glow(cssW * 0.96, cssH * 0.94, big * 0.55, 'rgba(40,70,190,0.07)');
    glow(pad.l + w * 0.5, pad.t + h * 0.55, small * 0.85, 'rgba(70,110,255,0.07)');
    // Étoiles : tirage fixe (toujours au même endroit), petites et discrètes.
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var nStars = Math.round(cssW * cssH / 2400);
    var k;
    for (k = 0; k < nStars; k++) {
      var sx = rnd() * cssW;
      var sy = rnd() * cssH;
      var sr = rnd() * 1.05 + 0.25;
      g.fillStyle = 'rgba(255,255,255,' + (rnd() * 0.5 + 0.12).toFixed(2) + ')';
      g.beginPath();
      g.arc(sx, sy, sr, 0, Math.PI * 2);
      g.fill();
    }
    // Quelques étoiles brillantes en croix.
    for (k = 0; k < 6; k++) {
      var bx = pad.l + rnd() * w;
      var by = pad.t + rnd() * h;
      var bl = 3 + rnd() * 3;
      g.strokeStyle = 'rgba(255,240,220,0.32)';
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(bx - bl, by); g.lineTo(bx + bl, by);
      g.moveTo(bx, by - bl); g.lineTo(bx, by + bl);
      g.stroke();
      g.fillStyle = 'rgba(255,248,235,0.8)';
      g.beginPath();
      g.arc(bx, by, 0.9, 0, Math.PI * 2);
      g.fill();
    }
    // Planètes : dégradé de lumière, ombre douce, anneau pour la grande.
    function planet(x, y, r, c0, c1, c2, alpha, ring) {
      g.save();
      g.globalAlpha = alpha;
      var halo = g.createRadialGradient(x, y, r * 0.9, x, y, r * 2.1);
      halo.addColorStop(0, c1.replace('1)', '0.22)'));
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = halo;
      g.beginPath();
      g.arc(x, y, r * 2.1, 0, Math.PI * 2);
      g.fill();
      if (ring) {
        g.save();
        g.translate(x, y);
        g.rotate(-0.32);
        // v2373 (propriétaire) : le bout droit de l'anneau s'efface doucement (il ne touche plus les prix).
        var rgB = g.createLinearGradient(-r * 2, 0, r * 2, 0);
        rgB.addColorStop(0, 'rgba(255,214,160,0.55)');
        rgB.addColorStop(0.62, 'rgba(255,214,160,0.50)');
        rgB.addColorStop(0.84, 'rgba(255,214,160,0.16)');
        rgB.addColorStop(1, 'rgba(255,214,160,0)');
        g.strokeStyle = rgB;
        g.lineWidth = Math.max(1, r * 0.09);
        g.beginPath();
        g.ellipse(0, 0, r * 1.95, r * 0.42, 0, Math.PI, Math.PI * 2);
        g.stroke();
        g.restore();
      }
      var body = g.createRadialGradient(x - r * 0.42, y - r * 0.45, r * 0.08, x, y, r);
      body.addColorStop(0, c0);
      body.addColorStop(0.55, c1);
      body.addColorStop(1, c2);
      g.fillStyle = body;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      // bandes très légères à l'intérieur
      g.save();
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.clip();
      g.strokeStyle = 'rgba(255,255,255,0.07)';
      g.lineWidth = Math.max(1, r * 0.08);
      var bi;
      for (bi = -2; bi <= 2; bi++) {
        g.beginPath();
        g.ellipse(x, y + bi * r * 0.36, r * 1.1, r * 0.12, -0.18, 0, Math.PI * 2);
        g.stroke();
      }
      var shade = g.createRadialGradient(x + r * 0.55, y + r * 0.6, r * 0.2, x + r * 0.2, y + r * 0.25, r * 1.4);
      shade.addColorStop(0, 'rgba(5,5,20,0.55)');
      shade.addColorStop(1, 'rgba(5,5,20,0)');
      g.fillStyle = shade;
      g.fillRect(x - r, y - r, r * 2, r * 2);
      g.restore();
      if (ring) {
        g.save();
        g.translate(x, y);
        g.rotate(-0.32);
        var rg2 = g.createLinearGradient(-r * 2, 0, r * 2, 0);
        rg2.addColorStop(0, 'rgba(255,214,160,0.15)');
        rg2.addColorStop(0.5, 'rgba(255,226,180,0.8)');
        rg2.addColorStop(0.74, 'rgba(255,220,170,0.42)');
        rg2.addColorStop(0.9, 'rgba(255,214,160,0.08)');
        rg2.addColorStop(1, 'rgba(255,214,160,0)');
        g.strokeStyle = rg2;
        g.lineWidth = Math.max(1, r * 0.09);
        g.beginPath();
        g.ellipse(0, 0, r * 1.95, r * 0.42, 0, 0, Math.PI);
        g.stroke();
        g.restore();
      }
      g.restore();
    }
    var pr = Math.max(14, small * 0.12);
    var planets = [
      // v2373 (propriétaire) : un peu à droite, plus bas et un peu plus petite → la tête de la courbe
      // (60–62 % de la largeur) ne rentre plus dans la planète ; l'anneau reste hors des prix.
      { x: pad.l + w * 0.84, y: pad.t + h * 0.26, r: pr * 0.85 },
      { x: pad.l + w * 0.13, y: pad.t + h * 0.82, r: pr * 0.62 },
      { x: pad.l + w * 0.40, y: pad.t + h * 0.10, r: pr * 0.30 },
      { x: pad.l + w * 0.60, y: pad.t + h * 0.66, r: pr * 0.18 },
      { x: pad.l + w * 0.02, y: pad.t + h * 0.40, r: pr * 0.85 },
      { x: pad.l + w * 0.88, y: pad.t + h * 0.88, r: pr * 0.24 },
      { x: pad.l + w * 0.26, y: pad.t + h * 0.30, r: pr * 0.13 },
      { x: pad.l + w * 0.93, y: pad.t + h * 0.50, r: pr * 0.15 },
      { x: pad.l + w * 0.36, y: pad.t + h * 0.74, r: pr * 0.11 },
      { x: pad.l + w * 0.70, y: pad.t + h * 0.05, r: pr * 0.12 },
      { x: pad.l + w * 0.08, y: pad.t + h * 0.12, r: pr * 0.20 },
      { x: pad.l + w * 0.80, y: pad.t + h * 0.70, r: pr * 0.09 }
    ];
    // Petite galaxie spirale, très douce (décor).
    (function () {
      var gx = pad.l + w * 0.56;
      var gy = pad.t + h * 0.90;
      var gr = Math.max(18, small * 0.16);
      g.save();
      g.translate(gx, gy);
      g.rotate(-0.42);
      g.scale(1, 0.38);
      var sg = g.createRadialGradient(0, 0, 0, 0, 0, gr);
      sg.addColorStop(0, 'rgba(255,236,210,0.55)');
      sg.addColorStop(0.18, 'rgba(200,170,255,0.30)');
      sg.addColorStop(0.6, 'rgba(120,90,230,0.10)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sg;
      g.beginPath();
      g.arc(0, 0, gr, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(210,190,255,0.16)';
      g.lineWidth = 2;
      var ga;
      for (ga = 0; ga < 2; ga++) {
        g.beginPath();
        var gt;
        for (gt = 0; gt <= 1.0001; gt += 0.05) {
          var ang = ga * Math.PI + gt * Math.PI * 1.6;
          var rad = gr * (0.15 + gt * 0.8);
          var px = Math.cos(ang) * rad;
          var py = Math.sin(ang) * rad;
          if (gt === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.stroke();
      }
      g.restore();
    })();
    planet(planets[0].x, planets[0].y, planets[0].r, '#FFE2B8', 'rgba(226,132,46,1)', '#4A1C06', 0.5, true);
    planet(planets[1].x, planets[1].y, planets[1].r, '#CDE8FF', 'rgba(58,123,213,1)', '#0A1A44', 0.45, false);
    planet(planets[2].x, planets[2].y, planets[2].r, '#EEDCFF', 'rgba(139,92,246,1)', '#26105A', 0.5, false);
    planet(planets[3].x, planets[3].y, planets[3].r, '#FFD0C8', 'rgba(220,80,70,1)', '#3A0B0B', 0.35, false);
    planet(planets[4].x, planets[4].y, planets[4].r, '#C8FFF4', 'rgba(20,184,166,1)', '#03312C', 0.22, false);
    planet(planets[5].x, planets[5].y, planets[5].r, '#D9FFC8', 'rgba(101,190,60,1)', '#12300A', 0.42, false);
    planet(planets[6].x, planets[6].y, planets[6].r, '#FFF2C8', 'rgba(230,190,90,1)', '#3A2A08', 0.4, false);
    planet(planets[7].x, planets[7].y, planets[7].r, '#D6F6FF', 'rgba(56,189,248,1)', '#082A44', 0.4, false);
    planet(planets[8].x, planets[8].y, planets[8].r, '#FFD9EC', 'rgba(236,72,153,1)', '#3A0820', 0.38, false);
    planet(planets[9].x, planets[9].y, planets[9].r, '#E8E4FF', 'rgba(160,150,230,1)', '#1E1A44', 0.4, false);
    planet(planets[10].x, planets[10].y, planets[10].r, '#FFE9C8', 'rgba(240,150,70,1)', '#3A1A06', 0.32, true);
    planet(planets[11].x, planets[11].y, planets[11].r, '#C8FFE6', 'rgba(40,200,150,1)', '#05301E', 0.4, false);
    // Cryptos : quelques-unes en orbite autour de la grande planète, les autres semées
    // très discrètement dans l'espace (jamais sur une planète ni sur la colonne des prix).
    var orbit = ['ico-btc', 'ico-eth', 'ico-usdt'];
    var p0 = planets[0];
    // v2374 (propriétaire) : les 3 logos passent en haut à droite de la planète, un peu plus petits,
    // sans toucher les prix (avant : à gauche, sur le chemin de la tête de la courbe).
    var orbitMaxX = pad.l + w - 6;
    for (k = 0; k < orbit.length; k++) {
      var oa = -1.2 + k * 0.5;
      var os = Math.max(8, p0.r * 0.27);
      var ox = Math.min(p0.x + Math.cos(oa) * p0.r * 1.32, orbitMaxX - os / 2);
      var oy = p0.y + Math.sin(oa) * p0.r * 1.32;
      var oimg = coinImg(orbit[k]);
      if (oimg && oimg.complete && oimg.naturalWidth) {
        g.globalAlpha = 0.42;
        g.drawImage(oimg, ox - os / 2, oy - os / 2, os, os);
      }
    }
    g.globalAlpha = 1;
    var nCoins = Math.max(14, Math.round(w * h / 4200));
    var ci = 0;
    var tries = 0;
    var placed = 0;
    while (placed < nCoins && tries < nCoins * 6) {
      tries++;
      var cSize = 14 + rnd() * 7;
      var cx2 = pad.l + cSize + rnd() * Math.max(1, w - cSize * 2.2);
      var cy2 = pad.t + cSize + rnd() * Math.max(1, h - cSize * 2);
      var hit = false;
      var pi;
      for (pi = 0; pi < planets.length; pi++) {
        var dx = cx2 - planets[pi].x;
        var dy = cy2 - planets[pi].y;
        if (Math.sqrt(dx * dx + dy * dy) < planets[pi].r * (pi === 0 ? 2.3 : 1.6) + cSize) { hit = true; break; }
      }
      if (hit) continue;
      var img = coinImg(BACKDROP_COINS[ci % BACKDROP_COINS.length]);
      ci += 5;
      placed++;
      if (img && img.complete && img.naturalWidth) {
        g.globalAlpha = 0.085;
        g.drawImage(img, cx2 - cSize / 2, cy2 - cSize / 2, cSize, cSize);
      }
    }
    g.globalAlpha = 1;
    galaxy = null;
    try { cryptoWorld(g, pad, w, h, planets, planet, rnd, small, pr); } catch (eCw) { galaxy = null; }
    g.globalAlpha = 1;
    bgCanvas = c;
  }

  function drawBackdrop(pad, w, h) {
    var ready = backdropCoinsReady();
    var key = cssW + 'x' + cssH + '@' + dpr + ':' + pad.l + ',' + pad.t + ',' + Math.round(w) + ',' + Math.round(h) + (ready ? '' : ':wait');
    if (!bgCanvas || key !== bgKey) {
      try {
        buildBackdrop(pad, w, h);
        bgKey = key;
      } catch (eBg) {
        bgCanvas = null;
      }
    }
    if (bgCanvas) {
      ctx.drawImage(bgCanvas, 0, 0, cssW, cssH);
      try { drawGalaxy(); } catch (eGal) { galaxy = null; }
    } else {
      ctx.fillStyle = '#0B0E14';
      ctx.fillRect(0, 0, cssW, cssH);
    }
  }

  var wmKey = '';
  var wmCached = 62;
  try { document.fonts.ready.then(function () { wmKey = ''; }); } catch (eFonts) { /* ignore */ }
  function watermarkSize(w, h) {
    var key = Math.round(w) + 'x' + Math.round(h);
    if (key === wmKey) return wmCached;
    ctx.save();
    ctx.font = '800 100px "Plus Jakarta Sans", system-ui, sans-serif';
    var m = ctx.measureText('OROLADO').width || 420;
    ctx.restore();
    wmCached = Math.max(46, Math.min(100 * (w * 0.97) / m, h * 0.48));
    wmKey = key;
    return wmCached;
  }

  function visualFormingCandle(forming) {
    if (!forming || !isFinite(frameDisplayPrice) || frameDisplayPrice <= 0) return forming;
    return {
      o: forming.o,
      h: Math.max(Number(forming.h) || frameDisplayPrice, Number(forming.o) || frameDisplayPrice, frameDisplayPrice),
      l: Math.min(Number(forming.l) || frameDisplayPrice, Number(forming.o) || frameDisplayPrice, frameDisplayPrice),
      c: frameDisplayPrice,
      t: forming.t,
      tk: forming.tk,
      _spike: !!forming._spike,
      _boom: !!forming._boom
    };
  }

  function visibleCandles(market) {
    var live = liveBuffer(activeAsset);
    if ((!live || !live.candles || live.candles.length < 40) && D6.Engine) {
      if (D6.Engine.getBuffer) D6.Engine.getBuffer(activeAsset);
      else if (D6.Engine.getMarket) D6.Engine.getMarket(activeAsset);
      live = liveBuffer(activeAsset);
    }
    var z = Math.ceil((xWin > 0 ? xWin : ((zoomSmooth || zoomSec() || 60) * 1000)) / 1000);
    if (z < 24) z = 24;
    if (z > 1320) z = 1320;
    var n = z;
    var done = (live && live.candles && live.candles.length)
      ? live.candles
      : ((window.assetsState && window.assetsState[activeAsset] && window.assetsState[activeAsset].candles) ||
        ((market && market.candles) || []));
    if (done.length < 8 && market && market.candles && market.candles.length > done.length) {
      done = market.candles;
    }
    candleScratch.length = 0;
    var i;
    var forming = visualFormingCandle((live && live.forming) || (market && market.candle));
    var end = done.length;
    var withForming = !!forming;
    panTrim = 0;
    if (done.length > 1) {
      var histSpan = (xNow + panMs) - done[0].t;
      panDataMaxMs = Math.max(0, histSpan - (xWin > 0 ? xWin : 28000) + CANDLE_DURATION_MS * 0.6);
      panMaxMs = Math.max(0, Math.min(histSpan, HIST_VIEW_MS) - (xWin > 0 ? xWin : 28000) + CANDLE_DURATION_MS * 0.6);
    }
    if (panMs > 0 && done.length) {
      // Historique regardé : seulement les bougies qui tombent dans l'écran (le bout à droite est coupé).
      var rightT = xNow + panRightMs + CANDLE_DURATION_MS;
      while (end > 0 && done[end - 1].t > rightT) end--;
      if (end < done.length) withForming = false;
      n += Math.ceil(panRightMs / CANDLE_DURATION_MS) + 2;
      panTrim = (done.length - end) + ((forming && !withForming && done[done.length - 1].t !== forming.t) ? 1 : 0);
    }
    var start = Math.max(0, end - n);
    for (i = start; i < end; i++) candleScratch.push(done[i]);
    if (withForming) {
      if (!candleScratch.length || candleScratch[candleScratch.length - 1].t !== forming.t) {
        candleScratch.push(forming);
      } else {
        candleScratch[candleScratch.length - 1] = forming;
      }
    }
    return candleScratch;
  }

  function closeSeries(market) {
    tmpCloses.length = 0;
    var live = liveBuffer(activeAsset);
    var done = (live && live.candles && live.candles.length)
      ? live.candles
      : ((market && market.candles) || []);
    var i;
    for (i = 0; i < done.length; i++) tmpCloses.push(done[i].c);
    var forming = visualFormingCandle((live && live.forming) || (market && market.candle));
    if (forming && isFinite(forming.c)) {
      if (!done.length || done[done.length - 1].t !== forming.t) tmpCloses.push(forming.c);
      else tmpCloses[tmpCloses.length - 1] = forming.c;
    }
    return tmpCloses;
  }

  function smaAt(closes, period, i) {
    if (i + 1 < period) return null;
    var s = 0;
    var j;
    for (j = 0; j < period; j++) s += closes[i - j];
    return s / period;
  }

  function stdevAt(closes, period, i, mean) {
    if (i + 1 < period) return 0;
    var s = 0;
    var j;
    for (j = 0; j < period; j++) {
      var d = closes[i - j] - mean;
      s += d * d;
    }
    return Math.sqrt(s / period);
  }

  function rsiSeries(closes, period) {
    var out = new Array(closes.length);
    var i;
    for (i = 0; i < closes.length; i++) out[i] = null;
    if (closes.length <= period) return out;
    var gain = 0;
    var loss = 0;
    for (i = 1; i <= period; i++) {
      var d = closes[i] - closes[i - 1];
      if (d >= 0) gain += d;
      else loss -= d;
    }
    gain /= period;
    loss /= period;
    out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    for (i = period + 1; i < closes.length; i++) {
      var ch = closes[i] - closes[i - 1];
      var g = ch > 0 ? ch : 0;
      var l = ch < 0 ? -ch : 0;
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
      out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    }
    return out;
  }

  function emaSeries(closes, period) {
    var out = new Array(closes.length);
    var i;
    for (i = 0; i < closes.length; i++) out[i] = null;
    if (!closes.length || period < 1) return out;
    var k = 2 / (period + 1);
    var ema = closes[0];
    out[0] = ema;
    for (i = 1; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
      out[i] = ema;
    }
    return out;
  }

  function macdSeries(closes) {
    var ema12 = emaSeries(closes, 12);
    var ema26 = emaSeries(closes, 26);
    var macd = new Array(closes.length);
    var i;
    for (i = 0; i < closes.length; i++) {
      if (ema12[i] == null || ema26[i] == null) macd[i] = null;
      else macd[i] = ema12[i] - ema26[i];
    }
    var signal = emaSeries(macd.map(function (v) { return v == null ? 0 : v; }), 9);
    for (i = 0; i < closes.length; i++) {
      if (macd[i] == null) signal[i] = null;
    }
    return { macd: macd, signal: signal };
  }

  function plotTheme(asset) {
    var id = (asset && asset.id) || activeAsset;
    // Fond unique site — jamais beige/ivoire (Crash/Boom inclus).
    if (id === 'v75' || (asset && asset.plotTheme === 'darkPro')) {
      return {
        id: 'darkPro',
        bg0: '#0B0E14',
        bg1: '#0B0E14',
        gridH: 'rgba(255,255,255,0.05)',
        gridHStrong: 'rgba(255,255,255,0.05)',
        gridV: 'rgba(255,255,255,0.05)',
        border: null,
        priceTxt: '#64748B',
        timeTxt: '#64748B',
        watermark: 'rgba(255,215,0,0.028)',
        rsiBg: 'rgba(8,12,22,0.72)',
        rsiBorder: 'rgba(255,215,0,0.12)',
        rsiTxt: 'rgba(168,180,204,0.85)',
        maFast: 'rgba(255,213,79,0.95)',
        maSlow: 'rgba(0,188,212,0.9)',
        bbFill: 'rgba(255,215,0,0.07)',
        bbStroke: 'rgba(255,215,0,0.28)',
        beadGlow: 'rgba(0,230,118,0.2)'
      };
    }
    return {
      id: 'darkLegacy',
      bg0: '#0B0E14',
      bg1: '#0B0E14',
      gridH: 'rgba(255,255,255,0.05)',
      gridHStrong: 'rgba(255,255,255,0.05)',
      gridV: 'rgba(255,255,255,0.05)',
      border: null,
      priceTxt: '#64748B',
      timeTxt: '#64748B',
      watermark: 'rgba(255,215,0,0.028)',
      rsiBg: 'rgba(8,12,22,0.72)',
      rsiBorder: 'rgba(255,215,0,0.12)',
      rsiTxt: 'rgba(168,180,204,0.85)',
      maFast: 'rgba(255,213,79,0.95)',
      maSlow: 'rgba(0,188,212,0.9)',
      bbFill: 'rgba(255,215,0,0.07)',
      bbStroke: 'rgba(255,215,0,0.28)',
      beadGlow: 'rgba(255,215,0,0.16)'
    };
  }

  function formatAxisPrice(p) {
    var n = Number(p);
    if (!isFinite(n)) return '—';
    if (Math.abs(n) >= 100000) n = ((n % 9000) + 1000);
    return n.toFixed(2);
  }

  // Paliers temporels standards : une fenêtre de 60 s tombe sur 15 s, comme sur
  // les plateformes classiques. Jamais de valeur bâtarde type 7 s ou 105 s.
  var TIME_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  // Marge incompressible entre le dernier chiffre du cours et le bord droit.
  var PRICE_AXIS_GAP = 14;

  function gridStepSec(span) {
    var k;
    for (k = 0; k < TIME_STEPS.length; k++) {
      if (TIME_STEPS[k] >= span / 4) return TIME_STEPS[k];
    }
    return TIME_STEPS[TIME_STEPS.length - 1];
  }

  function gridStepX(seriesW, span) {
    return gridStepSec(span) * (seriesW / Math.max(1, span));
  }

  function drawGrid(pad, plotW, seriesW, h, minP, maxP, theme) {
    theme = theme || plotTheme(null);
    var i;
    var span = zoomSmooth || zoomSec();
    ctx.lineWidth = 1;
    // Pas horizontal de référence : c'est lui qui donne au maillage sa maille
    // carrée, les lignes de prix s'alignent ensuite sur le même écart.
    // v2377 (propriétaire) : mêmes carreaux sur les 10 marchés, et les traits verticaux DÉFILENT avec le
    // temps, exactement au rythme des bougies (comme les grandes plateformes). Dessin seulement : aucun
    // prix, trade ou calcul n'en dépend.
    var cellPx = Math.max(44, Math.min(84, cssW / 6));
    var rowsY = Math.max(3, Math.min(11, Math.round(cssH / cellPx)));
    if (rowsY % 2 === 0) rowsY += (cssH / (rowsY + 1) >= 36) ? 1 : -1;
    var rowH = cssH / rowsY;
    for (i = 0; i < rowsY; i++) {
      var y = rowH * (i + 0.5);
      var pVal = maxP - ((y - pad.t) / Math.max(1, h)) * (maxP - minP);
      // Police resserrée sur écran étroit : la colonne reste discrète sans
      // jamais rogner les décimales.
      ctx.font = (cssW < 500 ? '500 8.5px ' : '500 9px ') +
        '"Plus Jakarta Sans", "Hanken Grotesk", sans-serif';
      // Les lignes de prix vont d'un bord à l'autre (plus de creux à gauche ni sous la colonne des prix) ;
      // elles s'interrompent juste le temps du chiffre du prix.
      var lblW = ctx.measureText(formatAxisPrice(pVal)).width;
      var lblL = cssW - PRICE_AXIS_GAP - lblW - 4;
      ctx.strokeStyle = theme.gridH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(Math.max(0, lblL), y);
      ctx.moveTo(Math.min(cssW, cssW - PRICE_AXIS_GAP + 3), y);
      ctx.lineTo(cssW, y);
      ctx.stroke();
      ctx.fillStyle = '#64748B';
      // Calage à droite sur une marge de sécurité fixe : les décimales ne
      // peuvent plus être rognées par le bord de l'écran, quelle que soit la
      // longueur du cours.
      ctx.textAlign = 'right';
      ctx.fillText(formatAxisPrice(pVal), cssW - PRICE_AXIS_GAP, y + 3);
    }
    // Maillage vertical à pas rigoureusement constant, décalé d'un demi-pas :
    // la tête tombe au centre d'un carreau, sans trait par-dessus. Plus aucun
    // libellé de secondes n'est tracé : la hauteur ainsi libérée revient à la
    // courbe.
    // Les carreaux couvrent toute la largeur et toute la hauteur (sous la colonne des prix aussi).
    // Traits verticaux posés sur des instants fixes (tous les S secondes) et placés avec la même règle
    // que les bougies (x = tête + (instant − maintenant) × largeur d'une seconde) : ils glissent vers la
    // gauche avec la courbe. S est choisi pour que le carreau ait la même taille sur tous les marchés à leur
    // zoom de départ ; quand on zoome, les carreaux grandissent / rétrécissent (et se dédoublent).
    var sW = Math.max(32, seriesW);
    var pxSec = candleStepWidth(sW);
    var headX = pad.l + sW;
    var S = gridCellSeconds(sW);
    if (pxSec > 0 && S > 0 && isFinite(xNow) && xNow > 0) {
      var guard = 0;
      while (S * pxSec < cellPx * 0.55 && guard++ < 12) S *= 2;
      while (S * pxSec > cellPx * 1.8 && guard++ < 24) S /= 2;
      var stepMs = S * 1000;
      var tLeft = xNow - (headX / pxSec) * 1000;
      var tRight = xNow + ((cssW - headX) / pxSec) * 1000;
      var T = Math.floor(tLeft / stepMs) * stepMs;
      ctx.strokeStyle = theme.gridV;
      ctx.beginPath();
      for (guard = 0; T <= tRight + stepMs && guard < 80; T += stepMs, guard++) {
        var gx = Math.round(headX + ((T - xNow) / 1000) * pxSec) + 0.5;
        if (gx < 0 || gx > cssW) continue;
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, cssH);
      }
      ctx.stroke();
    }  }

  // Durée (secondes) d'un carreau : la même taille à l'écran pour tous les marchés à leur zoom de départ.
  function gridCellSeconds(sW) {
    var w0 = ZOOM_STEPS[defaultZoomIdx(activeAsset)] || 28;
    if (fsActive && activeAsset !== 'boomspike') w0 *= 0.75;
    else if (!fsActive && activeAsset === 'v100') w0 *= 0.74;
    w0 = Math.max(8, w0);
    var cellPx = Math.max(44, Math.min(84, cssW / 6));
    return cellPx * w0 / Math.max(1, sW);
  }

  function drawCandles(pad, w, h, candles, minP, maxP, opts) {
    if (!candles || candles.length < 2) return null;
    opts = opts || {};
    var thin = !!opts.thin;
    var span = Math.max(maxP - minP, 0.01);
    var n = candles.length;
    // Largeur = vrai espace entre deux bougies (placées selon le temps). Avant : écran ÷ nombre de
    // bougies (au moins 24), donc bougies maigres et espacées dès que le zoom montrait moins de 24 s.
    var slot = Math.max(w / Math.max(1, n), candleStepWidth(w));
    // Géométrie nette : corps de 5 px, espacement de 3 px, et surtout un corps
    // qui ne dépasse JAMAIS la place réellement disponible. L'ancien plancher
    // de 5 px indépendant du pas faisait se chevaucher les bougies au dézoom,
    // d'où la bouillie floue.
    // Bougies un peu plus larges (elles étaient maigres sur téléphone) : espace plus fin entre elles.
    var gap = Math.min(2.4, Math.max(0.6, slot * 0.18));
    var maxBody = 5;
    if (opts.boomSmall) maxBody = 4;
    // ORO 888 : bougies violettes un peu plus larges.
    if (opts.apexAiry) maxBody = 6;
    // Titan Pulse : +40 % de largeur par rapport aux bougies ordinaires.
    if (opts.titanWide) maxBody = 13;
    // Volatility 100 (actif principal) : grosses bougies façon TradingView.
    if (opts.v100Big) maxBody = 12;
    // BAAL : la bougie calme, gros carreaux.
    if (opts.horizonOrange) maxBody = 14;
    maxBody *= sizeK();
    var cw = Math.max(1, Math.min(maxBody, slot - gap));
    var toX = makeToX(candles.length, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var visH = Math.max(maxP - minP, 0.01);
    var capVis = visH * 0.55;
    var i;
    for (i = 0; i < candles.length; i++) {
      var c = candles[i];
      var up = c.c >= c.o;
      var col = up ? '#00E676' : '#ff3b30';
      if (opts.nexusCyber) col = up ? '#00E5FF' : '#1565C0';
      if (opts.v75Rose) col = up ? '#E0001B' : '#7A000C';
      if (opts.apexAiry) col = up ? '#C084FC' : '#7C3AED';
      // AZAZEL : braise orange à la hausse, rouge feu à la baisse.
      if (opts.crashDrop) col = up ? '#FF9F43' : '#FF3B30';
      // Titan Pulse : blanc pur, sans aucune teinte froide.
      var edgeCol = null;
      // APOCALYPSE : lumière blanche à la hausse, rouge sang à la baisse.
      if (opts.titanWhite) {
        col = up ? '#FFFFFF' : '#FF1744';
        edgeCol = col;
      }
      // Oro Horizon 50 : orange pur, corps rayé.
      if (opts.horizonOrange) {
        col = up ? '#ff9800' : '#b35f00';
        edgeCol = '#ff9800';
      }
      var hiB = Math.max(c.o, c.c);
      var loB = Math.min(c.o, c.c);
      var hWick = c.h;
      var lWick = c.l;
      if (!(isFinite(hWick))) hWick = hiB;
      if (!(isFinite(lWick))) lWick = loB;
      var wickRange = hWick - lWick;
      // BAAL (Boom) : les longs pics sont vrais, leur mèche n'est jamais coupée (avant : pic « cassé »).
      if (wickRange > capVis && !opts.horizonOrange) {
        var midW = (hWick + lWick) / 2;
        hWick = midW + capVis / 2;
        lWick = midW - capVis / 2;
      }
      // Mèche fine et centrée sur le corps.
      var x = toX(i);
      ctx.strokeStyle = edgeCol || col;
      ctx.lineWidth = opts.v100Big ? 1.4 : (opts.titanWhite ? 1.6 : 1);
      ctx.beginPath();
      ctx.moveTo(x, toY(hWick));
      ctx.lineTo(x, toY(lWick));
      ctx.stroke();
      var y1 = toY(Math.max(c.o, c.c));
      var y2 = toY(Math.min(c.o, c.c));
      // Titan Pulse : corps massifs, jamais réduits à un filet.
      var bh = Math.max(opts.titanWhite ? 4 : (opts.v75Rose ? 2.4 : 3), y2 - y1);
      var boomHit = !!(opts.boomNeon && (c._boom || c._spike) && up);
      if (boomHit) {
        ctx.shadowColor = 'rgba(0,230,118,0.7)';
        ctx.shadowBlur = 11;
      } else if (opts.crashDrop && !up && (c._spike || i === candles.length - 1)) {
        ctx.shadowColor = 'rgba(255,59,48,0.65)';
        ctx.shadowBlur = 10;
      } else if (opts.v75Rose && i === candles.length - 1) {
        ctx.shadowColor = up ? 'rgba(224,0,27,0.55)' : 'rgba(122,0,12,0.6)';
        ctx.shadowBlur = 8;
      } else if (opts.nexusCyber && i === candles.length - 1) {
        ctx.shadowColor = up ? 'rgba(0,229,255,0.55)' : 'rgba(21,101,192,0.4)';
        ctx.shadowBlur = 8;
      } else if (opts.horizonOrange && i === candles.length - 1) {
        ctx.shadowColor = 'rgba(255,152,0,0.5)';
        ctx.shadowBlur = 9;
      } else if (!thin && i === candles.length - 1 && cssH >= 200 && !opts.v75Rose &&
        !opts.titanWhite && !opts.horizonOrange) {
        ctx.shadowColor = opts.apexAiry ? 'rgba(192,132,252,0.7)' : (up ? 'rgba(0,230,118,0.45)' : 'rgba(255,23,68,0.4)');
        ctx.shadowBlur = 8;
      }
      if (opts.titanWhite) {
        // Halo sans flou (léger pour les téléphones) + corps plein ; vrai flou
        // lumineux seulement sur la bougie en cours.
        ctx.fillStyle = up ? 'rgba(255,255,255,0.16)' : 'rgba(255,23,68,0.2)';
        ctx.fillRect(x - cw / 2 - 2, y1 - 2, cw + 4, bh + 4);
        if (i === candles.length - 1) {
          ctx.shadowColor = up ? 'rgba(255,255,255,0.9)' : 'rgba(255,23,68,0.9)';
          ctx.shadowBlur = 14;
        }
        if (up) {
          // Hausse : contour blanc lumineux, corps rayé (style Python, en plus fort).
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          ctx.fillRect(x - cw / 2, y1, cw, bh);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          var ay;
          for (ay = y1 + 2; ay < y1 + bh - 1; ay += 3) ctx.fillRect(x - cw / 2 + 1, ay, Math.max(1, cw - 2), 1);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(x - cw / 2 + 0.7, y1 + 0.7, Math.max(1, cw - 1.4), Math.max(1, bh - 1.4));
        } else {
          ctx.fillStyle = col;
          ctx.fillRect(x - cw / 2, y1, cw, bh);
        }
      } else if (opts.horizonOrange && Math.abs(c.c - c.o) > Math.abs(c.o) * 0.0010) {
        // ORO 999 : un GRAND PIC (vers le haut OU vers le bas, ≥ 0,1 % d'un coup) = bougie JAUNE PUR lumineuse,
        // bien différente des petites bougies orange (demande du propriétaire).
        var gSp = ctx.createLinearGradient(0, y1, 0, y1 + bh);
        gSp.addColorStop(0, '#FFFBD0');
        gSp.addColorStop(0.4, '#FFEA00');
        gSp.addColorStop(1, '#FFD000');
        ctx.shadowColor = 'rgba(255,234,0,0.85)';
        ctx.shadowBlur = 14;
        ctx.fillStyle = gSp;
        ctx.fillRect(x - cw / 2, y1, cw, bh);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FFF59D';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - cw / 2 + 0.5, y1 + 0.5, Math.max(1, cw - 1), Math.max(1, bh - 1));
      } else if (opts.horizonOrange) {
        ctx.fillStyle = col;
        ctx.fillRect(x - cw / 2, y1, cw, bh);
        ctx.fillStyle = up ? 'rgba(92,40,4,0.5)' : 'rgba(0,0,0,0.35)';
        var sy;
        for (sy = y1 + 1.5; sy < y1 + bh - 0.5; sy += 3) {
          ctx.fillRect(x - cw / 2, sy, cw, 1);
        }
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - cw / 2 + 0.5, y1 + 0.5, Math.max(1, cw - 1), Math.max(1, bh - 1));
      } else if (opts.v75Rose && up) {
        ctx.strokeStyle = '#E0001B';
        ctx.lineWidth = 1.15;
        ctx.strokeRect(x - cw / 2, y1, cw, bh);
      } else if (opts.v75Rose) {
        ctx.fillStyle = '#7A000C';
        ctx.fillRect(x - cw / 2, y1, cw, bh);
      } else if (opts.apexAiry) {
        // ORO 888 : corps violet plein, liseré clair en haut (effet bijou).
        ctx.fillStyle = col;
        ctx.fillRect(x - cw / 2, y1, cw, bh);
        ctx.fillStyle = up ? 'rgba(243,232,255,0.85)' : 'rgba(196,181,253,0.55)';
        ctx.fillRect(x - cw / 2, y1, cw, Math.min(1.5, bh));
      } else {
        ctx.fillStyle = col;
        ctx.fillRect(x - cw / 2, y1, cw, bh);
      }
      ctx.shadowBlur = 0;
    }
    var last = candles[candles.length - 1];
    // Boule du prix en direct posée au centre de la dernière bougie (comme les grandes plateformes).
    return { toX: toX, toY: toY, lastX: toX(candles.length - 1), lastY: toY(last.c), count: candles.length };
  }

  /*
   * Quatre styles à part (mêmes bougies d'une seconde, mêmes prix, mêmes règles ; seul le dessin
   * change) : ORO 888 = perles, AZAZEL = colonnes de braise, ASMODUS = cristaux,
   * PYTHON = barres de trader, OROF (la maison) = pyramides d'or,
   * APOCALYPSE = le dieu : un éclair par seconde (lumière et sang). Chaque point est au centre de sa seconde, comme les bougies :
   * le rond du trade, la ligne objectif et la boule tombent au même endroit.
   */
  var STYLED_ASSETS = { apex500: 'pearls', crash300: 'embers', nexusprime: 'crystals', v75: 'bars', goldtrend: 'pyramids', titanpulse: 'bolts' };

  function drawStyledCandles(pad, w, h, candles, minP, maxP, style) {
    if (!candles || candles.length < 2) return null;
    var n = candles.length;
    var slot = Math.max(w / Math.max(1, n), candleStepWidth(w));
    var toX = makeToX(n, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var visH = Math.max(maxP - minP, 0.01);
    var capVis = visH * 0.55;
    var last = n - 1;
    var i;
    var c;
    var x;
    var up;
    if (style === 'pearls') {
      // ORO 888 : fil violet discret qui relie des perles ; une perle grossit quand ça bouge fort.
      ctx.save();
      ctx.strokeStyle = 'rgba(192,132,252,0.38)';
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        x = toX(i);
        if (i === 0) ctx.moveTo(x, toY(candles[i].c)); else ctx.lineTo(x, toY(candles[i].c));
      }
      ctx.stroke();
      var rMax = Math.max(2.6, Math.min(8 * sizeK(), slot * 0.46));
      for (i = 0; i < n; i++) {
        c = candles[i];
        up = c.c >= c.o;
        x = toX(i);
        var y = toY(c.c);
        var move = Math.abs(toY(c.o) - y);
        var r = Math.max(2.4, Math.min(rMax, 2.4 + move * 0.35));
        if (i === last && cssH >= 200) {
          ctx.shadowColor = 'rgba(192,132,252,0.85)';
          ctx.shadowBlur = 12;
        }
        ctx.fillStyle = up ? '#C084FC' : '#7C3AED';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = up ? 'rgba(250,245,255,0.85)' : 'rgba(221,214,254,0.6)';
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.3, Math.max(0.8, r * 0.32), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (style === 'embers') {
      // AZAZEL : colonnes qui montent du bas jusqu'au prix, braise orange (hausse) / rouge feu (baisse).
      ctx.save();
      // Les colonnes sortent du sol : elles descendent jusqu'au bas du cadre (avant : bande vide sous
      // les colonnes, comme si AZAZEL était coupé). Dessin seulement, les prix ne changent pas.
      var bot = Math.max(pad.t + h, cssH || 0);
      var gUp = ctx.createLinearGradient(0, pad.t, 0, bot);
      gUp.addColorStop(0, 'rgba(255,159,67,0.85)');
      gUp.addColorStop(1, 'rgba(255,159,67,0.38)');
      var gDn = ctx.createLinearGradient(0, pad.t, 0, bot);
      gDn.addColorStop(0, 'rgba(255,59,48,0.85)');
      gDn.addColorStop(1, 'rgba(255,59,48,0.38)');
      var cwE = Math.max(1, Math.min(12 * sizeK(), slot * 0.72));
      for (i = 0; i < n; i++) {
        c = candles[i];
        up = c.c >= c.o;
        x = toX(i);
        var top = Math.max(pad.t, Math.min(bot, toY(c.c)));
        ctx.fillStyle = up ? gUp : gDn;
        ctx.fillRect(x - cwE / 2, top, cwE, bot - top);
        if (i === last && cssH >= 200) {
          ctx.shadowColor = up ? 'rgba(255,159,67,0.9)' : 'rgba(255,59,48,0.9)';
          ctx.shadowBlur = 12;
        }
        ctx.fillStyle = up ? '#FFB570' : '#FF5A4E';
        ctx.fillRect(x - cwE / 2, top - 1, cwE, 2.5);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    } else if (style === 'bolts') {
      // APOCALYPSE, le dieu : un éclair par seconde, qui frappe du prix d'ouverture au prix de clôture.
      // Hausse = éclair blanc éclatant (lueur rouge) ; baisse = éclair rouge sang (cœur blanc).
      // Le dernier éclair brille simplement un peu plus (sobre, rien qui tourne). Ciel rouge sombre qui
      // respire. Un éclair sorti du cadre disparaît au lieu d'être coupé au bord.
      ctx.save();
      var topY = pad.t;
      var botY = pad.t + h;
      var tMs = xNow || Date.now();
      var off = Math.max(1.6, Math.min(5 * sizeK(), slot * 0.3));
      var lxS = toX(last);
      var lyS = Math.max(topY, Math.min(botY, toY(candles[last].c)));
      var breath = 0.75 + 0.25 * Math.sin(tMs / 700);
      var gSky = ctx.createRadialGradient(lxS, lyS, 0, lxS, lyS, Math.max(w, h) * 0.9);
      gSky.addColorStop(0, 'rgba(150,0,25,' + (0.2 * breath).toFixed(3) + ')');
      gSky.addColorStop(0.5, 'rgba(90,0,15,0.07)');
      gSky.addColorStop(1, 'rgba(0,0,0,0)');
      // (Ciel rouge retiré : le propriétaire voyait un « fond rouge » dans la courbe.)
      void gSky;
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'round';
      var bolt = function (bx, y0, y1, flip) {
        var d = y1 - y0;
        var s = flip ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(bx, y0);
        ctx.lineTo(bx + off * s, y0 + d * 0.38);
        ctx.lineTo(bx - off * 0.6 * s, y0 + d * 0.52);
        ctx.lineTo(bx + off * 0.5 * s, y0 + d * 0.78);
        ctx.lineTo(bx, y1);
      };
      // Sens du zigzag attaché à LA SECONDE de l'éclair (son tick), pas à sa place dans la liste :
      // avant, chaque nouvelle seconde décalait tout d'une place et TOUS les éclairs se retournaient.
      // Écart entre deux secondes = le plus petit écart vu (robuste si une seconde manque).
      var tkStep = 0;
      for (i = 1; i < n; i++) {
        var dTk = (candles[i].tk != null && candles[i - 1].tk != null) ? candles[i].tk - candles[i - 1].tk : 0;
        if (dTk > 0 && (!tkStep || dTk < tkStep)) tkStep = dTk;
      }
      for (i = 0; i < n; i++) {
        c = candles[i];
        up = c.c >= c.o;
        x = toX(i);
        var yS = toY(c.o);
        var yE = toY(c.c);
        if (yE < topY + 2 || yE > botY - 2) continue;
        // Éclair toujours visible : au moins 12 px de long, CENTRÉ entre ouverture et clôture
        // (avant : quand le prix repassait l'ouverture, l'éclair sautait de 24 px d'un côté à l'autre).
        if (Math.abs(yE - yS) < 12) {
          var yMid = (yS + yE) / 2;
          yS = yMid + (up ? 6 : -6);
          yE = yMid + (up ? -6 : 6);
        }
        yS = Math.max(topY, Math.min(botY, yS));
        var flip = tkStep ? (Math.round(c.tk / tkStep) % 2) === 1 : (i % 2) === 1;
        var isLast = i === last && cssH >= 200;
        var flick = 1;
        // Lueur (trait large et transparent), puis corps, puis cœur fin.
        ctx.globalAlpha = flick;
        ctx.strokeStyle = up ? 'rgba(255,40,70,0.35)' : 'rgba(255,23,68,0.45)';
        ctx.lineWidth = (isLast ? 7 : 4.5) * sizeK();
        bolt(x, yS, yE, flip);
        ctx.stroke();
        ctx.strokeStyle = up ? '#FFFFFF' : '#FF1744';
        ctx.lineWidth = (isLast ? 2.6 : 2) * sizeK();
        if (isLast) {
          ctx.shadowColor = up ? 'rgba(255,255,255,1)' : 'rgba(255,23,68,1)';
          ctx.shadowBlur = IS_ANDROID_CHART ? 10 : 18;
        }
        bolt(x, yS, yE, flip);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = up ? 'rgba(255,220,225,0.9)' : 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 0.9;
        bolt(x, yS, yE, flip);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    } else if (style === 'pyramids') {
      // OROF (la maison, comme le logo) : une rangée de pyramides d'Égypte, toujours debout, dont le
      // sommet se pose sur le prix de clôture. Or vif quand la seconde monte, bronze quand elle
      // descend. Face éclairée à gauche, face dans l'ombre à droite, arêtes fines. La dernière porte
      // une pierre de sommet lumineuse (comme le logo OROLADO).
      ctx.save();
      var pB = Math.max(5, Math.min(16 * sizeK(), slot * 0.96));
      var pH = pB * 0.78;
      for (i = 0; i < n; i++) {
        c = candles[i];
        up = c.c >= c.o;
        x = toX(i);
        var apex = toY(c.c);
        var foot = apex + pH;
        if (apex < pad.t || foot > pad.t + h + pH) continue;
        ctx.fillStyle = up ? '#FFD54F' : '#A87B2C';
        ctx.beginPath();
        ctx.moveTo(x, apex);
        ctx.lineTo(x - pB / 2, foot);
        ctx.lineTo(x + pB * 0.08, foot);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = up ? '#C98A00' : '#6E4E14';
        ctx.beginPath();
        ctx.moveTo(x, apex);
        ctx.lineTo(x + pB * 0.08, foot);
        ctx.lineTo(x + pB / 2, foot);
        ctx.closePath();
        ctx.fill();
        // Arêtes : un fil clair sur l'arête centrale, une ligne de sol.
        ctx.strokeStyle = up ? 'rgba(255,248,220,0.7)' : 'rgba(230,200,140,0.45)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, apex);
        ctx.lineTo(x + pB * 0.08, foot);
        ctx.stroke();
        if (i === last && cssH >= 200) {
          // Pierre de sommet lumineuse.
          var gCap = ctx.createRadialGradient(x, apex, 0, x, apex, pB * 1.1);
          gCap.addColorStop(0, 'rgba(255,236,160,0.75)');
          gCap.addColorStop(1, 'rgba(255,193,7,0)');
          ctx.fillStyle = gCap;
          ctx.beginPath();
          ctx.arc(x, apex, pB * 1.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFF8E1';
          ctx.beginPath();
          ctx.moveTo(x, apex);
          ctx.lineTo(x - pB * 0.16, apex + pH * 0.2);
          ctx.lineTo(x + pB * 0.16, apex + pH * 0.2);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (style === 'crystals') {
      // ASMODUS : une rangée de cristaux (losanges) : haut du losange = plus haut de la seconde,
      // bas = plus bas, centre = prix de clôture. Cyan à la hausse, bleu profond à la baisse.
      ctx.save();
      var halfW = Math.max(2.2, Math.min(8 * sizeK(), slot * 0.5));
      for (i = 0; i < n; i++) {
        c = candles[i];
        up = c.c >= c.o;
        x = toX(i);
        var hiC = isFinite(c.h) ? c.h : Math.max(c.o, c.c);
        var loC = isFinite(c.l) ? c.l : Math.min(c.o, c.c);
        if (hiC - loC > capVis) { var midC = (hiC + loC) / 2; hiC = midC + capVis / 2; loC = midC - capVis / 2; }
        var yc = toY(c.c);
        var yT = Math.min(toY(hiC), yc - 7);
        var yB = Math.max(toY(loC), yc + 7);
        if (i === last && cssH >= 200) {
          ctx.shadowColor = up ? 'rgba(0,229,255,0.9)' : 'rgba(41,121,255,0.9)';
          ctx.shadowBlur = 12;
        }
        ctx.fillStyle = up ? 'rgba(0,229,255,0.85)' : 'rgba(21,101,192,0.95)';
        ctx.beginPath();
        ctx.moveTo(x, yT);
        ctx.lineTo(x + halfW, yc);
        ctx.lineTo(x, yB);
        ctx.lineTo(x - halfW, yc);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Reflet : petite facette claire en haut à gauche (effet pierre taillée).
        ctx.fillStyle = up ? 'rgba(224,255,255,0.75)' : 'rgba(144,202,249,0.55)';
        ctx.beginPath();
        ctx.moveTo(x, yT);
        ctx.lineTo(x, yc);
        ctx.lineTo(x - halfW, yc);
        ctx.closePath();
        ctx.globalAlpha = 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    } else {
      // ZUL : barres de trader rouge sang (trait haut-bas, crochet à gauche = ouverture, à droite = clôture).
      ctx.save();
      var tick = Math.max(2.5, Math.min(7 * sizeK(), slot * 0.42));
      ctx.lineCap = 'butt';
      for (i = 0; i < n; i++) {
        c = candles[i];
        up = c.c >= c.o;
        x = toX(i);
        var hw = isFinite(c.h) ? c.h : Math.max(c.o, c.c);
        var lw = isFinite(c.l) ? c.l : Math.min(c.o, c.c);
        if (hw - lw > capVis) { var mw = (hw + lw) / 2; hw = mw + capVis / 2; lw = mw - capVis / 2; }
        var yTop = toY(hw);
        var yBot = toY(lw);
        if (yBot - yTop < 3) { var yMid = (yTop + yBot) / 2; yTop = yMid - 1.5; yBot = yMid + 1.5; }
        if (i === last && cssH >= 200) {
          ctx.shadowColor = up ? 'rgba(230,10,30,0.8)' : 'rgba(150,0,15,0.8)';
          ctx.shadowBlur = 10;
        }
        ctx.strokeStyle = up ? '#F0102A' : '#A8000F';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yBot);
        ctx.moveTo(x - tick, toY(c.o));
        ctx.lineTo(x, toY(c.o));
        ctx.moveTo(x, toY(c.c));
        ctx.lineTo(x + tick, toY(c.c));
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
    return { toX: toX, toY: toY, lastX: toX(last), lastY: toY(candles[last].c), count: n };
  }

  function drawTrendLine(pad, w, h, candles, minP, maxP) {
    if (!candles || candles.length < 2) return;
    var span = Math.max(maxP - minP, 0.01);
    var toX = makeToX(candles.length, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var i;
    for (i = 1; i < candles.length; i++) {
      var a = candles[i - 1].c;
      var b = candles[i].c;
      var up = b >= a;
      ctx.beginPath();
      ctx.moveTo(toX(i - 1), toY(a));
      ctx.lineTo(toX(i), toY(b));
      ctx.strokeStyle = up ? '#00E676' : '#FF1744';
      ctx.lineWidth = 2.8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  function drawCoreLine(pad, w, h, data, minP, maxP, color, width) {
    if (!data || data.length < 2) return null;
    var col = color || '#ff2d55';
    var toX = makeToX(data.length, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var lastX = panMs > 0 ? toX(data.length - 1) : pad.l + w;
    var lastY = toY(data[data.length - 1]);
    var i;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (i = 1; i < data.length; i++) {
      ctx.lineTo(toX(i), toY(data[i]));
    }
    ctx.lineTo(lastX, lastY);
    ctx.strokeStyle = col;
    ctx.lineWidth = width || 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (col === '#ff2244' || col === '#ff2d75') {
      ctx.shadowColor = col === '#ff2d75' ? 'rgba(255,45,117,0.55)' : 'rgba(255,34,68,0.55)';
      ctx.shadowBlur = 8;
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
    ctx.stroke();
    ctx.restore();
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: data.length };
  }

  // Courbe lissée en béziers cubiques (tangentes Catmull-Rom) avec remplissage
  // dégradé sous le tracé : plus d'angles cassés ni d'effet d'escalier.
  function drawGradientLine(pad, w, h, data, minP, maxP, color, width, fillRgb) {
    if (!data || data.length < 2) return null;
    var toX = makeToX(data.length, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var lastX = panMs > 0 ? toX(data.length - 1) : pad.l + w;
    var lastY = toY(data[data.length - 1]);
    var last = data.length - 1;
    function tracePath() {
      var k;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(data[0]));
      for (k = 0; k < last; k++) {
        var p0 = Math.max(0, k - 1);
        var p3 = Math.min(last, k + 2);
        var x1 = toX(k);
        var y1 = toY(data[k]);
        var x2 = toX(k + 1);
        var y2 = toY(data[k + 1]);
        ctx.bezierCurveTo(
          x1 + (x2 - toX(p0)) / 6, y1 + (y2 - toY(data[p0])) / 6,
          x2 - (toX(p3) - x1) / 6, y2 - (toY(data[p3]) - y1) / 6,
          x2, y2
        );
      }
      ctx.lineTo(lastX, lastY);
    }
    ctx.save();
    tracePath();
    ctx.lineTo(lastX, pad.t + h);
    ctx.lineTo(toX(0), pad.t + h);
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + h);
    grad.addColorStop(0, 'rgba(' + fillRgb + ',0.26)');
    grad.addColorStop(0.55, 'rgba(' + fillRgb + ',0.08)');
    grad.addColorStop(1, 'rgba(' + fillRgb + ',0)');
    ctx.fillStyle = grad;
    ctx.fill();
    tracePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: data.length };
  }

  function drawLine(pad, w, h, data, minP, maxP, color) {
    if (!data || data.length < 2) return null;
    var col = color || '#f5a623';
    var toX = makeToX(data.length, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var lastX = panMs > 0 ? toX(data.length - 1) : pad.l + w;
    var lastY = toY(data[data.length - 1]);
    var i;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (i = 1; i < data.length; i++) {
      var cx = (toX(i - 1) + toX(i)) / 2;
      var cy = (toY(data[i - 1]) + toY(data[i])) / 2;
      ctx.quadraticCurveTo(toX(i - 1), toY(data[i - 1]), cx, cy);
    }
    ctx.lineTo(lastX, lastY);
    ctx.save();
    ctx.lineTo(lastX, pad.t + h);
    ctx.lineTo(toX(0), pad.t + h);
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + h);
    grad.addColorStop(0, 'rgba(245,166,35,0.28)');
    grad.addColorStop(1, 'rgba(245,166,35,0)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (i = 1; i < data.length; i++) {
      var cx2 = (toX(i - 1) + toX(i)) / 2;
      var cy2 = (toY(data[i - 1]) + toY(data[i])) / 2;
      ctx.quadraticCurveTo(toX(i - 1), toY(data[i - 1]), cx2, cy2);
    }
    ctx.lineTo(lastX, lastY);
    ctx.strokeStyle = col;
    ctx.lineWidth = col === '#ffb300' ? 3.2 : 2.2;
    ctx.shadowColor = 'rgba(245,166,35,0.85)';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: data.length };
  }

  function drawSmoothLine(pad, w, h, data, minP, maxP, color, width, halo) {
    if (!data || data.length < 2) return null;
    var toX = makeToX(data.length, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var lastX = panMs > 0 ? toX(data.length - 1) : pad.l + w;
    var lastY = toY(data[data.length - 1]);
    var i;
    var col = color || '#FF7A00';
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (i = 1; i < data.length; i++) {
      var cx = (toX(i - 1) + toX(i)) / 2;
      var cy = (toY(data[i - 1]) + toY(data[i])) / 2;
      ctx.quadraticCurveTo(toX(i - 1), toY(data[i - 1]), cx, cy);
    }
    ctx.lineTo(lastX, lastY);
    if (halo) {
      ctx.strokeStyle = halo;
      ctx.lineWidth = (width || 1.55) + 3.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(data[0]));
      for (i = 1; i < data.length; i++) {
        var hx = (toX(i - 1) + toX(i)) / 2;
        var hy = (toY(data[i - 1]) + toY(data[i])) / 2;
        ctx.quadraticCurveTo(toX(i - 1), toY(data[i - 1]), hx, hy);
      }
      ctx.lineTo(lastX, lastY);
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = width || 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = halo || 'rgba(255,122,0,0.35)';
    ctx.shadowBlur = halo ? 12 : 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: data.length };
  }

  function drawStepLine(pad, w, h, data, minP, maxP, color, accent, width) {
    if (!data || data.length < 2) return null;
    var span = Math.max(maxP - minP, 0.01);
    var toX = makeToX(data.length, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var i;
    for (i = 1; i < data.length; i++) {
      var x0 = toX(i - 1);
      var y0 = toY(data[i - 1]);
      var x1 = toX(i);
      var y1 = toY(data[i]);
      var rising = data[i] > data[i - 1] + 0.0001;
      var falling = data[i] < data[i - 1] - 0.0001;
      // Segments orange rares sur marches montantes marquées.
      var useAccent = accent && rising && ((i * 17) % 11 === 0);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = useAccent ? accent : (color || '#2F6BFF');
      ctx.lineWidth = width || 3;
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
      ctx.stroke();
      if (falling) {
        ctx.strokeStyle = color || '#2F6BFF';
      }
    }
    var lastX = panMs > 0 ? toX(data.length - 1) : pad.l + w;
    var lastY = toY(data[data.length - 1]);
    ctx.beginPath();
    ctx.moveTo(toX(data.length - 1), lastY);
    ctx.lineTo(lastX, lastY);
    ctx.strokeStyle = color || '#2F6BFF';
    ctx.lineWidth = width || 3;
    ctx.stroke();
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: data.length };
  }

  function drawPoly(map, closes, period, color, width, startIdx) {
    if (!map || !closes) return;
    var started = false;
    var i;
    var v;
    ctx.beginPath();
    for (i = startIdx; i < closes.length; i++) {
      v = smaAt(closes, period, i);
      if (v == null) continue;
      var x = map.toX(i - startIdx);
      var y = map.toY(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    if (!started) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawBollinger(map, closes, startIdx, theme) {
    if (!map || closes.length < 21) return;
    theme = theme || plotTheme(null);
    var period = 20;
    var up = [];
    var lo = [];
    var i;
    var mean;
    var sd;
    for (i = startIdx; i < closes.length; i++) {
      mean = smaAt(closes, period, i);
      if (mean == null) {
        up.push(null);
        lo.push(null);
        continue;
      }
      sd = stdevAt(closes, period, i, mean);
      up.push(mean + 2 * sd);
      lo.push(mean - 2 * sd);
    }
    ctx.beginPath();
    var started = false;
    for (i = 0; i < up.length; i++) {
      if (up[i] == null) continue;
      if (!started) { ctx.moveTo(map.toX(i), map.toY(up[i])); started = true; }
      else ctx.lineTo(map.toX(i), map.toY(up[i]));
    }
    for (i = lo.length - 1; i >= 0; i--) {
      if (lo[i] == null) continue;
      ctx.lineTo(map.toX(i), map.toY(lo[i]));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(157, 78, 221, 0.08)';
    ctx.fill();
    started = false;
    ctx.beginPath();
    for (i = 0; i < up.length; i++) {
      if (up[i] == null) continue;
      if (!started) { ctx.moveTo(map.toX(i), map.toY(up[i])); started = true; }
      else ctx.lineTo(map.toX(i), map.toY(up[i]));
    }
    ctx.strokeStyle = 'rgba(157,78,221,0.65)';
    ctx.lineWidth = 1.15;
    ctx.stroke();
    started = false;
    ctx.beginPath();
    for (i = 0; i < lo.length; i++) {
      if (lo[i] == null) continue;
      if (!started) { ctx.moveTo(map.toX(i), map.toY(lo[i])); started = true; }
      else ctx.lineTo(map.toX(i), map.toY(lo[i]));
    }
    ctx.stroke();
  }

  function drawRsiPanel(pad, w, h, rsiH, rsiVals, startIdx, theme) {
    theme = theme || plotTheme(null);
    var top = pad.t + h + 16;
    var boxH = Math.max(22, rsiH - 4);
    ctx.fillStyle = theme.rsiBg;
    ctx.fillRect(pad.l, top, w, boxH);
    ctx.strokeStyle = theme.rsiBorder;
    ctx.strokeRect(pad.l, top, w, boxH);
    var y70 = top + boxH * (1 - 70 / 100);
    var y30 = top + boxH * (1 - 30 / 100);
    ctx.strokeStyle = 'rgba(255,23,68,0.28)';
    ctx.beginPath();
    ctx.moveTo(pad.l, y70);
    ctx.lineTo(pad.l + w, y70);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,230,118,0.28)';
    ctx.beginPath();
    ctx.moveTo(pad.l, y30);
    ctx.lineTo(pad.l + w, y30);
    ctx.stroke();
    var n = rsiVals.length - startIdx;
    if (n < 2) return;
    var toX = makeToX(Math.max(2, n), pad, w);
    var toY = function (v) { return top + boxH * (1 - Math.max(0, Math.min(100, v)) / 100); };
    ctx.beginPath();
    var started = false;
    var i;
    var last = 50;
    for (i = startIdx; i < rsiVals.length; i++) {
      var v = rsiVals[i];
      if (v == null) continue;
      last = v;
      if (!started) { ctx.moveTo(toX(i - startIdx), toY(v)); started = true; }
      else ctx.lineTo(toX(i - startIdx), toY(v));
    }
    ctx.strokeStyle = last >= 70 ? '#FF1744' : last <= 30 ? '#00E676' : '#9d4edd';
    ctx.lineWidth = 1.25;
    ctx.stroke();
    ctx.fillStyle = theme.rsiTxt;
    ctx.font = '700 9px "Hanken Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('RSI ' + last.toFixed(0), pad.l + 4, top + 10);
  }

  function drawMacdPanel(pad, w, h, panelH, series, startIdx, theme, yOffset) {
    theme = theme || plotTheme(null);
    var top = pad.t + h + 16 + (yOffset || 0);
    var boxH = Math.max(22, panelH - 4);
    var macd = series.macd || [];
    var signal = series.signal || [];
    var i;
    var maxAbs = 0.0001;
    for (i = startIdx; i < macd.length; i++) {
      if (macd[i] != null) maxAbs = Math.max(maxAbs, Math.abs(macd[i]));
      if (signal[i] != null) maxAbs = Math.max(maxAbs, Math.abs(signal[i]));
    }
    ctx.fillStyle = theme.rsiBg || 'rgba(0,0,0,0.25)';
    ctx.fillRect(pad.l, top, w, boxH);
    ctx.strokeStyle = theme.rsiBorder || 'rgba(255,255,255,0.12)';
    ctx.strokeRect(pad.l, top, w, boxH);
    var mid = top + boxH / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(pad.l, mid);
    ctx.lineTo(pad.l + w, mid);
    ctx.stroke();
    var n = macd.length - startIdx;
    if (n < 2) return;
    var toX = makeToX(Math.max(2, n), pad, w);
    var toY = function (v) { return mid - (v / maxAbs) * (boxH * 0.42); };
    ctx.beginPath();
    var started = false;
    for (i = startIdx; i < macd.length; i++) {
      if (macd[i] == null) continue;
      if (!started) { ctx.moveTo(toX(i - startIdx), toY(macd[i])); started = true; }
      else ctx.lineTo(toX(i - startIdx), toY(macd[i]));
    }
    ctx.strokeStyle = '#C9A227';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    started = false;
    ctx.beginPath();
    for (i = startIdx; i < signal.length; i++) {
      if (signal[i] == null) continue;
      if (!started) { ctx.moveTo(toX(i - startIdx), toY(signal[i])); started = true; }
      else ctx.lineTo(toX(i - startIdx), toY(signal[i]));
    }
    ctx.strokeStyle = '#5B8CFF';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = theme.rsiTxt || '#C9A227';
    ctx.font = '700 9px "Hanken Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MACD', pad.l + 4, top + 10);
  }

  function plotToY(p, pad, h, minP, maxP) {
    var span = Math.max((maxP - minP) || 0.01, 0.01);
    var top = (pad && pad.t != null) ? pad.t : 14;
    var height = h > 0 ? h : Math.max(40, cssH - 36);
    var y = top + height * (1 - (Number(p) - minP) / span);
    var lo = top + 1;
    var hi = top + height - 1;
    if (y < lo) return lo;
    if (y > hi) return hi;
    return y;
  }

  function priceToY(price, pad, h, minP, maxP) {
    return plotToY(price, pad, h, minP, maxP);
  }

  function roundRectOn(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function roundRect(x, y, w, h, r) {
    roundRectOn(ctx, x, y, w, h, r);
  }

  function drawEmaLine(map, closes, period, startIdx) {
    if (!map || !closes) return;
    var ema = emaSeries(closes, period);
    var started = false;
    var i;
    ctx.beginPath();
    for (i = startIdx; i < closes.length; i++) {
      if (ema[i] == null) continue;
      var x = map.toX(i - startIdx);
      var y = map.toY(ema[i]);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    if (!started) return;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Ligne objectif (×5 / ×10 / ×50, ou ligne Boom/Crash) : c'est elle qui décide du gain.
  // CALL gagne si le prix final est AU-DESSUS, PUT s'il est EN DESSOUS. Hors écran :
  // on la colle au bord avec une flèche pour que le joueur sache toujours où elle est.
  // Ligne objectif (×5, ×10, ×50) : trait doré épais à longs tirets espacés + étiquette,
  // bien différent du petit pointillé vert/rouge de l'entrée. En 88 %, pas de 2e trait :
  // l'objectif est le prix d'entrée lui-même (l'ombre suffit).
  var TARGET_DASH = [16, 9];
  function fmtTargetPrice(p) {
    var v = Number(p);
    return isFinite(v) ? v.toFixed(2) : '';
  }
  function drawTargetLine(g, trade, bar, entry, pad, plotH, minP, maxP, plotTop, plotBot, layout, idx, fade) {
    var mult = Number(trade.payout) || 1.9;
    // La ligne qui DÉCIDE le résultat (objectif du serveur) est toujours montrée quand elle n'est pas
    // au prix d'entrée — aussi en 88 % (ex. ORO 999 : objectif un peu sous l'entrée, car le prix
    // descend doucement entre ses sauts). Avant, en 88 % elle était cachée : le joueur jugeait avec le
    // prix d'entrée et croyait « gagné » quand c'était perdu (et l'inverse). Dessin seulement.
    if (!isFinite(bar) || bar <= 0 || Math.abs(bar - entry) < 0.005) return;
    var by = priceToY(bar, pad, plotH, minP, maxP);
    if (!isFinite(by)) return;
    var off = 0;
    if (by < plotTop + 9) { by = plotTop + 9; off = -1; }
    if (by > plotBot - 9) { by = plotBot - 9; off = 1; }
    by = Math.round(by * 2) / 2;
    var gold = '#F5C518';
    g.save();
    g.globalAlpha = (off ? 0.6 : 0.95) * (fade == null ? 1 : fade);
    g.setLineDash(TARGET_DASH);
    g.strokeStyle = gold;
    g.lineWidth = IS_ANDROID_CHART ? 1.6 : 2;
    g.beginPath();
    g.moveTo(pad.l, by);
    // Le trait s'arrête sous l'étiquette verte (posée jusqu'à axisX - 6) : son bout ne dépasse pas.
    g.lineTo(layout.axisX - 12, by);
    g.stroke();
    g.setLineDash(NO_DASH);
    g.restore();
    // Les étiquettes sont posées APRÈS tous les traits (drawTargetTags) : aucun trait ne les
    // traverse. Elles sont regroupées comme les ronds d'entrée : un seul petit badge par
    // objectif et par bord, avec le nombre de trades — elles ne peuvent jamais couvrir la courbe.
    targetTagQueue.push({ mult: Math.round(mult * 10) / 10, bar: bar, by: by, off: off, fade: fade == null ? 1 : fade, pad: pad, layout: layout, top: plotTop, bot: plotBot });
  }

  var targetTagQueue = [];
  var chronoPlaced = [];
  var chronoQueue = [];
  // Chrono affiché : jamais plus que la durée choisie, et il ne remonte jamais.
  // La courbe est montrée ~1,5 s derrière le serveur ; quand le serveur confirme le trade, la fin
  // recule d'autant à l'écran. Au lieu de sauter (5 s → 6,4 s), le chrono ralentit un peu et
  // arrive à 0 pile quand la courbe touche le drapeau. Les prix et le résultat ne changent pas.
  var chronoState = {};
  var chronoCount = 0;
  function chronoSecs(trade, raw) {
    var id = trade && trade.id != null ? String(trade.id) : '';
    if (!id || !isFinite(raw)) return raw;
    var nowMs = Date.now();
    var dur = Number(trade.duration);
    var st = chronoState[id];
    if (!st) {
      if (++chronoCount > 300) {
        var k;
        for (k in chronoState) {
          if (nowMs - chronoState[k].t > 120000) delete chronoState[k];
        }
        chronoCount = 0;
      }
      st = { v: (dur > 0 ? Math.min(raw, dur) : raw), t: nowMs };
      chronoState[id] = st;
      return st.v;
    }
    var dt = Math.max(0, (nowMs - st.t) / 1000);
    st.t = nowMs;
    var rate = raw > 0.05 ? Math.min(1, st.v / raw) : 1;
    var v = st.v - dt * Math.max(0.6, rate);
    if (v > raw) v = raw;
    if (dur > 0 && v > dur) v = dur;
    if (v < 0) v = 0;
    st.v = v;
    return v;
  }
  // Chronos : fond rouge plein bien visible, chiffres blancs qui comptent ; posés par-dessus les traits.
  function drawChronos() {
    var i;
    for (i = 0; i < chronoQueue.length; i++) {
      var c = chronoQueue[i];
      var g = c.g;
      g.save();
      g.globalAlpha = 1;
      g.setLineDash(NO_DASH);
      // v2367 : chrono de la couleur du trade (vert = ACHAT, rouge = VENTE) ; avant, toujours rouge.
      g.fillStyle = c.call ? '#0FA958' : '#E8173A';
      g.strokeStyle = 'rgba(255,255,255,0.85)';
      g.lineWidth = 1;
      roundRectOn(g, c.x, c.y, c.w, c.h, 7);
      g.fill();
      g.stroke();
      g.fillStyle = '#FFFFFF';
      g.font = '800 9.5px "Hanken Grotesk", sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 + 0.5);
      g.restore();
    }
    chronoQueue.length = 0;
  }
  // Même place que drawLivePriceBadge (cadre du prix au bout de la courbe).
  function livePriceBadgeBox(map, price, layout) {
    if (!map || !isFinite(map.lastY)) return null;
    ctx.save();
    ctx.font = '800 8.5px ui-monospace, Menlo, Consolas, monospace';
    var tw = Math.ceil(ctx.measureText(formatAxisPrice(price)).width) + 6;
    ctx.restore();
    var th = 12;
    var y = Math.max(2, Math.min(cssH - th - 2, map.lastY - th / 2));
    // Dans la colonne des prix, calé à droite comme les chiffres (par-dessus eux).
    var x = Math.max((layout && layout.axisX != null ? layout.axisX : cssW - 50) - 6, cssW - PRICE_AXIS_GAP - tw + 6);
    return { x0: x, x1: x + tw, y0: y, y1: y + th };
  }

  function drawTargetTags(g, avoid) {
    if (!targetTagQueue.length) return;
    var gold = '#F5C518';
    var groups = [];
    var byKey = {};
    var i;
    for (i = 0; i < targetTagQueue.length; i++) {
      var t = targetTagQueue[i];
      var key = t.entry ? 'e|' + t.off + '|' + t.side : (t.off !== 0 ? t.off + '|' + t.mult : '0|' + t.mult + '|' + Math.round(t.by / 14));
      var gr = byKey[key];
      if (!gr) {
        gr = { mult: t.mult, off: t.off, by: t.by, bar: t.bar, n: 0, fade: 0, pad: t.pad, layout: t.layout, top: t.top, bot: t.bot, entry: !!t.entry, side: t.side };
        byKey[key] = gr;
        groups.push(gr);
      }
      gr.n++;
      if (t.fade > gr.fade) gr.fade = t.fade;
      // Prix affiché : l'objectif le plus proche de la courbe.
      if (t.off < 0 && t.bar < gr.bar) gr.bar = t.bar;
      if (t.off > 0 && t.bar > gr.bar) gr.bar = t.bar;
    }
    // Bord du haut d'abord, puis l'écran, puis le bas ; le plus grand objectif collé au bord.
    groups.sort(function (a, b) {
      if (a.off !== b.off) return a.off - b.off;
      if (a.off !== 0) return b.mult - a.mult;
      return a.by - b.by;
    });
    // Pas de limite de nombre : au bord, les badges sont déjà regroupés (au plus ×5, ×10, ×50).
    var H = 13;
    var STEP = 15;
    var placed = [];
    g.save();
    g.font = '800 9px "Hanken Grotesk", sans-serif';
    for (i = 0; i < groups.length; i++) {
      var it = groups[i];
      var label;
      if (it.entry) {
        label = (it.off < 0 ? '▲ ' : '▼ ') + fmtTargetPrice(it.bar);
      } else {
        // v2338 : MÊME écriture pour toutes les lignes objectif : « ×N ▲ prix » ou « ×N ▼ prix » (la flèche dit
        // si l’objectif est au-dessus ou en dessous du prix actuel), qu’elles soient à l’écran ou collées au bord.
        var upT = it.off < 0 || (!it.off && !(Number(it.bar) < Number(lastDrawnClose)));
        label = '×' + it.mult + (upT ? ' ▲ ' : ' ▼ ') + fmtTargetPrice(it.bar);
      }
      if (it.n > 1) label += ' · ' + it.n;
      var top = it.top + 2;
      var bot = it.bot - H - 2;
      var tw = Math.ceil(g.measureText(label).width) + 10;
      var tx = Math.max(it.pad.l + 4, it.layout.axisX - tw - 6);
      // Le cadre du prix de la courbe : l'étiquette ne passe jamais dessus.
      var nearBadge = !!(avoid && tx < avoid.x1 && tx + tw > avoid.x0);
      // Posée sur son trait ; si la place est prise, on décale vers l'intérieur, jamais dehors.
      var dir = it.off < 0 ? 1 : -1;
      var ty = it.by - H / 2;
      var guard = 0;
      var hit = true;
      while (hit && guard < 24) {
        if (ty < top) { ty = top; dir = 1; }
        if (ty > bot) { ty = bot; dir = -1; }
        hit = false;
        var k;
        for (k = 0; k < placed.length; k++) {
          if (Math.abs(placed[k] - ty) < STEP) { hit = true; break; }
        }
        if (!hit && nearBadge && ty < avoid.y1 + 2 && ty + H > avoid.y0 - 2) hit = true;
        if (hit) ty += dir * STEP;
        guard++;
      }
      placed.push(ty);
      g.globalAlpha = it.fade;
      // Fond vert plein (le vert des ronds d'achat), texte blanc : lisible d'un coup d'œil.
      // Prix d'entrée collé au bord : couleur du trade (vert ACHAT / rouge VENTE).
      g.fillStyle = it.entry ? (it.side === 'call' ? '#00A83E' : '#E8173A') : '#00A83E';
      roundRectOn(g, tx, ty, tw, H, H / 2);
      g.fill();
      g.fillStyle = '#FFFFFF';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(label, tx + tw / 2, ty + H / 2 + 0.5);
    }
    g.textBaseline = 'alphabetic';
    g.restore();
  }

  // Trade ouvert : trait horizontal pointillé + pastille d'entrée CALL/PUT + décompte
  // à gauche. Aucun montant en dollars n'est tracé le long du trait.
  function drawEntryOn(g, map, trade, now, pad, tagIndex, minP, maxP, plotH, yShift, layout, clusterN) {
    if (!g || !trade || trade.settled) return;
    var exp = liveTradeTime(trade.expiryTick, trade.expiryTime || trade.expiresAt);
    if (!exp || Date.now() >= exp) return;
    var glide = tradeGlide(trade);
    var entry = glide.entry;
    // v2347 (choix B, comme les grandes plateformes) : tant que le serveur n'a pas confirmé, rien n'est dessiné
    // ici (le signe ACHAT / VENTE du clic s'affiche déjà) ; à la confirmation (le temps d'un aller-retour réseau),
    // rond, trait et ligne objectif apparaissent ENSEMBLE à leur vraie place et ne bougent plus.
    // v2352 : dessiné dès le clic (plus d'attente de la confirmation du serveur).
    // Rond et trait d'entrée restent au prix du clic (la ligne objectif, elle, reste celle du serveur).
    // v2332 — Payout 90 % : la ligne qui décide EST le prix d'entrée du serveur. Le trait d'entrée glisse
    // donc jusqu'à ce prix confirmé (au lieu de rester au prix du clic, vu ~1,5 s en retard) : plus de
    // ligne jaune « objectif » en 90 % quand un pic tombe entre le clic et l'arrivée de l'ordre (ORO 999).
    var bar = glide.barrier;
    // v2353 — Compte connecté : le serveur fixe l'entrée au prix de l'instant où l'ordre ARRIVE ; la courbe affichée
    // n'y est pas encore (~0,4 s de retard). Au lieu de poser le rond au clic puis de le replacer, il reste collé au
    // BOUT de la courbe jusqu'à ce qu'elle atteigne le vrai point d'entrée : là, la courbe passe exactement par ce prix,
    // donc le rond s'y arrête sans aucun saut. Apparition instantanée, jamais de déplacement hors de la courbe.
    var rideEntryT = 0;
    // Heure d'affichage du vrai point d'entrée (fixée par le serveur à la confirmation).
    if (!trade.pending) rideEntryT = Number(trade.startTime) || 0;
    var aRd = D6.CONFIG && D6.CONFIG.ASSETS ? D6.CONFIG.ASSETS[trade.assetId] : null;
    var lineRd = !!(aRd && aRd.chart !== 'candle' && aRd.id !== 'horizon50' && !STYLED_ASSETS[aRd.id]);
    var rideHeadT = xNow || Date.now();
    // Bougies : le rond se pose sur la bougie (même repère que sa place finale), pas au bord droit.
    var rideCandleT = 0;
    if (!lineRd && camCandles && camCandles.length) rideCandleT = Number(camCandles[camCandles.length - 1].t) || 0;
    // v2358 : rond au clic (prix et heure du clic gardés dans shownPrice / shownMarks) : plus de suivi de la courbe.
    var clickMode = shownPrice[trade.id] > 0 && shownMarks[trade.id] > 1;
    if (clickMode) rideEntryT = 0;
    var riding = !clickMode && !(panMs > 0) && lastDrawnClose > 0 && (trade.pending || (rideEntryT > 0 && rideHeadT < rideEntryT));
    var rs = rideState[trade.id];
    var rideMarkT = 0;
    if (riding) {
      entry = lastDrawnClose;
      if (isFinite(glide.barrier) && isFinite(glide.entry)) bar = lastDrawnClose + (glide.barrier - glide.entry);
      rideState[trade.id] = { t: rideCandleT || rideHeadT, h: rideHeadT, p: entry, b: bar, end: 0 };
    } else if (rs) {
      // Confirmation arrivée APRÈS que la courbe a dépassé l'entrée (réseau très lent) : court glissement vers la vraie place.
      if (!rs.end) { rs.end = Date.now(); rs.late = rideEntryT > 0 && Math.abs(rs.p - entry) > 1e-9; }
      if (rs.late) {
        var rk2 = Math.min(1, (Date.now() - rs.end) / 260);
        rk2 = 1 - Math.pow(1 - rk2, 3);
        if (rk2 < 1) {
          entry = rs.p + (entry - rs.p) * rk2;
          if (isFinite(rs.b) && isFinite(bar)) bar = rs.b + (bar - rs.b) * rk2;
          rideMarkT = Math.max(rk2, 0.000001);
        }
      }
    }
    rideDbg = { riding: riding, entryT: rideEntryT, headT: rideHeadT, pending: !!trade.pending, entry: entry, head: lastDrawnClose };
    var hasTarget = isFinite(bar) && Math.abs(bar - entry) >= 0.005;
    if (!isFinite(entry)) return;
    var ey = priceToY(entry, pad, plotH, minP, maxP);
    if (!isFinite(ey)) return;
    // Arrondi sous-pixel : évite le tremblement du trait pendant le rafraîchissement.
    ey = Math.round(ey * 2) / 2;
    var plotTop = pad ? pad.t : 4;
    var plotBot = pad ? (pad.t + plotH) : (cssH - 4);
    // Prix d'entrée hors du cadre (trade long, prix parti loin) : le trait reste collé au bord,
    // avec une étiquette « ▲ / ▼ prix » ; la courbe garde sa taille normale.
    var eOff = 0;
    if (ey < plotTop + 9) { ey = plotTop + 9; eOff = -1; }
    else if (ey > plotBot - 9) { ey = plotBot - 9; eOff = 1; }
    layout = layout || plotLayout(pad);
    var isCall = trade.side === 'call';
    var lineCol = isCall ? '#00e676' : '#ff3b30';
    var fillCol = isCall ? '#007e33' : '#b71c1c';
    var idx = tagIndex || 0;
    var lite = IS_ANDROID_CHART;
    var badgeLift = isFinite(yShift) ? yShift : 0;
    var tNowE = xNow || Date.now();
    var winE = xWin > 0 ? xWin : (zoomSec() * 1000);
    // v2360 : le serveur prend le prix du CLIC (v2359) → la ligne est déjà à sa vraie place au clic : elle apparaît
    // en même temps que le rond, d'un coup (avant : attente de la réponse du serveur, puis fondu).
    var lineFade = 1;
    if (idx === 0) {
      // Zone gagnante : au-dessus de la ligne (CALL) ou en dessous (PUT), très légère.
      var refP = bar > 0 ? bar : entry;
      var zy = priceToY(refP, pad, plotH, minP, maxP);
      if (isFinite(zy)) {
        zy = Math.max(plotTop, Math.min(plotBot, zy));
        g.save();
        // Seule l'ombre marque l'objectif (aucun second trait) : plus dense au bord.
        var zw = layout.axisX - pad.l;
        var zg;
        g.globalAlpha = lineFade;
        if (isCall) {
          zg = g.createLinearGradient(0, zy, 0, plotTop);
          zg.addColorStop(0, 'rgba(0,230,118,0.16)');
          zg.addColorStop(0.35, 'rgba(0,230,118,0.06)');
          zg.addColorStop(1, 'rgba(0,230,118,0.02)');
          g.fillStyle = zg;
          g.fillRect(pad.l, plotTop, zw, zy - plotTop);
        } else {
          zg = g.createLinearGradient(0, zy, 0, plotBot);
          zg.addColorStop(0, 'rgba(255,59,48,0.16)');
          zg.addColorStop(0.35, 'rgba(255,59,48,0.06)');
          zg.addColorStop(1, 'rgba(255,59,48,0.02)');
          g.fillStyle = zg;
          g.fillRect(pad.l, zy, zw, plotBot - zy);
        }
        g.restore();
      }
      // Ligne d'arrivée verticale : l'instant exact où le trade se termine.
      if (winE > 0) {
        var fx = layout.headX + layout.seriesW * ((exp - tNowE) / winE);
        var fOut = fx > layout.axisX - 4;
        if (fOut) fx = layout.axisX - 4;
        g.save();
        g.setLineDash([3, 4]);
        g.strokeStyle = 'rgba(255,255,255,' + (fOut ? '0.35' : '0.6') + ')';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(fx, plotTop);
        g.lineTo(fx, plotBot);
        g.stroke();
        g.setLineDash(NO_DASH);
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.font = '700 10px "Hanken Grotesk", sans-serif';
        g.textAlign = fOut ? 'right' : 'center';
        g.fillText('🏁', fx, plotTop + 11);
        g.restore();
      }
    }
    {
      g.setLineDash(TRADE_DASH);
      g.strokeStyle = lineCol;
      g.lineWidth = lite ? 1 : 1.35;
      g.globalAlpha = (lite ? 0.72 : 0.92) * lineFade * (eOff ? 0.6 : 1);
      g.beginPath();
      g.moveTo(0, ey);
      g.lineTo(cssW, ey);
      g.stroke();
      g.setLineDash(NO_DASH);
      g.globalAlpha = 1;
    }
    drawTargetLine(g, trade, bar, entry, pad, plotH, minP, maxP, plotTop, plotBot, layout, idx, lineFade);
    if (eOff) {
      targetTagQueue.push({ entry: true, side: isCall ? 'call' : 'put', mult: 0, bar: entry, by: ey, off: eOff, fade: lineFade, pad: pad, layout: layout, top: plotTop, bot: plotBot });
    }

    var tNow = xNow || Date.now();
    var win = xWin > 0 ? xWin : (zoomSec() * 1000);
    var t0 = shownMarks[trade.id] > 1 ? shownMarks[trade.id] : glide.start;
    if (rideEntryT > 0) {
      t0 = rideEntryT;
      // Bougies : début de la bougie qui contient l'entrée (même repère que pendant le suivi).
      if (!lineRd && camCandles && camCandles.length) {
        var ci;
        for (ci = camCandles.length - 1; ci >= 0; ci--) {
          var cdR = camCandles[ci];
          if (cdR && Number(cdR.t) <= rideEntryT + 1) { t0 = Number(cdR.t); break; }
        }
      }
    }
    if (rideMarkT > 0 && rs && rs.t > 0) t0 = rs.t + (t0 - rs.t) * rideMarkT;
    var mx = layout.headX;
    if (riding && rideCandleT > 0 && win > 0) mx = layout.headX - layout.seriesW * ((tNow - rideCandleT) / win);
    else if (riding) mx = map && isFinite(map.lastX) ? map.lastX : layout.headX;
    else if (t0 > 0 && win > 0) mx = layout.headX - layout.seriesW * ((tNow - t0) / win);
    // Chaque rond reste PILE à l'endroit de son clic : plusieurs trades au même endroit s'empilent
    // naturellement (avant : décalés de côté et vers le haut). Seuls les chronos à gauche restent
    // espacés (tagY) pour rester lisibles.
    var tagY = ey + badgeLift;
    if (clickMode) {
      var cyClick = priceToY(shownPrice[trade.id], pad, plotH, minP, maxP);
      if (isFinite(cyClick)) ey = Math.max(plotTop + 9, Math.min(plotBot - 9, Math.round(cyClick * 2) / 2));
    }
    // Taille qui suit le zoom : bougies grosses = rond un peu plus grand ; dézoom = plus petit (5 à 8 px).
    // Même taille de rond sur les 10 simulations : mesurée comme au zoom de départ standard (28 s),
    // même pour celles qui démarrent plus près (ZUL, BAAL, OROF 16 s ; VOLATILITY, ASMODUS 23 s).
    var stepW = candleStepWidth(layout.seriesW) * ((ZOOM_STEPS[defaultZoomIdx(activeAsset)] || 28) / 28);
    var r = Math.max(5, Math.min(lite ? 7 : 8, stepW * 0.6));
    var rk = r / 9;
    if (panMs > 0) {
      // Historique regardé : le rond reste accroché à sa bougie et suit le défilement ; hors écran, caché.
      if (mx < pad.l - r || mx > layout.axisX - r) mx = -1000;
    } else {
      if (mx < pad.l - r) mx = -1000;
      if (mx > layout.headX) mx = layout.headX;
      if (map && isFinite(map.lastX) && mx > map.lastX) mx = map.lastX;
    }
    lastEntryMarkX = mx;
    lastEntryMarkY = ey;
    lastEntryMarkR = r;
    ey = Math.max(plotTop + r + 2, Math.min(plotBot - r - 2, ey));
    g.save();
    g.beginPath();
    g.arc(mx, ey, r, 0, Math.PI * 2);
    g.fillStyle = fillCol;
    g.globalAlpha = 1;
    g.fill();
    g.lineWidth = 1.35;
    g.strokeStyle = '#ffffff';
    g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath();
    if (isCall) {
      g.moveTo(mx, ey - 5.2 * rk);
      g.lineTo(mx + 4.2 * rk, ey + 3.4 * rk);
      g.lineTo(mx - 4.2 * rk, ey + 3.4 * rk);
    } else {
      g.moveTo(mx, ey + 5.2 * rk);
      g.lineTo(mx + 4.2 * rk, ey - 3.4 * rk);
      g.lineTo(mx - 4.2 * rk, ey - 3.4 * rk);
    }
    g.closePath();
    g.fill();
    g.restore();

    var remaining = exp - Date.now();
    var secs = chronoSecs(trade, remaining / 1000);
    if (lite && idx > 0) return;
    if (secs >= 0.15) {
      var label = lite ? (Math.max(1, Math.ceil(secs)) + 's') : (secs.toFixed(1) + 's');
      if (label.charAt(0) !== '-') {
        var timerW = 42;
        var timerH = 14;
        var leftX = (pad && pad.l != null ? pad.l : 8) + 4;
        var ty = tagY - timerH / 2;
        ty = Math.max(plotTop + 2, Math.min(plotBot - timerH - 2, ty));
        // Deux chronos ne se posent jamais l'un sur l'autre : le suivant se décale d'un cran.
        var cdir = ty > plotBot - timerH - 20 ? -1 : 1;
        var cguard = 0;
        var chit = true;
        while (chit && cguard < 16) {
          chit = false;
          var ck;
          for (ck = 0; ck < chronoPlaced.length; ck++) {
            if (Math.abs(chronoPlaced[ck] - ty) < timerH + 2) { chit = true; break; }
          }
          if (chit) {
            ty += cdir * (timerH + 2);
            if (ty > plotBot - timerH - 2) { ty = plotBot - timerH - 2; cdir = -1; }
            if (ty < plotTop + 2) { ty = plotTop + 2; cdir = 1; }
          }
          cguard++;
        }
        chronoPlaced.push(ty);
        // Dessiné APRÈS tous les traits (drawChronos) : les lignes ACHAT / VENTE passent dessous.
        chronoQueue.push({ g: g, x: leftX, y: ty, w: timerW, h: timerH, label: label, call: isCall });
      }
    }
  }

  function paintOverlay() {
    if (!octx || cssW < 8 || cssH < 8) return;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, cssW, cssH);
  }

  function drawPendingPulse(map, now) {
    var id;
    var pNow = performance.now();
    var slot = 0;
    var newest = null;
    for (id in pendingTrades) {
      if (pendingTrades.hasOwnProperty(id) && id.indexOf('done:') !== 0 && (!newest || pendingTrades[id].t > pendingTrades[newest].t)) newest = id;
    }
    for (id in pendingTrades) {
      if (pendingTrades.hasOwnProperty(id) && id.indexOf('done:') !== 0 && id !== newest) {
        delete pendingTrades[id];
        pendingTrades['done:' + id] = pNow;
      }
    }
    for (id in pendingTrades) {
      if (!pendingTrades.hasOwnProperty(id)) continue;
      var pt = pendingTrades[id];
      if (id.indexOf('done:') === 0) { if (pNow - pt > 60000) delete pendingTrades[id]; continue; }
      // Bref : environ 0,55 s après le clic (plus longtemps seulement si le rond n'est pas encore posé).
      // Un signe par clic : plusieurs clics rapides = plusieurs petits signes qui s'effacent vite.
      var stillHidden = pt.hid && Date.now() - pt.hid < 400;
      if (pNow - pt.t > 6000 || (pt.seen && Date.now() - pt.seen > 1500) || (pNow - pt.t > 300 && !stillHidden)) {
        delete pendingTrades[id];
        pendingTrades['done:' + id] = pNow;
        continue;
      }
      var k = ((pNow - pt.t) % 650) / 650;
      var col = pt.side === 'put' ? '255,59,48' : '0,230,118';
      var age = pNow - pt.t;
      var fade = stillHidden ? 1 : Math.max(0, Math.min(1, 1 - (age - 200) / 100));
      // Signe ACHAT / VENTE : un flash de 0,3 s (petit « pop » à l'apparition), même si le rond n'est pas encore posé.
      var lblAlpha = age < 300 ? Math.max(0, Math.min(1, 1 - (age - 200) / 100)) : 0;
      var pop = age < 90 ? 0.7 + 0.3 * (age / 90) : 1;
      var stack = slot * 14;
      slot++;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(' + col + ',' + (0.85 * (1 - k)).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(map.lastX, map.lastY, 8 + 16 * k, 0, Math.PI * 2);
      ctx.stroke();
      var isPut = pt.side === 'put';
      if (lblAlpha > 0) {
      var lbl = String(isPut ? tt('tcSell', 'VENTE') : tt('tcBuy', 'ACHAT')).replace(/[↗↘⬈⬊]/g, '').trim();
      ctx.font = '800 7.5px "Hanken Grotesk", sans-serif';
      var lw = Math.ceil(ctx.measureText(lbl).width) + 20;
      var lh = 12;
      var lx = Math.max(4, map.lastX - lw / 2);
      var ly = isPut ? map.lastY + 14 + stack : map.lastY - 26 - stack;
      var gr = ctx.createLinearGradient(lx, ly, lx, ly + lh);
      gr.addColorStop(0, isPut ? '#FF6B5E' : '#22E08A');
      gr.addColorStop(1, isPut ? '#C9221A' : '#009A48');
      ctx.globalAlpha = 0.96 * lblAlpha;
      ctx.translate(lx + lw / 2, ly + lh / 2);
      ctx.scale(pop, pop);
      ctx.translate(-(lx + lw / 2), -(ly + lh / 2));
      ctx.shadowColor = isPut ? 'rgba(255,59,48,.45)' : 'rgba(0,200,83,.45)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = gr;
      roundRectOn(ctx, lx, ly, lw, lh, lh / 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.stroke();
      // Petite flèche tracée (diagonale montante pour l'achat, descendante pour la vente).
      var ax = lx + 7;
      var ay = ly + lh / 2;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (isPut) {
        ctx.moveTo(ax - 2.3, ay - 2.3);
        ctx.lineTo(ax + 2.3, ay + 2.3);
        ctx.moveTo(ax + 2.3, ay - 0.3);
        ctx.lineTo(ax + 2.3, ay + 2.3);
        ctx.lineTo(ax - 0.3, ay + 2.3);
      } else {
        ctx.moveTo(ax - 2.3, ay + 2.3);
        ctx.lineTo(ax + 2.3, ay - 2.3);
        ctx.moveTo(ax - 0.3, ay - 2.3);
        ctx.lineTo(ax + 2.3, ay - 2.3);
        ctx.lineTo(ax + 2.3, ay + 0.3);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(lbl, lx + 13, ly + lh / 2 + 0.5);
      }
      ctx.restore();
    }
  }

  function drawBead(map, price, color, now, theme) {
    if (!map) return;
    theme = theme || plotTheme(null);
    var compact = activeAsset === 'stable';
    var nexusHead = activeAsset === 'nexusprime';
    var titanHead = activeAsset === 'titanpulse';
    var v75Head = activeAsset === 'v75';
    var goldHead = activeAsset === 'goldtrend';
    var horizonHead = activeAsset === 'horizon50';
    var pulse = 0.55 + 0.45 * Math.sin(now / 150);
    ctx.save();
    // Auréole externe pulsante, dimensionnée pour envelopper un noyau de 6 px.
    if (!compact) {
      var haloDim = v75Head ? '233,30,99' : (titanHead ? '255,255,255' : (nexusHead ? '0,229,255' :
        (goldHead ? '255,179,0' : (horizonHead ? '255,152,0' : null))));
      ctx.beginPath();
      ctx.globalAlpha = 0.5;
      ctx.arc(map.lastX, map.lastY, 5 + pulse * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = haloDim ? 'rgba(' + haloDim + ',0.16)' : (theme.beadGlow || 'rgba(255,215,0,0.16)');
      ctx.fill();
      ctx.beginPath();
      ctx.arc(map.lastX, map.lastY, 3.8 + pulse * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = haloDim ? 'rgba(' + haloDim + ',0.3)' : (theme.beadGlow || 'rgba(255,215,0,0.24)');
      ctx.fill();
    }
    // Point actuel : noyau de 6 px et halo pulsant de 12 px, quel que soit l'actif.
    var headCol = compact ? '#ff2d75' : (v75Head ? '#E0001B' : (titanHead ? '#FFFFFF' : (nexusHead ? '#00E5FF' : (goldHead ? '#ffd24d' : (horizonHead ? '#ff9800' : color)))));
    var glowCol = compact ? '#ff2d75' : (v75Head ? '#E0001B' : (titanHead ? '#FFFFFF' : (nexusHead ? '#00E5FF' : (goldHead ? '#ffb300' : (horizonHead ? '#ff9800' : color)))));
    ctx.beginPath();
    ctx.arc(map.lastX, map.lastY, compact ? 2.2 : 3, 0, Math.PI * 2);
    ctx.fillStyle = headCol;
    ctx.shadowColor = glowCol;
    ctx.globalAlpha = 1;
    ctx.shadowBlur = compact ? 3 : 5 + pulse * 2;
    ctx.fill();
    // Second passage : le halo se cumule et reste net au centre.
    if (!compact) {
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(map.lastX, map.lastY, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // Doigt sur le graphique : réticule (prix sous le doigt à droite, infos de la bougie en haut au
  // milieu, écart avec le prix actuel), onde dorée au toucher, carte d'un trade touché.
  // Plus haut / plus bas de l'écran et anneau de trade. Dessins posés par-dessus : rien ne bouge.
  function pad2(v) { return (v < 10 ? '0' : '') + v; }
  function tt(key, fb) {
    var s = (D6.I18N && D6.I18N.t) ? D6.I18N.t(key) : key;
    return (s && s !== key) ? s : fb;
  }
  function seriesPoint(i, n, pad, layout, candles, lineData, candleMode) {
    var x = baseIndexX(i, n, pad, layout.seriesW);
    if (candleMode) {
      var c = candles[i];
      return { x: x, c: c, v: Number(c.c), hi: Number(c.h), lo: Number(c.l), t: Number(c.t) || 0 };
    }
    var off = xTimes && xTimes.length >= n ? xTimes.length - n : 0;
    var v = Number(lineData[i]);
    return { x: x, c: null, v: v, hi: v, lo: v, t: xTimes ? Number(xTimes[off + i]) || 0 : 0 };
  }
  function infoPanel(lines, pad, layout, topY, centerX, fontPx) {
    // Petit panneau léger en haut (comme les grandes plateformes) ; il suit le trait vertical.
    var fs = fontPx || 9;
    var lh = fs + 4;
    ctx.font = '600 ' + fs + 'px ui-monospace, Menlo, Consolas, monospace';
    var bw = 0;
    lines.forEach(function (ln) {
      var wsum = 0;
      ln.forEach(function (seg) { wsum += ctx.measureText(seg[0]).width; });
      if (wsum > bw) bw = wsum;
    });
    bw = Math.ceil(bw) + 12;
    var bh = lines.length * lh + 5;
    var cx = isFinite(centerX) ? centerX : pad.l + (layout.axisX - pad.l) / 2;
    var bx = Math.max(pad.l + 2, Math.min(layout.axisX - bw - 2, cx - bw / 2));
    ctx.fillStyle = 'rgba(10,14,24,0.82)';
    roundRectOn(ctx, bx, topY, bw, bh, 6);
    ctx.fill();
    // Légère couleur à l'intérieur (orange doux), comme le reste du site.
    var ipg = ctx.createLinearGradient(0, topY, 0, topY + bh);
    ipg.addColorStop(0, 'rgba(247,147,26,0.22)');
    ipg.addColorStop(1, 'rgba(247,147,26,0.06)');
    ctx.fillStyle = ipg;
    roundRectOn(ctx, bx, topY, bw, bh, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(247,147,26,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    lines.forEach(function (ln, li) {
      var wsum = 0;
      ln.forEach(function (seg) { wsum += ctx.measureText(seg[0]).width; });
      var x = bx + (bw - wsum) / 2;
      var y = topY + 3 + lh / 2 + li * lh;
      ln.forEach(function (seg) {
        ctx.fillStyle = seg[1];
        ctx.fillText(seg[0], x, y);
        x += ctx.measureText(seg[0]).width;
      });
    });
  }
  function drawTouchLayer(pad, h, layout, minP, maxP, candles, lineData, candleMode, now, livePrice, legendOn) {
    var i;
    var top = pad.t;
    var bot = pad.t + h;
    var panelY = top + (legendOn ? 22 : 2);
    var DIM = 'rgba(248,231,176,0.55)';
    var UPC = '#00E676';
    var DNC = '#FF4D6A';
    if (!touchCross) {
      // Carte du trade touché (se ferme au toucher suivant, à la fin du trade ou après 6 s).
      if (!tradeCard) return;
      var tv = tradeCard.v;
      var expC = Number(tv.expiryTime || tv.expiresAt) || 0;
      var nowC = Date.now();
      if (nowC >= expC || nowC > tradeCard.until || tv.assetId !== activeAsset) { tradeCard = null; return; }
      var isCall = tv.side === 'call';
      var entryC = Number(tv.entryPrice);
      var winning = isCall ? livePrice > entryC : livePrice < entryC;
      var stakeC = Number(tv.stake) || 0;
      var sideCol = isCall ? UPC : DNC;
      var lines = [[[isCall ? tt('tcBuy', 'ACHAT ↗') : tt('tcSell', 'VENTE ↘'), sideCol]]];
      if (stakeC > 0) {
        lines.push([[tt('tcStake', 'Mise') + ' ', DIM], ['$\u00a0\u00a0' + stakeC.toFixed(2), '#F8E7B0']]);
        lines.push([[tt('tcGain', 'Gain possible') + ' ', DIM], ['+$\u00a0\u00a0' + (stakeC * ((Number(tv.payout) || 1.9) - 1)).toFixed(2), UPC]]);
      }
      lines.push([[tt('tcLeft', 'Reste') + ' ', DIM], [Math.max(0, (expC - nowC) / 1000).toFixed(1) + ' s', '#F8E7B0']]);
      lines.push([[winning ? tt('tcWin', 'Gagnant en ce moment') : tt('tcLose', 'Perdant en ce moment'), winning ? UPC : DNC]]);
      ctx.save();
      infoPanel(lines, pad, layout, panelY, NaN, 10);
      ctx.restore();
      return;
    }
    // Croix : toujours accrochée à une vraie bougie (ou un vrai point de la courbe) affichée à
    // l'écran, jamais au-delà du bout de la courbe ni dans le vide.
    var n = candleMode ? (candles ? candles.length : 0) : (lineData ? lineData.length : 0);
    if (!n) return;
    var fx = Math.max(pad.l, Math.min(layout.axisX, touchCross.x));
    var y = Math.max(top, Math.min(bot, touchCross.y));
    var best = -1;
    var bd = Infinity;
    for (i = 0; i < n; i++) {
      var xi = baseIndexX(i, n, pad, layout.seriesW);
      if (xi < pad.l - 2 || xi > layout.axisX - 2) continue;
      var d = Math.abs(xi - fx);
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) return;
    var pt = seriesPoint(best, n, pad, layout, candles, lineData, candleMode);
    var x = Math.round(pt.x) + 0.5;
    var price = minP + (1 - (y - top) / h) * Math.max(maxP - minP, 0.01);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(245,197,24,0.55)';
    ctx.setLineDash([2, 4]);
    // Le trait vertical part du bas du carré O H L C (rien ne dépasse au-dessus du carré).
    var panelLines = (pt.c && isFinite(pt.c.o)) ? 3 : 2;
    var vTop = Math.min(bot, panelY + panelLines * 12 + 5);
    ctx.beginPath();
    ctx.moveTo(x, vTop);
    ctx.lineTo(x, bot);
    ctx.moveTo(pad.l, Math.round(y) + 0.5);
    ctx.lineTo(layout.axisX, Math.round(y) + 0.5);
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    // Point de la bougie (clôture) / de la courbe, net avec un liseré sombre.
    var py = plotToY(pt.v, pad, h, minP, maxP);
    ctx.fillStyle = '#10141f';
    ctx.beginPath();
    ctx.arc(x, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F5C518';
    ctx.beginPath();
    ctx.arc(x, py, 3, 0, Math.PI * 2);
    ctx.fill();
    // Prix sous le doigt, sur la colonne des prix.
    ctx.font = '600 9px ui-monospace, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    var ptxt = formatAxisPrice(price);
    var pw = Math.ceil(ctx.measureText(ptxt).width) + 8;
    var px = Math.min(cssW - pw - 1, layout.axisX + 2);
    ctx.fillStyle = '#F5C518';
    roundRectOn(ctx, px, y - 7, pw, 14, 4);
    ctx.fill();
    ctx.fillStyle = '#10141f';
    ctx.fillText(ptxt, px + pw / 2, y + 0.5);
    // Carré du haut : O H / L C (ou le prix de la courbe), l'heure en bas ; il suit le trait.
    var dt = new Date(pt.t || xNow);
    var ttxt = pad2(dt.getHours()) + ':' + pad2(dt.getMinutes()) + ':' + pad2(dt.getSeconds());
    var lines2 = [];
    if (pt.c && isFinite(pt.c.o)) {
      var upB = Number(pt.c.c) >= Number(pt.c.o);
      var vc = upB ? UPC : DNC;
      lines2.push([['O ', DIM], [formatAxisPrice(Number(pt.c.o)) + '  ', vc], ['H ', DIM], [formatAxisPrice(Number(pt.c.h)), vc]]);
      lines2.push([['L ', DIM], [formatAxisPrice(Number(pt.c.l)) + '  ', vc], ['C ', DIM], [formatAxisPrice(Number(pt.c.c)), vc]]);
    } else {
      lines2.push([[formatAxisPrice(pt.v), '#F8E7B0']]);
    }
    lines2.push([[ttxt, DIM]]);
    infoPanel(lines2, pad, layout, panelY, x, 8);
    ctx.restore();
  }

  function readableOnWhite(col) {
    var r, gg, b, m;
    var s = String(col || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(s)) {
      r = parseInt(s.substr(1, 2), 16); gg = parseInt(s.substr(3, 2), 16); b = parseInt(s.substr(5, 2), 16);
    } else if (/^#[0-9a-f]{3}$/i.test(s)) {
      r = parseInt(s.charAt(1) + s.charAt(1), 16); gg = parseInt(s.charAt(2) + s.charAt(2), 16); b = parseInt(s.charAt(3) + s.charAt(3), 16);
    } else if ((m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i))) {
      r = +m[1]; gg = +m[2]; b = +m[3];
    } else {
      return '#0B0E14';
    }
    var lum = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255;
    if (lum <= 0.45) return 'rgb(' + r + ',' + gg + ',' + b + ')';
    var f = Math.max(0.3, 0.45 / lum);
    return 'rgb(' + Math.round(r * f) + ',' + Math.round(gg * f) + ',' + Math.round(b * f) + ')';
  }

  function drawLivePriceBadge(map, price, layout, assetColor) {
    if (!map || !isFinite(map.lastY)) return;
    var txt = formatAxisPrice(price);
    ctx.save();
    var accent = assetColor || '#F5A623';
    // Comme IQ Option : un long trait fin part du bout de la courbe jusqu'à la colonne des prix,
    // et le prix est posé DANS cette colonne, par-dessus les chiffres : il glisse le long de la
    // colonne quand le cours monte ou descend, sans jamais se bloquer contre une étiquette.
    var box = livePriceBadgeBox(map, price, layout);
    if (!box) { ctx.restore(); return; }
    var x = box.x0;
    var y = box.y0;
    var tw = box.x1 - box.x0;
    var th = box.y1 - box.y0;
    var ly = Math.round(map.lastY) + 0.5;
    if (x > map.lastX + 6) {
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(map.lastX + 5, ly);
      ctx.lineTo(x, ly);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Comme IQ Option : petite pastille BLANCHE pure ; les chiffres gardent la couleur de la
    // courbe (assombrie seulement si elle est trop claire pour se lire sur le blanc).
    ctx.font = '800 8.5px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = '#FFFFFF';
    roundRect(x, y, tw, th, 6);
    ctx.fill();
    ctx.fillStyle = readableOnWhite(accent);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + tw / 2, y + th / 2 + 0.4);
    ctx.restore();
  }

  function dampedRange(candles, assetId, minP, maxP) {
    if (assetId !== 'titanpulse') {
      return { min: minP, max: maxP };
    }
    if (!candles || candles.length < 8) return { min: minP, max: maxP };
    var highs = [];
    var lows = [];
    var i;
    for (i = 0; i < candles.length; i++) {
      highs.push(candles[i].h);
      lows.push(candles[i].l);
    }
    highs.sort(function (a, b) { return a - b; });
    lows.sort(function (a, b) { return a - b; });
    var hi = highs[Math.max(0, highs.length - 3)];
    var lo = lows[Math.min(lows.length - 1, 2)];
    var spikeHi = highs[highs.length - 1];
    var spikeLo = lows[0];
    return {
      max: hi + (spikeHi - hi) * 0.38,
      min: lo - (lo - spikeLo) * 0.38
    };
  }

  function visiblePriceBand(candles, livePrice, assetId) {
    var lo = Infinity;
    var hi = -Infinity;
    var n = candles ? candles.length : 0;
    var i;
    var j;
    for (i = 0; i < n; i++) {
      var c = candles[i];
      if (!c) continue;
      var vals = [c.o, c.h, c.l, c.c];
      for (j = 0; j < vals.length; j++) {
        var v = Number(vals[j]);
        if (!isFinite(v) || v <= 0 || v > 1e7) continue;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    if (isFinite(livePrice) && livePrice > 0 && livePrice < 1e7) {
      if (livePrice < lo) lo = livePrice;
      if (livePrice > hi) hi = livePrice;
    }
    if (!isFinite(lo) || !isFinite(hi) || hi <= lo) {
      var p = (Number(livePrice) > 0 && Number(livePrice) < 1e7) ? Number(livePrice) : ((Number(lastDrawnClose) > 0) ? lastDrawnClose : 10000);
      lo = p * 0.994;
      hi = p * 1.006;
    }
    return { min: lo, max: hi };
  }

  function fitVisibleY(candles, extras) {
    var band = visiblePriceBand(candles, extras && extras[0], null);
    var minPrice = band.min;
    var maxPrice = band.max;
    var e;
    if (extras) {
      for (e = 0; e < extras.length; e++) {
        var x = Number(extras[e]);
        if (!isFinite(x) || x <= 0 || x > 1e7) continue;
        if (x < minPrice) minPrice = x;
        if (x > maxPrice) maxPrice = x;
      }
    }
    var currentPrice = Number(extras && extras[0]);
    if (!(currentPrice > 0)) currentPrice = (minPrice + maxPrice) / 2 || 10000;
    var span = maxPrice - minPrice;
    if (!(span > 0) || span < currentPrice * 0.003) {
      span = currentPrice * 0.003;
      minPrice = currentPrice - span * 0.5;
      maxPrice = currentPrice + span * 0.5;
    }
    return { min: minPrice - span * padBottomRatio(), max: maxPrice + span * padTopRatio() };
  }

  // Taille FIXE du cadre (en % du prix) par actif, calée sur la volatilité du flux serveur
  // (~45 écarts-types d'un tick) : bougies bien lisibles, ni plates ni géantes. Le même
  // cadre sert au petit écran et au plein écran (plus haut = encore plus d'aisance).
  function routeSpanPct(assetId) {
    var base = {
      // Cadres agrandis moins vite que les vitesses (×vitesse^0,6) : on sent la vitesse sans déborder.
      v100: 0.0120, stable: 0.0055, apex500: 0.01377, horizon50: 0.0080,
      goldtrend: 0.0110, v75: 0.00955, nexusprime: 0.01033, titanpulse: 0.0330,
      boomspike: 0.0054, crash300: 0.0099
    }[assetId] || 0.0090;
    // Vélocité : moins de secondes à l'écran → le cadre se resserre d'autant (racine du temps), pour
    // garder la même hauteur de mouvement qu'avant (sinon la courbe paraîtrait plate). Ancien → nouveau.
    // v2336 : zooms de départ un peu plus larges (APOCALYPSE 7 s, PYTHON 10 s, ASMODUS 12 s, AZAZEL 14 s).
    // v2337 : bougies moins grosses (APOCALYPSE 14 s, PYTHON 18 s, ASMODUS 20 s, AZAZEL 23 s à l’écran).
    var velo = { titanpulse: Math.sqrt(19.25 / 23), crash300: Math.sqrt(23 / 25) }[assetId];
    if (velo) base *= velo;
    // Même recette sur les 10 simulations (celle qui ne déborde jamais) : aucune amplification
    // verticale. Le cadre suit le zoom comme un vrai marché (l'amplitude grandit avec la racine du
    // temps affiché), mesuré depuis le zoom de départ de CHAQUE simulation : un zoom de départ plus
    // proche (bougies plus larges) n'agrandit pas les mouvements. Zoom arrière : rien n'est coupé.
    var z = Number(zoomSec()) || 28;
    var zRef = ZOOM_STEPS[defaultZoomIdx(assetId)] || 28;
    var k = Math.sqrt(z / zRef);
    // Un peu plus haut (mouvements plus grands à l'écran). Ceux qui « s'envolaient » (ZUL, APOCALYPSE,
    // ORO) et AZAZEL gardent leur ancienne hauteur, qui tenait bien dans le cadre.
    var keep = { crash300: 1, v75: 1, titanpulse: 1, apex500: 1, horizon50: 1 };
    var taller = keep[assetId] ? 1 : 0.9;
    return base * taller * Math.max(0.7, Math.min(5, k));
  }

  var camCandles = null;
  // v2339 : état du cadre photo par marché (immobile / en train de se recentrer).
  var camState = {};

  // Caméra stable : cadre de taille fixe, la courbe défile dedans. Le cadre ne glisse
  // (doucement) que lorsque la tête s'approche d'un bord ; jamais de zoom qui « respire ».
  // Coefficient de suivi par image, converti selon le temps réellement écoulé depuis
  // l'image précédente (référence : 60 images/s). Plafonné pour un retour de veille.
  var camLastAt = 0;
  var camDt = 16.7;
  function cameraTick() {
    var t = (window.performance && performance.now) ? performance.now() : Date.now();
    camDt = camLastAt ? Math.max(4, Math.min(250, t - camLastAt)) : 16.7;
    camLastAt = t;
  }
  function cameraFollow(perFrame60) {
    return 1 - Math.pow(1 - perFrame60, camDt / 16.7);
  }

  function routeCamera(prevMin, prevMax, head, assetId) {
    var h = Number(head);
    if (!(h > 0) || !isFinite(h)) h = 10000;
    var want = h * routeSpanPct(assetId);
    var span;
    var mid;
    if (prevMax > prevMin) {
      // Caméra « pro » (2026-10-04, comme les grandes plateformes) : le cadre s'ajuste en douceur à
      // TOUTES les bougies visibles (pas seulement à la tête), avec une marge en haut et en bas.
      // Quand le prix descend, les vieilles bougies sortent à gauche et le cadre suit l'ensemble,
      // tranquillement : on ne sent plus la caméra « tirer » derrière la tête. Il s'agrandit vite
      // (un pic n'est jamais coupé) et se resserre lentement (pas de zoom nerveux). Affichage seulement.
      var vlo = h;
      var vhi = h;
      var vis = camCandles || [];
      for (var vi = 0; vi < vis.length; vi++) {
        var vc = vis[vi];
        if (!vc) continue;
        if (vc.l > 0 && vc.l < vlo) vlo = vc.l;
        if (vc.h > vhi) vhi = vc.h;
      }
      span = prevMax - prevMin;
      mid = (prevMin + prevMax) / 2;
      // v2336 : jamais plus serré que 90 % du cadre normal (avant 55 %) → mêmes proportions avant et après un
      // trade (le cadre du trade ne s’agrandit plus d’un coup) et plus de mouvements qui « s’envolent ».
      // v2338 : un peu plus d’air (bougies visibles = 60 % de la hauteur, plancher = cadre normal) → la
      // caméra a beaucoup moins besoin de s’agrandir (PYTHON « respirait ») et les courbes sont moins grosses.
      var tSpan = Math.max((vhi - vlo) / 0.60, want * 1.0);
      var tMid = (vhi + vlo) / 2;
      var keepH = span * 0.22;
      if (tMid < h - keepH) tMid = h - keepH;
      if (tMid > h + keepH) tMid = h + keepH;
      // v2339 — CADRE PHOTO (demande du propriétaire : « comme une photo », trading sérieux, pas un jeu
      // d'avion) : le cadre reste IMMOBILE tant que le prix est dans la zone du milieu (20 % à 80 % de la
      // hauteur). Seulement quand le prix approche d'un bord, un recentrage rapide et unique le ramène au
      // milieu, puis le cadre se fige de nouveau. Il ne s'agrandit que si un mouvement ne tient plus (pics
      // d'ORO 999) et ne se resserre que pendant un recentrage. Affichage seulement.
      var cs = camState[assetId] || (camState[assetId] = { moving: false });
      if (tSpan > span) span += (tSpan - span) * cameraFollow(0.06);
      if (!cs.moving && Math.abs(h - mid) > span * 0.30) cs.moving = true;
      if (cs.moving) {
        mid += (tMid - mid) * cameraFollow(0.12);
        // resserrement doux pendant le recentrage (BAAL : pas de changement de taille brusque)
        if (tSpan < span) span += (tSpan - span) * cameraFollow(0.03);
        if (Math.abs(tMid - mid) < span * 0.02) cs.moving = false;
      }
      var halfP = span / 2;
      var hardP = span * (IS_ANDROID_CHART ? 0.12 : 0.06);
      if (h > mid + halfP - hardP) mid = h - halfP + hardP;
      if (h < mid - halfP + hardP) mid = h + halfP - hardP;
      return { min: mid - halfP, max: mid + halfP };
    } else {
      span = want;
      // Premier cadrage : on part de la tête et on remonte les bougies tant qu'elles
      // tiennent dans le cadre, puis on centre sur ce morceau. Résultat : le graphique
      // apparaît entier et en place tout de suite (pas de moitié coupée qui glisse).
      var lo = h;
      var hi = h;
      var list = camCandles || [];
      var i;
      for (i = list.length - 1; i >= 0; i--) {
        var cd = list[i];
        if (!cd) continue;
        var nlo = cd.l > 0 && cd.l < lo ? cd.l : lo;
        var nhi = cd.h > hi ? cd.h : hi;
        if (nhi - nlo > span * 0.84) break;
        lo = nlo;
        hi = nhi;
      }
      mid = (hi + lo) / 2;
      // Tête déjà dans la zone calme : aucun glissement juste après l'arrivée.
      var calm = span / 2 - span * 0.22;
      if (mid < h - calm) mid = h - calm;
      if (mid > h + calm) mid = h + calm;
    }
    var half = span / 2;
    // Cadre « bloqué » (demande du propriétaire : la courbe ne doit plus « s'envoler comme un
    // avion ») : le cadre reste immobile tant que la tête est dans la grande zone du milieu.
    // Quand elle approche d'un bord, le cadre se recentre UNE fois, doucement, sur la tête,
    // puis s'arrête de nouveau (avant : il glissait sans arrêt derrière la tête).
    // Recette (2e version, le recentrage d'un coup faisait « s'envoler » tout le graphique) :
    // zone libre = la moitié du milieu ; au-delà, le cadre ne bouge QUE de l'écart, très doucement.
    var edge = span * 0.25;
    // Suivi réglé en TEMPS et non par image (vieux Android à 15 images/s = même vitesse).
    var kf = cameraFollow(0.045);
    if (h > mid + half - edge) mid += (h - (mid + half - edge)) * kf;
    if (h < mid - half + edge) mid += (h - (mid - half + edge)) * kf;
    // Filet dur : la tête ne sort jamais (pic Boom/Crash, retour de veille).
    var hard = span * (IS_ANDROID_CHART ? 0.12 : 0.06);
    if (h > mid + half - hard) mid = h - half + hard;
    if (h < mid - half + hard) mid = h + half - hard;
    return { min: mid - half, max: mid + half };
  }

  function captureTradeFrame(assetId, untilMs) {
    // v2337 : cadre figé supprimé (voir holdLock). Fonction gardée pour compatibilité.
    return;
    var st = ensureAssetState(assetId);
    untilMs = Number(untilMs) || 0;
    if (st.lockMin && st.lockMax && st.lockMax > st.lockMin && st.lockUntil > Date.now()) {
      st.lockUntil = Math.max(st.lockUntil || 0, untilMs);
      if (assetId === activeAsset) {
        viewMin = st.lockMin;
        viewMax = st.lockMax;
      }
      return;
    }
    var lo = 0;
    var hi = 0;
    if (assetId === activeAsset && viewMax > viewMin) {
      lo = viewMin;
      hi = viewMax;
    } else if (st.viewMax > st.viewMin) {
      lo = st.viewMin;
      hi = st.viewMax;
    } else if (st.min && st.max && st.max > st.min) {
      lo = st.min;
      hi = st.max;
    }
    if (!(hi > lo)) {
      var p = Number(st.lastPrice || lastDrawnClose);
      if (!(p > 0)) p = 10000;
      var s0 = Math.abs(p) * routeSpanPct(assetId);
      lo = p - s0 / 2;
      hi = p + s0 / 2;
    }
    // Verrouille le cadre ACTUEL sans l'élargir (sinon la courbe s'aplatit d'un coup).
    var mid = (lo + hi) / 2;
    var span = hi - lo;
    var want = Math.abs(mid) * routeSpanPct(assetId);
    if (!(span >= want * 0.85)) span = want;
    var airSpan = span * 1.01;
    lo = mid - airSpan / 2;
    hi = mid + airSpan / 2;
    st.lockMin = lo;
    st.lockMax = hi;
    st.lockUntil = Math.max(st.lockUntil || 0, untilMs);
    st.lockMode = viewMode();
    if (assetId === activeAsset) {
      viewMin = lo;
      viewMax = hi;
    }
  }

  function idleCamera(histMin, histMax, prevMin, prevMax, head) {
    return routeCamera(prevMin, prevMax, head, activeAsset);
  }

  function goldIdleCamera(histMin, histMax, prevMin, prevMax, head) {
    return routeCamera(prevMin, prevMax, head, 'goldtrend');
  }

  function drawFrame(now) {
    cameraTick();
    try {
    if (!ctx) return;
    if (cssW < 8 || cssH < 8) resize();
    if (cssW < 8 || cssH < 8) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var asset = D6.CONFIG && D6.CONFIG.ASSETS ? D6.CONFIG.ASSETS[activeAsset] : null;
    if (!asset) return;
    var theme = plotTheme(asset);
    var market = D6.Engine && D6.Engine.getMarket ? D6.Engine.getMarket(activeAsset) : null;
    if (!market) return;
    if (market.waiting) {
      // Historique pas encore reçu du serveur : fond seul, jamais une fausse courbe.
      ctx.fillStyle = '#0B0E14';
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.fillStyle = 'rgba(245,197,24,0.55)';
      ctx.font = '700 12px "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((D6.I18N && D6.I18N.t) ? D6.I18N.t('m_connecting') : 'Connecting to market…', cssW / 2, cssH / 2);
      ctx.textAlign = 'left';
      if (headPriceMotion[activeAsset]) headPriceMotion[activeAsset].value = NaN;
      viewMin = 0;
      viewMax = 0;
      wantFitY = true;
      return;
    }
    frameDisplayPrice = updateHeadPrice(activeAsset, market.price, now);
    var allTrades = collectOpenTradeVisuals();
    var primary = allTrades[0] || null;
    allTrades.forEach(function (ot) {
      if (!primary || (ot.expiryTime || ot.expiresAt) < (primary.expiryTime || primary.expiresAt)) primary = ot;
    });
    var narrow = (window.innerWidth || 0) <= 430;
    var fsOn = !!(document.documentElement.classList.contains('fs-trade') ||
      (document.getElementById('fsTradeOverlay') && document.getElementById('fsTradeOverlay').classList.contains('on')));
    fsActive = fsOn;
    // Bascule plein écran : recadrage net FS (ne pas recycler le cadre mobile serré).
    if (fsOn !== fsWasOn) {
      fsWasOn = fsOn;
      wantFitY = true;
      viewMin = 0;
      viewMax = 0;
      var stToggle = ensureAssetState(activeAsset);
      stToggle.lockMin = 0;
      stToggle.lockMax = 0;
      // lockUntil conservé si trade ouvert → captureTradeFrame reconstruira au format FS.
    }
    // Colonne des prix compacte mais jamais tronquée : la largeur réservée doit
    // loger le libellé le plus long plus la marge de sécurité à droite.
    // `b` ne réservait de la place que pour les libellés de secondes, désormais
    // supprimés : la hauteur revient au tracé.
    var pad = fsOn
      ? { t: 4, r: 56, b: 18, l: 4 } // plein écran : marge du bas agrandie, le dernier prix de l’axe n’est plus coupé
      : { t: narrow ? 6 : 8, r: narrow ? 54 : 56, b: 8, l: 8 };
    var layout = plotLayout(pad);
    var w = layout.plotW;
    var seriesW = layout.seriesW;
    var h = cssH - pad.t - pad.b;
    if (h < 48) h = 48;

    var wantZoom = zoomSec();
    if (!(zoomSmooth > 0)) zoomSmooth = wantZoom;
    zoomSmooth += (wantZoom - zoomSmooth) * zoomEase;
    if (Math.abs(zoomSmooth - wantZoom) < 0.4) zoomSmooth = wantZoom;
    xNow = frameWallClock(now);
    // Retour de veille : tant que les prix manqués n'ont pas été reçus, on affiche la courbe
    // figée à son dernier instant (pas de trou, pas de trait droit), puis le direct.
    if (D6.Engine && D6.Engine.lagMs) {
      var feedLag = D6.Engine.lagMs(activeAsset);
      if (feedLag > 0) xNow -= feedLag;
    }
    xWin = Math.max(8000, zoomSmooth * 1000);
    if (panAsset !== activeAsset) {
      panAsset = activeAsset;
      if (panMs) { stopPanAnim(); panEpoch++; panMs = 0; }
      panView = null;
    }
    lastSeriesW = layout.seriesW;
    panRightMs = Math.max(0, (layout.axisX - layout.headX) * xWin / Math.max(1, layout.seriesW));
    var panWall = Date.now();
    if (panLastWall && panMs > 0 && !panLiveAnim) {
      var panDW = Math.max(0, Math.min(1000, panWall - panLastWall));
      if (!(panDataMaxMs > 0) || panMs + panDW <= panDataMaxMs) {
        panMs += panDW;
        if (panDragRef) panDragRef.ms += panDW;
      }
      if (panFollow) panTarget += panDW;
    }
    panLastWall = panWall;
    if (panMs) xNow -= panMs;
    // Ne plus forcer xWin sur la durée du plus vieux trade : ça bloquait le zoom+
    // dès qu'un trade était ouvert. Le zoom utilisateur prime.

    // Fond : carte du monde + logos crypto + lumières chaudes, dessiné une seule
    // fois dans une image puis simplement recopié à chaque image.
    drawBackdrop(pad, w, h);

    var candles = visibleCandles(market);
    camCandles = candles;
    xTimes = [];
    var xi;
    for (xi = 0; xi < candles.length; xi++) xTimes.push(candles[xi].t);
    var closes = closeSeries(market);
    if (panTrim > 0) closes = closes.slice(0, Math.max(0, closes.length - panTrim));
    var visN = candles.length;
    var startIdx = Math.max(0, closes.length - visN);
    seriesScratch.length = 0;
    var i;
    var band = visiblePriceBand(candles, market.price, asset.id);
    var minPrice = band.min;
    var maxPrice = band.max;
    var currentPrice = (isFinite(frameDisplayPrice) && frameDisplayPrice > 0 && frameDisplayPrice < 1e7)
      ? frameDisplayPrice
      : ((minPrice + maxPrice) / 2);
    var spanRaw = maxPrice - minPrice;
    if (!(spanRaw > 0) || spanRaw < currentPrice * 0.003) {
      spanRaw = currentPrice * 0.003;
      minPrice = currentPrice - spanRaw * 0.5;
      maxPrice = currentPrice + spanRaw * 0.5;
    }
    var st = ensureAssetState(activeAsset);
    var head = currentPrice;
    if (candles && candles.length && isFinite(candles[candles.length - 1].c)) {
      var hc = Number(candles[candles.length - 1].c);
      if (hc > 0 && hc < 1e7) head = hc;
    }
    // Cadre figé par les trades de l'AUTRE compte (réel ↔ démo) : on le relâche, sinon la
    // démo restait aplatie par les ×50 du réel jusqu'à la fin de ces trades.
    var vmNow = viewMode();
    if (!allTrades.length && st.lockUntil && st.lockMode && st.lockMode !== vmNow) {
      st.lockMin = 0;
      st.lockMax = 0;
      st.lockUntil = 0;
      st.lockMode = '';
      strikeLock = null;
    }
    if (allTrades.length) st.lockMode = vmNow;
    // v2337 — PLUS DE CADRE FIGÉ PENDANT LES TRADES (décision définitive) : une seule caméra douce, avec ou
    // sans trade, comme les grandes plateformes. Avant, le cadre figé s’agrandissait pour la ligne objectif
    // (courbe écrasée / qui « tire » en ×5-×50) et restait faux après un zoom ou une actualisation (courbe
    // « raide »). Les lignes hors du cadre restent collées au bord avec leur flèche (drawTargetLine).
    var holdLock = false;
    st.lockMin = 0; st.lockMax = 0; st.lockUntil = 0;
    if (allTrades.length) {
      var expHold = 0;
      var th;
      for (th = 0; th < allTrades.length; th++) {
        var ex = allTrades[th].expiryTime || allTrades[th].expiresAt || 0;
        if (ex > expHold) expHold = ex;
      }
      st.lockUntil = Math.max(st.lockUntil || 0, expHold + 1000);
    }
    var strikeP = primary && Number(primary.entryPrice);
    var extrasY = [head];
    if (isFinite(strikeP) && strikeP > 0) extrasY.push(strikeP);
    if (wantFitY) {
      if (holdLock && st.lockMax > st.lockMin) {
        // Ne jamais recadrer un trade déjà verrouillé (évite le saut du trait).
        viewMin = st.lockMin;
        viewMax = st.lockMax;
        strikeLock = { assetId: activeAsset, min: viewMin, max: viewMax, entry: null, ey: null };
        wantFitY = false;
        pendingYAnchor = null;
      } else {
      var fit;
      // Tous les actifs : route centrée sur la tête (évite l'étirement Crash/Boom via hist).
      fit = routeCamera(0, 0, head, activeAsset);
      viewMin = fit.min;
      viewMax = fit.max;
      if (holdLock) {
        st.lockMin = viewMin;
        st.lockMax = viewMax;
        strikeLock = { assetId: activeAsset, min: viewMin, max: viewMax, entry: null, ey: null };
      }
      wantFitY = false;
      pendingYAnchor = null;
      }
    } else if (fsOn && viewMax > viewMin) {
      if (holdLock && st.lockMax > st.lockMin) {
        // Plein écran + trade : garder le cadre figé (pas de lerp qui fait monter le trait).
        viewMin = st.lockMin;
        viewMax = st.lockMax;
        strikeLock = { assetId: activeAsset, min: viewMin, max: viewMax, entry: null, ey: null };
      } else {
        // Plein écran : même caméra stable que le petit écran.
        var gFs = routeCamera(viewMin, viewMax, head, activeAsset);
        viewMin = gFs.min;
        viewMax = gFs.max;
      }
      if (holdLock && !(st.lockMax > st.lockMin)) {
        st.lockMin = viewMin;
        st.lockMax = viewMax;
        strikeLock = { assetId: activeAsset, min: viewMin, max: viewMax, entry: null, ey: null };
      }
    } else if (holdLock && st.lockMax > st.lockMin) {
      // Cadre figé pendant le trade : le trait d’entrée reste calme.
      viewMin = st.lockMin;
      viewMax = st.lockMax;
      strikeLock = { assetId: activeAsset, min: viewMin, max: viewMax, entry: null, ey: null };
    } else if (holdLock) {
      captureTradeFrame(activeAsset, st.lockUntil || Date.now() + 1000);
      viewMin = st.lockMin;
      viewMax = st.lockMax;
      strikeLock = { assetId: activeAsset, min: viewMin, max: viewMax, entry: null, ey: null };
    } else {
      st.lockMin = 0;
      st.lockMax = 0;
      st.lockUntil = 0;
      strikeLock = null;
      var prevMin = (viewMin && viewMax && viewMax > viewMin) ? viewMin : (st.viewMin || 0);
      var prevMax = (viewMin && viewMax && viewMax > viewMin) ? viewMax : (st.viewMax || 0);
      var cam = routeCamera(prevMin, prevMax, head, activeAsset);
      if (prevMax > prevMin) {
        // routeCamera est déjà doux (glissement lent, taille fixe) : pas de second lissage.
        viewMin = cam.min;
        viewMax = cam.max;
      } else {
        viewMin = cam.min;
        viewMax = cam.max;
      }
    }
    if (holdLock && st.lockMax > st.lockMin) {
      // Cadre figé pendant le trade (trait d'entrée calme). Mais la courbe est désormais
      // libre (vrai hasard) : si la tête s'approche d'un bord, le cadre glisse doucement,
      // même taille, pour qu'elle ne sorte jamais de l'écran.
      // Tout ce qui compte doit rester visible : tête et prix d'entrée. La ligne objectif
      // (×5, ×10, ×50) n'agrandit le cadre que si elle est proche de la tête ; plus loin
      // (×50 sur 5 ou 10 min), elle reste collée au bord avec sa flèche et son prix, et la
      // courbe garde sa taille normale (avant : elle devenait toute plate).
      var needLo = head;
      var needHi = head;
      var nearBar = Math.abs(head) * routeSpanPct(activeAsset) * 0.42;
      var nt;
      for (nt = 0; nt < allTrades.length; nt++) {
        var tv = allTrades[nt];
        if (!tv || tv.assetId !== activeAsset) continue;
        [Number(tv.entryPrice), Number(tv.barrier)].forEach(function (pv, k) {
          if (!(pv > 0) || !isFinite(pv)) return;
          // Objectif (k = 1) ET prix d'entrée (k = 0) : s'ils sont loin de la tête (trade de 5 ou 10 min),
          // ils ne déforment plus le cadre ; leur trait reste collé au bord avec une étiquette.
          if (Math.abs(pv - head) > nearBar) return;
          if (pv < needLo) needLo = pv;
          if (pv > needHi) needHi = pv;
        });
      }
      var lockSpan = st.lockMax - st.lockMin;
      var wantSpan = Math.max(lockSpan, (needHi - needLo) * 1.3);
      var lockMid = (st.lockMin + st.lockMax) / 2;
      var margin = wantSpan * 0.20;
      var targetMid = lockMid;
      if (needHi > lockMid + wantSpan / 2 - margin) targetMid = needHi - wantSpan / 2 + margin;
      if (needLo < targetMid - wantSpan / 2 + margin) targetMid = needLo + wantSpan / 2 - margin;
      var newSpan = lockSpan + (wantSpan - lockSpan) * cameraFollow(0.15);
      var newMid = lockMid + (targetMid - lockMid) * cameraFollow(0.15);
      st.lockMin = newMid - newSpan / 2;
      st.lockMax = newMid + newSpan / 2;
      var hardL = newSpan * 0.04;
      if (head > st.lockMax - hardL) { st.lockMin += head - (st.lockMax - hardL); st.lockMax = head + hardL; }
      if (head < st.lockMin + hardL) { st.lockMax -= (st.lockMin + hardL) - head; st.lockMin = head - hardL; }
      viewMin = st.lockMin;
      viewMax = st.lockMax;
    }
    // Pas d'expansion keepAir : elle changeait la taille du graphique et faisait
    // rebondir tout le corps (surtout Stable Core / Horizon 50).
    st.viewMin = viewMin;
    st.viewMax = viewMax;

    if (isFinite(market.price) && market.price > 0 && market.price < 1e7) {
      lastDrawnClose = Number(market.price);
    } else if (candles && candles.length && isFinite(candles[candles.length - 1].c)) {
      var lc = Number(candles[candles.length - 1].c);
      if (lc > 0 && lc < 1e7) lastDrawnClose = lc;
    }

    var minP = viewMin;
    var maxP = viewMax;
    if (panMs > 0 && candles.length) {
      var pLo = Infinity;
      var pHi = -Infinity;
      var pi;
      for (pi = 0; pi < candles.length; pi++) {
        var pl = Number(candles[pi].l);
        var ph = Number(candles[pi].h);
        if (!isFinite(pl) || !isFinite(ph)) { pl = Number(candles[pi].c); ph = pl; }
        if (pl < pLo) pLo = pl;
        if (ph > pHi) pHi = ph;
      }
      // Les trades ouverts restent à leur vrai prix, toujours visibles (jamais collés en haut ou en bas).
      for (pi = 0; pi < allTrades.length; pi++) {
        var pe = allTrades[pi] && allTrades[pi].assetId === activeAsset ? Number(allTrades[pi].entryPrice) : NaN;
        if (isFinite(pe) && pe > 0) {
          if (pe < pLo) pLo = pe;
          if (pe > pHi) pHi = pe;
        }
      }
      if (pHi > pLo) {
        var pPad = (pHi - pLo) * 0.2;
        var pMinSpan = (maxP - minP) * 0.5;
        if ((pHi - pLo) + 2 * pPad < pMinSpan) pPad = (pMinSpan - (pHi - pLo)) / 2;
        if (!panView) panView = { min: minP, max: maxP };
        panView.min += ((pLo - pPad) - panView.min) * 0.2;
        panView.max += ((pHi + pPad) - panView.max) * 0.2;
        minP = panView.min;
        maxP = panView.max;
      }
    } else if (panView) {
      panView.min += (minP - panView.min) * 0.2;
      panView.max += (maxP - panView.max) * 0.2;
      if (Math.abs(panView.min - minP) + Math.abs(panView.max - maxP) < (maxP - minP) * 0.01) panView = null;
      else { minP = panView.min; maxP = panView.max; }
    }

    drawGrid(pad, w, seriesW, h, minP, maxP, theme);

    ctx.save();
    // Grand OROLADO au centre, façon grandes plateformes : une seule teinte douce, très
    // transparente, sans contour. On lit le nom sur une capture, les bougies restent devant.
    var wmSize = watermarkSize(w, h);
    ctx.font = '800 ' + wmSize + 'px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#E9D9B0';
    ctx.fillText('OROLADO', pad.l + w / 2, pad.t + h / 2);
    ctx.restore();

    var map = null;
    var lineData = closes.slice(startIdx);
    ctx.save();
    ctx.beginPath();
    // AZAZEL : ses colonnes sortent du sol → la zone de dessin descend jusqu'au bas du cadre (sous la
    // ligne des secondes), sinon une bande vide restait sous les colonnes. Les autres : inchangé.
    var clipH = asset.id === 'crash300' ? Math.max(h, (cssH || 0) - pad.t) : h;
    ctx.rect(pad.l, pad.t, Math.max(2, w), Math.max(2, clipH));
    ctx.clip();
    if (asset.id === 'stable') {
      map = drawCoreLine(pad, seriesW, h, lineData, minP, maxP, '#ff2d75', 3.6);
    } else if (STYLED_ASSETS[asset.id]) {
      map = drawStyledCandles(pad, seriesW, h, candles, minP, maxP, STYLED_ASSETS[asset.id]);
    } else if (asset.chart === 'candle' || asset.id === 'horizon50') {
      map = drawCandles(pad, seriesW, h, candles, minP, maxP, {
        thin: false,
        capWicks: true,
        tradeLock: true,
        lockSpan: maxP - minP,
        boomNeon: false,
        boomSmall: asset.id === 'boomspike',
        apexAiry: asset.id === 'apex500',
        nexusCyber: asset.id === 'nexusprime',
        titanIce: false,
        v75Rose: asset.id === 'v75',
        horizonOrange: asset.id === 'horizon50',
        crashDrop: asset.id === 'crash300',
        v100Big: asset.id === 'v100'
      });
      if (asset.trendLine) drawTrendLine(pad, seriesW, h, candles, minP, maxP);
    } else if (asset.lineStyle === 'step') {
      map = drawStepLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#2F6BFF', asset.lineAccent || '#FF7A00', asset.lineWidth || 3);
    } else if (asset.lineStyle === 'smooth' || asset.plotTheme === 'ivoryGold') {
      map = drawSmoothLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#ff9800', asset.lineWidth || 2.5, asset.lineHalo || (asset.id === 'horizon50' ? 'rgba(255,152,0,0.55)' : null));
    } else if (asset.areaRgb || asset.id === 'goldtrend') {
      map = drawGradientLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#ffb300', asset.lineWidth || 2.5, asset.areaRgb || '255,179,0');
    } else {
      map = drawLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#f5a623');
    }
    if (!map) {
      map = {
        toY: function (p) { return plotToY(p, pad, h, minP, maxP); },
        lastX: layout.headX,
        lastY: plotToY(market.price, pad, h, minP, maxP)
      };
    }
    if (map && isFinite(map.lastY)) {
      var air = 0.15;
      var yLo = pad.t + h * air;
      var yHi = pad.t + h * (1 - air);
      // Mesure de contrôle (tests) : position réelle de la tête dans le cadre, avant le garde-fou.
      window.__oroHead = { a: activeAsset, fs: !!fsOn, r: (map.lastY - pad.t) / Math.max(1, h), lo: minP, hi: maxP };
      if (map.lastY < yLo) map.lastY = yLo;
      if (map.lastY > yHi) map.lastY = yHi;
    }
    if (map) {
      if (inds.bb) drawBollinger(map, closes, startIdx, theme);
      if (inds.ma) {
        ctx.save();
        ctx.shadowBlur = 0;
        drawPoly(map, closes, 9, '#ffb703', 1.65, startIdx);
        ctx.restore();
      }
      if (inds.ema) {
        ctx.save();
        ctx.shadowBlur = 0;
        drawEmaLine(map, closes, 9, startIdx);
        ctx.restore();
      }
      // Légende des indicateurs actifs (comme sur les plateformes pro).
      var legend = [];
      if (inds.ma) legend.push(['MA 9', '#ffb703']);
      if (inds.ema) legend.push(['EMA 9', '#00f0ff']);
      if (inds.bb) legend.push(['BB 20', '#b48cf0']);
      if (legend.length) {
        // Pastilles lisibles (fond sombre, point de couleur) : jamais de texte sur les bougies.
        ctx.save();
        ctx.font = '700 10px "Hanken Grotesk", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        var lx = pad.l + 6;
        var ly = pad.t + 4;
        var lh = 16;
        legend.forEach(function (it) {
          var tw = Math.ceil(ctx.measureText(it[0]).width);
          var pw = tw + 20;
          ctx.globalAlpha = 1;
          ctx.fillStyle = 'rgba(10,14,22,0.78)';
          roundRectOn(ctx, lx, ly, pw, lh, 8);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = it[1];
          ctx.beginPath();
          ctx.arc(lx + 8, ly + lh / 2, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(235,240,250,0.92)';
          ctx.fillText(it[0], lx + 14, ly + lh / 2 + 0.5);
          lx += pw + 5;
        });
        ctx.restore();
      }
    }
    ctx.restore();

    lastPad = pad;
    lastPlotH = h;
    lastMinP = minP;
    lastMaxP = maxP;
    lastMap = map;

    var touchCandleMode = asset.id !== 'stable' && (asset.id === 'titanpulse' || asset.chart === 'candle' || asset.id === 'horizon50');

    // Lignes de trade sur le canvas principal (PC + mobile) ; overlay vidé.
    tradeYsScratch.length = 0;
    tradeHits.length = 0;
    targetTagQueue.length = 0;
    chronoPlaced.length = 0;
    chronoQueue.length = 0;
    var ti;
    var drawnKeys = {};
    for (ti = 0; ti < allTrades.length; ti++) {
      var ot = allTrades[ti];
      if (!ot || ot.settled) continue;
      var epY = Number(ot.entryPrice != null ? ot.entryPrice : ot.openPrice);
      var y0 = priceToY(epY, pad, h, minP, maxP);
      var t0 = Number(ot.startTime || ot.startedAt || 0);
      var key = String(Math.round(y0 / 8)) + ':' + String(Math.round(t0 / 400));
      var count = 1;
      var uj;
      if (!IS_ANDROID_CHART) {
        for (uj = 0; uj < allTrades.length; uj++) {
          if (uj === ti) continue;
          var ot2 = allTrades[uj];
          var y2 = priceToY(Number(ot2.entryPrice != null ? ot2.entryPrice : ot2.openPrice), pad, h, minP, maxP);
          var t2 = Number(ot2.startTime || ot2.startedAt || 0);
          if (Math.abs(y0 - y2) < 10 && Math.abs(t0 - t2) < 400) count++;
        }
      }
      drawnKeys[key] = true;
      var shift = 0;
      var j;
      for (j = 0; j < tradeYsScratch.length; j++) {
        if (Math.abs(y0 - tradeYsScratch[j]) < 10) shift += 8;
      }
      tradeYsScratch.push(y0);
      tradeHits.push({ v: ot, y: y0 });
      drawEntryOn(ctx, map, ot, now, pad, ti, minP, maxP, h, shift, layout, count);
    }
    drawTargetTags(ctx, map && !(panMs > 0) ? livePriceBadgeBox(map, market.price, layout) : null);
    drawChronos();
    paintOverlay();

    var tagCol = asset.chart === 'candle'
      ? (market.price >= (market.candle.o) ? '#00E676' : '#FF1744')
      : (asset.lineColor || asset.accent || '#FFD700');
    if (primary) {
      var above = market.price >= primary.entryPrice;
      var liveWin = (primary.side === 'call' && above) || (primary.side === 'put' && !above);
      tagCol = liveWin ? '#00E676' : '#FF1744';
    }
    if (asset.id === 'crash300' && !primary) {
      tagCol = market.price >= (market.candle && market.candle.o) ? '#FF9F43' : '#FF3B30';
    }
    if (asset.id === 'nexusprime') tagCol = '#00E5FF';
    if (asset.id === 'titanpulse') tagCol = '#e0e6ed';
    if (asset.id === 'v75') tagCol = '#ff2d75';
    if (asset.id === 'apex500') tagCol = '#C084FC';
    // Historique regardé : le point du direct reste affiché tant que le bout de la courbe est à l'écran.
    if (map && (!(panMs > 0) || (panTrim === 0 && map.lastX < layout.axisX - 70))) {
      drawBead(map, market.price, tagCol, now, theme);
      drawLivePriceBadge(map, market.price, layout, tagCol);
      drawPendingPulse(map, now);
    }
    // Nouveau trade pendant qu'on regarde le passé : retour au direct.
    if (allTrades.length > lastTradeN && panMs > 0) panGoLive();
    lastTradeN = allTrades.length;
    if (touchCross || tradeCard) {
      drawTouchLayer(pad, h, layout, minP, maxP, candles, lineData, touchCandleMode, now, Number(market.price), !!(inds.ma || inds.bb || inds.ema));
    }
    st.lastPrice = lastDrawnClose;
    st.candles = (candles || []).slice(-BUFFER_N);
    st.min = minP;
    st.max = maxP;
    st.at = Date.now();
    } catch (eFrame) { /* keep candles alive */ }
  }

  function ensureChartPulse() {
    /* RAF unique — pas de setInterval de dessin. */
  }

  function pauseChartEngine() {
    window.chartIsPaused = true;
    if (!chartHiddenAt) chartHiddenAt = Date.now();
  }

  function wakeChartEngine() {
    var sleptMs = chartHiddenAt ? (Date.now() - chartHiddenAt) : 0;
    chartHiddenAt = 0;
    window.chartIsPaused = false;
    window.lastTickTime = performance.now();
    lastTs = performance.now();
    lastFlush = 0;
    lastDraw = 0;
    // Réveil (téléphone déverrouillé) : pas de glissement lent depuis l'ancien prix,
    // la tête repart directement du prix actuel.
    if (headPriceMotion[activeAsset]) headPriceMotion[activeAsset].value = NaN;
    if (D6.Engine && D6.Engine.resyncClocks) {
      try { D6.Engine.resyncClocks(); } catch (eRs) { /* ignore */ }
    }
    running = true;
    if (IS_ANDROID_CHART) {
      lastGeomKey = '';
      try { resize(true); } catch (eAr) { /* ignore */ }
    }
    if (!loopRaf) {
      loopRaf = requestAnimationFrame(loop);
    }
    window.animationFrameId = loopRaf;
    try { drawNow(); } catch (eW) { /* ignore */ }
    if (typeof syncAccountMode === 'function') {
      try { syncAccountMode(); } catch (eSm) { /* ignore */ }
    }
    var recoverMs = IS_ANDROID_CHART
      ? (sleptMs >= 8000 ? [90, 280, 700, 1400, 2500, 4500] : [90, 280, 700, 1400])
      : (IS_IOS_CHART && sleptMs >= 8000 ? [200, 800] : []);
    recoverMs.forEach(function (ms) {
      setTimeout(function () {
        if (document.hidden) return;
        if (IS_ANDROID_CHART) {
          lastGeomKey = '';
          try { resize(true); } catch (e2) { /* ignore */ }
        }
        try { drawNow(); } catch (e3) { /* ignore */ }
        try { syncAccountMode(); } catch (e4) { /* ignore */ }
        if (!loopRaf && running && !window.chartIsPaused) {
          loopRaf = requestAnimationFrame(loop);
          window.animationFrameId = loopRaf;
        }
      }, ms);
    });
  }

  function bindVisibilityFix() {
    if (window.__oroladoVisBound) return;
    window.__oroladoVisBound = true;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pauseChartEngine();
      else wakeChartEngine();
    });
    window.addEventListener('pageshow', function (ev) {
      if (document.hidden) return;
      if (ev && ev.persisted && !chartHiddenAt) chartHiddenAt = Date.now() - 20000;
      wakeChartEngine();
    });
    if (IS_MOBILE_CHART) {
      window.addEventListener('pagehide', function () { pauseChartEngine(); });
    }
    if (IS_MOBILE_CHART && canvas) {
      canvas.addEventListener('pointerdown', function () {
        if (document.hidden) return;
        if (loopRaf && !window.chartIsPaused) return;
        var now = Date.now();
        if (now - lastClickWake < 350) return;
        lastClickWake = now;
        wakeChartEngine();
      }, { passive: true });
    }
    if (!IS_ANDROID_CHART) return;
    document.addEventListener('freeze', function () { pauseChartEngine(); });
    document.addEventListener('resume', function () {
      if (!document.hidden) wakeChartEngine();
    });
    var lastFocusWake = 0;
    window.addEventListener('focus', function () {
      if (document.hidden) return;
      var now = Date.now();
      if (now - lastFocusWake < 500) return;
      lastFocusWake = now;
      wakeChartEngine();
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        if (document.hidden) return;
        lastGeomKey = '';
        scheduleResize(40);
      });
    }
    if (canvas) {
      canvas.addEventListener('contextlost', function (e) {
        if (e && e.preventDefault) e.preventDefault();
      });
      canvas.addEventListener('contextrestored', function () {
        if (!document.hidden) wakeChartEngine();
      });
    }
  }

  function loop(ts) {
    if (!running) return;
    if (window.chartIsPaused || document.hidden) {
      loopRaf = 0;
      window.animationFrameId = 0;
      lastTs = ts;
      window.lastTickTime = ts;
      return;
    }
    loopRaf = requestAnimationFrame(loop);
    window.animationFrameId = loopRaf;
    try {
      var liveN = (D6.Engine && D6.Engine.liveCount) ? D6.Engine.liveCount() : 0;
      var tickEvery = liveN > 0 ? 150 : 220;
      if (ts - lastFlush >= tickEvery) {
        if (D6.Engine && D6.Engine.tick) D6.Engine.tick(activeAsset);
        flushDue();
        lastFlush = ts;
        window.lastTickTime = ts;
      }
      // Rendu à chaque vsync : un seuil en millisecondes ferait sauter une frame
      // sur deux ou sur trois hors 60 Hz, d'où les saccades au défilement.
      var dt = lastDraw ? (ts - lastDraw) : 16;
      if (!(dt > 0)) dt = 0;
      if (dt > 100) dt = 100;
      lastDraw = ts;
      if (!lastTs) lastTs = ts;
      lastTs = ts;
      payoutAcc += dt;

      if (payoutAcc > 2800) {
        if (D6.Engine && D6.Engine.refreshPayout) D6.Engine.refreshPayout(activeAsset);
        payoutAcc = 0;
      }

      drawFrame(ts);
      if (onFrame) onFrame(ts);
    } catch (eLoop) {
      try { drawNow(); } catch (e2) { /* ignore */ }
    }
  }

  function syncIndButtons() {
    document.querySelectorAll('.ind-btn[data-ind]').forEach(function (btn) {
      var key = btn.dataset.ind;
      btn.classList.toggle('on', !!inds[key]);
    });
  }

  function resetChartView() {
    // Rien à remettre (zoom normal, aucun indicateur) : on ne touche pas au cadre. Avant, chaque
    // clic recadrait la courbe (elle « descendait ») même sans zoom ni indicateur.
    if (panMs) panGoLive();
    if (zoomIdx === defaultZoomIdx(activeAsset) && !inds.ma && !inds.bb && !inds.ema) return;
    var stNow = ensureAssetState(activeAsset);
    var tradeFrame = !!(stNow.lockUntil && Date.now() < stNow.lockUntil);
    zoomIdx = defaultZoomIdx(activeAsset);
    zoomSmooth = zoomSec();
    persistView(activeAsset);
    inds.ma = false;
    inds.bb = false;
    inds.ema = false;
    persistView(activeAsset);
    syncIndButtons();
    // Pendant un trade : zoom et indicateurs remis, mais le cadre du trade reste en place.
    if (!tradeFrame) {
      viewMin = 0;
      viewMax = 0;
      var st = ensureAssetState(activeAsset);
      st.lockMin = 0;
      st.lockMax = 0;
      st.viewMin = 0;
      st.viewMax = 0;
      strikeLock = null;
    }
    if (isChartReady()) drawNow();
  }

  function ensureToolbarExtras() {
    var zin = document.getElementById('chartZoomIn');
    var zout = document.getElementById('chartZoomOut');
    if (zin && zin.parentNode && !zin.parentNode.querySelector('.chart-tool-sep')) {
      var sep = document.createElement('span');
      sep.className = 'chart-tool-sep';
      sep.setAttribute('aria-hidden', 'true');
      zin.parentNode.insertBefore(sep, zin);
    }
    if (zout && zout.parentNode && !document.getElementById('chartReset')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'chartReset';
      btn.className = 'ind-btn zoom-btn chart-reset-btn';
      btn.setAttribute('aria-label', 'Reset');
      btn.title = 'Reset';
      btn.textContent = '↺';
      zout.parentNode.insertBefore(btn, zout.nextSibling);
    }
  }

  var toolsBound = false;
  /*
   * ZOOM ÉLASTIQUE : pincer à deux doigts sur le graphique (téléphone, tablette, PC tactile, pavé
   * tactile). Pendant le geste le zoom suit les doigts en continu ; aux limites (10 s / 11 min) il
   * résiste comme un élastique ; au lâcher il revient en douceur au cran le plus proche. Seul le
   * graphique réagit (le reste de la page ne bouge pas). Un doigt seul : rien ne change.
   * Affichage uniquement : les prix, les trades et leur règlement ne sont pas concernés.
   */
  // Défilement de l'historique (affichage seulement) : recul en ms, suivi doux du doigt, élan calme,
  // ressort aux deux bouts, retour au direct.
  function stopPanAnim() { if (panAnim) cancelAnimationFrame(panAnim); panAnim = 0; panFollow = false; }
  function panGoLive() {
    // Retour au direct en glissant (Actualiser, nouveau trade).
    stopPanAnim();
    panEpoch++;
    if (!(panMs > 0)) { panMs = 0; return; }
    panLiveAnim = true;
    var last = performance.now();
    var epoch = panEpoch;
    function step(t) {
      if (epoch !== panEpoch) { panLiveAnim = false; panAnim = 0; return; }
      var dt = Math.min(50, t - last);
      last = t;
      panMs += (0 - panMs) * Math.min(1, dt / 140);
      if (panMs < 40) { panMs = 0; panAnim = 0; panLiveAnim = false; return; }
      panAnim = requestAnimationFrame(step);
    }
    panAnim = requestAnimationFrame(step);
  }
  function panFollowStart() {
    // Pendant que le doigt glisse, la courbe rejoint la position du doigt en douceur (pas de saut).
    if (panFollow) return;
    stopPanAnim();
    panFollow = true;
    var last = performance.now();
    function step(t) {
      if (!panFollow) { panAnim = 0; return; }
      var dt = Math.min(50, t - last);
      last = t;
      panMs += (panTarget - panMs) * Math.min(1, dt / 70);
      panAnim = requestAnimationFrame(step);
    }
    panAnim = requestAnimationFrame(step);
  }
  function panGlide(v) {
    // Élan calme au lâcher (la courbe ralentit tranquillement), arrêt net aux deux bouts.
    stopPanAnim();
    var glideFrom = panMs;
    var last = performance.now();
    var epoch = panEpoch;
    function step(t) {
      if (epoch !== panEpoch) { panAnim = 0; return; }
      var dt = Math.min(50, t - last);
      last = t;
      var wallG = Math.max(panMaxMs, glideFrom);
      panMs += v * dt;
      v *= Math.pow(0.95, dt / 16.7);
      if (panMs <= 0) { panMs = 0; panAnim = 0; return; }
      if (panMs >= wallG && v > 0) { panMs = wallG; panAnim = 0; showHistLimit(); return; }
      if (Math.abs(v) < 0.005) { if (panMs < 40) panMs = 0; panAnim = 0; return; }
      panAnim = requestAnimationFrame(step);
    }
    panAnim = requestAnimationFrame(step);
  }
  function showHistLimit() {
    // Bref message quand on insiste au bout du passé : l'historique affiché est limité.
    var stage = document.getElementById('chart');
    if (!stage) return;
    if (!histMsgEl || !histMsgEl.isConnected) {
      histMsgEl = document.createElement('div');
      histMsgEl.className = 'chart-hist-msg';
      histMsgEl.setAttribute('aria-hidden', 'true');
      stage.appendChild(histMsgEl);
    }
    histMsgEl.textContent = '🔒 ' + tt('histLimit', 'Historique : 10 dernières min');
    histMsgEl.classList.add('on');
    clearTimeout(histMsgTimer);
    histMsgTimer = setTimeout(function () { if (histMsgEl) histMsgEl.classList.remove('on'); }, 1200);
  }

  function bindPinch() {
    // Les doigts sont écoutés sur le CADRE du graphique (#chart) : la zone de dessin est volontairement
    // rendue « transparente » aux doigts par app.js (pour ne jamais bloquer un bouton). css/app.css y
    // coupe les gestes du navigateur. Événements tactiles classiques, reconnus par tous les téléphones.
    //  - deux doigts : zoom élastique (continu, résiste aux limites, revient au cran le plus proche) ;
    //  - un doigt qui glisse : défile l'historique (droite = passé) en douceur, élan calme au lâcher ;
    //  - un doigt maintenu : croix (prix sous le doigt, carré O H L C et heure de la bougie) ;
    //  - un toucher sur la ligne d'un trade ouvert : sa carte.
    // Affichage uniquement : les prix, les trades et leur règlement ne sont pas concernés.
    var stage = document.getElementById('chart');
    if (!stage || stage.__oroPinch) return;
    stage.__oroPinch = true;
    var MIN = ZOOM_STEPS[0];
    var MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1];
    var easeTimer = 0;
    var mode = '';
    var pinch = null;
    var one = null;
    var holdTimer = 0;
    function elasticZoom(raw) {
      if (raw > MAX) return Math.min(MAX * 1.18, MAX + (raw - MAX) * 0.3);
      if (raw < MIN) return Math.max(MIN * 0.82, MIN - (MIN - raw) * 0.3);
      return raw;
    }
    function clampPan(raw, from) {
      // Mur net : au bout de l'historique la courbe ne bouge plus d'un millimètre (ni ressort, ni aspiration).
      var wall = Math.max(panMaxMs, from || 0);
      if (raw < 0) return 0;
      if (raw > wall) return wall;
      return raw;
    }
    // Sensibilité calme : un glissement de doigt déplace la courbe de moitié moins.
    function msPerPx() { return 0.5 * (xWin > 0 ? xWin : 28000) / Math.max(40, lastSeriesW || 200); }
    function zoomEnd() {
      if (pinchSec === null) return;
      var cur = pinchSec;
      var best = zoomIdx;
      var bd = Infinity;
      var i;
      for (i = 0; i < ZOOM_STEPS.length; i++) {
        var dd = Math.abs(Math.log(ZOOM_STEPS[i] / Math.max(1, cur)));
        if (dd < bd) { bd = dd; best = i; }
      }
      zoomIdx = best;
      pinchSec = null;
      zoomEase = 0.16;
      clearTimeout(easeTimer);
      easeTimer = setTimeout(function () { zoomEase = 0.38; }, 700);
      wantFitY = true;
      persistView(activeAsset);
    }
    function local(t) {
      var r = (canvas && canvas.getBoundingClientRect) ? canvas.getBoundingClientRect() : stage.getBoundingClientRect();
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    function crossOff() { clearTimeout(holdTimer); touchCross = null; }
    function dist(t) {
      var dx = t[0].clientX - t[1].clientX;
      var dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    function onButton(e) {
      var el = e.target;
      return !!(el && el.closest && el.closest('button, a, input, .chart-toolbar'));
    }
    stage.addEventListener('touchstart', function (e) {
      if (onButton(e)) { one = null; return; }
      if (e.touches.length >= 2) {
        one = null;
        crossOff();
        if (panFollow) stopPanAnim();
        mode = 'pinch';
        var d = dist(e.touches);
        if (d > 16) {
          clearTimeout(easeTimer);
          pinch = { dist: d, sec: pinchSec !== null ? pinchSec : (zoomSmooth || zoomSec()) };
          pinchSec = pinch.sec;
          zoomEase = 0.55;
        }
      } else if (e.touches.length === 1 && !mode) {
        var p = local(e.touches[0]);
        var nowT = performance.now();
        // Un doigt qui se pose arrête l'élan en cours (comme les grandes plateformes).
        if (panAnim) { stopPanAnim(); panEpoch++; }
        panLiveAnim = false;
        one = { x0: p.x, y0: p.y, t: nowT, ms: Math.max(0, panMs), lastX: p.x, lastT: nowT, v: 0, kind: '', warned: false };
        panDragRef = one;
        // Doigt maintenu sans bouger : la croix apparaît.
        clearTimeout(holdTimer);
        holdTimer = setTimeout(function () {
          if (one && !one.kind) { one.kind = 'cross'; touchCross = { x: one.x0, y: one.y0 }; }
        }, 260);
      }
    }, { passive: true });
    stage.addEventListener('touchmove', function (e) {
      if (mode === 'pinch' && pinch && e.touches.length >= 2) {
        var d = dist(e.touches);
        if (d > 0) pinchSec = elasticZoom(pinch.sec * pinch.dist / d);
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (!one || e.touches.length !== 1) return;
      var p = local(e.touches[0]);
      if (e.cancelable) e.preventDefault();
      if (one.kind === 'cross') { touchCross = { x: p.x, y: p.y }; return; }
      var dx = p.x - one.x0;
      if (!one.kind) {
        if (Math.abs(dx) < 8 && Math.abs(p.y - one.y0) < 8) return;
        if (Math.abs(dx) < Math.abs(p.y - one.y0)) { one.kind = 'none'; clearTimeout(holdTimer); return; }
        one.kind = 'pan';
        clearTimeout(holdTimer);
        tradeCard = null;
        // Départ à partir du point de décollage : pas de petit saut de 8 px.
        one.x0 = p.x;
        dx = 0;
      }
      if (one.kind !== 'pan') return;
      var now = performance.now();
      var k = msPerPx();
      var raw = one.ms + dx * k;
      if (raw > Math.max(panMaxMs, one.ms) + 0.02 * xWin && !one.warned) { one.warned = true; showHistLimit(); }
      panTarget = clampPan(raw, one.ms);
      panFollowStart();
      var dtm = Math.max(1, now - one.lastT);
      one.v = 0.7 * one.v + 0.3 * (((p.x - one.lastX) * k) / dtm);
      one.lastX = p.x;
      one.lastT = now;
    }, { passive: false });
    function onEnd(e) {
      if (mode === 'pinch') {
        if (e.touches.length < 2) { pinch = null; zoomEnd(); mode = e.touches.length ? 'wait' : ''; }
        return;
      }
      if (mode === 'wait') { if (!e.touches.length) mode = ''; return; }
      if (!one || e.touches.length) return;
      panDragRef = null;
      var kind = one.kind;
      crossOff();
      if (kind === 'pan') {
        // La courbe finit de rejoindre le doigt, puis l'élan (seulement si le doigt bougeait encore).
        panMs = panTarget;
        var v = (performance.now() - one.lastT) < 80 ? one.v : 0;
        if (Math.abs(v) > 0.02) panGlide(v);
        else { stopPanAnim(); if (panMs < 40) panMs = 0; }
      } else if (!kind && e.type === 'touchend' && performance.now() - one.t < 350) {
        // Toucher la ligne d'un trade ouvert : sa carte (mise, gain possible, temps restant).
        var hit = null;
        var hd = 16;
        var hi;
        for (hi = 0; hi < tradeHits.length; hi++) {
          var dd = Math.abs(tradeHits[hi].y - one.y0);
          if (dd < hd) { hd = dd; hit = tradeHits[hi].v; }
        }
        tradeCard = hit ? { v: hit, until: Date.now() + 6000 } : null;
      }
      one = null;
    }
    stage.addEventListener('touchend', onEnd, { passive: true });
    stage.addEventListener('touchcancel', onEnd, { passive: true });
    // Pavé tactile d'ordinateur : pincement = « molette + Ctrl ».
    var wheelTimer = 0;
    stage.addEventListener('wheel', function (e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      clearTimeout(easeTimer);
      var cur = pinchSec !== null ? pinchSec : zoomSec();
      pinchSec = elasticZoom(cur * Math.exp(Math.max(-60, Math.min(60, e.deltaY)) * 0.01));
      zoomEase = 0.55;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(zoomEnd, 180);
    }, { passive: false });
  }

  function bindTools() {
    try { bindPinch(); } catch (ePinch) { /* ignore */ }
    if (toolsBound) return;
    toolsBound = true;
    ensureToolbarExtras();
    var zin = document.getElementById('chartZoomIn');
    var zout = document.getElementById('chartZoomOut');
    var zreset = document.getElementById('chartReset');
    if (zin) zin.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (zoomIdx > 0) {
        zoomIdx -= 1;
        persistView(activeAsset);
        var stZin = ensureAssetState(activeAsset);
        if (!(stZin.lockUntil && Date.now() < stZin.lockUntil)) {
          viewMin = 0;
          viewMax = 0;
        }
        // Snap zoomSmooth pour réponse immédiate (surtout pendant un trade).
        zoomSmooth = zoomSec();
        if (isChartReady()) drawNow();
      }
    });
    if (zout) zout.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (zoomIdx < ZOOM_STEPS.length - 1) {
        zoomIdx += 1;
      }
      wantFitY = true;
      persistView(activeAsset);
      var stZout = ensureAssetState(activeAsset);
      if (stZout.lockMin && stZout.lockMax && stZout.lockUntil && Date.now() < stZout.lockUntil) {
        viewMin = stZout.lockMin;
        viewMax = stZout.lockMax;
      }
      zoomSmooth = zoomSec();
      if (isChartReady()) drawNow();
    });
    if (zreset) zreset.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      resetChartView();
    });
    document.querySelectorAll('.ind-btn[data-ind]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var key = btn.dataset.ind;
        if (key !== 'ma' && key !== 'bb' && key !== 'ema') return;
        inds[key] = !inds[key];
        persistView(activeAsset);
        syncIndButtons();
      });
    });
    syncIndButtons();
  }

  D6.Chart = {
    attach: function (el, callback) {
      try {
        if (!el || typeof el.getContext !== 'function') {
          try { console.warn('Mobile display fallback: chart canvas missing'); } catch (e0) { /* ignore */ }
          return;
        }
        canvas = el;
        ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          try { console.warn('Mobile display fallback: 2d context unavailable'); } catch (e1) { /* ignore */ }
          return;
        }
        overlay = document.getElementById('chartOverlay');
        if (!overlay && canvas.parentElement) {
          overlay = document.createElement('canvas');
          overlay.id = 'chartOverlay';
          overlay.className = 'chart-overlay';
          overlay.setAttribute('aria-hidden', 'true');
          canvas.parentElement.appendChild(overlay);
        }
        octx = overlay ? overlay.getContext('2d', { alpha: true }) : null;
        onFrame = callback;
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';
        canvas.style.opacity = '1';
        canvas.style.zIndex = '10';
        canvas.style.pointerEvents = 'none';
        canvas.style.touchAction = 'none';
        canvas.style.backgroundColor = '#0B0E14';
        canvas.style.background = '#0B0E14';
        if (overlay) {
          overlay.style.background = 'transparent';
          overlay.style.backgroundColor = 'transparent';
          overlay.style.zIndex = '20';
          overlay.style.pointerEvents = 'none';
        }
        if (canvas.parentElement) {
          canvas.parentElement.style.backgroundColor = '#0B0E14';
          canvas.parentElement.style.position = 'relative';
        }
        if (D6.Engine && D6.Engine.preloadAll) {
          try { D6.Engine.preloadAll(); } catch (ePre) { /* ignore */ }
        }
        try { resize(); drawNow(); } catch (eR) { try { console.warn('Mobile display fallback:', eR); } catch (e2) { /* ignore */ } }
        running = true;
        lastTs = 0;
        window.chartIsPaused = false;
        bindVisibilityFix();
        try {
          if (!window.__oroladoFsResizeBound) {
            window.__oroladoFsResizeBound = true;
            var fsObs = new MutationObserver(function () {
              try { resize(); } catch (eFs) { /* ignore */ }
              requestAnimationFrame(function () {
                try { resize(); } catch (eFs2) { /* ignore */ }
              });
            });
            fsObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            var fsOv = document.getElementById('fsTradeOverlay');
            if (fsOv) fsObs.observe(fsOv, { attributes: true, attributeFilter: ['class'] });
            document.addEventListener('fullscreenchange', function () {
              try { resize(); drawNow(); } catch (eFc) { /* ignore */ }
              requestAnimationFrame(function () {
                try { resize(); drawNow(); } catch (eFc2) { /* ignore */ }
              });
            });
          }
        } catch (eMo) { /* ignore */ }
        if (loopRaf) {
          try { cancelAnimationFrame(loopRaf); } catch (eLf) { /* ignore */ }
          loopRaf = 0;
        }
        loopRaf = requestAnimationFrame(loop);
        window.animationFrameId = loopRaf;
        ensureChartPulse();
        setTimeout(function () { try { resize(); drawNow(); } catch (e4) { /* ignore */ } }, 80);
        setTimeout(function () { try { resize(); drawNow(); } catch (e5) { /* ignore */ } }, 300);
        try { bindTools(); } catch (eT) { try { console.warn(eT); } catch (e6) { /* ignore */ } }
        window.addEventListener('resize', function () {
          scheduleResize(0);
        });
        window.addEventListener('orientationchange', function () {
          scheduleResize(120);
        });
        // Android : quand la barre de Chrome se cache / revient, le terminal (fixé en bas) bouge mais la
        // courbe gardait son ancienne hauteur → elle passait SOUS le terminal (la tête « descendait »)
        // ou laissait un creux, selon l'actualisation. Chaque seconde : si le bas de la courbe ne touche
        // plus le haut du terminal, on la réajuste.
        var androidGapTried = null;
        if (IS_ANDROID_CHART) {
          setInterval(function () {
            try {
              if (document.hidden || fsActive) return;
              var aPad = document.querySelector('#screenTrade .pad');
              var aCard = document.getElementById('chart');
              if (!aPad || !aCard || window.getComputedStyle(aPad).position !== 'fixed') return;
              var gap = Math.round(aPad.getBoundingClientRect().top - aCard.getBoundingClientRect().bottom);
              // Pas de réessai en boucle si le même écart persiste (rien de plus à faire).
              if (Math.abs(gap) > 2 && gap !== androidGapTried) { androidGapTried = gap; lastGeomKey = ''; resize(true); }
              else if (Math.abs(gap) <= 2) androidGapTried = null;
            } catch (eAg) { /* ignore */ }
          }, 1000);
        }
        if (window.visualViewport) {
          try {
            visualViewport.addEventListener('resize', function () {
              scheduleResize(0);
            });
          } catch (eVv) { try { console.warn('Mobile display fallback:', eVv); } catch (e10) { /* ignore */ } }
        }
        if (window.ResizeObserver && canvas.parentElement) {
          try {
            var ro = new ResizeObserver(function () {
              scheduleResize(0);
            });
            ro.observe(canvas.parentElement);
            var chartCard = document.getElementById('chart');
            if (chartCard) ro.observe(chartCard);
            var fsSlot = document.getElementById('fsTradeSlot');
            if (fsSlot) ro.observe(fsSlot);
            var fsOverlay = document.getElementById('fsTradeOverlay');
            if (fsOverlay) ro.observe(fsOverlay);
          } catch (eRo) { try { console.warn('Mobile display fallback:', eRo); } catch (e12) { /* ignore */ } }
        }
      } catch (err) {
        try { console.warn('Mobile display fallback:', err); } catch (e13) { /* ignore */ }
      }
    },
    lastClose: function () { return lastDrawnClose; },
    lastAsset: function () { return activeAsset; },
    steerClose: steerClose,
    setAsset: function (id) {
      if (id === 'boom300' || id === 'pulseai') id = 'titanpulse';
      if (!D6.CONFIG.ASSETS[id]) id = 'v100';
      if (id === activeAsset) {
        if (isChartReady()) drawNow();
        return;
      }
      persistView(activeAsset);
      activeAsset = id;
      applyAssetView(id);
      if (headPriceMotion[id]) headPriceMotion[id].value = NaN;
      viewMin = 0;
      viewMax = 0;
      wantFitY = true;
      pendingYAnchor = null;
      if (steer && steer.assetId !== id) steer = null;
      var liveBuf = liveBuffer(id);
      var st = ensureAssetState(id);
      // Nouveau cadre à chaque switch (évite un vieux mid figé hors route).
      if (!(st.lockUntil && Date.now() < st.lockUntil && st.lockMax > st.lockMin)) {
        st.viewMin = 0;
        st.viewMax = 0;
        st.lockMin = 0;
        st.lockMax = 0;
      }
      if ((!liveBuf || !liveBuf.candles || liveBuf.candles.length < 40) && D6.Engine) {
        if (D6.Engine.getBuffer) D6.Engine.getBuffer(id);
        else if (D6.Engine.getMarket) D6.Engine.getMarket(id);
        liveBuf = liveBuffer(id);
      }
      if (liveBuf && isFinite(liveBuf.price) && liveBuf.price > 0) {
        lastDrawnClose = liveBuf.price;
        st.lastPrice = liveBuf.price;
      }
      if (st.lockMin && st.lockMax && st.lockUntil > Date.now()) {
        viewMin = st.lockMin;
        viewMax = st.lockMax;
        strikeLock = { assetId: id, min: st.lockMin, max: st.lockMax, entry: null, ey: null };
      } else {
        strikeLock = null;
      }
      if (isFinite(st.lastPrice) && st.lastPrice > 0) lastDrawnClose = st.lastPrice;
      if (D6.Engine && D6.Engine.getMarket) D6.Engine.getMarket(id);
      if (D6.Engine && D6.Engine.getTrades) {
        D6.Engine.getTrades(viewMode()).forEach(function (t) {
          var snap = snapshotTradeVisual(t);
          if (!snap) return;
          if (snap.mode && snap.mode !== viewMode()) return;
          openTradeVisuals[snap.id] = snap;
        });
      }
      if (isChartReady()) drawNow();
      if (running && !loopRaf) {
        lastTs = 0;
        loopRaf = requestAnimationFrame(loop);
        ensureChartPulse();
      }
    },
    start: function () {
      running = true;
      lastTs = 0;
      try { drawNow(); } catch (eFirst) { /* ignore */ }
      if (loopRaf) {
        try { cancelAnimationFrame(loopRaf); } catch (eSt) { /* ignore */ }
        loopRaf = 0;
      }
      loopRaf = requestAnimationFrame(function (ts) {
        try { flushOpenTradeVisualQueue(); } catch (eF) { /* ignore */ }
        loop(ts);
      });
      ensureChartPulse();
    },
    stop: function () {
      running = false;
      cancelChartRafs();
      if (chartTickTimer) {
        try { clearInterval(chartTickTimer); } catch (eStop) { /* ignore */ }
        chartTickTimer = 0;
      }
    },
    resize: resize,
    applyOpenTradeVisual: applyOpenTradeVisual,
    /** Contrôle : position du dernier rond de trade et de la boule du direct (pixels). */
    markDebug: function () { return { ride: rideDbg, mark: lastEntryMarkX, markY: lastEntryMarkY, markR: lastEntryMarkR, head: lastMap ? lastMap.lastX : NaN, zoom: zoomSec(), count: lastMap ? lastMap.count : 0, lo: viewMin, hi: viewMax, price: lastDrawnClose }; },
    captureTradeFrame: captureTradeFrame,
    removeTradeVisual: removeTradeVisual,
    syncAccountMode: syncAccountMode,
    drawNow: drawNow,
    flushOpenTradeVisuals: flushOpenTradeVisualQueue
  };

  function autoBootChart() {
    try {
      var el = document.getElementById('chartCanvas');
      if (el) D6.Chart.attach(el);
      D6.Chart.start();
    } catch (eBoot) { /* ignore */ }
  }
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoBootChart);
    } else {
      autoBootChart();
    }
  } catch (eAuto) { /* ignore */ }
})(window.D6 = window.D6 || {});
