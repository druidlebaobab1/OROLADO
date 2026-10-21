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
  // monnaie → [symbole, devant ?, taux pour 1 $]. Afrique Mobile Money (XOF/XAF/NGN/GHS/KES/ZAR) = taux des paiements ;
  // les autres = taux arrondis, AFFICHAGE SEULEMENT (2026-10-21, propriétaire : Amérique latine, pays arabes, pays des 12 langues)
  var CUR = {
    XOF: ['FCFA', false, 600], XAF: ['FCFA', false, 600], NGN: ['₦', true, 1500], GHS: ['GH₵', true, 12], KES: ['KSh', true, 130],
    ZAR: ['R', true, 18], UGX: ['USh', true, 3700], TZS: ['TSh', true, 2600], RWF: ['RF', true, 1400], CDF: ['FC', false, 2800],
    GNF: ['GNF', false, 8600], MAD: ['DH', false, 9.5], DZD: ['DA', false, 130], TND: ['DT', false, 3], EGP: ['E£', true, 48],
    ZMW: ['K', true, 25], MWK: ['MK', true, 1700], MZN: ['MT', false, 63],
    MXN: ['MX$', true, 18.5], COP: ['COL$', true, 4000], BRL: ['R$', true, 5.5], ARS: ['AR$', true, 1300], PEN: ['S/', true, 3.7],
    CLP: ['CLP$', true, 930], BOB: ['Bs', true, 6.9], PYG: ['₲', true, 7300], UYU: ['$U', true, 40], GTQ: ['Q', true, 7.7],
    HNL: ['L', true, 26], CRC: ['₡', true, 510], DOP: ['RD$', true, 60],
    SAR: ['SAR', false, 3.75], AED: ['AED', false, 3.67], QAR: ['QAR', false, 3.64], KWD: ['KWD', false, 0.31], JOD: ['JOD', false, 0.71],
    IQD: ['IQD', false, 1310], OMR: ['OMR', false, 0.385], BHD: ['BHD', false, 0.376],
    INR: ['₹', true, 85], IDR: ['Rp', true, 16300], TRY: ['₺', true, 41], VND: ['₫', false, 26000], RUB: ['₽', false, 80], CNY: ['¥', true, 7.2],
    EUR: ['€', false, 0.88]
  };
  var DIAL = {
    '225': 'XOF', '221': 'XOF', '223': 'XOF', '226': 'XOF', '229': 'XOF', '228': 'XOF', '227': 'XOF', '245': 'XOF',
    '237': 'XAF', '241': 'XAF', '242': 'XAF', '235': 'XAF', '236': 'XAF', '240': 'XAF',
    '234': 'NGN', '233': 'GHS', '254': 'KES', '27': 'ZAR', '256': 'UGX', '255': 'TZS', '250': 'RWF', '243': 'CDF', '224': 'GNF',
    '212': 'MAD', '213': 'DZD', '216': 'TND', '20': 'EGP', '260': 'ZMW', '265': 'MWK', '258': 'MZN',
    '52': 'MXN', '57': 'COP', '55': 'BRL', '54': 'ARS', '51': 'PEN', '56': 'CLP', '591': 'BOB', '595': 'PYG', '598': 'UYU',
    '502': 'GTQ', '504': 'HNL', '506': 'CRC', '1809': 'DOP', '966': 'SAR', '971': 'AED', '974': 'QAR', '965': 'KWD', '962': 'JOD',
    '964': 'IQD', '968': 'OMR', '973': 'BHD', '91': 'INR', '62': 'IDR', '90': 'TRY', '84': 'VND', '7': 'RUB', '86': 'CNY',
    '33': 'EUR', '32': 'EUR', '49': 'EUR', '34': 'EUR', '351': 'EUR', '39': 'EUR', '352': 'EUR', '43': 'EUR', '31': 'EUR', '353': 'EUR',
    '358': 'EUR', '30': 'EUR'
  };
  // fuseau horaire du téléphone (Zone/Ville) → monnaie : un VPN change la connexion, pas le fuseau
  var TZ = {};
  [['XOF', 'Africa/Abidjan Africa/Dakar Africa/Bamako Africa/Ouagadougou Africa/Porto-Novo Africa/Lome Africa/Niamey Africa/Bissau'],
   ['XAF', 'Africa/Douala Africa/Libreville Africa/Brazzaville Africa/Ndjamena Africa/Bangui Africa/Malabo'],
   ['NGN', 'Africa/Lagos'], ['GHS', 'Africa/Accra'], ['KES', 'Africa/Nairobi'], ['ZAR', 'Africa/Johannesburg'], ['UGX', 'Africa/Kampala'],
   ['TZS', 'Africa/Dar_es_Salaam'], ['RWF', 'Africa/Kigali'], ['CDF', 'Africa/Kinshasa Africa/Lubumbashi'], ['GNF', 'Africa/Conakry'],
   ['MAD', 'Africa/Casablanca'], ['DZD', 'Africa/Algiers'], ['TND', 'Africa/Tunis'], ['EGP', 'Africa/Cairo'], ['ZMW', 'Africa/Lusaka'],
   ['MWK', 'Africa/Blantyre'], ['MZN', 'Africa/Maputo'],
   ['MXN', 'America/Mexico_City America/Monterrey America/Cancun America/Tijuana America/Merida America/Chihuahua America/Hermosillo America/Mazatlan America/Matamoros America/Bahia_Banderas'],
   ['COP', 'America/Bogota'],
   ['BRL', 'America/Sao_Paulo America/Fortaleza America/Recife America/Manaus America/Bahia America/Belem America/Cuiaba America/Maceio America/Campo_Grande America/Porto_Velho America/Araguaina'],
   ['ARS', 'America/Argentina/Buenos_Aires America/Buenos_Aires America/Argentina/Cordoba America/Cordoba America/Argentina/Mendoza'],
   ['PEN', 'America/Lima'], ['CLP', 'America/Santiago'], ['BOB', 'America/La_Paz'], ['PYG', 'America/Asuncion'], ['UYU', 'America/Montevideo'],
   ['GTQ', 'America/Guatemala'], ['HNL', 'America/Tegucigalpa'], ['CRC', 'America/Costa_Rica'], ['DOP', 'America/Santo_Domingo'],
   ['SAR', 'Asia/Riyadh'], ['AED', 'Asia/Dubai'], ['QAR', 'Asia/Qatar'], ['KWD', 'Asia/Kuwait'], ['JOD', 'Asia/Amman'], ['IQD', 'Asia/Baghdad'],
   ['OMR', 'Asia/Muscat'], ['BHD', 'Asia/Bahrain'], ['INR', 'Asia/Kolkata Asia/Calcutta'], ['IDR', 'Asia/Jakarta Asia/Makassar Asia/Jayapura Asia/Pontianak'],
   ['TRY', 'Europe/Istanbul Asia/Istanbul'], ['VND', 'Asia/Ho_Chi_Minh Asia/Saigon'],
   ['RUB', 'Europe/Moscow Europe/Samara Asia/Yekaterinburg Asia/Novosibirsk Europe/Volgograd Asia/Vladivostok'],
   ['CNY', 'Asia/Shanghai Asia/Chongqing Asia/Urumqi Asia/Harbin'],
   ['EUR', 'Europe/Paris Europe/Brussels Europe/Berlin Europe/Madrid Europe/Lisbon Europe/Rome Europe/Luxembourg Europe/Vienna Europe/Amsterdam Europe/Dublin Europe/Helsinki Europe/Athens Europe/Bratislava Europe/Ljubljana Europe/Tallinn Europe/Riga Europe/Vilnius Europe/Malta Europe/Zagreb Atlantic/Canary']
  ].forEach(function (r) { r[1].split(' ').forEach(function (z) { TZ[z] = r[0]; }); });
  // pays (ISO) → monnaie, pour le pays de la CONNEXION (geo.php)
  var CC = {
    CI: 'XOF', SN: 'XOF', ML: 'XOF', BF: 'XOF', BJ: 'XOF', TG: 'XOF', NE: 'XOF', GW: 'XOF',
    CM: 'XAF', GA: 'XAF', CG: 'XAF', TD: 'XAF', CF: 'XAF', GQ: 'XAF',
    NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', UG: 'UGX', TZ: 'TZS', RW: 'RWF', CD: 'CDF', GN: 'GNF', MA: 'MAD', DZ: 'DZD',
    TN: 'TND', EG: 'EGP', ZM: 'ZMW', MW: 'MWK', MZ: 'MZN',
    MX: 'MXN', CO: 'COP', BR: 'BRL', AR: 'ARS', PE: 'PEN', CL: 'CLP', BO: 'BOB', PY: 'PYG', UY: 'UYU', GT: 'GTQ', HN: 'HNL', CR: 'CRC', DO: 'DOP',
    SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD', JO: 'JOD', IQ: 'IQD', OM: 'OMR', BH: 'BHD', IN: 'INR', ID: 'IDR', TR: 'TRY', VN: 'VND',
    RU: 'RUB', CN: 'CNY', FR: 'EUR', BE: 'EUR', DE: 'EUR', ES: 'EUR', PT: 'EUR', IT: 'EUR', LU: 'EUR', AT: 'EUR', NL: 'EUR', IE: 'EUR',
    FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR', CY: 'EUR', HR: 'EUR'
  };
  var AFR = { XOF: 1, XAF: 1, NGN: 1, GHS: 1, KES: 1, ZAR: 1, UGX: 1, TZS: 1, RWF: 1, CDF: 1, GNF: 1, MAD: 1, DZD: 1, TND: 1, EGP: 1, ZMW: 1, MWK: 1, MZN: 1 };
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
  // Sans numéro de téléphone : le FUSEAU HORAIRE du téléphone décide (un VPN change la connexion, pas le fuseau) ;
  // la connexion sert seulement à préciser en Afrique (plusieurs pays partagent un fuseau) ou quand le fuseau est inconnu.
  function tzCode() { try { return String(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch (e) { return ''; } }
  function byPlace() {
    askGeo();
    var tz = tzCode(), t = TZ[tz] || '', g = geoCC ? (CC[geoCC] || '') : '';
    if (t && g) return AFR[t] && AFR[g] ? g : t;
    if (t) return t;
    if (tz && tz.indexOf('/') > 0 && !/^(Etc|UTC)/.test(tz)) return ''; // fuseau d'un pays hors liste → dollars, même si la connexion (VPN) dit autre chose
    return g;
  }
  function code() {
    var u = null;
    try { u = D6.Auth && D6.Auth.current ? D6.Auth.current() : null; } catch (e) { u = null; }
    var sim = ''; try { sim = localStorage.getItem('oro_sim_cur') || ''; } catch (eS) { sim = ''; }
    // lien de test ?simcur=… (affichage seulement) : visiteur ou admin
    if (sim && CUR[sim] && (!u || u.guest || u.role === 'admin')) return sim;
    if (!u || u.guest) return byPlace();
    // compte admin : JAMAIS automatique (propriétaire)
    if (u.role === 'admin') return '';
    // 1) numéro de téléphone donné à l'inscription (s'il y a vraiment un numéro)
    var dial = String(u.countryCode || '').replace(/\D/g, ''), ph = String(u.phone || '').replace(/\D/g, '');
    if (ph.length >= 6 && dial) return DIAL[dial] || '';
    // 2) fuseau horaire puis connexion
    return byPlace();
  }
  function fmt(usd, c) {
    var d = CUR[c]; if (!d) return '';
    var dec = d[2] < 20 && usd * d[2] < 1000 ? 2 : 0, v = Math.floor(Math.max(0, usd) * d[2] * Math.pow(10, dec) + 1e-6) / Math.pow(10, dec);
    var parts = v.toFixed(dec).split('.'), s = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? '.' + parts[1] : '');
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
    var key = txt + '|' + fs + '|' + w + '|' + Math.round(host.getBoundingClientRect().width) + '|' + host.className;
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
    if (fixed) fixBox(host, amtEl, tag);
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
  // mise en page fixe posée EN LIGNE (plus forte que toutes les règles du site, visiteur compris) — voir aussi app.css
  function imp(el, k, v) { if (el) el.style.setProperty(k, v, 'important'); }
  function fixBox(host, amtEl, tag) {
    var fs = /^fsBtn/.test(host.id), lbl = host.querySelector('.mb-lbl');
    // propriétaire : « donne un peu de hauteur » → la case grandit de 6 px vers le bas, les 3 lignes respirent
    if (!host.__h0) { host.style.removeProperty('height'); host.style.removeProperty('min-height'); host.__h0 = host.offsetHeight || 38; }
    var H = host.__h0 + 6;
    imp(host, 'height', H + 'px'); imp(host, 'min-height', H + 'px');
    imp(host, 'justify-content', 'center'); imp(host, 'padding-top', '1px'); imp(host, 'padding-bottom', '5px'); imp(host, 'row-gap', '0px');
    if (lbl) { imp(lbl, 'line-height', '9px'); imp(lbl, 'height', '9px'); imp(lbl, 'margin', '0 0 2px'); imp(lbl, 'flex', 'none'); }
    imp(amtEl, 'line-height', '1'); imp(amtEl, 'margin', '0 0 2px'); imp(amtEl, 'flex', 'none'); imp(amtEl, 'zoom', fs ? '1' : '0.95');
    imp(tag, 'line-height', '9px'); imp(tag, 'height', '9px'); imp(tag, 'flex', 'none'); imp(tag, 'overflow', 'visible'); imp(tag, 'font-size', '9px');
    // barre claire du bas de la case choisie : 1,5 px au lieu de 3 (la couleur reste celle du site)
    host.style.removeProperty('box-shadow');
    var sh = getComputedStyle(host).boxShadow || '';
    if (/inset/.test(sh) && /-3px/.test(sh)) imp(host, 'box-shadow', sh.replace(/0px -3px 0px/g, '0px -1.5px 0px'));
  }
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
    { host: '.stake-field', amt: '#inputStake', ov: 1, noFs: 1 },
    // plein écran : minuscule équivalent du GAIN sous « ≈ $ 1.90 » (propriétaire), autre couleur
    { host: '.stake-field', amt: '#previewGain', ov: 1, fsOnly: 1, cls: 'fsl' },
    { host: '#screenTrade .win-preview', amt: '#previewGain', ov: 1 },
    { host: '#casinoModal .cg-in', amt: '#csStake', ov: 1 },
    // bouton ENCAISSER des jeux : petit équivalent posé en bas du bouton (le bouton change de texte à chaque instant :
    // la ligne est à côté de lui, dans son parent, et suit sa position)
    { host: '#casinoModal #csGo', amt: '#csGo', btn: 1, cls: 'gol' },
    { host: '#casinoModal .sp2-inw[for="spStake"]', amt: '#spStake', ov: 1 },
    { host: '#casinoModal .sp2-sum p.win', amt: '#spPot' },
    { host: '#depositModal .amt-row', amt: '#depositAmt' },
    { host: '#withdrawModal #withdrawAmt', amt: '#withdrawAmt', after: 1 }
  ];
  function spots(c) {
    SPOTS.forEach(function (sp) {
      var hosts = document.querySelectorAll(sp.host);
      for (var i = 0; i < hosts.length; i++) {
        var host = hosts[i], amt = sp.amt === sp.host ? host : document.querySelector(sp.amt);
        var box = (sp.after || sp.btn) ? host.parentNode : host;
        if (!box) continue;
        var tag = box.querySelector(':scope > .oro-loc2' + (sp.cls ? '.' + sp.cls : ':not(.fsl)'));
        var n = c ? numOf(amt) : null;
        var fsOn = document.documentElement.classList.contains('fs-trade');
        if ((sp.noFs && fsOn) || (sp.fsOnly && !fsOn)) n = null; // plein écran : le gain « ≈ $ » est déjà sous la mise
        if ((!c || n == null) && sp.btn) host.classList.remove('has-gol');
        if (!c || n == null) { if (tag) tag.remove(); if (!box.querySelector(':scope > .oro-loc2')) box.classList.remove('has-loc2', 'loc2-ov'); if (sp.cls) box.classList.remove('has-' + sp.cls); continue; }
        if (!tag) {
          tag = document.createElement('span'); tag.className = 'oro-loc2' + (sp.cls ? ' ' + sp.cls : ''); tag.setAttribute('dir', 'ltr');
          if (sp.after && host.nextSibling) box.insertBefore(tag, host.nextSibling); else box.appendChild(tag);
        }
        var t = fmt(n, c);
        box.classList.add('has-loc2'); box.classList.toggle('loc2-ov', !!sp.ov); if (sp.cls) box.classList.add('has-' + sp.cls);
        if (sp.btn) {
          host.classList.add('has-gol');
          if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
          var hr = host.getBoundingClientRect(), pr = box.getBoundingClientRect();
          tag.style.left = (hr.left - pr.left) + 'px'; tag.style.width = hr.width + 'px'; tag.style.top = (hr.bottom - pr.top - 15) + 'px';
        }
        if (tag.textContent !== t || tag.__w !== box.clientWidth) {
          tag.textContent = t; tag.__w = box.clientWidth;
          // élastique (propriétaire) : plus le montant est long, plus la ligne rapetisse ; jamais de débordement
          tag.style.fontSize = '';
          var f0 = parseFloat(getComputedStyle(tag).fontSize) || 9;
          for (var k = 0; k < 16 && tag.clientWidth > 0 && tag.scrollWidth > tag.clientWidth + 1 && f0 > 6; k++) { f0 = Math.round((f0 - 0.5) * 10) / 10; tag.style.fontSize = f0 + 'px'; }
        }
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
        mo.observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
      });
      soon();
    }
    // v3053 : bouton ENCAISSER des jeux — le montant en dollars bouge sans cesse (crash, jeux d'adresse) : l'équivalent suit
    // en moins de 0,25 s (avant : jusqu'à 0,7 s de retard, « ≈ » d'un ancien montant) ; limité à 4 fois par seconde
    var goT = 0, goMo = new MutationObserver(function () { if (goT) return; goT = setTimeout(function () { goT = 0; soon(); }, 220); });
    function hookGo() {
      var g = document.getElementById('csGo');
      if (!g || (seen && seen.has(g))) return;
      if (seen) seen.add(g);
      goMo.observe(g, { subtree: true, childList: true, characterData: true });
    }
    hook(); hookGo();
    setInterval(hook, 1500); setInterval(hookGo, 500);
    document.addEventListener('input', soon, true); document.addEventListener('click', function () { setTimeout(soon, 60); }, true);
    setInterval(soon, 700); // gains / mises qui bougent (petit, sans effet si rien n'a changé) // fenêtre Jeux / Paris créée plus tard, connexion, changement de compte
  }
  D6.LocalCur = { code: code, fmt: fmt, paint: soon, list: function () { return Object.keys(CUR).filter(function (k) { return CUR[k]; }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
