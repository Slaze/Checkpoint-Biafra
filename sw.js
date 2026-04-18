// CHECKPOINT BIAFRA — Service Worker v1.1
// iOS PWA offline support — no opaque response caching

const CACHE_NAME = 'checkpoint-biafra-v1.1';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
];

// Install: only cache same-origin assets reliably
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS);
    }).catch(err => {
      console.warn('SW install cache failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-origin, network-first for fonts/external
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname.includes('fonts.google') || url.hostname.includes('fonts.gstatic');

  if (isSameOrigin) {
    // Cache-first for game files
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match('./index.html'));
      })
    );
  } else if (isFont) {
    // Network-first for fonts, fall back to cache
    event.respondWith(
      fetch(event.request).then(response => {
        // Only cache valid, non-opaque responses
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
  }
  // All other cross-origin requests: let them pass through naturally
});
