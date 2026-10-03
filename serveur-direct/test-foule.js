'use strict';
/*
 * Test de foule de la ligne directe (À LANCER UNIQUEMENT SUR NOTRE PROPRE SERVEUR, jamais contre
 * un hébergeur partagé). Branche N faux joueurs, écoute pendant D secondes, puis dit :
 *   - combien sont restés branchés ;
 *   - le temps entre deux prix reçus (médiane, pire 1 %, pire) : 250 ms = parfait ;
 *   - combien de « trous » de plus de 1 s (ce qui ferait un « bloc » sur l'écran).
 *
 * Usage : node test-foule.js ws://127.0.0.1:8092/direct 2000 30
 */
const net = require('net');
const tls = require('tls');
const crypto = require('crypto');

const url = new URL(process.argv[2] || 'ws://127.0.0.1:8092/direct');
const N = Number(process.argv[3] || 1000);
const D = Number(process.argv[4] || 30);
const gaps = [];
let open = 0, failed = 0, closed = 0, msgs = 0, bigGaps = 0;

function client(i) {
  const port = Number(url.port || (url.protocol === 'wss:' ? 443 : 80));
  const opts = { host: url.hostname, port, servername: url.hostname };
  const sock = url.protocol === 'wss:' ? tls.connect(opts) : net.connect(opts);
  let upgraded = false;
  let buf = Buffer.alloc(0);
  let last = 0;
  sock.on('connect', send);
  sock.on('secureConnect', send);
  function send() {
    if (sock._sent) return;
    sock._sent = true;
    const key = crypto.randomBytes(16).toString('base64');
    sock.write('GET ' + url.pathname + ' HTTP/1.1\r\nHost: ' + url.host + '\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ' + key + '\r\nSec-WebSocket-Version: 13\r\nOrigin: http://' + url.host + '\r\n\r\n');
  }
  sock.on('data', (c) => {
    buf = Buffer.concat([buf, c]);
    if (!upgraded) {
      const k = buf.indexOf('\r\n\r\n');
      if (k < 0) return;
      if (buf.slice(0, 12).toString().indexOf('101') < 0) { failed++; sock.destroy(); return; }
      upgraded = true;
      open++;
      buf = buf.slice(k + 4);
    }
    while (buf.length >= 2) {
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (buf.length < off + len) return;
      const op = buf[0] & 0x0f;
      buf = buf.slice(off + len);
      if (op !== 1) continue;
      const now = Date.now();
      msgs++;
      // On ne compte qu'une fois toute la foule arrivée (+3 s) : le régime normal.
      if (last && steady && now > steady) {
        const g = now - last;
        gaps.push(g);
        if (g > 1000) bigGaps++;
      }
      last = now;
    }
  });
  sock.on('error', () => { if (!upgraded) failed++; });
  sock.on('close', () => { if (upgraded) closed++; });
}

let started = 0;
let steady = 0;
const t0 = Date.now();
// Arrivée progressive (200 par 100 ms), comme une vraie foule qui arrive.
const iv = setInterval(() => {
  for (let k = 0; k < 200 && started < N; k++) client(started++);
  if (started >= N) { clearInterval(iv); steady = Date.now() + 3000; }
}, 100);

setTimeout(() => {
  gaps.sort((a, b) => a - b);
  const q = (p) => gaps.length ? gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * p))] : null;
  console.log(JSON.stringify({
    joueurs_demandes: N,
    branches: open,
    echecs: failed,
    coupes_pendant_test: closed,
    messages_recus: msgs,
    ecart_median_ms: q(0.5),
    ecart_pire_1pc_ms: q(0.99),
    ecart_pire_ms: gaps.length ? gaps[gaps.length - 1] : null,
    trous_plus_1s: bigGaps,
    duree_s: Math.round((Date.now() - t0) / 1000),
  }, null, 1));
  process.exit(0);
}, D * 1000);
