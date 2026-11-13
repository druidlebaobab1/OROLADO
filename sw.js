const CACHE = 'orolado-v3719';
const STATIC = 'orolado-static-1'; // code versionné (?v=…) gardé d'une version à l'autre ; vidé de l'ancien à chaque mise à jour
const STATIC_RE = /\.(?:js|css)\?(?:[^#]*&)?v=[0-9a-f]{3,}(?:[&#]|$)/i;
function typeOk(url, res) {
  var ct = String((res.headers && res.headers.get('content-type')) || '').toLowerCase();
  return /\.css\?/i.test(url) ? ct.indexOf('text/css') >= 0 : (ct.indexOf('javascript') >= 0 || ct.indexOf('ecmascript') >= 0);
}
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
      // 2026-11-09 (revue « site plus léger ») : un NOUVEAU visiteur n'a aucune ancienne version → pas de rechargement
      // (avant : toute la page était téléchargée 2 fois à la toute première visite).
      self.__oroUpgrade = keys.some(function (k) { return /^orolado-v\d+$/.test(k) && k !== CACHE; });
      return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== STATIC; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      // code d'une ANCIENNE version : retiré (garde la mémoire du téléphone petite) — fichiers à empreinte (i18n) gardés au plus 300
      var ver = (CACHE.match(/(\d+)/) || ['', ''])[1];
      return caches.open(STATIC).then(function (c) {
        return c.keys().then(function (ks) {
          var old = ks.filter(function (r) { var m = /[?&]v=(\d{3,5})(?:[&#]|$)/.exec(r.url); return m && ver && m[1] !== ver; });
          var rest = ks.filter(function (r) { return old.indexOf(r) < 0; });
          if (rest.length > 300) old = old.concat(rest.slice(0, rest.length - 300));
          return Promise.all(old.map(function (r) { return c.delete(r); }));
        });
      }).catch(function () { /* ignore */ });
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      if (!self.__oroUpgrade) return;
      // 2026-11-02 (propriétaire : « rien ne change, c'est toujours pareil ») : quand une NOUVELLE version prend
      // la main, le service worker force lui-même les fenêtres ouvertes à charger le HTML frais (?swv=<version>).
      // Fiable même si l'app.js en cache est ancien (le navigateur revalide toujours sw.js). Le paramètre swv évite
      // toute boucle : on ne renavigue qu'une fois par version et par fenêtre.
      // 2026-11-13 (propriétaire : « le chargement finit presque, puis ça recommence ») : la page est TOUJOURS chargée fraîche
      // (HTML / JS / CSS ne passent pas par ce service worker) → plus de rechargement forcé de toutes les fenêtres. On prévient
      // seulement les pages ; une page vraiment plus ancienne (ouverte avant la mise à jour) se recharge elle-même, une fois.
      var ver = (CACHE.match(/(\d+)/) || ['', ''])[1];
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
        list.forEach(function (c) { try { c.postMessage({ t: 'oro-ver', v: Number(ver) || 0 }); } catch (e) { /* ignore */ } });
      });
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
  // 2026-11-13 (propriétaire : « vieux téléphones : c'est lent ») : le serveur interdit au téléphone de garder le code
  // (no-cache) → à chaque ouverture, ~40 fichiers revérifiés un par un. Un fichier JS / CSS VERSIONNÉ (?v=3713, ou empreinte)
  // ne change jamais à la même adresse → il est gardé ici et resservi tout de suite. Sûr : seulement une vraie réponse 200
  // du bon type (jamais de HTML à la place d'un CSS), aucune réponse de secours inventée ; nouvelle version = nouvelle adresse.
  if (req.mode !== 'navigate' && STATIC_RE.test(url) && url.indexOf(self.location.origin) === 0 && !/\/sw\.js/i.test(url)) {
    event.respondWith(caches.open(STATIC).then(function (cache) {
      return cache.match(req).then(function (hit) {
        if (hit && typeOk(url, hit)) return hit;
        return fetch(req).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic' && typeOk(url, res)) { try { cache.put(req, res.clone()); } catch (eP) { /* ignore */ } }
          return res;
        });
      });
    }).catch(function () { return fetch(req); }));
    return;
  }
  // Ne jamais intercepter HTML / CSS / JS non versionnés : un fallback HTML-as-CSS gèle tous les clics.
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
