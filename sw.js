// Bumping this version string is what forces browsers to notice the service
// worker itself has changed and go through install/activate again — without
// it, edits to index.html alone can get stuck being served from a stale
// cache indefinitely, since browsers only re-check the SW file byte-for-byte.
const CACHE_NAME = 'ewenesu-carwash-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - App shell (HTML navigations / index.html): NETWORK-FIRST. Always try to
//   get the latest version when online; only fall back to the cached copy
//   when offline. This is what lets future edits show up immediately instead
//   of needing another cache-version bump every time.
// - Everything else (fonts, the xlsx library): CACHE-FIRST, since those
//   rarely change and this keeps the app fast and usable offline.
self.addEventListener('fetch', event => {
  const req = event.request;
  const isAppShell = req.mode === 'navigate' || req.url.endsWith('/index.html') || req.url.endsWith('/');

  if (isAppShell) {
    event.respondWith(
      fetch(req).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (req.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => {});
    })
  );
});
