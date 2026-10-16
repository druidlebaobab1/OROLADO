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
      fail: 'Envoi impossible, réessaie.', team: 'OROLADO', now: 'à l’instant', min: 'min', h: 'h', d: 'j', terms: 'Conditions', privacy: 'Confidentialité', you: 'Toi' },
    en: { sub: 'Online · the team answers you here', news: 'News', chat: 'Write to us', ph: 'Write your message…', views: 'views',
      welcomeNews: 'Welcome to OROLADO Live! 👋\nHere you find our news: new features, payment methods, markets on the move… And in “Write to us”, you can talk directly to the team.',
      welcomeChat: 'Hello 👋 Write to us here, we answer in this conversation.\nYou can also send a photo 📷 (for example a payment screenshot).',
      q1: '💳 My deposit', q1t: 'Hello, I have an issue with my deposit: ', q2: '💸 My withdrawal', q2t: 'Hello, I have a question about my withdrawal: ',
      q3: '📈 How to play?', q3t: 'Hello, how do I play well on OROLADO?', q4: '🔐 My account', q4t: 'Hello, I have an issue with my account: ',
      guestT: 'Sign up to write to the team', guestB: 'With your account, you can write to us and send photos. We answer you here.', guestBtn: 'Create my account', guestMail: 'Write by e-mail',
      sent: 'Sent ✓', tooMany: 'Too many messages. Try again in a moment.', tooManyImg: 'Limit of 10 photos per day reached.', badImg: 'Photo refused. Try another image.',
      fail: 'Could not send, try again.', team: 'OROLADO', now: 'just now', min: 'min', h: 'h', d: 'd', terms: 'Terms', privacy: 'Privacy', you: 'You' }
  };
  function L() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return TXT[l === 'fr' ? 'fr' : 'en']; }
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

  function setBadge(n) {
    var b = $('liveBadge'); if (b) b.textContent = n > 0 ? String(n) : '';
    var btn = $('btnHelp'); if (btn) btn.classList.toggle('lv-has', n > 0);
  }

  async function load(read) {
    var j = await call('feed', { read: read ? 1 : 0 });
    if (!j || !j.ok) return;
    if (tab === 'news') paintNews(j.posts || []);
    paintChat(j.me);
    setBadge(read ? 0 : ((j.me && j.me.unread) || 0));
  }

  function show(w) {
    tab = w;
    $('liveTabNews').classList.toggle('on', w === 'news'); $('liveTabChat').classList.toggle('on', w === 'chat');
    $('livePaneNews').hidden = w !== 'news'; $('livePaneChat').hidden = w !== 'chat';
    clearInterval(timer);
    load(w === 'chat');
    if (w === 'chat' && !guest()) timer = setInterval(function () { if (!document.hidden) load(true); }, 15000);
  }

  function open(w) {
    var x = L();
    $('liveSub').textContent = x.sub; $('liveTabNewsT').textContent = x.news; $('liveTabChatT').textContent = x.chat; $('liveText').placeholder = x.ph;
    if (D6.App && D6.App.openModal) D6.App.openModal('liveModal');
    show(w || (($('liveBadge') && $('liveBadge').textContent) ? 'chat' : 'news'));
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
    try { if (/[?&]live=1/.test(location.search)) setTimeout(function () { open('chat'); }, 1500); } catch (e) { /* ignore */ }
    // Pastille « réponse non lue » sur le bouton Live : une seule lecture, 6 s après l'ouverture du site.
    setTimeout(async function () {
      if (guest()) return;
      var j = await call('feed', {});
      if (j && j.ok && j.me) setBadge(j.me.unread || 0);
    }, 6000);
  }

  D6.Live = { open: open, close: close };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.D6 = window.D6 || {});
