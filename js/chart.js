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
  var viewMin = 0;
  var viewMax = 0;
  var onFrame = null;
  var ZOOM_STEPS = [30, 45, 60, 90, 120, 180];
  var zoomIdx = 2;
  var inds = { ma: true, bb: false };
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

  function zoomSec() {
    return ZOOM_STEPS[zoomIdx] || 60;
  }

  function isChartReady() {
    return !!(ctx && canvas && cssW >= 8 && cssH >= 8);
  }

  function tradeEntryPrice(trade) {
    if (!trade) return NaN;
    var ep = Number(trade.entryPrice != null ? trade.entryPrice : trade.openPrice);
    return isFinite(ep) ? ep : NaN;
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
      expiryTime: exp,
      expiresAt: exp,
      settled: !!trade.settled,
      status: trade.status || 'open'
    };
  }

  function forceIncludePrice(price) {
    if (!isFinite(price)) return;
    if (!viewMin || !viewMax) {
      viewMin = price - 1;
      viewMax = price + 1;
      return;
    }
    var span = Math.max(viewMax - viewMin, 0.3);
    var pad = Math.max(span * 0.08, 0.15);
    if (price < viewMin + pad) viewMin = price - pad;
    if (price > viewMax - pad) viewMax = price + pad;
  }

  function collectOpenTradeVisuals() {
    var byId = {};
    var id;
    var now = Date.now();
    for (id in openTradeVisuals) {
      if (!openTradeVisuals.hasOwnProperty(id)) continue;
      var v = openTradeVisuals[id];
      if (!v || v.settled) continue;
      var exp = v.expiryTime || v.expiresAt;
      if (exp && now >= exp) continue;
      if (v.assetId !== activeAsset) continue;
      byId[id] = v;
    }
    var engineList = D6.Engine && D6.Engine.getTrades ? D6.Engine.getTrades() : [];
    var i;
    for (i = 0; i < engineList.length; i++) {
      var ot = engineList[i];
      if (!ot || ot.settled || ot.assetId !== activeAsset) continue;
      var e2 = ot.expiryTime || ot.expiresAt;
      if (e2 && now >= e2) continue;
      var snap = snapshotTradeVisual(ot);
      if (snap) byId[snap.id] = snap;
    }
    var out = [];
    for (id in byId) {
      if (byId.hasOwnProperty(id)) out.push(byId[id]);
    }
    out.sort(function (a, b) {
      return (a.expiryTime || a.expiresAt || 0) - (b.expiryTime || b.expiresAt || 0);
    });
    return out;
  }

  function drawNow() {
    if (!isChartReady()) return false;
    lastDraw = 0;
    drawFrame(performance.now());
    return true;
  }

  function flushOpenTradeVisualQueue() {
    if (!isChartReady()) return;
    if (openTradeVisualQueue.length) {
      var ids = openTradeVisualQueue.slice();
      openTradeVisualQueue.length = 0;
      var i;
      for (i = 0; i < ids.length; i++) {
        var v = openTradeVisuals[ids[i]];
        if (v) forceIncludePrice(v.entryPrice);
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
    if (snap.assetId === activeAsset) forceIncludePrice(snap.entryPrice);
    if (!isChartReady()) {
      if (openTradeVisualQueue.indexOf(snap.id) < 0) openTradeVisualQueue.push(snap.id);
      return false;
    }
    var ok = drawNow();
    // 2e frame : évite ligne manquante juste après place / switch d’indice.
    requestAnimationFrame(function () {
      if (snap.assetId === activeAsset) forceIncludePrice(snap.entryPrice);
      drawNow();
    });
    return ok;
  }

  function removeTradeVisual(tradeId) {
    if (!tradeId) return;
    delete openTradeVisuals[tradeId];
    var qi = openTradeVisualQueue.indexOf(tradeId);
    if (qi >= 0) openTradeVisualQueue.splice(qi, 1);
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
    var rect = parent.getBoundingClientRect();
    var w = Math.max(1, Math.floor(parent.clientWidth || rect.width || 0));
    var h = Math.max(1, Math.floor(parent.clientHeight || rect.height || 0));
    var mobile = (window.innerWidth || 0) <= 859;
    var minH = mobile ? 220 : 280;
    var fsMode = !!(document.documentElement.classList.contains('fs-trade') ||
      (document.getElementById('fsTradeOverlay') && document.getElementById('fsTradeOverlay').classList.contains('on')));
    // Conteneur encore plié (écran caché) : ne fige pas une mini-taille.
    if (w < 8 || h < 8) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      if (overlay) {
        overlay.style.width = '100%';
        overlay.style.height = '100%';
      }
      requestAnimationFrame(function () {
        if (canvas && canvas.parentElement) {
          var r2 = canvas.parentElement.getBoundingClientRect();
          if ((r2.width || 0) >= 8 && (r2.height || 0) >= 8) resize();
        }
      });
      return;
    }
    // Respecte la hauteur réelle du conteneur (évite l'étirement / coupure).
    // minH uniquement si le stage n'a pas encore de hauteur utile.
    if (!fsMode && h < 100) {
      parent.style.minHeight = minH + 'px';
      h = Math.max(minH, Math.floor(parent.clientHeight || parent.getBoundingClientRect().height || minH));
    } else if (!fsMode && h < minH && (parent.clientHeight || 0) < 80) {
      h = minH;
    }
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    cssW = w;
    cssH = h;
    var bw = Math.round(cssW * dpr);
    var bh = Math.round(cssH * dpr);
    var sizeChanged = canvas.width !== bw || canvas.height !== bh;
    if (sizeChanged || h < 100) {
      canvas.width = bw;
      canvas.height = bh;
    }
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (overlay) {
      if (overlay.width !== bw || overlay.height !== bh || sizeChanged) {
        overlay.width = bw;
        overlay.height = bh;
      }
      overlay.style.width = cssW + 'px';
      overlay.style.height = cssH + 'px';
      if (octx) octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // Même frame que setData/resize : flusher les lignes en attente.
    flushOpenTradeVisualQueue();
    if (sizeChanged && running) drawNow();
  }

  function visibleCandles(market) {
    var n = zoomSec();
    var done = market.candles || [];
    var list = done.slice(Math.max(0, done.length - n));
    if (market.candle) list = list.concat([market.candle]);
    return list;
  }

  function closeSeries(market) {
    tmpCloses.length = 0;
    var done = market.candles || [];
    var i;
    for (i = 0; i < done.length; i++) tmpCloses.push(done[i].c);
    if (market.candle) tmpCloses.push(market.candle.c);
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
    // V100 + STABLE : thème sombre historique (ne pas changer).
    if (id === 'crash300' || id === 'boom300' || (asset && asset.plotTheme === 'ivoryGold')) {
      return {
        id: 'ivoryGold',
        bg0: '#FFF8EC',
        bg1: '#F7EBD2',
        gridH: 'rgba(201,162,39,0.28)',
        gridHStrong: 'rgba(201,162,39,0.42)',
        gridV: 'rgba(232,215,168,0.85)',
        border: '#C9A227',
        priceTxt: '#5C4A12',
        timeTxt: 'rgba(92,74,18,0.72)',
        watermark: 'rgba(201,162,39,0.035)',
        rsiBg: 'rgba(255,248,236,0.92)',
        rsiBorder: 'rgba(201,162,39,0.45)',
        rsiTxt: '#5C4A12',
        maFast: 'rgba(92,74,18,0.9)',
        maSlow: 'rgba(47,107,255,0.75)',
        bbFill: 'rgba(201,162,39,0.10)',
        bbStroke: 'rgba(201,162,39,0.45)',
        beadGlow: 'rgba(201,162,39,0.25)'
      };
    }
    if (id === 'v75' || (asset && asset.plotTheme === 'darkPro')) {
      return {
        id: 'darkPro',
        bg0: '#0B1220',
        bg1: '#070B14',
        gridH: 'rgba(255,215,0,0.055)',
        gridHStrong: 'rgba(255,215,0,0.14)',
        gridV: 'rgba(255,215,0,0.045)',
        border: 'rgba(255,215,0,0.18)',
        priceTxt: 'rgba(168,180,204,0.82)',
        timeTxt: 'rgba(140,154,176,0.7)',
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
    // Défaut = thème sombre actuel (V100 / STABLE).
    return {
      id: 'darkLegacy',
      bg0: '#121722',
      bg1: '#0B0E14',
      gridH: 'rgba(255,215,0,0.06)',
      gridHStrong: 'rgba(255,215,0,0.16)',
      gridV: 'rgba(255,215,0,0.05)',
      border: null,
      priceTxt: 'rgba(168,180,204,0.78)',
      timeTxt: 'rgba(140,154,176,0.7)',
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

  function drawGrid(pad, w, h, minP, maxP, theme) {
    theme = theme || plotTheme(null);
    var i;
    var span = zoomSec();
    ctx.lineWidth = 1;
    for (i = 0; i <= 5; i++) {
      var y = pad.t + (h / 5) * i;
      ctx.strokeStyle = i === 5 ? theme.gridHStrong : theme.gridH;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + w, y);
      ctx.stroke();
      var pVal = maxP - (i / 5) * (maxP - minP);
      ctx.fillStyle = theme.priceTxt;
      ctx.font = '600 10px "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(pVal.toFixed(2), pad.l + w + 6, y + 3);
    }
    for (i = 0; i <= 4; i++) {
      var x = pad.l + (w / 4) * i;
      ctx.strokeStyle = theme.gridV;
      ctx.beginPath();
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, pad.t + h);
      ctx.stroke();
      var ago = Math.round(((4 - i) / 4) * span);
      var label = ago === 0 ? 'now' : '-' + ago + 's';
      ctx.fillStyle = theme.timeTxt;
      ctx.font = '600 9px "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, pad.t + h + 12);
    }
    if (theme.border) {
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(pad.l + 0.5, pad.t + 0.5, w - 1, h - 1);
    }
  }

  function drawCandles(pad, w, h, candles, minP, maxP, opts) {
    if (!candles || candles.length < 2) return null;
    opts = opts || {};
    var thin = !!opts.thin;
    var span = Math.max(maxP - minP, 0.01);
    var toX = function (i) { return pad.l + (i / (candles.length - 1)) * w; };
    var toY = function (p) { return pad.t + h * (1 - (p - minP) / span); };
    var cw = Math.max(thin ? 1.4 : 2.2, (w / candles.length) * (thin ? 0.42 : 0.62));
    var i;
    for (i = 0; i < candles.length; i++) {
      var c = candles[i];
      var up = c.c >= c.o;
      var col = up ? '#00E676' : '#FF1744';
      var x = toX(i);
      ctx.strokeStyle = col;
      ctx.lineWidth = thin ? 0.9 : 1.2;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.h));
      ctx.lineTo(x, toY(c.l));
      ctx.stroke();
      var y1 = toY(Math.max(c.o, c.c));
      var y2 = toY(Math.min(c.o, c.c));
      var bh = Math.max(thin ? 1 : 1.5, y2 - y1);
      ctx.fillStyle = col;
      if (!thin && i === candles.length - 1 && cssH >= 200) {
        ctx.shadowColor = up ? 'rgba(0,230,118,0.45)' : 'rgba(255,23,68,0.4)';
        ctx.shadowBlur = 8;
      }
      ctx.fillRect(x - cw / 2, y1, cw, bh);
      ctx.shadowBlur = 0;
    }
    var last = candles[candles.length - 1];
    return { toX: toX, toY: toY, lastX: toX(candles.length - 1), lastY: toY(last.c), count: candles.length };
  }

  function drawTrendLine(pad, w, h, candles, minP, maxP) {
    if (!candles || candles.length < 2) return;
    var span = Math.max(maxP - minP, 0.01);
    var toX = function (i) { return pad.l + (i / (candles.length - 1)) * w; };
    var toY = function (p) { return pad.t + h * (1 - (p - minP) / span); };
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

  function drawLine(pad, w, h, data, minP, maxP) {
    if (!data || data.length < 2) return null;
    var span = Math.max(maxP - minP, 0.01);
    var toX = function (i) { return pad.l + (i / (data.length - 1)) * w; };
    var toY = function (p) { return pad.t + h * (1 - (p - minP) / span); };
    var lastX = toX(data.length - 1);
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
    grad.addColorStop(0, 'rgba(255,215,0,0.32)');
    grad.addColorStop(1, 'rgba(255,215,0,0)');
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
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(255,215,0,0.85)';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: data.length };
  }

  function drawSmoothLine(pad, w, h, data, minP, maxP, color, width) {
    if (!data || data.length < 2) return null;
    var span = Math.max(maxP - minP, 0.01);
    var toX = function (i) { return pad.l + (i / (data.length - 1)) * w; };
    var toY = function (p) { return pad.t + h * (1 - (p - minP) / span); };
    var lastX = toX(data.length - 1);
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
    ctx.strokeStyle = color || '#FF7A00';
    ctx.lineWidth = width || 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,122,0,0.35)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: data.length };
  }

  function drawStepLine(pad, w, h, data, minP, maxP, color, accent, width) {
    if (!data || data.length < 2) return null;
    var span = Math.max(maxP - minP, 0.01);
    var toX = function (i) { return pad.l + (i / (data.length - 1)) * w; };
    var toY = function (p) { return pad.t + h * (1 - (p - minP) / span); };
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
    var lastX = toX(data.length - 1);
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
      var x = map.toX(i);
      var y = map.toY(up[i]);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    for (i = lo.length - 1; i >= 0; i--) {
      if (lo[i] == null) continue;
      ctx.lineTo(map.toX(i), map.toY(lo[i]));
    }
    ctx.closePath();
    ctx.fillStyle = theme.bbFill;
    ctx.fill();
    ctx.strokeStyle = theme.bbStroke;
    ctx.lineWidth = 1;
    started = false;
    ctx.beginPath();
    for (i = 0; i < up.length; i++) {
      if (up[i] == null) continue;
      if (!started) { ctx.moveTo(map.toX(i), map.toY(up[i])); started = true; }
      else ctx.lineTo(map.toX(i), map.toY(up[i]));
    }
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
    var toX = function (i) { return pad.l + (i / Math.max(1, n - 1)) * w; };
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
    ctx.strokeStyle = last >= 70 ? '#FF1744' : last <= 30 ? '#00E676' : '#C9A227';
    ctx.lineWidth = 1.4;
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
    var toX = function (idx) { return pad.l + (idx / Math.max(1, n - 1)) * w; };
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

  function priceToY(price, pad, h, minP, maxP) {
    var span = Math.max((maxP - minP) || 0.01, 0.01);
    var top = pad ? pad.t : 14;
    var height = h > 0 ? h : Math.max(40, cssH - 36);
    return top + height * (1 - (Number(price) - minP) / span);
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

  function drawEntryOn(g, map, trade, now, pad, tagIndex, minP, maxP, plotH) {
    if (!g || !trade || trade.settled) return;
    var exp = trade.expiryTime || trade.expiresAt;
    if (!exp || Date.now() >= exp) return;
    var entry = Number(trade.entryPrice != null ? trade.entryPrice : trade.openPrice);
    if (!isFinite(entry)) return;
    var ey = map && typeof map.toY === 'function'
      ? map.toY(entry)
      : priceToY(entry, pad, plotH, minP, maxP);
    if (!isFinite(ey)) {
      ey = priceToY(entry, pad, plotH, minP, maxP);
    }
    if (!isFinite(ey)) return;
    var plotTop = pad ? pad.t : 4;
    var plotBot = pad ? (pad.t + plotH) : (cssH - 4);
    var x0 = pad ? pad.l : 8;
    var x1 = pad ? (cssW - pad.r) : (cssW - 62);
    if (x1 <= x0 + 8) x1 = Math.max(x0 + 40, cssW - 8);
    // Dernier recours : rester dans le plot (l’échelle Y doit déjà inclure entry).
    if (ey < plotTop || ey > plotBot) {
      ey = Math.max(plotTop + 4, Math.min(plotBot - 4, ey));
    }
    var isCall = trade.side === 'call';
    var col = isCall ? '#22C55E' : '#EF4444';
    var idx = tagIndex || 0;
    g.save();
    g.setLineDash([7, 5]);
    g.strokeStyle = col;
    g.lineWidth = 2.2;
    g.globalAlpha = 1;
    g.beginPath();
    g.moveTo(x0, ey);
    g.lineTo(x1, ey);
    g.stroke();
    g.setLineDash([]);
    g.restore();
    var tag = (isCall ? 'CALL ' : 'PUT ') + entry.toFixed(2);
    g.font = '800 11px "Hanken Grotesk", sans-serif';
    var tw = Math.ceil(g.measureText(tag).width) + 14;
    var th = 20;
    var nearTop = (ey - plotTop) < 40;
    var nearBot = (plotBot - ey) < 40;
    var bx = x1 - tw - 4;
    if (bx < x0 + 4) bx = x0 + 4;
    var by;
    if (nearTop) by = ey + 6 + idx * 22;
    else if (nearBot) by = ey - th - 6 - idx * 22;
    else by = ey - th - 4 - idx * 22;
    by = Math.max(plotTop + 2, Math.min(plotBot - th - 2, by));
    g.fillStyle = col;
    roundRectOn(g, bx, by, tw, th, 5);
    g.fill();
    g.fillStyle = '#0A0F1D';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(tag, bx + tw / 2, by + th / 2);
    g.textBaseline = 'alphabetic';
    var remaining = exp - Date.now();
    var secs = remaining / 1000;
    if (secs >= 0.15) {
      var label = secs.toFixed(1) + 's';
      if (label.charAt(0) !== '-') {
        var timerW = 56;
        var timerH = 20;
        var ty = nearTop ? (ey + 6 + (idx ? 0 : th + 4)) : (ey - timerH - 6 - idx * 22);
        if (nearBot) ty = ey - timerH - 6 - idx * 22;
        ty = Math.max(plotTop + 2, Math.min(plotBot - timerH - 2, ty));
        // Évite chevauchement avec le tag CALL/PUT à droite.
        var tx = x0 + 4;
        g.fillStyle = 'rgba(10,15,29,0.94)';
        g.strokeStyle = col;
        g.lineWidth = 1.4;
        roundRectOn(g, tx, ty, timerW, timerH, 8);
        g.fill();
        g.stroke();
        g.fillStyle = col;
        g.font = '800 12px "Hanken Grotesk", sans-serif';
        g.textAlign = 'center';
        g.fillText(label, tx + timerW / 2, ty + 14);
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
    var pulse = 0.55 + 0.45 * Math.sin(now / 150);
    ctx.save();
    ctx.beginPath();
    ctx.arc(map.lastX, map.lastY, 9 + pulse * 4, 0, Math.PI * 2);
    ctx.fillStyle = theme.beadGlow || 'rgba(255,215,0,0.16)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(map.lastX, map.lastY, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = theme.id === 'ivoryGold' ? theme.priceTxt : color;
    ctx.font = '800 10px "Hanken Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(price.toFixed(2), cssW - 56, map.lastY + 3);
  }

  function drawFrame(now) {
    if (!ctx) return;
    if (cssW < 8 || cssH < 8) resize();
    if (cssW < 8 || cssH < 8) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var asset = D6.CONFIG.ASSETS[activeAsset];
    var theme = plotTheme(asset);
    var market = D6.Engine.getMarket(activeAsset);
    var allTrades = collectOpenTradeVisuals();
    var primary = allTrades[0] || null;
    allTrades.forEach(function (ot) {
      if (!primary || (ot.expiryTime || ot.expiresAt) < (primary.expiryTime || primary.expiresAt)) primary = ot;
    });
    var narrow = (window.innerWidth || 0) <= 430;
    // Plus de panneau RSI/MACD : toute la hauteur va au plot.
    // Marges pixel pour laisser respirer prix, bougie et lignes d'entrée.
    var tradeFloor = (allTrades.length && narrow) ? 32 : (allTrades.length ? 22 : 0);
    var pad = { t: narrow ? 24 : 28, r: 62, b: 26 + tradeFloor, l: 10 };
    var w = cssW - pad.l - pad.r;
    var h = cssH - pad.t - pad.b;
    if (h < 48) h = 48;

    // Fond du PLOT uniquement (pas la page) — thème par actif.
    ctx.fillStyle = theme.bg1;
    ctx.fillRect(0, 0, cssW, cssH);
    var bg = ctx.createLinearGradient(0, 0, 0, cssH);
    bg.addColorStop(0, theme.bg0);
    bg.addColorStop(1, theme.bg1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);

    var candles = visibleCandles(market);
    var closes = closeSeries(market);
    var visN = candles.length;
    var startIdx = Math.max(0, closes.length - visN);
    var series = [];
    var i;
    if (asset.chart === 'candle') {
      for (i = 0; i < candles.length; i++) {
        series.push(candles[i].h, candles[i].l);
      }
    } else {
      for (i = startIdx; i < closes.length; i++) series.push(closes[i]);
    }
    var minPrice = series.length ? Math.min.apply(null, series) : market.price;
    var maxPrice = series.length ? Math.max.apply(null, series) : market.price;
    if (isFinite(market.price)) {
      minPrice = Math.min(minPrice, market.price);
      maxPrice = Math.max(maxPrice, market.price);
    }
    if (allTrades.length) {
      allTrades.forEach(function (ot) {
        var ep = Number(ot.entryPrice != null ? ot.entryPrice : ot.openPrice);
        if (isFinite(ep)) {
          minPrice = Math.min(minPrice, ep);
          maxPrice = Math.max(maxPrice, ep);
        }
      });
    }
    var span = Math.max(maxPrice - minPrice, asset.tickNoise * 6, 0.3);
    // Padding Y symétrique ≥ 18 % : prix live, mèches et entrée de trade restent visibles.
    var padY = Math.max(span * 0.18, asset.tickNoise * 3, 0.2);
    var yMin = minPrice - padY;
    var yMax = maxPrice + padY;

    if (allTrades.length) {
      var critMin = isFinite(market.price) ? market.price : minPrice;
      var critMax = critMin;
      allTrades.forEach(function (ot) {
        var ep2 = Number(ot.entryPrice != null ? ot.entryPrice : ot.openPrice);
        if (!isFinite(ep2)) return;
        critMin = Math.min(critMin, ep2);
        critMax = Math.max(critMax, ep2);
      });
      if (isFinite(market.price)) {
        critMin = Math.min(critMin, market.price);
        critMax = Math.max(critMax, market.price);
      }
      var viewSpan = Math.max(yMax - yMin, span, 0.3);
      var edge = Math.max(viewSpan * 0.18, padY);
      if (critMin < yMin + edge) yMin = critMin - edge;
      if (critMax > yMax - edge) yMax = critMax + edge;
      // Centre la fenêtre sur (entrée + prix live) sans perdre min/max données.
      var focusMid = (critMin + critMax) / 2;
      var curMid = (yMin + yMax) / 2;
      var shift = focusMid - curMid;
      yMin += shift;
      yMax += shift;
      yMin = Math.min(yMin, minPrice - padY, critMin - edge);
      yMax = Math.max(yMax, maxPrice + padY, critMax + edge);
      // Re-garantir ≥ 18 % autour des points critiques après recentrage.
      viewSpan = Math.max(yMax - yMin, 0.3);
      edge = Math.max(viewSpan * 0.18, padY);
      if (critMin < yMin + edge) yMin = critMin - edge;
      if (critMax > yMax - edge) yMax = critMax + edge;
      viewMin = yMin;
      viewMax = yMax;
    } else if (!viewMin || !viewMax) {
      viewMin = yMin;
      viewMax = yMax;
    } else {
      var nextMin = viewMin + (yMin - viewMin) * 0.28;
      var nextMax = viewMax + (yMax - viewMax) * 0.28;
      if (minPrice < viewMin || maxPrice > viewMax) {
        nextMin = Math.min(nextMin, yMin);
        nextMax = Math.max(nextMax, yMax);
      }
      viewMin = nextMin;
      viewMax = nextMax;
    }
    var minP = viewMin;
    var maxP = viewMax;

    drawGrid(pad, w, h, minP, maxP, theme);

    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = theme.watermark;
    ctx.font = '700 32px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OROLADO', cssW / 2, pad.t + h / 2);
    ctx.restore();

    var map = null;
    var lineData = closes.slice(startIdx);
    if (asset.chart === 'candle') {
      map = drawCandles(pad, w, h, candles, minP, maxP, { thin: !!asset.candleThin });
      if (asset.trendLine) drawTrendLine(pad, w, h, candles, minP, maxP);
    } else if (asset.lineStyle === 'step') {
      map = drawStepLine(pad, w, h, lineData, minP, maxP, asset.lineColor || '#2F6BFF', asset.lineAccent || '#FF7A00', asset.lineWidth || 3);
    } else if (asset.lineStyle === 'smooth' || asset.plotTheme === 'ivoryGold') {
      map = drawSmoothLine(pad, w, h, lineData, minP, maxP, asset.lineColor || '#FF7A00', asset.lineWidth || 3);
    } else {
      // STABLE CORE (et lignes legacy) : inchangé.
      map = drawLine(pad, w, h, lineData, minP, maxP);
    }

    if (map) {
      if (inds.bb) drawBollinger(map, closes, startIdx, theme);
      if (inds.ma) {
        ctx.save();
        ctx.shadowBlur = 0;
        if (!((window.innerWidth || 0) <= 859)) drawPoly(map, closes, 21, theme.maSlow, 1.5, startIdx);
        drawPoly(map, closes, 7, theme.maFast, 1.7, startIdx);
        ctx.restore();
      }
    }

    lastPad = pad;
    lastPlotH = h;
    lastMinP = minP;
    lastMaxP = maxP;
    lastMap = map;

    // Lignes de trade sur le canvas principal (PC + mobile) ; overlay vidé.
    allTrades.slice(0, 5).forEach(function (ot, i) {
      drawEntryOn(ctx, map, ot, now, pad, i, minP, maxP, h);
    });
    paintOverlay();

    var tagCol = asset.chart === 'candle'
      ? (market.price >= (market.candle.o) ? '#00E676' : '#FF1744')
      : (asset.lineColor || asset.accent || '#FFD700');
    if (primary) {
      var above = market.price >= primary.entryPrice;
      var liveWin = (primary.side === 'call' && above) || (primary.side === 'put' && !above);
      tagCol = liveWin ? '#00E676' : '#FF1744';
    }
    if (map) drawBead(map, market.price, tagCol, now, theme);
  }

  function loop(ts) {
    if (!running) return;
    requestAnimationFrame(loop);
    var mobile = (window.innerWidth || 0) <= 859;
    var liveN = D6.Engine.liveCount ? D6.Engine.liveCount() : 0;
    // Trade actif : dessin à chaque frame (desktop + mobile) pour la ligne de position.
    var drawEvery = liveN > 0 ? 16 : (mobile ? 48 : 16);
    var flushEvery = 120;
    if (document.hidden) {
      if (ts - lastFlush >= flushEvery) {
        D6.Engine.tick(activeAsset);
        flushDue();
        lastFlush = ts;
      }
      lastTs = ts;
      return;
    }
    if (ts - lastFlush >= flushEvery) {
      D6.Engine.tick(activeAsset);
      flushDue();
      lastFlush = ts;
    }
    if (ts - lastDraw < drawEvery) return;
    lastDraw = ts;
    if (!lastTs) lastTs = ts;
    lastTs = ts;
    payoutAcc += drawEvery;

    if (ts - lastFlush < flushEvery) D6.Engine.tick(activeAsset);

    if (payoutAcc > 2800) {
      D6.Engine.refreshPayout(activeAsset);
      payoutAcc = 0;
    }

    drawFrame(ts);
    if (onFrame) onFrame(ts);
  }

  function syncIndButtons() {
    document.querySelectorAll('.ind-btn[data-ind]').forEach(function (btn) {
      var key = btn.dataset.ind;
      btn.classList.toggle('on', !!inds[key]);
    });
  }

  var toolsBound = false;
  function bindTools() {
    if (toolsBound) return;
    toolsBound = true;
    var zin = document.getElementById('chartZoomIn');
    var zout = document.getElementById('chartZoomOut');
    if (zin) zin.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (zoomIdx > 0) {
        zoomIdx -= 1;
        viewMin = 0;
        viewMax = 0;
      }
    });
    if (zout) zout.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (zoomIdx < ZOOM_STEPS.length - 1) {
        zoomIdx += 1;
        viewMin = 0;
        viewMax = 0;
      }
    });
    document.querySelectorAll('.ind-btn[data-ind]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var key = btn.dataset.ind;
        if (key !== 'ma' && key !== 'bb') return;
        inds[key] = !inds[key];
        syncIndButtons();
      });
    });
    syncIndButtons();
  }

  D6.Chart = {
    attach: function (el, callback) {
      canvas = el;
      ctx = canvas.getContext('2d', { alpha: false });
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
      if (canvas) {
        canvas.style.backgroundColor = '#0B0E14';
        canvas.style.background = '#0B0E14';
      }
      if (overlay) {
        overlay.style.backgroundColor = 'transparent';
      }
      if (canvas && canvas.parentElement) {
        canvas.parentElement.style.backgroundColor = '#0B0E14';
      }
      resize();
      bindTools();
      window.addEventListener('resize', function () { requestAnimationFrame(resize); });
      window.addEventListener('orientationchange', function () {
        setTimeout(function () { resize(); }, 120);
      });
      if (window.visualViewport) {
        visualViewport.addEventListener('resize', function () { requestAnimationFrame(resize); });
      }
      if (window.ResizeObserver && canvas.parentElement) {
        var roWait = 0;
        var ro = new ResizeObserver(function () {
          if (roWait) return;
          roWait = requestAnimationFrame(function () {
            roWait = 0;
            resize();
          });
        });
        ro.observe(canvas.parentElement);
        var chartCard = document.getElementById('chart');
        if (chartCard) ro.observe(chartCard);
        var fsSlot = document.getElementById('fsTradeSlot');
        if (fsSlot) ro.observe(fsSlot);
      }
    },
    setAsset: function (id) {
      // Switch plot only : reset échelle + redessin immédiat (pas d'écran noir app).
      activeAsset = id;
      viewMin = 0;
      viewMax = 0;
      if (D6.Engine && D6.Engine.getTrades) {
        D6.Engine.getTrades().forEach(function (t) {
          var snap = snapshotTradeVisual(t);
          if (!snap) return;
          openTradeVisuals[snap.id] = snap;
          if (snap.assetId === activeAsset) forceIncludePrice(snap.entryPrice);
        });
      }
      if (isChartReady()) {
        drawNow();
        requestAnimationFrame(function () { drawNow(); });
      } else {
        flushOpenTradeVisualQueue();
      }
    },
    start: function () {
      if (running) return;
      running = true;
      lastTs = 0;
      requestAnimationFrame(function (ts) {
        flushOpenTradeVisualQueue();
        loop(ts);
      });
    },
    stop: function () {
      running = false;
    },
    resize: resize,
    applyOpenTradeVisual: applyOpenTradeVisual,
    removeTradeVisual: removeTradeVisual,
    drawNow: drawNow,
    flushOpenTradeVisuals: flushOpenTradeVisualQueue
  };
})(window.D6 = window.D6 || {});
