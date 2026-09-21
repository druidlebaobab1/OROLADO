(function (D6) {
  'use strict';

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normalizePhone(phone) {
    return String(phone || '').replace(/[^\d]/g, '');
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validPhone(phone) {
    return /^\d{8,12}$/.test(phone);
  }

  function validName(name) {
    var n = String(name || '').trim();
    return n.length >= 2 && n.length <= 32;
  }

  async function hashPassword(password, prefix) {
    var payload = (prefix || 'orolado') + '|' + password;
    if (window.crypto && crypto.subtle) {
      var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    }
    return btoa(payload);
  }

  function resolveLoginId(form) {
    var raw = String(form.identifier || form.email || '').trim();
    return { email: normalizeEmail(raw), phone: '', countryCode: form.countryCode || '+225' };
  }

  D6.Auth = {
    hashPassword: hashPassword,
    validEmail: validEmail,
    validPhone: validPhone,
    validName: validName,

    current: function () {
      return D6.Store.current();
    },

    seedFreshDemo: function (user) {
      if (!user || user.guest) return;
      if (String(user.email || '').indexOf('@orolado.local') >= 0) return;
      var start = (D6.CONFIG && D6.CONFIG.DEMO_START) || 1000000;
      var played = Number(user.demoTrades) > 0;
      var demoNow = 0;
      try { demoNow = Number(D6.Store.demoBalance(user) || 0); } catch (eD) { demoNow = 0; }
      if (demoNow > 0.009 || played) return;
      if (D6.Store.setBalanceMode) D6.Store.setBalanceMode(user, 'demo', start);
      if (user.mode !== 'demo' && !(Number(D6.Store.realBalance && D6.Store.realBalance(user)) > 0.009)) {
        user.mode = 'demo';
        D6.Store.saveUser(user);
      }
    },

    register: async function (form) {
      var displayName = String(form.displayName || '').trim();
      var email = normalizeEmail(form.email);
      var phone = normalizePhone(form.phone || '');
      var countryCode = form.countryCode || '+225';
      var password = String(form.password || '');
      var confirm = String(form.passwordConfirm || '');

      if (!validName(displayName)) return { ok: false, reason: 'Indiquez votre nom ou pseudo (2 caractères min.)', field: 'regName' };
      if (!validEmail(email)) return { ok: false, reason: 'Adresse e-mail invalide', field: 'regEmail' };
      if (phone && !validPhone(phone)) return { ok: false, reason: 'Numéro de téléphone invalide', field: 'regPhone' };
      if (password.length < 6) return { ok: false, reason: 'Mot de passe : 6 caractères minimum', field: 'regPass' };
      if (password !== confirm) return { ok: false, reason: 'Les mots de passe ne correspondent pas', field: 'regPass2' };
      if (!form.acceptTerms) return { ok: false, reason: 'Vous devez confirmer avoir plus de 18 ans', field: 'regAge' };

      // Comptes locaux / preview : pas d’OTP.
      if (email.indexOf('.local') >= 0) {
        if (D6.Store.findByEmail(email)) return { ok: false, reason: 'Un compte existe déjà avec cet e-mail', field: 'regEmail' };
        var userLocal = D6.Store.createUser({
          id: D6.uid(),
          displayName: displayName,
          email: email,
          phone: phone || '',
          countryCode: countryCode,
          passwordHash: await hashPassword(password),
          trafficSource: 'direct'
        });
        D6.Store.setSession({ userId: userLocal.id, at: D6.nowIso() });
        return { ok: true, user: userLocal };
      }

      if (!D6.Api || !D6.Api.post) {
        return { ok: false, reason: 'Service d’inscription indisponible. Réessayez.' };
      }

      var trafficSource = 'direct';
      var trafficMeta = {};
      try {
        trafficSource = String(localStorage.getItem('orolado_utm_source') || 'direct').toLowerCase().trim() || 'direct';
        trafficMeta = JSON.parse(localStorage.getItem('orolado_utm_meta') || '{}') || {};
      } catch (eUtm) { /* ignore */ }

      var passwordHash = await hashPassword(password);
      var start = await D6.Api.post('registerStart', {
        displayName: displayName,
        email: email,
        phone: phone || '',
        countryCode: countryCode,
        passwordHash: passwordHash,
        trafficSource: trafficSource,
        trafficMedium: trafficMeta.medium || '',
        trafficCampaign: trafficMeta.campaign || '',
        trafficReferrer: trafficMeta.referrer || ''
      });
      if (!start || !start.ok) {
        return {
          ok: false,
          reason: (start && start.reason) || 'Impossible d’envoyer le code de confirmation',
          field: (start && start.field) || 'regEmail',
          retryIn: start && start.retryIn
        };
      }
      return {
        ok: true,
        pendingOtp: true,
        email: email,
        displayName: displayName,
        phone: phone || '',
        countryCode: countryCode,
        password: password,
        resendIn: (start && start.resendIn) || 60
      };
    },

    verifyRegisterOtp: async function (email, code, password) {
      email = normalizeEmail(email);
      code = String(code || '').replace(/\D/g, '');
      if (!email || code.length !== 6) {
        return { ok: false, reason: 'Saisissez le code à 6 chiffres reçu par e-mail.' };
      }
      if (!D6.Api || !D6.Api.post) return { ok: false, reason: 'Service indisponible' };
      var remote = await D6.Api.post('registerVerify', { email: email, code: code });
      if (!remote || !remote.ok) {
        return { ok: false, reason: (remote && remote.reason) || 'Code incorrect ou expiré' };
      }
      if (remote.token && D6.Api.setToken) D6.Api.setToken(remote.token);
      if (remote.user) {
        D6.Store.importRemote(remote.user, remote.vault, { official: true });
        D6.Store.setSession({ userId: remote.user.id, at: D6.nowIso() });
        var seeded = D6.Store.current() || D6.Store.getUser(remote.user.id);
        if (seeded) {
          seeded.mode = seeded.mode || 'demo';
          D6.Auth.seedFreshDemo(seeded);
        }
      }
      // Miroir Supabase optionnel (compte déjà actif côté Orolado).
      if (password && D6.Supabase && D6.Supabase.enabled && D6.Supabase.enabled() && email.indexOf('.local') < 0) {
        try {
          var cloud = await D6.Supabase.register({
            displayName: (remote.user && remote.user.displayName) || email,
            email: email,
            phone: (remote.user && remote.user.phone) || '',
            countryCode: (remote.user && remote.user.countryCode) || '+225',
            password: password
          });
          if (!cloud.ok && D6.Supabase.login) {
            await D6.Supabase.login(email, password);
          }
        } catch (eCloud) { /* ignore */ }
      }
      return { ok: true, user: D6.Store.current() || remote.user };
    },

    resendRegisterOtp: async function (email, extra) {
      email = normalizeEmail(email);
      if (!D6.Api || !D6.Api.post) return { ok: false, reason: 'Service indisponible' };
      var remote = await D6.Api.post('registerResend', { email: email }, 25000);
      if (remote && remote.ok) return { ok: true, resendIn: remote.resendIn || 60 };
      if (remote && remote.retryIn) {
        return { ok: false, retryIn: remote.retryIn, reason: remote.reason || '' };
      }
      extra = extra || {};
      if (extra.displayName && extra.password) {
        var restart = await D6.Auth.register({
          displayName: extra.displayName,
          email: email,
          phone: extra.phone || '',
          countryCode: extra.countryCode || '+225',
          password: extra.password,
          passwordConfirm: extra.password,
          acceptTerms: true
        });
        if (restart && restart.ok) return { ok: true, resendIn: restart.resendIn || 60 };
        if (restart && restart.retryIn) return { ok: false, retryIn: restart.retryIn, reason: restart.reason || '' };
        if (restart && !restart.ok) {
          return { ok: false, reason: restart.reason || '', retryIn: restart.retryIn };
        }
      }
      return { ok: false, reason: (remote && remote.reason) || 'Renvoi impossible', retryIn: remote && remote.retryIn };
    },

    isReservedAdminEmail: function (email) {
      var e = String(email || '').trim().toLowerCase();
      var primary = String((D6.CONFIG && D6.CONFIG.ADMIN_EMAIL) || 'admin@orolado.com').toLowerCase();
      return e === primary || e === 'admin@orolado.com';
    },

    login: async function (form) {
      var id = resolveLoginId(form);
      var password = String(form.password || '').trim();
      if (!password) return { ok: false, reason: 'Mot de passe requis', field: 'loginPass' };
      if (!id.email) return { ok: false, reason: 'Saisissez votre e-mail', field: 'loginId' };
      id.email = normalizeEmail(id.email);

      var reservedAdmin = D6.Auth.isReservedAdminEmail(id.email);
      var isLocalPreview = id.email.indexOf('.local') >= 0;
      var cloudLogin = !reservedAdmin && !isLocalPreview && D6.Supabase && D6.Supabase.enabled && D6.Supabase.enabled();

      async function tryCloudLogin() {
        if (!cloudLogin) return null;
        try {
          var cloud = await D6.Supabase.login(id.email, password);
          if (cloud && cloud.ok) {
            D6.Auth.seedFreshDemo(D6.Store.current());
            return { ok: true, user: D6.Store.current() };
          }
          if (cloud && cloud.banned) return { ok: false, reason: cloud.reason || 'Compte suspendu', field: 'loginPass' };
        } catch (eCloud) { /* ignore */ }
        return null;
      }

      // Toujours interroger la base serveur (pas le localStorage du 1er appareil).
      if (D6.Api && !isLocalPreview) {
        var remote = await D6.Api.post('login', { email: id.email, password: password, token: '' }, 20000);
        if (remote && remote.ok && remote.user) {
          D6.Store.importRemote(remote.user, remote.vault, { official: true });
          if (remote.token && D6.Api.setToken) D6.Api.setToken(remote.token);
          D6.Store.setSession({
            userId: remote.user.id,
            at: D6.nowIso(),
            exp: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000
          });
          var logged = D6.Store.getUser(remote.user.id) || remote.user;
          D6.Auth.seedFreshDemo(logged);
          return { ok: true, user: logged };
        }
        if (remote && remote.server && !remote.ok) {
          var viaCloudReject = await tryCloudLogin();
          if (viaCloudReject) return viaCloudReject;
          return { ok: false, reason: remote.reason || 'Identifiants introuvables', field: 'loginPass' };
        }
        if (!remote) {
          var viaCloudDown = await tryCloudLogin();
          if (viaCloudDown) return viaCloudDown;
          return { ok: false, reason: 'Serveur indisponible. Réessayez.', field: 'loginId' };
        }
      }

      var cloudOk = await tryCloudLogin();
      if (cloudOk) return cloudOk;

      if (reservedAdmin) {
        return { ok: false, reason: 'Identifiants introuvables', field: 'loginPass' };
      }

      if (!isLocalPreview) {
        return { ok: false, reason: 'Identifiants introuvables', field: 'loginPass' };
      }

      var user = D6.Store.findByEmail(id.email);
      if (!user) return { ok: false, reason: 'Identifiants introuvables', field: 'loginId' };

      var hash = await hashPassword(password);
      if (hash !== user.passwordHash) {
        var legacy = await hashPassword(password, '6diablo');
        if (legacy !== user.passwordHash) return { ok: false, reason: 'Mot de passe incorrect', field: 'loginPass' };
        user.passwordHash = hash;
        D6.Store.saveUser(user);
      }

      D6.Store.addSession(user, 'connexion');
      D6.Store.setSession({ userId: user.id, at: D6.nowIso() });
      return { ok: true, user: user };
    },

    resetPassword: async function (form) {
      var id = resolveLoginId(form);
      var next = String(form.password || '');
      var confirm = String(form.passwordConfirm || '');
      if (!id.email) return { ok: false, reason: 'Saisissez l’e-mail du compte', field: 'resetId' };
      if (next.length < 6) return { ok: false, reason: 'Nouveau mot de passe trop court', field: 'resetPass' };
      if (next !== confirm) return { ok: false, reason: 'Les mots de passe ne correspondent pas', field: 'resetPass2' };

      var user = D6.Store.findByEmail(id.email);
      if (!user) return { ok: false, reason: 'Aucun compte associé', field: 'resetId' };

      user.passwordHash = await hashPassword(next);
      D6.Store.saveUser(user);
      D6.Store.addSession(user, 'mot de passe réinitialisé');
      return { ok: true };
    },

    logout: async function () {
      D6.holdRemote = true;
      D6.holdPull = true;
      if (D6.Supabase && D6.Supabase.stopRealtime) D6.Supabase.stopRealtime();
      if (D6.Supabase && D6.Supabase.signOut) {
        try { await D6.Supabase.signOut(); } catch (e) { /* ignore */ }
      }
      try {
        var keys = [];
        var i;
        for (i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && (k.indexOf('sb-') === 0 || k.indexOf('supabase') >= 0)) keys.push(k);
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e4) { /* ignore */ }
      D6.Store.clearSession();
      if (D6.Api && D6.Api.setToken) D6.Api.setToken('');
      try { sessionStorage.removeItem('oro_token'); } catch (e1) { /* ignore */ }
      try { sessionStorage.removeItem('oro_dep_ref'); } catch (e2) { /* ignore */ }
      try { localStorage.removeItem('oro_token'); } catch (e3) { /* ignore */ }
      try { localStorage.removeItem('oro_uid'); } catch (e5) { /* ignore */ }
      try { localStorage.removeItem('oro_remember'); } catch (e9) { /* ignore */ }
      try { localStorage.removeItem('oro_session_exp'); } catch (e6) { /* ignore */ }
      try { localStorage.removeItem('oro_user_snap'); } catch (e7) { /* ignore */ }
      try { document.cookie = 'oro_token=; Max-Age=0; Path=/; SameSite=Lax'; } catch (e8) { /* ignore */ }
      D6.holdRemote = false;
      D6.holdPull = false;
    },

    requestPasswordOtp: async function (user) {
      if (!user) return { ok: false, reason: 'Session expirée' };
      if (D6.Api && D6.Api.post) {
        var remote = await D6.Api.post('passwordOtpStart', { email: user.email || '' }, 20000);
        if (remote && remote.ok) return remote;
        if (remote && remote.reason) return remote;
      }
      return { ok: false, reason: 'Impossible d’envoyer le code. Réessayez.' };
    },

    verifyPasswordOtp: async function (user, code) {
      if (!user) return { ok: false, reason: 'Session expirée' };
      code = String(code || '').replace(/\D/g, '');
      if (code.length !== 6) return { ok: false, reason: 'Code invalide' };
      if (D6.Api && D6.Api.post) {
        var remote = await D6.Api.post('passwordOtpVerify', { email: user.email || '', code: code }, 20000);
        if (remote && remote.ok) return remote;
        if (remote && remote.reason) return remote;
      }
      return { ok: false, reason: 'Code incorrect' };
    },

    forgotOtpStart: async function (email) {
      email = String(email || '').trim().toLowerCase();
      if (!email) return { ok: false, reason: 'Invalid email', field: 'resetId' };
      if (D6.Api && D6.Api.post) {
        var remote = await D6.Api.post('forgotOtpStart', { email: email }, 20000);
        if (remote && remote.ok) return remote;
        if (remote && remote.reason) return remote;
      }
      return { ok: false, reason: 'Unable to send code', field: 'resetId' };
    },
    forgotOtpVerify: async function (email, code) {
      email = String(email || '').trim().toLowerCase();
      code = String(code || '').replace(/\D/g, '');
      if (code.length !== 6) return { ok: false, reason: 'Invalid code' };
      if (D6.Api && D6.Api.post) {
        var remote = await D6.Api.post('forgotOtpVerify', { email: email, code: code }, 20000);
        if (remote && remote.ok) return remote;
        if (remote && remote.reason) return remote;
      }
      return { ok: false, reason: 'Incorrect code' };
    },
    forgotPasswordSet: async function (email, next, confirm, otpToken) {
      next = String(next || '');
      confirm = String(confirm || '');
      if (next.length < 6) return { ok: false, reason: 'Password too short', field: 'resetPass' };
      if (next !== confirm) return { ok: false, reason: (D6.I18N && D6.I18N.t('passMismatch')) || 'Passwords do not match', field: 'resetPass2' };
      if (!otpToken) return { ok: false, reason: 'Validate the email code first' };
      if (D6.Api && D6.Api.post) {
        var remote = await D6.Api.post('forgotPasswordSet', { email: email, otpToken: otpToken, newPassword: next }, 20000);
        if (remote && remote.ok) {
          var u = D6.Store.findByEmail(email);
          if (u) {
            u.passwordHash = await hashPassword(next);
            u.password = '';
            D6.Store.saveUser(u);
          }
          if (D6.Api && D6.Api.setToken) D6.Api.setToken('');
          try { D6.Store.clearSession(); } catch (eSess) { /* ignore */ }
          return remote;
        }
        if (remote && remote.reason) return remote;
      }
      return { ok: false, reason: 'Unable to update password', field: 'resetPass' };
    },

    changePassword: async function (user, current, next, otpToken) {
      if (!user) return { ok: false, reason: 'Session expirée' };
      if (String(next || '').length < 6) return { ok: false, reason: 'Nouveau mot de passe trop court' };
      if (!otpToken) return { ok: false, reason: 'Validez d’abord le code e-mail' };
      if (D6.Api && D6.Api.post) {
        var remote = await D6.Api.post('passwordChange', {
          email: user.email || '',
          otpToken: otpToken,
          newPassword: next
        }, 20000);
        if (remote && remote.ok) {
          try {
            user.passwordHash = await hashPassword(next);
            user.password = '';
            D6.Store.saveUser(user);
          } catch (eHash) { /* ignore */ }
          if (remote.token && D6.Api.setToken) D6.Api.setToken(remote.token);
          return { ok: true };
        }
        if (remote && remote.reason) return remote;
      }
      return { ok: false, reason: 'Impossible de modifier le mot de passe' };
    },

    updatePhone: function (user, countryCode, phone) {
      phone = normalizePhone(phone);
      if (!/^\d{8,12}$/.test(phone)) return { ok: false, reason: 'Numéro invalide' };
      var existing = D6.Store.findByPhone(countryCode, phone);
      if (existing && existing.id !== user.id) return { ok: false, reason: 'Numéro déjà utilisé' };
      user.countryCode = countryCode;
      user.phone = phone;
      D6.Store.saveUser(user);
      D6.Store.addSession(user, 'téléphone mis à jour');
      return { ok: true };
    },

    isAdmin: function (user) {
      if (!user) return false;
      if (user.role !== 'admin') return false;
      if (user.id === 'admin_master') return true;
      var email = (D6.CONFIG.ADMIN_EMAIL || 'admin@orolado.com').toLowerCase();
      var aliases = [email, 'admin@orolado.com'];
      var mail = String(user.email || '').toLowerCase();
      return aliases.indexOf(mail) >= 0;
    }
  };
  D6.Auth.signOut = D6.Auth.logout;
})(window.D6 = window.D6 || {});
