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
  // v2790 (propriétaire) : seul le créateur publie ; invitations à accepter (identifiant R… ou e-mail) — 12 langues
  var G2 = {"fr":{"onlyOwner":"Ici, seul le créateur du groupe publie. Tu reçois tout ce qu’il écrit 🙂","invPh":"Identifiant (R…) ou e-mail","invGo":"Inviter","invSent":"{n} invitation(s) envoyée(s) ✓","invNf":"Identifiant ou e-mail introuvable.","invTitle":"Invitations","invFrom":"{a} t’invite","yes":"Accepter","no":"Refuser","tooManyG":"Tu as créé plusieurs groupes ces derniers temps. Tu pourras en créer un autre un peu plus tard 🙂","gOwnerOnly":"Ici, seul le créateur du groupe publie.","invN":"Inviter ({n})","invHint":"La personne reçoit une invitation et choisit d’entrer ou non."},"en":{"onlyOwner":"Here, only the group creator posts. You receive everything they write 🙂","invPh":"ID (R…) or email","invGo":"Invite","invSent":"{n} invitation(s) sent ✓","invNf":"ID or email not found.","invTitle":"Invitations","invFrom":"{a} invites you","yes":"Accept","no":"Decline","tooManyG":"You created several groups recently. You can create another one a bit later 🙂","gOwnerOnly":"Here, only the group creator posts.","invN":"Invite ({n})","invHint":"The person gets an invitation and chooses to join or not."},"es":{"onlyOwner":"Aquí solo publica el creador del grupo. Recibes todo lo que escribe 🙂","invPh":"ID (R…) o correo","invGo":"Invitar","invSent":"{n} invitación(es) enviada(s) ✓","invNf":"ID o correo no encontrado.","invTitle":"Invitaciones","invFrom":"{a} te invita","yes":"Aceptar","no":"Rechazar","tooManyG":"Has creado varios grupos últimamente. Podrás crear otro un poco más tarde 🙂","gOwnerOnly":"Aquí solo publica el creador del grupo.","invN":"Invitar ({n})","invHint":"La persona recibe una invitación y decide si entra o no."},"pt":{"onlyOwner":"Aqui só o criador do grupo publica. Recebes tudo o que ele escreve 🙂","invPh":"ID (R…) ou e-mail","invGo":"Convidar","invSent":"{n} convite(s) enviado(s) ✓","invNf":"ID ou e-mail não encontrado.","invTitle":"Convites","invFrom":"{a} convida-te","yes":"Aceitar","no":"Recusar","tooManyG":"Criaste vários grupos recentemente. Poderás criar outro um pouco mais tarde 🙂","gOwnerOnly":"Aqui só o criador do grupo publica.","invN":"Convidar ({n})","invHint":"A pessoa recebe um convite e escolhe se entra ou não."},"ar":{"onlyOwner":"هنا ينشر منشئ المجموعة فقط. ستصلك كل رسائله 🙂","invPh":"المعرّف (R…) أو البريد","invGo":"دعوة","invSent":"تم إرسال {n} دعوة ✓","invNf":"المعرّف أو البريد غير موجود.","invTitle":"الدعوات","invFrom":"{a} يدعوك","yes":"قبول","no":"رفض","tooManyG":"لقد أنشأت عدة مجموعات مؤخرًا. يمكنك إنشاء أخرى لاحقًا 🙂","gOwnerOnly":"هنا ينشر منشئ المجموعة فقط.","invN":"دعوة ({n})","invHint":"يتلقى الشخص دعوة ويختار الانضمام أو لا."},"tr":{"onlyOwner":"Burada sadece grubu kuran paylaşım yapar. Yazdığı her şey sana gelir 🙂","invPh":"Kimlik (R…) veya e-posta","invGo":"Davet et","invSent":"{n} davet gönderildi ✓","invNf":"Kimlik veya e-posta bulunamadı.","invTitle":"Davetler","invFrom":"{a} seni davet ediyor","yes":"Kabul et","no":"Reddet","tooManyG":"Son zamanlarda birkaç grup kurdun. Biraz sonra yenisini kurabilirsin 🙂","gOwnerOnly":"Burada sadece grubu kuran paylaşım yapar.","invN":"Davet et ({n})","invHint":"Kişi bir davet alır ve katılıp katılmamayı seçer."},"vi":{"onlyOwner":"Ở đây chỉ người tạo nhóm đăng bài. Bạn nhận mọi tin họ viết 🙂","invPh":"ID (R…) hoặc email","invGo":"Mời","invSent":"Đã gửi {n} lời mời ✓","invNf":"Không tìm thấy ID hoặc email.","invTitle":"Lời mời","invFrom":"{a} mời bạn","yes":"Đồng ý","no":"Từ chối","tooManyG":"Gần đây bạn đã tạo nhiều nhóm. Bạn có thể tạo thêm sau ít lâu 🙂","gOwnerOnly":"Ở đây chỉ người tạo nhóm đăng bài.","invN":"Mời ({n})","invHint":"Người đó nhận lời mời và tự chọn tham gia hay không."},"id":{"onlyOwner":"Di sini hanya pembuat grup yang memposting. Kamu menerima semua tulisannya 🙂","invPh":"ID (R…) atau email","invGo":"Undang","invSent":"{n} undangan terkirim ✓","invNf":"ID atau email tidak ditemukan.","invTitle":"Undangan","invFrom":"{a} mengundangmu","yes":"Terima","no":"Tolak","tooManyG":"Kamu baru membuat beberapa grup. Kamu bisa membuat lagi nanti 🙂","gOwnerOnly":"Di sini hanya pembuat grup yang memposting.","invN":"Undang ({n})","invHint":"Orang itu menerima undangan dan memilih bergabung atau tidak."},"ru":{"onlyOwner":"Здесь пишет только создатель группы. Вы получаете всё, что он пишет 🙂","invPh":"ID (R…) или e-mail","invGo":"Пригласить","invSent":"Отправлено приглашений: {n} ✓","invNf":"ID или e-mail не найден.","invTitle":"Приглашения","invFrom":"{a} приглашает вас","yes":"Принять","no":"Отклонить","tooManyG":"Вы недавно создали несколько групп. Новую можно будет создать чуть позже 🙂","gOwnerOnly":"Здесь пишет только создатель группы.","invN":"Пригласить ({n})","invHint":"Человек получает приглашение и сам решает, вступать ли."},"de":{"onlyOwner":"Hier postet nur der Gründer der Gruppe. Du bekommst alles, was er schreibt 🙂","invPh":"ID (R…) oder E-Mail","invGo":"Einladen","invSent":"{n} Einladung(en) gesendet ✓","invNf":"ID oder E-Mail nicht gefunden.","invTitle":"Einladungen","invFrom":"{a} lädt dich ein","yes":"Annehmen","no":"Ablehnen","tooManyG":"Du hast in letzter Zeit mehrere Gruppen erstellt. Etwas später kannst du eine neue erstellen 🙂","gOwnerOnly":"Hier postet nur der Gründer der Gruppe.","invN":"Einladen ({n})","invHint":"Die Person bekommt eine Einladung und entscheidet selbst."},"zh":{"onlyOwner":"这里只有群主可以发言。你会收到他发的所有内容 🙂","invPh":"ID（R…）或邮箱","invGo":"邀请","invSent":"已发送 {n} 个邀请 ✓","invNf":"找不到该 ID 或邮箱。","invTitle":"邀请","invFrom":"{a} 邀请你","yes":"接受","no":"拒绝","tooManyG":"你最近创建了好几个群组，稍后可以再创建 🙂","gOwnerOnly":"这里只有群主可以发言。","invN":"邀请（{n}）","invHint":"对方会收到邀请，自己决定是否加入。"},"hi":{"onlyOwner":"यहाँ केवल ग्रुप बनाने वाला पोस्ट करता है। उसकी हर बात आपको मिलती है 🙂","invPh":"ID (R…) या ईमेल","invGo":"आमंत्रित करें","invSent":"{n} आमंत्रण भेजे गए ✓","invNf":"ID या ईमेल नहीं मिला।","invTitle":"आमंत्रण","invFrom":"{a} आपको आमंत्रित करते हैं","yes":"स्वीकार","no":"अस्वीकार","tooManyG":"आपने हाल में कई ग्रुप बनाए हैं। थोड़ी देर बाद नया बना सकेंगे 🙂","gOwnerOnly":"यहाँ केवल ग्रुप बनाने वाला पोस्ट करता है।","invN":"आमंत्रित करें ({n})","invHint":"व्यक्ति को आमंत्रण मिलता है और वह खुद चुनता है।"}};
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return Object.assign({}, T.en, G2.en, T[l] || {}, G2[l] || {}); }
  // petit message doux montré au plus 3 fois (puis plus jamais)
  function soft(k) { var n = 0; try { n = +(localStorage.getItem('oro_soft_' + k) || 0); if (n < 3) localStorage.setItem('oro_soft_' + k, String(n + 1)); } catch (e) { n = 0; } return n < 3; }
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
      $('lgSign').addEventListener('click', function () { if (D6.Live && D6.Live.toAuth) { D6.Live.toAuth('register'); return; } if (D6.Live) D6.Live.close(); if (D6.App && D6.App.showAuth) D6.App.showAuth('register'); });
      return;
    }
    // v2905 (propriétaire) : plus jamais d'entrée AUTOMATIQUE dans un groupe (avant, un lien ouvert plus tôt faisait entrer
    // le joueur tout seul, des minutes après). On rejoint seulement en touchant « Rejoindre » sur l'aperçu (js/social2.js).
    var j = await call('groups', {});
    var invs = (j && j.ok && j.inv) || [];
    var invHtml = invs.length ? '<div class="lg-invs"><p class="lgi-h">' + esc(x.invTitle) + '</p>' + invs.map(function (v) {
      return '<div class="lg-inv"><span class="lf-av lg-emo">' + esc(v.emoji) + '</span><span class="lf-ct"><b>' + esc(v.name) + '</b><small>' + esc(x.invFrom.replace('{a}', v.by)) + ' · ' + esc(v.n === 1 ? x.n1 : x.n.replace('{n}', v.n)) + '</small></span>' +
        '<button type="button" class="lg-inv-no" data-ia="0" data-ig="' + esc(v.gid) + '">' + esc(x.no) + '</button><button type="button" class="lg-inv-ok" data-ia="1" data-ig="' + esc(v.gid) + '">' + esc(x.yes) + '</button></div>';
    }).join('') + '</div>' : '';
    var items = (j && j.ok && j.list.length) ? j.list.map(function (g) {
      return '<button type="button" class="lf-c" data-g="' + esc(g.id) + '"><span class="lf-av lg-emo">' + esc(g.emoji) + '</span><span class="lf-ct"><b>' + esc(g.name) + '</b><small>' + esc(g.last || (g.n === 1 ? x.n1 : x.n.replace('{n}', g.n))) + '</small></span><span class="lf-t">' + ago(g.at) + '</span></button>';
    }).join('') : '<p class="lf-empty">' + esc(x.none) + '</p>';
    box.innerHTML = '<div class="lg-new"><b>' + esc(x.create) + '</b><div class="lg-emos">' + EMO.map(function (e) { return '<button type="button" class="' + (e === pick ? 'on' : '') + '" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>' +
      '<form class="lf-find" id="lgForm" autocomplete="off"><input id="lgName" maxlength="40" placeholder="' + esc(x.namePh) + '"><button type="submit">' + esc(x.go) + '</button></form><p class="lf-msg" id="lgMsg"></p></div>' + invHtml + '<div class="lf-convs">' + items + '</div>';
    box.querySelectorAll('[data-ig]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var yes = b.getAttribute('data-ia') === '1';
        b.disabled = true;
        var r = await call('gAnswer', { gid: b.getAttribute('data-ig'), yes: yes ? 1 : 0 });
        if (yes && r && r.ok && r.g) { toast(x.joined.replace('{n}', r.g.name)); openGroup(r.g.id); return; }
        if (r && !r.ok) toast(x[r.reason] || x.fail, 'err');
        list();
      });
    });
    box.querySelectorAll('.lg-emos button').forEach(function (b) { b.addEventListener('click', function () { pick = b.getAttribute('data-e'); box.querySelectorAll('.lg-emos button').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('lgForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var r = await call('gCreate', { name: $('lgName').value, emoji: pick });
      if (r && r.ok) openGroup(r.g.id); else $('lgMsg').textContent = x[(r && r.reason) || 'fail'] || x.fail; // tooManyG = message doux, jamais de chiffre
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
      (cur.canWrite === false ? (soft('gread') ? '<p class="lg-only">' + esc(x.onlyOwner) + '</p>' : '') : '<form class="live-send" id="lgSend" autocomplete="off"><label class="live-cam"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg><input type="file" id="lgFile" accept="image/*" hidden></label>' +
      '<div class="live-in-wrap"><div class="live-prev" id="lgPrev" hidden></div><textarea id="lgText" rows="1" maxlength="1000" placeholder="' + esc(x.ph) + '"></textarea></div><button type="submit" class="live-go" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg></button></form>');
    paintMsgs(cur.msgs);
    $('lgBack').addEventListener('click', list);
    $('lgHead').addEventListener('click', info);
    if ($('lgSend')) {
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
    }
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
      '<form class="lf-find lga-id" id="lgaIdF" autocomplete="off"><input id="lgaId" maxlength="80" inputmode="email" autocapitalize="characters" spellcheck="false" placeholder="' + esc(x.invPh) + '"><button type="submit">' + esc(x.invGo) + '</button></form>' +
      (soft('ginv') ? '<p class="lga-hint">' + esc(x.invHint) + '</p>' : '') +
      (fr.length ? '<input class="lga-q" id="lgaQ" placeholder="' + esc(x.search) + '" autocomplete="off"><div class="lga-list" id="lgaList">' + fr.map(function (f) {
        var on = !!inG[f.id];
        return '<button type="button" class="lgi-row lga-r' + (on ? ' in' : '') + '" data-id="' + esc(f.id) + '" data-n="' + esc(String(f.name || '').toLowerCase()) + '"' + (on ? ' disabled' : '') + '><i style="--av:' + avc(f.name) + '">' + esc((f.name || '?').charAt(0).toUpperCase()) + '</i><b>' + esc(f.name || f.id) + (on ? '<small>' + esc(x.inGrp) + '</small>' : '') + '</b><span class="lga-ck"></span></button>';
      }).join('') + '</div><button type="button" class="lga-go" id="lgaGo" disabled>' + esc(x.invN.replace('{n}', 0)) + '</button>'
        : '<p class="lf-empty">' + esc(x.pickNone) + '</p><button type="button" class="lga-go" id="lgaInv">' + esc(x.invite) + '</button>');
    el.hidden = false;
    $('lgaBack').addEventListener('click', info);
    if ($('lgaInv')) $('lgaInv').addEventListener('click', function () { shareLink(false); });
    var done = function (r) {
      if (r && r.ok && r.n) toast(x.invSent.replace('{n}', r.n));
      else if (r && r.ok && r.in) toast(x.inGrp, 'err');
      else if (r && r.ok && r.nf) toast(x.invNf, 'err');
      else toast(x[(r && r.reason) || 'gNoneAdded'] || x.fail, 'err');
    };
    $('lgaIdF').addEventListener('submit', async function (e) {
      e.preventDefault();
      var v = $('lgaId').value.trim(); if (v.length < 7) { toast(x.invNf, 'err'); return; }
      var r = await call('gInvite', { gid: cur.id, ids: [v] });
      done(r); if (r && r.ok && r.n) $('lgaId').value = '';
    });
    if (!fr.length) return;
    var paint = function () { var n = Object.keys(sel).length; $('lgaGo').disabled = !n; $('lgaGo').textContent = x.invN.replace('{n}', n); };
    el.querySelectorAll('.lga-r:not(.in)').forEach(function (b) {
      b.addEventListener('click', function () { var id = b.getAttribute('data-id'); if (sel[id]) delete sel[id]; else sel[id] = 1; b.classList.toggle('on', !!sel[id]); paint(); });
    });
    $('lgaQ').addEventListener('input', function () { var q = this.value.trim().toLowerCase(); el.querySelectorAll('.lga-r').forEach(function (b) { b.hidden = !!q && b.getAttribute('data-n').indexOf(q) < 0 && b.getAttribute('data-id').toLowerCase().indexOf(q) < 0; }); });
    $('lgaGo').addEventListener('click', async function () {
      var ids = Object.keys(sel); if (!ids.length) return;
      this.disabled = true;
      var r = await call('gInvite', { gid: cur.id, ids: ids });
      done(r);
      if (r && r.ok) info(); else paint();
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
  /* Lien d'invitation : orolado.com/?g=JETON. v2905 (propriétaire) : avant, le site ouvrait l'ancienne page « Créer un
     groupe » (la messagerie n'était pas encore chargée) puis faisait entrer le joueur TOUT SEUL dans le groupe. Maintenant :
     on attend que le site et la messagerie soient prêts, puis on montre l'APERÇU du groupe (js/social2.js joinPreview) ;
     le joueur choisit lui-même « Rejoindre ». Le code est retiré de l'adresse (une actualisation ne rejoue rien). */
  function bootJoin() {
    var m = /[?&]g=([a-f0-9]{8,40})(?:&|#|$)/i.exec(location.search);
    if (!m) return;
    var tok = m[1].toLowerCase();
    try { var qs = location.search.replace(/([?&])g=[^&]*(&|$)/, '$1').replace(/[?&]$/, ''); history.replaceState(history.state, '', location.pathname + qs + location.hash); } catch (e) { /* ignore */ }
    D6.SxJoinWait = tok;
    var t0 = Date.now(), injected = false;
    (function wait() {
      var h = document.documentElement, st = $('screenTrade');
      var ready = h.classList.contains('oro-booted') && st && !st.classList.contains('hidden') && D6.Live && D6.App && D6.App.openModal;
      if (ready && D6.Social2 && D6.Social2.joinPreview) { if (D6.SxJoinWait === tok) { D6.SxJoinWait = ''; D6.Social2.joinPreview(tok); } return; }
      if (ready && !D6.Social2 && !injected && Date.now() - t0 > 1200 && !document.querySelector('script[src*="js/social2.js"]')) {
        injected = true;
        var v = ((document.querySelector('script[src*="js/live.js"]') || {}).src || '').replace(/^.*[?&]v=(\d+).*$/, '$1') || '1';
        var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/social2.css?v=' + v; document.head.appendChild(l);
        var s = document.createElement('script'); s.src = 'js/social2.js?v=' + v; s.async = true; document.head.appendChild(s);
      }
      if (Date.now() - t0 < 25000) setTimeout(wait, 150);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootJoin); else bootJoin();
  D6.LiveGroups = { t: X, open: open, stop: stop, inGroup: function () { return !!cur; }, back: list, title: function () { return X().title; }, sub: function () { return X().sub; } };
})(window.D6 = window.D6 || {});
