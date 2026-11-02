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
    // Marchés ajoutés (js/indices.js) : zoom de départ choisi pour chacun.
    var ax = D6.CONFIG && D6.CONFIG.ASSETS && D6.CONFIG.ASSETS[id];
    if (ax && ax.ext && isFinite(ax.zoomIdx)) return Math.max(0, Math.min(ZOOM_STEPS.length - 1, Number(ax.zoomIdx)));
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
  // v2488 : heures du bas, redessinées après le fondu du bas de la courbe (voir fadeChartBottom).
  var timeLabelsQ = [];
  var fadeRGB = '15,14,41';
  var fadeSampleAt = 0;
  var fadeSampleN = 0;
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
    // v2612 (propriétaire, AZAZEL « vibre ») : plus de suivi plus rapide à la baisse pour AZAZEL (reste de
    // l'ancien Crash à pics) — montée et descente glissent à la même vitesse que les autres marchés.
    var lerp = 1 - Math.pow(0.94, dt / (1000 / 60));
    state.value += (target - state.value) * lerp;
    if (Math.abs(target - state.value) < target * 0.000002) state.value = target;
    state.lastFrame = frameNow;
    return state.value;
  }

  // v2612 — AZAZEL : couleur de la colonne en cours fixée pour toute sa seconde (sens du 1er mouvement),
  // au lieu de changer orange / rouge à chaque prix. La colonne terminée prend sa vraie couleur.
  var emberLock = { t: null, up: null, prevUp: true, cur: true };
  function emberUp(c) {
    if (c.t !== emberLock.t) {
      if (emberLock.up !== null) emberLock.prevUp = emberLock.up;
      emberLock.t = c.t;
      emberLock.up = null;
    }
    if (emberLock.up === null && c.c !== c.o) emberLock.up = c.c > c.o;
    emberLock.raw = c.c >= c.o; // couleur qu'aurait prise l'ancien dessin (mesure seulement)
    emberLock.cur = emberLock.up === null ? emberLock.prevUp : emberLock.up;
    return emberLock.cur;
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

    // v2549 — PLEIN ÉCRAN : définition plafonnée à 2× (iPhone = 3×) : la courbe y est 2,3 fois plus grande, et à 3×
    // l'iPhone devait redessiner ~4,6 millions de points par image (courbe + calque) → accrocs. Dessin seulement.
    // v2554 — plafond 2× partout (écran normal compris) : mesuré sur iPhone 3× (?diag=1) écran normal 11 img/s → trop de points.
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    // v2559 — téléphone en mode léger : 1,5× (44 % de points en moins à envoyer à l'écran, presque invisible à l'œil).
    // v2574 : téléphone en mode léger (lent) → courbe en ×1 (2,25 fois moins de points à dessiner qu'en ×1,5).
    // v2582 (propriétaire) : en ×1 les bougies, perles, pyramides… devenaient floues et les couleurs « fades » (un rouge
    // qui n'est plus vraiment rouge). Retour à ×1,5 : couleurs nettes et franches, toujours 44 % de points en moins qu'en ×2.
    // (Les halos / fausses lueurs des v2579-v2581 sont retirés à sa demande : couleur pure, sans rien autour.)
    if (IS_MOBILE_CHART && D6.lite) dpr = 1.5;
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

  // v2569 (fluidité) : largeur de l'écran gardée en mémoire ; lire window.innerWidth à chaque image
  // pouvait forcer le recalcul de toute la page (mesuré : jusqu'à 342 ms sur 10 s, téléphone simulé).
  var winWCache = window.innerWidth || 0;
  window.addEventListener('resize', function () { winWCache = window.innerWidth || 0; }, { passive: true });
  window.addEventListener('orientationchange', function () { setTimeout(function () { winWCache = window.innerWidth || 0; }, 300); }, { passive: true });
  var backdropCoinsOk = false; // v2569 : une fois toutes chargées, plus besoin de revérifier à chaque image
  function backdropCoinsReady() {
    // v3224 (propriétaire) : plus AUCUN logo crypto dans le fond → inutile de précharger les
    // 27 icônes. Le fond se construit tout de suite, plus léger.
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
    // v3229 (propriétaire) : on REMET la spirale centrale (il l'avait demandée en « plus léger »,
    // pas retirée). Fond calme : petits anneaux blancs sur les planètes + une spirale douce au
    // centre. Toujours AUCUN logo crypto. Spirale un peu plus légère qu'avant.
    function lightRing(x, y, rr) {
      g.save();
      g.globalAlpha = 0.08;
      g.strokeStyle = 'rgba(255,255,255,0.9)';
      g.lineWidth = Math.max(0.8, rr * 0.08);
      g.beginPath();
      g.ellipse(x, y, rr * 1.8, rr * 0.5, -0.15, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    function halo(x, y, r, col) {
      var rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    var i;
    for (i = 0; i < planets.length; i++) { if (planets[i]) lightRing(planets[i].x, planets[i].y, planets[i].r); }
    // Spirale ronde au centre, légère et immobile (dessinée une fois dans le décor fixe).
    var cx = cssW * 0.5, cy = cssH * 0.5;
    var R = Math.min(cssW * 0.30, cssH * 0.40);
    function spiral(arm, t) {
      var ang = arm * Math.PI + t * Math.PI * 2 * GALAXY_TURNS;
      var rad = R * (0.05 + 0.95 * t);
      return { x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad };
    }
    halo(cx, cy, R * 1.05, 'rgba(231,188,104,0.032)');
    halo(cx, cy, R * 0.45, 'rgba(210,165,80,0.032)');
    var arm, t, q;
    for (arm = 0; arm < 2; arm++) {
      g.save();
      g.lineCap = 'round';
      for (q = 0; q < 2; q++) {
        g.strokeStyle = q ? 'rgba(243,223,182,0.028)' : 'rgba(232,192,113,0.022)';
        g.lineWidth = q ? Math.max(2, R * 0.05) : Math.max(5, R * 0.13);
        g.beginPath();
        for (t = 0; t <= 1.0001; t += 0.01) { var pp = spiral(arm, t); if (t === 0) g.moveTo(pp.x, pp.y); else g.lineTo(pp.x, pp.y); }
        g.stroke();
      }
      g.restore();
      for (t = 0.02; t < 1; t += 0.004) {
        var sp = spiral(arm, t);
        var jx = (rnd() - 0.5) * R * 0.07, jy = (rnd() - 0.5) * R * 0.07;
        g.fillStyle = 'rgba(' + (rnd() < 0.3 ? '255,220,170' : '210,200,255') + ',' + (0.05 + t * 0.07).toFixed(2) + ')';
        g.beginPath(); g.arc(sp.x + jx, sp.y + jy, 0.4 + rnd() * 0.8, 0, Math.PI * 2); g.fill();
      }
    }
    halo(cx, cy, R * 0.26, 'rgba(255,200,110,0.06)');
    halo(cx, cy, R * 0.11, 'rgba(255,240,210,0.06)');
    // v3232 (propriétaire) : plus de cercle autour de la spirale (il n'avait demandé que la pyramide).
    galaxy = null;
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
      var a = 0.22 * t + 0.03;
      if (u < 0.06) a *= u / 0.06;
      if (u > 0.85) a *= (1 - u) / 0.15;
      ctx.globalAlpha = a;
      ctx.drawImage(im, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  // v2390 (propriétaire) : PARALLAXE. Une couche d'étoiles fines qui dérive lentement vers la gauche
  // (~8 fois moins vite que la grille), par-dessus le fond fixe → profondeur. Les planètes et la spirale
  // restent à leur place (placées pour ne jamais toucher la tête ni les prix). Décor seulement.
  var driftStars = null;
  function drawStarDrift() {
    if (!driftStars) {
      var sd = 91, arr = [], i;
      // v2585 (propriétaire) : le nombre d'avant (48), mais une étoile par case d'une grille 8 × 6 (légèrement
      // décalée) : réparties partout, jamais collées.
      for (i = 0; i < 48; i++) {
        sd = (sd * 16807) % 2147483647; var rx = ((i % 8) + 0.15 + 0.7 * (sd - 1) / 2147483646) / 8;
        sd = (sd * 16807) % 2147483647; var ry = (Math.floor(i / 8) + 0.15 + 0.7 * (sd - 1) / 2147483646) / 6;
        sd = (sd * 16807) % 2147483647; var rs = (sd - 1) / 2147483646;
        arr.push({ x: rx, y: ry, r: 0.45 + rs * 0.9, a: 0.25 + rs * 0.45 });
      }
      driftStars = arr;
    }
    var speed = 1.15 * Math.max(0.6, cssW / 375);
    var off = ((Date.now() / 1000) * speed) % Math.max(1, cssW);
    var k;
    for (k = 0; k < driftStars.length; k++) {
      var s = driftStars[k];
      var x = ((s.x * cssW - off) % cssW + cssW) % cssW;
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, s.y * cssH, s.r, 0, Math.PI * 2);
      ctx.fill();
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
    base.addColorStop(0, '#100E0A');
    base.addColorStop(1, '#090806');
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
    glow(cssW * 0.06, cssH * 0.04, big * 0.6, 'rgba(200,145,46,0.05)');
    // (Ancien halo orange en bas à droite retiré : le propriétaire voyait une « lueur jaune » près des prix.)
    glow(cssW * 0.96, cssH * 0.94, big * 0.55, 'rgba(160,115,40,0.025)');
    glow(pad.l + w * 0.5, pad.t + h * 0.55, small * 0.85, 'rgba(180,135,48,0.025)');
    // Étoiles : tirage fixe (toujours au même endroit), petites et discrètes.
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    // v2580 : ~30 % d'étoiles fixes en moins ; v2584 (propriétaire) : quelques-unes remises (dessinées une seule fois
    // dans le décor fixe, elles ne coûtent rien à chaque image), toujours réparties partout.
    // v2585 (propriétaire) : même nombre d'étoiles qu'avant la v2580, mais réparties sur la grille (coins compris).
    var nStars = Math.round(cssW * cssH / 2400);
    var k;
    // v2583 (propriétaire) : étoiles RÉPARTIES partout (une par case d'une grille, légèrement décalée) : plus de coin
    // vide (haut à gauche…) ni d'étoiles collées ; même nombre qu'avant.
    var gCols = Math.max(1, Math.round(Math.sqrt(nStars * cssW / Math.max(1, cssH))));
    var gRows = Math.max(1, Math.ceil(nStars / gCols));
    var cellW = cssW / gCols, cellH = cssH / gRows;
    for (k = 0; k < gCols * gRows; k++) {
      var sx = ((k % gCols) + 0.2 + rnd() * 0.6) * cellW;
      var sy = (Math.floor(k / gCols) + 0.2 + rnd() * 0.6) * cellH;
      var sr = rnd() * 1.05 + 0.25;
      var sa = rnd() * 0.5 + 0.12;
      // (v2501 retirait 2 étoiles sur 3 en bas à droite parce qu'elles étaient collées ; v2585 : la grille les sépare
      // déjà, donc ce coin garde ses étoiles, comme les autres — demande du propriétaire.)
      g.fillStyle = 'rgba(255,255,255,' + sa.toFixed(2) + ')';
      g.beginPath();
      g.arc(sx, sy, sr, 0, Math.PI * 2);
      g.fill();
    }
    // Quelques étoiles brillantes en croix.
    // v2583 (propriétaire) : les étoiles brillantes aux 4 coins + 2 au milieu, bien séparées (avant : au hasard, coins vides).
    var crossAt = [[0.06, 0.07], [0.62, 0.05], [0.05, 0.93], [0.70, 0.93], [0.30, 0.42], [0.55, 0.62]];
    for (k = 0; k < crossAt.length; k++) {
      var bx = pad.l + crossAt[k][0] * w + (rnd() - 0.5) * 8;
      var by = pad.t + crossAt[k][1] * h + (rnd() - 0.5) * 8;
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
    // v3224/v3227 (propriétaire) : fond ALLÉGÉ, 5 planètes. v3227 : placement ASYMÉTRIQUE et stylé
    // (avant elles formaient un carré, trop rigide). Réparties dans les zones calmes — au-dessus et
    // en dessous de la trajectoire de la courbe, hors de la tête (~55-65 % de la largeur) et de la
    // colonne des prix — avec des tailles variées. Discrètes mais présentes ; chacune reçoit un
    // petit anneau blanc (cryptoWorld). Jamais alignées : rien qui gêne le trading ou laisse croire
    // que la courbe n'avance pas.
    // v3233 (propriétaire) : PYRAMIDE RENVERSÉE bien droite et SYMÉTRIQUE, centrée sur le VRAI centre
    // de l'écran (cssW/2 = centre de la spirale), pas sur le centre des bougies (qui est décalé à gauche
    // par la colonne des prix → ça paraissait penché). Celle du bas pile au centre, les 2 du haut
    // symétriques, même taille, un peu plus grandes, et le bas moins serré.
    var planets = [
      { x: cssW * 0.180, y: pad.t + h * 0.155, r: pr * 0.165 },
      { x: cssW * 0.820, y: pad.t + h * 0.155, r: pr * 0.165 },
      { x: cssW * 0.500, y: pad.t + h * 0.920, r: pr * 0.165 }
    ];
    // v3236 (propriétaire) : intensité des planètes RÉDUITE (plus discrètes, relax) — on sent que
    // ce sont des planètes mais sans qu'elles accrochent l'œil. Bas remonté d'un chouïa.
    planet(planets[0].x, planets[0].y, planets[0].r, '#FFE2B8', 'rgba(226,132,46,1)', '#4A1C06', 0.15, false);
    planet(planets[1].x, planets[1].y, planets[1].r, '#FFEAC2', 'rgba(210,155,55,1)', '#3A2606', 0.16, false);
    planet(planets[2].x, planets[2].y, planets[2].r, '#C8FFF4', 'rgba(20,184,166,1)', '#03312C', 0.15, false);
    g.globalAlpha = 1;
    galaxy = null;
    try { cryptoWorld(g, pad, w, h, planets, planet, rnd, small, pr); } catch (eCw) { galaxy = null; }
    g.globalAlpha = 1;
    bgCanvas = c;
  }

  function drawBackdrop(pad, w, h) {
    // v2570 — lien de test « ?test=decor » seulement : fond uni, sans planètes / galaxie / pièces (pour mesurer).
    if (D6.testDecor) { ctx.fillStyle = '#382A0F'; ctx.fillRect(0, 0, cssW, cssH); return; }
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
      // v2580 — mode léger (téléphone lent, enregistrement d'écran) : les petits logos et étoiles qui glissent
      // ne sont plus dessinés (moins de travail à chaque image) ; le décor fixe reste.
      if (!(D6.lite || fsSkip.heavy)) {
        try { drawGalaxy(); } catch (eGal) { galaxy = null; }
        try { drawStarDrift(); } catch (eStar) { /* décor seulement */ }
      }
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
        priceTxt: '#8C7E5C',
        timeTxt: '#8C7E5C',
        watermark: 'rgba(255,215,0,0.028)',
        rsiBg: 'rgba(8,12,22,0.72)',
        rsiBorder: 'rgba(255,215,0,0.12)',
        rsiTxt: 'rgba(196,188,160,0.85)',
        maFast: 'rgba(255,213,79,0.95)',
        maSlow: 'rgba(182,131,30,0.9)',
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
      priceTxt: '#8C7E5C',
      timeTxt: '#8C7E5C',
      watermark: 'rgba(255,215,0,0.028)',
      rsiBg: 'rgba(8,12,22,0.72)',
      rsiBorder: 'rgba(255,215,0,0.12)',
      rsiTxt: 'rgba(196,188,160,0.85)',
      maFast: 'rgba(255,213,79,0.95)',
      maSlow: 'rgba(182,131,30,0.9)',
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
    timeLabelsQ.length = 0;
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
    // v2378 (comme IQ Option) : lignes de prix posées sur des PRIX RONDS (ex. 9700.00, 9705.00…) ; elles
    // glissent en haut / en bas avec la courbe. Pas « rond » (1, 2, 5 × 10ⁿ) choisi pour ~1 carreau.
    var pSpan = Math.max(1e-9, maxP - minP);
    var perPx = pSpan / Math.max(1, h);
    var rawStep = perPx * cellPx;
    var mag = Math.pow(10, Math.floor(Math.log(rawStep) / Math.LN10));
    var fr = rawStep / mag;
    var pStep = (fr < 1.5 ? 1 : fr < 3.5 ? 2 : fr < 7.5 ? 5 : 10) * mag;
    var pTop = maxP + (pad.t / Math.max(1, h)) * pSpan;
    var pBot = maxP - ((cssH - pad.t) / Math.max(1, h)) * pSpan;
    var pFirst = Math.ceil(pBot / pStep) * pStep;
    var priceLines = [];
    for (i = 0; i < 40; i++) {
      var pv = pFirst + i * pStep;
      if (pv > pTop) break;
      priceLines.push(pv);
    }
    for (i = 0; i < priceLines.length; i++) {
      var pVal = priceLines[i];
      var y = Math.round(pad.t + ((maxP - pVal) / pSpan) * h) + 0.5;
      // v2484 — pas de ligne de prix collée au-dessus des heures (elle faisait un « trait » en bas de la courbe).
      if (y < 6 || y > cssH - 30) continue;
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
      ctx.fillStyle = '#8C7E5C';
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
    // v2378 : le pas de temps est un pas ROND (5 s, 10 s, 15 s, 30 s, 1 min…) le plus proche de la taille
    // de carreau voulue → les heures écrites en bas tombent juste (10:32:00, 10:32:05…), comme IQ Option.
    if (pxSec > 0 && isFinite(xNow) && xNow > 0) {
      var k = gridNiceIndex(gridCellSeconds(sW));
      while (GRID_NICE_SEC[k] * pxSec < cellPx * 0.62 && k < GRID_NICE_SEC.length - 1) k++;
      while (GRID_NICE_SEC[k] * pxSec > cellPx * 1.8 && k > 0) k--;
      var S = GRID_NICE_SEC[k];
      var stepMs = S * 1000;
      // v2379 (comme IQ Option) : un trait PRINCIPAL toutes les M secondes rondes (≈ 3 carreaux), plus
      // large avec une ombre douce de chaque côté ; les heures ne sont écrites que sous lui ; la bande
      // du bas (heures) reste libre de tout trait.
      var M = gridMajorSec(S);
      var majorMs = M * 1000;
      var tLeft = xNow - (headX / pxSec) * 1000;
      var tRight = xNow + ((cssW - headX) / pxSec) * 1000;
      var T0 = Math.floor(tLeft / stepMs) * stepMs;
      var T, guard;
      var lineBot = cssH - 16;
      // v2390 (propriétaire, choix de l'ancienne grille v2379 + ses 3 consignes) :
      // 1) UN SEUL SENS : tous les traits défilent de la droite vers la gauche, au rythme des bougies ;
      // 2) DÉGRADÉ DE PROFONDEUR : à droite (tête, là où naissent les bougies) les traits sont bien visibles
      //    et blancs ; plus ils partent vers la gauche (le passé), plus ils deviennent fins et transparents ;
      // 3) parallaxe : les étoiles qui dérivent lentement sont dessinées dans drawStarDrift (fond).
      var priceColL0 = cssW - PRICE_AXIS_GAP - 46;
      // v2392 (propriétaire) : couleur plus douce pour tous (celle du « 4e trait » d'avant) et l'effacement ne
      // commence qu'un carreau à gauche de la tête, plus progressivement.
      var fadeFrom = headX - Math.max(24, S * pxSec);
      function depth(x) { return x >= fadeFrom ? 1 : Math.max(0.3, Math.pow(Math.max(0, x) / Math.max(1, fadeFrom), 0.9)); }
      // v2391 : tous les traits SE RESSEMBLENT (plus de trait principal plus large ni d'ombre) ; seul le
      // dégradé de profondeur change leur intensité selon leur place.
      for (T = T0, guard = 0; T <= tRight + stepMs && guard < 120; T += stepMs, guard++) {
        var gx = Math.round(headX + ((T - xNow) / 1000) * pxSec) + 0.5;
        if (gx < 0 || gx > cssW) continue;
        var dp = depth(gx);
        ctx.lineWidth = 0.55 + 0.35 * dp;
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.065 * dp).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, lineBot);
        ctx.stroke();
      }
      var M0 = Math.floor(tLeft / majorMs) * majorMs;
      ctx.lineWidth = 1;
      // Heures en bas, seulement sous les traits principaux ; jamais sous la colonne des prix.
      ctx.font = (cssW < 500 ? '500 8.5px ' : '500 9px ') + '"Plus Jakarta Sans", "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#8C7E5C';
      ctx.textAlign = 'center';
      var priceColL = cssW - PRICE_AXIS_GAP - 46;
      timeLabelsQ.length = 0;
      for (T = M0, guard = 0; T <= tRight + majorMs && guard < 40; T += majorMs, guard++) {
        var lx = headX + ((T - xNow) / 1000) * pxSec;
        if (lx < 24 || lx > priceColL) continue;
        ctx.fillText(gridClock(T, M), lx, cssH - (padTopRGB ? 9 : 5));
        timeLabelsQ.push(gridClock(T, M), lx);
      }
    }
  }

  var GRID_NICE_SEC = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
  function gridNiceIndex(s) {
    var best = 0, bd = Infinity, i;
    for (i = 0; i < GRID_NICE_SEC.length; i++) {
      var d = Math.abs(Math.log(GRID_NICE_SEC[i] / Math.max(0.01, s)));
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  // Trait principal : le plus petit pas rond qui fait au moins 3 carreaux et tombe juste sur eux.
  function gridMajorSec(S) {
    var i;
    for (i = 0; i < GRID_NICE_SEC.length; i++) {
      var m = GRID_NICE_SEC[i];
      if (m >= S * 3 && m % S === 0) return m;
    }
    return S * 4;
  }
  function gridClock(t, S) {
    var d = new Date(t);
    function z(n) { return (n < 10 ? '0' : '') + n; }
    return z(d.getHours()) + ':' + z(d.getMinutes()) + (S < 60 ? ':' + z(d.getSeconds()) : '');
  }

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
    // Marchés ajoutés : corps fin, normal ou large.
    if (opts.body === 'thin') maxBody = 3.2;
    else if (opts.body === 'wide') maxBody = 12;
    else if (opts.body === 'normal') maxBody = 7;
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
      if (opts.pal) col = up ? opts.pal.up : opts.pal.dn;
      if (opts.nexusCyber) col = up ? '#DB9E24' : '#B7841E';
      if (opts.v75Rose) col = up ? '#E0001B' : '#7A000C';
      if (opts.apexAiry) col = up ? '#EDCF93' : '#E1AD46';
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
        ctx.shadowColor = up ? 'rgba(219,158,36,0.55)' : 'rgba(183,132,30,0.4)';
        ctx.shadowBlur = 8;
      } else if (opts.horizonOrange && i === candles.length - 1) {
        ctx.shadowColor = 'rgba(255,152,0,0.5)';
        ctx.shadowBlur = 9;
      } else if (!thin && i === candles.length - 1 && cssH >= 200 && !opts.v75Rose &&
        !opts.titanWhite && !opts.horizonOrange) {
        ctx.shadowColor = opts.pal ? palRgba(col, 0.55) : (opts.apexAiry ? 'rgba(224,168,60,0.7)' : (up ? 'rgba(0,230,118,0.45)' : 'rgba(255,23,68,0.4)'));
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
      } else if (opts.pal && !up && opts.body === 'wide') {
        // Marché ajouté, corps large : baisse en creux (contour), hausse pleine.
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.3;
        ctx.strokeRect(x - cw / 2 + 0.65, y1 + 0.65, Math.max(1, cw - 1.3), Math.max(1, bh - 1.3));
      } else if (opts.apexAiry) {
        // ORO 888 : corps violet plein, liseré clair en haut (effet bijou).
        ctx.fillStyle = col;
        ctx.fillRect(x - cw / 2, y1, cw, bh);
        ctx.fillStyle = up ? 'rgba(248,240,220,0.85)' : 'rgba(230,208,150,0.55)';
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
  // Marchés ajoutés : même dessin (perles, braises, cristaux, barres), avec LEURS couleurs.
  var STYLED_PAL = {};
  (function () {
    var all = (D6.CONFIG && D6.CONFIG.ASSETS) || {};
    Object.keys(all).forEach(function (id) {
      var a = all[id];
      if (!a || !a.ext || a.chart !== 'candle' || !a.styled) return;
      if (['pearls', 'embers', 'crystals', 'bars'].indexOf(a.styled) < 0) return;
      STYLED_ASSETS[id] = a.styled;
      STYLED_PAL[id] = a.candlePal || null;
    });
  })();
  function palRgba(hex, al) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return 'rgba(255,255,255,' + al + ')';
    var n = parseInt(m[1], 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + al + ')';
  }

  function drawStyledCandles(pad, w, h, candles, minP, maxP, style, pal) {
    if (!candles || candles.length < 2) return null;
    // pal = { up, dn } : couleurs d'un marché ajouté ; sans pal, couleurs d'origine (inchangées).
    var PU = pal && pal.up, PD = pal && pal.dn;
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
      // v2583 (propriétaire) : BAAL plus visible, sans lueur : fil plus épais et plus clair, perles un peu plus
      // grosses et plus vives, fin contour clair (on ne les confond plus avec les bulles du décor).
      ctx.strokeStyle = PU ? palRgba(PU, 0.7) : 'rgba(244,226,190,0.78)';
      ctx.lineWidth = 2 * sizeK();
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        x = toX(i);
        if (i === 0) ctx.moveTo(x, toY(candles[i].c)); else ctx.lineTo(x, toY(candles[i].c));
      }
      ctx.stroke();
      var rMax = Math.max(3.4, Math.min(9.5 * sizeK(), slot * 0.5));
      for (i = 0; i < n; i++) {
        c = candles[i];
        up = c.c >= c.o;
        x = toX(i);
        var y = toY(c.c);
        var move = Math.abs(toY(c.o) - y);
        var r = Math.max(3.2, Math.min(rMax, 3.2 + move * 0.35));
        if (i === last && cssH >= 200) {
          ctx.shadowColor = PU ? palRgba(PU, 0.85) : 'rgba(224,168,60,0.85)';
          ctx.shadowBlur = 12;
        }
        ctx.fillStyle = up ? (PU || '#EFD39B') : (PD || '#E6BB64');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = up ? 'rgba(250,240,255,0.85)' : 'rgba(248,236,211,0.6)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.fillStyle = up ? 'rgba(250,245,255,0.85)' : 'rgba(249,239,219,0.6)';
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
      // v2488 (propriétaire) : les colonnes s'arrêtent AU-DESSUS de la ligne des heures et s'effacent
      // doucement vers le bas (plus de trait net au bas de la courbe, les heures ne sont plus cachées).
      var bot = Math.max(pad.t + 20, (cssH || (pad.t + h)) - 12);
      // v2813 (propriétaire : AZAZEL « vibre », « flashs de lumière ») : les colonnes étaient des blocs
      // pleins orange / rouge de toute la hauteur qui défilaient (effet stroboscope), et la colonne en
      // cours changeait de couleur. Maintenant : braise vive en HAUT de chaque colonne, corps qui s'éteint
      // vers le sol (dégradé attaché à la colonne elle-même), colonnes un peu plus fines (plus d'air), et la
      // colonne en cours reste couleur « braise blanche » neutre jusqu'à la fin de sa seconde (une seule
      // prise de couleur, plus de clignotement). Même identité : des colonnes de braise qui sortent du sol.
      // v2835 (propriétaire : « AZAZEL / PHOENIX : c'est noir, flou, on ne voit rien ; garde l'idée, change les couleurs ») :
      // colonnes NETTES et lumineuses (dégradé doux sur toute la hauteur, jamais noir) coiffées d'une perle brillante au prix.
      // AZAZEL : menthe (hausse) / rose (baisse) ; PHOENIX (pal) : or / bleu. La colonne en cours reste blanche.
      var cU = PU || '#5EF2C6';
      var cD = PD || '#FF5C8A';
      var cN = '#F8FAFC';
      function colGrad(hex, a0, a1) {
        var g = ctx.createLinearGradient(0, pad.t, 0, bot);
        g.addColorStop(0, palRgba(hex, a0));
        g.addColorStop(1, palRgba(hex, a1));
        return g;
      }
      var gUp = colGrad(cU, 0.62, 0.14);
      var gDn = colGrad(cD, 0.62, 0.14);
      var gNe = colGrad(cN, 0.55, 0.12);
      var cwE = Math.max(1.5, Math.min(8 * sizeK(), slot * 0.5));
      var orbR = Math.max(1.8, Math.min(5.5, cwE * 0.72));
      for (i = 0; i < n; i++) {
        c = candles[i];
        var forming = i === last;
        up = c.c >= c.o;
        x = toX(i);
        var top = Math.max(pad.t + orbR, Math.min(bot, toY(c.c)));
        var col = forming ? cN : (up ? cU : cD);
        ctx.fillStyle = forming ? gNe : (up ? gUp : gDn);
        ctx.fillRect(x - cwE / 2, top, cwE, Math.max(0, bot - top));
        // perle du prix : couleur pleine, petit reflet blanc
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, top, orbR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(x - orbR * 0.3, top - orbR * 0.3, orbR * 0.35, 0, Math.PI * 2);
        ctx.fill();
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
          ctx.shadowColor = PU ? palRgba(up ? PU : PD, 0.9) : (up ? 'rgba(219,158,36,0.9)' : 'rgba(225,174,71,0.9)');
          ctx.shadowBlur = 12;
        }
        ctx.fillStyle = PU ? (up ? palRgba(PU, 0.88) : palRgba(PD, 0.95)) : (up ? 'rgba(219,158,36,0.85)' : 'rgba(183,132,30,0.95)');
        ctx.beginPath();
        ctx.moveTo(x, yT);
        ctx.lineTo(x + halfW, yc);
        ctx.lineTo(x, yB);
        ctx.lineTo(x - halfW, yc);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Reflet : petite facette claire en haut à gauche (effet pierre taillée).
        ctx.fillStyle = up ? 'rgba(255,255,255,0.75)' : (PU ? 'rgba(255,255,255,0.4)' : 'rgba(239,211,154,0.55)');
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
          ctx.shadowColor = PU ? palRgba(up ? PU : PD, 0.8) : (up ? 'rgba(230,10,30,0.8)' : 'rgba(150,0,15,0.8)');
          ctx.shadowBlur = 10;
        }
        ctx.strokeStyle = up ? (PU || '#F0102A') : (PD || '#A8000F');
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

  /*
   * v2813 — dessins propres aux marchés ajoutés (propriétaire : « chaque indice doit avoir SON look »).
   * Mêmes bougies d'une seconde, mêmes prix, mêmes règles : seul le dessin change. Chaque point est au
   * centre de sa seconde (rond du trade, ligne objectif et boule tombent au même endroit qu'avant).
   * Bougies : classic (façon VOLATILITY), hollow (hausse en creux), capsule (gélules brillantes), bricks
   * (corps en briques), led (colonne de points lumineux), arrows (flèches), spark (étincelle sur sa mèche),
   * glass (verre coloré). Courbes : step (escalier), mountain (montagne pleine), neon (tube néon épais),
   * ribbon (ruban haut-bas), stars (constellation), baseline (deux couleurs autour du milieu), thread (fil).
   * Rien ne clignote : les couleurs dépendent de la seconde elle-même (jamais de sa place dans la liste).
   */
  function extColRgba(hex, al) { return palRgba(hex, al); }
  function drawExt(kind, pad, w, h, candles, minP, maxP, X) {
    if (!candles || candles.length < 2) return null;
    if (EXT2_KINDS[kind]) return drawExt2(kind, pad, w, h, candles, minP, maxP, X);
    var n = candles.length;
    var last = n - 1;
    var slot = Math.max(w / Math.max(1, n), candleStepWidth(w));
    var toX = makeToX(n, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var capVis = Math.max(maxP - minP, 0.01) * 0.55;
    var U = X.up || '#00E676';
    var D = X.dn || '#FF3B30';
    var k = sizeK();
    var big = cssH >= 200;
    var i, c, x, up, y1, y2, bh, hw, lw;
    var isLine = { step: 1, mountain: 1, neon: 1, ribbon: 1, stars: 1, baseline: 1, thread: 1, current: 1, coins: 1, comet: 1, ohlc: 1, diamonds: 1, dashes: 1, zigzag: 1, dotline: 1, rings: 1, arcs: 1 }[kind];
    var lastX = isLine ? (panMs > 0 ? toX(last) : pad.l + w) : toX(last);
    function wick(cd) {
      var a = isFinite(cd.h) ? cd.h : Math.max(cd.o, cd.c);
      var b = isFinite(cd.l) ? cd.l : Math.min(cd.o, cd.c);
      if (a - b > capVis) { var m = (a + b) / 2; a = m + capVis / 2; b = m - capVis / 2; }
      return [a, b];
    }
    ctx.save();
    if (!isLine) {
      var maxBody = (X.body === 'wide' ? 12 : (X.body === 'thin' ? 3.6 : 7.5)) * k;
      var gap = Math.min(2.4, Math.max(0.6, slot * 0.18));
      var cw = Math.max(1.2, Math.min(maxBody, slot - gap));
      for (i = 0; i < n; i++) {
        c = candles[i];
        up = c.c >= c.o;
        var col = up ? U : D;
        x = toX(i);
        var wk = wick(c);
        hw = wk[0]; lw = wk[1];
        y1 = toY(Math.max(c.o, c.c));
        y2 = toY(Math.min(c.o, c.c));
        bh = Math.max(2.4, y2 - y1);
        var hot = i === last && big;
        if (kind === 'classic' || kind === 'hollow' || kind === 'glass') {
          ctx.strokeStyle = col;
          ctx.lineWidth = X.body === 'wide' ? 1.5 : 1.2;
          ctx.beginPath();
          ctx.moveTo(x, toY(hw));
          ctx.lineTo(x, toY(lw));
          ctx.stroke();
          if (hot) { ctx.shadowColor = extColRgba(col, 0.7); ctx.shadowBlur = 9; }
          if (kind === 'classic' || (kind === 'hollow' && !up)) {
            ctx.fillStyle = col;
            ctx.fillRect(x - cw / 2, y1, cw, bh);
            ctx.shadowBlur = 0;
            if (cw >= 4) {
              // Liseré clair en haut du corps (effet verni, comme VOLATILITY en plus fin).
              ctx.fillStyle = 'rgba(255,255,255,0.28)';
              ctx.fillRect(x - cw / 2, y1, cw, Math.min(1.4, bh));
            }
          } else if (kind === 'hollow') {
            ctx.fillStyle = extColRgba(col, 0.14);
            ctx.fillRect(x - cw / 2, y1, cw, bh);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = col;
            ctx.lineWidth = Math.min(2, Math.max(1.2, cw * 0.22));
            var lwh = ctx.lineWidth / 2;
            ctx.strokeRect(x - cw / 2 + lwh, y1 + lwh, Math.max(1, cw - lwh * 2), Math.max(1, bh - lwh * 2));
          } else {
            // Verre : corps translucide, bord lumineux, reflet en haut à gauche.
            ctx.fillStyle = extColRgba(col, 0.34);
            ctx.fillRect(x - cw / 2, y1, cw, bh);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.3;
            ctx.strokeRect(x - cw / 2 + 0.65, y1 + 0.65, Math.max(1, cw - 1.3), Math.max(1, bh - 1.3));
            if (cw >= 4 && bh >= 5) {
              ctx.fillStyle = 'rgba(255,255,255,0.55)';
              ctx.fillRect(x - cw / 2 + 1.4, y1 + 1.4, Math.max(1, cw * 0.22), Math.max(1, bh - 2.8));
            }
          }
        } else if (kind === 'capsule') {
          // Gélules : corps aux bouts ronds, dégradé brillant, mèche fine.
          ctx.strokeStyle = extColRgba(col, 0.75);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, toY(hw));
          ctx.lineTo(x, toY(lw));
          ctx.stroke();
          var cr = Math.min(cw / 2, bh / 2);
          var gC = ctx.createLinearGradient(x - cw / 2, 0, x + cw / 2, 0);
          gC.addColorStop(0, extColRgba(col, 0.75));
          gC.addColorStop(0.35, '#FFFFFF');
          gC.addColorStop(0.55, col);
          gC.addColorStop(1, extColRgba(col, 0.8));
          if (hot) { ctx.shadowColor = extColRgba(col, 0.8); ctx.shadowBlur = 10; }
          ctx.fillStyle = cw >= 4 ? gC : col;
          roundRectOn(ctx, x - cw / 2, y1, cw, bh, cr);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (kind === 'bricks') {
          // Corps en briques : rangées de 3 px décalées une sur deux, joints sombres.
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, toY(hw));
          ctx.lineTo(x, toY(lw));
          ctx.stroke();
          if (hot) { ctx.shadowColor = extColRgba(col, 0.7); ctx.shadowBlur = 9; }
          ctx.fillStyle = col;
          ctx.fillRect(x - cw / 2, y1, cw, bh);
          ctx.shadowBlur = 0;
          if (cw >= 4 && bh >= 5) {
            ctx.fillStyle = 'rgba(14,12,9,0.55)';
            var rowH = 3.4;
            var r, yy;
            for (r = 0, yy = y2 - rowH; yy > y1; r++, yy -= rowH) {
              ctx.fillRect(x - cw / 2, yy, cw, 0.9);
              var jx = x + (r % 2 ? -cw / 4 : cw / 4);
              ctx.fillRect(jx - 0.45, yy + 0.9, 0.9, Math.min(rowH - 0.9, y2 - yy - 0.9));
            }
          }
        } else if (kind === 'led') {
          // Colonne de points lumineux : forts dans le corps, pâles sur la mèche.
          var step = Math.max(2.6, Math.min(4.2, cw * 0.62));
          var dr = Math.max(0.9, Math.min(2.1, cw * 0.3));
          var yTop = toY(hw), yBot = toY(lw);
          var yy2;
          ctx.fillStyle = extColRgba(col, 0.38);
          for (yy2 = yBot; yy2 >= yTop; yy2 -= step) {
            if (yy2 >= y1 - 0.5 && yy2 <= y1 + bh + 0.5) continue;
            ctx.beginPath(); ctx.arc(x, yy2, dr * 0.7, 0, Math.PI * 2); ctx.fill();
          }
          if (hot) { ctx.shadowColor = extColRgba(col, 0.9); ctx.shadowBlur = 8; }
          ctx.fillStyle = col;
          var any = false;
          for (yy2 = y1 + bh; yy2 >= y1 - 0.01; yy2 -= step) {
            ctx.beginPath(); ctx.arc(x, yy2, dr, 0, Math.PI * 2); ctx.fill();
            any = true;
          }
          if (!any) { ctx.beginPath(); ctx.arc(x, (y1 + y2) / 2, dr, 0, Math.PI * 2); ctx.fill(); }
          ctx.shadowBlur = 0;
        } else if (kind === 'arrows') {
          // Flèche : tige de l'ouverture à la clôture, pointe sur la clôture dans le sens du mouvement.
          var yo = toY(c.o), yc = toY(c.c);
          var aw = Math.max(2.6, Math.min(6.5 * k, slot * 0.42));
          var ah = Math.max(3, aw * 1.1);
          ctx.strokeStyle = extColRgba(col, 0.55);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, toY(hw));
          ctx.lineTo(x, toY(lw));
          ctx.stroke();
          ctx.strokeStyle = col;
          ctx.lineWidth = Math.max(1.4, aw * 0.42);
          ctx.beginPath();
          ctx.moveTo(x, yo);
          ctx.lineTo(x, up ? yc + ah * 0.6 : yc - ah * 0.6);
          ctx.stroke();
          if (hot) { ctx.shadowColor = extColRgba(col, 0.85); ctx.shadowBlur = 9; }
          ctx.fillStyle = col;
          ctx.beginPath();
          if (up) { ctx.moveTo(x, yc - ah * 0.45); ctx.lineTo(x + aw, yc + ah * 0.6); ctx.lineTo(x - aw, yc + ah * 0.6); }
          else { ctx.moveTo(x, yc + ah * 0.45); ctx.lineTo(x + aw, yc - ah * 0.6); ctx.lineTo(x - aw, yc - ah * 0.6); }
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (kind === 'spark') {
          // Étincelle : mèche fine, petit trait à l'ouverture, point brillant sur la clôture.
          var ys = toY(c.c);
          ctx.strokeStyle = extColRgba(col, 0.6);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, toY(hw));
          ctx.lineTo(x, toY(lw));
          ctx.stroke();
          var tw = Math.max(2, Math.min(5 * k, slot * 0.36));
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x - tw, toY(c.o));
          ctx.lineTo(x, toY(c.o));
          ctx.stroke();
          var sr = Math.max(2, Math.min(4.2 * k, slot * 0.34));
          if (hot) { ctx.shadowColor = extColRgba(col, 0.95); ctx.shadowBlur = 10; }
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(x, ys, sr, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.beginPath(); ctx.arc(x, ys, Math.max(0.8, sr * 0.42), 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      return { toX: toX, toY: toY, lastX: lastX, lastY: toY(candles[last].c), count: n };
    }
    /* —— courbes —— */
    var M = X.line || U;
    var pts = [];
    for (i = 0; i < n; i++) pts.push([toX(i), toY(candles[i].c)]);
    var lastY = pts[last][1];
    function smoothPath(list, endX, endY) {
      ctx.moveTo(list[0][0], list[0][1]);
      var q;
      for (q = 1; q < list.length; q++) {
        var mx = (list[q - 1][0] + list[q][0]) / 2;
        var my = (list[q - 1][1] + list[q][1]) / 2;
        ctx.quadraticCurveTo(list[q - 1][0], list[q - 1][1], mx, my);
      }
      ctx.lineTo(list[list.length - 1][0], list[list.length - 1][1]);
      if (endX != null) ctx.lineTo(endX, endY);
    }
    var floor = pad.t + h;
    if (kind === 'step') {
      // Escalier : marches dans la couleur du marché ; contremarche montante / descendante colorée.
      var sw = (X.width || 2.8);
      ctx.lineCap = 'square';
      ctx.lineWidth = sw;
      ctx.strokeStyle = M;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i - 1][1]);
      ctx.lineTo(lastX, pts[last][1]);
      ctx.stroke();
      for (i = 1; i < n; i++) {
        var d0 = pts[i - 1][1], d1 = pts[i][1];
        if (Math.abs(d1 - d0) < 0.5) continue;
        ctx.strokeStyle = d1 < d0 ? (X.rise || M) : (X.fall || M);
        ctx.beginPath();
        ctx.moveTo(pts[i][0], d0);
        ctx.lineTo(pts[i][0], d1);
        ctx.stroke();
      }
    } else if (kind === 'mountain') {
      // Montagne : crête lissée, versant plein (dégradé franc), ligne de crête claire.
      ctx.beginPath();
      smoothPath(pts, lastX, lastY);
      ctx.lineTo(lastX, floor);
      ctx.lineTo(pts[0][0], floor);
      ctx.closePath();
      var gM = ctx.createLinearGradient(0, pad.t, 0, floor);
      gM.addColorStop(0, extColRgba(M, 0.62));
      gM.addColorStop(0.55, extColRgba(X.fill || M, 0.24));
      gM.addColorStop(1, extColRgba(X.fill || M, 0.03));
      ctx.fillStyle = gM;
      ctx.fill();
      ctx.beginPath();
      smoothPath(pts, lastX, lastY);
      ctx.strokeStyle = '#FFFFFF';
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      smoothPath(pts, lastX, lastY);
      ctx.strokeStyle = M;
      ctx.lineWidth = 2.6;
      ctx.globalAlpha = 0.55;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (kind === 'neon') {
      // Tube néon : segments droits, trois épaisseurs (lueur large, corps, cœur clair).
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      var passes = [[10, 0.12], [5.5, 0.32], [3, 1]];
      passes.forEach(function (ps) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var q = 1; q < n; q++) ctx.lineTo(pts[q][0], pts[q][1]);
        ctx.lineTo(lastX, lastY);
        ctx.strokeStyle = M;
        ctx.globalAlpha = ps[1];
        ctx.lineWidth = ps[0];
        ctx.stroke();
      });
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.lineTo(lastX, lastY);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (kind === 'ribbon') {
      // Ruban : bande entre le plus haut et le plus bas de chaque seconde, fil du prix au milieu.
      var hiP = [], loP = [];
      for (i = 0; i < n; i++) {
        var wr = wick(candles[i]);
        hiP.push([pts[i][0], Math.min(toY(wr[0]), pts[i][1] - 1.5)]);
        loP.push([pts[i][0], Math.max(toY(wr[1]), pts[i][1] + 1.5)]);
      }
      ctx.beginPath();
      smoothPath(hiP, lastX, hiP[last][1]);
      ctx.lineTo(lastX, loP[last][1]);
      for (i = last; i >= 0; i--) ctx.lineTo(loP[i][0], loP[i][1]);
      ctx.closePath();
      var gR = ctx.createLinearGradient(0, pad.t, 0, floor);
      gR.addColorStop(0, extColRgba(M, 0.5));
      gR.addColorStop(1, extColRgba(X.fill || M, 0.32));
      ctx.fillStyle = gR;
      ctx.fill();
      ctx.strokeStyle = extColRgba(M, 0.8);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      smoothPath(pts, lastX, lastY);
      ctx.strokeStyle = X.mid || '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else if (kind === 'stars') {
      // Constellation : fil pointillé fin, une étoile toutes les 5 secondes (attachée à SA seconde).
      ctx.setLineDash([1.5, 3.5]);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.lineTo(lastX, lastY);
      ctx.strokeStyle = M;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.setLineDash([]);
      for (i = 0; i < n; i++) {
        var tk = candles[i].tk;
        var sec = tk != null ? Math.round(tk / 4) : i;
        var strong = sec % 5 === 0;
        var rr = strong ? 3.2 : 1.5;
        if (strong) {
          ctx.fillStyle = extColRgba(M, 0.3);
          ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], rr * 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = X.star || '#FFFFFF';
          ctx.beginPath();
          ctx.moveTo(pts[i][0], pts[i][1] - rr * 1.6);
          ctx.lineTo(pts[i][0] + rr * 0.5, pts[i][1] - rr * 0.5);
          ctx.lineTo(pts[i][0] + rr * 1.6, pts[i][1]);
          ctx.lineTo(pts[i][0] + rr * 0.5, pts[i][1] + rr * 0.5);
          ctx.lineTo(pts[i][0], pts[i][1] + rr * 1.6);
          ctx.lineTo(pts[i][0] - rr * 0.5, pts[i][1] + rr * 0.5);
          ctx.lineTo(pts[i][0] - rr * 1.6, pts[i][1]);
          ctx.lineTo(pts[i][0] - rr * 0.5, pts[i][1] - rr * 0.5);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = M;
          ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], rr, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (kind === 'comet' || kind === 'ohlc' || kind === 'diamonds' || kind === 'dashes' || kind === 'zigzag' || kind === 'dotline' || kind === 'rings' || kind === 'arcs') {
      // 2026-10-19 (propriétaire : « trop de simulations identiques ; chaque monde différent ») : 8 dessins nouveaux.
      var cU2 = X.up || M, cD2 = X.dn || '#FF4D6D';
      var cdir = function (j) { return j > 0 ? candles[j].c >= candles[j - 1].c : candles[j].c >= candles[j].o; };
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (kind === 'comet') {
        // COMÈTE : traînée qui s'efface vers le passé, tête lumineuse
        for (i = 1; i < n; i++) {
          ctx.globalAlpha = 0.15 + 0.85 * (i / n);
          ctx.strokeStyle = M; ctx.lineWidth = 1 + 3.4 * (i / n);
          ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(pts[last][0], pts[last][1]); ctx.lineTo(lastX, lastY); ctx.stroke();
      } else if (kind === 'ohlc') {
        // BARRES OHLC : trait haut-bas, ouverture à gauche, clôture à droite
        var tk = Math.max(2, Math.min(6, slot * 0.35));
        ctx.lineWidth = Math.max(1.2, Math.min(2.4, slot * 0.18));
        for (i = 0; i < n; i++) {
          var cc = candles[i], wb = wick(cc), xx = toX(i);
          ctx.strokeStyle = cc.c >= cc.o ? cU2 : cD2;
          ctx.beginPath(); ctx.moveTo(xx, toY(wb[0])); ctx.lineTo(xx, toY(wb[1]));
          ctx.moveTo(xx - tk, toY(cc.o)); ctx.lineTo(xx, toY(cc.o)); ctx.moveTo(xx, toY(cc.c)); ctx.lineTo(xx + tk, toY(cc.c)); ctx.stroke();
        }
      } else if (kind === 'diamonds') {
        // LOSANGES : un diamant par seconde, de l'ouverture à la clôture
        var dw = Math.max(2.2, Math.min(7, slot * 0.42));
        for (i = 0; i < n; i++) {
          var cd = candles[i], xd = toX(i), ya = toY(cd.o), yb = toY(cd.c);
          if (Math.abs(ya - yb) < 4) { var mid = (ya + yb) / 2; ya = mid - 2; yb = mid + 2; }
          ctx.fillStyle = cd.c >= cd.o ? cU2 : cD2;
          ctx.beginPath(); ctx.moveTo(xd, ya); ctx.lineTo(xd + dw, (ya + yb) / 2); ctx.lineTo(xd, yb); ctx.lineTo(xd - dw, (ya + yb) / 2); ctx.closePath(); ctx.fill();
        }
      } else if (kind === 'dashes') {
        // TIRETS : un trait horizontal par prix (sans liaison), couleur selon le sens
        var hw2 = Math.max(2, Math.min(8, slot * 0.45));
        ctx.lineWidth = 3;
        for (i = 0; i < n; i++) { ctx.strokeStyle = cdir(i) ? cU2 : cD2; ctx.beginPath(); ctx.moveTo(pts[i][0] - hw2, pts[i][1]); ctx.lineTo(pts[i][0] + hw2, pts[i][1]); ctx.stroke(); }
      } else if (kind === 'zigzag') {
        // ZIGZAG : seulement les sommets et les creux, reliés, avec un triangle à chaque pivot
        var piv = [pts[0]], dirZ = 0;
        for (i = 1; i < n; i++) {
          var dz = pts[i][1] < pts[i - 1][1] ? 1 : (pts[i][1] > pts[i - 1][1] ? -1 : dirZ);
          if (dirZ !== 0 && dz !== dirZ) piv.push(pts[i - 1]);
          dirZ = dz;
        }
        piv.push([lastX, lastY]);
        ctx.strokeStyle = M; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(piv[0][0], piv[0][1]); for (i = 1; i < piv.length; i++) ctx.lineTo(piv[i][0], piv[i][1]); ctx.stroke();
        for (i = 1; i < piv.length - 1; i++) {
          var top2 = piv[i][1] < piv[i - 1][1];
          ctx.fillStyle = top2 ? cU2 : cD2; ctx.beginPath();
          if (top2) { ctx.moveTo(piv[i][0], piv[i][1] - 7); ctx.lineTo(piv[i][0] - 4, piv[i][1] - 1); ctx.lineTo(piv[i][0] + 4, piv[i][1] - 1); }
          else { ctx.moveTo(piv[i][0], piv[i][1] + 7); ctx.lineTo(piv[i][0] - 4, piv[i][1] + 1); ctx.lineTo(piv[i][0] + 4, piv[i][1] + 1); }
          ctx.closePath(); ctx.fill();
        }
      } else if (kind === 'dotline') {
        // POINTILLÉS : une ligne faite de petits points serrés
        ctx.fillStyle = M;
        for (i = 1; i < n + 1; i++) {
          var a0 = pts[i - 1], a1 = i < n ? pts[i] : [lastX, lastY], dx = a1[0] - a0[0], dy = a1[1] - a0[1], L2 = Math.sqrt(dx * dx + dy * dy), k2;
          for (k2 = 0; k2 < L2; k2 += 4.5) { ctx.beginPath(); ctx.arc(a0[0] + dx * k2 / (L2 || 1), a0[1] + dy * k2 / (L2 || 1), 1.6, 0, Math.PI * 2); ctx.fill(); }
        }
      } else if (kind === 'rings') {
        // ANNEAUX : un cercle vide par prix, plus grand quand le prix a beaucoup bougé
        var rng = Math.max(1e-9, maxP - minP);
        ctx.lineWidth = 2;
        for (i = 0; i < n; i++) {
          var mv = i > 0 ? Math.abs(candles[i].c - candles[i - 1].c) / rng : 0;
          ctx.strokeStyle = cdir(i) ? cU2 : cD2;
          ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], Math.max(2.4, Math.min(9, 2.4 + mv * 120)), 0, Math.PI * 2); ctx.stroke();
        }
      } else {
        // ARCHES : chaque prix relié au suivant par une petite arche (pont)
        ctx.lineWidth = 2.4;
        for (i = 1; i < n + 1; i++) {
          var b0 = pts[i - 1], b1 = i < n ? pts[i] : [lastX, lastY];
          ctx.strokeStyle = b1[1] <= b0[1] ? cU2 : cD2;
          ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.quadraticCurveTo((b0[0] + b1[0]) / 2, Math.min(b0[1], b1[1]) - Math.max(4, Math.abs(b1[0] - b0[0]) * 0.5), b1[0], b1[1]); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'coins') {
      // 2026-10-19 (propriétaire : MAMMON « rouge en bas, un trait au milieu, je ne comprends pas ») : FIL D'OR semé de pièces —
      // une ligne dorée lisse, une pièce d'or toutes les quelques secondes (pièce verte si ça a monté, rouge si ça a baissé).
      ctx.beginPath();
      smoothPath(pts, lastX, lastY);
      ctx.strokeStyle = X.line || '#FFD54A';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.stroke();
      var stepC = Math.max(2, Math.round(26 / Math.max(1, slot)));
      for (i = stepC; i < n; i += stepC) {
        var cx = pts[i][0], cy = pts[i][1], upC = candles[i].c >= candles[i - stepC].c;
        ctx.fillStyle = '#FFD54A'; ctx.strokeStyle = '#8A5A00'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, 5.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = upC ? (X.up || '#2BFF88') : (X.dn || '#FF4D5E');
        ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'current') {
      // v2835 (propriétaire : POSEIDON « on ne comprend pas », plus de trait au milieu) : COURANT MARIN — un seul tracé épais
      // dont chaque morceau prend la couleur de son sens (montée / descente), sans remplissage ni ligne de base.
      var cUp = X.up || '#E2AF4A', cDn = X.dn || X.below || '#FFB547';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      var segEnd = pts.concat([[lastX, lastY]]);
      for (i = 1; i < segEnd.length; i++) {
        var p0 = segEnd[i - 1], p1 = segEnd[i];
        if (p1[0] - p0[0] < 0.01 && Math.abs(p1[1] - p0[1]) < 0.01) continue;
        ctx.strokeStyle = p1[1] <= p0[1] ? cUp : cDn;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.stroke();
      }
    } else if (kind === 'baseline') {
      // Ligne de base (milieu du cadre) : au-dessus = couleur 1, en dessous = couleur 2.
      var by = pad.t + h / 2;
      var A2 = X.below || D;
      [[pad.t, by, U], [by, floor, A2]].forEach(function (zone) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(pad.l - 2, zone[0], w + 4 + (lastX - (pad.l + w)), zone[1] - zone[0]);
        ctx.clip();
        ctx.beginPath();
        smoothPath(pts, lastX, lastY);
        ctx.lineTo(lastX, by);
        ctx.lineTo(pts[0][0], by);
        ctx.closePath();
        var gB = ctx.createLinearGradient(0, zone[0] === pad.t ? pad.t : floor, 0, by);
        gB.addColorStop(0, extColRgba(zone[2], 0.42));
        gB.addColorStop(1, extColRgba(zone[2], 0.06));
        ctx.fillStyle = gB;
        ctx.fill();
        ctx.beginPath();
        smoothPath(pts, lastX, lastY);
        ctx.strokeStyle = zone[2];
        ctx.lineWidth = 2.4;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
      });
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, by);
      ctx.lineTo(pad.l + w, by);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Fil (thread) : trait lisse et lumineux (style COBRA, avec SA couleur).
      ctx.beginPath();
      smoothPath(pts, lastX, lastY);
      ctx.strokeStyle = M;
      ctx.lineWidth = X.width || 3.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = extColRgba(M, 0.6);
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: n };
  }

  /*
   * 2026-10-19 — « un monde = un dessin » (propriétaire : plus AUCUN indice qui ressemble à un autre, plus de bougies
   * façon VOLATILITY, plus de fils fins ni de courbes « serpent »). 45 langages visuels, un par indice. Mêmes
   * secondes, mêmes prix, mêmes règles : SEUL le dessin change. Chaque point reste au centre de sa seconde (rond du
   * trade, lignes objectif et boule du prix tombent au même endroit). Les animations (flammes, bulles, engrenages…)
   * ne dépendent que de l'horloge et de la seconde elle-même : jamais du prix affiché ni du moment des ticks.
   * Léger pour les vieux Android : aucune ombre floue sauf zéro, textures en motif (pattern) calculées une fois.
   */
  var EXT2_KINDS = {
    pixel: 1, nightsky: 1, clouds: 1, crescent: 1, tomb: 1, chevrons: 1, coinstack: 1, hammers: 1, petrify: 1, chain: 1,
    sundisc: 1, tombstones: 1, claws: 1, constellation: 1, lava: 1, grass: 1, glitch: 1, aurora: 1, bats: 1, mandala: 1,
    banners: 1, crowns: 1, eyes: 1, gears: 1, mosaic: 1, tide: 1, dunes: 1, fans: 1, spirals: 1, drops: 1,
    notes: 1, cubes: 1, hearts: 1, bubbles: 1, speed: 1, hive: 1, sparkles: 1, scales: 1, wave: 1, feathers: 1,
    jaws: 1, halftone: 1, ankh: 1, ink: 1, flames: 1
  };
  function extHash(v) {
    var x = (v | 0) ^ 0x9E3779B9;
    x = Math.imul(x ^ (x >>> 16), 0x85EBCA6B);
    x = Math.imul(x ^ (x >>> 13), 0xC2B2AE35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  }
  var extPats = {};
  function extPattern(key, pw, ph, paint) {
    var hit = extPats[key];
    if (hit && hit.ctx === ctx) return hit.pat;
    var cv = document.createElement('canvas');
    cv.width = pw;
    cv.height = ph;
    var g = cv.getContext('2d');
    paint(g, pw, ph);
    var pat = ctx.createPattern(cv, 'repeat');
    extPats[key] = { ctx: ctx, pat: pat };
    return pat;
  }
  function drawExt2(kind, pad, w, h, candles, minP, maxP, X) {
    var n = candles.length;
    var last = n - 1;
    var slot = Math.max(w / Math.max(1, n), candleStepWidth(w));
    var toX = makeToX(n, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var k = sizeK();
    var U = X.up || X.line || '#FFFFFF';
    var D = X.dn || '#FF4D6D';
    var M = X.line || U;
    var top = pad.t;
    var floor = pad.t + h;
    var lastX = panMs > 0 ? toX(last) : pad.l + w;
    var T = ((window.performance && performance.now) ? performance.now() : Date.now()) / 1000;
    var S = Math.max(3.2, Math.min(9 * k, slot * 0.46));
    var pts = [];
    var i, x, y, up, s, sd;
    for (i = 0; i < n; i++) pts.push([toX(i), toY(candles[i].c)]);
    var lastY = pts[last][1];
    var seeds = [];
    var dirs = [];
    var moves = [];
    for (i = 0; i < n; i++) {
      var tt = candles[i].t;
      seeds.push(extHash(isFinite(tt) ? Math.round(tt / 1000) : i));
      var ref = i > 0 ? candles[i - 1].c : candles[i].o;
      dirs.push(candles[i].c >= ref);
      moves.push(i > 0 ? Math.abs(pts[i][1] - pts[i - 1][1]) : Math.abs(toY(candles[i].o) - pts[i][1]));
    }
    var ends = pts.concat([[lastX, lastY]]);
    function rgba(hex, al) { return palRgba(hex, al); }
    function areaPath(toBottom) {
      ctx.beginPath();
      ctx.moveTo(ends[0][0], ends[0][1]);
      for (var q = 1; q < ends.length; q++) ctx.lineTo(ends[q][0], ends[q][1]);
      var edge = toBottom === false ? top : floor;
      ctx.lineTo(lastX, edge);
      ctx.lineTo(ends[0][0], edge);
      ctx.closePath();
    }
    function crest(col, wd, al) {
      ctx.beginPath();
      ctx.moveTo(ends[0][0], ends[0][1]);
      for (var q = 1; q < ends.length; q++) ctx.lineTo(ends[q][0], ends[q][1]);
      ctx.strokeStyle = col;
      ctx.globalAlpha = al == null ? 1 : al;
      ctx.lineWidth = wd;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function vGrad(y0, y1, stops) {
      var g = ctx.createLinearGradient(0, y0, 0, Math.max(y0 + 1, y1));
      stops.forEach(function (st) { g.addColorStop(st[0], st[1]); });
      return g;
    }
    var minY = floor;
    for (i = 0; i < ends.length; i++) if (ends[i][1] < minY) minY = ends[i][1];
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (kind === 'pixel') {
      // ODIN — escalier 8 bits : gros pixels carrés, marches bleu glacier, montées or, descentes rose.
      var px = Math.max(3, Math.min(6 * k, slot * 0.42));
      var q2 = function (v) { return Math.round(v / px) * px; };
      var py = q2(pts[0][1]);
      for (i = 1; i < ends.length; i++) {
        var nx = ends[i][0], ny = q2(ends[i][1]);
        var x0 = ends[i - 1][0];
        ctx.fillStyle = M;
        for (x = x0; x < nx - 0.5; x += px) ctx.fillRect(Math.round(x - px / 2) + 0.5, py - px / 2 + 0.5, px - 1, px - 1);
        if (ny !== py) {
          ctx.fillStyle = ny < py ? (X.rise || U) : (X.fall || D);
          var stp = ny < py ? -px : px;
          for (y = py + stp; stp < 0 ? y >= ny : y <= ny; y += stp) ctx.fillRect(Math.round(nx - px / 2) + 0.5, y - px / 2 + 0.5, px - 1, px - 1);
        }
        py = ny;
      }
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (i = 1; i < n; i++) if (Math.abs(q2(pts[i][1]) - q2(pts[i - 1][1])) >= px) ctx.fillRect(Math.round(pts[i][0] - px / 2) + 0.5, q2(pts[i][1]) - px / 2 + 0.5, Math.max(1, px * 0.4), Math.max(1, px * 0.4));
    } else if (kind === 'nightsky') {
      // NYX — voile de nuit : ciel violet profond sous la courbe, étoiles qui scintillent dedans, crête de lune.
      areaPath();
      ctx.fillStyle = vGrad(minY, floor, [[0, rgba(X.fill || '#E6BB66', 0.62)], [0.5, rgba(X.fill || '#E6BB66', 0.25)], [1, rgba(X.fill || '#E6BB66', 0.02)]]);
      ctx.fill();
      for (i = 0; i < n; i++) {
        sd = seeds[i];
        var depth = (floor - pts[i][1]) * (0.12 + 0.8 * extHash(Math.floor(sd * 1e6) + 7));
        var tw = 0.35 + 0.65 * Math.abs(Math.sin(T * (1.2 + sd * 2) + sd * 40));
        ctx.globalAlpha = tw;
        ctx.fillStyle = '#FFFFFF';
        var r0 = 0.8 + sd * 1.3;
        ctx.fillRect(pts[i][0] - r0 / 2, pts[i][1] + depth - r0 / 2, r0, r0);
        if (sd > 0.82) {
          ctx.fillRect(pts[i][0] - 3, pts[i][1] + depth - 0.4, 6, 0.8);
          ctx.fillRect(pts[i][0] - 0.4, pts[i][1] + depth - 3, 0.8, 6);
        }
      }
      ctx.globalAlpha = 1;
      crest(M, 3.4);
      crest('#FFFFFF', 1.2, 0.8);
    } else if (kind === 'clouds') {
      // ZEUS — banc de nuages de l'Olympe : un nuage par seconde, reflet or quand ça monte.
      var cr = Math.max(3.4, S * 0.95);
      ctx.fillStyle = rgba(X.fill || '#C9AB6E', 0.9);
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1] + cr * 0.35;
        ctx.beginPath();
        ctx.arc(x - cr * 0.62, y, cr * 0.62, 0, Math.PI * 2);
        ctx.arc(x + cr * 0.62, y, cr * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        ctx.fillStyle = dirs[i] ? U : (X.cloud || '#FDF9F0');
        ctx.beginPath();
        ctx.arc(x, y, cr * 0.78, 0, Math.PI * 2);
        ctx.arc(x - cr * 0.62, y + cr * 0.25, cr * 0.55, 0, Math.PI * 2);
        ctx.arc(x + cr * 0.6, y + cr * 0.22, cr * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(pts[i][0] - cr * 0.25, pts[i][1] - cr * 0.3, cr * 0.22, 0, Math.PI * 2); ctx.fill(); }
    } else if (kind === 'crescent') {
      // LILITH — croissants de lune : cornes vers le haut quand ça monte, vers le bas quand ça baisse.
      for (i = 0; i < n; i++) {
        s = Math.max(3.4, S * 1.02);
        ctx.save();
        ctx.translate(pts[i][0], pts[i][1]);
        ctx.rotate(dirs[i] ? -Math.PI / 2 : Math.PI / 2);
        var dd = s * 0.9, hh = Math.sqrt(Math.max(0.01, s * s - dd * dd / 4)), th = Math.atan2(hh, dd / 2);
        ctx.beginPath();
        ctx.arc(0, 0, s, th, Math.PI * 2 - th, false);
        ctx.arc(dd, 0, s, Math.PI + th, Math.PI - th, true);
        ctx.closePath();
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.fill();
        ctx.restore();
      }
    } else if (kind === 'tomb') {
      // ANUBIS — mur de tombeau : blocs de grès sous la courbe, joints gravés, arête d'or.
      areaPath();
      ctx.fillStyle = vGrad(minY, floor, [[0, rgba(M, 0.75)], [1, rgba(M, 0.12)]]);
      ctx.fill();
      ctx.save();
      areaPath();
      ctx.clip();
      ctx.fillStyle = extPattern('tomb', 24, 14, function (g) {
        g.fillStyle = 'rgba(40,20,0,0.55)';
        g.fillRect(0, 0, 24, 1.4); g.fillRect(0, 7, 24, 1.4);
        g.fillRect(0, 0, 1.4, 7); g.fillRect(12, 7, 1.4, 7);
        g.fillStyle = 'rgba(255,240,200,0.25)';
        g.fillRect(1.4, 1.4, 10, 1); g.fillRect(13.4, 8.4, 10, 1);
      });
      ctx.fillRect(pad.l, minY, lastX - pad.l + 2, floor - minY);
      ctx.restore();
      crest(X.rise || '#FFE6A8', 3.2);
    } else if (kind === 'chevrons') {
      // VALKYRIE — chevrons d'ailes : deux « ^ » qui montent, deux « v » qui plongent.
      ctx.lineWidth = Math.max(1.8, S * 0.36);
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 0.95;
        var sg = dirs[i] ? 1 : -1;
        ctx.strokeStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.moveTo(x - s, y + sg * s * 0.55); ctx.lineTo(x, y - sg * s * 0.25); ctx.lineTo(x + s, y + sg * s * 0.55);
        ctx.stroke();
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(x - s, y + sg * s * 1.3); ctx.lineTo(x, y + sg * s * 0.5); ctx.lineTo(x + s, y + sg * s * 1.3);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else if (kind === 'coinstack') {
      // MAMMON — l'esprit de l'argent : une pile de pièces d'or par seconde (plus haute si ça bouge fort).
      var rx = Math.max(3.6, S * 1.0), ry = rx * 0.4;
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        var nC = 1 + Math.min(3, Math.floor(moves[i] / 5));
        for (var cI = nC - 1; cI >= 0; cI--) {
          var cy = y + cI * ry * 1.25;
          ctx.fillStyle = '#B8770F';
          ctx.beginPath(); ctx.ellipse(x, cy + ry * 0.5, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = cI === 0 ? (dirs[i] ? '#FFE27A' : '#F2B83A') : '#E9A92C';
          ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#7A4A00'; ctx.lineWidth = 0.8; ctx.stroke();
        }
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath(); ctx.ellipse(x, y, rx * 0.42, ry * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#FFFFFF';
      for (i = 0; i < n; i++) {
        if (seeds[i] < 0.75) continue;
        var tw2 = Math.max(0, Math.sin(T * 3 + seeds[i] * 30));
        if (tw2 < 0.2) continue;
        x = pts[i][0] + rx * 0.6; y = pts[i][1] - ry * 1.4; s = 3.2 * tw2;
        ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.3, y - s * 0.3); ctx.lineTo(x + s, y); ctx.lineTo(x + s * 0.3, y + s * 0.3);
        ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.3, y + s * 0.3); ctx.lineTo(x - s, y); ctx.lineTo(x - s * 0.3, y - s * 0.3); ctx.closePath(); ctx.fill();
      }
    } else if (kind === 'hammers') {
      // THOR — un petit Mjölnir par seconde : tête bleu acier (hausse) ou orange forge (baisse), manche en bas.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S;
        var hw = s * 0.95, hh2 = s * 0.55;
        ctx.fillStyle = '#7A4E2A';
        ctx.fillRect(x - s * 0.16, y + hh2 * 0.6, s * 0.32, s * 1.05);
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.fillRect(x - hw, y - hh2, hw * 2, hh2 * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x - hw, y - hh2, hw * 2, Math.max(1, hh2 * 0.4));
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x - hw, y + hh2 * 0.5, hw * 2, hh2 * 0.5);
      }
    } else if (kind === 'petrify') {
      // MEDUSA — le regard qui pétrifie : la trace devient marbre (gris pierre à gauche, émeraude vivante vers la
      // tête), veines dorées, écailles gravées dans la pierre, lueur émeraude sur l'arête et yeux d'or.
      areaPath();
      var gS = ctx.createLinearGradient(pad.l, 0, lastX, 0);
      gS.addColorStop(0, 'rgba(120,138,132,0.55)');
      gS.addColorStop(0.55, 'rgba(70,160,140,0.55)');
      gS.addColorStop(1, rgba(M, 0.7));
      ctx.fillStyle = gS;
      ctx.fill();
      ctx.save();
      areaPath();
      ctx.clip();
      ctx.fillStyle = extPattern('petrify', 16, 10, function (g) {
        g.strokeStyle = 'rgba(10,40,34,0.42)';
        g.lineWidth = 1;
        g.beginPath(); g.arc(8, 0, 6.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
        g.beginPath(); g.arc(0, 5, 6.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
        g.beginPath(); g.arc(16, 5, 6.5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
      });
      ctx.fillRect(pad.l, minY, lastX - pad.l + 2, floor - minY);
      ctx.fillStyle = vGrad(minY, floor, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(6,20,18,0.55)']]);
      ctx.fillRect(pad.l, minY, lastX - pad.l + 2, floor - minY);
      ctx.strokeStyle = 'rgba(245,215,110,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (i = 2; i < n; i += 4) {
        sd = seeds[i];
        x = pts[i][0]; y = pts[i][1] + 4;
        ctx.moveTo(x, y);
        ctx.lineTo(x + (sd - 0.5) * 14, y + 10 + sd * 10);
        ctx.lineTo(x + (sd - 0.3) * 20, y + 26 + sd * 16);
      }
      ctx.stroke();
      ctx.restore();
      crest(M, 6, 0.3);
      crest(M, 3);
      crest(X.gold || '#F5D76E', 1.2, 0.95);
      for (i = 0; i < n; i++) {
        if (i % 5 !== 2) continue;
        x = pts[i][0]; y = pts[i][1];
        ctx.fillStyle = '#0A2420';
        ctx.beginPath(); ctx.ellipse(x, y, 3.6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = X.gold || '#F5D76E';
        ctx.beginPath(); ctx.ellipse(x, y, 2.6, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0A2420';
        ctx.fillRect(x - 0.45, y - 1.5, 0.9, 3);
      }
    } else if (kind === 'chain') {
      // BELIAL — chaîne forgée : un maillon par seconde, alternance de face / de profil.
      for (i = 1; i < ends.length; i++) {
        var a0 = ends[i - 1], a1 = ends[i];
        var dx = a1[0] - a0[0], dy = a1[1] - a0[1];
        var L = Math.sqrt(dx * dx + dy * dy);
        if (L < 1) continue;
        var ang = Math.atan2(dy, dx);
        var mx = (a0[0] + a1[0]) / 2, my = (a0[1] + a1[1]) / 2;
        var upL = dy <= 0;
        ctx.strokeStyle = upL ? U : D;
        if (i % 2) {
          ctx.lineWidth = 2.6;
          ctx.beginPath(); ctx.ellipse(mx, my, L * 0.62 + 1.5, Math.max(2.2, S * 0.5), ang, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.lineWidth = Math.max(3, S * 0.55);
          ctx.beginPath(); ctx.moveTo(mx - Math.cos(ang) * (L * 0.62 + 1), my - Math.sin(ang) * (L * 0.62 + 1)); ctx.lineTo(mx + Math.cos(ang) * (L * 0.62 + 1), my + Math.sin(ang) * (L * 0.62 + 1)); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    } else if (kind === 'sundisc') {
      // RA — disque solaire : un soleil par seconde, rayons qui tournent lentement.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = Math.max(2.6, S * 0.55);
        var col = dirs[i] ? U : D;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        var rot = T * 0.6 + seeds[i] * 6;
        for (var rI = 0; rI < 8; rI++) {
          var ra = rot + rI * Math.PI / 4;
          ctx.moveTo(x + Math.cos(ra) * s * 1.3, y + Math.sin(ra) * s * 1.3);
          ctx.lineTo(x + Math.cos(ra) * s * 1.9, y + Math.sin(ra) * s * 1.9);
        }
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.3, s * 0.35, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'tombstones') {
      // HADES — cimetière des ombres : une stèle arrondie par seconde, croix gravée.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S;
        var sw = s * 0.62, sh = s * 0.85;
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.moveTo(x - sw, y + sh);
        ctx.lineTo(x - sw, y - sh + sw);
        ctx.arc(x, y - sh + sw, sw, Math.PI, 0, false);
        ctx.lineTo(x + sw, y + sh);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(12,10,7,0.55)';
        ctx.fillRect(x - 0.6, y - sh * 0.45, 1.2, sh * 0.9);
        ctx.fillRect(x - sw * 0.45, y - sh * 0.2, sw * 0.9, 1.2);
      }
    } else if (kind === 'claws') {
      // FENRIR — griffures du loup : trois coups de griffe par seconde (vers le haut ou vers le bas).
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.1;
        var sg2 = dirs[i] ? -1 : 1;
        ctx.fillStyle = dirs[i] ? U : D;
        for (var cl = -1; cl <= 1; cl++) {
          var ox = cl * s * 0.42;
          ctx.beginPath();
          ctx.moveTo(x + ox - s * 0.5, y - sg2 * s * 0.75);
          ctx.quadraticCurveTo(x + ox + s * 0.05, y, x + ox + s * 0.45, y + sg2 * s * 0.8);
          ctx.quadraticCurveTo(x + ox - s * 0.12, y + sg2 * s * 0.05, x + ox - s * 0.5, y - sg2 * s * 0.75);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.stroke();
          ctx.fill();
        }
      }
    } else if (kind === 'constellation') {
      // ATHENA — constellation : une étoile toutes les 4 secondes, reliées, voile lavande dessous.
      var star = [];
      for (i = 0; i < n; i++) {
        var tk = candles[i].t;
        var sec = isFinite(tk) ? Math.round(tk / 1000) : i;
        if (sec % 4 === 0) star.push(pts[i]);
      }
      star.push([lastX, lastY]);
      if (star.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(star[0][0], star[0][1]);
        for (i = 1; i < star.length; i++) ctx.lineTo(star[i][0], star[i][1]);
        ctx.lineTo(lastX, floor); ctx.lineTo(star[0][0], floor); ctx.closePath();
        ctx.fillStyle = vGrad(minY, floor, [[0, rgba(M, 0.32)], [1, rgba(M, 0.02)]]);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(star[0][0], star[0][1]);
        for (i = 1; i < star.length; i++) ctx.lineTo(star[i][0], star[i][1]);
        ctx.strokeStyle = rgba(M, 0.75);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.fillStyle = rgba(X.star || '#FFFFFF', 0.55);
      for (i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 1.3, 0, Math.PI * 2); ctx.fill(); }
      for (i = 0; i < star.length - 1; i++) {
        x = star[i][0]; y = star[i][1]; s = 4.2 * k;
        ctx.fillStyle = rgba(M, 0.35);
        ctx.beginPath(); ctx.arc(x, y, s * 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = X.star || '#FFFFFF';
        ctx.beginPath();
        for (var sp = 0; sp < 10; sp++) {
          var sr = sp % 2 ? s * 0.42 : s;
          var sa = -Math.PI / 2 + sp * Math.PI / 5;
          if (sp) ctx.lineTo(x + Math.cos(sa) * sr, y + Math.sin(sa) * sr); else ctx.moveTo(x + Math.cos(sa) * sr, y + Math.sin(sa) * sr);
        }
        ctx.closePath();
        ctx.fill();
      }
    } else if (kind === 'lava') {
      // MOLOCH — coulée de lave : croûte brûlante, magma dessous, bulles qui remontent.
      areaPath();
      ctx.fillStyle = vGrad(minY, floor, [[0, rgba(M, 0.9)], [0.35, rgba(X.fill || '#B3200A', 0.7)], [1, rgba(X.fill || '#B3200A', 0.08)]]);
      ctx.fill();
      ctx.save();
      areaPath();
      ctx.clip();
      for (i = 0; i < n; i++) {
        sd = seeds[i];
        if (sd > 0.55) continue;
        var dep = floor - pts[i][1];
        if (dep < 12) continue;
        var by = floor - ((T * (10 + sd * 18) + sd * 400) % dep);
        ctx.globalAlpha = Math.min(1, (floor - by) / 30);
        ctx.fillStyle = sd < 0.2 ? '#FFE08A' : '#FF9A3C';
        ctx.beginPath(); ctx.arc(pts[i][0] + (sd - 0.3) * 6, by, 1.4 + sd * 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      crest(X.crust || '#FFE7A8', 3.6);
      crest('#3A0A00', 1, 0.5);
    } else if (kind === 'grass') {
      // OSIRIS — le dieu qui fait pousser : une touffe de trois brins par seconde, qui ondule au vent.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.35;
        var sway = Math.sin(T * 1.6 + seeds[i] * 12) * 0.18;
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        for (var b = -1; b <= 1; b++) {
          var lean = b * 0.45 + sway;
          var hgt = s * (b === 0 ? 1.15 : 0.85);
          var tx = x + Math.sin(lean) * hgt, ty = y - Math.cos(lean) * hgt;
          ctx.moveTo(x - 1.5 + b, y + 2);
          ctx.quadraticCurveTo(x + b * 0.5 + Math.sin(lean) * hgt * 0.3, y - hgt * 0.5, tx, ty);
          ctx.quadraticCurveTo(x + b * 0.5 + Math.sin(lean) * hgt * 0.45 + 1.8, y - hgt * 0.45, x + 1.5 + b, y + 2);
        }
        ctx.fill();
      }
    } else if (kind === 'glitch') {
      // LOKI — le farceur : blocs « glitch » décalés vert acide / magenta / cyan.
      var gw = Math.max(3, Math.min(14, slot * 0.86));
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; sd = seeds[i];
        var hgt2 = 3 + Math.min(8, moves[i] * 0.5);
        var jit = i >= n - 4 ? (Math.floor(T * 7 + sd * 10) % 3 - 1) * 1.4 : (sd - 0.5) * 3;
        ctx.fillStyle = 'rgba(255,40,200,0.75)';
        ctx.fillRect(x - gw / 2 + 2 + jit, y - hgt2 / 2 - 1, gw, hgt2);
        ctx.fillStyle = 'rgba(240,200,90,0.75)';
        ctx.fillRect(x - gw / 2 - 2 - jit, y - hgt2 / 2 + 1, gw, hgt2);
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.fillRect(x - gw / 2, y - hgt2 / 2, gw, hgt2);
        if (sd > 0.8) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - gw, y - 0.5 + (sd - 0.9) * 20, gw * 2, 1); }
      }
    } else if (kind === 'aurora') {
      // HEL — aurore boréale : rideau de lumière qui pend sous la courbe, vert ↔ violet qui ondule.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        var len = Math.max(18, (floor - y) * 0.75);
        var mix = 0.5 + 0.5 * Math.sin(x * 0.03 + T * 0.7);
        var cA = mix > 0.5 ? (X.fill || '#EFD39C') : M;
        var g2 = ctx.createLinearGradient(0, y, 0, y + len);
        g2.addColorStop(0, rgba(cA, 0.85));
        g2.addColorStop(0.25, rgba(cA, 0.45));
        g2.addColorStop(1, rgba(cA, 0));
        ctx.fillStyle = g2;
        var wid = slot * (0.55 + 0.4 * Math.abs(Math.sin(T * 1.3 + seeds[i] * 9)));
        ctx.fillRect(x - wid / 2, y, wid, len);
      }
      crest('#FFFFFF', 2.6, 0.9);
    } else if (kind === 'bats') {
      // ASTAROTH — nuée de chauves-souris qui battent des ailes.
      var B = [[0, -0.15], [-0.28, -0.5], [-0.5, -0.2], [-1, -0.55], [-0.82, 0.05], [-0.55, -0.02], [-0.32, 0.3], [0, 0.12], [0.32, 0.3], [0.55, -0.02], [0.82, 0.05], [1, -0.55], [0.5, -0.2], [0.28, -0.5]];
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.15;
        var flap = 0.7 + 0.35 * Math.sin(T * 7 + seeds[i] * 20);
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        for (var bp = 0; bp < B.length; bp++) {
          var bx = x + B[bp][0] * s, byy = y + B[bp][1] * s * (Math.abs(B[bp][0]) > 0.4 ? flap : 1);
          if (bp) ctx.lineTo(bx, byy); else ctx.moveTo(bx, byy);
        }
        ctx.closePath();
        ctx.fill();
      }
    } else if (kind === 'mandala') {
      // SHIVA — rosaces à six pétales qui tournent doucement (cyan à la hausse, rose à la baisse).
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 0.95;
        var rot2 = T * 0.8 * (dirs[i] ? 1 : -1) + seeds[i] * 3;
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        for (var pI = 0; pI < 6; pI++) {
          var pa = rot2 + pI * Math.PI / 3;
          ctx.moveTo(x + Math.cos(pa) * s * 0.5 + Math.cos(pa) * s * 0.48, y + Math.sin(pa) * s * 0.5 + Math.sin(pa) * s * 0.48);
          ctx.ellipse(x + Math.cos(pa) * s * 0.5, y + Math.sin(pa) * s * 0.5, s * 0.48, s * 0.2, pa, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(x, y, s * 0.2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'banners') {
      // ARES — étendards de guerre : une hampe par seconde, fanion qui claque au vent.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.2;
        ctx.strokeStyle = '#E8E2D0';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s * 1.5); ctx.stroke();
        var wv = Math.sin(T * 6 + seeds[i] * 20) * s * 0.12;
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.moveTo(x, y - s * 1.5);
        ctx.quadraticCurveTo(x + s * 0.5, y - s * 1.5 + wv, x + s * 1.05, y - s * 1.3 + wv);
        ctx.lineTo(x + s * 0.6, y - s * 1.12 + wv * 0.5);
        ctx.lineTo(x + s * 1.0, y - s * 0.9 + wv);
        ctx.quadraticCurveTo(x + s * 0.5, y - s * 1.0 - wv, x, y - s * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'crowns') {
      // PAIMON — le roi : une couronne par seconde, gemme au centre.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S;
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.moveTo(x - s, y + s * 0.55);
        ctx.lineTo(x - s, y - s * 0.6); ctx.lineTo(x - s * 0.5, y - s * 0.05); ctx.lineTo(x, y - s * 0.85);
        ctx.lineTo(x + s * 0.5, y - s * 0.05); ctx.lineTo(x + s, y - s * 0.6); ctx.lineTo(x + s, y + s * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x - s, y + s * 0.25, s * 2, s * 0.3);
        ctx.fillStyle = X.gem || '#FF2E6E';
        ctx.beginPath(); ctx.arc(x, y + s * 0.05, Math.max(1.2, s * 0.2), 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'eyes') {
      // HORUS — l'œil qui voit tout : pupille qui regarde en haut (hausse) ou en bas (baisse).
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.05;
        ctx.fillStyle = '#F4FFFE';
        ctx.beginPath();
        ctx.moveTo(x - s, y);
        ctx.quadraticCurveTo(x, y - s * 0.95, x + s, y);
        ctx.quadraticCurveTo(x, y + s * 0.95, x - s, y);
        ctx.fill();
        ctx.strokeStyle = M; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.fillStyle = dirs[i] ? U : D;
        var pyy = y + (dirs[i] ? -s * 0.15 : s * 0.15);
        ctx.beginPath(); ctx.arc(x, pyy, s * 0.36, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#04121A';
        ctx.beginPath(); ctx.arc(x, pyy, s * 0.15, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'gears') {
      // KRONOS — la mécanique du temps : un engrenage par seconde, ils tournent en sens inverse.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 0.95;
        var ga = T * (i % 2 ? 1.2 : -1.2) + seeds[i] * 6;
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        for (var tI = 0; tI < 16; tI++) {
          var r2 = tI % 4 < 2 ? s : s * 0.72;
          var aa = ga + tI * Math.PI / 8;
          if (tI) ctx.lineTo(x + Math.cos(aa) * r2, y + Math.sin(aa) * r2); else ctx.moveTo(x + Math.cos(aa) * r2, y + Math.sin(aa) * r2);
        }
        ctx.closePath();
        ctx.moveTo(x + s * 0.28, y);
        ctx.arc(x, y, s * 0.28, 0, Math.PI * 2, true);
        ctx.fill('evenodd');
      }
    } else if (kind === 'mosaic') {
      // BUER — mosaïque : tesselles carrées sous la courbe, trois tons qui s'éteignent en profondeur.
      var tsz = Math.max(4, Math.min(12, slot - 1.5));
      var tones = [M, X.fill || '#6EFFB4', X.gold || '#FFD36E'];
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        for (var row = 0; row < 7; row++) {
          var ty2 = y + row * (tsz + 1.5);
          if (ty2 > floor) break;
          var hv = extHash(Math.floor(seeds[i] * 1e6) + row * 131);
          ctx.globalAlpha = row === 0 ? 1 : Math.max(0.08, 0.7 - row * 0.1);
          ctx.fillStyle = row === 0 ? (dirs[i] ? U : D) : tones[Math.floor(hv * 3)];
          ctx.fillRect(x - tsz / 2, ty2 - tsz / 2, tsz, tsz);
        }
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'tide') {
      // POSEIDON — la marée : mer sous la courbe, crête d'écume qui ondule, houle dessous.
      areaPath();
      ctx.fillStyle = vGrad(minY, floor, [[0, rgba(M, 0.6)], [0.5, rgba(X.fill || '#9A6F19', 0.45)], [1, rgba(X.fill || '#9A6F19', 0.05)]]);
      ctx.fill();
      var waveLine = function (off, amp, ph, col, wd, al) {
        ctx.beginPath();
        for (var q = 0; q < ends.length; q++) {
          var yy = ends[q][1] + off + Math.sin(ends[q][0] * 0.18 - T * 2.4 + ph) * amp;
          if (q) ctx.lineTo(ends[q][0], yy); else ctx.moveTo(ends[q][0], yy);
        }
        ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.globalAlpha = al; ctx.stroke(); ctx.globalAlpha = 1;
      };
      waveLine(14, 2, 1.5, '#FFFFFF', 1.4, 0.25);
      waveLine(26, 2.4, 3, '#FFFFFF', 1.2, 0.15);
      waveLine(0, 1.2, 0, '#E9FFFF', 3.2, 1);
    } else if (kind === 'dunes') {
      // SETH — dunes du désert rouge : trois couches de sable décalées, grains soufflés par le vent.
      var layer = function (off, col, al) {
        ctx.beginPath();
        ctx.moveTo(ends[0][0], ends[0][1] + off);
        for (var q = 1; q < ends.length; q++) {
          var mxx = (ends[q - 1][0] + ends[q][0]) / 2, myy = (ends[q - 1][1] + ends[q][1]) / 2 + off;
          ctx.quadraticCurveTo(ends[q - 1][0], ends[q - 1][1] + off, mxx, myy);
        }
        ctx.lineTo(lastX, lastY + off);
        ctx.lineTo(lastX, floor); ctx.lineTo(ends[0][0], floor); ctx.closePath();
        ctx.fillStyle = rgba(col, al);
        ctx.fill();
      };
      layer(0, M, 0.85);
      layer(9, X.fill || '#E2602B', 0.85);
      layer(20, X.deep || '#7A1E14', 0.85);
      ctx.fillStyle = '#FFE3B0';
      for (i = 0; i < n; i++) {
        sd = seeds[i];
        if (sd > 0.6) continue;
        var drift = ((T * (25 + sd * 30) + sd * 300) % 40);
        ctx.globalAlpha = 1 - drift / 40;
        ctx.fillRect(pts[i][0] + drift, pts[i][1] - 2 - sd * 6 - drift * 0.15, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'fans') {
      // AMATERASU — éventails du soleil levant : ouverts vers le haut à la hausse, vers le bas à la baisse.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.15;
        var a0f = dirs[i] ? Math.PI : 0;
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s, a0f, a0f + Math.PI); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(80,10,0,0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var fr = 1; fr < 5; fr++) { var fa = a0f + fr * Math.PI / 5; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(fa) * s, y + Math.sin(fa) * s); }
        ctx.stroke();
        ctx.fillStyle = '#FFF4D6';
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'spirals') {
      // BAPHOMET — cornes de bélier : une spirale par seconde, qui tourne dans le sens du mouvement.
      ctx.lineWidth = Math.max(1.6, S * 0.26);
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.0;
        var sg3 = dirs[i] ? 1 : -1;
        var r0s = T * 1.5 * sg3 + seeds[i] * 6;
        ctx.strokeStyle = dirs[i] ? U : D;
        ctx.beginPath();
        for (var st = 0; st <= 18; st++) {
          var u = st / 18;
          var aS = r0s + sg3 * u * Math.PI * 3;
          var rr = s * (0.1 + 0.9 * u);
          if (st) ctx.lineTo(x + Math.cos(aS) * rr, y + Math.sin(aS) * rr); else ctx.moveTo(x + Math.cos(aS) * rr, y + Math.sin(aS) * rr);
        }
        ctx.stroke();
      }
    } else if (kind === 'drops') {
      // HYDRA — gouttes de venin : une goutte par seconde, certaines coulent vers le bas.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 0.95;
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.moveTo(x, y - s * 1.2);
        ctx.bezierCurveTo(x + s * 0.2, y - s * 0.6, x + s * 0.75, y - s * 0.1, x + s * 0.75, y + s * 0.3);
        ctx.arc(x, y + s * 0.3, s * 0.75, 0, Math.PI, false);
        ctx.bezierCurveTo(x - s * 0.75, y - s * 0.1, x - s * 0.2, y - s * 0.6, x, y - s * 1.2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc(x - s * 0.28, y + s * 0.15, s * 0.18, 0, Math.PI * 2); ctx.fill();
        if (seeds[i] < 0.3) {
          var fall = (T * 22 + seeds[i] * 200) % 46;
          ctx.globalAlpha = 1 - fall / 46;
          ctx.fillStyle = dirs[i] ? U : D;
          ctx.beginPath(); ctx.arc(x, y + s + 3 + fall, Math.max(1.2, s * 0.28), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    } else if (kind === 'notes') {
      // ORPHEUS — la lyre : une note de musique par seconde (queue en haut à la hausse, en bas à la baisse),
      // les notes voisines de même sens sont liées par une ligature.
      var nh = Math.max(2.6, S * 0.55);
      var stems = [];
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath(); ctx.ellipse(x, y, nh, nh * 0.7, -0.35, 0, Math.PI * 2); ctx.fill();
        var sxx = dirs[i] ? x + nh * 0.9 : x - nh * 0.9;
        var syy = dirs[i] ? y - nh * 3.6 : y + nh * 3.6;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(sxx, y); ctx.lineTo(sxx, syy); ctx.stroke();
        stems.push([sxx, syy, dirs[i]]);
      }
      ctx.lineWidth = Math.max(2.2, nh * 0.7);
      ctx.lineCap = 'butt';
      for (i = 1; i < n; i += 2) {
        if (stems[i][2] !== stems[i - 1][2]) {
          ctx.strokeStyle = stems[i - 1][2] ? U : D;
          ctx.beginPath(); ctx.moveTo(stems[i - 1][0], stems[i - 1][1]); ctx.quadraticCurveTo(stems[i - 1][0] + nh * 1.4, stems[i - 1][1] + (stems[i - 1][2] ? nh : -nh), stems[i - 1][0] + nh * 1.2, stems[i - 1][1] + (stems[i - 1][2] ? nh * 2 : -nh * 2)); ctx.stroke();
          continue;
        }
        ctx.strokeStyle = stems[i][2] ? U : D;
        ctx.beginPath(); ctx.moveTo(stems[i - 1][0], stems[i - 1][1]); ctx.lineTo(stems[i][0], stems[i][1]); ctx.stroke();
      }
    } else if (kind === 'cubes') {
      // ABADDON — blocs de l'abîme : un cube en 3D par seconde (dessus clair, faces ombrées).
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 0.8;
        var cc = dirs[i] ? U : D;
        ctx.fillStyle = cc;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s, y - s * 0.55); ctx.lineTo(x - s, y + s * 0.6); ctx.lineTo(x, y + s * 1.15); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s, y - s * 0.55); ctx.lineTo(x + s, y + s * 0.6); ctx.lineTo(x, y + s * 1.15); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.fill();
        ctx.fillStyle = cc;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s, y - s * 0.55); ctx.lineTo(x, y - s * 1.1); ctx.lineTo(x + s, y - s * 0.55); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
      }
    } else if (kind === 'hearts') {
      // FREYA — cœurs qui battent : rose à la hausse, nacre à la baisse.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        s = S * 0.95 * (1 + 0.1 * Math.sin(T * 5 + seeds[i] * 12));
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.85);
        ctx.bezierCurveTo(x - s * 1.25, y, x - s * 0.7, y - s * 1.05, x, y - s * 0.4);
        ctx.bezierCurveTo(x + s * 0.7, y - s * 1.05, x + s * 1.25, y, x, y + s * 0.85);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(x - s * 0.42, y - s * 0.32, s * 0.18, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'bubbles') {
      // LEVIATHAN — bulles des abysses : une bulle par seconde (plus grosse si ça bouge), petites bulles qui remontent.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        s = Math.max(2.8, Math.min(S * 1.25, S * 0.6 + moves[i] * 0.25));
        var bc = dirs[i] ? U : D;
        ctx.fillStyle = rgba(bc, 0.22);
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = bc; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(x - s * 0.38, y - s * 0.38, Math.max(0.8, s * 0.2), 0, Math.PI * 2); ctx.fill();
        if (seeds[i] < 0.4) {
          var rise = (T * 16 + seeds[i] * 300) % 40;
          ctx.globalAlpha = 1 - rise / 40;
          ctx.strokeStyle = bc; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x + Math.sin(T * 3 + seeds[i] * 9) * 3, y - s - 3 - rise, 1.6 + seeds[i] * 3, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    } else if (kind === 'speed') {
      // HERMES — le messager : chaque seconde laisse trois traînées de vitesse derrière elle.
      var sl = Math.max(6, slot * 1.4);
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        var sc = dirs[i] ? U : D;
        ctx.strokeStyle = sc;
        ctx.lineCap = 'round';
        ctx.lineWidth = 2.6; ctx.globalAlpha = 0.95;
        ctx.beginPath(); ctx.moveTo(x - sl, y); ctx.lineTo(x, y); ctx.stroke();
        ctx.lineWidth = 1.6; ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.moveTo(x - sl * 0.7, y - 3.4); ctx.lineTo(x - 1.5, y - 3.4); ctx.moveTo(x - sl * 0.55, y + 3.4); ctx.lineTo(x - 1.5, y + 3.4); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'hive') {
      // BEELZEBUB — la ruche : une alvéole hexagonale par seconde, miel dedans.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 0.95;
        var hc = dirs[i] ? U : D;
        ctx.beginPath();
        for (var hI = 0; hI < 6; hI++) {
          var ha = hI * Math.PI / 3;
          if (hI) ctx.lineTo(x + Math.cos(ha) * s, y + Math.sin(ha) * s); else ctx.moveTo(x + Math.cos(ha) * s, y + Math.sin(ha) * s);
        }
        ctx.closePath();
        ctx.fillStyle = rgba(hc, 0.35); ctx.fill();
        ctx.strokeStyle = hc; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = hc;
        ctx.beginPath(); ctx.arc(x, y, s * 0.3, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'sparkles') {
      // MARDUK — éclats d'étoile à quatre branches, qui scintillent (plus grands quand ça bouge).
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        s = Math.max(3, Math.min(S * 1.5, S * 0.8 + moves[i] * 0.3)) * (0.85 + 0.15 * Math.sin(T * 4 + seeds[i] * 20));
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s * 0.7, y); ctx.quadraticCurveTo(x, y, x, y + s);
        ctx.quadraticCurveTo(x, y, x - s * 0.7, y); ctx.quadraticCurveTo(x, y, x, y - s);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.8, s * 0.14), 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'scales') {
      // TIAMAT — peau de dragon : écailles sous la courbe (violet → indigo), arête dorsale en dents.
      areaPath();
      ctx.fillStyle = vGrad(minY, floor, [[0, rgba(M, 0.75)], [0.6, rgba(X.fill || '#CF982B', 0.45)], [1, rgba(X.fill || '#CF982B', 0.08)]]);
      ctx.fill();
      ctx.save();
      areaPath();
      ctx.clip();
      ctx.fillStyle = extPattern('scales', 14, 10, function (g) {
        g.strokeStyle = 'rgba(255,255,255,0.35)';
        g.lineWidth = 1.2;
        g.beginPath(); g.arc(7, 0, 6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
        g.beginPath(); g.arc(0, 5, 6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
        g.beginPath(); g.arc(14, 5, 6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
      });
      ctx.fillRect(pad.l, minY, lastX - pad.l + 2, floor - minY);
      ctx.restore();
      ctx.fillStyle = X.spine || '#FFD36E';
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = Math.max(2.4, S * 0.6);
        ctx.beginPath(); ctx.moveTo(x - s * 0.6, y + 1); ctx.lineTo(x + s * 0.2, y - s * 1.2); ctx.lineTo(x + s * 0.6, y + 1); ctx.closePath(); ctx.fill();
      }
    } else if (kind === 'wave') {
      // RAIJIN — tambours du tonnerre : onde sonore, une barre arrondie centrée sur le prix (plus haute si ça bouge fort).
      var bw = Math.max(2.4, Math.min(7, slot * 0.4));
      ctx.lineWidth = bw;
      ctx.lineCap = 'round';
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        var hh3 = 3 + Math.min(S * 2.4, moves[i] * 0.9) + 2 * Math.abs(Math.sin(T * 9 + seeds[i] * 30)) * (i >= n - 6 ? 1 : 0);
        ctx.strokeStyle = dirs[i] ? U : D;
        ctx.beginPath(); ctx.moveTo(x, y - hh3); ctx.lineTo(x, y + hh3); ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(x, y, Math.max(1, bw * 0.3), 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'feathers') {
      // SAMAEL — plumes d'ange déchu : une plume par seconde, penchée selon le sens, qui se balance.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.3;
        var tilt = (dirs[i] ? -0.6 : 0.6) + Math.sin(T * 1.8 + seeds[i] * 10) * 0.12;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tilt);
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.48, -s * 0.2, 0, s * 0.8);
        ctx.quadraticCurveTo(-s * 0.48, -s * 0.2, 0, -s);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,0,8,0.6)';
        ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(0, -s * 0.85); ctx.lineTo(0, s * 1.05);
        ctx.moveTo(0, -s * 0.2); ctx.lineTo(s * 0.25, -s * 0.45); ctx.moveTo(0, s * 0.15); ctx.lineTo(-s * 0.25, -s * 0.1);
        ctx.stroke();
        ctx.restore();
      }
    } else if (kind === 'jaws') {
      // CERBERUS — la gueule des enfers : mâchoire rouge sombre au-dessus de la courbe, crocs qui pointent sur le prix.
      areaPath(false);
      ctx.fillStyle = vGrad(top, Math.max(top + 2, minY + 30), [[0, rgba(X.fill || '#7A0E0E', 0.05)], [1, rgba(X.fill || '#7A0E0E', 0.6)]]);
      ctx.fill();
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1];
        var fw = Math.max(2.4, Math.min(slot * 0.5, 7)), fh = Math.max(5, S * 1.4);
        ctx.fillStyle = dirs[i] ? (X.fang || '#FFF4E0') : D;
        ctx.beginPath(); ctx.moveTo(x - fw, y - fh); ctx.lineTo(x + fw, y - fh); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
      }
      crest(M, 3, 0.95);
    } else if (kind === 'halftone') {
      // MEPHISTO — trame de bande dessinée : points rose vif sous la courbe, de plus en plus fins en profondeur.
      var gs = 6;
      var x0h = Math.ceil(pad.l / gs) * gs;
      var seg = 0;
      ctx.fillStyle = M;
      ctx.beginPath();
      for (x = x0h; x <= lastX; x += gs) {
        while (seg < ends.length - 2 && ends[seg + 1][0] < x) seg++;
        var e0 = ends[seg], e1 = ends[Math.min(ends.length - 1, seg + 1)];
        var fx = e1[0] > e0[0] ? Math.max(0, Math.min(1, (x - e0[0]) / (e1[0] - e0[0]))) : 0;
        var cy2 = e0[1] + (e1[1] - e0[1]) * fx;
        var yStart = Math.ceil(cy2 / gs) * gs + ((x / gs) % 2 ? gs / 2 : 0);
        for (var rr2 = 0; rr2 < 9; rr2++) {
          var yy3 = yStart + rr2 * gs;
          if (yy3 > floor) break;
          var dR = 2.6 * (1 - rr2 / 9) + 0.3;
          ctx.moveTo(x + dR, yy3);
          ctx.arc(x, yy3, dR, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      for (i = 0; i < n; i++) {
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 2.8, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'ankh') {
      // SPHINX — croix de vie égyptiennes, or à la hausse, lapis à la baisse.
      ctx.lineWidth = Math.max(1.8, S * 0.3);
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.05;
        ctx.strokeStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.ellipse(x, y - s * 0.55, s * 0.32, s * 0.42, 0, 0, Math.PI * 2);
        ctx.moveTo(x - s * 0.6, y); ctx.lineTo(x + s * 0.6, y);
        ctx.moveTo(x, y - s * 0.13); ctx.lineTo(x, y + s * 1.0);
        ctx.stroke();
      }
    } else if (kind === 'ink') {
      // KRAKEN — encre de pieuvre : une tache d'encre par seconde, éclaboussures et coulures.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 0.95; sd = seeds[i];
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        for (var v = 0; v < 8; v++) {
          var va = v * Math.PI / 4;
          var vr = s * (0.7 + 0.45 * extHash(Math.floor(sd * 1e6) + v));
          if (v) ctx.lineTo(x + Math.cos(va) * vr, y + Math.sin(va) * vr); else ctx.moveTo(x + Math.cos(va) * vr, y + Math.sin(va) * vr);
        }
        ctx.closePath();
        ctx.fill();
        if (sd < 0.35) {
          var dl = s * (1.2 + sd * 4);
          ctx.fillRect(x - 0.9, y, 1.8, dl);
          ctx.beginPath(); ctx.arc(x, y + dl, 1.8, 0, Math.PI * 2); ctx.fill();
        }
        if (sd > 0.7) { ctx.beginPath(); ctx.arc(x + s * 1.4, y - s * 0.8, 1.3, 0, Math.PI * 2); ctx.fill(); }
      }
    } else if (kind === 'flames') {
      // PHOENIX — langues de feu vives qui dansent (or à la hausse, rouge vif à la baisse), cœur blanc-jaune.
      for (i = 0; i < n; i++) {
        x = pts[i][0]; y = pts[i][1]; s = S * 1.05;
        var fl = 1 + 0.22 * Math.sin(T * 11 + seeds[i] * 40);
        var lean2 = Math.sin(T * 4 + seeds[i] * 9) * s * 0.18;
        ctx.fillStyle = dirs[i] ? U : D;
        ctx.beginPath();
        ctx.moveTo(x + lean2, y - s * 1.5 * fl);
        ctx.bezierCurveTo(x + s * 0.9, y - s * 0.4, x + s * 0.75, y + s * 0.6, x, y + s * 0.6);
        ctx.bezierCurveTo(x - s * 0.75, y + s * 0.6, x - s * 0.9, y - s * 0.4, x + lean2, y - s * 1.5 * fl);
        ctx.fill();
        ctx.fillStyle = '#FFF6B0';
        ctx.beginPath();
        ctx.moveTo(x + lean2 * 0.6, y - s * 0.6 * fl);
        ctx.bezierCurveTo(x + s * 0.4, y - s * 0.1, x + s * 0.35, y + s * 0.45, x, y + s * 0.45);
        ctx.bezierCurveTo(x - s * 0.35, y + s * 0.45, x - s * 0.4, y - s * 0.1, x + lean2 * 0.6, y - s * 0.6 * fl);
        ctx.fill();
      }
    }
    ctx.restore();
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: n };
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

  function drawCoreLine(pad, w, h, data, minP, maxP, color, width, glow) {
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
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 8;
    } else if (col === '#ff2244' || col === '#ff2d75') {
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

  function drawLine(pad, w, h, data, minP, maxP, color, fillRgb) {
    var fr = fillRgb || '245,166,35';
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
    grad.addColorStop(0, 'rgba(' + fr + ',0.28)');
    grad.addColorStop(1, 'rgba(' + fr + ',0)');
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
    ctx.shadowColor = 'rgba(' + fr + ',0.85)';
    ctx.shadowBlur = fillRgb ? 8 : 14;
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
      ctx.strokeStyle = useAccent ? accent : (color || '#E2B04C');
      ctx.lineWidth = width || 3;
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
      ctx.stroke();
      if (falling) {
        ctx.strokeStyle = color || '#E2B04C';
      }
    }
    var lastX = panMs > 0 ? toX(data.length - 1) : pad.l + w;
    var lastY = toY(data[data.length - 1]);
    ctx.beginPath();
    ctx.moveTo(toX(data.length - 1), lastY);
    ctx.lineTo(lastX, lastY);
    ctx.strokeStyle = color || '#E2B04C';
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
    ctx.fillStyle = 'rgba(221,173,78, 0.08)';
    ctx.fill();
    started = false;
    ctx.beginPath();
    for (i = 0; i < up.length; i++) {
      if (up[i] == null) continue;
      if (!started) { ctx.moveTo(map.toX(i), map.toY(up[i])); started = true; }
      else ctx.lineTo(map.toX(i), map.toY(up[i]));
    }
    ctx.strokeStyle = 'rgba(221,173,78,0.65)';
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
    ctx.strokeStyle = last >= 70 ? '#FF1744' : last <= 30 ? '#00E676' : '#DDAD4E';
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
    ctx.strokeStyle = '#E8C172';
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
    ctx.strokeStyle = '#DB9E24';
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
    // v2480 — objectif au-dessus de l'écran (ACHETER) : le trait se colle au même niveau que son étiquette, sous le titre
    // OROLADO (avant : trait tout en haut et étiquette plus bas, séparés). Même chose que pour VENDRE en bas.
    if (by < plotTop + 9) { by = plotTop + 26.5; off = -1; }
    else if (by < plotTop + 26.5) by = plotTop + 26.5;
    if (by > plotBot - 9) { by = plotBot - 9; off = 1; }
    by = Math.round(by * 2) / 2;
    // v2463 — ligne objectif DORÉE (comme expliqué dans le guide), avec une lueur ; l'étiquette garde la couleur du trade.
    // Objectif hors de l'écran : pas de trait collé au bord (il passait sur le titre OROLADO) : seule l'étiquette ▲ / ▼ reste.
    var tCol = '#F5C518';
    g.save();
    // v2476 (demande du propriétaire) : objectif loin (hors écran) = la ligne revient, collée au bord, mais en tirets dorés
    // fins et légers : on la voit (« l'objectif est plus loin ») sans qu'elle gêne le titre OROLADO.
    g.globalAlpha = (off ? 0.42 : 0.95) * (fade == null ? 1 : fade);
    g.setLineDash(off ? [7, 7] : TARGET_DASH);
    g.strokeStyle = tCol;
    g.shadowColor = tCol;
    g.shadowBlur = off ? 2 : (IS_ANDROID_CHART ? 4 : 7);
    g.lineWidth = off ? 1.2 : (IS_ANDROID_CHART ? 1.6 : 2);
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
    // v2393 : on garde le sens du trade pour colorier l'étiquette (vert ACHAT / rouge VENTE).
    targetTagQueue.push({ mult: Math.round(mult * 10) / 10, bar: bar, by: by, off: off, fade: fade == null ? 1 : fade, pad: pad, layout: layout, top: plotTop, bot: plotBot, side: trade && trade.side === 'put' ? 'put' : 'call' });
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
      // v2453 — chrono en petite planète transparente (vert = ACHAT, rouge = VENTE) ; la lueur autour se vide
      // avec le temps qui reste ; les secondes comptent au centre.
      var ccx = c.x + c.w / 2, ccy = c.y + c.h / 2, cr = c.w / 2 - 3;
      var cgr = g.createRadialGradient(ccx - cr * 0.35, ccy - cr * 0.4, 1, ccx, ccy, cr);
      cgr.addColorStop(0, c.call ? 'rgba(187,247,208,0.75)' : 'rgba(254,205,211,0.75)');
      cgr.addColorStop(0.55, c.call ? 'rgba(22,163,74,0.62)' : 'rgba(225,29,72,0.62)');
      cgr.addColorStop(1, c.call ? 'rgba(6,60,30,0.7)' : 'rgba(90,10,25,0.7)');
      g.fillStyle = cgr;
      g.beginPath();
      g.arc(ccx, ccy, cr, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2.6;
      g.strokeStyle = 'rgba(255,255,255,0.18)';
      g.beginPath();
      g.arc(ccx, ccy, cr + 1.5, 0, Math.PI * 2);
      g.stroke();
      var cf = c.frac == null ? 1 : c.frac;
      if (cf > 0) {
        g.strokeStyle = c.call ? '#4ADE80' : '#FB7185';
        g.shadowColor = c.call ? 'rgba(74,222,128,0.9)' : 'rgba(251,113,133,0.9)';
        g.shadowBlur = 6;
        g.lineCap = 'round';
        g.beginPath();
        g.arc(ccx, ccy, cr + 1.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cf);
        g.stroke();
        g.shadowBlur = 0;
      }
      g.fillStyle = '#FFFFFF';
      g.font = '800 ' + (c.label.length > 3 ? '7.5' : '8.5') + 'px "Hanken Grotesk", sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(c.label, ccx, ccy + 0.5);
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
      var key = t.entry ? 'e|' + t.off + '|' + t.side : (t.off !== 0 ? t.off + '|' + t.mult + '|' + t.side : '0|' + t.mult + '|' + t.side + '|' + Math.round(t.by / 14));
      var gr = byKey[key];
      // v2845 (propriétaire) : objectifs proches à l'écran = UNE étiquette posée sur leur trait, avec le nombre (· 2, · 3…),
      // comme les ronds des secondes qui s'empilent — plus d'étiquettes écartées loin de leurs traits.
      // v2848 (propriétaire) : chaque clic = SA propre étiquette sur SA ligne, posées les unes sur les autres comme les ronds
      // des secondes ; plus de regroupement ni de compteur (« · 3 »).
      if (!t.entry) { gr = null; key = 'u' + i; }
      if (false) {
        for (var q = 0; q < groups.length; q++) {
          var o = groups[q];
          if (!o.entry && o.off === 0 && o.side === t.side && o.mult === t.mult && Math.abs(o.by - t.by) < 14) { gr = o; break; }
        }
        if (gr) byKey[key] = gr;
      }
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
      if (it.n > 1 && it.entry) label += ' · ' + it.n;
      // v2463 — en haut, les étiquettes restent SOUS le petit titre « OROLADO.com » (elles ne le couvrent plus).
      var top = it.top + 20;
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
      // Objectif à l'écran : l'étiquette reste SUR son trait (elle peut chevaucher une autre, comme les ronds).
      if (!it.entry) { ty = Math.max(top, Math.min(bot, ty)); hit = false; }
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
      // v2393 : l'étiquette de la ligne objectif prend aussi la couleur du trade (avant : toujours verte).
      // v2453 — étiquette en verre : fond sombre transparent, bord de la couleur du trade.
      g.fillStyle = it.side === 'put' ? 'rgba(90,10,30,0.72)' : 'rgba(6,60,30,0.72)';
      roundRectOn(g, tx, ty, tw, H, H / 2);
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = it.side === 'put' ? 'rgba(251,113,133,0.95)' : 'rgba(74,222,128,0.95)';
      // v2481 (demande du propriétaire) : étiquette d'OBJECTIF (×5, ×10, ×50) bordée de DORÉ, comme sa ligne : on sait tout de
      // suite que c'est l'objectif. L'intérieur, le texte et le triangle restent vert (ACHETER) ou rouge (VENDRE).
      if (!it.entry) { g.strokeStyle = '#F5C518'; g.lineWidth = 1.4; g.setLineDash([3, 2]); }
      g.stroke();
      g.setLineDash(NO_DASH);
      // v2461 — texte (et triangle ▲ / ▼) de la couleur du trade.
      g.fillStyle = it.side === 'put' ? '#FFC2CC' : '#B9FFD9';
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
    // v2817 (propriétaire : « le trait s'affiche puis bouge ») : en RÉEL le serveur fixe l'entrée au prix de l'ARRIVÉE
    // de l'ordre (sécurité v2814). Le rond ne se pose donc plus au clic : il reste collé au bout de la courbe
    // (suivi v2353) jusqu'au vrai point d'entrée, et la zone + la ligne d'arrivée n'apparaissent qu'une fois
    // confirmées, à leur vraie place : plus de double trait ni de sursaut. Démo : inchangé (prix du clic).
    // 2026-10-19 (propriétaire) : le serveur reprend le prix du CLIC en réel aussi → rond, zone et lignes au clic, d'un coup.
    // v2831 : en réel, seulement si le serveur va prendre le prix du clic (trade.clickOk, js/engine.js) ; sinon suivi v2817.
    var clickMode = (trade.mode !== 'real' || trade.clickOk !== false) && shownPrice[trade.id] > 0 && shownMarks[trade.id] > 1;
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
    // v2453 — chaque trade a sa zone (jusqu'à 3 à la fois), de plus en plus légère : 1er plein, 2e et 3e plus légers.
    // Dessin seulement : les prix, l'objectif et le résultat ne changent pas.
    var zoneK = idx === 0 ? 1 : idx === 1 ? 0.6 : 0.38;
    if (idx < 3 && !(trade.pending && riding)) {
      // Zone gagnante : au-dessus de la ligne (CALL) ou en dessous (PUT), très légère.
      var refP = bar > 0 ? bar : entry;
      var zy = priceToY(refP, pad, plotH, minP, maxP);
      // v2470 — objectif HORS de l'écran (ex. 5000 % sur 10 min) : la zone gagnante est entièrement hors de l'écran,
      // on ne dessine rien (avant : un trait coloré collé tout en haut, sur le titre OROLADO, qui s'allongeait).
      if (isFinite(zy) && zy > plotTop + 2 && zy < plotBot - 2) {
        zy = Math.max(plotTop, Math.min(plotBot, zy));
        g.save();
        // Seule l'ombre marque l'objectif (aucun second trait) : plus dense au bord.
        // v2461 — comme les grandes plateformes : la zone va du point d'entrée jusqu'à la ligne d'arrivée (pas toute la largeur).
        var zStart = shownMarks[trade.id] > 1 ? shownMarks[trade.id] : (Number(trade.startTime) || glide.start || tNowE);
        var zx0 = winE > 0 ? layout.headX - layout.seriesW * ((tNowE - zStart) / winE) : pad.l;
        var zx1 = winE > 0 ? Math.min(layout.axisX - 4, layout.headX + layout.seriesW * ((exp - tNowE) / winE)) : layout.axisX;
        if (!isFinite(zx0) || zx0 < pad.l) zx0 = pad.l;
        if (!isFinite(zx1) || zx1 > layout.axisX) zx1 = layout.axisX;
        var zw = Math.max(2, zx1 - zx0);
        var zg;
        g.globalAlpha = lineFade * zoneK;
        // v2463b — comme les grandes plateformes : la couleur reste une BANDE près de la ligne à dépasser
        // (entre l'entrée et l'arrivée), forte au bord et qui s'efface vite ; elle ne remplit plus toute la hauteur.
        var zc = isCall ? '0,230,118' : '255,59,48';
        var bandH = Math.max(34, Math.min(70, plotH * 0.3));
        var by0 = isCall ? Math.max(plotTop, zy - bandH) : zy;
        var by1 = isCall ? zy : Math.min(plotBot, zy + bandH);
        zg = g.createLinearGradient(0, zy, 0, isCall ? zy - bandH : zy + bandH);
        zg.addColorStop(0, 'rgba(' + zc + ',0.30)');
        zg.addColorStop(0.45, 'rgba(' + zc + ',0.12)');
        zg.addColorStop(1, 'rgba(' + zc + ',0)');
        g.fillStyle = zg;
        if (by1 > by0) g.fillRect(zx0, by0, zw, by1 - by0);
        // Bord lumineux de la zone (la limite à dépasser) + halo doux vers l'arrivée. Dessin seulement.
        g.globalAlpha = lineFade * zoneK;
        g.shadowColor = 'rgba(' + zc + ',0.9)';
        g.shadowBlur = lite ? 4 : 9;
        g.strokeStyle = 'rgba(' + zc + ',0.85)';
        g.lineWidth = lite ? 1.4 : 1.8;
        // v2470 — bord de la zone en TIRETS, comme toutes les lignes de la courbe.
        g.setLineDash([6, 5]);
        g.beginPath();
        g.moveTo(zx0, zy);
        g.lineTo(zx0 + zw, zy);
        g.stroke();
        g.setLineDash(NO_DASH);
        g.shadowBlur = 0;
        var hw = Math.min(zw, 46);
        var hg = g.createLinearGradient(zx0 + zw - hw, 0, zx0 + zw, 0);
        hg.addColorStop(0, 'rgba(' + zc + ',0)');
        hg.addColorStop(1, 'rgba(' + zc + ',0.14)');
        g.fillStyle = hg;
        if (by1 > by0) g.fillRect(zx0 + zw - hw, by0, hw, by1 - by0);
        g.restore();
      }
      // Ligne d'arrivée verticale : l'instant exact où le trade se termine.
      if (winE > 0) {
        var fx = layout.headX + layout.seriesW * ((exp - tNowE) / winE);
        var fOut = fx > layout.axisX - 4;
        if (fOut) fx = layout.axisX - 4;
        g.save();
        g.globalAlpha = zoneK;
        // v2453 — ligne d'arrivée dorée (champagne) avec un petit rond-chrono à la place du drapeau.
        g.setLineDash([3, 4]);
        g.strokeStyle = 'rgba(255,226,140,' + (fOut ? '0.4' : '0.75') + ')';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(fx, plotTop + 18);
        g.lineTo(fx, plotBot);
        g.stroke();
        g.setLineDash(NO_DASH);
        var fcx = fOut ? fx - 8 : fx;
        var fcy = plotTop + 10;
        var fgr = g.createRadialGradient(fcx - 2.5, fcy - 3, 0.5, fcx, fcy, 8);
        fgr.addColorStop(0, '#FFF6DA');
        fgr.addColorStop(0.5, '#F5C451');
        fgr.addColorStop(1, '#9A6410');
        g.shadowColor = 'rgba(245,197,81,0.8)';
        g.shadowBlur = 8;
        g.fillStyle = fgr;
        g.beginPath();
        g.arc(fcx, fcy, 7.5, 0, Math.PI * 2);
        g.fill();
        g.shadowBlur = 0;
        g.strokeStyle = '#2A1600';
        g.lineWidth = 1.4;
        g.lineCap = 'round';
        g.beginPath();
        g.arc(fcx, fcy, 4.2, 0, Math.PI * 2);
        g.moveTo(fcx, fcy);
        g.lineTo(fcx, fcy - 2.8);
        g.moveTo(fcx, fcy);
        g.lineTo(fcx + 2, fcy + 0.6);
        g.stroke();
        g.restore();
      }
    }
    // v2818 (propriétaire : « la ligne de mise et la ligne objectif basculent un tout petit peu ensemble ») : en RÉEL,
    // pendant que le rond suit le bout de la courbe (attente du vrai prix d'entrée, ~0,5 s), les deux lignes ne sont
    // pas dessinées ; elles apparaissent ensuite UNE fois, à leur vraie place, avec un court fondu, et ne bougent plus.
    var hideLines = riding && trade.mode === 'real' && !clickMode;
    if (!hideLines && trade.mode === 'real' && rs && rs.end) lineFade *= Math.min(1, Math.max(0.15, (Date.now() - rs.end) / 220));
    if (!hideLines) {
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
    if (!hideLines) drawTargetLine(g, trade, bar, entry, pad, plotH, minP, maxP, plotTop, plotBot, layout, idx, lineFade);
    if (eOff && !hideLines) {
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
    // v2453 — rond d'entrée en petite planète lumineuse (vert ACHAT / rouge VENTE). Même place, même taille.
    var pgr = g.createRadialGradient(mx - r * 0.35, ey - r * 0.4, r * 0.1, mx, ey, r);
    pgr.addColorStop(0, isCall ? '#BBF7D0' : '#FECDD3');
    pgr.addColorStop(0.5, isCall ? '#16C25E' : '#F43F5E');
    pgr.addColorStop(1, fillCol);
    g.shadowColor = isCall ? 'rgba(34,197,94,0.85)' : 'rgba(244,63,94,0.85)';
    g.shadowBlur = lite ? 6 : 10;
    g.beginPath();
    g.arc(mx, ey, r, 0, Math.PI * 2);
    g.fillStyle = pgr;
    g.globalAlpha = 1;
    g.fill();
    g.shadowBlur = 0;
    g.lineWidth = 1.2;
    g.strokeStyle = 'rgba(255,255,255,0.9)';
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
    // v2558 (propriétaire) : un chrono pour CHAQUE trade, posé sur sa propre ligne (avant : 3 au plus).
    if (idx > 40) return;
    if (secs >= 0.15) {
      // v2453 — chrono en petite planète : secondes au centre (m:ss à partir d'une minute), lueur qui fait le tour.
      var sInt = Math.max(1, Math.ceil(secs));
      var label = sInt >= 60 ? (Math.floor(sInt / 60) + ':' + ('0' + (sInt % 60)).slice(-2)) : (sInt + 's');
      if (label.charAt(0) !== '-') {
        var timerW = 26;
        var timerH = 26;
        var leftX = (pad && pad.l != null ? pad.l : 8) + 4;
        var ty = ey - timerH / 2; // v2557 : pile sur la ligne / le rond du trade (avant : tagY, décalé pour empiler)
        ty = Math.max(plotTop + 2, Math.min(plotBot - timerH - 2, ty));
        // v2557 (propriétaire) : chaque chrono reste COLLÉ sur la ligne de son trade, jamais décalé ailleurs.
        // v2953 (propriétaire) : le chrono reste à GAUCHE, sur la ligne de son trade (comme les objectifs). Plusieurs
        // trades au même endroit : les ronds s'ajoutent l'un SUR l'autre, au même endroit (pas de compteur, pas d'étalement).
        var durT = Number(trade.duration) || 0;
        chronoPlaced.push({ x: leftX, y: ty });
        // Dessiné APRÈS tous les traits (drawChronos) : les lignes ACHAT / VENTE passent dessous.
        chronoQueue.push({ g: g, x: leftX, y: ty, w: timerW, h: timerH, label: label, call: isCall, frac: durT > 0 ? Math.max(0, Math.min(1, secs / durT)) : 1, k: zoneK });
      }
    }
  }

  // v2559 — le calque du dessus n'est plus utilisé (rien n'y est dessiné) : l'effacer à CHAQUE image obligeait
  // la carte graphique à le renvoyer à l'écran en plein format (mesuré : c'est elle qui sature sur iPhone quand
  // on filme). Il est effacé une seule fois ; un redimensionnement le vide de toute façon.
  var overlayClean = false;
  function paintOverlay() {
    if (overlayClean || !octx || cssW < 8 || cssH < 8) return;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, cssW, cssH);
    overlayClean = true;
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
      // v2466 — signe ACHAT / VENTE plus joli (même forme de pastille, même durée) : verre sombre bordé de la couleur
      // du trade, petit rond blanc avec la flèche (comme sur les boutons ACHETER / VENDRE), texte blanc. Dessin seulement.
      var lbl = String(isPut ? tt('tcSell', 'VENTE') : tt('tcBuy', 'ACHAT')).replace(/[↗↘⬈⬊]/g, '').trim();
      ctx.font = '900 8px "Hanken Grotesk", sans-serif';
      var lh = 16;
      var lw = Math.ceil(ctx.measureText(lbl).width) + lh + 12;
      var lx = Math.max(4, map.lastX - lw / 2);
      var ly = isPut ? map.lastY + 13 + stack : map.lastY - 29 - stack;
      // v2467 (modèle 1 choisi par le propriétaire) : vert / rouge PLEINS, sans fond sombre.
      var gr = ctx.createLinearGradient(lx, ly, lx, ly + lh);
      gr.addColorStop(0, isPut ? '#F25C6E' : '#34D673');
      gr.addColorStop(1, isPut ? '#D11F3A' : '#16A34A');
      ctx.globalAlpha = 0.97 * lblAlpha;
      ctx.translate(lx + lw / 2, ly + lh / 2);
      ctx.scale(pop, pop);
      ctx.translate(-(lx + lw / 2), -(ly + lh / 2));
      ctx.shadowColor = isPut ? 'rgba(209,31,58,.55)' : 'rgba(22,163,74,.55)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = gr;
      roundRectOn(ctx, lx, ly, lw, lh, lh / 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Fin reflet clair en haut (pas de bord).
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.28)';
      ctx.stroke();
      // Petit rond blanc avec la flèche (diagonale montante pour l'achat, descendante pour la vente).
      // v2492 (propriétaire) : VENTE = rond blanc à DROITE, comme sur le bouton VENDRE ; ACHAT = à gauche.
      var ax = isPut ? lx + lw - lh / 2 : lx + lh / 2;
      var ay = ly + lh / 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ax, ay, lh / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isPut ? '#BE123C' : '#15803D';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (isPut) {
        ctx.moveTo(ax - 2.4, ay - 2.4);
        ctx.lineTo(ax + 2.4, ay + 2.4);
        ctx.moveTo(ax + 2.4, ay - 0.2);
        ctx.lineTo(ax + 2.4, ay + 2.4);
        ctx.lineTo(ax + 0.2, ay + 2.4);
      } else {
        ctx.moveTo(ax - 2.4, ay + 2.4);
        ctx.lineTo(ax + 2.4, ay - 2.4);
        ctx.moveTo(ax + 0.2, ay - 2.4);
        ctx.lineTo(ax + 2.4, ay - 2.4);
        ctx.lineTo(ax + 2.4, ay - 0.2);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(lbl, isPut ? lx + 9 : lx + lh + 3, ly + lh / 2 + 0.5);
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
    var headCol = compact ? '#ff2d75' : (v75Head ? '#E0001B' : (titanHead ? '#FFFFFF' : (nexusHead ? '#DB9E24' : (goldHead ? '#ffd24d' : (horizonHead ? '#ff9800' : color)))));
    var glowCol = compact ? '#ff2d75' : (v75Head ? '#E0001B' : (titanHead ? '#FFFFFF' : (nexusHead ? '#DB9E24' : (goldHead ? '#ffb300' : (horizonHead ? '#ff9800' : color)))));
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
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      // v2383 : en pointillés, comme IQ Option.
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(map.lastX + 5, ly);
      ctx.lineTo(x, ly);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    // Comme IQ Option : petite pastille BLANCHE pure ; les chiffres gardent la couleur de la
    // courbe (assombrie seulement si elle est trop claire pour se lire sur le blanc).
    ctx.font = '800 8.5px ui-monospace, Menlo, Consolas, monospace';
    // v2453 — prix dans une étiquette en verre sombre, bord de la couleur de la courbe, chiffres blancs.
    ctx.fillStyle = 'rgba(14,12,9,0.86)';
    roundRect(x, y, tw, th, 6);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = accent;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
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
  // Marchés ajoutés : cadre calé sur leur propre volatilité (même recette : ~55 écarts-types d'un tick).
  function extSpanPct(assetId) {
    var a = D6.CONFIG && D6.CONFIG.ASSETS && D6.CONFIG.ASSETS[assetId];
    if (!a || !a.ext || !(a.fairVar > 0)) return 0;
    var zRef = ZOOM_STEPS[defaultZoomIdx(assetId)] || 28;
    // v2813 : cadre calé sur le mouvement ORDINAIRE (pics rares comptés pour 15 % seulement) : avant, les
    // marchés à pics avaient un cadre immense et une courbe presque plate (« endormie ») entre deux pics.
    // Un pic qui ne tient pas agrandit le cadre tout de suite (caméra), puis il se resserre doucement.
    var v = a.spanVar > 0 ? a.spanVar : a.fairVar;
    // 2026-10-19 (propriétaire : « certains plus chauds, d'autres plus calmes ») : tempo d'affichage par indice.
    var tempoK = a.tempo === 'hot' ? 0.64 : (a.tempo === 'calm' ? 1.18 : 1);
    return Math.max(0.0025, Math.min(0.035, 55 * Math.sqrt(v) * Math.sqrt(zRef / 28) * tempoK));
  }
  function routeSpanPct(assetId) {
    var base = {
      // Cadres agrandis moins vite que les vitesses (×vitesse^0,6) : on sent la vitesse sans déborder.
      v100: 0.0120, stable: 0.0055, apex500: 0.01377, horizon50: 0.0080,
      goldtrend: 0.0110, v75: 0.00955, nexusprime: 0.01033, titanpulse: 0.0330,
      boomspike: 0.0054, crash300: 0.0099
    }[assetId] || extSpanPct(assetId) || 0.0090;
    // Vélocité : moins de secondes à l'écran → le cadre se resserre d'autant (racine du temps), pour
    // garder la même hauteur de mouvement qu'avant (sinon la courbe paraîtrait plate). Ancien → nouveau.
    // v2336 : zooms de départ un peu plus larges (APOCALYPSE 7 s, PYTHON 10 s, ASMODUS 12 s, AZAZEL 14 s).
    // v2337 : bougies moins grosses (APOCALYPSE 14 s, PYTHON 18 s, ASMODUS 20 s, AZAZEL 23 s à l’écran).
    var velo = { titanpulse: Math.sqrt(19.25 / 23) * 0.92 /* v2848 : APOCALYPSE un peu plus nerveux */, crash300: Math.sqrt(23 / 25) }[assetId];
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
      // v2848 (propriétaire : « collé en haut / en bas puis ça descend d'un coup », « on dirait qu'elle dort ») :
      // plus de cadre photo qui attend le bord puis recentre d'un coup. La caméra suit EN CONTINU et en douceur :
      // la tête reste dans la bande du milieu (35 % – 65 % de la hauteur), jamais collée à un bord, jamais de saut.
      if (tSpan > span) span += (tSpan - span) * cameraFollow(0.06);
      else if (tSpan < span) span += (tSpan - span) * cameraFollow(0.012);
      var dz = span * 0.15;
      var tgt = mid;
      if (h > mid + dz) tgt = h - dz;
      else if (h < mid - dz) tgt = h + dz;
      // léger rappel vers le centre des bougies visibles (le dessin reste équilibré)
      tgt += (Math.max(h - dz, Math.min(h + dz, tMid)) - tgt) * 0.25;
      mid += (tgt - mid) * cameraFollow(0.045);
      var halfP = span / 2;
      var hardP = span * 0.12;
      if (h > mid + halfP - hardP) mid = h - halfP + hardP;
      if (h < mid - halfP + hardP) mid = h + halfP - hardP;
      return { min: mid - halfP, max: mid + halfP };
    } else {
      span = want;
      // Premier cadrage : on part de la tête et on remonte les bougies tant qu'elles
      // tiennent dans le cadre, puis on centre sur ce morceau. Résultat : le graphique
      // apparaît entier et en place tout de suite (pas de moitié coupée qui glisse).
      // 2026-10-20 (« simulations qui dorment ») : le premier cadre prend DIRECTEMENT la taille que la caméra continue
      // atteint ensuite (toutes les bougies visibles = 60 % de la hauteur, comme plus haut). Avant, il partait du cadre
      // normal puis s'agrandissait pendant ~0,5 s juste après l'apparition (la courbe « se replaçait »).
      var lo = h;
      var hi = h;
      var list = camCandles || [];
      var i;
      for (i = list.length - 1; i >= 0; i--) {
        var cd = list[i];
        if (!cd) continue;
        if (cd.l > 0 && cd.l < lo) lo = cd.l;
        if (cd.h > hi) hi = cd.h;
      }
      if ((hi - lo) / 0.60 > span) span = (hi - lo) / 0.60;
      mid = (hi + lo) / 2;
      // Tête déjà dans la zone calme : aucun glissement juste après l'arrivée.
      // v2848 : à l'arrivée, la tête est déjà près du milieu (plus de courbe collée en bas / en haut à l'ouverture)
      var calm = span * 0.10;
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

  var waitAsset = '';
  var waitSince = 0;
  /*
   * 2026-10-20 (propriétaire : « simulations qui dorment », pubs bientôt) : à l'ARRIVÉE du joueur (ouverture, retour
   * sur l'onglet / l'appli, changement d'indice), la courbe se montrait d'abord avec les vieux prix — figée, collée au
   * bord, l'axe du temps retenu en arrière (lagMs) — puis, dès les nouveaux prix reçus, elle sautait à sa place.
   * Maintenant, à chaque arrivée, la courbe n'est dessinée QUE quand les prix du marché affiché sont à jour
   * (D6.Engine.feedFresh) : en attendant, le décor habituel seul (comme pendant « Connexion au marché ») ; la
   * première courbe montrée est la bonne, cadrée d'un coup. En quittant la page, la courbe est effacée tout de suite,
   * pour que le téléphone ne remontre pas l'ancienne image au retour. Affichage seulement (prix, trades : inchangés).
   * Au plus 6 s d'attente : réseau très lent → comportement d'avant (courbe figée puis le direct).
   */
  var lastBackdrop = null;
  // 2026-10-20 (propriétaire : « depuis Google, la courbe restait vide 3-4 s, Chargement du marché ») : à l'OUVERTURE du
  // site on n'attend plus (l'historique est montré tout de suite, comme avant) ; l'attente reste pour le retour sur
  // l'onglet et le changement d'indice, et ne dépasse plus 1,2 s (avant : jusqu'à 6 s).
  var arriveGate = false;
  var arriveSince = Date.now();
  var ARRIVE_MAX_MS = 1200;
  var frameHeld = false;
  var arriveHidden = false;
  function armArrival() {
    arriveGate = true;
    arriveSince = Date.now();
  }
  /** Vrai tant qu'il faut attendre (décor seul). Pendant l'attente, le cadre est remis à zéro (branche du décor) :
      la première courbe montrée part du prix actuel et se cadre d'un coup, sans glisser depuis l'ancien cadre. */
  function arrivalHold() {
    if (!arriveGate) return false;
    // Page cachée : rien n'est vu, on attend le retour (les prix sont encore ceux du départ).
    if (document.hidden) { arriveHidden = true; return true; }
    if (arriveHidden) { arriveHidden = false; arriveSince = Date.now(); }
    var fresh = !(D6.Engine && D6.Engine.feedFresh) || D6.Engine.feedFresh(activeAsset);
    if (!fresh && Date.now() - arriveSince < ARRIVE_MAX_MS) return true;
    arriveGate = false;
    return false;
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
    frameHeld = !!(market.waiting || arrivalHold());
    if (frameHeld) {
      // Historique pas encore reçu du serveur : fond seul, jamais une fausse courbe.
      // v2813 : le décor habituel (plus d'écran noir qui « clignote » au changement de marché) ; le texte
      // « Connexion au marché » n'apparaît que si l'attente dure (réseau lent) — les marchés de la barre
      // sont chargés à l'avance, l'attente est normalement nulle.
      // 2026-10-20 : même fond pendant l'attente des prix à jour à l'arrivée (arrivalHold).
      if (waitAsset !== activeAsset) { waitAsset = activeAsset; waitSince = Date.now(); }
      // Décor complet (étoiles et galaxie comprises) quand on le connaît : il ne change pas quand la courbe arrive.
      if (lastBackdrop && bgCanvas) drawBackdrop(lastBackdrop.pad, lastBackdrop.w, lastBackdrop.h);
      else if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, cssW, cssH);
      else { ctx.fillStyle = '#382A0F'; ctx.fillRect(0, 0, cssW, cssH); }
      if (Date.now() - Math.max(waitSince, arriveGate ? arriveSince : 0) > 1500) {
        ctx.fillStyle = 'rgba(245,197,24,0.55)';
        ctx.font = '700 12px "Hanken Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((D6.I18N && D6.I18N.t) ? D6.I18N.t('m_connecting') : 'Connecting to market…', cssW / 2, cssH / 2);
        ctx.textAlign = 'left';
      }
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
    var narrow = winWCache <= 430;
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
    lastBackdrop = { pad: pad, w: w, h: h };

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
    if (asset.ext && asset.xkind) {
      map = drawExt(asset.xkind, pad, seriesW, h, candles, minP, maxP, asset.xdraw || {});
    } else if (asset.id === 'stable') {
      map = drawCoreLine(pad, seriesW, h, lineData, minP, maxP, '#ff2d75', 3.6);
    } else if (STYLED_ASSETS[asset.id]) {
      map = drawStyledCandles(pad, seriesW, h, candles, minP, maxP, STYLED_ASSETS[asset.id], STYLED_PAL[asset.id]);
    } else if (asset.ext && asset.chart === 'candle') {
      map = drawCandles(pad, seriesW, h, candles, minP, maxP, {
        thin: false, capWicks: true, tradeLock: true, lockSpan: maxP - minP,
        pal: asset.candlePal, body: asset.candleBody || 'normal'
      });
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
    } else if (asset.lineStyle === 'core') {
      map = drawCoreLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor, asset.lineWidth || 3.2, palRgba(asset.lineColor, 0.55));
    } else if (asset.lineStyle === 'plain') {
      map = drawLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor, asset.areaRgb);
    } else if (asset.lineStyle === 'step') {
      map = drawStepLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#E2B04C', asset.lineAccent || '#FF7A00', asset.lineWidth || 3);
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
      if (inds.ema) legend.push(['EMA 9', '#DB9E24']);
      if (inds.bb) legend.push(['BB 20', '#EDCE8F']);
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
          ctx.fillStyle = 'rgba(250,245,235,0.92)';
          ctx.fillText(it[0], lx + 14, ly + lh / 2 + 0.5);
          lx += pw + 5;
        });
        ctx.restore();
      }
    }
    ctx.restore();
    fadeChartBottom();

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
      // v2612 : même couleur que la colonne en cours (fixée pour sa seconde, plus de clignotement).
      tagCol = '#FFD08A';
    }
    if (asset.id === 'nexusprime') tagCol = '#DB9E24';
    if (asset.id === 'titanpulse') tagCol = '#e0e6ed';
    if (asset.id === 'v75') tagCol = '#ff2d75';
    if (asset.id === 'apex500') tagCol = '#EDCF93';
    if (asset.ext && asset.chart === 'candle' && asset.candlePal && !primary) tagCol = market.price >= market.candle.o ? asset.candlePal.up : (asset.accent || asset.candlePal.up);
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

  /**
   * v2488 (propriétaire) : le bas de la courbe ne se termine plus par un « trait » net (planètes, étoiles,
   * bougies et colonnes coupées au bord). Le bas s'efface doucement (16 px, juste la ligne des heures) vers le fond du terminal, puis
   * les heures sont redessinées nettes par-dessus. Dessin seulement : aucun prix, aucun trade ne change.
   */
  var padTopRGB = null, padTopAt = 0;
  function fadeChartBottom() {
    if (!ctx || !(cssH > 80) || !(cssW > 0)) return;
    // v2492 (propriétaire) : plus de « lueur noire ». Le bas se fond dans le BLEU de la courbe elle-même
    // (couleur relevée sur la courbe toutes les 2 s) ; le haut du terminal reprend exactement ce bleu
    // (variable --oro-chart-foot) : pas de bande sombre, pas de trait.
    var fz = 16;
    var nowF = Date.now();
    // v2563 : relire les pixels de la courbe (getImageData) bloque la carte graphique (arrêts de 1 à 3 s
    // mesurés sur Android) → téléphone : 3 relevés au démarrage puis plus jamais ; ordinateur : 1 par minute.
    if (IS_MOBILE_CHART ? (fadeSampleN < 3 && nowF - fadeSampleAt > 3000) : (nowF - fadeSampleAt > 60000)) {
      fadeSampleAt = nowF;
      fadeSampleN++;
      try {
        var cvs = ctx.canvas, k = cvs.height / cssH, yS = Math.max(0, Math.round((cssH - fz - 3) * k));
        var px = ctx.getImageData(0, yS, cvs.width, 1).data, vals = [], xi;
        for (xi = 0; xi < cvs.width; xi += Math.max(4, Math.round(cvs.width / 60))) {
          var o4 = xi * 4;
          vals.push([px[o4], px[o4 + 1], px[o4 + 2], px[o4] + px[o4 + 1] + px[o4 + 2]]);
        }
        vals.sort(function (p, q) { return p[3] - q[3]; });
        var md = vals[Math.floor(vals.length * 0.35)];
        if (md && md[3] > 0) {
          fadeRGB = md[0] + ',' + md[1] + ',' + md[2];
          try { document.documentElement.style.setProperty('--oro-chart-foot', 'rgb(' + fadeRGB + ')'); } catch (eV) { /* ignore */ }
        }
      } catch (eS) { /* ignore */ }
    }
    // v2854 (propriétaire : « un trait entre la courbe et le terminal ») : téléphone — le bas de la courbe se fond dans la
    // couleur EXACTE du haut du terminal (variable --oro-pad-top posée par le CSS sur .pad), plus dans une couleur relevée.
    if (padTopRGB === null || nowF - padTopAt > 5000) {
      padTopAt = nowF;
      try { var padEl = document.querySelector('#tradeWrap > .pad'); var pv = padEl ? getComputedStyle(padEl).getPropertyValue('--oro-pad-top').trim() : ''; padTopRGB = /^\d+\s*,\s*\d+\s*,\s*\d+$/.test(pv) ? pv : ''; } catch (eP) { padTopRGB = ''; }
    }
    if (padTopRGB) { fadeRGB = padTopRGB; fz = 6; } // v2857 (propriétaire) : bande sombre réduite — juste au raccord, sans manger la courbe
    ctx.save();
    var gF = ctx.createLinearGradient(0, cssH - fz, 0, cssH);
    gF.addColorStop(0, 'rgba(' + fadeRGB + ',0)');
    gF.addColorStop(0.55, 'rgba(' + fadeRGB + ',0.7)');
    gF.addColorStop(1, 'rgba(' + fadeRGB + ',1)');
    ctx.fillStyle = gF;
    ctx.fillRect(0, cssH - fz, cssW, fz);
    if (timeLabelsQ.length) {
      ctx.font = (cssW < 500 ? '500 8.5px ' : '500 9px ') + '"Plus Jakarta Sans", "Hanken Grotesk", sans-serif';
      ctx.fillStyle = '#8C7E5C';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      for (var q = 0; q < timeLabelsQ.length; q += 2) ctx.fillText(timeLabelsQ[q], timeLabelsQ[q + 1], cssH - (padTopRGB ? 9 : 5)); // v2874 : téléphone — heures un peu plus haut, au-dessus du raccord sombre
    }
    ctx.restore();
  }

  function ensureChartPulse() {
    /* RAF unique — pas de setInterval de dessin. */
  }

  function pauseChartEngine() {
    window.chartIsPaused = true;
    if (!chartHiddenAt) chartHiddenAt = Date.now();
    // 2026-10-20 : on quitte la page → la courbe est effacée maintenant (décor seul) et attendra les prix à jour au
    // retour : le téléphone ne remontre jamais l'image d'avant, figée, qui saute ensuite (voir arrivalHold).
    armArrival();
    try { drawNow(); } catch (eHide) { /* ignore */ }
  }

  function wakeChartEngine() {
    var sleptMs = chartHiddenAt ? (Date.now() - chartHiddenAt) : 0;
    chartHiddenAt = 0;
    window.chartIsPaused = false;
    // Attente des prix à jour (arrivalHold) : comptée à partir du retour, pas du départ.
    if (arriveGate) arriveSince = Date.now();
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
      if (ev && ev.persisted) armArrival();
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

      // v2552 — PLEIN ÉCRAN sur un téléphone qui ne suit pas (enregistrement d'écran, téléphone faible, mode léger) :
      // on dessine une image sur deux = 30 images/s RÉGULIÈRES (au lieu de 60 qui hésitent → accrocs).
      // Détection : moyenne des écarts entre images > 21 ms pendant ~1,5 s. Retour à 60 en quittant le plein écran.
      // Dessin seulement : prix, trades et chronos ne changent pas.
      var fsOnNow = document.documentElement.classList.contains('fs-trade');
      if (fsOnNow !== fsSkip.was) { fsSkip.was = fsOnNow; fsSkip.heavy = false; fsSkip.ema = 16.7; fsSkip.n = 0; fsSkip.flip = false; }
      // v2554 : même protection sur l'écran normal (mesuré : 11 img/s sur iPhone) — détection par écran.
      if (!fsSkip.heavy) {
        fsSkip.ema = fsSkip.ema * 0.9 + Math.min(dt, 60) * 0.1;
        fsSkip.n++;
        if (fsSkip.n > 90 && fsSkip.ema > 21) fsSkip.heavy = true;
      }
      var skipDraw = false;
      // v2558 : sur TOUS les téléphones, 30 images/s régulières en permanence (moitié moins de travail : moins de chauffe,
      // de batterie, et l'enregistrement d'écran tient). Ordinateurs : 60, sauf saturation / mode léger.
      // v2574 : limite SUR LE TEMPS (au plus ~30 images/s) au lieu de « une image sur deux » : avant, un téléphone déjà
      // à 2 img/s (Android + enregistrement d'écran) tombait à 1 img/s. Maintenant, si le téléphone est lent, AUCUNE image n'est sautée.
      if (IS_MOBILE_CHART || fsSkip.heavy || D6.lite) { if (ts - (fsSkip.lastDraw || 0) < 30) skipDraw = true; }
      if (!skipDraw) fsSkip.lastDraw = ts;
      if (!skipDraw) {
        drawFrame(ts);
        if (onFrame) onFrame(ts);
      }
    } catch (eLoop) {
      try { drawNow(); } catch (e2) { /* ignore */ }
    }
  }
  var fsSkip = { was: false, heavy: false, ema: 16.7, n: 0, flip: false };
  // v2556 — téléphone qui rame (mode léger ou saturation détectée) : les 18 halos flous du dessin (shadowBlur :
  // chronos, ronds d'entrée, dernière bougie, lignes…) sont coupés automatiquement — c'est l'effet le plus coûteux,
  // recalculé à chaque image et pour chaque trade (mesuré sur iPhone : 3 trades ouverts → 20 img/s, 87 % lentes).
  // Téléphone qui suit : halos inchangés. Dessin seulement.
  (function guardShadowBlur() {
    try {
      var P = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
      var d = P && Object.getOwnPropertyDescriptor(P, 'shadowBlur');
      if (!d || !d.set || !d.get) return;
      Object.defineProperty(P, 'shadowBlur', {
        configurable: true,
        enumerable: d.enumerable,
        get: function () { return d.get.call(this); },
        set: function (v) { d.set.call(this, (D6.lite || fsSkip.heavy) ? 0 : v); }
      });
    } catch (eSb) { /* ignore */ }
  })();

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
      if (id !== activeAsset) { fadeSampleN = 0; fadeSampleAt = 0; } // v2563 : nouveau marché → couleur du fondu relevée de nouveau (3 fois)
      if (id === activeAsset) {
        if (isChartReady()) drawNow();
        return;
      }
      persistView(activeAsset);
      activeAsset = id;
      // 2026-10-20 : nouvel indice → sa courbe n'apparaît qu'à jour (indice tiède : tout de suite ; jamais vu : ~0,2 s).
      armArrival();
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
    markDebug: function () { return { ride: rideDbg, mark: lastEntryMarkX, markY: lastEntryMarkY, markR: lastEntryMarkR, head: lastMap ? lastMap.lastX : NaN, zoom: zoomSec(), count: lastMap ? lastMap.count : 0, lo: viewMin, hi: viewMax, price: lastDrawnClose, emberT: emberLock.t, ember: emberLock.cur, emberRaw: emberLock.raw, gated: frameHeld }; },
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
