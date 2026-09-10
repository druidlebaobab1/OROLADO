(function (D6) {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function t(k) { return (D6.I18N && D6.I18N.t) ? D6.I18N.t(k) : k; }
  function toast(msg, kind) { if (D6.App && D6.App.toast) D6.App.toast(msg, kind); }
  function showScreen(name) { if (D6.App && D6.App.showScreen) D6.App.showScreen(name); }
  function closeDrawer() { if (D6.App && D6.App.closeDrawer) D6.App.closeDrawer(); }
  function user() { return D6.App && D6.App.user ? D6.App.user() : null; }
  function updateBalance(a) { if (D6.App && D6.App.updateBalance) D6.App.updateBalance(a); }

  function injectAdminUi() {
    if ($('screenAdmin')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = '<section id="screenAdmin" class="screen admin-screen hidden">' +
      '<div class="admin-head"><button type="button" class="icon-btn" id="btnCloseAdmin">←</button><h2>Tableau de bord</h2></div>' +
      '<div class="admin-body">' +
      '<div class="metrics" id="adminMetricsRow1">' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="depositsTotal"><div class="k">Total dépôts</div><div class="v" id="mDeposits">0</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="withdrawalsAll"><div class="k">Total retraits</div><div class="v" id="mPending">0</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="net"><div class="k">Soldes réels</div><div class="v" id="mExposure">0</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="net"><div class="k">Net plateforme</div><div class="v" id="mProfit">0</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="inscrits"><div class="k">Inscrits</div><div class="v" id="mUsers">0</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="online"><div class="k">En ligne</div><div class="v" id="mOnline">0</div></button>' +
      '</div>' +
      '<div class="metrics metrics-row2" id="adminMetricsRow2">' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="depositsPending"><div class="k">Dépôts en attente</div><div class="v" id="mDepPending">—</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="withdrawalsPending"><div class="k">Retraits en cours</div><div class="v" id="mWdPending">—</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="top"><div class="k">Clients</div><div class="v">dépôts</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="actifs"><div class="k">Actifs</div><div class="v">payeurs</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="games"><div class="k">Marchés</div><div class="v">stats</div></button>' +
      '<button type="button" class="metric glass metric-btn" data-admin-view="traffic"><div class="k">Trafic</div><div class="v">sources</div></button>' +
      '</div>' +
      '<div class="field admin-search"><input id="adminSearch" type="search" placeholder="Rechercher ORO- / e-mail / nom" autocomplete="off"></div>' +
      '<h3 id="adminViewTitle">Inscrits</h3>' +
      '<div class="table-wrap admin-table-wrap" id="adminViewPanel"></div>' +
      '<div id="adminUserDetail" class="admin-detail glass hidden"></div>' +
      '<button type="button" class="mini" id="btnAdminMessages">Messages</button>' +
      '<div class="table-wrap admin-table-wrap hidden" id="adminMessages"></div>' +
      '<button type="button" class="mini" id="btnMaketouLog">Journal paiements</button>' +
      '</div></section>';
    document.body.appendChild(wrap.firstChild);
    var drawer = $('drawerProfile');
    if (drawer && !$('drawerAdminBlock')) {
      var block = document.createElement('div');
      block.className = 'drawer-admin';
      block.id = 'drawerAdminBlock';
      block.innerHTML = '<button type="button" class="btn-admin" id="btnAdmin2">Administration</button>';
      var nav = drawer.querySelector('.drawer-nav');
      if (nav) drawer.insertBefore(block, nav);
      else drawer.appendChild(block);
    }
  }

  var adminCache = {
    users: [],
    messages: [],
    withdrawals: [],
    deposits: [],
    depositsPaid: [],
    metrics: {},
    gameStats: null,
    traffic: {},
    onlineIds: {}
  };
  var adminView = 'inscrits';
  var adminSortDeposit = 'desc';
  var adminPresenceTimer = 0;
  function pingAdminPresence() {
    if (!(D6.Api && D6.Api.token && D6.Api.token())) return;
    D6.Api.post('presence', {}).catch(function () { /* ignore */ });
    if (D6.Supabase && D6.Supabase.pingPresence) D6.Supabase.pingPresence();
  }

  function startAdminPresence() {
    pingAdminPresence();
    if (adminPresenceTimer) clearInterval(adminPresenceTimer);
    adminPresenceTimer = setInterval(pingAdminPresence, 30000);
  }

  function adminEsc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function adminEmailCell(email) {
    var e = adminEsc(email || '');
    return '<span class="admin-email" title="' + e + '">' + e + '</span>';
  }

  function adminMatchQ(blob, q) {
    if (!q) return true;
    return String(blob || '').toLowerCase().indexOf(q) >= 0;
  }

  function adminUserBlob(u) {
    return [(u.publicId || ''), u.email || '', u.displayName || '', u.phone || '', (u.countryCode || '') + (u.phone || ''), u.id || ''].join(' ');
  }

  function adminIsOnlineUser(u) {
    if (adminCache.onlineIds && adminCache.onlineIds[u.id]) return true;
    var ls = u.lastSeen || '';
    if (!ls) return false;
    var t = Date.parse(ls);
    return isFinite(t) && (Date.now() - t) < 90000;
  }

  function adminActives(users) {
    return (users || []).filter(function (u) { return Number(u.totalDeposited || 0) > 0; });
  }

  function setAdminViewActive(view) {
    adminView = view || 'inscrits';
    document.querySelectorAll('.metric-btn[data-admin-view]').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-admin-view') === adminView);
    });
  }

  function adminViewTitle(view) {
    var map = {
      online: 'En ligne',
      inscrits: 'Inscrits',
      actifs: 'Actifs (≥1 dépôt réel)',
      depositsTotal: 'Total dépôts (validés)',
      withdrawalsAll: 'Total retraits',
      net: 'NET / Soldes',
      depositsPending: 'Dépôts en attente',
      withdrawalsPending: 'Retraits en cours',
      top: 'TOP clients',
      games: 'Jeux',
      traffic: 'Trafic'
    };
    return map[view] || 'Admin';
  }

  async function refreshOnlineIds() {
    adminCache.onlineIds = {};
    var nPhp = 0;
    (adminCache.users || []).forEach(function (u) {
      if (adminIsOnlineUser(u)) {
        adminCache.onlineIds[u.id] = true;
        nPhp++;
      }
    });
    if (D6.Supabase && D6.Supabase.listOnline) {
      try {
        var rows = await D6.Supabase.listOnline();
        (rows || []).forEach(function (r) {
          if (r && r.id) adminCache.onlineIds[r.id] = true;
        });
      } catch (e) { /* ignore */ }
    }
    return Object.keys(adminCache.onlineIds).length || nPhp;
  }

  async function renderAdmin() {
    var remote = D6.Api ? await D6.Api.post('admin', {}) : null;
    if (!remote || !remote.ok) {
      adminCache.users = [];
      adminCache.messages = [];
      adminCache.withdrawals = [];
      adminCache.deposits = [];
      adminCache.depositsPaid = [];
      adminCache.metrics = {};
      adminCache.gameStats = null;
      adminCache.traffic = {};
      if ($('screenAdmin') && !$('screenAdmin').classList.contains('hidden')) {
        showScreen('screenTrade');
      }
      return false;
    }
    var m = remote.metrics || {};
    var users = remote.users || [];
    var wd = remote.withdrawals || [];
    var msgs = remote.messages || [];
    adminCache.users = users;
    adminCache.messages = msgs;
    adminCache.withdrawals = wd || [];
    adminCache.deposits = (remote && remote.ok && remote.deposits) ? remote.deposits : [];
    adminCache.depositsPaid = (remote && remote.ok && remote.depositsPaid) ? remote.depositsPaid : [];
    adminCache.metrics = m || {};
    adminCache.gameStats = (remote && remote.ok) ? (remote.gameStats || null) : null;
    adminCache.traffic = (remote && remote.ok && remote.traffic) ? remote.traffic : {};

    $('mDeposits').textContent = D6.fmtFCFA(m.deposits || 0);
    $('mPending').textContent = D6.fmtFCFA(m.withdrawals != null ? m.withdrawals : m.pending || 0);
    if ($('mExposure')) $('mExposure').textContent = D6.fmtFCFA(m.exposure || 0);
    $('mProfit').textContent = D6.fmtFCFA(m.profit != null ? m.profit : 0);
    $('mUsers').textContent = String(m.users || 0);
    if ($('mDepPending')) $('mDepPending').textContent = String(adminCache.deposits.length);
    if ($('mWdPending')) {
      var wp = adminCache.withdrawals.filter(function (w) { return w.status === 'pending'; }).length;
      $('mWdPending').textContent = String(wp);
    }
    if ($('mOnline')) {
      $('mOnline').textContent = '…';
      var nOnline = await refreshOnlineIds();
      if (D6.Supabase && D6.Supabase.countOnline) {
        D6.Supabase.countOnline().then(function (n) {
          if ($('mOnline')) $('mOnline').textContent = String(Math.max(Number(n) || 0, nOnline));
        }).catch(function () {
          if ($('mOnline')) $('mOnline').textContent = String(nOnline);
        });
      } else {
        $('mOnline').textContent = String(nOnline);
      }
    }
    setAdminViewActive(adminView);
    renderAdminView();
    renderAdminMessagesList();
    return true;
  }

  function renderAdminMessagesList() {
    var box = $('adminMessages');
    if (!box) return;
    var msgs = adminCache.messages || [];
    if (!msgs.length) box.innerHTML = '<div class="empty-feed">Aucun message</div>';
    else {
      var mrows = msgs.map(function (msg) {
        var acts = msg.status === 'ouvert'
          ? '<button class="mini ok" data-msg="' + adminEsc(msg.id) + '">Résoudre</button>'
          : adminEsc(msg.status || 'resolu');
        return '<tr><td>' + adminEsc(msg.publicId || '') + '<div class="h-time">' + adminEmailCell(msg.email) + '</div></td><td>' + adminEsc(msg.subject || '') +
          '<div class="h-time">' + adminEsc(msg.message || '') + '</div></td><td>' + acts + '</td></tr>';
      }).join('');
      box.innerHTML = '<table class="admin-table"><thead><tr><th>User</th><th>Message</th><th></th></tr></thead><tbody>' + mrows + '</tbody></table>';
    }
  }

  function renderAdminView() {
    var panel = $('adminViewPanel');
    var title = $('adminViewTitle');
    if (!panel) return;
    if (title) title.textContent = adminViewTitle(adminView);
    var q = String(($('adminSearch') && $('adminSearch').value) || '').trim().toLowerCase();
    var html = '';
    if (adminView === 'net') {
      var m = adminCache.metrics || {};
      html = '<div class="admin-net-panel">' +
        '<div class="list-row"><span>Total dépôts</span><strong>' + D6.fmtFCFA(m.deposits || 0) + '</strong></div>' +
        '<div class="list-row"><span>Total retraits</span><strong>' + D6.fmtFCFA(m.withdrawals != null ? m.withdrawals : m.pending || 0) + '</strong></div>' +
        '<div class="list-row"><span>Soldes réels</span><strong>' + D6.fmtFCFA(m.exposure || 0) + '</strong></div>' +
        '<div class="list-row"><span>NET plateforme</span><strong>' + D6.fmtFCFA(m.profit != null ? m.profit : 0) + '</strong></div>' +
        '<p class="hint-min">Chiffres serveur inchangés (pas de recalcul).</p></div>';
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'games') {
      var gs = adminCache.gameStats;
      if (!gs || !gs.total) {
        panel.innerHTML = '<div class="empty-feed">pas de data</div>';
        return;
      }
      function rowsFromMap(map) {
        return Object.keys(map || {}).sort().map(function (k) {
          return '<tr><td>' + adminEsc(k) + '</td><td>' + adminEsc(map[k]) + '</td></tr>';
        }).join('');
      }
      html = '<table class="admin-table"><thead><tr><th>Indice</th><th>Nb</th></tr></thead><tbody>' + rowsFromMap(gs.byAsset) + '</tbody></table>';
      html += '<table class="admin-table" style="margin-top:10px"><thead><tr><th>Durée (s)</th><th>Nb</th></tr></thead><tbody>' + rowsFromMap(gs.byDuration) + '</tbody></table>';
      if (gs.byAssetMode) {
        html += '<p class="hint-min" style="margin-top:10px">Réel / démo</p>';
        html += '<table class="admin-table"><thead><tr><th>Mode · Indice</th><th>Nb</th></tr></thead><tbody>';
        ['real', 'demo'].forEach(function (mode) {
          Object.keys(gs.byAssetMode[mode] || {}).forEach(function (aid) {
            html += '<tr><td>' + mode + ' · ' + adminEsc(aid) + '</td><td>' + gs.byAssetMode[mode][aid] + '</td></tr>';
          });
        });
        html += '</tbody></table>';
      }
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'traffic') {
      var traf = adminCache.traffic || {};
      var keys = Object.keys(traf);
      if (!keys.length) {
        panel.innerHTML = '<div class="empty-feed">pas de data</div>';
        return;
      }
      html = '<table class="admin-table"><thead><tr><th>Source</th><th>Comptes</th></tr></thead><tbody>' +
        keys.sort().map(function (k) {
          return '<tr><td>' + adminEsc(k) + '</td><td>' + traf[k] + '</td></tr>';
        }).join('') + '</tbody></table>';
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'depositsPending') {
      var deps = (adminCache.deposits || []).filter(function (d) {
        return adminMatchQ([d.publicId, d.name, d.email, d.ref, d.operator, String(d.amount || '')].join(' '), q);
      });
      if (!deps.length) html = '<div class="empty-feed">' + t('noDeposit') + '</div>';
      else {
        var drows = deps.map(function (d) {
          var acts = '<button class="mini ok" data-dep="' + adminEsc(d.ref) + '" data-amt="' + Number(d.amount || 0) + '" data-ok="1">' + t('approve') + '</button>' +
            ' <button class="mini bad" data-dep="' + adminEsc(d.ref) + '" data-ok="0">' + t('reject') + '</button>';
          return '<tr><td>' + adminEsc(d.publicId || d.name || '') + '<div class="h-time">' + adminEmailCell(d.email) + '</div></td><td>' + D6.fmtFCFA(d.amount) +
            '</td><td>' + adminEsc(d.operator || '') + '<div class="h-time">' + adminEsc(d.ref) + '</div></td><td>' + acts + '</td></tr>';
        }).join('');
        html = '<table class="admin-table"><thead><tr><th>Joueur</th><th>Montant</th><th>Référence</th><th></th></tr></thead><tbody>' + drows + '</tbody></table>';
      }
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'withdrawalsPending' || adminView === 'withdrawalsAll') {
      var wdList = (adminCache.withdrawals || []).filter(function (w) {
        if (adminView === 'withdrawalsPending' && w.status !== 'pending') return false;
        return adminMatchQ([w.name, w.phone, w.operator, w.id, w.status, String(w.amount || '')].join(' '), q);
      });
      if (!wdList.length) html = '<div class="empty-feed">' + t('noWithdraw') + '</div>';
      else {
        var wrows = wdList.map(function (w) {
          var badge = w.suspect ? ' <span class="badge-suspect">' + t('suspect') + '</span>' : '';
          var acts = w.status === 'pending'
            ? '<button class="mini ok" data-wd="' + adminEsc(w.id) + '" data-ok="1">' + t('approve') + '</button> <button class="mini bad" data-wd="' + adminEsc(w.id) + '" data-ok="0">' + t('reject') + '</button>'
            : adminEsc(w.status);
          var dest = (w.operator || '') + ' · ' + (w.destination || w.phone || '') + (w.beneficiary ? ' · ' + w.beneficiary : '');
          return '<tr><td>' + adminEsc(w.name) + '</td><td>' + D6.fmtFCFA(w.amount) + '</td><td>' + adminEsc(dest) + '<div class="h-time">' + adminEsc(w.clock || '') + badge + '</div></td><td>' + acts + '</td></tr>';
        }).join('');
        html = '<table class="admin-table"><thead><tr><th>Joueur</th><th>Montant</th><th>Mobile Money</th><th>Statut</th></tr></thead><tbody>' + wrows + '</tbody></table>';
      }
      panel.innerHTML = html;
      return;
    }
    if (adminView === 'depositsTotal') {
      var paid = (adminCache.depositsPaid || []).filter(function (d) {
        return adminMatchQ([d.publicId, d.name, d.email, d.ref, d.operator, String(d.amount || ''), d.at].join(' '), q);
      });
      if (!paid.length) html = '<div class="empty-feed">Aucun dépôt validé</div>';
      else {
        html = '<table class="admin-table"><thead><tr><th>User</th><th>Montant</th><th>Opérateur</th><th>Date</th><th>Réf</th></tr></thead><tbody>' +
          paid.map(function (d) {
            return '<tr><td>' + adminEsc(d.publicId || d.name || '') + '<div class="h-time">' + adminEmailCell(d.email) + '</div></td><td>' + D6.fmtFCFA(d.amount) +
              '</td><td>' + adminEsc(d.operator || '') + '</td><td>' + adminEsc(String(d.at || '').slice(0, 19)) + '</td><td>' + adminEsc(d.ref) + '</td></tr>';
          }).join('') + '</tbody></table>';
      }
      panel.innerHTML = html;
      return;
    }

    // user-list views: online / inscrits / actifs / top
    var list = adminCache.users || [];
    if (adminView === 'online') list = list.filter(adminIsOnlineUser);
    if (adminView === 'actifs' || adminView === 'top') list = adminActives(list);
    if (adminView === 'top' || adminView === 'actifs') {
      var dir = adminSortDeposit === 'asc' ? 1 : -1;
      list = list.slice().sort(function (a, b) {
        return dir * (Number(a.totalDeposited || 0) - Number(b.totalDeposited || 0));
      });
    }
    list = list.filter(function (u) { return adminMatchQ(adminUserBlob(u), q); });
    if (!list.length) {
      panel.innerHTML = '<div class="empty-feed">' + t('noUsers') + '</div>';
      return;
    }
    if (adminView === 'online') {
      html = '<table class="admin-table"><thead><tr><th>ID</th><th>Pseudo</th><th>Tél</th><th>Solde réel</th><th>Dernière action</th></tr></thead><tbody>' +
        list.map(function (u) {
          return '<tr data-user="' + adminEsc(u.id) + '"><td>' + adminEsc(u.publicId || '') + '</td><td>' + adminEsc(u.displayName || '') +
            '</td><td>' + adminEsc((u.countryCode || '') + ' ' + (u.phone || '')) + '</td><td>' + D6.fmtFCFA(u.realBalance) +
            '</td><td>' + adminEsc(String(u.lastAction || u.lastSeen || '').slice(0, 19)) + '</td></tr>';
        }).join('') + '</tbody></table>';
    } else if (adminView === 'actifs' || adminView === 'top') {
      var sortMark = adminSortDeposit === 'asc' ? ' ↑' : ' ↓';
      html = '<table class="admin-table"><thead><tr>' +
        (adminView === 'top' ? '<th>Rang</th>' : '') +
        '<th>ID</th><th>Pseudo</th><th>Tél</th><th class="sortable" data-sort-dep="1">Total déposé' + sortMark + '</th><th>Total retiré</th><th>Solde réel</th>' +
        (adminView === 'actifs' ? '<th>Nb trades réel</th>' : '') +
        '</tr></thead><tbody>' +
        list.map(function (u, i) {
          return '<tr data-user="' + adminEsc(u.id) + '">' +
            (adminView === 'top' ? '<td>' + (i + 1) + '</td>' : '') +
            '<td>' + adminEsc(u.publicId || '') + '</td><td>' + adminEsc(u.displayName || '') +
            '</td><td>' + adminEsc((u.countryCode || '') + ' ' + (u.phone || '')) +
            '</td><td>' + D6.fmtFCFA(u.totalDeposited || 0) + '</td><td>' + D6.fmtFCFA(u.totalWithdrawn || 0) +
            '</td><td>' + D6.fmtFCFA(u.realBalance) + '</td>' +
            (adminView === 'actifs' ? '<td>' + Number(u.realTrades || 0) + '</td>' : '') +
            '</tr>';
        }).join('') + '</tbody></table>';
    } else {
      // inscrits
      html = '<table class="admin-table"><thead><tr><th>ID</th><th>Pseudo</th><th>E-mail</th><th>Tél</th><th>Date</th><th>Solde réel</th></tr></thead><tbody>' +
        list.map(function (u) {
          var d = (u.createdAt || '').slice(0, 10);
          return '<tr data-user="' + adminEsc(u.id) + '"><td>' + adminEsc(u.publicId || '') + '</td><td>' + adminEsc(u.displayName || '') +
            '</td><td>' + adminEmailCell(u.email) + '</td><td>' + adminEsc((u.countryCode || '') + ' ' + (u.phone || '')) +
            '</td><td>' + adminEsc(d) + '</td><td>' + D6.fmtFCFA(u.realBalance) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    panel.innerHTML = html;
  }

  function renderAdminUsers(q) {
    if (arguments.length && $('adminSearch') && q != null) $('adminSearch').value = q;
    renderAdminView();
  }

  function adminTxStatusLabel(st) {
    var s = String(st || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'PAID' || s === 'APPROVED' || s === 'OK' || s === 'SUCCESS') return 'Succès';
    if (s === 'PENDING' || s === 'WAITING') return 'En attente';
    if (s === 'REJECTED' || s === 'FAILED' || s === 'CANCELLED' || s === 'ERROR') return 'Échoué';
    return st ? String(st) : '—';
  }

  function adminTxTypeLabel(type) {
    var t0 = String(type || '').toLowerCase();
    if (t0 === 'deposit' || t0 === 'recharge') return 'Dépôt';
    if (t0 === 'withdraw' || t0 === 'withdrawal') return 'Retrait';
    if (t0 === 'adjust' || t0 === 'admin' || t0 === 'credit' || t0 === 'debit') return 'Ajustement Admin';
    if (t0 === 'win') return 'Gain trade';
    if (t0 === 'void') return 'Remboursement';
    return type ? String(type) : 'Transaction';
  }

  function collectPlayerFinanceRows(u) {
    var uid = String((u && u.id) || '');
    var rows = [];
    var seen = {};
    function pushRow(row) {
      if (!row) return;
      var key = [row.at, row.type, row.amount, row.ref].join('|');
      if (seen[key]) return;
      seen[key] = 1;
      rows.push(row);
    }
    (adminCache.depositsPaid || []).forEach(function (d) {
      if (String(d.userId || '') !== uid) return;
      pushRow({
        at: d.at || d.paidAt || d.createdAt || '',
        type: 'deposit',
        amount: Number(d.amount) || 0,
        status: d.status || 'COMPLETED',
        ref: d.ref || d.id || (d.operator ? ('Maketou/' + d.operator) : 'Maketou')
      });
    });
    (adminCache.deposits || []).forEach(function (d) {
      if (String(d.userId || '') !== uid) return;
      pushRow({
        at: d.at || d.createdAt || '',
        type: 'deposit',
        amount: Number(d.amount) || 0,
        status: d.status || 'PENDING',
        ref: d.ref || d.id || 'Maketou'
      });
    });
    (adminCache.withdrawals || []).forEach(function (w) {
      if (String(w.userId || '') !== uid) return;
      pushRow({
        at: w.at || w.createdAt || w.clock || '',
        type: 'withdraw',
        amount: Number(w.amount) || 0,
        status: w.status || 'pending',
        ref: w.id || w.ref || (w.method || 'retrait')
      });
    });
    ((u && u.transactions) || []).forEach(function (tx) {
      var typ = String(tx.type || '').toLowerCase();
      if (typ !== 'deposit' && typ !== 'withdraw' && typ !== 'withdrawal' && typ !== 'adjust' && typ !== 'admin' && typ !== 'credit' && typ !== 'debit') {
        if (tx.mode === 'real' && (typ === 'win' || typ === 'void')) {
          /* garder gains/void réel pour audit */
        } else if (!(tx.note && /admin|bonus|correction|ajust/i.test(String(tx.note)))) {
          return;
        }
      }
      pushRow({
        at: tx.at || tx.createdAt || '',
        type: typ === 'withdrawal' ? 'withdraw' : (typ || 'adjust'),
        amount: Number(tx.amount) || 0,
        status: tx.status || 'OK',
        ref: tx.ref || tx.id || (tx.note || 'ledger')
      });
    });
    rows.sort(function (a, b) {
      return String(b.at || '').localeCompare(String(a.at || ''));
    });
    return rows.slice(0, 10);
  }

  function renderPlayerFinanceBlock(u) {
    var totalDep = Number(u.totalDeposited || 0);
    var totalWd = Number(u.totalWithdrawn || 0);
    if (!totalDep) {
      (adminCache.depositsPaid || []).forEach(function (d) {
        if (String(d.userId || '') === String(u.id || '')) totalDep += Number(d.amount) || 0;
      });
    }
    if (!totalWd) {
      (adminCache.withdrawals || []).forEach(function (w) {
        if (String(w.userId || '') === String(u.id || '') && String(w.status || '').toLowerCase() === 'approved') {
          totalWd += Number(w.amount) || 0;
        }
      });
    }
    var net = totalDep - totalWd;
    var rows = collectPlayerFinanceRows(u);
    var table = rows.length
      ? ('<div class="table-wrap admin-finance-table"><table class="hist-table"><thead><tr>' +
        '<th>Date</th><th>Type</th><th>Montant</th><th>Statut</th><th>Réf.</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var dt = String(r.at || '').replace('T', ' ').slice(0, 16);
          return '<tr><td>' + adminEsc(dt || '—') + '</td><td>' + adminEsc(adminTxTypeLabel(r.type)) +
            '</td><td>' + D6.fmtFCFA(r.amount) + '</td><td>' + adminEsc(adminTxStatusLabel(r.status)) +
            '</td><td class="admin-finance-ref">' + adminEsc(String(r.ref || '—').slice(0, 28)) + '</td></tr>';
        }).join('') +
        '</tbody></table></div>')
      : '<p class="hint-min">Aucune transaction financière enregistrée pour ce joueur.</p>';
    return '<div class="admin-finance-block">' +
      '<div class="convert-title" style="font-size:.92rem;margin-top:14px">Historique Financier du Joueur</div>' +
      '<div class="list-row"><span>Total Déposé</span><strong>' + D6.fmtFCFA(totalDep) + '</strong></div>' +
      '<div class="list-row"><span>Total Retiré</span><strong>' + D6.fmtFCFA(totalWd) + '</strong></div>' +
      '<div class="list-row"><span>Bilan net</span><strong>' + D6.fmtFCFA(net) + '</strong></div>' +
      table +
      '</div>';
  }

  function openAdminUser(uid) {
    var u = (adminCache.users || []).find(function (x) { return x.id === uid; });
    var box = $('adminUserDetail');
    if (!u || !box) return;
    box.classList.remove('hidden');
    box.innerHTML = '<div class="convert-title">' + adminEsc(u.publicId || '') + ' · ' + adminEsc(u.displayName || '') + '</div>' +
      '<div class="h-time">' + adminEsc(u.email) + ' · ' + adminEsc((u.countryCode || '') + ' ' + (u.phone || '')) + ' · inscrit ' + adminEsc((u.createdAt || '').slice(0, 10)) + '</div>' +
      '<div class="list-row"><span>Réel</span><strong>' + D6.fmtFCFA(u.realBalance) + '</strong></div>' +
      '<div class="list-row"><span>Démo</span><strong>' + D6.fmtFCFA(u.demoBalance) + '</strong></div>' +
      '<div class="field"><label>' + t('adjustReason') + '</label><input id="adjMotif" maxlength="120" placeholder="bonus, correction…"></div>' +
      '<div class="field"><label>Montant libre ($)</label><input id="adjAmount" type="number" inputmode="decimal" min="0.01" step="0.01" value="100" placeholder="ex. 5, 50, 1000…"></div>' +
      '<div class="admin-adj-row">' +
      '<button class="mini ok" type="button" data-adj-act="credit" data-adj="' + u.id + '" data-mode="real">+ Créditer Réel</button>' +
      '<button class="mini bad" type="button" data-adj-act="debit" data-adj="' + u.id + '" data-mode="real">− Débiter Réel</button>' +
      '<button class="mini" type="button" data-adj="' + u.id + '" data-mode="demo" data-reset="1">Reset démo 25k</button>' +
      '</div>' +
      '<p class="hint-min">Le montant saisi crédite ou débite instantanément le solde RÉEL en base.</p>' +
      renderPlayerFinanceBlock(u);
  }
  function bindAdmin() {
    async function openAdmin() {
      if (!D6.Auth.isAdmin(user())) return;
      closeDrawer();
      adminView = 'inscrits';
      var ok = await renderAdmin();
      if (ok) showScreen('screenAdmin');
    }
    $('btnAdmin2').addEventListener('click', openAdmin);
    $('btnCloseAdmin').addEventListener('click', function () {
      showScreen('screenTrade');
      requestAnimationFrame(D6.Chart.resize);
    });
    document.querySelectorAll('.metric-btn[data-admin-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        adminView = btn.getAttribute('data-admin-view') || 'inscrits';
        if (adminView === 'top') adminSortDeposit = 'desc';
        setAdminViewActive(adminView);
        renderAdminView();
      });
    });
    if ($('adminViewPanel')) {
      $('adminViewPanel').addEventListener('click', async function (e) {
        var sortTh = e.target.closest('[data-sort-dep]');
        if (sortTh && (adminView === 'actifs' || adminView === 'top')) {
          adminSortDeposit = adminSortDeposit === 'desc' ? 'asc' : 'desc';
          renderAdminView();
          return;
        }
        var row = e.target.closest('[data-user]');
        if (row) openAdminUser(row.dataset.user);
        var depBtn = e.target.closest('[data-dep]');
        if (depBtn && !depBtn.disabled) {
          depBtn.disabled = true;
          var res = D6.Api && D6.Api.token()
            ? await D6.Api.post('resolveDeposit', {
              ref: depBtn.dataset.dep,
              amount: Number(depBtn.dataset.amt || 0),
              approve: depBtn.dataset.ok === '1'
            })
            : null;
          if (res && res.ok) toast(depBtn.dataset.ok === '1' ? (t('depositOk') + ' : +' + D6.fmtFCFA(res.amount || 0)) : t('reject'), 'ok');
          else toast((res && res.reason) || t('sessionInvalid'), 'err');
          renderAdmin();
          return;
        }
        var wdBtn = e.target.closest('[data-wd]');
        if (wdBtn) {
          if (D6.Api && D6.Api.token()) await D6.Api.post('resolveWithdraw', { id: wdBtn.dataset.wd, approve: wdBtn.dataset.ok === '1' });
          D6.Store.resolveWithdraw(wdBtn.dataset.wd, wdBtn.dataset.ok === '1');
          renderAdmin();
        }
      });
    }
    if ($('adminSearch')) {
      $('adminSearch').addEventListener('input', function () { renderAdminView(); });
      $('adminSearch').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); renderAdminView(); }
      });
    }
    async function runAdminAdjust(btn) {
      if (!btn) return;
      var motif = ($('adjMotif') && $('adjMotif').value) || '';
      if (!motif.trim()) { toast(t('adjustReason'), 'err'); return; }
      var uid = btn.dataset.adj;
      var mode = btn.dataset.mode || 'real';
      var delta = 0;
      if (btn.dataset.reset === '1') {
        var u0 = (adminCache.users || []).find(function (x) { return x.id === uid; });
        delta = (D6.CONFIG.DEMO_START || 25000) - Number((u0 && u0.demoBalance) || 0);
        mode = 'demo';
      } else {
        var rawAmt = String(($('adjAmount') && $('adjAmount').value) || '').replace(/\s/g, '').replace(',', '.');
        var amt = Math.abs(Math.round(Number(rawAmt) || 0));
        if (!amt) { toast('Montant invalide', 'err'); return; }
        mode = 'real';
        delta = btn.dataset.adjAct === 'debit' ? -amt : amt;
      }
      if (D6.Api && D6.Api.token()) {
        var remote = await D6.Api.post('adjust', { userId: uid, delta: delta, mode: mode, motif: motif });
        if (remote && remote.server && !remote.ok) { toast(remote.reason || 'Erreur', 'err'); return; }
      }
      if (D6.Store.adjustMode) D6.Store.adjustMode(uid, mode, delta);
      else if (mode === 'real') D6.Store.adjustReal(uid, delta);
      toast((delta >= 0 ? '+' : '−') + D6.fmtFCFA(Math.abs(delta)), 'ok');
      await renderAdmin();
      openAdminUser(uid);
      updateBalance(false);
    }
    if ($('adminUserDetail')) {
      $('adminUserDetail').addEventListener('click', async function (e) {
        var btn = e.target.closest('[data-adj-act], [data-reset="1"]');
        if (!btn || !btn.dataset.adj) return;
        await runAdminAdjust(btn);
      });
    }
    if ($('btnAdminMessages')) {
      $('btnAdminMessages').addEventListener('click', function () {
        if ($('adminMessages')) $('adminMessages').classList.toggle('hidden');
      });
    }
    if ($('adminMessages')) {
      $('adminMessages').addEventListener('click', async function (e) {
        var btn = e.target.closest('[data-msg]');
        if (!btn) return;
        var reply = window.prompt('Réponse (optionnel)') || '';
        if (D6.Api && D6.Api.token()) await D6.Api.post('resolveMessage', { id: btn.dataset.msg, reply: reply });
        renderAdmin();
      });
    }
    if ($('btnMaketouLog')) {
      $('btnMaketouLog').addEventListener('click', function () {
        var tok = (D6.Api && D6.Api.token && D6.Api.token()) || '';
        if (!tok) { toast(t('sessionInvalid'), 'err'); return; }
        window.open('debug-maketou.php?lines=300&token=' + encodeURIComponent(tok), '_blank');
      });
    }
  }

  D6.Admin = {
    boot: function () {
      injectAdminUi();
      bindAdmin();
      startAdminPresence();
    },
    refresh: function () {
      return renderAdmin();
    }
  };
})(window.D6 = window.D6 || {});