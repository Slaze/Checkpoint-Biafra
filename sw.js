// CHECKPOINT BIAFRA — Service Worker v2
// Full offline PWA for iOS Safari home screen install

const CACHE = 'checkpoint-biafra-v2';
const CORE = [
  './',
  './index.html',
  './manifest.json',
];

// Install: cache core assets immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(CORE).catch(() => cache.add('./index.html'));
    }).then(() => self.skipWaiting())
  );
});

// Activate: purge old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app shell, network-first for fonts/YouTube
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept YouTube/Google API calls — music must go to network
  if (url.includes('youtube.com') || url.includes('ytimg.com') || url.includes('googlevideo.com')) {
    return;
  }

  // Fonts: stale-while-revalidate
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fresh = fetch(e.request).then(r => { cache.put(e.request, r.clone()); return r; });
          return cached || fresh;
        })
      )
    );
    return;
  }

  // App shell: cache-first, fallback to network, fallback to index.html
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Only cache valid same-origin responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// Background sync — re-cache on reconnect
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
