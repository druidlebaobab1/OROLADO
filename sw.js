const CACHE = 'orolado-v38';
const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/config.js',
  './js/i18n.js',
  './js/store.js',
  './js/api.js',
  './js/supabase.js',
  './js/auth.js',
  './js/engine.js',
  './js/chart.js',
  './js/app.js',
  './pay-blank.html',
  './pay-done.html',
  './manifest.json',
  './icons/icon.svg'
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
  event.respondWith(
    fetch(req).then(function (res) {
      if (!res || res.status !== 200 || req.url.indexOf('http') !== 0) return res;
      var copy = res.clone();
      caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
