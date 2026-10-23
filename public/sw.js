// Cache purger and live pass-through Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
  );
});

// Always fetch directly from network without caching stale HTML/JS bundles
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
