// A-TWENTY SIX TRADING - Driver App Service Worker
// Provides offline caching for driver assets, maps, and offline status sync

const CACHE_NAME = 'a26-driver-app-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install: precache critical shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for data, cache-first for static assets with offline fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For API or live tile polling, attempt network first
  if (url.pathname.startsWith('/api') || url.hostname.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ offline: true, error: 'Network unavailable' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // For app assets & pages, try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Default offline page fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Network offline. Cached asset not available.', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});
