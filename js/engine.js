/* ==========================================================================
   OROLADO — MOTEUR JEU ÉQUITABLE
   - Les prix viennent du serveur (feed.php) : une seule courbe, la même pour tous,
     fabriquée tick par tick (250 ms) avec un générateur cryptographique.
   - Le navigateur ne décide jamais d'un résultat. Connecté : le serveur règle le trade
     (settleOrder). Invité démo : on lit le prix d'expiration dans le même flux public.
   - Règle unique pour tous (démo, réel, admin) : CALL gagne si le prix final est au-dessus
     de la ligne, PUT s'il est en dessous, pile sur la ligne = mise rendue.
   ========================================================================== */
(function (root) {
  'use strict';

  var D6 = root.D6 = root.D6 || {};
  var C = D6.CONFIG;

  var TICK_MS = 250;
  var TICKS_PER_CANDLE = 4;
  var CANDLE_MS = TICK_MS * TICKS_PER_CANDLE;
  var HISTORY_N = 1320;
  var HIST_TICKS = 5400;
  // Historique de départ, pour les 10 actifs d'un coup : 6 minutes.
  var BOOT_TICKS = 1440;
  // Retard d'affichage court : ce qu'on voit est quasiment le prix serveur actuel, donc le
  // point d'entrée tombe là où le joueur clique. Rafraîchi toutes les 300 ms. 800 ms laisse
  // la marge d'un rafraîchissement + le réseau mobile : la courbe ne s'arrête plus en attendant.
  var DISPLAY_DELAY = 800;
  var POLL_MS = 300;
  var MULTS = [1.88, 5, 10, 50];

  var markets = {};
  var feeds = {};
  var trades = [];
  var payoutLive = {};
  var tradeTimers = {};
  var settling = {};
  var lastOrderAt = 0;
  var wantedAsset = null;
  var pollTimer = 0;

  /* —— Horloge : décalage serveur ↔ téléphone (type NTP, meilleur aller-retour gardé) —— */
  var clock = { offset: 0, rtt: Infinity, ready: false };

  function noteServerTime(serverMs, t0, t1) {
    var s = Number(serverMs);
    if (!isFinite(s) || !(t1 >= t0)) return;
    var rtt = t1 - t0;
    var est = s - (t0 + t1) / 2;
    if (!clock.ready) {
      clock.offset = est;
      clock.rtt = rtt;
      clock.ready = true;
      return;
    }
    if (rtt <= clock.rtt * 1.6 + 30) {
      clock.offset = clock.offset * 0.8 + est * 0.2;
      clock.rtt = Math.min(clock.rtt * 1.02, rtt);
    }
  }

  /** Heure d'affichage (téléphone) d'un tick serveur. */
  function tickToLocal(tick) {
    return tick * TICK_MS - clock.offset + DISPLAY_DELAY;
  }

  /** Heure serveur (ms) → heure d'affichage téléphone. */
  function serverMsToLocal(ms) {
    return Number(ms) - clock.offset + DISPLAY_DELAY;
  }

  function canonAssetId(id) {
    if (id === 'boom300' || id === 'pulseai') return C.ASSETS.titanpulse ? 'titanpulse' : 'v100';
    return C.ASSETS[id] ? id : 'v100';
  }

  function round2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function normalizeOdds(v) {
    var n = Number(v);
    var i;
    for (i = 0; i < MULTS.length; i++) {
      if (Math.abs(MULTS[i] - n) < 0.001) return MULTS[i];
    }
    return 1.88;
  }

  function normalizeTradeSide(side) {
    var s = String(side == null ? '' : side).toLowerCase().trim();
    if (s === 'put' || s === 'sell' || s === 'down' || s === 'short' || s === 'red') return 'put';
    return 'call';
  }

  /* —— Règles publiques : ligne objectif et verdict (copie de feed_lib.php) —— */
  function barrierCents(assetId, duration, side, mult, entryCents) {
    var table = D6.FAIR_TABLE || {};
    var row = table[assetId] && table[assetId][String(duration)];
    if (!row) return entryCents;
    var m = normalizeOdds(mult);
    var idx = 0;
    if (m === 5) idx = 1;
    else if (m === 10) idx = 2;
    else if (m === 50) idx = 3;
    if (idx > 0 && side === 'put') idx += 3;
    var x = entryCents * (1 + Number(row[idx]));
    // Arrondi « au plus loin de zéro », comme PHP round().
    return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
  }

  function verdictOf(side, exitCents, barrier) {
    if (exitCents === barrier) return 'void';
    var won = side === 'put' ? exitCents < barrier : exitCents > barrier;
    return won ? 'won' : 'lost';
  }

  /* —— Flux de prix —— */
  function feedOf(id) {
    if (!feeds[id]) {
      feeds[id] = { first: 0, ticks: [], last: -1, shown: -1, loading: false, loaded: false, busy: false, failAt: 0 };
    }
    return feeds[id];
  }

  function getJson(url) {
    var t0 = Date.now();
    return fetch(url, { cache: 'no-store', credentials: 'same-origin' }).then(function (r) {
      return r.json().then(function (j) {
        var t1 = Date.now();
        if (j && j.serverMs) noteServerTime(j.serverMs, t0, t1);
        return j;
      });
    });
  }

  /*
   * Mémoire de secours : la courbe (6 dernières minutes des 10 actifs) est gardée dans
   * l'onglet quand on le quitte (téléphone verrouillé, autre appli, F5). Au retour, elle
   * s'affiche tout de suite, figée à l'instant du départ, puis passe au direct dès que les
   * nouveaux prix arrivent — jamais de « Connexion au marché » ni de long trait droit.
   */
  var SNAP_KEY = 'oro_feed_snap_v1';
  var SNAP_MAX_AGE = 15 * 60 * 1000;

  function saveSnapshot() {
    try {
      var out = { at: Date.now(), offset: clock.offset, feeds: {} };
      Object.keys(feeds).forEach(function (id) {
        var f = feeds[id];
        if (!f || !f.loaded || !f.ticks.length) return;
        var n = Math.min(f.ticks.length, BOOT_TICKS);
        out.feeds[id] = { first: f.last - n + 1, c: f.ticks.slice(-n) };
      });
      sessionStorage.setItem(SNAP_KEY, JSON.stringify(out));
    } catch (eSnap) { /* stockage plein ou interdit : pas grave */ }
  }

  function restoreSnapshot() {
    try {
      var raw = sessionStorage.getItem(SNAP_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (!s || !s.feeds || !(Date.now() - Number(s.at) < SNAP_MAX_AGE)) return;
      clock.offset = Number(s.offset) || 0;
      Object.keys(s.feeds).forEach(function (id) {
        if (!C.ASSETS[id] || !s.feeds[id] || !Array.isArray(s.feeds[id].c)) return;
        mergeTicks(id, s.feeds[id].first, s.feeds[id].c);
      });
    } catch (eRestore) { /* mémoire illisible : on attend simplement le serveur */ }
  }

  /** Retard d'affichage à appliquer quand les prix ne sont pas encore à jour (retour de veille). */
  function feedLagMs(id) {
    var f = feeds[id];
    if (!f || !f.loaded) return 0;
    var behind = Date.now() - tickToLocal(f.last);
    return behind > 1200 ? behind : 0;
  }

  /** Ajoute une tranche [first..] de ticks au flux d'un actif (historique ou nouveautés). */
  function mergeTicks(id, first, list) {
    var f = feedOf(id);
    first = Number(first);
    if (!Array.isArray(list) || !list.length || !isFinite(first)) return;
    var vals = list.map(Number);
    var end = first + vals.length - 1;
    if (!f.loaded || first > f.last + 1 || end < f.first) {
      // Premier chargement, ou trou (onglet endormi) : on repart de cette tranche.
      f.first = first;
      f.ticks = vals;
      f.last = end;
      f.loaded = true;
      rebuildBuffer(id);
      return;
    }
    if (first < f.first) {
      // Historique plus long reçu (zoom arrière) : on le colle devant.
      var before = vals.slice(0, f.first - first);
      f.ticks = before.concat(f.ticks);
      f.first = first;
      rebuildBuffer(id);
    }
    var i;
    for (i = 0; i < vals.length; i++) {
      var tick = first + i;
      if (tick <= f.last) continue;
      f.ticks.push(vals[i]);
      f.last = tick;
    }
    var extra = f.ticks.length - (HIST_TICKS + 400);
    if (extra > 0) {
      f.ticks.splice(0, extra);
      f.first += extra;
    }
  }

  /** Historique long d'un actif (quand on le regarde), en tâche de fond. */
  function loadHistory(id) {
    var f = feedOf(id);
    if (f.loading || f.full) return;
    if (f.failAt && Date.now() - f.failAt < 2500) return;
    f.loading = true;
    getJson('feed.php?a=' + encodeURIComponent(id) + '&hist=' + HIST_TICKS).then(function (j) {
      f.loading = false;
      if (!j || !j.ok || !Array.isArray(j.c) || !j.c.length) {
        f.failAt = Date.now();
        return;
      }
      f.full = true;
      mergeTicks(id, j.first, j.c);
    }, function () {
      f.loading = false;
      f.failAt = Date.now();
    });
  }

  /** Tranche reçue du serveur → liste de prix (format compressé « p0 + écarts » ou brut). */
  function unpack(a) {
    if (!a) return [];
    if (Array.isArray(a.c)) return a.c;
    if (!Array.isArray(a.d)) return [];
    var out = [Number(a.p0)];
    var v = Number(a.p0);
    var i;
    for (i = 0; i < a.d.length; i++) {
      v += Number(a.d[i]);
      out.push(v);
    }
    return out;
  }

  /**
   * Resynchronisation complète (démarrage, trou après une veille) : une requête pour les
   * 10 actifs, 6 minutes d'historique chacun (ou juste ce qui manque).
   */
  var allBusy = false;
  var allFailAt = 0;
  function pollAll() {
    if (allBusy) return;
    if (allFailAt && Date.now() - allFailAt < 2000) return;
    var ids = Object.keys(C.ASSETS);
    var parts = [];
    var i;
    for (i = 0; i < ids.length; i++) {
      var f = feedOf(ids[i]);
      if (f.loaded) parts.push(ids[i] + '.' + f.last);
    }
    allBusy = true;
    getJson('feed.php?all=1&hist=' + BOOT_TICKS + (parts.length ? '&s=' + parts.join(',') : '')).then(function (j) {
      allBusy = false;
      if (!j || !j.ok || !j.assets) {
        allFailAt = Date.now();
        return;
      }
      Object.keys(j.assets).forEach(function (id) {
        if (!C.ASSETS[id]) return;
        var a = j.assets[id];
        mergeTicks(id, a.first, unpack(a));
      });
    }, function () {
      allBusy = false;
      allFailAt = Date.now();
    });
  }

  /** Applique le « direct partagé ». Retourne false s'il manque des prix (→ resynchro). */
  function applyLive(j) {
    if (!j || !j.ok || !j.assets) return false;
    var complete = true;
    Object.keys(j.assets).forEach(function (id) {
      if (!C.ASSETS[id]) return;
      var a = j.assets[id];
      var f = feedOf(id);
      if (!f.loaded || Number(a.first) > f.last + 1) {
        complete = false;
        return;
      }
      mergeTicks(id, a.first, unpack(a));
    });
    return complete;
  }

  /**
   * Rafraîchissement normal : tout le monde lit le MÊME petit fichier statique
   * (feedcache/live.json, servi sans PHP). S'il date un peu, on demande à PHP de le refaire.
   * Ainsi la charge serveur ne dépend plus du nombre de visiteurs.
   */
  var liveBusy = false;
  function pollLive() {
    if (liveBusy || allBusy) return;
    var ids = Object.keys(C.ASSETS);
    var i;
    for (i = 0; i < ids.length; i++) {
      if (!feedOf(ids[i]).loaded) { pollAll(); return; }
    }
    liveBusy = true;
    var done = function () { liveBusy = false; };
    fetch('feedcache/live.json?t=' + Math.floor(Date.now() / 250), { cache: 'no-store' }).then(function (r) {
      return r.ok ? r.json() : null;
    }).then(function (j) {
      var serverNow = Date.now() + clock.offset;
      var age = j && j.at ? serverNow - Number(j.at) : Infinity;
      if (j && j.ok && !applyLive(j)) {
        // Il manque des prix (retour de veille, connexion lente) : resynchro complète.
        pollAll();
        done();
        return;
      }
      if (age < 200) {
        done();
        return;
      }
      // Fichier un peu ancien : on demande à PHP de le refaire, avec la probabilité « rp »
      // que le serveur calcule selon le nombre de joueurs (seul sur le site : toujours, donc
      // courbe fluide ; 1 000 joueurs : quelques-uns seulement, donc serveur tranquille).
      // Avant : 15 % puis 50 %… → trous d'environ 1 s puis rattrapage en « tic-tic ».
      var rp = j && isFinite(Number(j.rp)) ? Math.max(0.002, Math.min(1, Number(j.rp))) : 1;
      if (age < 1500 && Math.random() > rp) {
        done();
        return;
      }
      return getJson('feed.php?live=1').then(function (j2) {
        if (!applyLive(j2)) pollAll();
        done();
      });
    }).then(done, function () {
      done();
      pollAll();
    });
  }
  function priceAtTick(id, tick) {
    var f = feeds[id];
    if (!f || !f.loaded || tick < f.first || tick > f.last) return NaN;
    return f.ticks[tick - f.first];
  }

  function startPolling() {
    if (pollTimer) return;
    pollAll();
    pollTimer = setInterval(function () {
      if (document.hidden) return;
      pollLive();
      if (wantedAsset && feeds[wantedAsset] && feeds[wantedAsset].loaded) loadHistory(wantedAsset);
    }, POLL_MS);
  }

  /* —— Tampon graphique (même format qu'avant : bougies 1 s) —— */
  function emptyBuffer(asset) {
    var p = Number(asset.basePrice) || 1000;
    return {
      prices: [],
      candles: [],
      price: p,
      forming: { o: p, h: p, l: p, c: p, t: Math.floor(Date.now() / CANDLE_MS) * CANDLE_MS },
      bucket: 0,
      lastMs: Date.now(),
      rev: 1,
      waiting: true
    };
  }

  function bindGlobalBuffers() {
    window.assetBuffers = window.assetBuffers || {};
    window.ASSET_BUFFERS = window.assetBuffers;
    window.assetsHistory = window.assetsHistory || {};
  }

  function publishBuffer(id, buf) {
    bindGlobalBuffers();
    window.assetBuffers[id] = buf;
    window.ASSET_BUFFERS[id] = buf;
    window.assetsHistory[id] = buf.prices;
  }

  function spikeFlag(id, o, c) {
    if (id !== 'boomspike' && id !== 'crash300') return false;
    return Math.abs(c - o) > o * 0.003;
  }

  function candleFromTicks(id, f, k, upTo) {
    var t0 = k * TICKS_PER_CANDLE;
    var o = NaN;
    var h = -Infinity;
    var l = Infinity;
    var c = NaN;
    var t;
    for (t = t0; t < t0 + TICKS_PER_CANDLE && t <= upTo; t++) {
      var v = priceAtTick(id, t);
      if (!(v > 0)) continue;
      var p = v / 100;
      if (!isFinite(o)) {
        // Ouverture = clôture précédente : bougies jointives, comme avant.
        var prev = priceAtTick(id, t0 - 1);
        o = prev > 0 ? prev / 100 : p;
        h = Math.max(h, o);
        l = Math.min(l, o);
      }
      if (p > h) h = p;
      if (p < l) l = p;
      c = p;
    }
    if (!isFinite(o)) return null;
    var spike = spikeFlag(id, o, c);
    return { o: o, h: h, l: l, c: c, t: tickToLocal(t0), _spike: spike, _boom: spike && id === 'boomspike' };
  }

  /** Tick le plus récent qu'on a le droit d'afficher à l'instant `nowMs`. */
  function visibleTick(f, nowMs) {
    var t = Math.floor((nowMs + clock.offset - DISPLAY_DELAY) / TICK_MS);
    if (t > f.last) t = f.last;
    if (t < f.first) t = f.first;
    return t;
  }

  function rebuildBuffer(id) {
    var asset = C.ASSETS[id];
    var f = feeds[id];
    if (!asset || !f || !f.loaded) return;
    var buf = emptyBuffer(asset);
    buf.waiting = false;
    var upTo = visibleTick(f, Date.now());
    var lastK = Math.floor(upTo / TICKS_PER_CANDLE);
    var firstK = Math.max(Math.ceil(f.first / TICKS_PER_CANDLE), lastK - HISTORY_N);
    var k;
    for (k = firstK; k < lastK; k++) {
      var cd = candleFromTicks(id, f, k, upTo);
      if (!cd) continue;
      buf.candles.push(cd);
      buf.prices.push(cd.c);
    }
    var forming = candleFromTicks(id, f, lastK, upTo);
    if (forming) buf.forming = forming;
    buf.price = (priceAtTick(id, upTo) || 0) / 100 || buf.forming.c;
    buf.bucket = lastK;
    buf.lastTick = upTo;
    buf.lastMs = Date.now();
    var old = window.assetBuffers && window.assetBuffers[id];
    buf.rev = ((old && old.rev) || 0) + 1;
    publishBuffer(id, buf);
  }

  /** Avance le tampon jusqu'au tick visible (appelé à chaque image du graphique). */
  function advanceBuffer(id, nowMs) {
    bindGlobalBuffers();
    var asset = C.ASSETS[id];
    var f = feedOf(id);
    var buf = window.assetBuffers[id];
    if (!f.loaded) {
      startPolling();
      if (!buf) {
        buf = emptyBuffer(asset);
        publishBuffer(id, buf);
      }
      return buf;
    }
    if (!buf || buf.waiting || buf.lastTick == null) {
      rebuildBuffer(id);
      return window.assetBuffers[id];
    }
    var upTo = visibleTick(f, nowMs || Date.now());
    if (upTo === buf.lastTick) return buf;
    if (upTo < buf.lastTick || upTo - buf.lastTick > 40) {
      rebuildBuffer(id);
      return window.assetBuffers[id];
    }
    var t;
    for (t = buf.lastTick + 1; t <= upTo; t++) {
      var k = Math.floor(t / TICKS_PER_CANDLE);
      if (k !== buf.bucket) {
        var done = candleFromTicks(id, f, buf.bucket, t - 1);
        if (done) {
          buf.candles.push(done);
          buf.prices.push(done.c);
          if (buf.candles.length > HISTORY_N) buf.candles.shift();
          if (buf.prices.length > HISTORY_N) buf.prices.shift();
        }
        buf.bucket = k;
      }
    }
    var forming = candleFromTicks(id, f, buf.bucket, upTo);
    if (forming) buf.forming = forming;
    var v = priceAtTick(id, upTo);
    if (v > 0) buf.price = v / 100;
    buf.lastTick = upTo;
    buf.lastMs = nowMs || Date.now();
    buf.rev = (buf.rev || 0) + 1;
    publishBuffer(id, buf);
    return buf;
  }

  function publishAssetState(assetId, market) {
    window.assetsState = window.assetsState || {};
    var st = window.assetsState[assetId];
    if (!st) {
      st = { viewMin: 0, viewMax: 0, lockMin: 0, lockMax: 0, lockUntil: 0 };
      window.assetsState[assetId] = st;
    }
    var src = market.candles || [];
    var min = Infinity;
    var max = -Infinity;
    var i;
    for (i = Math.max(0, src.length - 120); i < src.length; i++) {
      if (src[i].l < min) min = src[i].l;
      if (src[i].h > max) max = src[i].h;
    }
    if (!isFinite(min)) {
      min = market.price;
      max = market.price;
    }
    st.candles = src;
    st.min = min;
    st.max = max;
    st.lastPrice = market.price;
    st.at = Date.now();
  }

  function syncMarket(market, id, nowMs) {
    var buf = advanceBuffer(id, nowMs);
    market.price = buf.price;
    market.candle = buf.forming;
    market.ticksInCandle = 0;
    market.waiting = !!buf.waiting;
    if (market.rev !== buf.rev) {
      market.rev = buf.rev;
      market.candles = buf.candles;
      market.history = buf.prices;
      publishAssetState(id, market);
    }
    return market;
  }

  function ensureMarkets() {
    var id;
    for (id in C.ASSETS) {
      if (!C.ASSETS.hasOwnProperty(id) || markets[id]) continue;
      var asset = C.ASSETS[id];
      markets[id] = {
        id: id,
        price: asset.basePrice,
        history: [],
        candles: [],
        candle: { o: asset.basePrice, h: asset.basePrice, l: asset.basePrice, c: asset.basePrice },
        ticksInCandle: 0,
        payout: 1.88,
        waiting: true
      };
    }
  }

  function wakeMarket(assetId) {
    var id = canonAssetId(assetId);
    ensureMarkets();
    wantedAsset = id;
    startPolling();
    return syncMarket(markets[id], id, Date.now());
  }

  /* —— Trades —— */
  function expiryOf(t) {
    return t.expiryTime || t.expiresAt || 0;
  }

  function isLive(t) {
    return t && !t.settled && t.status === 'open' && Date.now() < expiryOf(t);
  }

  function isOpen(t) {
    return t && !t.settled && (t.status === 'open' || !t.status);
  }

  function openForMode(mode) {
    return trades.filter(function (t) { return isOpen(t) && t.mode === mode; });
  }

  function syncTime(t) {
    var left = (expiryOf(t) - Date.now()) / 1000;
    t.timeLeft = left > 0 ? left : 0;
    return t.timeLeft;
  }

  function currentAccountMode() {
    var u = D6.Store && D6.Store.current ? D6.Store.current() : null;
    return u && u.mode === 'real' ? 'real' : 'demo';
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
      barrier: t.barrier,
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
      accountType: t.mode,
      confirmed: !!t.serverConfirmed
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
        barrier: t.barrier,
        entryTick: t.entryTick,
        expiryTick: t.expiryTick,
        duration: t.duration,
        startTime: t.startTime,
        startedAt: t.startedAt,
        expiryTime: expiryOf(t),
        expiresAt: expiryOf(t),
        mode: t.mode,
        guest: !!t.guest,
        status: 'open',
        settled: false,
        serverConfirmed: !!t.serverConfirmed
      };
    });
    D6.Store.saveUser(user);
  }

  function balOf(user, mode) {
    if (D6.Store.balanceMode) return D6.Store.balanceMode(user, mode);
    return D6.Store.balanceOf(user);
  }

  function setBal(user, mode, value) {
    // RÉEL : seul le serveur écrit le solde (placeOrder / settleOrder).
    if (mode === 'real') return;
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
    if (mode === 'real') {
      var openSum = 0;
      openForMode('real').forEach(function (t) {
        if (t && !t.serverConfirmed) openSum += Number(t.stake) || 0;
      });
      balance = Math.max(0, (Number(balance) || 0) - openSum);
    }
    if (stake < C.MIN_STAKE) {
      return { ok: false, cap: C.MIN_STAKE, reason: D6.I18N.t('minStake') + ' ' + D6.fmtFCFA(C.MIN_STAKE) };
    }
    if (stake > balance + 0.0001) {
      return { ok: false, cap: balance, reason: D6.I18N.t('insufficient') };
    }
    return { ok: true, cap: balance };
  }

  function clearTradeTimer(id) {
    if (!id || !tradeTimers[id]) return;
    try { clearTimeout(tradeTimers[id]); } catch (eT) { /* ignore */ }
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
      if (u) api.resolve(u, trade.id);
    }, Math.max(20, wait + 40));
  }

  function removeTrade(user, trade) {
    var idx = trades.indexOf(trade);
    if (idx >= 0) trades.splice(idx, 1);
    clearTradeTimer(trade.id);
    if (D6.Chart && D6.Chart.removeTradeVisual) {
      try { D6.Chart.removeTradeVisual(trade.id); } catch (e0) { /* ignore */ }
    }
    if (!trades.filter(isLive).length) D6.holdRemote = false;
    if (user) persistOpen(user);
  }

  function hasToken() {
    return !!(D6.Api && D6.Api.token && D6.Api.token());
  }

  /** Applique un résultat déjà décidé (serveur, ou flux public pour l'invité démo). */
  function finishTrade(user, trade, verdict, exitPrice, remote) {
    if (trade.settled) return null;
    trade.settled = true;
    var mode = trade.mode === 'real' ? 'real' : 'demo';
    var payout = normalizeOdds(trade.payout);
    var stake = Number(trade.stake) || 0;
    var won = verdict === 'won';
    var voided = verdict === 'void';
    var payoutAmount = voided ? stake : (won ? round2(stake * payout) : 0);
    var net = voided ? 0 : (won ? round2(payoutAmount - stake) : -stake);
    var short = (C.ASSETS[trade.assetId] && C.ASSETS[trade.assetId].short) || trade.assetId;

    if (payoutAmount > 0) setBal(user, mode, balOf(user, mode) + payoutAmount);
    if (voided) {
      D6.Store.addTransaction(user, { type: 'void', amount: stake, mode: mode, note: (D6.I18N && D6.I18N.t ? D6.I18N.t('m_tieNote') : 'Tie — stake returned') + ' ' + short });
    } else if (won) {
      user.wins = (user.wins || 0) + 1;
      user.consecutiveWins = (user.consecutiveWins || 0) + 1;
      user.consecutiveLosses = 0;
      user.lastLost = false;
      D6.Store.addTransaction(user, { type: 'win', amount: payoutAmount, mode: mode, note: 'Position gagnante ' + short });
    } else {
      user.consecutiveLosses = (user.consecutiveLosses || 0) + 1;
      user.consecutiveWins = 0;
      user.lastLost = true;
      D6.Store.addTransaction(user, { type: 'loss', amount: -stake, mode: mode, note: (D6.I18N && D6.I18N.t ? D6.I18N.t('m_expiredNote') : 'Position expired') + ' ' + short });
    }
    var status = voided ? 'void' : (won ? 'won' : 'lost');
    trade.status = status;
    trade.exitPrice = exitPrice;
    user.lastStake = stake;
    user.trades = (user.trades || 0) + 1;
    if (mode === 'real') user.realTrades = (user.realTrades || 0) + 1;
    else user.demoTrades = (user.demoTrades || 0) + 1;
    user.recentResults = Array.isArray(user.recentResults) ? user.recentResults : [];
    user.recentResults.unshift({ won: won, mode: mode, voided: voided, payout: payout });
    if (user.recentResults.length > 30) user.recentResults.length = 30;

    var position = {
      id: trade.id,
      at: D6.nowIso(),
      clock: D6.clock(),
      assetId: trade.assetId,
      assetName: short,
      side: trade.side,
      stake: stake,
      payout: payout,
      entryPrice: trade.entryPrice,
      barrier: trade.barrier,
      duration: trade.duration,
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
    removeTrade(user, trade);
    try {
      document.dispatchEvent(new CustomEvent('orolado-trade-settled', {
        detail: { isWin: won, voided: voided, payout: payoutAmount, net: net, tradeId: trade.id }
      }));
    } catch (e) { /* ignore */ }
    var res = {
      trade: publicTrade(trade),
      position: position,
      won: won,
      voided: voided,
      net: net,
      exitPrice: exitPrice,
      closePrice: exitPrice,
      status: status,
      remote: remote || null
    };
    if (typeof api.onSettled === 'function') {
      try { api.onSettled(res); } catch (eS) { /* ignore */ }
    }
    return res;
  }

  /** Invité démo : le résultat se lit dans le flux public, au tick d'expiration. */
  function settleGuest(user, trade, tries) {
    var local = priceAtTick(trade.assetId, trade.expiryTick);
    function apply(cents) {
      if (!(cents > 0)) {
        finishTrade(user, trade, 'void', trade.entryPrice, null);
        return;
      }
      finishTrade(user, trade, verdictOf(trade.side, cents, trade.barrierCents), cents / 100, null);
    }
    if (local > 0) {
      apply(local);
      return;
    }
    getJson('feed.php?a=' + encodeURIComponent(trade.assetId) + '&at=' + trade.expiryTick).then(function (j) {
      if (j && j.ok && j.pending) {
        if (tries > 20) { apply(0); return; }
        setTimeout(function () { settleGuest(user, trade, tries + 1); }, 300);
        return;
      }
      apply(j && j.ok ? Number(j.c) : 0);
    }, function () {
      if (tries > 20) { apply(0); return; }
      setTimeout(function () { settleGuest(user, trade, tries + 1); }, 800);
    }).then(function () { delete settling[trade.id]; }, function () { delete settling[trade.id]; });
  }

  /** Compte connecté (démo ou réel) : seul le serveur règle. */
  function settleRemote(user, trade, tries) {
    D6.Api.post('settleOrder', { orderId: trade.id, mode: trade.mode }, 20000).then(function (remote) {
      delete settling[trade.id];
      if (remote && remote.ok && remote.order) {
        var o = remote.order;
        var verdict = o.status === 'won' || o.status === 'lost' || o.status === 'void' ? o.status : (o.won ? 'won' : 'lost');
        if (o.barrier != null) trade.barrier = Number(o.barrier);
        finishTrade(user, trade, verdict, o.exitPrice != null ? Number(o.exitPrice) : null, remote);
        return;
      }
      if (remote && remote.ok === false && !remote.pending && /introuvable/i.test(String(remote.reason || ''))) {
        // Ordre refusé/jamais enregistré : aucune mise n'a été prise côté serveur.
        if (!trade.serverConfirmed && trade.mode !== 'real') setBal(user, trade.mode, balOf(user, trade.mode) + (Number(trade.stake) || 0));
        trade.settled = true;
        removeTrade(user, trade);
        return;
      }
      var wait = remote && remote.retryMs ? Math.min(5000, Math.max(250, Number(remote.retryMs))) : 1200;
      if (tries < 40) {
        setTimeout(function () { api.resolve(user, trade.id, tries + 1); }, wait);
      }
    }, function () {
      delete settling[trade.id];
      if (tries < 40) setTimeout(function () { api.resolve(user, trade.id, tries + 1); }, 1500);
    });
  }

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
      wakeMarket(id);
      return window.ASSET_BUFFERS[id] || null;
    },

    preloadAll: function () {
      ensureMarkets();
    },

    /** Retard à appliquer à l'axe du temps (courbe figée proprement en attendant le direct). */
    lagMs: function (id) {
      return feedLagMs(canonAssetId(id));
    },

    /** Prix affiché (dernier tick visible). */
    lastPrice: function (id) {
      var m = markets[canonAssetId(id)];
      return m ? m.price : NaN;
    },

    /** Ligne objectif prévue pour un futur trade (aperçu avant de cliquer). */
    previewBarrier: function (assetId, duration, side, mult, price) {
      var id = canonAssetId(assetId);
      var cents = Math.round(Number(price) * 100);
      if (!(cents > 0)) return NaN;
      return barrierCents(id, Number(duration), normalizeTradeSide(side), mult, cents) / 100;
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

    openStakeSum: function (mode) {
      mode = mode === 'real' ? 'real' : 'demo';
      var sum = 0;
      openForMode(mode).forEach(function (t) {
        if (mode === 'real' && t && t.serverConfirmed) return;
        sum += Number(t && t.stake) || 0;
      });
      return round2(sum);
    },

    openLiveStakeSum: function (mode) {
      mode = mode === 'real' ? 'real' : 'demo';
      var sum = 0;
      openForMode(mode).forEach(function (t) { sum += Number(t && t.stake) || 0; });
      return round2(sum);
    },

    /**
     * Réponse placeOrder du serveur : il fixe le vrai prix d'entrée, la ligne et l'heure
     * d'expiration. Le trade local s'aligne dessus.
     */
    confirmTrade: function (tradeId, order) {
      var i;
      for (i = 0; i < trades.length; i++) {
        var t = trades[i];
        if (!t || t.id !== tradeId) continue;
        t.serverConfirmed = true;
        if (order) {
          if (order.entryPrice != null) t.entryPrice = Number(order.entryPrice);
          if (order.barrier != null) t.barrier = Number(order.barrier);
          if (order.entryTick != null) t.entryTick = Number(order.entryTick);
          if (order.expiryTick != null) {
            t.expiryTick = Number(order.expiryTick);
            t.expiryTime = tickToLocal(t.expiryTick);
            t.expiresAt = t.expiryTime;
          }
          if (order.entryTick != null) {
            t.startTime = tickToLocal(t.entryTick);
            t.startedAt = t.startTime;
          }
          armTradeTimer(t);
          if (D6.Chart && D6.Chart.applyOpenTradeVisual && (t.mode === currentAccountMode())) {
            try {
              D6.Chart.applyOpenTradeVisual(publicTrade(t));
            } catch (eV) { /* ignore */ }
          }
          var u = D6.Store && D6.Store.current ? D6.Store.current() : null;
          if (u) persistOpen(u);
        }
        return true;
      }
      return false;
    },

    markTradeFunded: function (tradeId) {
      return api.confirmTrade(tradeId, null);
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
        if (!live || !live.id || live.settled) continue;
        if (live.userId && live.userId !== user.id) continue;
        kept.push(live);
        have[live.id] = true;
      }
      trades = kept;
      var list = user.openTrades || [];
      for (i = 0; i < list.length; i++) {
        var raw = list[i];
        if (!raw || !raw.id || have[raw.id]) continue;
        if (raw.settled || raw.status === 'won' || raw.status === 'lost' || raw.status === 'void') continue;
        var expTick = raw.expiryTick != null ? Number(raw.expiryTick) : null;
        var entryTick = raw.entryTick != null ? Number(raw.entryTick) : null;
        var t = {
          id: raw.id,
          assetId: canonAssetId(raw.assetId),
          side: raw.side === 'put' ? 'put' : 'call',
          stake: round2(Number(raw.stake) || 0),
          duration: raw.duration || 10,
          timeLeft: 0,
          entryPrice: Number(raw.entryPrice) || 0,
          barrier: raw.barrier != null ? Number(raw.barrier) : Number(raw.entryPrice) || 0,
          barrierCents: Math.round((raw.barrier != null ? Number(raw.barrier) : Number(raw.entryPrice) || 0) * 100),
          payout: normalizeOdds(raw.payout),
          entryTick: entryTick,
          expiryTick: expTick,
          startTime: entryTick != null ? tickToLocal(entryTick) : (raw.startTime || raw.startedAt || Date.now()),
          startedAt: entryTick != null ? tickToLocal(entryTick) : (raw.startedAt || raw.startTime || Date.now()),
          expiryTime: expTick != null ? tickToLocal(expTick) : (raw.expiryTime || raw.expiresAt || raw.expiryAt),
          expiresAt: expTick != null ? tickToLocal(expTick) : (raw.expiresAt || raw.expiryTime || raw.expiryAt),
          mode: raw.mode === 'real' ? 'real' : 'demo',
          userId: user.id,
          guest: !!raw.guest,
          settled: false,
          status: 'open',
          serverConfirmed: raw.serverConfirmed !== false
        };
        trades.push(t);
        have[raw.id] = true;
      }
      for (i = 0; i < trades.length; i++) {
        armTradeTimer(trades[i]);
        if (D6.Chart && D6.Chart.applyOpenTradeVisual && trades[i].mode === currentAccountMode()) {
          try { D6.Chart.applyOpenTradeVisual(publicTrade(trades[i])); } catch (eR) { /* ignore */ }
        }
      }
      return trades.length;
    },

    // Plus de cote « aléatoire » affichée : 88 % partout, pour tout le monde.
    refreshPayout: function (assetId) {
      payoutLive[assetId] = 1.88;
      if (markets[assetId]) markets[assetId].payout = 1.88;
      return 1.88;
    },

    resyncClocks: function () {
      // Retour de veille : on va chercher tout de suite les prix manqués (sans attendre).
      allFailAt = 0;
      pollAll();
      var id;
      for (id in feeds) {
        if (feeds.hasOwnProperty(id) && feeds[id].loaded) rebuildBuffer(id);
      }
    },

    tick: function () {
      var i;
      for (i = 0; i < trades.length; i++) syncTime(trades[i]);
      var user = D6.Store && D6.Store.current ? D6.Store.current() : null;
      if (user) api.flushSettlements(user);
    },

    placeOrder: function (user, opts) {
      if (!user || !D6.Store.current() || D6.Store.current().id !== user.id) {
        return { ok: false, reason: D6.I18N.t('sessionExpiredMsg') };
      }
      var mode = user.mode === 'real' ? 'real' : 'demo';
      var nowPerf = performance.now();
      if (nowPerf - lastOrderAt < 350) return { ok: false, reason: D6.I18N.t('antibot') };

      var stake = round2(Number(opts.stake) || 0);
      var duration = C.DURATIONS.indexOf(Number(opts.duration)) >= 0 ? Number(opts.duration) : C.DEFAULT_DURATION;
      var assetId = canonAssetId(opts.assetId);
      var side = normalizeTradeSide(opts.side);
      var payout = normalizeOdds(opts.payout != null ? opts.payout : opts.odds);
      var gate = stakeCap(user, stake, mode);
      if (!gate.ok) return gate;

      var market = wakeMarket(assetId);
      var f = feedOf(assetId);
      if (!f.loaded || market.waiting) return { ok: false, reason: (D6.I18N && D6.I18N.t ? D6.I18N.t('m_connecting') : 'Connecting to the market…') };

      // Entrée affichée tout de suite = tick visible ; le serveur confirme le vrai prix.
      var entryTick = visibleTick(f, Date.now());
      var entryCents = priceAtTick(assetId, entryTick);
      if (!(entryCents > 0)) return { ok: false, reason: (D6.I18N && D6.I18N.t ? D6.I18N.t('m_connecting') : 'Connecting to the market…') };
      var expiryTick = entryTick + Math.round(duration * 1000 / TICK_MS);
      var bar = barrierCents(assetId, duration, side, payout, entryCents);
      var guest = !hasToken();

      lastOrderAt = nowPerf;
      D6.holdRemote = true;
      setBal(user, mode, balOf(user, mode) - stake);
      D6.Store.addTransaction(user, {
        type: 'stake',
        amount: -stake,
        mode: mode,
        note: (side === 'call' ? 'CALL' : 'PUT') + ' ' + C.ASSETS[assetId].short
      });

      var t = {
        id: D6.uid(),
        assetId: assetId,
        side: side,
        stake: stake,
        duration: duration,
        timeLeft: duration,
        entryPrice: entryCents / 100,
        barrier: bar / 100,
        barrierCents: bar,
        payout: payout,
        entryTick: entryTick,
        expiryTick: expiryTick,
        startTime: tickToLocal(entryTick),
        startedAt: tickToLocal(entryTick),
        expiryTime: tickToLocal(expiryTick),
        expiresAt: tickToLocal(expiryTick),
        mode: mode,
        userId: user.id,
        guest: guest,
        settled: false,
        status: 'open',
        // Démo invité : rien à confirmer. Sinon : attend la réponse placeOrder.
        serverConfirmed: guest
      };
      trades.push(t);
      armTradeTimer(t);
      user.lastStake = stake;
      persistOpen(user);
      if (D6.Chart && D6.Chart.captureTradeFrame) {
        try { D6.Chart.captureTradeFrame(assetId, t.expiryTime + 1000); } catch (eF) { /* ignore */ }
      }
      var pub = publicTrade(t);
      if (D6.Chart && D6.Chart.applyOpenTradeVisual) {
        try { D6.Chart.applyOpenTradeVisual(pub); } catch (eVis) { /* ignore */ }
      }
      return { ok: true, trade: pub };
    },

    /** Annule un trade que le serveur a refusé (aucune mise prise côté serveur). */
    abortOpenTrade: function (user, tradeId) {
      var i;
      for (i = 0; i < trades.length; i++) {
        var trade = trades[i];
        if (!trade || trade.id !== tradeId) continue;
        if (trade.settled) return false;
        trade.settled = true;
        var mode = trade.mode === 'real' ? 'real' : 'demo';
        var stake = round2(Number(trade.stake) || 0);
        removeTrade(user, trade);
        if (mode !== 'real' && user && stake > 0.009) setBal(user, 'demo', balOf(user, 'demo') + stake);
        return true;
      }
      return false;
    },

    /** Lance le règlement d'un trade expiré. Le résultat arrive par onSettled. */
    resolve: function (user, tradeId, tries) {
      if (!user || !trades.length) return null;
      var trade = null;
      var i;
      for (i = 0; i < trades.length; i++) {
        if (trades[i] && trades[i].id === tradeId) { trade = trades[i]; break; }
      }
      if (!trade || trade.settled || settling[trade.id]) return null;
      if (Date.now() < expiryOf(trade)) return null;
      if (trade.userId && trade.userId !== user.id) {
        trade.settled = true;
        removeTrade(user, trade);
        return null;
      }
      // Pas encore confirmé par le serveur : on attend sa réponse (retry automatique).
      if (!trade.guest && !trade.serverConfirmed) {
        if ((tries || 0) < 40) setTimeout(function () { api.resolve(user, tradeId, (tries || 0) + 1); }, 500);
        return null;
      }
      settling[trade.id] = true;
      if (trade.guest || !hasToken()) settleGuest(user, trade, 0);
      else settleRemote(user, trade, tries || 0);
      return null;
    },

    flushSettlements: function (user) {
      if (!user || !trades.length) return [];
      var now = Date.now();
      var ids = [];
      var i;
      for (i = 0; i < trades.length; i++) {
        if (isOpen(trades[i]) && now >= expiryOf(trades[i])) ids.push(trades[i].id);
      }
      for (i = 0; i < ids.length; i++) api.resolve(user, ids[i]);
      return [];
    },

    maxStakeHint: function (user) {
      return stakeCap(user, Number.MAX_SAFE_INTEGER, user && user.mode).cap;
    }
  };

  ensureMarkets();
  Object.keys(C.ASSETS).forEach(function (id) { payoutLive[id] = 1.88; });
  // Courbe gardée en mémoire (F5 / retour) : affichage immédiat, puis le direct.
  restoreSnapshot();
  // Les 10 courbes tournent dès l'ouverture du site : elles sont prêtes avant qu'on les regarde.
  startPolling();
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) saveSnapshot();
    else api.resyncClocks();
  });
  window.addEventListener('pagehide', saveSnapshot);
  window.addEventListener('pageshow', function () { if (!document.hidden) api.resyncClocks(); });
  window.addEventListener('focus', function () { if (!document.hidden) api.resyncClocks(); });
  window.addEventListener('online', function () { api.resyncClocks(); });

  D6.Synth = {};
  D6.Engine = api;
  try {
    Object.defineProperty(D6, 'Engine', { configurable: false, writable: false, value: api });
  } catch (e) { /* ignore */ }
})(typeof window !== 'undefined' ? window : this);
