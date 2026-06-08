const CACHE_NAME = 'onefundz-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: Cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up prior old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache storage:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Intercept and Strategies
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Skip cross-origin or non-GET requests
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle local application news API or auth APIs with Network-First strategy
  if (req.url.includes('/api/')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // Put clone into cache for fallback
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(req);
        })
    );
    return;
  }

  // Standard static asset handling: Cache-first falling back to Network strategy
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback to /index.html for SPAs when router requests are encountered
        if (req.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
