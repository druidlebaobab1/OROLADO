// Fabrique les pages publiques Conditions / Confidentialité / Contact (demandées par les prestataires de paiement) :
//   conditions/index.html    — les conditions d'utilisation du site, dans les 11 langues (textes pris dans js/i18n.js)
//   confidentialite/index.html — politique de confidentialité (français + anglais)
//   contact/index.html        — comment joindre OROLADO (français + anglais)
// Lancer : node scripts/pages-legales.js   (à relancer après chaque changement des conditions dans js/i18n.js)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.dirname(__dirname);
const MAIL = 'support@orolado.com';

// 1) Textes des conditions, langue par langue, lus dans js/i18n.js (même texte que la fenêtre du site).
function loadTerms() {
  const store = {};
  const el = () => ({ setAttribute() {}, getAttribute() { return null; }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, style: {}, appendChild() {}, querySelectorAll() { return []; }, querySelector() { return null; } });
  const document = { documentElement: el(), body: el(), querySelectorAll() { return []; }, querySelector() { return null; }, getElementById() { return null; }, addEventListener() {}, createElement: el, dispatchEvent() {}, readyState: 'complete' };
  const ctx = { console, document, navigator: { language: 'fr', languages: ['fr'], userAgent: 'node' }, location: { search: '', hostname: 'orolado.com', href: 'https://orolado.com/' },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    setTimeout: () => 0, clearTimeout() {}, fetch: () => new Promise(() => {}), Event: function () {}, Intl, Date, Math, JSON };
  ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  // 2026-10-20 : textes lus dans les SOURCES des traductions (le site charge js/i18n/core.js + une langue, générés par scripts/gen-i18n.js).
  const files = ['js/translations.js', 'js/i18n-zh.js', 'js/i18n-src.js'].concat([...html.matchAll(/<script[^>]+src="(js\/[^"?]+)/g)].map(m => m[1]).filter(s => /learn-txt/i.test(s)));
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  const I = ctx.D6.I18N, out = {};
  const keys = ['termsTitle', 'tcGiftsT', 'tcMoreT'];
  for (let i = 1; i <= 27; i++) { keys.push('tc' + i + 't', 'tc' + i); if (i >= 19) keys.push('tc' + i + 'b'); }
  for (const c of ['en', 'fr', 'es', 'pt', 'ar', 'tr', 'de', 'ru', 'id', 'vi', 'hi']) {
    I.set(c); if (I.lang !== c) throw new Error('langue absente : ' + c);
    out[c] = {}; for (const k of keys) out[c][k] = String(I.t(k) || '').replace(/[⁦-⁩]/g, '').replace(/\$\s+(?=\d)/g, '$');
  }
  return out;
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const NAMES = { en: 'English', fr: 'Français', es: 'Español', pt: 'Português', ar: 'العربية', tr: 'Türkçe', de: 'Deutsch', ru: 'Русский', id: 'Bahasa Indonesia', vi: 'Tiếng Việt', hi: 'हिन्दी' };
const NAV = {
  fr: { terms: 'Conditions', privacy: 'Confidentialité', contact: 'Contact', about: 'À propos', back: 'Aller sur OROLADO', upd: '' },
  en: { terms: 'Terms', privacy: 'Privacy', contact: 'Contact', about: 'About', back: 'Go to OROLADO', upd: '' },
  es: { terms: 'Condiciones', privacy: 'Privacidad', contact: 'Contacto', about: 'Nosotros', back: 'Ir a OROLADO', upd: '' },
  pt: { terms: 'Termos', privacy: 'Privacidade', contact: 'Contacto', about: 'Sobre', back: 'Ir para a OROLADO', upd: '' },
  ar: { terms: 'الشروط', privacy: 'الخصوصية', contact: 'اتصل بنا', about: 'من نحن', back: 'اذهب إلى OROLADO', upd: '' },
  tr: { terms: 'Koşullar', privacy: 'Gizlilik', contact: 'İletişim', about: 'Hakkımızda', back: 'OROLADO’ya git', upd: '' },
  de: { terms: 'Bedingungen', privacy: 'Datenschutz', contact: 'Kontakt', about: 'Über uns', back: 'Zu OROLADO', upd: '' },
  ru: { terms: 'Условия', privacy: 'Конфиденциальность', contact: 'Контакты', about: 'О нас', back: 'Перейти на OROLADO', upd: '' },
  id: { terms: 'Ketentuan', privacy: 'Privasi', contact: 'Kontak', about: 'Tentang', back: 'Buka OROLADO', upd: '' },
  vi: { terms: 'Điều khoản', privacy: 'Quyền riêng tư', contact: 'Liên hệ', about: 'Giới thiệu', back: 'Vào OROLADO', upd: '' },
  hi: { terms: 'शर्तें', privacy: 'गोपनीयता', contact: 'संपर्क', about: 'परिचय', back: 'OROLADO पर जाएँ', upd: '' }
};

