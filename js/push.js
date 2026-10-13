(function (D6) {
  'use strict';
  /**
   * v2607 — Alertes sur le téléphone (notifications, comme une vraie application).
   * 1) Après le premier ACHETER / VENDRE, petite carte « Alertes OROLADO » : Activer / Plus tard.
   * 2) « Activer » → fenêtre officielle du téléphone (Autoriser / Bloquer) → abonnement envoyé à push.php.
   * 3) Appli installée ouverte : signalée une fois par jour (compteur Android / iPhone de l'admin).
   * Jamais au démarrage, jamais pendant un clic sur ACHETER / VENDRE, au plus 3 « Plus tard ».
   */
  var TXT = {
    fr: ['Alertes OROLADO', 'Recevez les marchés en vogue et vos bonus directement sur votre téléphone.', 'Activer', 'Plus tard', 'Alertes activées ✓'],
    en: ['OROLADO alerts', 'Get trending markets and your bonuses straight to your phone.', 'Turn on', 'Later', 'Alerts on ✓'],
    es: ['Alertas OROLADO', 'Recibe los mercados en tendencia y tus bonos directamente en tu teléfono.', 'Activar', 'Más tarde', 'Alertas activadas ✓'],
    pt: ['Alertas OROLADO', 'Receba os mercados em alta e seus bônus direto no seu celular.', 'Ativar', 'Mais tarde', 'Alertas ativados ✓'],
    ar: ['تنبيهات OROLADO', 'استقبل الأسواق الرائجة ومكافآتك مباشرة على هاتفك.', 'تفعيل', 'لاحقًا', 'تم تفعيل التنبيهات ✓'],
    tr: ['OROLADO bildirimleri', 'Trend piyasaları ve bonuslarınızı doğrudan telefonunuza alın.', 'Aç', 'Sonra', 'Bildirimler açık ✓'],
    vi: ['Thông báo OROLADO', 'Nhận thị trường đang hot và tiền thưởng ngay trên điện thoại.', 'Bật', 'Để sau', 'Đã bật thông báo ✓'],
    id: ['Notifikasi OROLADO', 'Dapatkan pasar yang sedang tren dan bonus Anda langsung di ponsel.', 'Aktifkan', 'Nanti', 'Notifikasi aktif ✓'],
    ru: ['Уведомления OROLADO', 'Получайте популярные рынки и бонусы прямо на телефон.', 'Включить', 'Позже', 'Уведомления включены ✓'],
    de: ['OROLADO-Benachrichtigungen', 'Erhalte Trend-Märkte und deine Boni direkt aufs Handy.', 'Aktivieren', 'Später', 'Benachrichtigungen an ✓'],
    hi: ['OROLADO अलर्ट', 'ट्रेंडिंग मार्केट और अपने बोनस सीधे अपने फ़ोन पर पाएं।', 'चालू करें', 'बाद में', 'अलर्ट चालू ✓']
  };
  var reg = null;
  var asked = false;

  function lang() { try { return (D6.I18N && D6.I18N.lang) || 'fr'; } catch (e) { return 'fr'; } }
  function txt(i) { var l = TXT[lang()] || TXT.en; return l[i]; }
  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, String(v));
    } catch (e) { /* ignore */ }
    return null;
  }
  function plat() {
    var ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    return 'pc';
  }
  function isApp() {
    try {
      if (window.navigator.standalone) return true;
      var mq = function (m) { return window.matchMedia('(display-mode: ' + m + ')').matches; };
      return mq('standalone') || mq('fullscreen') || mq('minimal-ui');
    } catch (e) { return false; }
  }
  function supported() {
    return !!(reg && reg.pushManager && 'Notification' in window && 'PushManager' in window);
  }
  function post(body) {
    return fetch('/push.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  function keyBytes(b64) {
    var s = String(b64).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var raw = atob(s), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  // Clé publique du site, gardée sur le téléphone (la demander pendant le toucher « Activer » ferait
  // perdre l'autorisation du geste sur iPhone).
  function loadKey() {
    var k = ls('oro_push_key');
    if (k) return Promise.resolve(k);
    return post({ action: 'key' }).then(function (j) {
      if (j && j.ok && j.key) { ls('oro_push_key', j.key); return j.key; }
      return '';
    });
  }
  function sendSub(sub) {
    if (!sub) return Promise.resolve(null);
    var tok = '';
    try { tok = (D6.Api && D6.Api.token && D6.Api.token()) || ''; } catch (e) { tok = ''; }
    return post({ action: 'sub', sub: sub.toJSON ? sub.toJSON() : sub, plat: plat(), app: isApp() ? 1 : 0, lang: lang(), token: tok })
      .then(function (j) { if (j && j.ok) ls('oro_push_sent', Date.now()); return j; });
  }
  // L'abonnement demande un service worker ACTIF (à la toute première visite, il s'installe encore).
  function readyReg() {
    return navigator.serviceWorker.ready.then(function (r) { reg = r; return r; });
  }
  function subscribe() {
    return Promise.all([readyReg(), loadKey()]).then(function (a) {
      var r = a[0], key = a[1];
      if (!key) return null;
      return r.pushManager.getSubscription().then(function (old) {
        return old || r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
      });
    }).then(sendSub);
  }

  // Appli installée ouverte aujourd'hui : un signal par jour (pour compter Android / iPhone).
  function pingApp() {
    if (!isApp()) return;
    var day = new Date().toISOString().slice(0, 10);
    if (ls('oro_app_ping') === day) return;
    var dev = ls('oro_dev');
    if (!dev || !/^[a-z0-9]{12,40}$/.test(dev)) {
      dev = '';
      for (var i = 0; i < 24; i++) dev += 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36));
      ls('oro_dev', dev);
    }
    post({ action: 'ping', dev: dev, plat: plat() }).then(function (j) { if (j && j.ok) ls('oro_app_ping', day); });
  }

  function hideCard(card) {
    if (!card) return;
    card.classList.remove('on');
    setTimeout(function () { if (card.parentNode) card.parentNode.removeChild(card); }, 400);
  }
  function showCard() {
    if (document.getElementById('pushAsk')) return;
    var card = document.createElement('div');
    card.id = 'pushAsk';
    card.className = 'push-ask';
    card.setAttribute('role', 'dialog');
    card.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    card.innerHTML =
      '<div class="push-ask-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z"/></svg></div>' +
      '<div class="push-ask-txt"><b></b><span></span></div>' +
      '<div class="push-ask-btns"><button type="button" class="push-ask-no"></button><button type="button" class="push-ask-yes"></button></div>';
    card.querySelector('b').textContent = txt(0);
    card.querySelector('span').textContent = txt(1);
    card.querySelector('.push-ask-yes').textContent = txt(2);
    card.querySelector('.push-ask-no').textContent = txt(3);
    card.querySelector('.push-ask-no').addEventListener('click', function () {
      ls('oro_push_later', Date.now());
      ls('oro_push_later_n', (parseInt(ls('oro_push_later_n') || '0', 10) || 0) + 1);
      hideCard(card);
    });
    card.querySelector('.push-ask-yes').addEventListener('click', function () {
      var p;
      try { p = Notification.requestPermission(); } catch (e) { p = null; }
      Promise.resolve(p).then(function (res) {
        res = res || Notification.permission;
        if (res !== 'granted') {
          try { console.warn('OROLADO alertes', 'permission', res); } catch (eW) { /* ignore */ }
          ls('oro_push_later', Date.now()); hideCard(card); return null;
        }
        return subscribe().then(function (j) {
          if (j && j.ok) {
            card.classList.add('done');
            card.querySelector('b').textContent = txt(4);
            card.querySelector('span').textContent = '';
            setTimeout(function () { hideCard(card); }, 1800);
          } else {
            hideCard(card);
          }
        });
      }).catch(function (err) {
        try { console.warn('OROLADO alertes', err && err.name, err && err.message); } catch (eW) { /* ignore */ }
        hideCard(card);
      });
    });
    document.body.appendChild(card);
    var reveal = function () { card.classList.add('on'); };
    requestAnimationFrame(function () { requestAnimationFrame(reveal); });
    setTimeout(reveal, 80); // si l'écran ne rafraîchit pas tout de suite
    setTimeout(function () { if (card.parentNode && !card.classList.contains('done')) hideCard(card); }, 20000);
  }

  function canAsk() {
    if (!supported() || Notification.permission !== 'default') return false;
    if ((parseInt(ls('oro_push_later_n') || '0', 10) || 0) >= 3) return false;
    var later = parseInt(ls('oro_push_later') || '0', 10) || 0;
    return !later || Date.now() - later > 3 * 86400000;
  }
  // Premier ACHETER / VENDRE : la carte arrive 6 s après (jamais sous le doigt).
  // (pointerdown : sur téléphone, ACHETER / VENDRE partent au doigt levé et le « clic » n'arrive pas toujours.)
  function watchTrades() {
    var onTrade = function (e) {
      if (asked || !e.target || !e.target.closest || !e.target.closest('#btnCall, #btnPut')) return;
      if (!canAsk()) return;
      asked = true;
      setTimeout(function () { if (canAsk()) showCard(); }, 6000);
    };
    window.addEventListener('pointerdown', onTrade, { capture: true, passive: true });
    window.addEventListener('click', onTrade, true);
  }

  D6.Push = {
    start: function (registration) {
      reg = registration || null;
      pingApp();
      if (!supported()) return;
      loadKey();
      // Déjà autorisé : abonnement remis à jour (lien avec le compte, appareil) au plus une fois par semaine,
      // ou recréé s'il avait été perdu.
      if (Notification.permission === 'granted') {
        var last = parseInt(ls('oro_push_sent') || '0', 10) || 0;
        readyReg().then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) {
          if (!sub) return subscribe();
          if (Date.now() - last > 7 * 86400000) return sendSub(sub);
          return null;
        }).catch(function () { /* ignore */ });
      }
    },
    // Après une connexion : l'abonnement est relié au compte du joueur.
    relink: function () {
      if (!supported() || Notification.permission !== 'granted') return;
      var tok = '';
      try { tok = (D6.Api && D6.Api.token && D6.Api.token()) || ''; } catch (e) { tok = ''; }
      var h = 0;
      for (var i = 0; i < tok.length; i++) h = (h * 31 + tok.charCodeAt(i)) | 0;
      if (!tok || ls('oro_push_link') === String(h)) return;
      readyReg().then(function (r) { return r.pushManager.getSubscription(); }).then(sendSub).then(function (j) {
        if (j && j.ok) ls('oro_push_link', String(h));
      }).catch(function () { /* ignore */ });
    },
    show: showCard,
    state: function () {
      return { reg: !!reg, supported: supported(), perm: ('Notification' in window) ? Notification.permission : 'absent', asked: asked, canAsk: canAsk(), app: isApp(), plat: plat() };
    }
  };
  watchTrades();
})(window.D6 = window.D6 || {});
