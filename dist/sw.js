const CACHE_NAME = 'minimaunit-smart-converter-v2';
const APP_SHELL = [
  '/',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-tiny.svg',
  '/manifest.webmanifest',
  '/logo-full.svg',
  '/logo-mark.svg',
  '/logo-mark-dark.svg',
  '/logo-mark-light.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/og-card.svg',
  '/robots.txt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match('/'));
    })
  );
});
