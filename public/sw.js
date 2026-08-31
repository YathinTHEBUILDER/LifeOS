const CACHE_NAME = 'lifeos-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/calendar',
  '/tasks',
  '/projects',
  '/habits',
  '/focus',
  '/notes',
  '/review',
  '/settings',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // If navigation request fails, return root cached page
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        })
      );
    })
  );
});
