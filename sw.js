// CHECKPOINT BIAFRA SW v1.23
const CACHE_NAME = 'checkpoint-biafra-v1.23';
const CORE_ASSETS = ['./index.html','./manifest.json','./sw.js','./styles.css','./engine.js','./patch.js','./supervisor.js','./icon-192.png','./icon-512.png','./v20.js','./three-desk.js','./features-v23.js','./version.json'];
function patchHtml(html){
  if(!html||html.indexOf('<html')===-1)return html;
  html=html.replace(/v1\.19/g,'v1.23').replace(/v1\.21/g,'v1.23').replace(/v1\.22/g,'v1.23');
  if(html.indexOf('v20.js')===-1) html=html.replace('</body>','<script src="v20.js?v=1.23"></script></body>');
  if(html.indexOf('three-desk.js')===-1) html=html.replace('</body>','<script src="three-desk.js?v=1.23"></script></body>');
  if(html.indexOf('features-v23.js')===-1) html=html.replace('</body>','<script src="features-v23.js?v=1.23"></script></body>');
  return html;
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE_ASSETS)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin===self.location.origin&&url.pathname.startsWith('/api/')){event.respondWith(fetch(event.request));return;}
  const nav=event.request.mode==='navigate'||(url.origin===self.location.origin&&(url.pathname==='/'||/index\.html$/.test(url.pathname)));
  if(nav&&event.request.method==='GET'){
    event.respondWith(fetch(event.request).then(r=>r.text().then(html=>{
      const h=new Headers(r.headers);h.set('Content-Type','text/html; charset=utf-8');h.set('Cache-Control','no-store');
      return new Response(patchHtml(html),{status:200,headers:h});
    })).catch(()=>caches.match('./index.html')));
    return;
  }
  if(url.origin===self.location.origin){
    event.respondWith(fetch(event.request).then(response=>{
      if(response&&response.status===200&&response.type==='basic'){const c=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,c));}
      return response;
    }).catch(()=>caches.match(event.request)));
  }
});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
