// Coquille commune des sites annexes (orolado.org, orolado.net, orolad0.com) : une page par langue,
// titre + description + hreflang dans la langue, page « application » qui ne défile pas.
// Utilisé par scripts/sites/construire.js. Aucun appel au serveur OROLADO : tout tourne dans le navigateur.
'use strict';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LOCALE = { en: 'en_US', fr: 'fr_FR', es: 'es_ES', pt: 'pt_BR', ar: 'ar_AR', tr: 'tr_TR', de: 'de_DE', ru: 'ru_RU', id: 'id_ID', vi: 'vi_VN', hi: 'hi_IN' };
const LANG_NAME = { en: 'English', fr: 'Français', es: 'Español', pt: 'Português', ar: 'العربية', tr: 'Türkçe', de: 'Deutsch', ru: 'Русский', id: 'Indonesia', vi: 'Tiếng Việt', hi: 'हिन्दी' };

function urlOf(site, l) { return site.origin + (l === 'en' ? '/' : '/' + l + '/'); }

/** Page complète d'une langue. body = HTML du contenu, script = code de l'application (texte). */
function page(site, l, T, body, script) {
  const rtl = l === 'ar';
  const alt = site.langs.map(x => `<link rel="alternate" hreflang="${x}" href="${urlOf(site, x)}">`).join('\n  ')
    + `\n  <link rel="alternate" hreflang="x-default" href="${urlOf(site, 'en')}">`;
  // Accueil anglais = page « x-default » : 1re visite → la langue du téléphone (si elle existe ici).
  const redirect = l !== 'en' ? '' : `<script>(function(){try{if(location.pathname!=='/'||/[?&]l=en/.test(location.search))return;var L=${JSON.stringify(site.langs)};var s=null;try{s=localStorage.getItem('site_lang')}catch(e){}var n=String(s||(navigator.languages&&navigator.languages[0])||navigator.language||'en').slice(0,2).toLowerCase();if(n!=='en'&&L.indexOf(n)>=0)location.replace('/'+n+'/')}catch(e){}})()</script>`;
  const opts = site.langs.map(x => `<option value="${x}"${x === l ? ' selected' : ''}>${esc(LANG_NAME[x])}</option>`).join('');
  const ld = {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: T.title.split(' — ')[0], url: urlOf(site, l),
    description: T.desc, inLanguage: l, applicationCategory: site.category || 'EducationalApplication', operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };
  return `<!DOCTYPE html>
<html lang="${l}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  ${redirect}
  <title>${esc(T.title)}</title>
  <meta name="description" content="${esc(T.desc)}">
  <link rel="canonical" href="${urlOf(site, l)}">
  ${alt}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(T.title)}">
  <meta property="og:description" content="${esc(T.desc)}">
  <meta property="og:url" content="${urlOf(site, l)}">
  <meta property="og:locale" content="${LOCALE[l] || 'en_US'}">
  <meta name="theme-color" content="${site.themeColor}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
  <style>${site.css}</style>
</head>
<body>
<div class="app">
  <header class="top">
    <div class="brand">${site.logo}<b>${esc(T.brand)}</b></div>
    <label class="lang"><span class="sr">${esc(T.lang || 'Language')}</span><select id="langSel" aria-label="${esc(T.lang || 'Language')}">${opts}</select></label>
  </header>
${body}
</div>
<script>
(function(){var s=document.getElementById('langSel');s.addEventListener('change',function(){var v=s.value;try{localStorage.setItem('site_lang',v)}catch(e){}location.href=v==='en'?'/?l=en':'/'+v+'/';});})();
var T=${JSON.stringify(T).replace(/</g, '\\u003c')};
${script}
</script>
</body>
</html>
`;
}

function robots(site) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`;
}

function sitemap(site, day) {
  const alts = site.langs.map(x => `    <xhtml:link rel="alternate" hreflang="${x}" href="${urlOf(site, x)}"/>`).join('\n')
    + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf(site, 'en')}"/>`;
  const urls = site.langs.map(l => `  <url>\n    <loc>${urlOf(site, l)}</loc>\n    <lastmod>${day}</lastmod>\n${alts}\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

module.exports = { esc, page, robots, sitemap, urlOf };
