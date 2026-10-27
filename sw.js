const CACHE = 'orolado-v3226';
const ASSETS = [
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
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

// v2607 — Notifications : affichage sur le téléphone (même site fermé) et ouverture du site au toucher.
self.addEventListener('push', function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  var title = String(d.title || 'OROLADO');
  event.waitUntil(self.registration.showNotification(title, {
    body: String(d.body || ''),
    icon: '/icons/icon-192.png?v=2657',
    badge: '/icons/badge-96.png?v=2657',
    tag: String(d.tag || 'oro'),
    vibrate: [80, 40, 80],
    data: { url: String(d.url || '/') }
  }));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  if (url.charAt(0) !== '/' || url.charAt(1) === '/') url = '/';
  var full = new URL(url, self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url && c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
        if (url !== '/' && c.url !== full && 'navigate' in c) { try { c.navigate(full); } catch (e) { /* ignore */ } }
        return c.focus();
      }
    }
    return self.clients.openWindow ? self.clients.openWindow(full) : null;
  }));
});

// Le navigateur renouvelle l'abonnement : on prévient le site (sinon le téléphone ne recevrait plus rien).
self.addEventListener('pushsubscriptionchange', function (event) {
  var opts = event.oldSubscription && event.oldSubscription.options;
  if (!opts) return;
  var ua = (self.navigator && self.navigator.userAgent) || '';
  var plat = /android/i.test(ua) ? 'android' : (/iphone|ipad|ipod|macintosh/i.test(ua) && /mobile/i.test(ua) ? 'ios' : 'pc');
  event.waitUntil(self.registration.pushManager.subscribe(opts).then(function (sub) {
    return fetch('/push.php', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sub', sub: sub.toJSON(), plat: plat, app: 1 }) });
  }).catch(function () { /* ignore */ }));
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = req.url || '';
  // Ne jamais intercepter HTML / CSS / JS : un fallback HTML-as-CSS gèle tous les clics.
  if (req.mode === 'navigate' || /\.(?:html|css|js)(?:\?|$)/i.test(url)) return;
  // Flux de prix / API : toujours le réseau, jamais de cache (sinon des milliers d'entrées).
  if (/\.php(?:\?|$)/i.test(url)) return;
  // v2518 — prix en direct (feedcache/live.json?r=…, adresse différente à chaque lecture) et toute lecture « no-store » :
  // jamais copiés, sinon la mémoire du téléphone grossirait sans fin.
  if (/\/feedcache\//i.test(url) || req.cache === 'no-store') return;
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
