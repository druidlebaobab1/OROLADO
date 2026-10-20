#!/usr/bin/env node
// 2026-10-20 (vieux Android) — TRADUCTIONS DÉCOUPÉES PAR LANGUE.
// Avant : index.html chargeait les 12 langues à chaque visite (js/translations.js + js/i18n-zh.js + js/i18n.js ≈ 860 Ko).
// Maintenant : js/i18n/core.js (la logique : t(), msg(), choix de la langue…) charge seulement l'anglais (secours de t())
// + la langue du joueur : js/i18n/<langue>.js.
//
// On continue de modifier les textes au même endroit : js/translations.js, js/i18n-zh.js, js/i18n-src.js (l'ancien
// js/i18n.js, plus chargé par le site) ; la logique du noyau est dans scripts/i18n-core.js.
// Ce script exécute ces sources comme le navigateur, prend le dictionnaire FINAL (tous les blocs ajoutés, espaces
// insécables compris) et écrit js/i18n/*.js. Il met aussi à jour « js/i18n/core.js?v=… » dans index.html.
//
// À LANCER APRÈS CHAQUE MODIFICATION DES TRADUCTIONS :  node scripts/gen-i18n.js   (puis php scripts/gen-lang.php)
// Vérifier sans rien écrire :                          node scripts/gen-i18n.js --check   (code 1 = à refaire)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const root = path.dirname(__dirname);
const SRC = ['js/translations.js', 'js/i18n-zh.js', 'js/i18n-src.js'];
const CORE_TPL = 'scripts/i18n-core.js';
const OUT_DIR = 'js/i18n';
const check = process.argv.includes('--check');

function die(m) { console.error('gen-i18n : ' + m); process.exit(2); }

// 1) Les sources, exécutées comme dans le navigateur (fenêtre / document / stockage minimaux).
function runSources() {
  const store = {}, sess = {};
  const el = () => ({ setAttribute() {}, getAttribute() { return null; }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, style: {} });
  const document = { documentElement: el(), querySelectorAll() { return []; }, querySelector() { return null; }, getElementById() { return null; }, addEventListener() {}, dispatchEvent() {}, createElement: el, readyState: 'complete' };
  const ctx = { console, document, navigator: { language: 'en', languages: ['en'], userAgent: 'node' }, location: { search: '', hostname: 'orolado.com', href: 'https://orolado.com/' },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    sessionStorage: { getItem: k => (k in sess ? sess[k] : null), setItem: (k, v) => { sess[k] = String(v); }, removeItem: k => { delete sess[k]; } },
    setTimeout: () => 0, clearTimeout() {}, fetch: () => new Promise(() => {}), Event: function () {}, CustomEvent: function () {}, URLSearchParams, Intl };
  ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  const anchor = '\n  D6.I18N = {';
  for (const f of SRC) {
    let code = fs.readFileSync(path.join(root, f), 'utf8');
    if (f === 'js/i18n-src.js') {
      if (code.split(anchor).length !== 2) die('repère « D6.I18N = { » introuvable (ou en double) dans ' + f);
      // On récupère les tables internes juste avant la fin du fichier (dictionnaire final).
      code = code.replace(anchor, '\n  D6.__I18N_BUILD = { DICT: DICT, MSG_FR: MSG_FR, MSG_FR_PATTERNS: MSG_FR_PATTERNS, MSG_LANGS: MSG_LANGS, SHORT_TABLE: SHORT_TABLE, SHORT_OF: SHORT_OF, SHORT_RAW: SHORT_RAW };' + anchor);
    }
    vm.runInContext(code, ctx, { filename: f });
  }
  const b = ctx.D6.__I18N_BUILD;
  if (!b || !ctx.D6.I18N) die('les sources n’ont pas construit D6.I18N');
  return { b, I: ctx.D6.I18N, LANGS: ctx.D6.LANGS };
}

const { b, I, LANGS } = runSources();
// Copie « propre » (hors du contexte vm) des données.
const J = o => JSON.parse(JSON.stringify(o));
const DICT = J(b.DICT);
const codes = Object.keys(DICT);
const langs = J(LANGS);
if (!DICT.en) die('pas de dictionnaire anglais');
if (langs.map(l => l.code).sort().join() !== codes.slice().sort().join()) die('D6.LANGS (' + langs.map(l => l.code) + ') ≠ langues du dictionnaire (' + codes + ')');
for (const l of codes) for (const k of Object.keys(DICT[l])) if (typeof DICT[l][k] !== 'string') die('valeur non texte : ' + l + '.' + k);

