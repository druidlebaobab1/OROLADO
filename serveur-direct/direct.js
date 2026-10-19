'use strict';
/*
 * OROLADO — diffusion des prix en direct (serveur VPS).
 *
 * 1. Lance le moteur continu des prix (scripts/moteur-prix.php) et le relance tout seul s'il
 *    s'arrête (1 s plus tard).
 * 2. À chaque tick (4 fois par seconde), envoie le NOUVEAU prix des 10 marchés à tous les joueurs
 *    connectés par WebSocket (adresse /direct, derrière nginx). Message au même format que
 *    feedcache/live.json (first / p0 / d) : le site l'applique avec le même code.
 * 3. Un joueur qui se connecte reçoit d'abord les 40 derniers prix (10 s), puis les nouveaux.
 * 4. 2026-10 (55 marchés) : abonnement. Un téléphone à jour dit quels marchés il regarde
 *    (adresse /direct?s=odin,v100 puis message {"sub":[…]} quand il change de marché) et ne reçoit
 *    QUE ceux-là (en général 1 ou 2) : débit par joueur ~ le même qu'avec 10 marchés, voire moins.
 *    Un ancien téléphone (sans abonnement) reçoit les 10 marchés d'origine, exactement comme avant.
 *    Un seul moteur, une seule boucle : chaque message n'est fabriqué qu'une fois par groupe
 *    de joueurs qui regardent la même chose.
 *
 * Aucun module à installer : uniquement Node.js. Les prix et les trades restent calculés par
 * PHP (mêmes fichiers) ; ce programme ne fait que transmettre.
 *
 * Réglages (variables d'environnement) :
 *   DIRECT_PORT (8092)   DIRECT_HOST (127.0.0.1)   PHP_BIN (php)
 *   DIRECT_FAKE=1 : pas de moteur PHP, faux prix (seulement pour les tests de foule).
 */
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.DIRECT_PORT || 8092);
const HOST = process.env.DIRECT_HOST || '127.0.0.1';
const PHP = process.env.PHP_BIN || 'php';
const ROOT = path.resolve(__dirname, '..');
const MAX_CLIENTS = Number(process.env.DIRECT_MAX || 20000);
// Un joueur dont la connexion n'avale plus (plus de 256 Ko en attente) est coupé : il
// reprendra par la lecture du fichier, sans ralentir les autres.
const MAX_BUFFER = 256 * 1024;

const clients = new Set();
let snapshot = null; // dernier direct complet (40 prix par marché), envoyé aux nouveaux venus
let lastTick = {}; // dernier tick envoyé, par marché
const stats = { started: Date.now(), ticks: 0, sent: 0, bytes: 0, dropped: 0, moteurRestarts: 0, lastAt: 0, peak: 0, abonnes: 0 };
// Les 10 marchés d'origine : ce que reçoit un téléphone qui ne dit rien (ancien code).
const LEGACY = ['v100', 'stable', 'apex500', 'horizon50', 'goldtrend', 'v75', 'nexusprime', 'titanpulse', 'boomspike', 'crash300'];
const SUB_MAX = 12;
let known = new Set(LEGACY); // marchés existants (d'après le dernier direct du moteur)

/** Liste de marchés demandée par un téléphone → liste propre (connus, sans doublon, 12 au plus) ou null. */
function cleanSub(list) {
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const raw of list) {
    const id = String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (id && known.has(id) && out.indexOf(id) < 0) out.push(id);
    if (out.length >= SUB_MAX) break;
  }
  return out.length ? out.sort() : null;
}

/** Les 40 derniers prix des marchés demandés (null = les 10 d'origine), au format du direct. */
function snapshotFor(sub) {
  if (!snapshot) return null;
  const assets = {};
  for (const id of (sub || LEGACY)) if (snapshot.assets[id]) assets[id] = snapshot.assets[id];
  return JSON.stringify({ ok: true, tickMs: snapshot.tickMs, direct: 1, at: snapshot.at, rp: snapshot.rp, assets });
}

function setSub(sock, list) {
  const sub = cleanSub(list);
  if (!sub) return;
  const was = sock._sub;
  sock._sub = sub;
  sock._key = sub.join(',');
  // Nouveaux marchés : leurs 40 derniers prix tout de suite (la courbe s'affiche sans attendre).
  const fresh = was ? sub.filter((id) => was.indexOf(id) < 0) : sub;
  if (fresh.length) {
    const t = snapshotFor(fresh);
    if (t) send(sock, frame(t));
  }
}

