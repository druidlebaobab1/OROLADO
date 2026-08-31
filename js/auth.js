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
      if (password.length < 6) return { ok: false, reason: 'Mot de passe : 6 caractères minimum', field: 'regPass' };
      if (password !== confirm) return { ok: false, reason: 'Les mots de passe ne correspondent pas', field: 'regPass2' };
      if (!form.acceptTerms) return { ok: false, reason: 'Vous devez confirmer avoir plus de 18 ans', field: 'regAge' };
      if (D6.Store.findByEmail(email)) return { ok: false, reason: 'Un compte existe déjà avec cet e-mail', field: 'regEmail' };

      var user = D6.Store.createUser({
        id: D6.uid(),
        displayName: displayName,
        email: email,
        phone: phone,
        countryCode: countryCode,
        passwordHash: await hashPassword(password)
      });
      D6.Store.addSession(user, 'inscription');
      D6.Store.addSession(user, 'connexion');
      D6.Store.setSession({ userId: user.id, at: D6.nowIso() });
      return { ok: true, user: user };
    },

    login: async function (form) {
      var id = resolveLoginId(form);
      var password = String(form.password || '');
      if (!password) return { ok: false, reason: 'Mot de passe requis', field: 'loginPass' };
      if (!id.email) return { ok: false, reason: 'Saisissez votre e-mail', field: 'loginId' };

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

    logout: function () {
      var user = D6.Store.current();
      if (user) D6.Store.addSession(user, 'déconnexion');
      D6.Store.clearSession();
    },

    changePassword: async function (user, current, next) {
      if (!user) return { ok: false, reason: 'Session expirée' };
      if ((await hashPassword(current)) !== user.passwordHash) {
        return { ok: false, reason: 'Mot de passe actuel incorrect' };
      }
      if (String(next || '').length < 6) return { ok: false, reason: 'Nouveau mot de passe trop court' };
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
      return !!(user && user.role === 'admin' && user.email === (D6.CONFIG.ADMIN_EMAIL || 'admin@orolado.com'));
    },

    ensureAdmin: async function () {
      var email = D6.CONFIG.ADMIN_EMAIL || 'admin@orolado.com';
      var hash = await hashPassword(D6.CONFIG.ADMIN_PASSWORD || 'AdminOrolado2026!');
      var admin = D6.Store.findByEmail(email) || D6.Store.findByEmail('admin@6diablo.com');
      if (admin) {
        admin.email = email;
        admin.role = 'admin';
        admin.displayName = admin.displayName || 'Super Admin';
        admin.passwordHash = hash;
        D6.Store.saveUser(admin);
        return;
      }
      D6.Store.createUser({
        id: 'admin_master',
        displayName: 'Super Admin',
        email: email,
        phone: '0000000000',
        countryCode: '+225',
        passwordHash: hash,
        role: 'admin'
      });
    }
  };
})(window.D6 = window.D6 || {});
