(function (D6) {
  'use strict';

  var KEY = 'orolado_v1';
  var SALT = 'ORO!lado-vault-v1#xof';
  var LEGACY_SALT = '6D!abl0-vault-v4#xof';
  var vault = {};

  function fnv(str) {
    var h = 2166136261;
    var i;
    for (i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function xorCrypt(str, decode, salt) {
    salt = salt || SALT;
    var src = decode ? atob(str) : str;
    var out = [];
    var i;
    for (i = 0; i < src.length; i++) {
      out.push(String.fromCharCode(src.charCodeAt(i) ^ salt.charCodeAt(i % salt.length)));
    }
    var joined = out.join('');
    return decode ? joined : btoa(joined);
  }

  function decodeWithSalt(raw, salt) {
    try {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.enc) {
        var plain = xorCrypt(parsed.enc, true, salt);
        if (fnv(plain) !== parsed.sum) return null;
        return JSON.parse(plain);
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function blankUser(partial) {
    return {
      id: partial.id,
      displayName: partial.displayName || '',
      email: partial.email,
      phone: partial.phone,
      countryCode: partial.countryCode,
      passwordHash: partial.passwordHash,
      role: partial.role || 'user',
      createdAt: D6.nowIso(),
      demoStartBalance: D6.CONFIG.DEMO_START,
      mode: 'demo',
      assetId: 'v100',
      duration: D6.CONFIG.DEFAULT_DURATION,
      consecutiveLosses: 0,
      consecutiveWins: 0,
      lastStake: 0,
      lastLost: false,
      trades: 0,
      wins: 0,
      demoTrades: 0,
      realTrades: 0,
      realStakeVolume: 0,
      convertPromptShown: false,
      recentResults: [],
      positions: [],
      transactions: [],
      sessions: [],
      settings: { sound: true, particles: true }
    };
  }

  function hydrate(user) {
    if (!user) return null;
    if (!user.displayName) user.displayName = (user.email || 'Trader').split('@')[0];
    if (user.consecutiveWins == null) user.consecutiveWins = 0;
    if (user.demoStartBalance == null) user.demoStartBalance = D6.CONFIG.DEMO_START;
    if (user.convertPromptShown == null) user.convertPromptShown = false;
    if (user.demoTrades == null) user.demoTrades = 0;
    if (user.realTrades == null) user.realTrades = 0;
    if (user.realStakeVolume == null) user.realStakeVolume = 0;
    if (!user.role) user.role = (user.email === 'admin@orolado.com' || user.email === 'admin@6diablo.com') ? 'admin' : 'user';
    if (!vault[user.id]) {
      vault[user.id] = {
        demo: user.demoBalance != null ? user.demoBalance : D6.CONFIG.DEMO_START,
        real: user.realBalance != null ? user.realBalance : D6.CONFIG.REAL_START
      };
    }
    return user;
  }

  function decodePayload(raw) {
    return decodeWithSalt(raw, SALT) || decodeWithSalt(raw, LEGACY_SALT);
  }

  function loadAll() {
    try {
      var raw = localStorage.getItem(KEY) || localStorage.getItem('6diablo_v4');
      if (!raw) {
        var legacy = localStorage.getItem('6diablo_v3') || localStorage.getItem('6diablo_v2');
        if (legacy) {
          var old = JSON.parse(legacy);
          var migrated = { users: old.users || {}, session: old.session || null, withdrawals: [] };
          Object.keys(migrated.users).forEach(function (id) {
            hydrate(migrated.users[id]);
          });
          return migrated;
        }
        return { users: {}, session: null, withdrawals: [] };
      }
      var data = decodePayload(raw);
      if (!data) return { users: {}, session: null, withdrawals: [] };
      vault = data.vault || {};
      return {
        users: data.users || {},
        session: data.session || null,
        withdrawals: data.withdrawals || []
      };
    } catch (e) {
      return { users: {}, session: null, withdrawals: [] };
    }
  }

  var db = loadAll();
  Object.keys(db.users).forEach(function (id) { hydrate(db.users[id]); });

  function persist(skipRemote) {
    var publicUsers = {};
    Object.keys(db.users).forEach(function (id) {
      var copy = Object.assign({}, db.users[id]);
      delete copy.demoBalance;
      delete copy.realBalance;
      publicUsers[id] = copy;
    });
    var payload = JSON.stringify({
      users: publicUsers,
      session: db.session,
      withdrawals: db.withdrawals || [],
      vault: vault
    });
    localStorage.setItem(KEY, JSON.stringify({ enc: xorCrypt(payload, false), sum: fnv(payload) }));
    if (!skipRemote && !D6.holdRemote && D6.Api && D6.Api.token && db.session && db.users[db.session.userId]) {
      var u = db.users[db.session.userId];
      D6.Api.post('upsert', { user: publicUsers[u.id], vault: vault[u.id] });
    }
  }

  D6.Store = {
    importRemote: function (user, vaultEntry) {
      if (!user || !user.id) return;
      db.users[user.id] = hydrate(Object.assign({}, user));
      if (vaultEntry) vault[user.id] = vaultEntry;
      persist(true);
    },

    getSession: function () { return db.session; },
    setSession: function (session) { db.session = session; persist(); },
    clearSession: function () { db.session = null; persist(); },

    getUser: function (id) { return hydrate(db.users[id] || null); },

    findByEmail: function (email) {
      var key = String(email || '').trim().toLowerCase();
      var ids = Object.keys(db.users);
      for (var i = 0; i < ids.length; i++) {
        if (db.users[ids[i]].email === key) return hydrate(db.users[ids[i]]);
      }
      return null;
    },

    findByPhone: function (countryCode, phone) {
      var p = String(phone || '').replace(/\s+/g, '');
      var ids = Object.keys(db.users);
      for (var i = 0; i < ids.length; i++) {
        var u = db.users[ids[i]];
        if (u.countryCode === countryCode && u.phone === p) return hydrate(u);
      }
      return null;
    },

    createUser: function (partial) {
      var user = blankUser(partial);
      db.users[user.id] = user;
      vault[user.id] = { demo: D6.CONFIG.DEMO_START, real: D6.CONFIG.REAL_START };
      persist();
      return user;
    },

    saveUser: function (user) {
      db.users[user.id] = user;
      persist();
    },

    current: function () {
      if (!db.session) return null;
      return hydrate(db.users[db.session.userId] || null);
    },

    balanceOf: function (user) {
      if (!user) return 0;
      var v = vault[user.id] || { demo: 0, real: 0 };
      return user.mode === 'real' ? v.real : v.demo;
    },

    realBalance: function (user) {
      if (!user) return 0;
      return (vault[user.id] || { real: 0 }).real;
    },

    setBalance: function (user, value) {
      if (!user) return;
      var v = vault[user.id] || { demo: D6.CONFIG.DEMO_START, real: 0 };
      var n = Math.max(0, Math.round(Number(value) || 0));
      if (user.mode === 'real') v.real = n;
      else v.demo = n;
      vault[user.id] = v;
      persist();
    },

    adjustReal: function (userId, delta) {
      var user = db.users[userId];
      if (!user) return null;
      var v = vault[userId] || { demo: D6.CONFIG.DEMO_START, real: 0 };
      v.real = Math.max(0, Math.round((v.real || 0) + Number(delta)));
      vault[userId] = v;
      persist();
      return v.real;
    },

    addTransaction: function (user, tx) {
      user.transactions.unshift({
        id: D6.uid(),
        at: D6.nowIso(),
        clock: D6.clock(),
        type: tx.type,
        amount: tx.amount,
        note: tx.note || '',
        mode: tx.mode || user.mode
      });
      if (user.transactions.length > 80) user.transactions.length = 80;
      persist();
    },

    addSession: function (user, action) {
      user.sessions.unshift({
        id: D6.uid(),
        at: D6.nowIso(),
        clock: D6.clock(),
        action: action,
        device: (navigator.userAgent || '').slice(0, 90)
      });
      if (user.sessions.length > 40) user.sessions.length = 40;
      persist();
    },

    addPosition: function (user, pos) {
      user.positions.unshift(pos);
      if (user.positions.length > 40) user.positions.length = 40;
      persist();
    },

    listUsers: function () {
      return Object.keys(db.users).map(function (id) {
        var u = hydrate(db.users[id]);
        var v = vault[id] || { demo: 0, real: 0 };
        return {
          id: u.id,
          displayName: u.displayName,
          email: u.email,
          phone: u.phone,
          countryCode: u.countryCode,
          role: u.role,
          createdAt: u.createdAt,
          realBalance: v.real,
          demoBalance: v.demo,
          realTrades: u.realTrades || 0,
          realStakeVolume: u.realStakeVolume || 0
        };
      });
    },

    requestWithdraw: function (user, amount) {
      amount = Math.round(Number(amount) || 0);
      var real = (vault[user.id] || { real: 0 }).real;
      if (amount < D6.CONFIG.MIN_STAKE) return { ok: false, reason: D6.I18N.t('minStake') };
      if (amount > real) return { ok: false, reason: D6.I18N.t('insufficient') };
      var suspect = (user.realStakeVolume || 0) < amount || (user.realTrades || 0) === 0;
      vault[user.id].real = real - amount;
      db.withdrawals = db.withdrawals || [];
      db.withdrawals.unshift({
        id: D6.uid(),
        userId: user.id,
        name: user.displayName,
        email: user.email,
        amount: amount,
        status: 'pending',
        suspect: suspect,
        at: D6.nowIso(),
        clock: D6.clock()
      });
      D6.Store.addTransaction(user, { type: 'withdraw', amount: -amount, note: 'Retrait demandé', mode: 'real' });
      persist();
      return { ok: true, suspect: suspect };
    },

    listWithdrawals: function () {
      return (db.withdrawals || []).slice();
    },

    resolveWithdraw: function (id, approve) {
      var list = db.withdrawals || [];
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i].id === id && list[i].status === 'pending') {
          list[i].status = approve ? 'approved' : 'rejected';
          if (!approve) {
            var v = vault[list[i].userId];
            if (v) v.real += list[i].amount;
          }
          persist();
          return list[i];
        }
      }
      return null;
    },

    metrics: function () {
      var users = D6.Store.listUsers();
      var deposits = 0;
      var pending = 0;
      var approved = 0;
      Object.keys(db.users).forEach(function (id) {
        (db.users[id].transactions || []).forEach(function (tx) {
          if (tx.type === 'deposit' && (tx.mode === 'real' || !tx.mode)) deposits += tx.amount;
        });
      });
      (db.withdrawals || []).forEach(function (w) {
        if (w.status === 'pending') pending += w.amount;
        if (w.status === 'approved') approved += w.amount;
      });
      return {
        deposits: deposits,
        pending: pending,
        withdrawals: pending + approved,
        profit: deposits - approved,
        users: users.length
      };
    }
  };
})(window.D6 = window.D6 || {});
