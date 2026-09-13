// CHECKPOINT BIAFRA — Service Worker v1.30
// Network-first for app shell so ships/fixes actually reach players.
// Cache fallback keeps offline play after first successful load.
// /api/* is never cached (auth session cookies).

const CACHE_NAME = 'checkpoint-biafra-v1.30';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './sw.js',
  './styles.css',
  './engine.js',
  './patch.js',
  './patch-gameplay.js',
  './supervisor.js',
  './icon-192.png',
  './icon-512.png',
  './v20.js',
  './desk-v22.js',
  './three-desk.js',
  './features-v23.js',
  './booth-v30.js',
  './hands-male.png',
  './desk-wood.jpg',
  './version.json',
];

function patchHtml(html) {
  if (!html || html.indexOf('<html') === -1) return html;
  html = html
    .replace(/v1\.(1[9]|2[0-9])/g, 'v1.30')
    .replace(/\?v=1\.(1[9]|2[0-9])/g, '?v=1.30');
  return html;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((err) => {
        console.warn('SW install cache failed:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isFont =
    url.hostname.includes('fonts.google') || url.hostname.includes('fonts.gstatic');
  const isApi = isSameOrigin && url.pathname.startsWith('/api/');

  if (isApi) {
    event.respondWith(fetch(event.request));
    return;
  }

  const nav =
    event.request.mode === 'navigate' ||
    (isSameOrigin && (url.pathname === '/' || /index\.html$/.test(url.pathname)));

  if (nav && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((r) =>
          r.text().then((html) => {
            const h = new Headers(r.headers);
            h.set('Content-Type', 'text/html; charset=utf-8');
            h.set('Cache-Control', 'no-store');
            return new Response(patchHtml(html), { status: 200, headers: h });
          })
        )
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
        )
    );
  } else if (isFont) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
