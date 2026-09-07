// CHECKPOINT BIAFRA — Service Worker v1.21
const CACHE_NAME = 'checkpoint-biafra-v1.21';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './sw.js',
  './styles.css',
  './engine.js',
  './patch.js',
  './supervisor.js',
  './icon-192.png',
  './icon-512.png',
  './v20.js',
  './version.json',
];

function patchHtml(html) {
  if (!html || html.indexOf('<html') === -1) return html;
  var skin = {
    '#e8c4a0': '#6b3d28',
    '#d4a574': '#5a3222',
    '#c4925e': '#4a281c',
    '#a87848': '#3a1e16',
    '#f5e6d8': '#c9a090',
    '#e0c8b0': '#a87868'
  };
  Object.keys(skin).forEach(function (old) {
    html = html.split(old).join(skin[old]);
  });
  html = html.replace(/v1\.19/g, 'v1.21');
  html = html.replace(/\?v=1\.19/g, '?v=1.21');
  html = html.replace(/>3,400 notes</g, '>₦3,400<');
  html = html.replace(/\u20a4B \/ notes/g, '₤B / ₦');
  html = html.replace(/>\u20a4B \/ NOTES</g, '>₤B / NAIRA<');
  if (html.indexOf('v20.js?v=1.21') === -1) {
    html = html.replace('</body>', '<script src="v20.js?v=1.21"></script></body>');
  }
  if (html.indexOf('id="v21-skin"') === -1) {
    html = html.replace('</head>', '<style id="v21-skin">#eod-report{padding-top:max(22px,env(safe-area-inset-top,0px))!important;max-height:100dvh;overflow-y:auto}body.doc-inspecting .pov-hand{opacity:.32}</style></head>');
  }
  return html;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(function () {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApi = isSameOrigin && url.pathname.startsWith('/api/');
  const isHtml = isSameOrigin && event.request.mode === 'navigate' ||
    (isSameOrigin && (url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')));

  if (isApi) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (isHtml && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request).then(function (response) {
        return response.text().then(function (html) {
          var out = patchHtml(html);
          var headers = new Headers(response.headers);
          headers.set('Content-Type', 'text/html; charset=utf-8');
          headers.set('Cache-Control', 'no-store');
          return new Response(out, { status: 200, headers: headers });
        });
      }).catch(function () {
        return caches.match('./index.html').then(function (cached) {
          if (!cached) return caches.match('./index.html');
          return cached.text().then(function (html) {
            return new Response(patchHtml(html), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
          });
        });
      })
    );
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
  }
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
