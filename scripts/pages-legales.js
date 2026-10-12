// Fabrique les pages publiques Conditions / Confidentialité / Contact (demandées par les prestataires de paiement) :
//   conditions/index.html    — les conditions d'utilisation du site, dans les 11 langues (textes pris dans js/i18n.js)
//   confidentialite/index.html — politique de confidentialité (français + anglais)
//   contact/index.html        — comment joindre OROLADO (français + anglais)
// Lancer : node scripts/pages-legales.js   (à relancer après chaque changement des conditions dans js/i18n.js)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.dirname(__dirname);
const MAJ = { fr: '12 octobre 2026', en: 'October 12, 2026' };
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
  const files = [...html.matchAll(/<script[^>]+src="(js\/[^"?]+)/g)].map(m => m[1]).filter(s => /i18n|learn-txt/i.test(s));
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  const I = ctx.D6.I18N, out = {};
  const keys = ['termsTitle', 'tcGiftsT'];
  for (let i = 1; i <= 22; i++) { keys.push('tc' + i + 't', 'tc' + i); if (i >= 19) keys.push('tc' + i + 'b'); }
  for (const c of ['en', 'fr', 'es', 'pt', 'ar', 'tr', 'de', 'ru', 'id', 'vi', 'hi']) {
    I.set(c); if (I.lang !== c) throw new Error('langue absente : ' + c);
    out[c] = {}; for (const k of keys) out[c][k] = String(I.t(k) || '').replace(/[⁦-⁩]/g, '').replace(/\$\s+(?=\d)/g, '$');
  }
  return out;
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const NAMES = { en: 'English', fr: 'Français', es: 'Español', pt: 'Português', ar: 'العربية', tr: 'Türkçe', de: 'Deutsch', ru: 'Русский', id: 'Bahasa Indonesia', vi: 'Tiếng Việt', hi: 'हिन्दी' };
const NAV = {
  fr: { terms: 'Conditions', privacy: 'Confidentialité', contact: 'Contact', back: 'Aller sur OROLADO', upd: 'Dernière mise à jour : ' + MAJ.fr },
  en: { terms: 'Terms', privacy: 'Privacy', contact: 'Contact', back: 'Go to OROLADO', upd: 'Last updated: ' + MAJ.en }
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
  <link rel="icon" href="/icons/favicon-blanc-48.png" sizes="48x48" type="image/png">
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
  <a class="brand" href="https://www.orolado.com/"><img src="/icons/logo-ring.svg" alt="" width="34" height="34">OROLADO</a>
  <nav class="tabs">
    <a href="/conditions/"${file === 'conditions' ? ' class="on"' : ''} data-t="terms">Terms</a>
    <a href="/confidentialite/"${file === 'confidentialite' ? ' class="on"' : ''} data-t="privacy">Privacy</a>
    <a href="/contact/"${file === 'contact' ? ' class="on"' : ''} data-t="contact">Contact</a>
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
  let h = `<h1>${esc(t.termsTitle)}</h1>\n<p class="upd">${esc(l === 'fr' ? NAV.fr.upd : NAV.en.upd)}</p>\n`;
  for (let i = 1; i <= 18; i++) h += `<h3>${esc(t['tc' + i + 't'])}</h3>\n<p>${esc(t['tc' + i])}</p>\n`;
  h += `<h2>${esc(t.tcGiftsT)}</h2>\n`;
  for (let i = 19; i <= 22; i++) h += `<h3>${esc(t['tc' + i + 't'])}</h3>\n<p>${esc(t['tc' + i])}</p>\n<p class="ex">${esc(t['tc' + i + 'b'])}</p>\n`;
  h += `<div class="box">${l === 'fr' ? 'Contact : ' : 'Contact: '}<a href="mailto:${MAIL}">${MAIL}</a></div>\n`;
  void upd;
  return h;
}

