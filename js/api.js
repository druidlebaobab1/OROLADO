(function (D6) {
  'use strict';

  D6.Api = {
    ready: false,

    token: function () {
      try {
        var tok = localStorage.getItem('oro_token') || sessionStorage.getItem('oro_token') || '';
        if (tok) return tok;
        var m = document.cookie.match(/(?:^|;\s*)oro_token=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : '';
      } catch (e) { return ''; }
    },

    setToken: function (tok) {
      var maxAge = 5 * 365 * 24 * 60 * 60; // v2601 : 5 ans (comme le serveur), prolongés à chaque visite
      try {
        if (tok) {
          localStorage.setItem('oro_token', tok);
          sessionStorage.setItem('oro_token', tok);
          document.cookie = 'oro_token=' + encodeURIComponent(tok) + '; Max-Age=' + maxAge + '; Path=/; SameSite=Lax';
          // v2607 : nouvelle connexion → les alertes de ce téléphone sont reliées au compte.
          if (tok !== D6.Api._lastTok && D6.Push && D6.Push.relink) setTimeout(D6.Push.relink, 1500);
          D6.Api._lastTok = tok;
        } else {
          localStorage.removeItem('oro_token');
          sessionStorage.removeItem('oro_token');
          document.cookie = 'oro_token=; Max-Age=0; Path=/; SameSite=Lax';
        }
      } catch (e) { /* ignore */ }
    },

    // v2673 — identifiant de cet appareil (gardé 5 ans, stockage + cookie) : un compte suspendu ne peut plus
    // revenir depuis le même téléphone / PC avec un autre compte.
    dev: function () {
      if (D6.Api._dev) return D6.Api._dev;
      var d = '';
      try {
        d = localStorage.getItem('oro_dev') || '';
        if (!d) { var m = document.cookie.match(/(?:^|;\s*)oro_dev=([^;]+)/); d = m ? decodeURIComponent(m[1]) : ''; }
        if (!/^d[a-f0-9]{16,40}$/.test(d)) {
          var a = new Uint8Array(12);
          (window.crypto || window.msCrypto).getRandomValues(a);
          d = 'd' + Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
        }
        localStorage.setItem('oro_dev', d);
        document.cookie = 'oro_dev=' + d + '; Max-Age=157680000; Path=/; SameSite=Lax';
      } catch (e) { /* ignore */ }
      D6.Api._dev = d;
      return d;
    },

    post: async function (action, data, timeoutMs) {
      try {
        var ctrl = new AbortController();
        var mail = action === 'login' || action === 'registerStart' || action === 'registerResend' ||
          action === 'registerVerify' || action === 'passwordOtpStart' || action === 'forgotOtpStart';
        var money = action === 'placeOrder' || action === 'settleOrder' || action === 'withdraw' ||
          action === 'withdrawOtp' || action === 'me' || action === 'upsert';
        var ms = timeoutMs || (mail || money ? 25000 : 8000);
        var timer = setTimeout(function () { ctrl.abort(); }, ms);
        var body = Object.assign({ action: action, token: D6.Api.token(), dev: D6.Api.dev() }, data || {});
        if (action === 'login') body.token = '';
        var r = await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store',
          credentials: 'same-origin',
          signal: ctrl.signal
        });
        clearTimeout(timer);
        var json = null;
        try { json = await r.json(); } catch (eParse) { json = null; }
        // « Session invalide » brut → message clair ; l'appli propose de se reconnecter
        // (une fois, et jamais pour un visiteur sans compte).
        if (json && json.ok === false && /session invalide|invalid session/i.test(String(json.reason || ''))) {
          json.sessionExpired = true;
          var tr = D6.I18N && D6.I18N.t ? D6.I18N.t('sessionExpiredMsg') : '';
          json.reason = (tr && tr !== 'sessionExpiredMsg') ? tr : 'Votre session a expiré. Reconnectez-vous pour continuer.';
          // Seulement si le jeton envoyé est toujours celui en cours (pas une requête
          // partie juste avant une connexion / déconnexion).
          if (body.token && body.token === D6.Api.token() && action !== 'upsert') {
            try { document.dispatchEvent(new CustomEvent('orolado-session-expired', { detail: { action: action } })); } catch (eEv) { /* ignore */ }
          }
        }
        if (!r.ok) {
          console.warn('OROLADO api', action, r.status);
          return json;
        }
        D6.Api.ready = true;
        return json;
      } catch (e) {
        console.warn('OROLADO api', action, e && e.name, e && e.message);
        return null;
      }
    }
  };

  /* 2026-10-21 (propriétaire, appli iPhone : « une photo de la conversation s'affiche en rectangle blanc ») : les photos de
     Social (live.php?i=…) sont lues avec le cookie oro_token. iOS efface au bout de 7 jours un cookie écrit par la page
     (et l'appli de l'écran d'accueil a ses propres cookies) alors que la connexion, elle, reste dans le stockage → photos
     refusées (404). À chaque ouverture, le cookie est remis s'il manque ou diffère (rien d'autre ne change). */
  try {
    var tk = localStorage.getItem('oro_token') || '';
    var ck = document.cookie.match(/(?:^|;\s*)oro_token=([^;]+)/);
    if (tk && (!ck || decodeURIComponent(ck[1]) !== tk)) {
      document.cookie = 'oro_token=' + encodeURIComponent(tk) + '; Max-Age=' + (5 * 365 * 24 * 60 * 60) + '; Path=/; SameSite=Lax';
    }
  } catch (eCk) { /* ignore */ }
})(window.D6 = window.D6 || {});
