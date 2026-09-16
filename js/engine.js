(function (D6) {
  'use strict';

  var C = D6.CONFIG;
  var markets = {};
  var trades = [];
  var payoutLive = {};
  var lastOrderAt = 0;
  var sessionNonce = D6.uid();
  var orderSeq = 0;
      // Max simultané très élevé : pas de blocage à 2 trades.
  var MAX_OPEN = (C.MAX_OPEN != null ? C.MAX_OPEN : 10);
  var CANDLE_MS = 1000;
  var HISTORY_SEC = 720;
  var HISTORY_N = 800;
  var SEED_N = 720;
  var synthCache = {};
  var tradeTimers = {};
  var pendingBusyUntil = {};
  var clickQuietUntil = {};

  function u32(n) {
    n = Math.imul(n ^ (n >>> 16), 2246822507);
    n = Math.imul(n ^ (n >>> 13), 3266489909);
    return (n ^ (n >>> 16)) >>> 0;
  }

  function uhash01(i, salt) {
    return u32(Math.imul(i | 0, 374761393) ^ Math.imul(salt | 0, 668265263)) / 4294967296;
  }

  function valueNoise(t, salt) {
    var i = Math.floor(t);
    var f = t - i;
    var u = f * f * (3 - 2 * f);
    return uhash01(i, salt) * (1 - u) + uhash01(i + 1, salt) * u;
  }

  function canonAssetId(id) {
    if (id === 'boom300' || id === 'pulseai') return C.ASSETS.titanpulse ? 'titanpulse' : 'v100';
    return C.ASSETS[id] ? id : 'v100';
  }

  // Profils indépendants : seed + vol + dérive + spikes (pas le même tableau + offset).
  function feedProfile(assetId) {
    switch (assetId) {
      case 'stable':
        return { salt: 221713, vol: 0.09, drift: 0, f1: 0.011, f2: 0.023, f3: 0.005, a1: 3.2, a2: 1.8, a3: 4.2, spike: null, stair: null };
      case 'v75':
        return { salt: 551903, vol: 0.92, drift: 0, f1: 0.088, f2: 0.17, f3: 0.041, a1: 16, a2: 11, a3: 24, spike: null, stair: null };
      case 'crash300':
        return { salt: 771001, vol: 0.35, drift: 0, f1: 0.01, f2: 0.022, f3: 0.005, a1: 2.2, a2: 1.4, a3: 3, spike: null, stair: null, crashBoom: 'crash' };
      case 'boomspike':
        return { salt: 882119, vol: 0.35, drift: 0, f1: 0.01, f2: 0.022, f3: 0.005, a1: 2.2, a2: 1.4, a3: 3, spike: null, stair: null, crashBoom: 'boom' };
      case 'apex500':
        return { salt: 440501, vol: 1, drift: 0, kind: 'apex' };
      case 'horizon50':
        return { salt: 550050, vol: 1, drift: 0, kind: 'horizon' };
      case 'goldtrend':
        return { salt: 660160, vol: 1, drift: 0, kind: 'gold' };
      case 'nexusprime':
        return { salt: 770870, vol: 1, drift: 0, kind: 'nexus' };
      case 'titanpulse':
        return { salt: 991177, vol: 1, drift: 0, kind: 'titan' };
      case 'v100':
      default:
        return { salt: 904177, vol: 1.05, drift: 0, f1: 0.041, f2: 0.093, f3: 0.017, a1: 18, a2: 11, a3: 32, spike: null, stair: null };
    }
  }

  var TICK_PCT = 0.0022;
  var JUMP_PCT = 0.004;

  function clampIndexPrice(p, asset) {
    var n = Number(p);
    var base = Number(asset && asset.basePrice) || 5000;
    if (!isFinite(n) || n <= 0) n = base;
    var id = asset && asset.id;
    var loMul = 0.88;
    var hiMul = 1.12;
    if (id === 'boomspike' || id === 'crash300' || id === 'titanpulse') {
      loMul = 0.78;
      hiMul = 1.22;
    }
    return Math.round(Math.max(base * loMul, Math.min(base * hiMul, n)) * 100) / 100;
  }

  function isPlausiblePrice(p, ref) {
    var n = Number(p);
    if (!isFinite(n) || n <= 0 || n > 1e7) return false;
    var r = Number(ref);
    if (!(r > 0)) return true;
    if (n > r * 1.12 || n < r * 0.88) return false;
    return true;
  }

  function tickCapPct(asset, spiked) {
    var id = asset && asset.id;
    if (spiked && (id === 'boomspike' || id === 'crash300')) return 0.004;
    if (id === 'stable') return 0.0008;
    if (id === 'titanpulse') return 0.0024;
    if (id === 'goldtrend' || id === 'nexusprime' || id === 'v75') return 0.0025;
    return 0.002;
  }

  function tradeBusyFor(assetId) {
    var now = Date.now();
    if (pendingBusyUntil[assetId] && pendingBusyUntil[assetId] > now) return true;
    var st = window.assetsState && window.assetsState[assetId];
    if (st && st.lockUntil > now) return true;
    var i;
    for (i = 0; i < trades.length; i++) {
      var tr = trades[i];
      if (!tr || tr.assetId !== assetId) continue;
      var exp = tr.expiryTime || tr.expiresAt || 0;
      if (tr.settled) {
        if (exp && now < exp + 1000) return true;
        continue;
      }
      if (!exp || now < exp + 1000) return true;
    }
    return false;
  }

  function tradeBoxFor(assetId, price) {
    var st = window.assetsState && window.assetsState[assetId];
    var lo;
    var hi;
    if (st && st.lockMax > st.lockMin) {
      lo = st.lockMin;
      hi = st.lockMax;
    } else {
      var p = Number(price);
      if (!(p > 0)) p = 10000;
      lo = p * 0.994;
      hi = p * 1.006;
    }
    var span = hi - lo;
    var pad = span * 0.08;
    return { lo: lo + pad, hi: hi - pad, span: span, frameLo: lo, frameHi: hi };
  }

  function clampToTradeBox(price, box) {
    if (!box) return price;
    if (price > box.hi) return box.hi;
    if (price < box.lo) return box.lo;
    return price;
  }

  function engineCaptureFrame(assetId, untilMs) {
    window.assetsState = window.assetsState || {};
    if (!window.assetsState[assetId]) {
      window.assetsState[assetId] = { viewMin: 0, viewMax: 0, lockMin: 0, lockMax: 0, lockUntil: 0 };
    }
    if (D6.Chart && typeof D6.Chart.captureTradeFrame === 'function') {
      D6.Chart.captureTradeFrame(assetId, untilMs);
      return;
    }
    var st = window.assetsState[assetId];
    if (st.lockMax > st.lockMin && st.lockUntil > Date.now()) {
      st.lockUntil = Math.max(st.lockUntil || 0, untilMs);
      return;
    }
    if (st.viewMax > st.viewMin) {
      st.lockMin = st.viewMin;
      st.lockMax = st.viewMax;
    }
    st.lockUntil = untilMs;
  }

  function sanitizeOhlc(asset, candle, refPrice, wickSpan) {
    if (!candle) return candle;
    var ref = Number(refPrice);
    if (!(ref > 0)) ref = Number(candle.c) || Number(asset && asset.basePrice) || 5000;
    var o = clampIndexPrice(candle.o, asset);
    var c = clampIndexPrice(candle.c, asset);
    var h = clampIndexPrice(candle.h, asset);
    var l = clampIndexPrice(candle.l, asset);
    if (!isPlausiblePrice(o, ref)) o = ref;
    if (!isPlausiblePrice(c, ref)) c = ref;
    o = capPctMove(ref, o, 0.03);
    c = capPctMove(ref, c, 0.03);
    h = Math.max(o, c, isPlausiblePrice(h, ref) ? h : c);
    l = Math.min(o, c, isPlausiblePrice(l, ref) ? l : c);
    if (wickSpan > 0) {
      var cap7 = wickSpan * 0.07;
      if ((h - l) > cap7) {
        var mid7 = (h + l) / 2;
        h = mid7 + cap7 / 2;
        l = mid7 - cap7 / 2;
      }
    }
    candle.o = o;
    candle.c = c;
    candle.h = h;
    candle.l = l;
    return candle;
  }

  window.assetBuffers = window.assetBuffers || {};
  window.ASSET_BUFFERS = window.assetBuffers;
  window.assetsHistory = window.assetsHistory || {};

  var SIM = {
    v100: { mode: 'candles', vol: 0.0035, thin: false },
    stable: { mode: 'line', vol: 0.0048, color: '#ff3366', coreWave: true, pullK: 0.05 },
    apex500: { mode: 'candles', vol: 0.0045, run: true },
    horizon50: { mode: 'line', vol: 0.0055, color: '#00d2ff' },
    boomspike: { mode: 'candles', vol: 0.0045, run: true },
    crash300: { mode: 'candles', vol: 0.0020, spike: -1 },
    v75: { mode: 'candles', vol: 0.0048, v75Wave: true, tickMs: 190 },
    nexusprime: { mode: 'candles', vol: 0.0058, nexusPulse: true, tickMs: 90 },
    goldtrend: { mode: 'line', vol: 0.0125, color: '#ffb300', goldHot: true, tickMs: 70, pullK: 0.028 },
    titanpulse: { mode: 'line', vol: 0.0098, color: '#e0e6ed', titanDrop: true, titanHF: true, tickMs: 55 },
  };
  var SIM_VER = 15;
  var TITAN_VER = 8;
  var BOOM_VER = 3;
  var MIN_SEED = 500;
  var SCALE_VER = 3;

  function simOf(id) {
    return SIM[id] || SIM.v100;
  }

  function candleMsFor(asset) {
    return CANDLE_MS;
  }

  function capPctMove(prev, next, maxPct) {
    if (!isFinite(next)) return prev;
    if (!(prev > 0)) return isFinite(next) && next > 0 ? next : prev;
    var lo = prev * (1 - maxPct);
    var hi = prev * (1 + maxPct);
    if (next < lo) return lo;
    if (next > hi) return hi;
    return next;
  }

  function stepBoomBurst(asset, buf, price, tMs) {
    var from = price;
    var marked = false;
    if (!buf.boomPhase) {
      buf.boomPhase = 'acc';
      buf.boomPhaseUntil = tMs + 3000 + Math.random() * 3000;
      buf.boomMid = price;
      buf.boomLeft = 0;
      buf.boomZig = 1;
    }
    if (buf.boomPhase === 'acc') {
      var mid = buf.boomMid || price;
      var n = (Math.random() - 0.5) * mid * 0.0017;
      var w = Math.sin(tMs / 55) * mid * 0.00055;
      price = clampIndexPrice(mid + n + w, asset);
      buf.boomMid = mid * 1.00005;
      if (tMs >= (buf.boomPhaseUntil || 0)) {
        buf.boomPhase = 'burst';
        buf.boomLeft = 2 + (Math.random() > 0.5 ? 1 : 0);
        buf.boomZig = 1;
      }
    } else if (buf.boomPhase === 'burst') {
      if (buf.boomZig === 1 && buf.boomLeft > 0) {
        price = clampIndexPrice(from * (1 + 0.018 + Math.random() * 0.016), asset);
        buf.boomPeak = price;
        buf.boomZig = -1;
        buf.boomLeft -= 1;
        marked = true;
      } else if (buf.boomZig === -1 && buf.boomLeft > 0) {
        price = clampIndexPrice(from * (1 - 0.005 - Math.random() * 0.007), asset);
        buf.boomZig = 1;
        marked = true;
      } else {
        buf.boomPhase = 'relax';
        buf.boomPhaseUntil = tMs + 2800 + Math.random() * 2200;
      }
    }
    if (buf.boomPhase === 'relax') {
      var peak = buf.boomPeak || price;
      var floor = peak * 0.91;
      var pull = (floor - price) * 0.07;
      var spanB = Math.max(peak - floor, price * 0.008);
      var bounce = (Math.random() - 0.48) * spanB * (0.20 + Math.random() * 0.10);
      var jit = (Math.random() - 0.5) * price * 0.0045;
      price = clampIndexPrice(price + pull + bounce + jit, asset);
      if (tMs >= (buf.boomPhaseUntil || 0)) {
        buf.boomPhase = 'acc';
        buf.boomPhaseUntil = tMs + 3000 + Math.random() * 3000;
        buf.boomMid = price;
      }
    }
    return { price: capPctMove(from, price, JUMP_PCT), boom: marked, from: from };
  }

  function unifiedStep(asset, price, nowMs, dtSec, opts) {
    opts = opts || {};
    var prevPrice = price;
    var busyIn = !!(opts.busy || (asset && tradeBusyFor(asset.id)));
    opts.spike = false;
    var sim = simOf(asset.id);
    var base = Number(asset.basePrice) || price;
    var vol = sim.vol;
    var bias = busyIn ? 0.5 : 0.49;
    if (!busyIn && sim.spike === 1) bias = 0.58;
    if (!busyIn && sim.spike === -1) bias = 0.40;
    if (sim.pulse) {
      var phP = ((nowMs / 1000) % 16) / 16;
      vol *= phP < 0.78 ? 0.42 : 1.9;
    }
    var roll = opts.det != null ? uhash01(opts.det, 904177) : Math.random();
    var nextOut;
    if (opts.hunt > 0 && !busyIn) {
      var gapH = opts.hunt - price;
      var nH = (roll - 0.5) * price * 0.0036;
      var wH = Math.sin(nowMs / 110) * price * 0.0017 + Math.sin(nowMs / 47) * price * 0.0009;
      var teaseH = Math.sin(nowMs / 310) * (Math.abs(gapH) + price * 0.0016) * 0.58;
      nextOut = price + gapH * 0.055 + nH + wH + teaseH;
    } else if (sim.titanDrop && !opts.spike) {
      var dtT = Math.max(dtSec, 0.016);
      var nT = (roll - 0.5) * price * vol * 1.35;
      var pT = Math.sin(nowMs / 220 * Math.PI) * price * 0.0034;
      var qT = Math.sin(nowMs / 95 * Math.PI) * price * 0.0016;
      var rT = Math.sin(nowMs / 410 * Math.PI) * price * 0.0022;
      var sT = Math.sin(nowMs / 58 * Math.PI) * price * 0.00085;
      var pullT = busyIn ? 0 : (base - price) * 0.018;
      nextOut = price + nT + pT + qT + rT + sT + pullT;
      if (!busyIn) {
        if (roll > 0.91) nextOut = capPctMove(price, price * (1 - 0.010 - (roll - 0.91) * 0.22), JUMP_PCT);
        else if (roll < 0.08) nextOut = capPctMove(price, price * (1 + 0.007 + (0.08 - roll) * 0.16), JUMP_PCT);
        else if (roll > 0.78 && roll < 0.84) nextOut = capPctMove(price, price * (1 + 0.0045), JUMP_PCT);
      }
    } else if (sim.coreWave && !opts.spike) {
      var zigC = (roll - 0.5) * price * vol * 1.35;
      var waveC = Math.sin(nowMs / 190) * price * 0.00072;
      var zig2C = Math.sin(nowMs / 73) * price * 0.00038;
      var pullC = busyIn ? 0 : (base - price) * (sim.pullK != null ? sim.pullK : 0.05);
      nextOut = price + zigC + waveC + zig2C + pullC;
    } else if (sim.goldHot && !opts.spike) {
      var nG = (roll - 0.5) * price * vol;
      var p1G = Math.sin(nowMs / 1000 * Math.PI * 14) * price * 0.00115;
      var p2G = Math.sin(nowMs / 1000 * Math.PI * 29.5) * price * 0.00055;
      var microG = ((roll - 0.5) * 2) * price * 0.0022;
      if (!busyIn && roll > 0.72) microG += ((roll - 0.72) / 0.28 - 0.5) * price * 0.0065;
      var pullG = busyIn ? 0 : (base - price) * (sim.pullK != null ? sim.pullK : 0.028);
      nextOut = price + nG + p1G + p2G + microG + pullG;
    } else if (sim.nexusPulse && !opts.spike) {
      var nN = (roll - 0.5) * price * vol;
      var pN = Math.sin(nowMs / 1000 * Math.PI * 8.5) * price * 0.00038;
      var qN = Math.sin(nowMs / 1000 * Math.PI * 19) * price * 0.00016;
      var pullN = busyIn ? 0 : (base - price) * 0.045;
      nextOut = price + nN + pN + qN + pullN;
    } else if (sim.v75Wave && !opts.spike) {
      var nV = (roll - 0.5) * price * vol;
      var pV = Math.sin(nowMs / 1000 * Math.PI * 5.6) * price * 0.00062;
      var qV = Math.sin(nowMs / 1000 * Math.PI * 13.2) * price * 0.00028;
      var rV = Math.sin(nowMs / 1000 * Math.PI * 2.1) * price * 0.00018;
      var pullV = busyIn ? 0 : (base - price) * 0.038;
      nextOut = price + nV + pV + qV + rV + pullV;
    } else {
      var center = bias;
      var delta = (roll - center) * price * vol;
      if (sim.sine) delta += Math.sin(nowMs / 1000 * Math.PI / 20) * price * 0.00085;
      if (sim.stair && !busyIn) {
        var stS = (nowMs / 1000) % 9;
        if (stS < 5.5) delta += Math.abs(price) * 0.00045 * Math.max(dtSec, 0.05);
        else delta *= 0.12;
      }
      nextOut = price + delta + (busyIn ? 0 : (base - price) * 0.04);
    }
    var stepCap = tickCapPct(asset, !!opts.spike);
    nextOut = capPctMove(prevPrice, nextOut, stepCap);
    return clampIndexPrice(nextOut, asset);
  }

  function finishCandle(asset, o, h, l, c, t, spike) {
    var sim = simOf(asset.id);
    o = clampIndexPrice(o, asset);
    c = clampIndexPrice(c, asset);
    var minBody = Math.max(Math.abs(o) * 0.0002, 0.02);
    var cms = candleMsFor(asset);
    var bucket = Math.floor(t / cms);
    if (!spike) {
      if (sim.run) {
        var run = 4 + Math.floor(uhash01(Math.floor(bucket / 8), 440501) * 3);
        var pos = bucket % (run + 3);
        if (pos < run) c = o + Math.max(minBody, Math.abs(c - o));
        else c = o - Math.max(minBody * 0.7, Math.abs(c - o) * 0.55);
      } else if (sim.nexusPulse) {
        var ampN = Math.max(Math.abs(o) * 0.0009, 0.12);
        var maxN = Math.abs(o) * 0.012;
        if (c >= o) c = o + Math.min(maxN, Math.max(ampN, Math.abs(c - o)));
        else c = o - Math.min(maxN, Math.max(ampN, Math.abs(c - o)));
      } else if (sim.v75Wave) {
        var ampV = Math.max(Math.abs(o) * 0.00085, 0.12);
        var maxV = Math.abs(o) * 0.012;
        if (c >= o) c = o + Math.min(maxV, Math.max(ampV, Math.abs(c - o)));
        else c = o - Math.min(maxV, Math.max(ampV, Math.abs(c - o)));
      } else if (sim.titanDrop) {
        var ampT = Math.max(Math.abs(o) * 0.0016, 0.28);
        if (Math.abs(c - o) < ampT) c = o + (c >= o ? ampT : -ampT);
      } else if (sim.boomBurst) {
        var tinyB = Math.max(Math.abs(o) * 0.00014, 0.01);
        c = c >= o ? o + tinyB : o - tinyB;
      } else if (sim.spike === 1) {
        c = o - Math.max(minBody, Math.abs(c - o) * 0.65);
      } else if (sim.spike === -1) {
        c = o + Math.max(minBody, Math.abs(c - o) * 0.65);
      } else if (Math.abs(c - o) < minBody) {
        c = o + (c >= o ? minBody : -minBody);
      }
    }
    h = Math.max(h, o, c);
    l = Math.min(l, o, c);
    if (!sim.boomBurst && !sim.titanDrop && sim.spike !== -1 && sim.spike !== 1) {
      h = capPctMove(o, h, JUMP_PCT);
      l = capPctMove(o, l, JUMP_PCT);
      h = Math.max(h, o, c);
      l = Math.min(l, o, c);
    }
    var body = Math.abs(c - o);
    var maxW = body * 1.2;
    if (sim.titanDrop) maxW = Math.max(body * 1.8, Math.abs(o) * 0.00022);
    if (sim.boomBurst) maxW = spike ? body * 0.12 : body * 0.35;
    if (sim.nexusPulse) maxW = body * 0.95;
    if (sim.v75Wave) maxW = Math.max(body * 0.9, Math.abs(o) * 0.00035);
    var hiB = Math.max(o, c);
    var loB = Math.min(o, c);
    if (h > hiB + maxW) h = hiB + maxW;
    if (l < loB - maxW) l = loB - maxW;
    return {
      o: clampIndexPrice(o, asset),
      h: clampIndexPrice(h, asset),
      l: clampIndexPrice(l, asset),
      c: clampIndexPrice(c, asset),
      t: t,
      _spike: !!spike,
      _boom: !!(sim.boomBurst && spike)
    };
  }

  function bindGlobalBuffers() {
    window.assetBuffers = window.assetBuffers || {};
    window.ASSET_BUFFERS = window.assetBuffers;
    window.assetsHistory = window.assetsHistory || {};
  }

  function stitchCandle(asset, prevClose, candle, maxPct) {
    maxPct = maxPct || JUMP_PCT;
    if (!(prevClose > 0) || !candle) return prevClose;
    var o = capPctMove(prevClose, Number(candle.o) || prevClose, maxPct);
    var c = capPctMove(o, Number(candle.c) || o, maxPct);
    c = capPctMove(prevClose, c, maxPct);
    var h = Math.max(o, c, capPctMove(prevClose, Number(candle.h) || c, maxPct));
    var l = Math.min(o, c, capPctMove(prevClose, Number(candle.l) || c, maxPct));
    candle.o = clampIndexPrice(o, asset);
    candle.c = clampIndexPrice(c, asset);
    candle.h = clampIndexPrice(Math.max(h, candle.o, candle.c), asset);
    candle.l = clampIndexPrice(Math.min(l, candle.o, candle.c), asset);
    return candle.c;
  }

  function sanitizeBuffer(asset, buf) {
    if (buf) buf.scaleVer = SCALE_VER;
    return buf;
  }

  function rebaseBufferTimes(buf, nowMs) {
    if (!buf || !buf.candles || !buf.candles.length) return;
    var cms = CANDLE_MS;
    var n = buf.candles.length;
    var tEnd = Math.floor((nowMs || Date.now()) / cms) * cms;
    var last = buf.candles[n - 1];
    if (last && isFinite(last.t) && Math.abs(last.t - tEnd) <= cms * 2) {
      buf.bucket = Math.floor(tEnd / cms);
      if (buf.forming && !isFinite(buf.forming.t)) buf.forming.t = tEnd;
      return;
    }
    var i;
    for (i = 0; i < n; i++) {
      buf.candles[i].t = tEnd - (n - 1 - i) * cms;
    }
    buf.bucket = Math.floor(tEnd / cms);
    if (buf.forming) buf.forming.t = tEnd;
  }

  function publishHistory(assetId, buf) {
    bindGlobalBuffers();
    var prices = (buf.prices || []).slice(-HISTORY_N);
    window.assetsHistory[assetId] = prices;
    window.assetBuffers[assetId] = buf;
    window.ASSET_BUFFERS[assetId] = buf;
  }

  function huntPriceFor(assetId) {
    var i;
    var now = Date.now();
    for (i = 0; i < trades.length; i++) {
      var tr = trades[i];
      if (!tr || tr.settled || tr.assetId !== assetId) continue;
      var exp = tr.expiryTime || tr.expiresAt || 0;
      if (exp && now >= exp) continue;
      var ep = Number(tr.entryPrice);
      var ref = 0;
      if (window.assetBuffers && window.assetBuffers[assetId] && window.assetBuffers[assetId].price) {
        ref = window.assetBuffers[assetId].price;
      } else if (markets[assetId] && markets[assetId].price) {
        ref = markets[assetId].price;
      }
      if (isPlausiblePrice(ep, ref)) return ep;
    }
    return 0;
  }

  function makeWalkCandle(asset, prev, ts, i) {
    var sim = simOf(asset.id);
    var base = Number(asset.basePrice) || prev;
    var vol = Math.max(prev * (sim.vol || 0.0035), prev * 0.0014);
    var rnd = uhash01(i + 3, sim.vol * 1000 || 11) - 0.49;
    var close = prev + rnd * vol * 2.6;
    close += (base - close) * 0.028;
    var spiked = false;
    if (sim.spike === -1 && i > 6 && (i % (16 + Math.floor(uhash01(i, 19) * 12))) === 0) {
      close = prev * (1 - 0.015 - uhash01(i, 4) * 0.012);
      spiked = true;
    } else if (sim.run) {
      var run = 4 + Math.floor(uhash01(Math.floor(i / 8), 440501) * 3);
      var pos = i % (run + 3);
      close = pos < run ? prev + vol * 1.05 : prev - vol * 0.62;
    } else if (sim.titanDrop) {
      close = prev + Math.sin(i / 3.2) * vol * 1.8 + rnd * vol * 1.2;
      if (uhash01(i, 91) > 0.9) close = prev * (1 - 0.012 - uhash01(i, 5) * 0.01);
    }
    close = clampIndexPrice(close, asset);
    var open = prev;
    var wick = vol * (0.4 + uhash01(i, 22) * 0.85);
    var h = Math.max(open, close) + wick * uhash01(i, 7);
    var l = Math.min(open, close) - wick * uhash01(i, 8);
    if (spiked) l = Math.min(l, close);
    return {
      o: clampIndexPrice(open, asset),
      h: clampIndexPrice(h, asset),
      l: clampIndexPrice(l, asset),
      c: close,
      t: ts,
      _spike: spiked,
      _boom: false
    };
  }

  function seedAssetBuffer(asset) {
    var sim = simOf(asset.id);
    var price = Number(asset.basePrice) || 5000;
    var now = Date.now();
    var cms = candleMsFor(asset);
    var t0 = Math.floor(now / cms) - (SEED_N - 1);
    var candles = [];
    var prices = [];
    var i;
    var k;
    var nextSpike = now + 12000 + Math.random() * 8000;
    if (!sim.titanDrop) nextSpike = now + 25000 + Math.random() * 10000;
    var boomWalk = sim.boomBurst ? {
      boomPhase: 'acc',
      boomPhaseUntil: (t0 * cms) + 2500 + uhash01(t0, 882119) * 3000,
      boomMid: price,
      boomLeft: 0,
      boomZig: 1
    } : null;
    for (i = 0; i < SEED_N; i++) {
      var ts = (t0 + i) * cms;
      var o = price;
      var h = o;
      var l = o;
      var spiked = false;
      if (sim.boomBurst && boomWalk) {
        var kk;
        for (kk = 0; kk < 4; kk++) {
          var brS = stepBoomBurst(asset, boomWalk, price, ts + kk * (cms / 4));
          price = brS.price;
          if (brS.boom) spiked = true;
          h = Math.max(o, h, price);
          l = Math.min(o, l, price);
        }
      } else {
        var walked = makeWalkCandle(asset, price, ts, i);
        price = walked.c;
        h = walked.h;
        l = walked.l;
        spiked = !!walked._spike;
        o = walked.o;
        var candle = walked;
        candles.push(candle);
        prices.push(candle.c);
        price = candle.c;
        if (boomWalk) boomWalk.boomMid = boomWalk.boomPhase === 'acc' ? price : boomWalk.boomMid;
        continue;
      }
      var candle = finishCandle(asset, o, h, l, price, ts, spiked);
      candles.push(candle);
      prices.push(candle.c);
      price = candle.c;
      if (boomWalk) boomWalk.boomMid = boomWalk.boomPhase === 'acc' ? price : boomWalk.boomMid;
    }
    var buf = {
      prices: prices,
      candles: candles,
      price: price,
      lastMs: now,
      bucket: Math.floor(now / cms),
      forming: finishCandle(asset, price, price, price, price, Math.floor(now / cms) * cms, false),
      nextSpike: nextSpike,
      titanVer: sim.titanDrop ? TITAN_VER : 0,
      coreVer: sim.coreWave ? 1 : 0,
      goldVer: sim.goldHot ? 2 : 0,
      boomVer: asset.id === 'boomspike' ? BOOM_VER : (sim.boomBurst ? 2 : 0),
      nexusVer: sim.nexusPulse ? 1 : 0,
      v75Ver: sim.v75Wave ? 2 : 0,
      boomPhase: boomWalk ? boomWalk.boomPhase : null,
      boomPhaseUntil: boomWalk ? boomWalk.boomPhaseUntil : 0,
      boomMid: boomWalk ? boomWalk.boomMid : 0,
      boomLeft: boomWalk ? boomWalk.boomLeft : 0,
      boomZig: boomWalk ? boomWalk.boomZig : 1,
      boomPeak: boomWalk ? boomWalk.boomPeak : 0,
      ver: SIM_VER,
      scaleVer: SCALE_VER
    };
    sanitizeBuffer(asset, buf, Number(asset.basePrice) || price);
    publishHistory(asset.id, buf);
    rebaseBufferTimes(buf, now);
    return buf;
  }

  function bufferNeedsSeed(asset, buf) {
    if (!buf || !buf.candles || buf.candles.length < MIN_SEED) return true;
    if (simOf(asset.id).titanDrop && buf.titanVer !== TITAN_VER) return true;
    if (asset.id === 'boomspike' && buf.boomVer !== BOOM_VER) return true;
    if (buf.scaleVer !== SCALE_VER) return true;
    return false;
  }

  function advanceBuffer(asset, nowMs) {
    bindGlobalBuffers();
    var buf = window.ASSET_BUFFERS[asset.id] || window.assetBuffers[asset.id];
    if (bufferNeedsSeed(asset, buf)) {
      buf = seedAssetBuffer(asset);
    }
    nowMs = nowMs || Date.now();
    if (nowMs < buf.lastMs) nowMs = buf.lastMs;
    var sim = simOf(asset.id);
    var cms = candleMsFor(asset);
    var elapsed = nowMs - buf.lastMs;
    if (elapsed < 0) elapsed = 0;
    if (elapsed > 900) {
      buf.lastMs = nowMs;
      elapsed = 160;
    }
    var fastTick = true;
    var missed = Math.floor(elapsed / cms);
    var price = buf.price;
    var forming = buf.forming || { o: price, h: price, l: price, c: price, t: Math.floor(nowMs / cms) * cms };
    var g;
    var maxCatch = tradeBusyFor(asset.id) ? 0 : 1;
    var catchN = Math.min(missed, maxCatch);
    for (g = 0; g < catchN; g++) {
      var tsG = (buf.bucket + 1) * cms;
      var oG = price;
      var hG = oG;
      var lG = oG;
      var spikedG = false;
      var closedG;
      if (sim.boomBurst) {
        var kk;
        var inner = 3;
        var oG = price;
        var hG = oG;
        var lG = oG;
        for (kk = 0; kk < inner; kk++) {
          var brG = stepBoomBurst(asset, buf, price, tsG + kk * (cms / inner));
          price = brG.price;
          if (brG.boom) spikedG = true;
          if (price > hG) hG = price;
          if (price < lG) lG = price;
        }
        closedG = finishCandle(asset, oG, hG, lG, price, tsG, spikedG);
        if (spikedG) closedG._boom = true;
      } else {
        closedG = makeWalkCandle(asset, price, tsG, buf.candles.length);
        price = closedG.c;
      }
      buf.candles.push(closedG);
      if (buf.candles.length > HISTORY_N) buf.candles.shift();
      buf.prices.push(closedG.c);
      if (buf.prices.length > HISTORY_N) buf.prices.shift();
      buf.bucket += 1;
      price = closedG.c;
      forming = { o: price, h: price, l: price, c: price, t: (buf.bucket) * cms };
    }
    var remain = elapsed - catchN * cms;
    if (remain < 0) remain = 0;
    var busy = tradeBusyFor(asset.id);
    var box = busy ? tradeBoxFor(asset.id, price) : null;
    var stepMs = sim.titanDrop ? 55 : (sim.v75Wave || sim.nexusPulse ? 90 : 120);
    var steps = Math.max(1, Math.min(fastTick ? 4 : 2, Math.floor(remain / stepMs) || 1));
      var s;
      var price0 = price;
      for (s = 0; s < steps; s++) {
        var tMs = nowMs - remain + ((s + 1) / Math.max(1, steps)) * remain;
        var dt = Math.max(0.02, (remain / Math.max(1, steps)) / 1000);
        var didSpike = false;
        var boomForce = false;
        var titanForce = false;
        if (!busy && Date.now() >= (clickQuietUntil[asset.id] || 0) && sim.boomBurst) {
          var br = stepBoomBurst(asset, buf, price, tMs);
          price = br.price;
          if (br.boom) {
            forming._spike = true;
            forming._boom = true;
            forming.o = br.from;
          }
          didSpike = true;
        } else if (!busy && Date.now() >= (clickQuietUntil[asset.id] || 0) && sim.spike && tMs >= (buf.nextSpike || 0)) {
          var fromP = price;
          price = clampIndexPrice(fromP * (1 + sim.spike * 0.006), asset);
          buf.nextSpike = tMs + 25000 + Math.random() * 10000;
          forming._spike = true;
          forming.o = fromP;
          didSpike = true;
        }
        if (!didSpike) {
          price = unifiedStep(asset, price, tMs, dt, { hunt: 0, busy: busy });
        }
        price = capPctMove(forming.c > 0 ? forming.c : price0, price, tickCapPct(asset, didSpike));
        price = clampIndexPrice(price, asset);
        if (busy && box) price = clampToTradeBox(price, box);
        var bucket = Math.floor(tMs / cms);
        forming.c = price;
        var wickN = price * (sim.coreWave ? 0.00018 : (0.00022 + Math.abs(Math.sin(tMs / 83)) * 0.00028));
        if (price > forming.h) forming.h = price;
        if (price < forming.l) forming.l = price;
        forming.h = Math.max(forming.h, price + wickN);
        forming.l = Math.min(forming.l, price - wickN * (0.85 + Math.abs(Math.cos(tMs / 61)) * 0.4));
        if (busy && box) {
          if (forming.h > box.frameHi) forming.h = box.frameHi;
          if (forming.l < box.frameLo) forming.l = box.frameLo;
        }
        sanitizeOhlc(asset, forming, price, busy && box ? box.span : 0);
        if (bucket !== buf.bucket) {
          forming = finishCandle(asset, forming.o, forming.h, forming.l, forming.c, forming.t, forming._spike || boomForce || titanForce);
          if (forming._boom || boomForce) forming._boom = true;
          buf.candles.push(forming);
          if (buf.candles.length > HISTORY_N) buf.candles.shift();
          buf.prices.push(forming.c);
          if (buf.prices.length > HISTORY_N) buf.prices.shift();
          buf.bucket = bucket;
          forming = { o: price, h: price, l: price, c: price, t: bucket * cms };
        }
      }
    buf.price = clampIndexPrice(price, asset);
    if (busy && box) buf.price = clampToTradeBox(buf.price, box);
    buf.forming = sanitizeOhlc(asset, finishCandle(asset, forming.o, forming.h, forming.l, forming.c, forming.t, forming._spike), buf.price, busy && box ? box.span : 0);
    if (busy && box && buf.forming) {
      buf.forming.c = clampToTradeBox(buf.forming.c, box);
      if (buf.forming.h > box.frameHi) buf.forming.h = box.frameHi;
      if (buf.forming.l < box.frameLo) buf.forming.l = box.frameLo;
      buf.price = buf.forming.c;
    }
    buf.lastMs = nowMs;
    buf.ver = SIM_VER;
    buf.scaleVer = SCALE_VER;
    rebaseBufferTimes(buf, nowMs);
    publishHistory(asset.id, buf);
    return buf;
  }

  function walkCfg(id) {
    var s = simOf(id);
    return { vol: s.vol, spike: s.spike || null };
  }

  function synthPrice(asset) {
    var id = (asset && asset.id) || asset;
    var b = window.assetBuffers && window.assetBuffers[id];
    if (b && isFinite(b.price)) return b.price;
    return clampIndexPrice(asset && asset.basePrice, asset);
  }

  function syncMarket(market, asset, nowMs) {
    nowMs = nowMs || Date.now();
    var buf = advanceBuffer(asset, nowMs);
    var closed = buf.candles.slice();
    if (closed.length > HISTORY_N) closed = closed.slice(-HISTORY_N);
    var forming = buf.forming;
    var history = buf.prices.slice();
    market.price = buf.price;
    market.candles = closed;
    market.candle = forming;
    market.history = history;
    market.ticksInCandle = Math.floor((nowMs % CANDLE_MS) / 80);
    publishAssetBuffer(asset.id, market);
    return market;
  }

  function publishAssetBuffer(assetId, market) {
    window.assetsState = window.assetsState || {};
    var prev = window.assetsState[assetId] || {};
    var candles = (market.candles || []).slice();
    if (market.candle) candles.push(market.candle);
    var buf = candles.slice(-HISTORY_N);
    var min = Infinity;
    var max = -Infinity;
    var i;
    for (i = 0; i < buf.length; i++) {
      var c = buf[i];
      if (!c) continue;
      var pc = Number(c.c);
      if (!isPlausiblePrice(pc, market.price)) continue;
      if (c.l < min && isPlausiblePrice(c.l, market.price)) min = c.l;
      if (c.h > max && isPlausiblePrice(c.h, market.price)) max = c.h;
      if (pc < min) min = pc;
      if (pc > max) max = pc;
    }
    if (!isFinite(min) || !isFinite(max)) {
      min = Number(market.price) || 0;
      max = min;
    }
    window.assetsState[assetId] = {
      candles: buf,
      min: min,
      max: max,
      lastPrice: market.price,
      viewMin: prev.viewMin || 0,
      viewMax: prev.viewMax || 0,
      lockMin: prev.lockMin || 0,
      lockMax: prev.lockMax || 0,
      lockUntil: prev.lockUntil || 0,
      zoomIdx: prev.zoomIdx,
      inds: prev.inds,
      at: Date.now()
    };
    var closes = [];
    for (i = 0; i < buf.length; i++) {
      if (buf[i] && isFinite(buf[i].c)) closes.push(buf[i].c);
    }
    window.assetsHistory = window.assetsHistory || {};
    window.assetsHistory[assetId] = closes.slice(-HISTORY_N);
  }

  function seedMarket(assetId) {
    var asset = C.ASSETS[assetId];
    var market = {
      id: assetId,
      price: asset.basePrice,
      history: [],
      candles: [],
      candle: { o: asset.basePrice, h: asset.basePrice, l: asset.basePrice, c: asset.basePrice },
      ticksInCandle: 0,
      payout: C.REAL_PAYOUT
    };
    return syncMarket(market, asset, Date.now());
  }

  function rollPayout(asset, mode) {
    if (mode === 'real') return C.REAL_PAYOUT;
    var span = asset.payoutMax - asset.payoutMin;
    return +(asset.payoutMin + Math.random() * span).toFixed(3);
  }

  function ensureMarkets() {
    var id;
    for (id in C.ASSETS) {
      if (markets[id]) continue;
      var asset = C.ASSETS[id];
      markets[id] = {
        id: id,
        price: asset.basePrice,
        history: [],
        candles: [],
        candle: { o: asset.basePrice, h: asset.basePrice, l: asset.basePrice, c: asset.basePrice },
        ticksInCandle: 0,
        payout: C.REAL_PAYOUT
      };
    }
  }

  function preloadAllBuffers() {
    bindGlobalBuffers();
    ensureMarkets();
    var id;
    for (id in C.ASSETS) {
      if (!C.ASSETS[id]) continue;
      syncMarket(markets[id], C.ASSETS[id], Date.now());
    }
    window.ASSET_BUFFERS = window.assetBuffers;
  }

  function wakeMarket(assetId) {
    var id = canonAssetId(assetId);
    ensureMarkets();
    if (C.ASSETS[id]) {
      syncMarket(markets[id], C.ASSETS[id], Date.now());
    }
    return markets[id];
  }

  function makeSeal(payload) {
    var s = sessionNonce + '|' + payload + '|' + orderSeq;
    var h = 2166136261;
    var i;
    for (i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function automationDetected() {
    if (navigator.webdriver) return true;
    if (window.callPhantom || window._phantom) return true;
    if (window.domAutomation || window.domAutomationController) return true;
    return false;
  }

  function balOf(user, mode) {
    if (D6.Store.balanceMode) return D6.Store.balanceMode(user, mode);
    return D6.Store.balanceOf(user);
  }

  function setBal(user, mode, value) {
    if (D6.Store.setBalanceMode) D6.Store.setBalanceMode(user, mode, value);
    else {
      var prev = user.mode;
      user.mode = mode;
      D6.Store.setBalance(user, value);
      user.mode = prev;
    }
  }

  function stakeCap(user, stake, mode) {
    mode = mode || user.mode;
    var balance = balOf(user, mode);
    if (stake < C.MIN_STAKE) {
      return { ok: false, cap: C.MIN_STAKE, reason: D6.I18N.t('minStake') + ' ' + D6.fmtFCFA(C.MIN_STAKE) };
    }
    if (stake > balance) {
      return { ok: false, cap: balance, reason: D6.I18N.t('insufficient') };
    }
    return { ok: true, cap: balance };
  }

  function expiryOf(t) {
    return t.expiryTime || t.expiresAt;
  }

  function clearTradeTimer(id) {
    if (!id || !tradeTimers[id]) return;
    try { clearTimeout(tradeTimers[id]); } catch (eT) { /* ignore */ }
    try { clearInterval(tradeTimers[id]); } catch (eI) { /* ignore */ }
    delete tradeTimers[id];
  }

  function armTradeTimer(trade) {
    if (!trade || !trade.id) return;
    clearTradeTimer(trade.id);
  }

  function isLive(t) {
    return t && !t.settled && t.status === 'open' && Date.now() < expiryOf(t);
  }

  function isOpen(t) {
    return t && !t.settled && (t.status === 'open' || !t.status);
  }

  function openForMode(mode) {
    return trades.filter(function (t) {
      return isOpen(t) && t.mode === mode;
    });
  }

  function syncTime(t) {
    var left = (expiryOf(t) - Date.now()) / 1000;
    t.timeLeft = left > 0 ? left : 0;
    return t.timeLeft;
  }

  function publicTrade(t) {
    if (!t) return null;
    syncTime(t);
    return Object.freeze({
      id: t.id,
      assetId: t.assetId,
      side: t.side,
      stake: t.stake,
      duration: t.duration,
      timeLeft: t.timeLeft,
      entryPrice: t.entryPrice,
      openPrice: t.entryPrice,
      payout: t.payout,
      payoutMult: t.payout,
      startedAt: t.startedAt,
      startTime: t.startTime || t.startedAt,
      openedAt: t.startTime || t.startedAt,
      expiryTime: expiryOf(t),
      expiresAt: expiryOf(t),
      expiryAt: expiryOf(t),
      settled: !!t.settled,
      status: t.status || (t.settled ? 'closed' : 'open'),
      mode: t.mode,
      accountType: t.mode
    });
  }

  function persistOpen(user) {
    if (!user) return;
    user.openTrades = trades.filter(isOpen).map(function (t) {
      return {
        id: t.id,
        userId: t.userId,
        assetId: t.assetId,
        side: t.side,
        stake: t.stake,
        payout: t.payout,
        entryPrice: t.entryPrice,
        duration: t.duration,
        durationMs: t.durationMs,
        startTime: t.startTime,
        startedAt: t.startedAt,
        expiryTime: expiryOf(t),
        expiresAt: expiryOf(t),
        mode: t.mode,
        status: 'open',
        settled: false,
        seq: t.seq
      };
    });
    D6.Store.saveUser(user);
  }

  function closePriceAt(assetId) {
    var asset = C.ASSETS[assetId];
    if (!asset) return 0;
    return synthPrice(asset);
  }

  function payoutPercent(raw) {
    var n = parseFloat(raw);
    if (!isFinite(n) || n <= 0) return 88;
    if (n === 88 || n === 500 || n === 1000 || n === 5000) return n;
    if (Math.abs(n - 1.88) < 0.02) return 88;
    if (Math.abs(n - 6) < 0.02) return 500;
    if (Math.abs(n - 11) < 0.02) return 1000;
    if (Math.abs(n - 51) < 0.02) return 5000;
    if (n >= 80) return n;
    if (n > 1 && n < 80) return Math.round((n - 1) * 100);
    return 88;
  }

  function readFinalPrice(trade) {
    var entry = Number(trade.ticket && trade.ticket.entryPrice != null ? trade.ticket.entryPrice : trade.entryPrice);
    var assetId = trade.assetId;
    var finalPrice = entry;
    var m = markets[assetId];
    if (m && isFinite(m.price) && m.price > 0) finalPrice = m.price;
    var buf = window.assetBuffers && window.assetBuffers[assetId];
    if (buf && isFinite(buf.price) && buf.price > 0) finalPrice = buf.price;
    if (buf && buf.forming && isFinite(buf.forming.c) && buf.forming.c > 0) finalPrice = buf.forming.c;
    if (D6.Chart && D6.Chart.lastClose && D6.Chart.lastAsset && D6.Chart.lastAsset() === assetId) {
      var drawn = Number(D6.Chart.lastClose());
      if (isFinite(drawn) && drawn > 0) finalPrice = drawn;
    }
    return finalPrice;
  }

  function wonFromPrice(trade, finalPrice) {
    var entry = Number(trade.ticket && trade.ticket.entryPrice != null ? trade.ticket.entryPrice : trade.entryPrice);
    var side = (trade.ticket && trade.ticket.side) || trade.side;
    if (side === 'put') return finalPrice < entry;
    return finalPrice > entry;
  }

  function normalizeOdds(v) {
    var list = C.ODDS_MULT || [1.88, 6, 11, 51];
    var n = Number(v);
    var i;
    for (i = 0; i < list.length; i++) {
      if (Math.abs(list[i] - n) < 0.001) return list[i];
    }
    return C.DEFAULT_ODDS != null ? C.DEFAULT_ODDS : 1.88;
  }

  function oddsKey(mult) {
    var o = normalizeOdds(mult);
    if (Math.abs(o - 1.88) < 0.001) return '1.88';
    if (Math.abs(o - 6) < 0.001) return '6';
    if (Math.abs(o - 11) < 0.001) return '11';
    if (o >= 50) return '51';
    return '1.88';
  }

  function winRateForOdds(mult, map) {
    map = map || C.ODDS_WIN_RATE || {};
    var o = normalizeOdds(mult);
    var k = oddsKey(o);
    if (map[k] != null && isFinite(Number(map[k]))) return Number(map[k]);
    var m = Math.max(1.01, Number(o) || 1.88);
    var r = 1 / (m * 1.25);
    return Math.max(0.001, Math.min(0.49, r));
  }

  function isAdminUser(user) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.id === 'admin_master') return true;
    var mail = String(user.email || '').toLowerCase();
    var adminMail = String((C.ADMIN_EMAIL) || 'admin@orolado.com').toLowerCase();
    if (mail !== '' && mail === adminMail) return true;
    try {
      if (D6.Auth && typeof D6.Auth.isAdmin === 'function' && D6.Auth.isAdmin(user)) return true;
    } catch (eA) { /* ignore */ }
    return false;
  }

  function forceExitPrice(entry, isCall, won, assetId, harsh) {
    var base = Math.max((C.ASSETS[assetId].tickNoise || 0.3) * 0.45, 0.28);
    var nudge = harsh ? Math.max(base * 3.2, 1.1) : base;
    return entry + (won
      ? (isCall ? 1 : -1)
      : (isCall ? -1 : 1)) * nudge;
  }

  /** Arbitrage étanche — démo / admin réel / joueur réel. */
  function resolveWinProbability(user, trade, mode) {
    var demoMap = C.ODDS_WIN_RATE_DEMO || {
      '1.88': 0.58, '6': 0.20, '11': 0.10, '51': 0.02
    };
    var adminRealMap = C.ODDS_WIN_RATE_ADMIN_REAL || C.ODDS_WIN_RATE_FAVORABLE || {
      '1.88': 0.70, '6': 0.255, '11': 0.127, '51': 0.025
    };
    var realMap = C.ODDS_WIN_RATE || {
      '1.88': 0.42, '6': 0.12, '11': 0.05, '51': 0.008
    };
    var admin = isAdminUser(user);
    var isDemo = mode !== 'real';
    var harsh = false;

    if (isDemo) {
      return { winProbability: winRateForOdds(trade.payout, demoMap), harsh: false, profile: 'B' };
    }
    if (admin) {
      return { winProbability: winRateForOdds(trade.payout, adminRealMap), harsh: false, profile: 'A' };
    }

    var winProbability = winRateForOdds(trade.payout, realMap);
    var losses = Number(user.consecutiveLosses) || 0;
    var lastBet = Number(user.lastBetAmount) || Number(user.lastStake) || 0;
    var currentBet = Number(trade.stake) || 0;
    var doubling = lastBet > 0 && currentBet >= lastBet * 1.8;

    if (losses >= 2 && doubling) {
      winProbability = 0;
      harsh = true;
    }

    var deposited = Number(user.realDepositTotal) || 0;
    if (deposited > 0) {
      var wallet = balOf(user, 'real');
      var netProfit = wallet - deposited;
      if (netProfit > deposited * 0.80) {
        var k = oddsKey(trade.payout);
        var ceilRate = (k === '1.88') ? 0.15 : 0.01;
        winProbability = Math.min(winProbability, ceilRate);
      }
    }

    return { winProbability: winProbability, harsh: harsh, profile: 'C' };
  }

  function decideTradeOutcome(user, trade, mode) {
    if (trade && trade._outcomeReady) {
      return { wantWon: !!trade._wantWon, harsh: !!trade._harsh, target: Number(trade._exitTarget) };
    }
    var verdict = resolveWinProbability(user, trade, mode);
    var wantWon = verdict.harsh ? false : (Math.random() < verdict.winProbability);
    var isCall = trade.side === 'call';
    var target = forceExitPrice(trade.entryPrice, isCall, wantWon, trade.assetId, verdict.harsh);
    trade._wantWon = wantWon;
    trade._harsh = !!verdict.harsh;
    trade._exitTarget = target;
    trade._outcomeReady = true;
    return { wantWon: wantWon, harsh: !!verdict.harsh, target: target };
  }

  function applyExitToMarket(trade, target) {
    /* Issue visuelle uniquement — l'historique de l'actif reste intact. */
    void target;
    void trade;
  }

  function prepareLastSecondSteer(now) {
    var user = D6.Store && D6.Store.current ? D6.Store.current() : null;
    if (!user) return;
    var i;
    for (i = 0; i < trades.length; i++) {
      var tr = trades[i];
      if (!isLive(tr) || tr.userId !== user.id) continue;
      var left = expiryOf(tr) - now;
      if (left > 220 || left < 0) continue;
      decideTradeOutcome(user, tr, tr.mode === 'real' ? 'real' : 'demo');
    }
  }

  preloadAllBuffers();
  Object.keys(C.ASSETS).forEach(function (id) {
    payoutLive[id] = markets[id].payout;
  });

  var api = {
    markets: markets,
    payoutLive: payoutLive,
    onExpire: null,
    onSettled: null,

    getMarket: function (id) {
      return wakeMarket(id);
    },

    getBuffer: function (id) {
      bindGlobalBuffers();
      id = canonAssetId(id);
      if (C.ASSETS[id]) wakeMarket(id);
      return window.ASSET_BUFFERS[id] || window.assetBuffers[id] || null;
    },

    preloadAll: function () {
      preloadAllBuffers();
    },

    getTrade: function () {
      var live = trades.filter(isLive);
      if (!live.length) return null;
      var best = live[0];
      var i;
      for (i = 1; i < live.length; i++) {
        if (expiryOf(live[i]) < expiryOf(best)) best = live[i];
      }
      return publicTrade(best);
    },

    getTrades: function (mode) {
      return trades.filter(isLive).filter(function (t) {
        return !mode || t.mode === mode;
      }).map(function (t) { return publicTrade(t); });
    },

    liveCount: function (mode) {
      if (mode) return openForMode(mode).length;
      return trades.filter(isOpen).length;
    },

    forEachOpen: function (fn) {
      if (typeof fn !== 'function') return;
      var i;
      for (i = 0; i < trades.length; i++) {
        if (isLive(trades[i])) fn(trades[i]);
      }
    },

    restoreOpen: function (user) {
      if (!user) return 0;
      trades = [];
      var list = user.openTrades || [];
      var i;
      for (i = 0; i < list.length; i++) {
        var raw = list[i];
        if (!raw || !raw.id) continue;
        if (raw.userId && raw.userId !== user.id) continue;
        if (raw.settled || raw.status === 'won' || raw.status === 'lost' || raw.status === 'void') continue;
        trades.push({
          id: raw.id,
          assetId: canonAssetId(raw.assetId),
          side: raw.side === 'put' ? 'put' : 'call',
          stake: D6.roundMoney(Number(raw.stake) || 0),
          duration: raw.duration || 10,
          durationMs: raw.durationMs || (raw.duration || 10) * 1000,
          timeLeft: 0,
          entryPrice: Number(raw.entryPrice) || 0,
          payout: Number(raw.payout) || C.REAL_PAYOUT,
          startTime: raw.startTime || raw.startedAt || Date.now(),
          startedAt: raw.startedAt || raw.startTime || Date.now(),
          expiryTime: raw.expiryTime || raw.expiresAt || raw.expiryAt,
          expiresAt: raw.expiresAt || raw.expiryTime || raw.expiryAt,
          mode: raw.mode === 'real' ? 'real' : 'demo',
          userId: user.id,
          seq: raw.seq || 0,
          settled: false,
          status: 'open'
        });
      }
      for (i = 0; i < trades.length; i++) {
        armTradeTimer(trades[i]);
        if (D6.Chart && D6.Chart.applyOpenTradeVisual) {
          try { D6.Chart.applyOpenTradeVisual(publicTrade(trades[i])); } catch (eR) { /* ignore */ }
        }
      }
      return trades.length;
    },

    refreshPayout: function (assetId, mode) {
      var asset = C.ASSETS[assetId];
      var u = D6.Store.current();
      var m = mode || (u && u.mode) || 'demo';
      payoutLive[assetId] = rollPayout(asset, m);
      markets[assetId].payout = payoutLive[assetId];
      return payoutLive[assetId];
    },

    resyncClocks: function () {
      bindGlobalBuffers();
      var now = Date.now();
      var id;
      for (id in window.assetBuffers) {
        if (!window.assetBuffers.hasOwnProperty(id)) continue;
        var buf = window.assetBuffers[id];
        if (buf) buf.lastMs = now;
      }
      for (id in markets) {
        if (markets[id]) markets[id].lastMs = now;
      }
    },

    tick: function (assetId) {
      ensureMarkets();
      var now = Date.now();
      var i;
      for (i = 0; i < trades.length; i++) {
        syncTime(trades[i]);
      }
      var user = D6.Store && D6.Store.current ? D6.Store.current() : null;
      if (user) api.flushSettlements(user);
      if (window.chartIsPaused || document.hidden) return;
      var id;
      for (id in C.ASSETS) {
        if (!C.ASSETS.hasOwnProperty(id)) continue;
        syncMarket(markets[id], C.ASSETS[id], now);
      }
      prepareLastSecondSteer(now);
    },

    placeOrder: function (user, opts) {
      if (automationDetected()) return { ok: false, reason: 'Session non sécurisée' };
      if (!user || !D6.Store.current() || D6.Store.current().id !== user.id) {
        return { ok: false, reason: 'Session invalide' };
      }
      var mode = user.mode === 'real' ? 'real' : 'demo';
      if (openForMode(mode).length >= MAX_OPEN) {
        return { ok: false, reason: 'Limite atteinte (10 trades max). Veuillez attendre la fin d\'un trade.' };
      }

      var nowPerf = performance.now();
      if (nowPerf - lastOrderAt < 350) {
        return { ok: false, reason: D6.I18N.t('antibot') };
      }

      var stake = D6.roundMoney(Number(opts.stake) || 0);
      var duration = C.DURATIONS.indexOf(opts.duration) >= 0 ? opts.duration : C.DEFAULT_DURATION;
      if (duration === 3) duration = 5;
      var assetId = canonAssetId(opts.assetId);
      var side = opts.side === 'put' ? 'put' : 'call';
      var gate = stakeCap(user, stake, mode);
      if (!gate.ok) return gate;

      ensureMarkets();
      var market = markets[assetId];
      pendingBusyUntil[assetId] = Date.now() + duration * 1000 + 1500;
      clickQuietUntil[assetId] = Date.now() + 300;
      engineCaptureFrame(assetId, pendingBusyUntil[assetId]);
      var liveBuf = window.assetBuffers && window.assetBuffers[assetId];
      if (liveBuf) liveBuf.lastMs = Date.now();
      var payout = normalizeOdds(opts.payout != null ? opts.payout : (opts.odds != null ? opts.odds : C.DEFAULT_ODDS));
      setBal(user, mode, balOf(user, mode) - stake);
      D6.Store.addTransaction(user, {
        type: 'stake',
        amount: -stake,
        mode: mode,
        note: (side === 'call' ? 'CALL' : 'PUT') + ' ' + C.ASSETS[assetId].short
      });

      orderSeq += 1;
      lastOrderAt = nowPerf;
      D6.holdRemote = true;
      var entry = market.price;
      if (D6.Chart && D6.Chart.lastClose && D6.Chart.lastAsset && D6.Chart.lastAsset() === assetId) {
        var drawnIn = Number(D6.Chart.lastClose());
        if (isFinite(drawnIn) && drawnIn > 0) entry = drawnIn;
      }
      market.price = entry;
      if (liveBuf) {
        liveBuf.price = entry;
        if (liveBuf.forming) {
          liveBuf.forming.c = entry;
          var wEntry = entry * 0.00015;
          liveBuf.forming.h = Math.max(entry, liveBuf.forming.o || entry) + wEntry;
          liveBuf.forming.l = Math.min(entry, liveBuf.forming.o || entry) - wEntry;
        }
      }
      var wall = Date.now();
      var durationMs = duration * 1000;
      var id = D6.uid();

      var t = {
        id: id,
        assetId: assetId,
        side: side,
        stake: stake,
        duration: duration,
        durationMs: durationMs,
        timeLeft: duration,
        entryPrice: entry,
        payout: payout,
        startTime: wall,
        startedAt: wall,
        expiryTime: wall + durationMs,
        expiresAt: wall + durationMs,
        mode: mode,
        userId: user.id,
        seq: orderSeq,
        settled: false,
        status: 'open'
      };
      t.ticket = Object.freeze({
        stake: stake,
        duration: duration,
        durationMs: durationMs,
        payout: payout,
        side: side,
        entryPrice: entry,
        assetId: assetId
      });
      trades.push(t);
      armTradeTimer(t);

      if (mode === 'real') {
        user.realStakeVolume = (user.realStakeVolume || 0) + stake;
        user.totalWageredSinceDeposit = Number(user.realStakeVolume) || 0;
        user.requiredWagering = D6.roundMoney((Number(user.realDepositTotal) || 0) * ((C.WAGER_MULTIPLIER) || 2));
      }
      user.lastStake = stake;
      // Ne pas écraser lastBetAmount ici : réservé à la clôture (anti-martingale).
      persistOpen(user);
      if (D6.Supabase && D6.Supabase.saveOrder) D6.Supabase.saveOrder(t, 'open');
      var pub = publicTrade(t);
      // Ligne CALL/PUT immédiate (sync) — ne pas attendre le prochain tick/F5.
      if (D6.Chart && D6.Chart.applyOpenTradeVisual) {
        try { D6.Chart.applyOpenTradeVisual(pub); } catch (eVis) { /* ignore */ }
      }
      return { ok: true, trade: pub };
    },

    resolve: function (user, tradeId) {
      if (!user || !trades.length) return null;
      var idx = -1;
      var i;
      var now = Date.now();
      if (tradeId) {
        for (i = 0; i < trades.length; i++) {
          if (trades[i].id === tradeId) { idx = i; break; }
        }
      } else {
        for (i = 0; i < trades.length; i++) {
          if (isOpen(trades[i]) && now >= expiryOf(trades[i])) { idx = i; break; }
        }
      }
      if (idx < 0) return null;
      var trade = trades[idx];
      clearTradeTimer(trade.id);
      if (trade.settled || trade.status === 'won' || trade.status === 'lost' || trade.status === 'void') {
        trades.splice(idx, 1);
        persistOpen(user);
        if (D6.Chart && D6.Chart.removeTradeVisual) {
          try { D6.Chart.removeTradeVisual(trade.id); } catch (e0) { /* ignore */ }
        }
        return null;
      }
      if (now < expiryOf(trade)) return null;

      // Idempotence : marquer avant crédit.
      trade.settled = true;

      if (user.id !== trade.userId) {
        if (D6.Chart && D6.Chart.removeTradeVisual) {
          try { D6.Chart.removeTradeVisual(trade.id); } catch (eGone) { /* ignore */ }
        }
        trades.splice(idx, 1);
        persistOpen(user);
        return null;
      }

      var mode = trade.mode === 'real' ? 'real' : 'demo';
      var payout = normalizeOdds(trade.ticket && trade.ticket.payout != null ? trade.ticket.payout : trade.payout);
      ensureMarkets();
      var mkt = markets[trade.assetId];
      if (mkt && C.ASSETS[trade.assetId]) {
        syncMarket(mkt, C.ASSETS[trade.assetId], Date.now());
      }
      trade.payout = payout;
      var voided = false;
      var exitPrice = readFinalPrice(trade);
      var won = wonFromPrice(trade, exitPrice);
      applyExitToMarket(trade, exitPrice);
      if (D6.Chart && D6.Chart.removeTradeVisual) {
        try { D6.Chart.removeTradeVisual(trade.id); } catch (e1) { /* ignore */ }
      }

      var payoutAmount = 0;
      var net = 0;
      var status = 'lost';

      if (voided) {
        status = 'void';
        payoutAmount = trade.stake;
        setBal(user, mode, balOf(user, mode) + trade.stake);
        net = 0;
        D6.Store.addTransaction(user, {
          type: 'void',
          amount: trade.stake,
          mode: mode,
          note: 'Égalité — mise rendue ' + C.ASSETS[trade.assetId].short
        });
      } else if (won) {
        status = 'won';
        var payoutPct = payoutPercent(payout);
        var netProfit = D6.roundMoney(trade.stake * (payoutPct / 100));
        payoutAmount = D6.roundMoney(trade.stake + netProfit);
        setBal(user, mode, balOf(user, mode) + payoutAmount);
        net = netProfit;
        user.wins = (user.wins || 0) + 1;
        user.consecutiveWins = (user.consecutiveWins || 0) + 1;
        user.consecutiveLosses = 0;
        user.lastLost = false;
        D6.Store.addTransaction(user, {
          type: 'win',
          amount: payoutAmount,
          mode: mode,
          note: 'Position gagnante ' + C.ASSETS[trade.assetId].short
        });
      } else {
        status = 'lost';
        net = -trade.stake;
        user.consecutiveLosses = (user.consecutiveLosses || 0) + 1;
        user.consecutiveWins = 0;
        user.lastLost = true;
        D6.Store.addTransaction(user, {
          type: 'loss',
          amount: -trade.stake,
          mode: mode,
          note: 'Position expirée ' + C.ASSETS[trade.assetId].short
        });
      }

      trade.status = status;
      trade.closePrice = exitPrice;
      trade.exitPrice = exitPrice;
      // Historique mise pour anti-martingale (trade suivant).
      user.lastBetAmount = trade.stake;
      user.lastStake = trade.stake;

      user.trades = (user.trades || 0) + 1;
      if (mode === 'real') user.realTrades = (user.realTrades || 0) + 1;
      else user.demoTrades = (user.demoTrades || 0) + 1;
      user.recentResults.unshift({ won: won, mode: mode, voided: voided });
      if (user.recentResults.length > 30) user.recentResults.length = 30;

      var position = {
        id: trade.id,
        at: D6.nowIso(),
        clock: D6.clock(),
        assetId: trade.assetId,
        assetName: C.ASSETS[trade.assetId].short,
        side: (trade.ticket && trade.ticket.side) || trade.side,
        stake: (trade.ticket && trade.ticket.stake != null) ? trade.ticket.stake : trade.stake,
        payout: (trade.ticket && trade.ticket.payout != null) ? trade.ticket.payout : trade.payout,
        entryPrice: (trade.ticket && trade.ticket.entryPrice != null) ? trade.ticket.entryPrice : trade.entryPrice,
        duration: (trade.ticket && trade.ticket.duration != null) ? trade.ticket.duration : trade.duration,
        exitPrice: exitPrice,
        closePrice: exitPrice,
        won: won,
        voided: voided,
        status: status,
        net: net,
        mode: mode,
        accountType: mode
      };
      D6.Store.addPosition(user, position);
      trades.splice(idx, 1);
      persistOpen(user);
      if (D6.Supabase && D6.Supabase.saveOrder) {
        D6.Supabase.saveOrder({
          id: trade.id,
          assetId: trade.assetId,
          side: trade.side,
          stake: trade.stake,
          duration: trade.duration,
          mode: mode,
          payout: trade.payout,
          entryPrice: trade.entryPrice,
          exitPrice: exitPrice,
          won: won,
          voided: voided,
          status: status,
          net: net
        }, 'closed');
      }

      try {
        document.dispatchEvent(new CustomEvent('orolado-trade-settled', {
          detail: { isWin: won, voided: voided, payout: payoutAmount, net: net, tradeId: trade.id }
        }));
      } catch (e) { /* ignore */ }

      var closed = publicTrade(trade);
      if (!trades.filter(isLive).length) D6.holdRemote = false;
      return {
        trade: closed,
        position: position,
        won: won,
        voided: voided,
        net: net,
        exitPrice: exitPrice,
        closePrice: exitPrice,
        status: status
      };
    },

    flushSettlements: function (user) {
      if (!user || !trades.length) return [];
      var now = Date.now();
      var ids = [];
      var i;
      for (i = 0; i < trades.length; i++) {
        if (isOpen(trades[i]) && now >= expiryOf(trades[i])) ids.push(trades[i].id);
      }
      var results = [];
      for (i = 0; i < ids.length; i++) {
        var res = api.resolve(user, ids[i]);
        if (res) {
          results.push(res);
          if (typeof api.onSettled === 'function') {
            try { api.onSettled(res); } catch (e) { /* ignore */ }
          }
        }
      }
      return results;
    },

    maxStakeHint: function (user) {
      var probe = stakeCap(user, Number.MAX_SAFE_INTEGER, user && user.mode);
      return probe.cap;
    }
  };

  // Pas d’API publique nextPrice / seed / bougies futures.
  D6.Synth = {};

  D6.Engine = api;
  try {
    Object.defineProperty(D6, 'Engine', { configurable: false, writable: false, value: api });
  } catch (e) { /* ignore */ }
})(window.D6 = window.D6 || {});
