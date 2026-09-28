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
  var ZOOM_STEPS = [
    10, 12, 14, 16, 18, 20, 23, 25, 28, 31, 35, 38, 41, 45, 48, 52, 56, 60,
    70, 80, 90, 100, 110, 120, 140, 160, 180, 220, 260, 300,
    360, 420, 480, 540, 600, 660
  ];
  var DEFAULT_ZOOM_IDX = 8; // 28 s (défaut d'origine)
  var zoomIdx = DEFAULT_ZOOM_IDX;
  var zoomSmooth = 28;
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
        zoomIdx: DEFAULT_ZOOM_IDX,
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
    return ZOOM_STEPS[zoomIdx] || 60;
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
    if (!(z >= 0) || z >= ZOOM_STEPS.length) z = DEFAULT_ZOOM_IDX;
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

  function candleStepWidth(seriesW) {
    var tWin = xWin > 0 ? xWin : 60000;
    return seriesW * (CANDLE_DURATION_MS / Math.max(1, tWin));
  }

  // Horloge murale haute résolution calée sur la timeline requestAnimationFrame :
  // Date.now() est quantifié à la milliseconde et peut reculer, ce qui hache le
  // défilement. On garde le temps mur exact à 250 ms près, en sous-milliseconde.
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
  function tradeGlide(t) {
    var entry = Number(t.entryPrice != null ? t.entryPrice : t.openPrice);
    var bar = Number(t.barrier);
    var start = Number(t.startTime || t.startedAt || t.openedAt || 0);
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
      payout: Number(trade.payout) || 1.88,
      startTime: trade.startTime || trade.startedAt || trade.openedAt || 0,
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
      snap.fromEntry = cur.entry;
      snap.fromBarrier = cur.barrier;
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
            if (padTop > 0 && cardTop >= 0) stdH = padTop - cardTop - 4;
          }
        } catch (eStd) { stdH = 0; }
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
      if (stdH >= 240) {
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
      // Tolérance : sans elle, un écart d'un pixel relancerait sans fin le
      // cycle mesure → redimensionnement → mesure.
      var curH = Math.round(parent.clientHeight || 0);
      if (curH > 0 && Math.abs(fsH - curH) <= 2) fsH = curH;
      var landscape = (window.innerWidth || 0) > (window.innerHeight || 0);
      var sideChrome = (!mobile && landscape) ? 240 : 0;
      var fsW = Math.max(280, Math.round((window.innerWidth || 800) - sideChrome));
      parent.style.setProperty('min-height', fsH + 'px', 'important');
      parent.style.setProperty('height', fsH + 'px', 'important');
      parent.style.setProperty('width', '100%', 'important');
      parent.style.setProperty('min-width', '240px', 'important');
      var cardFs = document.getElementById('chart');
      if (cardFs) {
        cardFs.style.setProperty('height', fsH + 'px', 'important');
        cardFs.style.setProperty('min-height', fsH + 'px', 'important');
        cardFs.style.setProperty('min-width', '240px', 'important');
        if (!mobile && landscape) {
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
    if (IS_ANDROID_CHART && !document.hidden && cssH >= 240 && h > 0 && h < 180) {
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
    if (IS_ANDROID_CHART && !document.hidden && cssH >= 240 && h > 0 && h < 180) {
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

  // Carte du monde originale en points : pour chaque latitude (pas de 5°), les
  // tranches de longitude où il y a des terres. Volontairement simplifiée.
  var WORLD_ROWS = [
    [82.5, [[-60, -30]]],
    [77.5, [[-120, -80], [-70, -20], [15, 25], [55, 105]]],
    [72.5, [[-165, -140], [-138, -76], [-55, -20], [20, 30], [60, 180]]],
    [67.5, [[-165, -95], [-80, -60], [-52, -25], [-22, -14], [12, 30], [30, 180]]],
    [62.5, [[-165, -95], [-78, -65], [-50, -40], [5, 30], [30, 140], [155, 180]]],
    [57.5, [[-160, -93], [-78, -60], [-6, -2], [8, 25], [28, 140], [156, 163]]],
    [52.5, [[-130, -55], [-10, 2], [2, 40], [40, 140]]],
    [47.5, [[-125, -53], [-5, 45], [54, 135], [141, 145]]],
    [42.5, [[-124, -70], [-9, 3], [10, 28], [27, 48], [54, 130], [140, 142]]],
    [37.5, [[-122, -76], [-9, 10], [22, 44], [44, 122], [126, 129], [132, 140]]],
    [32.5, [[-118, -80], [-10, 35], [35, 60], [60, 122], [130, 132]]],
    [27.5, [[-113, -97], [-82, -80], [-15, 33], [35, 56], [60, 120]]],
    [22.5, [[-106, -97], [-84, -75], [-17, 37], [39, 59], [68, 90], [92, 110]]],
    [17.5, [[-100, -88], [-16, 40], [42, 52], [73, 84], [95, 108], [120, 125]]],
    [12.5, [[-90, -83], [-75, -60], [-17, 51], [76, 80], [98, 108], [122, 126]]],
    [7.5, [[-78, -52], [-13, 48], [80, 81], [100, 104], [110, 118], [122, 126]]],
    [2.5, [[-80, -50], [9, 42], [96, 106], [109, 119], [120, 125], [131, 150]]],
    [-2.5, [[-80, -40], [10, 41], [102, 106], [110, 116], [132, 150]]],
    [-7.5, [[-79, -35], [12, 40], [106, 115], [140, 148]]],
    [-12.5, [[-77, -38], [13, 40], [49, 50], [130, 142]]],
    [-17.5, [[-71, -39], [12, 38], [44, 50], [122, 146]]],
    [-22.5, [[-70, -41], [14, 35], [43, 48], [114, 150]]],
    [-27.5, [[-71, -48], [15, 32], [114, 153]]],
    [-32.5, [[-72, -52], [18, 28], [115, 125], [135, 152]]],
    [-37.5, [[-73, -57], [140, 150], [174, 178]]],
    [-42.5, [[-74, -63], [145, 148], [170, 174]]],
    [-47.5, [[-75, -66], [167, 170]]],
    [-52.5, [[-74, -67]]]
  ];
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

  function buildBackdrop(pad, w, h) {
    var s = Math.min(dpr || 1, 2);
    var c = bgCanvas || document.createElement('canvas');
    c.width = Math.max(1, Math.round(cssW * s));
    c.height = Math.max(1, Math.round(cssH * s));
    var g = c.getContext('2d');
    g.setTransform(s, 0, 0, s, 0, 0);
    // Fond bleu nuit, pas un noir plat.
    var base = g.createLinearGradient(0, 0, 0, cssH);
    base.addColorStop(0, '#16203A');
    base.addColorStop(1, '#0E1426');
    g.fillStyle = base;
    g.fillRect(0, 0, cssW, cssH);
    // Lumières chaudes (or en haut à gauche, ambre en bas à droite, halo au centre).
    function glow(x, y, r, col) {
      var rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, cssW, cssH);
    }
    var big = Math.max(cssW, cssH);
    glow(cssW * 0.12, cssH * 0.05, big * 0.55, 'rgba(245,175,50,0.17)');
    glow(cssW * 0.92, cssH * 0.98, big * 0.5, 'rgba(255,140,50,0.12)');
    glow(pad.l + w / 2, pad.t + h / 2, Math.min(w, h) * 0.7, 'rgba(120,160,255,0.07)');
    // Carte du monde en points.
    // Sur téléphone (graphique plus haut que large, surtout en plein écran), la carte
    // grandit avec la hauteur : un peu plus large que l écran, centrée sur Europe/Afrique.
    // La carte tient entière dans le globe, lui-même entier dans le graphique.
    var mw = w * 0.94;
    var mh = Math.min(h * 0.9, mw * 0.52);
    var mx = pad.l + (w - mw) / 2;
    var my = pad.t + (h - mh) / 2;
    // Fins « fils » du globe (méridiens et parallèles) : on sent que c'est la Terre.
    g.save();
    g.strokeStyle = 'rgba(160,185,225,0.05)';
    g.lineWidth = 1;
    // Le globe tient toujours ENTIER dans le graphique (petit écran, plein écran, PC).
    var gcx = pad.l + w / 2;
    var gcy = pad.t + h / 2;
    var grx = Math.min(mw / 2, w * 0.47);
    var gry = Math.min(mh / 2, h * 0.46);
    var gk;
    for (gk = 1; gk <= 4; gk++) {
      g.beginPath();
      g.ellipse(gcx, gcy, grx * gk / 4, gry, 0, 0, Math.PI * 2);
      g.stroke();
    }
    for (gk = -2; gk <= 2; gk++) {
      var py = gcy + gk * gry / 3;
      var half = grx * Math.sqrt(Math.max(0, 1 - Math.pow((py - gcy) / gry, 2)));
      g.beginPath();
      g.moveTo(gcx - half, py);
      g.lineTo(gcx + half, py);
      g.stroke();
    }
    g.restore();
    // Continents en points plus fins et plus serrés (deux rangées par bande) : la forme
    // de la carte se lit mieux, sans être plus lumineuse.
    var step = Math.max(3.4, mw / 110);
    var degX = 360 * step / mw;
    var r = Math.max(0.7, step * 0.28);
    g.fillStyle = 'rgba(160,185,225,0.13)';
    var i;
    var j;
    var sub;
    for (i = 0; i < WORLD_ROWS.length; i++) {
      var spans = WORLD_ROWS[i][1];
      for (sub = 0; sub < 2; sub++) {
        var lat = WORLD_ROWS[i][0] + 1.25 - sub * 2.5;
        var y = my + (85 - lat) / 145 * mh;
        for (j = 0; j < spans.length; j++) {
          var lon = Math.ceil((spans[j][0] + 180) / degX) * degX - 180 + (sub ? degX / 2 : 0);
          for (; lon <= spans[j][1]; lon += degX) {
            var x = mx + (lon + 180) / 360 * mw;
            g.beginPath();
            g.arc(x, y, r, 0, Math.PI * 2);
            g.fill();
          }
        }
      }
    }
    // Logos crypto : tous la même taille, rangés en lignes droites régulières sur toute la zone
    // du graphique (sans toucher la colonne des prix), très discrets.
    var cSize = 18;
    var cCols = Math.max(5, Math.round(w / 56));
    var cRows = Math.max(4, Math.round(h / 62));
    var cellW = w / cCols;
    var cellH = h / cRows;
    var ci = 0;
    var rr;
    var cc;
    g.globalAlpha = 0.047;
    for (rr = 0; rr < cRows; rr++) {
      var shift = 0;
      for (cc = 0; cc < cCols; cc++) {
        var cxp = pad.l + cellW * (cc + 0.5) + shift;
        if (cxp > pad.l + w - cSize * 0.6) continue;
        var cyp = pad.t + cellH * (rr + 0.5);
        var img = coinImg(BACKDROP_COINS[ci % BACKDROP_COINS.length]);
        ci += 5;
        if (img && img.complete && img.naturalWidth) {
          g.drawImage(img, cxp - cSize / 2, cyp - cSize / 2, cSize, cSize);
        }
      }
    }
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
    var start = Math.max(0, done.length - n);
    var i;
    for (i = start; i < done.length; i++) candleScratch.push(done[i]);
    var forming = visualFormingCandle((live && live.forming) || (market && market.candle));
    if (forming) {
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
    var refStepX = gridStepX(seriesW, span);
    var rowsY = Math.max(3, Math.min(8, Math.round(h / refStepX)));
    for (i = 0; i <= rowsY; i++) {
      var y = pad.t + (h / rowsY) * i;
      ctx.strokeStyle = i === rowsY ? theme.gridHStrong : theme.gridH;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
      var pVal = maxP - (i / rowsY) * (maxP - minP);
      ctx.fillStyle = '#64748B';
      // Police resserrée sur écran étroit : la colonne reste discrète sans
      // jamais rogner les décimales.
      ctx.font = (cssW < 500 ? '500 8.5px ' : '500 9px ') +
        '"Plus Jakarta Sans", "Hanken Grotesk", sans-serif';
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
    var stepX = refStepX;
    var headXg = pad.l + seriesW;
    var axisR = pad.l + plotW;
    var kMin = -Math.ceil((headXg - pad.l) / stepX) - 1;
    var kMax = Math.ceil((axisR - headXg) / stepX);
    ctx.strokeStyle = theme.gridV;
    ctx.beginPath();
    for (i = kMin; i <= kMax; i++) {
      var gx = headXg + stepX * (i + 0.5);
      if (gx < pad.l - 0.5 || gx > axisR + 0.5) continue;
      ctx.moveTo(gx, pad.t);
      ctx.lineTo(gx, pad.t + h);
    }
    ctx.stroke();
  }

  function drawCandles(pad, w, h, candles, minP, maxP, opts) {
    if (!candles || candles.length < 2) return null;
    opts = opts || {};
    var thin = !!opts.thin;
    var span = Math.max(maxP - minP, 0.01);
    var n = candles.length;
    var slot = w / Math.max(1, n);
    // Géométrie nette : corps de 5 px, espacement de 3 px, et surtout un corps
    // qui ne dépasse JAMAIS la place réellement disponible. L'ancien plancher
    // de 5 px indépendant du pas faisait se chevaucher les bougies au dézoom,
    // d'où la bouillie floue.
    var gap = Math.min(3, Math.max(0.6, slot * 0.28));
    var maxBody = 5;
    if (opts.boomSmall) maxBody = 4;
    // ORO 888 : bougies violettes un peu plus larges.
    if (opts.apexAiry) maxBody = 6;
    // Titan Pulse : +40 % de largeur par rapport aux bougies ordinaires.
    if (opts.titanWide) maxBody = 11;
    // Volatility 100 (actif principal) : grosses bougies façon TradingView.
    if (opts.v100Big) maxBody = 9;
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
      if (opts.v75Rose) col = up ? '#ff2d75' : '#d80056';
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
      if (wickRange > capVis) {
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
        ctx.shadowColor = up ? 'rgba(255,45,117,0.4)' : 'rgba(216,0,86,0.5)';
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
        ctx.strokeStyle = '#ff2d75';
        ctx.lineWidth = 1.15;
        ctx.strokeRect(x - cw / 2, y1, cw, bh);
      } else if (opts.v75Rose) {
        ctx.fillStyle = '#d80056';
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
    return { toX: toX, toY: toY, lastX: pad.l + w, lastY: toY(last.c), count: candles.length };
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
    var lastX = pad.l + w;
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
    if (col === '#ff2244') {
      ctx.shadowColor = 'rgba(255,34,68,0.55)';
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
    var lastX = pad.l + w;
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
    var lastX = pad.l + w;
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
    var lastX = pad.l + w;
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
    var lastX = pad.l + w;
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
  function drawTargetLine(g, trade, bar, entry, pad, plotH, minP, maxP, plotTop, plotBot, layout, idx, fade) {
    var mult = Number(trade.payout) || 1.88;
    if (mult < 4.99 || !isFinite(bar) || bar <= 0 || Math.abs(bar - entry) < 0.005) return;
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
    g.lineTo(layout.axisX, by);
    g.stroke();
    g.setLineDash(NO_DASH);
    if ((idx || 0) < 2) {
      var arrow = off < 0 ? ' ▲' : (off > 0 ? ' ▼' : '');
      var tag = '×' + (Math.round(mult * 10) / 10) + ' ' + (D6.I18N && D6.I18N.t ? D6.I18N.t('m_target') : 'target') + arrow;
      g.font = '800 10px "Hanken Grotesk", sans-serif';
      var tw = Math.ceil(g.measureText(tag).width) + 14;
      var tx = Math.max(pad.l + 4, layout.axisX - tw - 8);
      var ty = by - 8 - (idx || 0) * 18;
      g.fillStyle = 'rgba(10,15,29,0.92)';
      g.strokeStyle = gold;
      g.lineWidth = 1;
      roundRectOn(g, tx, ty, tw, 16, 8);
      g.fill();
      g.stroke();
      g.fillStyle = gold;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(tag, tx + tw / 2, ty + 8.5);
      g.textBaseline = 'alphabetic';
    }
    g.restore();
  }

  // Trade ouvert : trait horizontal pointillé + pastille d'entrée CALL/PUT + décompte
  // à gauche. Aucun montant en dollars n'est tracé le long du trait.
  function drawEntryOn(g, map, trade, now, pad, tagIndex, minP, maxP, plotH, yShift, layout, clusterN) {
    if (!g || !trade || trade.settled) return;
    var exp = trade.expiryTime || trade.expiresAt;
    if (!exp || Date.now() >= exp) return;
    var glide = tradeGlide(trade);
    var entry = glide.entry;
    if (!isFinite(entry)) return;
    var ey = priceToY(entry, pad, plotH, minP, maxP);
    if (!isFinite(ey)) return;
    // Arrondi sous-pixel : évite le tremblement du trait pendant le rafraîchissement.
    ey = Math.round(ey * 2) / 2;
    var plotTop = pad ? pad.t : 4;
    var plotBot = pad ? (pad.t + plotH) : (cssH - 4);
    layout = layout || plotLayout(pad);
    var isCall = trade.side === 'call';
    var lineCol = isCall ? '#00e676' : '#ff3b30';
    var fillCol = isCall ? '#007e33' : '#b71c1c';
    var idx = tagIndex || 0;
    var lite = IS_ANDROID_CHART;
    var badgeLift = isFinite(yShift) ? yShift : 0;
    var tNowE = xNow || Date.now();
    var winE = xWin > 0 ? xWin : (zoomSec() * 1000);
    var lineFade = trade.lineAt ? Math.min(1, (Date.now() - trade.lineAt) / 140) : 1;
    if (idx === 0) {
      // Zone gagnante : au-dessus de la ligne (CALL) ou en dessous (PUT), très légère.
      var refP = glide.barrier > 0 ? glide.barrier : entry;
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
      g.globalAlpha = (lite ? 0.72 : 0.92) * lineFade;
      g.beginPath();
      g.moveTo(0, ey);
      g.lineTo(cssW, ey);
      g.stroke();
      g.setLineDash(NO_DASH);
      g.globalAlpha = 1;
    }
    drawTargetLine(g, trade, glide.barrier, entry, pad, plotH, minP, maxP, plotTop, plotBot, layout, idx, lineFade);

    var tNow = xNow || Date.now();
    var win = xWin > 0 ? xWin : (zoomSec() * 1000);
    var t0 = glide.start;
    var mx = layout.headX;
    if (t0 > 0 && win > 0) mx = layout.headX - layout.seriesW * ((tNow - t0) / win);
    mx += (idx % 3) * 5 - 5;
    ey += badgeLift;
    var r = lite ? 7 : 9;
    if (mx < pad.l - r) mx = pad.l + r + 2;
    if (mx > layout.headX) mx = layout.headX;
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
      g.moveTo(mx, ey - 5.2);
      g.lineTo(mx + 4.2, ey + 3.4);
      g.lineTo(mx - 4.2, ey + 3.4);
    } else {
      g.moveTo(mx, ey + 5.2);
      g.lineTo(mx + 4.2, ey - 3.4);
      g.lineTo(mx - 4.2, ey - 3.4);
    }
    g.closePath();
    g.fill();
    g.restore();

    var remaining = exp - Date.now();
    var secs = remaining / 1000;
    if (lite && idx > 0) return;
    if (secs >= 0.15) {
      var label = lite ? (Math.max(1, Math.ceil(secs)) + 's') : (secs.toFixed(1) + 's');
      if (label.charAt(0) !== '-') {
        var timerW = 50;
        var timerH = 16;
        var leftX = (pad && pad.l != null ? pad.l : 8) + 4;
        var ty = ey - timerH / 2;
        ty = Math.max(plotTop + 2, Math.min(plotBot - timerH - 2, ty));
        g.fillStyle = 'rgba(10,15,29,0.92)';
        g.strokeStyle = lineCol;
        g.lineWidth = 1.2;
        roundRectOn(g, leftX, ty, timerW, timerH, 7);
        g.fill();
        g.stroke();
        g.fillStyle = lineCol;
        g.font = '800 11px "Hanken Grotesk", sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(label, leftX + timerW / 2, ty + timerH / 2 + 0.5);
        g.textBaseline = 'alphabetic';
      }
    }
  }

  function paintOverlay() {
    if (!octx || cssW < 8 || cssH < 8) return;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, cssW, cssH);
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
      ctx.arc(map.lastX, map.lastY, 13 + pulse * 5, 0, Math.PI * 2);
      ctx.fillStyle = haloDim ? 'rgba(' + haloDim + ',0.16)' : (theme.beadGlow || 'rgba(255,215,0,0.16)');
      ctx.fill();
      ctx.beginPath();
      ctx.arc(map.lastX, map.lastY, 9 + pulse * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = haloDim ? 'rgba(' + haloDim + ',0.3)' : (theme.beadGlow || 'rgba(255,215,0,0.24)');
      ctx.fill();
    }
    // Point actuel : noyau de 6 px et halo pulsant de 12 px, quel que soit l'actif.
    var headCol = compact ? '#ff2244' : (v75Head ? '#ff2d75' : (titanHead ? '#FFFFFF' : (nexusHead ? '#00E5FF' : (goldHead ? '#ffd24d' : (horizonHead ? '#ff9800' : color)))));
    var glowCol = compact ? '#ff2244' : (v75Head ? '#ff2d75' : (titanHead ? '#FFFFFF' : (nexusHead ? '#00E5FF' : (goldHead ? '#ffb300' : (horizonHead ? '#ff9800' : color)))));
    ctx.beginPath();
    ctx.arc(map.lastX, map.lastY, compact ? 3.6 : 6, 0, Math.PI * 2);
    ctx.fillStyle = headCol;
    ctx.shadowColor = glowCol;
    ctx.shadowBlur = compact ? 6 : 12 + pulse * 4;
    ctx.fill();
    // Second passage : le halo se cumule et reste net au centre.
    if (!compact) {
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(map.lastX, map.lastY, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawLivePriceBadge(map, price, layout, assetColor) {
    if (!map || !isFinite(map.lastY)) return;
    var txt = formatAxisPrice(price);
    ctx.save();
    var accent = assetColor || '#F5A623';
    ctx.font = '500 10px ui-monospace, Menlo, Consolas, monospace';
    var tw = Math.ceil(ctx.measureText(txt).width) + 8;
    var th = 12;
    var y = map.lastY - th / 2;
    y = Math.max(2, Math.min(cssH - th - 2, y));
    var x = map.lastX + 9;
    var axisX = layout && layout.axisX != null ? layout.axisX : cssW - 8;
    if (x + tw > axisX - 2) x = axisX - tw - 2;
    ctx.fillStyle = 'rgba(11,14,20,0.28)';
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 0.6;
    roundRect(x, y, tw, th, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
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
      v100: 0.0090, stable: 0.0020, apex500: 0.0108, horizon50: 0.0016,
      goldtrend: 0.0068, v75: 0.0072, nexusprime: 0.0081, titanpulse: 0.0126,
      boomspike: 0.0054, crash300: 0.0099
    }[assetId] || 0.0090;
    // Le cadre suit le zoom comme un vrai marché : l'amplitude grandit avec la racine du
    // temps affiché (28 s = taille de base). Zoom arrière : rien n'est coupé en bas/haut.
    var z = Number(zoomSec()) || 28;
    var k = Math.sqrt(z / 28);
    return base * Math.max(0.7, Math.min(5, k));
  }

  var camCandles = null;

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
      span = prevMax - prevMin;
      span += (want - span) * cameraFollow(0.06);
      mid = (prevMin + prevMax) / 2;
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
    var edge = span * 0.26;
    // Suivi réglé en TEMPS et non par image : un vieil Android qui dessine 15 images/s
    // suit la courbe aussi vite qu'un iPhone à 60 (avant, la courbe « s'enfonçait »).
    var kf = cameraFollow(0.06);
    if (h > mid + half - edge) mid += (h - (mid + half - edge)) * kf;
    if (h < mid - half + edge) mid += (h - (mid - half + edge)) * kf;
    // Filet dur : la tête ne sort jamais (pic Boom/Crash, retour de veille).
    var hard = span * 0.06;
    if (h > mid + half - hard) mid = h - half + hard;
    if (h < mid - half + hard) mid = h + half - hard;
    return { min: mid - half, max: mid + half };
  }

  function captureTradeFrame(assetId, untilMs) {
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
      ? { t: 4, r: 56, b: 6, l: 4 }
      : { t: narrow ? 6 : 8, r: narrow ? 54 : 56, b: 8, l: 8 };
    var layout = plotLayout(pad);
    var w = layout.plotW;
    var seriesW = layout.seriesW;
    var h = cssH - pad.t - pad.b;
    if (h < 48) h = 48;

    var wantZoom = zoomSec();
    if (!(zoomSmooth > 0)) zoomSmooth = wantZoom;
    zoomSmooth += (wantZoom - zoomSmooth) * 0.38;
    if (Math.abs(zoomSmooth - wantZoom) < 0.4) zoomSmooth = wantZoom;
    xNow = frameWallClock(now);
    // Retour de veille : tant que les prix manqués n'ont pas été reçus, on affiche la courbe
    // figée à son dernier instant (pas de trou, pas de trait droit), puis le direct.
    if (D6.Engine && D6.Engine.lagMs) {
      var feedLag = D6.Engine.lagMs(activeAsset);
      if (feedLag > 0) xNow -= feedLag;
    }
    xWin = Math.max(8000, zoomSmooth * 1000);
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
    var holdLock = allTrades.length || (st.lockUntil && Date.now() < st.lockUntil);
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
      // Tout ce qui compte doit rester visible : tête, prix d'entrée ET ligne objectif
      // (même en ×50, petit écran comme plein écran). Si ça ne tient pas, le cadre
      // s'agrandit juste ce qu'il faut, en douceur.
      var needLo = head;
      var needHi = head;
      var nt;
      for (nt = 0; nt < allTrades.length; nt++) {
        var tv = allTrades[nt];
        if (!tv || tv.assetId !== activeAsset) continue;
        [Number(tv.entryPrice), Number(tv.barrier)].forEach(function (pv) {
          if (!(pv > 0) || !isFinite(pv)) return;
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

    drawGrid(pad, w, seriesW, h, minP, maxP, theme);

    ctx.save();
    // Grand OROLADO au centre, façon grandes plateformes : une seule teinte douce, très
    // transparente, sans contour. On lit le nom sur une capture, les bougies restent devant.
    var wmSize = watermarkSize(w, h);
    ctx.font = '800 ' + wmSize + 'px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.042;
    ctx.fillStyle = '#E9D9B0';
    ctx.fillText('OROLADO', pad.l + w / 2, pad.t + h / 2);
    ctx.restore();

    var map = null;
    var lineData = closes.slice(startIdx);
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, Math.max(2, w), Math.max(2, h));
    ctx.clip();
    if (asset.id === 'titanpulse') {
      map = drawCandles(pad, seriesW, h, candles, minP, maxP, {
        thin: false,
        capWicks: true,
        titanWhite: true,
        titanWide: true
      });
    } else if (asset.id === 'stable') {
      map = drawCoreLine(pad, seriesW, h, lineData, minP, maxP, '#ff2244', 3);
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

    // Lignes de trade sur le canvas principal (PC + mobile) ; overlay vidé.
    tradeYsScratch.length = 0;
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
      drawEntryOn(ctx, map, ot, now, pad, ti, minP, maxP, h, shift, layout, count);
    }
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
    if (map) {
      drawBead(map, market.price, tagCol, now, theme);
      drawLivePriceBadge(map, market.price, layout, tagCol);
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
    zoomIdx = DEFAULT_ZOOM_IDX;
    zoomSmooth = zoomSec();
    persistView(activeAsset);
    inds.ma = false;
    inds.bb = false;
    inds.ema = false;
    persistView(activeAsset);
    syncIndButtons();
    viewMin = 0;
    viewMax = 0;
    var st = ensureAssetState(activeAsset);
    st.lockMin = 0;
    st.lockMax = 0;
    st.viewMin = 0;
    st.viewMax = 0;
    strikeLock = null;
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
  function bindTools() {
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
