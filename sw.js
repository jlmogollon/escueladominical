// Service worker mínimo para que la PWA sea instalable en Android (Chrome).
const CACHE = 'escueladominical-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request).catch(function () { return caches.match(event.request); }));
});