/* ---------- Trames WebSocket (texte, sans compression) ---------- */
function frame(text) {
  const body = Buffer.from(text);
  const n = body.length;
  let head;
  if (n < 126) {
    head = Buffer.from([0x81, n]);
  } else if (n < 65536) {
    head = Buffer.alloc(4);
    head[0] = 0x81; head[1] = 126; head.writeUInt16BE(n, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2);
  }
  return Buffer.concat([head, body]);
}
const PONG_EMPTY = Buffer.from([0x8a, 0x00]);
const CLOSE = Buffer.from([0x88, 0x00]);

function send(sock, buf) {
  if (sock.destroyed) { clients.delete(sock); return; }
  if (sock.writableLength > MAX_BUFFER) {
    stats.dropped++;
    clients.delete(sock);
    sock.destroy();
    return;
  }
  sock.write(buf);
  stats.bytes += buf.length;
}

/* Lecture minimale des trames du navigateur : fermeture, ping, abonnement (texte). Le reste est ignoré. */
function onData(sock, chunk) {
  sock._in = sock._in ? Buffer.concat([sock._in, chunk]) : chunk;
  while (sock._in && sock._in.length >= 2) {
    const b = sock._in;
    const op = b[0] & 0x0f;
    let len = b[1] & 0x7f;
    let off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { sock.destroy(); return; } // jamais de gros message attendu
    const masked = (b[1] & 0x80) !== 0;
    const need = off + (masked ? 4 : 0) + len;
    if (len > 4096) { sock.destroy(); return; }
    if (b.length < need) return;
    sock._in = b.length > need ? b.subarray(need) : null;
    if (op === 0x8) { try { sock.end(CLOSE); } catch (e) { /* ignore */ } clients.delete(sock); return; }
    if (op === 0x9) send(sock, PONG_EMPTY);
    // Texte : {"sub":["odin","v100"]} (marchés regardés). Trame courte seulement (≤ 1 Ko).
    if (op === 0x1 && len <= 1024 && (b[0] & 0x80)) {
      const body = Buffer.from(b.subarray(off + (masked ? 4 : 0), need));
      if (masked) { const m = b.subarray(off, off + 4); for (let i = 0; i < body.length; i++) body[i] ^= m[i & 3]; }
      try { const j = JSON.parse(body.toString('utf8')); if (j && j.sub) setSub(sock, j.sub); } catch (e) { /* ignore */ }
    }
  }
}

/* ---------- Serveur HTTP + passage en WebSocket ---------- */
const server = http.createServer((req, res) => {
  if (req.url && req.url.indexOf('/direct/etat') === 0) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      ok: true,
      joueurs: clients.size,
      max: stats.peak,
      ticks: stats.ticks,
      abonnes: stats.abonnes,
      marches: known.size,
      envoye_mo: Math.round(stats.bytes / 1048576),
      retard_ms: stats.lastAt ? Date.now() - stats.lastAt : null,
      coupes_lents: stats.dropped,
      redemarrages_moteur: stats.moteurRestarts,
      depuis_min: Math.round((Date.now() - stats.started) / 60000),
    }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('OROLADO direct');
});

server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket' || clients.size >= MAX_CLIENTS) {
    sock.end('HTTP/1.1 503 Service Unavailable\r\n\r\n');
    return;
  }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.setNoDelay(true);
  sock.setTimeout(0);
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  clients.add(sock);
  if (clients.size > stats.peak) stats.peak = clients.size;
  // ?s=odin,v100 : téléphone à jour, il ne veut que ces marchés.
  let q = null;
  try { q = new URL(req.url, 'http://x').searchParams.get('s'); } catch (e) { q = null; }
  if (q) setSub(sock, q.split(','));
  if (!sock._sub) { const t = snapshotFor(null); if (t) send(sock, frame(t)); }
  sock.on('data', (c) => onData(sock, c));
  sock.on('close', () => clients.delete(sock));
  sock.on('error', () => { clients.delete(sock); sock.destroy(); });
});

/* ---------- Réception d'un direct complet (une ligne JSON par tick) ---------- */
function onLive(line) {
  let j;
  try { j = JSON.parse(line); } catch (e) { return; }
  if (!j || !j.ok || !j.assets) return;
  snapshot = j;
  known = new Set(Object.keys(j.assets));
  stats.ticks++;
  stats.lastAt = Date.now();
  // Seulement les prix nouveaux depuis le dernier envoi, au format first / p0 / d.
  const assets = {};
  let any = false;
  for (const id of Object.keys(j.assets)) {
    const a = j.assets[id];
    const vals = [Number(a.p0)];
    for (let i = 0; i < a.d.length; i++) vals.push(vals[i] + Number(a.d[i]));
    const lastOfFile = Number(a.first) + vals.length - 1;
    const prev = lastTick[id];
    let from = prev === undefined ? lastOfFile : prev + 1;
    if (from < Number(a.first)) from = Number(a.first);
    if (from > lastOfFile) continue;
    const slice = vals.slice(from - Number(a.first));
    const d = [];
    for (let i = 1; i < slice.length; i++) d.push(slice[i] - slice[i - 1]);
    assets[id] = { first: from, p0: slice[0], d };
    lastTick[id] = lastOfFile;
    any = true;
  }
  if (any) broadcastTick(j, assets);
}

