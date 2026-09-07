/* v1.24 live boot — index.html already includes this file */
(function () {
  if (window.__cbLiveBoot) return;
  window.__cbLiveBoot = true;
  function add(src, mod) {
    if (document.querySelector('script[src^="' + src.split('?')[0] + '"]')) return;
    var s = document.createElement('script');
    s.src = src;
    if (mod) s.type = 'module';
    document.head.appendChild(s);
  }
  add('https://raw.githubusercontent.com/Slaze/Checkpoint-Biafra/ae33cb5e20a0c0b677f34806ab91dd2192c651f7/patch.js', false);
  add('features-v23.js?v=1.24', false);
  add('three-desk.js?v=1.24', true);
})();
