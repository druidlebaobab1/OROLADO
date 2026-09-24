const CACHE = 'orolado-v2019';
const ASSETS = [
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
  // Ne jamais intercepter HTML / CSS / JS : un fallback HTML-as-CSS gèle tous les clics.
  if (req.mode === 'navigate' || /\.(?:html|css|js)(?:\?|$)/i.test(url)) return;
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
