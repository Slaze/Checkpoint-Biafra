// CHECKPOINT BIAFRA — Service Worker
// Enables full offline play after first load

const CACHE_NAME = 'checkpoint-biafra-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=Noto+Serif:ital,wght@0,400;0,600;1,400&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.map(url => new Request(url, { mode: 'no-cors' })));
    }).catch(() => {
      return caches.open(CACHE_NAME).then(cache => cache.add('./index.html'));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Cache-first for game assets, network-first for fonts
  if (event.request.url.includes('fonts.googleapis') || event.request.url.includes('fonts.gstatic')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
});
