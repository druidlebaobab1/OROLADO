(function (D6) {
  'use strict';

  D6.Api = {
    ready: false,

    token: function () {
      return sessionStorage.getItem('oro_token') || '';
    },

    setToken: function (tok) {
      if (tok) sessionStorage.setItem('oro_token', tok);
      else sessionStorage.removeItem('oro_token');
    },

    post: async function (action, data) {
      try {
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, 6000);
        var body = Object.assign({ action: action, token: D6.Api.token() }, data || {});
        var r = await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store',
          signal: ctrl.signal
        });
        clearTimeout(timer);
        if (!r.ok) return null;
        var json = await r.json();
        D6.Api.ready = true;
        return json;
      } catch (e) {
        return null;
      }
    }
  };
})(window.D6 = window.D6 || {});
