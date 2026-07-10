const CACHE_NAME = 'ai-platform-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Fetch: cache-first for local, network-first for CDN/API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Local assets: cache-first
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return resp;
      }))
    );
    return;
  }

  // CDN libraries: cache with network fallback
  if (url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('cdnjs.cloudflare.com')) {
    e.respondWith(
      caches.match(e.request).then(r => {
        const fetchPromise = fetch(e.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return resp;
        }).catch(() => r);
        return r || fetchPromise;
      })
    );
    return;
  }

  // API calls: network only
  e.respondWith(fetch(e.request));
});
