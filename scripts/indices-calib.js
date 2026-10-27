'use strict';
/*
 * OROLADO — calibration des indices ajoutés (indices.json).
 *
 *   node scripts/indices-calib.js          → calcule les lignes objectif ×5 / ×10 / ×50 de chaque indice
 *                                            et durée, les écrit dans indices.json, puis refait js/indices.js
 *   node scripts/indices-calib.js --js     → refait seulement js/indices.js (après une retouche des couleurs)
 *
 * Même règle que scripts/FairCalib.cs (10 marchés d'origine) : payout de base (×1,90) = ligne au prix
 * d'entrée (50 %) ; ×5 / ×10 / ×50 = ligne placée pour que le joueur récupère 90 % de ses mises en moyenne
 * (chance de gain = 0,90 / cote). Le mouvement (en log) d'un tick est symétrique et sans mémoire : la
 * loi du mouvement sur n ticks est symétrique, donc ligne d'achat = entrée × e^q, de vente = entrée × e^−q.
 *
 * Calcul : loi exacte pour une marche simple (gaussienne) ; sinon tirage de 1 000 000 de mouvements par
 * durée (nombre de pauses, de ticks larges et de pics tirés au sort, puis le mouvement). Vérification
 * indépendante, avec le VRAI générateur du serveur : php scripts/test-indices.php.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEF = path.join(ROOT, 'indices.json');
const JS = path.join(ROOT, 'js', 'indices.js');
const DURATIONS = [5, 10, 30, 60, 300, 600];
const MULTS = [5, 10, 50];
const RTP = 0.90;
const SAMPLES = Number(process.env.CALIB_SAMPLES || 1000000);

/* Générateur reproductible (sfc32) + gaussienne (Box-Muller). */
function rng(seed) {
  let a = 0x9E3779B9 ^ seed, b = 0x243F6A88, c = 0xB7E15162 ^ (seed * 31), d = 1;
  function u32() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return t >>> 0;
  }
  for (let i = 0; i < 20; i++) u32();
  const U = () => ((u32() >>> 5) * 67108864 + (u32() >>> 6) + 0.5) / 9007199254740992;
  let spare = NaN;
  const Z = () => {
    if (spare === spare) { const s = spare; spare = NaN; return s; }
    const u = U(), v = U(), m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  };
  return { U, Z };
}

/* Nombre de succès sur n essais de chance p. Exact pour n ≤ 400 ou p petit ; loi normale sinon. */
function binom(r, n, p) {
  if (p <= 0 || n <= 0) return 0;
  if (p >= 1) return n;
  if (n <= 400) {
    let k = 0;
    for (let i = 0; i < n; i++) if (r.U() < p) k++;
    return k;
  }
  if (n * p < 40) {
    // Sauts géométriques (exact).
    const lq = Math.log(1 - p);
    let k = 0, pos = -1;
    for (;;) {
      pos += 1 + Math.floor(Math.log(r.U()) / lq);
      if (pos >= n) return k;
      k++;
    }
  }
  const k = Math.round(n * p + Math.sqrt(n * p * (1 - p)) * r.Z());
  return Math.max(0, Math.min(n, k));
}

function invNorm(p) {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577509590705e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  let q, r;
  if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function round9(x) { return Math.round(x * 1e9) / 1e9; }

/*
 * Le serveur applique les mouvements en LOG (prix × e^x, voir orolado_feed_step_ext) : les quantiles
 * q ci-dessus sont des mouvements de log. Ligne d'achat = entrée × e^q, de vente = entrée × e^−q ;
 * la table garde la forme des 10 marchés d'origine (ligne = entrée × (1 + valeur)).
 */
function logRows(q5, q10, q50) {
  return [0, Math.expm1(q5), Math.expm1(q10), Math.expm1(q50), Math.expm1(-q5), Math.expm1(-q10), Math.expm1(-q50)].map(round9);
}

function fairRows(m, seed) {
  const out = {};
  const plain = !(m.hold > 0) && !(m.wideP > 0) && !(m.jumpP > 0);
  const r = rng(seed);
  for (const dur of DURATIONS) {
    const n = dur * 1000 / 250;
    const row = [0, 0, 0, 0, 0, 0, 0];
    if (plain) {
      const sd = m.sigma * Math.sqrt(n);
      MULTS.forEach((mult, i) => { row[i + 1] = sd * invNorm(1 - RTP / mult); });
    } else {
      const abs = new Float64Array(SAMPLES);
      const k2 = (m.wideK || 1) * (m.wideK || 1);
      for (let s = 0; s < SAMPLES; s++) {
        const moving = binom(r, n, 1 - (m.hold || 0));
        const wide = binom(r, moving, m.wideP || 0);
        let x = m.sigma * Math.sqrt((moving - wide) + wide * k2) * r.Z();
        const jumps = binom(r, n, m.jumpP || 0);
        for (let j = 0; j < jumps; j++) {
          const size = m.jumpMin + (m.jumpMax - m.jumpMin) * r.U();
          x += r.U() < 0.5 ? -size : size;
        }
        abs[s] = Math.abs(x);
      }
      abs.sort();
      MULTS.forEach((mult, i) => {
        // P(X > q) = p  ⇔  P(|X| > q) = 2p (loi symétrique).
        const pos = (1 - 2 * RTP / mult) * (SAMPLES - 1);
        const k = Math.floor(pos), f = pos - k;
        row[i + 1] = abs[k] * (1 - f) + abs[Math.min(SAMPLES - 1, k + 1)] * f;
      });
    }
    out[String(dur)] = logRows(row[1], row[2], row[3]);
  }
  return out;
}

function writeJs(doc) {
  const data = doc.indices.map((e) => ({
    id: e.id, name: e.name, tag: e.tag, base: e.base, model: e.model, look: e.look,
    accent: e.accent, glyph: e.glyph, planet: e.planet, fair: e.fair,
  }));
  const src = fs.readFileSync(JS, 'utf8');
  const a = src.indexOf('/*DATA*/');
  const b = src.indexOf('/*END DATA*/');
  if (a < 0 || b < a) throw new Error('js/indices.js : repères /*DATA*/ … /*END DATA*/ absents');
  const out = src.slice(0, a) + '/*DATA*/' + JSON.stringify(data) + src.slice(b);
  fs.writeFileSync(JS, out);
}

const doc = JSON.parse(fs.readFileSync(DEF, 'utf8'));
if (process.argv.indexOf('--js') < 0) {
  const t0 = Date.now();
  const ONLY_MISSING = process.argv.indexOf('--missing') >= 0;
  doc.indices.forEach((e, i) => {
    if (ONLY_MISSING && e.fair && e.fair['5'] && e.fair['5'].length) return; // garde les tables déjà calibrées (anciens indices verrouillés)
    e.fair = fairRows(e.model, 20261018 + i * 7919);
    process.stdout.write(e.id + ' ');
  });
  process.stdout.write('\n' + doc.indices.length + ' indices calibrés en ' + Math.round((Date.now() - t0) / 1000) + ' s\n');
  fs.writeFileSync(DEF, JSON.stringify(doc, null, 1) + '\n');
}
writeJs(doc);
console.log('js/indices.js refait');
