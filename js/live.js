/* v2676 — « Live » : Actualités d'OROLADO + conversation avec l'équipe (texte + photos).
   Léger : rien ne tourne quand la page est fermée ; lecture du serveur seulement à l'ouverture
   (puis toutes les 15 s tant que la conversation est affichée). Serveur : live.php (fichiers à part). */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TXT = {
    fr: { sub: 'En ligne · l’équipe te répond ici', news: 'Actualités', chat: 'Écris-nous', ph: 'Écris ton message…', views: 'vues',
      welcomeNews: 'Bienvenue sur OROLADO Social ! 👋\nIci, tu trouves nos nouvelles : nouveautés, moyens de paiement, marchés qui bougent… Et dans « Écris-nous », tu peux parler directement à l’équipe.',
      welcomeChat: 'Bonjour 👋 Écris-nous ici, on te répond dans cette conversation.\nTu peux aussi envoyer une photo 📷 (par exemple la capture d’un paiement) ou une note vocale 🎤.',
      q1: '💳 Mon dépôt', q1t: 'Bonjour, j’ai un souci avec mon dépôt : ', q2: '💸 Mon retrait', q2t: 'Bonjour, j’ai une question sur mon retrait : ',
      q3: '📈 Comment jouer ?', q3t: 'Bonjour, comment bien jouer sur OROLADO ?', q4: '🔐 Mon compte', q4t: 'Bonjour, j’ai un souci avec mon compte : ',
      guestT: 'Inscris-toi pour écrire à l’équipe', guestB: 'Avec ton compte, tu peux nous écrire et envoyer des photos. On te répond ici.', guestBtn: 'Créer mon compte', guestMail: 'Écrire par e-mail',
      sent: 'Envoyé ✓', tooMany: 'Trop de messages. Réessaie dans un moment.', tooManyImg: 'Limite de 10 photos par jour atteinte.', badImg: 'Photo refusée. Essaie une autre image.',
      fail: 'Envoi impossible, réessaie.', team: 'OROLADO', now: 'à l’instant', min: 'min', h: 'h', d: 'j', terms: 'Conditions', privacy: 'Confidentialité', you: 'Toi',
      friends: 'Amis', myId: 'Ton identifiant', copy: 'Copier', copied: 'Copié ✓', idHint: 'Donne-le à tes amis pour qu’ils t’écrivent.', findPh: 'Identifiant (R…) ou e-mail d’un ami', findGo: 'Écrire',
      notFound: 'Identifiant introuvable.', findLocked: 'Trop d’essais. Réessaie dans 1 heure.', self: 'C’est ton propre identifiant 😉', noConv: 'Aucune conversation pour l’instant. Partage ton identifiant !',
      block: '🚫 Bloquer', unblock: '✅ Débloquer', report: '🚩 Signaler', reportQ: 'Pourquoi signales-tu ce joueur ? (arnaque, insultes…)', reported: 'Merci, l’équipe va regarder. Ce joueur est bloqué.',
      youBlocked: 'Tu as bloqué ce joueur.', guestF: 'Inscris-toi pour écrire à tes amis', guestFB: 'Avec ton compte, tu reçois un identifiant secret et tu peux discuter avec tes amis.',
      safety: '🔒 Ne donne jamais ton mot de passe ni tes codes. OROLADO ne te les demandera jamais.',
      duelBtn: 'Défier', duelPick: 'Défie ton ami en démo', duelPickS: 'Choisis la durée. Celui qui gagne le plus en démo remporte le défi.', duelSent: 'Défi envoyé · {m} min · en attente de {n}…', duelInvite: '{n} te défie !', duelInviteS: '{m} minutes en démo : celui qui gagne le plus remporte le défi.', accept: 'Accepter', refuse: 'Refuser', duelStartIn: 'Le défi commence dans {s} s', duelLive: 'Défi en cours', duelLeft: 'reste {t}', duelPlay: 'Jouer en démo', duelWin: '🏆 Tu as gagné le défi !', duelLose: '{n} a gagné le défi', duelTie: 'Égalité !', duelAgain: 'Revanche', duelRefused: '{n} a refusé le défi.', duelExpired: 'Le défi n’a pas été accepté à temps.', duelBusy: 'Un défi est déjà en cours avec cet ami.', duelGone: 'Ce défi n’est plus disponible.', duelRecord: 'Tes défis : {w} gagnés · {l} perdus', duelTrades: '{n} trades', duelWait: 'Résultat dans un instant…', duelPromoT: 'Défie ton ami en démo', duelPromoS: 'Invite ton ami : vous tradez en même temps en démo (3, 5 ou 10 min) et on voit qui est le plus fort. Montre-lui qui est le boss !', duelPromoBtn: 'Défier un ami', inviteBadge: 'défi', emptyT: 'Ajoute ton premier ami', emptyS: 'Envoie-lui ton identifiant, ou colle le sien juste au-dessus.', share: 'Envoyer mon identifiant', shareTxt: 'Ajoute-moi sur OROLADO Live ! Mon identifiant : {id}' },
    en: { sub: 'Online · the team answers you here', news: 'News', chat: 'Write to us', ph: 'Write your message…', views: 'views',
      welcomeNews: 'Welcome to OROLADO Social! 👋\nHere you find our news: new features, payment methods, markets on the move… And in “Write to us”, you can talk directly to the team.',
      welcomeChat: 'Hello 👋 Write to us here, we answer in this conversation.\nYou can also send a photo 📷 (for example a payment screenshot) or a voice note 🎤.',
      q1: '💳 My deposit', q1t: 'Hello, I have an issue with my deposit: ', q2: '💸 My withdrawal', q2t: 'Hello, I have a question about my withdrawal: ',
      q3: '📈 How to play?', q3t: 'Hello, how do I play well on OROLADO?', q4: '🔐 My account', q4t: 'Hello, I have an issue with my account: ',
      guestT: 'Sign up to write to the team', guestB: 'With your account, you can write to us and send photos. We answer you here.', guestBtn: 'Create my account', guestMail: 'Write by e-mail',
      sent: 'Sent ✓', tooMany: 'Too many messages. Try again in a moment.', tooManyImg: 'Limit of 10 photos per day reached.', badImg: 'Photo refused. Try another image.',
      fail: 'Could not send, try again.', team: 'OROLADO', now: 'just now', min: 'min', h: 'h', d: 'd', terms: 'Terms', privacy: 'Privacy', you: 'You',
      friends: 'Friends', myId: 'Your ID', copy: 'Copy', copied: 'Copied ✓', idHint: 'Give it to your friends so they can write to you.', findPh: 'A friend’s ID (R…) or email', findGo: 'Write',
      notFound: 'ID not found.', findLocked: 'Too many tries. Try again in 1 hour.', self: 'That’s your own ID 😉', noConv: 'No conversation yet. Share your ID!',
      block: '🚫 Block', unblock: '✅ Unblock', report: '🚩 Report', reportQ: 'Why are you reporting this player? (scam, insults…)', reported: 'Thanks, the team will check. This player is blocked.',
      youBlocked: 'You blocked this player.', guestF: 'Sign up to write to your friends', guestFB: 'With your account, you get a secret ID and can chat with your friends.',
      safety: '🔒 Never give your password or codes. OROLADO will never ask for them.',
      duelBtn: 'Challenge', duelPick: 'Challenge your friend in demo', duelPickS: 'Pick the duration. Whoever wins the most in demo wins the challenge.', duelSent: 'Challenge sent · {m} min · waiting for {n}…', duelInvite: '{n} challenges you!', duelInviteS: '{m} minutes in demo: whoever wins the most wins the challenge.', accept: 'Accept', refuse: 'Decline', duelStartIn: 'The challenge starts in {s} s', duelLive: 'Challenge in progress', duelLeft: '{t} left', duelPlay: 'Play in demo', duelWin: '🏆 You won the challenge!', duelLose: '{n} won the challenge', duelTie: 'It’s a tie!', duelAgain: 'Rematch', duelRefused: '{n} declined the challenge.', duelExpired: 'The challenge was not accepted in time.', duelBusy: 'A challenge is already running with this friend.', duelGone: 'This challenge is no longer available.', duelRecord: 'Your challenges: {w} won · {l} lost', duelTrades: '{n} trades', duelWait: 'Result in a moment…', duelPromoT: 'Challenge your friend in demo', duelPromoS: 'Invite your friend: you both trade at the same time in demo (3, 5 or 10 min) and we see who is the strongest. Show them who is the boss!', duelPromoBtn: 'Challenge a friend', inviteBadge: 'challenge', emptyT: 'Add your first friend', emptyS: 'Send them your ID, or paste theirs just above.', share: 'Send my ID', shareTxt: 'Add me on OROLADO Live! My ID: {id}' }
  };
  // v2682 — chinois
  TXT.zh = Object.assign({}, TXT.en, { sub: '在线 · 团队在这里回复你', news: '动态', chat: '联系我们', ph: '输入消息…', views: '次浏览',
    welcomeNews: '欢迎来到 OROLADO 社交！👋\n这里有我们的最新消息：新功能、支付方式、正在波动的市场…… 在「联系我们」里，你可以直接和团队对话。',
    welcomeChat: '你好 👋 在这里给我们留言，我们会在此对话中回复你。\n你也可以发送照片 📷（例如付款截图）。',
    q1: '💳 我的充值', q1t: '你好，我的充值有问题：', q2: '💸 我的提现', q2t: '你好，我想咨询提现：', q3: '📈 怎么交易？', q3t: '你好，在 OROLADO 上怎么交易更好？', q4: '🔐 我的账户', q4t: '你好，我的账户有问题：',
    guestT: '注册后即可联系团队', guestB: '有了账户，你就能给我们留言并发送照片，我们会在这里回复你。', guestBtn: '创建账户', guestMail: '通过邮件联系',
    sent: '已发送 ✓', tooMany: '消息太多，请稍后再试。', tooManyImg: '今天的照片已达上限。', badImg: '照片无法发送，请换一张。', fail: '发送失败，请重试。',
    now: '刚刚', min: '分钟', h: '小时', d: '天', terms: '条款', privacy: '隐私', you: '你',
    friends: '好友', myId: '你的 ID', copy: '复制', copied: '已复制 ✓', idHint: '把它发给好友，他们就能联系你。', findPh: '好友 ID（R…）或邮箱', findGo: '发消息',
    notFound: '找不到这个 ID。', findLocked: '尝试次数过多，请 1 小时后再试。', self: '这是你自己的 ID 😉', noConv: '还没有对话。分享你的 ID 吧！',
    block: '🚫 屏蔽', unblock: '✅ 取消屏蔽', report: '🚩 举报', reportQ: '为什么举报这位玩家？（诈骗、辱骂……）', reported: '谢谢，团队会查看。该玩家已被屏蔽。',
    youBlocked: '你已屏蔽该玩家。', guestF: '注册后即可和好友聊天', guestFB: '有了账户，你会获得专属 ID，可以和好友聊天。',
    safety: '🔒 永远不要透露你的密码或验证码。OROLADO 绝不会向你索要。',
    duelBtn: '挑战', duelPick: '在模拟账户挑战好友', duelPickS: '选择时长。模拟盈利最多的一方赢得挑战。', duelSent: '挑战已发送 · {m} 分钟 · 等待 {n}…', duelInvite: '{n} 向你发起挑战！', duelInviteS: '模拟 {m} 分钟：盈利最多的一方获胜。', accept: '接受', refuse: '拒绝', duelStartIn: '挑战将在 {s} 秒后开始', duelLive: '挑战进行中', duelLeft: '剩余 {t}', duelPlay: '去模拟交易', duelWin: '🏆 你赢得了挑战！', duelLose: '{n} 赢得了挑战', duelTie: '平局！', duelAgain: '再战一局', duelRefused: '{n} 拒绝了挑战。', duelExpired: '挑战未在规定时间内被接受。', duelBusy: '你和这位好友已有进行中的挑战。', duelGone: '该挑战已失效。', duelRecord: '你的挑战：{w} 胜 · {l} 负', duelTrades: '{n} 笔交易', duelWait: '马上公布结果…', duelPromoT: '在模拟账户挑战好友', duelPromoS: '向好友发起挑战：模拟 3、5 或 10 分钟，盈利最多的一方获胜！', duelPromoBtn: '挑战好友', inviteBadge: '挑战', emptyT: '添加你的第一位好友', emptyS: '把你的 ID 发给好友，或在上方粘贴对方的 ID。', share: '发送我的 ID', shareTxt: '在 OROLADO Live 加我！我的 ID：{id}' });
  (D6.LIVE_T = D6.LIVE_T || {}).live = TXT; // v2689 : packs de langues (js/live-i18n/xx.js)
  function L() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return TXT[l] || TXT.en; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function linkify(s) { return esc(s).replace(/(https:\/\/[^\s<]+|orolado\.com)/g, function (u) { var h = u.indexOf('http') === 0 ? u : 'https://' + u; return '<a href="' + h + '" target="_blank" rel="noopener">' + u + '</a>'; }); }
  function ago(t) {
    var x = L(), s = Math.max(0, Math.floor(Date.now() / 1000 - t));
    if (s < 60) return x.now; if (s < 3600) return Math.floor(s / 60) + ' ' + x.min; if (s < 86400) return Math.floor(s / 3600) + ' ' + x.h; return Math.floor(s / 86400) + ' ' + x.d;
  }
  function guest() { return document.documentElement.classList.contains('oro-guest') || !(D6.Api && D6.Api.token && D6.Api.token()); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } return v; }

  var curSub = '';
  var tab = 'news', timer = 0, pendingImg = '', busy = false, lastMsgs = [];
  async function call(action, data) {
    try {
      var r = await fetch('live.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(Object.assign({ action: action, token: (D6.Api && D6.Api.token) ? D6.Api.token() : '' }, data || {})) });
      return await r.json();
    } catch (e) { return null; }
  }

  // v2683 (propriétaire) : plus de logo (la pièce) dans Live → simple icône « en direct ».
  var LOGO = '<span class="lv-av lv-av2"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.6"/><path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6M5.4 5.4a9.3 9.3 0 0 0 0 13.2M18.6 5.4a9.3 9.3 0 0 1 0 13.2"/></svg></span>';
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
    html += '<article class="lv-post lv-duelpromo"><div class="lv-dp-ico">⚔️</div><b>' + esc(x.duelPromoT) + '</b><p>' + esc(x.duelPromoS) + '</p><button type="button" class="lv-btn" id="lvDuelGo">' + esc(x.duelPromoBtn) + '</button></article>';
    html += '<article class="lv-post lv-welcome"><header>' + LOGO + '<div><b>' + x.team + ' <i class="lv-tick" aria-hidden="true"></i></b><small>OROLADO Social</small></div></header><p>' + linkify(x.welcomeNews) + '</p></article>';
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
    if ($('lvDuelGo')) $('lvDuelGo').addEventListener('click', function () { show('friends'); });
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
      html += '<div class="lv-m ' + (m.f === 'a' ? 'a' : 'u') + (isAud(m.img) ? ' lv-voice' : '') + '">' + (m.img ? media(m.img) : '') + (m.t ? linkify(m.t) : '') + '<small>' + (m.f === 'a' ? x.team + ' · ' : '') + ago(m.at) + '</small></div>';
    });
    $('liveMsgs').innerHTML = html;
    $('liveMsgs').scrollTop = 1e9;
    if (g) {
      $('liveGuest').innerHTML = '<b>' + x.guestT + '</b><p>' + x.guestB + '</p><button type="button" class="lv-btn" id="lvSignup">' + x.guestBtn + '</button><button type="button" class="lv-link2" id="lvMail">' + x.guestMail + '</button>';
      $('lvSignup').addEventListener('click', function () { toAuth('register'); });
      $('lvMail').addEventListener('click', function () { if (D6.Route && D6.Route.socialReturn) D6.Route.socialReturn('helpModal'); close(); if (D6.App && D6.App.openModal) D6.App.openModal('helpModal'); });
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
  var peer = null, fImg = '', fBusy = false, myStats = null;
  function showRecord() { var m = $('lfFindMsg'); if (!m) return; m.classList.add('hint'); m.textContent = '🏆 ' + fmt(L().duelRecord, myStats || { w: 0, l: 0 }); }
  function initial(n) { n = String(n || '?').trim(); return esc((n.charAt(0) || '?').toUpperCase()); }
  function setFriendBadge(n) { var b = $('liveBadgeF'); if (b) b.textContent = n > 0 ? String(n) : ''; }
  async function friendsList() {
    var x = L();
    if (guest()) {
      $('lfList').hidden = true; $('lfConv').hidden = true; $('lfGuest').hidden = false;
      $('lfGuest').innerHTML = '<b>' + x.guestF + '</b><p>' + x.guestFB + '</p><button type="button" class="lv-btn" id="lfSignup">' + x.guestBtn + '</button>';
      $('lfSignup').addEventListener('click', function () { toAuth('register'); });
      return;
    }
    $('lfGuest').hidden = true; $('lfConv').hidden = true; $('lfList').hidden = false; peer = null;
    $('lfFindIn').placeholder = x.findPh; $('lfFindGo').textContent = x.findGo;
    var j = await call('friends', {});
    if (!j || !j.ok) return;
    myStats = j.stats || null;
    $('lfMe').innerHTML = (D6.LiveIcon ? '<span class="lf-meico">' + D6.LiveIcon('myid') + '</span>' : '') + '<div><small>' + x.myId + '</small><b class="lf-myid">' + esc(j.me) + '</b><small>' + x.idHint + '</small></div><button type="button" id="lfCopy">' + x.copy + '</button>';
    $('lfCopy').addEventListener('click', function () {
      var b = this;
      try { navigator.clipboard.writeText(j.me); } catch (e) { /* ignore */ }
      b.textContent = x.copied; setTimeout(function () { b.textContent = x.copy; }, 1600);
    });
    var un = 0;
    $('lfConvs').innerHTML = j.list.length ? j.list.map(function (c) {
      if (c.un) un++;
      return '<button type="button" class="lf-c' + (c.un ? ' un' : '') + '" data-id="' + esc(c.id) + '"><span class="lf-av">' + initial(c.name) + '</span><span class="lf-ct"><b>' + esc(c.name) + (c.blocked ? ' 🚫' : '') + '</b><small>' + esc(c.last) + '</small></span><span class="lf-t">' + ago(c.at) + (c.duel ? '<em class="lf-inv">⚔️</em>' : '') + (c.un ? '<i>' + c.un + '</i>' : '') + '</span></button>';
    }).join('') : '<div class="lf-emptybox">' + (D6.LiveIcon ? '<span class="lf-eico">' + D6.LiveIcon('friends') + '</span>' : '') + '<b>' + esc(x.emptyT) + '</b><p>' + esc(x.emptyS) + '</p><button type="button" class="lgu-go" id="lfShare" style="--tc:#E0306F">' + esc(x.share) + '</button></div>';
    if ($('lfShare')) $('lfShare').addEventListener('click', function () {
      var txt = fmt(x.shareTxt, { id: j.me });
      if (navigator.share) { navigator.share({ text: txt + ' https://orolado.com' }).catch(function () {}); return; }
      try { navigator.clipboard.writeText(txt + ' https://orolado.com'); } catch (e) { /* ignore */ }
      this.textContent = x.copied;
    });
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
    duelPicking = false;
    paintDm(j.msgs, j.blocked);
    renderDuel(j);
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
  async function refreshDm() { if (!peer) return; var j = await call('dm', { id: peer.id }); if (j && j.ok) { paintDm(j.msgs, j.blocked); renderDuel(j); } }

  /* ---------- v2760 (propriétaire) : « Défie ton ami », « Mes défis », « Mon identifiant » ont chacun LEUR page ---------- */
  var HERO = {
    fr: { duelT: 'L’arène des défis', duelS: 'Affronte un ami en démo : le meilleur trader gagne.', d1: 'Choisis un ami ci-dessous', d2: 'Choisis la durée : 3, 5 ou 10 min', d3: 'Celui qui gagne le plus en démo remporte le défi',
      recT: 'Mes défis', w: 'Victoires', l: 'Défaites', r: 'Réussite', recS: 'Défie tes amis pour monter au classement.', recGo: 'Lancer un défi',
      idT: 'Ma carte OROLADO', idS: 'Donne cet identifiant à tes amis : ils te retrouvent en un instant.', i1: 'Ton ami ouvre « Mes amis »', i2: 'Il colle ton identifiant', i3: 'Vous discutez et vous vous défiez', share: 'Partager', copy: 'Copier', copied: 'Copié ✓' },
    en: { duelT: 'Challenge arena', duelS: 'Face a friend in demo: the best trader wins.', d1: 'Pick a friend below', d2: 'Pick 3, 5 or 10 min', d3: 'Whoever earns the most in demo wins',
      recT: 'My challenges', w: 'Wins', l: 'Losses', r: 'Success', recS: 'Challenge your friends to climb the ranking.', recGo: 'Start a challenge',
      idT: 'My OROLADO card', idS: 'Give this ID to your friends: they find you instantly.', i1: 'Your friend opens “My friends”', i2: 'They paste your ID', i3: 'You chat and challenge each other', share: 'Share', copy: 'Copy', copied: 'Copied ✓' },
    zh: { duelT: '挑战竞技场', duelS: '用模拟账户和好友对决：交易最好的人获胜。', d1: '在下方选择一位好友', d2: '选择挑战时长', d3: '模拟账户赚得最多的人获胜',
      recT: '我的挑战', w: '胜', l: '负', r: '胜率', recS: '挑战好友，提升排名。', recGo: '发起挑战',
      idT: '我的 OROLADO 卡', idS: '把这个 ID 发给好友，他们马上就能找到你。', i1: '好友打开“我的好友”', i2: '粘贴你的 ID', i3: '你们聊天并互相挑战', share: '分享', copy: '复制', copied: '已复制 ✓' }
  };
  var SWORDS = '<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke-linecap="round" stroke-linejoin="round"><path d="M12 8l26 26" stroke="#E2E8F0" stroke-width="5"/><path d="M52 8L26 34" stroke="#E2E8F0" stroke-width="5"/><path d="M12 8l26 26M52 8L26 34" stroke="#fff" stroke-width="1.6"/>' +
    '<path d="M33 40l-9 9M31 46l-5 5M17 40l9 9M19 46l5 5" stroke="#F59E0B" stroke-width="5"/><circle cx="21" cy="55" r="4" fill="#B45309"/><circle cx="43" cy="55" r="4" fill="#B45309"/><path d="M47 40l-9 9M45 46l-5 5" stroke="#F59E0B" stroke-width="5"/></g></svg>';
  var TROPHY = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lfhTg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FEF08A"/><stop offset="1" stop-color="#D97706"/></linearGradient></defs><path d="M14 12h-8v6c0 8 6 13 12 13M50 12h8v6c0 8-6 13-12 13" fill="none" stroke="#D97706" stroke-width="4"/><path d="M16 8h32v12c0 10-7 18-16 18S16 30 16 20z" fill="url(#lfhTg)"/><rect x="28" y="38" width="8" height="8" fill="#D97706"/><rect x="18" y="46" width="28" height="9" rx="2" fill="url(#lfhTg)"/><path d="M32 14l2.4 5 5.4.6-4 3.6 1.1 5.3L32 25.8l-4.9 2.7 1.1-5.3-4-3.6 5.4-.6z" fill="#fff" opacity=".9"/></svg>';
  function paintHero(sub) {
    var lst = $('lfList'); if (!lst) return;
    var hero = $('lfHero');
    if (!hero) { hero = document.createElement('div'); hero.id = 'lfHero'; lst.insertBefore(hero, lst.firstChild); }
    var l = (document.documentElement.lang || 'fr').slice(0, 2), t = HERO[l] || HERO.en;
    var me = ((($('lfMe') || {}).querySelector || function () { return null; }).call($('lfMe'), '.lf-myid') || {}).textContent || '';
    if (sub === 'duel') {
      hero.className = 'lfh lfh-duel';
      hero.innerHTML = '<div class="lfh-ico">' + SWORDS + '</div><b>' + esc(t.duelT) + '</b><p>' + esc(t.duelS) + '</p><ol><li><em>1</em>' + esc(t.d1) + '</li><li><em>2</em>' + esc(t.d2) + '</li><li><em>3</em>' + esc(t.d3) + '</li></ol>';
    } else if (sub === 'record') {
      var w = (myStats && myStats.w) || 0, ls = (myStats && myStats.l) || 0, pct = w + ls ? Math.round(w * 100 / (w + ls)) : 0;
      hero.className = 'lfh lfh-rec';
      hero.innerHTML = '<div class="lfh-ico">' + TROPHY + '</div><b>' + esc(t.recT) + '</b><div class="lfh-score"><div class="w"><b>' + w + '</b><small>' + esc(t.w) + '</small></div><div class="l"><b>' + ls + '</b><small>' + esc(t.l) + '</small></div><div class="r" style="--p:' + pct + '"><b>' + pct + '%</b><small>' + esc(t.r) + '</small></div></div><p>' + esc(t.recS) + '</p><button type="button" class="lfh-go" id="lfhGo">' + esc(t.recGo) + '</button>';
      $('lfhGo').addEventListener('click', function () { show('friends', 'duel'); });
    } else if (sub === 'myid') {
      hero.className = 'lfh lfh-id';
      hero.innerHTML = '<div class="lfh-card"><span class="lfh-chip"></span><small>' + esc(t.idT) + '</small><b class="lfh-num">' + esc(me) + '</b><span class="lfh-brand">OROLADO</span></div><p>' + esc(t.idS) + '</p>' +
        '<div class="lfh-btns"><button type="button" id="lfhCopy">' + esc(t.copy) + '</button><button type="button" id="lfhShare" class="on">' + esc(t.share) + '</button></div><ol><li><em>1</em>' + esc(t.i1) + '</li><li><em>2</em>' + esc(t.i2) + '</li><li><em>3</em>' + esc(t.i3) + '</li></ol>';
      $('lfhCopy').addEventListener('click', function () { var b = this; try { navigator.clipboard.writeText(me); } catch (e) { /* ignore */ } b.textContent = t.copied; setTimeout(function () { b.textContent = t.copy; }, 1600); });
      $('lfhShare').addEventListener('click', function () { var txt = fmt(L().shareTxt, { id: me }) + ' https://orolado.com'; if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; } try { navigator.clipboard.writeText(txt); } catch (e) { /* ignore */ } this.textContent = t.copied; });
    } else { hero.className = 'lfh'; hero.innerHTML = ''; }
  }

  /* ---------- v2685 — DÉFIE TON AMI (démo) ---------- */
  var duel = null, duelOff = 0, duelTick = 0, duelPoll = 0, duelStats = null, duelPicking = false;
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function money(v) { v = Number(v) || 0; return (v >= 0 ? '+' : '−') + '$' + Math.abs(v).toFixed(2); }
  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function renderDuel(j) {
    if (j) { duel = j.duel || null; duelStats = j.stats || null; if (duel) duelOff = duel.now - Date.now() / 1000; }
    var x = L(), card = $('lfDuelCard'), name = peer ? esc(peer.name) : '';
    clearInterval(duelTick); clearInterval(duelPoll);
    $('lfDuelT').textContent = x.duelBtn;
    if (duelPicking) {
      card.hidden = false;
      card.className = 'lf-duelcard pick';
      card.innerHTML = '<b>⚔️ ' + esc(x.duelPick) + '</b><p>' + esc(x.duelPickS) + '</p><div class="lf-dmins">' +
        [3, 5, 10].map(function (m) { return '<button type="button" data-m="' + m + '">' + m + ' min</button>'; }).join('') + '</div>' +
        (duelStats ? '<small>' + esc(fmt(x.duelRecord, duelStats)) + '</small>' : '');
      card.querySelectorAll('[data-m]').forEach(function (b) {
        b.addEventListener('click', async function () {
          duelPicking = false;
          var r = await call('duelCreate', { id: peer.id, min: +b.getAttribute('data-m') });
          if (r && !r.ok && D6.App && D6.App.toast) D6.App.toast(x[r.reason] || x.fail, 'err');
          refreshDm();
        });
      });
      return;
    }
    if (!duel || ['refused', 'expired'].indexOf(duel.st) >= 0 && Date.now() / 1000 + duelOff - (duel.end || duel.now) > 600) { card.hidden = true; card.innerHTML = ''; return; }
    card.hidden = false;
    var now = function () { return Date.now() / 1000 + duelOff; };
    if (duel.st === 'pending') {
      card.className = 'lf-duelcard wait';
      card.innerHTML = duel.mine
        ? '<b>⚔️ ' + esc(fmt(x.duelSent, { m: duel.min, n: name })) + '</b>'
        : '<b>⚔️ ' + esc(fmt(x.duelInvite, { n: name })) + '</b><p>' + esc(fmt(x.duelInviteS, { m: duel.min })) + '</p><div class="lf-dmins"><button type="button" class="ok" id="lfDuelYes">' + esc(x.accept) + '</button><button type="button" id="lfDuelNo">' + esc(x.refuse) + '</button></div>';
      if (!duel.mine) {
        $('lfDuelYes').addEventListener('click', async function () { await call('duelAnswer', { id: peer.id, accept: 1 }); refreshDm(); });
        $('lfDuelNo').addEventListener('click', async function () { await call('duelAnswer', { id: peer.id, accept: 0 }); refreshDm(); });
      }
      duelPoll = setInterval(refreshDm, 4000);
      return;
    }
    if (duel.st === 'refused' || duel.st === 'expired') {
      card.className = 'lf-duelcard';
      card.innerHTML = '<b>' + esc(duel.st === 'refused' ? fmt(x.duelRefused, { n: name }) : x.duelExpired) + '</b><div class="lf-dmins"><button type="button" class="ok" id="lfDuelRe">' + esc(x.duelAgain) + '</button></div>';
      $('lfDuelRe').addEventListener('click', function () { duelPicking = true; renderDuel(); });
      return;
    }
    var me = duel.me || { net: 0, n: 0 }, him = duel.him || { net: 0, n: 0 };
    var score = '<div class="lf-score"><div class="' + (me.net >= him.net ? 'lead' : '') + '"><small>' + esc(x.you) + '</small><b>' + money(me.net) + '</b><i>' + esc(fmt(x.duelTrades, { n: me.n })) + '</i></div><span>VS</span><div class="' + (him.net > me.net ? 'lead' : '') + '"><small>' + name + '</small><b>' + money(him.net) + '</b><i>' + esc(fmt(x.duelTrades, { n: him.n })) + '</i></div></div>';
    if (duel.st === 'done') {
      card.className = 'lf-duelcard done ' + duel.res;
      card.innerHTML = '<b>' + esc(duel.res === 'win' ? x.duelWin : duel.res === 'lose' ? fmt(x.duelLose, { n: name }) : x.duelTie) + '</b>' + score +
        '<div class="lf-dmins"><button type="button" class="ok" id="lfDuelRe">⚔️ ' + esc(x.duelAgain) + '</button></div>';
      $('lfDuelRe').addEventListener('click', function () { duelPicking = true; renderDuel(); });
      return;
    }
    // Défi en cours (ou compte à rebours avant le départ)
    card.className = 'lf-duelcard live';
    var paint = function () {
      var t = now(), head;
      if (t < duel.start) head = esc(fmt(x.duelStartIn, { s: Math.ceil(duel.start - t) }));
      else if (t < duel.end) head = '⚔️ ' + esc(x.duelLive) + ' · ' + esc(fmt(x.duelLeft, { t: mmss(duel.end - t) }));
      else head = esc(x.duelWait);
      card.innerHTML = '<b>' + head + '</b>' + score + '<div class="lf-dmins"><button type="button" class="ok" id="lfDuelPlay">' + esc(x.duelPlay) + '</button></div>';
      $('lfDuelPlay').addEventListener('click', function () {
        close();
        var demo = document.getElementById('modeDemo');
        if (demo && !demo.classList.contains('on')) demo.click();
      });
    };
    paint();
    duelTick = setInterval(paint, 1000);
    duelPoll = setInterval(refreshDm, 5000);
  }
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
      var x = L(), raw = $('lfFindIn').value.trim();
      var v = raw.indexOf('@') >= 0 ? raw.replace(/\s+/g, '').toLowerCase() : raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase(); // v2778 : identifiant OU e-mail
      $('lfFindMsg').textContent = '';
      if (v.length < 7) { $('lfFindMsg').textContent = x.notFound; return; }
      var j = await call('find', { id: v });
      if (j && j.ok) { $('lfFindIn').value = ''; openDm(j.peer.id); }
      else $('lfFindMsg').textContent = x[(j && j.reason) || 'notFound'] || x.notFound;
    });
    $('lfBack').addEventListener('click', function () { clearInterval(duelTick); clearInterval(duelPoll); friendsList(); });
    $('lfDuel').addEventListener('click', function () {
      if (!peer) return;
      if (duel && (duel.st === 'pending' || duel.st === 'active')) { renderDuel(); return; }
      duelPicking = !duelPicking; renderDuel();
    });
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

  /* ---------- v2686 — ACCUEIL EN GRANDES TUILES (propriétaire) ---------- */
  var HOME = [
    // v2689 : 2 grandes tuiles (Défie ton ami en haut, Cadeaux en bas) et un nombre pair de petites → aucun trou
    { k: 'duel', ico: '⚔️', c: 'c3' }, { k: 'send', ico: '💸', c: 'c14' },
    { k: 'news', ico: '📰', c: 'c1' }, { k: 'friends', ico: '👥', c: 'c2' }, { k: 'groups', ico: '👪', c: 'c13' }, { k: 'chat', ico: '💬', c: 'c4' },
    { k: 'levels', ico: '⭐', c: 'c15' }, { k: 'missions', ico: '🎯', c: 'c16' },
    { k: 'quiz', ico: '🧠', c: 'c10' }, { k: 'myid', ico: '🆔', c: 'c5' }, { k: 'record', ico: '🏆', c: 'c6' }, { k: 'stats', ico: '📊', c: 'c11' },
    { k: 'badges', ico: '🏅', c: 'c12' }, { k: 'learn', ico: '📚', c: 'c8' },
    { k: 'gifts', ico: '🎁', c: 'c7' }
  ];
  var HT = {
    fr: { news: ['Actualités', 'Les nouvelles d’OROLADO'], friends: ['Mes amis', 'Discute et partage des photos'], duel: ['Défie ton ami', 'Montre-lui que tu es le plus fort en trading'], chat: ['Écrire à l’équipe', 'Une question ? On te répond'],
      myid: ['Mon identifiant', 'Partage-le à tes amis'], record: ['Mes défis', 'Victoires et défaites'], gifts: ['Cadeaux', 'Défis, bonus, tournoi'], learn: ['Apprendre', 'Le guide pas à pas'], home: 'Social', duelHint: 'Choisis un ami, puis touche « ⚔️ Défier ».' },
    en: { news: ['News', 'OROLADO updates'], friends: ['My friends', 'Chat and share photos'], duel: ['Challenge a friend', 'Show them you are the best trader'], chat: ['Write to the team', 'A question? We answer'],
      myid: ['My ID', 'Share it with your friends'], record: ['My challenges', 'Wins and losses'], gifts: ['Gifts', 'Challenges, bonus, tournament'], learn: ['Learn', 'Step-by-step guide'], home: 'Social', duelHint: 'Pick a friend, then tap “⚔️ Challenge”.' },
    zh: { news: ['动态', 'OROLADO 最新消息'], friends: ['我的好友', '聊天、分享照片'], duel: ['挑战好友', '证明你才是交易高手'], chat: ['联系团队', '有问题？我们来回复'],
      myid: ['我的 ID', '分享给好友'], record: ['我的挑战', '胜负记录'], gifts: ['礼物', '挑战、奖励、锦标赛'], learn: ['学习', '分步指南'], home: 'Social', duelHint: '选择一位好友，然后点「⚔️ 挑战」。' }
  };
  D6.LIVE_T.home = HT;
  function H() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return HT[l] || HT.en; }
  var dmUnTiles = 0;
  // v2706 (propriétaire) : accueil LIBRE — logos sans carreau, centrés au-dessus du titre, 3 par ligne, tout sur un écran.
  // Petite phrase gardée seulement pour Défie ton ami, Actualités et Envoyer de l'argent (en haut).
  var FEAT = { duel: 1, news: 1, send: 1 };
  var ORDERH = ['duel', 'news', 'send', 'friends', 'groups', 'chat', 'myid', 'levels', 'missions', 'quiz', 'record', 'stats', 'badges', 'learn', 'gifts'];
  function paintHome() {
    var h = H(), g = $('liveHomeGrid');
    var list = HOME.filter(function (t) { return t.k !== 'send' || guest() || (D6.LiveSend && D6.LiveSend.enabled()); })
      .sort(function (a, b) { return ORDERH.indexOf(a.k) - ORDERH.indexOf(b.k); });
    // v2844 (propriétaire) : comme Cadeaux — rien ne change → on garde la grille déjà dessinée (plus d'« éclair »)
    // 2026-10-20 (propriétaire : « les logos apparaissent après quelques secondes ») : un nouveau badge ne redessine plus
    // toute la grille (sur iPhone, les logos redessinés mettaient du temps à revenir) : seul le petit chiffre change.
    var sig = list.map(function (t) { return t.k; }).join(',') + '|' + document.documentElement.lang;
    if (g.dataset.sig === sig && g.firstChild) { homeBadges(g); paintMsgBar(); return; }
    g.dataset.sig = sig;
    g.className = 'lh-grid lh-free' + (list.length % 3 === 2 ? ' lh-r2' : list.length % 3 === 1 ? ' lh-r1' : ''); // 2026-10-21 : dernière rangée centrée (jamais de trou)
    g.innerHTML = list.map(function (t) {
      var badge = (t.k === 'friends' && dmUn > 0) ? '<i class="lh-b">' + dmUn + '</i>' : (t.k === 'chat' && $('liveBadge') && $('liveBadge').textContent) ? '<i class="lh-b">' + esc($('liveBadge').textContent) + '</i>' : '';
      var tt = h[t.k] || (t.k === 'send' && D6.LiveSend ? [D6.LiveSend.title(), D6.LiveSend.sub()] : null) || (t.k === 'groups' && D6.LiveGroups ? [D6.LiveGroups.title(), D6.LiveGroups.sub()] : [D6.LiveFun ? D6.LiveFun.title(t.k) : t.k, D6.LiveFun ? D6.LiveFun.sub(t.k) : '']);
      return '<button type="button" class="lh-f' + (FEAT[t.k] ? ' feat' : '') + '" data-k="' + t.k + '" style="--tc:' + (D6.LiveColor ? D6.LiveColor(t.k) : '#7a5cff') + '"><span class="lh-fi">' + (D6.LiveIcon ? D6.LiveIcon(t.k, 'free verre') : t.ico) + badge + '</span><b>' + esc(tt[0]) + '</b>' + (FEAT[t.k] ? '<small>' + esc(tt[1]) + '</small>' : '') + '</button>';
    }).join('');
    g.querySelectorAll('[data-k]').forEach(function (b) { b.addEventListener('click', function () { tileGo(b.getAttribute('data-k')); }); });
    paintMsgBar();
    fitHome();
  }
  function homeBadges(g) {
    var team = $('liveBadge') ? $('liveBadge').textContent : '';
    [['friends', dmUn > 0 ? String(dmUn) : ''], ['chat', team || '']].forEach(function (p) {
      var fi = g.querySelector('[data-k="' + p[0] + '"] .lh-fi'); if (!fi) return;
      var b = fi.querySelector('.lh-b');
      if (!p[1]) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('i'); b.className = 'lh-b'; fi.appendChild(b); }
      if (b.textContent !== p[1]) b.textContent = p[1];
    });
  }
  /* v2812 (propriétaire, round 4) : « Mes discussions » — grande barre en haut du menu Social : la messagerie (style
     WhatsApp : amis, groupes, équipe, actus) se trouve tout de suite, avec le nombre de messages non lus. */
  var MSGW = { en: 'My chats', fr: 'Mes discussions', es: 'Mis chats', pt: 'Minhas conversas', ar: 'محادثاتي', tr: 'Sohbetlerim', vi: 'Tin nhắn của tôi', id: 'Obrolanku', ru: 'Мои чаты', de: 'Meine Chats', hi: 'मेरी चैट', zh: '我的聊天' };
  var MSGS = { en: 'Friends, groups, team', fr: 'Amis, groupes, équipe', es: 'Amigos, grupos, equipo', pt: 'Amigos, grupos, equipa', ar: 'الأصدقاء، المجموعات، الفريق', tr: 'Arkadaşlar, gruplar, ekip', vi: 'Bạn bè, nhóm, đội ngũ', id: 'Teman, grup, tim', ru: 'Друзья, группы, команда', de: 'Freunde, Gruppen, Team', hi: 'दोस्त, ग्रुप, टीम', zh: '好友、群组、团队' };
  function paintMsgBar() {
    var pane = $('livePaneHome'), g = $('liveHomeGrid'); if (!pane || !g) return;
    var b = $('lhMsgs');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.id = 'lhMsgs'; b.className = 'lh-msgs';
      b.addEventListener('click', function () { tileGo('dms'); });
      pane.insertBefore(b, g);
    }
    var l = (document.documentElement.lang || 'en').slice(0, 2);
    var team = parseInt(($('liveBadge') && $('liveBadge').textContent) || '0', 10) || 0, n = (dmUn || 0) + team;
    b.innerHTML = '<span class="lh-mi" aria-hidden="true"><svg viewBox="0 0 48 48"><defs><linearGradient id="lhMg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4BE3C7"/><stop offset="1" stop-color="#2E8CF0"/></linearGradient></defs>' +
      '<path d="M9 9h22a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4H19l-7 5.5V28H9a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z" fill="url(#lhMg)"/>' +
      '<path d="M38.5 17H39a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-2v5l-6.5-5H25a4 4 0 0 1-4-4v-1h11a6.5 6.5 0 0 0 6.5-6.5z" fill="#fff" opacity=".86"/>' +
      '<circle cx="14" cy="18.5" r="2.1" fill="#fff"/><circle cx="20" cy="18.5" r="2.1" fill="#fff"/><circle cx="26" cy="18.5" r="2.1" fill="#fff"/></svg></span>' +
      '<span class="lh-mt"><b class="fit">' + esc(MSGW[l] || MSGW.en) + '</b><small>' + esc(MSGS[l] || MSGS.en) + '</small></span>' +
      (n > 0 ? '<i class="lh-mb">' + (n > 99 ? '99+' : n) + '</i>' : '') + '<span class="lh-mc" aria-hidden="true">›</span>';
  }
  /* v2953 (propriétaire) : le menu Social tient dans l'écran SANS défiler (vu sur Android 360x663 : 46 px de trop).
     S'il dépasse, la grille des logos est réduite juste ce qu'il faut (au plus 25 %) ; sinon rien ne change. */
  // 2026-10-21 (propriétaire : « quand on clique sur Social, ça tarde avant d'afficher les pages ») : cette recherche
  // (8 mises en page complètes) était refaite à CHAQUE ouverture avant que Social ne s'affiche, puis encore 250 ms
  // après. Maintenant elle est faite une fois, en avance (prefitHome, après le chargement) ; à l'ouverture, même
  // écran + même menu → rien à refaire. Même réduction qu'avant à l'écran.
  function fitHome() {
    var pane = $('livePaneHome'), g = $('liveHomeGrid'); if (!pane || !g) return;
    var run = function () {
      if (pane.hidden || !pane.offsetParent) return;
      var key = pane.clientWidth + 'x' + pane.clientHeight + '|' + (g.dataset.sig || '');
      if (g._fitKey === key && pane.scrollHeight - pane.clientHeight <= 1) return;
      g._fitKey = key;
      g.style.zoom = '';
      var over = pane.scrollHeight - pane.clientHeight;
      if (!(over > 1)) return;
      var lo = 0.75, hi = 1, k;
      for (k = 0; k < 7; k++) {
        var mid = (lo + hi) / 2;
        g.style.zoom = String(mid);
        if (pane.scrollHeight - pane.clientHeight <= 1) lo = mid; else hi = mid;
      }
      g.style.zoom = String(Math.round(lo * 1000) / 1000);
    };
    if (fitHome.now) { fitHome.now = false; run(); return; }
    if (window.requestAnimationFrame) requestAnimationFrame(run); else run();
    setTimeout(run, 250);
  }
  // Menu ajusté en avance, Social encore fermé : la fenêtre est posée invisible dans l'état « menu » le temps de la
  // mesure (même tâche, rien n'est dessiné), puis tout est remis comme avant.
  function prefitHome() {
    var m = $('liveModal'), pane = $('livePaneHome'), g = $('liveHomeGrid'), bar = $('liveBar'), news = $('livePaneNews');
    if (!m || !pane || !g || !g.firstChild || m.classList.contains('active')) return;
    var st = m.getAttribute('style'), ph = pane.hidden, bh = bar ? bar.hidden : true, nh = news ? news.hidden : true;
    try {
      m.style.setProperty('display', 'block', 'important'); m.style.setProperty('visibility', 'hidden', 'important');
      pane.hidden = false; if (bar) bar.hidden = false; if (news) news.hidden = true;
      fitHome.now = true; fitHome();
    } catch (eF) { /* ignore */ }
    fitHome.now = false;
    pane.hidden = ph; if (bar) bar.hidden = bh; if (news) news.hidden = nh;
    if (st === null) m.removeAttribute('style'); else m.setAttribute('style', st);
  }
  window.addEventListener('resize', function () { fitHome(); clearTimeout(prefitHome.t); prefitHome.t = setTimeout(prefitHome, 400); });

  function tileGo(k) {
    if (k === 'dms') { if (guest()) { show('guest', 'friends'); return; } if (D6.Social2) { D6.Social2.open('', true); return; } show('friends'); return; }
    // 2026-10-23 : le visiteur parcourt aussi Niveaux, Badges et Missions (rien de personnel) ; le reste demande l'inscription
    if (guest() && ['news', 'gifts', 'learn', 'levels', 'badges', 'missions'].indexOf(k) < 0) { show('guest', k); return; }
    // v2760 (propriétaire) : Cadeaux s'ouvre PAR-DESSUS Social (on ne voit plus l'écran de trading entre les deux)
    // v2812 (propriétaire, round 4) : Social RESTE ouvert dessous → en fermant Cadeaux / Apprendre on retrouve le menu Social
    // tout de suite, sans voir passer l'écran de trading.
    if (k === 'gifts') { if (D6.Portal && D6.Portal.open) D6.Portal.open(); return; }
    if (k === 'learn') { var lb = document.querySelector('[data-learn-open]'); if (lb) lb.click(); else if (D6.Learn && D6.Learn.open) D6.Learn.open(); return; }
    // v2796 : Actus, Écris-nous, Amis, Groupes, Défier, Mon identifiant, Mes défis → la messagerie (js/social2.js)
    if (D6.Social2 && ['news', 'chat', 'friends', 'groups', 'duel', 'myid', 'record'].indexOf(k) >= 0) { D6.Social2.open(k, true); return; } // v2808 : ‹ ramène au menu
    if (k === 'news' || k === 'chat' || k === 'friends') { show(k); return; }
    if (k === 'quiz' || k === 'stats' || k === 'badges' || k === 'levels' || k === 'missions') { show('fun', k); return; }
    if (k === 'groups') { show('groups'); return; }
    if (k === 'send') { show('send'); return; }
    // Défier / mon identifiant / mes défis : la page Amis, avec un mot d'aide en haut
    show('friends', k);
  }

  /* v2694 : Cadeaux / Apprendre ouverts DEPUIS Live → en les fermant on revient dans Live (pas sur la page de trading) */
  function backToLive(id, cls) {
    var m = document.getElementById(id); if (!m || m._oroBack) return;
    var seen = m.classList.contains(cls);
    var ob = new MutationObserver(function () {
      var on = m.classList.contains(cls);
      if (on) { seen = true; return; }
      if (seen) {
        ob.disconnect(); m._oroBack = null;
        // si une autre fenêtre s'ouvre (ex. Recharger), on ne remet pas Live par-dessus
        setTimeout(function () { if (!document.querySelector('.modal-backdrop.active') && !document.querySelector('#learnModal.on')) open('grid'); }, 120); // v2808 : retour au menu en tuiles
      }
    });
    m._oroBack = ob;
    ob.observe(m, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function () { if (!seen && m._oroBack === ob) { ob.disconnect(); m._oroBack = null; } }, 4000);
  }
  /* v2808 (propriétaire) : pages « inscris-toi » de Mon niveau et Missions (avant : le texte de « Mes amis » s'affichait) */
  var GUEST_MORE = {
    fr: { levels: ['Ton niveau', 'Gagne de l’expérience à chaque trade et monte de niveau.', ['⭐ De l’XP à chaque trade', '📈 Ta barre de progression', '🏆 Atteins le plus haut niveau']], missions: ['Missions de la semaine', 'Chaque semaine, des missions à réussir pour gagner de l’XP.', ['🎯 Nouvelles missions chaque semaine', '⭐ De l’XP en bonus', '📊 Suis ta progression']] },
    en: { levels: ['Your level', 'Earn XP with every trade and level up.', ['⭐ XP on every trade', '📈 Your progress bar', '🏆 Reach the top level']], missions: ['Weekly missions', 'Every week, missions to complete to earn XP.', ['🎯 New missions every week', '⭐ Bonus XP', '📊 Follow your progress']] },
    es: { levels: ['Tu nivel', 'Gana XP con cada operación y sube de nivel.', ['⭐ XP en cada operación', '📈 Tu barra de progreso', '🏆 Llega al nivel más alto']], missions: ['Misiones de la semana', 'Cada semana, misiones para ganar XP.', ['🎯 Nuevas misiones cada semana', '⭐ XP extra', '📊 Sigue tu progreso']] },
    pt: { levels: ['Seu nível', 'Ganhe XP a cada operação e suba de nível.', ['⭐ XP em cada operação', '📈 Sua barra de progresso', '🏆 Chegue ao nível mais alto']], missions: ['Missões da semana', 'Toda semana, missões para ganhar XP.', ['🎯 Novas missões toda semana', '⭐ XP extra', '📊 Acompanhe seu progresso']] },
    ar: { levels: ['مستواك', 'اكسب نقاط الخبرة مع كل صفقة وارتقِ بمستواك.', ['⭐ نقاط خبرة مع كل صفقة', '📈 شريط تقدّمك', '🏆 بلوغ أعلى مستوى']], missions: ['مهام الأسبوع', 'كل أسبوع مهام تنجزها لتكسب نقاط الخبرة.', ['🎯 مهام جديدة كل أسبوع', '⭐ نقاط خبرة إضافية', '📊 تابع تقدّمك']] },
    tr: { levels: ['Seviyen', 'Her işlemde XP kazan ve seviye atla.', ['⭐ Her işlemde XP', '📈 İlerleme çubuğun', '🏆 En yüksek seviyeye ulaş']], missions: ['Haftalık görevler', 'Her hafta XP kazanmak için görevler.', ['🎯 Her hafta yeni görevler', '⭐ Ekstra XP', '📊 İlerlemeni takip et']] },
    vi: { levels: ['Cấp độ của bạn', 'Nhận XP sau mỗi giao dịch và lên cấp.', ['⭐ XP cho mỗi giao dịch', '📈 Thanh tiến độ', '🏆 Đạt cấp cao nhất']], missions: ['Nhiệm vụ tuần', 'Mỗi tuần, các nhiệm vụ để nhận XP.', ['🎯 Nhiệm vụ mới mỗi tuần', '⭐ XP thưởng', '📊 Theo dõi tiến độ']] },
    id: { levels: ['Levelmu', 'Dapatkan XP di setiap trading dan naik level.', ['⭐ XP di setiap trading', '📈 Bilah progresmu', '🏆 Capai level tertinggi']], missions: ['Misi mingguan', 'Setiap minggu, misi untuk mendapatkan XP.', ['🎯 Misi baru setiap minggu', '⭐ XP bonus', '📊 Pantau progresmu']] },
    ru: { levels: ['Твой уровень', 'Получай опыт за каждую сделку и повышай уровень.', ['⭐ Опыт за каждую сделку', '📈 Шкала прогресса', '🏆 Достигни высшего уровня']], missions: ['Задания недели', 'Каждую неделю задания, чтобы получать опыт.', ['🎯 Новые задания каждую неделю', '⭐ Бонусный опыт', '📊 Следи за прогрессом']] },
    de: { levels: ['Dein Level', 'Sammle XP mit jedem Trade und steige auf.', ['⭐ XP für jeden Trade', '📈 Dein Fortschrittsbalken', '🏆 Erreiche das höchste Level']], missions: ['Wochenmissionen', 'Jede Woche Missionen, um XP zu sammeln.', ['🎯 Jede Woche neue Missionen', '⭐ Bonus-XP', '📊 Verfolge deinen Fortschritt']] },
    hi: { levels: ['आपका लेवल', 'हर ट्रेड पर XP कमाएँ और लेवल बढ़ाएँ।', ['⭐ हर ट्रेड पर XP', '📈 आपकी प्रगति पट्टी', '🏆 सबसे ऊँचा लेवल पाएँ']], missions: ['साप्ताहिक मिशन', 'हर हफ़्ते XP कमाने के लिए मिशन।', ['🎯 हर हफ़्ते नए मिशन', '⭐ बोनस XP', '📊 अपनी प्रगति देखें']] },
    zh: { levels: ['你的等级', '每笔交易都能获得经验值并升级。', ['⭐ 每笔交易得经验值', '📈 你的进度条', '🏆 冲到最高等级']], missions: ['每周任务', '每周完成任务，赚取经验值。', ['🎯 每周新任务', '⭐ 额外经验值', '📊 查看你的进度']] }
  };
  function guestTexts() {
    var G = D6.LIVE_T && D6.LIVE_T.guest; if (!G) return;
    var l = (document.documentElement.lang || 'en').slice(0, 2), tb = G[l] || G.en, add = GUEST_MORE[l] || GUEST_MORE.en;
    if (tb && !tb.levels) tb.levels = add.levels;
    if (tb && !tb.missions) tb.missions = add.missions;
  }
  function show(w, sub) {
    if (D6.Social2) D6.Social2.hide(); // v2796 : une page de l'ancien Social par-dessus la messagerie
    tab = w; curSub = sub || '';
    var h = H(), home = w === 'home';
    $('livePaneHome').hidden = !home;
    if (home) fitHome();
    $('liveBar').hidden = false;
    $('liveModal').classList.toggle('lv-at-home', home);
    $('liveBarT').textContent = home ? ((D6.Social2 && D6.Social2.t ? D6.Social2.t('title') : '') || 'Social') : (sub && h[sub] ? h[sub][0] : (w === 'fun' && D6.LiveFun ? D6.LiveFun.title(sub) : (h[w] ? h[w][0] : '')));
    if ($('livePaneFun')) $('livePaneFun').hidden = w !== 'fun' && w !== 'send';
    if ($('livePaneGuest')) $('livePaneGuest').hidden = w !== 'guest';
    if ($('livePaneGroups')) $('livePaneGroups').hidden = w !== 'groups';
    if (w !== 'groups' && D6.LiveGroups) D6.LiveGroups.stop();
    if (w === 'groups' && D6.LiveGroups) $('liveBarT').textContent = D6.LiveGroups.title();
    $('liveTabNews').classList.toggle('on', w === 'news'); $('liveTabChat').classList.toggle('on', w === 'chat'); $('liveTabFriends').classList.toggle('on', w === 'friends');
    $('livePaneNews').hidden = w !== 'news'; $('livePaneChat').hidden = w !== 'chat'; $('livePaneFriends').hidden = w !== 'friends';
    clearInterval(timer);
    if (home) { paintHome(); return; }
    if (w === 'guest') {
      $('livePaneNews').hidden = true;
      $('liveBarT').textContent = (sub === 'send' && D6.LiveSend ? D6.LiveSend.title() : h[sub] ? h[sub][0] : (sub === 'groups' && D6.LiveGroups ? D6.LiveGroups.title() : (D6.LiveFun ? D6.LiveFun.title(sub) : '')));
      guestTexts();
      if (D6.LiveGuest) D6.LiveGuest($('liveGuestBox'), sub, sub === 'chat' ? '<button type="button" class="lgu-have" id="lguMail">✉️ ' + esc(L().guestMail) + '</button>' : '');
      if ($('lguMail')) $('lguMail').addEventListener('click', function () { if (D6.Route && D6.Route.socialReturn) D6.Route.socialReturn('helpModal'); close(); if (D6.App && D6.App.openModal) D6.App.openModal('helpModal'); });
      return;
    }
    if (w === 'fun') { $('livePaneNews').hidden = true; if (D6.LiveFun) D6.LiveFun.open(sub); return; }
    if (w === 'send') { $('livePaneNews').hidden = true; $('liveBarT').textContent = D6.LiveSend ? D6.LiveSend.title() : ''; if (D6.LiveSend) D6.LiveSend.open($('liveFun'), sub); return; }
    if (w === 'groups') { $('livePaneNews').hidden = true; if (D6.LiveGroups) D6.LiveGroups.open(sub); return; }
    if (w === 'friends') {
      $('livePaneFriends').setAttribute('data-v', sub === 'duel' || sub === 'myid' || sub === 'record' ? sub : 'friends');
      friendsList().then(function () {
        paintHero(sub);
        var m = $('lfFindMsg');
        if (sub === 'duel' && m) { m.textContent = h.duelHint; m.classList.add('hint'); }
        else if (m) m.classList.remove('hint');
        if (sub === 'myid' && $('lfMe')) $('lfMe').scrollIntoView({ block: 'start' });
        if (sub === 'record') showRecord();
      });
      if (!guest()) timer = setInterval(function () { if (!document.hidden) { if (peer) refreshDm(); else friendsList(); } }, 15000);
      return;
    }
    if (w === 'friends') {
      friendsList();
      if (!guest()) timer = setInterval(function () { if (!document.hidden) { if (peer) refreshDm(); else friendsList(); } }, 15000);
      return;
    }
    load(w === 'chat');
    if (w === 'chat' && !guest()) timer = setInterval(function () { if (!document.hidden) load(true); }, 15000);
  }

  var openedOnce = false;
  // v2855 : le menu Social est préparé dès que le site est chargé (DOM + dessins prêts avant le 1er clic)
  setTimeout(function () { try { if ($('liveHomeGrid') && !$('liveHomeGrid').firstChild) paintHome(); prefitHome(); } catch (eP) { /* ignore */ } }, 3000);
  // 2026-10-21 (propriétaire : « dans Social, une case reste vide quelques secondes puis se remplit ») : la case « Envoyer de
  // l'argent » dépend d'une réponse du serveur ; elle est demandée en avance (2 s après l'ouverture du site) pour que le menu
  // soit déjà complet au premier toucher.
  setTimeout(function () {
    try {
      if (guest() || !(D6.LiveSend && D6.LiveSend.status)) return;
      D6.LiveSend.status().then(function () { try { if ($('liveHomeGrid') && $('liveHomeGrid').firstChild) { paintHome(); prefitHome(); } } catch (eS) { /* ignore */ } }, function () { /* ignore */ });
    } catch (eT) { /* ignore */ }
  }, 2000);
  function open(w) {
    var x = L();
    $('liveSub').textContent = x.sub; $('liveTabNewsT').textContent = x.news; $('liveTabChatT').textContent = x.chat; $('liveText').placeholder = x.ph;
    if ($('liveTabFriendsT')) $('liveTabFriendsT').textContent = x.friends;
    // v2855 (propriétaire : « au 1er clic après actualisation, le menu se remplit petit à petit ») : la 1re fois, la grille
    // reste invisible le temps que Safari ait tout dessiné, puis apparaît D'UN COUP (court fondu) — comme Cadeaux.
    // 2026-10-20 (propriétaire : « quand on clique sur Social, les logos arrivent après ») : plus de fondu retardé ; la grille
    // est déjà dessinée (3 s après le chargement) et s'affiche tout de suite, comme Cadeaux et Paris.
    if (!$('liveHomeGrid') || !$('liveHomeGrid').firstChild) { try { paintHome(); } catch (eP0) { /* ignore */ } }
    openedOnce = true;
    if (D6.App && D6.App.openModal) D6.App.openModal('liveModal');
    // v2796 (propriétaire) : Social s'ouvre en MESSAGERIE (js/social2.js) ; l'ancienne page en tuiles reste dans « Plus »
    // v2808 (propriétaire) : le VISITEUR arrive sur le menu en tuiles (il voit tout ce qui existe ; chaque action demande l'inscription)
    // v2812 (propriétaire, round 4) : Social s'ouvre TOUJOURS sur le MENU en tuiles (membre comme visiteur) : on voit tout
    // ce qui existe. Les discussions (style WhatsApp) s'ouvrent depuis « Mes discussions », Mes amis, Mes groupes… et
    // la flèche ‹ ramène au menu, puis à l'accueil. Un lien de notification (?live=1 / ?live=amis) ouvre la page voulue,
    // et son ‹ ramène aussi au menu.
    if (!w || w === 'grid' || w === 'home' || (guest() && w === 'dms')) show('home');
    else if (D6.Social2 && ['dms', 'news', 'chat', 'friends', 'groups'].indexOf(w) >= 0) { tab = 'home'; D6.Social2.open(w === 'dms' ? '' : w, true); }
    else show(w === 'dms' ? 'friends' : (w || 'home'));
    // v2689 : la tuile « Envoyer de l'argent » apparaît dès que le serveur dit que c'est ouvert pour ce joueur
    if (!guest() && D6.LiveSend) D6.LiveSend.status().then(function () { if (tab === 'home') paintHome(); if (D6.LiveSend.enabled() && D6.LiveSend.warm) D6.LiveSend.warm(); });
  }
  function close() { if (D6.Social2) D6.Social2.stop(); clearInterval(timer); clearInterval(duelTick); clearInterval(duelPoll); if (D6.LiveGroups) D6.LiveGroups.stop(); if (D6.App && D6.App.closeModal) D6.App.closeModal('liveModal'); }

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

  /* v2790 (propriétaire) — NOTE VOCALE pour l'équipe : on touche le micro, on parle (10 s max, arrêt tout seul),
     on écoute avant d'envoyer, ✕ pour effacer. Son léger (32 kbit/s ≈ 40 Ko). Rien ne tourne quand on n'enregistre pas. */
  var AUD = {
    fr: ['Parle… touche pour arrêter', 'Micro refusé : autorise le micro dans ton navigateur.', 'Limite de notes vocales atteinte pour aujourd’hui.', 'Note vocale refusée, réessaie.', 'Ton téléphone ne permet pas d’enregistrer ici.'],
    en: ['Speak… tap to stop', 'Microphone blocked: allow it in your browser.', 'Voice note limit reached for today.', 'Voice note refused, try again.', 'Your phone cannot record here.'],
    es: ['Habla… toca para parar', 'Micrófono bloqueado: permítelo en tu navegador.', 'Límite de notas de voz alcanzado hoy.', 'Nota de voz rechazada, inténtalo de nuevo.', 'Tu teléfono no puede grabar aquí.'],
    pt: ['Fala… toca para parar', 'Microfone bloqueado: permite-o no navegador.', 'Limite de notas de voz atingido hoje.', 'Nota de voz recusada, tenta de novo.', 'O teu telemóvel não pode gravar aqui.'],
    ar: ['تكلم… اضغط للإيقاف', 'الميكروفون محظور: اسمح به في المتصفح.', 'تم بلوغ حد الرسائل الصوتية لليوم.', 'تم رفض الرسالة الصوتية، حاول مجددًا.', 'لا يمكن لهاتفك التسجيل هنا.'],
    tr: ['Konuş… durdurmak için dokun', 'Mikrofon engelli: tarayıcıda izin ver.', 'Bugünkü sesli not sınırına ulaşıldı.', 'Sesli not reddedildi, tekrar dene.', 'Telefonun burada kayıt yapamıyor.'],
    vi: ['Nói… chạm để dừng', 'Micro bị chặn: hãy cho phép trong trình duyệt.', 'Đã đạt giới hạn ghi âm hôm nay.', 'Ghi âm bị từ chối, thử lại.', 'Điện thoại của bạn không ghi âm được ở đây.'],
    id: ['Bicara… ketuk untuk berhenti', 'Mikrofon diblokir: izinkan di browser.', 'Batas pesan suara hari ini tercapai.', 'Pesan suara ditolak, coba lagi.', 'Ponselmu tidak bisa merekam di sini.'],
    ru: ['Говорите… нажмите, чтобы остановить', 'Микрофон запрещён: разрешите его в браузере.', 'Лимит голосовых на сегодня исчерпан.', 'Голосовое отклонено, попробуйте снова.', 'Ваш телефон не может записывать здесь.'],
    de: ['Sprich… tippen zum Stoppen', 'Mikrofon blockiert: im Browser erlauben.', 'Limit für Sprachnachrichten heute erreicht.', 'Sprachnachricht abgelehnt, nochmal versuchen.', 'Dein Handy kann hier nicht aufnehmen.'],
    zh: ['请说话… 点击停止', '麦克风被禁止：请在浏览器中允许。', '今天的语音消息已达上限。', '语音消息发送失败，请重试。', '你的手机无法在此录音。'],
    hi: ['बोलें… रोकने के लिए टैप करें', 'माइक्रोफ़ोन बंद है: ब्राउज़र में अनुमति दें।', 'आज की वॉइस नोट सीमा पूरी हो गई।', 'वॉइस नोट अस्वीकार, फिर कोशिश करें।', 'आपका फ़ोन यहाँ रिकॉर्ड नहीं कर सकता।']
  };
  function A(i) { var l = (document.documentElement.lang || 'fr').slice(0, 2); return (AUD[l] || AUD.en)[i]; }
  var pendingAud = '', rec = null, recT = 0, recAt = 0;
  function isAud(u) { return /\.(webm|m4a|ogg)$/.test(String(u || '')); }
  function media(u) { return isAud(u) ? '<audio class="lv-aud" controls preload="none" src="' + esc(u) + '"></audio>' : '<img src="' + esc(u) + '" alt="" loading="lazy">'; }
  function clearAud() { pendingAud = ''; if (!pendingImg) { $('livePrev').hidden = true; $('livePrev').innerHTML = ''; } }
  function micStop() { if (rec && rec.state === 'recording') { try { rec.stop(); } catch (e) { /* ignore */ } } }
  async function micStart() {
    var toast = function (m) { if (D6.App && D6.App.toast) D6.App.toast(m, 'err'); };
    if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast(A(4)); return; }
    var stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { toast(A(1)); return; }
    var type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].filter(function (t) { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } })[0] || '';
    var parts = [];
    try { rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 }); } catch (e) { stream.getTracks().forEach(function (t) { t.stop(); }); toast(A(4)); return; }
    rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) parts.push(ev.data); };
    rec.onstop = function () {
      clearInterval(recT); stream.getTracks().forEach(function (t) { t.stop(); });
      $('liveMic').classList.remove('on'); $('liveMicT').textContent = ''; $('liveForm').classList.remove('lv-rec'); $('liveText').placeholder = L().ph;
      var blob = new Blob(parts, { type: (rec.mimeType || type || 'audio/webm').split(';')[0] });
      rec = null;
      if (Date.now() - recAt < 700 || blob.size < 400) return; // touché par erreur
      var fr = new FileReader();
      fr.onload = function () {
        pendingAud = String(fr.result || '');
        pendingImg = '';
        $('livePrev').innerHTML = '<audio controls src="' + URL.createObjectURL(blob) + '"></audio><button type="button" aria-label="x">✕</button>';
        $('livePrev').hidden = false;
        $('livePrev').querySelector('button').addEventListener('click', clearAud);
      };
      fr.readAsDataURL(blob);
    };
    recAt = Date.now();
    rec.start();
    $('liveMic').classList.add('on'); $('liveForm').classList.add('lv-rec');
    $('liveText').placeholder = A(0);
    var tick = function () { var s = Math.min(10, Math.floor((Date.now() - recAt) / 1000)); $('liveMicT').textContent = '0:' + (s < 10 ? '0' : '') + s; if (Date.now() - recAt >= 10000) micStop(); };
    tick(); recT = setInterval(tick, 250);
  }

  async function send(e) {
    if (e) e.preventDefault();
    if (busy) return;
    micStop();
    var x = L(), t = $('liveText'), text = t.value.trim();
    if (!text && !pendingImg && !pendingAud) return;
    busy = true; $('liveGo').disabled = true;
    var j = await call('send', { text: text, img: pendingImg, aud: pendingImg ? '' : pendingAud, lang: (document.documentElement.lang || 'fr').slice(0, 2) });
    busy = false; $('liveGo').disabled = false;
    if (j && !j.ok && (j.reason === 'tooManyAud' || j.reason === 'badAud')) { if (D6.App && D6.App.toast) D6.App.toast(A(j.reason === 'tooManyAud' ? 2 : 3), 'err'); return; }
    if (j && j.ok) {
      t.value = ''; grow(); pendingImg = ''; pendingAud = ''; $('livePrev').hidden = true; $('livePrev').innerHTML = '';
      // v2694 : jamais deux fois le même message (la lecture automatique peut l'avoir déjà apporté)
      var add = function (m) { if (m && !lastMsgs.some(function (z) { return z.id && z.id === m.id; })) lastMsgs.push(m); paintChat({ msgs: lastMsgs }); };
      add(j.msg);
      // v2689 : réponse automatique « bien reçu, merci de patienter » (affichée un instant après)
      if (j.auto) setTimeout(function () { add(j.auto); }, 900);
    } else if (j && j.login) { toAuth('login'); }
    else if (D6.App && D6.App.toast) D6.App.toast(x[(j && j.reason) || 'fail'] || x.fail, 'err');
  }

  function boot() {
    if (!$('liveModal')) return;
    $('closeLive').addEventListener('click', close);
    $('closeLive').style.setProperty('display', 'none', 'important'); // v2689 : plus de croix, la flèche retour suffit
    $('liveModal').addEventListener('click', function (e) { if (e.target === $('liveModal')) close(); });
    $('liveTabNews').addEventListener('click', function () { show('news'); });
    $('liveTabChat').addEventListener('click', function () { show('chat'); });
    if ($('liveTabFriends')) { $('liveTabFriends').addEventListener('click', function () { show('friends'); }); bootFriends(); }
    // Un seul bouton retour : d'une conversation → la liste ; de la liste → l'accueil.
    if ($('liveBack')) $('liveBack').addEventListener('click', function () {
      clearInterval(duelTick); clearInterval(duelPoll);
      if (D6.Social2 && D6.Social2.back(tab)) return; // v2796 : retour à la messagerie
      if (tab === 'friends' && peer) { peer = null; friendsList(); return; }
      if (tab === 'groups' && D6.LiveGroups && D6.LiveGroups.inGroup()) { D6.LiveGroups.back(); return; }
      peer = null;
      if (tab === 'home') { close(); return; } // v2812 : le menu est la première page de Social (membre et visiteur) → ‹ = accueil
      show('home');
    });
    // v2689 : le pack de la langue vient d'arriver → l'accueil Live est redessiné dans la bonne langue
    document.addEventListener('oro:livepack', function () { if ($('liveModal').classList.contains('active') && tab === 'home') paintHome(); });
    var lastLang = document.documentElement.lang;
    document.addEventListener('oro:lang', function () { if (document.documentElement.lang === lastLang) return; lastLang = document.documentElement.lang; if ($('liveModal').classList.contains('active') && tab === 'home') paintHome(); });
    $('liveForm').addEventListener('submit', send);
    $('liveText').addEventListener('input', grow);
    if ($('liveMic')) $('liveMic').addEventListener('click', function () { if (rec) micStop(); else micStart(); });
    $('liveFile').addEventListener('change', async function () {
      var f = this.files && this.files[0]; this.value = '';
      if (!f) return;
      try {
        pendingImg = await shrink(f); pendingAud = '';
        $('livePrev').innerHTML = '<img src="' + pendingImg + '" alt=""><button type="button" aria-label="x">✕</button>';
        $('livePrev').hidden = false;
        $('livePrev').querySelector('button').addEventListener('click', function () { pendingImg = ''; $('livePrev').hidden = true; $('livePrev').innerHTML = ''; });
      } catch (err) { if (D6.App && D6.App.toast) D6.App.toast(L().badImg, 'err'); }
    });
    // Réponse de l'équipe reçue en notification (lien /?live=1) → la conversation s'ouvre.
    try { if (/[?&]live=1/.test(location.search)) setTimeout(function () { open('chat'); }, 1500); else if (/[?&]live=amis/.test(location.search)) setTimeout(function () { open('dms'); }, 1500); } catch (e) { /* ignore */ }
    // Pastille « réponse non lue » sur le bouton Live : une seule lecture, 6 s après l'ouverture du site.
    setTimeout(async function () {
      if (guest()) return;
      var j = await call('feed', {});
      if (j && j.ok && j.me) { dmUn = j.me.dmUnread || 0; var bf = $('liveBadgeF'); if (bf) bf.textContent = dmUn > 0 ? String(dmUn) : ''; setBadge(j.me.unread || 0); }
    }, 6000);
  }

  // v2763 (propriétaire) : le visiteur qui part s'inscrire depuis Social revient sur la même page s'il touche « Retour »
  function toAuth(a) {
    var t = tab, s2 = curSub;
    // 2026-10-23 : depuis une page « Inscris-toi » (visiteur), on revient sur la VRAIE page demandée une fois inscrit
    // (Mes amis, Groupes, Quiz…) — retour sans inscription : la même page visiteur, comme avant.
    if (D6.App && D6.App.authReturn) D6.App.authReturn(function () {
      open('home');
      if (t === 'guest' && s2 && !guest()) tileGo(s2);
      else if (t !== 'home') show(t, s2 || undefined);
    });
    close(); if (D6.App && D6.App.showAuth) D6.App.showAuth(a || 'register');
  }
  // v2796 : pastilles (bouton Social) mises à jour par la messagerie
  function badges(me) { if (!me) return; dmUn = me.dmUnread || 0; setFriendBadge(dmUn); setBadge(me.unread || 0); if (tab === 'home' && $('liveModal') && $('liveModal').classList.contains('active')) paintMsgBar(); }
  // v2812 : état de la page (pour revenir au même endroit après une actualisation, js/back.js)
  D6.Live = { open: open, close: close, toAuth: toAuth, show: show, badges: badges, state: function () { return { tab: tab, sub: curSub }; } };
  /* v2796 — la messagerie (js/social2.js + css/social2.css) est chargée tout de suite après la page, une seule fois
     (si index.html ne les a pas déjà). Sans elle, l'ancien Social marche comme avant. */
  (function () {
    var v = ((document.currentScript && /[?&]v=(\d+)/.exec(document.currentScript.src)) || [])[1] || '1';
    var go = function () {
      if (!document.querySelector('link[href*="css/social2.css"]')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/social2.css?v=' + v; document.head.appendChild(l); }
      if (!document.querySelector('script[src*="js/social2.js"]') && !D6.Social2) { var s = document.createElement('script'); s.src = 'js/social2.js?v=' + v; s.async = true; document.head.appendChild(s); }
    };
    // v2806 : chargée juste APRÈS l'affichage du site (le démarrage reste rapide) ; Social reste prêt avant qu'on le touche
    var later = function () { if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 1200); };
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
  })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.D6 = window.D6 || {});