/*
 * Envoi d'un tick : un message par GROUPE de joueurs qui regardent la même chose (fabriqué une
 * seule fois). Anciens téléphones : les 10 marchés d'origine. Un marché sans prix nouveau n'est
 * pas envoyé ; un groupe sans rien de nouveau ne reçoit rien.
 */
function broadcastTick(j, assets) {
  const cache = new Map();
  // v2813 : chaque téléphone suit aussi les marchés visibles de sa barre (« tièdes ») → beaucoup de groupes
  // différents. Le morceau de chaque marché n'est fabriqué qu'UNE fois par tick ; un groupe ne fait que
  // les assembler (plus de JSON.stringify par groupe).
  const head = '{"ok":true,"tickMs":' + Number(j.tickMs) + ',"at":' + Number(j.at) + ',"assets":{';
  const frag = {};
  for (const id of Object.keys(assets)) frag[id] = JSON.stringify(id) + ':' + JSON.stringify(assets[id]);
  let subs = 0;
  for (const s of clients) {
    const key = s._key || '';
    let buf = cache.get(key);
    if (buf === undefined) {
      const parts = [];
      for (const id of (s._sub || LEGACY)) if (frag[id]) parts.push(frag[id]);
      buf = parts.length ? frame(head + parts.join(',') + '}}') : null;
      cache.set(key, buf);
    }
    if (s._sub) subs++;
    if (buf) { send(s, buf); stats.sent++; }
  }
  stats.abonnes = subs;
}

/* ---------- Le moteur PHP (relancé tout seul) ---------- */
function startMoteur() {
  const p = spawn(PHP, [path.join(ROOT, 'scripts', 'moteur-prix.php')], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  let buf = '';
  p.stdout.setEncoding('utf8');
  p.stdout.on('data', (s) => {
    buf += s;
    let k;
    while ((k = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, k);
      buf = buf.slice(k + 1);
      if (line) onLive(line);
    }
  });
  p.on('exit', (code) => {
    stats.moteurRestarts++;
    console.error(new Date().toISOString() + ' moteur arrêté (code ' + code + '), relance dans 1 s');
    setTimeout(startMoteur, 1000);
  });
  p.on('error', (e) => console.error('moteur : ' + e.message));
}

/* Faux prix pour les tests de foule (aucun lien avec le vrai jeu). */
function startFake() {
  // DIRECT_FAKE_N : nombre de marchés simulés (10 = les marchés d'origine ; plus = ceux de indices.json).
  let ids = LEGACY.slice();
  try {
    const ext = JSON.parse(require('fs').readFileSync(path.join(ROOT, 'indices.json'), 'utf8')).indices.map((e) => e.id);
    ids = ids.concat(ext).slice(0, Math.max(1, Number(process.env.DIRECT_FAKE_N || 10)));
  } catch (e) { /* ignore */ }
  const price = {};
  ids.forEach((id, i) => { price[id] = 100000 + i * 1000; });
  setInterval(() => {
    const n = Math.floor(Date.now() / 250);
    const assets = {};
    ids.forEach((id) => {
      price[id] += Math.round((Math.random() - 0.5) * 200);
      // 40 derniers prix (comme le vrai moteur) : écarts de taille réaliste.
      const d = [];
      for (let k = 0; k < 39; k++) d.push(Math.round((Math.random() - 0.5) * 400));
      assets[id] = { first: n - 39, p0: price[id], d };
    });
    onLive(JSON.stringify({ ok: true, tickMs: 250, at: Date.now(), assets }));
  }, 250);
}

// File d'attente large : une foule qui arrive d'un coup n'est pas refusée.
server.listen({ port: PORT, host: HOST, backlog: 4096 }, () => {
  console.log('OROLADO direct : ws://' + HOST + ':' + PORT + '/direct');
  if (process.env.DIRECT_FAKE === '1') startFake();
  else startMoteur();
});

// Ping toutes les 25 s : garde les connexions ouvertes à travers Cloudflare / les box.
setInterval(() => {
  const ping = Buffer.from([0x89, 0x00]);
  for (const s of clients) send(s, ping);
}, 25000);
