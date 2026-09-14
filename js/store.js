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
      publicId: partial.publicId || '',
      displayName: partial.displayName || '',
      email: partial.email,
      phone: partial.phone,
      countryCode: partial.countryCode,
      passwordHash: partial.passwordHash,
      role: partial.role || 'user',
      guest: !!partial.guest,
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
      realDepositTotal: 0,
      totalWageredSinceDeposit: 0,
      requiredWagering: 0,
      convertPromptShown: false,
      recentResults: [],
      positions: [],
      openTrades: [],
      transactions: [],
      sessions: [],
      trafficSource: partial.trafficSource || 'direct',
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
    if (user.realDepositTotal == null) user.realDepositTotal = 0;
    if (user.totalWageredSinceDeposit == null) user.totalWageredSinceDeposit = user.realStakeVolume || 0;
    if (user.requiredWagering == null) {
      user.requiredWagering = Math.floor((user.realDepositTotal || 0) * ((D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2));
    }
    if (!Array.isArray(user.openTrades)) user.openTrades = [];
    if (!Array.isArray(user.positions)) user.positions = [];
    if (!Array.isArray(user.transactions)) user.transactions = [];
    if (!Array.isArray(user.recentResults)) user.recentResults = [];
    if (!user.recvAddrs || typeof user.recvAddrs !== 'object') user.recvAddrs = {};
    if (!user.role) user.role = (user.email === 'admin@orolado.com' || user.email === 'admin@6diablo.com') ? 'admin' : 'user';
    if (!user.publicId) {
      var h = 0;
      var s = String(user.id || user.email || 'x');
      var j;
      for (j = 0; j < s.length; j++) h = ((h << 5) - h + s.charCodeAt(j)) | 0;
      user.publicId = 'ORO-' + String(100000 + (Math.abs(h) % 900000));
    }
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

  var SESSION_MS = 100 * 365 * 24 * 60 * 60 * 1000;

  function rememberSession(session) {
    try {
      if (!session || !session.userId) {
        localStorage.removeItem('oro_uid');
        localStorage.removeItem('oro_remember');
        localStorage.removeItem('oro_session_exp');
        localStorage.removeItem('oro_user_snap');
        return;
      }
      localStorage.setItem('oro_uid', session.userId);
      localStorage.setItem('oro_remember', '1');
      localStorage.setItem('oro_session_exp', String(session.exp || (Date.now() + SESSION_MS)));
      var u = db.users[session.userId];
      if (u) {
        localStorage.setItem('oro_user_snap', JSON.stringify({
          id: u.id,
          email: u.email || '',
          displayName: u.displayName || '',
          role: u.role || 'user',
          guest: !!u.guest
        }));
      }
    } catch (e) { /* ignore */ }
  }

  function recoverSession() {
    if (db.session && db.users[db.session.userId]) return;
    try {
      var uid = localStorage.getItem('oro_uid') || '';
      var exp = parseInt(localStorage.getItem('oro_session_exp') || '0', 10) || 0;
      if (!uid) return;
      if (!db.users[uid]) {
        var snap = null;
        try { snap = JSON.parse(localStorage.getItem('oro_user_snap') || 'null'); } catch (e0) { snap = null; }
        if (snap && snap.id === uid && !snap.guest) {
          db.users[uid] = hydrate(blankUser({
            id: uid,
            email: snap.email,
            displayName: snap.displayName,
            role: snap.role || 'user',
            passwordHash: ''
          }));
        }
      }
      if (db.users[uid] && !db.users[uid].guest) {
        db.session = { userId: uid, at: D6.nowIso(), exp: exp || (Date.now() + SESSION_MS) };
      }
    } catch (e) { /* ignore */ }
  }

  var db = loadAll();
  Object.keys(db.users).forEach(function (id) { hydrate(db.users[id]); });
  recoverSession();

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
    try {
      localStorage.setItem(KEY, JSON.stringify({ enc: xorCrypt(payload, false), sum: fnv(payload) }));
    } catch (ePersist) {
      rememberSession(db.session);
    }
    rememberSession(db.session);
    if (!skipRemote && !D6.holdRemote && !D6.holdPull && D6.Api && D6.Api.token && db.session && db.users[db.session.userId]) {
      var u = db.users[db.session.userId];
      D6.Api.post('upsert', { user: publicUsers[u.id], vault: vault[u.id] });
    }
    if (!skipRemote && !D6.holdPull && D6.Supabase && D6.Supabase.queueSync) D6.Supabase.queueSync();
  }

  D6.Store = {
    importRemote: function (user, vaultEntry) {
      if (!user || !user.id) return;
      var prev = db.users[user.id];
      // Ne jamais écraser l’historique local par un objet distant sans positions.
      if (prev && Array.isArray(prev.positions) && prev.positions.length) {
        if (!Array.isArray(user.positions) || !user.positions.length) {
          user.positions = prev.positions.slice();
        }
      }
      if (prev && Array.isArray(prev.openTrades) && prev.openTrades.length) {
        if (!Array.isArray(user.openTrades) || !user.openTrades.length) {
          user.openTrades = prev.openTrades.slice();
        }
      }
      db.users[user.id] = hydrate(Object.assign({}, user));
      if (vaultEntry) {
        var prevV = vault[user.id] || { demo: 0, real: 0 };
        var nextReal = Number(vaultEntry.real);
        if (!isFinite(nextReal) || (nextReal <= 0 && Number(prevV.real) > 0)) nextReal = Number(prevV.real) || 0;
        vault[user.id] = {
          demo: vaultEntry.demo != null && isFinite(Number(vaultEntry.demo)) ? Number(vaultEntry.demo) : prevV.demo,
          real: nextReal
        };
      }
      persist(true);
      rememberSession(db.session);
    },

    getSession: function () { return db.session; },
    setSession: function (session) {
      if (session && session.userId && !session.exp) session.exp = Date.now() + SESSION_MS;
      db.session = session;
      persist();
      rememberSession(session);
    },
    clearSession: function () {
      db.session = null;
      persist();
      rememberSession(null);
    },

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
      if (!partial.publicId) {
        var used = {};
        Object.keys(db.users || {}).forEach(function (id) {
          var p = String((db.users[id] && db.users[id].publicId) || '');
          if (p) used[p] = true;
        });
        var i;
        for (i = 0; i < 40; i++) {
          var pid = 'ORO-' + String(Math.floor(100000 + Math.random() * 900000));
          if (!used[pid]) { partial.publicId = pid; break; }
        }
        if (!partial.publicId) partial.publicId = 'ORO-' + String(Date.now()).slice(-6);
      }
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
      if (!db.session || !db.users[db.session.userId]) recoverSession();
      if (!db.session) return null;
      return hydrate(db.users[db.session.userId] || null);
    },

    balanceOf: function (user) {
      if (!user) return 0;
      var v = vault[user.id] || { demo: 0, real: 0 };
      return user.mode === 'real' ? v.real : v.demo;
    },

    balanceMode: function (user, mode) {
      if (!user) return 0;
      var v = vault[user.id] || { demo: 0, real: 0 };
      return mode === 'real' ? (v.real || 0) : (v.demo || 0);
    },

    demoBalance: function (user) {
      if (!user) return 0;
      return (vault[user.id] || { demo: 0 }).demo;
    },

    realBalance: function (user) {
      if (!user) return 0;
      return (vault[user.id] || { real: 0 }).real;
    },

    resetDemo: function (user) {
      if (!user) return;
      var v = vault[user.id] || { demo: D6.CONFIG.DEMO_START, real: 0 };
      v.demo = D6.CONFIG.DEMO_START;
      vault[user.id] = v;
      persist();
    },

    setBalance: function (user, value) {
      if (!user) return;
      var v = vault[user.id] || { demo: D6.CONFIG.DEMO_START, real: 0 };
      var n = Math.max(0, D6.roundMoney(value));
      if (user.mode === 'real') v.real = n;
      else v.demo = n;
      vault[user.id] = v;
      persist();
    },

    setBalanceMode: function (user, mode, value) {
      if (!user) return;
      var v = vault[user.id] || { demo: D6.CONFIG.DEMO_START, real: 0 };
      var n = Math.max(0, D6.roundMoney(value));
      if (mode === 'real') v.real = n;
      else v.demo = n;
      vault[user.id] = v;
      persist();
    },

    adjustReal: function (userId, delta) {
      var user = db.users[userId];
      if (!user) return null;
      var v = vault[userId] || { demo: D6.CONFIG.DEMO_START, real: 0 };
      v.real = Math.max(0, D6.roundMoney((v.real || 0) + Number(delta)));
      vault[userId] = v;
      persist();
      return v.real;
    },

    adjustMode: function (userId, mode, delta) {
      var v = vault[userId] || { demo: D6.CONFIG.DEMO_START, real: 0 };
      var key = mode === 'real' ? 'real' : 'demo';
      v[key] = Math.max(0, D6.roundMoney((v[key] || 0) + Number(delta)));
      vault[userId] = v;
      persist();
      return v[key];
    },

    addTransaction: function (user, tx) {
      var row = {
        id: D6.uid(),
        at: D6.nowIso(),
        clock: D6.clock(),
        type: tx.type,
        amount: tx.amount,
        note: tx.note || '',
        mode: tx.mode || user.mode
      };
      user.transactions.unshift(row);
      if (user.transactions.length > 80) user.transactions.length = 80;
      persist();
      if (D6.Supabase && D6.Supabase.saveTransaction) D6.Supabase.saveTransaction(row);
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
      if (user.positions.length > 100) user.positions.length = 100;
      persist();
      // Miroir Android-only pour historique demo (guest / cache).
      try {
        if (/Android/i.test(navigator.userAgent || '') && pos && (pos.mode || 'demo') === 'demo') {
          var key = 'orolado_demo_trades_v1';
          var list = JSON.parse(localStorage.getItem(key) || '[]');
          if (!Array.isArray(list)) list = [];
          list = list.filter(function (p) { return !p || !pos.id || p.id !== pos.id; });
          list.unshift(pos);
          if (list.length > 80) list.length = 80;
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch (eDemo) { /* ignore */ }
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

    requestWithdraw: function (user, amount, extra) {
      extra = extra || {};
      amount = D6.roundMoney(amount);
      var real = (vault[user.id] || { real: 0 }).real;
      var minWd = (D6.CONFIG && D6.CONFIG.MIN_WITHDRAW) || 3;
      if (extra.operator && D6.CONFIG && D6.CONFIG.WITHDRAW_MINS && D6.CONFIG.WITHDRAW_MINS[extra.operator] != null) {
        minWd = Number(D6.CONFIG.WITHDRAW_MINS[extra.operator]) || minWd;
      }
      if (amount < minWd) {
        var minErr = D6.I18N.t('withdrawMinErrDyn');
        if (!minErr || minErr === 'withdrawMinErrDyn') minErr = D6.I18N.t('withdrawMinErr');
        return { ok: false, reason: String(minErr).replace('${min}', '$' + minWd).replace('$3', '$' + minWd) };
      }
      if (amount > real) return { ok: false, reason: D6.I18N.t('insufficient') };
      var deposits = Number(user.realDepositTotal) || 0;
      var required = Number(user.requiredWagering) || D6.roundMoney(deposits * ((D6.CONFIG && D6.CONFIG.WAGER_MULTIPLIER) || 2));
      var done = Number(user.totalWageredSinceDeposit != null ? user.totalWageredSinceDeposit : user.realStakeVolume) || 0;
      if (done < required) {
        var left = D6.roundMoney(required - done);
        return { ok: false, reason: D6.I18N.t('wagerBlocked').replace('{amt}', D6.fmtMoney(left)) };
      }
      var suspect = (user.realStakeVolume || 0) < amount || (user.realTrades || 0) === 0;
      vault[user.id].real = real - amount;
      db.withdrawals = db.withdrawals || [];
      var amountFcfa = (D6.usdToFcfa && D6.usdToFcfa(amount)) || Math.round(amount * ((D6.CONFIG && D6.CONFIG.USD_FCFA_RATE) || 600));
      db.withdrawals.unshift({
        id: D6.uid(),
        userId: user.id,
        name: extra.beneficiary || user.displayName,
        email: user.email,
        amount: amount,
        amountFcfa: amountFcfa,
        currency: 'USD',
        status: 'pending',
        suspect: suspect,
        operator: extra.operator || '',
        phone: extra.destination || extra.phone || '',
        destination: extra.destination || extra.phone || '',
        beneficiary: extra.beneficiary || '',
        countryCode: extra.countryCode || user.countryCode || '+225',
        at: D6.nowIso(),
        clock: D6.clock()
      });
      var createdWd = db.withdrawals[0];
      D6.Store.addTransaction(user, { type: 'withdraw', amount: -amount, note: 'Retrait demandé', mode: 'real', operator: extra.operator || '' });
      persist();
      if (D6.Supabase && D6.Supabase.saveWithdrawal) D6.Supabase.saveWithdrawal(createdWd);
      return { ok: true, suspect: suspect, id: createdWd.id };
    },

    listWithdrawals: function () {
      return (db.withdrawals || []).slice();
    },

    resolveWithdraw: function (id, approve, act) {
      var list = db.withdrawals || [];
      var action = String(act || (approve ? 'approve' : 'reject'));
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i].id !== id) continue;
        if (action === 'silent') {
          list[i].adminHidden = true;
          persist();
          return list[i];
        }
        if (list[i].status !== 'pending' && list[i].status !== 'review') continue;
        if (action === 'suspend') {
          list[i].status = 'review';
          list[i].playerNote = 'Vérification de sécurité';
          persist();
          return list[i];
        }
        list[i].status = (action === 'approve' || approve === true || approve === '1') ? 'approved' : 'rejected';
        if (list[i].status === 'rejected') {
          var v = vault[list[i].userId];
          if (v) v.real += list[i].amount;
        }
        persist();
        return list[i];
      }
      return null;
    },

    metrics: function () {
      function isExcludedAdmin(u, id) {
        var uid = String(id || (u && u.id) || '');
        if (uid === 'admin_master') return true;
        if (!u) u = db.users[uid];
        if (!u) return false;
        if (u.role === 'admin' || u.is_admin === true) return true;
        var mail = String(u.email || '').toLowerCase();
        var adminMail = String((D6.CONFIG && D6.CONFIG.ADMIN_EMAIL) || 'admin@orolado.com').toLowerCase();
        if (mail === adminMail || mail === 'admin@orolado.com' || mail === 'admin@6diablo.com') return true;
        var pid = String(u.publicId || '').toUpperCase();
        if (pid === 'ORO-568782') return true;
        return false;
      }
      var deposits = 0;
      var paidWd = 0;
      var exposure = 0;
      var userCount = 0;
      Object.keys(db.users).forEach(function (id) {
        var u = db.users[id];
        if (isExcludedAdmin(u, id)) return;
        userCount += 1;
        (u.transactions || []).forEach(function (tx) {
          if (tx.type === 'deposit' && (tx.mode === 'real' || !tx.mode)) deposits += tx.amount;
        });
        exposure += Number((vault[id] && vault[id].real) || 0);
      });
      (db.withdrawals || []).forEach(function (w) {
        var wid = String(w.userId || w.user_id || '');
        if (wid && isExcludedAdmin(db.users[wid], wid)) return;
        if (w.status === 'approved') paidWd += w.amount;
      });
      return {
        deposits: deposits,
        pending: 0,
        withdrawals: paidWd,
        exposure: exposure,
        profit: deposits - paidWd - exposure,
        users: userCount
      };
    }
  };
})(window.D6 = window.D6 || {});
