/*
 * 2026-10-21 (propriétaire, choix 1 « simple ») — ÉQUIVALENT EN MONNAIE LOCALE sous le Compte réel.
 * Rien ne change à l'argent : le solde, les mises, les gains restent en dollars (serveur et admin). On écrit seulement,
 * en petit sous le montant du Compte réel et du Démo (trading, plein écran, Jeux / Paris), « ≈ 141 240 FCFA » pour les joueurs
 * des pays de la liste. Le pays vient du numéro de téléphone du compte (+225, +221…), sinon de la connexion (geo.php),
 * sinon du fuseau horaire. Compte admin : jamais automatique (lien de test ?simcur=XOF).
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
  // pays (ISO) → monnaie, pour le pays de la CONNEXION (geo.php)
  var CC = {
    CI: 'XOF', SN: 'XOF', ML: 'XOF', BF: 'XOF', BJ: 'XOF', TG: 'XOF', NE: 'XOF', GW: 'XOF',
    CM: 'XAF', GA: 'XAF', CG: 'XAF', TD: 'XAF', CF: 'XAF', GQ: 'XAF',
    NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', UG: 'UGX', TZ: 'TZS', RW: 'RWF', CD: 'CDF', GN: 'GNF', MA: 'MAD', DZ: 'DZD',
    TN: 'TND', EG: 'EGP', ZM: 'ZMW', MW: 'MWK', MZ: 'MZN'
  };
  // lien de test du propriétaire (compte admin seulement) : orolado.com/?simcur=XOF (NGN, GHS, KES, ZAR…) ; ?simcur=off = arrêt
  try {
    var qm = /[?&]simcur=([A-Za-z]{2,4})/.exec(location.search);
    if (qm) {
      var qv = qm[1].toUpperCase();
      if (qv === 'OFF') localStorage.removeItem('oro_sim_cur'); else if (CUR[qv]) localStorage.setItem('oro_sim_cur', qv);
      history.replaceState(null, '', location.pathname + location.search.replace(/([?&])simcur=[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash);
    }
  } catch (eQ) { /* ignore */ }
  // pays de la connexion : demandé une fois, gardé 7 jours
  var geoCC = '';
  try { var gs = JSON.parse(localStorage.getItem('oro_geo') || 'null'); if (gs && Date.now() - gs.t < 7 * 864e5) geoCC = String(gs.cc || ''); else geoCC = null; } catch (eG) { geoCC = null; }
  function askGeo() {
    if (geoCC !== null) return;
    geoCC = '';
    try {
      fetch('geo.php', { credentials: 'omit', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
        geoCC = String((j && j.cc) || '').toUpperCase();
        try { localStorage.setItem('oro_geo', JSON.stringify({ cc: geoCC, t: Date.now() })); } catch (eS) { /* ignore */ }
        soon();
      }).catch(function () { /* hors ligne : on réessaiera au prochain chargement */ });
    } catch (eF) { /* ignore */ }
  }
  function code() {
    var u = null;
    try { u = D6.Auth && D6.Auth.current ? D6.Auth.current() : null; } catch (e) { u = null; }
    if (!u || u.guest) return '';
    // compte admin : JAMAIS automatique (propriétaire) ; seulement le lien de test ?simcur=…
    if (u.role === 'admin') { try { var sim = localStorage.getItem('oro_sim_cur') || ''; return CUR[sim] ? sim : ''; } catch (eS) { return ''; } }
    // 1) numéro de téléphone du compte (seulement s'il y a vraiment un numéro : l'indicatif seul peut être celui par défaut)
    var dial = String(u.countryCode || '').replace(/\D/g, ''), ph = String(u.phone || '').replace(/\D/g, '');
    if (ph.length >= 6 && dial) return DIAL[dial] || '';
    // 2) pays de la connexion
    askGeo();
    if (geoCC) return CC[geoCC] || '';
    // 3) fuseau horaire du téléphone (Afrique)
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
    host.classList.add('has-loc');
    // taille : ~62 % du montant (petit téléphone → télé), puis rapetisse jusqu'à tenir dans la case (jamais coupé)
    var fs = parseFloat(getComputedStyle(amtEl).fontSize) || 15, w = Math.round(amtEl.getBoundingClientRect().width);
    var key = txt + '|' + fs + '|' + w + '|' + Math.round(host.getBoundingClientRect().width);
    if (tag.textContent !== txt) tag.textContent = txt;
    if (tag.__k === key) return;
    tag.__k = key;
    // cases Compte réel / Démo (trading, plein écran) : taille FIXE, la même que la case soit choisie ou non (propriétaire :
    // « elle ne doit ni grandir ni rétrécir quand on touche la case ») ; la place est réservée par app.css (.has-loc)
    var fixed = !host.classList.contains('cw-t');
    var size = fixed ? 9.5 : Math.max(8, Math.min(14, Math.round(fs * 0.62 * 10) / 10));
    tag.style.fontSize = size + 'px'; tag.style.lineHeight = Math.round(size * 1.1) + 'px';
    for (var k = 0; k < 14 && tag.clientWidth > 0 && tag.scrollWidth > tag.clientWidth + 1 && size > 6.5; k++) {
      size = Math.round((size - 0.5) * 10) / 10;
      tag.style.fontSize = size + 'px'; tag.style.lineHeight = Math.round(size * 1.1) + 'px';
    }
    place(host, amtEl, tag);
  }
  // Jeux / Paris : le libellé et le montant du Compte réel rapetissent pour tenir à côté du « + » (gros soldes, petits écrans)
  function shrink(el, min) {
    if (!el) return;
    el.style.fontSize = '';
    var fs = parseFloat(getComputedStyle(el).fontSize) || 14;
    for (var k = 0; k < 24 && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && fs > min; k++) {
      fs = Math.max(min, Math.round((fs - 0.5) * 10) / 10);
      el.style.setProperty('font-size', fs + 'px', 'important');
    }
  }
  function fitWallet() {
    var cw = document.querySelector('#csBal.cw-same .cw-t');
    if (!cw) return;
    var key = cw.textContent + '|' + Math.round(cw.getBoundingClientRect().width);
    if (cw.__k === key) return;
    cw.__k = key;
    shrink(cw.querySelector('small'), 6.5);
    shrink(cw.querySelector('b'), 9);
  }
  // Placement (propriétaire : « droit, stylé, jamais sur le bord ») : la ligne est centrée SOUS le montant (même quand une
  // icône est à gauche, plein écran compris) et ne touche jamais le bas de la case : si la place manque, tout le texte
  // de la case monte un peu (sans sortir en haut), sinon la ligne rapetisse encore.
  function place(host, amtEl, tag) {
    var lbl = host.querySelector('.mb-lbl, small');
    [tag, amtEl, lbl].forEach(function (e) { if (e) e.style.transform = ''; });
    if (lbl && lbl.__tight) { lbl.__tight = 0; lbl.style.removeProperty('line-height'); }
    var H = host.getBoundingClientRect(), cs = getComputedStyle(host);
    // bord bas dessiné par une ombre intérieure (case Démo bleue : barre claire en bas) → on le compte aussi
    var inB = 0; String(cs.boxShadow || '').split(/,(?![^(]*\))/).forEach(function (sh) { if (/inset/.test(sh)) { var m = sh.replace(/rgba?\([^)]*\)/, '').match(/(-?[\d.]+)px\s+(-?[\d.]+)px/); if (m && +m[2] < 0) inB = Math.max(inB, -m[2]); } });
    var safeB = H.bottom - (parseFloat(cs.borderBottomWidth) || 0) - inB - 3, safeT = H.top + (parseFloat(cs.borderTopWidth) || 0) + 1;
    var size = parseFloat(tag.style.fontSize) || 9;
    for (var k = 0; k < 8 && host.classList.contains('cw-t'); k++) { // (Jeux / Paris seulement ; les cases du trading sont réglées par app.css)
      var T = tag.getBoundingClientRect(), over = T.bottom - safeB;
      if (over <= 0.5) break;
      var top = lbl ? lbl.getBoundingClientRect().top : amtEl.getBoundingClientRect().top, room = Math.max(0, top - safeT);
      var up = Math.min(over, room);
      if (up > 0.5) { [tag, amtEl, lbl].forEach(function (e) { if (e) e.style.transform = 'translateY(' + (-up).toFixed(1) + 'px)'; }); }
      if (over - up <= 0.5 || size <= 6.5) break;
      // encore trop bas : le libellé (COMPTE RÉEL / DÉMO) se serre d'abord, puis la ligne rapetisse
      if (lbl && !lbl.__tight) { lbl.__tight = 1; var lf = parseFloat(getComputedStyle(lbl).fontSize) || 10; lbl.style.setProperty('line-height', Math.round(lf * 0.9) + 'px', 'important'); [tag, amtEl, lbl].forEach(function (e) { if (e) e.style.transform = ''; }); continue; }
      [tag, amtEl, lbl].forEach(function (e) { if (e) e.style.transform = ''; });
      size = Math.round((size - 0.5) * 10) / 10;
      tag.style.fontSize = size + 'px'; tag.style.lineHeight = Math.round(size * 1.1) + 'px';
    }
    // centré sous le montant (reste dans la case)
    var A = amtEl.getBoundingClientRect(), T2 = tag.getBoundingClientRect();
    var dx = host.classList.contains('cw-t') ? A.left - T2.left : (A.left + A.width / 2) - (T2.left + T2.width / 2); // Jeux / Paris : aligné à gauche comme le montant
    var minL = H.left + 3 - T2.left, maxR = H.right - 3 - T2.right;
    dx = Math.max(minL, Math.min(maxR, dx));
    var ty = (tag.style.transform.match(/translateY\(([-\d.]+)px\)/) || [0, 0])[1];
    tag.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + ty + 'px)';
  }
  // 2026-10-21 (propriétaire) — d'autres « ≈ » aux endroits importants (affichage seulement, l'argent reste en dollars) :
  // case de mise et gain du trading, mise des jeux, mise / gain / solde de Paris, recharge et retrait.
  // Cases à taille fixe (trading, jeux, mise Paris) : petite ligne posée en bas de la case + chiffre en dollars un peu
  // réduit et remonté par « transform » → rien ne bouge autour (terminal, ACHETER / VENDRE).
  function numOf(el) {
    if (!el) return null;
    var v = el.tagName === 'INPUT' ? el.value : el.textContent;
    v = String(v || '').replace(/[^\d.,]/g, '');
    if (!v) return null;
    if (/,\d{1,2}$/.test(v) && v.indexOf('.') < 0) v = v.replace(',', '.'); else v = v.replace(/,/g, '');
    var n = parseFloat(v);
    return isFinite(n) ? n : null;
  }
  var SPOTS = [
    { host: '#screenTrade .stake-field', amt: '#inputStake', ov: 1 },
    { host: '#screenTrade .win-preview', amt: '#previewGain', ov: 1 },
    { host: '#casinoModal .cg-in', amt: '#csStake', ov: 1 },
    { host: '#casinoModal .sp2-inw[for="spStake"]', amt: '#spStake', ov: 1 },
    { host: '#casinoModal .sp2-sum p.win', amt: '#spPot' },
    { host: '#casinoModal #spBalR', amt: '#spBalT' },
    { host: '#depositModal .amt-row', amt: '#depositAmt' },
    { host: '#withdrawModal #withdrawAmt', amt: '#withdrawAmt', after: 1 }
  ];
  function spots(c) {
    SPOTS.forEach(function (sp) {
      var hosts = document.querySelectorAll(sp.host);
      for (var i = 0; i < hosts.length; i++) {
        var host = hosts[i], amt = sp.amt === sp.host ? host : document.querySelector(sp.amt);
        var box = sp.after ? host.parentNode : host;
        if (!box) continue;
        var tag = box.querySelector(':scope > .oro-loc2');
        var n = c ? numOf(amt) : null;
        if (!c || n == null) { if (tag) tag.remove(); box.classList.remove('has-loc2', 'loc2-ov'); continue; }
        if (!tag) {
          tag = document.createElement('span'); tag.className = 'oro-loc2'; tag.setAttribute('dir', 'ltr');
          if (sp.after && host.nextSibling) box.insertBefore(tag, host.nextSibling); else box.appendChild(tag);
        }
        var t = fmt(n, c);
        if (tag.textContent !== t) tag.textContent = t;
        box.classList.add('has-loc2'); box.classList.toggle('loc2-ov', !!sp.ov);
      }
    });
  }
  function paint() {
    try { spots(code()); } catch (eP) { /* ignore */ }
    try { fitWallet(); } catch (eW) { /* ignore */ }
    put(document.getElementById('modeRealAmt'), document.getElementById('modeReal'));
    put(document.getElementById('fsRealAmt'), document.getElementById('fsBtnReal'));
    // démo aussi (propriétaire) : même calcul, même taux
    put(document.getElementById('modeDemoAmt'), document.getElementById('modeDemo'));
    put(document.getElementById('fsDemoAmt'), document.getElementById('fsBtnDemo'));
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
      ['modeReal', 'fsBtnReal', 'modeDemo', 'fsBtnDemo', 'csBal'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el || (seen && seen.has(el))) return;
        if (seen) seen.add(el);
        mo.observe(el, { subtree: true, childList: true, characterData: true });
      });
      soon();
    }
    hook();
    setInterval(hook, 1500);
    document.addEventListener('input', soon, true); document.addEventListener('click', function () { setTimeout(soon, 60); }, true);
    setInterval(soon, 700); // gains / mises qui bougent (petit, sans effet si rien n'a changé) // fenêtre Jeux / Paris créée plus tard, connexion, changement de compte
  }
  D6.LocalCur = { code: code, fmt: fmt, paint: soon, list: function () { return Object.keys(CUR).filter(function (k) { return CUR[k]; }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
