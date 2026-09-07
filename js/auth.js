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

    register: async function (form) {
      var displayName = String(form.displayName || '').trim();
      var email = normalizeEmail(form.email);
      var phone = normalizePhone(form.phone);
      var countryCode = form.countryCode || '+225';
      var password = String(form.password || '');
      var confirm = String(form.passwordConfirm || '');

      if (!validName(displayName)) return { ok: false, reason: 'Indiquez votre nom ou pseudo (2 caractères min.)', field: 'regName' };
      if (!validEmail(email)) return { ok: false, reason: 'Adresse e-mail invalide', field: 'regEmail' };
      if (!validPhone(phone)) return { ok: false, reason: 'Numéro de téléphone requis (8 à 12 chiffres)', field: 'regPhone' };
      if (password.length < 6) return { ok: false, reason: 'Mot de passe : 6 caractères minimum', field: 'regPass' };
      if (password !== confirm) return { ok: false, reason: 'Les mots de passe ne correspondent pas', field: 'regPass2' };
      if (!form.acceptTerms) return { ok: false, reason: 'Vous devez confirmer avoir plus de 18 ans', field: 'regAge' };

      var cloudOk = D6.Supabase && D6.Supabase.enabled && D6.Supabase.enabled() && email.indexOf('.local') < 0;
      if (cloudOk) {
        var cloud = await D6.Supabase.register({
          displayName: displayName,
          email: email,
          phone: phone,
          countryCode: countryCode,
          password: password
        });
        if (!cloud.ok) return cloud;
        try {
          var uCloud = D6.Store.current();
          if (uCloud && !uCloud.trafficSource) {
            uCloud.trafficSource = String(localStorage.getItem('orolado_utm_source') || 'direct').toLowerCase().trim() || 'direct';
            D6.Store.saveUser(uCloud);
          }
        } catch (eTs) { /* ignore */ }
        return { ok: true, user: D6.Store.current() };
      }

      if (D6.Store.findByEmail(email)) return { ok: false, reason: 'Un compte existe déjà avec cet e-mail', field: 'regEmail' };

      var trafficSource = 'direct';
      try {
        trafficSource = String(localStorage.getItem('orolado_utm_source') || 'direct').toLowerCase().trim() || 'direct';
      } catch (eUtm) { /* ignore */ }
      var user = D6.Store.createUser({
        id: D6.uid(),
        displayName: displayName,
        email: email,
        phone: phone,
        countryCode: countryCode,
        passwordHash: await hashPassword(password),
        trafficSource: trafficSource
      });
      D6.Store.addSession(user, 'inscription');
      D6.Store.addSession(user, 'connexion');
      D6.Store.setSession({ userId: user.id, at: D6.nowIso() });
      if (D6.Api) {
        var remote = await D6.Api.post('register', {
          user: user,
          vault: { demo: D6.CONFIG.DEMO_START, real: D6.CONFIG.REAL_START }
        });
        if (remote && remote.ok) D6.Api.setToken(remote.token);
        if (remote && remote.server && !remote.ok) {
          return { ok: false, reason: remote.reason, field: 'regEmail' };
        }
      }
      return { ok: true, user: user };
    },

    login: async function (form) {
      var id = resolveLoginId(form);
      var password = String(form.password || '').trim();
      if (!password) return { ok: false, reason: 'Mot de passe requis', field: 'loginPass' };
      if (!id.email) return { ok: false, reason: 'Saisissez votre e-mail', field: 'loginId' };

      var adminEmail = (D6.CONFIG.ADMIN_EMAIL || 'admin@orolado.com').toLowerCase();
      var adminPass = D6.CONFIG.ADMIN_PASSWORD || 'AdminOrolado2026!';
      var adminAliases = [adminEmail, 'admin@orolado.com', 'admin@orolado.com'];

      await this.ensureAdminLocal();

      if (adminAliases.indexOf(id.email) >= 0 && password === adminPass) {
        var admin = D6.Store.findByEmail(adminEmail) || D6.Store.findByEmail(id.email);
        if (!admin) {
          await this.ensureAdminLocal();
          admin = D6.Store.findByEmail(adminEmail);
        }
        if (!admin) return { ok: false, reason: 'Identifiants introuvables', field: 'loginId' };
        admin.role = 'admin';
        admin.email = adminEmail;
        D6.Store.saveUser(admin);
        D6.Store.setSession({ userId: admin.id, at: D6.nowIso() });
        if (D6.Api) {
          D6.Api.post('login', { email: adminEmail, password: password }).then(function (remote) {
            if (remote && remote.ok && remote.token) {
              D6.Api.setToken(remote.token);
              if (remote.user) {
                remote.user.role = 'admin';
                D6.Store.importRemote(remote.user, remote.vault);
              }
            }
          });
        }
        return { ok: true, user: admin };
      }

      var cloudLogin = D6.Supabase && D6.Supabase.enabled && D6.Supabase.enabled() && id.email.indexOf('.local') < 0;
      if (cloudLogin) {
        var cloud = await D6.Supabase.login(id.email, password);
        if (cloud.ok) return { ok: true, user: D6.Store.current() };
      }

      if (D6.Api) {
        var remote = await D6.Api.post('login', { email: id.email, password: password });
        if (remote && remote.ok && remote.user) {
          D6.Store.importRemote(remote.user, remote.vault);
          D6.Api.setToken(remote.token);
          D6.Store.setSession({ userId: remote.user.id, at: D6.nowIso() });
          return { ok: true, user: D6.Store.getUser(remote.user.id) };
        }
        if (remote && remote.server && !remote.ok) {
          return { ok: false, reason: remote.reason || 'Identifiants introuvables', field: 'loginId' };
        }
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
      D6.holdRemote = false;
      D6.holdPull = false;
    },

    changePassword: async function (user, current, next) {
      if (!user) return { ok: false, reason: 'Session expirée' };
      if (String(next || '').length < 6) return { ok: false, reason: 'Nouveau mot de passe trop court' };
      var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(user.id || ''));
      if (uuid && D6.Supabase && D6.Supabase.changePassword) {
        var cloud = await D6.Supabase.changePassword(next);
        if (!cloud.ok) return { ok: false, reason: cloud.reason || 'Impossible de modifier le mot de passe' };
        D6.Store.addSession(user, 'mot de passe modifié');
        return { ok: true };
      }
      if ((await hashPassword(current)) !== user.passwordHash) {
        return { ok: false, reason: 'Mot de passe actuel incorrect' };
      }
      user.passwordHash = await hashPassword(next);
      D6.Store.saveUser(user);
      D6.Store.addSession(user, 'mot de passe modifié');
      return { ok: true };
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
      var email = (D6.CONFIG.ADMIN_EMAIL || 'admin@orolado.com').toLowerCase();
      var aliases = [email, 'admin@orolado.com', 'admin@orolado.com', 'admin@6diablo.com'];
      var mail = String((user && user.email) || '').toLowerCase();
      if (!user) return false;
      if (user.role === 'admin' && aliases.indexOf(mail) >= 0) return true;
      return aliases.indexOf(mail) >= 0 && user.role === 'admin';
    },

    ensureAdminLocal: async function () {
      var email = D6.CONFIG.ADMIN_EMAIL || 'admin@orolado.com';
      var hash = await hashPassword(D6.CONFIG.ADMIN_PASSWORD || 'AdminOrolado2026!');
      var admin = D6.Store.findByEmail(email)
        || D6.Store.findByEmail('admin@orolado.com')
        || D6.Store.findByEmail('admin@6diablo.com');
      if (admin) {
        admin.email = email;
        admin.role = 'admin';
        admin.passwordHash = hash;
        D6.Store.saveUser(admin);
      } else {
        D6.Store.createUser({
          id: 'admin_master',
          displayName: 'Orolado',
          email: email,
          phone: '0000000000',
          countryCode: '+225',
          passwordHash: hash,
          role: 'admin'
        });
      }
    },

    ensureAdmin: async function () {
      await this.ensureAdminLocal();
      if (D6.Api) D6.Api.post('ensureAdmin', {});
    }
  };
  D6.Auth.signOut = D6.Auth.logout;
})(window.D6 = window.D6 || {});
