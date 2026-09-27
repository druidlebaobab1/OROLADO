(function (D6) {
  'use strict';

  var client = null;
  var syncTimer = 0;

  function projectUrl() {
    return String((D6.CONFIG && D6.CONFIG.SUPABASE_URL) || '').trim().replace(/\/$/, '');
  }

  function anonKey() {
    var k = String((D6.CONFIG && D6.CONFIG.SUPABASE_ANON_KEY) || '').trim();
    if (!k || /^https?:\/\//i.test(k)) {
      try { k = String(localStorage.getItem('orolado_sb_key') || '').trim(); } catch (e) { k = ''; }
    }
    return k;
  }

  function isUsableKey(k) {
    return !!(k && (k.indexOf('eyJ') === 0 || k.indexOf('sb_') === 0));
  }

  function enabled() {
    return isUsableKey(anonKey()) && !!projectUrl() && !!(window.supabase && window.supabase.createClient);
  }

  function makeAuthStorage() {
    try {
      var probe = '__oro_ls_ok__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch (e) {
      var mem = {};
      function cookieGet(key) {
        try {
          var m = document.cookie.match(new RegExp('(?:^|; )' + key.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
          return m ? decodeURIComponent(m[1]) : null;
        } catch (e2) { return null; }
      }
      function cookieSet(key, val) {
        try {
          document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(val) +
            '; path=/; max-age=31536000; SameSite=Lax';
        } catch (e3) { /* ignore */ }
      }
      function cookieDel(key) {
        try { document.cookie = encodeURIComponent(key) + '=; path=/; max-age=0'; } catch (e4) { /* ignore */ }
      }
      return {
        getItem: function (key) {
          if (Object.prototype.hasOwnProperty.call(mem, key)) return mem[key];
          return cookieGet(key);
        },
        setItem: function (key, value) {
          mem[key] = String(value);
          cookieSet(key, String(value));
        },
        removeItem: function (key) {
          delete mem[key];
          cookieDel(key);
        }
      };
    }
  }

  function getClient() {
    if (client) return client;
    if (!enabled()) return null;
    client = window.supabase.createClient(projectUrl(), anonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: true,
        storage: makeAuthStorage(),
        flowType: 'pkce'
      }
    });
    try { if (client.auth.stopAutoRefresh) client.auth.stopAutoRefresh(); } catch (e) { /* ignore */ }
    client.auth.onAuthStateChange(function (event, session) {
      if (event === 'SIGNED_OUT') return;
      if (session && session.access_token && D6.Api && D6.Api.setToken) {
        var cur = D6.Api.token ? D6.Api.token() : '';
        if (!cur || cur.indexOf('eyJ') === 0) D6.Api.setToken(session.access_token);
      }
    });
    return client;
  }

  function uuidish(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));
  }

  function rowToUser(row, meta) {
    if (!row) return null;
    return {
      id: row.id,
      displayName: row.display_name || (row.email || 'Trader').split('@')[0],
      email: row.email,
      phone: row.phone || '',
      countryCode: row.country_code || '+225',
      role: row.role || 'user',
      createdAt: row.created_at,
      mode: row.mode === 'real' ? 'real' : 'demo',
      assetId: row.asset_id || 'v100',
      duration: row.duration || 10,
      consecutiveWins: row.consecutive_wins || 0,
      consecutiveLosses: row.consecutive_losses || 0,
      trades: row.trades || 0,
      wins: row.wins || 0,
      demoTrades: row.demo_trades || 0,
      realTrades: row.real_trades || 0,
      realStakeVolume: row.real_stake_volume || 0,
      realDepositTotal: row.real_deposit_total || 0,
      totalWageredSinceDeposit: (row.total_wagered_since_deposit != null ? row.total_wagered_since_deposit : null) != null
        ? row.total_wagered_since_deposit
        : (row.real_stake_volume || 0),
      requiredWagering: (row.required_wagering != null ? row.required_wagering : null) != null
        ? row.required_wagering
        : Math.floor((row.real_deposit_total || 0) * 2),
      passwordHash: '',
      recentResults: [],
      positions: (meta && meta.positions) || [],
      transactions: (meta && meta.transactions) || [],
      sessions: [],
      settings: { sound: true, particles: true }
    };
  }

  function orderToPosition(o) {
    var assetMap = { v100: 'VOLATILITY', stable: 'ZUL', v75: 'PYTHON', crash300: 'AZAZEL', apex500: 'ORO 888', horizon50: 'BAAL', goldtrend: 'OROCUS', boomspike: 'VALAC', nexusprime: 'ASMODUS', titanpulse: 'APOCALYPSE', pulseai: 'APOCALYPSE', boom300: 'APOCALYPSE' };
    return {
      id: o.id,
      at: o.created_at,
      clock: '',
      assetId: o.asset_id,
      assetName: assetMap[o.asset_id] || o.asset_id || '—',
      side: o.side,
      stake: o.stake,
      payout: o.payout,
      entryPrice: o.entry_price,
      exitPrice: o.exit_price,
      duration: o.duration,
      won: o.won == null ? (String(o.status || '') === 'won') : !!o.won,
      voided: String(o.status || '') === 'void',
      status: o.status,
      net: o.net,
      mode: o.mode
    };
  }

  function isSettledOrder(o) {
    var st = String((o && o.status) || '').toLowerCase();
    return st === 'closed' || st === 'won' || st === 'lost' || st === 'void';
  }

  function mergePositions(cloudPos, localPos) {
    var map = {};
    (localPos || []).forEach(function (p) { if (p && p.id) map[p.id] = p; });
    (cloudPos || []).forEach(function (p) {
      if (!p || !p.id) return;
      map[p.id] = Object.assign({}, map[p.id] || {}, p);
    });
    return Object.keys(map).map(function (id) { return map[id]; }).sort(function (a, b) {
      return String(b.at || '').localeCompare(String(a.at || ''));
    }).slice(0, 100);
  }

  function applySession(user, vault) {
    var incoming = Number(vault && vault.real);
    var payload = null;
    if (isFinite(incoming) && incoming > 0.009) {
      payload = { real: incoming };
    } else if (vault && Object.prototype.hasOwnProperty.call(vault, 'real')) {
      // Coffre distant à 0 : on importe quand même pour laisser importRemote
      // conserver le solde local / LS (pas d’effacement silencieux).
      payload = { real: isFinite(incoming) ? incoming : 0 };
    }
    D6.Store.importRemote(user, payload, { official: true });
    D6.Store.setSession({ userId: user.id, at: D6.nowIso() });
  }

  async function loadAccount(authUser) {
    var sb = getClient();
    if (!sb || !authUser) return { ok: false };
    var pid = authUser.id;
    var prof = await sb.from('profiles').select('*').eq('id', pid).maybeSingle();
    if (prof.error) return { ok: false, reason: prof.error.message };
    var row = prof.data;
    if (!row) {
      await sb.from('profiles').upsert({
        id: pid,
        email: authUser.email,
        display_name: (authUser.user_metadata && authUser.user_metadata.display_name) || (authUser.email || 'Trader').split('@')[0],
        phone: (authUser.user_metadata && authUser.user_metadata.phone) || '',
        country_code: (authUser.user_metadata && authUser.user_metadata.country_code) || '+225'
      });
      var existingVault = await sb.from('vaults').select('user_id,real').eq('user_id', pid).maybeSingle();
      if (!existingVault.data) {
        await sb.from('vaults').insert({ user_id: pid, demo: D6.CONFIG.DEMO_START });
      }
      prof = await sb.from('profiles').select('*').eq('id', pid).maybeSingle();
      row = prof.data;
    }
    var vaultRes = await sb.from('vaults').select('demo,real').eq('user_id', pid).maybeSingle();
    var startDemo = (D6.CONFIG && D6.CONFIG.DEMO_START) || 1000000;
    var playedDemo = Number(row && row.demo_trades) > 0;
    if (!vaultRes || !vaultRes.data) {
      try { await sb.from('vaults').insert({ user_id: pid, demo: startDemo }); } catch (eIns) { /* ignore */ }
      vaultRes = await sb.from('vaults').select('demo,real').eq('user_id', pid).maybeSingle();
    } else if (!playedDemo && !(Number(vaultRes.data.demo) > 0.009)) {
      try {
        await sb.from('vaults').update({ demo: startDemo, updated_at: new Date().toISOString() }).eq('user_id', pid);
        vaultRes.data.demo = startDemo;
      } catch (eUp) { /* ignore */ }
    }
    var vault = (vaultRes && vaultRes.data)
      ? { demo: vaultRes.data.demo, real: vaultRes.data.real }
      : { demo: startDemo, real: 0 };
    var localUser = D6.Store.current && D6.Store.current();
    var ordRes = await sb.from('orders').select('*').eq('user_id', pid).order('created_at', { ascending: false }).limit(100);
    var txRes = await sb.from('transactions').select('*').eq('user_id', pid).order('created_at', { ascending: false }).limit(80);
    var cloudPositions = ((ordRes && ordRes.data) || []).filter(isSettledOrder).map(orderToPosition);
    var localPositions = (localUser && localUser.id === pid && localUser.positions) ? localUser.positions : [];
    var positions = mergePositions(cloudPositions, localPositions);
    var transactions = ((txRes && txRes.data) || []).map(function (t) {
      return { id: t.id, at: t.created_at, type: t.type, amount: t.amount, note: t.note || '', mode: t.mode };
    });
    var user = rowToUser(row, { positions: positions, transactions: transactions });
    var role = String((row && row.role) || (user && user.role) || '').toLowerCase();
    if (role === 'suspended' || role === 'banned') {
      try { await sb.auth.signOut({ scope: 'local' }); } catch (eBan) { /* ignore */ }
      return {
        ok: false,
        banned: true,
        reason: 'Votre compte a été suspendu pour non-respect des règles d’utilisation. Si vous pensez qu’il s’agit d’une erreur, contactez le support Orolado.'
      };
    }
    applySession(user, vault);
    try {
      var live = D6.Store.getUser(pid) || D6.Store.current();
      if (live && D6.Auth && D6.Auth.seedFreshDemo) D6.Auth.seedFreshDemo(live);
      else if (live && D6.Store.setBalanceMode && !playedDemo) {
        var dNow = Number(D6.Store.demoBalance(live) || 0);
        if (!(dNow > 0.009)) D6.Store.setBalanceMode(live, 'demo', startDemo);
      }
    } catch (eDemo) { /* ignore */ }
    var sess = await sb.auth.getSession();
    if (sess && sess.data && sess.data.session && D6.Api) D6.Api.setToken(sess.data.session.access_token);
    startRealtime(pid);
    pingPresence();
    return { ok: true, user: D6.Store.getUser(pid), vault: vault };
  }

  var rtChannel = null;
  var pollTimer = 0;
  var presenceTimer = 0;

  function pingPresence() {
    var sb = getClient();
    var user = D6.Store.current();
    if (!sb || !user || !uuidish(user.id)) return;
    sb.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then(function () { /* ignore */ });
  }

  function startPresencePing() {
    if (presenceTimer) clearInterval(presenceTimer);
    pingPresence();
    presenceTimer = setInterval(pingPresence, 30000);
  }

  async function countOnline() {
    var sb = getClient();
    if (!sb) return 0;
    // RPC security definer : compte tous les last_seen (RLS profiles_own ne suffit pas).
    try {
      var rpc = await sb.rpc('count_online', { p_seconds: 90 });
      if (!rpc.error && rpc.data != null) return Number(rpc.data) || 0;
    } catch (e0) { /* fallback ci-dessous */ }
    var since = new Date(Date.now() - 90000).toISOString();
    var res = await sb.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen', since);
    if (res && typeof res.count === 'number') return res.count;
    return 0;
  }

  async function listOnline() {
    var sb = getClient();
    if (!sb) return [];
    try {
      var rpc = await sb.rpc('list_online', { p_seconds: 90 });
      if (!rpc.error && Array.isArray(rpc.data)) {
        return rpc.data.map(function (r) {
          return {
            id: r.uid || r.id,
            display_name: r.uname || r.display_name || '',
            phone: r.uphone || r.phone || '',
            last_seen: r.seen_at || r.last_seen || null
          };
        });
      }
    } catch (e0) { /* ignore */ }
    return [];
  }

  function applyIncomingVault(vault, profile) {
    var u = D6.Store.current();
    if (!u || !uuidish(u.id)) return;
    if (profile) {
      if (profile.display_name) u.displayName = profile.display_name;
      if (profile.phone) u.phone = profile.phone;
      if (profile.country_code) u.countryCode = profile.country_code;
    }
    var next = {};
    if (vault && !D6.holdRemote) {
      var remoteReal = Number(vault.real);
      var localReal = 0;
      try {
        localReal = D6.Store.realBalance ? Number(D6.Store.realBalance(u)) || 0 : 0;
      } catch (eR) { localReal = 0; }
      var locks = D6.App && D6.App.getBalanceLocks ? D6.App.getBalanceLocks() : null;
      var locked = locks && Date.now() < locks.until;
      var remDep = Number(profile && (profile.real_deposit_total != null ? profile.real_deposit_total : profile.realDepositTotal)) || 0;
      var locDep = Number(u.realDepositTotal) || 0;
      var newDep = remDep > locDep + 0.009;
      if (newDep) u.realDepositTotal = remDep;
      if (D6.correctStakeReserve) remoteReal = D6.correctStakeReserve(remoteReal);
      if (isFinite(remoteReal) && remoteReal >= 0) {
        var reserve = D6.stakeReserve;
        var openStake = 0;
        try {
          if (D6.Engine && D6.Engine.openLiveStakeSum) openStake = Number(D6.Engine.openLiveStakeSum('real')) || 0;
          else {
            var list = (D6.Engine && D6.Engine.getTrades) ? D6.Engine.getTrades('real') : [];
            var i;
            for (i = 0; i < list.length; i++) openStake += Number(list[i] && list[i].stake) || 0;
          }
        } catch (eOpen) { openStake = 0; }
        var frozen = false;
        try { frozen = !!(D6.App && D6.App.tradeBalanceFrozen && D6.App.tradeBalanceFrozen()); } catch (eFz) { frozen = false; }
        var tradeBusy = openStake > 0.009
          || frozen
          || (reserve && Date.now() < reserve.until)
          || (locked && !newDep);
        var stalePreStake = reserve && Date.now() < reserve.until && remoteReal > localReal + 0.009
          && Math.abs(remoteReal - (localReal + Number(reserve.stake) || 0)) <= 0.09;
        var staleZero = remoteReal <= 0.009 && localReal > 0.009;
        var fixingDouble = reserve && Date.now() < reserve.until && Math.abs(remoteReal - reserve.once) <= 0.05;
        if (staleZero) {
          /* Un coffre à 0 ne remplace pas un solde déjà affiché. */
        } else if (newDep && remoteReal > localReal + 0.009) next.real = remoteReal;
        else if (fixingDouble) next.real = remoteReal;
        else if (tradeBusy && !newDep) {
          /* Pendant un trade : ne pas faire clignoter le solde via realtime. */
        } else if (!stalePreStake && !(locked && remoteReal + 0.02 < localReal)) next.real = remoteReal;
      }
    }
    D6.holdPull = true;
    if (Object.prototype.hasOwnProperty.call(next, 'real') && D6.Store.setBalanceMode) {
      D6.Store.setBalanceMode(u, 'real', next.real);
    }
    D6.holdPull = false;
    if (D6.App && D6.App.onRemoteAccount) D6.App.onRemoteAccount(next);
  }

  function stopRealtime() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = 0;
    }
    if (presenceTimer) {
      clearInterval(presenceTimer);
      presenceTimer = 0;
    }
    if (rtChannel && client) {
      try { client.removeChannel(rtChannel); } catch (e) { /* ignore */ }
    }
    rtChannel = null;
  }

  function startRealtime(userId) {
    var sb = getClient();
    if (!sb || !userId || !uuidish(userId)) return;
    stopRealtime();
    rtChannel = sb.channel('oro-live-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vaults', filter: 'user_id=eq.' + userId }, function (payload) {
        var row = payload.new;
        if (row) applyIncomingVault({ demo: row.demo, real: row.real });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits', filter: 'user_id=eq.' + userId }, function (payload) {
        var row = payload.new;
        if (row && String(row.status || '').toUpperCase() === 'COMPLETED') {
          pullVault();
          try {
            document.dispatchEvent(new CustomEvent('orolado-deposit-completed', {
              detail: { ref: row.reference || row.id, amount: Number(row.amount) || 0, status: 'COMPLETED' }
            }));
          } catch (e) { /* ignore */ }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: 'id=eq.' + userId }, function (payload) {
        var row = payload.new;
        if (!row) return;
        var remDep = Number(row.real_deposit_total) || 0;
        var locDep = 0;
        try {
          var cu = D6.Store.current();
          locDep = Number(cu && cu.realDepositTotal) || 0;
        } catch (eD) { locDep = 0; }
        applyIncomingVault(null, row);
        if (remDep > locDep + 0.009) pullVault();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'user_id=eq.' + userId }, function (payload) {
        var row = payload.new;
        if (!row) return;
        mergeCloudOrder(row);
      })
      .subscribe();
    pollTimer = setInterval(function () { pullVault(); }, 12000);
    startPresencePing();
  }

  function mergeCloudOrder(row) {
    var u = D6.Store.current();
    if (!u || !row) return;
    if (isSettledOrder(row) && D6.Store.addPosition) {
      D6.Store.addPosition(u, orderToPosition(row));
      if (D6.App && D6.App.onRemoteAccount) D6.App.onRemoteAccount();
      return;
    }
    if (String(row.status || '') !== 'open') return;
    u.openTrades = u.openTrades || [];
    var i;
    for (i = 0; i < u.openTrades.length; i++) {
      if (u.openTrades[i] && u.openTrades[i].id === row.id) return;
    }
    var opened = Date.parse(row.created_at) || Date.now();
    var dur = Number(row.duration) || 10;
    u.openTrades.push({
      id: row.id,
      assetId: row.asset_id,
      side: row.side === 'put' ? 'put' : 'call',
      stake: Number(row.stake) || 0,
      payout: Number(row.payout) || 1.88,
      entryPrice: Number(row.entry_price) || 0,
      duration: dur,
      startTime: opened,
      startedAt: opened,
      expiryTime: opened + dur * 1000,
      expiresAt: opened + dur * 1000,
      mode: row.mode === 'real' ? 'real' : 'demo',
      status: 'open',
      settled: false
    });
    D6.Store.saveUser(u);
    if (D6.Engine && D6.Engine.restoreOpen) D6.Engine.restoreOpen(u);
  }

  async function pullVault() {
    var sb = getClient();
    var user = D6.Store.current();
    if (!sb || !user || !uuidish(user.id) || D6.holdPull) return null;
    var vaultRes = await sb.from('vaults').select('demo,real').eq('user_id', user.id).maybeSingle();
    var profRes = await sb.from('profiles').select('display_name,phone,country_code,mode,real_deposit_total').eq('id', user.id).maybeSingle();
    var ordRes = await sb.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(80);
    if (ordRes && Array.isArray(ordRes.data)) {
      var cloudPositions = ordRes.data.filter(isSettledOrder).map(orderToPosition);
      if (cloudPositions.length) {
        user.positions = mergePositions(cloudPositions, user.positions || []);
        D6.Store.saveUser(user);
      }
      ordRes.data.forEach(function (row) {
        if (row && String(row.status || '') === 'open') mergeCloudOrder(row);
      });
    }
    if (vaultRes && vaultRes.data) {
      applyIncomingVault(vaultRes.data, profRes && profRes.data);
      return vaultRes.data;
    }
    return null;
  }

  function queueSync() {
    if (D6.holdPull) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      syncTimer = 0;
      syncNow();
    }, 450);
  }

  function syncNow() {
    if (D6.holdPull) return;
    var sb = getClient();
    var user = D6.Store.current();
    if (!sb || !user || !uuidish(user.id)) return;
    var vault = {
      demo: D6.Store.demoBalance(user)
    };
    if (!(isFinite(vault.demo) && vault.demo > 0)) return;
    sb.from('profiles').upsert({
      id: user.id,
      display_name: user.displayName || '',
      email: user.email,
      phone: user.phone || '',
      country_code: user.countryCode || '+225',
      // Rôle et compteurs d'argent : écrits par le serveur seul (plus par le téléphone).
      mode: user.mode === 'real' ? 'real' : 'demo',
      asset_id: user.assetId || 'v100',
      duration: user.duration || 10,
      updated_at: new Date().toISOString()
    }).then(function () { /* ignore */ });
    sb.from('vaults').update({
      demo: vault.demo,
      updated_at: new Date().toISOString()
    }).eq('user_id', user.id).then(function () { /* ignore */ });
  }

  D6.Supabase = {
    enabled: enabled,
    client: getClient,

    restore: async function () {
      var localTok = (D6.Api && D6.Api.token && D6.Api.token()) || '';
      var localUser = D6.Store.current && D6.Store.current();
      var localIsAccount = !!(localUser && !localUser.guest && String(localUser.email || '').indexOf('@orolado.local') < 0);
      var phpToken = localTok && localTok.indexOf('eyJ') !== 0;
      var sb = getClient();
      if (!sb) {
        if (projectUrl() && !isUsableKey(anonKey())) {
          console.log('OROLADO Supabase : collez la clé anon (eyJ…) dans Project Settings → API, pas l’URL.');
        }
        return localIsAccount ? { ok: true, user: localUser, local: true } : { ok: false };
      }
      var sess = await sb.auth.getSession();
      var session = sess && sess.data && sess.data.session;
      if (!session || !session.user) {
        return localIsAccount ? { ok: true, user: localUser, local: true } : { ok: false };
      }
      if (phpToken && localIsAccount && localUser.id !== session.user.id) {
        return { ok: true, user: localUser, local: true };
      }
      return loadAccount(session.user);
    },

    register: async function (opts) {
      var sb = getClient();
      if (!sb) return { ok: false, reason: 'Supabase non configuré (clé anon manquante)' };
      var res = await sb.auth.signUp({
        email: opts.email,
        password: opts.password,
        options: {
          data: {
            display_name: opts.displayName,
            phone: opts.phone || '',
            country_code: opts.countryCode || '+225'
          }
        }
      });
      if (res.error) return { ok: false, reason: res.error.message, field: 'regEmail' };
      if (!res.data || !res.data.session) {
        return { ok: false, reason: 'Compte créé. Désactivez « Confirm email » dans Supabase Auth, ou confirmez le mail.' };
      }
      return loadAccount(res.data.user);
    },

    login: async function (email, password) {
      var sb = getClient();
      if (!sb) return { ok: false, reason: 'Supabase non configuré (clé anon manquante)' };
      email = String(email || '').trim().toLowerCase();
      password = String(password || '').trim();
      function clearStaleLocalSession() {
        try { return sb.auth.signOut({ scope: 'local' }); } catch (e0) { return Promise.resolve(); }
      }
      function scrubAuthStorage() {
        try {
          var keys = [];
          var i;
          for (i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && (k.indexOf('sb-') === 0 || k.indexOf('supabase.auth') >= 0)) keys.push(k);
          }
          keys.forEach(function (k) { localStorage.removeItem(k); });
        } catch (e1) { /* ignore */ }
      }
      var res = await sb.auth.signInWithPassword({ email: email, password: password });
      if (res.error) {
        // Échec (souvent Chrome normal + vieux token) : clear puis 1 retry.
        await clearStaleLocalSession();
        scrubAuthStorage();
        client = null;
        sb = getClient();
        if (!sb) return { ok: false, reason: res.error.message === 'Invalid login credentials' ? 'Mot de passe incorrect' : res.error.message, field: 'loginPass' };
        res = await sb.auth.signInWithPassword({ email: email, password: password });
      }
      if (res.error) {
        var errMsg = String(res.error.message || '');
        if (/banned|user_banned|forbidden/i.test(errMsg)) {
          return {
            ok: false,
            banned: true,
            reason: 'Votre compte a été suspendu pour non-respect des règles d’utilisation. Si vous pensez qu’il s’agit d’une erreur, contactez le support Orolado.',
            field: 'loginPass'
          };
        }
        return { ok: false, reason: errMsg === 'Invalid login credentials' ? 'Mot de passe incorrect' : errMsg, field: 'loginPass' };
      }
      return loadAccount(res.data.user);
    },

    signOut: async function () {
      stopRealtime();
      var sb = getClient();
      if (sb) {
        try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* ignore */ }
      }
      client = null;
    },

    pullVault: pullVault,
    startRealtime: startRealtime,
    stopRealtime: stopRealtime,
    pingPresence: pingPresence,
    countOnline: countOnline,
    listOnline: listOnline,

    changePassword: async function (next) {
      var sb = getClient();
      if (!sb) return { ok: false };
      var res = await sb.auth.updateUser({ password: next });
      if (res.error) return { ok: false, reason: res.error.message };
      return { ok: true };
    },

    queueSync: queueSync,
    syncNow: syncNow,

    listFinance: async function () {
      var sb = getClient();
      var user = D6.Store.current();
      if (!sb || !user || !uuidish(user.id)) return { deposits: [], txs: [], withdrawals: [] };
      var depP = sb.from('deposits').select('id,amount,status,created_at,completed_at,reference,operator').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      var txP = sb.from('transactions').select('id,type,amount,note,created_at,mode').eq('user_id', user.id).in('type', ['deposit', 'withdraw']).order('created_at', { ascending: false }).limit(20);
      var wdP = sb.from('withdrawals').select('id,amount,status,created_at,reference,operator').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      var settled = await Promise.all([
        depP.then(function (r) { return r; }).catch(function () { return { data: [] }; }),
        txP.then(function (r) { return r; }).catch(function () { return { data: [] }; }),
        wdP.then(function (r) { return r; }).catch(function () { return { data: [] }; })
      ]);
      function hideSilent(row) {
        if (!row) return false;
        var st = String(row.status || row.note || '').toLowerCase();
        return st === 'silenced' || st === 'silent' || st === 'hidden' || st === 'deleted';
      }
      return {
        deposits: ((settled[0] && settled[0].data) || []).filter(function (d) {
          if (hideSilent(d)) return false;
          var st = String((d && d.status) || '').toUpperCase();
          return st === 'COMPLETED' || st === 'PAID' || st === 'SUCCESS' || st === 'APPROVED';
        }),
        txs: ((settled[1] && settled[1].data) || []).filter(function (t) { return !hideSilent(t); }),
        withdrawals: ((settled[2] && settled[2].data) || []).filter(function (w) { return !hideSilent(w); })
      };
    },

    pollDeposit: async function (ref) {
      var sb = getClient();
      var user = D6.Store.current();
      if (!sb || !user || !uuidish(user.id) || !ref) return null;
      var row = null;
      var byRef = await sb.from('deposits').select('id,amount,status,reference').eq('user_id', user.id).eq('reference', ref).maybeSingle();
      if (byRef && byRef.data) row = byRef.data;
      if (!row) {
        var byId = await sb.from('deposits').select('id,amount,status,reference').eq('user_id', user.id).eq('id', ref).maybeSingle();
        if (byId && byId.data) row = byId.data;
      }
      if (!row) return null;
      var st = String(row.status || '').toUpperCase();
      if (st !== 'COMPLETED' && st !== 'PAID') return { paid: false, status: st };
      return { paid: true, ok: true, amount: Number(row.amount) || 0, status: st, ref: row.reference || row.id };
    },

    // Ordres, retraits et opérations sont écrits par le SERVEUR (api.php) : le téléphone n'écrit
    // plus dans ces tables (sinon un tricheur pouvait y créer de faux retraits « en attente »).
    saveOrder: function () { /* serveur */ },
    saveWithdrawal: function () { /* serveur */ },
    saveTransaction: function () { /* serveur */ }
  };
})(window.D6 = window.D6 || {});
