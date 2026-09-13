/* v1.30 loader — illustrated desk + booth uniqueness */
(function(){
  function add(src, mod){
    var sel='script[src^="'+src.split('?')[0]+'"]';
    if(document.querySelector(sel)) return;
    var s=document.createElement('script');
    s.src=src;
    if(mod) s.type='module';
    document.head.appendChild(s);
  }
  function boot(){
    add('desk-v22.js?v=1.30', false);
    add('features-v23.js?v=1.30', false);
    add('booth-v30.js?v=1.30', false);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
