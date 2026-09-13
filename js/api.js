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
        var ms = timeoutMs || (action === 'login' || action === 'registerVerify' ? 20000 : 8000);
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
