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

  function getClient() {
    if (client) return client;
    if (!enabled()) return null;
    client = window.supabase.createClient(projectUrl(), anonKey(), {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
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
      passwordHash: '',
      recentResults: [],
      positions: (meta && meta.positions) || [],
      transactions: (meta && meta.transactions) || [],
      sessions: [],
      settings: { sound: true, particles: true }
    };
  }

  function orderToPosition(o) {
    return {
      id: o.id,
      at: o.created_at,
      clock: '',
      assetId: o.asset_id,
      assetName: o.asset_id === 'stable' ? 'SCI' : 'V100',
      side: o.side,
      stake: o.stake,
      payout: o.payout,
      entryPrice: o.entry_price,
      exitPrice: o.exit_price,
      duration: o.duration,
      won: !!o.won,
      net: o.net,
      mode: o.mode
    };
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
      await sb.from('vaults').upsert({ user_id: pid, demo: D6.CONFIG.DEMO_START, real: 0 });
      prof = await sb.from('profiles').select('*').eq('id', pid).maybeSingle();
      row = prof.data;
    }
    var vaultRes = await sb.from('vaults').select('demo,real').eq('user_id', pid).maybeSingle();
    var vault = (vaultRes && vaultRes.data) ? { demo: vaultRes.data.demo, real: vaultRes.data.real } : { demo: D6.CONFIG.DEMO_START, real: 0 };
    var ordRes = await sb.from('orders').select('*').eq('user_id', pid).order('created_at', { ascending: false }).limit(40);
    var txRes = await sb.from('transactions').select('*').eq('user_id', pid).order('created_at', { ascending: false }).limit(80);
    var positions = ((ordRes && ordRes.data) || []).filter(function (o) { return o.status === 'closed'; }).map(orderToPosition);
    var transactions = ((txRes && txRes.data) || []).map(function (t) {
      return { id: t.id, at: t.created_at, type: t.type, amount: t.amount, note: t.note || '', mode: t.mode };
    });
    var user = rowToUser(row, { positions: positions, transactions: transactions });
    applySession(user, vault);
    var sess = await sb.auth.getSession();
    if (sess && sess.data && sess.data.session && D6.Api) D6.Api.setToken(sess.data.session.access_token);
    startRealtime(pid);
    return { ok: true, user: D6.Store.getUser(pid), vault: vault };
  }

  var rtChannel = null;
  var pollTimer = 0;

  function applyIncomingVault(vault, profile) {
    var u = D6.Store.current();
    if (!u || !uuidish(u.id) || !vault) return;
    var live = D6.Engine && D6.Engine.liveCount && D6.Engine.liveCount();
    var localReal = D6.Store.realBalance ? D6.Store.realBalance(u) : 0;
    var next = {
      demo: D6.Store.demoBalance(u),
      real: localReal
    };
    if (!(live && u.mode === 'demo')) next.demo = Number(vault.demo);
    if (!(live && u.mode === 'real')) next.real = Number(vault.real);
    if (Number(vault.real) > next.real) next.real = Number(vault.real);
    if (localReal > next.real) next.real = localReal;
    if (profile) {
      if (profile.display_name) u.displayName = profile.display_name;
      if (profile.phone) u.phone = profile.phone;
      if (profile.country_code) u.countryCode = profile.country_code;
    }
    D6.holdPull = true;
    D6.Store.importRemote(u, next);
    D6.holdPull = false;
    if (D6.App && D6.App.onRemoteAccount) D6.App.onRemoteAccount(next);
  }

  function stopRealtime() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = 0;
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: 'id=eq.' + userId }, function (payload) {
        var row = payload.new;
        if (!row) return;
        var u = D6.Store.current();
        applyIncomingVault({
          demo: D6.Store.demoBalance(u),
          real: D6.Store.realBalance ? D6.Store.realBalance(u) : 0
        }, row);
      })
      .subscribe();
    pollTimer = setInterval(function () { pullVault(); }, 12000);
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
      demo: D6.Store.demoBalance(user),
      real: D6.Store.realBalance ? D6.Store.realBalance(user) : 0
    };
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
      updated_at: new Date().toISOString()
    }).then(function () { /* ignore */ });
    sb.from('vaults').upsert({
      user_id: user.id,
      demo: vault.demo,
      real: vault.real,
      updated_at: new Date().toISOString()
    }).then(function () { /* ignore */ });
  }

  D6.Supabase = {
    enabled: enabled,
    client: getClient,

    restore: async function () {
      var sb = getClient();
      if (!sb) {
        if (projectUrl() && !isUsableKey(anonKey())) {
          console.log('OROLADO Supabase : collez la clé anon (eyJ…) dans Project Settings → API, pas l’URL.');
        }
        return { ok: false };
      }
      var sess = await sb.auth.getSession();
      var session = sess && sess.data && sess.data.session;
      if (!session || !session.user) return { ok: false };
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
      var res = await sb.auth.signInWithPassword({ email: email, password: password });
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

    changePassword: async function (next) {
      var sb = getClient();
      if (!sb) return { ok: false };
      var res = await sb.auth.updateUser({ password: next });
      if (res.error) return { ok: false, reason: res.error.message };
      return { ok: true };
    },

    queueSync: queueSync,
    syncNow: syncNow,

    saveOrder: function (order, status) {
      var sb = getClient();
      var user = D6.Store.current();
      if (!sb || !user || !uuidish(user.id) || !order) return;
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
        status: status || 'open'
      }).then(function () { /* ignore */ });
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
