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
  var ZOOM_STEPS = [30, 45, 60, 90, 120, 180];
  var zoomIdx = 2;
  var inds = { ma: false, bb: false };
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
  var BUFFER_N = 60;
  window.assetsState = window.assetsState || {};
  window.assetBuffers = window.assetBuffers || {};

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
        lastPrice: 0,
        at: 0
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
    var st = ensureAssetState(activeAsset);
    if (st.lockMin && st.lockMax) return;
    if (!isFinite(price)) return;
    if (!viewMin || !viewMax) {
      viewMin = price - 1;
      viewMax = price + 1;
      return;
    }
    var span = Math.max(viewMax - viewMin, 0.3);
    var pad = Math.max(span * 0.15, 0.15);
    if (price < viewMin + pad) viewMin = price - pad;
    if (price > viewMax - pad) viewMax = price + pad;
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
    cssW = w;
    cssH = h;
    var bw = Math.round(cssW * dpr);
    var bh = Math.round(cssH * dpr);
    var sizeChanged = canvas.width !== bw || canvas.height !== bh;
    canvas.width = bw;
    canvas.height = bh;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    if (!market || !steer || steer.assetId !== activeAsset) return;
    var p = steeredPrice(market.price);
    if (!isFinite(p)) return;
    market.price = p;
    if (market.candle) {
      market.candle.c = p;
      if (p > market.candle.h) market.candle.h = p;
      if (p < market.candle.l) market.candle.l = p;
    }
    lastDrawnClose = p;
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
    var n = Math.min(zoomSec(), BUFFER_N);
    var live = window.assetBuffers && window.assetBuffers[activeAsset];
    var done = (live && live.candles && live.candles.length)
      ? live.candles
      : ((market && market.candles) || []);
    var list = done.slice(Math.max(0, done.length - n));
    var forming = (live && live.forming) || (market && market.candle);
    if (forming) {
      if (!list.length || list[list.length - 1].t !== forming.t) {
        list = list.concat([forming]);
      } else {
        list[list.length - 1] = forming;
      }
    }
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
      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px "Plus Jakarta Sans", "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(formatAxisPrice(pVal), pad.l + w + 4, y + 3);
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
      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px "Plus Jakarta Sans", "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, pad.t + h + 12);
    }
  }

  function drawCandles(pad, w, h, candles, minP, maxP, opts) {
    if (!candles || candles.length < 2) return null;
    opts = opts || {};
    var thin = !!opts.thin;
    var span = Math.max(maxP - minP, 0.01);
    var toX = function (i) { return pad.l + (i / (candles.length - 1)) * w; };
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var cw = Math.max(thin ? 1.4 : 2.2, (w / candles.length) * (thin ? 0.42 : 0.62));
    var i;
    for (i = 0; i < candles.length; i++) {
      var c = candles[i];
      var up = c.c >= c.o;
      var col = up ? '#00e676' : '#ff3b30';
      if (opts.capWicks) {
        var body = Math.abs(c.c - c.o);
        var ref = Math.max(Math.abs(c.c), 1);
        if (body < ref * 0.00012) body = ref * 0.00012;
        var maxW = body * 1.5;
        var hiB = Math.max(c.o, c.c);
        var loB = Math.min(c.o, c.c);
        if (c.h > hiB + maxW) c = { o: c.o, h: hiB + maxW, l: c.l, c: c.c, t: c.t };
        if (c.l < loB - maxW) c = { o: c.o, h: c.h, l: loB - maxW, c: c.c, t: c.t };
      }
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

  function drawLine(pad, w, h, data, minP, maxP, color) {
    if (!data || data.length < 2) return null;
    var col = color || '#f5a623';
    var toX = function (i) { return pad.l + (i / (data.length - 1)) * w; };
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
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
    ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(245,166,35,0.85)';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY, count: data.length };
  }

  function drawSmoothLine(pad, w, h, data, minP, maxP, color, width, halo) {
    if (!data || data.length < 2) return null;
    var toX = function (i) { return pad.l + (i / (data.length - 1)) * w; };
    var toY = function (p) { return plotToY(p, pad, h, minP, maxP); };
    var lastX = toX(data.length - 1);
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
    var toX = function (i) { return pad.l + (i / (data.length - 1)) * w; };
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

  function drawEntryOn(g, map, trade, now, pad, tagIndex, minP, maxP, plotH, yShift) {
    if (!g || !trade || trade.settled) return;
    var exp = trade.expiryTime || trade.expiresAt;
    if (!exp || Date.now() >= exp) return;
    var entry = Number(trade.entryPrice != null ? trade.entryPrice : trade.openPrice);
    if (!isFinite(entry)) return;
    var ey = priceToY(entry, pad, plotH, minP, maxP);
    if (!isFinite(ey)) return;
    var plotTop = pad ? pad.t : 4;
    var plotBot = pad ? (pad.t + plotH) : (cssH - 4);
    var x0 = 2;
    var x1 = Math.max(x0 + 40, cssW - 2);
    if (!isFinite(ey)) return;
    var isCall = trade.side === 'call';
    var col = isCall ? '#22C55E' : '#EF4444';
    var idx = tagIndex || 0;
    var badgeLift = isFinite(yShift) ? yShift : 0;
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
    if (nearTop) by = ey + 6 + idx * 22 + badgeLift;
    else if (nearBot) by = ey - th - 6 - idx * 22 - badgeLift;
    else by = ey - th - 4 - idx * 22 - badgeLift;
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
        var ty = nearTop ? (ey + 6 + (idx ? 0 : th + 4) + badgeLift) : (ey - timerH - 6 - idx * 22 - badgeLift);
        if (nearBot) ty = ey - timerH - 6 - idx * 22 - badgeLift;
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
    ctx.fillText(formatAxisPrice(price), cssW - 48, map.lastY + 3);
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
    var pad = { t: fsOn ? (narrow ? 18 : 22) : (narrow ? 16 : 20), r: 45, b: 28, l: 8 };
    var w = cssW - pad.l - pad.r;
    var h = cssH - pad.t - pad.b;
    if (h < 48) h = 48;

    // Fond profond unique — zéro beige / blanc.
    ctx.fillStyle = '#0B0E14';
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
    var damp = dampedRange(candles, asset.id, minPrice, maxPrice);
    minPrice = damp.min;
    maxPrice = damp.max;
    if (allTrades.length) {
      allTrades.forEach(function (ot) {
        var ep = Number(ot.entryPrice != null ? ot.entryPrice : ot.openPrice);
        if (isFinite(ep)) {
          minPrice = Math.min(minPrice, ep);
          maxPrice = Math.max(maxPrice, ep);
        }
      });
    }
    var currentPrice = isFinite(market.price) ? market.price : ((minPrice + maxPrice) / 2);
    var spanRaw = maxPrice - minPrice;
    if (!(spanRaw > 0) || spanRaw < currentPrice * 0.002) {
      minPrice = currentPrice * 0.998;
      maxPrice = currentPrice * 1.002;
      spanRaw = maxPrice - minPrice;
    }
    var padY = spanRaw * 0.12;
    var yMin = minPrice - padY;
    var yMax = maxPrice + padY;
    var st = ensureAssetState(activeAsset);

    if (allTrades.length) {
      if (!st.lockMin || !st.lockMax || st.lockMax <= st.lockMin) {
        st.lockMin = yMin;
        st.lockMax = yMax;
      } else {
        if (yMin < st.lockMin) st.lockMin = yMin;
        if (yMax > st.lockMax) st.lockMax = yMax;
      }
      viewMin = st.lockMin;
      viewMax = st.lockMax;
      strikeLock = { assetId: activeAsset, min: viewMin, max: viewMax, entry: null, ey: null };
    } else {
      st.lockMin = 0;
      st.lockMax = 0;
      strikeLock = null;
      if (st.viewMin && st.viewMax && (st.viewMax - st.viewMin) > currentPrice * 0.001) {
        viewMin = st.viewMin * 0.82 + yMin * 0.18;
        viewMax = st.viewMax * 0.82 + yMax * 0.18;
      } else {
        viewMin = yMin;
        viewMax = yMax;
      }
    }
    if (viewMax - viewMin < currentPrice * 0.002) {
      viewMin = currentPrice * 0.998;
      viewMax = currentPrice * 1.002;
    }
    st.viewMin = viewMin;
    st.viewMax = viewMax;

    if (candles && candles.length && isFinite(candles[candles.length - 1].c)) {
      lastDrawnClose = Number(candles[candles.length - 1].c);
    } else if (isFinite(market.price)) {
      lastDrawnClose = Number(market.price);
    }

    var minP = viewMin;
    var maxP = viewMax;

    drawGrid(pad, w, h, minP, maxP, theme);

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
    ctx.rect(pad.l - 1, pad.t + 1, w + 2, Math.max(2, h - 2));
    ctx.clip();
    if (asset.chart === 'candle') {
      map = drawCandles(pad, w, h, candles, minP, maxP, {
        thin: !!asset.candleThin,
        capWicks: asset.id === 'v100' || asset.id === 'boomspike' || asset.id === 'crash300' || asset.id === 'v75' || asset.id === 'nexusprime'
      });
      if (asset.trendLine) drawTrendLine(pad, w, h, candles, minP, maxP);
    } else if (asset.lineStyle === 'step') {
      map = drawStepLine(pad, w, h, lineData, minP, maxP, asset.lineColor || '#2F6BFF', asset.lineAccent || '#FF7A00', asset.lineWidth || 3);
    } else if (asset.lineStyle === 'smooth' || asset.plotTheme === 'ivoryGold') {
      map = drawSmoothLine(pad, w, h, lineData, minP, maxP, asset.lineColor || '#00d2ff', asset.lineWidth || 2.5, asset.lineHalo || (asset.id === 'horizon50' ? 'rgba(0,210,255,0.55)' : null));
    } else {
      map = drawLine(pad, w, h, lineData, minP, maxP, asset.lineColor || '#f5a623');
    }
    if (!map) {
      map = {
        toY: function (p) { return plotToY(p, pad, h, minP, maxP); },
        lastX: pad.l + w,
        lastY: plotToY(market.price, pad, h, minP, maxP)
      };
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
    ctx.restore();

    lastPad = pad;
    lastPlotH = h;
    lastMinP = minP;
    lastMaxP = maxP;
    lastMap = map;

    // Lignes de trade sur le canvas principal (PC + mobile) ; overlay vidé.
    var tradeYs = [];
    allTrades.slice(0, 5).forEach(function (ot, i) {
      var epY = Number(ot.entryPrice != null ? ot.entryPrice : ot.openPrice);
      var y0 = priceToY(epY, pad, h, minP, maxP);
      var shift = 0;
      var j;
      for (j = 0; j < i; j++) {
        if (Math.abs(y0 - tradeYs[j]) < 10) shift = 22;
      }
      tradeYs.push(y0);
      drawEntryOn(ctx, map, ot, now, pad, i, minP, maxP, h, shift);
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
    st.lastPrice = lastDrawnClose;
    st.candles = (candles || []).slice(-BUFFER_N);
    st.min = minP;
    st.max = maxP;
    st.at = Date.now();
    } catch (eFrame) { /* keep candles alive */ }
  }

  function ensureChartPulse() {
    if (chartTickTimer) return;
    chartTickTimer = setInterval(function () {
      try {
        if (!running) return;
        if (D6.Engine && D6.Engine.tick) D6.Engine.tick(activeAsset);
        drawNow();
        if (running && !loopRaf) {
          loopRaf = requestAnimationFrame(loop);
        }
      } catch (ePulse) { /* ignore */ }
    }, 180);
  }

  function loop(ts) {
    if (!running) return;
    loopRaf = requestAnimationFrame(loop);
    try {
      var mobile = (window.innerWidth || 0) <= 859;
      var liveN = (D6.Engine && D6.Engine.liveCount) ? D6.Engine.liveCount() : 0;
      var drawEvery = liveN > 0 ? 16 : (mobile ? 48 : 16);
      var flushEvery = 120;
      if (document.hidden) {
        if (ts - lastFlush >= flushEvery) {
          if (D6.Engine && D6.Engine.tick) D6.Engine.tick(activeAsset);
          flushDue();
          lastFlush = ts;
        }
        lastTs = ts;
        return;
      }
      if (ts - lastFlush >= flushEvery) {
        if (D6.Engine && D6.Engine.tick) D6.Engine.tick(activeAsset);
        flushDue();
        lastFlush = ts;
      }
      if (ts - lastDraw < drawEvery) return;
      lastDraw = ts;
      if (!lastTs) lastTs = ts;
      lastTs = ts;
      payoutAcc += drawEvery;

      if (ts - lastFlush < flushEvery && D6.Engine && D6.Engine.tick) D6.Engine.tick(activeAsset);

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
        try { resize(); drawNow(); } catch (eR) { try { console.warn('Mobile display fallback:', eR); } catch (e2) { /* ignore */ } }
        running = true;
        lastTs = 0;
        if (loopRaf) {
          try { cancelAnimationFrame(loopRaf); } catch (eLf) { /* ignore */ }
          loopRaf = 0;
        }
        loopRaf = requestAnimationFrame(loop);
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
      activeAsset = id;
      if (steer && steer.assetId !== id) steer = null;
      var liveBuf = window.assetBuffers && window.assetBuffers[id];
      var st = ensureAssetState(id);
      if (liveBuf && isFinite(liveBuf.price) && liveBuf.price > 0) {
        lastDrawnClose = liveBuf.price;
        st.lastPrice = liveBuf.price;
      }
      if (st.viewMin && st.viewMax) {
        viewMin = st.viewMin;
        viewMax = st.viewMax;
      } else if (st.min && st.max) {
        viewMin = st.min;
        viewMax = st.max;
      }
      if (st.lockMin && st.lockMax) {
        strikeLock = { assetId: id, min: st.lockMin, max: st.lockMax, entry: null, ey: null };
        viewMin = st.lockMin;
        viewMax = st.lockMax;
      } else {
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