// 2) Habillage commun (simple, lisible, sans décor animé).
function page({ file, title, desc, body, langs, script }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="https://www.orolado.com/${file}/">
  <meta name="theme-color" content="#0B0A24">
  <link rel="icon" href="/icons/favicon-blanc-48.png?v=2656" sizes="48x48" type="image/png">
  <style>
    :root{--bg:#0B0A24;--card:#14123A;--line:rgba(255,255,255,.12);--txt:#EEF0FA;--mut:#B8BDD8;--gold:#FBBF24}
    *{box-sizing:border-box}
    html{-webkit-text-size-adjust:100%}
    body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
    a{color:var(--gold)}
    header{position:sticky;top:0;background:rgba(11,10,36,.96);border-bottom:1px solid var(--line);z-index:5}
    .bar{max-width:860px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .brand{display:flex;align-items:center;gap:8px;color:var(--txt);text-decoration:none;font-weight:800;letter-spacing:.08em}
    .brand img{width:34px;height:34px}
    nav.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}
    nav.tabs a{padding:6px 10px;border-radius:9px;text-decoration:none;color:var(--mut);font-weight:700;font-size:14px;border:1px solid transparent}
    nav.tabs a.on{color:var(--txt);border-color:var(--line);background:rgba(255,255,255,.06)}
    select{background:var(--card);color:var(--txt);border:1px solid var(--line);border-radius:9px;padding:6px 8px;font:inherit;font-size:14px;max-width:150px}
    main{max-width:860px;margin:0 auto;padding:22px 16px 60px}
    h1{font-size:1.55rem;line-height:1.25;margin:4px 0 4px}
    .upd{color:var(--mut);font-size:14px;margin:0 0 18px}
    h2{font-size:1.2rem;margin:30px 0 8px;color:var(--gold)}
    h3{font-size:1.02rem;margin:22px 0 4px}
    p,li{color:#DCDFF0}
    .ex{color:var(--mut);font-size:15px;border-left:3px solid var(--line);padding-left:10px}
    .box{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:14px 0}
    .go{display:inline-block;margin-top:26px;background:linear-gradient(135deg,#FCD34D,#F59E0B);color:#1A1203;font-weight:800;text-decoration:none;padding:12px 18px;border-radius:12px}
    footer{border-top:1px solid var(--line);color:var(--mut);font-size:13px;text-align:center;padding:18px 16px 28px}
    [dir=rtl] nav.tabs{margin-left:0;margin-right:auto}
    [dir=rtl] .ex{border-left:0;border-right:3px solid var(--line);padding-left:0;padding-right:10px}
    [hidden]{display:none!important}
  </style>
</head>
<body>
<header><div class="bar">
  <a class="brand" href="https://www.orolado.com/"><img src="/icons/logo-ring.svg?v=2656" alt="" width="34" height="34">OROLADO</a>
  <nav class="tabs">
    <a href="/conditions/"${file === 'conditions' ? ' class="on"' : ''} data-t="terms">Terms</a>
    <a href="/confidentialite/"${file === 'confidentialite' ? ' class="on"' : ''} data-t="privacy">Privacy</a>
    <a href="/contact/"${file === 'contact' ? ' class="on"' : ''} data-t="contact">Contact</a>
    <a href="/about/"${file === 'about' ? ' class="on"' : ''} data-t="about">About</a>
  </nav>
  <select id="lang" aria-label="Language">${langs.map(l => `<option value="${l}">${NAMES[l]}</option>`).join('')}</select>
</div></header>
<main id="main">
${body}
</main>
<footer>© 2026 OROLADO · ${MAIL} · 18+</footer>
<script>
(function(){
  var LANGS=${JSON.stringify(langs)}, NAV=${JSON.stringify(NAV)};
  function pick(){
    var q=(location.search.match(/[?&]lang=([a-z]{2})/)||[])[1];
    var s=null; try{s=localStorage.getItem('oroLegalLang')}catch(e){}
    var n=String((navigator.languages&&navigator.languages[0])||navigator.language||'en').slice(0,2).toLowerCase();
    return [q,s,n].filter(function(x){return x&&LANGS.indexOf(x)>=0})[0]||'en';
  }
  ${script}
  function setLang(l){
    document.documentElement.lang=l; document.documentElement.dir=(l==='ar')?'rtl':'ltr';
    var nv=NAV[l]||NAV.en; [].forEach.call(document.querySelectorAll('[data-t]'),function(a){a.textContent=nv[a.getAttribute('data-t')]});
    document.getElementById('lang').value=l; render(l);
  }
  document.getElementById('lang').addEventListener('change',function(){try{localStorage.setItem('oroLegalLang',this.value)}catch(e){} setLang(this.value)});
  setLang(pick());
})();
</script>
</body>
</html>
`;
}

// 3) Page Conditions : 11 langues, le texte anglais est écrit en dur (pour Google et les vérificateurs).
function termsHtml(T, l) {
  const t = T[l]; const upd = (NAV[l] || NAV.en).upd;
  let h = `<h1>${esc(t.termsTitle)}</h1>\n`;
  for (let i = 1; i <= 18; i++) h += `<h3>${esc(t['tc' + i + 't'])}</h3>\n<p>${esc(t['tc' + i])}</p>\n`;
  h += `<h2>${esc(t.tcGiftsT)}</h2>\n`;
  for (let i = 19; i <= 22; i++) h += `<h3>${esc(t['tc' + i + 't'])}</h3>\n<p>${esc(t['tc' + i])}</p>\n<p class="ex">${esc(t['tc' + i + 'b'])}</p>\n`;
  h += `<h2>${esc(t.tcMoreT)}</h2>\n`; // v2790 : Jeux, Paris, Envoyer de l'argent, Amis & groupes, Identifiant & niveaux
  for (let i = 23; i <= 27; i++) h += `<h3>${esc(t['tc' + i + 't'])}</h3>\n<p>${esc(t['tc' + i])}</p>\n`;
  h += `<div class="box">${l === 'fr' ? 'Contact : ' : 'Contact: '}<a href="mailto:${MAIL}">${MAIL}</a></div>\n`;
  void upd;
  return h;
}

// 4) Confidentialité (8 parties courtes) et Contact, dans les 11 langues — textes dans scripts/pages-legales-textes.js.
// v2605 (propriétaire) : aucun nom de service, aucune date, rien de sensible ; tout renvoie au même e-mail.
const TXT = require('./pages-legales-textes.js');
const PRIV_KEEP = [0, 1, 2, 4, 8, 9, 11, 13]; // qui / infos / pourquoi / partage / sécurité / droits / mineurs / contact
const mailLink = '<a href="mailto:' + MAIL + '">' + MAIL + '</a>';
const fill = s => esc(s).split('{MAIL}').join(mailLink).split('{SITE}').join('<a href="https://www.orolado.com/">orolado.com</a>');
const PRIVACY = {}, CONTACT = {}, ABOUT = {};
for (const l of Object.keys(TXT.PRIVACY)) {
  const P = TXT.PRIVACY[l];
  let h = '<h1>' + esc(P.title) + '</h1>\n<p>' + esc(P.intro) + '</p>\n';
  PRIV_KEEP.forEach((k, i) => {
    const sec = P.s[k];
    h += '<h3>' + esc((i + 1) + '. ' + sec[0].replace(/^\d+\.\s*/, '')) + '</h3>\n<p>' + fill(sec[1]) + '</p>\n';
  });
  PRIVACY[l] = h;
}
for (const l of Object.keys(TXT.CONTACT)) {
  const C = TXT.CONTACT[l];
  let h = '<h1>' + esc(C.title) + '</h1>\n';
  h += '<div class="box"><b>' + esc(C.mailT) + '</b><br>' + mailLink + '</div>\n';
  h += '<div class="box"><b>' + esc(C.siteT) + '</b><br>' + fill(C.site) + '</div>\n';
  C.p.forEach(x => { h += '<p>' + fill(x) + '</p>\n'; });
  h += '<a class="go" href="https://www.orolado.com/">' + esc(C.back) + ' →</a>';
  CONTACT[l] = h;
}
for (const l of Object.keys(TXT.ABOUT || {})) {
  const Ab = TXT.ABOUT[l];
  let h = '<h1>' + esc(Ab.title) + '</h1>\n<p>' + esc(Ab.intro) + '</p>\n';
  Ab.s.forEach(sec => { h += '<h3>' + esc(sec[0]) + '</h3>\n<p>' + fill(sec[1]) + '</p>\n'; });
  ABOUT[l] = h;
}


const T = loadTerms();
const termLangs = Object.keys(T);
const render2 = (DATA) => `var DATA=${JSON.stringify(DATA)};
  function render(l){document.getElementById('main').innerHTML=DATA[l]||DATA.en}`;
const termData = {}; termLangs.forEach(l => termData[l] = termsHtml(T, l));
const out = [
  { file: 'conditions', title: 'OROLADO — Terms of Use & Risks', desc: 'OROLADO terms of use: synthetic indices trading, deposits, withdrawals, bonuses, risks and responsible gaming.', body: termData.en, langs: termLangs, script: render2(termData) },
  { file: 'confidentialite', title: 'OROLADO — Privacy Policy', desc: 'How OROLADO uses and protects your personal data.', body: PRIVACY.en, langs: termLangs, script: render2(PRIVACY) },
  { file: 'contact', title: 'OROLADO — Contact', desc: 'Contact OROLADO support: ' + MAIL, body: CONTACT.en, langs: termLangs, script: render2(CONTACT) },
  { file: 'about', title: 'OROLADO — About Us', desc: 'About OROLADO: an online entertainment and gaming platform — synthetic-indices trading, games and sports predictions.', body: ABOUT.en, langs: termLangs, script: render2(ABOUT) }
];
for (const p of out) {
  const dir = path.join(root, p.file); fs.mkdirSync(dir, { recursive: true });
  const html = page(p);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(p.file.padEnd(16), Buffer.byteLength(html), 'octets', p.langs.join(','));
}
