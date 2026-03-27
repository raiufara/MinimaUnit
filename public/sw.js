const SHELL_CACHE = 'minimaunit-smart-converter-shell-v4';
const RUNTIME_CACHE = 'minimaunit-smart-converter-runtime-v4';
const APP_SHELL = [
  '/',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-tiny.svg',
  '/manifest.webmanifest',
  '/logo-full.svg',
  '/logo-full-dark.svg',
  '/logo-mark.svg',
  '/logo-mark-dark.svg',
  '/logo-mark-light.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/og-card.svg',
  '/robots.txt'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
    ])
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function cacheResponse(cacheName, request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return response;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
}

async function handleNavigate(request) {
  try {
    const response = await fetch(request);
    await cacheResponse(SHELL_CACHE, '/', response.clone());
    return response;
  } catch {
    const cachedShell = await caches.match('/');
    if (cachedShell) {
      return cachedShell;
    }
    throw new Error('NAVIGATION_FALLBACK_MISSING');
  }
}

async function handleImmutableAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  return cacheResponse(RUNTIME_CACHE, request, response);
}

async function handleSameOriginStatic(request) {
  try {
    const response = await fetch(request);
    return cacheResponse(SHELL_CACHE, request, response);
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw new Error('STATIC_FALLBACK_MISSING');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Keep third-party requests, including currency rate fetches, outside the SW cache.
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(handleImmutableAsset(request));
    return;
  }

  event.respondWith(handleSameOriginStatic(request));
});
