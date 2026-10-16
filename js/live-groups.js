/* v2688 — Live : GROUPES (communauté). Créer un groupe, inviter avec un lien (orolado.com/?g=…), discuter à
   plusieurs avec photos, voir les membres, quitter ; le créateur peut retirer quelqu'un. Serveur : live.php (groups…). */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var EMO = ['💬', '🔥', '🚀', '💎', '🏆', '⚡', '🌍', '🦁', '👑', '🎯', '💰', '🎉'];
  var T = {
    fr: { title: 'Mes groupes', sub: 'Discute à plusieurs', create: 'Créer un groupe', namePh: 'Nom du groupe (ex. Les traders d’Abidjan)', go: 'Créer', none: 'Tu n’as pas encore de groupe. Crée le tien et invite tes amis avec un lien !',
      invite: 'Inviter', members: 'Membres', leave: 'Quitter', leaveQ: 'Quitter ce groupe ?', copied: 'Lien copié ✓ Envoie-le à tes amis (WhatsApp, Telegram…)', shareText: 'Rejoins mon groupe sur OROLADO : ',
      n: '{n} membres', n1: '1 membre', owner: 'créateur', kick: 'Retirer', kickQ: 'Retirer {n} du groupe ?', ph: 'Écris au groupe…', joined: 'Bienvenue dans le groupe {n} !', login: 'Inscris-toi pour rejoindre ce groupe',
      gName: 'Donne un nom à ton groupe (2 lettres minimum).', gGone: 'Ce groupe n’est plus disponible.', gFull: 'Ce groupe est complet.', tooMany: 'Limite atteinte, réessaie plus tard.', badImg: 'Photo refusée.', fail: 'Échec, réessaie.', back: 'Mes groupes',
      tapInfo: 'Touche ici pour les infos du groupe', group: 'Groupe', addMem: 'Ajouter des membres', copyLink: 'Copier le lien', share: 'Partager', admin: 'Admin', exit: 'Quitter le groupe', you: 'Toi', chat: 'Discussion',
      pickNone: 'Tu n’as pas encore de contacts. Écris d’abord à un ami dans « Mes amis », ou envoie-lui le lien avec « Inviter ».', addN: 'Ajouter ({n})', added: '{n} ajouté(s) au groupe ✓', sysAdd: '{a} a ajouté {b}', inGrp: 'Déjà dans le groupe', gNoneAdded: 'Personne n’a pu être ajouté.', search: 'Rechercher un contact' },
    en: { title: 'My groups', sub: 'Chat with many friends', create: 'Create a group', namePh: 'Group name (e.g. Lagos traders)', go: 'Create', none: 'You have no group yet. Create yours and invite your friends with a link!',
      invite: 'Invite', members: 'Members', leave: 'Leave', leaveQ: 'Leave this group?', copied: 'Link copied ✓ Send it to your friends (WhatsApp, Telegram…)', shareText: 'Join my group on OROLADO: ',
      n: '{n} members', n1: '1 member', owner: 'creator', kick: 'Remove', kickQ: 'Remove {n} from the group?', ph: 'Write to the group…', joined: 'Welcome to the group {n}!', login: 'Sign up to join this group',
      gName: 'Give your group a name (at least 2 letters).', gGone: 'This group is no longer available.', gFull: 'This group is full.', tooMany: 'Limit reached, try again later.', badImg: 'Photo refused.', fail: 'Failed, try again.', back: 'My groups',
      tapInfo: 'Tap here for group info', group: 'Group', addMem: 'Add members', copyLink: 'Copy link', share: 'Share', admin: 'Admin', exit: 'Exit group', you: 'You', chat: 'Chat',
      pickNone: 'You have no contacts yet. First write to a friend in “My friends”, or send them the link with “Invite”.', addN: 'Add ({n})', added: '{n} added to the group ✓', sysAdd: '{a} added {b}', inGrp: 'Already in the group', gNoneAdded: 'Nobody could be added.', search: 'Search a contact' },
    zh: { title: '我的群组', sub: '多人聊天', create: '创建群组', namePh: '群组名称（例如：交易达人群）', go: '创建', none: '你还没有群组。创建一个，用链接邀请好友吧！',
      invite: '邀请', members: '成员', leave: '退出', leaveQ: '退出这个群组？', copied: '链接已复制 ✓ 发给你的好友（WhatsApp、Telegram…）', shareText: '加入我在 OROLADO 的群组：',
      n: '{n} 位成员', n1: '1 位成员', owner: '创建者', kick: '移除', kickQ: '将 {n} 移出群组？', ph: '给群组发消息…', joined: '欢迎加入群组 {n}！', login: '注册即可加入该群组',
      gName: '请给群组起个名字（至少 2 个字）。', gGone: '该群组已失效。', gFull: '该群组已满。', tooMany: '已达上限，请稍后再试。', badImg: '照片无法发送。', fail: '失败，请重试。', back: '我的群组',
      tapInfo: '点击查看群组信息', group: '群组', addMem: '添加成员', copyLink: '复制链接', share: '分享', admin: '管理员', exit: '退出群组', you: '你', chat: '聊天',
      pickNone: '你还没有联系人。先在“我的好友”里给好友发消息，或用“邀请”发送链接。', addN: '添加（{n}）', added: '已添加 {n} 人 ✓', sysAdd: '{a} 添加了 {b}', inGrp: '已在群组中', gNoneAdded: '没有人被添加。', search: '搜索联系人' }
  };
  (D6.LIVE_T = D6.LIVE_T || {}).groups = T;
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return Object.assign({}, T.en, T[l] || {}); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function guest() { return document.documentElement.classList.contains('oro-guest') || !(D6.Api && D6.Api.token && D6.Api.token()); }
  function toast(m, k) { if (D6.App && D6.App.toast) D6.App.toast(m, k || 'ok'); }
  function ago(t) { var s = Math.max(0, Math.floor(Date.now() / 1000 - t)); if (s < 60) return '•'; if (s < 3600) return Math.floor(s / 60) + ' min'; if (s < 86400) return Math.floor(s / 3600) + ' h'; return Math.floor(s / 86400) + ' j'; }
  async function call(action, data) {
    try {
      var r = await fetch('live.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(Object.assign({ action: action, token: (D6.Api && D6.Api.token) ? D6.Api.token() : '' }, data || {})) });
      return await r.json();
    } catch (e) { return null; }
  }
  function shrink(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var w = im.width, h = im.height, k = Math.min(1, 1280 / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
          var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
          var q = 0.78, out = c.toDataURL('image/jpeg', q);
          while (out.length > 520000 && q > 0.4) { q -= 0.12; out = c.toDataURL('image/jpeg', q); }
          res(out);
        };
        im.onerror = rej; im.src = fr.result;
      };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }

  var box = null, cur = null, poll = 0, pick = EMO[0], img = '';
  function stop() { clearInterval(poll); poll = 0; }

  async function list() {
    stop(); cur = null;
    var x = X();
    if (guest()) {
      box.innerHTML = '<div class="lfun-card center"><div class="lfun-big">👪</div><b>' + esc(x.login) + '</b><button type="button" class="lfun-go" id="lgSign">' + esc(x.create) + '</button></div>';
      $('lgSign').addEventListener('click', function () { if (D6.Live) D6.Live.close(); if (D6.App && D6.App.showAuth) D6.App.showAuth('register'); });
      return;
    }
    // Invité par un lien avant de s'inscrire : on rejoint le groupe maintenant.
    var pend = ''; try { pend = sessionStorage.getItem('oro_gjoin') || ''; sessionStorage.removeItem('oro_gjoin'); } catch (e) { pend = ''; }
    if (pend) { var jr = await call('gJoin', { tok: pend }); if (jr && jr.ok) { toast(x.joined.replace('{n}', jr.g.name)); openGroup(jr.g.id); return; } }
    var j = await call('groups', {});
    var items = (j && j.ok && j.list.length) ? j.list.map(function (g) {
      return '<button type="button" class="lf-c" data-g="' + esc(g.id) + '"><span class="lf-av lg-emo">' + esc(g.emoji) + '</span><span class="lf-ct"><b>' + esc(g.name) + '</b><small>' + esc(g.last || (g.n === 1 ? x.n1 : x.n.replace('{n}', g.n))) + '</small></span><span class="lf-t">' + ago(g.at) + '</span></button>';
    }).join('') : '<p class="lf-empty">' + esc(x.none) + '</p>';
    box.innerHTML = '<div class="lg-new"><b>' + esc(x.create) + '</b><div class="lg-emos">' + EMO.map(function (e) { return '<button type="button" class="' + (e === pick ? 'on' : '') + '" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>' +
      '<form class="lf-find" id="lgForm" autocomplete="off"><input id="lgName" maxlength="40" placeholder="' + esc(x.namePh) + '"><button type="submit">' + esc(x.go) + '</button></form><p class="lf-msg" id="lgMsg"></p></div><div class="lf-convs">' + items + '</div>';
    box.querySelectorAll('.lg-emos button').forEach(function (b) { b.addEventListener('click', function () { pick = b.getAttribute('data-e'); box.querySelectorAll('.lg-emos button').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('lgForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var r = await call('gCreate', { name: $('lgName').value, emoji: pick });
      if (r && r.ok) openGroup(r.g.id); else $('lgMsg').textContent = x[(r && r.reason) || 'fail'] || x.fail;
    });
    box.querySelectorAll('[data-g]').forEach(function (b) { b.addEventListener('click', function () { openGroup(b.getAttribute('data-g')); }); });
  }

  async function openGroup(gid) {
    var x = X();
    var j = await call('gGet', { gid: gid });
    if (!j || !j.ok) { toast(x.gGone, 'err'); list(); return; }
    cur = j.g;
    box.innerHTML = '<div class="lf-top"><button type="button" class="lf-back" id="lgBack" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="lg-head" id="lgHead"><span class="lf-av lg-emo">' + esc(cur.emoji) + '</span><span class="lf-who"><b>' + esc(cur.name) + '</b><small>' + esc(x.tapInfo) + '</small></span></button></div>' +
      '<div class="lg-info" id="lgInfo" hidden></div><div class="live-msgs" id="lgMsgs"></div>' +
      '<form class="live-send" id="lgSend" autocomplete="off"><label class="live-cam"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg><input type="file" id="lgFile" accept="image/*" hidden></label>' +
      '<div class="live-in-wrap"><div class="live-prev" id="lgPrev" hidden></div><textarea id="lgText" rows="1" maxlength="1000" placeholder="' + esc(x.ph) + '"></textarea></div><button type="submit" class="live-go" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg></button></form>';
    paintMsgs(cur.msgs);
    $('lgBack').addEventListener('click', list);
    $('lgHead').addEventListener('click', info);
    $('lgText').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(110, this.scrollHeight) + 'px'; });
    $('lgFile').addEventListener('change', async function () {
      var f = this.files && this.files[0]; this.value = ''; if (!f) return;
      try { img = await shrink(f); $('lgPrev').innerHTML = '<img src="' + img + '" alt="">'; $('lgPrev').hidden = false; } catch (e) { toast(x.badImg, 'err'); }
    });
    $('lgSend').addEventListener('submit', async function (e) {
      e.preventDefault();
      var t = $('lgText'), text = t.value.trim();
      if (!text && !img) return;
      var r = await call('gSend', { gid: cur.id, text: text, img: img });
      if (r && r.ok) { t.value = ''; t.style.height = 'auto'; img = ''; $('lgPrev').hidden = true; $('lgPrev').innerHTML = ''; refresh(); }
      else toast(x[(r && r.reason) || 'fail'] || x.fail, 'err');
    });
    stop();
    // gros groupe = lecture moins fréquente (protège le serveur)
    poll = setInterval(function () { if (!document.hidden) refresh(); }, cur && cur.n > 200 ? 12000 : 6000);
  }
  /* page d'infos du groupe (comme WhatsApp) : grande photo, nom, nombre de membres, boutons ronds, liste des membres, Quitter en rouge */
  var AVC = ['#F97316', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#14B8A6', '#EAB308', '#EF4444'];
  function avc(n) { var h = 0; String(n || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 997; }); return AVC[h % AVC.length]; }
  async function shareLink(copyOnly) {
    var x = X(), link = cur.link;
    if (!copyOnly) { try { if (navigator.share) { await navigator.share({ text: x.shareText + cur.name, url: link }); return; } } catch (e) { return; } }
    try { await navigator.clipboard.writeText(x.shareText + cur.name + ' ' + link); } catch (e) { /* ignore */ }
    toast(x.copied);
  }
  function info() {
    var x = X(), el = $('lgInfo'); if (!el || !cur) return;
    var ico = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; };
    el.innerHTML = '<div class="lgi-top"><button type="button" class="lf-back" id="lgiBack" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button></div>' +
      '<div class="lgi-hero"><span class="lgi-av">' + esc(cur.emoji) + '</span><b>' + esc(cur.name) + '</b><small>' + esc(x.group) + ' · ' + esc(cur.n === 1 ? x.n1 : x.n.replace('{n}', cur.n)) + '</small></div>' +
      '<div class="lgi-acts"><button type="button" id="lgiAdd">' + ico('<path d="M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 3 17.5V19M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 8v6M22 11h-6"/>') + '<span>' + esc(x.invite) + '</span></button>' +
      '<button type="button" id="lgiCopy">' + ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>') + '<span>' + esc(x.copyLink) + '</span></button>' +
      '<button type="button" id="lgiChat">' + ico('<path d="M4 5h16v11H8l-4 4z"/>') + '<span>' + esc(x.chat) + '</span></button></div>' +
      '<div class="lgi-sec"><p class="lgi-h">' + esc(cur.n === 1 ? x.n1 : x.n.replace('{n}', cur.n)) + '</p>' +
      '<button type="button" class="lgi-row add" id="lgiAdd2"><i>' + ico('<path d="M12 5v14M5 12h14"/>') + '</i><b>' + esc(x.addMem) + '</b></button>' +
      cur.members.map(function (m) {
        return '<div class="lgi-row"><i style="--av:' + avc(m.name) + '">' + esc((m.name || '?').charAt(0).toUpperCase()) + '</i><b>' + esc(m.name) + '</b>' +
          (m.owner ? '<em>' + esc(x.admin) + '</em>' : '') + (cur.owner && !m.owner ? '<button type="button" class="lgi-kick" data-k="' + esc(m.id) + '" data-n="' + esc(m.name) + '">' + esc(x.kick) + '</button>' : '') + '</div>';
      }).join('') + '</div>' +
      '<button type="button" class="lgi-exit" id="lgiExit">' + ico('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>') + '<span>' + esc(x.exit) + '</span></button>';
    el.hidden = false;
    var close = function () { el.hidden = true; };
    $('lgiBack').addEventListener('click', close); $('lgiChat').addEventListener('click', close);
    $('lgiAdd').addEventListener('click', function () { shareLink(false); });
    $('lgiAdd2').addEventListener('click', addMembers); // v2706 : AJOUTER = choisir ses contacts (comme WhatsApp) ; INVITER = le lien
    $('lgiCopy').addEventListener('click', function () { shareLink(true); });
    el.querySelectorAll('[data-k]').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!window.confirm(x.kickQ.replace('{n}', b.getAttribute('data-n')))) return;
        await call('gKick', { gid: cur.id, id: b.getAttribute('data-k') }); await refresh(); info();
      });
    });
    $('lgiExit').addEventListener('click', async function () { if (!window.confirm(x.leaveQ)) return; await call('gLeave', { gid: cur.id }); list(); });
  }
  /* v2706 (propriétaire) : « Ajouter des membres » — la liste de mes contacts (Mes amis), je coche, j'ajoute. */
  async function addMembers() {
    var x = X(), el = $('lgInfo'); if (!el || !cur) return;
    var j = await call('friends', {});
    var inG = {}; (cur.members || []).forEach(function (m) { inG[m.id] = 1; });
    var fr = (j && j.ok ? j.list : []).filter(function (f) { return !f.blocked; });
    var sel = {};
    el.innerHTML = '<div class="lgi-top"><button type="button" class="lf-back" id="lgaBack" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b class="lga-t">' + esc(x.addMem) + '</b></div>' +
      (fr.length ? '<input class="lga-q" id="lgaQ" placeholder="' + esc(x.search) + '" autocomplete="off"><div class="lga-list" id="lgaList">' + fr.map(function (f) {
        var on = !!inG[f.id];
        return '<button type="button" class="lgi-row lga-r' + (on ? ' in' : '') + '" data-id="' + esc(f.id) + '" data-n="' + esc(String(f.name || '').toLowerCase()) + '"' + (on ? ' disabled' : '') + '><i style="--av:' + avc(f.name) + '">' + esc((f.name || '?').charAt(0).toUpperCase()) + '</i><b>' + esc(f.name || f.id) + (on ? '<small>' + esc(x.inGrp) + '</small>' : '') + '</b><span class="lga-ck"></span></button>';
      }).join('') + '</div><button type="button" class="lga-go" id="lgaGo" disabled>' + esc(x.addN.replace('{n}', 0)) + '</button>'
        : '<p class="lf-empty">' + esc(x.pickNone) + '</p><button type="button" class="lga-go" id="lgaInv">' + esc(x.invite) + '</button>');
    el.hidden = false;
    $('lgaBack').addEventListener('click', info);
    if ($('lgaInv')) $('lgaInv').addEventListener('click', function () { shareLink(false); });
    if (!fr.length) return;
    var paint = function () { var n = Object.keys(sel).length; $('lgaGo').disabled = !n; $('lgaGo').textContent = x.addN.replace('{n}', n); };
    el.querySelectorAll('.lga-r:not(.in)').forEach(function (b) {
      b.addEventListener('click', function () { var id = b.getAttribute('data-id'); if (sel[id]) delete sel[id]; else sel[id] = 1; b.classList.toggle('on', !!sel[id]); paint(); });
    });
    $('lgaQ').addEventListener('input', function () { var q = this.value.trim().toLowerCase(); el.querySelectorAll('.lga-r').forEach(function (b) { b.hidden = !!q && b.getAttribute('data-n').indexOf(q) < 0 && b.getAttribute('data-id').toLowerCase().indexOf(q) < 0; }); });
    $('lgaGo').addEventListener('click', async function () {
      var ids = Object.keys(sel); if (!ids.length) return;
      this.disabled = true;
      var r = await call('gAdd', { gid: cur.id, ids: ids });
      if (r && r.ok) { cur = r.g; paintMsgs(cur.msgs); toast(x.added.replace('{n}', r.n)); info(); }
      else { toast(x[(r && r.reason) || 'fail'] || x.fail, 'err'); paint(); }
    });
  }
  async function refresh() { if (!cur) return; var j = await call('gGet', { gid: cur.id }); if (j && j.ok) { cur = j.g; paintMsgs(cur.msgs); } }
  function paintMsgs(msgs) {
    var el = $('lgMsgs'); if (!el) return;
    var stick = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
    var x = X();
    el.innerHTML = msgs.map(function (m) {
      if (m.sys === 'add') return '<div class="lg-sys">' + esc(x.sysAdd.replace('{a}', m.mine ? x.you : m.who).replace('{b}', m.whom)) + '</div>';
      return '<div class="lv-m ' + (m.mine ? 'u' : 'a') + '">' + (m.mine ? '' : '<em class="lg-who">' + esc(m.who) + '</em>') + (m.img ? '<img src="' + esc(m.img) + '" alt="" loading="lazy">' : '') + esc(m.t) + '<small>' + ago(m.at) + '</small></div>';
    }).join('');
    if (stick || !el.dataset.done) { el.scrollTop = 1e9; el.dataset.done = '1'; }
  }

  function open(target) {
    box = $('liveGroups'); if (!box) return;
    if (target) openGroup(target); else list();
  }
  // Lien d'invitation : orolado.com/?g=JETON → rejoindre le groupe (après inscription si besoin).
  function bootJoin() {
    var m = /[?&]g=([a-f0-9]{8,20})/.exec(location.search);
    if (!m) return;
    var tok = m[1];
    setTimeout(async function () {
      if (!D6.Live) return;
      D6.Live.open('groups');
      if (guest()) { try { sessionStorage.setItem('oro_gjoin', tok); } catch (e) { /* ignore */ } return; }
      var r = await call('gJoin', { tok: tok });
      if (r && r.ok) { toast(X().joined.replace('{n}', r.g.name)); open(r.g.id); } else toast(X()[(r && r.reason) || 'gGone'] || X().gGone, 'err');
    }, 1800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootJoin); else bootJoin();
  D6.LiveGroups = { open: open, stop: stop, inGroup: function () { return !!cur; }, back: list, title: function () { return X().title; }, sub: function () { return X().sub; } };
})(window.D6 = window.D6 || {});
