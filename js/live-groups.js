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
      gName: 'Donne un nom à ton groupe (2 lettres minimum).', gGone: 'Ce groupe n’est plus disponible.', gFull: 'Ce groupe est complet.', tooMany: 'Limite atteinte, réessaie plus tard.', badImg: 'Photo refusée.', fail: 'Échec, réessaie.', back: 'Mes groupes' },
    en: { title: 'My groups', sub: 'Chat with many friends', create: 'Create a group', namePh: 'Group name (e.g. Lagos traders)', go: 'Create', none: 'You have no group yet. Create yours and invite your friends with a link!',
      invite: 'Invite', members: 'Members', leave: 'Leave', leaveQ: 'Leave this group?', copied: 'Link copied ✓ Send it to your friends (WhatsApp, Telegram…)', shareText: 'Join my group on OROLADO: ',
      n: '{n} members', n1: '1 member', owner: 'creator', kick: 'Remove', kickQ: 'Remove {n} from the group?', ph: 'Write to the group…', joined: 'Welcome to the group {n}!', login: 'Sign up to join this group',
      gName: 'Give your group a name (at least 2 letters).', gGone: 'This group is no longer available.', gFull: 'This group is full.', tooMany: 'Limit reached, try again later.', badImg: 'Photo refused.', fail: 'Failed, try again.', back: 'My groups' },
    zh: { title: '我的群组', sub: '多人聊天', create: '创建群组', namePh: '群组名称（例如：交易达人群）', go: '创建', none: '你还没有群组。创建一个，用链接邀请好友吧！',
      invite: '邀请', members: '成员', leave: '退出', leaveQ: '退出这个群组？', copied: '链接已复制 ✓ 发给你的好友（WhatsApp、Telegram…）', shareText: '加入我在 OROLADO 的群组：',
      n: '{n} 位成员', n1: '1 位成员', owner: '创建者', kick: '移除', kickQ: '将 {n} 移出群组？', ph: '给群组发消息…', joined: '欢迎加入群组 {n}！', login: '注册即可加入该群组',
      gName: '请给群组起个名字（至少 2 个字）。', gGone: '该群组已失效。', gFull: '该群组已满。', tooMany: '已达上限，请稍后再试。', badImg: '照片无法发送。', fail: '失败，请重试。', back: '我的群组' }
  };
  (D6.LIVE_T = D6.LIVE_T || {}).groups = T;
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return T[l] || T.en; }
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
    box.innerHTML = '<div class="lf-top"><button type="button" class="lf-back" id="lgBack" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><span class="lf-av lg-emo">' + esc(cur.emoji) + '</span><div class="lf-who"><b>' + esc(cur.name) + '</b><small>' + esc(cur.n === 1 ? x.n1 : x.n.replace('{n}', cur.n)) + '</small></div></div>' +
      '<div class="lg-acts"><button type="button" id="lgInv">🔗 ' + esc(x.invite) + '</button><button type="button" id="lgMem">👥 ' + esc(x.members) + '</button><button type="button" id="lgLeave">🚪 ' + esc(x.leave) + '</button></div>' +
      '<div class="lg-mem" id="lgMemBox" hidden></div><div class="live-msgs" id="lgMsgs"></div>' +
      '<form class="live-send" id="lgSend" autocomplete="off"><label class="live-cam"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg><input type="file" id="lgFile" accept="image/*" hidden></label>' +
      '<div class="live-in-wrap"><div class="live-prev" id="lgPrev" hidden></div><textarea id="lgText" rows="1" maxlength="1000" placeholder="' + esc(x.ph) + '"></textarea></div><button type="submit" class="live-go" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg></button></form>';
    paintMsgs(cur.msgs);
    $('lgBack').addEventListener('click', list);
    $('lgInv').addEventListener('click', async function () {
      var link = cur.link;
      try { if (navigator.share) { await navigator.share({ text: x.shareText + cur.name, url: link }); return; } } catch (e) { /* ignore */ }
      try { await navigator.clipboard.writeText(x.shareText + cur.name + ' ' + link); } catch (e) { /* ignore */ }
      toast(x.copied);
    });
    $('lgMem').addEventListener('click', function () {
      var mb = $('lgMemBox'); mb.hidden = !mb.hidden;
      mb.innerHTML = cur.members.map(function (m) {
        return '<div class="lg-m"><span class="lf-av">' + esc((m.name || '?').charAt(0).toUpperCase()) + '</span><b>' + esc(m.name) + (m.owner ? ' · <i>' + esc(x.owner) + '</i>' : '') + '</b>' +
          (cur.owner && !m.owner ? '<button type="button" data-k="' + esc(m.id) + '" data-n="' + esc(m.name) + '">' + esc(x.kick) + '</button>' : '') + '</div>';
      }).join('');
      mb.querySelectorAll('[data-k]').forEach(function (b) {
        b.addEventListener('click', async function () {
          if (!window.confirm(x.kickQ.replace('{n}', b.getAttribute('data-n')))) return;
          await call('gKick', { gid: cur.id, id: b.getAttribute('data-k') }); openGroup(cur.id);
        });
      });
    });
    $('lgLeave').addEventListener('click', async function () { if (!window.confirm(x.leaveQ)) return; await call('gLeave', { gid: cur.id }); list(); });
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
  async function refresh() { if (!cur) return; var j = await call('gGet', { gid: cur.id }); if (j && j.ok) { cur = j.g; paintMsgs(cur.msgs); } }
  function paintMsgs(msgs) {
    var el = $('lgMsgs'); if (!el) return;
    var stick = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
    el.innerHTML = msgs.map(function (m) {
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
