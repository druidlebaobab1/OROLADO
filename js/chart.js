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
  var ZOOM_STEPS = [30, 60, 120, 300, 600];
  var DEFAULT_ZOOM_IDX = 1;
  var zoomIdx = DEFAULT_ZOOM_IDX;
  var zoomSmooth = 60;
  var wantFitY = false;
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
  var BUFFER_N = 800;
  var xTimes = null;
  var xNow = 0;
  var xWin = 60000;
  var candleScratch = [];
  var seriesScratch = [];
  var tradeListScratch = [];
  var tradeYsScratch = [];
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
    if (assetId === 'crash300' && target < state.value * 0.996) {
      state.value = target;
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

  function pruneTradeVisuals(now) {
    now = now || Date.now();
    var id;
    for (id in openTradeVisuals) {
      if (!openTradeVisuals.hasOwnProperty(id)) continue;
      var v = openTradeVisuals[id];
      if (!v || v.settled || (v.expiryTime && now >= v.expiryTime) || (v.expiresAt && now >= v.expiresAt)) {
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
      if (v && v.assetId === assetId) n += 1;
    }
    if (D6.Engine && D6.Engine.getTrades) {
      var list = D6.Engine.getTrades();
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
      startTime: trade.startTime || trade.startedAt || trade.openedAt || 0,
      expiryTime: exp,
      expiresAt: exp,
      settled: !!trade.settled,
      status: trade.status || 'open'
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

  function collectOpenTradeVisuals() {
    pruneTradeVisuals();
    tradeListScratch.length = 0;
    var now = Date.now();
    if (D6.Engine && D6.Engine.forEachOpen) {
      D6.Engine.forEachOpen(function (ot) {
        if (!ot || ot.assetId !== activeAsset) return;
        var e2 = ot.expiryTime || ot.expiresAt;
        if (e2 && now >= e2) return;
        var v = openTradeVisuals[ot.id];
        if (!v) {
          v = snapshotTradeVisual(ot);
          if (v) openTradeVisuals[v.id] = v;
        }
        if (v) tradeListScratch.push(v);
      });
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
    tradeListScratch.sort(function (a, b) {
      return (a.expiryTime || a.expiresAt || 0) - (b.expiryTime || b.expiresAt || 0);
    });
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
    if (hasVis || (D6.Engine && D6.Engine.liveCount && D6.Engine.liveCount() > 0)) {
      drawNow();
    }
  }

  /** Unique entrée visuelle CALL/PUT — desktop + mobile + TV. */
  function applyOpenTradeVisual(trade) {
    var snap = snapshotTradeVisual(trade);
    if (!snap) return false;
    if (snap.settled || snap.status === 'won' || snap.status === 'lost' || snap.status === 'void') {
      delete openTradeVisuals[snap.id];
      return false;
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

  function resize() {
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
      parent.style.minHeight = minH + 'px';
      if (!parent.style.height || parseInt(parent.style.height, 10) < minH) {
        parent.style.height = minH + 'px';
      }
      var card = document.getElementById('chart');
      if (card) {
        card.style.minHeight = '380px';
        card.style.width = '100%';
      }
    } else {
      var chrome = mobile ? 132 : 96;
      var fsH = Math.max(280, Math.round((window.innerHeight || 700) - chrome));
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
    // Fallback immédiat si dimensions à 0 (écran caché / flex collapse).
    if (w < 8) w = Math.max(320, Math.floor(window.innerWidth || 360));
    if (h < 8) h = fsMode ? Math.max(220, Math.floor((window.innerHeight || 700) - 140)) : 380;

    dpr = Math.max(1, window.devicePixelRatio || 1);
    var boxW = Math.max(0, Math.floor(parent.clientWidth || 0));
    var boxH = Math.max(0, Math.floor(parent.clientHeight || 0));
    if (boxW >= 8) w = boxW;
    if (boxH >= 8) h = boxH;
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
    drawNow();
    requestAnimationFrame(function () { drawNow(); });
  }

  function steerClose(price, ms, assetId) {
    var p = Number(price);
    if (!isFinite(p) || p <= 0) return;
    var aid = assetId || activeAsset;
    var from = lastDrawnClose;
    if (aid !== activeAsset) {
      var st = window.assetsState && window.assetsState[aid];
      from = st && isFinite(st.lastPrice) ? st.lastPrice : p;
    } else if (!(isFinite(from) && from > 0)) {
      from = p;
    }
    steer = {
      price: p,
      from: from,
      start: Date.now(),
      end: Date.now() + Math.max(80, Number(ms) || 700),
      assetId: aid
    };
  }

  function steeredPrice(raw) {
    if (!steer || steer.assetId !== activeAsset || !isFinite(steer.price)) return raw;
    var now = Date.now();
    if (now >= steer.end) return steer.price;
    var t = (now - steer.start) / Math.max(1, steer.end - steer.start);
    t = Math.max(0, Math.min(1, t));
    t = t * t * (3 - 2 * t);
    var from = isFinite(steer.from) ? steer.from : raw;
    return from + (steer.price - from) * t;
  }

  function applySteerToMarket(market) {
    /* Overlay only — never write into OHLC / history buffers. */
    if (!market || !steer || steer.assetId !== activeAsset) return;
    var p = steeredPrice(market.price);
    if (!isFinite(p)) return;
    market.displayPrice = p;
  }

  function drawConstellation(pad, w, h) {
    var marks = ['ico-btc', 'ico-eth', 'ico-sol', 'ico-usdt', 'ico-trx'];
    var i;
    ctx.save();
    ctx.globalAlpha = 0.09;
    var t = Date.now() / 28000;
    var size = 32;
    for (i = 0; i < marks.length; i++) {
      var img = coinImg(marks[i]);
      var drift = ((t + i * 0.17) % 1);
      var x = pad.l + w * (0.08 + ((i * 0.19 + drift * 0.22) % 0.84));
      var y = pad.t + h * (0.18 + ((i * 0.29 + Math.sin(t * 2 + i) * 0.06) % 0.64));
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
      }
    }
    ctx.restore();
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
    if (z > 600) z = 600;
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
        gridH: 'rgba(255,255,255,0.03)',
        gridHStrong: 'rgba(255,255,255,0.05)',
        gridV: 'rgba(255,255,255,0.03)',
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
      gridH: 'rgba(255,255,255,0.03)',
      gridHStrong: 'rgba(255,255,255,0.05)',
      gridV: 'rgba(255,255,255,0.03)',
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

  function drawGrid(pad, plotW, seriesW, h, minP, maxP, theme) {
    theme = theme || plotTheme(null);
    var i;
    var span = zoomSmooth || zoomSec();
    ctx.lineWidth = 1;
    for (i = 0; i <= 5; i++) {
      var y = pad.t + (h / 5) * i;
      ctx.strokeStyle = i === 5 ? theme.gridHStrong : theme.gridH;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
      var pVal = maxP - (i / 5) * (maxP - minP);
      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px "Plus Jakarta Sans", "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(formatAxisPrice(pVal), pad.l + plotW + 4, y + 3);
    }
    // Maillage temporel à pas constant sur toute la largeur : aucune colonne
    // n'est étirée. Seule la phase est décalée d'un demi-pas, ce qui place la
    // tête pile au milieu d'une case sans qu'aucun trait ne la traverse.
    // Les paliers sont tous pairs pour que les demi-pas restent des entiers.
    var TIME_STEPS = [2, 4, 10, 20, 30, 60, 120, 240, 600];
    var pxPerSec = seriesW / Math.max(1, span);
    var stepSec = TIME_STEPS[TIME_STEPS.length - 1];
    for (i = 0; i < TIME_STEPS.length; i++) {
      if (TIME_STEPS[i] >= span / 5) {
        stepSec = TIME_STEPS[i];
        break;
      }
    }
    var stepX = stepSec * pxPerSec;
    var headXg = pad.l + seriesW;
    var axisR = pad.l + plotW;
    var kMin = -Math.ceil((headXg - pad.l) / stepX) - 1;
    var kMax = Math.ceil((axisR - headXg) / stepX);
    for (i = kMin; i <= kMax; i++) {
      var gx = headXg + stepX * (i + 0.5);
      if (gx < pad.l - 0.5 || gx > axisR + 0.5) continue;
      ctx.strokeStyle = theme.gridV;
      ctx.beginPath();
      ctx.moveTo(gx, pad.t);
      ctx.lineTo(gx, pad.t + h);
      ctx.stroke();
      // Rien n'est étiqueté à droite de la tête : pas de temps futur.
      if (i >= 0) continue;
      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px "Plus Jakarta Sans", "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('-' + Math.round(Math.abs(i + 0.5) * stepSec) + 's', gx, pad.t + h + 12);
    }
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
    if (opts.apexAiry || opts.boomSmall) maxBody = 4;
    // Titan Pulse : +40 % de largeur par rapport aux bougies ordinaires.
    if (opts.titanWide) maxBody = 7;
    var cw = Math.max(1, Math.min(maxBody, slot - gap));
    var toX = makeToX(candles.length, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var visH = Math.max(maxP - minP, 0.01);
    var capVis = visH * 0.07;
    if (opts.titanIce) capVis = visH * 0.07;
    if (opts.boomSmall || opts.apexAiry) capVis = visH * 0.05;
    var i;
    for (i = 0; i < candles.length; i++) {
      var c = candles[i];
      var up = c.c >= c.o;
      var col = up ? '#00E676' : '#ff3b30';
      if (opts.nexusCyber) col = up ? '#00E5FF' : '#1565C0';
      if (opts.titanIce) col = up ? '#f5f5f5' : '#8b9199';
      if (opts.v75Rose) col = up ? '#ff2d75' : '#d80056';
      if (opts.crashDrop && !up) col = '#FF3B30';
      // Titan Pulse : blanc pur, sans aucune teinte froide.
      var edgeCol = null;
      if (opts.titanWhite) {
        col = '#FFFFFF';
        edgeCol = '#FFFFFF';
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
      if (opts.boomSmall || opts.apexAiry) {
        var topLim = maxP - visH * 0.03;
        var botLim = minP + visH * 0.03;
        if (hWick > topLim) hWick = topLim;
        if (lWick < botLim) lWick = botLim;
        if (hWick < hiB) hWick = hiB;
        if (lWick > loB) lWick = loB;
      }
      // Mèche fine et centrée sur le corps.
      var x = toX(i);
      ctx.strokeStyle = edgeCol || col;
      ctx.lineWidth = 1;
      if (opts.titanWhite) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 10;
      }
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
        ctx.shadowColor = up ? 'rgba(0,230,118,0.45)' : 'rgba(255,23,68,0.4)';
        ctx.shadowBlur = 8;
      }
      if (opts.titanWhite) {
        // Lumière divine : corps pleins, blanc pur, halo blanc net.
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - cw / 2, y1, cw, bh);
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
      } else {
        ctx.fillStyle = col;
        ctx.fillRect(x - cw / 2, y1, cw, bh);
        if (opts.titanIce) {
          ctx.strokeStyle = col;
          ctx.lineWidth = 1;
          ctx.strokeRect(x - cw / 2, y1, cw, bh);
        }
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

  function drawTitanLightning(pad, w, h, candles, minP, maxP) {
    if (!candles || candles.length < 2) return null;
    var toX = makeToX(candles.length, pad, w);
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var i;
    var last = candles[candles.length - 1];
    var pulseT = performance.now() / 220;
    var lastX = pad.l + w;
    var lastY = toY(last.c) + Math.sin((candles.length - 1) * 0.42 - pulseT) * (1.1 + 1.6);
    var nTitan = candles.length;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(candles[0].c));
    for (i = 1; i < nTitan; i++) {
      var waveY = Math.sin(i * 0.42 - pulseT) * (1.1 + 1.6 * (i / nTitan));
      ctx.lineTo(toX(i), toY(candles[i].c) + waveY);
    }
    ctx.strokeStyle = '#e0e6ed';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(224,230,237,0.78)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: candles.length };
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

  // Trade ouvert : trait horizontal pointillé + pastille d'entrée CALL/PUT + décompte
  // à gauche. Aucun montant en dollars n'est tracé le long du trait.
  function drawEntryOn(g, map, trade, now, pad, tagIndex, minP, maxP, plotH, yShift, layout, clusterN) {
    if (!g || !trade || trade.settled) return;
    var exp = trade.expiryTime || trade.expiresAt;
    if (!exp || Date.now() >= exp) return;
    var entry = Number(trade.entryPrice != null ? trade.entryPrice : trade.openPrice);
    if (!isFinite(entry)) return;
    var ey = priceToY(entry, pad, plotH, minP, maxP);
    if (!isFinite(ey)) return;
    var plotTop = pad ? pad.t : 4;
    var plotBot = pad ? (pad.t + plotH) : (cssH - 4);
    layout = layout || plotLayout(pad);
    var isCall = trade.side === 'call';
    var lineCol = isCall ? '#00e676' : '#ff3b30';
    var fillCol = isCall ? '#007e33' : '#b71c1c';
    var idx = tagIndex || 0;
    var badgeLift = isFinite(yShift) ? yShift : 0;
    g.save();
    g.setLineDash([5, 5]);
    g.strokeStyle = lineCol;
    g.lineWidth = 1.35;
    g.globalAlpha = 0.92;
    g.beginPath();
    g.moveTo(0, ey);
    g.lineTo(cssW, ey);
    g.stroke();
    g.setLineDash([]);
    g.restore();

    var tNow = xNow || Date.now();
    var win = xWin > 0 ? xWin : (zoomSec() * 1000);
    var t0 = Number(trade.startTime || trade.startedAt || trade.openedAt || 0);
    var mx = layout.headX;
    if (t0 > 0 && win > 0) mx = layout.headX - layout.seriesW * ((tNow - t0) / win);
    mx += (idx % 3) * 5 - 5;
    ey += badgeLift;
    var r = 9;
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
    if (clusterN > 1) {
      g.font = '800 8px "Hanken Grotesk", sans-serif';
      g.fillStyle = '#ffffff';
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText('x' + clusterN, mx + r + 3, ey);
      g.textBaseline = 'alphabetic';
    }
    g.restore();

    var remaining = exp - Date.now();
    var secs = remaining / 1000;
    if (secs >= 0.15) {
      var label = secs.toFixed(1) + 's';
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

  function drawLivePriceBadge(map, price, layout) {
    if (!map || !isFinite(map.lastY)) return;
    var txt = formatAxisPrice(price);
    ctx.save();
    // Badge aéré : police plus grande et respiration horizontale, posé dans
    // l'espace libre à droite de la tête sans venir s'écraser sur l'axe.
    ctx.font = '700 12px ui-monospace, Menlo, Consolas, monospace';
    var tw = Math.ceil(ctx.measureText(txt).width) + 18;
    var th = 21;
    var headX = layout && layout.headX != null ? layout.headX : cssW * headRatio();
    var x = headX + 14;
    var axisX = layout && layout.axisX != null ? layout.axisX : cssW - 8;
    if (x + tw > axisX - 6) x = axisX - tw - 6;
    if (x < headX + 10) x = headX + 10;
    var y = map.lastY - th / 2;
    y = Math.max(4, Math.min(cssH - th - 4, y));
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.strokeStyle = 'rgba(245,166,35,0.6)';
    ctx.lineWidth = 1;
    roundRect(x, y, tw, th, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F5A623';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + tw / 2, y + th / 2 + 0.5);
    ctx.restore();
  }

  function dampedRange(candles, assetId, minP, maxP) {
    if (assetId !== 'boomspike' && assetId !== 'crash300' && assetId !== 'titanpulse') {
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
      lo = p * 0.994;
      hi = p * 1.006;
    }
    st.lockMin = lo;
    st.lockMax = hi;
    st.lockUntil = Math.max(st.lockUntil || 0, untilMs);
    if (assetId === activeAsset) {
      viewMin = lo;
      viewMax = hi;
    }
  }

  function idleCamera(histMin, histMax, prevMin, prevMax, head) {
    var span = histMax - histMin;
    var currentPrice = head > 0 ? head : (histMin + histMax) / 2;
    if (!(span > 0) || span < currentPrice * 0.003) {
      span = currentPrice * 0.003;
      histMin = currentPrice - span * 0.5;
      histMax = currentPrice + span * 0.5;
    }
    return { min: histMin - span * padBottomRatio(), max: histMax + span * padTopRatio() };
  }

  function drawFrame(now) {
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
    applySteerToMarket(market);
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
    // Bascule plein écran : on repart d'un cadrage net avant de lisser.
    if (fsOn !== fsWasOn) {
      fsWasOn = fsOn;
      wantFitY = true;
    }
    var pad = fsOn
      ? { t: 4, r: 50, b: 16, l: 4 }
      : { t: narrow ? 6 : 8, r: 56, b: 22, l: 8 };
    var layout = plotLayout(pad);
    var w = layout.plotW;
    var seriesW = layout.seriesW;
    var h = cssH - pad.t - pad.b;
    if (h < 48) h = 48;

    var wantZoom = zoomSec();
    if (!(zoomSmooth > 0)) zoomSmooth = wantZoom;
    zoomSmooth += (wantZoom - zoomSmooth) * 0.22;
    if (Math.abs(zoomSmooth - wantZoom) < 0.4) zoomSmooth = wantZoom;
    xNow = frameWallClock(now);
    xWin = Math.max(8000, zoomSmooth * 1000);
    if (allTrades.length) {
      var tOldest = xNow;
      var ta;
      for (ta = 0; ta < allTrades.length; ta++) {
        var ts0 = Number(allTrades[ta].startTime || allTrades[ta].startedAt || 0);
        if (ts0 > 0 && ts0 < tOldest) tOldest = ts0;
      }
      var needWin = (xNow - tOldest) + 8000;
      if (needWin > xWin) xWin = Math.min(600000, needWin);
    }

    // Fond profond unique — zéro beige / blanc.
    ctx.fillStyle = '#0B0E14';
    ctx.fillRect(0, 0, cssW, cssH);

    var candles = visibleCandles(market);
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
      var fit = fitVisibleY(candles, extrasY);
      viewMin = fit.min;
      viewMax = fit.max;
      if (holdLock) {
        st.lockMin = viewMin;
        st.lockMax = viewMax;
        strikeLock = { assetId: activeAsset, min: viewMin, max: viewMax, entry: null, ey: null };
      }
      wantFitY = false;
      pendingYAnchor = null;
    } else if (fsOn && viewMax > viewMin) {
      // Plein écran : la fenêtre glisse en continu vers le cadrage cible au lieu
      // de rester figée, sinon la courbe dérive vers le haut ou le bas.
      var fsFit = fitVisibleY(candles, extrasY);
      viewMin += (fsFit.min - viewMin) * FS_Y_LERP;
      viewMax += (fsFit.max - viewMax) * FS_Y_LERP;
      if (minPrice < viewMin || maxPrice > viewMax) {
        viewMin = fsFit.min;
        viewMax = fsFit.max;
      }
      if (holdLock) {
        st.lockMin = viewMin;
        st.lockMax = viewMax;
        strikeLock = { assetId: activeAsset, min: viewMin, max: viewMax, entry: null, ey: null };
      }
    } else if (holdLock && st.lockMax > st.lockMin) {
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
      var cam = idleCamera(minPrice, maxPrice, prevMin, prevMax, head);
      viewMin = cam.min;
      viewMax = cam.max;
    }
    var rawVisibleSpan = Math.max(maxPrice - minPrice, Math.abs(head) * 0.001);
    var keepAir = rawVisibleSpan * Y_PAD_RATIO;
    var keepAirLow = rawVisibleSpan * padBottomRatio();
    var needsSafeFit = minPrice < viewMin + keepAirLow || maxPrice > viewMax - keepAir;
    if (!fsOn && holdLock && needsSafeFit) {
      var safeFit = fitVisibleY(candles, extrasY);
      viewMin = safeFit.min;
      viewMax = safeFit.max;
    } else if (!fsOn && !holdLock) {
      if (head > viewMax - keepAir) viewMax = head + keepAir;
      if (head < viewMin + keepAirLow) viewMin = head - keepAirLow;
      if (isFinite(strikeP) && strikeP > 0) {
        if (strikeP > viewMax - keepAir) viewMax = strikeP + keepAir;
        if (strikeP < viewMin + keepAirLow) viewMin = strikeP - keepAirLow;
      }
    }
    if (holdLock) {
      st.lockMin = viewMin;
      st.lockMax = viewMax;
    }
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

    drawConstellation(pad, w, h);
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.font = '800 62px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    var wx = cssW / 2;
    var wy = pad.t + h / 2;
    var grad = ctx.createLinearGradient(wx - 140, wy, wx + 140, wy);
    grad.addColorStop(0, 'rgba(180,120,32,0.55)');
    grad.addColorStop(0.45, 'rgba(245,197,24,0.95)');
    grad.addColorStop(1, 'rgba(180,120,32,0.55)');
    ctx.fillStyle = grad;
    ctx.fillText('OROLADO', wx, wy);
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
        crashDrop: asset.id === 'crash300'
      });
      if (asset.trendLine) drawTrendLine(pad, seriesW, h, candles, minP, maxP);
    } else if (asset.lineStyle === 'step') {
      map = drawStepLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#2F6BFF', asset.lineAccent || '#FF7A00', asset.lineWidth || 3);
    } else if (asset.lineStyle === 'smooth' || asset.plotTheme === 'ivoryGold') {
      map = drawSmoothLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#ff9800', asset.lineWidth || 2.5, asset.lineHalo || (asset.id === 'horizon50' ? 'rgba(255,152,0,0.55)' : null));
    } else if (asset.id === 'goldtrend') {
      map = drawGradientLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#ffb300', 2.5, '255,179,0');
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
      if (ti >= 10) break;
      var ot = allTrades[ti];
      var epY = Number(ot.entryPrice != null ? ot.entryPrice : ot.openPrice);
      var y0 = priceToY(epY, pad, h, minP, maxP);
      var t0 = Number(ot.startTime || ot.startedAt || 0);
      var key = String(Math.round(y0 / 8)) + ':' + String(Math.round(t0 / 400));
      var count = 1;
      var uj;
      for (uj = 0; uj < allTrades.length; uj++) {
        if (uj === ti) continue;
        var ot2 = allTrades[uj];
        var y2 = priceToY(Number(ot2.entryPrice != null ? ot2.entryPrice : ot2.openPrice), pad, h, minP, maxP);
        var t2 = Number(ot2.startTime || ot2.startedAt || 0);
        if (Math.abs(y0 - y2) < 10 && Math.abs(t0 - t2) < 400) count++;
      }
      if (drawnKeys[key]) continue;
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
      tagCol = market.price >= (market.candle && market.candle.o) ? '#00E676' : '#FF3B30';
    }
    if (asset.id === 'nexusprime') tagCol = '#00E5FF';
    if (asset.id === 'titanpulse') tagCol = '#e0e6ed';
    if (asset.id === 'v75') tagCol = '#ff2d75';
    if (map) {
      drawBead(map, market.price, tagCol, now, theme);
      drawLivePriceBadge(map, market.price, layout);
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
  }

  function wakeChartEngine() {
    window.chartIsPaused = false;
    window.lastTickTime = performance.now();
    lastTs = performance.now();
    lastFlush = 0;
    lastDraw = 0;
    if (D6.Engine && D6.Engine.resyncClocks) {
      try { D6.Engine.resyncClocks(); } catch (eRs) { /* ignore */ }
    }
    running = true;
    if (!loopRaf) {
      loopRaf = requestAnimationFrame(loop);
    }
    window.animationFrameId = loopRaf;
    try { drawNow(); } catch (eW) { /* ignore */ }
  }

  function bindVisibilityFix() {
    if (window.__oroladoVisBound) return;
    window.__oroladoVisBound = true;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pauseChartEngine();
      else wakeChartEngine();
    });
    window.addEventListener('pageshow', function () {
      if (!document.hidden) wakeChartEngine();
    });
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
          try { resize(); requestAnimationFrame(resize); } catch (e7) { /* ignore */ }
        });
        window.addEventListener('orientationchange', function () {
          setTimeout(function () { try { resize(); } catch (e8) { /* ignore */ } }, 120);
        });
        if (window.visualViewport) {
          try {
            visualViewport.addEventListener('resize', function () {
              try { resize(); requestAnimationFrame(resize); } catch (e9) { /* ignore */ }
            });
          } catch (eVv) { try { console.warn('Mobile display fallback:', eVv); } catch (e10) { /* ignore */ } }
        }
        if (window.ResizeObserver && canvas.parentElement) {
          try {
            var roWait = 0;
            var ro = new ResizeObserver(function () {
              if (roWait) return;
              roWait = requestAnimationFrame(function () {
                roWait = 0;
                try { resize(); } catch (e11) { /* ignore */ }
              });
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
      if (document.documentElement.classList.contains('fs-trade') ||
        (document.getElementById('fsTradeOverlay') && document.getElementById('fsTradeOverlay').classList.contains('on'))) {
        wantFitY = true;
        pendingYAnchor = null;
      }
      if (steer && steer.assetId !== id) steer = null;
      var liveBuf = liveBuffer(id);
      var st = ensureAssetState(id);
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
      } else if (st.viewMin && st.viewMax) {
        viewMin = st.viewMin;
        viewMax = st.viewMax;
        strikeLock = null;
      } else if (st.min && st.max) {
        viewMin = st.min;
        viewMax = st.max;
        strikeLock = null;
      }
      if (isFinite(st.lastPrice) && st.lastPrice > 0) lastDrawnClose = st.lastPrice;
      if (D6.Engine && D6.Engine.getMarket) D6.Engine.getMarket(id);
      if (D6.Engine && D6.Engine.getTrades) {
        D6.Engine.getTrades().forEach(function (t) {
          var snap = snapshotTradeVisual(t);
          if (!snap) return;
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