// 2) Un fichier par langue : l'anglais complet ; les autres = seulement ce qui diffère de l'anglais
//    (t() retombe sur l'anglais : même résultat, beaucoup moins d'octets).
const en = DICT.en;
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const esc = s => s.split(LS).join('\\u2028').split(PS).join('\\u2029');
const out = {};
const files = {};
for (const l of codes) {
  const d = {};
  for (const k of Object.keys(DICT[l])) if (l === 'en' || !Object.prototype.hasOwnProperty.call(en, k) || DICT[l][k] !== en[k]) d[k] = DICT[l][k];
  const body = '/* Fichier généré par scripts/gen-i18n.js — ne pas modifier à la main (textes : js/i18n-src.js, js/translations.js, js/i18n-zh.js). */\n' +
    "window.D6=window.D6||{};D6.I18N_DICT=D6.I18N_DICT||{};D6.I18N_DICT['" + l + "']=" + esc(JSON.stringify(d)) + ';\n';
  out[OUT_DIR + '/' + l + '.js'] = body;
  files[l] = crypto.createHash('sha256').update(body).digest('hex').slice(0, 10);
}

// 3) Le noyau : logique (scripts/i18n-core.js) + petites tables communes (messages du serveur en français, notifications courtes).
const allKeys = new Set(); codes.forEach(l => Object.keys(DICT[l]).forEach(k => allKeys.add(k)));
const extraKeys = [...allKeys].filter(k => !Object.prototype.hasOwnProperty.call(en, k));
const shortFr = {};
for (const k of Object.keys(b.SHORT_OF)) if (DICT.fr && Object.prototype.hasOwnProperty.call(DICT.fr, k)) shortFr[k] = DICT.fr[k];
const BUILD = {
  langs, files,
  msgFr: J(b.MSG_FR),
  msgFrPatterns: b.MSG_FR_PATTERNS.map(p => { const r = [p[0].source, p[0].flags, p[1]]; if (p.length > 2) r.push(p[2]); return r; }),
  msgLangs: J(b.MSG_LANGS), shortTable: J(b.SHORT_TABLE), shortOf: J(b.SHORT_OF), shortRaw: J(b.SHORT_RAW), shortFr, extraKeys
};
const tpl = fs.readFileSync(path.join(root, CORE_TPL), 'utf8');
if (tpl.split('/*@@BUILD@@*/').length !== 2) die('repère /*@@BUILD@@*/ absent de ' + CORE_TPL);
const core = '/* Fichier généré par scripts/gen-i18n.js depuis scripts/i18n-core.js — ne pas modifier à la main. */\n' +
  tpl.replace('/*@@BUILD@@*/', () => 'var B = ' + esc(JSON.stringify(BUILD)) + ';');
out[OUT_DIR + '/core.js'] = core;
const coreV = crypto.createHash('sha256').update(core).digest('hex').slice(0, 10);

// 4) Contrôle : pour chaque langue et chaque clé, t() reconstruit = t() des sources (même texte, même repli).
const ok = v => v != null && v !== '';
for (const l of codes) {
  I.set(l);
  if (I.lang !== l) die('langue refusée par les sources : ' + l);
  const L = l === 'en' ? null : JSON.parse(out[OUT_DIR + '/' + l + '.js'].split("']=")[1].replace(/;\n$/, ''));
  for (const k of allKeys) {
    const v = L && ok(L[k]) && Object.prototype.hasOwnProperty.call(L, k) ? L[k] : (ok(en[k]) ? en[k] : k);
    if (v !== I.t(k)) die('écart ' + l + '.' + k);
  }
}

// 5) index.html : adresse du noyau versionnée par son contenu.
const idxPath = path.join(root, 'index.html');
const idx = fs.readFileSync(idxPath, 'utf8');
const re = /(<script src="js\/i18n\/core\.js\?v=)([^"]*)("><\/script>)/;
if (!re.test(idx)) die('index.html ne charge pas js/i18n/core.js');
const idxNew = idx.replace(re, (m, a, v, c) => a + coreV + c);

let stale = 0;
const want = new Set(Object.keys(out).map(f => path.join(root, f)));
for (const [f, c] of Object.entries(out)) {
  const p = path.join(root, f);
  if ((fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null) === c) continue;
  stale++;
  if (check) { console.log('À refaire : ' + f); continue; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, c);
  console.log('Écrit : ' + f + ' (' + Buffer.byteLength(c) + ' o)');
}
for (const f of fs.existsSync(path.join(root, OUT_DIR)) ? fs.readdirSync(path.join(root, OUT_DIR)) : []) {
  const p = path.join(root, OUT_DIR, f);
  if (!/\.js$/.test(f) || want.has(p)) continue;
  stale++;
  if (check) { console.log('En trop : ' + OUT_DIR + '/' + f); continue; }
  fs.unlinkSync(p); console.log('Supprimé : ' + OUT_DIR + '/' + f);
}
if (idxNew !== idx) {
  stale++;
  if (check) console.log('À refaire : index.html (js/i18n/core.js?v=' + coreV + ')');
  else { fs.writeFileSync(idxPath, idxNew); console.log('Écrit : index.html (js/i18n/core.js?v=' + coreV + ') — lancez maintenant : php scripts/gen-lang.php'); }
}
if (check) { console.log(stale ? 'PAS À JOUR : lancez node scripts/gen-i18n.js' : 'OK : traductions à jour'); process.exit(stale ? 1 : 0); }
console.log(stale ? 'Terminé (' + stale + ' fichier(s)).' : 'Rien à changer.');
