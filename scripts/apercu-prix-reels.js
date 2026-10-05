// Aperçu local branché sur les VRAIS prix d'orolado.com (lecture seule, comme un visiteur).
// Fichiers du site : dossier local. feed.php / feedcache/* / WebSocket /direct : orolado.com.
const http = require('http'), https = require('https'), tls = require('tls'), fs = require('fs'), path = require('path');
const AG = new https.Agent({ keepAlive: true, maxSockets: 8 });
const ROOT = 'C:/Users/PC/OROLADO', HOST = 'orolado.com', PORT = 8093;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };
const srv = http.createServer((req, res) => {
  const u = req.url;
  if (/^\/(feed\.php|feedcache\/)/.test(u)) {
    const r2 = https.request({ host: HOST, path: u, method: 'GET', agent: AG, headers: { 'User-Agent': 'orolado-test-local', 'Accept': '*/*' } }, (pr) => {
      res.writeHead(pr.statusCode, { 'Content-Type': pr.headers['content-type'] || 'application/json', 'Cache-Control': 'no-store' });
      pr.pipe(res);
    });
    r2.on('error', () => { res.writeHead(502); res.end(); });
    r2.end();
    return;
  }
  if (/^\/(api\.php|admin)/.test(u)) { res.writeHead(404); res.end('{}'); return; }
  let p = decodeURIComponent(u.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(path.normalize(ROOT))) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(d);
  });
});
srv.on('upgrade', (req, sock, head) => {
  const up = tls.connect(443, HOST, { servername: HOST }, () => {
    let h = req.method + ' ' + req.url + ' HTTP/1.1\r\n';
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const k = req.rawHeaders[i], v = req.rawHeaders[i + 1];
      if (/^host$/i.test(k)) h += 'Host: ' + HOST + '\r\n';
      else if (/^origin$/i.test(k)) h += 'Origin: https://' + HOST + '\r\n';
      else h += k + ': ' + v + '\r\n';
    }
    up.write(h + '\r\n');
    if (head && head.length) up.write(head);
    up.pipe(sock); sock.pipe(up);
  });
  up.on('error', () => sock.destroy()); sock.on('error', () => up.destroy());
});
srv.listen(PORT, () => console.log('aperçu prix réels sur http://localhost:' + PORT));
