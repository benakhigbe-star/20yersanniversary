// Minimal service worker: enables "Add to Home Screen" installability and
// caches static assets. Deliberately network-first for everything else —
// this app's content (announcements, deadlines, responses) changes often,
// so aggressively caching pages would show guests stale data.
const CACHE_NAME = 'cruise-party-static-v1';
const STATIC_ASSETS = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isStaticAsset = STATIC_ASSETS.some((p) => url.pathname === p);

  if (isStaticAsset) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }

  // Network-first for everything else (pages + API), so guests always see
  // fresh announcements/deadlines while online.
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
