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
    var assetMap = { v100: 'V100', stable: 'SCI', v75: 'V75', crash300: 'CRASH', apex500: 'APEX', horizon50: 'H50', goldtrend: 'GOLD', boomspike: 'BOOM', nexusprime: 'NEXUS', titanpulse: 'TITAN', pulseai: 'TITAN', boom300: 'TITAN' };
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
    D6.Store.importRemote(user, vault || { demo: D6.CONFIG.DEMO_START, real: 0 });
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
    var vault = (vaultRes && vaultRes.data) ? { demo: vaultRes.data.demo, real: vaultRes.data.real } : { demo: D6.CONFIG.DEMO_START, real: 0 };
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
    applySession(user, vault);
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
      var locks = D6.App && D6.App.getBalanceLocks ? D6.App.getBalanceLocks() : null;
      var locked = locks && Date.now() < locks.until;
      if (isFinite(remoteReal) && remoteReal >= 0 && (D6.holdDepositReal || !locked)) {
        next.real = remoteReal;
        if (D6.holdDepositReal) {
          var localReal = D6.Store.realBalance ? Number(D6.Store.realBalance(u)) : 0;
          if (isFinite(localReal) && localReal > next.real) next.real = localReal;
        }
      }
    }
    D6.holdPull = true;
    if (Object.prototype.hasOwnProperty.call(next, 'real')) {
      if (next.real > 0) D6.Store.importRemote(u, { real: next.real });
      else if (D6.Store.setBalanceMode) D6.Store.setBalanceMode(u, 'real', 0);
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
        var u = D6.Store.current();
        applyIncomingVault(null, row);
      })
      .subscribe();
    pollTimer = setInterval(function () { pullVault(); }, 12000);
    startPresencePing();
  }

  async function pullVault() {
    var sb = getClient();
    var user = D6.Store.current();
    if (!sb || !user || !uuidish(user.id) || D6.holdPull) return null;
    var vaultRes = await sb.from('vaults').select('demo,real').eq('user_id', user.id).maybeSingle();
    var profRes = await sb.from('profiles').select('display_name,phone,country_code,mode').eq('id', user.id).maybeSingle();
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
      role: user.role || 'user',
      mode: user.mode === 'real' ? 'real' : 'demo',
      asset_id: user.assetId || 'v100',
      duration: user.duration || 10,
      consecutive_wins: user.consecutiveWins || 0,
      consecutive_losses: user.consecutiveLosses || 0,
      trades: user.trades || 0,
      wins: user.wins || 0,
      demo_trades: user.demoTrades || 0,
      real_trades: user.realTrades || 0,
      real_stake_volume: user.realStakeVolume || 0,
      real_deposit_total: user.realDepositTotal || 0,
      updated_at: new Date().toISOString()
    }).then(function () { /* ignore */ });
    sb.from('vaults').upsert({
      user_id: user.id,
      demo: vault.demo,
      updated_at: new Date().toISOString()
    }).then(function () { /* ignore */ });
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
      if (res.error) return { ok: false, reason: res.error.message === 'Invalid login credentials' ? 'Mot de passe incorrect' : res.error.message, field: 'loginPass' };
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
      return {
        deposits: (settled[0] && settled[0].data) || [],
        txs: (settled[1] && settled[1].data) || [],
        withdrawals: (settled[2] && settled[2].data) || []
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

    saveOrder: function (order, status) {
      var sb = getClient();
      var user = D6.Store.current();
      if (!sb || !user || !uuidish(user.id) || !order) return;
      var st = order.status || status || 'open';
      // Persiste won/lost/void (pas seulement "closed") pour l’historique cloud.
      sb.from('orders').upsert({
        id: order.id,
        user_id: user.id,
        asset_id: order.assetId || 'v100',
        side: order.side,
        stake: order.stake,
        duration: order.duration,
        mode: order.mode || user.mode,
        payout: order.payout,
        entry_price: order.entryPrice,
        exit_price: order.exitPrice,
        won: order.won == null ? null : !!order.won,
        net: order.net,
        status: st
      }).then(function () { /* ignore */ });
    },

    saveWithdrawal: function (row) {
      var sb = getClient();
      var user = D6.Store.current();
      if (!sb || !user || !uuidish(user.id) || !row) return;
      sb.from('withdrawals').upsert({
        id: row.id,
        user_id: user.id,
        amount: Math.abs(Number(row.amount) || 0),
        status: row.status || 'pending',
        operator: row.operator || '',
        phone: row.phone || '',
        reference: row.id,
        created_at: row.at || new Date().toISOString()
      }).then(function () { /* ignore */ }).catch(function () { /* table absente */ });
    },

    saveTransaction: function (tx) {
      var sb = getClient();
      var user = D6.Store.current();
      if (!sb || !user || !uuidish(user.id) || !tx) return;
      sb.from('transactions').upsert({
        id: tx.id || D6.uid(),
        user_id: user.id,
        type: tx.type,
        amount: tx.amount,
        note: tx.note || '',
        mode: tx.mode || user.mode,
        created_at: tx.at || new Date().toISOString()
      }).then(function () { /* ignore */ });
    }
  };
})(window.D6 = window.D6 || {});
