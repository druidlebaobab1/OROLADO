(function (D6) {
  'use strict';

  var canvas;
  var ctx;
  var cssW = 0;
  var cssH = 0;
  var dpr = 1;
  var lastTs = 0;
  var tickAcc = 0;
  var payoutAcc = 0;
  var running = false;
  var activeAsset = 'v100';
  var viewMin = 0;
  var viewMax = 0;
  var onFrame = null;

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

  function drawGrid(pad, w, h, minP, maxP) {
    var i;
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
      var ago = (4 - i) * 8;
      var label = ago === 0 ? 'now' : '-' + ago + 's';
      ctx.fillStyle = 'rgba(140,154,176,0.7)';
      ctx.font = '600 9px "Hanken Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, pad.t + h + 12);
    }
  }

  function drawCandles(pad, w, h, market, minP, maxP) {
    var candles = market.candles.slice(cssH < 200 ? -24 : -42).concat([market.candle]);
    if (candles.length < 2) return;
    var span = Math.max(maxP - minP, 0.01);
    var toX = function (i) { return pad.l + (i / (candles.length - 1)) * w; };
    var toY = function (p) { return pad.t + h * (1 - (p - minP) / span); };
    var cw = Math.max(2.5, (w / candles.length) * 0.62);
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
      ctx.shadowColor = up ? 'rgba(0,230,118,0.55)' : 'rgba(255,23,68,0.5)';
      ctx.shadowBlur = cssH < 200 ? 0 : 10;
      ctx.fillRect(x - cw / 2, y1, cw, bh);
      ctx.shadowBlur = 0;
    }
    return { toX: toX, toY: toY, lastX: toX(candles.length - 1), lastY: toY(market.price) };
  }

  function drawLine(pad, w, h, market, minP, maxP) {
    var data = market.history.slice(-180);
    if (data.length < 2) return;
    var span = Math.max(maxP - minP, 0.01);
    var toX = function (i) { return pad.l + (i / (data.length - 1)) * w; };
    var toY = function (p) { return pad.t + h * (1 - (p - minP) / span); };
    var lastX = toX(data.length - 1);
    var lastY = toY(market.price);
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

    ctx.beginPath();
    ctx.arc(lastX, lastY, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFE082';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,215,0,0.2)';
    ctx.fill();

    return { toX: toX, toY: toY, lastX: lastX, lastY: lastY };
  }

  function drawEntry(map, trade, now) {
    if (!trade || !map) return;
    var ey = map.toY(trade.entryPrice);
    var pulse = 0.55 + 0.45 * Math.sin(now / 140);
    ctx.save();
    ctx.strokeStyle = '#FFD700';
    ctx.shadowColor = 'rgba(255,215,0,' + (0.55 + pulse * 0.4) + ')';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(8, ey);
    ctx.lineTo(cssW - 8, ey);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#FFD700';
    ctx.font = '800 10px "Hanken Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ENTRÉE ' + trade.entryPrice.toFixed(2), 16, ey - 8);

    var t = Math.max(0, trade.timeLeft).toFixed(1) + 's';
    var bx = cssW / 2 - 38;
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
    ctx.fillText(t, bx + 38, by + 16);
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
    var pad = { t: 14, r: 62, b: 22, l: 8 };
    var w = cssW - pad.l - pad.r;
    var h = cssH - pad.t - pad.b;

    ctx.fillStyle = '#0A0F1D';
    ctx.fillRect(0, 0, cssW, cssH);
    var bg = ctx.createLinearGradient(0, 0, 0, cssH);
    bg.addColorStop(0, '#121A2B');
    bg.addColorStop(1, '#0A0F1D');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);

    var series;
    if (asset.chart === 'candle') {
      series = [];
      market.candles.slice(cssH < 200 ? -24 : -42).concat([market.candle]).forEach(function (c) {
        series.push(c.h, c.l);
      });
    } else {
      series = market.history.slice(-180);
    }
    var minP;
    var maxP;
    if (asset.chart === 'candle') {
      minP = Math.min.apply(null, series);
      maxP = Math.max.apply(null, series);
    } else {
      minP = Math.min.apply(null, series);
      maxP = Math.max.apply(null, series);
    }
    var range = Math.max(maxP - minP, asset.tickNoise * 8, 0.35);
    minP -= range * 0.18;
    maxP += range * 0.18;
    if (trade) {
      minP = Math.min(minP, trade.entryPrice);
      maxP = Math.max(maxP, trade.entryPrice);
      var mid = trade.entryPrice;
      var span = Math.max(maxP - minP, asset.tickNoise * 12, 0.5);
      minP = Math.min(minP, mid - span * 0.55);
      maxP = Math.max(maxP, mid + span * 0.55);
    }
    if (!viewMin || !viewMax) {
      viewMin = minP;
      viewMax = maxP;
    } else {
      viewMin += (minP - viewMin) * 0.14;
      viewMax += (maxP - viewMax) * 0.14;
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
      ? drawCandles(pad, w, h, market, minP, maxP)
      : drawLine(pad, w, h, market, minP, maxP);

    if (trade) drawEntry(map, trade, now);
    var tagCol = asset.chart === 'candle' ? (market.price >= (market.candle.o) ? '#00E676' : '#FF1744') : '#FFD700';
    if (trade) {
      var above = market.price >= trade.entryPrice;
      var liveWin = (trade.side === 'call' && above) || (trade.side === 'put' && !above);
      tagCol = liveWin ? '#00E676' : '#FF1744';
    }
    drawBead(map, market.price, tagCol, now);
  }

  function loop(ts) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (document.hidden) { lastTs = ts; return; }
    if (!lastTs) lastTs = ts;
    var dt = Math.min(50, ts - lastTs);
    lastTs = ts;
    tickAcc += dt;
    payoutAcc += dt;

    var asset = D6.CONFIG.ASSETS[activeAsset];
    while (tickAcc >= asset.tickMs) {
      D6.Engine.tick(activeAsset);
      tickAcc -= asset.tickMs;
    }
    if (payoutAcc > 2800) {
      D6.Engine.refreshPayout(activeAsset);
      payoutAcc = 0;
    }

    drawFrame(ts);
    if (onFrame) onFrame(ts);
  }

  D6.Chart = {
    attach: function (el, callback) {
      canvas = el;
      ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      onFrame = callback;
      resize();
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
      tickAcc = 0;
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
