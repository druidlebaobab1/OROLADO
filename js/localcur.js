/*
 * 2026-10-21 (propriétaire, choix 1 « simple ») — ÉQUIVALENT EN MONNAIE LOCALE sous le Compte réel.
 * Rien ne change à l'argent : le solde, les mises, les gains restent en dollars (serveur et admin). On écrit seulement,
 * en petit sous le montant du Compte réel (trading, plein écran, Jeux / Paris), « ≈ 141 240 FCFA » pour les joueurs
 * des pays de la liste. Le pays vient de l'indicatif du téléphone du compte (+225, +221…), sinon du fuseau horaire.
 * Pas trouvé → rien n'est ajouté (dollars seuls, comme avant).
 * Taux FIXES : FCFA / Naira / Cedi / Shilling kényan / Rand = les mêmes que les paiements Mobile Money (orolado_lib.php,
 * USD_FCFA_RATE etc.) ; les autres = arrondis, affichage seulement. Même liste côté serveur : orolado_local_cur() (retraits).
 */
(function () {
  'use strict';
  var D6 = window.D6 = window.D6 || {};
  // monnaie → [symbole, devant ?, taux pour 1 $]
  var CUR = {
    XOF: ['FCFA', false, 600], XAF: ['FCFA', false, 600], NGN: ['₦', true, 1500], GHS: ['GH₵', true, 12], KES: ['KSh', true, 130],
    ZAR: ['R', true, 18], UGX: ['USh', true, 3700], TZS: ['TSh', true, 2600], RWF: ['RF', true, 1400], CDF: ['FC', false, 2800],
    GNF: ['GNF', false, 8600], MAD: ['DH', false, 9.5], DZD: ['DA', false, 130], TND: ['DT', false, 3], EGP: ['E£', true, 48],
    ZMW: ['K', true, 25], MWK: ['MK', true, 1700], MZN: ['MT', false, 63]
  };
  var DIAL = {
    '225': 'XOF', '221': 'XOF', '223': 'XOF', '226': 'XOF', '229': 'XOF', '228': 'XOF', '227': 'XOF', '245': 'XOF',
    '237': 'XAF', '241': 'XAF', '242': 'XAF', '235': 'XAF', '236': 'XAF', '240': 'XAF',
    '234': 'NGN', '233': 'GHS', '254': 'KES', '27': 'ZAR', '256': 'UGX', '255': 'TZS', '250': 'RWF', '243': 'CDF', '224': 'GNF',
    '212': 'MAD', '213': 'DZD', '216': 'TND', '20': 'EGP', '260': 'ZMW', '265': 'MWK', '258': 'MZN'
  };
  var TZ = {
    Abidjan: 'XOF', Dakar: 'XOF', Bamako: 'XOF', Ouagadougou: 'XOF', 'Porto-Novo': 'XOF', Lome: 'XOF', Niamey: 'XOF', Bissau: 'XOF',
    Douala: 'XAF', Libreville: 'XAF', Brazzaville: 'XAF', Ndjamena: 'XAF', Bangui: 'XAF', Malabo: 'XAF',
    Lagos: 'NGN', Accra: 'GHS', Nairobi: 'KES', Johannesburg: 'ZAR', Kampala: 'UGX', Dar_es_Salaam: 'TZS', Kigali: 'RWF',
    Kinshasa: 'CDF', Lubumbashi: 'CDF', Conakry: 'GNF', Casablanca: 'MAD', Algiers: 'DZD', Tunis: 'TND', Cairo: 'EGP',
    Lusaka: 'ZMW', Blantyre: 'MWK', Maputo: 'MZN'
  };
  function code() {
    var u = null;
    try { u = D6.Auth && D6.Auth.current ? D6.Auth.current() : null; } catch (e) { u = null; }
    if (!u || u.guest) return '';
    // compte admin : « Simuler pays » (localStorage oro_sim_cur = XOF, NGN… ; vide = automatique)
    try { var sim = localStorage.getItem('oro_sim_cur') || ''; if (sim && u.role === 'admin') return CUR[sim] ? sim : ''; } catch (eS) { /* ignore */ }
    var dial = String(u.countryCode || '').replace(/\D/g, '');
    if (dial && DIAL[dial]) return DIAL[dial];
    if (dial) return ''; // indicatif connu d'un autre pays → dollars
    try {
      var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').split('/');
      if (tz[0] === 'Africa' && TZ[tz[1]]) return TZ[tz[1]];
    } catch (eT) { /* ignore */ }
    return '';
  }
  function fmt(usd, c) {
    var d = CUR[c]; if (!d) return '';
    var v = Math.floor(Math.max(0, usd) * d[2] + 1e-6);
    var s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return '≈ ' + (d[1] ? d[0] + ' ' + s : s + ' ' + d[0]);
  }
  function usdOf(el) {
    var t = String((el && el.textContent) || '').replace(/[^\d.,]/g, '');
    if (!t) return null;
    t = t.replace(/,/g, '');
    var n = parseFloat(t);
    return isFinite(n) ? n : null;
  }
  function put(amtEl, host) {
    if (!amtEl || !host) return;
    var c = code(), tag = host.querySelector('.oro-loc');
    var n = c ? usdOf(amtEl) : null;
    if (!c || n == null) { if (tag) tag.remove(); host.classList.remove('has-loc'); return; }
    if (!tag) { tag = document.createElement('span'); tag.className = 'oro-loc'; tag.setAttribute('dir', 'ltr'); host.appendChild(tag); }
    var txt = fmt(n, c);
    if (tag.textContent !== txt) tag.textContent = txt;
    host.classList.add('has-loc');
  }
  function paint() {
    put(document.getElementById('modeRealAmt'), document.getElementById('modeReal'));
    put(document.getElementById('fsRealAmt'), document.getElementById('fsBtnReal'));
    var cw = document.querySelector('#csBal.cw-same .cw-t');
    if (cw) put(cw.querySelector('b'), cw);
  }
  var queued = false;
  function soon() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; try { paint(); } catch (e) { /* ignore */ } }); }
  var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
  function watch() {
    var mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var t = list[i].target, el = t.nodeType === 1 ? t : t.parentNode;
        if (el && el.closest && !el.closest('.oro-loc')) { soon(); return; }
      }
    });
    function hook() {
      ['modeReal', 'fsBtnReal', 'csBal'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el || (seen && seen.has(el))) return;
        if (seen) seen.add(el);
        mo.observe(el, { subtree: true, childList: true, characterData: true });
      });
      soon();
    }
    hook();
    setInterval(hook, 1500); // fenêtre Jeux / Paris créée plus tard, connexion, changement de compte
  }
  D6.LocalCur = { code: code, fmt: fmt, paint: soon, list: function () { return Object.keys(CUR).filter(function (k) { return CUR[k]; }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
