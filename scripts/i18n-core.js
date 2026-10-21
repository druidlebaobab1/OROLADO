/*
 * OROLADO — traductions : NOYAU (logique seulement : t(), msg(), choix de la langue, application au DOM).
 * Source de ce noyau : scripts/i18n-core.js. Les TEXTES restent dans js/translations.js, js/i18n-zh.js et js/i18n-src.js
 * (on continue de les modifier là). `node scripts/gen-i18n.js` fabrique js/i18n/core.js (ce noyau + tables) et
 * js/i18n/<langue>.js (une langue par fichier). `node scripts/gen-i18n.js --check` : code 1 si pas à jour.
 * 2026-10-20 (vieux Android) : avant, les 12 langues (≈ 860 Ko) étaient téléchargées à chaque visite ; maintenant
 * seulement l'anglais (secours de t(), comme avant) + la langue du joueur, chargés AVANT la suite (bloquant, même ordre).
 */
(function (D6) {
  'use strict';

  /*@@BUILD@@*/

  var DICT = D6.I18N_DICT = D6.I18N_DICT || {};
  var SUP = {};
  B.langs.forEach(function (l) { SUP[l.code] = 1; });
  D6.LANGS = B.langs.map(function (l) { return { code: l.code, flag: l.flag, name: l.name }; });
  var MSG_FR = B.msgFr;
  var MSG_FR_PATTERNS = B.msgFrPatterns.map(function (p) {
    var row = [new RegExp(p[0], p[1]), p[2]];
    if (p.length > 3) row.push(p[3]);
    return row;
  });
  var MSG_LANGS = B.msgLangs;
  var SHORT_TABLE = B.shortTable;
  var SHORT_OF = B.shortOf;
  var SHORT_RAW = B.shortRaw;
  var SHORT_FR = B.shortFr;

  // Fichiers de langue : à côté de ce noyau (js/i18n/), adresse versionnée par leur contenu.
  var BASE = 'js/i18n/';
  try {
    var cs = document.currentScript;
    if (cs && cs.src) BASE = String(cs.src).replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
  } catch (eBase) { /* ignore */ }
  function langUrl(code) { return BASE + code + '.js?v=' + B.files[code]; }
  var waiting = {};
  function loaded(code) {
    var cbs = waiting[code];
    if (!cbs) return;
    delete waiting[code];
    cbs.forEach(function (cb) { try { cb(); } catch (eCb) { /* ignore */ } });
  }
  /** Charge une langue (sans bloquer) puis appelle cb — tout de suite si elle est déjà là. */
  function loadLang(code, cb) {
    if (DICT[code]) { cb(); return; }
    if (waiting[code]) { waiting[code].push(cb); return; }
    waiting[code] = [cb];
    try {
      var s = document.createElement('script');
      s.src = langUrl(code);
      s.onload = s.onerror = function () { loaded(code); };
      (document.head || document.documentElement).appendChild(s);
    } catch (eLoad) { loaded(code); }
  }

  var LANG_KEY = 'orolado_lang';
  var LANG_USER_KEY = 'orolado_lang_user';
  var LANG_MANUAL_KEY = 'orolado_manual_lang';
  var LANG_SELECTED_KEY = 'orolado_selected_lang';
  var LANG_EXPLICIT_KEY = 'user_explicitly_selected_lang';
  var LANG_SESSION_KEY = 'orolado_lang_session';

  function matchSupportedLang(raw) {
    var code = String(raw || '').toLowerCase().replace('_', '-').replace(/\s+/g, '').trim();
    if (!code) return '';
    if (code.indexOf('ar') === 0) return 'ar';
    if (code.indexOf('es') === 0) return 'es';
    if (code.indexOf('fr') === 0) return 'fr';
    if (code.indexOf('pt') === 0) return 'pt';
    if (code.indexOf('ru') === 0) return 'ru';
    if (code.indexOf('tr') === 0) return 'tr';
    if (code.indexOf('vi') === 0) return 'vi';
    if (code.indexOf('id') === 0) return 'id';
    if (code.indexOf('de') === 0) return 'de';
    if (code.indexOf('hi') === 0) return 'hi';
    if (code.indexOf('zh') === 0) return 'zh';
    if (code.indexOf('en') === 0) return 'en';
    return '';
  }

  function langFromTimezone(tz) {
    tz = String(tz || '');
    if (!tz) return '';
    if (/Dubai|Riyadh|Qatar|Kuwait|Bahrain|Muscat|Baghdad|Damascus|Amman|Beirut|Gaza|Hebron|Cairo|Tripoli|Khartoum|Nouakchott|Casablanca|El_Aaiun|Algiers|Tunis|Aden/.test(tz)) return 'ar';
    if (/Sao_Paulo|Fortaleza|Recife|Bahia|Maceio|Araguaina|Santarem|Boa_Vista|Manaus|Belem|Noronha|Rio_Branco|Cuiaba|Campo_Grande|Porto_Velho|Lisbon|Madeira|Azores|Luanda|Maputo|Bissau|Sao_Tome|Cape_Verde|Dili/.test(tz)) return 'pt';
    if (/Madrid|Ceuta|Canary|Bogota|Lima|Mexico_City|Monterrey|Merida|Cancun|Chihuahua|Hermosillo|Mazatlan|Tijuana|Caracas|Santiago|Buenos_Aires|Argentina|Montevideo|Guayaquil|Galapagos|Panama|Havana|Santo_Domingo|Guatemala|Tegucigalpa|Managua|El_Salvador|Costa_Rica|Asuncion|La_Paz|Puerto_Rico|Malabo/.test(tz)) return 'es';
    if (/Paris|Brussels|Luxembourg|Monaco|Abidjan|Dakar|Bamako|Ouagadougou|Lome|Porto-Novo|Douala|Libreville|Brazzaville|Kinshasa|Lubumbashi|Bangui|Ndjamena|Bujumbura|Djibouti|Niamey|Conakry|Reunion|Mauritius|Mayotte|Comoro|Martinique|Guadeloupe|Cayenne|Noumea|Tahiti|Antananarivo|Port-au-Prince|Miquelon/.test(tz)) return 'fr';
    if (tz.indexOf('Istanbul') >= 0) return 'tr';
    if (tz.indexOf('Ho_Chi_Minh') >= 0 || tz.indexOf('Hanoi') >= 0) return 'vi';
    if (/Jakarta|Pontianak|Makassar|Jayapura/.test(tz)) return 'id';
    if (/Moscow|Volgograd|Kirov|Samara|Saratov|Ulyanovsk|Astrakhan|Yekaterinburg|Omsk|Novosibirsk|Barnaul|Tomsk|Novokuznetsk|Krasnoyarsk|Irkutsk|Chita|Yakutsk|Vladivostok|Magadan|Kamchatka|Kaliningrad|Minsk/.test(tz)) return 'ru';
    if (/Berlin|Busingen|Vienna|Zurich|Vaduz/.test(tz)) return 'de';
    if (tz.indexOf('Kolkata') >= 0 || tz.indexOf('Calcutta') >= 0) return 'hi';
    if (/Shanghai|Chongqing|Harbin|Urumqi|Hong_Kong|Macau|Taipei/.test(tz)) return 'zh';
    return '';
  }

  function langFromCountry(cc) {
    cc = String(cc || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (cc.length !== 2) return '';
    if ({ SA:1, AE:1, EG:1, IQ:1, JO:1, KW:1, QA:1, BH:1, OM:1, YE:1, LY:1, SD:1, SY:1, PS:1, LB:1, MR:1, MA:1, DZ:1, TN:1 }[cc]) return 'ar';
    if ({ FR:1, BE:1, LU:1, MC:1, SN:1, CI:1, CM:1, ML:1, BF:1, NE:1, TG:1, BJ:1, GA:1, CG:1, CD:1, MG:1, HT:1, GN:1, TD:1, GF:1, GP:1, MQ:1, RE:1, YT:1, NC:1, PF:1 }[cc]) return 'fr';
    if ({ ES:1, CO:1, MX:1, AR:1, PE:1, CL:1, VE:1, EC:1, GT:1, CU:1, BO:1, DO:1, HN:1, PY:1, SV:1, NI:1, CR:1, PA:1, UY:1, PR:1 }[cc]) return 'es';
    if ({ BR:1, PT:1, AO:1, MZ:1, GW:1, ST:1, CV:1, TL:1 }[cc]) return 'pt';
    if (cc === 'TR') return 'tr';
    if (cc === 'VN') return 'vi';
    if (cc === 'ID') return 'id';
    if (cc === 'RU') return 'ru';
    if (cc === 'DE' || cc === 'AT') return 'de';
    if (cc === 'IN') return 'hi';
    if ({ CN:1, TW:1, HK:1, MO:1 }[cc]) return 'zh';
    return '';
  }

  function collectLangCandidates() {
    var candidates = [];
    var i;
    try {
      if (navigator.languages && navigator.languages.length) {
        for (i = 0; i < navigator.languages.length; i++) candidates.push(navigator.languages[i]);
      }
    } catch (eLangs) { /* ignore */ }
    try { if (navigator.language) candidates.push(navigator.language); } catch (eLang) { /* ignore */ }
    try { if (navigator.userLanguage) candidates.push(navigator.userLanguage); } catch (eUL) { /* ignore */ }
    try { if (navigator.browserLanguage) candidates.push(navigator.browserLanguage); } catch (eBL) { /* ignore */ }
    try {
      var loc = (Intl.DateTimeFormat().resolvedOptions() || {}).locale;
      if (loc) candidates.push(loc);
    } catch (eLoc) { /* ignore */ }
    return candidates;
  }

  // La 1re langue du téléphone que le site connaît gagne, anglais compris (le site est
  // international : un téléphone en anglais reste en anglais, même en Afrique francophone).
  function detectFromNavigator() {
    var candidates = collectLangCandidates();
    var i;
    for (i = 0; i < candidates.length; i++) {
      var hit = matchSupportedLang(candidates[i]);
      if (hit) return hit;
    }
    return '';
  }

  function detectUserLanguage() {
    var fromPhone = detectFromNavigator();
    if (fromPhone) return fromPhone;
    try {
      var fromTz = langFromTimezone((Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '');
      if (fromTz) return fromTz;
    } catch (eTz) { /* ignore */ }
    return fromPhone || 'en';
  }

  function detectAutoLang() {
    return detectUserLanguage();
  }

  function urlLang() {
    try {
      var q = new URLSearchParams(window.location.search);
      var raw = String(q.get('lang') || q.get('hl') || '').toLowerCase().replace('_', '-');
      var code = raw.split('-')[0];
      if (code && SUP[code]) return code;
    } catch (e) { /* ignore */ }
    return '';
  }

  function hasExplicitLang() {
    try {
      var sess = sessionStorage.getItem(LANG_SESSION_KEY);
      if (sess && SUP[sess]) return true;
    } catch (eEx) { /* ignore */ }
    return false;
  }

  function readManualLang() {
    try {
      var sess = sessionStorage.getItem(LANG_SESSION_KEY);
      if (sess && SUP[sess]) return sess;
    } catch (e) { /* ignore */ }
    return '';
  }

  function persistManualLang(code) {
    try { sessionStorage.setItem(LANG_SESSION_KEY, code); } catch (eSess) { /* ignore */ }
    try {
      localStorage.setItem(LANG_EXPLICIT_KEY, '1');
      localStorage.setItem(LANG_SELECTED_KEY, code);
      localStorage.setItem(LANG_MANUAL_KEY, code);
      localStorage.setItem(LANG_KEY, code);
      localStorage.setItem(LANG_USER_KEY, '1');
    } catch (e) { /* ignore */ }
  }

  function detectLang() {
    var fromUrl = urlLang();
    if (fromUrl) return fromUrl;
    if (hasExplicitLang()) {
      var manual = readManualLang();
      if (manual) return manual;
    }
    return detectAutoLang() || 'en';
  }

  var lang = detectLang();
  if (!SUP[lang]) lang = 'en';
  var lockedLang = !!(urlLang() || hasExplicitLang());

  function syncHtmlDir() {
    var html = document.documentElement;
    if (!html) return;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.setAttribute('data-lang', lang);
    html.setAttribute('translate', 'no');
    html.classList.add('notranslate');
    html.classList.toggle('lang-ar', lang === 'ar');
  }
  syncHtmlDir();

  function t(key) {
    try {
      var packLang = DICT[lang] || DICT.en || {};
      if (Object.prototype.hasOwnProperty.call(packLang, key) && packLang[key] != null && packLang[key] !== '') {
        return packLang[key];
      }
      if (DICT.en && Object.prototype.hasOwnProperty.call(DICT.en, key) && DICT.en[key] != null && DICT.en[key] !== '') {
        return DICT.en[key];
      }
      return key;
    } catch (eT) {
      return key;
    }
  }

  /**
   * Traduit un message affiché au joueur (erreur, avis, notification). Les messages français
   * connus (serveur ou code) deviennent la langue du joueur ; l'anglais par défaut.
   */
  function msg(text) {
    try {
      if (text == null) return text;
      var raw = String(text);
      if (!raw) return raw;
      if (lang === 'fr') return raw;
      var norm = raw.trim().toLowerCase().replace(/[\u2019\u2018]/g, "'").replace(/\s+/g, ' ');
      var key = MSG_FR[norm] || MSG_FR[norm.replace(/[.!]$/, '')];
      if (key) return t(key);
      var i;
      for (i = 0; i < MSG_FR_PATTERNS.length; i++) {
        var m = norm.match(MSG_FR_PATTERNS[i][0]);
        if (!m) continue;
        var out = t(MSG_FR_PATTERNS[i][1]);
        if (MSG_FR_PATTERNS[i][2]) return (out + ' ' + (m[1] ? raw.slice(raw.length - m[1].length) : '')).trim();
        return m[1] != null ? out.replace('{n}', m[1].trim()) : out;
      }
      return raw;
    } catch (eMsg) {
      return text;
    }
  }

  function depositLabel() {
    try {
      var v = t('deposit');
      if (!v || v === 'deposit') v = t('recharge');
      if (!v || v === 'recharge') v = '';
      return v || 'Deposit';
    } catch (eDep) {
      return 'Deposit';
    }
  }

  function apply() {
    try { syncHtmlDir(); } catch (eDir) { /* ignore */ }
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      try {
        var key = el.getAttribute('data-i18n');
        if (key === 'authRealPitch') { el.textContent = ''; return; }
        var val = (key === 'recharge' || key === 'deposit') ? depositLabel() : t(key);
        el.textContent = val;
      } catch (eEl) { /* ignore */ }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      try { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'))); } catch (ePh) { /* ignore */ }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      try { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); } catch (eAr) { /* ignore */ }
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      try { el.setAttribute('title', t(el.getAttribute('data-i18n-title'))); } catch (eTi) { /* ignore */ }
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      try { btn.classList.toggle('on', btn.dataset.lang === lang); } catch (eLg) { /* ignore */ }
    });
    try {
      var dep = document.getElementById('btnDepositLabel');
      if (dep) dep.textContent = depositLabel();
    } catch (eLbl) { /* ignore */ }
    try {
      document.dispatchEvent(new CustomEvent('orolado-i18n'));
    } catch (e3) { /* ignore */ }
  }

  var geoStarted = false;

  function applyAutoLang(code) {
    if (lockedLang || hasExplicitLang() || urlLang()) return;
    if (!SUP[code]) code = 'en';
    if (lang === code) return;
    // La langue est d'abord téléchargée (js/i18n/<langue>.js), puis appliquée comme avant.
    loadLang(code, function () {
      if (lockedLang || hasExplicitLang() || urlLang()) return;
      if (lang === code || !DICT[code]) return;
      lang = code;
      try { localStorage.setItem(LANG_KEY, code); } catch (eAuto) { /* ignore */ }
      apply();
    });
  }

  function refineFromIpCountry() {
    // Ordre : 1) langue du téléphone, 2) fuseau horaire, 3) EN DERNIER RECOURS seulement,
    // le pays vu par Cloudflare (notre propre serveur, pas de service extérieur).
    if (lockedLang || hasExplicitLang() || urlLang()) return;
    if (detectFromNavigator()) return;
    try {
      if (langFromTimezone((Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '')) return;
    } catch (eTz2) { /* ignore */ }
    try {
      fetch('api.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'geo' }) })
        .then(function (r) { return r && r.ok ? r.json() : null; })
        .then(function (j) {
          var hit = langFromCountry(String((j && j.country) || '').toUpperCase());
          if (hit) applyAutoLang(hit);
        }).catch(function () { /* ignore */ });
    } catch (eGeo) { /* ignore */ }
    return;
    // eslint-disable-next-line no-unreachable
    if (lockedLang || hasExplicitLang() || urlLang()) return;
    var phoneLang = detectFromNavigator();
    if (phoneLang && phoneLang !== 'en') return;
    var sources = ['https://api.country.is/', 'https://ipapi.co/json/'];
    var i = 0;
    function next() {
      if (i >= sources.length || lockedLang || hasExplicitLang() || urlLang()) return;
      var url = sources[i++];
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = setTimeout(function () {
        try { if (ctrl) ctrl.abort(); } catch (eAb) { /* ignore */ }
      }, 2500);
      fetch(url, { cache: 'no-store', credentials: 'omit', signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
        return r && r.ok ? r.json() : null;
      }).then(function (j) {
        clearTimeout(timer);
        var cc = String((j && (j.country || j.country_code)) || '').toUpperCase();
        var hit = langFromCountry(cc);
        if (hit) applyAutoLang(hit);
        else next();
      }).catch(function () {
        clearTimeout(timer);
        next();
      });
    }
    try { next(); } catch (eIp) { /* ignore */ }
  }

  function startGeo() {
    if (geoStarted || lockedLang || hasExplicitLang()) return;
    geoStarted = true;
    applyAutoLang(detectAutoLang() || 'en');
    refineFromIpCountry();
  }

  function refineFromGeo() {
    if (lockedLang || hasExplicitLang()) return;
    if (!geoStarted) startGeo();
    else refineFromIpCountry();
  }

  function shortRow(k) {
    var row = SHORT_TABLE[k];
    if (!row) return null;
    var i = MSG_LANGS.indexOf(lang);
    if (i < 0) return null; // v3047 : langue sans texte court (zh) → message complet traduit, plus d'anglais
    return row[i] || row[0];
  }
  /** Texte court pour une notification, ou null si le message est déjà court. */
  function shortMsg(text) {
    try {
      if (text == null) return null;
      var raw = String(text);
      var norm = raw.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
      var k = SHORT_RAW[norm] || SHORT_RAW[norm.replace(/[.!]$/, '')];
      if (k) return shortRow(k);
      var mk = MSG_FR[norm] || MSG_FR[norm.replace(/[.!]$/, '')];
      if (mk && SHORT_OF[mk]) return shortRow(SHORT_OF[mk]);
      var dk;
      for (dk in SHORT_OF) {
        if (!Object.prototype.hasOwnProperty.call(SHORT_OF, dk) || dk.indexOf('m_') === 0) continue;
        var cur = t(dk), fr = SHORT_FR[dk], en = DICT.en && DICT.en[dk];
        if ((cur && cur !== dk && raw === cur) || (fr && raw === fr) || (en && raw === en)) return shortRow(SHORT_OF[dk]);
      }
      return null;
    } catch (eS) {
      return null;
    }
  }

  var pendingSet = null;
  /** Langue choisie dans le menu, chargée après coup : on rejoue le même bouton (js/app.js rafraîchit alors tout l'écran). */
  function replaySet(code) {
    try {
      var btn = document.querySelector('.lang-btn[data-lang="' + code + '"]');
      if (btn && typeof btn.click === 'function') btn.click();
    } catch (eRe) { /* ignore */ }
    if (lang !== code) D6.I18N.set(code);
  }

  D6.I18N = {
    t: t, short: shortMsg,
    keys: function () {
      var s = {};
      Object.keys(DICT).forEach(function (l) { Object.keys(DICT[l] || {}).forEach(function (k) { s[k] = 1; }); });
      B.extraKeys.forEach(function (k) { s[k] = 1; });
      return Object.keys(s);
    },
    msg: msg,
    depositLabel: depositLabel,
    apply: apply,
    refineFromGeo: refineFromGeo,
    get lang() { return lang; },
    set: function (code) {
      if (!SUP[code]) return;
      if (!DICT[code]) {
        // Langue pas encore téléchargée : on la charge, puis on refait exactement le même changement.
        pendingSet = code;
        loadLang(code, function () {
          if (pendingSet !== code) return;
          pendingSet = null;
          if (DICT[code]) replaySet(code);
        });
        return;
      }
      pendingSet = null;
      lang = code;
      lockedLang = true;
      persistManualLang(code);
      apply();
      // v2429 — textes des fenêtres ouvertes réglés pour la nouvelle langue (js/fit.js).
      try { document.dispatchEvent(new Event('oro:lang')); } catch (eEv) { /* ignore */ }
      try { if (D6.Fit) D6.Fit.open(); } catch (eFit) { /* ignore */ }
    }
  };

  // Démarrage : anglais (secours) + langue du joueur, écrits juste après ce script → exécutés AVANT store.js, app.js…
  // (comme l'ancien gros fichier). Puis, comme avant : apply() et startGeo().
  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    try { apply(); } catch (e7) { /* ignore */ }
    try { startGeo(); } catch (e8) { /* ignore */ }
  }
  D6.I18N_BOOT = boot;
  var need = lang === 'en' ? ['en'] : ['en', lang];
  var written = false;
  try {
    if (document.readyState === 'loading' && document.currentScript) {
      document.write(need.map(function (c) { return '<script src="' + langUrl(c) + '"><\/script>'; }).join('') +
        '<script>window.D6&&D6.I18N_BOOT&&D6.I18N_BOOT()<\/script>');
      written = true;
    }
  } catch (eW) { written = false; }
  if (!written) {
    var left = need.length;
    need.forEach(function (c) { loadLang(c, function () { if (--left === 0) boot(); }); });
  }
})(window.D6 = window.D6 || {});
