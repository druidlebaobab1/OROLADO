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
const stats = { started: Date.now(), ticks: 0, sent: 0, dropped: 0, moteurRestarts: 0, lastAt: 0, peak: 0 };

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
}

function broadcast(text) {
  const buf = frame(text);
  for (const s of clients) send(s, buf);
  stats.sent += clients.size;
}

/* Lecture minimale des trames du navigateur : fermeture, ping. Le reste est ignoré. */
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
  if (snapshot) send(sock, frame(snapshot));
  sock.on('data', (c) => onData(sock, c));
  sock.on('close', () => clients.delete(sock));
  sock.on('error', () => { clients.delete(sock); sock.destroy(); });
});

/* ---------- Réception d'un direct complet (une ligne JSON par tick) ---------- */
function onLive(line) {
  let j;
  try { j = JSON.parse(line); } catch (e) { return; }
  if (!j || !j.ok || !j.assets) return;
  snapshot = line;
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
  if (any) broadcast(JSON.stringify({ ok: true, tickMs: j.tickMs, at: j.at, assets }));
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
  const ids = ['v100', 'stable', 'v75', 'boomspike', 'apex888', 'horizon50', 'titan', 'crash300', 'pulse25', 'apocalypse'];
  const price = {};
  ids.forEach((id, i) => { price[id] = 100000 + i * 1000; });
  setInterval(() => {
    const n = Math.floor(Date.now() / 250);
    const assets = {};
    ids.forEach((id) => {
      price[id] += Math.round((Math.random() - 0.5) * 200);
      assets[id] = { first: n - 39, p0: price[id], d: new Array(39).fill(0) };
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
