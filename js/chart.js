(function (D6) {
  'use strict';

  var canvas;
  var ctx;
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
  var inds = { ma: true, rsi: false, bb: false };
  var tmpCloses = [];

  function zoomSec() {
    return ZOOM_STEPS[zoomIdx] || 60;
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
    var mobile = (window.innerWidth || 0) <= 859;
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 2 : 2.5);
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    var bw = Math.round(cssW * dpr);
    var bh = Math.round(cssH * dpr);
    if (canvas.width === bw && canvas.height === bh) return;
    canvas.width = bw;
    canvas.height = bh;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

  function drawGrid(pad, w, h, minP, maxP) {
    var i;
    var span = zoomSec();
    ctx.lineWidth = 1;
    for (i = 0; i <= 5; i++) {
      var y = pad.t + (h / 5) * i;
      ctx.strokeStyle = i === 5 ? 'rgba(255,215,0,0.16)' : 'rgba(255,215,0,0.06)';
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + w, y);
      ctx.stroke();
      var pVal = maxP - (i / 5) * (maxP - minP);
      ctx.fillStyle = 'rgba(168,180,204,0.78)';
      ctx.font = '600 10px "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(pVal.toFixed(2), pad.l + w + 6, y + 3);
    }
    for (i = 0; i <= 4; i++) {
      var x = pad.l + (w / 4) * i;
      ctx.strokeStyle = 'rgba(255,215,0,0.05)';
      ctx.beginPath();
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, pad.t + h);
      ctx.stroke();
      var ago = Math.round(((4 - i) / 4) * span);
      var label = ago === 0 ? 'now' : '-' + ago + 's';
      ctx.fillStyle = 'rgba(140,154,176,0.7)';
      ctx.font = '600 9px "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, pad.t + h + 12);
    }
  }

  function drawCandles(pad, w, h, candles, minP, maxP) {
    if (!candles || candles.length < 2) return null;
    var span = Math.max(maxP - minP, 0.01);
    var toX = function (i) { return pad.l + (i / (candles.length - 1)) * w; };
    var toY = function (p) { return pad.t + h * (1 - (p - minP) / span); };
    var cw = Math.max(2.2, (w / candles.length) * 0.62);
    var i;
    for (i = 0; i < candles.length; i++) {
      var c = candles[i];
      var up = c.c >= c.o;
      var col = up ? '#00E676' : '#FF1744';
      var x = toX(i);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.h));
      ctx.lineTo(x, toY(c.l));
      ctx.stroke();
      var y1 = toY(Math.max(c.o, c.c));
      var y2 = toY(Math.min(c.o, c.c));
      var bh = Math.max(1.5, y2 - y1);
      ctx.fillStyle = col;
      if (i === candles.length - 1 && cssH >= 200) {
        ctx.shadowColor = up ? 'rgba(0,230,118,0.45)' : 'rgba(255,23,68,0.4)';
        ctx.shadowBlur = 8;
      }
      ctx.fillRect(x - cw / 2, y1, cw, bh);
      ctx.shadowBlur = 0;
    }
    var last = candles[candles.length - 1];
    return { toX: toX, toY: toY, lastX: toX(candles.length - 1), lastY: toY(last.c), count: candles.length };
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

  function drawBollinger(map, closes, startIdx) {
    if (!map || closes.length < 21) return;
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
    ctx.fillStyle = 'rgba(255,215,0,0.07)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.28)';
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

  function drawRsiPanel(pad, w, h, rsiH, rsiVals, startIdx) {
    var top = pad.t + h + 16;
    var boxH = Math.max(22, rsiH - 4);
    ctx.fillStyle = 'rgba(8,12,22,0.72)';
    ctx.fillRect(pad.l, top, w, boxH);
    ctx.strokeStyle = 'rgba(255,215,0,0.12)';
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
    ctx.strokeStyle = last >= 70 ? '#FF1744' : last <= 30 ? '#00E676' : '#FFD54F';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(168,180,204,0.85)';
    ctx.font = '700 9px "Hanken Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('RSI ' + last.toFixed(0), pad.l + 4, top + 10);
  }

  function drawEntry(map, trade, now, badgeIndex, badgeCount) {
    if (!trade || !map || trade.settled) return;
    var remaining = (trade.expiryTime || trade.expiresAt) - Date.now();
    if (remaining < 80) return;
    var ey = map.toY(trade.entryPrice);
    var pulse = 0.55 + 0.45 * Math.sin(now / 140);
    var col = trade.side === 'call' ? '#00E676' : '#FF1744';
    ctx.save();
    ctx.strokeStyle = col;
    ctx.shadowColor = 'rgba(255,215,0,' + (0.35 + pulse * 0.25) + ')';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(8, ey);
    ctx.lineTo(cssW - 8, ey);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = col;
    ctx.font = '800 10px "Hanken Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((trade.side === 'call' ? 'CALL ' : 'PUT ') + trade.entryPrice.toFixed(2), 16, ey - 8);
    var secs = remaining / 1000;
    if (secs < 0.15) return;
    var label = secs.toFixed(1) + 's';
    if (label === '0.0s' || label.charAt(0) === '-') return;
    var offset = (badgeIndex - (badgeCount - 1) / 2) * 84;
    var bx = cssW / 2 - 38 + offset;
    var by = Math.max(10, ey - 36);
    ctx.fillStyle = 'rgba(10,15,29,0.92)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = 'rgba(255,215,0,0.55)';
    ctx.shadowBlur = 10;
    roundRect(bx, by, 76, 22, 11);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFD700';
    ctx.font = '800 12px "Hanken Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, bx + 38, by + 16);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBead(map, price, color, now) {
    if (!map) return;
    var pulse = 0.55 + 0.45 * Math.sin(now / 150);
    ctx.save();
    ctx.beginPath();
    ctx.arc(map.lastX, map.lastY, 9 + pulse * 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,215,0,0.16)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(map.lastX, map.lastY, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = color;
    ctx.font = '800 10px "Hanken Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(price.toFixed(2), cssW - 56, map.lastY + 3);
  }

  function drawFrame(now) {
    if (!ctx) return;
    var asset = D6.CONFIG.ASSETS[activeAsset];
    var market = D6.Engine.getMarket(activeAsset);
    var trade = D6.Engine.getTrade();
    var allTrades = (D6.Engine.getTrades ? D6.Engine.getTrades() : (trade ? [trade] : [])).filter(function (ot) {
      if (!ot || ot.settled || ot.assetId !== activeAsset) return false;
      var exp = ot.expiryTime || ot.expiresAt;
      return exp && Date.now() < exp;
    });
    var primary = allTrades[0] || null;
    allTrades.forEach(function (ot) {
      if (!primary || (ot.expiryTime || ot.expiresAt) < (primary.expiryTime || primary.expiresAt)) primary = ot;
    });
    var rsiH = inds.rsi ? 36 : 0;
    var pad = { t: 14, r: 62, b: 22 + rsiH, l: 8 };
    var w = cssW - pad.l - pad.r;
    var h = cssH - pad.t - pad.b;
    if (h < 40) h = Math.max(40, cssH - 36);

    ctx.fillStyle = '#0A0F1D';
    ctx.fillRect(0, 0, cssW, cssH);
    var bg = ctx.createLinearGradient(0, 0, 0, cssH);
    bg.addColorStop(0, '#121A2B');
    bg.addColorStop(1, '#0A0F1D');
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
    var minP = series.length ? Math.min.apply(null, series) : market.price;
    var maxP = series.length ? Math.max.apply(null, series) : market.price;
    var range = Math.max(maxP - minP, asset.tickNoise * 8, 0.35);
    minP -= range * 0.18;
    maxP += range * 0.18;
    if (allTrades.length) {
      allTrades.forEach(function (ot) {
        minP = Math.min(minP, ot.entryPrice);
        maxP = Math.max(maxP, ot.entryPrice);
      });
      var mid = (primary || trade).entryPrice;
      var span = Math.max(maxP - minP, asset.tickNoise * 12, 0.5);
      minP = Math.min(minP, mid - span * 0.55);
      maxP = Math.max(maxP, mid + span * 0.55);
    }
    if (!viewMin || !viewMax) {
      viewMin = minP;
      viewMax = maxP;
    } else {
      viewMin += (minP - viewMin) * 0.16;
      viewMax += (maxP - viewMax) * 0.16;
    }
    minP = viewMin;
    maxP = viewMax;

    drawGrid(pad, w, h, minP, maxP);

    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = '#FFD700';
    ctx.font = '800 36px Cinzel, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('OROLADO', cssW / 2, pad.t + h / 2);
    ctx.restore();

    var map = asset.chart === 'candle'
      ? drawCandles(pad, w, h, candles, minP, maxP)
      : drawLine(pad, w, h, closes.slice(startIdx), minP, maxP);

    if (map) {
      if (inds.bb) drawBollinger(map, closes, startIdx);
      if (inds.ma) {
        ctx.save();
        ctx.shadowBlur = 0;
        drawPoly(map, closes, 21, 'rgba(0,188,212,0.9)', 1.5, startIdx);
        drawPoly(map, closes, 7, 'rgba(255,213,79,0.95)', 1.7, startIdx);
        ctx.restore();
      }
    }

    allTrades.forEach(function (ot, idx) {
      drawEntry(map, ot, now, idx, allTrades.length);
    });
    var tagCol = asset.chart === 'candle' ? (market.price >= (market.candle.o) ? '#00E676' : '#FF1744') : '#FFD700';
    if (primary) {
      var above = market.price >= primary.entryPrice;
      var liveWin = (primary.side === 'call' && above) || (primary.side === 'put' && !above);
      tagCol = liveWin ? '#00E676' : '#FF1744';
    }
    drawBead(map, market.price, tagCol, now);

    if (inds.rsi) {
      var rsiVals = rsiSeries(closes, 14);
      drawRsiPanel(pad, w, h, rsiH, rsiVals, startIdx);
    }
  }

  function loop(ts) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (document.hidden) {
      D6.Engine.tick(activeAsset);
      flushDue();
      lastTs = ts;
      return;
    }
    if (!lastTs) lastTs = ts;
    lastTs = ts;
    payoutAcc += Math.min(50, 16);

    D6.Engine.tick(activeAsset);
    flushDue();
    if (payoutAcc > 2800) {
      D6.Engine.refreshPayout(activeAsset);
      payoutAcc = 0;
    }

    drawFrame(ts);
    if (onFrame) onFrame(ts);
  }

  function syncIndButtons() {
    document.querySelectorAll('.ind-btn').forEach(function (btn) {
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
    document.querySelectorAll('.ind-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var key = btn.dataset.ind;
        if (!key) return;
        inds[key] = !inds[key];
        syncIndButtons();
      });
    });
    syncIndButtons();
  }

  D6.Chart = {
    attach: function (el, callback) {
      canvas = el;
      ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      onFrame = callback;
      resize();
      bindTools();
      window.addEventListener('resize', function () { requestAnimationFrame(resize); });
      if (window.visualViewport) {
        visualViewport.addEventListener('resize', function () { requestAnimationFrame(resize); });
      }
      if (window.ResizeObserver && canvas.parentElement) {
        var roWait = 0;
        new ResizeObserver(function () {
          if (roWait) return;
          roWait = requestAnimationFrame(function () {
            roWait = 0;
            resize();
          });
        }).observe(canvas.parentElement);
      }
    },
    setAsset: function (id) {
      activeAsset = id;
      viewMin = 0;
      viewMax = 0;
    },
    start: function () {
      if (running) return;
      running = true;
      lastTs = 0;
      requestAnimationFrame(loop);
    },
    stop: function () {
      running = false;
    },
    resize: resize
  };
})(window.D6 = window.D6 || {});
