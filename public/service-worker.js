const CACHE_NAME = 'propmanage-shell-v1';
const SHELL_FILES = ['/', '/manifest.webmanifest', '/favicon.svg', '/pwa-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('propmanage-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never cache authenticated APIs, uploaded files, or Vite development internals.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/@')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match('/')) || Response.error()),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })),
    );
    return;
  }

  if (SHELL_FILES.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
