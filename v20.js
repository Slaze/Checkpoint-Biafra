/* loader v1.23 */
(function(){
  function add(src){if(document.querySelector('script[src^="'+src.split('?')[0]+'"]'))return;var s=document.createElement('script');s.src=src;document.head.appendChild(s);}
  function boot(){add('three-desk.js?v=1.23');add('features-v23.js?v=1.23');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
