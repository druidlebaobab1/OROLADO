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
      var maxAge = 100 * 365 * 24 * 60 * 60;
      try {
        if (tok) {
          localStorage.setItem('oro_token', tok);
          sessionStorage.setItem('oro_token', tok);
          document.cookie = 'oro_token=' + encodeURIComponent(tok) + '; Max-Age=' + maxAge + '; Path=/; SameSite=Lax';
        } else {
          localStorage.removeItem('oro_token');
          sessionStorage.removeItem('oro_token');
          document.cookie = 'oro_token=; Max-Age=0; Path=/; SameSite=Lax';
        }
      } catch (e) { /* ignore */ }
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
        var body = Object.assign({ action: action, token: D6.Api.token() }, data || {});
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
})(window.D6 = window.D6 || {});