// 4) Confidentialité et Contact (français + anglais).
const PRIVACY = {
  fr: `<h1>Politique de confidentialité</h1>
<p class="upd">${NAV.fr.upd}</p>
<p>Cette page explique quelles données OROLADO (orolado.com) utilise, pourquoi, et quels sont vos droits.</p>
<h3>1. Données que nous utilisons</h3>
<ul>
<li><b>Compte</b> : adresse e-mail, nom d’affichage, numéro de joueur ; si vous vous connectez avec Google, votre adresse e-mail et votre nom Google.</li>
<li><b>Opérations</b> : dépôts, retraits, trades, bonus et soldes (démo et réel).</li>
<li><b>Retraits</b> : les coordonnées nécessaires pour vous payer (par exemple un numéro de Mobile Money ou une adresse de portefeuille crypto).</li>
<li><b>Sécurité</b> : adresse IP, type d’appareil et de navigateur, dates de connexion, pour protéger les comptes et éviter la fraude.</li>
<li><b>Vérification d’identité</b> : si nous vous demandons une pièce d’identité avant un retrait (voir les Conditions, article 10), elle sert uniquement à cette vérification.</li>
</ul>
<h3>2. Pourquoi</h3>
<p>Pour créer et gérer votre compte, exécuter vos trades, créditer vos dépôts, payer vos retraits, vous envoyer les e-mails utiles (codes, informations sur votre compte), protéger le site contre la fraude et le blanchiment d’argent, et respecter nos obligations légales.</p>
<h3>3. Avec qui</h3>
<p>Vos données ne sont <b>jamais vendues</b>. Elles sont seulement transmises aux prestataires techniques qui font fonctionner le site : hébergement et base de données (Hostinger, Supabase), sécurité du site (Cloudflare), envoi des e-mails (Brevo), connexion avec Google (Google), paiements (par exemple Flutterwave, OxaPay, Maketou), et mesure de nos publicités (Meta / Facebook). Chacun ne reçoit que ce qui lui est nécessaire.</p>
<h3>4. Cookies et stockage du téléphone</h3>
<p>Le site enregistre dans votre navigateur ce qui est nécessaire à son fonctionnement (connexion, langue, réglages, historique récent). Un outil de mesure publicitaire (pixel Meta) peut aussi être chargé pour savoir si nos publicités fonctionnent.</p>
<h3>5. Durée de conservation</h3>
<p>Les données sont gardées tant que le compte est actif, puis le temps exigé par la loi pour les opérations financières.</p>
<h3>6. Vos droits</h3>
<p>Vous pouvez demander à consulter, corriger ou supprimer vos données, ou fermer votre compte, depuis la rubrique « Aide » du site ou par e-mail à <a href="mailto:${MAIL}">${MAIL}</a>. Certaines données d’opérations doivent être conservées quand la loi l’exige.</p>
<h3>7. Mineurs</h3>
<p>OROLADO est réservé aux personnes de 18 ans et plus. Nous fermons tout compte ouvert par un mineur.</p>
<h3>8. Sécurité</h3>
<p>Connexions chiffrées (HTTPS), mots de passe jamais stockés en clair, accès aux données limité.</p>
<h3>9. Modifications</h3>
<p>Cette politique peut évoluer ; la date de mise à jour est indiquée en haut de la page.</p>`,
  en: `<h1>Privacy Policy</h1>
<p class="upd">${NAV.en.upd}</p>
<p>This page explains what data OROLADO (orolado.com) uses, why, and what your rights are.</p>
<h3>1. Data we use</h3>
<ul>
<li><b>Account</b>: e-mail address, display name, player number; if you sign in with Google, your Google e-mail address and name.</li>
<li><b>Operations</b>: deposits, withdrawals, trades, bonuses and balances (demo and real).</li>
<li><b>Withdrawals</b>: the details needed to pay you (for example a Mobile Money number or a crypto wallet address).</li>
<li><b>Security</b>: IP address, device and browser type, sign-in dates, to protect accounts and prevent fraud.</li>
<li><b>Identity check</b>: if we ask for an identity document before a withdrawal (see the Terms, Article 10), it is used only for that check.</li>
</ul>
<h3>2. Why</h3>
<p>To create and manage your account, execute your trades, credit your deposits, pay your withdrawals, send you useful e-mails (codes, account information), protect the site against fraud and money laundering, and meet our legal obligations.</p>
<h3>3. Who we share it with</h3>
<p>Your data is <b>never sold</b>. It is only shared with the technical providers that run the site: hosting and database (Hostinger, Supabase), site security (Cloudflare), e-mail delivery (Brevo), Google sign-in (Google), payments (for example Flutterwave, OxaPay, Maketou), and advertising measurement (Meta / Facebook). Each one only receives what it needs.</p>
<h3>4. Cookies and device storage</h3>
<p>The site stores in your browser what it needs to work (sign-in, language, settings, recent history). An advertising measurement tool (Meta pixel) may also be loaded to know whether our ads work.</p>
<h3>5. Retention</h3>
<p>Data is kept while the account is active, then for the period required by law for financial operations.</p>
<h3>6. Your rights</h3>
<p>You can ask to access, correct or delete your data, or close your account, from the “Help” section of the site or by e-mail at <a href="mailto:${MAIL}">${MAIL}</a>. Some operation records must be kept when the law requires it.</p>
<h3>7. Minors</h3>
<p>OROLADO is only for people aged 18 and over. We close any account opened by a minor.</p>
<h3>8. Security</h3>
<p>Encrypted connections (HTTPS), passwords never stored in plain text, limited access to data.</p>
<h3>9. Changes</h3>
<p>This policy may change; the update date is shown at the top of this page.</p>`
};
const CONTACT = {
  fr: `<h1>Contact</h1>
<p class="upd">${NAV.fr.upd}</p>
<div class="box"><b>E-mail du support</b><br><a href="mailto:${MAIL}">${MAIL}</a></div>
<div class="box"><b>Sur le site</b><br>Connectez-vous sur <a href="https://www.orolado.com/">orolado.com</a>, puis ouvrez la rubrique « Aide ».</div>
<p>Nous répondons en français et en anglais, dans les plus brefs délais. Pour une question sur un dépôt ou un retrait, indiquez votre numéro de joueur (ORO-…) et la date de l’opération. Ne nous envoyez jamais votre mot de passe.</p>
<p>Partenaires et prestataires de paiement : écrivez à la même adresse.</p>
<a class="go" href="https://www.orolado.com/">${NAV.fr.back} →</a>`,
  en: `<h1>Contact</h1>
<p class="upd">${NAV.en.upd}</p>
<div class="box"><b>Support e-mail</b><br><a href="mailto:${MAIL}">${MAIL}</a></div>
<div class="box"><b>On the site</b><br>Sign in at <a href="https://www.orolado.com/">orolado.com</a>, then open the “Help” section.</div>
<p>We reply in English and French as quickly as possible. For a question about a deposit or a withdrawal, please give your player number (ORO-…) and the date of the operation. Never send us your password.</p>
<p>Partners and payment providers: please write to the same address.</p>
<a class="go" href="https://www.orolado.com/">${NAV.en.back} →</a>`
};

const T = loadTerms();
const termLangs = Object.keys(T);
const render2 = (DATA) => `var DATA=${JSON.stringify(DATA)};
  function render(l){document.getElementById('main').innerHTML=DATA[l]||DATA.en}`;
const termData = {}; termLangs.forEach(l => termData[l] = termsHtml(T, l));
const out = [
  { file: 'conditions', title: 'OROLADO — Terms of Use & Risks', desc: 'OROLADO terms of use: synthetic indices trading, deposits, withdrawals, bonuses, risks and responsible gaming.', body: termData.en, langs: termLangs, script: render2(termData) },
  { file: 'confidentialite', title: 'OROLADO — Privacy Policy', desc: 'How OROLADO uses and protects your personal data.', body: PRIVACY.en, langs: ['en', 'fr'], script: render2(PRIVACY) },
  { file: 'contact', title: 'OROLADO — Contact', desc: 'Contact OROLADO support: ' + MAIL, body: CONTACT.en, langs: ['en', 'fr'], script: render2(CONTACT) }
];
for (const p of out) {
  const dir = path.join(root, p.file); fs.mkdirSync(dir, { recursive: true });
  const html = page(p);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(p.file.padEnd(16), Buffer.byteLength(html), 'octets', p.langs.join(','));
}
