// CHECKPOINT BIAFRA — Service Worker v1.22
const CACHE_NAME = 'checkpoint-biafra-v1.22';
const CORE_ASSETS = ['./index.html','./manifest.json','./sw.js','./styles.css','./engine.js','./patch.js','./supervisor.js','./icon-192.png','./icon-512.png','./v20.js','./desk-v22.js','./version.json'];

function patchHtml(html) {
  if (!html || html.indexOf('<html') === -1) return html;
  html = html.replace(/v1\.19/g, 'v1.22').replace(/v1\.21/g, 'v1.22');
  html = html.replace(/\?v=1\.19/g, '?v=1.22');
  if (html.indexOf('v20.js') === -1) html = html.replace('</body>', '<script src="v20.js?v=1.22"></script></body>');
  if (html.indexOf('desk-v22.js') === -1) html = html.replace('</body>', '<script src="desk-v22.js?v=1.22"></script></body>');
  return html;
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)).catch(function(){}));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request)); return;
  }
  const nav = event.request.mode === 'navigate' || (url.origin === self.location.origin && (url.pathname === '/' || /index\.html$/.test(url.pathname)));
  if (nav && event.request.method === 'GET') {
    event.respondWith(fetch(event.request).then(r => r.text().then(html => {
      var h = new Headers(r.headers); h.set('Content-Type','text/html; charset=utf-8'); h.set('Cache-Control','no-store');
      return new Response(patchHtml(html), {status:200, headers:h});
    })).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(fetch(event.request).then(response => {
      if (response && response.status === 200 && response.type === 'basic') {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request)));
  }
});
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
