/* v2676 — « Live » : Actualités d'OROLADO + conversation avec l'équipe (texte + photos).
   Léger : rien ne tourne quand la page est fermée ; lecture du serveur seulement à l'ouverture
   (puis toutes les 15 s tant que la conversation est affichée). Serveur : live.php (fichiers à part). */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TXT = {
    fr: { sub: 'En ligne · l’équipe te répond ici', news: 'Actualités', chat: 'Écris-nous', ph: 'Écris ton message…', views: 'vues',
      welcomeNews: 'Bienvenue sur OROLADO Live ! 👋\nIci, tu trouves nos nouvelles : nouveautés, moyens de paiement, marchés qui bougent… Et dans « Écris-nous », tu peux parler directement à l’équipe.',
      welcomeChat: 'Bonjour 👋 Écris-nous ici, on te répond dans cette conversation.\nTu peux aussi envoyer une photo 📷 (par exemple la capture d’un paiement).',
      q1: '💳 Mon dépôt', q1t: 'Bonjour, j’ai un souci avec mon dépôt : ', q2: '💸 Mon retrait', q2t: 'Bonjour, j’ai une question sur mon retrait : ',
      q3: '📈 Comment jouer ?', q3t: 'Bonjour, comment bien jouer sur OROLADO ?', q4: '🔐 Mon compte', q4t: 'Bonjour, j’ai un souci avec mon compte : ',
      guestT: 'Inscris-toi pour écrire à l’équipe', guestB: 'Avec ton compte, tu peux nous écrire et envoyer des photos. On te répond ici.', guestBtn: 'Créer mon compte', guestMail: 'Écrire par e-mail',
      sent: 'Envoyé ✓', tooMany: 'Trop de messages. Réessaie dans un moment.', tooManyImg: 'Limite de 10 photos par jour atteinte.', badImg: 'Photo refusée. Essaie une autre image.',
      fail: 'Envoi impossible, réessaie.', team: 'OROLADO', now: 'à l’instant', min: 'min', h: 'h', d: 'j', terms: 'Conditions', privacy: 'Confidentialité', you: 'Toi',
      friends: 'Amis', myId: 'Ton identifiant', copy: 'Copier', copied: 'Copié ✓', idHint: 'Donne-le à tes amis pour qu’ils t’écrivent.', findPh: 'Identifiant d’un ami (OR…)', findGo: 'Écrire',
      notFound: 'Identifiant introuvable.', findLocked: 'Trop d’essais. Réessaie dans 1 heure.', self: 'C’est ton propre identifiant 😉', noConv: 'Aucune conversation pour l’instant. Partage ton identifiant !',
      block: '🚫 Bloquer', unblock: '✅ Débloquer', report: '🚩 Signaler', reportQ: 'Pourquoi signales-tu ce joueur ? (arnaque, insultes…)', reported: 'Merci, l’équipe va regarder. Ce joueur est bloqué.',
      youBlocked: 'Tu as bloqué ce joueur.', guestF: 'Inscris-toi pour écrire à tes amis', guestFB: 'Avec ton compte, tu reçois un identifiant secret et tu peux discuter avec tes amis.',
      safety: '🔒 Ne donne jamais ton mot de passe ni tes codes. OROLADO ne te les demandera jamais.' },
    en: { sub: 'Online · the team answers you here', news: 'News', chat: 'Write to us', ph: 'Write your message…', views: 'views',
      welcomeNews: 'Welcome to OROLADO Live! 👋\nHere you find our news: new features, payment methods, markets on the move… And in “Write to us”, you can talk directly to the team.',
      welcomeChat: 'Hello 👋 Write to us here, we answer in this conversation.\nYou can also send a photo 📷 (for example a payment screenshot).',
      q1: '💳 My deposit', q1t: 'Hello, I have an issue with my deposit: ', q2: '💸 My withdrawal', q2t: 'Hello, I have a question about my withdrawal: ',
      q3: '📈 How to play?', q3t: 'Hello, how do I play well on OROLADO?', q4: '🔐 My account', q4t: 'Hello, I have an issue with my account: ',
      guestT: 'Sign up to write to the team', guestB: 'With your account, you can write to us and send photos. We answer you here.', guestBtn: 'Create my account', guestMail: 'Write by e-mail',
      sent: 'Sent ✓', tooMany: 'Too many messages. Try again in a moment.', tooManyImg: 'Limit of 10 photos per day reached.', badImg: 'Photo refused. Try another image.',
      fail: 'Could not send, try again.', team: 'OROLADO', now: 'just now', min: 'min', h: 'h', d: 'd', terms: 'Terms', privacy: 'Privacy', you: 'You',
      friends: 'Friends', myId: 'Your ID', copy: 'Copy', copied: 'Copied ✓', idHint: 'Give it to your friends so they can write to you.', findPh: 'A friend’s ID (OR…)', findGo: 'Write',
      notFound: 'ID not found.', findLocked: 'Too many tries. Try again in 1 hour.', self: 'That’s your own ID 😉', noConv: 'No conversation yet. Share your ID!',
      block: '🚫 Block', unblock: '✅ Unblock', report: '🚩 Report', reportQ: 'Why are you reporting this player? (scam, insults…)', reported: 'Thanks, the team will check. This player is blocked.',
      youBlocked: 'You blocked this player.', guestF: 'Sign up to write to your friends', guestFB: 'With your account, you get a secret ID and can chat with your friends.',
      safety: '🔒 Never give your password or codes. OROLADO will never ask for them.' }
  };
  // v2682 — chinois
  TXT.zh = Object.assign({}, TXT.en, { sub: '在线 · 团队在这里回复你', news: '动态', chat: '联系我们', ph: '输入消息…', views: '次浏览',
    welcomeNews: '欢迎来到 OROLADO Live！👋\n这里有我们的最新消息：新功能、支付方式、正在波动的市场…… 在「联系我们」里，你可以直接和团队对话。',
    welcomeChat: '你好 👋 在这里给我们留言，我们会在此对话中回复你。\n你也可以发送照片 📷（例如付款截图）。',
    q1: '💳 我的充值', q1t: '你好，我的充值有问题：', q2: '💸 我的提现', q2t: '你好，我想咨询提现：', q3: '📈 怎么交易？', q3t: '你好，在 OROLADO 上怎么交易更好？', q4: '🔐 我的账户', q4t: '你好，我的账户有问题：',
    guestT: '注册后即可联系团队', guestB: '有了账户，你就能给我们留言并发送照片，我们会在这里回复你。', guestBtn: '创建账户', guestMail: '通过邮件联系',
    sent: '已发送 ✓', tooMany: '消息太多，请稍后再试。', tooManyImg: '今天的照片已达上限。', badImg: '照片无法发送，请换一张。', fail: '发送失败，请重试。',
    now: '刚刚', min: '分钟', h: '小时', d: '天', terms: '条款', privacy: '隐私', you: '你',
    friends: '好友', myId: '你的 ID', copy: '复制', copied: '已复制 ✓', idHint: '把它发给好友，他们就能联系你。', findPh: '好友 ID（OR…）', findGo: '发消息',
    notFound: '找不到这个 ID。', findLocked: '尝试次数过多，请 1 小时后再试。', self: '这是你自己的 ID 😉', noConv: '还没有对话。分享你的 ID 吧！',
    block: '🚫 屏蔽', unblock: '✅ 取消屏蔽', report: '🚩 举报', reportQ: '为什么举报这位玩家？（诈骗、辱骂……）', reported: '谢谢，团队会查看。该玩家已被屏蔽。',
    youBlocked: '你已屏蔽该玩家。', guestF: '注册后即可和好友聊天', guestFB: '有了账户，你会获得专属 ID，可以和好友聊天。',
    safety: '🔒 永远不要透露你的密码或验证码。OROLADO 绝不会向你索要。' });
  function L() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return TXT[l] || TXT.en; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function linkify(s) { return esc(s).replace(/(https:\/\/[^\s<]+|orolado\.com)/g, function (u) { var h = u.indexOf('http') === 0 ? u : 'https://' + u; return '<a href="' + h + '" target="_blank" rel="noopener">' + u + '</a>'; }); }
  function ago(t) {
    var x = L(), s = Math.max(0, Math.floor(Date.now() / 1000 - t));
    if (s < 60) return x.now; if (s < 3600) return Math.floor(s / 60) + ' ' + x.min; if (s < 86400) return Math.floor(s / 3600) + ' ' + x.h; return Math.floor(s / 86400) + ' ' + x.d;
  }
  function guest() { return document.documentElement.classList.contains('oro-guest') || !(D6.Api && D6.Api.token && D6.Api.token()); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } return v; }

  var tab = 'news', timer = 0, pendingImg = '', busy = false, lastMsgs = [];
  async function call(action, data) {
    try {
      var r = await fetch('live.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(Object.assign({ action: action, token: (D6.Api && D6.Api.token) ? D6.Api.token() : '' }, data || {})) });
      return await r.json();
    } catch (e) { return null; }
  }

  var LOGO = '<span class="lv-av"><img src="icons/icon-192.png?v=2657" alt=""></span>';
  function paintNews(posts) {
    var x = L(), html = '';
    var seen = store('oro_live_seen') || [], liked = store('oro_live_liked') || [], fresh = [];
    posts.forEach(function (p) {
      if (seen.indexOf(p.id) < 0) { fresh.push(p.id); seen.push(p.id); }
      var on = liked.indexOf(p.id) >= 0;
      html += '<article class="lv-post">' + '<header>' + LOGO + '<div><b>' + x.team + ' <i class="lv-tick" aria-hidden="true"></i></b><small>' + ago(p.at) + '</small></div></header>' +
        (p.t ? '<p>' + linkify(p.t) + '</p>' : '') + (p.img ? '<img class="lv-pimg" src="' + esc(p.img) + '" alt="" loading="lazy">' : '') +
        (p.link ? '<a class="lv-link" href="' + esc(p.link) + '" target="_blank" rel="noopener">▶ ' + esc(p.link.replace(/^https:\/\/(www\.)?/, '').slice(0, 42)) + '</a>' : '') +
        '<footer><button type="button" class="lv-like' + (on ? ' on' : '') + '" data-id="' + esc(p.id) + '">' + (on ? '❤️' : '🤍') + ' <span>' + (p.likes + (on && fresh.indexOf(p.id) < 0 ? 0 : 0)) + '</span></button><span class="lv-views">👁 ' + p.views + ' ' + x.views + '</span></footer></article>';
    });
    html += '<article class="lv-post lv-welcome"><header>' + LOGO + '<div><b>' + x.team + ' <i class="lv-tick" aria-hidden="true"></i></b><small>OROLADO Live</small></div></header><p>' + linkify(x.welcomeNews) + '</p></article>';
    html += '<div class="lv-legal"><button type="button" id="lvTerms">' + x.terms + '</button> · <button type="button" id="lvPriv">' + x.privacy + '</button></div>';
    $('liveFeed').innerHTML = html;
    if (fresh.length) { store('oro_live_seen', seen.slice(-200)); call('seen', { ids: fresh }); }
    $('liveFeed').querySelectorAll('.lv-like').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id'), lk = store('oro_live_liked') || [];
        if (lk.indexOf(id) >= 0) return;
        lk.push(id); store('oro_live_liked', lk.slice(-200)); b.classList.add('on');
        b.innerHTML = '❤️ <span>' + ((parseInt(b.textContent.replace(/\D/g, ''), 10) || 0) + 1) + '</span>';
        call('like', { ids: [id] });
      });
    });
    var tr = $('btnHelpTerms'), pv = $('btnHelpPrivacy');
    if ($('lvTerms') && tr) $('lvTerms').addEventListener('click', function () { tr.click(); });
    if ($('lvPriv') && pv) $('lvPriv').addEventListener('click', function () { pv.click(); });
  }

  function paintChat(me) {
    var x = L();
    var g = guest();
    $('liveGuest').hidden = !g; $('liveForm').hidden = g; $('liveQuick').hidden = g;
    var html = '<div class="lv-m a lv-hello">' + linkify(x.welcomeChat) + '</div>';
    lastMsgs = (me && me.msgs) || [];
    lastMsgs.forEach(function (m) {
      html += '<div class="lv-m ' + (m.f === 'a' ? 'a' : 'u') + '">' + (m.img ? '<img src="' + esc(m.img) + '" alt="" loading="lazy">' : '') + (m.t ? linkify(m.t) : '') + '<small>' + (m.f === 'a' ? x.team + ' · ' : '') + ago(m.at) + '</small></div>';
    });
    $('liveMsgs').innerHTML = html;
    $('liveMsgs').scrollTop = 1e9;
    if (g) {
      $('liveGuest').innerHTML = '<b>' + x.guestT + '</b><p>' + x.guestB + '</p><button type="button" class="lv-btn" id="lvSignup">' + x.guestBtn + '</button><button type="button" class="lv-link2" id="lvMail">' + x.guestMail + '</button>';
      $('lvSignup').addEventListener('click', function () { close(); if (D6.App && D6.App.showAuth) D6.App.showAuth('register'); });
      $('lvMail').addEventListener('click', function () { close(); if (D6.App && D6.App.openModal) D6.App.openModal('helpModal'); });
    } else if (!lastMsgs.length) {
      $('liveQuick').innerHTML = ['q1', 'q2', 'q3', 'q4'].map(function (k) { return '<button type="button" data-q="' + k + '">' + x[k] + '</button>'; }).join('');
      $('liveQuick').querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { var t = $('liveText'); t.value = x[b.getAttribute('data-q') + 't']; t.focus(); grow(); });
      });
    } else { $('liveQuick').innerHTML = ''; }
  }

  var dmUn = 0;
  function setBadge(n) {
    var b = $('liveBadge'); if (b) b.textContent = n > 0 ? String(n) : '';
    var btn = $('btnHelp'); if (btn) btn.classList.toggle('lv-has', n > 0 || dmUn > 0);
  }

  async function load(read) {
    var j = await call('feed', { read: read ? 1 : 0 });
    if (!j || !j.ok) return;
    if (tab === 'news') paintNews(j.posts || []);
    paintChat(j.me);
    if (j.me) { dmUn = j.me.dmUnread || 0; var bf = $('liveBadgeF'); if (bf) bf.textContent = dmUn > 0 ? String(dmUn) : ''; }
    setBadge(read ? 0 : ((j.me && j.me.unread) || 0));
  }

  /* ---------- v2680 — AMIS ---------- */
  var peer = null, fImg = '', fBusy = false;
  function initial(n) { n = String(n || '?').trim(); return esc((n.charAt(0) || '?').toUpperCase()); }
  function setFriendBadge(n) { var b = $('liveBadgeF'); if (b) b.textContent = n > 0 ? String(n) : ''; }
  async function friendsList() {
    var x = L();
    if (guest()) {
      $('lfList').hidden = true; $('lfConv').hidden = true; $('lfGuest').hidden = false;
      $('lfGuest').innerHTML = '<b>' + x.guestF + '</b><p>' + x.guestFB + '</p><button type="button" class="lv-btn" id="lfSignup">' + x.guestBtn + '</button>';
      $('lfSignup').addEventListener('click', function () { close(); if (D6.App && D6.App.showAuth) D6.App.showAuth('register'); });
      return;
    }
    $('lfGuest').hidden = true; $('lfConv').hidden = true; $('lfList').hidden = false; peer = null;
    $('lfFindIn').placeholder = x.findPh; $('lfFindGo').textContent = x.findGo;
    var j = await call('friends', {});
    if (!j || !j.ok) return;
    $('lfMe').innerHTML = '<div><small>' + x.myId + '</small><b class="lf-myid">' + esc(j.me) + '</b><small>' + x.idHint + '</small></div><button type="button" id="lfCopy">' + x.copy + '</button>';
    $('lfCopy').addEventListener('click', function () {
      var b = this;
      try { navigator.clipboard.writeText(j.me); } catch (e) { /* ignore */ }
      b.textContent = x.copied; setTimeout(function () { b.textContent = x.copy; }, 1600);
    });
    var un = 0;
    $('lfConvs').innerHTML = j.list.length ? j.list.map(function (c) {
      if (c.un) un++;
      return '<button type="button" class="lf-c' + (c.un ? ' un' : '') + '" data-id="' + esc(c.id) + '"><span class="lf-av">' + initial(c.name) + '</span><span class="lf-ct"><b>' + esc(c.name) + (c.blocked ? ' 🚫' : '') + '</b><small>' + esc(c.last) + '</small></span><span class="lf-t">' + ago(c.at) + (c.un ? '<i>' + c.un + '</i>' : '') + '</span></button>';
    }).join('') : '<p class="lf-empty">' + x.noConv + '</p>';
    setFriendBadge(un);
    $('lfConvs').querySelectorAll('.lf-c').forEach(function (b) { b.addEventListener('click', function () { openDm(b.getAttribute('data-id')); }); });
  }
  async function openDm(id) {
    var x = L();
    var j = await call('dm', { id: id });
    if (!j || !j.ok) { $('lfFindMsg').textContent = x[(j && j.reason) || 'notFound'] || x.notFound; return; }
    peer = j.peer;
    $('lfList').hidden = true; $('lfConv').hidden = false; $('lfMenu').hidden = true;
    $('lfAv').innerHTML = initial(peer.name); $('lfName').textContent = peer.name; $('lfId').textContent = peer.id;
    $('lfBlock').textContent = j.blocked ? x.unblock : x.block; $('lfBlock').setAttribute('data-on', j.blocked ? '0' : '1');
    $('lfReport').textContent = x.report;
    $('lfText').placeholder = x.ph;
    paintDm(j.msgs, j.blocked);
  }
  function paintDm(msgs, blocked) {
    var x = L();
    var html = '<div class="lv-m a lf-safe">' + esc(x.safety) + '</div>';
    msgs.forEach(function (m) {
      html += '<div class="lv-m ' + (m.mine ? 'u' : 'a') + '">' + (m.img ? '<img src="' + esc(m.img) + '" alt="" loading="lazy">' : '') + (m.t ? linkify(m.t) : '') + '<small>' + ago(m.at) + '</small></div>';
    });
    if (blocked) html += '<div class="lf-blocked">' + esc(x.youBlocked) + '</div>';
    $('lfMsgs').innerHTML = html; $('lfMsgs').scrollTop = 1e9;
    $('lfForm').hidden = !!blocked;
  }
  async function refreshDm() { if (!peer) return; var j = await call('dm', { id: peer.id }); if (j && j.ok) paintDm(j.msgs, j.blocked); }
  async function sendDm(e) {
    if (e) e.preventDefault();
    if (fBusy || !peer) return;
    var x = L(), t = $('lfText'), text = t.value.trim();
    if (!text && !fImg) return;
    fBusy = true; $('lfGo').disabled = true;
    var j = await call('dmSend', { id: peer.id, text: text, img: fImg });
    fBusy = false; $('lfGo').disabled = false;
    if (j && j.ok) { t.value = ''; t.style.height = 'auto'; fImg = ''; $('lfPrev').hidden = true; $('lfPrev').innerHTML = ''; refreshDm(); }
    else if (D6.App && D6.App.toast) D6.App.toast(x[(j && j.reason) || 'fail'] || x.fail, 'err');
  }
  function bootFriends() {
    $('lfFind').addEventListener('submit', async function (e) {
      e.preventDefault();
      var x = L(), v = $('lfFindIn').value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      $('lfFindMsg').textContent = '';
      if (v.length < 12) { $('lfFindMsg').textContent = x.notFound; return; }
      var j = await call('find', { id: v });
      if (j && j.ok) { $('lfFindIn').value = ''; openDm(j.peer.id); }
      else $('lfFindMsg').textContent = x[(j && j.reason) || 'notFound'] || x.notFound;
    });
    $('lfBack').addEventListener('click', friendsList);
    $('lfMore').addEventListener('click', function () { $('lfMenu').hidden = !$('lfMenu').hidden; });
    $('lfBlock').addEventListener('click', async function () {
      if (!peer) return;
      var on = this.getAttribute('data-on') === '1';
      await call('block', { id: peer.id, on: on ? 1 : 0 });
      openDm(peer.id);
    });
    $('lfReport').addEventListener('click', async function () {
      if (!peer) return;
      var x = L(), why = window.prompt(x.reportQ, '');
      if (why === null) return;
      await call('report', { id: peer.id, why: why });
      if (D6.App && D6.App.toast) D6.App.toast(x.reported, 'ok');
      openDm(peer.id);
    });
    $('lfForm').addEventListener('submit', sendDm);
    $('lfText').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(110, this.scrollHeight) + 'px'; });
    $('lfFile').addEventListener('change', async function () {
      var f = this.files && this.files[0]; this.value = '';
      if (!f) return;
      try {
        fImg = await shrink(f);
        $('lfPrev').innerHTML = '<img src="' + fImg + '" alt=""><button type="button" aria-label="x">✕</button>';
        $('lfPrev').hidden = false;
        $('lfPrev').querySelector('button').addEventListener('click', function () { fImg = ''; $('lfPrev').hidden = true; $('lfPrev').innerHTML = ''; });
      } catch (err) { if (D6.App && D6.App.toast) D6.App.toast(L().badImg, 'err'); }
    });
  }

  function show(w) {
    tab = w;
    $('liveTabNews').classList.toggle('on', w === 'news'); $('liveTabChat').classList.toggle('on', w === 'chat'); $('liveTabFriends').classList.toggle('on', w === 'friends');
    $('livePaneNews').hidden = w !== 'news'; $('livePaneChat').hidden = w !== 'chat'; $('livePaneFriends').hidden = w !== 'friends';
    clearInterval(timer);
    if (w === 'friends') {
      friendsList();
      if (!guest()) timer = setInterval(function () { if (!document.hidden) { if (peer) refreshDm(); else friendsList(); } }, 15000);
      return;
    }
    load(w === 'chat');
    if (w === 'chat' && !guest()) timer = setInterval(function () { if (!document.hidden) load(true); }, 15000);
  }

  function open(w) {
    var x = L();
    $('liveSub').textContent = x.sub; $('liveTabNewsT').textContent = x.news; $('liveTabChatT').textContent = x.chat; $('liveText').placeholder = x.ph;
    if ($('liveTabFriendsT')) $('liveTabFriendsT').textContent = x.friends;
    if (D6.App && D6.App.openModal) D6.App.openModal('liveModal');
    show(w || (($('liveBadge') && $('liveBadge').textContent) ? 'chat' : (dmUn > 0 ? 'friends' : 'news')));
  }
  function close() { clearInterval(timer); if (D6.App && D6.App.closeModal) D6.App.closeModal('liveModal'); }

  function grow() { var t = $('liveText'); t.style.height = 'auto'; t.style.height = Math.min(110, t.scrollHeight) + 'px'; }

  // Photo réduite sur le téléphone (≤ 1280 px, JPEG ≤ ~380 Ko) : léger pour le serveur et la 4G.
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

  async function send(e) {
    if (e) e.preventDefault();
    if (busy) return;
    var x = L(), t = $('liveText'), text = t.value.trim();
    if (!text && !pendingImg) return;
    busy = true; $('liveGo').disabled = true;
    var j = await call('send', { text: text, img: pendingImg });
    busy = false; $('liveGo').disabled = false;
    if (j && j.ok) {
      t.value = ''; grow(); pendingImg = ''; $('livePrev').hidden = true; $('livePrev').innerHTML = '';
      lastMsgs.push(j.msg); paintChat({ msgs: lastMsgs });
    } else if (j && j.login) { close(); if (D6.App && D6.App.showAuth) D6.App.showAuth('login'); }
    else if (D6.App && D6.App.toast) D6.App.toast(x[(j && j.reason) || 'fail'] || x.fail, 'err');
  }

  function boot() {
    if (!$('liveModal')) return;
    $('closeLive').addEventListener('click', close);
    $('liveModal').addEventListener('click', function (e) { if (e.target === $('liveModal')) close(); });
    $('liveTabNews').addEventListener('click', function () { show('news'); });
    $('liveTabChat').addEventListener('click', function () { show('chat'); });
    if ($('liveTabFriends')) { $('liveTabFriends').addEventListener('click', function () { show('friends'); }); bootFriends(); }
    $('liveForm').addEventListener('submit', send);
    $('liveText').addEventListener('input', grow);
    $('liveFile').addEventListener('change', async function () {
      var f = this.files && this.files[0]; this.value = '';
      if (!f) return;
      try {
        pendingImg = await shrink(f);
        $('livePrev').innerHTML = '<img src="' + pendingImg + '" alt=""><button type="button" aria-label="x">✕</button>';
        $('livePrev').hidden = false;
        $('livePrev').querySelector('button').addEventListener('click', function () { pendingImg = ''; $('livePrev').hidden = true; $('livePrev').innerHTML = ''; });
      } catch (err) { if (D6.App && D6.App.toast) D6.App.toast(L().badImg, 'err'); }
    });
    // Réponse de l'équipe reçue en notification (lien /?live=1) → la conversation s'ouvre.
    try { if (/[?&]live=1/.test(location.search)) setTimeout(function () { open('chat'); }, 1500); else if (/[?&]live=amis/.test(location.search)) setTimeout(function () { open('friends'); }, 1500); } catch (e) { /* ignore */ }
    // Pastille « réponse non lue » sur le bouton Live : une seule lecture, 6 s après l'ouverture du site.
    setTimeout(async function () {
      if (guest()) return;
      var j = await call('feed', {});
      if (j && j.ok && j.me) { dmUn = j.me.dmUnread || 0; var bf = $('liveBadgeF'); if (bf) bf.textContent = dmUn > 0 ? String(dmUn) : ''; setBadge(j.me.unread || 0); }
    }, 6000);
  }

  D6.Live = { open: open, close: close };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.D6 = window.D6 || {});
