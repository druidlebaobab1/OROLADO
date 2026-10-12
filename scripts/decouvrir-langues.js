// Même travail que scripts/decouvrir-langues.php (version Node, si PHP ne démarre pas sur le PC).
// Lancer : node scripts/decouvrir-langues.js
const fs = require('fs'), path = require('path');
const root = path.dirname(__dirname);
let src = fs.readFileSync(path.join(root, 'scripts/decouvrir-source-fr.html'), 'utf8').replace(/\r\n/g, '\n');
const lines = fs.readFileSync(path.join(root, 'scripts/decouvrir-langues.txt'), 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
const langs = lines.shift().split('||');
const rows = lines.map((l, i) => { const c = l.split('||'); if (c.length !== langs.length) throw new Error('Ligne ' + (i + 2) + ' : ' + c.length + ' colonnes'); return c; });
rows.sort((a, b) => Buffer.byteLength(b[0]) - Buffer.byteLength(a[0]));
const names = { en: 'English', fr: 'Français', es: 'Español', pt: 'Português', ar: 'العربية', tr: 'Türkçe', de: 'Deutsch', ru: 'Русский', id: 'Bahasa Indonesia', vi: 'Tiếng Việt', hi: 'हिन्दी' };
const locales = { en: 'en-US', fr: 'fr-FR', es: 'es-ES', pt: 'pt-BR', ar: 'ar-u-nu-latn', tr: 'tr-TR', de: 'de-DE', ru: 'ru-RU', id: 'id-ID', vi: 'vi-VN', hi: 'hi-IN' };
const order = ['en', 'fr', 'es', 'pt', 'ar', 'tr', 'de', 'ru', 'id', 'vi', 'hi'];
const url = l => 'https://orolado.online/decouvrir/' + (l === 'en' ? '' : l + '/');
const rep = (h, a, b) => h.split(a).join(b);
let alt = order.map(l => `  <link rel="alternate" hreflang="${l}" href="${url(l)}">`).join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${url('en')}">`;
const css = `    /* Sélecteur de langue */
    .lang{display:inline-flex;align-items:center;gap:4px;margin-left:auto;border:1px solid var(--line);border-radius:10px;padding:0 4px 0 8px;background:rgba(255,255,255,.05);color:var(--txt);font-size:14px}
    .lang select{background:transparent;color:var(--txt);border:0;font:700 13px "Plus Jakarta Sans",system-ui,sans-serif;padding:8px 2px;max-width:112px;outline:none}
    .lang option{color:#111}
    [dir=rtl] .tape,[dir=rtl] .live svg,[dir=rtl] .tk .p{direction:ltr}
    [dir=rtl] .lang{margin-left:0;margin-right:auto}
    @media (max-width:420px){ .lang select{max-width:78px} }
`;
for (const l of order) {
  const k = langs.indexOf(l);
  let h = src; const miss = [];
  if (l !== 'fr') for (const r of rows) { if (!h.includes(r[0])) { miss.push(r[0]); continue; } h = rep(h, r[0], r[k]); }
  h = rep(h, "'fr-FR'", "'" + locales[l] + "'");
  h = rep(h, "Intl.DisplayNames(['fr']", "Intl.DisplayNames(['" + l + "']");
  h = rep(h, '"inLanguage":"fr"', '"inLanguage":"' + l + '"');
  h = rep(h, '<html lang="fr">', '<html lang="' + l + '"' + (l === 'ar' ? ' dir="rtl"' : '') + '>');
  h = rep(h, '<link rel="canonical" href="https://orolado.online/decouvrir/">', `<link rel="canonical" href="${url(l)}">\n` + alt);
  h = rep(h, '<meta property="og:url" content="https://orolado.online/decouvrir/">', `<meta property="og:url" content="${url(l)}">`);
  if (!h.includes("    @media (max-width:860px){\n      .hero{")) throw new Error('CSS non posé ' + l);
  h = rep(h, "    @media (max-width:860px){\n      .hero{", css + "    @media (max-width:860px){\n      .hero{");
  const opts = order.map(o => `<option value="${url(o)}"${o === l ? ' selected' : ''}>${names[o]}</option>`).join('');
  const sel = `<label class="lang" title="Language"><span aria-hidden="true">🌐</span><select aria-label="Language" onchange="try{localStorage.setItem('oroLangPick',this.value)}catch(e){}location.href=this.value">${opts}</select></label>\n    `;
  const re = /(<header>\s*<div class="wrap nav">\s*<a class="brand"[^\n]*\n\s*)/;
  if (!re.test(h)) throw new Error('Sélecteur non posé ' + l);
  h = h.replace(re, (m) => m + sel);
  if (l === 'en') {
    const others = JSON.stringify(order.filter(x => x !== 'en'));
    const auto = `<script>(function(){try{if(localStorage.getItem('oroLangPick')||/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent))return;var L=${others},n=String((navigator.languages&&navigator.languages[0])||navigator.language||'').slice(0,2).toLowerCase();if(L.indexOf(n)>=0)location.replace('/decouvrir/'+n+'/'+location.search+location.hash);}catch(e){}})();</script>\n`;
    h = rep(h, '  <meta charset="UTF-8">\n', '  <meta charset="UTF-8">\n  ' + auto);
  }
  const dir = path.join(root, 'decouvrir', l === 'en' ? '' : l);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), h);
  const left = l === 'fr' ? [] : rows.filter(r => r[0] !== r[k] && h.includes(r[0])).map(r => r[0].slice(0, 40));
  console.log(l.padEnd(3), String(Buffer.byteLength(h)).padStart(7), 'octets', miss.length ? '| absentes : ' + miss.length : '', left.length ? '| NON traduites : ' + left.join(' / ') : '');
}
