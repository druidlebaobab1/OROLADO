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

  function plotLayout(pad) {
    pad = pad || { t: 16, r: 45, b: 28, l: 8 };
    var plotW = Math.max(40, cssW - pad.l - pad.r);
    var axisX = pad.l + plotW;
    var headX = pad.l + plotW * 0.80;
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
    return seriesW * (1000 / Math.max(1, tWin));
  }

  function scrollOffsetX(seriesW) {
    var tNow = xNow || Date.now();
    var cms = 1000;
    var tStart = Math.floor(tNow / cms) * cms;
    return ((tNow - tStart) / cms) * candleStepWidth(seriesW);
  }

  function makeToX(n, pad, seriesW) {
    var count = (xTimes && xTimes.length) ? xTimes.length : n;
    if (!(count > 1)) count = Math.max(1, n || 1);
    var x0 = pad.l;
    var span = Math.max(32, seriesW);
    var step = candleStepWidth(span);
    var off = scrollOffsetX(span);
    return function (i) {
      var idx = Math.max(0, Math.min(count - 1, i));
      return x0 + span - (count - 1 - idx) * step - off;
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
      status: trade.status || 'open',
      stake: Number(trade.stake) || 0,
      payout: trade.payout
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

  function resize() {
    if (!canvas) return;
    var parent = canvas.parentElement;
    if (!parent) return;
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

    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
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

  function visibleCandles(market) {
    var live = liveBuffer(activeAsset);
    if ((!live || !live.candles || live.candles.length < 40) && D6.Engine) {
      if (D6.Engine.getBuffer) D6.Engine.getBuffer(activeAsset);
      else if (D6.Engine.getMarket) D6.Engine.getMarket(activeAsset);
      live = liveBuffer(activeAsset);
    }
    var plotW = Math.max(140, cssW * 0.70);
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
    var forming = (live && live.forming) || (market && market.candle);
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
    var forming = (live && live.forming) || (market && market.candle);
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
    for (i = 0; i <= 5; i++) {
      var x = pad.l + (plotW / 5) * i;
      ctx.strokeStyle = theme.gridV;
      ctx.beginPath();
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, pad.t + h);
      ctx.stroke();
    }
    for (i = 0; i <= 4; i++) {
      var lx = pad.l + (seriesW / 4) * i;
      var ago = Math.round(((4 - i) / 4) * span);
      var label = ago === 0 ? 'now' : '-' + ago + 's';
      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px "Plus Jakarta Sans", "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, lx, pad.t + h + 12);
    }
  }

  function drawCandles(pad, w, h, candles, minP, maxP, opts) {
    if (!candles || candles.length < 2) return null;
    opts = opts || {};
    var thin = !!opts.thin;
    var span = Math.max(maxP - minP, 0.01);
    var n = candles.length;
    var slot = w / Math.max(1, n);
    var gap = Math.min(4, Math.max(3, slot * 0.34));
    var cw = Math.min(8, Math.max(6, slot - gap));
    if (slot < 9) {
      gap = Math.max(2.2, slot * 0.30);
      cw = Math.max(5, slot - gap);
    }
    if (opts.apexAiry) {
      gap = Math.min(5.5, Math.max(3.4, slot * 0.44));
      cw = Math.min(6.2, Math.max(3.6, slot - gap));
    }
    if (opts.boomSmall) {
      gap = Math.min(5, Math.max(3.2, slot * 0.40));
      cw = Math.min(5.4, Math.max(3.2, slot - gap));
    }
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
      var x = toX(i);
      ctx.strokeStyle = col;
      ctx.lineWidth = (opts.titanIce || opts.v75Rose) ? 1 : (thin ? 1 : 1.15);
      ctx.beginPath();
      ctx.moveTo(x, toY(hWick));
      ctx.lineTo(x, toY(lWick));
      ctx.stroke();
      var y1 = toY(Math.max(c.o, c.c));
      var y2 = toY(Math.min(c.o, c.c));
      var bh = Math.max(opts.titanIce ? 2.2 : (opts.v75Rose ? 2.4 : 3), y2 - y1);
      if (opts.titanIce && y2 - y1 < 2) bh = 2;
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
      } else if (!thin && i === candles.length - 1 && cssH >= 200 && !opts.v75Rose) {
        ctx.shadowColor = up ? 'rgba(0,230,118,0.45)' : 'rgba(255,23,68,0.4)';
        ctx.shadowBlur = 8;
      }
      if (opts.v75Rose && up) {
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
        var aboveNow = isFinite(lastDrawnClose) ? lastDrawnClose > entry : false;
        if (!isCall) aboveNow = isFinite(lastDrawnClose) ? lastDrawnClose < entry : false;
        var liveWin = !!aboveNow;
        var stakeN = Number(trade.stake);
        var payRaw = trade.payout;
        if (!(stakeN > 0) && D6.Engine && D6.Engine.getTrades) {
          var liveTr = D6.Engine.getTrades();
          var li;
          for (li = 0; li < liveTr.length; li++) {
            if (liveTr[li] && liveTr[li].id === trade.id) {
              stakeN = Number(liveTr[li].stake) || stakeN;
              if (payRaw == null) payRaw = liveTr[li].payout;
              break;
            }
          }
        }
        var pctN = 88;
        var pr = parseFloat(payRaw);
        if (pr === 88 || pr === 500 || pr === 1000 || pr === 5000) pctN = pr;
        else if (isFinite(pr) && pr > 1 && pr < 80) pctN = Math.round((pr - 1) * 100);
        else if (pr >= 80) pctN = pr;
        var gainN = stakeN * (pctN / 100);
        if (D6.roundMoney) {
          gainN = D6.roundMoney(gainN);
          stakeN = D6.roundMoney(stakeN);
        }
        var money = liveWin
          ? ('+$' + (Number(gainN) || 0).toFixed(2))
          : ('-$' + (Number(stakeN) || 0).toFixed(2));
        var mw = Math.max(52, 8 + money.length * 7.2);
        var mx0 = leftX + timerW + 6;
        g.fillStyle = 'rgba(10,15,29,0.92)';
        g.strokeStyle = liveWin ? '#00e676' : '#ff3b30';
        roundRectOn(g, mx0, ty, mw, timerH, 7);
        g.fill();
        g.stroke();
        g.fillStyle = liveWin ? '#00e676' : '#ff3b30';
        g.fillText(money, mx0 + mw / 2, ty + timerH / 2 + 0.5);
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
    var pulse = 0.55 + 0.45 * Math.sin(now / 150);
    ctx.save();
    if (v75Head) {
      ctx.beginPath();
      ctx.arc(map.lastX, map.lastY, 8.5 + pulse * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(233,30,99,0.32)';
      ctx.fill();
    } else if (titanHead) {
      ctx.beginPath();
      ctx.arc(map.lastX, map.lastY, 8 + pulse * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fill();
    } else if (nexusHead) {
      ctx.beginPath();
      ctx.arc(map.lastX, map.lastY, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,229,255,0.28)';
      ctx.fill();
    } else if (!compact) {
      ctx.beginPath();
      ctx.arc(map.lastX, map.lastY, 9 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = theme.beadGlow || 'rgba(255,215,0,0.16)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(map.lastX, map.lastY, compact ? 3 : (v75Head ? 3.8 : (titanHead ? 3.4 : (nexusHead ? 3.6 : 4.2))), 0, Math.PI * 2);
    ctx.fillStyle = compact ? '#ff2244' : (v75Head ? '#ff2d75' : (titanHead ? '#e0e6ed' : (nexusHead ? '#00E5FF' : color)));
    ctx.shadowColor = compact ? 'transparent' : (v75Head ? '#ff2d75' : (titanHead ? '#e0e6ed' : (nexusHead ? '#00E5FF' : color)));
    ctx.shadowBlur = compact ? 0 : (v75Head ? 14 : (titanHead ? 11 : (nexusHead ? 10 : 12)));
    ctx.fill();
    ctx.restore();
  }

  function drawLivePriceBadge(map, price, layout) {
    if (!map || !isFinite(map.lastY)) return;
    var txt = formatAxisPrice(price);
    ctx.save();
    ctx.font = '700 9.5px ui-monospace, Menlo, Consolas, monospace';
    var tw = Math.ceil(ctx.measureText(txt).width) + 10;
    var th = 14;
    var headX = layout && layout.headX != null ? layout.headX : cssW * 0.70;
    var x = headX + 10;
    var axisX = layout && layout.axisX != null ? layout.axisX : cssW - 8;
    if (x + tw > axisX - 2) x = axisX - tw - 2;
    if (x < headX + 4) x = headX + 4;
    var y = map.lastY - th / 2;
    y = Math.max(4, Math.min(cssH - th - 4, y));
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.strokeStyle = 'rgba(245,166,35,0.45)';
    ctx.lineWidth = 1;
    roundRect(x, y, tw, th, 4);
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
    var lo = band.min;
    var hi = band.max;
    var e;
    if (extras) {
      for (e = 0; e < extras.length; e++) {
        var x = Number(extras[e]);
        if (!isFinite(x) || x <= 0 || x > 1e7) continue;
        if (x < lo) lo = x;
        if (x > hi) hi = x;
      }
    }
    var span = hi - lo;
    if (!(span > 0)) {
      var mid = (lo + hi) / 2 || 10000;
      span = mid * 0.012;
      lo = mid - span / 2;
      hi = mid + span / 2;
    }
    var pad = Math.max(span * 0.15, ((lo + hi) / 2) * 0.004);
    return { min: lo - pad, max: hi + pad };
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
    var minSpan = (head > 0 ? head : histMax) * 0.012;
    if (!(span > 0) || span < minSpan) {
      var mid = head > 0 ? head : (histMin + histMax) / 2;
      histMin = mid - minSpan / 2;
      histMax = mid + minSpan / 2;
      span = histMax - histMin;
    }
    var pad = Math.max(span * 0.15, (head > 0 ? head : span) * 0.004);
    var yMin = histMin - pad;
    var yMax = histMax + pad;
    var k = 0.15;
    if (prevMin && prevMax && prevMax > prevMin) {
      return {
        min: prevMin * (1 - k) + yMin * k,
        max: prevMax * (1 - k) + yMax * k
      };
    }
    return { min: yMin, max: yMax };
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
    var allTrades = collectOpenTradeVisuals();
    var primary = allTrades[0] || null;
    allTrades.forEach(function (ot) {
      if (!primary || (ot.expiryTime || ot.expiresAt) < (primary.expiryTime || primary.expiresAt)) primary = ot;
    });
    var narrow = (window.innerWidth || 0) <= 430;
    var fsOn = !!(document.documentElement.classList.contains('fs-trade') ||
      (document.getElementById('fsTradeOverlay') && document.getElementById('fsTradeOverlay').classList.contains('on')));
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
    xNow = Date.now();
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
    var currentPrice = (isFinite(market.price) && market.price > 0 && market.price < 1e7)
      ? market.price
      : ((minPrice + maxPrice) / 2);
    var spanRaw = maxPrice - minPrice;
    if (!(spanRaw > 0) || spanRaw < currentPrice * 0.012) {
      minPrice = currentPrice * (1 - 0.006);
      maxPrice = currentPrice * (1 + 0.006);
      spanRaw = maxPrice - minPrice;
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
    } else if (fsOn && viewMax > viewMin) {
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
    var keepAir = Math.max((viewMax - viewMin) * 0.15, Math.abs(head) * 0.004);
    function pinInView(p) {
      if (!isFinite(p) || p <= 0 || p > 1e7) return;
      if (p > viewMax - keepAir) viewMax = p + keepAir;
      if (p < viewMin + keepAir) viewMin = p - keepAir;
    }
    pinInView(head);
    pinInView(strikeP);
    if (holdLock) {
      st.lockMin = viewMin;
      st.lockMax = viewMax;
    }
    st.viewMin = viewMin;
    st.viewMax = viewMax;

    if (candles && candles.length && isFinite(candles[candles.length - 1].c)) {
      var lc = Number(candles[candles.length - 1].c);
      if (lc > 0 && lc < 1e7) lastDrawnClose = lc;
    } else if (isFinite(market.price) && market.price > 0 && market.price < 1e7) {
      lastDrawnClose = Number(market.price);
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
        titanIce: true
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
        crashDrop: asset.id === 'crash300'
      });
      if (asset.trendLine) drawTrendLine(pad, seriesW, h, candles, minP, maxP);
    } else if (asset.lineStyle === 'step') {
      map = drawStepLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#2F6BFF', asset.lineAccent || '#FF7A00', asset.lineWidth || 3);
    } else if (asset.lineStyle === 'smooth' || asset.plotTheme === 'ivoryGold') {
      map = drawSmoothLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#00d2ff', asset.lineWidth || 2.5, asset.lineHalo || (asset.id === 'horizon50' ? 'rgba(0,210,255,0.55)' : null));
    } else if (asset.id === 'goldtrend') {
      map = drawCoreLine(pad, seriesW, h, lineData, minP, maxP, asset.lineColor || '#ffb300', 2.6);
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
      var drawEvery = 16;
      var tickEvery = liveN > 0 ? 150 : 220;
      if (ts - lastFlush >= tickEvery) {
        if (D6.Engine && D6.Engine.tick) D6.Engine.tick(activeAsset);
        flushDue();
        lastFlush = ts;
        window.lastTickTime = ts;
      }
      if (ts - lastDraw < drawEvery) return;
      lastDraw = ts;
      if (!lastTs) lastTs = ts;
      lastTs = ts;
      payoutAcc += drawEvery;

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
            });
            fsObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            var fsOv = document.getElementById('fsTradeOverlay');
            if (fsOv) fsObs.observe(fsOv, { attributes: true, attributeFilter: ['class'] });
            document.addEventListener('fullscreenchange', function () {
              try { resize(); drawNow(); } catch (eFc) { /* ignore */ }
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
          try { requestAnimationFrame(resize); } catch (e7) { /* ignore */ }
        });
        window.addEventListener('orientationchange', function () {
          setTimeout(function () { try { resize(); } catch (e8) { /* ignore */ } }, 120);
        });
        if (window.visualViewport) {
          try {
            visualViewport.addEventListener('resize', function () {
              try { requestAnimationFrame(resize); } catch (e9) { /* ignore */ }
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
      viewMin = 0;
      viewMax = 0;
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
