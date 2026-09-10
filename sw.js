const CACHE = 'orolado-v102';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './pay-blank.html',
  './pay-done.html'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = req.url || '';
  // HTML / CSS / JS : toujours réseau d'abord (évite cache Android cassé).
  var isShell = /\.(?:html|css|js)(?:\?|$)/i.test(url) || /\/$/.test(url.split('?')[0]);
  if (isShell) {
    event.respondWith(
      fetch(req).then(function (res) {
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }
  event.respondWith(
    fetch(req).then(function (res) {
      if (!res || res.status !== 200 || url.indexOf('http') !== 0) return res;
      var copy = res.clone();
      caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req);
    })
  );
});
