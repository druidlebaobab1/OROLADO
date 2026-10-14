(function (D6) {
  'use strict';
  /**
   * v2607 — Alertes sur le téléphone (notifications, comme une vraie application).
   * 1) Après le premier ACHETER / VENDRE, petite carte « Alertes OROLADO » : Activer / Plus tard.
   * 2) « Activer » → fenêtre officielle du téléphone (Autoriser / Bloquer) → abonnement envoyé à push.php.
   * 3) Appli installée ouverte : signalée une fois par jour (compteur Android / iPhone de l'admin).
   * Jamais au démarrage, jamais pendant un clic sur ACHETER / VENDRE, au plus 3 « Plus tard ».
   */
  // v2609 (texte validé par le propriétaire) : sérieux, sans ligne « publicité ».
  // [titre, texte, (vide), Activer, Plus tard, activé, consigne « Autoriser », Non merci (3e fois)]
  var TXT = {
    fr: ['Activez les alertes OROLADO', 'Soyez prévenu dès qu’un marché s’emballe, et recevez vos bonus et nos annonces importantes en direct. Ne ratez plus aucun bon moment.', '', 'Activer', 'Plus tard', 'Alertes activées ✓', 'Appuyez sur « Autoriser » pour recevoir vos alertes.', 'Non merci'],
    en: ['Turn on OROLADO alerts', 'Be notified as soon as a market takes off, and get your bonuses and important announcements instantly. Never miss a good moment again.', '', 'Turn on', 'Later', 'Alerts on ✓', 'Tap “Allow” to receive your alerts.', 'No thanks'],
    es: ['Activa las alertas de OROLADO', 'Recibe un aviso en cuanto un mercado se dispare, y tus bonos y anuncios importantes al instante. No te pierdas ningún buen momento.', '', 'Activar', 'Más tarde', 'Alertas activadas ✓', 'Pulsa «Permitir» para recibir tus alertas.', 'No, gracias'],
    pt: ['Ative os alertas da OROLADO', 'Seja avisado assim que um mercado disparar, e receba seus bônus e avisos importantes na hora. Não perca mais nenhum bom momento.', '', 'Ativar', 'Mais tarde', 'Alertas ativados ✓', 'Toque em “Permitir” para receber seus alertas.', 'Não, obrigado'],
    ar: ['فعّل تنبيهات OROLADO', 'كن أول من يعلم عندما ينطلق أحد الأسواق، واستلم مكافآتك وإعلاناتنا المهمة فورًا. لا تفوّت أي لحظة مناسبة بعد اليوم.', '', 'تفعيل', 'لاحقًا', 'تم تفعيل التنبيهات ✓', 'اضغط على «السماح» لتلقي تنبيهاتك.', 'لا، شكرًا'],
    tr: ['OROLADO uyarılarını açın', 'Bir piyasa hareketlendiği anda haberdar olun; bonuslarınızı ve önemli duyurularımızı anında alın. Hiçbir fırsatı kaçırmayın.', '', 'Aç', 'Sonra', 'Uyarılar açık ✓', 'Uyarıları almak için “İzin Ver”e dokunun.', 'Hayır, teşekkürler'],
    vi: ['Bật thông báo OROLADO', 'Nhận cảnh báo ngay khi một thị trường bùng nổ, cùng tiền thưởng và thông báo quan trọng tức thì. Không bỏ lỡ bất kỳ thời điểm tốt nào.', '', 'Bật', 'Để sau', 'Đã bật thông báo ✓', 'Nhấn “Cho phép” để nhận thông báo.', 'Không, cảm ơn'],
    id: ['Aktifkan notifikasi OROLADO', 'Dapatkan kabar begitu sebuah pasar melonjak, serta bonus dan pengumuman penting secara langsung. Jangan lewatkan momen terbaik.', '', 'Aktifkan', 'Nanti', 'Notifikasi aktif ✓', 'Ketuk “Izinkan” untuk menerima notifikasi.', 'Tidak, terima kasih'],
    ru: ['Включите уведомления OROLADO', 'Узнавайте сразу, когда рынок резко движется, и мгновенно получайте бонусы и важные объявления. Не упускайте удачных моментов.', '', 'Включить', 'Позже', 'Уведомления включены ✓', 'Нажмите «Разрешить», чтобы получать уведомления.', 'Нет, спасибо'],
    de: ['OROLADO-Benachrichtigungen aktivieren', 'Erfahre sofort, wenn ein Markt durchstartet, und erhalte deine Boni und wichtige Ankündigungen direkt. Verpasse keinen guten Moment mehr.', '', 'Aktivieren', 'Später', 'Benachrichtigungen an ✓', 'Tippe auf „Erlauben“, um deine Benachrichtigungen zu erhalten.', 'Nein, danke'],
    hi: ['OROLADO अलर्ट चालू करें', 'जैसे ही कोई मार्केट तेज़ी पकड़े, तुरंत जानें, और अपने बोनस व ज़रूरी घोषणाएं तुरंत पाएं। कोई भी अच्छा मौका न चूकें।', '', 'चालू करें', 'बाद में', 'अलर्ट चालू ✓', 'अलर्ट पाने के लिए “अनुमति दें” पर टैप करें।', 'नहीं, धन्यवाद']
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
      '<div class="push-ask-txt"><b></b><span></span><em></em></div>' +
      '<div class="push-ask-btns"><button type="button" class="push-ask-no"></button><button type="button" class="push-ask-yes"></button></div>';
    card.querySelector('b').textContent = txt(0);
    card.querySelector('span').textContent = txt(1);
    card.querySelector('em').textContent = txt(2);
    card.querySelector('.push-ask-yes').textContent = txt(3);
    // 1re et 2e fois « Plus tard » (la carte revient 3 jours après) ; 3e fois « Non merci » (plus jamais).
    card.querySelector('.push-ask-no').textContent = (parseInt(ls('oro_push_later_n') || '0', 10) || 0) >= 2 ? txt(7) : txt(4);
    card.querySelector('.push-ask-no').addEventListener('click', function () {
      ls('oro_push_later', Date.now());
      ls('oro_push_later_n', (parseInt(ls('oro_push_later_n') || '0', 10) || 0) + 1);
      hideCard(card);
    });
    card.querySelector('.push-ask-yes').addEventListener('click', function () {
      var p;
      try { p = Notification.requestPermission(); } catch (e) { p = null; }
      // Pendant que la fenêtre du téléphone est ouverte : on montre où appuyer.
      card.classList.add('wait');
      card.querySelector('b').textContent = txt(6);
      card.querySelector('span').textContent = '';
      card.querySelector('em').textContent = txt(2);
      Promise.resolve(p).then(function (res) {
        res = res || Notification.permission;
        if (res !== 'granted') {
          try { console.warn('OROLADO alertes', 'permission', res); } catch (eW) { /* ignore */ }
          ls('oro_push_later', Date.now()); hideCard(card); return null;
        }
        return subscribe().then(function (j) {
          if (j && j.ok) {
            card.classList.remove('wait');
            card.classList.add('done');
            card.querySelector('b').textContent = txt(5);
            card.querySelector('span').textContent = '';
            card.querySelector('em').textContent = '';
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
    // v2640 : carte ignorée (partie seule après 20 s) = pas avant 24 h (avant : à chaque ouverture de l'appli).
    ls('oro_push_shown', Date.now());
    setTimeout(function () { if (card.parentNode && !card.classList.contains('done') && !card.classList.contains('wait')) hideCard(card); }, 20000);
  }

  function canAsk() {
    // v2608 (propriétaire) : seulement dans l'application installée (pas dans le navigateur).
    if (!supported() || !isApp() || Notification.permission !== 'default') return false;
    if ((parseInt(ls('oro_push_later_n') || '0', 10) || 0) >= 3) return false;
    var shown = parseInt(ls('oro_push_shown') || '0', 10) || 0;
    if (shown && Date.now() - shown < 86400000) return false;
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
