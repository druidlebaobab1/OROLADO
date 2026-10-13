// Fabrique les sites annexes dans sites/<id>/ (une page par langue + robots.txt + sitemap.xml + favicon.svg).
// Lancer : node scripts/sites/construire.js
'use strict';
const fs = require('fs');
const path = require('path');
const { page, robots, sitemap } = require('./coquille.js');

const ROOT = path.join(__dirname, '..', '..', 'sites');
const day = new Date().toISOString().slice(0, 10);
const SITES = ['outils', 'academie', 'quiz'].filter(id => fs.existsSync(path.join(__dirname, id + '.js')));

for (const id of SITES) {
  const { site, body, script, TXT } = require('./' + id + '.js');
  const dir = path.join(ROOT, site.id);
  fs.mkdirSync(dir, { recursive: true });
  for (const l of site.langs) {
    const T = TXT[l];
    if (!T) throw new Error(id + ' : textes manquants pour ' + l);
    for (const k of Object.keys(TXT.en)) if (T[k] === undefined) throw new Error(id + '/' + l + ' : texte « ' + k + ' » manquant');
    const out = l === 'en' ? dir : path.join(dir, l);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'index.html'), page(site, l, T, body(T, l), script));
  }
  fs.writeFileSync(path.join(dir, 'robots.txt'), robots(site));
  fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemap(site, day));
  fs.writeFileSync(path.join(dir, 'favicon.svg'), site.favicon);
  console.log(id + ' : ' + site.langs.length + ' langues → sites/' + site.id + '/');
}
